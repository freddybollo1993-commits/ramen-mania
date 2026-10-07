-- Progreso del Modo Entrenamiento guardado en la cuenta.
-- training = { "<id del reto>": { t: mejor tiempo (s), l: último tiempo (s), m: medalla 0-3, n: veces completado, paid: propinas ya cobradas } }
-- Se combina con "lo mejor" de cada campo (menor tiempo, mayor medalla, mayor cobro) para que ningún
-- reintento ni segundo dispositivo pueda cobrar dos veces ni perder una marca.
alter table public.accounts add column if not exists training jsonb not null default '{}'::jsonb;

create or replace function public._num(t text) returns numeric
language sql immutable set search_path = public
as $$ select case when t ~ '^[0-9]+(\.[0-9]+)?$' then t::numeric end $$;

create or replace function public.merge_training(a jsonb, b jsonb) returns jsonb
language sql immutable set search_path = public
as $$
  select coalesce(jsonb_object_agg(k, jsonb_build_object(
      't', case when ta is null then tb when tb is null then ta else least(ta, tb) end,
      'l', case when coalesce(nb, 0) > coalesce(na, 0) then lb else la end,
      'm', least(3, greatest(coalesce(ma, 0), coalesce(mb, 0))),
      'n', least(100000, greatest(coalesce(na, 0), coalesce(nb, 0))),
      'paid', least(100000, greatest(coalesce(pa, 0), coalesce(pb, 0)))
  )), '{}'::jsonb)
  from (
    select k,
      least(36000, public._num(a -> k ->> 't')) as ta, least(36000, public._num(b -> k ->> 't')) as tb,
      least(36000, public._num(a -> k ->> 'l')) as la, least(36000, public._num(b -> k ->> 'l')) as lb,
      public._num(a -> k ->> 'm') as ma, public._num(b -> k ->> 'm') as mb,
      public._num(a -> k ->> 'n') as na, public._num(b -> k ->> 'n') as nb,
      public._num(a -> k ->> 'paid') as pa, public._num(b -> k ->> 'paid') as pb
    from jsonb_object_keys(coalesce(a, '{}'::jsonb) || coalesce(b, '{}'::jsonb)) as k
    where k ~ '^[a-z0-9_]{1,12}$'
    limit 80
  ) x
$$;

create or replace function public._account_json(a public.accounts) returns jsonb
language sql stable set search_path = public
as $$
  select jsonb_build_object('id', a.id, 'alias', a.alias, 'avatar', a.avatar, 'contact', a.contact,
    'tips_earned', a.tips_earned, 'upgrades', a.upgrades, 'training', a.training, 'key_hint', a.key_hint)
$$;

drop function if exists public.save_account(text, text, text, text, integer, jsonb);
create or replace function public.save_account(p_token text, p_alias text default null, p_avatar text default null,
  p_contact text default null, p_tips integer default null, p_upgrades jsonb default null, p_training jsonb default null)
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
    training = case when p_training is null then a.training else public.merge_training(a.training, p_training) end
  where a.id = v_s.account_id
  returning * into v_acc;
  return jsonb_build_object('ok', true, 'kind', v_s.kind, 'account', public._account_json(v_acc));
end;
$$;

revoke all on function public._num(text), public.merge_training(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.save_account(text, text, text, text, integer, jsonb, jsonb) from public;
grant execute on function public.save_account(text, text, text, text, integer, jsonb, jsonb) to anon, authenticated;
