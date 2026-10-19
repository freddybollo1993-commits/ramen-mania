/* Módulo 10-produccion-taller-gestos — Taller de Producción: gestos (cortar, frotar, licuar) y pantallas.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */
// ---- Gestos ----
// Reconocedor de círculos reutilizable: mide el ángulo del dedo alrededor del centro del elemento y entrega, en cada movimiento,
// cuánto giró (delta, rad) y a qué ritmo (speed, vueltas por segundo: giro NETO de los últimos 0,6 s, así que ir y venir no cuenta).
class CircleTracker {
  constructor(cx, cy, minR) { this.cx = cx; this.cy = cy; this.minR = minR; this.last = null; this.samples = []; }
  // x, y del dedo → { delta (rad girados desde la última muestra), speed (vueltas/s netas en 0,6 s) }; null en la primera muestra
  feed(x, y, now) {
    const a = Math.atan2(y - this.cy, x - this.cx);
    if (this.last === null) { this.last = a; return null; }
    let d = a - this.last; if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI;
    this.last = a;
    if (Math.hypot(x - this.cx, y - this.cy) < this.minR) return { delta: 0, speed: 0 };       // muy cerca del centro el ángulo salta: no cuenta
    this.samples.push({ t: now, d });
    while (this.samples.length && now - this.samples[0].t > 600) this.samples.shift();
    const span = Math.max(250, now - (this.samples[0] ? this.samples[0].t : now));
    return { delta: d, speed: Math.abs(this.samples.reduce((s, q) => s + q.d, 0)) / (span / 1000) / (2 * Math.PI) };
  }
}
function makeCircleGesture(el, cb) {
  let id = null, tracker = null;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', e => {
    if (id !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    tracker = new CircleTracker(r.left + r.width / 2, r.top + r.height / 2, Math.min(r.width, r.height) * 0.12);
    id = e.pointerId;
    try { el.setPointerCapture(id); } catch (err) {}
    tracker.feed(e.clientX, e.clientY, performance.now());
    cb({ type: 'down', x: e.clientX, y: e.clientY, speed: 0 });
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const r = tracker.feed(e.clientX, e.clientY, performance.now());
    if (r) cb({ type: 'move', x: e.clientX, y: e.clientY, delta: r.delta, speed: r.speed });
  });
  const up = e => { if (e.pointerId !== id) return; id = null; cb({ type: 'up' }); };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
// Frotar de lado a lado: cada pasada completa (≥ RUB_MIN px y cambio de sentido) es una pasada; un toque suelto vale por una (respaldo)
const RUB_MIN_PX = 36;
// Cebolla caramelizada: remover en círculos con el dedo. Ritmo parejo (0,7–2,2 vueltas/s) = avanza el color y se despega; lento/rápido = avanza a medias; sin remover = se pega y se quema.
const STIR_GOOD_MIN = 0.7, STIR_GOOD_MAX = 2.2, STIR_SCALE_MAX = 3;
function stStirTick(area, st, sl, i) {
  const s = sl.stir, v = (performance.now() - s.lastMoveAt < 900) ? Math.abs(s.speed) : 0;
  let dp, db;
  if (v >= STIR_GOOD_MIN && v <= STIR_GOOD_MAX) { dp = 1; db = -0.35; }
  else if (v >= 0.25) { dp = 0.5; db = 0; }
  else { dp = 0.3; db = 0.22; }
  s.prog = Math.min(sl.total, s.prog + dp);
  s.burn = Math.max(0, Math.min(1, s.burn + db));
  sl.left = Math.max(0, Math.ceil(sl.total - s.prog));
  if (s.burn < 0.3) s.warned = false;
  if (s.burn >= 1) {
    sl.state = 'over';
    try { playSound('burn'); } catch (e) {}
    showStationToast('⚠ La cebolla se quemó en el wok: solo se salva la mitad.');
    return true;
  }
  if (s.prog >= sl.total) {
    sl.state = 'ready'; sl.late = 0;
    try { playSound('ding'); } catch (e) {}
    showStationToast('🍯 ¡Color caramelo! Retira la cebolla del wok.');
    return true;
  }
  if (s.burn >= 0.55 && !s.warned) { s.warned = true; showStationToast('🔥 ¡La cebolla se pega! Remueve en círculos.'); }
  return false;
}
function stStirClose(area) { const st = stGet(area); st.stirOpen = null; stRenderIfOpen(area); }
function stStirAttach(area, i) {
  const el = document.getElementById('stir-wok');
  if (!el) return;
  const spoon = el.querySelector('.stir-spoon'), pieces = document.getElementById('stir-pieces');
  makeCircleGesture(el, ev => {
    const sl = stGet(area).stove[i];
    if (!sl || !sl.stir) return;
    if (ev.type === 'up') { spoon.style.display = 'none'; el.classList.remove('on'); return; }
    const r = el.getBoundingClientRect();
    spoon.style.display = 'block'; spoon.style.left = (ev.x - r.left) + 'px'; spoon.style.top = (ev.y - r.top) + 'px'; el.classList.add('on');
    if (ev.type === 'move' && sl.state === 'cooking') {
      const s = sl.stir;
      s.rot += (ev.delta || 0) * 180 / Math.PI * 0.8;
      if (pieces) pieces.style.transform = `rotate(${s.rot}deg)`;
      s.speed = ev.speed;
      if (ev.speed > 0.15) s.lastMoveAt = performance.now();
      s.revAcc += Math.abs(ev.delta || 0) / (2 * Math.PI);
      if (s.revAcc >= 1) { s.revAcc -= 1; try { playSound('splash'); } catch (e) {} }          // sonido de remover cada vuelta
    }
  });
}
// Medidores del wok (cada 0,1 s, sin recrear la pantalla): color, ritmo y cuánto se pega
function stStirUi() {
  const el = document.getElementById('stir-wok');
  if (!el) return;
  const area = gameState.activeArea, st = gameState.st && gameState.st[area], i = st ? st.stirOpen : null, sl = i != null && st.stove[i];
  if (!sl || !sl.stir) return;
  const s = sl.stir, v = (performance.now() - s.lastMoveAt < 900) ? Math.abs(s.speed) : 0, k = Math.min(1, s.prog / sl.total);
  const set = (id, fn) => { const e = document.getElementById(id); if (e) fn(e); };
  set('stir-color-mark', e => { e.style.left = (k * 100) + '%'; });
  set('stir-color-txt', e => { e.textContent = sl.state === 'over' ? 'quemada' : sl.state === 'ready' ? '¡caramelo!' : k < 0.35 ? 'pálida' : k < 0.75 ? 'dorada' : 'casi caramelo'; });
  set('stir-rhythm-mark', e => { e.style.left = (Math.min(1, v / STIR_SCALE_MAX) * 100) + '%'; });
  set('stir-rhythm-txt', e => { e.textContent = sl.state !== 'cooking' ? '—' : v < 0.25 ? '¡remueve!' : v < STIR_GOOD_MIN ? 'lento' : v <= STIR_GOOD_MAX ? 'parejo ✓' : 'rápido'; e.className = sl.state === 'cooking' && v >= STIR_GOOD_MIN && v <= STIR_GOOD_MAX ? 'ok' : ''; });
  set('stir-burn-fill', e => { e.style.width = (s.burn * 100) + '%'; });
  set('stir-pieces', e => { e.style.filter = stPotTone(sl); });
  set('stir-take', e => { e.style.display = sl.state === 'cooking' ? 'none' : 'block'; e.textContent = sl.state === 'over' ? '✔ Retirar (se salva la mitad)' : '✔ Retirar'; });
}
setInterval(stStirUi, 100);
// Texto de la tabla: producto, cuánto hay en su depósito y, si se lava varias veces, en qué pasada va
function shopBoardLabelText(st, p) {
  const b = st.board;
  if (b && b.mode === 'portion') return `${p.label} frío · ${st.cooled[p.key]} por porcionar · ${st.stock[p.key]}/${p.max}`;
  if (b && b.mode === 'fan') return `${p.label} con Zu · tiempo ${Math.min(FAN_PHASES, (b.phase || 0) + 1)} de ${FAN_PHASES} · ${st.stock[p.key]}/${p.max}`;
  if (b && b.mode === 'blend') return `${p.label} · licuando ${Math.round((b.prog || 0) * 100)}% · ${st.stock[p.key]}/${p.max}`;
  if (b && b.mode === 'grate') return `${p.label} · ${st.stock[p.key]}/${p.max} · pasada ${(b.strokes % FR_GRATE_STROKES) + 1} de ${FR_GRATE_STROKES}`;
  if (b && b.mode === 'fold') return `Gyozas ${st.stock[p.key]}/${p.max} · relleno ${st.stock.relleno || 0} · ${['masa', 'relleno', 'huevo', `pinza ${Math.min(FR_PINCHES, (b.pinch || 0) + 1)}/${FR_PINCHES}`][FR_STEPS.indexOf(b.step)]}`;
  const c = stBin(st, p)[p.key];
  let t = p.then ? `${p.label} ${stBinWord(p)} · ${c}/${p.max}` : `${p.label} · ${p.xfer ? c : st.stock[p.key]}/${p.max}`;
  if (b && b.mode === 'clean' && p.passes > 1) t += ` · Lavado ${Math.floor((b.taps % (SHOP_TAPS_PER_PORTION * p.passes)) / SHOP_TAPS_PER_PORTION) + 1}/${p.passes}`;
  return t;
}

