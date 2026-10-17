/* Modos de juego (Jugar): pantalla completa con una tira horizontal de tarjetas por categoría y la barra de categorías abajo.
   Categorías: CAMPAÑA (5 arcos), RASH (supervivencia), RECORRIDO POR JAPÓN (9 ciudades) y ONLINE (multijugador).
   Desliza a los lados o toca una categoría de la barra; cada tarjeta lleva a su modo. Script clásico.
   Las ilustraciones son provisionales (degradados, emoji y dibujos de ingredientes) hasta tener el arte de cada tarjeta. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const sfx = n => { try { playSound(n); } catch (e) {} };
  const toast = m => { try { showStationToast(m); } catch (e) {} };
  const ing = id => (typeof INGREDIENTES !== 'undefined' ? INGREDIENTES.find(i => i.id === id) : null);
  const imgOf = id => { const i = ing(id); return i && i.img ? `<img src="${i.img}" alt="" draggable="false">` : `<span>${i ? i.icon : '🍜'}</span>`; };
  const tutDone = () => { try { return isTutorialCompleted(); } catch (e) { return false; } };
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } } };

  // ---------- datos de cada categoría ----------
  const campStats = () => { try { return getCampaignStatsSummary(); } catch (e) { return { stars: 0, maxStars: 60, unlockedLevel: 1 }; } };
  function arcStars(arc) { let st = 0; try { const lv = loadCampaignProgress().levels || {}; arc.levels.forEach(n => { st += Number((lv[n] || {}).stars) || 0; }); } catch (e) {} return st; }
  const ARC_ART = { ramen: 11, salteado: 48, makis: 49, frituras: 43, maestria: null };
  const ARC_COL = { ramen: '#ff9800', salteado: '#ef5350', makis: '#26a69a', frituras: '#ffb300', maestria: '#ab47bc' };
  function japonCities() { try { return (window.JP && JP.cities) ? JP.cities() : []; } catch (e) { return []; } }
  const rashBest = () => parseInt(store.get('ramen_mania_rash_level') || '1', 10) || 1;

  const CATS = [
    { id: 'camp', name: 'CAMPAÑA', col: '#ff9800', build() {
      const cs = campStats(), L = Math.min(20, cs.unlockedLevel || 1), arcs = (typeof CAMPAIGN_ARCS !== 'undefined' ? CAMPAIGN_ARCS : []);
      return {
        feat: { title: 'CAMPAÑA', art: 'camp', panels: ['20 niveles en 5 arcos: del primer caldo a la cocina completa.', 'Gana hasta 3 ⭐ por servicio impecable y repite niveles para mejorar.'],
          cta: '✔ ELEGIR CAMPAÑA', go: ['camp'], meta: `⭐ ${cs.stars}/${cs.maxStars}` },
        cards: arcs.map((a, i) => { const open = a.levels[0] <= (cs.unlockedLevel || 1), st = arcStars(a);
          return { col: ARC_COL[a.id] || '#ff9800', icon: a.icon, title: a.name.toUpperCase(), sub: `Niveles ${a.levels[0]}–${a.levels[a.levels.length - 1]}`, meta: open ? `⭐ ${st}/${a.levels.length * 3}` : `🔒 Llega al nivel ${a.levels[0]}`, locked: !open,
            art: ARC_ART[a.id] != null ? imgOf(ARC_ART[a.id]) : '<span>🏆</span>', info: `${a.name}: ${a.areas}. Niveles ${a.levels.join(', ')}.`, go: ['camp', a.id] }; })
      };
    } },
    { id: 'rash', name: 'RASH', col: '#e53935', build() {
      const b = rashBest();
      return {
        feat: { title: 'RASH', art: 'rash', panels: ['Supervivencia extrema: los clientes llegan cada vez más rápido.', 'Tienes 3 vidas. Cada ronda desbloquea platos y cocinas nuevas.'], cta: '✔ ELEGIR RASH', go: ['rash'], meta: `Récord: ronda ${b}` },
        cards: [
          { col: '#e53935', icon: '🏆', title: 'TU RÉCORD', sub: 'Ronda ' + b, meta: 'Mejor marca', art: '<span>🏆</span>', info: 'Tu ronda más alta en Rash.', go: ['rash'] },
          { col: '#8e24aa', icon: '🔓', title: 'ETAPAS', sub: 'Por rondas', meta: 'Ramen, wok, makis y frituras', art: '<span>🔥</span>', info: 'Las cocinas se activan poco a poco: Ramen desde la ronda 3, Salteado 9, Makis 16 y Frituras 27.', go: ['rash'] }
        ]
      };
    } },
    { id: 'japon', name: 'RECORRIDO POR JAPÓN', col: '#ec407a', build() {
      const cities = japonCities();
      return {
        feat: { title: 'RECORRIDO POR JAPÓN', art: 'japon', panels: ['Abre un restaurante en cada ciudad: producen soles aunque estés fuera.', 'Mejora cocineros, mesas y objetos; domina la ciudad para desbloquear sus platos.'], cta: '✔ ELEGIR EL RECORRIDO', go: ['japon'], meta: cities.length ? `${cities.filter(c => c.open).length}/${cities.length} ciudades` : '' },
        cards: cities.map(c => ({ col: c.open ? '#ec407a' : '#6d4c6e', icon: '⛩️', title: c.name.toUpperCase(), sub: c.region, meta: c.open ? '✔ Abierta' : '🔒 S/ ' + Number(c.cost).toLocaleString('es-PE'), locked: !c.open, art: '<span>' + (c.open ? '🏯' : '🔒') + '</span>', info: c.story || c.name, go: ['japon', c.id] }))
      };
    } },
    { id: 'online', name: 'ONLINE', col: '#1e88e5', build() {
      return {
        feat: { title: 'MULTIJUGADOR', art: 'online', panels: ['Juega con amigos en línea, en sala privada.', 'Compite por quitarte los clientes o cocina junto a tu equipo.'], cta: '✔ ELEGIR ONLINE', go: ['online', 'VS'], meta: 'Tiempo real' },
        cards: [
          { col: '#e53935', icon: '⚔️', title: 'ARREBATO', sub: 'Versus', meta: '1 contra 1', art: '<span>⚔️</span>', info: 'Versus: compites por los clientes con tu rival (MMR).', go: ['online', 'VS'] },
          { col: '#43a047', icon: '🤝', title: 'COCINA COMPARTIDA', sub: 'Cooperativo', meta: 'En equipo', art: '<span>🤝</span>', info: 'Cooperativo: cada uno atiende una estación y la meta es del equipo.', go: ['online', 'COOP'] }
        ]
      };
    } }
  ];

  // ---------- pantalla ----------
  const CSS = `
  #mds { position: fixed; inset: 0; z-index: 9150; display: flex; flex-direction: column; color: #fff3d6; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; overflow: hidden;
    background: radial-gradient(circle at 20% 0%, #5a2c14 0%, #24100a 55%, #120806 100%); padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
  #mds * { box-sizing: border-box; }
  #mds::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .06; background: repeating-linear-gradient(45deg, #fff 0 2px, transparent 2px 22px); }
  .mds-top { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; padding: 0 max(0px, env(safe-area-inset-right)) 0 max(0px, env(safe-area-inset-left)); flex-shrink: 0; height: 44px; }
  .mds-nav { height: 42px; min-width: 64px; border: 0; background: #2b2018; color: #fff; font: 900 22px/1 'Fredoka', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; border-bottom: 3px solid #0e0805; }
  .mds-nav.l { border-radius: 0 0 14px 0; } .mds-nav.r { border-radius: 0 0 0 14px; }
  .mds-top h2 { margin: 0; font: 400 18px 'Fredoka One', 'Fredoka', sans-serif; color: #ffd978; text-shadow: 0 2px 0 rgba(0,0,0,.6); letter-spacing: .6px; }
  .mds-strip { position: relative; z-index: 1; flex: 1; min-height: 0; display: flex; align-items: stretch; gap: 22px; overflow-x: auto; overflow-y: hidden; padding: 6px 18px 8px; scroll-snap-type: x proximity; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .mds-strip::-webkit-scrollbar { display: none; }
  .mds-sec { flex: none; display: flex; flex-direction: column; min-width: 0; scroll-snap-align: start; }
  .mds-sec > h4 { margin: 0 0 4px; text-align: center; font: 900 11px 'Fredoka', sans-serif; letter-spacing: .8px; color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,.6); }
  .mds-body { flex: 1; min-height: 0; display: flex; gap: 8px; }
  .mds-grid { display: grid; grid-template-rows: repeat(2, minmax(0, 1fr)); grid-auto-flow: column; grid-auto-columns: 162px; gap: 8px; }
  .mds-feat { position: relative; width: 262px; flex: none; border: 3px solid #0e0805; border-radius: 12px; overflow: hidden; background: var(--bg, #333); box-shadow: 0 4px 0 rgba(0,0,0,.5); display: flex; flex-direction: column; justify-content: space-between; padding: 8px 10px 10px; text-align: left; }
  .mds-feat::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0,0,0,.05), rgba(0,0,0,.6)); }
  .mds-feat > * { position: relative; }
  .mds-ft { margin: 2px 0 6px; font: 400 25px/1 'Fredoka One', 'Fredoka', sans-serif; font-style: italic; color: #ffe94d; text-shadow: 0 3px 0 #1a0e07, 2px 2px 0 #1a0e07, -2px 0 0 #1a0e07; letter-spacing: .5px; transform: rotate(-3deg); transform-origin: left center; }
  .mds-panel { background: rgba(0,0,0,.82); border-bottom: 3px solid #ffe94d; padding: 6px 9px; margin: 4px 0; font: 800 11px/1.25 'Fredoka', sans-serif; color: #fff; transform: skewX(-6deg); max-width: 95%; } .mds-panel span { display: block; transform: skewX(6deg); }
  .mds-cta { align-self: stretch; margin-top: 6px; border: 2px solid #ffe082; border-radius: 12px; padding: 9px 10px; background: linear-gradient(135deg, #ff9800, #e64a19 65%, #c62828); color: #fff; font: 900 13px/1 'Fredoka', sans-serif; box-shadow: 0 3px 0 #7f0000; cursor: pointer; text-shadow: 0 1px 2px rgba(0,0,0,.5); }
  .mds-cta:active { transform: translateY(2px); box-shadow: 0 1px 0 #7f0000; }
  .mds-fmeta { align-self: flex-start; font: 900 10px 'Fredoka', sans-serif; background: rgba(0,0,0,.65); border-radius: 9px; padding: 2px 8px; color: #ffe9b0; }
  .mds-card { position: relative; display: flex; flex-direction: column; border: 3px solid #0e0805; border-radius: 10px; overflow: hidden; background: #1c0f09; padding: 0; text-align: left; color: inherit; font-family: inherit; cursor: pointer; box-shadow: 0 3px 0 rgba(0,0,0,.5); min-width: 0; }
  .mds-card:active { transform: translateY(1px); }
  .mds-meta { display: flex; align-items: center; justify-content: space-between; gap: 4px; background: #0e0805; padding: 2px 4px 2px 8px; font: 800 9.5px 'Fredoka', sans-serif; color: #c9b79a; white-space: nowrap; overflow: hidden; }
  .mds-i { flex: none; width: 17px; height: 17px; border-radius: 50%; background: #2f7be6; border: 1.5px solid #fff; color: #fff; font: 900 11px/14px 'Fredoka', sans-serif; text-align: center; font-style: normal; }
  .mds-head { display: flex; align-items: center; gap: 5px; padding: 5px 6px; background: var(--c); min-width: 0; } .mds-head > div { min-width: 0; } .mds-head .ic { flex: none; font-size: 20px; line-height: 1; filter: drop-shadow(0 1px 1px rgba(0,0,0,.5)); }
  .mds-head b { display: block; font: 900 11.5px/1.05 'Fredoka', sans-serif; color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,.55); overflow-wrap: anywhere; } .mds-head small { display: block; font: 800 10px 'Fredoka', sans-serif; color: #fff; opacity: .92; text-shadow: 0 1px 0 rgba(0,0,0,.5); }
  .mds-art { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(160deg, color-mix(in srgb, var(--c) 55%, #000) 0%, #1c0f09 100%); }
  .mds-art img { width: 46px; height: 46px; object-fit: contain; filter: drop-shadow(0 2px 3px rgba(0,0,0,.5)); } .mds-art span { font-size: 38px; line-height: 1; filter: drop-shadow(0 2px 3px rgba(0,0,0,.5)); }
  .mds-card.locked { filter: grayscale(.75) brightness(.8); }
  .mds-tabs { position: relative; z-index: 2; flex-shrink: 0; display: flex; align-items: center; justify-content: space-around; gap: 4px; height: 38px; padding: 0 8px; background: #11315f; background: linear-gradient(#5a2c14, #2b1208); border-top: 3px solid #0e0805; }
  .mds-tab { border: 0; background: none; color: #d6c4a4; font: 900 12px/1 'Fredoka', sans-serif; letter-spacing: .4px; padding: 8px 10px; cursor: pointer; text-shadow: 0 1px 0 rgba(0,0,0,.6); white-space: nowrap; position: relative; }
  .mds-tab.on { color: #ffd54f; font-size: 14px; text-shadow: 0 2px 0 rgba(0,0,0,.7); }
  .mds-tab.on::after { content: ''; position: absolute; left: 14%; right: 14%; bottom: 0; height: 3px; border-radius: 2px; background: #ffd54f; }
  .mds-tag { position: absolute; top: -2px; right: -4px; background: #e53935; color: #fff; font: 900 8px/1 'Fredoka', sans-serif; padding: 2px 4px; border-radius: 4px; transform: skewX(-8deg); }
  @media (max-height: 420px) { .mds-ft { font-size: 21px; } .mds-panel { font-size: 10px; padding: 4px 8px; } .mds-art img { width: 38px; height: 38px; } .mds-art span { font-size: 30px; } .mds-grid { grid-auto-columns: 150px; } .mds-feat { width: 240px; } }
  `;
  function css() { if ($('mds-css')) return; const s = document.createElement('style'); s.id = 'mds-css'; s.textContent = CSS; document.head.appendChild(s); }
  const BG = {
    camp: `linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.2)), url('assets/menu/zona1_placa_ancha.webp') 55% 40% / cover`,
    rash: 'linear-gradient(160deg, #e53935 0%, #7a1010 60%, #2a0808 100%)',
    japon: 'linear-gradient(160deg, #f48fb1 0%, #8e2a58 55%, #2d1a3a 100%)',
    online: 'linear-gradient(160deg, #42a5f5 0%, #12408a 60%, #0b1f40 100%)'
  };
  const esc = s => String(s).replace(/"/g, '&quot;');

  function feat(c, f) {
    return `<div class="mds-feat" style="--bg:${BG[f.art]}; background: ${BG[f.art]}">
      ${f.meta ? `<span class="mds-fmeta">${f.meta}</span>` : '<span></span>'}
      <div><h3 class="mds-ft">${f.title}</h3>${f.panels.map(p => `<div class="mds-panel"><span>${p}</span></div>`).join('')}
      <button class="mds-cta" onclick="Modos.pick('${f.go.join("','")}')">${f.cta}</button></div></div>`;
  }
  function card(c) {
    return `<button class="mds-card ${c.locked ? 'locked' : ''}" style="--c:${c.col}" onclick="Modos.pick('${c.go.join("','")}')" aria-label="${esc(c.title)}">
      <div class="mds-meta"><span>${c.meta || ''}</span><i class="mds-i" onclick="event.stopPropagation();Modos.info(this.dataset.t)" data-t="${esc(c.info || c.title)}">i</i></div>
      <div class="mds-head"><span class="ic">${c.icon}</span><div><b>${c.title}</b><small>${c.sub || ''}</small></div></div>
      <div class="mds-art">${c.art}</div></button>`;
  }
  function render() {
    let host = $('mds'); if (!host) { host = document.createElement('div'); host.id = 'mds'; document.body.appendChild(host); }
    const secs = CATS.map(c => { const d = c.build(); return `<section class="mds-sec" data-id="${c.id}"><h4>${c.name}</h4><div class="mds-body">${feat(c, d.feat)}<div class="mds-grid">${d.cards.map(card).join('')}</div></div></section>`; }).join('');
    host.innerHTML = `<div class="mds-top"><button class="mds-nav l" onclick="Modos.close()" aria-label="Volver">◀</button><h2>MODOS DE JUEGO</h2><button class="mds-nav r" onclick="Modos.close()" aria-label="Inicio">🏠</button></div>
      <div class="mds-strip" id="mds-strip">${secs}</div>
      <div class="mds-tabs" id="mds-tabs">${CATS.map(c => `<button class="mds-tab" data-id="${c.id}" onclick="Modos.tab('${c.id}')">${c.name}</button>`).join('')}</div>`;
    const strip = $('mds-strip'); strip.addEventListener('scroll', sync, { passive: true }); sync();
  }
  function sync() {
    const strip = $('mds-strip'); if (!strip) return; let on = CATS[0].id;
    const x = strip.scrollLeft + strip.clientWidth * 0.3, atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
    strip.querySelectorAll('.mds-sec').forEach(s => { if (s.offsetLeft - 18 <= x) on = s.dataset.id; });
    if (atEnd) on = CATS[CATS.length - 1].id;
    document.querySelectorAll('#mds-tabs .mds-tab').forEach(t => t.classList.toggle('on', t.dataset.id === on));
  }
  const onKey = e => { if (e.key === 'Escape' && $('mds')) Modos.close(); };

  // ---------- modo elegido (lo juega el botón JUGAR de la pantalla principal) ----------
  const SEL_KEY = 'ramen_modo_sel';
  const readSel = () => { try { const v = JSON.parse(store.get(SEL_KEY) || 'null'); if (v && ['camp', 'rash', 'japon', 'online'].includes(v.id)) return v; } catch (e) {} return { id: 'camp', arg: null }; };
  function current() {
    const v = readSel();
    if (v.id === 'rash') return { id: 'rash', icon: '⚡', title: 'RASH', top: 'Supervivencia', sub: 'Récord: ronda ' + rashBest(), tag: '', col: '#e53935' };
    if (v.id === 'japon') { const c = japonCities(), n = c.filter(x => x.open).length; return { id: 'japon', icon: '🗾', title: 'JAPÓN', top: 'Recorrido', sub: c.length ? n + '/' + c.length + ' ciudades' : 'Restaurantes por ciudad', tag: '', col: '#ec407a' }; }
    if (v.id === 'online') return { id: 'online', icon: v.arg === 'COOP' ? '🤝' : '⚔️', title: v.arg === 'COOP' ? 'COCINA COMPARTIDA' : 'ARREBATO', top: 'Online', sub: v.arg === 'COOP' ? 'Cooperativo' : 'Versus 1 contra 1', tag: '', col: '#1e88e5' };
    const cs = campStats(), L = Math.min(20, cs.unlockedLevel || 1);
    return { id: 'camp', icon: '🏮', title: 'CAMPAÑA', top: 'Gastronómica', sub: 'Nivel ' + L + ' · ⭐ ' + cs.stars + '/' + cs.maxStars, tag: L > 1 ? 'NIVEL ' + L : '¡NUEVO!', col: '#ff9800' };
  }

  window.Modos = {
    current,
    pick(id, arg) {
      try { localStorage.setItem(SEL_KEY, JSON.stringify({ id, arg: arg || null })); } catch (e) {}
      const h = $('mds'); if (h) h.remove(); document.removeEventListener('keydown', onKey); sfx('serve');
      try { if (window.Home) Home.refresh(); } catch (e) {}
      toast('✔ Modo elegido: ' + current().title + ' · toca JUGAR');
    },
    play() {
      const v = readSel();
      try {
        if (v.id === 'rash') Inicio.act('rash');
        else if (v.id === 'japon') Inicio.act('door');
        else if (v.id === 'online') { try { if (window.MultiplayerManager && v.arg) MultiplayerManager.gameMode = v.arg; } catch (e) {} Inicio.act('room'); }
        else if (window.Inicio) Inicio.play();
      } catch (e) { console.warn('Modos.play', e); }
    },
    open() { css(); sfx('click'); render(); document.addEventListener('keydown', onKey); },
    close() { const h = $('mds'); if (h) h.remove(); document.removeEventListener('keydown', onKey); sfx('click'); try { if (window.Home) Home.refresh(); } catch (e) {} },
    tab(id) { sfx('click'); const strip = $('mds-strip'), s = strip && strip.querySelector('.mds-sec[data-id="' + id + '"]'); if (s) strip.scrollTo({ left: Math.max(0, s.offsetLeft - 18), behavior: 'smooth' }); },
    info(t) { toast('ℹ️ ' + t); },
    go(act, arg) {
      const h = $('mds'); if (h) h.remove(); document.removeEventListener('keydown', onKey);
      try {
        if (act === 'play') { if (window.Inicio) Inicio.play(); }
        else if (act === 'room') { try { if (window.MultiplayerManager && arg) MultiplayerManager.gameMode = arg; } catch (e) {} Inicio.act('room'); }
        else Inicio.act(act, arg);
      } catch (e) { console.warn('Modos.go', act, e); }
    }
  };
})();
