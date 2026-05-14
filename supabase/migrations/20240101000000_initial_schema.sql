-- ─── EXTENSIONS ────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ─── CORE ENTITIES ─────────────────────────────────────────────────────────

create table categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  is_protected boolean not null default false,
  created_at  timestamptz not null default now(),
  unique(user_id, name)
);

create table tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  title       text not null,
  main_goal   text,
  created_at  timestamptz not null default now()
);

create table ideas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  category_id    uuid references categories(id) on delete set null,
  title          text not null,
  description    text,
  last_viewed_at timestamptz,
  created_at     timestamptz not null default now()
);

create table goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  title       text not null,
  deadline    date,
  priority    text check (priority in ('high', 'medium', 'low')),
  created_at  timestamptz not null default now()
);

create table calendar_events (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  category_id            uuid references categories(id) on delete set null,
  title                  text not null,
  start_at               timestamptz not null,
  end_at                 timestamptz,
  all_day                boolean not null default false,
  notes                  text,
  apple_calendar_event_id text,
  created_at             timestamptz not null default now()
);

-- ─── TASK-RELATED ───────────────────────────────────────────────────────────

create table tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  category_id       uuid references categories(id) on delete set null,
  calendar_event_id uuid references calendar_events(id) on delete set null,
  title             text not null,
  due_date          date,
  priority          text check (priority in ('high', 'medium', 'low')),
  notes             text,
  done              boolean not null default false,
  created_at        timestamptz not null default now()
);

create table milestones (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null references goals(id) on delete cascade,
  title      text not null,
  position   integer not null,
  created_at timestamptz not null default now()
);

create table action_steps (
  id           uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references milestones(id) on delete cascade,
  title        text not null,
  done         boolean not null default false,
  position     integer not null,
  created_at   timestamptz not null default now()
);

-- ─── JUNCTION TABLES ────────────────────────────────────────────────────────

create table idea_tags (
  idea_id uuid not null references ideas(id) on delete cascade,
  tag_id  uuid not null references tags(id) on delete cascade,
  primary key (idea_id, tag_id)
);

