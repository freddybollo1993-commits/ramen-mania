# Cuentas, sesiones y datos privados

## Modelo
- **Ranking (`leaderboard`)**: el navegador solo puede leer `id, player_name, score_money, customers_served, level_reached, game_mode, created_at`.
  `contact` y `device_id` se pueden escribir (al guardar un récord) pero **no leer**.
- **Cuentas**: tablas `accounts`, `devices`, `account_sessions` y `admin_config` sin acceso directo desde el navegador; solo funciones RPC.
- **Dispositivo**: guarda un secreto aleatorio propio (`ramen_device_secret`); en la base solo queda su huella SHA-256. Entra solo a su cuenta (`auth_device`).
- **Cambio de cuenta**: con la clave única de la cuenta (`auth_key`), validando antes el dispositivo. La sesión es temporal: 15 min sin actividad.
  5 claves falsas seguidas bloquean el dispositivo 15 min. `link_device` deja esa cuenta como la habitual del dispositivo.
- **Clave**: solo se guarda su huella; se muestra una vez al crearla (`rotate_access_key` genera otra y anula la anterior).

## Operación
- Ver contactos/dispositivos del ranking en los paneles de administración: botón **🔑 Datos privados** (pide el secreto de administrador).
- Cambiar el secreto de administrador (SQL Editor de Supabase):
  `update public.admin_config set value = encode(sha256(convert_to('NUEVO_SECRETO','utf8')),'hex') where key = 'admin_secret_hash';`
- Un jugador sin clave ni dispositivo no puede recuperar su cuenta. Desde el panel de Supabase (service role) se puede generar una clave de recuperación:
  `update public.accounts set key_hash = encode(sha256(convert_to('CLAVENUEVA','utf8')),'hex'), key_hint = right('CLAVENUEVA',4) where alias = 'ALIAS';`
  (la clave se escribe sin el prefijo `RAMEN-` ni guiones, en mayúsculas).

## Validación en el servidor (migración 20261012000000)
- **Récords:** el ranking ya no admite inserciones directas. Se envían con `submit_record` (sesión de la cuenta): el nombre y el contacto salen de la cuenta, y se rechazan valores imposibles (dinero/clientes/nivel/duración), duplicados en 10 min y más de 30 envíos por hora. Un tramposo con una sesión válida aún puede enviar cifras *plausibles*; para evitarlo haría falta simular la partida en el servidor.
- **Alias único** (sin distinguir mayúsculas) con índice en `accounts`; `alias_available` lo consulta y `save_account` devuelve `alias_ocupado`. Una cuenta nueva con un alias repetido recibe un sufijo numérico.
- **PvP (MMR)** vive en la cuenta: `pvp_sync` acota el cambio por llamada (±60, +1 victoria/derrota, mínimo 15 s entre llamadas; la primera sincronización adopta lo que ya tenía el dispositivo) y `pvp_ranking` es público sin datos privados. Sigue siendo un MMR informado por el cliente: no hay árbitro del servidor.
- **Analíticas:** `game_sessions` se escribe con `log_session` (≤120/h por cuenta); el panel lee `admin_players` y `admin_sessions`, igual que el dashboard, solo con el secreto de administrador. El panel dentro del juego valida con `admin_check` (ya no hay usuario/clave en el código).
