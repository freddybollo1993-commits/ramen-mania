/* Avatar del chef: muñeco 3D de juguete armado por piezas (recortes WebP de Gemini) y dibujado en un canvas con animación.
   · Piezas sueltas en assets/avatar/v1/ (cabeza, brazos, piernas, ropa, mangas, peinados, gorros). Cada pieza ya está a su tamaño final y lleva su posición en MAN
     (x, y de su esquina dentro de un lienzo de 700 px de ancho; OY desplaza el origen para dejar sitio a los gorros altos).
   · El tono de piel y el color del pelo se aplican por código sobre las piezas (la piel por ganancia de canal y el pelo gris por una rampa de color): una sola imagen sirve para todos los tonos.
   · Cada cosmético es una pieza del catálogo con su precio en propinas. Lo comprado y lo equipado se guardan en el aparato (ramen_avatar_v1)
     y viajan con la cuenta dentro del snapshot de taller.js (clave av).
   · Las piezas que aún no tienen arte (happi, yukata, traje de gala, delantales, accesorios de cara) no salen en la tienda hasta que lo tengan.
   Script clásico, sin dependencias. API: Avatar.mount(el, look) · Avatar.thumb(look, opciones) · Avatar.look() · Avatar.items(slot) · Avatar.buy/equip · Avatar.open(). */
