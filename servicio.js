/* Misiones: DIARIAS (3 metas: fácil, media y de reto + Cofre del Maestro + racha con bono), ESPECIALES (2 por semana) y DE TEMPORADA (6 de largo plazo, cada 4 semanas).
   Todas con barra de progreso y un pequeño premio en propinas que se cobra solo al cumplirlas.
   Las metas se eligen según lo que el jugador ya desbloqueó y su plato más flojo, con una semilla por día y cuenta (no cambian al reiniciar).
   Se escuchan los eventos del juego envolviendo funciones existentes (sin editar el núcleo): statsRecordDish (platos servidos), recordCampaignLevelVictory
   (nivel ganado) y trainingRecord (reto del Entrenamiento); Reconocer avisa con Servicio.event('recon'). Todo se guarda en el aparato (ramen_servicio_v1).
   Script clásico. Depende de recetario.js (catálogo de platos y estadísticas). */
(function () {
  'use strict';
  const KEY = 'ramen_servicio_v1';
  const BASE = { easy: 20, med: 35, hard: 60 }, CHEST = 50, STREAK_STEP = 0.1, STREAK_MAX = 5, GAP_OK = 2;      // propinas por meta, cofre y racha (+10 % por día, hasta +50 %)
  const AREA = { ramen: ['🍜', 'Ramen'], salteados: ['🍳', 'Salteado'], makis: ['🍣', 'Makis'], frituras: ['🍤', 'Frituras'] };
  const ICON = { cook_any: '🍽️', cook_area: '🍽️', probar: '✨', mejorar: '📈', clean_run: '🔥', stars3: '⭐', win_level: '🏮', win_stars: '🏆', training: '🏋️', recon: '🔍', s_all: '🍽️', s_area: '🍽️', s_star3: '⭐', levels: '🏮', retos: '🎫' };
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

  const weekId = () => Math.floor((dayNum(dayKey()) + 3) / 7);                  // las semanas empiezan el lunes
  const seasonId = () => Math.floor((dayNum(dayKey()) + 3 + 21) / 28);          // temporada = 4 semanas (la primera empieza el lunes 12 de octubre de 2026)
  const SEASON_BASE = Math.floor((dayNum('2026-10-12') + 3 + 21) / 28);
  const seasonNo = () => Math.max(1, seasonId() - SEASON_BASE + 1);
  const midnightIn = days => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime() - Date.now(); };
  const msToday = () => midnightIn(1);
  const msWeek = () => midnightIn(7 - ((new Date().getDay() + 6) % 7));
  const msSeason = () => midnightIn((seasonId() + 1) * 28 - 3 - 21 - dayNum(dayKey()));
  const left = ms => { ms = Math.max(0, ms); const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60); return d >= 1 ? d + ' d ' + h + ' h' : h + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };

  // ---------- estado ----------
  let st = null;
  const load = () => { try { st = JSON.parse(store.get(KEY) || 'null'); } catch (e) { st = null; } if (!st || st.v !== 1) st = { v: 1, day: '', goals: [], chest: 0, streak: 0, last: '', hardDone: false }; return st; };
  const persist = () => store.set(KEY, JSON.stringify(st));
  const save = () => { persist(); try { if (typeof japonSyncSoon === 'function') japonSyncSoon(); } catch (e) {} };      // marca la cuenta para guardarla en la nube (junto con el resto del progreso, ver japon.js)
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
  // misiones especiales (por semana) y de temporada (4 semanas): se cumplen sumando lo que haces en cualquier modo
  function genWeek(id) {
    const R = rng(hash('wk' + id + '|' + accId())), U = unlockedLevel(), w = (t, n, rew, x) => Object.assign({ t, n, prog: 0, done: false, rew, kind: 'wk' }, x || {});
    const pool = [() => w('s_all', 30 + 10 * Math.floor(R() * 3), 100), () => w('s_star3', 10 + 5 * Math.floor(R() * 3), 150)];
    if (tutDone()) pool.push(() => w('levels', 3 + Math.floor(R() * 3), 120));
    if (U >= 2) pool.push(() => w('retos', 2 + Math.floor(R() * 2), 120));
    const out = [], used = new Set();
    while (out.length < 2 && pool.length) { const f = pool.splice(Math.floor(R() * pool.length), 1)[0], g = f(); if (!used.has(g.t)) { used.add(g.t); out.push(g); } }
    return out;
  }
  function genSeason(id) {
    const R = rng(hash('ss' + id + '|' + accId())), U = unlockedLevel(), cat = (window.Recetario ? Recetario.catalog() : []).filter(c => c.req != null && c.req <= U);
    const areas = [...new Set(cat.map(c => c.area))].filter(a => AREA[a]), ar = areas.length ? areas[Math.floor(R() * areas.length)] : 'ramen';
    const g = (t, n, rew, x) => Object.assign({ t, n, prog: 0, done: false, rew, kind: 'ss' }, x || {});
    return [g('s_all', 250, 350), g('levels', 10, 500), g('s_star3', 80, 600), g('retos', 8, 450), g('recon', 12, 300), g('s_area', 80, 400, { area: ar })];
  }
  function ensure() {
    load(); const today = dayKey();
    if (st.day !== today) {
      const prevHard = st.goals.length && st.goals[2] && st.goals[2].done;
      st.day = today; st.goals = generate(today, prevHard); st.chest = 0; save();
    }
    if (!st.wk || st.wk.id !== weekId()) { st.wk = { id: weekId(), goals: genWeek(weekId()) }; save(); }
    if (!st.ss || st.ss.id !== seasonId()) { st.ss = { id: seasonId(), goals: genSeason(seasonId()) }; save(); }
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
  function completeLong(g) {                                              // especial o de temporada: premio fijo, sin bono de racha
    g.done = true; g.paid = g.rew; try { addPropinas(g.rew); } catch (e) {}
    save(); sfx('serve'); toast((g.kind === 'ss' ? '🏅 ¡Misión de temporada cumplida! ' : '🌟 ¡Misión especial cumplida! ') + describe(g) + ' · +' + g.rew + ' 🧧');
  }
  function bump(g, n) { if (g.done) return; g.prog = Math.min(g.n, (g.prog || 0) + (n == null ? 1 : n)); if (g.prog >= g.n) { if (g.kind) completeLong(g); else complete(g); } }
  const longGoals = () => [...(st.wk ? st.wk.goals : []), ...(st.ss ? st.ss.goals : [])];
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
    longGoals().forEach(g => {
      if (g.done) return;
      if (g.t === 's_all' || (g.t === 's_area' && g.area === area) || (g.t === 's_star3' && score >= 85)) bump(g);
    });
    save();
  }
  function event(type, d) {
    ensure(); d = d || {};
    st.goals.forEach(g => {
      if (g.done) return;
      if (g.t === 'win_level' && type === 'levelWon') bump(g);
      else if (g.t === 'win_stars' && type === 'levelWon' && (d.stars || 0) >= g.stars) bump(g);
      else if (g.t === 'training' && type === 'training' && d.ok !== false) bump(g);
      else if (g.t === 'recon' && type === 'recon') bump(g);
    });
    longGoals().forEach(g => {
      if (g.done) return;
      if (g.t === 'levels' && type === 'levelWon') bump(g);
      else if (g.t === 'retos' && type === 'training' && d.ok !== false) bump(g);
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
      case 'training': return 'Completa 1 reto de la Campaña';
      case 'recon': return g.n > 1 ? 'Termina ' + g.n + ' rondas de Reconocer ingredientes' : 'Termina una ronda de Reconocer ingredientes';
      case 's_all': return 'Sirve ' + g.n + ' platos';
      case 's_area': return 'Sirve ' + g.n + ' platos de ' + AREA[g.area][1];
      case 's_star3': return 'Sirve ' + g.n + ' platos con calidad 85+ (⭐⭐⭐)';
      case 'levels': return 'Gana ' + g.n + ' niveles de Campaña';
      case 'retos': return 'Completa ' + g.n + ' retos de la Campaña';
    }
    return '';
  }
  const dotIcon = g => ICON[g.t] || '🎯';

  // ---------- nube: se guarda dentro de la instantánea de progreso de la cuenta (japon.js → get_game / save_game) ----------
  const goalScore = x => (x.goals || []).reduce((a, g) => a + (g.done ? 100 : 0) + (g.prog || 0), 0);
  function mergeSet(a, b) {                                             // semana o temporada: la más reciente; la misma, con el mayor avance de cada misión
    if (!a || !a.goals) return b || null; if (!b || !b.goals) return a;
    if (a.id !== b.id) return a.id > b.id ? a : b;
    return { id: a.id, goals: a.goals.map((g, i) => { const x = b.goals[i]; const o = Object.assign({}, g); if (x && x.t === g.t && x.n === g.n && x.area === g.area) { o.prog = Math.max(g.prog || 0, x.prog || 0); o.done = !!(g.done || x.done); o.paid = Math.max(g.paid || 0, x.paid || 0); } return o; }) };
  }
  function mergeSnap(a, b) {
    if (!a || a.v !== 1) return b && b.v === 1 ? b : (a || null);
    if (!b || b.v !== 1) return a;
    const out = { v: 1, streak: a.streak || 0, last: a.last || '' };
    if ((b.last || '') > (a.last || '') || ((b.last || '') === (a.last || '') && (b.streak || 0) > (a.streak || 0))) { out.streak = b.streak || 0; out.last = b.last || ''; }   // racha: la más reciente (si empatan, la mayor)
    const w = (a.day || '') !== (b.day || '') ? ((a.day || '') > (b.day || '') ? a : b) : (goalScore(b) > goalScore(a) ? b : a), o = w === a ? b : a;       // día más reciente; el mismo día, el que lleva más avance
    out.day = w.day || ''; out.goals = JSON.parse(JSON.stringify(w.goals || [])); out.chest = Math.max(a.day === w.day ? a.chest || 0 : 0, b.day === w.day ? b.chest || 0 : 0);
    out.wk = mergeSet(a.wk, b.wk) || undefined; out.ss = mergeSet(a.ss, b.ss) || undefined;
    if (o.day === w.day) out.goals = out.goals.map((g, i) => { const x = (o.goals || [])[i]; if (x && x.t === g.t && x.n === g.n && x.area === g.area && x.key === g.key) { g.prog = Math.max(g.prog || 0, x.prog || 0); g.done = !!(g.done || x.done); g.paid = Math.max(g.paid || 0, x.paid || 0); } return g; });
    return out;
  }
  const snap = () => { load(); return { v: 1, day: st.day, goals: st.goals, chest: st.chest, streak: st.streak, last: st.last, wk: st.wk, ss: st.ss }; };
  function apply(sn) {                                  // une lo que llega de la nube con lo local (sin volver a pagar premios: ya se cobraron donde se cumplieron)
    if (!sn || sn.v !== 1) return;
    load(); const m = mergeSnap(snap(), sn); if (!m) return;
    st = { v: 1, day: m.day || '', goals: m.goals || [], chest: m.chest || 0, streak: m.streak || 0, last: m.last || '', hardDone: false, wk: m.wk, ss: m.ss }; persist();
  }
  function reset() { st = null; try { localStorage.removeItem(KEY); } catch (e) {} }

  // ---------- API para el menú ----------
  function summary() {
    ensure(); const done = st.goals.filter(g => g.done).length;
    const lg = longGoals();
    return { done, total: st.goals.length, chestReady: done === st.goals.length && !st.chest, chestOpen: !!st.chest, streak: currentStreak(), mult: mult(), longDone: lg.filter(g => g.done).length, longTotal: lg.length };
  }
  // ---------- pantalla de Misiones ----------
  const CSS = `
  #svc { position: fixed; inset: 0; z-index: 9200; display: flex; flex-direction: column; background: radial-gradient(circle at 50% 0%, #4a2a14 0%, #1d0e08 70%); color: #fff3d6; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); overflow: hidden; }
  #svc * { box-sizing: border-box; }
  .sv-top { display: flex; align-items: center; gap: 8px; padding: 6px 12px 4px; flex: none; }
  .sv-nav { flex: none; width: 44px; height: 38px; border: 2px solid #8a5a00; border-radius: 10px; background: linear-gradient(#ffe082, #ffb300); color: #3b2208; font: 900 17px/1 'Fredoka', sans-serif; box-shadow: 0 3px 0 #8a5a00; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .sv-nav:active { transform: translateY(3px); box-shadow: none; }
  .sv-top h2 { margin: 0; flex: 1; font: 400 20px 'Fredoka One', 'Fredoka', sans-serif; color: #ffd978; text-shadow: 0 2px 0 rgba(0,0,0,.55); letter-spacing: .5px; }
  .sv-chip { background: rgba(0,0,0,.4); border: 1.5px solid rgba(255,204,80,.4); border-radius: 14px; padding: 3px 10px; font: 900 12px/1.2 'Fredoka', sans-serif; color: #ffe9b0; white-space: nowrap; }
  .sv-strip { flex: 1; min-height: 0; display: flex; gap: 22px; overflow-x: auto; overflow-y: hidden; padding: 6px 14px 10px; scroll-snap-type: x proximity; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .sv-strip::-webkit-scrollbar { display: none; }
  .sv-sec { flex: none; display: flex; flex-direction: column; gap: 6px; scroll-snap-align: start; }
  .sv-h { display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,.42); border: 1.5px solid rgba(255,204,80,.3); border-radius: 10px; padding: 5px 10px; }
  .sv-h i { font-style: normal; font-size: 16px; } .sv-h b { font: 900 11.5px 'Fredoka', sans-serif; letter-spacing: .6px; color: #fff3d6; } .sv-h small { margin-left: auto; font: 800 10.5px 'Fredoka', sans-serif; color: #e6c88a; white-space: nowrap; }
  .sv-cols { display: flex; gap: 8px; flex: 1; min-height: 0; }
  .sv-col { display: flex; flex-direction: column; gap: 7px; width: 236px; }
  .sv-card { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 4px; padding: 7px 9px 7px 12px; border: 2.5px solid #1a0e07; border-radius: 12px; background: linear-gradient(#5a3a20, #2e1a0e); box-shadow: 0 3px 0 rgba(0,0,0,.5); overflow: hidden; }
  .sv-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: var(--c, #ffb300); }
  .sv-card.easy { --c: #66bb6a; } .sv-card.med { --c: #ffb300; } .sv-card.hard { --c: #ef5350; } .sv-card.wk { --c: #ab47bc; } .sv-card.ss { --c: #26a69a; } .sv-card.chest { --c: #ffb300; }
  .sv-card.done { border-color: #43a047; background: linear-gradient(#2f5a2c, #1c3a1a); }
  .sv-tx { display: flex; align-items: center; gap: 8px; min-height: 0; flex: 1; }
  .sv-ic { flex: none; width: 38px; height: 38px; border-radius: 10px; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; font-size: 22px; line-height: 1; }
  .sv-tx b { font: 800 12.5px/1.2 'Fredoka', sans-serif; color: #fff3d6; } .sv-tx small { display: block; font: 800 9.5px 'Fredoka', sans-serif; letter-spacing: .5px; text-transform: uppercase; color: #c9a77e; margin-bottom: 1px; }
  .sv-bt { display: flex; align-items: center; gap: 6px; }
  .sv-bar { position: relative; flex: 1; height: 18px; border-radius: 9px; background: rgba(0,0,0,.5); border: 1.5px solid rgba(255,255,255,.14); overflow: hidden; }
  .sv-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; transform-origin: left; background: linear-gradient(90deg, #ffb300, #66bb6a); }
  .sv-bar span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 900 10.5px 'Fredoka', sans-serif; color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.7); }
  .sv-rw { flex: none; min-width: 52px; text-align: center; background: linear-gradient(#ffe082, #ffb300); color: #3b2208; border: 2px solid #8a5a00; border-radius: 9px; padding: 1px 6px; font: 900 11.5px/1.5 'Fredoka', sans-serif; }
  .sv-card.done .sv-rw { background: linear-gradient(#a5d6a7, #43a047); border-color: #14532d; color: #0b2e10; }
  .sv-open { flex: none; border: 2px solid #ffe082; border-radius: 10px; padding: 3px 14px; background: linear-gradient(135deg, #ff9800, #e64a19 65%, #c62828); color: #fff; font: 900 12px/1.5 'Fredoka', sans-serif; box-shadow: 0 3px 0 #7f0000; cursor: pointer; position: relative; }
  .sv-open::before { content: ''; position: absolute; inset: -9px -3px; }
  .sv-open:disabled { background: #555; border-color: #888; box-shadow: none; cursor: default; opacity: .7; }
  .sv-note { font: 700 10.5px/1.3 'Fredoka', sans-serif; color: #b9a583; }
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
  @media (prefers-reduced-motion: reduce) { #svc-chest .box { animation: none; } }
  `;
  function css() { if ($('svc-css')) return; const s = document.createElement('style'); s.id = 'svc-css'; s.textContent = CSS; document.head.appendChild(s); }
  function inject() { css(); }

  const card = (g, kind) => {
    const pct = g.n > 0 ? Math.min(1, (g.prog || 0) / g.n) : 0, rw = g.done ? (g.paid || g.rew) : (kind ? g.rew : Math.round(g.rew * mult()));
    return '<div class="sv-card ' + (kind || g.tier) + (g.done ? ' done' : '') + '"><div class="sv-tx"><span class="sv-ic">' + (g.done ? '✅' : dotIcon(g)) + '</span><div>' + (kind ? '' : '<small>' + TIER_NAME[g.tier] + '</small>') + '<b>' + describe(g) + '</b></div></div>'
      + '<div class="sv-bt"><div class="sv-bar"><i style="transform:scaleX(' + pct.toFixed(3) + ')"></i><span>' + (g.done ? '¡Cumplida!' : (g.prog || 0) + '/' + g.n) + '</span></div><span class="sv-rw">' + (g.done ? '✔ ' : '') + '🧧 ' + rw + '</span></div></div>';
  };
  function render() {
    ensure(); const sm = summary(), dn = st.goals.filter(g => g.done).length;
    const chest = '<div class="sv-card chest ' + (st.chest ? 'done' : '') + '"><div class="sv-tx"><span class="sv-ic" style="font-size:26px">' + (st.chest ? '✅' : '🎁') + '</span><div><small>Bonus del día</small><b>Cofre del Maestro</b></div></div>'
      + '<div class="sv-bt"><div class="sv-bar"><i style="transform:scaleX(' + (dn / st.goals.length).toFixed(3) + ')"></i><span>' + (st.chest ? 'Abierto' : dn + '/' + st.goals.length + ' metas') + '</span></div><button class="sv-open" ' + (sm.chestReady ? '' : 'disabled') + ' onclick="Servicio.chest()">' + (st.chest ? '✔' : 'Abrir') + '</button></div></div>';
    const streak = '<div class="sv-card"><div class="sv-tx"><span class="sv-ic">🔥</span><div><small>Racha</small><b>' + (sm.streak ? sm.streak + ' día' + (sm.streak > 1 ? 's' : '') + ' seguidos · +' + Math.round((sm.mult - 1) * 100) + ' % en las metas del día' : 'Cumple una meta hoy para empezar tu racha') + '</b></div></div><div class="sv-note">Un día sin jugar no rompe la racha; dos o más, sí.</div></div>';
    const sec = (ic, title, sub, body, attr) => '<section class="sv-sec"><div class="sv-h"><i>' + ic + '</i><b>' + title + '</b><small' + (attr ? ' data-end="' + attr[0] + '" data-pre="' + attr[1] + '"' : '') + '>' + sub + '</small></div><div class="sv-cols">' + body + '</div></section>';
    const col = h => '<div class="sv-col">' + h + '</div>';
    const wk = st.wk.goals, ss = st.ss.goals, half = Math.ceil(ss.length / 2);
    host().innerHTML = '<div class="sv-top"><button class="sv-nav" onclick="Servicio.close()" aria-label="Volver">◀</button><h2>MISIONES</h2><span class="sv-chip">🔥 Racha ' + sm.streak + '</span><span class="sv-chip">🧧 ' + (function () { try { return getPropinasWallet(); } catch (e) { return 0; } })() + '</span></div>'
      + '<div class="sv-strip" id="sv-strip">'
      + sec('🎯', 'MISIONES DIARIAS', 'Nuevas dentro de ' + left(msToday()), col(st.goals.map(g => card(g)).join('')) + col(chest + streak), [Date.now() + msToday(), 'Nuevas dentro de '])
      + sec('🌟', 'MISIONES ESPECIALES', 'Terminan dentro de ' + left(msWeek()), col(wk.map(g => card(g, 'wk')).join('')), [Date.now() + msWeek(), 'Terminan dentro de '])
      + sec('🏅', 'MISIONES DE TEMPORADA ' + seasonNo(), 'Termina dentro de ' + left(msSeason()), col(ss.slice(0, half).map(g => card(g, 'ss')).join('')) + col(ss.slice(half).map(g => card(g, 'ss')).join('')), [Date.now() + msSeason(), 'Termina dentro de '])
      + '</div>';
  }
  const host = () => { let h = $('svc'); if (!h) { h = document.createElement('div'); h.id = 'svc'; document.body.appendChild(h); } return h; };
  let cdTimer = null;
  function countdown() {                                                // actualiza las cuentas atrás cada 30 s mientras la pantalla está abierta
    clearInterval(cdTimer); cdTimer = setInterval(() => {
      const h = $('svc'); if (!h) { clearInterval(cdTimer); cdTimer = null; return; }
      h.querySelectorAll('.sv-h small[data-end]').forEach(e => { e.textContent = e.dataset.pre + left(+e.dataset.end - Date.now()); });
    }, 30000);
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
    open() { inject(); sfx('click'); render(); countdown(); },
    close() { clearInterval(cdTimer); cdTimer = null; const h = $('svc'); if (h) h.remove(); sfx('click'); try { if (window.Inicio && Inicio.refresh) Inicio.refresh(); } catch (e) {} },
    chest() { inject(); chestCeremony(); },
    event, summary, describe, snap, mergeSnap, apply, reset, _state: () => ensure()
  };

  // ---------- escucha de los eventos del juego ----------
  function wrap(name, fn) { const orig = window[name]; if (typeof orig !== 'function') return; window[name] = function () { const r = fn.call(this, orig, arguments); return r; }; }
  wrap('statsRecordDish', function (orig, args) {
    let prevN = 0; try { loadAccountProgressLocal(); const k = statsDishKey(getRecipeArea(args[0]), args[0].name); prevN = (((accountProgress.stats || {}).d || {})[k] || {}).n || 0; } catch (e) {}
    const r = orig.apply(this, args); try { onServe(args[0], args[1], prevN); } catch (e) { console.warn('[Servicio]', e); } return r;
  });
  wrap('recordCampaignLevelVictory', function (orig, args) { const r = orig.apply(this, args); try { event('levelWon', { stars: r && r.stars, level: args[0] }); } catch (e) {} return r; });
  wrap('trainingRecord', function (orig, args) { const r = orig.apply(this, args); try { event('training', { id: args[0] && args[0].id, ok: !(r && r.incomplete) }); } catch (e) {} return r; });
})();
