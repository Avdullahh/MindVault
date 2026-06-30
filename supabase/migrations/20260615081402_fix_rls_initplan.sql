-- Wrap auth.uid() in (select auth.uid()) so Postgres evaluates it once
-- per statement rather than once per row (auth_rls_initplan advisor warning).

-- Direct ownership tables

drop policy if exists "own_categories" on public.categories;
create policy "own_categories" on public.categories for all
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "own_tags" on public.tags;
create policy "own_tags" on public.tags for all
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "own_projects" on public.projects;
create policy "own_projects" on public.projects for all using (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = projects.category_id
        and categories.user_id = (select auth.uid())
    )
  )
) with check (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = projects.category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "own_ideas" on public.ideas;
create policy "own_ideas" on public.ideas for all using (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = ideas.category_id
        and categories.user_id = (select auth.uid())
    )
  )
) with check (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = ideas.category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "own_goals" on public.goals;
create policy "own_goals" on public.goals for all using (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = goals.category_id
        and categories.user_id = (select auth.uid())
    )
  )
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
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = goals.category_id
        and categories.user_id = (select auth.uid())
    )
  )
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
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = tasks.category_id
        and categories.user_id = (select auth.uid())
    )
  )
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
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = tasks.category_id
        and categories.user_id = (select auth.uid())
    )
  )
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
        and projects.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "own_milestones" on public.milestones;
create policy "own_milestones" on public.milestones for all using (
  exists (
    select 1 from public.goals
    where goals.id = milestones.goal_id
      and goals.user_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.goals
    where goals.id = milestones.goal_id
      and goals.user_id = (select auth.uid())
  )
);

drop policy if exists "own_action_steps" on public.action_steps;
create policy "own_action_steps" on public.action_steps for all using (
  exists (
    select 1 from public.milestones
    join public.goals on goals.id = milestones.goal_id
    where milestones.id = action_steps.milestone_id
      and goals.user_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.milestones
    join public.goals on goals.id = milestones.goal_id
    where milestones.id = action_steps.milestone_id
      and goals.user_id = (select auth.uid())
  )
);

-- Junction tables

drop policy if exists "own_idea_tags" on public.idea_tags;
create policy "own_idea_tags" on public.idea_tags for all using (
  exists (
    select 1 from public.ideas
    join public.tags on tags.id = idea_tags.tag_id
    where ideas.id = idea_tags.idea_id
      and ideas.user_id = (select auth.uid())
      and tags.user_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.ideas
    join public.tags on tags.id = idea_tags.tag_id
    where ideas.id = idea_tags.idea_id
      and ideas.user_id = (select auth.uid())
      and tags.user_id = (select auth.uid())
  )
);

drop policy if exists "own_project_ideas" on public.project_ideas;
create policy "own_project_ideas" on public.project_ideas for all using (
  exists (
    select 1 from public.projects
    join public.ideas on ideas.id = project_ideas.idea_id
    where projects.id = project_ideas.project_id
      and projects.user_id = (select auth.uid())
      and ideas.user_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.projects
    join public.ideas on ideas.id = project_ideas.idea_id
    where projects.id = project_ideas.project_id
      and projects.user_id = (select auth.uid())
      and ideas.user_id = (select auth.uid())
  )
);

drop policy if exists "own_goal_ideas" on public.goal_ideas;
create policy "own_goal_ideas" on public.goal_ideas for all using (
  exists (
    select 1 from public.goals
    join public.ideas on ideas.id = goal_ideas.idea_id
    where goals.id = goal_ideas.goal_id
      and goals.user_id = (select auth.uid())
      and ideas.user_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.goals
    join public.ideas on ideas.id = goal_ideas.idea_id
    where goals.id = goal_ideas.goal_id
      and goals.user_id = (select auth.uid())
      and ideas.user_id = (select auth.uid())
  )
);

drop policy if exists "own_task_ideas" on public.task_ideas;
create policy "own_task_ideas" on public.task_ideas for all using (
  exists (
    select 1 from public.tasks
    join public.ideas on ideas.id = task_ideas.idea_id
    where tasks.id = task_ideas.task_id
      and tasks.user_id = (select auth.uid())
      and ideas.user_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.tasks
    join public.ideas on ideas.id = task_ideas.idea_id
    where tasks.id = task_ideas.task_id
      and tasks.user_id = (select auth.uid())
      and ideas.user_id = (select auth.uid())
  )
);

drop policy if exists "own_task_goals" on public.task_goals;
create policy "own_task_goals" on public.task_goals for all using (
  exists (
    select 1 from public.tasks
    join public.goals on goals.id = task_goals.goal_id
    where tasks.id = task_goals.task_id
      and tasks.user_id = (select auth.uid())
      and goals.user_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.tasks
    join public.goals on goals.id = task_goals.goal_id
    where tasks.id = task_goals.task_id
      and tasks.user_id = (select auth.uid())
      and goals.user_id = (select auth.uid())
  )
);

drop policy if exists "own_goal_projects" on public.goal_projects;
create policy "own_goal_projects" on public.goal_projects for all using (
  exists (
    select 1 from public.goals
    join public.projects on projects.id = goal_projects.project_id
    where goals.id = goal_projects.goal_id
      and goals.user_id = (select auth.uid())
      and projects.user_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.goals
    join public.projects on projects.id = goal_projects.project_id
    where goals.id = goal_projects.goal_id
      and goals.user_id = (select auth.uid())
      and projects.user_id = (select auth.uid())
  )
);
