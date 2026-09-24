-- Saves everything onboarding collects in one transaction: goals, the first
-- weigh-in, and the profile (which marks onboarding complete). Runs as the
-- caller (security invoker), so row level security still applies.

create function public.complete_onboarding(
  p_sex text,
  p_birth_year smallint,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_activity_level text,
  p_weight_goal text,
  p_calorie_goal integer,
  p_protein_goal integer,
  p_carbs_goal integer,
  p_fat_goal integer,
  p_display_name text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  insert into public.nutrition_goals (user_id, calorie_goal, protein_goal, carbs_goal, fat_goal)
  values (current_user_id, p_calorie_goal, p_protein_goal, p_carbs_goal, p_fat_goal)
  on conflict (user_id) do update set
    calorie_goal = excluded.calorie_goal,
    protein_goal = excluded.protein_goal,
    carbs_goal = excluded.carbs_goal,
    fat_goal = excluded.fat_goal;

  insert into public.weight_entries (user_id, weight_kg)
  values (current_user_id, p_weight_kg);

  insert into public.profiles (id, sex, birth_year, height_cm, activity_level, weight_goal, display_name, onboarding_completed_at)
  values (current_user_id, p_sex, p_birth_year, p_height_cm, p_activity_level, p_weight_goal, nullif(trim(p_display_name), ''), now())
  on conflict (id) do update set
    sex = excluded.sex,
    birth_year = excluded.birth_year,
    height_cm = excluded.height_cm,
    activity_level = excluded.activity_level,
    weight_goal = excluded.weight_goal,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    onboarding_completed_at = coalesce(public.profiles.onboarding_completed_at, now());
end;
$$;

revoke execute on function public.complete_onboarding(text, smallint, numeric, numeric, text, text, integer, integer, integer, integer, text) from public, anon;
grant execute on function public.complete_onboarding(text, smallint, numeric, numeric, text, text, integer, integer, integer, integer, text) to authenticated;
