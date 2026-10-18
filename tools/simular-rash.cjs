// Simulación Monte Carlo del modo RASH con los datos reales del juego: ¿se puede superar cada ronda?
// Para cada ronda simula N partidas de cuatro perfiles de jugador y estima la probabilidad de superarla (servir a todos los clientes
// de la ronda sin quedarte sin vidas). Es una ESTIMACIÓN (un cocinero que atiende de uno en uno, tiempos de trabajo del modelo de
// tools/economia-niveles.cjs, igual que tools/simular-campana.cjs); la dificultad real se confirma jugando en el celular.
// Reglas tomadas del juego: getRashConfig (clientes, vidas, patience_mult, pedidos y clientes máximos, llegada), cada cliente perdido
// cuesta 1 vida, un plato rechazado quita 15 % de la paciencia, platos y áreas abiertas por ronda (AREA_DISH_UNLOCKS) y paciencia
// = (25 s + 2,5 s por ingrediente + proceso de cada área, con etapas) × patience_mult — la misma fórmula que la Campaña (spawnCustomer).
// Cada perfil tiene su velocidad (skill: menos = más rápido) y su trabajo en paralelo (cap: cuencos, woks y Producción por tandas), SIN calibrar:
// el objetivo de diseño es que el «excelente» pueda llegar a la ronda 100, el «experto» a la ~58, el «competente» a la ~20 y el «aprendiz» a la ~14.
// --equipo N simula el Rash en equipo (Online cooperativo) con N chefs: rashTeamConfig del juego y capacidad de trabajo = cap × N × 0,85 (coordinación).
// Uso:  node tools/simular-rash.cjs [--n 200] [--seed 20261018] [--rondas 1,5,10,20,50,100] [--equipo 3] [--estricto]
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('n', 200), SEED = +arg('seed', 20261018), ESTRICTO = process.argv.includes('--estricto');
const RONDAS = arg('rondas', '1,5,10,14,16,20,25,30,40,50,58,62,75,90,95,100').split(',').map(Number);

