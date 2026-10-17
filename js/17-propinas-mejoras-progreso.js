/* Módulo 17-propinas-mejoras-progreso — Propinas, mejoras, progreso de cuenta y Campaña (estrellas).
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// --- Cuenta del jugador: propinas y mejoras ---
// Las propinas son una moneda aparte de las ventas. Lo que se guarda es un total que solo crece
// (tips_earned) y el nivel de cada mejora comprada; el saldo = ganado − costo de las mejoras. Así dos
// dispositivos o un reintento se combinan con max() y nunca devuelven propinas ya gastadas.
// Se guarda en el dispositivo y, además, en la nube (tabla player_progress, solo por funciones RPC).
const TIP_RATE_HAPPY = 0.12; // % del pedido si el cliente aún tiene más de la mitad de su paciencia
const TIP_RATE_OK = 0.06;    // entre 25 % y 50 % de paciencia
const TIPS_EARNED_KEY = 'ramen_tips_earned';
const UPGRADES_KEY = 'ramen_upgrades';
const LEGACY_WALLET_KEY = 'ramen_propinas_wallet';

const UPGRADES = [
  { id: 'cuchillo', icon: '🔪', name: 'Cuchillo afilado', where: 'Makis y Frituras', costs: [40, 90, 160],
    effect: ['Corte en 2.5 s (antes 3 s)', 'Corte en 2 s', 'Corte en 1.5 s'] },
  { id: 'wok', icon: '🍳', name: 'Wok de hierro', where: 'Salteado', costs: [50, 110, 200],
    effect: ['Punto del salteado +10 % más ancho', 'Punto +20 %', 'Punto +30 %'] },
  { id: 'freidora', icon: '🍤', name: 'Freidora con termostato', where: 'Frituras', costs: [50, 110, 200],
    effect: ['Punto de fritura +10 % y marca de "punto" en el contador', 'Punto +20 %', 'Punto +30 %'] },
  { id: 'olla', icon: '🥢', name: 'Olla de fideos grande', where: 'Ramen', costs: [40, 90],
    effect: ['5 porciones por tanda', '6 porciones por tanda'] },
  { id: 'bandeja', icon: '♨️', name: 'Bandeja caliente', where: 'Todas', costs: [60, 120, 220],
    effect: ['Los platos tardan 30 % más en enfriarse', '60 % más', 'El doble de tiempo'] },
  { id: 'te', icon: '🍵', name: 'Té de bienvenida', where: 'Clientes', costs: [70, 140, 250],
    effect: ['Clientes con +8 % de paciencia', '+15 %', '+25 %'] },
  { id: 'mise', icon: '🧺', name: 'Mise en place', where: 'Ramen', costs: [40, 90],
    effect: ['Empiezas con fideos, Shio y chasu ya listos', 'Más porciones y también Tonkotsu'] },
  { id: 'estante', icon: '🗄️', name: 'Estante de despensa', where: 'Ramen', costs: [60, 120],
    effect: ['Caldos y chasu guardan 5 porciones', 'Guardan 6 porciones'] },
  { id: 'libro', icon: '📒', name: 'Libro de recetas', where: 'Ramen y Salteado', costs: [80],
    effect: ['Te dice qué etapa o ingrediente sigue al armar'] },
  { id: 'aprendiz', icon: '🧑‍🍳', name: 'Aprendiz', where: 'Ramen', costs: [300],
    effect: ['Recoge los fideos cuando ya están listos'] }
];
const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
// Recorrido por Japón (japon.js): mejoras permanentes de los objetos de los restaurantes y platos desbloqueados por Maestría
const japonBuffSafe = k => (typeof japonBuff === 'function' && !isMultiplayerSession() && !isTraining() && !isFree()) ? japonBuff(k) : 0;
const japonDishBonusSafe = n => { try { return (typeof japonDishBonus === 'function' && !isMultiplayerSession() && !isTraining() && !isFree()) ? japonDishBonus(n) : 0; } catch (e) { return 0; } };

const TRAINING_KEY = 'ramen_training';
const STATS_KEY = 'ramen_stats';
const CAMPAIGN_KEY = 'ramen_campaign_progress';
const accountProgress = { earned: 0, levels: {}, training: {}, stats: { d: {}, t: {}, h: {} }, campaign: { unlockedLevel: 1, levels: {} }, statsDirty: false, loaded: false, sync: 'local', pushTimer: null };

function loadAccountProgressLocal() {
  if (accountProgress.loaded) return;
  accountProgress.loaded = true;
  try {
    let earned = parseInt(safeStorage.getItem(TIPS_EARNED_KEY) || '', 10);
    if (isNaN(earned)) earned = parseInt(safeStorage.getItem(LEGACY_WALLET_KEY) || '0', 10) || 0; // propinas de la versión anterior
    accountProgress.earned = Math.max(0, earned);
    const lv = JSON.parse(safeStorage.getItem(UPGRADES_KEY) || '{}');
    accountProgress.levels = (lv && typeof lv === 'object') ? lv : {};
    const tr = JSON.parse(safeStorage.getItem(TRAINING_KEY) || '{}');
    accountProgress.training = (tr && typeof tr === 'object') ? tr : {};
    const st = JSON.parse(safeStorage.getItem(STATS_KEY) || '{}');
    accountProgress.stats = mergeStats({}, st);
    const cmp = JSON.parse(safeStorage.getItem(CAMPAIGN_KEY) || '{"unlockedLevel":1,"levels":{}}');
    accountProgress.campaign = (cmp && typeof cmp === 'object') ? cmp : { unlockedLevel: 1, levels: {} };
  } catch (e) {
    accountProgress.levels = {}; accountProgress.training = {}; accountProgress.stats = { d: {}, t: {}, h: {} };
    accountProgress.campaign = { unlockedLevel: 1, levels: {} };
  }
}

function saveAccountProgressLocal() {
  safeStorage.setItem(TIPS_EARNED_KEY, String(accountProgress.earned));
  safeStorage.setItem(UPGRADES_KEY, JSON.stringify(accountProgress.levels));
  safeStorage.setItem(TRAINING_KEY, JSON.stringify(accountProgress.training || {}));
  safeStorage.setItem(STATS_KEY, JSON.stringify(accountProgress.stats || { d: {}, t: {}, h: {} }));
  safeStorage.setItem(CAMPAIGN_KEY, JSON.stringify(accountProgress.campaign || { unlockedLevel: 1, levels: {} }));
}

function loadCampaignProgress() {
  loadAccountProgressLocal();
  return accountProgress.campaign || { unlockedLevel: 1, levels: {} };
}

function saveCampaignProgress(data) {
  accountProgress.campaign = data;
  saveAccountProgressLocal();
}

function getLevelStarThresholds(cfg) {
  const goal = cfg.goal;
  const star2 = Math.round((goal * 1.20) / 10) * 10;
  const star3 = Math.round((goal * 1.35) / 10) * 10;
  return { star1: goal, star2, star3 };
}

function calculateLevelStars(cfg, money, lost) {
  if (money < cfg.goal) return 0;
  const th = getLevelStarThresholds(cfg);
  if (money >= th.star3 && (lost || 0) <= 1) return 3;
  if (money >= th.star2 && (lost || 0) <= 2) return 2;
  return 1;
}

function recordCampaignLevelVictory(lvlNum, money, served, lost, sessionTips) {
  const prog = loadCampaignProgress();
  const cfg = NIVELES[lvlNum - 1];
  if (!cfg) return { stars: 1, prevStars: 0, isNewBest: false, unlockedNext: 1 };

  const stars = calculateLevelStars(cfg, money, lost);
  prog.levels = prog.levels || {};
  const prev = prog.levels[String(lvlNum)] || { stars: 0, bestMoney: 0 };
  const prevStars = prev.stars || 0;
  const isNewBest = stars > prevStars || money > (prev.bestMoney || 0);

  prog.levels[String(lvlNum)] = {
    stars: Math.max(prevStars, stars),
    bestMoney: Math.max(prev.bestMoney || 0, money),
    lastMoney: money,
    served,
    lost,
    updatedAt: new Date().toISOString()
  };

  if (stars >= 1) {
    prog.unlockedLevel = Math.max(prog.unlockedLevel || 1, Math.min(NIVELES.length, lvlNum + 1));
  }

  saveCampaignProgress(prog);
  try { if (typeof accountPushSoon === 'function') accountPushSoon(true); } catch (e) {}

  return { stars, prevStars, isNewBest, unlockedNext: prog.unlockedLevel };
}

function getCampaignTotalStars() {
  const prog = loadCampaignProgress();
  let total = 0;
  Object.values(prog.levels || {}).forEach(l => { total += (l.stars || 0); });
  try { if (typeof trainingTotalStars === 'function') total += trainingTotalStars(); } catch (e) {}      // los retos son subniveles: sus estrellas cuentan en el progreso
  return total;
}

function getCampaignStatsSummary() {
  const prog = loadCampaignProgress();
  const unlocked = Math.min(NIVELES.length, Math.max(1, Number(prog.unlockedLevel || 1)));
  let stars = 0;
  let completed = 0;
  if (prog.levels) {
    Object.values(prog.levels).forEach(l => {
      const st = Number(l && l.stars) || 0;
      stars += st;
      if (st > 0) completed++;
    });
  }
  try { if (typeof trainingTotalStars === 'function') stars += trainingTotalStars(); } catch (e) {}
  return {
    unlockedLevel: unlocked,
    highestUnlocked: unlocked,
    completedLevels: completed,
    totalLevels: NIVELES.length,
    stars: stars,
    maxStars: NIVELES.length * 3 + (typeof trainingMaxStars === 'function' ? trainingMaxStars() : 0)
  };
}
window.getCampaignStatsSummary = getCampaignStatsSummary;

function upgradesSpent() {
  loadAccountProgressLocal();
  let spent = 0;
  UPGRADES.forEach(u => { for (let i = 0; i < (accountProgress.levels[u.id] || 0); i++) spent += u.costs[i] || 0; });
  try { if (window.Taller) spent += Taller.spent(); } catch (e) {}      // técnicas activas y secretos del chef (taller.js)
  return spent;
}

function getPropinasWallet() {
  loadAccountProgressLocal();
  return Math.max(0, accountProgress.earned - upgradesSpent());
}

// Nivel de una mejora (0 si no la tienes). En multijugador no cuentan, para que nadie parta con ventaja.
function getUpgradeLevel(id) {
  if (isMultiplayerSession() || isTraining()) return 0; // en el entrenamiento los tiempos deben ser comparables
  loadAccountProgressLocal();
  return Math.max(0, Math.min((UPGRADE_BY_ID[id] || { costs: [] }).costs.length, accountProgress.levels[id] || 0));
}

function updatePropinasHUD() {
  const w = getPropinasWallet();
  const el = document.getElementById('hud-propinas');
  if (el) el.textContent = w;
  const chip = document.getElementById('start-wallet-val');
  if (chip) chip.textContent = w;
  const badge = document.getElementById('start-upg-badge');
  if (badge) badge.textContent = w;
}

function addPropinas(n) {
  if (!(n > 0)) return;
  loadAccountProgressLocal();
  gameState.propinasSession += n;
  accountProgress.earned += n;
  saveAccountProgressLocal();
  updatePropinasHUD();
  accountPushSoon();
}

function accountDeviceId() {
  return (typeof DeviceManager !== 'undefined' && DeviceManager.deviceId) ? DeviceManager.deviceId : null;
}

// Marcas del entrenamiento: menor tiempo, mayor medalla, mayor cobro (igual que en el servidor).
function mergeTraining(a, b) {
  const out = {};
  new Set([...Object.keys(a || {}), ...Object.keys(b || {})]).forEach(k => {
    const x = (a && a[k]) || {}, y = (b && b[k]) || {};
    const t = (x.t && y.t) ? Math.min(x.t, y.t) : (x.t || y.t || 0);
    const f = (x.f && y.f) ? Math.min(x.f, y.f) : (x.f || y.f || 0);
    out[k] = { t, ...(f ? { f } : {}), l: (y.n || 0) > (x.n || 0) ? (y.l || 0) : (x.l || 0), m: Math.max(x.m || 0, y.m || 0),
      n: Math.max(x.n || 0, y.n || 0), paid: Math.max(x.paid || 0, y.paid || 0), ...((x.s || y.s) ? { s: Math.max(x.s || 0, y.s || 0) } : {}) };
  });
  return out;
}

// Estadísticas: contadores acumulados; al combinar se queda el mayor de cada campo (igual que en el servidor).
const STATS_DISH_FIELDS = ['n', 's', 's1', 's2', 's3', 'b', 'f', 'e', 'ne'];
const STATS_DAY_FIELDS = ['t', 'n', 's', 's3', 'er', 'bu', 'cr', 'rj', 'lc', 'g'];
const STATS_DAYS_KEPT = 90;
function mergeStats(a, b) {
  const out = { d: {}, t: {}, h: {} };
  const da = (a && a.d) || {}, db = (b && b.d) || {}, ta = (a && a.t) || {}, tb = (b && b.t) || {};
  const ha = (a && a.h) || {}, hb = (b && b.h) || {};
  [...new Set([...Object.keys(ha), ...Object.keys(hb)])].filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort().slice(-STATS_DAYS_KEPT).forEach(k => {
    out.h[k] = {};
    STATS_DAY_FIELDS.forEach(f => { out.h[k][f] = Math.max(Number((ha[k] || {})[f]) || 0, Number((hb[k] || {})[f]) || 0); });
  });
  new Set([...Object.keys(da), ...Object.keys(db)]).forEach(k => {
    out.d[k] = {};
    STATS_DISH_FIELDS.forEach(f => { out.d[k][f] = Math.max(Number((da[k] || {})[f]) || 0, Number((db[k] || {})[f]) || 0); });
  });
  new Set([...Object.keys(ta), ...Object.keys(tb)]).forEach(k => { out.t[k] = Math.max(Number(ta[k]) || 0, Number(tb[k]) || 0); });
  return out;
}

function mergeLevels(a, b) {
  const out = {};
  new Set([...Object.keys(a || {}), ...Object.keys(b || {})]).forEach(k => {
    out[k] = Math.max((a && a[k]) || 0, (b && b[k]) || 0);
  });
  return out;
}
