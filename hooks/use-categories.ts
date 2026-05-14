import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import { emitDataChange, subscribeToDataChanges } from '../lib/data-events';
import type { Category } from '../types';

export function useCategories() {
  const source = useRef(Symbol('categories'));
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('categories')
      .select('*')
      .order('is_protected', { ascending: true })
      .order('name', { ascending: true });
    if (err) setError(err.message);
    else {
      setError(null);
      setCategories(data ?? []);
    }
    setLoading(false);
  };

  const create = async (name: string): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('categories').insert({ name, user_id });
    if (err) return err.message;
    await fetch();
    emitDataChange('categories', source.current);
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const target = categories.find((c) => c.id === id);
    if (target?.is_protected) return 'Cannot delete a protected category';
    const { error: err } = await supabase.from('categories').delete().eq('id', id);
    if (err) return err.message;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    emitDataChange(['categories', 'ideas', 'projects', 'goals', 'calendar_events', 'tasks'], source.current);
    return null;
  };

  useEffect(() => {
    fetch();
    return subscribeToDataChanges('categories', (eventSource) => {
      if (eventSource !== source.current) fetch();
    });
  }, []);

  return { categories, loading, error, refetch: fetch, create, remove };
}
