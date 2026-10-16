# Pendientes del proyecto (ordenados) — v167

Fuentes: sección 12 de `contexto-juego.md` (con lo ya resuelto tachado), memorias del proyecto, `propuesta-campana-2.md` y lo hablado hasta ahora. Leyenda de quién hace cada cosa: **YO** = código/datos/pruebas; **TÚ** = arte con Gemini/Flow o prueba en el Redmi; **AMBOS**.

## Ya resuelto (para no repetirlo)
- ~~Buff `fresh` de Japón sin conectar; eventos aleatorios~~ → hechos en v147.
- ~~Metas y tiempos de la Campaña 4-20~~ → recalculados (v145) y de nuevo en v166 con etapas siempre activas.
- ~~Modularizar `index.html`~~ (v149), ~~limpieza de código~~ (v150), ~~PixiJS~~ (descartado tras medirlo).
- ~~Selección de áreas en Multijugador~~ (v148).
- ~~Cocinero de wok, ramen, freidora y mozo en video; fondo ancho; carga instantánea~~ (v152-v165).
- ~~Campaña 2.0 fase 1 (datos, etapas siempre activas, ficha del Maestro)~~ (v166); ~~herramientas de QA~~ (v167).

## A. Campaña 2.0 (prioridad alta)
| # | Tarea | Quién | Depende de | Esfuerzo |
|---|---|---|---|---|
| A1 | **Probar los niveles 1, 4, 9 y 13** en el Redmi y pasarme dinero final, clientes perdidos y estrellas | TÚ | — | 20 min |
| A2 | **Calibrar el simulador** (`--cap`) con A1 y decidir si se relajan 2★/3★ en los niveles 10-20 | YO | A1 | Corto |
| A3 | ~~**Fase 2:** pantalla del Maestro por arco/área, mapa de campaña nuevo~~ → hecha en v168 (con el arte actual; ilustraciones finales en B5) | YO | — | ✔ |
| A4 | **Fase 3:** partida con escena viva, tickets y HUD nuevos, clientes dibujados. **Hecho en v169:** clientes dibujados con 4 poses según la paciencia y cara contenta al servir, fondo de la partida con la cocina nueva y linternas que parpadean. **Hecho en v170:** HUD con estilo del menú (meta con 3 estrellas, reloj que presiona, nombre del nivel) y comandas de papel. **Falta:** cocineros reactivos, fondo por arco, y reemplazar por hojas en alta resolución las de Aoi, Akemi, Yuki y Ren | AMBOS | Arte (B1 parcial) | Grande |
| A5 | **Fase 4:** zonas por arco (wok, barra fría, freidora, insignia) con cocineros en video | AMBOS | Arte (B2) | Grande |

## B. Arte pendiente (Gemini / Flow)
| # | Pieza | Cantidad | Para |
|---|---|---|---|
| B1 | **Clientes** dibujados (8 personajes × 4 poses: esperando, impaciente, feliz, enojado) | 8 hojas | A4 |
| B2 | Placas de zona y videos de sus cocineros (wok, barra fría, freidora, insignia) | 4 + ≈ 8 | A5 y menú |
| B3 | Zonas 2 a 5 del menú (Maestro, despensa y cuchillos, pase y caja, ventana y puerta) | 4 placas + 12 actores | Menú |
| B4 | Íconos de lista del menú (2 hojas) | 2 | Menú |
| B5 | Maestro presentando (3 poses) y mapa de campaña (fondo + 5 estampas de arco) | 7 | A3 versión final |
| B6 | Crudos de Producción, huevo y lomo (`ing_raw_*`) | varios | Producción |
| B7 | Japón: mapa, restaurantes, personas y objetos con arte final | muchos | Recorrido por Japón |
| B8 | Maestro «rebuscando» y «celebrando» (animaciones) | 2 | Secretos y Aula |

