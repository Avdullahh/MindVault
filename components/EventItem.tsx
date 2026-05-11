import { Pressable, Text, View } from 'react-native';
import type { CalendarEvent } from '../types';

type Props = {
  event: CalendarEvent;
  onPress: () => void;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function EventItem({ event, onPress }: Props) {
  return (
    <Pressable className="bg-gray-800 rounded-xl px-4 py-3 mb-2 flex-row items-start gap-3" onPress={onPress}>
      <View className="mt-0.5">
        <Text className="text-teal-400 text-sm font-medium">
          {event.all_day ? 'All day' : fmt(event.start_at)}
        </Text>
        {event.end_at && !event.all_day && (
          <Text className="text-gray-500 text-xs">{fmt(event.end_at)}</Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-white font-medium" numberOfLines={1}>{event.title}</Text>
        {event.notes ? <Text className="text-gray-400 text-sm" numberOfLines={1}>{event.notes}</Text> : null}
      </View>
    </Pressable>
  );
}
