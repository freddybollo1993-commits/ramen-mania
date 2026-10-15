# Arte del menú de inicio: guía de prompts para Gemini (Nano Banana)

**Idea:** el lado derecho del menú es una **ventana a la cocina vista desde la barra**, como si el jugador fuera un cliente sentado mirando cómo trabajan. Todo se mueve: cocineros saltean, cortan, afilan, escriben; sale vapor, parpadea el fuego, pasa gente por la ventana. Al elegir una opción del menú, la cámara se desliza a la zona de la cocina donde ocurre esa acción.

Hoy cada entrada usa un SVG fijo de 520×400 (`getArtworkSvg` en `inicio.js`). Esto lo sustituye.

## Cómo se construye una escena (capas)

```
 capa 4  efectos        vapor, llamas, chispas, pétalos (hoja de efectos, los anima el código)
 capa 3  actores        cocineros y ayudantes: hojas de 8 fotogramas, de la cintura para arriba
 capa 2  placa          la cocina de fondo CON la barra dibujada abajo (imagen fija, sin personajes)
 capa 1  luz            parpadeo cálido de las linternas y leve balanceo de cámara (lo hace el código)
```

- Los actores se cortan por código justo en el borde de la barra, así que **solo hace falta dibujarlos de la cintura para arriba** (menos trabajo y menos errores entre fotogramas).
- El código controla la velocidad: en **Rash** todo va ×1,8 más rápido con luz roja; en **Zen** va más lento.
- Pantalla: 873×393, cada escena se muestra a 520×400.

## Las 5 zonas de la cocina (en vez de 13 escenas sueltas)

| Zona | Qué se ve | Entradas del menú que la usan |
|---|---|---|
| **Z1 Línea de fuego** | Wok con llamas, caldero de ramen, freidora; 3 cocineros trabajando | Jugar, Campaña, Rash (misma zona, más rápido y rojizo) |
| **Z2 Rincón del Maestro** | Tatami elevado, pizarra, té; el Maestro enseña a un aprendiz | Aprender, Aula, Cocina Libre (más lento, con té) |
| **Z3 Despensa y cuchillos** | Pared de cuchillos, estantes de frascos, gato de la suerte; un afilador y un cocinero que elige ingredientes | Mi Restaurante, Mejoras, Modo Ingredientes |
| **Z4 Pase y caja** | Máquina de tickets, riel de comandas, libro de recetas, pizarra del ranking, baúl con nube | Retos, Recetario, Ranking, Cuenta y Nube, Ajustes |
| **Z5 Ventana y puerta** | Ventana al callejón con gente pasando y puerta shoji que se abre | Recorrido por Japón, Multijugador |

Ventaja: la cocina es una sola, así que menú, juego y Japón se ven del mismo mundo. Son **5 placas + 12 hojas de actores**, no 13 escenas independientes.

## Reglas comunes

- **Estilo:** el de los 106 ingredientes y del Maestro (contorno marrón grueso `#2b1810`, tres tonos de sombreado, luz cálida de las linternas arriba).
- **Cámara:** vista frontal desde el asiento del cliente, ligeramente por encima de la barra, **sin puntos de fuga marcados** (proyección casi ortográfica, como el fondo de *Cook, Serve, Delicious!* o *Diner Dash*). La barra ocupa el 25 % inferior de la imagen.
- **Sin texto** en las imágenes (los rótulos los pone el juego). Excepción: números sueltos.
- **Los cocineros son los del juego:** subir `assets/people/cook_ramen_v1.webp` y la imagen del Maestro como referencia, pedir «same character design, now front view».
- **Mismo punto de vista, mismas proporciones y misma ropa en todos los fotogramas.** Solo cambian los brazos, la herramienta y el ingrediente.

## Bloque ESTILO (pegar siempre)

```
STYLE (use exactly the same for every image):
- cute polished mobile-game 2D art, FRONT VIEW as seen by a customer sitting at the ramen bar counter, camera slightly above the counter, almost no perspective distortion
- chunky dark-brown outline (#2b1810), uniform thickness; soft cel shading with 3 tones (light, mid, shadow); small white highlights
- warm light from paper lanterns above, slightly from the top-left; cozy evening ramen-ya mood
- palette: vermilion red #C8372D, lantern orange #F2A33A, cream #F6E7C1, wood brown #8A5A33, deep indigo #2E3A59, matcha green #7FA650, nori black #1F1A17
- vibrant, appetizing, clean vector-like look; no text, no letters, no logos, no watermark
```

