/* Módulo 05-menu-recetas-areas — Configuración de niveles, platos y menús por área.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

/** Configuración de una ronda de Rash (1-100). Calibrada con tools/simular-rash.cjs: un jugador excelente puede llegar a la ronda 100, uno experto a la ~58,
 *  uno competente a la ~20 y un aprendiz a la ~14 (estimación; la capacidad real del jugador se confirma jugando).
 *  La paciencia usa la misma fórmula que el resto del juego (25 s + 2,5 s por ingrediente + proceso de cada área, ver spawnCustomer) multiplicada por patience_mult,
 *  que baja con las rondas; así depende de cuántos platos pide el cliente y de qué áreas están abiertas. */
function getRashConfig(lvl) {
  const customers = 8 + (lvl - 1) * 3;
  const patienceMult = Math.max(0.42, 1 - (lvl - 1) * 0.006);
  let maxOrders = 1;
  if (lvl >= 55) maxOrders = 3;
  else if (lvl >= 20) maxOrders = 2;

  let maxCustomers = 2;
  if (lvl >= 38) maxCustomers = 4;
  else if (lvl >= 16) maxCustomers = 3;

  let ramenNames = [];
  if (lvl <= 5) ramenNames = ["Shio", "Shoyu"];
  else if (lvl <= 15) ramenNames = ["Shio", "Shoyu", "Miso", "Chashu"];
  else if (lvl <= 30) ramenNames = ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"];
  else if (lvl <= 50) ramenNames = ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru"];
  else ramenNames = ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru", "Vegetariano"];

  const spawnTime = Math.max(1.4, Math.round((6 - (lvl - 1) * 0.05) * 10) / 10);
  return {
    level: lvl,
    name: `Modo Rash - Ronda ${lvl}`,
    customers: customers,
    lives: Math.round(5 + (lvl - 1) * 0.8),
    patience_mult: patienceMult,
    base_patience: Math.round(patienceMult * 47),     // solo informativo (un plato de ~9 ingredientes de Ramen); la paciencia real sale de spawnCustomer
    max_orders: maxOrders,
    max_customers: maxCustomers,
    ramen_names: ramenNames,
    spawn_time: spawnTime
  };
}

/** Ronda actual del Rash cooperativo online (0 si la sala no juega Rash). */
function mpRashRound() {
  return (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.rash && MultiplayerManager.winCondition.type === 'RASH') ? (MultiplayerManager.rash.round || 1) : 0;
}

/** Rash en equipo (Online cooperativo): la ronda de Rash escalada al número de chefs. Más chefs → más clientes y más seguidos, hasta 4 en la barra, y algo más de vidas compartidas.
 *  Calibrada con tools/simular-rash.cjs --equipo. @param {number} round 1-100 @param {number} n chefs (2-4) */
function rashTeamConfig(round, n) {
  const b = getRashConfig(round), k = Math.max(1, Math.min(4, n || 2)) - 1, f = 1 + 0.9 * k;
  return Object.assign({}, b, {
    name: `Rash en equipo - Ronda ${round}`,
    customers: Math.ceil(b.customers * f),
    patience_mult: b.patience_mult * (1 - 0.07 * k),
    spawn_time: Math.max(1, Math.round(b.spawn_time / f * 10) / 10),
    max_customers: Math.min(4, b.max_customers + k),
    max_orders: Math.min(3, b.max_orders + (k >= 2 && round >= 10 ? 1 : 0)),
    lives: Math.round(b.lives * (1 + 0.35 * k))
  });
}

/** Compensación extra de Rash por hitos: cada 5 rondas superadas (10 + ronda propinas) y el triple en las rondas 25, 50, 75 y 100. 0 si la ronda no es un hito. */
function rashMilestoneBonus(round) {
  if (!(round > 0) || round % 5 !== 0) return 0;
  return (10 + round) * (round % 25 === 0 ? 3 : 1);
}

