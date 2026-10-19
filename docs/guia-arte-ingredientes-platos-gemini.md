# Guía de arte: ingredientes que faltan, crudos y platos (Gemini / Nano Banana)

Auditoría del 2026-10-19 (v238). **Lo que falta es esto y nada más:**

| Qué | Cuántos | Hojas | Hoy se ve como |
|---|---|---|---|
| Ingredientes sin arte (ids 109-120) | 12 | `ing-1` (4×3) | emoji |
| Rodaja de limón (id 121) + 8 **crudos** de Producción (huevo, poro, cebolla china, bambú, col, moyashi, zanahoria, lomo entero) | 9 | `ing-2` (3×3) | emoji / SVG viejo que desentona |
| **Platos terminados** (uno por receta, para Recetario, fichas y comandas) | 36 | `platos-ramen`, `platos-salteados`, `platos-makis`, `platos-frituras` (3×3 cada una) | no hay: el Recetario usa el icono de un ingrediente |

Total: **6 hojas**. Los 106 ingredientes con arte v2 (ids 1-107) ya están bien.

## Flujo (el mismo que ya funcionó)

1. En Gemini, **conversación nueva por hoja**. Sube **3 íconos del juego como referencia** (te dejo cuáles abajo) y escribe: *"Use these as style reference; match their white sticker outline, shading and proportions."*
2. Pega el **bloque ESTILO** de la hoja (ingredientes o platos) y luego el **prompt de la hoja**.
3. Si una celda sale mal, pide solo esa: *"Redo only the item in row 2, column 3, keep everything else identical."*
4. Guarda la hoja como PNG de la mayor resolución posible en `assets/gen/` (por ejemplo `ing-1.png`) y **envíamela**.
5. Yo la corto con `tools/cortar-hoja.py` (quita el magenta, centra y exporta WebP), reviso la hoja de contacto y la conecto al juego.

Referencias de estilo que sirven (están en `assets/ingredients/v2/`): `ing_10.webp` (cuenco de salsa), `ing_8.webp` (botella), `ing_49.webp` (rodajas de atún) y `ing_102.webp` (limón entero, para la rodaja). Para los platos, además, súbele **un plato bueno que te guste de otra hoja** a modo de referencia.

