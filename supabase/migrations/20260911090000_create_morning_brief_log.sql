-- History of "Today's Move" recommendations shown by the morning-brief edge
-- function. Two purposes: (1) let the function exclude recently-shown
-- targets so it stops repeating itself, (2) record what the user did with
-- each recommendation (acted/dismissed) as a foundation for future
-- taste-learning. `target_id` intentionally has no foreign key -- it can
-- point at ideas, goals, or projects depending on `target_type`, and rows
-- must survive the target being deleted later (history, not a live link).

create table public.morning_brief_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('idea', 'goal', 'project')),
  target_id uuid not null,
  reason text not null,
  response text check (response in ('acted', 'dismissed')),
  created_at timestamptz not null default now()
);

create index morning_brief_log_user_id_created_at_idx
  on public.morning_brief_log(user_id, created_at desc);

alter table public.morning_brief_log enable row level security;

-- Same "own row" shape for select/insert/update as idea_expansions and the
-- rest of the user-owned tables. The edge function inserts a row right
-- after generating a brief (user-scoped client, matching the
-- idea_expansions insert pattern in ai-expand-idea); the client later
-- updates `response` on that same row when the user acts on or dismisses
-- the recommendation. No delete policy -- rows are history, not editable.
--
-- The update policy's `with check` pins every column except `response` to
-- its existing value (via a correlated subquery against the pre-update
-- row), so a client can only flip `response` -- it cannot rewrite
-- target_type/target_id/reason/created_at/user_id on an existing row.
create policy "select_own_morning_brief_log" on public.morning_brief_log
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "insert_own_morning_brief_log" on public.morning_brief_log
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "update_own_morning_brief_log" on public.morning_brief_log
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.morning_brief_log existing
      where existing.id = morning_brief_log.id
        and existing.user_id = morning_brief_log.user_id
        and existing.target_type = morning_brief_log.target_type
        and existing.target_id = morning_brief_log.target_id
        and existing.reason = morning_brief_log.reason
        and existing.created_at = morning_brief_log.created_at
    )
  );
