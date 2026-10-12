// ===== Makis con etapas: estudio de cocina =====
// Armar el maki en la esterilla (arroz → extender con gestos → nori → rellenos en cualquier orden), enrollarlo en vista lateral con 3 gestos medidos
// (enrollar / apretar ×3), dejarlo en la tabla (hasta 3 a la vez) y terminarlo: cobertura (cortada del pescado en su propia tabla), flamear, apretar y cortar.
// Para terminar un maki se reutiliza la estación de siempre (cobertura, flameado, tajos y paso a Emplatar); aquí vive todo lo anterior.
// Se carga después del script principal: usa sus funciones y constantes (gameState, stCookTake, makiCatalog, slashFx…).

const MK_FILLS = [64, 54, 39, 47, 72, 59];            // rellenos que van dentro del rollo (palta, ebi, atún, cecina, queso crema, hilos de wantán)
const MK_SLOTS = 3;                                    // makis enrollados que pueden esperar a la vez en la tabla
const MK_SPREAD_STROKES = 4, MK_STROKE_MIN = 30;       // pasadas por eje al extender el arroz (primero a los lados, luego hacia abajo)
const MK_STEPS = ['roll', 'press', 'roll', 'press', 'roll', 'press'];
const MK_ROLL_SPEED = { lo: 0.5, hi: 1.4 };            // px/ms: zona verde del gesto de enrollar
const MK_CUT_SPEED = { lo: 0.45, hi: 1.2 };            // px/ms: zona verde del corte del pescado
const MK_BAR_MAX = 3;                                  // px/ms al final de la barra de precisión
const MK_FISH = {                                      // pescados que se cortan en su tabla → cobertura
  110: { name: 'Atún', cover: 49, color: '#d63a56', hi: '#f08a9a', fiber: '#f7a6b3', take: 39, icon: '🐟' },
  111: { name: 'Conchas de abanico', cover: 50, color: '#f3e8d6', hi: '#ffffff', fiber: '#d9c7a8', take: null, icon: '🦪' }
};
const MK_FISH_CUTS = 3;                                // cortes por pieza de pescado = coberturas que rinde

const mkStaged = () => typeof stagedOn === 'function' && stagedOn('makis');
const mkActive = () => mkStaged() && gameState.activeArea === 'makis' && getStage('makis') === 'cook';
function mkNewBuild() { return { matPlaced: false, rice: false, sx: 0, sy: 0, nori: false, fills: [], rolling: false, step: 0, qs: [] }; }
function mkGet() {
  if (!gameState.mk) gameState.mk = { build: mkNewBuild(), slots: [null, null, null], sel: -1, fish: null, cobQ: {}, uid: 1 };
  return gameState.mk;
}
const mkQ = (v, band) => v <= 0 ? 0 : (v < band.lo ? Math.max(0, v / band.lo) : (v > band.hi ? Math.max(0, band.hi / v) : 1));   // calidad 0-1 según qué tan cerca de la zona verde
const mkSet = a => [...new Set(a)].sort((x, y) => x - y).join(',');
const mkCatalog = () => (typeof makiCatalog === 'function' ? makiCatalog() : []);
function mkBaseGroups(fills) {                         // recetas cuyo relleno es EXACTAMENTE este conjunto (sin importar el orden)
  if (!fills.length) return [];
  const k = mkSet(fills);
  return mkCatalog().filter(g => mkSet(g.ingredients.filter(id => MK_FILLS.includes(id))) === k);
}
function mkAllowFill(fills, id) {                      // ¿hay alguna receta que lleve estos rellenos juntos?
  const next = [...fills, id];
  return mkCatalog().some(g => { const gf = g.ingredients.filter(x => MK_FILLS.includes(x)); return next.every(x => gf.includes(x)); });
}
const mkRiceDone = b => b.rice && b.sx >= 1 && b.sy >= 1;
const mkCanRoll = b => b.matPlaced && mkRiceDone(b) && b.nori && mkBaseGroups(b.fills).length > 0;
const mkFreeSlot = mk => mk.slots.findIndex(s => !s);
const mkIcon = id => (typeof stIngIcon === 'function' ? stIngIcon(id) : '');
const mkName = id => (typeof stIngName === 'function' ? stIngName(id) : String(id));
function mkToast(msg, err) { try { showStationToast(msg); if (err) playSound('error'); } catch (e) {} }

// ---------- rejilla de ayudas (checklist del armado) ----------
function mkChecklist(b) {
  const done = [b.matPlaced, mkRiceDone(b), b.nori, mkCanRoll(b)];
  const labels = ['🎍', '🍚', '🟩', '🥑'], titles = ['Esterilla', 'Arroz y extenderlo', 'Nori', 'Rellenos'];
  const cur = done.findIndex(d => !d);
  return '<div class="mk2-chk">' + labels.map((l, i) => `<span class="${done[i] ? 'done' : (i === cur ? 'cur' : '')}" title="${titles[i]}">${l}</span>`).join('') + '</div>';
}
function mkHint(mk) {
  const b = mk.build;
  if (mk.fish && mk.fish.open) return 'Gira el pescado hasta que sus fibras queden en ángulo recto con tu tajo y corta con un movimiento firme: ni muy rápido ni muy suave.';
  if (mk.sel >= 0) return 'Cobertura desde la despensa · 🤏 Apretar · desliza el dedo sobre el maki para cortarlo · salsa y flameado, en Emplatar.';
  if (b.rolling) return MK_STEPS[b.step] === 'roll' ? 'Enrolla: desliza hacia arriba, ni muy rápido ni muy lento (zona verde).' : 'Ahora 🤏 Apretar el rollo.';
  if (!b.matPlaced) return 'Arrastra la esterilla hasta la tabla.';
  if (!b.rice) return 'Arrastra el arroz shari desde la despensa a la esterilla.';
  if (b.sx < 1) return 'Extiende el arroz con gestos cortos hacia los lados (derecha e izquierda).';
  if (b.sy < 1) return 'Ahora extiéndelo con gestos hacia abajo, hasta el borde de la esterilla.';
  if (!b.nori) return 'Arrastra el nori sobre el arroz.';
  if (!b.fills.length) return 'Elige los rellenos (el orden no importa) y pulsa Enrollar.';
  return mkCanRoll(b) ? 'Rellenos listos: pulsa Enrollar.' : 'Esos rellenos no forman ninguna receta: quita o agrega alguno.';
}

