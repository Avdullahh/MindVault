import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';
import { useThemeColors } from '../context/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string | null, categoryId: string | null) => Promise<string | null>;
};

export function CreateIdeaModal({ visible, onClose, onCreate }: Props) {
  const colors = useThemeColors();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setDescription(''); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Give the idea a name'); return; }
    setLoading(true);
    setError(null);
    const err = await onCreate(title.trim(), description.trim() || null, null);
    setLoading(false);
    if (err) { setError(err); } else { reset(); onClose(); }
  };

  return (
    <ModalSheet visible={visible} onClose={handleClose}>
      <Text
        className="text-muted text-xs uppercase mb-4"
        style={{ letterSpacing: 2 }}
      >
        New Idea
      </Text>

      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-2xl mb-1"
        style={{ fontFamily: 'Georgia', minHeight: 52 }}
        placeholder="What's the idea?"
        placeholderTextColor={colors.muted}
        value={title}
        onChangeText={setTitle}
        multiline
        maxLength={200}
        autoFocus
      />

      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-3 text-muted text-base mb-6"
        style={{ minHeight: 72, textAlignVertical: 'top' }}
        placeholder="Expand on it... (optional)"
        placeholderTextColor={colors.muted}
        value={description}
        onChangeText={setDescription}
        multiline
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
          : <Text className="text-foreground font-bold text-base">Capture</Text>
        }
      </Pressable>
    </ModalSheet>
  );
}
