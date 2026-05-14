import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
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
  const display = value
    ? (mode === 'date' ? formatDate(value) : formatTime(value))
    : (placeholder ?? (mode === 'date' ? 'Select date' : 'Select time'));

  const handleChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(selected);
  };

  return (
    <View className="mb-3">
      <Pressable
        className="bg-gray-800 rounded-xl px-4 py-3 flex-row items-center justify-between border border-gray-700"
        onPress={() => setShow(true)}
      >
        <Text className={value ? 'text-white' : 'text-gray-500'}>{display}</Text>
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color="#2dd4bf" />
      </Pressable>

      <View className="flex-row gap-2 mt-2">
        {mode === 'date' ? (
          <>
            <Pressable className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5" onPress={() => onChange(startOfDay())}>
              <Text className="text-gray-300 text-xs">Today</Text>
            </Pressable>
            <Pressable className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5" onPress={() => onChange(startOfDay(1))}>
              <Text className="text-gray-300 text-xs">Tomorrow</Text>
            </Pressable>
          </>
        ) : (
          [9, 12, 17].map((hour) => (
            <Pressable key={hour} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5" onPress={() => onChange(timeAt(hour))}>
              <Text className="text-gray-300 text-xs">{String(hour).padStart(2, '0')}:00</Text>
            </Pressable>
          ))
        )}
      </View>

      {show && (
        <RNDateTimePicker
          value={value ?? new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          themeVariant="dark"
        />
      )}
    </View>
  );
}
