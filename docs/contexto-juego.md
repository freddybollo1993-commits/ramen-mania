# Ramen Mania / Shimaya — Archivo de contexto del juego (estado v137)

Documento para retomar el proyecto desde cero: qué es, cómo está construido, qué contiene cada sistema, decisiones del dueño del proyecto y cosas pendientes. Idioma del juego y de la comunicación: **español**.

---

## 1. Qué es
Juego web de cocina japonesa (ramen, salteados, makis y frituras) en **horizontal**, pensado para móvil (instalado como PWA; dispositivo de prueba: **Redmi Note 15 Pro+**, pantalla útil ≈ **873×393 px**). Estilo arcade tipo Overcooked / Cook, Serve, Delicious!, con pedagogía de cocina japonesa real: cada proceso (cortar, lavar arroz, empanizar, enrollar, emplatar) se hace con **gestos** y se evalúa con calidad (estrellas).

- **Producción:** https://ramen-mania.vercel.app (Vercel despliega solo al hacer push a `master`).
- **Repositorio:** `C:\Users\dell\juego-ramen`, rama `master`. Cada cambio terminado se commitea y se sube, **subiendo la versión visible y `CACHE_NAME`** del service worker. Mensajes de commit terminan con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- **Servidor local de pruebas:** Vite en el puerto **3100** (`.claude/launch.json`; el 3000 puede ser el proyecto de propinas). Tras cambiar `sw.js` o un `.js` hay que limpiar service workers/cachés o subir el `?v=N` del `<script>`.

## 2. Tecnología y archivos
Sin framework: HTML/CSS/JS clásico (scripts globales, no módulos), Vite solo como servidor de desarrollo. Backend: **Supabase** (RPC + Realtime). PWA con `sw.js` y `manifest.json` (**no** poner `orientation: landscape` en el manifiesto: impedía abrir al primer toque en el Redmi; se usa `any` + bloqueo por JS).

| Archivo | Contenido |
|---|---|
| `index.html` (~25 000 líneas) | Juego completo: HTML, CSS y casi toda la lógica (motor de cocina, recetas, ingredientes, niveles, Rash, Entrenamiento, Cocina Libre, mejoras, cuentas, ranking, modales). Versión visible en `#app-version`. |
| `sw.js` | Service worker, `CACHE_NAME = 'ramen-mania-v137'`. |
| `manifest.json` | PWA. |
| `makis-studio.js` | Estudio de Makis (esterilla, arroz, enrollado, pescado). |
| `frituras-prod.js` / `frituras-plate.js` | Producción (mandolina, licuado, gyozas) y emplatado dibujado de Frituras. |
| `multiplayer.js` | Multijugador 2–4 jugadores sobre Supabase Realtime + ranking MMR. |
| `japon.js` / `japon-scene.js` | Recorrido por Japón (economía idle) y escena isométrica animada de los restaurantes. `japon-scene.js` exporta `window.JPKit` (proyección, personas, cajas, estilos) que reutiliza el inicio. |
| `reconocer.js` | Modo «Ingredientes» (reconocer qué lleva cada plato, sin reloj en contra). |
| `guia.js` | Tutorial guiado interactivo por áreas (4 lecciones, 91 pasos). |
| `inicio.js` / `aula.js` | Pantalla de inicio (hub + local isométrico + menú clásico) y las salas Aula del Maestro y bodega de Secretos. |
| `dashboard.html` | Panel de administración (`/dashboard`, `/admin`). |
| `assets/` | Íconos de ingredientes (`ingredients/v2/*.webp`, 106), SVG de estaciones (wok, olla, esterilla…), fondos, fuentes, íconos PWA. |
| `tools/` | `economia-niveles.cjs` (recalcula metas/tiempos de niveles), generadores de íconos. |
| `supabase/` | `migrations/*.sql` (12), `SEGURIDAD.md`, `config.toml`. |
| `docs/` | `plan-etapas-areas.md`, `plan-recorrido-japon.md`, `plan-inicio-isometrico.md`, `guia-iconos-gemini.md`, este archivo. |

