-- FatSecret's terms allow storing only IDs (food_id, serving_id) indefinitely;
-- every other piece of content (names, nutrition) must be re-requested within
-- 24 hours. So diary rows for FatSecret foods keep just the IDs and how much
-- was eaten, and a check constraint makes it impossible to store more.
-- Names and nutrition are resolved through the fatsecret-food Edge Function,
-- backed by a server-only cache that's purged before content turns 24h old.

alter table public.meal_items
  add column external_serving_id text check (char_length(external_serving_id) <= 100),
  alter column food_name drop not null,
  alter column grams drop not null,
  alter column calories drop not null,
  alter column protein drop not null,
  alter column carbs drop not null,
  alter column fat drop not null;

alter table public.meal_items add constraint meal_items_fields_for_source check (
  case
    when source = 'fatsecret' then
      external_food_id is not null and external_serving_id is not null
      and food_name is null and brand is null and grams is null
      and calories is null and protein is null and carbs is null and fat is null
    else
      food_name is not null and grams is not null
      and calories is not null and protein is not null and carbs is not null and fat is not null
  end
);

alter table public.saved_meal_items
  add column external_serving_id text check (char_length(external_serving_id) <= 100),
  alter column food_name drop not null,
  alter column grams drop not null,
  alter column calories drop not null,
  alter column protein drop not null,
  alter column carbs drop not null,
  alter column fat drop not null;

alter table public.saved_meal_items add constraint saved_meal_items_fields_for_source check (
  case
    when source = 'fatsecret' then
      external_food_id is not null and external_serving_id is not null
      and food_name is null and brand is null and grams is null
      and calories is null and protein is null and carbs is null and fat is null
    else
      food_name is not null and grams is not null
      and calories is not null and protein is not null and carbs is not null and fat is not null
  end
);

-- Server-only cache of normalized food.get responses. RLS is on with no
-- policies and grants are revoked, so only Edge Functions (service role)
-- can touch it.
create table public.fatsecret_food_cache (
  food_id text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.fatsecret_food_cache enable row level security;
revoke all on table public.fatsecret_food_cache from anon, authenticated;

comment on table public.fatsecret_food_cache is
  'FatSecret content, cached under the 24h limit in their terms. Service role only; purged hourly.';

create extension if not exists pg_cron with schema pg_catalog;

-- Hourly purge of anything older than 23h: nothing survives to 24h.
select cron.schedule(
  'purge-fatsecret-food-cache',
  '17 * * * *',
  $$delete from public.fatsecret_food_cache where fetched_at < now() - interval '23 hours'$$
);
