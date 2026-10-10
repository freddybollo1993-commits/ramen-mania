# Guía para generar los íconos con Gemini (Nano Banana)

Total: **106 ingredientes** en **10 hojas** de 12 (cuadrícula de **4 columnas × 3 filas**, se lee de izquierda a derecha y de arriba abajo). Cada ingrediente aparece una sola vez.

## Cómo usarlo

1. Abre Gemini (Nano Banana) en una conversación **nueva** para cada hoja, o usa "Editar imagen" sobre la misma conversación.
2. Sube **2–3 de tus íconos favoritos** del juego como referencia de estilo (por ejemplo `assets/ingredients/ing_61_lomo.svg` exportado a PNG, `ing_15_huevo.svg`, `ing_104_pollo_cuadrado.svg`). Escribe: "Use these as style reference; match their outline, shading and proportions".
3. Pega el **bloque ESTILO** y luego el **prompt de la hoja**. Pide **una hoja por mensaje**.
4. Si algún ícono sale mal, pide solo ese: *"Redo the item in row 2, column 3 only, keep the rest identical"*.
5. Guarda cada hoja como `assets/gen/hoja_01.png`, `hoja_02.png`... (PNG, la mayor resolución posible). Yo escribo el script que las recorta en 12 íconos, quita el magenta, los centra y los exporta.

## Bloque ESTILO (pegar siempre)

```
STYLE (use exactly the same for every item):
- chunky dark-brown outline (#2b1810), uniform thickness
- soft cel shading with 3 tones (light, mid, shadow), small white highlight on the top-left
- 3/4 top-down view, same light direction for all items, same scale: each item fills about 80% of its cell
- vibrant, natural, appetizing colors; clean vector-like look (like a polished mobile game icon)
- no text, no labels, no numbers, no borders, no drop shadow on the background
- solid flat magenta background (#FF00FF) everywhere, and pure magenta must not appear inside any item
```

## Hojas

