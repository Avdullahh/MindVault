drop policy if exists "own_idea_tags" on public.idea_tags;
drop policy if exists "own_project_ideas" on public.project_ideas;
drop policy if exists "own_goal_ideas" on public.goal_ideas;
drop policy if exists "own_task_ideas" on public.task_ideas;
drop policy if exists "own_task_goals" on public.task_goals;
drop policy if exists "own_event_ideas" on public.event_ideas;
drop policy if exists "own_event_goals" on public.event_goals;
drop policy if exists "own_event_tasks" on public.event_tasks;

create policy "own_idea_tags" on public.idea_tags for all using (
  exists (
    select 1
    from public.ideas
    join public.tags on tags.id = idea_tags.tag_id
    where ideas.id = idea_tags.idea_id
      and ideas.user_id = auth.uid()
      and tags.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.ideas
    join public.tags on tags.id = idea_tags.tag_id
    where ideas.id = idea_tags.idea_id
      and ideas.user_id = auth.uid()
      and tags.user_id = auth.uid()
  )
);

create policy "own_project_ideas" on public.project_ideas for all using (
  exists (
    select 1
    from public.projects
    join public.ideas on ideas.id = project_ideas.idea_id
    where projects.id = project_ideas.project_id
      and projects.user_id = auth.uid()
      and ideas.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.projects
    join public.ideas on ideas.id = project_ideas.idea_id
    where projects.id = project_ideas.project_id
      and projects.user_id = auth.uid()
      and ideas.user_id = auth.uid()
  )
);

create policy "own_goal_ideas" on public.goal_ideas for all using (
  exists (
    select 1
    from public.goals
    join public.ideas on ideas.id = goal_ideas.idea_id
    where goals.id = goal_ideas.goal_id
      and goals.user_id = auth.uid()
      and ideas.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.goals
    join public.ideas on ideas.id = goal_ideas.idea_id
    where goals.id = goal_ideas.goal_id
      and goals.user_id = auth.uid()
      and ideas.user_id = auth.uid()
  )
);

create policy "own_task_ideas" on public.task_ideas for all using (
  exists (
    select 1
    from public.tasks
    join public.ideas on ideas.id = task_ideas.idea_id
    where tasks.id = task_ideas.task_id
      and tasks.user_id = auth.uid()
      and ideas.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.tasks
    join public.ideas on ideas.id = task_ideas.idea_id
    where tasks.id = task_ideas.task_id
      and tasks.user_id = auth.uid()
      and ideas.user_id = auth.uid()
  )
);

create policy "own_task_goals" on public.task_goals for all using (
  exists (
    select 1
    from public.tasks
    join public.goals on goals.id = task_goals.goal_id
    where tasks.id = task_goals.task_id
      and tasks.user_id = auth.uid()
      and goals.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.tasks
    join public.goals on goals.id = task_goals.goal_id
    where tasks.id = task_goals.task_id
      and tasks.user_id = auth.uid()
      and goals.user_id = auth.uid()
  )
);

create policy "own_event_ideas" on public.event_ideas for all using (
  exists (
    select 1
    from public.calendar_events
    join public.ideas on ideas.id = event_ideas.idea_id
    where calendar_events.id = event_ideas.event_id
      and calendar_events.user_id = auth.uid()
      and ideas.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.calendar_events
    join public.ideas on ideas.id = event_ideas.idea_id
    where calendar_events.id = event_ideas.event_id
      and calendar_events.user_id = auth.uid()
      and ideas.user_id = auth.uid()
  )
);

create policy "own_event_goals" on public.event_goals for all using (
  exists (
    select 1
    from public.calendar_events
    join public.goals on goals.id = event_goals.goal_id
    where calendar_events.id = event_goals.event_id
      and calendar_events.user_id = auth.uid()
      and goals.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.calendar_events
    join public.goals on goals.id = event_goals.goal_id
    where calendar_events.id = event_goals.event_id
      and calendar_events.user_id = auth.uid()
      and goals.user_id = auth.uid()
  )
);

create policy "own_event_tasks" on public.event_tasks for all using (
  exists (
    select 1
    from public.calendar_events
    join public.tasks on tasks.id = event_tasks.task_id
    where calendar_events.id = event_tasks.event_id
      and calendar_events.user_id = auth.uid()
      and tasks.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.calendar_events
    join public.tasks on tasks.id = event_tasks.task_id
    where calendar_events.id = event_tasks.event_id
      and calendar_events.user_id = auth.uid()
      and tasks.user_id = auth.uid()
  )
);
