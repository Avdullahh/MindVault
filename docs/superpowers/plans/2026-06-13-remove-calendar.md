# Remove Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the calendar feature entirely from MindVault — all UI, components, hooks, types, dependencies, and the Supabase `calendar_events` table.

**Architecture:** Delete calendar files, surgically edit home screen and navigation to remove all calendar references, update the ai-morning-brief edge function to drop its calendar query, then write a migration to drop the DB table and FK column.

**Tech Stack:** React Native / Expo Router, TypeScript, Supabase (PostgreSQL migrations), Deno (edge functions)

---

### Task 1: Delete calendar screen, hook, and components

**Files:**
- Delete: `app/(app)/calendar/index.tsx`
- Delete: `hooks/use-calendar-events.ts`
- Delete: `components/EventItem.tsx`
- Delete: `components/CreateEventModal.tsx`
- Delete: `components/EditEventModal.tsx`
- Delete: `components/ui/DatePicker.tsx`

- [ ] **Step 1: Delete the files**

```bash
rm "app/(app)/calendar/index.tsx"
rmdir "app/(app)/calendar"
rm hooks/use-calendar-events.ts
rm components/EventItem.tsx
rm components/CreateEventModal.tsx
rm components/EditEventModal.tsx
rm components/ui/DatePicker.tsx
```

On Windows PowerShell:
```powershell
Remove-Item "app/(app)/calendar/index.tsx"
Remove-Item "app/(app)/calendar"
Remove-Item hooks/use-calendar-events.ts
Remove-Item components/EventItem.tsx
Remove-Item components/CreateEventModal.tsx
Remove-Item components/EditEventModal.tsx
Remove-Item components/ui/DatePicker.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Remove calendar screen, hook, and components"
```

---

### Task 2: Update navigation layout

**Files:**
- Modify: `app/(app)/_layout.tsx`

- [ ] **Step 1: Replace `_layout.tsx` with the calendar tab removed**

Replace the entire file with:

```tsx
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../lib/storage';
import { useThemeColors } from '../../context/ThemeContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const VALID_TABS = ['index', 'ideas/index', 'goals/index', 'projects/index'];

function tabIcon(name: IoniconsName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function AppLayout() {
  const colors = useThemeColors();
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.getLastTab().then((saved) => {
      setInitialTab(saved && VALID_TABS.includes(saved) ? saved : 'index');
      setReady(true);
    });
  }, []);

  if (!ready) return <View className="flex-1 bg-background" />;

  return (
    <Tabs
      initialRouteName={initialTab}
      screenListeners={{
        tabPress: (e) => {
          const routeName = e.target?.split('-')[0];
          if (routeName && VALID_TABS.includes(routeName)) {
            storage.setLastTab(routeName);
          }
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="ideas/index"
        options={{ title: 'Ideas', tabBarIcon: tabIcon('bulb-outline') }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{ title: 'Goals', tabBarIcon: tabIcon('flag-outline') }}
      />
      <Tabs.Screen
        name="projects/index"
        options={{ title: 'Projects', tabBarIcon: tabIcon('folder-outline') }}
      />
      <Tabs.Screen name="ideas/[id]" options={{ href: null }} />
      <Tabs.Screen name="goals/[id]" options={{ href: null }} />
      <Tabs.Screen name="projects/[id]" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/_layout.tsx
git commit -m "Remove calendar tab from navigation"
```

---

### Task 3: Update home screen

**Files:**
- Modify: `app/(app)/index.tsx`

Remove: `useCalendarEvents` import, `parseCalendarStoredDate` import, `CalendarEvent` type import, `fmtTime` helper, `eventTimeLabel` helper, `events`/`eventsLoading`/`refetchEvents` from hook call, `allUpcomingEvents`/`upcomingEvents` memos, the `Upcoming` metric, `renderEvent` function, the "Upcoming Events" section, and `refetchEvents` from the refresh call.

- [ ] **Step 1: Replace `app/(app)/index.tsx` with calendar references removed**

