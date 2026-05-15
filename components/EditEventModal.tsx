import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ModalSheet } from './ui/ModalSheet';
import { parseCalendarStoredDate, toLocalDateString, toLocalTimeString } from '../lib/date-utils';
import type { CalendarEvent } from '../types';

type Props = {
  event: CalendarEvent | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, payload: Partial<Pick<CalendarEvent, 'title' | 'start_at' | 'end_at' | 'all_day' | 'notes' | 'category_id'>>) => Promise<string | null>;
};

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function EditEventModal({ event, visible, onClose, onSave }: Props) {
  const notesInputRef = useRef<TextInput>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [allDay, setAllDay] = useState(true);
  const [notes, setNotes] = useState('');
  const [pickerTarget, setPickerTarget] = useState<'date' | 'start' | 'end' | null>(null);
  const [draftDate, setDraftDate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event || !visible) return;
    setTitle(event.title);
    setNotes(event.notes ?? '');
    setAllDay(event.all_day);
    setError(null);
    const start = parseCalendarStoredDate(event.start_at);
    setDate(new Date(start.getFullYear(), start.getMonth(), start.getDate()));
    setStartTime(start);
    setEndTime(event.end_at ? parseCalendarStoredDate(event.end_at) : start);
  }, [event, visible]);

  const openPicker = (target: 'date' | 'start' | 'end') => {
    const current = target === 'date' ? date : target === 'start' ? startTime : endTime;
    setDraftDate(current);
    setPickerTarget(target);
  };

  const confirmPicker = () => {
    if (pickerTarget === 'date') setDate(draftDate);
    else if (pickerTarget === 'start') setStartTime(draftDate);
    else if (pickerTarget === 'end') setEndTime(draftDate);
    setPickerTarget(null);
  };

  const handleSave = async () => {
    if (!event) return;
    if (!title.trim()) { setError('Title is required'); return; }
    const dateStr = toLocalDateString(date);
    const startIso = allDay ? `${dateStr}T00:00:00` : `${dateStr}T${toLocalTimeString(startTime)}:00`;
    const endIso = allDay ? null : `${dateStr}T${toLocalTimeString(endTime)}:00`;
    setLoading(true); setError(null);
    const err = await onSave(event.id, { title: title.trim(), start_at: startIso, end_at: endIso, all_day: allDay, notes: notes.trim() || null });
    setLoading(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <>
      <ModalSheet visible={visible} onClose={onClose} title="Edit Event">
        <TextInput
          className="bg-leather-800 text-leather-50 rounded-xl px-4 py-3 mb-3 border border-leather-600"
          placeholder="Title"
          placeholderTextColor="#7a6050"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
          returnKeyType="next"
          onSubmitEditing={() => notesInputRef.current?.focus()}
        />

        {/* Date row */}
        <Pressable
          className="bg-leather-800 rounded-xl px-4 py-3 mb-3 border border-leather-600 flex-row items-center justify-between"
          onPress={() => openPicker('date')}
        >
          <Text className="text-leather-50">{formatDate(date)}</Text>
          <Ionicons name="calendar-outline" size={16} color="#d4a017" />
        </Pressable>

        {/* All day / time */}
        <View className="flex-row gap-2 mb-3 items-center">
          <Pressable
            className={`py-2.5 px-3 rounded-xl border items-center justify-center ${allDay ? 'bg-gold-900 border-gold-700' : 'bg-leather-800 border-leather-600'}`}
            onPress={() => setAllDay(true)}
          >
            <Text className={`text-sm ${allDay ? 'text-gold-400' : 'text-leather-200'}`}>All day</Text>
          </Pressable>
          {allDay ? (
            <Pressable
              className="py-2.5 px-3 rounded-xl border bg-leather-800 border-leather-600"
              onPress={() => setAllDay(false)}
            >
              <Text className="text-leather-400 text-sm">Set time</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                className="flex-1 py-2.5 px-3 rounded-xl border bg-leather-800 border-leather-600 flex-row items-center justify-between"
                onPress={() => openPicker('start')}
              >
                <Text className="text-leather-200 text-sm">{formatTime(startTime)}</Text>
                <Ionicons name="time-outline" size={13} color="#7a6050" />
              </Pressable>
              <Text className="text-leather-500 text-sm">→</Text>
              <Pressable
                className="flex-1 py-2.5 px-3 rounded-xl border bg-leather-800 border-leather-600 flex-row items-center justify-between"
                onPress={() => openPicker('end')}
              >
                <Text className="text-leather-200 text-sm">{formatTime(endTime)}</Text>
                <Ionicons name="time-outline" size={13} color="#7a6050" />
              </Pressable>
            </>
          )}
        </View>

        <TextInput
          ref={notesInputRef}
          className="bg-leather-800 text-leather-50 rounded-xl px-4 py-3 mb-4 border border-leather-600"
          placeholder="Notes (optional)"
          placeholderTextColor="#7a6050"
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
          style={{ maxHeight: 72 }}
        />

        {error ? <Text className="text-red-400 text-xs mb-3">{error}</Text> : null}

        <Pressable
          className={`rounded-xl py-4 items-center ${!title.trim() || loading ? 'bg-leather-700' : 'bg-gold-500'}`}
          onPress={handleSave}
          disabled={loading || !title.trim()}
          accessibilityRole="button"
        >
          {loading
            ? <ActivityIndicator color="#f5e6c8" />
            : <Text className="text-leather-50 font-bold text-base">Save Changes</Text>
          }
        </Pressable>
      </ModalSheet>

      {pickerTarget !== null && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setPickerTarget(null)}>
          <View className="flex-1 justify-end bg-black/60">
            <Pressable className="flex-1" onPress={() => setPickerTarget(null)} />
            <View className="bg-leather-900 rounded-t-3xl px-5 pt-4 pb-8 border-t border-gold-800">
              <View className="flex-row items-center justify-between mb-3">
                <Pressable className="min-h-11 px-2 justify-center" onPress={() => setPickerTarget(null)}>
                  <Text className="text-leather-300 font-medium">Cancel</Text>
                </Pressable>
                <Text className="text-leather-50 font-semibold" style={{ fontFamily: 'Georgia' }}>
                  {pickerTarget === 'date' ? 'Choose date' : 'Choose time'}
                </Text>
                <Pressable className="min-h-11 px-2 justify-center" onPress={confirmPicker}>
                  <Text className="text-gold-400 font-semibold">Done</Text>
                </Pressable>
              </View>
              <RNDateTimePicker
                value={draftDate}
                mode={pickerTarget === 'date' ? 'date' : 'time'}
                display="spinner"
                onChange={(_, d) => { if (d) setDraftDate(d); }}
                themeVariant="dark"
                style={{ alignSelf: 'stretch' }}
              />
            </View>
          </View>
        </Modal>
      )}
      {pickerTarget !== null && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={draftDate}
          mode={pickerTarget === 'date' ? 'date' : 'time'}
          display="default"
          onChange={(_, d) => {
            if (d) {
              if (pickerTarget === 'date') setDate(d);
              else if (pickerTarget === 'start') setStartTime(d);
              else setEndTime(d);
            }
            setPickerTarget(null);
          }}
          themeVariant="dark"
        />
      )}
    </>
  );
}
