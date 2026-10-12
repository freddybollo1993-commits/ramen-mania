-- Progreso del juego por cuenta: Recorrido por Japón (restaurantes, Fondo, cajas), nivel de Rash y tutorial completado.
-- game = { "v": 1, "japon": { ... }, "rash": <nivel>, "tut": <true|false> }
-- Se guarda como una instantánea con número de revisión (game_rev): el cliente la combina con lo local (los contadores se suman
-- por diferencia y lo estructural toma el mayor) y la envía con la revisión que conocía; si otra sesión guardó antes, el servidor
-- devuelve la versión actual (conflict) y el cliente vuelve a combinar. Así dos dispositivos de la misma cuenta no se pisan.
-- Funciones aparte de save_account: si esta migración aún no está aplicada, el resto del progreso (propinas, retos, estadísticas) sigue funcionando.
alter table public.accounts add column if not exists game jsonb not null default '{}'::jsonb;
alter table public.accounts add column if not exists game_rev integer not null default 0;

create or replace function public.get_game(p_token text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions; v_acc public.accounts;
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then return jsonb_build_object('ok', false, 'error', 'sesion_vencida'); end if;
  select * into v_acc from public.accounts where id = v_s.account_id;
  return jsonb_build_object('ok', true, 'rev', v_acc.game_rev, 'game', v_acc.game);
end;
$$;

create or replace function public.save_game(p_token text, p_game jsonb, p_base_rev integer default 0)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_s public.account_sessions; v_acc public.accounts; v_n integer;
begin
  v_s := public._session(p_token);
  if v_s.token_hash is null then return jsonb_build_object('ok', false, 'error', 'sesion_vencida'); end if;
  if p_game is null or jsonb_typeof(p_game) <> 'object' or length(p_game::text) > 120000 then
    return jsonb_build_object('ok', false, 'error', 'datos_no_validos');
  end if;
  if coalesce(public._num(p_game ->> 'v'), 0) <> 1
     or coalesce(public._num(p_game -> 'japon' ->> 'lifetime'), 0) > 1000000000
     or coalesce(public._num(p_game -> 'japon' ->> 'spent'), 0) > 1000000000
     or coalesce(public._num(p_game ->> 'rash'), 1) > 100 then
    return jsonb_build_object('ok', false, 'error', 'datos_no_validos');
  end if;
  update public.accounts a set game = p_game, game_rev = a.game_rev + 1
  where a.id = v_s.account_id and a.game_rev = coalesce(p_base_rev, 0)
  returning * into v_acc;
  get diagnostics v_n = row_count;
  if v_n = 0 then
    select * into v_acc from public.accounts where id = v_s.account_id;
    return jsonb_build_object('ok', true, 'conflict', true, 'rev', v_acc.game_rev, 'game', v_acc.game);
  end if;
  return jsonb_build_object('ok', true, 'conflict', false, 'rev', v_acc.game_rev, 'game', v_acc.game);
end;
$$;

revoke all on function public.get_game(text) from public;
revoke all on function public.save_game(text, jsonb, integer) from public;
grant execute on function public.get_game(text) to anon, authenticated;
grant execute on function public.save_game(text, jsonb, integer) to anon, authenticated;
