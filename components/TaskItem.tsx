import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './ui/Badge';
import { useThemeColors } from '../context/ThemeContext';
import type { TaskWithGoal } from '../hooks/use-tasks';

type Props = {
  task: TaskWithGoal;
  onToggle: () => void;
};

function priorityColor(p: string | null): 'red' | 'yellow' | 'gray' {
  if (p === 'high') return 'red';
  if (p === 'medium') return 'yellow';
  return 'gray';
}

function formatDue(date: string | null) {
  if (!date) return null;
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TaskItem({ task, onToggle }: Props) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-3 py-3 border-b border-border">
      <Pressable onPress={onToggle}>
        <Ionicons
          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={task.done ? colors.primary : colors.muted}
        />
      </Pressable>
      <View className="flex-1">
        <Text className={`text-base ${task.done ? 'text-muted line-through' : 'text-foreground'}`} numberOfLines={1}>
          {task.title}
        </Text>
        <View className="flex-row items-center gap-2 mt-1 flex-wrap">
          {task.goalTitle && <Text className="text-muted text-xs" numberOfLines={1}>Goal: {task.goalTitle}</Text>}
          {task.due_date && <Text className="text-muted text-xs">{formatDue(task.due_date)}</Text>}
          {task.priority && !task.done && <Badge label={task.priority} color={priorityColor(task.priority)} />}
        </View>
      </View>
    </View>
  );
}