```tsx
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAI } from '../../hooks/use-ai';
import { useGoals } from '../../hooks/use-goals';
import { useIdeas } from '../../hooks/use-ideas';
import { useProjects } from '../../hooks/use-projects';
import { AIButton } from '../../components/ui/AIButton';
import { useThemeColors } from '../../context/ThemeContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Metric = {
  label: string;
  value: number;
  icon: IoniconsName;
  route: string;
};

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
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

function EmptyCard({ text }: { text: string }) {
  return (
    <View className="bg-surface rounded-2xl px-4 py-5 border border-border">
      <Text className="text-muted text-sm">{text}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { ideas, forgottenIdeas, loading: ideasLoading, refetch: refetchIdeas } = useIdeas();
  const { goals, loading: goalsLoading, refetch: refetchGoals } = useGoals();
  const { projects, loading: projectsLoading, refetch: refetchProjects } = useProjects();
  const { morningBrief, briefState } = useAI();

  const loading = ideasLoading || goalsLoading || projectsLoading;
  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  );

  const activeGoals = useMemo(
    () => goals
      .slice()
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) return b.created_at.localeCompare(a.created_at);
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      })
      .slice(0, 2),
    [goals],
  );

  const metrics = useMemo<Metric[]>(
    () => [
      { label: 'Ideas', value: ideas.length, icon: 'bulb-outline', route: '/(app)/ideas' },
      { label: 'Goals', value: goals.length, icon: 'flag-outline', route: '/(app)/goals' },
      { label: 'Projects', value: projects.length, icon: 'folder-outline', route: '/(app)/projects' },
    ],
    [ideas.length, goals.length, projects.length],
  );

  const refresh = async () => {
    await Promise.all([refetchIdeas(), refetchGoals(), refetchProjects()]);
  };

  const renderGoal = (goal: ReturnType<typeof useGoals>['goals'][number]) => (
    <Pressable
      key={goal.id}
      className="bg-surface rounded-xl px-4 py-3 mb-2 border border-border min-h-16 justify-center"
      onPress={() => router.push(`/(app)/goals/${goal.id}`)}
      accessibilityRole="button"
    >
      <Text className="text-foreground font-medium leading-5" style={{ includeFontPadding: false }} numberOfLines={1}>
        {goal.title}
      </Text>
      {goal.deadline ? (
        <Text className="text-muted text-xs leading-4 mt-1" style={{ includeFontPadding: false }}>
          Due {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      ) : null}
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-start justify-between px-5 pt-14 pb-4">
        <View>
          <Text className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Georgia' }}>Home</Text>
          <Text className="text-muted text-sm mt-1">{dateLabel}</Text>
        </View>
        <Pressable className="w-11 h-11 rounded-full bg-surface items-center justify-center border border-border" onPress={() => router.push('/(app)/settings')} accessibilityRole="button" accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={20} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, width: '100%', maxWidth: 760, alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap justify-between mb-5">
          {metrics.map((metric) => (
            <Pressable
              key={metric.label}
              className="bg-surface rounded-2xl p-4 border border-border min-h-28"
              style={{ width: '48%', marginBottom: 12 }}
              onPress={() => router.push(metric.route)}
              accessibilityRole="button"
            >
              <Ionicons name={metric.icon} size={20} color={colors.primary} />
              <Text className="text-foreground text-2xl font-bold mt-3">{metric.value}</Text>
              <Text className="text-muted text-xs mt-1">{metric.label}</Text>
            </Pressable>
          ))}
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-primary mb-5">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-foreground font-bold" style={{ fontFamily: 'Georgia' }}>Morning Brief</Text>
              <Text className="text-muted text-xs mt-1">Reads your ideas vault and surfaces a forgotten idea with an inspirational thought for the day.</Text>
            </View>
            <AIButton
              label={briefState.status === 'success' ? 'Refresh' : 'Generate'}
              loading={briefState.status === 'loading'}
              onPress={morningBrief}
              compact
            />
          </View>
          {briefState.status === 'loading' ? (
            <View className="flex-row items-center gap-2 mt-4">
              <ActivityIndicator color={colors.primary} />
              <Text className="text-muted text-sm">Preparing brief...</Text>
            </View>
          ) : null}
          {briefState.status === 'error' ? (
            <Text className="text-destructive text-sm mt-3">{briefState.error}</Text>
          ) : null}
          {briefState.status === 'success' && briefState.data ? (
            <View className="mt-4">
              <Text className="text-foreground text-sm leading-5">{briefState.data.greeting}</Text>
              {briefState.data.resurface ? (
                <Pressable
                  className="bg-background rounded-xl p-3 mt-3 min-h-16 border border-border"
                  onPress={() => router.push('/(app)/ideas')}
                >
                  <Text className="text-primary text-xs font-semibold uppercase">Resurface</Text>
                  <Text className="text-foreground font-medium mt-1" numberOfLines={1}>{briefState.data.resurface.title}</Text>
                  <Text className="text-muted text-xs mt-1" numberOfLines={2}>{briefState.data.resurface.description}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        {forgottenIdeas.length > 0 && (
          <View className="mb-5">
            <SectionHeader title="Revisit an Idea" />
            {forgottenIdeas.slice(0, 2).map((idea) => (
              <Pressable
                key={idea.id}
                className="bg-surface rounded-xl px-4 py-3 mb-2 border border-primary flex-row min-h-16 items-center justify-between"
                onPress={() => router.push(`/(app)/ideas/${idea.id}`)}
              >
                <View className="flex-1 mr-3">
                  <Text className="text-foreground font-medium" numberOfLines={1}>{idea.title}</Text>
                  {idea.description ? (
                    <Text className="text-muted text-xs mt-1" numberOfLines={1}>{idea.description}</Text>
                  ) : null}
                </View>
                <Text className="text-primary text-xs font-semibold">Revisit</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View className="mb-5">
          <SectionHeader title="Active Goals" action="View all" onPress={() => router.push('/(app)/goals')} />
          {activeGoals.length > 0 ? activeGoals.map(renderGoal) : <EmptyCard text="No goals yet. Turn an idea into a goal to connect planning with action." />}
        </View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/index.tsx
git commit -m "Remove calendar references from home screen"
```

