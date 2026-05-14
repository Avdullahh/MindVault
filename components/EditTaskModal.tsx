import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { Button } from './ui/Button';
import { DatePicker } from './ui/DatePicker';
import { toLocalDateString } from '../lib/date-utils';
import type { Task } from '../types';

type Priority = 'high' | 'medium' | 'low';

type Props = {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, payload: Partial<Pick<Task, 'title' | 'due_date' | 'priority' | 'notes'>>) => Promise<string | null>;
};

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const priorityStyle: Record<Priority, string> = {
  high:   'bg-red-900 border-red-700',
  medium: 'bg-yellow-900 border-yellow-700',
  low:    'bg-gray-700 border-gray-600',
};

export function EditTaskModal({ task, visible, onClose, onSave }: Props) {
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
      <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextInput
          className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-3"
          placeholder="Title"
          placeholderTextColor="#6b7280"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />
        <DatePicker
          value={dueDate}
          onChange={setDueDate}
          mode="date"
          placeholder="Due date (optional)"
        />
        <View className="flex-row gap-2 mb-3">
          {PRIORITIES.map((p) => (
            <Pressable
              key={p}
              className={`flex-1 py-2 rounded-xl border items-center ${priority === p ? priorityStyle[p] : 'bg-gray-800 border-gray-700'}`}
              onPress={() => setPriority(priority === p ? null : p)}
            >
              <Text className="text-white text-sm capitalize">{p}</Text>
            </Pressable>
          ))}
        </View>
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
      </ScrollView>
      {error ? <Text className="text-red-400 text-sm mb-3">{error}</Text> : null}
      <View className="mt-2 mb-2">
        <Button label="Save changes" onPress={handleSave} loading={loading} />
      </View>
    </ModalSheet>
  );
}
