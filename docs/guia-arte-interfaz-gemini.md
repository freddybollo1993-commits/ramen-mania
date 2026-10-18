# Arte de las pantallas y tarjetas: guía de prompts para Gemini (Nano Banana)

Sustituye los emoji y los degradados de las pantallas de **Modos de juego, Aprender, Recorrido por Japón, menú principal y Tienda** por ilustraciones propias del juego, una por cada modo y cada tarjeta, según su función.

Dos tipos de imagen, las dos **sin ningún texto** (los rótulos los pone el juego):

| Tipo | Qué es | Cuántas | Formato |
|---|---|---|---|
| **Escena** | El fondo ilustrado de la tarjeta grande de cada modo | 8 | Vertical 3:4, a todo color, **sin fondo magenta** |
| **Ícono** | La ilustración pequeña de cada tarjeta, estilo pegatina como los ingredientes | 60 en 5 hojas | Hojas de 4 × 3, **fondo magenta `#FF00FF`** |

## Cómo usarlo (desde el celular)
1. Abre Gemini en una conversación **nueva** por cada escena u hoja.
2. Adjunta de referencia de estilo: para las **escenas**, la imagen de la cocina del juego (`assets/menu/zona1_placa_ancha.webp`); para los **íconos**, dos o tres ingredientes del juego (los de `assets/ingredients/v2/`). Escribe: *«Use the attached image only as a style reference (line, shading, palette); do not copy its content.»*
3. Pega el prompt de cada escena u hoja (un mensaje por pieza).
4. Si algo sale mal, pide solo eso: *«Redo only the item in row 2, column 3, keep everything else identical»*.
5. Guarda cada archivo con el **nombre indicado** en `assets/gen/ui/` y mándamelos. Yo recorto, quito el magenta, ajusto tamaños, los convierto a WebP con nombres nuevos y los conecto en el juego.

---

## A · ESCENAS (8, vertical 3:4)

### Bloque ESTILO para las escenas (pegar siempre)
```
STYLE: hand-painted 2D anime game background, warm rich colors, soft painterly shading with clean readable shapes, cozy Japanese restaurant-game mood, strong focal point in the upper 60% of the image, the bottom 35% is calmer and darker (a title and buttons will sit on top of it), light coming from the top, small glowing details, no characters' faces in close-up, absolutely NO text, NO letters, NO numbers, NO logos, NO UI. Vertical 3:4 composition.
```

| Archivo | Modo | Prompt (en inglés; añade el bloque ESTILO) |
|---|---|---|
| `escena_rash.png` | **Rash** (rojo) | `A chaotic rush-hour ramen kitchen at its peak: a huge wok erupting with orange flames and sparks in the center, noodles and vegetables flying through the air, order tickets fluttering, speed lines, a glowing hourglass half-hidden in the smoke. Palette: deep red, orange, black, hot yellow highlights. Intense and exciting.` |
| `escena_japon.png` | **Recorrido por Japón** (rosa) | `A magical journey through Japan at dusk: Mount Fuji far away, a red torii gate, a small pagoda, a winding stone path with glowing paper lanterns leading to a tiny ramen stall, falling cherry blossom petals. Palette: pink, purple, warm orange sunset sky.` |
| `escena_zen.png` | **Sin estrés** (verde) | `A calm Japanese garden kitchen in the morning: tall bamboo, a koi pond with lotus flowers, a stone lantern, a low wooden table with a steaming teapot and a bowl of ramen, soft mist. Palette: fresh greens, warm wood, pale gold light. Peaceful.` |
| `escena_online.png` | **Online** (azul) | `Two cozy ramen bars facing each other across a glowing night city, joined by bright ribbons of light, a glowing globe with network lines in the sky, two steaming bowls and two chef hats in the foreground as a friendly rivalry. Palette: deep blue, cyan, warm yellow lantern accents.` |
| `escena_aula.png` | **Aula del Maestro** (morado) | `A traditional tatami classroom of a ramen master: a wooden board with a hanging recipe scroll, a calligraphy brush and ink stone, a tea set, a master's tall chef hat resting on a stand, paper lanterns, wooden beams. No people. Palette: purple dusk light, warm wood, soft gold.` |
| `escena_retos.png` | **Retos** (turquesa) | `A training dojo-kitchen: wooden targets with arrows, medal ribbons and gold medals hanging, a stopwatch, practice ingredients lined up on a long table, a small trophy on a shelf. Palette: teal, turquoise, gold and wood. Challenging and fun.` |
| `escena_repaso.png` | **Repaso** (turquesa suave) | `A cozy recipe library nook: stacks of cookbooks, an open recipe book with little ingredient sketches, glass jars of spices, chopsticks in a cup, a magnifying glass on the desk, warm lamp. Palette: teal and warm brown with golden light.` |
| `escena_camp.png` | **Campaña** (naranja; ya existe una) | `Optional replacement for the current campaign image: the inside of a warm night izakaya ramen bar seen from the counter, hanging lanterns, noren curtains, steaming pots, shelves of bowls and bottles. Palette: warm orange and deep blue.` |

