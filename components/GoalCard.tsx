import { Pressable, Text, View } from 'react-native';
import { Badge } from './ui/Badge';
import type { GoalWithMilestones } from '../hooks/use-goals';

type Props = {
  goal: GoalWithMilestones;
  onPress: () => void;
};

function deadlineColor(deadline: string | null): 'red' | 'yellow' | 'gray' {
  if (!deadline) return 'gray';
  const days = (new Date(deadline).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return 'red';
  if (days < 7) return 'yellow';
  return 'gray';
}

function priorityColor(p: string | null): 'red' | 'yellow' | 'gray' {
  if (p === 'high') return 'red';
  if (p === 'medium') return 'yellow';
  return 'gray';
}

function calcProgress(goal: GoalWithMilestones) {
  let done = 0, total = 0;
  for (const m of goal.milestones) {
    for (const s of m.action_steps) { total++; if (s.done) done++; }
  }
  return { done, total };
}

export function GoalCard({ goal, onPress }: Props) {
  const { done, total } = calcProgress(goal);
  const pct = total > 0 ? done / total : 0;

  return (
    <Pressable className="bg-leather-800 rounded-2xl p-4 mb-3 border border-leather-600" onPress={onPress}>
      <Text className="text-leather-50 font-semibold text-base mb-2" numberOfLines={2}>{goal.title}</Text>

      <View className="flex-row gap-2 flex-wrap mb-3">
        {goal.priority && <Badge label={goal.priority} color={priorityColor(goal.priority)} />}
        {goal.deadline && (
          <Badge
            label={new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            color={deadlineColor(goal.deadline)}
          />
        )}
      </View>

      {total > 0 && (
        <View>
          <View className="h-2 bg-leather-700 rounded-full overflow-hidden">
            <View className="h-full bg-gold-500 rounded-full" style={{ width: `${Math.round(pct * 100)}%` }} />
          </View>
          <Text className="text-leather-400 text-xs mt-1">{done}/{total} steps done</Text>
        </View>
      )}
    </Pressable>
  );
}
