# Contexto para generar los videos de la cocina viva (Veo / Gemini)

Pega este archivo completo (o súbelo) al inicio de la conversación con el generador de video, junto con las imágenes de referencia indicadas. Está pensado para que el generador entienda el juego, el estilo, los personajes, el encuadre y lo que necesitamos técnicamente.

---

## 1. Qué es el proyecto

**Ramen Mania / Shimaya** es un juego de cocina japonesa 2D para celular (horizontal, pantalla de ≈ 873×393 px). Aquí se necesita arte animado para la **pantalla de inicio**: una ventana a la cocina de un restaurante de ramen vista desde el asiento de un cliente en la barra. Los cocineros trabajan detrás del mostrador. Los videos se recortan y se colocan sobre una imagen de fondo fija, así que **cada cocinero se genera por separado, sobre fondo verde liso**.

## 2. Estilo visual (no cambiar)

- Ilustración 2D de juego móvil, pulida, estilo caricatura (cartoon), no realista, no 3D.
- Contorno marrón oscuro grueso y uniforme (`#2b1810`), sombreado de 3 tonos (claro, medio, sombra), pequeños brillos blancos.
- Luz cálida de linternas de papel, desde arriba a la izquierda. Ambiente acogedor de noche.
- Paleta: rojo bermellón `#C8372D`, naranja linterna `#F2A33A`, crema `#F6E7C1`, madera `#8A5A33`, azul índigo `#2E3A59`, verde matcha `#7FA650`, negro nori `#1F1A17`.
- Sin texto, sin letras, sin logotipos, sin marcas de agua.

## 3. Encuadre y cámara (muy importante)

- **Vista frontal**, como la ve un cliente sentado en la barra. El personaje mira hacia la cámara.
- **De la cintura para arriba.** El borde inferior del cuadro corta al personaje por la cintura (aparece el nudo del delantal). Lo que está debajo lo tapa el mostrador del juego.
- **Cámara completamente fija**: sin zoom, sin paneo, sin giros, sin temblor, sin cambios de lente.
- La **cabeza y el torso casi no se mueven**; solo se mueven brazos, herramientas y comida. La cabeza puede inclinarse un poco solo cuando la acción lo pide (por ejemplo, al secarse la frente).
- El personaje ocupa el cuadro igual que en la imagen de referencia: gorro alto cerca del borde superior, cintura en el borde inferior, ≈ 12 % de margen a los lados.
- Fondo: **verde croma liso `#00FF00`**, sin sombras, sin degradado, sin viñeta, sin suelo, sin objetos de fondo. El verde puro no debe aparecer dentro del personaje ni de los objetos.

## 4. Requisitos técnicos del video

| Dato | Valor |
|---|---|
| Duración | 4 a 6 segundos (ideal 5 s) |
| Fotogramas | 24 fps (mínimo 24) |
| Proporción | 9:10 vertical-cuadrado, o 1:1 si no existe; el personaje centrado con margen |
| Resolución mínima | 720 px de alto (se reduce a ~380 px en el juego) |
| Audio | ninguno |
| Bucle | **sin corte**: el último fotograma debe ser el paso inmediatamente anterior al primero. La pose inicial = pose final |
| Cortes | ninguno, un solo plano continuo |
| Archivo | MP4 o WebM; nombre `cocinero_<nombre>_loop.mp4` |

## 5. Personajes (tres cocineros distintos, mismo estilo)

Se adjunta una imagen de referencia por personaje (primera imagen de su hoja de animación). Respetar exactamente cara, ropa y colores.

| Cocinero | Aspecto | Dónde trabaja |
|---|---|---|
| **Cocinero de wok** | Hombre mayor, piel morena, cabello gris, bigote gris, cejas marcadas, expresión seria. Gorro alto blanco con banda gris, chaqueta cruzada blanca (estilo kimono de cocina), delantal blanco | Wok negro de hierro sobre el fogón |
| **Cocinera de ramen** | Mujer robusta de mediana edad, cara redonda, mejillas rosadas, cejas oscuras gruesas, sonrisa cálida, sin bigote. Cabello castaño recogido bajo un pañuelo azul índigo (`#2E3A59`) con las puntas a la derecha, bajo el gorro alto blanco. Chaqueta y delantal blancos | Olla de caldo de ramen, cuencos, cucharón |
| **Cocinero de freidora** | Hombre joven, piel clara, pelo negro, sin bigote, cinta hachimaki roja y blanca bajo el gorro alto blanco. Chaqueta y delantal blancos | Freidora de tempura, canasta metálica |

## 6. Acción de cada video (ciclo de ≈ 5 s)

Los tiempos son referencia. Las poses fuertes (anticipación, lanzamiento) deben ser rápidas y las de descanso más lentas (aceleración y frenado naturales, nada lineal ni robótico).

### 6.1 Cocinero de wok
1. (0,0 s) Espátula levantada en la mano izquierda, wok con verduras en la derecha. Pose de inicio y de fin.
2. (0,3 s) Remueve las verduras con la espátula.
3. (0,6 s) Echa el wok hacia atrás y abajo (anticipación).
4. (0,8 s) **Lanza** las verduras en un arco alto, rápido; las verduras suben por encima del gorro.
5. (1,1 s) Las verduras caen; atrapa con el wok (el wok cede un poco al recibirlas).
6. (1,4 s) Remueve de nuevo.
7. (1,8 s) Inclina el wok a la derecha unos 30°, desliza las verduras a un plato sobre la barra.
8. (2,5 s) Vuelve el wok a nivel.
9. (2,9 s) Con la mano libre toma una pizca de sal y espolvorea sobre el wok.
10. (3,5 s) Se seca la frente con el antebrazo (momento de respiro, más lento, expresión de cansancio).
11. (4,3 s) Vuelve a agarrar el wok, levanta la espátula. Termina en la pose del segundo 0.

