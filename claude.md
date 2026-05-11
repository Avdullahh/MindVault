# MindVault — Master Reference Document

---

## 1. What MindVault Is Trying to Achieve

### The Problem

Ideas are fragile. They arrive mid-conversation, during a morning walk, or right before sleep — and they vanish before you find something to write them on. The tools that do exist solve half the problem. Note apps capture ideas but rarely help you act on them. Calendars and task managers organise time but have no connection to the thinking that drives what you want to do with that time. The result is a graveyard of half-remembered ideas scattered across different apps, notebooks, and voice memos that never see daylight again. The idea existed. Then life happened. Then it was gone.

### The Vision

MindVault is a smart second brain for iOS — built iPad-first, fully accessible on iPhone — that solves the complete lifecycle of an idea in one place:

- **Capture** — a frictionless way to get ideas out of your head before they disappear, with AI standing by to expand them the moment you want to think further
- **Remember** — an active resurfacing engine that brings forgotten ideas back at the right moment, rather than letting them decay in a list you never return to
- **Plan** — AI-assisted goal planning that turns a vague idea into a structured plan with milestones, action steps, and realistic deadlines
- **Schedule** — a calendar that connects your ideas and goals to real time, so the gap between "I had an idea" and "I made time to act on it" collapses

MindVault is not a note-taking app. It is not a project manager. It is the connective layer between thinking and doing — a place where nothing gets lost to memory.

### Design Philosophy

**AI is a tool, not a behaviour.** Every AI feature requires a deliberate action from the user. Nothing fires automatically. AI suggests; the user decides. This keeps the experience intentional and avoids the intrusive feel of apps that process your content without being asked.

**Relationships, not silos.** Ideas, goals, tasks, and calendar events are interconnected. A goal knows which ideas inspired it. A calendar event knows which tasks and goals it relates to. An idea knows which projects reference it. Nothing lives in isolation because nothing in real thinking does either.

**Capture first, organise later.** The cost of adding an idea should feel like zero. Organisation — categories, tags, project links — happens after capture, either manually or with AI assistance on demand.

**Free to use, Pro to think deeper.** The core app — capture, organise, plan manually, schedule — is free. AI capabilities that go beyond the app itself (idea expansion, goal planning, auto-categorisation, the morning brief) are gated behind a Pro subscription, keeping the free experience complete and the Pro upgrade meaningful.

---

## 2. Technical Stack

### Expo (React Native) + TypeScript

**What it is:** Expo is the managed build and runtime platform for React Native — the framework that lets JavaScript and TypeScript developers build true native iOS and Android apps using React. React Native renders actual native platform views: a `<Text>` component becomes a `UILabel`, a `<ScrollView>` becomes a native `UIScrollView`. This is not a browser embedded in an app wrapper. It is the real native UI that Apple ships on every device.

**What it does in MindVault:** Every screen, modal, card, and interaction in MindVault is a React Native component. The iPad multi-column layout, the iPhone single-column stack, the swipe gestures, the keyboard-aware inputs, the smooth list scrolling — all of it is native performance. TypeScript runs throughout the entire codebase, meaning every component prop, every database record, and every API response is typed and verified at compile time before a single line runs on a device.

**Why not something else:** Capacitor wraps a web app in a Safari WebView, which gives a detectable non-native feel on lists and animations. Flutter uses Dart, an entirely different language. Swift/SwiftUI is native but requires abandoning the TypeScript and React knowledge already built. Expo is the fastest path to a high-quality native iOS app for a React developer.

---

### NativeWind

**What it is:** Tailwind CSS utilities for React Native. The same class-based styling system used in the web prototype — `bg-gray-900`, `text-teal-400`, `rounded-xl`, `dark:bg-white` — works directly in React Native components.

**What it does in MindVault:** Every component is styled using Tailwind utility classes. Dark and light mode follow the system setting automatically via `dark:` prefixes. There is no separate stylesheet system to maintain — styling lives co-located with the component markup, consistent across the entire app.

---

### Expo Router