function getCurrentLevelConfig() {
  if (isTraining()) return trainingConfig();
  if (isFree()) return freeConfig();
  if ((gameState.gameMode === 'JAPON' && gameState.japon)) return japonRunConfig();
  if (isMultiplayerSession()) {
    if (mpRashRound()) return rashTeamConfig(mpRashRound(), MultiplayerManager.players.length);   // Rash en equipo: la ronda escalada a los chefs
    return {
      level: 99,
      name: "Servicio Multijugador",
      customers: 999,
      base_patience: 45,        // con etapas cada pedido tarda más: más paciencia y llegadas más espaciadas
      max_orders: 2,
      max_customers: 4,
      ramen_names: RECETAS_RAMEN.map(r => r.name),
      spawn_time: 6
    };
  }
  if (gameState.gameMode === 'RASH') {
    return getRashConfig(gameState.rashLevel || 1);
  }
  return NIVELES[currentLevelIndex];
}

function isMultiplayerSession() {
  return typeof MultiplayerManager !== 'undefined' && (MultiplayerManager.isGameActive || (MultiplayerManager.isInMultiplayer && !MultiplayerManager.queueActive));   // buscando partida global aún no es una partida: el resto del juego se comporta normal
}

// Áreas de cocina que eligió el anfitrión de la sala (todas si no hay sala).
function mpAreas() {
  return (typeof MultiplayerManager !== 'undefined' && Array.isArray(MultiplayerManager.areas) && MultiplayerManager.areas.length) ? MultiplayerManager.areas : KITCHEN_AREAS.map(a => a.id);
}

// Solo los ramen del menú actual (cuencos, ingredientes de la pestaña Ramen).
function getUnlockedRamenRecipes() {
  if (isTraining()) return trainingPoolRecipes(gameState.training.challenge, 'ramen');
  if (isFree()) return RECETAS_RAMEN;
  if ((gameState.gameMode === 'JAPON' && gameState.japon)) return RECETAS_RAMEN.filter(r => japonRunDishes().has(r.name));
  if (isMultiplayerSession()) {
    if (!mpAreas().includes('ramen')) return [];
    const rr = mpRashRound();                                  // Rash en equipo: los ramen de la ronda; si no, todos
    return rr ? RECETAS_RAMEN.filter(r => getRashConfig(rr).ramen_names.includes(r.name)) : RECETAS_RAMEN;
  }
  const cfg = getCurrentLevelConfig();
  return RECETAS_RAMEN.filter(r => cfg.ramen_names.includes(r.name));
}

// Todo lo que los clientes pueden pedir ahora: ramen + los platos de las otras áreas que ya entraron
// al menú (por nivel de campaña o ronda Rash; en multijugador, todos los preparables).
function getUnlockedRecipes() {
  if (isFree()) return freeAllRecipes();
  const list = [...getUnlockedRamenRecipes()];
  if ((gameState.gameMode === 'JAPON' && gameState.japon)) {                                   // jornada en un local de Japón: los platos de esa ciudad en las áreas elegidas
    Object.keys(AREA_CATALOGS).forEach(a => AREA_CATALOGS[a].forEach(r => { if (japonRunDishes().has(r.name) && japonRunAreas().includes(a)) list.push(r); }));
    return list;
  }
  if (isTraining()) {
    ['salteados', 'makis', 'frituras'].forEach(a => list.push(...trainingPoolRecipes(gameState.training.challenge, a)));
    return list;
  }
  const mp = isMultiplayerSession();
  const campaign = gameState.gameMode === 'NORMAL';
  const lvl = campaign ? (currentLevelIndex + 1) : (gameState.rashLevel || 1);
  Object.keys(AREA_DISH_UNLOCKS).forEach(area => {
    AREA_DISH_UNLOCKS[area].forEach(([name, campLvl, rashLvl]) => {
      if (!mp && lvl < (campaign ? campLvl : rashLvl)) return;
      if (mp && !mpAreas().includes(area)) return;                // sala multijugador: solo las áreas que eligió el anfitrión
      if (mp && mpRashRound() && mpRashRound() < rashLvl) return; // Rash en equipo: los platos se abren por ronda, como en Rash
      const r = AREA_CATALOGS[area].find(x => x.name === name);
      if (r) list.push(r);
    });
  });
  return list;
}

function getCustomIngredientOrder() {
  try {
    const raw = localStorage.getItem("ramen_custom_ingredient_order");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(Number);
      }
    }
  } catch (e) {
    console.error("Error reading ramen_custom_ingredient_order", e);
  }
  return null;
}

