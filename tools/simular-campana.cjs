// Simulación Monte Carlo de la Campaña con los datos reales del juego (niveles, platos, precios, paciencia, estrellas).
// Para cada nivel simula N partidas de tres perfiles de jugador y estima la probabilidad de pasar el nivel y de sacar 2★ y 3★.
// Es una ESTIMACIÓN (un cocinero que atiende de uno en uno, tiempos de trabajo del modelo de tools/economia-niveles.cjs);
// la dificultad real se confirma jugando en el celular. Con semilla fija: mismo resultado en cada ejecución.
// --cap = cuánto trabajo simultáneo hace el jugador (1 = atiende de uno en uno; en el juego real hay 3 cuencos, 2 woks y la Producción por tandas,
//         así que un jugador real rinde más que 1). Hay que calibrarlo con partidas reales.
// Uso:  node tools/simular-campana.cjs [--n 400] [--seed 20261015] [--nivel 5] [--cap 1.3] [--estricto]   (cap 1.3 = estimación SIN calibrar: compara con partidas reales antes de tocar metas)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('n', 400), SEED = +arg('seed', 20261015), SOLO = arg('nivel', null), CAP = +arg('cap', 1.3), ESTRICTO = process.argv.includes('--estricto');

const src = [fs.readFileSync(path.join(root, 'index.html'), 'utf8'), ...fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8'))].join('\n');
const grab = n => eval('(' + src.match(new RegExp('const ' + n + ' = (\\[[\\s\\S]*?\\n\\]);'))[1] + ')');
const R = { ramen: grab('RECETAS_RAMEN'), salteados: grab('RECETAS_SALTEADOS'), makis: grab('RECETAS_MAKIS'), frituras: grab('RECETAS_FRITURAS') };
const NIVELES = new Function(fs.readFileSync(path.join(root, 'js/03-datos-niveles-campana.js'), 'utf8') + ';return NIVELES')();
const UNLOCKS = eval('(' + src.match(/const AREA_DISH_UNLOCKS = (\{[\s\S]*?\n\});/)[1] + ')');
const num = (n) => +src.match(new RegExp('const ' + n + ' = (\\d+)'))[1];
const obj = n => eval('(' + src.match(new RegExp('const ' + n + ' = (\\{[^}]*\\})'))[1] + ')');
const PAY = eval('(' + src.match(/const QUALITY_PAY_MULT = (\[[^\]]*\])/)[1] + ')');            // por estrellas: [rechazo, 1★, 2★, 3★]
const REJECT_LOSS = +src.match(/const QUALITY_REJECT_PATIENCE = ([\d.]+)/)[1];                   // fracción de paciencia que pierde quien rechaza
const PROC = obj('AREA_PROCESS_SECONDS'), STX = obj('ST_EXTRA_SECONDS'), SINGLE_X = num('SINGLE_STATION_EXTRA_SECONDS');
const SINGLE = ['makis', 'frituras'];
// trabajo (s) por plato para un jugador que ya conoce el juego, con las etapas activas (igual que tools/economia-niveles.cjs)
const SEC = { ramen: 13, salteados: 14, makis: 15, frituras: 24 }, STAGED = { ramen: 7, salteados: 8, makis: 9, frituras: 14 };
const NOVICE = [1.8, 1.65, 1.5, 1.4, 1.35, 1.3, 1.25, 1.2, 1.18, 1.15, 1.12, 1.1, 1.08, 1.06, 1.04, 1.02, 1.0, 1.0, 0.98, 0.95];
// reparto de estrellas de calidad por perfil: [rechazo, 1★, 2★, 3★]
const PERFILES = [
  { id: 'aprendiz', skill: i => NOVICE[i], tiers: [0.06, 0.22, 0.46, 0.26] },
  { id: 'competente', skill: i => Math.max(0.85, NOVICE[i] * 0.8), tiers: [0.02, 0.10, 0.43, 0.45] },
  { id: 'experto', skill: () => 0.72, tiers: [0.0, 0.03, 0.30, 0.67] }
];

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function poolOf(L) {
  const p = { ramen: R.ramen.filter(r => L.ramen_names.includes(r.name)) };
  Object.keys(UNLOCKS).forEach(a => { const d = UNLOCKS[a].filter(x => x[1] <= L.level).map(x => R[a].find(r => r.name === x[0])).filter(Boolean); if (d.length) p[a] = d; });
  return p;
}
function pick(rand, pool) {                            // misma regla que pickOrderRecipe del juego: 40 % ramen, el resto otra área al azar
  const others = Object.keys(pool).filter(a => a !== 'ramen');
  let area = 'ramen';
  if (!pool.ramen) area = others[Math.floor(rand() * others.length)];
  else if (others.length && rand() >= 0.4) area = others[Math.floor(rand() * others.length)];
  const arr = pool[area]; return { area, recipe: arr[Math.floor(rand() * arr.length)] };
}
function tierOf(rand, t) { const u = rand(); let a = 0; for (let k = 0; k < 4; k++) { a += t[k]; if (u < a) return k; } return 3; }

