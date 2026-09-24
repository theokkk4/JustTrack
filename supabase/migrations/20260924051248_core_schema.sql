-- JustTrack core schema.
--
-- Every user-owned row carries user_id and is protected by row level
-- security: a signed-in user can only read or write their own rows.
-- Child tables reference their parent by (id, user_id), so an item can never
-- be attached to another user's meal even if RLS were misconfigured.

create extension if not exists moddatetime with schema extensions;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_url text,
  sex text check (sex in ('male', 'female', 'unspecified')),
  birth_year smallint check (birth_year between 1900 and 2100),
  height_cm numeric(5, 1) check (height_cm > 0 and height_cm < 300),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  weight_goal text check (weight_goal in ('lose', 'maintain', 'gain')),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure extensions.moddatetime (updated_at);

-- Every new auth user gets a profile row. Apple's ID token carries no name,
-- so for Apple sign-in the app fills display_name in afterwards. The name is
-- truncated so an oversized value can never make signup itself fail.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''), 80), '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- nutrition_goals — one active row per user
-- ---------------------------------------------------------------------------

create table public.nutrition_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  calorie_goal integer not null check (calorie_goal between 500 and 10000),
  protein_goal integer not null check (protein_goal between 0 and 1000),
  carbs_goal integer not null check (carbs_goal between 0 and 2000),
  fat_goal integer not null check (fat_goal between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger nutrition_goals_set_updated_at
  before update on public.nutrition_goals
  for each row execute procedure extensions.moddatetime (updated_at);

-- ---------------------------------------------------------------------------
-- meals / meal_items
-- ---------------------------------------------------------------------------

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text check (char_length(name) <= 120),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snacks')),
  eaten_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index meals_user_eaten_at_idx on public.meals (user_id, eaten_at desc);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  food_name text not null check (char_length(food_name) between 1 and 200),
  brand text check (char_length(brand) <= 120),
  external_food_id text check (char_length(external_food_id) <= 100),
  source text not null check (source in ('fatsecret', 'custom', 'ai_estimate')),
  servings numeric(8, 2) not null default 1 check (servings > 0),
  grams numeric(8, 1) not null check (grams >= 0),
  calories numeric(8, 1) not null check (calories >= 0),
  protein numeric(7, 1) not null check (protein >= 0),
  carbs numeric(7, 1) not null check (carbs >= 0),
  fat numeric(7, 1) not null check (fat >= 0),
  created_at timestamptz not null default now(),
  foreign key (meal_id, user_id) references public.meals (id, user_id) on delete cascade
);

create index meal_items_meal_idx on public.meal_items (meal_id, user_id);
create index meal_items_user_created_at_idx on public.meal_items (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- custom_foods
-- ---------------------------------------------------------------------------

create table public.custom_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  brand text check (char_length(brand) <= 120),
  serving_size numeric(8, 1) not null check (serving_size > 0),
  serving_description text check (char_length(serving_description) <= 60),
  calories numeric(8, 1) not null check (calories >= 0),
  protein numeric(7, 1) not null default 0 check (protein >= 0),
  carbs numeric(7, 1) not null default 0 check (carbs >= 0),
  fat numeric(7, 1) not null default 0 check (fat >= 0),
  barcode text check (barcode ~ '^[0-9]{6,14}$'),
  created_at timestamptz not null default now()
);

comment on column public.custom_foods.serving_size is 'Grams in one serving; nutrition columns are per serving.';

create index custom_foods_user_created_at_idx on public.custom_foods (user_id, created_at desc);
create unique index custom_foods_user_barcode_idx on public.custom_foods (user_id, barcode) where barcode is not null;

-- ---------------------------------------------------------------------------
-- saved_meals / saved_meal_items
-- ---------------------------------------------------------------------------

create table public.saved_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index saved_meals_user_created_at_idx on public.saved_meals (user_id, created_at desc);

create table public.saved_meal_items (
  id uuid primary key default gen_random_uuid(),
  saved_meal_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  food_name text not null check (char_length(food_name) between 1 and 200),
  brand text check (char_length(brand) <= 120),
  external_food_id text check (char_length(external_food_id) <= 100),
  source text not null check (source in ('fatsecret', 'custom', 'ai_estimate')),
  servings numeric(8, 2) not null default 1 check (servings > 0),
  grams numeric(8, 1) not null check (grams >= 0),
  calories numeric(8, 1) not null check (calories >= 0),
  protein numeric(7, 1) not null check (protein >= 0),
  carbs numeric(7, 1) not null check (carbs >= 0),
  fat numeric(7, 1) not null check (fat >= 0),
  created_at timestamptz not null default now(),
  foreign key (saved_meal_id, user_id) references public.saved_meals (id, user_id) on delete cascade
);

create index saved_meal_items_meal_idx on public.saved_meal_items (saved_meal_id, user_id);
create index saved_meal_items_user_idx on public.saved_meal_items (user_id);

-- ---------------------------------------------------------------------------
-- weight_entries — powers weight history on the Progress tab
-- ---------------------------------------------------------------------------

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_kg numeric(5, 2) not null check (weight_kg > 0 and weight_kg < 700),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index weight_entries_user_recorded_at_idx on public.weight_entries (user_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.nutrition_goals enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.custom_foods enable row level security;
alter table public.saved_meals enable row level security;
alter table public.saved_meal_items enable row level security;
alter table public.weight_entries enable row level security;

-- Signed-out clients have no business touching any of this.
revoke all on table
  public.profiles, public.nutrition_goals, public.meals, public.meal_items,
  public.custom_foods, public.saved_meals, public.saved_meal_items, public.weight_entries
from anon;

grant select, insert, update, delete on table
  public.profiles, public.nutrition_goals, public.meals, public.meal_items,
  public.custom_foods, public.saved_meals, public.saved_meal_items, public.weight_entries
to authenticated;

-- profiles: keyed by id. No delete policy — profiles go away only when the
-- auth user is deleted (see delete_my_account), via the cascade.
create policy "Users can read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can create their own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Every other table: full CRUD on your own rows, nothing on anyone else's.
create policy "Users can read their own goals" on public.nutrition_goals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own goals" on public.nutrition_goals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own goals" on public.nutrition_goals
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own goals" on public.nutrition_goals
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own meals" on public.meals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own meals" on public.meals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own meals" on public.meals
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own meals" on public.meals
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own meal items" on public.meal_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own meal items" on public.meal_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own meal items" on public.meal_items
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own meal items" on public.meal_items
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own custom foods" on public.custom_foods
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own custom foods" on public.custom_foods
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own custom foods" on public.custom_foods
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own custom foods" on public.custom_foods
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own saved meals" on public.saved_meals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own saved meals" on public.saved_meals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own saved meals" on public.saved_meals
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own saved meals" on public.saved_meals
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own saved meal items" on public.saved_meal_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own saved meal items" on public.saved_meal_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own saved meal items" on public.saved_meal_items
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own saved meal items" on public.saved_meal_items
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own weight entries" on public.weight_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own weight entries" on public.weight_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own weight entries" on public.weight_entries
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own weight entries" on public.weight_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Account deletion (App Store guideline 5.1.1(v))
-- ---------------------------------------------------------------------------

-- Deletes the caller's auth user; every table above cascades from it, so
-- this removes all of their data in one statement. It can only ever act on
-- auth.uid(), never on an id passed in by the client.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  delete from auth.users where id = current_user_id;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
