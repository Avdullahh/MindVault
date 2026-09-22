import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAuthedClient } from '../_shared/auth.ts';
import { badRequest, corsPreflight, internalError, ok, unauthorised } from '../_shared/responses.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();

  try {
    const authed = await getAuthedClient(req);
    if (!authed) return unauthorised();

    let body: { refreshToken?: unknown };
    try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }

    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken.trim() : '';
    if (!refreshToken) return badRequest('refreshToken is required');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await admin.from('apple_oauth_tokens').upsert({
      user_id: authed.userId,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('Failed to store Apple credential', error);
      return internalError('Failed to store Apple credential');
    }

    return ok({});
  } catch (e) {
    console.error(e);
    return internalError();
  }
});
