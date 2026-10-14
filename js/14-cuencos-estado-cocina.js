/* Módulo 14-cuencos-estado-cocina — Cuencos, estado de la cocina y existencias.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

function getRecetasByArea(area) {
  if (area === 'salteados') return RECETAS_SALTEADOS;
  if (area === 'frituras') return RECETAS_FRITURAS;
  if (area === 'makis') return RECETAS_MAKIS;
  return RECETAS_RAMEN;
}

// Makis: el orden de armado importa. A diferencia de las demás áreas (conjunto sin orden),
// aquí se compara la secuencia exacta de ingredientes tal como se fueron agregando al cuenco.
function analyzeMakiSequence(sequence) {
  if (!sequence || sequence.length === 0) return { status: "EMPTY" };

  for (const r of makiCatalog()) {
    if (r.ingredients.length === sequence.length && r.ingredients.every((id, idx) => id === sequence[idx])) {
      return { status: "READY", recipe: r };
    }
  }

  // ¿La secuencia actual es, en orden, el inicio válido de alguna receta?
  let bestRecipe = null;
  let bestMatchLen = -1;
  for (const r of makiCatalog()) {
    let matchLen = 0;
    while (matchLen < sequence.length && matchLen < r.ingredients.length && r.ingredients[matchLen] === sequence[matchLen]) {
      matchLen++;
    }
    if (matchLen === sequence.length && matchLen > bestMatchLen) {
      bestMatchLen = matchLen;
      bestRecipe = r;
    }
  }

  if (bestRecipe) {
    const missingIds = bestRecipe.ingredients.slice(bestMatchLen);
    const nextIng = INGREDIENTES.find(i => i.id === missingIds[0]);
    return {
      status: "PROGRESS",
      recipe: bestRecipe,
      overlap: bestMatchLen,
      nextIngredient: nextIng ? nextIng.display : null,
      missing: missingIds.map(id => INGREDIENTES.find(i => i.id === id).display),
      extra: []
    };
  }

  // La secuencia no calza con el inicio de ninguna receta: el orden está mal.
  return { status: "WRONG_ORDER" };
}

function analyzeBowl(bowlIndex) {
  // El cuenco (bowls-dock-box) es exclusivo de Ramen: las demás áreas tienen su propia
  // estación de trabajo (ver renderMakiStation para Makis) y no pasan por esta función.
  const bowl = gameState.bowls[bowlIndex];
  const area = 'ramen'; // los cuencos son de Ramen aunque el jugador esté trabajando en otra área
  const catalog = stView('ramen', getRecetasByArea(area));   // con etapas activas, solo la parte de cocción de cada receta
  const bowlSet = new Set(bowl.ingredients);

  for (const r of catalog) {
    const rSet = new Set(r.ingredients);
    if (rSet.size === bowlSet.size && [...rSet].every(x => bowlSet.has(x))) {
      return { status: "READY", recipe: r };
    }
  }

  if (bowl.ingredients.length === 0) return { status: "EMPTY" };

  const unlocked = area === 'ramen' ? stView('ramen', getUnlockedRamenRecipes()) : catalog;
  const candidateRecipes = unlocked.length > 0 ? unlocked : catalog;
  let bestRecipe = null;
  let bestOverlap = -1;
  let bestMissing = [];
  let bestExtra = [];

  for (const r of candidateRecipes) {
    const rSet = new Set(r.ingredients);
    const missing = [...rSet].filter(x => !bowlSet.has(x));
    const extra = [...bowlSet].filter(x => !rSet.has(x));
    const overlap = [...bowlSet].filter(x => rSet.has(x)).length;

    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestRecipe = r;
      bestMissing = missing;
      bestExtra = extra;
    }
  }

  return {
    status: "PROGRESS",
    recipe: bestRecipe,
    overlap: bestOverlap,
    missing: bestMissing.map(id => INGREDIENTES.find(i => i.id === id).display),
    extra: bestExtra.map(id => INGREDIENTES.find(i => i.id === id).display)
  };
}



// Fideos del cuenco con las etapas activas: apelmazados en el centro (sp = 0) hasta cubriendo el caldo (sp = 1).
function bowlNoodlesSvg(sp) {
  let g = '';
  for (let k = 0; k < 7; k++) {
    const d = k - 3, w = 7 + sp * (23 - Math.abs(d) * 3.2);
    const y = 21 + d * (0.55 + 1.15 * sp) - (1 - sp) * 1.5, a = 3.2 - 1.6 * sp, x0 = 50 - w + d * (1 - sp) * 0.8;
    g += `<path d="M ${x0.toFixed(1)},${y.toFixed(1)} q ${(w / 2).toFixed(1)},${(-a).toFixed(1)} ${w.toFixed(1)},0 t ${w.toFixed(1)},0"/>`;
  }
  return `<g fill="none" stroke-linecap="round"><g stroke="#c8941a" stroke-width="2.7">${g}</g><g stroke="#f7c948" stroke-width="1.6">${g}</g></g>`;
}
function generateBowlSVG(bowl, analysis) {
  if (!bowl) return '';
  const ings = bowl.ingredients || [];
  const sp = typeof bowl.spread === 'number' ? Math.max(0, Math.min(1, bowl.spread)) : null;   // null = sin etapas: dibujo de siempre
  const hasShio = ings.includes(2);
  const hasTonkotsu = ings.includes(3);
  const hasAgua = ings.includes(4);
  const hasShoyu = ings.includes(5);
  const hasMiso = ings.includes(6);
  const hasEbi = ings.includes(7);
  const hasTanTan = ings.includes(8);
  const hasBajiru = ings.includes(10);
  const hasFideo = ings.includes(1);
  const hasChasu = ings.includes(11) || ings.includes(12);
  const hasEgg = ings.includes(15);
  const hasNori = ings.includes(20);
  const hasPoro = ings.includes(17);
  const hasOnion = ings.includes(18);
  const hasNaruto = ings.includes(31);
  const hasPork = ings.includes(13), hasShrimp = ings.includes(14), hasSprouts = ings.includes(25);
  const hasHolantao = ings.includes(23);
  const hasBamboo = ings.includes(22);
  const isReady = analysis && analysis.status === 'READY';

  let brothFill = 'none';
  if (hasTonkotsu) brothFill = '#f5eedb';
  else if (hasShoyu) brothFill = '#793e18';
  else if (hasMiso) brothFill = '#994d1a';
  else if (hasTanTan) brothFill = '#bd2c08';
  else if (hasEbi) brothFill = '#d65a29';
  else if (hasBajiru) brothFill = '#4a6730';
  else if (hasShio || hasAgua) brothFill = '#dfb552';
  else if (ings.length > 0) brothFill = '#9c5b2a';

  return `
    <svg class="donburi-svg ${isReady ? 'ready-pulse' : ''}" viewBox="0 0 100 64" width="88" height="54">
      <defs>
        <radialGradient id="brothGrad-${ings.length}" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${brothFill}" stop-opacity="0.9" />
          <stop offset="100%" stop-color="${brothFill}" stop-opacity="1" />
        </radialGradient>
      </defs>

      <!-- Sombra base del cuenco -->
      <ellipse cx="50" cy="58" rx="32" ry="5" fill="rgba(0,0,0,0.4)" />

      <!-- Pie del cuenco (Base) -->
      <path d="M 36,52 L 36,57 Q 50,60 64,57 L 64,52 Z" fill="#d9d0c7" stroke="#b71c1c" stroke-width="1.2" />

      <!-- Cuerpo cerámico exterior (Blanco cremoso con curvatura suave) -->
      <path d="M 12,20 C 16,45 33,54 50,54 C 67,54 84,45 88,20 Z" fill="#fcfaf7" stroke="#3e2723" stroke-width="1.4" />
      <path d="M 15,26 Q 50,38 85,26" fill="none" stroke="#d32f2f" stroke-width="1.6" stroke-dasharray="3 2" />

      <!-- Borde superior del cuenco (Aro elíptico) -->
      <ellipse cx="50" cy="20" rx="39" ry="12" fill="#eee5dc" stroke="#b71c1c" stroke-width="2" />
      <ellipse cx="50" cy="20" rx="35" ry="10" fill="#2d1610" />

      <!-- Caldo / Sopa si tiene líquido -->
      ${brothFill !== 'none' ? `
        <ellipse cx="50" cy="21" rx="34" ry="9" fill="url(#brothGrad-${ings.length})" />
        <ellipse cx="50" cy="18" rx="26" ry="5" fill="rgba(255,255,255,0.18)" />
      ` : ''}

      <!-- Fideos Ramen -->
      ${hasFideo ? (sp !== null ? bowlNoodlesSvg(sp) : `
        <g stroke="#f5c242" stroke-width="2" stroke-linecap="round" fill="none">
          <path d="M 26,22 Q 36,17 46,23 Q 56,28 66,21 Q 74,18 78,21" />
          <path d="M 30,25 Q 42,28 54,23 Q 64,19 72,24" />
        </g>`) : ''}

      <!-- Alga Nori -->
      ${hasNori ? `
        <polygon points="62,6 78,9 72,23 58,19" fill="#1b281b" stroke="#121a12" stroke-width="1" />
      ` : ''}

      <!-- Lámina de Chasu Asado -->
      ${hasChasu ? `
        <ellipse cx="38" cy="22" rx="9" ry="6" fill="#a04238" stroke="#5d1e18" stroke-width="1" transform="rotate(-15 38 22)" />
        <ellipse cx="38" cy="22" rx="6" ry="4" fill="#d17267" opacity="0.8" transform="rotate(-15 38 22)" />
      ` : ''}

      <!-- Huevo Ajitsuke -->
      ${hasEgg ? `
        <ellipse cx="60" cy="22" rx="7" ry="5" fill="#ffffff" stroke="#c7a76d" stroke-width="1" />
        <circle cx="60" cy="22" r="3.5" fill="#f59e0b" />
      ` : ''}

      <!-- Narutomaki -->
      ${hasNaruto ? `
        <circle cx="30" cy="20" r="5" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.8" />
        <circle cx="30" cy="20" r="2.5" fill="none" stroke="#ec4899" stroke-width="1.4" />
      ` : ''}

      <!-- Holantao / Vegetales verdes -->
      ${hasHolantao || hasBamboo ? `
        <path d="M 44,14 Q 52,16 48,23" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" fill="none" />
      ` : ''}

      <!-- Poro y Cebolla Laminada -->
      ${(hasPoro || hasOnion) ? `
        <circle cx="46" cy="25" r="1.5" fill="#22c55e" />
        <circle cx="50" cy="26" r="1.4" fill="#86efac" />
        <circle cx="54" cy="24" r="1.5" fill="#22c55e" />
      ` : ''}

      <!-- Chancho molido, langostinos y moyashi -->
      ${hasPork ? '<g fill="#9c5a3c" stroke="#5b3a22" stroke-width="0.4"><circle cx="30" cy="22" r="1.5"/><circle cx="33" cy="24.5" r="1.3"/><circle cx="36" cy="21.5" r="1.4"/><circle cx="39" cy="25" r="1.2"/><circle cx="42" cy="22.5" r="1.4"/><circle cx="34" cy="27" r="1.2"/><circle cx="31" cy="26" r="1"/></g>' : ''}
      ${hasShrimp ? '<g fill="#f08a4b" stroke="#a8431c" stroke-width="0.9" stroke-linecap="round"><path d="M 52,25 q 3,-9 10,-5 q 4,3 -1,7 q -3,1 -3,-2" /><path d="M 60,26 q 3,-8 10,-4 q 4,3 -1,6" /></g>' : ''}
      ${hasSprouts ? '<g stroke="#f4efd2" stroke-width="1.1" stroke-linecap="round" fill="none"><path d="M 64,25 q 2,-6 5,-8" /><path d="M 68,26 q 1,-7 6,-8" /><path d="M 72,25 q 0,-5 4,-7" /><path d="M 66,24 q -1,-5 2,-8" /></g><g fill="#e8d44d"><circle cx="69" cy="16.8" r="1"/><circle cx="74" cy="17.8" r="1"/><circle cx="76" cy="18" r="0.9"/><circle cx="68" cy="15.8" r="0.9"/></g>' : ''}

      <!-- Barra de reparto de los fideos y palillos (mientras se mueven) -->
      ${(sp !== null && hasFideo && !bowl.hideBar) ? `
        <text x="9" y="63.6" font-size="7">🥢</text>
        <rect x="20" y="60.6" width="64" height="3" rx="1.5" fill="rgba(0,0,0,0.6)" />
        <rect x="20" y="60.6" width="${(64 * sp).toFixed(1)}" height="3" rx="1.5" fill="${sp >= 0.85 ? '#66bb6a' : (sp >= 0.4 ? '#ffca28' : '#ef5350')}" />` : ''}
      ${(sp !== null && typeof bowl.stirX === 'number') ? `
        <g stroke="#8d5a2b" stroke-width="1.7" stroke-linecap="round">
          <line x1="${(bowl.stirX - 7).toFixed(1)}" y1="1" x2="${(bowl.stirX + 1).toFixed(1)}" y2="23" />
          <line x1="${(bowl.stirX - 3).toFixed(1)}" y1="0" x2="${(bowl.stirX + 4).toFixed(1)}" y2="22" />
        </g>` : ''}

      <!-- Brillo / Vapor si está listo -->
      ${isReady ? `
        <g stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.85">
          <path d="M 42,12 Q 40,7 43,2" fill="none" />
          <path d="M 50,10 Q 52,5 50,1" fill="none" />
          <path d="M 58,12 Q 56,7 58,2" fill="none" />
        </g>
        <polygon points="50,-1 52,3 56,4 53,7 54,11 50,9 46,11 47,7 44,4 48,3" fill="#ffd700" />
      ` : ''}
    </svg>
  `;
}

/* ==========================================================================
   SISTEMA DE ESTACIONES DE COCCIÓN INTERACTIVAS (FONDO IZQUIERDO)
   - Cocinar Fideos (Tap, 4s + 1s por fideo hasta 4, ventana de 5s para recoger o se queman)
   - Calentar Shio (Hold 3s para calentar y recargar stock a 4)
   - Calentar Tonkotsu (Hold 3s para calentar y recargar stock a 4)
   - Flamear Chasu (Hold, genera 1 porción cada 2s hasta 4)
   ========================================================================== */

