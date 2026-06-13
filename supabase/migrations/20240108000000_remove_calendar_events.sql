-- Drop junction tables that FK into calendar_events
DROP TABLE IF EXISTS public.event_ideas CASCADE;
DROP TABLE IF EXISTS public.event_goals CASCADE;
DROP TABLE IF EXISTS public.event_tasks CASCADE;

-- Recreate own_tasks policy without calendar_event_id check
DROP POLICY IF EXISTS "own_tasks" ON public.tasks;

CREATE POLICY "own_tasks" ON public.tasks FOR ALL USING (
  auth.uid() = user_id
  AND (
    category_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.categories
      WHERE categories.id = tasks.category_id
        AND categories.user_id = auth.uid()
    )
  )
  AND (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  )
) WITH CHECK (
  auth.uid() = user_id
  AND (
    category_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.categories
      WHERE categories.id = tasks.category_id
        AND categories.user_id = auth.uid()
    )
  )
  AND (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  )
);

-- Drop FK column from tasks, then drop calendar_events (CASCADE drops its RLS policy)
ALTER TABLE tasks DROP COLUMN IF EXISTS calendar_event_id;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
