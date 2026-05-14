drop policy if exists "own_categories" on public.categories;
drop policy if exists "own_tags" on public.tags;
drop policy if exists "own_projects" on public.projects;
drop policy if exists "own_ideas" on public.ideas;
drop policy if exists "own_goals" on public.goals;
drop policy if exists "own_calendar_events" on public.calendar_events;
drop policy if exists "own_tasks" on public.tasks;
drop policy if exists "own_milestones" on public.milestones;
drop policy if exists "own_action_steps" on public.action_steps;

alter table public.tasks
  add constraint tasks_project_required
  check (project_id is not null)
  not valid;

create policy "own_categories" on public.categories for all using (
  auth.uid() = user_id
) with check (
  auth.uid() = user_id
);

create policy "own_tags" on public.tags for all using (
  auth.uid() = user_id
) with check (
  auth.uid() = user_id
);

create policy "own_projects" on public.projects for all using (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = projects.category_id
        and categories.user_id = auth.uid()
    )
  )
) with check (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = projects.category_id
        and categories.user_id = auth.uid()
    )
  )
);

create policy "own_ideas" on public.ideas for all using (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = ideas.category_id
        and categories.user_id = auth.uid()
    )
  )
) with check (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = ideas.category_id
        and categories.user_id = auth.uid()
    )
  )
);

create policy "own_goals" on public.goals for all using (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = goals.category_id
        and categories.user_id = auth.uid()
    )
  )
  and (
    project_id is null
    or exists (
      select 1
      from public.projects
      where projects.id = goals.project_id
        and projects.user_id = auth.uid()
    )
  )
) with check (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = goals.category_id
        and categories.user_id = auth.uid()
    )
  )
  and (
    project_id is null
    or exists (
      select 1
      from public.projects
      where projects.id = goals.project_id
        and projects.user_id = auth.uid()
    )
  )
);

create policy "own_calendar_events" on public.calendar_events for all using (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = calendar_events.category_id
        and categories.user_id = auth.uid()
    )
  )
) with check (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = calendar_events.category_id
        and categories.user_id = auth.uid()
    )
  )
);

create policy "own_tasks" on public.tasks for all using (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = tasks.category_id
        and categories.user_id = auth.uid()
    )
  )
  and (
    calendar_event_id is null
    or exists (
      select 1
      from public.calendar_events
      where calendar_events.id = tasks.calendar_event_id
        and calendar_events.user_id = auth.uid()
    )
  )
  and (
    project_id is null
    or exists (
      select 1
      from public.projects
      where projects.id = tasks.project_id
        and projects.user_id = auth.uid()
    )
  )
) with check (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = tasks.category_id
        and categories.user_id = auth.uid()
    )
  )
  and (
    calendar_event_id is null
    or exists (
      select 1
      from public.calendar_events
      where calendar_events.id = tasks.calendar_event_id
        and calendar_events.user_id = auth.uid()
    )
  )
  and (
    project_id is null
    or exists (
      select 1
      from public.projects
      where projects.id = tasks.project_id
        and projects.user_id = auth.uid()
    )
  )
);

create policy "own_milestones" on public.milestones for all using (
  exists (
    select 1
    from public.goals
    where goals.id = milestones.goal_id
      and goals.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.goals
    where goals.id = milestones.goal_id
      and goals.user_id = auth.uid()
  )
);

create policy "own_action_steps" on public.action_steps for all using (
  exists (
    select 1
    from public.milestones
    join public.goals on goals.id = milestones.goal_id
    where milestones.id = action_steps.milestone_id
      and goals.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.milestones
    join public.goals on goals.id = milestones.goal_id
    where milestones.id = action_steps.milestone_id
      and goals.user_id = auth.uid()
  )
);
