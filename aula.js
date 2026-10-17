/* Bodega de los Secretos del Maestro (sala del inicio). El Aula del Maestro ahora es la pantalla de tarjetas de modos.js (Modos.aula).
   Se registran en Inicio (inicio.js), que las abre con la transición de velocidad. Cada sala recibe su contenedor y una pequeña API (leave, act...).
   El Maestro usa el sprite del Maestro de Ramen (assets/people/cook_ramen_v1.webp: fila 0 caminar, fila 1 trabajar, fila 2 caminar de espaldas). */
(function () {
  'use strict';
  if (!window.Inicio) return;
  const SPRITE = 'assets/people/cook_ramen_v1.webp';

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

  window.Inicio.registerRoom('secretos', scRoom);
})();
