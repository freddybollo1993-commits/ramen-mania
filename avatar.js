/* Avatar del chef: muñeco 2D por capas (SVG) que ocupa el centro de la pantalla principal.
   Cada pieza (piel, peinado, color de pelo, gorro, ropa, delantal y cara) es una capa; comprar y equipar cosméticos solo cambia una capa.
   · Cada pieza se define en CATALOGO con su precio en propinas y una función que dibuja sus capas (back = detrás del cuerpo, front = delante).
     Más adelante cualquier pieza puede pasar a una imagen WebP (campo img) sin tocar la tienda ni el guardado.
   · Lo comprado y lo equipado se guarda en el aparato (ramen_avatar_v1) y viaja con la cuenta dentro del snapshot de taller.js (clave av).
   Script clásico, sin dependencias. API: Avatar.svg(look, opciones) · Avatar.look() · Avatar.catalog() · Avatar.buy/equip · Avatar.open(). */
(function () {
  'use strict';
  const KEY = 'ramen_avatar_v1';
  const $ = id => document.getElementById(id);
  const sfx = n => { try { playSound(n); } catch (e) {} };
  const toast = m => { try { showStationToast(m); } catch (e) {} };
  const wallet = () => { try { return getPropinasWallet(); } catch (e) { return 0; } };
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const O = '#2b1810';                                                   // contorno
  const ln = (w) => `stroke="${O}" stroke-width="${w || 4}" stroke-linejoin="round" stroke-linecap="round"`;
  const P = (d, fill, w, extra) => `<path d="${d}" fill="${fill}" ${ln(w)} ${extra || ''}/>`;
  const C = (x, y, r, fill, w) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${w === 0 ? '' : ln(w)}/>`;

  // ---------------- piezas ----------------
  const SLOTS = [
    { id: 'peinado', name: 'Peinado', ic: '💇' },
    { id: 'color', name: 'Color de pelo', ic: '🎨' },
    { id: 'gorro', name: 'Gorro', ic: '🎓' },
    { id: 'ropa', name: 'Ropa', ic: '👕' },
    { id: 'delantal', name: 'Delantal', ic: '🧑‍🍳' },
    { id: 'cara', name: 'Cara', ic: '👓' },
    { id: 'piel', name: 'Piel', ic: '🖐️' }
  ];
  const HEAD = 'M40 92C40 52 66 40 100 40C134 40 160 52 160 92C160 126 134 148 100 148C66 148 40 126 40 92Z';
  const TORSO = 'M70 150Q68 144 78 143H122Q132 144 130 150L135 212Q135 222 125 222H75Q65 222 65 212Z';

  const PIEL = [['p1', 'Clara', '#ffdcb8', '#f2b98c'], ['p2', 'Trigo', '#f5c79a', '#e0a373'], ['p3', 'Miel', '#e0a97a', '#c98c5c'], ['p4', 'Canela', '#c68a5e', '#a96c43'], ['p5', 'Cacao', '#9a6040', '#7c4a2e'], ['p6', 'Ébano', '#6d4230', '#55321f']]
    .map(([k, name, c, s]) => ({ id: 'piel_' + k, name, price: 0, c, s }));

  const COLOR = [['negro', 'Negro', '#2e2636', '#52485e', 0], ['castano', 'Castaño', '#6b4128', '#946040', 0], ['rubio', 'Rubio', '#e3b448', '#f6d77a', 30], ['rojo', 'Pelirrojo', '#c4492a', '#e8704c', 30],
    ['canoso', 'Canoso', '#d6d6e2', '#f2f2fa', 40], ['azul', 'Azul', '#3f7fe0', '#78aef5', 60], ['rosa', 'Rosa', '#ee6fa6', '#f8a2c8', 60], ['menta', 'Menta', '#4fcfa0', '#8ae8c6', 60], ['violeta', 'Violeta', '#8c58d8', '#b48cf0', 60]]
    .map(([k, name, c, h, price]) => ({ id: 'color_' + k, name, price, c, h }));

  // peinados: back = detrás de la cabeza, front = flequillo y mechones sobre la frente. Reciben el color c y el brillo h.
  const FRINGE = 'M38 96C32 50 64 24 100 24C136 24 168 50 162 96C152 80 142 72 132 66C122 78 104 72 98 60C90 74 66 76 58 66C48 72 40 84 38 96Z';
  const shine = (h) => `<path d="M62 44C74 34 92 31 108 33" fill="none" stroke="${h}" stroke-width="5" stroke-linecap="round" opacity=".75"/>`;
  const PEINADO = [
    { id: 'peinado_corto', name: 'Corto', price: 0, front: (c, h) => P(FRINGE, c) + shine(h) },
    { id: 'peinado_erizado', name: 'Erizado', price: 25, front: (c, h) => P('M38 96C30 64 38 44 52 36L56 16L72 30L84 8L98 28L114 6L126 28L144 12L146 34L160 42C170 62 166 80 162 96C152 80 142 72 134 66C124 78 106 70 100 60C92 74 70 76 60 66C50 72 42 84 38 96Z', c) + `<path d="M84 8L98 28M114 6L126 28" fill="none" stroke="${h}" stroke-width="4" stroke-linecap="round" opacity=".7"/>` },
    { id: 'peinado_mono', name: 'Moño', price: 35, back: (c, h) => P('M78 34C70 6 130 6 122 34Z', c) + C(100, 18, 21, c) + `<path d="M88 12C92 6 100 5 106 8" fill="none" stroke="${h}" stroke-width="4" stroke-linecap="round" opacity=".8"/>`, front: (c, h) => P(FRINGE, c) + shine(h) },
    { id: 'peinado_coleta', name: 'Coleta', price: 35, back: (c, h) => `<g class="av-tail">${P('M144 52C176 40 196 70 190 100C186 126 170 140 162 160C152 138 168 124 170 102C172 84 160 78 144 80Z', c)}${C(146, 66, 8, '#e53935', 3)}</g>`, front: (c, h) => P(FRINGE, c) + shine(h) },
    { id: 'peinado_largo', name: 'Melena', price: 50, back: (c, h) => P('M34 90C24 140 30 184 52 200L148 200C170 184 176 140 166 90Z', c),
      front: (c, h) => P(FRINGE, c) + shine(h) + P('M40 98C32 126 38 158 48 176C58 158 58 126 56 100Z', c, 3) + P('M160 98C168 126 162 158 152 176C142 158 142 126 144 100Z', c, 3) },
    { id: 'peinado_rapado', name: 'Casi rapado', price: 15, front: (c, h) => P('M42 82C46 52 68 40 100 40C132 40 154 52 158 82C148 66 128 58 100 58C72 58 52 66 42 82Z', c, 3, 'opacity=".92"') }
  ];

  const GORRO = [
    { id: 'gorro_ninguno', name: 'Sin gorro', price: 0 },
    { id: 'gorro_hachimaki', name: 'Hachimaki', price: 25, front: () => P('M41 66C62 54 138 54 159 66L159 82C138 70 62 70 41 82Z', '#fbf7ee') + C(100, 68, 7, '#d32f2f', 2) + P('M156 70L184 80L174 88L190 100L160 88Z', '#fbf7ee', 3) },
    { id: 'gorro_tenugui', name: 'Pañuelo tenugui', price: 35, front: () => P('M39 84C37 46 66 32 100 32C134 32 163 46 161 84C140 66 60 66 39 84Z', '#2f4f8f') + [[70, 52], [100, 44], [130, 52], [84, 64], [116, 64]].map(([x, y]) => C(x, y, 3.2, '#fbf7ee', 0)).join('') + P('M156 62L182 54L178 72L190 84L160 82Z', '#2f4f8f', 3) },
    { id: 'gorro_orejas', name: 'Orejas de gato', price: 55, front: () => P('M44 54L52 12L84 38Z', '#37323f') + P('M56 44L58 24L72 38Z', '#f48fb1', 0) + P('M156 54L148 12L116 38Z', '#37323f') + P('M144 44L142 24L128 38Z', '#f48fb1', 0) + `<path d="M46 56C66 38 134 38 154 56" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M46 56C66 38 134 38 154 56" fill="none" stroke="#5a5266" stroke-width="4" stroke-linecap="round"/>` },
    { id: 'gorro_toque', name: 'Gorro de chef', price: 80, front: () => C(66, 20, 22, '#fffdf7') + C(134, 20, 22, '#fffdf7') + C(100, 8, 26, '#fffdf7') + P('M54 34H146L142 62Q100 70 58 62Z', '#fffdf7') + `<path d="M62 48C90 54 110 54 138 48" fill="none" stroke="#d9d2c2" stroke-width="3" stroke-linecap="round"/>` },
    { id: 'gorro_kasa', name: 'Sombrero kasa', price: 120, front: () => P('M28 62L100 -10L172 62Q100 82 28 62Z', '#e2b862') + `<path d="M56 56L100 6M82 64L112 18M124 66L120 16M148 58L128 14" fill="none" stroke="#b98a35" stroke-width="3" stroke-linecap="round" opacity=".75"/><path d="M28 62Q100 82 172 62" fill="none" stroke="${O}" stroke-width="4"/>` },
    { id: 'gorro_corona', name: 'Corona dorada', price: 400, front: () => P('M60 44L62 8L82 28L100 -2L118 28L138 8L140 44Z', '#ffc928') + C(100, 30, 6, '#e53935', 2.5) + C(76, 36, 4, '#42a5f5', 2) + C(124, 36, 4, '#66bb6a', 2) + `<path d="M66 16L76 28" stroke="#fff3b0" stroke-width="3" stroke-linecap="round"/>` }
  ];

  // ropa: torso y mangas. torso(): sobre el tronco; sleeve: color de la manga; cuff: puño opcional.
  const ROPA = [
    { id: 'ropa_camiseta', name: 'Camiseta roja', price: 0, sleeve: '#e0523f', torso: () => P(TORSO, '#e0523f') + `<path d="M88 146Q100 160 112 146" fill="#f2b98c" ${ln(3)}/><path d="M72 160L74 206" stroke="#f08a78" stroke-width="5" stroke-linecap="round" opacity=".6"/>` },
    { id: 'ropa_sudadera', name: 'Sudadera gris', price: 40, sleeve: '#8c909c', cuff: '#6f7380', torso: () => P(TORSO, '#8c909c') + P('M70 146Q100 164 130 146L126 138Q100 150 74 138Z', '#757987', 3) + `<path d="M92 156V176M108 156V176" stroke="#fbf7ee" stroke-width="3" stroke-linecap="round"/><path d="M82 196H118L124 218H76Z" fill="#7a7e8b" ${ln(3)}/>` },
    { id: 'ropa_chef', name: 'Chaqueta de chef', price: 60, sleeve: '#fffdf7', cuff: '#e6dfcf', torso: () => P(TORSO, '#fffdf7') + P('M84 143L100 166L116 143L112 138H88Z', '#f1ead8', 3) + `<path d="M100 166V220" stroke="#d6cdb8" stroke-width="3"/>` + [[90, 178], [90, 198], [110, 178], [110, 198]].map(([x, y]) => C(x, y, 3.6, '#2b3a55', 2)).join('') },
    { id: 'ropa_happi', name: 'Happi de festival', price: 90, sleeve: '#2f4f8f', cuff: '#fbf7ee', torso: () => P(TORSO, '#2f4f8f') + `<path d="M84 143L106 190L116 143" fill="none" stroke="#fbf7ee" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M68 214H132" stroke="#fbf7ee" stroke-width="6"/>` + C(84, 186, 8, 'none', 0) + `<circle cx="86" cy="190" r="7" fill="#fbf7ee"/>` },
    { id: 'ropa_yukata', name: 'Yukata de sakura', price: 140, sleeve: '#ee9ab4', cuff: '#fbf7ee', torso: () => P(TORSO, '#ee9ab4') + [[80, 166], [118, 172], [92, 188], [112, 160], [78, 200]].map(([x, y]) => C(x, y, 4.5, '#fff0f4', 0)).join('') + `<path d="M84 143L100 178L116 143" fill="none" stroke="#fbf7ee" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` + P('M66 188H134V208H66Z', '#3d2c6b', 3.5) + P('M96 186L84 214L96 210ZM104 186L116 214L104 210Z', '#5a45a0', 3) },
    { id: 'ropa_gala', name: 'Traje de gala', price: 260, sleeve: '#2a2a38', cuff: '#fffdf7', torso: () => P(TORSO, '#2a2a38') + P('M84 143L100 196L116 143L100 150Z', '#fffdf7', 3) + P('M92 150L100 160L108 150L100 146Z', '#c62828', 2.5) + [[100, 178], [100, 194], [100, 208]].map(([x, y]) => C(x, y, 3.2, '#ffc928', 2)).join('') }
  ];

  const DELANTAL = [
    { id: 'delantal_ninguno', name: 'Sin delantal', price: 0 },
    ...[['marron', 'Marrón de cocina', '#8a5a30', '#6b4423', 25], ['blanco', 'Blanco', '#fbf7ee', '#e6dfcf', 25], ['indigo', 'Índigo', '#2f4f8f', '#223a6b', 45], ['rojo', 'Rojo ramen', '#c8372d', '#9a2a22', 45], ['negro', 'Negro y oro', '#2a2a38', '#1c1c27', 120]]
      .map(([k, name, c, s, price]) => ({ id: 'delantal_' + k, name, price, front: () => `<path d="M86 146L82 172M114 146L118 172" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M86 146L82 172M114 146L118 172" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>` + P('M78 166H122L128 222H72Z', c) + `<path d="M84 196H116V214H84Z" fill="${s}" ${ln(2.5)}/>` + (k === 'negro' ? `<path d="M80 172H120" stroke="#ffc928" stroke-width="3"/>` : '') }))
  ];

  const CARA = [
    { id: 'cara_ninguna', name: 'Sin accesorio', price: 0 },
    { id: 'cara_gafas', name: 'Gafas redondas', price: 45, front: () => `<g fill="rgba(190,225,255,.28)" ${ln(3.2)}><circle cx="78" cy="98" r="17"/><circle cx="122" cy="98" r="17"/></g><path d="M95 98Q100 92 105 98M61 96L44 92M139 96L156 92" fill="none" ${ln(3)}/><path d="M68 90L76 84" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>` },
    { id: 'cara_sol', name: 'Gafas de sol', price: 70, front: () => P('M58 86H96L94 106Q90 116 76 116Q60 116 58 100Z', '#1b1722', 3.5) + P('M104 86H142L142 100Q140 116 124 116Q110 116 106 106Z', '#1b1722', 3.5) + `<path d="M96 92H104M58 90L44 88M142 90L156 88" fill="none" ${ln(3.5)}/><path d="M66 92L78 92M114 92L126 92" stroke="#7d6fa0" stroke-width="3" stroke-linecap="round"/>` },
    { id: 'cara_bigote', name: 'Bigote', price: 50, front: () => P('M100 112C92 106 78 106 72 114C80 120 92 120 100 116C108 120 120 120 128 114C122 106 108 106 100 112Z', '#3b2a22', 3) },
    { id: 'cara_mascarilla', name: 'Mascarilla', price: 35, front: () => P('M58 108C74 103 126 103 142 108C142 128 128 144 100 147C72 144 58 128 58 108Z', '#f4f8fb', 3.5) + `<path d="M70 118Q100 124 130 118M72 130Q100 136 128 130" fill="none" stroke="#c9d6df" stroke-width="2.5" stroke-linecap="round"/><path d="M58 112L44 100M142 112L156 100" fill="none" ${ln(2.5)}/>` },
    { id: 'cara_flor', name: 'Flor de hibisco', price: 40, front: () => [0, 72, 144, 216, 288].map(a => `<ellipse cx="144" cy="52" rx="7" ry="11" fill="#ef5350" ${ln(2.2)} transform="rotate(${a} 144 60) translate(0 -2)"/>`).join('') + C(144, 60, 4.5, '#ffd54f', 2) }
  ];

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
  const look = () => { load(); const o = {}; SLOTS.forEach(s => { const id = S.eq[s.id]; o[s.id] = BY_ID[id] && owned(id) ? id : DEFAULT[s.id]; }); return o; };
  function spent() { load(); let t = 0; Object.keys(S.own).forEach(id => { const it = BY_ID[id]; if (it) t += it.price; }); return t; }

  // ---------------- dibujo ----------------
  /** Devuelve el SVG del muñeco. lk = {slot: idPieza} (lo que falte se toma de lo equipado); o.bust = solo busto; o.still = sin animación. */
  function svg(lk, o) {
    o = o || {}; const L = Object.assign({}, look(), lk || {});
    const g = id => BY_ID[id] || BY_ID[DEFAULT[(BY_ID[id] || {}).slot]] || {};
    const skin = g(L.piel), col = g(L.color), hair = g(L.peinado), hat = g(L.gorro), cl = g(L.ropa), ap = g(L.delantal), fc = g(L.cara);
    const sk = skin.c, sh = skin.s, hc = col.c, hh = col.h, sl = cl.sleeve || '#e0523f';
    const arm = (side) => {
      const s = side === 'L' ? 1 : -1, x0 = 100 - 29 * s, x1 = 100 - 43 * s;
      return `<g class="av-arm${side}"><path d="M${x0} 158Q${x1} 178 ${100 - 41 * s} 202" fill="none" stroke="${O}" stroke-width="23" stroke-linecap="round"/><path d="M${x0} 158Q${x1} 178 ${100 - 41 * s} 202" fill="none" stroke="${sl}" stroke-width="15" stroke-linecap="round"/>`
        + (cl.cuff ? `<path d="M${100 - 37 * s} 196L${100 - 45 * s} 198" stroke="${cl.cuff}" stroke-width="15" stroke-linecap="butt" opacity="0"/>` : '')
        + C(100 - 41 * s, 210, 9.5, sk) + `</g>`;
    };
    const face = `<g class="av-face">`
      + `<g class="av-eye"><ellipse cx="77" cy="100" rx="8.5" ry="11.5" fill="${O}"/><circle cx="74" cy="95" r="3.6" fill="#fff"/><circle cx="80" cy="105" r="1.8" fill="#fff"/></g>`
      + `<g class="av-eye"><ellipse cx="123" cy="100" rx="8.5" ry="11.5" fill="${O}"/><circle cx="120" cy="95" r="3.6" fill="#fff"/><circle cx="126" cy="105" r="1.8" fill="#fff"/></g>`
      + `<path d="M66 82Q77 76 88 81M112 81Q123 76 134 82" fill="none" stroke="${O}" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>`
      + `<ellipse cx="62" cy="118" rx="9" ry="5.5" fill="#ff7a8a" opacity=".42"/><ellipse cx="138" cy="118" rx="9" ry="5.5" fill="#ff7a8a" opacity=".42"/>`
      + `<path d="M91 121Q100 133 109 121Z" fill="#8a2f33" ${ln(3)}/><path d="M95 127Q100 131 105 127" fill="#ff8f8a" stroke="none"/>`
      + `<path d="M98 110Q100 113 102 110" fill="none" stroke="${sh}" stroke-width="3" stroke-linecap="round"/>`
      + `</g>`;
    const body = `<g class="av-all">`
      + `<ellipse class="av-shadow" cx="100" cy="266" rx="56" ry="9" fill="rgba(0,0,0,.42)"/>`
      + (hair.back ? hair.back(hc, hh) : '')
      + P('M80 214H96L95 250H78Z', '#363a52') + P('M104 214H120L122 250H105Z', '#363a52')
      + P('M70 252Q68 240 84 240Q98 240 98 254V262H72Q70 262 70 252Z', '#f2f0ea') + P('M130 252Q132 240 116 240Q102 240 102 254V262H128Q130 262 130 252Z', '#f2f0ea')
      + `<g class="av-torso">` + (cl.torso ? cl.torso() : '') + (ap.front ? ap.front() : '') + `</g>`
      + arm('L') + arm('R')
      + P('M44 98C34 94 32 112 46 114Z', sk, 3.5) + P('M156 98C166 94 168 112 154 114Z', sk, 3.5)
      + `<g class="av-head">`
      + P(HEAD, sk) + `<path d="M52 118C60 136 76 144 92 146" fill="none" stroke="${sh}" stroke-width="5" stroke-linecap="round" opacity=".55"/>`
      + face + (fc.front ? fc.front() : '') + (hair.front ? hair.front(hc, hh) : '') + (hat.front ? hat.front() : '')
      + `</g></g>`;
    const vb = o.bust ? '14 -26 172 200' : '0 -26 200 306';
    return `<svg class="av-svg ${o.still ? '' : 'av-live'} ${o.cls || ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tu chef">${body}</svg>`;
  }

  // ---------------- compras ----------------
  function refresh() { try { if (window.Home) Home.refresh(); } catch (e) {} try { if (window.Taller) Taller.refresh(); } catch (e) {} }
  function buy(id) {
    const it = BY_ID[id]; if (!it || owned(id)) return false;
    if (wallet() < it.price) { toast('🧧 Te faltan ' + (it.price - wallet()) + ' propinas para ' + it.name + '.'); sfx('error'); return false; }
    load(); S.own[id] = 1; S.eq[it.slot] = id; try { updatePropinasHUD(); } catch (e) {} sfx('serve'); save(); toast('✨ ' + it.name + ' · ¡te queda genial!'); refresh(); return true;
  }
  function equip(id) {
    const it = BY_ID[id]; if (!it || !owned(id)) return false;
    load(); S.eq[it.slot] = id; sfx('click'); save(); refresh(); return true;
  }
  /** Saludo al tocar al chef. */
  function wave(root) { const el = (root || document).querySelector('.av-svg'); if (!el) return; el.classList.remove('av-hi'); void el.getBoundingClientRect(); el.classList.add('av-hi'); sfx('click'); clearTimeout(wave.t); wave.t = setTimeout(() => el.classList.remove('av-hi'), 1400); }

  // ---------------- estilos ----------------
  const CSS = `
  .av-svg { display: block; width: 100%; height: 100%; overflow: visible; }
  .av-svg * { transform-box: view-box; }
  .av-live .av-all { animation: avBob 3.4s ease-in-out infinite; }
  .av-live .av-shadow { animation: avSh 3.4s ease-in-out infinite; transform-origin: 100px 266px; }
  .av-live .av-torso { animation: avBreath 3.4s ease-in-out infinite; transform-origin: 100px 222px; }
  .av-live .av-armL { animation: avArmL 3.4s ease-in-out infinite; transform-origin: 71px 158px; }
  .av-live .av-armR { animation: avArmR 3.4s ease-in-out infinite; transform-origin: 129px 158px; }
  .av-live .av-head { animation: avHead 3.4s ease-in-out infinite; transform-origin: 100px 146px; }
  .av-live .av-eye { animation: avBlink 4.6s infinite; transform-origin: 100px 100px; transform-box: view-box; }
  .av-live .av-tail { animation: avTail 3.4s ease-in-out infinite; transform-origin: 146px 64px; }
  .av-live.av-hi .av-armR { animation: avWave 1.3s ease-in-out 1; }
  .av-live.av-hi .av-head { animation: avNod 1.3s ease-in-out 1; }
  @keyframes avBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes avSh { 0%, 100% { transform: scale(1); } 50% { transform: scale(.94); } }
  @keyframes avBreath { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.015, 1.03); } }
  @keyframes avArmL { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(2.5deg); } }
  @keyframes avArmR { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-2.5deg); } }
  @keyframes avHead { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-1.4deg) translateY(1px); } }
  @keyframes avBlink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(.08); } }
  @keyframes avTail { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(5deg); } }
  @keyframes avWave { 0% { transform: rotate(0); } 18% { transform: rotate(-150deg); } 32% { transform: rotate(-125deg); } 46% { transform: rotate(-155deg); } 60% { transform: rotate(-125deg); } 74% { transform: rotate(-150deg); } 100% { transform: rotate(0); } }
  @keyframes avNod { 0%, 100% { transform: rotate(0); } 25%, 70% { transform: rotate(3deg); } }
  @media (prefers-reduced-motion: reduce) { .av-live * { animation: none !important; } }`;
  function css() { if ($('av-css')) return; const s = document.createElement('style'); s.id = 'av-css'; s.textContent = CSS; document.head.appendChild(s); }
  css();

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
    svg, look, spent, snap, mergeSnap, apply, reset, buy, equip, wave, owned,
    slots: () => SLOTS, items: slot => CATALOGO[slot] || [], item: id => BY_ID[id] || null,
    /** Cuántas piezas de pago quedan por comprar (para el aviso de la tienda). */
    pending() { return Object.keys(BY_ID).filter(id => !owned(id)).length; },
    open() { if (window.Taller) Taller.open('apariencia'); }
  };
})();
