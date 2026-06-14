import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
        className="bg-surface rounded-xl px-4 py-3 flex-row items-center justify-between mb-3"
        onPress={() => setOpen(true)}
      >
        <Text className={selected ? 'text-foreground' : 'text-muted'}>
          {selected ? selected.name : 'Category (optional)'}
        </Text>
        <Text className="text-muted text-sm">▾</Text>
      </Pressable>

      <ModalSheet visible={open} onClose={() => setOpen(false)} title="Select category">
        <View>
          {items.map((item) => (
            <Pressable
              key={item.id ?? '__none__'}
              className="py-3 px-2 border-b border-border flex-row items-center justify-between"
              onPress={() => { onChange(item.id); setOpen(false); }}
            >
              <Text className="text-foreground">{item.name}</Text>
              {item.id === value && <Text className="text-primary">✓</Text>}
            </Pressable>
          ))}
        </View>
      </ModalSheet>
    </>
  );
}
