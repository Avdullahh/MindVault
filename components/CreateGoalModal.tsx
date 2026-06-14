import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { ModalSheet } from './ui/ModalSheet';
import type { GoalInsert } from '../types';
import { useThemeColors } from '../context/ThemeContext';
import { PRIORITIES, PRIORITY_LABELS, priorityActive, type Priority } from '../lib/priority';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: Pick<GoalInsert, 'title' | 'deadline' | 'priority' | 'category_id'>) => Promise<string | null>;
};

export function CreateGoalModal({ visible, onClose, onCreate }: Props) {
  const colors = useThemeColors();
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
      <Text className="text-muted text-xs uppercase mb-4" style={{ letterSpacing: 2 }}>
        New Goal
      </Text>

      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-2xl mb-5 font-rounded"
        style={{ minHeight: 52 }}
        placeholder="What are you working toward?"
        placeholderTextColor={colors.muted}
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
            className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${priority === p ? priorityActive[p] : 'bg-surface border-border'}`}
            onPress={() => setPriority(priority === p ? null : p)}
            accessibilityRole="button"
            accessibilityState={{ selected: priority === p }}
          >
            <Text className="text-foreground text-xs">{PRIORITY_LABELS[p]}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text className="text-red-400 text-xs mb-3">{error}</Text> : null}

      <Pressable
        className={`rounded-xl py-4 items-center ${!title.trim() || loading ? 'bg-surface-2 border border-border' : 'bg-primary border border-primary'}`}
        onPress={handleCreate}
        disabled={loading || !title.trim()}
        accessibilityRole="button"
      >
        {loading
          ? <ActivityIndicator color={colors.primary} />
          : <Text className="text-foreground font-bold text-base">Set Goal</Text>
        }
      </Pressable>
    </ModalSheet>
  );
}
