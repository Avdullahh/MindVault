import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import { emitDataChange, subscribeToDataChanges } from '../lib/data-events';
import type { Goal, GoalInsert } from '../types';

export type GoalWithMilestones = Goal;

export function useGoals() {
  const source = useRef(Symbol('goals'));
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setGoals(data ?? []);
    setLoading(false);
  };

  const create = async (
    payload: Pick<GoalInsert, 'title' | 'deadline' | 'priority' | 'category_id' | 'project_id'>,
  ): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('goals').insert({ ...payload, user_id });
    if (err) return err.message;
    await fetch();
    emitDataChange(['goals', 'projects'], source.current);
    return null;
  };

  const update = async (
    id: string,
    payload: Partial<Pick<Goal, 'title' | 'deadline' | 'priority' | 'category_id'>>,
  ): Promise<string | null> => {
    const { error: err } = await supabase.from('goals').update(payload).eq('id', id);
    if (err) return err.message;
    await fetch();
    emitDataChange(['goals', 'projects'], source.current);
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('goals').delete().eq('id', id);
    if (err) return err.message;
    setGoals((prev) => prev.filter((g) => g.id !== id));
    emitDataChange(['goals', 'projects', 'tasks'], source.current);
    return null;
  };

  useEffect(() => {
    fetch();
    return subscribeToDataChanges('goals', (eventSource) => {
      if (eventSource !== source.current) fetch();
    });
  }, []);

  return { goals, loading, error, refetch: fetch, create, update, remove };
}
