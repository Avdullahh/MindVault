import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { DatePicker } from './ui/DatePicker';
import { toLocalDateString } from '../lib/date-utils';
import { useThemeColors } from '../context/ThemeContext';
import type { Task } from '../types';
import { PRIORITIES, priorityActive, type Priority } from '../lib/priority';

type Props = {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, payload: Partial<Pick<Task, 'title' | 'due_date' | 'priority' | 'notes'>>) => Promise<string | null>;
};

export function EditTaskModal({ task, visible, onClose, onSave }: Props) {
  const colors = useThemeColors();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!task || !visible) return;
    setTitle(task.title);
    setDueDate(task.due_date ? new Date(task.due_date) : null);
    setPriority((task.priority as Priority | null) ?? null);
    setNotes(task.notes ?? '');
    setError(null);
  }, [task, visible]);

  const handleSave = async () => {
    if (!task) return;
    if (!title.trim()) { setError('Title is required'); return; }
    const parsedDue = dueDate ? toLocalDateString(dueDate) : null;
    setLoading(true); setError(null);
    const err = await onSave(task.id, { title: title.trim(), due_date: parsedDue, priority, notes: notes.trim() || null });
    setLoading(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Edit Task">
      <TextInput
        className="bg-surface text-foreground rounded-xl px-4 py-3 mb-3 border border-border"
        placeholder="Title"
        placeholderTextColor={colors.muted}
        value={title}
        onChangeText={setTitle}
        maxLength={200}
      />

      <DatePicker value={dueDate} onChange={setDueDate} mode="date" placeholder="Due date (optional)" compact />

      <View className="flex-row gap-2 mb-3">
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${priority === p ? priorityActive[p] : 'bg-surface border-border'}`}
            onPress={() => setPriority(priority === p ? null : p)}
            accessibilityRole="button"
            accessibilityState={{ selected: priority === p }}
          >
            <Text className="text-foreground text-sm capitalize">{p}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        className="bg-surface text-foreground rounded-xl px-4 py-3 mb-4 border border-border"
        placeholder="Notes (optional)"
        placeholderTextColor={colors.muted}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        value={notes}
        onChangeText={setNotes}
        style={{ maxHeight: 72 }}
      />

      {error ? <Text className="text-red-400 text-xs mb-3">{error}</Text> : null}

      <Pressable
        className={`rounded-xl py-4 items-center ${!title.trim() || loading ? 'bg-surface-2 border border-border' : 'bg-primary border border-primary'}`}
        onPress={handleSave}
        disabled={loading || !title.trim()}
        accessibilityRole="button"
      >
        {loading
          ? <ActivityIndicator color={colors.primary} />
          : <Text className="text-foreground font-bold text-base">Save Changes</Text>
        }
      </Pressable>
    </ModalSheet>
  );
}
