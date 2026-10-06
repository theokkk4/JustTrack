import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { HttpError } from './http.ts';

/**
 * Reads a key from the new JSON-map env var (SUPABASE_SECRET_KEYS etc.),
 * falling back to the legacy single-key variable.
 */
function projectKey(mapVar: string, legacyVar: string): string {
  const raw = Deno.env.get(mapVar);
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, string>;
      if (keys.default) return keys.default;
    } catch {
      // Malformed map: try the legacy variable.
    }
  }
  const legacy = Deno.env.get(legacyVar);
  if (legacy) return legacy;
  throw new Error(`Neither ${mapVar} nor ${legacyVar} is set.`);
}

function supabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new Error('SUPABASE_URL is not set.');
  return url;
}

/** Bypasses row level security — only for server-owned tables like the FatSecret cache. */
export function adminClient(): SupabaseClient {
  return createClient(supabaseUrl(), projectKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Every function here spends a shared FatSecret/AI quota, so each request
 * must come from a signed-in JustTrack user.
 */
export async function requireUser(req: Request): Promise<{ id: string }> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!token) {
    throw new HttpError(401, 'unauthorized', 'Sign in to use this feature.');
  }

  const client = createClient(supabaseUrl(), projectKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    throw new HttpError(401, 'unauthorized', 'Your session has expired. Please sign in again.');
  }
  return { id: data.user.id };
}
