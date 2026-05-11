import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { Button } from './ui/Button';
import { CategoryPicker } from './CategoryPicker';
import type { CalendarEventInsert } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  defaultDate?: string;
  onCreate: (payload: Pick<CalendarEventInsert, 'title' | 'start_at' | 'end_at' | 'all_day' | 'notes' | 'category_id'>) => Promise<string | null>;
};

export function CreateEventModal({ visible, onClose, defaultDate, onCreate }: Props) {
  const today = defaultDate ?? new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setDate(today); setStartTime('09:00'); setEndTime('10:00'); setAllDay(false); setNotes(''); setCategoryId(null); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    const startIso = allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`;
    const endIso = allDay ? null : `${date}T${endTime}:00`;
    setLoading(true); setError(null);
    const err = await onCreate({ title: title.trim(), start_at: startIso, end_at: endIso, all_day: allDay, notes: notes.trim() || null, category_id: categoryId });
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  return (
    <ModalSheet visible={visible} onClose={handleClose} title="New Event">
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextInput
          className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-3"
          placeholder="Title"
          placeholderTextColor="#6b7280"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />
        <TextInput
          className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-3"
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor="#6b7280"
          value={date}
          onChangeText={setDate}
        />
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
          <View className="flex-row gap-3 mb-3">
            <TextInput
              className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3"
              placeholder="Start HH:MM"
              placeholderTextColor="#6b7280"
              value={startTime}
              onChangeText={setStartTime}
            />
            <TextInput
              className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3"
              placeholder="End HH:MM"
              placeholderTextColor="#6b7280"
              value={endTime}
              onChangeText={setEndTime}
            />
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
        {error && <Text className="text-red-400 text-sm mb-3">{error}</Text>}
        <View className="mt-2">
          <Button label="Create event" onPress={handleCreate} loading={loading} />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}
