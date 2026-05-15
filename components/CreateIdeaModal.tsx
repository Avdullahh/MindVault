import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { ModalSheet } from './ui/ModalSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string | null, categoryId: string | null) => Promise<string | null>;
};

export function CreateIdeaModal({ visible, onClose, onCreate }: Props) {
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
        className="text-leather-400 text-xs uppercase mb-4"
        style={{ letterSpacing: 2 }}
      >
        New Idea
      </Text>

      <TextInput
        className="text-leather-50 text-2xl mb-1"
        style={{ fontFamily: 'Georgia', minHeight: 52 }}
        placeholder="What's the idea?"
        placeholderTextColor="#7a6050"
        value={title}
        onChangeText={setTitle}
        multiline
        maxLength={200}
        autoFocus
      />

      <TextInput
        className="text-leather-300 text-base mb-6"
        style={{ minHeight: 72, textAlignVertical: 'top' }}
        placeholder="Expand on it... (optional)"
        placeholderTextColor="#7a6050"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {error ? <Text className="text-red-400 text-xs mb-3">{error}</Text> : null}

      <Pressable
        className={`rounded-xl py-4 items-center ${!title.trim() || loading ? 'bg-leather-700' : 'bg-gold-500'}`}
        onPress={handleCreate}
        disabled={loading || !title.trim()}
        accessibilityRole="button"
      >
        {loading
          ? <ActivityIndicator color="#f5e6c8" />
          : <Text className="text-leather-50 font-bold text-base">Capture</Text>
        }
      </Pressable>
    </ModalSheet>
  );
}
