import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { Button } from './ui/Button';
import { CategoryPicker } from './CategoryPicker';
import type { ProjectInsert } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: Pick<ProjectInsert, 'title' | 'main_goal' | 'category_id'>) => Promise<string | null>;
};

export function CreateProjectModal({ visible, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setMainGoal(''); setCategoryId(null); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true); setError(null);
    const err = await onCreate({ title: title.trim(), main_goal: mainGoal.trim() || null, category_id: categoryId });
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  return (
    <ModalSheet visible={visible} onClose={handleClose} title="New Project">
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
          placeholder="Main goal (optional)"
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={mainGoal}
          onChangeText={setMainGoal}
        />
        <CategoryPicker value={categoryId} onChange={setCategoryId} />
        {error && <Text className="text-red-400 text-sm mb-3">{error}</Text>}
        <View className="mt-2">
          <Button label="Create project" onPress={handleCreate} loading={loading} />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}