// ---------- vistas ----------
function mkLayersHtml(b) {
  let h = '';
  if (b.rice) { const r = mkRiceGeom(b); h += `<rect id="mk2-rice" class="mk2-rice" style="x:${r.x}px;y:${r.y}px;width:${r.w}px;height:${r.h}px" rx="7" fill="#f7f4e8" stroke="#cfc8a8" stroke-width="1.5"/><rect id="mk2-grain" style="x:${r.x}px;y:${r.y}px;width:${r.w}px;height:${r.h}px" rx="7" fill="url(#mk2Grain)"/>`; }
  if (b.nori) h += `<g class="mk-layer enter"><rect x="54" y="18" width="192" height="64" rx="3" fill="#1d2f23" stroke="#0a120d" stroke-width="1.2"/><g stroke="#4a6a50" stroke-opacity="0.35" stroke-width="1"><path d="M60,30 L238,28"/><path d="M60,44 L238,46"/><path d="M60,58 L238,56"/><path d="M60,70 L238,72"/></g></g>`;
  let k = 0;
  b.fills.forEach(id => { h += makiLayerMarkup(id, k, true); k++; });
  return h;
}
function mkRiceGeom(b) { const w = 36 + 172 * Math.min(1, b.sx), hh = 22 + 58 * Math.min(1, b.sy); return { x: 150 - w / 2, y: 12, w, h: hh }; }
function mkBoardHtml(mk) {
  const b = mk.build;
  const mat = b.matPlaced
    ? `<rect x="30" y="4" width="240" height="92" rx="5" fill="#d9b36a" stroke="#8a6a2a" stroke-width="2"/><g stroke="#b8914a" stroke-width="1.2">${Array.from({ length: 19 }, (_, i) => `<path d="M ${42 + i * 12},6 V 94"/>`).join('')}</g><path d="M30,24 H270 M30,76 H270" stroke="#7a5a22" stroke-width="1.4"/>`
    : '';
  const tool = b.matPlaced ? '' : `<div class="mk2-mat-tool" id="mk2-mat-tool" data-mk="mat"><span>🎍</span><b>Esterilla</b><small>arrástrala a la tabla</small></div>`;
  const chips = b.fills.map(id => `<span class="fp-chip" data-mk-chip="${id}" title="Quitar ${mkName(id)}">${mkIcon(id)}</span>`).join('');
  return `<div class="mk2-board mk2-drop" id="mk2-board" data-mk="board">
    <svg class="mk2-svg" viewBox="0 0 300 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs><pattern id="mk2Grain" patternUnits="userSpaceOnUse" width="9" height="7"><ellipse cx="2.2" cy="2" rx="1.7" ry="1" fill="#e4dec6" transform="rotate(20 2.2 2)"/><ellipse cx="6.6" cy="5" rx="1.7" ry="1" fill="#e4dec6" transform="rotate(-25 6.6 5)"/><ellipse cx="5.8" cy="1.6" rx="1.2" ry="0.8" fill="#ffffff" opacity="0.9"/></pattern></defs>
      ${mat}<g id="mk2-layers">${mkLayersHtml(b)}</g>
    </svg>${tool}
    <div class="mk2-chips">${chips}</div>
  </div>`;
}
// vista lateral para enrollar: de la esterilla plana al rollo cerrado (arroz por fuera, nori y rellenos dentro)
function mkRollGeom(t, nFill) {
  const L = (a, b) => a + (b - a) * t;
  return { rice: { x: L(50, 112), y: L(96, 44), w: L(200, 76), h: L(16, 76), rx: L(4, 38) },
    nori: { x: L(56, 121), y: L(92, 53), w: L(188, 58), h: L(5, 58), rx: L(2, 29), sw: L(0, 6), fo: 1 - t },
    fills: Array.from({ length: nFill }, (_, i) => { const a = (i / Math.max(1, nFill)) * 6.2832; return { cx: L(100 + (nFill > 1 ? i * (100 / (nFill - 1)) : 50), 150 + Math.cos(a) * 9), cy: L(86, 82 + Math.sin(a) * 9), r: L(6, 7) }; }) };
}
function mkRollSvg(b) {
  const done = Math.ceil(b.step / 2), t = Math.min(1, done / 3), g = mkRollGeom(t, b.fills.length);
  const fills = g.fills.map((f, i) => `<circle class="mk2-rf" data-i="${i}" style="cx:${f.cx}px;cy:${f.cy}px;r:${f.r}px" fill="${MAKI_FILL_COLORS[b.fills[i]] || '#f08a3c'}" stroke="#2b2118" stroke-width="1"/>`).join('');
  return `<svg class="mk2-svg" viewBox="0 0 300 140" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <rect id="mk2-r-mat" class="mk2-morph" x="30" y="112" width="240" height="14" rx="4" fill="#d9b36a" stroke="#8a6a2a" stroke-width="2" style="opacity:${(1 - 0.6 * t).toFixed(2)}"/>
    <rect id="mk2-r-rice" class="mk2-morph" style="x:${g.rice.x}px;y:${g.rice.y}px;width:${g.rice.w}px;height:${g.rice.h}px;rx:${g.rice.rx}px" fill="#f7f4e8" stroke="#cfc8a8" stroke-width="1.6"/>
    <rect id="mk2-r-nori" class="mk2-morph" style="x:${g.nori.x}px;y:${g.nori.y}px;width:${g.nori.w}px;height:${g.nori.h}px;rx:${g.nori.rx}px;stroke-width:${g.nori.sw}px;fill-opacity:${g.nori.fo}" fill="#1d2f23" stroke="#14201a"/>
    <g id="mk2-r-fills" class="mk2-morph">${fills}</g>
  </svg>`;
}
const mkBarHtml = (band, id) => `<div class="mk2-bar" id="${id}"><u class="band" style="left:${band.lo / MK_BAR_MAX * 100}%;width:${(band.hi - band.lo) / MK_BAR_MAX * 100}%"></u><b class="mark"></b></div>`;
function mkRollViewHtml(mk) {
  const b = mk.build;
  return `<div class="mk2-board mk2-rollview" id="mk2-roll" data-mk="roll">
    ${mkRollSvg(b)}
    <div class="mk2-bar-wrap"><small id="mk2-bar-txt">${MK_STEPS[b.step] === 'roll' ? '↑ Desliza hacia arriba' : '🤏 Aprieta'}</small>${mkBarHtml(MK_ROLL_SPEED, 'mk2-bar')}</div>
  </div>`;
}
function mkFishSvg(f) {
  const L = Math.max(30, 124 - f.cuts.length * (124 * 0.22)), H = 44, fb = MK_FISH[f.id];
  let fibers = '';
  for (let y = -H / 2 + 5; y < H / 2 - 3; y += 5) fibers += `<path d="M ${-L / 2 + 7},${y} q ${L / 4},${(y % 2 ? 2 : -2)} ${L / 2 - 7},0 t ${L / 2 - 7},0" fill="none" stroke="${fb.fiber}" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>`;
  const slices = f.cuts.map((c, i) => `<g transform="translate(${236 + (i % 3) * 16} ${92 - Math.floor(i / 3) * 14}) rotate(${i * 9 - 8})"><ellipse rx="9" ry="5.5" fill="${fb.color}" stroke="#2b2118" stroke-width="1" opacity="${(0.45 + 0.55 * c.q).toFixed(2)}"/><path d="M -5,-1 q 5,-3 10,0" fill="none" stroke="${fb.hi}" stroke-width="1.2"/></g>`).join('');
  return `<svg class="mk2-svg" id="mk2-fishsvg" viewBox="0 0 300 140" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <circle cx="150" cy="70" r="64" fill="none" stroke="#ffe082" stroke-width="2.4" stroke-dasharray="5 5" opacity="0.7" data-mk="ring"/>
    <circle cx="150" cy="70" r="64" fill="none" stroke="transparent" stroke-width="22" data-mk="ring" style="cursor:grab"/>
    <g id="mk2-fishg" transform="translate(150 70) rotate(${f.rot.toFixed(1)})">
      <rect x="${-L / 2}" y="${-H / 2}" width="${L}" height="${H}" rx="12" fill="${fb.color}" stroke="#2b2118" stroke-width="2"/>${fibers}
      <path d="M ${-L / 2 + 10},${-H / 2 + 4} h ${L - 20}" stroke="${fb.hi}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    </g>${slices}
    <text x="150" y="14" text-anchor="middle" font-size="10" fill="#ffe082" font-weight="bold">↻ gira el anillo · fibras = ${f.rot.toFixed(0)}° · tajo ideal = ${((f.rot + 90) % 180).toFixed(0)}°</text>
  </svg>`;
}
function mkFishViewHtml(mk) {
  const f = mk.fish;
  return `<div class="mk2-board mk2-fishview" id="mk2-fishboard" data-mk="fish">
    ${mkFishSvg(f)}
    <div class="mk2-bar-wrap"><small id="mk2-bar-txt">Corte ${f.cuts.length + 1} de ${MK_FISH_CUTS} · ángulo 90° a las fibras</small>${mkBarHtml(MK_CUT_SPEED, 'mk2-bar')}</div>
  </div>`;
}
function mkSlotsHtml(mk) {
  return mk.slots.map((s, i) => {
    if (!s) return `<div class="mk2-slot is-empty" data-mk-slot="${i}" title="Lugar libre">·</div>`;
    const r = s.roll, a = analyzeMakiSequence(r.ingredients), name = a.recipe ? (a.recipe.candidates ? a.recipe.candidates.map(c => c.name.replace('Maki ', '')).join('/') : a.recipe.name.replace('Maki ', '')) : '…';
    const st = r.cutState === 'CUT' ? '✅' : (r.pressed2 ? '🤏' : (a.status === 'READY' ? '🍣' : '·'));
    return `<div class="mk2-slot ${mk.sel === i ? 'sel' : ''}" data-mk-slot="${i}" title="Maki ${i + 1}">${makiPieceMarkup(r.ingredients)}<small>${name}</small><i>${st}</i></div>`;
  }).join('');
}
function mkSideHtml(mk) {
  const b = mk.build;
  if (mk.fish && mk.fish.open) return `<button class="fp-btn" data-mk-act="fishback">← Volver</button><div class="mk2-note">Rotación: arrastra el anillo punteado.<br>Tajo: desliza el dedo a lo largo de la pieza.</div>`;
  if (mk.sel >= 0) {
    const r = mk.slots[mk.sel] && mk.slots[mk.sel].roll;
    return `<button class="fp-btn mk2-go ${r && r.pressed2 ? 'on' : ''}" data-mk-act="press2" ${r && !r.pressed2 && r.cutState === 'NONE' ? '' : 'disabled'}>🤏 Apretar</button>
      <button class="fp-btn" data-mk-act="deselect">← Volver a armar</button>${mkFishBayHtml(mk)}`;
  }
  if (b.rolling) {
    const chips = MK_STEPS.map((s, i) => `<span class="mk2-sc ${i < b.step ? 'done' : (i === b.step ? 'cur' : '')}">${s === 'roll' ? '↑' : '🤏'}</span>`).join('');
    return `<div class="mk2-steps6">${chips}</div><button class="fp-btn mk2-go ${MK_STEPS[b.step] === 'press' ? 'on' : ''}" data-mk-act="press" ${MK_STEPS[b.step] === 'press' ? '' : 'disabled'}>🤏 Apretar</button>
      <button class="fp-btn" data-mk-act="unroll" ${b.step === 0 ? '' : 'disabled'}>← Volver</button>`;
  }
  return `${mkChecklist(b)}<button class="fp-btn mk2-go ${mkCanRoll(b) ? 'on' : ''}" data-mk-act="roll" ${mkCanRoll(b) ? '' : 'disabled'}>🌀 Enrollar</button>${mkFishBayHtml(mk)}`;
}
function mkFishBayHtml(mk) {
  const f = mk.fish;
  if (!f) return `<div class="mk2-fishbay mk2-drop" id="mk2-fishbay" data-mk="fishbay"><span>🐟</span><small>Deja aquí el pescado para cortar la cobertura</small></div>`;
  const fb = MK_FISH[f.id];
  return `<div class="mk2-fishbay has" id="mk2-fishbay" data-mk="fishbay"><span>${fb.icon}</span><small>${fb.name}: ${MK_FISH_CUTS - f.cuts.length} cortes</small><img class="mk2-knife" id="mk2-knife" data-mk="knife" src="assets/maki_knife.svg" alt="Cuchillo" draggable="false"></div>`;
}

