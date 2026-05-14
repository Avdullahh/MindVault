-- Backfill new default categories for existing users who signed up before this migration.
-- Only inserts if the user doesn't already have a category with that name.

do $$
declare
  u record;
  new_cats text[] := array[
    'Entertainment', 'Family', 'Fitness', 'Hobbies',
    'Productivity', 'Research', 'Social', 'Travel', 'Writing'
  ];
  cat text;
begin
  for u in select id from auth.users loop
    foreach cat in array new_cats loop
      insert into public.categories (user_id, name, is_protected)
      values (u.id, cat, false)
      on conflict (user_id, name) do nothing;
    end loop;
  end loop;
end;
$$;
