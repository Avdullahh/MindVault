import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { parseCalendarStoredDate } from '../lib/date-utils';
import type { CalendarEvent } from '../types';

type Props = {
  event: CalendarEvent;
  onToggleDone: (id: string) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
};

function fmt(iso: string) {
  const d = parseCalendarStoredDate(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`;
}

function timeLabel(event: CalendarEvent): string | null {
  if (event.all_day) return 'All day';
  if (!event.end_at) return null;
  return fmt(event.start_at);
}

export function EventItem({ event, onToggleDone, onEdit, onDelete }: Props) {
  const colors = useThemeColors();
  const label = timeLabel(event);

  return (
    <View
      className={`bg-surface rounded-xl px-3 py-3 mb-2 flex-row items-center gap-3 border border-border min-h-16 ${event.done ? 'opacity-60' : ''}`}
    >
      <Pressable
        className="w-11 h-11 -ml-1 items-center justify-center"
        onPress={() => onToggleDone(event.id)}
        accessibilityRole="checkbox"
        accessibilityLabel={event.done ? 'Mark event incomplete' : 'Mark event complete'}
        accessibilityState={{ checked: event.done ?? false }}
      >
        <View className={`w-7 h-7 rounded-full border-2 items-center justify-center ${event.done ? 'bg-primary border-primary' : 'border-border'}`}>
          {event.done ? <Ionicons name="checkmark" size={15} color="#fff" /> : null}
        </View>
      </Pressable>

      <Pressable
        className="flex-1 flex-row items-center gap-3 min-h-11"
        onPress={() => onEdit(event)}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${event.title}`}
      >
        {label ? (
          <View className="w-14 shrink-0">
            <Text className="text-primary text-sm font-medium" numberOfLines={1}>{label}</Text>
            {event.end_at && !event.all_day ? (
              <Text className="text-muted text-xs" numberOfLines={1}>{fmt(event.end_at)}</Text>
            ) : null}
          </View>
        ) : null}

        <View className="flex-1">
          <Text className={`font-medium ${event.done ? 'text-muted line-through' : 'text-foreground'}`} numberOfLines={1}>
            {event.title}
          </Text>
          {event.notes ? <Text className="text-muted text-sm mt-0.5" numberOfLines={1}>{event.notes}</Text> : null}
        </View>
      </Pressable>

      <Pressable
        onPress={() =>
          Alert.alert('Delete event', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(event.id) },
          ])
        }
        className="w-10 h-11 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Delete event"
        hitSlop={4}
      >
        <Ionicons name="trash-outline" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}
