/* Módulo 21-cocina-libre-mejoras-vfx — Cocina libre, tienda de mejoras, Mottainai, retratos de clientes y efectos.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// ================= COCINA LIBRE =================
// Todo el catálogo desbloqueado, sin tiempo, sin perder clientes y sin final: para cocinar con calma
// cualquier plato y aprender a tu ritmo. Los clientes esperan siempre; no hay rechazos, ni frescura,
// ni propinas ni récords. Desde 🍽️ se puede pedir un plato concreto, elegir qué áreas piden al azar
// y pausar la llegada de clientes.
const FREE_AREAS = ['ramen', 'salteados', 'makis', 'frituras'];
const isFree = () => gameState.gameMode === 'FREE' && !!gameState.free && !gameState.isGameOver;

function freeAllRecipes() {
  const list = [...RECETAS_RAMEN];
  Object.keys(AREA_DISH_UNLOCKS).forEach(a => AREA_DISH_UNLOCKS[a].forEach(([name]) => {
    const r = AREA_CATALOGS[a].find(x => x.name === name);
    if (r) list.push(r);
  }));
  return list;
}

function freeConfig() {
  return { level: 1, name: 'Cocina libre', customers: 999, base_patience: 999, max_orders: 2, max_customers: 3,
    ramen_names: RECETAS_RAMEN.map(r => r.name), spawn_time: 10, patience_mult: 1 };
}

function freePickRecipe() {
  const all = freeAllRecipes();
  const pool = all.filter(r => gameState.free.areas.includes(getRecipeArea(r)));
  const src = pool.length ? pool : all;
  return src[Math.floor(Math.random() * src.length)];
}

function openFreePracticeModal() {
  if (!isFree()) return;
  renderFreeModal();
  const m = document.getElementById('free-modal');
  m.style.display = '';
  m.classList.add('active');
}
function closeFreePracticeModal() {
  const m = document.getElementById('free-modal');
  if (m) m.classList.remove('active');
}

function renderFreeModal() {
  const f = gameState.free;
  if (!f) return;
  const names = { ramen: 'Ramen', salteados: 'Salteado', makis: 'Makis', frituras: 'Frituras' };
  const chips = FREE_AREAS.map(a => `<label class="free-chip"><input type="checkbox" ${f.areas.includes(a) ? 'checked' : ''} onchange="freeToggleArea('${a}')"> ${AREA_ICONS[a]} ${names[a]}</label>`).join('');
  const all = freeAllRecipes();
  const groups = FREE_AREAS.map(a => {
    const dishes = all.filter(r => getRecipeArea(r) === a).map(r =>
      `<button class="free-dish" onclick="freeOrderDish('${a}', '${r.name.replace(/'/g, "\\'")}')">${r.name}<small>S/ ${r.price}</small></button>`).join('');
    return `<h3 class="free-h">${AREA_ICONS[a]} ${names[a]}</h3><div class="free-grid">${dishes}</div>`;
  }).join('');
  document.getElementById('free-body').innerHTML = `
    <div class="free-opts">
      <label class="free-chip"><input type="checkbox" ${f.auto ? 'checked' : ''} onchange="freeSetAuto(this.checked)"> 👥 Clientes automáticos</label>
      <button class="acc-btn alt" onclick="freeClearCustomers()">🧹 Despejar clientes</button>
      <button class="acc-btn" onclick="closeFreePracticeModal(); openStatsModal()">📊 Mis estadísticas</button>
    </div>
    <div class="free-note">Los pedidos al azar vienen de: <span class="free-chips">${chips}</span></div>
    <div class="free-note"><b>Toca un plato para que un cliente lo pida ahora.</b> Nadie se va ni hay tiempo: cocina con calma.</div>
    ${groups}`;
}

function freeSetAuto(on) { if (gameState.free) gameState.free.auto = !!on; }
function freeToggleArea(a) {
  const f = gameState.free; if (!f) return;
  f.areas = f.areas.includes(a) ? f.areas.filter(x => x !== a) : [...f.areas, a];
  if (!f.areas.length) f.areas = [a]; // siempre queda al menos un área
  renderFreeModal();
}
function freeClearCustomers() {
  gameState.customerSlots = [null, null, null, null];
  closeCustomerOrderModal();
  renderCustomers();
  renderBowls();
  showStationToast('🧹 Fila despejada.');
}
function freeOrderDish(area, name) {
  const r = (area === 'ramen' ? RECETAS_RAMEN : AREA_CATALOGS[area]).find(x => x.name === name);
  if (!r) return;
  const before = gameState.customerSlots.filter(Boolean).length;
  spawnCustomer(r);
  const after = gameState.customerSlots.filter(Boolean).length;
  closeFreePracticeModal();
  showStationToast(after > before ? `🍽️ Un cliente pidió ${r.name}.` : '🍽️ La fila está llena: atiende a un cliente primero.');
}

// --- Tienda de mejoras (menú de inicio) ---
function buyUpgrade(id) {
  const u = UPGRADE_BY_ID[id];
  if (!u) return;
  loadAccountProgressLocal();
  const lvl = accountProgress.levels[id] || 0;
  if (lvl >= u.costs.length) return;
  const cost = u.costs[lvl];
  if (getPropinasWallet() < cost) {
    showStationToast(`🧧 Te faltan ${cost - getPropinasWallet()} propinas para ${u.name}.`);
    return;
  }
  accountProgress.levels[id] = lvl + 1;
  saveAccountProgressLocal();
  updatePropinasHUD();
  try { playSound('serve'); } catch (e) {}
  accountPushSoon(true);
  renderUpgradesShop();
}

function renderUpgradesShop() {
  const grid = document.getElementById('upg-grid');
  if (!grid) return;
  const wallet = getPropinasWallet();
  const walletEl = document.getElementById('upg-wallet');
  if (walletEl) walletEl.textContent = wallet;
  const syncEl = document.getElementById('upg-sync');
  if (syncEl) {
    const registered = !!(typeof DeviceManager !== 'undefined' && DeviceManager.currentPlayer);
    const labels = {
      ok: '☁️ Guardado en tu cuenta',
      syncing: '☁️ Sincronizando…',
      error: '📱 Guardado en este dispositivo (se subirá a tu cuenta al reconectar)',
      local: '📱 Guardado en este dispositivo'
    };
    syncEl.textContent = labels[accountProgress.sync] + (registered ? '' : ' · registra tu alias para no perderlo');
  }
  grid.innerHTML = UPGRADES.map(u => {
    const lvl = getUpgradeLevel(u.id);
    const max = u.costs.length;
    const maxed = lvl >= max;
    const cost = maxed ? 0 : u.costs[lvl];
    const can = !maxed && wallet >= cost;
    const pips = Array.from({ length: max }, (_, i) => `<i class="upg-pip ${i < lvl ? 'on' : ''}"></i>`).join('');
    const now = lvl > 0 ? `<div class="upg-now">✔ ${u.effect[lvl - 1]}</div>` : '';
    const next = maxed ? '<div class="upg-next">Nivel máximo</div>' : `<div class="upg-next">Siguiente: ${u.effect[lvl]}</div>`;
    return `<div class="upg-card ${maxed ? 'maxed' : ''}">
      <div class="upg-head"><span class="upg-ico">${u.icon}</span><div><div class="upg-name">${u.name}</div><div class="upg-where">${u.where}</div></div><div class="upg-pips">${pips}</div></div>
      ${now}${next}
      <button class="upg-buy" ${maxed ? 'disabled' : ''} ${can || maxed ? '' : 'data-poor="1"'} onclick="buyUpgrade('${u.id}')">${maxed ? '✔ Completa' : `🧧 ${cost} · Comprar`}</button>
    </div>`;
  }).join('');
}

function refreshUpgradesShopIfOpen() {
  const m = document.getElementById('upgrades-modal');
  if (m && m.classList.contains('active')) renderUpgradesShop();
}

function openUpgradesModal() {
  renderUpgradesShop();
  document.getElementById('upgrades-modal').style.display = '';
  document.getElementById('upgrades-modal').classList.add('active');
  accountPull();
}

function closeUpgradesModal() {
  document.getElementById('upgrades-modal').classList.remove('active');
}

// --- Efectos de las mejoras en la partida ---
const stockCap = () => [4, 5, 6][Math.min(2, getUpgradeLevel('estante'))];
const noodleCap = () => [4, 5, 6][Math.min(2, getUpgradeLevel('olla'))];
function cutSeconds() { return [MAKI_CUT_SECONDS, 2.5, 2, 1.5][getUpgradeLevel('cuchillo')]; }

// "Mise en place": se empieza el nivel con parte de la cocina ya preparada.
function applyMiseEnPlace() {
  const l = getUpgradeLevel('mise');
  if (!l) return;
  const cap = stockCap(), st = kitchenState.stocks;
  st.noodles = l === 1 ? 2 : 4;
  st.shio = Math.min(cap, l === 1 ? 2 : 3);
  st.tonkotsu = l === 1 ? 0 : Math.min(cap, 2);
  st.chasu = Math.min(cap, l === 1 ? 2 : 3);
  updateKitchenStationsUI(true);
}

// --- Mottainai (cero desperdicio): las mermas limpias no se tiran, se juntan ---
// Puntas de maki, recortes de katsu y lo descartado sin quemar suman recortes; cada 3 hacen 1 dashi,
// que reemplaza el calentado del Caldo Shio (fondo de aprovechamiento, como en la cocina real).
const MOTTAINAI_PER_DASHI = 3;
const MOTTAINAI_MAX_DASHI = 3;
const MOTTAINAI_MIN_DISCARD = 3; // un descarte solo cuenta si ya había trabajo hecho (3+ ingredientes)

function updateMottainaiHUD() {
  const el = document.getElementById('hud-mottainai');
  if (el) el.textContent = `${gameState.recortes}/${MOTTAINAI_PER_DASHI}·🐟${gameState.dashi}`;
}

function addTrimmings(n, source) {
  if (n <= 0 || gameState.isGameOver || (isTraining() && !trainingFeature('mottainai'))) return;
  gameState.recortes += n;
  let made = 0;
  while (gameState.recortes >= MOTTAINAI_PER_DASHI) {
    gameState.recortes -= MOTTAINAI_PER_DASHI;
    if (gameState.dashi < MOTTAINAI_MAX_DASHI) { gameState.dashi++; made++; }
  }
  updateMottainaiHUD();
  showStationToast(made
    ? `♻️ Mottainai: ${source} → ¡1 dashi listo! (sirve de Caldo Shio)`
    : `♻️ +${n} recorte${n > 1 ? 's' : ''} (${source}) · ${gameState.recortes}/${MOTTAINAI_PER_DASHI} para el dashi`);
}

// --- Retratos chibi de clientes: 3 expresiones según la paciencia que les queda ---
// Feliz (> 60 %), neutro (30-60 %) y molesto (< 30 %), con el mismo contorno #2b1810 del resto del arte.
const CUSTOMER_LOOKS = {
  Kenji:   { hair: '#2b1810', style: 'short',    skin: '#f6d3b3', shirt: '#165e83' },
  Sakura:  { hair: '#3b2418', style: 'bob',      skin: '#f9dcc4', shirt: '#b7282e', pin: '#f48fb1' },
  Hiroshi: { hair: '#e8e8e8', style: 'bald',     skin: '#f1c9a5', shirt: '#42602d', stache: true },
  Akemi:   { hair: '#2b1810', style: 'pigtails', skin: '#f9dcc4', shirt: '#d9822b', pin: '#e53935' },
  Takeshi: { hair: '#1a1a1a', style: 'spiky',    skin: '#f0c8a0', shirt: '#2b2f4a', band: true },
  Yuki:    { hair: '#e9b94a', style: 'long',     skin: '#fbe0cc', shirt: '#7e57c2' },
  Ren:     { hair: '#4a3a34', style: 'short',    skin: '#f6d3b3', shirt: '#2e7d6a' },
  Aoi:     { hair: '#b9532a', style: 'long',     skin: '#f9dcc4', shirt: '#1e88c9' }
};

// Campaña 2.0 (fase 3): clientes dibujados. Cada uno tiene una hoja assets/menu/cliente_<nombre>.webp de 4 columnas × 2 filas = 4 poses × 2 fotogramas.
// Poses: wait (paciencia > 40 %), impatient (10-40 %), angry (≤ 10 %) y happy (1,5 s tras servirle un plato). Si la hoja aún no cargó se usa el retrato SVG de siempre.
const CLIENTE_ART = {};                                   // nombre -> true cuando su hoja ya está en memoria
// Las 8 hojas están reordenadas en celdas uniformes de 258×288 (cabeza del mismo tamaño en las dos filas, cintura abajo). Sufijo _2 = archivo nuevo: el service worker ignora el ?v=
const clienteSrc = n => 'assets/menu/cliente_' + n.toLowerCase() + '_2.webp';
function preloadClientesArt() {
  Object.keys(CUSTOMER_LOOKS).forEach(n => {
    const im = new Image();
    im.onload = () => { CLIENTE_ART[n] = true; };
    im.src = clienteSrc(n);
    if (im.decode) im.decode().then(() => { CLIENTE_ART[n] = true; }).catch(() => {});
  });
}
window.addEventListener('load', () => setTimeout(preloadClientesArt, 1200));

function customerMood(ratio, c) {
  if (c && c._happyUntil && Date.now() < c._happyUntil) return 'happy';
  return ratio > 0.4 ? 'wait' : (ratio > 0.1 ? 'impatient' : 'angry');
}

function clientePortraitSprite(name, mood) {
  const p = { wait: [0, 0], impatient: [0, 2], happy: [1, 0], angry: [1, 2] }[mood] || [0, 0];   // [fila, columna del primer fotograma]
  return '<i class="cust-sp ' + mood + '" style="background-image:url(\'' + clienteSrc(name) + '\');background-position-y:' + (p[0] * 100) + '%;--xa:' + (p[1] / 3 * 100).toFixed(2) + '%;--xb:' + ((p[1] + 1) / 3 * 100).toFixed(2) + '%"></i>';
}

function customerPortraitHtml(c, mood) {
  const L = CUSTOMER_LOOKS[c.name];
  if (!L) return c.avatar;
  if (CLIENTE_ART[c.name]) return clientePortraitSprite(c.name, mood);
  mood = ({ wait: 'happy', impatient: 'neutral' })[mood] || mood;      // retrato SVG de respaldo: solo conoce happy / neutral / angry
  const O = '#2b1810', W = 2;
  const hairBack = {
    short: '',
    bald: '',
    spiky: '',
    bob: `<path d="M12,52 Q7,16 32,11 Q57,16 52,52 Q46,42 46,34 L18,34 Q18,42 12,52 Z" fill="${L.hair}" stroke="${O}" stroke-width="${W}" stroke-linejoin="round"/>`,
    long: `<path d="M11,60 Q6,16 32,11 Q58,16 53,60 Q47,48 47,34 L17,34 Q17,48 11,60 Z" fill="${L.hair}" stroke="${O}" stroke-width="${W}" stroke-linejoin="round"/>`,
    pigtails: `<circle cx="10" cy="38" r="7" fill="${L.hair}" stroke="${O}" stroke-width="${W}"/><circle cx="54" cy="38" r="7" fill="${L.hair}" stroke="${O}" stroke-width="${W}"/><circle cx="14" cy="31" r="2.6" fill="${L.pin}" stroke="${O}" stroke-width="1.4"/><circle cx="50" cy="31" r="2.6" fill="${L.pin}" stroke="${O}" stroke-width="1.4"/>`
  }[L.style] || '';
  const hairFront = {
    short: `<path d="M14,34 Q12,13 32,12 Q52,13 50,34 Q44,23 32,24 Q20,23 14,34 Z" fill="${L.hair}" stroke="${O}" stroke-width="${W}" stroke-linejoin="round"/>`,
    bob: `<path d="M15,33 Q16,15 32,15 Q48,15 49,33 Q40,22 32,25 Q24,22 15,33 Z" fill="${L.hair}" stroke="${O}" stroke-width="${W}" stroke-linejoin="round"/>`,
    long: `<path d="M15,33 Q16,15 32,15 Q48,15 49,33 Q40,22 32,25 Q24,22 15,33 Z" fill="${L.hair}" stroke="${O}" stroke-width="${W}" stroke-linejoin="round"/>`,
    pigtails: `<path d="M15,33 Q16,14 32,14 Q48,14 49,33 Q40,22 32,25 Q24,22 15,33 Z" fill="${L.hair}" stroke="${O}" stroke-width="${W}" stroke-linejoin="round"/>`,
    spiky: `<path d="M14,32 L15,13 L24,21 L28,8 L34,20 L42,8 L44,21 L51,13 L50,32 Q44,23 32,24 Q20,23 14,32 Z" fill="${L.hair}" stroke="${O}" stroke-width="${W}" stroke-linejoin="round"/>`,
    bald: `<ellipse cx="14" cy="38" rx="3.5" ry="6" fill="${L.hair}" stroke="${O}" stroke-width="1.6"/><ellipse cx="50" cy="38" rx="3.5" ry="6" fill="${L.hair}" stroke="${O}" stroke-width="1.6"/>`
  }[L.style] || '';
  const band = L.band ? `<rect x="14" y="23" width="36" height="6" rx="1.5" fill="#fff8e1" stroke="${O}" stroke-width="1.6"/><circle cx="32" cy="26" r="2" fill="#d32f2f"/>` : '';
  const pin = (L.pin && (L.style === 'bob')) ? `<circle cx="44" cy="22" r="3" fill="${L.pin}" stroke="${O}" stroke-width="1.4"/>` : '';
  const brows = mood === 'angry'
    ? `<path d="M20,29 L29,33 M44,29 L35,33" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>`
    : (L.stache ? `<path d="M20,31 Q25,28 29,31 M35,31 Q39,28 44,31" stroke="#bdbdbd" stroke-width="2.4" stroke-linecap="round" fill="none"/>` : '');
  const eyes = mood === 'happy'
    ? `<path d="M20.5,38 Q25,32 29.5,38 M34.5,38 Q39,32 43.5,38" stroke="${O}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : `<circle cx="25" cy="37" r="2.8" fill="${O}"/><circle cx="39" cy="37" r="2.8" fill="${O}"/><circle cx="26" cy="36" r="0.9" fill="#fff"/><circle cx="40" cy="36" r="0.9" fill="#fff"/>`;
  const mouth = mood === 'happy'
    ? `<path d="M26,45 Q32,53 38,45 Z" fill="#b03a3a" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`
    : (mood === 'neutral'
      ? `<path d="M28,47 L36,47" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>`
      : `<path d="M26,50 Q32,43 38,50" stroke="${O}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  const blush = mood === 'angry'
    ? `<ellipse cx="20" cy="43" rx="3.6" ry="2.2" fill="#e53935" opacity="0.55"/><ellipse cx="44" cy="43" rx="3.6" ry="2.2" fill="#e53935" opacity="0.55"/>`
    : `<ellipse cx="20" cy="43" rx="3.6" ry="2.2" fill="#f48fb1" opacity="0.55"/><ellipse cx="44" cy="43" rx="3.6" ry="2.2" fill="#f48fb1" opacity="0.55"/>`;
  const stache = L.stache ? `<path d="M25,43 Q32,40 39,43 Q35,47 32,45 Q29,47 25,43 Z" fill="#e0e0e0" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>` : '';
  const anger = mood === 'angry' ? `<path d="M50,12 l5,5 m0,-5 l-5,5" stroke="#e53935" stroke-width="2.6" stroke-linecap="round"/>` : '';
  return `<svg class="cust-portrait-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">`
    + hairBack
    + `<path d="M10,66 Q12,53 32,53 Q52,53 54,66 Z" fill="${L.shirt}" stroke="${O}" stroke-width="${W}" stroke-linejoin="round"/><path d="M26,54 L32,61 L38,54" fill="#fff8e1" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<ellipse cx="32" cy="37" rx="18" ry="18.5" fill="${L.skin}" stroke="${O}" stroke-width="${W + 0.2}"/>`
    + hairFront + band + pin + blush + brows + eyes + (L.stache ? stache : mouth) + (L.stache ? '' : '') + anger
    + (L.stache ? `<path d="M28,49 Q32,${mood === 'angry' ? 47 : 51} 36,49" stroke="${O}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` : '')
    + `</svg>`;
}

// --- VFX de feedback (estrellas, destellos, humo, textos flotantes) ---
const VFX_SVG = {
  star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7L12 17.4 5.8 21l1.6-7L2 9.3l7.1-.7z" fill="#ffd54f" stroke="#2b1810" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 5.5l1.5 3.6" stroke="#fff8e1" stroke-width="1.6" stroke-linecap="round"/></svg>',
  spark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 1l1.6 5.4L15 8l-5.4 1.6L8 15l-1.6-5.4L1 8l5.4-1.6z" fill="#fff8e1" stroke="#ffb300" stroke-width="1"/></svg>',
  smoke: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 19a4.2 4.2 0 0 1 0-8.4 5.4 5.4 0 0 1 10.2-1.4A4.4 4.4 0 0 1 17.6 19z" fill="#8d8d8d" stroke="#2b1810" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 13.5q3-2.2 6 0" stroke="#bdbdbd" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>'
};

function spawnVfx(type, x, y, opts = {}) {
  if (!(x > 0 || y > 0)) return;
  const el = document.createElement('div');
  el.className = `vfx-pop vfx-${type}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty('--s', `${opts.size || 24}px`);
  el.style.setProperty('--dx', `${opts.dx || 0}px`);
  el.style.setProperty('--dy', `${opts.dy || 0}px`);
  el.style.setProperty('--d', `${opts.dur || 700}ms`);
  el.innerHTML = VFX_SVG[type];
  document.body.appendChild(el);
  setTimeout(() => el.remove(), (opts.dur || 700) + 80);
}

function vfxBurst(x, y, type, n, size) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const r = 24 + Math.random() * 16;
    spawnVfx(type, x, y, { dx: Math.cos(a) * r, dy: Math.sin(a) * r - 6, size, dur: 650 + Math.random() * 200 });
  }
}

function vfxText(text, x, y, color) {
  const el = document.createElement('div');
  el.className = 'vfx-text';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  if (color) el.style.setProperty('--c', color);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// Efecto centrado en un elemento visible: 'good' = estrellas y destellos, 'bad' = humo, 'cut' = destello del corte.
function vfxAtElement(id, kind) {
  const el = document.getElementById(id);
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  const x = r.left + r.width / 2, y = r.top + r.height * 0.4;
  if (kind === 'good') { vfxBurst(x, y, 'star', 4, 22); vfxBurst(x, y, 'spark', 3, 16); }
  else if (kind === 'bad') spawnVfx('smoke', x, y, { dy: -30, size: 26, dur: 950 });
  else if (kind === 'cut') vfxBurst(x, y, 'spark', 3, 16);
}

function serveVfx(customerIndex, pay, tier) {
  const card = document.getElementById(`cust-slot-card-${customerIndex}`);
  const r = card ? card.getBoundingClientRect() : null;
  const x = r && r.width ? r.left + r.width / 2 : window.innerWidth / 2;
  const y = r && r.width ? r.top + r.height / 2 : 70;
  if (tier >= 3) { vfxBurst(x, y, 'star', 7, 26); vfxBurst(x, y, 'spark', 5, 16); vfxText(`+S/ ${pay} ⭐⭐⭐`, x, y + 6, '#ffd54f'); }
  else if (tier === 2) { vfxBurst(x, y, 'star', 4, 22); vfxBurst(x, y, 'spark', 3, 16); vfxText(`+S/ ${pay} ⭐⭐`, x, y + 6, '#ffd54f'); }
  else if (tier === 1) { spawnVfx('smoke', x, y, { dy: -26, size: 24, dur: 900 }); vfxText(`+S/ ${pay} ⭐`, x, y + 6, '#ffab91'); }
  else { spawnVfx('smoke', x, y, { dy: -26, size: 26, dur: 900 }); vfxText('🚫 Rechazado', x, y + 6, '#ff8a80'); }
}

// --- Platos listos: cada estación ofrece el suyo y los clientes lo toman desde cualquier área ---
const AREA_ICONS = { ramen: '🍜', salteados: '🍳', makis: '🍣', frituras: '🍤' };
