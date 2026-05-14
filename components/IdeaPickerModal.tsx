import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import type { Idea } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  allIdeas: Idea[];
  selectedIds: string[];
  onToggle: (ideaId: string) => void;
};

export function IdeaPickerModal({ visible, onClose, allIdeas, selectedIds, onToggle }: Props) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? allIdeas.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))
    : allIdeas;

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Link Idea">
      <TextInput
        className="bg-leather-800 text-leather-50 rounded-xl px-4 py-3 mb-3"
        placeholder="Search ideas..."
        placeholderTextColor="#7a6050"
        value={query}
        onChangeText={setQuery}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
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
        ListEmptyComponent={<Text className="text-leather-400 text-center py-4">No ideas found</Text>}
      />
    </ModalSheet>
  );
}
