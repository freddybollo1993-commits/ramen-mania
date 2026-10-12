// ===== Producción de Frituras: mandolina (rallar) y armado de gyozas =====
// Dos modos de la tabla de Producción (se cargan después del script principal; usan stShopStart / stRenderShop de index.html):
//  · 'grate' (col, zanahoria, betarraga): el alimento se pasa en diagonal, de ida y vuelta, sobre una mandolina; los hilos van cayendo poco a poco a la pila.
//  · 'fold'  (gyozas): masa redonda → relleno al centro → dedo mojado en huevo por todo el borde → pinza de 2 dedos, 4 tiempos → gyoza lista para freír.

const FR_STROKE_MIN = 40;                 // px a lo largo de la mandolina para que cuente una pasada
const FR_GRATE_STROKES = 4;               // pasadas = 1 porción
const FR_AXIS = { x: Math.cos(-30 * Math.PI / 180), y: Math.sin(-30 * Math.PI / 180) };      // la mandolina sube hacia la derecha (30°)
const FR_VEG = { 52: '#d7ecb0', 30: '#f6a24a', 42: '#b02f78' };                              // color de los hilos de col, zanahoria y betarraga
const FR_PINCHES = 4;                     // «tiempos» de pinza
const FR_STEPS = ['dough', 'fill', 'egg', 'pinch'];
const frActive = () => typeof stagedOn === 'function' && stagedOn('frituras') && gameState.activeArea === 'frituras' && getStage('frituras') === 'prod';
const frBoard = () => { const b = stGet('frituras').board; return (b && (b.mode === 'grate' || b.mode === 'fold')) ? b : null; };
const frToast = (m, err) => { try { showStationToast(m); if (err) playSound('error'); } catch (e) {} };

