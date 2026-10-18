/* Módulo 16-cooperativo-estaciones — Cooperativo: sincronización de estaciones.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// --- Cooperativo: woks, tabla de makis y frituras se comparten con el equipo ---
// Cada vez que una de esas estaciones cambia se envía una foto de su estado (sin los temporizadores
// locales: el compañero cuenta su propio tiempo de fritura). Y una estación tiene un solo cocinero a
// la vez: quien la toca la bloquea unos segundos, igual que los tazones y las ollas de ramen.
let _applyingRemoteStation = false;
const _lastStationSig = {};

function isCoopActive() {
  return typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP' && MultiplayerManager.sharedKitchen;   // solo con estaciones compartidas (hoy cada chef cocina en la suya)
}

function coopLock(stationId) {
  return !isCoopActive() || MultiplayerManager.requestStationLock(stationId);
}

function stationSnapshot(area, index) {
  if (area === 'salteados') {
    const w = gameState.woks[index];
    return { ingredients: [...w.ingredients], result: w.result, matchedRecipe: w.matchedRecipe, profile: w.profile || null,
      stirSeconds: w.stirSeconds || 0, orderMatches: w.orderMatches, orderTotal: w.orderTotal, readyAt: w.readyAt };
  }
  if (area === 'makis') {
    const r = gameState.makiRoll;
    return { ingredients: [...r.ingredients], matPlaced: r.matPlaced, rollState: r.rollState === 'ROLLING' ? 'NONE' : r.rollState,
      rollProgress: r.rollState === 'ROLLED' ? 1 : 0, baseLen: r.baseLen, readyAt: r.readyAt, cutState: r.cutState === 'CUTTING' ? 'NONE' : r.cutState,
      cutProgress: r.cutState === 'CUT' ? 1 : 0 };
  }
  const f = gameState.fryStation;
  return { ingredients: [...f.ingredients], phase: f.phase, proteinId: f.proteinId, coat: f.coat, fryResult: f.fryResult,
    frySeconds: f.frySeconds, fryTone: f.fryTone, readyAt: f.readyAt, cutState: f.cutState === 'CUTTING' ? 'NONE' : f.cutState, cutProgress: f.cutState === 'CUT' ? 1 : 0 };
}

function syncStationIfChanged(area, index = 0) {
  if (_applyingRemoteStation || !isCoopActive()) return;
  const snap = stationSnapshot(area, index);
  const sig = JSON.stringify({ ...snap, frySeconds: 0 });
  const key = area + index;
  if (_lastStationSig[key] === sig) return;
  _lastStationSig[key] = sig;
  MultiplayerManager.syncStation(area, index, snap);
}

function applyRemoteStation(area, index, data) {
  if (!data) return;
  _applyingRemoteStation = true;
  try {
    _lastStationSig[area + index] = JSON.stringify({ ...data, frySeconds: 0 });
    if (area === 'salteados') {
      gameState.woks[index] = { ...data, stirring: false, stirSeconds: 0 };
      renderWoks();
    } else if (area === 'makis') {
      gameState.makiRoll = { ...newMakiRoll(), ...data };
      renderMakiStation();
    } else if (area === 'frituras') {
      gameState.fryStation = { ...newFryStation(), ...data };
      if (data.phase === 'FRYING') ensureFryTimer();
      renderFryStation();
    }
    if (gameState.activeArea === area) renderPantryGrid();
    renderCustomers();
  } finally {
    _applyingRemoteStation = false;
  }
}

// El compañero sirvió el plato de una de estas estaciones: se vacía también aquí.
function applyRemoteStationServed(area, index) {
  _applyingRemoteStation = true;
  try { consumeReadyDish({ area, index: index || 0 }); }
  finally { _applyingRemoteStation = false; }
  renderCustomers();
}
