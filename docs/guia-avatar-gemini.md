> **Estado (v211):** se adoptó el método de **piezas sueltas** (muñeco de recortes) en lugar de capas sobre el cuerpo entero: cada hoja de Gemini trae varias piezas separadas con el mismo estilo y yo las coloco con `tools/cortar-partes.js` y las animo en `avatar.js`. Ya integradas: cuerpo (cabeza con ojos abiertos y cerrados, brazos, piernas), 6 peinados (en gris, el juego los tiñe), 6 gorros y 3 prendas (camiseta, sudadera, chaqueta de chef). El tono de piel y el color del pelo se aplican por código, así que no hacen falta hojas por tono.
> **Faltan hojas:** ropa B (happi, yukata, traje de gala), delantales (torso en gris para teñir), accesorios de cara (gafas, gafas de sol, bigote, mascarilla, flor) y, más adelante, utensilios para la mano.

# Avatar del chef con Gemini (Nano Banana): guía por etapas

Sustituye al muñeco dibujado con código (`avatar.js`, v210) por arte generado en un estilo de **personaje 3D de juego móvil de combate**: cabeza grande, aspecto de juguete brillante, contorno oscuro grueso, colores saturados, luz de borde. El muñeco actual sirve de **plano**: mismas proporciones y misma pose, así las piezas encajan.

> Nada de nombrar juegos ni personajes de terceros en los prompts: se describe el estilo, no se copia a nadie.

## Cómo se arma el avatar (para que las piezas encajen)
El muñeco son capas apiladas, todas en **el mismo lienzo vertical 2:3** (`ref_pose.png`, 832 × 1248 px) y con el personaje en el mismo sitio. De atrás hacia delante:

| Orden | Capa | Notas |
|---|---|---|
| 1 | Pelo de atrás | solo los peinados con pelo detrás de la cabeza (melena, coleta, moño) |
| 2 | Cuerpo | cabeza con cara, orejas, manos, piernas y zapatos. **Seis tonos de piel** |
| 3 | Ropa (+ delantal) | solo torso y mangas. **Nunca tapa la cabeza ni las manos**; las mangas terminan sobre la muñeca |
| 4 | Accesorio de cara | gafas, mascarilla, bigote, flor |
| 5 | Pelo de delante | flequillo y mechones sobre la frente |
| 6 | Gorro | hachimaki, tenugui, orejas de gato, gorro de chef, kasa, corona |

El **color del pelo lo cambia el juego** (tiñe la capa), así que cada peinado se genera **una sola vez, en gris claro** con sus sombras.

## Reglas del lienzo (valen para todas las imágenes)
- Lienzo vertical **2:3**, el personaje de **cuerpo entero, de frente**, centrado, con los pies en la misma altura que en `ref_pose.png`.
- Fondo **magenta plano `#FF00FF`**; el magenta puro no puede aparecer dentro del dibujo.
- Sin texto, sin sombra en el suelo, sin cuadrícula.
- Cada pieza, **sola**, en su posición exacta sobre el personaje (como si lo llevara puesto, pero sin dibujarlo).
- Guardar los PNG en `assets/gen/avatar/` con el nombre indicado. Yo corto, quito el magenta, alineo y exporto a WebP.

## Bloque ESTILO (en todos los prompts)
```
STYLE: stylized 3D-rendered chibi character for a mobile game, glossy toy-like look, big head and small body, thick dark-brown outline (#2b1810), soft smooth shading with a bright rim light, saturated warm colors, small crisp white highlights, clean and polished, slightly exaggerated cute proportions. Flat solid magenta background (#FF00FF) everywhere; pure magenta must not appear inside the character. No text, no letters, no numbers, no ground shadow, no grid lines.
```

---

## ETAPA 1 · El personaje base (decide el estilo)
Adjunta `assets/gen/avatar/ref_pose.png` y pide **3 o 4 versiones** (cambia solo la línea FACE si quieres variar). Elige la que más te guste: será la base de todo lo demás.

```
Use the attached image ONLY as the reference for pose, proportions, camera and canvas (a chibi character, front view, full body, centered, arms hanging at the sides, feet together, vertical 2:3 canvas). Do NOT copy its flat 2D drawing style.

Create a NEW character with the SAME pose, camera, canvas and proportions (head about 45% of the total height, small body, short legs), redrawn in the 3D chibi style below. The character is a young cook, friendly and charismatic.

CHARACTER: a cheerful young chef, light warm skin, big expressive dark eyes with white highlights, rosy cheeks, a small happy open-mouth smile, short dark hair with a side fringe, a plain red t-shirt with short sleeves, dark blue trousers, white sneakers. Arms hanging relaxed, hands open and visible below the sleeves.

STYLE: stylized 3D-rendered chibi character for a mobile game, glossy toy-like look, big head and small body, thick dark-brown outline (#2b1810), soft smooth shading with a bright rim light, saturated warm colors, small crisp white highlights, clean and polished, slightly exaggerated cute proportions. Flat solid magenta background (#FF00FF) everywhere; pure magenta must not appear inside the character. No text, no letters, no numbers, no ground shadow, no grid lines.
```
**Guardar como:** `assets/gen/avatar/base_a.png`, `base_b.png`, … (la elegida: `base.png`).

