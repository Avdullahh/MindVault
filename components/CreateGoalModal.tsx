import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { ModalSheet } from './ui/ModalSheet';
import type { GoalInsert } from '../types';

type Priority = 'high' | 'medium' | 'low';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: Pick<GoalInsert, 'title' | 'deadline' | 'priority' | 'category_id'>) => Promise<string | null>;
};

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const priorityActive: Record<Priority, string> = {
  high: 'bg-red-900 border-red-700',
  medium: 'bg-yellow-900 border-yellow-700',
  low: 'bg-leather-600 border-leather-500',
};

export function CreateGoalModal({ visible, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setPriority(null); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Give the goal a name'); return; }
    setLoading(true); setError(null);
    const err = await onCreate({ title: title.trim(), deadline: null, priority, category_id: null });
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  return (
    <ModalSheet visible={visible} onClose={handleClose}>
      <Text className="text-leather-400 text-xs uppercase mb-4" style={{ letterSpacing: 2 }}>
        New Goal
      </Text>

      <TextInput
        className="text-leather-50 text-2xl mb-5"
        style={{ fontFamily: 'Georgia', minHeight: 52 }}
        placeholder="What are you working toward?"
        placeholderTextColor="#3d2b1a"
        value={title}
        onChangeText={setTitle}
        multiline
        maxLength={200}
        autoFocus
      />

      <View className="flex-row gap-2 mb-5">
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${priority === p ? priorityActive[p] : 'bg-leather-800 border-leather-600'}`}
            onPress={() => setPriority(priority === p ? null : p)}
            accessibilityRole="button"
            accessibilityState={{ selected: priority === p }}
          >
            <Text className="text-leather-100 text-xs">{PRIORITY_LABELS[p]}</Text>
          </Pressable>
        ))}
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
          : <Text className="text-leather-50 font-bold text-base">Set Goal</Text>
        }
      </Pressable>
    </ModalSheet>
  );
}
