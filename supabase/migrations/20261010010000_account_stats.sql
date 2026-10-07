-- Estadísticas de cocina por cuenta: platos servidos, calidad individual por plato y tiempo de juego por modo.
-- stats = { "d": { "<area>:<plato>": { n: servidos, s: suma de puntajes (0-100), s1/s2/s3: veces con 1/2/3 estrellas,
--                                      b: mejor puntaje, f: servidos en cocina libre } },
--           "t": { "<modo>": segundos jugados } }
-- Son contadores acumulados: se combinan con el mayor de cada campo, así reintentos o dos dispositivos no
-- duplican datos. No guardan datos personales; el panel de administración las ve con el secreto de administrador.
alter table public.accounts add column if not exists stats jsonb not null default '{}'::jsonb;

create or replace function public._obj(j jsonb) returns jsonb
language sql immutable set search_path = public
as $$ select case when jsonb_typeof(j) = 'object' then j else '{}'::jsonb end $$;

create or replace function public.merge_stats(a jsonb, b jsonb) returns jsonb
language sql immutable set search_path = public
as $$
  select jsonb_build_object(
    'd', coalesce((
      select jsonb_object_agg(k, jsonb_build_object(
        'n',  least(1000000, greatest(coalesce(public._num(public._obj(public._obj(a) -> 'd') -> k ->> 'n'), 0),  coalesce(public._num(public._obj(public._obj(b) -> 'd') -> k ->> 'n'), 0))),
        's',  least(100000000, greatest(coalesce(public._num(public._obj(public._obj(a) -> 'd') -> k ->> 's'), 0),  coalesce(public._num(public._obj(public._obj(b) -> 'd') -> k ->> 's'), 0))),
        's1', least(1000000, greatest(coalesce(public._num(public._obj(public._obj(a) -> 'd') -> k ->> 's1'), 0), coalesce(public._num(public._obj(public._obj(b) -> 'd') -> k ->> 's1'), 0))),
        's2', least(1000000, greatest(coalesce(public._num(public._obj(public._obj(a) -> 'd') -> k ->> 's2'), 0), coalesce(public._num(public._obj(public._obj(b) -> 'd') -> k ->> 's2'), 0))),
        's3', least(1000000, greatest(coalesce(public._num(public._obj(public._obj(a) -> 'd') -> k ->> 's3'), 0), coalesce(public._num(public._obj(public._obj(b) -> 'd') -> k ->> 's3'), 0))),
        'b',  least(100, greatest(coalesce(public._num(public._obj(public._obj(a) -> 'd') -> k ->> 'b'), 0),  coalesce(public._num(public._obj(public._obj(b) -> 'd') -> k ->> 'b'), 0))),
        'f',  least(1000000, greatest(coalesce(public._num(public._obj(public._obj(a) -> 'd') -> k ->> 'f'), 0),  coalesce(public._num(public._obj(public._obj(b) -> 'd') -> k ->> 'f'), 0)))
      ))
      from (
        select k from jsonb_object_keys(public._obj(public._obj(a) -> 'd') || public._obj(public._obj(b) -> 'd')) as k
        where k ~ '^[a-z0-9_:]{1,40}$' limit 80
      ) x
    ), '{}'::jsonb),
    't', coalesce((
      select jsonb_object_agg(k, least(100000000, greatest(coalesce(public._num(public._obj(public._obj(a) -> 't') ->> k), 0), coalesce(public._num(public._obj(public._obj(b) -> 't') ->> k), 0))))
      from (
        select k from jsonb_object_keys(public._obj(public._obj(a) -> 't') || public._obj(public._obj(b) -> 't')) as k
        where k ~ '^[a-z]{1,10}$' limit 12
      ) y
    ), '{}'::jsonb)
  )
$$;

create or replace function public._account_json(a public.accounts) returns jsonb
language sql stable set search_path = public
as $$
  select jsonb_build_object('id', a.id, 'alias', a.alias, 'avatar', a.avatar, 'contact', a.contact,
    'tips_earned', a.tips_earned, 'upgrades', a.upgrades, 'training', a.training, 'stats', a.stats, 'key_hint', a.key_hint)
$$;

drop function if exists public.save_account(text, text, text, text, integer, jsonb, jsonb);
create or replace function public.save_account(p_token text, p_alias text default null, p_avatar text default null,
  p_contact text default null, p_tips integer default null, p_upgrades jsonb default null, p_training jsonb default null,
  p_stats jsonb default null)
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
    upgrades = public.merge_upgrade_levels(a.upgrades, p_upgrades),
    training = case when p_training is null then a.training else public.merge_training(a.training, p_training) end,
    stats = case when p_stats is null then a.stats else public.merge_stats(a.stats, p_stats) end
  where a.id = v_s.account_id
  returning * into v_acc;
  return jsonb_build_object('ok', true, 'kind', v_s.kind, 'account', public._account_json(v_acc));
end;
$$;

-- Estadísticas de todas las cuentas para el panel de administración (sin contacto ni claves).
create or replace function public.admin_stats(p_secret text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_hash text;
begin
  select value into v_hash from public.admin_config where key = 'admin_secret_hash';
  if v_hash is null or p_secret is null or v_hash <> public.sha256_hex(p_secret) then
    return jsonb_build_object('ok', false, 'error', 'no_autorizado');
  end if;
  return jsonb_build_object('ok', true, 'rows', coalesce((
    select jsonb_agg(jsonb_build_object(
      'alias', a.alias, 'avatar', a.avatar, 'created_at', a.created_at, 'last_login', a.last_login,
      'tips_earned', a.tips_earned, 'stats', a.stats,
      'training_done', (select count(*) from jsonb_each(public._obj(a.training)) e where coalesce(public._num(e.value ->> 'm'), 0) > 0)
    ) order by a.last_login desc)
    from (select * from public.accounts order by last_login desc limit 2000) a
  ), '[]'::jsonb));
end;
$$;

revoke all on function public._obj(jsonb), public.merge_stats(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.save_account(text, text, text, text, integer, jsonb, jsonb, jsonb) from public;
revoke all on function public.admin_stats(text) from public;
grant execute on function public.save_account(text, text, text, text, integer, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.admin_stats(text) to anon, authenticated;