**Revisa:** cabeza grande y legible a 200 px de alto, orejas visibles, manos abiertas, contorno parejo, nada de magenta dentro.

---

> **Base aprobada** (`assets/gen/avatar/base.jpg`, 1696 × 2528, sin contorno, magenta limpio). Desde aquí las piezas se piden **sin contorno**: el juego dibuja un único borde oscuro alrededor del conjunto. Así no se ven líneas entre pelo, gorro y ropa.
>
> **BLOQUE ESTILO SIN CONTORNO**
> ```
> STYLE: the same stylized 3D-rendered chibi look as the attached character: glossy toy-like materials, soft smooth shading, bright rim light, saturated colors, small crisp highlights. NO outline, no dark border, no white halo: the edges are defined only by the shading. Same canvas size and vertical 2:3 aspect ratio as the attached image. Flat solid magenta background (#FF00FF) everywhere, clean crisp edges; pure magenta must not appear inside the object. No text, no ground shadow.
> ```

## ETAPA 2 · Prueba de capas (antes de pedir las 46 piezas)
Con `base.png` ya elegida, comprobamos que Gemini **respeta la posición**. Se piden **cuatro imágenes sueltas**, cada una con `base.png` adjunta:

**2A · Pelo de delante (peinado corto, en gris claro)**
```
Attached is a character. Draw ONLY its hair FRONT layer (the fringe and the top of the hair that sits above the forehead), exactly where it is on the attached character: same position, same size, same canvas. Do NOT draw the head, face, body or anything else. The hair is a light neutral grey (#d9d9d9) with soft shading and a white highlight, so it can be tinted later. The fringe must reach the same hairline as in the attached image.
[BLOQUE ESTILO SIN CONTORNO]
```
**2B · Gorro (hachimaki)**
```
Attached is a character. Draw ONLY a white hachimaki headband with a red circle at the front and two small knot tails on the right side, exactly where it would sit on the attached character's forehead: same position, same size, same canvas. Do NOT draw the head, hair, face or body.
[BLOQUE ESTILO SIN CONTORNO]
```
**2C · Ropa (chaqueta de chef)**
```
Attached is a character. Draw ONLY a white double-breasted chef jacket (torso and both long sleeves, a small stand collar, two rows of dark blue buttons), exactly where it would be worn by the attached character: same position, same size, same canvas. The sleeves end just above the wrists so the hands stay uncovered. The jacket must NOT cover the head or the hands. Do NOT draw the head, face, hands, legs or any other part of the character.
[BLOQUE ESTILO SIN CONTORNO]
```
**2D · Cuerpo en otro tono de piel**
```
Attached is a character. Redraw the SAME character in the SAME position, size and canvas, but without hair and without the red t-shirt: a bald head with the same face, ears and neck, bare arms ending in open hands, a plain dark grey sleeveless top, dark blue trousers and white sneakers. Change only the skin tone to deep brown (#8a5a3c). Keep the face, the eyes and the expression identical.
[BLOQUE ESTILO SIN CONTORNO]
```
**Guardar como:** `test_pelo.png`, `test_gorro.png`, `test_ropa.png`, `test_cuerpo_moreno.png`.

**Qué haré yo con ellas:** las superpongo sobre `base.png`, mido cuánto se desvían y te digo si el método sirve. Tres desenlaces posibles:
1. **Encajan** (o con un pequeño ajuste por pieza que corrijo yo): seguimos con las 46 piezas sueltas.
2. **Se desvían mucho:** cambiamos a **trajes completos** (cada traje es el personaje entero, como las skins de los juegos de combate) y dejamos como piezas sueltas solo gorros y accesorios.
3. **El estilo no convence:** repetimos la Etapa 1 con otra descripción antes de gastar más.

---

## ETAPA 3 · Catálogo completo (solo si la Etapa 2 sale bien)
Se pide pieza por pieza con la misma plantilla de 2A–2C. Lista de lo que ya existe en el juego (precios de `avatar.js`, ajustables):

| Capa | Piezas |
|---|---|
| Pelo (gris, atrás y delante) | corto · erizado · moño · coleta · melena · casi rapado |
| Gorro | hachimaki · pañuelo tenugui · orejas de gato · gorro de chef · sombrero kasa · corona dorada |
| Ropa | camiseta roja · sudadera gris · chaqueta de chef · happi de festival · yukata de sakura · traje de gala |
| Delantal | marrón · blanco · índigo · rojo · negro y oro (el color lo cambia el juego si se pide en gris) |
| Cara | gafas redondas · gafas de sol · bigote · mascarilla · flor de hibisco |
| Cuerpo | 6 tonos de piel: clara · trigo · miel · canela · cacao · ébano |

Después se pueden sumar más piezas (cada pieza nueva es una imagen y una línea en el catálogo), poses de saludo y de victoria, y trajes completos de temporada.

## Qué hago yo cuando traigas las imágenes
1. Corto y quito el magenta, centro y alineo cada pieza sobre `base.png`.
2. Exporto WebP con **nombres nuevos** (la caché del juego no se salta con `?v=`).
3. Cambio en `avatar.js` el dibujo por la imagen (campo `img`) manteniendo tienda, compras y guardado.
4. Subo versión y compruebo en el panel; lo táctil y la fluidez, en tu Redmi.
