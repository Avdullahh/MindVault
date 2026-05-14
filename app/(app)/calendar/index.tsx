import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalendarEvents } from '../../../hooks/use-calendar-events';
import { useLayout } from '../../../hooks/use-layout';
import { EventItem } from '../../../components/EventItem';
import { CreateEventModal } from '../../../components/CreateEventModal';
import { EditEventModal } from '../../../components/EditEventModal';
import type { CalendarEvent } from '../../../types';

type CalendarDay = {
  date: Date;
  iso: string;
  label: string;
  inCurrentMonth: boolean;
};

type MonthGrid = {
  days: CalendarDay[];
  start: Date;
  end: Date;
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameIsoDate(left: Date, right: Date) {
  return toIsoDate(left) === toIsoDate(right);
}

function getFirstDayOfWeek(locale: string) {
  const LocaleCtor = (Intl as unknown as {
    Locale?: new (value: string) => { weekInfo?: { firstDay?: number } };
  }).Locale;
  const firstDay = LocaleCtor ? new LocaleCtor(locale).weekInfo?.firstDay : undefined;
  return firstDay === 7 || firstDay === undefined ? 0 : firstDay;
}

function buildMonthGrid(selectedIsoDate: string, locale: string): MonthGrid {
  const selectedDate = parseIsoDate(selectedIsoDate);
  const firstDayOfWeek = getFirstDayOfWeek(locale);
  const calLocale = `${locale.split('-u-')[0]}-u-ca-gregory`;

  const partsFormatter = new Intl.DateTimeFormat(calLocale, {
    era: 'short', year: 'numeric', month: 'numeric',
  });
  const getParts = (d: Date) => Object.fromEntries(partsFormatter.formatToParts(d).map((p) => [p.type, p.value]));
  const refParts = getParts(selectedDate);
  const isSameMonth = (d: Date) => {
    const p = getParts(d);
    return p.era === refParts.era && p.year === refParts.year && p.month === refParts.month;
  };

  let start = selectedDate;
  let end = selectedDate;
  for (let i = 0; i < 45; i++) {
    const prev = addDays(start, -1);
    if (!isSameMonth(prev)) break;
    start = prev;
  }
  for (let i = 0; i < 45; i++) {
    const next = addDays(end, 1);
    if (!isSameMonth(next)) break;
    end = next;
  }

  const startOffset = (start.getDay() - firstDayOfWeek + 7) % 7;
  const gridStart = addDays(start, -startOffset);
  const dayFormatter = new Intl.DateTimeFormat(calLocale, { day: 'numeric' });
  const days: CalendarDay[] = [];
  let cursor = gridStart;
  do {
    days.push({
      date: cursor,
      iso: toIsoDate(cursor),
      label: dayFormatter.format(cursor),
      inCurrentMonth: isSameMonth(cursor),
    });
    cursor = addDays(cursor, 1);
  } while (cursor <= end || days.length % 7 !== 0);

  return { days, start, end };
}

function getWeekdayLabels(locale: string) {
  const firstDayOfWeek = getFirstDayOfWeek(locale);
  const calLocale = `${locale.split('-u-')[0]}-u-ca-gregory`;
  const formatter = new Intl.DateTimeFormat(calLocale, { weekday: 'short' });
  const sunday = new Date(2024, 0, 7, 12);
  return Array.from({ length: 7 }, (_, i) => formatter.format(addDays(sunday, firstDayOfWeek + i)));
}

function getDayTextClass(selected: boolean, isToday: boolean, inCurrentMonth: boolean) {
  if (selected) return 'text-white font-semibold';
  if (isToday) return 'text-teal-400 font-semibold';
  if (inCurrentMonth) return 'text-gray-100';
  return 'text-gray-600';
}

export default function CalendarScreen() {
  const { eventsByDate, loading, refetch, create, update, toggleDone, remove } = useCalendarEvents();
  const { isIPad, isLandscape, width } = useLayout();

  const locale = useMemo(() => Intl.DateTimeFormat().resolvedOptions().locale, []);
  const [selectedDate, setSelectedDate] = useState(toIsoDate(new Date()));
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const today = useMemo(() => new Date(), []);

  const { days: calendarDays, start: monthStart, end: monthEnd } = useMemo(
    () => buildMonthGrid(selectedDate, locale),
    [locale, selectedDate],
  );

  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);

  const selectedDateObject = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
  const calLocale = useMemo(() => `${locale.split('-u-')[0]}-u-ca-gregory`, [locale]);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(calLocale, { month: 'long', year: 'numeric' }).format(selectedDateObject),
    [calLocale, selectedDateObject],
  );

  const selectedDateLabel = useMemo(
    () => new Intl.DateTimeFormat(calLocale, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }).format(selectedDateObject),
    [calLocale, selectedDateObject],
  );

  const dayEvents = eventsByDate[selectedDate] ?? [];

  const calendarGrid = (weekdayTextSize: string) => (
    <>
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          className="w-11 h-11 items-center justify-center rounded-full bg-gray-800"
          onPress={() => setSelectedDate(toIsoDate(addDays(monthStart, -1)))}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={22} color="#2dd4bf" />
        </Pressable>
        <Text className="text-white text-lg font-bold">{monthLabel}</Text>
        <Pressable
          className="w-11 h-11 items-center justify-center rounded-full bg-gray-800"
          onPress={() => setSelectedDate(toIsoDate(addDays(monthEnd, 1)))}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={22} color="#2dd4bf" />
        </Pressable>
      </View>

      <View className="flex-row mb-2">
        {weekdayLabels.map((label) => (
          <Text key={label} className={`flex-1 text-center font-semibold text-gray-500 ${weekdayTextSize}`}>
            {label}
          </Text>
        ))}
      </View>

      {Array.from({ length: calendarDays.length / 7 }, (_, week) => (
        <View key={week} className="flex-row">
          {calendarDays.slice(week * 7, week * 7 + 7).map((day) => {
            const selected = day.iso === selectedDate;
            const isToday = isSameIsoDate(day.date, today);
            const hasEvents = Boolean(eventsByDate[day.iso]?.length);
            return (
              <Pressable
                key={day.iso}
                className="flex-1 aspect-square min-h-11 items-center justify-center"
                onPress={() => setSelectedDate(day.iso)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <View className={`w-9 h-9 rounded-full items-center justify-center ${selected ? 'bg-teal-700' : 'bg-transparent'}`}>
                  <Text className={`text-base ${getDayTextClass(selected, isToday, day.inCurrentMonth)}`}>
                    {day.label}
                  </Text>
                  {hasEvents && (
                    <View className={`w-1.5 h-1.5 rounded-full mt-0.5 ${selected ? 'bg-white' : 'bg-teal-400'}`} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </>
  );

  const eventsList = (
    <>
      <View className="px-5 py-3">
        <Text className="text-white font-semibold">{selectedDateLabel}</Text>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#2dd4bf" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {dayEvents.length === 0 ? (
          <View className="bg-gray-800 rounded-xl border border-gray-700 px-4 py-5">
            <Text className="text-white font-medium">No events for this day</Text>
            <Text className="text-gray-500 text-sm mt-1">Tap + to add one and connect it to your plan.</Text>
          </View>
        ) : (
          <>
          {dayEvents.map((ev) => (
            <EventItem
              key={ev.id}
              event={ev}
              onToggleDone={toggleDone}
              onEdit={setEditingEvent}
              onDelete={remove}
            />
          ))}
          </>
        )}
      </ScrollView>
    </>
  );

  const calendarWidth = isIPad ? Math.round(width * (isLandscape ? 0.44 : 0.50)) : 0;

  return (
    <>
      {isIPad ? (
        <View className="flex-1 flex-row bg-gray-900">
          <View style={{ width: calendarWidth }} className="pt-14 px-4 border-r border-gray-800">
            <Text className="text-2xl font-bold text-white mb-3">Calendar</Text>
            {calendarGrid('text-sm')}
          </View>
          <View className="flex-1 pt-14">
            {eventsList}
          </View>
        </View>
      ) : (
        <View className="flex-1 bg-gray-900">
          <View className="px-5 pt-14 pb-2">
            <Text className="text-2xl font-bold text-white">Calendar</Text>
          </View>
          <View className="px-5 py-3">
            {calendarGrid('text-xs')}
          </View>
          {eventsList}
        </View>
      )}

      <Pressable
        className="absolute bottom-24 right-6 bg-teal-500 rounded-full w-14 h-14 items-center justify-center shadow-lg"
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Create event"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <CreateEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        defaultDate={selectedDate}
        onCreate={create}
      />
      <EditEventModal
        event={editingEvent}
        visible={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={update}
      />
    </>
  );
}
