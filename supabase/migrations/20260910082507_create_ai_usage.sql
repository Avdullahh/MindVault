-- Shared AI usage quota: one rolling-24h counter per user, shared across all
-- AI edge functions (ai-expand-idea, ai-categorise, ai-plan-goal,
-- ai-morning-brief). There is no INSERT/UPDATE/DELETE policy for
-- `authenticated` -- a client cannot spoof or reset its own counter directly.
-- All writes go through the SECURITY DEFINER functions below.
--
-- Those functions are deliberately public + SECURITY DEFINER + granted to
-- `authenticated` (not moved to the `private` schema the way
-- private.handle_new_user was in 20260615081320_secure_definer_functions.sql)
-- because, unlike that trigger-only function, these MUST be callable via
-- `client.rpc(...)` from the edge functions' user-scoped (anon-key) client --
-- PostgREST only routes RPCs that live in an exposed schema. Each function
-- takes zero client-supplied arguments and resolves identity only via
-- `auth.uid()` internally, so a caller cannot pass another user's id, nor
-- override the limit/window (an earlier draft of this design took `p_limit`/
-- `p_window_seconds` as parameters and was flagged in review as allowing a
-- client to reset or inflate their own quota by calling the RPC directly with
-- manipulated values -- fixed by baking the limit/window in as constants).

create table public.ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

create policy "select_own_ai_usage" on public.ai_usage
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Read-only: reports current quota state without creating or mutating a row.
-- Must NOT roll the window over "as if" the caller had used it -- a screen
-- merely displaying quota state must not start the 24h window or consume it;
-- only reserve_ai_usage (called right before an actual Gemini call) does.
create or replace function public.check_ai_usage()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limit constant integer := 10;
  v_window constant integer := 86400; -- 24h, rolling from first use
  v_row public.ai_usage%rowtype;
begin
  select * into v_row from public.ai_usage where user_id = auth.uid();

  if v_row is null or v_row.window_started_at + make_interval(secs => v_window) <= now() then
    return jsonb_build_object('allowed', true, 'remaining', v_limit, 'resetAt', null);
  end if;

  return jsonb_build_object(
    'allowed', v_row.request_count < v_limit,
    'remaining', greatest(v_limit - v_row.request_count, 0),
    'resetAt', v_row.window_started_at + make_interval(secs => v_window)
  );
end;
$$;

-- The actual gate: called immediately before a Gemini call. Atomically
-- reserves one unit of quota in the same statement that enforces the limit,
-- so there is no read-then-write gap for concurrent callers to both slip
-- through (an earlier "check, then call Gemini, then increment" design was
-- flagged in review as not a hard cap under concurrency -- many requests
-- could all pass a separate check before any of them incremented).
--
-- The WHERE clause on DO UPDATE is what makes this atomic: if the caller is
-- already at the limit and their window hasn't expired, the clause is false,
-- the conflicting row is left untouched, and INSERT ... RETURNING yields no
-- row (FOUND is false) -- there is no separate SELECT ... FOR UPDATE step to
-- race against.
create or replace function public.reserve_ai_usage()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit constant integer := 10;
  v_window constant integer := 86400;
  v_row public.ai_usage%rowtype;
begin
  insert into public.ai_usage as u (user_id, window_started_at, request_count, updated_at)
  values (auth.uid(), now(), 1, now())
  on conflict (user_id) do update set
    window_started_at = case
      when u.window_started_at + make_interval(secs => v_window) <= now() then now()
      else u.window_started_at
    end,
    request_count = case
      when u.window_started_at + make_interval(secs => v_window) <= now() then 1
      else u.request_count + 1
    end,
    updated_at = now()
  where u.window_started_at + make_interval(secs => v_window) <= now() or u.request_count < v_limit
  returning * into v_row;

  if found then
    return jsonb_build_object(
      'allowed', true,
      'remaining', greatest(v_limit - v_row.request_count, 0),
      'resetAt', v_row.window_started_at + make_interval(secs => v_window)
    );
  end if;

  -- reservation refused: report current (unmodified) state
  select * into v_row from public.ai_usage where user_id = auth.uid();
  return jsonb_build_object(
    'allowed', false,
    'remaining', 0,
    'resetAt', v_row.window_started_at + make_interval(secs => v_window)
  );
end;
$$;

-- Best-effort: called only when a Gemini call fails to complete (network,
-- timeout, HTTP error -- see supabase/functions/_shared/gemini.ts's
-- GeminiRequestError), never when a response was received but rejected as
-- invalid output. That distinction is deliberate: a request that actually
-- reached Gemini and got a response consumes quota regardless of whether we
-- could parse it, so crafted input that reliably produces invalid output
-- can't be used to burn Gemini spend for free.
create or replace function public.refund_ai_usage()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.ai_usage
  set request_count = greatest(request_count - 1, 0), updated_at = now()
  where user_id = auth.uid();
end;
$$;

revoke all on function public.check_ai_usage() from public;
revoke all on function public.reserve_ai_usage() from public;
revoke all on function public.refund_ai_usage() from public;

grant execute on function public.check_ai_usage() to authenticated;
grant execute on function public.reserve_ai_usage() to authenticated;
grant execute on function public.refund_ai_usage() to authenticated;
