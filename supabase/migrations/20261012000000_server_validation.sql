-- ==============================================================================
-- Validación en el servidor: récords, alias únicos, ranking PvP y analíticas sobre las cuentas
-- ==============================================================================
-- 1) Alias único (sin distinguir mayúsculas). 'Chef' es el nombre provisional de una cuenta nueva y no se reserva.
-- 2) Récords: ya no se insertan desde el navegador; solo con submit_record (sesión + límites de plausibilidad).
-- 3) Ranking PvP (MMR) guardado en la cuenta, con cambios acotados por partida (reemplaza a la tabla `players`, que no existía).
-- 4) Sesiones de juego (analíticas) por función, sin acceso directo a la tabla.
-- 5) Panel de administración: jugadores y sesiones solo con el secreto de administrador.

-- ---------- 1. Alias único ----------
create unique index if not exists accounts_alias_unique_idx on public.accounts (lower(alias)) where lower(alias) <> 'chef';

create or replace function public.alias_available(p_alias text, p_token text default null) returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v text := trim(coalesce(p_alias, '')); v_s public.account_sessions;
begin
  if char_length(v) < 2 or char_length(v) > 24 then return jsonb_build_object('ok', true, 'available', false, 'reason', 'longitud'); end if;
  if lower(v) = 'chef' then return jsonb_build_object('ok', true, 'available', false, 'reason', 'reservado'); end if;
  if p_token is not null then v_s := public._session(p_token); end if;
  return jsonb_build_object('ok', true, 'available', not exists (
    select 1 from public.accounts a where lower(a.alias) = lower(v) and (v_s.account_id is null or a.id <> v_s.account_id)));
end;
$$;

