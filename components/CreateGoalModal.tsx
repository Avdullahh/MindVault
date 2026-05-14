import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { Button } from './ui/Button';
import { AIButton } from './ui/AIButton';
import { DatePicker } from './ui/DatePicker';
import { CategoryPicker } from './CategoryPicker';
import { useAI } from '../hooks/use-ai';
import { toLocalDateString } from '../lib/date-utils';
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
  low:    'bg-leather-600 border-leather-500',
};

export function CreateGoalModal({ visible, onClose, onCreate }: Props) {
  const { planGoal, planState } = useAI();
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setDeadline(null); setPriority(null); setCategoryId(null); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handlePlanWithAI = async () => {
    if (!title.trim()) { setError('Enter a goal title first'); return; }
    setError(null);
    const { data, error: planError } = await planGoal(title.trim());
    if (data) {
      setTitle(data.title);
      if (data.deadline) {
        const [y, m, d] = data.deadline.split('-').map(Number);
        setDeadline(new Date(y, m - 1, d));
      } else {
        setDeadline(null);
      }
      setPriority(data.priority);
    } else if (planError) {
      setError(planError);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    const parsedDeadline = deadline ? toLocalDateString(deadline) : null;
    setLoading(true); setError(null);
    const err = await onCreate({ title: title.trim(), deadline: parsedDeadline, priority, category_id: categoryId });
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  return (
    <ModalSheet visible={visible} onClose={handleClose} title="New Goal">
      <ScrollView
        style={{ flexShrink: 1 }}
        contentContainerStyle={{ paddingBottom: 12 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          className="bg-leather-800 text-leather-50 rounded-xl min-h-11 px-4 py-3 mb-2"
          placeholder="Title"
          placeholderTextColor="#7a6050"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
          returnKeyType="done"
        />
        <View className="mb-3">
          <AIButton
            label="Plan with AI"
            loading={planState.status === 'loading'}
            onPress={handlePlanWithAI}
            hint="Refines your title, suggests a deadline, sets priority, and generates milestones"
          />
        </View>
        <DatePicker
          value={deadline}
          onChange={setDeadline}
          mode="date"
          placeholder="Deadline (optional)"
        />
        <View className="flex-row gap-2 mb-3">
          {PRIORITIES.map((p) => (
            <Pressable
              key={p}
              className={`flex-1 min-h-11 px-2 py-2 rounded-xl border items-center justify-center ${priority === p ? priorityStyle[p] : 'bg-leather-800 border-leather-600'}`}
              onPress={() => setPriority(priority === p ? null : p)}
              accessibilityRole="button"
              accessibilityState={{ selected: priority === p }}
            >
              <Text className="text-leather-50 text-sm capitalize">{p}</Text>
            </Pressable>
          ))}
        </View>
        <CategoryPicker value={categoryId} onChange={setCategoryId} />
      </ScrollView>
      {error && <Text className="text-red-400 text-sm mb-3">{error}</Text>}
      <View className="flex-row gap-3 mt-2 mb-2">
        <View className="flex-1">
          <Button label="Cancel" onPress={handleClose} variant="ghost" disabled={loading} />
        </View>
        <View className="flex-1">
          <Button label="Create goal" onPress={handleCreate} loading={loading} disabled={!title.trim()} />
        </View>
      </View>
    </ModalSheet>
  );
}