Orden de carga al final de `index.html`: `multiplayer.js`, `makis-studio.js`, `frituras-prod.js`, `frituras-plate.js`, `japon.js`, `reconocer.js`, `guia.js`, `japon-scene.js`, `inicio.js`, `aula.js`.

## 3. Estructura de una partida de cocina
### 3.1 Cuatro áreas
Pestañas de cocina (`KITCHEN_AREAS`): **RAMEN · SALTEADO · FRITURAS · MAKIS**. Cada una tiene un catálogo de platos (`RECETAS_RAMEN`, `AREA_CATALOGS`) y se desbloquea por nivel (Campaña), ronda (Rash) o reto (Entrenamiento) según `AREA_DISH_UNLOCKS` (plato, nivel de campaña, ronda de Rash):

| Área | Platos (35 recetas; 33 jugables) |
|---|---|
| Ramen (9) | Shio, Shoyu, Miso, Chashu, Tonkotsu, Tan tan, Ebi, Bajiru, Vegetariano |
| Salteado (9) | Yakimeshi, Chicken Teriyaki, Chaufa Shimaya, Yakitori, Yakiramen, Yasaitame, Batayaki Ramen, Karameshi, Omuraisu |
| Makis (9) | California, Guacamole, Acevichado, Hotate, Amazon, Yama, Nin Niku, Digion + Maki Furai (existe, aún no se puede pedir: «termina en Frituras») |
| Frituras (8) | Alitas, Kaarage, Tonkatsu, Chicken Katsu, Katsu Kare, Ebi Furai, Age Gyozas + Gyozas al vapor/hervidas (existe, aún no se puede pedir: necesita 2.ª hornilla con sartén) |

### 3.2 Tres etapas por área («etapas», `stagedOn(area)`)
**Producción → Cocina → Emplatar**, en ese orden fijo de pantallas (se cambia deslizando desde el borde).
- **Producción:** existencias de insumos (stock) con tiempo de preparación; una tarea a la vez por área. Taller con tabla + cuchillo + hornillas.
- **Cocina:** la estación propia de cada área (ver 3.3).
- **Emplatar:** **obligatorio**, vale 25 de 100 puntos de calidad. Libre: componentes arrastrables a 2 cuencos; `stPlateEval` compara con la receta más cercana; errores penalizan (×0,45 y máx. 1★). Pase de hasta 3 platos entre cocina y emplatado (el plato se enfría).
- **Activación gradual:** Campaña ramen nivel 4, salteado 5, makis 7, frituras 7; Rash rondas 3/9/16/27; Entrenamiento con features `st_<área>`. No hay etapas en el tutorial antiguo ni en multijugador.
- Motor: `ST_PROD[área]`, `stGet(área)` (stock, pase, slots, tabla), `setKitchenStage/getStage`, `stPassAdd`, `stPassToSlot`, `stPlateAddItem`, `stPlateServe`; tablas `FRY_PLATING`, `ST_RAMEN_PLATE`, `ST_PLATE_SAL`, `ST_PLATE_MAKI`, `SAL_STAGED`.

### 3.3 Cocina de cada área
- **Ramen:** cocina de 4 hornillas (fideos, Shio, 2 sartenes hondas). Caldos con salsa se preparan en sartén (`PAN_RECIPES`): orden caldo→salsa→proteína, calentar, servir al cuenco con fideos. Herramientas en franja (6 botellas de salsa, aceite de ajonjolí, flameador/soplete de chasu, ohashi para repartir fideos manteniendo pulsado). Fuego, reducción y espuma del Tonkotsu. **Multitáctil** (varios dedos a la vez).
- **Salteado:** woks con técnica de «toss» (`wokToss`), punto del salteado, 2 woks (reto), sartén para teriyaki.
- **Makis (`makis-studio.js`):** esterilla → arroz shari (lavar×3, cocer, Zu, enfriar en zigzag) → extender (gestos) → nori → rellenos → enrollar en vista lateral con barra de precisión (3 gestos + apretar) → hasta 3 makis en la tabla → cobertura, flamear, cortar con tajos. Pescado (atún, conchas) con tabla y corte a 90° de las fibras.
- **Frituras:** bifes de pollo/cerdo se empanizan con gestos (harina 3 toques, huevo 2 círculos, panko 3 toques) → aceite → tabla que se expande y se corta con tajos; langostino: empanizar y deslizar 3 veces (6 piezas); alitas/kaarage directo al aceite; salsa kare calentada en sartén y vertida sobre el bife (con kare = Katsu Kare; sin = Tonkatsu); gyozas con pinza de 2 dedos. Emplatado dibujado por plato (col, zanahoria/betarraga, mayonesa, togarashi, etc.).

