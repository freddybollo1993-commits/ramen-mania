-- ==============================================================================
-- ESQUEMA DE BASE DE DATOS PARA RAMEN MANIA: JUGADORES, DISPOSITIVOS, RANKING Y ANALÍTICAS
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (supabase.com)
-- ==============================================================================

-- 1. Crear tabla de jugadores vinculados por dispositivo (Anti-duplicación)
create table if not exists public.players (
  id uuid default gen_random_uuid() primary key,
  device_id text unique not null,
  device_fingerprint text,
  device_info text,
  player_name text not null,
  contact text,
  avatar text default '🍜',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Crear tabla de récords y leaderboard
create table if not exists public.leaderboard (
  id uuid default gen_random_uuid() primary key,
  player_name text not null,
  contact text, -- WhatsApp o correo electrónico para coordinar el premio
  device_id text, -- Identificador de dispositivo del jugador
  score_money integer not null default 0,
  customers_served integer not null default 0,
  level_reached integer not null default 1,
  game_mode text not null default 'NORMAL', -- 'NORMAL' o 'RASH'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Si la tabla leaderboard ya existía sin device_id, agregar la columna
alter table public.leaderboard add column if not exists device_id text;

-- 3. Crear tabla de sesiones y analíticas de juego para monitoreo
create table if not exists public.game_sessions (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  player_name text not null,
  game_mode text not null default 'NORMAL', -- 'NORMAL' o 'RASH'
  level_number integer not null default 1,
  duration_seconds integer not null default 0,
  customers_served integer not null default 0,
  customers_lost integer not null default 0,
  failed_recipes jsonb default '[]'::jsonb, -- array de nombres de ramen que fallaron en la partida
  outcome text default 'COMPLETED', -- 'WON', 'LOST', 'ABANDONED', 'IN_PROGRESS'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Índices para acelerar búsquedas y consultas del ranking y analíticas
create index if not exists idx_players_device_id on public.players (device_id);
create index if not exists idx_players_device_fingerprint on public.players (device_fingerprint);
create index if not exists idx_leaderboard_normal on public.leaderboard (game_mode, score_money desc);
create index if not exists idx_leaderboard_rash on public.leaderboard (game_mode, level_reached desc, score_money desc);
create index if not exists idx_leaderboard_device on public.leaderboard (device_id);
create index if not exists idx_sessions_player on public.game_sessions (player_name);
create index if not exists idx_sessions_device on public.game_sessions (device_id);
create index if not exists idx_sessions_level on public.game_sessions (game_mode, level_number);
create index if not exists idx_sessions_created on public.game_sessions (created_at desc);

-- 5. Habilitar Seguridad de Nivel de Fila (Row Level Security - RLS)
alter table public.players enable row level security;
alter table public.leaderboard enable row level security;
alter table public.game_sessions enable row level security;

-- 6. Políticas de seguridad para PLAYERS
-- Lectura pública para verificar dispositivos registrados
drop policy if exists "Permitir lectura publica de jugadores" on public.players;
create policy "Permitir lectura publica de jugadores"
on public.players for select
to anon, authenticated
using (true);

-- Registro de nuevo jugador único por dispositivo
drop policy if exists "Permitir registro de jugador por dispositivo" on public.players;
create policy "Permitir registro de jugador por dispositivo"
on public.players for insert
to anon, authenticated
with check (
  length(player_name) >= 2 and length(device_id) >= 8
);

-- Actualización de datos propios (último login, avatar, contacto)
drop policy if exists "Permitir actualizar datos de jugador" on public.players;
create policy "Permitir actualizar datos de jugador"
on public.players for update
to anon, authenticated
using (true)
with check (
  length(player_name) >= 2
);

-- 7. Políticas de seguridad para LEADERBOARD
-- Lectura pública del ranking
drop policy if exists "Permitir lectura publica del ranking" on public.leaderboard;
create policy "Permitir lectura publica del ranking"
on public.leaderboard for select
to anon, authenticated
using (true);

-- Insertar récord al terminar partida
drop policy if exists "Permitir registrar record al terminar partida" on public.leaderboard;
create policy "Permitir registrar record al terminar partida"
on public.leaderboard for insert
to anon, authenticated
with check (
  length(player_name) >= 2 and score_money >= 0
);

-- 8. Políticas de seguridad para GAME_SESSIONS (Analíticas)
-- Lectura pública para el panel de monitoreo
drop policy if exists "Permitir lectura de analiticas" on public.game_sessions;
create policy "Permitir lectura de analiticas"
on public.game_sessions for select
to anon, authenticated
using (true);

-- Insertar sesiones de telemetría de juego
drop policy if exists "Permitir registro de sesiones" on public.game_sessions;
create policy "Permitir registro de sesiones"
on public.game_sessions for insert
to anon, authenticated
with check (
  length(player_name) >= 1
);
