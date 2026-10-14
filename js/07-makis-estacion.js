/* Módulo 07-makis-estacion — Makis: estación clásica, capas, esterilla y gestos.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// --- Makis: cada maki empieza moviendo la esterilla de bambú (enrollada) hasta la tabla; al
// soltarla se abre por completo en horizontal y recién ahí se arrastran los ingredientes, en
// orden. Con el maki armado, el cuchillo (vertical) debe mantenerse 3 segundos sobre él para
// cortarlo. Esterilla y cuchillo se pulsan y se arrastran por la pantalla.
const MAKI_CUT_SECONDS = 3;
let makiToolDrag = null;

// Flujo: 1) estructura base en orden (arroz, nori, relleno…) → 2) enrollar → 3) coberturas /
// salsas / ajonjolí encima → 4) cortar.
// rollState: NONE (armando la base) → ROLLING (el jugador desliza) → ROLLED (maki enrollado).
// baseLen: cuántos ingredientes quedaron enrollados (los de la base). Lo que se agrega después va encima.
function newMakiRoll() {
  return { ingredients: [], matPlaced: false, rollState: 'NONE', rollProgress: 0, baseLen: 0, cutState: 'NONE', cutProgress: 0, spread: 0, flame: 0 };
}

// Estructuras base de todas las recetas (los primeros baseCount ingredientes).
function makiBases() {
  return makiCatalog().map(r => r.ingredients.slice(0, r.baseCount));
}

// ¿Esta secuencia es exactamente la estructura base de alguna receta? (ya se puede enrollar)
function makiSequenceIsBase(seq) {
  return makiBases().some(b => b.length === seq.length && b.every((id, i) => id === seq[i]));
}

// Antes de enrollar solo entra la base: si la secuencia ya es una base completa, el siguiente
// ingrediente solo se acepta si alarga alguna base (p. ej. el queso crema de Furai/California).
function makiPreRollAllows(seq, ingId) {
  if (!makiSequenceIsBase(seq)) return true; // se avisa "orden incorrecto" si no calza
  const next = [...seq, ingId];
  return makiBases().some(b => b.length >= next.length && next.every((id, i) => id === b[i]));
}

// Nombres de los siguientes ingredientes posibles. preRoll=true limita a la estructura base.
// Con baseLen (maki ya enrollado) solo cuentan las recetas cuya base tiene ese largo.
function makiNextOptions(seq, preRoll, baseLen) {
  const ids = new Set();
  makiCatalog().forEach(r => {
    if (baseLen && r.baseCount !== baseLen) return;
    const limit = preRoll ? r.baseCount : r.ingredients.length;
    if (seq.length < limit && seq.every((id, i) => id === r.ingredients[i])) ids.add(r.ingredients[seq.length]);
  });
  return [...ids].map(id => { const ing = INGREDIENTES.find(i => i.id === id); return ing ? ing.display : ''; }).filter(Boolean);
}

// Makis: la vista de cocción (con etapas) solo pide la base y las coberturas; las salsas y guarniciones se emplatan.
const makiCatalog = () => stView('makis', RECETAS_MAKIS);

function makiIsComplete() {
  const roll = gameState.makiRoll;
  return roll.matPlaced && analyzeMakiSequence(roll.ingredients).status === 'READY';
}

// Cortar: la receta completa y el maki ya enrollado.
function makiCanCut() {
  const roll = gameState.makiRoll;
  return makiIsComplete() && roll.rollState === 'ROLLED' && roll.cutState !== 'CUT' && (!stagedOn('makis') || !!roll.pressed2);   // con etapas: un apretón más antes de cortar
}

// Enrollar: la estructura base completa (o ya a medio enrollar), sin cortar.
function makiCanRoll() {
  const roll = gameState.makiRoll;
  if (!roll.matPlaced || roll.cutState !== 'NONE' || roll.rollState === 'ROLLED') return false;
  return roll.rollState === 'ROLLING' || makiSequenceIsBase(roll.ingredients);
}

function toggleIngredientInMaki(ingId) {
  if (gameState.isPaused || gameState.isGameOver) return;
  if (!coopLock('maki-scene')) return;
  const roll = gameState.makiRoll;
  if (!roll.matPlaced) {
    showStationToast('🎍 Primero mueve la esterilla de bambú sobre la tabla.');
    return;
  }
  if (roll.cutState !== 'NONE') {
    showStationToast('El maki ya se está cortando: vacía la tabla para armar otro.');
    return;
  }
  if (roll.rollState === 'ROLLING') {
    showStationToast('El maki se está enrollando: termina de enrollarlo o desenróllalo deslizando hacia abajo.');
    return;
  }
  const idx = roll.ingredients.indexOf(ingId);
  if (idx !== -1) {
    // Quitar: lo ya enrollado (la base) no se puede retirar.
    if (roll.rollState === 'ROLLED' && idx < roll.baseLen) {
      showStationToast('Ese ingrediente ya está enrollado: vacía la tabla para armar otro maki.');
      return;
    }
    roll.ingredients = roll.ingredients.filter(id => id !== ingId);
    stCookRefund('makis', ingId);
  } else {
    if (roll.rollState === 'NONE' && !makiPreRollAllows(roll.ingredients, ingId)) {
      showStationToast('🎍 Ese ingrediente va encima: primero enrolla el maki (desliza hacia arriba sobre la esterilla).');
      return;
    }
    if (roll.rollState === 'ROLLED') {
      // Encima del maki enrollado solo entra lo que continúa alguna receta con esta misma base.
      const next = [...roll.ingredients, ingId];
      const fits = makiCatalog().some(r => r.baseCount === roll.baseLen && next.length <= r.ingredients.length &&
        next.every((id, i) => id === r.ingredients[i]));
      if (!fits) {
        showStationToast('Ese ingrediente no va encima de este maki, o lleva otro orden.');
        return;
      }
    }
    if (!stCookTake('makis', ingId)) return;
    roll.ingredients.push(ingId);
    if (stagedOn('makis') && typeof mkOnToppingAdded === 'function') mkOnToppingAdded(roll, ingId);   // la cobertura lleva la calidad con que se cortó
  }
  playSound('add');
  renderMakiStation();
  renderPantryGrid();
}

function clearMakiRoll() {
  if (stagedOn('makis') && typeof mkTrashSelected === 'function') { mkTrashSelected(); return; }
  if (gameState.makiRoll.ingredients.length >= MOTTAINAI_MIN_DISCARD && gameState.makiRoll.cutState !== 'CUT') addTrimmings(1, 'maki descartado');
  cleanupMakiToolDrag();
  gameState.makiRoll = newMakiRoll();
  playSound('trash');
  renderMakiStation();
  renderPantryGrid();
}

function placeMakiMat() {
  const roll = gameState.makiRoll;
  if (roll.matPlaced) return;
  if (!coopLock('maki-scene')) return;
  roll.matPlaced = true;
  playSound('swish');
  renderMakiStation();
}

// Tajos (Fruit Ninja): 3 tajos que crucen el maki enrollado lo cortan (van apareciendo las marcas de corte); el cuchillo mantenido 3 s sigue valiendo como respaldo
function makiCutSlash() {
  const roll = gameState.makiRoll;
  if (!makiCanCut()) return;
  roll.slashes = (roll.slashes || 0) + 1;
  roll.cutState = 'CUTTING';
  roll.cutProgress = Math.min(1, roll.slashes / slashesToCut());
  playSound('chop');
  slashFx({ zone: document.getElementById('maki-board-zone'), item: document.getElementById('maki-roll-wrap'), iconHtml: '', bitsImg: 'assets/ingredients/v2/ing_20.webp' });
  if (roll.slashes >= slashesToCut()) { roll.slashes = 0; completeMakiCut(); return; }
  renderMakiStation();
}
function completeMakiCut() {
  const roll = gameState.makiRoll;
  cleanupMakiToolDrag();
  roll.cutState = 'CUT';
  roll.cutProgress = 1;
  roll.readyAt = gameState.gameClock;
  playSound('chop');
  playSound('match');
  renderMakiStation();
  vfxAtElement('maki-board-zone', 'cut');
  addTrimmings(2, 'puntas del maki');
}

// --- Capas ilustradas del maki (lienzo 300x100, el mismo cuadro que la esterilla abierta) ---
// Cada ingrediente dibuja su capa en el orden en que se arrastra: arroz extendido, alga nori
// encima, rellenos en franjas, coberturas, salsas en zigzag y ajonjolí.
const MAKI_FILLING_IDS = [64, 54, 39, 47, 72, 59]; // palta, ebi, atún, cecina, queso crema, hilos de wantán
const MAKI_FILL_SLOTS = [50, 40, 60, 30, 70, 50];  // altura de cada franja de relleno
const MAKI_SAUCE_COLORS = { 77: '#f4b942', 80: '#c79a1f', 81: '#8bc34a', 82: '#fff0cc', 85: '#7a4a2c', 89: '#e8742a' };
const MAKI_FILL_COLORS = { 64: '#9bcf5b', 54: '#ff8f68', 39: '#d63a56', 47: '#8a4a2a', 72: '#fff1c6', 59: '#e7b24a' };
const MAKI_TOPPING_COLORS = { 49: '#e24b62', 50: '#fff3de', 51: '#7fb23d' };

function makiLayerMarkup(id, fillIdx, enter) {
  const cls = enter ? 'mk-layer enter' : 'mk-layer';
  const cy = MAKI_FILL_SLOTS[fillIdx % MAKI_FILL_SLOTS.length];
  let s = '';
  switch (id) {
    case 38: // Arroz shari
      s = `<rect x="46" y="10" width="208" height="80" rx="7" fill="#f7f4e8" stroke="#e0dac1" stroke-width="1.5"/>
           <rect x="46" y="10" width="208" height="80" rx="7" fill="url(#mkGrain)"/>`;
      break;
    case 20: // Alga nori
      s = `<rect x="54" y="15" width="192" height="70" rx="3" fill="url(#mkNori)" stroke="#0a120d" stroke-width="1.2"/>
           <g stroke="#4a6a50" stroke-opacity="0.35" stroke-width="1" fill="none">
             <path d="M60,26 L238,24"/><path d="M60,40 L238,42"/><path d="M60,56 L238,54"/><path d="M60,70 L238,72"/>
           </g>`;
      break;
    case 64: // Palta
      for (let i = 0; i < 5; i++) {
        const cx = 84 + i * 33;
        s += `<ellipse cx="${cx}" cy="${cy}" rx="21" ry="9.5" fill="#a9d56f" stroke="#5f8f2e" stroke-width="1.2"/>
              <ellipse cx="${cx}" cy="${cy}" rx="16" ry="5.5" fill="#eaf5b9"/>`;
      }
      break;
    case 54: // Ebi (langostino)
      for (let i = 0; i < 5; i++) {
        const cx = 80 + i * 35;
        s += `<g transform="rotate(-16 ${cx} ${cy})">
                <ellipse cx="${cx}" cy="${cy}" rx="18" ry="8.5" fill="#ff9a76" stroke="#d2603a" stroke-width="1.2"/>
                <path d="M${cx - 10},${cy - 3.5} q10,6 20,0 M${cx - 12},${cy + 1.5} q12,6 24,0" stroke="#ffd2bf" stroke-width="1.5" fill="none"/>
              </g>`;
      }
      break;
    case 39: // Atún
      s = `<rect x="66" y="${cy - 6.5}" width="168" height="13" rx="6" fill="#d63a56" stroke="#8e1f33" stroke-width="1.2"/>
           <path d="M72,${cy - 2.5} L228,${cy - 2.5}" stroke="#ff9aa8" stroke-width="1.6" opacity="0.7"/>`;
      break;
    case 47: // Cecina
      s = `<rect x="66" y="${cy - 6.5}" width="168" height="13" rx="5" fill="#8a4a2a" stroke="#4e2612" stroke-width="1.2"/>
           <g stroke="#d9a07a" stroke-width="1.3" opacity="0.75"><path d="M84,${cy} l14,-3"/><path d="M120,${cy + 2} l14,-3"/><path d="M158,${cy} l14,-3"/><path d="M196,${cy + 2} l14,-3"/></g>`;
      break;
    case 72: // Queso crema
      s = `<rect x="66" y="${cy - 6}" width="168" height="12" rx="6" fill="#fff3cf" stroke="#dfc986" stroke-width="1.2"/>`;
      break;
    case 59: // Hilos de wantán
      [-5, -1.5, 2, 5.5].forEach(dy => {
        s += `<path d="M66,${cy + dy} q12,-7 24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0" fill="none" stroke="#e7b24a" stroke-width="2.2" stroke-linecap="round"/>`;
      });
      break;
    case 49: // Cobertura de atún
      for (let i = 0; i < 7; i++) {
        const cx = 72 + i * 26;
        s += `<ellipse cx="${cx}" cy="50" rx="19" ry="12" fill="${i % 2 ? '#d33a56' : '#e24b62'}" stroke="#8e1f33" stroke-width="1.2"/>
              <path d="M${cx - 10},48 q10,-5 20,0" stroke="#ffd0d6" stroke-width="1.3" fill="none" opacity="0.8"/>`;
      }
      break;
    case 50: // Cobertura de conchas de abanico
      for (let i = 0; i < 6; i++) {
        const cx = 84 + i * 26;
        s += `<circle cx="${cx}" cy="50" r="12.5" fill="#fff6e6" stroke="#e0c99f" stroke-width="1.3"/>
              <circle cx="${cx}" cy="50" r="7" fill="none" stroke="#f0dfc0" stroke-width="1.2"/>`;
      }
      break;
    case 51: // Cobertura amazon
      for (let i = 0; i < 7; i++) {
        const cx = 72 + i * 26;
        s += `<g transform="rotate(${i % 2 ? 28 : -28} ${cx} 50)">
                <ellipse cx="${cx}" cy="50" rx="17" ry="8" fill="#7fb23d" stroke="#4e7a1f" stroke-width="1.2"/>
                <path d="M${cx - 12},50 L${cx + 12},50" stroke="#c5e08a" stroke-width="1.2"/>
              </g>`;
      }
      break;
    case 34: // Ajonjolí negro
      for (let i = 0; i < 34; i++) {
        const x = 64 + ((i * 53) % 172);
        const y = 22 + ((i * 37) % 56);
        s += `<circle cx="${x}" cy="${y}" r="1.4" fill="#111"/>`;
      }
      break;
    default:
      if (MAKI_SAUCE_COLORS[id]) {
        const c = MAKI_SAUCE_COLORS[id];
        s = `<path class="mk-drizzle" d="M62,34 L84,66 L106,34 L128,66 L150,34 L172,66 L194,34 L216,66 L238,34" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.96"/>`;
        if (id === 81) {
          for (let i = 0; i < 5; i++) s += `<circle cx="${88 + i * 31}" cy="${i % 2 ? 40 : 60}" r="6.5" fill="${c}" stroke="#5e8d2d" stroke-width="1"/>`;
        }
      } else {
        const ing = INGREDIENTES.find(i => i.id === id);
        s = `<text x="150" y="58" font-size="22" text-anchor="middle">${ing ? ing.icon : '❓'}</text>`;
      }
  }
  return `<g class="${cls}">${s}</g>`;
}

// Dibuja solo la capa nueva cuando se agrega un ingrediente (así no se repiten las animaciones);
// si se retira o cambia alguno, reconstruye todo sin animar.
function renderMakiLayers(ings, visible) {
  const svg = document.getElementById('maki-layers');
  const root = document.getElementById('mk-layer-root');
  if (!svg || !root) return;
  svg.classList.toggle('is-visible', !!visible);
  const prev = svg._ids || [];
  const extendsPrev = ings.length >= prev.length && prev.every((id, i) => ings[i] === id);
  if (extendsPrev && ings.length === prev.length) return;
  const start = extendsPrev ? prev.length : 0;
  let fillCount = 0;
  let html = '';
  for (let i = 0; i < ings.length; i++) {
    if (i >= start) html += makiLayerMarkup(ings[i], fillCount, extendsPrev);
    if (MAKI_FILLING_IDS.includes(ings[i])) fillCount++;
  }
  if (extendsPrev) root.insertAdjacentHTML('beforeend', html);
  else root.innerHTML = html;
  svg._ids = ings.slice();
}

// Coberturas, salsas y ajonjolí que se agregan DESPUÉS de enrollar: se dibujan sobre el maki
// entero (lienzo 300x50). Se reutiliza el mismo dibujo de capas, aplastado a la mitad de alto.
function renderMakiToppings(ids) {
  const root = document.getElementById('mk-top-root');
  if (!root) return;
  const prev = root._ids || [];
  const extendsPrev = ids.length >= prev.length && prev.every((id, i) => ids[i] === id);
  if (extendsPrev && ids.length === prev.length) return;
  const start = extendsPrev ? prev.length : 0;
  let html = '';
  for (let i = start; i < ids.length; i++) html += makiLayerMarkup(ids[i], 0, extendsPrev);
  if (extendsPrev) root.insertAdjacentHTML('beforeend', html);
  else root.innerHTML = html;
  root._ids = ids.slice();
}

// Rodaja de maki (uramaki: arroz por fuera, nori por dentro y los rellenos al centro) con la cobertura, la salsa y el ajonjolí del plato.
const MAKI_PIECES = 10;                         // cada maki se corta en 10 piezas
function makiPieceMarkup(ings) {
  const fills = ings.filter(id => MAKI_FILL_COLORS[id]).slice(0, 3).map(id => MAKI_FILL_COLORS[id]);
  if (!fills.length) fills.push('#f08a3c');
  const cx = 20, cy = 20, R = 6.6;
  let center = '';
  if (fills.length === 1) {
    center = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${fills[0]}"/>`;
  } else {
    fills.forEach((color, k) => {
      const a0 = (-90 + k * 360 / fills.length) * Math.PI / 180;
      const a1 = (-90 + (k + 1) * 360 / fills.length) * Math.PI / 180;
      const x0 = (cx + R * Math.cos(a0)).toFixed(2), y0 = (cy + R * Math.sin(a0)).toFixed(2);
      const x1 = (cx + R * Math.cos(a1)).toFixed(2), y1 = (cy + R * Math.sin(a1)).toFixed(2);
      center += `<path d="M${cx},${cy} L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z" fill="${color}"/>`;
    });
  }
  const toppingId = ings.find(id => MAKI_TOPPING_COLORS[id]);
  const topping = toppingId
    ? `<path d="M3.8,20 A16.2,16.2 0 0 1 36.2,20" fill="none" stroke="${MAKI_TOPPING_COLORS[toppingId]}" stroke-width="5" stroke-linecap="round"/>`
    : '';
  const sauceId = ings.find(id => MAKI_SAUCE_COLORS[id]);
  const sauce = sauceId ? `<circle cx="20" cy="5.5" r="2.5" fill="${MAKI_SAUCE_COLORS[sauceId]}" stroke="#00000033" stroke-width="0.6"/>` : '';
  const sesame = ings.includes(34)
    ? [[8, 11], [14, 6.5], [26, 6.5], [32, 11], [5.5, 20], [34.5, 20], [8.5, 29], [31.5, 29], [20, 34.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.05" fill="#111"/>`).join('')
    : '';
  return `<svg class="maki-piece" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="18.2" fill="#f7f3e6" stroke="#cfc8a8" stroke-width="1.3"/>
    <g fill="#e3ddc6"><circle cx="8" cy="16" r="1.2"/><circle cx="12" cy="8" r="1.2"/><circle cx="22" cy="4.5" r="1.2"/><circle cx="31" cy="10" r="1.2"/><circle cx="35" cy="21" r="1.2"/><circle cx="30" cy="31" r="1.2"/><circle cx="20" cy="35" r="1.2"/><circle cx="10" cy="30" r="1.2"/><circle cx="5.5" cy="23" r="1.2"/></g>
    <circle cx="20" cy="20" r="12.6" fill="#17261b" stroke="#0a110c" stroke-width="1"/>
    <circle cx="20" cy="20" r="10.7" fill="#f1ecda"/>
    ${center}${topping}${sauce}${sesame}
  </svg>`;
}

function renderMakiStation() {
  const strip = document.getElementById('maki-mat-strip');
  const statusEl = document.getElementById('maki-status-badge');
  if (!strip || !statusEl) return;

  const roll = gameState.makiRoll;
  const ings = roll.ingredients;
  const analysis = analyzeMakiSequence(ings);
  const isReady = analysis.status === 'READY';
  const cutting = roll.cutState === 'CUTTING';
  const cut = roll.cutState === 'CUT';

  // Esterilla: enrollada a la izquierda hasta que se coloca; luego se abre sobre la tabla
  // (y se retira cuando el maki ya está cortado y emplatado).
  const matOpen = document.getElementById('maki-mat-open');
  const matTool = document.getElementById('maki-tool-mat');
  if (matOpen) matOpen.classList.toggle('is-open', roll.matPlaced && !cut);
  if (matTool) matTool.style.visibility = roll.matPlaced ? 'hidden' : 'visible';

  // Solo mensajes de ayuda: los ingredientes se dibujan como capas sobre la esterilla.
  if (!roll.matPlaced) {
    strip.innerHTML = `<span class="maki-strip-empty">Mueve la esterilla sobre la tabla</span>`;
  } else if (ings.length === 0) {
    strip.innerHTML = `<span class="maki-strip-empty">Arrastra aquí los ingredientes, en orden</span>`;
  } else {
    strip.innerHTML = '';
  }

  // Capas planas de la estructura base (arroz → nori → relleno), sobre la esterilla. Lo que se
  // agrega después de enrollar (coberturas, salsas, ajonjolí) se dibuja encima del maki.
  const baseIds = roll.rollState === 'NONE' ? ings : ings.slice(0, roll.baseLen);
  renderMakiLayers(baseIds, roll.matPlaced && !cut);
  renderMakiToppings(roll.rollState === 'ROLLED' ? ings.slice(roll.baseLen) : []);

  // Enrollado: el avance lo marca el jugador deslizando sobre la esterilla. Las capas se van
  // comprimiendo (rollProgress 0→1) mientras aparece el maki entero; las marcas de corte
  // aparecen según avanza el cuchillo.
  const layersEl = document.getElementById('maki-layers');
  const rollWrap = document.getElementById('maki-roll-wrap');
  const p = (roll.matPlaced && !cut) ? roll.rollProgress : 0;
  if (layersEl) {
    layersEl.style.transform = p > 0 ? `scaleY(${(1 - 0.62 * p).toFixed(3)})` : '';
    layersEl.style.opacity = p > 0.6 ? String(Math.max(0, 1 - (p - 0.6) / 0.4).toFixed(3)) : '';
  }
  if (rollWrap) {
    const showLog = roll.matPlaced && !cut && p > 0;
    rollWrap.style.display = showLog ? 'block' : 'none';
    rollWrap.style.opacity = p < 1 ? String(Math.max(0, (p - 0.4) / 0.6).toFixed(3)) : '';
    rollWrap.style.transform = p < 1 ? `scaleX(${(0.62 + 0.38 * p).toFixed(3)})` : '';
    rollWrap.querySelectorAll('.maki-slice-mark').forEach((mark, k) => {
      mark.classList.toggle('show', cutting && roll.cutProgress >= (k + 1) / MAKI_PIECES);
    });
  }
  const zone = document.getElementById('maki-board-zone');
  if (zone) zone.classList.toggle('can-roll', makiCanRoll());
  const spreadHintOn = makiSpreadAllowed() && (roll.spread || 0) < 0.3;
  const spreadHint = document.getElementById('maki-spread-hint');
  if (spreadHint) spreadHint.style.display = spreadHintOn ? 'block' : 'none';
  const rollHint = document.getElementById('maki-roll-hint');
  if (rollHint) rollHint.style.display = (makiCanRoll() && roll.rollProgress === 0 && !spreadHintOn) ? 'block' : 'none';

  // Maki cortado: 6 rodajas que se separan sobre la hoja, con soya, wasabi y jengibre.
  const plating = document.getElementById('maki-plating');
  if (plating) plating.classList.toggle('show', cut);
  const pieces = document.getElementById('maki-pieces');
  if (pieces) {
    if (cut) {
      if (pieces._sig !== 'cut') {
        pieces._sig = 'cut';
        pieces.classList.remove('spread');
        const pieceHtml = makiPieceMarkup(ings);
        pieces.innerHTML = pieceHtml.repeat(MAKI_PIECES);
        pieces.classList.remove('chop-hit');
        void pieces.offsetWidth;
        pieces.classList.add('chop-hit');
        setTimeout(() => { if (pieces._sig === 'cut') pieces.classList.add('spread'); }, 40);
      }
    } else if (pieces._sig) {
      pieces._sig = '';
      pieces.classList.remove('spread');
      pieces.innerHTML = '';
    }
  }

  const progBox = document.getElementById('maki-cut-progress');
  const progFill = document.getElementById('maki-cut-fill');
  if (progBox) progBox.style.display = cutting ? 'block' : 'none';
  if (progFill) progFill.style.width = `${Math.round(roll.cutProgress * 100)}%`;

  const makiServeBtn = document.getElementById('maki-serve-btn');
  if (makiServeBtn) makiServeBtn.classList.toggle('is-visible', cut && isReady);

  statusEl.classList.remove('status-error', 'status-ready');
  if (!roll.matPlaced) {
    statusEl.textContent = 'Mueve la esterilla sobre la tabla';
  } else if (cut) {
    statusEl.textContent = `✅ Cortado: ${analysis.recipe.name}`;
    statusEl.classList.add('status-ready');
  } else if (cutting) {
    statusEl.textContent = `✂️ Desliza el dedo sobre el maki: tajo ${Math.round(roll.cutProgress * slashesToCut())}/${slashesToCut()}`;
    statusEl.classList.add('status-ready');
  } else if (analysis.status === 'EMPTY') {
    statusEl.textContent = 'Esterilla lista — arrastra los ingredientes';
  } else if (analysis.status === 'WRONG_ORDER') {
    statusEl.textContent = '✗ Orden incorrecto';
    statusEl.classList.add('status-error');
  } else if (roll.rollState === 'ROLLING') {
    statusEl.textContent = `🎍 Enrollando… ${Math.round(roll.rollProgress * 100)}%`;
    statusEl.classList.add('status-ready');
  } else if (roll.rollState === 'ROLLED') {
    // Maki enrollado: ahora van encima las coberturas, salsas y el ajonjolí de la receta.
    const more = makiNextOptions(ings, false, roll.baseLen);
    if (isReady) {
      statusEl.textContent = more.length
        ? `¡Enrollado: ${analysis.recipe.name}! Agrega encima: ${more.join(' · ')} · luego 🤏 aprieta y corta`
        : (roll.pressed2 || !stagedOn('makis') ? `¡Enrollado: ${analysis.recipe.name}! Desliza el dedo sobre él para cortarlo (${slashesToCut()} tajos)` : `¡Enrollado: ${analysis.recipe.name}! Aprieta el maki (🤏) y luego córtalo`);
      statusEl.classList.add('status-ready');
    } else {
      statusEl.textContent = `🎍 Enrollado — agrega encima: ${more.join(' · ') || '…'}`;
    }
  } else if (makiSequenceIsBase(ings)) {
    // Estructura base completa: ya se puede enrollar (algunas bases admiten un ingrediente más).
    const more = makiNextOptions(ings, true);
    statusEl.textContent = more.length
      ? `¡Estructura lista! Desliza ⬆ para enrollar (o agrega: ${more.join(' · ')})`
      : `¡Estructura lista! Desliza hacia arriba sobre la esterilla para enrollar`;
    statusEl.classList.add('status-ready');
  } else {
    const options = makiNextOptions(ings, true);
    statusEl.textContent = options.length ? `Sigue: ${options.join(' / ')}` : `Armando (${ings.length})`;
  }
  makiApplySpread();
  makiFlameUi();
  syncStationIfChanged('makis');
  updateServeButtonsQuality();
  updateAreaTabAlerts();
}

function getMakiToolPoint(d) {
  return { x: d.x, y: d.pointerType === 'mouse' ? d.y : d.y - DRAG_TOUCH_GHOST_OFFSET_Y };
}

function moveMakiToolGhost() {
  const d = makiToolDrag;
  if (!d || !d.ghost) return;
  const p = getMakiToolPoint(d);
  d.ghost.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
}

function cleanupMakiToolDrag() {
  endMakiRollDrag();
  const d = makiToolDrag;
  document.removeEventListener('pointermove', onMakiToolMove);
  document.removeEventListener('pointerup', onMakiToolUp);
  document.removeEventListener('pointercancel', onMakiToolCancel);
  if (d) {
    if (d.timer) clearInterval(d.timer);
    if (d.ghost) d.ghost.remove();
    if (d.el) d.el.classList.remove('is-lifted');
  }
  const zone = document.getElementById('maki-board-zone');
  if (zone) zone.classList.remove('drop-target-ready', 'drop-hover');
  makiToolDrag = null;
}

function abortMakiCut() {
  const roll = gameState.makiRoll;
  if (roll.cutState === 'CUTTING') {
    roll.cutState = 'NONE';
    roll.cutProgress = 0;
    roll.slashes = 0;
  }
}

// Con el cuchillo sobre un maki listo, mantenerlo 3 s sin soltar ni salir de la tabla.
function updateMakiToolDrag() {
  const d = makiToolDrag;
  if (!d || !d.active) return;
  if (gameState.isPaused || gameState.isGameOver) return;
  const zone = document.getElementById('maki-board-zone');
  if (!zone) return;
  const p = getMakiToolPoint(d);
  const r = zone.getBoundingClientRect();
  const inside = p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
  const roll = gameState.makiRoll;

  if (d.tool === 'mat') {
    zone.classList.toggle('drop-hover', inside && !roll.matPlaced);
    return;
  }

  const canCut = makiCanCut();
  zone.classList.toggle('drop-hover', inside && canCut);
  if (inside && canCut) {
    if (!d.holdStart) {
      d.holdStart = performance.now();
      roll.cutState = 'CUTTING';
      if (d.ghost) d.ghost.classList.add('is-cutting');
    }
    roll.cutProgress = Math.min(1, (performance.now() - d.holdStart) / (cutSeconds() * 1000));
    sfxEvery('chop', 330);
    if (roll.cutProgress >= 1) {
      completeMakiCut();
      return;
    }
    renderMakiStation();
  } else if (d.holdStart) {
    d.holdStart = null;
    abortMakiCut();
    if (d.ghost) d.ghost.classList.remove('is-cutting');
    renderMakiStation();
  }
}

function activateMakiToolDrag() {
  const d = makiToolDrag;
  if (!d || d.active) return;
  d.active = true;
  const rect = d.el.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'maki-tool-ghost';
  ghost.style.height = `${rect.height * 1.15}px`;
  ghost.innerHTML = `<img src="${d.el.getAttribute('src')}" alt="" draggable="false">`;
  document.body.appendChild(ghost);
  d.ghost = ghost;
  d.el.classList.add('is-lifted');

  const zone = document.getElementById('maki-board-zone');
  const valid = d.tool === 'mat' ? !gameState.makiRoll.matPlaced : makiCanCut();
  if (zone && valid) zone.classList.add('drop-target-ready');
  d.timer = setInterval(updateMakiToolDrag, 50);
  moveMakiToolGhost();
  updateMakiToolDrag();
  try { if (navigator.vibrate) navigator.vibrate(12); } catch (err) {}
}

function onMakiToolMove(e) {
  const d = makiToolDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  d.x = e.clientX;
  d.y = e.clientY;
  if (!d.active) {
    if (Math.hypot(d.x - d.startX, d.y - d.startY) > 4) activateMakiToolDrag();
    return;
  }
  moveMakiToolGhost();
  updateMakiToolDrag();
}

function onMakiToolUp(e) {
  const d = makiToolDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  d.x = e.clientX;
  d.y = e.clientY;
  const tool = d.tool;
  const wasActive = d.active;
  const zone = document.getElementById('maki-board-zone');
  const p = getMakiToolPoint(d);
  const r = zone ? zone.getBoundingClientRect() : null;
  const inside = !!r && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
  const roll = gameState.makiRoll;

  if (tool === 'knife') abortMakiCut();
  cleanupMakiToolDrag();

  if (!wasActive) {
    // toque simple: recordatorio de cómo se usa
    showStationToast(tool === 'mat'
      ? '🎍 Arrastra la esterilla hasta la tabla para empezar un maki.'
      : '🔪 Desliza el dedo de lado a lado sobre un maki enrollado para cortarlo (' + slashesToCut() + ' tajos).');
    renderMakiStation();
    return;
  }
  if (tool === 'mat' && inside) {
    placeMakiMat();
    return;
  }
  if (tool === 'knife' && inside && roll.cutState !== 'CUT') {
    showStationToast(makiCanRoll()
      ? '🎍 Primero enrolla el maki: desliza hacia arriba sobre la esterilla.'
      : '🔪 Primero arma y enrolla el maki; luego desliza el dedo de lado a lado sobre él para cortarlo (' + slashesToCut() + ' tajos).');
  }
  renderMakiStation();
}

function onMakiToolCancel(e) {
  const d = makiToolDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  abortMakiCut();
  cleanupMakiToolDrag();
  renderMakiStation();
}

function beginMakiToolPress(e, tool, el) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (gameState.isPaused || gameState.isGameOver) return;
  if (gameState.activeArea !== 'makis') return;
  if (tool === 'mat' && gameState.makiRoll.matPlaced) return;
  cleanupMakiToolDrag();
  e.preventDefault();
  makiToolDrag = {
    tool, el,
    pointerId: e.pointerId,
    pointerType: e.pointerType,
    startX: e.clientX, startY: e.clientY,
    x: e.clientX, y: e.clientY,
    active: false, ghost: null, timer: null, holdStart: null
  };
  document.addEventListener('pointermove', onMakiToolMove);
  document.addEventListener('pointerup', onMakiToolUp);
  document.addEventListener('pointercancel', onMakiToolCancel);
}

// --- Enrollar: con la receta completa, deslizar hacia arriba sobre la esterilla (desde el borde
// de abajo, como en la referencia). El avance sigue al dedo y se puede deshacer deslizando hacia
// abajo; al llegar al 100% el maki queda enrollado y recién entonces se puede cortar.
let makiRollDrag = null;

function endMakiRollDrag() {
  document.removeEventListener('pointermove', onMakiRollMove);
  document.removeEventListener('pointerup', onMakiRollUp);
  document.removeEventListener('pointercancel', onMakiRollUp);
  makiRollDrag = null;
}

function setMakiRollProgress(value) {
  const roll = gameState.makiRoll;
  const p = Math.max(0, Math.min(1, value));
  if (p === roll.rollProgress) return;
  if (roll.rollState === 'NONE' && p > 0) roll.baseLen = roll.ingredients.length; // la base queda enrollada
  sfxEvery('swish', 170);
  roll.rollProgress = p;
  roll.rollState = p >= 1 ? 'ROLLED' : (p > 0 ? 'ROLLING' : 'NONE');
  if (roll.rollState === 'NONE') roll.baseLen = 0;
  if (roll.rollState === 'ROLLED') {
    endMakiRollDrag();
    playSound('match');
  }
  renderMakiStation();
}

function onMakiRollMove(e) {
  const d = makiRollDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  if (makiSpreadDrag && makiSpreadDrag.pointerId === e.pointerId && makiSpreadDrag.mode === 'spread') return;
  const range = d.height * 0.8;
  setMakiRollProgress(d.startProgress + (d.startY - e.clientY) / range);
}

function onMakiRollUp(e) {
  const d = makiRollDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  endMakiRollDrag();
  renderMakiStation();
}

// ---- Makis con etapas: extender el arroz y flamear ----
// Extender: con el arroz sobre la esterilla, deslizar el dedo de lado a lado (≈ 240 px de recorrido) lo extiende sobre el alga.
// Flamear (Yama, Nin Niku, Digión): con el maki enrollado, el flameador de la franja se arrastra a la tabla y se retira en la zona verde de la barra.
// Puntos de proceso (30): 10 de orden de armado + 14 de arroz extendido + 6 de flameado (los makis que no se flamean ganan esos 6).
const MAKI_SPREAD_PX = 240;
const MAKI_FLAME_RATE = 0.4;                 // la barra de flameado sube 0,4 por segundo: 2,5 s hasta la zona verde
const MAKI_FLAME_GREEN = [1, 1.5];           // zona verde (en unidades de la barra)
const MAKI_FLAME_MAX = 1.6;                  // a este valor se quema y el flameador se retira solo
const MAKI_FLAME_NAMES = ['Maki Yama', 'Maki Nin Niku', 'Maki Digion'];
function makiNeedsFlame() {
  if (stagedOn('makis')) return false;                                    // con etapas el flameado es de Emplatar (después de cortar y de la salsa)
  const a = analyzeMakiSequence(gameState.makiRoll.ingredients);
  if (a.status !== 'READY' || !a.recipe) return false;
  const names = a.recipe.candidates ? a.recipe.candidates.map(r => r.name) : [a.recipe.name];
  return names.every(n => MAKI_FLAME_NAMES.includes(n));
}
const makiFlameAvailable = () => getUnlockedRecipes().some(r => r.area === 'makis' && MAKI_FLAME_NAMES.includes(r.name));
function makiCanFlame() {
  const roll = gameState.makiRoll;
  return stagedOn('makis') && roll.rollState === 'ROLLED' && roll.cutState === 'NONE' && makiNeedsFlame();
}
function makiFlamePts(roll, need) {
  if (!need) return 6;
  const f = roll.flame || 0;
  return f > MAKI_FLAME_GREEN[1] ? 2 : (f >= MAKI_FLAME_GREEN[0] ? 6 : (f >= 0.5 ? 3 : 0));
}
function makiSpreadAllowed() {
  const roll = gameState.makiRoll;
  return stagedOn('makis') && roll.matPlaced && roll.rollState === 'NONE' && roll.cutState === 'NONE' && roll.ingredients[0] === 38 && (roll.spread || 0) < 1;
}
// El arroz va de un montón a toda la esterilla según lo extendido (propiedad scale: no choca con la animación de entrada)
function makiApplySpread() {
  const g = document.querySelector('#mk-layer-root .mk-layer');
  if (!g) return;
  const roll = gameState.makiRoll;
  if (!(stagedOn('makis') && roll.ingredients[0] === 38 && roll.rollState === 'NONE')) { g.style.scale = ''; return; }
  const sp = Math.max(0, Math.min(1, roll.spread || 0));
  g.style.transformBox = 'fill-box';
  g.style.transformOrigin = 'center';
  g.style.scale = `${(0.5 + 0.5 * sp).toFixed(3)} ${(0.62 + 0.38 * sp).toFixed(3)}`;
}
function makiFlameUi() {
  const roll = gameState.makiRoll;
  const bar = document.getElementById('maki-flame-bar'), fill = document.getElementById('maki-flame-fill');
  const show = stagedOn('makis') && roll.rollState === 'ROLLED' && roll.cutState === 'NONE' && makiNeedsFlame();
  if (bar) bar.style.display = show ? 'block' : 'none';
  if (fill) fill.style.width = `${Math.min(100, (roll.flame || 0) / MAKI_FLAME_MAX * 100)}%`;
  const wrap = document.getElementById('maki-roll-wrap');
  if (wrap) {
    const armed = toolArmedMap.get('torch');
    wrap.classList.toggle('flaming', !!armed && armed.area === 'makis');
    wrap.classList.toggle('seared', (roll.flame || 0) >= 0.6 && (roll.flame || 0) <= MAKI_FLAME_GREEN[1]);
    wrap.classList.toggle('burnt', (roll.flame || 0) > MAKI_FLAME_GREEN[1]);
  }
}
const MAKI_FLAME_SAUCES = [89, 85, 80];                                   // salsas que se flamean: Yama, Nin Niku y Digión
const makiPlateNeedsFlame = sl => !!(sl && sl.item && sl.items.some(id => MAKI_FLAME_SAUCES.includes(id)));
function makiPlateFlameUi() {
  document.querySelectorAll('[data-mk-flame]').forEach(el => {
    const sl = stGet('makis').slots[parseInt(el.dataset.mkFlame, 10)], f = sl ? (sl.flame || 0) : 0, fill = el.querySelector('i');
    if (fill) fill.style.width = Math.min(100, f / MAKI_FLAME_MAX * 100) + '%';
    el.classList.toggle('seared', f >= MAKI_FLAME_GREEN[0] && f <= MAKI_FLAME_GREEN[1]);
    el.classList.toggle('burnt', f > MAKI_FLAME_GREEN[1]);
  });
}
function makiPlateFlameTick(armed) {
  const sl = stGet('makis').slots[armed.pan];
  if (!makiPlateNeedsFlame(sl) || (sl.flame || 0) >= MAKI_FLAME_MAX) { toolDisarm('torch'); return; }
  const before = sl.flame || 0;
  sl.flame = Math.min(MAKI_FLAME_MAX, before + MAKI_FLAME_RATE * 0.1);
  sfxEvery('flame', 420);
  if (before < MAKI_FLAME_GREEN[0] && sl.flame >= MAKI_FLAME_GREEN[0]) { try { playSound('ding'); } catch (e) {} showStationToast('🔥 ¡En su punto! Retira el flameador ahora.'); }
  if (sl.flame >= MAKI_FLAME_MAX) { showStationToast('⚠ Se quemó la salsa.'); try { playSound('burn'); } catch (e) {} toolDisarm('torch'); }
  makiPlateFlameUi();
}
function makiFlameTick() {
  const armed = toolArmedMap.get('torch');
  if (!armed || armed.area !== 'makis' || gameState.isPaused || gameState.isGameOver) return;
  if (stagedOn('makis')) { makiPlateFlameTick(armed); return; }          // con etapas el flameado es de Emplatar
  const roll = gameState.makiRoll;
  if (!makiCanFlame()) { toolDisarm('torch'); return; }                 // el maki cambió (se vació, se cortó...)
  const before = roll.flame || 0;
  roll.flame = Math.min(MAKI_FLAME_MAX, before + MAKI_FLAME_RATE * 0.1);
  sfxEvery('flame', 420);
  if (before < MAKI_FLAME_GREEN[0] && roll.flame >= MAKI_FLAME_GREEN[0]) { try { playSound('ding'); } catch (e) {} showStationToast('🔥 ¡En su punto! Retira el flameador ahora.'); }
  if (roll.flame >= MAKI_FLAME_MAX) { showStationToast('⚠ Se quemó la cobertura.'); try { playSound('burn'); } catch (e) {} toolDisarm('torch'); }
  makiFlameUi();
}
setInterval(makiFlameTick, 100);
// Extender el arroz: gesto horizontal sobre la tabla (el vertical sigue siendo enrollar)
let makiSpreadDrag = null;
function endMakiSpreadDrag() {
  document.removeEventListener('pointermove', onMakiSpreadMove);
  document.removeEventListener('pointerup', onMakiSpreadUp);
  document.removeEventListener('pointercancel', onMakiSpreadUp);
  makiSpreadDrag = null;
}
function onMakiSpreadMove(e) {
  const d = makiSpreadDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  const dx = e.clientX - d.lx, dy = e.clientY - d.ly;
  if (!d.mode) {
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
    d.mode = Math.abs(e.clientX - d.x) > Math.abs(e.clientY - d.y) * 1.2 ? 'spread' : 'other';
    if (d.mode === 'spread') {                                           // un temblor vertical al empezar no debe contar como enrollar
      const roll = gameState.makiRoll;
      if (roll.rollState === 'ROLLING' && roll.rollProgress < 0.2) { endMakiRollDrag(); setMakiRollProgress(0); }
    }
  }
  d.lx = e.clientX; d.ly = e.clientY;
  if (d.mode !== 'spread') return;
  if (!makiSpreadAllowed()) { endMakiSpreadDrag(); return; }
  const roll = gameState.makiRoll, before = roll.spread || 0;
  roll.spread = Math.min(1, before + Math.abs(dx) / MAKI_SPREAD_PX);
  sfxEvery('swish', 170);
  makiApplySpread();
  if (before < 1 && roll.spread >= 1) { try { playSound('ding'); } catch (err) {} showStationToast('🍚 ¡Arroz bien extendido!'); renderMakiStation(); }
}
function onMakiSpreadUp(e) {
  const d = makiSpreadDrag;
  if (!d || e.pointerId !== d.pointerId) return;
  endMakiSpreadDrag();
  renderMakiStation();
}
function attachMakiSpreadGesture() {
  const zone = document.getElementById('maki-board-zone');
  if (!zone || zone._spreadBound) return;
  zone._spreadBound = true;
  zone.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (gameState.isPaused || gameState.isGameOver || makiToolDrag || !makiSpreadAllowed()) return;
    endMakiSpreadDrag();
    makiSpreadDrag = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, mode: null };
    document.addEventListener('pointermove', onMakiSpreadMove);
    document.addEventListener('pointerup', onMakiSpreadUp);
    document.addEventListener('pointercancel', onMakiSpreadUp);
  });
}

function attachMakiRollGesture() {
  const zone = document.getElementById('maki-board-zone');
  if (!zone || zone._rollBound) return;
  zone._rollBound = true;
  zone.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (gameState.isPaused || gameState.isGameOver || makiToolDrag) return;
    if (!makiCanRoll()) return;
    e.preventDefault();
    endMakiRollDrag();
    makiRollDrag = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startProgress: gameState.makiRoll.rollProgress,
      height: zone.getBoundingClientRect().height
    };
    document.addEventListener('pointermove', onMakiRollMove);
    document.addEventListener('pointerup', onMakiRollUp);
    document.addEventListener('pointercancel', onMakiRollUp);
  });
}

function attachMakiTools() {
  attachMakiRollGesture();
  attachMakiSpreadGesture();
  [['maki-tool-mat', 'mat'], ['maki-tool-knife', 'knife']].forEach(([id, tool]) => {
    const el = document.getElementById(id);
    if (!el || el._makiToolBound) return;
    el._makiToolBound = true;
    el.addEventListener('contextmenu', (ev) => ev.preventDefault());
    el.addEventListener('pointerdown', (ev) => beginMakiToolPress(ev, tool, el));
  });
}
