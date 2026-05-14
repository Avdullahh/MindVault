alter table public.tasks
  add column project_id uuid references public.projects(id) on delete cascade;

-- Backfill: link tasks to their project via task_goals → goals.project_id
update public.tasks t
set project_id = g.project_id
from public.task_goals tg
join public.goals g on g.id = tg.goal_id
where tg.task_id = t.id
  and g.project_id is not null
  and t.project_id is null;

create index tasks_project_id_idx on public.tasks(project_id);
