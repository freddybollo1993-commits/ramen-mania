/* Mapa de la Campaña y presentación del Maestro (Campaña 2.0, fase 2) - v1
   - Mapa: camino de linternas con los 20 niveles agrupados en 5 arcos (puertas torii entre arcos), estrellas colgadas de cada nivel,
     examen de arco destacado (niveles 4, 8, 12, 16 y 20), el Maestro parado en tu nivel actual y una ficha con el detalle del nivel.
   - Presentación: la primera vez que se juega un nivel que presenta algo nuevo (cfg.brief.card en NIVEL_EXTRA) el Maestro lo explica antes de
     empezar, con acceso directo a su lección del Aula.
   Usa lo que ya existe: NIVELES / NIVEL_EXTRA, CAMPAIGN_ARCS, AREA_DISH_UNLOCKS, loadCampaignProgress, getLevelStarThresholds y Guia.start.
   Scripts clásicos: nada de import/export. API: window.CampMapa = { open, close, needsBrief, brief }. */
(function () {
  'use strict';
  const SPRITE = 'assets/people/cook_ramen_v1.webp';         // sprite del Maestro: 512×576, fotograma 128×192 (fila 0 caminar, fila 1 trabajar)
  const SEEN_KEY = 'ramen_camp_brief_seen';
  const SEC = 480, NODE_DX = 104, NODE_X0 = 78;               // ancho de un arco, separación entre niveles y primer nivel
  const NODE_Y = [92, 134, 88, 138];                        // vaivén vertical del camino dentro de un arco
  const ARC_TINT = ['#c8372d', '#e0701a', '#2e6f95', '#c99a1e', '#7a4aa0'];
  const AREA_ICON = { ramen: '🍜', salteados: '🍳', makis: '🍣', frituras: '🍤' };
  const AREA_NAME = { ramen: 'Ramen', salteados: 'Salteado', makis: 'Makis', frituras: 'Frituras' };
  const $ = (s, r) => (r || document).querySelector(s);
  const sfx = n => { try { playSound(n); } catch (e) {} };
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const bold = t => String(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

  let cssDone = false, root = null, selected = 0;
  function css() {
    if (cssDone) return; cssDone = true;
    const st = document.createElement('style'); st.id = 'campana-mapa-css';
    st.textContent = `
    .cm, .cmb { position: fixed; inset: 0; z-index: 9000; font-family: 'Fredoka', 'Fredoka One', system-ui, sans-serif; color: #ffe9b0; user-select: none; -webkit-user-select: none; }
    .cm { background: linear-gradient(#150b1c, #2a1420 55%, #3b1c14); display: flex; flex-direction: column; overflow: hidden; }
    .cm-top { flex: none; display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: rgba(20, 9, 4, .85); border-bottom: 2px solid #2b1810; }
    .cm-top h1 { margin: 0; font: 400 17px 'Fredoka One', cursive, system-ui; color: #ffd978; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cm-btn { background: linear-gradient(#ffb300, #ff8f00); color: #2b1810; border: 2px solid #2b1810; border-radius: 10px; padding: 5px 12px; font: 400 13px 'Fredoka One', cursive, system-ui; cursor: pointer; box-shadow: 0 2px 0 #8a4b00; white-space: nowrap; }
    .cm-btn.sec { background: linear-gradient(#5b3a22, #3b2415); color: #ffe9b0; box-shadow: 0 2px 0 #1a0e07; }
    .cm-btn:disabled { opacity: .45; cursor: default; }
    .cm-pill { background: rgba(255, 179, 0, .16); border: 1.5px solid rgba(255, 179, 0, .5); border-radius: 999px; padding: 2px 9px; font-weight: 800; font-size: 12px; white-space: nowrap; }
    .cm-scroll { flex: 1 1 auto; min-height: 0; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; scrollbar-width: none; position: relative; touch-action: pan-x; }
    .cm-scroll::-webkit-scrollbar { display: none; }
    .cm-world { position: relative; height: 100%; min-height: 250px; }
    .cm-arc { position: absolute; top: 8px; height: 40px; display: flex; align-items: center; gap: 8px; padding: 0 12px 0 8px; border-radius: 12px; border: 2px solid #2b1810; box-shadow: 0 3px 0 rgba(0,0,0,.4); }
    .cm-arc i { font-style: normal; font-size: 22px; } .cm-arc b { display: block; font: 400 14px/1 'Fredoka One', cursive, system-ui; color: #fff7dc; } .cm-arc small { display: block; font-size: 10.5px; font-weight: 800; color: #ffe9b0; opacity: .9; }
    .cm-svg { position: absolute; left: 0; top: 0; pointer-events: none; }
    .cm-string { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: repeating-linear-gradient(90deg, #5a3a22 0 14px, #3b2415 14px 16px); opacity: .9; }
    .cm-torii { position: absolute; top: 56px; width: 50px; height: 100px; pointer-events: none; opacity: .85; }
    .cm-torii::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 9px; border-radius: 3px; background: #c8372d; box-shadow: 0 -4px 0 #7a1d17; }
    .cm-torii::after { content: ''; position: absolute; left: 7px; right: 7px; top: 22px; height: 6px; background: #c8372d; }
    .cm-torii i { position: absolute; top: 9px; bottom: 0; width: 7px; background: linear-gradient(90deg, #c8372d, #9c2a22); }
    .cm-torii i:first-child { left: 7px; } .cm-torii i:last-child { right: 7px; }
    .cm-node { position: absolute; width: 60px; margin-left: -30px; text-align: center; cursor: pointer; background: none; border: 0; padding: 0; color: inherit; font: inherit; -webkit-tap-highlight-color: transparent; }
    .cm-lan { position: relative; display: block; width: 40px; height: 48px; margin: 0 auto; border-radius: 46% / 40%; border: 2.5px solid #2b1810;
      background: repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 7px), radial-gradient(circle at 35% 30%, #ffd978, #f2a33a 55%, #c8651a); box-shadow: 0 0 14px rgba(255, 170, 60, .55); transition: transform .15s; }
    .cm-lan::before, .cm-lan::after { content: ''; position: absolute; left: 50%; width: 22px; height: 6px; margin-left: -11px; background: #2b1810; border-radius: 2px; }
    .cm-lan::before { top: -6px; } .cm-lan::after { bottom: -6px; }
    .cm-lan em { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 400 18px 'Fredoka One', cursive, system-ui; font-style: normal; color: #fff; text-shadow: 0 2px 0 #7a2d0a, 0 0 4px #7a2d0a; }
    .cm-node.done .cm-lan { background: repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 7px), radial-gradient(circle at 35% 30%, #ff8f8f, #d9382b 55%, #8e1d17); box-shadow: 0 0 16px rgba(255, 90, 60, .6); }
    .cm-node.locked .cm-lan { background: repeating-linear-gradient(0deg, rgba(0,0,0,.2) 0 2px, transparent 2px 7px), radial-gradient(circle at 35% 30%, #78808a, #4b525a 60%, #30353b); box-shadow: none; opacity: .75; }
    .cm-node.locked .cm-lan em { font-size: 15px; }
    .cm-node.boss { width: 74px; margin-left: -37px; } .cm-node.boss .cm-lan { width: 52px; height: 62px; }
    .cm-node.boss .cm-lan em { font-size: 24px; }
    .cm-node.boss::after { content: 'EXAMEN'; position: absolute; left: 50%; top: -17px; transform: translateX(-50%); background: #c8372d; border: 2px solid #2b1810; border-radius: 6px; padding: 0 5px; font: 400 9.5px 'Fredoka One', cursive, system-ui; color: #fff7dc; letter-spacing: .4px; }
    .cm-node.cur .cm-lan { animation: cmPulse 1.2s ease-in-out infinite alternate; }
    .cm-node.sel .cm-lan { transform: scale(1.14); outline: 3px solid #fff3d0; outline-offset: 3px; }
    .cm-st { display: block; margin-top: 8px; font-size: 12px; line-height: 1; letter-spacing: 1px; white-space: nowrap; }
    .cm-st b { color: #ffcf2e; text-shadow: 0 1px 0 #2b1810; font-weight: 400; } .cm-st s { color: rgba(255, 233, 176, .28); text-decoration: none; }
    .cm-nm { display: block; margin-top: 2px; font-size: 10px; font-weight: 800; color: #f6e7c1; text-shadow: 0 1px 2px #000; line-height: 1.05; max-height: 22px; overflow: hidden; }
    .cm-m { position: absolute; width: 128px; height: 192px; transform-origin: 50% 100%; transform: scale(.42); background: url(${SPRITE}) 0 0 / 512px 576px no-repeat; animation: cmSpr .9s steps(4) infinite; pointer-events: none; filter: drop-shadow(0 3px 2px rgba(0,0,0,.5)); }
    .cm-sheet { flex: none; margin: 0 8px 8px; padding: 7px 10px; background: linear-gradient(#4a2a14, #2b1810); border: 2px solid #1a0e07; outline: 1.5px solid #ffb300; border-radius: 12px; display: flex; gap: 12px; align-items: center; min-height: 74px; box-sizing: border-box; }
    .cm-sheet .cm-info { flex: 1; min-width: 0; } .cm-sheet h3 { margin: 0 0 2px; font: 400 16px/1.1 'Fredoka One', cursive, system-ui; color: #fff3d0; }
    .cm-sheet .cm-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; } .cm-chip { background: rgba(255, 233, 176, .1); border: 1px solid rgba(255, 233, 176, .28); border-radius: 8px; padding: 1px 7px; font-size: 11px; font-weight: 800; color: #f6e7c1; white-space: nowrap; }
    .cm-chip.new { background: rgba(255, 179, 0, .2); border-color: rgba(255, 179, 0, .65); color: #ffd978; }
    .cm-sheet .cm-acts { flex: none; display: flex; flex-direction: column; gap: 5px; align-items: stretch; }
    .cm-sheet .cm-lock { color: #b9c0c9; font-weight: 800; font-size: 13px; }
    .cm-rt { display: block; margin-top: 1px; font-size: 10px; font-weight: 900; color: #7fe0d0; text-shadow: 0 1px 2px #000; white-space: nowrap; }
    .cm-sheet .cm-acts .cm-row { display: flex; gap: 5px; } .cm-sheet .cm-acts .cm-row .cm-btn { flex: 1; padding-left: 8px; padding-right: 8px; white-space: nowrap; }
    .cm-btn.teal { background: linear-gradient(#26a69a, #00796b); color: #fff; }
    .cmr { position: fixed; inset: 0; z-index: 9050; display: flex; flex-direction: column; background: linear-gradient(#0f1f1c, #14262a 55%, #1c1410); font-family: 'Fredoka', 'Fredoka One', system-ui, sans-serif; color: #ffe9b0; }
    .cmr-top { flex: none; display: flex; align-items: center; gap: 8px; padding: 6px max(10px, env(safe-area-inset-right)) 6px max(10px, env(safe-area-inset-left)); background: rgba(8, 20, 18, .9); border-bottom: 2px solid #0a1412; }
    .cmr-top h1 { margin: 0; font: 400 16px 'Fredoka One', cursive, system-ui; color: #8ff0e0; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cmr-body { flex: 1; min-height: 0; overflow-y: auto; padding: 8px max(12px, env(safe-area-inset-right)) 12px max(12px, env(safe-area-inset-left)); -webkit-overflow-scrolling: touch; }
    .cmr-note { background: rgba(255, 179, 0, .14); border: 1.5px solid rgba(255, 179, 0, .5); color: #ffd978; border-radius: 10px; padding: 6px 10px; font: 800 12px 'Fredoka', sans-serif; margin-bottom: 8px; }
    .cmr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 7px; }
    .cmr-card { display: flex; align-items: center; gap: 9px; background: rgba(0, 0, 0, .32); border: 2px solid rgba(255, 255, 255, .13); border-radius: 12px; padding: 7px 9px; }
    .cmr-card.done { border-color: rgba(255, 207, 46, .55); } .cmr-card.next { border-color: #26a69a; box-shadow: 0 0 10px rgba(38, 166, 154, .45); } .cmr-card.locked { opacity: .55; }
    .cmr-card .n { flex: none; width: 30px; height: 30px; border-radius: 9px; background: rgba(255, 255, 255, .1); display: flex; align-items: center; justify-content: center; font: 400 14px 'Fredoka One', cursive, system-ui; }
    .cmr-card .t { flex: 1; min-width: 0; display: flex; flex-direction: column; } .cmr-card b { font: 900 13px/1.15 'Fredoka', sans-serif; color: #fff3d6; }
    .cmr-card small { font: 700 11px/1.3 'Fredoka', sans-serif; color: #b7c9c4; } .cmr-card em { font: 800 11px 'Fredoka', sans-serif; font-style: normal; color: #ffd978; margin-top: 1px; }
    .cmr-card .cm-btn { flex: none; padding: 5px 11px; }
    @keyframes cmSpr { to { background-position-x: -512px; } }
    @keyframes cmPulse { from { box-shadow: 0 0 10px rgba(255, 170, 60, .5); } to { box-shadow: 0 0 26px rgba(255, 200, 80, .95); } }
    /* presentación del Maestro */
    .cmb { background: rgba(12, 6, 3, .86); display: flex; align-items: center; justify-content: center; padding: 8px; box-sizing: border-box; z-index: 9100; }
    .cmb-wrap { display: flex; align-items: flex-end; gap: 6px; max-width: 700px; max-height: 100%; }
    .cmb-m { flex: none; width: 128px; height: 192px; background: url(${SPRITE}) 0 -192px / 512px 576px no-repeat; animation: cmSpr .9s steps(4) infinite; filter: drop-shadow(0 4px 3px rgba(0,0,0,.55)); margin-bottom: 4px; }
    .cmb-card { position: relative; background: linear-gradient(#4a2a14, #2b1810); border: 3px solid #1a0e07; outline: 2px solid #ffb300; border-radius: 16px; padding: 10px 16px 12px; box-shadow: 0 10px 30px rgba(0,0,0,.6); animation: cmbIn .25s ease-out; overflow-y: auto; max-height: 94vh; }
    .cmb-card::before { content: ''; position: absolute; left: -12px; bottom: 28px; border: 8px solid transparent; border-right-color: #ffb300; border-left: 0; }
    .cmb-tag { font: 800 11px/1.2 'Fredoka One', cursive, system-ui; color: #ffb300; letter-spacing: .5px; text-transform: uppercase; }
    .cmb-card h2 { margin: 2px 0 6px; font: 400 21px/1.1 'Fredoka One', cursive, system-ui; color: #fff3d0; }
    .cmb-card p { margin: 5px 0; font-size: 13px; line-height: 1.35; color: #f6e7c1; } .cmb-card b { color: #ffcf5a; }
    .cmb-card .cmb-focus { margin-top: 8px; padding: 5px 9px; border-radius: 9px; background: rgba(255, 179, 0, .16); border: 1px solid rgba(255, 179, 0, .5); font-size: 12px; font-weight: 800; color: #ffd978; }
    .cmb-acts { display: flex; gap: 8px; margin-top: 10px; justify-content: flex-end; flex-wrap: wrap; }
    @keyframes cmbIn { from { opacity: 0; transform: translateX(14px); } }
    @media (prefers-reduced-motion: reduce) { .cm-m, .cmb-m, .cm-node.cur .cm-lan { animation: none; } }
    `;
    document.head.appendChild(st);
  }

  // ---------- datos ----------
  const prog = () => { try { return loadCampaignProgress() || {}; } catch (e) { return {}; } };
  const unlocked = () => Math.min(NIVELES.length, (prog().unlockedLevel || 1));
  const starsOf = n => { const l = (prog().levels || {})[String(n)]; return l ? (l.stars || 0) : 0; };
  const arcOf = lvl => Math.max(0, CAMPAIGN_ARCS.findIndex(a => a.levels.includes(lvl)));
  function newDishes(cfg, i) {
    const prev = NIVELES[i - 1], out = [];
    cfg.ramen_names.forEach(n => { if (!prev || !prev.ramen_names.includes(n)) out.push(n); });
    Object.keys(AREA_DISH_UNLOCKS).forEach(a => AREA_DISH_UNLOCKS[a].forEach(d => { if (d[1] === cfg.level) out.push(d[0]); }));
    return out;
  }
  const seenMap = () => { try { return JSON.parse(store.get(SEEN_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const needsBrief = cfg => !!(cfg && cfg.brief && cfg.brief.card && !seenMap()[cfg.level]);

  // ---------- mapa ----------
  function nodePos(lvl) { const a = arcOf(lvl), k = CAMPAIGN_ARCS[a].levels.indexOf(lvl); return { x: a * SEC + NODE_X0 + k * NODE_DX, y: NODE_Y[k] }; }

  // ---------- retos: subniveles de cada nivel ----------
  const retosOf = lvl => { try { return trainingOfLevel(lvl); } catch (e) { return []; } };
  const retoDone = c => { try { return (trainingProgressOf(c.id) || {}).m > 0; } catch (e) { return false; } };
  function retosBadge(lvl, st) { const l = retosOf(lvl); if (!l.length || !st) return ''; return '<span class="cm-rt">🎫 ' + l.filter(retoDone).length + '/' + l.length + '</span>'; }
  function retosPanel(lvl) {
    css(); lvl = Math.max(1, Math.min(NIVELES.length, lvl | 0 || 1));
    const old = $('#cmr-root'); if (old) old.remove();
    const cfg = NIVELES[lvl - 1], list = retosOf(lvl), beaten = trainingLevelBeaten(lvl), done = list.filter(retoDone).length, nx = list.find(c => trainingIsOpen(c) && !retoDone(c));
    const cards = list.map(c => {
      const p = trainingProgressOf(c.id) || {}, open = trainingIsOpen(c), state = !open ? 'locked' : (p.m > 0 ? 'done' : 'open');
      const meta = !open ? '🔒 Supera el nivel ' + lvl : (p.m > 0 ? trainingMedalIcon(p.m) + ' ' + formatTrainingTime(p.t) + ' · +' + c.reward + '🧧' : '🥇 ' + formatTrainingTime(trainingPar(c)) + ' · +' + c.reward + '🧧');
      return '<div class="cmr-card ' + state + (nx && nx.id === c.id ? ' next' : '') + '"><span class="n">' + c.num + '</span><div class="t"><b>' + c.title + '</b><small>' + trainingObjectiveText(c) + '</small><em>' + meta + '</em></div>'
        + '<button class="cm-btn ' + (p.m > 0 ? 'sec' : 'teal') + '" data-rt="' + c.id + '" ' + (open ? '' : 'disabled') + '>' + (open ? (p.m > 0 ? '↻' : '▶') : '🔒') + '</button></div>';
    }).join('');
    const el = document.createElement('div'); el.className = 'cmr'; el.id = 'cmr-root';
    el.innerHTML = '<div class="cmr-top"><button class="cm-btn sec" data-rback>← Mapa</button><button class="cm-btn sec" data-rlv="' + (lvl - 1) + '" ' + (lvl > 1 ? '' : 'disabled') + '>◀</button><h1>🎫 Retos · ' + lvl + '. ' + cfg.name.replace(/Nivel \d+:\s*/, '') + '</h1><button class="cm-btn sec" data-rlv="' + (lvl + 1) + '" ' + (lvl < NIVELES.length ? '' : 'disabled') + '>▶</button><span class="cm-pill">🎫 ' + done + '/' + list.length + '</span></div>'
      + '<div class="cmr-body">' + (beaten ? '<div class="cmr-note" style="background:rgba(38,166,154,.16);border-color:rgba(38,166,154,.55);color:#8ff0e0">Sin cuenta regresiva: cuenta cuánto tardas. Mejora tu tiempo para subir de medalla y cobrar más propinas.</div>' : '<div class="cmr-note">🔒 Supera el nivel ' + lvl + ' de la Campaña para abrir estos retos.</div>') + '<div class="cmr-grid">' + cards + '</div></div>';
    document.body.appendChild(el);
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t || t.disabled) return; sfx('click');
      if (t.hasAttribute('data-rback')) el.remove();
      else if (t.dataset.rlv) { retosPanel(+t.dataset.rlv); if (root) select(Math.max(1, Math.min(NIVELES.length, +t.dataset.rlv)), true); }
      else if (t.dataset.rt) { try { startTrainingChallenge(t.dataset.rt); } catch (er) { console.warn('[CampMapa] reto', er); } }
    });
  }
  function buildWorld() {
    const W = CAMPAIGN_ARCS.length * SEC + 40, cur = unlocked();
    let svg = '', nodes = '', arcs = '', gates = '';
    // camino: curva suave por todos los niveles; tramo recorrido dorado, tramo bloqueado apagado
    const pts = NIVELES.map(n => nodePos(n.level));
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], mx = (a.x + b.x) / 2, open = NIVELES[i + 1].level <= cur;
      svg += `<path d="M${a.x},${a.y + 34} C${mx},${a.y + 34} ${mx},${b.y + 34} ${b.x},${b.y + 34}" fill="none" stroke="${open ? '#ffb300' : '#5a4a3e'}" stroke-width="${open ? 4 : 3}" stroke-dasharray="${open ? '10 7' : '3 8'}" stroke-linecap="round" opacity="${open ? .95 : .7}"/>`;
    }
    CAMPAIGN_ARCS.forEach((arc, a) => {
      const lv = arc.levels, done = lv.reduce((t, n) => t + starsOf(n), 0);
      arcs += `<div class="cm-arc" style="left:${a * SEC + 14}px;background:${ARC_TINT[a]}"><i>${arc.icon}</i><div><b>${arc.name}</b><small>Niveles ${lv[0]}–${lv[lv.length - 1]} · ${arc.areas} · ⭐ ${done}/${lv.length * 3}</small></div></div>`;
      if (a > 0) gates += `<div class="cm-torii" style="left:${a * SEC - 24}px"><i></i><i></i></div>`;
    });
    NIVELES.forEach(cfg => {
      const p = nodePos(cfg.level), st = starsOf(cfg.level), lock = cfg.level > cur, boss = cfg.level % 4 === 0, isCur = cfg.level === cur && st === 0 || (cfg.level === NIVELES.length && cur === NIVELES.length && st === 0);
      nodes += `<button class="cm-node ${lock ? 'locked' : (st ? 'done' : 'open')} ${boss ? 'boss' : ''} ${isCur ? 'cur' : ''}" data-l="${cfg.level}" style="left:${p.x}px;top:${p.y - (boss ? 6 : 0)}px">`
        + `<span class="cm-lan"><em>${lock ? '🔒' : cfg.level}</em></span>`
        + `<span class="cm-st">${[1, 2, 3].map(k => k <= st ? '<b>★</b>' : '<s>★</s>').join('')}</span>`
        + `<span class="cm-nm">${cfg.name.replace(/Nivel \d+:\s*/, '')}</span>${retosBadge(cfg.level, st)}</button>`;
    });
    // el Maestro espera en tu nivel actual (a la izquierda de su linterna)
    const cp = nodePos(Math.min(cur, NIVELES.length));
    const maestro = `<div class="cm-m" style="left:${cp.x - 98}px;top:${cp.y + 56 - 192 + 8}px;transform-origin:50% 100%"></div>`;
    return { W, html: `<div class="cm-string"></div>${gates}${arcs}<svg class="cm-svg" width="${W}" height="320" viewBox="0 0 ${W} 320">${svg}</svg>${nodes}${maestro}` };
  }

  function sheet(i) {
    const cfg = NIVELES[i], lvl = cfg.level, st0 = starsOf(lvl) > 0, lock = lvl > unlocked(), th = getLevelStarThresholds(cfg), best = (prog().levels || {})[String(lvl)];
    const areas = (cfg.areas || ['ramen']).map(a => `<span class="cm-chip">${AREA_ICON[a]} ${AREA_NAME[a]}</span>`).join('');
    const nd = newDishes(cfg, i), nw = nd.slice(0, 5).map(n => `<span class="cm-chip new">✨ ${n}</span>`).join('') + (nd.length > 5 ? `<span class="cm-chip new">+${nd.length - 5}</span>` : '');
    const focus = cfg.focus && cfg.focus.mechanic ? `<span class="cm-chip new">🎓 ${cfg.focus.mechanic}</span>` : '';
    const el = $('#cm-sheet', root);
    el.innerHTML = `<div class="cm-info"><h3>${lvl}. ${cfg.name.replace(/Nivel \d+:\s*/, '')}</h3>`
      + (lock ? `<div class="cm-lock">🔒 Termina el nivel ${lvl - 1} para abrirlo.</div>` : (!st0 && retosOf(lvl).length ? `<div class="cm-lock">🎫 ${retosOf(lvl).length} reto${retosOf(lvl).length > 1 ? 's' : ''} se abren al superar este nivel.</div>` : ''))
      + `<div class="cm-chips"><span class="cm-chip">⏱ ${mmss(cfg.time)}</span><span class="cm-chip">🎯 S/ ${cfg.goal}</span><span class="cm-chip">⭐ ${th.star1} · ⭐⭐ ${th.star2} · ⭐⭐⭐ ${th.star3}</span>${areas}</div>`
      + `<div class="cm-chips">${focus}${nw}${best && best.bestMoney ? `<span class="cm-chip">🏆 S/ ${best.bestMoney}</span>` : ''}</div></div>`
      + `<div class="cm-acts"><button class="cm-btn" data-play="${i}" ${lock ? 'disabled' : ''}>▶ Jugar</button><div class="cm-row">${cfg.focus && cfg.focus.lesson && !lock ? `<button class="cm-btn sec" data-les="${cfg.focus.lesson}">📚 Lección</button>` : ''}${retosOf(lvl).length ? `<button class="cm-btn teal" data-ret="${lvl}">🎫 Retos ${st0 ? retosOf(lvl).filter(retoDone).length + '/' : ''}${retosOf(lvl).length}</button>` : ''}</div></div>`;
  }
  function select(lvl, scroll) {
    selected = lvl; $$('.cm-node', root).forEach(n => n.classList.toggle('sel', +n.dataset.l === lvl)); sheet(lvl - 1);
    if (scroll) { const sc = $('#cm-scroll', root), p = nodePos(lvl); sc.scrollTo({ left: Math.max(0, p.x - sc.clientWidth / 2), behavior: 'smooth' }); }
  }
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function open(filterArc) {
    css(); close(true); sfx('click');
    const cur = unlocked(), nextCfg = NIVELES[Math.min(NIVELES.length, cur) - 1], total = getCampaignTotalStars(), max = NIVELES.length * 3, w = buildWorld();
    root = document.createElement('div'); root.className = 'cm'; root.id = 'cm-root';
    root.innerHTML = `<div class="cm-top"><button class="cm-btn sec" data-back>← Volver</button><h1>🏮 Campaña Gastronómica</h1><span class="cm-pill">⭐ ${total}/${max}</span><span class="cm-pill">🧧 ${getPropinasWallet()}</span><button class="cm-btn" data-play="${nextCfg.level - 1}">▶ Nivel ${nextCfg.level}</button></div>`
      + `<div class="cm-scroll" id="cm-scroll"><div class="cm-world" style="width:${w.W}px">${w.html}</div></div><div class="cm-sheet" id="cm-sheet"></div>`;
    document.body.appendChild(root);
    root.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-back')) { sfx('click'); close(); return; }
      if (t.dataset.l) { sfx('click'); select(+t.dataset.l, true); return; }
      if (t.dataset.play != null) { const i = +t.dataset.play; sfx('click'); if (typeof playCampaignLevel === 'function') playCampaignLevel(i); return; }
      if (t.dataset.ret) { sfx('click'); retosPanel(+t.dataset.ret); return; }
      if (t.dataset.les) { sfx('click'); close(); try { Guia.start(t.dataset.les); } catch (er) {} }
    });
    let startLvl = Math.min(cur, NIVELES.length);
    if (filterArc && filterArc !== 'all') { const a = CAMPAIGN_ARCS.find(x => x.id === filterArc); if (a) startLvl = a.levels[0]; }
    select(startLvl, false);
    const sc = $('#cm-scroll', root); const p = nodePos(startLvl); sc.scrollLeft = Math.max(0, p.x - sc.clientWidth * 0.45);
  }
  function close(silent) { if (root) { root.remove(); root = null; } const r = $('#cmr-root'); if (r) r.remove(); }
  /** Abre el mapa con la lista de retos de un nivel encima (los retos son subniveles de la Campaña). */
  function retos(lvl) { if (!root) open(); select(Math.max(1, Math.min(NIVELES.length, lvl | 0 || 1)), true); retosPanel(lvl); }

  // ---------- presentación del Maestro ----------
  function brief(cfg, go) {
    css();
    const b = cfg.brief, arc = CAMPAIGN_ARCS[arcOf(cfg.level)], old = $('#cmb-root'); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'cmb'; el.id = 'cmb-root';
    const areas = (cfg.areas || ['ramen']).map(a => AREA_ICON[a]).join(' ');
    el.innerHTML = `<div class="cmb-wrap"><div class="cmb-m"></div><div class="cmb-card"><div class="cmb-tag">🏮 ${arc.name} · Nivel ${cfg.level} · ${areas}</div><h2>${bold(b.title)}</h2>`
      + b.lines.map(l => `<p>${bold(l)}</p>`).join('') + `<div class="cmb-focus">🎓 ${bold(cfg.focus.mechanic)}</div>`
      + `<div class="cmb-acts"><button class="cm-btn sec" data-les>📚 Practicar en el Aula</button><button class="cm-btn" data-go>▶ ¡A cocinar!</button></div></div></div>`;
    document.body.appendChild(el); sfx('bell');
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return; sfx('click');
      if (t.hasAttribute('data-go')) { const m = seenMap(); m[cfg.level] = 1; store.set(SEEN_KEY, JSON.stringify(m)); el.remove(); go(); }
      else if (t.hasAttribute('data-les')) { el.remove(); close(); try { Guia.start(cfg.focus.lesson); } catch (er) {} }
    });
  }

  window.CampMapa = { open, close, needsBrief, brief, retos };
})();
