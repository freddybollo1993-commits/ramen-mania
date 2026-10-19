/* Pantalla principal (inicio) con la distribución de los juegos móviles actuales: la escena viva de la cocina a pantalla completa y los botones
   en los bordes. Arriba: perfil, progreso de Campaña, propinas y menú. Columnas laterales: accesos con avisos. Abajo a la derecha: el Servicio del día,
   el botón del MODO elegido (abre la selección de modos) y el JUGAR grande (entra directo al modo elegido). Abajo a la izquierda: retos y cocina libre.
   Script clásico. Lo muestra inicio.js con Home.sync(). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const sfx = n => { try { playSound(n); } catch (e) {} };
  const toast = m => { try { showStationToast(m); } catch (e) {} };
  const H = () => (window.Inicio && Inicio._h) || null;
  let built = false, shown = false;

  const CSS = `
  #hm { display: none; position: absolute; inset: 0; z-index: 6; overflow: hidden; background: #140a07; color: #fff8e7; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif;
    --u: clamp(9px, min(2.55vh, 1.145vw), 21px); font-size: var(--u); user-select: none; -webkit-user-select: none; }
  #hm.hm-on { display: block; }
  #app-version { position: absolute; left: max(.8em, env(safe-area-inset-left)); bottom: max(.5em, env(safe-area-inset-bottom)); z-index: 7; font: 800 10px 'Fredoka', sans-serif; color: rgba(255,243,214,.55); text-shadow: 0 1px 2px #000; pointer-events: none; }
  #hm * { box-sizing: border-box; }
  .hm-art { position: absolute; inset: 0; z-index: 0; background: #140a07 url(assets/ramen_bg.webp) center 40% / cover no-repeat; }
  .hm-art::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 34% 62% at 50% 62%, rgba(255,196,110,.30), rgba(255,196,110,0) 70%), linear-gradient(rgba(14,7,4,.42), rgba(14,7,4,.42)); }
  .hm-art::after { content: ''; position: absolute; left: 50%; bottom: 3%; width: 46%; height: 12%; transform: translateX(-50%); background: radial-gradient(ellipse, rgba(255,214,150,.34), rgba(255,214,150,0) 68%); }
  .hm-shade { position: absolute; inset: 0; z-index: 1; pointer-events: none; background: linear-gradient(180deg, rgba(8,4,2,.78) 0, rgba(8,4,2,0) 22%, rgba(8,4,2,0) 58%, rgba(8,4,2,.82) 100%), linear-gradient(90deg, rgba(8,4,2,.55) 0, rgba(8,4,2,0) 22%, rgba(8,4,2,0) 78%, rgba(8,4,2,.55) 100%); }
  #hm.hm-rash .hm-shade { background: linear-gradient(180deg, rgba(60,0,0,.72) 0, rgba(60,0,0,0) 24%, rgba(80,0,0,0) 50%, rgba(50,0,0,.88) 100%), linear-gradient(90deg, rgba(60,0,0,.6) 0, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(60,0,0,.6) 100%); }
  .hm-ui { position: absolute; inset: 0; z-index: 2; padding: max(.6em, env(safe-area-inset-top)) max(.8em, env(safe-area-inset-right)) max(.6em, env(safe-area-inset-bottom)) max(.8em, env(safe-area-inset-left)); pointer-events: none; }
  .hm-ui button { pointer-events: auto; font-family: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  /* barra superior */
  .hm-top { position: absolute; left: max(.8em, env(safe-area-inset-left)); right: max(.8em, env(safe-area-inset-right)); top: max(.6em, env(safe-area-inset-top)); display: flex; align-items: flex-start; gap: .6em; }
  .hm-plate { border: .2em solid #120905; border-radius: .8em; background: linear-gradient(#4a2d18, #2a170c); box-shadow: 0 .3em 0 rgba(0,0,0,.55), inset 0 .1em 0 rgba(255,255,255,.12); }
  .hm-prof { display: flex; align-items: center; gap: .5em; padding: .35em .8em .35em .4em; min-width: 11em; }
  .hm-prof .av { width: calc(var(--u) * 4.4); height: calc(var(--u) * 4.4); border-radius: .6em; background: #1b0f08; border: .15em solid #ffb300; display: flex; align-items: center; justify-content: center; font-size: 1.7em; line-height: 1; overflow: hidden; } .hm-prof .av img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; display: block; }
  .hm-prof b { display: block; font: 900 1.25em/1.1 'Fredoka', sans-serif; text-shadow: 0 .1em 0 #000; max-width: 7.5em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #d58cff; text-align: left; }
  .hm-prof small { display: block; font: 800 .9em 'Fredoka', sans-serif; color: #ffd978; text-align: left; }
  .hm-prog { display: flex; flex-direction: column; justify-content: center; gap: .25em; padding: .4em .9em; min-width: 12em; text-align: left; }
  .hm-prog span { font: 900 1.25em/1 'Fredoka', sans-serif; color: #ffe082; text-shadow: 0 .1em 0 #000; } .hm-prog small { font: 800 .85em 'Fredoka', sans-serif; color: #c9b79a; }
  .hm-bar { display: block; height: .7em; border-radius: .4em; background: #120905; overflow: hidden; border: .1em solid #000; } .hm-bar u { display: block; height: 100%; background: linear-gradient(90deg, #ff8f00, #ffd54f); }
  .hm-gap { flex: 1; }
  .hm-cur { display: flex; align-items: center; gap: .4em; min-height: calc(var(--u) * 4.4); padding: .3em .9em .3em .5em; font: 900 1.3em/1 'Fredoka', sans-serif; text-shadow: 0 .1em 0 #000; } .hm-cur i { font-style: normal; font-size: 1.3em; }
  .hm-btn .ic svg { width: 1em; height: 1em; display: block; }
  .hm-menu { position: relative; width: calc(var(--u) * 4.6); height: calc(var(--u) * 4.4); font-size: 1.3em; display: flex; align-items: center; justify-content: center; font-weight: 900; }
  /* botones laterales */
  .hm-col { position: absolute; display: flex; flex-direction: column; gap: 1em; top: 6.8em; }
  .hm-col.l { left: max(.8em, env(safe-area-inset-left)); } .hm-col.r { right: max(.8em, env(safe-area-inset-right)); }
  /* botones laterales: placa pequeña abajo con el nombre, el ícono grande al centro sobresaliendo hacia arriba y el aviso chico a un lado (sin invadir al vecino) */
  .hm-btn.hm-plate { position: relative; width: 7.2em; height: 5.4em; padding: 0; border: 0; background: none; box-shadow: none; display: block; font-size: 1em; }
  .hm-btn::before { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3em; border: .18em solid #120905; border-radius: .8em; background: linear-gradient(#ffd54f, #f5a800); box-shadow: 0 .25em 0 rgba(0,0,0,.55), inset 0 .12em 0 rgba(255,255,255,.4); }
  .hm-btn.dark::before { background: linear-gradient(#5a3a22, #2a170c); box-shadow: 0 .25em 0 rgba(0,0,0,.55), inset 0 .12em 0 rgba(255,255,255,.14); }
  .hm-btn:active, .hm-mini:active, .hm-mode:active, .hm-mis:active { transform: translateY(.15em); box-shadow: 0 .1em 0 rgba(0,0,0,.55); }
  .hm-btn .ic { position: absolute; left: 50%; top: 0; transform: translateX(-50%); font-size: 3.4em; line-height: 1; filter: drop-shadow(0 .04em 0 #120905) drop-shadow(0 .08em .08em rgba(0,0,0,.6)); } .hm-btn .ic img { width: 1em; height: 1em; object-fit: contain; }
  .hm-btn b { position: absolute; left: 0; right: 0; bottom: .7em; display: block; padding: 0; background: none; color: #2b1808; font: 900 .95em/1 'Fredoka', sans-serif; white-space: nowrap; letter-spacing: .2px; text-align: center; }
  .hm-btn.dark b { color: #fff3d6; text-shadow: 0 .1em 0 #000, 0 0 .2em #000; }
  .hm-btn .hm-flag { top: .3em; right: calc(var(--u) * -1.4); font-size: .68em; padding: .25em .45em; border-width: .12em; box-shadow: 0 .15em 0 #7f0000; } .hm-btn .hm-flag.buy { box-shadow: 0 .15em 0 #14532d; } .hm-btn .hm-flag.go { box-shadow: 0 .15em 0 #8a4b00; }
  .hm-col.r .hm-btn .hm-flag { right: auto; left: calc(var(--u) * -1.4); }
  .hm-flag { position: absolute; top: -.7em; right: -.4em; z-index: 2; font: 900 .8em/1 'Fredoka', sans-serif; letter-spacing: .3px; color: #fff; padding: .3em .55em; border-radius: .7em; border: .15em solid #fff3d0; pointer-events: none; background: #e53935; box-shadow: 0 .2em 0 #7f0000; animation: hubFlagPulse 1.3s ease-in-out infinite; }
  .hm-flag.buy { background: #2e9e4f; box-shadow: 0 .2em 0 #14532d; } .hm-flag.go { background: #ff8f00; box-shadow: 0 .2em 0 #8a4b00; }
  .hm-menu .hm-flag { top: -.9em; right: -.5em; }
  /* abajo a la izquierda */
  .hm-bl { position: absolute; left: max(.8em, env(safe-area-inset-left)); bottom: calc(max(.6em, env(safe-area-inset-bottom)) + 1.5em); display: flex; gap: .6em; align-items: flex-end; }
  /* MISIONES: placa ancha con el tablero grande saliendo por arriba y el avance (3/3) como etiqueta naranja */
  .hm-mis, .hm-mode, .hm-go { font-size: calc(var(--u) * 1.15); }       /* los botones traen 13 px por defecto: se fija su escala con la de la pantalla */
  .hm-mis { position: relative; display: flex; align-items: center; width: 11.2em; height: 4.4em; padding: 0 .6em 0 5.3em; }
  .hm-mis .mic { position: absolute; left: .3em; bottom: .12em; width: 5em; height: 5em; filter: drop-shadow(0 .08em 0 #120905) drop-shadow(0 .12em .15em rgba(0,0,0,.5)); } .hm-mis .mic svg, .hm-mis .mic img { width: 100%; height: 100%; display: block; object-fit: contain; } .hm-cur i img { width: 1.5em; height: 1.5em; display: block; object-fit: contain; }
  .hm-mis b { font: 900 1.15em/1 'Fredoka', sans-serif; color: #fff; text-shadow: 0 .08em 0 #000, 0 0 .3em rgba(0,0,0,.6); letter-spacing: .2px; }
  .hm-mis.all { box-shadow: 0 0 1.1em rgba(255,179,0,.7), 0 .25em 0 rgba(0,0,0,.55), inset 0 .1em 0 rgba(255,255,255,.14); }
  .hm-mis .mbadge { position: absolute; top: -.75em; right: .45em; padding: .06em .5em; border-radius: 1em; border: .1em solid #fff3d0; background: linear-gradient(#ffa726, #f57c00); color: #fff; font: 900 .9em/1.15 'Fredoka', sans-serif; text-shadow: 0 .08em 0 rgba(0,0,0,.45); box-shadow: 0 .12em 0 #8a4b00; pointer-events: none; } .hm-mis .mbadge.buy { background: linear-gradient(#66bb6a, #2e7d32); box-shadow: 0 .12em 0 #14532d; }
  .hm-mini { position: relative; display: flex; align-items: center; gap: .5em; padding: .45em .8em .45em .5em; text-align: left; }
  .hm-mini .ic { font-size: 2.2em; line-height: 1; } .hm-mini b { display: block; font: 900 1.05em/1.05 'Fredoka', sans-serif; color: #ffe082; text-shadow: 0 .1em 0 #000; } .hm-mini small { display: block; font: 800 .85em 'Fredoka', sans-serif; color: #d6c4a4; }
  /* abajo a la derecha */
  .hm-br { position: absolute; right: max(.8em, env(safe-area-inset-right)); bottom: max(.6em, env(safe-area-inset-bottom)); display: flex; flex-direction: column; align-items: flex-end; gap: .5em; }


  .hm-row { display: flex; align-items: flex-end; gap: .6em; }
  .hm-mode { position: relative; display: flex; align-items: stretch; width: 17.5em; height: 6.2em; padding: 0; border: 0; background: none; text-align: center; }

  .hm-mode .mp, .hm-go .mp { display: flex; align-items: stretch; width: 100%; height: 100%; border-radius: .8em; overflow: hidden; }
  .hm-mode .mi { flex: none; width: calc(var(--u) * 3.9); display: flex; align-items: center; justify-content: center; font-size: 2em; background: radial-gradient(circle at 40% 35%, var(--c, #ff9800), #1e100a 95%); }
  .hm-mode .mi img { width: 82%; height: 82%; object-fit: contain; filter: drop-shadow(0 .08em .08em rgba(0,0,0,.5)); }
  .hm-drop .ic img { width: 1.15em; height: 1.15em; object-fit: contain; vertical-align: middle; }
  .hm-mode .mt { flex: 1; min-width: 0; padding: .2em .6em; display: flex; align-items: center; justify-content: center; text-align: center; }
  .hm-mode b { display: block; font: 900 1.7em/1.02 'Fredoka', sans-serif; color: #fff; text-shadow: 0 .08em 0 #000, 0 0 .3em rgba(0,0,0,.5); text-transform: uppercase; text-wrap: balance; letter-spacing: .3px; }
  .hm-mode .mtag { position: absolute; top: -.7em; right: .4em; padding: .1em .45em; border-radius: .6em; border: .1em solid #120905; background: #ffd24a; color: #2b1808; font: 900 .62em/1.2 'Fredoka', sans-serif; white-space: nowrap; box-shadow: 0 .12em 0 rgba(0,0,0,.5); }
  .hm-go { display: flex; align-items: stretch; width: 15.5em; height: 6.2em; padding: 0; border: 0; background: none; text-align: center; }
  .hm-go .mp { padding: .3em; }
  .hm-play { flex: 1; display: flex; align-items: center; justify-content: center; border: .08em solid #fff0a8; border-radius: .55em; background: linear-gradient(#ffe45c, #f5b800 55%, #e0a000); box-shadow: inset 0 .1em 0 rgba(255,255,255,.5), inset 0 -.15em 0 rgba(0,0,0,.2); color: #2b1808; font: 400 2.3em/1 'Fredoka One', 'Fredoka', sans-serif; letter-spacing: .5px; text-shadow: 0 .05em 0 rgba(255,255,255,.4); }
  .hm-go:active { transform: translateY(.15em); }
  .hm-play.lock { filter: saturate(.7); }
  .hm-play.search { flex-direction: column; gap: .12em; font-size: 1.55em; background: linear-gradient(#7fdcff, #2f9bd8 55%, #1d78b8); border-color: #c9efff; color: #06243a; animation: hmQ 1.1s ease-in-out infinite alternate; }
  .hm-play.search small { font: 900 .5em/1 'Fredoka', sans-serif; letter-spacing: .6px; } .hm-play.search b { font: 400 1.25em/1 'Fredoka One', 'Fredoka', sans-serif; }
  .hm-play.found { font-size: 1.7em; background: linear-gradient(#8cf08c, #2fb52f 55%, #1f8f1f); border-color: #d6ffd6; color: #07300a; animation: hmQ .6s ease-in-out infinite alternate; }
  @keyframes hmQ { from { filter: brightness(1); } to { filter: brightness(1.18); } }
  /* tarjeta del modo elegido: al centro, grande y con brillo; queda entre las columnas laterales y por encima de la fila de botones de abajo */
  .hm-sel { position: absolute; left: 50%; top: 6.4em; transform: translateX(-50%); width: min(37em, calc(100% - 20em)); max-height: calc(100% - 6.4em - 9.6em); display: flex; align-items: stretch; gap: .9em; padding: .8em .9em; text-align: left; border: .22em solid color-mix(in srgb, var(--c, #ffb300) 55%, #fff3b0); border-radius: 1em; overflow: hidden; background: var(--bg, #2a170c); color: #fff; pointer-events: auto; cursor: pointer; animation: hmGlow 2.6s ease-in-out infinite; }
  .hm-sel::before { content: ''; position: absolute; inset: 0; background: linear-gradient(100deg, rgba(10,5,2,.88) 0, rgba(10,5,2,.7) 46%, rgba(10,5,2,.42) 100%); }
  .hm-sel > * { position: relative; }
  .hm-sel .sa { flex: none; width: 8.6em; display: flex; align-items: center; justify-content: center; }
  .hm-sel .sa img { width: 100%; height: auto; max-height: 100%; object-fit: contain; filter: drop-shadow(0 .15em .25em rgba(0,0,0,.7)); } .hm-sel .sa span { font-size: 5.5em; line-height: 1; }
  .hm-sel .sx { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: .35em; }
  .hm-sel .sk { align-self: flex-start; font: 900 .8em/1 'Fredoka', sans-serif; letter-spacing: .6px; text-transform: uppercase; padding: .25em .7em; border-radius: .9em; background: var(--c, #ff9800); color: #fff; text-shadow: 0 .08em 0 rgba(0,0,0,.5); }
  .hm-sel h3 { margin: 0; font: 400 2em/1.02 'Fredoka One', 'Fredoka', sans-serif; color: #ffe94d; text-shadow: 0 .1em 0 #1a0e07, .08em .08em 0 #1a0e07, -.08em 0 0 #1a0e07; }
  .hm-sel .ss { font: 800 1em/1.1 'Fredoka', sans-serif; color: #ffd978; }
  .hm-sel p { margin: 0; font: 700 1.05em/1.3 'Fredoka', sans-serif; color: #fff; text-shadow: 0 .06em 0 rgba(0,0,0,.6); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .hm-sel .sm { align-self: flex-start; font: 900 .85em/1 'Fredoka', sans-serif; padding: .3em .7em; border-radius: .8em; background: rgba(0,0,0,.6); color: #ffe9b0; }
  @keyframes hmGlow { 0%, 100% { box-shadow: 0 0 .9em .15em color-mix(in srgb, var(--c, #ffb300) 70%, transparent), 0 0 2.2em .5em color-mix(in srgb, var(--c, #ffb300) 38%, transparent), 0 .3em 0 rgba(0,0,0,.55); } 50% { box-shadow: 0 0 1.5em .35em color-mix(in srgb, var(--c, #ffb300) 95%, transparent), 0 0 3.4em .9em color-mix(in srgb, var(--c, #ffb300) 55%, transparent), 0 .3em 0 rgba(0,0,0,.55); } }
  #hm.menu-open .hm-sel { opacity: 0; pointer-events: none; }
  /* menú ☰: lista desplegable a la derecha que no tapa la escena; las columnas y el botón JUGAR se apartan mientras está abierto */
  .hm-scrim { position: absolute; inset: 0; display: none; pointer-events: auto; background: rgba(0,0,0,.28); }
  #hm.menu-open .hm-scrim { display: block; }
  #hm.menu-open .hm-col.r, #hm.menu-open .hm-go { opacity: 0; pointer-events: none; transform: translateX(1.5em); transition: opacity .18s, transform .18s; }
  .hm-col.r, .hm-go { transition: opacity .18s, transform .18s; }
  .hm-drop { position: absolute; right: max(.8em, env(safe-area-inset-right)); top: 5em; width: 17em; display: none; flex-direction: column; gap: .35em; }
  #hm.menu-open .hm-drop { display: flex; }
  .hm-drop button { position: relative; display: flex; align-items: center; gap: .7em; width: 100%; padding: 1em .8em; border: .15em solid rgba(0,0,0,.6); border-radius: .5em; background: linear-gradient(90deg, rgba(36,24,16,.94), rgba(52,34,22,.9)); color: #fff3d6; text-align: left; font: 900 .95em/1 'Fredoka', sans-serif; letter-spacing: .2px;
    box-shadow: 0 .2em 0 rgba(0,0,0,.45); animation: hmDrop .22s ease-out both; animation-delay: calc(var(--i) * 35ms); }
  .hm-drop button .ic { flex: none; width: 1.7em; text-align: center; font-size: 1.5em; line-height: 1; }
  .hm-drop button:active { transform: translateY(.1em); }
  .hm-drop .hm-flag { top: -.5em; right: .4em; }
  @keyframes hmDrop { from { opacity: 0; transform: translateX(40%); } to { opacity: 1; transform: translateX(0); } }
  /* páginas de información (Registro, Novedades, Acerca): mismo marco que la selección de modos */
  #hp { position: fixed; inset: 0; z-index: 9120; display: flex; flex-direction: column; color: #fff3d6; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; overflow: hidden;
    background: radial-gradient(circle at 20% 0%, #5a2c14 0%, #24100a 55%, #120806 100%); padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
  #hp * { box-sizing: border-box; }
  .hp-top { display: flex; align-items: center; justify-content: space-between; height: 44px; flex-shrink: 0; }
  .hp-nav { height: 42px; min-width: 64px; border: 0; background: #2b2018; color: #fff; font: 900 22px/1 'Fredoka', sans-serif; cursor: pointer; border-bottom: 3px solid #0e0805; }
  .hp-nav.l { border-radius: 0 0 14px 0; } .hp-nav.r { border-radius: 0 0 0 14px; }
  .hp-top h2 { margin: 0; font: 400 18px 'Fredoka One', 'Fredoka', sans-serif; color: #ffd978; text-shadow: 0 2px 0 rgba(0,0,0,.6); letter-spacing: .6px; }
  .hp-body { flex: 1; min-height: 0; overflow-y: auto; padding: 6px max(16px, env(safe-area-inset-right)) 14px max(16px, env(safe-area-inset-left)); -webkit-overflow-scrolling: touch; }
  .hp-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; } .hp-chips b { background: rgba(0,0,0,.4); border: 1.5px solid rgba(255,204,80,.35); border-radius: 12px; padding: 3px 10px; font: 800 12px 'Fredoka', sans-serif; color: #ffe9b0; }
  .hp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px; }
  .hp-card { border: 3px solid #0e0805; border-radius: 10px; overflow: hidden; background: #1c0f09; box-shadow: 0 3px 0 rgba(0,0,0,.5); }
  .hp-card .hd { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 5px 9px; background: var(--c, #6d4c41); } .hp-card .hd b { font: 900 13px 'Fredoka', sans-serif; text-shadow: 0 2px 0 rgba(0,0,0,.5); } .hp-card .hd span { font: 900 11px 'Fredoka', sans-serif; background: rgba(0,0,0,.45); border-radius: 8px; padding: 2px 8px; }
  .hp-card .bd { padding: 6px 9px 8px; font: 700 12px/1.35 'Fredoka', sans-serif; color: #e9d5b0; } .hp-card .bd i { font-style: normal; margin-right: 10px; } .hp-card .bd small { display: block; color: #a98c68; margin-top: 3px; font-size: 10.5px; }
  .hp-sets { display: flex; flex-direction: column; gap: 7px; } .hp-set { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; cursor: pointer; background: rgba(0,0,0,.3); border: 2px solid rgba(255,255,255,.12); border-radius: 12px; padding: 8px 12px; color: #fff3d6; font-family: 'Fredoka', sans-serif; -webkit-tap-highlight-color: transparent; } .hp-set:active { transform: scale(.985); background: rgba(255,179,0,.12); } .hp-set .ic { flex: none; width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,.08); display: flex; align-items: center; justify-content: center; font-size: 24px; } .hp-set .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; } .hp-set b { font: 900 13px 'Fredoka', sans-serif; } .hp-set small { font: 700 11.5px/1.3 'Fredoka', sans-serif; color: #c9b79a; } .hp-set em { flex: none; font: 900 10px 'Fredoka', sans-serif; font-style: normal; background: rgba(255,179,0,.18); border: 1.5px solid rgba(255,204,80,.5); color: #ffd978; border-radius: 8px; padding: 2px 8px; } .hp-set i { flex: none; color: #ffb300; font-style: normal; } .hp-set .hm-flag { top: -.55em; right: .6em; font-size: 10px; } .hp-hint { margin: 8px 2px 0; font: 700 11.5px/1.35 'Fredoka', sans-serif; color: #a98c68; text-align: center; }
  .hp-news { display: flex; gap: 10px; align-items: flex-start; background: rgba(0,0,0,.3); border: 2px solid rgba(255,255,255,.1); border-radius: 12px; padding: 8px 10px; margin-bottom: 7px; } .hp-news .ic { flex: none; font-size: 26px; width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,.08); display: flex; align-items: center; justify-content: center; }
  .hp-news b { font: 900 13px 'Fredoka', sans-serif; color: #fff3d6; } .hp-news em { font: 900 10px 'Fredoka', sans-serif; font-style: normal; background: #e53935; color: #fff; border-radius: 6px; padding: 1px 6px; margin-left: 6px; } .hp-news p { margin: 2px 0 0; font: 700 12px/1.35 'Fredoka', sans-serif; color: #c9b79a; }
  .hp-empty { text-align: center; color: #a98c68; font: 700 13px 'Fredoka', sans-serif; padding: 30px 10px; }
  @media (max-height: 340px) { .hm-col { gap: .7em; top: 5em; } .hm-btn .ic { font-size: 3em; } }
  @media (max-aspect-ratio: 16/10) { .hm-mis { width: 10.5em; } }
  @media (prefers-reduced-motion: reduce) { .hm-flag { animation: none; } }
  `;
  function css() { if ($('hm-css')) return; const s = document.createElement('style'); s.id = 'hm-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ---------- menú ☰: información, reportes y ajustes (no son modos de juego) ----------
  const MENU = [
    { id: 'ajustes', ic: '⚙️', art: 'btn_ajustes', label: 'AJUSTES', flag: 'sound' },
    { id: 'stats', ic: '📊', label: 'ESTADÍSTICAS' },
    { id: 'registro', ic: '📜', label: 'REGISTRO DE SERVICIO' },
    { id: 'cuenta', ic: '👤', art: 'btn_perfil', label: 'MI CUENTA Y NUBE' },
    { id: 'actualizar', ic: '🔄', label: 'ACTUALIZAR' },
    { id: 'acerca', ic: 'ℹ️', label: 'ACERCA DE' }
  ];

  function page(title, body) {
    let p = $('hp'); if (p) p.remove();
    p = document.createElement('div'); p.id = 'hp';
    p.innerHTML = '<div class="hp-top"><button class="hp-nav l" onclick="Home.closePage()" aria-label="Volver">◀</button><h2>' + title + '</h2><button class="hp-nav r" onclick="Home.closePage()" aria-label="Inicio">🏠</button></div><div class="hp-body">' + body + '</div>';
    document.body.appendChild(p);
  }
  const MODE_NAME = { NORMAL: ['🏮', 'Campaña', '#ff9800'], RASH: ['⚡', 'Rash', '#e53935'], TRAINING: ['🎫', 'Entrenamiento', '#43a047'], FREE: ['🌿', 'Cocina libre', '#26a69a'], COOP: ['🤝', 'Online', '#1e88e5'], VS: ['⚔️', 'Online', '#1e88e5'], JAPON: ['🗾', 'Japón', '#ec407a'] };
  const RESULT = { WON: ['VICTORIA', '#2e9e4f'], LOST: ['DERROTA', '#c62828'], ABANDONED: ['ABANDONO', '#757575'], COMPLETED: ['COMPLETADA', '#1e88e5'] };
  function ago(t) { const s = Math.max(0, (Date.now() - t) / 1000); if (s < 90) return 'hace un momento'; if (s < 3600) return 'hace ' + Math.round(s / 60) + ' min'; if (s < 86400) return 'hace ' + Math.round(s / 3600) + ' h'; const d = Math.round(s / 86400); return d === 1 ? 'ayer' : 'hace ' + d + ' días'; }
  const dur = sec => { sec = Math.round(sec || 0); return sec >= 60 ? Math.floor(sec / 60) + ' min ' + (sec % 60) + ' s' : sec + ' s'; };
  function registro() {
    let list = []; try { list = JSON.parse(localStorage.getItem('ramen_analytics_sessions') || '[]') || []; } catch (e) {}
    list = list.filter(x => x && x.created_at).slice(0, 60);
    const camp = list.filter(x => x.game_mode === 'NORMAL'), won = camp.filter(x => x.outcome === 'WON').length;
    const chips = '<div class="hp-chips"><b>🎮 ' + list.length + ' partidas</b>' + (camp.length ? '<b>🏮 ' + Math.round(100 * won / camp.length) + '% de victorias en Campaña</b>' : '') + '<b>🍽️ ' + list.reduce((a, x) => a + (x.customers_served || 0), 0) + ' clientes atendidos</b></div>';
    const cards = list.map(x => {
      const m = MODE_NAME[x.game_mode] || ['🎮', x.game_mode || 'Partida', '#6d4c41'], r = RESULT[x.outcome] || RESULT.COMPLETED, fails = (x.failed_recipes || []).slice(0, 4);
      const where = x.game_mode === 'NORMAL' ? 'Nivel ' + x.level_number : (x.game_mode === 'RASH' ? 'Ronda ' + x.level_number : '');
      return '<div class="hp-card"><div class="hd" style="--c:' + m[2] + '"><b>' + m[0] + ' ' + m[1] + (where ? ' · ' + where : '') + '</b><span style="background:' + r[1] + '">' + r[0] + '</span></div><div class="bd"><i>✔ ' + (x.customers_served || 0) + ' atendidos</i><i>✖ ' + (x.customers_lost || 0) + ' perdidos</i><i>⏱ ' + dur(x.duration_seconds) + '</i>'
        + (fails.length ? '<small>Se perdieron pedidos de: ' + fails.join(', ') + '</small>' : '') + '<small>' + ago(new Date(x.created_at).getTime()) + '</small></div></div>';
    }).join('');
    page('REGISTRO DE SERVICIO', list.length ? chips + '<div class="hp-grid">' + cards + '</div>' : '<div class="hp-empty">Aún no hay partidas registradas en este aparato.<br>Juega un servicio y aparecerá aquí con su resultado.</div>');
  }
  function ajustes() {
    const muted = (() => { try { return !!isSoundMuted; } catch (e) { return false; } })();
    const full = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const row = (id, ic, t, d, st, fl) => '<button class="hp-set" onclick="Home.set(\'' + id + '\')">' + (fl || '') + '<span class="ic">' + ic + '</span><span class="tx"><b>' + t + '</b><small>' + d + '</small></span>' + (st ? '<em>' + st + '</em>' : '<i>▶</i>') + '</button>';
    const sound = flag('sound');
    page('AJUSTES',
      '<div class="hp-sets">'
      + row('sound', '🔊', 'Sonido y música', 'Efectos, ambiente de la cocina y música por separado', '', sound)
      + row('mute', muted ? '🔇' : '🔈', 'Silenciar todo', 'Corta efectos, ambiente y música a la vez', muted ? 'SILENCIADO' : 'CON SONIDO')
      + row('full', '⛶', 'Pantalla completa', 'Juega sin barras del navegador (tecla F en PC)', full ? 'ACTIVADA' : 'NORMAL')
      + row('order', '🥢', 'Orden de ingredientes', 'Acomoda la despensa como te quede más cómodo', '')
      + row('device', '🛡️', 'Este dispositivo', 'Ver su identificador seguro', '')
      + '</div>'
      + '<p class="hp-hint">Para actualizar el juego usa ACTUALIZAR en el menú ☰.</p>');
  }
  function acerca() {
    const v = (document.getElementById('app-version') || {}).textContent || '';
    page('ACERCA DE', '<div class="hp-news"><div class="ic">🍜</div><div><b>Shimaya · Ramen Mania</b><em>' + v.toUpperCase() + '</em><p>Un juego de cocina japonesa para aprender jugando: ramen, salteados, makis y frituras, con sus técnicas y sus platos reales.</p></div></div>'
      + '<div class="hp-news"><div class="ic">📲</div><div><b>Instalación y actualizaciones</b><p>Se actualiza sola al abrirla con internet. Si algo se ve viejo, usa ACTUALIZAR en este menú.</p></div></div>'
      + '<div class="hp-news"><div class="ic">☁️</div><div><b>Tu progreso</b><p>Propinas, retos, estadísticas, Recorrido por Japón y el Servicio del día se guardan en tu cuenta. Entra a MI CUENTA Y NUBE para ver su estado.</p></div></div>');
  }

  function build() {
    const sc = $('start-screen'); if (!sc) return false;
    css();
    const el = document.createElement('div'); el.id = 'hm';
    el.innerHTML = '<div class="hm-art" id="hm-art"></div><div class="hm-shade"></div><div class="hm-ui" id="hm-ui"></div>';
    sc.appendChild(el); built = true;
    return true;
  }
  const flag = id => { const h = H(); const a = h && h.alertOf(id); return a ? `<i class="hm-flag ${a.k}">${a.t}</i>` : ''; };
  // imagen de la tienda (toldo rojo y crema, mostrador y platos): reemplaza al ícono de Secretos
  const SHOP = '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="58" rx="26" ry="3.5" fill="rgba(0,0,0,.35)"/><rect x="7" y="30" width="50" height="26" rx="2" fill="#8a5a30" stroke="#2b1810" stroke-width="2.5"/><rect x="13" y="34" width="38" height="13" fill="#2a170c" stroke="#2b1810" stroke-width="2"/><circle cx="21" cy="42" r="4.2" fill="#ffd978" stroke="#2b1810" stroke-width="1.6"/><circle cx="32" cy="42" r="4.2" fill="#ef5350" stroke="#2b1810" stroke-width="1.6"/><circle cx="43" cy="42" r="4.2" fill="#8bc34a" stroke="#2b1810" stroke-width="1.6"/><rect x="10" y="46" width="44" height="9" rx="2" fill="#ffb300" stroke="#2b1810" stroke-width="2.2"/><path d="M5 12h54l3 17H2z" fill="#fff3d6"/><path d="M5 12h9.3l-2.3 17H2zM23.6 12h9.3l-.8 17h-9.5zM42.2 12h9.3l3.5 17h-9.6z" fill="#c8372d"/><path d="M5 12h54l3 17H2z" fill="none" stroke="#2b1810" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  // percha: abre el vestuario del chef
  // tablero con visto bueno (misiones)
  const MISIONES = '<svg viewBox="0 0 96 96"><rect x="14" y="14" width="54" height="70" rx="7" fill="#8a5a30" stroke="#2b1810" stroke-width="3"/><rect x="20" y="23" width="42" height="54" rx="3" fill="#fff3d6" stroke="#2b1810" stroke-width="2.4"/><rect x="29" y="8" width="24" height="13" rx="4" fill="#c9cdd3" stroke="#2b1810" stroke-width="2.4"/><path d="M25 38l5 5 8-9M25 54l5 5 8-9" fill="none" stroke="#2e9e4f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 40h13M44 56h13M25 68h32" stroke="#c9b79a" stroke-width="3.4" stroke-linecap="round"/><path d="M62 74l4-18 20-21 8 8-21 20z" fill="#e53935" stroke="#2b1810" stroke-width="2.6" stroke-linejoin="round"/><path d="M62 74l4-18 8 8z" fill="#ffd9a0" stroke="#2b1810" stroke-width="2.2" stroke-linejoin="round"/><path d="M86 35l8 8" stroke="#2b1810" stroke-width="3"/><path d="M10 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM82 10l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#ffd54f"/></svg>';
  const AI = (id, fb) => (window.ArteUI ? ArteUI.icon(id, fb) : fb);                       // ilustración del botón (o su dibujo de respaldo)
  const btn = (ic, label, onclick, id, dark) => `<button class="hm-btn hm-plate ${dark ? 'dark' : ''}" onclick="${onclick}">${id ? flag(id) : ''}<span class="ic">${ic}</span><b>${label}</b></button>`;

  /** Tarjeta del modo elegido (centro de la pantalla): ilustración, categoría, nombre y explicación; al tocarla se abre la lista de modos. */
  function selCard() {
    const si = window.Modos && Modos.selectedInfo ? Modos.selectedInfo() : null;
    if (!si) return '';
    const c = si.card, f = si.feat, AI = (id, fb) => (window.ArteUI ? ArteUI.icon(id, fb) : fb);
    const CAT_ART = { camp: ['arco_maestria', '🏮'], rash: ['rash_record', '⚡'], japon: ['tokio', '🗾'], zen: ['libre_todo', '🌿'], online: ['online_arrebato', '🌐'] }[si.cat.id] || ['arco_maestria', '🏮'];
    const art = c ? c.art : AI(CAT_ART[0], `<span>${CAT_ART[1]}</span>`);
    const title = c ? c.title : f.title, sub = c ? c.sub : '', meta = c ? c.meta : f.meta;
    const text = c ? (c.info || c.desc || '') : (f.panels || []).join(' ');
    return `<button class="hm-sel" style="--c:${si.col}; --bg:${si.bg}" onclick="Modos.open()" aria-label="Modo elegido: ${String(title).replace(/"/g, '')}. Toca para cambiarlo">
        <div class="sa">${art}</div>
        <div class="sx"><span class="sk">${si.cat.name}</span><h3>${title}</h3>${sub ? `<div class="ss">${sub}</div>` : ''}<p>${text}</p>${meta ? `<span class="sm">${meta}</span>` : ''}</div></button>`;
  }

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
        <button class="hm-menu hm-fs hm-plate" onclick="Inicio.act('full')" aria-label="Pantalla completa">⛶</button>
        <button class="hm-cur hm-plate" onclick="Inicio.act('knives')" aria-label="Propinas"><i>${AI('propinas', '🧧')}</i><span class="hm-wallet">${h.wallet()}</span></button>
        <button class="hm-menu hm-plate" onclick="Home.menu()" aria-label="Menú">☰${flag('sound')}</button>
      </div>
      <div class="hm-col l">
        ${btn(AI('btn_recetario', '📖'), 'RECETARIO', "Recetario.open()", 'book')}
        ${btn(AI('btn_tienda', SHOP), 'TIENDA', "Inicio.act('knives')", 'knives', true)}
        ${btn(AI('btn_aprender', '🎓'), 'APRENDER', "Modos.learn()", 'aprender', true)}
      </div>
      <div class="hm-col r">
        ${btn(AI('btn_ranking', '🏆'), 'RANKING', "Inicio.act('board')", null, true)}
      </div>
      <button class="hm-scrim" onclick="Home.menu(false)" aria-label="Cerrar el menú"></button>
      <div class="hm-drop">${MENU.map((m, i) => `<button style="--i:${i}" onclick="Home.item('${m.id}')">${m.flag ? flag(m.flag) : ''}<span class="ic">${AI(m.art, m.ic)}</span>${m.label}</button>`).join('')}</div>
      ${tut && window.Servicio ? (() => { const al = h.alertOf('misiones'), sm = Servicio.summary(); return `<div class="hm-bl"><button class="hm-mis hm-plate ${sm.done === sm.total ? 'all' : ''}" onclick="Servicio.open()" aria-label="Misiones"><span class="mic">${AI('btn_misiones', MISIONES)}</span><b>MISIONES</b>${al ? `<i class="mbadge ${al.k}">${al.t}</i>` : ''}</button></div>`; })() : ''}
      ${selCard()}
      <div class="hm-br">
        <div class="hm-row">
          <button class="hm-mode" style="--c:${sel.col}" onclick="Modos.open()" aria-label="Elegir modo de juego: ${sel.title}"><span class="mp hm-plate"><span class="mt"><b>Modos de juego</b></span></span></button>
          ${(() => { const M = window.MultiplayerManager; if (M && M.isSearchingQueue && M.isSearchingQueue()) { const found = M.matchFound && !M.matchAccepted; return `<button class="hm-go" onclick="Home.play()" aria-label="${found ? 'Partida encontrada: entrar' : 'Buscando partida: volver a la búsqueda'}"><span class="mp hm-plate">${found ? '<span class="hm-play found">¡ENTRAR!</span>' : `<span class="hm-play search"><small>🌐 BUSCANDO</small><b id="hm-q">${M.fmtQueue()}</b></span>`}</span></button>`; } return `<button class="hm-go" onclick="Home.play()" aria-label="${tut ? 'Jugar' : 'Empezar'}"><span class="mp hm-plate"><span class="hm-play ${tut ? '' : 'lock'}">${tut ? 'JUGAR' : 'EMPEZAR'}</span></span></button>`; })()}
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
      if (!want) hm.classList.remove('menu-open');
      hm.classList.toggle('hm-on', want); shown = want;
    },
    refresh() { if (shown) paint(); },
    /** El chef te saluda al tocarlo. */
    /** Abre o cierra el menú ☰ (v: true abre, false cierra; sin argumento alterna). */
    menu(v) { const hm = $('hm'); if (!hm) return; const open = v == null ? !hm.classList.contains('menu-open') : !!v; hm.classList.toggle('menu-open', open); sfx('click'); },
    item(id) {
      this.menu(false);
      try {
        if (id === 'ajustes') Home.ajustes();
        else if (id === 'stats') Inicio.act('stats');
        else if (id === 'registro') registro();
        else if (id === 'cuenta') Inicio.act('acct');
        else if (id === 'actualizar') Inicio.act('update');
        else if (id === 'acerca') acerca();
      } catch (e) { console.warn('[Home] menú', id, e); }
    },
    registro, acerca,
    /** Ajustes: la pantalla con la distribución de Brawl Stars (pantallas-bs.js); si no cargó, la lista de siempre. */
    ajustes() { try { Inicio.seen('sound'); } catch (e) {} if (window.Bs) Bs.ajustes(); else ajustes(); },
    /** Acciones de las filas de Ajustes (la página se repinta para mostrar el estado nuevo). */
    set(id) {
      try {
        if (id === 'sound') { Inicio.seen('sound'); if (window.Ambiente && Ambiente.panel) Ambiente.panel(); else toggleAudioMute(); paint(); }
        else if (id === 'mute') { toggleAudioMute(); ajustes(); }
        else if (id === 'full') { toggleFullScreen(); setTimeout(ajustes, 350); }
        else if (id === 'order') openIngredientOrderModal();
        else if (id === 'device') showDeviceInfoModal();
      } catch (e) { console.warn('[Home] ajustes', id, e); }
    },
    closePage() { const p = $('hp'); if (p) p.remove(); sfx('click'); paint(); },
    play() {
      const h = H(); if (!h) return;
      try { const M = window.MultiplayerManager; if (M && M.isSearchingQueue && M.isSearchingQueue()) { sfx('click'); M.openQueue(); return; } } catch (e) {}   // buscando partida global: JUGAR vuelve a la pantalla de búsqueda
      if (!h.tutDone()) { sfx('serve'); toast('🎓 Primero la lección de ramen con el Maestro: así empieza todo.'); try { Modos.learn(); } catch (e) {} return; }
      sfx('serve'); try { Modos.play(); } catch (e) { console.warn('[Home] play', e); }
    }
  };
})();
