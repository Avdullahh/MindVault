# MindVault - Claude Instructions

## Working Notes

- Do not bypass repository rules, RLS requirements, Supabase Edge Function boundaries, or the opt-in AI product rule.
- Keep responses and edits concise, scoped, and consistent with the calm iPad-first product direction.

## Product Context

MindVault is an iPad-first iOS second-brain app. It captures ideas, connects them to goals, tasks, and projects, and helps users turn thinking into action.

The app is heavily inspired by Obsidian. The goal is to make a simpler, more user-friendly app for on-the-go usage while staying deep enough for users who rely on it as a second brain.

The app is not a generic notes app. Treat it as the connective layer between thinking and doing.

Core product rules:
- AI is always opt-in and user-triggered. Never run AI automatically in the background.
- Free tier includes capture, organization, and manual planning.
- Pro tier gates AI expansion, goal planning, categorization, and morning brief features.
- Ideas, goals, tasks, and projects should be meaningfully cross-linkable.
- Prefer calm, focused UI over decorative or marketing-style screens.

## Tech Stack

- Expo 56, React Native 0.85, React 19, TypeScript 6 strict mode
- Expo Router for file-based navigation under `app/`
- NativeWind v4 and Tailwind CSS v3 for styling
- Supabase for Postgres, Auth, RLS, generated types, and Edge Functions
- TanStack React Query v5 is the client data layer; `@tanstack/react-query-persist-client` persists the cache
- `d3-force` powers the ideas/projects/goals mind-map graph
- `react-native-reanimated` v4 (with `react-native-worklets`) for animation
- Gemini only from Supabase Edge Functions, never from the client bundle
- Secure session storage via `expo-secure-store`
- Package manager: npm, with `package-lock.json`
- Planned subscription work uses RevenueCat, paywalls, and entitlement refresh. Do not describe it as installed until the dependency and integration exist.

## Commands

Use the commands that exist in `package.json` unless you add and document new scripts.

- Install dependencies: `npm install`
- Start Expo: `npm run start`
- Run iOS target: `npm run ios`
- Run Android target: `npm run android`
- Run web target: `npm run web`
- Reset local caches / reinstall for a clean start: `npm run fresh` (runs `scripts/fresh-start.js`)
- Type-check app code: `npx tsc --noEmit`

There are currently no lint or test scripts in `package.json`. Do not claim lint/tests passed unless you added the scripts or ran an equivalent command explicitly.

Supabase type generation depends on a linked project or project id. When schema changes, regenerate `types/database.generated.ts` with the Supabase CLI before writing app code against the new schema.

## Repository Map

- `app/` - Expo Router routes and screen composition
- `app/(auth)/` - login and registration routes
- `app/(app)/` - authenticated app routes
- `components/` - feature components and modals
- `components/ui/` - shared UI primitives
- `context/` - app-wide React context, including auth state
- `hooks/` - data hooks and feature operations; Supabase queries live here
- `lib/` - shared utilities and the single Supabase client
- `theme/` - app theme tokens and shared visual constants
- `types/` - generated database types and app-level type aliases
- `docs/` - product notes, implementation plans, and design research
- `supabase/migrations/` - database schema migrations
- `supabase/functions/` - Edge Functions and shared Deno helpers

## Architecture Rules

- `lib/supabase.ts` is the only client-side Supabase client module.
- UI components and route files must not instantiate Supabase clients.
- Hooks own Supabase reads/writes and expose typed operations to screens/components.
- Keep feature work vertical: data hook, screen behavior, then component polish.
- Prefer generated database types from `types/database.generated.ts` over hand-written table shapes.
- Put app-friendly type aliases in `types/index.ts`.
- Keep shared UI primitives in `components/ui/`; do not duplicate button, card, badge, tag, modal, or date picker behavior in feature files.
- Use existing local patterns before introducing new abstractions.

## Design Tokens

