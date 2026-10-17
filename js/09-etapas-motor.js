/* Módulo 09-etapas-motor — Motor de etapas: producción, pase, emplatado y evaluación.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// --- Estación de Frituras: 1 mesa de preparación + 1 freidora. El plato se identifica por el
// conjunto de ingredientes (proteína + empanizado + guarnición), pero cuando la receta requiere
// empanizado (harina+huevo+panko) ese trío debe agregarse en ese orden exacto. Al freír, el
// jugador ve un contador manual: antes del umbral = Perfecto, después = Quemado (igual se puede
// servir o desechar). "Gyozas" (hervido) no se puede completar aquí a propósito: esta estación
// solo produce platos fritos — "Age Gyozas" es la versión alcanzable.
//
// Flujo actual: 1) la proteína se arrastra por los tres espacios (harina → huevo → panko, en ese
// orden, un instante en cada uno) y se suelta en la tabla ya empanizada y cruda; 2) se arrastra
// de la tabla a la olla; 3) el contador marca cruda → lista → se quema, y hay que retirarla a
// tiempo (si no, sale muy oscura); 4) la proteína frita vuelve a la tabla y se agregan las
// guarniciones hasta completar el plato.
// Ventana de fritura por proteína (segundos): `ready` = lista (dorada), `burn` = desde aquí se quema,
// `black` = carbonizada (también es el fin de la escala del contador). El langostino y el relleno de
// gyoza se pasan rápido; el filete grueso pide más tiempo; el pollo con hueso (alitas) es el más lento.
const FRY_PROFILE_DEFAULT = { ready: 2.5, burn: 4.5, black: 7.0 };
const FRY_PROFILES = {
  60: { ready: 1.8, burn: 3.2, black: 5.7 }, // langostino (Ebi Furai)
  73: { ready: 1.6, burn: 3.0, black: 5.5 }, // relleno de gyoza (Age Gyoza)
  70: { ready: 2.4, burn: 4.4, black: 6.9 }, // pollo (Kaarage)
  43: { ready: 2.8, burn: 5.0, black: 7.5 }, // bife de cerdo (Tonkatsu / Katsu Kare)
  71: { ready: 1.6, burn: 3.2, black: 5.5 }, // poro con harina (Batayaki)
  44: { ready: 2.8, burn: 5.0, black: 7.5 }, // bife de pollo (Chicken Katsu)
  36: { ready: 3.4, burn: 6.0, black: 8.5 }  // alas de pollo (Alitas)
};
function fryProfile(proteinId) {
  const base = FRY_PROFILES[proteinId] || FRY_PROFILE_DEFAULT;
  const b = [0, 0.1, 0.2, 0.3][getUpgradeLevel('freidora')];
  if (!b) return base;
  const burn = base.ready + (base.burn - base.ready) * (1 + b);
  return { ready: base.ready, burn, black: base.black + (burn - base.burn) };
}
const BREAD_DWELL_MS = 450;      // tiempo sobre cada espacio para que cuente el paso
const FRY_BREADING_IDS = [58, 15, 65]; // harina, huevo, panko
const FRY_PROTEIN_IDS = [36, 43, 44, 60, 70, 73, 71];     // 71 = poro cortado en Salteado (solo harina) // alas, bife de cerdo, bife de pollo, langostinos, pollo, relleno
const FRY_BREAD_NAMES = ['la harina', 'el huevo', 'el panko'];
let fryTimerInterval = null;
let fryItemDrag = null;

function newFryStation() {
  return { ingredients: [], phase: 'BUILDING', proteinId: null, coat: 0, fryResult: null, frySeconds: 0, fryTone: '', matchedRecipe: null, cutState: 'NONE', cutProgress: 0, drain: 0, cold: false, arr: 0, bp: 0, kare: false, kp: 0 };
}

// ===== Etapas por área: Producción → Cocinar → Emplatar =====
// Cada área trabaja en tres pantallas:
//  · PRODUCCIÓN: existencias de insumos que se preparan con un tiempo (de a una tarea por área, en segundo plano).
//    'cook' = se gasta al agregarlo a la estación; 'plate' = se gasta al servir un plato que lo lleva.
//  · COCINAR: la estación de siempre (cuenco, wok, tabla de makis, olla). Al terminar el plato pasa al "pase".
//  · EMPLATAR: se elige un plato del pase y se arma con sus componentes. Es obligatorio y vale 25 de 100 puntos.
// Rash y Entrenamiento las activan poco a poco (STAGE_GATE_ROUND / features); la Campaña las tiene siempre (NIVEL_EXTRA.rules.stages).
// No existen en el tutorial antiguo ni en multijugador.
const STAGE_AREAS = ['ramen', 'salteados', 'makis', 'frituras'];
const STAGE_GATE_LEVEL = { ramen: 4, salteados: 6, makis: 10, frituras: 14 };     // (ya no se usa en la Campaña 2.0: allí las etapas están activas en todos los niveles; ver NIVEL_EXTRA)
const STAGE_GATE_ROUND = { ramen: 3, salteados: 9, makis: 16, frituras: 27 };   // Rash: ronda
const ST_PASS_MAX = 3;
const ST_EXTRA_SECONDS = { ramen: 8, salteados: 10, makis: 10, frituras: 14 };  // paciencia extra por pedido
const ST_PLATE_POINTS = { base: 15, order: 10, orderPenalty: 4 };               // emplatado: 25 puntos

function stagedOn(area) {
  if (isMultiplayerSession()) return false;
  if (isFree()) return true;
  if (isMultiplayerSession()) return mpAreas().includes(area);
  if ((gameState.gameMode === 'JAPON' && gameState.japon)) return japonRunAreas().includes(area);
  if (isTraining()) return trainingFeature('st_' + area);
  if (gameState.gameMode === 'NORMAL') { const c = NIVELES[currentLevelIndex]; return !!(c && c.areas && c.areas.includes(area) && (!c.rules || c.rules.stages !== false)); }   // Campaña 2.0: Producción → Cocina → Emplatar en todos los niveles
  if (gameState.gameMode === 'RASH') return (gameState.rashLevel || 1) >= (STAGE_GATE_ROUND[area] || 999);
  return false;
}
function stGateHint(area) {
  if (isTraining()) return 'el entrenamiento (completa más retos)';
  if (gameState.gameMode === 'RASH') return `la ronda ${STAGE_GATE_ROUND[area]}`;
  return `el nivel ${STAGE_GATE_LEVEL[area]}`;
}

// ---- Insumos de Producción por área ----
// key, label, icon (id de ingrediente para el dibujo), covers (ingredientes que cubre), use, time (s), batch, max, start
// how: cómo se procesa en el taller ('clean' = se limpia en la tabla tocándolo, sin cuchillo); then: 'blanch' | 'cook' | 'marinate' = proceso en dos pasos (primero se CORTA en la tabla -> queda "cortado"
// en st.cut, y luego se BLANQUEA en una hornilla gastando lo cortado -> pasa a las existencias de emplatar). time = blanqueado.
const ST_PROD = {
  ramen: [
    { key: 'poro',     label: 'Poro',           icon: 17, covers: [17], use: 'plate', how: 'cut',    time: 4,  batch: 6, max: 12, start: 6 },
    { key: 'cebolla',  label: 'Cebolla china',  icon: 18, covers: [18], use: 'plate', how: 'cut',    time: 4,  batch: 6, max: 12, start: 6 },
    { key: 'nori',     label: 'Nori',           icon: 20, covers: [20], use: 'plate', how: 'cut',    time: 3,  batch: 8, max: 16, start: 8 },
    { key: 'bambu',    label: 'Bambú',          icon: 22, covers: [22], use: 'plate', how: 'cook',   time: 10, batch: 6, max: 12, start: 6 },
    { key: 'holantao', label: 'Holantao',       icon: 23, covers: [23], use: 'plate', how: 'cut', then: 'blanch', time: 5,  batch: 6, max: 12, start: 6 },
    { key: 'col',      label: 'Col cocida',     icon: 24, covers: [24], use: 'plate', how: 'cut', then: 'blanch', time: 7,  batch: 6, max: 12, start: 6 },
    { key: 'moyashi',  label: 'Moyashi',        icon: 25, covers: [25], cookIds: [25], use: 'plate', how: 'clean', then: 'blanch', time: 4,  batch: 6, max: 12, start: 6 },
    { key: 'rulos',    label: 'Rulos de cebolla china', short: 'Rulos', icon: 74, covers: [74], use: 'plate', how: 'cut', binWord: 'en juliana', then: 'curl', time: 6, batch: 6, max: 12, start: 6 },
    { key: 'zanahoria', label: 'Zanahoria',     icon: 30, covers: [30], use: 'plate', how: 'cut',    time: 5,  batch: 6, max: 12, start: 6 },
    { key: 'champi',   label: 'Champiñones',    icon: 27, covers: [27], use: 'plate', how: 'cut',    time: 4,  batch: 4, max: 8,  start: 4 },
    { key: 'shitake',  label: 'Shitake',        icon: 28, covers: [28], use: 'plate', how: 'cut',    time: 5,  batch: 4, max: 8,  start: 4 },
    { key: 'esparrago', label: 'Espárrago',     icon: 29, covers: [29], use: 'plate', how: 'cut', then: 'blanch', time: 6,  batch: 4, max: 8,  start: 4 },
    { key: 'wanji',    label: 'Alga wanji',     icon: 21, covers: [21], use: 'plate', how: 'cut',    time: 4,  batch: 4, max: 8,  start: 4 },
    { key: 'huevo',    label: 'Huevo marinado', short: 'Huevo', icon: 15, covers: [15], use: 'plate', how: 'cook',   time: 12, batch: 6, max: 12, start: 6 },
    // Chasu flameado: se flamea en Cocina (estación "Flamear Chasu"); sus existencias son las de esa estación y se gastan al emplatar
    { key: 'chasu', label: 'Chasu flameado', short: 'Chasu', icon: 11, covers: [11], use: 'plate', virtual: true, time: 0, batch: 0, max: 4, start: 0 }
  ],
  // Salteados / Makis / Frituras (mismo taller que Ramen). how = primer paso; then = segundo paso en hornilla (time = su duración).
  // verb1 / binWord ajustan el texto del primer paso (el arroz se LAVA y queda "lavado").
  salteados: [
    // Arroz Gohan (proceso real): se lava 2 veces → se cuece (45 min) → se retira y se enfría → se pesa en porciones de 400 g. Cada unidad de existencia = 1 porción.
    //  passes: lavados seguidos (3 toques cada uno); after:'portion' + cool: al retirarlo de la hornilla se enfría solo (cool s) y luego se porciona en la tabla (3 toques = 1 porción).
    { key: 'arroz',    label: 'Arroz Gohan',     short: 'Gohan', icon: 37, covers: [37], plateToo: true, use: 'cook', how: 'clean', passes: 2, verb1: 'Lavar', binWord: 'lavado', then: 'cook', after: 'portion', cool: 8, time: 16, batch: 6, max: 12, start: 6 },
    { key: 'lomo',     label: 'Lomo cortado',    icon: 61, covers: [61],                       use: 'cook',  how: 'cut',                                                 time: 8,  batch: 4, max: 8,  start: 4 },
    // Vegetales de la cocción: se preparan aquí como en Ramen (cortar; el brócoli además se blanquea) y se gastan 1 por ingrediente al saltearlos
    { key: 'cebolla',  label: 'Cebolla',         icon: 46, covers: [46],                       use: 'cook',  how: 'cut',                                                 time: 4,  batch: 6, max: 12, start: 6 },
    { key: 'brocoli',  label: 'Brócoli',         icon: 45, covers: [45],                       use: 'cook',  how: 'cut', then: 'blanch',                                     time: 5,  batch: 6, max: 12, start: 6 },
    { key: 'champi',   label: 'Champiñones',     icon: 27, covers: [27],                       use: 'cook',  how: 'cut',                                                 time: 4,  batch: 6, max: 12, start: 6 },
    { key: 'colsal',   label: 'Col rallada',     short: 'Col', icon: 52, covers: [52], plateToo: true, use: 'cook', how: 'cut', verb1: 'Rallar', binWord: 'rallada',                                                 time: 5,  batch: 6, max: 12, start: 6 },
    { key: 'zucchini', label: 'Zucchini',        icon: 95, covers: [95],                       use: 'cook',  how: 'cut',                                                 time: 4,  batch: 6, max: 12, start: 6 },
    { key: 'cebchina', label: 'Cebolla china',   icon: 18, covers: [18], plateToo: true,       use: 'cook',  how: 'cut',                                                 time: 4,  batch: 6, max: 12, start: 6 },
    { key: 'zanahoria', label: 'Zanahoria en hilos', short: 'Zanahoria', icon: 30, covers: [30], plateToo: true, use: 'cook', how: 'cut', verb1: 'Rallar', binWord: 'rallada',                                                 time: 5,  batch: 6, max: 12, start: 6 },
    // Holantao y pimiento también van de guarnición (Vegetales finos, abajo): esta existencia es la de la cocción en el wok
    { key: 'holantao', label: 'Holantao',        icon: 23, covers: [23],                       use: 'cook',  how: 'cut',                                                 time: 5,  batch: 6, max: 12, start: 6 },
    { key: 'pimiento', label: 'Pimiento',        icon: 68, covers: [68],                       use: 'cook',  how: 'cut',                                                 time: 4,  batch: 6, max: 12, start: 6 },
    { key: 'moyashi',  label: 'Moyashi',         icon: 25, covers: [25],                       use: 'cook',  how: 'clean',                                               time: 4,  batch: 6, max: 12, start: 6 },
    { key: 'ensalada', label: 'Ensaladas',       icon: 55, covers: [55, 56],                   use: 'plate', how: 'clean', verb1: 'Lavar',                              time: 6,  batch: 6, max: 12, start: 6 },
    { key: 'betrall',  label: 'Betarraga rallada', short: 'Betarraga', icon: 42, covers: [42],     use: 'plate', how: 'cut', verb1: 'Rallar', binWord: 'rallada',                time: 6,  batch: 6, max: 12, start: 6 },
    { key: 'finos',    label: 'Negi',            icon: 63, covers: [63],                       use: 'plate', how: 'cut',                                                 time: 7,  batch: 6, max: 12, start: 6 },
    // Poro especial (Batayaki): se CORTA aquí, pasa a Frituras (solo harina y fritura) y vuelve como poro frito para emplatar. start 0: sin ese viaje no hay poro frito.
    // Cebolla caramelizada (Omuraisu): se corta y se carameliza en una hornilla
    // Cebolla caramelizada (proceso real): cebolla blanca fresca → se corta → se cocina con un poco de aceite en el wok hasta el color caramelo (la cebolla de la hornilla va cambiando de color; retirarla a tiempo)
    { key: 'cebcar',   label: 'Cebolla caramelizada', short: 'Cebolla carm.', icon: 46, covers: [103], use: 'cook', how: 'cut', binWord: 'cortada', then: 'caramelize', time: 12, batch: 4, max: 8, start: 4,
      tip1: 'Cortar la cebolla blanca fresca', tip2: 'Cocinar con un poco de aceite en el wok hasta el color caramelo',
      gesture: 'stir',
      msg2: (n, slot) => `🍯 ${n} cebolla cortada al wok con un poco de aceite: remueve en círculos con el dedo hasta el color caramelo.` },
    // Lomo ya salteado (Yasaitame, primera parte): llega a Emplatar como pieza; se hace en un wok (ver wokPartToPlate)
    { key: 'lomoSal',  label: 'Lomo salteado',   icon: 61, covers: [61], use: 'plate', virtual: true, noStockMsg: '🥩 Sin lomo salteado: saltéalo en un wok (Yasaitame, primera parte).', time: 0, batch: 0, max: 8, start: 0 },
    { key: 'poro',     label: 'Poro especial',   icon: 71, covers: [71],                       use: 'plate', how: 'cut', xfer: 'poroCut',                       time: 0,  batch: 0, max: 8,  start: 0 }
  ],
  makis: [
    // Arroz shari (proceso real): 3 lavados → se cuece → se retira y se le agrega el Zu (aderezo de vinagre y azúcar) → se enfría moviéndolo en zigzag, en 3 tiempos → listo para makis y sushi
    { key: 'shari',    label: 'Arroz shari',        icon: 38, covers: [38],     use: 'cook',  how: 'clean', passes: 3, verb1: 'Lavar', binWord: 'lavado', then: 'cook', after: 'zu', time: 14, batch: 6, max: 12, start: 6 },
    // Queso crema en bastones (cortar) · Salsa acevichada (licuar: mantener pulsado la licuadora)
    { key: 'queso',    label: 'Queso crema en bastones', short: 'Queso crema', icon: 72, covers: [72], use: 'cook', how: 'cut', binWord: 'en bastones',    time: 5,  batch: 6, max: 12, start: 6 },
    { key: 'acevi',    label: 'Salsa acevichada',   short: 'Acevichada', icon: 77, covers: [77], use: 'plate', how: 'blend',                                   time: 3,  batch: 4, max: 8,  start: 4 },
    { key: 'ebi',      label: 'Ebi cocido',         icon: 54, covers: [54],     use: 'cook',  how: 'cook',                                                    time: 12, batch: 4, max: 8,  start: 4 },
    { key: 'palta',    label: 'Palta en láminas',   icon: 64, covers: [64],     use: 'cook',  how: 'cut',                                                     time: 6,  batch: 6, max: 12, start: 6 },
    { key: 'pescado',  label: 'Atún y cecina',      icon: 39, covers: [39, 47], use: 'cook',  how: 'cut',                                                     time: 8,  batch: 4, max: 8,  start: 4 },
    { key: 'gari',     label: 'Jengibre y wasabi',  icon: 97, covers: [96, 97], use: 'plate', how: 'cut',                                                     time: 6,  batch: 8, max: 16, start: 8 },
    // Coberturas: salen de cortar el pescado en su tabla (Cocina). Existencias virtuales: se gastan al ponerlas sobre un maki
    { key: 'cobAtun',  label: 'Cobertura de atún',  short: 'Cob. atún', icon: 49, covers: [49], use: 'cook', virtual: true, noStockMsg: '🐟 Sin cobertura de atún: corta un atún en la tabla de pescado.', time: 0, batch: 0, max: 8, start: 0 },
    { key: 'cobConch', label: 'Cobertura de conchas', short: 'Cob. conchas', icon: 50, covers: [50], use: 'cook', virtual: true, noStockMsg: '🦪 Sin cobertura de conchas: corta las conchas en la tabla de pescado.', time: 0, batch: 0, max: 8, start: 0 }
  ],
  frituras: [
    // Siempre hay existencia (no se producen): bife de pollo y de cerdo, alitas, pollo ×7 (kaarage) y las salsas katsu, kare y de alitas.
    // Arroz Gohan para las guarniciones: mismo proceso que en Salteado (2 lavados, cocción, se enfría y se porciona), en porciones de 150 g
    { key: 'gohan',     label: 'Arroz Gohan',   short: 'Gohan', icon: 57, covers: [57], use: 'plate', how: 'clean', passes: 2, verb1: 'Lavar', binWord: 'lavado', then: 'cook', after: 'portion', cool: 8, grams: 150, time: 16, batch: 6, max: 12, start: 6 },
    // Mayonesa de la casa: se licúa
    { key: 'mayo',      label: 'Mayonesa de la casa', short: 'Mayo casa', icon: 62, covers: [62], use: 'plate', how: 'blend', time: 3, batch: 4, max: 8, start: 4 },
    // Rulos de cebolla china: se cortan en juliana fina y se rizan en agua con hielo
    { key: 'rulos',     label: 'Rulos de cebolla china', short: 'Rulos', icon: 74, covers: [74], use: 'plate', how: 'cut', binWord: 'en juliana', then: 'curl', time: 6, batch: 6, max: 12, start: 6 },
    { key: 'col',      label: 'Col rallada',  icon: 52, covers: [52], use: 'plate', how: 'grate',                                                         time: 8,  batch: 6, max: 12, start: 6 },
    { key: 'zanahoria', label: 'Zanahoria',   icon: 30, covers: [30], use: 'plate', how: 'grate',                                                         time: 6,  batch: 6, max: 12, start: 6 },
    { key: 'betarraga', label: 'Betarraga',   icon: 42, covers: [42], use: 'plate', how: 'grate',                                                         time: 7,  batch: 4, max: 8,  start: 4 },
    // Langostino (ebi): ya llega limpio, siempre hay existencia; en Cocina solo se empaniza y se acomoda en la tabla
    // Gyozas: primero el relleno (se pica y se marina) y luego se ARMAN a mano: masa redonda, relleno al centro, borde con huevo y pinza en 4 tiempos
    { key: 'relleno',  label: 'Relleno de gyoza', short: 'Relleno', icon: 73, covers: [], use: 'cook', how: 'cut', binWord: 'picado', then: 'marinate', time: 14, batch: 4, max: 8, start: 4 },
    { key: 'gyozas',   label: 'Gyozas',       icon: 73, covers: [73], use: 'cook',  how: 'fold',                                                          time: 0,  batch: 1, max: 8,  start: 4 },
    // Poro cortado en Salteado (Producción): llega aquí para pasarlo por harina y freírlo (ver fryPoroDone)
    { key: 'poroCut',  label: 'Poro cortado', icon: 71, covers: [71], use: 'cook',  virtual: true, noStockMsg: '🥬 Sin poro cortado: córtalo en Producción de Salteado.', time: 0, batch: 0, max: 8, start: 0 }
  ]
};

// ---- Piezas de emplatado por plato (en el orden correcto) ----
// Frituras: proteína que se fríe + componentes. Ramen: los complementos (verduras, nori, ajonjolí) de la receta.
// Salteado y Makis: la salsa, la guarnición o el acompañamiento final.
const FRY_PLATING = {
  'Chicken Katsu': { protein: 44, parts: [57, 52, 62, 30, 84, 74, 91] },      // arriba: arroz (izq.) · ensalada con mayonesa y zanahoria (centro) · salsa katsu (der.); abajo: 5 rodajas; decoran rulos y togarashi
  'Katsu Kare':    { protein: 43, parts: [57, 52, 62, 42, 74, 91] },          // ensalada con betarraga; sin salsa de acompañamiento (la kare ya baña el bife)
  'Tonkatsu':      { protein: 43, parts: [57, 52, 62, 42, 84, 74, 91] },      // betarraga en lugar de zanahoria
  'Ebi Furai':     { protein: 60, parts: [52, 62, 42, 87, 18, 74, 91] },      // sin arroz; ensalada con betarraga; teriyaki de acompañamiento; 6 langostinos
  'Kaarage':       { protein: 70, parts: [52, 62, 30, 74, 91] },              // sin arroz; la mayonesa es también la salsa de acompañamiento; 7 piezas
  'Alitas Acevichadas': { protein: 36, parts: [77, 114, 35, 113, 91] },     // alitas bañadas en acevichada; camote, ají limo, culantro y togarashi encima
  'Alitas Digión': { protein: 36, parts: [80, 34, 18] },                    // salsa digión, ajonjolí negro y cebolla china
  'Age Gyozas':    { protein: 73, parts: [52, 42, 87, 18, 74, 91] }
};
const ST_RAMEN_PLATE = new Set([11, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 74]);
const RAMEN_COOK_EXTRA = { 'Tan tan': [25] };   // piezas "de emplatado" que en esa receta se ponen en el cuenco durante la cocción
const ST_PLATE_SAL = {
  'Chaufa Shimaya':   [94, 41, 63, 33],
  'Chicken Teriyaki': [56, 87],
  'Batayaki Ramen':   [71, 98],
  'Yakimeshi':        [94, 109, 33, 18, 42, 30],
  'Yakiramen':        [33, 30],
  'Yasaitame':        [90, 33],
  'Yakitori':         [55],
  'Karameshi':        [33, 34, 18, 35, 74],
  'Omuraisu':         [84, 52, 30]
};
const ST_PLATE_MAKI = {
  'Maki Acevichado': [77, 114, 91, 97, 96], 'Maki Hotate': [82, 91, 121, 97, 96], 'Maki California': [34, 5, 97, 96],
  'Maki Guacamole': [81, 119, 18, 91, 97, 96], 'Maki Yama': [89, 87, 120, 18, 91, 97, 96], 'Maki Nin Niku': [85, 91, 97, 96],
  'Maki Amazon': [116, 97, 96], 'Maki Digion': [80, 34, 97, 96], 'Maki Furai': [34, 97, 96]
};
const ST_OPTIONAL = { makis: [96, 97] };       // el gari y el wasabi los pone el jugador si quiere: ni suman ni restan
const FRY_PLATE_GROUP = { 57: 'Base', 52: 'Ensalada', 30: 'Ensalada', 42: 'Ensalada', 114: 'Ensalada', 84: 'Salsa', 83: 'Salsa', 87: 'Salsa', 62: 'Salsa', 76: 'Salsa', 77: 'Salsa', 80: 'Salsa', 98: 'Salsa', 74: 'Decoración', 91: 'Decoración', 92: 'Decoración', 18: 'Decoración', 34: 'Decoración', 35: 'Decoración', 113: 'Decoración' };
const ST_GROUPS = {
  ramen: ['Proteína', 'Verdeos', 'Toppings', 'Verduras', 'Hongos'],
  salteados: ['Ensalada', 'Salsa', 'Decoración'],
  makis: ['Salsa', 'Guarnición'],
  frituras: ['Base', 'Ensalada', 'Salsa', 'Decoración']
};
function stGroupOf(area, id) {
  if (area === 'frituras') return FRY_PLATE_GROUP[id] || 'Decoración';
  if (area === 'ramen') return [11, 15, 16].includes(id) ? 'Proteína' : ([17, 18, 74].includes(id) ? 'Verdeos' : ([19, 20, 21].includes(id) ? 'Toppings' : ([27, 28, 29].includes(id) ? 'Hongos' : 'Verduras')));
  if (area === 'salteados') { const i = INGREDIENTES.find(x => x.id === id); return [55, 56, 117, 21].includes(id) ? 'Ensalada' : (i && i.cat === 'salsas' ? 'Salsa' : 'Decoración'); }
  const i = INGREDIENTES.find(x => x.id === id);
  return i && i.cat === 'salsas' ? 'Salsa' : 'Guarnición';
}
function stParts(area, recipe) {
  if (!recipe) return [];
  if (area === 'ramen') { const keep = RAMEN_COOK_EXTRA[recipe.name] || []; return recipe.ingredients.filter(id => ST_RAMEN_PLATE.has(id) && !keep.includes(id)); }
  if (area === 'salteados') return SAL_STAGED[recipe.name] ? SAL_STAGED[recipe.name].plate : (ST_PLATE_SAL[recipe.name] || []);
  if (area === 'makis') return ST_PLATE_MAKI[recipe.name] || [];
  const f = FRY_PLATING[recipe.name];
  return f ? f.parts : [];
}
const stRecipe = (area, name) => getRecetasByArea(area).find(r => r.name === name);
const stIngName = id => { const i = INGREDIENTES.find(x => x.id === id); return i ? (i.short || i.display) : String(id); };
const stIngIcon = id => ingIconHtml(INGREDIENTES.find(x => x.id === id));
// Icono CRUDO (como llega a Producción); si el insumo no tiene versión cruda se usa el normal.
const stIngIconRaw = id => { const i = INGREDIENTES.find(x => x.id === id); return i && i.rawImg ? `<img class="ing-ico" src="${i.rawImg}" alt="" draggable="false">` : ingIconHtml(i); };
const stHasRaw = id => { const i = INGREDIENTES.find(x => x.id === id); return !!(i && i.rawImg); };

// Vista de cocción: con las etapas activas el cuenco / wok / tabla de makis solo piden la parte de COCCIÓN
// de cada receta (sin las piezas de emplatado). Recetas con la misma parte de cocción se agrupan: se distinguen
// al emplatar (p. ej. Tonkotsu / Chashu, Maki Yama / Nin Niku).
function stView(area, list) {
  if (area === 'frituras' || !stagedOn(area)) return list;
  if (area === 'makis') list = list.filter(r => AREA_DISH_UNLOCKS.makis.some(d => d[0] === r.name));
  const groups = new Map();
  list.forEach(r => {
    const parts = new Set(stParts(area, r));
    const cook = (area === 'salteados' && SAL_STAGED[r.name]) ? salCookIds(r.name) : r.ingredients.filter(id => !parts.has(id));
    const key = area === 'makis' ? cook.join(',') : [...cook].sort((a, b) => a - b).join(',');
    if (!groups.has(key)) groups.set(key, { ...r, ingredients: cook, candidates: [] });
    groups.get(key).candidates.push(r);
  });
  return [...groups.values()].map(g => ({ ...g, name: g.candidates.map(r => r.name).join(' / ') }));
}

// ---- Estado ----
function stInit() {
  gameState.st = {};
  STAGE_AREAS.forEach(a => {
    const st = { stock: {}, cut: {}, cooled: {}, cooling: [], hot: {}, zued: {}, prep: null, board: null, knifeArmed: false, stove: [null, null], pass: [], slots: [{ item: null, items: [] }, { item: null, items: [] }] };
    ST_PROD[a].forEach(p => { st.stock[p.key] = p.start; if (p.then) st.cut[p.key] = 0; if (p.after) st.cooled[p.key] = 0; if (p.after === 'zu') { st.hot[p.key] = 0; st.zued[p.key] = 0; } });
    // el chasu flameado vive en la estación de Cocina: las existencias de emplatado leen y gastan esas mismas
    if (a === 'ramen') Object.defineProperty(st.stock, 'chasu', { enumerable: true, configurable: true, get: () => kitchenState.stocks.chasu, set: v => { kitchenState.stocks.chasu = v; } });
    gameState.st[a] = st;
  });
}
function stGet(area) {
  if (!gameState.st) stInit();
  return gameState.st[area];
}
const stProdSpeed = () => (isFree() ? 0.5 : 1);
const stProdTime = p => Math.max(2, Math.round(p.time * stProdSpeed()));
// Insumos de Producción que se gastan en la cocción (en el cuenco / sartén): los de uso 'cook' y los que lo declaran en cookIds
const stCookProdFor = (area, ingId) => ST_PROD[area].find(p => p.covers.includes(ingId) && (p.use === 'cook' || (p.cookIds || []).includes(ingId)));
const stProdFor = (area, ingId, use) => ST_PROD[area].find(p => p.covers.includes(ingId) && (!use || p.use === use || (use === 'plate' && p.plateToo)));   // plateToo: un insumo de cocción que también se emplata (arroz de guarnición)

// ---- Existencias ----
function stCookTake(area, ingId) {
  if (!stagedOn(area)) return true;
  const p = stCookProdFor(area, ingId);
  if (!p) return true;
  const st = stGet(area);
  if (st.stock[p.key] < 1) {
    showStationToast(p.noStockMsg || `🥬 Sin ${p.label.toLowerCase()}: prepáralo en Producción.`);
    try { playSound('error'); } catch (e) {}
    return false;
  }
  st.stock[p.key]--;
  return true;
}
function stCookRefund(area, ingId) {
  if (!stagedOn(area)) return;
  const p = stCookProdFor(area, ingId);
  if (p) { const st = stGet(area); st.stock[p.key] = Math.min(p.max, st.stock[p.key] + 1); }
}

function stProdStart(area, key, mode) {
  if (!stagedOn(area) || gameState.isPaused || gameState.isGameOver) return;
  const st = stGet(area), p = ST_PROD[area].find(x => x.key === key);
  if (!p) return;
  if (p.how) { stShopStart(area, p, mode); return; }   // taller: tabla + cuchillo / hornillas
  if (st.prep) { showStationToast('🥬 Ya estás preparando algo: espera a que termine.'); playSound('error'); return; }
  if (st.stock[key] >= p.max) { showStationToast(`${p.label}: el depósito ya está lleno.`); playSound('error'); return; }
  const total = stProdTime(p);
  st.prep = { key, left: total, total };
  try { playSound('prep'); } catch (e) {}
  stRenderIfOpen(area);
  updateAreaTabAlerts();
}

function stTick() {
  if (stagedOn('ramen')) { shioTick(); renderStoveArt(); toolTick(); }
  STAGE_AREAS.forEach(area => {
    if (area === 'ramen') panTick();
    const st = gameState.st && gameState.st[area];
    if (st) stShopTick(area, st);
    if (!st || !st.prep) return;
    st.prep.left--;
    if (st.prep.left <= 0) {
      const p = ST_PROD[area].find(x => x.key === st.prep.key);
      st.stock[p.key] = Math.min(p.max, st.stock[p.key] + p.batch);
      st.prep = null;
      try { playSound('stock_add'); } catch (e) {}
      showStationToast(`🥬 ${AREA_LABELS[area]}: listo ${p.label} +${p.batch}.`);
      stRenderIfOpen(area);
      renderStageTabs();
    }
  });
  stTickUi();
}

// ---- Pase ----
function stPassAdd(area, item) {
  const st = stGet(area);
  if (st.pass.length >= ST_PASS_MAX) {
    showStationToast('🍽️ El pase está lleno: emplata o descarta un plato.');
    try { playSound('error'); } catch (e) {}
    return false;
  }
  st.pass.push(item);
  try { playSound('clink'); } catch (e) {}
  showStationToast('🍽️ Plato al pase: ve a Emplatar antes de que se enfríe.');
  stRenderIfOpen(area);
  updateAreaTabAlerts();
  return true;
}
function stPassDiscard(area, i) {
  const st = stGet(area);
  if (!st.pass[i]) return;
  st.pass.splice(i, 1);
  try { playSound('trash'); } catch (e) {}
  stRenderIfOpen(area);
  updateAreaTabAlerts();
}

// ---- Emplatar ----
function stCandidates(area, item) { return item.recipes.map(n => stRecipe(area, n)).filter(Boolean); }
// Todos los componentes de emplatado de las recetas del menú del área: se muestran arriba, como la despensa de Cocina
function stPlateIngList(area) {
  const ids = new Set();
  getUnlockedRecipes().filter(r => (r.area || 'ramen') === area).forEach(r => stParts(area, r).forEach(id => ids.add(id)));
  const order = ST_GROUPS[area];
  return INGREDIENTES.filter(i => ids.has(i.id)).sort((a, b) => order.indexOf(stGroupOf(area, a.id)) - order.indexOf(stGroupOf(area, b.id)) || a.id - b.id);
}
// Pasa un plato del pase al primer cuenco libre de emplatado
function stPassToSlot(area, i) {
  if (gameState.isPaused || gameState.isGameOver) return;
  const st = stGet(area);
  if (!st.pass[i]) return;
  const slot = st.slots.findIndex(sl => !sl.item);
  if (slot === -1) { showStationToast('🍽️ Los dos cuencos están ocupados: sirve o descarta uno.'); try { playSound('error'); } catch (e) {} return; }
  st.slots[slot] = { item: st.pass.splice(i, 1)[0], items: [] };
  try { playSound('clink'); } catch (e) {}
  stRenderIfOpen(area);
  renderStageTabs();
  updateAreaTabAlerts();
}
// ¿hay existencia para sumar este componente? (cada cuenco gasta una porción de cada insumo; se cuenta lo de los otros cuencos)
function stPlateStockOk(area, id, slotIdx) {
  const p = stProdFor(area, id, 'plate');
  if (!p) return true;
  const st = stGet(area);
  if (st.slots[slotIdx] && st.slots[slotIdx].items.some(x => p.covers.includes(x))) return true;
  let used = 0;
  st.slots.forEach((sl, i) => { if (i !== slotIdx && sl.item && sl.items.some(x => p.covers.includes(x))) used++; });
  return st.stock[p.key] - used >= 1;
}
// Se acepta CUALQUIER componente (incluso uno que no lleva ese plato): si no es el plato exacto, la calidad baja mucho
function stPlateAddItem(area, slotIdx, id) {
  if (gameState.isPaused || gameState.isGameOver) return;
  const st = stGet(area), sl = st.slots[slotIdx];
  if (!sl || !sl.item) { showStationToast('🍽️ Primero toca un plato del pase para ponerlo en este cuenco.'); try { playSound('error'); } catch (e) {} return; }
  if (sl.items.includes(id)) { showStationToast(`${stIngName(id)} ya está en el cuenco ${slotIdx + 1}.`); return; }
  if (!stPlateStockOk(area, id, slotIdx)) {
    const p = stProdFor(area, id, 'plate');
    showStationToast(p.noStockMsg || (p.virtual ? '🔥 Sin chasu flameado: flaméalo en Cocina.' : `🥬 Sin ${p.label.toLowerCase()}: prepáralo en Producción.`));
    try { playSound('error'); } catch (e) {}
    return;
  }
  sl.items.push(id);
  try { playSound('clink'); } catch (e) {}
  stRenderIfOpen(area);
  updateAreaTabAlerts();
}
function stPlateRemoveItem(area, slotIdx, id) {
  const sl = stGet(area).slots[slotIdx];
  if (!sl) return;
  const at = sl.items.indexOf(id);
  if (at === -1) return;
  sl.items.splice(at, 1);
  try { playSound('click'); } catch (e) {}
  stRenderIfOpen(area);
  updateAreaTabAlerts();
}
function stPlateClear(area, slotIdx) {
  const sl = stGet(area).slots[slotIdx];
  if (!sl || !sl.items.length) return;
  sl.items = [];
  try { playSound('trash'); } catch (e) {}
  stRenderIfOpen(area);
  updateAreaTabAlerts();
}
function stSlotDiscard(area, slotIdx) {
  const st = stGet(area);
  if (!st.slots[slotIdx] || !st.slots[slotIdx].item) return;
  st.slots[slotIdx] = { item: null, items: [] };
  try { playSound('trash'); } catch (e) {}
  stRenderIfOpen(area);
  renderStageTabs();
  updateAreaTabAlerts();
}

// Evalúa lo que hay en un cuenco contra la receta más parecida de su base. Faltan / sobran componentes = plato equivocado.
function stPlateEval(area, item, items) {
  const cands = stCandidates(area, item), have = new Set(items), opt = ST_OPTIONAL[area] || [];
  let best = null, bestWrong = 1e9, bestParts = [];
  cands.forEach(r => {
    const p = stParts(area, r).filter(x => !opt.includes(x));
    const w = p.filter(x => !have.has(x)).length + items.filter(x => !p.includes(x) && !opt.includes(x)).length;
    if (w < bestWrong) { bestWrong = w; best = r; bestParts = p; }
  });
  if (!best) return null;
  const missing = bestParts.filter(x => !have.has(x)), extra = items.filter(x => !bestParts.includes(x) && !opt.includes(x)), wrong = missing.length + extra.length;
  let inv = 0;                                                       // orden de colocación (solo de los componentes que sí lleva)
  const mine = items.filter(x => bestParts.includes(x));
  for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++) if (bestParts.indexOf(mine[i]) > bestParts.indexOf(mine[j])) inv++;
  const pts = wrong ? Math.max(0, 8 - 4 * wrong) : ST_PLATE_POINTS.base + Math.max(0, ST_PLATE_POINTS.order - ST_PLATE_POINTS.orderPenalty * inv);
  return { recipe: best, parts: bestParts, missing, extra, wrong, errors: inv, pts, exact: wrong === 0 };
}
// Platos listos para servir: uno por cuenco que tenga una base (aunque el emplatado esté incompleto o equivocado)
function stReadyDishes(area) {
  const st = gameState.st && gameState.st[area];
  if (!st || !st.slots) return [];
  const out = [];
  st.slots.forEach((sl, i) => {
    if (!sl.item) return;
    const ev = stPlateEval(area, sl.item, sl.items);
    if (!ev) return;
    out.push({ area, index: i, staged: true, recipe: ev.recipe, quality: sl.item.result || 'PERFECTO', label: `Cuenco ${i + 1} de ${AREA_LABELS[area]}`,
      meta: { ...(sl.item.meta || {}), readyAt: sl.item.readyAt, plate: { pts: ev.pts - (area === 'makis' && makiPlateNeedsFlame(sl) ? 6 - makiFlamePts(sl, true) : 0), errors: ev.errors, wrong: ev.wrong, missing: ev.missing.length, extra: ev.extra.length } } });
  });
  return out;
}

// Frescura (0-20) de un plato del pase, con la curva de los platos emplatados.
function stFreshPts(area, item) {
  if (!QUALITY_FRESHNESS_ON || isFree() || (isTraining() && !trainingFeature('q_fresh'))) return 20;
  const pts = FRESHNESS_CURVES[area + '_plated'] || FRESHNESS_CURVES[area];
  const t = Math.max(0, gameState.gameClock - item.readyAt) / ((1 + [0, 0.3, 0.6, 1][getUpgradeLevel('bandeja')]) * (1 + Math.min(1.5, japonBuffSafe('fresh'))));
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) { const [t0, p0] = pts[i - 1], [t1, p1] = pts[i]; return Math.round(p0 + (p1 - p0) * (t - t0) / (t1 - t0)); }
  }
  return pts[pts.length - 1][1];
}

// Al servir (o si el cliente lo rechaza) el plato sale del cuenco y se gastan los insumos de emplatado.
function stConsumePlated(area, slotIdx) {
  const st = stGet(area), sl = st.slots[slotIdx];
  if (!sl) return;
  const used = new Set();
  sl.items.forEach(id => { const p = stProdFor(area, id, 'plate'); if (p) used.add(p.key); });
  used.forEach(k => { st.stock[k] = Math.max(0, st.stock[k] - 1); });
  try { updateKitchenStationsUI(); } catch (e) {}
  st.slots[slotIdx] = { item: null, items: [] };
  stRenderIfOpen(area);
  renderStageTabs();
  updateAreaTabAlerts();
}
function stPlateServe(area, slotIdx) {
  const sl = stGet(area).slots[slotIdx];
  if (!sl || !sl.item) { showStationToast('🍽️ Este cuenco no tiene ningún plato.'); try { playSound('error'); } catch (e) {} return; }
  serveReadyDish(area, slotIdx);
}

// ---- Pantallas de Producción y Emplatar ----
function stPanelOpen(area) {
  return gameState.activeArea === area && stagedOn(area) && ['prod', 'plate'].includes(getStage(area));
}
function stRenderIfOpen(area) { if (stPanelOpen(area)) renderStagePanel(); }
function stBackBtn(area) {
  const ck = AREA_COOK_STAGE[area];
  return `<button class="stage-panel-back fp-back" onclick="setKitchenStage('cook')">${ck.icon} ${ck.label}</button>`;
}

// ---- Taller de Producción (Ramen): tabla + cuchillo para cortar, cocina de 2 hornillas para cocer / blanquear ----
// Cada producto indica cómo se procesa (how): 'cut' = se corta con el cuchillo sobre la tabla (hay que mantenerlo
// sobre ella el tiempo indicado); 'cook' = se cuece y 'blanch' = se blanquea en una hornilla (corre solo, hay que
// retirarlo; si se olvida demasiado se pasa y solo se salva la mitad).
const ST_HOW = {
  cut:      { icon: '🔪', verb: 'Cortar',    short: 'Cortar',  imp: 'córtalo' },
  clean:    { icon: '🧺', verb: 'Limpiar',   short: 'Limpiar', imp: 'límpialo' },
  cook:     { icon: '♨️', verb: 'Cocer',     short: 'Cocer',   imp: 'cuécelo' },
  blanch:   { icon: '💧', verb: 'Blanquear', short: 'Blanq.',  imp: 'blanquéalo' },
  caramelize: { icon: '🍯', verb: 'Caramelizar', short: 'Caram.', imp: 'carameliza' },
  portion:  { icon: '⚖️', verb: 'Porcionar', short: 'Porc.',   imp: 'porciónalo' },
  curl:     { icon: '❄️', verb: 'Remojar en agua helada', short: 'Remojar', imp: 'remójalo en agua helada' },
  grate:    { icon: '🧀', verb: 'Rallar', short: 'Rallar', imp: 'rállalo en la mandolina' },
  fold:     { icon: '🥟', verb: 'Armar', short: 'Armar', imp: 'ármalas' },
  zu:       { icon: '🍶', verb: 'Aderezar con Zu y enfriar', short: 'Zu', imp: 'aderézalo con Zu' },
  blend:    { icon: '🌀', verb: 'Licuar',    short: 'Licuar',  imp: 'licúala' },
  marinate: { icon: '🧂', verb: 'Marinar',   short: 'Marinar', imp: 'márinalo' }
};
// verbo del primer paso (p.verb1 lo cambia: el arroz se LAVA) y palabra de lo que queda en el depósito (p.binWord)
const stVerb1 = p => (p.verb1 || ST_HOW[p.how].verb);
const stGrams = p => p.grams || 400;                       // gramos de cada porción de arroz (Salteado: 400 g · guarnición de Frituras: 150 g)
const SHOP_HAND_MODES = ['clean', 'portion', 'fan', 'blend', 'grate', 'fold'];      // modos de la tabla grande que se hacen con las manos
const stShopArea = () => gameState.activeArea;   // el taller (tabla / cuchillo) siempre es el del área abierta
const ST_SHOP_LATE_SECONDS = 15;   // tiempo que aguanta un producto listo en la hornilla antes de pasarse

function stIsShop(area) { return ST_PROD[area].some(p => p.how); }
const stProdOf = (area, key) => ST_PROD[area].find(x => x.key === key);

function stBin(st, p) {
  if (p.xfer && stagedOn('frituras')) {          // lo cortado se va a otra área (Frituras): su depósito vive allí
    const fs = stGet('frituras'), o = {};
    Object.defineProperty(o, p.key, { get: () => fs.stock[p.xfer], set: v => { fs.stock[p.xfer] = v; }, enumerable: true });
    return o;
  }
  return p.then ? st.cut : st.stock;
}
const stBinWord = p => p.binWord || (p.how === 'clean' ? 'limpio' : 'cortado');
const stBinTag = p => (p.how === 'clean' ? '🧺' : '🔪');   // dónde cae lo que sale de la tabla
// Arroz Gohan: tras la hornilla pasa a enfriarse (solo) y luego se porciona en la tabla. cooled = frío, listo para porcionar; cooling = lotes enfriándose
const stCoolTime = p => Math.max(2, Math.round((p.cool || 8) * stProdSpeed()));
const stCoolPending = (st, p) => (st.cooled[p.key] || 0) + ((st.hot && st.hot[p.key]) || 0) + ((st.zued && st.zued[p.key]) || 0) + (st.cooling || []).filter(b => b.key === p.key).reduce((n, b) => n + b.n, 0);
function stCoolInfo(st, p) {
  const bs = (st.cooling || []).filter(b => b.key === p.key);
  return { cooled: st.cooled[p.key] || 0, cooling: bs.reduce((n, b) => n + b.n, 0), left: bs.length ? Math.min(...bs.map(b => b.left)) : 0 };
}
function stCoolText(st, p) {
  if (p.after === 'zu') return `♨️${st.hot[p.key] || 0} 🍶${st.zued[p.key] || 0}`;
  const c = stCoolInfo(st, p); return `🧊${c.cooled}${c.cooling ? ` +${c.cooling}⏳${c.left}s` : ''}`;
}
const stAfterAvail = (st, p) => p.after === 'zu' ? (st.hot[p.key] || 0) + (st.zued[p.key] || 0) : (st.cooled[p.key] || 0);
const stAfterOff = (st, p, n) => stAfterAvail(st, p) < 1 || (p.after !== 'zu' && n >= p.max);
const stAfterTip = p => p.after === 'zu' ? `Agregar el Zu (vinagre y azúcar) al ${p.label.toLowerCase()} cocido y enfriarlo moviéndolo en zigzag` : `Porcionar el ${p.label.toLowerCase()} frío en porciones de ${stGrams(p)} g`;
const stCoolChip = (st, p) => ` <span class="fp-cut" data-cool-of="${p.key}" title="${p.after === 'zu' ? 'Cocido esperando el Zu · con Zu enfriándose' : 'Frío, listo para porcionar (400 g) · y lo que se está enfriando'}">${stCoolText(st, p)}</span>`;
// Color de lo que se caramelizó en la hornilla: pálido (crudo) → dorado → caramelo (listo) → casi negro (pasado)
function stPotTone(sl) {
  if (!sl || sl.how !== 'caramelize') return '';
  if (sl.state === 'over') return 'sepia(1) saturate(1.2) brightness(0.32)';
  const k = sl.state === 'ready' ? 1 : (sl.stir ? Math.min(1, sl.stir.prog / sl.total) : 1 - sl.left / sl.total), b = sl.stir ? sl.stir.burn : 0;   // b: se pega en el fondo
  return `sepia(${(0.15 + 0.8 * k).toFixed(2)}) saturate(${(0.7 + 1.3 * k).toFixed(2)}) hue-rotate(${Math.round(-14 * k)}deg) brightness(${(1.25 - 0.4 * k - 0.3 * b).toFixed(2)})`;
}
