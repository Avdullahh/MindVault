import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import { emitDataChange, subscribeToDataChanges } from '../lib/data-events';
import type { Project, ProjectInsert } from '../types';

const projectsQueryKey = ['projects'];

async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useProjects() {
  const source = useRef(Symbol('projects'));
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: projectsQueryKey, queryFn: fetchProjects });
  const projects = query.data ?? [];
  const error = query.error instanceof Error ? query.error.message : null;

  const refetch = async () => {
    await query.refetch();
  };

  const create = async (payload: Pick<ProjectInsert, 'title' | 'main_goal' | 'category_id'>): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('projects').insert({ ...payload, user_id });
    if (err) return err.message;
    await queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    emitDataChange('projects', source.current);
    return null;
  };

  const update = async (id: string, payload: Partial<Pick<Project, 'title' | 'main_goal' | 'category_id'>>): Promise<string | null> => {
    const { error: err } = await supabase.from('projects').update(payload).eq('id', id);
    if (err) return err.message;
    await queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    emitDataChange('projects', source.current);
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('projects').delete().eq('id', id);
    if (err) return err.message;
    queryClient.setQueryData<Project[]>(projectsQueryKey, (prev) => prev?.filter((p) => p.id !== id) ?? []);
    emitDataChange(['projects', 'goals', 'tasks'], source.current);
    return null;
  };

  useEffect(() => {
    return subscribeToDataChanges('projects', (eventSource) => {
      if (eventSource !== source.current) {
        void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
      }
    });
  }, [queryClient]);

  return { projects, loading: query.isLoading, error, refetch, create, update, remove };
}
