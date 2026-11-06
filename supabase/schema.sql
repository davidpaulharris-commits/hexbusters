-- Rush Hour – database setup for Supabase
-- Paste all of this into Supabase → SQL Editor → New query, then press Run.
-- It's safe to run again later (for example after an update).
-- Tables start with rh_ so they won't clash with anything else in the same project.


create table if not exists public.rh_rooms (
  code        text primary key,
  host_id     uuid,
  status      text not null default 'lobby' check (status in ('lobby', 'playing', 'ended')),
  map_choice  text not null default 'random',
  map         text,
  minutes     int  not null default 5,
  task_count  int  not null default 5,
  round       int  not null default 0,
  started_at  timestamptz,
  ends_at     timestamptz,
  ended_at    timestamptz,
  winner_id   uuid,
  created_at  timestamptz not null default now()
);

create table if not exists public.rh_players (
  id            uuid primary key default gen_random_uuid(),
  room_code     text not null references public.rh_rooms(code) on delete cascade,
  name          text not null,
  avatar        jsonb not null default '{}'::jsonb,
  tasks_done    int not null default 0,
  last_task_at  timestamptz,
  joined_at     timestamptz not null default now()
);
create index if not exists rh_players_room_idx on public.rh_players(room_code);

-- Anyone with the game link can read game state; all changes go through the functions below.
alter table public.rh_rooms enable row level security;
alter table public.rh_players enable row level security;
drop policy if exists "rh rooms are readable" on public.rh_rooms;
create policy "rh rooms are readable" on public.rh_rooms for select to anon, authenticated using (true);
drop policy if exists "rh players are readable" on public.rh_players;
create policy "rh players are readable" on public.rh_players for select to anon, authenticated using (true);
grant select on public.rh_rooms, public.rh_players to anon, authenticated;

-- Live updates
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'rh_rooms') then
      alter publication supabase_realtime add table public.rh_rooms;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'rh_players') then
      alter publication supabase_realtime add table public.rh_players;
    end if;
  end if;
end $$;

-- ---------- Functions ----------

create or replace function public.rh_now() returns timestamptz
language sql stable as $$ select now() $$;

create or replace function public.rh_clean_name(p_name text) returns text
language sql immutable as $$
  select coalesce(nullif(left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 14), ''), 'Player')
$$;

