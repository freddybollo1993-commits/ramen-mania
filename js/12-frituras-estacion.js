/* Módulo 12-frituras-estacion — Frituras: estación, empanizado, olla y cuchillo.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// Frituras → pase: la proteína frita (y cortada si hace falta) se va a emplatar; la olla queda libre.
// Poro frito: sale de Frituras y llega a Salteado (existencias de Emplatar del Batayaki). Perfecto rinde 3 porciones; crudo o quemado, 1.
function fryPoroDone(st) {
  const sal = stGet('salteados'), p = stProdOf('salteados', 'poro');
  const gain = st.fryResult === 'PERFECTO' ? 3 : 1, before = sal.stock.poro;
  sal.stock.poro = Math.min(p.max, before + gain);
  showStationToast(`🍤 Poro frito: +${sal.stock.poro - before} para el Batayaki (ya está en Emplatar de Salteado)${st.fryResult === 'PERFECTO' ? '' : ' · no salió perfecto: rindió menos'}.`);
  try { playSound('stock_add'); } catch (e) {}
  if (fryTimerInterval) { clearInterval(fryTimerInterval); fryTimerInterval = null; }
  cleanupFryItemDrag();
  cleanupFryKnifeDrag();
  gameState.fryStation = newFryStation();
  renderFryStation();
  renderPantryGrid();
  stRenderIfOpen('salteados');
  renderStageTabs();
}
function moveFryToPass() {
  const st = gameState.fryStation;
  if (st.phase !== 'FRIED' || !fryCutDone(st)) return;
  if (st.proteinId === 71) { fryPoroDone(st); return; }
  let recipes = Object.entries(FRY_PLATING).filter(([n, p]) => p.protein === st.proteinId).map(([n]) => n);
  if (st.proteinId === 43) recipes = recipes.filter(n => st.kare ? n === 'Katsu Kare' : n !== 'Katsu Kare');      // con salsa kare (ya derramada en la cocina) es Katsu Kare; sin ella, Tonkatsu
  const ok = stPassAdd('frituras', { recipes, result: st.fryResult || 'PERFECTO', readyAt: st.readyAt != null ? st.readyAt : gameState.gameClock,
    vis: { kind: 'ing', id: st.proteinId, tone: st.fryTone, kare: !!st.kare }, meta: { result: st.fryResult || 'PERFECTO', secs: st.frySeconds, proteinId: st.proteinId, kare: !!st.kare, drain: st.drain || 0, cold: !!st.cold } });
  if (!ok) return;
  if (fryTimerInterval) { clearInterval(fryTimerInterval); fryTimerInterval = null; }
  cleanupFryItemDrag();
  cleanupFryKnifeDrag();
  gameState.fryStation = newFryStation();
  renderFryStation();
  renderPantryGrid();
}

// Corte (como en Makis: cuchillo vertical sostenido 3 s sobre la proteína frita). Solo se cortan
// los filetes empanizados (bife de pollo / de cerdo); el resto (alitas, kaarage, langostinos,
// gyozas) se sirve entero.
const FRY_CUT_PROTEIN_IDS = [43, 44];
const FRY_MEAT_COLORS = { 43: '#f2cfae', 44: '#f6e7c6' }; // interior del filete: cerdo / pollo

function fryProteinNeedsCut(id) { return FRY_CUT_PROTEIN_IDS.includes(id); }

function fryCutDone(station) {
  return !station.proteinId || !fryProteinNeedsCut(station.proteinId) || station.cutState === 'CUT';
}

// ¿Se puede cortar ahora? Proteína frita, de las que se cortan, y todavía sin cortar.
function fryCanCut() {
  const station = gameState.fryStation;
  return station.phase === 'FRIED' && !!station.proteinId && fryProteinNeedsCut(station.proteinId) && station.cutState !== 'CUT';
}

// Plato completo: receta completa, proteína frita y (si lleva) ya cortada.
function fryDishComplete() {
  const station = gameState.fryStation;
  if (stagedOn('frituras')) return station.phase === 'FRIED' && fryCutDone(station);
  return station.phase === 'FRIED' && analyzeFryStation().status === 'MATCHED' && fryCutDone(station);
}

// Salsa kare (Katsu Kare): se elige de la despensa, se calienta en la sartén (hornilla 2) y se derrama sobre el bife de cerdo frito y cortado hasta bañarlo por completo.
const FRY_PAN_HEAT_SECS = 5, FRY_POUR_SECS = 1.6;
const fryPan = () => (gameState.fryPan || (gameState.fryPan = { sauce: false, heat: 0 }));
let fryPanTimer = null, fryPourDrag = null;
function fryPanHtml() {
  const p = fryPan();
  if (!p.sauce) return '<span class="fry-pan-empty">Salsa kare ⟶ aquí</span>';
  const hot = p.heat >= 1;
  return `<div class="fry-pan ${hot ? 'hot' : ''}" id="fry-pan"><svg viewBox="0 0 100 60" aria-hidden="true"><ellipse cx="46" cy="34" rx="36" ry="17" fill="#2b2f33" stroke="#0e1012" stroke-width="2"/><ellipse cx="46" cy="32" rx="30" ry="13" fill="#6b3512"/><ellipse cx="40" cy="29" rx="12" ry="4" fill="#9a5424" opacity="0.7"/><rect x="80" y="30" width="19" height="6" rx="3" fill="#1b1d20"/>${hot ? '<path d="M30,20 q-4,-8 0,-14 M46,18 q-4,-8 0,-14 M62,20 q-4,-8 0,-14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.7" class="fry-pan-steam"/>' : ''}</svg>
    <i class="fry-pan-bar"><b id="fry-pan-fill" style="width:${Math.round(Math.min(1, p.heat) * 100)}%"></b></i>
    <span class="fry-pan-tip">${hot ? '¡Caliente! Arrástrala sobre el bife' : 'Calentando…'}</span></div>`;
}
function fryPanRender() {
  const z = document.getElementById('fry-pan-zone'); if (!z) return;
  z.style.display = stagedOn('frituras') ? 'block' : 'none';
  z.innerHTML = fryPanHtml();
}
function fryPanAdd(ing) {
  const p = fryPan();
  if (p.sauce) { showStationToast('🥣 La sartén ya tiene salsa kare.'); return; }
  p.sauce = true; p.heat = 0;
  try { playSound('add'); } catch (e) {}
  showStationToast('🔥 Salsa kare en la sartén: espera a que caliente y derrámala sobre el katsu.');
  fryPanRender();
  if (!fryPanTimer) fryPanTimer = setInterval(fryPanTick, 100);
}
function fryPanTick() {
  const p = fryPan();
  if (!p.sauce) { clearInterval(fryPanTimer); fryPanTimer = null; return; }
  if (gameState.isPaused || gameState.isGameOver) return;
  if (p.heat < 1) {
    p.heat = Math.min(1, p.heat + 0.1 / FRY_PAN_HEAT_SECS);
    const f = document.getElementById('fry-pan-fill'); if (f) f.style.width = Math.round(p.heat * 100) + '%';
    if (p.heat >= 1) { try { playSound('ding'); } catch (e) {} fryPanRender(); }
  }
}
function fryPourTarget() {                              // ¿hay un bife de cerdo frito y cortado listo para bañar?
  const st = gameState.fryStation;
  return st.phase === 'FRIED' && st.proteinId === 43 && fryCutDone(st) && !st.kare;
}
document.addEventListener('pointerdown', (e) => {
  const pan = e.target.closest && e.target.closest('#fry-pan');
  if (!pan || !stagedOn('frituras') || gameState.isPaused || gameState.isGameOver || fryPourDrag) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  const p = fryPan();
  if (p.heat < 1) { showStationToast('♨️ La salsa aún está calentando.'); return; }
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost fry-pan-ghost';
  ghost.innerHTML = '<span style="font-size:38px">🍳</span>';
  document.body.appendChild(ghost);
  fryPourDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse', ghost, last: performance.now() };
  fryPourMoveGhost();
  fryPourDrag.timer = setInterval(fryPourTick, 50);
}, { passive: false });
function fryPourOver() {
  const d = fryPourDrag, card = document.getElementById('fry-table-card');
  if (!d || !card) return false;
  const py = d.touch ? d.y - DRAG_TOUCH_GHOST_OFFSET_Y : d.y, r = card.getBoundingClientRect();
  return d.x >= r.left && d.x <= r.right && py >= r.top && py <= r.bottom;
}
function fryPourMoveGhost() {
  const d = fryPourDrag; if (!d) return;
  const py = d.touch ? d.y - DRAG_TOUCH_GHOST_OFFSET_Y : d.y;
  d.ghost.style.transform = `translate(${d.x}px, ${py}px) translate(-50%, -50%) rotate(${d.pouring ? -38 : 0}deg) scale(1.15)`;
}
function fryPourTick() {
  const d = fryPourDrag; if (!d) return;
  const now = performance.now(), dt = (now - d.last) / 1000; d.last = now;
  const st = gameState.fryStation, over = fryPourOver();
  if (over && !fryPourTarget() && now - (d.hint || 0) > 2500) {
    d.hint = now;
    showStationToast(st.kare ? '🍛 Ya está bañado.' : '🍛 La salsa kare va sobre el bife de cerdo ya frito y cortado.');
  }
  d.pouring = over && fryPourTarget();
  fryPourMoveGhost();
  if (!d.pouring) return;
  st.kp = Math.min(1, (st.kp || 0) + dt / FRY_POUR_SECS);
  sfxEvery('splash', 220);
  const el = document.querySelector('#fry-table-strip .fry-slices'); if (el) el.style.setProperty('--k', st.kp.toFixed(2));
  if (st.kp >= 1) {
    st.kare = true;
    const p = fryPan(); p.sauce = false; p.heat = 0;
    try { playSound('match'); } catch (e) {}
    showStationToast('🍛 ¡Katsu bañado por completo con salsa kare! Pásalo a emplatar.');
    fryPourEnd();
    fryPanRender();
    renderFryStation();
  }
}
function fryPourEnd() {
  const d = fryPourDrag; if (!d) return;
  clearInterval(d.timer);
  if (d.ghost) d.ghost.remove();
  fryPourDrag = null;
}
document.addEventListener('pointermove', (e) => { const d = fryPourDrag; if (d && e.pointerId === d.id) { d.x = e.clientX; d.y = e.clientY; fryPourMoveGhost(); } }, { passive: true });
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, (e) => { if (fryPourDrag && e.pointerId === fryPourDrag.id) fryPourEnd(); }, { passive: true }));

// Empanizado por gestos (Cocina por etapas): la proteína se suelta en la tabla cruda y se empaniza sobre las 3 bandejas, en orden:
// harina = 3 toques · huevo = 2 círculos con el dedo · panko = 3 toques. Solo entonces va a la olla (y el langostino, antes, al acomodo).
const FRY_BREAD_NEED = [3, 2, 3];
const fryBreadMax = pid => (pid === 71 ? 1 : 3);
function fryNeedsBread() {
  const st = gameState.fryStation;
  if (!st || !stagedOn('frituras') || st.phase !== 'BUILDING' || !st.proteinId) return false;
  return (st.proteinId === 71 || fryProteinNeedsBreading(st.proteinId)) && st.coat < fryBreadMax(st.proteinId);
}
function fryBreadUi() {                                  // marcas de cada bandeja: ○○○ pendientes · ● hechas
  const st = gameState.fryStation, on = fryNeedsBread();
  setFryBreadingUi(on, on ? st.coat : 0, on ? fryBreadMax(st.proteinId) : 3);
  document.querySelectorAll('.fry-bread-slot').forEach((slot, i) => {
    let pips = slot.querySelector('.fry-bread-pips');
    if (!pips) { pips = document.createElement('b'); pips.className = 'fry-bread-pips'; slot.appendChild(pips); }
    const tot = FRY_BREAD_NEED[i], done = !on ? 0 : (i < st.coat ? tot : (i === st.coat ? st.bp || 0 : 0));
    pips.innerHTML = on ? Array.from({ length: tot }, (_, k) => k < done ? '●' : '○').join('') : '';
    slot.classList.toggle('fry-bread-live', on && i === st.coat);
  });
}
function fryBreadHint() {
  const st = gameState.fryStation, i = st.coat, n = st.bp || 0;
  return i === 0 ? `🌾 Harina: toca la bandeja 3 veces (${n}/3)` : (i === 1 ? `🥚 Huevo: 2 círculos con el dedo en la bandeja (${n}/2)` : `🥖 Panko: toca la bandeja 3 veces (${n}/3)`);
}
function fryBreadAdvance(slot) {
  const st = gameState.fryStation, i = st.coat;
  st.bp = (st.bp || 0) + 1;
  try { playSound(['pat', 'splat', 'crunch'][i]); } catch (err) {}
  slot.classList.remove('fry-bread-hit'); void slot.offsetWidth; slot.classList.add('fry-bread-hit');
  if (st.bp >= FRY_BREAD_NEED[i]) {
    st.bp = 0; st.coat++;
    try { playSound('ding'); } catch (err) {}
    if (st.coat >= fryBreadMax(st.proteinId)) {
      if (st.proteinId !== 71 && !FRY_BREADING_IDS.every(b => st.ingredients.includes(b))) st.ingredients.push(...FRY_BREADING_IDS);
      showStationToast(FRY_ARRANGE[st.proteinId] ? '🍤 ¡Empanizado! Ahora acomódalas en la tabla.' : '🥖 ¡Empanizada! Arrástrala a la olla.');
    }
  }
  renderFryStation();
}
let fryBreadG = null;
document.addEventListener('pointerdown', (e) => {
  const slot = e.target.closest && e.target.closest('.fry-bread-slot');
  if (!slot || !fryNeedsBread() || gameState.isPaused || gameState.isGameOver) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const st = gameState.fryStation, i = +slot.dataset.step;
  e.preventDefault();
  if (i !== st.coat) { showStationToast(`🥖 Ahora toca: ${['la harina', 'el huevo', 'el panko'][st.coat]}.`); return; }
  if (i === 1) {
    const r = slot.getBoundingClientRect();
    fryBreadG = { id: e.pointerId, slot, acc: 0, tracker: new CircleTracker(r.left + r.width / 2, r.top + r.height / 2, Math.min(r.width, r.height) * 0.1) };
    fryBreadG.tracker.feed(e.clientX, e.clientY, performance.now());
  } else fryBreadAdvance(slot);
}, { passive: false });
document.addEventListener('pointermove', (e) => {
  const g = fryBreadG;
  if (!g || e.pointerId !== g.id) return;
  if (!fryNeedsBread() || gameState.fryStation.coat !== 1) { fryBreadG = null; return; }
  const r = g.tracker.feed(e.clientX, e.clientY, performance.now());
  if (!r || !r.delta) return;
  g.acc = (Math.sign(g.acc) === Math.sign(r.delta) || g.acc === 0) ? g.acc + r.delta : r.delta;      // invertir el giro reinicia el círculo
  g.slot.style.setProperty('--p', Math.min(1, Math.abs(g.acc) / (2 * Math.PI)).toFixed(2));
  g.slot.classList.add('is-dwelling');
  if (Math.abs(g.acc) >= 2 * Math.PI * 0.85) { g.acc = 0; g.slot.classList.remove('is-dwelling'); fryBreadAdvance(g.slot); }
}, { passive: true });
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, (e) => { if (fryBreadG && e.pointerId === fryBreadG.id) { fryBreadG.slot.classList.remove('is-dwelling'); fryBreadG = null; } }, { passive: true }));

// Acomodo en la tabla (solo Cocina por etapas): la tabla se expande y se mueven las piezas empanizadas de un lado al otro en N pasadas → 1 porción para un plato
const FRY_ARRANGE = { 60: { passes: 3, count: 6 } };      // langostino: 6 piezas en 3 pasadas de 2
const FRY_ARR_MIN_PX = 60;
const fryNeedsArrange = () => { const st = gameState.fryStation; return !!st && st.phase === 'BUILDING' && !!st.proteinId && !!FRY_ARRANGE[st.proteinId] && stagedOn('frituras') && st.coat >= 3 && (st.arr || 0) < FRY_ARRANGE[st.proteinId].passes; };
function fryArrangeHtml(pid, arr) {
  const cfg = FRY_ARRANGE[pid], per = cfg.count / cfg.passes;
  const shr = Array.from({ length: cfg.count }, (_, i) => {
    const moved = i < per * arr, col = i % 2, row = Math.floor(i / 2);
    const x = (moved ? 60 : 8) + col * 15 + (row % 2 ? 3 : 0), y = 4 + row * 24;
    return `<span class="fry-arr-s${moved ? ' moved' : ''}" style="left:${x}%;top:${y}%">${fryItemMarkup(pid, 3)}</span>`;
  }).join('');
  return `<div class="fry-arr" id="fry-arr"><i class="fry-arr-mid"></i>${shr}<span class="fry-arr-hint">Desliza → · pasada ${Math.min(cfg.passes, arr + 1)} de ${cfg.passes}</span></div>`;
}
let fryArrDrag = null;
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest || !e.target.closest('#fry-arr') || !fryNeedsArrange() || gameState.isPaused || gameState.isGameOver) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  fryArrDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, fired: false };
  e.preventDefault();
}, { passive: false });
document.addEventListener('pointermove', (e) => {
  const d = fryArrDrag;
  if (!d || e.pointerId !== d.id || d.fired || !fryNeedsArrange()) return;
  const dx = e.clientX - d.x, dy = e.clientY - d.y;
  if (dx > FRY_ARR_MIN_PX && dx > Math.abs(dy) * 1.2) {
    d.fired = true;
    const st = gameState.fryStation, cfg = FRY_ARRANGE[st.proteinId];
    st.arr = (st.arr || 0) + 1;
    try { sfxEvery('splash', 120); } catch (err) {}
    if (st.arr >= cfg.passes) { try { playSound('ding'); } catch (err) {} showStationToast('🍤 ¡1 porción lista! Arrástrala a la olla.'); }
    renderFryStation();
  }
}, { passive: true });
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, (e) => { if (fryArrDrag && e.pointerId === fryArrDrag.id) fryArrDrag = null; }, { passive: true }));

// ¿Esta proteína va empanizada? (la usa alguna receta que lleva harina + huevo + panko)
function fryProteinNeedsBreading(id) {
  return getFriturasFryableRecipes().some(r => r.ingredients.includes(id) && FRY_BREADING_IDS.every(b => r.ingredients.includes(b)));
}

// Proteína con su empanizado: coat 0 = cruda sin empanizar, 1 = harina, 2 = huevo, 3 = panko.
function fryItemMarkup(proteinId, coat) {
  const ing = INGREDIENTES.find(i => i.id === proteinId);
  const shape = ing && ing.img ? ` style="--shape:url('${ing.img}')"` : '';
  return `<span class="fry-item coat-${coat}"><span class="fry-item-base">${ingIconHtml(ing)}<i class="fry-item-coat"${shape}></i></span></span>`;
}

// Color de la comida según el tiempo en el aceite: pálida (cruda) → dorada (lista) → muy oscura.
function fryToneFilter(sec, proteinId) {
  const prof = fryProfile(proteinId);
  if (sec <= prof.burn) {
    const p = Math.min(1, sec / prof.ready);
    return `saturate(${(0.55 + 0.95 * p).toFixed(2)}) sepia(${(0.05 + 0.55 * p).toFixed(2)}) brightness(${(1.15 - 0.12 * p).toFixed(2)})`;
  }
  const q = Math.min(1, (sec - prof.burn) / (prof.black - prof.burn));
  return `sepia(0.65) saturate(${(1.5 - 1.0 * q).toFixed(2)}) brightness(${(0.95 - 0.75 * q).toFixed(2)})`;
}

function fryResultFor(sec, proteinId) {
  const prof = fryProfile(proteinId);
  return sec < prof.ready ? 'CRUDO' : (sec < prof.burn ? 'PERFECTO' : 'QUEMADO');
}

function getFriturasFryableRecipes() {
  return RECETAS_FRITURAS.filter(r => r.metodo !== 'hervido');
}

function analyzeFryStation() {
  const station = gameState.fryStation;
  const seq = station.ingredients;
  if (seq.length === 0) return { status: "EMPTY" };

  const seqSet = new Set(seq);
  const catalog = getFriturasFryableRecipes();

  for (const r of catalog) {
    const rSet = new Set(r.ingredients);
    if (rSet.size === seqSet.size && [...rSet].every(x => seqSet.has(x))) {
      const needsBreading = rSet.has(58) && rSet.has(15) && rSet.has(65); // harina, huevo, panko
      if (needsBreading) {
        const posHarina = seq.indexOf(58);
        const posHuevo = seq.indexOf(15);
        const posPanko = seq.indexOf(65);
        if (!(posHarina < posHuevo && posHuevo < posPanko)) {
          return { status: "WRONG_BREADING_ORDER", recipe: r };
        }
      }
      return { status: "MATCHED", recipe: r };
    }
  }

  let bestRecipe = null, bestOverlap = -1, bestMissing = [], bestExtra = [];
  for (const r of catalog) {
    const rSet = new Set(r.ingredients);
    const missing = [...rSet].filter(x => !seqSet.has(x));
    const extra = [...seqSet].filter(x => !rSet.has(x));
    const overlap = [...seqSet].filter(x => rSet.has(x)).length;
    if (overlap > bestOverlap) { bestOverlap = overlap; bestRecipe = r; bestMissing = missing; bestExtra = extra; }
  }
  return {
    status: "PROGRESS",
    recipe: bestRecipe,
    overlap: bestOverlap,
    missing: bestMissing.map(id => INGREDIENTES.find(i => i.id === id).display),
    extra: bestExtra.map(id => INGREDIENTES.find(i => i.id === id).display)
  };
}

// ---- Frituras con etapas: fuego, temperatura del aceite y escurrir ----
// La olla tiene su propia perilla: encendida, el aceite sube de temperatura en ~3 s (se enfría más despacio al apagar). Meter la proteína
// con el aceite frío la fríe más lento y la deja grasosa; al retirarla hay que ESCURRIRLA (sacudir arriba y abajo sobre la tabla).
// Puntos de proceso (30): 12 de orden (ya exigido) + 10 de escurrido + 8 de aceite caliente.
const FRY_HEAT_SECS = 4;           // de frío a caliente
const FRY_COOL_SECS = 8;           // de caliente a frío con el fuego apagado
const FRY_HOT_TEMP = 0.8;          // desde esta temperatura el aceite está listo
const FRY_DRAIN_PX = 260;          // recorrido vertical total para escurrir del todo
const fryer = () => gameState.fryer || (gameState.fryer = { fire: false, temp: 0 });
const fryStaged = () => !!gameState.fryStation && stagedOn('frituras');
const FRY_FLAMES_SVG = (() => {
  let fl = '';
  for (let k = 0; k < 9; k++) { const fx = 10 + k * 10; fl += `<path d="M ${fx - 3.6},20 Q ${fx - 4.6},10 ${fx},0 Q ${fx + 4.6},10 ${fx + 3.6},20 Z" fill="#4aa3ff" stroke="#1f5fa8" stroke-width="0.5"/><path d="M ${fx - 1.7},19 Q ${fx},11 ${fx + 1.7},19 Z" fill="#ff9a3d"/>`; }
  return `<svg viewBox="0 0 100 20" preserveAspectRatio="none">${fl}</svg>`;
})();
function fryFireToggle() {
  if (!fryStaged() || gameState.isPaused || gameState.isGameOver) return;
  const f = fryer();
  f.fire = !f.fire;
  try { playSound(f.fire ? 'flame' : 'click'); } catch (e) {}
  showStationToast(f.fire ? `🔥 Olla encendida: el aceite tarda ${FRY_HEAT_SECS} s en calentar.` : '🔥 Olla apagada.');
  fryUpdateFireUi();
}
function fryHeatFactor() {
  return fryStaged() ? 0.5 + 0.5 * Math.min(1, fryer().temp / FRY_HOT_TEMP) : 1;   // aceite frío: cocina a media velocidad
}
function fryUpdateFireUi() {
  const stove = document.getElementById('fry-stove');
  if (!stove) return;
  const on = fryStaged();
  stove.classList.toggle('fry-fire-ui', on);
  if (!on) return;
  const fl = stove.querySelector('.fry-flames');
  if (fl && !fl.firstChild) fl.innerHTML = FRY_FLAMES_SVG;
  const f = fryer();
  stove.classList.toggle('fire-on', f.fire);
  stove.classList.toggle('is-hot', f.temp >= FRY_HOT_TEMP);
  const fill = document.getElementById('fry-heat-fill');
  if (fill) fill.style.width = `${Math.round(f.temp * 100)}%`;
}
function fryTempTick() {
  if (!gameState.fryStation || gameState.isPaused || gameState.isGameOver || !fryStaged()) return;
  const f = fryer();
  f.temp = f.fire ? Math.min(1, f.temp + 0.1 / FRY_HEAT_SECS) : Math.max(0, f.temp - 0.1 / FRY_COOL_SECS);
  fryUpdateFireUi();
}
setInterval(fryTempTick, 100);
// Escurrir: sacudir arriba y abajo sobre la tabla con la proteína ya frita
let frySwipe = null;
const fryDrainAllowed = () => { const st = gameState.fryStation; return fryStaged() && !!st && st.phase === 'FRIED' && !!st.proteinId && (st.drain || 0) < 1; };
function fryDrainUi() {
  const st = gameState.fryStation, item = document.querySelector('#fry-table-strip .fry-board-item');
  if (item) item.style.setProperty('--oil', String(Math.max(0, 1 - (st.drain || 0)).toFixed(2)));
}
document.addEventListener('pointerdown', (e) => {
  if (!fryDrainAllowed() || !e.target.closest) return;
  if (!e.target.closest('#fry-table-card') || e.target.closest('button')) return;
  frySwipe = { id: e.pointerId, y: e.clientY };
}, { passive: true });
document.addEventListener('pointermove', (e) => {
  const sw = frySwipe;
  if (!sw || e.pointerId !== sw.id) return;
  if (!fryDrainAllowed()) { frySwipe = null; return; }
  const dy = Math.abs(e.clientY - sw.y);
  sw.y = e.clientY;
  const st = gameState.fryStation, before = st.drain || 0;
  st.drain = Math.min(1, before + dy / FRY_DRAIN_PX);
  sfxEvery('splash', 240);
  fryDrainUi();
  if (before < 1 && st.drain >= 1) { try { playSound('ding'); } catch (err) {} showStationToast('💧 ¡Bien escurrido!'); renderFryStation(); }
}, { passive: true });
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, (e) => { if (frySwipe && e.pointerId === frySwipe.id) frySwipe = null; }, { passive: true }));

// Proteína ya empanizada (o sin empanizar, si la receta no lo lleva) que se suelta en la tabla.
function placeFryProtein(ing, coat) {
  const station = gameState.fryStation;
  if (!coopLock('fry-table-card')) return;
  if (station.phase !== 'BUILDING' || station.proteinId) {
    showStationToast('Ya hay una proteína en proceso: descarta con 🗑️ para empezar otra.');
    return;
  }
  if (ing.id === 71) {                                  // poro cortado en Salteado: solo lleva harina
    if (coat < 1 && !stagedOn('frituras')) { showStationToast('🌾 Falta la harina: pasa el poro por la harina y suéltalo en la tabla.'); return; }
    if (!stCookTake('frituras', 71)) return;
    station.proteinId = 71;
    station.coat = stagedOn('frituras') ? 0 : 1;
    station.bp = 0;
    station.ingredients.push(71, 58);
    playSound('add');
    renderFryStation();
    renderPantryGrid();
    return;
  }
  const needs = fryProteinNeedsBreading(ing.id);
  if (needs && coat < 3 && !stagedOn('frituras')) {
    showStationToast('🥖 Falta empanizar: arrastra la proteína por la harina, el huevo y el panko (en ese orden) y suéltala en la tabla.');
    return;
  }
  if (!needs && coat > 0) {
    showStationToast(`${ing.display} no lleva empanizado: arrástrala directo a la tabla.`);
    return;
  }
  if (!stCookTake('frituras', ing.id)) return;
  station.proteinId = ing.id;
  station.coat = needs && !stagedOn('frituras') ? 3 : 0;
  station.arr = 0;
  station.bp = 0;
  station.ingredients.push(ing.id);
  if (needs && !stagedOn('frituras')) station.ingredients.push(...FRY_BREADING_IDS);
  if (needs && stagedOn('frituras')) showStationToast('🥖 Empanízala en las bandejas: harina, huevo y panko.');
  playSound('add');
  renderFryStation();
  renderPantryGrid();
}

// Quita la proteína cruda de la tabla (con su empanizado). Solo antes de meterla a la olla.
function removeFryProtein() {
  const station = gameState.fryStation;
  if (!station.proteinId || station.phase !== 'BUILDING') return false;
  stCookRefund('frituras', station.proteinId);
  station.ingredients = station.ingredients.filter(id => id !== station.proteinId && !FRY_BREADING_IDS.includes(id));
  station.proteinId = null;
  station.coat = 0;
  station.arr = 0;
  station.bp = 0;
  station.kare = false;
  station.kp = 0;
  return true;
}

// Guarniciones y demás ingredientes que van sobre la tabla (la proteína entra arrastrándola
// por el empanizado; la harina, el huevo y el panko son los tres espacios).
function toggleIngredientInFryStation(ingId) {
  if (gameState.isPaused || gameState.isGameOver) return;
  if (!coopLock('fry-table-card')) return;
  const station = gameState.fryStation;
  if (FRY_BREADING_IDS.includes(ingId)) {
    showStationToast('🥖 El empanizado se hace arrastrando la proteína por los tres espacios.');
    return;
  }
  if (FRY_PROTEIN_IDS.includes(ingId)) {
    if (station.proteinId === ingId && station.phase === 'BUILDING') {
      removeFryProtein();
      playSound('add');
      renderFryStation();
      renderPantryGrid();
    } else if (station.proteinId === ingId) {
      showStationToast('Esa proteína ya está en proceso: descarta con 🗑️ para empezar otra.');
    } else {
      showStationToast('Arrastra la proteína por harina → huevo → panko y suéltala en la tabla.');
    }
    return;
  }
  if (station.phase === 'FRYING') {
    showStationToast('La olla está en uso: retira la proteína para seguir.');
    return;
  }
  if (station.ingredients.includes(ingId)) {
    station.ingredients = station.ingredients.filter(id => id !== ingId);
  } else {
    station.ingredients.push(ingId);
  }
  playSound('add');
  renderFryStation();
  renderPantryGrid();
}

function discardFryStation() {
  const fs0 = gameState.fryStation;
  if (fs0.ingredients.length >= MOTTAINAI_MIN_DISCARD) {
    if (fs0.fryResult === 'QUEMADO' || (fs0.phase === 'FRYING' && fs0.frySeconds >= fryProfile(fs0.proteinId).burn)) showStationToast('💨 Lo quemado no se aprovecha: a la basura.');
    else addTrimmings(1, 'fritura descartada');
  }
  if (fryTimerInterval) { clearInterval(fryTimerInterval); fryTimerInterval = null; }
  cleanupFryItemDrag();
  cleanupFryKnifeDrag();
  gameState.fryStation = newFryStation();
  playSound('trash');
  renderFryStation();
  renderPantryGrid();
}

// La proteína de la tabla se mete a la olla (arrastrándola hasta ella): arranca el contador.
function startFryingFromBoard() {
  const station = gameState.fryStation;
  if (station.phase !== 'BUILDING' || !station.proteinId) return;
  if (fryNeedsBread()) { showStationToast('🥖 Falta empanizar: ' + fryBreadHint().replace(/^\S+ /, '')); return; }
  if (fryNeedsArrange()) { showStationToast('🍤 Falta acomodarlas: desliza → sobre la tabla para pasarlas de un lado al otro.'); return; }
  if (!coopLock('fry-table-card')) return;
  station.phase = 'FRYING';
  station.frySeconds = 0;
  station.fryTone = '';
  station.drain = 0;
  station.cold = fryStaged() && fryer().temp < FRY_HOT_TEMP;
  if (station.cold) showStationToast(fryer().fire ? '🛢️ El aceite aún está frío: sale más lento y grasoso. Espera a que caliente.' : '🛢️ Aceite frío: enciende la olla (🔥) antes de freír o saldrá grasoso.');
  playSound('splash');
  if (fryTimerInterval) { clearInterval(fryTimerInterval); fryTimerInterval = null; }
  ensureFryTimer();
  renderFryStation();
}

// El contador de la olla siempre corre sobre la estación actual (también si el compañero la reemplaza).
function ensureFryTimer() {
  if (fryTimerInterval) return;
  fryTimerInterval = setInterval(() => {
    const st = gameState.fryStation;
    if (st.phase !== 'FRYING') { clearInterval(fryTimerInterval); fryTimerInterval = null; return; }
    if (gameState.isPaused || gameState.isGameOver) return;
    st.frySeconds += 0.05 * fryHeatFactor();
    sfxEvery('crackle', 340);
    const pf = fryProfile(st.proteinId);
    if (!st._sndReady && st.frySeconds >= pf.ready) { st._sndReady = true; playSound('ding'); }   // punto justo
    if (!st._sndBurn && st.frySeconds >= pf.burn) { st._sndBurn = true; playSound('burn'); }       // se está quemando
    renderFryStation();
  }, 50);
}

// Retirar la proteína del aceite (botón de la olla): crudo / perfecto / quemado según el
// momento, y vuelve a la tabla con el color que alcanzó.
function handleFryActionClick() {
  const station = gameState.fryStation;
  if (station.phase !== 'FRYING') return;
  if (!coopLock('fry-table-card')) return;
  if (fryTimerInterval) { clearInterval(fryTimerInterval); fryTimerInterval = null; }
  station.fryResult = fryResultFor(station.frySeconds, station.proteinId);
  station.fryTone = fryToneFilter(station.frySeconds, station.proteinId);
  station.phase = 'FRIED';
  playSound(station.fryResult === 'PERFECTO' ? 'match' : 'burn');
  renderFryStation();
  if (station.fryResult === 'PERFECTO') vfxAtElement('fry-oil-card', 'good');
  else if (station.fryResult === 'QUEMADO') vfxAtElement('fry-oil-card', 'bad');
}

function attemptServeFryStation() {
  if (!fryDishComplete()) return;
  if (stagedOn('frituras')) { moveFryToPass(); return; }
  serveReadyDish('frituras', 0);
}

// --- Arrastrar la proteína empanizada de la tabla a la olla ---
function cleanupFryItemDrag() {
  const d = fryItemDrag;
  document.removeEventListener('pointermove', onFryItemMove);
  document.removeEventListener('pointerup', onFryItemUp);
  document.removeEventListener('pointercancel', onFryItemCancel);
  if (d) {
    if (d.ghost) d.ghost.remove();
    if (d.el) d.el.classList.remove('is-lifted');
  }
  const pot = document.getElementById('fry-oil-card');
  if (pot) pot.classList.remove('drop-target-ready', 'drop-hover');
  fryItemDrag = null;
}

function fryItemOverPot(d) {
  const pot = document.getElementById('fry-oil-card');
  if (!pot) return false;
  const p = { x: d.x, y: d.pointerType === 'mouse' ? d.y : d.y - DRAG_TOUCH_GHOST_OFFSET_Y };
  const r = pot.getBoundingClientRect();
  return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
}

function moveFryItemGhost() {
  const d = fryItemDrag;
  if (!d || !d.ghost) return;
  const py = d.pointerType === 'mouse' ? d.y : d.y - DRAG_TOUCH_GHOST_OFFSET_Y;
  d.ghost.style.transform = `translate(${d.x}px, ${py}px) translate(-50%, -50%) scale(1.15)`;
}

function onFryItemMove(e) {
  const d = fryItemDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  d.x = e.clientX;
  d.y = e.clientY;
  if (!d.active) {
    if (Math.hypot(d.x - d.startX, d.y - d.startY) <= 4) return;
    d.active = true;
    const station = gameState.fryStation;
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = fryItemMarkup(station.proteinId, station.coat);
    document.body.appendChild(ghost);
    d.ghost = ghost;
    d.el.classList.add('is-lifted');
    const pot = document.getElementById('fry-oil-card');
    if (pot) pot.classList.add('drop-target-ready');
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (err) {}
  }
  moveFryItemGhost();
  const pot = document.getElementById('fry-oil-card');
  if (pot) pot.classList.toggle('drop-hover', fryItemOverPot(d));
}

function onFryItemUp(e) {
  const d = fryItemDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  d.x = e.clientX;
  d.y = e.clientY;
  const wasActive = d.active;
  const overPot = wasActive && fryItemOverPot(d);
  cleanupFryItemDrag();
  if (overPot) startFryingFromBoard();
  else if (!wasActive) showStationToast('🍳 Arrastra la proteína empanizada hasta la olla de aceite.');
}

function onFryItemCancel(e) {
  const d = fryItemDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  cleanupFryItemDrag();
}

function attachFryItemDrag() {
  const strip = document.getElementById('fry-table-strip');
  if (!strip || strip._fryBound) return;
  strip._fryBound = true;
  strip.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.fry-board-item');
    if (!el || el.classList.contains('is-static')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (gameState.isPaused || gameState.isGameOver) return;
    const station = gameState.fryStation;
    if (station.phase !== 'BUILDING' || !station.proteinId) return;
    if (fryNeedsBread()) { showStationToast('🥖 Primero empanízala: ' + fryBreadHint().replace(/^\S+ /, '')); return; }
    cleanupFryItemDrag();
    e.preventDefault();
    fryItemDrag = {
      el, pointerId: e.pointerId, pointerType: e.pointerType,
      startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY,
      active: false, ghost: null
    };
    document.addEventListener('pointermove', onFryItemMove);
    document.addEventListener('pointerup', onFryItemUp);
    document.addEventListener('pointercancel', onFryItemCancel);
  });
}

// --- Cuchillo de Frituras (igual que el de Makis): se arrastra sobre la proteína frita que está
// en la tabla y se mantiene 3 s sin soltar ni salirse de la tabla. Soltar antes cancela.
let fryKnifeDrag = null;

function fryKnifePoint(d) {
  return { x: d.x, y: d.pointerType === 'mouse' ? d.y : d.y - DRAG_TOUCH_GHOST_OFFSET_Y };
}

function abortFryCut() {
  const station = gameState.fryStation;
  if (station.cutState === 'CUTTING') {
    station.cutState = 'NONE';
    station.cutProgress = 0;
    station.slashes = 0;
  }
}

function cleanupFryKnifeDrag() {
  const d = fryKnifeDrag;
  document.removeEventListener('pointermove', onFryKnifeMove);
  document.removeEventListener('pointerup', onFryKnifeUp);
  document.removeEventListener('pointercancel', onFryKnifeCancel);
  if (d) {
    if (d.timer) clearInterval(d.timer);
    if (d.ghost) d.ghost.remove();
    if (d.el) d.el.classList.remove('is-lifted');
  }
  const board = document.getElementById('fry-table-card');
  if (board) board.classList.remove('drop-target-ready', 'drop-hover');
  fryKnifeDrag = null;
}

// Tajos (Fruit Ninja): 3 tajos que crucen la proteína frita la cortan; el cuchillo arrastrado y mantenido 3 s sigue valiendo como respaldo
function fryCutSlash() {
  const station = gameState.fryStation;
  if (!fryCanCut()) return;
  station.slashes = (station.slashes || 0) + 1;
  station.cutState = 'CUTTING';
  station.cutProgress = Math.min(1, station.slashes / slashesToCut());
  playSound('chop');
  const item = document.querySelector('#fry-table-strip .fry-board-item');
  slashFx({ zone: document.getElementById('fry-table-card'), item, iconHtml: item ? '<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;filter:' + (station.fryTone || 'none') + '">' + fryItemMarkup(station.proteinId, station.coat) + '</span>' : '', bitsImg: ingCtxImg(INGREDIENTES.find(i => i.id === station.proteinId)) });
  if (station.slashes >= slashesToCut()) { station.slashes = 0; completeFryCut(); return; }
  renderFryStation();
}
function completeFryCut() {
  const station = gameState.fryStation;
  cleanupFryKnifeDrag();
  station.cutState = 'CUT';
  station.cutProgress = 1;
  playSound('chop');
  playSound('match');
  renderFryStation();
  vfxAtElement('fry-table-card', 'cut');
  addTrimmings(1, 'recortes del katsu');
}

function updateFryKnifeDrag() {
  const d = fryKnifeDrag;
  if (!d || !d.active) return;
  if (gameState.isPaused || gameState.isGameOver) return;
  const board = document.getElementById('fry-table-card');
  if (!board) return;
  const p = fryKnifePoint(d);
  const r = board.getBoundingClientRect();
  const inside = p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
  const station = gameState.fryStation;
  const can = fryCanCut();
  board.classList.toggle('drop-hover', inside && can);
  if (inside && can) {
    if (!d.holdStart) {
      d.holdStart = performance.now();
      station.cutState = 'CUTTING';
      if (d.ghost) d.ghost.classList.add('is-cutting');
    }
    station.cutProgress = Math.min(1, (performance.now() - d.holdStart) / (cutSeconds() * 1000));
    sfxEvery('chop', 330);
    if (station.cutProgress >= 1) { completeFryCut(); return; }
    renderFryStation();
  } else if (d.holdStart) {
    d.holdStart = null;
    abortFryCut();
    if (d.ghost) d.ghost.classList.remove('is-cutting');
    renderFryStation();
  }
}

function moveFryKnifeGhost() {
  const d = fryKnifeDrag;
  if (!d || !d.ghost) return;
  const p = fryKnifePoint(d);
  d.ghost.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
}

function onFryKnifeMove(e) {
  const d = fryKnifeDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  d.x = e.clientX;
  d.y = e.clientY;
  if (!d.active) {
    if (Math.hypot(d.x - d.startX, d.y - d.startY) <= 4) return;
    d.active = true;
    const rect = d.el.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'maki-tool-ghost';
    ghost.style.height = `${rect.height * 1.15}px`;
    ghost.innerHTML = `<img src="${d.el.getAttribute('src')}" alt="" draggable="false">`;
    document.body.appendChild(ghost);
    d.ghost = ghost;
    d.el.classList.add('is-lifted');
    const board = document.getElementById('fry-table-card');
    if (board && fryCanCut()) board.classList.add('drop-target-ready');
    d.timer = setInterval(updateFryKnifeDrag, 50);
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (err) {}
  }
  moveFryKnifeGhost();
  updateFryKnifeDrag();
}

function onFryKnifeUp(e) {
  const d = fryKnifeDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  d.x = e.clientX;
  d.y = e.clientY;
  const wasActive = d.active;
  const board = document.getElementById('fry-table-card');
  const p = fryKnifePoint(d);
  const r = board ? board.getBoundingClientRect() : null;
  const inside = !!r && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
  abortFryCut();
  cleanupFryKnifeDrag();
  if (!wasActive) {
    showStationToast('🔪 Desliza el dedo de lado a lado sobre la proteína frita para cortarla (' + slashesToCut() + ' tajos).');
  } else if (inside && !fryCanCut()) {
    const station = gameState.fryStation;
    if (station.cutState === 'CUT') showStationToast('Esa proteína ya está cortada.');
    else if (station.phase !== 'FRIED') showStationToast('🔪 Primero fríe la proteína y retírala de la olla.');
    else showStationToast('Esta proteína se sirve entera: no hace falta cortarla.');
  }
  renderFryStation();
}

function onFryKnifeCancel(e) {
  const d = fryKnifeDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  abortFryCut();
  cleanupFryKnifeDrag();
  renderFryStation();
}

function attachFryKnifeDrag() {
  const el = document.getElementById('fry-tool-knife');
  if (!el || el._fryKnifeBound) return;
  el._fryKnifeBound = true;
  el.addEventListener('contextmenu', (ev) => ev.preventDefault());
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (gameState.isPaused || gameState.isGameOver) return;
    if (gameState.activeArea !== 'frituras') return;
    cleanupFryKnifeDrag();
    e.preventDefault();
    fryKnifeDrag = {
      el, pointerId: e.pointerId, pointerType: e.pointerType,
      startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY,
      active: false, ghost: null, timer: null, holdStart: null
    };
    document.addEventListener('pointermove', onFryKnifeMove);
    document.addEventListener('pointerup', onFryKnifeUp);
    document.addEventListener('pointercancel', onFryKnifeCancel);
  });
}

function renderFryStation() {
  const strip = document.getElementById('fry-table-strip');
  const tableBadge = document.getElementById('fry-table-badge');
  const oilBadge = document.getElementById('fry-oil-badge');
  const oilVisual = document.getElementById('fry-oil-visual');
  const actionBtn = document.getElementById('fry-action-btn');
  const resultActions = document.getElementById('fry-result-actions');
  const counter = document.getElementById('fry-counter');
  const marker = document.getElementById('fry-marker');
  if (!strip || !tableBadge || !oilBadge) return;

  const station = gameState.fryStation;
  const analysis = analyzeFryStation();
  const matched = analysis.status === 'MATCHED';
  station.matchedRecipe = matched ? analysis.recipe : null;
  const sec = station.frySeconds;
  const frying = station.phase === 'FRYING';
  const prof = fryProfile(station.proteinId);
  const burning = frying && sec >= prof.burn;
  const pid = station.proteinId;
  const needsCut = !!pid && fryProteinNeedsCut(pid);
  const cutting = station.cutState === 'CUTTING';
  const isCut = needsCut && station.cutState === 'CUT';
  const cutDone = fryCutDone(station);
  const staged = stagedOn('frituras');
  const complete = station.phase === 'FRIED' && (staged || matched) && cutDone;
  if (complete && station.readyAt == null) station.readyAt = gameState.gameClock;
  else if (!complete) station.readyAt = null;

  // --- Tabla: la proteína (cruda empanizada / en la olla / frita / cortada) y las guarniciones ---
  const extras = station.ingredients.filter(id => id !== pid && !FRY_BREADING_IDS.includes(id));
  const marksOn = cutting ? Math.min(5, Math.floor(station.cutProgress * 6)) : 0;
  const arrOn = fryNeedsArrange();
  const expandOn = arrOn || (staged && fryCanCut());
  fryBreadUi();
  if (!document.getElementById('fry-pan') || !fryPan().sauce) fryPanRender(); else { const z = document.getElementById('fry-pan-zone'); if (z) z.style.display = staged ? 'block' : 'none'; }
  const stripSig = JSON.stringify([station.kare, arrOn, station.arr || 0, station.phase, pid, station.coat, extras, station.phase === 'FRIED' ? station.fryTone : '', station.cutState, marksOn]);
  if (strip._sig !== stripSig) {
    strip._sig = stripSig;
    let html = '';
    if (arrOn) {
      html += fryArrangeHtml(pid, station.arr || 0);
    } else if (pid && station.phase === 'BUILDING') {
      html += `<span class="fry-board-item" title="Arrástrala a la olla">${fryItemMarkup(pid, station.coat)}</span>`;
    } else if (pid && station.phase === 'FRIED' && isCut) {
      // Filete cortado: 5 rodajas con el color que alcanzó al freírse
      const slices = '<i class="fry-slice"></i>'.repeat(5);
      html += `<span class="fry-slices${station.kp > 0 ? ' has-kare' : ''}" style="--k:${station.kare ? 1 : (station.kp || 0)};--meat:${FRY_MEAT_COLORS[pid] || '#f3e3c0'};filter:${station.fryTone} drop-shadow(0 2px 2px rgba(0,0,0,0.45))">${slices}</span>`;
    } else if (pid && station.phase === 'FRIED') {
      const marks = Array.from({ length: marksOn }, (_, k) => `<i class="fry-cut-mark" style="left:${(k + 1) * 16.6}%"></i>`).join('');
      const oily = staged ? `<i class="fry-sheen"></i><i class="fry-drip d1"></i><i class="fry-drip d2"></i><i class="fry-drip d3"></i>` : '';
      html += `<span class="fry-board-item is-static" style="--oil:${staged ? Math.max(0, 1 - (station.drain || 0)).toFixed(2) : 0};filter:${station.fryTone} drop-shadow(0 2px 2px rgba(0,0,0,0.45))">${fryItemMarkup(pid, station.coat)}${marks}${oily}</span>`;
    }
    html += extras.map(id => {
      const ing = INGREDIENTES.find(i => i.id === id);
      return `<span class="maki-chip" title="${ing ? ing.display : ''}">${ingIconHtml(ing)}</span>`;
    }).join('');
    if (!html) html = `<span class="maki-strip-empty">${staged ? 'Arrastra la proteína a la tabla (o directo a la olla si no se empaniza)' : 'Arrastra la proteína por harina → huevo → panko'}</span>`;
    else if (frying && !extras.length) html = `<span class="maki-strip-empty">La proteína está en la olla…</span>`;
    strip.innerHTML = html;
    const slicesEl = strip.querySelector('.fry-slices');
    if (slicesEl) setTimeout(() => slicesEl.classList.add('spread'), 40); // las rodajas se separan
  }

  const tableCard = document.getElementById('fry-table-card');
  if (tableCard) {
    if (expandOn && !tableCard.classList.contains('fry-expanded')) {      // la tabla crece hasta el centro de la pantalla
      tableCard.style.transform = 'none';
      const r = tableCard.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
      const sc = Math.min(vw * 0.78 / r.width, vh * 0.8 / r.height);
      tableCard.style.transform = `translate(${(vw / 2 - (r.left + r.width / 2)).toFixed(1)}px, ${(vh / 2 - (r.top + r.height / 2)).toFixed(1)}px) scale(${sc.toFixed(3)})`;
    } else if (!expandOn) tableCard.style.transform = '';
    tableCard.classList.toggle('fry-expanded', expandOn);
  }
  tableBadge.classList.remove('status-error', 'status-ready', 'status-warn');
  if (arrOn) {
    tableBadge.textContent = `🍤 Pasada ${Math.min(FRY_ARRANGE[pid].passes, (station.arr || 0) + 1)} de ${FRY_ARRANGE[pid].passes}`;
    tableBadge.classList.add('status-ready');
  } else if (frying) {
    tableBadge.textContent = 'En la olla: retírala a tiempo';
  } else if (station.phase === 'FRIED') {
    if (cutting) {
      tableBadge.textContent = `✂️ Desliza el dedo sobre ella: tajo ${Math.round(station.cutProgress * slashesToCut())}/${slashesToCut()}`;
      tableBadge.classList.add('status-ready');
    } else if (complete) {
      tableBadge.textContent = staged ? (pid === 71 ? '¡Poro frito! Mándalo a Salteado' : ((station.drain || 0) < 1 ? '¡Lista! Escúrrela (sacude ↕) o pásala a emplatar' : '¡Lista! Pásala a emplatar')) : `¡Listo: ${analysis.recipe.name}!`;
      tableBadge.classList.add('status-ready');
    } else if (needsCut && !isCut) {
      tableBadge.textContent = `🔪 Frita — desliza el dedo sobre ella para cortarla (${slashesToCut()} tajos)`;
      tableBadge.classList.add('status-ready');
    } else {
      const falta = (analysis.missing || []).filter(n => !['Harina', 'Huevo', 'Panko'].includes(n));
      tableBadge.textContent = falta.length ? `Cortada — agrega: ${falta.slice(0, 3).join(' · ')}${falta.length > 3 ? '…' : ''}` : 'Agrega las guarniciones';
    }
  } else if (pid && fryNeedsBread()) {
    tableBadge.textContent = fryBreadHint();
    tableBadge.classList.add('status-ready');
  } else if (pid) {
    tableBadge.textContent = '🥖 Lista: arrástrala a la olla';
    tableBadge.classList.add('status-ready');
  } else if (analysis.status === 'EMPTY') {
    tableBadge.textContent = 'Vacío';
  } else {
    tableBadge.textContent = `Armando (${station.ingredients.length})`;
  }

  // --- Olla: la proteína dentro del aceite, con el color que va tomando ---
  const oilCard = document.getElementById('fry-oil-card');
  if (oilVisual) {
    const sig = `${station.phase}_${pid}_${station.coat}_${burning}`;
    if (oilVisual._sig !== sig) {
      oilVisual._sig = sig;
      if (station.phase !== 'FRYING' || !pid) {
        oilVisual.innerHTML = ''; // retirada: la proteína ya volvió a la tabla
      } else {
        const bubbles = frying
          ? '<i class="fry-bubble b1"></i><i class="fry-bubble b2"></i><i class="fry-bubble b3"></i><i class="fry-bubble b4"></i>'
          : '';
        const smoke = burning ? '<span class="fry-smoke">💨</span>' : '';
        oilVisual.innerHTML = `<span class="fry-food">${fryItemMarkup(pid, station.coat)}</span>${bubbles}${smoke}`;
      }
    }
    const foodEl = oilVisual.querySelector('.fry-food');
    if (foodEl) {
      const tone = frying ? fryToneFilter(sec, pid) : station.fryTone;
      foodEl.style.filter = `${tone} drop-shadow(0 2px 2px rgba(0,0,0,0.5))`;
    }
  }
  if (oilCard) {
    oilCard.classList.toggle('is-frying', frying);
    oilCard.classList.toggle('is-burning', burning);
  }

  // Contador: cruda (azul) → lista (verde) → se quema (rojo)
  if (counter) {
    counter.style.display = frying ? 'flex' : 'none';
    counter.classList.toggle('has-thermo', getUpgradeLevel('freidora') > 0);
  }
  if (counter) {
    // Tramos del contador según la proteína: cruda → lista → se quema
    counter.style.setProperty('--raw', (prof.ready / prof.black * 100).toFixed(1));
    counter.style.setProperty('--rdy', ((prof.burn - prof.ready) / prof.black * 100).toFixed(1));
    counter.style.setProperty('--brn', ((prof.black - prof.burn) / prof.black * 100).toFixed(1));
  }
  if (marker) marker.style.left = `${Math.min(100, (sec / prof.black) * 100).toFixed(1)}%`;

  oilBadge.classList.remove('status-error', 'status-ready', 'status-warn');
  if (resultActions) resultActions.style.display = 'none';
  if (actionBtn) actionBtn.style.display = 'none';

  if (station.phase === 'BUILDING') {
    oilBadge.textContent = pid ? 'Arrastra la proteína a la olla' : 'Esperando proteína…';
  } else if (frying) {
    const t = sec.toFixed(1);
    if (sec < prof.ready) {
      oilBadge.textContent = `Friendo… ${t}s`;
    } else if (sec < prof.burn) {
      oilBadge.textContent = `¡Lista! Retírala (${t}s)`;
      oilBadge.classList.add('status-ready');
    } else if (sec < prof.black) {
      oilBadge.textContent = `¡Se quema! ${t}s`;
      oilBadge.classList.add('status-warn');
    } else {
      oilBadge.textContent = `¡Carbonizada! ${t}s`;
      oilBadge.classList.add('status-error');
    }
    if (actionBtn) {
      actionBtn.style.display = 'block';
      actionBtn.textContent = '✋ Retirar';
      actionBtn.className = `fry-action-btn ${burning ? 'zone-quemado' : ''}`;
    }
  } else if (station.phase === 'FRIED') {
    const labelMap = { CRUDO: '🥶 Cruda', PERFECTO: '🔥 ¡Perfecta!', QUEMADO: '💨 Quemada' };
    oilBadge.textContent = `${labelMap[station.fryResult]}`;
    oilBadge.classList.add(station.fryResult === 'PERFECTO' ? 'status-ready' : (station.fryResult === 'CRUDO' ? 'status-error' : 'status-warn'));
    if (resultActions && complete) resultActions.style.display = 'flex';
    const passBtn = document.querySelector('.fry-btn-serve');
    if (passBtn && staged) passBtn.textContent = pid === 71 ? '➡ A Salteado' : '➡ A emplatar';
  }

  // Cuchillo: resaltado cuando hay algo que cortar; barra de avance mientras corta.
  const knifeEl = document.getElementById('fry-tool-knife');
  if (knifeEl) knifeEl.classList.toggle('is-ready', fryCanCut());
  const cutBox = document.getElementById('fry-cut-progress');
  const cutFill = document.getElementById('fry-cut-fill');
  if (cutBox) cutBox.style.display = cutting ? 'block' : 'none';
  if (cutFill) cutFill.style.width = `${Math.round(station.cutProgress * 100)}%`;
  fryUpdateFireUi();
  syncStationIfChanged('frituras');
  if (station.phase !== 'FRYING') updateServeButtonsQuality();
  updateAreaTabAlerts();
}
