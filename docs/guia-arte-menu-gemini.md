# Arte del menú de inicio: guía de prompts para Gemini (Nano Banana)

Hoy cada entrada del menú (`inicio.js`, función `getArtworkSvg`) se muestra con una ilustración SVG de **520×400** dibujada a mano en código. Esta guía sustituye esos SVG por ilustraciones finales y añade íconos para la lista lateral.

## Qué se pide (3 paquetes)

| Paquete | Qué es | Piezas | Formato final | Tamaño máx. |
|---|---|---|---|---|
| **A. Escenas de vitrina** | Una ilustración por entrada del menú (lado derecho) | 13 | WebP 1040×800 (se muestra a 520×400) | 70 KB cada una |
| **B. Íconos de lista** | Sustituyen los emojis del panel izquierdo | 21 (2 hojas) | WebP 128×128, fondo transparente | 6 KB cada uno |
| **C. Efectos animables** | Vapor, llama, brillo, moneda: el código los anima encima de la escena | 12 (1 hoja) | WebP 4 fotogramas por fila | 40 KB la hoja |

Orden recomendado: **A primero** (es lo que más se ve), luego C y al final B.

## Reglas comunes

- **Estilo:** el mismo de los 106 ingredientes (contorno marrón grueso, cel shading de 3 tonos, luz arriba a la izquierda), para que menú, ingredientes y Japón parezcan del mismo juego.
- **Perspectiva:** diorama isométrico **2:1 (dimétrico)**, igual que la escena de Japón. Cada escena es una **plataforma flotante** (suelo de madera/tatami con borde visible) sobre fondo liso. Así todas se leen como piezas de la misma colección.
- **Fondo de las escenas:** color liso `#2b1810` (el del panel). El código pone encima el degradado y las partículas; no pidas fondo con detalles.
- **Sin texto dentro de la imagen** (los rótulos los pone el juego en español). Excepción: números sueltos como «1», «2», «3» en el ranking.
- **Personajes:** el Maestro, los cocineros y los clientes **no van** en estas escenas (ya tienen su propio sprite y el código los coloca). Si una escena necesita «alguien», se deja el hueco libre.
- **Cada escena deja libre el 25 % izquierdo** (zona donde se superpone el texto en pantallas pequeñas) con poco detalle.

## Bloque ESTILO (pegar siempre antes de cada prompt)

```
STYLE (use exactly the same for every illustration):
- cute polished mobile-game diorama, 2:1 isometric (dimetric) projection, orthographic, no perspective vanishing points
- the scene sits on a floating square platform (wood planks or tatami, visible thick side edge), centered, with empty space around it
- chunky dark-brown outline (#2b1810), uniform thickness; soft cel shading with 3 tones (light, mid, shadow); small white highlights
- single light source from the top-left: left faces lighter than right faces, soft contact shadow only on the platform itself
- warm Japanese ramen-shop palette: vermilion red #C8372D, lantern orange #F2A33A, cream #F6E7C1, wood brown #8A5A33, deep indigo #2E3A59, matcha green #7FA650, nori black #1F1A17
- vibrant, appetizing, clean vector-like look; no text, no letters, no logos, no watermark
- solid flat background color #2b1810 everywhere outside the platform (no gradient, no vignette, no stars)
- output aspect ratio 13:10 (landscape), the platform fills about 70% of the width
```

Cómo trabajar: conversación **nueva** por escena (o «Editar imagen» sobre la misma), subir 2 íconos del juego como referencia de estilo (por ejemplo `assets/ingredients/v2/ing_1_ramen.webp`) y pedir **una escena por mensaje**. Si algo sale mal: *«Redo only the [elemento], keep everything else identical»*.

---

## Paquete A: 13 escenas de vitrina

Cada prompt va **después** del bloque ESTILO. La columna «Se anima con el código» indica qué quedará separado en el paquete C para no hornearlo en la imagen.

### A1 · Campaña (`camp`, también la usa «Jugar»)
Qué transmite: servicio en vivo, 5 arcos, 3 estrellas.

```
SCENE: a small ramen-ya counter diorama. A long wooden counter with three steaming ramen bowls in different stages, a rail above it holding five paper order tickets, and a row of FIVE hanging paper lanterns in five different colors (red, orange, green, blue, purple) representing five story chapters. Three golden stars float above the center lantern. A small noren curtain hangs at the back. Leave the steam off the bowls (drawn separately).
```
Se anima: vapor de los cuencos, parpadeo de las linternas, brillo de las estrellas.

### A2 · Supervivencia Rash (`rash`)
Qué transmite: caos, velocidad, 3 vidas.

```
SCENE: a hectic kitchen corner diorama. A large iron wok on a roaring stove with exaggerated flames (flames drawn as solid shapes, stylized), a red alarm clock-timer at the back, a stack of overflowing order tickets, and THREE heart-shaped red paper lanterns hanging in a row as lives (the third slightly cracked). Dynamic, tense mood, a few chopped vegetables flying mid-air above the wok.
```
Se anima: llamas, vegetales saltando, latido de los corazones.

