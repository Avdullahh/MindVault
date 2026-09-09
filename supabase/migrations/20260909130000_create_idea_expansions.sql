-- Idea expansion history: every "Expand with AI" run for an idea, capped at
-- 20 rows per idea. No user_id column on the row itself -- ownership is
-- proven via a join to ideas, matching the milestones/action_steps pattern.

create table idea_expansions (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references ideas(id) on delete cascade,
  questions text[] not null default '{}',
  angles text[] not null default '{}',
  related text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idea_expansions_idea_id_created_at_idx
  on idea_expansions(idea_id, created_at desc);

alter table idea_expansions enable row level security;

create policy "own_idea_expansions" on idea_expansions for all using (
  exists (select 1 from ideas where ideas.id = idea_expansions.idea_id and ideas.user_id = auth.uid())
);

create or replace function trim_idea_expansions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from idea_expansions
  where idea_id = new.idea_id
    and id not in (
      select id from idea_expansions
      where idea_id = new.idea_id
      order by created_at desc
      limit 20
    );
  return new;
end;
$$;

create trigger trim_idea_expansions_trigger
  after insert on idea_expansions
  for each row execute function trim_idea_expansions();
