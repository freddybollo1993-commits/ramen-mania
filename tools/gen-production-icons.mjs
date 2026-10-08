// Iconos de PRODUCCIÓN (Sumi · pipeline): cada insumo tiene dos estados.
//   crudo     → como llega (fresco, entero): se ve en la pantalla de Producción.
//   procesado → ya cortado / cocido, listo para usar: se ve al emplatar.
// Mismo lenguaje que el resto de iconos: SVG 64x64, contorno cálido #2b1810, degradado de volumen y brillo.
// Uso:  node tools/gen-production-icons.mjs     (escribe en assets/ingredients/)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT = '#2b1810';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEST = path.join(HERE, '..', 'assets', 'ingredients');

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
const E = (cx, cy, rx, ry, fill, w = 2.2, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${S(w)} ${extra}/>`;
const L = (d, c, w = 1.5, o = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`;
const shine = (d, o = 0.55, w = 2) => `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const dots = (list, c, r = 1.1, o = 1) => list.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`).join('');
const G = (t, inner) => `<g transform="${t}">${inner}</g>`;
const shadow = (rx = 22) => `<ellipse cx="32" cy="58" rx="${rx}" ry="4" fill="#21120e" opacity="0.32"/>`;
const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n  <defs>${defs.join('')}</defs>\n  ${body}\n</svg>\n`;

const FILES = {};
const draw = (name, fn) => { defs = []; gid = 0; FILES[name] = wrap(fn()); };

// ================= CRUDOS =================
draw('ing_raw_17_poro.svg', () => {
  const stem = grad('#f1f3d6'), dark = grad('#3f7d2c'), mid = grad('#5fa03b');
  return shadow(18)
    + L('M27,56 Q25,60 21,62 M31,57 L30,63 M35,57 L36,63 M39,56 Q41,60 45,62', '#c9bb9a', 1.7)
    + P('M23,30 Q7,22 10,3 Q22,8 29,28 Z', dark, 2.3) + P('M41,30 Q57,22 54,3 Q42,8 35,28 Z', dark, 2.3)
    + P('M24,56 L22,28 Q32,23 42,28 L40,56 Q32,60 24,56 Z', stem, 2.5)
    + P('M28,28 Q25,12 32,1 Q39,12 36,28 Z', mid, 2.3)
    + L('M23,40 Q32,44 41,40 M23,48 Q32,52 41,48', '#bfcb94', 1.5) + shine('M27,32 L26,52', 0.55, 2);
});
draw('ing_raw_18_cebolla_china.svg', () => {
  const white = grad('#f4f1e2'), green = grad('#6fb544');
  const stalk = (t) => G(t, L('M-4,1 Q-5,6 -7,9 M0,2 L0,10 M4,1 Q5,6 7,9', '#d9cfb8', 1.5)
    + P('M-5,0 Q-7,-8 -3,-15 L3,-15 Q7,-8 5,0 Z', white, 2.2)
    + P('M-3,-15 Q-5,-36 -2,-52 Q0,-56 2,-52 Q5,-36 3,-15 Z', green, 2.2)
    + L('M0,-18 L0,-46', '#b8e07a', 1.2, 0.8));
  return shadow(16) + stalk('translate(20 57) rotate(-16) scale(0.82)') + stalk('translate(44 57) rotate(16) scale(0.82)') + stalk('translate(32 58) scale(0.9)')
    + dots([[24, 61], [38, 62], [30, 62], [44, 61]], '#6b4a2a', 1.2, 0.8);
});
draw('ing_raw_22_bambu.svg', () => {
  const husk = grad('#d9b47c'), husk2 = grad('#c79a5a'), tip = grad('#c8d97a');
  return shadow(20)
    + P('M14,54 Q12,34 28,14 Q32,8 36,14 Q52,34 50,54 Q32,60 14,54 Z', husk, 2.6)
    + P('M17,46 Q16,36 26,24 Q32,20 38,24 Q48,36 47,46 Q32,52 17,46 Z', husk2, 2)
    + P('M24,28 Q26,14 32,8 Q38,14 40,28 Q32,32 24,28 Z', tip, 2)
    + L('M17,50 Q32,56 47,50 M20,40 Q32,46 44,40 M24,31 Q32,35 40,31', '#8a6a3a', 1.6, 0.9)
    + dots([[22, 50], [32, 54], [42, 50], [27, 42], [37, 42]], '#8a6a3a', 1, 0.7) + shine('M20,48 Q19,36 26,26', 0.5, 2);
});
draw('ing_raw_24_col.svg', () => {
  const head = grad('#a9d56c'), outer = grad('#5f9d38');
  return shadow(22)
    + P('M9,34 Q6,54 30,58 Q15,48 13,30 Z', outer, 2.3) + P('M55,34 Q58,54 34,58 Q49,48 51,30 Z', outer, 2.3)
    + `<ellipse cx="32" cy="34" rx="23" ry="22" fill="${head}" ${S(2.6)}/>`
    + L('M32,56 Q31,34 32,10 M32,54 Q20,40 14,24 M32,54 Q44,40 50,24 M32,50 Q24,36 24,16 M32,50 Q40,36 40,16', '#e9f6c4', 1.7, 0.85)
    + P('M14,36 Q22,20 36,18 Q26,26 24,40 Z', 'rgba(255,255,255,0.14)', 1.2) + shine('M16,30 Q20,18 30,14', 0.6, 2.2);
});
draw('ing_raw_25_moyashi.svg', () => {
  let b = shadow(20);
  const stem = (x0, x1, c) => L(`M${x0},58 Q${(x0 + x1) / 2 + 3},34 ${x1},13`, OUT, 5.2) + L(`M${x0},58 Q${(x0 + x1) / 2 + 3},34 ${x1},13`, '#f6f2df', 3.2);
  const stems = [[14, 10], [20, 18], [26, 25], [31, 31], [36, 38], [42, 45], [48, 52]];
  stems.forEach(([x0, x1]) => { b += stem(x0 + 4, x1 + 4); });
  stems.forEach(([x0, x1]) => { b += E(x1 + 4, 12, 4.2, 3.2, grad('#e9d96f'), 1.6, `transform="rotate(${(x1 - 32) * 0.6} ${x1 + 4} 12)"`); });
  return b + L('M12,60 Q10,63 8,63 M30,60 L30,63 M50,60 Q52,63 55,63', '#d6cdb2', 1.4)
    + dots([[22, 30], [34, 42], [44, 24], [16, 44]], '#a07a3a', 1.2, 0.8);
});
draw('ing_raw_30_zanahoria.svg', () => {
  const body = grad('#f08a2b'), leaf = grad('#4f9b3a');
  return shadow(20)
    + P('M44,13 Q47,5 52,6 Q50,12 48,15 Z', leaf, 1.8) + P('M48,16 Q55,10 60,13 Q55,19 50,20 Z', leaf, 1.8) + P('M46,14 Q44,4 40,3 Q39,10 43,16 Z', leaf, 1.8)
    + P('M40,14 Q54,16 52,32 Q46,46 14,58 Q10,52 18,38 Q26,18 40,14 Z', body, 2.6)
    + L('M24,34 L30,36 M30,26 L38,29 M36,38 L42,40 M20,46 L26,47 M30,44 L36,46', '#c1651a', 1.6, 0.9) + shine('M30,22 Q42,18 48,24', 0.55, 2.2);
});
draw('ing_raw_15_huevo.svg', () => {
  const brown = grad('#e3b78a'), cream = grad('#f6e6cc');
  const egg = (g, t) => G(t, P('M0,-24 Q18,-18 18,2 Q18,22 0,24 Q-18,22 -18,2 Q-18,-18 0,-24 Z', g, 2.5) + dots([[-6, -8], [5, 2], [-3, 10], [8, -10], [-9, 4], [4, 14]], '#b98a5c', 1, 0.7) + shine('M-11,-8 Q-9,-17 -2,-20', 0.65, 2.2));
  return shadow(21) + egg(cream, 'translate(41 30) rotate(12) scale(0.86)') + egg(brown, 'translate(24 35) rotate(-10)');
});

// ================= PROCESADOS =================
draw('ing_proc_17_poro.svg', () => {
  const ring = (x, y, k = 1) => E(x, y, 11 * k, 7.6 * k, grad('#eaf1c8'), 2.2) + E(x, y, 7.2 * k, 4.6 * k, '#cfe3a0', 1.4) + E(x, y, 3.4 * k, 2.1 * k, '#f6f9e4', 1.2) + L(`M${x - 9 * k},${y - 2 * k} Q${x},${y - 6 * k} ${x + 9 * k},${y - 2 * k}`, '#7dae4a', 1.4, 0.8);
  return shadow(22) + ring(19, 21, 0.85) + ring(44, 22, 0.85) + ring(32, 31, 1) + ring(21, 45, 1) + ring(43, 45, 1);
});
draw('ing_proc_18_cebolla_china.svg', () => {
  const g = [grad('#79bf47'), grad('#6fb544'), grad('#8acb52')];
  const bit = (x, y, k, i) => E(x, y, 6.2 * k, 3.8 * k, g[i % 3], 1.9) + E(x, y, 3.2 * k, 1.9 * k, '#e8f6c7', 1);
  const pos = [[18, 46], [32, 48], [46, 46], [24, 36], [39, 37], [31, 26], [20, 26], [45, 27], [32, 16], [26, 52], [40, 53]];
  return shadow(22) + pos.slice().sort((a, b) => a[1] - b[1]).map(([x, y], i) => bit(x, y, 1, i)).join('')
    + dots([[28, 40], [36, 30]], '#fff', 1, 0.6);
});
draw('ing_proc_20_nori.svg', () => {
  const g = grad('#2d4a34');
  const strip = (y, dx, w) => `<rect x="${10 + dx}" y="${y}" width="${w}" height="7" rx="2" fill="${g}" ${S(2)}/>` + L(`M${13 + dx},${y + 2} L${8 + dx + w},${y + 2}`, '#6f9a7a', 1.2, 0.8);
  return shadow(22) + strip(14, 3, 40) + strip(23, -2, 44) + strip(32, 5, 38) + strip(41, 0, 44) + strip(50, 6, 36);
});
draw('ing_proc_23_holantao.svg', () => {
  const g = grad('#8fd35a');
  const piece = (t) => G(t, P('M-14,-5 Q-4,-9 14,-6 L16,3 Q4,8 -12,4 Z', g, 2.2) + L('M-10,-1 Q0,-4 11,-1', '#d6f2a8', 1.4) + dots([[-6, 0], [1, 1], [8, 1]], '#4f9b3a', 1.6));
  return shadow(22) + piece('translate(26 18) rotate(-12)') + piece('translate(38 32) rotate(8)') + piece('translate(24 46) rotate(-6)');
});
draw('ing_proc_27_champinones.svg', () => {
  const g = grad('#f1e9d6');
  const slice = (t) => G(t, P('M-12,2 Q-13,-10 0,-12 Q13,-10 12,2 Q8,4 4,4 L4,13 Q0,15 -4,13 L-4,4 Q-8,4 -12,2 Z', g, 2.2) + L('M-8,0 Q0,-6 8,0 M0,-3 L0,10', '#cdbf9c', 1.3, 0.9) + shine('M-9,-3 Q-5,-9 0,-9', 0.6, 1.6));
  return shadow(21) + slice('translate(20 20) rotate(-10)') + slice('translate(44 22) rotate(12)') + slice('translate(32 38) rotate(2) scale(1.08)') + slice('translate(16 50) rotate(8) scale(0.9)') + slice('translate(48 50) rotate(-8) scale(0.9)');
});
draw('ing_proc_28_shitake.svg', () => {
  const g = grad('#8a5a34');
  const strip = (t, k = 1) => G(t, P('M-15,3 Q-12,-10 0,-11 Q12,-10 15,3 Q8,-3 0,-3 Q-8,-3 -15,3 Z', g, 2.2) + L('M-11,0 Q0,-6 11,0', '#e7d3b0', 1.3, 0.9) + shine('M-10,-3 Q-4,-8 3,-8', 0.4, 1.6));
  return shadow(22) + strip('translate(32 14) scale(0.9)') + strip('translate(22 26) rotate(-8)') + strip('translate(42 29) rotate(9)') + strip('translate(30 41) rotate(-3) scale(1.05)') + strip('translate(33 53) scale(0.95)');
});
draw('ing_proc_29_esparrago.svg', () => {
  const g = grad('#78b84a'), cutf = '#cfe7a0';
  const piece = (t, tip = false) => G(t, `<rect x="-13" y="-4.5" width="26" height="9" rx="2.5" fill="${g}" ${S(2.1)}/>` + E(13, 0, 2.3, 4.5, cutf, 1.6) + (tip ? P('M-13,-4.5 Q-20,0 -13,4.5 Z', grad('#5f9a3a'), 1.8) + L('M-10,-2 L-6,-2 M-10,2 L-6,2', '#3f6f27', 1.1) : '') + shine('M-9,-2 L8,-2', 0.5, 1.4));
  return shadow(22) + piece('translate(24 16) rotate(-14)', true) + piece('translate(42 22) rotate(10)') + piece('translate(26 34) rotate(8)') + piece('translate(40 44) rotate(-12)', true) + piece('translate(24 52) rotate(-4)');
});
draw('ing_proc_21_alga_wanji.svg', () => {
  const rib = (d) => L(d, OUT, 8.2) + L(d, '#3f6a3c', 5.6) + L(d, '#7fb27a', 1.8, 0.8);
  return shadow(22) + rib('M10,18 Q22,6 32,18 T54,16') + rib('M8,32 Q20,22 32,34 T56,32') + rib('M10,46 Q22,36 34,48 T54,46');
});

for (const [name, svg] of Object.entries(FILES)) fs.writeFileSync(path.join(DEST, name), svg);
console.log('escritos:', Object.keys(FILES).length, 'iconos');