### 3.4 Gestos reutilizables (preferencia del dueño: gestos antes que toques)
Cortar con tajos (`shopChop`, `fryCutSlash`, `makiCutSlash`), frotar/limpiar (`shopClean`), rallar (`frGrateStroke`), círculos (`CircleTracker`, `makeCircleGesture`), pinza, deslizar, mantener pulsado, arrastrar herramientas.

## 4. Modos de juego (`gameState.gameMode`)
| Modo | Qué es |
|---|---|
| **NORMAL (Campaña)** | 8 niveles con meta de ventas (S/) y tiempo (Nivel 1 «Aprendiz de Barra» … Nivel 8 «Maestro del Ramen»). Hoy **no guarda progreso**: siempre empieza en el nivel 1 (pendiente de confirmar si es intencional). |
| **RASH** | Rondas sin fin con vidas; se guarda la ronda alcanzada (`ramen_mania_rash_level`, sincronizada en la nube); récords al ranking. |
| **TRAINING (Entrenamiento)** | 27 retos sin cuenta regresiva en 6 capítulos (Ramen, Salteado, Makis, Frituras, Servicio completo, Maestría). Se mide el tiempo; medallas 🥉🥈🥇 y propinas; **cada reto desbloquea funciones** (`TRAINING_FEATURES`: segundo/tercer cuenco, estrellas, áreas, woks, etapas, mottainai, frescura…). |
| **FREE (Cocina Libre)** | Práctica sin tiempo ni notas; elegir qué áreas piden al azar, pedir un plato concreto, pausar clientes. Desde el inicio isométrico se puede abrir **solo una área** (`window.startFreeAreas`). |
| **Multijugador** | 2–4 jugadores, Realtime: partida global (matchmaking), privada con código/enlace, VS (arrebato de clientes) y cooperativo (bloqueo de estaciones). Ranking **MMR** por ligas (Novato, Bronce, Plata, Oro, Platino, Diamante…). |
| **JAPON (Jugar aquí)** | Jornada con tiempo fijo dentro de un restaurante del Recorrido por Japón. |
| **Tutorial** | 4 lecciones guiadas (ver 7). |
| **Ingredientes** | Reconocimiento de ingredientes por plato, contador que sube, mejores marcas. |

## 5. Recursos y progresión
- **Soles (S/)**: dinero de la partida (meta de Campaña/Rash). Alimenta el **Fondo** del Recorrido por Japón.
- **Propinas 🧧**: recompensa de retos, lecciones (+60/+80/+100/+120 la primera vez), etc. Se gastan en **Mejoras** (10): Cuchillo afilado, Wok de hierro, Freidora con termostato, Olla de fideos grande, Bandeja caliente, Té de bienvenida, Mise en place, Estante de despensa, Libro de recetas, Aprendiz.
- **Estrellas de calidad** por plato (proceso 30 pts, emplatado 25, etc.); el cliente puede rechazar platos malos (feature) y los platos se enfrían (feature).
- **Cuenta:** perfil de chef, clave de acceso, dispositivo vinculado, nube ☁️.

