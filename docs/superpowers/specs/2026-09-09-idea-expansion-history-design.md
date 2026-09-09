# Idea Expansion History + Scroll Fix

**Date:** 2026-09-09
**Status:** Approved

## Problem

"Expand with AI" on the idea detail screen (`app/(app)/ideas/[id].tsx`) runs `ai-expand-idea` and shows the result in a `ModalSheet`, but:

1. The result panel is effectively unscrollable — half the content is blocked from view.
2. The result is never persisted. Closing the modal or navigating away loses it permanently; there is no way to see what the AI suggested previously for that idea.

## Root Cause (scroll bug)

`ModalSheet` (`components/ui/ModalSheet.tsx`) already wraps its `children` in a height-capped `ScrollView` (95% of available screen height). The idea screen additionally wraps the expansion sections in a *second*, nested, same-direction `ScrollView` (`app/(app)/ideas/[id].tsx:282`). Nested vertical `ScrollView`s fight each other for touch/gesture ownership on iOS, which is why scrolling feels broken/blocked rather than simply absent.

**Fix:** remove the inner `ScrollView`; render the sections in a plain `View`. The outer `ModalSheet` scroll handles the rest. This fix applies to both the existing "Expand with AI" result panel and the new history panel below.

## Goal

- Fix the nested-scroll bug so the full suggestion is always reachable.
- Persist every AI expansion per idea (not just the latest) so the user can revisit past runs.
- Cap storage per idea so history can't grow unbounded.

---

## Schema

New table `idea_expansions`, following the existing `milestones`/`action_steps` convention: no `user_id` column on the row itself — ownership is proven via a join to `ideas`, which already carries `user_id`.

```sql
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
```

**Retention cap (20 per idea):** an `after insert` trigger deletes rows for that `idea_id` beyond the 20 most recent, so the cap is enforced at the database level regardless of which client writes it:

```sql
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
```

Regenerate `types/database.generated.ts` via the Supabase CLI after this migration lands (per CLAUDE.md — needs a linked project).

## Write path

`supabase/functions/ai-expand-idea/index.ts` inserts the row itself immediately after a successful Gemini call, using the caller's authenticated Supabase client (RLS applies), then returns the result to the client as it does today. No client-side write is needed — this guarantees history can't be skipped or forged from the client, and stays consistent with "Gemini runs only from Edge Functions."

## Read path

New `hooks/use-idea-expansions.ts`, following `hooks/use-ideas.ts`:

```ts
export function useIdeaExpansions(ideaId: string) {
  // useQuery(['idea-expansions', ideaId], fetchIdeaExpansions)
  // ordered created_at desc
  // subscribed to data-events for 'idea-expansions', ignoring its own source
}
```

`ai-expand-idea`'s emit needs to reach this key too: after a successful expand call, the client-side caller (`useAI().expandIdea`) should call `emitDataChange('idea-expansions', source)` so an open history modal picks up the new row without a manual refetch. (`useAI` doesn't currently hold a `data-events` source ref — add one, matching the `useRef(Symbol())` pattern used elsewhere.)

## UI (`app/(app)/ideas/[id].tsx`)

- Remove the nested `ScrollView` around the expansion sections (root-cause fix above); render in a `View`.
- Add a "History" button next to "Expand with AI" (same `Button` primitive, small/secondary variant).
- Tapping it opens a second `ModalSheet` (title "Suggestion History") listing `useIdeaExpansions(idea.id)` results, newest first:
  - Each entry: relative/short timestamp header (e.g. `formatDistanceToNow` or existing date-formatting util if one exists — check before adding a new dependency) + the same three-section layout (`questions` / `angles` / `related`) used in the live result panel, factored into a small shared presentational component (e.g. `ExpansionSections`) so the live-result panel and history entries render identically without duplicating the mapping JSX.
  - Entries separated by a hairline divider, not individual `Card`s, to keep a long history scannable.
  - Empty state: "No AI suggestions yet for this idea." (no icon/decoration, per CLAUDE.md's "no phantom space" rule — render nothing extra).
- Both modals get the scroll fix; the outer `ModalSheet` ScrollView is the only scroll container in each.

## Non-goals

- No usage/rate limiting on how many times "Expand with AI" can be run (separate, already-identified follow-up task).
- No editing or deleting individual history entries — read-only list.
- No cross-idea history view — scoped to one idea's modal.

## Testing

- `npx tsc --noEmit`.
- Manual: run "Expand with AI" twice on the same idea; open History and confirm both runs appear, newest first, each fully scrollable with no content cut off.
- Manual: confirm the live "Expand with AI" result panel also scrolls fully now (regression check for the nested-ScrollView fix).
- Inspect the migration for RLS: confirm a second test user cannot read another user's `idea_expansions` rows (join-based policy, same shape as `milestones`).
