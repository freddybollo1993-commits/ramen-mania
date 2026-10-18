/* Corta una hoja de piezas de Gemini (fondo magenta) en recortes con transparencia.
   Uso en la consola de la página (servida por localhost):
     await (await fetch('/tools/cortar-partes.js')).text().then(t => (0, eval)(t));
     const hoja = await CortarPartes.hoja('/assets/gen/avatar/partes_cuerpo_p1.jpg', { cols: 3, filas: 2, escala: 0.5 });
     hoja.piezas  → [{ i, canvas, x, y, w, h }]  (x, y, w, h = caja en la hoja original, en px)
   Cada celda de la cuadrícula se recorta a la caja de lo que contiene (se ignoran los puntos sueltos). */
(function () {
  'use strict';
  function quitarMagenta(c) {
    const x = c.getContext('2d'), W = c.width, H = c.height, d = x.getImageData(0, 0, W, H), a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      const r = a[i], g = a[i + 1], b = a[i + 2], m = Math.min(r, b) - g;
      let al = 255;
      if (m > 110) al = 0;
      else if (m > 40) { al = Math.round(255 * (110 - m) / 70); const k = (m - 40) / 70; a[i] = Math.max(0, r - (r - g) * k * 0.6) | 0; a[i + 2] = Math.max(0, b - (b - g) * k * 0.6) | 0; }
      a[i + 3] = al;
    }
    x.putImageData(d, 0, 0);
  }
  function caja(c, x0, y0, x1, y1) {
    const x = c.getContext('2d'), w = x1 - x0, h = y1 - y0, a = x.getImageData(x0, y0, w, h).data;
    const col = new Uint32Array(w), fil = new Uint32Array(h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (a[(j * w + i) * 4 + 3] > 40) { col[i]++; fil[j]++; }
    const first = (arr, n) => { for (let k = 0; k < arr.length; k++) if (arr[k] > n) return k; return 0; };
    const last = (arr, n) => { for (let k = arr.length - 1; k >= 0; k--) if (arr[k] > n) return k; return arr.length - 1; };
    const L = first(col, 2), R = last(col, 2), T = first(fil, 2), B = last(fil, 2);
    return { x: x0 + L, y: y0 + T, w: R - L + 1, h: B - T + 1 };
  }
  async function hoja(url, o) {
    o = Object.assign({ cols: 3, filas: 2, escala: 1 }, o || {});
    const img = new Image(); img.src = url; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight, full = document.createElement('canvas'); full.width = W; full.height = H;
    full.getContext('2d').drawImage(img, 0, 0); quitarMagenta(full);
    const piezas = [], cw = W / o.cols, ch = H / o.filas;
    for (let f = 0; f < o.filas; f++) for (let c = 0; c < o.cols; c++) {
      const b = caja(full, Math.round(c * cw), Math.round(f * ch), Math.round((c + 1) * cw), Math.round((f + 1) * ch));
      const out = document.createElement('canvas'); out.width = Math.round(b.w * o.escala); out.height = Math.round(b.h * o.escala);
      const x = out.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(full, b.x, b.y, b.w, b.h, 0, 0, out.width, out.height);
      piezas.push({ i: f * o.cols + c, canvas: out, x: b.x, y: b.y, w: b.w, h: b.h, vacia: b.w <= 1 && b.h <= 1 });
    }
    return { W, H, piezas, full };
  }
  /** Como hoja(), pero con rectángulos a mano: rects = [[x0, y0, x1, y1], ...] en px de una imagen de ancho `ref` (p. ej. 2000). */
  async function rects(url, rs, o) {
    o = Object.assign({ escala: 1, ref: 2000 }, o || {});
    const img = new Image(); img.src = url; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight, k = W / o.ref, full = document.createElement('canvas'); full.width = W; full.height = H;
    full.getContext('2d').drawImage(img, 0, 0); quitarMagenta(full);
    const piezas = rs.map((r, i) => {
      const x0 = Math.max(0, Math.round(r[0] * k)), y0 = Math.max(0, Math.round(r[1] * k)), x1 = Math.min(W, Math.round(r[2] * k)), y1 = Math.min(H, Math.round(r[3] * k));
      const b = caja(full, x0, y0, x1, y1), out = document.createElement('canvas'); out.width = Math.max(1, Math.round(b.w * o.escala)); out.height = Math.max(1, Math.round(b.h * o.escala));
      const x = out.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(full, b.x, b.y, b.w, b.h, 0, 0, out.width, out.height);
      return { i, canvas: out, x: b.x, y: b.y, w: b.w, h: b.h };
    });
    return { W, H, piezas, full };
  }
  /** Quita (deja transparente) el interior hueco de una pieza (el revés de una peluca, el hueco de una manga): crece desde las semillas por color parecido al vecino.
      semillas = [[fx, fy], ...] como fracciones de la pieza; paso = salto de brillo máximo entre vecinos; tope = brillo medio máximo del interior; ymin = fracción de altura por encima de la cual no se vacía nada. */
  function vaciar(c, semillas, paso, tope, borde, ymin) {
    ymin = ymin || 0; paso = paso || 7; tope = tope || 175; borde = borde == null ? 2 : borde;
    const x = c.getContext('2d'), W = c.width, H = c.height, d = x.getImageData(0, 0, W, H), a = d.data, vis = new Uint8Array(W * H), cola = [];
    const lum = i => (a[i * 4] + a[i * 4 + 1] + a[i * 4 + 2]) / 3;
    semillas.forEach(s => { const sx = Math.min(W - 1, Math.round(s[0] * W)), sy = Math.min(H - 1, Math.round(s[1] * H)), i = sy * W + sx; if (a[i * 4 + 3] > 200 && !vis[i]) { vis[i] = 1; cola.push(i); } });
    for (let q = 0; q < cola.length; q++) {
      const i = cola[q], px = i % W, py = (i / W) | 0, l0 = lum(i);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) return; const j = ny * W + nx;
        if (vis[j] || a[j * 4 + 3] < 200 || ny < ymin * H) return; const l1 = lum(j);
        if (Math.abs(l1 - l0) <= paso && l1 < tope) { vis[j] = 1; cola.push(j); }
      });
    }
    // ensancha un poco la zona para comerse el borde oscuro y suaviza el corte
    let m = vis;
    for (let k = 0; k < borde; k++) { const n = new Uint8Array(m); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (m[j * W + i]) { [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = i + dx, ny = j + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) n[ny * W + nx] = 1; }); } m = n; }
    for (let i = 0; i < W * H; i++) if (m[i]) a[i * 4 + 3] = 0;
    x.putImageData(d, 0, 0); return cola.length;
  }
  window.CortarPartes = { hoja, rects, vaciar, quitarMagenta };
})();
