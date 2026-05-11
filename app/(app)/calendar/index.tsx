import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useCalendarEvents } from '../../../hooks/use-calendar-events';
import { EventItem } from '../../../components/EventItem';
import { CreateEventModal } from '../../../components/CreateEventModal';

const THEME = {
  backgroundColor: '#111827',
  calendarBackground: '#111827',
  textSectionTitleColor: '#6b7280',
  dayTextColor: '#f3f4f6',
  todayTextColor: '#2dd4bf',
  selectedDayBackgroundColor: '#0f766e',
  selectedDayTextColor: '#fff',
  arrowColor: '#2dd4bf',
  monthTextColor: '#fff',
  textDayFontWeight: '400' as const,
  textMonthFontWeight: '700' as const,
  dotColor: '#2dd4bf',
  selectedDotColor: '#fff',
  disabledArrowColor: '#374151',
};

export default function CalendarScreen() {
  const { eventsByDate, create } = useCalendarEvents();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [modalVisible, setModalVisible] = useState(false);

  const markedDates: Record<string, object> = {};
  for (const key of Object.keys(eventsByDate)) {
    markedDates[key] = { dots: [{ color: '#2dd4bf' }] };
  }
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] ?? {}),
    selected: true,
    selectedColor: '#0f766e',
    dots: (markedDates[selectedDate] as { dots?: object[] })?.dots ?? [],
  };

  const dayEvents = eventsByDate[selectedDate] ?? [];

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <View className="flex-1 bg-gray-900">
      <View className="px-5 pt-14 pb-2">
        <Text className="text-2xl font-bold text-white">Calendar</Text>
      </View>

      <Calendar
        theme={THEME}
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
      />

      <View className="px-5 py-3">
        <Text className="text-white font-semibold">{formattedDate}</Text>
      </View>

      {dayEvents.length === 0 ? (
        <View className="px-5">
          <Text className="text-gray-500 text-sm">No events</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
          {dayEvents.map((ev) => (
            <EventItem key={ev.id} event={ev} onPress={() => {}} />
          ))}
        </ScrollView>
      )}

      <Pressable
        className="absolute bottom-8 right-6 bg-teal-500 rounded-full w-14 h-14 items-center justify-center"
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <CreateEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        defaultDate={selectedDate}
        onCreate={create}
      />
    </View>
  );
}
