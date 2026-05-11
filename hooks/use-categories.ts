import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import type { Category } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (err) setError(err.message);
    else setCategories(data ?? []);
    setLoading(false);
  };

  const create = async (name: string): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('categories').insert({ name, user_id });
    if (err) return err.message;
    await fetch();
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const target = categories.find((c) => c.id === id);
    if (target?.is_protected) return 'Cannot delete a protected category';
    const { error: err } = await supabase.from('categories').delete().eq('id', id);
    if (err) return err.message;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    return null;
  };

  useEffect(() => { fetch(); }, []);

  return { categories, loading, error, refetch: fetch, create, remove };
}
