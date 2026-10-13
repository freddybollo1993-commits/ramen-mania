/* Recorrido por Japón: restaurantes inactivos (idle) por ciudad.
   - Cada ciudad es un local que produce soles aunque estés fuera (con tope de horas y según lo activo que seas).
   - Las mejoras se pagan con el Fondo: los soles que dejan Campaña, Rash y Retos + lo que recoges de las cajas.
   - Gastos reales: planilla, ingredientes, luz, agua, renta y errores de personal sin nivel.
   - Al completar la Maestría de una ciudad, sus platos se desbloquean en el juego y los objetos dan mejoras permanentes. */
(function () {
  'use strict';
  const KEY = 'ramen_japon_v1';
  const SCALE = 0.15;                                   // los precios del juego × SCALE = ingreso por plato en el local
  const COST_K = 3;                                      // multiplicador general de costos de mejoras (balance)
const MIN_LIVE = 2;                                   // minutos: por debajo se cuenta como "en vivo" (sin castigo de inactividad)

  // ---------- ciudades y platos (relación histórica / afinidad) ----------
  const CITIES = [
    { id: 'tokio', name: 'Tokio', region: 'Kantō', x: 420, y: 132, cost: 0, cm: 1,
      story: 'La capital del Edo: donde el shoyu, el katsu y el sushi moderno se hicieron famosos.',
      dishes: [['Shoyu', 'ramen', 'Cuna del shoyu ramen: los puestos de Asakusa (c. 1910)'], ['Omuraisu', 'salteados', 'Nació en Ginza, en el restaurante Rengatei (1900)'],
        ['Yakitori', 'salteados', 'Las brochetas de los izakaya de Yūrakuchō'], ['Tonkatsu', 'frituras', 'Inventado en Ginza en 1899'], ['Maki California', 'makis', 'Heredero del sushi Edomae, versión «inside-out»']] },
    { id: 'yokohama', name: 'Yokohama', region: 'Kantō', x: 396, y: 160, cost: 1500, cm: 1.3,
      story: 'Puerto que abrió Japón al mundo en 1859: fusión, Chinatown y sabores de Occidente.',
      dishes: [['Bajiru', 'ramen', 'Ramen de albahaca: la influencia extranjera del puerto'], ['Chicken Teriyaki', 'salteados', 'El teriyaki viajó con el puerto hacia Occidente'], ['Maki Digion', 'makis', 'Mostaza de Dijon: cocina occidental en Japón']] },
    { id: 'osaka', name: 'Osaka', region: 'Kansai', x: 262, y: 214, cost: 2500, cm: 1.6,
      story: 'La «cocina de Japón» (kuidaore): fritura, plancha y comida callejera.',
      dishes: [['Yakiramen', 'salteados', 'Plancha (teppan) y fideos salteados de Naniwa'], ['Yasaitame', 'salteados', 'Verduras al wok de las cocinas populares'], ['Maki Furai', 'makis', 'Fritura al estilo kushikatsu de Shinsekai']] },
    { id: 'nagoya', name: 'Nagoya', region: 'Chūbu', x: 342, y: 184, cost: 4000, cm: 2,
      story: 'Capital del «nagoya-meshi»: platos intensos, fritos y picantes.',
      dishes: [['Alitas', 'frituras', 'Tebasaki: las alitas fritas de Nagoya'], ['Ebi Furai', 'frituras', 'El langostino frito es plato emblema de Nagoya'], ['Chicken Katsu', 'frituras', 'Katsu con salsa oscura al estilo de Nagoya'], ['Karameshi', 'salteados', 'Picante con carácter: el sabor de Nagoya']] },
    { id: 'sapporo', name: 'Sapporo', region: 'Hokkaidō', x: 528, y: 52, cost: 6000, cm: 2.4,
      story: 'El norte frío: mantequilla, mariscos y el miso ramen nacido en 1955.',
      dishes: [['Miso', 'ramen', 'Creado en Sapporo en 1955'], ['Shio', 'ramen', 'El ramen de sal de Hakodate, Hokkaidō'], ['Ebi', 'ramen', 'Camarones del mar de Hokkaidō'], ['Batayaki Ramen', 'salteados', 'Mantequilla (bata) y vegetales a la plancha de Hokkaidō'], ['Maki Hotate', 'makis', 'Las vieiras de Hokkaidō']] },
    { id: 'kioto', name: 'Kioto', region: 'Kansai', x: 288, y: 192, cost: 8000, cm: 2.8,
      story: 'La ciudad de los templos: cocina vegetal (shōjin ryōri) y delicadeza.',
      dishes: [['Vegetariano', 'ramen', 'Shōjin ryōri: la cocina vegetal de los templos'], ['Maki Guacamole', 'makis', 'Lo vegetal y cremoso, a la manera de Kioto'], ['Maki Yama', 'makis', 'Las montañas de Arashiyama («yama»)']] },
    { id: 'fukuoka', name: 'Fukuoka', region: 'Kyūshū', x: 124, y: 226, cost: 11000, cm: 3.2,
      story: 'Hakata: yatai (puestos de calle), tonkotsu y gyozas de un bocado.',
      dishes: [['Tonkotsu', 'ramen', 'Hakata: el caldo blanco de hueso de cerdo'], ['Chashu', 'ramen', 'El cerdo braseado de los ramen de Hakata'], ['Age Gyozas', 'frituras', 'Hitokuchi gyoza: las gyozas de un bocado'], ['Kaarage', 'frituras', 'Kyūshū (Nakatsu) es tierra del pollo karaage'], ['Maki Nin Niku', 'makis', 'El ajo de los yatai de Hakata']] },
    { id: 'kanazawa', name: 'Kanazawa', region: 'Hokuriku', x: 322, y: 138, cost: 15000, cm: 3.6,
      story: 'La costa del Mar de Japón: pescado fresco y el famoso curry de Kanazawa.',
      dishes: [['Katsu Kare', 'frituras', 'El «Kanazawa curry» con katsu es su plato más querido'], ['Maki Amazon', 'makis', 'Verdes y frescura del Hokuriku'], ['Maki Acevichado', 'makis', 'Pescado del Mar de Japón en versión nikkei']] },
    { id: 'nagasaki', name: 'Nagasaki', region: 'Kyūshū', x: 88, y: 252, cost: 20000, cm: 4,
      story: 'Puerto con barrio chino (Shinchi): champon, chaufa y sabores del continente.',
      dishes: [['Chaufa Shimaya', 'salteados', 'Arroz salteado al estilo del barrio chino de Shinchi'], ['Yakimeshi', 'salteados', 'El arroz frito de las cocinas sino-japonesas'], ['Tan tan', 'ramen', 'Influencia de Sichuan llegada por el puerto']] }
  ];
  const CITY = Object.fromEntries(CITIES.map(c => [c.id, c]));
  const KITCHENS = ['ramen', 'salteados', 'frituras', 'makis'];
  const ZONES = ['depo', ...KITCHENS, 'salon', 'caja', 'banos'];
  const ZONE_INFO = {
    ramen: { icon: '🍜', name: 'Ramen', role: 'Cocineros' }, salteados: { icon: '🥘', name: 'Salteados', role: 'Cocineros' },
    frituras: { icon: '🍤', name: 'Frituras', role: 'Cocineros' }, makis: { icon: '🍣', name: 'Makis', role: 'Cocineros' },
    salon: { icon: '🪑', name: 'Salón', role: 'Mozos' }, caja: { icon: '💴', name: 'Caja', role: 'Cajeros' },
    depo: { icon: '📦', name: 'Depósito', role: 'Almaceneros' }, banos: { icon: '🚻', name: 'Baños', role: 'Limpieza' }
  };
  CITIES.forEach(c => { c.areas = KITCHENS.filter(a => c.dishes.some(d => d[1] === a)); });

  // ---------- parámetros de la economía (ajustables) ----------
  const T = {
    cook:   { spd: [0.36, 0.48, 0.62, 0.80, 1.00], err: [0.26, 0.20, 0.14, 0.09, 0.05], wage: [0.12, 0.18, 0.28, 0.42, 0.60] },
    waiter: { spd: [0.50, 0.70, 0.95, 1.25, 1.60], err: [0.20, 0.14, 0.09, 0.05, 0.03], wage: [0.10, 0.15, 0.23, 0.35, 0.50] },
    aux:    { wage: [0.08, 0.12, 0.18, 0.27, 0.38] },
    tiers: [{ name: 'Local pequeño', tables: 4, rent: 0.15, cooks: 2, waiters: 2, aux: 1, cost: 0 }, { name: 'Local mediano', tables: 8, rent: 0.45, cooks: 3, waiters: 4, aux: 1, cost: 600 },
            { name: 'Local grande', tables: 14, rent: 1.0, cooks: 4, waiters: 6, aux: 2, cost: 2500 }, { name: 'Local amplio', tables: 18, rent: 1.9, cooks: 5, waiters: 9, aux: 2, cost: 9000 }],
    demand: 0.4,                                         // platos/min por mesa
    quality: { price: 0.12, cogs: 0.03, base: 0.26, cost: [0, 300, 900, 2400, 6000] },
    elecTable: 0.015, elecTier: 0.04, waterTable: 0.012, leak: 0.06,
    capHours: 4, capHoursMax: 12
  };
  // objetos: 3 por zona. fx = efecto en el local; buff = mejora permanente en el juego; w = consumo de luz
  const OBJECTS = {
    ramen:     [['olla', '🍲', 'Olla de cobre grande', { spd: 0.15 }, { k: 'patience', v: 0.01 }], ['fideos', '🍜', 'Fideos frescos del día', { err: 0.04 }, { k: 'tips', v: 0.01 }], ['sopera', '🥣', 'Sopera de hierro fundido', { cogs: 0.02 }, { k: 'price', v: 0.005 }]],
    salteados: [['wok', '🍳', 'Wok de hierro', { spd: 0.15 }, { k: 'patience', v: 0.01 }], ['gas', '🔥', 'Quemador potente', { err: 0.04 }, { k: 'tips', v: 0.01 }], ['tabla', '🪵', 'Tabla de teca', { cogs: 0.02 }, { k: 'price', v: 0.005 }]],
    frituras:  [['freidora', '🍤', 'Freidora termostática', { spd: 0.15 }, { k: 'patience', v: 0.01 }], ['colador', '🥄', 'Colador de malla', { err: 0.04 }, { k: 'tips', v: 0.01 }], ['aceite', '🛢️', 'Aceite de arroz', { cogs: 0.02 }, { k: 'price', v: 0.005 }]],
    makis:     [['esteras', '🎍', 'Esteras de bambú', { spd: 0.15 }, { k: 'patience', v: 0.01 }], ['yanagiba', '🔪', 'Cuchillo yanagiba', { err: 0.04 }, { k: 'tips', v: 0.01 }], ['vitrina', '🧊', 'Vitrina fría', { cogs: 0.02 }, { k: 'price', v: 0.005 }]],
    salon:     [['tv', '📺', 'Televisor', { rep: 0.05, w: 0.05 }, { k: 'patience', v: 0.01 }], ['tatami', '🟫', 'Tatami y cojines', { rep: 0.06 }, { k: 'tips', v: 0.01 }], ['bambu', '🎋', 'Bambú decorativo', { rep: 0.04 }, { k: 'price', v: 0.005 }]],
    caja:      [['registradora', '🧾', 'Registradora moderna', { cap: 2 }, { k: 'price', v: 0.005 }], ['pos', '💳', 'Terminal de tarjetas', { leak: 0.03, w: 0.03 }, { k: 'tips', v: 0.01 }], ['buzon', '🧧', 'Buzón de propinas', { cap: 2 }, { k: 'tips', v: 0.01 }]],
    depo:      [['refri', '❄️', 'Refrigerador industrial', { cogs: 0.03, w: 0.06 }, { k: 'fresh', v: 0.05 }], ['estante', '🗄️', 'Estantería ordenada', { cogs: 0.02 }, { k: 'fresh', v: 0.05 }], ['balanza', '⚖️', 'Balanza digital', { err: 0.02 }, { k: 'patience', v: 0.01 }]],
    banos:     [['jabon', '🧼', 'Jabón y secador', { rep: 0.04, w: 0.02 }, { k: 'patience', v: 0.01 }], ['aroma', '🌸', 'Aromatizador', { rep: 0.03 }, { k: 'tips', v: 0.01 }], ['espejo', '🪞', 'Espejo y decoración', { rep: 0.03 }, { k: 'price', v: 0.005 }]]
  };
  const OBJ_COST = [150, 420, 1000];
  const BUFF_NAMES = { patience: 'paciencia de los clientes', tips: 'propinas', price: 'precio de venta', fresh: 'tiempo antes de enfriarse' };

  // ---------- estado ----------
  let S = null;
  const store = () => (typeof safeStorage !== 'undefined' ? safeStorage : { getItem: k => localStorage.getItem(k), setItem: (k, v) => localStorage.setItem(k, v) });
  function newRest(c) {
    const st = {};
    ZONES.forEach(z => { st[z] = { n: 0, l: 1 }; });
    st.salon.n = 1;
    const areas = {}; c.areas.forEach((a, i) => { areas[a] = i === 0; });
    if (c.areas[0]) st[c.areas[0]].n = 1;
    return { tier: 1, tables: 3, q: 1, staff: st, areas, objs: {}, cash: 0, cashIn: 0, cashOut: 0, since: 0, t: Date.now(), net: 0 };
  }
  function load() {
    if (S) return S;
    let d = null;
    try { d = JSON.parse(store().getItem(KEY) || 'null'); } catch (e) {}
    S = d && d.v === 1 ? d : { v: 1, fondo: 0, lifetime: 0, spent: 0, open: {}, rest: {}, act: {}, cur: null };
    if (!S.open.tokio) { S.open.tokio = true; S.rest.tokio = newRest(CITY.tokio); }
    if (typeof S.spent !== 'number') S.spent = Math.max(0, (S.lifetime || 0) - (S.fondo || 0));          // libro de gastos: Fondo = ganado − gastado
    Object.keys(S.rest).forEach(id => { const r = S.rest[id]; if (typeof r.cashIn !== 'number') { r.cashIn = r.cash || 0; r.cashOut = 0; } if (typeof r.cashOut !== 'number') r.cashOut = 0; });
    return S;
  }
  function persist() { try { store().setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function save() { if (S) { syncMeta().dirty = true; } persist(); syncSoon(); }
  const dayKey = (t = Date.now()) => Math.floor(t / 86400000);
  const fmt = n => { n = Math.round(n); return Math.abs(n) >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'k' : String(n); };
  const fmt1 = n => (Math.abs(n) < 10 ? n.toFixed(2) : n.toFixed(1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- precios de los platos ----------
  function dishPrice(name, area) {
    const cat = { ramen: 'RECETAS_RAMEN', salteados: 'RECETAS_SALTEADOS', makis: 'RECETAS_MAKIS', frituras: 'RECETAS_FRITURAS' }[area];
    try { const list = eval(cat); const r = list.find(x => x.name === name); return r ? r.price : 40; } catch (e) { return 40; }
  }
  function areaPrice(c, a) {
    const ds = c.dishes.filter(d => d[1] === a);
    return ds.length ? ds.reduce((s, d) => s + dishPrice(d[0], d[1]), 0) / ds.length : 40;
  }

  // ---------- economía ----------
  const objFx = (r, z, key) => (OBJECTS[z] || []).reduce((s, o) => s + (r.objs[o[0] + '@' + z] && o[3][key] ? o[3][key] : 0), 0);
  const allFx = (r, key) => ZONES.reduce((s, z) => s + objFx(r, z, key), 0);
  const lvIdx = l => clamp(l, 1, 5) - 1;
  function reputation(r) {
    const b = r.staff.banos;
    return clamp(0.7 + (b.n > 0 ? 0.04 * b.l : 0) + allFx(r, 'rep'), 0.6, 1.5);
  }
  function capHours(r) { return clamp(T.capHours + allFx(r, 'cap') + (r.staff.caja.n > 0 ? 0.4 * r.staff.caja.l : 0), T.capHours, T.capHoursMax); }
  function evalRest(c, r) {
    const tier = T.tiers[r.tier - 1], R = reputation(r), q = r.q;
    const demand = r.tables * T.demand * R;
    const act = KITCHENS.filter(a => c.areas.includes(a) && r.areas[a]);
    const w = r.staff.salon, wCap = w.n * T.waiter.spd[lvIdx(w.l)] * (1 + objFx(r, 'salon', 'spd'));
    const wErr = clamp(T.waiter.err[lvIdx(w.l)] - objFx(r, 'salon', 'err'), 0.01, 0.5);
    const cogsRate = T.quality.base + T.quality.cogs * (q - 1) - allFx(r, 'cogs') - (r.staff.depo.n > 0 ? 0.008 * r.staff.depo.l : 0);
    const pm = 1 + T.quality.price * (q - 1);
    const per = act.map(a => {
      const s = r.staff[a], cap = s.n * T.cook.spd[lvIdx(s.l)] * (1 + objFx(r, a, 'spd'));
      const err = clamp(T.cook.err[lvIdx(s.l)] - objFx(r, a, 'err') - allFx(r, 'errAll'), 0.02, 0.6);
      const price = areaPrice(c, a) * SCALE;
      return { a, cap, err, price, dem: demand / Math.max(1, act.length), served: 0 };
    });
    per.forEach(p => { p.served = Math.min(p.dem, p.cap); });
    let tot = per.reduce((s, p) => s + p.served, 0);
    const limit = wCap > 0 ? Math.min(1, wCap / Math.max(tot, 1e-9)) : 0;
    per.forEach(p => { p.served *= limit; p.ok = p.served * (1 - p.err) * (1 - wErr); p.rev = p.ok * p.price * pm; p.ing = p.served * p.price * cogsRate; p.loss = p.served * p.price * pm - p.rev; });
    const rev = per.reduce((s, p) => s + p.rev, 0), ing = per.reduce((s, p) => s + p.ing, 0), lost = per.reduce((s, p) => s + p.loss, 0);
    const leak = rev * clamp(T.leak - allFx(r, 'leak') - (r.staff.caja.n > 0 ? 0.008 * r.staff.caja.l : 0), 0, 0.2);
    let wages = 0, staffN = 0;
    ZONES.forEach(z => { const s = r.staff[z]; const tb = z === 'salon' ? T.waiter.wage : (KITCHENS.includes(z) ? T.cook.wage : T.aux.wage); wages += s.n * tb[lvIdx(s.l)]; staffN += s.n; });
    const objN = Object.keys(r.objs).length, tv = r.objs['tv@salon'] ? 1 : 0;
    const elec = T.elecTier * r.tier + T.elecTable * r.tables + allFx(r, 'w') + 0.01 * act.length;
    const water = T.waterTable * r.tables + 0.006 * staffN;
    const rent = tier.rent;
    const net = rev - leak - ing - wages - elec - water - rent;
    return { per, R, demand, rev, leak, ing, lost, wages, elec, water, rent, net, wCap, wErr, served: per.reduce((s, p) => s + p.served, 0), tv, objN };
  }
  const netOf = (c, r) => evalRest(c, r).net;

  // actividad: minutos jugados en los últimos 3 días (Campaña, Rash, Retos)
  function actMult() {
    load();
    const k = dayKey(); let m = 0;
    for (let i = 0; i < 3; i++) m += S.act[k - i] || 0;
    return 0.25 + 0.75 * Math.min(1, m / 60);
  }
  function accrue(id, minutes, live) {
    const r = S.rest[id]; if (!r) return 0;
    const c = CITY[id], capMin = capHours(r) * 60;
    const net = netOf(c, r); r.net = net;
    const take = Math.max(0, Math.min(minutes, capMin - r.since));
    const mult = live ? 1 : actMult();
    const gain = net * take * mult;
    const before = r.cash; r.cash = Math.max(0, r.cash + gain);
    if (r.cash > before) r.cashIn += r.cash - before; else r.cashOut += before - r.cash;
    r.since += take;
    return gain;
  }
  function catchUp() {
    load();
    const now = Date.now(); let total = 0, away = 0;
    Object.keys(S.rest).forEach(id => {
      const r = S.rest[id], el = Math.max(0, (now - r.t) / 60000);
      r.t = now;
      if (el <= 0) return;
      total += accrue(id, el, el <= MIN_LIVE);
      if (el > MIN_LIVE) away = Math.max(away, el);
    });
    save();
    return { total, away };
  }

  // ---------- costos de mejoras ----------
  const cm = id => CITY[id].cm * COST_K;
  const costHire = (id, z, n) => Math.round(50 * Math.pow(n + 1, 1.5) * cm(id) * (KITCHENS.includes(z) ? 1 : (z === 'salon' ? 0.8 : 0.7)));
  const costLevel = (id, z, l, n) => Math.round(80 * Math.pow(2.1, l - 1) * (0.6 + 0.4 * n) * cm(id) * (KITCHENS.includes(z) ? 1 : (z === 'salon' ? 0.8 : 0.7)));
  const costTable = (id, t) => Math.round(40 * Math.pow(t, 1.25) * cm(id));
  const costTier = (id, t) => Math.round(T.tiers[t].cost * cm(id));
  const costArea = (id, k) => Math.round([0, 150, 400, 900][k] * cm(id));
  const costQual = (id, q) => Math.round(T.quality.cost[q] * cm(id));
  const costObj = (id, i) => Math.round(OBJ_COST[i] * cm(id));
  const staffMax = (r, z) => { const t = T.tiers[r.tier - 1]; return KITCHENS.includes(z) ? t.cooks : (z === 'salon' ? t.waiters : t.aux); };

  // ---------- Maestría ----------
  function mastery(c, r) {
    const act = c.areas, objs = ZONES.filter(z => z !== 'depo' || true).flatMap(z => OBJECTS[z].map(o => o[0] + '@' + z));
    const checks = [
      { t: 'Local grande o mayor', ok: r.tier >= 3 },
      { t: 'Calidad de ingredientes al máximo (5)', ok: r.q >= 5 },
      { t: 'Todas las cocinas abiertas', ok: act.every(a => r.areas[a]) },
      { t: 'Cocineros de nivel 4 en cada cocina', ok: act.every(a => r.staff[a].n > 0 && r.staff[a].l >= 4) },
      { t: 'Mozos de nivel 4 (al menos 1 por cada 3 mesas)', ok: r.staff.salon.l >= 4 && r.staff.salon.n >= Math.ceil(r.tables / 3) },
      { t: 'Los 24 objetos del local', ok: objs.every(k => r.objs[k]) }
    ];
    const done = checks.filter(x => x.ok).length;
    return { checks, done, total: checks.length, complete: done === checks.length };
  }
  // Mejora de plato: al completar la Maestría de una ciudad, cada uno de sus platos da +8 % de pago al servirlo (los platos ya están disponibles en el juego de todos modos)
  const DISH_BONUS = 0.08;
  function japonDishBonus(name) {
    load();
    return Object.keys(S.rest).some(id => CITY[id].dishes.some(d => d[0] === name) && mastery(CITY[id], S.rest[id]).complete) ? DISH_BONUS : 0;
  }
  function japonBuff(key) {
    load();
    let v = 0;
    Object.keys(S.rest).forEach(id => ZONES.forEach(z => OBJECTS[z].forEach(o => { if (S.rest[id].objs[o[0] + '@' + z] && o[4].k === key) v += o[4].v; })));
    return v;
  }

  // ---------- acciones ----------
  function toast(m) { try { showStationToast(m); } catch (e) { console.log(m); } }
  function pay(cost) {
    if (S.fondo < cost) { toast('💴 Te faltan S/ ' + fmt(cost - S.fondo) + ' en el Fondo.'); try { playSound('error'); } catch (e) {} return false; }
    S.fondo -= cost; S.spent += cost; try { playSound('stock_add'); } catch (e) {} return true;
  }
  const A = {
    hire(z) { const r = rs(), id = S.cur, s = r.staff[z]; if (s.n >= staffMax(r, z)) return toast('🏠 Tu local no tiene más puestos: amplíalo.'); if (!pay(costHire(id, z, s.n))) return; s.n++; refresh(); },
    level(z) { const r = rs(), id = S.cur, s = r.staff[z]; if (s.n < 1) return toast('Contrata primero a alguien.'); if (s.l >= 5) return; if (!pay(costLevel(id, z, s.l, s.n))) return; s.l++; refresh(); },
    table() { const r = rs(), id = S.cur; if (r.tables >= T.tiers[r.tier - 1].tables) return toast('🏠 No caben más mesas: amplía el local.'); if (!pay(costTable(id, r.tables))) return; r.tables++; refresh(); },
    tier() { const r = rs(), id = S.cur; if (r.tier >= 4) return; if (!pay(costTier(id, r.tier))) return; r.tier++; refresh(); },
    area(a) { const r = rs(), id = S.cur, k = Object.values(r.areas).filter(Boolean).length; if (!pay(costArea(id, k))) return; r.areas[a] = true; r.staff[a].n = Math.max(1, r.staff[a].n); refresh(); },
    qual() { const r = rs(), id = S.cur; if (r.q >= 5) return; if (!pay(costQual(id, r.q))) return; r.q++; refresh(); },
    obj(z, i) { const r = rs(), id = S.cur, o = OBJECTS[z][i], k = o[0] + '@' + z; if (r.objs[k]) return; if (!pay(costObj(id, i))) return; r.objs[k] = true; refresh(); },
    collect() { const r = rs(); const g = Math.floor(r.cash); if (g < 1) return toast('La caja está vacía.'); S.fondo += g; S.lifetime += g; r.cash -= g; r.cashOut += g; r.since = 0; try { playSound('match'); } catch (e) {} toast('💴 +S/ ' + fmt(g) + ' al Fondo'); refresh(); },
    open(id) { const c = CITY[id]; if (S.open[id]) { A.go(id); return; } if (!pay(c.cost)) return; S.open[id] = true; S.rest[id] = newRest(c); A.go(id); },
    go(id) { S.cur = id; S.view = 'rest'; refresh(); },
    map() { S.view = 'map'; S.sel = S.sel || S.cur; if (window.JPScene) window.JPScene.destroy(); refresh(); },
    sel(id) { S.sel = id; refresh(); },
    zone(z) {
      if (!S.cur || !S.rest[S.cur]) return;
      if (KITCHENS.includes(z) && !CITY[S.cur].areas.includes(z)) return toast('Esta ciudad no tiene platos de esa cocina.');
      S.zone = z; refresh(); dockFocus(z);
    },
    close() { S.zone = null; refresh(); if (window.JPScene) window.JPScene.focus(null); },
    fin() { S.fin = !S.fin; refresh(); },
    exit() { persist(); stop(); if (window.JPScene) window.JPScene.destroy(); const el = document.getElementById('jp-screen'); if (el) el.remove(); S.view = null; save(); updateChip(); }
  };
  const rs = () => S.rest[S.cur];
  const dockW = () => Math.min(330, Math.round(window.innerWidth * 0.46));
  function dockFocus(z) { if (window.JPScene) window.JPScene.focus(z, dockW()); }

  // ---------- interfaz ----------
  let timer = null;
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  let liveTicks = 0;
  function start() { stop(); timer = setInterval(() => { if (S.view === 'rest' && S.cur) { accrue(S.cur, 1 / 60, true); S.rest[S.cur].t = Date.now(); liveUi(); if (++liveTicks % 15 === 0) persist(); } }, 1000); }
  function liveUi() {
    const r = rs(); if (!r) return;
    const q = id => document.getElementById(id);
    if (q('jp-cash')) q('jp-cash').textContent = 'S/ ' + fmt(r.cash);
    if (q('jp-net')) { q('jp-net').textContent = (r.net >= 0 ? '+' : '') + fmt1(r.net * 60) + '/h'; q('jp-net').className = r.net >= 0 ? 'pos' : 'neg'; }
    if (window.JPScene) window.JPScene.update();
    if (q('jp-capbar')) q('jp-capbar').style.width = Math.round(100 * Math.min(1, r.since / (capHours(r) * 60))) + '%';
  }
  function refresh() { save(); render(); }

  const CSS = `
  #jp-screen { position: fixed; inset: 0; z-index: 9000; background: linear-gradient(#f4ead2, #e4d3ae); color: #3b2a1a; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; display: flex; flex-direction: column; overflow: hidden; }
  #jp-screen * { box-sizing: border-box; }
  .jp-top { display: flex; align-items: center; gap: 8px; padding: calc(4px + env(safe-area-inset-top)) 10px 4px; background: #7a1f1f; color: #fff4d6; flex-shrink: 0; min-height: 38px; }
  .jp-top h2 { font-size: 15px; margin: 0; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .jp-chip { background: rgba(0,0,0,0.3); border-radius: 14px; padding: 3px 9px; font-size: 12px; font-weight: 800; white-space: nowrap; }
  .jp-chip.pos b, .pos { color: #8bd36b; } .jp-chip.neg b, .neg { color: #ff8a80; }
  .jp-btn { border: 0; border-radius: 10px; padding: 6px 12px; font-weight: 900; font-size: 12px; background: #c9a24a; color: #2b1a08; cursor: pointer; font-family: inherit; }
  .jp-btn:disabled { opacity: 0.45; cursor: default; }
  .jp-btn.red { background: #b71c1c; color: #fff; } .jp-btn.ghost { background: rgba(255,255,255,0.18); color: #fff4d6; } .jp-foot .jp-btn.ghost { background: #7a1f1f; }
  .jp-body { flex: 1; min-height: 0; display: flex; gap: 8px; padding: 8px; overflow: hidden; }
  .jp-map { flex: 1; min-width: 0; background: #9fd0e8; border-radius: 14px; position: relative; overflow: hidden; border: 3px solid #7a5a2a; }
  .jp-map svg { width: 100%; height: 100%; display: block; }
  .jp-land { fill: #d9cf9a; stroke: #8a7a45; stroke-width: 2; }
  .jp-pin { cursor: pointer; } .jp-pin circle { stroke: #fff; stroke-width: 2; } .jp-pin text { font-size: 12px; font-weight: 800; fill: #3b2a1a; paint-order: stroke; stroke: #fff9e6; stroke-width: 3px; }
  .jp-pin.locked circle { fill: #8d8d8d; } .jp-pin.owned circle { fill: #d32f2f; } .jp-pin.done circle { fill: #f4b400; } .jp-pin.sel circle { stroke: #1565c0; stroke-width: 4; }
  .jp-side { width: 270px; flex-shrink: 0; background: #fff8e6; border-radius: 14px; border: 2px solid #c9a24a; padding: 8px 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
  .jp-side > .jp-btn { position: sticky; bottom: 0; flex-shrink: 0; }
  .jp-side h3 { margin: 0; font-size: 16px; color: #7a1f1f; } .jp-side small { color: #6b5a3a; line-height: 1.25; }
  .jp-dish { display: flex; gap: 6px; align-items: flex-start; font-size: 10px; background: #f4ead2; border-radius: 8px; padding: 4px 6px; }
  .jp-dish b { white-space: nowrap; } .jp-dish span { color: #6b5a3a; }
  .jp-lock { filter: grayscale(1); opacity: 0.7; }
  .jp-plan { flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: 1fr 1.25fr; gap: 6px; }
  .jp-zone { position: relative; border-radius: 12px; border: 2px solid #8a6a35; background: #fff8e6; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 4px; cursor: pointer; text-align: center; font-size: 11px; font-weight: 700; }
  .jp-zone .ic { font-size: 26px; line-height: 1; } .jp-zone .nm { font-size: 12px; font-weight: 900; color: #7a1f1f; }
  .jp-zone small { font-size: 10px; color: #6b5a3a; font-weight: 700; } .jp-zone.off { background: #e0d8c4; border-style: dashed; opacity: 0.8; } .jp-zone.salon { grid-column: span 3; background: #dbe8b8; }
  .jp-zone:active { transform: scale(0.98); } .jp-zone .bd { position: absolute; top: 3px; right: 5px; font-size: 10px; background: #7a1f1f; color: #fff; border-radius: 8px; padding: 0 5px; }
  .jp-tables { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; max-width: 100%; } .jp-tables i { font-style: normal; font-size: 15px; }
  .jp-bar { height: 6px; border-radius: 3px; background: rgba(0,0,0,0.25); overflow: hidden; width: 100%; } .jp-bar b { display: block; height: 100%; background: linear-gradient(90deg, #ffb300, #ff6f00); }
  .jp-modal { position: absolute; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 5; padding: 8px; }
  .jp-card { width: min(640px, 100%); max-height: 100%; overflow-y: auto; background: #fff8e6; border: 3px solid #7a5a2a; border-radius: 16px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
  .jp-card h3 { margin: 0; font-size: 16px; color: #7a1f1f; display: flex; justify-content: space-between; align-items: center; }
  .jp-row { display: flex; align-items: center; gap: 8px; background: #f4ead2; border-radius: 10px; padding: 6px 8px; font-size: 12px; font-weight: 700; } .jp-row > div { flex: 1; min-width: 0; } .jp-row small { display: block; color: #6b5a3a; font-weight: 600; }
  .jp-obj { opacity: 1; } .jp-obj.have { background: #d7ecc0; } .jp-obj .ic { font-size: 22px; }
  .jp-fin table { width: 100%; border-collapse: collapse; font-size: 12px; } .jp-fin td { padding: 2px 4px; border-bottom: 1px solid #e0d2ac; } .jp-fin td:last-child { text-align: right; font-weight: 800; }
  .jp-mast { display: flex; flex-direction: column; gap: 2px; font-size: 11px; } .jp-mast .ok { color: #2e7d32; } .jp-mast .no { color: #8a6a35; }
  .jp-scenehost { flex: 1; min-height: 0; display: flex; position: relative; }
  .jp-hudL { position: absolute; left: 8px; bottom: 8px; display: flex; gap: 6px; z-index: 30; align-items: flex-end; flex-wrap: wrap; max-width: calc(100% - 60px); }
  .jp-hudL .jp-btn { box-shadow: 0 2px 0 rgba(0,0,0,0.35); } .jp-hudL .jp-btn.ghost { background: #7a1f1f; }
  .jp-capchip { background: rgba(255,248,230,0.92); border: 2px solid #8a6a35; border-radius: 10px; padding: 3px 8px; min-width: 150px; } .jp-capchip small { font-size: 10px; color: #5b3a12; font-weight: 800; white-space: nowrap; }
  .jp-dock { position: absolute; right: 0; top: 40px; bottom: 0; z-index: 40; background: #fff8e6; border-left: 3px solid #7a5a2a; box-shadow: -6px 0 14px rgba(0,0,0,0.3); padding: 8px 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
  .jp-dock .jp-row { flex-wrap: wrap; } .jp-dock .jp-row > div { flex: 1 1 100%; } .jp-dock .jp-row .jp-btn { flex: 1 1 auto; }
  .jp-dock h3 { margin: 0; font-size: 16px; color: #7a1f1f; display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  .jp-cloud { animation: jpCloud 38s linear infinite; opacity: 0.85; } .jp-cloud.c2 { animation-duration: 55s; animation-delay: -20s; } @keyframes jpCloud { from { transform: translateX(-80px); } to { transform: translateX(680px); } }
  .jp-wave { animation: jpWave 4s ease-in-out infinite; } @keyframes jpWave { 50% { transform: translateX(10px); } }
  .jp-boat { animation: jpBoat 22s linear infinite; } @keyframes jpBoat { from { transform: translateX(0); } to { transform: translateX(120px); } }
  .jp-pin.owned circle, .jp-pin.done circle { animation: jpPin 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; } @keyframes jpPin { 50% { transform: scale(1.25); } }
  .jp-opts { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; } .jp-opt { flex: 1 1 110px; background: #f4ead2; border: 2px solid #c9b78a; border-radius: 10px; padding: 5px 8px; cursor: pointer; display: flex; flex-direction: column; gap: 1px; position: relative; } .jp-opt b { font-size: 13px; } .jp-opt small { font-size: 10px; color: #6b5a3a; font-weight: 600; } .jp-opt em { position: absolute; top: 4px; right: 7px; font-style: normal; font-weight: 900; font-size: 12px; color: #b71c1c; }
  .jp-opt.sel { border-color: #b71c1c; background: #ffe9c9; box-shadow: 0 0 0 2px rgba(183,28,28,0.25); } .jp-opt.off { opacity: 0.5; cursor: default; }
  .jp-resultbox { position: fixed; inset: 0; z-index: 9500; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; padding: 10px; font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; color: #3b2a1a; } .jp-resultbox .jp-card { width: 100%; background: #fff8e6; border: 3px solid #7a5a2a; border-radius: 16px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; } .jp-resultbox h3 { margin: 0; font-size: 16px; color: #7a1f1f; }
  .jp-resultbox .jp-row { display: flex; align-items: center; gap: 8px; background: #f4ead2; border-radius: 10px; padding: 6px 8px; font-size: 12px; font-weight: 700; } .jp-resultbox .jp-row > div { flex: 1; } .jp-resultbox .jp-row small { display: block; color: #6b5a3a; font-weight: 600; } .jp-resultbox .jp-btn { border: 0; border-radius: 10px; padding: 7px 14px; font-weight: 900; font-size: 13px; background: #c9a24a; color: #2b1a08; cursor: pointer; font-family: inherit; } .jp-resultbox .jp-btn.red { background: #b71c1c; color: #fff; }
  .jp-stats { display: flex; gap: 6px; } .jp-stats div { flex: 1; background: #f4ead2; border-radius: 10px; padding: 5px; text-align: center; } .jp-stats b { display: block; font-size: 16px; } .jp-stats small { font-size: 10px; color: #6b5a3a; font-weight: 700; }
  .jp-foot { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; padding: 0 8px 6px; flex-shrink: 0; }
  .jp-note { background: #fff2b3; border: 2px solid #c9a24a; border-radius: 10px; padding: 4px 8px; font-size: 12px; font-weight: 800; margin: 0 8px; }
  `;
  function css() { if (document.getElementById('jp-css')) return; const s = document.createElement('style'); s.id = 'jp-css'; s.textContent = CSS; document.head.appendChild(s); }

  function mapSvg() {
    const pins = CITIES.map(c => {
      const open = !!S.open[c.id], done = open && mastery(c, S.rest[c.id]).complete;
      return `<g class="jp-pin ${done ? 'done' : (open ? 'owned' : 'locked')} ${S.sel === c.id ? 'sel' : ''}" onclick="JP.sel('${c.id}')"><circle cx="${c.x}" cy="${c.y}" r="9"/><text x="${c.x + 12}" y="${c.y + 4}">${c.name}</text></g>`;
    }).join('');
    return `<svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="600" height="300" fill="#9fd0e8"/><g class="jp-wave"><path d="M20,100 q20,-8 40,0 t40,0 M470,230 q20,-8 40,0 t40,0 M30,150 q20,-8 40,0 t40,0" fill="none" stroke="#c8e8f6" stroke-width="3"/></g><path d="M0,40 q60,10 120,0 t120,0 t120,0 t120,0 t120,0" fill="none" stroke="#b9e0f2" stroke-width="3" opacity="0.7"/><path d="M0,280 q60,-10 120,0 t120,0 t120,0 t120,0 t120,0" fill="none" stroke="#b9e0f2" stroke-width="3" opacity="0.7"/>
      <path class="jp-land" d="M 500,30 L 545,22 L 585,45 L 570,72 L 535,68 L 515,82 L 495,62 Z"/>
      <path class="jp-land" d="M 160,214 L 205,196 L 252,196 L 292,178 L 318,146 L 330,122 L 372,138 L 398,126 L 418,98 L 432,70 L 452,66 L 456,92 L 446,128 L 424,162 L 392,176 L 352,190 L 318,200 L 270,214 L 220,226 Z"/>
      <path class="jp-land" d="M 232,232 L 275,224 L 290,238 L 262,252 L 238,248 Z"/>
      <path class="jp-land" d="M 80,236 L 118,214 L 150,226 L 146,258 L 118,278 L 92,270 L 78,252 Z"/>
      <g class="jp-boat"><path d="M180,262 h22 l-4,8 h-14 Z" fill="#8a5a2b"/><path d="M190,262 v-12 l9,10 Z" fill="#fff"/></g>
      <g class="jp-cloud"><ellipse cx="60" cy="40" rx="26" ry="9" fill="#fff"/><ellipse cx="78" cy="34" rx="16" ry="8" fill="#fff"/></g><g class="jp-cloud c2"><ellipse cx="40" cy="190" rx="22" ry="8" fill="#fff"/><ellipse cx="56" cy="185" rx="14" ry="7" fill="#fff"/></g>
      ${pins}</svg>`;
  }

  function renderMap() {
    const sel = CITY[S.sel || 'tokio'], open = !!S.open[sel.id], m = open ? mastery(sel, S.rest[sel.id]) : null;
    const dishes = sel.dishes.map(d => {
      const un = open && m.complete;
      return `<div class="jp-dish ${un ? '' : ''}"><b>${({ ramen: '🍜', salteados: '🥘', frituras: '🍤', makis: '🍣' })[d[1]]} ${d[0]}</b><span>${d[2]}</span></div>`;
    }).join('');
    const net = open ? netOf(sel, S.rest[sel.id]) : 0;
    return `<div class="jp-body"><div class="jp-map">${mapSvg()}</div>
      <div class="jp-side"><h3>${sel.name} <small>· ${sel.region}</small></h3><small>${sel.story}</small>
        ${dishes}
        <small>${open ? `Local abierto · neto ${net >= 0 ? '+' : ''}${fmt1(net * 60)}/h · Maestría ${m.done}/${m.total}${m.complete ? ' ✅ mejoras de platos ganadas' : ''}` : 'Al completar la Maestría de este local ganas la mejora de cada uno de estos platos (+8 % de pago al servirlo). Los platos están disponibles en el juego igualmente.'}</small>
        <button class="jp-btn ${open ? '' : 'red'}" onclick="JP.open('${sel.id}')">${open ? '🏮 Entrar al restaurante' : `Abrir local · S/ ${fmt(sel.cost)}`}</button></div></div>`;
  }

  function renderRest() {
    const c = CITY[S.cur], r = rs(), ev = evalRest(c, r), m = mastery(c, r);
    r.net = ev.net;
    return `<div class="jp-scenehost" id="jp-scene-host">
      <div class="jp-hudL"><button class="jp-btn red" onclick="JP.play()">🎮 Jugar aquí</button><button class="jp-btn" onclick="JP.collect()">💴 Recolectar</button><button class="jp-btn ghost" onclick="JP.fin()">📊 Finanzas</button>
        <div class="jp-capchip"><div class="jp-bar"><b id="jp-capbar" style="width:${Math.round(100 * Math.min(1, r.since / (capHours(r) * 60)))}%"></b></div><small>Caja: tope ${capHours(r).toFixed(1)} h · Maestría ${m.done}/${m.total} · tiempo acelerado</small></div></div></div>`;
  }

  const hireRow = (c, r, z) => {
    const s = r.staff[z], info = ZONE_INFO[z], max = staffMax(r, z), id = c.id;
    const nextHire = s.n < max ? `<button class="jp-btn" onclick="JP.hire('${z}')">Contratar · S/ ${fmt(costHire(id, z, s.n))}</button>` : '<small>Puestos llenos</small>';
    const nextLvl = s.l < 5 && s.n > 0 ? `<button class="jp-btn" onclick="JP.level('${z}')">Nivel ${s.l + 1} · S/ ${fmt(costLevel(id, z, s.l, s.n))}</button>` : (s.l >= 5 ? '<small>Nivel máx.</small>' : '');
    const tb = z === 'salon' ? T.waiter : (KITCHENS.includes(z) ? T.cook : null);
    const stats = tb ? `Vel ${tb.spd[lvIdx(s.l)].toFixed(2)}/min · errores ${Math.round(tb.err[lvIdx(s.l)] * 100)}% · sueldo ${tb.wage[lvIdx(s.l)].toFixed(2)}/min c/u` : `sueldo ${T.aux.wage[lvIdx(s.l)].toFixed(2)}/min c/u`;
    return `<div class="jp-row"><div>👥 ${info.role}: ${s.n}/${max} · Nivel ${s.l}<small>${stats}</small></div>${nextHire}${nextLvl}</div>`;
  };
  const objRows = (c, r, z) => OBJECTS[z].map((o, i) => {
    const have = !!r.objs[o[0] + '@' + z], fx = o[3], b = o[4];
    const txt = [fx.spd && `+${Math.round(fx.spd * 100)}% velocidad`, fx.err && `−${Math.round(fx.err * 100)} pts de errores`, fx.cogs && `−${Math.round(fx.cogs * 100)} pts de costo de ingredientes`, fx.rep && `+${Math.round(fx.rep * 100)}% demanda`, fx.cap && `+${fx.cap} h de tope de caja`, fx.leak && `−${Math.round(fx.leak * 100)} pts de pérdidas de cobro`, fx.w && `luz +${fx.w}/min`].filter(Boolean).join(' · ');
    return `<div class="jp-row jp-obj ${have ? 'have' : ''}"><span class="ic">${o[1]}</span><div>${o[2]}<small>${txt}</small><small>🔓 Permanente en el juego: +${(b.v * 100).toFixed(b.v < 0.01 ? 1 : 0)}% ${BUFF_NAMES[b.k]}</small></div>${have ? '<small>✔ Comprado</small>' : `<button class="jp-btn" onclick="JP.obj('${z}',${i})">S/ ${fmt(costObj(c.id, i))}</button>`}</div>`;
  }).join('');

  function renderZone() {
    const c = CITY[S.cur], r = rs(), z = S.zone;
    let head = '', body = '';
    if (z === 'local') {
      head = '🏠 Local';
      const tier = T.tiers[r.tier - 1];
      body = `<div class="jp-row"><div>${tier.name}<small>Hasta ${tier.tables} mesas · renta ${tier.rent.toFixed(2)}/min · puestos: ${tier.cooks} cocineros, ${tier.waiters} mozos</small></div>${r.tier < 4 ? `<button class="jp-btn" onclick="JP.tier()">Ampliar · S/ ${fmt(costTier(c.id, r.tier))}</button>` : '<small>Máximo</small>'}</div>`
        + `<small style="color:#6b5a3a">Más espacio permite más mesas y personal, pero sube la renta y la luz.</small>`;
    } else {
      head = ZONE_INFO[z].icon + ' ' + ZONE_INFO[z].name;
      if (KITCHENS.includes(z) && !r.areas[z]) {
        body = `<div class="jp-row"><div>Cocina cerrada<small>Platos: ${c.dishes.filter(d => d[1] === z).map(d => d[0]).join(', ')}</small></div><button class="jp-btn red" onclick="JP.area('${z}')">Abrir · S/ ${fmt(costArea(c.id, Object.values(r.areas).filter(Boolean).length))}</button></div>`;
      } else {
        body = hireRow(c, r, z);
        if (z === 'salon') body += `<div class="jp-row"><div>🪑 Mesas ${r.tables}/${T.tiers[r.tier - 1].tables}<small>Cada mesa trae clientes y consume luz y agua</small></div>${r.tables < T.tiers[r.tier - 1].tables ? `<button class="jp-btn" onclick="JP.table()">+1 mesa · S/ ${fmt(costTable(c.id, r.tables))}</button>` : '<small>Sin espacio</small>'}</div>`;
        if (z === 'depo') body += `<div class="jp-row"><div>⭐ Calidad de ingredientes ${r.q}/5<small>Platos +${Math.round(T.quality.price * (r.q - 1) * 100)}% de precio · ingredientes cuestan ${Math.round((T.quality.base + T.quality.cogs * (r.q - 1)) * 100)}% del plato</small></div>${r.q < 5 ? `<button class="jp-btn" onclick="JP.qual()">Mejorar · S/ ${fmt(costQual(c.id, r.q))}</button>` : '<small>Máxima</small>'}</div>`;
        if (KITCHENS.includes(z)) body += `<small style="color:#6b5a3a">Platos: ${c.dishes.filter(d => d[1] === z).map(d => d[0]).join(', ')}</small>`;
        body += objRows(c, r, z);
      }
    }
    return `<div class="jp-dock" style="width:${dockW()}px"><h3><span>${head}</span><span><span class="jp-chip" style="background:#7a1f1f;color:#fff4d6">💴 S/ ${fmt(S.fondo)}</span> <button class="jp-btn red" onclick="JP.close()">✕</button></span></h3>${body}</div>`;
  }

  function renderFin() {
    const c = CITY[S.cur], r = rs(), ev = evalRest(c, r), h = 60, m = mastery(c, r);
    const row = (t, v, neg) => `<tr><td>${t}</td><td class="${neg ? 'neg' : ''}">${neg ? '−' : ''}${fmt1(Math.abs(v) * h)}</td></tr>`;
    return `<div class="jp-modal" onclick="JP.fin()"><div class="jp-card jp-fin" onclick="event.stopPropagation()"><h3><span>📊 Finanzas de ${c.name} (S/ por hora)</span><button class="jp-btn red" onclick="JP.fin()">✕</button></h3>
      <table>${row('Ventas (platos bien servidos)', ev.rev, false)}${row('Pérdidas de cobro', ev.leak, true)}${row('Ingredientes (incluye los de platos con error)', ev.ing, true)}${row('Planilla (sueldos)', ev.wages, true)}${row('Renta del local', ev.rent, true)}${row('Luz (mesas, local, aparatos)', ev.elec, true)}${row('Agua', ev.water, true)}
      <tr><td><b>Neto</b></td><td class="${ev.net >= 0 ? 'pos' : 'neg'}"><b>${ev.net >= 0 ? '+' : '−'}${fmt1(Math.abs(ev.net) * h)}</b></td></tr></table>
      <small>Errores: se pierden S/ ${fmt1(ev.lost * h)}/h en platos mal hechos o mal servidos. Demanda ${(ev.demand * 60).toFixed(0)} platos/h, atendidos ${(ev.served * 60).toFixed(0)}/h. Reputación ×${ev.R.toFixed(2)}.</small>
      <small>Offline: acumulas hasta ${capHours(r).toFixed(1)} h; tu actividad reciente rinde al ${Math.round(actMult() * 100)}% (juega Campaña, Rash o Retos para subirla).</small>
      <h3 style="font-size:14px">🏆 Maestría ${m.done}/${m.total}</h3><div class="jp-mast">${m.checks.map(x => `<span class="${x.ok ? 'ok' : 'no'}">${x.ok ? '✔' : '○'} ${x.t}</span>`).join('')}</div>
      <small>Al completar la Maestría ganas la mejora de sus platos (+8 % de pago al servirlos): ${c.dishes.map(d => d[0]).join(', ')}.</small></div></div>`;
  }

  const UP = (z, r, id) => {                                         // ¿hay una mejora pagable en esa zona?
    const f = S.fondo;
    if (z === 'local') return r.tier < 4 && costTier(id, r.tier) <= f;
    if (KITCHENS.includes(z) && !r.areas[z]) return costArea(id, Object.values(r.areas).filter(Boolean).length) <= f;
    const s = r.staff[z];
    if (s.n < staffMax(r, z) && costHire(id, z, s.n) <= f) return true;
    if (s.n > 0 && s.l < 5 && costLevel(id, z, s.l, s.n) <= f) return true;
    if (z === 'salon' && r.tables < T.tiers[r.tier - 1].tables && costTable(id, r.tables) <= f) return true;
    if (z === 'depo' && r.q < 5 && costQual(id, r.q) <= f) return true;
    return (OBJECTS[z] || []).some((o, i) => !r.objs[o[0] + '@' + z] && costObj(id, i) <= f);
  };
  function sceneState() {
    if (!S.cur || !S.rest[S.cur]) return null;
    const c = CITY[S.cur], r = S.rest[S.cur], ev = evalRest(c, r);
    return { c, r, ev, fmt, OBJ: OBJECTS, pm: 1 + T.quality.price * (r.q - 1), tierName: T.tiers[r.tier - 1].name, tierTables: T.tiers[r.tier - 1].tables,
      canUp: z => UP(z, r, c.id), costArea: () => costArea(c.id, Object.values(r.areas).filter(Boolean).length), staffMax: z => staffMax(r, z), hasObj: k => !!r.objs[k] };
  }
  function render() {
    load(); css();
    if (window.JPScene) window.JPScene.detach();
    let el = document.getElementById('jp-screen');
    if (!el) { el = document.createElement('div'); el.id = 'jp-screen'; document.body.appendChild(el); }
    const inRest = S.view === 'rest' && S.cur && S.rest[S.cur];
    const title = inRest ? `🏮 ${CITY[S.cur].name}` : '🗾 Recorrido por Japón';
    const top = `<div class="jp-top"><button class="jp-btn ghost" onclick="${inRest ? 'JP.map()' : 'JP.exit()'}">${inRest ? '← Mapa' : '← Menú'}</button><h2>${title}</h2>
      ${inRest ? `<span class="jp-chip">Caja <b id="jp-cash">S/ ${fmt(rs().cash)}</b></span><span class="jp-chip ${rs().net >= 0 ? 'pos' : 'neg'}"><b id="jp-net" class="${rs().net >= 0 ? 'pos' : 'neg'}">${rs().net >= 0 ? '+' : ''}${fmt1(rs().net * 60)}/h</b></span>` : ''}
      <span class="jp-chip" id="jp-cloud" style="font-size:11px"></span><span class="jp-chip" title="Fondo: soles de Campaña, Rash, Retos y de las cajas">💴 Fondo <b>S/ ${fmt(S.fondo)}</b></span></div>`;
    el.innerHTML = top + (inRest ? renderRest() : renderMap()) + (inRest && S.zone ? renderZone() : '') + (inRest && S.fin ? renderFin() : '') + (inRest && S.playOpen ? renderPlay() : '');
    syncUi();
    if (inRest && window.JPScene) window.JPScene.mount(document.getElementById('jp-scene-host'), sceneState);
    else if (window.JPScene) window.JPScene.destroy();
  }

  function open() {
    load();
    const res = catchUp();
    S.view = S.view === 'rest' && S.cur && S.rest[S.cur] ? 'rest' : 'map';
    S.sel = S.sel || 'tokio';
    S.zone = null; S.fin = false;
    render(); start();
    if (res.away > MIN_LIVE && res.total > 0) toast(`🏮 Mientras no estabas (${Math.round(res.away / 60 * 10) / 10} h) tus locales sumaron S/ ${fmt(res.total)} en caja (al ${Math.round(actMult() * 100)}% por tu actividad).`);
    else if (res.away > MIN_LIVE && res.total < 0) toast('⚠️ Tus locales perdieron dinero mientras no estabas.');
  }

  // ---------- jugar aquí: una jornada en el local (elige dificultad y cuántas áreas abrir) ----------
  const DIFFS = [
    { name: 'Fácil', icon: '🌱', time: 240, spawn: 11, orders: 1, cust: 2, pat: 1.5, mult: 0.8, min: 15, desc: 'Clientes pacientes y de a pocos' },
    { name: 'Normal', icon: '🍜', time: 270, spawn: 8, orders: 1, cust: 3, pat: 1.15, mult: 1.0, min: 22, desc: 'El ritmo de un día normal' },
    { name: 'Difícil', icon: '🔥', time: 300, spawn: 6.5, orders: 2, cust: 3, pat: 0.9, mult: 1.4, min: 30, desc: 'Pedidos dobles y poca paciencia' },
    { name: 'Maestro', icon: '👹', time: 330, spawn: 5, orders: 3, cust: 4, pat: 0.7, mult: 2.0, min: 38, desc: 'Hora pico: hasta tres pedidos y mucha prisa' }
  ];
  const areasMult = n => 1 + 0.3 * (n - 1);                                   // más áreas activas, más recompensa
  const AREA_ICON = { ramen: '🍜', salteados: '🥘', frituras: '🍤', makis: '🍣' };
  const runOf = () => (typeof gameState !== 'undefined' && gameState.japon) || null;
  window.japonRunAreas = () => (runOf() ? runOf().areas : []);
  window.japonFirstArea = () => (runOf() && runOf().areas[0]) || 'ramen';
  window.japonRunDishes = () => { const r = runOf(); return new Set(r ? CITY[r.city].dishes.filter(d => r.areas.includes(d[1])).map(d => d[0]) : []); };
  window.japonRunConfig = () => {
    const r = runOf(), d = DIFFS[r ? r.diff : 1];
    return { level: 1, name: r ? r.cityName : 'Local', customers: 999, base_patience: 40, max_orders: d.orders, max_customers: d.cust, ramen_names: [...window.japonRunDishes()], spawn_time: d.spawn, patience_mult: d.pat, goal: 0, time: d.time, min_score: d.min };
  };
  const playSel = r => { if (!r.play) { const open = Object.keys(r.areas).filter(a => r.areas[a]); r.play = { d: 1, a: open.slice(0, 1) }; } r.play.a = r.play.a.filter(a => r.areas[a]); if (!r.play.a.length) r.play.a = Object.keys(r.areas).filter(a => r.areas[a]).slice(0, 1); return r.play; };
  function renderPlay() {
    const c = CITY[S.cur], r = rs(), p = playSel(r), d = DIFFS[p.d], mult = d.mult * areasMult(p.a.length);
    const diffs = DIFFS.map((x, i) => `<div class="jp-opt ${p.d === i ? 'sel' : ''}" onclick="JP.pdiff(${i})"><b>${x.icon} ${x.name}</b><small>${x.desc}</small><em>×${x.mult.toFixed(1)}</em></div>`).join('');
    const areas = c.areas.map(a => { const open = !!r.areas[a], on = p.a.includes(a), ds = c.dishes.filter(q => q[1] === a).map(q => q[0]).join(', ');
      return `<div class="jp-opt ${on ? 'sel' : ''} ${open ? '' : 'off'}" ${open ? `onclick="JP.parea('${a}')"` : ''}><b>${AREA_ICON[a]} ${ZONE_INFO[a].name}</b><small>${open ? ds : 'Cocina cerrada: ábrela en el local'}</small></div>`; }).join('');
    return `<div class="jp-modal" onclick="JP.pclose()"><div class="jp-card" onclick="event.stopPropagation()"><h3><span>🎮 Jugar en ${c.name}</span><button class="jp-btn red" onclick="JP.pclose()">✕</button></h3>
      <div><b style="font-size:12px">Dificultad</b><div class="jp-opts">${diffs}</div></div>
      <div><b style="font-size:12px">Áreas activas (${p.a.length}/${c.areas.length})</b><div class="jp-opts">${areas}</div></div>
      <div class="jp-row"><div>⏱️ ${Math.round(d.time / 60 * 10) / 10} min · Recompensa <b>×${mult.toFixed(2)}</b> del dinero que recaudes<small>(${d.name} ×${d.mult.toFixed(1)}) × (${p.a.length} área${p.a.length > 1 ? 's' : ''} ×${areasMult(p.a.length).toFixed(1)}) · +10 % si no pierdes clientes · va a la caja de ${c.name}${r.best ? ` · mejor: S/ ${fmt(r.best)}` : ''}</small></div><button class="jp-btn red" onclick="JP.pstart()">▶ Empezar jornada</button></div></div></div>`;
  }
  function endRun(reason) {
    const jr = runOf(); if (!jr || jr.ended) return null;
    jr.ended = true;
    gameState.isGameOver = true; try { clearInterval(gameLoopInterval); } catch (e) {} try { resetCookingStations(); } catch (e) {}
    try { AnalyticsTracker.endSession('COMPLETED'); } catch (e) {}
    load();
    const d = DIFFS[jr.diff], money = Math.max(0, Math.round(gameState.money || 0)), mult = d.mult * areasMult(jr.areas.length), perfect = gameState.customersLost === 0 && gameState.customersServed > 0;
    const reward = Math.round(money * mult * (perfect ? 1.1 : 1) * (reason === 'abandon' ? 0.5 : 1));
    const r = S.rest[jr.city];
    if (r) { r.cash += reward; r.cashIn += reward; r.runs = (r.runs || 0) + 1; r.best = Math.max(r.best || 0, reward); }
    const mins = runStart ? Math.min(60, (Date.now() - runStart) / 60000) : 0;
    S.act[dayKey()] = (S.act[dayKey()] || 0) + mins;
    save();
    const res = { reason, city: jr.cityName, diff: d, areas: jr.areas, money, mult, perfect, reward, served: gameState.customersServed || 0, lost: gameState.customersLost || 0, tips: gameState.propinasSession || 0 };
    jr.result = res;
    if (reason !== 'abandon') showResult(res);
    return res;
  }
  window.japonEnd = endRun;
  function showResult(res) {
    css();
    const el = document.createElement('div'); el.id = 'jp-result'; el.className = 'jp-resultbox';
    el.innerHTML = `<div class="jp-card" style="max-width:520px"><h3><span>🏮 Jornada en ${res.city} terminada</span></h3>
      <div class="jp-stats"><div><b>S/ ${res.money}</b><small>Recaudado</small></div><div><b>${res.served}</b><small>Servidos</small></div><div><b>${res.lost}</b><small>Perdidos</small></div><div><b>🧧 ${res.tips}</b><small>Propinas</small></div></div>
      <div class="jp-row"><div>${res.diff.icon} ${res.diff.name} · ${res.areas.length} área${res.areas.length > 1 ? 's' : ''}<small>×${res.mult.toFixed(2)}${res.perfect ? ' · +10 % por no perder clientes' : ''}</small></div><div style="flex:0 0 auto;text-align:right;font-size:16px;font-weight:900;color:#2e7d32">+S/ ${res.reward}<small>a la caja de ${res.city}</small></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button class="jp-btn" onclick="JP.again()">🔄 Otra jornada</button><button class="jp-btn red" onclick="JP.back()">🏮 Volver al local</button></div></div>`;
    document.body.appendChild(el);
    try { playSound('serve'); } catch (e) {}
  }
  Object.assign(A, {
    play() { const r = rs(); if (!Object.keys(r.areas).some(a => r.areas[a])) return toast('Abre primero una cocina.'); S.playOpen = true; refresh(); },
    pclose() { S.playOpen = false; refresh(); },
    pdiff(i) { playSel(rs()).d = i; refresh(); },
    parea(a) { const p = playSel(rs()), k = p.a.indexOf(a); if (k >= 0) { if (p.a.length > 1) p.a.splice(k, 1); } else p.a.push(a); refresh(); },
    pstart() { const r = rs(), c = CITY[S.cur], p = playSel(r); S.playOpen = false; save(); beginRun(c.id, p.a.slice(), p.d); },
    again() { const jr = runOf(); const box = document.getElementById('jp-result'); if (box) box.remove(); if (!jr) return; beginRun(jr.city, jr.areas.slice(), jr.diff); },
    back() { const box = document.getElementById('jp-result'); if (box) box.remove(); try { returnToStartMenu(); } catch (e) { console.warn(e); } }
  });
  function beginRun(city, areas, diff) {
    stop(); if (window.JPScene) window.JPScene.destroy();
    const el = document.getElementById('jp-screen'); if (el) el.remove();
    S.view = 'rest'; S.cur = city; save();
    gameState.japon = { city, cityName: CITY[city].name, areas, diff, ended: false };
    const prev = startSelectedMode; startSelectedMode = 'JAPON';
    try { executeStartGame(); } finally { startSelectedMode = prev; }
  }
  window.JP = Object.assign(window.JP || {}, A);

  // ---------- guardado en la nube (por cuenta) ----------
  // Se guarda una instantánea del progreso (Japón + nivel de Rash + tutorial) con número de revisión. Al combinar con el servidor los
  // contadores (ganado, gastado, caja) se suman por diferencia con lo último sincronizado y lo estructural (niveles, objetos, mesas…) toma el mayor,
  // así dos dispositivos de la misma cuenta no se pisan ni duplican. Los datos de otra cuenta nunca se mezclan: se guardan aparte y se restauran al volver.
  const STASH_KEY = 'ramen_game_stash', RASH_KEY = 'ramen_mania_rash_level', TUT_KEY = 'ramen_tutorial_completed';
  const syncMeta = () => (S.sync || (S.sync = { owner: null, rev: 0, base: null, dirty: false, status: 'off', lastSig: null }));
  const nz = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);
  const clone = o => JSON.parse(JSON.stringify(o));
  let syncing = false, syncTimer = 0;
  function snapshot() {
    load();
    const rest = {};
    Object.keys(S.rest).forEach(id => { const r = S.rest[id];
      rest[id] = { tier: r.tier, tables: r.tables, q: r.q, staff: r.staff, areas: r.areas, objs: r.objs, cashIn: r.cashIn, cashOut: r.cashOut, runs: r.runs || 0, best: r.best || 0, t: r.t, since: r.since }; });
    return { v: 1, japon: { lifetime: S.lifetime, spent: S.spent, open: S.open, rest, act: S.act }, rash: parseInt(store().getItem(RASH_KEY) || '1', 10) || 1, tut: store().getItem(TUT_KEY) === 'true', tuts: (typeof Guia !== 'undefined' ? Guia.flags() : {}), rec: (typeof reconGet === 'function' ? reconGet() : { best: {}, runs: 0 }) };
  }
  function ledgers(g) {
    const jp = (g && g.japon) || {}, rest = {};
    Object.keys(jp.rest || {}).forEach(id => { const r = jp.rest[id]; rest[id] = { cashIn: nz(r.cashIn), cashOut: nz(r.cashOut), runs: nz(r.runs) }; });
    return { lifetime: nz(jp.lifetime), spent: nz(jp.spent), rest };
  }
  function mergeGame(l, sv, base) {
    const out = clone(sv && sv.v === 1 ? sv : { v: 1, japon: { lifetime: 0, spent: 0, open: {}, rest: {}, act: {} }, rash: 1, tut: false });
    out.japon = out.japon || {}; const lj = l.japon || {}, oj = out.japon;
    oj.rest = oj.rest || {}; oj.open = oj.open || {}; oj.act = oj.act || {};
    const add = (lv, svv, bv) => nz(svv) + Math.max(0, nz(lv) - nz(bv));
    oj.lifetime = add(lj.lifetime, oj.lifetime, base && base.lifetime);
    oj.spent = add(lj.spent, oj.spent, base && base.spent);
    Object.assign(oj.open, lj.open || {});
    Object.keys(lj.rest || {}).forEach(id => {
      const lr = lj.rest[id], sr = oj.rest[id], br = base && base.rest && base.rest[id];
      if (!sr) { oj.rest[id] = clone(lr); return; }
      ['tier', 'tables', 'q', 'best'].forEach(k => { sr[k] = Math.max(nz(sr[k]), nz(lr[k])); });
      sr.staff = sr.staff || {};
      Object.keys(lr.staff || {}).forEach(z => { const a = sr.staff[z] || { n: 0, l: 1 }, b = lr.staff[z]; sr.staff[z] = { n: Math.max(nz(a.n), nz(b.n)), l: Math.max(nz(a.l, 1), nz(b.l, 1)) }; });
      sr.areas = Object.assign({}, sr.areas, ...[lr.areas || {}].map(o => Object.fromEntries(Object.entries(o).filter(([, v]) => v))));
      sr.objs = Object.assign({}, sr.objs, lr.objs || {});
      sr.cashIn = add(lr.cashIn, sr.cashIn, br && br.cashIn); sr.cashOut = add(lr.cashOut, sr.cashOut, br && br.cashOut); sr.runs = add(lr.runs, sr.runs, br && br.runs);
      sr.since = nz(lr.t) >= nz(sr.t) ? nz(lr.since) : nz(sr.since); sr.t = Math.max(nz(sr.t), nz(lr.t));
    });
    Object.keys(lj.act || {}).forEach(d => { oj.act[d] = Math.max(nz(oj.act[d]), nz(lj.act[d])); });
    out.rash = Math.max(nz(out.rash, 1), nz(l.rash, 1)); out.tut = !!(out.tut || l.tut);
    out.tuts = Object.assign({}, out.tuts || {}, l.tuts || {});
    out.rec = out.rec || { best: {}, runs: 0 }; out.rec.best = out.rec.best || {};
    Object.keys((l.rec && l.rec.best) || {}).forEach(k => { const b = l.rec.best[k], o = out.rec.best[k]; if (b && (!o || nz(b.t, 1e9) < nz(o.t, 1e9))) out.rec.best[k] = b; });
    out.rec.runs = Math.max(nz(out.rec.runs), nz(l.rec && l.rec.runs));
    return out;
  }
  function applySnap(g) {
    load(); const jp = g.japon || {};
    S.lifetime = nz(jp.lifetime); S.spent = nz(jp.spent); S.fondo = Math.max(0, S.lifetime - S.spent);
    S.open = Object.assign({ tokio: true }, jp.open || {});
    S.act = jp.act || {};
    const rest = {};
    Object.keys(S.open).forEach(id => { if (!CITY[id]) return; const old = S.rest[id], src = (jp.rest || {})[id] || (old ? null : newRest(CITY[id]));
      if (!src) { rest[id] = old; return; }
      const r = Object.assign(newRest(CITY[id]), clone(src)); r.cash = Math.max(0, nz(r.cashIn) - nz(r.cashOut)); r.cashIn = nz(r.cashIn); r.cashOut = nz(r.cashOut);
      if (old && old.play) r.play = old.play; rest[id] = r; });
    S.rest = rest;
    try { if ((g.rash || 1) > (parseInt(store().getItem(RASH_KEY) || '1', 10) || 1)) store().setItem(RASH_KEY, String(Math.min(100, g.rash))); if (g.tut) store().setItem(TUT_KEY, 'true'); } catch (e) {}
    try { if (g.rec && typeof reconMerge === 'function') reconMerge(g.rec); } catch (e) {}
    try { if (g.tuts) { const cur = JSON.parse(store().getItem('ramen_tut_areas') || '{}') || {}; store().setItem('ramen_tut_areas', JSON.stringify(Object.assign({}, cur, g.tuts))); } } catch (e) {}
    persist();
  }
  function resetJapon() { S.fondo = 0; S.lifetime = 0; S.spent = 0; S.open = { tokio: true }; S.rest = { tokio: newRest(CITY.tokio) }; S.act = {}; S.cur = null; S.view = null; S.sync = { owner: null, rev: 0, base: null, dirty: false, status: 'sync', lastSig: null }; }
  function syncUi() {
    const el = document.getElementById('jp-cloud'); if (!el || !S) return;
    const st = syncMeta().status;
    el.textContent = { ok: '☁️ guardado', sync: '☁️ …', error: '⚠️ sin nube', off: '📱 solo aquí' }[st] || '☁️'; el.title = { ok: 'Tu progreso está guardado en tu cuenta', sync: 'Sincronizando…', error: 'No se pudo guardar en la nube: se reintentará. Tu progreso está a salvo en este dispositivo.', off: 'Sin cuenta conectada: el progreso se guarda solo en este dispositivo' }[st] || '';
  }
  function syncSoon(now) { clearTimeout(syncTimer); const m = S && syncMeta(); const wait = (m && m.status === 'error' && Date.now() - (m.failAt || 0) < 30000) ? 30000 : (now ? 50 : 3500); syncTimer = setTimeout(syncNow, wait); }
  async function syncNow() {
    if (syncing || typeof cloudCall !== 'function' || typeof CloudAuth === 'undefined') return;
    load(); const m = syncMeta();
    const accId = CloudAuth.kind === 'key' ? CloudAuth.accountId : (CloudAuth.deviceAccountId || CloudAuth.accountId);
    if (!CloudAuth.token || !accId) { m.status = 'off'; syncUi(); return; }
    syncing = true; m.status = 'sync'; syncUi();
    try {
      let d = await cloudCall('get_game', {});
      if (!d || !d.ok) { m.status = 'error'; return; }
      if (m.owner && m.owner !== accId) {                                   // otra cuenta: lo de la anterior se guarda aparte y no se mezcla
        try { store().setItem(STASH_KEY + '_' + m.owner, JSON.stringify({ owner: m.owner, snap: snapshot(), sync: m })); } catch (e) {}
        let stash = null; try { stash = JSON.parse(store().getItem(STASH_KEY + '_' + accId) || 'null'); } catch (e) {}
        resetJapon(); const mm = syncMeta();
        if (stash && stash.owner === accId) { applySnap(stash.snap); S.sync = Object.assign(mm, stash.sync || {}); }
        S.sync.owner = accId; S.sync.status = 'sync';
      }
      const m2 = syncMeta(); if (!m2.owner) m2.owner = accId;
      const server = d.game && d.game.v === 1 ? d.game : null, local = snapshot();
      let base = m2.base;
      if (server && m2.lastSig && server.sig === m2.lastSig) base = ledgers(server);        // el servidor ya trae nuestro último envío (aunque no llegó la respuesta)
      let merged = server ? mergeGame(local, server, base) : local, rev = d.rev || 0, ref = server;
      applySnap(merged);
      if (!server || m2.dirty || server.sig !== m2.lastSig) {
        for (let i = 0; i < 3; i++) {
          const sig = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); merged.sig = sig; m2.lastSig = sig;
          const r = await cloudCall('save_game', { p_game: merged, p_base_rev: rev });
          if (!r || !r.ok) { m2.status = 'error'; return; }
          if (!r.conflict) { m2.rev = r.rev; m2.base = ledgers(merged); m2.dirty = false; m2.status = 'ok'; break; }
          merged = mergeGame(merged, r.game, ledgers(ref)); ref = r.game; rev = r.rev; applySnap(merged);
          if (i === 2) { m2.status = 'error'; return; }
        }
      } else { m2.rev = rev; m2.base = ledgers(merged); m2.dirty = false; m2.status = 'ok'; }
      persist(); updateChip(); if (S.view === 'rest' || S.view === 'map') { try { render(); } catch (e) {} }
    } catch (e) { syncMeta().status = 'error'; }
    finally { syncing = false; if (syncMeta().status === 'error') syncMeta().failAt = Date.now(); persist(); syncUi(); }
  }
  window.japonSyncSoon = () => { try { load(); syncMeta().dirty = true; syncSoon(); } catch (e) {} };
  window.japonSyncAccount = () => { setTimeout(() => { load(); syncNow(); }, 400); };
  document.addEventListener('visibilitychange', () => { if (S) persist(); if (document.hidden && S && syncMeta().dirty) syncSoon(true); });
  window.addEventListener('pagehide', () => { if (S) persist(); });
  setInterval(() => { if (S && syncMeta().dirty && !document.hidden) syncSoon(true); }, 60000);

  // ---------- ganchos con el juego ----------
  let runStart = 0, lastRun = null;
  function wrap(name, fn) { const o = window[name]; if (typeof o === 'function' && !o._jp) { const w = function () { try { fn.apply(this, arguments); } catch (e) { console.warn(name, e); } return o.apply(this, arguments); }; w._jp = true; window[name] = w; } }
  function onRunEnd() {
    try {
      load();
      const mode = gameState.gameMode;
      if (!['NORMAL', 'RASH', 'TRAINING'].includes(mode)) return;                // la jornada en un local (JAPON) paga a la caja de ese local, no al Fondo
      const key = mode + ':' + runStart + ':' + (gameState.rashLevel || 0) + ':' + (typeof currentLevelIndex !== 'undefined' ? currentLevelIndex : 0);
      if (lastRun === key) return;
      lastRun = key;
      const money = Math.max(0, Math.round(gameState.money || 0));
      const mins = runStart ? Math.min(60, (Date.now() - runStart) / 60000) : 0;
      S.fondo += money; S.lifetime += money;
      S.act[dayKey()] = (S.act[dayKey()] || 0) + mins;
      Object.keys(S.act).forEach(k => { if (+k < dayKey() - 7) delete S.act[k]; });
      save(); updateChip();
    } catch (e) {}
  }
  function install() {
    wrap('executeStartGame', () => { runStart = Date.now(); });
    // al salir de la jornada (terminada o abandonada) se vuelve al restaurante; abandonar paga solo la mitad
    const origBack = window.returnToStartMenu;
    if (typeof origBack === 'function' && !origBack._jp) {
      const w = function () {
        const jr = runOf(); let res = null;
        if (jr) { if (!jr.ended) res = endRun('abandon'); else res = jr.result; }
        const r = origBack.apply(this, arguments);
        if (jr) { gameState.japon = null; gameState.gameMode = 'NORMAL'; setTimeout(() => { japonOpen(); if (res && res.reason === 'abandon') toast('Jornada interrumpida: +S/ ' + res.reward + ' (la mitad) a la caja.'); }, 60); }
        return r;
      };
      w._jp = true; window.returnToStartMenu = w;
    }
    wrap('recordGameScoreAutomatically', onRunEnd);
    // botón en la barra superior del menú
    const wal = document.querySelector('.start-top-right .start-wallet-chip');
    if (wal && !document.getElementById('jp-menu-btn')) {
      const btn = document.createElement('button');
      btn.className = 'start-wallet-chip'; btn.id = 'jp-menu-btn'; btn.setAttribute('onclick', 'japonOpen()');
      btn.title = 'Recorrido por Japón: restaurantes que producen aunque no juegues';
      btn.innerHTML = '🗾 <span id="jp-menu-fondo">Japón</span>';
      wal.parentNode.insertBefore(btn, wal);
    }
    updateChip();
  }
  function updateChip() { load(); const st = document.getElementById('jp-menu-fondo'); if (st) st.textContent = 'Japón · S/ ' + fmt(S.fondo); }
  window.JP = Object.assign({}, A);
  window.japonOpen = open;
  window.japonBuff = japonBuff;
  window.japonDishBonus = japonDishBonus;
  window.JP_TEST = { reload() { S = null; syncing = false; return load(); }, syncNow, getS: () => S, mergeGame, snapshot, ledgers, A, CITIES, T, evalRest, newRest, mastery, costHire, costLevel, costObj, costTable, costTier, costQual, costArea, OBJECTS, staffMax };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  }
})();
