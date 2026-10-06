import { getFoods } from '../_shared/foodCache.ts';
import { HttpError, json, readJsonBody, serve } from '../_shared/http.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';

const MAX_IDS = 50;

// POST { ids: string[] } → { foods: CachedFood[], missing: string[] }
// Batched so a whole diary day resolves in one round trip.
serve(async (req) => {
  await requireUser(req);
  const body = await readJsonBody(req);

  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((id): id is string => typeof id === 'string'))] : [];
  if (ids.length === 0 || ids.length > MAX_IDS || !ids.every((id) => /^\d{1,20}$/.test(id))) {
    throw new HttpError(400, 'bad_request', `Send between 1 and ${MAX_IDS} numeric food IDs.`);
  }

  return json(await getFoods(adminClient(), ids));
});
