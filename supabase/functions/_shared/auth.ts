import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function getAuthedClient(req: Request) {
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!jwt) return null;
  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return { client, userId: data.user.id };
}
