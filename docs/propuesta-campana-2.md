# Propuesta: Campaña 2.0

> **Estado:** Fase 1 (datos y mecánicas) hecha en v166: `NIVEL_EXTRA` con áreas, mecánica de enfoque, ficha del Maestro y reglas por nivel; etapas activas en todos los niveles; tiempos y metas recalibrados con `tools/economia-niveles.cjs`; verificador `tools/verificar-campana.cjs`. Faltan las fases 2 (presentación / mapa), 3 (rostro vivo) y 4 (zonas por arco).

Objetivo del dueño: (1) que la Campaña tenga **el rostro renovado y vivo del menú de inicio**; (2) que **las mecánicas de cada área se respeten en todos los niveles**, sin diseños viejos como el de la captura (fondo `ramen_bg`, paneles de madera de antes, tarjetas con nombre y sin personajes).

## 1. Qué está mal hoy (verificado en el código)

| Problema | Dónde | Efecto |
|---|---|---|
| Un nivel solo define 11 campos (nombre, lista de ramen, pedidos, clientes, meta, tiempo, paciencia, intro) | `js/03-datos-niveles-campana.js` | No hay forma de decir qué mecánica enseña ni qué áreas o etapas usa |
| Platos de otras áreas en `AREA_DISH_UNLOCKS`; etapas en `STAGE_GATE_LEVEL` (ramen 4, salteados 6, makis 10, frituras 14) | `js/02`, `js/09` | Las áreas se abren en los niveles 5, 9 y 13 pero **su mecánica real llega un nivel después**; los niveles 1 a 3 juegan sin etapas |
| Intros de una línea y desactualizadas | `js/25-partida-campana.js` (`cfg.intro`) | Nivel 13 habla de «temperatura del aceite» pero las frituras ya tienen empanizado por gestos, langostino, kare y gyozas |
| Las mecánicas nuevas se enseñan en el Aula, la Campaña no las presenta | `aula.js`, `guia.js` | El jugador llega a un área sin haber visto su lección |
| Pantalla de partida con fondo, paneles y tarjetas de antes | `index.html` (`#game-container`, `.game-customers-hub`) | Dos identidades: el menú es caricatura viva, la partida no |

## 2. Principios

1. **Un área abre con todas sus mecánicas.** Desde el primer nivel donde aparece un área están activos su Producción, su Cocina de gestos y su Emplatado. Lo que crece de nivel en nivel es la carta, los pedidos, los clientes y la presión, no las mecánicas que se apagan.
2. **El Maestro presenta cada mecánica nueva** en el momento en que aparece, y enlaza con su lección del Aula.
3. **Un solo diseño por nivel**, declarado en un solo lugar.
4. **La partida usa el mismo mundo del menú:** la cocina vista desde la barra, cocineros en video, clientes dibujados y la misma paleta y trazo.

## 3. Parte A · Mecánicas y niveles

### 3.1 Modelo de nivel (`NIVELES_V2`)
```js
{
  level: 5, name: 'El Fuego del Wok', arc: 'salteados',
  scene: 'wok',                                   // zona de cocina que se ve de fondo
  areas: ['ramen', 'salteados'],                  // pestañas disponibles
  menu: { ramen: ['Shio','Shoyu','Miso','Chashu'], salteados: ['Yakimeshi'] },   // platos que pueden pedir
  focus: { area: 'salteados', mechanic: 'wokToss', lesson: 'salteados' },        // lo que se presenta y a qué lección enlaza
  rules: { stages: true, plating: true, cooling: true, fresh: true, picky: 0.10, reject: false },
  orders: { perCustomer: 1, customers: 3, spawn: 8, patience: 1.4 },
  time: 250, goal: 280, stars: [1, 1.2, 1.35],   // meta ×; 3★ ≤ 1 plato perdido
  intro: { title: '…', lines: ['…', '…'], maestro: true }
}
```
`stagedOn()` pasa a leer `level.rules.stages` (siempre `true` en Campaña) y se elimina `STAGE_GATE_LEVEL` para la Campaña. Rash y Entrenamiento conservan sus propios gates.

### 3.2 Mapa de los 20 niveles (valores iniciales; la meta final la recalcula `tools/economia-niveles.cjs`)

| Arco | Nivel | Áreas | Carta nueva | Mecánica que el Maestro presenta |
|---|---|---|---|---|
| **1 · Barra de Ramen** | 1 | Ramen | Shio | Producción → Cocina → Emplatar (guiado), fideos al dente |
| | 2 | Ramen | Shoyu | Orden de ingredientes en la sartén |
| | 3 | Ramen | Miso, Chashu | Salsas en sartén, flamear el chasu |
| | 4 | Ramen | Tonkotsu, Tan tan | Fuego, reducción y espuma |
| **2 · Fuego del Wok** | 5 | + Salteados | Yakimeshi | Wok y *toss*, punto del salteado |
| | 6 | | Chicken Teriyaki, Chaufa | Sartén de teriyaki, segundo wok |
| | 7 | | Yakitori, Yakiramen | Dos preparaciones a la vez |
| | 8 | | Yasaitame, Batayaki, Karameshi, Omuraisu | **Examen del arco** |
| **3 · Barra Fría** | 9 | + Makis | California | Shari (lavar, cocer, Zu, enfriar), esterilla, enrollar |
| | 10 | | Guacamole, Acevichado | Pescado: tabla y corte a 90° de las fibras |
| | 11 | | Hotate, Amazon | Cobertura, flameado, apretar |
| | 12 | | Yama, Nin Niku, Digion | Tres makis en la tabla; **examen del arco** |
| **4 · Aceite Dorado** | 13 | + Frituras | Alitas, Kaarage | Aceite y punto de fritura |
| | 14 | | Tonkatsu, Chicken Katsu | Empanizado por gestos |
| | 15 | | Age Gyozas, Ebi Furai | Pinza de dos dedos, langostino |
| | 16 | | Katsu Kare | Kare en sartén y emplatado dibujado; **examen del arco** |
| **5 · Insignia** | 17 | Las 4 | Ebi, Bajiru | Comandas de 3 platos por cliente |
| | 18 | Las 4 | — | Hora punta (más clientes, menos paciencia) |
| | 19 | Las 4 | Vegetariano | Clientes exigentes, platos que se enfrían, rechazo de platos malos |
| | 20 | Las 4 | — | **Examen del Maestro Matsuo**: carta completa |

