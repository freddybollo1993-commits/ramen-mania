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
    { id: 'zen', name: 'SIN ESTRÉS', col: '#43a047', build() {
      const A = [['ramen', '🍜', 'RAMEN', '#ff9800'], ['salteados', '🍳', 'SALTEADO', '#ef5350'], ['makis', '🍣', 'MAKIS', '#26a69a'], ['frituras', '🍤', 'FRITURAS', '#ffb300']];
      let best = null; try { const b = (window.reconGet && reconGet().best) || {}; const k = Object.keys(b); if (k.length) best = Math.min.apply(null, k.map(x => b[x].t)); } catch (e) {}
      return {
        feat: { title: 'SIN ESTRÉS', art: 'zen', panels: ['Practica a tu ritmo: sin reloj y sin clientes que se vayan.', 'Cocina libre por área y Reconocer ingredientes de cada plato.'], cta: '✔ ELEGIR SIN ESTRÉS', go: ['zen', 'free:ramen'], meta: 'Sin reloj' },
        cards: A.map(a => ({ col: a[3], icon: a[1], title: 'LIBRE · ' + a[2], sub: 'Cocina libre', meta: 'Sin reloj', art: '<span>' + a[1] + '</span>', desc: 'Solo platos de ' + a[2].toLowerCase() + ', sin reloj ni notas.', info: 'Cocina libre de ' + a[2].toLowerCase() + ': los clientes esperan siempre y no hay meta que cumplir.', go: ['zen', 'free:' + a[0]] }))
          .concat([{ col: '#8e24aa', icon: '🔍', title: 'RECONOCER INGREDIENTES', sub: 'Sin reloj en contra', meta: best ? 'Mejor marca ' + Math.round(best) + ' s' : 'Mide tu tiempo', art: '<span>🔍</span>', info: 'Marca los ingredientes de cada plato entre varios. Un contador mide cuánto demoras en reconocerlos.', go: ['zen', 'recon'] }])
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

  // ---------- APRENDER: lecciones, práctica, retos y repaso ----------
  const flagsG = () => { try { return Guia.flags() || {}; } catch (e) { return {}; } };
  function learnCats() {
    const fl = flagsG();
    const LES = [['ramen', '🍜', 'RAMEN', 'Ramen Shio', 60, '#ff9800'], ['salteados', '🥘', 'SALTEADO', 'Chicken Teriyaki', 80, '#ef5350'], ['makis', '🍣', 'MAKIS', 'Maki California', 100, '#26a69a'], ['frituras', '🍤', 'FRITURAS', 'Chicken Katsu', 120, '#ffb300']];
    const done = LES.filter(l => fl[l[0]]).length, nxt = LES.find(l => !fl[l[0]]);
    const AREAS = [['ramen', '🍜', 'RAMEN', '#ff9800'], ['salteados', '🍳', 'SALTEADO', '#ef5350'], ['makis', '🍣', 'MAKIS', '#26a69a'], ['frituras', '🍤', 'FRITURAS', '#ffb300']];
    const cs = campStats(), unl = cs.unlockedLevel || 1, arcs = (typeof CAMPAIGN_ARCS !== 'undefined' ? CAMPAIGN_ARCS : []);
    const safe = (f, d) => { try { return f(); } catch (e) { return d; } };
    const reto = { done: safe(() => trainingDoneCount(), 0), total: safe(() => TRAINING_CHALLENGES.length, 50), stars: safe(() => trainingTotalStars(), 0) };
    let best = null; try { const b = (window.reconGet && reconGet().best) || {}; const k = Object.keys(b); if (k.length) best = Math.min.apply(null, k.map(x => b[x].t)); } catch (e) {}
    const rs = safe(() => window.Recetario && Recetario.summary(), null);
    return [
      { id: 'lecciones', name: 'AULA', build() { return {
        feat: { title: 'AULA DEL MAESTRO', art: 'aula', panels: ['Lecciones guiadas paso a paso, una por cada cocina, y repaso de platos e ingredientes.', 'La primera vez que completes cada lección ganas propinas.'], cta: '🎓 ENTRAR AL AULA', go: ['enter', 'aula'], meta: 'Lecciones ' + done + '/4' },
        cards: LES.map(l => ({ col: l[5], icon: l[1], title: 'LECCIÓN · ' + l[2], sub: l[3], meta: fl[l[0]] ? '✔ Hecha · repetir' : (nxt && nxt[0] === l[0] ? '▶ Te toca · +' + l[4] + ' 🧧' : '+' + l[4] + ' 🧧'), art: '<span>' + l[1] + '</span>',
          desc: 'Cocinas un ' + l[3] + ' paso a paso con el Maestro.', info: 'Lección guiada de ' + l[2].toLowerCase() + ' con ' + l[3] + '. La primera vez da +' + l[4] + ' propinas.', go: ['lesson', l[0]] })) }; } },
      { id: 'practica', name: 'PRÁCTICA', build() { return {
        feat: { title: 'COCINA LIBRE', art: 'zen', panels: ['Practica sin reloj ni notas, a tu ritmo.', 'Elige el área o cocina las cuatro a la vez.'], cta: '🌿 COCINAR LIBRE', go: ['free', 'all'], meta: 'Sin reloj' },
        cards: AREAS.map(a => ({ col: a[3], icon: a[1], title: 'LIBRE · ' + a[2], sub: 'Solo platos de ' + a[2].toLowerCase(), meta: 'Sin reloj', art: '<span>' + a[1] + '</span>', info: 'Cocina libre de ' + a[2].toLowerCase() + ': los clientes esperan siempre y no hay meta.', go: ['free', a[0]] }))
          .concat([{ col: '#43a047', icon: '🌿', title: 'LIBRE · TODO', sub: 'Las 4 áreas a la vez', meta: 'Sin reloj', art: '<span>🌿</span>', desc: 'Las cuatro áreas a la vez, sin reloj.', info: 'Cocina libre con todas las áreas de la cocina.', go: ['free', 'all'] },
            { col: '#8e24aa', icon: '🔍', title: 'RECONOCER INGREDIENTES', sub: 'Qué lleva cada plato', meta: best ? 'Mejor marca ' + Math.round(best) + ' s' : 'Mide tu tiempo', art: '<span>🔍</span>', desc: 'Marca los ingredientes de cada plato y mide tu tiempo.', info: 'Marca los ingredientes de cada plato entre varios y mide cuánto demoras.', go: ['pantry'] }]) }; } },
      { id: 'retos', name: 'RETOS', build() { return {
        feat: { title: 'RETOS DE LA CAMPAÑA', art: 'retos', panels: ['Subniveles que se abren al superar cada nivel de la Campaña.', 'Calidad media mínima, medallas por tiempo y estrellas para tu progreso.'], cta: '🎫 VER RETOS', go: ['retos'], meta: '🎫 ' + reto.done + '/' + reto.total + ' · ⭐ ' + reto.stars },
        cards: arcs.map(a => { const list = safe(() => TRAINING_CHALLENGES.filter(c => a.levels.includes(c.lvl)), []), dn = list.filter(c => safe(() => (trainingProgressOf(c.id) || {}).m > 0, false)).length, open = a.levels[0] <= unl, nx = list.find(c => safe(() => trainingIsOpen(c) && !((trainingProgressOf(c.id) || {}).m > 0), false));
          return { col: ARC_COL[a.id] || '#ff9800', icon: a.icon, title: a.name.toUpperCase(), sub: 'Niveles ' + a.levels[0] + '–' + a.levels[a.levels.length - 1], meta: open ? '🎫 ' + dn + '/' + list.length : '🔒 Llega al nivel ' + a.levels[0], locked: !open, art: '<span>🎫</span>', desc: list.length + ' subniveles tras superar los niveles ' + a.levels[0] + ' al ' + a.levels[a.levels.length - 1] + '.', info: 'Retos de ' + a.name + ': ' + list.length + ' subniveles repartidos entre los niveles ' + a.levels.join(', ') + '.', go: ['retos', String(nx ? nx.lvl : a.levels[0])] }; }) }; } }
    ];
  }
  // ---------- AULA DEL MAESTRO: Lecciones y Repaso, con tarjetas que explican qué es cada cosa ----------
  function aulaCats() {
    const fl = flagsG(), safe = (f, d) => { try { return f(); } catch (e) { return d; } };
    const LES = [['ramen', '🍜', 'RAMEN', 'Ramen Shio', 60, '#ff9800', 'Etapas, pedido y cuenco'], ['salteados', '🥘', 'SALTEADO', 'Chicken Teriyaki', 80, '#ef5350', 'Wok, punto y sartén'], ['makis', '🍣', 'MAKIS', 'Maki California', 100, '#26a69a', 'Esterilla, arroz y enrollado'], ['frituras', '🍤', 'FRITURAS', 'Chicken Katsu', 120, '#ffb300', 'Empanizado, aceite y corte']];
    const done = LES.filter(l => fl[l[0]]).length, nxt = LES.find(l => !fl[l[0]]);
    const rs = safe(() => window.Recetario && Recetario.summary(), null);
    return [
      { id: 'lecciones', name: 'LECCIONES', build() { return {
        feat: { title: 'LECCIONES', art: 'aula', panels: ['El Maestro te guía paso a paso por cada cocina: ramen, salteado, makis y frituras.', 'La primera vez que completes cada lección ganas propinas.'], cta: nxt ? '▶ EMPEZAR: LECCIÓN DE ' + nxt[2] : '↻ REPETIR LA DE RAMEN', go: ['lesson', nxt ? nxt[0] : 'ramen'], meta: 'Lecciones ' + done + '/4' },
        cards: LES.map(l => ({ col: l[5], icon: l[1], title: 'LECCIÓN · ' + l[2], sub: l[3], meta: fl[l[0]] ? '✔ Hecha · repetir' : (nxt && nxt[0] === l[0] ? '▶ Te toca · +' + l[4] + ' 🧧' : '+' + l[4] + ' 🧧'), art: '<span>' + l[1] + '</span>',
          desc: l[6] + ' con el Maestro (≈ 5 min).', info: 'Lección guiada de ' + l[2].toLowerCase() + '. La primera vez da +' + l[4] + ' propinas.', go: ['lesson', l[0]] })) }; } },
      { id: 'repaso', name: 'REPASO', build() { return {
        feat: { title: 'REPASO', art: 'retos', panels: ['Consulta qué lleva cada plato y cómo se prepara.', 'Entrena tu ojo con los ingredientes y organiza tu despensa.'], cta: '📖 ABRIR EL RECETARIO', go: ['book'], meta: rs ? '🍽️ ' + rs.tried + '/' + rs.total + ' probados' : '' },
        cards: [
          { col: '#8e24aa', icon: '🔍', title: 'MODO INGREDIENTES', sub: 'Qué lleva cada plato', meta: 'Mide tu tiempo', art: '<span>🔍</span>', desc: 'Marca los ingredientes de cada plato y mide tu tiempo.', info: 'Sin reloj en contra: tu tiempo es tu marca.', go: ['pantry'] },
          { col: '#ff9800', icon: '📖', title: 'RECETARIO OFICIAL', sub: 'Los 35 platos', meta: rs ? '🍽️ ' + rs.tried + '/' + rs.total : 'Colección', art: '<span>📖</span>', desc: 'Ingredientes, pasos y estrellas de los 35 platos.', info: 'Tu colección de platos.', go: ['book'] },
          { col: '#26a69a', icon: '🥢', title: 'ORDENAR DESPENSA', sub: 'Tu orden de ingredientes', meta: 'Personalizable', art: '<span>🥢</span>', desc: 'Cambia el orden de los ingredientes en la cocina.', info: 'Personaliza la despensa.', go: ['order'] }] }; } }
    ];
  }

  // orden de las categorías: Campaña, Sin estrés, Rash, Recorrido por Japón y Online
  { const ORDER = ['camp', 'zen', 'rash', 'japon', 'online']; CATS.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)); }

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
  .mds-desc { margin: 0; padding: 4px 7px 6px; background: rgba(0,0,0,.6); font: 700 9.5px/1.25 'Fredoka', sans-serif; color: #f1e3c8; }
  #mds[data-mode="aula"] .mds-grid, #mds[data-mode="learn"] .mds-grid { grid-auto-columns: 196px; }
  #mds[data-mode="aula"] .mds-art span, #mds[data-mode="learn"] .mds-art span { font-size: 24px; } #mds[data-mode="aula"] .mds-art img, #mds[data-mode="learn"] .mds-art img { width: 30px; height: 30px; }
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
    zen: 'linear-gradient(160deg, #81c784 0%, #2e7d32 55%, #0f2f14 100%)',
    online: 'linear-gradient(160deg, #42a5f5 0%, #12408a 60%, #0b1f40 100%)',
    aula: 'linear-gradient(160deg, #9575cd 0%, #4527a0 55%, #1a1040 100%)',
    retos: 'linear-gradient(160deg, #4db6ac 0%, #00695c 55%, #07241f 100%)'
  };
  const esc = s => String(s).replace(/"/g, '&quot;');
  let MODE = 'play', LIST = CATS;                                   // 'play' = Modos de juego · 'learn' = Aprender
  let FROM = null;                                                  // desde dónde se abrió el Aula (para volver con ◀)
  const PK = () => (MODE === 'learn' || MODE === 'aula' ? 'Modos.learnGo' : 'Modos.pick');

  function feat(c, f) {
    return `<div class="mds-feat" style="--bg:${BG[f.art]}; background: ${BG[f.art]}">
      ${f.meta ? `<span class="mds-fmeta">${f.meta}</span>` : '<span></span>'}
      <div><h3 class="mds-ft">${f.title}</h3>${f.panels.map(p => `<div class="mds-panel"><span>${p}</span></div>`).join('')}
      <button class="mds-cta" onclick="${PK()}('${f.go.join("','")}')">${f.cta}</button></div></div>`;
  }
  function card(c) {
    return `<button class="mds-card ${c.locked ? 'locked' : ''}" style="--c:${c.col}" onclick="${PK()}('${c.go.join("','")}')" aria-label="${esc(c.title)}">
      <div class="mds-meta"><span>${c.meta || ''}</span><i class="mds-i" onclick="event.stopPropagation();Modos.info(this.dataset.t)" data-t="${esc(c.info || c.title)}">i</i></div>
      <div class="mds-head"><span class="ic">${c.icon}</span><div><b>${c.title}</b><small>${c.sub || ''}</small></div></div>
      <div class="mds-art">${c.art}</div>${c.desc ? `<p class="mds-desc">${c.desc}</p>` : ''}</button>`;
  }
  function render() {
    let host = $('mds'); if (!host) { host = document.createElement('div'); host.id = 'mds'; document.body.appendChild(host); }
    LIST = MODE === 'learn' ? learnCats() : (MODE === 'aula' ? aulaCats() : CATS);
    const secs = LIST.map(c => { const d = c.build(); return `<section class="mds-sec" data-id="${c.id}"><h4>${c.name}</h4><div class="mds-body">${feat(c, d.feat)}<div class="mds-grid">${d.cards.map(card).join('')}</div></div></section>`; }).join('');
    host.innerHTML = `<div class="mds-top"><button class="mds-nav l" onclick="Modos.close()" aria-label="Volver">◀</button><h2>${MODE === 'learn' ? 'APRENDER' : (MODE === 'aula' ? 'AULA DEL MAESTRO' : 'MODOS DE JUEGO')}</h2><button class="mds-nav r" onclick="Modos.close()" aria-label="Inicio">🏠</button></div>
      <div class="mds-strip" id="mds-strip">${secs}</div>
      <div class="mds-tabs" id="mds-tabs">${LIST.map(c => `<button class="mds-tab" data-id="${c.id}" onclick="Modos.tab('${c.id}')">${c.name}</button>`).join('')}</div>`;
    host.dataset.mode = MODE;
    const strip = $('mds-strip'); strip.addEventListener('scroll', sync, { passive: true }); sync();
  }
  function sync() {
    const strip = $('mds-strip'); if (!strip) return; let on = LIST[0].id;
    const x = strip.scrollLeft + strip.clientWidth * 0.3, atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
    strip.querySelectorAll('.mds-sec').forEach(s => { if (s.offsetLeft - 18 <= x) on = s.dataset.id; });
    if (atEnd) on = LIST[LIST.length - 1].id;
    document.querySelectorAll('#mds-tabs .mds-tab').forEach(t => t.classList.toggle('on', t.dataset.id === on));
  }
  const onKey = e => { if (e.key === 'Escape' && $('mds')) Modos.close(); };

  // ---------- modo elegido (lo juega el botón JUGAR de la pantalla principal) ----------
  const SEL_KEY = 'ramen_modo_sel';
  const readSel = () => { try { const v = JSON.parse(store.get(SEL_KEY) || 'null'); if (v && ['camp', 'rash', 'japon', 'online', 'zen'].includes(v.id)) return v; } catch (e) {} return { id: 'camp', arg: null }; };
  function current() {
    const v = readSel();
    if (v.id === 'rash') return { id: 'rash', icon: '⚡', title: 'RASH', top: 'Supervivencia', sub: 'Récord: ronda ' + rashBest(), tag: '', col: '#e53935' };
    if (v.id === 'japon') { const c = japonCities(), n = c.filter(x => x.open).length; return { id: 'japon', icon: '🗾', title: 'JAPÓN', top: 'Recorrido', sub: c.length ? n + '/' + c.length + ' ciudades' : 'Restaurantes por ciudad', tag: '', col: '#ec407a' }; }
    if (v.id === 'zen') { const rec = v.arg === 'recon', ar = String(v.arg || '').replace('free:', ''), ic = { ramen: '🍜', salteados: '🍳', makis: '🍣', frituras: '🍤' }[ar] || '🌿'; return { id: 'zen', icon: rec ? '🔍' : ic, title: rec ? 'RECONOCER' : 'COCINA LIBRE', top: 'Sin estrés', sub: rec ? 'Ingredientes de cada plato' : ({ ramen: 'Ramen', salteados: 'Salteado', makis: 'Makis', frituras: 'Frituras' }[ar] || 'Sin reloj'), tag: '', col: '#43a047' }; }
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
        else if (v.id === 'zen') { if (v.arg === 'recon') Inicio.act('pantry'); else Inicio.act('free', String(v.arg || 'free:ramen').replace('free:', '')); }
        else if (v.id === 'online') { try { if (window.MultiplayerManager && v.arg) MultiplayerManager.gameMode = v.arg; } catch (e) {} Inicio.act('room'); }
        else if (window.Inicio) Inicio.play();
      } catch (e) { console.warn('Modos.play', e); }
    },
    /** Aula del Maestro: lecciones y repaso (desde = 'learn' para volver a Aprender con ◀). */
    aula(from) { MODE = 'aula'; FROM = from || null; css(); sfx('click'); render(); document.addEventListener('keydown', onKey); },
    open() { MODE = 'play'; FROM = null; css(); sfx('click'); render(); document.addEventListener('keydown', onKey); },
    /** Pantalla de APRENDER: lecciones del Aula, práctica sin reloj, retos de la Campaña y repaso. */
    learn() { MODE = 'learn'; FROM = null; css(); sfx('click'); try { Inicio.seen('pantry'); } catch (e) {} render(); document.addEventListener('keydown', onKey); },
    learnGo(kind, arg) {
      const h = $('mds'); if (h) h.remove(); document.removeEventListener('keydown', onKey); sfx('click');
      try {
        if (kind === 'lesson') Guia.start(arg);
        else if (kind === 'enter') { if (arg === 'aula') Modos.aula('learn'); else Inicio.act('enter', arg); }
        else if (kind === 'free') { if (arg === 'all') { window.startFreeAreas = null; setStartSelectedMode('FREE'); handleStartPlayClick(); } else Inicio.act('free', arg); }
        else if (kind === 'pantry') Inicio.act('pantry');
        else if (kind === 'retos') openLevelRetos(arg ? +arg : undefined);
        else if (kind === 'book') { if (window.Recetario) Recetario.open(); else openRecipeModal(); }
        else if (kind === 'order') openIngredientOrderModal();
      } catch (e) { console.warn('Modos.learnGo', kind, e); }
    },
    close() { const back = MODE === 'aula' && FROM === 'learn'; const h = $('mds'); if (h) h.remove(); document.removeEventListener('keydown', onKey); sfx('click'); if (back) { this.learn(); return; } try { if (window.Home) Home.refresh(); } catch (e) {} },
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
