# 🍜 Ramen Mania Arcade - Edición Arcade Master

Juego arcade de cocina japonesa en formato horizontal con pantalla de inicio interactiva, selector de modos, ranking en tiempo real en **Supabase** y **sistema de autenticación por huella de hardware del dispositivo (Anti-duplicación de cuentas)**.

---

## ✨ Nuevas Características Implementadas

1. **Pantalla de Inicio (Start / Title Screen):**
   - Logo arcade animado de *Ramen Mania: Edición Arcade Master*.
   - **Botón Hero "▶️ JUGAR AHORA"** con efectos visuales y sonido arcade.
   - **Selector de Modo de Juego:**
     - 🏮 **Modo Normal:** Campaña de 5 niveles por metas de venta.
     - ⚡ **Modo Rash:** Supervivencia frenética de 100 rondas con vidas y velocidad creciente. Muestra el récord actual del jugador.
   - **Tarjeta de Jugador & Estado del Dispositivo:** Detecta automáticamente si el dispositivo ya está registrado o solicita el alias al iniciar.
   - Acceso directo a **🏆 Ranking Oficial**, **📖 Recetario**, **👤 Mi Perfil / Dispositivo** y **⛶ Pantalla Completa**.
   - Botón **🏠 Inicio** en el header del juego para pausar y volver al menú principal en cualquier momento.

2. **Vinculación con Datos del Dispositivo & Anti-Duplicados:**
   - Generación de **Huella Digital de Hardware Criptográfica** a partir de parámetros del dispositivo (User Agent, pantalla, CPU concurrency, memoria, GPU WebGL Renderer y Canvas).
   - Token persistente respaldado en `localStorage`, `sessionStorage` y `document.cookie`.
   - **Regla Estricta Anti-Duplicados:** Cada dispositivo solo puede vincular un único alias. Si se intenta crear otra cuenta desde el mismo equipo, el sistema bloquea el duplicado y recupera la cuenta original.
   - Al volver a entrar al juego desde el mismo dispositivo, el jugador es reconocido automáticamente sin necesidad de volver a registrarse.
   - En el envío de puntuaciones al Leaderboard, el puntaje se asocia al `device_id` y al alias registrado para garantizar la autenticidad del torneo.

---

## 📁 Archivos del Proyecto

- `index.html`: Código fuente del juego completo con la pantalla de inicio, `DeviceManager`, modales de registro/perfil y conexión con Supabase.
- `supabase_schema.sql`: Script SQL con la estructura de las tablas `players` (cuentas por dispositivo) y `leaderboard` (clasificación), con índices y políticas de seguridad RLS.

---

## 🚀 Pasos para Conectar a Supabase

1. Entra a tu panel en [supabase.com/dashboard](https://supabase.com/dashboard).
2. Ve a la pestaña **SQL Editor**, copia y pega el contenido de [`supabase_schema.sql`](file:///c:/Users/dell/juego-ramen/supabase_schema.sql) y presiona **Run**.
3. En [`index.html`](file:///c:/Users/dell/juego-ramen/index.html), configura las variables de conexión si utilizas un nuevo proyecto:
   ```javascript
   const SUPABASE_CONFIG = {
     url: "https://tu-proyecto.supabase.co",
     anonKey: "tu-anon-public-key"
   };
   ```