// ---------- mandolina ----------
function frStartGrate(area, st, p) {
  if (st.stock[p.key] >= p.max) { frToast(`${p.label}: el depósito ya está lleno.`, true); return; }
  st.board = { key: p.key, taps: 0, mode: 'grate', strokes: 0 };
  frToast(`🧀 ${p.label}: pasa el alimento en diagonal, de ida y vuelta, sobre la mandolina.`);
  try { playSound('add'); } catch (e) {}
  stRenderIfOpen(area);
  updateAreaTabAlerts();
}
function frGrateHtml(p, b) {
  const left = 1 - (b.strokes % FR_GRATE_STROKES) / FR_GRATE_STROKES;
  return `<div class="fr-wrap" id="fr-wrap">
    <div class="fr-mando" id="fr-mando" data-fr="mando"><i class="fr-slot"></i><i class="fr-blade"></i>
      <div class="fr-veg" id="fr-veg" style="scale:${(0.45 + 0.55 * left).toFixed(2)}">${stIngIconRaw(p.icon)}</div></div>
    <div class="fr-hint">↗ ↙ en diagonal sobre la mandolina</div>
  </div>`;
}
function frGrateHint(p) { return `Pasa ${p.label.toLowerCase()} en diagonal sobre la mandolina (↗ ↙): ${FR_GRATE_STROKES} pasadas = 1 porción; los hilos van cayendo a la pila.`; }
function frGrateFx(p) {
  const blade = document.querySelector('#fr-mando .fr-blade'), pile = document.getElementById('shop-pile');
  if (!blade) return;
  const r = blade.getBoundingClientRect(), pr = pile ? pile.getBoundingClientRect() : r;
  const col = FR_VEG[p.icon] || '#d7ecb0';
  for (let k = 0; k < 7; k++) {
    const t = document.createElement('i');
    t.className = 'fr-thread';
    t.style.cssText = `left:${(r.left + r.width / 2 + (k - 3) * 5).toFixed(0)}px;top:${(r.top + r.height / 2).toFixed(0)}px;background:${col};rotate:${(k * 37) % 90 - 45}deg`;
    document.body.appendChild(t);
    const dx = (pr.left + pr.width / 2) - (r.left + r.width / 2) + (k - 3) * 4, dy = (pr.top + pr.height * 0.6) - (r.top + r.height / 2);
    const an = t.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${(dx * 0.5).toFixed(0)}px, ${(dy * 0.4).toFixed(0)}px)`, opacity: 1, offset: 0.4 }, { transform: `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px)`, opacity: 0.2 }], { duration: 560 + k * 40, easing: 'ease-in', delay: k * 25 });
    an.onfinish = () => t.remove();
    setTimeout(() => t.remove(), 1100);
  }
}
function frGrateStroke() {
  const area = stShopArea(), st = stGet(area), b = st.board;
  if (!b || b.mode !== 'grate') return;
  const p = stProdOf(area, b.key);
  b.strokes++;
  try { sfxEvery('swish', 90); } catch (e) {}
  frGrateFx(p);
  const veg = document.getElementById('fr-veg');
  if (veg) { veg.style.scale = (0.45 + 0.55 * (1 - (b.strokes % FR_GRATE_STROKES) / FR_GRATE_STROKES)).toFixed(2); }
  if (b.strokes % FR_GRATE_STROKES === 0) {
    st.stock[p.key] = Math.min(p.max, st.stock[p.key] + 1);
    try { playSound('stock_add'); } catch (e) {}
    const board = document.getElementById('shop-board');
    if (board) { const plus = document.createElement('b'); plus.className = 'cut-plus'; plus.textContent = '+1'; board.appendChild(plus); setTimeout(() => plus.remove(), 850); }
    shopUpdateCount(p);
    const pl = document.getElementById('shop-pile'); if (pl) pl.innerHTML = shopPileHtml(p, st.stock[p.key]);
    if (veg) { veg.classList.remove('pop'); void veg.offsetWidth; veg.classList.add('pop'); }
    if (st.stock[p.key] >= p.max) { st.board = null; frToast(`🧀 ${p.label}: depósito lleno.`); setTimeout(() => { stRenderIfOpen(area); renderStageTabs(); }, 500); return; }
  }
  const lab = document.getElementById('shop-board-label'); if (lab) lab.textContent = shopBoardLabelText(st, p);
}

// ---------- gyozas ----------
function frStartFold(area, st, p) {
  if (st.stock[p.key] >= p.max) { frToast(`${p.label}: el depósito ya está lleno.`, true); return; }
  if ((st.stock.relleno || 0) < 1) { frToast('🥟 No hay relleno de gyoza: pícalo y márinalo primero.', true); return; }
  st.board = { key: p.key, taps: 0, mode: 'fold', step: 'dough', egg: 0, pinch: 0, filled: false };
  frToast('🥟 Elige la masa: queda lista y redonda sobre la tabla.');
  try { playSound('add'); } catch (e) {}
  stRenderIfOpen(area);
  updateAreaTabAlerts();
}
function frFoldAbort(st) {                             // si se sale a medias, el relleno ya puesto se devuelve
  const b = st.board;
  if (b && b.mode === 'fold' && b.filled && b.step !== 'done') { st.stock.relleno = (st.stock.relleno || 0) + 1; b.filled = false; }
}
function frFoldHint(b) {
  return b.step === 'dough' ? 'Toca la masa para ponerla sobre la tabla.'
    : b.step === 'fill' ? 'Arrastra el relleno hasta el centro de la masa.'
    : b.step === 'egg' ? 'Moja el dedo en el huevo y pásalo por todo el borde de la masa: queda pegajoso.'
    : `Pinza: pon 2 dedos en lados opuestos y júntalos hacia el centro. Tiempo ${Math.min(FR_PINCHES, b.pinch + 1)} de ${FR_PINCHES}.`;
}
function frFoldSvg(b) {
  const f = b.pinch / FR_PINCHES, sy = 1 - 0.5 * f;                            // al cerrar, el círculo se pliega a media luna
  const pleats = Array.from({ length: Math.round(f * 10) }, (_, i) => { const a = Math.PI + (i + 0.5) / 10 * Math.PI, x = 50 + 36 * Math.cos(a), y = 50 + 36 * sy * Math.sin(a) + 4; return `<path d="M ${x.toFixed(1)},${(y + 4).toFixed(1)} l ${(3 * Math.cos(a)).toFixed(1)},${(3 * sy * Math.sin(a) - 2).toFixed(1)}" stroke="#c9b27a" stroke-width="1.6" stroke-linecap="round"/>`; }).join('');
  const dough = b.step === 'dough' ? '' : `<g id="fr-dg" style="transform-origin:50% 50%;transform:scaleY(${sy.toFixed(3)})"><circle cx="50" cy="50" r="38" fill="#f7ecd0" stroke="#d9c590" stroke-width="2.2"/><circle cx="50" cy="50" r="33" fill="none" stroke="#fff6e0" stroke-width="1" opacity="0.7"/></g>`;
  const filling = (b.filled && b.pinch < FR_PINCHES) ? `<g style="transform-origin:50% 50%;transform:scaleY(${sy.toFixed(3)})"><ellipse cx="50" cy="50" rx="${(15 - 4 * f).toFixed(1)}" ry="12" fill="#c98a6a" stroke="#8a5238" stroke-width="1.2"/><circle cx="46" cy="47" r="2.2" fill="#e8b79c"/><circle cx="55" cy="52" r="2" fill="#7a9a4a"/><circle cx="51" cy="44" r="1.8" fill="#f2d4b8"/></g>` : '';
  const ring = (b.step === 'egg' || b.step === 'pinch') ? `<circle id="fr-eggring" cx="50" cy="50" r="35.5" fill="none" stroke="#ffd54f" stroke-width="4" stroke-linecap="round" pathLength="100" stroke-dasharray="${Math.min(100, b.egg * 100).toFixed(1)} 100" transform="rotate(-90 50 50)" opacity="0.85"/>` : '';
  return `<svg class="fr-svg" id="fr-fsvg" viewBox="0 0 100 100" aria-hidden="true">${dough}${ring}${filling}${b.step === 'pinch' ? `<g id="fr-pleats">${pleats}</g>` : ''}</svg>`;
}
function frFoldHtml(p, b, st) {
  const chips = FR_STEPS.map((s, i) => `<span class="${FR_STEPS.indexOf(b.step) > i ? 'done' : (b.step === s ? 'cur' : '')}">${['①', '②', '③', '④'][i]}</span>`).join('');
  return `<div class="fr-wrap fr-fold" id="fr-wrap">
    <div class="fr-steps">${chips}</div>
    <div class="fr-stage" id="fr-dough" data-fr="dough">${frFoldSvg(b)}${b.step === 'dough' ? '<button class="fr-masa" data-fr="masa">🫓 Masa</button>' : ''}</div>
    <div class="fr-bowls">
      <div class="fr-bowl ${b.step === 'fill' ? 'hot' : ''}" id="fr-filling" data-fr="filling" title="Relleno de gyoza"><span>🥟</span><small>Relleno ×${st.stock.relleno || 0}</small></div>
      <div class="fr-bowl ${b.step === 'egg' ? 'hot' : ''}" id="fr-egg" data-fr="egg" title="Huevo"><span>🥚</span><small>Huevo</small></div>
      ${b.step === 'pinch' ? '<button class="fp-btn fr-pinch-btn" data-fr="pinchbtn">🤏 Pellizcar</button>' : ''}
    </div>
  </div>`;
}
function frFoldUi() {
  const st = stGet('frituras'), b = st.board;
  if (!b || b.mode !== 'fold') return;
  const p = stProdOf('frituras', b.key);
  const ring = document.getElementById('fr-eggring'); if (ring) ring.setAttribute('stroke-dasharray', `${Math.min(100, b.egg * 100).toFixed(1)} 100`);
  const lab = document.getElementById('shop-board-label'); if (lab) lab.textContent = shopBoardLabelText(st, p);
  const hint = document.querySelector('.fp-head small'); if (hint) hint.textContent = frFoldHint(b);
}
function frFoldGoto(step) { const st = stGet('frituras'), b = st.board; if (!b) return; b.step = step; stRenderIfOpen('frituras'); }
function frFoldPinch() {
  const area = 'frituras', st = stGet(area), b = st.board;
  if (!b || b.mode !== 'fold' || b.step !== 'pinch') return;
  b.pinch++;
  try { playSound('click'); } catch (e) {}
  if (b.pinch >= FR_PINCHES) {
    const p = stProdOf(area, b.key);
    st.stock[p.key] = Math.min(p.max, st.stock[p.key] + 1);
    try { playSound('match'); } catch (e) {}
    frToast('🥟 ¡Gyoza lista para cocinarse!');
    b.step = 'dough'; b.egg = 0; b.pinch = 0; b.filled = false;
    if (st.stock[p.key] >= p.max || (st.stock.relleno || 0) < 1) { st.board = null; frToast(st.stock[p.key] >= p.max ? '🥟 Gyozas: depósito lleno.' : '🥟 Ya no queda relleno: pica y marina más.'); }
    setTimeout(() => { stRenderIfOpen(area); renderStageTabs(); updateAreaTabAlerts(); }, 350);
    return;
  }
  const g = document.getElementById('fr-fsvg');
  if (g) { const tmp = document.createElement('div'); tmp.innerHTML = frFoldSvg(b); g.replaceWith(tmp.firstElementChild); }
  frFoldUi();
}

// ---------- gestos ----------
let frG = null;                                         // gesto en curso: 'grate' (un dedo) · 'egg' (un dedo) · 'drag' (relleno)
const frPointers = new Map();                           // pinza: pointerId -> {x, y}
function frGEnd() {
  document.removeEventListener('pointermove', frGMove); document.removeEventListener('pointerup', frGUp); document.removeEventListener('pointercancel', frGUp);
  if (frG && frG.ghost) frG.ghost.remove();
  frG = null;
}
function frGStart(e, kind, extra) {
  frGEnd();
  frG = Object.assign({ kind, id: e.pointerId, ext: 0, dir: 0, n: 0, last: null, covered: 0 }, extra || {});
  document.addEventListener('pointermove', frGMove); document.addEventListener('pointerup', frGUp); document.addEventListener('pointercancel', frGUp);
}
function frGMove(e) {
  const g = frG;
  if (!g || e.pointerId !== g.id) return;
  const b = frBoard();
  if (!b) { frGEnd(); return; }
  if (g.kind === 'grate' && b.mode === 'grate') {
    const s = e.clientX * FR_AXIS.x + e.clientY * FR_AXIS.y;                         // posición a lo largo de la mandolina
    if (g.n === 0 && g.dir === 0) { g.ext = s; g.dir = 0.0001; g.n = 1; g.origin = s; return; }
    const d = s - g.ext;
    if (g.dir === 0.0001) { if (Math.abs(d) >= FR_STROKE_MIN) { g.dir = Math.sign(d); g.ext = s; frGrateStroke(); } }
    else if (d * g.dir > 0) g.ext = s;
    else if (-d * g.dir >= FR_STROKE_MIN) { g.dir = -g.dir; g.ext = s; frGrateStroke(); }
    const veg = document.getElementById('fr-veg');                                    // el alimento sigue al dedo a lo largo de la mandolina
    if (veg && g.origin != null) veg.style.translate = Math.max(-46, Math.min(46, s - g.origin)) + 'px 0';
  } else if (g.kind === 'egg' && b.mode === 'fold' && b.step === 'egg') {
    const dough = document.getElementById('fr-dough'); if (!dough) return;
    const r = dough.getBoundingClientRect(), R = Math.min(r.width, r.height) / 2 * 0.76, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy), a = Math.atan2(e.clientY - cy, e.clientX - cx);
    if (dist >= R * 0.6 && dist <= R * 1.3) {                                         // el dedo (mojado) va por el borde
      if (g.last != null) { let d = a - g.last; if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI; b.egg = Math.min(1, b.egg + Math.abs(d) / (2 * Math.PI) * 1.02); frFoldUi(); }
      g.last = a;
      if (b.egg >= 0.97) { b.egg = 1; try { playSound('match'); } catch (err) {} frToast('🥚 Borde pegajoso. Ahora la pinza: 2 dedos, 4 tiempos.'); frGEnd(); frFoldGoto('pinch'); }
    } else g.last = null;
  } else if (g.kind === 'drag' && g.ghost) {
    g.ghost.style.transform = `translate(${e.clientX}px, ${e.clientY - 24}px) translate(-50%, -50%)`;
  }
}
function frGUp(e) {
  const g = frG;
  if (!g || e.pointerId !== g.id) return;
  const kind = g.kind, b = frBoard();
  frGEnd();
  if (kind === 'drag' && b && b.mode === 'fold' && b.step === 'fill' && e.type === 'pointerup') {
    const dough = document.getElementById('fr-dough');
    if (dough) {
      const r = dough.getBoundingClientRect(), x = e.clientX, y = e.clientY - 24;
      if (x >= r.left + r.width * 0.2 && x <= r.right - r.width * 0.2 && y >= r.top + r.height * 0.2 && y <= r.bottom - r.height * 0.2) {
        const st = stGet('frituras');
        if ((st.stock.relleno || 0) < 1) { frToast('🥟 No queda relleno.', true); return; }
        st.stock.relleno--; b.filled = true;
        try { playSound('splash'); } catch (err) {}
        frFoldGoto('egg');
      } else frToast('🥟 Suelta el relleno en el centro de la masa.');
    }
  }
}
document.addEventListener('pointerdown', (e) => {
  if (!frActive() || !e.target.closest) return;
  const b = frBoard(); if (!b) return;
  const t = e.target;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (gameState.isPaused || gameState.isGameOver) return;
  if (b.mode === 'grate') {
    if (t.closest('#fr-mando, #fr-wrap')) { e.preventDefault(); frGStart(e, 'grate'); }
    return;
  }
  // gyozas
  if (t.closest('[data-fr="masa"]')) { e.preventDefault(); if (b.step === 'dough') { try { playSound('add'); } catch (err) {} frFoldGoto('fill'); } return; }
  if (t.closest('[data-fr="pinchbtn"]')) { e.preventDefault(); frFoldPinch(); return; }
  if (b.step === 'fill' && t.closest('[data-fr="filling"]')) {
    e.preventDefault();
    frGStart(e, 'drag');
    const gh = document.createElement('div'); gh.className = 'mk2-ghost'; gh.innerHTML = '<span style="font-size:34px">🥟</span>'; document.body.appendChild(gh); frG.ghost = gh;
    gh.style.transform = `translate(${e.clientX}px, ${e.clientY - 24}px) translate(-50%, -50%)`;
    return;
  }
  if (b.step === 'egg' && t.closest('[data-fr="egg"]')) { e.preventDefault(); frGStart(e, 'egg'); try { playSound('splash'); } catch (err) {} frToast('🥚 Dedo mojado en huevo: pásalo por todo el borde de la masa.'); return; }
  if (b.step === 'egg' && t.closest('#fr-dough')) { e.preventDefault(); frGStart(e, 'egg'); return; }          // si ya traía el dedo mojado, también vale empezar sobre la masa
  if (b.step === 'pinch' && t.closest('#fr-dough')) {
    e.preventDefault();
    frPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (frPointers.size === 2) { const [a, c] = [...frPointers.values()]; frPinch = { d0: Math.hypot(a.x - c.x, a.y - c.y), armed: true }; }
  }
}, { passive: false });
let frPinch = null;
document.addEventListener('pointermove', (e) => {
  if (!frPointers.has(e.pointerId)) return;
  frPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const b = frBoard();
  if (!b || b.mode !== 'fold' || b.step !== 'pinch' || frPointers.size < 2 || !frPinch) return;
  const dough = document.getElementById('fr-dough'); if (!dough) return;
  const R = Math.min(dough.getBoundingClientRect().width, dough.getBoundingClientRect().height) / 2;
  const [a, c] = [...frPointers.values()], d = Math.hypot(a.x - c.x, a.y - c.y);
  if (frPinch.armed && frPinch.d0 >= R * 0.9 && d <= frPinch.d0 * 0.3) { frPinch.armed = false; frFoldPinch(); }   // los dos dedos se juntaron hacia el mismo punto
  else if (!frPinch.armed && d >= frPinch.d0 * 0.7) { frPinch.armed = true; }
}, { passive: true });
const frPointerUp = (e) => { frPointers.delete(e.pointerId); if (frPointers.size < 2) frPinch = null; };
document.addEventListener('pointerup', frPointerUp, { passive: true });
document.addEventListener('pointercancel', frPointerUp, { passive: true });

// ---------- estilos ----------
(function frInjectCss() {
  const css = `
  .fr-wrap { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; touch-action: none; user-select: none; -webkit-user-select: none; }
  .fr-mando { position: relative; width: 62%; height: 40px; transform: rotate(-30deg); border-radius: 8px; border: 2.5px solid #5a6672; background: linear-gradient(#cfd8df, #9aa7b2 55%, #7d8995); box-shadow: 0 6px 10px rgba(0,0,0,0.45); touch-action: none; cursor: grab; }
  .fr-slot { position: absolute; left: 8%; right: 8%; top: 40%; height: 7px; border-radius: 4px; background: #28313a; }
  .fr-blade { position: absolute; left: 40%; top: 6%; bottom: 6%; width: 5px; background: linear-gradient(#fff, #b9c4cd); border-radius: 2px; box-shadow: 0 0 5px #fff; }
  .fr-veg { position: absolute; left: 8%; top: -34px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 34px; pointer-events: none; transition: scale 0.15s; filter: drop-shadow(0 3px 3px rgba(0,0,0,0.5)); }
  .fr-veg .ing-ico, .fr-veg img { width: 100%; height: 100%; object-fit: contain; }
  .fr-veg.pop { animation: cbPop 0.3s ease-out; }
  .fr-hint { position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; font-size: 10px; font-weight: 800; color: #fff; text-shadow: 0 1px 3px #000; pointer-events: none; }
  .fr-thread { position: fixed; z-index: 9400; width: 9px; height: 1.8px; border-radius: 1px; pointer-events: none; }
  .fr-fold { gap: 14px; }
  .fr-stage { position: relative; height: 92%; aspect-ratio: 1; }
  .fr-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .fr-svg g { transition: transform 0.25s ease-out; }
  .fr-masa { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 10px 14px; font-size: 14px; font-weight: 900; border-radius: 50%; border: 3px solid #d9c590; background: #f7ecd0; color: #6d4c1f; box-shadow: 0 4px 8px rgba(0,0,0,0.5); animation: mkPulse 1s ease-out infinite; touch-action: none; }
  .fr-steps { position: absolute; left: 8px; top: 6px; display: flex; flex-direction: column; gap: 3px; }
  .fr-steps span { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; background: rgba(0,0,0,0.4); color: #fff; border: 1px solid #5d4037; }
  .fr-steps span.cur { border-color: #ffd54f; box-shadow: 0 0 6px #ffd54f; } .fr-steps span.done { background: #2e7d32; border-color: #9ccc65; }
  .fr-bowls { display: flex; flex-direction: column; gap: 6px; align-items: center; }
  .fr-bowl { width: 64px; padding: 5px 4px; border-radius: 12px; border: 2px dashed #8d6e63; background: rgba(60,30,22,0.55); text-align: center; color: #ffe0b2; touch-action: none; cursor: grab; }
  .fr-bowl span { font-size: 24px; line-height: 1; display: block; } .fr-bowl small { font-size: 9px; font-weight: 800; }
  .fr-bowl.hot { border-style: solid; border-color: #ffd54f; background: rgba(120,80,30,0.7); animation: mkPulse 1s ease-out infinite; }
  .fr-pinch-btn { font-size: 11px; }
  `;
  const el = document.createElement('style'); el.textContent = css; document.head.appendChild(el);
})();
