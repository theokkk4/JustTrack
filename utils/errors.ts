const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email and password don’t match. Check them and try again.',
  email_not_confirmed: 'Confirm your email first — check your inbox for the link we sent.',
  user_already_exists: 'An account with this email already exists. Try signing in instead.',
  email_exists: 'An account with this email already exists. Try signing in instead.',
  weak_password: 'Choose a stronger password — at least 8 characters.',
  email_address_invalid: 'That doesn’t look like a valid email address.',
  over_email_send_rate_limit: 'Too many emails sent just now. Wait a few minutes and try again.',
  over_request_rate_limit: 'Too many attempts. Wait a moment and try again.',
  signup_disabled: 'New sign-ups are turned off right now.',
  otp_expired: 'That link has expired. Request a new one and try again.',
};

function readCode(error: object): string | undefined {
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

/** A message that's safe and useful to show the user, whatever was thrown. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (typeof error === 'object' && error !== null) {
    const code = readCode(error);
    if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];

    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      if (/network request failed|failed to fetch|network error/i.test(message)) {
        return 'You appear to be offline. Check your connection and try again.';
      }
      if (message.length > 0 && message.length < 160) return message;
    }
  }
  return fallback;
}

export function isNetworkError(error: unknown): boolean {
  const message = typeof error === 'object' && error !== null ? (error as { message?: unknown }).message : undefined;
  return typeof message === 'string' && /network request failed|failed to fetch|network error/i.test(message);
}
