# Clientes dibujados: guía de prompts para Nano Banana (Campaña 2.0, fase 3)

Sustituyen a las tarjetas con emoji de los clientes (`CUSTOMER_TEMPLATES` en `js/04-estado-y-audio.js`: Kenji, Sakura, Hiroshi, Akemi, Takeshi, Yuki, Ren, Aoi). Se sientan en la barra frente a la cocina viva y **reaccionan a su paciencia**.

## Formato (el que ya funcionó con los cocineros)
- **Una hoja por cliente**: 2 filas × 4 columnas = 8 fotogramas, fondo magenta `#FF00FF`, vista frontal, **de la cintura para arriba**, mismo encuadre y tamaño en todos los cuadros.
- **4 estados × 2 fotogramas** (el segundo es una variación mínima para que respire o se mueva un poco):

| Celdas | Estado | Se usa cuando |
|---|---|---|
| 1-2 | **Esperando** | paciencia alta, recién llegó |
| 3-4 | **Impaciente** | paciencia < 40 % |
| 5-6 | **Feliz** | acaba de recibir su plato |
| 7-8 | **Enojado** | se va sin comer (paciencia 0) o le sirvieron mal |

- Sin mostrador, sin mesa, sin cuenco (la barra y los platos los pone el juego). Las manos quedan por encima del corte de la cintura.
- Referencia a adjuntar: `assets/gen/menu/actor_01_wok_v2.jpg` (solo para el **encuadre, tamaño y trazo**; el personaje es otro).

## Bloque ESTILO (en todos los prompts)
```
STYLE: cute polished mobile-game 2D art, chunky dark-brown outline (#2b1810), soft cel shading with 3 tones, small white highlights, warm lantern light from the top-left, vector-like. Flat solid magenta background (#FF00FF) everywhere; pure magenta must not appear inside the character. No text, no letters, no numbers, no grid lines, no ground shadow.
```

## Plantilla
```
Use the attached image ONLY as the reference for layout, camera, framing, scale and art style (a sprite sheet of 8 frames, 2 rows x 4 columns, front view, waist-up, flat magenta background). Do NOT copy its character.
Create a NEW sprite sheet with the SAME layout: exactly 2 rows x 4 columns = 8 frames, each frame centered in its own equal cell, same size and framing in every frame, front view, the character faces the viewer, waist-up with a flat cut at the waist. The head stays in the same position in every frame (no jitter).

CHARACTER (identical in all 8 frames): [DESCRIPCIÓN DEL CLIENTE]. Sitting at a ramen bar, no counter and no bowl drawn.

FRAMES (each pair is the same state; frame B is a tiny variation of frame A):
1 WAITING A: relaxed, neutral friendly look toward the kitchen, hands together in front of the chest.
2 WAITING B: same pose, eyes closed in a blink, head tilted 3 degrees.
3 IMPATIENT A: eyebrows raised, slight frown, glancing sideways at an imaginary clock, one hand with fingertips tapping in front of the chest.
4 IMPATIENT B: same, fingers lifted, head tilted 5 degrees, a small sweat drop near the temple.
5 HAPPY A: big smile, eyes closed in delight, lifting chopsticks with a few noodles.
6 HAPPY B: mouth full, cheeks puffed, slurping, small hearts or sparkles near the face.
7 ANGRY A: furious eyebrows, clenched teeth, arms crossed, a vein mark on the forehead.
8 ANGRY B: same, one fist raised, mouth open shouting, a small angry cloud above the head.

STYLE: cute polished mobile-game 2D art, chunky dark-brown outline (#2b1810), soft cel shading with 3 tones, small white highlights, warm lantern light from the top-left, vector-like. Flat solid magenta background (#FF00FF) everywhere; pure magenta must not appear inside the character. No text, no letters, no numbers, no grid lines, no ground shadow.
```

## Los 8 clientes (descripciones para pegar en CHARACTER)
Primer lote: Kenji, Sakura, Hiroshi, Takeshi. Segundo lote: Akemi, Yuki, Ren, Aoi.

| Cliente | Exigencia (`CUSTOMER_PICKY`) | CHARACTER |
|---|---|---|
| **Kenji** | normal (0) | A man in his thirties, short black messy hair, tanned skin, friendly eyes, a bright orange delivery-rider jacket over a grey t-shirt, a small bike-helmet strap hanging around the neck |
| **Sakura** | algo exigente (+5) | A young woman, long black hair in a high ponytail with a pink ribbon, rosy cheeks, light skin, a soft pink cardigan over a white blouse, small round earrings |
| **Hiroshi** | muy tranquilo (−8) | An elderly man, bald with thick white eyebrows and a small white goatee, kind wrinkled eyes, tanned skin, a dark green traditional haori jacket over a cream kimono collar, a small cloth bag on the shoulder |
| **Takeshi** | muy exigente (+8) | A strict businessman in his forties, slicked-back black hair, thin rectangular glasses, sharp eyebrows, light skin, a dark grey suit with a loosened red tie, a lanyard badge on the chest |
| **Akemi** | normal (0) | A cheerful girl about ten years old, short brown hair with two small buns, big sparkling eyes, a yellow raincoat-style jacket with a hood down, a freckled nose |
| **Yuki** | un poco exigente (+3) | A young woman with short platinum-blond hair and bangs, pale skin, calm blue eyes, a long pale-blue scarf and a white knit sweater, a small snowflake pin |
| **Ren** | tranquilo (−3) | A teenage boy, spiky dark-brown hair, headphones around the neck, a red hooded sweatshirt with a small star logo (no text), friendly grin |
| **Aoi** | algo exigente (+5) | A woman in her late twenties with wavy copper-red hair, green eyes, a freckled face, a teal denim jacket over a mustard sweater, a camera hanging on a strap |

## Entrega
1. Guarda cada hoja como `cliente_<nombre>.jpg` en `assets/gen/menu/clientes/` (o súbela al chat).
2. Yo recorto el magenta, alineo por la cintura, exporto a WebP (~100 KB por cliente, 8 fotogramas) y los coloco en la barra con el motor de la escena viva.
3. El juego elige la pose según la paciencia: esperando (> 40 %), impaciente (10–40 %), enojado (≤ 10 % y al irse), feliz (al servir).

## Si algo sale mal
- **Formato incorrecto (más filas, cuerpo completo, numeración):** *«Same as the attached layout, exactly 8 frames (2 rows x 4 columns), front view, waist-up. Remove numbers and extra rows.»*
- **El personaje cambia entre cuadros:** *«Redo keeping the character identical in all 8 frames; only the expression and the hands change.»*
- **Copia al cocinero de la referencia:** *«The character is NOT the cook: different face, hair and clothes, no chef hat.»*
- **Un solo cuadro mal:** *«Redo only frame 5 (row 2, column 1), keep the rest identical.»*