-- Cuenta nueva del dispositivo: si el alias ya está en uso se le agrega un número.
create or replace function public.auth_device(p_device_id text, p_secret text, p_alias text default null, p_avatar text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_dev public.devices;
  v_acc public.accounts;
  v_key text;
  v_new boolean := false;
  v_tips integer := 0;
  v_up jsonb := '{}'::jsonb;
  v_alias text := coalesce(nullif(left(trim(coalesce(p_alias, '')), 24), ''), 'Chef');
  v_avatar text := coalesce(nullif(left(coalesce(p_avatar, ''), 16), ''), '🍜');
  v_try int := 0;
begin
  if p_device_id is null or length(p_device_id) < 8 or p_secret is null or length(p_secret) < 32 then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;
  select * into v_dev from public.devices where device_id = p_device_id;
  if v_dev.device_id is null then
    select pp.tips_earned, pp.upgrades into v_tips, v_up from public.player_progress pp where pp.device_id = p_device_id;
    v_tips := coalesce(v_tips, 0);
    v_up := coalesce(v_up, '{}'::jsonb);
    v_key := public.gen_access_key();
    while lower(v_alias) <> 'chef' and v_try < 12
          and exists (select 1 from public.accounts a where lower(a.alias) = lower(v_alias)) loop
      v_alias := left(coalesce(nullif(left(trim(coalesce(p_alias, '')), 24), ''), 'Chef'), 18) || '_' || (1000 + floor(random() * 9000))::int;
      v_try := v_try + 1;
    end loop;
    insert into public.accounts (alias, avatar, key_hash, key_hint, tips_earned, upgrades)
    values (v_alias, v_avatar, public.sha256_hex(public.norm_key(v_key)), right(v_key, 4), v_tips, v_up)
    returning * into v_acc;
    insert into public.devices (device_id, secret_hash, account_id)
    values (p_device_id, public.sha256_hex(p_secret), v_acc.id);
    delete from public.player_progress where device_id = p_device_id;
    v_new := true;
  else
    if v_dev.secret_hash <> public.sha256_hex(p_secret) then
      return jsonb_build_object('ok', false, 'error', 'dispositivo_no_valido');
    end if;
    select * into v_acc from public.accounts where id = v_dev.account_id;
    update public.devices set last_seen = now() where device_id = p_device_id;
  end if;
  update public.accounts set last_login = now() where id = v_acc.id;
  return jsonb_build_object('ok', true, 'is_new', v_new, 'new_key', v_key, 'account', public._account_json(v_acc))
    || public._new_session(v_acc.id, p_device_id, 'device');
end;
$$;

-- ---------- 3. Ranking PvP en la cuenta ----------
alter table public.accounts
  add column if not exists mmr integer not null default 1000 check (mmr between 0 and 10000),
  add column if not exists rank_tier text not null default 'Bronce IV',
  add column if not exists pvp_wins integer not null default 0 check (pvp_wins >= 0),
  add column if not exists pvp_losses integer not null default 0 check (pvp_losses >= 0),
  add column if not exists pvp_streak integer not null default 0 check (pvp_streak >= 0),
  add column if not exists highest_mmr integer not null default 1000,
  add column if not exists pvp_updated timestamp with time zone;

create or replace function public._account_json(a public.accounts) returns jsonb
language sql stable set search_path = public
as $$
  select jsonb_build_object('id', a.id, 'alias', a.alias, 'avatar', a.avatar, 'contact', a.contact,
    'tips_earned', a.tips_earned, 'upgrades', a.upgrades, 'training', a.training, 'stats', a.stats, 'key_hint', a.key_hint,
    'pvp', jsonb_build_object('synced', a.pvp_updated is not null, 'mmr', a.mmr, 'rank_tier', a.rank_tier, 'wins', a.pvp_wins,
      'losses', a.pvp_losses, 'streak', a.pvp_streak, 'highest', a.highest_mmr))
$$;

-- Guarda el resultado de una partida competitiva. Cada llamada solo puede mover el MMR unos pocos puntos y sumar
-- como máximo una victoria o una derrota; la primera sincronización de una cuenta adopta lo que ya tenía el dispositivo.
create or replace function public.pvp_sync(p_token text, p_mmr integer, p_rank_tier text, p_wins integer, p_losses integer,
  p_streak integer, p_highest integer) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions; a public.accounts; v_first boolean; v_mmr int; v_w int; v_l int; v_st int; v_tier text;
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then return jsonb_build_object('ok', false, 'error', 'sesion_vencida'); end if;
  if v_s.kind <> 'device' then return jsonb_build_object('ok', false, 'error', 'solo_sesion_del_dispositivo'); end if;
  select * into a from public.accounts where id = v_s.account_id for update;
  v_first := a.pvp_updated is null;
  if not v_first and a.pvp_updated > now() - interval '15 seconds' then
    return jsonb_build_object('ok', true, 'ignored', true, 'account', public._account_json(a));
  end if;
  v_mmr := least(10000, greatest(0, coalesce(p_mmr, a.mmr)));
  v_w := greatest(0, coalesce(p_wins, a.pvp_wins));
  v_l := greatest(0, coalesce(p_losses, a.pvp_losses));
  v_st := least(1000, greatest(0, coalesce(p_streak, 0)));
  if not v_first then
    v_mmr := least(a.mmr + 60, greatest(a.mmr - 60, v_mmr));
    v_w := least(a.pvp_wins + 1, greatest(a.pvp_wins, v_w));
    v_l := least(a.pvp_losses + 1, greatest(a.pvp_losses, v_l));
    v_st := least(a.pvp_streak + 1, v_st);
  else
    v_mmr := least(6000, v_mmr); v_w := least(2000, v_w); v_l := least(2000, v_l);
  end if;
  v_tier := case when coalesce(p_rank_tier, '') ~ '^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9 ]{2,24}$' then p_rank_tier else a.rank_tier end;
  update public.accounts set mmr = v_mmr, rank_tier = v_tier, pvp_wins = v_w, pvp_losses = v_l, pvp_streak = v_st,
    highest_mmr = greatest(highest_mmr, v_mmr), pvp_updated = now()
   where id = a.id returning * into a;
  return jsonb_build_object('ok', true, 'account', public._account_json(a));
end;
$$;

-- Clasificación competitiva pública: sin contacto ni dispositivo.
create or replace function public.pvp_ranking() returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('player_name', t.alias, 'avatar', t.avatar, 'mmr', t.mmr, 'rank_tier', t.rank_tier,
      'pvp_wins', t.pvp_wins, 'pvp_losses', t.pvp_losses, 'pvp_streak', t.pvp_streak)), '[]'::jsonb)
  from (select alias, avatar, mmr, rank_tier, pvp_wins, pvp_losses, pvp_streak from public.accounts
        where pvp_wins + pvp_losses > 0 order by mmr desc, pvp_wins desc limit 50) t
$$;

