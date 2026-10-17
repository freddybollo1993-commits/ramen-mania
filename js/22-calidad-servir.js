/* Módulo 22-calidad-servir — Sistema de calidad y servir platos.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// --- Sistema de calidad ---
// Cada plato recibe un puntaje de 0 a 100 = cocción (50) + proceso (30) + frescura (20).
// Reglas duras: carbonizado o muy crudo = rechazado; crudo o quemado = máximo 1 estrella.
// Estrellas: 3 (85+), 2 (60+), 1 (desde la exigencia del cliente); por debajo, el cliente lo rechaza.
const QUALITY_FRESHNESS_ON = true;            // false = ignora la frescura (los platos no se enfrían)
const QUALITY_PAY_MULT = [0, 0.6, 1.0, 1.25]; // por estrellas
const QUALITY_REJECT_PATIENCE = 0.15;         // paciencia que pierde el cliente que rechaza
const CUSTOMER_PICKY = { Kenji: 0, Sakura: 5, Hiroshi: -8, Akemi: 0, Takeshi: 8, Yuki: 3, Ren: -3, Aoi: 5 };
// Frescura: [segundos desde que está listo, puntos]; se interpola entre puntos.
const FRESHNESS_CURVES = {
  ramen: [[0, 20], [8, 20], [20, 10], [40, 0]],
  salteados: [[0, 20], [8, 20], [20, 10], [40, 0]],
  frituras: [[0, 20], [6, 20], [18, 0]],
  frituras_plated: [[0, 20], [12, 20], [36, 0]], // el plato emplatado aguanta más: emplatar toma tiempo
  ramen_plated: [[0, 20], [14, 20], [30, 10], [55, 0]],
  salteados_plated: [[0, 20], [14, 20], [30, 10], [55, 0]],
  makis_plated: [[0, 20], [40, 20], [100, 10]],
  makis: [[0, 20], [30, 20], [90, 10]]
};

// Exigencia mínima (puntos) de un cliente: baja al inicio, sube con el nivel, y cada uno tiene su carácter.
function customerMinScore(name) {
  let base;
  if (isMultiplayerSession()) base = 35;
  else if (gameState.gameMode === 'NORMAL') base = 15 + currentLevelIndex * 5;
  else if ((gameState.gameMode === 'JAPON' && gameState.japon)) base = japonRunConfig().min_score;
  else base = 25 + Math.min(20, Math.floor(((gameState.rashLevel || 1) - 1) / 2));
  return Math.max(10, Math.min(60, base + (CUSTOMER_PICKY[name] || 0)));
}

// Puntos de cocción según el resultado y los segundos reales dentro de la ventana de la receta.
function evalCooking(dish) {
  const m = dish.meta || {};
  let ready, burn, black;
  if (dish.area === 'salteados') {
    const p = m.profile || WOK_PROFILE_DEFAULT;
    ready = p.crudo; burn = p.perfecto; black = p.quemado;
  } else if (dish.area === 'frituras') {
    const p = fryProfile(m.proteinId);
    ready = p.ready; burn = p.burn; black = p.black;
  } else {
    if (dish.area === 'ramen' && m.fry === 'PASADO') return { pts: 38, state: 'NA' };   // sofrito pasado de punto
    return { pts: 50, state: 'NA' }; // Ramen y Makis no se cocinan en el plato
  }
  const sec = m.secs, res = m.result || dish.quality;
  if (res === 'PERFECTO') {
    const f = (sec - ready) / (burn - ready);
    const base = (sec > 0 && f >= 0.3 && f <= 0.7) ? 50 : 40;
    return { pts: Math.max(0, base - WOK_DRY_PTS * (m.dry || 0) - (m.wrongTool ? WOK_WRONG_TOOL_PTS : 0) + (m.oilAdj || 0)), state: 'OK' };   // salteado: cada ronda de más seca y sala el plato; utensilio equivocado resta
  }
  if (res === 'CRUDO') {
    if (sec > 0 && sec < ready * 0.5) return { pts: 0, state: 'CRUDO', gate: 'muy crudo' };
    return { pts: Math.round(20 * Math.min(1, (sec || ready * 0.75) / ready)), state: 'CRUDO' };
  }
  // QUEMADO
  if (sec >= black) return { pts: 0, state: 'CARBONIZADO', gate: 'carbonizado' };
  return { pts: sec > 0 ? Math.max(0, Math.round(10 - 4 * (sec - burn))) : 5, state: 'QUEMADO' };
}

function evalProcess(dish) {
  const m = dish.meta || {};
  if (dish.area === 'ramen') {
    // con etapas: 6 pts de orden de armado + 14 de fideos bien repartidos + 10 de aceite de ajonjolí (si la receta lo lleva); sin etapas, 30 de orden como siempre
    if (typeof m.spread === 'number') return Math.max(0, 6 - 8 * (m.orderErrors || 0)) + Math.round(14 * Math.max(0, Math.min(1, m.spread))) + (m.oilMissing ? 0 : 10);
    return Math.max(0, 30 - 8 * (m.orderErrors || 0));
  }
  // con etapas: 10 pts de orden de armado + 14 de volteo (5 volteos = mezclado completo) + 6 de aceite; sin etapas, 30 de orden como siempre
  // Makis con etapas: 10 pts de orden (ya exigido al armar) + 14 de arroz extendido + 6 de flameado (los que no se flamean los ganan)
  if (dish.area === 'makis' && typeof m.mkProc === 'number') return m.mkProc;      // estudio de Makis: extender 4 + enrollar 10 + apretar 4 + cobertura 6 + flameado 6
  if (dish.area === 'makis' && typeof m.spread === 'number') return 10 + Math.round(14 * Math.max(0, Math.min(1, m.spread))) + (m.flamePts == null ? 6 : m.flamePts);
  // Frituras con etapas: 12 pts de orden (ya exigido) + 10 de escurrido + 8 de aceite caliente
  if (dish.area === 'frituras' && typeof m.drain === 'number') return 12 + Math.round(10 * Math.max(0, Math.min(1, m.drain))) + (m.cold ? 0 : 8);
  if (dish.area === 'salteados' && m.rscript && m.orderTotal) return Math.round(16 * m.orderMatches / m.orderTotal) + Math.round(14 * Math.max(0, Math.min(1, m.toss || 0)));
  if (dish.area === 'salteados' && typeof m.toss === 'number' && m.orderTotal) return Math.round(10 * m.orderMatches / m.orderTotal) + Math.round(14 * Math.max(0, Math.min(1, m.toss))) + (m.oilMissing ? 0 : 6);
  if (dish.area === 'salteados' && m.orderTotal) return Math.round(30 * m.orderMatches / m.orderTotal);
  return 30; // Makis y Frituras ya exigen su orden para poder terminar
}

function evalFreshness(dish) {
  if (!QUALITY_FRESHNESS_ON || isFree() || (isTraining() && !trainingFeature('q_fresh'))) return 20;
  const m = dish.meta || {};
  const warmth = (1 + [0, 0.3, 0.6, 1][getUpgradeLevel('bandeja')]) * (1 + Math.min(1.5, japonBuffSafe('fresh')));   // la bandeja caliente y los objetos de Japón (buff «fresh») alargan el tiempo antes de enfriarse
  const t = m.readyAt == null ? 0 : Math.max(0, gameState.gameClock - m.readyAt) / warmth;
  const pts = (dish.meta && dish.meta.plate && FRESHNESS_CURVES[dish.area + '_plated']) || FRESHNESS_CURVES[dish.area] || FRESHNESS_CURVES.ramen;
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, p0] = pts[i - 1], [t1, p1] = pts[i];
      return Math.round(p0 + (p1 - p0) * (t - t0) / (t1 - t0));
    }
  }
  return pts[pts.length - 1][1];
}

function evaluateDish(dish) {
  const plate = dish.meta && dish.meta.plate;
  const cook = evalCooking(dish), proc = evalProcess(dish), fresh = evalFreshness(dish);
  const capped = cook.state === 'CRUDO' || cook.state === 'QUEMADO';
  if (plate) {
    // con emplatado: cocción 40 + proceso 20 + emplatado 25 + frescura 15
    const wrong = plate.wrong || 0;
    let score = Math.round(cook.pts * 0.8 + proc * (2 / 3) + plate.pts + fresh * 0.75);
    if (wrong > 0) score = Math.max(0, Math.round(score * 0.45) - 8 * (wrong - 1));   // plato equivocado (faltan o sobran componentes): calidad muy baja
    return { score, cook, proc: Math.round(proc * 2 / 3), procRaw: proc, fresh,
      plate: plate.pts, plateErrors: plate.errors, wrong, gate: cook.gate || null, capped: capped || wrong > 0 };
  }
  return { score: Math.round(cook.pts + proc + fresh), cook, proc, fresh, gate: cook.gate || null, capped };
}

function qualityTier(ev, minScore = 35) {
  if (isTraining() && !trainingFeature('q_stars')) return 2; // aún sin estrellas: todo plato servido paga lo normal
  let t = 0;
  if (!(ev.gate || ev.score < minScore)) {
    t = ev.score >= 85 ? 3 : (ev.score >= 60 ? 2 : 1);
    if (ev.capped) t = Math.min(t, 1);
  }
  if (t === 0 && isTraining() && !trainingFeature('q_reject')) t = 1; // aún no hay rechazos
  if (t === 0 && isFree()) t = 1; // en cocina libre nadie rechaza un plato
  return t;
}

const starsText = t => ((isTraining() && !trainingFeature('q_stars')) ? '' : (t > 0 ? '⭐'.repeat(t) : '🚫'));

function rejectReason(ev) {
  if (ev.gate === 'carbonizado') return 'está carbonizado';
  if (ev.gate === 'muy crudo') return 'está crudo';
  if (ev.wrong) return 'no es el plato que pidió (le faltan o le sobran ingredientes)';
  return `la calidad no alcanza (${ev.score} pts)`;
}

// Muestra las estrellas que ganaría el plato listo en cada botón "Servir".
function updateServeButtonsQuality() {
  const ready = getReadyDishes();
  const setLabel = (btn, area, index) => {
    if (!btn) return;
    const d = ready.find(x => x.area === area && (index === undefined || x.index === index));
    if (d) btn.textContent = `✅ Servir ${starsText(qualityTier(evaluateDish(d)))}`;
  };
  const toPlate = btn => { if (btn) btn.textContent = '➡ A emplatar'; };
  [0, 1].forEach(i => {
    const b = document.getElementById(`wok-serve-btn-${i}`), w = gameState.woks[i];
    if (!stagedOn('salteados')) setLabel(b, 'salteados', i);
    else if (b && w && w.matchedRecipe && w.matchedRecipe.toPlate) b.textContent = '🥩 A Emplatar';     // pieza para el emplatado
    else if (b && w && w.matchedRecipe && w.matchedRecipe.isPart) b.textContent = '🍽 Combinar';     // parte de un plato de dos partes
    else toPlate(b);
  });
  const mb = document.getElementById('maki-serve-btn');
  if (stagedOn('makis')) toPlate(mb); else setLabel(mb, 'makis', 0);
  if (!stagedOn('frituras')) setLabel(document.querySelector('.fry-btn-serve'), 'frituras', 0);
}

function getReadyDishes() {
  const list = [];
  gameState.bowls.forEach((b, i) => {
    if (b && b.matchedRamen && !stagedOn('ramen')) list.push({ area: 'ramen', index: i, recipe: b.matchedRamen, quality: b.orderErrors ? 'ORDEN' : 'PERFECTO', label: `Tazón ${i + 1}`,
      meta: { orderErrors: b.orderErrors || 0, dashiBase: !!b.dashiBase, readyAt: b.readyAt } });
  });
  gameState.woks.forEach((w, i) => {
    if (w && w.result && w.matchedRecipe && !stagedOn('salteados')) list.push({ area: 'salteados', index: i, recipe: w.matchedRecipe, quality: w.result, label: `Wok ${i + 1}`,
      meta: { result: w.result, secs: w.stirSeconds, profile: w.profile, orderMatches: w.orderMatches, orderTotal: w.orderTotal, readyAt: w.readyAt } });
  });
  const roll = gameState.makiRoll;
  if (roll && roll.cutState === 'CUT' && !stagedOn('makis')) {
    const a = analyzeMakiSequence(roll.ingredients);
    if (a.status === 'READY') list.push({ area: 'makis', index: 0, recipe: a.recipe, quality: 'PERFECTO', label: 'Tabla de makis', meta: { readyAt: roll.readyAt } });
  }
  const fry = gameState.fryStation;
  if (!stagedOn('frituras') && fry && fry.phase === 'FRIED' && fryDishComplete()) {
    const a = analyzeFryStation();
    if (a.status === 'MATCHED') list.push({ area: 'frituras', index: 0, recipe: a.recipe, quality: fry.fryResult || 'PERFECTO', label: 'Tabla de frituras',
      meta: { result: fry.fryResult || 'PERFECTO', secs: fry.frySeconds, proteinId: fry.proteinId, readyAt: fry.readyAt } });
  }
  // áreas con etapas: el plato listo es el que ya está emplatado
  STAGE_AREAS.forEach(a => { if (stagedOn(a)) list.push(...stReadyDishes(a)); });
  return list;
}

function findReadyDishFor(recipe, ready) {
  const list = (ready || getReadyDishes()).filter(d => sameDish(d.recipe, recipe));
  if (!list.length) return null;
  return list.length === 1 ? list[0] : list.sort((a, b) => evaluateDish(b).score - evaluateDish(a).score)[0];   // si hay dos cuencos del mismo plato, sale el mejor
}

// Vacía la estación de la que salió el plato servido.
function consumeReadyDish(d) {
  if (d.staged) { stConsumePlated(d.area, d.index); renderPantryGrid(); return; }
  if (d.area === 'ramen') {
    gameState.bowls[d.index] = { ingredients: [], matchedRamen: null };
  } else if (d.area === 'salteados') {
    gameState.woks[d.index] = newWok(gameState.woks[d.index]);
    renderWoks();
  } else if (d.area === 'makis') {
    cleanupMakiToolDrag();
    gameState.makiRoll = newMakiRoll();
    renderMakiStation();
  } else if (d.area === 'frituras') {
    if (fryTimerInterval) { clearInterval(fryTimerInterval); fryTimerInterval = null; }
    cleanupFryItemDrag();
    cleanupFryKnifeDrag();
    gameState.fryStation = newFryStation();
    renderFryStation();
  }
  renderPantryGrid();
}

// Sirve el plato listo de una estación al cliente que más urgido esté y lo esté esperando.
function serveReadyDish(area, index) {
  const d = getReadyDishes().find(x => x.area === area && x.index === index);
  if (!d) return false;
  const waiting = [];
  gameState.customerSlots.forEach((c, ci) => {
    if (!c) return;
    const oi = c.orders.findIndex(o => !o.served && sameDish(o.recipe, d.recipe));
    if (oi !== -1) waiting.push({ ci, oi, ratio: c.patience / c.maxPatience });
  });
  if (!waiting.length) {
    showStationToast(`${AREA_ICONS[area]} Ningún cliente espera ${d.recipe.name} ahora.`);
    return false;
  }
  waiting.sort((a, b) => a.ratio - b.ratio);
  serveOrder(waiting[0].ci, waiting[0].oi, d);
  return true;
}

// Sirve el pedido `itemIndex` del cliente con lo que haya listo en esa receta; false si no hay nada.
function tryServeOrder(customerIndex, itemIndex) {
  const c = gameState.customerSlots[customerIndex];
  const o = c && c.orders[itemIndex];
  if (!o || o.served) return false;
  const d = findReadyDishFor(o.recipe);
  if (!d) return false;
  serveOrder(customerIndex, itemIndex, d);
  return true;
}

// Primer pedido pendiente del cliente que ya tiene plato listo (para tocar al cliente).
function tryServeAnyOrder(customerIndex) {
  const c = gameState.customerSlots[customerIndex];
  if (!c) return false;
  const ready = getReadyDishes();
  const idx = c.orders.findIndex(o => !o.served && findReadyDishFor(o.recipe, ready));
  return idx !== -1 && tryServeOrder(customerIndex, idx);
}

// Compatibilidad: servir con un tazón concreto.
function serveRamenToCustomer(customerIndex, itemIndex, bowlIndex) {
  const d = getReadyDishes().find(x => x.area === 'ramen' && x.index === bowlIndex);
  if (d) serveOrder(customerIndex, itemIndex, d);
}

// El cliente no acepta el plato: se descarta, pierde paciencia y, si no estaba quemado, aporta un recorte.
function rejectDish(customerIndex, c, orderItem, dish, ev) {
  const burnt = ev.cook.state === 'QUEMADO' || ev.cook.state === 'CARBONIZADO';
  loadAccountProgressLocal();
  statsDay().rj++; statsMistakes(ev); accountProgress.statsDirty = true;
  consumeReadyDish(dish);
  c.patience = Math.max(1, c.patience - c.maxPatience * QUALITY_REJECT_PATIENCE);
  playSound('burn');
  serveVfx(customerIndex, 0, 0);
  showStationToast(`🚫 ${c.name} rechazó ${orderItem.recipe.name}: ${rejectReason(ev)}.`);
  if (!burnt) addTrimmings(1, 'plato rechazado');
  if (isCoopActive() && dish.area === 'ramen') MultiplayerManager.syncSharedBowl(dish.index, gameState.bowls[dish.index]);
  renderBowls();
  renderCustomers();
}

function serveOrder(customerIndex, itemIndex, dish) {
  const c = gameState.customerSlots[customerIndex];
  if (!c || !dish) return;

  const orderItem = c.orders[itemIndex];
  if (!orderItem || orderItem.served || !sameDish(orderItem.recipe, dish.recipe)) return;

  const ev = evaluateDish(dish);
  const tier = qualityTier(ev, c.minScore != null ? c.minScore : 35);
  if (tier === 0) { rejectDish(customerIndex, c, orderItem, dish, ev); return; }

  let pay = Math.round(orderItem.recipe.price * QUALITY_PAY_MULT[tier]);
  if (dish.meta && dish.meta.dashiBase && orderItem.recipe.name === 'Vegetariano') pay = Math.round(pay * 1.2);
  pay = Math.round(pay * (1 + japonBuffSafe('price') + japonDishBonusSafe(orderItem.recipe.name)));
  serveVfx(customerIndex, pay, tier);
  orderItem.served = true;
  c._happyUntil = Date.now() + 1500; setTimeout(() => { try { renderCustomers(); } catch (e) {} }, 1600);   // cara contenta un instante (retrato dibujado)
  orderItem.quality = dish.quality;
  orderItem.stars = tier;
  orderItem.score = ev.score;
  trainingOnServe(orderItem.recipe.area || 'ramen', tier);
  statsRecordDish(orderItem.recipe, ev);
  c.worstTier = Math.min(c.worstTier == null ? 3 : c.worstTier, tier);
  consumeReadyDish(dish);
  gameState.money += pay;
  gameState.customersServed++;
  AnalyticsTracker.trackCustomerServed();
  playSound('serve');
  if (tier === 1 && (!isTraining() || trainingFeature('q_stars'))) {
    showStationToast(`${AREA_ICONS[dish.area]} ${orderItem.recipe.name}: ⭐ regular (${ev.score} pts) · paga S/ ${pay}.`);
  }

  // Integración Multijugador (VS Arrebato y Co-op)
  if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive) {
    if (MultiplayerManager.gameMode === 'VS') {
      MultiplayerManager.claimCustomerInVS(customerIndex, c.id || `cust_${customerIndex}`, orderItem.recipe.name, pay);
    } else if (MultiplayerManager.gameMode === 'COOP') {
      MultiplayerManager.coopServeCustomer(customerIndex, itemIndex, orderItem.recipe.name, pay, dish.index, dish.area);
      if (dish.area === 'ramen') {
        MultiplayerManager.syncSharedBowl(dish.index, gameState.bowls[dish.index]);
        MultiplayerManager.releaseStationLock(`bowl-card-${dish.index}`);
      }
    }
  }

  c.patience = Math.min(c.maxPatience, c.patience + (tier >= 2 ? 15 : 5));

  const allServed = c.orders.every(o => o.served);
  if (allServed) {
    // Propina: ninguna si algún plato fue de 1 estrella; doble si todos fueron de 3.
    const ratio = c.patience / c.maxPatience;
    const tipRate = ratio > 0.5 ? TIP_RATE_HAPPY : (ratio > 0.25 ? TIP_RATE_OK : 0);
    if (c.worstTier >= 2 && tipRate > 0 && !isTraining() && !isFree()) { // en el entrenamiento solo dan propina los retos
      const orderTotal = c.orders.reduce((t, o) => t + o.recipe.price, 0);
      const tip = Math.max(1, Math.round(orderTotal * tipRate * (c.worstTier === 3 ? 2 : 1) * (1 + japonBuffSafe('tips')) * (window.Taller ? Taller.tipMult() : 1)));      // secretos del chef y Propina de la casa
      addPropinas(tip);
      const card = document.getElementById(`cust-slot-card-${customerIndex}`);
      const cr = card ? card.getBoundingClientRect() : null;
      if (cr && cr.width) vfxText(`+${tip} 🧧`, cr.left + cr.width / 2, cr.top + cr.height + 4, '#ff8a65');
    }
    gameState.customerSlots[customerIndex] = null;
    closeCustomerOrderModal();
    shiftCustomersLeft(); // Mover la fila hacia la izquierda
  } else {
    if (gameState.selectedCustomerModalIndex === customerIndex) {
      openCustomerOrderModal(customerIndex);
    }
  }

  updateHUD();
  renderBowls();
  renderCustomers();
  if (isTraining()) trainingCheckComplete();

  if (gameState.gameMode === 'NORMAL') {
    const cfg = getCurrentLevelConfig();
    const th = getLevelStarThresholds(cfg);
    if (gameState.money >= th.star3 && gameState.customersLost <= 1) {
      showStationToast(`🌟 ¡PUNTUACIÓN MÁXIMA DE 3 ESTRELLAS ALCANZADA! (S/ ${gameState.money})`);
      winLevel();
    } else if (gameState.money >= cfg.goal && !gameState.metaReachedNoticeShown) {
      gameState.metaReachedNoticeShown = true;
      showStationToast(`⭐ ¡Meta base alcanzada (S/ ${gameState.money})! Sigue cocinando para ⭐⭐ y ⭐⭐⭐`);
    }
  } else if (gameState.gameMode === 'RASH') {
    gameState.rashCustomersServed++;
    const cfg = getCurrentLevelConfig();
    const activeCount = gameState.customerSlots.filter(s => s !== null).length;
    if (gameState.rashCustomersSpawned >= cfg.customers && activeCount === 0) {
      if (gameState.rashLives > 0) {
        winLevel();
      }
    }
  }
}

function selectBowl(index) {
  if (index >= bowlLimit()) { showStationToast('🔒 Este cuenco se abre completando más retos del entrenamiento.'); return; }
  if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
    if (gameState.activeBowlIndex !== index) {
      MultiplayerManager.releaseStationLock(`bowl-card-${gameState.activeBowlIndex}`);
    }
    if (!MultiplayerManager.requestStationLock(`bowl-card-${index}`)) return;
  }
  gameState.activeBowlIndex = index;
  renderBowls();
  renderPantryGrid();
}

// Orden del ramen: fideo → caldo (Shio, Tonkotsu o agua, según la receta) → salsa → proteína →
// complementos. Dentro de una misma etapa el orden es libre. Cada ingrediente puesto antes que otro de
// una etapa anterior es un error de orden: baja el puntaje de proceso del plato (8 puntos por error).
const RAMEN_STAGE_NAMES = ['fideo', 'caldo', 'salsa', 'proteína', 'complementos'];
// Errores de orden de un cuenco: lo servido desde la sartén lleva sus propios errores (bowl.panErrors)
function bowlOrderErrors(bowl) {
  const fromPan = bowl.panIds || [];
  return ramenOrderErrors(bowl.ingredients.filter(id => !fromPan.includes(id))) + (bowl.panErrors || 0);
}
function ramenStage(id) {
  if (id === 1) return 0;                 // fideo
  if (id >= 2 && id <= 4) return 1;       // caldo Shio, Tonkotsu o agua
  if (id >= 5 && id <= 10) return 2;      // salsas
  if (id >= 11 && id <= 16) return 3;     // proteínas (chasu, brisket, chancho, langostinos, huevo, tofu)
  return 4;                               // verduras, nori, ajonjolí…
}
// Cantidad de pares de ingredientes que quedaron al revés respecto al orden de etapas.
function ramenOrderErrors(ings) {
  let errors = 0;
  for (let i = 0; i < ings.length; i++) {
    for (let j = i + 1; j < ings.length; j++) {
      if (ramenStage(ings[i]) > ramenStage(ings[j])) errors++;
    }
  }
  return errors;
}

function toggleIngredientInBowl(ingId) {
  if (gameState.isPaused || gameState.isGameOver) return;
  if (gameState.activeBowlIndex >= bowlLimit()) { showStationToast('🔒 Este cuenco se abre completando más retos del entrenamiento.'); return; }
  const bowl = gameState.bowls[gameState.activeBowlIndex];

  if (stagedOn('ramen') && PAN_ONLY_IDS.includes(ingId) && !bowl.ingredients.includes(ingId)) { showStationToast('🍳 Eso se prepara en una sartén antes de servir al cuenco.'); return; }
  if (bowl.ingredients.includes(ingId)) {
    if ((bowl.panIds || []).includes(ingId)) { showStationToast('🍳 Eso ya se sirvió desde la sartén: vacía el cuenco para rehacerlo.'); return; }
    removeIngredientFromBowl(gameState.activeBowlIndex, ingId);
    return;
  }

  // Comprobación interactiva de stock para ingredientes de cocción
  // 1: Fideos Ramen, 2: Caldo Shio, 3: Caldo Tonkotsu, 11: Chasu Asado
  if (ingId === 1 && kitchenState.stocks.noodles <= 0) {
    triggerGuideHighlight('btn-cook-noodles');
    playSound('burn');
    showStationToast('🍜 ¡Sin fideos! Toca "Cocinar Fideos" para preparar una tanda.');
    return;
  }
  if (ingId === 2 && kitchenState.stocks.shio <= 0 && !(gameState.dashi > 0)) {
    triggerGuideHighlight('btn-heat-shio');
    playSound('burn');
    showStationToast(stagedOn('ramen') ? '🥣 ¡Está frío! Enciende la hornilla del Shio.' : '🥣 ¡Está Frío! Mantén presionado "Calentar Shio" 3 segundos.');
    return;
  }
  if (ingId === 3 && kitchenState.stocks.tonkotsu <= 0) {
    triggerGuideHighlight('btn-heat-tonkotsu');
    playSound('burn');
    showStationToast('🫕 ¡Está Frío! Mantén presionado "Calentar Tonkotsu" 3 segundos.');
    return;
  }
  if (ingId === 11 && kitchenState.stocks.chasu <= 0) {
    triggerGuideHighlight('btn-flame-chasu');
    playSound('burn');
    showStationToast('🥩 ¡Sin Chasu Asado! Mantén presionado "Flamear Chasu" para dorarlo.');
    return;
  }

  // Producción: el huevo marinado se gasta al ponerlo en el cuenco
  if (!stCookTake('ramen', ingId)) return;

  // Descontar del stock preparado si corresponde
  if (ingId === 1) kitchenState.stocks.noodles--;
  if (ingId === 2) {
    if (kitchenState.stocks.shio > 0) kitchenState.stocks.shio--;
    else { gameState.dashi--; bowl.dashiUsed = true; updateMottainaiHUD(); showStationToast('🐟 Dashi de recortes: Caldo Shio sin calentar.'); }
  }
  if (ingId === 3) kitchenState.stocks.tonkotsu--;
  if (ingId === 11) kitchenState.stocks.chasu--;
  updateKitchenStationsUI();

  const outOfOrder = bowl.ingredients.some(id => ramenStage(id) > ramenStage(ingId));
  bowl.ingredients.push(ingId);
  if (ingId === 1 && stagedOn('ramen')) { bowl.spread = 0; bowl.stirX = null; noodleTip(); }   // los fideos caen apelmazados
  if (ingId === 2 && stagedOn('ramen') && typeof bowl.spread === 'number') bowl.spread = Math.min(bowl.spread, 0.25);   // al verter el caldo hay que mover los fideos con él
  bowl.orderErrors = bowlOrderErrors(bowl);
  playSound('add');
  if (outOfOrder) showStationToast('🍜 Orden del ramen: fideo → caldo → salsa → proteína → complementos. Este ingrediente llegó tarde (−8 pts de proceso).');
  if (ingId === 4 && gameState.dashi > 0) {
    gameState.dashi--;
    bowl.dashiBase = true;
    updateMottainaiHUD();
    showStationToast('🐟 Dashi casero en el caldo: el ramen Vegetariano se paga +20 %.');
  }

  if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
    MultiplayerManager.syncSharedBowl(gameState.activeBowlIndex, bowl);
  }

  const analysis = analyzeBowl(gameState.activeBowlIndex);
  if (analysis.status === "READY") {
    playSound('match');
  }

  renderBowls();
  renderCustomers();
  renderPantryGrid();
}

function removeIngredientFromBowl(bowlIndex, ingId) {
  const bowl = gameState.bowls[bowlIndex];
  bowl.ingredients = bowl.ingredients.filter(id => id !== ingId);
  if (ingId === 1) { delete bowl.spread; bowl.stirX = null; }
  bowl.orderErrors = bowlOrderErrors(bowl);

  // Restaurar stock si se retira un ingrediente preparado
  if (ingId === 1) kitchenState.stocks.noodles++;
  if (ingId === 4 && bowl.dashiBase) { bowl.dashiBase = false; gameState.dashi++; updateMottainaiHUD(); }
  if (ingId === 2) {
    if (bowl.dashiUsed) { bowl.dashiUsed = false; gameState.dashi++; updateMottainaiHUD(); }
    else kitchenState.stocks.shio++;
  }
  if (ingId === 3) kitchenState.stocks.tonkotsu++;
  if (ingId === 11) kitchenState.stocks.chasu++;
  stCookRefund('ramen', ingId);
  updateKitchenStationsUI();

  if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
    MultiplayerManager.syncSharedBowl(bowlIndex, bowl);
  }

  playSound('trash');
  renderBowls();
  renderCustomers();
}