/** Orden guardado de una pantalla de la cocina: area = ramen | salteados | makis | frituras, stage = prod | cook | plate. Devuelve la lista de claves (ids de ingrediente; en Producción, las claves de insumo) o null si no hay. */
function getIngOrderFor(area, stage) {
  try {
    const o = JSON.parse(localStorage.getItem('ramen_ing_order_v2') || '{}');
    const a = o && o[area + ':' + stage];
    if (Array.isArray(a)) return a;                // [] = el jugador pidió el orden original: no se usa el orden único de antes
  } catch (e) {}
  return stage === 'cook' ? getCustomIngredientOrder() : null;   // el orden único de antes sigue valiendo para la despensa de cocina
}
/** Ordena `list` según `order` (lista de claves); lo que no esté en `order` queda al final, en su orden original. */
function sortByOrder(list, order, keyFn) {
  if (!order || !order.length) return list;
  const pos = new Map(); order.forEach((k, i) => pos.set(String(k), i));
  return list.map((x, i) => [x, i]).sort((a, b) => {
    const pa = pos.has(String(keyFn(a[0]))) ? pos.get(String(keyFn(a[0]))) : 9999, pb = pos.has(String(keyFn(b[0]))) ? pos.get(String(keyFn(b[0]))) : 9999;
    return pa - pb || a[1] - b[1];
  }).map(p => p[0]);
}
function sortIngredientsByCustomOrder(list, area, stage) {
  return sortByOrder(list, getIngOrderFor(area || 'ramen', stage || 'cook'), i => i.id);
}

function getUnlockedIngredients() {
  if (stagedOn(gameState.activeArea) && getStage(gameState.activeArea) === 'plate') return stPlateIngList(gameState.activeArea);   // Emplatar: todos los componentes de emplatado, arriba
  let list;
  if (gameState.activeArea && gameState.activeArea !== 'ramen') {
    // Áreas nuevas (Salteados/Frituras/Makis): solo los ingredientes de los platos ya desbloqueados.
    const ids = new Set();
    stView(gameState.activeArea, getUnlockedRecipes().filter(r => r.area === gameState.activeArea)).forEach(r => r.ingredients.forEach(id => ids.add(id)));
    if (gameState.activeArea === 'frituras' && stagedOn('frituras') && getUnlockedRecipes().some(r => r.name === 'Batayaki Ramen')) ids.add(71);
    if (gameState.activeArea === 'makis' && stagedOn('makis')) { if (ids.has(49)) ids.add(110); if (ids.has(50)) ids.add(111); }   // atún y conchas enteros: se cortan en la tabla de pescado   // poro cortado en Salteado, para pasarlo por harina y freírlo
    list = INGREDIENTES.filter(i => ids.has(i.id));
    // En Frituras la harina, el huevo y el panko son los tres espacios de empanizado, no fichas.
    if (gameState.activeArea === 'frituras') list = list.filter(i => !FRY_BREADING_IDS.includes(i.id) && (!stagedOn('frituras') || FRY_PROTEIN_IDS.includes(i.id) || i.id === 83));
  } else if (isMultiplayerSession() && !stagedOn('ramen')) {                 // sala sin etapas en esa área: todos los ingredientes de Ramen
    list = INGREDIENTES.filter(i => i.areas && i.areas.includes('ramen'));
  } else {
    const unlockedRecs = getUnlockedRamenRecipes();
    const ingIds = new Set();
    stView('ramen', unlockedRecs).forEach(r => r.ingredients.forEach(id => ingIds.add(id)));
    list = INGREDIENTES.filter(i => ingIds.has(i.id));
    if (stagedOn('ramen')) list = list.filter(i => !TOOL_SAUCE_IDS.includes(i.id));   // con etapas las salsas son botellas de la franja de herramientas
  }
  if (gameState.activeArea === 'salteados' && stagedOn('salteados')) list = list.filter(i => !WOK_SAUCE_IDS.includes(i.id));   // lo mismo en Salteados
  return sortIngredientsByCustomOrder(list, gameState.activeArea || 'ramen', 'cook');
}

