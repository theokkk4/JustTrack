import { parseAuthLink } from '../authLink';

describe('parseAuthLink', () => {
  it('reads implicit-flow tokens from the fragment', () => {
    const result = parseAuthLink(
      'justtrack://auth-callback#access_token=abc.def&expires_in=3600&refresh_token=r3fr35h&token_type=bearer&type=signup'
    );
    expect(result).toEqual({ accessToken: 'abc.def', refreshToken: 'r3fr35h', code: undefined, type: 'signup', error: undefined });
  });

  it('identifies password-recovery links', () => {
    expect(parseAuthLink('justtrack://auth-callback#access_token=a&refresh_token=b&type=recovery').type).toBe('recovery');
  });

  it('reads a PKCE code from the query string', () => {
    expect(parseAuthLink('justtrack://auth-callback?code=xyz-123').code).toBe('xyz-123');
  });

  it('decodes error descriptions, including + as a space', () => {
    const result = parseAuthLink(
      'justtrack://auth-callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    );
    expect(result.error).toBe('Email link is invalid or has expired');
  });

  it('works with Expo Go style URLs', () => {
    const result = parseAuthLink('exp://192.168.1.5:8081/--/auth-callback#access_token=t&refresh_token=r');
    expect(result.accessToken).toBe('t');
    expect(result.refreshToken).toBe('r');
  });

  it('returns empty params for a plain link', () => {
    expect(parseAuthLink('justtrack://auth-callback')).toEqual({
      accessToken: undefined,
      refreshToken: undefined,
      code: undefined,
      type: undefined,
      error: undefined,
    });
  });
});
