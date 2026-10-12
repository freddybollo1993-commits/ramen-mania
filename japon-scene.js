/* Escena animada del restaurante (Recorrido por Japón).
   Un corte lateral del local: arriba la cocina con sus mostradores, abajo el salón con las mesas, la caja a la izquierda y la entrada a la derecha.
   El personal camina y trabaja, los clientes entran, piden, comen, pagan y se van; todo se toca directamente.
   Es cosmético: la ganancia real la calcula japon.js; aquí solo se muestra (con el tiempo acelerado ×TL). Los sprites son vectoriales y se pueden cambiar por arte final. */
(function () {
  'use strict';
  const W = 800, H = 300, TL = 10;
  const ZR = { depo: [0, 108], ramen: [110, 260], salteados: [262, 412], frituras: [414, 564], makis: [566, 716], banos: [718, 800] };
  const KIT = ['ramen', 'salteados', 'frituras', 'makis'];
  const ICON = { ramen: '🍜', salteados: '🥘', frituras: '🍤', makis: '🍣' };
  // mesas (en el orden en que se van llenando) — repartidas a mano para que no se vea una cuadrícula
  const SLOTS = [[196, 152], [246, 214], [200, 268], [300, 146], [348, 208], [304, 270], [404, 154], [452, 214], [410, 272], [508, 148], [554, 210], [512, 270], [612, 156], [658, 214], [616, 272], [714, 150], [742, 208], [712, 268]];
  const ENTRY = [792, 270], CASH_STAND = [150, 262], PASS_Y = 116;
  const SKINS = ['#f6d3b3', '#efc29b', '#e0a878', '#c98a5c', '#a86b43'], HAIRS = ['#2b2118', '#3b2a1c', '#5a3a1f', '#1d1a1a', '#6b4a2a', '#8a8a8a'];
  const CLOTH = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4db6ac', '#f06292', '#90a4ae'];
  const LV = ['#9e9e9e', '#66bb6a', '#42a5f5', '#ab47bc', '#ffb300'];
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  let sc = null;

  // ---------- sprites ----------
  function personSvg(o) {
    const sk = o.skin, hr = o.hair, cl = o.cloth, role = o.role;
    const hat = role === 'cook' ? `<ellipse cx="14" cy="-4" rx="8.5" ry="5.5" fill="#fff"/><rect x="7" y="-3" width="14" height="8" rx="2" fill="#fff"/><rect x="7" y="3" width="14" height="2" fill="${o.band || '#ddd'}"/>`
      : role === 'waiter' ? `<path d="M5.5,6 Q14,-4 22.5,6 L22.5,8 L5.5,8 Z" fill="#3949ab"/><path d="M6,7 h16" stroke="#fff" stroke-width="1.2"/>`
      : role === 'cash' ? `<path d="M6,6 Q14,-1 22,6 L25,8 L3,8 Z" fill="#c62828"/>`
      : role === 'clean' ? `<path d="M5.5,7 Q14,-3 22.5,7 Z" fill="#43a047"/><rect x="5" y="6" width="18" height="2" fill="#2e7d32"/>`
      : role === 'depo' ? `<path d="M5.5,7 Q14,-2 22.5,7 L25,8 L3,8 Z" fill="#8d6e63"/>`
      : `<path d="M6,9 Q6,0 14,1 Q22,0 22,9 Q18,5 14,5 Q10,5 6,9 Z" fill="${hr}"/>`;
    const apron = role === 'cook' ? '<rect x="9" y="20" width="10" height="13" rx="2" fill="#fff" stroke="#d8d0c0" stroke-width="0.6"/>' : (role === 'waiter' ? '<rect x="9" y="22" width="10" height="11" rx="2" fill="#283593"/>' : '');
    const legs = o.sit ? '' : `<rect class="lg l" x="9" y="31" width="4.5" height="12" rx="1.6" fill="#37474f"/><rect class="lg r" x="14.5" y="31" width="4.5" height="12" rx="1.6" fill="#37474f"/><ellipse cx="11.5" cy="43.3" rx="3.4" ry="1.5" fill="#222"/><ellipse cx="16.8" cy="43.3" rx="3.4" ry="1.5" fill="#222"/>`;
    const hairBack = role === 'cust' ? `<path d="M5.5,11 Q5.5,2 14,2.5 Q22.5,2 22.5,11 L22.5,15 Q14,9 5.5,15 Z" fill="${hr}"/>` : `<path d="M6,12 Q6,5 14,5 Q22,5 22,12 Q14,7 6,12 Z" fill="${hr}"/>`;
    return `<svg viewBox="0 -10 28 56" width="28" height="56" aria-hidden="true"><ellipse cx="14" cy="44" rx="9" ry="2.6" fill="rgba(0,0,0,0.28)"/>
      <g class="bd">${legs}<rect x="7" y="17" width="14" height="16" rx="5" fill="${cl}"/>${apron}
      <ellipse class="ar l" cx="6.2" cy="25" rx="2.6" ry="6" fill="${cl}"/><ellipse class="ar r" cx="21.8" cy="25" rx="2.6" ry="6" fill="${cl}"/>
      <circle cx="14" cy="11" r="8" fill="${sk}"/>${role === 'cust' ? hairBack : hairBack}<circle cx="11" cy="12" r="1.05" fill="#2b2118"/><circle cx="17" cy="12" r="1.05" fill="#2b2118"/><path d="M11.4,15.4 Q14,17.6 16.6,15.4" fill="none" stroke="#a0524a" stroke-width="0.9" stroke-linecap="round"/><circle cx="9" cy="14.4" r="1.4" fill="#f4a5a0" opacity="0.55"/><circle cx="19" cy="14.4" r="1.4" fill="#f4a5a0" opacity="0.55"/>${hat}</g></svg>`;
  }
  function mkPerson(role, opt) {
    opt = opt || {};
    const el = document.createElement('div');
    el.className = 'jp-p ' + (opt.sit ? 'sit ' : '');
    const o = { role, skin: opt.skin || pick(SKINS), hair: opt.hair || pick(HAIRS), cloth: opt.cloth || (role === 'cook' ? opt.cloth || '#37474f' : role === 'waiter' ? '#5c6bc0' : role === 'cash' ? '#ef5350' : role === 'clean' ? '#66bb6a' : role === 'depo' ? '#a1887f' : pick(CLOTH)), sit: opt.sit, band: opt.band };
    el.innerHTML = `<div class="fl">${personSvg(o)}</div>`;
    if (opt.lvl) { const b = document.createElement('i'); b.className = 'jp-lv'; b.style.background = LV[opt.lvl - 1]; b.textContent = opt.lvl; el.appendChild(b); }
    return el;
  }

  // ---------- estaciones (arte vectorial de cada mostrador) ----------
  const WOOD = '#b98a4f', WOOD_D = '#8a6330', TOP = '#d9b073';
  function counter(open) { return `<rect x="4" y="70" width="142" height="30" rx="3" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.4"/><rect x="8" y="76" width="134" height="20" rx="2" fill="${open ? '#a67a42' : '#8b8680'}" opacity="0.9"/><rect x="2" y="64" width="146" height="9" rx="3" fill="${TOP}" stroke="${WOOD_D}" stroke-width="1.4"/><path d="M20,76 v20 M50,76 v20 M80,76 v20 M110,76 v20 M130,76 v20" stroke="${WOOD_D}" stroke-width="0.6" opacity="0.5"/>`; }
  const STATION = {
    ramen: open => `<g><rect x="52" y="30" width="46" height="36" rx="5" fill="#b0bec5" stroke="#546e7a" stroke-width="1.6"/><ellipse cx="75" cy="30" rx="23" ry="6" fill="#cfd8dc" stroke="#546e7a" stroke-width="1.4"/><ellipse cx="75" cy="30" rx="19" ry="4" fill="#d9a24a"/><path d="M60,34 q5,-5 10,0 t10,0 t10,0" fill="none" stroke="#fff" stroke-width="1" opacity="0.5"/>
      <rect x="104" y="48" width="22" height="16" rx="3" fill="#fff" stroke="#9e9e9e" stroke-width="1"/><rect x="108" y="52" width="14" height="8" rx="2" fill="#ef9a9a"/><g class="st"><circle cx="66" cy="22" r="4"/><circle cx="76" cy="16" r="5"/><circle cx="85" cy="22" r="4"/></g>
      <path d="M62,60 q4,-6 8,0 q4,-6 8,0 q4,-6 8,0" fill="#ff7043" opacity="0.9" class="fl2"/></g>`,
    salteados: open => `<g><rect x="20" y="52" width="110" height="14" rx="3" fill="#455a64" stroke="#263238" stroke-width="1.4"/><g class="wk"><path d="M30,52 q16,0 20,-12 q4,12 20,12 Z" fill="#37474f" stroke="#102027" stroke-width="1.4"/><rect x="66" y="48" width="26" height="5" rx="2" fill="#37474f"/></g>
      <g class="wk2"><path d="M84,52 q16,0 20,-12 q4,12 20,12 Z" fill="#37474f" stroke="#102027" stroke-width="1.4"/></g><g class="fire"><path d="M36,64 q3,-9 6,0 q3,-9 6,0 q3,-9 6,0" fill="#ff9800"/><path d="M92,64 q3,-9 6,0 q3,-9 6,0 q3,-9 6,0" fill="#ff9800"/></g>
      <g class="tos"><circle cx="48" cy="34" r="2.6" fill="#8bc34a"/><circle cx="54" cy="30" r="2.4" fill="#ff7043"/><circle cx="44" cy="30" r="2" fill="#ffd54f"/></g></g>`,
    frituras: open => `<g><rect x="14" y="36" width="56" height="30" rx="4" fill="#cfd8dc" stroke="#546e7a" stroke-width="1.6"/><rect x="20" y="40" width="44" height="14" rx="3" fill="#f2b84b"/><g class="bub"><circle cx="30" cy="46" r="2.2"/><circle cx="42" cy="44" r="1.8"/><circle cx="54" cy="47" r="2.4"/></g>
      <rect x="82" y="36" width="56" height="30" rx="4" fill="#cfd8dc" stroke="#546e7a" stroke-width="1.6"/><rect x="88" y="40" width="44" height="14" rx="3" fill="#f2b84b"/><g class="bub b2"><circle cx="98" cy="46" r="2.2"/><circle cx="112" cy="44" r="1.8"/><circle cx="124" cy="47" r="2.4"/></g>
      <path d="M26,34 l8,-14 M60,34 l-8,-14" stroke="#455a64" stroke-width="2" stroke-linecap="round"/></g>`,
    makis: open => `<g><rect x="28" y="56" width="66" height="9" rx="2" fill="#e6c48a" stroke="#8a6330" stroke-width="1.2"/><path d="M34,57 v7 M42,57 v7 M50,57 v7 M58,57 v7 M66,57 v7 M74,57 v7 M82,57 v7 M90,57 v7" stroke="#8a6330" stroke-width="0.8"/>
      <rect x="40" y="44" width="40" height="13" rx="6" fill="#263238"/><rect x="42" y="46" width="36" height="9" rx="4.5" fill="#fff8e1"/><circle cx="54" cy="50.5" r="3.4" fill="#ef6c00"/><circle cx="66" cy="50.5" r="3.4" fill="#7cb342"/>
      <rect x="104" y="46" width="30" height="20" rx="4" fill="#cfd8dc" stroke="#546e7a" stroke-width="1.2"/><rect x="108" y="50" width="22" height="9" rx="2" fill="#ef9a9a"/><circle cx="14" cy="60" r="5" fill="#fff"/><circle cx="14" cy="60" r="2.4" fill="#ef9a9a"/></g>`,
    depo: () => `<g><rect x="2" y="18" width="104" height="8" rx="2" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.2"/><rect x="2" y="50" width="104" height="8" rx="2" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.2"/><rect x="2" y="82" width="104" height="8" rx="2" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.2"/>
      <rect x="8" y="2" width="26" height="16" rx="2" fill="#c8a26a" stroke="#8a6330"/><rect x="38" y="6" width="22" height="12" rx="2" fill="#a67c52" stroke="#8a6330"/><ellipse cx="86" cy="12" rx="13" ry="7" fill="#e8dcc4" stroke="#8a7a55"/><path d="M76,10 q10,-6 20,0" stroke="#7a9b4a" stroke-width="1.5" fill="none"/>
      <rect x="10" y="34" width="22" height="16" rx="2" fill="#7cb342" stroke="#33691e"/><rect x="36" y="32" width="22" height="18" rx="2" fill="#ef5350" stroke="#b71c1c"/><rect x="62" y="36" width="34" height="14" rx="2" fill="#ff9800" stroke="#e65100"/>
      <rect x="10" y="66" width="30" height="16" rx="2" fill="#c8a26a" stroke="#8a6330"/><ellipse cx="62" cy="74" rx="12" ry="8" fill="#e8dcc4" stroke="#8a7a55"/><ellipse cx="88" cy="74" rx="12" ry="8" fill="#e8dcc4" stroke="#8a7a55"/></g>`,
    banos: () => `<g><rect x="0" y="6" width="82" height="94" fill="#cfe9f1" stroke="#8fb8c6" stroke-width="1.4"/><path d="M0,30 h82 M0,54 h82 M0,78 h82 M20,6 v94 M41,6 v94 M62,6 v94" stroke="#9fc8d6" stroke-width="0.7"/>
      <rect x="6" y="34" width="32" height="62" rx="3" fill="#a07b4c" stroke="#6b4a24" stroke-width="1.4"/><rect x="44" y="34" width="32" height="62" rx="3" fill="#a07b4c" stroke="#6b4a24" stroke-width="1.4"/>
      <rect x="14" y="40" width="16" height="16" rx="2" fill="#fff"/><circle cx="22" cy="46" r="3" fill="#1e88e5"/><rect x="52" y="40" width="16" height="16" rx="2" fill="#fff"/><circle cx="60" cy="46" r="3" fill="#e91e63"/></g>`
  };

  const CSS = `
  .jp-sceneBox { flex: 1; min-height: 0; min-width: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 2px 4px; }
  .jp-scene { position: relative; width: ${W}px; height: ${H}px; transform-origin: center center; border-radius: 16px; overflow: hidden; border: 4px solid #6b4a24; box-shadow: 0 6px 18px rgba(0,0,0,0.35); background: #e9d3a4; flex-shrink: 0; touch-action: manipulation; user-select: none; }
  .jp-scene * { box-sizing: border-box; }
  .jp-scene .abs { position: absolute; } .jp-scene svg { display: block; overflow: visible; }
  .jp-p { position: absolute; left: 0; top: 0; width: 28px; height: 56px; pointer-events: none; will-change: transform; }
  .jp-p .fl { transform-origin: 50% 90%; } .jp-p.flip .fl { transform: scaleX(-1); }
  .jp-p.walk .bd { animation: jpBob 0.34s ease-in-out infinite; }
  .jp-p.walk .lg.l { transform-box: fill-box; transform-origin: 50% 0; animation: jpLegA 0.34s ease-in-out infinite; } .jp-p.walk .lg.r { transform-box: fill-box; transform-origin: 50% 0; animation: jpLegB 0.34s ease-in-out infinite; }
  .jp-p.work .ar.l { transform-box: fill-box; transform-origin: 50% 0; animation: jpArmA var(--wk, 0.7s) ease-in-out infinite; } .jp-p.work .ar.r { transform-box: fill-box; transform-origin: 50% 0; animation: jpArmB var(--wk, 0.7s) ease-in-out infinite; }
  .jp-p.sit .bd { transform: translateY(9px); } .jp-p.sit .lg, .jp-p.sit ellipse[cy="43.3"] { display: none; } .jp-p.eat .ar.r { transform-box: fill-box; transform-origin: 50% 0; animation: jpArmB 0.6s ease-in-out infinite; }
  @keyframes jpBob { 50% { transform: translateY(-2px); } } @keyframes jpLegA { 50% { transform: rotate(22deg); } } @keyframes jpLegB { 50% { transform: rotate(-22deg); } }
  @keyframes jpArmA { 50% { transform: rotate(-35deg); } } @keyframes jpArmB { 50% { transform: rotate(35deg); } }
  .jp-lv { position: absolute; left: 50%; top: -3px; transform: translateX(-50%); width: 13px; height: 13px; border-radius: 50%; color: #fff; font: 900 9px/13px sans-serif; text-align: center; border: 1.5px solid #fff; font-style: normal; box-shadow: 0 1px 2px rgba(0,0,0,0.4); }
  .jp-tray { position: absolute; left: 50%; top: 18px; transform: translateX(-50%); font-size: 15px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4)); }
  .jp-bub { position: absolute; background: #fff; border: 2px solid #8a6330; border-radius: 12px; padding: 1px 6px; font-size: 15px; line-height: 20px; pointer-events: none; animation: jpPop 0.3s cubic-bezier(.2,1.5,.4,1); white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25); }
  .jp-bub::after { content: ''; position: absolute; left: 50%; bottom: -7px; margin-left: -4px; border: 4px solid transparent; border-top-color: #8a6330; }
  .jp-bub.red { background: #ffe0e0; border-color: #c62828; } .jp-bub.green { background: #e3f6d5; border-color: #558b2f; }
  @keyframes jpPop { from { transform: scale(0.2); opacity: 0; } }
  .jp-fx { position: absolute; pointer-events: none; font: 900 12px/1 'Fredoka', sans-serif; color: #fff8c4; text-shadow: 0 1px 0 #7a4b00, 0 0 4px #ffb300, 1px 1px 0 #7a4b00; animation: jpFloat 1.3s ease-out forwards; white-space: nowrap; z-index: 900; }
  @keyframes jpFloat { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 15% { opacity: 1; transform: translateY(-6px) scale(1.1); } 100% { transform: translateY(-34px) scale(1); opacity: 0; } }
  .jp-sign { position: absolute; transform: translateX(-50%); background: linear-gradient(#e9c585, #c9985a); border: 2px solid #6b4a24; border-radius: 7px; padding: 1px 8px 2px; font: 900 11px/1.15 'Fredoka', sans-serif; color: #3b2208; text-align: center; cursor: pointer; z-index: 800; box-shadow: 0 2px 0 #6b4a24, 0 3px 6px rgba(0,0,0,0.3); white-space: nowrap; }
  .jp-sign small { display: block; font-size: 9px; font-weight: 800; color: #5b3a12; } .jp-sign:active { transform: translateX(-50%) translateY(1px); }
  .jp-sign.off { background: linear-gradient(#cfcac0, #aaa59a); color: #4a4640; }
  .jp-up { position: absolute; left: 100%; top: -9px; margin-left: -8px; font-style: normal; font-size: 13px; color: #2e7d32; text-shadow: 0 0 3px #fff, 0 0 3px #fff; animation: jpBounce 0.8s ease-in-out infinite; }
  @keyframes jpBounce { 50% { transform: translateY(-4px); } }
  .jp-hot { position: absolute; cursor: pointer; z-index: 700; border-radius: 10px; } .jp-hot:active, .jp-hot:hover { background: rgba(255, 240, 160, 0.28); box-shadow: inset 0 0 0 2px rgba(255, 224, 110, 0.9); }
  .jp-prop { position: absolute; font-size: 16px; line-height: 1; z-index: 40; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4)); } .jp-prop.slot { opacity: 0.55; font-size: 13px; width: 20px; height: 20px; border: 1.5px dashed rgba(90, 58, 18, 0.7); border-radius: 50%; text-align: center; line-height: 17px; color: #5a3a12; cursor: pointer; font-weight: 900; }
  .jp-prop.have { animation: jpBob2 2.4s ease-in-out infinite; } @keyframes jpBob2 { 50% { transform: translateY(-2px); } }
  .jp-table { position: absolute; z-index: 1; cursor: pointer; } .jp-table.ghost { opacity: 0.45; } .jp-table .tx { position: absolute; left: 0; right: 0; text-align: center; font: 900 11px/1 sans-serif; color: #5a3a12; }
  .jp-cashpile { position: absolute; z-index: 850; cursor: pointer; background: linear-gradient(#ffe082, #ffb300); border: 2px solid #8a5a00; border-radius: 14px; padding: 2px 9px; font: 900 12px/1.2 'Fredoka', sans-serif; color: #3b2208; box-shadow: 0 2px 0 #8a5a00, 0 3px 7px rgba(0,0,0,0.35); animation: jpBounce 1.4s ease-in-out infinite; }
  .jp-cashpile.empty { filter: grayscale(0.8); animation: none; opacity: 0.8; }
  .jp-warn { position: absolute; left: 50%; top: 106px; transform: translateX(-50%); background: #fff2b3; border: 2px solid #c9a24a; border-radius: 10px; padding: 2px 10px; font: 900 11px sans-serif; color: #5a3a12; z-index: 950; white-space: nowrap; }
  .jp-scene .st circle { fill: rgba(255,255,255,0.8); animation: jpSteam 2.2s ease-out infinite; } .jp-scene .st circle:nth-child(2) { animation-delay: 0.7s; } .jp-scene .st circle:nth-child(3) { animation-delay: 1.4s; }
  @keyframes jpSteam { 0% { transform: translateY(8px) scale(0.5); opacity: 0.9; } 100% { transform: translateY(-16px) scale(1.5); opacity: 0; } }
  .jp-scene .fire path { animation: jpFire 0.28s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; } .jp-scene .fl2 { animation: jpFire 0.4s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
  @keyframes jpFire { to { transform: scaleY(1.35); } }
  .jp-scene .wk { animation: jpWok 0.9s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; } .jp-scene .wk2 { animation: jpWok 0.9s ease-in-out infinite 0.45s; transform-box: fill-box; transform-origin: 50% 100%; }
  @keyframes jpWok { 50% { transform: rotate(-8deg); } } .jp-scene .tos circle { animation: jpToss 0.9s ease-in-out infinite; } .jp-scene .tos circle:nth-child(2) { animation-delay: 0.15s; } .jp-scene .tos circle:nth-child(3) { animation-delay: 0.3s; }
  @keyframes jpToss { 50% { transform: translateY(-10px); } }
  .jp-scene .bub circle { fill: rgba(255,255,255,0.8); animation: jpBubble 1s ease-in infinite; } .jp-scene .bub.b2 circle { animation-delay: 0.4s; } .jp-scene .bub circle:nth-child(2) { animation-delay: 0.3s; }
  @keyframes jpBubble { 0% { transform: translateY(2px); opacity: 0.2; } 60% { opacity: 1; } 100% { transform: translateY(-5px); opacity: 0; } }
  .jp-lamp { position: absolute; transform-origin: 50% 0; animation: jpSway 3.2s ease-in-out infinite; z-index: 30; } @keyframes jpSway { 50% { transform: rotate(7deg); } } .jp-noren { transform-origin: 50% 0; animation: jpSway 4s ease-in-out infinite; }
  .jp-closed { position: absolute; z-index: 20; background: rgba(60, 58, 54, 0.55); border-radius: 6px; pointer-events: none; }
  .jp-sceneHud { position: absolute; z-index: 960; pointer-events: none; }
  `;
  function css() { if (document.getElementById('jp-scene-css')) return; const s = document.createElement('style'); s.id = 'jp-scene-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ---------- fondo ----------
  function bgSvg() {
    let planks = '';
    for (let y = 112; y < H; y += 17) planks += `<path d="M0,${y} H${W}" stroke="#b38a52" stroke-width="1" opacity="0.5"/>`;
    for (let r = 0; r < 12; r++) { const y = 112 + r * 17; for (let x = (r % 2) * 40; x < W; x += 80) planks += `<path d="M${x},${y} v17" stroke="#b38a52" stroke-width="0.8" opacity="0.4"/>`; }
    const beams = [0, 110, 262, 414, 566, 718, 798].map(x => `<rect x="${x - 3}" y="0" width="7" height="104" fill="#7a5226"/>`).join('');
    return `<svg class="abs" style="left:0;top:0" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs><linearGradient id="jpWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e7c4"/><stop offset="1" stop-color="#e8cf9c"/></linearGradient><linearGradient id="jpFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b078"/><stop offset="1" stop-color="#c79a62"/></linearGradient>
        <radialGradient id="jpVig" cx="0.5" cy="0.45" r="0.8"><stop offset="0.6" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(60,30,0,0.28)"/></radialGradient></defs>
      <rect width="${W}" height="106" fill="url(#jpWall)"/><rect y="104" width="${W}" height="${H - 104}" fill="url(#jpFloor)"/>${planks}
      <rect y="0" width="${W}" height="12" fill="#6b4a24"/><rect y="12" width="${W}" height="3" fill="#a77b43"/>${beams}
      <path d="M0,104 H${W}" stroke="#7a5226" stroke-width="4"/><rect y="108" width="${W}" height="10" fill="rgba(60,30,0,0.18)"/>
      <g opacity="0.9"><rect x="122" y="18" width="130" height="20" rx="2" fill="#fff7de" stroke="#8a6330" stroke-width="2"/><path d="M152,18 v20 M187,18 v20 M222,18 v20" stroke="#8a6330" stroke-width="1.5"/></g>
      <g opacity="0.9"><rect x="426" y="18" width="130" height="20" rx="2" fill="#fff7de" stroke="#8a6330" stroke-width="2"/><path d="M456,18 v20 M491,18 v20 M526,18 v20" stroke="#8a6330" stroke-width="1.5"/></g>
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#jpVig)"/></svg>`;
  }
  function lamp(x) { return `<div class="jp-lamp" style="left:${x - 11}px;top:12px"><svg width="22" height="38" viewBox="0 0 22 38"><path d="M11,0 v8" stroke="#333" stroke-width="1.4"/><ellipse cx="11" cy="22" rx="10" ry="13" fill="#d32f2f" stroke="#7f1d1d" stroke-width="1.4"/><path d="M3,17 q8,-3 16,0 M2,23 q9,-3 18,0 M3,29 q8,-3 16,0" stroke="#ff8a80" stroke-width="1" fill="none" opacity="0.7"/><rect x="6" y="8" width="10" height="3" fill="#333"/><rect x="6" y="33" width="10" height="3" fill="#333"/></svg></div>`; }
  function tableSvg(ghost, locked) {
    return `<svg width="84" height="44" viewBox="-42 -20 84 44"><ellipse cx="0" cy="12" rx="40" ry="9" fill="rgba(0,0,0,0.22)"/><ellipse cx="-31" cy="3" rx="11" ry="5.5" fill="${ghost ? 'none' : '#c0392b'}" stroke="${ghost ? '#7a5226' : '#8e2a20'}" stroke-width="1.4" ${ghost ? 'stroke-dasharray="3 2"' : ''}/><ellipse cx="31" cy="3" rx="11" ry="5.5" fill="${ghost ? 'none' : '#c0392b'}" stroke="${ghost ? '#7a5226' : '#8e2a20'}" stroke-width="1.4" ${ghost ? 'stroke-dasharray="3 2"' : ''}/>
      ${ghost ? `<ellipse cx="0" cy="-2" rx="25" ry="10" fill="rgba(255,255,255,0.12)" stroke="#7a5226" stroke-width="1.6" stroke-dasharray="4 3"/>` : `<rect x="-20" y="-1" width="40" height="11" rx="3" fill="#8a5a2b"/><ellipse cx="0" cy="-2" rx="26" ry="10.5" fill="#c68b4e" stroke="#7a4b1c" stroke-width="1.6"/><ellipse cx="0" cy="-3.5" rx="21" ry="7.5" fill="#d9a066"/><path d="M-12,-5 q12,-4 24,0" stroke="#e8b97a" stroke-width="1.2" fill="none"/>`}</svg>`;
  }

  // ---------- montaje ----------
  function create(getState) {
    css();
    const root = document.createElement('div'); root.className = 'jp-sceneBox';
    const stage = document.createElement('div'); stage.className = 'jp-scene';
    root.appendChild(stage);
    const bg = document.createElement('div'); bg.innerHTML = bgSvg(); stage.appendChild(bg.firstChild);
    const layers = {};
    ['floor', 'props', 'stat', 'cook', 'ents', 'front', 'ui', 'fx'].forEach(n => { const d = document.createElement('div'); d.className = 'abs'; d.style.cssText = 'left:0;top:0;width:100%;height:100%;pointer-events:none;'; d.dataset.l = n; stage.appendChild(d); layers[n] = d; });
    layers.stat.style.zIndex = 1; layers.cook.style.zIndex = 5; layers.front.style.zIndex = 10; layers.ui.style.zIndex = 800; layers.fx.style.zIndex = 900;
    sc = { root, stage, layers, getState, ents: [], parties: [], waiters: [], cooks: [], tables: [], last: performance.now(), spawn: 2, raf: 0, key: '', npc: [], nextChore: 4 };
    stage.addEventListener('pointerdown', () => {});
    resize(); window.addEventListener('resize', resize);
    sc.raf = setInterval(() => loop(performance.now()), 33);
    return root;
  }
  function resize() {
    if (!sc) return;
    const box = sc.root; const w = box.clientWidth || W, h = box.clientHeight || H;
    const k = Math.min((w - 8) / (W + 8), (h - 4) / (H + 8), 1.25);
    sc.stage.style.transform = `scale(${k})`; sc.stage.style.margin = `${-(H * (1 - k)) / 2}px ${-(W * (1 - k)) / 2}px`;
  }
  function destroy() { if (!sc) return; clearInterval(sc.raf); window.removeEventListener('resize', resize); if (sc.root.parentNode) sc.root.parentNode.removeChild(sc.root); sc = null; }

  function place(el, x, y) { el._x = x; el._y = y; el.style.transform = `translate(${(x - 14).toFixed(1)}px, ${(y - 54).toFixed(1)}px)`; el.style.zIndex = Math.round(y) + 20; }
  function setFlip(e, dx) { if (Math.abs(dx) > 0.4) e.el.classList.toggle('flip', dx < 0); }
  function addEnt(role, x, y, opt) {
    const el = mkPerson(role, opt); sc.layers.ents.appendChild(el); place(el, x, y);
    const e = { el, x, y, path: [], speed: 70, role, done: null, opt: opt || {} }; sc.ents.push(e); return e;
  }
  function removeEnt(e) { if (e.el.parentNode) e.el.parentNode.removeChild(e.el); sc.ents = sc.ents.filter(x => x !== e); }
  function goPath(e, pts, done) { e.path = pts.slice(); e.done = done || null; e.el.classList.add('walk'); }
  function bubble(x, y, html, cls) { const b = document.createElement('div'); b.className = 'jp-bub ' + (cls || ''); b.innerHTML = html; b.style.left = (x - 14) + 'px'; b.style.top = (y - 84) + 'px'; b.style.zIndex = 880; sc.layers.fx.appendChild(b); return b; }
  function pop(x, y, txt) { const f = document.createElement('div'); f.className = 'jp-fx'; f.textContent = txt; f.style.left = (x - 18) + 'px'; f.style.top = (y - 60) + 'px'; sc.layers.fx.appendChild(f); setTimeout(() => f.remove(), 1400); }

  // ---------- estructura según el estado ----------
  function sync() {
    if (!sc) return;
    const g = sc.getState(); if (!g) return;
    const { c, r, ev } = g;
    sc.g = g;
    ['floor', 'props', 'stat', 'cook', 'front', 'ui'].forEach(n => { sc.layers[n].innerHTML = ''; });
    sc.cooks.forEach(e => removeEnt(e)); sc.cooks = [];
    sc.waiters.forEach(e => removeEnt(e)); sc.waiters = [];
    sc.npc.forEach(e => removeEnt(e)); sc.npc = [];
    sc.parties.forEach(p => { p.waiter = null; if (p.state === 'bring') p.state = 'order'; });
    const L = sc.layers;
    // lámparas y letrero de entrada
    L.props.insertAdjacentHTML('beforeend', lamp(122) + lamp(412) + lamp(716));
    // estaciones
    const zoneList = ['depo', ...KIT, 'banos'];
    zoneList.forEach(z => {
      const [x0, x1] = ZR[z], cx = (x0 + x1) / 2, isK = KIT.includes(z);
      if (isK && !c.areas.includes(z)) { // no hay platos de esta cocina en esta ciudad
        L.stat.insertAdjacentHTML('beforeend', `<div class="abs" style="left:${x0}px;top:8px;width:${x1 - x0}px;height:94px;background:repeating-linear-gradient(45deg,#d8c8a4,#d8c8a4 8px,#cdbb93 8px,#cdbb93 16px);opacity:0.9;border-radius:4px"></div>`);
        L.ui.insertAdjacentHTML('beforeend', `<div class="jp-sign off" style="left:${cx}px;top:70px;pointer-events:none">${nameOf(z)}<small>sin platos aquí</small></div>`); return;
      }
      const open = !isK || r.areas[z];
      const art = (z === 'depo' || z === 'banos') ? STATION[z]() : STATION[z](open);
      const w = z === 'depo' ? 108 : (z === 'banos' ? 82 : 150), ox = z === 'banos' ? x0 + 4 : (z === 'depo' ? x0 : x0 + 1);
      const wrap = document.createElement('div'); wrap.className = 'abs'; wrap.style.cssText = `left:${ox}px;top:${z === 'depo' || z === 'banos' ? 0 : 4}px;width:${w}px;height:104px;`;
      wrap.innerHTML = `<svg width="${w}" height="104" viewBox="0 0 ${w} 100" style="${open ? '' : 'filter:grayscale(0.85) brightness(0.9)'}">${art}</svg>`;
      L.stat.appendChild(wrap);
      if (isK) L.front.insertAdjacentHTML('beforeend', '<svg class="abs" style="left:' + ox + 'px;top:4px" width="' + w + '" height="104" viewBox="0 0 ' + w + ' 100" style="' + (open ? '' : 'filter:grayscale(0.85) brightness(0.9)') + '">' + counter(open) + '</svg>');
      // personal
      const s = r.staff[z];
      if (open && s.n > 0) {
        const role = z === 'depo' ? 'depo' : (z === 'banos' ? 'clean' : 'cook');
        if (isK) for (let i = 0; i < s.n; i++) {
          const px = cx - (s.n - 1) * 15 + i * 30, e = mkPerson('cook', { lvl: s.l, band: LV[s.l - 1], cloth: ['#37474f', '#5d4037', '#455a64', '#4e342e', '#263238'][i % 5] });
          e.classList.add('work'); e.style.setProperty('--wk', (1.15 - 0.16 * s.l).toFixed(2) + 's'); e.style.animationDelay = (i * 0.2) + 's';
          L.cook.appendChild(e); place(e, px, 90); e.style.zIndex = 5; sc.cooks.push({ el: e, x: px, y: 90, role: 'cook', area: z, path: [] });
        } else if (z === 'depo') {
          for (let i = 0; i < s.n; i++) { const e = addEnt('depo', 40 + i * 28, 100, { lvl: s.l }); e.home = [40 + i * 28, 100]; e.chore = 'depo'; sc.npc.push(e); }
        } else if (z === 'banos') {
          for (let i = 0; i < s.n; i++) { const e = addEnt('clean', 770 - i * 24, 110, { lvl: s.l }); e.home = [770 - i * 24, 110]; e.chore = 'clean'; sc.npc.push(e); }
        }
      }
      // cartel
      const info = ZONE_NAME[z];
      const afford = g.canUp(z), staff = r.staff[z];
      let sub = !open ? `abrir S/ ${g.fmt(g.costArea(z))}` : (isK || z === 'depo' || z === 'banos' ? `${staff.n}/${g.staffMax(z)} · Nv ${staff.l}` : '');
      if (z === 'depo') sub = `${staff.n} · Nv ${staff.l} · ⭐${r.q}`;
      const signY = z === 'depo' || z === 'banos' ? 76 : 8;
      L.ui.insertAdjacentHTML('beforeend', `<div class="jp-sign ${open ? '' : 'off'}" style="left:${cx}px;top:${isK ? 1 : 2}px;pointer-events:auto" onclick="JP.zone('${z}')">${info}<small>${sub}</small>${afford ? '<i class="jp-up">⬆</i>' : ''}</div>`);
      L.ui.insertAdjacentHTML('beforeend', `<div class="jp-hot" style="left:${x0}px;top:0;width:${x1 - x0}px;height:104px;pointer-events:auto" onclick="JP.zone('${z}')"></div>`);
      // objetos
      propSlots(z, g, cx, x0);
    });
    // caja
    {
      const s = r.staff.caja;
      L.front.insertAdjacentHTML('beforeend', `<svg class="abs" style="left:6px;top:206px" width="124" height="88" viewBox="0 0 124 88"><rect x="2" y="30" width="118" height="54" rx="6" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="2"/><rect x="0" y="22" width="122" height="12" rx="5" fill="${TOP}" stroke="${WOOD_D}" stroke-width="2"/><path d="M20,36 v44 M44,36 v44 M68,36 v44 M92,36 v44" stroke="${WOOD_D}" stroke-width="0.7" opacity="0.5"/><rect x="42" y="2" width="40" height="22" rx="3" fill="#78909c" stroke="#37474f" stroke-width="1.5"/><rect x="46" y="5" width="32" height="12" rx="2" fill="#b3e5fc"/><text x="62" y="14" font-size="9" text-anchor="middle" fill="#01579b" font-weight="800">¥</text></svg>`);
      L.ui.insertAdjacentHTML('beforeend', `<div class="jp-sign" style="left:68px;top:258px;pointer-events:auto" onclick="JP.zone('caja')">Caja<small>${s.n} · Nv ${s.l}</small>${g.canUp('caja') ? '<i class="jp-up">⬆</i>' : ''}</div>`);
      L.ui.insertAdjacentHTML('beforeend', `<div class="jp-hot" style="left:6px;top:206px;width:124px;height:88px;pointer-events:auto" onclick="JP.zone('caja')"></div>`);
      propSlots('caja', g, 68, 6);
      if (s.n > 0) { const e = addEnt('cash', 62, 232, { lvl: s.l }); e.el.classList.add('work'); e.el.style.setProperty('--wk', '1.2s'); e.el.style.zIndex = 8; e.station = true; sc.npc.push(e); }
    }
    // entrada
    L.front.insertAdjacentHTML('beforeend', `<div class="abs jp-noren" style="left:772px;top:222px"><svg width="30" height="52" viewBox="0 0 30 52"><rect x="0" y="0" width="30" height="5" fill="#6b4a24"/><path d="M2,5 h8 v40 h-8 Z M11,5 h8 v44 h-8 Z M20,5 h8 v40 h-8 Z" fill="#2f4a8a" stroke="#1c2f5e" stroke-width="1"/><circle cx="15" cy="22" r="4" fill="none" stroke="#fff" stroke-width="1.4"/></svg></div>`);
    L.ui.insertAdjacentHTML('beforeend', `<div class="jp-sign" style="left:752px;top:266px;pointer-events:auto" onclick="JP.zone('local')">🏠 ${g.tierName}<small>ampliar</small>${g.canUp('local') ? '<i class="jp-up">⬆</i>' : ''}</div>`);
    // mesas
    const cap = g.tierTables;
    sc.tables = [];
    SLOTS.forEach((p, i) => {
      const have = i < r.tables, locked = i >= cap; if (!have && (locked || i >= r.tables + 2)) { sc.tables.push({ x: p[0], y: p[1], have: false, party: null, idx: i }); return; }
      const t = document.createElement('div'); t.className = 'jp-table' + (have ? '' : ' ghost'); t.style.cssText = `left:${p[0] - 42}px;top:${p[1] - 18}px;z-index:${p[1]};pointer-events:auto`;
      if (have || !locked) { t.innerHTML = tableSvg(!have, locked) + (!have ? `<span class="tx" style="top:6px">＋</span>` : ''); t.onclick = () => JP.zone('salon'); L.floor.appendChild(t); }
      if (have && g.hasObj('tatami@salon')) L.floor.insertAdjacentHTML('afterbegin', `<div class="abs" style="left:${p[0] - 52}px;top:${p[1] - 14}px;width:104px;height:44px;border-radius:6px;background:linear-gradient(#a5c46a,#8fb257);border:2px solid #5d7a32;opacity:0.92;transform:skewX(-14deg)"><div style="position:absolute;inset:3px;border:1px solid rgba(255,255,255,0.35);border-radius:3px"></div></div>`);
      sc.tables.push({ x: p[0], y: p[1], have, party: null, idx: i });
    });
    sc.tables.forEach(t => { const old = sc.parties.find(pp => pp.idx === t.idx); if (old) t.party = old; });
    // restos de grupos sobre mesas que ya no existen
    sc.parties.filter(p => p.idx >= r.tables).forEach(p => endParty(p, true));
    // props del salón y cartel
    L.ui.insertAdjacentHTML('beforeend', `<div class="jp-sign" style="left:430px;top:292px;pointer-events:auto;transform:translateX(-50%)" onclick="JP.zone('salon')">Salón<small>${r.tables} mesas · ${r.staff.salon.n}/${g.staffMax('salon')} mozos · Nv ${r.staff.salon.l}</small>${g.canUp('salon') ? '<i class="jp-up">⬆</i>' : ''}</div>`);
    propSlots('salon', g, 0, 0);
    // mozos
    for (let i = 0; i < r.staff.salon.n; i++) {
      const e = addEnt('waiter', 330 + i * 26, 120, { lvl: r.staff.salon.l });
      e.speed = 62 + 16 * r.staff.salon.l; e.home = [330 + i * 26, 124]; e.state = 'idle'; e.party = null; sc.waiters.push(e);
    }
    // montón de dinero en la caja
    cashPile();
    // aviso
    const warn = ev.net < 0 ? '⚠️ Pierde dinero' : (ev.wCap <= 0 ? '⚠️ Sin mozos: nadie atiende' : (!Object.values(r.areas).some(Boolean) ? '' : ''));
    if (warn) L.ui.insertAdjacentHTML('beforeend', `<div class="jp-warn">${warn}</div>`);
  }
  const ZONE_NAME = { depo: 'Depósito', ramen: 'Ramen', salteados: 'Salteados', frituras: 'Frituras', makis: 'Makis', banos: 'Baños' };
  const nameOf = z => ZONE_NAME[z];
  function cashPile() {
    if (!sc) return; const g = sc.getState(); const c = Math.floor(g.r.cash);
    let el = sc.layers.ui.querySelector('.jp-cashpile');
    if (!el) { el = document.createElement('div'); el.className = 'jp-cashpile'; el.style.cssText = 'left:26px;top:170px;pointer-events:auto'; el.onclick = () => JP.collect(); sc.layers.ui.appendChild(el); }
    el.textContent = '💴 S/ ' + g.fmt(c); el.classList.toggle('empty', c < 1);
  }
  const PROP_POS = {
    ramen: [[-52, 44], [52, 44], [0, 6]], salteados: [[-52, 44], [52, 44], [0, 6]], frituras: [[-52, 44], [52, 44], [0, 6]], makis: [[-52, 44], [52, 44], [0, 6]],
    depo: [[10, 84], [52, 54], [90, 54]], banos: [[-22, 70], [0, 70], [22, 70]],
    caja: [[-32, 34], [0, 34], [32, 34]], salon: [[132, 130], [770, 120], [18, 168]]
  };
  function propSlots(z, g, cx, x0) {
    const list = g.OBJ[z]; if (!list) return;
    const base = PROP_POS[z];
    list.forEach((o, i) => {
      const have = g.hasObj(o[0] + '@' + z); let [px, py] = base[i];
      const X = (z === 'salon' || z === 'depo') ? (z === 'depo' ? x0 + px : px) : cx + px;
      const el = document.createElement('div');
      el.className = 'jp-prop ' + (have ? 'have' : 'slot'); el.style.cssText = `left:${X - 8}px;top:${py}px;pointer-events:auto;cursor:pointer;z-index:${z === 'salon' ? 700 : 820}`;
      el.title = o[2] + (have ? ' (comprado)' : '');
      el.textContent = have ? o[1] : '＋'; el.onclick = () => JP.zone(z);
      if (z === 'salon' && i === 1 && !have) el.style.display = 'none';
      sc.layers.props.appendChild(el);
      if (have && o[0] === 'tv') { /* televisor encendido */ el.style.fontSize = '22px'; }
    });
  }

  // ---------- simulación visual ----------
  function freeTable() { const t = sc.tables.filter(t => t.have && !t.party); return t.length ? pick(t) : null; }
  function activeAreas() { const g = sc.g; return KIT.filter(a => g.c.areas.includes(a) && g.r.areas[a] && g.r.staff[a].n > 0); }
  function spawnParty() {
    const g = sc.g; const areas = activeAreas(); if (!areas.length) return;
    const t = freeTable(); if (!t) return;
    const n = Math.random() < 0.55 ? 2 : 1, area = pick(areas);
    const dishes = g.c.dishes.filter(d => d[1] === area), dish = pick(dishes);
    const party = { idx: t.idx, x: t.x, y: t.y, area, dish, n, state: 'walkin', ents: [], timer: 0, waiter: null, bub: null, arrived: 0, patience: 0 };
    t.party = party;
    const seats = n === 2 ? [[t.x - 30, t.y + 6], [t.x + 30, t.y + 6]] : [[t.x + (Math.random() < 0.5 ? -30 : 30), t.y + 6]];
    for (let i = 0; i < n; i++) {
      const e = addEnt('cust', ENTRY[0], ENTRY[1] + rnd(-6, 6), {}); e.speed = 52 + rnd(0, 16); e.party = party; party.ents.push(e);
      goPath(e, [[t.x + (i ? 36 : -36), t.y + 34], seats[i]], () => { e.el.classList.remove('walk'); e.el.classList.add('sit'); e.sat = true; place(e.el, seats[i][0], seats[i][1] + 2); e.el.style.zIndex = Math.round(t.y) + 8; e.y = seats[i][1] + 2; party.arrived++; if (party.arrived >= party.ents.length) { party.state = 'order'; party.bub = bubble(t.x, t.y - 4, ICON[area] + ' ' + (i ? '' : ''), ''); party.patience = 0; } });
    }
    sc.parties.push(party);
  }
  function endParty(p, force) {
    if (p.bub) { p.bub.remove(); p.bub = null; }
    p.ents.forEach(e => removeEnt(e));
    const t = sc.tables.find(t => t.idx === p.idx); if (t && t.party === p) t.party = null;
    sc.parties = sc.parties.filter(x => x !== p);
    sc.waiters.forEach(w => { if (w.party === p) { w.party = null; w.state = 'idle'; w.tray && w.tray.remove(); w.tray = null; } });
  }
  function leaveParty(p, angry) {
    p.state = 'leave';
    if (p.bub) { p.bub.remove(); p.bub = null; }
    p.ents.forEach((e, i) => { e.el.classList.remove('sit', 'eat'); e.sat = false; place(e.el, e._x, p.y + 12); goPath(e, [[p.x + (i ? 36 : -36), p.y + 36], [ENTRY[0] - 10, ENTRY[1]], [ENTRY[0] + 18, ENTRY[1]]], () => { e.gone = true; }); e.speed = 70; });
    const t = sc.tables.find(t => t.idx === p.idx); if (t && t.party === p) t.party = null;
    p.endAt = performance.now() + 14000;
  }
  function payParty(p) {
    p.state = 'pay';
    if (p.bub) { p.bub.remove(); p.bub = null; }
    p.ents.forEach((e, i) => { e.el.classList.remove('sit', 'eat'); e.sat = false; place(e.el, e._x, p.y + 12); goPath(e, [[p.x + (i ? 36 : -36), p.y + 36], [CASH_STAND[0] + 40, CASH_STAND[1] + 6], [CASH_STAND[0] + i * 22, CASH_STAND[1]]], () => {
      e.el.classList.remove('walk'); e.paid = true;
      if (p.ents.every(x => x.paid) && p.state === 'pay') {
        const g = sc.g, per = g.ev.per.find(q => q.a === p.area), val = per ? per.price * g.pm : 5;
        pop(CASH_STAND[0], CASH_STAND[1] - 4, '+S/ ' + (val * p.ents.length).toFixed(1));
        try { playSound('stock_add'); } catch (err) {}
        const cs = sc.npc.find(n => n.station); if (cs) { cs.el.classList.add('work'); }
        const hap = bubble(CASH_STAND[0] + 12, CASH_STAND[1] - 6, '😊', 'green'); setTimeout(() => hap.remove(), 900);
        cashPile();
        leaveParty(p, false);
      }
    }); });
  }
  function assign(w) {
    const p = sc.parties.find(q => q.state === 'order' && !q.waiter); if (!p) return false;
    p.waiter = w; w.party = p; w.state = 'toKitchen';
    const [x0, x1] = ZR[p.area], px = (x0 + x1) / 2 + rnd(-30, 30);
    goPath(w, [[px, PASS_Y + 6]], () => { w.state = 'cooking'; w.wait = Math.max(0.5, Math.min(5, 60 / Math.max(0.05, cookCap(p.area) * TL))); w.el.classList.remove('walk'); const ck = sc.cooks.find(c => c.area === p.area); if (ck) ck.el.classList.add('work'); });
    return true;
  }
  function cookCap(a) { const q = sc.g.ev.per.find(x => x.a === a); return q ? Math.max(0.08, q.cap) : 0.3; }
  function deliver(w) {
    const p = w.party; if (!p) return;
    w.state = 'toTable';
    const tray = document.createElement('div'); tray.className = 'jp-tray'; tray.textContent = ICON[p.area]; w.el.appendChild(tray); w.tray = tray;
    goPath(w, [[p.x, p.y + 40]], () => {
      w.el.classList.remove('walk'); w.tray && w.tray.remove(); w.tray = null;
      const per = sc.g.ev.per.find(q => q.a === p.area), err = per ? Math.min(0.6, per.err + sc.g.ev.wErr) : 0.2;
      if (p.bub) { p.bub.remove(); p.bub = null; }
      if (Math.random() < err) { p.state = 'bad'; p.timer = 1.6; p.bub = bubble(p.x, p.y - 4, '😖', 'red'); pop(p.x, p.y - 10, '✗ error'); try { playSound('error'); } catch (e2) {} }
      else { p.state = 'eat'; p.timer = rnd(2.4, 3.6); p.ents.forEach(e => e.el.classList.add('eat')); p.bub = bubble(p.x, p.y - 4, '😋', 'green'); }
      w.state = 'return'; w.party = null; goPath(w, [w.home], () => { w.state = 'idle'; w.el.classList.remove('walk'); });
    });
  }

  function loop(now) {
    if (!sc) return;
    let dt = Math.min(0.1, (now - sc.last) / 1000); sc.last = now;
    if (!sc.g) return;
    // movimiento
    for (const e of sc.ents) {
      if (e.path && e.path.length) {
        const [tx, ty] = e.path[0], dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), st = e.speed * dt;
        if (d <= st) { e.x = tx; e.y = ty; e.path.shift(); if (!e.path.length) { const f = e.done; e.done = null; place(e.el, e.x, e.y); if (f) f(); continue; } }
        else { e.x += dx / d * st; e.y += dy / d * st; setFlip(e, dx); }
        place(e.el, e.x, e.y);
      }
    }
    sc.ents.filter(e => e.gone).forEach(removeEnt);
    // grupos
    for (const p of sc.parties.slice()) {
      if (p.state === 'order') { p.patience += dt; if (!sc.waiters.length && p.patience > 14 || p.patience > 40) { if (p.bub) p.bub.remove(); p.bub = bubble(p.x, p.y - 4, '😠', 'red'); p.state = 'bad'; p.timer = 1.2; p.noPay = true; } }
      if (p.state === 'eat' || p.state === 'bad') { p.timer -= dt; if (p.timer <= 0) { if (p.state === 'eat') payParty(p); else leaveParty(p, true); } }
      if (p.state === 'leave' && performance.now() > p.endAt) endParty(p);
      if (p.state === 'leave' && p.ents.every(e => e.gone || !e.el.parentNode)) endParty(p);
    }
    // mozos
    for (const w of sc.waiters) {
      if (w.state === 'idle') { if (!assign(w)) { w.idleT = (w.idleT || 0) + dt; } }
      else if (w.state === 'cooking') { w.wait -= dt; if (w.wait <= 0) { const ck = sc.cooks.find(c => c.area === (w.party && w.party.area)); deliver(w); } }
    }
    // mozo sin trabajo: pasea un poco
    // faenas del resto del personal
    sc.nextChore -= dt;
    if (sc.nextChore <= 0) {
      sc.nextChore = rnd(7, 13);
      const npc = pick(sc.npc.filter(n => n.chore && (!n.path || !n.path.length)));
      if (npc && npc.chore === 'depo') { const a = activeAreas(); const t = a.length ? pick(a) : null; if (t) { const cx = (ZR[t][0] + ZR[t][1]) / 2; const box = document.createElement('div'); box.className = 'jp-tray'; box.textContent = '📦'; npc.el.appendChild(box); goPath(npc, [[cx - 30, PASS_Y + 2]], () => { box.remove(); goPath(npc, [npc.home], () => npc.el.classList.remove('walk')); }); } }
      else if (npc && npc.chore === 'clean' && sc.tables.some(t => t.have)) { const t = pick(sc.tables.filter(t => t.have)); goPath(npc, [[t.x + 40, t.y + 34], [t.x - 40, t.y + 34], npc.home], () => npc.el.classList.remove('walk')); }
    }
    // llegada de clientes
    sc.spawn -= dt;
    if (sc.spawn <= 0) {
      const g = sc.g, dishesMin = g.ev.served;
      const partiesMin = Math.max(0, dishesMin * TL / 1.5);
      sc.spawn = partiesMin <= 0.01 ? 4 : Math.max(2.5, Math.min(40, 60 / partiesMin)) * rnd(0.7, 1.3);
      if (partiesMin > 0.01 && sc.parties.length < Math.max(1, g.r.tables)) spawnParty();
    }
  }

  // ---------- API ----------
  window.JPScene = {
    mount(host, getState) {
      if (sc && sc.key !== getState().c.id) destroy();
      if (!sc) { create(getState); sc.key = getState().c.id; }
      sc.getState = getState;
      host.appendChild(sc.root); resize(); sync();
    },
    detach() { if (sc && sc.root.parentNode) sc.root.parentNode.removeChild(sc.root); },
    update() { if (sc) { cashPile(); } },
    destroy
  };
  const ZONE_NAME_ = ZONE_NAME; // eslint
})();
