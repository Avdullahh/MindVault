import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  value: Date | null;
  onChange: (date: Date) => void;
  mode: 'date' | 'time';
  placeholder?: string;
};

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function startOfDay(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function timeAt(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date;
}

export function DatePicker({ value, onChange, mode, placeholder }: Props) {
  const [show, setShow] = useState(false);
  const [draftValue, setDraftValue] = useState<Date>(value ?? new Date());
  const display = value
    ? (mode === 'date' ? formatDate(value) : formatTime(value))
    : (placeholder ?? (mode === 'date' ? 'Select date' : 'Select time'));

  const handleChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (!selected) return;
    if (Platform.OS === 'ios') setDraftValue(selected);
    else onChange(selected);
  };

  const openPicker = () => {
    setDraftValue(value ?? new Date());
    setShow(true);
  };

  const confirmPicker = () => {
    onChange(draftValue);
    setShow(false);
  };

  return (
    <View className="mb-3">
      <Pressable
        className="bg-gray-800 rounded-xl min-h-11 px-4 py-3 flex-row items-center justify-between border border-gray-700"
        onPress={openPicker}
        accessibilityRole="button"
      >
        <Text className={value ? 'text-white' : 'text-gray-500'}>{display}</Text>
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color="#2dd4bf" />
      </Pressable>

      <View className="flex-row gap-2 mt-2">
        {mode === 'date' ? (
          <>
            <Pressable className="bg-gray-800 border border-gray-700 rounded-lg min-h-11 px-3 py-2 items-center justify-center" onPress={() => onChange(startOfDay())}>
              <Text className="text-gray-300 text-xs">Today</Text>
            </Pressable>
            <Pressable className="bg-gray-800 border border-gray-700 rounded-lg min-h-11 px-3 py-2 items-center justify-center" onPress={() => onChange(startOfDay(1))}>
              <Text className="text-gray-300 text-xs">Tomorrow</Text>
            </Pressable>
          </>
        ) : (
          [9, 12, 17].map((hour) => (
            <Pressable key={hour} className="bg-gray-800 border border-gray-700 rounded-lg min-h-11 px-3 py-2 items-center justify-center" onPress={() => onChange(timeAt(hour))}>
              <Text className="text-gray-300 text-xs">{String(hour).padStart(2, '0')}:00</Text>
            </Pressable>
          ))
        )}
      </View>

      {show && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" visible={show} onRequestClose={() => setShow(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <Pressable className="flex-1" onPress={() => setShow(false)} />
            <View className="bg-gray-900 rounded-t-3xl px-5 pt-4 pb-8 border-t border-gray-800">
              <View className="flex-row items-center justify-between mb-3">
                <Pressable className="min-h-11 px-2 justify-center" onPress={() => setShow(false)}>
                  <Text className="text-gray-400 font-medium">Cancel</Text>
                </Pressable>
                <Text className="text-white font-semibold">{mode === 'date' ? 'Choose date' : 'Choose time'}</Text>
                <Pressable className="min-h-11 px-2 justify-center" onPress={confirmPicker}>
                  <Text className="text-teal-400 font-semibold">Done</Text>
                </Pressable>
              </View>
              <RNDateTimePicker
                value={draftValue}
                mode={mode}
                display="spinner"
                onChange={handleChange}
                themeVariant="dark"
                style={{ alignSelf: 'stretch' }}
              />
            </View>
          </View>
        </Modal>
      ) : show ? (
        <RNDateTimePicker
          value={value ?? new Date()}
          mode={mode}
          display="default"
          onChange={handleChange}
          themeVariant="dark"
        />
      ) : null}
    </View>
  );
}
