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

**Status:** Open

Migration `20240104` adds `tasks.project_id` with `ON DELETE CASCADE`, meaning deleting a project silently deletes all its tasks. Every other nullable FK in the schema uses `ON DELETE SET NULL`. This should be changed to match.

---

### Issue 12 - Dual goal↔project relationship is inconsistent

**Status:** Open

Goals can be linked to a project via both `goals.project_id` (direct FK, initial schema) and the `goal_projects` junction table (migration 20240107). Two paths exist simultaneously with no enforcement that they stay in sync. One should be removed or the two should be reconciled.

---

### Issue 13 - No input length limits on Edge Function prompts

**Status:** Open

`ai-plan-goal` and `ai-expand-idea` inject `ideaTitle`, `ideaDescription`, and `context` directly into Gemini prompts with no size cap. An arbitrarily long input causes an expensive API call and opens a prompt injection surface. Add server-side length validation before the Gemini call.

---

### Issue 14 - `ai-morning-brief` timezone calculation is fragile

**Status:** Open

`localDayBoundsUTC` in `ai-morning-brief/index.ts` parses the output of `Intl.DateTimeFormat` (locale `en-GB`) by splitting on `:` to extract hours/minutes/seconds. Any formatting variation in Deno's `Intl` implementation (e.g. Unicode spaces, AM/PM suffix) would produce `NaN` offsets and silently return wrong day-boundary timestamps.

---

### Issue 15 - Morning brief always resurfaces the same idea

**Status:** Open

`ai-morning-brief` queries ideas ordered by `last_viewed_at ASC NULLS FIRST LIMIT 1`. When multiple ideas have never been viewed (`last_viewed_at IS NULL`) the same one is always returned (lowest insertion order). A secondary sort or random tiebreaker is needed so different ideas are surfaced over time.

---


### Issue 9 - Research competitor apps and propose UI/UX improvements

**Status:** Proposal ready - awaiting implementation sign-off

Research focus: apps that blend second-brain and productivity - Notion, Obsidian, Roam Research, Things 3, Todoist, TickTick, Fantastical, Cron.

Goal: identify the strongest UI/UX patterns these apps use that MindVault is currently missing or doing worse, then present a written proposal for user approval before building anything.

**Do not implement anything under this issue until the proposal has been reviewed and explicitly signed off.**