### 3.3 Cómo evitar que el nivel 1 abrume con las etapas completas
- Producción pre-surtida al empezar (stock inicial lleno) en los niveles 1 y 2.
- Pistas del Maestro sobre la pestaña que toca y el siguiente paso (reusa `guia.js`).
- Pedidos de 1 plato, 2 clientes y paciencia ×1,6 (como hoy), más `ST_EXTRA_SECONDS` por etapa.
- La meta del nivel 1 se recalcula para la nueva carga con la herramienta de economía (objetivo ≤ 90 % de carga).

### 3.4 Presentación de cada área y de cada arco
Pantalla corta con el Maestro al abrir un arco o un área (ilustración, 2 líneas, botón «¿Practicar primero?» que lleva a su lección del Aula). Sustituye al aviso suelto de hoy.

## 4. Parte B · Rostro vivo en la partida

### 4.1 Rediseño de la pantalla de partida
```
 ┌──────────── HUD (tiempo · meta · estrellas · salir/pausa) ────────────┐
 │  Riel de comandas (tickets dibujados, con paciencia en la mecha)       │
 │  ┌ Escena viva (cocina de la zona del arco) ───────────────────────┐   │
 │  │  cocineros en video detrás de la barra · linternas · vapor      │   │
 │  │  clientes dibujados sentados en la barra (esperando / feliz)    │   │
 │  └─────────────────────────────────────────────────────────────────┘   │
 │  Pestañas de área · etapas · despensa     Cuencos / pase / emplatado    │
 └────────────────────────────────────────────────────────────────────────┘
```
- **Escena:** el motor de `escena-cocina.js` pasa a modo partida con zona propia por arco (ramen = línea de fuego; salteados = wok; makis = barra fría; frituras = freidora; insignia = cocina completa).
- **Clientes dibujados** (4 poses: esperando, impaciente, feliz, enojado) en vez de tarjetas con nombre; la barra de paciencia se mueve a su silueta.
- **Cocineros reactivos:** celebran al servir un plato de 3★, se agobian en el último 20 % del tiempo, y el cocinero del área activa se ilumina.
- **Tickets, HUD y paneles** con el trazo marrón grueso y las linternas del menú; fuera `ramen_bg` y los paneles de madera de antes.
- **Rash:** mismo escenario con aviso rojo y ×1,8.

### 4.2 Mapa de Campaña ilustrado
Camino con linternas por arco, jefes de arco (nivel 4, 8, 12, 16, 20) con su estampa, estrellas colgando; reemplaza el modal en lista.

### 4.3 Arte a pedir (Nano Banana / Flow)
| Pieza | Cantidad | Método |
|---|---|---|
| Clientes (8 personajes × 4 poses) | 8 hojas | Hojas de poses sobre fondo magenta |
| Placas de zona (wok, barra fría, freidora, insignia) | 4 | Nano Banana 21:9 con el mismo método del fondo ancho |
| Cocineros de cada zona (video) | ≈ 8 | Flow, primer y último fotograma iguales |
| Maestro presentando (3 poses) | 1 hoja | Nano Banana |
| Mapa de campaña (fondo + 5 estampas de arco) | 6 | Nano Banana |
| Iconos de HUD y tickets | 2 hojas | Nano Banana |

## 5. Plan por fases

| Fase | Entrega | Necesita arte nuevo |
|---|---|---|
| **1 · Datos y mecánicas** | `NIVELES_V2`, etapas siempre activas en Campaña, textos al día, recalibración de metas, prueba automática de los 20 niveles | No |
| **2 · Presentación** | Pantalla del Maestro por arco/área, mapa ilustrado | Maestro, mapa |
| **3 · Rostro vivo** | Pantalla de partida rehecha con escena, tickets y HUD nuevos; clientes dibujados | Clientes, zonas |
| **4 · Zonas por arco** | Wok, barra fría, freidora e insignia con sus cocineros en video | Placas y videos |

La fase 1 se puede hacer ya, mientras se genera el arte de las demás.

## 6. Riesgos
- **Dificultad del nivel 1** con las tres etapas desde el inicio: se mitiga con stock inicial, pistas del Maestro y meta recalibrada; hay que probarlo en el Redmi.
- **Peso:** 4 zonas con videos suman ≈ 6 MB; se cargan por arco, no todo al inicio.
- **Progreso guardado:** se mantiene la numeración de niveles 1–20, así que no se rompen las partidas guardadas ni la nube.
- **Rendimiento:** la escena viva detrás de la partida debe pausarse si el dispositivo va justo (ya existe el medidor y el corte automático del fundido).

## 7. Decisiones que necesito del dueño
1. ¿Las etapas completas desde el nivel 1, con la ayuda del Maestro? (Propuesta: sí.)
2. ¿Rash y Entrenamiento se quedan como están? (Propuesta: sí, con sus propios gates.)
3. ¿Orden de las fases? (Propuesta: 1 → 2 → 3 → 4.)
