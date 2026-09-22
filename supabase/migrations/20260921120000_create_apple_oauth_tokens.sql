create table public.apple_oauth_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  created_at timestamptz not null default now()
);

alter table public.apple_oauth_tokens enable row level security;

-- Intentionally no anon/authenticated policies: service-role Edge Functions only.
