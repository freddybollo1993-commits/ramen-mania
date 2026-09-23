# 🍜 Ramen Mania Arcade - Conexión Supabase & Vercel

Juego arcade de cocina japonesa con sistema de ranking y tabla de líderes en tiempo real impulsado por **Supabase**, alojado en **GitHub** y desplegado en **Vercel**.

---

## 📁 Archivos del Proyecto

- `index.html`: El juego completo con la interfaz gráfica arcade, el cliente de Supabase, el botón de **🏆 Récords** y el formulario de registro de puntajes.
- `supabase_schema.sql`: Script SQL con la estructura de la tabla `leaderboard`, índices de ordenamiento y políticas de seguridad RLS.

---

## 🚀 Pasos para Conectar y Publicar

### 1. En Supabase:
1. Entra a tu panel en [supabase.com/dashboard](https://supabase.com/dashboard).
2. Crea un nuevo proyecto (ejemplo: `ramen-mania`).
3. Ve a la pestaña **SQL Editor**, copia y pega el contenido de `supabase_schema.sql` y presiona **Run**.
4. Ve a **Project Settings** > **API Keys**:
   - Copia tu **Project URL**.
   - Copia tu **anon public key**.
5. Abre `index.html` y colócalas en las líneas 485-486:
   ```javascript
   const SUPABASE_CONFIG = {
     url: "https://tu-proyecto.supabase.co",
     anonKey: "tu-anon-public-key"
   };
   ```

---

### 2. En GitHub (desde tu consola):
```cmd
cd C:\Users\dell\.gemini\antigravity\scratch\ramen-mania
git init
git add .
git commit -m "feat: Lanzamiento de Ramen Mania con ranking en Supabase"
gh repo create ramen-mania --public --source=. --remote=origin --push
```

---

### 3. En Vercel (para publicar el juego online):
```cmd
vercel --prod
```
Responde **Yes** a las preguntas interactivas y obtendrás tu enlace público (por ejemplo: `https://ramen-mania.vercel.app`) para compartir con los jugadores.
