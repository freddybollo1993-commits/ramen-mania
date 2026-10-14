/* Módulo 06-etapas-navegacion — Etapas (Producción · Cocina · Emplatar): pestañas y deslizamiento.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// --- Etapas de cada área ---
// Cada área tiene tres pantallas: la estación de siempre ("cook"), Producción ("prod": reponer insumos) y
// Emplatar ("plate": organizar el plato final antes de entregarlo). Producción y Emplatar son provisionales:
// de momento muestran un aviso y devuelven a la estación.
const AREA_COOK_STAGE = {
  ramen: { icon: '🍜', label: 'Cocinar' },
  salteados: { icon: '🍳', label: 'Saltear' },
  makis: { icon: '🍣', label: 'Armar' },
  frituras: { icon: '🍤', label: 'Freír' }
};
const STAGE_INFO = {
  prod: {
    icon: '🥬', label: 'Producción',
    text: {
      frituras: 'Aquí repones los insumos de la fritura: col, zanahoria, betarraga, gyozas y ebi furai.',
      _: 'Aquí prepararás y repondrás los insumos de esta área antes del servicio.'
    }
  },
  plate: {
    icon: '🍽️', label: 'Emplatar',
    text: { _: 'Fase final antes de entregar al cliente: organiza el plato con su proteína, salsa, ensalada y decoración, según corresponda.' }
  }
};

function getStage(area) {
  const a = area || gameState.activeArea;
  if (!stagedOn(a)) return 'cook';          // sin etapas (aún no se activan, tutorial o multijugador)
  return (gameState.stages && gameState.stages[a]) || 'cook';
}

function renderStageTabs() {
  const box = document.getElementById('kitchen-stage-tabs');
  if (!box) return;
  updateStageEdgeHints();
  if (isMultiplayerSession()) { box.innerHTML = ''; return; }
  const area = gameState.activeArea, cur = getStage(area), ck = AREA_COOK_STAGE[area] || AREA_COOK_STAGE.ramen;
  const defs = [['prod', STAGE_INFO.prod.icon, STAGE_INFO.prod.label], ['cook', ck.icon, ck.label], ['plate', STAGE_INFO.plate.icon, STAGE_INFO.plate.label]];   // orden fijo: izquierda · centro · derecha
  const on = stagedOn(area);
  box.innerHTML = defs.map(([id, icon, label]) => {
    const locked = id !== 'cook' && !on;
    return `<button class="kitchen-stage-btn ${cur === id ? 'active' : ''} ${locked ? 'locked' : ''}" data-stage="${id}" data-alert="${id === 'cook' ? getAreaAlert(area) : ''}" title="${locked ? label + ' · se desbloquea en ' + stGateHint(area) : label}" onclick="setKitchenStage('${id}')"><span>${locked ? '🔒' : icon}</span><span class="ks-label">${label}</span><i class="area-dot"></i></button>`;
  }).join('');
}

function renderStagePanel() {
  const panel = document.getElementById('stage-panel');
  if (!panel) return;
  const area = gameState.activeArea, stage = getStage(area), info = STAGE_INFO[stage];
  if (area === 'makis' && stage === 'cook' && stagedOn('makis') && typeof mkRender === 'function') { mkRender(); return; }   // estudio de Makis
  panel.classList.toggle('fp-active', stagedOn(area) && !!info);
  if (stagedOn(area) && info) {
    if (stage === 'prod') stRenderProd(area, panel); else stRenderPlate(area, panel);
    return;
  }
  if (!info) { panel.innerHTML = ''; return; }
  const ck = AREA_COOK_STAGE[area] || AREA_COOK_STAGE.ramen;
  panel.innerHTML = `<div class="stage-panel-card">
      <div class="stage-panel-icon">${info.icon}</div>
      <div><div class="stage-panel-title">${info.label} · ${AREA_LABELS[area]}</div>
        <div class="stage-panel-text">${info.text[area] || info.text._}</div>
        <div class="stage-panel-soon">🚧 En construcción: pronto podrás trabajar aquí.</div></div>
      <button class="stage-panel-back" onclick="setKitchenStage('cook')">${ck.icon} Volver a ${ck.label}</button>
    </div>`;
}

function setKitchenStage(stage) {
  if (isMultiplayerSession() || !['cook', 'prod', 'plate'].includes(stage)) return;
  const area = gameState.activeArea;
  if (stage !== 'cook' && !stagedOn(area)) {
    showStationToast(`🔒 ${STAGE_INFO[stage].label} de ${AREA_LABELS[area]} se desbloquea en ${stGateHint(area)}.`);
    try { playSound('error'); } catch (e) {}
    return;
  }
  if (getStage(area) === stage) return;
  gameState.stages[area] = stage;
  // un gesto a medias (cuchillo, esterilla, arrastre) no tiene sentido al cambiar de pantalla
  abortMakiCut();
  cleanupMakiToolDrag();
  cleanupFryItemDrag();
  abortFryCut();
  cleanupFryKnifeDrag();
  cleanupShopKnife();
  try { playSound('click'); } catch (e) {}
  updateStationVisibilityForArea();
  renderStageTabs();
  if (stage === 'plate') renderPantryGrid();
  if (stage === 'cook') {
    renderPantryGrid();
    renderBowls();
    if (area === 'makis') renderMakiStation();
    if (area === 'salteados') renderWoks();
    if (area === 'frituras') renderFryStation();
  }
}

// --- Deslizar entre etapas ---
// Estructura fija: Producción (izquierda) · Cocinar (centro) · Emplatar (derecha), como tres pantallas puestas
// una al lado de otra. El contenido sigue al dedo: desde el borde IZQUIERDO hacia la derecha se ve la pantalla
// de la izquierda; desde el borde DERECHO hacia la izquierda, la de la derecha. El gesto debe EMPEZAR cerca del
// borde (así no se cambia por error al tocar o arrastrar cosas en la cocina).
const STAGE_ORDER = ['prod', 'cook', 'plate'];
const SWIPE_EDGE_PX = 72;        // zona del borde donde puede empezar el gesto
const SWIPE_MIN_PX = 80;         // recorrido horizontal mínimo
const SWIPE_MAX_MS = 700;        // el gesto debe ser ágil
const SWIPE_NO_START = '#fry-arr, .fry-knife-tool, .maki-tool, .fry-board-item, .wok-stir-btn, .tool-item, .tool-armed, .shop-bigboard, .stir-wok, input, textarea, select';   // las herramientas del ramen (ohashi junto al borde derecho) no deben iniciar el deslizamiento entre etapas
let stageSwipe = null;
let swipeNoClickUntil = 0;

function stageSwipeAllowed(target) {
  const start = document.getElementById('start-screen');
  if (!start || getComputedStyle(start).display !== 'none') return false;       // en el menú no
  if (gameState.isPaused || gameState.isGameOver || isMultiplayerSession()) return false;
  if (typeof TutorialManager !== 'undefined' && TutorialManager.isActive) return false;
  if (document.querySelector('.modal-overlay.active, .order-detail-modal.active')) return false;
  if (target && target.closest && target.closest(SWIPE_NO_START)) return false;
  return true;
}

function stageSwipeBusyWithDrag() {
  return !!((typeof ingredientDragActive === 'function' && ingredientDragActive())
    || (typeof fryItemDrag !== 'undefined' && fryItemDrag && fryItemDrag.active)
    || (typeof fryKnifeDrag !== 'undefined' && fryKnifeDrag && fryKnifeDrag.active)
    || (typeof makiToolDrag !== 'undefined' && makiToolDrag && makiToolDrag.active));
}

let lastSwipeLockToast = 0;
function swipeToStage(dir) {
  if (!stagedOn(gameState.activeArea)) {
    // el gesto funciona, pero esta área aún no tiene etapas: se avisa cuándo se abren
    if (performance.now() - lastSwipeLockToast > 3000) {
      lastSwipeLockToast = performance.now();
      showStationToast(`🔒 Producción y Emplatar de ${AREA_LABELS[gameState.activeArea]} se desbloquean en ${stGateHint(gameState.activeArea)}.`);
    }
    return false;
  }
  const cur = STAGE_ORDER.indexOf(getStage(gameState.activeArea));
  const next = Math.max(0, Math.min(STAGE_ORDER.length - 1, cur + dir));
  if (next === cur) return false;
  if (typeof cleanupIngredientDrag === 'function') cleanupIngredientDrag();
  setKitchenStage(STAGE_ORDER[next]);
  try { playSound('swish'); } catch (e) {}
  try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
  return true;
}

document.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse') return;                         // solo dedo / lápiz
  const w = window.innerWidth, edge = Math.min(SWIPE_EDGE_PX, w * 0.12);
  if (e.clientX > edge && e.clientX < w - edge) { stageSwipe = null; return; }
  if (!stageSwipeAllowed(e.target)) { stageSwipe = null; return; }
  stageSwipe = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), side: e.clientX <= edge ? 'left' : 'right', done: false };
}, { passive: true });

document.addEventListener('pointermove', (e) => {
  const sw = stageSwipe;
  if (!sw || e.pointerId !== sw.id || sw.done) return;
  if (stageSwipeBusyWithDrag()) { stageSwipe = null; return; }   // arrastrando un ingrediente o una herramienta
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
  if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx) * 0.8) { stageSwipe = null; return; }   // gesto vertical
  const inward = sw.side === 'left' ? dx : -dx;                  // desde el borde hacia adentro
  if (inward < -20) { stageSwipe = null; return; }
  if (inward >= SWIPE_MIN_PX) {
    if (performance.now() - sw.t > SWIPE_MAX_MS) { stageSwipe = null; return; }
    sw.done = true;
    swipeNoClickUntil = performance.now() + 400;                 // el toque que termina el gesto no debe activar botones
    swipeToStage(dx > 0 ? -1 : 1);       // dedo a la derecha (desde el borde izquierdo) → etapa de la izquierda
  }
}, { passive: true });

['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, (e) => {
  if (stageSwipe && e.pointerId === stageSwipe.id) stageSwipe = null;
}, { passive: true }));
document.addEventListener('click', (e) => {
  if (performance.now() < swipeNoClickUntil) { e.stopPropagation(); e.preventDefault(); }
}, true);

// Pistas en los bordes: muestran a qué etapa lleva el gesto desde cada borde.
function updateStageEdgeHints() {
  let left = document.getElementById('stage-edge-left'), right = document.getElementById('stage-edge-right');
  if (!left) {
    left = document.createElement('div'); left.id = 'stage-edge-left'; left.className = 'stage-edge-hint left';
    right = document.createElement('div'); right.id = 'stage-edge-right'; right.className = 'stage-edge-hint right';
    document.body.appendChild(left); document.body.appendChild(right);
  }
  const start = document.getElementById('start-screen');
  const on = !isMultiplayerSession() && stagedOn(gameState.activeArea) && start && getComputedStyle(start).display === 'none';
  const cur = STAGE_ORDER.indexOf(getStage(gameState.activeArea));
  const icon = id => id === 'cook' ? (AREA_COOK_STAGE[gameState.activeArea] || AREA_COOK_STAGE.ramen).icon : STAGE_INFO[id].icon;
  // estructura fija: el borde izquierdo lleva a la etapa de su izquierda (Producción) y el derecho a la de su derecha (Emplatar)
  const toRight = STAGE_ORDER[cur + 1], toLeft = STAGE_ORDER[cur - 1];
  left.style.display = on && toLeft ? 'flex' : 'none';
  right.style.display = on && toRight ? 'flex' : 'none';
  if (toLeft) left.innerHTML = `<span>${icon(toLeft)}</span><b>›</b>`;
  if (toRight) right.innerHTML = `<b>‹</b><span>${icon(toRight)}</span>`;
}

// Indicador en cada pestaña (menos la activa): en curso, listo o a punto de quemarse.
function getAreaAlert(areaId) {
  const base = getAreaAlertBase(areaId);
  if (base === 'warn' || !stagedOn(areaId)) return base;
  if (stReadyDishes(areaId).some(d => d.meta.plate.wrong === 0)) return 'ready';      // plato emplatado exacto listo para servir
  if (stShopReady(areaId)) return 'ready';                         // algo listo en una hornilla de Producción
  if (base) return base;
  const s = stGet(areaId);
  return (s.pass.length || s.slots.some(sl => sl.item) || s.prep || stShopBusy(areaId)) ? 'busy' : '';   // platos en el pase o en un cuenco, o una preparación en curso
}
function getAreaAlertBase(areaId) {
  if (areaId === 'ramen') {
    if (gameState.bowls.some(b => b.matchedRamen)) return 'ready';
    if (gameState.bowls.some(b => b.ingredients.length > 0)) return 'busy';
  } else if (areaId === 'salteados') {
    if (gameState.woks.some(w => w.result)) return 'ready';
    if (gameState.woks.some(w => w.stirring || w.ingredients.length > 0)) return 'busy';
  } else if (areaId === 'frituras') {
    const st = gameState.fryStation;
    if (st.phase === 'FRYING') return st.frySeconds >= fryProfile(st.proteinId).burn ? 'warn' : 'busy';
    if (st.phase === 'FRIED') return fryDishComplete() ? 'ready' : 'busy';
    if (st.ingredients.length > 0) return 'busy';
  } else if (areaId === 'makis') {
    if (stagedOn('makis') && typeof mkAlert === 'function') return mkAlert();
    const roll = gameState.makiRoll;
    if (roll.cutState === 'CUT' || makiCanCut()) return 'ready';
    if (roll.matPlaced || roll.ingredients.length > 0) return 'busy';
  }
  return '';
}

function updateAreaTabAlerts() {
  document.querySelectorAll('.kitchen-area-tab-btn[data-area]').forEach(btn => {
    const alert = getAreaAlert(btn.dataset.area);
    if (btn.dataset.alert !== alert) btn.dataset.alert = alert;
  });
  // la estación de esta área sigue trabajando mientras estás en Producción o Emplatar
  const ck = document.querySelector('.kitchen-stage-btn[data-stage="cook"]');
  if (ck) { const a = getAreaAlert(gameState.activeArea); if (ck.dataset.alert !== a) ck.dataset.alert = a; }
}

// Muestra la estación de trabajo que corresponde al área activa (cuenco de Ramen,
// tabla de Makis, o el aviso de "en construcción" para las áreas que aún no tienen mecánica).
function updateStationVisibilityForArea() {
  const cookPanel = document.getElementById('cook-stations-panel');
  const bowlsBox = document.getElementById('bowls-dock-box');
  const makiBox = document.getElementById('maki-station-box');
  const wokBox = document.getElementById('salteado-station-box');
  const fryBox = document.getElementById('frituras-station-box');
  const area = gameState.activeArea;
  const cook = getStage(area) === 'cook'; // en Producción y Emplatar no se ve la estación
  const plateStage = stagedOn(area) && getStage(area) === 'plate';   // en Emplatar sí queda la despensa arriba (con los componentes de emplatado)
  if (cookPanel) cookPanel.style.display = (area === 'ramen' && cook) ? '' : 'none';
  if (bowlsBox) bowlsBox.style.display = (area === 'ramen' && cook) ? '' : 'none';
  const mkStudio = area === 'makis' && cook && stagedOn('makis');            // con etapas: estudio de Makis (panel), no la estación de siempre
  if (makiBox && !mkStudio) makiBox.style.display = (area === 'makis' && cook) ? 'flex' : 'none';
  if (wokBox) wokBox.style.display = (area === 'salteados' && cook) ? 'flex' : 'none';
  if (fryBox) fryBox.style.display = (area === 'frituras' && cook) ? 'flex' : 'none';
  const grid = document.getElementById('ingredients-grid');
  const filters = document.getElementById('pantry-tabs-bar');
  const stagePanel = document.getElementById('stage-panel');
  const custHub = document.getElementById('customers-container');
  if (custHub) custHub.style.display = (stagedOn(area) && getStage(area) === 'prod') ? 'none' : '';   // más espacio en Producción
  if (grid) grid.style.display = (cook || plateStage) ? '' : 'none';
  if (filters) filters.style.display = (cook && !mkStudio) ? '' : 'none';
  if (stagePanel) { const showPanel = !cook || mkStudio; stagePanel.style.display = showPanel ? 'flex' : 'none'; if (showPanel) renderStagePanel(); }
  if (!mkStudio && typeof mkRestoreOldBox === 'function') mkRestoreOldBox();       // la estación de siempre vuelve a su sitio
  try { renderToolStrip(); } catch (e) {}
}
