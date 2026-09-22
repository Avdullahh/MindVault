# MindVault Privacy Policy

Last updated: [9/22/2026]

This Privacy Policy explains how MindVault collects, uses, stores, and deletes information when you use the MindVault app.

## Information We Collect

MindVault collects the information needed to provide the app:

- Account email address, collected through magic-link email sign-in, Sign in with Apple, or Sign in with Google.
- User-created content, including ideas, goals, tasks, and projects.

MindVault does not have a password sign-up screen. Authentication is passwordless through email magic links or supported OAuth providers.

## How We Use Information

MindVault uses collected information to:

- Create and manage your account.
- Sync your ideas, goals, tasks, and projects across your devices.
- Let you organize, edit, link, and retrieve your own content.
- Support optional AI features when you explicitly choose to use them.

MindVault does not run AI features automatically in the background.

## Storage and Security

MindVault stores account and user-created content in Supabase, using a Postgres database. Database access is protected by row-level security policies so each signed-in user can access only their own data.

MindVault uses Supabase Auth for authentication and Supabase infrastructure for storage and sync. Access controls are designed around per-user isolation.

## Third Parties

MindVault uses the following third-party services:

- Supabase, for authentication, database storage, sync, and backend infrastructure.
- Apple, only when you choose Sign in with Apple.
- Google, only when you choose Sign in with Google.
- Google's Gemini API, only when you explicitly trigger an AI feature.

When you use an AI feature, only the specific content needed for that requested action is sent to Gemini for processing. Gemini is called only from MindVault's server-side Supabase Edge Functions. Gemini is never called directly from the app client, and MindVault does not send content to Gemini automatically.

## Data Retention and Account Deletion

MindVault keeps your account information and user-created content while your account remains active.

If you delete your account, MindVault permanently deletes the data associated with that account, including ideas, goals, tasks, projects, and related links. If you signed in with Apple, MindVault also revokes the stored Apple OAuth token as part of account deletion.

## Children's Privacy

MindVault is not directed at children under 13. If you believe a child under 13 has provided personal information through MindVault, contact us so we can review and delete the information if required.

## Contact

For privacy questions or deletion requests, contact:

`aalhazmi485@gmail.com`