function stShopStart(area, p, mode) {
  const st = stGet(area);
  const how = p.then ? (mode || p.how) : p.how;
  if (how === 'portion') {                                  // arroz ya frío -> porciones de 400 g en la tabla
    if (!(st.cooled[p.key] >= 1)) { showStationToast(stCoolInfo(st, p).cooling ? `🧊 El ${p.label.toLowerCase()} aún se está enfriando.` : `⚖️ No hay ${p.label.toLowerCase()} frío para porcionar: lávalo, cuécelo y deja que se enfríe.`); playSound('error'); return; }
    if (st.stock[p.key] >= p.max) { showStationToast(`${p.label}: el depósito ya está lleno.`); playSound('error'); return; }
    st.board = { key: p.key, taps: 0, mode: 'portion' };
    showStationToast(`⚖️ ${p.label} frío en la tabla: arrastra paladas hasta la balanza (3 paladas = 1 porción de ${stGrams(p)} g).`);
    try { playSound('add'); } catch (e) {}
    stRenderIfOpen(area);
    updateAreaTabAlerts();
    return;
  }
  if (how === 'zu') {                                       // arroz shari cocido: se le agrega el Zu (vinagre y azúcar) y se enfría moviéndolo en zigzag, en 3 tiempos
    const h = st.hot[p.key] || 0, z = st.zued[p.key] || 0;
    if (h + z < 1) { showStationToast(`🍶 No hay ${p.label.toLowerCase()} cocido: lávalo y cuécelo primero.`); playSound('error'); return; }
    if (h >= 1) {
      st.zued[p.key] = z + h; st.hot[p.key] = 0;
      try { playSound('splash'); } catch (e) {}
      showStationToast('🍶 Zu añadido (vinagre y azúcar). Ahora enfríalo moviéndolo en zigzag, en 3 tiempos.');
    }
    st.board = { key: p.key, taps: 0, mode: 'fan', phase: 0, strokes: 0 };
    stRenderIfOpen(area);
    updateAreaTabAlerts();
    return;
  }
  if (how === 'grate') { frStartGrate(area, st, p); return; }          // mandolina (frituras-prod.js)
  if (how === 'fold') { frStartFold(area, st, p); return; }            // armado de gyozas (frituras-prod.js)
  if (how === 'blend') {                                    // salsa licuada: se mantiene pulsada la licuadora hasta llenar la barra
    if (st.stock[p.key] >= p.max) { showStationToast(`${p.label}: el depósito ya está lleno.`); playSound('error'); return; }
    st.board = { key: p.key, taps: 0, mode: 'blend', prog: 0 };
    showStationToast(`🌀 ${p.label}: mantén pulsada la licuadora.`);
    try { playSound('add'); } catch (e) {}
    stRenderIfOpen(area);
    updateAreaTabAlerts();
    return;
  }
  if (how === 'cut' || how === 'clean') {
    if (stBin(st, p)[p.key] >= p.max) { showStationToast(p.then ? `${ST_HOW[how].icon} ${p.label}: ya hay suficiente ${stBinWord(p)}, ${ST_HOW[p.then].imp}.` : `${p.label}: el depósito ya está lleno.`); playSound('error'); return; }
    if (st.board && st.board.key === p.key && st.board.mode === how) { showStationToast(how === 'clean' ? `🧺 Ya está en la tabla: frótalo de lado a lado para ${stVerb1(p).toLowerCase()}lo.` : (st.knifeArmed ? '🔪 Ya está en la tabla: da un tajo de lado a lado (o toca) para cortar.' : '🔪 Ya está en la tabla: arrastra el cuchillo sobre ella.')); return; }
    st.board = { key: p.key, taps: 0, mode: how };   // la tabla admite un producto a la vez; elegir otro lo reemplaza
    showStationToast(how === 'clean' ? `🧺 ${p.label} en la tabla: frótalo de lado a lado para ${stVerb1(p).toLowerCase()}lo.` : (st.knifeArmed ? `🔪 ${p.label} en la tabla: da un tajo de lado a lado (o toca) para cortar.` : `🔪 ${p.label} en la tabla: arrastra el cuchillo sobre ella.`));
    try { playSound('add'); } catch (e) {}
  } else {
    if (st.stock[p.key] >= p.max) { showStationToast(`${p.label}: el depósito ya está lleno.`); playSound('error'); return; }
    if (p.then && !(st.cut[p.key] >= 1)) { showStationToast(`${stBinTag(p)} Primero ${stVerb1(p).toLowerCase()} ${p.label.toLowerCase()}: no hay nada ${stBinWord(p)} para ${ST_HOW[p.then].verb.toLowerCase()}.`); playSound('error'); return; }
    const slot = st.stove.findIndex(x => !x);
    if (slot === -1) { showStationToast('♨️ Las dos hornillas están ocupadas: retira algo cuando esté listo.'); playSound('error'); return; }
    const room = p.max - st.stock[p.key] - (p.after ? stCoolPending(st, p) : 0);     // lo que ya espera frío o enfriándose también ocupa sitio
    if (room < 1) { showStationToast(`${ST_HOW.portion.icon} ${p.label}: ya hay suficiente por porcionar, ${ST_HOW.portion.imp}.`); playSound('error'); return; }
    const n = p.then ? Math.min(p.batch, st.cut[p.key], room) : p.batch;
    if (p.then) st.cut[p.key] -= n;                // lo cortado entra a la olla
    const total = stProdTime(p);
    st.stove[slot] = { key: p.key, how, n, left: total, total, state: 'cooking', late: 0 };
    if (p.gesture === 'stir' && how === p.then) {                  // se cocina removiendo en círculos: progreso por ritmo, no por reloj
      st.stove[slot].stir = { prog: 0, burn: 0, speed: 0, lastMoveAt: 0, rot: 0, revAcc: 0, warned: false };
      st.stirOpen = slot;
      st.board = null; st.knifeArmed = false;
    }
    try { playSound('splash'); } catch (e) {}
    if (p.then) showStationToast(p.msg2 ? p.msg2(n, slot) : `${ST_HOW[how].icon} ${n} ${p.label.toLowerCase()} ${stBinWord(p)} a ${ST_HOW[how].verb.toLowerCase()} en la hornilla ${slot + 1}.`);
  }
  stRenderIfOpen(area);
  updateAreaTabAlerts();
}

// Cada segundo: las hornillas avanzan; lo listo espera a ser retirado y, si se olvida, se pasa.
function stShopTick(area, st) {
  let changed = false;
  st.stove.forEach((sl, i) => {
    if (!sl) return;
    if (sl.state === 'cooking' && sl.stir) { if (stStirTick(area, st, sl, i)) changed = true; return; }
    if (sl.state === 'cooking') {
      sl.left--;
      if (sl.left <= 0) {
        sl.state = 'ready'; sl.late = 0; changed = true;
        const p = stProdOf(area, sl.key);
        try { playSound('ding'); } catch (e) {}
        showStationToast(`♨️ ${p.label} listo: retíralo de la hornilla ${i + 1}.`);
      }
    } else if (sl.state === 'ready') {
      if (++sl.late >= ST_SHOP_LATE_SECONDS) { sl.state = 'over'; changed = true; try { playSound('burn'); } catch (e) {} showStationToast(`⚠ ${stProdOf(area, sl.key).label} se pasó en la hornilla ${i + 1}.`); }
    }
  });
  if (st.cooling && st.cooling.length) {                       // lotes que se enfrían solos (arroz Gohan)
    st.cooling.forEach(b => { b.left--; });
    const done = st.cooling.filter(b => b.left <= 0);
    if (done.length) {
      st.cooling = st.cooling.filter(b => b.left > 0);
      done.forEach(b => {
        const p = stProdOf(area, b.key);
        st.cooled[b.key] = (st.cooled[b.key] || 0) + b.n;
        try { playSound('ding'); } catch (e) {}
        showStationToast(`🧊 ${p.label} frío: ya puedes porcionarlo (⚖️ ${stGrams(p)} g).`);
      });
      changed = true;
    }
  }
  if (changed) { stRenderIfOpen(area); renderStageTabs(); updateAreaTabAlerts(); }
}

function stShopCollect(area, i) {
  const st = stGet(area), sl = st.stove[i];
  if (!sl) return;
  const p = stProdOf(area, sl.key);
  if (sl.state === 'cooking' && sl.stir) { st.stirOpen = i; stRenderIfOpen(area); return; }      // sigue en el wok: vuelve a remover
  if (sl.state === 'cooking') { showStationToast(`⏳ ${p.label} sigue en la hornilla (${sl.left} s).`); return; }
  if (st.stirOpen === i) st.stirOpen = null;
  const base = sl.n || p.batch, gain = sl.state === 'over' ? Math.max(1, Math.ceil(base / 2)) : base;
  if (p.after === 'zu') {                                      // arroz shari cocido: espera su Zu
    st.hot[p.key] = (st.hot[p.key] || 0) + gain;
    st.stove[i] = null;
    try { playSound(sl.state === 'over' ? 'trash' : 'stock_add'); } catch (e) {}
    showStationToast(sl.state === 'over' ? `⚠ Se pasó: solo se salvó la mitad (${gain}). Agrégale el Zu 🍶.` : `♨️ ${gain} ${p.label.toLowerCase()} cocido: agrégale el Zu 🍶 y enfríalo.`);
    stRenderIfOpen(area);
    renderStageTabs();
    updateAreaTabAlerts();
    return;
  }
  if (p.after) {                                               // el arroz cocido no pasa directo al depósito: primero se enfría
    const t = stCoolTime(p);
    st.cooling.push({ key: p.key, n: gain, left: t, total: t });
    st.stove[i] = null;
    try { playSound(sl.state === 'over' ? 'trash' : 'stock_add'); } catch (e) {}
    showStationToast(sl.state === 'over' ? `⚠ Se pasó: solo se salvó la mitad (${gain}). A enfriar ${t} s.` : `🧊 ${gain} ${p.label.toLowerCase()} retirado: se enfría ${t} s y luego se porciona.`);
    stRenderIfOpen(area);
    renderStageTabs();
    updateAreaTabAlerts();
    return;
  }
  const before = st.stock[p.key];
  st.stock[p.key] = Math.min(p.max, before + gain);
  st.stove[i] = null;
  try { playSound(sl.state === 'over' ? 'trash' : 'stock_add'); } catch (e) {}
  showStationToast(sl.state === 'over' ? `⚠ Se pasó: solo se salvó la mitad de ${p.label} (+${st.stock[p.key] - before}).` : `🥬 ${p.label} +${st.stock[p.key] - before}.`);
  stRenderIfOpen(area);
  renderStageTabs();
  updateAreaTabAlerts();
}

