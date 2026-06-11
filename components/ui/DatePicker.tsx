import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  value: Date | null;
  onChange: (date: Date) => void;
  mode: 'date' | 'time';
  placeholder?: string;
  compact?: boolean;
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

export function DatePicker({ value, onChange, mode, placeholder, compact = false }: Props) {
  const { colors, colorScheme } = useTheme();
  const [show, setShow] = useState(false);
  const [draftValue, setDraftValue] = useState<Date>(value ?? new Date());
  const display = value
    ? (mode === 'date' ? formatDate(value) : formatTime(value))
    : (placeholder ?? (mode === 'date' ? 'Select date' : 'Select time'));

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
        className="bg-surface rounded-xl min-h-11 px-4 py-3 flex-row items-center justify-between border border-border"
        onPress={openPicker}
        accessibilityRole="button"
      >
        <Text className={value ? 'text-foreground' : 'text-muted'}>{display}</Text>
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={colors.primary} />
      </Pressable>

      {!compact && (
        <View className="flex-row gap-2 mt-2">
          {mode === 'date' ? (
            <>
              <Pressable className="bg-surface border border-border rounded-lg min-h-11 px-3 py-2 items-center justify-center" onPress={() => onChange(startOfDay())}>
                <Text className="text-foreground text-xs">Today</Text>
              </Pressable>
              <Pressable className="bg-surface border border-border rounded-lg min-h-11 px-3 py-2 items-center justify-center" onPress={() => onChange(startOfDay(1))}>
                <Text className="text-foreground text-xs">Tomorrow</Text>
              </Pressable>
            </>
          ) : (
            [9, 12, 17].map((hour) => (
              <Pressable key={hour} className="bg-surface border border-border rounded-lg min-h-11 px-3 py-2 items-center justify-center" onPress={() => onChange(timeAt(hour))}>
                <Text className="text-foreground text-xs">{String(hour).padStart(2, '0')}:00</Text>
              </Pressable>
            ))
          )}
        </View>
      )}

      {show && Platform.OS === 'ios' && (
        <View className="mt-2">
          <View className="flex-row items-center justify-between mb-2">
            <Pressable className="min-h-11 px-2 justify-center" onPress={() => setShow(false)}>
              <Text className="text-muted font-medium">Cancel</Text>
            </Pressable>
            <Text className="text-foreground font-semibold">{mode === 'date' ? 'Choose date' : 'Choose time'}</Text>
            <Pressable className="min-h-11 px-2 justify-center" onPress={confirmPicker}>
              <Text className="text-primary font-semibold">Done</Text>
            </Pressable>
          </View>
          <RNDateTimePicker
            value={draftValue}
            mode={mode}
            display="spinner"
            onChange={(_, d) => { if (d) setDraftValue(d); }}
            themeVariant={colorScheme}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      )}

      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={value ?? new Date()}
          mode={mode}
          display="default"
          onChange={(_, d) => { if (d) onChange(d); setShow(false); }}
          themeVariant={colorScheme}
        />
      )}
    </View>
  );
}
