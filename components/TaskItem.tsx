import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './ui/Badge';
import type { Task } from '../types';

type Props = {
  task: Task;
  onToggle: () => void;
  onPress: () => void;
};

function priorityColor(p: string | null): 'red' | 'yellow' | 'gray' {
  if (p === 'high') return 'red';
  if (p === 'medium') return 'yellow';
  return 'gray';
}

function formatDue(date: string | null) {
  if (!date) return null;
  return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TaskItem({ task, onToggle, onPress }: Props) {
  return (
    <Pressable className="flex-row items-center gap-3 py-3 border-b border-gray-800" onPress={onPress}>
      <Pressable onPress={onToggle}>
        <Ionicons
          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={task.done ? '#2dd4bf' : '#6b7280'}
        />
      </Pressable>
      <View className="flex-1">
        <Text className={`text-base ${task.done ? 'text-gray-500 line-through' : 'text-white'}`} numberOfLines={1}>
          {task.title}
        </Text>
        <View className="flex-row items-center gap-2 mt-1 flex-wrap">
          {task.due_date && <Text className="text-gray-500 text-xs">{formatDue(task.due_date)}</Text>}
          {task.priority && !task.done && <Badge label={task.priority} color={priorityColor(task.priority)} />}
        </View>
      </View>
    </Pressable>
  );
}
