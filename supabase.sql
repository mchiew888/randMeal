-- Run this once in the Supabase SQL Editor
create table meals (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

-- Prevent duplicates regardless of capitalisation
create unique index meals_name_unique on meals (lower(name));

-- Public list, no accounts: let the anon key do everything
alter table meals enable row level security;
create policy "public read"   on meals for select using (true);
create policy "public insert" on meals for insert with check (true);
create policy "public update" on meals for update using (true) with check (true);
create policy "public delete" on meals for delete using (true);
