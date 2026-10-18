// Simulación Monte Carlo del modo RASH con los datos reales del juego: ¿se puede superar cada ronda?
// Para cada ronda simula N partidas de tres perfiles de jugador y estima la probabilidad de superarla (servir a todos los clientes
// de la ronda sin quedarte sin vidas). Es una ESTIMACIÓN (un cocinero que atiende de uno en uno, tiempos de trabajo del modelo de
// tools/economia-niveles.cjs, igual que tools/simular-campana.cjs); la dificultad real se confirma jugando en el celular.
// Reglas tomadas del juego: getRashConfig (clientes, paciencia base, pedidos y clientes máximos, llegada), vidas = 5 + (ronda − 1),
// cada cliente perdido cuesta 1 vida, un plato rechazado quita 15 % de la paciencia, platos y áreas abiertas por ronda (AREA_DISH_UNLOCKS),
// paciencia = base + 8 s por pedido extra + segundos de proceso (con etapas siempre activas en las áreas abiertas).
// --cap = trabajo simultáneo del jugador (1 = de uno en uno; el real rinde más por los 3 cuencos, 2 woks y la Producción por tandas): SIN calibrar.
// Uso:  node tools/simular-rash.cjs [--n 300] [--seed 20261018] [--cap 1.3] [--rondas 1,5,10,20,50,100]
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('n', 300), SEED = +arg('seed', 20261018), CAP = +arg('cap', 1.3);
const RONDAS = arg('rondas', '1,2,3,5,8,10,12,15,20,25,30,40,50,60,70,80,90,100').split(',').map(Number);

