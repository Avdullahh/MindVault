import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DatePicker } from './ui/DatePicker';
import type { Goal, GoalUpdate } from '../types';
import { PRIORITIES, PRIORITY_LABELS, priorityActive, type Priority } from '../lib/priority';
import { EntityFormModal } from './ui/EntityFormModal';

type Props = {
  goal: Goal | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, payload: Partial<Pick<GoalUpdate, 'title' | 'deadline' | 'priority'>>) => Promise<string | null>;
};

function parseDateField(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function EditGoalModal({ goal, visible, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!goal || !visible) return;
    setTitle(goal.title);
    setPriority((goal.priority as Priority | null) ?? null);
    setDeadline(parseDateField(goal.deadline));
    setError(null);
  }, [goal, visible]);

  const handleSave = async () => {
    if (!goal) return;
    if (!title.trim()) { setError('Give the goal a name'); return; }
    setLoading(true); setError(null);
    const err = await onSave(goal.id, {
      title: title.trim(),
      priority,
      deadline: deadline ? toIsoDate(deadline) : null,
    });
    setLoading(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <EntityFormModal
      visible={visible}
      onClose={onClose}
      eyebrow="Edit Goal"
      titleValue={title}
      onTitleChange={setTitle}
      titlePlaceholder="What are you working toward?"
      titleBottomClassName="mb-5"
      error={error}
      loading={loading}
      submitLabel="Save Goal"
      onSubmit={handleSave}
      canSubmit={Boolean(title.trim())}
    >
      <Text className="text-muted text-xs uppercase mb-2" style={{ letterSpacing: 1.5 }}>Priority</Text>
      <View className="flex-row gap-2 mb-5">
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${priority === p ? priorityActive[p] : 'bg-surface border-border'}`}
            onPress={() => setPriority(priority === p ? null : p)}
          >
            <Text className="text-foreground text-xs">{PRIORITY_LABELS[p]}</Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-muted text-xs uppercase" style={{ letterSpacing: 1.5 }}>Deadline</Text>
        {deadline ? (
          <Pressable onPress={() => setDeadline(null)} hitSlop={8}>
            <Text className="text-muted text-xs">Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <DatePicker
        value={deadline}
        onChange={setDeadline}
        mode="date"
        placeholder="No deadline"
        compact
      />
    </EntityFormModal>
  );
}
