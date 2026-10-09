# Plan: etapas de Salteados, Makis y Frituras (misma estructura que Ramen)

Estructura de cada área: **Producción** (taller) → **Cocina** (estación rediseñada) → **Emplatar**.

Estado actual
| Etapa | Ramen | Salteados | Makis | Frituras |
|---|---|---|---|---|
| Producción | Taller (tabla + cuchillo + 2 hornillas) | fichas con temporizador | fichas con temporizador | fichas con temporizador |
| Cocina | Cocina de 4 hornillas, herramientas, multitáctil | 2 woks, "mantén pulsado" | tabla de makis con gestos (ya rica) | mesa de empanizado + freidora (ya rica) |
| Emplatar | Libre, 2 cuencos, errores penalizados | igual (motor común) | igual | igual |

Emplatar ya es común a las cuatro áreas, así que el trabajo está en **Producción** y **Cocina**.

---

## Fase A — Taller de Producción en las tres áreas  ✅ hecha (v72)

Se reutiliza el taller de Ramen (tabla + cuchillo, limpieza con manos, 2 hornillas). Se generaliza: el segundo paso de un proceso deja de ser solo "blanquear" y puede ser **cocer** o **marinar**.

| Área | Insumo | Proceso | Tiempo 2.º paso |
|---|---|---|---|
| Salteados | Arroz cocido | lavar (manos) → cocer | 10 s |
| Salteados | Pollo marinado | cortar → marinar | 9 s |
| Salteados | Lomo cortado | cortar | — |
| Salteados | Ensaladas | lavar (manos) | — |
| Salteados | Vegetales finos | cortar | — |
| Makis | Arroz shari | lavar (manos) → cocer | 10 s |
| Makis | Ebi cocido | cocer | 12 s |
| Makis | Palta en láminas | cortar | — |
| Makis | Atún y cecina | cortar | — |
| Makis | Jengibre y wasabi | cortar | — |
| Frituras | Col rallada, Zanahoria, Betarraga | cortar | — |
| Frituras | Ebi furai (langostino) | limpiar/pelar (manos) | — |
| Frituras | Gyozas (relleno) | cortar → sazonar | 14 s |

Todo es una propuesta mía: los verbos y tiempos se corrigen jugando.

## Fase B — Cocina de Salteados (wok profesional)  ✅ hecha (v73)
- 2 woks sobre una cocina de acero; el fuego es un interruptor (encender/apagar), el wok tarda en calentar.
- Franja de herramientas como en Ramen: botellas de salsa (chaufa, teriyaki, batayaki, yakitori, yasaitame, omuraisu, katsu, tan tan, base Shimaya) y aceite; salen de la despensa.
- Orden de proceso por receta (aceite → proteína → verdura dura → arroz/fideo → salsa al final); orden mal = penalización de calidad.
- "Saltear" = deslizar el dedo hacia arriba sobre el wok (volteo), no mantener pulsado; cada receta pide un número de volteos dentro de su ventana (reutiliza `WOK_PROFILES`): pocos = crudo, demasiados = quemado.
- Multitáctil: una mano voltea mientras la otra echa salsa.

## Fase C — Cocina de Makis  ✅ hecha (v74)
- Esparcir el arroz shari sobre el nori con el dedo (como mover fideos): cobertura pareja = más calidad.
- Botellas de salsa arrastrables (acevichada, hotate, guacamole, yama, nin niku, digión) y flameador (Yama, Nin Niku, Digión) con la misma mecánica de herramientas de Ramen.
- Se conservan enrollar y cortar.

## Fase D — Cocina de Frituras  ✅ hecha (v75)
- Control de temperatura del aceite (perilla): frío = grasoso, muy caliente = se quema por fuera.
- Sacudir/escurrir la canasta al retirar (gesto) como parte de la calidad.
- Se conservan empanizado, ventana de fritura y corte.

## Fase E — Cierre
- Pendiente (necesita pruebas en el celular): recalcular tiempos de niveles con `tools/economia-niveles.cjs` y ajustar la paciencia extra (`ST_EXTRA_SECONDS`) según lo que tarde cada taller.
- Hecho: nota de memoria `kitchen-stages-design` actualizada.

## Lo implementado (resumen)
| Área | Producción | Cocina | Puntos de proceso (30) |
|---|---|---|---|
| Salteados | tabla + manos + hornillas | fuego, aceite y salsas en botella, volteo ↑, retirar tocando | 10 orden + 14 volteo + 6 aceite |
| Makis | tabla + manos + hornillas | extender arroz (horizontal), flamear Yama/Nin Niku/Digión | 10 orden + 14 arroz + 6 flameado |
| Frituras | tabla + manos + hornillas | fuego y temperatura del aceite, escurrir sacudiendo | 12 orden + 10 escurrido + 8 aceite |

## Reglas para todas las fases
- Solo cambia donde `stagedOn(area)` es verdadero (campaña: salteado nivel 5, makis y frituras nivel 7; Rash 9/16/27; sin etapas en tutorial ni multijugador): el juego de los primeros niveles queda igual.
- Cada fase se sube por separado (commit + versión nueva del service worker) para poder revertirla.
- Lo que no pueda probar en el celular real (multitáctil, ritmo de toques) queda anotado para afinar contigo.
