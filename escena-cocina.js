/* Escena viva de la cocina vista desde la barra (vitrina del menú de inicio) - v159
   Capas (de atrás hacia delante): placa de fondo -> efectos traseros (vapor, fuego) -> cocineros (video WebM con transparencia,
   o atlas de fotogramas si el video no se puede reproducir; recortados en el borde de la barra) -> efectos delanteros (chispas)
   -> luz de las linternas y aviso rojo en Rash.
   Todo se mide en «cqw» (porcentaje del ancho de la escena), así que escala igual en cualquier pantalla.
   Zona 1 (Línea de fuego): Jugar, Campaña y Rash (Rash = mismo local, ×1,8 de velocidad y luz roja).

   Carga: los videos se crean UNA vez (pool) y se precargan al abrir el juego; cada escena solo los mueve a su sitio, así que
   al cambiar de opción no se vuelven a descargar. Mientras un video no está listo se ve su foto (poster con transparencia).
   Los cocineros hechos con atlas los mueve UN solo requestAnimationFrame con la duración propia de cada fotograma (easing),
   con fundido al siguiente; el bucle se detiene solo cuando no hay ninguna escena en pantalla (stop() lo detiene a mano) y
   el fundido se desactiva si el dispositivo baja de ~45 fps.

   Para añadir una zona (o ampliar la placa): poner sus imágenes en assets/menu/ y describirla en ZONES. Coordenadas en píxeles
   de la placa de la zona (w × h); `ox` desplaza todo lo colocado cuando la placa se amplía por los lados. */