create or replace function public.rh_create_room(p_name text, p_avatar jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_player uuid;
  v_letters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  i int;
begin
  -- tidy up games older than a day
  delete from rh_rooms where created_at < now() - interval '1 day';
  loop
    v_code := '';
    for i in 1..4 loop
      v_code := v_code || substr(v_letters, 1 + floor(random() * length(v_letters))::int, 1);
    end loop;
    exit when not exists (select 1 from rh_rooms where code = v_code);
  end loop;
  insert into rh_rooms(code) values (v_code);
  insert into rh_players(room_code, name, avatar) values (v_code, rh_clean_name(p_name), coalesce(p_avatar, '{}'::jsonb)) returning id into v_player;
  update rh_rooms set host_id = v_player where code = v_code;
  return json_build_object('code', v_code, 'player_id', v_player);
end $$;

create or replace function public.rh_join_room(p_code text, p_name text, p_avatar jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare
  r rh_rooms;
  v_player uuid;
  v_count int;
begin
  select * into r from rh_rooms where code = upper(btrim(p_code)) for update;
  if not found then raise exception 'We couldn''t find a game with that code'; end if;
  if r.status <> 'lobby' then raise exception 'That game has already started. Ask the host to wait for you next round!'; end if;
  select count(*) into v_count from rh_players where room_code = r.code;
  if v_count >= 10 then raise exception 'Sorry, that game is full (10 players max)'; end if;
  insert into rh_players(room_code, name, avatar) values (r.code, rh_clean_name(p_name), coalesce(p_avatar, '{}'::jsonb)) returning id into v_player;
  return json_build_object('player_id', v_player);
end $$;

create or replace function public.rh_update_player(p_player uuid, p_name text, p_avatar jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update rh_players set name = rh_clean_name(p_name), avatar = coalesce(p_avatar, avatar) where id = p_player;
end $$;

create or replace function public.rh_set_settings(p_code text, p_player uuid, p_map_choice text, p_minutes int)
returns void language plpgsql security definer set search_path = public as $$
declare r rh_rooms;
begin
  select * into r from rh_rooms where code = p_code for update;
  if not found then raise exception 'Game not found'; end if;
  if r.host_id is distinct from p_player then raise exception 'Only the host can change the settings'; end if;
  if r.status = 'playing' then return; end if;
  if p_map_choice not in ('random', 'school', 'bank', 'shop', 'town') then raise exception 'Unknown map'; end if;
  update rh_rooms set map_choice = p_map_choice,
    minutes = greatest(5, least(30, p_minutes)),
    task_count = round(5 + (greatest(5, least(30, p_minutes)) - 5) * 0.4)
  where code = p_code;
end $$;

create or replace function public.rh_start_game(p_code text, p_player uuid, p_map text)
returns void language plpgsql security definer set search_path = public as $$
declare
  r rh_rooms;
  v_count int;
begin
  select * into r from rh_rooms where code = p_code for update;
  if not found then raise exception 'Game not found'; end if;
  if r.host_id is distinct from p_player then raise exception 'Only the host can start the game'; end if;
  if r.status = 'playing' then return; end if;
  if p_map not in ('school', 'bank', 'shop', 'town') then raise exception 'Unknown map'; end if;
  select count(*) into v_count from rh_players where room_code = p_code;
  if v_count < 2 then raise exception 'You need at least 2 players to start'; end if;
  update rh_players set tasks_done = 0, last_task_at = null where room_code = p_code;
  update rh_rooms set status = 'playing', map = p_map, round = round + 1,
    task_count = round(5 + (minutes - 5) * 0.4),
    started_at = now() + interval '4 seconds',
    ends_at = now() + interval '4 seconds' + make_interval(mins => minutes),
    ended_at = null, winner_id = null
  where code = p_code;
end $$;

create or replace function public.rh_complete_task(p_player uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  pl rh_players;
  r rh_rooms;
begin
  select * into pl from rh_players where id = p_player;
  if not found then return json_build_object('ok', false); end if;
  select * into r from rh_rooms where code = pl.room_code for update;
  if r.status <> 'playing' or now() < r.started_at or now() > r.ends_at + interval '2 seconds' then
    return json_build_object('ok', false);
  end if;
  if pl.tasks_done >= r.task_count then return json_build_object('ok', false); end if;
  update rh_players set tasks_done = tasks_done + 1, last_task_at = now() where id = p_player returning * into pl;
  if pl.tasks_done >= r.task_count then
    update rh_rooms set status = 'ended', ended_at = now(), winner_id = p_player where code = r.code;
  end if;
  return json_build_object('ok', true, 'tasks_done', pl.tasks_done);
end $$;

create or replace function public.rh_end_game(p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update rh_rooms set status = 'ended', ended_at = now()
  where code = p_code and status = 'playing' and now() >= ends_at - interval '2 seconds';
end $$;

create or replace function public.rh_reset_room(p_code text, p_player uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r rh_rooms;
begin
  select * into r from rh_rooms where code = p_code for update;
  if not found then raise exception 'Game not found'; end if;
  if r.host_id is distinct from p_player then raise exception 'Only the host can do that'; end if;
  update rh_players set tasks_done = 0, last_task_at = null where room_code = p_code;
  update rh_rooms set status = 'lobby', winner_id = null, started_at = null, ends_at = null, ended_at = null where code = p_code;
end $$;

create or replace function public.rh_leave(p_player uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_next uuid;
begin
  delete from rh_players where id = p_player returning room_code into v_code;
  if v_code is null then return; end if;
  if not exists (select 1 from rh_players where room_code = v_code) then
    delete from rh_rooms where code = v_code;
    return;
  end if;
  if (select host_id from rh_rooms where code = v_code) = p_player then
    select id into v_next from rh_players where room_code = v_code order by joined_at limit 1;
    update rh_rooms set host_id = v_next where code = v_code;
  end if;
end $$;

grant execute on function
  public.rh_now(), public.rh_clean_name(text), public.rh_create_room(text, jsonb), public.rh_join_room(text, text, jsonb),
  public.rh_update_player(uuid, text, jsonb), public.rh_set_settings(text, uuid, text, int), public.rh_start_game(text, uuid, text),
  public.rh_complete_task(uuid), public.rh_end_game(text), public.rh_reset_room(text, uuid), public.rh_leave(uuid)
to anon, authenticated;
