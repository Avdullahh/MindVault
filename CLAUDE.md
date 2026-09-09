# MindVault - Claude Instructions

## Product Context

MindVault is an iPad-first iOS second-brain app. It captures ideas and connects them to goals, tasks, and projects — the connective layer between thinking and doing. Inspired by Obsidian, but simpler and usable on the go while staying deep enough to be someone's actual second brain. It is not a generic notes app.

Core rules:
- AI is always opt-in and user-triggered. Never run AI automatically in the background.
- Free tier: capture, organization, manual planning. Pro tier gates AI expansion, goal planning, categorization, and morning brief.
- Ideas, goals, tasks, and projects must stay meaningfully cross-linkable.
- Prefer calm, focused UI over decorative or marketing-style screens.
- Do not bypass repository rules, RLS requirements, Edge Function boundaries, or the opt-in AI rule.

## Tech Stack

Expo 56 · React Native 0.85 · React 19 · TypeScript 6 strict · Expo Router · NativeWind v4 / Tailwind v3 · Supabase (Postgres, Auth, RLS, Edge Functions) · TanStack React Query v5 + persist-client · `d3-force` (mind map) · `react-native-reanimated` v4 · `expo-secure-store` · npm.

Gemini runs only from Supabase Edge Functions, never in the client bundle. RevenueCat/subscriptions are planned, not installed — do not describe them as existing.

## Commands

`npm run start` · `npm run ios` · `npm run android` · `npm run web` · `npm run fresh` (reset caches) · `npx tsc --noEmit` (type-check).

There are **no lint or test scripts**. Do not claim lint/tests passed unless you added the scripts and ran them.

Supabase type generation needs a linked project. After a schema change, regenerate `types/database.generated.ts` with the Supabase CLI before writing app code against it.

## Architecture Rules

- `lib/supabase.ts` is the **only** client-side Supabase client module. UI components and route files must never instantiate a client.
- `hooks/` owns all Supabase reads/writes and exposes typed operations to screens/components.
- Keep feature work vertical: data hook → screen behavior → component polish.
- Prefer generated types from `types/database.generated.ts`; put app-friendly aliases in `types/index.ts`.
- Shared UI primitives live in `components/ui/`. Do not duplicate button, card, badge, tag, modal, or date-picker behavior in feature files.
- Use existing local patterns before introducing new abstractions.

Directories are self-describing (`app/`, `components/`, `context/`, `theme/`, `docs/`, `supabase/migrations/`, `supabase/functions/`) except the two rules above.

## Design Tokens

- **Colour is the only theme-reactive token category.** It flows `theme/colors.ts` → `buildVars()` → `vars()` on the root View in `context/ThemeContext.tsx`. `global.css` mirrors the same values as a web/pre-mount fallback.
- **Everything else — spacing, radius, typography, depth, motion — is a static theme value in `tailwind.config.js`.** Never add a non-colour token to `global.css` or the `vars()` payload.
- Spacing uses Tailwind's default scale unchanged. `metro.config.js` sets `inlineRem: 16`, so `p-4` is 16pt. Do not override `theme.spacing` with px values.
- Use named radii (`rounded-field/control/card/sheet/pill`) and max-widths (`max-w-sheet/prose/content/wide`), not raw numeric or `rounded-2xl`-style classes.
- **`shadow-*` cannot switch between themes.** Light depth uses `shadow-e1/e2/e3`; dark depth uses `surface` → `surface-2` plus a hairline border. Both live in the `Card` primitive; screens must not reach for `shadow-*` directly.
- Top insets use `pt-safe-offset-*`; never hardcode top padding. ⚠️ `*-safe` utilities ride the same `VariableContext` as `vars()`, which **does not survive RN's `Modal`** — treat them as unavailable inside modals.

## Data Layer (React Query)

- Reads flow through React Query. Each feature hook (`use-ideas`, `use-goals`, `use-projects`) wraps `useQuery` with a stable key (e.g. `['ideas']`) and a `fetch*` function calling Supabase.
- Mutations run the Supabase write, then `invalidateQueries` or `setQueryData` on the affected key. No ad-hoc `useState` caches in screens.
- `lib/data-events.ts` is a cross-hook pub/sub bus. Each hook holds a `useRef(Symbol())` source id, emits `emitDataChange(keys, source)` after a write, and subscribes via `subscribeToDataChanges`, ignoring its own events. When a mutation affects other entities (deleting an idea also touches projects/goals), emit all affected keys.
- `lib/query-client.tsx` exports `queryClient`, `QueryProvider` (a `PersistQueryClientProvider` mounted inside `AuthProvider`), and `clearPersistedQueryCache()` — call it on sign-out.
- `lib/storage.ts` is the cross-platform sync key/value store backed by MMKV (native) and MMKV's `localStorage` impl (web) — no platform branching. It is **not** session storage. It requires a dev client built *after* `react-native-mmkv` was added; otherwise it falls back to an in-memory `Map` and nothing persists. `storage.isPersistent()` reports the live backend.
- `lib/get-user-id.ts` resolves the current user id for writes; use it instead of re-reading the session.

## Data Model

Tables: `categories`, `tags`, `ideas`, `projects`, `goals`, `tasks`. Junctions: `idea_tags`, `project_ideas`, `goal_ideas`, `goal_projects`, `task_ideas`. (Shapes live in `types/database.generated.ts` and the migrations.)

