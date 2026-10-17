/* Pantalla principal (inicio) con la distribución de los juegos móviles actuales: la escena viva de la cocina a pantalla completa y los botones
   en los bordes. Arriba: perfil, progreso de Campaña, propinas y menú. Columnas laterales: accesos con avisos. Abajo a la derecha: el Servicio del día,
   el botón del MODO elegido (abre la selección de modos) y el JUGAR grande (entra directo al modo elegido). Abajo a la izquierda: retos y cocina libre.
   Las secciones que no son un modo (Aprender, Mejoras, Ajustes…) siguen usando el menú anterior como submenús: Inicio.openSub().
   Script clásico. Lo muestra y oculta inicio.js con Home.sync(S). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const sfx = n => { try { playSound(n); } catch (e) {} };
  const toast = m => { try { showStationToast(m); } catch (e) {} };
  const H = () => (window.Inicio && Inicio._h) || null;
  let built = false, shown = false;

  const CSS = `
  #hm { display: none; position: absolute; inset: 0; z-index: 6; overflow: hidden; background: #140a07; color: #fff8e7; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif;
    --u: clamp(9px, 2.55vh, 21px); font-size: var(--u); user-select: none; -webkit-user-select: none; }
  #start-screen.ini-on #hm.hm-on { display: block; }
  #hm * { box-sizing: border-box; }
  .hm-art { position: absolute; inset: 0; z-index: 0; display: flex; align-items: center; justify-content: center; }
  .hm-art .ec-wrap { width: 100%; height: 100%; } .hm-art .ec-scene { border-radius: 0; box-shadow: none; }
  .hm-shade { position: absolute; inset: 0; z-index: 1; pointer-events: none; background: linear-gradient(180deg, rgba(8,4,2,.78) 0, rgba(8,4,2,0) 22%, rgba(8,4,2,0) 58%, rgba(8,4,2,.82) 100%), linear-gradient(90deg, rgba(8,4,2,.55) 0, rgba(8,4,2,0) 22%, rgba(8,4,2,0) 78%, rgba(8,4,2,.55) 100%); }
  #hm.hm-rash .hm-shade { background: linear-gradient(180deg, rgba(60,0,0,.72) 0, rgba(60,0,0,0) 24%, rgba(80,0,0,0) 50%, rgba(50,0,0,.88) 100%), linear-gradient(90deg, rgba(60,0,0,.6) 0, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(60,0,0,.6) 100%); }
  .hm-ui { position: absolute; inset: 0; z-index: 2; padding: max(.6em, env(safe-area-inset-top)) max(.8em, env(safe-area-inset-right)) max(.6em, env(safe-area-inset-bottom)) max(.8em, env(safe-area-inset-left)); pointer-events: none; }
  .hm-ui button { pointer-events: auto; font-family: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  /* barra superior */
  .hm-top { position: absolute; left: max(.8em, env(safe-area-inset-left)); right: max(.8em, env(safe-area-inset-right)); top: max(.6em, env(safe-area-inset-top)); display: flex; align-items: flex-start; gap: .6em; }
  .hm-plate { border: .2em solid #120905; border-radius: .8em; background: linear-gradient(#4a2d18, #2a170c); box-shadow: 0 .3em 0 rgba(0,0,0,.55), inset 0 .1em 0 rgba(255,255,255,.12); }
  .hm-prof { display: flex; align-items: center; gap: .5em; padding: .35em .8em .35em .4em; min-width: 11em; }
  .hm-prof .av { width: calc(var(--u) * 4.4); height: calc(var(--u) * 4.4); border-radius: .6em; background: #1b0f08; border: .15em solid #ffb300; display: flex; align-items: center; justify-content: center; font-size: 1.7em; line-height: 1; }
  .hm-prof b { display: block; font: 900 1.25em/1.1 'Fredoka', sans-serif; text-shadow: 0 .1em 0 #000; max-width: 7.5em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #d58cff; text-align: left; }
  .hm-prof small { display: block; font: 800 .9em 'Fredoka', sans-serif; color: #ffd978; text-align: left; }
  .hm-prog { display: flex; flex-direction: column; justify-content: center; gap: .25em; padding: .4em .9em; min-width: 12em; text-align: left; }
  .hm-prog span { font: 900 1.25em/1 'Fredoka', sans-serif; color: #ffe082; text-shadow: 0 .1em 0 #000; } .hm-prog small { font: 800 .85em 'Fredoka', sans-serif; color: #c9b79a; }
  .hm-bar { display: block; height: .7em; border-radius: .4em; background: #120905; overflow: hidden; border: .1em solid #000; } .hm-bar u { display: block; height: 100%; background: linear-gradient(90deg, #ff8f00, #ffd54f); }
  .hm-gap { flex: 1; }
  .hm-cur { display: flex; align-items: center; gap: .4em; padding: .3em .9em .3em .5em; font: 900 1.3em/1 'Fredoka', sans-serif; text-shadow: 0 .1em 0 #000; } .hm-cur i { font-style: normal; font-size: 1.3em; }
  .hm-menu { position: relative; width: calc(var(--u) * 3.9); height: calc(var(--u) * 3.4); font-size: 1.3em; display: flex; align-items: center; justify-content: center; font-weight: 900; }
  /* botones laterales */
  .hm-col { position: absolute; display: flex; flex-direction: column; gap: .5em; top: 5.4em; }
  .hm-col.l { left: max(.8em, env(safe-area-inset-left)); } .hm-col.r { right: max(.8em, env(safe-area-inset-right)); }
  .hm-btn { position: relative; width: 7.4em; padding: .3em .2em .25em; display: flex; flex-direction: column; align-items: center; gap: .15em; }
  .hm-btn:active, .hm-mini:active, .hm-mode:active { transform: translateY(.15em); box-shadow: 0 .1em 0 rgba(0,0,0,.55); }
  .hm-btn .ic { font-size: 2em; line-height: 1; filter: drop-shadow(0 .1em .1em rgba(0,0,0,.6)); } .hm-btn .ic img { width: 1em; height: 1em; object-fit: contain; }
  .hm-btn b { display: block; width: 100%; padding: .2em 0; border-radius: .4em; background: #ffb300; color: #2b1808; font: 900 .85em/1 'Fredoka', sans-serif; white-space: nowrap; letter-spacing: .2px; text-align: center; box-shadow: inset 0 -.15em 0 rgba(0,0,0,.22); }
  .hm-btn.dark b { background: #2d2118; color: #fff3d6; }
  .hm-flag { position: absolute; top: -.7em; right: -.4em; z-index: 2; font: 900 .8em/1 'Fredoka', sans-serif; letter-spacing: .3px; color: #fff; padding: .3em .55em; border-radius: .7em; border: .15em solid #fff3d0; pointer-events: none; background: #e53935; box-shadow: 0 .2em 0 #7f0000; animation: hubFlagPulse 1.3s ease-in-out infinite; }
  .hm-flag.buy { background: #2e9e4f; box-shadow: 0 .2em 0 #14532d; } .hm-flag.go { background: #ff8f00; box-shadow: 0 .2em 0 #8a4b00; }
  .hm-menu .hm-flag { top: -.9em; right: -.5em; }
  /* abajo a la izquierda */
  .hm-bl { position: absolute; left: max(.8em, env(safe-area-inset-left)); bottom: max(.6em, env(safe-area-inset-bottom)); display: flex; gap: .6em; align-items: flex-end; }
  .hm-mini { position: relative; display: flex; align-items: center; gap: .5em; padding: .45em .8em .45em .5em; text-align: left; }
  .hm-mini .ic { font-size: 2.2em; line-height: 1; } .hm-mini b { display: block; font: 900 1.05em/1.05 'Fredoka', sans-serif; color: #ffe082; text-shadow: 0 .1em 0 #000; } .hm-mini small { display: block; font: 800 .85em 'Fredoka', sans-serif; color: #d6c4a4; }
  /* abajo a la derecha */
  .hm-br { position: absolute; right: max(.8em, env(safe-area-inset-right)); bottom: max(.6em, env(safe-area-inset-bottom)); display: flex; flex-direction: column; align-items: flex-end; gap: .5em; }
  .hm-daily { pointer-events: auto; cursor: pointer; padding: .2em .8em .45em; border-radius: .8em .8em 0 0; background: linear-gradient(#e28a00, #b86400); border: .2em solid #120905; border-bottom: 0; position: relative; margin-right: .5em; }
  .hm-daily .hub-daily { gap: .4em; } .hm-daily .svc-lab { color: #fff; font-size: .95em; text-shadow: 0 .1em 0 #000; } .hm-daily .svc-dot { min-width: 2.4em; height: 1.9em; font-size: .95em; border-radius: .5em; background: rgba(0,0,0,.45); } .hm-daily .svc-chest { font-size: 1.5em; filter: none; } .hm-daily .svc-chest:not(.ready) { filter: grayscale(.5); } .hm-daily .svc-streak { font-size: .95em; }
  .hm-row { display: flex; align-items: stretch; gap: .5em; }
  .hm-mode { position: relative; width: 22em; height: 7.4em; padding: 0; overflow: hidden; display: flex; align-items: stretch; text-align: left; }
  .hm-mode .mi { flex: none; width: calc(var(--u) * 5.6); display: flex; align-items: center; justify-content: center; font-size: 3em; background: radial-gradient(circle, var(--c, #ff9800), #1e100a 90%); }
  .hm-mode .mt { flex: 1; min-width: 0; padding: .55em .5em; display: flex; flex-direction: column; justify-content: center; gap: .15em; }
  .hm-mode small { font: 800 .8em 'Fredoka', sans-serif; color: #b9a98c; } .hm-mode b { font: 900 1.55em/1 'Fredoka', sans-serif; color: #fff; text-shadow: 0 .1em 0 #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .hm-mode em { font: 800 1em 'Fredoka', sans-serif; color: #ffd978; font-style: normal; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hm-mode .mtag { flex: none; align-self: stretch; display: flex; align-items: center; padding: 0 .6em; background: #ffd24a; color: #2b1808; font: 900 .95em/1.1 'Fredoka', sans-serif; text-align: center; max-width: 5.6em; }
  .hm-play { width: calc(var(--u) * 17); height: calc(var(--u) * 7.4); border: .22em solid #120905; border-radius: .8em; background: linear-gradient(#ffe45c, #f5b800 55%, #e0a000); box-shadow: 0 .35em 0 #8a5a00, 0 .45em .8em rgba(0,0,0,.5); color: #2b1808; font: 400 3.3em/1 'Fredoka One', 'Fredoka', sans-serif; letter-spacing: .5px; text-shadow: 0 .06em 0 rgba(255,255,255,.55); display: flex; align-items: center; justify-content: center; }
  .hm-play:active { transform: translateY(.2em); box-shadow: 0 .15em 0 #8a5a00; }
  .hm-play.lock { filter: saturate(.7); }
  @media (max-height: 340px) { .hm-col { gap: .45em; top: 5em; } .hm-btn .ic { font-size: 2em; } }
  @media (max-aspect-ratio: 16/10) { .hm-mode { width: 18em; } .hm-play { width: 14em; } }
  @media (prefers-reduced-motion: reduce) { .hm-flag { animation: none; } }
  `;
  function css() { if ($('hm-css')) return; const s = document.createElement('style'); s.id = 'hm-css'; s.textContent = CSS; document.head.appendChild(s); }

  function build() {
    const sc = $('start-screen'); if (!sc) return false;
    css();
    const el = document.createElement('div'); el.id = 'hm';
    el.innerHTML = '<div class="hm-art" id="hm-art"></div><div class="hm-shade"></div><div class="hm-ui" id="hm-ui"></div>';
    sc.appendChild(el); built = true;
    try { if (window.EscenaCocina) $('hm-art').innerHTML = EscenaCocina.html('jugar'); } catch (e) { console.warn('[Home] escena', e); }
    return true;
  }
  const flag = id => { const h = H(); const a = h && h.alertOf(id); return a ? `<i class="hm-flag ${a.k}">${a.t}</i>` : ''; };
  const btn = (ic, label, onclick, id, dark) => `<button class="hm-btn hm-plate ${dark ? 'dark' : ''}" onclick="${onclick}">${id ? flag(id) : ''}<span class="ic">${ic}</span><b>${label}</b></button>`;

  function ui() {
    const h = H(); if (!h) return '';
    const sel = window.Modos ? Modos.current() : { id: 'camp', icon: '🏮', title: 'CAMPAÑA', sub: '', tag: '', col: '#ff9800', top: '' };
    let cs = { stars: 0, maxStars: 60, unlockedLevel: 1 }; try { cs = getCampaignStatsSummary(); } catch (e) {}
    const L = Math.min(20, cs.unlockedLevel || 1), pct = cs.maxStars ? Math.round(100 * cs.stars / cs.maxStars) : 0;
    const tut = h.tutDone(), rec = window.Recetario ? Recetario.summary() : { fresh: 0 };
    return `<div class="hm-top">
        <button class="hm-prof hm-plate" onclick="openProfileModal()" aria-label="Perfil"><span class="av">${h.chefAvatar()}</span><span><b>${h.chefName()}</b><small>Chef · Nivel ${L}</small></span></button>
        <button class="hm-prog hm-plate" onclick="Inicio.act('camp')" aria-label="Progreso de Campaña"><span>⭐ ${cs.stars}/${cs.maxStars}</span><i class="hm-bar"><u style="width:${pct}%"></u></i><small>Campaña · nivel ${L} de 20</small></button>
        <span class="hm-gap"></span>
        <button class="hm-cur hm-plate" onclick="Inicio.act('knives')" aria-label="Propinas"><i>🧧</i><span class="hm-wallet">${h.wallet()}</span></button>
        <button class="hm-menu hm-plate" onclick="Home.menu()" aria-label="Ajustes">☰${flag('gear')}</button>
      </div>
      <div class="hm-col l">
        ${btn('📖', 'RECETARIO', "Recetario.open()", 'book')}
        ${btn('🛠️', 'MEJORAS', "Inicio.act('knives')", 'knives', true)}
        ${btn('🎓', 'APRENDER', "Inicio.openSub('aprender','aula')", 'aprender', true)}
      </div>
      <div class="hm-col r">
        ${btn('🏆', 'RANKING', "Inicio.act('board')", null, true)}
        ${btn('🗝️', 'SECRETOS', "Inicio.act('chest')", null, true)}
        ${btn('📊', 'PROGRESO', "Inicio.act('stats')", null, true)}
      </div>
      <div class="hm-bl">
        <button class="hm-mini hm-plate" onclick="Inicio.act('tickets')"><span class="ic">🎫</span><span><b>RETOS</b><small>${h.retosHechos()}/${window.TRAINING_CHALLENGES ? TRAINING_CHALLENGES.length : 50}</small></span></button>
        <button class="hm-mini hm-plate" onclick="Inicio.openSub('aprender','free')"><span class="ic">🌿</span><span><b>LIBRE</b><small>Sin reloj</small></span></button>
      </div>
      <div class="hm-br">
        ${tut && window.Servicio ? `<div class="hm-daily" onclick="Servicio.open()">${Servicio.strip()}${Servicio.summary().chestReady ? '<i class="hm-flag buy">¡COFRE!</i>' : ''}</div>` : ''}
        <div class="hm-row">
          <button class="hm-mode hm-plate" style="--c:${sel.col}" onclick="Modos.open()" aria-label="Elegir modo de juego"><span class="mi">${sel.icon}</span><span class="mt"><small>${sel.top || 'Modo elegido'}</small><b>${sel.title}</b><em>${sel.sub}</em></span>${sel.tag ? `<span class="mtag">${sel.tag}</span>` : ''}</button>
          <button class="hm-play ${tut ? '' : 'lock'}" onclick="Home.play()">${tut ? 'JUGAR' : 'EMPEZAR'}</button>
        </div>
      </div>`;
  }
  function paint() {
    if (!built && !build()) return;
    const u = $('hm-ui'); if (u) u.innerHTML = ui();
    const hm = $('hm'); if (hm) hm.classList.toggle('hm-rash', !!(window.Modos && Modos.current().id === 'rash'));
  }

  window.Home = {
    /** Lo llama inicio.js cuando cambia la vista: muestra la pantalla principal solo en la raíz del menú (sin submenú ni sala abierta). */
    sync(S) {
      const want = !!(S && !S.sub && !S.curRoom);
      if (!built && want && !build()) return;
      const hm = $('hm'); if (!hm) return;
      if (want) paint();
      hm.classList.toggle('hm-on', want); shown = want;
      try { if (want && window.EscenaCocina) EscenaCocina.preload(); } catch (e) {}
    },
    refresh() { if (shown) paint(); },
    menu() { sfx('click'); try { Inicio.openSub('gear', 'sound'); } catch (e) {} },
    play() {
      const h = H(); if (!h) return;
      if (!h.tutDone()) { sfx('serve'); toast('🎓 Primero la lección de ramen con el Maestro: así empieza todo.'); try { Inicio.openSub('aprender', 'aula'); } catch (e) {} return; }
      sfx('serve'); try { Modos.play(); } catch (e) { console.warn('[Home] play', e); }
    }
  };
})();