// ---------- ciclo de vida ----------
const mkOld = { home: null, next: null };
// devuelve la estación de siempre a su sitio (sin cambiar si se ve o no)
function mkRestoreOldBox() {
  document.body.classList.remove('mk-studio');
  const box = document.getElementById('maki-station-box');
  if (!box) return null;
  if (!mkOld.home) { mkOld.home = box.parentNode; mkOld.next = box.nextSibling; }
  if (box.parentNode !== mkOld.home) mkOld.home.insertBefore(box, mkOld.next && mkOld.next.parentNode === mkOld.home ? mkOld.next : null);
  box.classList.remove('mk2-embed');
  return box;
}
function mkParkOldBox() { const box = mkRestoreOldBox(); if (box) box.style.display = 'none'; return box; }
function mkRender() {
  const panel = document.getElementById('stage-panel');
  if (!panel) return;
  if (!mkActive()) { mkParkOldBox(); return; }
  const mk = mkGet(), b = mk.build;
  const box = mkParkOldBox();
  document.body.classList.add('mk-studio');
  const main = (mk.fish && mk.fish.open) ? mkFishViewHtml(mk) : (mk.sel >= 0 ? '<div class="mk2-embed-host" id="mk2-embed-host"></div>' : (b.rolling ? mkRollViewHtml(mk) : mkBoardHtml(mk)));
  panel.classList.add('fp-active');
  panel.style.display = 'flex';
  panel.innerHTML = `<div class="fp-wrap fp-shop mk2">
    <div class="fp-head"><span>🍣 Makis · Cocina</span><small id="mk2-hint">${mkHint(mk)}</small><button class="stage-panel-back fp-back" data-mk-act="clear" title="Vaciar la esterilla">🗑 Vaciar</button></div>
    <div class="shop-cutlayout mk2-row">
      <div class="mk2-slots">${mkSlotsHtml(mk)}</div>
      <div class="mk2-main" id="mk2-main">${main}</div>
      <div class="mk2-side" id="mk2-side">${mkSideHtml(mk)}</div>
    </div></div>`;
  if (mk.sel >= 0 && !(mk.fish && mk.fish.open) && box) {
    const host = document.getElementById('mk2-embed-host');
    if (host) { host.appendChild(box); box.classList.add('mk2-embed'); box.style.display = 'flex'; try { renderMakiStation(); makiFlameUi(); } catch (e) {} }
  }
}
function mkRefresh() { if (mkActive()) { mkRender(); try { renderPantryGrid(); } catch (e) {} updateAreaTabAlerts(); } }
function mkAlert() {
  const mk = mkGet();
  if (mk.slots.some(s => s && (s.roll.cutState === 'CUT' || (s.roll.cutState === 'NONE' && s.roll.pressed2)))) return 'ready';
  if (mk.build.matPlaced || mk.build.rice || mk.slots.some(Boolean) || mk.fish) return 'busy';
  return '';
}