function stShopReady(area) { return stIsShop(area) && (stGet(area).stove.some(sl => sl && sl.state !== 'cooking') || Object.values(stGet(area).cooled || {}).some(n => n > 0) || Object.values(stGet(area).hot || {}).some(n => n > 0)); }
function stShopBusy(area) { const st = stGet(area); return stIsShop(area) && (!!st.board || st.stove.some(Boolean)); }

// ---- Cuchillo ----
// Se arrastra hasta la tabla y queda "flotando" sobre ella (armado). Con el cuchillo armado, cada TOQUE en la pantalla
// es un corte: suena el cuchillo, sale una animación translúcida y cada 3 cortes se suma 1 porción del producto.
const SHOP_TAPS_PER_PORTION = 3;
const SHOP_CUT_LOCK_MS = 450;      // cada corte tarda lo que dura su animación completa; los toques de más se ignoran (no hace falta tocar desesperadamente)
const SHOP_CLEAN_LOCK_MS = 650;    // igual para cada pasada de las manos al limpiar el moyashi
let shopTapLockUntil = 0;
let shopKnifeDrag = null;
let shopTap = null;
let shopHintAt = 0;
function shopKnifePoint(d) { return { x: d.x, y: d.pointerType === 'mouse' ? d.y : d.y - DRAG_TOUCH_GHOST_OFFSET_Y }; }
function cleanupShopKnife() {
  const d = shopKnifeDrag;
  document.removeEventListener('pointermove', onShopKnifeMove);
  document.removeEventListener('pointerup', onShopKnifeUp);
  document.removeEventListener('pointercancel', onShopKnifeUp);
  if (d && d.ghost) d.ghost.remove();
  const k = document.getElementById('shop-knife'); if (k) k.classList.remove('is-lifted');
  const b = document.getElementById('shop-board'); if (b) b.classList.remove('drop-hover');
  shopKnifeDrag = null;
}
const shopArmedActive = () => { const a = gameState.activeArea; return !!a && STAGE_AREAS.includes(a) && stagedOn(a) && stIsShop(a) && getStage(a) === 'prod'
  && stGet(a).knifeArmed && !(stGet(a).board && SHOP_HAND_MODES.includes(stGet(a).board.mode)) && !gameState.isPaused && !gameState.isGameOver; };
function shopHint(msg) { if (performance.now() - shopHintAt > 2500) { shopHintAt = performance.now(); showStationToast(msg); } }

function shopUpdateCount(p) {
  const st = stGet(stShopArea()), n = st.stock[p.key], c = stBin(st, p)[p.key];
  document.querySelectorAll(`[data-stock-of="${p.key}"]`).forEach(el => { el.textContent = `${n}/${p.max}`; });
  document.querySelectorAll(`[data-cut-of="${p.key}"]`).forEach(el => { el.textContent = `${stBinTag(p)}${st.cut[p.key]}`; });
  document.querySelectorAll(`[data-cut-chip="${p.key}"]`).forEach(el => { el.textContent = c; });
  document.querySelectorAll(`[data-bl-btn="${p.key}"]`).forEach(el => { el.disabled = !(st.cut[p.key] >= 1) || n >= p.max || st.stove.findIndex(x => !x) === -1; });
  if (p.after) {
    document.querySelectorAll(`[data-cool-of="${p.key}"]`).forEach(el => { el.textContent = stCoolText(st, p); });
    document.querySelectorAll(`[data-pt-btn="${p.key}"]`).forEach(el => { el.disabled = stAfterOff(st, p, n); });
  }
  const lab = document.getElementById('shop-board-label');
  if (lab && st.board && st.board.key === p.key) lab.textContent = shopBoardLabelText(st, p);
}
// ---- Tabla expandida: el producto se va dividiendo con cada corte y suelta porciones pequeñas ----
function shopItemHtml(p, stg) {
  const ico = stIngIconRaw(p.icon);
  return `<div class="cb-item cb-fruit s${stg}" id="shop-cb-item" data-base="cb-item cb-fruit"><span class="q q1">${ico}</span></div>`;     // entero: cada tajo suelta dos mitades que vuelan (shopChopFx)
}
function shopPileHtml(p, count) {
  const n = Math.min(count, 14);
  let h = '';
  for (let i = 0; i < n; i++) h += `<span class="cb-pc" style="left:${(i % 7) * 12}%;bottom:${Math.floor(i / 7) * 20 + (i % 2) * 5}px;transform:rotate(${(i * 53) % 70 - 35}deg)">${stIngIcon(p.icon)}</span>`;
  return h + `<b class="cb-pile-n">×${count}</b>`;
}
function shopSplitFx(p, stg, done) {
  const item = document.getElementById('shop-cb-item');
  if (!item) return;
  const base = item.dataset.base || 'cb-item';
  if (!done) { item.className = base + ' s' + stg; return; }
  const pile = document.getElementById('shop-pile');
  const a = item.getBoundingClientRect(), b = pile ? pile.getBoundingClientRect() : a;
  for (let k = 0; k < 6; k++) {
    const d = document.createElement('div');
    d.className = 'cb-drop';
    d.style.left = (a.left + a.width / 2 - 11 + (k - 2.5) * 6) + 'px';
    d.style.top = (a.top + a.height / 2 - 11) + 'px';
    d.style.setProperty('--dx', (b.left + b.width / 2 - (a.left + a.width / 2) + (k % 3 - 1) * 12) + 'px');
    d.style.setProperty('--dy', (b.top + b.height * 0.55 - (a.top + a.height / 2)) + 'px');
    d.style.setProperty('--rot', ((k - 2.5) * 50) + 'deg');
    d.style.animationDelay = (k * 0.025) + 's';
    d.innerHTML = stIngIcon(p.icon);
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 560);
  }
  item.className = base + ' s3';
  setTimeout(() => {
    const it = document.getElementById('shop-cb-item'), st = stGet(stShopArea());
    const cur = st.board && st.board.key === p.key ? st.board.taps % SHOP_TAPS_PER_PORTION : 0;
    if (it) { it.className = base + ' s' + cur; void it.offsetWidth; it.className = base + ' s' + cur + ' pop'; }
    const pl = document.getElementById('shop-pile');
    if (pl && st.board && st.board.key === p.key) pl.innerHTML = shopPileHtml(p, st.board.mode === 'portion' ? st.stock[p.key] : stBin(st, p)[p.key]);
  }, 300);
}

