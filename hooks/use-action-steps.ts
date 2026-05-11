import { supabase } from '../lib/supabase';
import type { ActionStepInsert } from '../types';

export function useActionSteps(onRefresh: () => Promise<void>) {
  const create = async (milestoneId: string, title: string, position: number): Promise<string | null> => {
    const payload: ActionStepInsert = { milestone_id: milestoneId, title, position, done: false };
    const { error } = await supabase.from('action_steps').insert(payload);
    if (error) return error.message;
    await onRefresh();
    return null;
  };

  const toggle = async (id: string, done: boolean): Promise<string | null> => {
    const { error } = await supabase.from('action_steps').update({ done }).eq('id', id);
    if (error) return error.message;
    await onRefresh();
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('action_steps').delete().eq('id', id);
    if (error) return error.message;
    await onRefresh();
    return null;
  };

  return { create, toggle, remove };
}
