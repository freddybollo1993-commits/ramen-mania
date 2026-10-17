/* Servicio del día: 3 metas diarias (fácil, media y de reto) + Cofre del Maestro + racha con bono.
   Las metas se eligen según lo que el jugador ya desbloqueó y su plato más flojo, con una semilla por día y cuenta (no cambian al reiniciar).
   Se escuchan los eventos del juego envolviendo funciones existentes (sin editar el núcleo): statsRecordDish (platos servidos), recordCampaignLevelVictory
   (nivel ganado) y trainingRecord (reto del Entrenamiento); Reconocer avisa con Servicio.event('recon'). Todo se guarda en el aparato (ramen_servicio_v1).
   Script clásico. Depende de recetario.js (catálogo de platos y estadísticas). */
(function () {
  'use strict';
  const KEY = 'ramen_servicio_v1';
  const BASE = { easy: 20, med: 35, hard: 60 }, CHEST = 50, STREAK_STEP = 0.1, STREAK_MAX = 5, GAP_OK = 2;      // propinas por meta, cofre y racha (+10 % por día, hasta +50 %)
  const AREA = { ramen: ['🍜', 'Ramen'], salteados: ['🍳', 'Salteado'], makis: ['🍣', 'Makis'], frituras: ['🍤', 'Frituras'] };
  const ICON = { cook_any: '🍽️', cook_area: '🍽️', probar: '✨', mejorar: '📈', clean_run: '🔥', stars3: '⭐', win_level: '🏮', win_stars: '🏆', training: '🏋️', recon: '🔍' };
  const TIER_NAME = { easy: 'Fácil', med: 'Media', hard: 'Reto' };
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const $ = id => document.getElementById(id);
  const sfx = n => { try { playSound(n); } catch (e) {} };
  const toast = m => { try { showStationToast(m); } catch (e) {} };
  const tutDone = () => { try { return isTutorialCompleted(); } catch (e) { return false; } };
  const unlockedLevel = () => { try { return getCampaignStatsSummary().unlockedLevel || 1; } catch (e) { return 1; } };

  // ---------- fechas y azar (determinista por día y cuenta) ----------
  const dayKey = (d) => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dayNum = k => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // ---------- estado ----------
  let st = null;
  const load = () => { try { st = JSON.parse(store.get(KEY) || 'null'); } catch (e) { st = null; } if (!st || st.v !== 1) st = { v: 1, day: '', goals: [], chest: 0, streak: 0, last: '', hardDone: false }; return st; };
  const save = () => store.set(KEY, JSON.stringify(st));
  const accId = () => store.get('ramen_account_id') || 'anon';
  const mult = () => 1 + STREAK_STEP * Math.min(STREAK_MAX, currentStreak());
  function currentStreak() { if (!st) load(); if (!st.last) return 0; return dayNum(dayKey()) - dayNum(st.last) <= GAP_OK ? st.streak : 0; }   // un día sin jugar no rompe la racha; dos o más, sí

  // ---------- generación de las metas del día ----------
  function generate(today, prevHard) {
    const R = rng(hash(today + '|' + accId())), pick = a => a[Math.floor(R() * a.length)];
    const U = unlockedLevel(), cat = (window.Recetario ? Recetario.catalog() : []).filter(c => c.req != null && c.req <= U);
    const areas = [...new Set(cat.map(c => c.area))].filter(a => AREA[a]);
    const withStat = cat.map(c => ({ c, s: Recetario.stat(c) }));
    const fresh = withStat.filter(x => !x.s.n), weak = withStat.filter(x => x.s.n >= 3).sort((a, b) => a.s.avg - b.s.avg)[0];
    const up = prevHard ? 1 : 0;                                         // si ayer cumplió el reto, hoy se endurece un poco
    const g = (t, tier, n, extra) => Object.assign({ t, tier, n, prog: 0, done: false, rew: BASE[tier] }, extra || {});
    const easy = [], med = [], hard = [];
    if (areas.length) easy.push(() => g('cook_area', 'easy', 3, { area: pick(areas) }));
    easy.push(() => g('cook_any', 'easy', 4));
    if (fresh.length) easy.push(() => g('probar', 'easy', 1));
    if (tutDone()) easy.push(() => g('training', 'easy', 1));
    easy.push(() => g('recon', 'easy', 1));
    if (areas.length) med.push(() => g('cook_area', 'med', 5, { area: pick(areas) }));
    med.push(() => g('clean_run', 'med', 3, { min: 75 }));
    if (weak) med.push(() => g('mejorar', 'med', 1, { key: weak.c.key, name: weak.c.r.name, min: Math.max(65, Math.min(90, Math.round(weak.s.avg) + 10)) }));
    med.push(() => g('win_level', 'med', 1));
    hard.push(() => g('win_stars', 'hard', 1, { stars: 2 }));
    hard.push(() => g('clean_run', 'hard', 5, { min: 80 + up * 5 }));
    hard.push(() => g('stars3', 'hard', 3 + up));
    const goals = [], used = new Set();
    [easy, med, hard].forEach(pool => {
      const opts = pool.map(f => f()).filter(x => !used.has(x.t)); const ch = opts.length ? pick(opts) : pool[0]();
      used.add(ch.t); goals.push(ch);
    });
    return goals;
  }
  function ensure() {
    load(); const today = dayKey();
    if (st.day !== today) {
      const prevHard = st.goals.length && st.goals[2] && st.goals[2].done;
      st.day = today; st.goals = generate(today, prevHard); st.chest = 0; save();
    }
    return st;
  }

  // ---------- progreso ----------
  function touchStreak() {                                               // la primera meta cumplida del día cuenta el día para la racha
    const today = dayKey();
    if (st.last === today) return;
    st.streak = st.last && dayNum(today) - dayNum(st.last) <= GAP_OK ? st.streak + 1 : 1; st.last = today;
  }
  function complete(g) {
    g.done = true; touchStreak();
    const r = Math.round(g.rew * mult()); g.paid = r;
    try { addPropinas(r); } catch (e) {}
    save(); sfx('serve');
    toast('🎯 ¡Meta del día cumplida! ' + describe(g) + ' · +' + r + ' 🧧');
    if (st.goals.every(x => x.done)) setTimeout(() => toast('🎁 ¡Cofre del Maestro listo! Ábrelo en el menú de inicio.'), 2600);
  }
  function bump(g, n) { if (g.done) return; g.prog = Math.min(g.n, (g.prog || 0) + (n == null ? 1 : n)); if (g.prog >= g.n) complete(g); }
  function onServe(recipe, ev, prevN) {
    if (!ev || typeof isMultiplayerSession === 'function' && isMultiplayerSession()) return;
    ensure(); const area = getRecipeArea(recipe), key = statsDishKey(area, recipe.name), score = ev.score || 0;
    st.goals.forEach(g => {
      if (g.done) return;
      switch (g.t) {
        case 'cook_any': bump(g); break;
        case 'cook_area': if (g.area === area) bump(g); break;
        case 'probar': if (!prevN) bump(g); break;
        case 'mejorar': if (g.key === key && score >= g.min) bump(g); break;
        case 'clean_run': if (score >= g.min) bump(g); else { g.prog = 0; } break;
        case 'stars3': if (score >= 85) bump(g); break;
      }
    });
    save();
  }
  function event(type, d) {
    ensure(); d = d || {};
    st.goals.forEach(g => {
      if (g.done) return;
      if (g.t === 'win_level' && type === 'levelWon') bump(g);
      else if (g.t === 'win_stars' && type === 'levelWon' && (d.stars || 0) >= g.stars) bump(g);
      else if (g.t === 'training' && type === 'training') bump(g);
      else if (g.t === 'recon' && type === 'recon') bump(g);
    });
    save();
  }

  // ---------- textos ----------
  function describe(g) {
    switch (g.t) {
      case 'cook_any': return 'Sirve ' + g.n + ' platos';
      case 'cook_area': return 'Sirve ' + g.n + ' platos de ' + AREA[g.area][1];
      case 'probar': return 'Cocina un plato que nunca has probado';
      case 'mejorar': return 'Sirve ' + g.name + ' con calidad ' + g.min + '+ (tu plato más flojo)';
      case 'clean_run': return 'Sirve ' + g.n + ' platos seguidos con calidad ' + g.min + '+';
      case 'stars3': return 'Sirve ' + g.n + ' platos con calidad 85+ (⭐⭐⭐)';
      case 'win_level': return 'Gana un nivel de Campaña';
      case 'win_stars': return 'Gana un nivel con ' + g.stars + ' estrellas o más';
      case 'training': return 'Completa 1 reto del Entrenamiento';
      case 'recon': return 'Termina una ronda de Reconocer ingredientes';
    }
    return '';
  }
  const dotIcon = g => ICON[g.t] || '🎯';

  // ---------- API para el menú ----------
  function summary() {
    ensure(); const done = st.goals.filter(g => g.done).length;
    return { done, total: st.goals.length, chestReady: done === st.goals.length && !st.chest, chestOpen: !!st.chest, streak: currentStreak(), mult: mult() };
  }
  function strip() {
    css(); ensure(); const sm = summary();
    return '<div class="hub-daily" onclick="Servicio.open()" title="Servicio del día"><span class="svc-lab">🎯 Del día</span>'
      + st.goals.map(g => '<span class="svc-dot ' + g.tier + (g.done ? ' done' : '') + '" title="' + describe(g).replace(/"/g, '') + '">' + (g.done ? '✔' : (g.n > 1 ? (g.prog || 0) + '/' + g.n : dotIcon(g))) + '</span>').join('')
      + '<span class="svc-chest' + (sm.chestReady ? ' ready' : '') + '">' + (st.chest ? '✅' : '🎁') + '</span>'
      + (sm.streak ? '<span class="svc-streak">🔥' + sm.streak + '</span>' : '') + '</div>';
  }

  // ---------- pantallas ----------
  const CSS = `
  .hub-daily { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; cursor: pointer; }
  .svc-lab { font: 900 10px 'Fredoka', sans-serif; color: #ffd978; letter-spacing: .4px; margin-right: 2px; }
  .svc-dot { min-width: 34px; height: 24px; padding: 0 6px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font: 900 11px 'Fredoka', sans-serif; color: #fff3d6; border: 1.5px solid rgba(255,255,255,.3); background: rgba(0,0,0,.4); }
  .svc-dot.easy { border-color: #66bb6a; } .svc-dot.med { border-color: #ffb300; } .svc-dot.hard { border-color: #ef5350; }
  .svc-dot.done { background: #2e9e4f; border-color: #c8f7c5; color: #fff; }
  .svc-chest { font-size: 15px; filter: grayscale(.8) opacity(.7); } .svc-chest.ready { filter: none; animation: svcWob .9s ease-in-out infinite; }
  .svc-streak { font: 900 11px 'Fredoka', sans-serif; color: #ffab40; }
  @keyframes svcWob { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg) scale(1.12); } }
  #svc { position: fixed; inset: 0; z-index: 9200; background: rgba(10,5,2,.86); display: flex; align-items: center; justify-content: center; padding: 8px; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; color: #fff3d6;
    padding-left: max(8px, env(safe-area-inset-left)); padding-right: max(8px, env(safe-area-inset-right)); }
  #svc * { box-sizing: border-box; }
  .svc-card { width: min(560px, 100%); max-height: 100%; overflow-y: auto; background: linear-gradient(#4a2a14, #2b1810); border: 3px solid #1a0e07; outline: 2px solid #ffb300; border-radius: 16px; padding: 10px 14px 12px; box-shadow: 0 10px 30px rgba(0,0,0,.6); }
  .svc-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; } .svc-head h2 { margin: 0; flex: 1; font: 400 19px 'Fredoka One', 'Fredoka', sans-serif; color: #ffd978; }
  .svc-x { border: 2px solid #8a5a00; border-radius: 10px; width: 34px; height: 30px; background: linear-gradient(#ffe082, #ffb300); color: #3b2208; font: 900 14px/1 'Fredoka', sans-serif; cursor: pointer; }
  .svc-info { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; } .svc-info b { background: rgba(0,0,0,.4); border: 1.5px solid rgba(255,204,80,.35); border-radius: 12px; padding: 3px 9px; font: 800 11px 'Fredoka', sans-serif; color: #ffe9b0; }
  .svc-goal { display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,.3); border: 2px solid rgba(255,255,255,.12); border-radius: 12px; padding: 7px 10px; margin-bottom: 6px; }
  .svc-goal.done { border-color: #66bb6a; background: rgba(46,158,79,.22); }
  .svc-gi { flex: none; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; background: rgba(255,255,255,.08); }
  .svc-gt { flex: 1; min-width: 0; } .svc-gt b { display: block; font: 800 13px/1.2 'Fredoka', sans-serif; } .svc-gt small { color: #c9a77e; font: 700 10px 'Fredoka', sans-serif; letter-spacing: .4px; text-transform: uppercase; }
  .svc-bar { height: 7px; border-radius: 4px; background: rgba(255,255,255,.12); margin-top: 4px; overflow: hidden; } .svc-bar i { display: block; height: 100%; background: linear-gradient(90deg, #ffb300, #66bb6a); }
  .svc-rw { flex: none; font: 900 12px 'Fredoka', sans-serif; color: #ffe082; text-align: right; }
  .svc-chestrow { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 8px 10px; border-radius: 12px; border: 2px dashed rgba(255,204,80,.45); }
  .svc-open { border: 2px solid #ffe082; border-radius: 12px; padding: 8px 14px; background: linear-gradient(135deg, #ff9800, #e64a19 65%, #c62828); color: #fff; font: 900 12px/1 'Fredoka', sans-serif; box-shadow: 0 3px 0 #7f0000; cursor: pointer; }
  .svc-open:disabled { background: #555; border-color: #888; box-shadow: none; cursor: default; opacity: .7; }
  #svc-chest { position: fixed; inset: 0; z-index: 9400; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; cursor: pointer; font-family: 'Fredoka', sans-serif; color: #fff3d6;
    background: radial-gradient(circle at 50% 42%, #d9962e 0%, #7a1d14 40%, #12060a 85%); }
  #svc-chest .box { font-size: 92px; line-height: 1; filter: drop-shadow(0 8px 14px rgba(0,0,0,.6)); animation: svcBox 1.1s ease-in-out infinite; } #svc-chest.pop .box { animation: svcPop .7s cubic-bezier(.2,1.4,.4,1) forwards; }
  #svc-chest h3 { margin: 0; font: 400 24px 'Fredoka One', 'Fredoka', sans-serif; color: #ffd978; text-shadow: 0 3px 0 rgba(0,0,0,.5); } #svc-chest p { margin: 0; font: 800 14px 'Fredoka', sans-serif; opacity: .9; }
  #svc-chest .amt { font: 400 44px 'Fredoka One', 'Fredoka', sans-serif; color: #ffe082; text-shadow: 0 3px 0 #7f4a00; animation: svcAmt .6s ease-out; }
  #svc-chest .spk { position: absolute; font-size: 22px; animation: svcSpk 1s ease-out forwards; }
  @keyframes svcBox { 0%, 100% { transform: rotate(-6deg) scale(1); } 50% { transform: rotate(6deg) scale(1.06); } }
  @keyframes svcPop { 0% { transform: scale(1) rotate(0); } 40% { transform: scale(1.5) rotate(-12deg); } 100% { transform: scale(1.2) rotate(0); } }
  @keyframes svcAmt { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes svcSpk { from { transform: translate(0, 0) scale(.4); opacity: 1; } to { transform: translate(var(--dx), var(--dy)) scale(1.2); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .svc-chest.ready, #svc-chest .box { animation: none; } }
  `;
  function css() { if ($('svc-css')) return; const s = document.createElement('style'); s.id = 'svc-css'; s.textContent = CSS; document.head.appendChild(s); }
  function inject() { css(); }

  function render() {
    ensure(); const sm = summary();
    const goals = st.goals.map(g => '<div class="svc-goal ' + (g.done ? 'done' : '') + '"><div class="svc-gi">' + (g.done ? '✅' : dotIcon(g)) + '</div><div class="svc-gt"><small>' + TIER_NAME[g.tier] + '</small><b>' + describe(g) + '</b>'
      + (g.n > 1 ? '<div class="svc-bar"><i style="width:' + Math.round(100 * (g.prog || 0) / g.n) + '%"></i></div>' : '') + '</div><div class="svc-rw">' + (g.done ? '+' + (g.paid || g.rew) : '+' + Math.round(g.rew * mult())) + ' 🧧</div></div>').join('');
    const chest = '<div class="svc-chestrow"><div style="font-size:34px">' + (st.chest ? '✅' : '🎁') + '</div><div style="flex:1"><b style="font:800 13px Fredoka,sans-serif">Cofre del Maestro</b><div style="font:700 11px Fredoka,sans-serif;color:#c9a77e">'
      + (st.chest ? 'Ya lo abriste hoy. Vuelve mañana.' : (sm.chestReady ? '¡Listo! Toca para abrirlo.' : 'Cumple las 3 metas para abrirlo (+' + Math.round(CHEST * mult()) + ' 🧧).')) + '</div></div>'
      + '<button class="svc-open" ' + (sm.chestReady ? '' : 'disabled') + ' onclick="Servicio.chest()">Abrir</button></div>';
    let host = $('svc'); if (!host) { host = document.createElement('div'); host.id = 'svc'; host.onclick = e => { if (e.target === host) Servicio.close(); }; document.body.appendChild(host); }
    host.innerHTML = '<div class="svc-card"><div class="svc-head"><h2>🎯 SERVICIO DEL DÍA</h2><button class="svc-x" onclick="Servicio.close()" aria-label="Cerrar">✕</button></div>'
      + '<div class="svc-info"><b>📅 ' + new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }) + '</b><b>🔥 Racha: ' + sm.streak + (sm.streak ? ' día' + (sm.streak > 1 ? 's' : '') + ' (+' + Math.round((sm.mult - 1) * 100) + ' %)' : ' · cumple una meta para empezarla') + '</b></div>'
      + goals + chest + '<div style="font:700 10.5px Fredoka,sans-serif;color:#a98c68;margin-top:8px">Las metas se renuevan a medianoche y se adaptan a tu progreso. Un día sin jugar no rompe la racha; dos o más, sí.</div></div>';
  }
  function chestCeremony() {
    ensure(); if (!summary().chestReady) return;
    const amt = Math.round(CHEST * mult()); const o = document.createElement('div'); o.id = 'svc-chest';
    o.innerHTML = '<h3>¡COFRE DEL MAESTRO!</h3><div class="box">🎁</div><p>Toca para abrir</p>'; document.body.appendChild(o); sfx('click');
    let opened = false;
    o.onclick = () => {
      if (opened) { o.remove(); if ($('svc')) render(); else { try { Inicio.refresh(); } catch (e) {} } return; }
      opened = true; o.classList.add('pop'); sfx('win');
      setTimeout(() => {
        st.chest = 1; save(); try { addPropinas(amt); } catch (e) {}
        o.innerHTML = '<h3>¡Premio del Maestro!</h3><div class="box" style="animation:none">🏮</div><div class="amt">+' + amt + ' 🧧</div><p>Toca para seguir</p>';
        for (let i = 0; i < 14; i++) { const s = document.createElement('i'); s.className = 'spk'; s.textContent = ['✨', '🧧', '⭐'][i % 3]; s.style.left = '50%'; s.style.top = '45%'; const a = i / 14 * 6.283, r = 110 + (i % 4) * 30; s.style.setProperty('--dx', Math.round(Math.cos(a) * r) + 'px'); s.style.setProperty('--dy', Math.round(Math.sin(a) * r) + 'px'); o.appendChild(s); }
        sfx('serve');
      }, 650);
    };
  }

  window.Servicio = {
    open() { inject(); sfx('click'); render(); },
    close() { const h = $('svc'); if (h) h.remove(); try { if (window.Inicio && Inicio.refresh) Inicio.refresh(); } catch (e) {} },
    chest() { inject(); chestCeremony(); },
    event, summary, strip, describe, _state: () => ensure()
  };

  // ---------- escucha de los eventos del juego ----------
  function wrap(name, fn) { const orig = window[name]; if (typeof orig !== 'function') return; window[name] = function () { const r = fn.call(this, orig, arguments); return r; }; }
  wrap('statsRecordDish', function (orig, args) {
    let prevN = 0; try { loadAccountProgressLocal(); const k = statsDishKey(getRecipeArea(args[0]), args[0].name); prevN = (((accountProgress.stats || {}).d || {})[k] || {}).n || 0; } catch (e) {}
    const r = orig.apply(this, args); try { onServe(args[0], args[1], prevN); } catch (e) { console.warn('[Servicio]', e); } return r;
  });
  wrap('recordCampaignLevelVictory', function (orig, args) { const r = orig.apply(this, args); try { event('levelWon', { stars: r && r.stars, level: args[0] }); } catch (e) {} return r; });
  wrap('trainingRecord', function (orig, args) { const r = orig.apply(this, args); try { event('training', { id: args[0] && args[0].id }); } catch (e) {} return r; });
})();
