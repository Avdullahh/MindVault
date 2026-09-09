-- tasks_project_required (added in 20240106000000_harden_direct_rls.sql)
-- was created NOT VALID, so it never checked pre-existing rows. 10 orphaned
-- tasks with project_id IS NULL were found and deleted (they were leftover
-- pre-project-scoping dev/test rows, invisible in the current project-scoped
-- UI). Validate the constraint now that the table satisfies it, so Postgres
-- actually enforces "tasks are project-scoped" rather than only checking it
-- on new writes.
alter table public.tasks
  validate constraint tasks_project_required;
