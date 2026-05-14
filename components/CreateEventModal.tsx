import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ModalSheet } from './ui/ModalSheet';
import { toLocalDateString, toLocalTimeString } from '../lib/date-utils';
import type { CalendarEventInsert } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  defaultDate?: string;
  onCreate: (payload: Pick<CalendarEventInsert, 'title' | 'start_at' | 'end_at' | 'all_day' | 'notes' | 'category_id'>) => Promise<string | null>;
};

function startOfDay(iso?: string) {
  if (iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatShort(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAt(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

export function CreateEventModal({ visible, onClose, defaultDate, onCreate }: Props) {
  const today = useMemo(() => startOfDay(), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);

  const initialDate = useMemo(
    () => defaultDate ? startOfDay(defaultDate) : today,
    [defaultDate, today],
  );

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(initialDate);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState<Date>(timeAt(9));
  const [endTime, setEndTime] = useState<Date>(timeAt(10));
  const [pickerTarget, setPickerTarget] = useState<'date' | 'start' | 'end' | null>(null);
  const [draftDate, setDraftDate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) setDate(initialDate);
  }, [initialDate, visible]);

  const reset = () => {
    setTitle(''); setDate(initialDate); setAllDay(true);
    setStartTime(timeAt(9)); setEndTime(timeAt(10));
    setError(null);
  };
  const handleClose = () => { reset(); onClose(); };

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

  const handleCreate = async () => {
    if (!title.trim()) { setError('Give the event a name'); return; }
    const dateStr = toLocalDateString(date);
    const startIso = allDay
      ? `${dateStr}T00:00:00`
      : `${dateStr}T${toLocalTimeString(startTime)}:00`;
    const endIso = allDay ? null : `${dateStr}T${toLocalTimeString(endTime)}:00`;
    setLoading(true); setError(null);
    const err = await onCreate({ title: title.trim(), start_at: startIso, end_at: endIso, all_day: allDay, notes: null, category_id: null });
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  const dateIsToday = toIsoDate(date) === toIsoDate(today);
  const dateIsTomorrow = toIsoDate(date) === toIsoDate(tomorrow);
  const dateLabel = dateIsToday ? 'Today' : dateIsTomorrow ? 'Tomorrow' : formatShort(date);

  return (
    <>
      <ModalSheet visible={visible} onClose={handleClose}>
        <Text className="text-leather-400 text-xs uppercase mb-4" style={{ letterSpacing: 2 }}>
          New Event
        </Text>

        <TextInput
          className="text-leather-50 text-2xl mb-5"
          style={{ fontFamily: 'Georgia', minHeight: 52 }}
          placeholder="What's happening?"
          placeholderTextColor="#3d2b1a"
          value={title}
          onChangeText={setTitle}
          multiline
          maxLength={200}
          autoFocus
        />

        {/* Date row */}
        <View className="flex-row gap-2 mb-3">
          <Pressable
            className={`py-2 px-3 rounded-xl border items-center justify-center ${dateIsToday ? 'bg-gold-900 border-gold-700' : 'bg-leather-800 border-leather-600'}`}
            onPress={() => setDate(today)}
          >
            <Text className={`text-sm ${dateIsToday ? 'text-gold-400' : 'text-leather-200'}`}>Today</Text>
          </Pressable>
          <Pressable
            className={`py-2 px-3 rounded-xl border items-center justify-center ${dateIsTomorrow ? 'bg-gold-900 border-gold-700' : 'bg-leather-800 border-leather-600'}`}
            onPress={() => setDate(tomorrow)}
          >
            <Text className={`text-sm ${dateIsTomorrow ? 'text-gold-400' : 'text-leather-200'}`}>Tomorrow</Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-2 px-3 rounded-xl border flex-row items-center justify-between ${!dateIsToday && !dateIsTomorrow ? 'bg-gold-900 border-gold-700' : 'bg-leather-800 border-leather-600'}`}
            onPress={() => openPicker('date')}
          >
            <Text className={`text-sm ${!dateIsToday && !dateIsTomorrow ? 'text-gold-400' : 'text-leather-400'}`}>{dateLabel}</Text>
            <Ionicons name="calendar-outline" size={14} color={!dateIsToday && !dateIsTomorrow ? '#d4a017' : '#7a6050'} />
          </Pressable>
        </View>

        {/* All day / time row */}
        <View className="flex-row gap-2 mb-6 items-center">
          <Pressable
            className={`py-2 px-3 rounded-xl border items-center justify-center ${allDay ? 'bg-gold-900 border-gold-700' : 'bg-leather-800 border-leather-600'}`}
            onPress={() => setAllDay(true)}
          >
            <Text className={`text-sm ${allDay ? 'text-gold-400' : 'text-leather-200'}`}>All day</Text>
          </Pressable>
          {!allDay ? (
            <>
              <Pressable
                className="flex-1 py-2 px-3 rounded-xl border bg-leather-800 border-leather-600 flex-row items-center justify-between"
                onPress={() => openPicker('start')}
              >
                <Text className="text-leather-200 text-sm">{startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
                <Ionicons name="time-outline" size={13} color="#7a6050" />
              </Pressable>
              <Text className="text-leather-500 text-sm">→</Text>
              <Pressable
                className="flex-1 py-2 px-3 rounded-xl border bg-leather-800 border-leather-600 flex-row items-center justify-between"
                onPress={() => openPicker('end')}
              >
                <Text className="text-leather-200 text-sm">{endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
                <Ionicons name="time-outline" size={13} color="#7a6050" />
              </Pressable>
            </>
          ) : (
            <Pressable
              className="py-2 px-3 rounded-xl border bg-leather-800 border-leather-600 items-center justify-center"
              onPress={() => setAllDay(false)}
            >
              <Text className="text-leather-400 text-sm">Set time</Text>
            </Pressable>
          )}
        </View>

        {error ? <Text className="text-red-400 text-xs mb-3">{error}</Text> : null}

        <Pressable
          className={`rounded-xl py-4 items-center ${!title.trim() || loading ? 'bg-leather-700' : 'bg-gold-500'}`}
          onPress={handleCreate}
          disabled={loading || !title.trim()}
          accessibilityRole="button"
        >
          {loading
            ? <ActivityIndicator color="#f5e6c8" />
            : <Text className="text-leather-50 font-bold text-base">Create Event</Text>
          }
        </Pressable>
      </ModalSheet>

      {/* Native date/time picker — rendered outside ModalSheet to avoid z-index conflicts */}
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
          onChange={(_, d) => { if (d) { if (pickerTarget === 'date') setDate(d); else if (pickerTarget === 'start') setStartTime(d); else setEndTime(d); } setPickerTarget(null); }}
          themeVariant="dark"
        />
      )}
    </>
  );
}
