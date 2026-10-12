/* Emplatado de Frituras (arriba: ensalada al centro, arroz a la izquierda, salsa de acompañamiento a la derecha · abajo: la proteína).
   Usa los ayudantes de dibujo de Salteado (salScatter, salThreads, salCoil, salMound, SAL_INK) definidos en index.html. */
(function () {
  const INK = '#3a2b20';
  const PANKO = '#d9993a', PANKO_HI = '#f0c06a', FRIED = '#c8832e';

  // ---- proteínas (mitad inferior del plato) ----
  function slices(meat, n) {                                    // bife cortado: rodajas con su costra de panko y el corte a la vista
    let h = '';
    const xs = Array.from({ length: n }, (_, i) => 31 + i * (48 / (n - 1)));
    xs.forEach((x, i) => {
      const rot = (i - (n - 1) / 2) * 5, y = 59 + Math.abs(i - (n - 1) / 2) * 0.9;
      h += `<g transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"><rect x="${(x - 5.2).toFixed(1)}" y="${y - 11}" width="10.4" height="22" rx="3.2" fill="${PANKO}" stroke="${INK}" stroke-width="1"/>
        <rect x="${(x - 3.4).toFixed(1)}" y="${y - 9}" width="6.8" height="18" rx="2" fill="${meat}"/><path d="M ${(x - 4).toFixed(1)},${y - 6} q 4,-3 8,0 M ${(x - 4).toFixed(1)},${y + 6} q 4,3 8,0" fill="none" stroke="${PANKO_HI}" stroke-width="1" stroke-linecap="round"/></g>`;
    });
    return h;
  }
  function kareOver() {                                         // salsa kare por encima: baña todas las rodajas
    return `<path d="M 27,53 q 6,-8 28,-8 q 22,0 28,8 q 3,7 -2,11 q -3,-2 -5,2 q -3,-3 -6,2 q -4,-3 -7,2 q -5,-3 -9,2 q -5,-3 -9,1 q -5,-3 -8,1 q -5,-3 -7,1 q -4,-8 -3,-13 Z" fill="#7a3d12" stroke="#4a2008" stroke-width="1"/>
      <path d="M 33,52 q 12,-5 26,-3 M 40,57 q 9,-3 20,-1" fill="none" stroke="#b9772f" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
      <ellipse cx="46" cy="51" rx="7" ry="2" fill="#c98a45" opacity="0.5"/>`;
  }
  function shrimp(n) {                                          // langostinos empanizados, parados y paralelos, con la colita al frente
    const xs = Array.from({ length: n }, (_, i) => 28 + i * (54 / (n - 1)));
    return xs.map((x, i) => {
      const y = 57 + (i % 2 ? 1.5 : 0), rot = (i - (n - 1) / 2) * 3;
      return `<g transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y})"><path d="M ${(x - 4.6).toFixed(1)},${y - 10} q 4.6,-5 9.2,0 q 1.6,9 -0.8,17 q -3.8,2 -7.6,0 q -2.4,-8 -0.8,-17 Z" fill="${PANKO}" stroke="${INK}" stroke-width="1"/>
        <path d="M ${(x - 2.6).toFixed(1)},${y - 7} q 2.6,-2 5.2,0 M ${(x - 3).toFixed(1)},${y - 2} q 3,-2 6,0 M ${(x - 2.8).toFixed(1)},${y + 3} q 2.8,-2 5.6,0" fill="none" stroke="${PANKO_HI}" stroke-width="1" stroke-linecap="round"/>
        <path d="M ${(x - 3.6).toFixed(1)},${y + 7.5} l 3.6,6.5 l 3.6,-6.5 Z" fill="#e8642c" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/></g>`;
    }).join('');
  }
  function nuggets(n) {                                         // pollo kaarage: piezas irregulares amontonadas
    const pos = [[38, 62, 0], [51, 58, 1], [64, 62, 2], [76, 58, 3], [44, 70, 4], [58, 68, 5], [71, 69, 6]];
    return pos.slice(0, n).map(([x, y, i]) => `<g transform="rotate(${(i * 47) % 70 - 30} ${x} ${y})"><path d="M ${x - 8},${y} q -1,-7 6,-8 q 4,-3 9,0 q 7,1 7,8 q 1,7 -7,8 q -5,3 -9,0 q -6,-1 -6,-8 Z" fill="${FRIED}" stroke="${INK}" stroke-width="1"/>
      <path d="M ${x - 5},${y - 3} q 4,-4 8,-1" fill="none" stroke="${PANKO_HI}" stroke-width="1.3" stroke-linecap="round"/><circle cx="${x + 3}" cy="${y + 2}" r="1" fill="#e9b45c"/><circle cx="${x - 3}" cy="${y + 3}" r="0.9" fill="#e9b45c"/></g>`).join('');
  }
  function wings(n, sauced) {
    const pos = [[38, 58, -18], [52, 55, 8], [66, 58, -8], [77, 62, 22], [46, 67, 10], [61, 67, -16]];
    const body = sauced ? '#a8381a' : '#c9893a', hi = sauced ? '#e8704a' : '#e9c37a';
    return pos.slice(0, n).map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="9" ry="4.8" fill="${body}" stroke="${INK}" stroke-width="1"/><path d="M ${x - 5},${y - 2} q 5,-3 10,0" fill="none" stroke="${hi}" stroke-width="1.4" stroke-linecap="round"/>
      <rect x="${x + 7}" y="${y - 1.4}" width="6" height="2.8" rx="1.4" fill="#f6efe0" stroke="${INK}" stroke-width="0.8"/></g>`).join('');
  }
  function gyozas(n) {                                          // gyozas en fila sobre la cama de verduras, fritas por abajo
    const xs = Array.from({ length: n }, (_, i) => 24 + i * (62 / (n - 1)));
    return xs.map((x, i) => {
      const y = 49 + (i % 2 ? 0.8 : 0);
      return `<g><path d="M ${(x - 9.5).toFixed(1)},${y + 2} q 9.5,-15 19,0 q -9.5,5.5 -19,0 Z" fill="#f6e3b0" stroke="${INK}" stroke-width="1"/><path d="M ${(x - 9).toFixed(1)},${y + 2.4} q 9,4 18,0" fill="none" stroke="#c98a3a" stroke-width="2" stroke-linecap="round"/>
        <path d="M ${(x - 5.5).toFixed(1)},${y - 3.4} l 0.8,2.6 M ${(x - 2.5).toFixed(1)},${y - 5} l 0.4,3 M ${(x + 0.6).toFixed(1)},${y - 5.2} l 0,3 M ${(x + 3.6).toFixed(1)},${y - 4.4} l -0.5,2.8 M ${(x + 6).toFixed(1)},${y - 2.6} l -0.9,2.2" stroke="#b8923f" stroke-width="0.9" stroke-linecap="round"/></g>`;
    }).join('');
  }

  // ---- guarniciones ----
  const rice = () => `<g>${salMound('#fbfaf3', '#ffffff', 22, 29, 13, 9)}${salScatter(14, 61, 22, 29, 10, 5, (x, y, i, r) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.3" ry="0.7" fill="#e5dfc8" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`)}</g>`;
  const col = () => `<ellipse cx="55" cy="29" rx="17" ry="11" fill="#e4eed0" stroke="${INK}" stroke-width="1.1"/>` + salThreads(30, 71, 55, 28, 14, 7, ['#d7ecb0', '#f2f8dc', '#bfe39a'], 1.5, 9);
  const mayoBath = hasCol => hasCol
    ? `<path d="M 43,25 q 6,-6 14,-5 q 8,0 12,6 q 3,5 -2,8 q -4,-3 -7,0 q -4,-3 -8,1 q -5,-2 -9,1 q -6,-3 0,-11 Z" fill="#fff3cf" opacity="0.88" stroke="#e3cf9a" stroke-width="0.6"/><ellipse cx="52" cy="24" rx="5" ry="1.6" fill="#fffdf2" opacity="0.8"/>`
    : `<ellipse cx="55" cy="30" rx="8" ry="5" fill="#fff3cf" stroke="#e3cf9a" stroke-width="0.8"/>`;
  const crown = (id) => id === 30 ? salThreads(16, 77, 55, 23, 8, 4, ['#f0872a', '#f6a24a'], 1.6, 9) : salThreads(16, 78, 55, 23, 8, 4, ['#8e1f5b', '#b02f78'], 1.6, 9);
  function cup(color, hi, glossy) {
    return `<ellipse cx="88" cy="29" rx="10" ry="6.4" fill="#f4f1e8" stroke="${INK}" stroke-width="1.1"/><ellipse cx="88" cy="28.4" rx="7.8" ry="4.6" fill="${color}"/>
      <path d="M 83,27 q 4,-2.4 8,-0.4" fill="none" stroke="${hi}" stroke-width="${glossy ? 1.6 : 1.1}" stroke-linecap="round" opacity="0.85"/>`;
  }
  const SAUCE_CUP = { 84: ['#4a1f10', '#a8603a', true], 87: ['#3b1a0c', '#d08a3e', true], 62: ['#fff1c9', '#ffffff', false] };

  // ---- decoración ----
  const coils = pos => pos.map(([x, y]) => `<g>${salCoil(x, y)}</g>`).join('');
  const onionBits = (seed, cx, cy, rx, ry) => salScatter(9, seed, cx, cy, rx, ry, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.1" fill="none" stroke="#3f9e3a" stroke-width="0.9"/>`);
  const togarashi = (seed, cx, cy, rx, ry) => salScatter(24, seed, cx, cy, rx, ry, (x, y, i, r) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1" ry="0.55" fill="${i % 2 ? '#d1381f' : '#e8742a'}" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
  const topping = (cx, cy, rx, ry) => salScatter(14, 83, cx, cy, rx, ry, (x, y, i, r) => `<path d="M ${x.toFixed(1)},${(y - 1.6).toFixed(1)} v 3.2 M ${(x - 1.6).toFixed(1)},${y.toFixed(1)} h 3.2" stroke="${i % 2 ? '#fff7d6' : '#ffd96a'}" stroke-width="0.9" stroke-linecap="round"/>`);

  const DISHES = {
    'Chicken Katsu': { kind: 'katsu', meat: '#f6e7c6', n: 5 },
    'Tonkatsu': { kind: 'katsu', meat: '#f2cfae', n: 5 },
    'Katsu Kare': { kind: 'katsu', meat: '#f2cfae', n: 5 },
    'Ebi Furai': { kind: 'ebi', n: 6 },
    'Kaarage': { kind: 'kaarage', n: 7 },
    'Alitas': { kind: 'alitas', n: 6 },
    'Age Gyozas': { kind: 'gyoza', n: 6 }
  };

  window.friPlateHtml = function (dish, plateItems, item) {
    const d = DISHES[dish];
    if (!d) return null;
    const last = plateItems[plateItems.length - 1], has = id => plateItems.includes(id), kare = !!(item && item.vis && item.vis.kare);
    const tone = { CRUDO: 'saturate(0.7) brightness(1.12)', QUEMADO: 'brightness(0.5) saturate(0.75)' }[item && item.result] || 'none';
    const pop = (id, svg) => `<g class="${id === last ? 'sal-pop' : ''}">${svg}</g>`;
    let under = '', prot = '', over = '';
    // ensalada (arriba al centro): col rallada + mayonesa + hilos de zanahoria o betarraga encima
    if (d.kind === 'gyoza') {                                   // línea muy ligera de col y betarraga al medio, donde reposan las gyozas
      if (has(52)) under += pop(52, `<path d="M 16,52 q 39,-9 78,0 q -39,6 -78,0 Z" fill="#e4eed0" stroke="#a9c47f" stroke-width="0.8" opacity="0.9"/>` + salThreads(26, 91, 55, 51, 34, 2.6, ['#d7ecb0', '#f2f8dc', '#9ccc65'], 1.4, 8));
      if (has(42)) under += pop(42, salThreads(14, 92, 55, 51, 33, 2.6, ['#8e1f5b', '#b02f78'], 1.4, 8));
      const gc = has(87) ? 87 : 0;
      if (gc) under += pop(87, cup(...SAUCE_CUP[87]));
    } else {
      if (has(57) && d.kind !== 'ebi' && d.kind !== 'kaarage') under += pop(57, rice());
      if (has(52)) under += pop(52, col());
      if (has(62)) under += pop(62, mayoBath(has(52)));
      if (has(30)) under += pop(30, crown(30));
      if (has(42)) under += pop(42, crown(42));
      const cupId = [84, 87, 62].find(id => has(id) && (id !== 62 || d.kind === 'kaarage'));
      if (cupId) under += pop(cupId, cup(...SAUCE_CUP[cupId]));
    }
    // proteína (mitad inferior)
    if (d.kind === 'katsu') prot = slices(d.meat, d.n) + (kare ? kareOver() : '');
    else if (d.kind === 'ebi') prot = shrimp(d.n);
    else if (d.kind === 'kaarage') prot = nuggets(d.n);
    else if (d.kind === 'alitas') prot = '<g transform="translate(-14 -34) scale(1.25)">' + wings(d.n, has(76)) + (has(76) ? pop(76, '<path d="M 36,63 q 4,5 0,9 M 58,62 q 4,5 0,10 M 72,66 q 3,4 0,8" fill="none" stroke="#7d2a12" stroke-width="2" stroke-linecap="round" opacity="0.8"/>') : '') + '</g>';
    else prot = gyozas(d.n);
    // decoración: rulos de cebolla china + cebolla picada y togarashi
    if (has(74)) over += pop(74, d.kind === 'gyoza' ? coils([[30, 40], [46, 39], [62, 40], [77, 41]]) + onionBits(95, 55, 60, 30, 8) : coils([[40, 50], [56, 48], [71, 50]]) + onionBits(96, 55, 66, 32, 6));
    if (has(91)) over += pop(91, togarashi(97, 55, d.kind === 'gyoza' ? 58 : 58, 28, d.kind === 'gyoza' ? 9 : 10));
    if (has(92)) over += pop(92, d.kind === 'alitas' ? topping(57, 42, 26, 10) : topping(55, 60, 28, 9));
    return `<div class="fp-bowl"><div class="sal-plate">
      <svg viewBox="0 0 110 80" aria-hidden="true"><ellipse cx="55" cy="42" rx="53" ry="36" fill="#f7f2e6" stroke="#b9ae92" stroke-width="3"/><ellipse cx="55" cy="42" rx="44" ry="29" fill="none" stroke="#e1d9c2" stroke-width="1.5"/></svg>
      <svg viewBox="0 0 110 80" aria-hidden="true">${under}</svg>
      <svg viewBox="0 0 110 80" aria-hidden="true" style="filter:${tone}">${prot}</svg>
      <svg viewBox="0 0 110 80" aria-hidden="true">${over}</svg></div></div>`;
  };
})();
