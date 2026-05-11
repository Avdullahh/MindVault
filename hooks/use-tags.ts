import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import type { Tag } from '../types';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    if (err) setError(err.message);
    else setTags(data ?? []);
    setLoading(false);
  };

  const create = async (name: string): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('tags').insert({ name, user_id });
    if (err) return err.message;
    await fetch();
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('tags').delete().eq('id', id);
    if (err) return err.message;
    setTags((prev) => prev.filter((t) => t.id !== id));
    return null;
  };

  useEffect(() => { fetch(); }, []);

  return { tags, loading, error, refetch: fetch, create, remove };
}
