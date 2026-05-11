import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import type { Idea, IdeaInsert } from '../types';

type CreatePayload = Pick<IdeaInsert, 'title' | 'description' | 'category_id'>;

export function useIdeas() {
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
    return null;
  };

  const update = async (
    id: string,
    payload: Partial<Pick<Idea, 'title' | 'description' | 'category_id' | 'last_viewed_at'>>,
  ): Promise<string | null> => {
    const { error: err } = await supabase.from('ideas').update(payload).eq('id', id);
    if (err) return err.message;
    await fetch();
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('ideas').delete().eq('id', id);
    if (err) return err.message;
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    return null;
  };

  useEffect(() => { fetch(); }, []);

  return { ideas, loading, error, refetch: fetch, create, update, remove };
}
