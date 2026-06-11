import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { useThemeColors } from '../context/ThemeContext';
import type { Tag } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  allTags: Tag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
  onCreateTag?: (name: string) => Promise<string | null>;
};

export function TagPicker({ visible, onClose, allTags, selectedIds, onToggle, onCreateTag }: Props) {
  const colors = useThemeColors();
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTagName.trim() || !onCreateTag) return;
    setCreating(true);
    await onCreateTag(newTagName.trim());
    setNewTagName('');
    setCreating(false);
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Tags">
      {onCreateTag && (
        <View className="flex-row items-center mb-3 gap-2">
          <TextInput
            className="flex-1 bg-surface text-foreground rounded-xl px-4 py-3"
            placeholder="New tag name..."
            placeholderTextColor={colors.muted}
            value={newTagName}
            onChangeText={setNewTagName}
          />
          <Pressable
            className="bg-primary rounded-xl px-4 py-3"
            onPress={handleCreate}
            disabled={creating || !newTagName.trim()}
          >
            <Text className="text-foreground font-semibold">Add</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={allTags}
        keyExtractor={(t) => t.id}
        style={{ maxHeight: 300 }}
        renderItem={({ item }) => (
          <Pressable
            className="py-3 px-2 border-b border-border flex-row items-center justify-between"
            onPress={() => onToggle(item.id)}
          >
            <Text className="text-foreground">{item.name}</Text>
            {selectedIds.includes(item.id) && <Text className="text-primary">✓</Text>}
          </Pressable>
        )}
        ListEmptyComponent={<Text className="text-muted text-center py-4">No tags yet</Text>}
      />
    </ModalSheet>
  );
}
