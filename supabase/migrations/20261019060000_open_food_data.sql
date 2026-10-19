-- Replace FatSecret with open data: a USDA food database bundled in the app
-- (public domain) and Open Food Facts for packaged foods (ODbL). Both may be
-- stored, so every diary row keeps its own name and nutrition again, and the
-- FatSecret-only machinery (IDs-only rows, 24-hour content cache) goes away.

delete from public.meal_items where source = 'fatsecret';
delete from public.saved_meal_items where source = 'fatsecret';

alter table public.meal_items
  drop constraint meal_items_fields_for_source,
  drop constraint meal_items_source_check,
  add constraint meal_items_source_check check (source in ('usda', 'openfoodfacts', 'custom', 'ai_estimate')),
  alter column food_name set not null,
  alter column grams set not null,
  alter column calories set not null,
  alter column protein set not null,
  alter column carbs set not null,
  alter column fat set not null;

alter table public.saved_meal_items
  drop constraint saved_meal_items_fields_for_source,
  drop constraint saved_meal_items_source_check,
  add constraint saved_meal_items_source_check check (source in ('usda', 'openfoodfacts', 'custom', 'ai_estimate')),
  alter column food_name set not null,
  alter column grams set not null,
  alter column calories set not null,
  alter column protein set not null,
  alter column carbs set not null,
  alter column fat set not null;

comment on column public.meal_items.external_food_id is 'USDA FDC ID or product barcode, when the food came from a database.';
comment on column public.meal_items.external_serving_id is 'Which of the food''s servings the amount was measured in, so editing can reopen it.';

select cron.unschedule('purge-fatsecret-food-cache');
drop table public.fatsecret_food_cache;
