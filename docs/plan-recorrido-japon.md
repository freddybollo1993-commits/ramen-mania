# Recorrido por Japón — diseño y estado (v126)

Archivos: `japon.js` (datos, economía, menús) y `japon-scene.js` (escena animada del restaurante) · Guardado local: `ramen_japon_v1` · Entrada: botón «🗾 Japón · S/ …» en la barra superior del menú.

## 1. Idea (MDA)
- **Mecánica:** un mapa de 9 ciudades. Cada ciudad es un restaurante «idle» (minimalista) con zonas: Depósito, 4 cocinas (Ramen, Salteados, Frituras, Makis; solo las que tengan platos de esa ciudad), Salón, Caja y Baños. Se compra personal, niveles, mesas, objetos, calidad de ingredientes y tamaño del local con el **Fondo**.
- **Dinámica:** hay que crecer de forma equilibrada. Un cuello de botella (pocos cocineros, mozos lentos, pocas mesas) o un gasto desbalanceado (renta, luz, planilla) hace que el local pierda dinero.
- **Estética / pedagogía:** cada ciudad enseña de dónde viene cada plato (relación histórica o afinidad).

## 2. De dónde sale el dinero
| Fuente | Qué pasa |
|---|---|
| Campaña, Rash, Retos | Al terminar cada partida, `gameState.money` (S/) va al **Fondo** (hook en `recordGameScoreAutomatically`). |
| Caja de cada local | Produce soles por minuto, también sin conexión. Se recolecta a mano hacia el Fondo. |
| Gastos | Las mejoras se pagan del Fondo. |

**Offline:** acumula hasta `4 h + mejoras de Caja` (máx. 12 h) sin recolectar. Lo que se genera ausente se multiplica por la **actividad reciente**: `0,25 + 0,75 × min(1, minutos jugados en 3 días / 60)`. Jugar seguido → hasta ×1; jugar poco → ×0,25. Los primeros 2 minutos cuentan «en vivo» (×1).

## 3. Economía de un local (por minuto)
- Demanda = `mesas × 0,4 × reputación` (reputación 0,6–1,5: baños, objetos de decoración).
- Cada cocina atiende `cocineros × velocidad(nivel) × (1 + objetos)`; los mozos limitan el total (`mozos × velocidad(nivel)`).
- Errores: cocineros 26 % → 5 % (nivel 1 → 5), mozos 20 % → 3 %. Un plato con error no cobra, pero gasta ingredientes.
- Ingreso por plato = `precio del juego × 0,15 × (1 + 0,12 × (calidad−1))`; ingredientes = 26 % → 38 % del precio base (según calidad), menos objetos.
- Gastos fijos: **planilla** (sueldo por nivel), **renta** (0,15 / 0,45 / 1,0 / 1,9 según tamaño), **luz** (local, mesas, televisor y otros aparatos), **agua** (mesas y personal), **pérdidas de cobro** (6 %, menos con cajero/terminal).
- Resultado neto puede ser negativo: el local avisa «pierde dinero» y la caja no baja de 0.

| Nivel de personal | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Cocinero: platos/min | 0,36 | 0,48 | 0,62 | 0,80 | 1,00 |
| Cocinero: sueldo/min | 0,12 | 0,18 | 0,28 | 0,42 | 0,60 |
| Mozo: platos/min | 0,50 | 0,70 | 0,95 | 1,25 | 1,60 |
| Mozo: sueldo/min | 0,10 | 0,15 | 0,23 | 0,35 | 0,50 |

| Tamaño | Mesas | Cocineros / mozos / apoyo por zona | Renta/min | Costo (×ciudad) |
|---|---|---|---|---|
| Pequeño | 4 | 2 / 2 / 1 | 0,15 | — |
| Mediano | 8 | 3 / 4 / 1 | 0,45 | 600 |
| Grande | 14 | 4 / 6 / 2 | 1,0 | 2 500 |
| Amplio | 18 | 5 / 9 / 2 | 1,9 | 9 000 |

