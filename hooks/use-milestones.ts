import { supabase } from '../lib/supabase';
import type { MilestoneInsert } from '../types';

export function useMilestones(onRefresh: () => Promise<void>) {
  const create = async (goalId: string, title: string, position: number): Promise<string | null> => {
    const payload: MilestoneInsert = { goal_id: goalId, title, position };
    const { error } = await supabase.from('milestones').insert(payload);
    if (error) return error.message;
    await onRefresh();
    return null;
  };

  const update = async (id: string, title: string): Promise<string | null> => {
    const { error } = await supabase.from('milestones').update({ title }).eq('id', id);
    if (error) return error.message;
    await onRefresh();
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('milestones').delete().eq('id', id);
    if (error) return error.message;
    await onRefresh();
    return null;
  };

  return { create, update, remove };
}
