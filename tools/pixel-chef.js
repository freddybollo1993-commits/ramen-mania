/* Chef en pixel art dibujado solo con código (sin imágenes), a resolución elegible.
   El personaje se diseña en un espacio de 64 × 80 «píxeles de diseño» y se dibuja con Q subpíxeles por cada uno (Q = 1 muy grueso … 12 muy fino).
   Cada pieza (pelo, gorro, ropa, delantal, cara, utensilio) es una función que añade formas; el motor las apila, las sombrea con cinco tonos
   (luz arriba a la izquierda), añade textura (mechones, pliegues) y traza un contorno fino en la silueta y donde una pieza tapa a otra.
   API: PixelChef.render(look, pose, Q, sombra) → canvas de (64·Q) × (80·Q) · PixelChef.CATALOGO · PixelChef.POSES · PixelChef.medir(Q) */
(function () {
  'use strict';
  var W = 64, H = 80;

  // ---------- color ----------
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  var OUT = hex('#2b1810'), WHITE = [255, 250, 238];
  /** Cinco tonos: 0 sombra profunda, 1 sombra, 2 base, 3 luz, 4 brillo. */
  function tones(base, o) {
    o = o || {}; var c = typeof base === 'string' ? hex(base) : base;
    return [mix(c, OUT, o.d == null ? 0.46 : o.d), mix(c, [70, 28, 56], o.s == null ? 0.34 : o.s), c, mix(c, [255, 240, 205], o.l == null ? 0.30 : o.l), mix(c, WHITE, o.h == null ? 0.62 : o.h)];
  }
  /** Paleta suave: NP tonos interpolados entre sombra profunda y luz; menos escalones a baja resolución. */
  var NP = 8;
  function pal(T) { if (T._p && T._n === NP) return T._p; var st = [T[0], T[1], T[2], T[3]], P = []; for (var i = 0; i < NP; i++) { var t = i / (NP - 1) * 3, a = Math.floor(t), b = Math.min(3, a + 1); P.push(mix(st[a], st[b], t - a)); } T._p = P; T._n = NP; return P; }
  var dark = function (T, k) { return mix(T[2], OUT, k == null ? 0.5 : k); };

  // ---------- motor ----------
  function Canvas(Q) {
    NP = Q <= 2 ? 4 : Q <= 4 ? 6 : 9;
    var w = W * Q, h = H * Q, id = new Int16Array(w * h), col = new Array(w * h), n = 0, OW = Math.max(1, Math.round(Q * 0.36));
    var self = {
      Q: Q,
      /** Forma: mask(x, y) en unidades de diseño. geo = [cx, cy, rx, ry] para el sombreado. opts: flat, tex(x,y)→-1|0|1, gloss. */
      shape: function (mask, bx0, by0, bx1, by1, T, geo, opts) {
        opts = opts || {}; n++;
        var cx = geo[0], cy = geo[1], rx = geo[2] || 1, ry = geo[3] || 1, x0 = Math.max(0, Math.floor(bx0 * Q)), x1 = Math.min(w - 1, Math.ceil(bx1 * Q)), y0 = Math.max(0, Math.floor(by0 * Q)), y1 = Math.min(h - 1, Math.ceil(by1 * Q));
        for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
          var dx = (x + 0.5) / Q, dy = (y + 0.5) / Q; if (!mask(dx, dy)) continue;
          var col_;
          if (opts.flat) { col_ = T[2]; if (opts.tex) col_ = pal(T)[Math.max(0, Math.min(NP - 1, ((NP - 1) >> 1) + opts.tex(dx, dy) * 2))]; }
          else {
            var u = (dx - cx) / rx, v = (dy - cy) / ry, l = -0.62 * u - 0.78 * v; l += Math.max(0, (u + v) * 0.5 - 0.3) * 0.9;      // luz rebotada abajo a la derecha (gradual)
            var kk = Math.round(Math.max(0, Math.min(1, (l + 0.95) / 1.8)) * (NP - 1));
            if (opts.tex) kk = Math.max(0, Math.min(NP - 1, kk + opts.tex(dx, dy) * 2));
            col_ = (opts.gloss && l > 0.82) ? T[4] : pal(T)[kk];
          }
          id[y * w + x] = n; col[y * w + x] = col_;
        }
        return n;
      },
      ell: function (cx, cy, rx, ry, T, o) { return this.shape(function (x, y) { var u = (x - cx) / rx, v = (y - cy) / ry; return u * u + v * v <= 1; }, cx - rx, cy - ry, cx + rx, cy + ry, T, [cx, cy, rx, ry], o); },
      rect: function (x0, y0, x1, y1, T, o) { return this.shape(function (x, y) { return x >= x0 && x < x1 && y >= y0 && y < y1; }, x0, y0, x1, y1, T, [(x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2], o); },
      rrect: function (x0, y0, x1, y1, r, T, o) {
        return this.shape(function (x, y) { if (x < x0 || x >= x1 || y < y0 || y >= y1) return false; var dx = Math.max(x0 + r - x, 0, x - (x1 - r)), dy = Math.max(y0 + r - y, 0, y - (y1 - r)); return dx * dx + dy * dy <= r * r; },
          x0, y0, x1, y1, T, [(x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2], o);
      },
      poly: function (pts, T, o) {
        var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; }), x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
        return this.shape(function (x, y) {
          var inside = false;
          for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) { var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside; }
          return inside;
        }, x0, y0, x1, y1, T, [(x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 || 1, (y1 - y0) / 2 || 1], o);
      },
      /** Cápsula con radio r0 en el inicio y r1 al final. */
      cap: function (x0, y0, x1, y1, r0, T, o, r1) {
        r1 = r1 == null ? r0 : r1; var dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, R = Math.max(r0, r1);
        return this.shape(function (x, y) { var t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / L2)), px = x0 + dx * t, py = y0 + dy * t, r = r0 + (r1 - r0) * t; return (x - px) * (x - px) + (y - py) * (y - py) <= r * r; },
          Math.min(x0, x1) - R, Math.min(y0, y1) - R, Math.max(x0, x1) + R, Math.max(y0, y1) + R, T, [(x0 + x1) / 2, (y0 + y1) / 2, Math.abs(dx) / 2 + R, Math.abs(dy) / 2 + R], o);
      },
      /** Decoración: pinta solo sobre lo ya dibujado, sin contorno ni cambiar de pieza. alpha 0..1 mezcla con lo de debajo. */
      deco: function (mask, bx0, by0, bx1, by1, color, alpha) {
        var x0 = Math.max(0, Math.floor(bx0 * Q)), x1 = Math.min(w - 1, Math.ceil(bx1 * Q)), y0 = Math.max(0, Math.floor(by0 * Q)), y1 = Math.min(h - 1, Math.ceil(by1 * Q)); alpha = alpha == null ? 1 : alpha;
        for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) { var i = y * w + x; if (!id[i]) continue; if (mask((x + 0.5) / Q, (y + 0.5) / Q)) col[i] = alpha >= 1 ? color : mix(col[i], color, alpha); }
      },
      dEll: function (cx, cy, rx, ry, color, alpha) { this.deco(function (x, y) { var u = (x - cx) / rx, v = (y - cy) / ry; return u * u + v * v <= 1; }, cx - rx, cy - ry, cx + rx, cy + ry, color, alpha); },
      dLine: function (x0, y0, x1, y1, wd, color, alpha) {
        var dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, r = wd / 2;
        this.deco(function (x, y) { var t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / L2)), px = x0 + dx * t, py = y0 + dy * t; return (x - px) * (x - px) + (y - py) * (y - py) <= r * r; }, Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, color, alpha);
      },
      dPoly: function (pts, color, alpha) {
        var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
        this.deco(function (x, y) { var inside = false; for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) { var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside; } return inside; },
          Math.min.apply(0, xs), Math.min.apply(0, ys), Math.max.apply(0, xs), Math.max.apply(0, ys), color, alpha);
      },
      /** Contorno y volcado a un canvas de w × h. */
      toCanvas: function (shadow) {
        var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
        if (shadow) {
          var cx = 32 * Q, cy = 76.6 * Q, rx = 13 * Q, ry = 1.7 * Q;
          for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { var u = (x - cx) / rx, v = (y - cy) / ry; if (u * u + v * v <= 1) { var i0 = (y * w + x) * 4; d[i0] = 0; d[i0 + 1] = 0; d[i0 + 2] = 0; d[i0 + 3] = 82; } }
        }
        for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
          var i = yy * w + xx, a = id[i]; if (!a) continue; var c0 = col[i], out = null;
          var nb = [xx + OW < w ? id[i + OW] : 0, xx - OW >= 0 ? id[i - OW] : 0, yy + OW < h ? id[i + OW * w] : 0, yy - OW >= 0 ? id[i - OW * w] : 0];
          for (var k = 0; k < 4; k++) { var b = nb[k]; if (b === 0) { out = OUT; break; } if (b > a) out = out || mix(c0, OUT, 0.66); }
          var f = out || c0, o4 = i * 4; d[o4] = f[0]; d[o4 + 1] = f[1]; d[o4 + 2] = f[2]; d[o4 + 3] = 255;
        }
        g.putImageData(im, 0, 0); return c;
      }
    };
    return self;
  }

  // ---------- catálogo ----------
  var PIEL = { clara: '#f6c9a0', trigo: '#e9b283', miel: '#d49a68', canela: '#b97a50', cacao: '#8a5538', ebano: '#5c3a28' };
  var PELO = { negro: '#2f2a3a', castano: '#6b4128', rubio: '#e3b448', rojo: '#c4492a', canoso: '#d0d0dc', azul: '#3f7fe0', rosa: '#ee6fa6', menta: '#4fcfa0', violeta: '#8c58d8' };
  var CATALOGO = { peinado: {}, gorro: {}, ropa: {}, delantal: {}, cara: {}, utensilio: {} };

  // texturas
  var strand = function (a, b) { return function (x, y) { var s = Math.sin((x * a + y * b) * 2.1); return s > 0.92 ? 1 : s < -0.94 ? -1 : 0; }; };
  var radial = function (cx, cy, n) { return function (x, y) { var s = Math.sin(Math.atan2(y - cy, x - cx) * n); return s > 0.9 ? 1 : s < -0.93 ? -1 : 0; }; };
  var weave = function (x, y) { var a = Math.sin((x + y) * 3.1), b = Math.sin((x - y) * 3.1); return (a > 0.7 || b > 0.7) ? -1 : 0; };

  // ---------- cuerpo ----------
  function armPts(sx, sy, side, a, b) {
    var r1 = 8.2, r2 = 7.2, A = a * Math.PI / 180, B = (a + b) * Math.PI / 180;
    var ex = sx + side * Math.sin(A) * r1, ey = sy + Math.cos(A) * r1, hx = ex + side * Math.sin(B) * r2, hy = ey + Math.cos(B) * r2;
    return { sx: sx, sy: sy, ex: ex, ey: ey, hx: hx, hy: hy };
  }
  function hand(C, x, y, skin) {
    C.ell(x, y + 0.6, 2.6, 2.8, skin);
    C.dLine(x - 0.9, y + 1.1, x - 0.9, y + 2.7, 0.24, dark(skin, 0.4), 0.7); C.dLine(x + 0.1, y + 1.3, x + 0.1, y + 2.9, 0.24, dark(skin, 0.4), 0.7);
  }

  function draw(C, look, pose) {
    pose = pose || {}; var dy = pose.dy || 0;
    var sk = PIEL[look.piel] || PIEL.clara, skin = tones(sk, { l: .28, s: .24, h: .5 }), hairC = PELO[look.color] || PELO.negro, hair = tones(hairC, { l: .30, s: .36 });
    var ropa = CATALOGO.ropa[look.ropa] || CATALOGO.ropa.camiseta, pants = tones('#2f3a60'), shoe = tones('#f2f0ea', { l: .1, s: .22 });
    var peinado = CATALOGO.peinado[look.peinado] || CATALOGO.peinado.corto;
    if (peinado.back) peinado.back(C, hair, dy);
    // piernas y zapatos
    C.rrect(26, 58 + dy, 31, 70 + dy, 1.2, pants); C.rrect(33, 58 + dy, 38, 70 + dy, 1.2, pants);
    C.dLine(28.5, 60 + dy, 28.5, 69 + dy, 0.3, pants[1], 0.7); C.dLine(35.5, 60 + dy, 35.5, 69 + dy, 0.3, pants[1], 0.7);
    C.ell(27.6, 72.2 + dy, 4.8, 3.1, shoe, { gloss: 1 }); C.ell(36.4, 72.2 + dy, 4.8, 3.1, shoe, { gloss: 1 });
    C.dLine(23.8, 73.6 + dy, 31.4, 73.6 + dy, 0.5, mix(shoe[2], OUT, 0.35), 0.8); C.dLine(32.6, 73.6 + dy, 40.2, 73.6 + dy, 0.5, mix(shoe[2], OUT, 0.35), 0.8);
    C.dLine(27, 70.8 + dy, 29.6, 70.4 + dy, 0.3, shoe[1], 0.9); C.dLine(34.4, 70.4 + dy, 37, 70.8 + dy, 0.3, shoe[1], 0.9);
    // brazos
    var aL = armPts(24, 44 + dy, -1, (pose.armL || {}).a1 == null ? 8 : pose.armL.a1, (pose.armL || {}).a2 || 0);
    var aR = armPts(40, 44 + dy, 1, (pose.armR || {}).a1 == null ? 8 : pose.armR.a1, (pose.armR || {}).a2 || 0);
    [aL, aR].forEach(function (a) { C.cap(a.sx, a.sy, a.ex, a.ey, 2.3, skin, null, 2.1); C.cap(a.ex, a.ey, a.hx, a.hy, 2.1, skin, null, 1.8); hand(C, a.hx, a.hy, skin); });
    // torso y ropa
    ropa.torso(C, dy, look);
    [aL, aR].forEach(function (a) { ropa.manga(C, a, dy); });
    if (CATALOGO.delantal[look.delantal]) CATALOGO.delantal[look.delantal](C, dy);
    // utensilio en la mano derecha del personaje (a la izquierda de la pantalla), delante del cuerpo
    if (pose.item && CATALOGO.utensilio[pose.item]) { C.ell(aL.hx, aL.hy + 0.4, 2.7, 2.9, skin); CATALOGO.utensilio[pose.item](C, aL.hx, aL.hy, pose.itemRot == null ? 0 : pose.itemRot); C.ell(aL.hx, aL.hy + 1.7, 2.8, 2.3, skin); C.dLine(aL.hx - 1.1, aL.hy + 1.0, aL.hx - 1.1, aL.hy + 2.6, 0.22, dark(skin, 0.4), 0.7); C.dLine(aL.hx + 0.2, aL.hy + 1.1, aL.hx + 0.2, aL.hy + 2.8, 0.22, dark(skin, 0.4), 0.7); }
    // cuello, orejas y cabeza
    C.rect(29, 38 + dy, 35, 42 + dy, skin); C.dEll(32, 40.6 + dy, 3.4, 1.2, skin[1], 0.9);
    C.ell(18.2, 29 + dy, 2.7, 3.7, skin); C.ell(45.8, 29 + dy, 2.7, 3.7, skin); C.dEll(18.4, 29.4 + dy, 1.1, 1.9, skin[1], 0.8); C.dEll(45.6, 29.4 + dy, 1.1, 1.9, skin[1], 0.8);
    C.ell(32, 26 + dy, 14, 12.6, skin, { gloss: 1 });
    face(C, look, pose, dy, skin, hairC);
    if (CATALOGO.cara[look.cara]) CATALOGO.cara[look.cara](C, dy);
    peinado.front(C, hair, dy, !!look.gorro);
    if (CATALOGO.gorro[look.gorro]) CATALOGO.gorro[look.gorro](C, dy, hair);
  }

  function face(C, look, pose, dy, skin, hairC) {
    var ey = 29 + dy, eyeC = hex('#2a1a1f'), browC = mix(hex(hairC), OUT, 0.5), mouthC = hex('#7a2b30'), pink = [255, 110, 135];
    // rubor y nariz
    C.dEll(21.6, ey + 4.5, 2.6, 1.5, pink, 0.5); C.dEll(42.4, ey + 4.5, 2.6, 1.5, pink, 0.5); C.dEll(32, ey + 3.4, 0.7, 0.55, skin[1], 0.9);
    [26, 38].forEach(function (cx, i) {
      if (pose.blink) { C.dLine(cx - 2.1, ey + 0.6, cx + 2.1, ey + 0.6, 0.55, eyeC); C.dLine(cx - 2.2, ey + 0.3, cx - 2.7, ey - 0.3, 0.35, eyeC); return; }
      C.dEll(cx, ey + 0.3, 2.15, 2.85, eyeC);
      C.dEll(cx, ey + 1.0, 1.55, 1.8, mix(eyeC, [90, 60, 120], 0.45), 0.55);
      C.dEll(cx - 0.75, ey - 0.8, 0.8, 0.85, WHITE); C.dEll(cx + 0.8, ey + 1.5, 0.38, 0.38, WHITE, 0.8);
      C.dLine(cx - 2.3, ey - 1.9, cx + 2.3, ey - 2.3, 0.5, OUT);                    // párpado
      C.dLine(cx + (i ? 1.9 : -1.9) + (i ? 0.4 : -0.4), ey - 2.0, cx + (i ? 3.0 : -3.0), ey - 2.8, 0.3, OUT);   // pestaña
    });
    // cejas
    C.dLine(23.8, ey - 4.7, 28.4, ey - 5.2, 0.62, browC); C.dLine(35.6, ey - 5.2, 40.2, ey - 4.7, 0.62, browC);
    // boca
    if (pose.mouth === 'open') {
      C.dPoly([[29.2, 34 + dy], [34.8, 34 + dy], [34.2, 35.6 + dy], [33, 36.5 + dy], [31, 36.5 + dy], [29.8, 35.6 + dy]], mouthC);
      C.dPoly([[29.9, 34 + dy], [34.1, 34 + dy], [34.1, 34.8 + dy], [29.9, 34.8 + dy]], WHITE); C.dEll(32, 36 + dy, 1.5, 0.75, [224, 99, 111]);
    } else { C.dLine(29.6, 34 + dy, 31, 35.4 + dy, 0.55, mouthC); C.dLine(31, 35.4 + dy, 33, 35.4 + dy, 0.55, mouthC); C.dLine(33, 35.4 + dy, 34.4, 34 + dy, 0.55, mouthC); }
  }

  // ---------- peinados ----------
  function fringeCap(C, hair, dy, o) {
    o = o || {};
    C.shape(function (x, y) {
      var u = (x - 32) / 15.2, v = (y - (24 + dy)) / 13.6; if (u * u + v * v > 1) return false;
      var f = 26.5 + dy + (o.fringe == null ? 1 : o.fringe) + 2.3 * Math.sin((x - 18) * 0.62) - (x > 32 ? (x - 32) * 0.12 : 0);
      if (y < f) return true; return Math.abs(x - 32) > 12.4 && y < 33 + dy;
    }, 16, 8 + dy, 48, 36 + dy, hair, [32, 22 + dy, 16, 14], { tex: radial(32, 8 + dy, 22), gloss: 1 });
    C.dLine(23, 14.8 + dy, 31, 12.3 + dy, 0.5, hair[4], 0.55);                          // brillo
    C.dLine(26, 21 + dy, 24.6, 27 + dy, 0.28, hair[1], 0.8); C.dLine(32, 20 + dy, 31, 26.6 + dy, 0.28, hair[1], 0.8); C.dLine(38, 21 + dy, 39.4, 27 + dy, 0.28, hair[1], 0.8);   // separaciones del flequillo
  }
  CATALOGO.peinado.corto = { front: function (C, hair, dy) { fringeCap(C, hair, dy); C.poly([[26, 13 + dy], [30, 9 + dy], [34, 12 + dy], [36, 9 + dy], [40, 14 + dy]], hair, { tex: strand(0.9, 0.3) }); } };
  CATALOGO.peinado.erizado = { front: function (C, hair, dy, hat) { fringeCap(C, hair, dy, { fringe: 0 }); if (hat) return;
    C.poly([[17, 20 + dy], [15, 10 + dy], [22, 14 + dy], [24, 5 + dy], [29, 12 + dy], [33, 3 + dy], [37, 12 + dy], [42, 5 + dy], [43, 14 + dy], [49, 10 + dy], [47, 20 + dy]], hair, { tex: strand(0.5, 0.9), gloss: 1 }); } };
  CATALOGO.peinado.mono = { front: function (C, hair, dy, hat) { fringeCap(C, hair, dy); if (hat) return; C.ell(32, 9 + dy, 5.6, 5, hair, { tex: strand(0.9, 0.5), gloss: 1 }); var r = tones('#e0523f'); C.rect(28.4, 13 + dy, 35.6, 15.2 + dy, r); } };
  CATALOGO.peinado.coleta = { back: function (C, hair, dy) { C.cap(47, 18 + dy, 54, 36 + dy, 3.3, hair, { tex: strand(0.4, 1.0) }, 2.2); }, front: function (C, hair, dy) { fringeCap(C, hair, dy); C.rect(44.6, 14.6 + dy, 49.2, 19 + dy, tones('#e0523f')); } };
  CATALOGO.peinado.largo = { back: function (C, hair, dy) { C.rrect(15, 16 + dy, 49, 52 + dy, 6, hair, { tex: strand(0.2, 1.1) }); }, front: function (C, hair, dy) { fringeCap(C, hair, dy, { fringe: 1.5 }); C.rrect(15, 24 + dy, 20.4, 46 + dy, 2.4, hair, { tex: strand(0.2, 1.1) }); C.rrect(43.6, 24 + dy, 49, 46 + dy, 2.4, hair, { tex: strand(0.2, 1.1) }); } };
  CATALOGO.peinado.rapado = { front: function (C, hair, dy) { C.shape(function (x, y) { var u = (x - 32) / 14.6, v = (y - (24 + dy)) / 12.8; return u * u + v * v <= 1 && y < 21 + dy; }, 17, 10 + dy, 47, 25 + dy, hair, [32, 18 + dy, 14, 8], { tex: strand(1.4, 1.2) }); } };

  // ---------- gorros ----------
  CATALOGO.gorro.toque = function (C, dy) {
    var w = tones('#fbf8f0', { l: .0, s: .2, h: .0 }); C.ell(24, 8 + dy, 6.2, 6, w); C.ell(40, 8 + dy, 6.2, 6, w); C.ell(32, 4 + dy, 8.4, 6.2, w); C.rrect(18, 15 + dy, 46, 22 + dy, 2.2, w);
    [[24, 4, 25, 10], [30, 0.5, 30.5, 8], [36, 0.8, 36.6, 8], [40, 4, 39, 10]].forEach(function (l) { C.dLine(l[0], l[1] + dy + 1, l[2], l[3] + dy, 0.3, w[1], 0.8); });
    C.dLine(19, 19.4 + dy, 45, 19.4 + dy, 0.4, w[1], 0.85);
  };
  CATALOGO.gorro.hachimaki = function (C, dy) {
    var w = tones('#fbf8f0', { l: 0, s: .2, h: 0 }); C.rrect(17, 17 + dy, 47, 22.4 + dy, 2.2, w); C.ell(32, 19.7 + dy, 2.5, 2.5, tones('#d32f2f', { l: .2 }));
    C.poly([[46, 18 + dy], [53, 21 + dy], [50, 22 + dy], [55.5, 26.5 + dy], [47, 22.4 + dy]], w); C.dLine(20, 18.4 + dy, 29, 18 + dy, 0.3, w[1], 0.8); C.dLine(36, 21.6 + dy, 44, 21.4 + dy, 0.3, w[1], 0.8);
  };
  CATALOGO.gorro.tenugui = function (C, dy) {
    var b = tones('#2f4f8f'); C.shape(function (x, y) { var u = (x - 32) / 15, v = (y - (23 + dy)) / 12; return u * u + v * v <= 1 && y < 23 + dy; }, 17, 10 + dy, 48, 24 + dy, b, [32, 17 + dy, 15, 8], { gloss: 0 });
    C.poly([[46, 19 + dy], [53, 16 + dy], [52, 22 + dy], [56, 26 + dy], [47, 24 + dy]], b);
    for (var i = 0; i < 18; i++) { var x = 19 + (i * 7) % 27, y = 12 + dy + (i * 5) % 9; C.dEll(x, y, 0.5, 0.5, [236, 240, 250], 0.85); }
  };
  CATALOGO.gorro.orejas = function (C, dy) { var k = tones('#37323f'), p = tones('#f48fb1'); C.poly([[18, 17 + dy], [20, 4.4 + dy], [29, 13 + dy]], k, { gloss: 1 }); C.poly([[46, 17 + dy], [44, 4.4 + dy], [35, 13 + dy]], k, { gloss: 1 }); C.dPoly([[20.4, 14 + dy], [21, 8 + dy], [25.4, 12.6 + dy]], p[2]); C.dPoly([[43.6, 14 + dy], [43, 8 + dy], [38.6, 12.6 + dy]], p[2]); C.dLine(18.4, 15.8 + dy, 45.6, 15.8 + dy, 0.9, k[1], 0.8); };
  CATALOGO.gorro.kasa = function (C, dy) {
    var s = tones('#e2b862'); C.poly([[8, 22 + dy], [32, 4 + dy], [56, 22 + dy], [32, 25.4 + dy]], s, { tex: weave });
    for (var i = 0; i < 6; i++) C.dLine(32, 4.6 + dy, 12 + i * 8.2, 23.4 + dy, 0.2, s[1], 0.7);
    C.dLine(10, 22.6 + dy, 54, 22.6 + dy, 0.35, s[1], 0.8);
  };
  CATALOGO.gorro.corona = function (C, dy) {
    var g = tones('#ffc928', { l: .4 }); C.poly([[20, 15 + dy], [21, 5 + dy], [26, 11 + dy], [32, 3 + dy], [38, 11 + dy], [43, 5 + dy], [44, 15 + dy]], g, { gloss: 1 });
    C.dEll(32, 11.6 + dy, 1.2, 1.2, hex('#e53935')); C.dEll(25.5, 12.6 + dy, 0.8, 0.8, hex('#42a5f5')); C.dEll(38.5, 12.6 + dy, 0.8, 0.8, hex('#66bb6a')); C.dLine(20.6, 14.4 + dy, 43.4, 14.4 + dy, 0.45, g[1], 0.9);
  };

  // ---------- ropa ----------
  function sleeve(color, len, cuff) {
    var T = tones(color); return function (C, a, dy) {
      C.cap(a.sx, a.sy, a.sx + (a.ex - a.sx) * len, a.sy + (a.ey - a.sy) * len, 3.5, T, null, 3.3);
      if (len > 1.05) C.cap(a.ex, a.ey, a.ex + (a.hx - a.ex) * 0.72, a.ey + (a.hy - a.ey) * 0.72, 3.2, T, null, 3.0);
      if (cuff) { var ex = len > 1.05 ? a.ex + (a.hx - a.ex) * 0.72 : a.sx + (a.ex - a.sx) * len, ey = len > 1.05 ? a.ey + (a.hy - a.ey) * 0.72 : a.sy + (a.ey - a.sy) * len; C.dEll(ex, ey, 2.7, 0.9, cuff, 0.9); }
    };
  }
  function torso(color, extra) {
    var T = tones(color); return function (C, dy, look) {
      C.rrect(23, 40 + dy, 41, 59 + dy, 3.2, T);
      C.dLine(27, 53 + dy, 30, 57 + dy, 0.28, T[1], 0.7); C.dLine(37.6, 52 + dy, 35.4, 57 + dy, 0.28, T[1], 0.7); C.dLine(31, 48 + dy, 31.6, 51 + dy, 0.24, T[1], 0.6);
      C.dEll(32, 40.9 + dy, 3.6, 1.2, T[1], 0.9);                                             // cuello
      if (extra) extra(C, dy, T);
    };
  }
  CATALOGO.ropa.camiseta = { torso: torso('#e0523f'), manga: sleeve('#e0523f', 0.55) };
  CATALOGO.ropa.sudadera = { torso: torso('#8c909c', function (C, dy, T) { C.rrect(26, 52 + dy, 38, 58 + dy, 1.2, tones('#7a7e8b')); C.dLine(30, 44 + dy, 30, 47.4 + dy, 0.4, WHITE); C.dLine(34, 44 + dy, 34, 47.4 + dy, 0.4, WHITE); C.rect(23.4, 57.4 + dy, 40.6, 58.8 + dy, tones('#767a88'), { flat: 1 }); }), manga: sleeve('#8c909c', 1.2, [118, 122, 136]) };
  CATALOGO.ropa.chef = { torso: torso('#f8f6ef', function (C, dy, T) { C.dLine(32, 42 + dy, 32, 58 + dy, 0.3, T[1], 0.8); [[28.4, 45], [28.4, 49.4], [28.4, 53.8], [35.6, 45], [35.6, 49.4], [35.6, 53.8]].forEach(function (p) { C.dEll(p[0], p[1] + dy, 0.75, 0.75, hex('#2b3a55')); }); C.dPoly([[29, 40 + dy], [32, 43.6 + dy], [35, 40 + dy]], [214, 205, 184]); }), manga: sleeve('#f8f6ef', 1.2, [226, 219, 200]) };
  CATALOGO.ropa.happi = { torso: torso('#2f4f8f', function (C, dy) { C.dLine(28.2, 41 + dy, 31.8, 48.2 + dy, 1.0, [251, 247, 238]); C.dLine(35.8, 41 + dy, 32.2, 48.2 + dy, 1.0, [251, 247, 238]); C.dLine(23.6, 57.2 + dy, 40.4, 57.2 + dy, 1.0, [251, 247, 238]); C.dEll(28, 52 + dy, 1.6, 1.6, [251, 247, 238], 0.95); }), manga: sleeve('#2f4f8f', 1.2, [251, 247, 238]) };
  CATALOGO.ropa.yukata = { torso: torso('#ee9ab4', function (C, dy) { C.rect(23, 50 + dy, 41, 55.4 + dy, tones('#5a45a0')); C.dLine(26, 52.6 + dy, 38, 52.6 + dy, 0.3, [120, 100, 190], 0.8); C.dEll(32, 50.4 + dy, 1.4, 0.9, [140, 120, 210]);
      [[27, 43], [36, 45], [26, 47], [38, 47.6], [29, 58], [35, 57.6], [25.6, 55.6]].forEach(function (p) { C.dEll(p[0], p[1] + dy, 0.8, 0.8, [255, 240, 244], 0.95); }); C.dLine(29, 40.6 + dy, 32, 47 + dy, 0.8, [251, 247, 238]); C.dLine(35, 40.6 + dy, 32, 47 + dy, 0.8, [251, 247, 238]); }), manga: sleeve('#ee9ab4', 1.2, [251, 247, 238]) };
  CATALOGO.ropa.gala = { torso: torso('#2a2a38', function (C, dy) { C.dPoly([[28, 40 + dy], [32, 50 + dy], [36, 40 + dy]], [248, 246, 239]); C.dPoly([[30.4, 41.6 + dy], [33.6, 41.6 + dy], [32, 43.2 + dy]], hex('#c62828')); C.dEll(30.2, 42.2 + dy, 1.3, 0.9, hex('#d32f2f')); C.dEll(33.8, 42.2 + dy, 1.3, 0.9, hex('#d32f2f')); C.dEll(32, 52 + dy, 0.7, 0.7, hex('#ffc928')); C.dEll(32, 56 + dy, 0.7, 0.7, hex('#ffc928')); C.dLine(26, 45 + dy, 29, 52 + dy, 0.4, [58, 58, 76]); C.dLine(38, 45 + dy, 35, 52 + dy, 0.4, [58, 58, 76]); }), manga: sleeve('#2a2a38', 1.2, [248, 246, 239]) };

  // ---------- delantales ----------
  function apron(color, trim) {
    var T = tones(color); return function (C, dy) {
      C.rrect(26, 48 + dy, 38, 66 + dy, 1.2, T); C.rect(28, 40 + dy, 29.2, 49 + dy, T, { flat: 1 }); C.rect(34.8, 40 + dy, 36, 49 + dy, T, { flat: 1 });
      C.rrect(28.4, 56 + dy, 35.6, 62 + dy, 0.8, tones(mix(T[2], OUT, 0.22), { s: .2 })); C.dLine(26.6, 49.6 + dy, 37.4, 49.6 + dy, 0.4, T[3], 0.8);
      if (trim) C.dLine(26.4, 48.4 + dy, 37.6, 48.4 + dy, 0.5, trim);
    };
  }
  CATALOGO.delantal.marron = apron('#8a5a30'); CATALOGO.delantal.blanco = apron('#f4efe3'); CATALOGO.delantal.indigo = apron('#2f4f8f'); CATALOGO.delantal.rojo = apron('#c8372d'); CATALOGO.delantal.negro = apron('#2a2a38', hex('#ffc928'));

  // ---------- cara ----------
  CATALOGO.cara.gafas = function (C, dy) {
    var g = hex('#2b1810'), ey = 29 + dy;
    [26, 38].forEach(function (cx) { C.dEll(cx, ey, 4.5, 4.1, g); C.dEll(cx, ey, 3.7, 3.4, [196, 226, 250], 0.32); C.dLine(cx - 2.6, ey - 1.8, cx - 1.2, ey - 2.8, 0.4, [255, 255, 255], 0.7); });
    C.dLine(30.4, ey - 1, 33.6, ey - 1, 0.5, g); C.dLine(21.5, ey - 1, 20, ey - 1.6, 0.45, g); C.dLine(42.5, ey - 1, 44, ey - 1.6, 0.45, g);
    [26, 38].forEach(function (cx) { C.dEll(cx, ey + 0.3, 2.15, 2.85, hex('#2a1a1f')); C.dEll(cx - 0.75, ey - 0.8, 0.8, 0.85, WHITE); });
  };
  CATALOGO.cara.sol = function (C, dy) { var k = tones('#1b1722'); C.rrect(21, 26 + dy, 31, 33.4 + dy, 2.4, k, { gloss: 1 }); C.rrect(33, 26 + dy, 43, 33.4 + dy, 2.4, k, { gloss: 1 }); C.rect(30.6, 27 + dy, 33.4, 28.6 + dy, k, { flat: 1 }); C.dLine(23, 27.6 + dy, 27, 27.6 + dy, 0.5, [140, 120, 190], 0.7); C.dLine(35, 27.6 + dy, 39, 27.6 + dy, 0.5, [140, 120, 190], 0.7); };
  CATALOGO.cara.bigote = function (C, dy) { var m = tones('#3b2a22'); C.poly([[25.4, 33.4 + dy], [29, 32 + dy], [32, 32.8 + dy], [35, 32 + dy], [38.6, 33.4 + dy], [36.4, 35.6 + dy], [32, 34 + dy], [27.6, 35.6 + dy]], m, { tex: strand(1.2, 0.2) }); };
  CATALOGO.cara.mascarilla = function (C, dy) { var m = tones('#f4f8fb', { l: 0, h: 0 }); C.rrect(21, 32 + dy, 43, 40.4 + dy, 3.2, m); C.dLine(22.6, 35.4 + dy, 41.4, 35.4 + dy, 0.3, [190, 205, 218], 0.9); C.dLine(22.6, 38 + dy, 41.4, 38 + dy, 0.3, [190, 205, 218], 0.9); C.dLine(19, 31 + dy, 22, 33.6 + dy, 0.35, [226, 232, 238], 0.9); C.dLine(45, 31 + dy, 42, 33.6 + dy, 0.35, [226, 232, 238], 0.9); };
  CATALOGO.cara.flor = function (C, dy) { var r = tones('#ef5350'); [0, 72, 144, 216, 288].forEach(function (a) { var t = a * Math.PI / 180; C.ell(44 + Math.sin(t) * 2.2, 17 + dy - Math.cos(t) * 2.2, 1.8, 1.8, r); }); C.ell(44, 17 + dy, 1.4, 1.4, tones('#ffd54f')); };

  // ---------- utensilios ----------
  function rotPts(pts, ox, oy, ang) { var a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return pts.map(function (p) { return [ox + p[0] * c - p[1] * s, oy + p[0] * s + p[1] * c]; }); }
  CATALOGO.utensilio.cuchillo = function (C, x, y, ang) { var h = tones('#a8703c'), m = tones('#cfd5dc', { l: .4, s: .3 });
    C.poly(rotPts([[-1.3, -3], [1.5, -3], [1.5, -13], [-1.3, -10]], x, y, ang), m, { gloss: 1 }); var a = rotPts([[0, 2.6], [0, -3]], x, y, ang); C.cap(a[1][0], a[1][1], a[0][0], a[0][1], 1.6, h);
    var d = rotPts([[-1.1, -5], [-1.1, -9.4]], x, y, ang); C.dLine(d[0][0], d[0][1], d[1][0], d[1][1], 0.3, [250, 252, 255], 0.8); };
  CATALOGO.utensilio.cucharon = function (C, x, y, ang) { var h = tones('#a8703c'), m = tones('#c4cbd2', { l: .4, s: .3 }); var a = rotPts([[0, 3], [0, -10], [0, -13.6]], x, y, ang); C.cap(a[0][0], a[0][1], a[1][0], a[1][1], 1.0, h); C.ell(a[2][0], a[2][1], 3.7, 3.3, m, { gloss: 1 }); C.dEll(a[2][0], a[2][1] + 0.3, 2.6, 2.2, m[1], 0.6); };
  CATALOGO.utensilio.wok = function (C, x, y, ang) { var h = tones('#a8703c'), k = tones('#33333a'); var a = rotPts([[0, 3], [0, -5], [0, -12]], x, y, ang); C.cap(a[0][0], a[0][1], a[1][0], a[1][1], 1.0, h); C.ell(a[2][0], a[2][1], 7.4, 3.9, k, { gloss: 1 }); C.dEll(a[2][0], a[2][1] - 0.5, 5.6, 2.4, k[0], 0.7); };
  CATALOGO.utensilio.palillos = function (C, x, y, ang) { var h = tones('#c58a52'); var a = rotPts([[-0.6, 3], [-0.6, -11]], x, y, ang), b = rotPts([[0.8, 3], [0.8, -11]], x, y, ang); C.cap(a[0][0], a[0][1], a[1][0], a[1][1], 0.75, h, null, 0.45); C.cap(b[0][0], b[0][1], b[1][0], b[1][1], 0.75, h, null, 0.45); };

  // ---------- poses ----------
  var POSES = {
    reposo: function (t) { var b = (Math.sin(t * 2.2) + 1) / 2; return { dy: b * 0.7, armL: { a1: 8 + Math.sin(t * 2.2) * 1.5, a2: 4 }, armR: { a1: 8 - Math.sin(t * 2.2) * 1.5, a2: 4 }, blink: (t % 3.6) > 3.45, mouth: 'smile' }; },
    saludo: function (t) { var w = Math.sin(t * 9) * 16; return { armL: { a1: 8, a2: 4 }, armR: { a1: 150, a2: w }, blink: (t % 3.6) > 3.45, mouth: 'open' }; },
    celebrar: function (t) { var u = Math.abs(Math.sin(t * 5)); return { dy: -u * 3.2, armL: { a1: 150 - u * 20, a2: 0 }, armR: { a1: 150 - u * 20, a2: 0 }, blink: false, mouth: 'open' }; },
    cocinar: function (t) { var s = Math.sin(t * 7) * 7; return { armL: { a1: 30, a2: -100 + s }, armR: { a1: 30, a2: -100 - s }, blink: (t % 3.6) > 3.45, mouth: 'smile', itemRot: 8 + s * 0.8 }; }
  };

  var DEFAULT = { piel: 'clara', color: 'negro', peinado: 'corto', gorro: null, ropa: 'camiseta', delantal: null, cara: null };
  /** Dibuja el chef. Q = subpíxeles por píxel de diseño: devuelve un canvas de (64·Q) × (80·Q). */
  function render(look, pose, Q, shadow) { var C = Canvas(Q || 4); draw(C, Object.assign({}, DEFAULT, look || {}), pose || {}); return C.toCanvas(shadow !== false); }
  /** Cuánto tarda un cuadro a esa resolución (ms). */
  function medir(Q, veces) { veces = veces || 3; var t0 = performance.now(); for (var i = 0; i < veces; i++) render({ peinado: 'largo', gorro: 'toque', ropa: 'chef', delantal: 'indigo', cara: 'gafas' }, POSES.cocinar(i), Q); return (performance.now() - t0) / veces; }
  window.PixelChef = { render: render, medir: medir, CATALOGO: CATALOGO, POSES: POSES, PIEL: PIEL, PELO: PELO, W: W, H: H, DEFAULT: DEFAULT };
})();
