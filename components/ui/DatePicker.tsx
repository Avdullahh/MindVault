import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';

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
        className="bg-gray-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
        onPress={() => setShow(true)}
      >
        <Text className={value ? 'text-white' : 'text-gray-500'}>{display}</Text>
        <Text className="text-teal-400 text-xs">{mode === 'date' ? '📅' : '🕐'}</Text>
      </Pressable>
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
