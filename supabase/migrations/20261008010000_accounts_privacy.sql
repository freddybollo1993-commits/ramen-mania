-- ==============================================================================
-- Privacidad del ranking + cuentas con inicio de sesión por dispositivo y clave
-- ==============================================================================
-- 1) Ranking: el contacto (WhatsApp / correo) y el identificador de dispositivo dejan de ser públicos.
--    Se agrega la columna device_id que el juego ya enviaba (sin ella los récords no se guardaban).
-- 2) Cuentas: cada dispositivo guarda un secreto propio (solo su huella queda en la base) y entra solo.
--    Para cambiar de cuenta se usa una clave única de la cuenta; esa sesión es temporal y caduca por
--    inactividad. Todo se hace con funciones: las tablas no tienen acceso directo para anon/authenticated.
-- Es aditivo: no borra ni modifica filas existentes.

-- ---------- 1. Ranking ----------
alter table public.leaderboard add column if not exists device_id text;
revoke select on public.leaderboard from anon, authenticated;
grant select (id, player_name, score_money, customers_served, level_reached, game_mode, created_at)
  on public.leaderboard to anon, authenticated;

-- ---------- 2. Utilidades internas (sin acceso desde el cliente) ----------
create or replace function public.sha256_hex(t text) returns text
language sql immutable set search_path = public
as $$ select encode(sha256(convert_to(coalesce(t, ''), 'utf8')), 'hex') $$;

create or replace function public.rand_token() returns text
language sql volatile set search_path = public
as $$ select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') $$;

create or replace function public.gen_access_key() returns text
language sql volatile set search_path = public
as $$
  with h as (select upper(replace(gen_random_uuid()::text, '-', '')) as x)
  select 'RAMEN-' || substr(x, 1, 4) || '-' || substr(x, 5, 4) || '-' || substr(x, 9, 4) || '-' || substr(x, 13, 4) from h
$$;

create or replace function public.norm_key(k text) returns text
language sql immutable set search_path = public
as $$ select regexp_replace(regexp_replace(upper(coalesce(k, '')), '[^A-Z0-9]', '', 'g'), '^RAMEN', '') $$;

-- ---------- 3. Tablas (sin políticas: solo se accede mediante las funciones) ----------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  alias text not null default 'Chef',
  avatar text not null default '🍜',
  contact text,
  key_hash text not null,
  key_hint text,
  tips_earned integer not null default 0 check (tips_earned >= 0),
  upgrades jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  last_login timestamp with time zone not null default timezone('utc'::text, now())
);
create unique index if not exists accounts_key_hash_idx on public.accounts (key_hash);

