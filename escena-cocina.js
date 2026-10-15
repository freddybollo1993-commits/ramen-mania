/* Escena viva de la cocina vista desde la barra (vitrina del menú de inicio) - v154
   Capas (de atrás hacia delante): placa de fondo -> efectos traseros (vapor, fuego) -> cocineros (atlas de fotogramas,
   recortados en el borde de la barra) -> efectos delanteros (chispas) -> luz de las linternas y aviso rojo en Rash.
   Todo se mide en «cqw» (porcentaje del ancho de la escena), así que escala igual en cualquier pantalla.
   Zona 1 (Línea de fuego): Jugar, Campaña y Rash (Rash = mismo local, ×1,8 de velocidad y luz roja).

   Los cocineros los mueve UN solo requestAnimationFrame para todas las escenas: cada fotograma tiene su propia duración (ms),
   así las poses clave se mantienen más y el salto del wok es rápido (easing). Mientras dura un fotograma, el siguiente se
   funde por encima (de 0 a --xf) para dar imágenes intermedias. El bucle se detiene solo cuando no hay ninguna escena en
   pantalla (stop() lo detiene a mano) y se desactiva el fundido si el dispositivo baja de ~45 fps.

   Para añadir una zona: poner sus imágenes en assets/menu/ y describirla en ZONES (coordenadas en píxeles de la placa de 1184×912).
   Un cocinero = un atlas de 4 columnas y N/4 filas (N fotogramas) + la lista de duraciones en ms. */
