import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ModalSheet } from './ui/ModalSheet';
import { parseCalendarStoredDate, toLocalDateString, toLocalTimeString } from '../lib/date-utils';
import type { CalendarEvent } from '../types';

type EventMode = 'dateonly' | 'allday' | 'timed';

type Props = {
  event: CalendarEvent | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, payload: Partial<Pick<CalendarEvent, 'title' | 'start_at' | 'end_at' | 'all_day' | 'notes' | 'category_id'>>) => Promise<string | null>;
};

const MODES: { value: EventMode; label: string }[] = [
  { value: 'dateonly', label: 'Date only' },
  { value: 'allday', label: 'All day' },
  { value: 'timed', label: 'Set time' },
];

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function modeFromEvent(e: CalendarEvent): EventMode {
  // all_day flag is authoritative - a stray end_at on an all-day record is
  // treated as legacy data and will be cleared (set to null) when the user saves.
  if (e.all_day) return 'allday';
  if (!e.end_at) return 'dateonly';
  return 'timed';
}

export function EditEventModal({ event, visible, onClose, onSave }: Props) {
  const notesInputRef = useRef<TextInput>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [mode, setMode] = useState<EventMode>('dateonly');
  const [notes, setNotes] = useState('');
  const [pickerTarget, setPickerTarget] = useState<'date' | 'start' | 'end' | null>(null);
  const [draftDate, setDraftDate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event || !visible) return;
    setTitle(event.title);
    setNotes(event.notes ?? '');
    setMode(modeFromEvent(event));
    setPickerTarget(null);
    setError(null);
    const start = parseCalendarStoredDate(event.start_at);
    setDate(new Date(start.getFullYear(), start.getMonth(), start.getDate()));
    setStartTime(start);
    if (event.end_at) {
      setEndTime(parseCalendarStoredDate(event.end_at));
    } else {
      const defaultEnd = new Date(start);
      defaultEnd.setHours(start.getHours() + 1);
      setEndTime(defaultEnd);
    }
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
    let startIso: string;
    let endIso: string | null = null;
    let allDay: boolean;

    if (mode === 'allday') {
      allDay = true;
      startIso = `${dateStr}T00:00:00`;
    } else if (mode === 'timed') {
      allDay = false;
      startIso = `${dateStr}T${toLocalTimeString(startTime)}:00`;
      endIso = `${dateStr}T${toLocalTimeString(endTime)}:00`;
    } else {
      allDay = false;
      startIso = `${dateStr}T00:00:00`;
    }

    setLoading(true); setError(null);
    const err = await onSave(event.id, { title: title.trim(), start_at: startIso, end_at: endIso, all_day: allDay, notes: notes.trim() || null });
    setLoading(false);
    if (err) setError(err);
    else onClose();
  };

  return (
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

      {/* Date chip */}
      <Pressable
        className="bg-leather-800 rounded-xl px-4 py-3 mb-3 border border-leather-600 flex-row items-center justify-between"
        onPress={() => openPicker('date')}
      >
        <Text className="text-leather-50">{formatDate(date)}</Text>
        <Ionicons name="calendar-outline" size={16} color="#d4a017" />
      </Pressable>

      {/* Inline date picker */}
      {pickerTarget === 'date' && Platform.OS === 'ios' && (
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Pressable className="min-h-11 px-2 justify-center" onPress={() => setPickerTarget(null)}>
              <Text className="text-leather-300 font-medium">Cancel</Text>
            </Pressable>
            <Text className="text-leather-50 font-semibold" style={{ fontFamily: 'Georgia' }}>Choose date</Text>
            <Pressable className="min-h-11 px-2 justify-center" onPress={confirmPicker}>
              <Text className="text-gold-400 font-semibold">Done</Text>
            </Pressable>
          </View>
          <RNDateTimePicker
            value={draftDate}
            mode="date"
            display="spinner"
            onChange={(_, d) => { if (d) setDraftDate(d); }}
            themeVariant="dark"
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      )}
      {pickerTarget === 'date' && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={draftDate}
          mode="date"
          display="default"
          onChange={(_, d) => { if (d) setDate(d); setPickerTarget(null); }}
          themeVariant="dark"
        />
      )}

      {/* Mode chips */}
      <View className="flex-row gap-2 mb-3">
        {MODES.map(({ value, label }) => (
          <Pressable
            key={value}
            className={`flex-1 py-2.5 rounded-xl border items-center ${mode === value ? 'bg-gold-900 border-gold-700' : 'bg-leather-800 border-leather-600'}`}
            onPress={() => { setMode(value); setPickerTarget(null); }}
          >
            <Text className={`text-xs ${mode === value ? 'text-gold-400' : 'text-leather-200'}`}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Start / end time chips - timed mode only */}
      {mode === 'timed' && (
        <View className="flex-row gap-2 mb-3 items-center">
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
        </View>
      )}

      {/* Inline time picker */}
      {(pickerTarget === 'start' || pickerTarget === 'end') && Platform.OS === 'ios' && (
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Pressable className="min-h-11 px-2 justify-center" onPress={() => setPickerTarget(null)}>
              <Text className="text-leather-300 font-medium">Cancel</Text>
            </Pressable>
            <Text className="text-leather-50 font-semibold" style={{ fontFamily: 'Georgia' }}>Choose time</Text>
            <Pressable className="min-h-11 px-2 justify-center" onPress={confirmPicker}>
              <Text className="text-gold-400 font-semibold">Done</Text>
            </Pressable>
          </View>
          <RNDateTimePicker
            value={draftDate}
            mode="time"
            display="spinner"
            onChange={(_, d) => { if (d) setDraftDate(d); }}
            themeVariant="dark"
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      )}
      {(pickerTarget === 'start' || pickerTarget === 'end') && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={draftDate}
          mode="time"
          display="default"
          onChange={(_, d) => {
            if (d) {
              if (pickerTarget === 'start') setStartTime(d);
              else setEndTime(d);
            }
            setPickerTarget(null);
          }}
          themeVariant="dark"
        />
      )}

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
  );
}
