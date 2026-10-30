import { parseMealAnalysis } from '@/lib/scan/analysis';
import { ScanError } from '@/lib/scan/errors';
import { analyzeWithGemini, directApiKey } from '@/lib/scan/geminiDirect';
import type { MealAnalysis } from '@/types';

export { ScanError };

/**
 * Two ways to the model, same result either way:
 * - A build made with EXPO_PUBLIC_GEMINI_API_KEY (TestFlight, personal builds)
 *   asks Gemini directly from the device.
 * - Otherwise the app calls its own /api/analyze-meal function (hosted with
 *   the web app), which holds the key server-side.
 */

/** Empty on the web, where the API shares the app's origin; set for native builds. */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

const UNREADABLE = 'The photo scanner sent back something we couldn’t read. Please try again.';

async function analyzeViaServer(image: { base64: string; mediaType: string }, signal?: AbortSignal): Promise<unknown> {
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
  return body;
}

export async function analyzeMealPhoto(image: { base64: string; mediaType: string }, signal?: AbortSignal): Promise<MealAnalysis> {
  const apiKey = directApiKey();
  const raw = apiKey ? await analyzeWithGemini(image, apiKey, signal) : await analyzeViaServer(image, signal);
  const analysis = parseMealAnalysis(raw);
  if (!analysis) throw new ScanError('bad_response', UNREADABLE);
  return analysis;
}
