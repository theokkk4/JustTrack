export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** An error that's safe to show to the app: a status, a stable code, and a user-facing message. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ error: { code: error.code, message: error.message } }, error.status);
  }
  console.error(error);
  return json({ error: { code: 'internal', message: 'Something went wrong on our end. Please try again.' } }, 500);
}

export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  if (req.method !== 'POST') {
    throw new HttpError(405, 'method_not_allowed', 'Use POST.');
  }
  try {
    const body: unknown = await req.json();
    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    // Fall through to the error below.
  }
  throw new HttpError(400, 'bad_request', 'Expected a JSON object body.');
}

/** Wraps a handler with CORS preflight handling and uniform error responses. */
export function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    try {
      return await handler(req);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
