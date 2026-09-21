-- Remove categories and tags entirely: default-category seeding, the
-- category_id link on projects/ideas/goals/tasks, the tags/idea_tags
-- junction, and the RLS policies that referenced any of them.

-- Recreate ownership policies without the category_id integrity check,
-- since category_id and public.categories are about to be dropped.

drop policy if exists "own_projects" on public.projects;
create policy "own_projects" on public.projects for all
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "own_ideas" on public.ideas;
create policy "own_ideas" on public.ideas for all
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "own_goals" on public.goals;
create policy "own_goals" on public.goals for all using (
  (select auth.uid()) = user_id
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = goals.project_id
        and projects.user_id = (select auth.uid())
    )
  )
) with check (
  (select auth.uid()) = user_id
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = goals.project_id
        and projects.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "own_tasks" on public.tasks;
create policy "own_tasks" on public.tasks for all using (
  (select auth.uid()) = user_id
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
        and projects.user_id = (select auth.uid())
    )
  )
) with check (
  (select auth.uid()) = user_id
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
        and projects.user_id = (select auth.uid())
    )
  )
);

-- Drop policies scoped directly to categories/tags/idea_tags.

drop policy if exists "own_categories" on public.categories;
drop policy if exists "own_tags" on public.tags;
drop policy if exists "own_idea_tags" on public.idea_tags;

-- Junction table before its parents.
drop table if exists public.idea_tags;

-- category_id columns before the categories table they reference.
alter table public.projects drop column if exists category_id;
alter table public.ideas drop column if exists category_id;
alter table public.goals drop column if exists category_id;
alter table public.tasks drop column if exists category_id;

drop table if exists public.tags;
drop table if exists public.categories;

-- The only job of this trigger/function was seeding default categories
-- for new users; with categories gone, remove both outright.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists private.handle_new_user();
