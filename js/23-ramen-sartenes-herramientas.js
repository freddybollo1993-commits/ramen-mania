/* Módulo 23-ramen-sartenes-herramientas — Ramen: sartenes, herramientas (salsas, aceite, flameador) y cocina dibujada.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// ---- Cocina de 4 hornillas (Ramen con etapas): 1 fideos · 2 Shio · 3 y 4 sartenes hondas ----
// En las sartenes se preparan todos los caldos con salsa, mezclando en el orden de la receta (caldo → salsa → proteína); al estar
// completos se calientan unos segundos y entonces se sirven al cuenco activo (que ya debe tener sus fideos). Ebi y Tan tan además
// empiezan con un sofrito. El Shio solo (sin salsa) se sirve directo desde su hornilla.
//   fry: se sofríe primero (juntos) · add: se agrega en orden · top: lo que se coloca encima del cuenco tras servir la sopa
//   needs: lo que el cuenco debe llevar ya antes de recibir la sopa
const PAN_RECIPES = {
  'Shoyu':       { add: [2, 5], oil: 'broth' },                    // oil: 'fry' = se agrega al sofreír · 'broth' = al caldo cuando hierve; sin aceite baja la calidad
  'Miso':        { add: [2, 6], oil: 'broth' },
  'Tonkotsu':    { add: [3], oil: 'broth' },                                   // (y Chashu: misma preparación); si se calienta de más hace espuma y se desborda
  'Vegetariano': { add: [4, 9], oil: 'broth' },                                // el tofu se sirve al emplatar
  'Bajiru':      { add: [2, 10, 12], top: [12], topNeedsSpread: true },   // el brisket se calienta con el caldo, se retira y se agrega tras mover los fideos con el caldo
  'Ebi':         { fry: [14], add: [2, 7], top: [14], oil: 'fry' },
  'Tan tan':     { fry: [13, 8], add: [2], needs: [1, 25], oil: 'fry' }
};
const OIL_ID = 31;   // aceite de ajonjolí (botella de la franja de herramientas)
const PAN_ONLY_IDS = [3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14];   // con etapas solo entran por una sartén (el 2, Shio, también va directo al cuenco)
const panAll = r => [...(r.fry || []), ...r.add];
const panServeIds = r => panAll(r).filter(id => !(r.top || []).includes(id));
// segundos; heat = calentar el caldo completo · dry = en caliente y con fuego, tiempo hasta secarse · foam = tiempo hasta desbordarse (Tonkotsu)
const panTimes = () => (isFree() ? { ready: 2, over: 1e9, burn: 1e9, heat: 2, dry: 1e9, foam: 1e9 } : { ready: 4, over: 9, burn: 14, heat: 4, dry: 25, foam: 12 });
function newPan() { return { items: [], t: 0, heat: 0, locked: false, fryStarted: false, result: null, errors: 0, served: false, target: null, burnt: false, dried: false, fire: false, vol: 100, foam: 0, dashiBase: false, recipe: null, oil: false }; }
function panGet(i) { if (!gameState.pans) gameState.pans = [newPan(), newPan()]; return gameState.pans[i]; }

// Recetas de sartén compatibles con lo que ya hay dentro (en el sofrito, lo del sofrito va primero)
function panCandidates(items) {
  return Object.keys(PAN_RECIPES).filter(n => {
    const r = PAN_RECIPES[n];
    if (!items.every(id => panAll(r).includes(id))) return false;
    if (r.fry) {
      const seen = new Set();
      for (const id of items) { if (!r.fry.includes(id) && !r.fry.every(f => seen.has(f))) return false; seen.add(id); }
    }
    return true;
  });
}
function panRecipeName(pan) {
  if (pan.recipe) return pan.recipe;
  const c = panCandidates(pan.items);
  return c.length === 1 ? c[0] : null;
}
const panNext = pan => { const n = panRecipeName(pan); return n ? PAN_RECIPES[n].add.find(id => !pan.items.includes(id)) : null; };

function panPhase(pan) {
  if (!pan.items.length) return 'EMPTY';
  if (pan.burnt) return 'BURNT';
  if (pan.dried) return 'DRIED';
  if (pan.served) return 'TOP';
  const rn = panRecipeName(pan), r = rn && PAN_RECIPES[rn];
  if (r && r.fry) {
    if (!r.fry.every(id => pan.items.includes(id))) return 'WAIT';
    if (!pan.locked) { const T = panTimes(); return pan.t < T.ready ? 'RAW' : (pan.t < T.over ? 'GOOD' : 'OVER'); }
  }
  if (r && r.add.every(id => pan.items.includes(id))) return pan.heat >= panTimes().heat ? 'HOT' : 'HEAT';
  return 'ADDING';
}
function panStatusText(pan, ph) {
  const rn = panRecipeName(pan), r = rn && PAN_RECIPES[rn];
  const missing = r ? r.add.filter(id => !pan.items.includes(id)).map(stIngName).join(', ') : '';
  const off = !pan.fire ? '🔥 Enciende · ' : '';
  switch (ph) {
    case 'EMPTY': return 'Vacía';
    case 'WAIT': return 'Sofreír: falta ' + r.fry.filter(id => !pan.items.includes(id)).map(stIngName).join(', ');
    case 'RAW': return off + '🍳 Sofriendo…';
    case 'GOOD': return off + '✅ Agrega ' + stIngName(panNext(pan));
    case 'OVER': return '⚠ Se pasa: agrega ya';
    case 'BURNT': return '🔥 Quemado: vacía';
    case 'DRIED': return '💨 Se secó: vacía';
    case 'ADDING': return r ? 'Falta: ' + missing : 'Agrega salsa…';
    case 'HEAT': return pan.fire ? '♨️ Calentando…' : '🔥 Enciende la hornilla';
    case 'HOT':
      if (rn === 'Tonkotsu' && pan.foam >= 40) return `⚠ Espuma ${Math.round(pan.foam)}%: apaga`;
      if (pan.fire && pan.vol < 100) return `✅ Servir · caldo ${Math.round(pan.vol)}%`;
      return `✅ ${rn}: servir`;
    case 'TOP': return r && r.topNeedsSpread ? 'Mueve fideos; toca: poner' : 'Toca: poner arriba';
  }
  return '';
}

function generatePanSVG(pan, ph) {
  const has = id => pan.items.includes(id);
  const tone = pan.locked ? (pan.result === 'PASADO' ? 2 : 1) : ({ RAW: 0, WAIT: 0, GOOD: 1, OVER: 2, BURNT: 3 }[ph] || 0);
  const meat = ['#e6a5a0', '#a8603f', '#5b3a22', '#1e130b'][tone], shr = ['#d9c2bb', '#f08a4b', '#c25a24', '#2a1a10'][tone];
  const pts = [[30, 33], [34, 36], [38, 32], [42, 36.5], [46, 33], [50, 37], [54, 33.5], [58, 36], [40, 40], [47, 40.5], [35, 30], [52, 30.5], [60, 39], [44, 29.5]];
  const sauceCol = { 5: '#793e18', 6: '#994d1a', 7: '#d65a29', 8: '#bd2c08', 9: '#6f9a3a', 10: '#4a6730' };
  const sauce = [5, 6, 7, 8, 9, 10].find(has);
  const base = has(3) ? '#f5eedb' : (has(4) ? '#cfe3e8' : (has(2) ? '#dfb552' : null));
  const vk = Math.sqrt(Math.max(0.06, (typeof pan.vol === 'number' ? pan.vol : 100) / 100));   // el caldo se va reduciendo
  const rx = (28 * vk).toFixed(1), ry = (11.5 * vk).toFixed(1);
  let food = '';
  if (sauce && !base) food += `<ellipse cx="46" cy="35" rx="22" ry="8" fill="${sauceCol[sauce]}" opacity="0.9"/>`;
  if (base) {
    food += `<ellipse cx="46" cy="34.5" rx="${rx}" ry="${ry}" fill="${base}" opacity="0.94"/>`;
    if (sauce) food += `<ellipse cx="46" cy="34.5" rx="${rx}" ry="${ry}" fill="${sauceCol[sauce]}" opacity="0.62"/>`;
  }
  if (has(13)) food += `<g fill="${meat}" stroke="rgba(0,0,0,0.35)" stroke-width="0.4">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7"/>`).join('')}</g>`;
  if (has(14)) food += `<g fill="${shr}" stroke="rgba(0,0,0,0.45)" stroke-width="0.8" stroke-linecap="round"><path d="M 34,36 q 3,-10 11,-5 q 5,4 -1,8 q -4,1 -4,-3"/><path d="M 48,38 q 3,-9 11,-4 q 5,4 -1,7 q -4,1 -4,-2"/><path d="M 41,31 q 2,-6 8,-3 q 3,3 0,5"/></g>`;
  if (has(12)) food += '<g fill="#8e2f2a" stroke="#4a1512" stroke-width="0.6"><rect x="34" y="31" width="9" height="3.4" rx="1.4" transform="rotate(-10 34 31)"/><rect x="46" y="36" width="9" height="3.4" rx="1.4" transform="rotate(8 46 36)"/><rect x="38" y="38" width="8" height="3.2" rx="1.4"/></g>';
  // espuma del Tonkotsu: crece hasta desbordarse
  const foam = pan.foam || 0;
  if (foam > 0) {
    const n = Math.min(16, Math.ceil(foam / 6));
    let fb = '';
    for (let k = 0; k < n; k++) { const a = k * 2.4, rr = 2 + (foam / 100) * 2.6; fb += `<circle cx="${(46 + Math.cos(a) * (14 + (k % 3) * 5)).toFixed(1)}" cy="${(33 - (foam / 100) * 7 + Math.sin(a) * 5).toFixed(1)}" r="${rr.toFixed(1)}"/>`; }
    food += `<g fill="#ffffff" stroke="#d9d2c0" stroke-width="0.5" opacity="0.95">${fb}</g>`;
  }
  const sizz = pan.fire && ['RAW', 'GOOD', 'OVER', 'HEAT', 'HOT'].includes(ph);
  let bar = '';
  if (['RAW', 'GOOD', 'OVER'].includes(ph)) {
    const T = panTimes(), total = T.burn < 1e8 ? T.burn : T.ready + 6, w = 64;
    const x = v => (20 + w * Math.min(1, v / total)).toFixed(1);
    bar = `<rect x="20" y="60.6" width="${w}" height="3" rx="1.5" fill="rgba(0,0,0,0.6)"/>
      <rect x="20" y="60.6" width="${x(T.ready) - 20}" height="3" rx="1.5" fill="#8d6e63"/>
      <rect x="${x(T.ready)}" y="60.6" width="${Math.max(0, x(Math.min(T.over, total)) - x(T.ready)).toFixed(1)}" height="3" fill="#66bb6a"/>
      <rect x="${x(Math.min(T.over, total))}" y="60.6" width="${Math.max(0, 84 - x(Math.min(T.over, total))).toFixed(1)}" height="3" rx="1.5" fill="#ff7043"/>
      <rect x="${(+x(pan.t) - 0.8).toFixed(1)}" y="59.2" width="1.8" height="5.6" rx="0.9" fill="#ffffff" stroke="#000" stroke-width="0.3"/>`;
  }
  const oilSheen = pan.oil ? '<ellipse cx="46" cy="35" rx="25" ry="9.5" fill="#e6b13a" opacity="0.36"/><g fill="#ffe08a" opacity="0.85"><circle cx="34" cy="31" r="1.6"/><circle cx="52" cy="36" r="1.3"/><circle cx="43" cy="39" r="1.1"/><circle cx="58" cy="31" r="1.2"/></g>' : '';
  let flame = '';
  if (pan.fire) { for (let k = 0; k < 8; k++) { const fx = 22 + k * 7.4; flame += `<path d="M ${fx - 3},64 Q ${fx - 4},58 ${fx},51 Q ${fx + 4},58 ${fx + 3},64 Z" fill="#4aa3ff" stroke="#1f5fa8" stroke-width="0.5"/><path d="M ${fx - 1.4},61 Q ${fx},56 ${fx + 1.4},61 Z" fill="#ff9a3d"/>`; } flame = `<g class="pan-flame">${flame}</g>`; }
  return `<svg class="pan-svg ${sizz ? 'pan-sizzling' : ''}" viewBox="0 0 100 64">
    <defs><linearGradient id="panSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e7884"/><stop offset="0.28" stop-color="#c3ccd5"/><stop offset="0.55" stop-color="#8f9aa6"/><stop offset="0.82" stop-color="#cfd8e0"/><stop offset="1" stop-color="#5f6974"/></linearGradient></defs>
    ${flame}
    <ellipse cx="46" cy="58" rx="33" ry="4" fill="rgba(0,0,0,0.4)"/>
    <path d="M 79,30 L 99,34" stroke="#23262b" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M 79,30 L 99,34" stroke="#3a3f46" stroke-width="3.6" stroke-linecap="round" fill="none"/>
    <path d="M 82,29.4 L 96,32.2" stroke="#6b727b" stroke-width="1" stroke-linecap="round" fill="none"/>
    <path d="M 11,28 C 11,50 24,55 46,55 C 68,55 81,50 81,28 Z" fill="url(#panSteel)" stroke="#23262b" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M 14,37 Q 46,50 78,37" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.3" fill="none"/>
    <path d="M 17,47 Q 46,59 75,47" stroke="#3d444d" stroke-opacity="0.3" stroke-width="1.5" fill="none"/>
    <ellipse cx="46" cy="28" rx="35" ry="12.5" fill="#d3dbe3" stroke="#23262b" stroke-width="1.5"/>
    <ellipse cx="46" cy="28.6" rx="32" ry="10.6" fill="#4d5862" stroke="#3a424b" stroke-width="0.8"/>
    <path d="M 16.5,27.5 Q 46,14.5 75.5,27.5 Q 46,21 16.5,27.5 Z" fill="#8a95a0" opacity="0.55"/>
    <g transform="translate(46 31) scale(0.9 0.72) translate(-46 -34.5)">${oilSheen}${food}</g>
    <path d="M 14,30 Q 46,43 78,30" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.2" fill="none"/>
    <circle class="pan-bub b1" cx="38" cy="30" r="1.6" fill="#fff"/><circle class="pan-bub b2" cx="52" cy="33" r="1.4" fill="#ffe082"/><circle class="pan-bub b3" cx="45" cy="28" r="1.2" fill="#fff"/>
    ${ph === 'BURNT' || ph === 'DRIED' ? '<g stroke="#9e9e9e" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.8"><path d="M 36,24 q -3,-6 1,-10"/><path d="M 48,22 q 3,-6 -1,-11"/><path d="M 58,24 q -3,-6 1,-10"/></g>' : ''}
    ${(ph === 'HOT' || ph === 'HEAT') && pan.fire ? '<g class="pan-steam" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none"><path d="M 38,24 q -3,-5 1,-9"/><path d="M 48,22 q 3,-5 -1,-10"/><path d="M 58,24 q -3,-5 1,-9"/></g>' : ''}
    ${bar}
  </svg>`;
}

// ---- Salsas y flameador (Ramen con etapas): herramientas de la franja entre la despensa y la cocina ----
// Salsa: se arrastra la botella hasta la parte de arriba de una sartén (queda flotando inclinada) y se toca para apretar: cae la salsa.
// Flameador: se arrastra hasta el botón de Flamear Chasu y empieza a echar fuego solo (flamea hasta el máximo o hasta retirarlo).
const TOOL_SAUCES = {
  5:  { name: 'Shoyu',   c: '#5a3319', d: '#35190b' },
  6:  { name: 'Miso',    c: '#c98a3c', d: '#8b5a1f' },
  7:  { name: 'Ebi',     c: '#ee6a2f', d: '#b3430f' },
  8:  { name: 'Tan tan', c: '#d12f14', d: '#8f1a08' },
  9:  { name: 'Vegetal', c: '#8fc44a', d: '#5f8f2a' },
  10: { name: 'Bajiru',  c: '#3f8a35', d: '#25601f' },
  31: { name: 'Aceite',  c: '#d9a23a', d: '#8f5f12' },                // aceite de ajonjolí (Ramen) / aceite del wok (Salteados)
  78: { name: 'Batayaki', c: '#8a5a2b', d: '#4a2a14' },
  108: { name: 'Aceite', c: '#f2d04a', d: '#b8901a' },                 // aceite de cocina (Salteados)
  87: { name: 'Teriyaki', c: '#5b2a12', d: '#2e1307' },
  90: { name: 'Yasaitame', c: '#8f6a2a', d: '#5a3f12' },
  86: { name: 'Omuraisu', c: '#c2410c', d: '#7c2405' },
  99: { name: 'Licor', c: '#e8dfc0', d: '#b3a572' },
  101: { name: 'Ac. Yakit.', c: '#9a7d1e', d: '#5e4a0a' },
  88: { name: 'Yakitori', c: '#6b2f14', d: '#381508' },                 // salsa de las brochetas (Salteados): se echa al final, sin saltear
  75: { name: 'Sal', c: '#eceff1', d: '#b0bec5' },
  4: { name: 'Agua', c: '#64b5f6', d: '#1e6fb0' },
  102: { name: 'Limón', c: '#fdd835', d: '#c6a700' },                // Salteados: aliña el lomo y los fideos del Batayaki
  79: { name: 'Chaufa',  c: '#6b3a1d', d: '#3a1d0a' },                // Salteados
  40: { name: 'Base',    c: '#b8452a', d: '#7a2a14' }                 // Base Shimaya (Salteados)
};
const TOOL_SAUCE_IDS = Object.keys(TOOL_SAUCES).map(Number);
// Salero: vidrio con tapa metálica perforada y sal adentro (se usa boca abajo, como las botellas)
function saltShakerSvg() {
  const ink = '#2b2118';
  return `<svg class="tool-svg" viewBox="0 0 60 112">
    <defs><linearGradient id="saltCap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7f8a94"/><stop offset="0.3" stop-color="#eef2f5"/><stop offset="0.65" stop-color="#aab4bd"/><stop offset="1" stop-color="#6c7781"/></linearGradient>
    <linearGradient id="saltGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9d3e0"/><stop offset="0.35" stop-color="#eaf5fb"/><stop offset="1" stop-color="#a5c3d3"/></linearGradient></defs>
    <path d="M 14,40 Q 10,44 10,54 V 96 Q 10,108 22,108 H 38 Q 50,108 50,96 V 54 Q 50,44 46,40 Z" fill="url(#saltGlass)" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M 11.5,66 V 96 Q 11.5,106.5 22,106.5 H 38 Q 48.5,106.5 48.5,96 V 66 Q 30,60 11.5,66 Z" fill="#ffffff" opacity="0.95"/>
    <g fill="#cfd8dc"><circle cx="20" cy="82" r="1.6"/><circle cx="30" cy="90" r="1.6"/><circle cx="40" cy="80" r="1.6"/><circle cx="26" cy="98" r="1.6"/><circle cx="37" cy="99" r="1.6"/><circle cx="18" cy="94" r="1.4"/></g>
    <rect x="12" y="38" width="36" height="6" rx="2" fill="#9aa5ae" stroke="${ink}" stroke-width="1.3"/>
    <path d="M 14,38 Q 14,14 30,12 Q 46,14 46,38 Z" fill="url(#saltCap)" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>
    <g fill="${ink}"><circle cx="24" cy="24" r="1.7"/><circle cx="30" cy="20" r="1.7"/><circle cx="36" cy="24" r="1.7"/><circle cx="27" cy="30" r="1.7"/><circle cx="33" cy="30" r="1.7"/></g>
    <text x="30" y="80" font-size="11" font-weight="900" text-anchor="middle" fill="#37474f" font-family="Arial, sans-serif">SAL</text>
    <rect x="15" y="52" width="3.4" height="40" rx="1.7" fill="#ffffff" opacity="0.7"/>
  </svg>`;
}
function sauceBottleSvg(id) {
  if (id === 75) return saltShakerSvg();
  const sc = TOOL_SAUCES[id], ink = '#2b2118', g = 'sbg' + id;
  let ridges = '';
  for (let x = 13; x <= 47; x += 3.4) ridges += `<path d="M ${x.toFixed(1)},38 V 44" stroke="#b9b9b2" stroke-width="0.8"/>`;
  return `<svg class="tool-svg" viewBox="0 0 60 112">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${sc.d}"/><stop offset="0.3" stop-color="${sc.c}"/><stop offset="0.68" stop-color="${sc.c}"/><stop offset="1" stop-color="${sc.d}"/></linearGradient></defs>
    <path d="M 27,4 H 33 L 35.5,22 H 24.5 Z" fill="#f4f4f0" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M 17,35 Q 21,22 24.5,22 H 35.5 Q 39,22 43,35 Z" fill="#e8e8e3" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="9" y="34" width="42" height="13" rx="3.5" fill="#f4f4f0" stroke="${ink}" stroke-width="1.5"/>
    ${ridges}
    <path d="M 11,52 Q 9,52 9,58 V 98 Q 9,109 22,109 H 38 Q 51,109 51,98 V 58 Q 51,52 49,52 Z" fill="url(#${g})" stroke="${ink}" stroke-width="1.7"/>
    <path d="M 10,69 Q 30,73 50,68 M 10,88 Q 30,92 50,87" stroke="${ink}" stroke-opacity="0.28" stroke-width="1" fill="none"/>
    ${id === 108 ? `<path d="M30,62 C24,70 21,75 21,80 a9,9 0 0 0 18,0 C39,75 36,70 30,62 Z" fill="#fff4d6" stroke="${ink}" stroke-width="1.2"/><path d="M26,80 q0,5 4,6" fill="none" stroke="#d49a22" stroke-width="1.6" stroke-linecap="round"/>` : ''}
    ${id === OIL_ID ? `<rect x="19" y="64" width="22" height="26" rx="3" fill="#fff4d6" stroke="${ink}" stroke-width="1"/><g fill="#8a6a2a">${[[25,72],[32,70],[28,78],[35,77],[24,84],[31,85],[37,83]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="1.2"/>`).join('')}</g>` : ''}
    <rect x="15" y="58" width="4.5" height="42" rx="2.2" fill="#ffffff" opacity="0.42"/><circle cx="17" cy="104" r="2" fill="#ffffff" opacity="0.6"/>
  </svg>`;
}
function ohashiSvg() {
  const ink = '#3a2412';
  return `<svg class="tool-svg" viewBox="0 0 56 120">
    <defs><linearGradient id="ohG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a2b"/><stop offset="0.45" stop-color="#e6b070"/><stop offset="1" stop-color="#8a5a2b"/></linearGradient></defs>
    <path d="M 8,4 H 14 L 30,116 H 27.5 Z" fill="url(#ohG)" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 29,4 H 35 L 32.6,116 H 30 Z" fill="url(#ohG)" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 8,4 H 14 L 14.9,24 H 9.6 Z" fill="#b71c1c" stroke="${ink}" stroke-width="1"/><path d="M 29,4 H 35 L 34.7,24 H 29.6 Z" fill="#b71c1c" stroke="${ink}" stroke-width="1"/>
    <path d="M 10,26 L 12,60 M 31,26 L 31.6,60" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.3" fill="none"/>
    <path d="M 12.4,34 H 17.2 M 29.8,34 H 34.4" stroke="${ink}" stroke-opacity="0.35" stroke-width="1"/>
  </svg>`;
}
function torchSvg(on) {
  const ink = '#23262b', u = on ? 'o' : '';
  const flame = on ? `<g class="torch-flame"><path d="M 10,46 Q -16,30 -58,41 Q -72,46 -58,51 Q -16,62 10,46 Z" fill="#ff9a3d" stroke="#e65100" stroke-width="0.9"/><path d="M 10,46 Q -10,38 -40,43 Q -10,52 10,46 Z" fill="#4aa3ff"/><path d="M 10,46 Q -2,43 -16,45 Q -2,49 10,46 Z" fill="#e8f4ff"/></g>` : '';
  let ridges = '';
  for (let x = 104; x <= 122; x += 3.2) ridges += `<path d="M ${x.toFixed(1)},24 V 33" stroke="#0f3d1a" stroke-opacity="0.55" stroke-width="0.9"/>`;
  return `<svg class="tool-svg" viewBox="${on ? '-70 0 220 200' : '0 0 150 200'}">
    <defs>
      <linearGradient id="tcSteel${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e9ee"/><stop offset="0.45" stop-color="#9aa5b0"/><stop offset="1" stop-color="#5f6974"/></linearGradient>
      <linearGradient id="tcSteelV${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e7884"/><stop offset="0.3" stop-color="#d3dce4"/><stop offset="0.6" stop-color="#9aa5b0"/><stop offset="1" stop-color="#5f6974"/></linearGradient>
      <linearGradient id="tcGreen${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3da250"/><stop offset="0.55" stop-color="#26863b"/><stop offset="1" stop-color="#165a26"/></linearGradient>
      <linearGradient id="tcBlue${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#27378f"/><stop offset="0.5" stop-color="#2f46b0"/><stop offset="1" stop-color="#1b2766"/></linearGradient>
    </defs>
    ${flame}
    <rect x="6" y="37" width="46" height="18" rx="4.5" fill="url(#tcSteel${u})" stroke="${ink}" stroke-width="1.6"/>
    <path d="M 10,41.5 H 47" stroke="#ffffff" stroke-opacity="0.7" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="50" y="35" width="9" height="22" rx="2" fill="#7a838d" stroke="${ink}" stroke-width="1.4"/>
    <path d="M 56,42 Q 60,32 72,34 H 118 Q 136,38 140,50 V 60 L 132,70 H 86 L 82,62 H 66 L 56,56 Z" fill="url(#tcGreen${u})" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M 74,36 H 116" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.4" stroke-linecap="round"/>
    <g fill="#12301a" stroke="#0a1b0f" stroke-width="0.6"><ellipse cx="72" cy="48" rx="2.3" ry="7" transform="rotate(18 72 48)"/><ellipse cx="80" cy="48" rx="2.3" ry="7" transform="rotate(18 80 48)"/><ellipse cx="88" cy="48" rx="2.3" ry="7" transform="rotate(18 88 48)"/></g>
    <rect x="101" y="22" width="24" height="14" rx="4" fill="url(#tcGreen${u})" stroke="${ink}" stroke-width="1.5"/>${ridges}
    <rect x="84" y="60" width="26" height="8" rx="1.5" fill="#1f6d33" stroke="${ink}" stroke-width="1.2"/>
    <path d="M 66,62 H 80 V 70 H 70 Z" fill="#26863b" stroke="${ink}" stroke-width="1.2"/>
    <rect x="82" y="68" width="40" height="8" rx="2" fill="#c62828" stroke="${ink}" stroke-width="1.4"/>
    <rect x="86" y="76" width="32" height="9" fill="url(#tcSteelV${u})" stroke="${ink}" stroke-width="1.2"/>
    <path d="M 66,102 Q 66,90 84,84 H 120 Q 138,90 138,102 Z" fill="url(#tcSteelV${u})" stroke="${ink}" stroke-width="1.5"/>
    <path d="M 66,102 H 138 V 190 Q 138,198 130,198 H 74 Q 66,198 66,190 Z" fill="#fbfbf7" stroke="${ink}" stroke-width="1.7"/>
    <path d="M 66,102 H 138 V 130 H 66 Z" fill="url(#tcBlue${u})" stroke="${ink}" stroke-width="1.3"/>
    <path d="M 86,108 Q 102,103 118,116 Q 102,115 92,126 Q 97,115 86,108 Z" fill="#d32f2f" stroke="#fbfbf7" stroke-width="0.8"/>
    <rect x="93" y="136" width="9" height="38" rx="2" fill="#c9a227" stroke="#8a6d12" stroke-width="0.8"/>
    <text x="100" y="172" transform="rotate(-90 100 172)" font-size="8" font-weight="900" fill="#7a5c0c" font-family="Arial, sans-serif">FLAMA</text>
    <circle cx="124" cy="158" r="8.5" fill="#ffffff" stroke="#2e7d32" stroke-width="1.7"/><path d="M 119.5,158 l 3.2,3.4 l 6,-7" stroke="#2e7d32" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M 66,178 H 138 V 184 H 66 Z" fill="#c62828"/><path d="M 66,184 H 138 V 190 H 66 Z" fill="#1e2f7a"/>
    <rect x="70" y="106" width="5" height="84" rx="2.5" fill="#ffffff" opacity="0.5"/><rect x="128" y="102" width="10" height="96" fill="#000000" opacity="0.1"/>
    <path d="M 66,102 H 138 V 190 Q 138,198 130,198 H 74 Q 66,198 66,190 Z" fill="none" stroke="${ink}" stroke-width="1.7"/>
  </svg>`;
}

// Varias manos a la vez: cada dedo lleva su propia herramienta (toolDrags) y varias pueden quedar colocadas a la vez (toolArmedMap):
// p. ej. el flameador echando fuego sobre el chasu mientras otra mano vierte una salsa, mueve los fideos o arrastra un ingrediente.
const toolDrags = new Map();       // pointerId -> arrastre en curso
const toolArmedMap = new Map();    // clave -> herramienta ya colocada ('sauce5', 'sauce31', 'torch', 'ohashi')
let toolHold = null, toolTorchSince = 0;
const toolKey = (kind, id) => (kind === 'sauce' ? 'sauce' + id : kind);
const toolStripSig = () => [...toolArmedMap.keys()].sort().join('+');
function ramenSauceIdsAvailable() {
  const ids = new Set();
  stView('ramen', getUnlockedRamenRecipes()).forEach(r => r.ingredients.forEach(id => ids.add(id)));
  const list = TOOL_SAUCE_IDS.filter(id => id !== OIL_ID && ids.has(id));
  const oilNames = ['Shoyu', 'Miso', 'Tonkotsu', 'Chashu', 'Vegetariano', 'Ebi', 'Tan tan'];
  if (getUnlockedRamenRecipes().some(r => oilNames.includes(r.name))) list.push(OIL_ID);   // el aceite de ajonjolí va tras las salsas
  return list;
}
// Área cuya franja de herramientas se ve ahora: Ramen o Salteados con etapas, en la pantalla de cocina
function toolStripArea() {
  const a = gameState.activeArea;
  if (a === 'makis' && stagedOn('makis')) return (getStage(a) === 'plate' && makiFlameAvailable()) ? 'makis' : null;   // el flameado va en Emplatar: tras cortar y echar la salsa
  if (!(stagedOn(a) && getStage(a) === 'cook')) return null;
  if (a === 'ramen' || a === 'salteados') return a;
  return a === 'makis' && makiFlameAvailable() ? a : null;     // Makis: solo hay flameador (Yama, Nin Niku y Digión)
}
function wokSauceIdsAvailable() {
  const ids = new Set();
  getUnlockedRecipes().filter(r => r.area === 'salteados' && SAL_STAGED[r.name]).forEach(r => salCookIds(r.name).forEach(id => ids.add(id)));
  return ids.size ? [WOK_OIL_ID, ...WOK_SAUCE_IDS.filter(id => ids.has(id))] : [];     // el aceite de cocina va siempre primero
}
function renderToolStrip() {
  const strip = document.getElementById('ramen-tool-strip');
  if (!strip) return;
  const area = toolStripArea(), show = !!area;
  strip.classList.toggle('on', show);
  document.body.classList.toggle('mk-torch-small', area === 'makis');
  if (!show) { toolDisarmAll(true); strip._sig = ''; strip._area = null; return; }
  if (strip._area !== area) { toolDisarmAll(true); strip._area = area; strip._sig = ''; }   // al cambiar de área se guardan las herramientas
  const ids = area === 'makis' ? ['torch'] : (area === 'salteados' ? wokSauceIdsAvailable() : ramenSauceIdsAvailable());
  const sig = area + ':' + ids.join(',') + '|' + toolStripSig();
  if (strip._sig === sig) return;
  strip._sig = sig;
  const away = (kind, id) => toolArmedMap.has(toolKey(kind, id)) ? 'is-away' : '';
  if (area === 'makis') { strip.innerHTML = `<div class="tool-item tool-torch ${away('torch')}" data-kind="torch" title="Flameador: arrástralo hasta la tabla con el maki enrollado (Yama, Nin Niku, Digión) y retíralo en la zona verde">${torchSvg(false)}<span class="tool-name">Flameador</span></div>`; return; }
  const target = area === 'salteados' ? 'un wok' : 'una sartén';
  const oilTip = area === 'salteados' ? 'Aceite de ajonjolí: échalo en la ronda que indique la receta' : 'Aceite de ajonjolí: al sofreír (Tan tan, Ebi) y al caldo cuando hierve (Tonkotsu, Vegetariano, Shoyu, Miso)';
  const bottles = ids.map(id => `<div class="tool-item tool-bottle ${away('sauce', id)}" data-kind="sauce" data-id="${id}" title="${id === OIL_ID ? oilTip : (id === 108 ? 'Aceite de cocina: va PRIMERO, con el wok caliente' : (area === 'salteados' ? '' : 'Salsa ') + TOOL_SAUCES[id].name)}: arrástrala sobre ${target} y toca para verter (si te equivocas, desliza desde la tapa blanca hacia arriba para devolverla)">${sauceBottleSvg(id)}<span class="tool-name">${(area === 'salteados' && id === OIL_ID) ? 'Ac. ajonjolí' : TOOL_SAUCES[id].name}</span></div>`).join('');
  if (area === 'salteados') { strip.classList.toggle('dense', ids.length > 7); strip.innerHTML = bottles; return; }
  strip.classList.remove('dense');
  strip.innerHTML = bottles
    + `<div class="tool-item tool-torch ${away('torch')}" data-kind="torch" title="Flameador: arrástralo hasta Flamear Chasu">${torchSvg(false)}<span class="tool-name">Flameador</span></div>`
    + `<div class="tool-item tool-ohashi ${away('ohashi')}" data-kind="ohashi" title="Ohashi: arrástralos sobre un cuenco con fideos y mantén pulsado para repartirlos">${ohashiSvg()}<span class="tool-name">Ohashi</span></div>`;
}

function toolPoint(d) { return { x: d.x, y: d.pointerType === 'mouse' ? d.y : d.y - DRAG_TOUCH_GHOST_OFFSET_Y }; }
function toolTargetAt(kind, p) {
  if (kind === 'torch' && toolStripArea() === 'makis') {
    for (const b of document.querySelectorAll('.plate-bowl[data-slot]')) {        // Emplatar: el cuenco que está debajo
      const r = b.getBoundingClientRect();
      if (p.x >= r.left - 10 && p.x <= r.right + 10 && p.y >= r.top - 40 && p.y <= r.bottom + 10) return { el: b, pan: parseInt(b.dataset.slot, 10) };
    }
    return null;
  }
  if (kind === 'torch') {
    const b = document.getElementById('btn-flame-chasu');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return (p.x >= r.left - 12 && p.x <= r.right + 12 && p.y >= r.top - 18 && p.y <= r.bottom + 10) ? { el: b } : null;
  }
  if (kind === 'ohashi') {
    for (const i of [0, 1]) {
      const c = document.getElementById('bowl-card-' + i);
      if (!c || getComputedStyle(c).display === 'none') continue;
      const r = c.getBoundingClientRect();
      if (p.x >= r.left - 4 && p.x <= r.right + 4 && p.y >= r.top - 40 && p.y <= r.top + r.height * 0.65) return { el: c, pan: i };
    }
    return null;
  }
  const wokTarget = toolStripArea() === 'salteados';
  for (const i of [0, 1]) {
    const c = document.getElementById((wokTarget ? 'wok-card-' : 'pan-cell-') + i);
    if (!c) continue;
    const r = c.getBoundingClientRect();
    if (p.x >= r.left - 4 && p.x <= r.right + 4 && p.y >= r.top - 36 && p.y <= r.top + r.height * 0.62) return { el: c, pan: i };
  }
  return null;
}
function toolRefreshTargets() {
  document.querySelectorAll('.tool-target').forEach(el => el.classList.remove('tool-target'));
  toolDrags.forEach(d => { if (d.active && d.target) d.target.el.classList.add('tool-target'); });
}
function toolCleanupDrag(d) {
  if (!d) { [...toolDrags.values()].forEach(toolCleanupDrag); return; }
  if (d.ghost) d.ghost.remove();
  if (d.el) d.el.classList.remove('is-lifted');
  toolDrags.delete(d.pointerId);
  if (!toolDrags.size) {
    document.removeEventListener('pointermove', onToolMove);
    document.removeEventListener('pointerup', onToolUp);
    document.removeEventListener('pointercancel', onToolUp);
  }
  toolRefreshTargets();
}
function onToolMove(e) {
  const d = toolDrags.get(e.pointerId);
  if (!d) return;
  d.x = e.clientX; d.y = e.clientY;
  if (!d.active) {
    if (Math.hypot(d.x - d.startX, d.y - d.startY) <= 6) return;
    d.active = true;
    const ghost = document.createElement('div');
    ghost.className = 'tool-ghost ' + d.kind;
    ghost.innerHTML = d.kind === 'torch' ? torchSvg(false) : (d.kind === 'ohashi' ? ohashiSvg() : sauceBottleSvg(d.id));
    document.body.appendChild(ghost);
    d.ghost = ghost;
    d.el.classList.add('is-lifted');
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (err) {}
  }
  const p = toolPoint(d);
  if (d.ghost) d.ghost.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
  d.target = toolTargetAt(d.kind, p);
  toolRefreshTargets();
}
function onToolUp(e) {
  const d = toolDrags.get(e.pointerId);
  if (!d) return;
  const p = toolPoint(d), wasActive = d.active, t = wasActive ? toolTargetAt(d.kind, p) : null, kind = d.kind, id = d.id;
  toolCleanupDrag(d);
  if (!wasActive) { showStationToast(kind === 'torch' ? (toolStripArea() === 'makis' ? '🔥 Arrastra el flameador hasta la tabla del maki.' : '🔥 Arrastra el flameador hasta "Flamear Chasu".') : (kind === 'ohashi' ? '🥢 Arrastra los ohashi hasta la parte de arriba de un cuenco con fideos.' : (toolStripArea() === 'salteados' ? '💧 Arrastra la botella hasta la parte de arriba de un wok.' : '💧 Arrastra la botella hasta la parte de arriba de una sartén.'))); return; }
  try { playSound(t ? 'add' : 'click'); } catch (err) {}
  if (t) toolArm(kind, id, t.pan);
}
document.addEventListener('pointerdown', (e) => {
  const armedEl = e.target.closest && e.target.closest('.tool-armed');
  if (armedEl) {
    const a = toolArmedMap.get(armedEl.dataset.akey);
    if (a) {
      e.preventDefault();
      if (a.kind === 'sauce') toolBottlePress(a, e);             // botella: tocar = apretar · deslizar desde la tapa blanca hacia arriba = devolverla
      else if (a.kind === 'ohashi') toolHoldStart(a, e);         // ohashi: mantener pulsado para mover los fideos
      else toolDisarm(a.key);                                    // flameador: retirar
      return;
    }
  }
  const item = e.target.closest && e.target.closest('.tool-item');
  if (!item || !toolStripArea() || gameState.isPaused || gameState.isGameOver) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const kind = item.dataset.kind, id = parseInt(item.dataset.id || '0', 10);
  if (item.classList.contains('is-away')) { toolDisarm(toolKey(kind, id)); return; }       // tocar el hueco vacío la devuelve
  if (item.classList.contains('is-lifted')) return;                                        // ya lo lleva otra mano
  e.preventDefault();
  const old = toolDrags.get(e.pointerId);
  if (old) toolCleanupDrag(old);
  toolDrags.set(e.pointerId, { kind, id, el: item, pointerId: e.pointerId, pointerType: e.pointerType, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, active: false, ghost: null, target: null });
  document.addEventListener('pointermove', onToolMove);
  document.addEventListener('pointerup', onToolUp);
  document.addEventListener('pointercancel', onToolUp);
}, { passive: false });

// Botella colocada sobre una sartén (queda invertida: la tapa blanca / boquilla apunta hacia abajo).
//  - toque corto  -> aprieta y cae la salsa o el aceite
//  - desde la tapa blanca, deslizar hacia arriba -> la botella vuelve a su sitio sin verter (por si elegiste la que no era)
const TOOL_RETURN_PX = 24;
const toolPresses = new Map();     // pointerId -> { a, startX, startY, tip, dx, dy }
function toolBottlePress(a, e) {
  if (a.pouring) return;
  const r = a.el.getBoundingClientRect();
  const press = { a, startX: e.clientX, startY: e.clientY, tip: e.clientY >= r.top + r.height * 0.5, dx: 0, dy: 0 };
  if (a.area === 'salteados' && a.id === WOK_OIL_ID) press.oil = { on: false, timer: setTimeout(() => { press.oil.on = true; oilPourStart(a); }, OIL_HOLD_MS) };   // aceite: mantener pulsado = dosificar
  toolPresses.set(e.pointerId, press);
  document.addEventListener('pointermove', onToolPressMove);
  document.addEventListener('pointerup', onToolPressUp);
  document.addEventListener('pointercancel', onToolPressCancel);
}
function toolPressListenersOff() {
  if (toolPresses.size) return;
  document.removeEventListener('pointermove', onToolPressMove);
  document.removeEventListener('pointerup', onToolPressUp);
  document.removeEventListener('pointercancel', onToolPressCancel);
}
function onToolPressMove(e) {
  const p = toolPresses.get(e.pointerId);
  if (!p) return;
  p.dx = e.clientX - p.startX; p.dy = e.clientY - p.startY;
  if (p.oil && p.oil.on) return;                                      // vertiendo: el dedo solo sostiene la botella
  if (p.oil && Math.hypot(p.dx, p.dy) > 14) { clearTimeout(p.oil.timer); p.oil = null; }       // si se desliza, es devolver la botella, no dosificar
  if (p.tip && p.dy < -4 && toolArmedMap.has(p.a.key)) {
    p.a.el.classList.add('pulling');
    p.a.el.style.translate = '0 ' + Math.max(p.dy, -70) + 'px';       // la botella sigue al dedo hacia arriba
  }
}
function onToolPressUp(e) {
  const p = toolPresses.get(e.pointerId);
  if (!p) return;
  toolPresses.delete(e.pointerId);
  toolPressListenersOff();
  const a = p.a;
  if (p.oil) { clearTimeout(p.oil.timer); if (p.oil.on) { oilPourEnd(a, true); return; } }      // soltó la botella tras dosificar
  if (!toolArmedMap.has(a.key)) return;
  a.el.classList.remove('pulling');
  a.el.style.translate = '';
  if (p.tip && p.dy <= -TOOL_RETURN_PX && Math.abs(p.dx) <= Math.abs(p.dy) * 1.5) { toolReturn(a); return; }
  if (Math.hypot(p.dx, p.dy) < 12) toolPour(a);                   // toque corto: apretar
}
function onToolPressCancel(e) {
  const p = toolPresses.get(e.pointerId);
  if (!p) return;
  toolPresses.delete(e.pointerId);
  toolPressListenersOff();
  if (p.oil) { clearTimeout(p.oil.timer); if (p.oil.on) oilPourEnd(p.a, false); }
  if (p.a.el) { p.a.el.classList.remove('pulling'); p.a.el.style.translate = ''; }
}
// Aceite de cocina: mantener pulsada la botella lo va vertiendo; se suelta con el nivel en la zona verde (ni poco ni mucho).
// Un toque suelto lo echa «sin medir» (respaldo, −3 pts de cocción); poco o mucho aceite, −8; en la zona, sin penalidad.
const OIL_HOLD_MS = 260, OIL_FILL_SECS = 1.7, OIL_ZONE_MIN = 0.42, OIL_ZONE_MAX = 0.78, OIL_TAP_PTS = -3, OIL_BAD_PTS = -8;
let oilPour = null;
function oilPourStart(a) {
  if (!a || a.pouring || !toolArmedMap.has(a.key) || gameState.isPaused) return;
  const g = document.createElement('div');
  g.className = 'oil-gauge';
  g.innerHTML = `<i class="og-zone" style="bottom:${OIL_ZONE_MIN * 100}%;height:${(OIL_ZONE_MAX - OIL_ZONE_MIN) * 100}%"></i><i class="og-fill"></i>`;
  document.body.appendChild(g);
  const r = a.el.getBoundingClientRect();
  g.style.left = Math.min(window.innerWidth - 24, r.right + 6) + 'px'; g.style.top = Math.max(4, r.top + 2) + 'px';
  a.el.classList.add('squeeze');
  oilPour = { a, amt: 0, g, fill: g.querySelector('.og-fill'), iv: setInterval(oilPourTick, 60), n: 0 };
  try { playSound('splash'); } catch (e) {}
}
function oilPourTick() {
  const o = oilPour;
  if (!o) return;
  if (!toolArmedMap.has(o.a.key) || gameState.isPaused) { oilPourEnd(o.a, false); return; }
  o.amt = Math.min(1, o.amt + 0.06 / OIL_FILL_SECS);
  o.fill.style.height = (o.amt * 100) + '%';
  o.g.classList.toggle('good', o.amt >= OIL_ZONE_MIN && o.amt <= OIL_ZONE_MAX);
  o.g.classList.toggle('over', o.amt > OIL_ZONE_MAX);
  if (++o.n % 2 === 0) {
    const nz = o.a.el.getBoundingClientRect(), art = document.getElementById('wok-art-' + o.a.pan), ar = art ? art.getBoundingClientRect() : nz;
    const d = document.createElement('i');
    d.className = 'sauce-drop';
    d.style.background = TOOL_SAUCES[o.a.id].c;
    d.style.left = (nz.left + nz.width / 2 - 3) + 'px'; d.style.top = (nz.bottom - 4) + 'px';
    d.style.setProperty('--dy', Math.max(14, ar.top + ar.height * 0.55 - (nz.bottom - 4)) + 'px');
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 900);
  }
}
function oilPourEnd(a, commit) {
  const o = oilPour;
  if (!o) return;
  clearInterval(o.iv);
  o.g.remove();
  oilPour = null;
  a.el && a.el.classList.remove('squeeze');
  if (!commit || !toolArmedMap.has(a.key)) return;
  const adj = (o.amt >= OIL_ZONE_MIN && o.amt <= OIL_ZONE_MAX) ? 0 : OIL_BAD_PTS;
  showStationToast(adj === 0 ? '🛢️ Aceite justo ✓' : (o.amt < OIL_ZONE_MIN ? `🛢️ Poco aceite (${OIL_BAD_PTS} pts de cocción): la próxima mantén pulsado hasta la zona verde.` : `🛢️ Demasiado aceite (${OIL_BAD_PTS} pts de cocción): suelta antes, en la zona verde.`));
  toolPour(a, adj);
}
function toolReturn(a) {
  if (!a || a.pouring) return;
  a.pouring = true;
  a.el.classList.add('returning');
  try { playSound('click'); } catch (e) {}
  showStationToast(`↩ ${a.area === 'salteados' ? TOOL_SAUCES[a.id].name : (TOOL_SAUCES[a.id].name === 'Aceite' ? 'Aceite de ajonjolí' : 'Salsa ' + TOOL_SAUCES[a.id].name)} devuelta a su sitio: no se vertió nada.`);
  setTimeout(() => toolDisarm(a.key), 230);
}

function toolArm(kind, id, pan) {
  const key = toolKey(kind, id);
  if (toolArmedMap.has(key)) toolDisarm(key, true);
  if (kind === 'sauce') toolArmedMap.forEach(o => { if (o.kind === 'sauce' && o.pan === pan) toolDisarm(o.key, true); });   // una sola botella sobre cada sartén
  if (kind === 'torch' && toolStripArea() === 'makis') {
    const slF = stGet('makis').slots[pan];
    if (!makiPlateNeedsFlame(slF)) { showStationToast(slF && slF.item ? '🔥 Este maki se flamea con salsa Yama, Nin Niku o Digión: agrégala primero al cuenco.' : '🔥 Pon el maki cortado en un cuenco y échale la salsa antes de flamearlo.'); try { playSound('error'); } catch (e) {} return; }
    if ((slF.flame || 0) >= MAKI_FLAME_MAX) { showStationToast('⚠ Esta cobertura ya se quemó.'); try { playSound('error'); } catch (e) {} return; }
  } else if (kind === 'torch' && kitchenState.stocks.chasu >= stockCap()) { showStationToast(`🥩 Ya hay el máximo de chasu flameado (${stockCap()}/${stockCap()}).`); return; }
  if (kind === 'ohashi') {
    const b = gameState.bowls[pan];
    if (!b || !b.ingredients.includes(1)) { showStationToast('🥢 Ese cuenco aún no tiene fideos.'); try { playSound('error'); } catch (e) {} return; }
  }
  const a = { key, kind, id, pan, bowl: kind === 'ohashi' ? pan : undefined, el: null, pouring: false, area: toolStripArea() || 'ramen' };
  const el = document.createElement('div');
  el.className = 'tool-armed ' + kind;
  el.dataset.akey = key;
  el.innerHTML = kind === 'torch' ? torchSvg(true) : (kind === 'ohashi' ? ohashiSvg() : sauceBottleSvg(id));
  document.body.appendChild(el);
  a.el = el;
  toolArmedMap.set(key, a);
  toolPlaceArmed(a);
  if (kind === 'torch' && a.area === 'makis') {
    try { playSound('flame'); } catch (e) {}
    showStationToast('🔥 Flameando el maki: retira el flameador (tócalo) cuando la barra esté en verde.');
    makiFlameUi();
  } else if (kind === 'torch') {
    toolTorchSince = performance.now();
    const btn = document.getElementById('btn-flame-chasu');
    if (btn) btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 7771 }));   // empieza a flamear solo
    showStationToast('🔥 Flameando el chasu… toca el flameador para retirarlo.');
  } else if (kind === 'ohashi') {
    showStationToast(`🥢 Ohashi sobre el cuenco ${pan + 1}: mantén pulsado para mover los fideos.`);
  } else {
    const holder = a.area === 'salteados' ? 'el wok' : 'la sartén';
    showStationToast((id === OIL_ID ? `🛢️ Aceite sobre ${holder} ${pan + 1}` : `💧 ${a.area === 'salteados' ? '' : 'Salsa '}${TOOL_SAUCES[id].name} sobre ${holder} ${pan + 1}`) + ': toca la botella para apretar. ¿Te equivocaste? Desliza desde la tapa blanca hacia arriba para devolverla.');
  }
  const strip = document.getElementById('ramen-tool-strip');
  if (strip) strip._sig = '';
  renderToolStrip();
}
function toolPlaceArmed(a) {
  if (!a || !a.el) return;
  if (a.kind === 'sauce') {
    const c = document.getElementById((a.area === 'salteados' ? 'wok-card-' : 'pan-cell-') + a.pan);
    if (!c) return;
    const r = c.getBoundingClientRect();
    a.el.style.left = (r.left + r.width / 2 - 31) + 'px';
    a.el.style.top = (r.top - 114 * 0.62) + 'px';
  } else if (a.kind === 'ohashi') {
    const c = document.getElementById('bowl-card-' + a.bowl);
    if (!c) return;
    const r = c.getBoundingClientRect();
    a.el.style.left = (r.left + r.width / 2 - 20) + 'px';
    a.el.style.top = (r.top - 86 * 0.6) + 'px';
  } else if (a.area === 'makis') {
    const z = document.querySelector('.plate-bowl[data-slot="' + a.pan + '"]');          // el cuenco de Emplatar
    if (!z) return;
    const r = z.getBoundingClientRect();
    a.el.style.left = (r.left + r.width * 0.62 - 42.8) + 'px';
    a.el.style.top = (r.top - 8 - 25.9) + 'px';
  } else {
    const b = document.getElementById('btn-flame-chasu');
    if (!b) return;
    const r = b.getBoundingClientRect();
    // la boquilla (punta izquierda del flameador, de donde sale el fuego) queda arriba a la derecha de la bandeja y apunta hacia las láminas
    a.el.style.left = (r.left + r.width * 0.72 - 42.8) + 'px';
    a.el.style.top = (r.top - 22 - 25.9) + 'px';
  }
}
function toolPlaceAll() { toolArmedMap.forEach(toolPlaceArmed); }
window.addEventListener('resize', toolPlaceAll);

// Ohashi: con ellos sobre el cuenco, mantener pulsado reparte los fideos (≈ 2,5 s para repartirlos del todo). Solo se detiene al soltar el dedo que los sostiene.
const NOODLE_HOLD_RATE = 0.4;      // porción de reparto por segundo de pulsación
function toolHoldStart(a, e) {
  if (!a || a.kind !== 'ohashi' || toolHold) return;
  const bowl = gameState.bowls[a.bowl];
  if (!bowl || !bowl.ingredients.includes(1)) { toolDisarm(a.key); return; }
  if ((bowl.spread || 0) >= 1) { showStationToast('🥢 Los fideos ya están bien repartidos.'); return; }
  toolHold = { id: e ? e.pointerId : 0, a, timer: setInterval(toolHoldTick, 50) };
  a.el.classList.add('holding');
  document.addEventListener('pointerup', toolHoldUp);
  document.addEventListener('pointercancel', toolHoldUp);
}
function toolHoldUp(e) { if (toolHold && e.pointerId === toolHold.id) toolHoldEnd(); }
function toolHoldTick() {
  const h = toolHold;
  if (!h) return;
  const a = h.a;
  if (!toolArmedMap.has(a.key) || gameState.isPaused || gameState.isGameOver) { toolHoldEnd(); return; }
  const bowl = gameState.bowls[a.bowl];
  if (!bowl || !bowl.ingredients.includes(1)) { toolDisarm(a.key); return; }
  const before = bowl.spread || 0;
  bowl.spread = Math.min(1, before + NOODLE_HOLD_RATE * 0.05);
  bowl.stirX = 50 + 20 * Math.sin(performance.now() / 110);
  noodleRedraw(a.bowl);
  if (Math.floor(before * 5) < Math.floor(bowl.spread * 5)) { try { playSound('click'); } catch (err) {} }
  if (before < 1 && bowl.spread >= 1) {
    try { playSound('ding'); } catch (err) {}
    showStationToast('🥢 ¡Fideos bien repartidos!');
    toolHoldEnd();
    setTimeout(() => toolDisarm(a.key), 500);
  }
}
function toolHoldEnd() {
  const h = toolHold;
  if (!h) return;
  clearInterval(h.timer);
  toolHold = null;
  document.removeEventListener('pointerup', toolHoldUp);
  document.removeEventListener('pointercancel', toolHoldUp);
  if (h.a.el) h.a.el.classList.remove('holding');
  const bowl = gameState.bowls[h.a.bowl];
  if (bowl) { bowl.stirX = null; noodleRedraw(h.a.bowl); }
  renderBowls();
}

function toolDisarm(key, silent) {
  const a = toolArmedMap.get(key);
  if (!a) return;
  if (a.kind === 'torch' && a.area !== 'makis') {
    const btn = document.getElementById('btn-flame-chasu');
    if (btn) btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 7771 }));
  }
  if (a.kind === 'ohashi' && toolHold && toolHold.a === a) toolHoldEnd();
  toolPresses.forEach((p, pid) => { if (p.a === a) toolPresses.delete(pid); });
  toolPressListenersOff();
  toolArmedMap.delete(key);
  if (a.el) a.el.remove();
  if (a.area === 'makis') makiFlameUi();
  const strip = document.getElementById('ramen-tool-strip');
  if (strip) strip._sig = '';
  if (!silent) renderToolStrip();
}
function toolDisarmAll(silent) { [...toolArmedMap.keys()].forEach(k => toolDisarm(k, true)); if (!silent) renderToolStrip(); }
function toolPour(a, oilAdj) {
  if (!a || a.kind !== 'sauce' || a.pouring || gameState.isPaused) return;
  if (a.area === 'salteados') {
    if (!wokPour(a.pan, a.id)) { setTimeout(() => toolDisarm(a.key), 250); return; }    // no entró (wokPour ya avisó el motivo)
    if (a.id === WOK_OIL_ID && gameState.woks[a.pan]) {
      gameState.woks[a.pan].oilAdj = oilAdj != null ? oilAdj : OIL_TAP_PTS;                // dosificado: 0 / −8 · toque suelto: −3
      if (oilAdj == null) showStationToast(`🛢️ Aceite echado sin medir (${OIL_TAP_PTS} pts). Mantén pulsada la botella para dosificarlo.`);
    }
  } else {
    const pan = panGet(a.pan), before = pan.items.length, beforeOil = pan.oil;
    panAdd(a.pan, a.id);
    if (pan.items.length <= before && pan.oil === beforeOil) { setTimeout(() => toolDisarm(a.key), 250); return; }      // no entró (panAdd ya avisó el motivo)
  }
  a.pouring = true;
  a.el.classList.add('squeeze');
  try { playSound('splash'); } catch (e) {}
  const nz = a.el.getBoundingClientRect(), art = document.getElementById((a.area === 'salteados' ? 'wok-art-' : 'pan-art-') + a.pan), ar = art ? art.getBoundingClientRect() : nz;
  const sx = nz.left + nz.width / 2, sy = nz.bottom - 4, ty = ar.top + ar.height * 0.55;
  for (let k = 0; k < 8; k++) {
    const d = document.createElement('i');
    d.className = 'sauce-drop';
    d.style.background = TOOL_SAUCES[a.id].c;
    d.style.left = (sx - 3 + (k % 3 - 1) * 2.5) + 'px';
    d.style.top = sy + 'px';
    d.style.setProperty('--dy', Math.max(14, ty - sy) + 'px');
    d.style.animationDelay = (k * 0.045) + 's';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 900);
  }
  setTimeout(() => toolDisarm(a.key), 700);
}
function toolTick() {
  toolArmedMap.forEach(a => {
    if (a.kind === 'torch' && a.area === 'makis') {
      // el flameador del maki lo mueve makiFlameTick
    } else if (a.kind === 'torch') {
      if (!kitchenState.chasu.isFlaming && performance.now() - toolTorchSince > 900) toolDisarm(a.key);   // llegó al máximo
    } else if (a.kind === 'ohashi') {
      const b = gameState.bowls[a.bowl];
      if (!b || !b.ingredients.includes(1)) toolDisarm(a.key);                                          // el cuenco se vació o pasó a emplatar
    }
  });
}

// ---- Dibujo de la cocina profesional (estilo ilustrado: acero con contorno de tinta) ----
const STOVE_INK = '#23262b';
const STOVE_BG_SVG = (() => {
  const burners = [[52, 36], [153, 36], [241, 28], [313, 28]];   // [centro x, medio ancho]
  const plates = burners.map(([cx, hw]) => `
    <path d="M ${cx - hw - 4},52 L ${cx - hw + 5},24 H ${cx + hw - 5} L ${cx + hw + 4},52 Z" fill="#262a31" stroke="${STOVE_INK}" stroke-width="1.6"/>
    <path d="M ${cx - hw},49 L ${cx - hw + 7},28 M ${cx - hw / 3},49 L ${cx - hw / 3 + 2},28 M ${cx + hw / 3},49 L ${cx + hw / 3 - 2},28 M ${cx + hw},49 L ${cx + hw - 7},28" stroke="#4a515b" stroke-width="2.1" fill="none"/>
    <ellipse cx="${cx}" cy="40" rx="${hw * 0.55}" ry="5" fill="#15181c" stroke="#59626c" stroke-width="1"/>
    <circle cx="${cx - hw}" cy="50" r="1.5" fill="#8f9aa6"/><circle cx="${cx + hw}" cy="50" r="1.5" fill="#8f9aa6"/>`).join('');
  const knobs = burners.map(([cx]) => `<circle cx="${cx}" cy="82" r="4.8" fill="#b9c3cd" stroke="${STOVE_INK}" stroke-width="1.3"/><circle cx="${cx}" cy="82" r="1.8" fill="#4b525b"/><path d="M ${cx - 8},78 q -3,4 0,8" stroke="${STOVE_INK}" stroke-width="0.9" fill="none"/>`).join('');
  return `<svg viewBox="0 0 350 96" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="stkTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f8a99"/><stop offset="0.5" stop-color="#a7b0bb"/><stop offset="1" stop-color="#7d8895"/></linearGradient>
      <linearGradient id="stkFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8794a3"/><stop offset="0.45" stop-color="#6c7785"/><stop offset="1" stop-color="#4a525c"/></linearGradient>
      <linearGradient id="stkBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa4b0"/><stop offset="1" stop-color="#6f7a87"/></linearGradient>
    </defs>
    <rect x="10" y="88" width="8" height="8" fill="#4b525b" stroke="${STOVE_INK}" stroke-width="1.4"/><rect x="332" y="88" width="8" height="8" fill="#4b525b" stroke="${STOVE_INK}" stroke-width="1.4"/>
    <path d="M 0,56 H 350 V 90 H 0 Z" fill="url(#stkFront)" stroke="${STOVE_INK}" stroke-width="1.8"/>
    <path d="M 5,61 H 345" stroke="#d6dee6" stroke-opacity="0.45" stroke-width="1.4"/>
    <path d="M 5,0 H 345 V 10 H 5 Z" fill="url(#stkBack)" stroke="${STOVE_INK}" stroke-width="1.6"/>
    <path d="M 11,4 H 339" stroke="#e1e8ee" stroke-opacity="0.5" stroke-width="1.2"/>
    <path d="M 7,10 H 343 L 350,56 H 0 Z" fill="url(#stkTop)" stroke="${STOVE_INK}" stroke-width="1.8"/>
    <ellipse cx="102" cy="48" rx="32" ry="3.6" fill="#b28a62" opacity="0.28"/><ellipse cx="197" cy="20" rx="26" ry="3" fill="#c9a37a" opacity="0.22"/><ellipse cx="276" cy="50" rx="22" ry="3.2" fill="#b28a62" opacity="0.26"/>
    <path d="M 12,53 H 338" stroke="#e8eef3" stroke-opacity="0.38" stroke-width="1.3"/>
    ${plates}
    ${knobs}
  </svg>`;
})();

// Olla de acero (vista 3/4): Shio = olla grande con el caldo que baja; fideos = olla mediana con agua y fideos
function stovePotSvg(o) {
  const cx = 65, cy = 21, rx = o.rx, ry = Math.round(rx * 0.24), bt = 54, x0 = cx - rx, x1 = cx + rx, ink = STOVE_INK, uid = o.id;
  const lvl = Math.max(0, Math.min(1, o.level));
  const lrx = rx - 6, lry = ry - 3, lcy = cy + 1.5 + (1 - lvl) * 5;
  let flames = '';
  if (o.fire) {
    for (let k = 0; k < 9; k++) { const fx = cx - rx * 0.72 + k * (rx * 1.44 / 8); flames += `<path d="M ${(fx - 3.4).toFixed(1)},70 Q ${(fx - 4.2).toFixed(1)},63 ${fx.toFixed(1)},55 Q ${(fx + 4.2).toFixed(1)},63 ${(fx + 3.4).toFixed(1)},70 Z" fill="#4aa3ff" stroke="#1f5fa8" stroke-width="0.5"/><path d="M ${(fx - 1.5).toFixed(1)},66 Q ${fx.toFixed(1)},60 ${(fx + 1.5).toFixed(1)},66 Z" fill="#ff9a3d"/>`; }
    flames = `<g class="pan-flame">${flames}</g>`;
  }
  const handle = sg => `<path d="M ${cx + sg * (rx - 1)},${cy + 8} q ${sg * 13},-4 ${sg * 11},9 q ${-sg},6 ${-sg * 11},4" fill="none" stroke="${ink}" stroke-width="5.6" stroke-linecap="round"/><path d="M ${cx + sg * (rx - 1)},${cy + 8} q ${sg * 13},-4 ${sg * 11},9 q ${-sg},6 ${-sg * 11},4" fill="none" stroke="#b4bfca" stroke-width="3" stroke-linecap="round"/>`;
  let content = '';
  if (o.liquid && lvl > 0) {
    content += `<ellipse cx="${cx}" cy="${lcy.toFixed(1)}" rx="${lrx}" ry="${lry}" fill="${o.liquid}" stroke="rgba(0,0,0,0.25)" stroke-width="0.6"/><ellipse cx="${cx - 8}" cy="${(lcy - 1).toFixed(1)}" rx="${(lrx * 0.45).toFixed(1)}" ry="${(lry * 0.4).toFixed(1)}" fill="#ffffff" opacity="0.22"/>`;
    if (o.meat) content += `<g fill="#b9605a" stroke="#6e2a26" stroke-width="0.6"><rect x="${cx - 22}" y="${(lcy - 2).toFixed(1)}" width="9" height="4.2" rx="1.6"/><rect x="${cx - 4}" y="${(lcy + 1).toFixed(1)}" width="9" height="4.2" rx="1.6"/><rect x="${cx + 10}" y="${(lcy - 3).toFixed(1)}" width="9" height="4.2" rx="1.6"/></g>`;
    if (o.noodles === 'cook') content += `<g stroke="#f6e08a" stroke-width="1.8" stroke-linecap="round" fill="none">${[-9, -3, 3, 9].map(d => `<path d="M ${cx - 20},${(lcy + d * 0.3).toFixed(1)} q 5,-4 10,0 t 10,0 t 10,0 t 10,0"/>`).join('')}</g>`;
    if (o.noodles === 'ready') content += `<ellipse cx="${cx}" cy="${cy - 3}" rx="${(rx * 0.5).toFixed(1)}" ry="6" fill="#f2c24a" stroke="#a87a1c" stroke-width="0.8"/><g stroke="#d9a62c" stroke-width="1" fill="none"><path d="M ${cx - 14},${cy - 4} q 5,-3 10,0 t 10,0 t 10,0"/><path d="M ${cx - 12},${cy - 1} q 5,-3 10,0 t 10,0"/></g>`;
    if (o.noodles === 'burnt') content += `<ellipse cx="${cx}" cy="${cy - 1}" rx="${(rx * 0.5).toFixed(1)}" ry="5" fill="#3a2a1c" stroke="#1b120a" stroke-width="0.8"/>`;
    if (o.bubbles) content += [[-18, 0, 'b1'], [-4, 2, 'b2'], [12, -1, 'b3'], [24, 1, 'b2']].map(([dx, dy, c]) => `<circle class="pot-bub ${c}" cx="${cx + dx}" cy="${(lcy + dy).toFixed(1)}" r="1.9" fill="#fff8d6" stroke="#caa84a" stroke-width="0.4"/>`).join('');
  } else {
    content += `<ellipse cx="${cx}" cy="${cy + 4}" rx="${lrx - 4}" ry="${lry - 1}" fill="#3e444c"/><ellipse cx="${cx}" cy="${cy + 4}" rx="${lrx - 14}" ry="${lry - 4}" fill="#5a4630" opacity="0.55"/>`;
  }
  const steam = o.steam ? `<g class="pan-steam" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.8"><path d="M ${cx - 14},${cy - 6} q -5,-8 0,-15"/><path d="M ${cx},${cy - 8} q 5,-8 0,-16"/><path d="M ${cx + 14},${cy - 6} q -5,-8 0,-15"/></g>` : '';
  return `<svg class="pan-svg" viewBox="0 0 130 72" preserveAspectRatio="xMidYMax meet">
    <defs><linearGradient id="potSteel${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e7884"/><stop offset="0.25" stop-color="#c3ccd5"/><stop offset="0.5" stop-color="#8f9aa6"/><stop offset="0.8" stop-color="#d3dce4"/><stop offset="1" stop-color="#5f6974"/></linearGradient></defs>
    ${flames}
    ${handle(-1)}${handle(1)}
    <path d="M ${x0},${cy} C ${x0},${bt} ${x0 + 12},${bt + 5} ${cx},${bt + 5} C ${x1 - 12},${bt + 5} ${x1},${bt} ${x1},${cy} Z" fill="url(#potSteel${uid})" stroke="${ink}" stroke-width="1.6"/>
    <path d="M ${x0 + 6},${cy + 12} Q ${cx},${cy + 20} ${x1 - 6},${cy + 12}" stroke="#ffffff" stroke-opacity="0.28" stroke-width="1.3" fill="none"/>
    <path d="M ${x0 + 4},${cy + 22} q 8,4 14,-1" stroke="#b79e86" stroke-opacity="0.5" stroke-width="1.6" fill="none"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#d3dbe3" stroke="${ink}" stroke-width="1.4"/>
    <ellipse cx="${cx}" cy="${cy + 0.6}" rx="${rx - 3}" ry="${ry - 1.6}" fill="#566069" stroke="#3d444d" stroke-width="0.7"/>
    ${content}
    ${steam}
  </svg>`;
}
// Bandeja de acero con láminas de chasu: crudas hasta que se flamean (se doran las porciones que ya hay en stock)
function chasuTraySvg(stock, cap, flaming, prog) {
  const ink = STOVE_INK, N = 8;
  const flamed = Math.max(0, Math.min(N, (stock / Math.max(1, cap)) * N));       // láminas ya flameadas (puede ser fraccionario: la que se está dorando)
  const cur = flaming ? Math.min(1, prog / 2) : 0;                              // avance de la porción que se está flameando (0..1)
  const partial = flaming ? flamed + cur * (N / Math.max(1, cap)) : flamed;
  const pos = [[34, 33, -4], [56, 31, 3], [78, 33, -3], [100, 31, 4], [30, 47, 3], [53, 48, -4], [77, 47, 3], [100, 48, -3]];
  const slice = (x, y, rot, k) => {
    const f = Math.max(0, Math.min(1, partial - k));          // 0 cruda · 1 flameada
    const raw = '#e6a392', fat = '#f8e6d8', brown = '#a85b2c', char = '#3d1d0c';
    const mix = (c1, c2, t) => { const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16); const m = (sh) => Math.round(((a >> sh) & 255) * (1 - t) + ((b >> sh) & 255) * t); return '#' + [16, 8, 0].map(sh => m(sh).toString(16).padStart(2, '0')).join(''); };
    const body = mix(raw, brown, f);
    let g = `<g transform="translate(${x} ${y}) rotate(${rot})"><ellipse cx="0" cy="0" rx="11.5" ry="6.6" fill="${body}" stroke="${ink}" stroke-width="1.1"/>`;
    g += `<path d="M -10,-2.2 Q 0,-7.2 10,-2.2" fill="none" stroke="${mix(fat, '#d9a05a', f)}" stroke-width="2.2" stroke-linecap="round"/>`;
    g += `<path d="M -7,1 Q -2,-1 3,1.4 M -4,3.2 Q 1,1.8 7,3.4" stroke="${mix('#f4c8bc', '#7a3a18', f)}" stroke-width="0.8" fill="none"/>`;
    if (f > 0.15) g += `<g fill="${char}" opacity="${(0.35 + 0.6 * f).toFixed(2)}"><ellipse cx="-5" cy="0.5" rx="1.6" ry="1"/><ellipse cx="2" cy="-1.5" rx="2" ry="1.1"/><ellipse cx="6" cy="2" rx="1.4" ry="0.9"/><ellipse cx="-1" cy="3" rx="1.3" ry="0.8"/></g><ellipse cx="-3" cy="-2" rx="5" ry="1.6" fill="#ffd28a" opacity="${(0.45 * f).toFixed(2)}"/>`;
    return g + '</g>';
  };
  const slices = pos.map(([x, y, r], k) => slice(x, y, r, k)).join('');
  const glow = flaming ? '<ellipse cx="66" cy="40" rx="50" ry="14" fill="#ff7a1a" opacity="0.18"/>' : '';
  return `<svg class="pan-svg" viewBox="0 0 130 80" preserveAspectRatio="xMidYMax meet">
    <defs>
      <linearGradient id="trayFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d98a5"/><stop offset="1" stop-color="#4f5863"/></linearGradient>
      <linearGradient id="trayTop" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa5b1"/><stop offset="0.5" stop-color="#cfd8e0"/><stop offset="1" stop-color="#8a95a2"/></linearGradient>
    </defs>
    <ellipse cx="65" cy="72" rx="58" ry="5" fill="rgba(0,0,0,0.4)"/>
    <path d="M 3,60 H 127 L 125,70 H 5 Z" fill="url(#trayFront)" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M 16,20 H 114 L 127,60 H 3 Z" fill="url(#trayTop)" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M 22,25 H 108 L 119,56 H 11 Z" fill="#6f7a86" stroke="#3f4650" stroke-width="1"/>
    <path d="M 22,25 H 108" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.2"/>
    <rect x="-1" y="38" width="7" height="6" rx="2.5" fill="#aab4be" stroke="${ink}" stroke-width="1.2"/><rect x="124" y="38" width="7" height="6" rx="2.5" fill="#aab4be" stroke="${ink}" stroke-width="1.2"/>
    ${glow}${slices}
    ${flaming ? '<g class="pan-steam" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.7"><path d="M 44,22 q -3,-6 1,-11"/><path d="M 70,20 q 3,-6 -1,-12"/><path d="M 94,22 q -3,-6 1,-11"/></g>' : ''}
  </svg>`;
}
let stoveArtSig = {};
function stoveArtSet(id, html) {
  const el = document.getElementById(id);
  if (!el || stoveArtSig[id] === html) return;
  stoveArtSig[id] = html;
  el.innerHTML = html;
}
function renderStoveArt() {
  if (!stagedOn('ramen')) return;
  const bg = document.getElementById('ramen-stove-bg');
  if (bg && !bg.firstChild) bg.innerHTML = STOVE_BG_SVG;
  const sh = kitchenState.shio, stock = kitchenState.stocks.shio, cap = Math.max(1, stockCap());
  const warm = sh.hot || stock > 0;
  stoveArtSet('shio-art', stovePotSvg({ id: 'sh', rx: 52, liquid: warm ? '#d9b24a' : '#cfc28c', level: warm ? Math.min(1, stock / cap) : 0.72, fire: !!sh.fire, bubbles: !!sh.fire && (warm || (sh.heat || 0) > 0), steam: !!sh.fire && !!sh.hot, meat: false }));
  stoveArtSet('chasu-art', chasuTraySvg(kitchenState.stocks.chasu, stockCap(), !!kitchenState.chasu.isFlaming, kitchenState.chasu.flameSeconds || 0));
  const nd = kitchenState.noodles.state;
  stoveArtSet('noodles-art', stovePotSvg({ id: 'nd', rx: 52, liquid: nd === 'BURNING' ? '#6b5a3c' : '#cfe6ea', level: 0.85, fire: nd !== 'IDLE', bubbles: nd === 'COOKING', steam: nd === 'COOKING' || nd === 'READY', noodles: nd === 'COOKING' ? 'cook' : (nd === 'READY' ? 'ready' : (nd === 'BURNING' ? 'burnt' : 'none')) }));
}

function renderPans() {
  const staged = stagedOn('ramen');
  const panel = document.getElementById('cook-stations-panel'), dock = document.getElementById('bowls-dock-box');
  if (panel) panel.classList.toggle('stove-on', staged);
  if (dock) dock.classList.toggle('stove-on', staged);
  const dockEl = document.querySelector('.kitchen-bottom-dock');
  if (dockEl) dockEl.classList.toggle('stove-on', staged);
  const ct = document.querySelector('#btn-flame-chasu .station-title');
  if (ct) ct.textContent = staged ? 'Chasu a flamear' : 'Flamear Chasu';
  const nt = document.querySelector('#btn-cook-noodles .station-title'), st2 = document.querySelector('#btn-heat-shio .station-title');
  if (nt) nt.textContent = staged ? 'Fideos' : 'Cocinar Fideos';
  if (st2) st2.textContent = staged ? 'Caldo Shio' : 'Calentar Shio';
  if (!staged) return;
  renderStoveArt();
  renderToolStrip();
  const T = panTimes();
  [0, 1].forEach(i => {
    const cell = document.getElementById('pan-cell-' + i);
    if (!cell) return;
    const pan = panGet(i), ph = panPhase(pan), rn = panRecipeName(pan);
    cell.classList.toggle('active', ph !== 'EMPTY' && !pan.fire);
    cell.classList.toggle('heating', pan.fire && ['HEAT', 'RAW', 'GOOD', 'OVER', 'HOT'].includes(ph));
    cell.classList.toggle('fire', !!pan.fire);
    cell.classList.toggle('needs-oil', !!(rn && PAN_RECIPES[rn] && PAN_RECIPES[rn].oil && !pan.oil && !pan.served && ph !== 'EMPTY'));
    cell.classList.toggle('pan-ready', ph === 'HOT' || ph === 'TOP' || ph === 'GOOD');
    cell.classList.toggle('pan-warn', ph === 'HOT' && pan.fire && ((rn === 'Tonkotsu' && pan.foam >= 60) || (rn !== 'Tonkotsu' && pan.vol <= 35)));
    const art = document.getElementById('pan-art-' + i), st = document.getElementById('pan-status-' + i), fill = document.getElementById('pan-fill-' + i);
    if (art) art.innerHTML = generatePanSVG(pan, ph);
    if (st) st.textContent = panStatusText(pan, ph);
    if (fill) fill.style.width = (ph === 'HEAT' ? Math.round(100 * pan.heat / T.heat) : (ph === 'HOT' ? Math.round(rn === 'Tonkotsu' ? pan.foam : pan.vol) : 0)) + '%';
  });
}