(function () {
  'use strict';
  const W = 1184, H = 912;
  const cqw = px => (px / W * 100).toFixed(3) + 'cqw';
  const DIR = 'assets/menu/';
  const XF = 0.85;                                     // opacidad máxima del fotograma siguiente al final de su turno

  const ZONES = {
    z1: {
      plate: 'zona1_placa.webp',
      counterY: 672,                                   // la barra empieza aquí: los cocineros se cortan en esta línea
      cell: [344, 384],                                // tamaño de un fotograma sobre la placa
      actors: [                                        // x = centro del cocinero sobre la placa; ph = desfase de fase (ms)
        { sheet: 'zona1_ramen.webp', x: 300, ph: 300, dur: [125, 125, 100, 110, 140, 140, 100, 125] },
        { sheet: 'zona1_wok.webp', x: 640, ph: 0, dur: [125, 125, 150, 70, 110, 80, 100, 125, 125, 140, 160, 125, 125, 150, 200, 140] },
        { sheet: 'zona1_freidora.webp', x: 975, ph: 500, dur: [125, 125, 120, 90, 100, 100, 140, 140] }
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
    .ec-actor i { position: absolute; inset: 0; background-repeat: no-repeat; will-change: background-position, opacity; }
    .ec-actor i.nx { opacity: 0; }
    .ec-fx { position: absolute; background-repeat: no-repeat; background-size: 400% 400%; animation: ecF calc(.52s / var(--spd)) step-end infinite; pointer-events: none; }
    .ec-fx.screen { mix-blend-mode: screen; }
    .ec-glow { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(255,176,64,.55), rgba(255,140,40,0) 65%); mix-blend-mode: screen; pointer-events: none;
      animation: ecGlow calc(2.4s / var(--spd)) ease-in-out infinite alternate; }
    .ec-scene.rash::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 55%, rgba(255,60,30,0) 25%, rgba(200,20,10,.6) 100%); box-shadow: inset 0 0 9cqw 1cqw rgba(235,30,20,.9);
      animation: ecAlarm .7s ease-in-out infinite alternate; }
    @keyframes ecF { 0% { background-position-x: 0; } 25% { background-position-x: 33.3333%; } 50% { background-position-x: 66.6667%; } 75% { background-position-x: 100%; } }
    @keyframes ecBreath { from { transform: scale(1, 1); } to { transform: scale(.994, 1.02); } }
    @keyframes ecGlow { from { opacity: .45; transform: scale(.92); } to { opacity: 1; transform: scale(1.06); } }
    @keyframes ecAlarm { from { opacity: .25; } to { opacity: .9; } }
    @keyframes ecCam { from { transform: scale(1) translateX(0); } to { transform: scale(1.035) translateX(-.6%); } }
    @media (prefers-reduced-motion: reduce) { .ec-cam, .ec-glow, .ec-actor, .ec-scene.rash::after { animation: none; } .ec-actor i.nx { display: none; } }
    `;
    document.head.appendChild(st);
  }

  /** Devuelve el HTML de la escena para una entrada del menú (jugar, camp, rash…). */
  function html(key) {
    const zid = MAP[key]; if (!zid) return '';
    css();
    const z = ZONES[zid], cw = z.cell[0], ch = z.cell[1], rash = key === 'rash';
    const img = f => `url('${DIR}${f}')`;
    const fx = e => `<i class="ec-fx${e.screen ? ' screen' : ''}" style="left:${cqw(e.x - e.s / 2)};top:${cqw(e.y - e.s / 2)};width:${cqw(e.s)};height:${cqw(e.s)};opacity:${e.op};background-image:${img('zona1_efectos.webp')};background-position-y:${e.row * 33.3333}%;animation-delay:calc(-${(e.off * 0.13).toFixed(2)}s / var(--spd))"></i>`;
    // capa A = fotograma actual; capa B = fotograma siguiente que se funde por encima (lo mueve tick())
    const actor = (a, i) => { const rows = Math.max(1, Math.ceil(a.dur.length / 4)), bg = `background-image:${img(a.sheet)};background-size:400% ${rows * 100}%`;
      return `<div class="ec-actor" data-i="${i}" style="left:${cqw(a.x - cw / 2)};top:${cqw(z.counterY - ch)};width:${cqw(cw)};height:${cqw(ch)}"><i style="${bg}"></i><i class="nx" style="${bg}"></i></div>`; };
    const glow = g => `<i class="ec-glow" style="left:${cqw(g[0] - 150)};top:${cqw(g[1] - 150)};width:${cqw(300)};height:${cqw(300)};animation-delay:-${(g[0] % 7 * 0.3).toFixed(1)}s"></i>`;
    wake();
    return `<div class="ec-wrap"><div class="ec-fill" style="background-image:${img(z.plate)}"></div><div class="ec-scene${rash ? ' rash' : ''}" data-zone="${zid}" data-spd="${rash ? 1.8 : 1}" style="--spd:${rash ? 1.8 : 1}"><div class="ec-cam">`
      + `<img class="ec-plate" src="${DIR}${z.plate}" alt="" draggable="false">`
      + z.fxBack.map(fx).join('')
      + `<div class="ec-cast" style="height:${(z.counterY / H * 100).toFixed(3)}%">${z.actors.map(actor).join('')}</div>`
      + z.fxFront.map(fx).join('')
      + z.glows.map(glow).join('')
      + `</div></div></div>`;
  }

  // ---------- motor de fotogramas (un solo requestAnimationFrame para todas las escenas) ----------
  const cache = new WeakMap();                         // escena -> actores con sus capas y duraciones acumuladas
  let raf = 0, last = 0, slowN = 0, fade = true, avgDt = 16;

  function build(scene) {
    const z = ZONES[scene.dataset.zone]; if (!z) return null;
    return z.actors.map((a, i) => {
      const el = scene.querySelector('.ec-actor[data-i="' + i + '"]'); if (!el) return null;
      const t = []; let acc = 0; a.dur.forEach(d => { t.push(acc); acc += d; });
      return { a: el.children[0], b: el.children[1], cfg: a, t, total: acc, n: a.dur.length, rows: Math.max(1, Math.ceil(a.dur.length / 4)), cur: -1, curB: -1 };
    }).filter(Boolean);
  }
  function put(layer, k, A) {                          // fotograma k del atlas (4 columnas)
    layer.style.backgroundPosition = ((k % 4) * 33.3333) + '% ' + (A.rows > 1 ? Math.floor(k / 4) / (A.rows - 1) * 100 : 0) + '%';
  }
  function tick(now) {
    raf = 0;
    const scenes = document.querySelectorAll('.ec-scene');
    if (!scenes.length) return;                        // nada en pantalla: el bucle se detiene (wake() lo reanuda)
    const dt = now - last; last = now;
    if (dt > 0 && dt < 200) {                          // si el dispositivo va justo se quita el fundido (queda solo el fotograma actual)
      avgDt = avgDt * 0.95 + dt * 0.05;
      slowN = avgDt > 22 ? Math.min(slowN + 1, 120) : Math.max(slowN - 1, 0);
      fade = slowN < 60;
    }
    scenes.forEach(sc => {
      if (!sc.offsetParent) return;                    // oculta (pantalla de inicio cerrada): no se gasta nada
      let actors = cache.get(sc); if (!actors) { actors = build(sc) || []; cache.set(sc, actors); }
      const spd = +sc.dataset.spd || 1;
      actors.forEach(A => {
        const t = (now * spd + A.cfg.ph) % A.total;
        let k = A.n - 1; for (let j = 1; j < A.n; j++) if (A.t[j] > t) { k = j - 1; break; }
        if (k !== A.cur) { A.cur = k; put(A.a, k, A); }
        if (fade) {
          const nk = (k + 1) % A.n;
          if (nk !== A.curB) { A.curB = nk; put(A.b, nk, A); }
          A.b.style.opacity = ((t - A.t[k]) / A.cfg.dur[k] * XF).toFixed(3);
        } else if (A.b.style.opacity !== '0') A.b.style.opacity = '0';
      });
    });
    raf = requestAnimationFrame(tick);
  }
  function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(() => { raf = 0; raf = requestAnimationFrame(tick); }); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (document.querySelector('.ec-scene')) wake(); });

  window.EscenaCocina = { has: key => !!MAP[key], html, stop };
})();