(function () {
  'use strict';
  const KEY = 'ramen_avatar_v1', BASE = 'assets/avatar/v1/';
  const $ = id => document.getElementById(id);
  const sfx = n => { try { playSound(n); } catch (e) {} };
  const toast = m => { try { showStationToast(m); } catch (e) {} };
  const wallet = () => { try { return getPropinasWallet(); } catch (e) { return 0; } };
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  // ---------------- piezas: posición (x, y) y tamaño (w, h) en el lienzo de 700 px ----------------
  const MAN = {"head":[174,140,350,361],"headB":[174,140,350,361],"low":[231,755,237,336],"armL":[200,526,108,353],"armR":[391,526,108,353],
    "tor_camiseta":[249,505,200,251],"slL_camiseta":[196,514,80,131],"slR_camiseta":[422,514,80,131],"tor_sudadera":[248,505,203,277],"slL_sudadera":[187,514,99,288],"slR_sudadera":[417,514,90,287],
    "tor_happi":[247,505,204,260],"slL_happi":[179,514,114,226],"slR_happi":[405,514,113,226],"tor_yukata":[247,505,204,270],"slL_yukata":[170,514,132,264],"slR_yukata":[396,514,132,263],"tor_gala":[247,505,204,251],"slL_gala":[183,514,107,233],"slR_gala":[409,514,107,233],
    "tor_chef":[247,505,204,252],"slL_chef":[182,514,108,251],"slR_chef":[408,514,108,250],
    "pelo_corto":[160,126,371,280],"pelo_erizado":[159,118,379,314],"pelo_rapado":[159,132,379,367],"pelo_melena_f":[154,106,391,484],"pelo_melena_b":[164,140,369,470],"pelo_mono":[170,88,354,387],"pelo_coleta_b":[360,90,207,362],
    "gorro_hachimaki":[171,107,333,312],"gorro_tenugui":[171,52,332,273],"gorro_orejas":[196,49,306,263],"gorro_toque":[176,-95,346,327],"gorro_kasa":[172,24,354,228],"gorro_corona":[192,30,315,205]};
  const OY = 110, CW = 700, CH = 1220;                       // origen vertical y tamaño del lienzo
  const CROPS = { head: [150, 170, 400, 460], hat: [130, 5, 440, 625], torso: [120, 170, 460, 780] };   // recortes para miniaturas (x, y, w, h) en coordenadas del lienzo

  // ---------------- catálogo ----------------
  const SLOTS = [
    { id: 'peinado', name: 'Peinado', ic: '💇' }, { id: 'color', name: 'Color de pelo', ic: '🎨' }, { id: 'gorro', name: 'Gorro', ic: '🎓' },
    { id: 'ropa', name: 'Ropa', ic: '👕' }, { id: 'delantal', name: 'Delantal', ic: '🧑‍🍳' }, { id: 'cara', name: 'Cara', ic: '👓' }, { id: 'piel', name: 'Piel', ic: '🖐️' }
  ];
  // tonos de piel: color medio objetivo (la pieza base es el tono claro)
  const PIEL = [['p1', 'Clara', null], ['p2', 'Trigo', [232, 178, 134]], ['p3', 'Miel', [212, 150, 104]], ['p4', 'Canela', [184, 120, 78]], ['p5', 'Cacao', [142, 88, 56]], ['p6', 'Ébano', [98, 60, 40]]]
    .map(([k, name, rgb]) => ({ id: 'piel_' + k, name, price: 0, rgb, art: true }));
  const COLOR = [['negro', 'Negro', '#2e2636', '#6a5f78', 0], ['castano', 'Castaño', '#6b4128', '#b07a52', 0], ['rubio', 'Rubio', '#e3b448', '#fbe7a0', 30], ['rojo', 'Pelirrojo', '#c4492a', '#f09670', 30],
    ['canoso', 'Canoso', '#d6d6e2', '#ffffff', 40], ['azul', 'Azul', '#3f7fe0', '#a6caff', 60], ['rosa', 'Rosa', '#ee6fa6', '#ffc0dc', 60], ['menta', 'Menta', '#4fcfa0', '#b6f5dc', 60], ['violeta', 'Violeta', '#8c58d8', '#d4b8ff', 60]]
    .map(([k, name, c, h, price]) => ({ id: 'color_' + k, name, price, c, h, art: true }));
  const PEINADO = [
    { id: 'peinado_corto', name: 'Corto', price: 0, front: 'pelo_corto' },
    { id: 'peinado_erizado', name: 'Erizado', price: 25, front: 'pelo_erizado' },
    { id: 'peinado_mono', name: 'Moño', price: 35, front: 'pelo_mono' },
    { id: 'peinado_coleta', name: 'Coleta', price: 35, front: 'pelo_corto', back: 'pelo_coleta_b', sway: true },
    { id: 'peinado_largo', name: 'Melena', price: 50, front: 'pelo_melena_f', back: 'pelo_melena_b' },
    { id: 'peinado_rapado', name: 'Casi rapado', price: 15, front: 'pelo_rapado' }
  ].map(p => Object.assign(p, { art: true, tint: true }));
  const GORRO = [{ id: 'gorro_ninguno', name: 'Sin gorro', price: 0, art: true },
    { id: 'gorro_hachimaki', name: 'Hachimaki', price: 25, piece: 'gorro_hachimaki' }, { id: 'gorro_tenugui', name: 'Pañuelo tenugui', price: 35, piece: 'gorro_tenugui' },
    { id: 'gorro_orejas', name: 'Orejas de gato', price: 55, piece: 'gorro_orejas' }, { id: 'gorro_toque', name: 'Gorro de chef', price: 80, piece: 'gorro_toque' },
    { id: 'gorro_kasa', name: 'Sombrero kasa', price: 120, piece: 'gorro_kasa' }, { id: 'gorro_corona', name: 'Corona dorada', price: 400, piece: 'gorro_corona' }].map(g => Object.assign(g, { art: true }));
  const ROPA = [{ id: 'ropa_camiseta', name: 'Camiseta roja', price: 0, set: 'camiseta' }, { id: 'ropa_sudadera', name: 'Sudadera gris', price: 40, set: 'sudadera' }, { id: 'ropa_chef', name: 'Chaqueta de chef', price: 60, set: 'chef' },
    { id: 'ropa_happi', name: 'Happi de festival', price: 90, set: 'happi' }, { id: 'ropa_yukata', name: 'Yukata de sakura', price: 140, set: 'yukata' }, { id: 'ropa_gala', name: 'Traje de gala', price: 260, set: 'gala' }].map(r => Object.assign(r, { art: !!r.set }));
  const DELANTAL = [{ id: 'delantal_ninguno', name: 'Sin delantal', price: 0, art: true }, { id: 'delantal_marron', name: 'Marrón de cocina', price: 25 }, { id: 'delantal_blanco', name: 'Blanco', price: 25 },
    { id: 'delantal_indigo', name: 'Índigo', price: 45 }, { id: 'delantal_rojo', name: 'Rojo ramen', price: 45 }, { id: 'delantal_negro', name: 'Negro y oro', price: 120 }].map(d => Object.assign(d, { art: d.id === 'delantal_ninguno' }));
  const CARA = [{ id: 'cara_ninguna', name: 'Sin accesorio', price: 0, art: true }, { id: 'cara_gafas', name: 'Gafas redondas', price: 45 }, { id: 'cara_sol', name: 'Gafas de sol', price: 70 },
    { id: 'cara_bigote', name: 'Bigote', price: 50 }, { id: 'cara_mascarilla', name: 'Mascarilla', price: 35 }, { id: 'cara_flor', name: 'Flor de hibisco', price: 40 }].map(c => Object.assign(c, { art: c.id === 'cara_ninguna' }));
  const CATALOGO = { piel: PIEL, color: COLOR, peinado: PEINADO, gorro: GORRO, ropa: ROPA, delantal: DELANTAL, cara: CARA };
  const BY_ID = {}; Object.keys(CATALOGO).forEach(s => CATALOGO[s].forEach(it => { it.slot = s; BY_ID[it.id] = it; }));
  const DEFAULT = { piel: 'piel_p1', color: 'color_negro', peinado: 'peinado_corto', gorro: 'gorro_ninguno', ropa: 'ropa_camiseta', delantal: 'delantal_ninguno', cara: 'cara_ninguna' };

  // ---------------- estado ----------------
  let S = null;
  const fresh = () => ({ v: 1, own: {}, eq: Object.assign({}, DEFAULT) });
  function load() { if (S) return S; try { S = JSON.parse(store.get(KEY) || 'null'); } catch (e) { S = null; } if (!S || S.v !== 1) S = fresh(); S.own = S.own || {}; S.eq = Object.assign({}, DEFAULT, S.eq || {}); return S; }
  const persist = () => store.set(KEY, JSON.stringify(S));
  function save() { persist(); try { if (typeof japonSyncSoon === 'function') japonSyncSoon(); } catch (e) {} }
  const owned = id => { const it = BY_ID[id]; return !!it && (it.price === 0 || !!load().own[id]); };
  /** Lo equipado, como {slot: idPieza}; una pieza sin arte o que ya no es tuya se cambia por la de siempre. */
  const look = () => { load(); const o = {}; SLOTS.forEach(s => { const id = S.eq[s.id], it = BY_ID[id]; o[s.id] = it && it.art && owned(id) ? id : DEFAULT[s.id]; }); return o; };
  function spent() { load(); let t = 0; Object.keys(S.own).forEach(id => { const it = BY_ID[id]; if (it) t += it.price; }); return t; }

  // ---------------- imágenes ----------------
  const IMG = {}, WAIT = [];
  function img(key) {
    let e = IMG[key]; if (e) return e;
    const el = new Image(); e = IMG[key] = { el, ok: false, bad: false };
    el.onload = () => { e.ok = true; flush(); }; el.onerror = () => { e.bad = true; };
    el.src = BASE + key + '.webp'; return e;
  }
  function flush() { for (let i = WAIT.length - 1; i >= 0; i--) { try { if (WAIT[i].keys.every(k => IMG[k].ok || IMG[k].bad)) { const f = WAIT.splice(i, 1)[0]; f.fn(); } } catch (e) { WAIT.splice(i, 1); } } }
  /** Llama a fn cuando todas las piezas pedidas están cargadas (o fallaron). */
  function whenReady(keys, fn) { keys.forEach(img); if (keys.every(k => IMG[k].ok || IMG[k].bad)) fn(); else WAIT.push({ keys, fn }); }

  // piezas que usa un aspecto
  function partsOf(lk) {
    const h = BY_ID[lk.peinado] || PEINADO[0], r = BY_ID[lk.ropa] || ROPA[0], g = BY_ID[lk.gorro] || GORRO[0];
    return { hairFront: h.front, hairBack: h.back || null, sway: !!h.sway, tor: 'tor_' + r.set, slL: 'slL_' + r.set, slR: 'slR_' + r.set, hat: g.piece || null };
  }
  function keysOf(lk) { const p = partsOf(lk); return ['head', 'headB', 'armL', 'armR', 'low', p.hairFront, p.hairBack, p.tor, p.slL, p.slR, p.hat].filter(Boolean); }

  // ---------------- color: piel y pelo ----------------
  const CACHE = {};
  function pixels(el, fn) { const c = document.createElement('canvas'); c.width = el.naturalWidth || el.width; c.height = el.naturalHeight || el.height; const x = c.getContext('2d'); x.drawImage(el, 0, 0); const d = x.getImageData(0, 0, c.width, c.height); fn(d.data); x.putImageData(d, 0, 0); return c; }
  const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, mx ? d / mx : 0, mx / 255]; };
  const skinW = (r, g, b) => { const [h, s] = hsv(r, g, b); const hw = h < 3 ? 0 : h < 8 ? (h - 3) / 5 : h <= 40 ? 1 : h < 46 ? (46 - h) / 6 : 0; const sw = s < 0.15 ? 0 : s < 0.22 ? (s - 0.15) / 0.07 : 1; return hw * sw; };
  let BASESKIN = null;
  function baseSkin() {
    if (BASESKIN) return BASESKIN; const e = IMG.head; if (!e || !e.ok) return [236, 186, 150];
    let r = 0, g = 0, b = 0, n = 0; pixels(e.el, a => { for (let i = 0; i < a.length; i += 40) { if (a[i + 3] > 250 && skinW(a[i], a[i + 1], a[i + 2]) > 0.99) { r += a[i]; g += a[i + 1]; b += a[i + 2]; n++; } } });
    BASESKIN = n ? [r / n, g / n, b / n] : [236, 186, 150]; return BASESKIN;
  }
  function skinned(key, tone) {
    const it = BY_ID[tone]; if (!it || !it.rgb) return IMG[key].el; const ck = key + '|' + tone; if (CACHE[ck]) return CACHE[ck];
    const b = baseSkin(), gain = it.rgb.map((v, i) => v / b[i]);
    return (CACHE[ck] = pixels(IMG[key].el, a => { for (let i = 0; i < a.length; i += 4) { const w = a[i + 3] ? skinW(a[i], a[i + 1], a[i + 2]) : 0; if (w) { a[i] = Math.min(255, a[i] * (1 + (gain[0] - 1) * w)); a[i + 1] = Math.min(255, a[i + 1] * (1 + (gain[1] - 1) * w)); a[i + 2] = Math.min(255, a[i + 2] * (1 + (gain[2] - 1) * w)); } } }));
  }
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function tinted(key, colorId) {
    const it = BY_ID[colorId]; if (!it) return IMG[key].el; const ck = key + '|' + colorId; if (CACHE[ck]) return CACHE[ck];
    const c = hex(it.c), h = hex(it.h), dk = c.map(v => v * 0.5), mix = (A, B, t) => A.map((v, i) => v + (B[i] - v) * t);
    return (CACHE[ck] = pixels(IMG[key].el, a => { for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const r = a[i], g = a[i + 1], b = a[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx && (mx - mn) / mx > 0.22) continue;     // lo coloreado (la liga roja) no se tiñe
      const L = (r + g + b) / 765; let o; if (L < 0.8) o = mix(dk, c, Math.max(0, (L - 0.25) / 0.55)); else o = mix(c, h, Math.min(1, (L - 0.8) / 0.18)); a[i] = o[0]; a[i + 1] = o[1]; a[i + 2] = o[2]; } }));
  }

  // ---------------- dibujo ----------------
  function draw(ctx, k, lk, t, st) {
    const P = partsOf(lk), tone = lk.piel, col = lk.color, bob = Math.sin(t * 1.85), blink = (t % 4.6) > 4.46 || (st && st.blink > 0);
    const rect = key => MAN[key], D = (src, key, dx, dy) => { const m = rect(key); ctx.drawImage(src, m[0] + (dx || 0), m[1] + OY + (dy || 0), m[2], m[3]); };
    ctx.save(); ctx.scale(k, k);
    // sombra del suelo
    ctx.save(); ctx.translate(349, MAN.low[1] + MAN.low[3] + OY - 6); ctx.scale(1 - bob * 0.03, 1); ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(0, 0, 150, 17, 0, 0, 7); ctx.fill(); ctx.restore();
    ctx.translate(0, bob * -2.5);
    if (P.hairBack) { const s = P.sway ? Math.sin(t * 1.85 + 1) * 0.045 : 0; ctx.save(); const m = rect(P.hairBack); ctx.translate(m[0] + 20, m[1] + OY + 50); ctx.rotate(s); ctx.translate(-(m[0] + 20), -(m[1] + OY + 50)); D(tinted(P.hairBack, col), P.hairBack); ctx.restore(); }
    D(IMG.low.el, 'low');
    const wv = st && st.wave > 0 ? (st.wave) : 0;                          // 0..1: saludo con el brazo derecho
    const ang = wv ? -(wv < 0.2 ? wv / 0.2 : wv < 0.8 ? 1 + 0.07 * Math.sin((wv - 0.2) * 6 * Math.PI) : (1 - wv) / 0.2) * 2.55 : Math.sin(t * 1.85 + 2) * -0.025;
    const arm = (key, sl, px, py, a) => { ctx.save(); ctx.translate(px, py + OY); ctx.rotate(a); ctx.translate(-px, -(py + OY)); D(skinned(key, tone), key); if (sl) D(IMG[sl].el, sl); ctx.restore(); };
    arm('armL', null, 288, 556, Math.sin(t * 1.85 + 1) * 0.025);
    arm('armR', null, 411, 556, ang);
    ctx.save(); ctx.translate(349, MAN.low[1] + OY); ctx.scale(1, 1 + bob * 0.006); ctx.translate(-349, -(MAN.low[1] + OY)); D(IMG[P.tor].el, P.tor); ctx.restore();
    // mangas: acompañan al brazo
    const sleeve = (sl, px, py, a) => { ctx.save(); ctx.translate(px, py + OY); ctx.rotate(a); ctx.translate(-px, -(py + OY)); D(IMG[sl].el, sl); ctx.restore(); };
    sleeve(P.slL, 288, 556, Math.sin(t * 1.85 + 1) * 0.025); sleeve(P.slR, 411, 556, ang);
    // cabeza con pelo y gorro
    ctx.save(); ctx.translate(349, 500 + OY); ctx.rotate(Math.sin(t * 1.85 + 0.6) * 0.014); ctx.translate(-349, -(500 + OY));
    D(skinned(blink ? 'headB' : 'head', tone), blink ? 'headB' : 'head'); D(tinted(P.hairFront, col), P.hairFront);
    if (P.hat) D(IMG[P.hat].el, P.hat);
    ctx.restore(); ctx.restore();
  }

  // ---------------- montaje animado ----------------
  const MOUNTS = new Set(); let raf = 0, last = 0;
  function frame(now) {
    raf = 0; if (!MOUNTS.size || document.hidden) return;
    if (now - last >= 30) {
      last = now;
      MOUNTS.forEach(m => {
        if (!m.el.isConnected) { MOUNTS.delete(m); return; }
        try { paint(m, now / 1000); } catch (e) { console.error('[Avatar] dibujo', e && e.message); }
      });
    }
    if (MOUNTS.size) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && MOUNTS.size && !document.hidden) raf = requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', kick);
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  function paint(m, ts) {
    const r = m.el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr), c = m.cv;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
    const cr = CROPS.head, bw = m.bust ? cr[2] : CW, bh = m.bust ? cr[3] : CH, k = Math.min(w / bw, h / bh);
    x.save(); x.translate((w - bw * k) / 2, m.bust ? (h - bh * k) / 2 : h - bh * k); if (m.bust) x.translate(-cr[0] * k, -cr[1] * k);
    const st = m.st;
    if (st.waveStart != null) { const p = (ts - st.waveStart) / 1.3; st.wave = p >= 1 ? 0 : p; if (p >= 1) st.waveStart = null; }
    draw(x, k, m.look, ts - m.t0, st); x.restore();
  }
  /** Monta el muñeco animado dentro de el. lk = aspecto (lo que falte se toma de lo equipado). o.bust: solo el busto; o.still: sin animación. Devuelve {set(look), wave(), stop()}. */
  function mount(el, lk, o) {
    o = o || {}; const L = Object.assign({}, look(), lk || {}); el.innerHTML = '';
    const cv = document.createElement('canvas'); cv.style.cssText = 'display:block;width:100%;height:100%'; el.appendChild(cv);
    const m = { el, cv, look: L, bust: !!o.bust, st: { wave: 0, waveStart: null, blink: 0 }, t0: performance.now() / 1000, still: !!o.still || reduce() };
    const go = () => { if (!el.isConnected) return; if (m.still) { paint(m, m.t0 + 0.3); } else { MOUNTS.add(m); kick(); paint(m, performance.now() / 1000); } };
    whenReady(keysOf(L), go);
    return {
      set(next) { m.look = Object.assign({}, look(), next || {}); whenReady(keysOf(m.look), () => { if (m.still) paint(m, performance.now() / 1000); }); },
      wave() { m.st.waveStart = performance.now() / 1000; m.st.blink = 0; if (m.still) return; kick(); },
      stop() { MOUNTS.delete(m); }
    };
  }
  const THUMBS = {};
  /** Imagen (dataURL) del aspecto para tarjetas pequeñas; '' mientras las piezas aún se cargan (onLoad avisa cuando ya se puede). */
  function thumb(lk, o) {
    o = o || {}; const L = Object.assign({}, look(), lk || {}), keys = keysOf(L), w = o.w || 120, cr = CROPS[o.crop] || CROPS.head, sig = JSON.stringify(L) + '|' + w + '|' + (o.crop || 'head');
    if (THUMBS[sig]) return THUMBS[sig];
    if (!keys.every(k => IMG[k] && IMG[k].ok)) { keys.forEach(img); return ''; }
    const k = w / cr[2], c = document.createElement('canvas'); c.width = w; c.height = Math.round(cr[3] * k);
    const x = c.getContext('2d'); x.save(); x.translate(-cr[0] * k, -cr[1] * k); draw(x, k, L, 0.3, null); x.restore();
    return (THUMBS[sig] = c.toDataURL('image/png'));
  }
  const loadCbs = [];
  /** Carga todas las piezas y avisa a quien lo pidió solo si tuvo que esperar; devuelve false si ya estaban cargadas. */
  function preloadAll(cb) {
    const keys = Object.keys(MAN); if (keys.every(k => IMG[k] && (IMG[k].ok || IMG[k].bad))) return false;      // ya está todo: no hay nada que avisar (evita repintar en bucle)
    if (cb) loadCbs.push(cb); whenReady(keys, () => { loadCbs.splice(0).forEach(f => { try { f(); } catch (e) {} }); }); return true;
  }

  // ---------------- compras ----------------
  function refresh() { try { if (window.Home) Home.refresh(); } catch (e) {} try { if (window.Taller) Taller.refresh(); } catch (e) {} }
  function buy(id) {
    const it = BY_ID[id]; if (!it || !it.art || owned(id)) return false;
    if (wallet() < it.price) { toast('🧧 Te faltan ' + (it.price - wallet()) + ' propinas para ' + it.name + '.'); sfx('error'); return false; }
    load(); S.own[id] = 1; S.eq[it.slot] = id; try { updatePropinasHUD(); } catch (e) {} sfx('serve'); save(); toast('✨ ' + it.name + ' · ¡te queda genial!'); refresh(); return true;
  }
  function equip(id) {
    const it = BY_ID[id]; if (!it || !it.art || !owned(id)) return false;
    load(); S.eq[it.slot] = id; sfx('click'); save(); refresh(); return true;
  }

  // ---------------- nube (viaja dentro del snapshot de taller.js) ----------------
  const snap = () => { load(); return { v: 1, own: S.own, eq: S.eq }; };
  function mergeSnap(a, b) {
    if (!a || a.v !== 1) return b && b.v === 1 ? b : (a || null); if (!b || b.v !== 1) return a;
    const own = Object.assign({}, a.own || {}, b.own || {}); Object.keys(own).forEach(id => { if (!BY_ID[id]) delete own[id]; });
    return { v: 1, own, eq: Object.assign({}, a.eq || {}, b.eq || {}) };
  }
  function apply(sn) { if (!sn || sn.v !== 1) return; load(); const m = mergeSnap(snap(), sn); if (!m) return; S = { v: 1, own: m.own, eq: Object.assign({}, DEFAULT, m.eq) }; persist(); }
  const reset = () => { S = null; try { localStorage.removeItem(KEY); } catch (e) {} };

  window.Avatar = {
    mount, thumb, look, spent, snap, mergeSnap, apply, reset, buy, equip, owned, preloadAll,
    /** Categorías con al menos dos piezas disponibles. */
    slots: () => SLOTS.filter(s => CATALOGO[s.id].filter(i => i.art).length > 1),
    items: slot => (CATALOGO[slot] || []).filter(i => i.art), item: id => BY_ID[id] || null,
    keys: () => Object.keys(MAN),
    open() { if (window.Taller) Taller.open('apariencia'); }
  };
  // arranque: precarga lo equipado para que el menú lo dibuje enseguida
  try { whenReady(keysOf(look()), () => {}); } catch (e) {}
})();
