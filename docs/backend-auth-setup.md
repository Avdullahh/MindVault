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
Services ID and Google OAuth client ID there). The Apple `client_id` is left as
a `TODO`-flagged empty string for you to fill in.

### Registering the OAuth callback redirect URI (required — this is why sign-in doesn't fully work yet)

Apple/Google won't hand control back to Supabase unless Supabase's own auth
callback URL is explicitly allow-listed in each provider's console. This is
separate from `additional_redirect_urls` in `config.toml` (that list controls
where *Supabase* is allowed to redirect the app back to, e.g. `mindvault://*`)
— the provider consoles need Supabase's callback URL instead:

| Environment | Callback URL to register |
|---|---|
| Hosted (`MindVault`, ref `hmwhnnevzpuqyyuizovg`) | `https://hmwhnnevzpuqyyuizovg.supabase.co/auth/v1/callback` |
| Local dev (`supabase start`) | `http://127.0.0.1:54321/auth/v1/callback` |

Where to paste it:
- **Google Cloud Console** → APIs & Services → Credentials → your OAuth 2.0
  Client ID → **Authorized redirect URIs** → add the URL(s) above.
- **Apple Developer** → Certificates, Identifiers & Profiles → Identifiers →
  your Services ID → **Configure** (next to "Sign In with Apple") →
  **Website URLs**: add the callback URL(s) under **Return URLs**, and make
  sure the callback's domain (e.g. `hmwhnnevzpuqyyuizovg.supabase.co`) is
  listed under **Domains and Subdomains**. Apple requires HTTPS, so only the
  hosted callback can be registered there — testing Apple sign-in locally
  isn't possible against Apple's real servers.

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
5. **Emails → Templates → Magic Link** — local `config.toml`'s
   `[auth.email.template.magic_link]` only affects `supabase start`; the
   hosted project has its own copy with no CLI/MCP surface to push it. Paste
   the subject (`Your MindVault sign-in link`) and the full contents of
   `supabase/templates/magic_link.html` into this dashboard screen too.

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

## Verification performed (2026-09-08 pass: custom email template + OAuth callback registration)

- `npx tsc --noEmit` — ran clean aside from a pre-existing, unrelated failure in
  `lib/__tests__/date-format.test.ts` (missing `@types/jest`; no test runner types
  configured). No app or config TypeScript files were touched in this pass.
- Not run this session (needs your input/local Docker):
  - `npx supabase start` to confirm `[auth.email.template.magic_link]` parses and
    renders `supabase/templates/magic_link.html` correctly via Inbucket/Mailpit.
  - Registering the callback redirect URI in Google Cloud Console / Apple Developer
    (see above) and then testing "Continue with Apple" / "Continue with Google"
    end-to-end.
  - Pasting the template into the hosted project's Dashboard → Email Templates.

## Verification performed (2026-09-09 pass: end-to-end sign-in confirmed working)

- **Root cause found and fixed:** `lib/supabase.ts` never set `flowType: 'pkce'`
  on the Supabase client, so `supabase-js` defaulted to `flowType: 'implicit'`.
  `exchangeCodeFromUrl()` in `context/auth-context.tsx` expects a `code` query
  param (PKCE), which implicit flow never provides — so magic-link and OAuth
  redirects landed back in the app but never established a session. Fixed by
  adding `flowType: 'pkce'` to the client's `auth` options.
- Magic-link "link is invalid or expired" during testing was a red herring —
  caused by Apple Mail's Privacy Protection pre-fetching (and consuming) the
  single-use link before the real tap. Not a code or config issue; testing via
  Gmail's app or with Mail Privacy Protection off confirmed it.
- Apple/Google OAuth "Unable to exchange external code" (`unexpected_failure`)
  traced to, in order: (1) the provider enable toggle being off in the hosted
  Dashboard despite the toggle appearing on in the UI — confirmed via a direct
  `GET /auth/v1/settings` check, not just the Dashboard; (2) Apple's `client_id`
  in the Dashboard being set to the app's bundle identifier instead of the
  "Sign In with Apple" Services ID; (3) the Apple secret JWT being signed with
  a stale `--client-id` before the Services ID fix landed. All three fixed and
  reverified against the live `/auth/v1/authorize` redirect for each provider.
- **Apple signing key was rotated mid-session**: the original key's private
  material was accidentally exposed (pasted into a terminal command and this
  chat) while regenerating the client-secret JWT. That key was revoked and
  replaced with a newly generated "Sign In with Apple" key — the `.p8` file
  and Key ID referenced above are the new ones. The old key should not be
  reused.
- **Confirmed working end-to-end on a real dev-client build**: magic-link
  sign-in, "Continue with Apple," and "Continue with Google" all complete and
  establish a session.
- `npx tsc --noEmit` clean (aside from the pre-existing, unrelated
  `lib/__tests__/date-format.test.ts` failure — missing `@types/jest`).
- Temporary `[auth-debug]` diagnostic logging added during this investigation
  was removed once the root cause was fixed; none of it shipped.