create table project_ideas (
  project_id uuid not null references projects(id) on delete cascade,
  idea_id    uuid not null references ideas(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (project_id, idea_id)
);

create table goal_ideas (
  goal_id uuid not null references goals(id) on delete cascade,
  idea_id uuid not null references ideas(id) on delete cascade,
  primary key (goal_id, idea_id)
);

create table task_ideas (
  task_id uuid not null references tasks(id) on delete cascade,
  idea_id uuid not null references ideas(id) on delete cascade,
  primary key (task_id, idea_id)
);

create table task_goals (
  task_id uuid not null references tasks(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  primary key (task_id, goal_id)
);

create table event_ideas (
  event_id uuid not null references calendar_events(id) on delete cascade,
  idea_id  uuid not null references ideas(id) on delete cascade,
  primary key (event_id, idea_id)
);

create table event_goals (
  event_id uuid not null references calendar_events(id) on delete cascade,
  goal_id  uuid not null references goals(id) on delete cascade,
  primary key (event_id, goal_id)
);

create table event_tasks (
  event_id uuid not null references calendar_events(id) on delete cascade,
  task_id  uuid not null references tasks(id) on delete cascade,
  primary key (event_id, task_id)
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────

create index on ideas(user_id);
create index on ideas(last_viewed_at);        -- resurfacing engine
create index on goals(user_id);
create index on goals(project_id);
create index on tasks(user_id);
create index on tasks(due_date);
create index on calendar_events(user_id);
create index on calendar_events(start_at);   -- calendar date range queries
create index on milestones(goal_id);
create index on action_steps(milestone_id);

-- ─── ENABLE RLS ─────────────────────────────────────────────────────────────

alter table categories       enable row level security;
alter table tags             enable row level security;
alter table projects         enable row level security;
alter table ideas            enable row level security;
alter table goals            enable row level security;
alter table calendar_events  enable row level security;
alter table tasks            enable row level security;
alter table milestones       enable row level security;
alter table action_steps     enable row level security;
alter table idea_tags        enable row level security;
alter table project_ideas    enable row level security;
alter table goal_ideas       enable row level security;
alter table task_ideas       enable row level security;
alter table task_goals       enable row level security;
alter table event_ideas      enable row level security;
alter table event_goals      enable row level security;
alter table event_tasks      enable row level security;

-- ─── DIRECT OWNERSHIP POLICIES ──────────────────────────────────────────────
create policy "own_categories"      on categories      for all using (auth.uid() = user_id);
create policy "own_tags"            on tags            for all using (auth.uid() = user_id);
create policy "own_projects"        on projects        for all using (auth.uid() = user_id);
create policy "own_ideas"           on ideas           for all using (auth.uid() = user_id);
create policy "own_goals"           on goals           for all using (auth.uid() = user_id);
create policy "own_calendar_events" on calendar_events for all using (auth.uid() = user_id);
create policy "own_tasks"           on tasks           for all using (auth.uid() = user_id);

-- ─── INHERITED OWNERSHIP — milestones and action_steps ──────────────────────
create policy "own_milestones" on milestones for all using (
  exists (select 1 from goals where goals.id = milestones.goal_id and goals.user_id = auth.uid())
);

create policy "own_action_steps" on action_steps for all using (
  exists (
    select 1 from milestones
    join goals on goals.id = milestones.goal_id
    where milestones.id = action_steps.milestone_id
    and goals.user_id = auth.uid()
  )
);

-- ─── JUNCTION TABLE POLICIES ─────────────────────────────────────────────────

create policy "own_idea_tags" on idea_tags for all using (
  exists (select 1 from ideas where ideas.id = idea_tags.idea_id and ideas.user_id = auth.uid())
);

create policy "own_project_ideas" on project_ideas for all using (
  exists (select 1 from projects where projects.id = project_ideas.project_id and projects.user_id = auth.uid())
);

create policy "own_goal_ideas" on goal_ideas for all using (
  exists (select 1 from goals where goals.id = goal_ideas.goal_id and goals.user_id = auth.uid())
);

create policy "own_task_ideas" on task_ideas for all using (
  exists (select 1 from tasks where tasks.id = task_ideas.task_id and tasks.user_id = auth.uid())
);

create policy "own_task_goals" on task_goals for all using (
  exists (select 1 from tasks where tasks.id = task_goals.task_id and tasks.user_id = auth.uid())
);

create policy "own_event_ideas" on event_ideas for all using (
  exists (select 1 from calendar_events where calendar_events.id = event_ideas.event_id and calendar_events.user_id = auth.uid())
);

create policy "own_event_goals" on event_goals for all using (
  exists (select 1 from calendar_events where calendar_events.id = event_goals.event_id and calendar_events.user_id = auth.uid())
);

create policy "own_event_tasks" on event_tasks for all using (
  exists (select 1 from calendar_events where calendar_events.id = event_tasks.event_id and calendar_events.user_id = auth.uid())
);

-- ─── SEED DEFAULT CATEGORIES ──────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.categories (user_id, name, is_protected) values
    (new.id, 'Business',      false),
    (new.id, 'Creative',      false),
    (new.id, 'Entertainment', false),
    (new.id, 'Family',        false),
    (new.id, 'Finance',       false),
    (new.id, 'Fitness',       false),
    (new.id, 'Health',        false),
    (new.id, 'Hobbies',       false),
    (new.id, 'Learning',      false),
    (new.id, 'Personal',      false),
    (new.id, 'Productivity',  false),
    (new.id, 'Research',      false),
    (new.id, 'Social',        false),
    (new.id, 'Tech',          false),
    (new.id, 'Travel',        false),
    (new.id, 'Writing',       false),
    (new.id, 'Other',         true);   -- protected, always last
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();