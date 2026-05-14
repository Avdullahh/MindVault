import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import type { PlanResult } from '../hooks/use-ai';

type Props = {
  visible: boolean;
  onClose: () => void;
  plan: PlanResult | null;
  saving: boolean;
  onConfirm: (checkedTasks: string[]) => Promise<void>;
};

function priorityColor(p: string): 'red' | 'yellow' | 'gray' {
  if (p === 'high') return 'red';
  if (p === 'medium') return 'yellow';
  return 'gray';
}

export function AITaskPreviewModal({ visible, onClose, plan, saving, onConfirm }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible && plan) setChecked(new Set(plan.tasks.map((_, i) => i)));
  }, [visible, plan]);

  const toggle = (i: number) =>
    setChecked((prev) => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  const handleConfirm = async () => {
    if (!plan) return;
    await onConfirm(plan.tasks.filter((_, i) => checked.has(i)));
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="AI Plan Preview">
      {!plan ? (
        <View className="items-center py-8">
          <ActivityIndicator color="#2dd4bf" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Goal summary */}
            <View className="bg-gray-800 rounded-xl px-4 py-3 mb-4">
              <Text className="text-white font-semibold mb-1" numberOfLines={2}>{plan.title}</Text>
              <View className="flex-row gap-2 flex-wrap">
                <Badge label={plan.priority} color={priorityColor(plan.priority)} />
                {plan.deadline ? <Badge label={plan.deadline} color="gray" /> : null}
              </View>
            </View>

            {/* Milestones summary */}
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Milestones ({plan.milestones.length})
            </Text>
            {plan.milestones.map((m, i) => (
              <View key={i} className="flex-row gap-2 mb-1.5">
                <Text className="text-gray-500 text-sm">·</Text>
                <Text className="text-gray-300 text-sm flex-1">{m.title}</Text>
              </View>
            ))}

            {/* Tasks — user can deselect */}
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-4 mb-2">
              Tasks to create ({checked.size} of {plan.tasks.length} selected)
            </Text>
            {plan.tasks.map((t, i) => (
              <Pressable
                key={i}
                className="flex-row items-center gap-3 bg-gray-800 rounded-xl px-4 py-3 mb-2"
                onPress={() => toggle(i)}
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${checked.has(i) ? 'bg-teal-500 border-teal-500' : 'border-gray-600'}`}>
                  {checked.has(i) && <Text className="text-white text-xs">✓</Text>}
                </View>
                <Text className="text-white text-sm flex-1">{t}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="mt-2 mb-2">
            <Button
              label={saving ? 'Saving…' : `Confirm & Save${checked.size > 0 ? ` (${checked.size} tasks)` : ''}`}
              onPress={handleConfirm}
              loading={saving}
            />
          </View>
        </View>
      )}
    </ModalSheet>
  );
}
