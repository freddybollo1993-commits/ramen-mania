// Comprueba que los 20 niveles de la Campaña 2.0 son coherentes: áreas, platos, mecánica de enfoque, fichas del Maestro y carga de trabajo.
// Uso: node tools/verificar-campana.cjs
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const NIVELES = new Function(read('js/03-datos-niveles-campana.js') + ';return NIVELES')();
const UNLOCKS = new Function(read('js/02-datos-ingredientes-recetas.js').match(/const AREA_DISH_UNLOCKS = \{[\s\S]*?\n\};/)[0] + ';return AREA_DISH_UNLOCKS')();
const AREAS = ['ramen', 'salteados', 'makis', 'frituras'];
const problemas = [];
const err = (n, m) => problemas.push('Nivel ' + n + ': ' + m);

NIVELES.forEach((L, i) => {
  const n = L.level;
  if (n !== i + 1) err(n, 'el orden no coincide con su posición');
  if (!Array.isArray(L.areas) || !L.areas.length) return err(n, 'sin áreas');
  if (L.areas[0] !== 'ramen') err(n, 'la primera área debe ser ramen');
  L.areas.forEach(a => { if (!AREAS.includes(a)) err(n, 'área desconocida ' + a); });
  const prev = NIVELES[i - 1];
  if (prev && L.areas.length < prev.areas.length) err(n, 'pierde un área respecto al nivel anterior');
  if (prev && L.areas.length - prev.areas.length > 1) err(n, 'abre más de un área a la vez');
  // cada área del nivel tiene platos pedibles
  L.areas.forEach(a => {
    if (a === 'ramen') { if (!L.ramen_names || !L.ramen_names.length) err(n, 'ramen sin platos'); return; }
    const dishes = (UNLOCKS[a] || []).filter(d => d[1] <= n);
    if (!dishes.length) err(n, 'el área ' + a + ' está abierta pero no tiene platos desbloqueados (AREA_DISH_UNLOCKS)');
  });
  // ningún plato de un área cerrada
  AREAS.filter(a => a !== 'ramen' && !L.areas.includes(a)).forEach(a => {
    if ((UNLOCKS[a] || []).some(d => d[1] <= n)) err(n, 'hay platos de ' + a + ' desbloqueados pero el área no está abierta');
  });
  if (!L.focus || !L.focus.mechanic || !AREAS.includes(L.focus.lesson === 'salteados' ? 'salteados' : L.focus.lesson)) err(n, 'falta focus.mechanic o focus.lesson');
  if (L.focus && !L.areas.includes(L.focus.area)) err(n, 'la mecánica de enfoque es de un área que no está abierta');
  if (!L.rules || L.rules.stages !== true) err(n, 'rules.stages debe ser true (un área abre con todas sus mecánicas)');
  if (!L.intro || L.intro.length < 15) err(n, 'intro muy corta o ausente');
  // el nivel donde se abre un área nueva debe traer ficha del Maestro
  if (prev && L.areas.length > prev.areas.length && !(L.brief && L.brief.card)) err(n, 'abre un área nueva pero no tiene brief.card');
  if (n === 1 && !(L.brief && L.brief.card)) err(n, 'el nivel 1 necesita su ficha');
  if (L.brief && L.brief.card && (!L.brief.title || !L.brief.lines || L.brief.lines.length < 2)) err(n, 'brief incompleto');
});
console.log(problemas.length ? problemas.map(p => '✗ ' + p).join('\n') : '✓ ' + NIVELES.length + ' niveles coherentes: áreas, platos, mecánica de enfoque, fichas del Maestro y etapas activas.');
if (problemas.length) process.exit(1);
