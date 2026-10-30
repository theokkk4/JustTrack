import { parseMealAnalysis } from '@/lib/scan/analysis';
import type { MealAnalysis } from '@/types';

/**
 * Talks to the app's own /api/analyze-meal function (hosted alongside the
 * web app), which holds the AI key. The app never calls the model directly.
 */

/** Empty on the web, where the API shares the app's origin; set for native builds. */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export class ScanError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ScanError';
  }
}

export async function analyzeMealPhoto(image: { base64: string; mediaType: string }, signal?: AbortSignal): Promise<MealAnalysis> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/analyze-meal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: image.base64, mediaType: image.mediaType }),
      signal,
    });
  } catch {
    throw new ScanError('network', 'You appear to be offline. Check your connection and try again.');
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = typeof body === 'object' && body !== null ? (body as { error?: { code?: unknown; message?: unknown } }).error : undefined;
    const code = typeof error?.code === 'string' ? error.code : 'http_error';
    const message = typeof error?.message === 'string' ? error.message : 'The photo scanner had a problem. Please try again.';
    throw new ScanError(code, message);
  }

  const analysis = parseMealAnalysis(body);
  if (!analysis) throw new ScanError('bad_response', 'The photo scanner sent back something we couldn’t read. Please try again.');
  return analysis;
}
