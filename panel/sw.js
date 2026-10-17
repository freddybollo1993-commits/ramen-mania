/* Service worker del Shimaya Panel (alcance /panel/): independiente del juego.
   - La página y sus archivos se abren desde la copia guardada y se actualizan en segundo plano (el panel abre al instante y sin conexión muestra el acceso).
   - Los datos (Supabase) NUNCA se guardan: siempre van a la red. Tampoco se guarda nada con el secreto de administrador. */
const CACHE = 'shimaya-panel-p3';
const SHELL = ['./', './index.html', './app.js', './seguimiento.js', './datos-juego.js', './manifest.json', './favicon.svg', './icon-192.png', './icon-512.png', './icon-maskable.png', './apple-touch-icon.png',
  '/assets/fonts/fredoka-one-latin-400-normal.woff2', '/assets/fonts/nunito-latin-wght-normal.woff2', '/assets/fonts/nunito-latin-ext-wght-normal.woff2'];
const LIBS = ['cdn.jsdelivr.net'];      // supabase-js y chart.js: se guardan para poder abrir el panel sin conexión

// El panel vive en su propio dominio (shimaya-panel.vercel.app) para poder instalarse aparte del juego. En el dominio del juego
// (ramen-mania.vercel.app) este service worker se borra solo, junto con su copia guardada, y la página redirige al panel.
const HOST_OK = ['shimaya-panel.vercel.app', 'localhost', '127.0.0.1'].includes(location.hostname);
if (!HOST_OK) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', e => e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
    (await self.clients.matchAll({ type: 'window' })).forEach(c => { try { c.navigate(c.url); } catch (er) {} });
  })()));
} else {
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('shimaya-panel-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;
  if (u.hostname.endsWith('supabase.co')) return;                                    // datos: siempre en vivo
  const mine = u.origin === location.origin && (u.pathname.startsWith('/panel/') || u.pathname === '/panel' || u.pathname.startsWith('/assets/fonts/'));
  if (!mine && !LIBS.includes(u.hostname)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {}); return res; }).catch(() => null);
    if (cached) { e.waitUntil(net); return cached; }                               // copia guardada al instante; la red la renueva
    return (await net) || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
}
