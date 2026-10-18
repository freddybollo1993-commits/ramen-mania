/* Módulo 13-areas-despensa-arrastre — Áreas, categorías, despensa y arrastre de ingredientes.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// Un área se abre cuando ya hay algún plato suyo en el menú del nivel (o ronda) actual.
function isAreaUnlocked(area) {
  if (isFree()) return true;
  if (isMultiplayerSession()) return mpAreas().includes(area) && (!mpRashRound() || area === 'ramen' || getUnlockedRecipes().some(r => r.area === area));   // Rash en equipo: las áreas se abren por ronda
  if ((gameState.gameMode === 'JAPON' && gameState.japon)) return japonRunAreas().includes(area);
  if (isTraining() && area !== 'ramen' && !trainingFeature('area_' + area)) return false;
  return area === 'ramen' || getUnlockedRecipes().some(r => r.area === area);
}

function areaUnlockHint(area) {
  if ((gameState.gameMode === 'JAPON' && gameState.japon)) return 'esta jornada (elige más áreas al empezar)';
  if (isTraining()) return 'el entrenamiento (completa los retos anteriores)';
  const list = AREA_DISH_UNLOCKS[area] || [];
  const campaign = gameState.gameMode === 'NORMAL';
  const min = Math.min(...list.map(d => (campaign ? d[1] : d[2])));
  return campaign ? `nivel ${min}` : `la ronda ${min}`;
}

function renderAreaTabs() {
  const container = document.getElementById('kitchen-area-tabs');
  if (!container) return;
  container.innerHTML = KITCHEN_AREAS.filter(area => !isMultiplayerSession() || mpAreas().includes(area.id)).map(area => {
    const unlocked = isAreaUnlocked(area.id);
    return `<button class="kitchen-area-tab-btn ${gameState.activeArea === area.id ? 'active' : ''} ${unlocked ? '' : 'locked'}" data-area="${area.id}" data-alert="${unlocked ? getAreaAlert(area.id) : ''}" ${unlocked ? '' : `title="Se desbloquea en ${areaUnlockHint(area.id)}" aria-disabled="true"`} onclick="switchKitchenArea('${area.id}')">${unlocked ? '' : '🔒 '}${area.label}<i class="area-dot"></i></button>`;
  }).join('');
}

function renderCategoryFilters() {
  const container = document.getElementById('pantry-tabs-bar');
  if (!container) return;
  const areaIngredients = stagedOn(gameState.activeArea) ? getUnlockedIngredients() : INGREDIENTES.filter(i => i.areas && i.areas.includes(gameState.activeArea));
  const catsPresent = new Set(areaIngredients.map(i => i.cat));
  const orderedCats = ['bases', 'salsas', 'proteinas', 'vegetales', 'otros'].filter(c => catsPresent.has(c));
  let html = `<button class="mini-cat-btn ${gameState.currentCategory === 'todos' ? 'active' : ''}" onclick="filterCategory('todos')">Todos</button>`;
  orderedCats.forEach(cat => {
    html += `<button class="mini-cat-btn ${gameState.currentCategory === cat ? 'active' : ''}" onclick="filterCategory('${cat}')">${CATEGORY_LABELS[cat] || cat}</button>`;
  });
  container.innerHTML = html;
}

function filterCategory(cat) {
  gameState.currentCategory = cat;
  document.querySelectorAll(".mini-cat-btn, .pantry-tab").forEach(tab => {
    const onclickAttr = tab.getAttribute("onclick") || "";
    if (onclickAttr.includes(`'${cat}'`)) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
  renderPantryGrid();
}

// --- Agregar ingredientes arrastrando ---
// El jugador mantiene pulsado un ingrediente y lo arrastra hasta el plato (cuenco, wok, tabla de
// makis o mesa de frituras). La imagen del ingrediente sigue al puntero mientras se arrastra.
// Con el mouse el arrastre empieza al mover; con el dedo, al mantener ~160ms quieto (si el dedo se
// mueve antes, se interpreta como scroll del panel). Un toque simple solo sirve para retirar un
// ingrediente que ya está en el plato activo.
const DRAG_TOUCH_HOLD_MS = 60;     // con el dedo el arrastre empieza casi al instante (antes 160 ms)
const DRAG_MOUSE_START_PX = 5;
const DRAG_TOUCH_CANCEL_PX = 14;
const DRAG_TOUCH_GHOST_OFFSET_Y = 34; // el fantasma se muestra sobre el dedo para no taparlo
let ingredientDrag = null;                  // arrastre "principal" (el último); la Frituras solo usa este
const ingredientDrags = new Map();         // pointerId -> arrastre: cada dedo / mano lleva el suyo, así se pueden mover varios ingredientes a la vez
let lastDragHintAt = 0;
function ingredientDragActive() { for (const d of ingredientDrags.values()) if (d.active) return true; return false; }

document.addEventListener('touchmove', (e) => {
  if (ingredientDragActive() && e.cancelable) e.preventDefault();
}, { passive: false });

function getIngredientDropTargets() {
  const area = gameState.activeArea;
  if (stagedOn(area) && getStage(area) === 'plate') return Array.from(document.querySelectorAll('.plate-bowl'));   // Emplatar: los dos cuencos
  if (getStage(area) !== 'cook') return [];
  const sel = area === 'ramen' ? '.bowl-dock-card, .stove-pan'
    : area === 'salteados' ? '.wok-dock-card'
    : area === 'makis' ? (mkStaged() ? mkDropSelector() : '#maki-board-zone')
    : area === 'frituras' ? (stagedOn('frituras') ? '#fry-table-card, #fry-oil-card, #fry-pan-zone' : '#fry-table-card')
    : null;
  return sel ? Array.from(document.querySelectorAll(sel)) : [];
}

function getIngredientDragPoint(d) {
  return { x: d.x, y: d.pointerType === 'mouse' ? d.y : d.y - DRAG_TOUCH_GHOST_OFFSET_Y };
}

function findIngredientDropTarget(d) {
  const p = getIngredientDragPoint(d);
  const el = document.elementFromPoint(p.x, p.y);
  if (!el) return null;
  return getIngredientDropTargets().find(t => t === el || t.contains(el)) || null;
}

function isIngredientInActiveDish(ingId) {
  const area = gameState.activeArea;
  if (stagedOn(area) && getStage(area) === 'plate') return false;
  if (area === 'makis') return mkStaged() ? mkBuildHas(ingId) : gameState.makiRoll.ingredients.includes(ingId);
  if (area === 'salteados') return gameState.woks[gameState.activeWokIndex].ingredients.includes(ingId);
  if (area === 'frituras') return gameState.fryStation.ingredients.includes(ingId);
  const bowl = gameState.bowls[gameState.activeBowlIndex];
  return !!bowl && bowl.ingredients.includes(ingId);
}

// Quita el ingrediente del plato activo (las funciones toggle retiran si ya está dentro).
function removeIngredientFromActiveDish(ingId) {
  const area = gameState.activeArea;
  if (area === 'makis') { if (mkStaged() && mkRemoveFromBuild(ingId)) return; toggleIngredientInMaki(ingId); }
  else if (area === 'salteados') toggleIngredientInWok(ingId);
  else if (area === 'frituras') toggleIngredientInFryStation(ingId);
  else toggleIngredientInBowl(ingId);
}

function handleIngredientTap(ing) {
  if (isIngredientInActiveDish(ing.id)) {
    removeIngredientFromActiveDish(ing.id);
    return;
  }
  const now = Date.now();
  if (now - lastDragHintAt > 5000) {
    lastDragHintAt = now;
    showStationToast('👆 Mantén pulsado el ingrediente y arrástralo hasta el plato.');
  }
}

function applyIngredientDrop(target, ing, coat) {
  const area = gameState.activeArea;
  if (stagedOn(area) && getStage(area) === 'plate') {                       // Emplatar: cada ingrediente cae en el cuenco donde se suelta (varios a la vez con varios dedos)
    if (target.classList.contains('plate-bowl')) stPlateAddItem(area, parseInt(target.dataset.slot, 10), ing.id);
    return;
  }
  if (area === 'ramen') {
    if (target.classList.contains('stove-pan')) { panAdd(parseInt(target.dataset.pan, 10), ing.id); return; }
    if (stagedOn('ramen') && PAN_ONLY_IDS.includes(ing.id)) { showStationToast(`🍳 ${ing.display} se prepara en una sartén: arrástralo a la Sartén 1 o 2.`); return; }
    const idx = parseInt(target.id.replace('bowl-card-', ''), 10);
    if (gameState.activeBowlIndex !== idx) selectBowl(idx);
    if (gameState.activeBowlIndex !== idx) return; // bloqueado por otro jugador (coop)
    if (gameState.bowls[idx].ingredients.includes(ing.id)) {
      showStationToast(`${ing.display} ya está en este cuenco.`);
      return;
    }
    toggleIngredientInBowl(ing.id);
  } else if (area === 'salteados') {
    const idx = parseInt(target.id.replace('wok-card-', ''), 10);
    selectWok(idx);
    const wok = gameState.woks[idx];
    if (wok.result) {
      showStationToast('Ese wok ya está salteado: vacíalo para armar otro plato.');
      return;
    }
    if (wok.ingredients.includes(ing.id)) {
      if (!wokAddExtra(idx, ing.id)) showStationToast(`${ing.display} ya está en este wok.`);
      return;
    }
    toggleIngredientInWok(ing.id);
  } else if (area === 'makis') {
    if (mkStaged() && mkDropIngredient(ing, target)) return;                  // armado en el estudio (esterilla, arroz, nori, rellenos, pescado)
    if (gameState.makiRoll.ingredients.includes(ing.id)) {
      showStationToast(`${ing.display} ya está en el rollo.`);
      return;
    }
    toggleIngredientInMaki(ing.id);
  } else if (area === 'frituras') {
    if (target && target.id === 'fry-pan-zone') {
      if (ing.id === 83) fryPanAdd(ing); else showStationToast('♨️ La sartén es para la salsa kare.');
      return;
    }
    if (stagedOn('frituras') && ing.id === 83) { showStationToast('🍛 La salsa kare se calienta primero en la sartén (hornilla 2).'); return; }
    // La proteína llega con el empanizado que consiguió al pasar por los tres espacios.
    if (FRY_PROTEIN_IDS.includes(ing.id)) {
      placeFryProtein(ing, coat || 0);
      const stn = gameState.fryStation;
      if (target && target.id === 'fry-oil-card' && stagedOn('frituras') && stn.proteinId === ing.id && stn.phase === 'BUILDING') {      // directo de la despensa al aceite (alitas, kaarage)
        if (fryNeedsBread() || fryNeedsArrange()) showStationToast('🥖 Esa proteína va empanizada: déjala en la tabla y pásala por las bandejas.');
        else startFryingFromBoard();
      }
      return;
    }
    const station = gameState.fryStation;
    if (station.phase === 'FRYING') {
      showStationToast('La olla está en uso: retira la proteína para seguir.');
      return;
    }
    if (station.ingredients.includes(ing.id)) {
      showStationToast(`${ing.display} ya está en la tabla.`);
      return;
    }
    toggleIngredientInFryStation(ing.id);
  }
}

// --- Empanizado: mientras se arrastra una proteína en Frituras, pasar por la harina, el huevo y
// el panko (en ese orden, ~0.45 s sobre cada espacio) la va cubriendo; el dibujo que sigue al
// dedo cambia en cada paso. Se suelta sobre la tabla ya empanizada.
function setFryBreadingUi(on, coat, max) {
  const mx = max != null ? max : 3, slots = Array.from(document.querySelectorAll('.fry-bread-slot'));
  slots.forEach((slot, i) => {
    slot.classList.toggle('slot-done', !!on && i < coat);
    slot.classList.toggle('slot-next', !!on && i === coat && coat < mx);
    if (!on) slot.classList.remove('is-dwelling');
  });
}

function updateBreadingDwell() {
  const d = ingredientDrag;
  if (!d || !d.active || d.coat === undefined) return;
  const p = getIngredientDragPoint(d);
  const slots = Array.from(document.querySelectorAll('.fry-bread-slot'));
  let slotIdx = -1;
  slots.forEach((slot, i) => {
    const r = slot.getBoundingClientRect();
    if (p.x >= r.left - 6 && p.x <= r.right + 6 && p.y >= r.top - 8 && p.y <= r.bottom + 14) slotIdx = i;
  });

  const maxCoat = d.maxCoat != null ? d.maxCoat : 3;
  if (slotIdx !== -1 && slotIdx === d.coat && d.coat < maxCoat) {
    if (d.dwellIdx !== slotIdx) { d.dwellIdx = slotIdx; d.dwellStart = performance.now(); }
    const prog = Math.min(1, (performance.now() - d.dwellStart) / BREAD_DWELL_MS);
    slots[slotIdx].style.setProperty('--p', prog.toFixed(2));
    slots[slotIdx].classList.add('is-dwelling');
    if (prog >= 1) {
      d.coat++;
      d.dwellIdx = -1;
      slots[slotIdx].classList.remove('is-dwelling');
      if (d.ghost) d.ghost.innerHTML = fryItemMarkup(d.ing.id, d.coat);
      setFryBreadingUi(true, d.coat, maxCoat);
      playSound(['pat', 'splat', 'crunch'][d.coat - 1] || 'add'); // harina, huevo, panko
    }
  } else {
    if (d.dwellIdx !== undefined && d.dwellIdx !== -1 && slots[d.dwellIdx]) slots[d.dwellIdx].classList.remove('is-dwelling');
    d.dwellIdx = -1;
    if (slotIdx > d.coat && d.coat < maxCoat && performance.now() - (d.lastHint || 0) > 2500) {
      d.lastHint = performance.now();
      showStationToast(`🥖 Primero pásala por ${FRY_BREAD_NAMES[d.coat]}.`);
    }
  }
}

function moveIngredientGhost(d) {
  if (!d || !d.ghost) return;
  const p = getIngredientDragPoint(d);
  d.ghost.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(1.15)`;
}

function updateIngredientDropHover(d) {
  if (!d) return;
  const target = findIngredientDropTarget(d);
  if (d.hoverEl && d.hoverEl !== target) d.hoverEl.classList.remove('drop-hover');
  if (target) target.classList.add('drop-hover');
  d.hoverEl = target;
}

function activateIngredientDrag(d) {
  if (!d || d.active) return;
  if (d.holdTimer) { clearTimeout(d.holdTimer); d.holdTimer = null; }
  d.active = true;
  ingredientDrag = d;

  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  ghost.innerHTML = ingCtxImg(d.ing) ? `<img src="${ingCtxImg(d.ing)}" alt="">` : d.ing.icon;
  document.body.appendChild(ghost);
  d.ghost = ghost;

  // Proteína en Frituras: el dibujo que sigue al dedo se va empanizando al pasar por los espacios.
  if (gameState.activeArea === 'frituras' && FRY_PROTEIN_IDS.includes(d.ing.id) && !stagedOn('frituras')) {
    d.coat = 0;
    d.maxCoat = d.ing.id === 71 ? 1 : 3;                 // el poro solo pasa por la harina
    d.dwellIdx = -1;
    ghost.innerHTML = fryItemMarkup(d.ing.id, 0);
    setFryBreadingUi(true, 0, d.maxCoat);
    d.breadTimer = setInterval(updateBreadingDwell, 50);
  }

  try { playSound('tap'); } catch (e) {}
  d.tile.classList.add('dragging-source');
  document.body.classList.add('is-dragging-ingredient');
  getIngredientDropTargets().forEach(el => el.classList.add('drop-target-ready'));
  moveIngredientGhost(d);
  updateIngredientDropHover(d);
  try { if (navigator.vibrate) navigator.vibrate(12); } catch (err) {}
}

// Sin argumento cancela todos los arrastres; con un arrastre, solo ese
function cleanupIngredientDrag(d) {
  if (!d) { [...ingredientDrags.values()].forEach(x => cleanupIngredientDrag(x)); return; }
  if (d.holdTimer) clearTimeout(d.holdTimer);
  if (d.breadTimer) { clearInterval(d.breadTimer); setFryBreadingUi(false, 0); }
  if (d.ghost) d.ghost.remove();
  if (d.tile) d.tile.classList.remove('dragging-source');
  if (d.hoverEl) d.hoverEl.classList.remove('drop-hover');
  ingredientDrags.delete(d.pointerId);
  if (ingredientDrag === d) ingredientDrag = [...ingredientDrags.values()].pop() || null;
  if (!ingredientDrags.size) {
    document.removeEventListener('pointermove', onIngredientPointerMove);
    document.removeEventListener('pointerup', onIngredientPointerUp);
    document.removeEventListener('pointercancel', onIngredientPointerCancel);
  }
  if (!ingredientDragActive()) {
    document.querySelectorAll('.drop-target-ready').forEach(el => el.classList.remove('drop-target-ready', 'drop-hover'));
    document.body.classList.remove('is-dragging-ingredient');
  }
}

function onIngredientPointerMove(e) {
  const d = ingredientDrags.get(e.pointerId);
  if (!d) return;
  d.x = e.clientX;
  d.y = e.clientY;
  if (!d.active) {
    const dist = Math.hypot(d.x - d.startX, d.y - d.startY);
    if (d.pointerType === 'mouse') {
      if (dist > DRAG_MOUSE_START_PX) activateIngredientDrag(d);
    } else if (dist > DRAG_TOUCH_CANCEL_PX) {
      cleanupIngredientDrag(d); // el dedo se movió antes de mantener: es un scroll del panel
    }
    return;
  }
  moveIngredientGhost(d);
  updateIngredientDropHover(d);
}

function onIngredientPointerUp(e) {
  const d = ingredientDrags.get(e.pointerId);
  if (!d) return;
  d.x = e.clientX;
  d.y = e.clientY;
  const ing = d.ing;
  const moved = Math.hypot(d.x - d.startX, d.y - d.startY);
  const target = d.active ? findIngredientDropTarget(d) : null;
  const coat = d.coat || 0;
  const fryProteinDrag = d.coat !== undefined;
  const wasActive = d.active;
  cleanupIngredientDrag(d);
  if (target) {
    applyIngredientDrop(target, ing, coat);
  } else if (fryProteinDrag && wasActive && moved >= 12) {
    showStationToast(coat > 0
      ? '🥖 Suelta la proteína sobre la tabla de cocina para dejarla lista.'
      : 'Pasa la proteína por la harina, el huevo y el panko y suéltala en la tabla.');
  } else if (moved < 12) {
    handleIngredientTap(ing); // toque simple (o mantener sin mover)
  }
}

function onIngredientPointerCancel(e) {
  const d = ingredientDrags.get(e.pointerId);
  if (d) cleanupIngredientDrag(d);
}

function beginIngredientPress(e, tile, ing) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (gameState.isPaused || gameState.isGameOver) return;
  if (tile.classList.contains('dragging-source')) return;      // ese ingrediente ya lo lleva otra mano
  const old = ingredientDrags.get(e.pointerId);
  if (old) cleanupIngredientDrag(old);
  const d = {
    ing, tile,
    pointerId: e.pointerId,
    pointerType: e.pointerType,
    startX: e.clientX, startY: e.clientY,
    x: e.clientX, y: e.clientY,
    active: false, ghost: null, hoverEl: null, holdTimer: null
  };
  ingredientDrags.set(e.pointerId, d);
  ingredientDrag = d;
  if (e.pointerType !== 'mouse') {
    d.holdTimer = setTimeout(() => {
      if (ingredientDrags.get(d.pointerId) === d && !d.active) activateIngredientDrag(d);
    }, DRAG_TOUCH_HOLD_MS);
  }
  document.addEventListener('pointermove', onIngredientPointerMove);
  document.addEventListener('pointerup', onIngredientPointerUp);
  document.addEventListener('pointercancel', onIngredientPointerCancel);
}

function attachIngredientDrag(tile, ing) {
  tile.addEventListener('contextmenu', (e) => e.preventDefault());
  tile.addEventListener('pointerdown', (e) => beginIngredientPress(e, tile, ing));
}

function renderPantryGrid() {
  renderAreaTabs();
  renderStageTabs();
  renderCategoryFilters();
  const container = document.getElementById("ingredients-grid");
  if (!container) return;
  container.innerHTML = "";
  const currentBowl = gameState.bowls[gameState.activeBowlIndex] || { ingredients: [] };
  const plateStage = stagedOn(gameState.activeArea) && getStage(gameState.activeArea) === 'plate';
  const unlocked = getUnlockedIngredients();

  const countBadge = document.getElementById("hud-unlocked-count");
  if (countBadge) countBadge.textContent = `${unlocked.length} ingredientes disponibles`;

  const filtered = unlocked.filter(ing => {
    if (plateStage || gameState.currentCategory === 'todos') return true;
    return ing.cat === gameState.currentCategory;
  });

  // Ajuste dinámico de columnas y tamaños según la cantidad de ingredientes liberados / mostrados
  let cols = 6;
  let tileMinH = "52px";
  let tilePad = "4px 2px";
  let iconSz = "25px";
  let nameSz = "9.5px";

  const total = filtered.length;
  if (total <= 12) {
    cols = total <= 8 ? Math.max(6, total) : 6;
    tileMinH = "52px";
    tilePad = "4px 2px";
    iconSz = "25px";
    nameSz = "9.5px";
  } else if (total <= 16) {
    cols = 8;
    tileMinH = "48px";
    tilePad = "3px 2px";
    iconSz = "22px";
    nameSz = "9px";
  } else {
    // Hasta 22 ingredientes caben en 2 filas de 11; más de eso, máximo 10 columnas y 3 filas
    // (para hasta 28-30 ingredientes).
    cols = total <= 22 ? 11 : (total <= 30 ? 10 : 12); // 31-36 (Salteado) en 3 filas de 12, sin scroll
    tileMinH = "42px";
    tilePad = "2px 1px";
    iconSz = "19px";
    nameSz = total > 30 ? "7.2px" : "8.5px";
  }

  if (gameState.activeArea === 'makis' && stagedOn('makis') && getStage('makis') === 'cook') {   // estudio de Makis: despensa en UNA fila compacta (el estudio necesita la altura)
    cols = Math.max(6, Math.min(total, 14)); tileMinH = '38px'; tilePad = '2px 1px'; iconSz = '16px'; nameSz = '7.5px';
  }
  container.style.setProperty('--ing-cols', cols);
  container.style.setProperty('--tile-min-h', tileMinH);
  container.style.setProperty('--tile-pad', tilePad);
  container.style.setProperty('--icon-sz', iconSz);
  container.style.setProperty('--name-sz', nameSz);

  const isMakisArea = gameState.activeArea === 'makis';
  const isSalteadosArea = gameState.activeArea === 'salteados';
  const isFriturasArea = gameState.activeArea === 'frituras';
  filtered.forEach(ing => {
    const tile = document.createElement("div");
    const isInBowl = plateStage ? false : isMakisArea
      ? (mkStaged() ? mkBuildHas(ing.id) : gameState.makiRoll.ingredients.includes(ing.id))
      : isSalteadosArea
      ? gameState.woks[gameState.activeWokIndex].ingredients.includes(ing.id)
      : isFriturasArea
      ? gameState.fryStation.ingredients.includes(ing.id)
      : currentBowl.ingredients.includes(ing.id);

    tile.className = `ing-station-tile ${isInBowl ? "in-active-bowl" : ""}`;
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', ing.display);
    tile.title = `${ing.display} (${isInBowl ? "En uso - Toca para retirar" : "Mantén y arrastra al plato"})`;
    attachIngredientDrag(tile, ing);

    const artSrc = ingCtxImg(ing);
    const artHtml = artSrc 
      ? `<img src="${artSrc}" class="pixel-sprite-large" alt="${ing.display}" style="width:${iconSz}; height:${iconSz};">`
      : `<div class="ing-tile-icon">${ing.icon}</div>`;

    let stockBadgeHtml = '';
    const stockVal = getIngredientStock(ing.id);
    if (stockVal !== null) {
      stockBadgeHtml = `<div class="ing-stock-badge ${stockVal <= 0 ? 'stock-zero' : ''}" id="stock-badge-ing-${ing.id}">${stockVal}</div>`;
    }

    tile.innerHTML = `
      ${artHtml}
      <div class="ing-tile-name">${ing.short || ing.display}</div>
      ${stockBadgeHtml}
    `;
    container.appendChild(tile);
  });
}

// Ajuste de altura de la cocina: si la estación de abajo (woks, olla, tabla…) no cabe en la pantalla útil (p. ej. Salteado con 26 insumos en 873×393),
// la despensa cede esa altura y se desplaza por dentro (ya tiene overflow: auto). Solo actúa cuando algo se sale; no cambia nada si todo cabe.
function fitKitchenHeight() {
  const g = document.getElementById('ingredients-grid');
  if (!g) return;
  g.style.maxHeight = '';
  const dock = document.querySelector('.kitchen-bottom-dock');
  if (!dock || !dock.offsetHeight) return;
  const over = dock.getBoundingClientRect().bottom - window.innerHeight;
  if (over > 2) g.style.maxHeight = Math.max(84, Math.floor(g.getBoundingClientRect().height - over)) + 'px';
}
(function () {
  const base = renderPantryGrid;
  renderPantryGrid = function () { base.apply(this, arguments); fitKitchenHeight(); try { requestAnimationFrame(fitKitchenHeight); } catch (e) {} setTimeout(fitKitchenHeight, 250); };
  window.addEventListener('resize', () => setTimeout(fitKitchenHeight, 150));
})();
