// Generador del arte de las proteínas de Frituras (Sumi · pipeline).
// SVG 64x64 sin sombra de mesa: el empanizado del juego usa la silueta (alfa) de estos mismos archivos como
// máscara, así harina, huevo y panko siguen exactamente la forma de la proteína.
// Uso:  node tools/gen-fry-proteins.mjs      (escribe en assets/fry/)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT = '#2b1810';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEST = path.join(HERE, '..', 'assets', 'fry');
fs.mkdirSync(DEST, { recursive: true });

const h2r = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const r2h = r => '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = h2r(a), B = h2r(b); return r2h(A.map((v, i) => v + (B[i] - v) * t)); };
const lt = (c, t = 0.35) => mix(c, '#ffffff', t);
const dk = (c, t = 0.3) => mix(c, '#000000', t);

let defs, gid;
const grad = (c, dir = 'v') => {
  const id = `g${gid++}`;
  const [x2, y2] = dir === 'v' ? [0, 1] : [1, 1];
  defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${lt(c, 0.38)}"/><stop offset="0.55" stop-color="${c}"/><stop offset="1" stop-color="${dk(c, 0.3)}"/></linearGradient>`);
  return `url(#${id})`;
};
const S = (w = 2.4) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const P = (d, fill, w = 2.4, extra = '') => `<path d="${d}" fill="${fill}" ${S(w)} ${extra}/>`;
const L = (d, c, w = 1.4, o = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`;
const shine = (d, o = 0.55, w = 2) => `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const dots = (list, c, r = 1.1, o = 1) => list.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`).join('');
const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n  <defs>${defs.join('')}</defs>\n  ${body}\n</svg>\n`;

// Blob irregular y suave (Catmull-Rom cerrada) para trozos de pollo
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function blob(cx, cy, rx, ry, seed, n = 9, jit = 0.16, rot = 0) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2, k = 1 + (r() * 2 - 1) * jit;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (i === 0) d += `M${p1[0].toFixed(1)},${p1[1].toFixed(1)} `;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} `;
  }
  return d + 'Z';
}

const FILES = {};

// ---------- 36 · Alitas: un muslito (drumette) y una aleta (wingette) con hueso ----------
(function () {
  defs = []; gid = 0;
  const skin = '#ecc193';
  const g1 = grad(skin), g2 = grad(mix(skin, '#e2a373', 0.4));
  const bone = '#fff6dc';
  // muslito: hueso a la izquierda, carne redondeada a la derecha
  const drum = `<g transform="translate(25 22) rotate(-28) scale(0.98)">
    ${P('M-27,-4 L-15,-2.6 L-15,2.6 L-27,4 Q-31,4.6 -31,1.6 Q-33,0 -31,-1.6 Q-31,-4.6 -27,-4 Z', bone, 2.2)}
    ${P('M-17,0 C-17,-11 -5,-15 6,-11 C16,-8 20,-2 19,3 C18,10 10,13 1,12 C-9,12 -17,9 -17,0 Z', g1, 2.5)}
    ${dots([[-6, -6], [2, -8], [10, -4], [-8, 3], [0, 6], [9, 6], [14, 1]], '#c98c52', 1.15, 0.85)}
    ${shine('M-10,-6 Q-2,-11 8,-8', 0.6, 2)}
  </g>`;
  // aleta: más delgada, hueso a la derecha
  const wing = `<g transform="translate(36 45) rotate(16) scale(0.94)">
    ${P('M17,-3 L26,-2 L26,2 L17,3 Z', bone, 2.1)}${P('M26,-2.8 Q30,-3.4 30,0 Q30,3.4 26,2.8 Z', bone, 2.1)}
    ${P('M-17,1 C-17,-8 -5,-11 5,-9 C13,-8 18,-4 18,0 C18,6 11,9 3,9 C-8,10 -17,8 -17,1 Z', g2, 2.5)}
    ${dots([[-8, -3], [-1, -5], [7, -3], [-6, 3], [2, 4], [10, 2]], '#c98c52', 1.1, 0.85)}
    ${shine('M-11,-4 Q-3,-8 6,-6', 0.55, 1.9)}
  </g>`;
  FILES['fry_36_alitas.svg'] = wrap(wing + drum);
})();

// ---------- 43 · Bife de cerdo: chuleta gruesa con tira de grasa ----------
(function () {
  defs = []; gid = 0;
  const meat = grad('#e98f9b');
  const fat = grad('#fff1dc');
  const body = 'M5,31 C5,17 16,11 31,11 C47,11 59,17 59,31 C59,46 48,53 32,53 C15,53 5,46 5,31 Z';
  FILES['fry_43_bife_cerdo.svg'] = wrap(
    P(body, meat, 2.7)
    + P('M8,27 C9,19 18,15 31,15 C45,15 55,19 56,27 C47,23 17,23 8,27 Z', fat, 1.7)
    + L('M12,22 Q31,17 52,22', '#e6c9a2', 1.3, 0.9)
    + L('M14,36 Q24,28 36,34 T52,33', '#f7c3ca', 1.8, 0.8)
    + L('M12,43 Q24,38 34,43 T50,41', '#c9707e', 1.4, 0.55)
    + L('M20,31 Q26,27 31,31', '#fbd9de', 1.4, 0.7)
    + shine('M13,34 Q14,26 21,23', 0.45, 2.2)
  );
})();

// ---------- 44 · Bife de pollo: filete de pechuga, más claro y alargado ----------
(function () {
  defs = []; gid = 0;
  const meat = grad('#f2cfae');
  const body = 'M5,39 C6,22 20,11 40,12 C55,13 61,24 57,36 C53,48 39,54 24,52 C12,50 4,46 5,39 Z';
  FILES['fry_44_bife_pollo.svg'] = wrap(
    P(body, meat, 2.7)
    + P('M36,49 C45,53 54,50 58,41 C52,45 44,47 36,49 Z', lt('#f2cfae', 0.35), 1.8)
    + L('M12,36 Q22,24 38,22', '#e7b88f', 1.6, 0.8) + L('M10,41 Q24,31 44,29', '#e7b88f', 1.6, 0.7)
    + L('M14,46 Q28,38 50,36', '#e7b88f', 1.5, 0.6) + L('M20,18 Q30,15 41,17', '#fff6ea', 1.6, 0.8)
    + shine('M12,30 Q16,21 27,17', 0.55, 2.3)
  );
})();

// ---------- 60 · Langostinos: tres, con segmentos, cola en abanico y antenas ----------
(function () {
  defs = []; gid = 0;
  const g = [grad('#f0a58e'), grad('#f4b39e'), grad('#eb9a82')];
  const shrimp = (gi, extra = '') => `<g ${extra}>
    ${L('M52,16 Q60,6 63,9', OUT, 2.6)}${L('M54,21 Q62,15 64,19', OUT, 2.4)}
    ${P('M11,38 L3,47 L9,51 L12,45 L15,51 L20,46 Z', '#d97c64', 2.1)}
    ${P('M9,36 C6,19 22,8 39,12 C51,15 57,27 52,39 C49,46 43,49 39,47 C43,41 43,33 36,27 C28,23 18,27 18,37 C18,45 14,49 9,36 Z', g[gi], 2.6)}
    ${L('M24,12 Q20,20 22,30 M31,10.5 Q28,18 31,27 M38,12 Q36,19 40,26 M45,16 Q44,21 48,27', '#b96a52', 1.6, 0.85)}
    <circle cx="47" cy="22" r="2.4" fill="${OUT}"/><circle cx="46.3" cy="21.2" r="0.8" fill="#fff"/>
    ${shine('M16,22 Q22,14 33,13', 0.55, 1.8)}
  </g>`;
  FILES['fry_60_langostinos.svg'] = wrap(
    shrimp(2, 'transform="translate(14 -6) scale(0.7)"')
    + shrimp(1, 'transform="translate(-3 14) scale(0.72)"')
    + shrimp(0, 'transform="translate(12 24) scale(0.74)"')
  );
})();

// ---------- 70 · Pollo ×7: siete trozos irregulares ----------
(function () {
  defs = []; gid = 0;
  const cols = ['#efc59a', '#f3d0a8', '#e8b988', '#f1c9a0', '#ebbf92', '#f4d5ae', '#e9b98a'];
  const spots = [[17, 17], [33, 13], [49, 19], [13, 34], [31, 31], [49, 38], [29, 50]];
  const rr = [[10.5, 9], [10, 9.5], [10, 9], [10, 9.5], [11, 10], [10.5, 9.5], [10.5, 8.5]];
  let body = '';
  spots.forEach(([x, y], i) => {
    body += P(blob(x, y, rr[i][0], rr[i][1], 11 + i * 7, 9, 0.17, i), grad(cols[i]), 2.4)
      + dots([[x - 3, y - 2], [x + 3, y - 3], [x + 1, y + 3], [x - 4, y + 3]], '#c98c52', 1.0, 0.8)
      + shine(`M${x - 6},${y - 3} Q${x - 2},${y - 7} ${x + 3},${y - 5}`, 0.5, 1.6);
  });
  FILES['fry_70_pollo.svg'] = wrap(body);
})();

// ---------- 73 · Gyoza: dos empanadillas con pliegues ----------
(function () {
  defs = []; gid = 0;
  const dough = grad('#f6e9cb');
  const gyoza = (extra) => `<g ${extra}>
    ${P('M5,38 C5,25 16,15 32,15 C48,15 59,25 59,38 C59,45 52,48 32,48 C12,48 5,45 5,38 Z', dough, 2.6)}
    ${L('M9,34 C12,24 20,19 32,19 C44,19 52,24 55,34', '#d9bd8a', 3, 0.7)}
    ${L('M15,25 Q17,31 14,35 M21,21.5 Q23,28 20,33 M28,20 Q29,27 27,33 M36,20 Q36,27 38,33 M43,21.5 Q42,28 45,33 M49,25 Q47,31 50,35', '#b8975c', 1.5, 0.95)}
    ${L('M11,40 Q32,46 53,40', '#ffffff', 1.8, 0.55)}
    ${shine('M12,37 Q14,29 22,25', 0.5, 1.8)}
  </g>`;
  FILES['fry_73_gyoza.svg'] = wrap(
    gyoza('transform="translate(3 -3) scale(0.8) rotate(-6 32 32)"')
    + gyoza('transform="translate(6 24) scale(0.78) rotate(5 32 32)"')
  );
})();

for (const [name, svg] of Object.entries(FILES)) fs.writeFileSync(path.join(DEST, name), svg);
console.log('escritos:', Object.keys(FILES).join(', '));
