alter table public.calendar_events
  add column done boolean not null default false;