const src = [fs.readFileSync(path.join(root, 'index.html'), 'utf8'), ...fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8'))].join('\n');
const grab = n => eval('(' + src.match(new RegExp('const ' + n + ' = (\\[[\\s\\S]*?\\n\\]);'))[1] + ')');
const R = { ramen: grab('RECETAS_RAMEN'), salteados: grab('RECETAS_SALTEADOS'), makis: grab('RECETAS_MAKIS'), frituras: grab('RECETAS_FRITURAS') };
const UNLOCKS = eval('(' + src.match(/const AREA_DISH_UNLOCKS = (\{[\s\S]*?\n\});/)[1] + ')');
const obj = n => eval('(' + src.match(new RegExp('const ' + n + ' = (\\{[^}]*\\})'))[1] + ')');
const PAY_REJECT = +src.match(/const QUALITY_REJECT_PATIENCE = ([\d.]+)/)[1];
const PROC = obj('AREA_PROCESS_SECONDS'), STX = obj('ST_EXTRA_SECONDS'), SINGLE_X = +src.match(/const SINGLE_STATION_EXTRA_SECONDS = (\d+)/)[1];
const SINGLE = ['makis', 'frituras'];
const getRashConfig = new Function(src.match(/function getRashConfig\(lvl\) \{[\s\S]*?\n\}\n/)[0] + ';return getRashConfig')();
const SEC = { ramen: 13, salteados: 14, makis: 15, frituras: 24 }, STAGED = { ramen: 7, salteados: 8, makis: 9, frituras: 14 };
// reparto de estrellas de calidad por perfil: [rechazo, 1★, 2★, 3★] y velocidad (1 = tiempo del modelo; menos = más rápido)
const PERFILES = [
  { id: 'aprendiz', skill: 1.3, rechazo: 0.06 },
  { id: 'competente', skill: 1.0, rechazo: 0.02 },
  { id: 'experto', skill: 0.72, rechazo: 0.0 }
];

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function poolOf(L, r) {
  const p = { ramen: R.ramen.filter(x => L.ramen_names.includes(x.name)) };
  Object.keys(UNLOCKS).forEach(a => { const d = UNLOCKS[a].filter(x => x[2] <= r).map(x => R[a].find(q => q.name === x[0])).filter(Boolean); if (d.length) p[a] = d; });
  return p;
}
function pick(rand, pool) {                            // misma regla que pickOrderRecipe: 40 % ramen, el resto otra área al azar
  const others = Object.keys(pool).filter(a => a !== 'ramen');
  let area = 'ramen';
  if (!pool.ramen) area = others[Math.floor(rand() * others.length)];
  else if (others.length && rand() >= 0.4) area = others[Math.floor(rand() * others.length)];
  const arr = pool[area]; return { area, recipe: arr[Math.floor(rand() * arr.length)] };
}

function jugar(r, perfil, rand) {
  const L = getRashConfig(r), pool = poolOf(L, r);
  let lives = 5 + (r - 1), lost = 0, spawned = 0, served = 0, spawnT = 0, cook = null, t = 0;
  const slots = [];
  const nuevo = () => {
    spawned++;
    const n = Math.floor(rand() * L.max_orders) + 1, orders = [];
    for (let k = 0; k < n; k++) orders.push({ ...pick(rand, pool), done: false });
    const per = {}; let proc = 0;
    orders.forEach(o => { proc += (PROC[o.area] || 0) + (STX[o.area] || 0); per[o.area] = (per[o.area] || 0) + 1; if (SINGLE.includes(o.area) && per[o.area] > 1) proc += SINGLE_X; });
    const p = L.base_patience + (orders.length - 1) * 8 + proc;                    // fórmula de Rash (spawnCustomer)
    slots.push({ orders, patience: p, max: p });
  };
  for (let k = 0; k < (L.max_customers >= 2 ? 2 : 1); k++) nuevo();
  for (t = 0; t < 20000; t++) {
    spawnT++; if (spawnT >= L.spawn_time) { spawnT = 0; if (slots.length < L.max_customers && spawned < L.customers) nuevo(); }
    if (!cook) {                                         // el cocinero toma el siguiente plato del cliente con menos paciencia
      let best = null;
      slots.forEach(c => { if (c.orders.some(o => !o.done) && (!best || c.patience < best.patience)) best = c; });
      if (best) { const o = best.orders.find(x => !x.done); cook = { c: best, o, left: (SEC[o.area] + STAGED[o.area]) * perfil.skill * Math.exp((rand() - 0.5) * 0.36) }; }
    }
    if (cook) {
      cook.left -= CAP;
      if (cook.left <= 0) {
        if (rand() < perfil.rechazo) cook.c.patience -= cook.c.max * PAY_REJECT;   // rechazado: se rehace
        else cook.o.done = true;
        cook = null;
      }
    }
    for (let k = slots.length - 1; k >= 0; k--) {
      const c = slots[k]; c.patience -= 1;
      if (c.orders.every(o => o.done)) { slots.splice(k, 1); served++; }
      else if (c.patience <= 0) { if (cook && cook.c === c) cook = null; lost++; lives--; slots.splice(k, 1); if (lives <= 0) return { win: false, lost, served, t, customers: L.customers }; }
    }
    if (spawned >= L.customers && slots.length === 0) return { win: true, lost, served, t, customers: L.customers };
  }
  return { win: false, lost, served, t, customers: L.customers };
}

const filas = [], avisos = [];
RONDAS.forEach(r => {
  const L = getRashConfig(r), fila = { ronda: r, clientes: L.customers, vidas: 5 + (r - 1), pacBase: L.base_patience, llegada: L.spawn_time, max: L.max_customers + '×' + L.max_orders };
  PERFILES.forEach(p => {
    const rand = rng(SEED + r * 1009 + p.id.length), acc = { win: 0, lost: 0 };
    for (let k = 0; k < N; k++) { const x = jugar(r, p, rand); if (x.win) acc.win++; acc.lost += x.lost; }
    fila[p.id] = Math.round(100 * acc.win / N) + ' %'; fila['perd ' + p.id.slice(0, 3)] = (acc.lost / N).toFixed(1);
    p.res = p.res || {}; p.res[r] = acc.win / N;
  });
  filas.push(fila);
});
console.log(`Simulación de Rash · ${N} partidas por perfil y ronda · semilla ${SEED} · capacidad ${CAP}\n(victoria = servir a todos los clientes de la ronda sin quedarte sin vidas; perd = clientes perdidos de media)`);
console.table(filas);
const ultima = (p, umbral) => { let u = 0; RONDAS.forEach(r => { if (p.res[r] >= umbral) u = r; }); return u; };
PERFILES.forEach(p => console.log(`${p.id}: pasa con ≥ 50 % hasta la ronda ${ultima(p, 0.5)}, con ≥ 90 % hasta la ${ultima(p, 0.9)}`));
const exp = PERFILES[2], apr = PERFILES[0];
if (exp.res[1] < 0.95) avisos.push('la ronda 1 no es segura ni para un experto');
if (apr.res[1] < 0.9) avisos.push(`la ronda 1 falla para un aprendiz (${Math.round(apr.res[1] * 100)} %)`);
RONDAS.forEach((r, i) => { const a = RONDAS[i - 1]; if (a != null && PERFILES[1].res[a] < 0.3 && PERFILES[1].res[r] > PERFILES[1].res[a] + 0.4) avisos.push(`salto raro entre las rondas ${a} y ${r}`); });
console.log(avisos.length ? avisos.map(a => '⚠ ' + a).join('\n') : '✓ Sin avisos de forma de la curva.');
