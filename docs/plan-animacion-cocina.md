# Plan de animación de la cocina viva (skill 2d-animation-director)

Aplica la skill `2d-animation-director` a la zona 1 (cocineros de ramen, wok y freidora). Estado actual: v153, 3 cocineros de **8 fotogramas** a 10 fps fijos con fundido entre fotogramas. Objetivo: **16 fotogramas por cocinero**, tiempos variables por fotograma (easing) y reproducción por `requestAnimationFrame` con delta-time.

## Diagnóstico de lo que hay (contra las reglas de la skill)

| Regla | Hoy | Acción |
|---|---|---|
| Movimiento no lineal (slow-in / slow-out) | Todos los fotogramas duran 100 ms: parece robótico | Duración propia por fotograma (tablas de abajo) |
| Loop sin salto | El 8 enlaza con el 1 sin repetir pose | Se mantiene en el ciclo de 16 (el 16 es el paso previo al 1) |
| Anclaje constante | Cintura fija en la barra, cabeza y cuerpo quietos | Se exige igual en las hojas nuevas |
| Delta-time | Animación CSS por `steps()` (la lleva el navegador) | Pasar a un único `requestAnimationFrame` de la escena con `destroy()` al salir del menú |
| Pixel bleeding | Celdas sin margen, pero con fondo transparente alrededor | Sin cambios (el margen ya es transparente); en las hojas nuevas pedir celdas con aire |
| Capas | Placa / cocineros / efectos / luz | Se mantiene |

## Ciclo objetivo

- 16 fotogramas por cocinero, ≈ 2,0 s por vuelta (≈ 8 fotogramas por segundo de media, pero con el fundido entre fotogramas se perciben ≈ 20 imágenes por segundo).
- Cada cocinero con duración total distinta (2,05 s, 1,97 s y 1,94 s) para que nunca vuelvan a coincidir y no se note el bucle.
- Fotogramas 1-8 = las hojas ya aprobadas. Fotogramas 9-16 = hojas nuevas de continuación.

## Carta de rodaje: cocinero de wok (2 050 ms)

| # | Pose | Tipo | ms |
|---|---|---|---|
| 1 | Espátula arriba, wok lleno | clave | 125 |
| 2 | Remueve con la espátula | paso | 125 |
| 3 | Sube el wok hacia atrás y abajo (anticipación) | clave | 150 |
| 4 | Lanza: verduras salen | clave | 70 (rápido) |
| 5 | Pico del salto, verduras sobre el gorro | clave | 110 (slow-out en el punto alto) |
| 6 | Verduras bajan | paso | 80 |
| 7 | Atrapa, el wok cede un poco (squash) | clave | 100 |
| 8 | Remueve | paso | 125 |
| 9 | Remueve, se asienta | paso | 125 |
| 10 | Inclina el wok hacia la derecha | clave | 140 |
| 11 | Desliza las verduras al plato de la barra | clave | 160 |
| 12 | El wok vuelve a nivel | paso | 125 |
| 13 | La mano libre va a las especias | clave | 125 |
| 14 | Espolvorea | clave | 150 |
| 15 | Se seca la frente con el antebrazo (respiro) | clave | 200 |
| 16 | Vuelve a agarrar el mango (último paso antes del 1) | paso | 140 |

## Carta de rodaje: cocinera de ramen (1 970 ms)

| # | Pose | Tipo | ms |
|---|---|---|---|
| 1 | Cucharón colgando, cuenco en la otra mano | clave | 125 |
| 2 | Cucharón sube lleno | paso | 125 |
| 3 | Pasa sobre el cuenco | paso | 100 |
| 4 | Empieza a verter | clave | 110 |
| 5 | Vierte (chorro) | clave | 140 |
| 6 | Termina de verter | paso | 140 |
| 7 | Cucharón se aparta | paso | 100 |
| 8 | Vuelve a la pose inicial | paso | 125 |
| 9 | Deja el cucharón | paso | 125 |
| 10 | Toma la canasta de fideos | clave | 140 |
| 11 | Levanta la canasta (sube vapor) | clave | 140 |
| 12 | Sacude | clave | 90 (rápido) |
| 13 | Sacude | clave | 90 (rápido) |
| 14 | Toma una lámina de chasu con pinzas | clave | 130 |
| 15 | La coloca sobre el cuenco | clave | 150 |
| 16 | Recoge el cucharón (último paso antes del 1) | paso | 140 |

## Carta de rodaje: cocinero de freidora (1 935 ms)

| # | Pose | Tipo | ms |
|---|---|---|---|
| 1 | Sostiene la canasta | clave | 125 |
| 2 | Igual, ligero desplazamiento | paso | 125 |
| 3 | Baja la canasta | clave | 120 |
| 4 | Entra al aceite, salpicadura | clave | 90 |
| 5 | Sacude | paso | 100 |
| 6 | Sacude | paso | 100 |
| 7 | Sube a escurrir | clave | 140 |
| 8 | Gotas caen | paso | 140 |
| 9 | Apoya la canasta en la rejilla | paso | 125 |
| 10 | Inclina la canasta | clave | 130 |
| 11 | Pasa la tempura a la bandeja | clave | 150 |
| 12 | Se limpia las manos en el delantal | clave | 110 |
| 13 | Se limpia las manos | paso | 110 |
| 14 | Toma la canasta vacía | paso | 130 |
| 15 | Sube la canasta | paso | 120 |
| 16 | Vuelve a la pose del 1 (último paso) | paso | 120 |

## Reglas para pedir las hojas de continuación (9-16)

- Referencia obligatoria: la hoja actual del mismo cocinero (fotogramas 1-8).
- Mismo bloque de identidad, mismo recuadro, mismo anclaje: la cintura en el borde inferior de la celda, la cabeza en el mismo sitio.
- Describir cada fotograma como un **delta** respecto al anterior (qué brazo, cuántos grados, qué se mueve), y repetir el bloque de identidad al inicio.
- El fotograma 9 continúa del 8 y el 16 es el paso previo al 1 (nunca igual al 1).

## Integración en el código (cuando lleguen las hojas)

1. `escena-cocina.js` carga las hojas (`await img.decode()`), arma el atlas de 16 fotogramas (2 hojas por cocinero) y las duraciones de las tablas.
2. Un único `requestAnimationFrame` por escena calcula el fotograma actual y el avance dentro de él con delta-time; la capa B (fotograma siguiente) usa como opacidad ese avance, así el fundido coincide con la duración variable de cada fotograma.
3. `destroy()` cancela el `requestAnimationFrame` al salir del menú o al esconderse la pestaña, sin fugas.
4. Rash multiplica el delta por 1,8; Cocina Libre por 0,7.
5. Si el dispositivo baja de ~45 fps, se desactiva el fundido y se reproduce solo el fotograma actual.
