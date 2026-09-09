# Idea Expansion History + Scroll Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every "Expand with AI" result per idea in a capped history table, let the user browse past runs from a new History modal, and fix the nested-ScrollView bug that makes the AI suggestion panels feel unscrollable.

**Architecture:** A new `idea_expansions` table (RLS via join to `ideas`, capped at 20 rows/idea by an `after insert` trigger) is written server-side by the `ai-expand-idea` Edge Function right after a successful Gemini call. A new `use-idea-expansions` React Query hook reads it; a shared `ExpansionSections` presentational component renders the three-section layout for both the live result panel and each history entry, with the client-side nested `ScrollView` bug removed from both.

**Tech Stack:** Expo Router, React Query v5, Supabase (Postgres/RLS/Edge Functions, Deno), NativeWind v4, TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-09-09-idea-expansion-history-design.md`

## Global Constraints

- No lint or test scripts exist in this repo (`package.json` has none, no Jest config) — per CLAUDE.md, do not claim tests passed. Each task's verification is `npx tsc --noEmit` plus the manual/SQL checks the spec calls for, not a Jest red/green cycle.
- `lib/supabase.ts` is the only client-side Supabase client module — never instantiate a client elsewhere.
- Gemini runs only from Edge Functions, never from React Native.
- Reads flow through React Query with a stable key; mutations/writes emit via `lib/data-events.ts` (`useRef(Symbol())` source, ignore own events).
- RLS must prove same-user ownership on every table; never weaken it for convenience.
- Use named Tailwind tokens (`rounded-*`, spacing scale) — no raw numeric radii.
- No supabase CLI is installed locally (`supabase` command not found) — apply the migration and regenerate types via the `mcp__supabase__*` tools, not `supabase db push`/`supabase gen types` on the command line.

---

## Task 1: Migration — `idea_expansions` table, RLS, retention trigger

**Files:**
- Create: `supabase/migrations/20260909130000_create_idea_expansions.sql`

**Interfaces:**
- Produces: table `idea_expansions(id uuid pk, idea_id uuid fk->ideas.id on delete cascade, questions text[], angles text[], related text[], created_at timestamptz)`, RLS policy `own_idea_expansions`, trigger `trim_idea_expansions_trigger` capping at 20 rows per `idea_id`.

- [ ] **Step 1: Write the migration file**

```sql
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
```

- [ ] **Step 2: Apply the migration**

Use `mcp__supabase__apply_migration` with `name: "create_idea_expansions"` and the SQL above (the CLI is not installed locally).

- [ ] **Step 3: Verify the table, policy, and trigger exist**

Use `mcp__supabase__list_tables` to confirm `idea_expansions` appears with RLS enabled, and `mcp__supabase__execute_sql` to run:

```sql
select tablename, policyname from pg_policies where tablename = 'idea_expansions';
select tgname from pg_trigger where tgrelid = 'idea_expansions'::regclass and not tgisinternal;
```

Expected: one policy row (`own_idea_expansions`), one trigger row (`trim_idea_expansions_trigger`).

- [ ] **Step 4: Verify RLS isolation and the retention cap with SQL**

Run (via `mcp__supabase__execute_sql`, as service role, simulating two users against one real idea id from `ideas` plus a throwaway second user id):

```sql
-- Using an existing idea's id from `ideas` (substitute a real id):
-- insert 21 rows for that idea, confirm only 20 remain, newest kept.
select count(*) from idea_expansions where idea_id = '<idea-id>';
-- Expected after inserting 21 rows in Step 2's session: 20.
```

Also confirm cross-user isolation by checking the policy definition proves ownership through the `ideas` join (already verified structurally in Step 3 — no separate two-user harness needed since this repo has no test framework to script it; the join-based policy is the same shape as the existing `milestones` policy).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260909130000_create_idea_expansions.sql
git commit -m "Add idea_expansions table with RLS and 20-row retention cap"
```

---

## Task 2: Regenerate generated types + add `IdeaExpansion` alias

**Files:**
- Modify: `types/database.generated.ts` (regenerated, not hand-edited)
- Modify: `types/index.ts`

**Interfaces:**
- Produces: `IdeaExpansion` type (`Database['public']['Tables']['idea_expansions']['Row']`) for hooks/components to import from `types/index.ts`.

- [ ] **Step 1: Regenerate the generated types file**

