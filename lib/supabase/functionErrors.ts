/**
 * Errors from JustTrack's Edge Functions. Every function answers failures
 * with `{ error: { code, message } }` where the message is written for the
 * user, so the app can show it as-is and branch on the stable code.
 */
export class FunctionCallError extends Error {
  constructor(
    readonly code: string,
    message: string,
    /** HTTP status, or null when the request never got a response. */
    readonly status: number | null
  ) {
    super(message);
    this.name = 'FunctionCallError';
  }
}

export const OFFLINE_MESSAGE = 'You appear to be offline. Check your connection and try again.';

/** Builds the error for a non-2xx function response from its (possibly unparseable) JSON body. */
export function functionErrorFromBody(status: number, body: unknown): FunctionCallError {
  const error = typeof body === 'object' && body !== null ? (body as { error?: unknown }).error : undefined;
  if (typeof error === 'object' && error !== null) {
    const { code, message } = error as { code?: unknown; message?: unknown };
    if (typeof code === 'string' && typeof message === 'string' && message.length > 0) {
      return new FunctionCallError(code, message, status);
    }
  }
  if (status === 401) return new FunctionCallError('unauthorized', 'Your session has expired. Please sign in again.', status);
  if (status === 404) return new FunctionCallError('function_missing', 'This feature isn’t available on the server yet.', status);
  return new FunctionCallError('http_error', 'Something went wrong on our end. Please try again.', status);
}

export function isFunctionCallError(error: unknown, code?: string): error is FunctionCallError {
  return error instanceof FunctionCallError && (code === undefined || error.code === code);
}