// ---- Moyashi: montón abundante con impurezas; cada toque lo limpian dos manos ----
const SHOP_HEAP = [[6, 38, -20, 0.42], [24, 24, 15, 0.46], [42, 34, -8, 0.46], [60, 22, 25, 0.42], [12, 56, 10, 0.46], [32, 50, -25, 0.48], [52, 54, 5, 0.46], [70, 44, -15, 0.42], [22, 70, 22, 0.4], [44, 72, -10, 0.42], [62, 68, 18, 0.4], [78, 62, -5, 0.36], [36, 12, 8, 0.38], [56, 8, -12, 0.36]];
const SHOP_IMPS = [[16, 30, 0], [38, 20, 1], [56, 40, 0], [72, 26, 2], [10, 62, 1], [34, 60, 0], [58, 62, 2], [76, 52, 0], [26, 44, 1], [48, 46, 0], [66, 18, 1], [20, 76, 2], [50, 78, 0], [82, 68, 1], [40, 30, 2], [64, 50, 1]];
const SHOP_HAND_SVG = `<svg viewBox="0 0 100 56" class="hand-svg"><g stroke="#b5764a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><rect x="1" y="8" width="17" height="40" rx="4" fill="#ffffff" stroke="#bdbdbd"/><rect x="16" y="10" width="38" height="36" rx="11" fill="#f6cba3"/><rect x="44" y="10" width="46" height="8" rx="4" fill="#f6cba3"/><rect x="44" y="19" width="50" height="8" rx="4" fill="#f6cba3"/><rect x="44" y="28" width="47" height="8" rx="4" fill="#f6cba3"/><rect x="44" y="37" width="38" height="8" rx="4" fill="#f6cba3"/><rect x="24" y="1" width="30" height="10" rx="5" fill="#f6cba3" transform="rotate(-16 24 6)"/></g></svg>`;
function shopHeapHtml(p, stg, portion) {
  const fan = portion === 'fan';
  const ico = portion ? stIngIcon(p.icon) : stIngIconRaw(p.icon);          // al porcionar, el arroz ya está cocido
  const sp = SHOP_HEAP.map(([l, t, r, w]) => `<span class="sp" style="left:${l}%;top:${t}%;width:${w * 100}%;transform:rotate(${r}deg)">${ico}</span>`).join('');
  const im = portion ? '' : SHOP_IMPS.map(([l, t, lv], i) => `<i class="imp k${i % 3} l${lv}" style="left:${l}%;top:${t}%;transform:rotate(${(i * 37) % 90}deg)"></i>`).join('');
  return `<div class="cb-item cb-heap s${stg}" id="shop-cb-item" data-base="cb-item cb-heap" onpointerdown="${portion && !fan ? 'shopPortionDown' : 'shopRubDown'}(event)">${sp}${im}<em class="cb-tip">${fan ? '↔' : (portion ? '🥄' : '↔')}</em>${fan ? '<em class="cb-steam" style="opacity:1">♨️ ♨️ ♨️</em>' : ''}</div>`;
}
// Porcionar: se arrastra una palada de arroz desde el montón hasta la balanza (3 paladas = 400 g); un toque suelto vale por una palada (respaldo)
let shopScoop = null;
function shopScoopCleanup() {
  document.removeEventListener('pointermove', onShopScoopMove);
  document.removeEventListener('pointerup', onShopScoopUp);
  document.removeEventListener('pointercancel', onShopScoopUp);
  if (shopScoop && shopScoop.ghost) shopScoop.ghost.remove();
  const sc = document.getElementById('shop-scale'); if (sc) sc.classList.remove('hover');
  shopScoop = null;
}
const shopOverScale = (x, y) => { const s = document.getElementById('shop-scale'); if (!s) return false; const r = s.getBoundingClientRect(); return x >= r.left - 14 && x <= r.right + 14 && y >= r.top - 14 && y <= r.bottom + 14; };
function shopPortionDown(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (gameState.isPaused || gameState.isGameOver) return;
  const st = stGet(stShopArea());
  if (!st.board || st.board.mode !== 'portion') return;
  shopScoopCleanup();
  shopScoop = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), ghost: null, far: 0 };
  document.addEventListener('pointermove', onShopScoopMove);
  document.addEventListener('pointerup', onShopScoopUp);
  document.addEventListener('pointercancel', onShopScoopUp);
}
function onShopScoopMove(e) {
  const s = shopScoop;
  if (!s || e.pointerId !== s.id) return;
  s.x = e.clientX; s.y = e.clientY;
  s.far = Math.max(s.far, Math.hypot(s.x - s.x0, s.y - s.y0));
  if (!s.ghost && s.far > 8) { s.ghost = document.createElement('div'); s.ghost.className = 'scoop-ghost'; s.ghost.textContent = '🥄'; document.body.appendChild(s.ghost); }
  if (s.ghost) s.ghost.style.transform = `translate(${s.x}px, ${s.y - 28}px) translate(-50%, -50%)`;
  const sc = document.getElementById('shop-scale'); if (sc) sc.classList.toggle('hover', shopOverScale(s.x, s.y - 28));
}
function onShopScoopUp(e) {
  const s = shopScoop;
  if (!s || e.pointerId !== s.id) return;
  const over = shopOverScale(s.x, s.y - 28) || shopOverScale(s.x, s.y), tap = s.far <= 12 && performance.now() - s.t0 <= 450, ok = e.type === 'pointerup';
  shopScoopCleanup();
  if (!ok) return;
  const st = stGet(stShopArea());
  if (!st.board || st.board.mode !== 'portion') return;
  if (tap) shopTapCore(st, 'portion');                                                     // respaldo: toque = palada
  else if (over) shopTapCore(st, 'portion', SHOP_GESTURE_LOCK_MS);                          // palada arrastrada hasta la balanza
  else shopHint('⚖️ Lleva la palada hasta la balanza.');
}
// Porcionar: cada toque pasa una palada del arroz a la balanza (400 g = 3 paladas)
function shopPortionFx(p) {
  const board = document.getElementById('shop-board'), heap = document.getElementById('shop-cb-item');
  if (!board) return;
  if (heap && heap.animate) heap.animate([{ transform: 'translate(-50%, -50%) scale(1)' }, { transform: 'translate(-50%, -50%) scale(0.96, 1.04)' }, { transform: 'translate(-50%, -50%) scale(1)' }], { duration: 240, easing: 'ease-out' });
  const proc = INGREDIENTES.find(i => i.id === p.icon), procImg = ingCtxImg(proc);
  const bits = [0, 1, 2, 3, 4].map(k => `<span class="bit" style="--dx:${(k - 2) * 14}px;--dy:${-16 - (k % 2) * 12}px;--rot:${(k - 2) * 35}deg">${procImg ? `<img src="${procImg}" alt="">` : ''}</span>`).join('');
  const fx = document.createElement('div');
  fx.className = 'cut-fx';
  fx.innerHTML = `${bits}<b class="cut-plus" style="left:30%;top:2%;font-size:12px">⚖️ ${'🥄'}</b>`;
  board.appendChild(fx);
  setTimeout(() => fx.remove(), 700);
}
function shopCleanFx(p) {
  const board = document.getElementById('shop-board'), heap = document.getElementById('shop-cb-item');
  if (!board) return;
  if (heap && heap.animate) heap.animate([{ transform: 'translate(-50%, -50%) scale(1)' }, { transform: 'translate(-50%, -50%) scale(1.05, 0.95)' }, { transform: 'translate(-50%, -50%) scale(1)' }], { duration: 240, easing: 'ease-out' });
  const fx = document.createElement('div');
  fx.className = 'cb-washfx';
  const bits = [0, 1, 2, 3, 4, 5, 6, 7].map(k => `<i class="cb-trash k${k % 3}" style="--dx:${(k % 2 ? 1 : -1) * (40 + k * 9)}px;--dy:${-14 + (k % 3) * 16}px;--rot:${k * 70}deg;animation-delay:${0.12 + k * 0.05}s"></i>`).join('');
  const drops = [0, 1, 2, 3, 4].map(k => `<span class="cb-drip" style="left:${24 + k * 12}%;animation-delay:${0.1 + k * 0.07}s">💧</span>`).join('');
  fx.innerHTML = `<div class="cb-hand l">${SHOP_HAND_SVG}</div><div class="cb-hand r">${SHOP_HAND_SVG}</div>${bits}${drops}`;
  board.appendChild(fx);
  setTimeout(() => fx.remove(), 1000);
}
function shopStowKnife() {
  const st = stGet(stShopArea());
  if (st.board && SHOP_HAND_MODES.includes(st.board.mode)) { shopBlendEnd(); if (typeof frFoldAbort === 'function') frFoldAbort(st); st.board = null; } else st.knifeArmed = false;
  try { playSound('click'); } catch (e) {}
  stRenderIfOpen(stShopArea());
}
function shopPips() {
  const st = stGet(stShopArea()), pips = document.querySelectorAll('#shop-board .shop-pips i');
  const on = st.board ? st.board.taps % SHOP_TAPS_PER_PORTION : 0;
  pips.forEach((el, i) => el.classList.toggle('on', i < on));
}
// Efectos de un tajo (los comparten Producción, Frituras y Makis). o = { zone (elemento donde brilla el golpe), item (lo que se corta),
// iconHtml (para las mitades voladoras; sin él no se parte), bitsImg (trocitos que salen disparados) }
let shopCombo = 0, shopComboT = 0;
function slashFx(o) {
  const board = o.zone;
  if (!board) return;
  board.classList.remove('hit'); void board.offsetWidth; board.classList.add('hit');
  const br = board.getBoundingClientRect(), item = o.item;
  const ir = item ? item.getBoundingClientRect() : { left: br.left + br.width * 0.44 - 30, top: br.top + br.height * 0.64 - 30, width: 60, height: 60 };
  const ic = { x: ir.left + ir.width / 2, y: ir.top + ir.height / 2 };
  // el tajo (de un gesto reciente) orienta todo; un toque de respaldo corta en diagonal suave
  const sl = (shopSlashLast && performance.now() - shopSlashLast.t < 500) ? shopSlashLast : { ang: -0.45 + Math.random() * 0.9 };
  const ang = sl.ang, ca = Math.cos(ang), sa = Math.sin(ang);
  // 1) el producto se abre en dos mitades que salen volando a ambos lados del corte
  if (item && o.iconHtml) {
    const R = Math.max(ir.width, ir.height) * 2, lc = ir.width / 2, lr = ir.height / 2;
    [1, -1].forEach(side => {
      const pts = [[-R, 0], [R, 0], [R, side * R], [-R, side * R]].map(([x, y]) => `${(lc + x * ca - y * sa).toFixed(1)}px ${(lr + x * sa + y * ca).toFixed(1)}px`).join(',');
      const h = document.createElement('div');
      h.className = 'cb-half';
      h.style.cssText = `left:${ir.left}px;top:${ir.top}px;width:${ir.width}px;height:${ir.height}px`;
      h.innerHTML = `<div class="hf" style="clip-path:polygon(${pts})">${o.iconHtml}</div>`;
      document.body.appendChild(h);
      const nx = -sa * side, ny = ca * side;                          // normal hacia el lado de esta mitad
      const an = h.animate([{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: `translate(${(nx * 38).toFixed(1)}px, ${(ny * 38 + 46).toFixed(1)}px) rotate(${side * 26}deg)`, opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
      an.onfinish = () => h.remove();
      setTimeout(() => h.remove(), 700);
    });
  }
  // 2) línea blanca del corte sobre el producto
  const len = Math.min(220, Math.max(120, Math.max(ir.width, ir.height) * 1.4));
  const ln = document.createElement('i');
  ln.className = 'slash-line';
  ln.style.cssText = `left:${ic.x - len / 2}px;top:${ic.y - 1.5}px;width:${len}px;transform:rotate(${ang}rad)`;
  document.body.appendChild(ln);
  ln.animate([{ opacity: 1, scale: '0.2 1' }, { opacity: 1, scale: '1 1', offset: 0.35 }, { opacity: 0, scale: '1 0.4' }], { duration: 300, easing: 'ease-out' }).onfinish = () => ln.remove();
  setTimeout(() => ln.remove(), 500);
  // 3) el cuchillo aparece solo un instante, cruzando a lo largo del tajo, y se esfuma
  const k = document.createElement('img');
  k.className = 'cut-knife-flash';
  k.src = 'assets/maki_knife.svg';
  k.alt = '';
  const dx = ca * 70, dy = sa * 70, deg = ang * 180 / Math.PI + 90;       // la hoja del dibujo apunta hacia arriba: se gira para que apunte en el sentido del tajo
  k.style.left = (ic.x - 20) + 'px'; k.style.top = (ic.y - 45) + 'px';
  document.body.appendChild(k);
  k.animate([{ transform: `translate(${-dx}px, ${-dy}px) rotate(${deg}deg) scale(0.9)`, opacity: 0 }, { transform: `translate(${-dx * 0.2}px, ${-dy * 0.2}px) rotate(${deg}deg) scale(1)`, opacity: 1, offset: 0.4 }, { transform: `translate(${dx}px, ${dy}px) rotate(${deg}deg) scale(1)`, opacity: 0 }], { duration: 240, easing: 'ease-out' }).onfinish = () => k.remove();
  setTimeout(() => k.remove(), 450);
  // 4) trocitos / jugo que salen disparados
  const bits = [0, 1, 2, 3, 4, 5].map(j => `<span class="bit" style="--dx:${((j - 2.5) * 15).toFixed(0)}px;--dy:${(-12 - (j % 2) * 14).toFixed(0)}px;--rot:${(j - 2.5) * 40}deg">${o.bitsImg ? `<img src="${o.bitsImg}" alt="">` : ''}</span>`).join('');
  const fx = document.createElement('div');
  fx.className = 'cut-fx';
  fx.innerHTML = bits;
  board.appendChild(fx);
  setTimeout(() => fx.remove(), 600);
  // combo: varios tajos seguidos
  const now = performance.now();
  shopCombo = (now - shopComboT < 1100) ? shopCombo + 1 : 1;
  shopComboT = now;
  if (shopCombo >= 2) { const cb = document.createElement('b'); cb.className = 'cut-plus'; cb.style.cssText = 'left:6%;top:70%;font-size:13px;color:#8fdcff'; cb.textContent = `¡Combo ×${shopCombo}!`; board.appendChild(cb); setTimeout(() => cb.remove(), 850); }
}
function shopChopFx(p) {
  const proc = INGREDIENTES.find(i => i.id === p.icon);
  slashFx({ zone: document.getElementById('shop-board'), item: document.getElementById('shop-cb-item'), iconHtml: stIngIconRaw(p.icon), bitsImg: ingCtxImg(proc) });
}
function shopChop(lockMs) {
  const st = stGet(stShopArea());
  if (!st.knifeArmed) return;
  if (!st.board) { shopHint('🔪 Primero pon un producto en la tabla (toca su ficha).'); return; }
  if (st.board.mode === 'clean') { shopHint('🧺 Esto se limpia tocándolo.'); return; }
  if (st.board.mode === 'portion') { shopHint('⚖️ El arroz se porciona tocándolo.'); return; }
  shopTapCore(st, 'cut', lockMs);
}
function shopClean(lockMs) {
  const st = stGet(stShopArea());
  if (!st.board || st.board.mode !== 'clean') return;
  shopTapCore(st, 'clean', lockMs);
}
// Lavar / limpiar: se frota el montón de lado a lado con el dedo (cada pasada cuenta); un toque suelto vale por una pasada
const SHOP_GESTURE_LOCK_MS = 380;
let shopRub = null;
function shopRubCleanup() {
  document.removeEventListener('pointermove', onShopRubMove);
  document.removeEventListener('pointerup', onShopRubUp);
  document.removeEventListener('pointercancel', onShopRubUp);
  shopRub = null;
}
function shopRubDown(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (gameState.isPaused || gameState.isGameOver) return;
  const st = stGet(stShopArea());
  if (!st.board || (st.board.mode !== 'clean' && st.board.mode !== 'fan')) return;
  shopRubCleanup();
  shopRub = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), ext: e.clientX, dir: 0, strokes: 0, far: 0 };
  document.addEventListener('pointermove', onShopRubMove);
  document.addEventListener('pointerup', onShopRubUp);
  document.addEventListener('pointercancel', onShopRubUp);
}
function onShopRubMove(e) {
  const r = shopRub;
  if (!r || e.pointerId !== r.id) return;
  r.far = Math.max(r.far, Math.hypot(e.clientX - r.x0, e.clientY - r.y0));
  const dx = e.clientX - r.ext;
  if (r.dir === 0) { if (Math.abs(dx) >= RUB_MIN_PX) { r.dir = Math.sign(dx); r.ext = e.clientX; r.strokes++; shopRubStroke(SHOP_GESTURE_LOCK_MS); } }
  else if (dx * r.dir > 0) r.ext = e.clientX;                                        // sigue en el mismo sentido: avanza el extremo
  else if (-dx * r.dir >= RUB_MIN_PX) { r.dir = -r.dir; r.ext = e.clientX; r.strokes++; shopRubStroke(SHOP_GESTURE_LOCK_MS); }   // cambio de sentido tras una pasada completa
}
function onShopRubUp(e) {
  const r = shopRub;
  if (!r || e.pointerId !== r.id) return;
  const tap = !r.strokes && r.far <= 12 && performance.now() - r.t0 <= 450;
  shopRubCleanup();
  if (tap && e.type === 'pointerup') shopRubStroke();                                // respaldo: un toque = una pasada
}
function shopRubStroke(lockMs) {
  const st = stGet(stShopArea());
  if (st.board && st.board.mode === 'fan') shopFanStroke(lockMs); else shopClean(lockMs);
}
// Arroz shari con Zu: se enfría moviéndolo en zigzag, en 3 tiempos de 5 pasadas
const FAN_STROKES_PER_PHASE = 5, FAN_PHASES = 3;
function shopFanUi() {
  const area = stShopArea(), st = stGet(area), b = st.board;
  if (!b || b.mode !== 'fan') return;
  const p = stProdOf(area, b.key);
  const lab = document.getElementById('shop-board-label'); if (lab) lab.textContent = shopBoardLabelText(st, p);
  document.querySelectorAll('#shop-board .shop-pips i').forEach((el, i) => el.classList.toggle('on', i < (b.phase || 0)));
  const steam = document.querySelector('#shop-cb-item .cb-steam');
  if (steam) steam.style.opacity = String(Math.max(0, 1 - ((b.phase || 0) + (b.strokes % FAN_STROKES_PER_PHASE) / FAN_STROKES_PER_PHASE) / FAN_PHASES).toFixed(2));
}
function shopFanStroke(lockMs) {
  const area = stShopArea(), st = stGet(area), b = st.board;
  if (!b || b.mode !== 'fan') return;
  const now = performance.now();
  if (now < shopTapLockUntil) return;
  shopTapLockUntil = now + (lockMs || SHOP_CLEAN_LOCK_MS);
  const p = stProdOf(area, b.key);
  try { playSound('swish'); } catch (e) {}
  const heap = document.getElementById('shop-cb-item');
  if (heap && heap.animate) heap.animate([{ transform: 'translate(-50%, -50%) scale(1)' }, { transform: 'translate(-50%, -50%) scale(1.04, 0.96) rotate(1.5deg)' }, { transform: 'translate(-50%, -50%) scale(1)' }], { duration: 240, easing: 'ease-out' });
  b.strokes = (b.strokes || 0) + 1;
  if (b.strokes % FAN_STROKES_PER_PHASE === 0) {
    b.phase = (b.phase || 0) + 1;
    if (b.phase >= FAN_PHASES) {
      const n = st.zued[p.key] || 0, gain = Math.max(0, Math.min(n, p.max - st.stock[p.key]));
      st.stock[p.key] += gain; st.zued[p.key] = n - gain;
      st.board = null;
      try { playSound('match'); } catch (e) {}
      showStationToast(`🍚 ${p.label} listo para makis y sushi (+${gain}).`);
      setTimeout(() => { stRenderIfOpen(area); renderStageTabs(); updateAreaTabAlerts(); }, 350);
      return;
    }
    showStationToast(`🌬 Tiempo ${b.phase} de ${FAN_PHASES} listo: voltea el arroz y sigue en zigzag.`);
  }
  shopFanUi();
  shopUpdateCount(p);
}
// Licuar: se mantiene pulsada la licuadora; la barra sube mientras se mantiene (p.time s para llenarla) y la salsa pasa al depósito
let shopBlend = null;
function shopBlendEnd() {
  if (shopBlend) { clearInterval(shopBlend.iv); document.removeEventListener('pointerup', shopBlendUp); document.removeEventListener('pointercancel', shopBlendUp); shopBlend = null; }
  const j = document.getElementById('blend-jar'); if (j) j.classList.remove('on');
}
function shopBlendUp(e) { if (shopBlend && e.pointerId === shopBlend.id) shopBlendEnd(); }
function shopBlendDown(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (gameState.isPaused || gameState.isGameOver) return;
  const st = stGet(stShopArea());
  if (!st.board || st.board.mode !== 'blend') return;
  shopBlendEnd();
  shopBlend = { id: e.pointerId, iv: setInterval(shopBlendTick, 50) };
  document.addEventListener('pointerup', shopBlendUp);
  document.addEventListener('pointercancel', shopBlendUp);
  const j = document.getElementById('blend-jar'); if (j) j.classList.add('on');
}
function shopBlendTick() {
  const area = stShopArea(), st = stGet(area), b = st.board;
  if (!b || b.mode !== 'blend' || gameState.isPaused || gameState.isGameOver) { shopBlendEnd(); return; }
  const p = stProdOf(area, b.key);
  b.prog = Math.min(1, (b.prog || 0) + 0.05 / stProdTime(p));
  sfxEvery('stir', 170);
  const liq = document.getElementById('blend-liquid'); if (liq) liq.style.height = (b.prog * 100) + '%';
  const lab = document.getElementById('shop-board-label'); if (lab) lab.textContent = shopBoardLabelText(st, p);
  if (b.prog >= 1) {
    const before = st.stock[p.key];
    st.stock[p.key] = Math.min(p.max, before + p.batch);
    st.board = null;
    shopBlendEnd();
    try { playSound('match'); } catch (e) {}
    showStationToast(`🌀 ${p.label} lista (+${st.stock[p.key] - before}).`);
    stRenderIfOpen(area); renderStageTabs(); updateAreaTabAlerts();
  }
}
function shopBlendHtml(p, prog) {
  return `<div class="blend-wrap"><div class="blend-jar" id="blend-jar"><div class="blend-liquid" id="blend-liquid" style="height:${Math.round((prog || 0) * 100)}%"></div><span class="blend-ico">${stIngIconRaw(p.icon)}</span></div><button class="blend-btn" id="blend-btn" onpointerdown="shopBlendDown(event)">🌀 Mantén pulsado para licuar</button></div>`;
}
// lockMs: los gestos (frotar, paladas, tajos) entran más seguidos que los toques sueltos; el toque de respaldo usa la espera de siempre
function shopTapCore(st, kind, lockMs) {
  const now = performance.now();
  if (now < shopTapLockUntil) return;               // la animación anterior aún no termina
  shopTapLockUntil = now + (lockMs || (kind === 'cut' ? SHOP_CUT_LOCK_MS : SHOP_CLEAN_LOCK_MS));
  const p = stProdOf(stShopArea(), st.board.key);
  try { playSound(kind === 'cut' ? 'chop' : 'splash'); } catch (e) {}
  if (kind === 'clean') shopCleanFx(p); else if (kind === 'portion') shopPortionFx(p); else shopChopFx(p);
  st.board.taps++;
  // lavar puede pedir varias pasadas seguidas (arroz: 2 lavados de 3 toques); cortar y porcionar, una
  const perPortion = SHOP_TAPS_PER_PORTION * (kind === 'clean' ? (p.passes || 1) : 1);
  const stg = st.board.taps % SHOP_TAPS_PER_PORTION, portionDone = st.board.taps % perPortion === 0;
  shopSplitFx(p, stg, stg === 0 && portionDone);
  if (stg === 0 && !portionDone) {                  // terminó una pasada de lavado y falta otra
    const pass = Math.floor((st.board.taps % perPortion) / SHOP_TAPS_PER_PORTION);
    showStationToast(`🧺 ${p.label}: lavado ${pass} de ${p.passes} listo, ¡otra vez!`);
    const lab = document.getElementById('shop-board-label'); if (lab) lab.textContent = shopBoardLabelText(st, p);
  }
  if (stg === 0 && portionDone) {
    if (kind === 'portion') { st.cooled[p.key] = Math.max(0, (st.cooled[p.key] || 0) - 1); st.stock[p.key] = Math.min(p.max, st.stock[p.key] + 1); }
    else { const bin0 = stBin(st, p); bin0[p.key] = Math.min(p.max, bin0[p.key] + 1); }
    try { playSound('stock_add'); } catch (e) {}
    const board = document.getElementById('shop-board');
    if (board) { const plus = document.createElement('b'); plus.className = 'cut-plus'; plus.textContent = kind === 'portion' ? '+1 · ' + stGrams(p) + ' g' : '+1'; board.appendChild(plus); setTimeout(() => plus.remove(), 850); }
    shopUpdateCount(p);
    const full = kind === 'portion' ? (st.cooled[p.key] < 1 || st.stock[p.key] >= p.max) : stBin(st, p)[p.key] >= p.max;
    if (full) {
      if (kind === 'cut') st.knifeArmed = false;
      st.board = null;
      showStationToast(kind === 'portion' ? (st.cooled[p.key] < 1 ? `⚖️ ${p.label}: todo porcionado.` : `⚖️ ${p.label}: depósito lleno.`) : (p.then ? `${stBinTag(p)} ${p.label}: todo ${stBinWord(p)}, ahora ${ST_HOW[p.then].imp} en la hornilla.` : `🥬 ${p.label}: depósito lleno.`));
      setTimeout(() => { stRenderIfOpen(stShopArea()); renderStageTabs(); }, 450);   // deja ver caer la última porción
      return;
    }
  }
  shopPips();
}
function onShopKnifeMove(e) {
  const d = shopKnifeDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  d.x = e.clientX; d.y = e.clientY;
  if (!d.active) {
    if (Math.hypot(d.x - d.startX, d.y - d.startY) <= 6) return;
    d.active = true;
    const k = document.getElementById('shop-knife');
    const rect = k ? k.getBoundingClientRect() : { height: 60 };
    const ghost = document.createElement('div');
    ghost.className = 'maki-tool-ghost';
    ghost.style.height = `${rect.height * 1.15}px`;
    ghost.innerHTML = `<img src="assets/maki_knife.svg" alt="" draggable="false">`;
    document.body.appendChild(ghost);
    d.ghost = ghost;
    if (k) k.classList.add('is-lifted');
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (err) {}
  }
  const p = shopKnifePoint(d);
  if (d.ghost) d.ghost.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
  const board = document.getElementById('shop-board');
  if (board) { const r = board.getBoundingClientRect(); board.classList.toggle('drop-hover', p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom); }
}
function onShopKnifeUp(e) {
  const d = shopKnifeDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  const wasActive = d.active, p = shopKnifePoint(d);
  const board = document.getElementById('shop-board'), r = board ? board.getBoundingClientRect() : null;
  const inside = !!r && p.x >= r.left - 6 && p.x <= r.right + 6 && p.y >= r.top - 6 && p.y <= r.bottom + 6;
  cleanupShopKnife();
  const st = stGet(stShopArea());
  if (!wasActive) {                                  // un toque sobre el propio cuchillo
    if (st.knifeArmed) shopChop(); else shopHint('🔪 Arrastra el cuchillo hasta la tabla.');
    return;
  }
  st.knifeArmed = inside;                            // soltado sobre la tabla = armado; en otro lado = vuelve a su sitio
  try { playSound(inside ? 'add' : 'click'); } catch (e) {}
  if (inside) showStationToast(st.board ? '🔪 Da un tajo de lado a lado (o toca) para cortar (3 cortes = 1 porción).' : '🔪 Ahora pon un producto en la tabla (toca su ficha).');
  stRenderIfOpen(stShopArea());
}
document.addEventListener('pointerdown', (e) => {
  const k = e.target.closest && e.target.closest('#shop-knife');
  if (k) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (gameState.isPaused || gameState.isGameOver) return;
    cleanupShopKnife();
    e.preventDefault();
    shopKnifeDrag = { pointerId: e.pointerId, pointerType: e.pointerType, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, active: false, ghost: null };
    document.addEventListener('pointermove', onShopKnifeMove);
    document.addEventListener('pointerup', onShopKnifeUp);
    document.addEventListener('pointercancel', onShopKnifeUp);
    return;
  }
  // toque normal: solo cuenta como corte si el cuchillo está armado y no se tocó un control
  const cfg0 = slashCfg();
  const zone0 = cfg0 && !cfg0.anywhere ? document.querySelector(cfg0.zone) : null;
  if (!cfg0 || (zone0 && !(e.target.closest && zone0.contains(e.target))) || (e.target.closest && e.target.closest('button, .fp-card, .shop-pot, .kitchen-stage-btn, .kitchen-area-tab-btn, .hud-side-btn, .modal-overlay, a, input'))) { shopTap = null; shopSlash = null; return; }
  shopTap = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
  shopSlash = { id: e.pointerId, pts: [{ x: e.clientX, y: e.clientY, t: shopTap.t }], fired: 0, ready: true };
  shopTrailAdd({ x: e.clientX, y: e.clientY, t: shopTap.t, brk: true });
}, { passive: false });
// Corte estilo «Fruit Ninja» (Producción, Frituras y Makis): el dedo deja una estela y el producto se corta cuando el trazo LO CRUZA a buen ritmo;
// para el siguiente corte hay que salir del producto y volver a cruzarlo (zigzag). El cuchillo solo aparece un instante a lo largo del tajo.
const SHOP_SLASH_MIN_SPEED = 0.3;         // px/ms: más lento es un arrastre, no un tajo
const SHOP_SLASH_MIN_LEN = 28;            // px recorridos antes de que cuente
const slashesToCut = () => Math.max(2, Math.round(cutSeconds()));   // tajos para cortar la proteína (Frituras) o el maki (Makis): la mejora «Cuchillo afilado» los reduce (3 → 2); en Producción, 3 = 1 porción
let shopSlash = null, shopSlashLast = null;
// ¿Hay algo que cortar con tajos ahora mismo? Devuelve dónde (zona), qué (item) y qué hacer con un tajo / un toque suelto
function slashCfg() {
  if (!gameState || gameState.isPaused || gameState.isGameOver) return null;
  if (shopArmedActive()) return { zone: '#shop-board', item: '#shop-cb-item', anywhere: true, slash: () => shopChop(SHOP_GESTURE_LOCK_MS), tap: () => shopChop() };
  const a = gameState.activeArea;
  if (a === 'frituras' && gameState.fryStation && fryCanCut() && !fryKnifeDrag) return { zone: '#fry-table-card', item: '#fry-table-strip .fry-board-item', slash: () => fryCutSlash(), tap: () => fryCutSlash() };
  if (a === 'makis' && makiCanCut() && !makiToolDrag) return { zone: '#maki-board-zone', item: '#maki-roll-wrap', slash: () => makiCutSlash(), tap: () => makiCutSlash() };
  return null;
}
const slashShrink = (r, f) => ({ left: r.left + r.width * f, right: r.right - r.width * f, top: r.top + r.height * f, bottom: r.bottom - r.height * f });
const slashInRect = (p, r) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
function slashSegHitsRect(a, b, r) {                                  // Liang–Barsky: ¿el segmento a→b toca el rectángulo?
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y, p = [-dx, dx, -dy, dy], q = [a.x - r.left, r.right - a.x, a.y - r.top, r.bottom - a.y];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}
document.addEventListener('pointermove', (e) => {
  const s = shopSlash;
  if (!s || e.pointerId !== s.id) return;
  const cfg = slashCfg();
  if (!cfg) { shopSlash = null; return; }
  const now = performance.now(), prev = s.pts[s.pts.length - 1], cur = { x: e.clientX, y: e.clientY, t: now };
  s.pts.push(cur);
  if (s.pts.length > 40) s.pts.shift();
  shopTrailAdd(cur);
  const itemEl = document.querySelector(cfg.item);
  if (!itemEl) return;
  const r = itemEl.getBoundingClientRect();
  if (!r.width || !r.height) return;
  if (!slashInRect(cur, slashShrink(r, -0.2))) s.ready = true;                      // salió del producto: puede volver a cruzarlo
  if (!s.ready || !slashSegHitsRect(prev, cur, slashShrink(r, 0.12))) return;
  const back = s.pts[Math.max(0, s.pts.length - 4)], span = Math.max(1, cur.t - back.t), dist = Math.hypot(cur.x - back.x, cur.y - back.y);
  if (dist / span < SHOP_SLASH_MIN_SPEED || dist < SHOP_SLASH_MIN_LEN * 0.5) return;        // cruza muy despacio
  s.ready = false; s.fired++;
  shopSlashLast = { ang: Math.atan2(cur.y - back.y, cur.x - back.x), x: cur.x, y: cur.y, x0: back.x, y0: back.y, t: now };
  cfg.slash();
}, { passive: true });
document.addEventListener('pointerup', (e) => {
  const t = shopTap, s = shopSlash; shopTap = null; shopSlash = null;
  if (!t || t.id !== e.pointerId) return;
  if (s && s.fired) return;                                               // ya cortó con el tajo
  const len = Math.hypot(e.clientX - t.x, e.clientY - t.y), dur = performance.now() - t.t;
  if (!(len <= 12 && dur <= 450)) return;                                 // respaldo: un toque suelto corta; un trazo que no cruza el producto no
  const cfg = slashCfg();
  if (cfg) cfg.tap();
}, { passive: true });
document.addEventListener('pointercancel', () => { shopTap = null; shopSlash = null; }, { passive: true });
// Estela luminosa del dedo (canvas sobre la zona de corte): se desvanece en ~0,26 s
let shopTrailPts = [], shopTrailRaf = 0;
function shopTrailAdd(pt) { shopTrailPts.push(pt); if (!shopTrailRaf) shopTrailRaf = requestAnimationFrame(shopTrailDraw); }
function shopTrailDraw() {
  shopTrailRaf = 0;
  const cfg = slashCfg();
  const zone = cfg ? document.querySelector(cfg.zone) : null;
  if (!zone) { shopTrailPts = []; return; }
  let cv = zone.querySelector(':scope > canvas.shop-trail');
  const br = zone.getBoundingClientRect();
  if (!cv) { cv = document.createElement('canvas'); cv.className = 'shop-trail'; zone.appendChild(cv); }
  if (cv.width !== Math.round(br.width) || cv.height !== Math.round(br.height)) { cv.width = Math.round(br.width); cv.height = Math.round(br.height); }
  const g = cv.getContext('2d'), now = performance.now();
  g.clearRect(0, 0, cv.width, cv.height);
  shopTrailPts = shopTrailPts.filter(p => now - p.t < 260);
  if (shopTrailPts.length > 1) {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = '#8fdcff'; g.shadowBlur = 12;
    for (let i = 1; i < shopTrailPts.length; i++) {
      const a = shopTrailPts[i - 1], b = shopTrailPts[i], life = 1 - (now - b.t) / 260;
      if (b.brk) continue;                                            // inicio de otro trazo: no se une al anterior
      g.strokeStyle = `rgba(235,248,255,${(0.95 * life).toFixed(2)})`;
      g.lineWidth = 2 + 8 * life;
      g.beginPath(); g.moveTo(a.x - br.left, a.y - br.top); g.lineTo(b.x - br.left, b.y - br.top); g.stroke();
    }
  }
  if (shopTrailPts.length) shopTrailRaf = requestAnimationFrame(shopTrailDraw);
}

