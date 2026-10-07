-- Progreso de la cuenta del jugador: propinas ganadas y mejoras compradas.
-- Tabla nueva y aditiva. NO guarda datos personales (ni alias ni contacto): solo el identificador del
-- dispositivo, un total de propinas que solo crece y los niveles de mejora.
-- La tabla no tiene políticas de acceso directo: solo se lee/escribe con las dos funciones de abajo,
-- que combinan siempre "lo mayor" (tips_earned solo crece, cada mejora solo sube de nivel), así un reintento
-- o un segundo dispositivo nunca devuelven propinas ya gastadas.
create table if not exists public.player_progress (
  device_id text primary key check (length(device_id) >= 8),
  tips_earned integer not null default 0 check (tips_earned >= 0),
  upgrades jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.player_progress enable row level security;
revoke all on public.player_progress from anon, authenticated;

create or replace function public.merge_upgrade_levels(a jsonb, b jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(
    jsonb_object_agg(
      k,
      least(3, greatest(coalesce((a ->> k)::int, 0), coalesce((b ->> k)::int, 0)))
    ),
    '{}'::jsonb
  )
  from jsonb_object_keys(coalesce(a, '{}'::jsonb) || coalesce(b, '{}'::jsonb)) as k
$$;

create or replace function public.get_player_progress(p_device_id text)
returns table (tips_earned integer, upgrades jsonb)
language sql
security definer
set search_path = public
as $$
  select pp.tips_earned, pp.upgrades from public.player_progress pp where pp.device_id = p_device_id
$$;

create or replace function public.save_player_progress(p_device_id text, p_tips integer, p_upgrades jsonb)
returns table (tips_earned integer, upgrades jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_device_id is null or length(p_device_id) < 8 then
    raise exception 'device_id invalido';
  end if;
  insert into public.player_progress as pp (device_id, tips_earned, upgrades)
  values (p_device_id, least(greatest(coalesce(p_tips, 0), 0), 1000000), public.merge_upgrade_levels('{}'::jsonb, p_upgrades))
  on conflict (device_id) do update
    set tips_earned = greatest(pp.tips_earned, excluded.tips_earned),
        upgrades = public.merge_upgrade_levels(pp.upgrades, excluded.upgrades),
        updated_at = timezone('utc'::text, now());
  return query select pp2.tips_earned, pp2.upgrades from public.player_progress pp2 where pp2.device_id = p_device_id;
end;
$$;

revoke all on function public.get_player_progress(text) from public;
revoke all on function public.save_player_progress(text, integer, jsonb) from public;
grant execute on function public.get_player_progress(text) to anon, authenticated;
grant execute on function public.save_player_progress(text, integer, jsonb) to anon, authenticated;
