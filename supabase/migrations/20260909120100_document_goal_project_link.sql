-- Documents the intentional distinction between the two goal<->project
-- relationships (Issue 12) so they read as two features, not accidental
-- duplication. No schema or behavior change - comments only.
comment on column public.goals.project_id is
  'Primary/home project this goal was created under (set once, at creation). '
  'Distinct from goal_projects, which links a goal to additional projects '
  'after the fact. Both are read together and de-duplicated for display - '
  'see docs/issues.md Issue 12.';

comment on table public.goal_projects is
  'Many-to-many: additional projects a goal is linked to, beyond its '
  'primary project (goals.project_id). See docs/issues.md Issue 12.';