- All user-owned tables must enforce RLS with user isolation equivalent to `auth.uid() = user_id`. Never weaken RLS for convenience.
- Foreign-key links between user-owned rows must also prove same-user ownership in RLS policies.
- **Tasks are project-scoped** in both UI and database writes. Do not add a global Tasks route or create tasks without `project_id`.
- Authenticated routes exist for ideas, goals, projects, settings, and the `(auth)` sign-in flow. There is no standalone global Tasks route.

## Auth Flow

- Sign-in is **passwordless + OAuth only** — magic-link email (Supabase `signInWithOtp`) and Apple/Google (`signInWithOAuth`). There is no password sign-in or sign-up path in the app UI.
- `app/(auth)/welcome.tsx` is the entry screen; unauthenticated users land on it (`AuthGate` in `app/_layout.tsx` redirects there). It offers Apple/Google/"Continue with email"; the last pushes `app/(auth)/login.tsx`.
- `app/(auth)/login.tsx` collects an email, calls `signInWithOtp`, and shows a "check your email" state (resend cooldown + "I opened the link" manual refresh) once sent.
- **There is no separate sign-up screen.** The same Apple/Google/magic-link actions create an account on first use (`shouldCreateUser: true`). `app/(auth)/register.tsx` exists only as a redirect to `/(auth)/welcome`, kept for old deep links — do not add new sign-up UI.
- Magic links and the OAuth browser flow return a PKCE `code` via deep link; `context/auth-context.tsx` exchanges it with `supabase.auth.exchangeCodeForSession` (a `Linking` listener handles magic-link redirects while the OAuth path resolves its own redirect result directly).
- Settings retains a secondary "set/change password" field via `updateAccount` for users who want one — that's independent of sign-in and isn't a login path.

## Security And Secrets

- Never commit `.env` secrets or real service keys. Client-exposed values use `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Gemini API keys belong only in Supabase secrets.
- Sessions go in `expo-secure-store`, not AsyncStorage. Preserve the chunked SecureStore behavior in `lib/supabase.ts` — sessions can exceed the iOS per-key size limit. Web/dev may use a `localStorage` fallback only because SecureStore is native-only.
- Treat unauthenticated data access as a bug unless the feature is intentionally public.

## Edge Functions And AI

Pattern: authenticate → check Pro entitlement when gated → validate input → call Gemini server-side → return a typed response.

Shared utilities live in `supabase/functions/_shared/`. Reuse them instead of re-implementing auth, entitlement, Gemini, or response handling. Never call Gemini from React Native. Never add automatic categorization, expansion, planning, or brief generation without an explicit user action.

## UX And Product Quality

- iPad first, then make phone layouts work cleanly.
- Keep screens useful immediately; no landing-page or marketing copy inside the app.
- Prefer dense, scannable organization for lists, tasks, and planning views.
- AI actions should feel optional, clearly labeled, and reversible when practical.
- Empty states should help the user take the next meaningful action.
- Preserve cross-linking flows when editing ideas, goals, tasks, and projects.
- For vertically centered list-card text, use container centering plus explicit line heights and `includeFontPadding: false`.
- **No phantom space**: if an element has nothing to display, do not render it. Use `{value ? <Component /> : null}` — never render an empty `<View>`/`<Text>` to hold potential space. This applies to wrappers too: if all children are conditional and may all be null, wrap the container in the same condition.

## Naming Conventions

SQL identifiers `snake_case` · TS variables/functions `camelCase` · components `PascalCase` · router screens `kebab-case` · hooks `use-*.ts` · Edge Functions kebab-case dirs.

## Change Workflow

- Read the relevant files before editing. Keep changes scoped to the request.
- Do not rewrite unrelated files or reformat broad areas without a reason.
- Do not revert user changes unless explicitly asked.
- Ask before destructive actions (deleting files, resetting git state, replacing migrations).
- Schema change → add a migration and regenerate types. API shape change → update every caller and its types.
- New dependencies: prefer established Expo-compatible packages; update `package-lock.json`.

## Verification

- Run `npx tsc --noEmit` for app TypeScript changes.
- For route/component changes, start Expo with the relevant target when practical.
- For migrations, inspect SQL for RLS and user isolation.
- For Edge Functions, verify auth, entitlement, input validation, and typed responses.
- **If a check cannot be run, say so clearly in the final response.**

## Git And PR Guidance

- Do not commit, push, or open a PR unless asked.
- Commit titles and descriptions must both be accurate and concise.
- Mention the verification performed in the PR or final summary.
- Keep generated files in the same commit as the source change that requires them.

## Session Economics

Context cost is quadratic in session length: turn 200 re-sends everything from turns 1–199. A single 242-turn session in this repo's history cost as much as every other session combined.

- **One task per session.** End the session and `/clear` when a task is done rather than continuing into the next one.
- **Watch the 100k line.** Past ~100k context, finish the current step and start fresh. Do not run multi-hour sessions.
- **Read narrowly.** Use `Read` with `offset`/`limit` and `Grep` with `head_limit` instead of loading whole files. Never open `package-lock.json`, `types/database.generated.ts`, or `supabase/config.toml` in full — they are 349k, 34k, and 15k chars.
- **Don't spawn subagents for exploration.** A cold agent re-derives context you already have and pays a fresh baseline for it.
- **Budget advisor calls** to roughly two per task — before committing to an approach, and before declaring done. Each call re-sends the whole transcript uncached, so its cost scales with how large the session has grown.
