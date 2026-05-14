import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { Button } from './ui/Button';
import { DatePicker } from './ui/DatePicker';
import { CategoryPicker } from './CategoryPicker';
import { toLocalDateString } from '../lib/date-utils';
import type { TaskInsert } from '../types';

type Priority = 'high' | 'medium' | 'low';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: Pick<TaskInsert, 'title' | 'due_date' | 'priority' | 'notes' | 'category_id'>) => Promise<string | null>;
};

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const priorityStyle: Record<Priority, string> = {
  high:   'bg-red-900 border-red-700',
  medium: 'bg-yellow-900 border-yellow-700',
  low:    'bg-leather-600 border-leather-500',
};

export function CreateTaskModal({ visible, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setDueDate(null); setPriority(null); setNotes(''); setCategoryId(null); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    const parsedDue = dueDate ? toLocalDateString(dueDate) : null;
    setLoading(true); setError(null);
    const err = await onCreate({ title: title.trim(), due_date: parsedDue, priority, notes: notes.trim() || null, category_id: categoryId });
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  return (
    <ModalSheet visible={visible} onClose={handleClose} title="New Task">
      <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextInput
          className="bg-leather-800 text-leather-50 rounded-xl px-4 py-3 mb-3"
          placeholder="Title"
          placeholderTextColor="#7a6050"
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
              className={`flex-1 py-2 rounded-xl border items-center ${priority === p ? priorityStyle[p] : 'bg-leather-800 border-leather-600'}`}
              onPress={() => setPriority(priority === p ? null : p)}
            >
              <Text className="text-leather-50 text-sm capitalize">{p}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          className="bg-leather-800 text-leather-50 rounded-xl px-4 py-3 mb-3"
          placeholder="Notes (optional)"
          placeholderTextColor="#7a6050"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
        <CategoryPicker value={categoryId} onChange={setCategoryId} />
      </ScrollView>
      {error && <Text className="text-red-400 text-sm mb-3">{error}</Text>}
      <View className="mt-2 mb-2">
        <Button label="Create task" onPress={handleCreate} loading={loading} />
      </View>
    </ModalSheet>
  );
}