// ---------- selección de makis enrollados ----------
function mkDeselect() {
  const mk = mkGet();
  mk.sel = -1;
  gameState.makiRoll = newMakiRoll();
  try { toolDisarm('torch', true); } catch (e) {}
}
function mkSelect(i) {
  const mk = mkGet();
  if (mk.fish && mk.fish.open) mk.fish.open = false;
  if (mk.sel === i) { mkDeselect(); mkRefresh(); return; }
  const s = mk.slots[i];
  if (!s) { if (mk.sel >= 0) { mkDeselect(); mkRefresh(); } return; }
  mk.sel = i;
  gameState.makiRoll = s.roll;
  try { playSound('swish'); } catch (e) {}
  mkRefresh();
}
function mkPress2() {
  const mk = mkGet(), s = mk.sel >= 0 && mk.slots[mk.sel];
  if (!s || s.roll.pressed2 || s.roll.cutState !== 'NONE') return;
  s.roll.pressed2 = true;
  try { playSound('click'); } catch (e) {}
  mkToast('🤏 Maki apretado: ya puedes cortarlo.');
  mkRefresh();
}
function mkTrashSelected() {
  const mk = mkGet();
  if (mk.sel < 0) return;
  mk.slots[mk.sel] = null;
  mkDeselect();
  try { playSound('trash'); } catch (e) {}
  mkRefresh();
}
function mkOnToppingAdded(roll, id) {                  // la cobertura que se agrega lleva la calidad con que se cortó
  const mk = mkGet(), q = mk.cobQ[id];
  roll.cobQ = q && q.length ? q.shift() : 1;
}
function mkServe() {
  const mk = mkGet(), roll = gameState.makiRoll, a = analyzeMakiSequence(roll.ingredients);
  if (roll.cutState !== 'CUT' || a.status !== 'READY' || mk.sel < 0) return;
  const q = roll.mkq || {};                                            // el flameado se puntúa en Emplatar
  const proc = 4 + Math.round(12 * (q.roll == null ? 1 : q.roll)) + (roll.pressed2 ? 6 : 0) + (roll.cobQ == null ? 8 : Math.round(8 * roll.cobQ));
  const ok = stPassAdd('makis', { recipes: (a.recipe.candidates || [a.recipe]).map(r => r.name), result: 'PERFECTO',
    readyAt: roll.readyAt != null ? roll.readyAt : gameState.gameClock, vis: { kind: 'img', src: 'assets/maki_roll_v2.svg', id: 38, ings: roll.ingredients.slice() }, meta: { mkProc: Math.max(0, Math.min(30, proc)), spread: 1 } });
  if (!ok) return;
  mk.slots[mk.sel] = null;
  mkDeselect();
  try { renderMakiStation(); renderPantryGrid(); } catch (e) {}
  mkRender();
}

// ¿este ingrediente ya está en lo que se está armando (o en el maki seleccionado)? Marca la ficha de la despensa
function mkBuildHas(id) {
  const mk = mkGet(), b = mk.build;
  if (mk.sel >= 0) return gameState.makiRoll.ingredients.includes(id);
  return (id === 38 && b.rice) || (id === 20 && b.nori) || b.fills.includes(id);
}
// tocar una ficha ya usada: quita el relleno (el arroz y el nori se retiran con «Vaciar»). Devuelve true si lo manejó
function mkRemoveFromBuild(id) {
  const mk = mkGet();
  if (mk.sel >= 0) return false;                                       // sobre el maki seleccionado manda la estación de siempre
  if (mkGet().build.fills.includes(id)) mkRemoveFill(id);
  else mkToast('Para empezar de nuevo pulsa 🗑 Vaciar.');
  return true;
}

// ---------- armado: soltar cosas en la tabla ----------
function mkClearBuild() {
  const mk = mkGet(), b = mk.build;
  if (b.rice) stCookRefund('makis', 38);
  b.fills.forEach(id => stCookRefund('makis', id));
  mk.build = mkNewBuild();
  mk.build.matPlaced = b.matPlaced;                   // la esterilla sigue en la tabla
  try { playSound('trash'); } catch (e) {}
  mkRefresh();
}
function mkDropIngredient(ing, target) {
  // devuelve true si lo manejó (las coberturas sobre el maki seleccionado siguen el camino de siempre)
  if (!mkActive() || !target) return false;
  const mk = mkGet(), b = mk.build, id = ing.id;
  const bay = target.id === 'mk2-fishbay', board = target.id === 'mk2-board';
  if (!bay && !board) return false;
  if (MK_FISH[id]) return mkPutFish(id);
  if (bay) { mkToast('🐟 Ahí va el pescado entero (atún o conchas de abanico).', true); return true; }
  if (b.rolling) { mkToast('🎍 El maki se está enrollando: termina o vuelve atrás.', true); return true; }
  if (!b.matPlaced) { mkToast('🎍 Primero arrastra la esterilla hasta la tabla.', true); return true; }
  if (id === 38) {
    if (b.rice) { mkToast('🍚 El arroz ya está sobre la esterilla.'); return true; }
    if (!stCookTake('makis', 38)) return true;
    b.rice = true; try { playSound('add'); } catch (e) {}
    mkRefresh(); return true;
  }
  if (id === 20) {
    if (!mkRiceDone(b)) { mkToast(b.rice ? '🍚 Termina de extender el arroz antes del nori.' : '🍚 Primero el arroz.', true); return true; }
    if (b.nori) { mkToast('El nori ya está puesto.'); return true; }
    b.nori = true; try { playSound('add'); } catch (e) {}
    mkRefresh(); return true;
  }
  if (MK_FILLS.includes(id)) {
    if (!b.nori) { mkToast('🟩 Primero el nori sobre el arroz.', true); return true; }
    if (b.fills.includes(id)) { mkToast(`${mkName(id)} ya está en el maki.`); return true; }
    if (!mkAllowFill(b.fills, id)) { mkToast(`${mkName(id)} no va con los otros rellenos de ninguna receta.`, true); return true; }
    if (!stCookTake('makis', id)) return true;
    b.fills.push(id); try { playSound('add'); } catch (e) {}
    mkRefresh(); return true;
  }
  mkToast('Ese ingrediente va encima del maki, ya enrollado: selecciona el maki en la tabla.', true);
  return true;
}
function mkRemoveFill(id) {
  const b = mkGet().build;
  if (b.rolling || !b.fills.includes(id)) return;
  b.fills = b.fills.filter(x => x !== id);
  stCookRefund('makis', id);
  try { playSound('click'); } catch (e) {}
  mkRefresh();
}
function mkPlaceMat() { const b = mkGet().build; if (b.matPlaced) return; b.matPlaced = true; try { playSound('swish'); } catch (e) {} mkRefresh(); }

