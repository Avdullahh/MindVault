import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { useThemeColors } from '../context/ThemeContext';
import type { Project, ProjectUpdate } from '../types';

type Props = {
  project: Project | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, payload: Partial<Pick<ProjectUpdate, 'title' | 'main_goal'>>) => Promise<string | null>;
};

export function EditProjectModal({ project, visible, onClose, onSave }: Props) {
  const colors = useThemeColors();
  const [title, setTitle] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!project || !visible) return;
    setTitle(project.title);
    setMainGoal(project.main_goal ?? '');
    setError(null);
  }, [project, visible]);

  const handleSave = async () => {
    if (!project) return;
    if (!title.trim()) { setError('Give the project a name'); return; }
    setLoading(true); setError(null);
    const err = await onSave(project.id, {
      title: title.trim(),
      main_goal: mainGoal.trim() || null,
    });
    setLoading(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <Text className="text-muted text-xs uppercase mb-4" style={{ letterSpacing: 2 }}>
        Edit Project
      </Text>

      <TextInput
        className="text-foreground text-2xl mb-5"
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
        className="bg-surface text-foreground rounded-xl px-4 py-3 mb-5 border border-border"
        placeholder="Main goal or mission (optional)"
        placeholderTextColor={colors.muted}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        value={mainGoal}
        onChangeText={setMainGoal}
        maxLength={500}
        style={{ minHeight: 80 }}
      />

      {error ? <Text className="text-red-400 text-xs mb-3">{error}</Text> : null}

      <Pressable
        className={`rounded-xl py-4 items-center ${!title.trim() || loading ? 'bg-surface-2 border border-border' : 'bg-primary border border-primary'}`}
        onPress={handleSave}
        disabled={loading || !title.trim()}
        accessibilityRole="button"
      >
        {loading
          ? <ActivityIndicator color={colors.primary} />
          : <Text className="text-foreground font-bold text-base">Save Project</Text>
        }
      </Pressable>
    </ModalSheet>
  );
}
