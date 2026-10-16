/* Módulo 08-salteados-wok — Salteados: wok, etapas del wok y botones de salteo.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// --- Estación de Salteados: 2 woks en paralelo. El plato se identifica por el CONJUNTO de
// ingredientes (como Ramen), pero se registra el orden real de armado y el resultado del
// salteado (crudo/perfecto/quemado) como señales crudas para el futuro sistema de calidad.
function analyzeWok(index) {
  const wok = gameState.woks[index];
  if (!wok || wok.ingredients.length === 0) return { status: "EMPTY" };

  const wokSet = new Set(wok.ingredients);
  if (wokStaged()) {                                       // con etapas: cada hornilla cocina una PARTE de un plato (ver SAL_STAGED)
    for (const r of RECETAS_SALTEADOS) {
      const sd = SAL_STAGED[r.name];
      if (!sd) continue;
      for (const part of sd.parts) {
        const ids = salPartIds(part);
        if (ids.length !== wokSet.size || !ids.every(x => wokSet.has(x))) continue;
        const dishParts = sd.parts.filter(p => p.to !== 'plate').length, solo = dishParts === 1 && part.to !== 'plate';
        const sc = salRoundScore(wok, part);
        return { status: "MATCHED", recipe: { ...r, name: solo ? r.name : `${r.name} · ${part.label}`, ingredients: ids, isPart: !solo, partOf: r.name, partKey: part.key, partTool: part.tool, script: part, toPlate: part.to === 'plate' }, orderMatches: sc.ok, orderTotal: sc.total };
      }
    }
  }
  for (const r of stView('salteados', RECETAS_SALTEADOS)) {
    if (wokStaged() && SAL_STAGED[r.name]) continue;       // con etapas los platos de Salteado se reconocen por partes (arriba)
    const rSet = new Set(r.ingredients);
    if (rSet.size === wokSet.size && [...rSet].every(x => wokSet.has(x))) {
      let orderMatches = 0;
      const n = Math.min(wok.ingredients.length, r.ingredients.length);
      for (let i = 0; i < n; i++) {
        if (wok.ingredients[i] === r.ingredients[i]) orderMatches++;
      }
      return { status: "MATCHED", recipe: r, orderMatches, orderTotal: r.ingredients.length };
    }
  }

  let bestRecipe = null, bestOverlap = -1, bestMissing = [], bestExtra = [];
  for (const r of stView('salteados', RECETAS_SALTEADOS)) {
    const rSet = new Set(r.ingredients);
    const missing = [...rSet].filter(x => !wokSet.has(x));
    const extra = [...wokSet].filter(x => !rSet.has(x));
    const overlap = [...wokSet].filter(x => rSet.has(x)).length;
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

function selectWok(index) {
  if (index >= wokLimit()) { showStationToast('🔒 Este wok se abre completando más retos del entrenamiento.'); return; }
  gameState.activeWokIndex = index;
  renderWoks();
}

function toggleIngredientInWok(ingId) {
  if (gameState.isPaused || gameState.isGameOver) return;
  if (gameState.activeWokIndex >= wokLimit()) { showStationToast('🔒 Este wok se abre completando más retos del entrenamiento.'); return; }
  if (!coopLock(`wok-card-${gameState.activeWokIndex}`)) return;
  const wok = gameState.woks[gameState.activeWokIndex];
  if (wok.result) return; // ya salteado: hay que vaciar el wok para volver a armar
  if (wok.ingredients.includes(ingId)) {
    wok.ingredients = wok.ingredients.filter(id => id !== ingId);
    if (wok.addRound) delete wok.addRound[ingId];
    if (wok.log) wok.log = wok.log.filter(e => e.id !== ingId);
    stCookRefund('salteados', ingId);
  } else {
    if (wokStaged() && !wokReadyToCook(gameState.activeWokIndex)) return;
    if (!stCookTake('salteados', ingId)) return;
    const scAdd = wokStaged() ? wokScriptOf(gameState.activeWokIndex) : null;
    wok.ingredients.push(ingId);
    if (wokStaged()) { wokNoteAdded(wok, ingId); wokAddFeedback(gameState.activeWokIndex, ingId, scAdd); }
  }
  playSound('add');
  renderWoks();
  renderPantryGrid();
}

function clearWok(index) {
  const w = gameState.woks[index];
  if (w && w.ingredients.length >= MOTTAINAI_MIN_DISCARD) {
    if (w.result === 'QUEMADO') showStationToast('💨 Lo quemado no se aprovecha: a la basura.');
    else addTrimmings(1, 'salteado descartado');
  }
  gameState.woks[index] = newWok(w);
  playSound('trash');
  renderWoks();
  renderPantryGrid();
}

function renderWoks() {
  for (let i = 0; i < 2; i++) {
    const wok = gameState.woks[i];
    const cardEl = document.getElementById(`wok-card-${i}`);
    const badgeEl = document.getElementById(`wok-badge-${i}`);
    const artEl = document.getElementById(`wok-art-${i}`);
    const tagEl = document.getElementById(`wok-tag-${i}`);
    const stirBtn = document.getElementById(`wok-stir-btn-${i}`);
    if (!cardEl || !wok) continue;

    const isActive = gameState.activeWokIndex === i;
    cardEl.classList.toggle('wok-locked', i >= wokLimit());
    cardEl.classList.toggle('active', isActive);
    if (tagEl) tagEl.style.display = isActive ? 'block' : 'none';

    // Los ingredientes se amontonan dentro de la cavidad del wok (espiral estable: cada
    // ingrediente conserva su posición al agregar más).
    if (artEl) {
      artEl.innerHTML = (wok.oil ? '<i class="wok-oil-sheen"></i>' : '') + (wok.ingredients.length === 0
        ? `<div class="wok-empty-hint">${wokStaged() ? 'Arrastra aquí los ingredientes' : 'Arrastra aquí los ingredientes'}</div>`
        : wok.ingredients.flatMap(id => Array(WOK_SAUCE_IDS.includes(id) ? 1 : Math.max(1, (wok.log || []).filter(e => e.id === id).length)).fill(id)).map((id, idx) => {
            const ing = INGREDIENTES.find(x => x.id === id);
            const radius = 0.27 * Math.sqrt(idx + 0.6);
            const angle = idx * 2.39996;
            const x = 50 + Math.cos(angle) * radius * 42;
            const y = 50 + Math.sin(angle) * radius * 38;
            const rot = ((idx * 47) % 50) - 25;
            const rnd = ((idx * 37 + 11) % 100) / 100, rnd2 = ((idx * 53 + 7) % 100) / 100;
            return `<span class="wok-chip" title="${ing ? ing.display : ''}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;z-index:${idx};transform:translate(-50%,-50%) rotate(${rot}deg);--fx:${((rnd - 0.5) * 36).toFixed(1)}cqw;--fy:${(-(14 + rnd2 * 16)).toFixed(1)}cqw;--fr:${Math.round(rnd * 220 - 110)}deg;--kd:${idx * 22}ms">${ingIconHtml(ing)}</span>`;
          }).join(''));
    }

    const serveBtn = document.getElementById(`wok-serve-btn-${i}`);
    if (serveBtn) serveBtn.classList.toggle('is-visible', !!(wok.result && wok.matchedRecipe));
    syncStationIfChanged('salteados', i);
    if (i === 1) updateServeButtonsQuality();
    cardEl.classList.toggle('is-stirring', !!wok.stirring);
    cardEl.classList.remove('wok-result-perfecto', 'wok-result-crudo', 'wok-result-quemado');
    if (wok.result) cardEl.classList.add(`wok-result-${wok.result.toLowerCase()}`);

    if (badgeEl) { badgeEl.classList.remove('status-error', 'status-warn', 'status-ready', 'rc'); badgeEl._g = null; }

    if (wok.result) {
      const labelMap = { PERFECTO: '🔥 Perfecto', CRUDO: '🥶 Crudo', QUEMADO: '💨 Quemado' };
      const recipeName = wok.matchedRecipe ? wok.matchedRecipe.name : '';
      if (badgeEl) {
        badgeEl.textContent = `${labelMap[wok.result]}: ${recipeName}`;
        badgeEl.classList.add(wok.result === 'PERFECTO' ? 'status-ready' : wok.result === 'CRUDO' ? 'status-error' : 'status-warn');
        badgeEl.style.display = 'block';
      }
      if (stirBtn) stirBtn.style.display = 'none';
      cardEl.onclick = () => selectWok(i);
    } else {
      const analysis = analyzeWok(i);
      if (analysis.status === 'EMPTY') {
        if (badgeEl) badgeEl.style.display = 'none';
        if (stirBtn) stirBtn.style.display = 'none';
      } else if (analysis.status === 'MATCHED') {
        if (badgeEl) {
          const needT = wokStaged() ? wokNeededTool(i) : null, curT = (wok.tool || 'wok');
          badgeEl.textContent = `Listo: ${analysis.recipe.name}` + (needT && needT !== curT ? ` · ¡va en ${wokToolName(needT).toLowerCase()}!` : '');
          badgeEl.classList.add('status-ready');
          badgeEl.style.display = 'block';
        }
        if (stirBtn && wokStaged()) {
          stirBtn.style.display = 'flex';
          wokStagedBtnUi(wok, i, stirBtn);
        } else if (stirBtn && !wok.stirring) {
          stirBtn.style.display = 'flex';
          stirBtn.classList.remove('stirring-active', 'zone-crudo', 'zone-perfecto', 'zone-quemado');
          const fillEl = document.getElementById(`wok-stir-fill-${i}`);
          const labelEl = document.getElementById(`wok-stir-label-${i}`);
          if (fillEl) fillEl.style.width = '0%';
          if (labelEl) labelEl.textContent = 'Saltear (mantén)';
        }
      } else {
        if (badgeEl) {
          const falta = (getUpgradeLevel('libro') > 0 && analysis.missing && analysis.missing[0]) ? ` · sigue: ${analysis.missing[0]}` : '';
          badgeEl.textContent = `Armando (${wok.ingredients.length})${falta}`;
          badgeEl.style.display = 'block';
        }
        if (stirBtn) stirBtn.style.display = 'none';
      }
      cardEl.onclick = () => selectWok(i);
    }
  }
  wokUpdateFireUi();
  updateAreaTabAlerts();
}

// Mantener presionado el botón de saltear: barra de tiempo con 3 zonas (crudo/perfecto/quemado).
// Igual que calentar Shio/Tonkotsu (pointerdown/pointerup), pero con zona de salida en vez de un único umbral.
// Cada plato tiene su propia ventana (segundos): hasta `crudo` está crudo, hasta `perfecto` está en su
// punto, y a los `quemado` se quema solo. El arroz pide fuego fuerte y más tiempo (wok hei); el
// teriyaki se quema rápido por el azúcar de la salsa; las verduras de yasaitame deben quedar crujientes.
const WOK_PROFILE_DEFAULT = { crudo: 1.5, perfecto: 2.5, quemado: 4.0 };
const WOK_PROFILES = {
  'Chaufa Shimaya': { crudo: 1.8, perfecto: 3.0, quemado: 4.2 },
  'Yakimeshi': { crudo: 1.8, perfecto: 3.0, quemado: 4.2 },
  'Karameshi': { crudo: 1.8, perfecto: 3.0, quemado: 4.2 },
  'Omuraisu': { crudo: 1.6, perfecto: 2.8, quemado: 4.0 },
  'Chicken Teriyaki': { crudo: 1.2, perfecto: 2.2, quemado: 3.2 },
  'Yakitori': { crudo: 2.0, perfecto: 3.4, quemado: 4.6 },
  'Batayaki Ramen': { crudo: 1.5, perfecto: 2.6, quemado: 3.8 },
  'Yakiramen': { crudo: 1.5, perfecto: 2.6, quemado: 3.8 },
  'Yasaitame': { crudo: 1.0, perfecto: 2.0, quemado: 3.0 }
};
function wokProfile(recipe) {
  const base = (recipe && WOK_PROFILES[recipe.name]) || WOK_PROFILE_DEFAULT;
  const b = [0, 0.1, 0.2, 0.3][getUpgradeLevel('wok')];
  if (!b) return base;
  const perfecto = base.crudo + (base.perfecto - base.crudo) * (1 + b);
  return { crudo: base.crudo, perfecto, quemado: base.quemado + (perfecto - base.perfecto) };
}

// ---- Salteados con etapas: wok sobre fuego, aceite en botella y salteado por toques ----
// Cada TOQUE sobre el wok es un salteado y 3 toques = 1 RONDA. En cada ronda se van integrando los ingredientes del plato (se agregan arrastrándolos
// y cuentan como integrados cuando pasa una ronda completa; hacen falta tantas rondas como ingredientes de cocción, entre 2 y 5).
// El fuego es un interruptor y la barra de temperatura sube hasta el punto ideal (1): mientras se saltea se mantiene ahí; si se deja de saltear
// demasiado rato la temperatura pasa de ese punto y la comida empieza a quemarse. Apagar el fuego a mitad de una ronda (con 1 o 2 toques) resta calidad.
// Con el plato listo se RETIRA tocando el botón de arriba: antes de tiempo sale crudo; cada ronda de más lo seca y lo sala (resta calidad, con cartel de aviso) y a la tercera se quema.
const WOK_TAPS_PER_ROUND = 3;
const WOK_TOSS_LOCK_MS = 480;     // cada salteado dura lo que dura su animación; los toques de más se ignoran
const WOK_BIG_LOCK_MS = 760;      // el tercer toque (lanzamiento grande) tarda un poco más
const WOK_HEAT_SECS = 3;          // segundos del wok frío al punto ideal
const WOK_HEAT_BURN = 1.4;        // a esta temperatura la comida se quema (1 = ideal)
const WOK_IDLE_GRACE = 2.5;       // segundos sin saltear antes de que la temperatura se pase del punto ideal
const WOK_OVERHEAT_SECS = 5;      // de 1,0 a 1,4 sin saltear
const WOK_TOSS_COOL = 0.25;       // cada salteado baja la temperatura que se pasó del punto ideal
const WOK_OVER_ROUNDS = 3;        // a esta ronda de más (sobre las necesarias) se seca del todo y se quema; cada ronda de más antes resta calidad
const WOK_DRY_PTS = 12;           // puntos de cocción que resta cada ronda de más (el plato pierde jugo: queda más seco y salado)
const WOK_VIRTUAL = { crudo: 1, perfecto: 3, quemado: 4.5 };   // ventana "virtual" para reutilizar los puntos de cocción de siempre
// Guion de cocción de cada plato de Salteados (definido por el usuario). Cada plato se hace en una o más PARTES; cada parte se cocina en un utensilio (wok o sartén)
// y es una lista de RONDAS: en cada ronda entran ciertos ingredientes (a) y se saltea (3 toques); toss:false = esa ronda no se saltea (solo se agrega).
//  · to:'plate'  → la parte no va dentro del plato: queda como pieza de Emplatar (Yasaitame: el lomo)
//  · timed:n     → se cocina por tiempo (n s), sin saltear (tortilla del Omuraisu)
//  · un plato con 2 partes que van al plato se combina con el botón "Combinar"
const SAL_STAGED = {
  'Chaufa Shimaya': { plate: [94, 41, 18, 33], how: 'El chancho glaseado se sirve sobre el arroz chaufa.', parts: [
    { key: 'arroz',   label: 'arroz',             tool: 'wok', rounds: [{ a: [15] }, { a: [37] }, { a: [79] }, { a: [25] }, { a: [18, 31] }] },
    { key: 'chancho', label: 'chancho glaseado',  tool: 'wok', rounds: [{ a: [48, 27] }, { a: [87] }, { a: [99] }] } ] },
  'Yakimeshi': { plate: [94, 109, 33, 18, 42, 30], parts: [
    { key: 'main', label: '', tool: 'wok', rounds: [{ a: [15] }, { a: [100, 30, 23, 68, 104] }, { a: [37] }, { a: [40] }, { a: [31] }] } ] },
  'Yakiramen': { plate: [33, 30], parts: [
    { key: 'main', label: '', tool: 'wok', rounds: [{ a: [90, 105, 46, 45, 23, 95] }, { a: [90, 52, 1] }, { a: [90, 25, 68] }] } ] },
  'Yasaitame': { plate: [61, 33], parts: [
    { key: 'lomo',     label: 'lomo',     tool: 'wok', to: 'plate', plateKey: 'lomoSal', rounds: [{ a: [90, 61] }, { a: [] }, { a: [] }] },
    { key: 'verduras', label: 'verduras', tool: 'wok', rounds: [{ a: [90, 46, 45, 23, 95] }, { a: [90, 52, 1] }, { a: [90, 25, 68] }] } ] },
  'Karameshi': { plate: [33, 34, 18, 35, 74], parts: [
    { key: 'main', label: '', tool: 'wok', rounds: [{ a: [15, 52, 23] }, { a: [104] }, { a: [37] }, { a: [8] }, { a: [25, 18, 31] }] } ] },
  'Chicken Teriyaki': { plate: [37, 56, 52, 30, 62], parts: [
    { key: 'main', label: '', tool: 'pan', rounds: [{ a: [106] }, { a: [87] }, { a: [99] }] } ] },
  'Yakitori': { plate: [52, 30, 42, 117, 21, 118], how: 'En el plato, 3 brochetas a cada lado y la ensalada de col, zanahoria, betarraga, kiury y alga wanji en medio, con la salsa poke de atún.', parts: [
    { key: 'main', label: '', tool: 'pan', rounds: [{ a: [107] }, { a: [] }, { a: [101] }] } ] },
  'Batayaki Ramen': { plate: [71, 98, 35], how: 'Fideos al centro, estirados de punta a punta, y a un lado el lomo con champiñones y holantao.', parts: [
    { key: 'wok', label: 'lomo, champiñones y holantao', tool: 'wok', rounds: [{ a: [61, 75] }, { a: [] }, { a: [27, 23] }, { a: [78], toss: false }] },
    { key: 'pan', label: 'fideos',                       tool: 'pan', rounds: [{ a: [78, 4] }, { a: [1] }, { a: [102], toss: false }] } ] },
  'Omuraisu': { plate: [84, 52, 30, 62], how: 'El arroz con pollo va envuelto en la tortilla.', parts: [
    { key: 'wok', label: 'arroz con pollo', tool: 'wok', rounds: [{ a: [23, 30, 103, 104] }, { a: [37] }, { a: [86] }, { a: [] }] },
    { key: 'pan', label: 'tortilla',        tool: 'pan', timed: 6, whisk: 4, rounds: [{ a: [15, 15, 75], toss: false }] } ] }       // tortilla = 2 huevos + sal, por tiempo
};
const salPartIds = part => (part._ids || (part._ids = [...new Set(part.rounds.flatMap(r => r.a || []))]));
const salTossRounds = part => part.rounds.filter(r => r.toss !== false).length;
const salCookIds = name => { const ids = []; SAL_STAGED[name].parts.forEach(p => salPartIds(p).forEach(id => { if (!ids.includes(id)) ids.push(id); })); return ids; };
// ¿Este ingrediente solo se espera en rondas que no se saltean? (entonces no necesita una ronda completa para integrarse)
const salNoToss = (part, id) => { const rs = part.rounds.filter(r => (r.a || []).includes(id)); return rs.length > 0 && rs.every(r => r.toss === false); };
// ¿Entraron todas las unidades de los sólidos que se piden varias veces (los 2 huevos de la tortilla)? Las salsas repetidas no cuentan: se penalizan por ronda.
const salCountsOk = (w, part) => salPartIds(part).every(id => WOK_SAUCE_IDS.includes(id) || (w.log || []).filter(e => e.id === id).length >= salExpectedCount(part, id));
const salExpectedCount = (part, id) => part.rounds.reduce((n, r) => n + ((r.a || []).filter(x => x === id).length), 0);
// Cuántos ingredientes de la parte entraron en la ronda en que debían entrar (y cuántos se esperan en total)
function salRoundScore(wok, part) {
  const left = {};
  part.rounds.forEach((rd, k) => (rd.a || []).forEach(id => { (left[id] = left[id] || []).push(k); }));
  const total = Object.values(left).reduce((n, a) => n + a.length, 0);
  let ok = 0;
  (wok.log || []).forEach(e => { const L = left[e.id]; if (!L) return; const at = L.indexOf(e.round); if (at >= 0) { L.splice(at, 1); ok++; } });
  return { ok, total };
}
const WOK_WRONG_TOOL_PTS = 15;    // puntos de cocción que resta cocinar el plato en el utensilio equivocado
// Líquidos y aderezos de la cocción de Salteados: son botellas de la franja de herramientas (en orden); lo sólido se arrastra desde la despensa
const WOK_OIL_ID = 108;                  // aceite de cocina: TODO plato de Salteado empieza con el wok / sartén caliente y con aceite
const WOK_SAUCE_IDS = [8, 87, 90, 99, 101, 88, 31, 75, 102];     // los sachets (Base Chaufa, Base Yakimeshi, Salsa Omuraisu, Salsa Batayaki) están en la despensa
// Cocina de acero de salteado (referencia del usuario): pared trasera, plano de trabajo, borde y frente. Se estira al ancho de los dos woks
// (los trazos no cambian de grosor: vector-effect). Las hornillas, llamas y vapor son de cada wok (WOK_BURNER_SVG); los utensilios van a la derecha.
const WOK_STOVE_SVG = (() => {
  const ink = '#23262b', ne = 'vector-effect="non-scaling-stroke"';
  return `<svg class="ws-body" viewBox="0 0 100 100" preserveAspectRatio="none">
    <defs>
      <linearGradient id="wsBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3ccd5"/><stop offset="0.55" stop-color="#8f9ba8"/><stop offset="1" stop-color="#6f7b88"/></linearGradient>
      <linearGradient id="wsTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a96a3"/><stop offset="0.5" stop-color="#a7b1bc"/><stop offset="1" stop-color="#7d8996"/></linearGradient>
      <linearGradient id="wsFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8794a3"/><stop offset="0.45" stop-color="#6a7583"/><stop offset="1" stop-color="#454d57"/></linearGradient>
    </defs>
    <path d="M 2,0 H 98 L 99,33 H 1 Z" fill="url(#wsBack)" stroke="${ink}" stroke-width="1.8" ${ne} stroke-linejoin="round"/>
    <path d="M 5,3 H 95" stroke="#eef3f7" stroke-opacity="0.6" stroke-width="1.4" ${ne}/>
    <path d="M 70,4 L 62,31 M 76,4 L 70,31" stroke="#ffffff" stroke-opacity="0.22" stroke-width="3" ${ne}/>
    <path d="M 1,33 H 99 L 100,66 H 0 Z" fill="url(#wsTop)" stroke="${ink}" stroke-width="1.8" ${ne} stroke-linejoin="round"/>
    <path d="M 14,60 L 34,40 M 40,62 L 52,46 M 66,60 L 80,44" stroke="#ffffff" stroke-opacity="0.2" stroke-width="2.4" ${ne}/>
    <ellipse cx="12" cy="52" rx="7" ry="3" fill="#b28a62" opacity="0.26"/><ellipse cx="55" cy="40" rx="9" ry="2.6" fill="#c9a37a" opacity="0.2"/><ellipse cx="88" cy="55" rx="6" ry="3" fill="#b28a62" opacity="0.28"/>
    <path d="M 0,66 H 100 V 71 H 0 Z" fill="#c9d3dc" stroke="${ink}" stroke-width="1.6" ${ne}/>
    <path d="M 0,71 H 100 V 100 H 0 Z" fill="url(#wsFront)" stroke="${ink}" stroke-width="1.8" ${ne}/>
    <path d="M 2,76 H 98" stroke="#d6dee6" stroke-opacity="0.4" stroke-width="1.2" ${ne}/>
  </svg>
  <svg class="ws-utensils" viewBox="0 0 80 64">
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="M 76,6 L 36,46" stroke="${ink}" stroke-width="6" fill="none"/><path d="M 76,6 L 36,46" stroke="#b9c3cd" stroke-width="3.2" fill="none"/>
      <ellipse cx="26" cy="50" rx="17" ry="9" transform="rotate(-38 26 50)" fill="#d2dae2" stroke="${ink}" stroke-width="2"/>
      <g fill="#59626c"><circle cx="19" cy="52" r="1.5"/><circle cx="24" cy="48" r="1.5"/><circle cx="29" cy="45" r="1.5"/><circle cx="25" cy="54" r="1.5"/><circle cx="31" cy="51" r="1.5"/><circle cx="34" cy="46" r="1.5"/></g>
      <path d="M 66,2 L 52,30" stroke="${ink}" stroke-width="6" fill="none"/><path d="M 66,2 L 52,30" stroke="#8a5a2b" stroke-width="3.2" fill="none"/>
      <path d="M 50,30 L 57,33 L 49,46 L 41,43 Z" fill="#c6cfd8" stroke="${ink}" stroke-width="1.8"/>
    </g>
  </svg>`;
})();
// Espátula (referencia del usuario, viñeta 5): descansa dentro del wok y barre los ingredientes con cada salteado
const WOK_SPATULA_SVG = (() => {
  const ink = '#23262b';
  return `<svg viewBox="0 0 60 84" overflow="visible">
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="M 54,2 L 27,52" stroke="${ink}" stroke-width="7.4" fill="none"/><path d="M 54,2 L 27,52" stroke="#8a5a2b" stroke-width="4.6" fill="none"/><path d="M 51,6 L 31,43" stroke="#c28a52" stroke-opacity="0.7" stroke-width="1.4" fill="none"/>
      <path d="M 21,50 L 36,56 L 32,74 L 15,68 Z" fill="#cdd6de" stroke="${ink}" stroke-width="2.2"/>
      <path d="M 24,55 L 31,58" stroke="#ffffff" stroke-opacity="0.7" stroke-width="1.6"/>
    </g>
  </svg>`;
})();
const WOK_BURNER_SVG = (() => {
  let fl = '', big = '';
  for (let k = 0; k < 9; k++) { const fx = 16 + k * 8.5; fl += `<path d="M ${fx - 3.4},24 Q ${fx - 4.4},10 ${fx},-8 Q ${fx + 4.4},10 ${fx + 3.4},24 Z" fill="#4aa3ff" stroke="#1f5fa8" stroke-width="0.5"/><path d="M ${fx - 1.6},22 Q ${fx},12 ${fx + 1.6},22 Z" fill="#ff9a3d"/>`; }
  for (let k = 0; k < 7; k++) { const fx = 12 + k * 12.7, h = 38 + (k % 3) * 14; big += `<path d="M ${fx - 5},24 Q ${fx - 8},0 ${fx - 1},-${h} Q ${fx + 2},-${h * 0.5} ${fx + 8},-${h * 0.9} Q ${fx + 9},4 ${fx + 5},24 Z" fill="#ff8a1f" stroke="#e65100" stroke-width="0.6"/><path d="M ${fx - 2.4},22 Q ${fx},-4 ${fx + 1},-${h * 0.45} Q ${fx + 3},0 ${fx + 3},22 Z" fill="#ffe082"/>`; }
  const steam = '<g class="wb-steam" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M 34,-52 q -6,-12 0,-22 q 6,-10 0,-20"/><path d="M 52,-56 q 6,-12 0,-24 q -6,-10 0,-20"/><path d="M 68,-50 q -6,-11 0,-21 q 6,-9 0,-18"/></g>';
  return `<svg viewBox="0 0 100 40" preserveAspectRatio="none">
    <ellipse cx="50" cy="23" rx="47" ry="7.5" fill="#15181c" stroke="#59626c" stroke-width="1"/>
    <ellipse cx="50" cy="22.5" rx="34" ry="4.6" fill="#262a31"/>
    <path d="M 10,25 L 18,19 M 90,25 L 82,19 M 34,28 L 36,20 M 66,28 L 64,20" stroke="#4a515b" stroke-width="2.2" fill="none"/>
    <g class="wb-flames">${fl}</g>
    <g class="wb-flare">${big}</g>
    ${steam}
  </svg>`;
})();
// Cada hornilla tiene un wok y una sartén: el que está sobre el fuego es el "activo" y el otro queda guardado con su contenido (ingredientes, rondas, plato listo)
const WOK_VESSEL_KEYS = ['ingredients', 'result', 'matchedRecipe', 'stirring', 'stirSeconds', 'oil', 'toss', 'taps', 'rounds', 'addRound', 'log', 'cookT', 'interrupts', 'burnPeak', 'lastAct', 'profile', 'profileStaged', 'readyAt', 'orderMatches', 'orderTotal', 'dry', 'wrongTool', 'whisk', 'oilAdj'];
function wokTakeVessel(w) { const v = { tool: w.tool || 'wok' }; WOK_VESSEL_KEYS.forEach(k => { v[k] = w[k]; }); return v; }
function wokPutVessel(w, v) { WOK_VESSEL_KEYS.forEach(k => { w[k] = v[k]; }); w.tool = v.tool; }
function wokFreshVessel(tool) { const v = wokTakeVessel(newWok()); v.tool = tool; return v; }
const wokVesselUsed = v => !!v && (v.ingredients.length > 0 || !!v.result);

const wokStaged = () => !!gameState.woks && stagedOn('salteados');
const wokTossLock = [0, 0];
// Partes de guion que podrían ser lo que hay en el wok (todas las que contienen los ingredientes actuales). Solo platos ya desbloqueados.
function wokGuess(i) {
  const w = gameState.woks[i];
  if (!wokStaged() || !w || !w.ingredients.length) return [];
  const hits = [];
  getUnlockedRecipes().filter(r => r.area === 'salteados' && SAL_STAGED[r.name]).forEach(r => SAL_STAGED[r.name].parts.forEach(p => {
    const ids = salPartIds(p);
    if (w.ingredients.every(x => ids.includes(x))) hits.push({ dish: r.name, part: p });
  }));
  return hits;
}
// Guion de lo que hay en el wok: exacto (plato armado) o único candidato; null si no se sabe aún
function wokScriptOf(i) {
  const a = analyzeWok(i);
  if (a.status === 'MATCHED' && a.recipe && a.recipe.script) return { part: a.recipe.script, dish: a.recipe.partOf, exact: true };
  const g = wokGuess(i);
  return g.length === 1 ? { part: g[0].part, dish: g[0].dish, exact: false } : null;
}
function wokRoundsNeeded(i) {
  const sc = wokScriptOf(i);
  if (sc) return Math.max(1, salTossRounds(sc.part));
  const a = analyzeWok(i);
  return Math.max(2, Math.min(5, a.recipe ? a.recipe.ingredients.length : 2));
}
// Cada ingrediente cuenta como integrado cuando pasa una ronda completa desde que entró (los que no se saltean, como el limón del final, no la necesitan)
const wokIntegrated = (w, part) => (w.log && w.log.length ? w.log : w.ingredients.map(id => ({ id, round: (w.addRound && w.addRound[id] != null) ? w.addRound[id] : -1 })))
  .every(e => (part && salNoToss(part, e.id)) || (w.rounds || 0) > e.round);
function wokReady(i) {
  const w = gameState.woks[i];
  if (!w || w.result) return false;
  const a = analyzeWok(i);
  if (a.status !== 'MATCHED') return false;
  const part = a.recipe.script;
  if (part && part.timed) return salCountsOk(w, part) && (w.cookT || 0) >= part.timed;   // se cocina por tiempo, con todo puesto
  return wokIntegrated(w, part) && (w.rounds || 0) >= wokRoundsNeeded(i);
}
// Anota en qué ronda entró cada ingrediente (cuenta como integrado cuando pasa una ronda completa)
function wokNoteAdded(w, id) {
  if (!w.addRound) w.addRound = {};
  if (!w.log) w.log = [];
  const round = w.rounds || 0;
  w.log.push({ id, round });
  if (w.addRound[id] == null) w.addRound[id] = round;
  w.lastAct = performance.now();
}
// Aviso al agregar un ingrediente cuando la receta ya se reconoce: ¿entra en esta ronda?
function wokAddFeedback(i, id, sc) {
  if (!sc || !sc.exact && !sc.part) return;
  const w = gameState.woks[i], cur = w.rounds || 0, where = [];
  sc.part.rounds.forEach((rd, k) => { if ((rd.a || []).includes(id)) where.push(k); });
  const ing = INGREDIENTES.find(x => x.id === id), name = ing ? (ing.short || ing.display) : id;
  if (!where.length) { showStationToast(`⚠ ${name} no va en esta receta (${sc.dish}).`); try { playSound('error'); } catch (e) {} return; }
  if (!where.includes(cur)) { showStationToast(`⚠ ${name} entra en la ronda ${where[0] + 1}, no en la ${cur + 1}.`); try { playSound('error'); } catch (e) {} }
}
// Utensilio que pide el plato armado: 'pan' (sartén), 'wok' o null si aún no se sabe (o hay platos mezclados con distinto utensilio)
function wokNeededTool(i) {
  const a = analyzeWok(i);
  if (a.status !== 'MATCHED' || !a.recipe) return null;
  return a.recipe.partTool || null;
}
const wokToolName = t => (t === 'pan' ? 'SARTÉN' : 'WOK');
// Cambia el utensilio de la hornilla (wok ⇄ sartén). Si ya hay comida se pasa al otro utensilio: la ronda en curso se pierde.
function wokSwapTool(i) {
  if (!wokStaged() || gameState.isPaused || gameState.isGameOver) return;
  const w = gameState.woks[i];
  if (!w || i >= wokLimit()) return;
  const card = document.getElementById(`wok-card-${i}`);
  if (card) { card.classList.remove('swapping'); void card.offsetWidth; card.classList.add('swapping'); setTimeout(() => card.classList.remove('swapping'), 460); }
  try { playSound('swish'); } catch (e) {}
  setTimeout(() => {
    if (!gameState.woks[i] || gameState.woks[i] !== w) return;
    const target = w.tool === 'pan' ? 'wok' : 'pan';
    if (w.ingredients.length && !w.result && (w.taps || 0) > 0) { w.interrupts = (w.interrupts || 0) + 1; w.taps = 0; showStationToast('⚠ Cambiaste de utensilio a mitad de un salteado: la comida pierde calidad.'); }
    const next = (w.parked && w.parked.tool === target) ? w.parked : wokFreshVessel(target);
    const out = wokTakeVessel(w);
    w.parked = wokVesselUsed(out) ? out : null;          // lo que había en el utensilio que se retira se guarda (no se pierde)
    wokPutVessel(w, next);
    w.lastAct = performance.now();
    showStationToast(`🍳 Hornilla ${i + 1}: ahora usas ${target === 'pan' ? 'la SARTÉN' : 'el WOK'}${wokVesselUsed(next) ? ' (conserva lo que tenía)' : ''}${w.parked ? ' · el otro utensilio queda guardado con su contenido' : ''}.`);
    renderWoks();
  }, 200);
}
// ¿Alguna receta posible pide más unidades de este ingrediente? (aunque todavía no se sepa cuál es el plato)
function wokAllowsMore(i, id) {
  const w = gameState.woks[i], have = (w.log || []).filter(e => e.id === id).length;
  if (have < 1) return true;
  const sc = wokScriptOf(i), parts = sc ? [sc.part] : wokGuess(i).map(h => h.part);
  return parts.some(p => have < salExpectedCount(p, id));
}
// Segunda (o tercera) unidad de un sólido que la receta pide varias veces: no es un ingrediente nuevo, solo suma una unidad
function wokAddExtra(i, id) {
  const w = gameState.woks[i];
  if (!wokStaged() || !w || w.result) return false;
  const sc = wokScriptOf(i);
  if (!wokAllowsMore(i, id)) return false;
  if (!wokReadyToCook(i)) return true;                 // ya avisó por qué no se puede
  wokNoteAdded(w, id);
  wokAddFeedback(i, id, sc);
  try { playSound('add'); } catch (e) {}
  renderWoks();
  return true;
}
// Todo plato de Salteado empieza con el utensilio ENCENDIDO, CALIENTE y con ACEITE: sin eso no se puede agregar ningún ingrediente
function wokReadyToCook(i) {
  const w = gameState.woks[i];
  if (!wokStaged() || !w) return true;
  let msg = '';
  if (!w.fire) msg = '🔥 Primero enciende el fuego (la perilla de abajo).';
  else if (!w.oil) msg = '🛢️ Primero echa el ACEITE DE COCINA (la botella amarilla, la primera de la franja; no el de ajonjolí).';
  else if ((w.heat || 0) < 0.9) msg = '🔥 Espera: aún no está caliente.';
  if (!msg) return true;
  showStationToast(msg);
  try { playSound('error'); } catch (e) {}
  return false;
}
function wokFireToggle(i) {
  if (!wokStaged() || gameState.isPaused || gameState.isGameOver) return;
  if (i >= wokLimit()) { showStationToast('🔒 Este wok se abre completando más retos del entrenamiento.'); return; }
  const w = gameState.woks[i];
  if (!w) return;
  if (w.fire && (w.taps || 0) > 0 && w.ingredients.length && !w.result) {     // apagar a mitad de una ronda: la comida pierde calidad
    w.interrupts = (w.interrupts || 0) + 1;
    w.taps = 0;
    showStationToast('⚠ Apagaste a mitad de un salteado (3 lanzamientos): la comida pierde calidad.');
    try { playSound('error'); } catch (e) {}
  }
  w.fire = !w.fire;
  w.lastAct = performance.now();
  try { playSound(w.fire ? 'flame' : 'click'); } catch (e) {}
  showStationToast(w.fire ? `🔥 Wok ${i + 1} encendido: tarda ${WOK_HEAT_SECS} s en calentar.` : `🔥 Wok ${i + 1} apagado.`);
  renderWoks();
}
// Botella sobre el wok: aceite (sin él el plato pierde puntos) o salsa de cocción (entra como ingrediente). Devuelve false si no entró.
function wokPour(i, id) {
  const w = gameState.woks[i];
  if (!w || i >= wokLimit()) return false;
  if (w.result) { showStationToast('🍳 Ese wok ya está listo: pásalo a emplatar o vacíalo.'); try { playSound('error'); } catch (e) {} return false; }
  if (id === WOK_OIL_ID) {                                                       // aceite de cocina: no es un ingrediente, prepara el utensilio
    if (w.oil) { showStationToast(`🛢️ El wok ${i + 1} ya tiene aceite.`); return false; }
    w.oil = true;
    w.lastAct = performance.now();
    try { playSound('add'); } catch (e) {}
    renderWoks();
    return true;
  }
  if (!wokReadyToCook(i)) return false;
  const sc = wokScriptOf(i), have = (w.log || []).filter(e => e.id === id).length;
  if (have >= 1 && !wokAllowsMore(i, id)) {                                        // la receta puede pedir la misma salsa en varias rondas
    const ing = INGREDIENTES.find(x => x.id === id);
    showStationToast(`💧 ${ing ? ing.display : id}: ya echaste lo que pide esta receta.`);
    return false;
  }
  if (!w.ingredients.includes(id)) {
    if (!stCookTake('salteados', id)) return false;
    w.ingredients.push(id);
  }
  wokNoteAdded(w, id);
  wokAddFeedback(i, id, sc);
  try { playSound('add'); } catch (e) {}
  renderWoks();
  renderPantryGrid();
  return true;
}
// Resultado "virtual" para reutilizar la evaluación de cocción: PERFECTO en el centro de la ventana (algo menos si se apagó a mitad de una ronda)
// Aviso de ronda de más: cartel grande + mensaje; el plato pierde jugo y sale más seco y salado
function wokDryAlert(extra) {
  const left = Math.max(0, WOK_OVER_ROUNDS + (getUpgradeLevel('wok') >= 2 ? 1 : 0) - extra);
  try { triggerAbolladoEffect(extra >= 2 ? '🧂 ¡PLATO MUY SECO Y SALADO! 🧂' : '🧂 PLATO SECO Y SALADO 🧂', `Ronda de más ${extra}: −${WOK_DRY_PTS * extra} pts · retíralo ya${left ? '' : ' (¡se quema!)'}`); } catch (e) {}
  try { playSound('error'); } catch (e) {}
  showStationToast(`🧂 Ronda de más (${extra}): cada vuelta le saca más jugo y lo deja más seco y salado (−${WOK_DRY_PTS * extra} pts de cocción).`);
}
function wokSetResult(i, result) {
  const w = gameState.woks[i], p = WOK_VIRTUAL;
  const scr = wokScriptOf(i), timed = scr && scr.part.timed;
  const progress = timed ? Math.min(1, (w.cookT || 0) / timed) : Math.min(1, ((w.rounds || 0) + (w.taps || 0) / WOK_TAPS_PER_ROUND) / wokRoundsNeeded(i));
  w.profile = { ...p };
  w.dry = timed ? 0 : Math.max(0, (w.rounds || 0) - wokRoundsNeeded(i));       // rondas de más
  const need = wokNeededTool(i);
  w.wrongTool = !!need && need !== (w.tool || 'wok');            // plato de sartén hecho en wok (o al revés)
  if (w.wrongTool) showStationToast(`⚠ Ese plato va en ${wokToolName(need)}: cocinarlo en ${wokToolName(w.tool || 'wok')} resta ${WOK_WRONG_TOOL_PTS} pts de cocción.`);
  if (result === 'PERFECTO') w.stirSeconds = (w.interrupts || 0) ? p.crudo + 0.85 * (p.perfecto - p.crudo) : (p.crudo + p.perfecto) / 2;
  else if (result === 'CRUDO') w.stirSeconds = p.crudo * Math.max(0.05, progress) * 0.95;
  else w.stirSeconds = (p.perfecto + p.quemado) / 2;
  w.toss = Math.max(0, Math.min(1, progress - 0.3 * (w.interrupts || 0) - 0.5 * (w.burnPeak || 0)));
}
function wokBurn(i, why) {
  const w = gameState.woks[i];
  if (!w || w.result) return;
  if (analyzeWok(i).status !== 'MATCHED') {                                    // lo que había aún no era un plato: se echa a perder
    showStationToast('💨 Se quemó lo que había en el wok: vacíalo.');
    try { playSound('burn'); } catch (e) {}
    w.heat = 1; w.burnPeak = 1; w.lastAct = performance.now();
    return;
  }
  showStationToast(why === 'over' ? '💨 Te pasaste de salteado: se secó y se quemó.' : '💨 Dejaste de saltear: se quemó.');
  wokSetResult(i, 'QUEMADO');
  finishStir(i, 'QUEMADO');
}
// El botón de arriba RETIRA el plato: en su punto sale perfecto; si aún no estaba, crudo.
function wokStagedTap(i) {
  const w = gameState.woks[i];
  if (!w || w.result || gameState.isPaused || gameState.isGameOver) return;
  if (i >= wokLimit()) return;
  const started = (w.rounds || 0) > 0 || (w.taps || 0) > 0 || (w.cookT || 0) > 0;
  if (!w.fire && !started) { wokFireToggle(i); return; }
  if (analyzeWok(i).status !== 'MATCHED') return;
  if (!started) { showStationToast('⤴ Lanza el wok deslizando el dedo hacia arriba (3 lanzamientos = 1 ronda; un toque también vale).'); return; }
  const result = wokReady(i) ? 'PERFECTO' : 'CRUDO';
  wokSetResult(i, result);
  finishStir(i, result);
}
function wokStagedBtnUi(w, i, btn) {
  const label = document.getElementById(`wok-stir-label-${i}`), fill = document.getElementById(`wok-stir-fill-${i}`);
  const sc = wokScriptOf(i), part = sc && sc.part, needed = wokRoundsNeeded(i), timed = part && part.timed;
  const started = (w.rounds || 0) > 0 || (w.taps || 0) > 0 || (w.cookT || 0) > 0;
  let zone = '', text = '', pct = 0;
  if (!w.fire && !started) text = '🔥 Enciende el fuego';
  else if ((w.heat || 0) < 0.9 && !started) text = 'Calentando…';
  else if (timed && !salCountsOk(w, part)) { text = '🥚 Faltan ingredientes'; }
  else if (timed && !wokWhisked(w, part)) { zone = 'crudo'; text = '🥚 Bate: gira el dedo sobre la sartén (' + Math.round(100 * (w.whisk || 0) / part.whisk) + '%)'; pct = Math.round(100 * (w.whisk || 0) / part.whisk); }
  else if (timed) {
    pct = Math.round(Math.min(1, (w.cookT || 0) / timed) * 100);
    if ((w.heat || 0) > 1.05) { zone = 'quemado'; text = '¡Se quema! Retírala'; }
    else if (wokReady(i)) { zone = 'perfecto'; text = '✅ ¡Lista! Toca para retirar'; }
    else { zone = 'crudo'; text = `⏱ Cocinando… ${Math.ceil(Math.max(0, timed - (w.cookT || 0)))} s`; }
  }
  else if (!started) text = '⤴ Lanza el wok: desliza hacia arriba · 3 = 1 ronda';
  else if ((w.heat || 0) > 1.05) { zone = 'quemado'; text = '¡Se quema! Sigue salteando'; }
  else if (wokNeededTool(i) && wokNeededTool(i) !== (w.tool || 'wok')) { zone = 'quemado'; text = `⚠ Va en ${wokToolName(wokNeededTool(i))}: cámbialo ⇄ (−${WOK_WRONG_TOOL_PTS})`; }
  else if (wokReady(i) && (w.rounds || 0) > needed) { zone = 'quemado'; text = `🧂 ¡Retira ya! Seco y salado (−${WOK_DRY_PTS * ((w.rounds || 0) - needed)})`; }
  else if (wokReady(i)) { zone = 'perfecto'; text = '✅ ¡Listo! Toca para retirar'; }
  else { zone = 'crudo'; text = `Ronda ${Math.min(needed, (w.rounds || 0) + 1)}/${needed} · retirar (crudo)`; }
  if (label && label.textContent !== text) label.textContent = text;
  if (!timed) pct = Math.round(Math.min(1, ((w.rounds || 0) + (w.taps || 0) / WOK_TAPS_PER_ROUND) / needed) * 100);
  if (fill) fill.style.width = `${pct}%`;
  ['crudo', 'perfecto', 'quemado'].forEach(z => btn.classList.toggle('zone-' + z, z === zone));
  btn.classList.toggle('stirring-active', zone === 'perfecto');
}
// Guía de la ronda: encima del wok, la ronda en curso y los ingredientes que entran (los ya echados, atenuados)
function wokGuideHtml(i) {
  const w = gameState.woks[i];
  if (!wokStaged() || !w || w.result) return null;
  if (!w.ingredients.length) {                                                      // wok vacío: pasos para empezar
    if (!w.fire) return '① 🔥 Enciende el fuego';
    if (!w.oil) return '② 🛢️ Echa aceite' + ((w.heat || 0) < 0.9 ? ' <span class="rc-t">(calentando…)</span>' : '');
    if ((w.heat || 0) < 0.9) return '③ ⏳ Calentando…';
    return '✅ Listo: agrega los ingredientes';
  }
  const a = analyzeWok(i);
  let part = null;
  if (a.status === 'MATCHED' && a.recipe.script) part = a.recipe.script;
  else {
    const hits = wokGuess(i);
    if (hits.length > 1) { const nm = [...new Set(hits.map(h => h.dish.split(' ')[0]))]; return `Armando (${w.ingredients.length}) · ¿${nm.slice(0, 2).join(' / ')}${nm.length > 2 ? ' +' + (nm.length - 2) : ''}?`; }
    if (hits.length === 1) part = hits[0].part;
  }
  if (!part) return null;
  if (a.status === 'MATCHED' && !part.timed && wokReady(i)) return `✅ ¡Listo!${a.recipe.isPart ? ' (parte)' : ''}${wokNeededTool(i) && wokNeededTool(i) !== (w.tool || 'wok') ? ` <span class="rc-t" style="color:#ffab91">⚠ va en ${wokToolName(wokNeededTool(i)).toLowerCase()}</span>` : ''}`;
  const cur = w.rounds || 0, total = part.rounds.length, rd = part.rounds[cur];
  const wrong = a.status === 'MATCHED' && wokNeededTool(i) && wokNeededTool(i) !== (w.tool || 'wok') ? ` <span class="rc-t" style="color:#ffab91">⚠ va en ${wokToolName(wokNeededTool(i)).toLowerCase()}</span>` : '';
  if (part.timed && salCountsOk(w, part) && !wokWhisked(w, part)) return `<b>${part.label}</b> 🥚 bate: gira el dedo (${Math.round(100 * (w.whisk || 0) / part.whisk)}%)`;
  if (part.timed && salCountsOk(w, part)) return `<b>${part.label}</b> ${wokReady(i) ? '✅ lista' : '⏱ ' + Math.ceil(Math.max(0, part.timed - (w.cookT || 0))) + ' s'}${wrong}`;
  if (!rd) return wokReady(i) ? `✅ ¡Listo!${wrong}` : null;
  const have = {};
  (w.log || []).forEach(e => { if (e.round === cur) have[e.id] = (have[e.id] || 0) + 1; });
  const icon = id => { const ing = INGREDIENTES.find(x => x.id === id), done = have[id] > 0; if (done) have[id]--; return `<span class="rc-ing${done ? ' done' : ''}" title="${ing ? ing.display : ''}">${ing ? ingIconHtml(ing) : ''}</span>`; };
  const items = (rd.a || []).map(icon).join('');
  return `<b>Ronda ${cur + 1}/${total}</b> ${items || '<span class="rc-t">🔁 saltea</span>'}${rd.toss === false ? ' <span class="rc-t">sin saltear</span>' : ''}${wrong}`;
}
// Estado visual de cada wok (llamas, temperatura, toques de la ronda, botón): se actualiza cada décima de segundo sin recrear los botones.
function wokUpdateFireUi() {
  const on = wokStaged();
  const box = document.getElementById('salteado-station-box');
  if (box) box.classList.toggle('wok-staged', on);
  if (!on) return;
  document.querySelectorAll('.wok-burner').forEach(b => { if (!b.firstChild) b.innerHTML = WOK_BURNER_SVG; });
  document.querySelectorAll('.wok-spatula').forEach(b => { if (!b.firstChild) b.innerHTML = WOK_SPATULA_SVG; });
  const stoveEl = document.getElementById('wok-stove');
  if (stoveEl && !stoveEl.firstChild) stoveEl.innerHTML = WOK_STOVE_SVG;
  gameState.woks.forEach((w, i) => {
    const card = document.getElementById(`wok-card-${i}`);
    if (!card || !w) return;
    const heat = w.heat || 0;
    card.classList.toggle('fire-on', !!w.fire);
    card.classList.toggle('is-hot', heat >= 1);
    card.classList.toggle('overheat', heat > 1.05);
    card.classList.toggle('has-food', w.ingredients.length > 0 && !w.result);
    card.classList.toggle('is-pan', w.tool === 'pan');
    const pc = document.getElementById(`wok-parked-${i}`);
    if (pc) {                                                    // el otro utensilio guardado en esta hornilla, con su contenido
      const pk = w.parked, has = wokVesselUsed(pk);
      const html = has ? `<span>${pk.tool === 'pan' ? '🍳' : '🥘'}</span><b>${pk.result ? '✅' : '⏸'}</b>` : '';
      if (pc._h !== html) { pc._h = html; pc.innerHTML = html; pc.style.display = has ? 'flex' : 'none'; pc.title = has ? `${pk.tool === 'pan' ? 'Sartén' : 'Wok'} guardado${pk.result && pk.matchedRecipe ? ': ' + pk.matchedRecipe.name + ' (listo)' : ' (a medias)'} · toca para cambiar` : ''; }
    }
    card.classList.toggle('needs-fire', !w.fire && !w.result && !w.ingredients.length);
    const sl = document.getElementById(`wok-swap-lab-${i}`);
    if (sl) { const t = wokToolName(w.tool); if (sl.textContent !== t) sl.textContent = t; }
    const fill = document.getElementById(`wok-heat-fill-${i}`);
    if (fill) fill.style.width = `${Math.round(Math.min(1, heat / WOK_HEAT_BURN) * 100)}%`;
    card.querySelectorAll('.wok-toss-pips i').forEach((p, k) => p.classList.toggle('on', k < (w.taps || 0)));
    const rl = document.getElementById(`wok-round-${i}`);
    if (rl) { const sc0 = w.result ? null : wokScriptOf(i), nd = wokRoundsNeeded(i), t = (w.result || (sc0 && sc0.part.timed)) ? '' : ((w.rounds || 0) > nd ? `🧂+${(w.rounds || 0) - nd}` : ((w.rounds || 0) >= nd ? '✓' : `Ronda ${(w.rounds || 0) + 1}/${nd}`)); if (rl.textContent !== t) rl.textContent = t; }
    const bd = document.getElementById(`wok-badge-${i}`);
    if (bd && !w.result) {
      const gh = wokGuideHtml(i);
      if (gh) { if (bd._g !== gh) { bd._g = gh; bd.innerHTML = gh; bd.classList.remove('status-error', 'status-warn', 'status-ready'); bd.classList.add('rc'); bd.style.display = 'block'; } }
      else if (bd._g) { bd._g = null; bd.classList.remove('rc'); renderWoks(); }
    }
    const btn = document.getElementById(`wok-stir-btn-${i}`);
    if (btn && btn.style.display !== 'none' && !w.result) wokStagedBtnUi(w, i, btn);
  });
}
function wokStagedTick() {
  if (!gameState.woks || !wokStaged() || gameState.isPaused || gameState.isGameOver) return;
  const dt = 0.1, now = performance.now(), lvl = getUpgradeLevel('wok');
  gameState.woks.forEach((w, i) => {
    if (!w) return;
    const h = w.heat || 0;
    if (!w.fire) w.heat = Math.max(0, h - dt / (WOK_HEAT_SECS * 2));
    else if (h < 1) w.heat = Math.min(1, h + dt / WOK_HEAT_SECS);
    else if (w.ingredients.length && !w.result && i < wokLimit()) {
      const sc = wokScriptOf(i);
      if (sc && sc.part.timed) {                                   // tortilla: se cocina por tiempo, sin saltear
        if (sc.exact && salCountsOk(w, sc.part) && wokWhisked(w, sc.part)) { w.cookT = (w.cookT || 0) + dt; sfxEvery('sizzle', 500); if (!isFree() && w.cookT >= sc.part.timed * 2) wokBurn(i, 'over'); }
      } else if (!isFree()) {
        const waitingFinish = !!sc && salTossRounds(sc.part) <= (w.rounds || 0);       // ya se saltearon todas las rondas: solo falta agregar lo que no se saltea
        const grace = (waitingFinish ? 10 : WOK_IDLE_GRACE) + 0.5 * lvl;
        if (now - (w.lastAct || now) > grace * 1000) {
          w.heat = Math.min(WOK_HEAT_BURN, h + dt * (WOK_HEAT_BURN - 1) / WOK_OVERHEAT_SECS);   // sin saltear, la temperatura se pasa del punto ideal
          w.burnPeak = Math.max(w.burnPeak || 0, (w.heat - 1) / (WOK_HEAT_BURN - 1));
          sfxEvery('sizzle', 500);
          if (w.heat >= WOK_HEAT_BURN) wokBurn(i, 'idle');
        }
      }
    }
  });
  wokUpdateFireUi();
}
setInterval(wokStagedTick, 100);
// Cada toque sobre el wok es un salteado; 3 toques = 1 ronda
// kind: 'a' y 'b' = salteados cortos (desliza e inclina hacia un lado y hacia el otro); 'c' = el tercero de la ronda: lanza todo al aire con una llamarada
function wokTossFx(i, kind) {
  const card = document.getElementById(`wok-card-${i}`);
  if (!card) return;
  const big = kind === 'c';
  card.dataset.toss = kind;
  card.classList.remove('tossing'); void card.offsetWidth; card.classList.add('tossing');
  clearTimeout(card._tossTimer);
  card._tossTimer = setTimeout(() => card.classList.remove('tossing'), big ? 820 : 600);
  const fx = document.getElementById(`wok-fx-${i}`);
  if (!fx) return;
  const dir = kind === 'b' ? -1 : 1, cols = ['#e53935', '#43a047', '#8e24aa', '#fb8c00', '#9ccc65', '#fdd835'];
  let h = '';
  for (let k = 0; k < (big ? 16 : 7); k++) {                       // trocitos de verdura que salen volando y caen
    const dx = dir * (big ? 4 : 6) + (Math.random() - 0.5) * (big ? 44 : 30), dy = -(big ? 26 + Math.random() * 34 : 12 + Math.random() * 16);
    h += `<i class="wok-bit" style="--dx:${dx.toFixed(1)}cqw;--dy:${dy.toFixed(1)}cqw;--r:${Math.round(Math.random() * 300 - 150)}deg;--c:${cols[k % cols.length]};--d:${big ? 0.85 : 0.62}s;animation-delay:${k * (big ? 22 : 30)}ms" onanimationend="this.remove()"></i>`;
  }
  if (big) {
    const sc = ['#ff7043', '#ffb300', '#ffee58'];
    for (let k = 0; k < 10; k++) h += `<i class="wok-spark" style="--dx:${((Math.random() - 0.5) * 62).toFixed(1)}cqw;--dy:${(-(20 + Math.random() * 42)).toFixed(1)}cqw;--c:${sc[k % 3]};animation-delay:${k * 18}ms" onanimationend="this.remove()"></i>`;
  }
  fx.insertAdjacentHTML('beforeend', h);
}
function wokToss(i) {
  const w = gameState.woks[i];
  if (!w || w.result || gameState.isPaused || gameState.isGameOver || i >= wokLimit()) return;
  const now = performance.now();
  if (now < wokTossLock[i]) return;                          // el salteado anterior aún no termina su animación
  if (!w.ingredients.length) { wokTossLock[i] = now + 600; showStationToast('🍳 Aún no hay nada en el wok: arrastra los ingredientes.'); return; }
  if (!w.fire) { wokTossLock[i] = now + 600; showStationToast('🔥 Enciende el fuego del wok (la perilla de abajo) para saltear.'); return; }
  if ((w.heat || 0) < 0.9) { wokTossLock[i] = now + 600; showStationToast('🔥 El wok aún se calienta…'); return; }
  const scT = wokScriptOf(i);
  if (scT && scT.part.timed) { wokTossLock[i] = now + 800; showStationToast(wokNeedsWhisk(i) ? '🥚 Bate los huevos: gira el dedo sobre la sartén.' : '🍳 Esto se cocina por tiempo: no hace falta saltear.'); return; }
  const kind = ['a', 'b', 'c'][Math.min(2, w.taps || 0)];     // 1.º y 2.º toque de la ronda: cortos; 3.º: lanzamiento grande
  wokTossLock[i] = now + (kind === 'c' ? WOK_BIG_LOCK_MS : WOK_TOSS_LOCK_MS);
  wokTossFx(i, kind);
  try { playSound('stir'); } catch (e) {}
  sfxEvery('sizzle', 200);
  w.lastAct = now;
  if ((w.heat || 0) > 1) w.heat = Math.max(1, w.heat - WOK_TOSS_COOL);   // saltear baja la temperatura que se pasó
  w.taps = (w.taps || 0) + 1;
  if (w.taps >= WOK_TAPS_PER_ROUND) {
    w.taps = 0;
    w.rounds = (w.rounds || 0) + 1;
    try { playSound('match'); } catch (e) {}
    const needed = wokRoundsNeeded(i), matched = analyzeWok(i).status === 'MATCHED', extra = w.rounds - needed;
    const limit = WOK_OVER_ROUNDS + (getUpgradeLevel('wok') >= 2 ? 1 : 0);
    if (matched && extra >= limit && !isFree()) wokBurn(i, 'over');
    else if (matched && extra >= 1 && wokIntegrated(w, scT && scT.part)) wokDryAlert(extra);
    else if (wokReady(i)) showStationToast('✅ ¡Listo! Toca el botón verde de la hornilla para retirarlo: cada ronda de más lo seca y resta calidad.');
    else {
      const nx = scT && scT.part.rounds[w.rounds], nm = id => { const ing = INGREDIENTES.find(x => x.id === id); return ing ? (ing.short || ing.display) : id; };
      showStationToast(`🍳 Ronda ${w.rounds} completa` + (nx ? (nx.a && nx.a.length ? `: ahora agrega ${nx.a.map(nm).join(', ')}${nx.toss === false ? ' (sin saltear)' : ''}` : ': saltea otra ronda') : '') + '.');
    }
  }
  wokUpdateFireUi();
}
// Salteo: se LANZA el wok deslizando el dedo hacia arriba sobre él (un toque suelto, al soltar, vale por un lanzamiento: respaldo).
// Tortilla del Omuraisu: antes de cocerse hay que BATIR los huevos con la sal girando el dedo sobre la sartén.
const WOK_FLICK_PX = 26;
let wokPress = null;
function wokWhisked(w, part) { return !part || !part.whisk || (w.whisk || 0) >= part.whisk; }
function wokNeedsWhisk(i) {
  const w = gameState.woks[i], sc = w && wokScriptOf(i);
  return !!(sc && sc.exact && sc.part.whisk && salCountsOk(w, sc.part) && !wokWhisked(w, sc.part));
}
function wokWhiskStep(i, r) {
  const w = gameState.woks[i], sc = wokScriptOf(i);
  if (!w || !sc || !sc.part.whisk) return;
  const rev = Math.abs(r.delta) / (2 * Math.PI), ok = r.speed >= 0.8;                  // batir pide ritmo vivo: ≥ 0,8 vueltas/s
  const before = w.whisk || 0;
  w.whisk = Math.min(sc.part.whisk, before + rev * (ok ? 1 : 0.4));
  w.lastAct = performance.now();
  if (Math.floor(before) < Math.floor(w.whisk)) { try { playSound('stir'); } catch (e) {} }
  if (before < sc.part.whisk && w.whisk >= sc.part.whisk) {
    try { playSound('match'); } catch (e) {}
    showStationToast('🥚 ¡Huevos batidos con la sal! Ahora se cocina la tortilla.');
  }
  wokUpdateFireUi();
}
document.addEventListener('pointerdown', (e) => {
  if (!wokStaged() || !e.target.closest || gameState.isPaused || gameState.isGameOver) return;
  const c = e.target.closest('.wok-dock-card');
  if (!c || e.target.closest('button')) return;
  const r = c.getBoundingClientRect();
  wokPress = { i: parseInt(c.id.replace('wok-card-', ''), 10), id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), fired: false, far: 0,
    circle: new CircleTracker(r.left + r.width / 2, r.top + r.height * 0.45, Math.min(r.width, r.height) * 0.1) };
  wokPress.circle.feed(e.clientX, e.clientY, performance.now());
}, { passive: true });
document.addEventListener('pointermove', (e) => {
  const p = wokPress;
  if (!p || e.pointerId !== p.id) return;
  p.far = Math.max(p.far, Math.hypot(e.clientX - p.x0, e.clientY - p.y0));
  if (wokNeedsWhisk(p.i)) {                                                   // batir: gira el dedo sobre la sartén
    const r = p.circle.feed(e.clientX, e.clientY, performance.now());
    if (r && r.delta) { p.fired = true; wokWhiskStep(p.i, r); }
    return;
  }
  if (!p.fired && p.y0 - e.clientY >= WOK_FLICK_PX) { p.fired = true; wokToss(p.i); }   // lanzamiento hacia arriba
}, { passive: true });
const wokPressEnd = (e) => {
  const p = wokPress;
  if (!p || e.pointerId !== p.id) return;
  wokPress = null;
  if (e.type === 'pointerup' && !p.fired && p.far <= 12 && performance.now() - p.t0 <= 450) {
    if (wokNeedsWhisk(p.i)) { showStationToast('🥚 Bate los huevos: gira el dedo sobre la sartén.'); return; }
    wokToss(p.i);                                                              // respaldo: toque suelto
  }
};
document.addEventListener('pointerup', wokPressEnd, { passive: true });
document.addEventListener('pointercancel', wokPressEnd, { passive: true });

function finishStir(index, result) {
  const wok = gameState.woks[index];
  if (!wok || wok.result) return;
  const analysis = analyzeWok(index);
  wok.stirring = false;
  wok.result = result;
  wok.readyAt = gameState.gameClock;
  wok.matchedRecipe = analysis.recipe || null;
  wok.orderMatches = analysis.orderMatches;
  wok.orderTotal = analysis.orderTotal;
  playSound(result === 'PERFECTO' ? 'match' : 'burn');
  if (wokStaged() && !wok.oil) showStationToast('🛢️ Sin aceite: el plato saldrá de menor calidad.');
  renderWoks();
  if (result === 'PERFECTO') vfxAtElement(`wok-card-${index}`, 'good');
  else if (result === 'QUEMADO') vfxAtElement(`wok-card-${index}`, 'bad');
}

function setupWokStirButtons() {
  for (let i = 0; i < 2; i++) {
    const btn = document.getElementById(`wok-stir-btn-${i}`);
    if (!btn || btn._hasListeners) continue;
    btn._hasListeners = true;
    let stirInterval = null;
    const index = i;

    const startStir = (e) => {
      if (e && e.cancelable) e.preventDefault();
      if (gameState.isPaused || gameState.isGameOver) return;
      if (wokStaged()) { wokStagedTap(index); return; }   // con etapas: el wok se cocina solo sobre el fuego y aquí se RETIRA
      const wok = gameState.woks[index];
      if (wok.result || wok.stirring) return;
      const analysis = analyzeWok(index);
      if (analysis.status !== 'MATCHED') return;
      if (!coopLock(`wok-card-${index}`)) return;

      try { if (e && e.pointerId && btn.setPointerCapture) btn.setPointerCapture(e.pointerId); } catch(err) {}

      wok.stirring = true;
      wok.stirSeconds = 0;
      wok.profile = wokProfile(analysis.recipe);
      btn.classList.add('stirring-active');
      const wokCard = document.getElementById(`wok-card-${index}`);
      if (wokCard) wokCard.classList.add('is-stirring');
      playSound('flame');

      const fillEl = document.getElementById(`wok-stir-fill-${index}`);
      const labelEl = document.getElementById(`wok-stir-label-${index}`);

      stirInterval = setInterval(() => {
        if (gameState.isPaused || gameState.isGameOver) return;
        wok.stirSeconds += 0.05;
        sfxEvery('sizzle', 260);
        sfxEvery('stir', 520);
        const prof = wok.profile || WOK_PROFILE_DEFAULT;
        const pct = Math.min(100, (wok.stirSeconds / prof.quemado) * 100);
        if (fillEl) fillEl.style.width = `${pct}%`;

        let zone = 'crudo';
        if (wok.stirSeconds >= prof.crudo && wok.stirSeconds < prof.perfecto) zone = 'perfecto';
        else if (wok.stirSeconds >= prof.perfecto) zone = 'quemado';
        btn.classList.toggle('zone-crudo', zone === 'crudo');
        btn.classList.toggle('zone-perfecto', zone === 'perfecto');
        btn.classList.toggle('zone-quemado', zone === 'quemado');
        if (labelEl) labelEl.textContent = zone === 'crudo' ? 'Saltea...' : zone === 'perfecto' ? '¡Suelta ahora!' : '¡Se quema!';

        if (wok.stirSeconds >= prof.quemado) {
          clearInterval(stirInterval);
          stirInterval = null;
          finishStir(index, 'QUEMADO');
        }
      }, 50);
    };

    const stopStir = (e) => {
      if (wokStaged()) return;
      try { if (e && e.pointerId && btn.hasPointerCapture && btn.hasPointerCapture(e.pointerId)) btn.releasePointerCapture(e.pointerId); } catch(err) {}
      const wok = gameState.woks[index];
      if (!wok.stirring) return;
      if (stirInterval) { clearInterval(stirInterval); stirInterval = null; }
      btn.classList.remove('stirring-active', 'zone-crudo', 'zone-perfecto', 'zone-quemado');
      const secs = wok.stirSeconds;
      let result;
      const prof = wok.profile || WOK_PROFILE_DEFAULT;
      if (secs < prof.crudo) result = 'CRUDO';
      else if (secs < prof.perfecto) result = 'PERFECTO';
      else result = 'QUEMADO';
      finishStir(index, result);
    };

    btn.addEventListener('pointerdown', startStir);
    btn.addEventListener('pointerup', stopStir);
    btn.addEventListener('pointerleave', stopStir);
  }
}
