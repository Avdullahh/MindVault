import { useEffect, useState } from 'react';
import type { Project, ProjectUpdate } from '../types';
import { EntityFormModal } from './ui/EntityFormModal';

type Props = {
  project: Project | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, payload: Partial<Pick<ProjectUpdate, 'title' | 'main_goal'>>) => Promise<string | null>;
};

export function EditProjectModal({ project, visible, onClose, onSave }: Props) {
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
    <EntityFormModal
      visible={visible}
      onClose={onClose}
      eyebrow="Edit Project"
      titleValue={title}
      onTitleChange={setTitle}
      titlePlaceholder="Project name"
      titleBottomClassName="mb-5"
      bodyValue={mainGoal}
      onBodyChange={setMainGoal}
      bodyPlaceholder="Main goal or mission (optional)"
      bodyMinHeight={80}
      bodyMaxLength={500}
      error={error}
      loading={loading}
      submitLabel="Save Project"
      onSubmit={handleSave}
      canSubmit={Boolean(title.trim())}
    />
  );
}
