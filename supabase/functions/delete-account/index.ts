import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { importPKCS8, SignJWT } from 'https://esm.sh/jose@5';
import { getAuthedClient } from '../_shared/auth.ts';
import { corsPreflight, internalError, ok, unauthorised } from '../_shared/responses.ts';

const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';

async function revokeAppleCredential(refreshToken: string) {
  const teamId = Deno.env.get('APPLE_TEAM_ID');
  const keyId = Deno.env.get('APPLE_KEY_ID');
  const privateKey = Deno.env.get('APPLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  const clientId = Deno.env.get('APPLE_CLIENT_ID');

  if (!teamId || !keyId || !privateKey || !clientId) {
    console.warn('Apple credential revocation skipped: Apple secrets are not fully configured');
    return;
  }

  try {
    const key = await importPKCS8(privateKey, 'ES256');
    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .setIssuer(teamId)
      .setSubject(clientId)
      .setAudience('https://appleid.apple.com')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(key);

    const response = await fetch(APPLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        token: refreshToken,
        token_type_hint: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      console.warn('Apple credential revocation failed', response.status, details);
    }
  } catch (err) {
    console.warn('Apple credential revocation failed', err);
  }
}

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

    const { data: appleCredential, error: appleCredentialError } = await admin
      .from('apple_oauth_tokens')
      .select('refresh_token')
      .eq('user_id', authed.userId)
      .maybeSingle();

    if (appleCredentialError) {
      console.warn('Apple credential lookup failed; continuing with account deletion', appleCredentialError);
    } else if (appleCredential?.refresh_token) {
      await revokeAppleCredential(appleCredential.refresh_token);
    } else {
      console.warn('Apple credential revocation skipped: no stored Apple refresh token');
    }

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
