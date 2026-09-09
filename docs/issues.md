# MindVault Issues

> **Agents - skip the Completed section.** Everything listed there is resolved, merged, and live. Jump straight to [Open Issues](#open-issues).

---

## Completed

- In-app account deletion (Apple guideline 5.1.1(v)): new `delete-account` Edge Function (service-role `auth.admin.deleteUser`, relies on existing `ON DELETE CASCADE` from every `user_id` FK to clean up all rows) plus a confirmation modal and "Delete account" action in Settings, wired through `deleteAccount()` in `context/auth-context.tsx`
- Release-readiness sweep: excluded `lib/__tests__/**` from `tsc` (was failing `npx tsc --noEmit` with no test runner installed), added the `expo-image-picker` config plugin with a `photosPermission` string (avatar picker had no Info.plist usage description), and fixed `ChunkedSecureStore.setItem` in `lib/supabase.ts` to write session chunks before the `.count` key and prune leftover chunks from a shorter value (previously a mid-write failure could point `.count` at missing chunks and silently drop the session)
- Goals link to both ideas and projects
- Project tasks selectable and displayed as read-only milestones on a linked goal
- Projects link to both ideas and goals
- New app icon (MV shield + brain mark) and updated login branding
- UI centralised - consistent padding and horizontal centering across all screens
- Dark-only MVP interface restored; theme switching removed until a later release
- Calendar event time format compacted (e.g. `9am`, `10:30pm`) - no more overflow
- Settings page includes personal information management (name, email, password, avatar, sign out)
- Calendar events timezone bug fixed - times no longer shift by UTC offset on read-back

---

## Open Issues

### Issue 10 - Pro entitlement gate is permanently open

**Status:** Open

`supabase/functions/_shared/entitlement.ts` hardcodes `return true`, granting every user Pro features for free. Needs a real RevenueCat server-side entitlement check before App Store submission.

---

### Issue 11 - `tasks.project_id` uses ON DELETE CASCADE instead of SET NULL

**Status:** Closed - working as intended, not a bug

Migration `20240106000000_harden_direct_rls.sql` later adds `constraint tasks_project_required check (project_id is not null) not valid` - tasks are project-scoped by design (see CLAUDE.md: "Tasks are project-scoped... do not create tasks without project_id"). `NOT VALID` only skips validating pre-existing rows; it's still enforced on every subsequent INSERT/UPDATE. Changing the FK to `ON DELETE SET NULL` would make Postgres try to null out `project_id` on delete, immediately trip that check constraint, and abort the entire project deletion - strictly worse than the current cascade. `ON DELETE CASCADE` is correct for a NOT-NULL, project-scoped child row.

**Follow-up found while verifying this:** `select count(*) from tasks where project_id is null` on production returns **10** - pre-existing rows that violate the `tasks_project_required` invariant (the `NOT VALID` constraint doesn't retroactively enforce them). Not fixed here since deciding what happens to orphaned tasks (delete vs. reassign) is a product/data decision, not a schema one.

---

### Issue 12 - Dual goal↔project relationship is inconsistent

**Status:** Open - needs a product decision, not a schema fix

Investigated: this isn't accidental duplication, it's two different relationships that happen to share a table pair. `goals.project_id` is the goal's "home" project, set once at creation (`hooks/use-goals.ts`). `goal_projects` is an intentional many-to-many for linking a goal to *additional* projects later, built and used from `app/(app)/goals/[id].tsx` and `app/(app)/projects/[id].tsx`, which already merge and de-duplicate both sources for display (`projects/[id].tsx:65-69`). Removing either path removes a real, currently-used cross-linking capability, which CLAUDE.md's "ideas, goals, tasks, and projects must stay meaningfully cross-linkable" rule protects - same category as the entitlement stub (Issue 10): a product call, not mine to make unilaterally. Leaving open pending a decision:

- **Option A (recommended):** keep both, rename/document the distinction clearly (e.g. `project_id` = "primary project", `goal_projects` = "also linked to") so it reads as intentional rather than leftover.
- **Option B:** collapse to junction-only - drop `goals.project_id`, migrate existing values into `goal_projects`, update every read site. Loses the "one primary project" concept the UI currently uses to group goals under a project by default.

**Separate, smaller finding from this investigation:** `app/(app)/goals/[id].tsx` and `app/(app)/projects/[id].tsx` call `supabase.from('goal_projects')` directly from route files instead of through a hook, which violates CLAUDE.md's "hooks/ owns all Supabase reads/writes" rule. Worth a `use-goal-projects` hook regardless of which option above is chosen - not done here to keep this change scoped to the ticket.

---

### Issue 13 - No input length limits on Edge Function prompts

**Status:** Fixed and deployed

Added `supabase/functions/_shared/validation.ts` and applied it to `ai-plan-goal` and `ai-expand-idea` as the ticket named, plus `ai-categorise` (identical `{ideaTitle, ideaDescription}` shape, same gap, not named in the ticket - the defect is the property "no unbounded user text reaches Gemini," and two of three functions wouldn't have met it).

**Caught during review before this was reported done:** the first version rejected over-length input with a 400. Checked production data (`select max(length(main_goal))... from projects`) and found 2 real projects with `main_goal` up to 397 chars - `main_goal` is passed as `goalTitle` to `ai-plan-goal` from `projects/[id].tsx`, so those users' "Plan with AI" would have started failing. Changed to **clamp (truncate)** instead of reject - `MAX_TITLE_LENGTH` 300, `MAX_TEXT_LENGTH` 4000 - since the actual property needed is "bounded text reaches Gemini," which truncation satisfies without breaking a feature on data that predates the cap. Redeployed all three functions with the fix.

---

### Issue 14 - `ai-morning-brief` timezone calculation is fragile

**Status:** Fixed and deployed (deployed together with Issue 15, same file)

The `localDayBoundsUTC` helper this ticket names is gone already - removed with `calendar_events` (see `docs/superpowers/plans/2026-06-13-remove-calendar.md`), so that specific fragility no longer exists. But investigating turned up the timezone handling that replaced it was still broken: `hooks/use-ai.ts` sends `{ timezone }` in the request body, but `ai-morning-brief/index.ts` never called `req.json()` at all, so the parameter was silently dropped and `today` was always formatted in the server's (UTC) timezone - wrong day near midnight for any non-UTC user. Fixed: parse the body, pass `timeZone: body.timezone || 'UTC'` to `Intl.DateTimeFormat`, with a try/catch fallback to UTC since `Intl` throws on an unrecognised IANA zone string rather than 500ing the whole brief. Also removed a stale `events: string[]` field from `BriefResult` in `hooks/use-ai.ts` - the server never returned it (dropped when calendar events were removed) and nothing read it, but the type lied about the shape.

---

### Issue 15 - Morning brief always resurfaces the same idea

**Status:** Fixed and deployed

PostgREST/`order()` can't sort by `random()`, so switched `.limit(1)` to `.limit(5)` (still ordered `last_viewed_at ASC NULLS FIRST`, so it's still the 5 least-recently-viewed / never-viewed ideas) and pick one at random from that batch server-side. No need to write `last_viewed_at` back - re-randomizing each call already rotates which idea surfaces. Deployed together with Issue 14 (same file).

---


### Issue 9 - Research competitor apps and propose UI/UX improvements

**Status:** Proposal ready - awaiting implementation sign-off

Research focus: apps that blend second-brain and productivity - Notion, Obsidian, Roam Research, Things 3, Todoist, TickTick, Fantastical, Cron.

Goal: identify the strongest UI/UX patterns these apps use that MindVault is currently missing or doing worse, then present a written proposal for user approval before building anything.

**Do not implement anything under this issue until the proposal has been reviewed and explicitly signed off.**
