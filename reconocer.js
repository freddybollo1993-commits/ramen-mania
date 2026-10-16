/* Modo «Reconocer ingredientes»: practica qué lleva cada plato, sin reloj en contra.
   Un contador SUBE y mide cuánto demoras en reconocer los ingredientes de cada plato (y en total).
   Se elige el área y cuántos platos; para cada plato se marcan sus ingredientes entre varios (incluye distractores). */
(function () {
  'use strict';
  const KEY = 'ramen_recon_v1';
  const AREAS = [['todas', '🍱', 'Todas'], ['ramen', '🍜', 'Ramen'], ['salteados', '🥘', 'Salteado'], ['frituras', '🍤', 'Frituras'], ['makis', '🍣', 'Makis']];
  const COUNTS = [[5, '5 platos'], [10, '10 platos'], [0, 'Todos']];
  const store = () => (typeof safeStorage !== 'undefined' ? safeStorage : localStorage);
  let rec = null, R = null, timer = 0;
  const load = () => { if (rec) return rec; try { rec = JSON.parse(store().getItem(KEY) || 'null'); } catch (e) {} if (!rec || rec.v !== 1) rec = { v: 1, best: {}, runs: 0 }; return rec; };
  const save = () => { try { store().setItem(KEY, JSON.stringify(rec)); } catch (e) {} try { if (typeof japonSyncSoon === 'function') japonSyncSoon(); } catch (e) {} };
  const fmtT = s => { s = Math.max(0, s); const m = Math.floor(s / 60); return m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60).toFixed(1); };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ing = id => INGREDIENTES.find(i => i.id === id);

  function poolFor(area) {
    const cat = { ramen: ['ramen', RECETAS_RAMEN], salteados: ['salteados', RECETAS_SALTEADOS], frituras: ['frituras', RECETAS_FRITURAS.filter(r => r.metodo !== 'hervido')], makis: ['makis', RECETAS_MAKIS] };
    const keys = area === 'todas' ? Object.keys(cat) : [area];
    return keys.flatMap(k => cat[k][1].map(r => ({ r, area: k })));
  }
  // Receta COMPLETA como se cocina en la Campaña: la lista base + la parte de cocción de Salteado (SAL_STAGED) + las piezas de emplatado de cada área.
  // En Salteado manda el guion de la Campaña (SAL_STAGED: cocción + emplatado) y NO la lista base antigua: cada plato lleva SU corte de pollo
  // (cuadrado, en tiras, teriyaki, yakitori), que son ingredientes distintos y no se pueden confundir con el «Pollo» crudo.
  function ingredientsOf(item) {
    const r = item.r;
    try {
      if (item.area === 'salteados' && typeof SAL_STAGED !== 'undefined' && SAL_STAGED[r.name]) return [...new Set([...salCookIds(r.name), ...SAL_STAGED[r.name].plate])].filter(id => ing(id));
      const s = new Set(r.ingredients);
      if (typeof stParts === 'function') stParts(item.area, r).forEach(i => s.add(i));
      if (item.area === 'frituras' && typeof FRY_PLATING !== 'undefined' && FRY_PLATING[r.name]) s.add(FRY_PLATING[r.name].protein);
      return [...s].filter(id => ing(id) && !(item.area === 'makis' && (id === 96 || id === 97)));      // gari y wasabi son opcionales
    } catch (e) { return [...new Set(r.ingredients)]; }
  }
  function options(item) {
    const need = ingredientsOf(item), all = INGREDIENTES.filter(i => i.areas && i.areas.includes(item.area) && !need.includes(i.id));
    const extra = shuffle(all).slice(0, Math.min(all.length, Math.max(6, Math.round(need.length * 0.8))));
    return shuffle([...need, ...extra.map(i => i.id)]).filter(id => ing(id));
  }
  const CSS = `
  #rc-screen { position: fixed; inset: 0; z-index: 9000; background: linear-gradient(#2b1a12, #1a0d08); color: #fff3d6; font-family: 'Fredoka','Nunito',system-ui,sans-serif; display: flex; flex-direction: column; overflow: hidden; }
  #rc-screen * { box-sizing: border-box; }
  .rc-top { display: flex; align-items: center; gap: 8px; padding: calc(4px + env(safe-area-inset-top)) 10px 4px; background: #7a1f1f; min-height: 40px; flex-shrink: 0; }
  .rc-top h2 { margin: 0; font-size: 15px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rc-btn { border: 0; border-radius: 10px; padding: 7px 14px; font-weight: 900; font-size: 13px; background: #c9a24a; color: #2b1a08; cursor: pointer; font-family: inherit; }
  .rc-btn.green { background: #43a047; color: #fff; } .rc-btn.ghost { background: rgba(255,255,255,0.15); color: #fff3d6; } .rc-btn:disabled { opacity: 0.45; }
  .rc-clock { background: rgba(0,0,0,0.4); border-radius: 14px; padding: 2px 12px; font: 900 18px/1.2 monospace; color: #ffd54f; min-width: 92px; text-align: center; }
  .rc-clock small { display: block; font: 700 9px/1 sans-serif; color: #d7c08a; }
  .rc-body { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 6px 10px; gap: 6px; }
  .rc-dish { display: flex; align-items: center; gap: 10px; flex-shrink: 0; } .rc-dish b { font-size: 22px; color: #ffd54f; } .rc-dish span { font-size: 12px; color: #d7c08a; font-weight: 700; }
  .rc-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(74px, 1fr)); gap: 6px; overflow-y: auto; align-content: start; padding-bottom: 4px; }
  .rc-tile { background: #3a2418; border: 2px solid #6b4a30; border-radius: 10px; padding: 4px 2px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; min-height: 66px; user-select: none; transition: transform 0.1s; }
  .rc-tile img { width: 30px; height: 30px; object-fit: contain; } .rc-tile .ic { font-size: 26px; line-height: 30px; } .rc-tile small { font-size: 10px; font-weight: 800; line-height: 1.1; }
  .rc-tile:active { transform: scale(0.95); } .rc-tile.sel { border-color: #ffd54f; background: #5a3a14; box-shadow: 0 0 0 2px rgba(255,213,79,0.5); }
  .rc-tile.bad { border-color: #ef5350; background: #5a1f1f; animation: rcShake 0.4s; } .rc-tile.good { border-color: #66bb6a; background: #1f4a22; }
  @keyframes rcShake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
  .rc-foot { display: flex; gap: 8px; align-items: center; padding: 6px 10px calc(6px + env(safe-area-inset-bottom)); flex-shrink: 0; background: rgba(0,0,0,0.25); }
  .rc-msg { flex: 1; font-size: 12px; font-weight: 800; color: #ffe9a8; min-width: 0; }
  .rc-card { margin: auto; width: min(560px, 94%); background: #fff8e6; color: #3b2a1a; border: 3px solid #7a5a2a; border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 8px; max-height: 100%; overflow-y: auto; }
  .rc-card h3 { margin: 0; color: #7a1f1f; font-size: 18px; } .rc-card .row { display: flex; gap: 6px; flex-wrap: wrap; }
  .rc-opt { flex: 1 1 90px; background: #f4ead2; border: 2px solid #c9b78a; border-radius: 10px; padding: 8px 6px; text-align: center; font-weight: 900; font-size: 13px; cursor: pointer; } .rc-opt.sel { border-color: #b71c1c; background: #ffe9c9; }
  .rc-table { width: 100%; border-collapse: collapse; font-size: 12px; } .rc-table td, .rc-table th { padding: 3px 5px; border-bottom: 1px solid #e0d2ac; text-align: left; } .rc-table td:nth-child(n+2) { text-align: right; }
  .rc-stat { display: flex; gap: 6px; } .rc-stat div { flex: 1; background: #f4ead2; border-radius: 10px; padding: 5px; text-align: center; } .rc-stat b { display: block; font-size: 17px; color: #7a1f1f; } .rc-stat small { font-size: 10px; color: #6b5a3a; font-weight: 700; }
  .rc-chip { display: inline-block; background: #ffe082; color: #5a3a00; border-radius: 10px; padding: 0 7px; font-size: 11px; font-weight: 900; }
  `;
  function css() { if (document.getElementById('rc-css')) return; const s = document.createElement('style'); s.id = 'rc-css'; s.textContent = CSS; document.head.appendChild(s); }
  function root() { let el = document.getElementById('rc-screen'); if (!el) { el = document.createElement('div'); el.id = 'rc-screen'; document.body.appendChild(el); } return el; }
  const top = (title, clock) => `<div class="rc-top"><button class="rc-btn ghost" onclick="Recon.exit()">← Menú</button><h2>${title}</h2>${clock ? '<div class="rc-clock" id="rc-clock">0:00.0<small>TIEMPO TOTAL</small></div>' : ''}</div>`;

  // ---------- pantalla de inicio del modo ----------
  const sel = { area: 'todas', count: 5 };
  function renderMenu() {
    load(); css();
    const best = rec.best[sel.area + ':' + sel.count];
    root().innerHTML = top('🔍 Reconocer ingredientes', false) + `<div class="rc-body"><div class="rc-card"><h3>¿Qué lleva cada plato?</h3>
      <div style="font-size:12px;color:#6b5a3a;font-weight:600">Sin reloj en contra: solo un contador que mide cuánto demoras en reconocer los ingredientes de cada plato. Marca los ingredientes correctos entre varios (hay de más) y toca <b>Confirmar</b>.</div>
      <b style="font-size:12px">Área</b><div class="row">${AREAS.map(a => `<div class="rc-opt ${sel.area === a[0] ? 'sel' : ''}" onclick="Recon.set('area','${a[0]}')">${a[1]} ${a[2]}</div>`).join('')}</div>
      <b style="font-size:12px">Cantidad</b><div class="row">${COUNTS.map(c => `<div class="rc-opt ${sel.count === c[0] ? 'sel' : ''}" onclick="Recon.set('count',${c[0]})">${c[1]}</div>`).join('')}</div>
      <div style="font-size:12px;font-weight:700">${best ? `🏆 Tu mejor marca: <b>${fmtT(best.t)}</b> en total · ${(best.t / best.n).toFixed(1)} s por plato · ${Math.round(best.acc * 100)} % de aciertos a la primera` : 'Aún no tienes marca con esta combinación.'}</div>
      <div style="display:flex;justify-content:flex-end"><button class="rc-btn green" onclick="Recon.start()">▶ Empezar</button></div></div></div>`;
  }

  // ---------- partida ----------
  function begin() {
    const pool = shuffle(poolFor(sel.area)), n = sel.count || pool.length;
    R = { queue: pool.slice(0, n), idx: 0, t0: performance.now(), tStart: performance.now(), paused: false, pausedAt: 0, pauseTotal: 0, picks: new Set(), tries: 0, wrongTotal: 0, results: [], opts: [], locked: false };
    nextDish();
    clearInterval(timer); timer = setInterval(tick, 100);
  }
  const elapsed = () => (((R.paused ? R.pausedAt : performance.now()) - R.t0 - R.pauseTotal) / 1000);
  function tick() { if (!R) return; const c = document.getElementById('rc-clock'); if (c) c.firstChild.textContent = fmtT(elapsed()); }
  function nextDish() {
    const item = R.queue[R.idx]; R.item = item; R.picks = new Set(); R.tries = 0; R.wrong = 0; R.dishT0 = elapsed(); R.opts = options(item); R.locked = false;
    renderPlay();
  }
  function renderPlay(msg) {
    css(); const item = R.item, need = ingredientsOf(item).length;
    const tiles = R.opts.map(id => { const i = ing(id), src = i.img; return `<div class="rc-tile ${R.picks.has(id) ? 'sel' : ''}" data-id="${id}" onclick="Recon.toggle(${id})">${src ? `<img src="${src}" alt="" draggable="false">` : `<div class="ic">${i.icon}</div>`}<small>${i.short || i.display}</small></div>`; }).join('');
    root().innerHTML = top(`🔍 Plato ${R.idx + 1} de ${R.queue.length}`, true) + `<div class="rc-body"><div class="rc-dish"><b>${({ ramen: '🍜', salteados: '🥘', frituras: '🍤', makis: '🍣' })[item.area]} ${item.r.name}</b><span>Marca los <span class="rc-chip">${need}</span> ingredientes que lleva · tiempo de este plato: <span id="rc-dishclock">0.0 s</span></span></div><div class="rc-grid">${tiles}</div></div>
      <div class="rc-foot"><div class="rc-msg" id="rc-msg">${msg || `Seleccionados: ${R.picks.size} de ${need}`}</div><button class="rc-btn ghost" onclick="Recon.pause()">${R.paused ? '▶ Seguir' : '⏸ Pausa'}</button><button class="rc-btn green" onclick="Recon.confirm()">✔ Confirmar</button></div>`;
    tick();
  }
  setInterval(() => { if (R && R.item && !R.paused) { const e = document.getElementById('rc-dishclock'); if (e) e.textContent = (elapsed() - R.dishT0).toFixed(1) + ' s'; } }, 200);
  const A = {
    set(k, v) { sel[k] = v; renderMenu(); },
    start() { try { playSound('click'); } catch (e) {} begin(); },
    toggle(id) {
      if (!R || R.paused || R.locked) return;
      if (R.picks.has(id)) R.picks.delete(id); else R.picks.add(id);
      try { playSound('add'); } catch (e) {}
      const t = document.querySelector(`.rc-tile[data-id="${id}"]`); if (t) t.classList.toggle('sel', R.picks.has(id));
      const m = document.getElementById('rc-msg'); if (m) m.textContent = `Seleccionados: ${R.picks.size} de ${ingredientsOf(R.item).length}`;
    },
    pause() { if (!R) return; if (R.paused) { R.pauseTotal += performance.now() - R.pausedAt; R.paused = false; renderPlay(); } else { R.paused = true; R.pausedAt = performance.now(); renderPlay('⏸ En pausa: el contador está detenido'); } },
    confirm() {
      if (!R || R.paused || R.locked) return;
      const need = new Set(ingredientsOf(R.item)); R.tries++;
      const wrongSel = [...R.picks].filter(id => !need.has(id)), missing = [...need].filter(id => !R.picks.has(id));
      if (!wrongSel.length && !missing.length) {
        R.locked = true; const t = elapsed() - R.dishT0;
        R.results.push({ name: R.item.r.name, area: R.item.area, t, tries: R.tries, wrong: R.wrong });
        R.picks.forEach(id => { const el = document.querySelector(`.rc-tile[data-id="${id}"]`); if (el) { el.classList.remove('sel'); el.classList.add('good'); } });
        const m = document.getElementById('rc-msg'); if (m) m.textContent = `✅ ¡Correcto! ${t.toFixed(1)} s`;
        try { playSound('match'); } catch (e) {}
        setTimeout(() => { if (!R) return; R.idx++; if (R.idx >= R.queue.length) finish(); else nextDish(); }, 750);
      } else {
        const bad = wrongSel.length || 1; R.wrong += bad; R.wrongTotal += bad;                 // cuenta las marcas equivocadas (o 1 si solo faltaban)
        wrongSel.forEach(id => { R.picks.delete(id); const el = document.querySelector(`.rc-tile[data-id="${id}"]`); if (el) { el.classList.remove('sel'); el.classList.add('bad'); setTimeout(() => el.classList.remove('bad'), 700); } });
        try { playSound('error'); } catch (e) {}
        const m = document.getElementById('rc-msg'); if (m) m.textContent = `❌ ${wrongSel.length ? `Sobran ${wrongSel.length} (los quité). ` : ''}${missing.length ? `Te faltan ${missing.length}.` : ''} El contador sigue.`;
      }
    },
    exit() { clearInterval(timer); R = null; const el = document.getElementById('rc-screen'); if (el) el.remove(); },
    again() { begin(); },
    menu() { clearInterval(timer); R = null; renderMenu(); }
  };
  function finish() {
    clearInterval(timer); load();
    const total = elapsed(), n = R.results.length, firstTry = R.results.filter(r => r.tries === 1).length, acc = n ? firstTry / n : 0, key = sel.area + ':' + sel.count;
    const prev = rec.best[key], isBest = !prev || total < prev.t; rec.runs++;
    if (isBest) rec.best[key] = { t: total, n, acc }; save();
    const rows = R.results.map(r => `<tr><td>${r.name}</td><td>${r.t.toFixed(1)} s</td><td>${r.tries === 1 ? '✅' : '↻ ' + r.tries}</td></tr>`).join('');
    const slow = [...R.results].sort((a, b) => b.t - a.t).slice(0, 3).map(r => r.name).join(', ');
    root().innerHTML = top('🔍 Resultado', false) + `<div class="rc-body"><div class="rc-card"><h3>${isBest ? '🏆 ¡Nueva mejor marca!' : '¡Listo!'}</h3>
      <div class="rc-stat"><div><b>${fmtT(total)}</b><small>Tiempo total</small></div><div><b>${(total / n).toFixed(1)} s</b><small>Por plato</small></div><div><b>${Math.round(acc * 100)} %</b><small>A la primera</small></div><div><b>${R.wrongTotal}</b><small>Errores</small></div></div>
      ${slow ? `<div style="font-size:12px;font-weight:700">🐢 Los que más te costaron: ${slow}</div>` : ''}
      ${prev ? `<div style="font-size:12px;color:#6b5a3a">Marca anterior: ${fmtT(prev.t)}</div>` : ''}
      <table class="rc-table"><tr><th>Plato</th><th>Tiempo</th><th>Intentos</th></tr>${rows}</table>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button class="rc-btn" onclick="Recon.menu()">Cambiar opciones</button><button class="rc-btn green" onclick="Recon.again()">🔄 Otra vez</button></div></div></div>`;
    try { playSound('win'); } catch (e) {}
  }
  window.Recon = A;
  window.reconOpen = () => { renderMenu(); };
  // para el guardado en la cuenta: mejores marcas (se combinan tomando el menor tiempo)
  window.reconGet = () => { load(); return { best: rec.best, runs: rec.runs }; };
  window.reconMerge = o => { load(); if (!o || !o.best) return; Object.keys(o.best).forEach(k => { const b = o.best[k]; if (b && typeof b.t === 'number' && (!rec.best[k] || b.t < rec.best[k].t)) rec.best[k] = { t: b.t, n: b.n || 1, acc: b.acc || 0 }; }); rec.runs = Math.max(rec.runs || 0, o.runs || 0); try { store().setItem(KEY, JSON.stringify(rec)); } catch (e) {} };
  function install() {
    const row = document.getElementById('start-btn-row-box');
    if (row && !document.getElementById('btn-recon')) {
      const b = document.createElement('button');
      b.className = 'btn-start-sec'; b.id = 'btn-recon'; b.title = 'Practica qué ingredientes lleva cada plato (sin reloj en contra)';
      b.setAttribute('onclick', 'reconOpen()'); b.innerHTML = '<span class="btn-ico">🔍</span><span>Ingredientes</span>';
      const rb = row.querySelector('.btn-recipe'); row.insertBefore(b, rb ? rb.nextSibling : row.firstChild);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
