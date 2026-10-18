/* Secretos del Chef: un solo apartado para todo lo que se compra con propinas.
   · PASIVAS · MEJORAS  – las 10 mejoras de la cocina (varios niveles); se activan al comprarlas.
   · PASIVAS · SECRETOS – los secretos del chef (platos, ingredientes, cuchillos y herramientas): dan un pequeño bono permanente al comprarlos.
   · ACTIVAS            – técnicas que se usan durante el servicio (tienen enfriamiento). Solo se pueden llevar 3 a la vez; se equipan desde el Perfil (o aquí).
     Cuanto más poderosa es la técnica y su nivel, más cuesta.
   Todo se paga con propinas. Script clásico. Las compras de este módulo se guardan en el aparato (ramen_taller_v1) y viajan con el progreso de la cuenta (japon.js → snapshot). */
(function () {
  'use strict';
  const KEY = 'ramen_taller_v1', MAX_EQ = 3;
  const $ = id => document.getElementById(id);
  const sfx = n => { try { playSound(n); } catch (e) {} };
  const toast = m => { try { showStationToast(m); } catch (e) {} };
  const wallet = () => { try { return getPropinasWallet(); } catch (e) { return 0; } };
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  // ---------- catálogo: TÉCNICAS ACTIVAS (cada una con 3 niveles; el precio crece con el poder) ----------
  const ACTIVAS = [
    { id: 'te', ic: '🍵', name: 'Té del Maestro', tag: 'Calma', lv: [{ v: 25, cd: 60, price: 70 }, { v: 40, cd: 50, price: 140 }, { v: 60, cd: 45, price: 260 }],
      text: l => 'Todos los clientes recuperan ' + l.v + ' % de paciencia.' },
    { id: 'cortesia', ic: '🤝', name: 'Cortesía de la casa', tag: 'Rescate', lv: [{ v: 70, n: 1, cd: 45, price: 60 }, { v: 100, n: 1, cd: 40, price: 120 }, { v: 100, n: 2, cd: 35, price: 230 }],
      text: l => 'Salva a ' + (l.n > 1 ? 'los ' + l.n + ' clientes más impacientes' : 'el cliente más impaciente') + ': su paciencia sube al ' + l.v + ' %.' },
    { id: 'pausa', ic: '⏳', name: 'Pausa del Maestro', tag: 'Tiempo', lv: [{ v: 5, cd: 70, price: 90 }, { v: 8, cd: 60, price: 170 }, { v: 12, cd: 55, price: 300 }],
      text: l => 'La paciencia de todos los clientes se detiene ' + l.v + ' segundos.' },
    { id: 'tiempo', ic: '⏱️', name: 'Tiempo extra', tag: 'Reloj', lv: [{ v: 6, uses: 1, cd: 30, price: 100 }, { v: 10, uses: 1, cd: 30, price: 190 }, { v: 15, uses: 2, cd: 30, price: 340 }],
      text: l => 'Suma ' + l.v + ' s al reloj (' + l.uses + (l.uses > 1 ? ' veces' : ' vez') + ' por servicio). Solo en niveles con reloj.' },
    { id: 'propina', ic: '💰', name: 'Propina de la casa', tag: 'Propinas', lv: [{ v: 2, cd: 80, price: 80 }, { v: 3, cd: 70, price: 150 }, { v: 4, cd: 60, price: 270 }],
      text: l => 'Las próximas ' + l.v + ' propinas que den los clientes valen el doble.' },
    { id: 'toque', ic: '✨', name: 'Toque perfecto', tag: 'Calidad', lv: [{ v: 15, cd: 75, price: 110 }, { v: 25, cd: 65, price: 210 }, { v: 35, cd: 55, price: 380 }],
      text: l => 'El próximo plato que sirvas sale con +' + l.v + ' puntos de calidad (no rescata platos quemados o crudos).' }
  ];
  const ACT = Object.fromEntries(ACTIVAS.map(a => [a.id, a]));

  // ---------- catálogo: SECRETOS (pasivos) ----------
  const DISH_OF = { ramen_shio: 'Shio', ramen_shoyu: 'Shoyu', ramen_miso: 'Miso', ramen_tonkotsu: 'Tonkotsu', ramen_chashu: 'Chashu', ramen_ebi: 'Ebi', ramen_tantan: 'Tan tan', ramen_vegetariano: 'Vegetariano', ramen_bajiru: 'Bajiru' };
  function secretos() {
    const list = (typeof CHEF_SECRETS !== 'undefined' ? CHEF_SECRETS : []);
    return list.map(s => {
      let price, text, kind;
      if (s.category === 'ramen') { const d = DISH_OF[s.id], r = (typeof RECETAS_RAMEN !== 'undefined' ? RECETAS_RAMEN : []).find(x => x.name === d); price = Math.round(((r && r.price) || 40) * 1.2); kind = 'plato'; text = 'Maestría: +3 puntos de calidad al servir ' + (d || 'este ramen') + '.'; }
      else if (s.category === 'cuchillos') { price = 50; kind = 'cuchillo'; text = 'El corte es 0,1 s más rápido (suma con cada cuchillo; mínimo 1 s).'; }
      else { price = s.category === 'herramientas' ? 40 : 30; kind = 'tip'; text = 'Las propinas aumentan +1 % (suma con cada secreto).'; }
      return { id: s.id, ic: s.icon, name: s.name, sub: s.subtitle, cat: s.category, price, text, kind, dish: DISH_OF[s.id] };
    });
  }

  // ---------- estado ----------
  let S = null;
  const load = () => { if (S) return S; try { S = JSON.parse(store.get(KEY) || 'null'); } catch (e) { S = null; } if (!S || S.v !== 1) S = { v: 1, act: {}, sab: {}, eq: [] }; return S; };
  const persist = () => store.set(KEY, JSON.stringify(S));
  const save = () => { persist(); try { if (typeof japonSyncSoon === 'function') japonSyncSoon(); } catch (e) {} };
  const lvlOf = id => { load(); return S.act[id] || 0; };
  const owned = id => lvlOf(id) > 0;
  const sabOwned = id => { load(); return !!S.sab[id]; };
  function spent() { load(); let t = 0; Object.keys(S.act).forEach(id => { const a = ACT[id]; if (a) for (let i = 0; i < (S.act[id] || 0) && i < a.lv.length; i++) t += a.lv[i].price; }); const sl = secretos(); Object.keys(S.sab).forEach(id => { const x = sl.find(y => y.id === id); if (x) t += x.price; }); return t; }
  const eqList = () => { load(); return S.eq.filter(id => owned(id)).slice(0, MAX_EQ); };

  // ---------- compras ----------
  function afterBuy() { try { updatePropinasHUD(); } catch (e) {} sfx('serve'); save(); render(); try { if (window.Home) Home.refresh(); } catch (e) {} }
  function buyActive(id) {
    const a = ACT[id]; if (!a) return; load(); const l = S.act[id] || 0;
    if (l >= a.lv.length) return; const price = a.lv[l].price;
    if (wallet() < price) { toast('🧧 Te faltan ' + (price - wallet()) + ' propinas para ' + a.name + '.'); sfx('error'); return; }
    S.act[id] = l + 1; if (!l && S.eq.filter(x => owned(x)).length < MAX_EQ && !S.eq.includes(id)) S.eq.push(id);    // la primera técnica nueva se equipa sola si hay lugar
    afterBuy(); toast((l ? '⬆️ ' : '✅ ') + a.name + ' · nivel ' + (l + 1));
  }
  function buySecret(id) {
    const x = secretos().find(y => y.id === id); if (!x || sabOwned(id)) return;
    if (wallet() < x.price) { toast('🧧 Te faltan ' + (x.price - wallet()) + ' propinas para este secreto.'); sfx('error'); return; }
    load(); S.sab[id] = 1; afterBuy(); toast('🗝️ Secreto desbloqueado: ' + x.name);
  }
  function buyUp(id) { const lv0 = (typeof getUpgradeLevel === 'function') ? getUpgradeLevel(id) : 0; try { buyUpgrade(id); } catch (e) { return; } if ((typeof getUpgradeLevel === 'function' ? getUpgradeLevel(id) : 0) > lv0) { save(); render(); try { if (window.Home) Home.refresh(); } catch (e) {} } else render(); }
  function equip(id) {
    load(); if (!owned(id)) return;
    if (S.eq.includes(id)) S.eq = S.eq.filter(x => x !== id);
    else { if (eqList().length >= MAX_EQ) { toast('Ya llevas ' + MAX_EQ + ' técnicas: quita una para equipar otra.'); sfx('error'); return; } S.eq.push(id); }
    sfx('click'); save(); render(); renderProfile();
  }

  // ---------- efectos en la partida ----------
  const rt = { cd: {}, used: {} };
  const inGame = () => { try { return gameState && !gameState.isGameOver && !isTraining() && !isMultiplayerSession(); } catch (e) { return false; } };
  const hasClock = () => { try { return gameState.gameMode === 'NORMAL' || (gameState.gameMode === 'JAPON' && gameState.japon); } catch (e) { return false; } };
  function use(slot) {
    const id = eqList()[slot], a = ACT[id]; if (!a || !inGame() || gameState.isPaused) return;
    const l = a.lv[lvlOf(id) - 1];
    if ((rt.cd[id] || 0) > 0) { sfx('error'); return; }
    const cus = (gameState.customerSlots || []).filter(Boolean);
    if (id === 'te') { if (!cus.length) return toast('🍵 No hay clientes esperando.'); cus.forEach(c => { c.patience = Math.min(c.maxPatience, c.patience + c.maxPatience * l.v / 100); }); }
    else if (id === 'cortesia') { if (!cus.length) return toast('🤝 No hay clientes esperando.'); cus.slice().sort((x, y) => x.patience / x.maxPatience - y.patience / y.maxPatience).slice(0, l.n).forEach(c => { c.patience = Math.max(c.patience, c.maxPatience * l.v / 100); }); }
    else if (id === 'pausa') { gameState.tllFreeze = l.v; }
    else if (id === 'tiempo') { if (!hasClock()) return toast('⏱️ Este modo no tiene reloj.'); if ((rt.used[id] || 0) >= l.uses) return toast('⏱️ Ya usaste el tiempo extra de este servicio.'); rt.used[id] = (rt.used[id] || 0) + 1; gameState.timeLeft += l.v; }
    else if (id === 'propina') { gameState.tllTips = Math.max(gameState.tllTips || 0, l.v); }
    else if (id === 'toque') { gameState.tllPerfect = l.v; }
    rt.cd[id] = l.cd; sfx('serve'); toast(a.ic + ' ' + a.name + '!');
    try { renderCustomers(); } catch (e) {} hud();
  }
  function tick() {
    if (gameState.tllFreeze > 0) gameState.tllFreeze--;
    Object.keys(rt.cd).forEach(k => { if (rt.cd[k] > 0) rt.cd[k]--; });
    hud(true);
  }
  function resetRun() { rt.cd = {}; rt.used = {}; eqList().forEach(id => { rt.cd[id] = 12; }); try { gameState.tllFreeze = 0; gameState.tllTips = 0; gameState.tllPerfect = 0; } catch (e) {} }
  function hud(light) {
    const gc = $('game-container'); if (!gc) return;
    let h = $('tll-hud');
    const ids = eqList(), show = inGame() && ids.length;
    if (!show) { if (h) h.style.display = 'none'; return; }
    if (!h) { h = document.createElement('div'); h.id = 'tll-hud'; gc.appendChild(h); h.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) use(+b.dataset.i); }); }
    h.style.display = 'flex';
    const sig = ids.join(',');
    if (h.dataset.sig !== sig) { h.dataset.sig = sig; h.innerHTML = ids.map((id, i) => '<button data-i="' + i + '" title="' + ACT[id].name + '"><span>' + ACT[id].ic + '</span><i></i></button>').join(''); }
    h.querySelectorAll('button').forEach((b, i) => { const id = ids[i], cd = rt.cd[id] || 0; b.classList.toggle('rd', cd <= 0); b.querySelector('i').textContent = cd > 0 ? cd : ''; });
  }
  // ganchos del juego (enchufados en js/22, js/25 y js/21)
  const API = {
    frozen: () => (gameState.tllFreeze || 0) > 0,
    tick,
    tipMult() { load(); let m = 1; m += 0.01 * secretos().filter(x => x.kind === 'tip' && S.sab[x.id]).length; if ((gameState.tllTips || 0) > 0) { gameState.tllTips--; m *= 2; } return m; },
    cutBonus() { load(); return Math.min(0.5, 0.1 * secretos().filter(x => x.kind === 'cuchillo' && S.sab[x.id]).length); },
    scoreBonus(dish) { let b = 0; try { load(); const n = dish && dish.recipe && dish.recipe.name; if (n) { const x = secretos().find(y => y.kind === 'plato' && y.dish === n); if (x && S.sab[x.id]) b += 3; } } catch (e) {} if ((gameState.tllPerfect || 0) > 0) b += gameState.tllPerfect; return b; }
  };

  // ---------- pantalla ----------
  const CSS = `
  #tll { position: fixed; inset: 0; z-index: 9100; display: flex; flex-direction: column; background: radial-gradient(circle at 50% 0%, #4a2a14 0%, #1d0e08 70%); color: #fff3d6; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; overflow: hidden;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
  #tll * { box-sizing: border-box; }
  .tl-top { display: flex; align-items: center; gap: 8px; padding: 6px 12px 4px; flex-shrink: 0; }
  .tl-back { flex: none; width: 40px; height: 34px; border: 2px solid #8a5a00; border-radius: 10px; background: linear-gradient(#ffe082, #ffb300); color: #3b2208; font: 900 16px/1 'Fredoka', sans-serif; box-shadow: 0 2px 0 #8a5a00; cursor: pointer; }
  .tl-top h2 { margin: 0; font: 400 19px 'Fredoka One', 'Fredoka', sans-serif; color: #ffd978; text-shadow: 0 2px 0 rgba(0,0,0,.5); flex: 1; white-space: nowrap; }
  .tl-chip { background: rgba(0,0,0,.4); border: 1.5px solid rgba(255,204,80,.45); border-radius: 14px; padding: 3px 10px; font: 900 13px/1.2 'Fredoka', sans-serif; color: #ffe9b0; white-space: nowrap; }
  .tl-tabs { display: flex; gap: 6px; padding: 2px 12px 4px; overflow-x: auto; flex-shrink: 0; scrollbar-width: none; } .tl-tabs::-webkit-scrollbar { display: none; }
  .tl-tab { flex: none; border: 2px solid rgba(255,255,255,.18); background: rgba(0,0,0,.35); color: #e9d5b0; border-radius: 12px; padding: 5px 12px; font: 800 12px/1 'Fredoka', sans-serif; cursor: pointer; }
  .tl-ti { width: 22px; height: 22px; vertical-align: -6px; margin-right: 2px; object-fit: contain; }
  .tl-tab.on { background: linear-gradient(#ffd54f, #ffa000); border-color: #fff3d0; color: #2b1a08; box-shadow: 0 2px 0 #8a5a00; }
  .tl-note { padding: 0 14px 4px; font: 700 11px/1.3 'Fredoka', sans-serif; color: #c9a77e; flex-shrink: 0; }
  .tl-eq { display: flex; align-items: center; gap: 8px; padding: 2px 12px 6px; flex-shrink: 0; } .tl-eq b { font: 900 11px 'Fredoka', sans-serif; color: #ffd978; }
  .tl-slot { width: 42px; height: 42px; border-radius: 12px; border: 2px dashed rgba(255,255,255,.3); background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; font-size: 22px; } .tl-slot.on { border: 2px solid #ffb300; background: rgba(255,179,0,.18); }
  .tl-grid { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; padding: 4px 12px 14px; align-content: start; -webkit-overflow-scrolling: touch; }
  .tl-card { position: relative; border: 2.5px solid #1a0e07; border-radius: 12px; background: linear-gradient(#5a3a20, #2e1a0e); padding: 8px 10px 9px; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 3px 0 rgba(0,0,0,.5); }
  .tl-card.maxed { border-color: #43a047; } .tl-card.eq { border-color: #ffb300; box-shadow: 0 0 0 2px rgba(255,179,0,.35), 0 3px 0 rgba(0,0,0,.5); }
  .tl-h { display: flex; align-items: center; gap: 8px; } .tl-ic { flex: none; width: 38px; height: 38px; border-radius: 10px; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .tl-h b { display: block; font: 900 13px/1.1 'Fredoka', sans-serif; color: #fff3d6; } .tl-h small { display: block; font: 700 10px 'Fredoka', sans-serif; color: #c9a77e; }
  .tl-tag { margin-left: auto; font: 900 9px 'Fredoka', sans-serif; background: rgba(255,255,255,.12); border-radius: 6px; padding: 2px 6px; color: #ffe082; white-space: nowrap; }
  .tl-pips { display: flex; gap: 3px; } .tl-pips i { width: 14px; height: 6px; border-radius: 3px; background: rgba(255,255,255,.18); } .tl-pips i.on { background: #ffb300; }
  .tl-fx { font: 700 11.5px/1.3 'Fredoka', sans-serif; color: #e9d5b0; } .tl-fx.nx { color: #9fd49f; }
  .tl-meta { font: 800 10px 'Fredoka', sans-serif; color: #a98c68; }
  .tl-card.jp { border-color: #ad1457; background: linear-gradient(#5a2a40, #2e1220); }
  .tl-tag.jp { background: #ec407a; color: #fff; }
  .tl-jpp { font: 800 12px/1.3 'Fredoka', sans-serif; color: #ffd978; } .tl-jpp small { font: 700 10px 'Fredoka', sans-serif; color: #e6b8c8; }
  .tl-lvls { display: flex; flex-direction: column; gap: 2px; background: rgba(0,0,0,.28); border-radius: 8px; padding: 4px 7px; }
  .tl-lvls div { display: flex; align-items: baseline; gap: 6px; font: 700 10.5px/1.25 'Fredoka', sans-serif; color: #e9d5b0; } .tl-lvls span { flex: 1; min-width: 0; } .tl-lvls b { color: #ffd978; font-weight: 900; white-space: nowrap; } .tl-lvls em { font-style: normal; color: #e6b8c8; white-space: nowrap; font-size: 9.5px; }
  .tl-req { font: 700 10.5px/1.3 'Fredoka', sans-serif; color: #f4b6c8; }
  .tl-btns { display: flex; gap: 6px; margin-top: 2px; flex-wrap: wrap; }
  .tl-buy { flex: 1; min-width: 96px; border: 2px solid #ffe082; border-radius: 10px; padding: 6px 8px; background: linear-gradient(135deg, #ff9800, #e64a19 65%, #c62828); color: #fff; font: 900 12px/1 'Fredoka', sans-serif; box-shadow: 0 3px 0 #7f0000; cursor: pointer; }
  .tl-buy[data-poor] { filter: grayscale(.6) brightness(.8); } .tl-buy:disabled { background: #2e7d32; border-color: #a5d6a7; box-shadow: none; cursor: default; }
  .tl-buy.ghost { background: rgba(255,255,255,.1); border-color: rgba(255,224,130,.5); color: #ffe082; box-shadow: 0 3px 0 rgba(0,0,0,.35); flex: none; }
  /* pestaña APARIENCIA: el chef a la izquierda y las piezas a la derecha */
  /* botones de técnicas en la partida: a la derecha de la fila de clientes */
  #tll-hud { position: absolute; right: 52px; top: 48px; z-index: 40; display: none; gap: 6px; }
  #tll-hud button { position: relative; width: 46px; height: 46px; border-radius: 50%; border: 3px solid #1a0e07; background: radial-gradient(circle at 35% 30%, #6b4426, #2b180c); color: #fff; font-size: 22px; line-height: 1; cursor: pointer; box-shadow: 0 3px 0 rgba(0,0,0,.55); padding: 0; opacity: .6; }
  #tll-hud button.rd { opacity: 1; border-color: #ffb300; box-shadow: 0 0 10px rgba(255,179,0,.7), 0 3px 0 rgba(0,0,0,.55); animation: tllPulse 1.4s ease-in-out infinite; }
  #tll-hud button i { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 900 17px 'Fredoka', sans-serif; font-style: normal; background: rgba(0,0,0,.55); border-radius: 50%; } #tll-hud button i:empty { display: none; }
  @keyframes tllPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.07); } }
  .prof-skills { margin-top: 12px; padding: 10px; background: #fff3e0; border-radius: 10px; border: 2px solid #ffb300; }
  .prof-skills h4 { margin: 0 0 6px; font: 900 13px 'Fredoka', sans-serif; color: #b71c1c; } .prof-skills p { margin: 0 0 6px; font: 700 11px/1.3 sans-serif; color: #6d4c41; }
  .prof-sk-row { display: flex; gap: 8px; flex-wrap: wrap; } .prof-sk { flex: 1 1 110px; min-width: 100px; border: 2px dashed #bf9b6b; border-radius: 10px; padding: 6px; text-align: center; background: #fff; cursor: pointer; font: 800 11px/1.2 sans-serif; color: #3e2723; } .prof-sk.on { border: 2px solid #ffb300; background: #fff8e1; }
  .prof-sk span { display: block; font-size: 24px; } .prof-sk small { display: block; font-size: 10px; color: #8d6e63; font-weight: 700; }
  .prof-sk-list { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; } .prof-sk-list button { border: 2px solid #ffb300; background: #fff; border-radius: 9px; padding: 4px 8px; font: 800 11px sans-serif; cursor: pointer; color: #3e2723; } .prof-sk-list button.on { background: #ffb300; }
  @media (prefers-reduced-motion: reduce) { #tll-hud button.rd { animation: none; } }
  `;
  function css() { if ($('tll-css')) return; const s = document.createElement('style'); s.id = 'tll-css'; s.textContent = CSS; document.head.appendChild(s); }
  let tab = 'mejoras';
  const pips = (n, max) => '<div class="tl-pips">' + Array.from({ length: max }, (_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</div>';

  function cardsMejoras() {
    const w = wallet();
    return (typeof UPGRADES !== 'undefined' ? UPGRADES : []).map(u => {
      const lv = getUpgradeLevel(u.id), max = u.costs.length, maxed = lv >= max, cost = maxed ? 0 : u.costs[lv];
      return '<div class="tl-card ' + (maxed ? 'maxed' : '') + '"><div class="tl-h"><div class="tl-ic">' + u.icon + '</div><div><b>' + u.name + '</b><small>' + u.where + '</small></div><span class="tl-tag">PASIVA</span></div>'
        + pips(lv, max) + (lv ? '<div class="tl-fx">✔ ' + u.effect[lv - 1] + '</div>' : '') + (maxed ? '' : '<div class="tl-fx nx">Siguiente: ' + u.effect[lv] + '</div>')
        + '<div class="tl-btns"><button class="tl-buy" ' + (maxed ? 'disabled' : (w >= cost ? '' : 'data-poor="1"')) + ' onclick="Taller.buyUp(\'' + u.id + '\')">' + (maxed ? '✔ Completa' : '🧧 ' + cost + ' · ' + (lv ? 'Mejorar' : 'Comprar')) + '</button></div></div>';
    }).join('');
  }
  function cardsSecretos() {
    const w = wallet();
    return secretos().map(x => { const own = sabOwned(x.id);
      return '<div class="tl-card ' + (own ? 'maxed' : '') + '"><div class="tl-h"><div class="tl-ic">' + x.ic + '</div><div><b>' + x.name + '</b><small>' + (x.sub || '') + '</small></div><span class="tl-tag">PASIVA</span></div>'
        + '<div class="tl-fx ' + (own ? '' : 'nx') + '">' + (own ? '✔ ' : '') + x.text + '</div>'
        + '<div class="tl-btns">' + (own ? '<button class="tl-buy" disabled>✔ Desbloqueado</button>'
          : '<button class="tl-buy" ' + (w >= x.price ? '' : 'data-poor="1"') + ' onclick="Taller.buySecret(\'' + x.id + '\')">🧧 ' + x.price + ' · Desbloquear</button>') + '</div></div>'; }).join('');
  }
  function cardsActivas() {
    const w = wallet(), eq = eqList();
    return ACTIVAS.map(a => { const lv = lvlOf(a.id), max = a.lv.length, maxed = lv >= max, cur = lv ? a.lv[lv - 1] : null, nx = maxed ? null : a.lv[lv], on = eq.includes(a.id);
      return '<div class="tl-card ' + (maxed ? 'maxed' : '') + (on ? ' eq' : '') + '"><div class="tl-h"><div class="tl-ic">' + a.ic + '</div><div><b>' + a.name + '</b><small>' + a.tag + (cur ? ' · enfriamiento ' + cur.cd + ' s' : '') + '</small></div><span class="tl-tag">ACTIVA</span></div>'
        + pips(lv, max) + (cur ? '<div class="tl-fx">✔ ' + a.text(cur) + '</div>' : '') + (nx ? '<div class="tl-fx nx">' + (lv ? 'Siguiente: ' : '') + a.text(nx) + '</div>' : '')
        + '<div class="tl-btns"><button class="tl-buy" ' + (maxed ? 'disabled' : (w >= nx.price ? '' : 'data-poor="1"')) + ' onclick="Taller.buyActive(\'' + a.id + '\')">' + (maxed ? '✔ Nivel máximo' : '🧧 ' + nx.price + ' · ' + (lv ? 'Mejorar' : 'Comprar')) + '</button>'
        + (lv ? '<button class="tl-buy ghost" onclick="Taller.equip(\'' + a.id + '\')">' + (on ? 'Quitar' : 'Equipar') + '</button>' : '') + '</div></div>'; }).join('');
  }
  // ---------- pestaña JAPÓN: catálogo de referencia del Recorrido por Japón (se compra dentro de cada restaurante) ----------
  const SHOP_IC = '<svg viewBox="0 0 64 64" width="1em" height="1em" style="vertical-align:-.12em"><ellipse cx="32" cy="58" rx="26" ry="3.5" fill="rgba(0,0,0,.35)"/><rect x="7" y="30" width="50" height="26" rx="2" fill="#8a5a30" stroke="#2b1810" stroke-width="2.5"/><rect x="13" y="34" width="38" height="13" fill="#2a170c" stroke="#2b1810" stroke-width="2"/><circle cx="21" cy="42" r="4.2" fill="#ffd978" stroke="#2b1810" stroke-width="1.6"/><circle cx="32" cy="42" r="4.2" fill="#ef5350" stroke="#2b1810" stroke-width="1.6"/><circle cx="43" cy="42" r="4.2" fill="#8bc34a" stroke="#2b1810" stroke-width="1.6"/><rect x="10" y="46" width="44" height="9" rx="2" fill="#ffb300" stroke="#2b1810" stroke-width="2.2"/><path d="M5 12h54l3 17H2z" fill="#fff3d6" stroke="#2b1810" stroke-width="2.5" stroke-linejoin="round"/><path d="M5 12h9.3l-2.3 17H2zM23.6 12h9.3l-.8 17h-9.5zM42.2 12h9.3l3.5 17h-9.6z" fill="#c8372d"/><path d="M5 12h54l3 17H2z" fill="none" stroke="#2b1810" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  const money = n => Math.round(n).toLocaleString('es-PE');
  let jpSec = 'ciudades';
  const jpCat = () => { try { return window.JP && JP.catalog ? JP.catalog() : null; } catch (e) { console.warn('[Taller] catálogo Japón', e); return null; } };
  const jpFondo = () => { const c = jpCat(); return c ? c.fondo : 0; };
  function jpNote() {
    const c = jpCat(), sec = c && (c.sections.find(x => x.id === jpSec) || c.sections[0]);
    return '🗾 Solo modo Japón: se pagan con el Fondo 💴 dentro de cada restaurante, no con propinas. Precio de referencia = Tokio; la flecha → es el de Nagasaki (el más caro).' + (sec && sec.note ? ' ' + sec.note : '');
  }
  function jpChips() {
    const c = jpCat(); if (!c) return '';
    return '<div class="tl-tabs">' + c.sections.map(x => '<button class="tl-tab ' + (x.id === jpSec ? 'on' : '') + '" onclick="Taller.jpSec(\'' + x.id + '\')">' + x.ic + ' ' + x.name + '</button>').join('') + '</div>';
  }
  function cardJp(it) {
    const price = it.price != null ? '<div class="tl-jpp">💴 Referencia: <b>S/ ' + money(it.price) + '</b>' + (it.max && it.max > it.price ? ' <small>· hasta S/ ' + money(it.max) + ' en Nagasaki</small>' : '') + '</div>' : '';
    const lv = it.levels ? '<div class="tl-lvls">' + it.levels.map(l => '<div><span>' + l[0] + '</span><b>S/ ' + money(l[1]) + '</b>' + (l[2] > l[1] ? '<em>→ ' + money(l[2]) + '</em>' : '') + '</div>').join('') + '</div>' : '';
    return '<div class="tl-card jp ' + (it.own ? 'maxed' : '') + '"><div class="tl-h"><div class="tl-ic">' + it.ic + '</div><div><b>' + it.name + '</b><small>' + (it.sub || '') + '</small></div><span class="tl-tag jp">SOLO JAPÓN</span></div>'
      + (it.pips ? pips(it.pips.n, it.pips.max) + '<div class="tl-meta">Tu mejor local: nivel ' + it.pips.n + ' de ' + it.pips.max + '</div>' : '') + (it.fx ? '<div class="tl-fx">' + it.fx + '</div>' : '') + price + lv
      + '<div class="tl-req">🔒 ' + it.req + '</div>' + (it.have ? '<div class="tl-meta">📍 ' + it.have + '</div>' : '') + (it.own ? '<div class="tl-meta" style="color:#9fd49f">✔ Ya lo tienes</div>' : '') + '</div>';
  }
  function cardsJapon() {
    const c = jpCat(); if (!c) return '<div class="tl-note">El Recorrido por Japón aún no está disponible.</div>';
    const sec = c.sections.find(x => x.id === jpSec) || c.sections[0];
    return sec.items.map(cardJp).join('');
  }
  // ícono pequeño de una pestaña: la ilustración si existe y, si no, el emoji de siempre
  const ti = (id, fb) => (window.ArteUI && ArteUI.has('ic', id) ? '<img class="tl-ti" src="assets/ui/ui_' + id + '.webp" alt=""> ' : fb + ' ');
  function render() {
    let host = $('tll'); if (!host) { host = document.createElement('div'); host.id = 'tll'; document.body.appendChild(host); }
    const eq = eqList();
    const tabs = [['mejoras', ti('tienda_mejoras', '🛠️') + 'PASIVAS · MEJORAS'], ['secretos', ti('tienda_secretos', '🗝️') + 'PASIVAS · SECRETOS'], ['activas', ti('tienda_activas', '⚡') + 'ACTIVAS'], ['japon', ti('tienda_japon', '🗾') + 'JAPÓN']].map(([k, n]) => '<button class="tl-tab ' + (tab === k ? 'on' : '') + '" onclick="Taller.tab(\'' + k + '\')">' + n + '</button>').join('');
    const note = { mejoras: 'Pasivas: se activan solas al comprarlas.', secretos: 'Pasivas: cada secreto que compras da un pequeño bono permanente.', activas: 'Activas: úsalas durante el servicio con los botones redondos. Solo puedes llevar ' + MAX_EQ + ' a la vez (también se equipan desde tu Perfil). Más poder, más precio.', japon: jpNote() }[tab];
    const slots = tab === 'japon' ? jpChips() : tab === 'activas' ? '<div class="tl-eq"><b>EQUIPADAS</b>' + Array.from({ length: MAX_EQ }, (_, i) => '<div class="tl-slot ' + (eq[i] ? 'on' : '') + '" title="' + (eq[i] ? ACT[eq[i]].name : 'Vacía') + '">' + (eq[i] ? ACT[eq[i]].ic : '') + '</div>').join('') + '</div>' : '';
    host.innerHTML = '<div class="tl-top"><button class="tl-back" onclick="Taller.close()" aria-label="Volver">◀</button><h2>' + SHOP_IC + ' TIENDA DEL CHEF</h2>' + (tab === 'japon' ? '<span class="tl-chip" title="Fondo del Recorrido por Japón">💴 S/ ' + money(jpFondo()) + '</span><button class="tl-buy ghost" onclick="Taller.goJapon()">🗾 Ir al Recorrido</button>' : '') + '<span class="tl-chip">🧧 ' + wallet() + '</span></div><div class="tl-tabs">' + tabs + '</div>' + (note ? '<div class="tl-note">' + note + '</div>' : '') + slots
      + '<div class="tl-grid">' + (tab === 'mejoras' ? cardsMejoras() : tab === 'secretos' ? cardsSecretos() : tab === 'japon' ? cardsJapon() : cardsActivas()) + '</div>';
  }

  // ---------- perfil: equipar las técnicas activas ----------
  function renderProfile() {
    const modal = $('player-profile-modal'); if (!modal) return;
    const body = modal.querySelector('.modal-body'); if (!body) return;
    let box = $('prof-skills'); if (!box) { box = document.createElement('div'); box.id = 'prof-skills'; box.className = 'prof-skills'; body.appendChild(box); }
    css(); const eq = eqList(), have = ACTIVAS.filter(a => owned(a.id));
    box.innerHTML = '<h4>⚡ Técnicas activas (' + eq.length + '/' + MAX_EQ + ')</h4><p>Llevas hasta ' + MAX_EQ + ' a la vez; las usas en el servicio con los botones redondos.</p>'
      + '<div class="prof-sk-row">' + Array.from({ length: MAX_EQ }, (_, i) => eq[i] ? '<div class="prof-sk on" onclick="Taller.equip(\'' + eq[i] + '\')" title="Toca para quitarla"><span>' + ACT[eq[i]].ic + '</span>' + ACT[eq[i]].name + '<small>nivel ' + lvlOf(eq[i]) + '</small></div>' : '<div class="prof-sk" onclick="Taller.open(\'activas\')"><span>＋</span>Vacía<small>comprar o equipar</small></div>').join('') + '</div>'
      + (have.length ? '<div class="prof-sk-list">' + have.map(a => '<button class="' + (eq.includes(a.id) ? 'on' : '') + '" onclick="Taller.equip(\'' + a.id + '\')">' + a.ic + ' ' + a.name + '</button>').join('') + '</div>' : '<p style="margin-top:6px">Aún no tienes técnicas: <b style="cursor:pointer;color:#b71c1c" onclick="Taller.open(\'activas\')">cómpralas en Secretos del Chef</b>.</p>');
  }

  // ---------- nube (se guarda con el resto del progreso de la cuenta) ----------
  const snap = () => { load(); const o = { v: 1, act: S.act, sab: S.sab, eq: S.eq }; return o; };
  function mergeSnap(a, b) {
    if (!a || a.v !== 1) return b && b.v === 1 ? b : (a || null); if (!b || b.v !== 1) return a;
    const out = { v: 1, act: {}, sab: Object.assign({}, a.sab || {}, b.sab || {}), eq: [] };
    new Set([...Object.keys(a.act || {}), ...Object.keys(b.act || {})]).forEach(k => { if (ACT[k]) out.act[k] = Math.min(ACT[k].lv.length, Math.max((a.act || {})[k] || 0, (b.act || {})[k] || 0)); });
    out.eq = ((b.eq && b.eq.length) ? b.eq : (a.eq || [])).filter((id, i, arr) => out.act[id] > 0 && arr.indexOf(id) === i).slice(0, MAX_EQ);
    return out;
  }
  function apply(sn) { if (!sn || sn.v !== 1) return; load(); const m = mergeSnap(snap(), sn); if (!m) return; S = { v: 1, act: m.act, sab: m.sab, eq: m.eq }; persist(); try { if (window.Home) Home.refresh(); } catch (e) {} }
  const reset = () => { S = null; try { localStorage.removeItem(KEY); } catch (e) {} };
  function cheapest() { let c = null; const w = wallet(); const upd = p => { if (p != null && (c == null || p < c)) c = p; };
    try { UPGRADES.forEach(u => { const lv = getUpgradeLevel(u.id); if (lv < u.costs.length) upd(u.costs[lv]); }); } catch (e) {}
    ACTIVAS.forEach(a => { const lv = lvlOf(a.id); if (lv < a.lv.length) upd(a.lv[lv].price); }); secretos().forEach(x => { if (!sabOwned(x.id)) upd(x.price); }); return c; }

  window.Taller = Object.assign({
    open(t) { css(); if (t) tab = t; sfx('click'); try { accountPull(); } catch (e) {} render(); },
    /** Repinta la Tienda si está abierta. */
    refresh() { if ($('tll')) render(); },
    close() { const h = $('tll'); if (h) h.remove(); sfx('click'); try { if (window.Home) Home.refresh(); } catch (e) {} },
    tab(k) { tab = k; sfx('click'); render(); },
    jpSec(k) { jpSec = k; sfx('click'); render(); },
    goJapon() { sfx('click'); Taller.close(); setTimeout(() => { try { Inicio.act('door'); } catch (e) { try { japonOpen(); } catch (e2) {} } }, 60); },
    buyUp, buyActive, buySecret, equip, use, spent, snap, mergeSnap, apply, reset, cheapest, renderProfile,
    canBuyAny() { const c = cheapest(); return c != null && wallet() >= c; }
  }, API);

  // ---------- enganches ----------
  function wrap(name, fn) { const orig = window[name]; if (typeof orig !== 'function') return; window[name] = function () { return fn.call(this, orig, arguments); }; }
  wrap('startLevel', function (orig, args) { const r = orig.apply(this, args); try { resetRun(); hud(); } catch (e) {} return r; });
  wrap('openProfileModal', function (orig, args) { const r = orig.apply(this, args); try { renderProfile(); } catch (e) {} return r; });
  wrap('evaluateDish', function (orig, args) { const ev = orig.apply(this, args); try { const b = API.scoreBonus(args[0]); if (b && ev && typeof ev.score === 'number') { ev.rawScore = ev.score; ev.score = Math.min(100, ev.score + b); } } catch (e) {} return ev; });
  // las estadísticas guardan la calidad REAL del plato (sin los puntos de las técnicas), para no falsear la curva de aprendizaje
  wrap('statsRecordDish', function (orig, args) { const ev = args[1]; if (ev && ev.rawScore != null && ev.rawScore !== ev.score) { const ev2 = Object.assign({}, ev, { score: ev.rawScore }); return orig.call(this, args[0], ev2); } return orig.apply(this, args); });
  wrap('serveOrder', function (orig, args) {
    const c = gameState.customerSlots[args[0]], o = c && c.orders && c.orders[args[1]], had = o && !o.served;
    const r = orig.apply(this, args);
    try { if (had && o.served && (gameState.tllPerfect || 0) > 0) gameState.tllPerfect = 0; } catch (e) {}      // el Toque perfecto se gasta con el plato servido
    return r;
  });
})();