const kitchenState = {
  stocks: {
    noodles: 0,   // Inicia con stock en cero
    shio: 0,
    tonkotsu: 0,
    chasu: 0
  },
  noodles: {
    state: 'IDLE', // 'IDLE' | 'COOKING' | 'READY' | 'BURNING'
    portionsCooking: 0,
    cookTimeRemaining: 0,
    totalCookTime: 0,
    burnTimeRemaining: 0,
    intervalId: null
  },
  shio: {
    isHeating: false,
    heatSeconds: 0
  },
  tonkotsu: {
    isHeating: false,
    heatSeconds: 0
  },
  chasu: {
    isFlaming: false,
    flameSeconds: 0
  }
};

function getIngredientStock(ingId) {
  if (stagedOn(gameState.activeArea) && getStage(gameState.activeArea) === 'plate') {
    const p = stProdFor(gameState.activeArea, ingId, 'plate');
    return p ? stGet(gameState.activeArea).stock[p.key] : null;
  }
  if (ingId === 1) return kitchenState.stocks.noodles;
  if (ingId === 2) return kitchenState.stocks.shio;
  if (ingId === 3) return stagedOn('ramen') ? null : kitchenState.stocks.tonkotsu;   // con etapas el Tonkotsu se prepara en una sartén
  if (ingId === 11) return kitchenState.stocks.chasu;
  if (ingId === 25 && stagedOn('ramen')) return stGet('ramen').stock.moyashi;
  if (ingId === 71 && gameState.activeArea === 'frituras' && stagedOn('frituras')) return stGet('frituras').stock.poroCut;   // poro cortado esperando en Frituras
  return null;
}

