import { useState } from 'react';
import { EntityFormModal } from './ui/EntityFormModal';

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
    <EntityFormModal
      visible={visible}
      onClose={handleClose}
      eyebrow="New Idea"
      titleValue={title}
      onTitleChange={setTitle}
      titlePlaceholder="What's the idea?"
      titleBottomClassName="mb-1"
      bodyValue={description}
      onBodyChange={setDescription}
      bodyPlaceholder="Expand on it... (optional)"
      bodyMinHeight={72}
      error={error}
      loading={loading}
      submitLabel="Capture"
      onSubmit={handleCreate}
      canSubmit={Boolean(title.trim())}
    />
  );
}
