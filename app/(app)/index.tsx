import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAI } from '../../hooks/use-ai';
import { useCalendarEvents } from '../../hooks/use-calendar-events';
import { useGoals, type GoalWithMilestones } from '../../hooks/use-goals';
import { useIdeas } from '../../hooks/use-ideas';
import { useProjects } from '../../hooks/use-projects';
import { AIButton } from '../../components/ui/AIButton';
import type { CalendarEvent } from '../../types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Metric = {
  label: string;
  value: number;
  icon: IoniconsName;
  route: string;
};

function formatEventTime(event: CalendarEvent) {
  if (event.all_day) return 'All day';
  return new Date(event.start_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function goalProgress(goal: GoalWithMilestones) {
  let done = 0, total = 0;
  for (const m of goal.milestones) for (const s of m.action_steps) { total++; if (s.done) done++; }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-leather-50 text-lg font-semibold">{title}</Text>
      {action && onPress ? (
        <Pressable className="min-h-11 px-2 -mr-2 items-center justify-center" onPress={onPress}>
          <Text className="text-gold-400 text-sm font-medium">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View className="bg-leather-800 rounded-2xl px-4 py-5 border border-leather-600">
      <Text className="text-leather-400 text-sm">{text}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { ideas, forgottenIdeas, loading: ideasLoading, refetch: refetchIdeas } = useIdeas();
  const { goals, loading: goalsLoading, refetch: refetchGoals } = useGoals();
  const { projects, loading: projectsLoading, refetch: refetchProjects } = useProjects();
  const { events, loading: eventsLoading, refetch: refetchEvents } = useCalendarEvents();
  const { morningBrief, briefState } = useAI();

  const loading = ideasLoading || goalsLoading || projectsLoading || eventsLoading;
  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  );

  const allUpcomingEvents = useMemo(
    () => events
      .filter((event) => {
        if (event.end_at) return new Date(event.end_at).getTime() >= Date.now();
        const endOfDay = new Date(event.start_at);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay.getTime() >= Date.now();
      })
      .sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [events],
  );
  const upcomingEvents = useMemo(() => allUpcomingEvents.slice(0, 3), [allUpcomingEvents]);

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

  const goalProgressMap = useMemo(
    () => Object.fromEntries(activeGoals.map((g) => [g.id, goalProgress(g)])),
    [activeGoals],
  );

  const metrics = useMemo<Metric[]>(
    () => [
      { label: 'Ideas', value: ideas.length, icon: 'bulb-outline', route: '/(app)/ideas' },
      { label: 'Goals', value: goals.length, icon: 'flag-outline', route: '/(app)/goals' },
      { label: 'Projects', value: projects.length, icon: 'folder-outline', route: '/(app)/projects' },
      { label: 'Upcoming', value: allUpcomingEvents.length, icon: 'calendar-outline', route: '/(app)/calendar' },
    ],
    [ideas.length, goals.length, projects.length, allUpcomingEvents.length],
  );

  const refresh = async () => {
    await Promise.all([refetchIdeas(), refetchGoals(), refetchProjects(), refetchEvents()]);
  };

  const renderGoal = (goal: GoalWithMilestones) => {
    const progress = goalProgressMap[goal.id] ?? 0;
    return (
      <Pressable
        key={goal.id}
        className="bg-leather-800 rounded-xl px-4 py-3 mb-2 border border-leather-600 min-h-16"
        onPress={() => router.push(`/(app)/goals/${goal.id}`)}
        accessibilityRole="button"
      >
        <View className="flex-row items-start justify-between gap-3">
          <Text className="text-leather-50 font-medium flex-1" numberOfLines={1}>{goal.title}</Text>
          <Text className="text-leather-400 text-xs">{progress}%</Text>
        </View>
        <View className="h-1.5 bg-leather-600 rounded-full overflow-hidden mt-3">
          <View className="h-full bg-gold-500" style={{ width: `${progress}%` }} />
        </View>
      </Pressable>
    );
  };

  const renderEvent = (event: CalendarEvent) => (
    <Pressable
      key={event.id}
      className="bg-leather-800 rounded-xl px-4 py-3 mb-2 border border-leather-600 flex-row gap-3 min-h-16"
      onPress={() => router.push('/(app)/calendar')}
      accessibilityRole="button"
    >
      <Text className="text-gold-400 text-xs font-semibold w-16">{formatEventTime(event)}</Text>
      <View className="flex-1">
        <Text className="text-leather-50 font-medium" numberOfLines={1}>{event.title}</Text>
        {event.notes ? <Text className="text-leather-400 text-xs mt-1" numberOfLines={1}>{event.notes}</Text> : null}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-leather-900">
      <View className="flex-row items-start justify-between px-5 pt-14 pb-4">
        <View>
          <Text className="text-2xl font-bold text-leather-50" style={{ fontFamily: 'Georgia' }}>Home</Text>
          <Text className="text-leather-400 text-sm mt-1">{dateLabel}</Text>
        </View>
        <Pressable className="w-11 h-11 rounded-full bg-leather-800 items-center justify-center" onPress={() => router.push('/(app)/settings')} accessibilityRole="button" accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={20} color="#7a6050" />
        </Pressable>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#d4a017" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap gap-3 mb-5">
          {metrics.map((metric) => (
            <Pressable
              key={metric.label}
              className="bg-leather-800 rounded-2xl p-4 border border-leather-600 min-h-28"
              style={{ width: '47%' }}
              onPress={() => router.push(metric.route)}
              accessibilityRole="button"
            >
              <Ionicons name={metric.icon} size={20} color="#d4a017" />
              <Text className="text-leather-50 text-2xl font-bold mt-3">{metric.value}</Text>
              <Text className="text-leather-400 text-xs mt-1">{metric.label}</Text>
            </Pressable>
          ))}
        </View>

        {forgottenIdeas.length > 0 && (
          <View className="mb-5">
            <SectionHeader title="Revisit an Idea" />
            {forgottenIdeas.slice(0, 2).map((idea) => (
              <Pressable
                key={idea.id}
                className="bg-leather-800 rounded-xl px-4 py-3 mb-2 border border-gold-900 flex-row min-h-16 items-center justify-between"
                onPress={() => router.push(`/(app)/ideas/${idea.id}`)}
              >
                <View className="flex-1 mr-3">
                  <Text className="text-leather-50 font-medium" numberOfLines={1}>{idea.title}</Text>
                  {idea.description ? (
                    <Text className="text-leather-400 text-xs mt-1" numberOfLines={1}>{idea.description}</Text>
                  ) : null}
                </View>
                <Text className="text-gold-400 text-xs font-semibold">Revisit</Text>
              </Pressable>
            ))}
          </View>
        )}

        <SectionHeader title="Active Goals" action="View all" onPress={() => router.push('/(app)/goals')} />
        <View className="mb-5">
          {activeGoals.length > 0 ? activeGoals.map(renderGoal) : <EmptyCard text="No goals yet. Turn an idea into a goal to connect planning with action." />}
        </View>

        <SectionHeader title="Upcoming Events" action="Calendar" onPress={() => router.push('/(app)/calendar')} />
        <View className="mb-6">
          {upcomingEvents.length > 0 ? upcomingEvents.map(renderEvent) : <EmptyCard text="No upcoming events linked to your thinking yet." />}
        </View>

        <View className="bg-leather-800 rounded-2xl p-4 border border-gold-900">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-leather-50 font-semibold">Morning brief</Text>
              <Text className="text-leather-400 text-xs mt-1">Reads your calendar events and ideas vault, then surfaces a forgotten idea and today's agenda.</Text>
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
              <ActivityIndicator color="#d4a017" />
              <Text className="text-leather-300 text-sm">Preparing brief...</Text>
            </View>
          ) : null}
          {briefState.status === 'error' ? (
            <Text className="text-red-400 text-sm mt-3">{briefState.error}</Text>
          ) : null}
          {briefState.status === 'success' && briefState.data ? (
            <View className="mt-4">
              <Text className="text-leather-100 text-sm leading-5">{briefState.data.greeting}</Text>
              {briefState.data.resurface ? (
                <Pressable
                  className="bg-leather-900 rounded-xl p-3 mt-3 min-h-16"
                  onPress={() => router.push('/(app)/ideas')}
                >
                  <Text className="text-gold-400 text-xs font-semibold uppercase">Resurface</Text>
                  <Text className="text-leather-50 font-medium mt-1" numberOfLines={1}>{briefState.data.resurface.title}</Text>
                  <Text className="text-leather-400 text-xs mt-1" numberOfLines={2}>{briefState.data.resurface.description}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
