import { supabase } from './supabase';

export async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error('Not authenticated');
  return userId;
}
