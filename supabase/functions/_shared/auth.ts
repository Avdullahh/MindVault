import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function getAuthedClient(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!jwt) return null;

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );

  const { data, error } = await client.auth.getUser(jwt);
  if (error) {
    console.error('JWT verification failed', error);
    return null;
  }
  if (!data.user) return null;

  return { client, userId: data.user.id };
}
