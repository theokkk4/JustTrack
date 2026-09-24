export interface AuthLinkParams {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  type?: string;
  error?: string;
}

/**
 * Pulls Supabase auth parameters out of a deep link. Implicit-flow links put
 * them in the #fragment, PKCE and error links use the ?query — read both.
 */
export function parseAuthLink(url: string): AuthLinkParams {
  const params = new Map<string, string>();
  const collect = (part: string | undefined) => {
    if (!part) return;
    for (const pair of part.split('&')) {
      const [rawKey, ...rest] = pair.split('=');
      if (!rawKey) continue;
      const value = rest.join('=');
      try {
        params.set(decodeURIComponent(rawKey), decodeURIComponent(value.replace(/\+/g, ' ')));
      } catch {
        params.set(rawKey, value);
      }
    }
  };

  const [beforeHash, hash] = url.split('#', 2);
  collect(beforeHash?.split('?', 2)[1]);
  collect(hash);

  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    code: params.get('code'),
    type: params.get('type'),
    error: params.get('error_description') ?? params.get('error'),
  };
}
