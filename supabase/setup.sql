-- Wreckers of Porthcove: one-time database setup.
-- Paste this whole file into Supabase → SQL Editor → New query, then press Run.
-- Safe to run again; it only creates what's missing and replaces the functions.

-- One row per game. The page never reads this table directly:
-- it goes through the three functions below, so the host's secret key stays hidden.
create table if not exists public.wreckers_games (
  code        text primary key check (code ~ '^[A-Z]{4}$'),
  host_key    text not null,
  state       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Lock the table: row level security on, no policies, no direct access for the public key.
alter table public.wreckers_games enable row level security;
revoke all on table public.wreckers_games from anon, authenticated;

-- Read a game's public state by its code.
create or replace function public.wreckers_get(p_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select state from public.wreckers_games where code = upper(p_code);
$$;

-- Open a new game. Returns false if the code is already taken.
-- Also tidies away games nobody has touched for three days.
create or replace function public.wreckers_create(p_code text, p_key text, p_state jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.wreckers_games where updated_at < now() - interval '3 days';
  if length(p_key) < 16 or octet_length(p_state::text) > 500000 then
    return false;
  end if;
  insert into public.wreckers_games (code, host_key, state) values (upper(p_code), p_key, p_state);
  return true;
exception when unique_violation then
  return false;
end;
$$;

-- Save a game's state. Only the phone holding the host key can do this.
create or replace function public.wreckers_save(p_code text, p_key text, p_state jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if octet_length(p_state::text) > 500000 then
    return false;
  end if;
  update public.wreckers_games
     set state = p_state, updated_at = now()
   where code = upper(p_code) and host_key = p_key;
  return found;
end;
$$;

revoke all on function public.wreckers_get(text) from public;
revoke all on function public.wreckers_create(text, text, jsonb) from public;
revoke all on function public.wreckers_save(text, text, jsonb) from public;
grant execute on function public.wreckers_get(text) to anon, authenticated;
grant execute on function public.wreckers_create(text, text, jsonb) to anon, authenticated;
grant execute on function public.wreckers_save(text, text, jsonb) to anon, authenticated;