-- ---------- save_account: alias único ----------
drop function if exists public.save_account(text, text, text, text, integer, jsonb, jsonb, jsonb);
create or replace function public.save_account(p_token text, p_alias text default null, p_avatar text default null,
  p_contact text default null, p_tips integer default null, p_upgrades jsonb default null, p_training jsonb default null,
  p_stats jsonb default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions; v_acc public.accounts; v_alias text := nullif(trim(coalesce(p_alias, '')), '');
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then return jsonb_build_object('ok', false, 'error', 'sesion_vencida'); end if;
  if v_alias is not null and char_length(v_alias) between 2 and 24 and lower(v_alias) <> 'chef'
     and exists (select 1 from public.accounts a where lower(a.alias) = lower(v_alias) and a.id <> v_s.account_id) then
    return jsonb_build_object('ok', false, 'error', 'alias_ocupado');
  end if;
  update public.accounts a set
    alias = case when v_alias is not null and char_length(v_alias) between 2 and 24 then v_alias else a.alias end,
    avatar = case when p_avatar is not null and char_length(p_avatar) between 1 and 16 then p_avatar else a.avatar end,
    contact = case when p_contact is null then a.contact else nullif(left(trim(p_contact), 80), '') end,
    tips_earned = greatest(a.tips_earned, least(greatest(coalesce(p_tips, 0), 0), 1000000)),
    upgrades = public.merge_upgrade_levels(a.upgrades, p_upgrades),
    training = case when p_training is null then a.training else public.merge_training(a.training, p_training) end,
    stats = case when p_stats is null then a.stats else public.merge_stats(a.stats, p_stats) end
  where a.id = v_s.account_id
  returning * into v_acc;
  return jsonb_build_object('ok', true, 'kind', v_s.kind, 'account', public._account_json(v_acc));
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'alias_ocupado');
end;
$$;

-- ---------- 2. Récords validados ----------
-- El nombre y el contacto salen de la cuenta (no del navegador). Un mismo récord reenviado no se duplica.
create or replace function public.submit_record(p_token text, p_mode text, p_money integer, p_served integer, p_level integer,
  p_duration integer default null) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions; a public.accounts; v_max_level int; v_max_money int;
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then return jsonb_build_object('ok', false, 'error', 'sesion_vencida'); end if;
  if p_mode not in ('NORMAL', 'RASH') then return jsonb_build_object('ok', false, 'error', 'modo_invalido'); end if;
  v_max_level := 100;
  v_max_money := 100000;
  if p_mode = 'NORMAL' then v_max_level := 8; v_max_money := 5000; end if;
  if p_money is null or p_served is null or p_level is null
     or p_money < 0 or p_money > v_max_money
     or p_served < 0 or p_served > 1000
     or p_level < 1 or p_level > v_max_level
     or p_money > p_served * 80 + 150
     or (p_duration is not null and (p_duration < 5 or p_duration > 14400 or p_served > p_duration / 2 + 3)) then
    return jsonb_build_object('ok', false, 'error', 'registro_invalido');
  end if;
  select * into a from public.accounts where id = v_s.account_id;
  if exists (select 1 from public.leaderboard l where l.device_id = v_s.device_id and l.player_name = a.alias and l.game_mode = p_mode
              and l.score_money = p_money and l.customers_served = p_served and l.level_reached = p_level
              and l.created_at > now() - interval '10 minutes') then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;
  if (select count(*) from public.leaderboard l where l.device_id = v_s.device_id and l.created_at > now() - interval '1 hour') >= 30 then
    return jsonb_build_object('ok', false, 'error', 'demasiados_registros');
  end if;
  insert into public.leaderboard (player_name, contact, device_id, score_money, customers_served, level_reached, game_mode)
  values (a.alias, a.contact, v_s.device_id, p_money, p_served, p_level, p_mode);
  return jsonb_build_object('ok', true);
end;
$$;

drop policy if exists "Permitir registrar record al terminar partida" on public.leaderboard;
revoke all on public.leaderboard from anon, authenticated;
grant select (id, player_name, score_money, customers_served, level_reached, game_mode, created_at)
  on public.leaderboard to anon, authenticated;

-- ---------- 4. Sesiones de juego ----------
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts (id) on delete set null,
  device_id text,
  player_name text,
  game_mode text not null default 'NORMAL',
  level_number integer not null default 1,
  duration_seconds integer not null default 0,
  customers_served integer not null default 0,
  customers_lost integer not null default 0,
  failed_recipes jsonb not null default '[]'::jsonb,
  outcome text not null default 'COMPLETED',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);
create index if not exists game_sessions_created_idx on public.game_sessions (created_at desc);
alter table public.game_sessions enable row level security;
revoke all on public.game_sessions from anon, authenticated;