**What it is:** A file-based navigation system for Expo, modelled closely after Next.js App Router. The file `app/ideas/[id].tsx` automatically creates a route for an individual idea screen. Layouts, modals, tab bars, and stack navigators are all declared through the file structure.

**What it does in MindVault:** Handles all navigation between screens — Dashboard, Ideas, Goals, Projects, Calendar, individual detail screens, and modals. Tab navigation for the bottom bar on iPhone. Sidebar navigation on iPad. Deep linking (e.g. a notification tapping into a specific idea) works automatically through the file-based URL structure.

---

### Supabase — PostgreSQL Database

**What it is:** A fully managed PostgreSQL database with auto-generated REST and GraphQL APIs, real-time WebSocket subscriptions, Row Level Security, and auto-generated TypeScript types from your schema.

**What it does in MindVault:** Every piece of user data — ideas, goals, projects, tasks, calendar events, categories, tags, and all their relationships — lives in Supabase PostgreSQL. Queries are made from the app using the Supabase JavaScript client (`@supabase/supabase-js`). The auto-generated TypeScript types mean the database schema and the app's type system stay in sync — if a column is renamed in the database, TypeScript immediately flags every place in the codebase that references it.

**Why PostgreSQL over MongoDB:** MindVault's data is inherently relational. Ideas link to goals, goals link to milestones, tasks link to calendar events and ideas. In PostgreSQL these are natural foreign key relationships and SQL joins. In MongoDB each cross-document relationship requires application-level merging or complex aggregation pipelines. PostgreSQL also supports `pgvector` — the extension that enables semantic search over ideas using AI embeddings — natively inside the same database, without a separate vector database service.

---

### Supabase Auth

**What it is:** A complete authentication system built into Supabase, supporting Apple Sign In, email/password, magic links, and OAuth providers. Sessions are managed with JWTs and refreshed automatically by the client SDK.

**What it does in MindVault:** Handles all user registration, login, and session management. Apple Sign In is the primary flow on iOS — one tap, Face ID, done. Email and password is available as an alternative. The authenticated user's `id` (`auth.uid()`) is what every Row Level Security policy checks against, so authentication is the foundation of the entire security model.

---

### Supabase Row Level Security (RLS)

**What it is:** PostgreSQL's built-in access control system. Policies are written directly in SQL and enforced at the database engine level — they cannot be bypassed by the application layer, even if there is a bug in the application code.

**What it does in MindVault:** Every table that contains user data has RLS enabled with a policy that checks `auth.uid() = user_id`. This means even if someone obtained another user's database ID, they could not read or write that user's ideas, goals, or any other data. The database itself refuses the query before it executes. This is the security foundation of the entire app.

---

### Supabase Edge Functions

**What it is:** TypeScript serverless functions that run on Deno at the edge (globally distributed, close to users), deployed and hosted entirely within Supabase. No separate server, no separate hosting account, no separate deployment pipeline.

**What it does in MindVault:** Every call to the Anthropic API goes through a Supabase Edge Function. The client app never touches the Anthropic API directly and never holds the API key. The Edge Function receives the user's request, verifies the user is authenticated (via the JWT in the request header), checks the user's Pro subscription status via RevenueCat before processing any AI request, calls Anthropic, and returns the result. This is also where the daily morning brief is generated when the user opens the notification.

The Edge Functions MindVault needs:
- `ai-categorise` — suggests a category for a captured idea
- `ai-expand-idea` — returns questions, angles, and related concepts for an idea
- `ai-plan-goal` — returns a refined title, deadline, priority, milestones, and action steps for a goal
- `ai-morning-brief` — generates the daily summary of calendar events and resurfaces a forgotten idea

---

### Anthropic Claude API

**What it is:** The AI model API powering all of MindVault's intelligent features. `claude-sonnet-4-5` is used as the model — capable enough for all the reasoning tasks MindVault needs, fast enough for real-time use.

**What it does in MindVault:** Powers all four AI features — idea expansion, goal planning, auto-categorisation, and the morning brief. Every call is made server-side from an Edge Function with the API key stored as an environment variable in Supabase. The user's data sent to Anthropic is limited to the minimum required for the task — no entire vault is sent for a categorisation request.

---

### RevenueCat

