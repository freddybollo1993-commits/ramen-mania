const CACHE_NAME = 'ramen-mania-v11';

// Solo el shell esencial para instalación instantánea (< 50ms)
const CORE_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of CORE_SHELL) {
        try {
          const res = await fetch(url);
          if (res && res.ok) {
            await cache.put(url, res.clone());
            if (url === './') {
              await cache.put('/', res.clone());
              await cache.put('/index.html', res.clone());
            }
          }
        } catch (e) {
          console.warn('[PWA] Cache prefetch warn:', url, e);
        }
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // 1. Elimina versiones anteriores de caché de inmediato
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));

      // 2. Reclama clientes inmediatamente para activar cambios sin reiniciar
      await self.clients.claim();

      // 3. Pre-cachea fondo e iconos en segundo plano
      caches.open(CACHE_NAME).then(cache => {
        const bgAssets = [
          './assets/ramen_bg.webp',
          './assets/ramen_bg.jpg',
          './assets/icons/icon-192.png',
          './assets/icons/favicon-32x32.png',
          './assets/icons/favicon-16x16.png'
        ];
        bgAssets.forEach(u => {
          fetch(u).then(r => {
            if (r && (r.ok || r.type === 'opaque')) {
              cache.put(u, r);
            }
          }).catch(() => {});
        });
      });
    })()
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // No interceptar llamadas a la API de Supabase
  if (req.url.includes('supabase.co')) {
    return;
  }

  // 1. NAVEGACIÓN (HTML / APERTURA DE LA APP INSTALADA):
  // NETWORK-FIRST con timeout de 1200ms para garantizar que la app siempre cargue la versión más reciente
  if (req.mode === 'navigate' || (req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          const networkRes = await fetch(req, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (networkRes && networkRes.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/', networkRes.clone());
            cache.put('./', networkRes.clone());
            cache.put('/index.html', networkRes.clone());
            cache.put('./index.html', networkRes.clone());
            return networkRes;
          }
        } catch (e) {
          // Si no hay red o hubo timeout, usa la caché
        }

        const cache = await caches.open(CACHE_NAME);
        const cached = (await cache.match(req, { ignoreSearch: true }))
          || (await cache.match('/', { ignoreSearch: true }))
          || (await cache.match('./', { ignoreSearch: true }))
          || (await cache.match('/index.html', { ignoreSearch: true }))
          || (await cache.match('./index.html', { ignoreSearch: true }));

        if (cached) return cached;

        return new Response('Ramen Mania Fuera de Línea', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      })()
    );
    return;
  }

  // 2. CACHE-FIRST para imágenes, fuentes, iconos y scripts CDN
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && (res.status === 200 || res.type === 'opaque') && (
          req.url.startsWith(self.location.origin) ||
          req.url.includes('gstatic') ||
          req.url.includes('googleapis') ||
          req.url.includes('cdnjs') ||
          req.url.includes('jsdelivr')
        )) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, resClone));
        }
        return res;
      }).catch(err => {
        return cached;
      });
    })
  );
});
