import { useState } from 'react';
import { FlatList, Pressable, Text } from 'react-native';
import { useCategories } from '../hooks/use-categories';
import { ModalSheet } from './ui/ModalSheet';

type Props = {
  value: string | null;
  onChange: (id: string | null) => void;
};

export function CategoryPicker({ value, onChange }: Props) {
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);

  const selected = categories.find((c) => c.id === value);

  const items = [
    { id: null as string | null, name: 'None', is_protected: false, user_id: '', created_at: '' },
    ...categories,
  ];

  return (
    <>
      <Pressable
        className="bg-gray-800 rounded-xl px-4 py-3 flex-row items-center justify-between mb-3"
        onPress={() => setOpen(true)}
      >
        <Text className={selected ? 'text-white' : 'text-gray-500'}>
          {selected ? selected.name : 'Category (optional)'}
        </Text>
        <Text className="text-gray-500 text-sm">▾</Text>
      </Pressable>

      <ModalSheet visible={open} onClose={() => setOpen(false)} title="Select category">
        <FlatList
          data={items}
          keyExtractor={(item) => item.id ?? '__none__'}
          renderItem={({ item }) => (
            <Pressable
              className="py-3 px-2 border-b border-gray-800 flex-row items-center justify-between"
              onPress={() => { onChange(item.id); setOpen(false); }}
            >
              <Text className="text-white">{item.name}</Text>
              {item.id === value && <Text className="text-teal-400">✓</Text>}
            </Pressable>
          )}
        />
      </ModalSheet>
    </>
  );
}
