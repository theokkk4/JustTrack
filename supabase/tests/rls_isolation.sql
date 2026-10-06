-- Row level security isolation test.
--
-- Run in the Supabase SQL editor (or psql) against any JustTrack database.
-- It creates two throwaway users, acts as each of them plus an anonymous
-- client, and checks that nobody can see or change another user's data —
-- including through the log_meal / move_meal_item functions — and that
-- FatSecret diary rows can only ever hold IDs.
--
-- It ALWAYS ends by raising an error that carries the report: that's what
-- rolls everything back, so no test data is ever left behind. Look for
-- "RLS CHECKS PASSED" or "RLS CHECKS FAILED" in the error message.

do $$
declare
  user_a uuid := '00000000-0000-4000-a000-00000000000a';
  user_b uuid := '00000000-0000-4000-a000-00000000000b';
  meal_a uuid;
  item_a uuid;
  moved_meal uuid;
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

  -- User A logs a meal: one FatSecret item (IDs only) and one custom item.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  meal_a := public.log_meal('lunch', now(), jsonb_build_array(
    jsonb_build_object('source', 'fatsecret', 'external_food_id', '1641', 'external_serving_id', '4822', 'servings', 1.5, 'amount_unit', 'serving'),
    jsonb_build_object('source', 'custom', 'food_name', 'Protein bar', 'grams', 60, 'calories', 210, 'protein', 20, 'carbs', 22, 'fat', 7)
  ));
  select id into item_a from public.meal_items where meal_id = meal_a and source = 'fatsecret';
  insert into public.nutrition_goals (user_id, calorie_goal, protein_goal, carbs_goal, fat_goal) values (user_a, 2200, 150, 220, 70);
  insert into public.weight_entries (user_id, weight_kg) values (user_a, 80);
  insert into public.custom_foods (user_id, name, serving_size, calories) values (user_a, 'Protein bar', 60, 210);

  select count(*) into n from public.meal_items where meal_id = meal_a;
  if n <> 2 then failures := failures + 1; end if;
  report := report || format('[%s] A logs meal with 2 items=%s ', case when n = 2 then 'ok' else 'FAIL' end, n);

  -- FatSecret terms: only IDs may be stored, so content alongside them is rejected.
  begin
    perform public.log_meal('lunch', now(), jsonb_build_array(
      jsonb_build_object('source', 'fatsecret', 'external_food_id', '1641', 'external_serving_id', '4822', 'food_name', 'Chicken', 'calories', 165)
    ));
    failures := failures + 1;
    report := report || '[FAIL] FatSecret row stored content ';
  exception when check_violation then
    report := report || '[ok] FatSecret row with content: rejected ';
  end;

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

  begin
    perform public.move_meal_item(item_a, 'dinner');
    failures := failures + 1;
    report := report || '[FAIL] B moves A item ';
  exception when others then
    report := report || format('[ok] B moves A item: blocked %s ', sqlstate);
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
  begin
    perform public.log_meal('lunch', now(), '[{"source":"custom","food_name":"x","grams":1,"calories":1,"protein":0,"carbs":0,"fat":0}]');
    failures := failures + 1;
    report := report || '[FAIL] anon logs a meal ';
  exception when others then
    report := report || format('[ok] anon logs a meal: denied %s ', sqlstate);
  end;

  -- A moves the FatSecret item to dinner, then deletes what's left: emptied meals disappear.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  moved_meal := public.move_meal_item(item_a, 'dinner');
  select count(*) into n from public.meals where id = moved_meal and meal_type = 'dinner';
  if n <> 1 or moved_meal = meal_a then failures := failures + 1; end if;
  report := report || format('[%s] A moves item to dinner=%s ', case when n = 1 and moved_meal <> meal_a then 'ok' else 'FAIL' end, n);

  delete from public.meal_items where meal_id = meal_a;
  select count(*) into n from public.meals where id = meal_a;
  if n <> 0 then failures := failures + 1; end if;
  report := report || format('[%s] emptied meal removed=%s ', case when n = 0 then 'ok' else 'FAIL' end, 1 - n);

  -- delete_my_account wipes A completely and leaves B alone.
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