---

## Paquete A1: las 5 placas de fondo (cocina vacía, sin personajes)

Cada placa: **1040×800, imagen opaca**, aspecto 13:10. Misma barra de madera en el 25 % inferior, mismos pilares y la misma pared trasera para que se pueda deslizar de una zona a la otra. **Sin personas ni vapor**: eso lo ponen las capas 3 y 4. Subir la placa Z1 como referencia al generar las demás.

### Z1 · Línea de fuego
```
SCENE: the back of a busy ramen kitchen seen from the bar, NO people. At the center a big black iron wok on a stove with the burner flame area left empty (flames drawn separately), left of it a large stock pot (ramen broth) on a second burner with a ladle hanging, right of it a deep fryer with a basket hanging on its hook. Hanging pots and utensils on a rail above, a wooden pass-through shelf with empty bowls, three paper lanterns hanging from the ceiling, a tile backsplash in indigo. In the bottom 25% a long wooden bar counter top (slightly visible top surface) with chopsticks holder, soy sauce, a tea cup and two empty ramen bowls. The space behind the counter, where cooks will stand (waist up), is left empty.
```

### Z2 · Rincón del Maestro
```
SCENE: a raised tatami teaching nook seen from the bar, NO people. A wooden blackboard/wall panel with abstract brush-stroke diagrams (no letters), a low shelf with four display items on wooden stands (a ramen bowl, a wok, a maki roll, a tempura shrimp), a small tea set and an iron teapot on a charcoal brazier (steam drawn separately), a hanging scroll with a red seal, two cushions, a shoji screen on one side. Same bar counter in the bottom 25% as the other scenes. Empty space where the master (standing, waist up) and an apprentice will be.
```

### Z3 · Despensa y cuchillos
```
SCENE: pantry and knife wall seen from the bar, NO people. Left: a tall wooden shelf with three shelves of glass jars and crates (noodles, eggs, nori, shrimp, scallions, mushrooms, tofu, pickled ginger). Right: a wall panel with a magnetic rack holding six different Japanese knives with different handle colors, a whetstone on a wooden stand with a water bowl, a maneki-neko lucky cat on a shelf with its paw empty-slot (paw drawn separately, leave the arm down). Same bar counter in the bottom 25%. Empty space for two cooks (waist up).
```

### Z4 · Pase y caja
```
SCENE: the order pass and cashier area seen from the bar, NO people. A brass-and-wood ticket machine, an order ticket rail above with a few blank tickets with small pictograms only, an open large recipe book on a lectern (pages with illustrated dishes, no letters), a wooden ranking board with three blank name plaques in gold, silver, bronze and a small trophy shaped like a ramen bowl, a treasure chest with a golden key and a cloud-shaped lantern hanging above it, a small radio and a wind chime. Same bar counter in the bottom 25%. Empty space for a cook who stamps tickets and a waiter with a ledger (waist up).
```

### Z5 · Ventana y puerta
```
SCENE: the front of the shop seen from the bar, NO people. A large wooden-framed window on the left looking out to a lantern-lit Japanese alley at dusk (cobblestones, a red torii in the far distance, Mount Fuji silhouette, cherry blossom tree), the alley is empty. On the right a sliding shoji door frame (paper panels closed) leading to a private room, a noren curtain, a small world map hanging on the wall with nine small red pins (no text). Same bar counter in the bottom 25%.
```

---

## Paquete A2: actores animados (12 hojas)

Cada hoja es **un bucle de 8 fotogramas**: **2 filas × 4 columnas**, se lee de izquierda a derecha y arriba abajo, **fondo magenta liso** (`#FF00FF`), personaje de la cintura para arriba, cortado plano en el borde inferior de cada celda. El código los reproduce a 10 fotogramas por segundo (ciclo de 0,8 s).

Plantilla (cambiar solo la línea ACCIÓN):

