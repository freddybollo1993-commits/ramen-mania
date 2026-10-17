/* Recetario como colección (Mi Restaurante → Recetario): una tarjeta por plato, con sus estrellas de dominio, lo que falta para desbloquearlo
   y su receta completa de Campaña (cocción + emplatado). Las estrellas salen de las estadísticas reales de la cuenta (calidad media de cada plato).
   Script clásico: usa los datos globales del juego (RECETAS_*, AREA_DISH_UNLOCKS, NIVELES, INGREDIENTES, SAL_STAGED, FRY_PLATING, accountProgress). */
(function () {
  'use strict';
  const AREAS = [['ramen', '🍜', 'Ramen', '#ff9800'], ['salteados', '🍳', 'Salteado', '#ef5350'], ['makis', '🍣', 'Makis', '#26a69a'], ['frituras', '🍤', 'Frituras', '#ffb300']];
  const AREA = Object.fromEntries(AREAS.map(a => [a[0], { ic: a[1], name: a[2], col: a[3] }]));
  const OPTIONAL = { makis: [96, 97] };                 // gari y wasabi los pone el jugador si quiere
  let tab = 'todas', open = null;
  const $ = id => document.getElementById(id);
  const sfx = n => { try { playSound(n); } catch (e) {} };
  const ing = id => INGREDIENTES.find(i => i.id === id);
  const iname = id => { const i = ing(id); return i ? (i.short || i.display) : String(id); };

  // ---------- datos ----------
  function catalog() {
    const out = [];
    const lists = { ramen: RECETAS_RAMEN, salteados: RECETAS_SALTEADOS, makis: RECETAS_MAKIS, frituras: RECETAS_FRITURAS };
    Object.keys(lists).forEach(area => lists[area].forEach(r => {
      if (r.metodo === 'hervido') return;               // las gyozas hervidas todavía no se pueden pedir
      let req = null;
      if (area === 'ramen') { const n = NIVELES.find(l => l.ramen_names.includes(r.name)); req = n ? n.level : null; }
      else { const u = (AREA_DISH_UNLOCKS[area] || []).find(d => d[0] === r.name); req = u ? u[1] : null; }
      out.push({ area, r, req, key: statsDishKey(area, r.name) });
    }));
    return out;
  }
  function recipeParts(area, r) {                       // receta completa de Campaña: [cocción, emplatado]
    let cook, plate;
    try {
      if (area === 'salteados' && SAL_STAGED[r.name]) { cook = salCookIds(r.name); plate = SAL_STAGED[r.name].plate.slice(); }
      else {
        plate = stParts(area, r).slice(); const s = new Set(r.ingredients); plate.forEach(i => s.add(i));
        if (area === 'frituras' && FRY_PLATING[r.name]) s.add(FRY_PLATING[r.name].protein);
        cook = [...s].filter(i => !plate.includes(i));
      }
    } catch (e) { cook = r.ingredients.slice(); plate = []; }
    const opt = OPTIONAL[area] || [];
    return [cook.filter(i => !opt.includes(i)), plate.filter(i => !opt.includes(i) && !cook.includes(i))];
  }
  function stat(c) {
    let d = null; try { loadAccountProgressLocal(); d = (accountProgress.stats && accountProgress.stats.d || {})[c.key] || null; } catch (e) {}
    const n = d ? d.n || 0 : 0, avg = n ? d.s / n : 0;
    return { n, avg, best: d ? d.b || 0 : 0, s3: d ? d.s3 || 0 : 0, stars: !n ? 0 : (avg >= 85 ? 3 : (avg >= 60 ? 2 : 1)) };
  }
  const unlockedLevel = () => { try { return getCampaignStatsSummary().unlockedLevel || 1; } catch (e) { return 1; } };
  // ingrediente que identifica a cada plato (el que lo distingue de los demás de su área)
  const EMBLEM = { 'Shio': 2, 'Shoyu': 5, 'Miso': 6, 'Tonkotsu': 3, 'Chashu': 11, 'Ebi': 14, 'Tan tan': 13, 'Vegetariano': 16, 'Bajiru': 12,
    'Chaufa Shimaya': 48, 'Chicken Teriyaki': 106, 'Batayaki Ramen': 61, 'Yakimeshi': 40, 'Yakiramen': 105, 'Yasaitame': 90, 'Yakitori': 107, 'Karameshi': 35, 'Omuraisu': 93,
    'Chicken Katsu': 44, 'Age Gyozas': 73, 'Alitas Acevichadas': 77, 'Alitas Digión': 80, 'Ebi Furai': 60, 'Kaarage': 70, 'Katsu Kare': 83, 'Tonkatsu': 43,
    'Maki Acevichado': 49, 'Maki Furai': 54, 'Maki Hotate': 50, 'Maki California': 72, 'Maki Guacamole': 81, 'Maki Yama': 89, 'Maki Nin Niku': 85, 'Maki Amazon': 51, 'Maki Digion': 80 };
  function emblem(c) {
    const m = EMBLEM[c.r.name] && ing(EMBLEM[c.r.name]); if (m) return m;
    const [cook, plate] = recipeParts(c.area, c.r), all = cook.concat(plate).map(ing).filter(Boolean);
    return all.find(i => i.cat === 'proteinas' && i.img) || all.find(i => i.img) || all[0] || null;
  }
  const ico = i => !i ? '🍽️' : (i.img ? `<img src="${i.img}" alt="" draggable="false">` : `<span>${i.icon}</span>`);

  // ---------- resumen para el menú ----------
  function summary() {
    const cat = catalog(), U = unlockedLevel();
    let tried = 0, stars = 0, fresh = 0, unlocked = 0;
    cat.forEach(c => { const s = stat(c); if (c.req != null && c.req <= U) { unlocked++; if (!s.n) fresh++; } if (s.n) tried++; stars += s.stars; });
    return { total: cat.length, tried, stars, maxStars: cat.length * 3, fresh, unlocked };
  }

  // ---------- pantalla ----------
  const CSS = `
  #rcb { position: fixed; inset: 0; z-index: 9100; display: flex; flex-direction: column; background: radial-gradient(circle at 50% 0%, #4a2a14 0%, #1d0e08 70%); color: #fff3d6; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; overflow: hidden;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
  #rcb * { box-sizing: border-box; }
  .rcb-top { display: flex; align-items: center; gap: 8px; padding: 6px 12px 4px; flex-shrink: 0; }
  .rcb-back { flex: none; width: 40px; height: 34px; border: 2px solid #8a5a00; border-radius: 10px; background: linear-gradient(#ffe082, #ffb300); color: #3b2208; font: 900 16px/1 'Fredoka', sans-serif; box-shadow: 0 2px 0 #8a5a00; cursor: pointer; }
  .rcb-top h2 { margin: 0; font: 400 19px 'Fredoka One', 'Fredoka', sans-serif; color: #ffd978; text-shadow: 0 2px 0 rgba(0,0,0,.5); flex: 1; white-space: nowrap; }
  .rcb-chip { background: rgba(0,0,0,.4); border: 1.5px solid rgba(255,204,80,.4); border-radius: 14px; padding: 3px 10px; font: 800 12px/1.2 'Fredoka', sans-serif; color: #ffe9b0; white-space: nowrap; }
  .rcb-tabs { display: flex; gap: 6px; padding: 2px 12px 6px; overflow-x: auto; flex-shrink: 0; scrollbar-width: none; }
  .rcb-tabs::-webkit-scrollbar { display: none; }
  .rcb-tab { flex: none; border: 2px solid rgba(255,255,255,.18); background: rgba(0,0,0,.35); color: #e9d5b0; border-radius: 12px; padding: 5px 12px; font: 800 12px/1 'Fredoka', sans-serif; cursor: pointer; }
  .rcb-tab.on { background: linear-gradient(#ffd54f, #ffa000); border-color: #fff3d0; color: #2b1a08; box-shadow: 0 2px 0 #8a5a00; }
  .rcb-tab small { opacity: .75; margin-left: 4px; }
  .rcb-grid { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; padding: 6px 12px 14px; align-content: start; -webkit-overflow-scrolling: touch; }
  .rcb-card { position: relative; border: 2.5px solid #1a0e07; border-radius: 14px; background: linear-gradient(#5a3a20, #2e1a0e); cursor: pointer; padding: 0; overflow: hidden; text-align: center; color: inherit; font-family: inherit; box-shadow: 0 3px 0 rgba(0,0,0,.5); display: flex; flex-direction: column; min-height: 142px; }
  .rcb-card:active { transform: translateY(1px); }
  .rcb-art { height: 62px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--c), rgba(0,0,0,.35)); border-bottom: 2px solid rgba(0,0,0,.45); }
  .rcb-art img { width: 48px; height: 48px; object-fit: contain; filter: drop-shadow(0 2px 3px rgba(0,0,0,.5)); } .rcb-art span { font-size: 34px; line-height: 1; }
  .rcb-ar { position: absolute; left: 4px; top: 3px; font-size: 13px; text-shadow: 0 1px 2px rgba(0,0,0,.8); }
  .rcb-name { font: 800 13px/1.1 'Fredoka', sans-serif; padding: 5px 4px 0; color: #fff3d6; min-height: 30px; display: flex; align-items: center; justify-content: center; }
  .rcb-stars { font-size: 13px; letter-spacing: 1px; margin-top: auto; padding: 0 0 2px; color: #ffd54f; text-shadow: 0 1px 0 #000; } .rcb-stars i { font-style: normal; opacity: .28; filter: grayscale(1); } .rcb-stars i.on { opacity: 1; filter: none; }
  .rcb-meta { font: 700 10px/1.2 'Fredoka', sans-serif; color: #c9a77e; padding: 0 4px 6px; }
  .rcb-new { position: absolute; right: -2px; top: 4px; transform: rotate(8deg); background: #e53935; color: #fff; font: 900 9px/1 'Fredoka', sans-serif; padding: 3px 6px; border-radius: 7px 0 0 7px; border: 1.5px solid #fff3d0; border-right: 0; animation: rcbPulse 1.3s ease-in-out infinite; }
  @keyframes rcbPulse { 0%, 100% { transform: rotate(8deg) scale(1); } 50% { transform: rotate(8deg) scale(1.1); } }
  .rcb-card.locked { background: linear-gradient(#3a3a3a, #1f1f1f); filter: grayscale(.85); } .rcb-card.locked .rcb-art { background: #262626; } .rcb-card.locked .rcb-art img { opacity: .35; }
  .rcb-lock { position: absolute; inset: 0 0 auto 0; height: 62px; display: flex; align-items: center; justify-content: center; font-size: 26px; text-shadow: 0 2px 4px #000; }
  .rcb-sheet { position: absolute; inset: 0; z-index: 3; background: rgba(10,5,2,.82); display: flex; align-items: center; justify-content: center; padding: 10px; }
  .rcb-det { width: min(640px, 100%); max-height: 100%; overflow-y: auto; background: linear-gradient(#4a2a14, #2b1810); border: 3px solid #1a0e07; outline: 2px solid var(--c); border-radius: 16px; padding: 12px 14px; display: grid; grid-template-columns: 120px 1fr; gap: 12px; }
  .rcb-det .big { display: flex; flex-direction: column; align-items: center; gap: 4px; } .rcb-det .big .rcb-art { width: 110px; height: 110px; border-radius: 14px; border: 2px solid rgba(0,0,0,.5); } .rcb-det .big .rcb-art img { width: 84px; height: 84px; } .rcb-det .big .rcb-art span { font-size: 56px; }
  .rcb-det h3 { margin: 0; font: 400 20px 'Fredoka One', 'Fredoka', sans-serif; color: #ffe9b0; } .rcb-det .sub { font: 700 11px 'Fredoka', sans-serif; color: #c9a77e; margin-bottom: 6px; }
  .rcb-det h4 { margin: 8px 0 4px; font: 900 11px 'Fredoka', sans-serif; letter-spacing: .6px; text-transform: uppercase; color: #ffd978; }
  .rcb-ings { display: flex; flex-wrap: wrap; gap: 4px; } .rcb-ing { display: inline-flex; align-items: center; gap: 3px; background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.14); border-radius: 9px; padding: 2px 7px 2px 3px; font: 700 11px 'Fredoka', sans-serif; }
  .rcb-ing img { width: 20px; height: 20px; object-fit: contain; } .rcb-ing span.e { font-size: 16px; line-height: 1; width: 20px; text-align: center; }
  .rcb-kv { display: flex; gap: 6px; flex-wrap: wrap; margin: 4px 0; } .rcb-kv b { background: rgba(255,255,255,.08); border-radius: 9px; padding: 3px 8px; font: 800 11px 'Fredoka', sans-serif; }
  .rcb-btns { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .rcb-btn { border: 2px solid #ffe082; border-radius: 12px; padding: 7px 14px; background: linear-gradient(135deg, #ff9800, #e64a19 65%, #c62828); color: #fff; font: 900 12px/1 'Fredoka', sans-serif; box-shadow: 0 3px 0 #7f0000; cursor: pointer; }
  .rcb-btn.ghost { background: rgba(255,255,255,.1); color: #ffe082; box-shadow: 0 3px 0 rgba(0,0,0,.35); }
  @media (max-height: 460px) { .rcb-det { grid-template-columns: 96px 1fr; padding: 8px 10px; } .rcb-det .big .rcb-art { width: 90px; height: 90px; } .rcb-det .big .rcb-art img { width: 66px; height: 66px; } }
  @media (prefers-reduced-motion: reduce) { .rcb-new { animation: none; } }
  `;
  function css() { if ($('rcb-css')) return; const s = document.createElement('style'); s.id = 'rcb-css'; s.textContent = CSS; document.head.appendChild(s); }
  const starsHtml = n => `<div class="rcb-stars">${[1, 2, 3].map(k => `<i class="${k <= n ? 'on' : ''}">★</i>`).join('')}</div>`;

  function render() {
    let host = $('rcb'); if (!host) { host = document.createElement('div'); host.id = 'rcb'; document.body.appendChild(host); }
    const cat = catalog(), U = unlockedLevel(), sm = summary();
    const shown = cat.filter(c => tab === 'todas' || c.area === tab);
    const cnt = a => cat.filter(c => a === 'todas' || c.area === a);
    const tabs = [['todas', '🍱', 'Todas']].concat(AREAS.map(a => [a[0], a[1], a[2]])).map(([k, ic, nm]) => {
      const l = cnt(k), t = l.filter(c => stat(c).n).length; return `<button class="rcb-tab ${tab === k ? 'on' : ''}" onclick="Recetario.tab('${k}')">${ic} ${nm}<small>${t}/${l.length}</small></button>`; }).join('');
    const cards = shown.map(c => {
      const s = stat(c), A = AREA[c.area], locked = c.req == null || c.req > U, em = emblem(c);
      return `<button class="rcb-card ${locked ? 'locked' : ''}" style="--c:${A.col}" onclick="Recetario.show('${c.key}')" aria-label="${c.r.name}">
        <div class="rcb-art">${ico(em)}</div><span class="rcb-ar">${A.ic}</span>${locked ? '<div class="rcb-lock">🔒</div>' : (!s.n ? '<i class="rcb-new">¡PROBAR!</i>' : '')}
        <div class="rcb-name">${c.r.name}</div>
        ${locked ? `<div class="rcb-meta" style="margin-top:auto;padding-bottom:8px">${c.req == null ? 'Próximamente' : 'Llega al nivel ' + c.req}</div>` : `${starsHtml(s.stars)}<div class="rcb-meta">${s.n ? s.n + ' servidos' : 'S/ ' + c.r.price}</div>`}
      </button>`;
    }).join('');
    host.innerHTML = `<div class="rcb-top"><button class="rcb-back" onclick="Recetario.close()" aria-label="Cerrar">◀</button><h2>📖 RECETARIO</h2>
        <span class="rcb-chip">🍽️ ${sm.tried}/${sm.total} probados</span><span class="rcb-chip">⭐ ${sm.stars}/${sm.maxStars}</span></div>
      <div class="rcb-tabs">${tabs}</div><div class="rcb-grid" id="rcb-grid">${cards}</div>${open ? sheet(open) : ''}`;
  }

  function sheet(key) {
    const c = catalog().find(x => x.key === key); if (!c) return '';
    const s = stat(c), A = AREA[c.area], locked = c.req == null || c.req > unlockedLevel(), [cook, plate] = recipeParts(c.area, c.r), em = emblem(c);
    const chips = ids => ids.map(id => { const i = ing(id); return `<span class="rcb-ing">${i && i.img ? `<img src="${i.img}" alt="" draggable="false">` : `<span class="e">${i ? i.icon : '•'}</span>`}${iname(id)}</span>`; }).join('');
    const mastery = !s.n ? 'Sin probar' : (s.stars === 3 ? 'Maestro' : (s.stars === 2 ? 'Cocinero' : 'Aprendiz'));
    return `<div class="rcb-sheet" onclick="Recetario.hide()"><div class="rcb-det" style="--c:${A.col}" onclick="event.stopPropagation()">
      <div class="big"><div class="rcb-art" style="--c:${A.col}">${ico(em)}</div>${starsHtml(s.stars)}<div class="rcb-meta">${locked ? '🔒 Bloqueado' : mastery}</div></div>
      <div><h3>${c.r.name}</h3><div class="sub">${A.ic} ${A.name} · ${c.req == null ? 'aún no entra al menú (se termina en Frituras)' : 'entra en el nivel ' + c.req + ' de Campaña'}</div>
        <div class="rcb-kv"><b>💰 S/ ${c.r.price}</b>${locked ? '' : `<b>🍽️ ${s.n} servidos</b><b>📊 calidad ${s.n ? Math.round(s.avg) : '—'}</b><b>🏆 mejor ${s.n ? Math.round(s.best) : '—'}</b>`}</div>
        <h4>En la cocina</h4><div class="rcb-ings">${chips(cook)}</div>
        ${plate.length ? `<h4>Al emplatar</h4><div class="rcb-ings">${chips(plate)}</div>` : ''}
        ${c.area === 'makis' ? '<div class="rcb-meta" style="margin-top:6px">Gari y wasabi: opcionales, a tu criterio.</div>' : ''}
        <div class="rcb-btns">${locked ? '' : `<button class="rcb-btn" onclick="Recetario.practice('${c.area}')">🌿 Practicar en Cocina libre</button>`}<button class="rcb-btn ghost" onclick="Recetario.hide()">Cerrar</button></div>
      </div></div></div>`;
  }

  window.Recetario = {
    open() { css(); open = null; tab = 'todas'; sfx('click'); render(); },
    close() { sfx('click'); open = null; const h = $('rcb'); if (h) h.remove(); try { if (window.Inicio && Inicio.refresh) { /* el menú recalcula sus avisos al volver */ } } catch (e) {} },
    tab(k) { tab = k; sfx('click'); render(); },
    show(key) { open = key; sfx('click'); render(); },
    hide() { open = null; render(); },
    practice(area) { const h = $('rcb'); if (h) h.remove(); open = null; try { Inicio.act('free', area); } catch (e) { console.warn('Recetario.practice', e); } },
    summary
  };
})();