**What it is:** The industry-standard iOS in-app subscription management SDK. Handles App Store purchase flows, receipt validation, entitlement management, and cross-device subscription status.

**What it does in MindVault:** Manages the Free/Pro split. When a user subscribes, RevenueCat tracks their entitlement. The Edge Functions check this entitlement server-side before processing any AI request — the client app cannot fake a Pro status to unlock AI features because the check happens on the server, not on the device.

---

### expo-calendar

**What it is:** An Expo SDK module that provides read and write access to the native Apple Calendar via EventKit.

**What it does in MindVault:** Powers the optional Apple Calendar sync toggle. When the user enables it, MindVault reads existing Apple Calendar events into its own calendar view and writes new MindVault calendar events back to Apple Calendar. The `apple_calendar_event_id` column on MindVault's `calendar_events` table stores the external identifier so updates stay in sync. Sync is off by default — MindVault's calendar works fully without it.

---

### expo-notifications

**What it is:** An Expo SDK module for scheduling and receiving push notifications on iOS.

**What it does in MindVault:** Powers the single MVP notification — the daily morning brief. The notification is scheduled locally at the user's chosen time. When tapped, it opens the app to the morning brief screen, which then calls the `ai-morning-brief` Edge Function to generate the personalised summary. Local scheduling means the notification fires reliably without a server push for this use case.

---

### EAS Build + EAS Submit

**What it is:** Expo Application Services — a cloud build and submission system. EAS Build compiles the native iOS binary in the cloud without needing Xcode running locally. EAS Submit sends the built binary directly to App Store Connect.

**What it does in MindVault:** Handles every iOS build. Developing on a Windows machine, this is the only practical path to building an iOS app — EAS Build runs the Xcode compilation on Expo's macOS build machines. For family testing, builds are distributed directly via TestFlight without an App Store review. For release, EAS Submit automates the App Store submission.

---

## 3. The 17-Table Schema

### Overview

