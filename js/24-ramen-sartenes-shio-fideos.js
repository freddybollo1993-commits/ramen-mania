/* Módulo 24-ramen-sartenes-shio-fideos — Ramen: sartenes, hornilla del Shio y reparto de fideos.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

function panTick() {
  if (!gameState.pans) return;
  const T = panTimes();
  let changed = false;
  [0, 1].forEach(i => {
    const pan = gameState.pans[i];
    if (!pan.items.length) return;
    const ph = panPhase(pan), rn = panRecipeName(pan);
    if (!pan.fire) { if (pan.foam > 0) { pan.foam = Math.max(0, pan.foam - 8); changed = true; } return; }   // apagada: la espuma baja
    if (ph === 'RAW' || ph === 'GOOD' || ph === 'OVER') {
      pan.t++; changed = true;
      if (pan.t === T.ready) { try { playSound('ding'); } catch (e) {} showStationToast(`🍳 Sartén ${i + 1}: ¡sofrito listo! Agrega el caldo.`); }
      if (pan.t >= T.burn) { pan.burnt = true; pan.fire = false; try { playSound('burn'); } catch (e) {} showStationToast(`🔥 ¡Se quemó el sofrito de la sartén ${i + 1}! Vacíala.`); }
    } else if (ph === 'HEAT') {
      pan.heat++; changed = true;
      if (pan.heat >= T.heat) { pan.vol = 100; pan.foam = 0; try { playSound('ding'); } catch (e) {} showStationToast(`♨️ Sartén ${i + 1}: caldo caliente. Sírvelo o apaga la hornilla.`); }
    } else if (ph === 'HOT' && T.dry < 1e8) {
      changed = true;
      if (rn === 'Tonkotsu') {
        pan.foam += 100 / T.foam;
        if (pan.foam >= 60 && !pan.foamWarned) { pan.foamWarned = true; try { playSound('burn'); } catch (e) {} showStationToast(`⚠ Sartén ${i + 1}: ¡mucha espuma del Tonkotsu! Apaga la hornilla.`); }
        if (pan.foam >= 100) {
          gameState.pans[i] = newPan();
          try { playSound('burn'); } catch (e) {}
          showStationToast(`🌊 ¡Se desbordó el Tonkotsu de la sartén ${i + 1}! Perdiste el caldo: hazlo de nuevo.`);
        }
      } else {
        pan.vol -= 100 / T.dry;
        if (pan.vol <= 35 && !pan.dryWarned) { pan.dryWarned = true; showStationToast(`⚠ Sartén ${i + 1}: el caldo se está reduciendo. Sírvelo o apaga la hornilla.`); }
        if (pan.vol <= 0) { pan.vol = 0; pan.dried = true; pan.fire = false; try { playSound('burn'); } catch (e) {} showStationToast(`💨 ¡Se secó el caldo de la sartén ${i + 1}! Vacíala y empieza de nuevo.`); }
      }
    }
  });
  if (changed) renderPans();
}

function panFire(i) {
  if (!stagedOn('ramen') || gameState.isPaused || gameState.isGameOver) return;
  const pan = panGet(i);
  if (!pan.items.length) { showStationToast('🍳 Primero pon los ingredientes en la sartén.'); return; }
  if (pan.burnt || pan.dried) { showStationToast('🍳 Esa sartén se echó a perder: vacíala con 🗑️.'); try { playSound('error'); } catch (e) {} return; }
  if (pan.served) { showStationToast('🍳 Ya está servido: pon lo que queda arriba del cuenco.'); return; }
  pan.fire = !pan.fire;
  try { playSound(pan.fire ? 'flame' : 'click'); } catch (e) {}
  showStationToast(pan.fire ? `🔥 Hornilla ${i + 3} encendida.` : `🧯 Hornilla ${i + 3} apagada.`);
  renderPans();
}
// Toque sobre la sartén: servir si está caliente, poner lo que queda arriba, o encender / apagar la hornilla
function panTap(i) {
  const ph = panPhase(panGet(i));
  if (ph === 'HOT' || ph === 'TOP') { panServe(i); return; }
  if (ph === 'EMPTY') { showStationToast('🍳 Sartén vacía: arrastra los ingredientes del caldo en el orden de la receta.'); return; }
  if (ph === 'WAIT' || ph === 'ADDING') { panServe(i); return; }   // avisa qué falta
  panFire(i);
}

function panAdd(i, id) {
  if (!stagedOn('ramen') || gameState.isPaused || gameState.isGameOver) return;
  const pan = panGet(i), ing = INGREDIENTES.find(x => x.id === id);
  const fail = msg => { showStationToast(msg); try { playSound('error'); } catch (e) {} };
  if (pan.burnt || pan.dried) { fail('🍳 La sartén se echó a perder: vacíala con 🗑️.'); return; }
  if (pan.served) { fail('🍳 La sopa ya se sirvió: pon lo que queda arriba del cuenco (toca la sartén).'); return; }
  if (id === OIL_ID) { panAddOil(i); return; }
  if (pan.items.includes(id)) { showStationToast(`${ing.display} ya está en la sartén.`); return; }
  const cands = panCandidates([...pan.items, id]);
  if (!cands.length) {
    const containing = Object.keys(PAN_RECIPES).filter(n => panAll(PAN_RECIPES[n]).includes(id));
    const cur = panRecipeName(pan), cr = cur && PAN_RECIPES[cur];
    if (!containing.length) fail(`🍳 ${ing.display} no va en la sartén.`);
    else if (!pan.items.length) fail('🍳 Primero se sofríe: chancho molido (Tan tan) o langostinos (Ebi).');
    else if (cr && cr.fry && !cr.fry.every(f => pan.items.includes(f))) fail(`🍳 Primero sofríe: ${cr.fry.filter(f => !pan.items.includes(f)).map(stIngName).join(' y ')}.`);
    else fail('🍳 Eso no combina con lo que ya hay en la sartén.');
    return;
  }
  const rn = cands.length === 1 ? cands[0] : null, r = rn ? PAN_RECIPES[rn] : null, T = panTimes();
  const isFry = !!(r && r.fry && r.fry.includes(id));
  if (r && r.fry && !isFry && !pan.locked && pan.t < T.ready) { fail('🍳 Aún se está sofriendo: espera a que esté listo.'); return; }
  if (id === 2) {                                   // caldo Shio caliente (o dashi de recortes), de su hornilla
    if (kitchenState.stocks.shio > 0) kitchenState.stocks.shio--;
    else if (gameState.dashi > 0) { gameState.dashi--; updateMottainaiHUD(); showStationToast('🐟 Dashi de recortes: Caldo Shio sin calentar.'); }
    else { triggerGuideHighlight('btn-heat-shio'); fail('🥣 ¡Está frío! Enciende la hornilla del Shio.'); return; }
    updateKitchenStationsUI();
  }
  if (id === 4 && gameState.dashi > 0) { gameState.dashi--; pan.dashiBase = true; updateMottainaiHUD(); showStationToast('🐟 Dashi casero en el caldo: el ramen Vegetariano se paga +20 %.'); }
  if (r && r.fry && !isFry && !pan.locked) { pan.locked = true; pan.result = pan.t < T.over ? 'PERFECTO' : 'PASADO'; }
  const before = pan.errors;
  pan.items.push(id);
  if (rn) pan.recipe = rn;
  pan.errors = ramenOrderErrors(pan.items.filter(x => !((r && r.fry) || []).includes(x)));
  if (pan.errors > before) showStationToast('🍳 Orden: caldo → salsa → proteína (−8 pts de proceso).');
  try { playSound(isFry ? 'splash' : 'add'); } catch (e) {}
  if (r && r.fry && isFry) {
    if (r.fry.every(f => pan.items.includes(f))) { if (!pan.fryStarted) { pan.fryStarted = true; pan.t = 0; showStationToast(pan.fire ? '🍳 Sofriendo… espera a que esté listo.' : '🍳 Enciende la hornilla 🔥 para sofreír.'); } }
    else showStationToast(`🍳 Falta sofreír: ${r.fry.filter(f => !pan.items.includes(f)).map(stIngName).join(', ')}.`);
  } else if (r && r.add.every(f => pan.items.includes(f))) {
    showStationToast(pan.fire ? '♨️ Todo en la sartén: calentando el caldo…' : '🔥 Todo en la sartén: enciende la hornilla para calentar el caldo.');
  }
  renderPans();
}

// Aceite de ajonjolí: al sofreer (Tan tan, Ebi) o al caldo cuando hierve (Tonkotsu, Vegetariano, Shoyu, Miso). Sin él baja la calidad.
function panAddOil(i) {
  const pan = panGet(i);
  const fail = msg => { showStationToast(msg); try { playSound('error'); } catch (e) {} };
  if (pan.oil) { showStationToast('🛢️ Esa sartén ya tiene aceite de ajonjolí.'); return; }
  if (!pan.items.length) { fail('🛢️ Primero pon el chancho o los langostinos (sofrito), o los ingredientes del caldo.'); return; }
  const rn = panRecipeName(pan), r = rn && PAN_RECIPES[rn];
  if (r && !r.oil) { fail(`🛢️ El ${rn} no lleva aceite de ajonjolí.`); return; }
  if (r && r.oil === 'fry') {
    if (pan.locked) { fail('🛢️ El aceite va al sofreír: ya pasaste al caldo.'); return; }
  } else {
    const ph = panPhase(pan);
    if (!pan.fire || (ph !== 'HEAT' && ph !== 'HOT')) { fail('🛢️ El aceite se agrega al caldo cuando hierve: completa los ingredientes y enciende la hornilla.'); return; }
  }
  pan.oil = true;
  try { playSound('splash'); } catch (e) {}
  showStationToast('🛢️ Aceite de ajonjolí agregado.');
  renderPans();
}

function panAfterBowlChange() { renderBowls(); renderCustomers(); renderPantryGrid(); renderPans(); }
function panServe(i) {
  if (gameState.isPaused || gameState.isGameOver) return;
  const pan = panGet(i), ph = panPhase(pan), rn = panRecipeName(pan), r = rn && PAN_RECIPES[rn];
  const fail = msg => { showStationToast(msg); try { playSound('error'); } catch (e) {} };
  if (ph === 'EMPTY') { showStationToast('🍳 Sartén vacía: arrastra los ingredientes del caldo en el orden de la receta.'); return; }
  if (ph === 'BURNT' || ph === 'DRIED') { fail('🍳 Se echó a perder: vacía la sartén con 🗑️.'); return; }
  if (ph === 'HOT') {
    const idx = gameState.activeBowlIndex, bowl = gameState.bowls[idx], serve = panServeIds(r), needs = r.needs || [1];
    if (idx >= bowlLimit()) { fail('🔒 Este cuenco aún no está disponible.'); return; }
    if (bowl.panRecipe || serve.some(id => bowl.ingredients.includes(id))) { fail('🍜 Este cuenco ya tiene caldo: elige otro.'); return; }
    const missing = needs.filter(id => !bowl.ingredients.includes(id));
    if (missing.length) { fail(`🍜 Al cuenco ${idx + 1} le falta: ${missing.map(stIngName).join(' y ')} (va antes del caldo).`); return; }
    bowl.ingredients.push(...serve);
    bowl.panIds = [...serve]; bowl.panRecipe = rn; bowl.panErrors = pan.errors; bowl.fry = pan.result;
    bowl.oilMissing = !!(r.oil && !pan.oil);
    if (bowl.oilMissing) showStationToast('🛢️ Sin aceite de ajonjolí: el plato saldrá de menor calidad.');
    if (pan.dashiBase) bowl.dashiBase = true;
    if (typeof bowl.spread === 'number') bowl.spread = Math.min(bowl.spread, 0.25);   // al verter el caldo hay que mover los fideos con él
    bowl.orderErrors = bowlOrderErrors(bowl);
    pan.items = pan.items.filter(id => !serve.includes(id));
    pan.fire = false;
    try { playSound('splash'); } catch (e) {}
    if (r.top) { pan.served = true; pan.target = idx; pan.recipe = rn; showStationToast(r.topNeedsSpread ? '🍜 Caldo servido. Mueve los fideos con el caldo y luego pon el brisket: toca la sartén.' : '🍜 Caldo servido. Ahora pon los langostinos arriba: toca la sartén.'); }
    else { gameState.pans[i] = newPan(); showStationToast(`🍜 ${rn}: caldo servido en el cuenco ${idx + 1}. Mueve los fideos con el caldo.`); }
    if (analyzeBowl(idx).status === 'READY') { try { playSound('match'); } catch (e) {} }
    panAfterBowlChange();
  } else if (ph === 'TOP') {
    const bowl = gameState.bowls[pan.target];
    if (!bowl || bowl.panRecipe !== pan.recipe) { fail('🍜 El cuenco ya no tiene ese caldo: vacía la sartén.'); return; }
    if (r && r.topNeedsSpread && (bowl.spread || 0) < 0.8) { fail('🥢 Primero mueve los fideos con el caldo (ohashi sobre el cuenco, mantén pulsado) y luego pon el brisket.'); return; }
    bowl.ingredients.push(...pan.items);
    bowl.panIds.push(...pan.items);
    bowl.orderErrors = bowlOrderErrors(bowl);
    gameState.pans[i] = newPan();
    try { playSound('add'); } catch (e) {}
    if (analyzeBowl(gameState.bowls.indexOf(bowl)).status === 'READY') { try { playSound('match'); } catch (e) {} }
    panAfterBowlChange();
  } else if (ph === 'WAIT') {
    showStationToast(`🍳 Falta sofreír: ${r.fry.filter(id => !pan.items.includes(id)).map(stIngName).join(' y ')}.`);
  } else if (ph === 'RAW') {
    showStationToast('🍳 Aún se está sofriendo.');
  } else if (ph === 'HEAT') {
    showStationToast('♨️ Se está calentando: espera un momento.');
  } else if (r) {
    showStationToast(`🍳 Falta: ${r.add.filter(id => !pan.items.includes(id)).map(stIngName).join(', ')}.`);
  } else {
    showStationToast('🍳 Sigue agregando los ingredientes del caldo según la receta.');
  }
}
function panDiscard(i) {
  const pan = gameState.pans && gameState.pans[i];
  if (!pan || !pan.items.length) return;
  if (pan.items.length >= 2) addTrimmings(1, 'sartén descartada');
  gameState.pans[i] = newPan();
  try { playSound('trash'); } catch (e) {}
  renderPans();
}

// ---- Hornilla del Shio (con etapas): se enciende y se apaga; encendida y caliente el caldo se va reduciendo hasta secarse ----
const SHIO_REDUCE_S = 10;                                  // segundos por porción que se evapora
const shioHeatS = () => (isFree() ? 2 : 3);
function shioStagedText() {
  const k = kitchenState.shio, n = kitchenState.stocks.shio;
  if (k.fire && !k.hot) return `♨️ Calentando… ${Math.max(0, shioHeatS() - (k.heat || 0))}s`;
  if (k.fire) return `🔥 Hirviendo (${n}) · apaga`;
  return n > 0 ? `Apagada (${n}) · enciende` : 'Toca: encender';
}
function shioRefresh() {
  const k = kitchenState.shio, btn = document.getElementById('btn-heat-shio'), fill = document.getElementById('shio-fill');
  if (btn) {
    btn.classList.toggle('fire-on', !!k.fire);
    btn.classList.toggle('fire-warn', !!k.fire && k.hot && kitchenState.stocks.shio <= 1 && !isFree());
  }
  if (fill) fill.style.width = (k.fire ? (k.hot ? Math.round(100 * (kitchenState.stocks.shio / Math.max(1, stockCap()))) : Math.round(100 * (k.heat || 0) / shioHeatS())) : 0) + '%';
  updateKitchenStationsUI();
}
function shioToggle() {
  if (gameState.isPaused || gameState.isGameOver) return;
  const k = kitchenState.shio;
  if (k.fire) {
    k.fire = false;
    try { playSound('click'); } catch (e) {}
    showStationToast('🧯 Hornilla del Shio apagada: el caldo ya no se reduce.');
  } else {
    k.fire = true; k.reduce = 0; k.heat = 0;
    k.hot = kitchenState.stocks.shio > 0;                  // si aún queda caldo ya está caliente
    try { playSound('flame'); } catch (e) {}
    showStationToast(k.hot ? '🔥 Hornilla del Shio encendida. Ojo: si la dejas, el caldo se reduce.' : '🔥 Hornilla del Shio encendida: calentando el caldo…');
  }
  shioRefresh();
}
function shioTick() {
  const k = kitchenState.shio;
  if (!k.fire) return;
  if (!k.hot) {
    k.heat = (k.heat || 0) + 1;
    if (k.heat >= shioHeatS()) {
      k.hot = true; k.reduce = 0; kitchenState.stocks.shio = stockCap();
      try { playSound('ding'); } catch (e) {}
      showStationToast(`🥣 ¡Caldo Shio caliente! (${stockCap()} porciones). Apaga la hornilla cuando termines: si no, se reduce.`);
    }
  } else if (!isFree()) {
    if (kitchenState.stocks.shio <= 0) { k.fire = false; k.hot = false; showStationToast('🥣 No queda caldo Shio: la hornilla se apagó.'); }
    else if (++k.reduce >= SHIO_REDUCE_S) {
      k.reduce = 0; kitchenState.stocks.shio--;
      if (kitchenState.stocks.shio <= 0) { k.fire = false; k.hot = false; try { playSound('burn'); } catch (e) {} showStationToast('💨 ¡El caldo Shio se secó por completo! Enciende de nuevo para hacer más.'); }
      else if (kitchenState.stocks.shio === 1) showStationToast('⚠ El caldo Shio se está reduciendo: queda 1 porción.');
    }
  }
  shioRefresh();
}

// Mover los fideos (Ramen con etapas): se arrastra el dedo / ratón sobre el cuenco; cada tramo de recorrido los reparte un poco más.
// Un toque suelto no cuenta (sigue siendo seleccionar el cuenco o pasarlo a emplatar). El reparto pesa en la calidad (evalProcess).
const NOODLE_DRAG_GESTURE = false;      // el reparto de los fideos ahora se hace con los ohashi de la franja de herramientas (mantener pulsado)
const NOODLE_SPREAD_PX = 220;      // recorrido total para repartir los fideos del todo
let noodleDrag = null, noodleNoClickUntil = 0, noodleTipShown = false;
function noodleTip() {
  if (noodleTipShown) return;
  noodleTipShown = true;
  showStationToast('🥢 Los fideos caen apelmazados: arrastra los ohashi hasta el cuenco y mantén pulsado para repartirlos (cuenta en la calidad).');
}
function noodleRedraw(i) {
  const bowl = gameState.bowls[i], art = document.getElementById('bowl-art-' + i);
  if (!bowl || !art) return;
  art.innerHTML = generateBowlSVG(bowl, analyzeBowl(i));
  art._lastRenderedSig = null;
}
function onNoodleMove(e) {
  const d = noodleDrag;
  if (!d || e.pointerId !== d.id) return;
  const bowl = gameState.bowls[d.i];
  if (!bowl || !bowl.ingredients.includes(1)) { endNoodleDrag(); return; }
  const step = Math.hypot(e.clientX - d.x, e.clientY - d.y);
  d.x = e.clientX; d.y = e.clientY; d.dist += step;
  if (d.dist < 6) return;
  const before = bowl.spread || 0;
  bowl.spread = Math.min(1, before + step / NOODLE_SPREAD_PX);
  const art = document.getElementById('bowl-art-' + d.i), r = art ? art.getBoundingClientRect() : null;
  bowl.stirX = r && r.width ? Math.max(24, Math.min(76, (e.clientX - r.left) / r.width * 100)) : 50;
  noodleRedraw(d.i);
  if (Math.floor(before * 5) < Math.floor(bowl.spread * 5)) { try { playSound('click'); } catch (err) {} }
  if (before < 1 && bowl.spread >= 1) { try { playSound('ding'); } catch (err) {} showStationToast('🥢 ¡Fideos bien repartidos!'); }
}
function endNoodleDrag(e) {
  const d = noodleDrag;
  if (!d || (e && e.pointerId !== d.id)) return;
  document.removeEventListener('pointermove', onNoodleMove);
  document.removeEventListener('pointerup', endNoodleDrag);
  document.removeEventListener('pointercancel', endNoodleDrag);
  const bowl = gameState.bowls[d.i];
  if (d.dist >= 6) noodleNoClickUntil = performance.now() + 350;   // el arrastre no cuenta como toque en el cuenco
  noodleDrag = null;
  if (bowl) { bowl.stirX = null; noodleRedraw(d.i); }
  renderBowls();
}
document.addEventListener('pointerdown', (e) => {
  if (!NOODLE_DRAG_GESTURE) return;
  const vis = e.target.closest && e.target.closest('.bowl-dock-visual');
  if (!vis || !/^bowl-art-\d$/.test(vis.id) || !stagedOn('ramen') || gameState.isPaused || gameState.isGameOver) return;
  const i = parseInt(vis.id.replace('bowl-art-', ''), 10), bowl = gameState.bowls[i];
  if (!bowl || !bowl.ingredients.includes(1) || i >= bowlLimit()) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (noodleDrag) endNoodleDrag();
  noodleDrag = { id: e.pointerId, i, x: e.clientX, y: e.clientY, dist: 0 };
  document.addEventListener('pointermove', onNoodleMove);
  document.addEventListener('pointerup', endNoodleDrag);
  document.addEventListener('pointercancel', endNoodleDrag);
});
document.addEventListener('click', (e) => {
  if (performance.now() < noodleNoClickUntil && e.target.closest && e.target.closest('.bowl-dock-visual')) { e.stopPropagation(); e.preventDefault(); }
}, true);

function clearBowl(index) {
  if (gameState.bowls[index] && gameState.bowls[index].ingredients.length >= MOTTAINAI_MIN_DISCARD) addTrimmings(1, 'tazón descartado');
  playSound('trash');
  gameState.bowls[index] = { ingredients: [], matchedRamen: null };
  if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
    MultiplayerManager.syncSharedBowl(index, gameState.bowls[index]);
    MultiplayerManager.releaseStationLock(`bowl-card-${index}`);
  }
  renderBowls();
  renderCustomers();
  renderPantryGrid();
}
