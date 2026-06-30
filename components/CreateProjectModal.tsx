import { useState } from 'react';
import type { ProjectInsert } from '../types';
import { EntityFormModal } from './ui/EntityFormModal';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: Pick<ProjectInsert, 'title' | 'main_goal' | 'category_id'>) => Promise<string | null>;
};

export function CreateProjectModal({ visible, onClose, onCreate }: Props) {
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
    <EntityFormModal
      visible={visible}
      onClose={handleClose}
      eyebrow="New Project"
      titleValue={title}
      onTitleChange={setTitle}
      titlePlaceholder="Project name"
      bodyValue={mainGoal}
      onBodyChange={setMainGoal}
      bodyPlaceholder="What's the mission? (optional)"
      bodyMinHeight={56}
      bodyMaxLength={500}
      error={error}
      loading={loading}
      submitLabel="Start Project"
      onSubmit={handleCreate}
      canSubmit={Boolean(title.trim())}
    />
  );
}