### A3 · Recorrido por Japón (`door`)
Qué transmite: franquicia en 9 ciudades, ingresos pasivos.

```
SCENE: a miniature stylized island of Japan as the floating platform (simplified silhouette, green land, blue sea edge), with Mount Fuji with a snow cap at the back, and NINE tiny ramen-shop buildings (red roofs, lanterns) placed along a winding dirt path from north to south, connected by the path. A red torii gate at the entrance of the path, two cherry blossom trees, a few golden yen coins stacked at the front. The platform is the island itself (visible thick side).
```
Se anima: pétalos, monedas girando, luces de las tiendas.

### A4 · Multijugador (`room`)
Qué transmite: sala privada con amigos, 2–4 chefs.

```
SCENE: a private tatami room diorama with sliding shoji paper doors on the two back walls, one half open showing a night garden. A low wooden table in the center with FOUR seat cushions (zabuton) in four colors and four ramen bowls facing each other, four small chef hats resting on the cushions, a paper lantern hanging above. A small wooden sign post at the entrance. Warm cozy light.
```
Se anima: vapor, luz de la linterna.

### A5 · Aula del Maestro (`aula`, también «Aprender»)
Qué transmite: academia tradicional, 4 disciplinas.

```
SCENE: a traditional dojo-style classroom diorama on a tatami floor. At the back a wooden shelf with FOUR labeled-by-object display items (no text): a ramen bowl, a wok, a sushi maki roll, and a tempura shrimp, each on its own small wooden stand. In front, a low teacher's desk with an open scroll, a calligraphy brush and ink stone, a small tea set, and an empty cushion where the master sits (leave the cushion empty). A hanging scroll with a red seal on the back wall (no writing, abstract brush strokes only).
```
Se anima: vapor del té, balanceo del pergamino.

### A6 · Retos del Chef (`tickets`)
Qué transmite: 50 desafíos con medallas.

```
SCENE: an old brass-and-wood ticket machine (printer) on a counter, with a long curling paper ticket strip coming out and folding onto the platform; on the strip small pictograms only (knife, flame, clock, star; no letters). Next to it three medals on ribbons lying on a small wooden tray: gold, silver, bronze. A small stopwatch in front.
```
Se anima: la tira de papel saliendo, brillo de las medallas.

### A7 · Cocina Libre Zen (`free`)
Qué transmite: práctica sin reloj, calma.

```
SCENE: a calm zen kitchen nook diorama. A wooden cutting board with neatly arranged fresh ingredients (sliced cucumber, a carrot, a block of tofu, green onions), a small bonsai tree, a tiny raked sand garden square with three stones, a steaming teapot with a cup, a hanging empty clock-less wall (no clock anywhere). Soft pastel greens and warm wood, very peaceful mood.
```
Se anima: vapor del té, hojas del bonsái.

### A8 · Modo Ingredientes (`pantry`)
Qué transmite: memoria visual de ingredientes.

```
SCENE: a pantry diorama: a tall wooden shelf unit with three shelves full of glass jars and crates of colorful ingredients (noodles, eggs, nori sheets, shrimp, scallions, mushrooms, tofu, pickled ginger), seen from the front-left. In front on the floor, a small round table with FOUR face-down wooden memory cards and one card flipped showing a simple egg illustration. A small basket of vegetables.
```
Se anima: una tarjeta que se voltea, brillo en un frasco.

### A9 · Mi Restaurante / Tienda de Mejoras (`knives`, también «Mi Restaurante»)
Qué transmite: cuchillos de Sakai, utensilios y mejoras.

```
SCENE: a display wall diorama: a wooden wall panel with a magnetic rack holding SIX different Japanese kitchen knives (gyuto, santoku, yanagiba, deba, nakiri, petty), each with a different handle color, blades shining. Below, a wooden counter with a whetstone with water, a small lucky cat (maneki-neko) with raised paw, and a pile of gold coins. A little price tag shaped like a paper tag with no text.
```
Se anima: destellos en las hojas, la pata del gato.

### A10 · Recetario Oficial (`book`)
Qué transmite: 35 recetas, orden de montaje.

```
SCENE: a large open recipe book on a wooden lectern, thick pages with a red ribbon bookmark, the two pages showing simple illustrated dishes (a ramen bowl on the left page, sushi on the right page) with decorative borders and NO letters. Beside it a brush pen and ink stone, a small stack of closed books, a hanging paper lantern, and a few loose recipe cards with food pictograms.
```
Se anima: las páginas, el brillo del lazo.

### A11 · Ranking Mundial (`board`)
Qué transmite: líderes mundiales, ligas.

```
SCENE: a wooden ranking board diorama: a large wooden board with THREE hanging name plates (blank wood plaques, no text) in gold, silver and bronze, large numerals 1, 2, 3 carved on them. On top a golden trophy shaped like a ramen bowl, beside it a small globe on a stand and a red flag. Confetti ribbons on the platform.
```
Se anima: confeti, brillo del trofeo.

