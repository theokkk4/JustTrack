import { ScanError } from '@/lib/scan/errors';
import { DEFAULT_GEMINI_MODEL, RESPONSE_SCHEMA, SCAN_QUESTION, SYSTEM_PROMPT } from '@/lib/scan/geminiPrompt';

/**
 * The on-device scanner: the app calls Gemini itself when a build was made
 * with EXPO_PUBLIC_GEMINI_API_KEY (set as an EAS environment variable, never
 * in a file). Anyone who unpacks such a build can read that key, so this
 * exists for TestFlight and personal builds; the public web app keeps using
 * the server function, where the key stays private. Photos are sent with
 * storage off and are not kept by Google.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

function clean(value: string | undefined): string {
  return value?.trim().replace(/^["']|["']$/g, '') ?? '';
}

/** The key baked into this build, if any. Read at call time so tests can set it. */
export function directApiKey(): string | null {
  return clean(process.env.EXPO_PUBLIC_GEMINI_API_KEY) || null;
}

export function directModel(): string {
  return clean(process.env.EXPO_PUBLIC_GEMINI_MODEL) || DEFAULT_GEMINI_MODEL;
}

interface InteractionResponse {
  status?: string;
  steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
  error?: { code?: number; status?: string; message?: string };
}

/** The model's text reply: the last `model_output` step's text parts joined. */
export function outputText(body: InteractionResponse): string {
  const outputs = (body.steps ?? []).filter((step) => step.type === 'model_output');
  const last = outputs[outputs.length - 1];
  return (last?.content ?? [])
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('');
}

/** Asks Gemini directly and returns its parsed JSON reply, or throws a ScanError. */
export async function analyzeWithGemini(image: { base64: string; mediaType: string }, apiKey: string, signal?: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        model: directModel(),
        system_instruction: SYSTEM_PROMPT,
        input: [
          { type: 'image', data: image.base64, mime_type: image.mediaType },
          { type: 'text', text: SCAN_QUESTION },
        ],
        response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
        store: false,
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ScanError('network', 'You appear to be offline. Check your connection and try again.');
  }

  const body = (await response.json().catch(() => null)) as InteractionResponse | null;
  if (!response.ok) {
    const message = body?.error?.message ?? '';
    if (response.status === 401 || response.status === 403) {
      throw new ScanError('not_configured', 'This build’s AI key was rejected. Install the latest build or check the key in EAS.');
    }
    if (response.status === 429) {
      throw new ScanError('rate_limited', 'The photo scanner is busy right now. Try again in a minute.');
    }
    if (response.status === 400 && /safety|blocked|prohibited/i.test(message)) {
      throw new ScanError('declined', 'We couldn’t analyze that photo. Try a clearer shot of the food itself.');
    }
    throw new ScanError('upstream_error', 'The photo scanner had a problem. Please try again.');
  }

  const text = body ? outputText(body) : '';
  try {
    return JSON.parse(text);
  } catch {
    throw new ScanError('bad_response', 'The photo scanner sent back something we couldn’t read. Please try again.');
  }
}