## 6. Recorrido por Japón (`japon.js`, `japon-scene.js`)
Modo idle de restaurantes por ciudad (**9 ciudades**: Tokio, Yokohama, Osaka, Nagoya, Sapporo, Kioto, Fukuoka, Kanazawa, Nagasaki). Cada una reparte platos por afinidad histórica y cuesta abrirla 0 / 1 500 / 2 500 / 4 000 / 6 000 / 8 000 / 11 000 / 15 000 / 20 000.
- Local: Depósito, 4 cocinas, Salón, Caja, Baños. Se compra personal (niveles 1–5), mesas, tamaño (Pequeño → Amplio), calidad y 24 objetos por ciudad (3 por zona).
- Economía por minuto con gastos (planilla, renta, luz, agua, pérdidas de cobro); puede perder dinero. **Offline** hasta 4–12 h, multiplicado por la actividad reciente (×0,25 a ×1).
- Los objetos dan **mejoras permanentes** al juego (`patience`, `tips`, `price`; `fresh` sin conectar). Maestría de ciudad: +8 % de pago por plato de esa ciudad (los platos NO se bloquean).
- Escena isométrica animada (cocineros, mozos, clientes que entran/piden/comen/pagan), zoom, toque en una zona abre su gestión; ⬆ avisa mejoras asequibles.
- **Jugar aquí:** dificultad (Fácil/Normal/Difícil/Maestro) y áreas activas; recompensa a la caja del local; abandonar paga la mitad.
- Detalle y tablas: `docs/plan-recorrido-japon.md`.

## 7. Tutorial guiado (`guia.js`)
91 pasos data-driven (`add({seg, area, stage, title, text, target, to, setup, done, assist, info})`) divididos en **4 lecciones** (Ramen 25, Salteado 19, Makis 27, Frituras 20) que cocinan un plato de cada área (Shio, Chicken Teriyaki, Maki California, Chicken Katsu). Recuadro y manita sobre lo que hay que tocar, avance automático al hacer la acción, «Saltar paso». Recompensa en propinas **solo la primera vez**; la lección de Ramen desbloquea Campaña y Rash. Estado en `ramen_tut_areas` (sincronizado). API: `Guia.start(k)`, `Guia.menu()`, `Guia.begin()`, `Guia.flags()`, `Guia.diag()`.

## 8. Inicio (v137): Arquitectura de 3 Pilares + local isométrico a pantalla completa (`inicio.js`, `aula.js`)
Tres vistas guardadas en `ramen_inicio_vista2`: **hub** (por defecto), **iso** (local completo con todas las zonas) y **classic** (menú de botones de siempre). Se cambia desde ⚙.

**Hub de 3 Pilares con Escena Isométrica 100% Pantalla Completa:**
La ilustración isométrica 3D del restaurante ocupa **toda la pantalla de fondo (`inset: 0 !important`)**, mostrando el local vivo con cocineros, meseros y clientes comiendo y moviéndose sin recortes ni marcos opacos.

- **Columna flotante izquierda:** Barra delgada y translúcida (175 px) con **3 botones principales** ergonómicos para móvil (~873×393 px): **🍜 Jugar**, **🎓 Aprender**, **🏆 Mi Restaurante** y abajo **⚙️ Ajustes del Sistema**.
- **Cero invasión al entrar:** Al iniciar el juego o volver al menú, el panel lateral arranca **cerrado** y la cámara encuadra el restaurante completo con `fit(false)`. La escena 3D se aprecia limpia e ininterrumpida.
- **Tarjetas emergentes flotantes:** Al tocar **Jugar** o **Mi Restaurante**, se despliega una tarjeta compacta flotante en la esquina inferior derecha con botón de cierre explícito `✕`.
- **Cierre y vista panorámica:** Tocar la `✕`, volver a pulsar el pilar activo o tocar cualquier parte del suelo del restaurante cierra la tarjeta y la cámara vuelve suavemente al encuadre panorámico completo (`fit(true)`).

