import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { DatePicker } from './ui/DatePicker';
import type { Goal, GoalUpdate } from '../types';

type Priority = 'high' | 'medium' | 'low';

type Props = {
  goal: Goal | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, payload: Partial<Pick<GoalUpdate, 'title' | 'deadline' | 'priority'>>) => Promise<string | null>;
};

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

const PRIORITY_LABELS: Record<Priority, string> = { high: 'High', medium: 'Medium', low: 'Low' };

const priorityActive: Record<Priority, string> = {
  high: 'bg-red-900 border-red-700',
  medium: 'bg-yellow-900 border-yellow-700',
  low: 'bg-leather-600 border-leather-500',
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
    <ModalSheet visible={visible} onClose={onClose} title="Edit Goal">
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

      <Text className="text-leather-400 text-xs uppercase mb-2" style={{ letterSpacing: 1.5 }}>Priority</Text>
      <View className="flex-row gap-2 mb-5">
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${priority === p ? priorityActive[p] : 'bg-leather-800 border-leather-600'}`}
            onPress={() => setPriority(priority === p ? null : p)}
          >
            <Text className="text-leather-100 text-xs">{PRIORITY_LABELS[p]}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-leather-400 text-xs uppercase mb-2" style={{ letterSpacing: 1.5 }}>Deadline</Text>
      <DatePicker
        value={deadline}
        onChange={setDeadline}
        mode="date"
        placeholder="No deadline"
        compact
      />

      {error ? <Text className="text-red-400 text-xs mb-3">{error}</Text> : null}

      <Pressable
        className={`rounded-xl py-4 items-center mt-2 ${!title.trim() || loading ? 'bg-leather-700' : 'bg-gold-500'}`}
        onPress={handleSave}
        disabled={loading || !title.trim()}
        accessibilityRole="button"
      >
        {loading
          ? <ActivityIndicator color="#f5e6c8" />
          : <Text className="text-leather-50 font-bold text-base">Save Goal</Text>
        }
      </Pressable>
    </ModalSheet>
  );
}