// ---------- extender el arroz: gestos cortos ----------
let mkGest = null, mkWarnAt = 0;                                      // gesto en curso (un solo dedo a la vez)
function mkGestEnd() {
  document.removeEventListener('pointermove', mkGestMove);
  document.removeEventListener('pointerup', mkGestUp);
  document.removeEventListener('pointercancel', mkGestUp);
  mkGest = null;
}
function mkRiceUi() {
  const b = mkGet().build, r = mkRiceGeom(b);
  ['mk2-rice', 'mk2-grain'].forEach(id => { const el = document.getElementById(id); if (el) el.style.cssText = `x:${r.x}px;y:${r.y}px;width:${r.w}px;height:${r.h}px`; });
  const h = document.getElementById('mk2-hint'); if (h) h.textContent = mkHint(mkGet());
}
function mkSpreadStroke(axis) {
  const mk = mkGet(), b = mk.build;
  const before = axis === 'x' ? b.sx : b.sy, add = 1 / MK_SPREAD_STROKES;
  if (axis === 'x') b.sx = Math.min(1, b.sx + add); else b.sy = Math.min(1, b.sy + add);
  try { sfxEvery('swish', 140); } catch (e) {}
  mkRiceUi();
  if (before < 1 && (axis === 'x' ? b.sx : b.sy) >= 1) {
    try { playSound('ding'); } catch (e) {}
    mkToast(axis === 'x' ? '🍚 El arroz llegó a los bordes: ahora extiéndelo hacia abajo.' : '🍚 ¡Arroz bien extendido! Ahora el nori.');
    mkRefresh();
  }
}
function mkGestDown(e, kind) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (gameState.isPaused || gameState.isGameOver) return;
  mkGestEnd();
  const mk = mkGet(), b = mk.build, now = performance.now();
  mkGest = { kind, id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: now, ext: kind === 'spreadY' ? e.clientY : e.clientX, dir: 0, mode: 'down', n: 0, pts: [{ x: e.clientX, y: e.clientY, t: now }], ang0: 0 };
  if (kind === 'ring') {
    const f = mk.fish, svg = document.getElementById('mk2-fishsvg');
    const c = mkSvgCenter(svg);
    mkGest.cx = c.x; mkGest.cy = c.y; mkGest.rot0 = f.rot; mkGest.a0 = Math.atan2(e.clientY - c.y, e.clientX - c.x);
  }
  document.addEventListener('pointermove', mkGestMove);
  document.addEventListener('pointerup', mkGestUp);
  document.addEventListener('pointercancel', mkGestUp);
}
function mkSvgCenter(svg) { const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, s = Math.min(r.width / vb.width, r.height / vb.height); return { x: r.left + r.width / 2 + (150 - vb.width / 2) * s, y: r.top + r.height / 2 + (70 - vb.height / 2) * s, s }; }
function mkGestMove(e) {
  const g = mkGest;
  if (!g || e.pointerId !== g.id) return;
  const mk = mkGet(), b = mk.build;
  g.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
  if (g.pts.length > 60) g.pts.shift();
  if (g.kind === 'spreadX') {
    if (b.sx >= 1) { mkGestEnd(); return; }
    const dx = e.clientX - g.ext;
    if (g.dir === 0) { if (Math.abs(dx) >= MK_STROKE_MIN) { g.dir = Math.sign(dx); g.ext = e.clientX; mkSpreadStroke('x'); } }
    else if (dx * g.dir > 0) g.ext = e.clientX;
    else if (-dx * g.dir >= MK_STROKE_MIN) { g.dir = -g.dir; g.ext = e.clientX; mkSpreadStroke('x'); }
  } else if (g.kind === 'spreadY') {
    if (b.sy >= 1) { mkGestEnd(); return; }
    const dy = e.clientY - g.ext;
    if (g.mode === 'down') { if (dy >= MK_STROKE_MIN) { g.ext = e.clientY; g.mode = 'up'; mkSpreadStroke('y'); } else if (dy < 0) g.ext = e.clientY; }   // la pasada cuenta solo hacia abajo
    else { if (dy <= -MK_STROKE_MIN * 0.5) { g.ext = e.clientY; g.mode = 'down'; } else if (dy > 0) g.ext = e.clientY; }
  } else if (g.kind === 'ring') {
    const f = mk.fish; if (!f) return;
    const a = Math.atan2(e.clientY - g.cy, e.clientX - g.cx);
    f.rot = ((g.rot0 + (a - g.a0) * 180 / Math.PI) % 360 + 360) % 360;
    const fg = document.getElementById('mk2-fishg'); if (fg) fg.setAttribute('transform', `translate(150 70) rotate(${f.rot.toFixed(1)})`);
    const tx = document.querySelector('#mk2-fishsvg text'); if (tx) tx.textContent = `↻ gira el anillo · fibras = ${f.rot.toFixed(0)}° · tajo ideal = ${((f.rot + 90) % 180).toFixed(0)}°`;
  }
}
function mkBarMark(v, band) {
  const mark = document.querySelector('#mk2-bar .mark'), txt = document.getElementById('mk2-bar-txt');
  if (mark) mark.style.left = (Math.min(1, v / MK_BAR_MAX) * 100) + '%';
  return { good: v >= band.lo && v <= band.hi, slow: v < band.lo, txt };
}
function mkGestUp(e) {
  const g = mkGest;
  if (!g || e.pointerId !== g.id) return;
  const now = performance.now(), last = g.pts[g.pts.length - 1], dx = last.x - g.x0, dy = last.y - g.y0, len = Math.hypot(dx, dy), dur = Math.max(1, now - g.t0);
  const kind = g.kind, pts = g.pts.slice();
  mkGestEnd();
  if (e.type !== 'pointerup') return;
  if (kind === 'roll') mkRollGesture(dx, dy, len, dur);
  else if (kind === 'slice') mkFishSlice(pts, dur);
}

// ---------- enrollar: vista lateral, 3 gestos medidos con «apretar» entre cada uno ----------
function mkStartRoll() {
  const mk = mkGet(), b = mk.build;
  if (!mkCanRoll(b)) return;
  if (mkFreeSlot(mk) < 0) { mkToast('🍣 Los 3 lugares de la tabla están ocupados: termina o descarta un maki.', true); return; }
  b.rolling = true; b.step = 0; b.qs = [];
  try { playSound('swish'); } catch (e) {}
  mkRefresh();
}
function mkUnroll() { const b = mkGet().build; if (!b.rolling || b.step > 0) return; b.rolling = false; mkRefresh(); }
function mkRollUi() {
  const b = mkGet().build, done = Math.ceil(b.step / 2), t = Math.min(1, done / 3), g = mkRollGeom(t, b.fills.length);
  const set = (id, css) => { const el = document.getElementById(id); if (el) el.style.cssText = css; };
  set('mk2-r-rice', `x:${g.rice.x}px;y:${g.rice.y}px;width:${g.rice.w}px;height:${g.rice.h}px;rx:${g.rice.rx}px`);
  set('mk2-r-nori', `x:${g.nori.x}px;y:${g.nori.y}px;width:${g.nori.w}px;height:${g.nori.h}px;rx:${g.nori.rx}px;stroke-width:${g.nori.sw}px;fill-opacity:${g.nori.fo}`);
  const mat = document.getElementById('mk2-r-mat'); if (mat) mat.style.opacity = (1 - 0.6 * t).toFixed(2);
  document.querySelectorAll('#mk2-r-fills .mk2-rf').forEach((c, i) => { const f = g.fills[i]; if (f) c.style.cssText = `cx:${f.cx}px;cy:${f.cy}px;r:${f.r}px`; });
}
function mkRollGesture(dx, dy, len, dur) {
  const mk = mkGet(), b = mk.build;
  if (!b.rolling || mk.sel >= 0) return;
  if (MK_STEPS[b.step] !== 'roll') { mkToast('🤏 Primero aprieta el rollo (botón Apretar).', true); return; }
  if (len < 50 || dy > -30 || Math.abs(dy) < len * 0.55) { mkToast('↑ Desliza hacia arriba sobre la esterilla, con un solo movimiento.', true); return; }
  const v = len / dur, q = mkQ(v, MK_ROLL_SPEED), bar = mkBarMark(v, MK_ROLL_SPEED);
  b.qs.push(q); b.step++;
  if (bar.txt) bar.txt.textContent = bar.good ? '✔ ¡En la zona verde!' : (bar.slow ? '🐢 Muy lento: el maki sale flojo' : '💨 Muy rápido: el maki se rompe');
  try { playSound(bar.good ? 'match' : 'swish'); } catch (e) {}
  mkRollUi();
  mkSideRefresh();
}
function mkSideRefresh() { const s = document.getElementById('mk2-side'), mk = mkGet(); if (s) s.innerHTML = mkSideHtml(mk); const h = document.getElementById('mk2-hint'); if (h) h.textContent = mkHint(mk); }
function mkPress() {
  const mk = mkGet(), b = mk.build;
  if (mk.sel >= 0) { mkPress2(); return; }
  if (!b.rolling) return;
  if (MK_STEPS[b.step] !== 'press') { mkToast('↑ Primero enrolla: desliza hacia arriba.', true); return; }
  b.step++;
  try { playSound('click'); } catch (e) {}
  const roll = document.getElementById('mk2-roll');
  if (roll && roll.animate) roll.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.97, 0.94)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
  mkRollUi();
  if (b.step >= MK_STEPS.length) { mkFinishRoll(); return; }
  mkSideRefresh();
}
function mkFinishRoll() {
  const mk = mkGet(), b = mk.build, slot = mkFreeSlot(mk), groups = mkBaseGroups(b.fills);
  if (slot < 0 || !groups.length) { b.rolling = false; mkRefresh(); return; }
  const g = groups[0], base = g.ingredients.slice(0, g.baseCount);
  const rollQ = b.qs.length ? b.qs.reduce((s, x) => s + x, 0) / b.qs.length : 1;
  const roll = Object.assign(newMakiRoll(), { ingredients: base.slice(), matPlaced: true, rollState: 'ROLLED', rollProgress: 1, baseLen: base.length, spread: 1, pressed2: false, mkq: { roll: rollQ } });
  mk.slots[slot] = { uid: mk.uid++, roll };
  const mat = b.matPlaced;
  mk.build = mkNewBuild(); mk.build.matPlaced = mat;
  try { playSound('match'); } catch (e) {}
  mkToast(rollQ >= 0.85 ? '🍣 ¡Maki bien enrollado! Quedó en la tabla.' : (rollQ >= 0.5 ? '🍣 Maki enrollado (algo flojo). Quedó en la tabla.' : '🍣 Maki mal enrollado: se verá en el resultado.'));
  mkRefresh();
}

