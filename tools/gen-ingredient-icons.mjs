// Generador de iconos de ingredientes (Sumi · pipeline).
// Produce SVG 64x64 con el mismo lenguaje visual que los iconos de Ramen:
// contorno cálido #2b1810, degradado de volumen, brillo y sombra de mesa.
// Uso:  node tools/gen-ingredient-icons.mjs        (escribe en assets/ingredients/)
// Cada plantilla recibe colores; añadir un ingrediente = una línea en ICONS.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT = '#2b1810';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEST = path.join(HERE, '..', 'assets', 'ingredients');

// ---------- color ----------
const h2r = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const r2h = r => '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = h2r(a), B = h2r(b); return r2h(A.map((v, i) => v + (B[i] - v) * t)); };
const lt = (c, t = 0.35) => mix(c, '#ffffff', t);
const dk = (c, t = 0.3) => mix(c, '#000000', t);

// ---------- helpers de dibujo ----------
let defs, gid;
const grad = (c, dir = 'v') => {
  const id = `g${gid++}`;
  const [x2, y2] = dir === 'v' ? [0, 1] : [1, 0];
  defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${lt(c, 0.38)}"/><stop offset="0.55" stop-color="${c}"/><stop offset="1" stop-color="${dk(c, 0.28)}"/></linearGradient>`);
  return `url(#${id})`;
};
const S = (w = 2.4) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const P = (d, fill, w = 2.4, extra = '') => `<path d="${d}" fill="${fill}" ${S(w)} ${extra}/>`;
const E = (cx, cy, rx, ry, fill, w = 2.2, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${S(w)} ${extra}/>`;
const C = (cx, cy, r, fill, w = 2, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${S(w)} ${extra}/>`;
const R = (x, y, w, h, rx, fill, sw = 2.2, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${S(sw)} ${extra}/>`;
const shine = (d, o = 0.5, w = 2) => `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const curl = (d, c, w = 4.5) => `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="${w + 3}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const dots = (list, c, r = 1.2) => list.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
const shadow = (rx = 22) => `<ellipse cx="32" cy="57" rx="${rx}" ry="4.5" fill="#21120e" opacity="0.35"/>`;
const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n  <defs>${defs.join('')}</defs>\n  ${body}\n</svg>\n`;

// ---------- plantillas ----------
const T = {
  bottle: ({ c, cap = '#c62828', accent = '#d32f2f' }) => {
    const g = grad(c, 'h');
    return shadow(17) + P('M24,18 L40,18 L41,27 Q49,31 49,44 Q49,56 32,56 Q15,56 15,44 Q15,31 23,27 Z', g, 2.6)
      + R(25, 9, 14, 11, 2.5, g, 2.2) + R(23, 4, 18, 8, 3, cap, 2.2)
      + R(20, 35, 24, 15, 3, '#fff8e1', 1.9) + `<rect x="22" y="37" width="20" height="3" fill="${accent}"/>` + `<circle cx="32" cy="45" r="2.8" fill="${accent}"/>`
      + shine('M20,34 Q18,44 21,52', 0.45, 2.4);
  },
  squeeze: ({ c, cap = '#c62828' }) => {
    const g = grad(c, 'h');
    return shadow(14) + P('M23,26 Q23,20 28,18 L36,18 Q41,20 41,26 L44,51 Q44,57 38,57 L26,57 Q20,57 20,51 Z', g, 2.6)
      + P('M28,18 L30,8 L34,8 L36,18 Z', cap, 2.2) + P('M30,8 L32,3 L34,8 Z', cap, 1.8)
      + R(23, 34, 18, 14, 3, '#fff8e1', 1.8) + `<rect x="25" y="36" width="14" height="3" fill="${cap}"/>` + `<circle cx="32" cy="43.5" r="2.4" fill="${cap}"/>`
      + shine('M25,28 Q23,40 25,52', 0.5, 2.2);
  },
  jar: ({ c, lid = '#c62828', label = '#d32f2f', herb = false }) => {
    const g = grad(c, 'h');
    return shadow(18) + R(15, 20, 34, 36, 8, g, 2.6) + R(13, 11, 38, 11, 3.5, lid, 2.4)
      + R(20, 32, 24, 16, 3, '#fff8e1', 1.9) + `<rect x="22" y="34" width="20" height="3" fill="${label}"/>` + `<circle cx="32" cy="43" r="2.8" fill="${label}"/>`
      + (herb ? P('M18,26 Q22,22 24,28 Q20,30 18,26 Z', '#66bb6a', 1.5) + P('M40,26 Q44,22 46,28 Q42,30 40,26 Z', '#66bb6a', 1.5) : '')
      + shine('M18,26 Q17,40 19,52', 0.4, 2.2);
  },
  bowlFood: ({ food, bowl = '#fcfaf2', mound = false, bits = [], bitC = '#ffffff', bitR = 1.6 }) => {
    const gb = grad(bowl, 'h'), gf = grad(food);
    return shadow(22) + P('M9,32 Q9,55 32,55 Q55,55 55,32 Z', gb, 2.6) + R(22, 53, 20, 4, 1.5, dk(bowl, 0.12), 1.8)
      + E(32, 32, 23, 7.5, lt(bowl, 0.2), 2.4) + E(32, 32, 20, 5.8, dk(food, 0.25), 1.6)
      + (mound ? P('M13,32 Q15,13 32,13 Q49,13 51,32 Q32,40 13,32 Z', gf, 2.4) : E(32, 31.5, 19.5, 5.4, gf, 0))
      + dots(bits, bitC, bitR) + shine('M16,24 Q22,17 31,16', 0.55, 2.2);
  },
  pile: ({ c, dotC, plate = '#fcfaf2', pts }) => {
    const g = grad(c);
    return shadow(24) + E(32, 47, 25, 9, grad(plate), 2.4) + P('M12,46 Q16,22 32,22 Q48,22 52,46 Q32,54 12,46 Z', g, 2.4)
      + dots(pts, dotC, 1.5) + shine('M20,36 Q24,27 32,26', 0.5, 2.2);
  },
  garlic: ({ c = '#f3e6d4', tint = '#caa98a' }) => {
    const g = grad(c);
    return shadow(18) + P('M32,6 Q35,15 41,20 Q52,27 49,42 Q46,55 32,55 Q18,55 15,42 Q12,27 23,20 Q29,15 32,6 Z', g, 2.6)
      + `<path d="M32,18 Q24,36 32,55 M32,18 Q40,36 32,55" fill="none" stroke="${tint}" stroke-width="1.8"/>`
      + `<path d="M26,55 L24,60 M32,55 L32,61 M38,55 L40,60" stroke="${OUT}" stroke-width="2" stroke-linecap="round"/>` + shine('M21,30 Q19,40 23,48', 0.55, 2.2);
  },
  bulb: ({ c, tint, leaves = false, root = true, tip = true }) => {
    const g = grad(c);
    let b = shadow(19);
    if (leaves) b += P('M32,18 Q22,8 16,4 Q14,14 24,22 Z', '#43a047', 2.2) + P('M32,18 Q42,8 48,4 Q50,14 40,22 Z', '#2e7d32', 2.2) + `<path d="M31,16 Q24,10 18,6 M33,16 Q40,10 46,6" stroke="#c62828" stroke-width="1.6" fill="none"/>`;
    b += tip ? P('M32,8 Q34,16 40,20 Q52,26 50,40 Q48,54 32,54 Q16,54 14,40 Q12,26 24,20 Q30,16 32,8 Z', g, 2.6)
      : E(32, 36, 19, 18, g, 2.6);
    b += `<path d="M32,12 Q22,34 32,54 M32,12 Q42,34 32,54 M24,22 Q16,38 24,52 M40,22 Q48,38 40,52" fill="none" stroke="${tint}" stroke-width="1.5" opacity="0.7"/>`;
    if (root) b += `<path d="M28,54 L26,59 M32,54 L32,60 M36,54 L38,59" stroke="${OUT}" stroke-width="2" stroke-linecap="round"/>`;
    return b + shine('M21,30 Q19,40 23,48', 0.5, 2.2);
  },
  chili: ({ c }) => {
    const g = grad(c, 'h');
    return shadow(22) + P('M12,22 C24,12 44,16 51,36 C54,46 51,54 44,59 C45,44 36,34 24,30 C17,28 12,26 12,22 Z', g, 2.6)
      + P('M12,22 C9,16 13,11 20,12 C20,16 17,19 12,22 Z', '#43a047', 2.2) + shine('M20,19 Q36,18 44,34', 0.5, 2.2);
  },
  wing: ({ c, glaze = '#e0a03a' }) => {
    const g = grad(c);
    return shadow(24) + P('M10,36 Q8,20 24,18 Q40,18 44,32 Q46,42 36,46 Q20,50 10,36 Z', g, 2.6)
      + P('M30,42 Q44,30 54,38 Q58,47 48,53 Q36,58 30,42 Z', lt(c, 0.12), 2.6)
      + `<rect x="6" y="38" width="9" height="6" rx="3" transform="rotate(35 10 41)" fill="#fff8e1" ${S(2)}/>`
      + dots([[20, 28], [28, 25], [38, 36], [46, 44]], glaze, 1.7) + shine('M16,26 Q22,21 30,22', 0.5, 2.2);
  },
  drumstick: ({ c }) => {
    const g = grad(c);
    return shadow(22) + `<g transform="rotate(-35 32 32)">` + `<rect x="27" y="40" width="10" height="16" rx="3" fill="#fff8e1" ${S(2.2)}/>` + C(26, 57, 3.5, '#fff8e1', 2) + C(38, 57, 3.5, '#fff8e1', 2)
      + P('M16,28 Q14,8 32,8 Q50,8 48,28 Q47,42 32,44 Q17,42 16,28 Z', g, 2.6) + `</g>` + shine('M22,18 Q27,12 34,13', 0.5, 2.2);
  },
  cutlet: ({ c, rim = null, grill = false }) => {
    const g = grad(c);
    return shadow(24) + P('M8,32 Q9,16 28,13 Q52,11 56,28 Q59,48 38,52 Q14,56 8,32 Z', g, 2.6)
      + (rim ? `<path d="M10,32 Q11,17 28,14.5 Q50,13 54,28" fill="none" stroke="${rim}" stroke-width="3.2" stroke-linecap="round" opacity="0.9"/>` : '')
      + (grill ? `<path d="M20,22 L36,46 M30,18 L46,42 M14,30 L28,50" stroke="${dk(c, 0.45)}" stroke-width="2.6" stroke-linecap="round" opacity="0.8"/>` : '')
      + `<path d="M18,30 Q30,22 44,28" fill="none" stroke="${lt(c, 0.35)}" stroke-width="2" opacity="0.7"/>` + shine('M16,24 Q22,18 32,17', 0.5, 2.2);
  },
  shrimp: ({ c = '#f08a4b', n = 1 }) => {
    const one = (tx, ty, s) => {
      const g = grad(c);
      return `<g transform="translate(${tx} ${ty}) scale(${s})">` + P('M10,40 Q12,16 34,16 Q52,16 52,34 Q52,45 43,49 Q47,36 35,30 Q22,28 22,42 Q22,52 10,40 Z', g, 2.6 / s)
        + P('M12,40 L5,49 L12,52 L17,47 Z', dk(c, 0.1), 2.2 / s) + `<path d="M26,18 Q22,28 26,40 M34,17 Q31,26 35,34 M42,20 Q40,26 44,32" fill="none" stroke="${dk(c, 0.35)}" stroke-width="${1.6 / s}"/>`
        + `<circle cx="46" cy="26" r="${2 / s}" fill="#2b1810"/>` + `<path d="M50,22 Q58,16 61,20" fill="none" stroke="${OUT}" stroke-width="${1.6 / s}" stroke-linecap="round"/></g>`;
    };
    return shadow(24) + (n === 1 ? one(0, 0, 1) : one(-3, 14, 0.62) + one(14, 6, 0.62) + one(-4, -2, 0.62));
  },
  fishBlock: ({ c, fat }) => {
    const gf = grad(c), gt = grad(lt(c, 0.2));
    return shadow(24) + P('M8,30 L44,30 L44,52 L8,52 Z', gf, 2.6) + P('M8,30 L20,19 L56,19 L44,30 Z', gt, 2.6) + P('M44,30 L56,19 L56,41 L44,52 Z', grad(dk(c, 0.2)), 2.6)
      + `<path d="M11,37 L41,37 M11,44 L41,44" stroke="${fat}" stroke-width="2" opacity="0.8"/>` + shine('M11,33 L30,33', 0.5, 1.8);
  },
  slices: ({ c, fat }) => {
    const one = (cx, cy, rot) => `<g transform="rotate(${rot} ${cx} ${cy})">` + E(cx, cy, 17, 8, grad(c), 2.4) + `<path d="M${cx - 12},${cy - 1} Q${cx},${cy - 4} ${cx + 12},${cy - 1}" fill="none" stroke="${fat}" stroke-width="1.8" opacity="0.85"/></g>`;
    return shadow(24) + one(26, 44, -8) + one(36, 34, 6) + one(28, 24, -4);
  },
  shell: ({ c = '#f2d6c0', rib = '#d9a98a' }) => {
    let ribs = '';
    for (let i = 0; i < 7; i++) { const t = i / 6; ribs += `<path d="M32,53 L${12 + 40 * t},${22 - 8 * Math.sin(Math.PI * t) + 6}" stroke="${rib}" stroke-width="1.8" opacity="0.9"/>`; }
    return shadow(22) + P('M32,54 L11,33 Q8,14 32,10 Q56,14 53,33 Z', grad(c), 2.6) + ribs + P('M24,56 L40,56 L36,50 L28,50 Z', dk(c, 0.15), 2.2) + shine('M18,24 Q24,15 34,14', 0.55, 2.2);
  },
  floret: ({ c = '#4caf50' }) => {
    const bl = (x, y, r) => C(x, y, r, grad(c), 2.3);
    return shadow(20) + P('M26,38 L38,38 L36,56 L28,56 Z', grad('#aed581'), 2.4) + bl(20, 30, 10) + bl(44, 30, 10) + bl(32, 20, 11) + bl(32, 32, 10)
      + dots([[24, 26], [30, 16], [38, 22], [44, 28], [20, 33], [34, 30], [28, 34]], dk(c, 0.3), 1.1) + shine('M24,14 Q30,10 38,13', 0.5, 2);
  },
  cabbage: ({ c = '#8bc34a', vein = '#e8f5c8' }) => shadow(22) + C(32, 34, 21, grad(c), 2.6)
    + `<path d="M32,13 Q18,28 32,55 M32,13 Q46,28 32,55 M14,34 Q32,26 50,34" fill="none" stroke="${vein}" stroke-width="1.8" opacity="0.85"/>` + P('M32,13 Q24,10 20,16 Q26,18 32,13 Z', dk(c, 0.1), 2) + shine('M20,24 Q24,17 32,15', 0.55, 2.2),
  strips: ({ c, paths, w = 4.5 }) => shadow(22) + paths.map(d => curl(d, c, w)).join(''),
  cubes: ({ c }) => {
    const cube = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">` + P('M0,6 L10,0 L20,6 L10,12 Z', lt(c, 0.3), 2.2 / s) + P('M0,6 L10,12 L10,24 L0,18 Z', c, 2.2 / s) + P('M10,12 L20,6 L20,18 L10,24 Z', dk(c, 0.25), 2.2 / s) + '</g>';
    return shadow(24) + cube(8, 30, 1) + cube(30, 32, 1) + cube(18, 16, 1) + cube(36, 14, 0.8);
  },
  leek: ({ white = '#f4f8e8', green = '#4caf50', n = 1, thick = 1, roots = false }) => {
    const stalk = (x, lean) => {
      const w = 7 * thick;
      return P(`M${x - w},${34} L${x - w + lean},56 L${x + w + lean},56 L${x + w},34 Z`, grad(white, 'h'), 2.3)
        + P(`M${x - w},34 Q${x - w - 4},18 ${x - 8 + lean},4 Q${x},16 ${x},34 Z`, grad(green), 2.2) + P(`M${x + w},34 Q${x + w + 4},18 ${x + 8 + lean},4 Q${x},16 ${x},34 Z`, grad(dk(green, 0.12)), 2.2)
        + `<path d="M${x},34 L${x + lean / 2},56" stroke="#cfd8b0" stroke-width="1.4"/>`
        + (roots ? `<path d="M${x - 4 + lean},56 L${x - 6 + lean},61 M${x + lean},56 L${x + lean},62 M${x + 4 + lean},56 L${x + 6 + lean},61" stroke="${OUT}" stroke-width="1.8" stroke-linecap="round"/>` : '');
    };
    return shadow(22) + (n === 1 ? stalk(32, 0) : stalk(20, -2) + stalk(32, 0) + stalk(44, 2));
  },
  zucchini: ({ c = '#43a047' }) => shadow(24) + `<g transform="rotate(-28 32 32)">` + R(8, 22, 48, 20, 10, grad(c), 2.6) + P('M8,32 Q4,32 4,29 Q6,24 10,26 Z', '#2e7d32', 2) + `<path d="M16,25 L16,39 M26,23 L26,41 M36,23 L36,41 M46,25 L46,39" stroke="${lt(c, 0.4)}" stroke-width="1.6" opacity="0.6"/></g>` + E(48, 40, 7, 4, '#e8f5c8', 2) + E(52, 49, 6, 3.4, '#e8f5c8', 2) + shine('M14,26 Q26,20 40,24', 0.5, 2),
  avocado: ({}) => shadow(20) + P('M32,5 Q44,11 46,29 Q50,50 32,58 Q14,50 18,29 Q20,11 32,5 Z', '#2e6b2b', 2.6) + P('M32,10 Q41,15 42,30 Q45,48 32,54 Q19,48 22,30 Q23,15 32,10 Z', grad('#b7d86a'), 2) + C(32, 41, 8.5, grad('#8a5a2b'), 2.2) + shine('M27,36 Q29,33 33,33', 0.55, 1.8),
  discs: ({ c = '#f6ead2' }) => shadow(24) + [48, 41, 34].map(y => R(10, y - 4, 44, 7, 3.5, grad(c, 'h'), 2.2)).join('') + E(32, 30, 22, 6, lt(c, 0.25), 2.4) + shine('M18,29 Q26,26 36,27', 0.6, 1.8),
  pepper: ({ c }) => {
    const g = grad(c, 'h');
    return shadow(20) + P('M18,26 Q13,44 21,54 Q32,61 43,54 Q51,44 46,26 Q40,20 32,24 Q24,20 18,26 Z', g, 2.6) + `<path d="M26,26 Q22,44 28,56 M38,26 Q42,44 36,56" fill="none" stroke="${dk(c, 0.2)}" stroke-width="1.6" opacity="0.7"/>`
      + P('M30,24 Q30,14 36,10 Q36,18 34,24 Z', '#43a047', 2.2) + shine('M20,32 Q18,42 22,50', 0.5, 2.4);
  },
  dumpling: ({ c = '#f6ead2', fold = '#e0c9a0' }) => shadow(24) + P('M8,46 Q32,6 56,46 Q32,58 8,46 Z', grad(c), 2.6)
    + `<path d="M16,44 Q32,16 48,44 M22,46 L22,38 M28,48 L28,32 M36,48 L36,32 M42,46 L42,38" fill="none" stroke="${fold}" stroke-width="1.7"/>` + shine('M18,38 Q26,24 36,22', 0.55, 2.2),
  omelet: ({ c = '#f2c14e', brown = '#c98a2b' }) => shadow(24) + E(32, 36, 25, 18, grad(c), 2.6) + `<path d="M10,36 Q32,20 54,36" fill="none" stroke="${brown}" stroke-width="2.4" opacity="0.8"/>` + `<path d="M12,42 Q32,52 52,42" fill="none" stroke="${brown}" stroke-width="3" opacity="0.5"/>` + shine('M16,30 Q24,22 34,22', 0.55, 2.2),
  nest: ({ c = '#e6b24a' }) => {
    let l = '';
    for (let i = 0; i < 8; i++) { const a = i * 0.8; l += `<path d="M${10 + i * 2},${34 + (i % 3) * 6} Q${26 + (i % 4) * 4},${14 + i * 3} ${54 - i * 2},${30 + (i % 3) * 7}" fill="none" stroke="${OUT}" stroke-width="5.2" stroke-linecap="round"/>`; }
    let f = '';
    for (let i = 0; i < 8; i++) { f += `<path d="M${10 + i * 2},${34 + (i % 3) * 6} Q${26 + (i % 4) * 4},${14 + i * 3} ${54 - i * 2},${30 + (i % 3) * 7}" fill="none" stroke="${i % 2 ? c : lt(c, 0.25)}" stroke-width="2.6" stroke-linecap="round"/>`; }
    return shadow(24) + l + f;
  },
  chunks: ({ c }) => {
    const blob = (x, y, s2, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s2})">` + P('M-14,2 Q-16,-12 -2,-14 Q14,-16 16,-2 Q18,12 2,14 Q-12,16 -14,2 Z', grad(c), 2.4 / s2) + `<path d="M-8,-4 Q0,-10 8,-5" fill="none" stroke="${lt(c, 0.5)}" stroke-width="${2 / s2}" stroke-linecap="round"/></g>`;
    return shadow(24) + blob(17, 46, 0.7, -15) + blob(46, 47, 0.68, 25) + blob(24, 24, 0.66, 8) + blob(47, 22, 0.62, -20);
  },
  shaker: ({}) => shadow(15) + P('M20,24 Q20,18 32,18 Q44,18 44,24 L44,52 Q44,57 38,57 L26,57 Q20,57 20,52 Z', 'rgba(220,235,245,0.9)', 2.6) + `<rect x="22" y="38" width="20" height="17" rx="3" fill="#ffffff" opacity="0.9"/>`
    + R(19, 10, 26, 10, 4, grad('#b0bec5', 'h'), 2.4) + dots([[27, 14.5], [32, 14.5], [37, 14.5]], OUT, 1.1) + dots([[26, 44], [32, 48], [37, 42], [30, 52], [38, 50]], '#cfd8dc', 1.3) + shine('M23,26 Q22,40 24,52', 0.6, 2),
  tub: ({ c = '#fff1c6' }) => shadow(24) + P('M8,36 L56,36 L56,52 Q56,56 52,56 L12,56 Q8,56 8,52 Z', grad('#cfd8dc', 'h'), 2.6) + P('M8,36 L14,20 L50,20 L56,36 Z', grad(c), 2.6)
    + `<path d="M12,44 L52,44" stroke="#90a4ae" stroke-width="1.6"/>` + P('M18,36 L20,28 L26,34 L32,26 L38,34 L44,28 L46,36 Z', '#eceff1', 2) + shine('M16,27 L26,23', 0.55, 2),
  steak: ({ c = '#b3262f' }) => shadow(24) + P('M8,34 Q8,14 30,12 Q54,10 57,30 Q58,52 34,54 Q10,56 8,34 Z', grad(c), 2.6) + `<path d="M18,22 L38,46 M28,16 L48,42 M12,32 L26,50" stroke="${dk(c, 0.5)}" stroke-width="2.8" stroke-linecap="round" opacity="0.85"/>` + `<path d="M12,30 Q12,18 28,15" fill="none" stroke="#f3dcc9" stroke-width="3" stroke-linecap="round" opacity="0.9"/>` + shine('M16,22 Q22,16 32,15', 0.5, 2),
  leaves: ({ c = '#66bb6a' }) => {
    const lf = (x, y, rot, col) => `<g transform="rotate(${rot} ${x} ${y})">` + P(`M${x},${y} Q${x - 9},${y - 12} ${x},${y - 20} Q${x + 9},${y - 12} ${x},${y} Z`, grad(col), 2.2) + `<path d="M${x},${y} L${x},${y - 17}" stroke="${dk(col, 0.25)}" stroke-width="1.4"/></g>`;
    return shadow(22) + lf(32, 54, -70, dk(c, 0.1)) + lf(32, 54, 70, dk(c, 0.1)) + lf(32, 54, -35, c) + lf(32, 54, 35, c) + lf(32, 54, 0, lt(c, 0.15));
  },
  sparkle: ({ c = '#ffd54f' }) => {
    const star = (x, y, r) => P(`M${x},${y - r} L${x + r * 0.3},${y - r * 0.3} L${x + r},${y} L${x + r * 0.3},${y + r * 0.3} L${x},${y + r} L${x - r * 0.3},${y + r * 0.3} L${x - r},${y} L${x - r * 0.3},${y - r * 0.3} Z`, grad(c), 2);
    return shadow(22) + E(32, 47, 24, 8, grad('#6d4c41'), 2.4) + P('M12,46 Q16,30 32,30 Q48,30 52,46 Q32,54 12,46 Z', grad('#c9892f'), 2.4) + star(32, 20, 12) + star(14, 28, 6) + star(50, 26, 7)
      + dots([[24, 42], [34, 38], [42, 44], [30, 47]], '#ffe082', 1.4);
  },
  salad: ({ cold = false }) => {
    const bowl = cold ? '#d6ecf5' : '#fcfaf2';
    const lf = (x, y, rot, col) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="4.2" transform="rotate(${rot} ${x} ${y})" fill="${col}" ${S(1.8)}/>`;
    return shadow(22) + P('M9,32 Q9,55 32,55 Q55,55 55,32 Z', grad(bowl, 'h'), 2.6) + R(22, 53, 20, 4, 1.5, dk(bowl, 0.12), 1.8) + E(32, 32, 23, 7.5, lt(bowl, 0.2), 2.4)
      + lf(22, 26, -20, '#81c784') + lf(40, 25, 20, '#66bb6a') + lf(31, 22, 0, '#aed581') + C(26, 30, 4.4, '#e53935', 1.8) + C(38, 29, 4, '#ef5350', 1.8)
      + (cold ? dots([[20, 22], [44, 22], [32, 17]], '#e1f5fe', 2.6) + `<path d="M12,16 L16,20 M52,16 L48,20" stroke="#4fc3f7" stroke-width="2" stroke-linecap="round"/>` : `<path d="M28,30 Q32,25 36,30" fill="none" stroke="#ffd54f" stroke-width="2.4" stroke-linecap="round"/>`)
      + shine('M14,28 Q18,22 24,20', 0.5, 2);
  },
  riceDish: ({ c = '#fff9ec', plate = '#fcfaf2', fleck }) => shadow(24) + E(32, 46, 26, 10, grad(plate), 2.5) + P('M12,46 Q14,22 32,22 Q50,22 52,46 Q32,56 12,46 Z', grad(c), 2.5)
    + dots([[22, 38], [28, 31], [36, 30], [42, 38], [30, 44], [38, 46], [24, 46], [46, 44]], fleck || '#e0dac1', 1.5) + shine('M20,36 Q24,28 32,27', 0.6, 2),
  hangiri: ({}) => shadow(25) + P('M7,40 Q7,56 32,56 Q57,56 57,40 Z', grad('#c58a4a', 'h'), 2.6) + `<path d="M10,46 L54,46" stroke="#8d5a2b" stroke-width="1.6"/>` + `<path d="M8,51 L56,51" stroke="#8d5a2b" stroke-width="1.6"/>` + E(32, 40, 25, 8, lt('#c58a4a', 0.2), 2.4)
    + P('M13,40 Q15,17 32,17 Q49,17 51,40 Q32,48 13,40 Z', grad('#fff9ec'), 2.4) + dots([[22, 32], [29, 25], [37, 26], [44, 34], [31, 38], [25, 40], [40, 40]], '#e0dac1', 1.5) + shine('M20,31 Q24,22 32,21', 0.6, 2),
  flour: ({}) => T.bowlFood({ food: '#ffffff', bowl: '#e8dcc4', mound: true, bits: [[24, 18], [38, 19], [46, 25], [20, 26]], bitC: '#e8e4d8', bitR: 1.3 }),
  crumbs: ({}) => T.pile({ c: '#e6b956', dotC: '#fff0c4', plate: '#fcfaf2', pts: [[22, 34], [28, 28], [36, 29], [42, 36], [30, 40], [38, 41], [25, 42], [46, 42], [33, 34]] }),
};

// ---------- catálogo: id -> [slug, plantilla] ----------
const sauce = (c, cap, accent) => ['bottle', { c, cap, accent }];
const ICONS = {
  31: ['aceite_ajonjoli', 'bottle', { c: '#d9a21b', cap: '#8d5a2b', accent: '#6d4c41' }],
  32: ['ajo_chino', 'garlic', {}],
  33: ['ajonjoli', 'pile', { c: '#fff4d6', dotC: '#d7c18a', plate: '#c58a4a', pts: [[22, 38], [29, 30], [36, 31], [42, 38], [31, 42], [26, 46], [38, 45]] }],
  34: ['ajonjoli_negro', 'pile', { c: '#3a3a3a', dotC: '#9e9e9e', plate: '#c58a4a', pts: [[22, 38], [29, 30], [36, 31], [42, 38], [31, 42], [26, 46], [38, 45]] }],
  35: ['aji_limo', 'chili', { c: '#f4b21c' }],
  36: ['alas_pollo', 'wing', { c: '#e8b06a' }],
  37: ['arroz', 'riceDish', {}],
  38: ['arroz_shari', 'hangiri', {}],
  39: ['atun', 'fishBlock', { c: '#b3262f', fat: '#ef9a9a' }],
  40: ['base_shimaya', 'jar', { c: '#8a4b1e', lid: '#2b1810', label: '#c62828' }],
  41: ['benishoga', 'strips', { c: '#d6283a', w: 3.6, paths: ['M12,44 Q22,28 32,40 Q40,48 52,32', 'M14,52 Q28,40 36,50 Q44,56 54,44', 'M16,36 Q26,22 38,30 Q46,36 52,24'] }],
  42: ['beterraga', 'bulb', { c: '#9c2f5a', tint: '#d9709b', leaves: true, root: true, tip: false }],
  43: ['bife_cerdo', 'cutlet', { c: '#e8909a', rim: '#fff3e0' }],
  44: ['bife_pollo', 'cutlet', { c: '#f4d2b0', rim: null }],
  45: ['brocoli', 'floret', {}],
  46: ['cebolla', 'bulb', { c: '#e0a85a', tint: '#8d5a2b', tip: true }],
  47: ['cecina', 'strips', { c: '#8a4a2a', w: 6.5, paths: ['M10,46 Q24,38 38,46 Q48,52 56,44', 'M10,34 Q24,26 38,34 Q48,40 56,32', 'M12,22 Q26,14 40,22 Q48,26 54,20'] }],
  48: ['chancho_chaufa', 'cubes', { c: '#d98b6c' }],
  49: ['cobertura_atun', 'slices', { c: '#d9444f', fat: '#f8bbd0' }],
  50: ['cobertura_conchas', 'shell', {}],
  51: ['cobertura_amazon', 'leaves', { c: '#5fae4a' }],
  52: ['col', 'cabbage', {}],
  53: ['condimentos', 'jar', { c: '#b23a2a', lid: '#2b1810', label: '#2e7d32', herb: true }],
  54: ['ebi', 'shrimp', { c: '#f08a4b', n: 1 }],
  55: ['ensalada', 'salad', { cold: false }],
  56: ['ensalada_fria', 'salad', { cold: true }],
  57: ['gohan', 'bowlFood', { food: '#fff9ec', bowl: '#fcfaf2', mound: true, bits: [[24, 20], [32, 16], [40, 20], [28, 25], [37, 26]], bitC: '#e0dac1' }],
  58: ['harina', 'flour', {}],
  59: ['hilos_wantan', 'nest', {}],
  60: ['langostino_6', 'shrimp', { c: '#f08a4b', n: 3 }],
  61: ['lomo', 'steak', { c: '#b3262f' }],
  62: ['mayonesa_casa', 'squeeze', { c: '#fff3d6', cap: '#c62828' }],
  63: ['negi', 'leek', { n: 3, thick: 0.6 }],
  64: ['palta', 'avocado', {}],
  65: ['panko', 'crumbs', {}],
  66: ['pasta_gyoza', 'discs', {}],
  67: ['pimenton', 'pepper', { c: '#d9442a' }],
  68: ['pimiento', 'pepper', { c: '#5aa646' }],
  69: ['pollo', 'drumstick', { c: '#f1c7a2' }],
  70: ['pollo_7', 'chunks', { c: '#f1c7a2' }],
  71: ['poro_especial', 'leek', { n: 1, thick: 1.15, roots: true, green: '#2e8b57' }],
  72: ['queso_crema', 'tub', {}],
  73: ['relleno_gyoza', 'bowlFood', { food: '#e9a79b', bowl: '#fcfaf2', mound: true, bits: [[24, 22], [32, 17], [40, 22], [36, 26], [27, 27]], bitC: '#f08a4b', bitR: 2 }],
  74: ['rulos_cebolla', 'strips', { c: '#5fc04a', w: 4, paths: ['M10,42 C14,22 30,22 28,36 C26,46 16,44 20,36 C24,28 40,32 46,22', 'M18,56 C24,44 36,48 40,40 C44,34 52,38 54,30'] }],
  75: ['sal', 'shaker', {}],
  76: ['salsa', ...sauce('#d9381e', '#f4b21c', '#f4b21c')],
  77: ['salsa_acevichada', ...sauce('#f4b942', '#2e8b57', '#2e8b57')],
  78: ['salsa_batayaki', ...sauce('#8a5a2b', '#d4a017', '#d4a017')],
  79: ['salsa_chaufa', ...sauce('#5a2e14', '#c62828', '#c62828')],
  80: ['salsa_digion', ...sauce('#c79a1f', '#1a237e', '#1a237e')],
  81: ['salsa_guacamole', 'bowlFood', { food: '#8bc34a', bowl: '#fcfaf2', mound: false, bits: [[22, 31], [30, 29], [40, 32], [35, 34], [27, 34]], bitC: '#33691e', bitR: 1.8 }],
  82: ['salsa_hotate', ...sauce('#fff0cc', '#1e6fa8', '#1e6fa8')],
  83: ['salsa_kare', 'bowlFood', { food: '#b8860b', bowl: '#fcfaf2', mound: false, bits: [[24, 31], [32, 29], [40, 32], [36, 34], [28, 34]], bitC: '#e8a33c', bitR: 2.4 }],
  84: ['salsa_katsu', ...sauce('#6b2a14', '#2b1810', '#c62828')],
  85: ['salsa_nin_niku', ...sauce('#b08a5c', '#f5f5f5', '#8d6e63')],
  86: ['salsa_omuraisu', ...sauce('#c0392b', '#f4d03f', '#f4d03f')],
  87: ['salsa_teriyaki', ...sauce('#4a2310', '#ef6c00', '#ef6c00')],
  88: ['salsa_yakitori', ...sauce('#b9651c', '#c62828', '#c62828')],
  89: ['salsa_yama', ...sauce('#e8742a', '#2b1810', '#2b1810')],
  90: ['salsa_yasaitame', ...sauce('#7a8a2f', '#2e7d32', '#2e7d32')],
  91: ['togarashi', 'pile', { c: '#d3381c', dotC: '#ffcc80', plate: '#c58a4a', pts: [[22, 38], [29, 30], [36, 31], [42, 38], [31, 42], [26, 46], [38, 45]] }],
  92: ['toping', 'sparkle', {}],
  93: ['tortilla', 'omelet', {}],
  94: ['wantan', 'dumpling', {}],
  95: ['zucchini', 'zucchini', {}],
};

fs.mkdirSync(DEST, { recursive: true });
let n = 0;
for (const [id, [slug, tpl, opts]] of Object.entries(ICONS)) {
  defs = []; gid = 0;
  const body = T[tpl](opts || {});
  fs.writeFileSync(path.join(DEST, `ing_${id}_${slug}.svg`), wrap(body));
  n++;
}
// Manifiesto id -> archivo, para enlazar el catálogo del juego.
const manifest = Object.fromEntries(Object.entries(ICONS).map(([id, [slug]]) => [id, `assets/ingredients/ing_${id}_${slug}.svg`]));
fs.writeFileSync(path.join(HERE, 'ingredient-icons.manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${n} iconos generados en ${DEST}`);
