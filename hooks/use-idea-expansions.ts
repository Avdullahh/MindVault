import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { subscribeToDataChanges } from '../lib/data-events';
import type { IdeaExpansion } from '../types';

const queryKey = (ideaId: string) => ['idea-expansions', ideaId];

async function fetchIdeaExpansions(ideaId: string): Promise<IdeaExpansion[]> {
  const { data, error } = await supabase
    .from('idea_expansions')
    .select('*')
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useIdeaExpansions(ideaId: string, enabled: boolean = true) {
  const source = useRef(Symbol('idea-expansions'));
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKey(ideaId),
    queryFn: () => fetchIdeaExpansions(ideaId),
    enabled: !!ideaId && enabled,
  });

  useEffect(() => {
    return subscribeToDataChanges('idea-expansions', (eventSource) => {
      if (eventSource === source.current) return;
      queryClient.invalidateQueries({ queryKey: queryKey(ideaId) });
    });
  }, [ideaId, queryClient]);

  const refetch = async () => {
    await query.refetch();
  };

  return {
    expansions: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch,
  };
}
