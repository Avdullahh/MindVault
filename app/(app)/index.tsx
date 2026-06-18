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
import { formatWeekdayLong, formatShortDate } from '../../lib/date-format';

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
    () => formatWeekdayLong(new Date()),
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
          Due {formatShortDate(new Date(goal.deadline))}
        </Text>
      ) : null}
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-start justify-between px-5 pt-14 pb-4">
        <View>
          <Text className="text-2xl font-bold text-foreground font-rounded">Home</Text>
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
              <Text className="text-foreground font-bold font-rounded">Morning Brief</Text>
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
