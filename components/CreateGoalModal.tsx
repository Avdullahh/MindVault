import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { Button } from './ui/Button';
import { AIButton } from './ui/AIButton';
import { CategoryPicker } from './CategoryPicker';
import { useAI } from '../hooks/use-ai';
import type { GoalInsert } from '../types';

type Priority = 'high' | 'medium' | 'low';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: Pick<GoalInsert, 'title' | 'deadline' | 'priority' | 'category_id'>) => Promise<string | null>;
};

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const priorityStyle: Record<Priority, string> = {
  high:   'bg-red-900 border-red-700',
  medium: 'bg-yellow-900 border-yellow-700',
  low:    'bg-gray-700 border-gray-600',
};

export function CreateGoalModal({ visible, onClose, onCreate }: Props) {
  const { planGoal, planState } = useAI();
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState(() => new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<Priority | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setDeadline(new Date().toISOString().slice(0, 10)); setPriority(null); setCategoryId(null); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handlePlanWithAI = async () => {
    if (!title.trim()) { setError('Enter a goal title first'); return; }
    setError(null);
    const { data, error: planError } = await planGoal(title.trim());
    if (data) {
      setTitle(data.title);
      setDeadline(data.deadline);
      setPriority(data.priority);
    } else if (planError) {
      setError(planError);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    let parsedDeadline: string | null = null;
    if (deadline.trim()) {
      const d = new Date(deadline.trim());
      if (isNaN(d.getTime())) { setError('Invalid date — use YYYY-MM-DD'); return; }
      parsedDeadline = deadline.trim();
    }
    setLoading(true); setError(null);
    const err = await onCreate({ title: title.trim(), deadline: parsedDeadline, priority, category_id: categoryId });
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  return (
    <ModalSheet visible={visible} onClose={handleClose} title="New Goal">
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextInput
          className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-2"
          placeholder="Title"
          placeholderTextColor="#6b7280"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />

        <View className="mb-3">
          <AIButton
            label="Plan with AI"
            glyph="✦"
            loading={planState.status === 'loading'}
            onPress={handlePlanWithAI}
          />
        </View>

        <TextInput
          className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-3"
          placeholder="Deadline (YYYY-MM-DD, optional)"
          placeholderTextColor="#6b7280"
          value={deadline}
          onChangeText={setDeadline}
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
        <CategoryPicker value={categoryId} onChange={setCategoryId} />
        {error && <Text className="text-red-400 text-sm mb-3">{error}</Text>}
        <View className="mt-2">
          <Button label="Create goal" onPress={handleCreate} loading={loading} />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}
