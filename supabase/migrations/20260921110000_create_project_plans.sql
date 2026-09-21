-- Project plan history: every "Plan with AI" run for a project, capped at
-- 20 rows per project. No user_id column on the row itself -- ownership is
-- proven via a join to projects, matching the idea_expansions pattern.

create table project_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  tasks text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index project_plans_project_id_created_at_idx
  on project_plans(project_id, created_at desc);

alter table project_plans enable row level security;

create policy "own_project_plans" on project_plans for all using (
  exists (select 1 from projects where projects.id = project_plans.project_id and projects.user_id = auth.uid())
);

create or replace function trim_project_plans() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from project_plans
  where project_id = new.project_id
    and id not in (
      select id from project_plans
      where project_id = new.project_id
      order by created_at desc
      limit 20
    );
  return new;
end;
$$;

create trigger trim_project_plans_trigger
  after insert on project_plans
  for each row execute function trim_project_plans();
