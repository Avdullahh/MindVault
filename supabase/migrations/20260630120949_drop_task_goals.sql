-- Remove goal <-> task linking ("milestones").
-- Tasks are project-scoped and goals connect to work via goal_projects;
-- linking individual tasks to a goal is no longer part of the product.
drop policy if exists "own_task_goals" on public.task_goals;
drop table if exists public.task_goals;
