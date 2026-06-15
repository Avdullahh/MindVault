-- Move SECURITY DEFINER functions out of public schema so PostgREST
-- cannot expose them at /rest/v1/rpc/. REVOKE alone is insufficient
-- because the public schema itself is what PostgREST scans.

create schema if not exists private;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, is_protected) values
    (new.id, 'Business',      false),
    (new.id, 'Creative',      false),
    (new.id, 'Entertainment', false),
    (new.id, 'Family',        false),
    (new.id, 'Finance',       false),
    (new.id, 'Fitness',       false),
    (new.id, 'Health',        false),
    (new.id, 'Hobbies',       false),
    (new.id, 'Learning',      false),
    (new.id, 'Personal',      false),
    (new.id, 'Productivity',  false),
    (new.id, 'Research',      false),
    (new.id, 'Social',        false),
    (new.id, 'Tech',          false),
    (new.id, 'Travel',        false),
    (new.id, 'Writing',       false),
    (new.id, 'Other',         true);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

drop function if exists public.handle_new_user();
drop function if exists public.rls_auto_enable();