function updateKitchenStockBadges() {
  [1, 2, 3, 11, 25, 71].forEach(id => {
    const badge = document.getElementById(`stock-badge-ing-${id}`);
    const stockVal = getIngredientStock(id);
    if (badge && stockVal !== null) {
      badge.textContent = stockVal;
      if (stockVal <= 0) {
        badge.classList.add('stock-zero');
      } else {
        badge.classList.remove('stock-zero');
      }
    }
  });
}

function updateKitchenStationsUI(skipSync = false, source = '', delta = '') {
  // 1. Actualizar los números de stock en la despensa
  updateKitchenStockBadges();
  try { renderStoveArt(); } catch (e) {}

  // 2. Actualizar los textos informativos en los 4 botones de cocina
  const chasuStatus = document.getElementById('chasu-status');
  if (chasuStatus && (!kitchenState.chasu || !kitchenState.chasu.isFlaming)) {
    chasuStatus.textContent = kitchenState.stocks.chasu >= stockCap()
      ? `Listo (${stockCap()}/${stockCap()})`
      : (kitchenState.stocks.chasu > 0 ? `Listo (${kitchenState.stocks.chasu}/${stockCap()})` : (stagedOn('ramen') ? 'Usa el flameador' : 'Mantén (2s c/u)'));
  }

  const shioStatus = document.getElementById('shio-status');
  if (shioStatus && (!kitchenState.shio || !kitchenState.shio.isHeating)) {
    shioStatus.textContent = stagedOn('ramen') ? shioStagedText() : (kitchenState.stocks.shio > 0 ? `Listo (${kitchenState.stocks.shio})` : 'Mantén 3s');
  }

  const tonkotsuStatus = document.getElementById('tonkotsu-status');
  if (tonkotsuStatus && (!kitchenState.tonkotsu || !kitchenState.tonkotsu.isHeating)) {
    tonkotsuStatus.textContent = kitchenState.stocks.tonkotsu > 0 ? `Listo (${kitchenState.stocks.tonkotsu})` : 'Mantén 3s';
  }

  const noodlesStatus = document.getElementById('noodles-status');
  if (noodlesStatus && (!kitchenState.noodles || kitchenState.noodles.state === 'IDLE')) {
    noodlesStatus.textContent = kitchenState.stocks.noodles > 0 ? `Stock (${kitchenState.stocks.noodles})` : 'Toca para cocer';
  }

  // 3. Sincronizar en tiempo real con los demás jugadores en Modo Cooperativo
  if (!skipSync && typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
    MultiplayerManager.syncKitchenStocks(kitchenState.stocks, source, delta);
  }
}