```
Create ONE animation sprite sheet: 2 rows x 4 columns = 8 frames of the SAME loop, read left-to-right then top-to-bottom, each frame centered in its own equal cell, nothing overlapping.
CHARACTER: [descripción del cocinero], same design as the attached reference (front view). Waist-up only, the bottom edge of each cell is a flat horizontal cut at the waist.
SAME camera, same position, same size, same clothes and same colors in all 8 frames. Only the arms, the tool and the food move.
ACTION (a smooth seamless loop, frame 8 flows back into frame 1): [ACCIÓN]
STYLE: chunky dark-brown outline (#2b1810), soft cel shading with 3 tones, vector-like game art, solid flat magenta background (#FF00FF), pure magenta must not appear inside the character, no text.
```

| # | Zona | Actor | ACCIÓN (8 fotogramas) |
|---|---|---|---|
| 1 | Z1 | Cocinero de wok | holds the wok handle with the left hand and a spatula with the right; frames 1-3 pull the wok back, frame 4 tosses the vegetables up in an arc (a few vegetable pieces in the air), frames 5-7 catch them, frame 8 stirs and returns |
| 2 | Z1 | Cocinero de ramen | ladles broth into a bowl: ladle goes up from the pot (1-3), swings over the bowl (4-5), pours (6-7), returns (8); the other hand holds the bowl |
| 3 | Z1 | Cocinero de freidora | lowers the fry basket into the oil (1-3), holds and shakes it (4-6), lifts it to drain (7-8) |
| 4 | Z2 | El Maestro (enseñando) | the master with white beard and apron: points to the board (1-2), looks at the viewer and gestures with an open hand (3-5), nods and strokes his beard (6-8) |
| 5 | Z2 | Aprendiz | young apprentice listening: slight nod (1-3), takes notes in a small notebook (4-6), nods again (7-8) |
| 6 | Z3 | Afilador | sharpens a knife on a whetstone: push stroke away (1-4), pull stroke back (5-8) |
| 7 | Z3 | Cocinero de despensa | reaches to the shelf (1-2), takes a jar (3-4), shows it to the viewer (5-6), puts it back (7-8) |
| 8 | Z3 | Gato de la suerte | maneki-neko paw waving up and down (8 frames, only the arm moves) |
| 9 | Z4 | Cocinero de tickets | tears a ticket from the machine (1-3), slams it on the rail with a stamp (4-5), checks it (6-8) |
| 10 | Z4 | Mozo con libreta | writes in a ledger (1-4), flips a page (5-6), looks up (7-8) |
| 11 | Z5 | Gente de la calle | two walking people seen from the front-side crossing the window from left to right (walk cycle, 8 frames; full body, this one is NOT cut at the waist) |
| 12 | Z5 | Puerta shoji | the sliding paper door opening and closing, 8 frames: closed (1), sliding open (2-4), open with a chef silhouette in the doorway (5-6), closing (7-8) |

> **Si Gemini no mantiene al personaje igual de un fotograma al otro:** generar primero el fotograma 1 y pedir cada siguiente con *«Edit: same image, only move [el brazo] [un poco]»*, o bien hacer solo **3 poses clave** (inicio, acción, final) y yo interpolo en código con balanceo y rebote. Revisar siempre que la cabeza y el cuerpo no se muevan entre fotogramas: lo corrijo alineando por el punto de la cintura.

---

## Paquete A3: efectos (1 a 2 hojas)

Mismo formato (2×4 = 8 fotogramas por efecto, fondo magenta). Los efectos se colocan en los puntos que yo marco en cada placa.

```
Create ONE effects sprite sheet with 4 rows x 4 columns (each row is a 4-frame seamless loop of a game effect, read left to right), each frame centered in its own cell, nothing overlapping.
Row 1: soft white steam wisps curling upward, shape drifting smoothly.
Row 2: stylized orange-yellow flame with red core, flickering (tall version).
Row 3: golden sparks and small embers flying up from a hot wok, fading.
Row 4: pale pink cherry blossom petals falling and rotating.
STYLE: chunky dark-brown outline (#2b1810) except the steam which has a soft pale outline; soft cel shading, vector-like; each effect fills 80% of its cell; solid flat magenta background (#FF00FF), pure magenta must not appear inside any effect; no text.
```
Segunda hoja (misma plantilla): chorro de agua/caldo, destello dorado de 4 puntas, luciérnaga/luz de linterna, polvo de harina.

