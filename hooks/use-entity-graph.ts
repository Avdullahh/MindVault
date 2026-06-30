import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { subscribeToDataChanges } from '../lib/data-events';

export type EntityGraphNodeType = 'idea' | 'project' | 'goal';
export type EntityGraphEdgeType = 'project_idea' | 'goal_idea' | 'goal_project';

export type EntityGraphNode = {
  id: string;
  entityId: string;
  type: EntityGraphNodeType;
  title: string;
  subtitle: string | null;
  createdAt: string;
};

export type EntityGraphEdge = {
  id: string;
  source: string;
  target: string;
  type: EntityGraphEdgeType;
};

type EntityGraphPayload = {
  nodes: EntityGraphNode[];
  edges: EntityGraphEdge[];
};

type EntityGraphRpcClient = {
  rpc: (
    fn: 'get_entity_graph',
  ) => Promise<{ data: EntityGraphPayload | null; error: { message: string } | null }>;
};

function parseGraphPayload(payload: EntityGraphPayload | null): EntityGraphPayload {
  return {
    nodes: Array.isArray(payload?.nodes) ? payload.nodes : [],
    edges: Array.isArray(payload?.edges) ? payload.edges : [],
  };
}

export function useEntityGraph() {
  const source = useRef(Symbol('entity-graph'));
  const [graph, setGraph] = useState<EntityGraphPayload>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    const { data, error: err } = await (supabase as unknown as EntityGraphRpcClient).rpc('get_entity_graph');

    if (err) {
      setError(err.message);
    } else {
      setError(null);
      setGraph(parseGraphPayload(data));
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void fetch();
    const unsubscribeLocal = subscribeToDataChanges(['ideas', 'projects', 'goals', 'tasks', 'categories', 'tags'], (eventSource) => {
      if (eventSource !== source.current) void fetch();
    });

    const channel = supabase
      .channel('entity-graph')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => void fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => void fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => void fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_ideas' }, () => void fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_ideas' }, () => void fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_projects' }, () => void fetch())
      .subscribe();

    return () => {
      unsubscribeLocal();
      void supabase.removeChannel(channel);
    };
  }, [fetch]);

  return {
    nodes: graph.nodes,
    edges: graph.edges,
    loading,
    refreshing,
    error,
    refetch: () => fetch(true),
  };
}