function jugar(L, i, perfil, rand, pool) {
  const skill = perfil.skill(i), cap = L.max_customers;
  let money = 0, lost = 0, t = 0, spawn = 0, cook = null;
  const slots = [];
  const nuevo = () => {
    const n = Math.floor(rand() * L.max_orders) + 1, orders = [];
    for (let k = 0; k < n; k++) orders.push({ ...pick(rand, pool), done: false });
    const per = {}; let proc = 0, ing = 0;
    orders.forEach(o => { proc += (PROC[o.area] || 0) + (STX[o.area] || 0); per[o.area] = (per[o.area] || 0) + 1; if (SINGLE.includes(o.area) && per[o.area] > 1) proc += SINGLE_X; ing += (o.recipe.ingredients || []).length || 6; });
    const p = (25 + ing * 2.5 + proc) * (L.patience_mult || 1);
    slots.push({ orders, patience: p, max: p });
  };
  for (let k = 0; k < (cap >= 2 ? 2 : 1); k++) nuevo();
  for (t = 0; t < L.time; t++) {
    spawn++; if (spawn >= (L.spawn_time || 4)) { spawn = 0; if (slots.length < cap) nuevo(); }
    // el cocinero toma el siguiente plato del cliente con menos paciencia
    if (!cook) {
      let best = null;
      slots.forEach(c => { if (c.orders.some(o => !o.done) && (!best || c.patience < best.patience)) best = c; });
      if (best) { const o = best.orders.find(x => !x.done); cook = { c: best, o, left: (SEC[o.area] + STAGED[o.area]) * skill * Math.exp((rand() - 0.5) * 0.36) }; }
    }
    if (cook) {
      cook.left -= CAP;
      if (cook.left <= 0) {
        const tier = tierOf(rand, perfil.tiers);
        if (tier === 0) cook.c.patience -= cook.c.max * REJECT_LOSS;       // rechazado: se rehace
        else { money += Math.round(cook.o.recipe.price * PAY[tier]); cook.o.done = true; }
        cook = null;
      }
    }
    for (let k = slots.length - 1; k >= 0; k--) {
      const c = slots[k]; c.patience -= 1;
      if (c.orders.every(o => o.done)) slots.splice(k, 1);                // se fue contento
      else if (c.patience <= 0) { if (cook && cook.c === c) cook = null; lost++; slots.splice(k, 1); }
    }
  }
  const th2 = Math.round(L.goal * 1.20 / 10) * 10, th3 = Math.round(L.goal * 1.35 / 10) * 10;
  const stars = money < L.goal ? 0 : (money >= th3 && lost <= 1 ? 3 : (money >= th2 && lost <= 2 ? 2 : 1));
  return { money, lost, stars };
}

const filas = [], avisos = [];
NIVELES.forEach((L, i) => {
  if (SOLO && +SOLO !== L.level) return;
  const pool = poolOf(L), fila = { nivel: L.level, meta: L.goal };
  PERFILES.forEach(p => {
    const rand = rng(SEED + L.level * 1009 + p.id.length), acc = { win: 0, s2: 0, s3: 0, money: 0, lost: 0 };
    for (let k = 0; k < N; k++) { const r = jugar(L, i, p, rand, pool); if (r.stars >= 1) acc.win++; if (r.stars >= 2) acc.s2++; if (r.stars >= 3) acc.s3++; acc.money += r.money; acc.lost += r.lost; }
    fila[p.id] = Math.round(100 * acc.win / N) + '% · 2★ ' + Math.round(100 * acc.s2 / N) + '% · 3★ ' + Math.round(100 * acc.s3 / N) + '%';
    fila['$' + p.id.slice(0, 3)] = Math.round(acc.money / N); fila['perd' + p.id.slice(0, 3)] = (acc.lost / N).toFixed(1);
    p.res = { win: acc.win / N, s3: acc.s3 / N };
    if (p.id === 'aprendiz') { if (p.res.win < 0.40) avisos.push(`Nivel ${L.level}: muy difícil para un aprendiz (${Math.round(p.res.win * 100)} % de victoria)`); if (p.res.win > 0.97) avisos.push(`Nivel ${L.level}: casi imposible perder siendo aprendiz (${Math.round(p.res.win * 100)} %)`); }
    if (p.id === 'experto') { if (p.res.win < 0.90) avisos.push(`Nivel ${L.level}: un experto debería pasar siempre (${Math.round(p.res.win * 100)} %)`); if (p.res.s3 < 0.20) avisos.push(`Nivel ${L.level}: el 3★ es casi inalcanzable (${Math.round(p.res.s3 * 100)} % del experto)`); if (p.res.s3 > 0.92 && L.level > 3) avisos.push(`Nivel ${L.level}: el 3★ es trivial para un experto (${Math.round(p.res.s3 * 100)} %)`); }
  });
  filas.push(fila);
});
console.log(`Simulación de la Campaña · ${N} partidas por perfil y nivel · semilla ${SEED} · capacidad ${CAP}\n(victoria = estrellas ≥ 1; $ = dinero medio; perd = clientes perdidos de media)`);
console.table(filas);
console.log(avisos.length ? avisos.map(a => '⚠ ' + a).join('\n') : '✓ Ningún nivel sale de los márgenes (aprendiz 40-97 %, experto ≥ 90 % y 3★ entre 20 y 92 %).');
if (ESTRICTO && avisos.length) process.exit(1);