const src = [fs.readFileSync(path.join(root, 'index.html'), 'utf8'), ...fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8'))].join('\n');
const grab = n => eval('(' + src.match(new RegExp('const ' + n + ' = (\\[[\\s\\S]*?\\n\\]);'))[1] + ')');
const R = { ramen: grab('RECETAS_RAMEN'), salteados: grab('RECETAS_SALTEADOS'), makis: grab('RECETAS_MAKIS'), frituras: grab('RECETAS_FRITURAS') };
const UNLOCKS = eval('(' + src.match(/const AREA_DISH_UNLOCKS = (\{[\s\S]*?\n\});/)[1] + ')');
const obj = n => eval('(' + src.match(new RegExp('const ' + n + ' = (\\{[^}]*\\})'))[1] + ')');
const REJECT = +src.match(/const QUALITY_REJECT_PATIENCE = ([\d.]+)/)[1];
const PROC = obj('AREA_PROCESS_SECONDS'), STX = obj('ST_EXTRA_SECONDS'), SINGLE_X = +src.match(/const SINGLE_STATION_EXTRA_SECONDS = (\d+)/)[1];
const SINGLE = ['makis', 'frituras'];
const fnSrc = n => src.match(new RegExp('function ' + n + '\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n\\}\\r?\\n'))[0];
const G = new Function(fnSrc('getRashConfig') + fnSrc('rashTeamConfig') + ';return { getRashConfig, rashTeamConfig }')();
const EQUIPO = +arg('equipo', 0);
const getRashConfig = r => EQUIPO ? G.rashTeamConfig(r, EQUIPO) : G.getRashConfig(r);
const SEC = { ramen: 13, salteados: 14, makis: 15, frituras: 24 }, STAGED = { ramen: 7, salteados: 8, makis: 9, frituras: 14 };
const PERFILES = [
  { id: 'aprendiz', skill: 1.3, cap: 1.3, rechazo: 0.06 },
  { id: 'competente', skill: 1.0, cap: 1.6, rechazo: 0.02 },
  { id: 'experto', skill: 0.72, cap: 2.2, rechazo: 0.0 },
  { id: 'excelente', skill: 0.6, cap: 3.0, rechazo: 0.0 }
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
  let lives = L.lives, lost = 0, spawned = 0, spawnT = 0, cook = null;
  const slots = [];
  const nuevo = () => {
    spawned++;
    const n = Math.floor(rand() * L.max_orders) + 1, orders = [];
    for (let k = 0; k < n; k++) orders.push({ ...pick(rand, pool), done: false });
    const per = {}; let proc = 0, ing = 0;
    orders.forEach(o => { proc += (PROC[o.area] || 0) + (STX[o.area] || 0); per[o.area] = (per[o.area] || 0) + 1; if (SINGLE.includes(o.area) && per[o.area] > 1) proc += SINGLE_X; ing += (o.recipe.ingredients || []).length; });
    const p = (25 + ing * 2.5 + proc) * L.patience_mult;                           // fórmula general de spawnCustomer
    slots.push({ orders, patience: p, max: p });
  };
  for (let k = 0; k < (L.max_customers >= 2 ? 2 : 1); k++) nuevo();
  for (let t = 0; t < 40000; t++) {
    spawnT++; if (spawnT >= L.spawn_time) { spawnT = 0; if (slots.length < L.max_customers && spawned < L.customers) nuevo(); }
    if (!cook) {                                         // el cocinero toma el siguiente plato del cliente con menos paciencia
      let best = null;
      slots.forEach(c => { if (c.orders.some(o => !o.done) && (!best || c.patience < best.patience)) best = c; });
      if (best) { const o = best.orders.find(x => !x.done); cook = { c: best, o, left: (SEC[o.area] + STAGED[o.area]) * perfil.skill * Math.exp((rand() - 0.5) * 0.36) }; }
    }
    if (cook) {
      cook.left -= perfil.cap * (EQUIPO ? EQUIPO * 0.85 : 1);
      if (cook.left <= 0) {
        if (rand() < perfil.rechazo) cook.c.patience -= cook.c.max * REJECT;   // rechazado: se rehace
        else cook.o.done = true;
        cook = null;
      }
    }
    for (let k = slots.length - 1; k >= 0; k--) {
      const c = slots[k]; c.patience -= 1;
      if (c.orders.every(o => o.done)) slots.splice(k, 1);
      else if (c.patience <= 0) { if (cook && cook.c === c) cook = null; lost++; lives--; slots.splice(k, 1); if (lives <= 0) return { win: false, lost }; }
    }
    if (spawned >= L.customers && slots.length === 0) return { win: true, lost };
  }
  return { win: false, lost };
}

const filas = [], avisos = [];
RONDAS.forEach(r => {
  const L = getRashConfig(r), fila = { ronda: r, clientes: L.customers, vidas: L.lives, 'pac×': +L.patience_mult.toFixed(2), llegada: L.spawn_time, max: L.max_customers + '×' + L.max_orders };
  PERFILES.forEach(p => {
    const rand = rng(SEED + r * 1009 + p.id.length), acc = { win: 0, lost: 0 };
    for (let k = 0; k < N; k++) { const x = jugar(r, p, rand); if (x.win) acc.win++; acc.lost += x.lost; }
    fila[p.id] = Math.round(100 * acc.win / N) + ' %';
    p.res = p.res || {}; p.res[r] = acc.win / N;
  });
  filas.push(fila);
});
console.log(`Simulación de Rash${EQUIPO ? ' EN EQUIPO de ' + EQUIPO + ' chefs' : ''} · ${N} partidas por perfil y ronda · semilla ${SEED}\n(victoria = servir a todos los clientes de la ronda sin quedarte sin vidas; pac× = multiplicador de paciencia de la ronda)`);
console.table(filas);
const ultima = (p, umbral) => { let u = 0; RONDAS.forEach(r => { if (p.res[r] >= umbral) u = r; }); return u; };
PERFILES.forEach(p => console.log(`${p.id}: pasa con ≥ 50 % hasta la ronda ${ultima(p, 0.5)}, con ≥ 90 % hasta la ${ultima(p, 0.9)}`));
const [apr, com, exp, exc] = PERFILES;
if (apr.res[1] < 0.95) avisos.push('la ronda 1 no es segura ni para un aprendiz');
if (exc.res[100] < 0.3) avisos.push(`la ronda 100 es casi imposible incluso para el perfil excelente (${Math.round(exc.res[100] * 100)} %)`);
if (exc.res[100] > 0.9) avisos.push(`la ronda 100 es demasiado fácil para el perfil excelente (${Math.round(exc.res[100] * 100)} %)`);
if (exp.res[100] > 0.1) avisos.push('un experto no debería poder pasar la ronda 100');
if (com.res[50] > 0.1) avisos.push('un competente no debería pasar la ronda 50');
console.log(avisos.length ? avisos.map(a => '⚠ ' + a).join('\n') : '✓ La curva cumple el objetivo: excelente llega a la 100; experto, competente y aprendiz se quedan antes.');
if (ESTRICTO && avisos.length) process.exit(1);
