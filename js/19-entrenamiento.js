/* Módulo 19-entrenamiento — Modo Entrenamiento: retos, medallas y resultados.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// ================= MODO ENTRENAMIENTO =================
// Sin cuenta regresiva: el reloj sube y mide cuánto tardas en completar cada reto. Los retos van de lo
// corto y fácil a lo largo y exigente, recorren las 4 áreas y, al completarlos, desbloquean las funciones
// de la cocina (cuencos, woks, áreas, estrellas, rechazos, frescura, mottainai). Cada reto da propinas
// según la medalla de tiempo (bronce 60 %, plata 85 %, oro 100 %) y solo se cobra la diferencia al mejorar.
const TRAINING_FEATURES = {
  bowls2: { icon: '🥣', name: 'Segundo cuenco de ramen' },
  bowls3: { icon: '🥣', name: 'Tercer cuenco de ramen' },
  q_stars: { icon: '⭐', name: 'Estrellas de calidad' },
  area_salteados: { icon: '🍳', name: 'Área Salteado' },
  wok2: { icon: '🍳', name: 'Segundo wok' },
  q_reject: { icon: '🚫', name: 'Los clientes rechazan platos malos' },
  area_makis: { icon: '🍣', name: 'Área Makis' },
  mottainai: { icon: '♻️', name: 'Mottainai: recortes y dashi' },
  area_frituras: { icon: '🍤', name: 'Área Frituras' },
  q_fresh: { icon: '♨️', name: 'Frescura: los platos se enfrían' },
  st_ramen: { icon: '🥬', name: 'Ramen: Producción y Emplatar' },
  st_salteados: { icon: '🥬', name: 'Salteado: Producción y Emplatar' },
  st_makis: { icon: '🥬', name: 'Makis: Producción y Emplatar' },
  st_frituras: { icon: '🥬', name: 'Frituras: Producción y Emplatar' }
};
const TRAINING_CHAPTERS = [
  { id: 'ramen', icon: '🍜', name: 'Ramen: los fundamentos' },
  { id: 'salteado', icon: '🍳', name: 'Salteado: el wok' },
  { id: 'makis', icon: '🍣', name: 'Makis: orden y enrollado' },
  { id: 'frituras', icon: '🍤', name: 'Frituras: aceite y empanizado' },
  { id: 'servicio', icon: '🏮', name: 'Servicio completo' },
  { id: 'maestria', icon: '🏆', name: 'Maestría' }
];
const TRN_RAMEN = ['Shio', 'Shoyu', 'Miso', 'Chashu', 'Tonkotsu', 'Tan tan', 'Ebi', 'Bajiru', 'Vegetariano'];
const TRN_SAL = ['Yakimeshi', 'Chicken Teriyaki', 'Chaufa Shimaya', 'Yakitori', 'Yakiramen', 'Yasaitame', 'Batayaki Ramen', 'Karameshi', 'Omuraisu'];
const TRN_MAKI = ['Maki California', 'Maki Guacamole', 'Maki Acevichado', 'Maki Hotate', 'Maki Amazon', 'Maki Yama', 'Maki Nin Niku', 'Maki Digion'];
const TRN_FRY = ['Alitas Acevichadas', 'Alitas Digión', 'Kaarage', 'Tonkatsu', 'Chicken Katsu', 'Katsu Kare', 'Ebi Furai', 'Age Gyozas'];
// Cada reto es un subnivel de la Campaña: se abre al superar el nivel indicado, que es donde ya se conocen sus platos y su técnica
// (así no choca con la línea de aprendizaje). Dentro de un nivel van de menos a más difíciles.
const TRAINING_LEVEL = {
  c01: 1, c02: 2, c03: 3, c04: 3, c05: 4,
  c08: 5, c09: 6, c10: 7, c12: 7, c11: 8, c13: 8, c14: 8,
  c15: 9, c16: 10, c17: 11, c18: 11, c19: 12, c20: 12, c21: 12,
  c22: 13, c23: 13, c24: 14, c25: 15,
  c26: 16, c27: 16, c28: 16, c06: 16,
  c29: 17, c30: 17, c31: 17, c32: 17,
  c33: 18, c34: 18, c35: 18, c40: 18, c41: 18,
  c36: 19, c37: 19, c38: 19, c42: 19, c44: 19, c07: 19,
  c39: 20, c43: 20, c45: 20, c46: 20, c47: 20, c48: 20, c49: 20, c50: 20
};
// c = id, ch = capítulo, r = pedidos exigidos por área, M = clientes a la vez, O = pedidos por cliente,
// spawn = segundos entre clientes, pm = multiplicador de paciencia, reward = propinas (medalla de oro)
const TRAINING_CHALLENGES = [
  // --- Capítulo 1: Ramen (7 retos) ---
  { id: 'c01', ch: 'ramen', title: 'Tu primer ramen', r: { ramen: 1 }, pool: { ramen: ['Shio'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 10, unlocks: [] },
  { id: 'c02', ch: 'ramen', title: 'Dos pedidos de caldo', r: { ramen: 2 }, pool: { ramen: ['Shio', 'Shoyu'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 14, unlocks: ['bowls2'] },
  { id: 'c03', ch: 'ramen', title: 'Dos cuencos a la vez', r: { ramen: 3 }, pool: { ramen: ['Shio', 'Shoyu', 'Miso'] }, M: 2, O: 1, spawn: 6, pm: 2.5, reward: 18, unlocks: ['q_stars'] },
  { id: 'c04', ch: 'ramen', title: 'Cuida el punto y chashu', r: { ramen: 4 }, minStars: 2, pool: { ramen: ['Shio', 'Shoyu', 'Miso', 'Chashu'] }, M: 2, O: 1, spawn: 6, pm: 2.5, reward: 24, unlocks: ['bowls3'] },
  { id: 'c05', ch: 'ramen', title: 'Caldos espesos y picantes', r: { ramen: 5 }, pool: { ramen: ['Miso', 'Chashu', 'Tonkotsu', 'Tan tan'] }, M: 2, O: 2, spawn: 6, pm: 2.5, reward: 30, unlocks: ['area_salteados', 'st_ramen'] },
  { id: 'c06', ch: 'ramen', title: 'Fusión e innovación', r: { ramen: 5 }, minStars: 2, pool: { ramen: ['Ebi', 'Bajiru', 'Vegetariano', 'Shio'] }, M: 2, O: 2, spawn: 6, pm: 2.3, reward: 38, unlocks: [] },
  { id: 'c07', ch: 'ramen', title: 'Maestría en Ramen', r: { ramen: 6 }, minStars: 2, pool: { ramen: TRN_RAMEN }, M: 3, O: 2, spawn: 5.5, pm: 2.2, reward: 48, unlocks: ['area_salteados', 'st_ramen'] },

  // --- Capítulo 2: Salteado (7 retos) ---
  { id: 'c08', ch: 'salteado', title: 'Tu primer wok', r: { salteados: 1 }, pool: { salteados: ['Yakimeshi'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 20, unlocks: [] },
  { id: 'c09', ch: 'salteado', title: 'El punto del wok', r: { salteados: 2 }, minStars: 2, pool: { salteados: ['Yakimeshi', 'Chicken Teriyaki'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 26, unlocks: ['wok2'] },
  { id: 'c10', ch: 'salteado', title: 'Dos woks en paralelo', r: { salteados: 4 }, pool: { salteados: ['Yakimeshi', 'Chicken Teriyaki', 'Chaufa Shimaya', 'Yakitori'] }, M: 2, O: 2, spawn: 6, pm: 2.5, reward: 34, unlocks: ['st_salteados', 'area_makis'] },
  { id: 'c11', ch: 'salteado', title: 'Fideos al wok', r: { salteados: 4 }, minStars: 2, pool: { salteados: ['Yakiramen', 'Batayaki Ramen', 'Yasaitame'] }, M: 2, O: 2, spawn: 6, pm: 2.4, reward: 42, unlocks: [] },
  { id: 'c12', ch: 'salteado', title: 'Ramen y wok', r: { ramen: 3, salteados: 3 }, pool: { ramen: ['Shio', 'Shoyu', 'Miso', 'Chashu'], salteados: ['Yakimeshi', 'Chicken Teriyaki', 'Chaufa Shimaya', 'Yakitori'] }, M: 3, O: 2, spawn: 6, pm: 2.4, reward: 52, unlocks: ['q_reject'] },
  { id: 'c13', ch: 'salteado', title: 'Sartenes especiales', r: { salteados: 5 }, minStars: 2, pool: { salteados: ['Karameshi', 'Omuraisu', 'Chaufa Shimaya', 'Batayaki Ramen'] }, M: 2, O: 2, spawn: 5.5, pm: 2.3, reward: 64, unlocks: [] },
  { id: 'c14', ch: 'salteado', title: 'Carta completa de wok', r: { salteados: 6 }, minStars: 2, pool: { salteados: TRN_SAL }, M: 3, O: 2, spawn: 5.5, pm: 2.2, reward: 78, unlocks: ['area_makis'] },

  // --- Capítulo 3: Makis (7 retos) ---
  { id: 'c15', ch: 'makis', title: 'Tu primer maki', r: { makis: 1 }, pool: { makis: ['Maki California'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 30, unlocks: ['area_frituras'] },
  { id: 'c16', ch: 'makis', title: 'Dos makis clásicos', r: { makis: 2 }, pool: { makis: ['Maki California', 'Maki Guacamole'] }, M: 1, O: 2, spawn: 6, pm: 3.0, reward: 38, unlocks: [] },
  { id: 'c17', ch: 'makis', title: 'Coberturas y salsas', r: { makis: 3 }, minStars: 2, pool: { makis: ['Maki Acevichado', 'Maki Hotate', 'Maki Amazon'] }, M: 2, O: 2, spawn: 6, pm: 2.5, reward: 48, unlocks: ['st_makis'] },
  { id: 'c18', ch: 'makis', title: 'La barra completa', r: { ramen: 2, salteados: 2, makis: 3 }, pool: { ramen: ['Shio', 'Shoyu', 'Miso', 'Chashu'], salteados: ['Yakimeshi', 'Chicken Teriyaki', 'Chaufa Shimaya', 'Yakitori'], makis: ['Maki California', 'Maki Guacamole', 'Maki Acevichado'] }, M: 3, O: 2, spawn: 6, pm: 2.4, reward: 60, unlocks: ['mottainai'] },
  { id: 'c19', ch: 'makis', title: 'Makis flameados', r: { makis: 4 }, minStars: 2, pool: { makis: ['Maki Yama', 'Maki Nin Niku', 'Maki Digion'] }, M: 2, O: 2, spawn: 5.5, pm: 2.3, reward: 74, unlocks: ['q_fresh'] },
  { id: 'c20', ch: 'makis', title: 'Fusión nikkei', r: { makis: 5 }, minStars: 2, pool: { makis: ['Maki Acevichado', 'Maki Amazon', 'Maki Furai', 'Maki Hotate'] }, M: 2, O: 2, spawn: 5.5, pm: 2.2, reward: 90, unlocks: [] },
  { id: 'c21', ch: 'makis', title: 'Itamae experto', r: { makis: 6 }, minStars: 2, pool: { makis: TRN_MAKI }, M: 3, O: 2, spawn: 5.0, pm: 2.2, reward: 110, unlocks: ['area_frituras'] },

  // --- Capítulo 4: Frituras (7 retos) ---
  { id: 'c22', ch: 'frituras', title: 'Tu primera fritura', r: { frituras: 1 }, pool: { frituras: ['Alitas Acevichadas'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 35, unlocks: [] },
  { id: 'c23', ch: 'frituras', title: 'El punto de la olla', r: { frituras: 2 }, pool: { frituras: ['Alitas Acevichadas', 'Kaarage'] }, M: 1, O: 2, spawn: 6, pm: 3.0, reward: 45, unlocks: [] },
  { id: 'c24', ch: 'frituras', title: 'Empanizado y corte', r: { frituras: 2 }, minStars: 2, pool: { frituras: ['Tonkatsu', 'Chicken Katsu'] }, M: 1, O: 2, spawn: 6, pm: 2.8, reward: 58, unlocks: ['st_frituras'] },
  { id: 'c25', ch: 'frituras', title: 'Gyozas y crujientes', r: { frituras: 4 }, pool: { frituras: ['Age Gyozas', 'Ebi Furai', 'Alitas Acevichadas', 'Kaarage'] }, M: 2, O: 2, spawn: 6, pm: 2.5, reward: 72, unlocks: ['q_fresh'] },
  { id: 'c26', ch: 'frituras', title: 'Katsu Kare y tonkatsu', r: { frituras: 4 }, minStars: 2, pool: { frituras: ['Katsu Kare', 'Tonkatsu', 'Chicken Katsu', 'Ebi Furai'] }, M: 2, O: 2, spawn: 5.5, pm: 2.4, reward: 88, unlocks: [] },
  { id: 'c27', ch: 'frituras', title: 'Cocina caliente combinada', r: { frituras: 3, salteados: 3 }, minStars: 2, pool: { frituras: TRN_FRY, salteados: TRN_SAL }, M: 3, O: 2, spawn: 5.5, pm: 2.3, reward: 108, unlocks: [] },
  { id: 'c28', ch: 'frituras', title: 'Maestro del Panko', r: { frituras: 5 }, minStars: 2, pool: { frituras: TRN_FRY }, M: 2, O: 2, spawn: 5.0, pm: 2.2, reward: 130, unlocks: [] },

  // --- Capítulo 5: Servicio (11 retos) ---
  { id: 'c29', ch: 'servicio', title: 'Apertura de salón', r: { ramen: 2, salteados: 2, makis: 2, frituras: 1 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 6.0, pm: 2.4, reward: 150, unlocks: [] },
  { id: 'c30', ch: 'servicio', title: 'Menú ejecutivo', r: { ramen: 2, salteados: 2, makis: 2, frituras: 2 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 5.8, pm: 2.3, reward: 175, unlocks: [] },
  { id: 'c31', ch: 'servicio', title: 'El almuerzo popular', r: { ramen: 3, salteados: 3, makis: 2, frituras: 2 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 5.5, pm: 2.2, reward: 205, unlocks: [] },
  { id: 'c32', ch: 'servicio', title: 'Sincronía de comandas', r: { ramen: 3, salteados: 3, makis: 3, frituras: 2 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 5.2, pm: 2.1, reward: 240, unlocks: [] },
  { id: 'c33', ch: 'servicio', title: 'Servicio de tarde ágil', r: { ramen: 3, salteados: 3, makis: 3, frituras: 3 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 2, spawn: 5.0, pm: 2.0, reward: 280, unlocks: [] },
  { id: 'c34', ch: 'servicio', title: 'Mesas familiares', r: { ramen: 4, salteados: 3, makis: 3, frituras: 3 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 4.8, pm: 1.9, reward: 325, unlocks: [] },
  { id: 'c35', ch: 'servicio', title: 'Hora pico en el callejón', r: { ramen: 4, salteados: 4, makis: 3, frituras: 3 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 4.6, pm: 1.85, reward: 375, unlocks: [] },
  { id: 'c36', ch: 'servicio', title: 'Comensales con prisa', r: { ramen: 4, salteados: 4, makis: 4, frituras: 3 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 4.4, pm: 1.8, reward: 430, unlocks: [] },
  { id: 'c37', ch: 'servicio', title: 'Cena concurrida', r: { ramen: 4, salteados: 4, makis: 4, frituras: 4 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 4.2, pm: 1.75, reward: 490, unlocks: [] },
  { id: 'c38', ch: 'servicio', title: 'Doble turno sin descanso', r: { ramen: 5, salteados: 4, makis: 4, frituras: 4 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 4.0, pm: 1.7, reward: 560, unlocks: [] },
  { id: 'c39', ch: 'servicio', title: 'Noche de festival Matsuri', r: { ramen: 5, salteados: 5, makis: 5, frituras: 5 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.8, pm: 1.6, reward: 640, unlocks: [] },

  // --- Capítulo 6: Maestría (11 retos) ---
  { id: 'c40', ch: 'maestria', title: 'Perfección de caldos y wok', r: { ramen: 3, salteados: 3 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL }, M: 3, O: 2, spawn: 5.0, pm: 1.6, reward: 450, unlocks: [] },
  { id: 'c41', ch: 'maestria', title: 'Perfección nikkei y crujiente', r: { makis: 3, frituras: 3 }, minStars: 3, pool: { makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 5.0, pm: 1.6, reward: 500, unlocks: [] },
  { id: 'c42', ch: 'maestria', title: 'Cuarteto de oro', r: { ramen: 2, salteados: 2, makis: 2, frituras: 2 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 4.6, pm: 1.5, reward: 560, unlocks: [] },
  { id: 'c43', ch: 'maestria', title: 'Maratón de cuatro fuegos', r: { ramen: 6, salteados: 6, makis: 6, frituras: 6 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.8, pm: 1.5, reward: 630, unlocks: [] },
  { id: 'c44', ch: 'maestria', title: 'Degustación Gourmet', r: { ramen: 3, salteados: 3, makis: 3, frituras: 3 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 2, spawn: 4.2, pm: 1.4, reward: 710, unlocks: [] },
  { id: 'c45', ch: 'maestria', title: 'Críticos gastronómicos', r: { ramen: 4, salteados: 4, makis: 4, frituras: 4 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 2, spawn: 4.0, pm: 1.35, reward: 800, unlocks: [] },
  { id: 'c46', ch: 'maestria', title: 'Tormenta de comandas', r: { ramen: 8, salteados: 8, makis: 7, frituras: 7 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.6, pm: 1.35, reward: 900, unlocks: [] },
  { id: 'c47', ch: 'maestria', title: 'Disciplina Zen', r: { ramen: 5, salteados: 5, makis: 5, frituras: 5 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 2, spawn: 3.8, pm: 1.25, reward: 1020, unlocks: [] },
  { id: 'c48', ch: 'maestria', title: 'El Gran Banquete Shimaya', r: { ramen: 8, salteados: 8, makis: 8, frituras: 8 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.4, pm: 1.2, reward: 1160, unlocks: [] },
  { id: 'c49', ch: 'maestria', title: 'Sinfonía Culinaria Impecable', r: { ramen: 6, salteados: 6, makis: 6, frituras: 6 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.4, pm: 1.2, reward: 1320, unlocks: [] },
  { id: 'c50', ch: 'maestria', title: 'Leyenda Viviente del Sol Naciente', r: { ramen: 7, salteados: 7, makis: 7, frituras: 7 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.2, pm: 1.1, reward: 1500, unlocks: [] }
].map((c, i) => ({ ...c, num: i + 1, index: i, lvl: TRAINING_LEVEL[c.id] || 1, reqs: Object.entries(c.r).map(([area, n]) => ({ area, n })) }));
const TRAINING_BY_ID = Object.fromEntries(TRAINING_CHALLENGES.map(c => [c.id, c]));
const TRAINING_SEC = { ramen: 20, salteados: 22, makis: 24, frituras: 38 };   // segundos por pedido (jugador que ya conoce el juego)
const TRAINING_MEDAL_SHARE = [0, 0.6, 0.85, 1];

const TRAINING_AREA_FIRST = { salteados: 5, makis: 9, frituras: 13 };
function trainingDishLevel(area, name) {
  if (area === 'ramen') { const n = NIVELES.find(x => (x.ramen_names || []).includes(name)); return n ? n.level : 1; }
  const d = ((typeof AREA_DISH_UNLOCKS !== 'undefined' && AREA_DISH_UNLOCKS[area]) || []).find(x => x[0] === name);
  return d ? d[1] : (TRAINING_AREA_FIRST[area] || 1);
}
function trainingPoolNames(ch, area) {
  const all = ch.pool[area] || [], ok = all.filter(n => trainingDishLevel(area, n) <= ch.lvl);
  return ok.length ? ok : all;
}
const isTraining = () => gameState.gameMode === 'TRAINING' && !!gameState.training && !gameState.isGameOver;

function trainingTotal(ch) { return ch.reqs.reduce((t, r) => t + r.n, 0); }
// Tiempo de oro: el trabajo estimado de los pedidos con un margen de 1.5 más 25 s de preparación.
function trainingPar(ch) {
  return Math.round((25 + ch.reqs.reduce((t, r) => t + r.n * TRAINING_SEC[r.area] * 1.5, 0)) / 5) * 5;
}
function trainingMedalFor(time, par) { return time <= par ? 3 : (time <= par * 1.35 ? 2 : 1); }
function trainingMedalIcon(m) { return ['', '🥉', '🥈', '🥇'][m] || ''; }
function formatTrainingTime(sec) { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }

function trainingProgressOf(id) { loadAccountProgressLocal(); return (accountProgress.training || {})[id] || null; }
function trainingLevelBeaten(lvl) { try { const l = (loadCampaignProgress().levels || {})[String(lvl)]; return !!(l && (l.stars || 0) >= 1); } catch (e) { return false; } }
function trainingOfLevel(lvl) { return TRAINING_CHALLENGES.filter(c => c.lvl === lvl); }
// Un reto se abre al superar su nivel de Campaña (los que ya se completaron antes siguen abiertos).
function trainingIsOpen(ch) { return trainingLevelBeaten(ch.lvl) || ((trainingProgressOf(ch.id) || {}).m || 0) > 0; }
function trainingDoneCount() { return TRAINING_CHALLENGES.filter(c => (trainingProgressOf(c.id) || {}).m > 0).length; }
function trainingMedalCount(m) { return TRAINING_CHALLENGES.filter(c => (trainingProgressOf(c.id) || {}).m === m).length; }
function trainingNextChallenge() { return TRAINING_CHALLENGES.find(c => trainingIsOpen(c) && !((trainingProgressOf(c.id) || {}).m > 0)) || null; }
// Nivel de la Campaña donde conviene abrir la lista de retos: el del siguiente reto disponible o, si no hay, el del primero pendiente.
function trainingFocusLevel() { const n = trainingNextChallenge() || TRAINING_CHALLENGES.find(c => !((trainingProgressOf(c.id) || {}).m > 0)); return n ? n.lvl : 20; }
// Abre el mapa de Campaña con los retos del nivel (desde el final de un nivel, la pantalla principal o el resultado de un reto).
function openLevelRetos(lvl) {
  const em = document.getElementById('level-end-modal'); if (em) em.classList.remove('active');
  const rm = document.getElementById('training-result-modal'); if (rm) rm.classList.remove('active');
  try { if (typeof returnToStartMenu === 'function' && gameState && gameState.isGameOver) returnToStartMenu(); } catch (e) {}
  if (window.CampMapa) CampMapa.retos(lvl || trainingFocusLevel()); else openTrainingModal();
}

// Funciones de la cocina abiertas por los retos ya completados.
function trainingFeaturesUnlocked() {
  const set = new Set();
  TRAINING_CHALLENGES.forEach(c => { if ((trainingProgressOf(c.id) || {}).m > 0) c.unlocks.forEach(f => set.add(f)); });
  return set;
}
function trainingFeature(id) { return true; }   // los retos son subniveles de la Campaña: ya se aprendió lo necesario antes de abrirlos
const bowlLimit = () => Math.min(stagedOn('ramen') ? 2 : 3, !isTraining() ? 3 : (trainingFeature('bowls3') ? 3 : (trainingFeature('bowls2') ? 2 : 1)));   // con etapas el ramen usa 2 cuencos
const wokLimit = () => (!isTraining() ? 2 : (trainingFeature('wok2') ? 2 : 1));

function trainingPoolRecipes(ch, area) {
  const cat = area === 'ramen' ? RECETAS_RAMEN : AREA_CATALOGS[area];
  return trainingPoolNames(ch, area).map(n => cat.find(r => r.name === n)).filter(Boolean);
}

function trainingConfig() {
  const ch = gameState.training.challenge;
  return { level: ch.num, name: ch.title, customers: 999, base_patience: 60, max_orders: ch.O, max_customers: ch.M,
    ramen_names: ch.pool.ramen ? trainingPoolNames(ch, 'ramen') : [], spawn_time: ch.spawn, patience_mult: ch.pm };
}

function trainingObjectiveText(ch) {
  const words = { ramen: 'ramen', salteados: 'salteados', makis: 'makis', frituras: 'frituras' };
  return ch.reqs.map(r => `${AREA_ICONS[r.area]} ${r.n} ${words[r.area]}`).join(' · ') + (ch.minStars ? ` · con ⭐${ch.minStars}+` : '');
}

function showTrainingObjective() {
  if (!isTraining()) return;
  const t = gameState.training, ch = t.challenge;
  const left = ch.reqs.map(r => `${AREA_ICONS[r.area]} ${Math.min(r.n, t.counts[r.area] || 0)}/${r.n}`).join(' · ');
  showStationToast(`🏋️ Reto ${ch.num}: ${ch.title}<br>${left}${ch.minStars ? ' · con ⭐' + ch.minStars + '+' : ''}`);
}

// Pedidos del siguiente cliente: solo lo que aún falta para el reto (así el reto es finito y justo).
function trainingPickOrders(cfg) {
  const t = gameState.training, ch = t.challenge;
  const outstanding = {};
  gameState.customerSlots.forEach(c => { if (c) c.orders.forEach(o => { if (!o.served) outstanding[getRecipeArea(o.recipe)] = (outstanding[getRecipeArea(o.recipe)] || 0) + 1; }); });
  const avail = {};
  let cap = 0;
  ch.reqs.forEach(r => {
    const left = r.n - (t.counts[r.area] || 0) - (outstanding[r.area] || 0);
    if (left > 0) { avail[r.area] = left; cap += left; }
  });
  if (!cap) return [];
  const want = Math.min(Math.floor(Math.random() * cfg.max_orders) + 1, cap);
  const orders = [];
  for (let i = 0; i < want; i++) {
    const areas = Object.keys(avail).filter(a => avail[a] > 0);
    const a = areas[Math.floor(Math.random() * areas.length)];
    avail[a]--;
    const pool = trainingPoolRecipes(ch, a);
    orders.push({ recipe: pool[Math.floor(Math.random() * pool.length)], served: false });
  }
  return orders;
}

function trainingTotalCount() { return trainingTotal(gameState.training.challenge); }
function trainingDoneInRun() {
  const t = gameState.training;
  return t.challenge.reqs.reduce((sum, r) => sum + Math.min(r.n, t.counts[r.area] || 0), 0);
}

// Un pedido servido cuenta para el reto si cumple las estrellas mínimas.
function trainingOnServe(area, tier) {
  if (!isTraining()) return;
  const t = gameState.training;
  if (tier >= (t.challenge.minStars || 0)) t.counts[area] = (t.counts[area] || 0) + 1;
}

function trainingCheckComplete() {
  if (!isTraining()) return;
  const t = gameState.training;
  if (t.challenge.reqs.every(r => (t.counts[r.area] || 0) >= r.n)) trainingComplete();
}

function trainingComplete() {
  const t = gameState.training;
  if (t.done) return;
  t.done = true;
  const time = gameState.gameClock;
  const result = trainingRecord(t.challenge, time);
  gameState.isGameOver = true;
  clearInterval(gameLoopInterval);
  resetCookingStations();
  try { playSound('win'); } catch (e) {}
  showTrainingResult(result);
}

// Guarda el tiempo, la medalla y cobra solo la parte de propinas que aún no se había cobrado.
function trainingRecord(ch, time) {
  loadAccountProgressLocal();
  const featuresBefore = trainingFeaturesUnlocked();
  const prev = (accountProgress.training || {})[ch.id] || {};
  const par = trainingPar(ch);
  const medal = trainingMedalFor(time, par);
  const best = prev.t ? Math.min(prev.t, time) : time;
  const m = Math.max(prev.m || 0, medal);
  const target = Math.round(ch.reward * TRAINING_MEDAL_SHARE[m]);
  const reward = Math.max(0, target - (prev.paid || 0));
  accountProgress.training[ch.id] = { t: best, ...(prev.f || !prev.m ? { f: prev.f || time } : {}), l: time, m, n: (prev.n || 0) + 1, paid: Math.max(prev.paid || 0, target) };
  saveAccountProgressLocal();
  if (reward > 0) addPropinas(reward);
  accountPushSoon(true);
  const unlockedNow = [...trainingFeaturesUnlocked()].filter(f => !featuresBefore.has(f));
  return { challenge: ch, time, par, medal, prevBest: prev.t || 0, best, improved: !!prev.t && time < prev.t, firstTime: !prev.m,
    medalUp: medal > (prev.m || 0), reward, unlocked: unlockedNow, next: trainingOfLevel(ch.lvl).find(c => c.index > ch.index) || null };
}

function startTrainingChallenge(id) {
  const ch = TRAINING_BY_ID[id];
  if (!ch || !trainingIsOpen(ch)) return;
  closeTrainingModal();
  try { if (window.CampMapa) CampMapa.close(); } catch (e) {}
  const rm = document.getElementById('training-result-modal'); if (rm) rm.classList.remove('active');
  startSelectedMode = 'TRAINING';
  gameState.training = { challenge: ch, counts: {}, done: false };
  executeStartGame();
}

// --- Entrenamiento: lista de retos, ficha del reto y resultado ---
let trainingView = { mode: 'list', id: null };
let trainingOnly = null;   // lista de capítulos a mostrar (desde un área del local); null = todos

function openTrainingModal(id, only) {
  if (!id && window.CampMapa) { CampMapa.retos(trainingFocusLevel()); return; }      // los retos son subniveles de la Campaña
  trainingOnly = (only && only.length) ? only : null;
  trainingView = id ? { mode: 'brief', id } : { mode: 'list', id: null };
  renderTrainingHub();
  const m = document.getElementById('training-modal');
  m.style.display = '';
  m.classList.add('active');
}
function closeTrainingModal() {
  const m = document.getElementById('training-modal');
  if (m) m.classList.remove('active');
}

function trnWordArea(a) { return { ramen: 'ramen', salteados: 'salteados', makis: 'makis', frituras: 'frituras' }[a]; }

let trainingChapterFilter = 'all';

function setTrainingChapterFilter(chId) {
  trainingChapterFilter = chId;
  renderTrainingHub();
}

function renderTrainingHub() {
  const body = document.getElementById('trn-body');
  const title = document.getElementById('trn-title');
  if (!body) return;
  if (trainingView.mode === 'brief' && TRAINING_BY_ID[trainingView.id]) {
    const ch = TRAINING_BY_ID[trainingView.id];
    if (title) title.textContent = `🏋️ Reto ${ch.num}: ${ch.title}`;
    body.innerHTML = trainingBriefHtml(ch);
    return;
  }
  if (title) title.textContent = '🏋️ Entrenamiento (50 Retos)';
  const done = trainingDoneCount(), total = TRAINING_CHALLENGES.length;
  const feats = trainingFeaturesUnlocked();
  const next = trainingNextChallenge();
  const featChips = Object.entries(TRAINING_FEATURES).map(([id, f]) =>
    `<span class="trn-feat ${feats.has(id) ? 'on' : ''}" title="${f.name}">${feats.has(id) ? f.icon : '🔒'} ${f.name}</span>`).join('');

  const filterTabs = [
    { id: 'all', label: `⭐ Todos (${total})` },
    ...TRAINING_CHAPTERS.map(chp => {
      const cnt = TRAINING_CHALLENGES.filter(c => c.ch === chp.id).length;
      return { id: chp.id, label: `${chp.icon} ${chp.name.split(':')[0]} (${cnt})` };
    })
  ].map(tab => {
    const active = (!trainingOnly && trainingChapterFilter === tab.id) ? 'active' : '';
    return `<button class="trn-filter-btn ${active}" onclick="setTrainingChapterFilter('${tab.id}')">${tab.label}</button>`;
  }).join('');

  const chapters = TRAINING_CHAPTERS.filter(chp => {
    if (trainingOnly && trainingOnly.length) return trainingOnly.includes(chp.id);
    if (trainingChapterFilter !== 'all') return chp.id === trainingChapterFilter;
    return true;
  }).map(chp => {
    const list = TRAINING_CHALLENGES.filter(c => c.ch === chp.id);
    const dn = list.filter(c => (trainingProgressOf(c.id) || {}).m > 0).length;
    const cards = list.map(c => {
      const p = trainingProgressOf(c.id) || {};
      const open = trainingIsOpen(c);
      const state = !open ? 'locked' : (p.m > 0 ? 'done' : 'open');
      const isNext = next && next.id === c.id;
      const meta = !open ? '🔒 Bloqueado' : (p.m > 0 ? `${trainingMedalIcon(p.m)} ${formatTrainingTime(p.t)} · +${c.reward}🧧` : `▶ +${c.reward}🧧`);
      const starBadge = c.minStars ? `<span class="trn-star-badge" title="Mínimo ⭐${c.minStars}">⭐${c.minStars}</span>` : '';
      return `<button class="trn-card ${state} ${isNext ? 'next' : ''}" ${open ? '' : 'disabled'} onclick="openTrainingBriefing('${c.id}')">
        <span class="trn-num">${c.num}</span><span class="trn-ctitle">${c.title}</span>${starBadge}<span class="trn-meta">${meta}</span></button>`;
    }).join('');
    return `<div class="trn-chapter"><div class="trn-chead"><span>${chp.icon} ${chp.name}</span><span class="trn-cprog">${dn}/${list.length}</span></div><div class="trn-grid">${cards}</div></div>`;
  }).join('');

  body.innerHTML = `
    <div class="trn-summary">
      <div class="trn-sumline"><b>Retos ${done}/${total}</b><span>🥇 ${trainingMedalCount(3)} · 🥈 ${trainingMedalCount(2)} · 🥉 ${trainingMedalCount(1)}</span><span>🧧 Saldo ${getPropinasWallet()}</span></div>
      <div class="trn-bar"><i style="width:${Math.round(100 * done / total)}%"></i></div>
      <div class="trn-note">Sin cuenta regresiva: se mide cuánto tardas. Mejora tu tiempo para subir de medalla y cobrar más propinas.</div>
      <details class="trn-featbox"><summary>🔓 Funciones de la cocina: ${[...feats].length}/${Object.keys(TRAINING_FEATURES).length} desbloqueadas</summary><div class="trn-feats">${featChips}</div></details>
      ${next ? `<button class="acc-btn" onclick="openTrainingBriefing('${next.id}')">▶ Continuar: Reto ${next.num} · ${next.title}</button>` : '<div class="trn-note">🏆 ¡Completaste todo el recorrido! Repite retos para bajar tus tiempos.</div>'}
    </div>
    ${!trainingOnly ? `<div class="trn-filter-bar">${filterTabs}</div>` : ''}
    ${chapters}`;
}

function openTrainingBriefing(id) {
  const ch = TRAINING_BY_ID[id];
  if (!ch || !trainingIsOpen(ch)) return;
  trainingView = { mode: 'brief', id };
  renderTrainingHub();
  const b = document.getElementById('trn-body'); if (b) b.scrollTop = 0;
}
function backToTrainingList() { trainingView = { mode: 'list', id: null }; renderTrainingHub(); }

function trainingBriefHtml(ch) {
  const p = trainingProgressOf(ch.id) || {};
  const par = trainingPar(ch);
  const reqs = ch.reqs.map(r => `<li>${AREA_ICONS[r.area]} Sirve <b>${r.n}</b> ${trnWordArea(r.area)}</li>`).join('') +
    (ch.minStars ? `<li>⭐ Cada plato debe llegar a <b>${ch.minStars} estrella(s)</b> o más para contar</li>` : '');
  const dishes = Object.keys(ch.pool).map(a => `<div class="trn-dishes">${AREA_ICONS[a]} ${trainingPoolNames(ch, a).join(', ')}</div>`).join('');
  const unlocks = `<div class="trn-unlock">🏮 Subnivel del nivel ${ch.lvl} de la Campaña</div>`;
  const rw = [1, 2, 3].map(m => `${trainingMedalIcon(m)} ${Math.round(ch.reward * TRAINING_MEDAL_SHARE[m])}`).join(' · ');
  const hist = p.t ? `<div class="trn-hist">Tu mejor: <b>${formatTrainingTime(p.t)}</b> ${trainingMedalIcon(p.m)} · Último: ${formatTrainingTime(p.l)} · Intentos: ${p.n || 1}</div>` : '<div class="trn-hist">Aún no lo has completado.</div>';
  return `
    <button class="trn-back" onclick="backToTrainingList()">← Todos los retos</button>
    <div class="trn-brief">
      <div class="trn-bcol">
        <h3>Objetivo</h3><ul class="trn-list">${reqs}</ul>
        <h3>Platos que pedirán</h3>${dishes}
        <h3>Ritmo</h3><div class="trn-dishes">👥 Hasta ${ch.M} cliente(s) a la vez · ${ch.O > 1 ? 'hasta ' + ch.O + ' pedidos' : '1 pedido'} por cliente · llegan cada ~${ch.spawn} s · ${ch.pm >= 2.5 ? 'paciencia relajada' : (ch.pm >= 1.8 ? 'paciencia normal' : (ch.pm >= 1.4 ? 'clientes exigentes' : 'paciencia estricta / rush'))}</div>
      </div>
      <div class="trn-bcol">
        <h3>Medallas por tiempo</h3>
        <div class="trn-dishes">🥇 hasta ${formatTrainingTime(par)} · 🥈 hasta ${formatTrainingTime(par * 1.35)} · 🥉 cualquier tiempo</div>
        <h3>Propinas (🧧)</h3><div class="trn-dishes">${rw} <small>(solo se cobra la diferencia al mejorar)</small></div>
        ${unlocks}${hist}
        <button class="acc-btn trn-go" onclick="startTrainingChallenge('${ch.id}')">▶ Empezar reto</button>
      </div>
    </div>`;
}

function showTrainingResult(res) {
  const ch = res.challenge;
  const delta = res.prevBest ? res.time - res.prevBest : 0;
  let cmp;
  if (res.firstTime) cmp = '🆕 Primera vez completado';
  else if (res.improved) cmp = `<span class="trn-up">▼ ${formatTrainingTime(-delta)} más rápido que tu mejor (${formatTrainingTime(res.prevBest)})</span>`;
  else if (delta === 0) cmp = `= Igualaste tu mejor tiempo (${formatTrainingTime(res.best)})`;
  else cmp = `<span class="trn-down">▲ +${formatTrainingTime(delta)} sobre tu mejor (${formatTrainingTime(res.best)})</span>`;
  const tips = res.reward > 0 ? `🧧 <b>+${res.reward}</b> propinas${res.medalUp && !res.firstTime ? ' por subir de medalla' : ''}` : '🧧 Sin propinas nuevas: sube de medalla para cobrar más';
  const unl = '';
  const nextOpen = res.next && trainingIsOpen(res.next);
  const body = document.getElementById('trn-result-body');
  body.innerHTML = `
    <div class="trn-medal">${trainingMedalIcon(res.medal)}</div>
    <div class="trn-rtitle">Reto ${ch.num} completado · ${ch.title}</div>
    <div class="trn-rline">⏱ Tu tiempo: <b>${formatTrainingTime(res.time)}</b> · 🎯 Oro: ${formatTrainingTime(res.par)}</div>
    <div class="trn-rline">${cmp}</div>
    <div class="trn-rline">${tips}</div>
    ${unl}
    <div class="acc-row" style="justify-content:center;margin-top:8px;">
      ${nextOpen ? `<button class="acc-btn" onclick="startTrainingChallenge('${res.next.id}')">▶ Siguiente: ${res.next.title}</button>` : ''}
      <button class="acc-btn alt" onclick="startTrainingChallenge('${ch.id}')">↻ Repetir</button>
      <button class="acc-btn alt" onclick="trainingResultToList()">🏮 Retos del nivel ${ch.lvl}</button>
    </div>`;
  const m = document.getElementById('training-result-modal');
  m.style.display = '';
  m.classList.add('active');
}
function trainingResultToList() {
  const ch = (gameState.training || {}).challenge;
  openLevelRetos(ch ? ch.lvl : trainingFocusLevel());
}
