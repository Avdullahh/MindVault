import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import { emitDataChange, subscribeToDataChanges } from '../lib/data-events';
import type { Idea, IdeaInsert } from '../types';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type CreatePayload = Pick<IdeaInsert, 'title' | 'description' | 'category_id'>;

export function useIdeas() {
  const source = useRef(Symbol('ideas'));
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setIdeas(data ?? []);
    setLoading(false);
  };

  const create = async (payload: CreatePayload): Promise<string | null> => {
    const user_id = await getUserId().catch((e: Error) => { setError(e.message); return null; });
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('ideas').insert({ ...payload, user_id });
    if (err) return err.message;
    await fetch();
    emitDataChange('ideas', source.current);
    return null;
  };

  const update = async (
    id: string,
    payload: Partial<Pick<Idea, 'title' | 'description' | 'category_id' | 'last_viewed_at'>>,
  ): Promise<string | null> => {
    const { error: err } = await supabase.from('ideas').update(payload).eq('id', id);
    if (err) return err.message;
    await fetch();
    emitDataChange('ideas', source.current);
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('ideas').delete().eq('id', id);
    if (err) return err.message;
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    emitDataChange(['ideas', 'projects', 'goals'], source.current);
    return null;
  };

  useEffect(() => {
    fetch();
    return subscribeToDataChanges('ideas', (eventSource) => {
      if (eventSource !== source.current) fetch();
    });
  }, []);

  const forgottenIdeas = useMemo(() => {
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    return ideas.filter((i) => {
      const lastSeen = i.last_viewed_at ? new Date(i.last_viewed_at).getTime() : null;
      const created = new Date(i.created_at).getTime();
      return lastSeen !== null ? lastSeen < cutoff : created < cutoff;
    });
  }, [ideas]);

  return { ideas, forgottenIdeas, loading, error, refetch: fetch, create, update, remove };
}
