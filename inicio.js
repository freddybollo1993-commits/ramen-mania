/* Inicio: la lógica que sostiene la pantalla principal (home.js) y los modos (modos.js).
   - Window.Inicio.act(k, arg): acciones del juego (abrir Campaña, Rash, Japón, Tienda, Ranking, cuenta, ajustes…).
   - Avisos «NUEVO» / «¡MEJORA!» / «¡EMPIEZA!» de los botones (se calculan con el estado real del juego).
   - Datos del chef para la pantalla principal y sincronización en vivo de propinas y perfil.
   El menú antiguo de lista y escenario (pilares, vitrina, salas, vista clásica) se eliminó en v201.
   Script clásico: nada de import/export. */
(function () {
  'use strict';

  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const $ = id => document.getElementById(id);
  const sfx = n => { try { playSound(n); } catch (e) {} };

  // ---------- estado del jugador ----------
  const tutDone = () => { try { return isTutorialCompleted(); } catch (e) { return false; } };
  const wallet = () => { try { return getPropinasWallet(); } catch (e) { return 0; } };
  const retosHechos = () => { try { return trainingDoneCount(); } catch (e) { return 0; } };
  const unlockedLevel = () => { try { return getCampaignStatsSummary().unlockedLevel || 1; } catch (e) { return 1; } };

  // ---------- avisos en los botones (NUEVO · ¡NUEVO! · ¡EMPIEZA!) ----------
  // Los de «novedad» se quitan al abrir esa función (se guardan como vistos).
  const SEEN_KEY = 'ramen_ini_seen';
  const NUEVO_V = { sound: 'v172', pantry: 'v176' };                  // funciones nuevas: «NUEVO» hasta que se abren una vez
  const seenMap = () => { try { return JSON.parse(store.get(SEEN_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const alertToken = id => id === 'camp' ? 'L' + unlockedLevel() : (NUEVO_V[id] || null);
  const markSeen = id => { const t = alertToken(id); if (t == null) return; const m = seenMap(); if (m[id] === t) return; m[id] = t; store.set(SEEN_KEY, JSON.stringify(m)); };
  function itemAlert(id) {
    try {
      if (id === 'camp') { const L = unlockedLevel(); return tutDone() && L > 1 && seenMap().camp !== 'L' + L ? { t: 'NIVEL ' + L, k: 'new' } : null; }
      if (NUEVO_V[id]) return seenMap()[id] === NUEVO_V[id] ? null : { t: 'NUEVO', k: 'new' };
      if (id === 'knives') return window.Taller && Taller.canBuyAny() ? { t: '¡NUEVO!', k: 'buy' } : null;
      if (id === 'aprender') return !tutDone() ? { t: '¡EMPIEZA!', k: 'go' } : itemAlert('pantry');
      if (id === 'book' && window.Recetario) { const n = Recetario.summary().fresh; return n > 0 && tutDone() ? { t: n + ' POR PROBAR', k: 'new' } : null; }
    } catch (e) {}
    return null;
  }
  const chefName = () => {
    try {
      if (window.DeviceManager && DeviceManager.currentPlayer) {
        const n = DeviceManager.currentPlayer.playerName || DeviceManager.currentPlayer.name;
        if (n) return String(n).replace(/^Chef\s+/i, '');
      }
    } catch (e) {}
    return 'Invitado';
  };
  const chefAvatar = () => {
    try { if (window.DeviceManager && DeviceManager.currentPlayer && DeviceManager.currentPlayer.avatar) return DeviceManager.currentPlayer.avatar; } catch (e) {}
    return '👤';
  };

  // ---------- acciones del juego ----------
  const ACT = {
    lesson: k => Guia.start(k),
    tickets: () => (typeof openLevelRetos === 'function' ? openLevelRetos() : null),
    free: a => { window.startFreeAreas = a ? [a] : ['ramen']; setStartSelectedMode('FREE'); handleStartPlayClick(); },
    camp: () => openCampaignModal(),
    rash: () => { setStartSelectedMode('RASH'); if (startSelectedMode === 'RASH') handleStartPlayClick(); },
    book: () => Recetario.open(),
    board: () => openLeaderboardModal(),
    chest: () => Taller.open('secretos'),
    knives: () => Taller.open('mejoras'),
    pantry: () => reconOpen(),
    door: () => japonOpen(),
    room: () => MultiplayerManager.openLobbyModal(),
    acct: () => openAccountModal(),
    stats: () => openStatsModal(),
    order: () => openIngredientOrderModal(),
    sound: () => (window.Ambiente && Ambiente.panel ? Ambiente.panel() : toggleAudioMute()),
    full: () => toggleFullScreen(),
    keys: () => openShortcutsModal(),
    update: () => forceAppCacheUpdate(),
    device: () => showDeviceInfoModal(),
    enter: n => { if (n === 'aula') Modos.aula(); }
  };

  // ---------- API pública ----------
  window.Inicio = {
    act(k, arg) {
      sfx('click');
      const f = ACT[k];
      if (!f) return;
      try { f(arg); } catch (e) { console.warn('Inicio.act', k, e); }
    },
    /** JUGAR de Campaña: entra directo al siguiente nivel (con la explicación del Maestro si es la primera vez). */
    play() {
      if (!tutDone()) return Modos.learn();
      sfx('serve'); markSeen('camp');
      try { playCampaignLevel(Math.max(0, unlockedLevel() - 1)); } catch (e) { console.warn('Inicio.play', e); }
    },
    refresh() { try { if (window.Home) Home.refresh(); } catch (e) {} },
    seen: id => markSeen(id),                           // marca como vista una función «NUEVO»
    _h: { alertOf: id => itemAlert(id), tutDone, wallet, chefName, chefAvatar, retosHechos }
  };

  // ---------- arranque ----------
  function init() {
    try { if (window.Home) Home.sync({}); } catch (e) {}
    const _r = window.returnToStartMenu;
    if (typeof _r === 'function') {
      window.returnToStartMenu = function () {
        const r = _r.apply(this, arguments);
        try { Inicio.refresh(); } catch (e) {}
        return r;
      };
    }
    // propinas en vivo
    const _upHUD = window.updatePropinasHUD;
    if (typeof _upHUD === 'function') {
      window.updatePropinasHUD = function () {
        const r = _upHUD.apply(this, arguments);
        try { const val = wallet(); document.querySelectorAll('.hm-wallet').forEach(el => { el.textContent = val; }); } catch (e) {}
        return r;
      };
    }
    // perfil en vivo
    const _syncBar = window.syncLinkedUserBar;
    if (typeof _syncBar === 'function') {
      window.syncLinkedUserBar = function () {
        const r = _syncBar.apply(this, arguments);
        try { Inicio.refresh(); } catch (e) {}
        return r;
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
