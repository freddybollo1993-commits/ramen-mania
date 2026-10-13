# Inicio isométrico: el ramen-ya como menú

Estado: **implementado en v133** (`inicio.js`, reutiliza `JPKit` de `japon-scene.js`). Notas de la primera versión:
- Caja y libro de cuentas son una sola zona (panel con Cuenta · Estadísticas · Ordenar ingredientes).
- El Entrenamiento de cada área abre la lista de retos filtrada a su capítulo (`openTrainingModal(null, [capítulo])`).
- Cocina Libre de un área: `window.startFreeAreas` + `executeStartGame` (la partida abre en esa área).
- El local evoluciona por rango (`tierOf`: retos + 4·lecciones + rondas de Rash + mejoras/2) y se enciende cada área al aprender/desbloquear.
- Vista guardada en `ramen_inicio_vista` (`iso` | `classic`); el pie de página se oculta en la vista isométrica (versión en ⚙).

## Idea
La pantalla de inicio pasa a ser un ramen-ya tradicional en vista isométrica (motor de `japon-scene.js`). Cada modo se elige tocando la zona del local que le corresponde: la cámara se acerca y aparece un panel con sus opciones. Solo toques (sin pellizco). Tamaño de trabajo: 873×393 horizontal.

## Mapa de zonas (decidido)
| Zona del local | Qué abre |
|---|---|
| Cada una de las 4 áreas de cocina (Ramen, Salteado, Makis, Frituras) | **Lección del área · Entrenamiento del área · Cocina Libre del área** |
| **Timbre de cocina** (uno solo) en la barra, frente a las 4 áreas | Panel para elegir **Campaña** o **Rash** |
| **Maestro** | Todas las lecciones (`Guia.menu()`) |
| **Libro en el mostrador**, junto al timbre | Recetario |
| **Máquina de tickets** | Lista general de retos (los 27 de Entrenamiento) |
| **Habitación privada**, con gente dentro | Multijugador |
| **Baúl antiguo con papeles** | Secretos del Chef |
| **Cuchillos exhibidos en la pared** | Mejoras (propinas) |
| **Pizarra de pared** | Ranking |
| **Despensa** | Ingredientes (reconocimiento) |
| **Puerta a la calle** | Recorrido por Japón |
| **Caja registradora** | Cuenta ☁️ |
| **Libro de cuentas junto a la caja** | Mis estadísticas · Ordenar ingredientes |
| **Engranaje fijo en pantalla** (fuera del local) | Audio, pantalla completa, actualizar, versión, atajos |
| **Botón ▶ JUGAR fijo** | Repite el último modo |

## Decisiones de interfaz
- Solo toques: tocar una zona acerca la cámara y abre su panel; ✕ o tocar fuera vuelve a la vista general.
- **Menú clásico conservado** con su código y configuración, accesible como respaldo.
- Zonas bloqueadas: se ven con una lona/cortina cerrada y dicen cómo abrirlas (misma lógica de desbloqueo actual por retos).
- **Primera vez:** solo brilla el Maestro (con manita) hasta terminar la lección de Ramen, que desbloquea Campaña y Rash. Lo demás se ve tenue.
- La habitación privada se ve con gente dentro (figuras animadas); al tocarla se abre Multijugador.

## Relación con lo que ya existe
- Los 27 retos de `TRAINING_CHALLENGES` están en capítulos `ramen`, `salteado`, `makis`, `frituras`, `servicio` y `maestria` y **desbloquean áreas y mejoras** (`unlocks`). El Entrenamiento de cada área = los retos de su capítulo; la máquina de tickets = la lista completa (servicio y maestría solo aparecen ahí).
- Las 4 lecciones de `guia.js` ya están por área; la de Ramen desbloquea Campaña y Rash.
- Cocina Libre por área: queda activa solo esa área, sin clientes automáticos (trabajo nuevo en el motor).
- Secretos del Chef (`openSecretosModal`) y el resto de modales existentes se reutilizan; solo cambia desde dónde se abren.

## El local evoluciona (hitos decididos)
- Cada **lección o área desbloqueada** enciende su zona (antes, luz tenue).
- Cada **mejora comprada** añade un detalle visible (p. ej. cuchillos nuevos en la pared).
- Los **niveles de Campaña** suben el lujo del local, de modesto a elegante.
- Mejorar los **restaurantes de Japón** agrega recuerdos de esas ciudades (farolillos, mapas).
- El cielo y la luz cambian con la hora del dispositivo (día, atardecer, noche con faroles).

## Escena viva
Cocinero y ayudantes trabajando, clientes comiendo en el mostrador, vapor, faroles que se mecen, gato de la suerte moviendo la pata, gente en la habitación privada.

## Arte
Primero vectorial provisional; luego piezas de Gemini sin tocar la lógica.

## Técnico
- Separar de `japon-scene.js` la parte común (proyección isométrica, cámara, personas) para que sirva a dos escenas.
- Un solo bucle de animación; detenerlo al empezar una partida (rendimiento en el Redmi).
- Los modos no cambian: solo cómo se entra a ellos. Tutorial y menú clásico siguen funcionando.
- Probar en 873×393 horizontal.

## Orden sugerido de implementación
1. Motor común + escena del local con zonas tocables y panel (sin modos conectados).
2. Conectar modos: timbre, tickets, maestro, libro, baúl, cuchillos, pizarra, despensa, puerta, caja, libro de cuentas, engranaje, ▶ JUGAR.
3. Áreas de cocina: lección / entrenamiento / cocina libre por área (incluye el filtro «solo esta área»).
4. Habitación privada y Multijugador.
5. Evolución del local, primera vez guiada, día/noche.
6. Pulido y prueba en pantalla real.
