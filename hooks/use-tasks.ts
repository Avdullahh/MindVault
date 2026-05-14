import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import type { Task, TaskInsert } from '../types';

export type TaskWithGoal = Task & { goalTitle?: string };

export function useTasks() {
  const [tasks, setTasks] = useState<TaskWithGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('tasks')
      .select('*, task_goals(goals(title))')
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); setLoading(false); return; }
    const mapped: TaskWithGoal[] = (data ?? []).map((t: Task & { task_goals?: { goals: { title: string } | null }[] }) => {
      const firstGoal = t.task_goals?.[0]?.goals;
      const { task_goals: _tg, ...rest } = t as Task & { task_goals?: unknown };
      return { ...rest, goalTitle: firstGoal?.title ?? undefined };
    });
    setTasks(mapped);
    setLoading(false);
  };

  const create = async (
    payload: Pick<TaskInsert, 'title' | 'due_date' | 'priority' | 'notes' | 'category_id'>,
  ): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('tasks').insert({ ...payload, user_id });
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
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...payload } as TaskWithGoal : t)));
    return null;
  };

  const toggle = async (id: string, done: boolean): Promise<string | null> => update(id, { done });

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id);
    if (err) return err.message;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    return null;
  };

  useEffect(() => { fetch(); }, []);

  return { tasks, loading, error, refetch: fetch, create, update, toggle, remove };
}
