/* pantallas-bs.js — Ajustes, Clasificaciones (ranking) y Orden de ingredientes con la distribución de Brawl Stars:
   barra superior con ◀ y 🏠, título al centro, pestañas arriba a la izquierda y la lista a la derecha. Script clásico (ámbito global compartido).
   Sustituye a los modales viejos: openLeaderboardModal / closeLeaderboardModal / openIngredientOrderModal / closeIngredientOrderModal
   siguen existiendo con el mismo nombre (los llaman la partida, los atajos de teclado y los menús), pero ahora abren estas pantallas. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const sfx = t => { try { playSound(t); } catch (e) {} };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  const CSS = `
  #bs { position: fixed; inset: 0; z-index: 10010; display: flex; flex-direction: column; color: #fff; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; overflow: hidden;
    background: radial-gradient(circle at 18% 0%, #6b3418 0%, #2a120a 55%, #140806 100%); padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); -webkit-tap-highlight-color: transparent; }
  #bs::before { content: ''; position: absolute; inset: 0; opacity: .07; pointer-events: none; background-image: radial-gradient(circle, #fff 0 16%, transparent 17%); background-size: 44px 44px; }
  #bs * { box-sizing: border-box; }
  .bs-top { position: relative; display: flex; align-items: stretch; height: 46px; flex: none; background: #0b0503; }
  .bs-nav { width: 66px; border: 0; background: #2f2a26; color: #fff; font: 900 24px/1 'Fredoka', sans-serif; cursor: pointer; border-bottom: 4px solid #12100e; }
  .bs-nav.l { border-radius: 0 0 16px 0; } .bs-nav.r { border-radius: 0 0 0 16px; } .bs-nav:active { background: #423b36; }
  .bs-title { flex: 1; display: flex; align-items: center; justify-content: center; margin: 0; min-width: 0; font: 400 25px/1 'Fredoka One', 'Fredoka', sans-serif; color: #fff; letter-spacing: .5px; text-transform: uppercase; white-space: nowrap;
    -webkit-text-stroke: 5px #000; paint-order: stroke fill; text-shadow: 0 3px 0 #000; }
  .bs-tabs { display: flex; align-items: flex-end; gap: 3px; padding: 6px 0 0 8px; }
  .bs-tab { height: 34px; padding: 0 16px; border: 0; border-radius: 6px 6px 0 0; background: #3a342f; color: #fff; font: 900 15px/1 'Fredoka', sans-serif; letter-spacing: .3px; cursor: pointer; text-shadow: 0 2px 0 rgba(0,0,0,.6); }
  .bs-tab.on { background: linear-gradient(#ff9a3c, #e86a10); box-shadow: inset 0 -3px 0 rgba(0,0,0,.25); }
  .bs-body { position: relative; flex: 1; min-height: 0; display: flex; padding: 10px max(14px, env(safe-area-inset-right)) 10px max(14px, env(safe-area-inset-left)); gap: 14px; }
  .bs-btn { position: relative; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; padding: 6px 12px; border: 3px solid #0e0805; border-bottom-width: 6px; border-radius: 10px; cursor: pointer;
    background: linear-gradient(#a9743e, #7a4a22); color: #fff; font: 900 15px/1.05 'Fredoka', sans-serif; text-align: center; text-shadow: 0 2px 0 rgba(0,0,0,.65); box-shadow: inset 0 3px 0 rgba(255,255,255,.28); letter-spacing: .2px; }
  .bs-btn:active { transform: translateY(2px); border-bottom-width: 4px; }
  .bs-btn.on { background: linear-gradient(#ffb74a, #ec7a10); } .bs-btn.go { background: linear-gradient(#6fdc5a, #2f9f2a); }
  .bs-lab { font: 900 14px/1 'Fredoka', sans-serif; letter-spacing: .4px; text-transform: uppercase; text-shadow: 0 2px 0 rgba(0,0,0,.7); text-align: center; color: #fff; margin-bottom: 5px; }
  /* ---- Ajustes ---- */
  .bs-set { flex: 1; display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 10px 30px; align-content: center; align-items: start; padding: 0 12px; }
  .bs-sl { margin-bottom: 8px; }
  .bs-bar { display: flex; align-items: center; gap: 8px; }
  .bs-ico { flex: none; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 22px; border-radius: 8px; transform: rotate(45deg); background: #fff; border: 3px solid #0e0805; }
  .bs-ico > span { transform: rotate(-45deg); line-height: 1; }
  .bs-track { position: relative; flex: 1; height: 32px; border-radius: 8px; background: rgba(0,0,0,.45); border: 3px solid rgba(0,0,0,.55); overflow: hidden; cursor: pointer; touch-action: none; }
  .bs-track i { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(#ffd44d, #ff9a00); box-shadow: inset 0 3px 0 rgba(255,255,255,.35); }
  .bs-track b { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font: 900 13px/1 'Fredoka', sans-serif; text-shadow: 0 2px 0 #000; }
  .bs-step { flex: none; display: flex; border: 3px solid #0e0805; border-bottom-width: 6px; border-radius: 9px; overflow: hidden; background: linear-gradient(#6fdc5a, #2f9f2a); }
  .bs-step button { width: 40px; height: 36px; border: 0; background: none; color: #fff; font: 900 24px/1 'Fredoka', sans-serif; text-shadow: 0 2px 0 rgba(0,0,0,.6); cursor: pointer; } .bs-step button:active { background: rgba(0,0,0,.2); }
  .bs-col { display: flex; flex-direction: column; gap: 10px; }
  .bs-tg { display: flex; border: 3px solid #0e0805; border-radius: 9px; overflow: hidden; background: rgba(0,0,0,.45); }
  .bs-tg button { flex: 1; height: 40px; border: 0; background: none; color: #d8c7ae; font: 900 18px/1 'Fredoka', sans-serif; cursor: pointer; text-shadow: 0 2px 0 rgba(0,0,0,.6); }
  .bs-tg button.on { background: linear-gradient(#6fdc5a, #2f9f2a); color: #fff; } .bs-tg button.on.no { background: linear-gradient(#8a8f98, #545861); }
  /* ---- Clasificaciones ---- */
  .bs-left { flex: none; width: 236px; display: flex; flex-direction: column; gap: 9px; padding-top: 4px; }
  .bs-left .bs-btn { width: 100%; justify-content: flex-start; padding: 6px 12px; min-height: 48px; font-size: 16px; }
  .bs-note { margin-top: auto; font: 700 11.5px/1.3 'Fredoka', sans-serif; color: #d8c7ae; text-shadow: 0 1px 0 rgba(0,0,0,.6); }
  .bs-right { flex: 1; min-width: 0; display: flex; flex-direction: column; background: rgba(0,0,0,.34); border: 3px solid #0e0805; border-radius: 6px; overflow: hidden; }
  .bs-list { flex: 1; min-height: 0; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 5px; -webkit-overflow-scrolling: touch; }
  .bs-row { flex: none; display: flex; align-items: stretch; height: 50px; border: 2px solid rgba(0,0,0,.65); border-radius: 4px; background: linear-gradient(90deg, #6b5a5c, #54474a); overflow: hidden; }
  .bs-row .rk { flex: none; width: 50px; display: flex; align-items: center; justify-content: center; font: 900 21px/1 'Fredoka', sans-serif; color: #b9a9a3; background: rgba(0,0,0,.2); text-shadow: 0 2px 0 rgba(0,0,0,.5); }
  .bs-row.p1 .rk { color: #ffd24a; } .bs-row.p2 .rk { color: #e3e8ef; } .bs-row.p3 .rk { color: #ffa05c; }
  .bs-row .av { flex: none; width: 44px; display: flex; align-items: center; justify-content: center; margin: 3px 8px 3px 0; border-radius: 6px; border: 2px solid #0e0805; font: 900 21px/1 'Fredoka', sans-serif; color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,.5); }
  .bs-row .nm { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; line-height: 1.1; }
  .bs-row .nm b { font: 900 17px/1.1 'Fredoka', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 2px 0 rgba(0,0,0,.55); }
  .bs-row .nm small { font: 700 11.5px/1.2 'Fredoka', sans-serif; color: #e6d8c8; }
  .bs-row .sc { flex: none; display: flex; align-items: center; padding: 0 14px; font: 900 21px/1 'Fredoka', sans-serif; color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,.6); background: rgba(0,0,0,.18); clip-path: polygon(14px 0, 100% 0, 100% 100%, 0 100%); padding-left: 24px; }
  .bs-row .bd { flex: none; width: 70px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.28); }
  .bs-badge { width: 44px; height: 46px; display: flex; align-items: center; justify-content: center; font: 900 19px/1 'Fredoka', sans-serif; color: #fff; text-shadow: 0 2px 0 #000; clip-path: polygon(50% 0, 96% 20%, 96% 78%, 50% 100%, 4% 78%, 4% 20%); background: linear-gradient(#a58bff, #4a2fd0); }
  .bs-row.me { height: 54px; flex: none; margin: 0; border: 0; border-top: 3px solid #0e0805; border-radius: 0; background: linear-gradient(90deg, #ff9a3c, #e8670e); }
  .bs-row.me .rk { color: #fff; background: rgba(0,0,0,.2); } .bs-row.me .nm small { color: #fff0d6; }
  .bs-empty { margin: auto; padding: 24px; text-align: center; font: 800 14px/1.4 'Fredoka', sans-serif; color: #d8c7ae; }
  /* ---- Orden de ingredientes ---- */
  .bs-areas { flex: none; width: 150px; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
  .bs-areas .bs-btn { width: 100%; justify-content: flex-start; min-height: 50px; font-size: 16px; }
  .bs-areas .bs-btn span { font-size: 22px; }
  .bs-ord { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
  .bs-subs { display: flex; gap: 6px; flex: none; } .bs-subs .bs-btn { flex: 1; min-height: 40px; font-size: 14px; }
  .bs-hint { flex: none; font: 700 12px/1.25 'Fredoka', sans-serif; color: #e6d8c8; text-shadow: 0 1px 0 rgba(0,0,0,.6); }
  .bs-grid { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); grid-auto-rows: 64px; gap: 6px; padding: 6px; align-content: start; background: rgba(0,0,0,.34); border: 3px solid #0e0805; border-radius: 6px; -webkit-overflow-scrolling: touch; touch-action: pan-y; }
  .bs-tile { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 3px 2px; border: 2px solid #0e0805; border-radius: 8px; background: linear-gradient(#7d5a3a, #5a3d24); cursor: grab; user-select: none; -webkit-user-select: none; touch-action: none; }
  .bs-tile img, .bs-tile .ing-ico { width: 30px; height: 30px; object-fit: contain; pointer-events: none; } .bs-tile .e { font-size: 25px; line-height: 30px; pointer-events: none; }
  .bs-tile em { max-width: 100%; padding: 0 2px; font: 800 10px/1.05 'Fredoka', sans-serif; font-style: normal; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 0 rgba(0,0,0,.7); pointer-events: none; }
  .bs-tile i { position: absolute; top: -1px; left: -1px; min-width: 19px; padding: 1px 4px; border-radius: 7px 0 7px 0; background: #e8670e; font: 900 10px/1.2 'Fredoka', sans-serif; font-style: normal; text-align: center; pointer-events: none; }
  .bs-tile.sel { outline: 3px solid #ffe14d; background: linear-gradient(#a98046, #7a5430); } .bs-tile.drag { opacity: .35; }
  .bs-proxy { position: fixed; z-index: 10100; pointer-events: none; opacity: .92; transform: scale(1.12); box-shadow: 0 6px 14px rgba(0,0,0,.55); }
  .bs-acts { display: flex; gap: 8px; flex: none; } .bs-acts .bs-btn { flex: 1; min-height: 38px; font-size: 13.5px; }
  .bs-toast { position: absolute; left: 50%; bottom: 62px; transform: translateX(-50%) translateY(10px); padding: 7px 16px; border-radius: 16px; background: rgba(0,0,0,.82); border: 2px solid #ffb300; font: 900 13px/1 'Fredoka', sans-serif; opacity: 0; transition: opacity .2s, transform .2s; pointer-events: none; }
  .bs-toast.show { opacity: 1; transform: translateX(-50%); }
  @media (max-height: 360px) { .bs-top { height: 40px; } .bs-nav { width: 56px; } .bs-title { font-size: 21px; } .bs-row { height: 44px; } .bs-row.me { height: 48px; } .bs-track { height: 28px; } .bs-ico { width: 34px; height: 34px; } .bs-btn { min-height: 38px; } }
  `;
  function css() { if ($('bs-css')) return; const s = document.createElement('style'); s.id = 'bs-css'; s.textContent = CSS; document.head.appendChild(s); }

  /** Crea (o reemplaza) la pantalla completa con su barra superior. `tabs` es el HTML opcional de las pestañas de arriba a la izquierda. */
  function shell(title, tabsHtml, bodyHtml) {
    css(); close(true);
    const el = document.createElement('div'); el.id = 'bs';
    el.innerHTML = '<div class="bs-top"><button class="bs-nav l" aria-label="Volver" data-a="close">◀</button>' + (tabsHtml ? '<div class="bs-tabs">' + tabsHtml + '</div>' : '') + '<h2 class="bs-title">' + title + '</h2><button class="bs-nav r" aria-label="Inicio" data-a="close">🏠</button></div><div class="bs-body">' + bodyHtml + '</div>';
    document.body.appendChild(el);
    return el;
  }
  let onClose = null;
  function close(silent) {
    const el = $('bs'); if (el) el.remove();
    if (!silent) sfx('click');
    const f = onClose; onClose = null; if (f) try { f(); } catch (e) {}
    try { if (window.Home && Home.refresh) Home.refresh(); } catch (e) {}
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('bs')) { e.stopPropagation(); close(); } }, true);
  let toastT = 0;
  function toast(msg) {
    const el = $('bs'); if (!el) return;
    let t = $('bs-toast'); if (!t) { t = document.createElement('div'); t.id = 'bs-toast'; t.className = 'bs-toast'; el.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // =====================================================================================================================
  //  AJUSTES
  // =====================================================================================================================
  const BUSES = [['sfx', '🥢', 'Efectos de sonido'], ['amb', '🍲', 'Ambiente de la cocina'], ['mus', '🎵', 'Música']];
  function vols() {
    try { const s = window.Ambiente && Ambiente.estado && Ambiente.estado(); if (s && s.vol) return Object.assign({ sfx: 1, amb: 1, mus: 1 }, s.vol); } catch (e) {}
    try { const v = JSON.parse(store.get('ramen_audio_vol') || 'null'); if (v) return Object.assign({ sfx: 1, amb: 1, mus: 1 }, v); } catch (e) {}
    return { sfx: 1, amb: 1, mus: 1 };
  }
  const isMuted = () => { try { return !!isSoundMuted; } catch (e) { return false; } };
  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function setVol(bus, v) {
    v = Math.max(0, Math.min(1, v));
    try { if (window.Ambiente && Ambiente.volumen) Ambiente.volumen(bus, v); } catch (e) {}
    const cur = vols(); cur[bus] = v; if (!(window.Ambiente && Ambiente.estado && Ambiente.estado())) store.set('ramen_audio_vol', JSON.stringify(cur));
    paintVol(bus, v);
  }
  function paintVol(bus, v) {
    const t = document.querySelector('.bs-track[data-b="' + bus + '"]'); if (!t) return;
    t.firstElementChild.style.width = Math.round(v * 100) + '%'; t.lastElementChild.textContent = Math.round(v * 100);
  }
  function ajustes() {
    try { initAudio(); } catch (e) {}
    const v = vols();
    const sl = BUSES.map(([b, ic, n]) => '<div class="bs-sl"><div class="bs-lab">' + n + '</div><div class="bs-bar"><span class="bs-ico"><span>' + ic + '</span></span>'
      + '<div class="bs-track" data-b="' + b + '"><i style="width:' + Math.round(v[b] * 100) + '%"></i><b>' + Math.round(v[b] * 100) + '</b></div>'
      + '<div class="bs-step"><button data-a="vol" data-b="' + b + '" data-d="-0.1" aria-label="Bajar">‹</button><button data-a="vol" data-b="' + b + '" data-d="0.1" aria-label="Subir">›</button></div></div></div>').join('');
    const m = !isMuted(), f = isFull();
    const el = shell('Ajustes', '', '<div class="bs-set"><div>' + sl + '</div><div class="bs-col">'
      + '<div><div class="bs-lab">Sonido</div><div class="bs-tg" id="bs-tg-snd"><button data-a="snd" data-v="1" class="' + (m ? 'on' : '') + '">SÍ</button><button data-a="snd" data-v="0" class="' + (!m ? 'on no' : '') + '">NO</button></div></div>'
      + '<div><div class="bs-lab">Pantalla completa</div><div class="bs-tg" id="bs-tg-full"><button data-a="full" data-v="1" class="' + (f ? 'on' : '') + '">SÍ</button><button data-a="full" data-v="0" class="' + (!f ? 'on no' : '') + '">NO</button></div></div>'
      + '<button class="bs-btn" data-a="order">🥢 Ordenar ingredientes</button>'
      + '<button class="bs-btn" data-a="device">🛡️ Este dispositivo</button>'
      + '<button class="bs-btn" data-a="test">🔔 Probar sonido</button></div></div>');
    let drag = null;
    const fromEvent = (t, ev) => { const r = t.getBoundingClientRect(); return (ev.clientX - r.left) / r.width; };
    el.addEventListener('pointerdown', ev => { const t = ev.target.closest('.bs-track'); if (!t) return; drag = t; try { t.setPointerCapture(ev.pointerId); } catch (e) {} setVol(t.dataset.b, Math.round(fromEvent(t, ev) * 20) / 20); });
    el.addEventListener('pointermove', ev => { if (drag) setVol(drag.dataset.b, Math.round(fromEvent(drag, ev) * 20) / 20); });
    const end = () => { if (drag) { drag = null; sfx('click'); } };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('click', ev => {
      const b = ev.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') close();
      else if (a === 'vol') { setVol(b.dataset.b, Math.round((vols()[b.dataset.b] + parseFloat(b.dataset.d)) * 10) / 10); sfx('click'); }
      else if (a === 'snd') { if ((b.dataset.v === '1') === isMuted()) { toggleAudioMute(); } sync(); sfx('click'); }
      else if (a === 'full') { if ((b.dataset.v === '1') !== isFull()) toggleFullScreen(); setTimeout(sync, 400); }
      else if (a === 'order') ordenar();
      else if (a === 'device') { try { showDeviceInfoModal(); } catch (e) {} }
      else if (a === 'test') { try { playSound('bell'); playSound('serve'); } catch (e) {} }
    });
    function sync() {
      const mm = !isMuted(), ff = isFull();
      $('bs-tg-snd').innerHTML = '<button data-a="snd" data-v="1" class="' + (mm ? 'on' : '') + '">SÍ</button><button data-a="snd" data-v="0" class="' + (!mm ? 'on no' : '') + '">NO</button>';
      $('bs-tg-full').innerHTML = '<button data-a="full" data-v="1" class="' + (ff ? 'on' : '') + '">SÍ</button><button data-a="full" data-v="0" class="' + (!ff ? 'on no' : '') + '">NO</button>';
    }
    setTimeout(() => { const n = vols(); BUSES.forEach(([b]) => paintVol(b, n[b])); }, 150);   // el motor de audio se crea con este primer toque: se vuelven a leer los volúmenes guardados
  }

  // =====================================================================================================================
  //  CLASIFICACIONES
  // =====================================================================================================================
  const RK = { tab: 'NORMAL', crit: { NORMAL: 'money', RASH: 'round', MMR: 'mmr' }, cache: {}, busy: false, pausedBy: false };
  const CRITS = { NORMAL: [['money', '💰 Mejor recaudación'], ['served', '🍜 Más clientes atendidos']], RASH: [['round', '⚡ Ronda más alta'], ['money', '💰 Mejor recaudación']], MMR: [['mmr', '⚔️ Puntos MMR']] };
  const keyOf = r => String(r.player_name || '').trim().toLowerCase();
  const num = v => (Number(v) || 0);
  function cmpFor(tab, crit) {
    if (tab === 'MMR') return (a, b) => num(b.mmr) - num(a.mmr);
    if (tab === 'NORMAL') return crit === 'served' ? (a, b) => num(b.customers_served) - num(a.customers_served) || num(b.score_money) - num(a.score_money) : (a, b) => num(b.score_money) - num(a.score_money) || num(b.customers_served) - num(a.customers_served);
    return crit === 'money' ? (a, b) => num(b.score_money) - num(a.score_money) || num(b.level_reached) - num(a.level_reached) : (a, b) => num(b.level_reached) - num(a.level_reached) || num(b.score_money) - num(a.score_money);
  }
  /** Una sola fila por jugador: la mejor según el criterio elegido (los récords repetidos del mismo jugador no cuentan). */
  function best(rows, cmp) {
    const seen = new Set(), out = [];
    rows.slice().sort(cmp).forEach(r => { const k = keyOf(r); if (!k || seen.has(k)) return; seen.add(k); out.push(r); });
    return out;
  }
  function localRows(tab) { try { return JSON.parse(store.get('ramen_local_scores') || '[]').filter(r => r && r.game_mode === tab); } catch (e) { return []; } }
  function me() {
    let p = null; try { p = DeviceManager.currentPlayer; } catch (e) {}
    return { name: (p && p.playerName) || store.get('ramen_player_name') || 'Chef', avatar: (p && p.avatar) || '🍜', device: (() => { try { return DeviceManager.deviceId; } catch (e) { return ''; } })() };
  }
  async function load(force) {
    const tab = RK.tab, crit = RK.crit[tab], ck = tab + ':' + crit + ':' + me().name;
    if (!force && RK.cache[ck] && Date.now() - RK.cache[ck].t < 60000) return RK.cache[ck];
    let rows = [], online = false;
    try {
      await ensureSupabaseLoaded();
      if (supabaseClient) {
        if (tab === 'MMR') {
          const { data, error } = await supabaseClient.rpc('pvp_ranking');
          if (!error && data && data.length) { rows = data; online = true; }
        } else {
          let q = supabaseClient.from('leaderboard').select('id,player_name,score_money,customers_served,level_reached,game_mode,created_at').eq('game_mode', tab);
          if (tab === 'NORMAL') q = crit === 'served' ? q.order('customers_served', { ascending: false }).order('score_money', { ascending: false }) : q.order('score_money', { ascending: false }).order('customers_served', { ascending: false });
          else q = crit === 'money' ? q.order('score_money', { ascending: false }).order('level_reached', { ascending: false }) : q.order('level_reached', { ascending: false }).order('score_money', { ascending: false });
          const { data, error } = await q.limit(500);
          if (!error && data && data.length) { rows = data; online = true; }
        }
      }
    } catch (e) { try { console.warn('[Ranking]', e); } catch (er) {} }
    if (!rows.length) rows = tab === 'MMR' ? [] : localRows(tab);
    const list = best(rows, cmpFor(tab, crit));
    const m = me(); let mine = null, pos = 0;
    list.forEach((r, i) => { if (!mine && (keyOf(r) === m.name.trim().toLowerCase() || (r.device_id && r.device_id === m.device))) { mine = r; pos = i + 1; } });
    if (!mine) {                                              // aún no aparece en el servidor: se muestra su mejor marca de este aparato
      if (tab === 'MMR') {
        const w = parseInt(store.get('ramen_player_pvp_wins') || '0'), l = parseInt(store.get('ramen_player_pvp_losses') || '0');
        mine = { player_name: m.name, mmr: parseInt(store.get('ramen_player_mmr') || '1000'), pvp_wins: w, pvp_losses: l };
      } else { const lr = best(localRows(tab).map(r => Object.assign({}, r, { player_name: m.name })), cmpFor(tab, crit)); mine = lr[0] || null; }
    }
    return (RK.cache[ck] = { t: Date.now(), list, online, mine, pos });
  }
  const HUES = [8, 28, 48, 96, 160, 200, 262, 320];
  function avatarOf(r, isMe) {
    if (isMe) return '<span class="av" style="background:#fff3d6;font-size:25px">' + esc(me().avatar) + '</span>';
    const nm = String(r.player_name || '?'), h = HUES[(nm.charCodeAt(0) + nm.length) % HUES.length];
    if (r.avatar) return '<span class="av" style="background:hsl(' + h + ',45%,38%);font-size:25px">' + esc(r.avatar) + '</span>';
    return '<span class="av" style="background:hsl(' + h + ',55%,42%)">' + esc(nm.trim().charAt(0).toUpperCase() || '?') + '</span>';
  }
  function rowHtml(r, i, isMe, tab, crit) {
    const nm = esc(r.player_name || 'Chef');
    let score, sub, badge;
    if (tab === 'MMR') {
      let det = { icon: '🥉', fullName: r.rank_tier || '' }; try { det = MultiplayerManager.getRankDetails(num(r.mmr) || 1000); } catch (e) {}
      score = (num(r.mmr) || 1000).toLocaleString() + ' MMR'; sub = num(r.pvp_wins) + 'V · ' + num(r.pvp_losses) + 'D · ' + esc(det.fullName); badge = '<span style="font-size:28px">' + det.icon + '</span>';
    } else if (tab === 'NORMAL') {
      score = crit === 'served' ? num(r.customers_served) + ' 🍜' : 'S/ ' + num(r.score_money); sub = crit === 'served' ? 'S/ ' + num(r.score_money) : num(r.customers_served) + ' atendidos'; badge = '<span class="bs-badge">' + num(r.level_reached) + '</span>';
    } else {
      score = crit === 'money' ? 'S/ ' + num(r.score_money) : 'Ronda ' + num(r.level_reached); sub = (crit === 'money' ? 'Ronda ' + num(r.level_reached) : 'S/ ' + num(r.score_money)) + ' · ' + num(r.customers_served) + ' atendidos'; badge = '<span class="bs-badge" style="background:linear-gradient(#ff8a80,#c62828)">' + num(r.level_reached) + '</span>';
    }
    const pos = i > 0 ? i : null;
    return '<div class="bs-row ' + (isMe ? 'me' : (i === 1 ? 'p1' : i === 2 ? 'p2' : i === 3 ? 'p3' : '')) + '"><span class="rk">' + (pos ? pos : '–') + '</span>' + avatarOf(r, isMe) + '<span class="nm"><b>' + nm + (isMe && !pos ? '' : '') + '</b><small>' + sub + '</small></span><span class="sc">' + score + '</span><span class="bd">' + badge + '</span></div>';
  }
  async function draw() {
    const box = $('bs-rk'); if (!box) return;
    const tab = RK.tab, crit = RK.crit[tab];
    document.querySelectorAll('#bs .bs-tab').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    $('bs-crit').innerHTML = CRITS[tab].map(([k, n]) => '<button class="bs-btn ' + (k === crit ? 'on' : '') + '" data-a="crit" data-c="' + k + '">' + n + '</button>').join('');
    box.innerHTML = '<div class="bs-empty">Cargando la clasificación…</div>';
    const myTab = tab + ':' + crit;
    const res = await load(false);
    if (!$('bs-rk') || myTab !== RK.tab + ':' + RK.crit[RK.tab]) return;       // el jugador cambió de pestaña mientras cargaba
    $('bs-st').textContent = res.online ? '🟢 Clasificación en línea' : '🟡 Sin conexión: solo se muestran los récords de este dispositivo.';
    const top = res.list.slice(0, 50);
    const mine = res.mine ? rowHtml(res.mine, res.pos, true, tab, crit).replace('<span class="rk">–</span>', '<span class="rk">' + (res.pos || '–') + '</span>') : '';
    box.innerHTML = '<div class="bs-list">' + (top.length ? top.map((r, i) => rowHtml(r, i + 1, false, tab, crit)).join('') : '<div class="bs-empty">Aún no hay récords en este modo.<br>¡Sé el primero en jugar!</div>') + '</div>' + mine;
  }
  function clasificaciones() {
    if (typeof gameState !== 'undefined' && !gameState.isGameOver && !gameState.isPaused) { try { togglePause(); RK.pausedBy = true; } catch (e) {} }
    onClose = () => { if (RK.pausedBy) { RK.pausedBy = false; try { if (gameState.isPaused && !gameState.isGameOver) togglePause(); } catch (e) {} } };
    const tabs = [['NORMAL', 'CAMPAÑA'], ['RASH', 'RASH'], ['MMR', 'PVP']].map(([t, n]) => '<button class="bs-tab ' + (t === RK.tab ? 'on' : '') + '" data-a="tab" data-t="' + t + '">' + n + '</button>').join('');
    const el = shell('Clasificaciones', tabs, '<div class="bs-left"><div class="bs-lab" style="text-align:left">Ordenar por</div><div id="bs-crit" style="display:flex;flex-direction:column;gap:9px"></div>'
      + '<button class="bs-btn go" data-a="refresh">🔄 Actualizar</button><div class="bs-note" id="bs-st"></div></div><div class="bs-right" id="bs-rk"></div>');
    el.addEventListener('click', ev => {
      const b = ev.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a; sfx('click');
      if (a === 'close') close();
      else if (a === 'tab') { RK.tab = b.dataset.t; draw(); }
      else if (a === 'crit') { RK.crit[RK.tab] = b.dataset.c; draw(); }
      else if (a === 'refresh') { RK.cache = {}; draw(); }
    });
    draw();
  }

  // =====================================================================================================================
  //  ORDEN DE INGREDIENTES (todas las áreas y sus tres pantallas: Producción, Cocina y Emplatado)
  // =====================================================================================================================
  const OD = { area: 'ramen', stage: 'cook', sel: null };
  const AREAS = [['ramen', '🍜', 'Ramen'], ['salteados', '🍳', 'Salteados'], ['makis', '🍣', 'Makis'], ['frituras', '🍤', 'Frituras']];
  const CAT_PRI = { bases: 1, salsas: 2, proteinas: 3, vegetales: 4 };
  const ingById = id => INGREDIENTES.find(i => i.id === id);
  function artOf(area, ing) { let m = null; try { m = ING_CTX_ART[area]; } catch (e) {} return (m && m[ing.id]) || ing.img || null; }
  /** Lo que se puede ordenar en cada pantalla: [{ k: clave, name, html (icono), cat }] ya en el orden guardado (o el de siempre). */
  function items(area, stage) {
    let out = [];
    try {
      if (stage === 'prod') {
        out = ST_PROD[area].filter(p => !p.virtual).map(p => ({ k: p.key, name: p.short || p.label, html: stIngIconRaw(p.icon), cat: 0 }));
      } else {
        const ids = new Set(), recs = getRecetasByArea(area);
        recs.forEach(r => {
          const parts = new Set(stParts(area, r));
          if (stage === 'plate') parts.forEach(id => ids.add(id));
          else ((area === 'salteados' && SAL_STAGED[r.name]) ? salCookIds(r.name) : r.ingredients.filter(id => !parts.has(id))).forEach(id => ids.add(id));
        });
        let list = INGREDIENTES.filter(i => ids.has(i.id));
        if (stage === 'cook') {
          if (area === 'ramen') list = list.filter(i => !TOOL_SAUCE_IDS.includes(i.id));
          if (area === 'salteados') list = list.filter(i => !WOK_SAUCE_IDS.includes(i.id));
          if (area === 'frituras') list = list.filter(i => !FRY_BREADING_IDS.includes(i.id) && (FRY_PROTEIN_IDS.includes(i.id) || i.id === 83));
        } else {
          const order = ST_GROUPS[area];
          list.sort((a, b) => order.indexOf(stGroupOf(area, a.id)) - order.indexOf(stGroupOf(area, b.id)) || a.id - b.id);
        }
        out = list.map(i => { const src = artOf(area, i); return { k: i.id, name: i.short || i.display, html: src ? '<img src="' + src + '" alt="">' : '<span class="e">' + esc(i.icon) + '</span>', cat: stage === 'plate' ? stGroupOf(area, i.id) : (i.cat || '') }; });
      }
    } catch (e) { try { console.warn('[Orden]', area, stage, e); } catch (er) {} }
    return sortByOrder(out, getIngOrderFor(area, stage), x => x.k);
  }
  function saveOrder(area, stage, keys) {
    let o = {}; try { o = JSON.parse(store.get('ramen_ing_order_v2') || '{}') || {}; } catch (e) {}
    o[area + ':' + stage] = keys; store.set('ramen_ing_order_v2', JSON.stringify(o));
    try { if (typeof renderPantryGrid === 'function' && document.getElementById('ingredients-grid')) renderPantryGrid(); } catch (e) {}
  }
  function stageDefs(area) {
    const ck = (typeof AREA_COOK_STAGE !== 'undefined' && AREA_COOK_STAGE[area]) || { icon: '🍳', label: 'Cocina' };
    return [['prod', '🥬', 'Producción'], ['cook', ck.icon, ck.label], ['plate', '🍽️', 'Emplatado']];
  }
  function ordenar() {
    OD.sel = null;
    const el = shell('Orden de ingredientes', '', '<div class="bs-areas" id="od-areas"></div><div class="bs-ord"><div class="bs-subs" id="od-subs"></div>'
      + '<div class="bs-hint" id="od-hint"></div><div class="bs-grid" id="od-grid"></div><div class="bs-acts"><button class="bs-btn" data-a="group">🔀 Agrupar</button><button class="bs-btn" data-a="reset">↺ Orden original</button></div></div>');
    el.addEventListener('click', ev => {
      const b = ev.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') close();
      else if (a === 'area') { OD.area = b.dataset.v; OD.sel = null; sfx('click'); odDraw(); }
      else if (a === 'stage') { OD.stage = b.dataset.v; OD.sel = null; sfx('click'); odDraw(); }
      else if (a === 'group') { odGroup(); }
      else if (a === 'reset') { saveOrder(OD.area, OD.stage, []); OD.sel = null; sfx('click'); toast('↺ Orden original'); odDraw(); }
    });
    odDraw();
  }
  function odDraw() {
    $('od-areas').innerHTML = AREAS.map(([k, ic, n]) => '<button class="bs-btn ' + (k === OD.area ? 'on' : '') + '" data-a="area" data-v="' + k + '"><span>' + ic + '</span>' + n + '</button>').join('');
    $('od-subs').innerHTML = stageDefs(OD.area).map(([k, ic, n]) => '<button class="bs-btn ' + (k === OD.stage ? 'on' : '') + '" data-a="stage" data-v="' + k + '">' + ic + ' ' + n + '</button>').join('');
    const list = items(OD.area, OD.stage), g = $('od-grid');
    $('od-hint').textContent = list.length ? 'Arrastra para moverlo, o toca uno y luego otro para cambiarlos de lugar. Se guarda solo.' : 'Esta pantalla no tiene ingredientes que ordenar.';
    g.innerHTML = list.map((x, i) => '<div class="bs-tile" data-k="' + esc(x.k) + '"><i>' + (i + 1) + '</i>' + x.html + '<em>' + esc(x.name) + '</em></div>').join('');
    g.querySelectorAll('.bs-tile').forEach(t => tileInput(t, g));
  }
  function numbers(g) { g.querySelectorAll('.bs-tile').forEach((t, i) => { t.firstElementChild.textContent = i + 1; }); }
  function persist(g) { saveOrder(OD.area, OD.stage, [...g.querySelectorAll('.bs-tile')].map(t => t.dataset.k)); }
  function odGroup() {
    const list = items(OD.area, OD.stage);
    if (OD.stage === 'prod') { toast('Producción ya viene agrupada por su tarea'); return; }
    const gro = OD.stage === 'plate' ? ST_GROUPS[OD.area] : null;
    list.sort((a, b) => OD.stage === 'plate' ? gro.indexOf(a.cat) - gro.indexOf(b.cat) : ((CAT_PRI[a.cat] || 99) - (CAT_PRI[b.cat] || 99)));
    saveOrder(OD.area, OD.stage, list.map(x => x.k)); sfx('click'); toast('🔀 Agrupado por tipo'); odDraw();
  }
  /** Mover o cambiar de lugar una ficha: arrastrando (el resto se acomoda en vivo) o tocando una y luego otra (se intercambian). */
  function tileInput(tile, grid) {
    let down = null, proxy = null, moved = false, offX = 0, offY = 0;
    tile.addEventListener('pointerdown', ev => {
      if (ev.button > 0) return;
      down = { x: ev.clientX, y: ev.clientY, id: ev.pointerId }; moved = false;
      const r = tile.getBoundingClientRect(); offX = ev.clientX - r.left; offY = ev.clientY - r.top;
      try { tile.setPointerCapture(ev.pointerId); } catch (e) {}
    });
    tile.addEventListener('pointermove', ev => {
      if (!down || ev.pointerId !== down.id) return;
      if (!moved && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 4) {
        moved = true; tile.classList.add('drag');
        const r = tile.getBoundingClientRect(); proxy = tile.cloneNode(true); proxy.className = 'bs-tile bs-proxy'; proxy.style.width = r.width + 'px'; proxy.style.height = r.height + 'px'; document.body.appendChild(proxy); sfx('add');
      }
      if (!moved) return;
      proxy.style.left = (ev.clientX - offX) + 'px'; proxy.style.top = (ev.clientY - offY) + 'px';
      proxy.style.display = 'none'; const under = document.elementFromPoint(ev.clientX, ev.clientY); proxy.style.display = '';
      const over = under && under.closest ? under.closest('.bs-tile:not(.bs-proxy)') : null;
      if (over && over !== tile && over.parentElement === grid) {
        const kids = [...grid.children];
        if (kids.indexOf(tile) < kids.indexOf(over)) grid.insertBefore(tile, over.nextSibling); else grid.insertBefore(tile, over);
        numbers(grid); sfx('click');
      }
    });
    const up = ev => {
      if (!down || (ev && ev.pointerId !== down.id)) return;
      down = null;
      if (moved) { if (proxy) proxy.remove(); proxy = null; tile.classList.remove('drag'); numbers(grid); persist(grid); sfx('ding'); toast('✅ Guardado'); return; }
      const other = OD.sel;
      if (!other) { OD.sel = tile; tile.classList.add('sel'); sfx('click'); }
      else if (other === tile) { tile.classList.remove('sel'); OD.sel = null; sfx('click'); }
      else {
        const a = other, b = tile, na = a.nextSibling, nb = b.nextSibling;
        if (na === b) grid.insertBefore(b, a); else if (nb === a) grid.insertBefore(a, b); else { grid.insertBefore(a, nb); grid.insertBefore(b, na); }
        a.classList.remove('sel'); OD.sel = null; numbers(grid); persist(grid); sfx('ding'); toast('✅ Guardado');
      }
    };
    tile.addEventListener('pointerup', up);
    tile.addEventListener('pointercancel', () => { if (proxy) proxy.remove(); proxy = null; tile.classList.remove('drag'); down = null; });
    tile.addEventListener('contextmenu', e => e.preventDefault());
  }

  window.Bs = { ajustes, clasificaciones, ordenar, close, items, _state: () => ({ RK, OD }) };
  // los nombres de siempre: los llaman la pantalla de fin de partida, los atajos de teclado y los menús
  window.openLeaderboardModal = clasificaciones;
  window.closeLeaderboardModal = () => close();
  window.openIngredientOrderModal = ordenar;
  window.closeIngredientOrderModal = () => close();
  window.switchLeaderboardTab = t => { RK.tab = t; if ($('bs-rk')) draw(); };
  window.loadLeaderboard = () => { RK.cache = {}; if ($('bs-rk')) draw(); };
})();