---

## B · ÍCONOS (5 hojas de 12, cuadrícula de 4 columnas × 3 filas)

### Bloque ESTILO para los íconos (pegar siempre; es el mismo de los ingredientes)
```
STYLE (use exactly the same for every item):
- chunky dark-brown outline (#2b1810), uniform thickness
- soft cel shading with 3 tones (light, mid, shadow), small white highlight on the top-left
- 3/4 top-down view, same light direction for all items, same scale: each item fills about 80% of its cell
- vibrant, appetizing colors; clean vector-like look (like a polished mobile game icon)
- no text, no labels, no numbers, no borders, no drop shadow on the background
- solid flat magenta background (#FF00FF) everywhere, and pure magenta must not appear inside any item
```

Plantilla (cambia solo la lista de cada hoja):
```
Create one game icon sheet: a grid of 3 rows × 4 columns (12 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping. Each icon is a single illustrated object with a clear silhouette that reads at small size.
Items in reading order:
[LISTA]

[PEGAR BLOQUE ESTILO]
```

### Hoja UI-01 · Campaña, Rash y Online → `ui_01.png`
| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | `arco_ramen` | `arco_salteado` | `arco_makis` | `arco_frituras` |
| **F2** | `arco_maestria` | `rash_record` | `rash_etapas` | `online_arrebato` |
| **F3** | `online_coop` | `candado` | `estrella` | `trofeo` |

```
1. (row 1, col 1) a steaming bowl of shio ramen with noodles, a soft egg and a slice of pork (Fundamentals of Ramen)
2. (row 1, col 2) a wok on fire tossing vegetables and chicken with big flames (Fire of the Wok)
3. (row 1, col 3) a sushi maki roll cut in pieces next to a bamboo mat and a small knife (Nikkei Maki Bar)
4. (row 1, col 4) a golden tempura shrimp and a katsu cutlet over a splash of hot oil (Golden Oil)
5. (row 2, col 1) a golden chef trophy topped with a tall chef hat and a small star (Signature Restaurant)
6. (row 2, col 2) a gold trophy wrapped in flames with a small crown (Rash record)
7. (row 2, col 3) three steps of stairs made of glowing embers, each with a small flame and a tiny key on the top step (Rash stages unlocking)
8. (row 2, col 4) two crossed ladles like swords with a small spark between them (Versus snatch)
9. (row 3, col 1) two hands holding a single steaming ramen bowl together (Shared kitchen, co-op)
10. (row 3, col 2) a closed golden padlock
11. (row 3, col 3) a big shiny gold star with a small sparkle
12. (row 3, col 4) a gold trophy cup with two handles
```

### Hoja UI-02 · Sin estrés, Lecciones y Repaso → `ui_02.png`
| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | `libre_ramen` | `libre_salteado` | `libre_makis` | `libre_frituras` |
| **F2** | `libre_todo` | `reconocer` | `leccion_ramen` | `leccion_salteado` |
| **F3** | `leccion_makis` | `leccion_frituras` | `repaso_recetario` | `repaso_despensa` |

```
1. (row 1, col 1) a relaxed bowl of ramen with a small green leaf on top and soft steam, calm feeling (free ramen)
2. (row 1, col 2) a wok with stir-fried vegetables and a small green leaf, calm feeling (free stir-fry)
3. (row 1, col 3) three sushi rolls on a small wooden board with a small green leaf (free makis)
4. (row 1, col 4) two golden fried shrimp with a lemon wedge and a small green leaf (free fried food)
5. (row 2, col 1) a big green leaf with four tiny bowls (ramen, wok, sushi, shrimp) arranged around it (free, all areas)
6. (row 2, col 2) a magnifying glass over a pile of colorful ingredients
7. (row 2, col 3) a master's chef hat with a ramen bowl badge on it (ramen lesson)
8. (row 2, col 4) a master's chef hat with a small wok badge on it (stir-fry lesson)
9. (row 3, col 1) a master's chef hat with a sushi roll badge on it (maki lesson)
10. (row 3, col 2) a master's chef hat with a fried shrimp badge on it (fried-food lesson)
11. (row 3, col 3) an open recipe book with small food drawings and a ribbon bookmark
12. (row 3, col 4) a neat row of chopsticks, jars and small bottles lined up in order (arranging the pantry)
```

### Hoja UI-03 · Ciudades de Japón → `ui_03.png`
| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | `tokio` | `yokohama` | `osaka` | `nagoya` |
| **F2** | `sapporo` | `kioto` | `fukuoka` | `kanazawa` |
| **F3** | `nagasaki` | `ciudad_cerrada` | `soles` | `restaurante` |