---

### Task 4: Update types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Remove the three CalendarEvent type exports**

Replace the entire file with:

```ts
import type { Database } from './database.generated';

export type CategoryInsert    = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate    = Database['public']['Tables']['categories']['Update'];
export type Category      = Database['public']['Tables']['categories']['Row'];
export type TagInsert         = Database['public']['Tables']['tags']['Insert'];
export type TagUpdate         = Database['public']['Tables']['tags']['Update'];
export type Tag           = Database['public']['Tables']['tags']['Row'];
export type IdeaInsert        = Database['public']['Tables']['ideas']['Insert'];
export type IdeaUpdate        = Database['public']['Tables']['ideas']['Update'];
export type Idea          = Database['public']['Tables']['ideas']['Row'];
export type ProjectInsert     = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate     = Database['public']['Tables']['projects']['Update'];
export type Project       = Database['public']['Tables']['projects']['Row'];
export type GoalInsert        = Database['public']['Tables']['goals']['Insert'];
export type GoalUpdate        = Database['public']['Tables']['goals']['Update'];
export type Goal          = Database['public']['Tables']['goals']['Row'];
export type TaskInsert        = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate        = Database['public']['Tables']['tasks']['Update'];
export type Task          = Database['public']['Tables']['tasks']['Row'];
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "Remove CalendarEvent types"
```

---

### Task 5: Remove calendar dependencies from package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove `react-native-calendars` and `@react-native-community/datetimepicker`**

In `package.json`, delete these two lines from the `"dependencies"` section:
```
"@react-native-community/datetimepicker": "8.4.4",
"react-native-calendars": "^1.1314.0",
```

- [ ] **Step 2: Re-install dependencies**

```bash
npm install
```

Expected: Lock file updated, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Remove calendar npm dependencies"
```

---

### Task 6: Update ai-morning-brief edge function

**Files:**
- Modify: `supabase/functions/ai-morning-brief/index.ts`

Remove: `localDayBoundsUTC` helper, `bounds`/`timezone` logic, `calendar_events` query, `events` field from `BriefResult`, and `events` validation in `isValid`. The function now only fetches ideas and generates a brief around resurfacing an idea.

- [ ] **Step 1: Replace the file with the calendar query removed**

```ts
import { GeminiRequestError, generateText, parseJsonObject } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { badGateway, corsPreflight, internalError, ok, paymentRequired, unauthorised } from '../_shared/responses.ts';

