import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { useThemeColors } from '../context/ThemeContext';

type Item = { id: string; title: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: Item[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

export function ItemPickerModal({
  visible,
  onClose,
  title,
  items,
  selectedIds,
  onToggle,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found',
}: Props) {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <ModalSheet visible={visible} onClose={onClose} title={title}>
      <TextInput
        className="bg-surface text-foreground rounded-xl px-4 py-3 mb-3"
        placeholder={searchPlaceholder}
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />
      <View style={{ maxHeight: 350 }}>
        {filtered.length === 0
          ? <Text className="text-muted text-center py-4">{emptyMessage}</Text>
          : filtered.map((item) => (
              <Pressable
                key={item.id}
                className="py-3 px-2 border-b border-border flex-row items-center justify-between"
                onPress={() => onToggle(item.id)}
              >
                <Text className="text-foreground flex-1" numberOfLines={1}>{item.title}</Text>
                {selectedIds.includes(item.id) && <Text className="text-primary">✓</Text>}
              </Pressable>
            ))
        }
      </View>
    </ModalSheet>
  );
}
