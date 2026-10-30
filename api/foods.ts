/**
 * GET /api/foods?q=…&page=… — packaged-food search, proxied to Open Food Facts.
 *
 * Browsers can't call Open Food Facts' search host directly (it sends no CORS
 * headers), so the web app goes through this tiny function. It forwards the
 * query, identifies the app as OFF asks, and returns only the fields the app
 * normalizes client-side. Nothing about the user is sent or stored.
 */

const SEARCH_URL = 'https://search.openfoodfacts.org/search';
const FIELDS = 'code,product_name,generic_name,brands,quantity,categories_tags,nutriments,serving_size,serving_quantity,serving_quantity_unit,image_front_url';
const USER_AGENT = 'JustTrack/1.0 (open source; https://github.com/theokkk4/JustTrack)';
const PAGE_SIZE = 20;

function json(body: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': cache } });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
  const page = Math.min(Math.max(Number(url.searchParams.get('page')) || 1, 1), 20);
  if (query.length < 2) {
    return json({ error: { code: 'bad_request', message: 'Search for at least 2 characters.' } }, 400);
  }

  const params = new URLSearchParams({ q: query, page: String(page), page_size: String(PAGE_SIZE), fields: FIELDS });
  let upstream: Response;
  try {
    upstream = await fetch(`${SEARCH_URL}?${params}`, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(12_000) });
  } catch {
    return json({ error: { code: 'upstream_unavailable', message: 'Couldn’t reach Open Food Facts. Please try again.' } }, 502);
  }
  if (upstream.status === 429) {
    return json({ error: { code: 'rate_limited', message: 'Packaged-food search is busy right now. Try again in a minute.' } }, 429);
  }
  if (!upstream.ok) {
    return json({ error: { code: 'upstream_error', message: 'Open Food Facts had a problem. Please try again.' } }, 502);
  }

  const body = (await upstream.json().catch(() => null)) as { hits?: unknown[]; page_count?: number } | null;
  // Results for the same query are safe to share for an hour at the edge.
  return json({ hits: Array.isArray(body?.hits) ? body.hits : [], page_count: typeof body?.page_count === 'number' ? body.page_count : page }, 200, 'public, s-maxage=3600, stale-while-revalidate=86400');
}
