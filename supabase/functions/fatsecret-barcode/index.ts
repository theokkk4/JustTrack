import { Endpoints, fatsecretGet } from '../_shared/fatsecret.ts';
import { saveToCache } from '../_shared/foodCache.ts';
import { HttpError, json, readJsonBody, serve } from '../_shared/http.ts';
import { normalizeFood, toGtin13 } from '../_shared/normalize.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';

// POST { barcode: string } → { food: CachedFood }  (404 not_found when FatSecret has no match)
serve(async (req) => {
  await requireUser(req);
  const body = await readJsonBody(req);

  const barcode = typeof body.barcode === 'string' ? toGtin13(body.barcode) : null;
  if (!barcode) {
    throw new HttpError(400, 'bad_request', 'That doesn’t look like a product barcode.');
  }

  const fetchedAt = new Date().toISOString();
  const raw = (await fatsecretGet(Endpoints.findByBarcode, { barcode })) as { food?: unknown };
  const food = normalizeFood(raw.food);
  if (!food) {
    throw new HttpError(404, 'not_found', 'We couldn’t find that food.');
  }

  await saveToCache(adminClient(), food, fetchedAt);
  return json({ food: { ...food, fetchedAt } });
});
