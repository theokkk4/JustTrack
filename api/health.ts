import { DEFAULT_MODEL, readApiKey } from './_shared/apiKey';

/**
 * GET /api/health — is the photo scanner configured on this deployment?
 * Says only whether a key is present, never what it is, so it's safe to
 * open in a browser while setting Vercel up.
 */
export async function GET(): Promise<Response> {
  const configured = readApiKey() !== null;
  return new Response(
    JSON.stringify({
      ok: true,
      scanner: configured ? 'configured' : 'missing_key',
      model: process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
      hint: configured ? null : 'Add GEMINI_API_KEY under Vercel → Project → Settings → Environment Variables, tick Production and Preview, then Deployments → Redeploy.',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  );
}
