import { FlatList, Pressable, Text } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import type { GoalWithMilestones } from '../hooks/use-goals';

type Props = {
  visible: boolean;
  onClose: () => void;
  allGoals: GoalWithMilestones[];
  selectedIds: string[];
  onToggle: (goalId: string) => void;
};

export function GoalPickerModal({ visible, onClose, allGoals, selectedIds, onToggle }: Props) {
  return (
    <ModalSheet visible={visible} onClose={onClose} title="Link Goal">
      <FlatList
        data={allGoals}
        keyExtractor={(g) => g.id}
        style={{ maxHeight: 350 }}
        renderItem={({ item }) => (
          <Pressable
            className="py-3 px-2 border-b border-leather-800 flex-row items-center justify-between"
            onPress={() => onToggle(item.id)}
          >
            <Text className="text-leather-50 flex-1" numberOfLines={1}>{item.title}</Text>
            {selectedIds.includes(item.id) && <Text className="text-gold-400">✓</Text>}
          </Pressable>
        )}
        ListEmptyComponent={<Text className="text-leather-400 text-center py-4">No goals yet</Text>}
      />
    </ModalSheet>
  );
}
