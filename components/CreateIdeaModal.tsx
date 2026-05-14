import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { Button } from './ui/Button';
import { CategoryPicker } from './CategoryPicker';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string | null, categoryId: string | null) => Promise<string | null>;
};

export function CreateIdeaModal({ visible, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setDescription(''); setCategoryId(null); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError(null);
    const err = await onCreate(title.trim(), description.trim() || null, categoryId);
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  return (
    <ModalSheet visible={visible} onClose={handleClose} title="New Idea">
      <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextInput
          className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-3"
          placeholder="Title"
          placeholderTextColor="#6b7280"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />
        <TextInput
          className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-3"
          placeholder="Description (optional)"
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />
        <CategoryPicker value={categoryId} onChange={setCategoryId} />
      </ScrollView>
      {error && <Text className="text-red-400 text-sm mb-3">{error}</Text>}
      <View className="mt-2 mb-2">
        <Button label="Create idea" onPress={handleCreate} loading={loading} />
      </View>
    </ModalSheet>
  );
}
