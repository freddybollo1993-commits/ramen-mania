-- Retos como subniveles de la Campaña: cada reto guarda las estrellas de calidad (s, 0 a 3) además de tiempo, medalla y propinas.
-- La fusión conserva el mayor valor de s; el resto de campos queda igual.
create or replace function public.merge_training(a jsonb, b jsonb)
 returns jsonb
 language sql
 immutable
 set search_path to 'public'
as $function$
  select coalesce(jsonb_object_agg(k, jsonb_build_object(
      't', case when ta is null then tb when tb is null then ta else least(ta, tb) end,
      'f', case when fa is null then fb when fb is null then fa else least(fa, fb) end,
      'l', case when coalesce(nb, 0) > coalesce(na, 0) then lb else la end,
      'm', least(3, greatest(coalesce(ma, 0), coalesce(mb, 0))),
      'n', least(100000, greatest(coalesce(na, 0), coalesce(nb, 0))),
      'paid', least(100000, greatest(coalesce(pa, 0), coalesce(pb, 0)))
  ) || case when greatest(coalesce(sa, 0), coalesce(sb, 0)) > 0
            then jsonb_build_object('s', least(3, greatest(coalesce(sa, 0), coalesce(sb, 0)))) else '{}'::jsonb end), '{}'::jsonb)
  from (
    select k,
      public._cap(public._num(a -> k ->> 't'), 36000) as ta, public._cap(public._num(b -> k ->> 't'), 36000) as tb,
      nullif(public._cap(public._num(a -> k ->> 'f'), 36000), 0) as fa, nullif(public._cap(public._num(b -> k ->> 'f'), 36000), 0) as fb,
      public._cap(public._num(a -> k ->> 'l'), 36000) as la, public._cap(public._num(b -> k ->> 'l'), 36000) as lb,
      public._num(a -> k ->> 'm') as ma, public._num(b -> k ->> 'm') as mb,
      public._num(a -> k ->> 'n') as na, public._num(b -> k ->> 'n') as nb,
      public._num(a -> k ->> 'paid') as pa, public._num(b -> k ->> 'paid') as pb,
      public._num(a -> k ->> 's') as sa, public._num(b -> k ->> 's') as sb
    from jsonb_object_keys(coalesce(a, '{}'::jsonb) || coalesce(b, '{}'::jsonb)) as k
    where k ~ '^[a-z0-9_]{1,12}$'
    limit 80
  ) x
$function$;
