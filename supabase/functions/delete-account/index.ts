import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAuthedClient } from '../_shared/auth.ts';
import { corsPreflight, internalError, ok, unauthorised } from '../_shared/responses.ts';

// Every user-owned table's user_id FK is declared `references auth.users(id)
// on delete cascade`, so deleting the auth user alone cleans up every row
// (ideas, projects, goals, tasks, and their junction tables). No manual
// per-table deletion needed here.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();

  try {
    const authed = await getAuthedClient(req);
    if (!authed) return unauthorised();

    // auth.admin.deleteUser requires the service-role key — the anon-key
    // client used for auth verification can't perform it.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await admin.auth.admin.deleteUser(authed.userId);
    if (error) {
      console.error('Failed to delete user', error);
      return internalError('Failed to delete account');
    }

    return ok({});
  } catch (e) {
    console.error(e);
    return internalError();
  }
});
