import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export function EventItem({ event, onToggleDone, onEdit, onDelete }: Props) {
  return (
    <Pressable
      className={`bg-leather-800 rounded-xl px-3 py-3 mb-2 flex-row items-center gap-3 border border-leather-600 min-h-16 ${event.done ? 'opacity-60' : ''}`}
      onPress={() => onEdit(event)}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${event.title}`}
    >
      <Pressable
        className="w-11 h-11 -ml-1 items-center justify-center"
        onPress={() => onToggleDone(event.id)}
        accessibilityRole="checkbox"
        accessibilityLabel={event.done ? 'Mark event incomplete' : 'Mark event complete'}
        accessibilityState={{ checked: event.done ?? false }}
      >
        <View className={`w-7 h-7 rounded-full border-2 items-center justify-center ${event.done ? 'bg-gold-500 border-gold-500' : 'border-leather-400'}`}>
          {event.done ? <Ionicons name="checkmark" size={15} color="#fff" /> : null}
        </View>
      </Pressable>

      <View className="w-14 shrink-0">
        <Text className="text-gold-400 text-sm font-medium" numberOfLines={1}>
          {event.all_day ? 'All day' : fmt(event.start_at)}
        </Text>
        {event.end_at && !event.all_day ? (
          <Text className="text-leather-400 text-xs" numberOfLines={1}>{fmt(event.end_at)}</Text>
        ) : null}
      </View>

      <View className="flex-1">
        <Text className={`font-medium ${event.done ? 'text-leather-400 line-through' : 'text-leather-50'}`} numberOfLines={1}>
          {event.title}
        </Text>
        {event.notes ? <Text className="text-leather-300 text-sm mt-0.5" numberOfLines={1}>{event.notes}</Text> : null}
      </View>

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
        <Ionicons name="trash-outline" size={18} color="#a89070" />
      </Pressable>
    </Pressable>
  );
}
