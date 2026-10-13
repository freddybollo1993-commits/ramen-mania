/* Escena isométrica del restaurante (Recorrido por Japón).
   Vista amplia del local completo (cocina al fondo, baños y caja en la pared izquierda, salón al frente) con zoom (pellizcar, rueda, botones),
   arrastre para moverse y toque sobre un área para acercarse a ella. Todo el personal trabaja sin parar y los clientes entran, piden, comen, pagan y se van.
   Es cosmético (tiempo acelerado ×TL): la ganancia real la calcula japon.js. Los sprites son vectoriales y pueden sustituirse por arte final. */
(function () {
  'use strict';
  const TW = 44, TH = 22, GW = 20, GD = 12, OX = GD * TW / 2, OY = 86, WW = (GW + GD) * TW / 2, WH = OY + (GW + GD) * TH / 2 + 14, WALL = 66, TL = 10;
  const sx = (x, y) => OX + (x - y) * TW / 2, sy = (x, y, z = 0) => OY + (x + y) * TH / 2 - z;
  const P = (x, y, z = 0) => sx(x, y).toFixed(1) + ',' + sy(x, y, z).toFixed(1);
  const KIT = ['ramen', 'salteados', 'frituras', 'makis'];
  const ICON = { ramen: '🍜', salteados: '🥘', frituras: '🍤', makis: '🍣' };
  const ZX = { depo: [2.6, 5.8], ramen: [5.8, 9.4], salteados: [9.4, 13.0], frituras: [13.0, 16.6], makis: [16.6, 20] };      // tramos de la pared derecha
  const CY0 = 1.05, CY1 = 1.85, COOK_Y = 0.55, PASS_Y = 2.45;                                                                   // mostrador (y) · cocineros detrás · mozos delante
  const SLOTS = (() => { const a = []; [4.6, 6.6, 8.6, 10.6].forEach((y, r) => { for (let c = 0; c < 5; c++) a.push([6.2 + c * 3.1 + (r % 2 ? 1.5 : 0), y + (c % 2 ? 0.25 : -0.1)]); }); return a.filter(p => p[0] < 19.6).sort((p, q) => Math.hypot(p[0] - 12, (p[1] - 7.6) * 1.4) - Math.hypot(q[0] - 12, (q[1] - 7.6) * 1.4)).slice(0, 18); })();
  const DOOR = [-0.8, 4.9], CASH_STAND = [3.0, 9.3];
  const SKINS = ['#f6d3b3', '#efc29b', '#e0a878', '#c98a5c', '#a86b43'], HAIRS = ['#2b2118', '#3b2a1c', '#5a3a1f', '#1d1a1a', '#6b4a2a', '#8a8a8a', '#7b3f9e', '#c0392b'];
  const CLOTH = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4db6ac', '#f06292', '#90a4ae'];
  const LV = ['#9e9e9e', '#66bb6a', '#42a5f5', '#ab47bc', '#ffb300'];
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  let sc = null;
  const cam = { s: 1, tx: 0, ty: 0, fit: 1, focus: null };

  // ---------- sprites de personas ----------
  function personSvg(o) {
    const sk = o.skin, hr = o.hair, cl = o.cloth, role = o.role;
    const hat = role === 'cook' ? `<ellipse cx="14" cy="-4" rx="8.5" ry="5.5" fill="#fff"/><rect x="7" y="-3" width="14" height="8" rx="2" fill="#fff"/><rect x="7" y="3" width="14" height="2" fill="${o.band || '#ddd'}"/>`
      : role === 'waiter' ? `<path d="M5.5,6 Q14,-4 22.5,6 L22.5,8 L5.5,8 Z" fill="#3949ab"/><path d="M6,7 h16" stroke="#fff" stroke-width="1.2"/>`
      : role === 'cash' ? `<path d="M6,6 Q14,-1 22,6 L25,8 L3,8 Z" fill="#c62828"/>`
      : role === 'clean' ? `<path d="M5.5,7 Q14,-3 22.5,7 Z" fill="#43a047"/><rect x="5" y="6" width="18" height="2" fill="#2e7d32"/>`
      : role === 'depo' ? `<path d="M5.5,7 Q14,-2 22.5,7 L25,8 L3,8 Z" fill="#8d6e63"/>` : '';
    const apron = role === 'cook' ? '<rect x="9" y="20" width="10" height="13" rx="2" fill="#fff" stroke="#d8d0c0" stroke-width="0.6"/>' : (role === 'waiter' ? '<rect x="9" y="22" width="10" height="11" rx="2" fill="#283593"/>' : (role === 'depo' ? '<rect x="9" y="21" width="10" height="12" rx="2" fill="#6d4c41"/>' : ''));
    const legs = `<rect class="lg l" x="9" y="31" width="4.5" height="12" rx="1.6" fill="#37474f"/><rect class="lg r" x="14.5" y="31" width="4.5" height="12" rx="1.6" fill="#37474f"/><ellipse cx="11.5" cy="43.3" rx="3.4" ry="1.5" fill="#222"/><ellipse cx="16.8" cy="43.3" rx="3.4" ry="1.5" fill="#222"/>`;
    const hair = role === 'cust' ? `<path d="M5.5,11 Q5.5,2 14,2.5 Q22.5,2 22.5,11 L22.5,15 Q14,9 5.5,15 Z" fill="${hr}"/>` : `<path d="M6,12 Q6,5 14,5 Q22,5 22,12 Q14,7 6,12 Z" fill="${hr}"/>`;
    return `<svg viewBox="0 -10 28 56" width="28" height="56" aria-hidden="true"><ellipse cx="14" cy="44" rx="9" ry="2.6" fill="rgba(0,0,0,0.28)"/>
      <g class="bd">${legs}<rect x="7" y="17" width="14" height="16" rx="5" fill="${cl}"/>${apron}
      <ellipse class="ar l" cx="6.2" cy="25" rx="2.6" ry="6" fill="${cl}"/><ellipse class="ar r" cx="21.8" cy="25" rx="2.6" ry="6" fill="${cl}"/>
      <circle cx="14" cy="11" r="8" fill="${sk}"/>${hair}<circle cx="11" cy="12" r="1.05" fill="#2b2118"/><circle cx="17" cy="12" r="1.05" fill="#2b2118"/><path d="M11.4,15.4 Q14,17.6 16.6,15.4" fill="none" stroke="#a0524a" stroke-width="0.9" stroke-linecap="round"/><circle cx="9" cy="14.4" r="1.4" fill="#f4a5a0" opacity="0.55"/><circle cx="19" cy="14.4" r="1.4" fill="#f4a5a0" opacity="0.55"/>${hat}</g></svg>`;
  }
  function mkPerson(role, opt) {
    opt = opt || {};
    const el = document.createElement('div'); el.className = 'jp-p';
    const base = { cook: '#37474f', waiter: '#5c6bc0', cash: '#ef5350', clean: '#66bb6a', depo: '#a1887f' };
    const o = { role, skin: opt.skin || pick(SKINS), hair: opt.hair || pick(HAIRS), cloth: opt.cloth || base[role] || pick(CLOTH), band: opt.band };
    el.innerHTML = `<div class="fl">${personSvg(o)}</div>`;
    if (opt.lvl) { const b = document.createElement('i'); b.className = 'jp-lv'; b.style.background = LV[opt.lvl - 1]; b.textContent = opt.lvl; el.appendChild(b); }
    return el;
  }

  // ---------- cajas isométricas ----------
  function boxHtml(x0, y0, x1, y1, z0, z1, c, z) {
    const minx = sx(x0, y1) - 1, maxx = sx(x1, y0) + 1, miny = sy(x0, y0, z1) - 1, maxy = sy(x1, y1, z0) + 1;
    const top = `${P(x0, y0, z1)} ${P(x1, y0, z1)} ${P(x1, y1, z1)} ${P(x0, y1, z1)}`, fl = `${P(x0, y1, z0)} ${P(x1, y1, z0)} ${P(x1, y1, z1)} ${P(x0, y1, z1)}`, fr = `${P(x1, y0, z0)} ${P(x1, y1, z0)} ${P(x1, y1, z1)} ${P(x1, y0, z1)}`;
    const st = c.st || 'rgba(60,35,10,0.55)';
    return `<svg class="abs" style="left:${minx.toFixed(1)}px;top:${miny.toFixed(1)}px;z-index:${z}" width="${(maxx - minx).toFixed(1)}" height="${(maxy - miny).toFixed(1)}" viewBox="${minx.toFixed(1)} ${miny.toFixed(1)} ${(maxx - minx).toFixed(1)} ${(maxy - miny).toFixed(1)}"><polygon points="${fl}" fill="${c.l}" stroke="${st}" stroke-width="0.8"/><polygon points="${fr}" fill="${c.r}" stroke="${st}" stroke-width="0.8"/><polygon points="${top}" fill="${c.t}" stroke="${st}" stroke-width="0.8"/></svg>`;
  }
  const WOODC = { t: '#e6c386', l: '#c0904f', r: '#a07538' }, GREYC = { t: '#cfc9bb', l: '#aaa59a', r: '#8b877d' }, TABLEC = { t: '#d9a066', l: '#b27a42', r: '#8e5f30' };
  function bill(x, y, z, w, h, html, zi) { return `<div class="abs" style="left:${(sx(x, y) - w / 2).toFixed(1)}px;top:${(sy(x, y, z) - h).toFixed(1)}px;width:${w}px;height:${h}px;z-index:${zi}">${html}</div>`; }

  // equipo sobre cada mostrador
  const EQUIP = {
    ramen: `<svg viewBox="0 0 70 60" width="70" height="60"><ellipse cx="35" cy="54" rx="22" ry="6" fill="rgba(0,0,0,0.2)"/><path d="M14,22 v26 q0,8 21,8 q21,0 21,-8 v-26 Z" fill="#b0bec5" stroke="#546e7a" stroke-width="1.6"/><ellipse cx="35" cy="22" rx="21" ry="8" fill="#cfd8dc" stroke="#546e7a" stroke-width="1.6"/><ellipse cx="35" cy="22" rx="17" ry="6" fill="#d9a24a"/><path d="M22,22 q5,-4 10,0 t10,0" fill="none" stroke="#fff" stroke-width="1" opacity="0.6"/><path d="M12,28 q-6,4 0,8 M58,28 q6,4 0,8" fill="none" stroke="#546e7a" stroke-width="2.4"/><g class="st"><circle cx="26" cy="14" r="4"/><circle cx="36" cy="8" r="5"/><circle cx="46" cy="14" r="4"/></g><path d="M22,50 q4,-8 8,0 q4,-8 8,0 q4,-8 8,0" fill="#ff7043" class="fl2"/></svg>`,
    salteados: `<svg viewBox="0 0 80 60" width="80" height="60"><ellipse cx="40" cy="54" rx="30" ry="6" fill="rgba(0,0,0,0.2)"/><path d="M6,40 l34,-14 l34,14 v10 l-34,12 l-34,-12 Z" fill="#546e7a" stroke="#263238" stroke-width="1.4"/><path d="M6,40 l34,-14 l34,14 l-34,14 Z" fill="#78909c" stroke="#263238" stroke-width="1.2"/><g class="wk"><ellipse cx="26" cy="38" rx="13" ry="6" fill="#37474f" stroke="#102027" stroke-width="1.4"/><path d="M13,38 l-9,-4" stroke="#102027" stroke-width="3" stroke-linecap="round"/></g><g class="wk2"><ellipse cx="54" cy="38" rx="13" ry="6" fill="#37474f" stroke="#102027" stroke-width="1.4"/><path d="M67,38 l9,-4" stroke="#102027" stroke-width="3" stroke-linecap="round"/></g><g class="fire"><path d="M20,46 q3,-9 6,0 q3,-9 6,0 M48,46 q3,-9 6,0 q3,-9 6,0" fill="#ff9800"/></g><g class="tos"><circle cx="26" cy="26" r="2.6" fill="#8bc34a"/><circle cx="31" cy="22" r="2.4" fill="#ff7043"/><circle cx="22" cy="23" r="2" fill="#ffd54f"/></g></svg>`,
    frituras: `<svg viewBox="0 0 80 60" width="80" height="60"><ellipse cx="40" cy="54" rx="30" ry="6" fill="rgba(0,0,0,0.2)"/><path d="M6,36 l34,-14 l34,14 v12 l-34,12 l-34,-12 Z" fill="#90a4ae" stroke="#546e7a" stroke-width="1.5"/><path d="M6,36 l34,-14 l34,14 l-34,14 Z" fill="#cfd8dc" stroke="#546e7a" stroke-width="1.3"/><ellipse cx="26" cy="36" rx="13" ry="6" fill="#f2b84b" stroke="#8a6330" stroke-width="1.2"/><ellipse cx="54" cy="36" rx="13" ry="6" fill="#f2b84b" stroke="#8a6330" stroke-width="1.2"/><g class="bub"><circle cx="22" cy="35" r="2.2"/><circle cx="28" cy="33" r="1.8"/><circle cx="31" cy="37" r="2"/></g><g class="bub b2"><circle cx="50" cy="35" r="2.2"/><circle cx="56" cy="33" r="1.8"/><circle cx="59" cy="37" r="2"/></g><path d="M20,26 l-8,-14 M62,26 l8,-14" stroke="#455a64" stroke-width="2" stroke-linecap="round"/></svg>`,
    makis: `<svg viewBox="0 0 80 50" width="80" height="50"><ellipse cx="40" cy="44" rx="30" ry="5" fill="rgba(0,0,0,0.2)"/><path d="M8,32 l32,-13 l32,13 l-32,13 Z" fill="#e6c48a" stroke="#8a6330" stroke-width="1.3"/><path d="M16,30 l32,-13 M24,34 l32,-13 M32,38 l32,-13" stroke="#8a6330" stroke-width="0.8"/><ellipse cx="34" cy="28" rx="9" ry="4.4" fill="#263238"/><ellipse cx="34" cy="27" rx="7.4" ry="3.4" fill="#fff8e1"/><circle cx="32" cy="27" r="1.8" fill="#ef6c00"/><circle cx="36" cy="27" r="1.8" fill="#7cb342"/><ellipse cx="54" cy="24" rx="9" ry="4.4" fill="#263238"/><ellipse cx="54" cy="23" rx="7.4" ry="3.4" fill="#fff8e1"/><circle cx="52" cy="23" r="1.8" fill="#ef9a9a"/><circle cx="56" cy="23" r="1.8" fill="#7cb342"/></svg>`
  };

  const CSS = `
  .jp-view { position: relative; flex: 1; min-width: 0; min-height: 0; overflow: hidden; touch-action: none; user-select: none; background: radial-gradient(circle at 50% 40%, #cfe9c4 0%, #a9d49b 70%, #8fc283 100%); cursor: grab; }
  .jp-view.moving { cursor: grabbing; }
  .jp-world { position: absolute; left: 0; top: 0; width: ${WW}px; height: ${WH}px; transform-origin: 0 0; will-change: transform; }
  .jp-world.anim { transition: transform 0.55s cubic-bezier(.3,.8,.3,1); }
  .jp-world .abs { position: absolute; pointer-events: none; } .jp-world svg { display: block; overflow: visible; }
  .jp-p { position: absolute; left: 0; top: 0; width: 28px; height: 56px; pointer-events: none; will-change: transform; }
  .jp-p .fl { transform-origin: 50% 92%; transform: scale(1.32); } .jp-p.flip .fl { transform: scale(-1.32, 1.32); }
  .jp-p.walk .bd { animation: jpBob 0.34s ease-in-out infinite; }
  .jp-p.walk .lg.l { transform-box: fill-box; transform-origin: 50% 0; animation: jpLegA 0.34s ease-in-out infinite; } .jp-p.walk .lg.r { transform-box: fill-box; transform-origin: 50% 0; animation: jpLegB 0.34s ease-in-out infinite; }
  .jp-p.work .ar.l { transform-box: fill-box; transform-origin: 50% 0; animation: jpArmA var(--wk, 0.7s) ease-in-out infinite; } .jp-p.work .ar.r { transform-box: fill-box; transform-origin: 50% 0; animation: jpArmB var(--wk, 0.7s) ease-in-out infinite; }
  .jp-p.work .bd { animation: jpSway var(--wk, 0.7s) ease-in-out infinite; }
  .jp-p.sit .bd { transform: translateY(9px); } .jp-p.sit .lg, .jp-p.sit ellipse[cy="43.3"] { display: none; }
  .jp-p.eat .ar.r { transform-box: fill-box; transform-origin: 50% 0; animation: jpArmB 0.6s ease-in-out infinite; } .jp-p.chat .bd { animation: jpSway 1.4s ease-in-out infinite; }
  @keyframes jpBob { 50% { transform: translateY(-2px); } } @keyframes jpSway { 50% { transform: translateY(-1.5px) rotate(1.5deg); } }
  @keyframes jpLegA { 50% { transform: rotate(22deg); } } @keyframes jpLegB { 50% { transform: rotate(-22deg); } }
  @keyframes jpArmA { 50% { transform: rotate(-38deg); } } @keyframes jpArmB { 50% { transform: rotate(38deg); } }
  .jp-lv { position: absolute; left: 50%; top: -4px; transform: translateX(-50%); width: 13px; height: 13px; border-radius: 50%; color: #fff; font: 900 9px/13px sans-serif; text-align: center; border: 1.5px solid #fff; font-style: normal; box-shadow: 0 1px 2px rgba(0,0,0,0.4); }
  .jp-tray { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); font-size: 16px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4)); }
  .jp-bub { position: absolute; background: #fff; border: 2px solid #8a6330; border-radius: 12px; padding: 1px 6px; font-size: 15px; line-height: 20px; pointer-events: none; animation: jpPop 0.3s cubic-bezier(.2,1.5,.4,1); white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25); transform: translateX(-50%); }
  .jp-bub::after { content: ''; position: absolute; left: 50%; bottom: -7px; margin-left: -4px; border: 4px solid transparent; border-top-color: #8a6330; }
  .jp-bub.red { background: #ffe0e0; border-color: #c62828; } .jp-bub.green { background: #e3f6d5; border-color: #558b2f; }
  @keyframes jpPop { from { transform: translateX(-50%) scale(0.2); opacity: 0; } }
  .jp-fx { position: absolute; pointer-events: none; font: 900 12px/1 'Fredoka', sans-serif; color: #fff8c4; text-shadow: 0 1px 0 #7a4b00, 0 0 4px #ffb300, 1px 1px 0 #7a4b00; animation: jpFloat 1.4s ease-out forwards; white-space: nowrap; z-index: 9000; }
  @keyframes jpFloat { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 15% { opacity: 1; transform: translateY(-6px) scale(1.1); } 100% { transform: translateY(-34px) scale(1); opacity: 0; } }
  .jp-sign { position: absolute; transform: translate(-50%, -100%); background: linear-gradient(#e9c585, #c9985a); border: 2px solid #6b4a24; border-radius: 7px; padding: 1px 8px 2px; font: 900 11px/1.15 'Fredoka', sans-serif; color: #3b2208; text-align: center; z-index: 8000; box-shadow: 0 2px 0 #6b4a24, 0 3px 6px rgba(0,0,0,0.3); white-space: nowrap; pointer-events: none; }
  .jp-sign small { display: block; font-size: 9px; font-weight: 800; color: #5b3a12; } .jp-sign.off { background: linear-gradient(#cfcac0, #aaa59a); color: #4a4640; } .jp-sign.focus { outline: 3px solid #ffe066; }
  .jp-up { position: absolute; left: 100%; top: -9px; margin-left: -8px; font-style: normal; font-size: 13px; color: #2e7d32; text-shadow: 0 0 3px #fff, 0 0 3px #fff; animation: jpBounce 0.8s ease-in-out infinite; }
  @keyframes jpBounce { 50% { transform: translateY(-4px); } }
  .jp-prop { position: absolute; font-size: 17px; line-height: 1; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4)); transform: translate(-50%, -100%); pointer-events: none; } .jp-prop.slot { opacity: 0.65; font-size: 12px; width: 18px; height: 18px; border: 1.5px dashed rgba(90, 58, 18, 0.8); border-radius: 50%; text-align: center; line-height: 15px; color: #5a3a12; font-weight: 900; background: rgba(255,255,255,0.35); }
  .jp-prop.have { animation: jpBob2 2.4s ease-in-out infinite; } @keyframes jpBob2 { 50% { transform: translate(-50%, calc(-100% - 2px)); } }
  .jp-cashpile { position: absolute; transform: translate(-50%, -100%); z-index: 8500; background: linear-gradient(#ffe082, #ffb300); border: 2px solid #8a5a00; border-radius: 14px; padding: 2px 9px; font: 900 12px/1.2 'Fredoka', sans-serif; color: #3b2208; box-shadow: 0 2px 0 #8a5a00, 0 3px 7px rgba(0,0,0,0.35); animation: jpBounce 1.4s ease-in-out infinite; pointer-events: none; }
  .jp-cashpile.empty { filter: grayscale(0.8); animation: none; opacity: 0.8; }
  .jp-warn { position: absolute; transform: translateX(-50%); background: #fff2b3; border: 2px solid #c9a24a; border-radius: 10px; padding: 2px 10px; font: 900 11px sans-serif; color: #5a3a12; z-index: 8900; white-space: nowrap; pointer-events: none; }
  .jp-world .st circle { fill: rgba(255,255,255,0.8); animation: jpSteam 2.2s ease-out infinite; } .jp-world .st circle:nth-child(2) { animation-delay: 0.7s; } .jp-world .st circle:nth-child(3) { animation-delay: 1.4s; }
  @keyframes jpSteam { 0% { transform: translateY(8px) scale(0.5); opacity: 0.9; } 100% { transform: translateY(-16px) scale(1.5); opacity: 0; } }
  .jp-world .fire path { animation: jpFire 0.28s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; } .jp-world .fl2 { animation: jpFire 0.4s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
  @keyframes jpFire { to { transform: scaleY(1.35); } }
  .jp-world .wk { animation: jpWok 0.9s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; } .jp-world .wk2 { animation: jpWok 0.9s ease-in-out infinite 0.45s; transform-box: fill-box; transform-origin: 50% 100%; }
  @keyframes jpWok { 50% { transform: rotate(-8deg); } } .jp-world .tos circle { animation: jpToss 0.9s ease-in-out infinite; } .jp-world .tos circle:nth-child(2) { animation-delay: 0.15s; } .jp-world .tos circle:nth-child(3) { animation-delay: 0.3s; }
  @keyframes jpToss { 50% { transform: translateY(-10px); } }
  .jp-world .bub circle { fill: rgba(255,255,255,0.8); animation: jpBubble 1s ease-in infinite; } .jp-world .bub.b2 circle { animation-delay: 0.4s; } .jp-world .bub circle:nth-child(2) { animation-delay: 0.3s; }
  @keyframes jpBubble { 0% { transform: translateY(2px); opacity: 0.2; } 60% { opacity: 1; } 100% { transform: translateY(-5px); opacity: 0; } }
  .jp-lamp { transform-origin: 50% 0; animation: jpLamp 3.2s ease-in-out infinite; } @keyframes jpLamp { 50% { transform: rotate(7deg); } } .jp-noren { transform-origin: 50% 0; animation: jpLamp 4s ease-in-out infinite; }
  .jp-ctl { position: absolute; right: 8px; bottom: 8px; display: flex; flex-direction: column; gap: 5px; z-index: 30; }
  .jp-ctl button { width: 34px; height: 34px; border-radius: 50%; border: 2px solid #6b4a24; background: #fff3cf; font-size: 18px; font-weight: 900; color: #5a3a12; box-shadow: 0 2px 0 #6b4a24; cursor: pointer; padding: 0; line-height: 1; }
  `;
  function css() { if (document.getElementById('jp-scene-css')) return; const s = document.createElement('style'); s.id = 'jp-scene-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ---------- estáticos: paredes y piso ----------
  function backdrop() {
    let f = '';
    for (let x = 0; x < GW; x++) for (let y = 0; y < GD; y++) {
      const kit = y < 2.6, salon = x >= 3 && y >= 3;
      const col = kit ? ((x + y) % 2 ? '#e4d6b6' : '#dccda9') : (salon ? ((x + y) % 2 ? '#d8b27c' : '#d1a972') : ((x + y) % 2 ? '#d2ac78' : '#c9a26c'));
      f += `<polygon points="${P(x, y)} ${P(x + 1, y)} ${P(x + 1, y + 1)} ${P(x, y + 1)}" fill="${col}" stroke="rgba(110,70,20,0.18)" stroke-width="0.6"/>`;
    }
    const wallR = `<polygon points="${P(0, 0, 0)} ${P(GW, 0, 0)} ${P(GW, 0, WALL)} ${P(0, 0, WALL)}" fill="#f4e4c0" stroke="#7a5226" stroke-width="1.5"/><polygon points="${P(0, 0, 0)} ${P(GW, 0, 0)} ${P(GW, 0, 14)} ${P(0, 0, 14)}" fill="#c9a26c"/>`;
    const wallL = `<polygon points="${P(0, 0, 0)} ${P(0, GD, 0)} ${P(0, GD, WALL)} ${P(0, 0, WALL)}" fill="#e6cf9c" stroke="#7a5226" stroke-width="1.5"/><polygon points="${P(0, 0, 0)} ${P(0, GD, 0)} ${P(0, GD, 14)} ${P(0, 0, 14)}" fill="#b78d57"/>`;
    let win = '';
    [[6.4, 8.8], [10.0, 12.4], [13.6, 16.0], [17.2, 19.4]].forEach(([a, b]) => { win += `<polygon points="${P(a, 0, 34)} ${P(b, 0, 34)} ${P(b, 0, 56)} ${P(a, 0, 56)}" fill="#fff7de" stroke="#8a6330" stroke-width="1.6"/>` + [1, 2].map(k => `<path d="M${P(a + (b - a) * k / 3, 0, 34)} L${P(a + (b - a) * k / 3, 0, 56)}" stroke="#8a6330" stroke-width="1.2"/>`).join('') + `<path d="M${P(a, 0, 45)} L${P(b, 0, 45)}" stroke="#8a6330" stroke-width="1"/>`; });
    [[7.2, 9.4], [10.2, 11.6]].forEach(([a, b]) => { win += `<polygon points="${P(0, a, 36)} ${P(0, b, 36)} ${P(0, b, 56)} ${P(0, a, 56)}" fill="#fff7de" stroke="#8a6330" stroke-width="1.6"/>`; });
    const beams = [0, 2.6, 5.8, 9.4, 13.0, 16.6, 20].map(x => `<polygon points="${P(x - 0.12, 0, 0)} ${P(x + 0.12, 0, 0)} ${P(x + 0.12, 0, WALL)} ${P(x - 0.12, 0, WALL)}" fill="#8a5a2b"/>`).join('')
      + [0, 3.4, 6.6, 12].map(y => `<polygon points="${P(0, y - 0.12, 0)} ${P(0, y + 0.12, 0)} ${P(0, y + 0.12, WALL)} ${P(0, y - 0.12, WALL)}" fill="#8a5a2b"/>`).join('')
      + `<polygon points="${P(0, 0, WALL)} ${P(GW, 0, WALL)} ${P(GW, 0, WALL + 5)} ${P(0, 0, WALL + 5)}" fill="#6b4a24"/><polygon points="${P(0, 0, WALL)} ${P(0, GD, WALL)} ${P(0, GD, WALL + 5)} ${P(0, 0, WALL + 5)}" fill="#6b4a24"/>`;
    const doors = `<polygon points="${P(0, 0, 46)} ${P(0, 3.2, 46)} ${P(0, 3.2, WALL)} ${P(0, 0, WALL)}" fill="#cfe9f1" stroke="#8fb8c6" stroke-width="1"/><polygon points="${P(0, 0.3, 0)} ${P(0, 1.45, 0)} ${P(0, 1.45, 46)} ${P(0, 0.3, 46)}" fill="#a07b4c" stroke="#6b4a24" stroke-width="1.4"/><polygon points="${P(0, 1.7, 0)} ${P(0, 2.85, 0)} ${P(0, 2.85, 46)} ${P(0, 1.7, 46)}" fill="#a07b4c" stroke="#6b4a24" stroke-width="1.4"/>
      <polygon points="${P(0, 0.55, 30)} ${P(0, 1.2, 30)} ${P(0, 1.2, 40)} ${P(0, 0.55, 40)}" fill="#fff"/><circle cx="${sx(0, 0.875).toFixed(1)}" cy="${sy(0, 0.875, 35).toFixed(1)}" r="3" fill="#1e88e5"/><polygon points="${P(0, 1.95, 30)} ${P(0, 2.6, 30)} ${P(0, 2.6, 40)} ${P(0, 1.95, 40)}" fill="#fff"/><circle cx="${sx(0, 2.275).toFixed(1)}" cy="${sy(0, 2.275, 35).toFixed(1)}" r="3" fill="#e91e63"/>`;
    const entry = `<polygon points="${P(0, 3.9, 0)} ${P(0, 6.0, 0)} ${P(0, 6.0, 52)} ${P(0, 3.9, 52)}" fill="#7a5226" opacity="0.85"/><polygon points="${P(0, 4.05, 0)} ${P(0, 5.85, 0)} ${P(0, 5.85, 46)} ${P(0, 4.05, 46)}" fill="#bfe3f2" opacity="0.7"/>`;
    const env = `<ellipse cx="${sx(-1.6, 5).toFixed(1)}" cy="${sy(-1.6, 5).toFixed(1)}" rx="46" ry="22" fill="#b6e0a5"/><polygon points="${P(-3, 4.1)} ${P(0, 4.1)} ${P(0, 5.9)} ${P(-3, 5.9)}" fill="#cfc7b2" stroke="#9d9680" stroke-width="1"/>`;
    return `<svg class="abs" style="left:0;top:0" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}">${env}${f}${wallR}${wallL}${win}${doors}${entry}${beams}</svg>`;
  }
  function lamp(x, y, z) { return bill(x, y, z, 24, 40, `<div class="jp-lamp"><svg width="22" height="38" viewBox="0 0 22 38"><path d="M11,0 v8" stroke="#333" stroke-width="1.4"/><ellipse cx="11" cy="22" rx="10" ry="13" fill="#d32f2f" stroke="#7f1d1d" stroke-width="1.4"/><path d="M3,17 q8,-3 16,0 M2,23 q9,-3 18,0 M3,29 q8,-3 16,0" stroke="#ff8a80" stroke-width="1" fill="none" opacity="0.7"/><rect x="6" y="8" width="10" height="3" fill="#333"/><rect x="6" y="33" width="10" height="3" fill="#333"/></svg></div>`, 20); }

  // ---------- montaje y cámara ----------
  function create(getState) {
    css();
    const view = document.createElement('div'); view.className = 'jp-view';
    const world = document.createElement('div'); world.className = 'jp-world'; view.appendChild(world);
    const mk = (n, zi) => { const d = document.createElement('div'); d.className = 'abs'; d.style.cssText = `left:0;top:0;width:${WW}px;height:${WH}px;` + (zi != null ? `z-index:${zi}` : ''); d.dataset.l = n; world.appendChild(d); return d; };
    const layers = { bg: mk('bg'), st: mk('st'), ents: mk('ents'), ui: mk('ui', 8000), fx: mk('fx', 9000) };
    layers.bg.innerHTML = backdrop();
    const ctl = document.createElement('div'); ctl.className = 'jp-ctl'; ctl.innerHTML = '<button title="Acercar" onclick="JPScene.zoom(1.35)">＋</button><button title="Alejar" onclick="JPScene.zoom(0.74)">−</button><button title="Ver todo el local" onclick="JPScene.fit()">⤢</button>'; view.appendChild(ctl);
    sc = { view, world, layers, getState, ents: [], parties: [], waiters: [], cooks: [], npc: [], tables: [], last: performance.now(), spawn: 2, timer: 0, key: '', nextChore: 3, ptrs: new Map(), drag: null, camInit: false };
    bindGestures(view);
    sc.timer = setInterval(() => loop(performance.now()), 33);
    window.addEventListener('resize', onResize);
    return view;
  }
  function vsize() { return { w: sc.view.clientWidth || 800, h: sc.view.clientHeight || 300 }; }
  function applyCam(anim) {
    sc.world.classList.toggle('anim', !!anim);
    sc.world.style.transform = `translate(${cam.tx.toFixed(1)}px, ${cam.ty.toFixed(1)}px) scale(${cam.s.toFixed(4)})`;
  }
  function clampCam() {
    const { w, h } = vsize(), sw = WW * cam.s, sh = WH * cam.s;
    cam.tx = sw <= w ? (w - sw) / 2 : Math.min(40, Math.max(w - sw - 40, cam.tx));
    cam.ty = sh <= h ? (h - sh) / 2 : Math.min(40, Math.max(h - sh - 40, cam.ty));
  }
  function fit(anim) {
    const { w, h } = vsize();
    cam.fit = Math.min(w / WW, h / WH) * 0.99; cam.s = cam.fit; cam.focus = null;
    cam.tx = (w - WW * cam.s) / 2; cam.ty = (h - WH * cam.s) / 2; applyCam(anim);
  }
  function onResize() { if (!sc) return; if (cam.focus) focus(cam.focus.z, cam.focus.dock, false); else fit(false); }
  function zoomAt(px, py, f) {
    const ns = Math.min(cam.fit * 5, Math.max(cam.fit * 0.9, cam.s * f)), k = ns / cam.s;
    cam.tx = px - (px - cam.tx) * k; cam.ty = py - (py - cam.ty) * k; cam.s = ns; clampCam(); applyCam(false);
  }
  const FOCUS = { depo: [4.2, 0.9, 24, 2.6], ramen: [7.6, 1.2, 22, 2.7], salteados: [11.2, 1.2, 22, 2.7], frituras: [14.8, 1.2, 22, 2.7], makis: [18.3, 1.2, 22, 2.7], banos: [1.2, 1.5, 24, 2.7], caja: [1.8, 9.4, 18, 2.5], salon: [12, 7.4, 0, 1.6], local: [1.2, 5, 30, 2.4] };
  function focus(z, dock, anim) {
    if (!sc) return;
    if (!z || !FOCUS[z]) { fit(anim !== false); return; }
    const { w, h } = vsize(), f = FOCUS[z], s = Math.min(cam.fit * 5, Math.max(cam.fit * 1.2, f[3] * 0.72 * cam.fit));
    const dw = dock || 0, cx = sx(f[0], f[1]), cy = sy(f[0], f[1], f[2]);
    cam.s = s; cam.tx = (w - dw) / 2 - cx * s; cam.ty = h / 2 - cy * s; cam.focus = { z, dock: dw }; applyCam(anim !== false);
  }
  function toWorld(cx, cy) { const r = sc.view.getBoundingClientRect(); return [(cx - r.left - cam.tx) / cam.s, (cy - r.top - cam.ty) / cam.s]; }
  function hitZone(wx, wy) {
    const u = (wx - OX) / (TW / 2), v = (wy - OY) / (TH / 2); let x = (u + v) / 2, y = (v - u) / 2;
    if (y < 1.0) x -= Math.min(0, y);
    if (x < 0.9 && y > -1) return y < 3.5 ? 'banos' : (y < 6.6 ? 'local' : 'caja');
    if (x < 2.6 && y < 3.4) return 'banos';
    if (y < 2.9 && y > -4) { for (const z of ['depo', ...KIT]) if (x >= ZX[z][0] && x < ZX[z][1]) return z; return x >= ZX.makis[1] ? 'makis' : 'depo'; }
    if (x < 3.3 && y >= 6.4) return 'caja';
    if (x < 2.6 && y >= 3.4) return 'local';
    return 'salon';
  }
  function bindGestures(view) {
    const ptrs = sc.ptrs;
    view.addEventListener('pointerdown', e => {
      if (e.target.closest && e.target.closest('button')) return;
      try { view.setPointerCapture(e.pointerId); } catch (err) {}
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) sc.drag = { x0: e.clientX, y0: e.clientY, tx: cam.tx, ty: cam.ty, moved: false, t: performance.now() };
      else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; sc.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cam.s }; if (sc.drag) sc.drag.moved = true; }
    });
    view.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId); if (!p) return; p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 2 && sc.pinch) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = view.getBoundingClientRect();
        zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, sc.pinch.s * d / Math.max(1, sc.pinch.d) / cam.s); cam.focus = null;
      } else if (ptrs.size === 1 && sc.drag) {
        const dx = e.clientX - sc.drag.x0, dy = e.clientY - sc.drag.y0;
        if (!sc.drag.moved && Math.hypot(dx, dy) > 7) { sc.drag.moved = true; view.classList.add('moving'); cam.focus = null; }
        if (sc.drag.moved) { cam.tx = sc.drag.tx + dx; cam.ty = sc.drag.ty + dy; clampCam(); applyCam(false); }
      }
    });
    const up = e => {
      if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
      if (ptrs.size === 0) {
        view.classList.remove('moving');
        if (sc.drag && !sc.drag.moved && e.type === 'pointerup' && performance.now() - sc.drag.t < 600) { const [wx, wy] = toWorld(e.clientX, e.clientY); JP.zone(hitZone(wx, wy)); }
        sc.drag = null; sc.pinch = null;
      } else if (ptrs.size === 1) { const p = [...ptrs.values()][0]; sc.drag = { x0: p.x, y0: p.y, tx: cam.tx, ty: cam.ty, moved: true, t: 0 }; sc.pinch = null; }
    };
    view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
    view.addEventListener('wheel', e => { e.preventDefault(); const r = view.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 0.87); cam.focus = null; }, { passive: false });
  }
  function destroy() { if (!sc) return; clearInterval(sc.timer); window.removeEventListener('resize', onResize); if (sc.view.parentNode) sc.view.parentNode.removeChild(sc.view); sc = null; cam.focus = null; }

  // ---------- entidades ----------
  const dz = (x, y, o = 0) => Math.round((x + y) * 10) + 8 + o;
  function place(e, x, y) { e.x = x; e.y = y; e.el.style.transform = `translate(${(sx(x, y) - 14).toFixed(1)}px, ${(sy(x, y) - 54).toFixed(1)}px)`; e.el.style.zIndex = dz(x, y, e.zoff || 0); }
  function addEnt(role, x, y, opt) {
    const el = mkPerson(role, opt); sc.layers.ents.appendChild(el);
    const e = { el, x, y, path: [], speed: 1.5, role, done: null, opt: opt || {}, zoff: 0 }; place(e, x, y); sc.ents.push(e); return e;
  }
  function removeEnt(e) { if (e.el.parentNode) e.el.parentNode.removeChild(e.el); sc.ents = sc.ents.filter(x => x !== e); }
  function goPath(e, pts, done) { e.path = pts.slice(); e.done = done || null; e.el.classList.add('walk'); e.el.classList.remove('work'); }
  function stand(e, work) { e.el.classList.remove('walk'); if (work) e.el.classList.add('work'); }
  function say(x, y, html, cls) { const b = document.createElement('div'); b.className = 'jp-bub ' + (cls || ''); b.innerHTML = html; b.style.left = sx(x, y) + 'px'; b.style.top = (sy(x, y) - 84) + 'px'; b.style.zIndex = 8800; sc.layers.fx.appendChild(b); return b; }
  function pop(x, y, txt) { const f = document.createElement('div'); f.className = 'jp-fx'; f.textContent = txt; f.style.left = (sx(x, y) - 18) + 'px'; f.style.top = (sy(x, y) - 62) + 'px'; sc.layers.fx.appendChild(f); setTimeout(() => f.remove(), 1500); }

  // ---------- estructura según el estado ----------
  const ZNAME = { depo: 'Depósito', ramen: 'Ramen', salteados: 'Salteados', frituras: 'Frituras', makis: 'Makis', banos: 'Baños', caja: 'Caja', salon: 'Salón', local: 'Local' };
  function sign(z, g, x, y, h, open, sub, label) {
    const aff = g.canUp(z);
    return `<div class="jp-sign ${open ? '' : 'off'} ${cam.focus && cam.focus.z === z ? 'focus' : ''}" style="left:${sx(x, y).toFixed(1)}px;top:${sy(x, y, h).toFixed(1)}px">${label || ZNAME[z]}<small>${sub}</small>${aff ? '<i class="jp-up">⬆</i>' : ''}</div>`;
  }
  function propSpots(z) {
    if (KIT.includes(z)) { const [a, b] = ZX[z], cx = (a + b) / 2; return [[cx - 1.5, 1.45, 24], [cx + 1.5, 1.45, 24], [cx, 0.2, 46]]; }
    if (z === 'depo') return [[3.3, 0.75, 14], [4.3, 0.75, 38], [5.2, 0.75, 14]];
    if (z === 'banos') return [0, 1, 2].map(i => [0.5, 0.85 + i * 0.85, 52]);
    if (z === 'caja') return [[1.2, 8.1, 20], [1.2, 9.4, 20], [1.2, 10.7, 20]];
    if (z === 'salon') return [[4.4, 4.0, 0], [19.2, 3.6, 0], [7.6, 3.4, 0]];
    return [];
  }
  function sync() {
    if (!sc) return;
    const g = sc.getState(); if (!g) return;
    sc.g = g; const { c, r, ev } = g; const L = sc.layers;
    L.st.innerHTML = ''; L.ui.innerHTML = '';
    sc.cooks.forEach(removeCook); sc.cooks = [];
    sc.waiters.forEach(e => removeEnt(e)); sc.waiters = [];
    sc.npc.forEach(e => removeEnt(e)); sc.npc = [];
    sc.parties.forEach(p => { p.waiter = null; if (p.state === 'bring') p.state = 'order'; });
    let html = '';
    [[4.2, 0.25, 58], [11.2, 0.25, 58], [16.4, 0.25, 58], [0.25, 8.2, 58]].forEach(p => { html += lamp(p[0], p[1], p[2]); });
    KIT.forEach(z => {
      const [a, b] = ZX[z], cx = (a + b) / 2;
      if (!c.areas.includes(z)) {
        html += boxHtml(a + 0.1, CY0, b - 0.1, CY1, 0, 16, GREYC, dz(b, CY1));
        html += sign(z, g, cx, 0.3, WALL + 8, false, 'sin platos aquí'); return;
      }
      const open = r.areas[z], grey = open ? WOODC : GREYC;
      for (let x = a; x < b - 0.01; x += 1.0) { const x1 = Math.min(b, x + 1.0); html += boxHtml(x, CY0, x1, CY1, 0, 20, grey, dz(x1, CY1, 2)); }
      if (open) html += bill(cx, 1.42, 20, 80, 60, EQUIP[z], dz(b, CY1, 3));
      html += sign(z, g, cx, 0.3, WALL + 8, open, open ? `${r.staff[z].n}/${g.staffMax(z)} · Nv ${r.staff[z].l}` : `abrir S/ ${g.fmt(g.costArea(z))}`);
      if (open) { const s = r.staff[z]; for (let i = 0; i < s.n; i++) addCook(z, cx + ([-1.3, 1.3, 0, -0.65, 0.65][i] || 0), s, i); }
    });
    {
      const [a, b] = ZX.depo, s = r.staff.depo;
      html += boxHtml(a, 0.1, b, 0.9, 0, 44, { t: '#d6b27a', l: '#b98a4f', r: '#9a7038' }, dz(b, 0.9, 0));
      [[a + 0.15, 7, '#7cb342'], [a + 1.15, 7, '#ef5350'], [a + 2.15, 7, '#ff9800'], [a + 0.5, 28, '#c8a26a'], [a + 1.7, 28, '#a67c52']].forEach(([x, z0, col]) => { html += boxHtml(x, 0.25, x + 0.75, 0.85, z0, z0 + 12, { t: col, l: col, r: col, st: 'rgba(0,0,0,0.4)' }, dz(x + 0.75, 0.9, 3)); });
      html += sign('depo', g, (a + b) / 2, 0.3, WALL + 8, true, `${s.n}/${g.staffMax('depo')} · Nv ${s.l} · ⭐${r.q}`);
      for (let i = 0; i < s.n; i++) { const e = addEnt('depo', a + 0.8 + i * 0.9, 1.6, { lvl: s.l }); e.home = [a + 0.8 + i * 0.9, 1.6]; e.chore = 'depo'; e.speed = 1.2 + 0.2 * s.l; stand(e, true); sc.npc.push(e); }
    }
    { const s = r.staff.banos; html += sign('banos', g, 0.4, 1.6, WALL + 14, true, `${s.n}/${g.staffMax('banos')} · Nv ${s.l}`); for (let i = 0; i < s.n; i++) { const e = addEnt('clean', 1.6, 3.9 - i * 0.7, { lvl: s.l }); e.home = [1.6, 3.9 - i * 0.7]; e.chore = 'clean'; e.speed = 1.3 + 0.2 * s.l; stand(e, true); sc.npc.push(e); } }
    {
      const s = r.staff.caja;
      html += boxHtml(0.4, 7.2, 1.7, 11.4, 0, 20, WOODC, dz(1.7, 11.4)) + bill(1.1, 8.7, 20, 40, 30, `<svg viewBox="0 0 40 30" width="40" height="30"><rect x="6" y="8" width="28" height="18" rx="3" fill="#78909c" stroke="#37474f" stroke-width="1.4"/><rect x="9" y="11" width="22" height="9" rx="2" fill="#b3e5fc"/><text x="20" y="18.6" font-size="8" text-anchor="middle" fill="#01579b" font-weight="800">¥</text></svg>`, dz(1.7, 11.4, 4));
      html += sign('caja', g, 0.9, 10.2, WALL - 4, true, `${s.n}/${g.staffMax('caja')} · Nv ${s.l}`);
      for (let i = 0; i < Math.min(2, s.n); i++) { const e = addEnt('cash', 0.2, 9.0 + i * 1.4, { lvl: s.l }); e.zoff = -8; stand(e, true); e.el.style.setProperty('--wk', '0.9s'); place(e, 0.2, 9.0 + i * 1.4); e.chore = 'cash'; sc.npc.push(e); }
    }
    html += sign('local', g, 0.2, 6.4, 24, true, g.tierName, '🏠 Entrada');
    html += bill(0.35, 4.95, 40, 44, 52, `<div class="jp-noren"><svg width="44" height="52" viewBox="0 0 44 52"><rect x="0" y="0" width="44" height="5" fill="#6b4a24"/><path d="M2,5 h12 v40 h-12 Z M16,5 h12 v44 h-12 Z M30,5 h12 v40 h-12 Z" fill="#2f4a8a" stroke="#1c2f5e" stroke-width="1"/><circle cx="22" cy="24" r="5" fill="none" stroke="#fff" stroke-width="1.6"/></svg></div>`, 8200);
    sc.tables = [];
    SLOTS.forEach((p, i) => {
      const have = i < r.tables, locked = i >= g.tierTables, [tx, ty] = p;
      if (!have && (locked || i >= r.tables + 2)) { sc.tables.push({ x: tx, y: ty, have: false, party: null, idx: i }); return; }
      if (have) {
        if (g.hasObj('tatami@salon')) html += `<svg class="abs" style="left:0;top:0;z-index:1" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}"><polygon points="${P(tx - 1.6, ty - 1.6)} ${P(tx + 1.6, ty - 1.6)} ${P(tx + 1.6, ty + 1.6)} ${P(tx - 1.6, ty + 1.6)}" fill="#9cbf63" stroke="#5d7a32" stroke-width="1.2"/><path d="M${P(tx - 1.6, ty)} L${P(tx + 1.6, ty)} M${P(tx, ty - 1.6)} L${P(tx, ty + 1.6)}" stroke="rgba(255,255,255,0.35)" stroke-width="1"/></svg>`;
        [[tx, ty - 1.15], [tx, ty + 1.15]].forEach(([qx, qy]) => { html += `<svg class="abs" style="left:0;top:0;z-index:${dz(qx, qy, -3)}" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}"><ellipse cx="${sx(qx, qy).toFixed(1)}" cy="${sy(qx, qy, 2).toFixed(1)}" rx="13" ry="6.5" fill="#c0392b" stroke="#8e2a20" stroke-width="1.2"/></svg>`; });
        html += boxHtml(tx - 0.9, ty - 0.6, tx + 0.9, ty + 0.6, 0, 11, TABLEC, dz(tx + 0.9, ty + 0.6, -1));
      } else html += `<svg class="abs" style="left:0;top:0;z-index:2" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}"><polygon points="${P(tx - 0.9, ty - 0.6)} ${P(tx + 0.9, ty - 0.6)} ${P(tx + 0.9, ty + 0.6)} ${P(tx - 0.9, ty + 0.6)}" fill="rgba(255,255,255,0.18)" stroke="#7a5226" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${sx(tx, ty).toFixed(1)}" y="${(sy(tx, ty) + 4).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="900" fill="#5a3a12">＋</text></svg>`;
      sc.tables.push({ x: tx, y: ty, have, party: null, idx: i });
    });
    sc.tables.forEach(t => { const old = sc.parties.find(pp => pp.idx === t.idx); if (old) t.party = old; });
    sc.parties.filter(p => p.idx >= r.tables).forEach(p => endParty(p));
    html += sign('salon', g, 8.2, 11.7, 0, true, `${r.tables} mesas · ${r.staff.salon.n}/${g.staffMax('salon')} mozos · Nv ${r.staff.salon.l}`).replace('translate(-50%, -100%)', 'translate(-50%, 0)');
    ['ramen', 'salteados', 'frituras', 'makis', 'depo', 'banos', 'caja', 'salon'].forEach(z => {
      if (KIT.includes(z) && (!c.areas.includes(z) || !r.areas[z])) return;
      const list = g.OBJ[z], spots = propSpots(z); if (!list) return;
      list.forEach((o, i) => {
        const have = g.hasObj(o[0] + '@' + z), p = spots[i]; if (!p) return;
        html += `<div class="jp-prop ${have ? 'have' : 'slot'}" style="left:${sx(p[0], p[1]).toFixed(1)}px;top:${sy(p[0], p[1], p[2]).toFixed(1)}px;z-index:${have ? dz(p[0], p[1], 6) : 8100}">${have ? o[1] : '＋'}</div>`;
      });
    });
    L.st.innerHTML = html;
    for (let i = 0; i < r.staff.salon.n; i++) {
      const e = addEnt('waiter', 4.6 + i * 0.9, PASS_Y + 0.2, { lvl: r.staff.salon.l });
      e.speed = 1.5 + 0.35 * r.staff.salon.l; e.home = [4.6 + i * 0.9, PASS_Y + 0.2]; e.state = 'idle'; e.party = null; sc.waiters.push(e);
    }
    const warn = ev.net < 0 ? '⚠️ El local pierde dinero' : (ev.wCap <= 0 ? '⚠️ Sin mozos: nadie atiende' : '');
    if (warn) L.ui.insertAdjacentHTML('beforeend', `<div class="jp-warn" style="left:${sx(10, 2.8).toFixed(1)}px;top:${sy(10, 2.8).toFixed(1)}px">${warn}</div>`);
    cashPile();
    if (!sc.camInit) { sc.camInit = true; fit(false); }
  }
  function addCook(z, x, s, i) {
    const e = mkPerson('cook', { lvl: s.l, band: LV[s.l - 1], cloth: ['#37474f', '#5d4037', '#455a64', '#4e342e', '#263238'][i % 5] });
    sc.layers.ents.appendChild(e); const c = { el: e, x, y: COOK_Y, area: z, role: 'cook', path: [], speed: 1.1 + 0.2 * s.l, home: [x, COOK_Y], t: rnd(0.5, 4), done: null, zoff: 0 };
    e.classList.add('work'); e.style.setProperty('--wk', (1.15 - 0.16 * s.l).toFixed(2) + 's'); e.style.animationDelay = (i * 0.2) + 's';
    sc.cooks.push(c); sc.ents.push(c); place(c, x, COOK_Y);
  }
  function removeCook(c) { if (c.el.parentNode) c.el.parentNode.removeChild(c.el); sc.ents = sc.ents.filter(x => x !== c); }
  function cashPile() {
    if (!sc || !sc.g) return; const g = sc.getState(), c = Math.floor(g.r.cash);
    let el = sc.layers.ui.querySelector('.jp-cashpile');
    if (!el) { el = document.createElement('div'); el.className = 'jp-cashpile'; el.style.left = sx(2.6, 10.9).toFixed(1) + 'px'; el.style.top = sy(2.6, 10.9, 30).toFixed(1) + 'px'; sc.layers.ui.appendChild(el); }
    el.textContent = '💴 S/ ' + g.fmt(c); el.classList.toggle('empty', c < 1);
  }

  // ---------- simulación visual ----------
  const activeAreas = () => KIT.filter(a => sc.g.c.areas.includes(a) && sc.g.r.areas[a] && sc.g.r.staff[a].n > 0);
  const cookCap = a => { const q = sc.g.ev.per.find(x => x.a === a); return q ? Math.max(0.08, q.cap) : 0.3; };
  function spawnParty() {
    const g = sc.g, areas = activeAreas(); if (!areas.length) return;
    const free = sc.tables.filter(t => t.have && !t.party); if (!free.length) return;
    const t = pick(free), n = Math.random() < 0.55 ? 2 : 1, area = pick(areas), dish = pick(g.c.dishes.filter(d => d[1] === area));
    const party = { idx: t.idx, x: t.x, y: t.y, area, dish, n, state: 'walkin', ents: [], timer: 0, waiter: null, bub: null, arrived: 0, patience: 0 };
    t.party = party;
    const seats = n === 2 ? [[t.x, t.y - 1.15], [t.x, t.y + 1.15]] : [[t.x, Math.random() < 0.5 ? t.y - 1.15 : t.y + 1.15]];
    for (let i = 0; i < n; i++) {
      const e = addEnt('cust', DOOR[0], DOOR[1] + rnd(-0.3, 0.3), {}); e.speed = 1.6 + rnd(0, 0.5); e.party = party; party.ents.push(e);
      goPath(e, [[1.6, 4.9], [seats[i][0] - 1.4, seats[i][1] + (seats[i][1] > t.y ? 0.9 : -0.9)], seats[i]], () => {
        stand(e, false); e.el.classList.add('sit', 'chat'); e.sat = true; e.zoff = seats[i][1] < t.y ? -4 : 4; place(e, seats[i][0], seats[i][1]); party.arrived++;
        if (party.arrived >= party.ents.length) { party.state = 'order'; party.patience = 0; party.bub = say(t.x, t.y - 0.4, ICON[area], ''); }
      });
    }
    sc.parties.push(party);
  }
  function endParty(p) {
    if (p.bub) { p.bub.remove(); p.bub = null; }
    p.ents.forEach(e => removeEnt(e));
    const t = sc.tables.find(t => t.idx === p.idx); if (t && t.party === p) t.party = null;
    sc.parties = sc.parties.filter(x => x !== p);
    sc.waiters.forEach(w => { if (w.party === p) { w.party = null; w.state = 'idle'; if (w.tray) { w.tray.remove(); w.tray = null; } } });
  }
  function leaveParty(p) {
    p.state = 'leave'; if (p.bub) { p.bub.remove(); p.bub = null; }
    p.ents.forEach((e, i) => { e.el.classList.remove('sit', 'eat', 'chat'); e.sat = false; e.zoff = 0; e.speed = 2.0; goPath(e, [[p.x - 1.4, p.y + (i ? 1.4 : -1.4)], [1.6, 5.0], [DOOR[0] - 1.2, DOOR[1]]], () => { e.gone = true; }); });
    const t = sc.tables.find(t => t.idx === p.idx); if (t && t.party === p) t.party = null;
    p.endAt = performance.now() + 20000;
  }
  function payParty(p) {
    p.state = 'pay'; if (p.bub) { p.bub.remove(); p.bub = null; }
    p.ents.forEach((e, i) => { e.el.classList.remove('sit', 'eat', 'chat'); e.sat = false; e.zoff = 0; e.speed = 1.9; e.paid = false;
      goPath(e, [[p.x - 1.4, p.y + (i ? 1.4 : -1.4)], [CASH_STAND[0] + 2.2, CASH_STAND[1] - 0.8], [CASH_STAND[0], CASH_STAND[1] + i * 0.9]], () => {
        stand(e, false); e.paid = true;
        if (p.ents.every(x => x.paid) && p.state === 'pay') {
          const g = sc.g, per = g.ev.per.find(q => q.a === p.area), val = per ? per.price * g.pm : 5;
          pop(CASH_STAND[0], CASH_STAND[1], '+S/ ' + (val * p.ents.length).toFixed(1));
          try { playSound('stock_add'); } catch (err) {}
          const hap = say(CASH_STAND[0], CASH_STAND[1] - 0.2, '😊', 'green'); setTimeout(() => hap.remove(), 900);
          leaveParty(p);
        }
      }); });
  }
  function assign(w) {
    const p = sc.parties.find(q => q.state === 'order' && !q.waiter); if (!p) return false;
    p.waiter = w; w.party = p; w.state = 'toKitchen';
    const [a, b] = ZX[p.area], px = (a + b) / 2 + rnd(-1.0, 1.0);
    goPath(w, [[px, PASS_Y]], () => { w.state = 'cooking'; w.wait = Math.max(0.6, Math.min(5, 60 / Math.max(0.05, cookCap(p.area) * TL))); stand(w, false); const ck = sc.cooks.find(c => c.area === p.area); if (ck) ck.el.classList.add('work'); });
    return true;
  }
  function deliver(w) {
    const p = w.party; if (!p) { w.state = 'idle'; return; }
    w.state = 'toTable';
    const tray = document.createElement('div'); tray.className = 'jp-tray'; tray.textContent = ICON[p.area]; w.el.appendChild(tray); w.tray = tray;
    goPath(w, [[p.x + 1.8, PASS_Y + 0.4], [p.x + 1.6, p.y]], () => {
      stand(w, false); if (w.tray) { w.tray.remove(); w.tray = null; }
      const per = sc.g.ev.per.find(q => q.a === p.area), err = per ? Math.min(0.6, per.err + sc.g.ev.wErr) : 0.2;
      if (p.bub) { p.bub.remove(); p.bub = null; }
      if (Math.random() < err) { p.state = 'bad'; p.timer = 1.6; p.bub = say(p.x, p.y - 0.4, '😖', 'red'); pop(p.x, p.y, '✗ error'); try { playSound('error'); } catch (e2) {} }
      else { p.state = 'eat'; p.timer = rnd(2.6, 3.8); p.ents.forEach(e => { e.el.classList.remove('chat'); e.el.classList.add('eat'); }); p.bub = say(p.x, p.y - 0.4, '😋', 'green'); }
      w.state = 'return'; w.party = null; goPath(w, [[p.x + 1.8, PASS_Y + 0.4], w.home], () => { w.state = 'idle'; stand(w, false); });
    });
  }
  function patrol(w) {                                  // los mozos nunca se quedan quietos: limpian mesas o llevan bandejas vacías
    const occ = sc.tables.filter(t => t.have);
    if (occ.length && Math.random() < 0.55) {
      const t = pick(occ); w.state = 'chore';
      goPath(w, [[t.x + 1.8, PASS_Y + 0.4], [t.x + 1.6, t.y]], () => { w.el.classList.add('work'); w.el.classList.remove('walk'); w.workT = rnd(1.6, 3); w.state = 'wipe'; });
    } else {
      const a = activeAreas(), area = a.length ? pick(a) : 'ramen', [x0, x1] = ZX[area]; w.state = 'chore';
      goPath(w, [[(x0 + x1) / 2 + rnd(-1, 1), PASS_Y]], () => { const tray = document.createElement('div'); tray.className = 'jp-tray'; tray.textContent = '🍵'; w.el.appendChild(tray); w.tray = tray; goPath(w, [w.home], () => { if (w.tray) { w.tray.remove(); w.tray = null; } w.state = 'idle'; stand(w, false); }); });
    }
  }
  function loop(now) {
    if (!sc || !sc.g) return;
    const dt = Math.min(0.1, (now - sc.last) / 1000); sc.last = now;
    for (const e of sc.ents) {
      if (e.path && e.path.length) {
        const [tx, ty] = e.path[0], dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), st = e.speed * dt;
        if (d <= st) { e.x = tx; e.y = ty; e.path.shift(); if (!e.path.length) { place(e, e.x, e.y); const f = e.done; e.done = null; if (f) f(); continue; } }
        else { e.x += dx / d * st; e.y += dy / d * st; const sdx = dx - dy; if (Math.abs(sdx) > 0.05) e.el.classList.toggle('flip', sdx < 0); }
        place(e, e.x, e.y);
      }
    }
    sc.ents.filter(e => e.gone).forEach(removeEnt);
    for (const c of sc.cooks) {                           // cocineros: cocinan en su puesto, van por ingredientes al depósito y vuelven
      if (c.path && c.path.length) continue;
      c.t -= dt;
      if (c.t <= 0) {
        c.t = rnd(5, 10); const box = document.createElement('div'); box.className = 'jp-tray'; box.textContent = pick(['🥬', '🍚', '📦', '🥩']);
        goPath(c, [[ZX.depo[1] - 0.8, COOK_Y]], () => { c.el.appendChild(box); c.el.classList.add('work'); c.el.classList.remove('walk'); setTimeout(() => { if (!sc) return; goPath(c, [c.home], () => { box.remove(); c.el.classList.add('work'); c.el.classList.remove('walk'); }); }, 900); });
      }
    }
    for (const p of sc.parties.slice()) {
      if (p.state === 'order') { p.patience += dt; if ((!sc.waiters.length && p.patience > 14) || p.patience > 45) { if (p.bub) p.bub.remove(); p.bub = say(p.x, p.y - 0.4, '😠', 'red'); p.state = 'bad'; p.timer = 1.2; } }
      if (p.state === 'eat' || p.state === 'bad') { p.timer -= dt; if (p.timer <= 0) { if (p.state === 'eat') payParty(p); else leaveParty(p); } }
      if (p.state === 'leave' && (performance.now() > p.endAt || p.ents.every(e => e.gone || !e.el.parentNode))) endParty(p);
    }
    for (const w of sc.waiters) {
      if (w.state === 'idle') { if (!assign(w)) patrol(w); }
      else if (w.state === 'cooking') { w.wait -= dt; if (w.wait <= 0) deliver(w); }
      else if (w.state === 'wipe') { w.workT -= dt; if (w.workT <= 0) { w.el.classList.remove('work'); w.state = 'return'; goPath(w, [w.home], () => { w.state = 'idle'; stand(w, false); }); } }
    }
    sc.nextChore -= dt;
    if (sc.nextChore <= 0) {
      sc.nextChore = rnd(2.5, 5);
      const free = sc.npc.filter(n => n.chore && n.chore !== 'cash' && (!n.path || !n.path.length) && !n.busy), npc = free.length ? pick(free) : null;
      if (npc && npc.chore === 'depo') {
        const a = activeAreas(), t = a.length ? pick(a) : null;
        if (t) { const x = (ZX[t][0] + ZX[t][1]) / 2 + rnd(-1, 1); npc.busy = true; const box = document.createElement('div'); box.className = 'jp-tray'; box.textContent = '📦'; npc.el.appendChild(box); goPath(npc, [[x, PASS_Y - 0.1]], () => { box.remove(); goPath(npc, [npc.home], () => { npc.busy = false; stand(npc, true); }); }); }
      } else if (npc && npc.chore === 'clean') {
        const ts = sc.tables.filter(t => t.have); npc.busy = true;
        const mop = document.createElement('div'); mop.className = 'jp-tray'; mop.textContent = '🧹'; npc.el.appendChild(mop);
        const route = ts.length ? [[2.4, 3.6]].concat([pick(ts), pick(ts)].map(t => [t.x - 1.7, t.y + 1.4])) : [[3, 3.6]];
        route.push(npc.home);
        let k = 0; const next = () => { goPath(npc, [route[k]], () => { npc.el.classList.add('work'); npc.el.classList.remove('walk'); setTimeout(() => { if (!sc) return; k++; if (k < route.length) next(); else { mop.remove(); npc.busy = false; stand(npc, true); } }, 1100); }); };
        next();
      }
    }
    sc.spawn -= dt;                                       // siempre hay movimiento si el local atiende
    if (sc.spawn <= 0) {
      const g = sc.g, partiesMin = Math.min(14, Math.max(2.2, g.ev.served * TL / 1.5));
      sc.spawn = g.ev.served <= 0.01 ? 5 : Math.max(2.2, Math.min(30, 60 / partiesMin)) * rnd(0.7, 1.3);
      if (g.ev.served > 0.01 && sc.parties.length < Math.max(1, g.r.tables)) spawnParty();
    }
  }

  // ---------- API ----------
  // piezas compartidas con la escena del inicio (inicio.js): misma proyección isométrica, personas, cajas y estilos
  window.JPKit = { TW, TH, GW, GD, OX, OY, WW, WH, WALL, sx, sy, P, mkPerson, boxHtml, bill, EQUIP, lamp, css, WOODC, GREYC, TABLEC, LV, rnd, pick };
  window.JPScene = {
    mount(host, getState) {
      if (sc && sc.key !== getState().c.id) destroy();
      if (!sc) { create(getState); sc.key = getState().c.id; }
      sc.getState = getState;
      host.insertBefore(sc.view, host.firstChild);
      sync();
      if (cam.focus) focus(cam.focus.z, cam.focus.dock, false); else if (sc.camInit) { clampCam(); applyCam(false); }
    },
    detach() { if (sc && sc.view.parentNode) sc.view.parentNode.removeChild(sc.view); },
    update() { if (sc) cashPile(); },
    focus(z, dock) { focus(z, dock, true); },
    zoom(f) { if (!sc) return; const { w, h } = vsize(); zoomAt(w / 2, h / 2, f); cam.focus = null; },
    fit() { if (sc) fit(true); },
    debugHit(cx, cy) { const [wx, wy] = toWorld(cx, cy); const u = (wx - OX) / (TW / 2), v = (wy - OY) / (TH / 2); return { wx, wy, x: (u + v) / 2, y: (v - u) / 2, zone: hitZone(wx, wy), cam: { ...cam } }; },
    destroy
  };
})();