// Platos mixtos de Salteados: se cocinan en dos utensilios y luego se combinan
// Pasos de un plato de Salteado, uno por línea: utensilio, rondas (con sus ingredientes) y cómo se combina / se emplata
function salStepsHtml(r) {
  const sd = r.area === 'salteados' && stagedOn('salteados') ? SAL_STAGED[r.name] : null;
  if (!sd) return '';
  const nm = id => { const ing = INGREDIENTES.find(i => i.id === id); return ing ? (ing.short || ing.display) : id; };
  const ico = id => { const ing = INGREDIENTES.find(i => i.id === id); const src = ing ? ingCtxImg(ing) : null; return src ? `<img src="${src}" style="width:15px;height:15px;vertical-align:middle;">` : (ing ? ing.icon : ''); };
  const tool = t => (t === 'pan' ? '🍳 SARTÉN' : '🥘 WOK');
  const start = '<div class="rs-start">🔥 Antes de cada parte: enciende el fuego, echa 🛢️ aceite y espera a que el wok / sartén esté caliente.</div>';
  const parts = sd.parts.map(p => {
    const rounds = p.rounds.map((rd, k) => {
      const items = (rd.a || []).length ? rd.a.map(id => `<span class="rs-ing">${ico(id)} ${nm(id)}</span>`).join('') : '<span class="rs-ing">🔁 solo saltear otra ronda</span>';
      return `<div class="rs-round"><b>Ronda ${k + 1}</b> <small>${rd.toss === false ? '(solo agregar, sin saltear)' : '(3 lanzamientos)'}</small> ${items}</div>`;
    }).join('');
    const extra = (p.timed ? ` · ⏱ se cocina ${p.timed} s, sin saltear` : '') + (p.to === 'plate' ? ' · va como pieza de emplatado' : '');
    return `<div class="rs-part"><div class="rs-tool">${tool(p.tool)}${p.label ? ' · ' + p.label : ''}${extra}</div>${rounds}</div>`;
  }).join('');
  const combine = sd.parts.filter(p => p.to !== 'plate').length > 1 ? '<div class="rs-combine">🍽 Con las dos partes listas: botón <b>Combinar</b>.</div>' : '';
  const plate = sd.plate.length ? `<div class="rs-plate">🍽 En Emplatar: ${sd.plate.map(id => `<span class="rs-ing">${ico(id)} ${nm(id)}</span>`).join('')}</div>` : '';
  return start + parts + combine + plate;
}
const AREA_LABELS = { ramen: 'Ramen', salteados: 'Salteado', makis: 'Makis', frituras: 'Frituras' };
const KITCHEN_AREAS = [
  { id: 'ramen', label: 'RAMEN' },
  { id: 'salteados', label: 'SALTEADO' },
  { id: 'frituras', label: 'FRITURAS' },
  { id: 'makis', label: 'MAKIS' }
];

const CATEGORY_LABELS = { bases: 'Bases', salsas: 'Salsas', proteinas: 'Proteínas', vegetales: 'Vegetales', otros: 'Otros' };

function switchKitchenArea(areaId) {
  if (gameState.activeArea === areaId) return;
  if (!isAreaUnlocked(areaId)) {
    showStationToast(`🔒 ${AREA_LABELS[areaId]} se desbloquea en ${areaUnlockHint(areaId)}.`);
    return;
  }
  gameState.activeArea = areaId;
  gameState.currentCategory = 'todos';
  try { playSound('click'); } catch (e) {}
  try { // pista única para quien juega con el dedo
    if ((navigator.maxTouchPoints > 0) && (!isMultiplayerSession() || stagedOn(gameState.activeArea)) && safeStorage.getItem('ramen_swipe_hint') !== '1') {
      safeStorage.setItem('ramen_swipe_hint', '1');
      setTimeout(() => showStationToast('👆 Desde el borde izquierdo → Producción · desde el borde derecho ← Emplatar'), 600);
    }
  } catch (e) {}
  // Cada estación conserva su estado al cambiar de pestaña, como en una cocina real: los
  // cuencos de Ramen, los woks, la tabla de Makis y la mesa/olla de Frituras siguen como los
  // dejaste. La olla incluso sigue friendo (y quemando) mientras trabajas en otra área; las
  // pestañas muestran un indicador de lo que está en curso o listo. Solo se cancela un gesto
  // a medias (arrastrar el cuchillo o deslizar para enrollar), que no tiene sentido cruzar áreas.
  abortMakiCut();
  cleanupMakiToolDrag();
  cleanupFryItemDrag();
  abortFryCut();
  cleanupFryKnifeDrag();
  cleanupShopKnife();
  updateStationVisibilityForArea();
  renderPantryGrid();
  renderBowls();
  if (areaId === 'makis') renderMakiStation();
  if (areaId === 'salteados') renderWoks();
  if (areaId === 'frituras') renderFryStation();
}

