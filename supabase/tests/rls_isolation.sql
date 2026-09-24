-- Row level security isolation test.
--
-- Run in the Supabase SQL editor (or psql) against any JustTrack database.
-- It creates two throwaway users, acts as each of them plus an anonymous
-- client, and checks that nobody can see or change another user's data.
--
-- It ALWAYS ends by raising an error that carries the report: that's what
-- rolls everything back, so no test data is ever left behind. Look for
-- "RLS CHECKS PASSED" or "RLS CHECKS FAILED" in the error message.

do $$
declare
  user_a uuid := '00000000-0000-4000-a000-00000000000a';
  user_b uuid := '00000000-0000-4000-a000-00000000000b';
  meal_a uuid;
  n int;
  failures int := 0;
  report text := '';
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    ('00000000-0000-0000-0000-000000000000', user_a, 'authenticated', 'authenticated', 'rls-a@justtrack.test', '', '{}', '{"display_name":"User A"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', user_b, 'authenticated', 'authenticated', 'rls-b@justtrack.test', '', '{}', '{}', now(), now());

  select count(*) into n from public.profiles where id in (user_a, user_b);
  if n <> 2 then failures := failures + 1; end if;
  report := report || format('[%s] profiles auto-created=%s/2 ', case when n = 2 then 'ok' else 'FAIL' end, n);

  -- User A logs some data.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  insert into public.meals (user_id, meal_type) values (user_a, 'lunch') returning id into meal_a;
  insert into public.meal_items (meal_id, user_id, food_name, source, grams, calories, protein, carbs, fat)
    values (meal_a, user_a, 'Chicken breast', 'fatsecret', 150, 248, 46, 0, 5);
  insert into public.nutrition_goals (user_id, calorie_goal, protein_goal, carbs_goal, fat_goal) values (user_a, 2200, 150, 220, 70);
  insert into public.weight_entries (user_id, weight_kg) values (user_a, 80);
  insert into public.custom_foods (user_id, name, serving_size, calories) values (user_a, 'Protein bar', 60, 210);

  select count(*) into n from public.meal_items;
  if n <> 1 then failures := failures + 1; end if;
  report := report || format('[%s] A sees own items=%s ', case when n = 1 then 'ok' else 'FAIL' end, n);

  -- User B must not see or touch any of it.
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);

  select (select count(*) from public.meals) + (select count(*) from public.meal_items)
       + (select count(*) from public.nutrition_goals) + (select count(*) from public.weight_entries)
       + (select count(*) from public.custom_foods)
    into n;
  if n <> 0 then failures := failures + 1; end if;
  report := report || format('[%s] B sees A rows=%s ', case when n = 0 then 'ok' else 'FAIL' end, n);

  select count(*) into n from public.profiles;
  if n <> 1 then failures := failures + 1; end if;
  report := report || format('[%s] B sees profiles=%s (own only) ', case when n = 1 then 'ok' else 'FAIL' end, n);

  update public.meals set name = 'hacked' where id = meal_a;
  get diagnostics n = row_count;
  if n <> 0 then failures := failures + 1; end if;
  report := report || format('[%s] B updates A meal=%s ', case when n = 0 then 'ok' else 'FAIL' end, n);

  update public.profiles set display_name = 'hacked' where id = user_a;
  get diagnostics n = row_count;
  if n <> 0 then failures := failures + 1; end if;
  report := report || format('[%s] B updates A profile=%s ', case when n = 0 then 'ok' else 'FAIL' end, n);

  delete from public.meal_items where meal_id = meal_a;
  get diagnostics n = row_count;
  if n <> 0 then failures := failures + 1; end if;
  report := report || format('[%s] B deletes A items=%s ', case when n = 0 then 'ok' else 'FAIL' end, n);

  begin
    insert into public.meal_items (meal_id, user_id, food_name, source, grams, calories, protein, carbs, fat)
      values (meal_a, user_a, 'Injected', 'custom', 1, 1, 0, 0, 0);
    failures := failures + 1;
    report := report || '[FAIL] B inserts row owned by A ';
  exception when others then
    report := report || format('[ok] B inserts row owned by A: blocked %s ', sqlstate);
  end;

  begin
    insert into public.meal_items (meal_id, user_id, food_name, source, grams, calories, protein, carbs, fat)
      values (meal_a, user_b, 'Injected', 'custom', 1, 1, 0, 0, 0);
    failures := failures + 1;
    report := report || '[FAIL] B attaches item to A meal ';
  exception when others then
    report := report || format('[ok] B attaches item to A meal: blocked %s ', sqlstate);
  end;

  -- A signed-out client gets nothing at all.
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  begin
    select count(*) into n from public.meals;
    if n <> 0 then failures := failures + 1; end if;
    report := report || format('[%s] anon sees meals=%s ', case when n = 0 then 'ok' else 'FAIL' end, n);
  exception when others then
    report := report || format('[ok] anon reads meals: denied %s ', sqlstate);
  end;

  -- delete_my_account wipes A completely and leaves B alone.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  perform public.delete_my_account();
  execute 'reset role';

  select (select count(*) from auth.users where id = user_a) + (select count(*) from public.profiles where id = user_a)
       + (select count(*) from public.meals where user_id = user_a) + (select count(*) from public.meal_items where user_id = user_a)
       + (select count(*) from public.nutrition_goals where user_id = user_a) + (select count(*) from public.weight_entries where user_id = user_a)
       + (select count(*) from public.custom_foods where user_id = user_a)
    into n;
  if n <> 0 then failures := failures + 1; end if;
  report := report || format('[%s] A rows left after account deletion=%s ', case when n = 0 then 'ok' else 'FAIL' end, n);

  select count(*) into n from auth.users where id = user_b;
  if n <> 1 then failures := failures + 1; end if;
  report := report || format('[%s] B untouched by A deletion=%s ', case when n = 1 then 'ok' else 'FAIL' end, n);

  raise exception 'RLS CHECKS % (% failures): %', case when failures = 0 then 'PASSED' else 'FAILED' end, failures, report;
end;
$$;
