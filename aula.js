/* Salas del inicio: el Aula del Maestro (Aprender) y la bodega de los Secretos.
   Se registran en Inicio (inicio.js), que las abre con la transición de velocidad. Cada sala recibe su contenedor y una pequeña API (leave, act...).
   El Maestro usa el sprite del Maestro de Ramen (assets/people/cook_ramen_v1.webp: fila 0 caminar, fila 1 trabajar, fila 2 caminar de espaldas). */
(function () {
  'use strict';
  if (!window.Inicio) return;
  const SPRITE = 'assets/people/cook_ramen_v1.webp';
  const ORDER = ['ramen', 'salteados', 'makis', 'frituras'];
  const LES = {
    ramen: { n: 'Ramen', i: '🍜', dish: 'Ramen Shio', min: '≈ 5 min', reward: 60, note: 'Etapas, pedido y cuenco' },
    salteados: { n: 'Salteado', i: '🥘', dish: 'Chicken Teriyaki', min: '≈ 5 min', reward: 80, note: 'Wok, punto y sartén' },
    makis: { n: 'Makis', i: '🍣', dish: 'Maki California', min: '≈ 5 min', reward: 100, note: 'Esterilla, arroz y enrollado' },
    frituras: { n: 'Frituras', i: '🍤', dish: 'Chicken Katsu', min: '≈ 5 min', reward: 120, note: 'Empanizado, aceite y corte' }
  };
  const FREE_AREAS = [['ramen', '🍜', 'Ramen'], ['salteados', '🥘', 'Salteado'], ['makis', '🍣', 'Makis'], ['frituras', '🍤', 'Frituras']];
  const TIPS = [
    'El caldo Shio se cuida con calma: si hierve fuerte, se enturbia.',
    'Corta siempre a favor del filo: un tajo limpio vale más que tres tajos nerviosos.',
    'El arroz de los makis se lava hasta que el agua sale casi clara.',
    'En el wok, el fuego manda: mantén el salteado en movimiento.',
    'El aceite listo no humea: se ve brillante y se mueve como seda.',
    'Emplatar es un cuarto de la nota: el orden también se come con los ojos.',
    'Un plato frío es un plato perdido: sírvelo cuando esté en su punto.',
    'Con las dos manos puedes flamear con una y servir fideos con la otra.',
    'El Zu (vinagre y azúcar) se mezcla con el arroz aún tibio, nunca frío.'
  ];
  const $ = (s, r) => (r || document).querySelector(s);
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const safe = (f, d) => { try { return f(); } catch (e) { return d; } };
  const sfx = n => { try { playSound(n); } catch (e) {} };

  const CSS = `
  .au-m { width: 128px; height: 192px; background-image: url(${SPRITE}); background-size: 512px 576px; background-repeat: no-repeat; background-position: 0 0; image-rendering: auto; flex: none; transform-origin: 50% 100%; }
  .au-m.work { background-position-y: -192px; animation: auSpr 0.9s steps(4) infinite; } .au-m.walk { animation: auSpr 0.5s steps(4) infinite; } .au-m.idle { background-position-y: 0; }
  @keyframes auSpr { from { background-position-x: 0; } to { background-position-x: -512px; } }
  .au, .sc { position: absolute; inset: 0; font-family: 'Fredoka', sans-serif; color: #3b2208; display: flex; flex-direction: column; }
  .au-back { border: 2px solid #ffe082; border-radius: 12px; background: rgba(60,25,12,0.9); color: #ffe9b0; font: 800 13px 'Fredoka', sans-serif; padding: 4px 12px; cursor: pointer; flex: none; }
  /* ---- aula ---- */
  .au { background: linear-gradient(#d9bd86 0 62%, #3e2410 62% 64%, #8da35a 64% 100%); }
  .au::before { content: ''; position: absolute; inset: 0 0 38% 0; background: repeating-linear-gradient(90deg, rgba(110,70,30,0.35) 0 3px, transparent 3px 96px), repeating-linear-gradient(0deg, rgba(110,70,30,0.25) 0 2px, transparent 2px 70px); pointer-events: none; }
  .au::after { content: ''; position: absolute; inset: 62% 0 0 0; background: repeating-linear-gradient(0deg, rgba(60,80,30,0.35) 0 2px, transparent 2px 46px), repeating-linear-gradient(90deg, rgba(60,80,30,0.25) 0 2px, transparent 2px 120px); pointer-events: none; }
  .au-top { position: relative; z-index: 2; display: flex; align-items: center; gap: 10px; padding: 6px 12px; background: linear-gradient(#5b3a1c, #3e2410); border-bottom: 3px solid #c9a227; flex: none; }
  .au-top h2 { margin: 0; font: 900 16px 'Fredoka', sans-serif; color: #ffe9b0; flex: 1; } .au-stats { font: 800 11px sans-serif; color: #ffe9b0; white-space: nowrap; }
  .au-body { position: relative; z-index: 2; flex: 1; min-height: 0; display: flex; gap: 8px; padding: 8px 10px 8px 8px; }
  .au-side { width: 190px; flex: none; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; position: relative; }
  .au-side .au-m { margin-bottom: -4px; cursor: pointer; transform: scale(0.8); margin-top: -20px; }
  .au-bub { position: relative; background: #fffbe9; border: 3px solid #6b4a24; border-radius: 14px; padding: 7px 10px; font: 700 12.5px/1.3 'Fredoka', sans-serif; margin-bottom: 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.3); animation: auPop 0.3s cubic-bezier(.2,1.5,.4,1); width: 100%; box-sizing: border-box; max-height: 145px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
  .au-bub::after { content: ''; position: absolute; left: 50%; bottom: -12px; margin-left: -8px; border: 8px solid transparent; border-top-color: #6b4a24; }
  .au-bub button { display: block; margin-top: 6px; width: 100%; border: 2px solid #8a5a00; border-radius: 10px; background: linear-gradient(#ffe9a8, #ffc84a); font: 900 13px 'Fredoka', sans-serif; padding: 4px 6px; cursor: pointer; color: #3b2208; box-shadow: 0 2px 0 #8a5a00; }
  @keyframes auPop { from { transform: scale(0.6); opacity: 0; } }
  .au-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: rgba(255,250,232,0.94); border: 3px solid #6b4a24; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.35); overflow: hidden; }
  .au-tabs { display: flex; gap: 4px; padding: 6px 6px 0; background: linear-gradient(#f1dcaa, #e5c98a); flex: none; }
  .au-tabs button { flex: 1; border: 2px solid #6b4a24; border-bottom: 0; border-radius: 10px 10px 0 0; background: #e9d09a; font: 900 13px 'Fredoka', sans-serif; padding: 5px 4px; color: #6b4a24; cursor: pointer; }
  .au-tabs button.on { background: #fffaf0; color: #3b2208; box-shadow: inset 0 3px 0 #ffc84a; }
  .au-pane { flex: 1; min-height: 0; overflow-y: auto; padding: 8px; display: grid; grid-template-columns: repeat(auto-fill, minmax(136px, 1fr)); gap: 8px; align-content: start; -webkit-overflow-scrolling: touch; }
  .au-card { border: 2px solid #6b4a24; border-radius: 12px; background: linear-gradient(#fffdf4, #f6e7bd); padding: 7px 9px; text-align: left; cursor: pointer; box-shadow: 0 3px 0 #6b4a24; font-family: inherit; color: #3b2208; display: flex; flex-direction: column; gap: 2px; }
  .au-card:active { transform: translateY(2px); box-shadow: 0 1px 0 #6b4a24; } .au-card i { font-style: normal; font-size: 26px; } .au-card b { font: 900 14px/1.1 'Fredoka', sans-serif; } .au-card small { font: 700 11px/1.25 sans-serif; color: #6b5330; }
  .au-card.done { background: linear-gradient(#e6f5d8, #c5e3a8); } .au-card.next { outline: 3px solid #ffe066; animation: iniGlow 1.2s ease-in-out infinite; } .au-card.off { opacity: 0.5; filter: grayscale(0.6); cursor: default; }
  .au-wide { grid-column: 1 / -1; } .au-sum { grid-column: 1 / -1; font: 800 12px sans-serif; background: #fff3cf; border: 2px dashed #c9a24a; border-radius: 10px; padding: 5px 9px; }
  .au-chap { grid-column: 1 / -1; font: 900 13px 'Fredoka', sans-serif; border-bottom: 2px solid #c9a24a; padding-top: 4px; display: flex; justify-content: space-between; }
  .au-card .num { font: 900 11px sans-serif; color: #b71c1c; }
  /* ---- bodega de los secretos ---- */
  .sc { background: radial-gradient(ellipse at 62% 62%, #6b4a2a 0%, #2a160c 55%, #120905 100%); overflow: hidden; }
  .sc-shelf { position: absolute; left: 0; right: 0; height: 12px; background: #3b2210; box-shadow: 0 6px 10px rgba(0,0,0,0.5); } .sc-shelf::before { content: ''; position: absolute; left: 6%; bottom: 12px; width: 88%; height: 34px; background: repeating-linear-gradient(90deg, #5a3a1c 0 26px, transparent 26px 40px, #7a4a22 40px 64px, transparent 64px 80px); opacity: 0.75; border-radius: 3px; }
  .sc-lamp { position: absolute; left: 50%; top: 2px; width: 22px; margin-left: -11px; text-align: center; font-size: 26px; transform-origin: 50% 0; animation: jpLamp 3.2s ease-in-out infinite; z-index: 3; }
  .sc-glowbg { position: absolute; inset: 0; background: radial-gradient(circle at 50% 8%, rgba(255,200,90,0.35), transparent 55%); animation: scFlick 2.4s ease-in-out infinite; pointer-events: none; }
  @keyframes scFlick { 0%, 100% { opacity: 1; } 18% { opacity: 0.7; } 34% { opacity: 1; } 60% { opacity: 0.82; } }
  .sc-top { position: absolute; left: 10px; right: 10px; top: 8px; display: flex; align-items: center; gap: 10px; z-index: 5; } .sc-top h2 { margin: 0; font: 900 16px 'Fredoka', sans-serif; color: #ffe9b0; flex: 1; text-shadow: 0 2px 0 #000; }
  .sc-count { font: 800 12px sans-serif; color: #ffe9b0; background: rgba(0,0,0,0.5); border-radius: 10px; padding: 3px 10px; }
  .sc-maestro { position: absolute; left: 15%; bottom: 8px; width: 128px; height: 192px; z-index: 3; transform-origin: 50% 100%; }
  .sc-maestro.search { animation: scRummage 0.5s ease-in-out infinite alternate; } .sc-maestro.found { animation: scJump 0.5s ease-out 2; }
  @keyframes scRummage { from { transform: rotate(8deg) translateX(0); } to { transform: rotate(20deg) translate(10px, 5px); } } @keyframes scJump { 50% { transform: translateY(-18px) rotate(-4deg); } }
  .sc-maestro .au-m { transform: none; } .sc-bub { position: absolute; left: calc(15% - 6px); bottom: 206px; background: #fffbe9; border: 3px solid #6b4a24; border-radius: 14px; padding: 4px 10px; font: 800 13px 'Fredoka', sans-serif; z-index: 6; box-shadow: 0 3px 8px rgba(0,0,0,0.5); white-space: nowrap; animation: auPop 0.25s cubic-bezier(.2,1.5,.4,1); }
  .sc-bub::after { content: ''; position: absolute; left: 30px; bottom: -11px; border: 7px solid transparent; border-top-color: #6b4a24; }
  .sc-chestwrap { position: absolute; left: 31%; bottom: 14px; width: 250px; height: 177px; z-index: 4; cursor: pointer; } .sc-chest { width: 100%; height: 100%; overflow: visible; }
  .sc-chest .sc-lid { transform-origin: 24px 78px; transition: transform 0.45s cubic-bezier(.3,1.4,.5,1); } .sc-chest .sc-glow { opacity: 0; transition: opacity 0.4s; } .sc-chest.open .sc-lid { transform: rotate(-62deg); } .sc-chest.open .sc-glow { opacity: 1; }
  .sc-chest.search .sc-lid { animation: scLid 0.45s ease-in-out infinite alternate; } @keyframes scLid { from { transform: rotate(-9deg); } to { transform: rotate(-20deg); } }
  .sc-pap { position: absolute; font-size: 24px; z-index: 7; pointer-events: none; animation: scFly 1.4s ease-out forwards; left: 52%; bottom: 120px; }
  @keyframes scFly { 0% { transform: translate(0, 0) rotate(0); opacity: 0; } 12% { opacity: 1; } 50% { transform: translate(calc(var(--dx) * 0.6), var(--dy)) rotate(calc(var(--r) * 0.5)); } 100% { transform: translate(var(--dx), 70px) rotate(var(--r)); opacity: 0; } }
  .sc-dust { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: rgba(255,230,180,0.7); z-index: 2; pointer-events: none; animation: scDust 3.5s linear infinite; } @keyframes scDust { from { transform: translateY(0); opacity: 0; } 20% { opacity: 0.8; } to { transform: translateY(-120px) translateX(30px); opacity: 0; } }
  .sc-help { position: absolute; right: 14px; bottom: 14px; z-index: 6; border: 3px solid #ffe082; border-radius: 16px; padding: 7px 16px; background: linear-gradient(135deg, #ff9800, #d32f2f 65%, #b71c1c); color: #fff; font: 900 15px 'Fredoka', sans-serif; box-shadow: 0 4px 0 #5f0000; cursor: pointer; }
  .sc-card { position: absolute; left: 50%; top: 52px; width: min(520px, 92%); transform: translateX(-50%); z-index: 9; background: linear-gradient(#f7e9c0, #ecd59b); border: 3px solid #8a6330; border-radius: 10px; padding: 12px 16px; box-shadow: 0 10px 28px rgba(0,0,0,0.65); animation: scUnfurl 0.45s cubic-bezier(.2,1.2,.4,1); display: flex; gap: 12px; align-items: center; }
  .sc-card::before, .sc-card::after { content: ''; position: absolute; left: -8px; right: -8px; height: 12px; background: #8a5630; border: 2px solid #2b1810; border-radius: 8px; } .sc-card::before { top: -9px; } .sc-card::after { bottom: -9px; }
  @keyframes scUnfurl { from { transform: translateX(-50%) scaleY(0.1); opacity: 0; } }
  .sc-card .big { font-size: 54px; flex: none; filter: drop-shadow(0 3px 4px rgba(0,0,0,0.4)); animation: auPop 0.5s cubic-bezier(.2,1.5,.4,1); } .sc-card .txt { flex: 1; min-width: 0; } .sc-card h3 { margin: 0; font: 900 18px 'Fredoka', sans-serif; } .sc-card .kj { font: 700 11px sans-serif; color: #8a5a22; }
  .sc-card .sub { font: 800 12px/1.25 sans-serif; color: #6b4a24; margin: 2px 0 4px; } .sc-card .lore { font: 600 12px/1.35 sans-serif; max-height: 4.2em; overflow: hidden; } .sc-card .new { display: inline-block; background: #d32f2f; color: #fff; font: 900 10px sans-serif; border-radius: 8px; padding: 1px 7px; margin-left: 6px; vertical-align: middle; }
  .sc-card .btns { display: flex; gap: 8px; margin-top: 8px; } .sc-card .btns button { flex: 1; border: 2px solid #6b4a24; border-radius: 10px; background: #fff3cf; font: 900 13px 'Fredoka', sans-serif; padding: 5px 8px; cursor: pointer; box-shadow: 0 2px 0 #6b4a24; color: #3b2208; } .sc-card .btns button.go { background: linear-gradient(#ffe9a8, #ffc84a); }
  `;
  function css() { if (document.getElementById('au-css')) return; const s = document.createElement('style'); s.id = 'au-css'; s.textContent = CSS; document.head.appendChild(s); }

  // =============================== AULA DEL MAESTRO ===============================
  let au = null;
  /** Qué debería hacer el jugador ahora: primera lección, siguiente lección, siguiente reto o practicar. @returns {{t:string, btn:string, fn:Function}} */
  function nextStep(api) {
    const fl = api.flags();
    if (api.firstTime()) return { t: '¡Bienvenido! Empieza por <b>la lección de Ramen</b>: +60 🧧.', btn: 'Empezar la lección', fn: () => Guia.start('ramen') };
    const nl = ORDER.find(k => !fl[k]);
    if (nl) { const L = LES[nl]; return { t: `Te falta <b>la lección de ${L.n}</b>: +${L.reward} 🧧.`, btn: 'Ir a la lección', fn: () => Guia.start(nl) }; }
    const nr = safe(() => trainingNextChallenge(), null);
    if (nr) return { t: `Siguiente reto: <b>${nr.num}. ${nr.title}</b>.`, btn: 'Ver el reto', fn: () => openTrainingModal(nr.id) };
    return { t: '¡Dominas todo! Mejora tus tiempos en <b>Retos</b> o practica.', btn: 'Ir a Práctica', fn: () => au.tab('practica') };
  }
  function lessonsHtml(api) {
    const fl = api.flags(), nxt = ORDER.find(k => !fl[k]);
    return ORDER.map(k => { const L = LES[k]; return `<button class="au-card ${fl[k] ? 'done' : (k === nxt ? 'next' : '')}" data-les="${k}"><i>${L.i}</i><b>Lección de ${L.n}</b><small>${L.dish} · ${L.min}</small><small>${fl[k] ? '✓ Hecha · repetir' : '+' + L.reward + ' 🧧 la primera vez'}</small><small>${L.note}</small></button>`; }).join('');
  }
  function retosHtml() {
    const chs = safe(() => TRAINING_CHAPTERS, []), all = safe(() => TRAINING_CHALLENGES, []);
    const done = safe(() => trainingDoneCount(), 0), nx = safe(() => trainingNextChallenge(), null);
    let h = `<div class="au-sum"><b>Retos ${done}/${all.length}</b> · 🥇 ${safe(() => trainingMedalCount(3), 0)} · 🥈 ${safe(() => trainingMedalCount(2), 0)} · 🥉 ${safe(() => trainingMedalCount(1), 0)} · 🧧 ${safe(() => getPropinasWallet(), 0)}</div>`;
    chs.forEach(c => {
      const list = all.filter(x => x.ch === c.id), dn = list.filter(x => safe(() => (trainingProgressOf(x.id) || {}).m > 0, false)).length;
      h += `<div class="au-chap"><span>${c.icon} ${c.name}</span><span>${dn}/${list.length}</span></div>`;
      list.forEach(x => {
        const open = safe(() => trainingIsOpen(x), true), p = safe(() => trainingProgressOf(x.id) || {}, {}), isNext = nx && nx.id === x.id;
        const meta = !open ? '🔒 Bloqueado' : (p.m > 0 ? safe(() => trainingMedalIcon(p.m) + ' ' + formatTrainingTime(p.t), '✓') : '▶ Nuevo');
        h += `<button class="au-card ${!open ? 'off' : (p.m > 0 ? 'done' : '')} ${isNext ? 'next' : ''}" data-reto="${open ? x.id : ''}"><span class="num">Reto ${x.num}</span><b>${x.title}</b><small>${meta}</small></button>`;
      });
    });
    return h;
  }
  function practicaHtml() {
    return `<div class="au-sum au-wide">Practica sin reloj ni notas: eliges el área y cocinas tranquilo, con el pedido que quieras.</div>`
      + FREE_AREAS.map(([k, ico, n]) => `<button class="au-card" data-free="${k}"><i>${ico}</i><b>Cocina libre · ${n}</b><small>Solo platos de ${n.toLowerCase()}</small></button>`).join('')
      + `<button class="au-card" data-free="all"><i>🌿</i><b>Cocina libre · Todo</b><small>Las 4 áreas a la vez</small></button>`;
  }
  function repasoHtml() {
    return `<div class="au-sum au-wide">Repasa qué lleva cada plato, técnicas maestras y organiza tu cocina.</div>
      <button class="au-card" data-do="pantry"><i>🔍</i><b>Modo Ingredientes</b><small>Reconoce los ingredientes de cada plato sin reloj.</small></button>
      <button class="au-card" data-do="book"><i>📖</i><b>Recetario Oficial</b><small>Ingredientes, pasos y precios de todos los platos.</small></button>
      <button class="au-card" data-do="secretos"><i>📜</i><b>Secretos del Maestro</b><small>El baúl de técnicas avanzadas y trucos legendarios.</small></button>
      <button class="au-card" data-do="order"><i>🍱</i><b>Ordenar ingredientes</b><small>Cambia el orden de tu despensa.</small></button>`;
  }
  const TABS = [['lecciones', '🎓 Lecciones'], ['retos', '🏋️ Retos'], ['practica', '🌿 Práctica'], ['repaso', '🔍 Repaso']];
  const auRoom = {
    mount(el, api) {
      css(); au = { api, tabName: store.get('ramen_aula_tab') || 'lecciones', timers: [] };
      const fl = api.flags(), les = ORDER.filter(k => fl[k]).length;
      el.innerHTML = `<div class="au"><div class="au-top"><button class="au-back" data-back>← Salir</button><h2>🎓 Aula del Maestro</h2><div class="au-stats">Lecciones ${les}/4 · Retos ${safe(() => trainingDoneCount(), 0)}/${safe(() => TRAINING_CHALLENGES.length, 27)}</div></div>
        <div class="au-body"><aside class="au-side"><div class="au-bub" id="au-bub"></div><div class="au-m work" id="au-m" title="Toca al Maestro para un consejo"></div></aside>
        <section class="au-main"><nav class="au-tabs">${TABS.map(t => `<button data-tab="${t[0]}">${t[1]}</button>`).join('')}</nav><div class="au-pane" id="au-pane"></div></section></div></div>`;
      const root = $('.au', el), pane = $('#au-pane', el), bub = $('#au-bub', el), m = $('#au-m', el);
      au.tab = name => { au.tabName = name; store.set('ramen_aula_tab', name); sfx('click'); root.querySelectorAll('.au-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name)); pane.innerHTML = name === 'retos' ? retosHtml() : (name === 'practica' ? practicaHtml() : (name === 'repaso' ? repasoHtml() : lessonsHtml(api))); pane.scrollTop = 0; };
      const say = (html, btn, fn) => { bub.style.animation = 'none'; void bub.offsetWidth; bub.style.animation = ''; bub.innerHTML = html + (btn ? `<button data-go>${btn}</button>` : ''); bub._fn = fn || null; };
      const rec = () => { const n = nextStep(api); say(n.t, n.btn, n.fn); };
      root.addEventListener('click', e => {
        const t = e.target.closest('[data-back],[data-tab],[data-les],[data-reto],[data-free],[data-do],[data-go],#au-m'); if (!t) return;
        if (t.hasAttribute('data-back')) return api.leave();
        if (t.dataset.tab) return au.tab(t.dataset.tab);
        if (t.hasAttribute('data-go')) { sfx('click'); if (bub._fn) bub._fn(); return; }
        if (t.id === 'au-m') { sfx('add'); say('💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)] + '<button data-go2>Volver a mi consejo</button>'); return; }
        if (t.dataset.les) { sfx('click'); return Guia.start(t.dataset.les); }
        if (t.dataset.reto !== undefined) { if (t.dataset.reto) { sfx('click'); openTrainingModal(t.dataset.reto); } return; }
        if (t.dataset.free) { sfx('click'); if (t.dataset.free === 'all') { window.startFreeAreas = null; setStartSelectedMode('FREE'); handleStartPlayClick(); } else api.act('free', t.dataset.free); return; }
        if (t.dataset.do) {
          if (t.dataset.do === 'secretos') return api.act('enter', 'secretos');
          return api.act(t.dataset.do);
        }
      });
      bub.addEventListener('click', e => { if (e.target.hasAttribute('data-go2')) { e.stopPropagation(); rec(); } });
      au.tab(au.tabName); rec();
    },
    unmount() { if (au) au.timers.forEach(clearInterval); au = null; }
  };

  // =============================== SECRETOS: el baúl del Maestro ===============================
  let sc = null;
  const HKEY = 'ramen_secretos_hallados';
  const hallados = () => { try { return JSON.parse(store.get(HKEY) || '[]') || []; } catch (e) { return []; } };
  const SEARCH_LINES = ['¿Dónde lo dejé…?', '¡Este no es!', '¡Ay, cuánto polvo!', 'Estaba aquí… ¡seguro!', '¡Mi abuelo lo guardó aquí!', '¡Otro papel viejo!', '¡Casi, casi…!', 'Mmm… ¡tampoco!'];
  const CHEST = `<svg viewBox="0 0 240 170" class="sc-chest search" id="sc-chest"><ellipse cx="120" cy="160" rx="106" ry="9" fill="rgba(0,0,0,0.5)"/>
    <g><rect x="24" y="78" width="192" height="78" rx="6" fill="#6e4222" stroke="#2b1810" stroke-width="3"/><path d="M24,100 H216 M24,124 H216" stroke="#4b2b12" stroke-width="2"/>
    <rect x="52" y="78" width="14" height="78" fill="#9a9a9a" stroke="#2b1810" stroke-width="2"/><rect x="174" y="78" width="14" height="78" fill="#9a9a9a" stroke="#2b1810" stroke-width="2"/>
    <rect x="106" y="96" width="28" height="34" rx="4" fill="#f4c842" stroke="#8a6a1c" stroke-width="2.5"/><circle cx="120" cy="109" r="4.5" fill="#3b2208"/><rect x="118" y="111" width="4" height="9" fill="#3b2208"/></g>
    <g class="sc-glow"><ellipse cx="120" cy="80" rx="88" ry="14" fill="#ffd54f"/><ellipse cx="120" cy="72" rx="60" ry="30" fill="#fff3b0" opacity="0.7"/></g>
    <g class="sc-lid"><path d="M24,78 Q24,26 120,26 Q216,26 216,78 Z" fill="#8a5630" stroke="#2b1810" stroke-width="3"/><path d="M52,78 Q52,34 66,29 M188,78 Q188,34 174,29" stroke="#9a9a9a" stroke-width="12" fill="none"/><path d="M52,78 Q52,34 66,29 M188,78 Q188,34 174,29" stroke="#2b1810" stroke-width="2" fill="none"/></g></svg>`;
  function secretos() { return safe(() => CHEF_SECRETS, []); }
  function pickSecret() {
    const all = secretos(), seen = new Set(hallados()), fresh = all.filter(s => !seen.has(s.id)), pool = fresh.length ? fresh : all;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const scRoom = {
    mount(el, api) {
      css(); sc = { api, timers: [], phase: 'search' };
      const total = secretos().length;
      el.innerHTML = `<div class="sc"><div class="sc-glowbg"></div><div class="sc-shelf" style="top:42px"></div><div class="sc-shelf" style="top:112px"></div><div class="sc-lamp">🏮</div>
        <div class="sc-top"><button class="au-back" data-back>← Salir</button><h2>📜 Los Secretos del Chef</h2><div class="sc-count" id="sc-count"></div></div>
        <div class="sc-maestro search" id="sc-m"><div class="au-m work"></div></div><div class="sc-bub" id="sc-bub">¿Dónde lo dejé…?</div>
        <div class="sc-chestwrap" id="sc-chestwrap">${CHEST}</div><button class="sc-help" id="sc-help">🙌 Ayudarle a buscar</button></div>`;
      const root = $('.sc', el), bub = $('#sc-bub', el), cnt = $('#sc-count', el), chest = $('#sc-chest', el), maestro = $('#sc-m', el), help = $('#sc-help', el), wrap = $('#sc-chestwrap', el), spr = $('.au-m', maestro);
      const upd = () => { cnt.textContent = `Hallados ${hallados().length}/${total}`; };
      const say = t => { bub.style.animation = 'none'; void bub.offsetWidth; bub.style.animation = ''; bub.textContent = t; };
      const paper = () => { const p = document.createElement('span'); p.className = 'sc-pap'; p.textContent = ['📜', '📄', '📃'][Math.floor(Math.random() * 3)]; p.style.setProperty('--dx', (-30 - Math.random() * 190).toFixed(0) + 'px'); p.style.setProperty('--dy', (-70 - Math.random() * 90).toFixed(0) + 'px'); p.style.setProperty('--r', ((Math.random() - 0.5) * 720).toFixed(0) + 'deg'); p.style.left = (44 + Math.random() * 12).toFixed(0) + '%'; wrap.appendChild(p); setTimeout(() => p.remove(), 1500); };
      for (let i = 0; i < 9; i++) { const d = document.createElement('i'); d.className = 'sc-dust'; d.style.left = (30 + Math.random() * 50).toFixed(0) + '%'; d.style.bottom = (20 + Math.random() * 120).toFixed(0) + 'px'; d.style.animationDelay = (Math.random() * 3.5).toFixed(1) + 's'; root.appendChild(d); }
      const startSearch = () => { sc.phase = 'search'; chest.classList.add('search'); chest.classList.remove('open'); maestro.className = 'sc-maestro search'; spr.className = 'au-m work'; help.style.display = ''; say(SEARCH_LINES[Math.floor(Math.random() * SEARCH_LINES.length)]); };
      sc.timers.push(setInterval(() => { if (sc.phase === 'search' && !document.hidden) paper(); }, 650));
      sc.timers.push(setInterval(() => { if (sc.phase === 'search' && !document.hidden) say(SEARCH_LINES[Math.floor(Math.random() * SEARCH_LINES.length)]); }, 2600));
      const closeCard = () => { const c = $('.sc-card', root); if (c) c.remove(); };
      const found = () => {
        if (sc.phase !== 'search') return; sc.phase = 'found'; sfx('win'); help.style.display = 'none';
        chest.classList.remove('search'); chest.classList.add('open'); maestro.className = 'sc-maestro found'; spr.className = 'au-m idle'; say('¡AQUÍ ESTÁ!');
        const s = pickSecret(); if (!s) return startSearch();
        const seen = hallados(), isNew = !seen.includes(s.id); if (isNew) { seen.push(s.id); store.set(HKEY, JSON.stringify(seen)); } upd();
        setTimeout(() => {
          if (!sc) return; closeCard();
          const c = document.createElement('div'); c.className = 'sc-card';
          c.innerHTML = `<div class="big">${s.icon}</div><div class="txt"><h3>${s.name}${isNew ? '<span class="new">¡NUEVO!</span>' : ''}</h3><div class="kj">${s.kanji || ''}</div><div class="sub">${s.subtitle || ''}</div><div class="lore">${s.lore || ''}</div><div class="btns"><button class="go" data-det="${s.id}">Ver detalle</button><button data-again>Buscar otro</button></div></div>`;
          root.appendChild(c);
        }, 650);
      };
      root.addEventListener('click', e => {
        const t = e.target.closest('[data-back],[data-det],[data-again],#sc-help,#sc-chestwrap,#sc-m'); if (!t) return;
        if (t.hasAttribute('data-back')) return api.leave();
        if (t.dataset.det) { sfx('click'); return safe(() => openSecretDetail(t.dataset.det)); }
        if (t.hasAttribute('data-again')) { sfx('click'); closeCard(); startSearch(); setTimeout(() => { if (sc) found(); }, 2400); return; }
        found();
      });
      upd(); startSearch();
    },
    unmount() { if (sc) sc.timers.forEach(clearInterval); sc = null; }
  };

  window.Inicio.registerRoom('aula', auRoom);
  window.Inicio.registerRoom('secretos', scRoom);
})();
