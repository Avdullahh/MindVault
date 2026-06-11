import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { ModalSheet } from './ui/ModalSheet';
import type { ProjectInsert } from '../types';
import { useThemeColors } from '../context/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: Pick<ProjectInsert, 'title' | 'main_goal' | 'category_id'>) => Promise<string | null>;
};

export function CreateProjectModal({ visible, onClose, onCreate }: Props) {
  const colors = useThemeColors();
  const [title, setTitle] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setMainGoal(''); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Give the project a name'); return; }
    setLoading(true); setError(null);
    const err = await onCreate({ title: title.trim(), main_goal: mainGoal.trim() || null, category_id: null });
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  return (
    <ModalSheet visible={visible} onClose={handleClose}>
      <Text className="text-muted text-xs uppercase mb-4" style={{ letterSpacing: 2 }}>
        New Project
      </Text>

      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-2xl mb-3"
        style={{ fontFamily: 'Georgia', minHeight: 52 }}
        placeholder="Project name"
        placeholderTextColor={colors.muted}
        value={title}
        onChangeText={setTitle}
        multiline
        maxLength={200}
        autoFocus
      />

      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-3 text-muted text-base mb-6"
        style={{ minHeight: 56, textAlignVertical: 'top' }}
        placeholder="What's the mission? (optional)"
        placeholderTextColor={colors.muted}
        value={mainGoal}
        onChangeText={setMainGoal}
        multiline
        maxLength={500}
      />

      {error ? <Text className="text-red-400 text-xs mb-3">{error}</Text> : null}

      <Pressable
        className={`rounded-xl py-4 items-center ${!title.trim() || loading ? 'bg-surface-2 border border-border' : 'bg-primary border border-primary'}`}
        onPress={handleCreate}
        disabled={loading || !title.trim()}
        accessibilityRole="button"
      >
        {loading
          ? <ActivityIndicator color={colors.primary} />
          : <Text className="text-foreground font-bold text-base">Start Project</Text>
        }
      </Pressable>
    </ModalSheet>
  );
}
