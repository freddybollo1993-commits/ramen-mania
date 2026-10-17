/* Módulo 19-entrenamiento — Modo Entrenamiento: retos, medallas y resultados.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// ================= MODO ENTRENAMIENTO =================
// Sin cuenta regresiva: el reloj sube y mide cuánto tardas en completar cada reto. Los retos van de lo
// corto y fácil a lo largo y exigente, recorren las 4 áreas y son subniveles de la Campaña (se abren al superar su nivel). Cada reto da propinas
// según la medalla de tiempo (bronce 60 %, plata 85 %, oro 100 %) y solo se cobra la diferencia al mejorar.
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
  { id: 'c01', ch: 'ramen', title: 'Tu primer ramen', r: { ramen: 1 }, pool: { ramen: ['Shio'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 10 },
  { id: 'c02', ch: 'ramen', title: 'Dos pedidos de caldo', r: { ramen: 2 }, pool: { ramen: ['Shio', 'Shoyu'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 14 },
  { id: 'c03', ch: 'ramen', title: 'Dos cuencos a la vez', r: { ramen: 3 }, pool: { ramen: ['Shio', 'Shoyu', 'Miso'] }, M: 2, O: 1, spawn: 6, pm: 2.5, reward: 18 },
  { id: 'c04', ch: 'ramen', title: 'Cuida el punto y chashu', r: { ramen: 4 }, minStars: 2, pool: { ramen: ['Shio', 'Shoyu', 'Miso', 'Chashu'] }, M: 2, O: 1, spawn: 6, pm: 2.5, reward: 24 },
  { id: 'c05', ch: 'ramen', title: 'Caldos espesos y picantes', r: { ramen: 5 }, pool: { ramen: ['Miso', 'Chashu', 'Tonkotsu', 'Tan tan'] }, M: 2, O: 2, spawn: 6, pm: 2.5, reward: 30 },
  { id: 'c06', ch: 'ramen', title: 'Fusión e innovación', r: { ramen: 5 }, minStars: 2, pool: { ramen: ['Ebi', 'Bajiru', 'Vegetariano', 'Shio'] }, M: 2, O: 2, spawn: 6, pm: 2.3, reward: 38 },
  { id: 'c07', ch: 'ramen', title: 'Maestría en Ramen', r: { ramen: 6 }, minStars: 2, pool: { ramen: TRN_RAMEN }, M: 3, O: 2, spawn: 5.5, pm: 2.2, reward: 48 },

  // --- Capítulo 2: Salteado (7 retos) ---
  { id: 'c08', ch: 'salteado', title: 'Tu primer wok', r: { salteados: 1 }, pool: { salteados: ['Yakimeshi'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 20 },
  { id: 'c09', ch: 'salteado', title: 'El punto del wok', r: { salteados: 2 }, minStars: 2, pool: { salteados: ['Yakimeshi', 'Chicken Teriyaki'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 26 },
  { id: 'c10', ch: 'salteado', title: 'Dos woks en paralelo', r: { salteados: 4 }, pool: { salteados: ['Yakimeshi', 'Chicken Teriyaki', 'Chaufa Shimaya', 'Yakitori'] }, M: 2, O: 2, spawn: 6, pm: 2.5, reward: 34 },
  { id: 'c11', ch: 'salteado', title: 'Fideos al wok', r: { salteados: 4 }, minStars: 2, pool: { salteados: ['Yakiramen', 'Batayaki Ramen', 'Yasaitame'] }, M: 2, O: 2, spawn: 6, pm: 2.4, reward: 42 },
  { id: 'c12', ch: 'salteado', title: 'Ramen y wok', r: { ramen: 3, salteados: 3 }, pool: { ramen: ['Shio', 'Shoyu', 'Miso', 'Chashu'], salteados: ['Yakimeshi', 'Chicken Teriyaki', 'Chaufa Shimaya', 'Yakitori'] }, M: 3, O: 2, spawn: 6, pm: 2.4, reward: 52 },
  { id: 'c13', ch: 'salteado', title: 'Sartenes especiales', r: { salteados: 5 }, minStars: 2, pool: { salteados: ['Karameshi', 'Omuraisu', 'Chaufa Shimaya', 'Batayaki Ramen'] }, M: 2, O: 2, spawn: 5.5, pm: 2.3, reward: 64 },
  { id: 'c14', ch: 'salteado', title: 'Carta completa de wok', r: { salteados: 6 }, minStars: 2, pool: { salteados: TRN_SAL }, M: 3, O: 2, spawn: 5.5, pm: 2.2, reward: 78 },

  // --- Capítulo 3: Makis (7 retos) ---
  { id: 'c15', ch: 'makis', title: 'Tu primer maki', r: { makis: 1 }, pool: { makis: ['Maki California'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 30 },
  { id: 'c16', ch: 'makis', title: 'Dos makis clásicos', r: { makis: 2 }, pool: { makis: ['Maki California', 'Maki Guacamole'] }, M: 1, O: 2, spawn: 6, pm: 3.0, reward: 38 },
  { id: 'c17', ch: 'makis', title: 'Coberturas y salsas', r: { makis: 3 }, minStars: 2, pool: { makis: ['Maki Acevichado', 'Maki Hotate', 'Maki Amazon'] }, M: 2, O: 2, spawn: 6, pm: 2.5, reward: 48 },
  { id: 'c18', ch: 'makis', title: 'La barra completa', r: { ramen: 2, salteados: 2, makis: 3 }, pool: { ramen: ['Shio', 'Shoyu', 'Miso', 'Chashu'], salteados: ['Yakimeshi', 'Chicken Teriyaki', 'Chaufa Shimaya', 'Yakitori'], makis: ['Maki California', 'Maki Guacamole', 'Maki Acevichado'] }, M: 3, O: 2, spawn: 6, pm: 2.4, reward: 60 },
  { id: 'c19', ch: 'makis', title: 'Makis flameados', r: { makis: 4 }, minStars: 2, pool: { makis: ['Maki Yama', 'Maki Nin Niku', 'Maki Digion'] }, M: 2, O: 2, spawn: 5.5, pm: 2.3, reward: 74 },
  { id: 'c20', ch: 'makis', title: 'Fusión nikkei', r: { makis: 5 }, minStars: 2, pool: { makis: ['Maki Acevichado', 'Maki Amazon', 'Maki Furai', 'Maki Hotate'] }, M: 2, O: 2, spawn: 5.5, pm: 2.2, reward: 90 },
  { id: 'c21', ch: 'makis', title: 'Itamae experto', r: { makis: 6 }, minStars: 2, pool: { makis: TRN_MAKI }, M: 3, O: 2, spawn: 5.0, pm: 2.2, reward: 110 },

  // --- Capítulo 4: Frituras (7 retos) ---
  { id: 'c22', ch: 'frituras', title: 'Tu primera fritura', r: { frituras: 1 }, pool: { frituras: ['Alitas Acevichadas'] }, M: 1, O: 1, spawn: 6, pm: 3.0, reward: 35 },
  { id: 'c23', ch: 'frituras', title: 'El punto de la olla', r: { frituras: 2 }, pool: { frituras: ['Alitas Acevichadas', 'Kaarage'] }, M: 1, O: 2, spawn: 6, pm: 3.0, reward: 45 },
  { id: 'c24', ch: 'frituras', title: 'Empanizado y corte', r: { frituras: 2 }, minStars: 2, pool: { frituras: ['Tonkatsu', 'Chicken Katsu'] }, M: 1, O: 2, spawn: 6, pm: 2.8, reward: 58 },
  { id: 'c25', ch: 'frituras', title: 'Gyozas y crujientes', r: { frituras: 4 }, pool: { frituras: ['Age Gyozas', 'Ebi Furai', 'Alitas Acevichadas', 'Kaarage'] }, M: 2, O: 2, spawn: 6, pm: 2.5, reward: 72 },
  { id: 'c26', ch: 'frituras', title: 'Katsu Kare y tonkatsu', r: { frituras: 4 }, minStars: 2, pool: { frituras: ['Katsu Kare', 'Tonkatsu', 'Chicken Katsu', 'Ebi Furai'] }, M: 2, O: 2, spawn: 5.5, pm: 2.4, reward: 88 },
  { id: 'c27', ch: 'frituras', title: 'Cocina caliente combinada', r: { frituras: 3, salteados: 3 }, minStars: 2, pool: { frituras: TRN_FRY, salteados: TRN_SAL }, M: 3, O: 2, spawn: 5.5, pm: 2.3, reward: 108 },
  { id: 'c28', ch: 'frituras', title: 'Maestro del Panko', r: { frituras: 5 }, minStars: 2, pool: { frituras: TRN_FRY }, M: 2, O: 2, spawn: 5.0, pm: 2.2, reward: 130 },

  // --- Capítulo 5: Servicio (11 retos) ---
  { id: 'c29', ch: 'servicio', title: 'Apertura de salón', r: { ramen: 2, salteados: 2, makis: 2, frituras: 1 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 6.0, pm: 2.4, reward: 150 },
  { id: 'c30', ch: 'servicio', title: 'Menú ejecutivo', r: { ramen: 2, salteados: 2, makis: 2, frituras: 2 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 5.8, pm: 2.3, reward: 175 },
  { id: 'c31', ch: 'servicio', title: 'El almuerzo popular', r: { ramen: 3, salteados: 3, makis: 2, frituras: 2 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 5.5, pm: 2.2, reward: 205 },
  { id: 'c32', ch: 'servicio', title: 'Sincronía de comandas', r: { ramen: 3, salteados: 3, makis: 3, frituras: 2 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 5.2, pm: 2.1, reward: 240 },
  { id: 'c33', ch: 'servicio', title: 'Servicio de tarde ágil', r: { ramen: 3, salteados: 3, makis: 3, frituras: 3 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 2, spawn: 5.0, pm: 2.0, reward: 280 },
  { id: 'c34', ch: 'servicio', title: 'Mesas familiares', r: { ramen: 4, salteados: 3, makis: 3, frituras: 3 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 4.8, pm: 1.9, reward: 325 },
  { id: 'c35', ch: 'servicio', title: 'Hora pico en el callejón', r: { ramen: 4, salteados: 4, makis: 3, frituras: 3 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 4.6, pm: 1.85, reward: 375 },
  { id: 'c36', ch: 'servicio', title: 'Comensales con prisa', r: { ramen: 4, salteados: 4, makis: 4, frituras: 3 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 4.4, pm: 1.8, reward: 430 },
  { id: 'c37', ch: 'servicio', title: 'Cena concurrida', r: { ramen: 4, salteados: 4, makis: 4, frituras: 4 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 4.2, pm: 1.75, reward: 490 },
  { id: 'c38', ch: 'servicio', title: 'Doble turno sin descanso', r: { ramen: 5, salteados: 4, makis: 4, frituras: 4 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 4.0, pm: 1.7, reward: 560 },
  { id: 'c39', ch: 'servicio', title: 'Noche de festival Matsuri', r: { ramen: 5, salteados: 5, makis: 5, frituras: 5 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.8, pm: 1.6, reward: 640 },

  // --- Capítulo 6: Maestría (11 retos) ---
  { id: 'c40', ch: 'maestria', title: 'Perfección de caldos y wok', r: { ramen: 3, salteados: 3 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL }, M: 3, O: 2, spawn: 5.0, pm: 1.6, reward: 450 },
  { id: 'c41', ch: 'maestria', title: 'Perfección nikkei y crujiente', r: { makis: 3, frituras: 3 }, minStars: 3, pool: { makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 5.0, pm: 1.6, reward: 500 },
  { id: 'c42', ch: 'maestria', title: 'Cuarteto de oro', r: { ramen: 2, salteados: 2, makis: 2, frituras: 2 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 3, O: 2, spawn: 4.6, pm: 1.5, reward: 560 },
  { id: 'c43', ch: 'maestria', title: 'Maratón de cuatro fuegos', r: { ramen: 6, salteados: 6, makis: 6, frituras: 6 }, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.8, pm: 1.5, reward: 630 },
  { id: 'c44', ch: 'maestria', title: 'Degustación Gourmet', r: { ramen: 3, salteados: 3, makis: 3, frituras: 3 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 2, spawn: 4.2, pm: 1.4, reward: 710 },
  { id: 'c45', ch: 'maestria', title: 'Críticos gastronómicos', r: { ramen: 4, salteados: 4, makis: 4, frituras: 4 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 2, spawn: 4.0, pm: 1.35, reward: 800 },
  { id: 'c46', ch: 'maestria', title: 'Tormenta de comandas', r: { ramen: 8, salteados: 8, makis: 7, frituras: 7 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.6, pm: 1.35, reward: 900 },
  { id: 'c47', ch: 'maestria', title: 'Disciplina Zen', r: { ramen: 5, salteados: 5, makis: 5, frituras: 5 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 2, spawn: 3.8, pm: 1.25, reward: 1020 },
  { id: 'c48', ch: 'maestria', title: 'El Gran Banquete Shimaya', r: { ramen: 8, salteados: 8, makis: 8, frituras: 8 }, minStars: 2, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.4, pm: 1.2, reward: 1160 },
  { id: 'c49', ch: 'maestria', title: 'Sinfonía Culinaria Impecable', r: { ramen: 6, salteados: 6, makis: 6, frituras: 6 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.4, pm: 1.2, reward: 1320 },
  { id: 'c50', ch: 'maestria', title: 'Leyenda Viviente del Sol Naciente', r: { ramen: 7, salteados: 7, makis: 7, frituras: 7 }, minStars: 3, pool: { ramen: TRN_RAMEN, salteados: TRN_SAL, makis: TRN_MAKI, frituras: TRN_FRY }, M: 4, O: 3, spawn: 3.2, pm: 1.1, reward: 1500 }
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

// Calidad de un reto: se mide con el promedio de estrellas de los platos servidos (1 a 3).
// Margen: un reto que pide ⭐N se supera con un promedio de N − 0,4, así un plato flojo se compensa con otro mejor.
// Estrellas del reto: 1 al llegar al mínimo, 2 a mitad de camino hacia el 3 y 3 casi perfecto. Esas estrellas suman al contador general de la Campaña.
function trainingMinQ(ch) { return ch.minStars ? Math.max(1, ch.minStars - 0.4) : 1; }
function trainingStarCuts(ch) { const m = trainingMinQ(ch); return [m, m + (3 - m) * 0.5, m + (3 - m) * 0.85]; }
function trainingStarsFor(ch, avg) { const c = trainingStarCuts(ch); return avg + 1e-9 >= c[2] ? 3 : (avg + 1e-9 >= c[1] ? 2 : (avg + 1e-9 >= c[0] ? 1 : 0)); }
const trainingStarsOf = p => (p ? (p.s || (p.m > 0 ? 1 : 0)) : 0);       // los retos hechos antes de existir las estrellas valen 1
function trainingTotalStars() { try { return TRAINING_CHALLENGES.reduce((t, c) => t + trainingStarsOf(trainingProgressOf(c.id)), 0); } catch (e) { return 0; } }
const trainingMaxStars = () => TRAINING_CHALLENGES.length * 3;
const starsText3 = n => '★'.repeat(n) + '☆'.repeat(3 - n);

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
  return ch.reqs.map(r => `${AREA_ICONS[r.area]} ${r.n} ${words[r.area]}`).join(' · ') + (ch.minStars ? ` · calidad media ⭐${trainingMinQ(ch).toFixed(1)}+` : '');
}

function showTrainingObjective() {
  if (!isTraining()) return;
  const t = gameState.training, ch = t.challenge;
  const left = ch.reqs.map(r => `${AREA_ICONS[r.area]} ${Math.min(r.n, t.counts[r.area] || 0)}/${r.n}`).join(' · ');
  showStationToast(`🏋️ Reto ${ch.num}: ${ch.title}<br>${left}${ch.minStars ? ' · calidad media ⭐' + trainingMinQ(ch).toFixed(1) + '+' : ''}`);
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

// Todo pedido servido cuenta para el reto y suma su calidad al promedio (la exigencia se mide al final, con margen).
function trainingOnServe(area, tier) {
  if (!isTraining()) return;
  const t = gameState.training;
  t.counts[area] = (t.counts[area] || 0) + 1;
  t.tierSum = (t.tierSum || 0) + Math.max(1, tier | 0); t.served = (t.served || 0) + 1;
}
const trainingAvg = () => { const t = gameState.training; return t && t.served ? t.tierSum / t.served : 0; };

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
  const result = trainingRecord(t.challenge, time, trainingAvg());
  gameState.isGameOver = true;
  clearInterval(gameLoopInterval);
  resetCookingStations();
  try { playSound('win'); } catch (e) {}
  showTrainingResult(result);
}

// Guarda el tiempo, la medalla y cobra solo la parte de propinas que aún no se había cobrado.
function trainingRecord(ch, time, avg) {
  loadAccountProgressLocal();
  const prev = (accountProgress.training || {})[ch.id] || {};
  const stars = trainingStarsFor(ch, avg == null ? 3 : avg), minQ = trainingMinQ(ch), prevStars = trainingStarsOf(prev);
  if (stars === 0) {      // calidad por debajo del mínimo: el reto queda incompleto (se guarda el intento, sin medalla, propinas ni estrellas)
    accountProgress.training[ch.id] = { t: prev.t || 0, ...(prev.f ? { f: prev.f } : {}), l: time, m: prev.m || 0, n: (prev.n || 0) + 1, paid: prev.paid || 0, ...(prev.s ? { s: prev.s } : {}) };
    saveAccountProgressLocal(); accountPushSoon(true);
    return { challenge: ch, time, par: trainingPar(ch), incomplete: true, avg, minQ, stars: 0, prevStars, medal: 0, reward: 0, next: null };
  }
  const par = trainingPar(ch);
  const medal = trainingMedalFor(time, par);
  const best = prev.t ? Math.min(prev.t, time) : time;
  const m = Math.max(prev.m || 0, medal);
  const target = Math.round(ch.reward * TRAINING_MEDAL_SHARE[m]);
  const reward = Math.max(0, target - (prev.paid || 0));
  accountProgress.training[ch.id] = { t: best, ...(prev.f || !prev.m ? { f: prev.f || time } : {}), l: time, m, n: (prev.n || 0) + 1, paid: Math.max(prev.paid || 0, target), s: Math.max(prevStars, stars) };
  saveAccountProgressLocal();
  if (reward > 0) addPropinas(reward);
  accountPushSoon(true);
  return { challenge: ch, time, par, medal, avg, minQ, stars, prevStars, prevBest: prev.t || 0, best, improved: !!prev.t && time < prev.t, firstTime: !prev.m,
    medalUp: medal > (prev.m || 0), reward, next: trainingOfLevel(ch.lvl).find(c => c.index > ch.index) || null };
}

function startTrainingChallenge(id) {
  const ch = TRAINING_BY_ID[id];
  if (!ch || !trainingIsOpen(ch)) return;
  try { if (window.CampMapa) CampMapa.close(); } catch (e) {}
  const rm = document.getElementById('training-result-modal'); if (rm) rm.classList.remove('active');
  startSelectedMode = 'TRAINING';
  gameState.training = { challenge: ch, counts: {}, done: false };
  executeStartGame();
}

// --- Resultado de un reto ---
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
  if (res.incomplete) {
    body.innerHTML = `
    <div class="trn-medal">🔁</div>
    <div class="trn-rtitle">Reto ${ch.num} incompleto · ${ch.title}</div>
    <div class="trn-rline">⭐ Calidad media <b>${res.avg.toFixed(1)}</b> · mínimo para superarlo <b>${res.minQ.toFixed(1)}</b></div>
    <div class="trn-rline">Cuida el punto de cada plato: este reto se supera con calidad, no solo con prisa. No cuenta para tus estrellas hasta superarlo.</div>
    <div class="acc-row" style="justify-content:center;margin-top:8px;">
      <button class="acc-btn" onclick="startTrainingChallenge('${ch.id}')">↻ Reintentar</button>
      <button class="acc-btn alt" onclick="trainingResultToList()">🏮 Retos del nivel ${ch.lvl}</button>
    </div>`;
    const mi = document.getElementById('training-result-modal'); mi.style.display = ''; mi.classList.add('active');
    return;
  }
  const gained = Math.max(0, res.stars - res.prevStars);
  const starLine = `<div class="trn-rline">⭐ Calidad media <b>${res.avg.toFixed(1)}</b> → <b>${starsText3(res.stars)}</b>${gained > 0 ? ` · <b>+${gained}</b> al contador de Campaña` : (res.stars === res.prevStars ? ' · igualaste tu mejor calidad' : '')}</div>`;
  body.innerHTML = `
    <div class="trn-medal">${trainingMedalIcon(res.medal)}</div>
    <div class="trn-rtitle">Reto ${ch.num} completado · ${ch.title}</div>
    ${starLine}
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
