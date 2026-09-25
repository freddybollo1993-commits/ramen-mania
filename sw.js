const CACHE_NAME = 'ramen-mania-v5';

// Recursos esenciales que se guardan en menos de 100ms para arranque instantáneo (< 300KB)
const CORE_SHELL = [
  './',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/favicon-32x32.png',
  './assets/icons/favicon-16x16.png'
];

// Recursos secundarios que se descargan en segundo plano sin retrasar la instalación
const SECONDARY_ASSETS = [
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable.png',
  './assets/icons/apple-touch-icon.png',
  './assets/ramen_bg.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // 1. Guarda el shell mínimo de inmediato sin fallar por redirecciones
      await Promise.all(
        CORE_SHELL.map(url =>
          fetch(url, { cache: 'no-cache' })
            .then(res => {
              if (res.ok) {
                if (url === './') {
                  cache.put('./index.html', res.clone()).catch(() => {});
                }
                return cache.put(url, res);
              }
            })
            .catch(err => console.warn('[PWA] Cache error for:', url, err))
        )
      );

      // 2. Descarga imágenes secundarias en segundo plano sin bloquear
      SECONDARY_ASSETS.forEach(url => {
        fetch(url).then(res => {
          if (res.ok) cache.put(url, res);
        }).catch(() => {});
      });
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

  // No interceptar llamadas a la base de datos de Supabase
  if (req.url.includes('supabase.co')) {
    return;
  }

  // STALE-WHILE-REVALIDATE para la navegación principal / HTML:
  // Si está en caché, responde en 1 milisegundo (0ms espera), y revalida en background
  if (req.mode === 'navigate' || (req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return caches.match('./').then(cRoot => cRoot || caches.match('./index.html'));
      }).then(cached => {
        const networkFetch = fetch(req).then(res => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put('./', resClone.clone());
              cache.put('./index.html', resClone);
            });
          }
          return res;
        }).catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // CACHE-FIRST para imágenes, fuentes y scripts CDN
  event.respondWith(
    caches.match(req).then(cached => {
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