---

## Alternativa rápida: bucles de video (para probar)

Si quieres ver el efecto «cocina viva» sin esperar las hojas: generar con Veo/Gemini un **video corto en bucle de 4 s** de cada placa, cámara fija, mismas reglas de estilo. Se reproduce en el menú como `<video muted loop playsinline>` (WebM de 300–500 KB cada uno).
- Ventajas: se ve vivo desde el primer día.
- Desventajas: no se puede acelerar en Rash ni separar los actores, el corte del bucle suele notarse, pesa más y consume más batería. **Recomiendo las capas** como solución final y el video solo como prueba de concepto de Z1.

---

## Paquete B: íconos de lista (2 hojas)

Sustituyen los emojis del panel izquierdo. Mismo formato que las hojas de ingredientes (4×3, fondo magenta, una hoja por mensaje). Vista frontal, un solo objeto con silueta clara a 40 px.

| Hoja | Íconos (izquierda a derecha, arriba a abajo) |
|---|---|
| B1 | Jugar (cuenco de ramen humeante), Aprender (pergamino con birrete), Mi Restaurante (casita con linterna), Ajustes (engranaje), Campaña (linterna roja con estrella), Rash (llama con rayo), Japón (torii rojo), Multijugador (dos cuencos que chocan), Aula (pizarra de madera con cuchara), Retos (medalla en cinta), Cocina Libre (tetera), Ingredientes (cesta de verduras) |
| B2 | Mejoras (cuchillo de cocina), Recetario (libro con lazo), Ranking (trofeo), Cuenta y Nube (nube con llave), Sonido (bocina con ondas), Pantalla completa (marco con flechas hacia fuera), Actualizar (flechas circulares), Atajos (tecla con una flecha), Menú clásico (lista con tres líneas) |

```
Create one game icon sheet: a grid of 3 rows x 4 columns (12 separate icons), each icon centered in its own cell, nothing overlapping. Front view, one object per icon with a very clear silhouette readable at 40 px.
Items in reading order: [pegar la fila de la tabla anterior, uno por celda]
STYLE: chunky dark-brown outline (#2b1810), soft cel shading with 3 tones, small white highlight top-left, vibrant colors from the ramen-shop palette, no text or numbers, solid flat magenta background (#FF00FF), pure magenta must not appear inside any icon.
```

---

## Entrega e integración (lo hago yo)

1. Guardar los PNG en `assets/gen/menu/`: `placa_z1.png`…`placa_z5.png`, `actor_01.png`…`actor_12.png`, `efectos_1.png`, `iconos_b1.png`, `iconos_b2.png`.
2. Yo recorto, quito el magenta, alineo cada fotograma por la cintura, exporto a WebP y los pongo en `assets/menu/`.
3. `inicio.js` monta la escena por capas: placa → actores (`steps(8)` sobre la hoja, recortados en el borde de la barra) → efectos → luz. Cada opción del menú desliza la cámara a su zona (≈0,5 s) y anima solo lo que se ve para ahorrar batería (se pausa si la pestaña no está visible).
4. Estados por código: **Rash** acelera ×1,8 y tiñe de rojo, **Zen** va lento y con té, **Japón** cambia la luz de la ventana a hora del día real.
5. Archivos con **nombre nuevo** (el service worker ignora el `?v=`); las placas Z1 y Z2 al instalar, el resto se precarga al abrir el menú. Peso total estimado: 5 placas ≈ 0,4 MB + 12 hojas ≈ 0,5 MB.
6. Mientras cargan o si falla algo, queda el SVG actual como respaldo.

## Orden de trabajo

| Paso | Qué | Mensajes a Gemini |
|---|---|---|
| 1 | Placa Z1 + los 3 actores de Z1 + hoja de efectos | 5 |
| 2 | Yo monto Z1 en el menú y lo ves en el Redmi | — |
| 3 | Si convence: Z2, Z3, Z4, Z5 (placa + actores) | 14 |
| 4 | Íconos B1 y B2 | 2 |

Empezar por **Z1 (Línea de fuego)**: es la zona de Jugar/Campaña/Rash, la más vista, y sirve de prueba de que el estilo y la animación por fotogramas funcionan antes de pedir el resto.