create or replace function public.log_session(p_token text, p_mode text, p_level integer, p_duration integer, p_served integer,
  p_lost integer, p_failed jsonb default '[]'::jsonb, p_outcome text default 'COMPLETED') returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions; a public.accounts; v_failed jsonb;
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then return jsonb_build_object('ok', false, 'error', 'sesion_vencida'); end if;
  select * into a from public.accounts where id = v_s.account_id;
  if (select count(*) from public.game_sessions g where g.account_id = a.id and g.created_at > now() - interval '1 hour') >= 120 then
    return jsonb_build_object('ok', false, 'error', 'demasiados_registros');
  end if;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_failed
    from (select left(e, 30) as x from jsonb_array_elements_text(case when jsonb_typeof(p_failed) = 'array' then p_failed else '[]'::jsonb end) e limit 30) f;
  insert into public.game_sessions (account_id, device_id, player_name, game_mode, level_number, duration_seconds, customers_served,
      customers_lost, failed_recipes, outcome)
  values (a.id, v_s.device_id, a.alias,
    case when p_mode in ('NORMAL', 'RASH', 'TRAINING', 'FREE', 'COOP', 'VS', 'TUTORIAL') then p_mode else 'OTRO' end,
    least(200, greatest(0, coalesce(p_level, 1))), least(14400, greatest(0, coalesce(p_duration, 0))),
    least(2000, greatest(0, coalesce(p_served, 0))), least(2000, greatest(0, coalesce(p_lost, 0))), v_failed,
    case when p_outcome in ('WON', 'LOST', 'COMPLETED', 'ABANDONED') then p_outcome else 'COMPLETED' end);
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- 5. Administración ----------
create or replace function public._is_admin(p_secret text) returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select value = public.sha256_hex(p_secret) from public.admin_config where key = 'admin_secret_hash'), false)
         and p_secret is not null
$$;

create or replace function public.admin_check(p_secret text) returns jsonb
language sql stable security definer set search_path = public
as $$ select jsonb_build_object('ok', public._is_admin(p_secret)) $$;

-- Jugadores con contacto y dispositivo (solo administrador), con la misma forma que usaba el panel.
create or replace function public.admin_players(p_secret text) returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public._is_admin(p_secret) then return jsonb_build_object('ok', false, 'error', 'no_autorizado'); end if;
  return jsonb_build_object('ok', true, 'rows', coalesce((
    select jsonb_agg(jsonb_build_object('id', a.id, 'player_name', a.alias, 'avatar', a.avatar, 'contact', a.contact,
      'device_id', (select d.device_id from public.devices d where d.account_id = a.id order by d.last_seen desc limit 1),
      'device_info', 'Dispositivo vinculado', 'created_at', a.created_at, 'last_login', a.last_login, 'mmr', a.mmr,
      'rank_tier', a.rank_tier, 'pvp_wins', a.pvp_wins, 'pvp_losses', a.pvp_losses) order by a.last_login desc)
    from public.accounts a), '[]'::jsonb));
end;
$$;

create or replace function public.admin_sessions(p_secret text, p_limit integer default 500) returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public._is_admin(p_secret) then return jsonb_build_object('ok', false, 'error', 'no_autorizado'); end if;
  return jsonb_build_object('ok', true, 'rows', coalesce((
    select jsonb_agg(to_jsonb(s) - 'account_id') from (
      select * from public.game_sessions order by created_at desc limit least(2000, greatest(1, coalesce(p_limit, 500)))) s), '[]'::jsonb));
end;
$$;

-- ---------- Permisos ----------
revoke all on function public._account_json(public.accounts), public._is_admin(text) from public, anon, authenticated;
revoke all on function public.alias_available(text, text), public.auth_device(text, text, text, text),
  public.pvp_sync(text, integer, text, integer, integer, integer, integer), public.pvp_ranking(),
  public.save_account(text, text, text, text, integer, jsonb, jsonb, jsonb),
  public.submit_record(text, text, integer, integer, integer, integer),
  public.log_session(text, text, integer, integer, integer, integer, jsonb, text),
  public.admin_check(text), public.admin_players(text), public.admin_sessions(text, integer) from public;
grant execute on function public.alias_available(text, text), public.auth_device(text, text, text, text),
  public.pvp_sync(text, integer, text, integer, integer, integer, integer), public.pvp_ranking(),
  public.save_account(text, text, text, text, integer, jsonb, jsonb, jsonb),
  public.submit_record(text, text, integer, integer, integer, integer),
  public.log_session(text, text, integer, integer, integer, integer, jsonb, text),
  public.admin_check(text), public.admin_players(text), public.admin_sessions(text, integer) to anon, authenticated;