// ---------- pescado: tabla de corte con fibras, giro y tajo medido ----------
function mkPutFish(id) {
  const mk = mkGet(), fb = MK_FISH[id];
  if (mk.fish) { mkToast('🐟 Ya hay un pescado en la tabla: córtalo primero.', true); return true; }
  if (fb.take && !stCookTake('makis', fb.take)) return true;
  mk.fish = { id, rot: Math.round(Math.random() * 120 - 60), cuts: [], open: false };
  try { playSound('add'); } catch (e) {}
  mkToast(`${fb.icon} ${fb.name} en la tabla: arrastra el cuchillo hasta ella para cortarlo.`);
  mkRefresh();
  return true;
}
function mkOpenFish() {
  const mk = mkGet();
  if (!mk.fish) { mkToast('🐟 Primero deja un pescado en la tabla de pescado.', true); return; }
  mk.fish.open = true;
  try { playSound('add'); } catch (e) {}
  mkRefresh();
}
function mkFishBack() { const mk = mkGet(); if (mk.fish) mk.fish.open = false; mkRefresh(); }
function mkFishSlice(pts, dur) {
  const mk = mkGet(), f = mk.fish;
  if (!f || !f.open || pts.length < 2) return;
  const a = pts[0], b = pts[pts.length - 1], svg = document.getElementById('mk2-fishsvg');
  if (!svg) return;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 40) { mkToast('🔪 Desliza el dedo a través del pescado con un tajo largo.', true); return; }
  // ¿el tajo cruza la pieza? (en coordenadas del pescado)
  const c = mkSvgCenter(svg), s = c.s, th = f.rot * Math.PI / 180, cos = Math.cos(-th), sin = Math.sin(-th);
  const loc = p => { const x = (p.x - c.x) / s, y = (p.y - c.y) / s; return { x: x * cos - y * sin, y: x * sin + y * cos }; };
  const L = Math.max(30, 124 - f.cuts.length * (124 * 0.22)), H = 44;
  if (!slashSegHitsRect(loc(a), loc(b), { left: -L / 2, right: L / 2, top: -H / 2, bottom: H / 2 })) { mkToast('🔪 El tajo tiene que cruzar la pieza de pescado.', true); return; }
  const v = len / Math.max(1, dur), ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  const err = Math.abs((((ang - (f.rot + 90)) % 180) + 270) % 180 - 90);                 // desvío respecto a 90° de las fibras
  const angQ = err <= 10 ? 1 : Math.max(0, 1 - (err - 10) / 35), spdQ = mkQ(v, MK_CUT_SPEED), q = Math.min(angQ, spdQ);
  const bar = mkBarMark(v, MK_CUT_SPEED);
  f.cuts.push({ q, err, v });
  try { playSound('chop'); } catch (e) {}
  const fb = MK_FISH[f.id];
  shopSlashLast = { ang: Math.atan2(b.y - a.y, b.x - a.x), x: b.x, y: b.y, x0: a.x, y0: a.y, t: performance.now() };
  slashFx({ zone: document.getElementById('mk2-fishboard'), item: null, iconHtml: '', bitsImg: null });
  if (bar.txt) bar.txt.textContent = `Ángulo ${(90 - Math.min(90, err)).toFixed(0)}°→${err <= 10 ? '✔' : '✘'} (error ${err.toFixed(0)}°) · ${bar.good ? 'velocidad ✔' : (bar.slow ? 'muy suave' : 'muy rápido')} · corte ${(q * 100).toFixed(0)}%`;
  if (f.cuts.length >= MK_FISH_CUTS) {
    const st = stGet('makis'), cp = ST_PROD.makis.find(p => p.covers.includes(fb.cover) && p.virtual);
    const gain = Math.min(f.cuts.length, cp ? cp.max - st.stock[cp.key] : f.cuts.length);
    if (cp) st.stock[cp.key] += gain;
    mk.cobQ[fb.cover] = (mk.cobQ[fb.cover] || []).concat(f.cuts.slice(0, gain).map(x => x.q));
    const avg = f.cuts.reduce((x, y) => x + y.q, 0) / f.cuts.length;
    mk.fish = null;
    try { playSound('match'); } catch (e) {}
    mkToast(`${fb.icon} Cobertura de ${fb.name.toLowerCase()} lista (+${gain}): ${avg >= 0.8 ? 'cortes limpios' : (avg >= 0.5 ? 'cortes regulares' : 'cortes desparejos')}. Está en la despensa.`);
    setTimeout(mkRefresh, 700);
    return;
  }
  const lf = document.getElementById('mk2-fishsvg');
  if (lf) { const fresh = document.createElement('div'); fresh.innerHTML = mkFishSvg(f); lf.replaceWith(fresh.firstElementChild); }
}

// ---------- herramientas arrastrables (esterilla y cuchillo) ----------
function mkToolDrag(e, html, onDrop) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  const id = e.pointerId, g = document.createElement('div');
  g.className = 'mk2-ghost'; g.innerHTML = html;
  document.body.appendChild(g);
  const place = ev => { g.style.transform = `translate(${ev.clientX}px, ${ev.clientY - 28}px) translate(-50%, -50%)`; };
  place(e);
  const move = ev => { if (ev.pointerId === id) place(ev); };
  const up = ev => {
    if (ev.pointerId !== id) return;
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
    g.remove();
    if (ev.type === 'pointerup') onDrop(ev.clientX, ev.clientY - 28);
  };
  document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
}
const mkInside = (el, x, y, pad = 12) => { if (!el) return false; const r = el.getBoundingClientRect(); return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad; };

