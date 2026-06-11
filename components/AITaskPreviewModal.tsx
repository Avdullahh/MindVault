import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModalSheet } from './ui/ModalSheet';
import { Button } from './ui/Button';
import { useThemeColors } from '../context/ThemeContext';
import type { PlanResult } from '../hooks/use-ai';

type Props = {
  visible: boolean;
  onClose: () => void;
  plan: PlanResult | null;
  saving: boolean;
  onConfirm: (checkedTasks: string[]) => Promise<void>;
};

export function AITaskPreviewModal({ visible, onClose, plan, saving, onConfirm }: Props) {
  const colors = useThemeColors();
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible && plan) setChecked(new Set(plan.tasks.map((_, i) => i)));
  }, [visible, plan]);

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const handleConfirm = async () => {
    if (!plan) return;
    await onConfirm(plan.tasks.filter((_, i) => checked.has(i)));
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="AI Plan Preview">
      {!plan ? (
        <View className="items-center py-8">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-muted text-xs font-semibold uppercase tracking-wider mb-2">
              Tasks to create ({checked.size} of {plan.tasks.length} selected)
            </Text>
            {plan.tasks.map((task, i) => (
              <Pressable
                key={i}
                className="flex-row min-h-11 items-center gap-3 bg-surface rounded-xl px-4 py-3 mb-2"
                onPress={() => toggle(i)}
                disabled={saving}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: checked.has(i), disabled: saving }}
              >
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${checked.has(i) ? 'bg-primary border-primary' : 'border-border'}`}>
                  {checked.has(i) ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                </View>
                <Text className="text-foreground text-sm flex-1">{task}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="flex-row gap-3 mt-2 mb-2">
            <View className="flex-1">
              <Button label="Cancel" onPress={onClose} variant="ghost" disabled={saving} />
            </View>
            <View className="flex-1">
              <Button
                label={saving ? 'Saving...' : `Save${checked.size > 0 ? ` (${checked.size})` : ''}`}
                onPress={handleConfirm}
                loading={saving}
                disabled={checked.size === 0}
              />
            </View>
          </View>
        </>
      )}
    </ModalSheet>
  );
}
