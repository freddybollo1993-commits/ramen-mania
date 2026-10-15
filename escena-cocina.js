/* Escena viva de la cocina vista desde la barra (vitrina del menú de inicio) - v152
   Capas (de atrás hacia delante): placa de fondo -> efectos traseros (vapor, fuego) -> cocineros (hojas de 8 fotogramas,
   recortados en el borde de la barra) -> efectos delanteros (chispas) -> luz de las linternas y aviso rojo en Rash.
   Todo se mide en «cqw» (porcentaje del ancho de la escena), así que escala igual en cualquier pantalla.
   Zona 1 (Línea de fuego): Jugar, Campaña y Rash (Rash = mismo local, ×1,8 de velocidad y luz roja).
   Para añadir una zona: poner sus imágenes en assets/menu/ y describirla en ZONES (coordenadas en píxeles de la placa de 1184×912). */
(function () {
  'use strict';
  const W = 1184, H = 912;
  const cqw = px => (px / W * 100).toFixed(3) + 'cqw';
  const DIR = 'assets/menu/';

  const ZONES = {
    z1: {
      plate: 'zona1_placa.webp',
      counterY: 672,                                   // la barra empieza aquí: los cocineros se cortan en esta línea
      cell: [344, 384],                                // tamaño de un fotograma sobre la placa
      actors: [                                        // x = centro del cocinero sobre la placa; off = desfase de fotograma
        { sheet: 'zona1_ramen.webp', x: 300, off: 3 },
        { sheet: 'zona1_wok.webp', x: 640, off: 0 },
        { sheet: 'zona1_freidora.webp', x: 975, off: 5 }
      ],
      fxBack: [                                        // fila de la hoja de efectos: 0 vapor, 1 fuego, 2 chispas, 3 pétalos
        { row: 0, x: 215, y: 330, s: 210, op: 0.7, off: 0 },
        { row: 0, x: 1120, y: 380, s: 150, op: 0.55, off: 2 },
        { row: 1, x: 812, y: 522, s: 120, op: 0.95, off: 1 }
      ],
      fxFront: [
        { row: 2, x: 700, y: 500, s: 230, op: 0.85, off: 0, screen: true }
      ],
      glows: [[165, 115], [590, 115], [1020, 115]]    // linternas que parpadean
    }
  };
  const MAP = { jugar: 'z1', camp: 'z1', rash: 'z1' };

  let cssDone = false;
  function css() {
    if (cssDone) return; cssDone = true;
    const st = document.createElement('style'); st.id = 'escena-cocina-css';
    st.textContent = `
    .ec-wrap { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .ec-fill { position: absolute; inset: 0; border-radius: 14px; background-size: cover; background-position: 50% 60%; filter: blur(14px) brightness(.5) saturate(1.15); transform: scale(1.08); overflow: hidden; }
    .ec-scene { position: relative; z-index: 1; height: 100%; aspect-ratio: ${W} / ${H}; max-width: 100%; container-type: inline-size; overflow: hidden; border-radius: 14px;
      background: #2b1810; box-shadow: 0 6px 22px rgba(0,0,0,.55); --spd: 1; }
    .ec-cam { position: absolute; inset: 0; transform-origin: 50% 70%; animation: ecCam 16s ease-in-out infinite alternate; }
    .ec-plate { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .ec-cast { position: absolute; left: 0; top: 0; width: 100%; overflow: hidden; }
    .ec-actor { position: absolute; transform-origin: 50% 100%; animation: ecBreath calc(1.7s / var(--spd)) ease-in-out infinite alternate; }
    .ec-actor i { position: absolute; inset: 0; background-repeat: no-repeat; background-size: 400% 200%; animation: ecA calc(.8s / var(--spd)) step-end infinite; }
    .ec-actor i.nx { animation-name: ecA, ecXf; animation-duration: calc(.8s / var(--spd)), calc(.1s / var(--spd)); animation-timing-function: step-end, linear; animation-iteration-count: infinite, infinite; }
    .ec-fx { position: absolute; background-repeat: no-repeat; background-size: 400% 400%; animation: ecF calc(.52s / var(--spd)) step-end infinite; pointer-events: none; }
    .ec-fx.screen { mix-blend-mode: screen; }
    .ec-glow { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(255,176,64,.55), rgba(255,140,40,0) 65%); mix-blend-mode: screen; pointer-events: none;
      animation: ecGlow calc(2.4s / var(--spd)) ease-in-out infinite alternate; }
    .ec-scene.rash::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 55%, rgba(255,60,30,0) 25%, rgba(200,20,10,.6) 100%); box-shadow: inset 0 0 9cqw 1cqw rgba(235,30,20,.9);
      animation: ecAlarm .7s ease-in-out infinite alternate; }
    @keyframes ecA { 0% { background-position-x: 0; background-position-y: 0; } 12.5% { background-position-x: 33.3333%; background-position-y: 0; }
      25% { background-position-x: 66.6667%; background-position-y: 0; } 37.5% { background-position-x: 100%; background-position-y: 0; }
      50% { background-position-x: 0; background-position-y: 100%; } 62.5% { background-position-x: 33.3333%; background-position-y: 100%; }
      75% { background-position-x: 66.6667%; background-position-y: 100%; } 87.5% { background-position-x: 100%; background-position-y: 100%; } }
    @keyframes ecXf { from { opacity: 0; } to { opacity: var(--xf, .85); } }
    @keyframes ecBreath { from { transform: scale(1, 1); } to { transform: scale(.994, 1.02); } }
    @keyframes ecF { 0% { background-position-x: 0; } 25% { background-position-x: 33.3333%; } 50% { background-position-x: 66.6667%; } 75% { background-position-x: 100%; } }
    @keyframes ecGlow { from { opacity: .45; transform: scale(.92); } to { opacity: 1; transform: scale(1.06); } }
    @keyframes ecAlarm { from { opacity: .25; } to { opacity: .9; } }
    @keyframes ecCam { from { transform: scale(1) translateX(0); } to { transform: scale(1.035) translateX(-.6%); } }
    @media (prefers-reduced-motion: reduce) { .ec-cam, .ec-glow, .ec-actor, .ec-actor i.nx, .ec-scene.rash::after { animation: none; } .ec-actor i.nx { display: none; } }
    `;
    document.head.appendChild(st);
  }

  /** Devuelve el HTML de la escena para una entrada del menú (jugar, camp, rash…). */
  function html(key) {
    const zid = MAP[key]; if (!zid) return '';
    css();
    const z = ZONES[zid], cw = z.cell[0], ch = z.cell[1], rash = key === 'rash';
    const img = f => `url('${DIR}${f}')`;
    const fx = (f, e) => `<i class="ec-fx${e.screen ? ' screen' : ''}" style="left:${cqw(e.x - e.s / 2)};top:${cqw(e.y - e.s / 2)};width:${cqw(e.s)};height:${cqw(e.s)};opacity:${e.op};background-image:${img('zona1_efectos.webp')};background-position-y:${e.row * 33.3333}%;animation-delay:calc(-${(e.off * 0.13).toFixed(2)}s / var(--spd))"></i>`;
    const actor = a => { const d = (a.off * 0.1).toFixed(2), bg = `background-image:${img(a.sheet)}`;
      // capa A = fotograma actual; capa B = fotograma siguiente que se funde por encima (de 0 a 0,85) y así se ven fotogramas intermedios
      return `<div class="ec-actor" style="left:${cqw(a.x - cw / 2)};top:${cqw(z.counterY - ch)};width:${cqw(cw)};height:${cqw(ch)}"><i style="${bg};animation-delay:calc(-${d}s / var(--spd))"></i><i class="nx" style="${bg};animation-delay:calc(-${(a.off * 0.1 + 0.1).toFixed(2)}s / var(--spd)), 0s"></i></div>`; };
    const glow = g => `<i class="ec-glow" style="left:${cqw(g[0] - 150)};top:${cqw(g[1] - 150)};width:${cqw(300)};height:${cqw(300)};animation-delay:-${(g[0] % 7 * 0.3).toFixed(1)}s"></i>`;
    return `<div class="ec-wrap"><div class="ec-fill" style="background-image:${img(z.plate)}"></div><div class="ec-scene${rash ? ' rash' : ''}" style="--spd:${rash ? 1.8 : 1}"><div class="ec-cam">`
      + `<img class="ec-plate" src="${DIR}${z.plate}" alt="" draggable="false">`
      + z.fxBack.map(e => fx('b', e)).join('')
      + `<div class="ec-cast" style="height:${(z.counterY / H * 100).toFixed(3)}%">${z.actors.map(actor).join('')}</div>`
      + z.fxFront.map(e => fx('f', e)).join('')
      + z.glows.map(glow).join('')
      + `</div></div></div>`;
  }

  window.EscenaCocina = { has: key => !!MAP[key], html };
})();
