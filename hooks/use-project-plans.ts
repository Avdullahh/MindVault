import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { subscribeToDataChanges } from '../lib/data-events';
import type { ProjectPlan } from '../types';

const queryKey = (projectId: string) => ['project-plans', projectId];

async function fetchProjectPlans(projectId: string): Promise<ProjectPlan[]> {
  const { data, error } = await supabase
    .from('project_plans')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useProjectPlans(projectId: string, enabled: boolean = true) {
  const source = useRef(Symbol('project-plans'));
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKey(projectId),
    queryFn: () => fetchProjectPlans(projectId),
    enabled: !!projectId && enabled,
    // 0 (not the app-wide 30s default) so opening History always reflects the
    // most recent "Plan with AI" run, not a stale cached read.
    staleTime: 0,
  });

  useEffect(() => {
    return subscribeToDataChanges('project-plans', (eventSource) => {
      if (eventSource === source.current) return;
      queryClient.invalidateQueries({ queryKey: queryKey(projectId) });
    });
  }, [projectId, queryClient]);

  const refetch = async () => {
    await query.refetch();
  };

  return {
    plans: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch,
  };
}
