-- Diary logging: an atomic "log these items" function, moving items between
-- meals, automatic cleanup of emptied meals, finer serving precision, and room
-- for Open Food Facts barcode results.

-- Gram entries are stored as a fraction of a FatSecret serving (150 g of a
-- 28.35 g serving is 5.2910 servings), so keep four decimals.
alter table public.meal_items alter column servings type numeric(10, 4);
alter table public.saved_meal_items alter column servings type numeric(10, 4);

-- amount_unit remembers how the amount was entered, so reopening an entry
-- shows "150 g" rather than "5.291 servings". is_estimate marks items whose
-- portion or nutrition came from the AI photo scanner.
alter table public.meal_items
  add column amount_unit text not null default 'serving' check (amount_unit in ('serving', 'g', 'ml')),
  add column is_estimate boolean not null default false;
alter table public.saved_meal_items
  add column amount_unit text not null default 'serving' check (amount_unit in ('serving', 'g', 'ml')),
  add column is_estimate boolean not null default false;

-- Open Food Facts data is ODbL-licensed and may be stored, so those items keep
-- their name and nutrition like custom foods do.
alter table public.meal_items
  drop constraint meal_items_source_check,
  add constraint meal_items_source_check check (source in ('fatsecret', 'openfoodfacts', 'custom', 'ai_estimate'));
alter table public.saved_meal_items
  drop constraint saved_meal_items_source_check,
  add constraint saved_meal_items_source_check check (source in ('fatsecret', 'openfoodfacts', 'custom', 'ai_estimate'));

-- A meal only exists to group its items: when its last item is deleted or
-- moved away, the meal goes too.
create function public.delete_meal_if_empty()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.meals m
  where m.id = old.meal_id
    and m.user_id = old.user_id
    and not exists (select 1 from public.meal_items i where i.meal_id = old.meal_id);
  return null;
end;
$$;

create trigger meal_items_delete_empty_meal
  after delete or update of meal_id on public.meal_items
  for each row execute function public.delete_meal_if_empty();

-- Logs a meal and all of its items in one transaction. Runs as the caller, so
-- row level security and every check constraint still apply.
create function public.log_meal(
  p_meal_type text,
  p_eaten_at timestamptz,
  p_items jsonb,
  p_name text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_meal_id uuid;
begin
  if current_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'items must be an array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'a meal needs between 1 and 50 items' using errcode = '22023';
  end if;

  insert into public.meals (user_id, meal_type, eaten_at, name)
  values (current_user_id, p_meal_type, coalesce(p_eaten_at, now()), nullif(trim(p_name), ''))
  returning id into new_meal_id;

  insert into public.meal_items (
    meal_id, user_id, source, external_food_id, external_serving_id, servings, amount_unit, is_estimate,
    food_name, brand, grams, calories, protein, carbs, fat
  )
  select
    new_meal_id, current_user_id, item.source, item.external_food_id, item.external_serving_id,
    coalesce(item.servings, 1), coalesce(item.amount_unit, 'serving'), coalesce(item.is_estimate, false),
    item.food_name, item.brand, item.grams, item.calories, item.protein, item.carbs, item.fat
  from jsonb_to_recordset(p_items) as item (
    source text, external_food_id text, external_serving_id text, servings numeric, amount_unit text,
    is_estimate boolean, food_name text, brand text, grams numeric, calories numeric, protein numeric,
    carbs numeric, fat numeric
  );

  return new_meal_id;
end;
$$;

revoke execute on function public.log_meal(text, timestamptz, jsonb, text) from public, anon;
grant execute on function public.log_meal(text, timestamptz, jsonb, text) to authenticated;

-- Moves one item to another meal type on the same day. The item gets a new
-- meal; the trigger above removes the old one if that left it empty.
create function public.move_meal_item(p_item_id uuid, p_meal_type text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  source_meal public.meals%rowtype;
  target_meal_id uuid;
begin
  if current_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select m.* into source_meal
  from public.meal_items i
  join public.meals m on m.id = i.meal_id and m.user_id = i.user_id
  where i.id = p_item_id and i.user_id = current_user_id;

  if not found then
    raise exception 'meal item not found' using errcode = 'P0002';
  end if;
  if source_meal.meal_type = p_meal_type then
    return source_meal.id;
  end if;

  insert into public.meals (user_id, meal_type, eaten_at)
  values (current_user_id, p_meal_type, source_meal.eaten_at)
  returning id into target_meal_id;

  update public.meal_items set meal_id = target_meal_id where id = p_item_id and user_id = current_user_id;
  return target_meal_id;
end;
$$;

revoke execute on function public.move_meal_item(uuid, text) from public, anon;
grant execute on function public.move_meal_item(uuid, text) to authenticated;

-- Purge the FatSecret cache every 15 minutes instead of hourly, so cached
-- content never outlives ~23h15m (FatSecret's limit is 24h).
select cron.schedule(
  'purge-fatsecret-food-cache',
  '*/15 * * * *',
  $$delete from public.fatsecret_food_cache where fetched_at < now() - interval '23 hours'$$
);

comment on table public.fatsecret_food_cache is
  'FatSecret content, cached under the 24h limit in their terms. Service role only; purged every 15 minutes.';
