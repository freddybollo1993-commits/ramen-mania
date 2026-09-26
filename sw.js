const CACHE_NAME = 'ramen-mania-v6';

// Recursos esenciales que forman el Shell visual completo del juego
const CORE_SHELL = [
  './',
  './manifest.json',
  './assets/ramen_bg.jpg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable.png',
  './assets/icons/favicon-32x32.png',
  './assets/icons/favicon-16x16.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(
        CORE_SHELL.map(async url => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res && (res.ok || res.type === 'opaque')) {
              await cache.put(url, res.clone());
              if (url === './') {
                await cache.put('/', res.clone());
                await cache.put('./index.html', res.clone());
                await cache.put('/index.html', res.clone());
              }
            }
          } catch (e) {
            console.warn('[PWA] Cache prefetch warn:', url, e);
          }
        })
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // No interceptar llamadas a la API de Supabase
  if (req.url.includes('supabase.co')) {
    return;
  }

  // 1. NAVEGACIÓN (APERTURA DE LA APP INSTALADA / HTML):
  // Si está en caché, responde INMEDIATAMENTE (0 milisegundos de espera)
  if (req.mode === 'navigate' || (req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      (async () => {
        // Buscar en caché local ignorando parámetros (?utm_source=homescreen, etc.)
        const cached = (await caches.match(req, { ignoreSearch: true }))
          || (await caches.match('/', { ignoreSearch: true }))
          || (await caches.match('./', { ignoreSearch: true }))
          || (await caches.match('/index.html', { ignoreSearch: true }))
          || (await caches.match('./index.html', { ignoreSearch: true }));

        if (cached) {
          // Revalidación silenciosa en background sin frenar la apertura
          fetch(req).then(networkRes => {
            if (networkRes && networkRes.ok) {
              caches.open(CACHE_NAME).then(c => {
                c.put('/', networkRes.clone());
                c.put('./', networkRes.clone());
                c.put('/index.html', networkRes.clone());
                c.put('./index.html', networkRes.clone());
              });
            }
          }).catch(() => {});
          return cached;
        }

        // Si no estaba en caché, buscar en la red
        try {
          const networkRes = await fetch(req);
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then(c => {
              c.put('/', clone.clone());
              c.put('./', clone.clone());
            });
          }
          return networkRes;
        } catch (e) {
          return new Response('Ramen Mania Fuera de Línea', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
      })()
    );
    return;
  }

  // 2. CACHE-FIRST para imágenes, fuentes, iconos y scripts CDN
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && (
          req.url.startsWith(self.location.origin) ||
          req.url.includes('gstatic') ||
          req.url.includes('googleapis') ||
          req.url.includes('cdnjs') ||
          req.url.includes('jsdelivr')
        )) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return res;
      }).catch(err => {
        return cached;
      });
    })
  );
});
