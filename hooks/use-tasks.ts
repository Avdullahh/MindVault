import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import type { Task, TaskInsert } from '../types';

export type TaskWithGoal = Task & {
  goalTitle?: string | null;
};

export function useProjectTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (err) { setError(err.message); setLoading(false); return; }
    setTasks(data ?? []);
    setLoading(false);
  };

  const create = async (
    payload: Pick<TaskInsert, 'title' | 'due_date' | 'priority' | 'notes'>,
  ): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('tasks').insert({ ...payload, user_id, project_id: projectId });
    if (err) return err.message;
    await fetch();
    return null;
  };

  const update = async (
    id: string,
    payload: Partial<Pick<Task, 'title' | 'due_date' | 'priority' | 'notes' | 'done'>>,
  ): Promise<string | null> => {
    const { error: err } = await supabase.from('tasks').update(payload).eq('id', id);
    if (err) return err.message;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...payload } : t)));
    return null;
  };

  const toggle = async (id: string, done: boolean): Promise<string | null> => update(id, { done });

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id);
    if (err) return err.message;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    return null;
  };

  useEffect(() => { fetch(); }, [projectId]);

  return { tasks, loading, error, refetch: fetch, create, update, toggle, remove };
}