## C. Audio (nuevo, skill `game-audio-director`)
| # | Tarea | Quién |
|---|---|---|
| C1 | Auditoría de sonidos actuales y brief por modo | YO |
| C2 | Módulo `audio-ambiente.js`: buses, limitador, volumen, suspensión al ocultar | YO |
| C3 | Modelo de tensión (paciencia, clientes, tiempo, dificultad) y capas por tramo | YO |
| C4 | Generar ambientes y música (Lyria y pistas de audio de Veo) y reutilizar el audio de los cocineros del menú | TÚ |
| C5 | Probar en el celular si da paz o tensión | TÚ |

## D. Mecánicas por área
| # | Tarea | Quién |
|---|---|---|
| D1 | **Makis:** emplatado sin dibujo ni piezas definidas, salmón no implementado, cobertura Amazon sin stock | AMBOS (necesito tu definición) |
| D2 | **Frituras:** emplatado dibujado por plato; confirmar que «ebi furai replica el método» del langostino | AMBOS |
| D3 | **Gyozas hervidas y Maki Furai** existen pero no se pueden pedir: decidir si se activan | TÚ decides |
| D4 | Afinar tiempos de Producción, `ST_EXTRA_SECONDS` y ritmo de toques tras ver partidas reales | YO con tus datos |
| D5 | **Multijugador:** Producción y Emplatar apagadas | YO (si lo quieres) |
| D6 | **Tutorial:** una sola acción de Producción por área en Makis y Frituras; mantener `guia.js` al día con cada cambio de mecánica | YO |

## E. Recorrido por Japón
| # | Tarea | Quién |
|---|---|---|
| E1 | Balance de «Jugar aquí» frente al ingreso pasivo y si los eventos necesitan decisiones del jugador | AMBOS (con tu prueba) |
| E2 | **Nube:** aplicar en Supabase la migración `supabase/migrations/20261013000000_game_progress.sql` (si no está aplicada, Japón y Rash muestran «sin nube») | TÚ |
| E3 | Arte final (ver B7) | TÚ |

## F. Menú de inicio y cocina viva
| # | Tarea | Quién |
|---|---|---|
| F1 | **Probar en el Redmi:** fluidez de los 3 videos, calor, velocidad ×1,8 de Rash, ritmo del mozo y tamaño de la escena | TÚ |
| F2 | Animar el gato de la suerte y otros detalles de los lados (comandas, ventana del callejón) | YO |
| F3 | Zonas 2-5 e íconos (ver B3, B4) | AMBOS |
| F4 | Audio del menú (ver C) | AMBOS |

## G. Limpieza y calidad
| # | Tarea | Quién |
|---|---|---|
| G1 | Actualizar `contexto-juego.md` (sigue en v144 y su sección 12 está desfasada) y las memorias | YO |
| G2 | Regenerar el grafo (`graphify update`) y borrar `tools/prueba-zona1.html` y `tools/prueba-video.html` | YO |
| G3 | Confirmar `exportar-skills/` (sin subir a git) | TÚ decides |
| G4 | Opcional: pasar cada módulo a ES módulo y sacar el CSS de `index.html` | YO, solo si hace falta |
| G5 | Pasada final con `game-qa-director` antes de cada versión (humo, verificadores, simulador) | YO |

## Orden recomendado para arrancar
1. **Ahora (en paralelo):**
   - **YO:** A3, fase 2 de la Campaña con el arte actual; y G1 (documentación al día).
   - **TÚ:** A1 (jugar 4 niveles y pasarme los números) y empezar B1 (clientes); yo te dejo los prompts.
2. **Después:** A2 (calibrar) y, con B1 listo, A4 (fase 3). En paralelo C1 a C3 (audio) sin arte.
3. **Luego:** B2/B3 y A5/F3; D1 y D2 en cuanto definas el emplatado de makis y frituras.
4. **Siempre antes de publicar:** G5.

## Decisiones que necesito de ti
1. ¿Empezamos por A3 (Campaña fase 2) como propongo?
2. ¿Quieres que active D3 (gyozas hervidas y Maki Furai) o se quedan fuera?
3. E2: ¿ya aplicaste la migración de Supabase?