Use `mcp__supabase__generate_typescript_types` and overwrite `types/database.generated.ts` with the result (per CLAUDE.md: never hand-edit this file, and don't open it in full — 34k chars).

- [ ] **Step 2: Add the alias**

In `types/index.ts`, add after the existing `Task` exports:

```ts
export type IdeaExpansionInsert = Database['public']['Tables']['idea_expansions']['Insert'];
export type IdeaExpansion       = Database['public']['Tables']['idea_expansions']['Row'];
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors (the alias isn't consumed yet, but the type must resolve).

- [ ] **Step 4: Commit**

```bash
git add types/database.generated.ts types/index.ts
git commit -m "Regenerate types for idea_expansions and add IdeaExpansion alias"
```

---

## Task 3: `data-events` topic for idea expansions

**Files:**
- Modify: `lib/data-events.ts:1-7` (the `DataTopic` union)

**Interfaces:**
- Produces: `DataTopic` now includes `'idea-expansions'`.

- [ ] **Step 1: Add the topic**

```ts
export type DataTopic =
  | 'categories'
  | 'tags'
  | 'ideas'
  | 'projects'
  | 'goals'
  | 'tasks'
  | 'idea-expansions';
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/data-events.ts
git commit -m "Add idea-expansions data-events topic"
```

---

## Task 4: Edge Function — write history row on successful expand

**Files:**
- Modify: `supabase/functions/ai-expand-idea/index.ts`

**Interfaces:**
- Consumes: `getAuthedClient(req)` → `{ client, userId }` (`supabase/functions/_shared/auth.ts`); `clamp`, `MAX_TEXT_LENGTH`, `MAX_TITLE_LENGTH` (`_shared/validation.ts`).
- Produces: request body now also accepts `ideaId?: string`; on a valid `ExpandResult`, best-effort inserts one row into `idea_expansions` before returning `ok(parsed)`. Response shape (`ExpandResult`) is unchanged — this is additive and non-blocking.

- [ ] **Step 1: Accept `ideaId` in the request body and insert the history row**

Replace the body-parsing and success-path lines:

```ts
    let body: { ideaTitle?: string; ideaDescription?: string; ideaId?: string };
    try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }

    const ideaTitle = clamp(body.ideaTitle?.trim(), MAX_TITLE_LENGTH);
    const ideaDescription = clamp(body.ideaDescription?.trim(), MAX_TEXT_LENGTH);
    const ideaId = body.ideaId?.trim();
    if (!ideaTitle) return badRequest('ideaTitle is required');
```

and at the end of the success path, before `return ok(parsed);`:

```ts
    let parsed: unknown;
    try { parsed = parseJsonObject(raw); } catch { return badGateway('Model returned invalid JSON'); }
    if (!isValid(parsed)) return badGateway();

    if (ideaId) {
      const { error: insertError } = await authed.client.from('idea_expansions').insert({
        idea_id: ideaId,
        questions: parsed.questions,
        angles: parsed.angles,
        related: parsed.related,
      });
      // Best-effort: history is supplementary, never blocks returning the
      // expansion result the user is waiting on. RLS also rejects an
      // ideaId that isn't the caller's, which lands here rather than failing
      // the request.
      if (insertError) console.error('idea_expansions insert failed', insertError);
    }

    return ok(parsed);
```

- [ ] **Step 2: Verify types and structure**

Run: `npx tsc --noEmit` (Deno Edge Functions aren't covered by the app's `tsc` project, so also re-read the diff to confirm `authed.client` and `parsed.questions`/`.angles`/`.related` match the `ExpandResult` type from `isValid`'s type guard — `parsed` is narrowed to `ExpandResult` after the `isValid` check).

- [ ] **Step 3: Deploy and manually verify**

Use `mcp__supabase__deploy_edge_function` for `ai-expand-idea`. Then, from the running app (once Task 8 wires `ideaId` through), run "Expand with AI" once and confirm via `mcp__supabase__execute_sql`:

```sql
select idea_id, created_at from idea_expansions order by created_at desc limit 1;
```

Expected: one new row matching the idea just expanded. (If Task 8 isn't done yet, defer this manual check to Task 8's verification step — the code change here is still committable on its own since old clients simply omit `ideaId` and the function behaves exactly as before.)

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ai-expand-idea/index.ts
git commit -m "Write idea_expansions history row from ai-expand-idea"
```

---

## Task 5: Client hook — thread `ideaId` through `expandIdea` and emit the topic

**Files:**
- Modify: `hooks/use-ai.ts`

**Interfaces:**
- Consumes: `emitDataChange` (`lib/data-events.ts`), `callEdgeFunction<T>` (same file).
- Produces: `expandIdea(ideaId: string, ideaTitle: string, ideaDescription?: string)` — signature change (previously `expandIdea(ideaTitle, ideaDescription)`); `ExpandInput` now includes `ideaId`.

- [ ] **Step 1: Update `ExpandInput` and `expandIdea`**

