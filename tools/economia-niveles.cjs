// Modelo de economía de la campaña: lee NIVELES y las recetas de index.html y muestra, por nivel, cuántos
// pedidos hay que servir para llegar a la meta y qué parte del tiempo exige eso a un jugador novato.
// Uso:  node tools/economia-niveles.cjs
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
// el código del juego vive en index.html y en los módulos de js/ (se concatenan en su orden de carga)
const src = [fs.readFileSync(path.join(root, 'index.html'), 'utf8'), ...fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8'))].join('\n');
const grab = n => eval('(' + src.match(new RegExp('const ' + n + ' = (\\[[\\s\\S]*?\\n\\]);'))[1] + ')');
const R = { ramen: grab('RECETAS_RAMEN'), salteados: grab('RECETAS_SALTEADOS'), makis: grab('RECETAS_MAKIS'), frituras: grab('RECETAS_FRITURAS') };
const NIVELES = grab('NIVELES');
const UNLOCKS = eval('(' + src.match(/const AREA_DISH_UNLOCKS = (\{[\s\S]*?\n\});/)[1] + ')');

// Segundos de trabajo estimados por pedido para un jugador que ya conoce el juego.
const SEC = { ramen: 13, salteados: 14, makis: 15, frituras: 24 };
// Campaña 2.0: las etapas de Producción y Emplatar están activas en TODOS los niveles (un área abre con todas sus mecánicas), así que cada pedido lleva ese trabajo extra siempre.
const STAGED_EXTRA = { ramen: 7, salteados: 8, makis: 9, frituras: 14 };
// Cuánto más lento es un jugador que está aprendiendo (1.8 = casi el doble) en cada nivel.
const NOVICE = [1.8, 1.65, 1.5, 1.4, 1.35, 1.3, 1.25, 1.2, 1.18, 1.15, 1.12, 1.1, 1.08, 1.06, 1.04, 1.02, 1.0, 1.0, 0.98, 0.95];

// Carga objetivo (% del tiempo) para un jugador que aprende, por nivel: sube poco a poco y baja un poco al abrir cada área nueva.
const TARGET = [66, 70, 73, 76, 68, 72, 75, 78, 70, 74, 77, 80, 72, 76, 80, 83, 80, 82, 84, 86];
const rows = NIVELES.map((L, i) => {
  const pool = { ramen: R.ramen.filter(r => L.ramen_names.includes(r.name)) };
  Object.keys(UNLOCKS).forEach(a => {
    const dishes = UNLOCKS[a].filter(d => d[1] <= L.level).map(d => R[a].find(r => r.name === d[0]));
    if (dishes.length) pool[a] = dishes;
  });
  const areas = Object.keys(pool);
  const w = {};
  if (areas.length === 1) w[areas[0]] = 1;
  else { const others = areas.filter(a => a !== 'ramen'); w.ramen = 0.4; others.forEach(a => (w[a] = 0.6 / others.length)); }
  const price = areas.reduce((t, a) => t + w[a] * pool[a].reduce((x, r) => x + r.price, 0) / pool[a].length, 0);
  const secs = areas.reduce((t, a) => t + w[a] * (SEC[a] + STAGED_EXTRA[a]), 0);
  const orders = L.goal / price;
  const work = orders * secs * NOVICE[i];
  return {
    nivel: L.level, areas: areas.length, platos: areas.reduce((t, a) => t + pool[a].length, 0), precioMedio: price.toFixed(1),
    meta: L.goal, 'metaSugerida': Math.round(TARGET[i] / 100 * L.time * price / (secs * NOVICE[i]) / 10) * 10, pedidosParaMeta: orders.toFixed(1), tiempo: L.time, 'cargaNovato': Math.round(100 * work / L.time) + '%',
    llegan: Math.floor(L.time / L.spawn_time) * ((1 + L.max_orders) / 2), paciencia: 'x' + L.patience_mult
  };
});
console.table(rows);