- **Colour is the only theme-reactive token category.** It flows `theme/colors.ts` (hex source of truth) → `buildVars()` → `vars()` injected on the root View in `context/ThemeContext.tsx`. `global.css` mirrors the same values as a web/pre-mount fallback.
- **Everything else — spacing, radius, typography, depth, motion — lives in `tailwind.config.js` as static theme values.** Never add a non-colour token to `global.css` or to the `vars()` payload: none of it differs between light and dark, so it would add a duplicated surface and a Modal-portal hazard for nothing.
- Spacing uses Tailwind's default scale unchanged. `metro.config.js` sets `inlineRem: 16`, so `p-4` is 16pt on device. Do not override `theme.spacing` with px values — that would make `inlineRem` a no-op for padding/margin while still rescaling font line-heights and maxWidth.
- Use the named radii (`rounded-field/control/card/sheet/pill`) and max-widths (`max-w-sheet/prose/content/wide`) rather than raw numeric or `rounded-2xl`-style classes.
- **`shadow-*` cannot switch between themes** — it's a static theme value. Light-mode depth uses `shadow-e1/e2/e3`; dark-mode depth uses `surface` → `surface-2` plus a hairline border. Both live inside the `Card` primitive; screens should not reach for `shadow-*` directly.
- Top insets use `pt-safe-offset-*` (NativeWind's safe-area utilities, backed by the already-mounted `SafeAreaProvider`). Never hardcode a top padding. ⚠️ `*-safe` utilities ride the same `VariableContext` as `vars()`, which does not survive RN's `Modal` — treat them as unavailable inside modals.

## Data Layer (React Query)

- Reads flow through TanStack React Query. Each feature hook (`use-ideas`, `use-goals`, `use-projects`) wraps `useQuery` with a stable query key (e.g. `['ideas']`) and a `fetch*` function that calls Supabase.
- Mutations (`create`/`update`/`remove`) run the Supabase write, then either `invalidateQueries` or `setQueryData` on the affected key. Follow the existing pattern; do not add ad-hoc `useState` caches in screens.
- `lib/data-events.ts` is a cross-hook pub/sub bus so a write in one feature invalidates related queries in others. Each hook holds a `useRef(Symbol())` source id, emits `emitDataChange(keys, source)` after a write, and subscribes via `subscribeToDataChanges` — ignoring events it emitted itself. When a mutation affects other entities (e.g. deleting an idea also touches projects/goals), emit all affected keys.
- `lib/query-client.tsx` exports the shared `queryClient`, the `QueryProvider` (a `PersistQueryClientProvider` mounted inside `AuthProvider` in `app/_layout.tsx`), and `clearPersistedQueryCache()` — call it on sign-out to drop cached user data.
- `lib/storage.ts` is the cross-platform synchronous key/value store used by the persister and misc prefs. It is backed by MMKV (`react-native-mmkv` v4, a Nitro native module) on native, and by MMKV's own `localStorage` implementation on web — no platform branching in our code. It is NOT session storage; Supabase sessions still live in `expo-secure-store` via `lib/supabase.ts`.
- MMKV requires a dev client that was **built after** `react-native-mmkv` was added. `lib/storage.ts` falls back to an in-memory `Map` (and warns once) when the native module is missing, so the app still boots — but nothing persists. `storage.isPersistent()` reports the live backend, and the dev token screen shows it.
- `lib/get-user-id.ts` resolves the current user id for writes; use it instead of re-reading the session in hooks.

## Naming Conventions

- Database tables, columns, and SQL identifiers: `snake_case`
- TypeScript variables and functions: `camelCase`
- React components and exported component files: `PascalCase`
- Expo Router screen files: `kebab-case` where a descriptive route name is needed
- Hooks: `use-*.ts`
- Supabase Edge Functions: kebab-case directories under `supabase/functions/`

## Data Model

Core tables:
- `categories`
- `tags`
- `ideas`
- `projects`
- `goals`
- `tasks`

Junction tables:
- `idea_tags`
- `project_ideas`
- `goal_ideas`
- `goal_projects`
- `task_ideas`

All user-owned tables must enforce RLS with user isolation equivalent to `auth.uid() = user_id`. Do not weaken RLS for convenience.
Foreign-key links between user-owned rows must also prove same-user ownership in RLS policies.
Tasks are project-scoped in the product UI and database writes; do not add a global Tasks route or create tasks without `project_id`.
The current app has authenticated routes for ideas, goals, projects, settings, login, and registration. There is no standalone global Tasks route.

## Security And Secrets

- Never commit `.env` secrets or real service keys.
- Client-exposed Supabase values must use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Gemini API keys belong only in Supabase secrets.
- Store sessions in `expo-secure-store`, not AsyncStorage.
- Preserve the chunked SecureStore behavior in `lib/supabase.ts`; Supabase sessions can exceed the iOS per-key size limit.
- Web/dev runs may use a `localStorage` fallback only because `expo-secure-store` is native-only.
- Treat unauthenticated data access as a bug unless the feature is intentionally public.

## Edge Functions And AI

Current AI function pattern:
1. Authenticate the request.
2. Check Pro entitlement when the feature is Pro-gated.
3. Validate the input.
4. Call Gemini server-side.
5. Return a typed response.

Current AI functions live under `supabase/functions/` and include categorization, idea expansion, morning brief, and goal planning flows.

Never call Gemini from React Native code. Never add automatic AI categorization, expansion, planning, or brief generation without an explicit user action or scheduled feature requirement.

Shared Edge Function utilities live in `supabase/functions/_shared/`. Reuse them instead of re-implementing auth, entitlement, Gemini, or response handling in each function.

## UX And Product Quality

- Design for iPad first, then make phone layouts work cleanly.
- Keep screens useful immediately; avoid landing-page or marketing copy inside the app.
- Prefer dense, scannable organization for lists, tasks, and planning views.
- AI actions should feel optional, clearly labeled, and reversible when practical.
- Empty states should help the user take the next meaningful action.
- Preserve cross-linking flows when editing ideas, goals, tasks, and projects.
- For vertically centered list-card text, use container centering plus explicit line heights and `includeFontPadding: false` so React Native text does not sit slightly high.
- **No phantom space**: if a UI element has nothing to display, do not render it. Conditional rendering must use `{value ? <Component /> : null}` - never render an empty `<View>`, `<Text>`, or container just to hold potential space. This applies to wrapper Views too: if all children are conditional and may all be null, wrap the container in the same condition.

## Build Order

When adding major product areas, follow this dependency order unless the user explicitly asks for a narrow fix:

1. Foundation: schema, RLS, policies, generated types.
2. Expo setup: NativeWind, Expo Router, Supabase client.
3. Authentication: login, registration, Apple Sign In when implemented, session persistence, RLS validation.
4. Core features: ideas, categories/tags, goals, projects, tasks, cross-linking UI.
5. AI features: Edge Functions first, dashboard/function testing, then app integration.
6. Subscriptions: RevenueCat, paywall, entitlement refresh, AI access removal without restart.
7. Notifications and polish: daily brief scheduling, iPad optimization, animation polish.

## Change Workflow

- Read the relevant files before editing.
- Keep changes scoped to the user's request.
- Do not rewrite unrelated files or reformat broad areas without a reason.
- Do not revert user changes unless the user explicitly asks.
- Ask before destructive actions such as deleting files, resetting git state, or replacing migrations.
- If changing schema, add a migration and regenerate types.
- If changing an API shape, update every caller and the related TypeScript types.
- If adding dependencies, prefer established Expo-compatible packages and update `package-lock.json`.

## Verification

Before handing off code changes:

- Run `npx tsc --noEmit` for app TypeScript changes.
- For route or component changes, start Expo with the relevant target when practical.
- For Supabase migrations, inspect SQL for RLS and user isolation.
- For Edge Functions, verify auth, entitlement behavior, input validation, and typed responses.
- If a check cannot be run, state that clearly in the final response.

## Git And PR Guidance

- Do not commit, push, or open a PR unless the user asks.
- Commit titles and descriptions must both be accurate and concise.
- Mention the verification performed in the PR or final summary.
- Keep generated files in the same commit as the source change that requires them.
