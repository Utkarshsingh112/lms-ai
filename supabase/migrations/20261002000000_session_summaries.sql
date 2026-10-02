-- Stores the AI recap + quiz generated at the end of a voice session.
-- Also used as the ledger for the per-user daily generation limit.
create table if not exists public.session_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  companion_id text not null,
  summary text not null,
  key_points jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  message_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists session_summaries_user_created_idx
  on public.session_summaries (user_id, created_at desc);

alter table public.session_summaries enable row level security;

-- The app talks to Supabase with the Clerk session token, whose `sub` claim is
-- the Clerk user id.
create policy "Users read their own recaps"
  on public.session_summaries for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "Users create their own recaps"
  on public.session_summaries for insert
  with check ((auth.jwt() ->> 'sub') = user_id);
