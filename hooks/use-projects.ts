import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import type { Project, ProjectInsert } from '../types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setProjects(data ?? []);
    setLoading(false);
  };

  const create = async (payload: Pick<ProjectInsert, 'title' | 'main_goal' | 'category_id'>): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('projects').insert({ ...payload, user_id });
    if (err) return err.message;
    await fetch();
    return null;
  };

  const update = async (id: string, payload: Partial<Pick<Project, 'title' | 'main_goal' | 'category_id'>>): Promise<string | null> => {
    const { error: err } = await supabase.from('projects').update(payload).eq('id', id);
    if (err) return err.message;
    await fetch();
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('projects').delete().eq('id', id);
    if (err) return err.message;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    return null;
  };

  useEffect(() => { fetch(); }, []);

  return { projects, loading, error, refetch: fetch, create, update, remove };
}
