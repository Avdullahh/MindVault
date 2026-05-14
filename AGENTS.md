# MindVault — Quick Reference

**The Problem**
Ideas are fragile. They arrive mid-conversation, during a morning walk, or right before sleep — and they vanish before you find something to write them on. The tools that do exist solve half the problem. Note apps capture ideas but rarely help you act on them. Calendars and task managers organise time but have no connection to the thinking that drives what you want to do with that time. The result is a graveyard of half-remembered ideas scattered across different apps, notebooks, and voice memos that never see daylight again. The idea existed. Then life happened. Then it was gone.

**Vision:** Smart second brain for iOS (iPad-first). Captures ideas, resurfaces them, plans goals with AI, and links everything to a calendar. Not a note app — the connective layer between thinking and doing.

**Design:** AI is always opt-in (never automatic). Everything interconnected — ideas link to goals, tasks, and events. Free tier: capture, organise, manual planning. Pro: AI features (expansion, goal planning, categorisation, morning brief).

**Stack:** Expo + TypeScript · NativeWind · Expo Router · Supabase (Postgres + Auth + RLS + Edge Functions) · Anthropic claude-sonnet-4-6 (server-side only) · RevenueCat · EAS Build/Submit

**Schema (17 tables):**
- Core: `categories`, `tags`, `ideas`, `projects`, `goals`, `calendar_events`, `tasks`, `milestones`, `action_steps`
- Junctions: `idea_tags`, `project_ideas`, `goal_ideas`, `task_ideas`, `task_goals`, `event_ideas`, `event_goals`, `event_tasks`
- All user tables: RLS policy `auth.uid() = user_id`

**Build order:** 
The order matters. Each phase builds on a stable foundation before adding complexity.

Phase 1 — Foundation Set up the Supabase project, run the full schema SQL, enable RLS on every table, and write all policies before writing a single line of app code. Generate TypeScript types using the Supabase CLI immediately (supabase gen types typescript). This means types are available from day one and all future code is typed against the real schema.

Phase 2 — Expo Project Setup Initialise the Expo project with TypeScript template. Install and configure NativeWind, Expo Router, and the Supabase client. Create a centralised Supabase client module that is imported everywhere — never instantiate the client in component files.

Phase 3 — Authentication Build auth before anything else. Login, registration, Apple Sign In, and session persistence. Every subsequent screen depends on the authenticated user. Validate that RLS is working correctly at this stage by attempting to read data as an unauthenticated user and confirming it fails.

Phase 4 — Core Features (in order) Ideas → Categories and Tags → Goals and Milestones → Projects → Calendar → Tasks → Cross-linking (junction table UI)

Build each feature vertically: data hook → screen → component — before moving to the next. Do not build all screens first and then wire data.

Phase 5 — AI Features Build all four Edge Functions. Test them independently via the Supabase dashboard before connecting them to the app. Gate every function behind auth and subscription checks from the start — never add the gate later as an afterthought.

Phase 6 — Subscriptions Integrate RevenueCat. Build the paywall UI. Verify that removing Pro entitlement immediately removes AI feature access without requiring an app restart.

Phase 7 — Notifications + Polish Daily brief scheduling, iPad layout optimisation, animation polish, Apple Calendar sync toggle.

**Conventions:**
- `snake_case` DB · `camelCase` TS · `PascalCase` components · `kebab-case` screen files
- Hooks own all Supabase queries; UI never imports `supabase` directly
- `lib/supabase.ts` — single client · `components/ui/` — shared primitives · `types/index.ts` — type aliases
- Anthropic API key in Supabase secrets only, never in the client bundle
- Sessions in `expo-secure-store` (iOS Keychain), never `AsyncStorage`
- Edge Functions: auth → Pro check (Phase 6) → validate input → call AI → typed response
