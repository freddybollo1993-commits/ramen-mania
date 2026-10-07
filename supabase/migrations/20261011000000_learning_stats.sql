-- Datos para medir el aprendizaje de los jugadores.
-- stats ahora incluye:
--   d[plato].e / .ne : suma y cantidad (hasta 5) de los puntajes de los PRIMEROS servicios del plato
--                      (comparados con el resto, miden cuánto mejora el jugador en ese plato)
--   h[YYYY-MM-DD]    : historial diario { t: segundos, n: platos, s: suma de puntajes, s3: platos de 3 estrellas,
--                      er: errores de orden en ramen, bu: quemados/carbonizados, cr: crudos, rj: rechazados,
--                      lc: clientes perdidos, g: partidas iniciadas }
-- training[reto].f : tiempo de la primera vez que se completó (para medir la mejora entre el primer intento y el mejor)
-- Todos son contadores que solo crecen; se combinan con el mayor de cada campo (ver merge_stats/merge_training).

-- Tope que respeta el NULL (en Postgres least(x, NULL) devuelve x, lo que inventaría un tiempo donde no hay dato).
create or replace function public._cap(v numeric, lim numeric) returns numeric
language sql immutable set search_path = public
as $$ select case when v is null then null else least(lim, v) end $$;

create or replace function public._gm(a jsonb, b jsonb, k text, lim numeric) returns numeric
language sql immutable set search_path = public
as $$
  select least(lim, greatest(coalesce(public._num(public._obj(a) ->> k), 0), coalesce(public._num(public._obj(b) ->> k), 0)))
$$;

create or replace function public.merge_stats(a jsonb, b jsonb) returns jsonb
language plpgsql immutable set search_path = public
as $$
declare
  da jsonb := public._obj(public._obj(a) -> 'd'); db jsonb := public._obj(public._obj(b) -> 'd');
  ta jsonb := public._obj(public._obj(a) -> 't'); tb jsonb := public._obj(public._obj(b) -> 't');
  ha jsonb := public._obj(public._obj(a) -> 'h'); hb jsonb := public._obj(public._obj(b) -> 'h');
  out_d jsonb; out_t jsonb; out_h jsonb;
begin
  select coalesce(jsonb_object_agg(k, jsonb_build_object(
      'n',  public._gm(da -> k, db -> k, 'n', 1000000),
      's',  public._gm(da -> k, db -> k, 's', 100000000),
      's1', public._gm(da -> k, db -> k, 's1', 1000000),
      's2', public._gm(da -> k, db -> k, 's2', 1000000),
      's3', public._gm(da -> k, db -> k, 's3', 1000000),
      'b',  public._gm(da -> k, db -> k, 'b', 100),
      'f',  public._gm(da -> k, db -> k, 'f', 1000000),
      'e',  public._gm(da -> k, db -> k, 'e', 500),
      'ne', public._gm(da -> k, db -> k, 'ne', 5)
    )), '{}'::jsonb) into out_d
  from (select k from jsonb_object_keys(da || db) as k where k ~ '^[a-z0-9_:]{1,40}$' limit 80) x;

  select coalesce(jsonb_object_agg(k, public._gm(ta, tb, k, 100000000)), '{}'::jsonb) into out_t
  from (select k from jsonb_object_keys(ta || tb) as k where k ~ '^[a-z]{1,10}$' limit 12) y;

  select coalesce(jsonb_object_agg(k, jsonb_build_object(
      't',  public._gm(ha -> k, hb -> k, 't', 86400),
      'n',  public._gm(ha -> k, hb -> k, 'n', 100000),
      's',  public._gm(ha -> k, hb -> k, 's', 10000000),
      's3', public._gm(ha -> k, hb -> k, 's3', 100000),
      'er', public._gm(ha -> k, hb -> k, 'er', 100000),
      'bu', public._gm(ha -> k, hb -> k, 'bu', 100000),
      'cr', public._gm(ha -> k, hb -> k, 'cr', 100000),
      'rj', public._gm(ha -> k, hb -> k, 'rj', 100000),
      'lc', public._gm(ha -> k, hb -> k, 'lc', 100000),
      'g',  public._gm(ha -> k, hb -> k, 'g', 100000)
    )), '{}'::jsonb) into out_h
  from (select k from jsonb_object_keys(ha || hb) as k where k ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' order by k desc limit 90) z;

  return jsonb_build_object('d', out_d, 't', out_t, 'h', out_h);
end;
$$;

create or replace function public.merge_training(a jsonb, b jsonb) returns jsonb
language sql immutable set search_path = public
as $$
  select coalesce(jsonb_object_agg(k, jsonb_build_object(
      't', case when ta is null then tb when tb is null then ta else least(ta, tb) end,
      'f', case when fa is null then fb when fb is null then fa else least(fa, fb) end,
      'l', case when coalesce(nb, 0) > coalesce(na, 0) then lb else la end,
      'm', least(3, greatest(coalesce(ma, 0), coalesce(mb, 0))),
      'n', least(100000, greatest(coalesce(na, 0), coalesce(nb, 0))),
      'paid', least(100000, greatest(coalesce(pa, 0), coalesce(pb, 0)))
  )), '{}'::jsonb)
  from (
    select k,
      public._cap(public._num(a -> k ->> 't'), 36000) as ta, public._cap(public._num(b -> k ->> 't'), 36000) as tb,
      public._cap(public._num(a -> k ->> 'f'), 36000) as fa, public._cap(public._num(b -> k ->> 'f'), 36000) as fb,
      public._cap(public._num(a -> k ->> 'l'), 36000) as la, public._cap(public._num(b -> k ->> 'l'), 36000) as lb,
      public._num(a -> k ->> 'm') as ma, public._num(b -> k ->> 'm') as mb,
      public._num(a -> k ->> 'n') as na, public._num(b -> k ->> 'n') as nb,
      public._num(a -> k ->> 'paid') as pa, public._num(b -> k ->> 'paid') as pb
    from jsonb_object_keys(coalesce(a, '{}'::jsonb) || coalesce(b, '{}'::jsonb)) as k
    where k ~ '^[a-z0-9_]{1,12}$'
    limit 80
  ) x
$$;

-- El panel de administración también recibe el progreso del entrenamiento (sin contactos ni claves).
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
      'tips_earned', a.tips_earned, 'stats', a.stats, 'training', public._obj(a.training),
      'training_done', (select count(*) from jsonb_each(public._obj(a.training)) e where coalesce(public._num(e.value ->> 'm'), 0) > 0)
    ) order by a.last_login desc)
    from (select * from public.accounts order by last_login desc limit 2000) a
  ), '[]'::jsonb));
end;
$$;

revoke all on function public._gm(jsonb, jsonb, text, numeric), public._cap(numeric, numeric) from public, anon, authenticated;
revoke all on function public.merge_stats(jsonb, jsonb), public.merge_training(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.admin_stats(text) from public;
grant execute on function public.admin_stats(text) to anon, authenticated;
