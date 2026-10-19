/* Módulo 11-emplatado-platos-salteado — Pantallas de Producción/Emplatar y dibujo de platos de salteado.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

function stRenderProd(area, panel) {
  if (stIsShop(area)) { stRenderShop(area, panel); return; }
  const st = stGet(area), pr = st.prep;
  const cards = stProdOrdered(area).map(p => {
    const n = st.stock[p.key], busy = pr && pr.key === p.key, low = n <= Math.ceil(p.max * 0.25);
    const many = ST_PROD[area].length > 6;
    const label = busy ? `⏳ <b data-fp-left>${pr.left}</b> s` : (many ? `+${p.batch} · ${stProdTime(p)} s` : `Preparar +${p.batch} · ${stProdTime(p)} s`);
    return `<div class="fp-card ${low ? 'is-low' : ''} ${busy ? 'is-busy' : ''}">
      <div class="fp-card-ico">${stIngIconRaw(p.icon)}</div>
      <div class="fp-card-name">${p.label}</div>
      <div class="fp-bar"><i style="width:${Math.round(100 * n / p.max)}%"></i></div>
      <div class="fp-card-n">${n}/${p.max}${stHasRaw(p.icon) ? ` <span class="fp-arrow">→${stIngIcon(p.icon)}</span>` : ''} <small>${p.use === 'cook' ? 'para cocinar' : 'para emplatar'}</small></div>
      <div class="fp-bar fp-prep" style="display:${busy ? 'block' : 'none'}"><i data-fp-prep style="width:${busy ? Math.round(100 * (1 - pr.left / pr.total)) : 0}%"></i></div>
      <button class="fp-btn" ${pr || n >= p.max ? 'disabled' : ''} onclick="stProdStart('${area}','${p.key}')">${n >= p.max ? 'Lleno' : label}</button>
    </div>`;
  }).join('');
  const cur = pr ? ST_PROD[area].find(x => x.key === pr.key) : null;
  panel.innerHTML = `<div class="fp-wrap">
    <div class="fp-head"><span>🥬 Producción · ${AREA_LABELS[area]}</span><small>${cur ? `Preparando ${cur.label}…` : 'Una tarea a la vez; sigue corriendo mientras cocinas.'}</small>${stBackBtn(area)}</div>
    <div class="fp-cards ${ST_PROD[area].length > 6 ? 'many' : ''}" style="--cols:${Math.max(6, Math.ceil(ST_PROD[area].length / 2))}">${cards}</div></div>`;
}

function stPassIcon(item) {
  const v = item.vis || {}, id = v.id != null ? v.id : 1;   // el cuenco usa el icono del fideo
  return `<span class="fp-pass-ico" style="filter:${(v.kind === 'ing' && v.tone) || 'none'}">${stIngIcon(id)}</span>`;
}
// Plato del Batayaki Ramen: franja de fideos de punta a punta en el centro; arriba el lomo con champiñones y holantao; abajo el poro frito bañado en salsa ponzu
function batayakiPlateSvg(plateItems) {
  const poro = plateItems.includes(71), ponzu = plateItems.includes(98), ink = '#3a2b20';
  let noodles = '';
  for (let k = 0; k < 7; k++) { const y = 33 + k * 2.6; noodles += `<path d="M 7,${y} q 8,-3 16,0 t 16,0 t 16,0 t 16,0 t 16,0 t 16,0" fill="none" stroke="${k % 2 ? '#f3d27a' : '#e9bf55'}" stroke-width="2.2" stroke-linecap="round"/>`; }
  const lomo = [[26, 18], [44, 15], [62, 18]].map(([x, y], k) => `<g transform="rotate(${k * 9 - 9} ${x} ${y})"><rect x="${x - 8}" y="${y - 4.5}" width="16" height="9" rx="3.5" fill="#8c3b2c" stroke="${ink}" stroke-width="1"/><path d="M ${x - 5},${y - 1} h 10" stroke="#d98a73" stroke-width="1.2" opacity="0.8"/></g>`).join('');
  const champi = [[80, 17], [92, 20]].map(([x, y]) => `<g><path d="M ${x - 6},${y} a 6,5 0 0 1 12,0 z" fill="#c9a77a" stroke="${ink}" stroke-width="1"/><rect x="${x - 2}" y="${y}" width="4" height="4.5" rx="1" fill="#efe3cd" stroke="${ink}" stroke-width="0.8"/></g>`).join('');
  const holantao = [[38, 25], [58, 26], [74, 24]].map(([x, y], k) => `<g transform="rotate(${k * 20 - 25} ${x} ${y})"><rect x="${x - 7}" y="${y - 2}" width="14" height="4" rx="2" fill="#5fae4a" stroke="${ink}" stroke-width="0.9"/><circle cx="${x - 3}" cy="${y}" r="0.8" fill="#2e6b25"/><circle cx="${x}" cy="${y}" r="0.8" fill="#2e6b25"/><circle cx="${x + 3}" cy="${y}" r="0.8" fill="#2e6b25"/></g>`).join('');
  const poroSvg = poro ? [[28, 58], [46, 61], [64, 58], [82, 61]].map(([x, y], k) => `<g transform="rotate(${k % 2 ? 8 : -8} ${x} ${y})"><rect x="${x - 8}" y="${y - 3.4}" width="16" height="6.8" rx="3.4" fill="#d9a441" stroke="${ink}" stroke-width="1"/><path d="M ${x - 4},${y - 1} h 8 M ${x - 4},${y + 1.4} h 8" stroke="#8a5a14" stroke-width="0.8" opacity="0.7"/></g>`).join('') : '<text x="55" y="62" font-size="7" text-anchor="middle" fill="#9a8f7c">poro frito</text>';
  const ponzuSvg = ponzu ? '<path d="M 18,66 Q 26,54 36,66 T 54,66 T 72,66 T 90,66" fill="none" stroke="#4a2a14" stroke-width="3.2" stroke-linecap="round" opacity="0.9"/><path d="M 18,66 Q 26,54 36,66 T 54,66 T 72,66 T 90,66" fill="none" stroke="#a8642b" stroke-width="1" stroke-linecap="round" opacity="0.8"/>' : '';
  return `<svg viewBox="0 0 110 80" aria-hidden="true">
    <ellipse cx="55" cy="42" rx="53" ry="36" fill="#f7f2e6" stroke="#b9ae92" stroke-width="3"/>
    <ellipse cx="55" cy="42" rx="44" ry="29" fill="none" stroke="#e1d9c2" stroke-width="1.5"/>
    ${noodles}${lomo}${champi}${holantao}${poroSvg}${ponzuSvg}
  </svg>`;
}
// ---- Platos de Salteado (vista de arriba, lienzo 110×80): lo cocinado en el centro (se tiñe según la cocción: crudo / quemado) y cada pieza de emplatado encima, en su sitio ----
const SAL_INK = '#3a2b20';
function salRand(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
// n puntos repartidos dentro de una elipse; fn(x, y, i, rnd) devuelve el dibujo de cada uno
function salScatter(n, seed, cx, cy, rx, ry, fn) {
  const r = salRand(seed); let h = '';
  for (let i = 0; i < n; i++) { const a = r() * 6.2832, d = Math.sqrt(r()); h += fn(cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, i, r); }
  return h;
}
const salGrain = (x, y, i, r) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.5" ry="0.8" fill="#f6e6ac" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
const salBit = (cols, rad = 1.5) => (x, y, i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad}" fill="${cols[i % cols.length]}" stroke="${SAL_INK}" stroke-width="0.35"/>`;
const salSesame = (n, seed, cx, cy, rx, ry) => salScatter(n, seed, cx, cy, rx, ry, (x, y, i, r) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1" ry="0.6" fill="${i % 3 ? '#f4e8c8' : '#d9c28a'}" stroke="#8a6f3a" stroke-width="0.25" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
const salNegi = (n, seed, cx, cy, rx, ry) => salScatter(n, seed, cx, cy, rx, ry, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5" fill="none" stroke="#3f9e3a" stroke-width="1.1"/>`);
const salMound = (fill, hi, cx = 55, cy = 45, rx = 31, ry = 19) => `<ellipse cx="${cx}" cy="${cy + 4}" rx="${rx + 2}" ry="${ry}" fill="${fill}" stroke="${SAL_INK}" stroke-width="1.2"/><ellipse cx="${cx}" cy="${cy}" rx="${rx - 2}" ry="${ry - 3}" fill="${hi}"/>`;
const salCube = (x, y, rot, f = '#7b3a1c', hi = '#c9763f') => `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 4.5}" y="${y - 4}" width="9" height="8" rx="1.8" fill="${f}" stroke="${SAL_INK}" stroke-width="0.9"/><path d="M ${x - 3},${y - 2} h 5" stroke="${hi}" stroke-width="1.1" stroke-linecap="round"/></g>`;
const salLettuce = (cx, cy) => `<g><ellipse cx="${cx}" cy="${cy}" rx="11" ry="8" fill="#7cc35a" stroke="${SAL_INK}" stroke-width="0.9"/><path d="M ${cx - 7},${cy + 2} q 5,-8 9,-1 M ${cx - 1},${cy + 4} q 6,-8 9,-3" fill="none" stroke="#bfe39a" stroke-width="1.4" stroke-linecap="round"/><circle cx="${cx + 6}" cy="${cy - 3}" r="3.2" fill="#e5392f" stroke="${SAL_INK}" stroke-width="0.8"/><circle cx="${cx - 5}" cy="${cy - 2}" r="2.6" fill="#d7ecb0" stroke="${SAL_INK}" stroke-width="0.7"/><circle cx="${cx - 5}" cy="${cy - 2}" r="1" fill="#9ccc65"/></g>`;

// hilos / tiras curvas repartidos en una elipse (wantán frito, zanahoria o betarraga rallada, col): n hebras de largo len
const salThreads = (n, seed, cx, cy, rx, ry, cols, w = 1.2, len = 8) => salScatter(n, seed, cx, cy, rx, ry, (x, y, i, r) => {
  const a = r() * 3.1416, dx = Math.cos(a) * len, dy = Math.sin(a) * len * 0.55, bx = (r() - 0.5) * 4, by = (r() - 0.5) * 4;
  return `<path d="M ${(x - dx / 2).toFixed(1)},${(y - dy / 2).toFixed(1)} q ${(dx / 2 + bx).toFixed(1)},${(dy / 2 + by).toFixed(1)} ${dx.toFixed(1)},${dy.toFixed(1)}" fill="none" stroke="${cols[i % cols.length]}" stroke-width="${w}" stroke-linecap="round"/>`;
});
const salNuts = (n, seed, cx, cy, rx, ry) => salScatter(n, seed, cx, cy, rx, ry, (x, y, i, r) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.3" ry="1.6" fill="${['#c98f4a', '#e6c58a', '#a86a2c'][i % 3]}" stroke="${SAL_INK}" stroke-width="0.5" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
const salRings = (n, seed, cx, cy, rx, ry) => salScatter(n, seed, cx, cy, rx, ry, (x, y, i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.7" fill="#eaf7d6" stroke="${i % 2 ? '#4aa43f' : '#3a8a34'}" stroke-width="0.9"/>`);
const salBlackSesame = (n, seed, cx, cy, rx, ry) => salScatter(n, seed, cx, cy, rx, ry, (x, y, i, r) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="0.95" ry="0.55" fill="#1d1a1a" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
const salCoil = (x, y) => `<path d="M ${x - 5},${y + 2} c 1,-6 9,-6 9,-1 c 0,4 -6,4 -6,1 c 0,-2 3,-2 3,0" fill="none" stroke="#3f9e3a" stroke-width="1.7" stroke-linecap="round"/>`;
const salSkewer = (x0, y0, x1, y1, balls = 3) => { let h = `<path d="M ${x0},${y0} L ${x1},${y1}" stroke="#d9b27a" stroke-width="1.5" stroke-linecap="round"/>`; for (let k = 0; k < balls; k++) { const t = 0.28 + k * 0.22, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; h += `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="#8a3f17" stroke="${SAL_INK}" stroke-width="0.9"/><path d="M ${(x - 2.4).toFixed(1)},${(y - 1.4).toFixed(1)} q 2.2,-2.2 4.4,0" fill="none" stroke="#d99a55" stroke-width="1.2" stroke-linecap="round"/><path d="M ${(x - 1).toFixed(1)},${(y + 2.4).toFixed(1)} h 3" stroke="#3a160a" stroke-width="0.9" stroke-linecap="round"/></g>`; } return h; };
const SAL_WANTAN_COLS = ['#e6b04a', '#d49a2e', '#f3cc72'];

const SAL_PLATES = {
  'Chaufa Shimaya': {                       // arriba: hilos de wantán frito · al medio: ajonjolí sobre el chancho glaseado · abajo: benishoga
    main: () => salMound('#c79a52', '#dcb86c', 55, 46, 30, 17) + salScatter(34, 11, 55, 46, 26, 13, salGrain) + salScatter(10, 5, 55, 46, 24, 11, salBit(['#5faa46', '#e8892a', '#f6d34a']))
      + [[45, 41, -12], [55, 38, 8], [65, 41, 14], [50, 47, 4], [60, 47, -8]].map(([x, y, r]) => salCube(x, y, r)).join(''),
    extra: { 94: () => salThreads(46, 71, 55, 20, 25, 6, SAL_WANTAN_COLS, 1.4, 11),
      41: () => salThreads(16, 72, 55, 64, 23, 3.5, ['#d1273a', '#e8505f'], 1.7, 9),
      63: () => salNegi(14, 21, 55, 46, 23, 10),
      33: () => salSesame(26, 41, 55, 41, 14, 6) }
  },
  'Yakimeshi': {                            // arriba: wantán · al medio: frutos secos, ajonjolí y cebolla china · abajo: betarraga y zanahoria en hilos
    main: () => salMound('#d9b768', '#e8cd88', 55, 46, 30, 17) + salScatter(34, 3, 55, 46, 26, 13, salGrain)
      + salScatter(9, 8, 55, 46, 24, 11, salBit(['#e8892a'], 1.7)) + salScatter(8, 9, 55, 46, 24, 11, salBit(['#6cb34f'], 1.4)) + salScatter(6, 10, 55, 46, 24, 11, salBit(['#e5392f'], 1.5)) + salScatter(6, 12, 55, 46, 24, 11, salBit(['#f1d9b0'], 1.9))
      + '<path d="M 42,40 q 10,-6 20,-1" fill="none" stroke="#fff6cf" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>',
    extra: { 94: () => salThreads(46, 71, 55, 20, 25, 6, SAL_WANTAN_COLS, 1.4, 11),
      109: () => salNuts(8, 81, 55, 44, 22, 8),
      33: () => salSesame(22, 82, 55, 44, 20, 8),
      18: () => salRings(10, 83, 55, 44, 21, 8),
      42: () => salThreads(14, 84, 38, 64, 13, 3.5, ['#8e1f5b', '#b02f78'], 1.6, 9),
      30: () => salThreads(14, 85, 72, 64, 13, 3.5, ['#f0872a', '#f6a24a'], 1.6, 9) }
  },
  'Yakiramen': {                            // al centro del plato: ajonjolí y zanahoria en hilos
    main: () => { let n = ''; for (let k = 0; k < 8; k++) n += `<path d="M 24,${30 + k * 3.2} q 8,-6 16,0 t 16,0 t 16,0 t 14,0" fill="none" stroke="${k % 2 ? '#e0a64a' : '#c98f3a'}" stroke-width="2.2" stroke-linecap="round"/>`;
      return n + salScatter(4, 30, 55, 44, 22, 10, (x, y) => `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="#3d8b37" stroke="${SAL_INK}" stroke-width="0.8"/><circle cx="${(x - 1).toFixed(1)}" cy="${(y - 1).toFixed(1)}" r="1.4" fill="#6bbd5b"/></g>`)
        + salScatter(6, 31, 55, 44, 25, 11, salBit(['#e8892a'], 1.8)) + salScatter(5, 32, 55, 44, 25, 11, salBit(['#f2ead0'], 1.6)) + salScatter(4, 33, 55, 44, 25, 11, salBit(['#f1d9b0'], 1.9)); },
    extra: { 33: () => salSesame(24, 91, 55, 43, 14, 7), 30: () => salThreads(18, 92, 55, 43, 13, 7, ['#f0872a', '#f6a24a'], 1.6, 10) }
  },
  'Yasaitame': {
    main: () => salMound('#7fb35f', '#96c870', 55, 45, 31, 18)
      + [[40, 42], [52, 38], [66, 42], [58, 48]].map(([x, y]) => `<g><circle cx="${x}" cy="${y}" r="5.6" fill="#2f7d32" stroke="${SAL_INK}" stroke-width="0.9"/><circle cx="${x - 2}" cy="${y - 1.6}" r="2.4" fill="#58a64d"/><circle cx="${x + 2.4}" cy="${y + 1}" r="2" fill="#58a64d"/></g>`).join('')
      + [[46, 48], [70, 47], [33, 46]].map(([x, y]) => `<g><circle cx="${x}" cy="${y}" r="4.2" fill="#dcefb8" stroke="${SAL_INK}" stroke-width="0.8"/><circle cx="${x}" cy="${y}" r="2.6" fill="#b9d98a"/></g>`).join('')
      + '<path d="M 36,38 q 6,-6 12,0 M 62,36 q 6,-6 12,0" fill="none" stroke="#e5392f" stroke-width="2" stroke-linecap="round"/><path d="M 44,52 q 6,-5 12,0" fill="none" stroke="#f4b400" stroke-width="2" stroke-linecap="round"/>'
      + '<path d="M 30,40 l 5,5 M 76,42 l -5,5 M 50,53 l 3,-4" stroke="#f4f0e0" stroke-width="1.1" stroke-linecap="round"/>',
    extra: { 61: () => [[40, 36, -14], [54, 32, 4], [68, 36, 16]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - 8}" y="${y - 4.5}" width="16" height="9" rx="3.5" fill="#8c3b2c" stroke="${SAL_INK}" stroke-width="1"/><path d="M ${x - 5},${y - 1} h 10" stroke="#d98a73" stroke-width="1.2" opacity="0.8"/></g>`).join(''),
      33: () => salSesame(22, 41, 55, 42, 24, 11) }
  },
  'Karameshi': {                            // espolvoreado por todo el plato: ajonjolí blanco y negro y cebolla china · al centro: ají limo en tiras y, encima, rulos
    main: () => salMound('#bb5a30', '#d27a45', 55, 46, 30, 17) + salScatter(30, 6, 55, 46, 26, 13, (x, y, i, r) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.5" ry="0.8" fill="#f0c58a" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`)
      + salScatter(8, 14, 55, 46, 24, 11, salBit(['#f6d34a'], 1.6)) + salScatter(7, 15, 55, 46, 24, 11, salBit(['#9ccc65'], 1.5)) + salScatter(6, 16, 55, 46, 24, 11, salBit(['#f1d9b0'], 1.9))
      + '<path d="M 40,42 q 12,-7 24,-1" fill="none" stroke="#ffb28a" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>',
    extra: { 33: () => salSesame(30, 51, 55, 42, 40, 25), 34: () => salBlackSesame(26, 53, 55, 42, 40, 25), 18: () => salRings(14, 54, 55, 42, 38, 24),
      35: () => [[-10, -3, 8], [-9, 2, -6], [-10, 6, 10], [-9, -7, -12]].map(([dx, dy, r]) => `<g transform="rotate(${r} 55 ${46 + dy})"><path d="M ${55 + dx},${46 + dy} h 19" stroke="${SAL_INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M ${55 + dx},${46 + dy} h 19" stroke="#f08a1f" stroke-width="2.4" stroke-linecap="round"/><path d="M ${55 + dx + 3},${46 + dy - 0.6} h 8" stroke="#ffd48a" stroke-width="0.8" stroke-linecap="round"/></g>`).join(''),
      74: () => salCoil(48, 37) + salCoil(58, 35) + salCoil(66, 38) }
  },
  'Chicken Teriyaki': {
    main: () => [[46, 38, -14], [58, 35, 10], [68, 42, 30], [52, 46, 4], [62, 50, -10], [44, 52, 22]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - 8}" y="${y - 5.5}" width="16" height="11" rx="4.4" fill="#6b3216" stroke="${SAL_INK}" stroke-width="1"/><path d="M ${x - 5},${y - 2} q 5,-3 10,0" fill="none" stroke="#c98a45" stroke-width="1.6" stroke-linecap="round"/></g>`).join('')
      + '<path d="M 38,58 q 12,6 30,0" fill="none" stroke="#4a2410" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>',
    extra: { 37: () => `<path d="M 8,56 q 1,-20 18,-20 q 17,0 18,20 q -18,6 -36,0 Z" fill="#fbfaf3" stroke="${SAL_INK}" stroke-width="1.1"/>` + salScatter(12, 61, 26, 47, 11, 6, (x, y, i, r) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.4" ry="0.7" fill="#e5dfc8" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`) + '<path d="M 17,44 q 9,-8 18,0" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>',
      56: () => salLettuce(91, 40) }
  },
  'Yakitori': {                             // 3 brochetas (ya con su salsa desde la cocina) a cada lado y la ensalada en medio
    main: () => [[10, 24, 40, 18], [8, 41, 40, 38], [10, 58, 40, 62], [70, 18, 100, 24], [70, 38, 102, 41], [70, 62, 100, 58]].map(([x0, y0, x1, y1]) => salSkewer(x0, y0, x1, y1, 3)).join(''),
    extra: { 55: () => salLettuce(55, 41) + '<ellipse cx="55" cy="49" rx="8" ry="3" fill="#7cc35a" opacity="0.5"/>' }
  },
  'Omuraisu': {                             // tortilla con salsa katsu y, al lado, ensalada de col rallada con zanahoria en hilos
    main: () => `<g transform="translate(-9 0)"><path d="M 18,50 Q 20,22 55,22 Q 90,22 92,50 Q 90,66 55,66 Q 20,66 18,50 Z" fill="#f3c63f" stroke="${SAL_INK}" stroke-width="1.4"/><path d="M 24,52 Q 26,60 55,62 Q 84,60 86,52 Q 80,66 55,66 Q 30,66 24,52 Z" fill="#dba22a"/><path d="M 26,44 Q 55,30 86,46" fill="none" stroke="#dba22a" stroke-width="1.4" stroke-linecap="round"/><path d="M 32,36 Q 46,26 62,26" fill="none" stroke="#fff3b0" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/></g>`,
    extra: { 84: () => '<g transform="translate(-9 0)"><path d="M 30,40 l 7,-9 l 7,9 l 7,-9 l 7,9 l 7,-9 l 7,9 l 7,-9" fill="none" stroke="#3a1608" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M 30,40 l 7,-9 l 7,9 l 7,-9 l 7,9 l 7,-9 l 7,9 l 7,-9" fill="none" stroke="#b0381c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g>',
      52: () => salThreads(26, 95, 91, 53, 11, 7, ['#d7ecb0', '#eef6d5', '#bfe39a'], 1.4, 9),
      30: () => salThreads(14, 96, 91, 50, 9, 5, ['#f0872a', '#f6a24a'], 1.5, 9) }
  }
};
// Plato de Salteado: plato (sin tinte) + lo cocinado (tinte de la cocción) + piezas de emplatado (la última añadida «salta» al caer)
function salPlateHtml(dish, plateItems, item) {
  const d = SAL_PLATES[dish];
  if (!d) return null;
  const tone = { CRUDO: 'saturate(0.7) brightness(1.12)', QUEMADO: 'brightness(0.5) saturate(0.75)' }[item && item.result] || 'none';
  const last = plateItems[plateItems.length - 1];
  const extras = plateItems.filter(id => d.extra[id]).map(id => `<g class="${id === last ? 'sal-pop' : ''}">${d.extra[id]()}</g>`).join('');
  return `<div class="fp-bowl"><div class="sal-plate">
    <svg viewBox="0 0 110 80" aria-hidden="true"><ellipse cx="55" cy="42" rx="53" ry="36" fill="#f7f2e6" stroke="#b9ae92" stroke-width="3"/><ellipse cx="55" cy="42" rx="44" ry="29" fill="none" stroke="#e1d9c2" stroke-width="1.5"/></svg>
    <svg viewBox="0 0 110 80" aria-hidden="true" style="filter:${tone}">${d.main()}</svg>
    <svg viewBox="0 0 110 80" aria-hidden="true">${extras}</svg></div></div>`;
}
function stDiscHtml(area, item, plateItems, sl) {
  const v = item.vis || {};
  if (area === 'makis' && typeof mkPlateHtml === 'function') { const h = mkPlateHtml(item, plateItems, sl); if (h) return h; }   // Makis con etapas: las 6 piezas sobre su fuente
  if (area === 'salteados' && item.recipes && item.recipes.length) {
    const ev = item.recipes.length > 1 ? stPlateEval(area, item, plateItems) : null, dish = ev ? ev.recipe.name : item.recipes[0];
    if (dish === 'Batayaki Ramen') return `<div class="fp-bowl">${batayakiPlateSvg(plateItems)}</div>`;
    const h = salPlateHtml(dish, plateItems, item);
    if (h) return h;
  }
  if (area === 'frituras' && item.recipes && item.recipes.length && typeof friPlateHtml === 'function') {
    const ev = item.recipes.length > 1 ? stPlateEval(area, item, plateItems) : null, h = friPlateHtml(ev ? ev.recipe.name : item.recipes[0], plateItems, item);
    if (h) return h;
  }
  if (v.kind === 'bowl') return `<div class="fp-bowl">${generateBowlSVG({ ingredients: [...(v.ings || []), ...plateItems], spread: v.spread, hideBar: true }, null)}</div>`;
  if (v.kind === 'img') return `<div class="fp-disc"><img class="fp-disc-img" src="${v.src}" alt=""></div>`;
  return `<div class="fp-disc"><span class="fp-disc-main" style="filter:${v.tone || 'none'}">${stIngIcon(v.id)}</span>${v.kare ? '<i class="fp-kare"></i>' : ''}</div>`;
}

function stRenderPlate(area, panel) {
  const st = stGet(area), pass = st.pass;
  const passHtml = pass.length ? pass.map((it, i) => {
    const fr = stFreshPts(area, it);
    const res = { CRUDO: '🥶', PERFECTO: '🔥', QUEMADO: '💨' }[it.result] || '';
    return `<div class="fp-pass-card" onclick="stPassToSlot('${area}',${i})" title="Toca para llevarlo a un cuenco libre">
      ${stPassIcon(it)}<span class="fp-pass-res">${res}</span>
      <div class="fp-bar fp-fresh"><i data-fp-ready="${it.readyAt}" style="width:${Math.round(100 * fr / 20)}%"></i></div>
      <button class="fp-x" title="Descartar" onclick="event.stopPropagation(); stPassDiscard('${area}',${i})">🗑️</button></div>`;
  }).join('') : '<div class="fp-empty">Pase vacío: termina un plato en la cocina.</div>';
  const ready = stReadyDishes(area);
  const bowls = st.slots.map((sl, i) => {
    if (!sl.item) return `<div class="plate-bowl is-empty" data-slot="${i}"><div class="pl2-title">Cuenco ${i + 1}</div><div class="fp-empty">Toca un plato del pase</div></div>`;
    const dish = ready.find(d => d.index === i);
    const stars = dish ? starsText(qualityTier(evaluateDish(dish))) : '';
    const chips = sl.items.map(id => `<span class="fp-chip" onclick="stPlateRemoveItem('${area}',${i},${id})" title="Quitar ${stIngName(id)}">${stIngIcon(id)}</span>`).join('');
    return `<div class="plate-bowl" data-slot="${i}">
      <div class="pl2-title">Cuenco ${i + 1} · ${sl.item.recipes.join(' / ')}</div>
      ${stDiscHtml(area, sl.item, sl.items, sl)}
      ${area === 'makis' && makiPlateNeedsFlame(sl) ? `<div class="mk-flame ${(sl.flame || 0) >= MAKI_FLAME_GREEN[0] && (sl.flame || 0) <= MAKI_FLAME_GREEN[1] ? 'seared' : ((sl.flame || 0) > MAKI_FLAME_GREEN[1] ? 'burnt' : '')}" data-mk-flame="${i}" title="Flameado: arrastra el flameador al cuenco y retíralo en la zona verde"><u style="left:${MAKI_FLAME_GREEN[0] / MAKI_FLAME_MAX * 100}%;width:${(MAKI_FLAME_GREEN[1] - MAKI_FLAME_GREEN[0]) / MAKI_FLAME_MAX * 100}%"></u><i style="width:${Math.min(100, (sl.flame || 0) / MAKI_FLAME_MAX * 100)}%"></i><span>🔥</span></div>` : ''}
      <div class="fp-chips">${chips || '<small>Arrastra aquí los ingredientes de arriba</small>'}</div>
      <div class="fp-actions"><button class="fp-btn" onclick="stPlateClear('${area}',${i})" ${sl.items.length ? '' : 'disabled'}>Vaciar</button>
      <button class="fp-btn fp-serve" onclick="stPlateServe('${area}',${i})">✅ Servir ${stars}</button>
      <button class="fp-x" title="Descartar el plato" onclick="stSlotDiscard('${area}',${i})">🗑️</button></div></div>`;
  }).join('');
  panel.innerHTML = `<div class="fp-wrap fp-plating2">
    <div class="pl2-row">
      <div class="pl2-pass"><div class="fp-h">Pase (${pass.length}/${ST_PASS_MAX})</div>${passHtml}</div>
      ${bowls}
    </div></div>`;
}

// Actualización ligera cada segundo (sin recrear los botones para no perder toques).
function stTickUi() {
  const area = gameState.activeArea;
  if (!stPanelOpen(area)) return;
  const panel = document.getElementById('stage-panel');
  if (!panel) return;
  const st = stGet(area), pr = st.prep;
  if (stIsShop(area)) stShopUi(area, panel);
  const left = panel.querySelector('[data-fp-left]');
  if (left && pr) left.textContent = pr.left;
  const bar = panel.querySelector('[data-fp-prep]');
  if (bar && pr) bar.style.width = `${Math.round(100 * (1 - pr.left / pr.total))}%`;
  panel.querySelectorAll('[data-fp-ready]').forEach(el => {
    const it = st.pass.find(x => String(x.readyAt) === el.dataset.fpReady);
    if (it) el.style.width = `${Math.round(100 * stFreshPts(area, it) / 20)}%`;
  });
}