### 6.2 Cocinera de ramen
1. (0,0 s) Cuenco oscuro en la mano izquierda a la altura de la cintura, cucharón largo en la derecha. Pose de inicio y de fin.
2. (0,3 s) El cucharón sube desde la olla (a la izquierda, fuera de cuadro) lleno de caldo marrón.
3. (0,7 s) Se mueve sobre el cuenco.
4. (1,0 s) Vierte el caldo en un chorro fino; mantiene el vertido un momento.
5. (1,6 s) El cucharón se aparta; lo deja fuera de cuadro.
6. (2,0 s) Toma una canasta metálica de fideos; la levanta (sube vapor) y la sacude dos veces, caen unas hebras al cuenco.
7. (3,0 s) Toma una lámina de cerdo chasu con pinzas y la coloca encima del cuenco.
8. (4,2 s) Vuelve a tomar el cucharón. Termina en la pose del segundo 0.

### 6.3 Cocinero de freidora
1. (0,0 s) Sostiene con las dos manos, a la altura del pecho, una canasta metálica con tempura dorada. Pose de inicio y de fin.
2. (0,4 s) Baja la canasta hacia el aceite (queda casi fuera de cuadro por abajo).
3. (0,7 s) Entra al aceite; salpicadura dorada pequeña.
4. (1,0 s) La mantiene y sacude suavemente arriba y abajo.
5. (1,6 s) La sube a escurrir; caen unas gotas de aceite.
6. (2,1 s) La apoya en una rejilla; inclina la canasta hacia una bandeja con papel y pasa las piezas de tempura.
7. (3,0 s) Se limpia las manos en el delantal (primero la izquierda, luego la derecha).
8. (3,8 s) Toma la canasta vacía y la levanta hasta el pecho. Termina en la pose del segundo 0.

## 7. Prompt maestro (copiar y adaptar la sección 6)

```
Animate the attached character as a seamless loop of about 5 seconds at 24 fps.
STYLE: 2D cartoon mobile-game art, chunky dark-brown outline, 3-tone cel shading, warm lantern lighting. Keep the exact same character, face, clothes and colors as the attached image. Do not turn it into 3D or realistic.
CAMERA: completely locked. No zoom, no pan, no rotation, no shake. Front view, character faces the camera, waist-up; the bottom edge of the frame cuts him at the waist. Same framing and size as the attached image in every frame.
MOTION: head and torso stay almost still. Only arms, tools and food move. Use natural easing: fast, snappy motion on tosses and pours, slower holds on rest poses. Smooth in-between motion, no jumps between poses.
BACKGROUND: solid flat chroma green #00FF00, no shadows, no gradient, no vignette, no floor, no extra objects. No green anywhere on the character.
LOOP: the final frame must be the step immediately before the first frame, so the video repeats without a visible cut. The start pose and end pose are the same.
ACTION (timeline): [pegar aquí la lista de la sección 6 del cocinero]
NO text, no letters, no logos, no audio, no scene cuts.
```

## 8. Qué NO debe pasar

- Que el personaje cambie de cara, ropa, color de piel o proporciones durante el video.
- Que la cámara se acerque, se aleje o se mueva.
- Que la cabeza o el torso se desplacen de lugar (temblor).
- Que aparezca fondo, mostrador, sombra o suelo (debe ser solo verde liso).
- Que el verde del fondo se mezcle con el borde del personaje (contorno marrón siempre nítido).
- Que el bucle tenga un salto: primer y último fotograma deben encajar.
- Que haya texto, subtítulos o audio.

## 9. Lista de revisión antes de entregar el video

- [ ] 24 fps, 4-6 s, un solo plano.
- [ ] Mismo personaje de principio a fin.
- [ ] Cintura en el borde inferior, cabeza en el mismo lugar.
- [ ] Fondo verde `#00FF00` liso, sin objetos.
- [ ] Contorno marrón limpio, sin halo verde.
- [ ] El último fotograma encaja con el primero.
- [ ] Sin texto ni audio.

## 10. Qué hacemos nosotros con el video (para el generador, solo contexto)

Se recorta el verde, se reduce a ≈ 380 px de alto, se convierte a WebM con transparencia o a una tira de fotogramas, y se reproduce sobre el fondo fijo de la cocina. En el modo de supervivencia (Rash) el video se acelera ×1,8 y en el modo zen se hace ×0,7, por eso **el movimiento debe verse bien tanto lento como rápido**.

## 11. Imágenes de referencia a adjuntar

| Archivo | Para qué |
|---|---|
| `assets/gen/menu/actor_01_wok_v2.jpg` (primer fotograma) | Cocinero de wok |
| `assets/gen/menu/actor_02_ramen_v2.jpg` (primer fotograma) | Cocinera de ramen |
| `assets/gen/menu/actor_03_freidora.jpg` (primer fotograma) | Cocinero de freidora |
| `assets/gen/menu/placa_z1.jpg` | Solo para entender el lugar y la paleta (el video NO lleva este fondo) |