function showStationToast(msg) {
  const oldToast = document.querySelector('.station-guide-toast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.className = 'station-guide-toast';
  toast.innerHTML = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 2600);
}

function triggerGuideHighlight(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.add('guide-highlight');
  clearTimeout(btn._guideTimer);
  btn._guideTimer = setTimeout(() => {
    btn.classList.remove('guide-highlight');
  }, 2500);
}

function updateCookingVisualOverlay() {
  const overlay = document.getElementById('kitchen-action-vfx-overlay');
  if (!overlay) return;
  if (stagedOn('ramen')) {                       // con la cocina de acero las ollas y sartenes ya se animan solas: sin los paneles antiguos
    overlay.querySelectorAll('.kitchen-vfx-panel.active').forEach(p => p.classList.remove('active'));
    return;
  }

  const panelFlame = document.getElementById('vfx-panel-flame');
  const panelTonkotsu = document.getElementById('vfx-panel-tonkotsu');
  const panelShio = document.getElementById('vfx-panel-shio');
  const panelNoodles = document.getElementById('vfx-panel-noodles');

  // Prioridad 1: Acción manual activa por mantener pulsado (Chasu, Tonkotsu, Shio)
  let activeType = null;
  if (kitchenState.chasu && kitchenState.chasu.isFlaming) {
    activeType = 'flame';
  } else if (kitchenState.tonkotsu && kitchenState.tonkotsu.isHeating) {
    activeType = 'tonkotsu';
  } else if (kitchenState.shio && kitchenState.shio.isHeating) {
    activeType = 'shio';
  } else if (kitchenState.noodles && (kitchenState.noodles.state === 'COOKING' || kitchenState.noodles.state === 'READY')) {
    activeType = 'noodles';
  }

  if (panelFlame) panelFlame.classList.toggle('active', activeType === 'flame');
  if (panelTonkotsu) panelTonkotsu.classList.toggle('active', activeType === 'tonkotsu');
  if (panelShio) panelShio.classList.toggle('active', activeType === 'shio');
  if (panelNoodles) {
    panelNoodles.classList.toggle('active', activeType === 'noodles');
    if (activeType === 'noodles') {
      const teboAssembly = document.getElementById('vfx-tebo-assembly');
      const noodlesPillText = document.getElementById('vfx-noodles-pill-text');
      const noodlesPillIcon = document.getElementById('vfx-noodles-pill-icon');
      const isReady = kitchenState.noodles.state === 'READY';
      if (teboAssembly) teboAssembly.classList.toggle('tebo-lifted', isReady);
      if (noodlesPillText) {
        if (isReady) {
          noodlesPillText.textContent = `✨ ¡Fideos al Dente Listos (${kitchenState.noodles.portionsCooking}x)! Toca para recoger`;
        } else {
          const sec = Math.ceil(Math.max(0, kitchenState.noodles.cookTimeRemaining));
          noodlesPillText.textContent = `🍜 Cociendo Fideos Ramen (${kitchenState.noodles.portionsCooking}x) ${sec}s...`;
        }
      }
      if (noodlesPillIcon) {
        noodlesPillIcon.textContent = isReady ? '✨' : '🍜';
      }
    }
  }

  if (activeType) {
    overlay.classList.add('active');
  } else {
    overlay.classList.remove('active');
  }
}
