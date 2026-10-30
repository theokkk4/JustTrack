/** The names the Gemini key is commonly saved under; surrounding quotes or spaces from a paste are forgiven. */
const KEY_NAMES = ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'GEMINI_KEY'] as const;

export function readApiKey(): string | null {
  for (const name of KEY_NAMES) {
    const value = process.env[name]?.trim().replace(/^["']|["']$/g, '');
    if (value) return value;
  }
  return null;
}

export { DEFAULT_GEMINI_MODEL as DEFAULT_MODEL } from '../../lib/scan/geminiPrompt';
