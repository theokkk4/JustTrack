/** A scanner failure with a stable code the review screen can key off (network, rate_limited, declined, …). */
export class ScanError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ScanError';
  }
}