| Pilar | Subtítulo | Qué abre / Acciones |
|---|---|---|
| **🍜 Jugar** | Campaña · Rash · Japón · Online | Abre tarjeta compacta con los 4 modos de servicio: **Campaña** (8 niveles), **Supervivencia Rash** (100 rondas), **Recorrido por Japón** y **Multijugador** (2-4 chefs). |
| **🎓 Aprender** | Aula del Maestro · Retos · Práctica | Entra directamente al **Aula del Maestro** con transición de velocidad. Dentro tiene 4 pestañas: **Lecciones** (4 áreas), **Retos** (los 27 retos con medallas), **Práctica** (cocina libre por área y total) y **Repaso** (Ingredientes, Recetario, Secretos y Despensa). |
| **🏆 Mi Restaurante** | Mejoras · Recetario · Ranking · Cuenta | Abre tarjeta compacta con las 4 opciones de progresión: **Tienda de Mejoras** (utensilios con 🧧), **Recetario Oficial** (35 recetas), **Ranking Mundial** (Leaderboard) y **Mi Cuenta** (Nube, estadísticas y ordenar despensa). |

Abajo a la izquierda: botón único `⚙️ Ajustes del Sistema` (sonido, pantalla completa, versión, atajos, vista clásica y dispositivo).
Tocar cualquier elemento del local 3D interactúa coherentemente con su pilar (Maestro ➔ Aprender; Cocinas/Timbre/Puerta/Sala ➔ Jugar; Caja/Cuchillos/Pizarra ➔ Mi Restaurante; suelo vacío ➔ cierra panel y vista completa).

## 9. Guardado y nube (Supabase)
- Local: `localStorage`/`safeStorage` (`ramen_*`). Nube: RPC `get_game` / `save_game` (progreso de Japón, Rash, tutorial, reconocer) con revisión y combinación segura entre dispositivos: libros contables aditivos frente a una base + máximo/unión para la estructura; reserva por cuenta `ramen_game_stash_<id>`; reintento e idempotencia (`sig`).
- Otras migraciones: progreso de jugador, privacidad de cuentas, progreso de entrenamiento, estadísticas, aprendizaje, validación de servidor. RPC: auth por clave/dispositivo, `submit_record`, `pvp_sync`/`pvp_ranking`, administración (`admin_*`). Seguridad: `supabase/SEGURIDAD.md`.
- Todas las migraciones están aplicadas (la de `game_progress` la aplicó el dueño desde el editor SQL del móvil).

## 10. Arte y audio
- Íconos de ingredientes: 106 WebP generados con Gemini (estilo sticker) en `assets/ingredients/v2`; pendientes de actualizar: crudos de Producción, huevo y lomo (aún SVG antiguo). Equipamiento y escenas con SVG vectorial propio.
- Las figuras del inicio y de Japón son **provisionales** y están pensadas para sustituirse por arte de Gemini sin cambiar la lógica. Si se reemplaza un asset, usar **nombre nuevo** y subir la caché del SW.
- Efectos de sonido con `playSound(...)`, silenciar con `toggleAudioMute()`.

## 11. Cómo se trabaja con el dueño
- Él describe la mecánica/diseño, se implementa, se prueba con eventos de puntero simulados en el panel del navegador (emulación 873×393) y él refina.
- Prefiere **gestos** a toques repetidos; define el diseño por partes y quiere aprobar el contenido de cada área.
- Diferido por él: arte Gemini, rebalanceo de economía, textos y documentación fina.
- Respuestas y comunicación en español; reportes breves con qué hay de nuevo y qué probar.

## 12. Pendientes conocidos
1. Balance: «Jugar aquí» rinde mucho más que el idle; revisar economía general.
2. Campaña no guarda progreso (¿intencional?).
3. Buff `fresh` de Japón sin conectar; eventos aleatorios (hora pico, inspección, apagón) no implementados.
4. Arte final con Gemini (mapa, restaurantes, personas, objetos, local del inicio).
5. Tutorial: solo una acción de Producción por área en Makis/Frituras; «ebi furai replica el método» sin confirmar.
6. Makis: salmón no implementado; cobertura Amazon sin stock.
7. Inicio isométrico: probar en el Redmi (legibilidad de etiquetas, facilidad de toque); posibles ajustes de tamaño y posición.
8. Cuando cambien mecánicas de un área, actualizar los pasos de `guia.js` (selectores e ids).
