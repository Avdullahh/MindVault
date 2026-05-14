import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { Button } from './ui/Button';
import { DatePicker } from './ui/DatePicker';
import { CategoryPicker } from './CategoryPicker';
import { toLocalDateString, toLocalTimeString } from '../lib/date-utils';
import type { CalendarEventInsert } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  defaultDate?: string;
  onCreate: (payload: Pick<CalendarEventInsert, 'title' | 'start_at' | 'end_at' | 'all_day' | 'notes' | 'category_id'>) => Promise<string | null>;
};

function defaultStart() {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

function defaultEnd() {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  return d;
}

export function CreateEventModal({ visible, onClose, defaultDate, onCreate }: Props) {
  const initialDate = defaultDate ? new Date(`${defaultDate}T00:00:00`) : new Date();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(initialDate);
  const [startTime, setStartTime] = useState<Date>(defaultStart());
  const [endTime, setEndTime] = useState<Date>(defaultEnd());
  const [allDay, setAllDay] = useState(false);
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle(''); setDate(initialDate); setStartTime(defaultStart()); setEndTime(defaultEnd());
    setAllDay(false); setNotes(''); setCategoryId(null); setError(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    const dateStr = toLocalDateString(date);
    const startIso = allDay
      ? `${dateStr}T00:00:00`
      : `${dateStr}T${toLocalTimeString(startTime)}:00`;
    const endIso = allDay ? null : `${dateStr}T${toLocalTimeString(endTime)}:00`;
    setLoading(true); setError(null);
    const err = await onCreate({ title: title.trim(), start_at: startIso, end_at: endIso, all_day: allDay, notes: notes.trim() || null, category_id: categoryId });
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  return (
    <ModalSheet visible={visible} onClose={handleClose} title="New Event">
      <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextInput
          className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-3"
          placeholder="Title"
          placeholderTextColor="#6b7280"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />
        <DatePicker value={date} onChange={setDate} mode="date" />
        <Pressable
          className="flex-row items-center justify-between bg-gray-800 rounded-xl px-4 py-3 mb-3"
          onPress={() => setAllDay((v) => !v)}
        >
          <Text className="text-white">All day</Text>
          <View className={`w-12 h-6 rounded-full ${allDay ? 'bg-teal-500' : 'bg-gray-600'} justify-center`}>
            <View className={`w-5 h-5 bg-white rounded-full mx-0.5 ${allDay ? 'self-end' : 'self-start'}`} />
          </View>
        </Pressable>
        {!allDay && (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <DatePicker value={startTime} onChange={setStartTime} mode="time" placeholder="Start time" />
            </View>
            <View className="flex-1">
              <DatePicker value={endTime} onChange={setEndTime} mode="time" placeholder="End time" />
            </View>
          </View>
        )}
        <TextInput
          className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-3"
          placeholder="Notes (optional)"
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
        <CategoryPicker value={categoryId} onChange={setCategoryId} />
      </ScrollView>
      {error && <Text className="text-red-400 text-sm mb-3">{error}</Text>}
      <View className="mt-2 mb-2">
        <Button label="Create event" onPress={handleCreate} loading={loading} />
      </View>
    </ModalSheet>
  );
}