Costos de mejoras: `COST_K = 3` y un multiplicador por ciudad (1 → 4). Simulación con un jugador diligente (8 h offline al 60 % + 1 partida de S/ 300 al día): Tokio llega a Maestría en ~45 días; sin actividad, mucho más lento. **Todos los valores están en `T`, `OBJ_COST`, `COST_K` y son ajustables.**

## 4. Objetos y mejoras permanentes
3 objetos por zona (24 por ciudad). Cada uno mejora el local **y** da una mejora permanente en el juego (suman entre todas las ciudades):
| Clave | Efecto en el juego | Estado |
|---|---|---|
| `patience` | +1 % paciencia de clientes por objeto | integrado |
| `tips` | +1 % propinas | integrado |
| `price` | +0,5 % pago por plato | integrado |
| `fresh` | más tiempo antes de enfriarse | pendiente de conectar |

## 5. Maestría y mejoras de plato
Una ciudad se completa cuando: local grande o mayor, calidad 5, todas sus cocinas abiertas, cocineros nivel 4, mozos nivel 4 (≥1 por cada 3 mesas) y los 24 objetos. Los platos **siguen disponibles en el juego de todos modos** (por nivel, como antes); lo que se gana al completar la ciudad es **la mejora de cada plato: +8 % de pago al servirlo** (, constante ). Los objetos aportan además sus mejoras permanentes (sección 4).

## 5b. Escena del restaurante (v127, vista isométrica)
Vista isométrica del local completo, como la referencia: cocina al fondo (pared derecha) con Depósito y los 4 mostradores con letrero (Ramen, Salteados, Frituras, Makis); Baños, entrada y Caja en la pared izquierda; salón con mesas al frente. **Cámara:** al entrar se ve todo el local; se hace zoom con pellizco, rueda o los botones ＋ − ⤢, se arrastra para moverse y **al tocar un área la cámara se acerca a ella** y se abre su gestión en un panel a la derecha (✕ vuelve a la vista completa). **Movimiento constante:** cocineros que cocinan y traen ingredientes del depósito, mozos que sirven o limpian mesas y llevan bandejas, almacenero que reparte cajas, limpieza con trapeador, cajero contando; los clientes entran, se sientan, piden, comen, pagan y se van.
- Los cocineros, mozos, cajero, almacenero y limpieza que contratas **aparecen** en la escena con su nivel (círculo de color 1–5); los objetos comprados aparecen en su sitio (los vacíos se ven como «＋»).
- Clientes (grupos de 1–2) entran, se sientan, piden (burbuja con el plato), un mozo va a la cocina, espera a que el cocinero lo prepare, lo lleva, comen, pagan en la caja (+S/) y se van. Los errores salen como 😖 sin cobro.
- Un ⬆ verde avisa dónde hay una mejora que ya puedes pagar. El montón de dinero de la caja se toca para recolectar.
- Es solo visual (tiempo acelerado ×10): la ganancia real la calcula la economía de la sección 3. Los sprites son vectoriales y se pueden sustituir por el arte final.

## 5c. Jugar aquí (v128)
Botón «🎮 Jugar aquí» en cada local. Se elige **dificultad** y **áreas activas** (solo cocinas ya abiertas del local; los platos son los de esa ciudad en esas áreas) y se juega una jornada con tiempo fijo, con todas las etapas (Producción, Cocina, Emplatar).

| Dificultad | Tiempo | Clientes a la vez | Pedidos | Paciencia | Multiplicador |
|---|---|---|---|---|---|
| Fácil | 4 min | 2 | 1 | ×1,5 | ×0,8 |
| Normal | 4,5 min | 3 | 1 | ×1,15 | ×1,0 |
| Difícil | 5 min | 3 | 1–2 | ×0,9 | ×1,4 |
| Maestro | 5,5 min | 4 | 1–3 | ×0,7 | ×2,0 |