type Resurface = { title: string; description: string };
type BriefResult = { greeting: string; resurface: Resurface | null };

function isValid(v: unknown): v is BriefResult {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.greeting !== 'string') return false;
  if (o.resurface !== null && o.resurface !== undefined) {
    if (typeof o.resurface !== 'object') return false;
    const r = o.resurface as Record<string, unknown>;
    if (typeof r.title !== 'string' || typeof r.description !== 'string') return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();

  try {
    const authed = await getAuthedClient(req);
    if (!authed) return unauthorised();
    if (!await checkProEntitlement(authed.userId)) return paymentRequired();

    const { data: ideas, error: ideasError } = await authed.client
      .from('ideas')
      .select('title, description')
      .order('last_viewed_at', { ascending: true, nullsFirst: true })
      .limit(1);

    if (ideasError) {
      console.error('Failed to load brief context', ideasError);
      return internalError('Failed to load brief context');
    }

    const resurface = (ideas ?? [])[0] as { title: string; description: string | null } | undefined;
    const today = new Intl.DateTimeFormat('en-CA').format(new Date());
    const raw = await generateText({
      system: 'You are a personal assistant writing a brief morning summary. Return only valid JSON and no markdown.',
      prompt: `Today is ${today}.\n\nIdea to resurface: ${resurface ? `"${resurface.title}"${resurface.description ? ` - ${resurface.description}` : ''}` : 'none'}\n\nRespond with JSON:\n{ "greeting": "short morning greeting", "resurface": { "title": "idea title", "description": "one-sentence teaser" } or null }`,
      maxTokens: 400,
    });

    let parsed: unknown;
    try { parsed = parseJsonObject(raw); } catch { return badGateway('Model returned invalid JSON'); }
    if (!isValid(parsed)) return badGateway();
    return ok(parsed);
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiRequestError) return badGateway(e.message);
    return internalError();
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/ai-morning-brief/index.ts
git commit -m "Remove calendar events from ai-morning-brief function"
```

---

### Task 7: Write Supabase migration to drop calendar_events

**Files:**
- Create: `supabase/migrations/20240108000000_remove_calendar_events.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Drop FK from tasks to calendar_events
ALTER TABLE tasks DROP COLUMN IF EXISTS calendar_event_id;

-- Drop calendar_events table (cascades RLS policies automatically)
DROP TABLE IF EXISTS calendar_events;
```

- [ ] **Step 2: Apply the migration to your local Supabase instance (if running locally)**

```bash
supabase db reset
```

Or push to a remote project:
```bash
supabase db push
```

Expected: Migration runs without errors. `calendar_events` table no longer exists.

- [ ] **Step 3: Regenerate Supabase types**

```bash
supabase gen types typescript --local > types/database.generated.ts
```

(If using a remote project, replace `--local` with `--project-id <your-project-id>`.)

Expected: `database.generated.ts` no longer contains `calendar_events` table definitions.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20240108000000_remove_calendar_events.sql types/database.generated.ts
git commit -m "Drop calendar_events table and tasks.calendar_event_id column"
```

---

## Completion Checklist

- [ ] `app/(app)/calendar/` directory deleted
- [ ] `hooks/use-calendar-events.ts` deleted
- [ ] `components/EventItem.tsx` deleted
- [ ] `components/CreateEventModal.tsx` deleted
- [ ] `components/EditEventModal.tsx` deleted
- [ ] `components/ui/DatePicker.tsx` deleted
- [ ] `_layout.tsx` has 4 tabs (no calendar)
- [ ] `index.tsx` has no calendar imports, no events section, 3 metrics
- [ ] `types/index.ts` has no CalendarEvent exports
- [ ] `package.json` has no `react-native-calendars` or `@react-native-community/datetimepicker`
- [ ] `ai-morning-brief/index.ts` has no `calendar_events` query
- [ ] Migration file created and applied
- [ ] `database.generated.ts` regenerated (no `calendar_events`)
