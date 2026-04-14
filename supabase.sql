create table if not exists public.breeze_access_codes (
  id text primary key default 'latest',
  access_code text not null,
  note text,
  source text,
  updated_at timestamptz not null default now()
);

alter table public.breeze_access_codes enable row level security;

drop policy if exists "Allow public read latest Breeze access code" on public.breeze_access_codes;
drop policy if exists "Allow public upsert latest Breeze access code" on public.breeze_access_codes;
drop policy if exists "Allow public update latest Breeze access code" on public.breeze_access_codes;

revoke all on public.breeze_access_codes from anon;
revoke all on public.breeze_access_codes from authenticated;