### A12 · Mi Cuenta y Nube (`acct`)
Qué transmite: guardar progreso con una clave.

```
SCENE: a small treasure chest with a big golden key in its lock, from which a fluffy white cloud rises; a cloud-shaped paper lantern hangs above it; beside it a scroll with a red wax seal (no writing) and a tiny wooden stamp. A thin glowing golden thread connects the chest to the cloud. Soft blue and gold accents.
```
Se anima: la nube flotando, brillo del hilo.

### A13 · Ajustes (`gear`)
Qué transmite: sonido, pantalla, atajos.

```
SCENE: a small workshop shelf diorama with a big brass gear mechanism, a cluster of three round dials/knobs, a paper lantern shaped like a speaker (sound), a tiny framed screen icon, a wind chime (furin) and a mug of tea. Calm, tidy, slightly industrial wood-and-brass look.
```
Se anima: engranaje girando, campanilla.

---

## Paquete C: efectos animables (1 hoja)

Hoja de 3 filas × 4 columnas, cada fila es un efecto de 4 fotogramas (se anima de izquierda a derecha). Fondo magenta para recortarlo.

```
Create one sprite sheet: 3 rows x 4 columns, each row is a 4-frame animation loop of a game effect, each frame centered in its own cell with generous space, nothing overlapping.
Row 1: soft white steam wisps curling upward (4 frames, the shape drifts and changes smoothly).
Row 2: a stylized orange-yellow flame with red core (4 frames, flickering).
Row 3: a golden four-point sparkle star twinkling (4 frames, growing then shrinking).
STYLE: chunky dark-brown outline (#2b1810) except the steam which has a soft pale outline; soft cel shading, vector-like; each effect fills 80% of its cell; solid flat magenta background (#FF00FF), pure magenta must not appear inside any effect; no text.
```
Pedir después una segunda hoja con **moneda dorada girando**, **pétalo de cerezo cayendo** y **confeti** (mismo bloque).

---

## Paquete B: íconos de lista (2 hojas)

Mismo formato que las hojas de ingredientes (4×3, fondo magenta, una hoja por mensaje). Estilo igual, pero **vista frontal** (no de arriba) y un solo objeto con silueta clara a 40 px.

| Hoja | Íconos (izquierda a derecha, arriba a abajo) |
|---|---|
| B1 | Jugar (cuenco de ramen humeante), Aprender (pergamino con birrete), Mi Restaurante (casita con linterna), Ajustes (engranaje), Campaña (linterna roja con estrella), Rash (llama con rayo), Japón (torii rojo), Multijugador (dos cuencos que chocan), Aula (pizarra de madera con cuchara), Retos (medalla en cinta), Cocina Libre (tetera), Ingredientes (cesta de verduras) |
| B2 | Mejoras (cuchillo de cocina), Recetario (libro con lazo), Ranking (trofeo), Cuenta y Nube (nube con llave), Sonido (bocina con ondas), Pantalla completa (marco con flechas hacia fuera), Actualizar (flechas circulares), Atajos (tecla con una flecha), Menú clásico (lista con tres líneas) |

```
Create one game icon sheet: a grid of 3 rows x 4 columns (12 separate icons), each icon centered in its own cell, nothing overlapping. Front view (not top-down), one object per icon with a very clear silhouette readable at 40 px.
Items in reading order: [pegar la fila de la tabla anterior, uno por celda]
STYLE: chunky dark-brown outline (#2b1810), soft cel shading with 3 tones, small white highlight top-left, vibrant colors from the ramen-shop palette, no text or numbers, solid flat magenta background (#FF00FF), pure magenta must not appear inside any icon.
```

---

## Entrega e integración (lo hago yo)

1. Guardar cada imagen como PNG en `assets/gen/menu/` con el nombre de la tabla (`escena_camp.png`, `escena_rash.png`… `iconos_b1.png`, `efectos_c1.png`).
2. Yo recorto las hojas, quito el magenta, exporto a WebP y los pongo en `assets/menu/`.
3. `getArtworkSvg` pasa a poner `<img>` de la escena y las capas animadas (vapor, llamas, brillo) encima con CSS, como en el Maestro (`steps()` sobre la hoja de efectos).
4. Los nombres de archivo van **nuevos** (el service worker ignora el `?v=`), se añaden a `CORE_SHELL` solo si son del primer pantallazo; el resto se precargan al abrir el menú para no inflar la instalación (13 escenas ≈ 0,9 MB).
5. El menú se queda con el SVG actual como respaldo mientras la imagen carga o si falla.

## Estimación y orden de trabajo

| Paso | Cantidad | Mensajes a Gemini |
|---|---|---|
| Escenas A | 13 | 13 (+ retoques) |
| Efectos C | 2 hojas | 2 |
| Íconos B | 2 hojas | 2 |

Empezar por **A1 (Campaña)**: si ese diorama convence, el resto sigue el mismo estilo y solo se ajusta el bloque ESTILO una vez.
