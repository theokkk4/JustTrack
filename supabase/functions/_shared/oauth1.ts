/**
 * OAuth 1.0 request signing (HMAC-SHA1), as FatSecret's server.api expects.
 * Pure Web Crypto with no Deno APIs, so it's unit-testable against the
 * published OAuth test vectors.
 */

/** RFC 3986 percent-encoding. encodeURIComponent leaves !'()* alone, OAuth doesn't. */
export function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** Sorted by encoded name, then encoded value, joined as `name=value&…`. */
export function normalizeParameters(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => [percentEncode(key), percentEncode(value)] as const)
    .sort(([keyA, valueA], [keyB, valueB]) => (keyA === keyB ? compare(valueA, valueB) : compare(keyA, keyB)))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function compare(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function signatureBaseString(method: string, url: string, params: Record<string, string>): string {
  return [method.toUpperCase(), percentEncode(url), percentEncode(normalizeParameters(params))].join('&');
}

/** base64(HMAC-SHA1(consumerSecret&tokenSecret, baseString)). Two-legged calls leave the token secret empty. */
export async function hmacSha1Signature(baseString: string, consumerSecret: string, tokenSecret = ''): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(baseString)));
  return btoa(String.fromCharCode(...signature));
}

/** A random nonce; FatSecret rejects reuse within its timestamp window. */
export function createNonce(): string {
  return crypto.randomUUID().replaceAll('-', '');
}

/**
 * Returns the full, signed query for a two-legged GET: the caller's params plus
 * oauth_consumer_key, oauth_nonce, oauth_signature_method, oauth_timestamp,
 * oauth_version, and oauth_signature.
 */
export async function signRequest(options: {
  method: 'GET' | 'POST';
  url: string;
  params: Record<string, string>;
  consumerKey: string;
  consumerSecret: string;
  nonce?: string;
  timestamp?: number;
}): Promise<Record<string, string>> {
  const oauthParams: Record<string, string> = {
    ...options.params,
    oauth_consumer_key: options.consumerKey,
    oauth_nonce: options.nonce ?? createNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(options.timestamp ?? Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
  };
  const signature = await hmacSha1Signature(signatureBaseString(options.method, options.url, oauthParams), options.consumerSecret);
  return { ...oauthParams, oauth_signature: signature };
}

/** Encodes params the same way they were signed, so the server sees identical values. */
export function encodeQuery(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
    .join('&');
}
