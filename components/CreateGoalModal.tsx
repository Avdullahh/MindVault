import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import type { GoalInsert } from '../types';
import { PRIORITIES, PRIORITY_LABELS, priorityActive, type Priority } from '../lib/priority';
import { EntityFormModal } from './ui/EntityFormModal';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: Pick<GoalInsert, 'title' | 'deadline' | 'priority' | 'category_id'>) => Promise<string | null>;
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
    <EntityFormModal
      visible={visible}
      onClose={handleClose}
      eyebrow="New Goal"
      titleValue={title}
      onTitleChange={setTitle}
      titlePlaceholder="What are you working toward?"
      titleBottomClassName="mb-5"
      error={error}
      loading={loading}
      submitLabel="Set Goal"
      onSubmit={handleCreate}
      canSubmit={Boolean(title.trim())}
    >
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
    </EntityFormModal>
  );
}
