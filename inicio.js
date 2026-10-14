/* Inicio isométrico: el ramen-ya como menú del juego.
   Cada zona del local abre un modo: las 4 áreas de cocina (lección · entrenamiento · cocina libre), el timbre (Campaña/Rash), el Maestro (lecciones),
   la máquina de tickets (retos), el libro (Recetario), la pizarra (Ranking), el baúl (Secretos), los cuchillos (Mejoras), la despensa (Ingredientes),
   la puerta (Japón), la caja (Cuenta/Estadísticas) y la sala privada (Multijugador). Solo toques: tocar una zona acerca la cámara y abre su panel.
   Reutiliza la proyección, las personas y los estilos de japon-scene.js (JPKit). El menú clásico se conserva (ver «⚙ → Menú clásico»). */
(function () {
  'use strict';
  const K = window.JPKit;
  if (!K) return;
  const { TW, TH, GW, GD, OX, OY, WW, WH, WALL, sx, sy, P, mkPerson, boxHtml, bill, EQUIP, lamp, WOODC, TABLEC, LV, rnd, pick } = K;
  const VKEY = 'ramen_inicio_vista';
  const dz = (x, y, o = 0) => Math.round((x + y) * 10) + 8 + o;
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const $ = id => document.getElementById(id);

  // ---------- datos de las zonas ----------
  const AREAS = [
    { id: 'ramen', n: 'Ramen', i: '🍜', ch: 'ramen', les: 'ramen', kj: '拉麺', x: [3.2, 7.2], reward: 60 },
    { id: 'salteados', n: 'Salteado', i: '🥘', ch: 'salteado', les: 'salteados', kj: '炒め', x: [7.2, 11.2], reward: 80 },
    { id: 'frituras', n: 'Frituras', i: '🍤', ch: 'frituras', les: 'frituras', kj: '揚げ', x: [11.2, 15.2], reward: 120 },
    { id: 'makis', n: 'Makis', i: '🍣', ch: 'makis', les: 'makis', kj: '巻き', x: [15.2, 19.2], reward: 100 }
  ];
  const AREA = Object.fromEntries(AREAS.map(a => [a.id, a]));
  const ZONES = {
    depo: { n: 'Despensa', i: '📦', pin: [1.3, 2.9, 0], boxes: [[0.4, 0.1, 3.2, 1.3, 0, 62]], foc: [1.8, 0.8, 30, 2.3] },
    ramen: { n: 'Ramen', i: '🍜', area: true, pin: [5.8, 0.3, WALL + 10], boxes: [[3.2, 0.1, 7.2, 2.0, 0, 64]], foc: [5.2, 1.2, 24, 2.2] },
    salteados: { n: 'Salteado', i: '🥘', area: true, pin: [9.2, 0.3, WALL + 10], boxes: [[7.2, 0.1, 11.2, 2.0, 0, 64]], foc: [9.2, 1.2, 24, 2.2] },
    frituras: { n: 'Frituras', i: '🍤', area: true, pin: [13.2, 0.3, WALL + 10], boxes: [[11.2, 0.1, 15.2, 2.0, 0, 64]], foc: [13.2, 1.2, 24, 2.2] },
    makis: { n: 'Makis', i: '🍣', area: true, pin: [17.2, 0.3, WALL + 10], boxes: [[15.2, 0.1, 19.2, 2.0, 0, 64]], foc: [17.2, 1.2, 24, 2.2] },
    timbre: { n: 'Timbre', i: '🔔', s: 'Campaña · Rash', pin: [10.2, 3.6, 52], boxes: [[9.5, 3.2, 11.7, 4.4, 0, 36]], foc: [10.6, 3.8, 20, 2.4] },
    libro: { n: 'Recetario', i: '📖', pin: [13.6, 3.9, 34], boxes: [[12.0, 3.2, 13.6, 4.4, 0, 30]], foc: [12.8, 3.8, 20, 2.6] },
    maestro: { n: 'Maestro', i: '🎓', pin: [3.6, 3.3, 80], boxes: [[2.9, 2.7, 4.4, 3.9, 0, 58]], foc: [3.6, 3.3, 26, 2.4] },
    tickets: { n: 'Retos', i: '🎫', pin: [0.8, 9.6, 56], boxes: [[0.1, 8.8, 1.6, 10.3, 0, 44]], foc: [0.8, 9.5, 24, 2.5] },
    caja: { n: 'Caja', i: '💴', pin: [1.0, 11.5, 40], boxes: [[0.2, 10.3, 2.1, 11.9, 0, 34]], foc: [1.1, 11.0, 14, 2.5] },
    pizarra: { n: 'Ranking', i: '🏆', pin: [0.2, 2.0, 60], boxes: [[0, 0.3, 0.3, 3.1, 20, 58]], foc: [0.2, 1.6, 38, 2.4] },
    puerta: { n: 'Japón', i: '🗾', pin: [0.2, 4.5, 60], boxes: [[0, 3.2, 0.3, 5.9, 0, 56]], foc: [0.2, 4.5, 28, 2.3] },
    cuchillos: { n: 'Mejoras', i: '🔪', pin: [0.2, 7.4, 60], boxes: [[0, 5.8, 0.3, 8.8, 26, 58]], foc: [0.2, 7.3, 40, 2.4] },
    baul: { n: 'Secretos', i: '📜', pin: [2.3, 6.9, 18], boxes: [[0.4, 6.0, 2.3, 7.9, 0, 22]], foc: [1.3, 6.9, 12, 2.6] },
    sala: { n: 'Sala privada', i: '🚪', pin: [16.5, 7.2, 56], boxes: [[14.0, 6.4, 19.9, 11.8, 0, 44]], foc: [17.0, 8.8, 16, 1.9] }
  };
  const FIRST_ZONE = 'maestro';
  const ORDER_LES = ['ramen', 'salteados', 'makis', 'frituras'];
  const LES_NAME = { ramen: 'Ramen', salteados: 'Salteado', makis: 'Makis', frituras: 'Frituras' };
  const LES_ICON = { ramen: '🍜', salteados: '🥘', makis: '🍣', frituras: '🍤' };
  const MODE_NAME = { TUTORIAL: 'Tutorial', TRAINING: 'Entrenamiento', FREE: 'Cocina libre', NORMAL: 'Campaña', RASH: 'Rash' };

  // ---------- estado del jugador ----------
  const flags = () => { try { return (window.Guia && Guia.flags()) || {}; } catch (e) { return {}; } };
  const tutDone = () => { try { return isTutorialCompleted(); } catch (e) { return false; } };
  const rashLvl = () => parseInt(store.get('ramen_mania_rash_level') || '1') || 1;
  function feats() { try { return trainingFeaturesUnlocked(); } catch (e) { return new Set(); } }
  function areaLit(id) {
    const fl = flags();
    if (id === 'ramen') return true;                      // el ramen es la cocina base: siempre encendida
    const a = AREA[id];
    if (fl[a.les] || feats().has('area_' + id)) return true;
    try { const list = AREA_DISH_UNLOCKS[id] || []; return list.length && rashLvl() >= Math.min(...list.map(d => d[2])); } catch (e) { return false; }
  }
  function upgradesTotal() { try { loadAccountProgressLocal(); return Object.values(accountProgress.levels || {}).reduce((s, n) => s + (n || 0), 0); } catch (e) { return 0; } }
  function retosHechos() { try { return trainingDoneCount(); } catch (e) { return 0; } }
  function tierOf() {                                       // el local crece con el avance: lecciones, retos, rondas de Rash y mejoras
    if (window.__iniTier != null) return window.__iniTier;     // (solo para pruebas)
    const fl = flags(), les = ORDER_LES.filter(k => fl[k]).length;
    const sc = retosHechos() + 4 * les + (rashLvl() - 1) + Math.floor(upgradesTotal() / 2);
    return sc >= 42 ? 4 : sc >= 26 ? 3 : sc >= 14 ? 2 : sc >= 6 ? 1 : 0;
  }
  const firstTime = () => !tutDone() && !flags().ramen;
  const infoSig = () => [JSON.stringify(flags()), tutDone() ? 1 : 0, retosHechos(), [...feats()].length, upgradesTotal(), rashLvl(), new Date().getHours()].join('|');

  // ---------- geometría ----------
  const poly = (pts, fill, stroke, sw, extra) => `<polygon points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${sw || 1}"` : ''} ${extra || ''}/>`;
  const faceX = (x, y0, y1, z0, z1) => (u, v) => [sx(x, y0 + (y1 - y0) * u), sy(x, y0 + (y1 - y0) * u, z0 + (z1 - z0) * v)];     // plano x = const (pared izquierda y caras que miran al local)
  const faceY = (y, x0, x1, z0, z1) => (u, v) => [sx(x0 + (x1 - x0) * u, y), sy(x0 + (x1 - x0) * u, y, z0 + (z1 - z0) * v)];     // plano y = const (pared del fondo)
  const quad = (f, u0, v0, u1, v1) => [f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)];
  const layer = (html, zi) => `<svg class="abs" style="left:0;top:0;z-index:${zi}" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}">${html}</svg>`;
  function wallText(plane, a, b, z, txt, size, fill, anchor) {                       // texto pegado a una pared (inclinado como la pared)
    const px = plane === 'x' ? sx(0, a) : sx(a, 0), py = plane === 'x' ? sy(0, a, z) : sy(a, 0, z);
    const m = plane === 'x' ? 'matrix(1,-0.5,0,1,' : 'matrix(1,0.5,0,1,';
    return `<text transform="${m}${px.toFixed(1)},${py.toFixed(1)})" font-size="${size}" font-weight="900" font-family="'Fredoka',sans-serif" fill="${fill}" text-anchor="${anchor || 'middle'}">${txt}</text>`;
  }
  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    const up = []; for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop(); return lo.concat(up);
  }
  const boxHull = b => { const c = []; [b[0], b[2]].forEach(x => [b[1], b[3]].forEach(y => [b[4], b[5]].forEach(z => c.push([sx(x, y), sy(x, y, z)])))); return hull(c); };
  const polyArea = p => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return Math.abs(a) / 2; };
  const inPoly = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };

  // ---------- estado de la escena ----------
  let S = null;
  const cam = { s: 1, tx: 0, ty: 0, fit: 1, focus: null };
  const DOOR = [-0.9, 4.6];
  const STOOLS = Array.from({ length: 7 }, (_, i) => [6.0 + i * 1.78, 5.05]);
  const TABLES = [[7.4, 8.4], [10.6, 9.6], [12.0, 7.1]];

  const CSS = `
  #start-screen.ini-on .start-screen-content, #start-screen.ini-on .start-ambient-bg, #start-screen.ini-on .start-lantern, #start-screen.ini-on .start-steam-particles { display: none !important; }
  #start-screen.ini-on .start-footer-bar { display: none !important; }
  #start-screen.ini-on .start-screen-top-bar { pointer-events: none; } #start-screen.ini-on .start-screen-top-bar > * , #start-screen.ini-on .start-screen-top-bar button { pointer-events: auto; }
  #start-screen .ini-wrap, #start-screen .ini-back { display: none; }
  #start-screen.ini-on .ini-wrap { display: block; }
  #start-screen:not(.ini-on) .ini-back { display: block; }
  .ini-wrap { position: absolute; left: 0; right: 0; top: 0; bottom: 0; z-index: 5; overflow: hidden; background: radial-gradient(ellipse at 50% 45%, #5a3320 0%, #2b150d 70%, #1a0b07 100%); }
  .ini-view { position: absolute; inset: 0; touch-action: none; user-select: none; -webkit-user-select: none; overflow: hidden; }
  .ini-tint { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: multiply; z-index: 4; transition: background 2s; }
  .ini-pin { position: absolute; transform: translate(-50%, -100%) scale(var(--pinS, 1)); transform-origin: 50% 100%; background: linear-gradient(#f4dca4, #d4a85c); border: 2px solid #6b4a24; border-radius: 8px; padding: 1px 6px 2px; font: 900 12.5px/1.15 'Fredoka', sans-serif; color: #3b2208; text-align: center; z-index: 8000; box-shadow: 0 2px 0 #6b4a24, 0 3px 6px rgba(0,0,0,0.35); white-space: nowrap; pointer-events: none; }
  .ini-pin small { display: block; font-size: 9px; font-weight: 800; color: #5b3a12; }
  .ini-pin.dim { filter: saturate(0.5) brightness(0.88); opacity: 0.82; } .ini-pin.focus { outline: 3px solid #ffe066; } .ini-pin.glow { animation: iniGlow 1.2s ease-in-out infinite; }
  .ini-pin i { font-style: normal; position: absolute; left: 50%; top: -22px; transform: translateX(-50%); font-size: 20px; animation: jpBounce 0.8s ease-in-out infinite; }
  @keyframes iniGlow { 50% { box-shadow: 0 2px 0 #6b4a24, 0 0 14px 4px #ffe066; } }
  .ini-start { position: absolute; transform: translateX(-50%); z-index: 8001; background: #fff3a8; border: 2px solid #c62828; border-radius: 12px; padding: 1px 9px; font: 900 12px 'Fredoka', sans-serif; color: #b71c1c; white-space: nowrap; pointer-events: none; animation: jpBounce 0.8s ease-in-out infinite; box-shadow: 0 2px 5px rgba(0,0,0,0.35); }
  .ini-ring { position: absolute; width: 44px; height: 22px; margin: -11px 0 0 -22px; border: 3px solid #ffe066; border-radius: 50%; animation: iniRing 1.3s ease-out infinite; pointer-events: none; z-index: 7999; }
  @keyframes iniRing { from { transform: scale(0.5); opacity: 1; } to { transform: scale(2); opacity: 0; } }
  .ini-cap { position: absolute; left: 50%; top: -12px; transform: translateX(-50%); font-size: 17px; pointer-events: none; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4)); }
  .ini-bell { transform-origin: 50% 90%; animation: iniBell 2.6s ease-in-out infinite; } @keyframes iniBell { 0%, 60%, 100% { transform: rotate(0); } 66% { transform: rotate(-9deg); } 72% { transform: rotate(8deg); } 78% { transform: rotate(-5deg); } 84% { transform: rotate(0); } }
  .ini-paw { transform-origin: 20% 80%; animation: iniPaw 1.2s ease-in-out infinite; } @keyframes iniPaw { 50% { transform: rotate(-26deg); } }
  .ini-koi { animation: iniKoi 3.4s ease-in-out infinite; transform-origin: 0 50%; } @keyframes iniKoi { 50% { transform: rotate(7deg); } }
  .ini-flame { animation: jpFire 0.5s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
  /* sprites de personas (atlas de 4 columnas × 3 filas de 128×192 a la mitad de tamaño): fila 0 caminar de frente, 1 trabajar, 2 caminar de espaldas; el reflejo horizontal da las otras dos direcciones */
  .ini-sp { position: absolute; left: -18px; top: -37px; width: 64px; height: 96px; background-size: 256px 288px; background-repeat: no-repeat; background-position: 0 0; pointer-events: none; }
  .jp-p.flip .ini-sp { transform: scaleX(-1); }
  .jp-p.walk .ini-sp { animation: iniSpr 0.46s steps(4) infinite; } .jp-p.walk.up .ini-sp { background-position-y: -192px; }
  .jp-p.work .ini-sp { background-position-y: -96px; animation: iniSpr calc(var(--wk, 0.8s) * 1.1) steps(4) infinite; }
  @keyframes iniSpr { from { background-position-x: 0; } to { background-position-x: -256px; } }
  .ini-play { position: absolute; right: 10px; bottom: 10px; z-index: 30; border: 3px solid #ffe082; border-radius: 16px; padding: 7px 18px 8px; background: linear-gradient(135deg, #ff9800, #d32f2f 65%, #b71c1c); color: #fff; font: 900 16px/1.1 'Fredoka', sans-serif; box-shadow: 0 4px 0 #5f0000, 0 0 16px rgba(255,152,0,0.55); cursor: pointer; text-shadow: 0 1px 0 rgba(0,0,0,0.4); }
  .ini-play small { display: block; font-size: 10px; font-weight: 700; opacity: 0.9; }
  .ini-gear { position: absolute; left: 10px; bottom: 10px; z-index: 30; width: 40px; height: 40px; border-radius: 50%; border: 2px solid #6b4a24; background: #fff3cf; font-size: 20px; box-shadow: 0 2px 0 #6b4a24; cursor: pointer; padding: 0; }
  .ini-wrap.focus .ini-play { display: none; } .ini-wrap.focus .ini-pin:not(.focus) { opacity: 0.55; }
  .ini-hint { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); z-index: 29; background: rgba(0,0,0,0.55); color: #ffe9b0; border-radius: 12px; padding: 3px 12px; font: 800 12px 'Fredoka', sans-serif; pointer-events: none; white-space: nowrap; }
  .ini-wrap.focus .ini-hint { display: none; }
  .ini-dock { position: absolute; top: 46px; bottom: 8px; right: 6px; width: min(300px, 40%); z-index: 40; background: linear-gradient(#fff6dc, #f1dcaa); border: 3px solid #6b4a24; border-radius: 16px; box-shadow: 0 4px 0 #4a3216, 0 8px 24px rgba(0,0,0,0.5); padding: 8px 10px; display: none; flex-direction: column; gap: 6px; overflow-y: auto; color: #3b2208; font-family: 'Fredoka', sans-serif; animation: iniDock 0.28s cubic-bezier(.2,1.2,.4,1); }
  .ini-dock.open { display: flex; } @keyframes iniDock { from { transform: translateX(40px); opacity: 0; } }
  .ini-x { position: absolute; right: 6px; top: 6px; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #6b4a24; background: #fff; font: 900 14px sans-serif; color: #6b4a24; cursor: pointer; padding: 0; }
  .ini-dt { font: 900 19px/1.1 'Fredoka', sans-serif; padding-right: 30px; } .ini-dt span { font-size: 24px; margin-right: 4px; }
  .ini-dsub { font: 700 12px/1.25 sans-serif; color: #5b3a12; }
  .ini-opt { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; border: 2px solid #6b4a24; border-radius: 12px; background: linear-gradient(#fffdf4, #f6e7bd); padding: 6px 9px; cursor: pointer; box-shadow: 0 3px 0 #6b4a24; color: #3b2208; font-family: inherit; }
  .ini-opt:active { transform: translateY(2px); box-shadow: 0 1px 0 #6b4a24; }
  .ini-opt > i { font-style: normal; font-size: 24px; width: 30px; text-align: center; flex: none; }
  .ini-opt > span { flex: 1; min-width: 0; } .ini-opt b { display: block; font: 900 14px/1.15 'Fredoka', sans-serif; } .ini-opt small { display: block; font: 700 11px/1.2 sans-serif; color: #6b5330; }
  .ini-opt em { font-style: normal; font-weight: 900; color: #b71c1c; font-size: 15px; }
  .ini-opt.go { background: linear-gradient(#ffe9a8, #ffc84a); } .ini-opt.done { background: linear-gradient(#e6f5d8, #c5e3a8); } .ini-opt.next { outline: 3px solid #ffe066; }
  .ini-opt.off { opacity: 0.55; filter: grayscale(0.6); }
  .ini-note { font: 700 11px/1.3 sans-serif; color: #7a5a22; background: rgba(255,255,255,0.5); border-radius: 8px; padding: 4px 7px; }
  .ini-back { position: absolute; left: 10px; bottom: 36px; z-index: 120; border: 2px solid #ffe082; border-radius: 14px; background: rgba(60,25,12,0.92); color: #ffe9b0; font: 800 12px 'Fredoka', sans-serif; padding: 4px 12px; cursor: pointer; }
  `;
  function css() { if ($('ini-css')) return; const s = document.createElement('style'); s.id = 'ini-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ---------- fondo: suelo, paredes y calle ----------
  function backdrop(tier) {
    let f = '';
    for (let x = 0; x < GW; x++) for (let y = 0; y < GD; y++) {
      const kit = y < 2.5;
      const col = kit ? ((x + y) % 2 ? '#e5e4d2' : '#d9d8c4') : ((x + y) % 2 ? '#d9b383' : '#d1a972');
      f += poly([[sx(x, y), sy(x, y)], [sx(x + 1, y), sy(x + 1, y)], [sx(x + 1, y + 1), sy(x + 1, y + 1)], [sx(x, y + 1), sy(x, y + 1)]], col, 'rgba(110,70,20,0.16)', 0.6);
    }
    const wallC = tier >= 3 ? '#f7e8c6' : '#f1e1bd';
    const wallR = poly([[sx(0, 0), sy(0, 0)], [sx(GW, 0), sy(GW, 0)], [sx(GW, 0), sy(GW, 0, WALL)], [sx(0, 0), sy(0, 0, WALL)]], wallC, '#7a5226', 1.5) + poly(quad(faceY(0, 0, GW, 0, 16), 0, 0, 1, 1), '#b98a55');
    const wallL = poly([[sx(0, 0), sy(0, 0)], [sx(0, GD), sy(0, GD)], [sx(0, GD), sy(0, GD, WALL)], [sx(0, 0), sy(0, 0, WALL)]], '#e8d29f', '#7a5226', 1.5) + poly(quad(faceX(0, 0, GD, 0, 16), 0, 0, 1, 1), '#a97d4a');
    let beams = [0, 3.2, 7.2, 11.2, 15.2, 19.2, GW].map(x => poly(quad(faceY(0, x - 0.12, x + 0.12, 0, WALL), 0, 0, 1, 1), '#8a5a2b')).join('');
    beams += [0, 3.1, 5.9, 8.9, 12].map(y => poly(quad(faceX(0, y - 0.12, y + 0.12, 0, WALL), 0, 0, 1, 1), '#8a5a2b')).join('');
    beams += poly(quad(faceY(0, 0, GW, WALL, WALL + 5), 0, 0, 1, 1), '#6b4a24') + poly(quad(faceX(0, 0, GD, WALL, WALL + 5), 0, 0, 1, 1), '#6b4a24');
    const street = poly([[sx(-3.2, 2.6), sy(-3.2, 2.6)], [sx(0, 2.6), sy(0, 2.6)], [sx(0, 6.6), sy(0, 6.6)], [sx(-3.2, 6.6), sy(-3.2, 6.6)]], '#bdb7a6', '#9d9680', 1)
      + [3.4, 4.4, 5.4, 6.2].map(y => `<path d="M${sx(-3.2, y).toFixed(1)},${sy(-3.2, y).toFixed(1)} L${sx(0, y).toFixed(1)},${sy(0, y).toFixed(1)}" stroke="#a49e8b" stroke-width="0.8"/>`).join('');
    return `<svg class="abs" style="left:0;top:0" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}">${street}${f}${wallR}${wallL}${beams}</svg>`;
  }

  // ---------- objetos fijos del local ----------
  function stoolSvg(x, y) { return layer(`<ellipse cx="${sx(x, y).toFixed(1)}" cy="${sy(x, y, 0).toFixed(1)}" rx="7" ry="3.5" fill="rgba(0,0,0,0.2)"/><path d="M${sx(x, y).toFixed(1)},${sy(x, y, 1).toFixed(1)} V${sy(x, y, 10).toFixed(1)}" stroke="#5d4037" stroke-width="3"/><ellipse cx="${sx(x, y).toFixed(1)}" cy="${sy(x, y, 10).toFixed(1)}" rx="12" ry="6" fill="#c0392b" stroke="#8e2a20" stroke-width="1.2"/>`, dz(x, y, -4)); }
  function bookSvg() { return `<svg viewBox="0 0 38 24" width="38" height="24"><ellipse cx="19" cy="21" rx="16" ry="3" fill="rgba(0,0,0,0.25)"/><path d="M3,9 L19,15 L19,22 L3,16 Z" fill="#fdf6e0" stroke="#7a5226" stroke-width="1"/><path d="M35,9 L19,15 L19,22 L35,16 Z" fill="#f2e6c4" stroke="#7a5226" stroke-width="1"/><path d="M3,9 L19,3 L35,9 L19,15 Z" fill="#fffaf0" stroke="#7a5226" stroke-width="1"/><path d="M8,9 L19,5 M10,11 L19,8 M30,9 L19,5 M28,11 L19,8" stroke="#a89060" stroke-width="0.8"/></svg>`; }
  function bellSvg() { return `<svg viewBox="0 0 38 36" width="38" height="36"><ellipse cx="19" cy="31" rx="15" ry="4" fill="rgba(0,0,0,0.25)"/><ellipse cx="19" cy="28" rx="14" ry="4" fill="#8a6a1c"/><g class="ini-bell"><path d="M5,28 q0,-19 14,-19 q14,0 14,19 Z" fill="#f4c842" stroke="#a37a12" stroke-width="1.3"/><path d="M10,25 q0,-12 8,-14" stroke="#fff6c4" stroke-width="2.2" fill="none" opacity="0.75"/><circle cx="19" cy="7" r="3.4" fill="#d4a62a" stroke="#8a6a1c"/></g></svg>`; }
  function catSvg() { return `<svg viewBox="0 0 34 40" width="34" height="40"><ellipse cx="17" cy="37" rx="12" ry="3" fill="rgba(0,0,0,0.22)"/><path d="M6,34 q-1,-14 4,-17 h14 q5,3 4,17 Z" fill="#fff" stroke="#bbb" stroke-width="1"/><path d="M8,13 l1,-8 l5,5 h6 l5,-5 l1,8 q0,6 -9,6 q-9,0 -9,-6 Z" fill="#fff" stroke="#bbb" stroke-width="1"/><circle cx="13" cy="13" r="1.1" fill="#333"/><circle cx="21" cy="13" r="1.1" fill="#333"/><path d="M15,16 q2,2 4,0" stroke="#c0392b" fill="none" stroke-width="1"/><rect x="11" y="18" width="12" height="3" fill="#c0392b"/><circle cx="17" cy="23" r="3" fill="#f4c842" stroke="#a37a12"/><g class="ini-paw"><rect x="23" y="9" width="5" height="12" rx="2.5" fill="#fff" stroke="#bbb"/></g></svg>`; }
  function plantSvg() { return `<svg viewBox="0 0 30 40" width="30" height="40"><ellipse cx="15" cy="37" rx="10" ry="3" fill="rgba(0,0,0,0.2)"/><path d="M7,28 h16 l-2,9 h-12 Z" fill="#b5651d" stroke="#7a4210"/><path d="M15,28 q-9,-3 -8,-12 q7,0 8,12 Z M15,28 q9,-3 8,-12 q-7,0 -8,12 Z M15,27 q-2,-8 0,-16 q2,8 0,16 Z" fill="#43a047" stroke="#2e7d32" stroke-width="0.8"/></svg>`; }
  function koiSvg(c) { return `<svg viewBox="0 0 60 22" width="60" height="22"><g class="ini-koi"><path d="M2,11 q10,-12 30,-9 q14,2 24,9 q-10,7 -24,9 q-20,3 -30,-9 Z" fill="${c}" stroke="rgba(0,0,0,0.35)"/><circle cx="12" cy="9" r="2" fill="#fff"/><circle cx="12" cy="9" r="1" fill="#222"/><path d="M44,11 q8,-5 14,-8 v16 q-6,-3 -14,-8" fill="rgba(255,255,255,0.4)"/></g></svg>`; }
  function sakuraSvg() { return `<svg viewBox="0 0 70 80" width="70" height="80"><ellipse cx="35" cy="76" rx="22" ry="4" fill="rgba(0,0,0,0.2)"/><path d="M35,76 q-4,-24 2,-40 M37,50 q14,-10 22,-24 M35,56 q-14,-8 -20,-22" stroke="#6b4a2a" stroke-width="5" fill="none" stroke-linecap="round"/><g fill="#f8bbd0" stroke="#ec8fae" stroke-width="0.8"><circle cx="37" cy="30" r="13"/><circle cx="58" cy="22" r="10"/><circle cx="14" cy="28" r="10"/><circle cx="28" cy="16" r="9"/><circle cx="48" cy="12" r="8"/></g></svg>`; }

  function ticketMachine() {                                                  // máquina de tickets de comida (shokkenki) contra la pared izquierda
    const b = [0.25, 9.0, 1.45, 10.2, 0, 42], f = faceX(1.45, 9.0, 10.2, 0, 42);
    let html = boxHtml(b[0], b[1], b[2], b[3], b[4], b[5], { t: '#f08a7c', l: '#d65546', r: '#b53c2f', st: 'rgba(80,20,10,0.6)' }, dz(b[2], b[3], 2));
    let d = poly(quad(f, 0.1, 0.55, 0.9, 0.94), '#2a2f36', '#111', 0.8) + poly(quad(f, 0.16, 0.6, 0.84, 0.9), '#7fd8ff');
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) d += poly(quad(f, 0.15 + c * 0.18, 0.28 + r * 0.12, 0.15 + c * 0.18 + 0.13, 0.28 + r * 0.12 + 0.09), ['#ffd54f', '#ef5350', '#81c784', '#64b5f6'][(r + c) % 4], '#6b3a1a', 0.5);
    d += poly(quad(f, 0.3, 0.06, 0.7, 0.18), '#161616') + poly(quad(f, 0.38, 0.09, 0.62, 0.12), '#fff8e1');
    d += poly(quad(f, 0.04, 0.96, 0.96, 1.0), '#8e2a20');
    return html + layer(d, dz(b[2], b[3], 3));
  }
  function chest() {
    let h = boxHtml(0.55, 6.25, 2.05, 7.65, 0, 11, { t: '#8a5630', l: '#6e4222', r: '#57331a', st: 'rgba(30,15,5,0.6)' }, dz(2.05, 7.65, 1));
    h += boxHtml(0.5, 6.2, 2.1, 7.7, 11, 16, { t: '#a8693a', l: '#8a5329', r: '#6e4020', st: 'rgba(30,15,5,0.6)' }, dz(2.1, 7.7, 2));
    const f = faceX(2.1, 6.2, 7.7, 0, 16);
    h += layer(poly(quad(f, 0.1, 0, 0.2, 1), '#c9a227', '#8a6a1c', 0.8) + poly(quad(f, 0.8, 0, 0.9, 1), '#c9a227', '#8a6a1c', 0.8) + poly(quad(f, 0.42, 0.45, 0.58, 0.85), '#f4c842', '#8a6a1c', 0.8), dz(2.1, 7.7, 3));
    h += bill(1.3, 6.95, 20, 44, 26, `<svg viewBox="0 0 44 26" width="44" height="26"><g stroke="#b8a77a" stroke-width="0.8"><rect x="4" y="9" width="17" height="14" fill="#fffdf2" transform="rotate(-8 12 16)"/><rect x="14" y="4" width="17" height="15" fill="#fff8e4" transform="rotate(5 22 12)"/><rect x="25" y="8" width="16" height="14" fill="#fffdf2" transform="rotate(-3 33 15)"/></g><path d="M9,14 h8 M18,9 h9 M29,13 h8" stroke="#7a6a44" stroke-width="1"/></svg>`, dz(2.1, 7.7, 5));
    return h;
  }
  function pizarra() {
    const f = faceX(0, 0.4, 3.0, 22, 56);
    let d = poly(quad(f, 0, 0, 1, 1), '#7a4a22', '#3e2410', 1.2) + poly(quad(f, 0.05, 0.07, 0.95, 0.93), '#23413a', '#10231f', 0.8);
    [0.62, 0.45, 0.28].forEach((v, i) => { d += poly(quad(f, 0.14, v, 0.24, v + 0.1), ['#ffd54f', '#cfd8dc', '#d08c4a'][i]) + poly(quad(f, 0.3, v + 0.03, 0.3 + [0.55, 0.45, 0.35][i], v + 0.07), 'rgba(255,255,255,0.8)'); });
    d += wallText('x', 1.7, 0, 53.5, 'ランキング', 7, '#fff3c4');
    return layer(d, 6);
  }
  function knives(n) {                                                       // cuchillos exhibidos: uno más por cada tramo de mejoras compradas
    const f = faceX(0, 6.0, 8.6, 28, 56), th = [1, 2, 4, 7, 10, 14];
    let d = poly(quad(f, 0, 0, 1, 1), '#8a5a2b', '#3e2410', 1.2) + poly(quad(f, 0.04, 0.06, 0.96, 0.94), '#4a2f18');
    th.forEach((t, i) => {
      const u = 0.1 + i * 0.16, own = n >= t, o = own ? 1 : 0.28;
      d += `<g opacity="${o}">` + poly([f(u - 0.025, 0.6), f(u + 0.045, 0.62), f(u + 0.02, 0.9), f(u - 0.01, 0.9)], own ? '#e8eef2' : '#b0bec5', '#78909c', 0.6) + poly(quad(f, u - 0.02, 0.18, u + 0.035, 0.6), own ? (i > 3 ? '#c9a227' : '#5d3a1a') : '#6a5848', '#2a170a', 0.6) + '</g>';
    });
    return layer(d, 6);
  }
  function door() {
    const f = faceX(0, 3.3, 5.8, 0, 54);
    let d = poly(quad(f, 0, 0, 1, 1), '#7a5226', '#3e2410', 1.2) + poly(quad(f, 0.06, 0, 0.5, 0.9), '#cfeaf3', '#7a5226', 1) + poly(quad(f, 0.5, 0, 0.94, 0.9), '#bfe0ee', '#7a5226', 1);
    d += poly(quad(f, 0.06, 0.45, 0.5, 0.9), 'rgba(255,255,255,0.35)');
    d += wallText('x', 4.55, 0, 52, '出入口', 5.2, '#fff3c4');
    return layer(d, 6) + bill(0.4, 4.6, 36, 46, 50, `<div class="jp-noren"><svg width="46" height="50" viewBox="0 0 44 52"><rect x="0" y="0" width="44" height="5" fill="#6b4a24"/><path d="M2,5 h12 v40 h-12 Z M16,5 h12 v44 h-12 Z M30,5 h12 v40 h-12 Z" fill="#2f4a8a" stroke="#1c2f5e" stroke-width="1"/><circle cx="22" cy="24" r="5" fill="none" stroke="#fff" stroke-width="1.6"/></svg></div>`, dz(0.4, 4.6, 6));
  }
  function areaBoards() {
    return AREAS.map(a => { const f = faceY(0, a.x[0] + 0.5, a.x[1] - 0.5, 40, 62); return layer(poly(quad(f, 0, 0, 1, 1), '#5b3a1c', '#c9a227', 1.6) + poly(quad(f, 0.05, 0.08, 0.95, 0.92), '#7a4a22') + wallText('y', (a.x[0] + a.x[1]) / 2, 0, 46.5, a.kj, 13, '#ffe9a8'), 4); }).join('');
  }
  function depo() {
    let h = boxHtml(0.5, 0.1, 3.1, 1.0, 0, 44, { t: '#d6b27a', l: '#b98a4f', r: '#9a7038' }, dz(3.1, 1.0, 0));
    [[0.65, 7, '#7cb342'], [1.65, 7, '#ef5350'], [2.2, 7, '#ff9800'], [0.9, 28, '#c8a26a'], [2.0, 28, '#a67c52']].forEach(([x, z0, col]) => { h += boxHtml(x, 0.22, x + 0.7, 0.9, z0, z0 + 12, { t: col, l: col, r: col, st: 'rgba(0,0,0,0.4)' }, dz(x + 0.7, 1.0, 3)); });
    h += bill(1.8, 1.6, 0, 30, 36, `<svg viewBox="0 0 30 36" width="30" height="36"><ellipse cx="15" cy="32" rx="12" ry="3" fill="rgba(0,0,0,0.2)"/><path d="M5,14 q10,-6 20,0 l2,18 h-24 Z" fill="#d9c08a" stroke="#8a6a3a"/><path d="M9,18 h12" stroke="#8a6a3a"/></svg>`, dz(1.8, 1.6, 2));
    return h;
  }
  function room(tier) {
    const x0 = 14.0, x1 = 19.9, y0 = 6.4, y1 = 11.8;
    let h = boxHtml(x0, y0, x1, y1, 0, 3, { t: '#a9c27a', l: '#7f9a54', r: '#6c8546', st: 'rgba(60,80,30,0.6)' }, 3);
    let t = '';
    for (let i = 1; i < 6; i++) t += `<path d="M${sx(x0 + (x1 - x0) * i / 6, y0).toFixed(1)},${sy(x0 + (x1 - x0) * i / 6, y0, 3).toFixed(1)} L${sx(x0 + (x1 - x0) * i / 6, y1).toFixed(1)},${sy(x0 + (x1 - x0) * i / 6, y1, 3).toFixed(1)}" stroke="rgba(255,255,255,0.28)" stroke-width="1"/>`;
    h += layer(t, 4);
    const shoji = (f, nu, nv) => { let d = poly(quad(f, 0, 0, 1, 1), 'rgba(252,247,228,0.96)', '#6b4a24', 1.6); for (let i = 1; i < nu; i++) d += `<path d="M${f(i / nu, 0).join(',')} L${f(i / nu, 1).join(',')}" stroke="#8a6330" stroke-width="1.1"/>`; for (let j = 1; j < nv; j++) d += `<path d="M${f(0, j / nv).join(',')} L${f(1, j / nv).join(',')}" stroke="#8a6330" stroke-width="1.1"/>`; return d; };
    h += layer(shoji(faceX(x0, y0, y1, 3, 42), 6, 3) + shoji(faceY(y0, x0, x1, 3, 42), 6, 3) + poly(quad(faceY(y0, x0 + 1.2, x1 - 1.2, 44, 54), 0, 0, 1, 1), '#5b3a1c', '#c9a227', 1.4) + wallText('y', (x0 + x1) / 2, 0, 46.5, '個室', 9, '#ffe9a8'), dz(x0, y0, 0) + 2);
    h += boxHtml(16.3, 8.4, 17.9, 9.6, 3, 10, TABLEC, dz(17.9, 9.6, -2));
    h += bill(17.1, 9.0, 11, 22, 16, '<div style="font-size:15px;text-align:center">🍶</div>', dz(17.1, 9.0, 6));
    [[15.3, 9.0], [18.9, 9.0], [17.1, 7.6], [17.1, 10.6]].forEach(([x, y]) => { h += layer(`<ellipse cx="${sx(x, y).toFixed(1)}" cy="${sy(x, y, 3).toFixed(1)}" rx="12" ry="6" fill="#7e57c2" stroke="#4a2c8a" stroke-width="1.2"/>`, dz(x, y, -6)); });
    h += lamp(15.2, 6.5, 50) + lamp(19.0, 6.5, 50);
    return h;
  }
  function tables() {
    let h = '';
    TABLES.forEach(([tx, ty]) => {
      h += [[tx, ty - 1.15], [tx, ty + 1.15]].map(([qx, qy]) => layer(`<ellipse cx="${sx(qx, qy).toFixed(1)}" cy="${sy(qx, qy, 2).toFixed(1)}" rx="13" ry="6.5" fill="#c0392b" stroke="#8e2a20" stroke-width="1.2"/>`, dz(qx, qy, -3))).join('');
      h += boxHtml(tx - 0.9, ty - 0.6, tx + 0.9, ty + 0.6, 0, 11, TABLEC, dz(tx + 0.9, ty + 0.6, -1));
      h += bill(tx, ty, 11, 20, 16, '<div style="font-size:14px;text-align:center">🍜</div>', dz(tx, ty, 4));
    });
    return h;
  }

  // ---------- construcción de la escena ----------
  function build() {
    const L = S.layers, tier = S.tier = tierOf(), fl = flags();
    const lit = {}; AREAS.forEach(a => { lit[a.id] = areaLit(a.id); });
    S.lit = lit; S.first = firstTime();
    L.bg.innerHTML = backdrop(tier);
    let h = '';
    h += pizarra() + knives(upgradesTotal()) + door() + areaBoards() + ticketMachine();
    [[4.2, 0.25, 58], [11.2, 0.25, 58], [16.4, 0.25, 58]].forEach(p => { h += lamp(p[0], p[1], p[2]); });
    if (tier >= 1) h += lamp(0.25, 10.9, 58) + lamp(0.25, 2.9, 58);
    if (tier >= 2) h += lamp(8.4, 0.25, 58) + lamp(13.6, 0.25, 58);
    h += depo();
    AREAS.forEach(a => {
      const [x0, x1] = a.x, cx = (x0 + x1) / 2;
      for (let x = x0; x < x1 - 0.01; x += 1.0) h += boxHtml(x, 1.05, Math.min(x1, x + 1.0), 1.85, 0, 20, WOODC, dz(Math.min(x1, x + 1.0), 1.85, 2));
      h += bill(cx, 1.42, 20, 80, 60, EQUIP[a.id], dz(x1, 1.85, 3));
      if (!lit[a.id]) h += layer(poly(boxHull([x0, 0.3, x1, 2.1, 0, 34]), 'rgba(15,10,40,0.34)'), dz(x1, 2.1, 6));
    });
    // barra con timbre, libro y gato de la suerte
    h += boxHtml(5.2, 3.4, 17.8, 4.25, 0, 20, { t: tier >= 3 ? '#c9a227' : '#a06a3a', l: '#7d4f27', r: '#63401f', st: 'rgba(40,20,5,0.6)' }, dz(17.8, 4.25, 0));
    h += layer(poly(quad(faceY(4.25, 5.2, 17.8, 1, 17), 0, 0, 1, 1), '#b71c1c', '#7a1212', 0.8) + [0, 1, 2, 3, 4, 5, 6].map(i => poly(quad(faceY(4.25, 5.2, 17.8, 1, 17), (i + 0.3) / 7, 0.2, (i + 0.7) / 7, 0.8), 'rgba(255,255,255,0.18)')).join(''), dz(17.8, 4.25, 1));
    h += bill(10.6, 3.8, 20, 38, 36, bellSvg(), dz(10.6, 3.8, 8)) + bill(12.8, 3.8, 20, 38, 24, bookSvg(), dz(12.8, 3.8, 8));
    h += bill(6.0, 3.8, 20, 34, 40, catSvg(), dz(6.0, 3.8, 8));
    STOOLS.forEach(([x, y]) => { h += stoolSvg(x, y); });
    h += tables() + room(tier) + chest();
    // caja
    h += boxHtml(0.4, 10.4, 2.0, 11.8, 0, 18, WOODC, dz(2.0, 11.8, 0)) + bill(1.1, 11.1, 18, 40, 30, `<svg viewBox="0 0 40 30" width="40" height="30"><rect x="6" y="8" width="28" height="18" rx="3" fill="#78909c" stroke="#37474f" stroke-width="1.4"/><rect x="9" y="11" width="22" height="9" rx="2" fill="#b3e5fc"/><text x="20" y="18.6" font-size="8" text-anchor="middle" fill="#01579b" font-weight="800">¥</text></svg>`, dz(2.0, 11.8, 4)) + bill(1.6, 10.8, 18, 30, 20, bookSvg(), dz(2.0, 11.8, 5));
    // decoración que crece con el rango del local
    if (tier >= 1) { h += bill(4.2, 5.7, 0, 30, 40, plantSvg(), dz(4.2, 5.7)) + bill(19.2, 4.6, 0, 30, 40, plantSvg(), dz(19.2, 4.6)) + bill(3.0, 11.4, 0, 30, 40, plantSvg(), dz(3.0, 11.4)); }
    if (tier >= 3) h += bill(19.0, 4.8, 0, 70, 80, sakuraSvg(), dz(19.0, 4.8));
    if (tier >= 4) h += bill(7.0, 0.3, 66, 60, 22, koiSvg('#ef5350'), 9) + bill(11.0, 0.3, 62, 60, 22, koiSvg('#42a5f5'), 9) + bill(15.0, 0.3, 66, 60, 22, koiSvg('#ffb300'), 9);
    L.st.innerHTML = h;
    // pins
    const pins = Object.entries(ZONES).map(([id, z]) => {
      const dim = (z.area && !lit[id]) || (S.first && id !== FIRST_ZONE);
      const hint = '';
      return `<div class="ini-pin ${dim ? 'dim' : ''} ${S.first && id === FIRST_ZONE ? 'glow' : ''} ${cam.focus && cam.focus.z === id ? 'focus' : ''}" data-z="${id}" style="left:${sx(z.pin[0], z.pin[1]).toFixed(1)}px;top:${sy(z.pin[0], z.pin[1], z.pin[2]).toFixed(1)}px">${z.i} ${z.n}${z.s ? `<small>${z.s}</small>` : ''}${hint}</div>`;
    }).join('');
    const mz = ZONES[FIRST_ZONE];
    L.ui.innerHTML = pins + (S.first ? `<div class="ini-ring" style="left:${sx(3.6, 3.3).toFixed(1)}px;top:${sy(3.6, 3.3).toFixed(1)}px"></div><div class="ini-start" style="left:${sx(2.9, 4.2).toFixed(1)}px;top:${sy(2.9, 4.2).toFixed(1)}px">👆 ¡Empieza aquí!</div>` : '');
    // zonas tocables (casco del objeto + etiqueta)
    S.shapes = [];
    Object.entries(ZONES).forEach(([id, z]) => {
      z.boxes.forEach(b => S.shapes.push({ z: id, p: boxHull(b) }));
      const el = L.ui.querySelector(`.ini-pin[data-z="${id}"]`);
      if (el) { const w = el.offsetWidth, hh = el.offsetHeight, l = el.offsetLeft - w / 2, t = el.offsetTop - hh; S.shapes.push({ z: id, p: [[l, t], [l + w, t], [l + w, t + hh], [l, t + hh]] }); }
    });
    S.shapes.forEach(s => { s.a = polyArea(s.p); });
    // personas
    buildPeople(lit);
    S.sig = infoSig();
    applyTint();
  }

  // ---------- personas ----------
  // Arte final por sprites (si el archivo no carga, se queda la figura vectorial provisional)
  const SPR = { cook_ramen: { url: 'assets/people/cook_ramen_v1.webp', ok: false } };
  let sprDirty = false;
  Object.values(SPR).forEach(sp => { const im = new Image(); im.onload = () => { sp.ok = true; sprDirty = true; }; im.src = sp.url; });
  /** Cambia la figura vectorial de una persona por su sprite. @param {object} e entidad de la escena @param {string} key clave en SPR */
  function useSprite(e, key) {
    const sp = SPR[key]; if (!sp || !sp.ok) return;
    const fl = e.el.querySelector('.fl'); if (fl) fl.style.display = 'none';
    const d = document.createElement('div'); d.className = 'ini-sp'; d.style.backgroundImage = 'url(' + sp.url + ')'; e.el.appendChild(d); e.sprite = true;
  }
  function place(e, x, y) { e.x = x; e.y = y; e.el.style.transform = `translate(${(sx(x, y) - 14).toFixed(1)}px, ${(sy(x, y) - 54 - (e.lift || 0)).toFixed(1)}px)`; e.el.style.zIndex = dz(x, y, e.zoff || 0); }
  function addEnt(role, x, y, opt) {
    const el = mkPerson(role, opt); S.layers.ents.appendChild(el);
    const e = { el, x, y, path: [], speed: 1.5, role, done: null, zoff: 0, lift: 0 }; place(e, x, y); S.ents.push(e); return e;
  }
  function removeEnt(e) { if (e.el.parentNode) e.el.parentNode.removeChild(e.el); S.ents = S.ents.filter(x => x !== e); }
  function goPath(e, pts, done) { e.path = pts.slice(); e.done = done || null; e.el.classList.add('walk'); e.el.classList.remove('work', 'sit', 'chat', 'eat'); e.lift = 0; e.zoff = 0; }
  function stand(e, work) { e.el.classList.remove('walk'); if (work) e.el.classList.add('work'); }
  function sit(e, x, y, lift, zoff) { e.el.classList.remove('walk'); e.el.classList.add('sit', 'chat'); e.lift = lift || 0; e.zoff = zoff || 0; place(e, x, y); }
  function say(x, y, z, html, cls) { const b = document.createElement('div'); b.className = 'jp-bub ' + (cls || ''); b.innerHTML = html; b.style.left = sx(x, y) + 'px'; b.style.top = (sy(x, y, z) - 70) + 'px'; b.style.zIndex = 8800; S.layers.fx.appendChild(b); return b; }
  function buildPeople(lit) {
    S.ents.slice().forEach(removeEnt);
    S.ents = []; S.cooks = []; S.waiters = []; S.guests = []; S.cleaner = null; S.layers.fx.innerHTML = '';
    S.stoolBusy = STOOLS.map(() => null);
    AREAS.forEach((a, i) => {
      if (!lit[a.id]) return;
      const cx = (a.x[0] + a.x[1]) / 2;
      [0].forEach((dx, k) => {
        const e = addEnt('cook', cx + dx, 0.55, { lvl: 0, band: LV[Math.min(4, i + 1)], cloth: ['#37474f', '#5d4037', '#455a64', '#4e342e'][i % 4] });
        e.el.classList.add('work'); e.el.style.setProperty('--wk', (0.8 + 0.15 * i).toFixed(2) + 's'); e.el.style.animationDelay = (k * 0.2) + 's'; e.home = [e.x, e.y]; e.area = a.id; e.t = rnd(4, 9); S.cooks.push(e);
        if (a.id === 'ramen') useSprite(e, 'cook_ramen');
      });
    });
    const dep = addEnt('depo', 1.9, 1.7, {}); stand(dep, true); dep.home = [1.9, 1.7]; S.cooks.push(dep); dep.t = rnd(5, 9); dep.area = 'depo';
    for (let i = 0; i < 2; i++) { const w = addEnt('waiter', 5.0 + i * 8, 2.6, { lvl: 0 }); w.speed = 1.7; w.home = [5.0 + i * 8, 2.6]; w.state = 'idle'; w.wait = rnd(0.5, 2); S.waiters.push(w); }
    const ck = addEnt('cash', 2.7, 11.1, {}); stand(ck, true); ck.el.style.setProperty('--wk', '0.9s');
    const sen = addEnt('cust', 3.6, 3.3, { cloth: '#37474f', hair: '#e0e0e0', skin: '#efc29b' }); sen.el.classList.add('chat');
    const cap = document.createElement('div'); cap.className = 'ini-cap'; cap.textContent = '🎓'; sen.el.appendChild(cap); sen.zoff = 6; place(sen, 3.6, 3.3);
    S.sensei = sen;
    // sala privada: gente conversando
    [[15.3, 9.0], [18.9, 9.0], [17.1, 7.6], [17.1, 10.6]].forEach(([x, y], i) => { const e = addEnt('cust', x, y, {}); sit(e, x, y, 3, y < 9 ? -8 : 6); e.el.style.animationDelay = (i * 0.3) + 's'; if (i === 2) e.flipTo = true; });
    // clientes en las mesas del salón
    TABLES.forEach(([tx, ty], i) => [[tx, ty - 1.15], [tx, ty + 1.15]].forEach(([x, y], k) => { if ((i + k) % 3 === 2) return; const e = addEnt('cust', x, y, {}); sit(e, x, y, 0, y < ty ? -4 : 4); if ((i + k) % 2) { e.el.classList.remove('chat'); e.el.classList.add('eat'); } }));
    const cl = addEnt('clean', 4.0, 7.0, {}); cl.speed = 1.3; S.cleaner = cl; cl.t = rnd(1, 3);
    // clientes de la barra al azar
    S.spawn = 0.2; S.guestsWanted = 4;
    STOOLS.forEach((st, i) => { if (Math.random() < 0.55 && S.guests.length < 4) seatGuest(i, true); });
    S.sensei.noRelease = true;
  }
  function seatGuest(i, instant) {
    const [x, y] = STOOLS[i], e = addEnt('cust', instant ? x : DOOR[0], instant ? y : DOOR[1] + rnd(-0.3, 0.3), {});
    e.stool = i; e.state = 'walkin'; e.speed = 1.7 + rnd(0, 0.4); S.stoolBusy[i] = e; S.guests.push(e);
    const arrive = () => { sit(e, x, y, 7, -2); e.state = 'wait'; e.want = pick(AREAS.filter(a => S.lit[a.id])).id; e.bub = say(x, y, 8, AREA[e.want].i, ''); };
    if (instant) arrive(); else goPath(e, [[2.4, 4.6], [x - 0.2, 6.2], [x, y + 0.9], [x, y]], arrive);
  }
  function leaveGuest(e) {
    if (e.bub) { e.bub.remove(); e.bub = null; }
    e.state = 'leave'; e.speed = 1.9; goPath(e, [[e.x, 6.1], [2.4, 4.8], [DOOR[0] - 1.2, DOOR[1]]], () => { e.gone = true; });
    S.stoolBusy[e.stool] = null; S.guests = S.guests.filter(g => g !== e);
  }
  function tickPeople(dt) {
    for (const e of S.ents) {
      if (e.path && e.path.length) {
        const [tx, ty] = e.path[0], dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), st = e.speed * dt;
        if (d <= st) { e.x = tx; e.y = ty; e.path.shift(); if (!e.path.length) { place(e, e.x, e.y); const f = e.done; e.done = null; if (f) f(); continue; } }
        else { e.x += dx / d * st; e.y += dy / d * st; const sd = dx - dy; if (Math.abs(sd) > 0.05) e.el.classList.toggle('flip', sd < 0); e.el.classList.toggle('up', dx + dy < 0); }
        place(e, e.x, e.y);
      }
    }
    S.ents.filter(e => e.gone).forEach(removeEnt);
    // clientes de la barra: entran, esperan, comen, pagan y se van
    S.spawn -= dt;
    if (S.spawn <= 0) {
      S.spawn = rnd(3.5, 7);
      const free = STOOLS.map((_, i) => i).filter(i => !S.stoolBusy[i]);
      if (free.length && S.guests.length < 5 && Object.values(S.lit).some(Boolean)) seatGuest(pick(free), false);
    }
    for (const g of S.guests.slice()) {
      if (g.state === 'eat') { g.t -= dt; if (g.t <= 0) { const h = say(g.x, g.y, 8, '😊', 'green'); setTimeout(() => h.remove(), 900); leaveGuest(g); } }
    }
    // mozos: llevan platos de la cocina a la barra
    for (const w of S.waiters) {
      if (w.state === 'idle') {
        w.wait -= dt; if (w.wait > 0) continue;
        const g = S.guests.find(q => q.state === 'wait' && !q.waiter);
        if (g) {
          g.waiter = w; w.state = 'go'; const a = AREA[g.want], cx = (a.x[0] + a.x[1]) / 2;
          goPath(w, [[cx, 2.6]], () => {
            stand(w, false); w.state = 'take'; const ck = S.cooks.find(c => c.area === g.want); if (ck) ck.el.classList.add('work');
            setTimeout(() => {
              if (!S || !g.el.parentNode) { w.state = 'idle'; return; }
              const tray = document.createElement('div'); tray.className = 'jp-tray'; tray.textContent = a.i; w.el.appendChild(tray);
              goPath(w, [[g.x, 2.6]], () => {
                tray.remove(); stand(w, false); if (g.bub) { g.bub.remove(); g.bub = null; }
                g.state = 'eat'; g.t = rnd(9, 18); g.el.classList.remove('chat'); g.el.classList.add('eat'); g.bub = say(g.x, g.y, 8, '😋', 'green'); setTimeout(() => { if (g.bub) { g.bub.remove(); g.bub = null; } }, 1600);
                goPath(w, [w.home], () => { stand(w, false); w.state = 'idle'; w.wait = rnd(0.8, 2.5); });
              });
            }, 900);
          });
        } else { w.wait = rnd(1.5, 3); w.state = 'wipe'; w.el.classList.add('work'); setTimeout(() => { if (S && w.state === 'wipe') { w.el.classList.remove('work'); w.state = 'idle'; } }, 1800); }
      }
    }
    // cocineros: de vez en cuando traen ingredientes de la despensa
    for (const c of S.cooks) {
      if (c.path && c.path.length) continue;
      c.t -= dt;
      if (c.t <= 0 && c.area !== 'depo') {
        c.t = rnd(9, 16); const box = document.createElement('div'); box.className = 'jp-tray'; box.textContent = pick(['🥬', '🍚', '📦', '🥩']);
        goPath(c, [[3.0, 0.55]], () => { c.el.appendChild(box); c.el.classList.add('work'); c.el.classList.remove('walk'); setTimeout(() => { if (!S) return; goPath(c, [c.home], () => { box.remove(); c.el.classList.add('work'); c.el.classList.remove('walk'); }); }, 900); });
      } else if (c.t <= 0) { c.t = rnd(6, 11); const box = document.createElement('div'); box.className = 'jp-tray'; box.textContent = '📦'; goPath(c, [[3.3, 2.5]], () => { c.el.appendChild(box); setTimeout(() => { if (!S) return; goPath(c, [c.home], () => { box.remove(); stand(c, true); }); }, 700); }); }
    }
    // limpieza del salón
    const cl = S.cleaner;
    if (cl && !(cl.path && cl.path.length)) {
      cl.t -= dt;
      if (cl.t <= 0) { cl.t = rnd(2, 4); const t = pick(TABLES); goPath(cl, [[t[0] - 1.8, t[1] + 0.2]], () => { cl.el.classList.add('work'); cl.el.classList.remove('walk'); setTimeout(() => { if (S) cl.el.classList.remove('work'); }, 1400); }); }
    }
  }

  // ---------- cielo (luz según la hora del dispositivo) ----------
  function applyTint() {
    if (!S) return; const h = new Date().getHours();
    S.tint.style.background = h >= 21 || h < 5 ? '#a8b2dc' : (h >= 19 || h < 7 ? '#f0cda8' : (h >= 17 ? '#f8e6cc' : 'transparent'));
  }

  // ---------- cámara ----------
  const vsize = () => ({ w: S.view.clientWidth || 800, h: S.view.clientHeight || 300 });
  function applyCam(anim) { S.world.style.setProperty('--pinS', Math.min(1, Math.pow(cam.fit / cam.s, 0.7)).toFixed(3)); S.world.classList.toggle('anim', !!anim); S.world.style.transform = `translate(${cam.tx.toFixed(1)}px, ${cam.ty.toFixed(1)}px) scale(${cam.s.toFixed(4)})`; }
  function fit(anim) {
    const { w, h } = vsize(); S.vw = w; S.vh = h;
    const top = Math.min(30, h * 0.08);                       // la barra superior (audio, propinas, perfil) tapa los primeros píxeles
    cam.fit = Math.min(w / WW, (h - top - 4) / (WH - 8)); cam.s = cam.fit; cam.focus = null;
    cam.tx = (w - WW * cam.s) / 2; cam.ty = top - 8 * cam.s; applyCam(anim);
  }
  function focusOn(id, anim) {
    const z = ZONES[id]; if (!z) return fit(anim); const { w, h } = vsize(), f = z.foc, dock = Math.min(300, w * 0.4) + 6;
    const s = cam.fit * f[3] * 0.62, cx = sx(f[0], f[1]), cy = sy(f[0], f[1], f[2]);
    cam.s = s; cam.tx = (w - dock) / 2 - cx * s; cam.ty = h / 2 - cy * s; cam.focus = { z: id }; applyCam(anim !== false);
  }
  function worldPt(cx, cy) { const r = S.view.getBoundingClientRect(); return [(cx - r.left - cam.tx) / cam.s, (cy - r.top - cam.ty) / cam.s]; }
  function hitZone(wx, wy) {
    let best = null;
    for (const s of S.shapes) if (inPoly(wx, wy, s.p) && (!best || s.a < best.a)) best = s;
    return best ? best.z : null;
  }

  // ---------- panel lateral ----------
  const opt = (cls, ico, title, sub, act, arg, arrow) => `<button class="ini-opt ${cls || ''}" ${cls && cls.includes('off') && !act ? 'disabled' : ''} onclick="Inicio.act('${act}'${arg != null ? `,'${arg}'` : ''})"><i>${ico}</i><span><b>${title}</b><small>${sub}</small></span><em>${arrow == null ? '▶' : arrow}</em></button>`;
  function panel(id) {
    const z = ZONES[id], fl = flags(); let sub = '', body = '';
    if (z.area) {
      const a = AREA[id], lit = areaLit(id), list = (() => { try { return TRAINING_CHALLENGES.filter(c => c.ch === a.ch); } catch (e) { return []; } })();
      const dn = list.filter(c => { try { return (trainingProgressOf(c.id) || {}).m > 0; } catch (e) { return false; } }).length;
      let open = true; try { open = !list.length || trainingIsOpen(list[0]); } catch (e) {}
      sub = lit ? 'Tu estación de ' + a.n.toLowerCase() + '.' : 'Esta cocina aún está apagada: aprende y supera los retos para encenderla.';
      body += opt(fl[a.les] ? 'done' : 'go', '🎓', 'Lección de ' + a.n, fl[a.les] ? '✓ Hecha · puedes repetirla' : 'Paso a paso · primera vez +' + a.reward + ' 🧧', 'lesson', a.les);
      body += opt(open ? '' : 'off', '🏋️', 'Entrenamiento', open ? `Retos de ${a.n}: ${dn}/${list.length}` : '🔒 Supera antes los retos anteriores', open ? 'train' : '', a.ch, open ? '▶' : '🔒');
      body += opt('', '🌿', 'Cocina libre', 'Practica solo ' + a.n + ', sin reloj ni notas', 'free', a.id);
    } else if (id === 'timbre') {
      const ok = tutDone();
      sub = ok ? 'Toca el timbre y empieza el servicio.' : 'Primero haz la lección de Ramen con el Maestro.';
      body += opt(ok ? 'go' : 'off', '▶️', 'Campaña', ok ? 'Niveles con meta de ventas y tiempo' : '🔒 Bloqueado hasta la lección de Ramen', 'camp', '', ok ? '▶' : '🔒');
      body += opt(ok ? 'go' : 'off', '⚡', 'Rash', ok ? 'Rondas sin fin · vas por la ronda ' + rashLvl() : '🔒 Bloqueado hasta la lección de Ramen', 'rash', '', ok ? '▶' : '🔒');
    } else if (id === 'maestro') {
      const nxt = ORDER_LES.find(k => !fl[k]);
      sub = firstTime() ? '¡Empieza aquí! La primera lección es la de Ramen.' : `Lecciones ${ORDER_LES.filter(k => fl[k]).length}/4 · cada una da propinas la primera vez.`;
      ORDER_LES.forEach(k => { const a = AREA[k]; body += opt(fl[k] ? 'done' : (k === nxt ? 'next go' : ''), LES_ICON[k], 'Lección de ' + LES_NAME[k], fl[k] ? '✓ Hecha · repetir' : '+' + a.reward + ' 🧧 la primera vez', 'lesson', k); });
    } else if (id === 'tickets') {
      sub = 'Elige tu reto en la máquina: los 27 retos, de fáciles a maestros.';
      body += opt('go', '🎫', 'Lista de retos', `Completados ${retosHechos()}/27 · medallas y propinas`, 'tickets');
    } else if (id === 'caja') {
      sub = 'La caja y el libro de cuentas.';
      body += opt('', '🔐', 'Cuenta', 'Tu clave, perfil y nube ☁️', 'acct') + opt('', '📊', 'Mis estadísticas', 'Platos, tiempos y récords', 'stats') + opt('', '🍱', 'Ordenar ingredientes', 'Cambia el orden de tu despensa', 'order');
    } else {
      const M = {
        libro: ['Consulta ingredientes y recetas de todos los platos.', '📖', 'Abrir el Recetario', 'Ingredientes, pasos y precios', 'book'],
        pizarra: ['Los mejores chefs del mundo.', '🏆', 'Ver el Ranking', 'Clasificación y tus récords', 'board'],
        baul: ['Un baúl antiguo lleno de papeles con trucos de cocina.', '✨', 'Leer los Secretos del Chef', 'Consejos para mejorar tus platos', 'chest'],
        cuchillos: ['Cada mejora que compras añade un cuchillo nuevo a la pared.', '🧧', 'Tienda de mejoras', `Tienes ${(() => { try { return getPropinasWallet(); } catch (e) { return 0; } })()} 🧧 propinas`, 'knives'],
        depo: ['Memoriza qué lleva cada plato, sin reloj en contra.', '🔍', 'Modo Ingredientes', 'Mide cuánto tardas en reconocerlos', 'pantry'],
        puerta: ['Sal a recorrer Japón y haz crecer tus restaurantes.', '🗾', 'Recorrido por Japón', 'Restaurantes que generan ¥ y mejoras permanentes', 'door'],
        sala: ['Una sala reservada: juega con amigos en línea.', '👥', 'Multijugador', 'Crea o únete a una sala', 'room']
      }[id];
      sub = M[0]; body = opt('go', M[1], M[2], M[3], M[4]);
    }
    return `<button class="ini-x" onclick="Inicio.close()" aria-label="Cerrar">✕</button><div class="ini-dt"><span>${z.i}</span>${id === 'sala' ? 'Sala privada' : (z.n === 'Servicio' ? 'Timbre de cocina' : z.n)}</div><div class="ini-dsub">${sub}</div>${body}`;
  }
  function gearPanel() {
    const ver = (() => { const v = $('app-version'); return v ? v.textContent : ''; })();
    return `<button class="ini-x" onclick="Inicio.close()" aria-label="Cerrar">✕</button><div class="ini-dt"><span>⚙️</span>Ajustes</div>
      ${opt('', '🔊', 'Sonido', 'Activar o silenciar efectos', 'sound')}${opt('', '⛶', 'Pantalla completa', 'Atajo: F', 'full')}${opt('', '📋', 'Menú clásico', 'Vuelve a la lista de botones de antes', 'classic')}
      ${opt('', '🔄', 'Actualizar juego', 'Descarga la última versión ' + ver, 'update')}${opt('', '⌨️', 'Atajos de teclado', '', 'keys')}${opt('', '🛡️', 'Dispositivo', 'Identificador para vincular récords', 'device')}`;
  }
  function openPanel(html) { S.dock.innerHTML = html; S.dock.classList.add('open'); S.dock.scrollTop = 0; S.wrap.classList.add('focus'); }
  function closePanel() { if (!S) return; S.dock.classList.remove('open'); S.wrap.classList.remove('focus'); S.layers.ui.querySelectorAll('.ini-pin.focus').forEach(p => p.classList.remove('focus')); }
  function openZone(id) {
    try { playSound('add'); } catch (e) {}
    S.layers.ui.querySelectorAll('.ini-pin.focus').forEach(p => p.classList.remove('focus'));
    const p = S.layers.ui.querySelector(`.ini-pin[data-z="${id}"]`); if (p) p.classList.add('focus');
    focusOn(id, true); openPanel(panel(id));
  }
  function closeZone() { closePanel(); fit(true); }

  // ---------- acciones ----------
  const ACT = {
    lesson: k => Guia.start(k),
    train: ch => openTrainingModal(null, [ch]),
    tickets: () => openTrainingModal(),
    free: a => { window.startFreeAreas = [a]; setStartSelectedMode('FREE'); handleStartPlayClick(); },
    camp: () => { setStartSelectedMode('NORMAL'); if (startSelectedMode === 'NORMAL') handleStartPlayClick(); },
    rash: () => { setStartSelectedMode('RASH'); if (startSelectedMode === 'RASH') handleStartPlayClick(); },
    book: () => openRecipeModal(), board: () => openLeaderboardModal(), chest: () => openSecretosModal(), knives: () => openUpgradesModal(),
    pantry: () => reconOpen(), door: () => japonOpen(), room: () => MultiplayerManager.openLobbyModal(),
    acct: () => openAccountModal(), stats: () => openStatsModal(), order: () => openIngredientOrderModal(),
    sound: () => toggleAudioMute(), full: () => toggleFullScreen(), keys: () => openShortcutsModal(), update: () => forceAppCacheUpdate(), device: () => showDeviceInfoModal(),
    classic: () => Inicio.setView('classic')
  };

  // ---------- montaje ----------
  function updatePlay() {
    const b = S && S.play; if (!b) return; const m = (typeof startSelectedMode !== 'undefined' && startSelectedMode) || 'NORMAL';
    b.innerHTML = `▶ JUGAR<small>${firstTime() ? 'Lección de Ramen' : (MODE_NAME[m] || 'Campaña')}</small>`;
  }
  function measure() { S.wrap.style.top = '0px'; S.wrap.style.bottom = '0px'; }
  function create() {
    css(); K.css();
    const sc = $('start-screen'); if (!sc) return false;
    const wrap = document.createElement('div'); wrap.className = 'ini-wrap';
    const view = document.createElement('div'); view.className = 'ini-view'; wrap.appendChild(view);
    const world = document.createElement('div'); world.className = 'jp-world'; view.appendChild(world);
    const mk = (n, zi) => { const d = document.createElement('div'); d.className = 'abs'; d.style.cssText = `left:0;top:0;width:${WW}px;height:${WH}px;` + (zi != null ? `z-index:${zi}` : ''); d.dataset.l = n; world.appendChild(d); return d; };
    const layers = { bg: mk('bg'), st: mk('st'), ents: mk('ents'), ui: mk('ui', 8000), fx: mk('fx', 9000) };
    const tint = document.createElement('div'); tint.className = 'ini-tint'; wrap.appendChild(tint);
    const dock = document.createElement('div'); dock.className = 'ini-dock'; wrap.appendChild(dock);
    const play = document.createElement('button'); play.className = 'ini-play'; play.onclick = () => { try { if (firstTime() && window.Guia) Guia.begin(); else handleStartPlayClick(); } catch (e) {} }; wrap.appendChild(play);
    const gear = document.createElement('button'); gear.className = 'ini-gear'; gear.textContent = '⚙️'; gear.setAttribute('aria-label', 'Ajustes'); gear.onclick = () => { fit(true); openPanel(gearPanel()); }; wrap.appendChild(gear);
    const hint = document.createElement('div'); hint.className = 'ini-hint'; hint.textContent = 'Toca una zona del local'; wrap.appendChild(hint);
    sc.appendChild(wrap);
    S = { wrap, view, world, layers, tint, dock, play, ents: [], cooks: [], waiters: [], guests: [], shapes: [], last: performance.now(), sig: '', ptr: null, tier: 0, lit: {}, vw: 0, vh: 0 };
    view.addEventListener('pointerdown', e => { S.ptr = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    view.addEventListener('pointerup', e => {
      const p = S.ptr; S.ptr = null; if (!p || Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10 || performance.now() - p.t > 700) return;
      const [wx, wy] = worldPt(e.clientX, e.clientY), id = hitZone(wx, wy);
      if (id) openZone(id); else if (cam.focus || S.dock.classList.contains('open')) closeZone();
    });
    view.addEventListener('pointercancel', () => { S.ptr = null; });
    window.addEventListener('resize', () => { if (!S) return; measure(); setTimeout(() => { if (cam.focus) focusOn(cam.focus.z, false); else fit(false); }, 60); });
    S.timer = setInterval(tick, 33);
    return true;
  }
  function visible() { return S && S.wrap.offsetParent !== null; }
  function tick() {
    if (!S) return; const now = performance.now();
    if (!visible()) { S.last = now; return; }
    const dt = Math.min(0.1, (now - S.last) / 1000); S.last = now;
    if (!S.built) { measure(); build(); fit(false); S.built = true; updatePlay(); }
    const w = S.view.clientWidth, h = S.view.clientHeight;
    if (w !== S.vw || h !== S.vh) { if (cam.focus) focusOn(cam.focus.z, false); else fit(false); S.vw = w; S.vh = h; }
    if (document.hidden) return;                              // pestaña oculta: se detiene la animación
    if (sprDirty) { sprDirty = false; buildPeople(S.lit); }
    tickPeople(dt);
    S.chk = (S.chk || 0) + dt;
    if (S.chk > 1.2) { S.chk = 0; updatePlay(); if (infoSig() !== S.sig) { build(); if (S.dock.classList.contains('open') && cam.focus) S.dock.innerHTML = panel(cam.focus.z); } }
  }

  // ---------- API ----------
  const Inicio = window.Inicio = {
    act(k, arg) { try { playSound('click'); } catch (e) {} const f = ACT[k]; if (!f) return; try { f(arg); } catch (e) { console.warn('Inicio.act', k, e); } },
    close() { closeZone(); },
    setView(v) {
      store.set(VKEY, v); const sc = $('start-screen'); if (!sc) return;
      sc.classList.toggle('ini-on', v === 'iso');
      if (v === 'iso') { if (!S) create(); else { closePanel(); S.built = false; } setTimeout(() => { if (S) { measure(); } }, 0); } else if (S) closePanel();
      try { updateStartModesDisplay(); } catch (e) {}
    },
    refresh() { if (S) { S.built = false; closePanel(); } },
    zoneAt(cx, cy) { if (!S) return null; const [wx, wy] = worldPt(cx, cy); return hitZone(wx, wy); },
    open(id) { if (S && ZONES[id]) openZone(id); },
    _S: () => S, _cam: cam, zones: ZONES
  };
  function init() {
    const sc = $('start-screen'); if (!sc) return;
    const v = store.get(VKEY) || 'iso';
    css();
    const back = document.createElement('button'); back.className = 'ini-back'; back.textContent = '🏮 Ver el local'; back.onclick = () => Inicio.setView('iso'); sc.appendChild(back);
    if (v === 'iso') { sc.classList.add('ini-on'); create(); }
    const _r = window.returnToStartMenu;
    if (typeof _r === 'function') window.returnToStartMenu = function () { const r = _r.apply(this, arguments); try { Inicio.refresh(); } catch (e) {} return r; };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
