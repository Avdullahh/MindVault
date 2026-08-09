# UI Phase 2 Punch List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close six concrete visual/behavioral gaps between the MindVault app and the phase-2 Loveable mockup, found by screen-by-screen audit (see `docs/superpowers/specs/2026-08-09-ui-phase-2-punch-list-design.md`).

**Architecture:** No new screens or data flows. All changes are presentational edits to existing components (`RelationshipGraph`, `mind-map.tsx`, `EntityListScreen`, `settings.tsx`) plus one small extraction (`SectionHeader` → shared primitive) to avoid duplicating a pattern `mind-map.tsx` now needs too.

**Tech Stack:** Expo Router, NativeWind v4 (Tailwind classes), React Native, TypeScript strict. No test runner exists in this repo (`CLAUDE.md`: "no lint or test scripts") — verification is `npx tsc --noEmit` plus manual visual check in Expo, in both light and dark mode.

## Global Constraints

- Colour is the only theme-reactive token category; everything else (spacing, radius) is static Tailwind config — use named radii (`rounded-control`, `rounded-pill`, etc.), never raw `rounded-2xl`-style classes, in any new code written here.
- `shadow-*` cannot switch between themes on its own. Light depth = `shadow-e1/e2/e3`; dark depth = `surface`/`surface-2` + hairline border. Any new elevation must branch on `colorScheme` from `useTheme()`.
- Shared UI primitives live in `components/ui/`; don't duplicate behavior already extracted there.
- `npx tsc --noEmit` must pass after every task.
- No lint/test scripts exist — do not claim tests passed.
- Do not commit, push, or open a PR unless asked (repeat per task below as "commit" steps — these stage+commit locally only, per this repo's normal workflow of committing after each fix; nothing here pushes).

---

### Task 1: Extract `SectionHeader` into `components/ui/SectionHeader.tsx`

**Files:**
- Create: `components/ui/SectionHeader.tsx`
- Modify: `app/(app)/index.tsx:22-40` (remove local `SectionHeader`, import the shared one)

**Interfaces:**
- Produces: `SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void })` — a `View` rendering an uppercase muted eyebrow label with optional right-aligned action link. Used by `app/(app)/index.tsx` today and by `app/(app)/mind-map.tsx` in Task 2.

- [ ] **Step 1: Create the shared component**

```tsx
// components/ui/SectionHeader.tsx
import { Pressable, Text, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  action?: string;
  onPress?: () => void;
};

export function SectionHeader({ title, action, onPress }: SectionHeaderProps) {
  return (
    <View className="h-9 flex-row items-center justify-between mb-2">
      <Text
        className="text-muted text-xs font-semibold uppercase leading-4"
        style={{ letterSpacing: 2, includeFontPadding: false }}
      >
        {title}
      </Text>
      {action && onPress ? (
        <Pressable className="h-9 pl-4 items-center justify-center" onPress={onPress}>
          <Text className="text-primary text-sm font-medium leading-5" style={{ includeFontPadding: false }}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 2: Update `app/(app)/index.tsx` to use the shared component**

Remove the local `function SectionHeader(...)` block at `app/(app)/index.tsx:22-40`, and add the import alongside the other component imports near the top of the file:

```tsx
import { SectionHeader } from '../../components/ui/SectionHeader';
```

Leave every call site (`<SectionHeader title="Revisit an Idea" />`, `<SectionHeader title="Active Goals" action="View all" onPress={...} />`) unchanged — the extracted component has an identical signature.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual check**

Start Expo (`npm run start`, iPad target) and open Home. The "Revisit an Idea" and "Active Goals" section headers must render identically to before (uppercase muted label, `View all` link on the goals row).

- [ ] **Step 5: Commit**

```bash
git add components/ui/SectionHeader.tsx "app/(app)/index.tsx"
git commit -m "Extract SectionHeader into a shared ui primitive"
```

---

### Task 2: Mind Map — per-type accent color on stat cards + "Connections" section header

**Files:**
- Modify: `components/RelationshipGraph.tsx:33-52` (export the color map)
- Modify: `app/(app)/mind-map.tsx:1-6,59-78,122-124` (import colors, accent bars, wrap graph)

**Interfaces:**
- Consumes: `SectionHeader` from Task 1 (`components/ui/SectionHeader.tsx`).
- Produces: `NODE_VISUALS` exported from `components/RelationshipGraph.tsx`, keyed by `EntityGraphNodeType` (`'idea' | 'project' | 'goal'`), each entry `{ color: string; glow: string; icon: IoniconsName; label: string }`. `mind-map.tsx` reads `NODE_VISUALS.idea.color` etc.

- [ ] **Step 1: Export the existing color map**

In `components/RelationshipGraph.tsx`, change line 33 from:

```tsx
const NODE_VISUALS: Record<EntityGraphNodeType, NodeVisual> = {
```

to:

```tsx
export const NODE_VISUALS: Record<EntityGraphNodeType, NodeVisual> = {
```

Also export the `NodeVisual` type it already declares at line 26 (`type NodeVisual = {...}` → `export type NodeVisual = {...}`) so `mind-map.tsx` can type against it if needed.

- [ ] **Step 2: Import the colors in `mind-map.tsx`**

Add near the top of `app/(app)/mind-map.tsx`, alongside the existing `RelationshipGraph` import:

```tsx
import { RelationshipGraph, NODE_VISUALS } from '../../components/RelationshipGraph';
import { SectionHeader } from '../../components/ui/SectionHeader';
```

(replace the existing bare `import { RelationshipGraph } from '../../components/RelationshipGraph';` line with the combined import above).

- [ ] **Step 3: Add a colored top-accent bar to each stat card**

Replace the stat-card row currently at `app/(app)/mind-map.tsx:59-78`:

```tsx
        <View className="flex-row gap-2">
          <View className="flex-1 rounded-2xl bg-surface border border-border px-3 py-3">
            <Text className="text-muted text-[11px] font-semibold uppercase">Ideas</Text>
            <Text className="text-foreground text-xl font-bold mt-1" style={{ fontVariant: ['tabular-nums'] }}>
              {ideaCount}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-surface border border-border px-3 py-3">
            <Text className="text-muted text-[11px] font-semibold uppercase">Projects</Text>
            <Text className="text-foreground text-xl font-bold mt-1" style={{ fontVariant: ['tabular-nums'] }}>
              {projectCount}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-surface border border-border px-3 py-3">
            <Text className="text-muted text-[11px] font-semibold uppercase">Goals</Text>
            <Text className="text-foreground text-xl font-bold mt-1" style={{ fontVariant: ['tabular-nums'] }}>
              {goalCount}
            </Text>
          </View>
        </View>
```

with:

```tsx
        <View className="flex-row gap-2">
          <View className="flex-1 rounded-2xl bg-surface border border-border overflow-hidden">
            <View style={{ height: 3, backgroundColor: NODE_VISUALS.idea.color }} />
            <View className="px-3 py-3">
              <Text className="text-muted text-[11px] font-semibold uppercase">Ideas</Text>
              <Text className="text-foreground text-xl font-bold mt-1" style={{ fontVariant: ['tabular-nums'] }}>
                {ideaCount}
              </Text>
            </View>
          </View>
          <View className="flex-1 rounded-2xl bg-surface border border-border overflow-hidden">
            <View style={{ height: 3, backgroundColor: NODE_VISUALS.project.color }} />
            <View className="px-3 py-3">
              <Text className="text-muted text-[11px] font-semibold uppercase">Projects</Text>
              <Text className="text-foreground text-xl font-bold mt-1" style={{ fontVariant: ['tabular-nums'] }}>
                {projectCount}
              </Text>
            </View>
          </View>
          <View className="flex-1 rounded-2xl bg-surface border border-border overflow-hidden">
            <View style={{ height: 3, backgroundColor: NODE_VISUALS.goal.color }} />
            <View className="px-3 py-3">
              <Text className="text-muted text-[11px] font-semibold uppercase">Goals</Text>
              <Text className="text-foreground text-xl font-bold mt-1" style={{ fontVariant: ['tabular-nums'] }}>
                {goalCount}
              </Text>
            </View>
          </View>
        </View>
```

(`overflow-hidden` keeps the accent bar's square corners clipped to the card's rounded corners; the inner `px-3 py-3` wrapper replaces the padding that used to live directly on the outer card.)

- [ ] **Step 4: Wrap the graph in a labeled "Connections" section**

Replace the final block at `app/(app)/mind-map.tsx:122-124`:

```tsx
        {!loading && !error && nodes.length > 0 ? (
          <RelationshipGraph nodes={nodes} edges={edges} onNodePress={handleNodePress} />
        ) : null}
```

with:

```tsx
        {!loading && !error && nodes.length > 0 ? (
          <View>
            <SectionHeader title="Connections" />
            <RelationshipGraph nodes={nodes} edges={edges} onNodePress={handleNodePress} />
          </View>
        ) : null}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual check**

Open Mind Map in Expo with at least one idea, project, and goal present. Confirm: each stat card shows a thin colored bar along its top edge (cyan for Ideas, teal for Projects, violet for Goals, matching the graph node colors below), and a "Connections" eyebrow label appears directly above the graph. Check both light and dark mode — the accent bar colors are fixed (not theme tokens) so they should look the same in both, only the surrounding card background should switch.

- [ ] **Step 7: Commit**

```bash
git add components/RelationshipGraph.tsx "app/(app)/mind-map.tsx"
git commit -m "Add per-type accent bars and Connections header to Mind Map"
```

---

### Task 3: Add a leading search icon to `EntityListScreen`'s search field

**Files:**
- Modify: `components/ui/EntityListScreen.tsx:1-4,87-97`

**Interfaces:**
- No signature changes — `EntityListScreen`'s props are unchanged. This task only changes what it renders internally.

- [ ] **Step 1: Add the icon inside the search field**

In `components/ui/EntityListScreen.tsx`, replace the `ListHeaderComponent` block at lines 87-97:

```tsx
        ListHeaderComponent={
          <View className="mb-3">
            <TextInput
              className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border"
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={onQueryChange}
            />
          </View>
        }
```

with:

```tsx
        ListHeaderComponent={
          <View className="mb-3">
            <View className="justify-center">
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.muted}
                style={{ position: 'absolute', left: 14, zIndex: 1 }}
              />
              <TextInput
                className="bg-surface text-foreground rounded-control pl-11 pr-4 py-3 border border-border"
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={onQueryChange}
              />
            </View>
          </View>
        }
```

(`Ionicons` is already imported at the top of this file at line 3 — no new import needed. Note the field's radius also moves from the raw `rounded-xl` to the named `rounded-control` token per the repo's design-token rule, since this line is being touched anyway.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check**

Open Ideas, Goals, and Projects in Expo. Each search field should show a small muted magnifying-glass icon inside the left edge of the field, with the placeholder text now starting after it rather than overlapping.

- [ ] **Step 4: Commit**

```bash
git add components/ui/EntityListScreen.tsx
git commit -m "Add leading search icon to entity list search fields"
```

---

### Task 4: Replace `EntityListScreen`'s raw `shadow-lg` FAB with theme-aware elevation

**Files:**
- Modify: `components/ui/EntityListScreen.tsx:1-6,49-50,116-123`

**Interfaces:**
- No signature changes.

- [ ] **Step 1: Read `colorScheme` from the theme context**

In `components/ui/EntityListScreen.tsx`, change the import at line 5 from:

```tsx
import { useThemeColors } from '../../context/ThemeContext';
```

to:

```tsx
import { useTheme } from '../../context/ThemeContext';
```

Then change line 50 from:

```tsx
  const colors = useThemeColors();
```

to:

```tsx
  const { colors, colorScheme } = useTheme();
```

- [ ] **Step 2: Branch the FAB's elevation class on `colorScheme`**

Replace the FAB at lines 116-123:

```tsx
      <Pressable
        className="absolute bottom-24 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center shadow-lg border border-primary/40"
        onPress={onCreatePress}
        accessibilityRole="button"
        accessibilityLabel={createAccessibilityLabel}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </Pressable>
```

with:

```tsx
      <Pressable
        className={`absolute bottom-24 right-6 bg-primary rounded-pill w-14 h-14 items-center justify-center border ${
          colorScheme === 'dark' ? 'border-surface-2' : 'shadow-e3 border-primary/40'
        }`}
        onPress={onCreatePress}
        accessibilityRole="button"
        accessibilityLabel={createAccessibilityLabel}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </Pressable>
```

(In light mode this keeps a real shadow, now via the theme's `shadow-e3` token instead of Tailwind's untracked default `shadow-lg`. In dark mode, per this repo's depth rule, shadows are dropped in favor of a lighter hairline border — here `border-surface-2`, a lighter ring against the dark background — so the button still reads as raised without relying on a shadow that dark mode can't render consistently. Also switches `rounded-full` to the named `rounded-pill` token per the design-token rule, since this line is being touched anyway.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual check**

Open Ideas (or Goals/Projects) in Expo in light mode — the "+" FAB should show a soft drop shadow. Switch to dark mode (Settings → Appearance → Dark) — the FAB should show a light hairline ring instead of a shadow, still clearly a raised circular button.

- [ ] **Step 5: Commit**

```bash
git add components/ui/EntityListScreen.tsx
git commit -m "Give EntityListScreen's FAB theme-aware elevation instead of raw shadow-lg"
```

---

### Task 5: Settings — horizontal segmented control for appearance + explanatory caption

**Files:**
- Modify: `app/(app)/settings.tsx:215-242`

**Interfaces:**
- No signature changes — this only changes the JSX for the existing `THEME_OPTIONS.map(...)` block; `mode`, `setMode`, and `THEME_OPTIONS` (already defined at the top of the file) are unchanged.

- [ ] **Step 1: Replace the vertical option list with a horizontal segmented control**

Replace the block at `app/(app)/settings.tsx:215-242`:

```tsx
        <Text className={`${muted} text-xs font-semibold uppercase mb-3`} style={{ letterSpacing: 1.5 }}>Appearance</Text>
        <View className={`${card} rounded-2xl border p-2 mb-6`}>
          {THEME_OPTIONS.map((option, index) => {
            const active = mode === option.mode;
            return (
              <Pressable
                key={option.mode}
                className={`flex-row items-center px-3 py-3 rounded-xl ${active ? 'bg-primary' : ''} ${index > 0 ? 'mt-1' : ''}`}
                onPress={() => setMode(option.mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${option.label} theme`}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={active ? colors.primaryForeground : colors.muted}
                />
                <Text className={`flex-1 ml-3 font-medium ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {option.label}
                </Text>
                {active ? (
                  <Ionicons name="checkmark" size={20} color={colors.primaryForeground} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
```

with:

```tsx
        <Text className={`${muted} text-xs font-semibold uppercase mb-3`} style={{ letterSpacing: 1.5 }}>Appearance</Text>
        <View className={`${card} rounded-2xl border p-1 mb-3 flex-row`}>
          {THEME_OPTIONS.map((option) => {
            const active = mode === option.mode;
            return (
              <Pressable
                key={option.mode}
                className={`flex-1 items-center justify-center py-3 rounded-control ${active ? 'bg-primary' : ''}`}
                onPress={() => setMode(option.mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${option.label} theme`}
              >
                <Text className={`font-medium ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className={`${muted} text-xs leading-4 mb-6`}>
          System follows your device. Depth in dark mode comes from lighter surfaces and hairlines, not shadows.
        </Text>
```

(This drops the per-row icon and checkmark, since a 3-way segmented control makes the selected state self-evident from position + fill alone — matching the mockup. `Ionicons` is still used elsewhere in this file, so its import stays.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check**

Open Settings in Expo. "Appearance" should now show System/Light/Dark as three equal-width segments in one row, with the active one filled in the primary color, followed by the caption sentence about dark-mode depth. Tapping each segment should switch the app's theme immediately, same as before.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/settings.tsx"
git commit -m "Convert Settings appearance control to a segmented control with caption"
```

---

### Task 6: Settings — destructive-tinted background on the sign-out row

**Files:**
- Modify: `app/(app)/settings.tsx:256-268`

**Interfaces:**
- No signature changes.

- [ ] **Step 1: Give the sign-out row a destructive-tinted background**

Replace the block at `app/(app)/settings.tsx:256-268`:

```tsx
        <Pressable
          className={`${card} rounded-xl py-4 px-5 items-center flex-row justify-between border`}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
        >
          <Text className="text-destructive font-medium">{signingOut ? 'Signing out...' : 'Sign out'}</Text>
          {signingOut ? (
            <ActivityIndicator color={colors.destructive} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          )}
        </Pressable>
```

with:

```tsx
        <Pressable
          className="bg-destructive/20 rounded-xl py-4 px-5 items-center flex-row justify-between border border-destructive/30"
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
        >
          <Text className="text-destructive font-medium">{signingOut ? 'Signing out...' : 'Sign out'}</Text>
          {signingOut ? (
            <ActivityIndicator color={colors.destructive} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          )}
        </Pressable>
```

(`bg-destructive/20` + a matching `/30`-opacity border is the same tint pattern this repo's `Badge` component already uses for its `red` variant — see `components/ui/Badge.tsx`.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check**

Open Settings in Expo, scroll to the bottom. Sign Out should now show a light red-tinted background (not the neutral surface card used by the rest of the screen), in both light and dark mode, clearly reading as a destructive action. Confirm tapping it still signs out correctly (or cancel before it completes, if testing against a real session).

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/settings.tsx"
git commit -m "Give Settings sign-out row a destructive-tinted background"
```

---

## Plan Self-Review Notes

- **Spec coverage:** All 6 punch-list items from the design doc map 1:1 to Task 2 (items 1–2), Task 3 (item 5), Task 4 (item 6), Task 5 (item 3), Task 6 (item 4). Task 1 is a prerequisite extraction Task 2 depends on, not a separate spec item.
- **Type consistency:** `NODE_VISUALS`/`NodeVisual` exported in Task 2 Step 1 are consumed with matching names in Task 2 Step 3. `SectionHeader`'s signature from Task 1 is used unchanged in Task 2 Step 4. `useTheme()`'s `{ colors, colorScheme }` return shape (already defined in `context/ThemeContext.tsx:118-121`) matches Task 4 Step 1's destructuring.
- **Ordering:** Tasks 3 and 4 both touch `EntityListScreen.tsx` but in disjoint regions (search header vs. FAB) — either order is safe, but doing them in sequence (as numbered) avoids a merge within the same task run.