> **Regla de color:** el fondo es magenta puro (#FF00FF). **Ninguna figura puede tener morado, magenta ni rosa violáceo** (se confundiría con el fondo y quedaría transparente). Rosa salmón, rojo y rojo atún están bien.

---

## A. Ingredientes (hojas `ing-1` e `ing-2`)

### Bloque ESTILO para ingredientes (pegar siempre)

```
STYLE (identical for every item):
- digital sticker icon: a thick pure-white outline hugging the whole silhouette, plus a thin dark-brown (#2b1810) inner contour line
- soft cel shading with 3 tones (light, mid, shadow) and a small white highlight at the top-left
- 3/4 top-down view, light from the top-left, the same scale for all items: each item fills about 75% of its cell
- vibrant, natural, appetizing colors; clean polished mobile-game look
- no text, no labels, no numbers, no cell borders, no floor shadow, no plate unless stated
- solid flat magenta background (#FF00FF) everywhere; pure magenta, purple or violet must NOT appear inside any item
- leave generous empty space between items; nothing may overlap or touch a neighbor
```

### Hoja `ing-1` · 12 ingredientes (4 columnas × 3 filas)

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Frutos Secos (#109) | Atún (pieza) (#110) | Conchas de abanico (#111) | Pichikata (#112) |
| **F2** | Culantro (#113) | Camote (#114) | Chuño (#115) | Chifle (#116) |
| **F3** | Kiury (#117) | Salsa Poke de Atún (#118) | Layu (#119) | Tar Tar de Atún (#120) |

```
Create one game icon sheet: a grid of 3 rows x 4 columns (12 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Items in reading order:
1. Mixed dry nuts and seeds: a small heap of almonds, peanuts in shell, walnut halves and pistachios.
2. Raw tuna loin block ("saku"): a rectangular deep-red block of sashimi-grade tuna with a few fat lines, one clean cut slice leaning against it.
3. Fan scallops ("conchas de abanico"): three open scallop shells, each with a plump white scallop and a bright orange coral on the half shell.
4. Pichikata: a small dark stone bowl heaped with a golden-yellow ground spice mix, with a small wooden spoon.
5. Culantro (culantro / cilantro): a bunch of fresh serrated long green leaves tied loosely, with a few small stems.
6. Camote: one whole orange-skinned sweet potato (elongated, tapered ends) next to a cut slice showing the creamy yellow-orange flesh.
7. Chuño: a small pile of freeze-dried potatoes, dark grey-brown, wrinkled, spongy, round and irregular.
8. Chifle: a small heap of thin crispy green-plantain chips, golden-yellow, a few standing up.
9. Kiury (Japanese cucumber, "kyuri"): a whole slim dark-green cucumber with small bumps next to three round slices showing pale green flesh and seeds.
10. Tuna poke sauce: a small dark stone bowl (same bowl style as the other sauce icons) with a glossy pink-red soy-based sauce and a few tiny diced tuna cubes and sesame seeds.
11. Layu (Japanese chili oil): a small clear glass jar with a metal lid filled with deep red chili oil and chili flakes, a cork-less label-free look.
12. Tuna tartare: a neat round mound of finely diced red tuna in a ring shape, with a little green scallion garnish and white sesame on top, shown on its own (no plate).
```

### Hoja `ing-2` · rodaja de limón + 8 crudos de Producción (3 columnas × 3 filas)

| | Col 1 | Col 2 | Col 3 |
|---|---|---|---|
| **F1** | Rodaja de limón (#121) | Huevo crudo (#15) | Poro crudo (#17) |
| **F2** | Cebolla china cruda (#18) | Bambú crudo (#22) | Col cruda (#24) |
| **F3** | Moyashi crudo (#25) | Zanahoria cruda (#30) | Lomo entero (#61) |

```
Create one game icon sheet: a grid of 3 rows x 3 columns (9 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
These are RAW, as-delivered ingredients, shown whole and unprocessed. Items in reading order:
1. A lemon wheel: one thick round slice of lemon with the white pith ring, yellow segments and a few seeds, with a tiny bit of peel on the rim.
2. A raw brown chicken egg, whole in its shell, slightly speckled.
3. A raw leek: one whole leek with white-pale-green stalk, the root hairs at the bottom and the long dark-green leaves at the top (bend the leaves so it fits the cell).
4. Raw spring onions ("cebolla china"): a bundle of 4 whole green onions with white bulb bases, small roots and long green stalks, tied with a string.
5. A raw bamboo shoot: a whole conical bamboo shoot with overlapping brown-tan husk leaves and a pale tip.
6. A raw head of green cabbage: whole round cabbage with veined outer leaves, one leaf slightly peeled away.
7. Raw bean sprouts (moyashi): a loose bundle of white crunchy bean sprouts with pale-yellow heads and long thin tails.
8. Raw carrots: two whole orange carrots with their feathery green tops still attached.
9. A whole raw beef loin: one big piece of marbled red beef loin, rectangular, with a little fat cap, not sliced.
```

---

## B. Platos terminados (hojas `platos-*`)

Cada plato es **la imagen final del plato servido**: es lo que verá el jugador en el **Recetario** (tarjetas y detalle) y, más adelante, en las comandas, la ficha del Maestro y el recorrido de Japón. Se muestra a unos **200×150 px** en pantalla; se exporta a **400×300** (retina).

> **Importante:** ya existen dibujos de emplatado hechos por código dentro del juego (los que ves al emplatar). Estas imágenes **no los reemplazan**: son el "plato de presentación". Si más adelante quieres que también sustituyan al dibujo del emplatado, lo hablamos plato por plato.

### Bloque ESTILO para platos (pegar siempre)

```
STYLE (identical for every dish on the sheet):
- digital sticker illustration of ONE finished dish, served: a thick pure-white outline hugging the whole silhouette (vessel included), plus a thin dark-brown (#2b1810) inner contour line
- soft cel shading with 3 tones and a small white highlight at the top-left; light from the top-left; rich, vibrant, mouth-watering colors; polished mobile-game look
- camera: 3/4 top-down view at about 50 degrees, so the food on top and the inner side of the vessel are both clearly visible
- every dish sits in the SAME type of vessel (stated per sheet), same size, centered in its cell, filling about 85% of the cell width
- no text, no labels, no numbers, no cell borders, no cutlery, no table, no floor shadow
- solid flat magenta background (#FF00FF) everywhere; pure magenta, purple or violet must NOT appear in any food or vessel
- leave generous empty space between dishes; nothing may overlap or touch a neighbor
- toppings must be legible at small size: bold, simple shapes, not tiny noise
```

### Hoja `platos-ramen` · 9 ramen (3×3) — vasija: cuenco hondo de cerámica

Vasija común: *"wide deep ceramic ramen bowl, dark glossy red-brown glaze outside, cream inside, a thin gold rim"*.

| | Col 1 | Col 2 | Col 3 |
|---|---|---|---|
| **F1** | Shio | Shoyu | Miso |
| **F2** | Tonkotsu | Chashu | Ebi |
| **F3** | Tan tan | Vegetariano | Bajiru |

```
Create one dish sheet: a grid of 3 rows x 3 columns (9 separate ramen bowls), each bowl centered in its own cell with generous empty space around it.
Vessel for all: a wide deep ceramic ramen bowl, dark glossy red-brown glaze outside, cream inside, thin gold rim.
Dishes in reading order:
1. SHIO ramen: clear pale-golden light broth, thin straight noodles, two rolled slices of chashu pork, half a marinated egg with a jammy yolk, a pile of white bean sprouts, one standing nori sheet, white sesame seeds, green scallion rings and fine scallion curls.
2. SHOYU ramen: clear dark-brown soy broth, thin noodles, chashu slices, half marinated egg, bamboo shoots (menma), a few green snow peas, one standing nori sheet, scallion curls and sesame.
3. MISO ramen: opaque orange-brown miso broth, thin noodles, chashu slices, half marinated egg, bamboo shoots, green snow peas, one standing nori sheet, scallion curls and sesame.
4. TONKOTSU ramen: thick creamy opaque white-beige pork-bone broth, thin noodles, chashu slices, half marinated egg, cooked cabbage leaves, bean sprouts, one standing nori sheet, scallion curls and sesame.
5. CHASHU ramen: creamy tonkotsu broth, noodles, and the star: a generous fan of FOUR thick glossy chashu slices with caramelized edges; half marinated egg, one standing nori sheet, scallion curls and sesame.
6. EBI ramen: pale broth with a warm pink-orange tint, noodles, three large cooked pink shrimps with tails, sliced button mushrooms, two green asparagus spears, half marinated egg, one standing nori sheet, scallion curls and sesame.
7. TAN TAN ramen: red-orange spicy sesame broth with chili-oil droplets, noodles, a mound of seasoned ground pork in the center, half marinated egg, bean sprouts, one standing nori sheet, scallion curls and sesame.
8. VEGETARIAN ramen (no meat, no egg): light golden vegetable broth, noodles, fried tofu triangles, shiitake mushrooms, button mushrooms, asparagus spears, bamboo shoots, one standing nori sheet, scallion curls and sesame.
9. BAJIRU ramen: broth tinted green by basil sauce, noodles, thin laminated slices of beef brisket, half marinated egg, strands of wanji seaweed, a few carrot slices, one standing nori sheet, scallion curls and sesame.
```

### Hoja `platos-salteados` · 9 salteados (3×3) — vasija: plato llano

Vasija común: *"wide round flat off-white ceramic plate with a thin dark-blue rim"*.

| | Col 1 | Col 2 | Col 3 |
|---|---|---|---|
| **F1** | Chaufa Shimaya | Chicken Teriyaki | Batayaki Ramen |
| **F2** | Yakimeshi | Yakiramen | Yasaitame |
| **F3** | Yakitori | Karameshi | Omuraisu |

```
Create one dish sheet: a grid of 3 rows x 3 columns (9 separate plated dishes), each plate centered in its own cell with generous empty space around it.
Vessel for all: a wide round flat off-white ceramic plate with a thin dark-blue rim.
Dishes in reading order:
1. CHAUFA SHIMAYA: Peruvian-Japanese fried rice, golden-brown with egg bits, pork pieces, sliced mushrooms and bean sprouts, scallion rings; crispy golden wonton strips on top; a small pile of red pickled ginger (benishoga) at the edge.
2. CHICKEN TERIYAKI: a mound of white steamed rice, glossy teriyaki-glazed chicken pieces on top with sesame seeds, and a side of cold shredded cabbage and carrot salad with a mayonnaise drizzle.
3. BATAYAKI RAMEN: a band of stir-fried ramen noodles across the center, topped with sliced beef loin, mushrooms and green snow peas in a glossy brown sauce; on one side golden fried leek pieces with a ponzu sauce drizzle and thin red chili rings.
4. YAKIMESHI: simple Japanese fried rice, light golden grains with scrambled egg, chicken cubes, small carrot dice, green snow peas and bits of bell pepper.
5. YAKIRAMEN: stir-fried ramen noodles with chicken pieces and colorful vegetables: onion, cabbage, zucchini, broccoli florets, bell pepper strips, bean sprouts and a few beet slices.
6. YASAITAME: a vegetable stir-fry (onion, zucchini, cabbage, bean sprouts, broccoli, bell pepper) with strips of beef loin in a glossy brown sauce, sprinkled with white sesame.
7. YAKITORI: three glazed grilled chicken skewers lying on the plate, next to a small salad of shredded cabbage, carrot, red beet strips, cucumber slices and wanji seaweed with a pink-red tuna poke sauce.
8. KARAMESHI: spicy fried rice with a red-orange tint from chili sauce, chicken, egg, green snow peas, cabbage, bean sprouts, white sesame, red chili rings and scallion on top.
9. OMURAISU: a smooth golden-yellow omelet dome covering rice, with a zigzag of red-brown katsu sauce and a darker omuraisu sauce, a mayonnaise drizzle, and a side of steamed green asparagus and carrot slices.
```

### Hoja `platos-makis` · 9 makis (3×3) — vasija: tabla

Vasija común: *"a rectangular dark-wood serving board with rounded corners"*, con 6 a 8 piezas de maki cortadas y la sección visible.

| | Col 1 | Col 2 | Col 3 |
|---|---|---|---|
| **F1** | Maki Acevichado | Maki Furai | Maki Hotate |
| **F2** | Maki California | Maki Guacamole | Maki Yama |
| **F3** | Maki Nin Niku | Maki Amazon | Maki Digion |

```
Create one dish sheet: a grid of 3 rows x 3 columns (9 separate maki servings), each serving centered in its own cell with generous empty space around it.
Vessel for all: a rectangular dark-wood serving board with rounded corners, with 6 maki roll pieces cut and standing so the cross-section is visible.
Dishes in reading order:
1. MAKI ACEVICHADO: rolls with shrimp and avocado inside, topped with thin slices of fresh tuna, a drizzle of creamy yellow acevichada sauce, small crispy sweet-potato strips and red togarashi sprinkles.
2. MAKI FURAI: tempura-fried rolls with a golden panko crust, cross-section showing avocado, shrimp and cream cheese, black sesame on top.
3. MAKI HOTATE: rolls with shrimp and avocado, topped with seared white scallop slices, a pale cream hotate sauce, red togarashi and a small lemon slice at the board corner.
4. MAKI CALIFORNIA: inside-out rolls coated in black sesame seeds, cross-section showing shrimp, avocado and cream cheese, a tiny soy sauce dish beside them.
5. MAKI GUACAMOLE: rolls with tuna and crispy fried wonton strips, topped with bright green guacamole sauce, a few drops of red chili oil, scallion rings and red togarashi.
6. MAKI YAMA: rolls with shrimp and avocado, topped with torched tuna tartare, a dark teriyaki glaze and a pale yama sauce drizzle, scallion rings and red togarashi.
7. MAKI NIN NIKU: rolls with shrimp and avocado, topped with torched tuna slices glazed in golden-brown garlic sauce, red togarashi.
8. MAKI AMAZON: rolls with avocado and slices of cured meat inside, topped with crispy golden-green plantain chips (chifle) and shreds of cured meat.
9. MAKI DIGION: rolls with shrimp and avocado, topped with torched tuna slices, a creamy pale-yellow dijon mustard sauce and black sesame seeds.
```

### Hoja `platos-frituras` · 9 frituras (3×3) — vasija: plato o bandeja

Vasija común: *"a round off-white ceramic plate with a thin dark-blue rim, with a bed of fresh shredded cabbage"* (Gyozas y Age Gyozas sobre un plato rectangular pequeño está bien si lo pide la forma).

| | Col 1 | Col 2 | Col 3 |
|---|---|---|---|
| **F1** | Gyozas | Chicken Katsu | Age Gyozas |
| **F2** | Alitas Acevichadas | Alitas Digión | Ebi Furai |
| **F3** | Kaarage | Katsu Kare | Tonkatsu |

```
Create one dish sheet: a grid of 3 rows x 3 columns (9 separate plated dishes), each plate centered in its own cell with generous empty space around it.
Vessel for all: a round off-white ceramic plate with a thin dark-blue rim.
Dishes in reading order:
1. GYOZAS (boiled/steamed): five pleated glossy dumplings with pork and shrimp filling, a small dish of ponzu dipping sauce, a little shredded cabbage and beet, scallion curls, red togarashi.
2. CHICKEN KATSU: a golden panko-crusted chicken cutlet cut into strips, katsu sauce drizzle, shredded cabbage and carrot, a mayonnaise drizzle, a mound of steamed rice, scallion curls, red togarashi.
3. AGE GYOZAS (fried): five golden crispy pan-fried dumplings on a bed of shredded cabbage and red beet, teriyaki sauce drizzle, scallion rings.
4. ALITAS ACEVICHADAS: six glossy fried chicken wings coated in creamy yellow-orange acevichada sauce, sweet-potato slices, fresh culantro leaves, thin red chili slices, red togarashi.
5. ALITAS DIGION: six fried chicken wings coated in a golden dijon mustard glaze, black sesame seeds, chopped scallion.
6. EBI FURAI: six golden panko-fried shrimp standing upright with their tails up, a salad of shredded cabbage and red beet, mayonnaise, teriyaki sauce, scallion curls, red togarashi.
7. KAARAGE: seven pieces of crunchy Japanese fried chicken with a light potato-starch crust, shredded cabbage and carrot, Japanese mayonnaise, red togarashi, scallion curls.
8. KATSU KARE: a sliced golden pork cutlet covered with thick glossy brown Japanese curry sauce, a mound of steamed rice, shredded cabbage, red beet, a mayonnaise drizzle.
9. TONKATSU: a sliced golden pork cutlet with katsu sauce on top, shredded cabbage, red beet, a mound of steamed rice, a mayonnaise drizzle, red togarashi.
```

---

## Qué necesito que me confirmes (supuestos míos)

- **Pichikata (#112):** no sé qué es en tu cocina; lo dibujé como una **mezcla de especias molida en un cuenco**. Si es otra cosa (una hierba, una salsa), dime y cambio la línea 4 de `ing-1`.
- **Kiury (#117):** lo tomé como **pepino japonés (kyuri)**.
- **Maki Amazon (cobertura):** lo describí con **chifle y cecina** porque esa receta lleva ambos. Dime si la cobertura Amazon es otra cosa.
- **Gyozas:** el menú las describe como **hervidas**; las ilustré así y las **Age Gyozas** fritas.
- Los platos de cada hoja usan los ingredientes de la receta del juego (`ingredientes-por-plato.pdf`). Si ves un ingrediente de más o de menos en tu receta real, corrige la línea y pide solo ese plato.

## Cuando me envíes las hojas

```
python tools/cortar-hoja.py assets/gen/ing-1.png tools/hojas/ing-1.json
python tools/cortar-hoja.py assets/gen/platos-ramen.png tools/hojas/platos-ramen.json
```

Cada comando recorta, guarda los WebP en su carpeta y deja una hoja de contacto en `assets/gen/cortes/` para que yo la revise. Después: archivos nuevos → `sw.js` (precache) y versión nueva; los platos se conectan con `ArteUI.dish` y los crudos con `ING_RAW_ART`.
