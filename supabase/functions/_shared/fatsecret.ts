import { HttpError } from './http.ts';
import { encodeQuery, signRequest } from './oauth1.ts';

const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const REST_BASE = 'https://platform.fatsecret.com/rest';
const SERVER_API_URL = `${REST_BASE}/server.api`;

export type FatSecretScope = 'basic' | 'barcode';

/** Every call has two spellings: a method name for OAuth 1.0's server.api, and a path for OAuth 2.0. */
export interface FatSecretEndpoint {
  method: string;
  path: string;
  scope: FatSecretScope;
}

export const Endpoints = {
  searchFoods: { method: 'foods.search', path: 'foods/search/v1', scope: 'basic' },
  getFood: { method: 'food.get.v5', path: 'food/v5', scope: 'basic' },
  /** Premier-only. */
  findByBarcode: { method: 'food.find_id_for_barcode.v2', path: 'food/barcode/find-by-id/v2', scope: 'barcode' },
} as const satisfies Record<string, FatSecretEndpoint>;

type Credentials =
  | { kind: 'oauth1'; consumerKey: string; consumerSecret: string }
  | { kind: 'oauth2'; clientId: string; clientSecret: string };

/**
 * OAuth 1.0 wins when its secret is set: FatSecret only IP-restricts OAuth 2.0,
 * and Edge Functions don't have fixed egress IPs. The Consumer Key is the same
 * value as the Client ID; the Consumer Secret is not the Client Secret.
 */
function credentials(): Credentials {
  const id = Deno.env.get('FATSECRET_CLIENT_ID');
  const consumerSecret = Deno.env.get('FATSECRET_CONSUMER_SECRET');
  const clientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET');
  if (id && consumerSecret) return { kind: 'oauth1', consumerKey: id, consumerSecret };
  if (id && clientSecret) return { kind: 'oauth2', clientId: id, clientSecret };
  throw new HttpError(503, 'not_configured', 'Food search isn’t set up yet — the server is missing its FatSecret credentials.');
}

// OAuth 2.0 tokens last 24h; keep them for the life of this function instance.
const tokenCache = new Map<FatSecretScope, { value: string; expiresAt: number }>();

async function getAccessToken(scope: FatSecretScope, clientId: string, clientSecret: string): Promise<string> {
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAt - 60_000 > Date.now()) return cached.value;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope }),
  });
  const body = (await response.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null;

  if (!response.ok || !body?.access_token) {
    console.error('FatSecret token request failed', response.status, body?.error);
    if (body?.error === 'invalid_scope') {
      throw new HttpError(403, 'missing_scope', 'This FatSecret API key doesn’t include that feature.');
    }
    if (body?.error === 'invalid_client') {
      throw new HttpError(503, 'not_configured', 'The server’s FatSecret credentials were rejected.');
    }
    throw new HttpError(
      502,
      'upstream_auth_failed',
      'Couldn’t connect to the food database. If this keeps happening, check the FatSecret key’s IP allow-list.'
    );
  }

  tokenCache.set(scope, { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 });
  return body.access_token;
}

async function buildRequest(
  endpoint: FatSecretEndpoint,
  params: Record<string, string>,
  creds: Credentials
): Promise<{ url: string; headers: Record<string, string> }> {
  if (creds.kind === 'oauth1') {
    const signed = await signRequest({
      method: 'GET',
      url: SERVER_API_URL,
      params: { ...params, method: endpoint.method, format: 'json' },
      consumerKey: creds.consumerKey,
      consumerSecret: creds.consumerSecret,
    });
    return { url: `${SERVER_API_URL}?${encodeQuery(signed)}`, headers: {} };
  }

  const token = await getAccessToken(endpoint.scope, creds.clientId, creds.clientSecret);
  const url = new URL(`${REST_BASE}/${endpoint.path}`);
  url.searchParams.set('format', 'json');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return { url: url.toString(), headers: { Authorization: `Bearer ${token}` } };
}

/** Maps FatSecret's documented error codes to app-facing errors. */
export function fatSecretError(code: number): HttpError {
  switch (code) {
    case 5:
    case 8:
      return new HttpError(503, 'not_configured', 'The server’s FatSecret credentials were rejected.');
    case 11:
    case 12:
      return new HttpError(429, 'rate_limited', 'The food database is busy right now. Try again in a little while.');
    case 14:
      return new HttpError(403, 'missing_scope', 'This FatSecret API key doesn’t include that feature.');
    case 20:
      return new HttpError(503, 'upstream_unavailable', 'The food database is temporarily unavailable. Please try again soon.');
    case 21:
      return new HttpError(502, 'ip_not_allowed', 'The food database rejected this server’s address. Check the FatSecret key’s IP allow-list.');
    case 101:
    case 107:
      return new HttpError(400, 'bad_request', 'That request wasn’t valid.');
    // 106 is "Invalid ID" (e.g. a food FatSecret has since removed); 211 is an unknown barcode.
    case 106:
    case 211:
      return new HttpError(404, 'not_found', 'We couldn’t find that food.');
    default:
      return new HttpError(502, 'upstream_error', 'The food database had a problem. Please try again.');
  }
}

/** Codes worth one immediate retry: an expired OAuth 2.0 token, or a stale OAuth 1.0 timestamp/nonce. */
const RETRYABLE_CODES = new Set([6, 7, 13]);

/** Calls a FatSecret endpoint with whichever OAuth flavor is configured. */
export async function fatsecretGet(endpoint: FatSecretEndpoint, params: Record<string, string>): Promise<unknown> {
  const creds = credentials();
  for (let attempt = 0; attempt < 2; attempt++) {
    const { url, headers } = await buildRequest(endpoint, params, creds);
    const response = await fetch(url, { headers });
    const body = (await response.json().catch(() => null)) as { error?: { code?: unknown; message?: unknown } } | null;

    if (body?.error) {
      const code = Number(body.error.code);
      if (RETRYABLE_CODES.has(code) && attempt === 0) {
        tokenCache.delete(endpoint.scope);
        continue;
      }
      if (code !== 106 && code !== 211) console.error('FatSecret API error', endpoint.method, code, body.error.message);
      throw fatSecretError(code);
    }
    if (!response.ok || body === null) {
      console.error('FatSecret API HTTP error', endpoint.method, response.status);
      throw new HttpError(502, 'upstream_error', 'The food database had a problem. Please try again.');
    }
    return body;
  }
  throw new HttpError(502, 'upstream_auth_failed', 'Couldn’t authenticate with the food database.');
}
