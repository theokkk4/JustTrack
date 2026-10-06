import { Endpoints, fatsecretGet } from '../_shared/fatsecret.ts';
import { HttpError, json, readJsonBody, serve } from '../_shared/http.ts';
import { normalizeSearch } from '../_shared/normalize.ts';
import { requireUser } from '../_shared/supabase.ts';

const PAGE_SIZE = 25;

// POST { query: string, page?: number } → FoodSearchPage
serve(async (req) => {
  await requireUser(req);
  const body = await readJsonBody(req);

  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (query.length < 2 || query.length > 100) {
    throw new HttpError(400, 'bad_request', 'Search for at least 2 characters.');
  }
  const page = typeof body.page === 'number' && Number.isInteger(body.page) && body.page >= 0 && body.page < 40 ? body.page : 0;

  const raw = await fatsecretGet(Endpoints.searchFoods, {
    search_expression: query,
    page_number: String(page),
    max_results: String(PAGE_SIZE),
  });
  return json(normalizeSearch(raw));
});