```
1. (row 1, col 1) Tokyo: a red and white Tokyo Tower with a small neon sign shape (no text)
2. (row 1, col 2) Yokohama: a harbor with a big ferris wheel and a small ship
3. (row 1, col 3) Osaka: a white castle with green roofs next to a giant takoyaki ball on a stick
4. (row 1, col 4) Nagoya: a castle with golden dolphin roof ornaments (shachihoko)
5. (row 2, col 1) Sapporo: a snowy clock tower with a snowflake and a small ramen bowl
6. (row 2, col 2) Kyoto: a red torii gate and a pagoda with a cherry blossom branch
7. (row 2, col 3) Fukuoka: a street food yatai cart with a red lantern and a pork-bone ramen bowl
8. (row 2, col 4) Kanazawa: a traditional garden with a stone lantern and a gold leaf glow
9. (row 3, col 1) Nagasaki: a harbor lighthouse with a small tiled ship and a Chinese-style lantern
10. (row 3, col 2) a closed grey city gate with a golden padlock, locked city
11. (row 3, col 3) a stack of gold coins with a rising sun symbol (the "soles" currency)
12. (row 3, col 4) a small Japanese ramen restaurant shopfront with a red awning, lantern and noren curtain
```

### Hoja UI-04 · Menú principal → `ui_04.png`
| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | `btn_recetario` | `btn_tienda` | `btn_aprender` | `btn_ranking` |
| **F2** | `btn_misiones` | `btn_ajustes` | `btn_perfil` | `propinas` |
| **F3** | `cofre_dia` | `racha` | `btn_modos` | `btn_jugar` |

```
1. (row 1, col 1) a thick red recipe book with a golden clasp and a small ramen drawing
2. (row 1, col 2) a tiny shop stall with a red-and-cream striped awning, a wooden counter and colorful goods
3. (row 1, col 3) a black graduation cap with a golden tassel and a small chef hat on top
4. (row 1, col 4) a golden podium with a first-place trophy and a small crown
5. (row 2, col 1) a wooden clipboard with a green checklist, a red pencil and a small star
6. (row 2, col 2) a pair of golden gears with a small wrench
7. (row 2, col 3) a round chef portrait badge: a cute chef hat over a smiling face silhouette (no realistic face), gold frame
8. (row 2, col 4) a red envelope with a gold coin (the "propinas" currency)
9. (row 3, col 1) a wooden treasure chest with golden bands, slightly open with light coming out
10. (row 3, col 2) a bright flame with a small number-free spark trail (daily streak)
11. (row 3, col 3) a deck of three overlapping cards fanned out, each with a different color (game modes)
12. (row 3, col 4) a big glowing golden play triangle button
```

### Hoja UI-05 · Tienda y Misiones → `ui_05.png`
| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | `tienda_mejoras` | `tienda_secretos` | `tienda_activas` | `tienda_apariencia` |
| **F2** | `tienda_japon` | `mision_diaria` | `mision_semanal` | `mision_temporada` |
| **F3** | `cofre_misiones` | `reto_medalla` | `reto_reloj` | `etapa_producir` |

```
1. (row 1, col 1) a hammer and an anvil with sparks and a small green upgrade arrow
2. (row 1, col 2) an old scroll tied with a red cord and a small golden key
3. (row 1, col 3) a round bright lightning-bolt skill button with a glowing ring
4. (row 1, col 4) a wardrobe hanger with a small chef hat and a red scarf
5. (row 2, col 1) a small map of Japan shaped as a pink plaque with a tiny torii
6. (row 2, col 2) a calendar page with a green check mark and a rising sun
7. (row 2, col 3) a calendar week with a golden star badge and a ribbon
8. (row 2, col 4) a big golden season badge with a cherry blossom and a ribbon
9. (row 3, col 1) a golden quest chest with a sparkling star lock
10. (row 3, col 2) a gold medal with a red ribbon and a small chef hat emblem
11. (row 3, col 3) a round golden stopwatch with a lightning bolt
12. (row 3, col 4) a wooden crate of fresh ingredients with a small cooking pot icon on it (production stage)
```

---

## Qué hago yo cuando traigas las imágenes
1. **Escenas:** las convierto a WebP vertical (≈ 540 × 720), les aplico un degradado inferior para que el texto se lea y las conecto en las tarjetas grandes de Modos, Aprender y Aula.
2. **Íconos:** corto cada hoja (como con los ingredientes), quito el magenta, centro y exporto WebP de 160 px con nombres nuevos (`ui_*.webp`).
3. **Conexión:** el juego ya consulta `arte-ui.js`: cada tarjeta usa su ilustración si el archivo existe y, si no, el emoji de siempre. Así se puede ir publicando por tandas.
4. **Versión y caché:** subo la versión, añado las imágenes al precaché y compruebo en el panel (la fluidez en el Redmi la confirmas tú).

**Prioridad sugerida:** primero `ui_01` y las escenas de **Rash, Japón, Sin estrés y Online** (lo que más se ve en Modos de juego); luego `ui_02`, `ui_03`, `ui_04` y `ui_05`.
