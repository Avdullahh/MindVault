import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { emitDataChange } from '../lib/data-events';
import type { Idea } from '../types';

export function useProjectIdeas() {
  const [loading, setLoading] = useState(false);

  const fetchIdeasForProject = async (projectId: string): Promise<Idea[]> => {
    const { data } = await supabase
      .from('project_ideas')
      .select('ideas(*)')
      .eq('project_id', projectId);
    return (data ?? []).map((row) => (row as { ideas: Idea }).ideas).filter(Boolean);
  };

  const linkIdea = async (projectId: string, ideaId: string): Promise<string | null> => {
    setLoading(true);
    const { error } = await supabase.from('project_ideas').insert({ project_id: projectId, idea_id: ideaId });
    setLoading(false);
    if (!error) emitDataChange(['projects', 'ideas']);
    return error?.message ?? null;
  };

  const unlinkIdea = async (projectId: string, ideaId: string): Promise<string | null> => {
    setLoading(true);
    const { error } = await supabase
      .from('project_ideas')
      .delete()
      .eq('project_id', projectId)
      .eq('idea_id', ideaId);
    setLoading(false);
    if (!error) emitDataChange(['projects', 'ideas']);
    return error?.message ?? null;
  };

  return { loading, fetchIdeasForProject, linkIdea, unlinkIdea };
}
