create table if not exists public.goal_projects (
  goal_id    uuid not null references public.goals(id)    on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (goal_id, project_id)
);

alter table public.goal_projects enable row level security;

create policy "own_goal_projects" on public.goal_projects for all using (
  exists (
    select 1
    from public.goals
    join public.projects on projects.id = goal_projects.project_id
    where goals.id = goal_projects.goal_id
      and goals.user_id = auth.uid()
      and projects.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.goals
    join public.projects on projects.id = goal_projects.project_id
    where goals.id = goal_projects.goal_id
      and goals.user_id = auth.uid()
      and projects.user_id = auth.uid()
  )
);
