import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Tag } from '../types';

export function useIdeaTags() {
  const [loading, setLoading] = useState(false);

  const fetchTagsForIdea = async (ideaId: string): Promise<Tag[]> => {
    const { data } = await supabase
      .from('idea_tags')
      .select('tags(*)')
      .eq('idea_id', ideaId);
    return (data ?? []).map((row) => (row as { tags: Tag }).tags).filter(Boolean);
  };

  const addTag = async (ideaId: string, tagId: string): Promise<string | null> => {
    setLoading(true);
    const { error } = await supabase.from('idea_tags').insert({ idea_id: ideaId, tag_id: tagId });
    setLoading(false);
    return error?.message ?? null;
  };

  const removeTag = async (ideaId: string, tagId: string): Promise<string | null> => {
    setLoading(true);
    const { error } = await supabase
      .from('idea_tags')
      .delete()
      .eq('idea_id', ideaId)
      .eq('tag_id', tagId);
    setLoading(false);
    return error?.message ?? null;
  };

  return { loading, fetchTagsForIdea, addTag, removeTag };
}