Recompensa = dinero recaudado × multiplicador de dificultad × (1 + 0,3 por cada área extra) (+10 % si no pierdes clientes). **Va a la caja de esa ciudad** (no al Fondo) y se recolecta como el resto. Abandonar paga la mitad. Los objetos del local dan sus mejoras permanentes también en la jornada.

## 6. Platos por ciudad (relación histórica o afinidad)
| Ciudad | Platos |
|---|---|
| Tokio | Shoyu, Omuraisu, Yakitori, Tonkatsu, Maki California |
| Yokohama | Bajiru, Chicken Teriyaki, Maki Digion |
| Osaka | Yakiramen, Yasaitame, Maki Furai |
| Nagoya | Alitas, Ebi Furai, Chicken Katsu, Karameshi |
| Sapporo | Miso, Shio, Ebi (ramen), Batayaki Ramen, Maki Hotate |
| Kioto | Vegetariano, Maki Guacamole, Maki Yama |
| Fukuoka | Tonkotsu, Chashu, Age Gyozas, Kaarage, Maki Nin Niku |
| Kanazawa | Katsu Kare, Maki Amazon, Maki Acevichado |
| Nagasaki | Chaufa Shimaya, Yakimeshi, Tan tan |

Las 34 recetas del juego quedan repartidas una sola vez. Costo de abrir cada ciudad: 0 / 1 500 / 2 500 / 4 000 / 6 000 / 8 000 / 11 000 / 15 000 / 20 000.

## 7. Pendiente (siguientes fases)
1. ~~Modo «Jugar aquí»~~ (hecho en v128, ver 5c).
2. Sincronizar el progreso con la nube (como las propinas) y comprobar contra trampas de reloj.
3. Arte final (Gemini): mapa, restaurante con personas reales, objetos y personal por nivel (la escena ya admite reemplazar los sprites).
4. Conectar `fresh`, eventos aleatorios (hora pico, inspección, apagón), reputación por ciudad y ranking.
5. Revisar el equilibrio con la economía general (`tools/economia-niveles.cjs`).

## Actualización v147: ingresos pasivos, buff `fresh` y eventos aleatorios
- **Ingresos pasivos más generosos:** `SCALE` 0,15 → 0,2 (ingreso por plato), renta del local pequeño 0,15 → 0,10, tope de caja 4 h → **6 h** (máx. 12 → 16 h) y actividad mínima 25 % → **50 %** (llega al 100 % con 45 min de juego en 3 días). El local inicial pasa de ~7,6 S/h a **~23 S/h** (primera contratación en ~6 h), y un local de nivel medio de ~243 a ~375 S/h. **Bono diario:** la primera recolecta de cada día rinde +25 %.
- **Buff `fresh`:** los objetos de Depósito que lo dan alargan el tiempo antes de que un plato se enfríe (se multiplica con la «Bandeja caliente», tope +150 %), en `stFreshPts` y `evalFreshness` de `index.html`.
- **Eventos aleatorios** (por local, ~1 cada 90 min con descanso mínimo de 20 min; se guardan en `ramen_japon_ev` y no se sincronizan):
  - 🔥 **Hora pico** (12 min): +80 % de demanda y +25 % de propinas.
  - 📝 **Crítico gastronómico** (20 min): +25 % de precio si hay calidad ≥ 3, mozos y cocineros de nivel ≥ 2; si no, −12 %.
  - 💡 **Apagón** (8 min): la cocina rinde la mitad (80 % con local grande o mayor, que tiene generador).
  - 🧼 **Inspección sanitaria** (instantánea, solo locales medianos o mayores): premio si los baños son de nivel ≥ 2; si no, multa.
  - 🌟 **Cliente famoso** (instantáneo): propina grande.
  Dentro del local aparecen en vivo (chip con cuenta atrás en la barra superior y registro en Finanzas); fuera se liquidan al volver con el efecto esperado de su duración.
