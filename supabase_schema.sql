-- ==============================================================================
-- ESQUEMA DE BASE DE DATOS PARA RAMEN MANIA: RANKING Y PREMIACIÓN
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (supabase.com)
-- ==============================================================================

-- 1. Crear tabla de récords
create table if not exists public.leaderboard (
  id uuid default gen_random_uuid() primary key,
  player_name text not null,
  contact text, -- WhatsApp o correo electrónico para coordinar el premio
  score_money integer not null default 0,
  customers_served integer not null default 0,
  level_reached integer not null default 1,
  game_mode text not null default 'NORMAL', -- 'NORMAL' o 'RASH'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Índices para acelerar las consultas de los mejores puntajes
create index if not exists idx_leaderboard_normal on public.leaderboard (game_mode, score_money desc);
create index if not exists idx_leaderboard_rash on public.leaderboard (game_mode, level_reached desc, score_money desc);

-- 3. Habilitar Seguridad de Nivel de Fila (Row Level Security - RLS)
alter table public.leaderboard enable row level security;

-- 4. Política: Cualquier jugador puede leer los mejores puntajes (público)
create policy "Permitir lectura publica del ranking"
on public.leaderboard for select
to anon, authenticated
using (true);

-- 5. Política: Cualquier jugador puede registrar su récord al terminar la partida
create policy "Permitir registrar record al terminar partida"
on public.leaderboard for insert
to anon, authenticated
with check (
  length(player_name) >= 2 and score_money >= 0
);