// ---------- eventos (delegados en el panel) ----------
function mkDropSelector() {
  const mk = mkGet();
  if (mk.fish && mk.fish.open) return '#mk2-fishboard';
  if (mk.sel >= 0) return '#maki-board-zone, #mk2-fishbay';
  return '#mk2-board, #mk2-fishbay';
}
document.addEventListener('pointerdown', (e) => {
  if (!mkActive() || !e.target.closest) return;
  const panel = document.getElementById('stage-panel');
  if (!panel || !panel.contains(e.target)) return;
  const mk = mkGet(), b = mk.build, t = e.target;
  const act = t.closest('[data-mk-act]');
  if (act) return;                                                                   // los botones usan click
  if (t.closest('#mk2-mat-tool')) { mkToolDrag(e, '<span style="font-size:34px">🎍</span>', (x, y) => { if (mkInside(document.getElementById('mk2-board'), x, y)) mkPlaceMat(); else mkToast('🎍 Suelta la esterilla sobre la tabla.'); }); return; }
  if (t.closest('#mk2-knife')) { mkToolDrag(e, '<img src="assets/maki_knife.svg" style="height:56px" alt="">', (x, y) => { if (mkInside(document.getElementById('mk2-fishbay'), x, y, 30) || mkInside(document.getElementById('mk2-main'), x, y, 0)) mkOpenFish(); else mkToast('🔪 Arrastra el cuchillo hasta la tabla de pescado.'); }); return; }
  if (mk.sel >= 0 && t.closest('#maki-board-zone')) {                                // cortar sin apretar: se avisa
    const r0 = gameState.makiRoll;
    if (makiIsComplete() && r0.rollState === 'ROLLED' && r0.cutState === 'NONE' && !r0.pressed2 && performance.now() - mkWarnAt > 2500) { mkWarnAt = performance.now(); mkToast('🤏 Primero aprieta el maki (botón Apretar) y luego córtalo.', true); }
  }
  const chip = t.closest('[data-mk-chip]');
  if (chip) { mkRemoveFill(parseInt(chip.dataset.mkChip, 10)); return; }
  const slot = t.closest('[data-mk-slot]');
  if (slot) { mkSelect(parseInt(slot.dataset.mkSlot, 10)); return; }
  if (mk.fish && mk.fish.open && t.closest('#mk2-fishboard')) { mkGestDown(e, t.closest('[data-mk="ring"]') ? 'ring' : 'slice'); return; }
  if (b.rolling && t.closest('#mk2-roll')) { mkGestDown(e, 'roll'); return; }
  if (!b.rolling && mk.sel < 0 && t.closest('#mk2-board') && b.matPlaced && b.rice && !mkRiceDone(b) && !b.nori) { mkGestDown(e, b.sx < 1 ? 'spreadX' : 'spreadY'); return; }
}, { passive: false });
document.addEventListener('click', (e) => {
  const act = e.target.closest && e.target.closest('[data-mk-act]');
  if (!act || !mkActive()) return;
  const k = act.dataset.mkAct;
  if (k === 'roll') mkStartRoll();
  else if (k === 'unroll') mkUnroll();
  else if (k === 'press') mkPress();
  else if (k === 'press2') mkPress2();
  else if (k === 'deselect') { mkDeselect(); mkRefresh(); }
  else if (k === 'clear') { const mk = mkGet(); if (mk.sel >= 0) mkTrashSelected(); else mkClearBuild(); }
  else if (k === 'fishback') mkFishBack();
});


// ---------- emplatado de Makis: las 6 piezas del corte sobre una fuente oscura; salsa, ajonjolí, jengibre y wasabi se suman al añadirlos ----------
const MK_PLATE_SPOTS = [[44, 27], [66, 27], [88, 27], [44, 53], [66, 53], [88, 53]];   // centro de cada pieza (lienzo 110×80)
function mkPieceInner(ings) { return makiPieceMarkup(ings).replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''); }
function mkPlateHtml(item, plateItems, sl) {
  const v = item && item.vis;
  if (!v || !v.ings) return null;                                            // maki antiguo (sin etapas): dibujo genérico
  const ings = v.ings, last = plateItems[plateItems.length - 1], flame = sl ? (sl.flame || 0) : 0;
  const pieces = MK_PLATE_SPOTS.map(([x, y]) => `<svg x="${x - 12}" y="${y - 12}" width="24" height="24" viewBox="0 0 40 40">${mkPieceInner(ings)}</svg>`).join('');
  const pop = id => (id === last ? ' class="sal-pop"' : '');
  let extra = '';
  const sauceId = plateItems.find(id => MAKI_SAUCE_COLORS[id]);
  if (sauceId) {
    const c = MAKI_SAUCE_COLORS[sauceId];
    extra += `<g${pop(sauceId)}>` + (sauceId === 81
      ? MK_PLATE_SPOTS.map(([x, y], i) => `<circle cx="${x + (i % 2 ? 3 : -3)}" cy="${y - 7}" r="3.3" fill="${c}" stroke="#5e8d2d" stroke-width="0.7"/>`).join('')
      : [27, 53].map(y => `<path d="M 32,${y - 8} l 6,13 l 6,-13 l 6,13 l 6,-13 l 6,13 l 6,-13 l 6,13 l 6,-13 l 5,13" fill="none" stroke="#00000044" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 1)"/><path d="M 32,${y - 8} l 6,13 l 6,-13 l 6,13 l 6,-13 l 6,13 l 6,-13 l 6,13 l 6,-13 l 5,13" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`).join('')) + '</g>';
  }
  if (plateItems.includes(34)) extra += `<g${pop(34)}>${salBlackSesame(30, 7, 66, 40, 30, 22)}</g>`;                                  // ajonjolí negro (California)
  if (flame > 0.15 && sauceId) {                                                                                                   // flameado: marcas tostadas sobre las piezas
    const burnt = flame > MAKI_FLAME_GREEN[1], col = burnt ? '#0d0a08' : '#5a2a10', op = Math.min(1, flame / MAKI_FLAME_GREEN[0]) * (burnt ? 0.95 : 0.8);
    extra += `<g opacity="${op.toFixed(2)}">` + MK_PLATE_SPOTS.map(([x, y]) => `<path d="M ${x - 6},${y - 6} q 6,-5 12,0 M ${x - 4},${y - 3} q 4,-3 8,0" fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round"/>`).join('') + '</g>';
  }
  if (plateItems.includes(97)) extra += `<g${pop(97)}><ellipse cx="18" cy="30" rx="8" ry="5.4" fill="#f6a8b4" stroke="#c9677a" stroke-width="1"/><path d="M 12,30 q 6,-6 12,0 M 13,33 q 5,-5 10,0 M 14,27 q 4,-3 8,0" fill="none" stroke="#ffd3da" stroke-width="1.1" stroke-linecap="round"/></g>`;   // jengibre (gari)
  if (plateItems.includes(96)) extra += `<g${pop(96)}><path d="M 11,52 q 0,-8 8,-8 q 8,0 8,8 q 0,4 -8,4 q -8,0 -8,-4 Z" fill="#7fb23d" stroke="#4a7a1f" stroke-width="1"/><path d="M 14,49 q 3,-3 6,-1" fill="none" stroke="#c5e08a" stroke-width="1.2" stroke-linecap="round"/></g>`;   // wasabi
  return `<div class="fp-bowl"><div class="sal-plate"><svg viewBox="0 0 110 80" aria-hidden="true">
    <rect x="4" y="8" width="102" height="64" rx="9" fill="#2a2e35" stroke="#12141a" stroke-width="2.4"/><rect x="8" y="12" width="94" height="56" rx="6" fill="none" stroke="#4a515c" stroke-width="1"/>
    <path d="M 12,15 H 60" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2" stroke-linecap="round"/>
    ${pieces}${extra}</svg></div></div>`;
}

