# UI Enhancement — Phase 2 Punch List

**Source:** Loveable preview `https://id-preview--f710319e-d27d-412b-88f7-9a317613f7aa.lovable.app/` (static web mockup, list screens + Settings only — no detail routes).

## Context

Phase 1 (already merged) added the design-token foundation and data layer. Auditing the app against the Loveable mockup screen-by-screen shows the token/component system it specified is **already substantially implemented**: `theme/colors.ts`'s `primary` (`#b8860b`) matches the mockup's amber exactly, and `EntityCard`, `GoalCard`, `EntityListScreen`, and `settings.tsx` already reproduce the mockup's card/badge/section-header patterns closely.

So phase 2 is **not** a rebuild. It's a targeted list of concrete visual/behavioral deltas found by comparing each screen, plus one pre-existing rule violation surfaced along the way. Approach A from the prior discussion: fix only what's actually different.

## Punch list

1. **Mind Map stat cards lack per-type accent color.**
   The mockup gives each of the three stat cards (Ideas/Projects/Goals) a colored top bar — amber, blue, green — matching the node colors used in the graph below. `app/(app)/mind-map.tsx` currently renders all three identically (`bg-surface border-border`, no accent). Add a thin colored top bar (or left bar) per card, reusing whatever color already drives node coloring in `RelationshipGraph`/`use-entity-graph`, so the legend is self-evident without a separate key.

2. **Mind Map graph isn't framed as a labeled section.**
   The mockup wraps the graph in a card headed by an eyebrow ("GRAPH") + title ("Connections"), consistent with the `SectionHeader` pattern already used on Home. `RelationshipGraph` currently renders standalone under the stat row. Wrap it with a `SectionHeader`-style label ("Connections") for consistency with Home/Ideas/Goals/Projects, all of which use section headers above their list content.

3. **Settings "Appearance" control differs in shape.**
   Mockup: a single horizontal 3-segment control (System / Light / Dark) with a caption below it explaining the behavior ("System follows your device. Depth in dark mode comes from lighter surfaces and hairlines, not shadows."). Current `settings.tsx` renders the three options as a vertical stacked list of rows instead. Since the caption text mockup shows is literally restating this repo's own dark-mode depth rule (`CLAUDE.md`: light uses `shadow-e1/e2/e3`, dark uses surface+hairline), port both: convert to a horizontal segmented control, and add the explanatory caption underneath — it documents real, user-visible behavior, not filler copy.

4. **Settings sign-out button isn't styled as a destructive action.**
   Mockup gives Sign Out a tinted-red background (danger surface), not just red text on a neutral card. Current `settings.tsx` sign-out row uses the same `bg-surface border-border` card treatment as every other row, with only the label/icon colored `destructive`. Give it a destructive-tinted background so it reads as different-in-kind from navigation rows, matching the mockup and giving the irreversible action appropriate visual weight.

5. **Search inputs are missing the leading search icon.**
   Mockup's search fields (Ideas/Goals/Projects) show a magnifying-glass icon inside the input, left of the placeholder text. `EntityListScreen`'s `TextInput` currently has no icon. Add a small `Ionicons name="search-outline"` inside the field (absolute-positioned or wrapped in a row), consistent across all three list screens since they all go through `EntityListScreen`.

6. **Pre-existing rule violation found during the audit (unrelated to the mockup, but touched by #5's file):** `EntityListScreen`'s floating action button uses `shadow-lg` directly (`components/ui/EntityListScreen.tsx:117`), which conflicts with `CLAUDE.md`'s rule that `shadow-*` can't switch between themes and must go through the `Card` primitive (`shadow-e1/e2/e3` in light, `surface`/`surface-2` + hairline in dark). Fix while in this file: replace the raw `shadow-lg` with the same light/dark depth treatment `Card` already encapsulates, or extract a small `FAB`-appropriate variant of it so screens keep not reaching for `shadow-*` directly.

## Explicitly out of scope

- Ideas/Goals/Projects **detail** screens — the mockup has no working detail routes to diff against, so there's nothing concrete to compare. Not touched in this pass.
- Any structural rebuild of cards, list screens, or navigation (sidebar vs. tab bar) — the tab bar is the correct pattern for this iPad/iOS app; the mockup's sidebar is a web-only artifact of Loveable's shell and is not being ported.
- Settings "Change password" as a separate flow/button vs. the current always-visible inline field — cosmetic-only difference with no behavior change implied; not worth the added navigation complexity for this pass.

## Testing

- `npx tsc --noEmit` after changes.
- Manual pass in Expo (iPad target) for items 1–5: Mind Map screen, all three list screens' search bars and FABs, Settings appearance section and sign-out row, in both light and dark mode (per `CLAUDE.md`'s shadow/depth rule, item 6 must be checked in both themes specifically).
