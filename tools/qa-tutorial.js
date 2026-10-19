/* Bot de QA del tutorial guiado (guia.js): recorre las lecciones con «Saltar paso» y revisa cada paso.
 *
 * Qué comprueba por paso: que el objetivo (y el destino del arrastre) existan y estén dentro de la pantalla, que la tarjeta del tutorial, el recuadro y
 * la manita no se salgan de la ventana, que la tarjeta no tape el objetivo, que el paso avance (no se atasque) y, con el bloqueo de toques activo
 * (Guia.shield), que un toque FUERA de lo que se explica se bloquee y uno sobre el objetivo no.
 *
 * Uso (con el servidor en marcha, en localhost): await (await fetch('/tools/qa-tutorial.js')).text().then(t => (0, eval)(t));
 *   const r = await QATutorial.run({ lecciones: ['ramen', 'salteados', 'makis', 'frituras'] }); r
 * Protecciones: solo localhost, Supabase bloqueado, localStorage restaurado (las recompensas y marcas de lecciones no quedan). Tarda varios minutos.
 */
(function () {
  'use strict';
  if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) { window.QATutorial = { run() { throw new Error('QATutorial solo corre en localhost'); } }; return; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function leccion(key, opt, out) {
    Guia.start(key); await sleep(1800);
    const vw = window.innerWidth, vh = window.innerHeight, probs = [];
    let guard = 0, last = -1, same = 0;
    while (Guia.active && guard++ < 260) {
      const i = Guia.index(), s = Guia.steps()[i];
      await sleep(opt.espera);
      if (i === last) { same++; } else { same = 0; last = i; }
      const rec = { paso: i + 1, titulo: String(s.title || '').replace(/<[^>]+>/g, '').slice(0, 40) }, P = m => probs.push(rec.paso + ' «' + rec.titulo + '»: ' + m);
      const d = Guia.diag();
      const card = document.getElementById('gu-card'), cr = card ? card.getBoundingClientRect() : null;
      if (cr && (cr.left < -1 || cr.top < -1 || cr.right > vw + 1 || cr.bottom > vh + 1)) P('la tarjeta se sale de la pantalla [' + [cr.left, cr.top, cr.right, cr.bottom].map(Math.round).join(',') + '] de ' + vw + '×' + vh);
      const btns = card ? [...card.querySelectorAll('button')].filter(b => b.offsetParent !== null) : [];
      btns.forEach(b => { const r = b.getBoundingClientRect(); if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1) P('un botón del tutorial (' + (b.textContent || '').trim().slice(0, 12) + ') queda fuera de la pantalla'); });
      if (!s.info) {
        if (d && d.hasTarget && !d.target) P('el objetivo no existe o no se ve');
        if (d && d.to === false) P('el destino del arrastre no existe o no se ve');
        const r1 = document.getElementById('gu-r1').getBoundingClientRect(), r1v = document.getElementById('gu-r1').style.display !== 'none';
        if (r1v && cr) { const w = Math.min(r1.right, cr.right) - Math.max(r1.left, cr.left), h = Math.min(r1.bottom, cr.bottom) - Math.max(r1.top, cr.top); if (w > 8 && h > 8 && w * h > 0.35 * r1.width * r1.height) P('la tarjeta tapa el objetivo'); }
        const hand = document.getElementById('gu-hand'); if (hand && hand.style.display !== 'none') { const hr = hand.getBoundingClientRect(); if (hr.left < -1 || hr.top < -1 || hr.right > vw + 1 || hr.bottom > vh + 1) P('la manita se sale de la pantalla'); }
        const tr = document.getElementById('gu-r1'); const tgt = Guia.targetRect && Guia.targetRect();
        if (tgt && (tgt.left < -2 || tgt.top < -2 || tgt.right > vw + 2 || tgt.bottom > vh + 2)) P('el objetivo se sale de la pantalla [' + [tgt.left, tgt.top, tgt.right, tgt.bottom].map(Math.round).join(',') + ']');
        if (opt.bloqueo && !/⏳/.test(s.title || '') && window.Guia.shieldCheck) { const c = Guia.shieldCheck(); if (c) c.forEach(m => P(m)); }
        try { await Guia.skip(); } catch (e) { P('assist falló: ' + e.message); }
      } else { Guia.ok(); }
      let w = 0; while (Guia.active && Guia.index() === i && w++ < 40) await sleep(150);
      if (Guia.active && Guia.index() === i) { P('el paso no avanzó (atascado)'); if (same >= 1) { probs.push('— se detiene la lección ' + key); break; } }
      out.pasos++;
    }
    out.lecciones.push({ leccion: key, problemas: probs });
    if (Guia.active) { try { Guia.stop(); returnToStartMenu(); } catch (e) {} }
    await sleep(900);                                                   // el cartel «Lección completada» aparece 450 ms después de terminar
    try { document.querySelectorAll('.gu-menuwrap').forEach(e => e.remove()); } catch (e) {}
  }

  async function run(opt) {
    opt = Object.assign({ lecciones: ['ramen', 'salteados', 'makis', 'frituras'], espera: 350, bloqueo: true }, opt || {});
    const snapshot = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); snapshot[k] = localStorage.getItem(k); } } catch (e) {}
    const of = window.fetch; window.fetch = function (u) { if (/supabase\.co/.test(String((u && u.url) || u))) return Promise.reject(new TypeError('Failed to fetch (bloqueado por QATutorial)')); return of.apply(this, arguments); };
    const errores = [], onE = e => errores.push(e.message || String(e.reason)); window.addEventListener('error', onE);
    const out = { ventana: [innerWidth, innerHeight], pasos: 0, lecciones: [], errores };
    const st = document.createElement('style'); st.id = 'qa-tut-css'; st.textContent = '.gu-card { transition: none !important; }'; document.head.appendChild(st);   // con el panel oculto las transiciones CSS no avanzan y la tarjeta se mediría a medio camino
    try {
      localStorage.setItem('ramen_tutorial_completed', 'true');
      for (const k of opt.lecciones) await leccion(k, opt, out);
    } finally {
      window.fetch = of; window.removeEventListener('error', onE);
      const q = document.getElementById('qa-tut-css'); if (q) q.remove();
      try { localStorage.clear(); Object.keys(snapshot).forEach(k => localStorage.setItem(k, snapshot[k])); } catch (e) {}
    }
    out.total = out.lecciones.reduce((n, l) => n + l.problemas.length, 0);
    return out;
  }
  window.QATutorial = { run };
})();