// ---------- estilos ----------
(function mkInjectCss() {
  const css = `
  .mk2 .mk2-row.shop-cutlayout { gap: 5px; height: clamp(96px, calc(100vh - 280px), 200px); }
  .mk2 .fp-head small { font-size: 9.5px; }
  /* con el estudio abierto el flameador se achica para dejarle altura */
  body.mk-torch-small .ramen-tool-strip.on { padding-top: 0; padding-bottom: 0; }
  body.mk-torch-small .ramen-tool-strip .tool-item.tool-torch .tool-svg { height: 36px; }
  body.mk-torch-small .ramen-tool-strip .tool-name { display: none; }
  .mk2-slots { width: 60px; flex-shrink: 0; display: flex; flex-direction: column; gap: 4px; }
  .mk2-slot { flex: 1; min-height: 0; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #8d6e63; border-radius: 9px; background: rgba(60,30,22,0.65); cursor: pointer; overflow: hidden; }
  .mk2-slot.is-empty { border-style: dashed; border-color: #5d4037; color: #8d6e63; font-size: 18px; cursor: default; opacity: 0.7; }
  .mk2-slot.sel { border-color: #ffd54f; box-shadow: 0 0 8px rgba(255,213,79,0.9); background: rgba(95,60,30,0.85); }
  .mk2-slot svg { width: 30px; height: 30px; }
  .mk2-slot small { font-size: 7.5px; font-weight: 800; color: #ffe0b2; max-width: 56px; text-align: center; line-height: 1.05; overflow: hidden; }
  .mk2-slot i { position: absolute; right: 2px; top: 1px; font-style: normal; font-size: 11px; }
  .mk2-main { flex: 1; min-width: 0; position: relative; }
  .mk2-board { position: absolute; inset: 0; border-radius: 14px; border: 3px solid #97672f; box-sizing: border-box; overflow: hidden; touch-action: none; user-select: none; -webkit-user-select: none; background: repeating-linear-gradient(90deg, #d9b27a 0 22px, #cfa66b 22px 24px), #d9b27a; box-shadow: 0 4px 8px rgba(0,0,0,0.5), inset 0 0 0 4px rgba(255,255,255,0.22); }
  .mk2-board.drop-hover { filter: drop-shadow(0 0 8px rgba(255,213,79,0.95)); }
  .mk2-svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
  .mk2-rice, #mk2-grain { transition: x 0.22s ease-out, width 0.22s ease-out, height 0.22s ease-out; }
  .mk2-mat-tool { position: absolute; left: 6px; top: 50%; transform: translateY(-50%); width: 82px; padding: 6px 4px; border-radius: 10px; border: 2px dashed #6d4c1f; background: rgba(255,243,200,0.85); text-align: center; display: flex; flex-direction: column; align-items: center; touch-action: none; cursor: grab; animation: mkPulse 1s ease-out infinite; }
  .mk2-mat-tool span { font-size: 30px; line-height: 1; } .mk2-mat-tool b { font-size: 11px; color: #5d4037; } .mk2-mat-tool small { font-size: 8px; color: #6d4c41; }
  .mk2-chips { position: absolute; left: 4px; right: 4px; bottom: 3px; display: flex; gap: 3px; justify-content: center; flex-wrap: wrap; z-index: 3; }
  .mk2-chips .fp-chip { width: 22px; height: 22px; background: rgba(255,255,255,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .mk2-rollview, .mk2-fishview { background: radial-gradient(circle at 50% 40%, #6b4a2c, #3b2616); }
  .mk2-morph, .mk2-rf { transition: all 0.45s ease; }
  .mk2-bar-wrap { position: absolute; left: 6px; right: 6px; bottom: 4px; display: flex; flex-direction: column; gap: 2px; z-index: 4; }
  .mk2-bar-wrap small { font-size: 9px; font-weight: 800; color: #fff; text-shadow: 0 1px 2px #000; }
  .mk2-bar { position: relative; height: 12px; border-radius: 7px; background: #1b0f0b; border: 1.5px solid #8d6e63; overflow: hidden; }
  .mk2-bar .band { position: absolute; top: 0; bottom: 0; background: rgba(156,204,101,0.65); }
  .mk2-bar .mark { position: absolute; top: -2px; bottom: -2px; width: 4px; margin-left: -2px; border-radius: 2px; background: #fff; box-shadow: 0 0 4px #000; left: 0; transition: left 0.25s; }
  .mk2-side { width: 100px; flex-shrink: 0; display: flex; flex-direction: column; gap: 4px; font-size: 10px; font-weight: 800; color: #ffe0b2; }
  .mk2-chk { display: flex; gap: 3px; justify-content: center; }
  .mk2-chk span { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; background: rgba(0,0,0,0.35); opacity: 0.55; border: 1px solid #5d4037; }
  .mk2-chk span.done { opacity: 1; background: #2e7d32; border-color: #9ccc65; } .mk2-chk span.cur { opacity: 1; border-color: #ffd54f; box-shadow: 0 0 6px #ffd54f; }
  .mk2-steps6 { display: flex; gap: 2px; justify-content: center; }
  .mk2-sc { width: 14px; height: 18px; border-radius: 4px; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 9px; border: 1px solid #5d4037; }
  .mk2-sc.done { background: #43a047; } .mk2-sc.cur { border-color: #ffd54f; box-shadow: 0 0 5px #ffd54f; }
  .mk2-go.on { background: linear-gradient(#66bb6a, #2e7d32); border-color: #c5e1a5; animation: mkPulse 1s ease-out infinite; }
  @keyframes mkPulse { from { box-shadow: 0 0 0 0 rgba(255,235,59,0.75); } to { box-shadow: 0 0 0 7px rgba(255,235,59,0); } }
  .mk2-note { font-size: 8.5px; font-weight: 700; opacity: 0.85; line-height: 1.2; }
  .mk2-fishbay { position: relative; flex: 1; min-height: 30px; border: 2px dashed #8d6e63; border-radius: 9px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: rgba(60,30,22,0.5); }
  .mk2-fishbay span { font-size: 20px; line-height: 1; } .mk2-fishbay small { font-size: 8px; font-weight: 700; line-height: 1.1; padding: 0 2px; }
  .mk2-fishbay.has { border-style: solid; border-color: #ffd54f; }
  .mk2-fishbay.drop-hover { background: rgba(156,204,101,0.4); }
  .mk2-knife { position: absolute; right: 2px; bottom: 2px; height: 34px; touch-action: none; cursor: grab; }
  .mk2-ghost { position: fixed; left: 0; top: 0; z-index: 9500; pointer-events: none; filter: drop-shadow(0 3px 4px rgba(0,0,0,0.6)); }
  .mk2-embed-host { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  .mk2-embed { display: flex !important; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 0 !important; }
  .mk2-embed .maki-mat-card { width: 100%; max-height: 100%; }
  .mk2-embed .maki-tool, .mk2-embed .maki-mat-status { display: none !important; }
  `;
  const el = document.createElement('style'); el.textContent = css; document.head.appendChild(el);
})();
