# Backend setup: magic-link + OAuth auth

Companion to the client-side flow in `context/auth-context.tsx`, `app/(auth)/welcome.tsx`,
`app/(auth)/login.tsx`, and `components/ui/OAuthButtons.tsx`. This doc covers the backend
half: local `supabase/config.toml` (already edited) and the hosted project settings that
have to be applied by hand in the Supabase Dashboard, since there's no CLI/MCP surface for
Auth provider or SMTP config.

## Local: `supabase/config.toml`

Already updated in this pass:

- `site_url = "mindvault://"`, `additional_redirect_urls = ["mindvault://*", "exp://*"]`
- `[auth.external.apple]` enabled, `[auth.external.google]` added
- `[auth.email.smtp]` wired to Resend (`smtp.resend.com`, sandbox sender `onboarding@resend.dev`)
- `[auth.rate_limit].email_sent` raised from `2` to `30`

Fill in your local `.env` (git-ignored) before running `supabase start`:

```
SUPABASE_AUTH_EXTERNAL_APPLE_SECRET=<Apple client-secret JWT — see below>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<Google OAuth client secret>
RESEND_API_KEY=<Resend API key>
```

You'll also need to put the real `client_id` values directly into
`supabase/config.toml` for `[auth.external.apple]` and `[auth.external.google]`
(client IDs aren't secret, but weren't filled in automatically — paste your Apple
Services ID and Google OAuth client ID there).

### Generating the Apple client-secret JWT

Apple doesn't give you a static Apple secret — you sign a short-lived JWT yourself
with the private key from your "Sign in with Apple" key, and that signed JWT *is*
the secret Supabase wants. `scripts/generate-apple-client-secret.js` builds it (no
new dependency — just Node's built-in `crypto`).

```
node scripts/generate-apple-client-secret.js \
  --team-id <APPLE_TEAM_ID> \
  --key-id <APPLE_KEY_ID> \
  --client-id <APPLE_SERVICES_ID> \
  --key-path <path/to/AuthKey_XXXXXXXXXX.p8>
```

Where each input comes from, all under **developer.apple.com/account**:

| Flag | Where to find it |
|---|---|
| `--team-id` | Membership → Team ID (top-right of the account page) |
| `--key-id` | Certificates, Identifiers & Profiles → Keys → your "Sign in with Apple" key → Key ID on its detail page |
| `--key-path` | The `.p8` file Apple lets you download **once**, at key creation. Keep it outside the repo (e.g. `~/secrets/AuthKey_XXXXXXXXXX.p8`) — never commit it. |
| `--client-id` | Certificates, Identifiers & Profiles → Identifiers → your Services ID (e.g. `com.avhaz.mindvault.signin`). This is the **same** value as `[auth.external.apple].client_id` in `supabase/config.toml` and the Dashboard's "Client ID" field. |

The script prints the signed JWT to stdout. Paste that value into:
- **Local**: `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET` in `.env`
- **Hosted**: Dashboard → Authentication → Providers → Apple → **Secret Key**

The JWT expires after 6 months (Apple's max) — the script prints the expiry date
to stderr as a reminder. Re-run it and update both places before it lapses.

## Hosted project (`MindVault`, ref `hmwhnnevzpuqyyuizovg`) — Dashboard checklist

Apply these manually under **Project Settings → Authentication**:

1. **URL Configuration**
   - Site URL → `mindvault://`
   - Redirect URLs → add `mindvault://*` (and `exp://*` if testing OAuth against a dev
     build that points at the hosted project instead of local Supabase)
2. **Providers → Apple** — enable, paste the Services ID as Client ID and the
   client-secret JWT from `scripts/generate-apple-client-secret.js` (see below) as
   Secret Key.
3. **Providers → Google** — enable, paste the OAuth Client ID and Client Secret.
4. **Emails → SMTP Settings** — enable custom SMTP:
   - Host: `smtp.resend.com`, Port: `587`, User: `resend`
   - Password: your Resend API key
   - Sender email: `onboarding@resend.dev`, Sender name: `MindVault`

## Known caveat: Resend sandbox sender

No sending domain is verified in Resend yet, so `onboarding@resend.dev` is a shared
sandbox sender — Resend will only actually deliver to the Resend account owner's own
verified email address. Real end users won't receive magic links until a domain is
added and verified in Resend (then swap `admin_email` here and in the dashboard SMTP
settings for an address on that domain).

## Deferred

**TODO:** add a `profiles` table and update `handle_new_user()`
(`supabase/migrations/20240101000000_initial_schema.sql`) to persist OAuth-provided
display name/avatar server-side. Right now that data only lives in
`auth.users.raw_user_meta_data`, written via `updateAccount` in
`context/auth-context.tsx`. Deferred from the 2026-08-11 auth backend setup — revisit
before shipping broader profile features.

## Verification performed

- `npx supabase start` / `npx supabase status` to confirm `config.toml` parses and the
  local Auth service comes up healthy.
- Local magic-link test via Inbucket/Mailpit (`http://127.0.0.1:54324`).
- `npx tsc --noEmit` sanity check (no app code changed in this pass).
- Hosted-project dashboard steps above are manual and must be applied by you — they
  can't be verified from this session.
