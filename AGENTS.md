# MindVault Agent Instructions

AGENTS.md is the operating manual for coding agents in this repository. Keep it specific, current, and short enough to be useful. When code, commands, schema, or folder ownership changes, update this file in the same change.

## Mandatory Delegation Workflow (DevSquad)

**The DevSquad workflow is mandatory at all times, with no exception.** Every task must be routed through DevSquad delegation before the lead agent does work directly.

- Follow the routing in `.devsquad/config.json` on every task:
  - Research → Gemini
  - Bulk reading / codebase analysis → Gemini (1M context)
  - Code generation / boilerplate → Codex
  - Testing → Codex
  - Synthesis and final integration → lead agent (self)
- The lead agent does not personally do research, bulk file reading, or boilerplate generation. Delegate it, then synthesize and integrate the results.
- This rule applies even to small or "quick" tasks. There is no exception for size, urgency, or convenience.
- If a delegate is unavailable, state that explicitly before falling back to doing the work directly.

## Product Context

MindVault is an iPad-first iOS second-brain app. It captures ideas, connects them to goals, tasks, and projects, and helps users turn thinking into action. 
The idea is heavily inspired by Obsidian. The goal is to make a simpler, more user-friendly application for on-the-go usage but also deep enough for users who want to heavily lean on it to use it as a second brain.

The app is not a generic notes app. Treat it as the connective layer between thinking and doing.

Core product rules:
- AI is always opt-in and user-triggered. Never run AI automatically in the background.
- Free tier includes capture, organization, and manual planning.
- Pro tier gates AI expansion, goal planning, categorization, and morning brief features.
- Ideas, goals, tasks, and projects should be meaningfully cross-linkable.
- Prefer calm, focused UI over decorative or marketing-style screens.

## Tech Stack

- Expo 54, React Native 0.81, React 19, TypeScript strict mode
- Expo Router for file-based navigation under `app/`
- NativeWind and Tailwind for styling
- Supabase for Postgres, Auth, RLS, generated types, and Edge Functions
- Gemini only from Supabase Edge Functions, never from the client bundle
- RevenueCat for subscriptions
- Secure session storage via `expo-secure-store`
- Package manager: npm, with `package-lock.json`

## Commands

Use the commands that exist in `package.json` unless you add and document new scripts.

- Install dependencies: `npm install`
- Start Expo: `npm run start`
- Run iOS target: `npm run ios`
- Run Android target: `npm run android`
- Run web target: `npm run web`
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
- `types/` - generated database types and app-level type aliases
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
- `task_goals`

All user-owned tables must enforce RLS with user isolation equivalent to `auth.uid() = user_id`. Do not weaken RLS for convenience.
Foreign-key links between user-owned rows must also prove same-user ownership in RLS policies.
Tasks are project-scoped in the product UI and database writes; do not add a global Tasks route or create tasks without `project_id`.
The AI plan flow (`ai-plan-goal` edge function + `handleConfirmPlan` in `projects/[id].tsx`) creates only `tasks` rows with `project_id` set to the current project. It does not create goals, milestones, action_steps, or any other row type. Do not reintroduce goal insertion or task_goals linking into this flow.

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
- **No phantom space**: if a UI element has nothing to display, do not render it. Conditional rendering must use `{value ? <Component /> : null}` — never render an empty `<View>`, `<Text>`, or container just to hold potential space. This applies to wrapper Views too: if all children are conditional and may all be null, wrap the container in the same condition.

## Build Order

When adding major product areas, follow this dependency order unless the user explicitly asks for a narrow fix:

1. Foundation: schema, RLS, policies, generated types.
2. Expo setup: NativeWind, Expo Router, Supabase client.
3. Authentication: login, registration, Apple Sign In when implemented, session persistence, RLS validation.
4. Core features: ideas, categories/tags, goals/milestones, projects, tasks, cross-linking UI.
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
