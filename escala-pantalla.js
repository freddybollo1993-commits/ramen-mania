/* Escala de pantalla: adapta el juego a pantallas más chicas que la de diseño (iPhone SE/8/mini, navegadores con barras, etc.).
   El juego está dibujado para un espacio de ~873×393 px (Redmi Note 15 Pro+ en horizontal). Si la pantalla útil es más pequeña, en vez de recortar
   lo que no cabe se agranda el «espacio virtual» con la etiqueta <meta name="viewport"> (width = ancho virtual): el navegador lo reduce para que quepa
   y todas las coordenadas (toques, arrastres, getBoundingClientRect) siguen siendo coherentes, a diferencia de zoom o transform.
   · Solo reduce (nunca amplía) y solo en horizontal; en vertical el juego pide girar el teléfono y se deja el viewport original.
   · No cambia nada en pantallas del tamaño del diseño o mayores (k > 0,97).
   · No reescala mientras se escribe en un campo de texto (el teclado achica la ventana en Android).
   Script clásico; va en <head>, después del <meta name="viewport">. API de depuración: EscalaPantalla.info(). */
(function () {
  'use strict';
  var DW = 873, DH = 393;           // espacio de diseño en px CSS
  var MIN_K = 0.5;                  // nunca reducir por debajo de la mitad
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  var BASE = meta.getAttribute('content');
  var appliedW = 0, appliedK = 1, timer = null, changes = [];

  function typing() { var a = document.activeElement; return !!a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName); }
  /** Tamaño útil en px CSS del dispositivo (a escala 1), independiente de la escala que ya apliquemos. */
  function physical() {
    var vv = window.visualViewport, s = (vv && vv.scale) || 1;
    // si ya reducimos pero el navegador no informa la escala del viewport (algunos Safari), usamos la nuestra
    if (appliedW && Math.abs(window.innerWidth - appliedW) < 4 && Math.abs(s - 1) < 0.02) s = appliedK;
    return { w: window.innerWidth * s, h: window.innerHeight * s };
  }
  function set(content) { if (meta.getAttribute('content') !== content) meta.setAttribute('content', content); }
  function reset() { if (appliedW) { appliedW = 0; appliedK = 1; set(BASE); } }

  function apply() {
    timer = null;
    if (typing()) return;
    var now = Date.now(); changes = changes.filter(function (t) { return now - t < 3000; });
    if (changes.length >= 4) return;                                   // freno por si un navegador responde de forma inesperada
    var p = physical();
    if (!(p.w > 0 && p.h > 0)) return;
    if (p.w < p.h) { if (appliedW) { changes.push(now); reset(); } return; }   // vertical
    var k = Math.max(MIN_K, Math.min(1, p.w / DW, p.h / DH));
    if (k > 0.97) { if (appliedW) { changes.push(now); reset(); } return; }
    var W = Math.ceil(p.w / k);
    if (appliedW && Math.abs(W - appliedW) < 6) return;                // sin cambios apreciables
    appliedW = W; appliedK = p.w / W; changes.push(now);
    set('width=' + W + ', maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
  function schedule(ms) { if (timer) clearTimeout(timer); timer = setTimeout(apply, ms == null ? 200 : ms); }

  window.addEventListener('resize', function () { schedule(200); });
  window.addEventListener('orientationchange', function () { schedule(350); });
  window.addEventListener('pageshow', function () { schedule(50); });
  window.addEventListener('focusout', function () { schedule(400); });   // al cerrar el teclado se recalcula
  apply();
  window.EscalaPantalla = { info: function () { var p = physical(); return { fisica: [Math.round(p.w), Math.round(p.h)], virtual: [window.innerWidth, window.innerHeight], anchoAplicado: appliedW, escala: +appliedK.toFixed(3) }; } };
})();
