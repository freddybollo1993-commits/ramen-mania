const CACHE_NAME = 'ramen-mania-v212';

// Shell del juego para instalar y abrir sin conexión: la página y todos sus scripts (js/ + archivos de apoyo)
const CORE_SHELL = [
  './',
  './index.html',
  './js/01-nucleo-supabase-dispositivo.js',
  './js/02-datos-ingredientes-recetas.js',
  './js/03-datos-niveles-campana.js',
  './js/04-estado-y-audio.js',
  './js/05-menu-recetas-areas.js',
  './js/06-etapas-navegacion.js',
  './js/07-makis-estacion.js',
  './js/08-salteados-wok.js',
  './js/09-etapas-motor.js',
  './js/10-produccion-taller-gestos.js',
  './js/11-emplatado-platos-salteado.js',
  './js/12-frituras-estacion.js',
  './js/13-areas-despensa-arrastre.js',
  './js/14-cuencos-estado-cocina.js',
  './js/15-ramen-fideos-clientes.js',
  './js/16-cooperativo-estaciones.js',
  './js/17-propinas-mejoras-progreso.js',
  './js/18-nube-cuenta.js',
  './js/19-entrenamiento.js',
  './js/20-estadisticas.js',
  './js/21-cocina-libre-mejoras-vfx.js',
  './js/22-calidad-servir.js',
  './js/23-ramen-sartenes-herramientas.js',
  './js/24-ramen-sartenes-shio-fideos.js',
  './js/25-partida-campana.js',
  './js/26-inicio-menu-modales.js',
  './js/28-perfil-ranking-pantalla.js',
  './js/29-secretos-datos.js',
  './js/31-orientacion-admin-arranque.js',
  './multiplayer.js',
  './makis-studio.js',
  './frituras-prod.js',
  './frituras-plate.js',
  './japon.js',
  './japon-scene.js',
  './reconocer.js',
  './recetario.js',
  './servicio.js',
  './avatar.js',
  './taller.js',
  './estilo-nuevo.css',
  './modos.js',
  './home.js',
  './guia.js',
  './escena-cocina.js',
  './inicio.js',
  './campana-mapa.js',
  './audio-ambiente.js',
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
          './assets/menu/zona1_placa_ancha.webp',
          './assets/menu/zona1_efectos.webp',
          './assets/menu/zona1_wok_poster.webp',
          './assets/menu/zona1_ramen_poster.webp',
          './assets/menu/zona1_freidora_poster.webp',
          './assets/menu/zona1_wok_video.webm',
          './assets/menu/zona1_ramen_video.webm',
          './assets/menu/zona1_freidora_video.webm',
          './assets/menu/zona1_mozo_video.webm',
          './assets/menu/cliente_kenji_2.webp',
          './assets/menu/cliente_sakura_2.webp',
          './assets/menu/cliente_hiroshi_2.webp',
          './assets/menu/cliente_akemi_2.webp',
          './assets/menu/cliente_takeshi_2.webp',
          './assets/menu/cliente_yuki_2.webp',
          './assets/menu/cliente_ren_2.webp',
          './assets/menu/cliente_aoi_2.webp',
          './assets/avatar/v1/armL.webp',
          './assets/avatar/v1/armR.webp',
          './assets/avatar/v1/gorro_corona.webp',
          './assets/avatar/v1/gorro_hachimaki.webp',
          './assets/avatar/v1/gorro_kasa.webp',
          './assets/avatar/v1/gorro_orejas.webp',
          './assets/avatar/v1/gorro_tenugui.webp',
          './assets/avatar/v1/gorro_toque.webp',
          './assets/avatar/v1/head.webp',
          './assets/avatar/v1/headB.webp',
          './assets/avatar/v1/low.webp',
          './assets/avatar/v1/pelo_coleta_b.webp',
          './assets/avatar/v1/pelo_corto.webp',
          './assets/avatar/v1/pelo_erizado.webp',
          './assets/avatar/v1/pelo_melena_b.webp',
          './assets/avatar/v1/pelo_melena_f.webp',
          './assets/avatar/v1/pelo_mono.webp',
          './assets/avatar/v1/pelo_rapado.webp',
          './assets/avatar/v1/slL_camiseta.webp',
          './assets/avatar/v1/slL_chef.webp',
          './assets/avatar/v1/slL_gala.webp',
          './assets/avatar/v1/slL_happi.webp',
          './assets/avatar/v1/slL_sudadera.webp',
          './assets/avatar/v1/slL_yukata.webp',
          './assets/avatar/v1/slR_camiseta.webp',
          './assets/avatar/v1/slR_chef.webp',
          './assets/avatar/v1/slR_gala.webp',
          './assets/avatar/v1/slR_happi.webp',
          './assets/avatar/v1/slR_sudadera.webp',
          './assets/avatar/v1/slR_yukata.webp',
          './assets/avatar/v1/tor_camiseta.webp',
          './assets/avatar/v1/tor_chef.webp',
          './assets/avatar/v1/tor_gala.webp',
          './assets/avatar/v1/tor_happi.webp',
          './assets/avatar/v1/tor_sudadera.webp',
          './assets/avatar/v1/tor_yukata.webp',
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

  // Herramientas de desarrollo (/tools/*): siempre desde la red, nunca desde la copia guardada (si no, una prueba editada sigue sirviendo la versión vieja)
  try { const pth = new URL(req.url).pathname; if (pth.indexOf('/tools/') === 0 || pth === '/panel' || pth.indexOf('/panel/') === 0) return; } catch (e) {}      // /panel/ tiene su propio service worker (panel/sw.js)

  // Videos (WebM de la cocina): el navegador pide trozos (Range). Si el archivo está guardado se responde con 206 y el trozo pedido
  if (req.headers.has('range')) {
    event.respondWith((async () => {
      const cached = await caches.match(req.url, { ignoreSearch: true });
      if (!cached) return fetch(req);
      const buf = await cached.arrayBuffer();
      const m = /bytes=(d*)-(d*)/.exec(req.headers.get('range')) || [];
      const start = m[1] ? +m[1] : 0, end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
      return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: { 'Content-Type': cached.headers.get('Content-Type') || 'video/webm', 'Content-Range': 'bytes ' + start + '-' + end + '/' + buf.byteLength, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
    })());
    return;
  }

  // 1. NAVEGACIÓN (HTML / APERTURA DE LA APP INSTALADA):
  // La copia guardada se abre AL INSTANTE (antes se esperaba hasta 4 s a la red antes de usarla: la app instalada tardaba en
  // iniciar). La red solo actualiza la copia en segundo plano; cada despliegue cambia CACHE_NAME, así que la versión nueva se
  // instala sola y la página se recarga en el menú de inicio (ver 'controllerchange' en index.html).
  // Otras páginas HTML del sitio (panel /dashboard, /admin, /tools/*.html): no son el juego, van a la red (si no hay conexión, se abre el juego)
  try {
    const u = new URL(req.url);
    if (u.origin === self.location.origin && req.mode === 'navigate' && (u.pathname === '/dashboard' || u.pathname === '/admin' || u.pathname.startsWith('/tools/') || (/\.html$/.test(u.pathname) && !/\/index\.html$/.test(u.pathname)))) {
      event.respondWith(fetch(req).catch(async () => (await caches.match('./index.html', { ignoreSearch: true })) || new Response('Sin conexión', { status: 503 })));
      return;
    }
  } catch (e) {}
  if (req.mode === 'navigate' || (req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = (await cache.match(req, { ignoreSearch: true }))
          || (await cache.match('./index.html', { ignoreSearch: true }))
          || (await cache.match('/index.html', { ignoreSearch: true }))
          || (await cache.match('./', { ignoreSearch: true }))
          || (await cache.match('/', { ignoreSearch: true }));
        if (cached) {
          event.waitUntil(refreshShell(cache, cached));
          return cached;
        }
        // primera vez (aún no hay copia): se va a la red, con un tope para no quedarse esperando
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const networkRes = await fetch(req, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            event.waitUntil(putShell(cache, clone));
            return networkRes;
          }
        } catch (e) {}
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

// Guarda el HTML en las rutas con las que se pide
async function putShell(cache, res) {
  const keys = ['./index.html', '/index.html', './', '/'];
  for (const k of keys) { try { await cache.put(k, res.clone()); } catch (e) {} }
}
// Actualiza la copia en segundo plano solo si el servidor tiene una versión distinta (ETag / Last-Modified)
async function refreshShell(cache, cached) {
  try {
    const res = await fetch('./index.html', { cache: 'no-cache' });
    if (!res || !res.ok) return;
    const a = res.headers.get('etag') || res.headers.get('last-modified');
    const b = cached.headers.get('etag') || cached.headers.get('last-modified');
    if (a && b && a === b) return;
    await putShell(cache, res);
  } catch (e) {}
}
