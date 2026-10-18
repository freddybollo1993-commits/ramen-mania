# Mapa del Recorrido por Japón (Gemini)

Hoy el mapa de **Recorrido por Japón** es un dibujo vectorial muy simple (`mapSvg()` en `japon.js`: tres manchas de tierra y círculos de colores). Esta guía pide una ilustración nueva con el estilo del resto del juego (escenas pintadas de Modos de juego, íconos de ciudades).

## Cómo se usa en el juego
- Ocupa el recuadro izquierdo de la pantalla del Recorrido: **≈ 540 × 265 px**, o sea formato **2:1 horizontal**. Pide la imagen en **1600 × 800 px** (se reduce a WebP).
- El juego dibuja encima los 9 marcadores (círculo + nombre) y el texto: **la imagen no debe llevar texto, rótulos, marcadores ni marco**. Los marcadores los pongo yo por código sobre cada ciudad cuando me mandes la imagen (ajusto las coordenadas a tu mapa).
- Deja el mar bien despejado y plano en la zona de los bordes: los marcadores y los carteles se leen mejor sobre fondos tranquilos.
- Archivo final: `assets/ui/mapa_japon.webp` (lo recorto y convierto yo).

## Prompt principal (inglés)
```
Illustrated game map of the Japanese archipelago for a cozy 2D cooking game, wide landscape 2:1 (1600x800), seen from above with a slight tilted-map perspective, hand-painted anime-storybook style with clean soft outlines, warm saturated colors, subtle paper texture, same look as polished mobile-game art. Honshu runs diagonally from lower-left to upper-right, Hokkaido at the upper-right, Kyushu at the lower-left, Shikoku in between; recognizable real geography. Land in warm greens, ochre and cream with a soft darker coastline; mountain ranges drawn as small painted peaks, Mount Fuji clearly visible with a snow cap near the center-right, snow on Hokkaido, a few cherry-blossom groves and pine forests, rice terraces, small villages with tiled roofs. Calm turquoise-blue sea with gentle wave lines, a few small wooden sailing boats and a ferry, a couple of soft clouds, a small compass rose in the lower-left corner. At each of these nine places paint a tiny charming landmark vignette (no text): Tokyo = Tokyo Tower and skyline, Yokohama = Ferris wheel and harbor, Osaka = Osaka Castle, Nagoya = golden-dolphin castle, Sapporo = clock tower with snow, Kyoto = red torii gates and pagoda, Fukuoka = row of food-stall lanterns by the river, Kanazawa = traditional garden and gate, Nagasaki = harbor with a Dutch-style ship. Keep a clear small empty space (about 12% of the image width) around each landmark so game markers can be placed there. Keep the sea near all four edges calm and uncluttered. IMPORTANT: no text, no labels, no letters, no numbers, no UI, no frame, no border, no watermark, no pins.
```

## Variante B (más simple, si la principal sale muy recargada)
```
Same map and style as above, but cleaner: flat painted land shapes with soft shading, no tiny landmark vignettes, only Mount Fuji, a few mountain peaks, forests and a calm sea with wave lines and two boats. No text, no labels, no UI, no frame.
```

## Variante C (de noche, para después)
```
Same map, but at dusk: deep blue sea, glowing paper lanterns and warm windows in the cities, fireflies, a big soft moon, still no text, no labels, no UI.
```

## Qué mandarme
- La imagen (o las 2-3 mejores) con el nombre del archivo.
- Si alguna ciudad quedó en un lugar distinto al de la geografía real, dímelo y ubico el marcador donde esté pintada.
- Al integrarla: `japon.js` mostrará la imagen en `.jp-map` y recalcularé las coordenadas `x`/`y` de las 9 ciudades (hoy están en un lienzo 600 × 300).

## Posiciones de referencia (en el mapa actual, % del ancho / alto)
| Ciudad | Región | x | y |
|---|---|---|---|
| Tokio | Kantō | 70 % | 44 % |
| Yokohama | Kantō | 66 % | 53 % |
| Osaka | Kansai | 44 % | 71 % |
| Nagoya | Chūbu | 57 % | 61 % |
| Sapporo | Hokkaidō | 88 % | 17 % |
| Kioto | Kansai | 48 % | 64 % |
| Fukuoka | Kyūshū | 21 % | 75 % |
| Kanazawa | Hokuriku | 54 % | 46 % |
| Nagasaki | Kyūshū | 15 % | 84 % |

Son solo una guía: con tu mapa pintado se recalculan.