create table if not exists public.devices (
  device_id text primary key check (length(device_id) >= 8),
  secret_hash text not null,
  account_id uuid not null references public.accounts (id) on delete cascade,
  key_failures integer not null default 0,
  locked_until timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  last_seen timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.account_sessions (
  token_hash text primary key,
  account_id uuid not null references public.accounts (id) on delete cascade,
  device_id text not null,
  kind text not null check (kind in ('device', 'key')),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  last_activity timestamp with time zone not null default timezone('utc'::text, now()),
  expires_at timestamp with time zone not null
);
create index if not exists account_sessions_exp_idx on public.account_sessions (expires_at);

create table if not exists public.admin_config (
  key text primary key,
  value text not null
);
insert into public.admin_config (key, value)
values ('admin_secret_hash', 'aa8f3f12619d33f08f9393e218d1bd3ccffd1cb56c4801bd6a6a0fe969f544aa')
on conflict (key) do nothing;

alter table public.accounts enable row level security;
alter table public.devices enable row level security;
alter table public.account_sessions enable row level security;
alter table public.admin_config enable row level security;
revoke all on public.accounts, public.devices, public.account_sessions, public.admin_config from anon, authenticated;

-- ---------- 4. Funciones ----------
create or replace function public._account_json(a public.accounts) returns jsonb
language sql stable set search_path = public
as $$
  select jsonb_build_object('id', a.id, 'alias', a.alias, 'avatar', a.avatar, 'contact', a.contact,
    'tips_earned', a.tips_earned, 'upgrades', a.upgrades, 'key_hint', a.key_hint)
$$;

create or replace function public._session(p_token text) returns public.account_sessions
language sql stable security definer set search_path = public
as $$
  select s.* from public.account_sessions s
  where s.token_hash = public.sha256_hex(p_token) and s.expires_at > now()
$$;

create or replace function public._new_session(p_account uuid, p_device text, p_kind text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_token text := public.rand_token();
  v_exp timestamp with time zone := now() + (case when p_kind = 'device' then interval '30 minutes' else interval '15 minutes' end);
begin
  delete from public.account_sessions where expires_at < now();
  insert into public.account_sessions (token_hash, account_id, device_id, kind, expires_at)
  values (public.sha256_hex(v_token), p_account, p_device, p_kind, v_exp);
  return jsonb_build_object('token', v_token, 'kind', p_kind, 'expires_at', v_exp);
end;
$$;

-- Entrada automática del dispositivo. Si el dispositivo es nuevo se crea su cuenta y se devuelve su clave (solo esta vez).
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
begin
  if p_device_id is null or length(p_device_id) < 8 or p_secret is null or length(p_secret) < 32 then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;
  select * into v_dev from public.devices where device_id = p_device_id;
  if v_dev.device_id is null then
    -- progreso guardado por la versión anterior de la tienda (se adopta una sola vez)
    select pp.tips_earned, pp.upgrades into v_tips, v_up from public.player_progress pp where pp.device_id = p_device_id;
    v_tips := coalesce(v_tips, 0);
    v_up := coalesce(v_up, '{}'::jsonb);
    v_key := public.gen_access_key();
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

-- Cambio de cuenta con la clave única. Primero se valida el dispositivo; los intentos fallidos se limitan.
create or replace function public.auth_key(p_device_id text, p_secret text, p_key text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_dev public.devices;
  v_acc public.accounts;
begin
  select * into v_dev from public.devices where device_id = p_device_id;
  if v_dev.device_id is null or v_dev.secret_hash <> public.sha256_hex(p_secret) then
    return jsonb_build_object('ok', false, 'error', 'dispositivo_no_valido');
  end if;
  if v_dev.locked_until is not null and v_dev.locked_until > now() then
    return jsonb_build_object('ok', false, 'error', 'bloqueado',
      'retry_in_seconds', ceil(extract(epoch from (v_dev.locked_until - now())))::int);
  end if;
  select * into v_acc from public.accounts where key_hash = public.sha256_hex(public.norm_key(p_key));
  if v_acc.id is null then
    update public.devices
       set key_failures = case when key_failures + 1 >= 5 then 0 else key_failures + 1 end,
           locked_until = case when key_failures + 1 >= 5 then now() + interval '15 minutes' else locked_until end
     where device_id = p_device_id;
    return jsonb_build_object('ok', false, 'error', 'clave_no_valida', 'remaining', greatest(0, 4 - v_dev.key_failures));
  end if;
  update public.devices set key_failures = 0, locked_until = null, last_seen = now() where device_id = p_device_id;
  update public.accounts set last_login = now() where id = v_acc.id;
  return jsonb_build_object('ok', true, 'account', public._account_json(v_acc))
    || public._new_session(v_acc.id, p_device_id, 'key');
end;
$$;

-- Mantiene viva la sesión mientras hay actividad (se renueva la caducidad).
create or replace function public.touch_session(p_token text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions;
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then
    return jsonb_build_object('ok', false);
  end if;
  update public.account_sessions
     set last_activity = now(),
         expires_at = now() + (case when kind = 'device' then interval '30 minutes' else interval '15 minutes' end)
   where token_hash = v_s.token_hash;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.end_session(p_token text) returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.account_sessions where token_hash = public.sha256_hex(p_token);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.get_account(p_token text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions; v_acc public.accounts;
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then return jsonb_build_object('ok', false, 'error', 'sesion_vencida'); end if;
  select * into v_acc from public.accounts where id = v_s.account_id;
  return jsonb_build_object('ok', true, 'kind', v_s.kind, 'account', public._account_json(v_acc));
end;
$$;

-- Guarda perfil y progreso. Propinas y mejoras solo suben (se combina con "lo mayor").
create or replace function public.save_account(p_token text, p_alias text default null, p_avatar text default null,
  p_contact text default null, p_tips integer default null, p_upgrades jsonb default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions; v_acc public.accounts;
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then return jsonb_build_object('ok', false, 'error', 'sesion_vencida'); end if;
  update public.accounts a set
    alias = case when p_alias is not null and char_length(trim(p_alias)) between 2 and 24 then trim(p_alias) else a.alias end,
    avatar = case when p_avatar is not null and char_length(p_avatar) between 1 and 16 then p_avatar else a.avatar end,
    contact = case when p_contact is null then a.contact else nullif(left(trim(p_contact), 80), '') end,
    tips_earned = greatest(a.tips_earned, least(greatest(coalesce(p_tips, 0), 0), 1000000)),
    upgrades = public.merge_upgrade_levels(a.upgrades, p_upgrades)
  where a.id = v_s.account_id
  returning * into v_acc;
  return jsonb_build_object('ok', true, 'kind', v_s.kind, 'account', public._account_json(v_acc));
end;
$$;

-- Genera una clave nueva (la anterior deja de servir). Solo desde la sesión del propio dispositivo.
create or replace function public.rotate_access_key(p_token text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions; v_key text;
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then return jsonb_build_object('ok', false, 'error', 'sesion_vencida'); end if;
  if v_s.kind <> 'device' then return jsonb_build_object('ok', false, 'error', 'solo_sesion_del_dispositivo'); end if;
  v_key := public.gen_access_key();
  update public.accounts set key_hash = public.sha256_hex(public.norm_key(v_key)), key_hint = right(v_key, 4)
   where id = v_s.account_id;
  delete from public.account_sessions where account_id = v_s.account_id and kind = 'key';
  return jsonb_build_object('ok', true, 'key', v_key);
end;
$$;

-- Después de entrar con una clave: deja esta cuenta como la cuenta habitual del dispositivo.
create or replace function public.link_device(p_token text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions; v_acc public.accounts;
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then return jsonb_build_object('ok', false, 'error', 'sesion_vencida'); end if;
  if v_s.kind <> 'key' then return jsonb_build_object('ok', false, 'error', 'requiere_clave'); end if;
  update public.devices set account_id = v_s.account_id where device_id = v_s.device_id;
  select * into v_acc from public.accounts where id = v_s.account_id;
  delete from public.account_sessions where token_hash = v_s.token_hash;
  return jsonb_build_object('ok', true, 'account', public._account_json(v_acc)) || public._new_session(v_s.account_id, v_s.device_id, 'device');
end;
$$;

-- Datos privados del ranking (contacto y dispositivo) solo con el secreto de administrador.
create or replace function public.admin_private_leaderboard(p_secret text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_hash text;
begin
  select value into v_hash from public.admin_config where key = 'admin_secret_hash';
  if v_hash is null or p_secret is null or v_hash <> public.sha256_hex(p_secret) then
    return jsonb_build_object('ok', false, 'error', 'no_autorizado');
  end if;
  return jsonb_build_object('ok', true, 'rows',
    (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'contact', l.contact, 'device_id', l.device_id)), '[]'::jsonb)
       from public.leaderboard l));
end;
$$;

-- ---------- 5. Permisos ----------
-- Se retira la lectura/escritura por device_id sin credencial de la versión anterior.
drop function if exists public.get_player_progress(text);
drop function if exists public.save_player_progress(text, integer, jsonb);

revoke all on function public.sha256_hex(text), public.rand_token(), public.gen_access_key(), public.norm_key(text) from public, anon, authenticated;
revoke all on function public._account_json(public.accounts), public._session(text), public._new_session(uuid, text, text) from public, anon, authenticated;
revoke all on function public.merge_upgrade_levels(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.auth_device(text, text, text, text), public.auth_key(text, text, text),
  public.touch_session(text), public.end_session(text), public.get_account(text),
  public.save_account(text, text, text, text, integer, jsonb), public.rotate_access_key(text),
  public.link_device(text), public.admin_private_leaderboard(text) from public;
grant execute on function public.auth_device(text, text, text, text), public.auth_key(text, text, text),
  public.touch_session(text), public.end_session(text), public.get_account(text),
  public.save_account(text, text, text, text, integer, jsonb), public.rotate_access_key(text),
  public.link_device(text), public.admin_private_leaderboard(text) to anon, authenticated;
