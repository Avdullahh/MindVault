import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import { emitDataChange, subscribeToDataChanges } from '../lib/data-events';
import type { Idea, IdeaInsert } from '../types';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type CreatePayload = Pick<IdeaInsert, 'title' | 'description' | 'category_id'>;
const ideasQueryKey = ['ideas'];

async function fetchIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useIdeas() {
  const source = useRef(Symbol('ideas'));
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ideasQueryKey, queryFn: fetchIdeas });
  const ideas = query.data ?? [];
  const error = query.error instanceof Error ? query.error.message : null;

  const refetch = async () => {
    await query.refetch();
  };

  const create = async (payload: CreatePayload): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('ideas').insert({ ...payload, user_id });
    if (err) return err.message;
    await queryClient.invalidateQueries({ queryKey: ideasQueryKey });
    emitDataChange('ideas', source.current);
    return null;
  };

  const update = async (
    id: string,
    payload: Partial<Pick<Idea, 'title' | 'description' | 'category_id' | 'last_viewed_at'>>,
  ): Promise<string | null> => {
    const { error: err } = await supabase.from('ideas').update(payload).eq('id', id);
    if (err) return err.message;
    await queryClient.invalidateQueries({ queryKey: ideasQueryKey });
    emitDataChange('ideas', source.current);
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('ideas').delete().eq('id', id);
    if (err) return err.message;
    queryClient.setQueryData<Idea[]>(ideasQueryKey, (prev) => prev?.filter((i) => i.id !== id) ?? []);
    emitDataChange(['ideas', 'projects', 'goals'], source.current);
    return null;
  };

  useEffect(() => {
    return subscribeToDataChanges('ideas', (eventSource) => {
      if (eventSource !== source.current) {
        void queryClient.invalidateQueries({ queryKey: ideasQueryKey });
      }
    });
  }, [queryClient]);

  const forgottenIdeas = useMemo(() => {
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    return ideas.filter((i) => {
      const lastSeen = i.last_viewed_at ? new Date(i.last_viewed_at).getTime() : null;
      const created = new Date(i.created_at).getTime();
      return lastSeen !== null ? lastSeen < cutoff : created < cutoff;
    });
  }, [ideas]);

  return { ideas, forgottenIdeas, loading: query.isLoading, error, refetch, create, update, remove };
}
