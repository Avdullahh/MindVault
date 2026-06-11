# Theme Overhaul — Light/Dark Mode (Task Tracker)

Tracks the light/dark mode UI overhaul. Plan source: `~/.claude/plans/stateful-stargazing-popcorn.md`.

**Direction:** iOS-native neutral surfaces + gold accent. Modes: System / Light / Dark (persisted via `expo-secure-store`). NativeWind 4 `darkMode: 'class'` with CSS-variable semantic tokens + a `useThemeColors()` hook for imperative color props.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 1 — Infrastructure
- [x] `theme/colors.ts` — canonical `lightColors`/`darkColors` (hex + rgb triples)
- [x] `global.css` — `@tailwind` + `:root` / `.dark` CSS variables (mirror colors.ts)
- [x] `tailwind.config.js` — semantic `colors` → `rgb(var(--token) / <alpha-value>)`; keep `darkMode: 'class'`
- [x] `app.json` — `userInterfaceStyle: "automatic"` (root + ios)
- [x] global.css already wired via metro `withNativeWind` input (no manual import needed)
- [x] `npx tsc --noEmit` clean

## Phase 2 — Provider + Settings
- [x] `context/ThemeContext.tsx` — mode state, `setMode`, resolved scheme, `useThemeColors()`, secure-store load/persist (+ web localStorage guard)
- [x] `app/_layout.tsx` — ThemeProvider + SafeAreaProvider + RN Navigation ThemeProvider + `<StatusBar style="auto" />`; flicker gate via `ThemedApp`
- [x] `app/(app)/settings.tsx` — Appearance section: System/Light/Dark control wired to `setMode`
- [ ] Runtime verify: persistence across relaunch; System follows OS toggle (needs `npm run ios`)
- [x] `npx tsc --noEmit` clean

## Phase 3 — Shared Primitives (`components/ui/`)
- [x] `Button.tsx`
- [x] `Card.tsx`
- [x] `Tag.tsx`
- [x] `Badge.tsx` (note: generic `yellow` warning variant intentionally left as-is)
- [x] `AIButton.tsx`
- [x] `ModalSheet.tsx`
- [x] `DatePicker.tsx` (+ native `themeVariant` now follows `colorScheme`)
- [x] `npx tsc --noEmit` clean

## Phase 4 — Navigation Chrome
- [x] `app/(app)/_layout.tsx` — tab bar colors via `useThemeColors()`
- [x] `npx tsc --noEmit` clean

## Phase 5 — Screens + Components
- [x] `app/(app)/index.tsx` (dashboard)
- [x] `app/(app)/ideas/index.tsx` + `ideas/[id].tsx`
- [x] `app/(app)/goals/index.tsx` + `goals/[id].tsx`
- [x] `app/(app)/projects/index.tsx` + `projects/[id].tsx`
- [x] `app/(app)/calendar/index.tsx`
- [x] `app/(app)/settings.tsx` body
- [x] `app/(auth)/login.tsx` + `register.tsx`
- [x] All `components/*.tsx` card + modal + picker components (20 files)
- [x] `components/ui/EmptyState.tsx` + `AuthFormContainer.tsx`
- [x] `npx tsc --noEmit` clean

## Phase 6 — Cleanup
- [x] Remove dead `leather`/`gold`/`rust` scales from tailwind.config once unused
- [x] Grep for stray hex in `app/` + `components/` — zero found
- [ ] Web `useColorScheme` null fallback verified (`npm run web`)
- [ ] Dark cold-start: no white flash (requires device test)
- [x] Final `npx tsc --noEmit` clean

---

## Notes / Decisions Log
- Persistence uses `expo-secure-store` (AsyncStorage is NOT a dependency).
- `useColorScheme` is always imported from `nativewind`, never `react-native`.
- `global.css` vars and `theme/colors.ts` must stay in sync (single source of truth).
- **Dark-mode `className` fix (important):** NativeWind 4 on native does NOT apply `.dark`-scoped `:root` CSS-variable overrides. Authoritative switching is done in JS via `vars()` injected at the `ThemeProvider` root (`theme/colors.ts` → `lightVars`/`darkVars`, derived from hex via `hexToRgbTriple`). `global.css` `.dark:root` block is now only a web/pre-mount fallback. Do NOT rely on `.dark { }` selectors for tokens on native.
- ⏳ NEEDS RUNTIME SMOKE TEST: `npm run ios` → Settings → toggle Dark → confirm `bg-background`/`bg-surface`/`text-foreground` switch (this bug only manifests at native runtime).