### Hoja 01 · ingredientes

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Fideo Ramen (#1) | Caldo Shio (#2) | Caldo Tonkotsu (#3) | Agua (#4) |
| **F2** | Chasu Asado (#11) | Brisket Laminado (#12) | Chancho Molido (#13) | Langostinos (#14) |
| **F3** | Huevo (#15) | Tofu Triángulos (#16) | Poro (#17) | Cebolla China (#18) |

**Prompt:**

```
Create one game icon sheet: a grid of 3 rows × 4 columns (12 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Each item is the food itself, no plate, no bowl unless stated.
Items in reading order:
1. (row 1, col 1) coiled bundle of wavy yellow ramen noodles
2. (row 1, col 2) small bowl of clear pale-golden shio broth, light steam
3. (row 1, col 3) small bowl of creamy white-beige tonkotsu pork broth, light steam
4. (row 1, col 4) clear water droplet with a small splash, light blue
5. (row 2, col 1) two glossy slices of roasted char siu pork belly with spiral fat
6. (row 2, col 2) thin sliced beef brisket fanned out, pink-brown with a white fat edge
7. (row 2, col 3) small mound of raw ground pork, pink
8. (row 2, col 4) two curled pink-orange shrimp (langostinos)
9. (row 3, col 1) one whole raw brown egg
10. (row 3, col 2) two golden fried tofu triangles
11. (row 3, col 3) leek stalk, white base and green leaves
12. (row 3, col 4) bunch of green spring onions (scallions)

[PEGAR BLOQUE ESTILO]
```

### Hoja 02 · ingredientes

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Ajonjolí Blanco (#19) | Nori (#20) | Alga Wanji (#21) | Bamboo (#22) |
| **F2** | Holantao (#23) | Col Cocida (#24) | Moyashi (#25) | Champiñones (#27) |
| **F3** | Shitake (#28) | Espárrago (#29) | Zanahoria (#30) | Ajonjolí (#33) |

**Prompt:**

```
Create one game icon sheet: a grid of 3 rows × 4 columns (12 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Each item is the food itself, no plate, no bowl unless stated.
Items in reading order:
1. (row 1, col 1) small pile of white sesame seeds
2. (row 1, col 2) rectangular sheet of dark green-black nori seaweed
3. (row 1, col 3) curly dark-green wakame seaweed strands
4. (row 1, col 4) pale-yellow bamboo shoot strips (menma)
5. (row 2, col 1) three flat green snow peas pods
6. (row 2, col 2) cooked pale-green cabbage leaf
7. (row 2, col 3) bundle of white bean sprouts with yellow tips
8. (row 2, col 4) two white button mushrooms
9. (row 3, col 1) two brown shiitake mushrooms with scored caps
10. (row 3, col 2) three green asparagus spears
11. (row 3, col 3) one orange carrot with green top
12. (row 3, col 4) small pile of white sesame seeds

[PEGAR BLOQUE ESTILO]
```

### Hoja 03 · ingredientes

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Ají Limo (#35) | Arroz (#37) | Benishoga (#41) | Beterraga (#42) |
| **F2** | Brócoli (#45) | Cebolla (#46) | Chancho Chaufa (#48) | Col (#52) |
| **F3** | Ensalada (#55) | Ensalada Fría (#56) | Lomo (#61) | Negi (#63) |

**Prompt:**

```
Create one game icon sheet: a grid of 3 rows × 4 columns (12 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Each item is the food itself, no plate, no bowl unless stated.
Items in reading order:
1. (row 1, col 1) small red and yellow limo chili pepper (aji limo)
2. (row 1, col 2) mound of cooked white rice
3. (row 1, col 3) red pickled ginger strips (benishoga)
4. (row 1, col 4) purple-red beetroot with leaves
5. (row 2, col 1) broccoli floret
6. (row 2, col 2) yellow-brown onion
7. (row 2, col 3) diced roasted pork cubes (chancho chaufa), caramelized brown
8. (row 2, col 4) green cabbage wedge
9. (row 3, col 1) small mixed green salad
10. (row 3, col 2) cold salad with cucumber slices, carrot and lettuce
11. (row 3, col 3) raw beef loin piece, deep red with marbling
12. (row 3, col 4) thin sliced green onion (negi) rings

[PEGAR BLOQUE ESTILO]
```

### Hoja 04 · ingredientes

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Pimentón (#67) | Pimiento (#68) | Pollo (#69) | Poro Especial (#71) |
| **F2** | Tortilla (#93) | Wantán (#94) | Zucchini (#95) | Mantequilla (#100) |
| **F3** | Limón (#102) | Cebolla Caramelizada (#103) | Pollo Cuadrado (#104) | Pollo en Tiras (#105) |

**Prompt:**

```
Create one game icon sheet: a grid of 3 rows × 4 columns (12 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Each item is the food itself, no plate, no bowl unless stated.
Items in reading order:
1. (row 1, col 1) red bell pepper
2. (row 1, col 2) green bell pepper
3. (row 1, col 3) chicken drumstick
4. (row 1, col 4) leek (poro especial), white and light green stalk
5. (row 2, col 1) flat round golden yellow omelette (tortilla)
6. (row 2, col 2) golden fried wonton dumpling
7. (row 2, col 3) green zucchini
8. (row 2, col 4) yellow butter pat
9. (row 3, col 1) whole yellow lemon with a leaf
10. (row 3, col 2) pile of dark golden caramelized onion
11. (row 3, col 3) diced chicken cubes
12. (row 3, col 4) raw chicken strips

[PEGAR BLOQUE ESTILO]
```

### Hoja 05 · ingredientes

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Pollo Teriyaki (#106) | Pollo Yakitori (#107) | Ajonjolí Negro (#34) | Arroz Shari (#38) |
| **F2** | Atún (#39) | Cecina (#47) | Cobertura de Atún (#49) | Cobertura de Conchas (#50) |
| **F3** | Cobertura Amazon (#51) | Ebi (Langostino) (#54) | Hilos de Wantán (#59) | Palta (#64) |

**Prompt:**

```
Create one game icon sheet: a grid of 3 rows × 4 columns (12 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Each item is the food itself, no plate, no bowl unless stated.
Items in reading order:
1. (row 1, col 1) glazed teriyaki chicken pieces, dark brown with sesame
2. (row 1, col 2) yakitori skewer with three glazed chicken pieces
3. (row 1, col 3) small pile of black sesame seeds
4. (row 1, col 4) glossy seasoned sushi rice mound
5. (row 2, col 1) raw red tuna block
6. (row 2, col 2) thin slices of dark brown cured beef (cecina)
7. (row 2, col 3) fan of sliced raw tuna topping, red-pink
8. (row 2, col 4) three white sliced scallop pieces
9. (row 3, col 1) slices of vivid green herb-crusted topping
10. (row 3, col 2) cooked pink shrimp for sushi, curled with white stripes
11. (row 3, col 3) crispy golden fried wonton strips
12. (row 3, col 4) halved avocado with pit

[PEGAR BLOQUE ESTILO]
```

### Hoja 06 · ingredientes

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Ajo Chino (#32) | Alas de Pollo (#36) | Bife de Cerdo (#43) | Bife de Pollo (#44) |
| **F2** | Condimentos (#53) | Gohan (#57) | Harina (#58) | Langostino (6 und) (#60) |
| **F3** | Panko (#65) | Pasta (#66) | Pollo (7 piezas) (#70) | Relleno Langostino y Chancho (#73) |

**Prompt:**

```
Create one game icon sheet: a grid of 3 rows × 4 columns (12 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Each item is the food itself, no plate, no bowl unless stated.
Items in reading order:
1. (row 1, col 1) bunch of flat green Chinese garlic chives
2. (row 1, col 2) two raw chicken wings
3. (row 1, col 3) raw pink pork cutlet
4. (row 1, col 4) raw chicken breast cutlet
5. (row 2, col 1) small bowl of mixed seasoning spices
6. (row 2, col 2) bowl of steamed white rice (gohan)
7. (row 2, col 3) small pile of white flour
8. (row 2, col 4) six raw shrimp
9. (row 3, col 1) pile of golden panko breadcrumbs
10. (row 3, col 2) stack of round white gyoza wrappers
11. (row 3, col 3) seven raw chicken pieces for karaage
12. (row 3, col 4) small round pink filling ball of shrimp and pork

[PEGAR BLOQUE ESTILO]
```

### Hoja 07 · ingredientes

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Rulos de Cebolla China (#74) | Sal (#75) | Togarashi (#91) | Toping (#92) |
| **F2** | Wasabi (#96) | Jengibre (gari) (#97) | — | — |
| **F3** | — | — | — | — |

**Prompt:**

```
Create one game icon sheet: a grid of 2 rows × 4 columns (6 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Each item is the food itself, no plate, no bowl unless stated.
Items in reading order:
1. (row 1, col 1) curled shredded spring onion curls
2. (row 1, col 2) small pile of coarse white salt crystals
3. (row 1, col 3) small pile of red togarashi chili flakes
4. (row 1, col 4) sprinkle of crunchy golden topping bits
5. (row 2, col 1) dollop of green wasabi paste
6. (row 2, col 2) pink pickled ginger slices (gari)

[PEGAR BLOQUE ESTILO]
```

### Hoja 08 · salsas

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Salsa Shoyu (#5) | Salsa Miso (#6) | Salsa Ebi (#7) | Salsa Tan Tan (#8) |
| **F2** | Salsa Vegetariana (#9) | Salsa Bajiru (#10) | Base Yakimeshi (#40) | Salsa Batayaki (#78) |
| **F3** | Base Chaufa (#79) | Salsa Katsu (#84) | Salsa Omuraisu (#86) | Salsa Teriyaki (#87) |

**Prompt:**

```
Create one game icon sheet: a grid of 3 rows × 4 columns (12 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Each item is a small round white ceramic dipping dish seen from 3/4 top, filled with the sauce, with a glossy highlight (the sauce color is the main color).
Items in reading order:
1. (row 1, col 1) dark brown soy (shoyu) sauce
2. (row 1, col 2) tan-brown miso sauce
3. (row 1, col 3) orange-red shrimp (ebi) sauce
4. (row 1, col 4) red chili tan-tan sauce
5. (row 2, col 1) green vegetable sauce
6. (row 2, col 2) green basil (bajiru) sauce
7. (row 2, col 3) red-brown yakimeshi base sauce
8. (row 2, col 4) amber batayaki sauce
9. (row 3, col 1) brown chaufa base sauce
10. (row 3, col 2) dark brown tonkatsu sauce
11. (row 3, col 3) orange-red omuraisu sauce
12. (row 3, col 4) dark glossy teriyaki sauce

[PEGAR BLOQUE ESTILO]
```

### Hoja 09 · salsas

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Salsa Yakitori (#88) | Salsa Yasaitame (#90) | Salsa Ponzu (#98) | Licor de Arroz (#99) |
| **F2** | Aceite Yakitori (#101) | Queso Crema (#72) | Salsa Acevichada (#77) | Salsa Digión (#80) |
| **F3** | Salsa Guacamole (#81) | Salsa Hotate (#82) | Salsa Nin Niku (#85) | Salsa Yama (#89) |

**Prompt:**

```
Create one game icon sheet: a grid of 3 rows × 4 columns (12 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Each item is a small round white ceramic dipping dish seen from 3/4 top, filled with the sauce, with a glossy highlight (the sauce color is the main color).
Items in reading order:
1. (row 1, col 1) dark glossy yakitori sauce
2. (row 1, col 2) light brown yasaitame sauce
3. (row 1, col 3) light brown ponzu sauce with a lemon slice
4. (row 1, col 4) clear pale rice liquor (sake)
5. (row 2, col 1) golden yakitori oil
6. (row 2, col 2) white block of cream cheese
7. (row 2, col 3) yellow-cream acevichada sauce
8. (row 2, col 4) mustard-yellow dijon sauce
9. (row 3, col 1) green guacamole sauce
10. (row 3, col 2) cream-white scallop (hotate) sauce
11. (row 3, col 3) cream garlic (nin niku) sauce
12. (row 3, col 4) orange yama sauce

[PEGAR BLOQUE ESTILO]
```

### Hoja 10 · salsas

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **F1** | Aceite Ajonjolí (#31) | Mayonesa de la Casa (#62) | Salsa (#76) | Salsa Kare (#83) |
| **F2** | — | — | — | — |
| **F3** | — | — | — | — |

**Prompt:**

```
Create one game icon sheet: a grid of 1 rows × 4 columns (4 separate icons), each icon centered in its own cell with generous empty space around it, nothing overlapping.
Each item is a small round white ceramic dipping dish seen from 3/4 top, filled with the sauce, with a glossy highlight (the sauce color is the main color).
Items in reading order:
1. (row 1, col 1) amber sesame oil
2. (row 1, col 2) white house mayonnaise
3. (row 1, col 3) red wing sauce
4. (row 1, col 4) brown japanese curry (kare) sauce

[PEGAR BLOQUE ESTILO]
```

## Variantes (después, usando "editar" sobre el ícono base)

Estos ingredientes se ven distinto según el momento. Pídelos editando el ícono ya generado (*"same item, but …"*):

| Ingrediente | Variante a generar |
|---|---|
| Huevo (#15) | crudo entero (Salteado) · medio huevo marinado de yema suave (Ramen) |
| Lomo (#61) | pieza entera cruda (Producción) · tiras ya cortadas (Cocina y Emplatar) |
| Poro (#17 / #71) | tallo entero · rodajas cortadas · rodajas fritas con harina |
| Moyashi (#25) | crudo con impurezas · limpio · blanqueado |
| Cebolla (#46) / Cebolla Caramelizada (#103) | entera · cortada · caramelizada |
| Arroz (#37) | crudo en grano · lavado · cocido |
| Pollo (#104–#107) | crudo · cocido (cuadrado, tiras, teriyaki, brocheta) |
| Col (#24 / #52) | entera · rallada · cocida |
| Zanahoria (#30) | entera · en rodajas |
| Champiñones / Shitake (#27, #28) | enteros · laminados |

## Platos terminados (opcional, para el Emplatar)

Genera aparte el **plato base vacío** (llano, hondo y bol) y las piezas sueltas; el juego las compone en capas. Prompt de plato vacío:

```
3 empty ceramic dishes for a Japanese restaurant game, seen from 3/4 top: a flat white plate with a thin dark-brown rim, a deep round bowl, and a rectangular black stone plate. Same outline and shading style as the references. [PEGAR BLOQUE ESTILO]
```

## Consejos

- **A tamaño real:** los íconos se ven a 19–25 px en la despensa; mira la hoja reducida a ese tamaño. Si no se reconoce, pide una versión más simple y con más contraste.
- **Consistencia:** reutiliza siempre las mismas imágenes de referencia y el mismo bloque ESTILO; no cambies palabras entre hojas.
- **Sin texto:** las letras suelen salir mal. Los sachets y el salero siguen siendo SVG.
- **Revisión:** revisa que no haya magenta dentro del ícono y que el contorno sea del mismo grosor.