(function () {
  'use strict';
  const DIR = 'assets/menu/';
  const XF = 0.85;                                     // opacidad máxima del fotograma siguiente al final de su turno (atlas)
  // video con transparencia (WebM VP9 con alfa): si el navegador no lo reproduce, el cocinero usa su atlas de fotogramas
  const VIDEO_OK = (() => { try { const v = document.createElement('video'); return !!v.canPlayType && /probably|maybe/.test(v.canPlayType('video/webm; codecs="vp9"')) && !matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

  const ZONES = {
    z1: {
      plate: 'zona1_placa_ancha.webp',
      w: 1999, h: 848,                                 // tamaño de la placa (21:9); ox = desplazamiento horizontal de todo lo de abajo
      ox: 0,
      cs: 0.95,                                        // escala de los cocineros respecto a su tamaño original (344×384)
      counterY: 612,                                   // la barra empieza aquí: los cocineros se cortan en esta línea
      cell: [344, 384],
      actors: [                                        // x = centro del cocinero sobre la placa; ph = desfase de fase (ms); vph = punto de inicio del video (s)
        { sheet: 'zona1_ramen.webp', video: 'zona1_ramen_video.webm', poster: 'zona1_ramen_poster.webp', vw: 429, vh: 384, vc: 0.476, vph: 2.7, x: 735, ph: 300, dur: [125, 125, 100, 110, 140, 140, 100, 125] },
        { sheet: 'zona1_wok.webp', video: 'zona1_wok_video.webm', poster: 'zona1_wok_poster.webp', vw: 395, vh: 384, vc: 0.494, vph: 0, x: 1012, ph: 0, dur: [125, 125, 150, 70, 110, 80, 100, 125, 125, 140, 160, 125, 125, 150, 200, 140] },
        { sheet: 'zona1_freidora.webp', video: 'zona1_freidora_video.webm', poster: 'zona1_freidora_poster.webp', vw: 440, vh: 384, vc: 0.515, vph: 5.3, x: 1312, ph: 500, dur: [125, 125, 120, 90, 100, 100, 140, 140] }
      ],
      walkers: [                                       // personajes que cruzan la cocina detrás de los cocineros (video que camina en el sitio; el código lo desplaza)
        { video: 'zona1_mozo_video.webm', vw: 300, vh: 318, vc: 0.5, vph: 0, s: 0.98, x0: 1760, x1: 230, cycle: 36, start: 4 }
      ],
      fxBack: [                                        // fila de la hoja de efectos: 0 vapor, 1 fuego, 2 chispas, 3 pétalos
        { row: 0, x: 700, y: 330, s: 190, op: 0.7, off: 0 },        // olla de caldo
        { row: 0, x: 300, y: 430, s: 150, op: 0.6, off: 3 },        // arrocera
        { row: 0, x: 1585, y: 395, s: 210, op: 0.75, off: 1 },      // vaporera
        { row: 0, x: 1330, y: 330, s: 150, op: 0.5, off: 2 },       // freidora
        { row: 1, x: 1168, y: 520, s: 110, op: 0.95, off: 1 }       // hornilla libre
      ],
      fxFront: [
        { row: 2, x: 1010, y: 440, s: 230, op: 0.85, off: 0, screen: true }
      ],
      glows: [[318, 170], [665, 175], [1000, 175], [1335, 170], [1865, 170]]    // linternas que parpadean
    }
  };
  const MAP = { jugar: 'z1', camp: 'z1', rash: 'z1' };

  let cssDone = false;
  function css() {
    if (cssDone) return; cssDone = true;
    const st = document.createElement('style'); st.id = 'escena-cocina-css';
    st.textContent = `
    .ec-wrap { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; container-type: size; }
    .ec-fill { position: absolute; inset: 0; border-radius: 14px; background-size: cover; background-position: 50% 60%; filter: blur(14px) brightness(.5) saturate(1.15); transform: scale(1.08); overflow: hidden; }
    .ec-scene { position: relative; z-index: 1; width: min(100cqw, calc(100cqh * var(--asp))); aspect-ratio: var(--asp); container-type: inline-size; overflow: hidden; border-radius: 14px;
      background: #2b1810; box-shadow: 0 6px 22px rgba(0,0,0,.55); --spd: 1; }
    .ec-cam { position: absolute; inset: 0; }
    .ec-plate { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .ec-cast { position: absolute; left: 0; top: 0; width: 100%; overflow: hidden; }
    .ec-actor { position: absolute; overflow: hidden; transform-origin: 50% 100%; animation: ecBreath calc(1.7s / var(--spd)) ease-in-out infinite alternate; }
    .ec-actor img { position: absolute; left: 0; top: 0; max-width: none; pointer-events: none; will-change: transform, opacity; backface-visibility: hidden; }
    .ec-actor img.nx { opacity: 0; }
    .ec-actor img.ec-poster { width: 100%; height: 100%; }
    .ec-actor.vr img.ec-poster { display: none; }
    .ec-walker { position: absolute; opacity: 0; will-change: transform, opacity; animation: ecWalk calc(var(--cycle, 36s) / var(--spd)) linear infinite; }
    .ec-vid { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; }
    .ec-dbg { position: absolute; left: 4px; top: 4px; z-index: 5; font: 700 10px/1.25 monospace; color: #9f9; background: rgba(0,0,0,.7); padding: 3px 5px; border-radius: 4px; pointer-events: none; white-space: pre; }
    .ec-fx { position: absolute; background-repeat: no-repeat; background-size: 400% 400%; animation: ecF calc(.52s / var(--spd)) step-end infinite; pointer-events: none; }
    .ec-fx.screen { mix-blend-mode: screen; }
    .ec-glow { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(255,176,64,.55), rgba(255,140,40,0) 65%); pointer-events: none; will-change: opacity;
      animation: ecGlow calc(2.4s / var(--spd)) ease-in-out infinite alternate; }
    .ec-scene.rash::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 55%, rgba(255,60,30,0) 25%, rgba(200,20,10,.6) 100%); box-shadow: inset 0 0 9cqw 1cqw rgba(235,30,20,.9);
      animation: ecAlarm .7s ease-in-out infinite alternate; }
    @keyframes ecWalk { 0% { transform: translateX(0) scaleX(-1); opacity: 0; } 3% { opacity: 1; } 42% { transform: translateX(var(--wx)) scaleX(-1); opacity: 1; } 45% { transform: translateX(var(--wx)) scaleX(-1); opacity: 0; }
      50% { transform: translateX(var(--wx)) scaleX(1); opacity: 0; } 53% { opacity: 1; } 92% { transform: translateX(0) scaleX(1); opacity: 1; } 95%, 100% { transform: translateX(0) scaleX(1); opacity: 0; } }
    @keyframes ecF { 0% { background-position-x: 0; } 25% { background-position-x: 33.3333%; } 50% { background-position-x: 66.6667%; } 75% { background-position-x: 100%; } }
    @keyframes ecBreath { from { transform: scale(1, 1); } to { transform: scale(.994, 1.02); } }
    @keyframes ecGlow { from { opacity: .35; } to { opacity: .9; } }
    @keyframes ecAlarm { from { opacity: .25; } to { opacity: .9; } }
    @media (prefers-reduced-motion: reduce) { .ec-glow, .ec-actor, .ec-scene.rash::after { animation: none; } .ec-walker { display: none; } .ec-actor img.nx { display: none; } }
    `;
    document.head.appendChild(st);
  }

  // ---------- videos: se crean una sola vez y se reutilizan en cada escena ----------
  const POOL = {}; let poolBox = null;
  function pool(a) {
    if (!VIDEO_OK || !a.video) return null;
    if (POOL[a.video]) return POOL[a.video];
    if (!poolBox) {
      poolBox = document.createElement('div'); poolBox.id = 'ec-pool'; poolBox.setAttribute('aria-hidden', 'true');
      poolBox.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none';
      document.body.appendChild(poolBox);
    }
    const v = document.createElement('video');
    v.className = 'ec-vid'; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.setAttribute('disablepictureinpicture', '');
    v.addEventListener('loadedmetadata', () => { try { if (a.vph && v.duration) v.currentTime = a.vph % v.duration; } catch (e) {} }, { once: true });   // cada cocinero arranca en un punto distinto
    v.src = DIR + a.video; poolBox.appendChild(v); POOL[a.video] = v;
    return v;
  }
  /** Descarga los videos antes de que se abra la escena (se llama al abrir el juego, cuando el navegador está libre). */
  function preload() { Object.keys(ZONES).forEach(k => { ZONES[k].actors.forEach(pool); (ZONES[k].walkers || []).forEach(w => { if (!w.off) pool(w); }); }); }
  (function schedule() {
    const go = () => { try { preload(); } catch (e) {} };
    const later = () => setTimeout(go, 700);                                   // poco después de que la página termine de cargar
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later, { once: true });
  })();

  /** Devuelve el HTML de la escena para una entrada del menú (jugar, camp, rash…). */
  function html(key) {
    const zid = MAP[key]; if (!zid) return '';
    css();
    const z = ZONES[zid], cs = z.cs || 1, cw = z.cell[0] * cs, ch = z.cell[1] * cs, rash = key === 'rash', ox = z.ox || 0;
    const cqw = px => (px / z.w * 100).toFixed(3) + 'cqw';
    const img = f => `url('${DIR}${f}')`;
    const fx = e => `<i class="ec-fx${e.screen ? ' screen' : ''}" style="left:${cqw(e.x + ox - e.s / 2)};top:${cqw(e.y - e.s / 2)};width:${cqw(e.s)};height:${cqw(e.s)};opacity:${e.op};background-image:${img('zona1_efectos.webp')};background-position-y:${e.row * 33.3333}%;animation-delay:calc(-${(e.off * 0.13).toFixed(2)}s / var(--spd))"></i>`;
    const actor = (a, i) => {
      if (a.video && VIDEO_OK) return `<div class="ec-actor" data-i="${i}" style="left:${cqw(a.x + ox - a.vw * cs * (a.vc || 0.5))};top:${cqw(z.counterY - a.vh * cs)};width:${cqw(a.vw * cs)};height:${cqw(a.vh * cs)}"><img class="ec-poster" src="${DIR}${a.poster}" alt="" draggable="false"></div>`;
      return `<div class="ec-actor" data-i="${i}" style="left:${cqw(a.x + ox - cw / 2)};top:${cqw(z.counterY - ch)};width:${cqw(cw)};height:${cqw(ch)}">${atlasInner(a)}</div>`; };
    const walker = (w, i) => { const ww = w.vw * w.s, wh = w.vh * w.s;
      return `<div class="ec-walker" data-w="${i}" style="left:${cqw(w.x0 + ox - ww * (w.vc || 0.5))};top:${cqw(z.counterY - wh)};width:${cqw(ww)};height:${cqw(wh)};--wx:${cqw(w.x1 - w.x0)};--cycle:${w.cycle}s;animation-delay:calc(-${w.start}s / var(--spd))"></div>`; };
    const glow = g => `<i class="ec-glow" style="left:${cqw(g[0] + ox - 130)};top:${cqw(g[1] - 130)};width:${cqw(260)};height:${cqw(260)};animation-delay:-${(g[0] % 7 * 0.3).toFixed(1)}s"></i>`;
    preload(); wake();
    return `<div class="ec-wrap"><div class="ec-fill" style="background-image:${img(z.plate)}"></div><div class="ec-scene${rash ? ' rash' : ''}" data-zone="${zid}" data-spd="${rash ? 1.8 : 1}" style="--spd:${rash ? 1.8 : 1};--asp:${(z.w / z.h).toFixed(4)}"><div class="ec-cam">`
      + `<img class="ec-plate" src="${DIR}${z.plate}" alt="" draggable="false">`
      + z.fxBack.map(fx).join('')
      + `<div class="ec-cast" style="height:${(z.counterY / z.h * 100).toFixed(3)}%">${VIDEO_OK ? (z.walkers || []).map((w, i) => w.off ? '' : walker(w, i)).join('') : ''}${z.actors.map(actor).join('')}</div>`
      + z.fxFront.map(fx).join('')
      + z.glows.map(glow).join('')
      + `</div></div></div>`;
  }

  /** Las dos capas de un cocinero hecho con atlas: fotograma actual y el siguiente que se funde por encima. */
  function atlasInner(a) { const rows = Math.max(1, Math.ceil(a.dur.length / 4)), st = `width:400%;height:${rows * 100}%`, src = DIR + a.sheet;
    return `<img src="${src}" alt="" draggable="false" decoding="async" style="${st}"><img class="nx" src="${src}" alt="" draggable="false" decoding="async" style="${st}">`; }

  // ---------- motor (un solo requestAnimationFrame para todas las escenas) ----------
  const cache = new WeakMap();                         // escena -> actores con sus capas y duraciones acumuladas
  let raf = 0, last = 0, slowN = 0, fade = true, avgDt = 16, dbg = false, dbgT = 0, taps = [];

  function build(scene) {
    const z = ZONES[scene.dataset.zone]; if (!z) return null;
    const walkers = (z.walkers || []).map((w, i) => {
      const el = scene.querySelector('.ec-walker[data-w="' + i + '"]'); if (!el) return null;
      const vid = pool(w); if (vid && vid.parentNode !== el) el.appendChild(vid);
      return { el, vid, z, walker: true, cfg: w, t: [], total: 1, n: 1, rows: 1, cur: -1, curB: -1, shown: true };
    }).filter(Boolean);
    return z.actors.map((a, i) => {
      const el = scene.querySelector('.ec-actor[data-i="' + i + '"]'); if (!el) return null;
      const t = []; let acc = 0; a.dur.forEach(d => { t.push(acc); acc += d; });
      const vid = el.querySelector('.ec-poster') ? pool(a) : null;
      if (vid && vid.parentNode !== el) el.appendChild(vid);                   // el video ya cargado se mueve a esta escena
      return { el, vid, z, a: vid ? null : el.children[0], b: vid ? null : el.children[1], cfg: a, t, total: acc, n: a.dur.length, rows: Math.max(1, Math.ceil(a.dur.length / 4)), cur: -1, curB: -1, shown: false };
    }).filter(Boolean).concat(walkers);
  }
  /** Si el video falla, el cocinero vuelve a su atlas de fotogramas. */
  function toAtlas(A) {
    const a = A.cfg, z = A.z, cs = z.cs || 1, cw = z.cell[0] * cs, ch = z.cell[1] * cs, st = A.el.style, ox = z.ox || 0, cqw = px => (px / z.w * 100).toFixed(3) + 'cqw';
    st.left = cqw(a.x + ox - cw / 2); st.top = cqw(z.counterY - ch); st.width = cqw(cw); st.height = cqw(ch);
    A.el.classList.remove('vr'); A.el.innerHTML = atlasInner(a); A.vid = null; A.a = A.el.children[0]; A.b = A.el.children[1]; A.cur = A.curB = -1;
  }
  function pauseAll() { Object.keys(POOL).forEach(k => { try { POOL[k].pause(); } catch (e) {} }); }
  function put(layer, k, A) {                          // fotograma k del atlas (4 columnas)
    layer.style.transform = 'translate3d(' + (-(k % 4) * 25) + '%,' + (-Math.floor(k / 4) / A.rows * 100) + '%,0)';
  }
  function tick(now) {
    raf = 0;
    const scenes = document.querySelectorAll('.ec-scene');
    if (!scenes.length) { pauseAll(); return; }        // nada en pantalla: el bucle se detiene (wake() lo reanuda)
    const dt = now - last; last = now;
    if (dt > 0 && dt < 200) {                          // si el dispositivo va justo se quita el fundido (queda solo el fotograma actual)
      avgDt = avgDt * 0.95 + dt * 0.05;
      slowN = avgDt > 30 ? Math.min(slowN + 1, 120) : Math.max(slowN - 1, 0);
      fade = slowN < 60;
    }
    if (dbg && now - dbgT > 500) {
      dbgT = now; const d = document.querySelector('.ec-dbg');
      if (d) d.textContent = [(1000 / avgDt).toFixed(0) + ' fps (' + avgDt.toFixed(1) + ' ms)', 'fundido: ' + (fade ? 'sí' : 'NO (lento)'), 'lentos: ' + slowN + '/120', 'DPR ' + devicePixelRatio, 'videos: ' + Object.keys(POOL).map(k => POOL[k].readyState).join('/')].join('\n');
    }
    scenes.forEach(sc => {
      let actors = cache.get(sc); if (!actors) { actors = build(sc) || []; cache.set(sc, actors); }
      if (!sc.offsetParent) { actors.forEach(A => { if (A.vid) A.vid.pause(); }); return; }   // oculta (pantalla de inicio cerrada): no se gasta nada
      const spd = +sc.dataset.spd || 1;
      actors.forEach(A => {
        if (A.vid) {
          if (A.vid.error) { if (A.walker) { A.el.style.display = 'none'; A.vid = null; return; } toAtlas(A); }
          else {
            if (A.vid.playbackRate !== spd) A.vid.playbackRate = spd;
            if (A.vid.paused) { const p = A.vid.play(); if (p && p.catch) p.catch(() => {}); }
            if (!A.shown && A.vid.readyState >= 3 && !A.vid.paused && A.vid.currentTime > 0) { A.shown = true; A.el.classList.add('vr'); }   // ya hay video: se oculta la foto
            return;
          }
        }
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
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } pauseAll(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (document.querySelector('.ec-scene')) wake(); });

  // 5 toques seguidos sobre la escena muestran u ocultan el medidor de fps (para revisar el rendimiento en el celular)
  document.addEventListener('pointerdown', ev => {
    const sc = document.querySelector('.ec-scene'); if (!sc) return; const r = sc.getBoundingClientRect();
    if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
    const n = performance.now(); taps = taps.filter(t => n - t < 2000); taps.push(n);
    if (taps.length >= 5) { taps = []; dbg = !dbg; const old = sc.querySelector('.ec-dbg'); if (old) old.remove(); if (dbg) { const d = document.createElement('div'); d.className = 'ec-dbg'; sc.appendChild(d); } }
  }, true);

  window.EscenaCocina = { has: key => !!MAP[key], html, stop, preload };
})();
