-- Food now comes from open data (a bundled USDA database and Open Food Facts),
-- both storable, so every diary row carries its own name and nutrition.

alter table public.meal_items
  drop constraint meal_items_fields_for_source,
  drop constraint meal_items_source_check;
alter table public.saved_meal_items
  drop constraint saved_meal_items_fields_for_source,
  drop constraint saved_meal_items_source_check;

-- The only FatSecret-style row is a test entry; give it real content.
update public.meal_items
set source = 'usda', food_name = 'Chicken breast', grams = 150, calories = 248, protein = 46.5, carbs = 0, fat = 5.4,
    external_food_id = null, external_serving_id = null
where source = 'fatsecret';

alter table public.meal_items
  add constraint meal_items_source_check check (source in ('usda', 'openfoodfacts', 'custom', 'ai_estimate')),
  alter column food_name set not null,
  alter column grams set not null,
  alter column calories set not null,
  alter column protein set not null,
  alter column carbs set not null,
  alter column fat set not null;

alter table public.saved_meal_items
  add constraint saved_meal_items_source_check check (source in ('usda', 'openfoodfacts', 'custom', 'ai_estimate')),
  alter column food_name set not null,
  alter column grams set not null,
  alter column calories set not null,
  alter column protein set not null,
  alter column carbs set not null,
  alter column fat set not null;

comment on column public.meal_items.external_food_id is 'USDA FDC ID or product barcode, when the food came from a database.';
comment on column public.meal_items.external_serving_id is 'Which of the food''s servings the amount was measured in, so editing can reopen it.';