The schema is organised into three groups: **core entities** (the main data objects), **task-related tables** (goals' internal structure and standalone tasks), and **junction tables** (the many-to-many relationship layer). Every core table with user data is protected by RLS. Junction tables are protected indirectly — if you cannot access the parent row, you cannot reach the junction.

---

### Core Entities

---

#### `categories`
Applies to ideas, tasks, goals, and projects. "Other" is the protected fallback that cannot be deleted.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE |
| `name` | `text` | NOT NULL |
| `is_protected` | `boolean` | NOT NULL, default `false` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**Constraints:** `UNIQUE(user_id, name)` — a user cannot have two categories with the same name.

**RLS:** `auth.uid() = user_id`

---

#### `tags`
A global reusable label library per user. Tags are shared across all ideas, so "startup" added to one idea is the same entity as "startup" on another.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE |
| `name` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**Constraints:** `UNIQUE(user_id, name)` — a user cannot have duplicate tags.

**RLS:** `auth.uid() = user_id`

---

#### `ideas`
Always global. Ideas are never owned by a project — projects reference ideas through a junction table. This means one idea can appear in multiple projects simultaneously without duplication.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE |
| `category_id` | `uuid` | NULLABLE, FK → `categories.id` ON DELETE SET NULL |
| `title` | `text` | NOT NULL |
| `description` | `text` | NULLABLE |
| `last_viewed_at` | `timestamptz` | NULLABLE — updated every time the idea is opened, drives the resurfacing engine |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**RLS:** `auth.uid() = user_id`

**Relationships out:**
- Many tags via `idea_tags`
- Many projects via `project_ideas`
- Many goals via `goal_ideas`
- Many tasks via `task_ideas`
- Many calendar events via `event_ideas`

---

#### `projects`
A named container with a mission statement. Projects do not own ideas — they reference them. A project can have a category, goals (which may belong to the project), and any number of referenced ideas.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE |
| `category_id` | `uuid` | NULLABLE, FK → `categories.id` ON DELETE SET NULL |
| `title` | `text` | NOT NULL |
| `main_goal` | `text` | NULLABLE — the overarching outcome, no milestones |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**RLS:** `auth.uid() = user_id`

**Relationships out:**
- Many ideas via `project_ideas`
- Many goals via `goals.project_id` (a goal optionally declares which project it belongs to)

---

#### `goals`
Can exist independently or be attached to a project. Each goal has a structured breakdown via milestones and action steps. Goals can link to the ideas that inspired them and to calendar events and tasks that relate to their execution.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE |
| `project_id` | `uuid` | NULLABLE, FK → `projects.id` ON DELETE SET NULL |
| `category_id` | `uuid` | NULLABLE, FK → `categories.id` ON DELETE SET NULL |
| `title` | `text` | NOT NULL |
| `deadline` | `date` | NULLABLE |
| `priority` | `text` | NULLABLE, CHECK IN (`'high'`, `'medium'`, `'low'`) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**RLS:** `auth.uid() = user_id`

**Relationships out:**
- Many ideas via `goal_ideas`
- Many tasks via `task_goals`
- Many calendar events via `event_goals`
- Many milestones via `milestones.goal_id`

---

#### `calendar_events`
MindVault's own event record. Apple Calendar is a mirror, not the source of truth. The `apple_calendar_event_id` column is populated only when the user has sync enabled and the event has been written to Apple Calendar.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE |
| `category_id` | `uuid` | NULLABLE, FK → `categories.id` ON DELETE SET NULL |
| `title` | `text` | NOT NULL |
| `start_at` | `timestamptz` | NOT NULL |
| `end_at` | `timestamptz` | NULLABLE |
| `all_day` | `boolean` | NOT NULL, default `false` |
| `notes` | `text` | NULLABLE |
| `apple_calendar_event_id` | `text` | NULLABLE — external Apple Calendar identifier |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**RLS:** `auth.uid() = user_id`

**Relationships out:**
- Many ideas via `event_ideas`
- Many goals via `event_goals`
- Many tasks via `event_tasks`

---

### Task-Related Tables

---

#### `tasks`
Standalone tasks that are independent of the goal/milestone structure. A task can optionally be promoted to a calendar event by the user — when promoted, `calendar_event_id` is populated and the task appears on the calendar. Tasks also carry direct links to ideas and goals that provide their context.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE |
| `category_id` | `uuid` | NULLABLE, FK → `categories.id` ON DELETE SET NULL |
| `calendar_event_id` | `uuid` | NULLABLE, FK → `calendar_events.id` ON DELETE SET NULL |
| `title` | `text` | NOT NULL |
| `due_date` | `date` | NULLABLE |
| `priority` | `text` | NULLABLE, CHECK IN (`'high'`, `'medium'`, `'low'`) |
| `notes` | `text` | NULLABLE |
| `done` | `boolean` | NOT NULL, default `false` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**RLS:** `auth.uid() = user_id`

**Relationships out:**
- Many ideas via `task_ideas`
- Many goals via `task_goals`
- One calendar event via `calendar_event_id` (when promoted)

---

#### `milestones`
Live inside goals. Cascade delete means removing a goal removes all its milestones. Position controls display order and is maintained by the app when the user reorders.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `goal_id` | `uuid` | NOT NULL, FK → `goals.id` ON DELETE CASCADE |
| `title` | `text` | NOT NULL |
| `position` | `integer` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**Note:** No `user_id` column — ownership is inherited from the parent goal. RLS on goals provides protection; milestones are always fetched through their goal.

---

#### `action_steps`
Live inside milestones. Cascade delete means removing a milestone removes all its action steps. Progress through action steps drives the milestone and goal completion percentage shown in the UI.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `milestone_id` | `uuid` | NOT NULL, FK → `milestones.id` ON DELETE CASCADE |
| `title` | `text` | NOT NULL |
| `done` | `boolean` | NOT NULL, default `false` |
| `position` | `integer` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**Note:** Ownership inherited from milestone → goal chain.

---

### Junction Tables

Each junction table represents a many-to-many relationship. All use composite primary keys. Both foreign keys cascade on delete — if either side of the relationship is deleted, the link is removed automatically.

---

#### `idea_tags`
Links ideas to their tags.
| Column | Type | Constraints |
|---|---|---|
| `idea_id` | `uuid` | NOT NULL, FK → `ideas.id` ON DELETE CASCADE |
| `tag_id` | `uuid` | NOT NULL, FK → `tags.id` ON DELETE CASCADE |
| **PRIMARY KEY** | | `(idea_id, tag_id)` |

---

#### `project_ideas`
Links projects to their referenced ideas. Ideas are global; this table says which projects consider a given idea relevant.
| Column | Type | Constraints |
|---|---|---|
| `project_id` | `uuid` | NOT NULL, FK → `projects.id` ON DELETE CASCADE |
| `idea_id` | `uuid` | NOT NULL, FK → `ideas.id` ON DELETE CASCADE |
| `added_at` | `timestamptz` | NOT NULL, default `now()` |
| **PRIMARY KEY** | | `(project_id, idea_id)` |

---

#### `goal_ideas`
Links goals to the ideas that inspired them. One goal can be inspired by many ideas; one idea can inspire many goals.
| Column | Type | Constraints |
|---|---|---|
| `goal_id` | `uuid` | NOT NULL, FK → `goals.id` ON DELETE CASCADE |
| `idea_id` | `uuid` | NOT NULL, FK → `ideas.id` ON DELETE CASCADE |
| **PRIMARY KEY** | | `(goal_id, idea_id)` |

---

#### `task_ideas`
Links standalone tasks to related ideas.
| Column | Type | Constraints |
|---|---|---|
| `task_id` | `uuid` | NOT NULL, FK → `tasks.id` ON DELETE CASCADE |
| `idea_id` | `uuid` | NOT NULL, FK → `ideas.id` ON DELETE CASCADE |
| **PRIMARY KEY** | | `(task_id, idea_id)` |

---

#### `task_goals`
Links standalone tasks to related goals.
| Column | Type | Constraints |
|---|---|---|
| `task_id` | `uuid` | NOT NULL, FK → `tasks.id` ON DELETE CASCADE |
| `goal_id` | `uuid` | NOT NULL, FK → `goals.id` ON DELETE CASCADE |
| **PRIMARY KEY** | | `(task_id, goal_id)` |

---

#### `event_ideas`
Links calendar events to related ideas.
| Column | Type | Constraints |
|---|---|---|
| `event_id` | `uuid` | NOT NULL, FK → `calendar_events.id` ON DELETE CASCADE |
| `idea_id` | `uuid` | NOT NULL, FK → `ideas.id` ON DELETE CASCADE |
| **PRIMARY KEY** | | `(event_id, idea_id)` |

---

#### `event_goals`
Links calendar events to related goals.
| Column | Type | Constraints |
|---|---|---|
| `event_id` | `uuid` | NOT NULL, FK → `calendar_events.id` ON DELETE CASCADE |
| `goal_id` | `uuid` | NOT NULL, FK → `goals.id` ON DELETE CASCADE |
| **PRIMARY KEY** | | `(event_id, goal_id)` |

---

#### `event_tasks`
Links calendar events to tasks. Serves two purposes: tasks manually linked to an event, and tasks that have been promoted to calendar events (those also carry `tasks.calendar_event_id` for direct lookup).
| Column | Type | Constraints |
|---|---|---|
| `event_id` | `uuid` | NOT NULL, FK → `calendar_events.id` ON DELETE CASCADE |
| `task_id` | `uuid` | NOT NULL, FK → `tasks.id` ON DELETE CASCADE |
| **PRIMARY KEY** | | `(event_id, task_id)` |

---

### Complete Relationship Map

```
auth.users
  │
  ├── categories (user_id)
  │     └── referenced by ideas, goals, projects, tasks, calendar_events
  │
  ├── tags (user_id)
  │     └── idea_tags ──────────────────────────── ideas
  │
  ├── ideas (user_id, category_id)
  │     ├── idea_tags ──── tags
  │     ├── project_ideas ─ projects
  │     ├── goal_ideas ──── goals
  │     ├── task_ideas ──── tasks
  │     └── event_ideas ─── calendar_events
  │
  ├── projects (user_id, category_id)
  │     ├── project_ideas ─ ideas
  │     └── goals.project_id (goals that belong to this project)
  │
  ├── goals (user_id, project_id, category_id)
  │     ├── goal_ideas ──── ideas
  │     ├── task_goals ──── tasks
  │     ├── event_goals ─── calendar_events
  │     └── milestones
  │           └── action_steps
  │
  ├── tasks (user_id, category_id, calendar_event_id)
  │     ├── task_ideas ──── ideas
  │     └── task_goals ──── goals
  │
  └── calendar_events (user_id, category_id)
        ├── event_ideas ─── ideas
        ├── event_goals ─── goals
        └── event_tasks ─── tasks
```

---

## 4. Building Approach & Best Practices

### Build Order

The order matters. Each phase builds on a stable foundation before adding complexity.

**Phase 1 — Foundation**
Set up the Supabase project, run the full schema SQL, enable RLS on every table, and write all policies before writing a single line of app code. Generate TypeScript types using the Supabase CLI immediately (`supabase gen types typescript`). This means types are available from day one and all future code is typed against the real schema.

**Phase 2 — Expo Project Setup**
Initialise the Expo project with TypeScript template. Install and configure NativeWind, Expo Router, and the Supabase client. Create a centralised Supabase client module that is imported everywhere — never instantiate the client in component files.

**Phase 3 — Authentication**
Build auth before anything else. Login, registration, Apple Sign In, and session persistence. Every subsequent screen depends on the authenticated user. Validate that RLS is working correctly at this stage by attempting to read data as an unauthenticated user and confirming it fails.

**Phase 4 — Core Features (in order)**
Ideas → Categories and Tags → Goals and Milestones → Projects → Calendar → Tasks → Cross-linking (junction table UI)

Build each feature vertically: data hook → screen → component — before moving to the next. Do not build all screens first and then wire data.

**Phase 5 — AI Features**
Build all four Edge Functions. Test them independently via the Supabase dashboard before connecting them to the app. Gate every function behind auth and subscription checks from the start — never add the gate later as an afterthought.

**Phase 6 — Subscriptions**
Integrate RevenueCat. Build the paywall UI. Verify that removing Pro entitlement immediately removes AI feature access without requiring an app restart.

**Phase 7 — Notifications + Polish**
Daily brief scheduling, iPad layout optimisation, animation polish, Apple Calendar sync toggle.

---

### Code Readability

**Consistent naming conventions throughout.** Database columns use `snake_case` (Postgres convention). TypeScript variables, functions, and components use `camelCase`. React Native components use `PascalCase`. Files use `kebab-case` for screens (`idea-detail.tsx`) and `PascalCase` for component files (`IdeaCard.tsx`).

**One component, one responsibility.** A component that fetches data, transforms it, and renders UI is doing three jobs. Keep components focused on rendering. Data fetching belongs in hooks. Transformation logic belongs in utilities.

**Hard size limits.** Any component file exceeding 150 lines should be a signal to extract a child component or move logic to a hook. Any function exceeding 30 lines should be reviewed for extraction. These are guardrails, not rules — but consistently crossing them is a sign of accumulating complexity.

**Name things for what they do, not what they are.** `useIdeas` is better than `useIdeaData`. `formatDeadlineLabel` is better than `formatDate`. `IdeaResurfaceCard` is better than `SpecialIdeaCard`. A name that describes behaviour is documentation that never goes out of date.

---

### Deduplication

**Single Supabase client.** Create one file — `lib/supabase.ts` — that exports the configured client. Import it everywhere. Never call `createClient()` in a component or hook.

**Custom hooks for every data operation.** Every table gets its own hook file: `hooks/use-ideas.ts`, `hooks/use-goals.ts`, etc. Each hook exposes the data, loading state, error state, and mutation functions for that entity. Components never write Supabase queries directly — they call the hook.

```typescript
// hooks/use-ideas.ts
export function useIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = async () => { ... }
  const create = async (data: IdeaInsert) => { ... }
  const update = async (id: string, data: IdeaUpdate) => { ... }
  const remove = async (id: string) => { ... }

  return { ideas, loading, error, create, update, remove };
}
```

**Shared UI component library.** Create a `components/ui/` directory for primitives — `Button`, `Card`, `Badge`, `ProgressBar`, `Tag`, `EmptyState`. Every feature screen imports from this directory. A visual change to a button updates every button in the app in one edit.

**Centralised type aliases.** The Supabase CLI generates a large `Database` type. Create human-readable aliases in `types/index.ts`:

```typescript
import type { Database } from './database.generated';
export type Idea = Database['public']['Tables']['ideas']['Row'];
export type IdeaInsert = Database['public']['Tables']['ideas']['Insert'];
export type Goal = Database['public']['Tables']['goals']['Row'];
// etc.
```

---

### Separation of Concerns

**Three distinct layers — never let them bleed into each other.**

The **UI layer** (`components/`, `app/`) contains only React Native components. It reads from hooks and calls hook functions. It never imports the Supabase client directly. It never calls `fetch()`. It never contains business logic.

The **data layer** (`hooks/`, `lib/`) contains all Supabase queries, all data transformation, and all state management. It never imports React Native components. It exports data and functions. It is completely testable without rendering anything.

The **AI layer** (`supabase/functions/`) contains all Anthropic API calls. It runs on the server. It never runs on the client. The client sends a structured request and receives a structured response — it never knows which AI model was called, which prompt was used, or what the API key is.

**Edge Functions are the AI boundary.** The structure of every Edge Function is the same: authenticate the request → verify Pro entitlement → validate the input → call Anthropic → return a typed response. Nothing else belongs in an Edge Function.

```typescript
// supabase/functions/ai-expand-idea/index.ts
Deno.serve(async (req) => {
  // 1. Authenticate
  const user = await getAuthenticatedUser(req);
  if (!user) return unauthorised();

  // 2. Check Pro entitlement
  const isPro = await checkProEntitlement(user.id);
  if (!isPro) return paymentRequired();

  // 3. Validate input
  const { ideaTitle, ideaDescription } = await req.json();
  if (!ideaTitle) return badRequest('ideaTitle is required');

  // 4. Call Anthropic
  const result = await expandIdea(ideaTitle, ideaDescription);

  // 5. Return structured response
  return ok(result);
});
```

---

### Security

**The API key never leaves the server.** The Anthropic API key is stored as a Supabase secret (`supabase secrets set ANTHROPIC_API_KEY=...`). It is available only inside Edge Functions as `Deno.env.get('ANTHROPIC_API_KEY')`. It is never in the client app bundle, never in environment variables that get compiled into the app, and never in any log.

**Subscription validation is server-side.** RevenueCat's entitlement status is checked inside the Edge Function using RevenueCat's REST API, not the client SDK. A user cannot intercept network traffic and fake a Pro subscription — the Edge Function validates independently of what the client claims.

**RLS is the last line of defence, not the first.** The app enforces access control at the UI level (don't show data that doesn't belong to the user). RLS enforces it at the database level (the query is rejected even if the UI check is bypassed). Both are required. RLS alone is not enough because it doesn't prevent a user from making valid but unintended queries. UI checks alone are not enough because they can be bypassed.

**Validate all inputs before database writes.** Every mutation in a hook validates the input before sending it to Supabase. Required fields are checked, string lengths are capped, enum values are validated against the allowed set. An invalid input returns an error to the UI — it never reaches the database.

**Minimal data to AI.** When calling the Anthropic API, send only what is necessary for the task. The `ai-categorise` function receives a title and optional description — not the user's entire idea vault. The `ai-expand-idea` function receives one idea — not the user's other ideas. Less data sent means less exposure if anything were ever logged or intercepted.

**Use `expo-secure-store` for sensitive local data.** The Supabase session token — which acts as the user's authentication credential — is stored using `expo-secure-store`, which uses the iOS Keychain under the hood. It is never stored in `AsyncStorage`, which is unencrypted plain text on the device filesystem.

**No secrets in source control.** `.env` files containing keys are listed in `.gitignore` before the first commit. Supabase project URLs and anon keys (which are safe to expose as they are protected by RLS) are the only Supabase values in the app. Everything else is a Supabase secret or a RevenueCat server key that stays server-side.
