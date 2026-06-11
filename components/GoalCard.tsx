import { Pressable, Text, View } from 'react-native';
import { Badge } from './ui/Badge';
import type { Goal } from '../types';

type Props = {
  goal: Goal;
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

function priorityLabel(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function GoalCard({ goal, onPress }: Props) {
  return (
    <Pressable className="bg-surface rounded-2xl p-4 mb-3 border border-border" onPress={onPress}>
      <Text className="text-foreground font-semibold text-base mb-2" numberOfLines={2}>{goal.title}</Text>
      <View className="flex-row gap-2 flex-wrap">
        {goal.priority && <Badge label={priorityLabel(goal.priority)} color={priorityColor(goal.priority)} />}
        {goal.deadline && (
          <Badge
            label={new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            color={deadlineColor(goal.deadline)}
          />
        )}
      </View>
    </Pressable>
  );
}
