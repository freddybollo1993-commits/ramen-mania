// Comprueba que los módulos de js/ siguen sanos: sintaxis válida, cargados en orden desde index.html y guardados por el service worker.
// Uso:  node tools/verificar-modulos.cjs      (termina con código 1 si algo está mal)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const files = fs.readdirSync(path.join(root, 'js')).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let bad = 0; const fail = m => { bad++; console.log('✗ ' + m); };

files.forEach(f => { try { new Function(fs.readFileSync(path.join(root, 'js', f), 'utf8')); } catch (e) { fail(f + ': sintaxis → ' + e.message); } });
const tags = [...html.matchAll(/<script src="js\/(\d\d-[^"?]+\.js)(?:\?v=[^"]*)?"><\/script>/g)].map(m => m[1]);
if (tags.join('|') !== files.join('|')) fail('index.html no carga los módulos de js/ en orden numérico (faltan o sobran etiquetas <script>)');
files.forEach(f => { if (!sw.includes("'./js/" + f + "'")) fail(f + ' no está en CORE_SHELL de sw.js (no abriría sin conexión)'); });
const versions = new Set([...html.matchAll(/<script src="js\/[^"?]+\.js\?v=([^"]*)"/g)].map(m => m[1]));
if (versions.size > 1) fail('los módulos usan distintas versiones ?v= (' + [...versions].join(', ') + ')');
const inline = (html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g) || []).filter(s => s.replace(/<[^>]+>/g, '').trim().length > 300);
if (inline.length) fail('queda código grande dentro de index.html (' + inline.length + ' script/s): debe vivir en js/');
console.log(bad ? '\n' + bad + ' problema(s)' : '✓ ' + files.length + ' módulos: sintaxis, orden de carga y caché sin conexión correctos');
process.exit(bad ? 1 : 0);
