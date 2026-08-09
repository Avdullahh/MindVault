import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import { emitDataChange, subscribeToDataChanges } from '../lib/data-events';
import type { Goal, GoalInsert } from '../types';

export type GoalWithMilestones = Goal;
const goalsQueryKey = ['goals'];

async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useGoals() {
  const source = useRef(Symbol('goals'));
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: goalsQueryKey, queryFn: fetchGoals });
  const goals = query.data ?? [];
  const error = query.error instanceof Error ? query.error.message : null;

  const refetch = async () => {
    await query.refetch();
  };

  const create = async (
    payload: Pick<GoalInsert, 'title' | 'deadline' | 'priority' | 'category_id' | 'project_id'>,
  ): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('goals').insert({ ...payload, user_id });
    if (err) return err.message;
    await queryClient.invalidateQueries({ queryKey: goalsQueryKey });
    emitDataChange(['goals', 'projects'], source.current);
    return null;
  };

  const update = async (
    id: string,
    payload: Partial<Pick<Goal, 'title' | 'deadline' | 'priority' | 'category_id'>>,
  ): Promise<string | null> => {
    const { error: err } = await supabase.from('goals').update(payload).eq('id', id);
    if (err) return err.message;
    await queryClient.invalidateQueries({ queryKey: goalsQueryKey });
    emitDataChange(['goals', 'projects'], source.current);
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('goals').delete().eq('id', id);
    if (err) return err.message;
    queryClient.setQueryData<Goal[]>(goalsQueryKey, (prev) => prev?.filter((g) => g.id !== id) ?? []);
    emitDataChange(['goals', 'projects', 'tasks'], source.current);
    return null;
  };

  useEffect(() => {
    return subscribeToDataChanges('goals', (eventSource) => {
      if (eventSource !== source.current) {
        void queryClient.invalidateQueries({ queryKey: goalsQueryKey });
      }
    });
  }, [queryClient]);

  return { goals, loading: query.isLoading, error, refetch, create, update, remove };
}