// ---- Pantalla del taller ----
function stRenderShop(area, panel) {
  const st = stGet(area), list = stProdOrdered(area).filter(p => !p.virtual);
  const freeSlot = st.stove.findIndex(x => !x);
  const cards = list.map(p => {
    const n = st.stock[p.key], how = ST_HOW[p.how], low = n <= Math.ceil(p.max * 0.25);
    const onBoard = st.board && st.board.key === p.key, onStove = st.stove.some(sl => sl && sl.key === p.key);
    const binFull = p.xfer ? stBin(st, p)[p.key] >= p.max : n >= p.max;
    const blocked = binFull || (!['cut', 'clean', 'blend', 'grate', 'fold'].includes(p.how) && freeSlot === -1);
    if (p.then) {                                   // dos pasos: 🔪 cortar -> queda "cortado" -> 💧 blanquear
      const c = st.cut[p.key], cutOff = c >= p.max, blOff = c < 1 || n >= p.max || freeSlot === -1;
      const h2 = ST_HOW[p.then];
      return `<div class="fp-card two-step ${low ? 'is-low' : ''} ${(onBoard || onStove) ? 'is-busy' : ''}">
      <div class="fp-card-ico">${stIngIconRaw(p.icon)}</div>
      <div class="fp-card-name">${p.short || p.label}</div>
      <div class="fp-card-n"><span data-stock-of="${p.key}">${n}/${p.max}</span> <span class="fp-cut" data-cut-of="${p.key}" title="${stBinWord(p)[0].toUpperCase() + stBinWord(p).slice(1)}, listo para ${ST_HOW[p.then].verb.toLowerCase()}">${stBinTag(p)}${c}</span>${p.after ? stCoolChip(st, p) : ''}</div>
      <div class="fp-btn-row">
        <button class="fp-btn" ${cutOff ? 'disabled' : ''} title="${p.tip1 || `${stVerb1(p)} ${p.label}`}" onclick="stProdStart('${area}','${p.key}','${p.how}')">${how.icon} ${stVerb1(p)}</button>
        <button class="fp-btn" ${blOff ? 'disabled' : ''} title="${p.tip2 ? `${p.tip2} (${stProdTime(p)} s)` : `${h2.verb} ${p.label} ${stBinWord(p)} (${stProdTime(p)} s)`}" onclick="stProdStart('${area}','${p.key}','${p.then}')">${h2.icon} ${h2.short}</button>
        ${p.after ? `<button class="fp-btn" data-pt-btn="${p.key}" ${stAfterOff(st, p, n) ? 'disabled' : ''} title="${stAfterTip(p)}" onclick="stProdStart('${area}','${p.key}','${p.after}')">${ST_HOW[p.after].icon} ${ST_HOW[p.after].short}</button>` : ''}
      </div>
    </div>`;
    }
    return `<div class="fp-card ${low ? 'is-low' : ''} ${(onBoard || onStove) ? 'is-busy' : ''}">
      <div class="fp-card-ico">${stIngIconRaw(p.icon)}</div>
      <div class="fp-card-name">${p.short || p.label}</div>
      <div class="fp-card-n"><span data-stock-of="${p.key}">${n}/${p.max}</span>${stHasRaw(p.icon) ? ` <span class="fp-arrow">→${stIngIcon(p.icon)}</span>` : ''}${p.xfer && stagedOn('frituras') ? ` <span class="fp-cut" title="Poro cortado: espera en Frituras para pasar por harina y freírse">🔪${stGet('frituras').stock[p.xfer]}→🍤</span>` : ''}</div>
      <button class="fp-btn" ${blocked ? 'disabled' : ''} title="${stVerb1(p)} ${p.label}${p.xfer ? ' (luego se pasa por harina y se fríe en Frituras)' : ''}" onclick="stProdStart('${area}','${p.key}')">${binFull ? 'Lleno' : `${how.icon} ${stVerb1(p)}`}</button>
    </div>`;
  }).join('');
  const b = st.board, bp = b ? stProdOf(area, b.key) : null, on = b ? (b.mode === 'fan' ? (b.phase || 0) : b.taps % SHOP_TAPS_PER_PORTION) : 0;
  const board = `<div class="shop-board ${b ? 'has-item' : ''}" id="shop-board">
      ${b ? `<span class="shop-board-ico">${stIngIconRaw(bp.icon)}</span>` : '<span class="shop-board-empty">Tabla libre</span>'}
      <div class="shop-pips" style="display:${b ? 'flex' : 'none'}">${[0, 1, 2].map(i => `<i class="${i < on ? 'on' : ''}"></i>`).join('')}</div>
      <div class="shop-label" id="shop-board-label">${b ? shopBoardLabelText(st, bp) : ''}</div>
    </div>`;
  const pots = st.stove.map((sl, i) => {
    const p = sl ? stProdOf(area, sl.key) : null;
    const st2 = sl ? (sl.state === 'cooking' ? `${ST_HOW[sl.how].icon} <b data-slot-left="${i}">${sl.left}</b> s` : (sl.state === 'ready' ? '✅ ¡Retirar!' : '⚠ Pasado')) : 'Libre';
    return `<div class="shop-pot p${i} ${sl ? 'is-' + sl.state : ''}" onclick="stShopCollect('${area}',${i})" title="Hornilla ${i + 1}">
      ${sl ? `<span class="shop-pot-ico" data-pot-ico="${i}" style="${stPotTone(sl) ? `filter:${stPotTone(sl)};transition:filter 1s linear` : ''}">${stIngIconRaw(p.icon)}</span>` : ''}
      <span class="shop-pot-state" data-slot-state="${i}">${st2}</span>
      ${sl && sl.state === 'cooking' ? `<div class="shop-bar pot-bar"><i data-slot-bar="${i}" style="width:${Math.round(100 * (1 - sl.left / sl.total))}%"></i></div>` : ''}
    </div>`;
  }).join('');
  const ssl = st.stirOpen != null ? st.stove[st.stirOpen] : null;
  if (ssl && ssl.stir) {                              // modo remover: wok grande visto desde arriba; el dedo remueve en círculos
    const sp = stProdOf(area, ssl.key), si = st.stirOpen;
    const pcs = Array.from({ length: 9 }, (_, k) => { const a = k * 2.4, r = 14 + (k % 3) * 11; return `<span class="pc" style="left:${50 + r * Math.cos(a)}%;top:${50 + r * Math.sin(a)}%;transform:rotate(${k * 41}deg)">${stIngIconRaw(sp.icon)}</span>`; }).join('');
    const bandL = (STIR_GOOD_MIN / STIR_SCALE_MAX) * 100, bandW = ((STIR_GOOD_MAX - STIR_GOOD_MIN) / STIR_SCALE_MAX) * 100;
    panel.innerHTML = `<div class="fp-wrap fp-shop is-stirring">
    <div class="fp-head"><span>🥬 Producción · ${AREA_LABELS[area]}</span><small>Remueve en círculos con el dedo sobre el wok, a ritmo parejo. Si paras, se pega y se quema.</small><button class="stage-panel-back fp-back" onclick="stStirClose('${area}')">← Volver</button>${stBackBtn(area)}</div>
    <div class="shop-cutlayout">
      <div class="stir-wok" id="stir-wok">
        <div class="stir-pan"><div class="stir-oil"></div><div class="stir-pieces" id="stir-pieces" style="transform:rotate(${ssl.stir.rot}deg);filter:${stPotTone(ssl)}">${pcs}</div></div>
        <div class="stir-guide"></div>
        <div class="stir-spoon">🥄</div>
      </div>
      <div class="stir-side">
        <div>🎨 Color: <b id="stir-color-txt">pálida</b></div>
        <div class="stir-meter stir-color"><b class="stir-mark" id="stir-color-mark"></b></div>
        <div>🌀 Ritmo: <b id="stir-rhythm-txt">¡remueve!</b></div>
        <div class="stir-meter"><u class="stir-band" style="left:${bandL}%;width:${bandW}%"></u><b class="stir-mark" id="stir-rhythm-mark"></b></div>
        <div>🔥 Se pega</div>
        <div class="stir-meter stir-burn"><i id="stir-burn-fill"></i></div>
        <button class="fp-btn" id="stir-take" style="display:none" onclick="stShopCollect('${area}',${si})">✔ Retirar</button>
      </div>
    </div></div>`;
    stStirAttach(area, si);
    stStirUi();
    return;
  }
  if (st.board && (SHOP_HAND_MODES.includes(st.board.mode) || st.knifeArmed)) {   // modo corte / limpieza / porcionado / enfriado / licuadora: tabla grande + cocina visible
    const pb = bp, bin = stBin(st, pb)[pb.key], isPortion = st.board.mode === 'portion', isFan = st.board.mode === 'fan', isBlend = st.board.mode === 'blend', isGrate = st.board.mode === 'grate', isFold = st.board.mode === 'fold', isClean = st.board.mode === 'clean' || isPortion || isFan || isBlend || isGrate || isFold;   // isClean = se hace con las manos
    const chips = list.filter(q => q.how === 'cut' || q.how === 'clean').map(q => {
      const c = stBin(st, q)[q.key];
      return `<button class="cb-chip ${st.board.key === q.key ? 'on' : ''}" ${c >= q.max ? 'disabled' : ''} title="${stVerb1(q)} ${q.label}" onclick="stProdStart('${area}','${q.key}','${q.how}')">${stIngIconRaw(q.icon)}<i data-cut-chip="${q.key}">${c}</i></button>`;
    }).join('');
    const rows = list.filter(q => q.then).map(q => {
      const c = st.cut[q.key], n2 = st.stock[q.key], off = c < 1 || n2 >= q.max || freeSlot === -1;
      return `<div class="bl-row"><span class="bl-ico">${stIngIconRaw(q.icon)}</span><b>${q.short || q.label}</b><span class="fp-cut" data-cut-of="${q.key}">${stBinTag(q)}${c}</span><span data-stock-of="${q.key}">${n2}/${q.max}</span><button class="fp-btn" data-bl-btn="${q.key}" ${off ? 'disabled' : ''} title="${ST_HOW[q.then].verb} ${q.label} ${stBinWord(q)} (${stProdTime(q)} s)" onclick="stProdStart('${area}','${q.key}','${q.then}')">${ST_HOW[q.then].icon}</button>${q.after ? `${stCoolChip(st, q)}<button class="fp-btn" data-pt-btn="${q.key}" ${stAfterOff(st, q, n2) ? 'disabled' : ''} title="${stAfterTip(q)}" onclick="stProdStart('${area}','${q.key}','${q.after}')">${ST_HOW[q.after].icon}</button>` : ''}</div>`;
    }).join('');
    panel.innerHTML = `<div class="fp-wrap fp-shop is-cutting">
    <div class="fp-head"><span>🥬 Producción · ${AREA_LABELS[area]}</span><small>${isGrate ? frGrateHint(pb) : isFold ? frFoldHint(st.board) : isBlend ? `Mantén pulsada la licuadora hasta llenar la barra: ${stProdTime(pb)} s.` : isFan ? `Mueve el arroz con Zu en zigzag con el dedo: ${FAN_STROKES_PER_PHASE} pasadas por tiempo, 3 tiempos hasta que enfríe.` : isPortion ? `Arrastra paladas del ${pb.label.toLowerCase()} frío hasta la balanza ⚖️: 3 paladas = 1 porción de ${stGrams(pb)} g.` : isClean ? `Frota ${pb.label.toLowerCase()} de lado a lado con el dedo: ${SHOP_TAPS_PER_PORTION * (pb.passes || 1)} pasadas = 1 porción ${stBinWord(pb)}${pb.passes > 1 ? ` (${pb.passes} lavados de ${SHOP_TAPS_PER_PORTION})` : ''}.` : 'Desliza el dedo de lado a lado para dar un tajo (o toca): 3 cortes = 1 porción.'}</small><button class="stage-panel-back fp-back" onclick="shopStowKnife()">${isClean ? '✔ Terminar' : '🔪 Guardar cuchillo'}</button>${stBackBtn(area)}</div>
    <div class="shop-cutlayout">
      <div class="shop-bigboard has-item" id="shop-board">
        <div class="cb-chips">${chips}</div>
        <div class="shop-label" id="shop-board-label">${shopBoardLabelText(st, pb)}</div>
        ${isGrate ? frGrateHtml(pb, st.board) : isFold ? frFoldHtml(pb, st.board, st) : isBlend ? shopBlendHtml(pb, st.board.prog) : isClean ? shopHeapHtml(pb, on, isPortion ? true : (isFan ? 'fan' : false)) : shopItemHtml(pb, on)}
        ${isPortion ? '<div class="cb-scale" id="shop-scale"><span class="sc-ico">⚖️</span><b>' + stGrams(pb) + ' g</b></div>' : ''}
        <div class="cb-pile" id="shop-pile">${shopPileHtml(pb, isPortion ? st.stock[pb.key] : bin)}</div>
        <div class="shop-pips" style="${isBlend || isGrate || isFold ? 'display:none' : ''}">${[0, 1, 2].map(i => `<i class="${i < on ? 'on' : ''}"></i>`).join('')}</div>
      </div>
      <div class="shop-side">
        ${rows ? `<div class="bl-list"><div class="bl-title">♨️ A la hornilla</div>${rows}</div>` : ''}
        <div class="shop-stove">${pots}</div>
      </div>
    </div></div>`;
    return;
  }
  const hint = !st.knifeArmed ? (area === 'frituras' ? 'Col, zanahoria y betarraga: 🧀 mandolina en diagonal. Gyozas: relleno (🔪 + 🧂) y luego 🥟 armar. Rulos: 🔪 juliana → ❄️ agua helada. Mayo: 🌀. Gohan (150 g): 🧺 2 lavados → ♨️ → 🧊 → ⚖️.' : area === 'makis' ? 'Arroz shari: 🧺 3 lavados → ♨️ cuécelo → 🍶 Zu y enfría en zigzag (3 tiempos). Queso crema: 🔪 en bastones. Salsa acevichada: 🌀 mantén pulsada la licuadora.' : area === 'salteados' ? 'Arroz Gohan: 🧺 lávalo 2 veces → ♨️ cuécelo → 🧊 se enfría solo → ⚖️ porciónalo (400 g). Verduras: 🔪 córtalas; el brócoli además 💧 se blanquea. Cebolla caramelizada: 🔪 corta la cebolla blanca → 🍯 con aceite en el wok hasta color caramelo.' : area === 'ramen' ?'Cortar: toca 🔪 y arrastra el cuchillo a la tabla. Holantao, espárrago y col: corta y 💧 blanquea. Moyashi: 🧺 límpialo y 💧 blanquea.' : 'Cortar: toca 🔪 y arrastra el cuchillo a la tabla. 🧺 = se limpia con las manos. Lo de dos pasos se prepara en la tabla y luego pasa a la hornilla.') : (st.board ? 'Da un tajo de lado a lado (o toca) para cortar: 3 cortes = 1 porción.' : 'Cuchillo listo: toca la ficha de un producto para cortar.');
  panel.innerHTML = `<div class="fp-wrap fp-shop">
    <div class="fp-head"><span>🥬 Producción · ${AREA_LABELS[area]}</span><small>${hint}</small>${stBackBtn(area)}</div>
    <div class="fp-cards many shop-cards" style="--cols:${Math.max(6, Math.ceil(list.length / 2))}">${cards}</div>
    <div class="shop-bottom">
      <div class="shop-left">${board}<img class="fry-knife-tool shop-knife ${st.knifeArmed ? 'armed' : ''}" id="shop-knife" src="assets/maki_knife.svg" alt="Cuchillo" draggable="false"></div>
      <div class="shop-stove">${pots}</div>
    </div></div>`;
}

// Actualización ligera cada segundo de las hornillas (sin recrear botones)
function stShopUi(area, panel) {
  const st = stGet(area);
  st.stove.forEach((sl, i) => {
    if (!sl || sl.state !== 'cooking') return;
    const l = panel.querySelector(`[data-slot-left="${i}"]`); if (l) l.textContent = sl.left;
    const bar = panel.querySelector(`[data-slot-bar="${i}"]`); if (bar) bar.style.width = `${Math.round(100 * (1 - sl.left / sl.total))}%`;
    const ic = panel.querySelector(`[data-pot-ico="${i}"]`); if (ic && stPotTone(sl)) ic.style.filter = stPotTone(sl);   // la cebolla va tomando color caramelo
  });
  panel.querySelectorAll('[data-cool-of]').forEach(el => { const p = stProdOf(area, el.dataset.coolOf); if (p) el.textContent = stCoolText(st, p); });   // 🧊 enfriando: cuenta atrás
}
