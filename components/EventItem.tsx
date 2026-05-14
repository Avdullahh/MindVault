import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CalendarEvent } from '../types';

type Props = {
  event: CalendarEvent;
  onToggleDone: (id: string) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function EventItem({ event, onToggleDone, onEdit, onDelete }: Props) {
  return (
    <View className={`bg-leather-800 rounded-xl px-3 py-3 mb-2 flex-row items-start gap-3 border border-leather-600 min-h-16 ${event.done ? 'opacity-60' : ''}`}>
      <Pressable
        className="w-11 h-11 -ml-1 items-center justify-center"
        onPress={() => onToggleDone(event.id)}
        accessibilityRole="checkbox"
        accessibilityLabel={event.done ? 'Mark event incomplete' : 'Mark event complete'}
        accessibilityState={{ checked: event.done }}
      >
        <View className={`w-7 h-7 rounded-full border-2 items-center justify-center ${event.done ? 'bg-gold-500 border-gold-500' : 'border-leather-400'}`}>
          {event.done ? <Ionicons name="checkmark" size={15} color="#fff" /> : null}
        </View>
      </Pressable>

      <View className="pt-1 w-14">
        <Text className="text-gold-400 text-sm font-medium">
          {event.all_day ? 'All day' : fmt(event.start_at)}
        </Text>
        {event.end_at && !event.all_day ? (
          <Text className="text-leather-400 text-xs">{fmt(event.end_at)}</Text>
        ) : null}
      </View>

      <Pressable
        className="flex-1 min-h-11 justify-center"
        onPress={() => onEdit(event)}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${event.title}`}
      >
        <Text className={`font-medium ${event.done ? 'text-leather-400 line-through' : 'text-leather-50'}`} numberOfLines={1}>
          {event.title}
        </Text>
        {event.notes ? <Text className="text-leather-300 text-sm mt-0.5" numberOfLines={1}>{event.notes}</Text> : null}
      </Pressable>

      <View className="flex-row gap-1">
        <Pressable
          onPress={() => onEdit(event)}
          className="w-11 h-11 items-center justify-center rounded-full"
          accessibilityRole="button"
          accessibilityLabel="Edit event"
        >
          <Ionicons name="pencil-outline" size={18} color="#a89070" />
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert('Delete event', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDelete(event.id) },
            ])
          }
          className="w-11 h-11 items-center justify-center rounded-full"
          accessibilityRole="button"
          accessibilityLabel="Delete event"
        >
          <Ionicons name="trash-outline" size={18} color="#a89070" />
        </Pressable>
      </View>
    </View>
  );
}