```ts
export type ExpandInput = CategoriseInput & { ideaId: string };
```

Replace the `expandIdea` definition:

```ts
  const expandIdea = async (ideaId: string, ideaTitle: string, ideaDescription?: string) => {
    const result = await run(setExpandState, () =>
      callEdgeFunction<ExpandResult>('ai-expand-idea', { ideaId, ideaTitle, ideaDescription } satisfies ExpandInput),
    );
    if (result.data) emitDataChange('idea-expansions', source.current);
    return result;
  };
```

Add the source ref near the other `useState` calls inside `useAI()`:

```ts
  const source = useRef(Symbol('ai'));
```

(`useRef` needs adding to the `react` import at the top of the file, alongside the existing `useState`.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: errors at every existing call site of `expandIdea(title, description)` (there is exactly one, in `app/(app)/ideas/[id].tsx`) — confirming the signature change is caught. This call site is fixed in Task 8.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-ai.ts
git commit -m "Thread ideaId through expandIdea and emit idea-expansions on success"
```

(Committing here leaves `app/(app)/ideas/[id].tsx` red under `tsc --noEmit` until Task 8 — acceptable mid-plan since Task 8 lands in the same PR/session; if executing tasks across separate reviewable units, fold Task 5 and Task 8 together instead.)

---

## Task 6: `useIdeaExpansions` read hook

**Files:**
- Create: `hooks/use-idea-expansions.ts`

**Interfaces:**
- Consumes: `supabase` (`lib/supabase.ts`), `subscribeToDataChanges` (`lib/data-events.ts`), `IdeaExpansion` (`types/index.ts`).
- Produces: `useIdeaExpansions(ideaId: string): { expansions: IdeaExpansion[]; loading: boolean; error: string | null; refetch: () => Promise<void> }`.

- [ ] **Step 1: Write the hook**

```ts
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { subscribeToDataChanges } from '../lib/data-events';
import type { IdeaExpansion } from '../types';

const queryKey = (ideaId: string) => ['idea-expansions', ideaId];

async function fetchIdeaExpansions(ideaId: string): Promise<IdeaExpansion[]> {
  const { data, error } = await supabase
    .from('idea_expansions')
    .select('*')
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useIdeaExpansions(ideaId: string) {
  const source = useRef(Symbol('idea-expansions'));
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKey(ideaId),
    queryFn: () => fetchIdeaExpansions(ideaId),
    enabled: !!ideaId,
  });

  useEffect(() => {
    return subscribeToDataChanges('idea-expansions', (eventSource) => {
      if (eventSource === source.current) return;
      queryClient.invalidateQueries({ queryKey: queryKey(ideaId) });
    });
  }, [ideaId, queryClient]);

  const refetch = async () => {
    await query.refetch();
  };

  return {
    expansions: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch,
  };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-idea-expansions.ts
git commit -m "Add useIdeaExpansions read hook"
```

---

## Task 7: Shared `ExpansionSections` presentational component

**Files:**
- Create: `components/ExpansionSections.tsx`

**Interfaces:**
- Consumes: nothing app-specific beyond `react-native` primitives.
- Produces: `<ExpansionSections questions={string[]} angles={string[]} related={string[]} />`, used by both the live result panel and each history entry in Task 8.

- [ ] **Step 1: Write the component**

Extracted verbatim from the existing mapping in `app/(app)/ideas/[id].tsx` (current lines 283-295), parameterized:

```tsx
import { Text, View } from 'react-native';

const SECTION_LABELS = {
  questions: 'Questions to Explore',
  angles: 'Different Angles',
  related: 'Related Concepts',
} as const;

type Props = {
  questions: string[];
  angles: string[];
  related: string[];
};

export function ExpansionSections({ questions, angles, related }: Props) {
  const sections = { questions, angles, related };
  return (
    <View>
      {(Object.keys(SECTION_LABELS) as (keyof typeof SECTION_LABELS)[]).map((key) => (
        <View key={key} className="mb-4">
          <Text className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            {SECTION_LABELS[key]}
          </Text>
          {sections[key].map((item, i) => (
            <View key={i} className="flex-row gap-2 mb-1.5">
              <Text className="text-muted text-sm">·</Text>
              <Text className="text-foreground text-sm flex-1">{item}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
```

Note this is a plain `View`, not a `ScrollView` — the scroll fix from the spec is "don't nest a ScrollView here," which this component satisfies by construction; callers (Task 8) are responsible for putting it inside exactly one scrolling ancestor (`ModalSheet`'s own `ScrollView`).

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ExpansionSections.tsx
git commit -m "Extract ExpansionSections presentational component"
```

---

## Task 8: Wire up the idea screen — scroll fix, `ideaId`, History modal

**Files:**
- Modify: `app/(app)/ideas/[id].tsx`

**Interfaces:**
- Consumes: `useIdeaExpansions` (Task 6), `ExpansionSections` (Task 7), `expandIdea(ideaId, ideaTitle, ideaDescription?)` (Task 5), `formatShortDate`/`formatTime` (`lib/date-format.ts`).

- [ ] **Step 1: Fix the nested-ScrollView bug and swap in `ExpansionSections` for the live result**

Replace the existing expand-result block (current lines 281-297):

```tsx
        {expandState.status === 'success' && expandState.data && (
          <ExpansionSections
            questions={expandState.data.questions}
            angles={expandState.data.angles}
            related={expandState.data.related}
          />
        )}
```

Add the import:

```tsx
import { ExpansionSections } from '../../../components/ExpansionSections';
import { useIdeaExpansions } from '../../../hooks/use-idea-expansions';
import { formatShortDate, formatTime } from '../../../lib/date-format';
```

- [ ] **Step 2: Update the `handleExpand` call site for the new `expandIdea` signature**

```tsx
  const handleExpand = () => {
    expandIdea(idea.id, title.trim() || idea.title, description.trim() || (idea.description ?? undefined));
  };
```

- [ ] **Step 3: Add history state and the hook call**

Near the top of the component, alongside the other hook calls:

```tsx
  const { expansions, loading: expansionsLoading } = useIdeaExpansions(id);
  const [historyVisible, setHistoryVisible] = useState(false);
```

(`useState` is already imported.)

- [ ] **Step 4: Add the "History" button**

After the existing `AIButton` row (current lines 210-227), add a right-aligned compact button:

```tsx
        <View className="flex-row justify-end mb-5 -mt-2">
          <AIButton
            label="History"
            icon="time-outline"
            compact
            onPress={() => setHistoryVisible(true)}
          />
        </View>
```

- [ ] **Step 5: Add the History `ModalSheet`**

After the existing `</ModalSheet>` that closes the "Expand with AI" sheet (current line 298):

```tsx
      <ModalSheet visible={historyVisible} onClose={() => setHistoryVisible(false)} title="Suggestion History">
        {expansionsLoading && (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        {!expansionsLoading && expansions.length === 0 && (
          <Text className="text-muted text-sm">No AI suggestions yet for this idea.</Text>
        )}
        {expansions.map((expansion, i) => (
          <View key={expansion.id} className={i > 0 ? 'mt-4 pt-4 border-t border-border' : ''}>
            <Text className="text-muted text-xs mb-3">
              {formatShortDate(new Date(expansion.created_at))} · {formatTime(new Date(expansion.created_at))}
            </Text>
            <ExpansionSections
              questions={expansion.questions}
              angles={expansion.angles}
              related={expansion.related}
            />
          </View>
        ))}
      </ModalSheet>
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (this also clears the errors Task 5 introduced at this call site).

- [ ] **Step 7: Manual verification (start Expo, per CLAUDE.md's "start Expo with the relevant target when practical")**

1. Open an idea, tap "Expand with AI" — confirm the result panel scrolls fully with no content cut off (regression check for the nested-ScrollView fix).
2. Tap "Expand with AI" again on the same idea (a second run) — confirm it succeeds.
3. Tap "History" — confirm both runs appear, newest first, each timestamped and fully scrollable.
4. Open an idea that has never been expanded — tap "History" — confirm the empty state ("No AI suggestions yet for this idea.") renders with no extra phantom spacing.

- [ ] **Step 8: Commit**

```bash
git add app/\(app\)/ideas/\[id\].tsx
git commit -m "Add expansion history modal and fix nested-ScrollView bug on idea screen"
```

---

## Plan Self-Review Notes

- **Spec coverage:** scroll fix (Tasks 1 note in spec → Task 8 Step 1/Task 7), schema+trigger (Task 1), server-side write (Task 4), read hook (Task 6), UI history modal + empty state (Task 8), shared section-rendering component to avoid duplicating the mapping JSX (Task 7), type regeneration (Task 2), data-events topic (Task 3). All spec sections have a task.
- **Type consistency:** `expandIdea(ideaId, ideaTitle, ideaDescription?)` signature is identical between Task 5's definition and Task 8's call site. `ExpansionSections` props (`questions`, `angles`, `related`) match both `ExpandResult` (live) and `IdeaExpansion` (history) field names exactly, so no adapter is needed at either call site.
- **Non-goals confirmed unimplemented:** no rate limiting, no edit/delete of history entries, no cross-idea view — none of the tasks above add any of these.
