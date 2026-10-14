# Módulos del juego (`js/`)

Hasta la v148 casi toda la lógica vivía en un único `<script>` de `index.html` (~17 000 líneas). Desde la **v149** está repartida en 31 archivos por tema, **en el mismo orden** en que se ejecutaba antes.

| Grupo | Módulos |
|---|---|
| Núcleo y datos | `01` Supabase/dispositivo · `02` ingredientes y recetas · `03` niveles de la Campaña · `04` estado y audio |
| Cocina (comunes) | `05` menús por área · `06` navegación entre etapas · `09` motor de etapas · `10` taller de Producción (gestos) · `11` emplatado · `13` áreas y arrastre · `14` cuencos y estado · `22` calidad y servir |
| Áreas | `07` Makis · `08` Salteados (wok) · `12` Frituras · `15` Ramen (fideos y clientes) · `23`–`24` Ramen (sartenes, herramientas, Shio) |
| Partida y progreso | `16` cooperativo · `17` propinas/mejoras/progreso · `19` Entrenamiento · `20` estadísticas · `21` cocina libre, mejoras y efectos · `25` partida y Campaña |
| Cuenta y menús | `18` nube y cuenta · `26` menú clásico y modales · `27` tutorial antiguo · `28` perfil, ranking, PWA, recetario · `31` orientación, admin y arranque |
| Secretos | `29` galería · `30` modelos 3D |

## Reglas
- Son **scripts clásicos con ámbito global compartido** (no ES modules): lo que un archivo declara con `const`, `let` o `function` lo ven los demás y también los `onclick="..."` de `index.html`.
- **El orden importa.** Se cargan en orden numérico desde `index.html`. Una función declarada en un archivo posterior **no existe todavía** cuando un archivo anterior ejecuta código suelto al cargar (llamadas, `const x = f()`); dentro de funciones sí se puede usar cualquier cosa porque se ejecutan después. Por eso `newWok` está al principio de `04`.
- Para añadir código: ponlo en el módulo de su tema. Para un archivo nuevo, créalo con el siguiente número, añade su `<script src="js/NN-nombre.js?v=…">` en `index.html` **y** su ruta en `CORE_SHELL` de `sw.js`.
- Al publicar: sube el `?v=` de todos los módulos que cambien (mejor el mismo número en todos), la versión visible de `index.html` y `CACHE_NAME` de `sw.js`.
- Comprobación rápida: `node tools/verificar-modulos.cjs` (sintaxis, orden de carga y caché sin conexión).
- `tools/economia-niveles.cjs` lee `index.html` y estos módulos, así que sigue funcionando.

## Camino hacia módulos ES
Esta división es el primer paso: ya hay fronteras claras entre temas. El siguiente paso, por módulo y sin romper nada, es sustituir variables globales por `export`/`import` empezando por los más aislados (`19` Entrenamiento, `20` estadísticas, `29`–`30` Secretos) y exponer en `window` solo lo que necesiten los `onclick`.