// --- De la estación al pase (Emplatar) ---
function stPassFromBowl(i) {
  const bowl = gameState.bowls[i], a = analyzeBowl(i);
  if (!bowl || a.status !== 'READY') return;
  const ok = stPassAdd('ramen', { recipes: (a.recipe.candidates || [a.recipe]).map(r => r.name), result: 'PERFECTO',
    readyAt: bowl.readyAt != null ? bowl.readyAt : gameState.gameClock, vis: { kind: 'bowl', ings: [...bowl.ingredients], spread: bowl.spread || 0 },
    meta: { orderErrors: bowl.orderErrors || 0, dashiBase: !!bowl.dashiBase, spread: bowl.spread || 0, fry: bowl.fry || null, oilMissing: !!bowl.oilMissing } });
  if (!ok) return;
  gameState.bowls[i] = { ingredients: [], matchedRamen: null };
  renderBowls();
  renderCustomers();
  renderPantryGrid();
}
function wokServeClick(i) {
  if (!stagedOn('salteados')) { serveReadyDish('salteados', i); return; }
  const w = gameState.woks[i];
  if (!w || !w.result || !w.matchedRecipe) return;
  const rc = w.matchedRecipe;
  if (rc.toPlate) { wokPartToPlate(i); return; }           // parte que no va dentro del plato: queda como pieza de Emplatar
  if (rc.isPart) { wokCombineClick(i); return; }           // una parte de un plato de dos partes no se sirve sola: se combina con la otra
  const main = rc.ingredients.find(id => [69, 61, 48].includes(id)) || rc.ingredients[0];
  const ok = stPassAdd('salteados', { recipes: (rc.candidates || [rc]).map(r => r.name), result: w.result,
    readyAt: w.readyAt != null ? w.readyAt : gameState.gameClock, vis: { kind: 'ing', id: main },
    meta: { result: w.result, secs: w.stirSeconds, profile: w.profile, orderMatches: w.orderMatches, orderTotal: w.orderTotal, toss: w.toss || 0, oilMissing: false, oilAdj: w.oilAdj || 0, dry: w.dry || 0, wrongTool: !!w.wrongTool, tool: w.tool || 'wok', rscript: !!rc.script } });
  if (!ok) return;
  gameState.woks[i] = newWok(w);
  renderWoks();
  renderPantryGrid();
}
// Plato mixto: junta las dos partes ya terminadas (una en el wok y otra en la sartén) y las manda al pase.
// Calidad: se toma la cocción de la parte que salió peor; el volteo es el promedio y el aceite debe estar en las dos.
function wokCombineClick(i) {
  const w = gameState.woks[i], rc = w && w.matchedRecipe, sd = rc && SAL_STAGED[rc.partOf];
  if (!w || !w.result || !sd) return;
  const j = i === 0 ? 1 : 0, o = gameState.woks[j];
  // la otra parte puede estar ya terminada en la otra hornilla (activa o guardada) o guardada en esta misma hornilla (el otro utensilio)
  const cands = [];
  if (o) { cands.push({ v: o, at: 'otherActive' }); if (o.parked) cands.push({ v: o.parked, at: 'otherParked' }); }
  if (w.parked) cands.push({ v: w.parked, at: 'ownParked' });
  const src = cands.find(c => c.v.result && c.v.matchedRecipe && c.v.matchedRecipe.isPart && !c.v.matchedRecipe.toPlate && c.v.matchedRecipe.partOf === rc.partOf && c.v.matchedRecipe.partKey !== rc.partKey);
  if (!src) {
    const other = sd.parts.find(p => p.to !== 'plate' && p.key !== rc.partKey);
    showStationToast(`🍽 ${rc.partOf} va en 2 partes: falta ${other ? other.label : 'la otra parte'} en ${other ? wokToolName(other.tool) : 'la otra hornilla'} (termínala y luego combina).`);
    try { playSound('error'); } catch (e) {}
    return;
  }
  const x = src.v;
  const mk = v => ({ result: v.result, secs: v.stirSeconds, profile: v.profile, dry: v.dry || 0, oilAdj: v.oilAdj || 0, wrongTool: !!v.wrongTool, toss: v.toss || 0, orderMatches: v.orderMatches || 0, orderTotal: v.orderTotal || 0 });
  const A = mk(w), B = mk(x), cook = m => evalCooking({ area: 'salteados', quality: m.result, meta: m }).pts;
  const worse = cook(A) <= cook(B) ? A : B;
  const meta = { ...worse, toss: (A.toss + B.toss) / 2, oilMissing: false, orderMatches: A.orderMatches + B.orderMatches, orderTotal: A.orderTotal + B.orderTotal, rscript: true };
  const full = salCookIds(rc.partOf), main = full.find(id => [69, 61, 48].includes(id)) || full[0];
  const now = gameState.gameClock;
  const ok = stPassAdd('salteados', { recipes: [rc.partOf], result: worse.result, readyAt: Math.min(w.readyAt != null ? w.readyAt : now, x.readyAt != null ? x.readyAt : now), vis: { kind: 'ing', id: main }, meta });
  if (!ok) return;
  if (src.at === 'ownParked') w.parked = null;
  if (src.at === 'otherParked') o.parked = null;
  gameState.woks[i] = newWok(w);
  if (src.at === 'otherActive') gameState.woks[j] = newWok(o);
  try { playSound('match'); } catch (e) {}
  showStationToast(`🍽 ${rc.partOf}: ${sd.how || 'las dos partes se juntan.'} Va al pase.`);
  renderWoks();
  renderPantryGrid();
}
// Parte que no va dentro del plato (Yasaitame: el lomo): rinde porciones para Emplatar según cómo salió
function wokPartToPlate(i) {
  const w = gameState.woks[i], rc = w && w.matchedRecipe, part = rc && rc.script;
  if (!w || !w.result || !part || !part.plateKey) return;
  const sal = stGet('salteados'), p = stProdOf('salteados', part.plateKey), before = sal.stock[p.key], perfect = w.result === 'PERFECTO';
  sal.stock[p.key] = Math.min(p.max, before + (perfect ? 3 : 1));
  gameState.woks[i] = newWok(w);
  showStationToast(`🥩 ${p.label}: +${sal.stock[p.key] - before} para Emplatar${perfect ? '' : ' (no salió perfecto: rindió menos)'}.`);
  try { playSound('stock_add'); } catch (e) {}
  renderWoks();
  renderPantryGrid();
  stRenderIfOpen('salteados');
  renderStageTabs();
}
function makiServeClick() {
  if (!stagedOn('makis')) { serveReadyDish('makis', 0); return; }
  if (typeof mkServe === 'function') { mkServe(); return; }                  // estudio de Makis: calcula el proceso y pasa el maki a Emplatar
  const roll = gameState.makiRoll, a = analyzeMakiSequence(roll.ingredients);
  if (roll.cutState !== 'CUT' || a.status !== 'READY') return;
  const flameNeeded = makiNeedsFlame();
  const ok = stPassAdd('makis', { recipes: (a.recipe.candidates || [a.recipe]).map(r => r.name), result: 'PERFECTO',
    readyAt: roll.readyAt != null ? roll.readyAt : gameState.gameClock, vis: { kind: 'img', src: 'assets/maki_roll_v2.svg', id: 38 }, meta: { spread: roll.spread || 0, flamePts: makiFlamePts(roll, flameNeeded) } });
  if (!ok) return;
  cleanupMakiToolDrag();
  gameState.makiRoll = newMakiRoll();
  renderMakiStation();
  renderPantryGrid();
}

// Descarga la última versión: borra la caché de la app y el service worker (NO toca la cuenta ni el progreso).
async function forceAppUpdate() {
  try {
    const b = document.getElementById('app-version-btn'); if (b) b.textContent = '⏳ Actualizando…';
    if (navigator.serviceWorker) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); }
    if (window.caches) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); }
  } catch (e) {}
  location.reload();
}
