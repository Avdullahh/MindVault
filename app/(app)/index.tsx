import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAI } from '../../hooks/use-ai';
import { useCalendarEvents } from '../../hooks/use-calendar-events';
import { useGoals, type GoalWithMilestones } from '../../hooks/use-goals';
import { useIdeas } from '../../hooks/use-ideas';
import { useTasks, type TaskWithGoal } from '../../hooks/use-tasks';
import { AIButton } from '../../components/ui/AIButton';
import type { CalendarEvent, Idea } from '../../types';

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

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function goalProgress(goal: GoalWithMilestones) {
  const steps = goal.milestones.flatMap((milestone) => milestone.action_steps);
  if (steps.length === 0) return 0;
  return Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-white text-lg font-semibold">{title}</Text>
      {action && onPress ? (
        <Pressable onPress={onPress}>
          <Text className="text-teal-400 text-sm font-medium">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View className="bg-gray-800 rounded-2xl px-4 py-5 border border-gray-700">
      <Text className="text-gray-500 text-sm">{text}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { ideas, loading: ideasLoading, refetch: refetchIdeas } = useIdeas();
  const { goals, loading: goalsLoading, refetch: refetchGoals } = useGoals();
  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks();
  const { events, loading: eventsLoading, refetch: refetchEvents } = useCalendarEvents();
  const { morningBrief, briefState } = useAI();

  const loading = ideasLoading || goalsLoading || tasksLoading || eventsLoading;
  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  );

  const allPendingTasks = useMemo(
    () => tasks
      .filter((task) => !task.done)
      .sort((a, b) => (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31')),
    [tasks],
  );
  const pendingTasks = useMemo(() => allPendingTasks.slice(0, 4), [allPendingTasks]);

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
  const upcomingEvents = useMemo(() => allUpcomingEvents.slice(0, 4), [allUpcomingEvents]);

  const recentIdeas = useMemo(() => ideas.slice(0, 3), [ideas]);
  const activeGoals = useMemo(
    () => goals
      .slice()
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) return b.created_at.localeCompare(a.created_at);
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      })
      .slice(0, 3),
    [goals],
  );

  const metrics: Metric[] = [
    { label: 'Ideas', value: ideas.length, icon: 'bulb-outline', route: '/(app)/ideas' },
    { label: 'Goals', value: goals.length, icon: 'flag-outline', route: '/(app)/goals' },
    { label: 'Tasks due', value: allPendingTasks.length, icon: 'checkmark-circle-outline', route: '/(app)/tasks' },
    { label: 'Upcoming', value: allUpcomingEvents.length, icon: 'calendar-outline', route: '/(app)/calendar' },
  ];

  const refresh = async () => {
    await Promise.all([refetchIdeas(), refetchGoals(), refetchTasks(), refetchEvents()]);
  };

  const renderTask = (task: TaskWithGoal) => (
    <Pressable
      key={task.id}
      className="bg-gray-800 rounded-xl px-4 py-3 mb-2 border border-gray-700"
      onPress={() => router.push('/(app)/tasks')}
    >
      <Text className="text-white font-medium" numberOfLines={1}>{task.title}</Text>
      <View className="flex-row items-center gap-2 mt-1">
        {task.goalTitle ? <Text className="text-gray-500 text-xs flex-1" numberOfLines={1}>From {task.goalTitle}</Text> : null}
        {task.due_date ? <Text className="text-teal-400 text-xs">{formatDate(task.due_date)}</Text> : null}
      </View>
    </Pressable>
  );

  const renderGoal = (goal: GoalWithMilestones) => {
    const progress = goalProgress(goal);
    return (
      <Pressable
        key={goal.id}
        className="bg-gray-800 rounded-xl px-4 py-3 mb-2 border border-gray-700"
        onPress={() => router.push(`/(app)/goals/${goal.id}`)}
      >
        <View className="flex-row items-start justify-between gap-3">
          <Text className="text-white font-medium flex-1" numberOfLines={1}>{goal.title}</Text>
          <Text className="text-gray-500 text-xs">{progress}%</Text>
        </View>
        <View className="h-1.5 bg-gray-700 rounded-full overflow-hidden mt-3">
          <View className="h-full bg-teal-500" style={{ width: `${progress}%` }} />
        </View>
      </Pressable>
    );
  };

  const renderIdea = (idea: Idea) => (
    <Pressable
      key={idea.id}
      className="bg-gray-800 rounded-xl px-4 py-3 mb-2 border border-gray-700"
      onPress={() => router.push(`/(app)/ideas/${idea.id}`)}
    >
      <Text className="text-white font-medium" numberOfLines={1}>{idea.title}</Text>
      {idea.description ? <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>{idea.description}</Text> : null}
    </Pressable>
  );

  const renderEvent = (event: CalendarEvent) => (
    <Pressable
      key={event.id}
      className="bg-gray-800 rounded-xl px-4 py-3 mb-2 border border-gray-700 flex-row gap-3"
      onPress={() => router.push('/(app)/calendar')}
    >
      <Text className="text-teal-400 text-xs font-semibold w-16">{formatEventTime(event)}</Text>
      <View className="flex-1">
        <Text className="text-white font-medium" numberOfLines={1}>{event.title}</Text>
        {event.notes ? <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>{event.notes}</Text> : null}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-row items-start justify-between px-5 pt-14 pb-4">
        <View>
          <Text className="text-2xl font-bold text-white">Home</Text>
          <Text className="text-gray-500 text-sm mt-1">{dateLabel}</Text>
        </View>
        <Pressable className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center" onPress={() => router.push('/(app)/settings')}>
          <Ionicons name="settings-outline" size={20} color="#6b7280" />
        </Pressable>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#2dd4bf" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap gap-3 mb-5">
          {metrics.map((metric) => (
            <Pressable
              key={metric.label}
              className="bg-gray-800 rounded-2xl p-4 border border-gray-700"
              style={{ width: '47%' }}
              onPress={() => router.push(metric.route)}
            >
              <Ionicons name={metric.icon} size={20} color="#2dd4bf" />
              <Text className="text-white text-2xl font-bold mt-3">{metric.value}</Text>
              <Text className="text-gray-500 text-xs mt-1">{metric.label}</Text>
            </Pressable>
          ))}
        </View>

        <View className="bg-gray-800 rounded-2xl p-4 mb-6 border border-teal-900">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-white font-semibold">Morning brief</Text>
              <Text className="text-gray-500 text-xs mt-1">Summarise today, surface ideas, and choose the next action.</Text>
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
              <ActivityIndicator color="#2dd4bf" />
              <Text className="text-gray-400 text-sm">Preparing brief...</Text>
            </View>
          ) : null}
          {briefState.status === 'error' ? (
            <Text className="text-red-400 text-sm mt-3">{briefState.error}</Text>
          ) : null}
          {briefState.status === 'success' && briefState.data ? (
            <View className="mt-4">
              <Text className="text-gray-200 text-sm leading-5">{briefState.data.greeting}</Text>
              {briefState.data.resurface ? (
                <Pressable
                  className="bg-gray-900 rounded-xl p-3 mt-3"
                  onPress={() => router.push('/(app)/ideas')}
                >
                  <Text className="text-teal-400 text-xs font-semibold uppercase">Resurface</Text>
                  <Text className="text-white font-medium mt-1" numberOfLines={1}>{briefState.data.resurface.title}</Text>
                  <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>{briefState.data.resurface.description}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <SectionHeader title="Next Tasks" action="View all" onPress={() => router.push('/(app)/tasks')} />
        <View className="mb-5">
          {pendingTasks.length > 0 ? pendingTasks.map(renderTask) : <EmptyCard text="No open tasks. Generate a project plan with AI or add a task manually." />}
        </View>

        <SectionHeader title="Active Goals" action="View all" onPress={() => router.push('/(app)/goals')} />
        <View className="mb-5">
          {activeGoals.length > 0 ? activeGoals.map(renderGoal) : <EmptyCard text="No goals yet. Turn an idea into a goal to connect planning with action." />}
        </View>

        <SectionHeader title="Upcoming Events" action="Calendar" onPress={() => router.push('/(app)/calendar')} />
        <View className="mb-5">
          {upcomingEvents.length > 0 ? upcomingEvents.map(renderEvent) : <EmptyCard text="No upcoming events linked to your thinking yet." />}
        </View>

        <SectionHeader title="Recent Ideas" action="Ideas" onPress={() => router.push('/(app)/ideas')} />
        <View>
          {recentIdeas.length > 0 ? recentIdeas.map(renderIdea) : <EmptyCard text="Capture an idea, then link it to goals, projects, tasks, or events." />}
        </View>
      </ScrollView>
    </View>
  );
}
