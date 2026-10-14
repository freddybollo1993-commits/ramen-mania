/* Inicio Showcase Hub de Shimaya (Ramen Mania) - v138
   Arquitectura moderna:
   - Panel lateral izquierdo con los 3 Pilares y submenús integrados (deslizantes sobre el menú lateral).
   - El lado derecho es una vitrina 100% limpia para la ilustración viva con animación continua.
   - Cada opción y subopción actualiza en tiempo real su arte animado y una reseña detallada de qué es.
   - Cero popups o docks que invadan la ilustración.
*/
(function () {
  'use strict';

  const VKEY = 'ramen_inicio_vista2';
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const $ = id => document.getElementById(id);
  const sfx = n => { try { playSound(n); } catch (e) {} };

  // ---------- estado del jugador ----------
  const flags = () => { try { return (window.Guia && Guia.flags()) || {}; } catch (e) { return {}; } };
  const tutDone = () => { try { return isTutorialCompleted(); } catch (e) { return false; } };
  const firstTime = () => !tutDone();
  const rashLvl = () => parseInt(store.get('ramen_mania_rash_level') || '1') || 1;
  const wallet = () => { try { return getPropinasWallet(); } catch (e) { return 0; } };
  const retosHechos = () => { try { return trainingDoneCount(); } catch (e) { return 0; } };

  // ---------- salas (Aula, Secretos) ----------
  const ROOMS = {};
  const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  function roomApi() {
    return { leave: () => Inicio.leaveRoom(), act: (k, a) => Inicio.act(k, a), flags, firstTime, tutDone, rashLvl, retosHechos };
  }

  // ---------- datos del hub y reseñas ----------
  const DATA = {
    pillars: [
      {
        id: 'jugar',
        icon: '🍜',
        title: 'Jugar',
        sub: 'Campaña · Rash · Japón · Online',
        tag: 'MODO PRINCIPAL',
        heroTitle: 'Servicio en la Cocina',
        desc: 'Servicio en vivo: 8 niveles de Campaña, Supervivencia Rash extrema, Recorrido por Japón y Multijugador en línea.',
        pills: ['🔥 4 Cocinas', '⏱️ Contrarreloj', '🌐 Online'],
        ctaText: 'VER MODOS DE JUEGO ▶',
        defaultItem: 'camp'
      },
      {
        id: 'aprender',
        icon: '🎓',
        title: 'Aprender',
        sub: 'Aula · Retos · Cocina Libre',
        tag: 'ESCUELA CULINARIA',
        heroTitle: 'El Dojo del Maestro',
        desc: 'Academia tradicional: 4 disciplinas guiadas por el Maestro, 27 retos de técnica y práctica libre zen sin reloj.',
        pills: ['🎓 4 Lecciones', '🥋 27 Retos', '🌿 Práctica Zen'],
        ctaText: 'VER LECCIONES Y RETOS ▶',
        defaultItem: 'aula'
      },
      {
        id: 'restaurante',
        icon: '🏆',
        title: 'Mi Restaurante',
        sub: 'Mejoras · Recetario · Ranking',
        tag: 'PROGRESIÓN Y PRESTIGIO',
        heroTitle: 'Gestión y Progreso',
        desc: 'Centro de mando: 10 mejoras de cocina con propinas, recetario oficial de 35 platos, ranking mundial y nube.',
        pills: ['🧧 10 Mejoras', '📖 35 Recetas', '☁️ Nube y Perfil'],
        ctaText: 'VER MEJORAS Y RECETAS ▶',
        defaultItem: 'knives'
      },
      {
        id: 'gear',
        icon: '⚙️',
        title: 'Ajustes',
        sub: 'Sonido · Pantalla · Atajos',
        tag: 'SISTEMA Y AJUSTES',
        heroTitle: 'Ajustes del Sistema',
        desc: 'Configuración: audio y efectos de cocina, pantalla completa inmersiva, actualizaciones y atajos rápidos de PC.',
        pills: ['🔊 Audio', '⛶ Pantalla Completa', '🔄 Actualizar'],
        ctaText: 'CONFIGURAR SISTEMA ▶',
        defaultItem: 'sound'
      }
    ],

    jugar: [
      {
        id: 'camp',
        icon: '🏮',
        title: 'Campaña Gastronómica',
        sub: '8 niveles con metas de ventas',
        tag: 'MODO HISTORIA',
        heroTitle: 'Campaña Gastronómica',
        desc: 'Atiende comandas a contrarreloj en 8 niveles progresivos con metas de ventas diarias y evaluación de estrellas.',
        pills: ['⏱️ 8 Niveles', '📈 Metas Diarias', '⭐ Estrellas'],
        ctaText: '▶ JUGAR CAMPAÑA',
        act: 'camp',
        reqTut: true
      },
      {
        id: 'rash',
        icon: '⚡',
        title: 'Supervivencia Rash',
        sub: 'Rondas infinitas · 3 vidas',
        tag: 'DESAFÍO EXTREMO',
        heroTitle: 'Supervivencia Rash',
        desc: 'Arcade puro: clientes cada vez más veloces e impacientes. Solo tienes 3 vidas antes de cerrar el turno.',
        pills: ['⚡ Sin Fin', '❤️ 3 Vidas', '🏆 Récords'],
        ctaText: '⚡ JUGAR RASH',
        act: 'rash',
        reqTut: true
      },
      {
        id: 'door',
        icon: '🗾',
        title: 'Recorrido por Japón',
        sub: 'Franquicia en 9 ciudades',
        tag: 'EXPANSIÓN IDLE',
        heroTitle: 'Recorrido por Japón',
        desc: 'Abre restaurantes en 9 ciudades emblemáticas de Japón con ingresos pasivos en yenes las 24 horas y mejoras.',
        pills: ['🗾 9 Ciudades', '💴 Ingresos 24/7', '🏮 Mejoras'],
        ctaText: '🗾 VIAJAR POR JAPÓN',
        act: 'door'
      },
      {
        id: 'room',
        icon: '👥',
        title: 'Multijugador Online',
        sub: 'Duelos de 2 a 4 chefs en vivo',
        tag: 'COMPETITIVO EN LÍNEA',
        heroTitle: 'Duelo Culinario Online',
        desc: 'Compite cara a cara: crea salas privadas con código para amigos o entra al matchmaking global con rango MMR.',
        pills: ['👥 2-4 Jugadores', '🌐 Servidor Realtime', '⚔️ Rango MMR'],
        ctaText: '👥 ABRIR MULTIJUGADOR',
        act: 'room'
      }
    ],

    aprender: [
      {
        id: 'aula',
        icon: '🎓',
        title: 'Aula del Maestro',
        sub: 'Lecciones guiadas paso a paso',
        tag: 'TUTORIAL CON GUÍA',
        heroTitle: 'Aula del Maestro Chef',
        desc: 'Aprende las 4 disciplinas: caldos de Ramen, Wok, Makis y Frituras tempura. ¡Gana propinas la primera vez!',
        pills: ['🍜 Ramen', '🥘 Salteados', '🍣 Makis', '🍤 Frituras'],
        ctaText: '🎓 ENTRAR AL AULA',
        act: 'enter',
        arg: 'aula'
      },
      {
        id: 'tickets',
        icon: '🎫',
        title: 'Retos del Chef',
        sub: '27 desafíos con medallas',
        tag: 'DESAFÍOS TÉCNICOS',
        heroTitle: '27 Retos del Chef',
        desc: 'Comprueba tu velocidad y técnica bajo presión: comandas a ciegas y cortes express con medallas y propinas.',
        pills: [`🎫 ${retosHechos()}/27 Listos`, '🥇 Medallas', '🧧 Propinas'],
        ctaText: '🎫 VER LISTA DE RETOS',
        act: 'tickets'
      },
      {
        id: 'free',
        icon: '🌿',
        title: 'Cocina Libre Zen',
        sub: 'Práctica libre sin reloj',
        tag: 'PRÁCTICA TRANQUILA',
        heroTitle: 'Cocina Libre Zen',
        desc: 'Espacio para perfeccionar tu técnica a tu propio ritmo: sin reloj, sin comensales impacientes y sin notas.',
        pills: ['🌿 Sin Cronómetro', '🧘 Ritmo Propio', '✨ 35 Recetas'],
        ctaText: '🌿 ENTRAR A COCINA LIBRE',
        act: 'free'
      },
      {
        id: 'pantry',
        icon: '🔍',
        title: 'Modo Ingredientes',
        sub: 'Memoriza qué lleva cada plato',
        tag: 'AGILIDAD MENTAL',
        heroTitle: 'Despensa de Ingredientes',
        desc: 'Prueba tu memoria visual identificando rápidamente los ingredientes exactos que lleva cada plato tradicional.',
        pills: ['🧠 Memoria Visual', '🍱 35 Platos', '⏱️ Test Rápido'],
        ctaText: '🔍 ABRIR DESPENSA',
        act: 'pantry'
      }
    ],

    restaurante: [
      {
        id: 'knives',
        icon: '🧧',
        title: 'Tienda de Mejoras',
        sub: '10 utensilios y cuchillos',
        tag: 'EQUIPAMIENTO PERMANENTE',
        heroTitle: 'Tienda de Mejoras',
        desc: 'Invierte propinas en cuchillos de Sakai que dan paciencia a los clientes, amuletos de propina y ollas rápidas.',
        pills: [`🧧 Cartera: ${wallet()} 🧧`, '🔪 Cuchillos Sakai', '⏱️ +30% Paciencia'],
        ctaText: '🧧 ABRIR TIENDA',
        act: 'knives'
      },
      {
        id: 'book',
        icon: '📖',
        title: 'Recetario Oficial',
        sub: '35 recetas tradicionales',
        tag: 'ENCICLOPEDIA GASTRONÓMICA',
        heroTitle: 'Gran Recetario Oficial',
        desc: 'Compendio de 35 platos japoneses: ingredientes necesarios, orden de montaje, notas históricas y precios.',
        pills: ['🍜 8 Ramens', '🥘 7 Salteados', '🍣 11 Makis', '🍤 9 Frituras'],
        ctaText: '📖 ABRIR RECETARIO',
        act: 'book'
      },
      {
        id: 'board',
        icon: '🏆',
        title: 'Ranking Mundial',
        sub: 'Líderes de Campaña y Rash',
        tag: 'LEADERBOARD GLOBAL',
        heroTitle: 'Salón de la Fama',
        desc: 'Consulta los mejores chefs del mundo en puntuaciones de Campaña, rondas de Rash y ligas competitivas.',
        pills: ['🌍 Global Realtime', '🏆 Récords Rash', '⭐ Ligas MMR'],
        ctaText: '🏆 VER RANKING',
        act: 'board'
      },
      {
        id: 'acct',
        icon: '🔐',
        title: 'Mi Cuenta y Nube',
        sub: 'Clave ☁️, estadísticas y despensa',
        tag: 'GESTIÓN DE CUENTA',
        heroTitle: 'Perfil de Chef y Nube',
        desc: 'Asegura tu progreso en la nube con tu clave secreta para continuar en cualquier dispositivo sin perder nada.',
        pills: ['☁️ Nube Segura', '📊 Estadísticas', '🍱 Despensa'],
        ctaText: '🔐 GESTIONAR CUENTA',
        act: 'acct'
      }
    ],

    gear: [
      {
        id: 'sound',
        icon: '🔊',
        title: 'Sonido y Música',
        sub: 'Activar o silenciar efectos',
        tag: 'AJUSTES DE AUDIO',
        heroTitle: 'Audio y Efectos Sonoros',
        desc: 'Controla los efectos sonoros de la cocina, hervor, corte con cuchillo, fuego del wok y campanas de pedidos.',
        pills: ['🔊 Efectos de Cocina', '🎵 Música'],
        ctaText: '🔊 ALTERNAR SONIDO',
        act: 'sound'
      },
      {
        id: 'full',
        icon: '⛶',
        title: 'Pantalla Completa',
        sub: 'Modo inmersivo (Atajo: F)',
        tag: 'PANTALLA',
        heroTitle: 'Pantalla Completa',
        desc: 'Experiencia inmersiva total sin barras del navegador para cocinar con gestos táctiles precisos y fluidos.',
        pills: ['⛶ Inmersivo', '⌨️ Tecla F'],
        ctaText: '⛶ PANTALLA COMPLETA',
        act: 'full'
      },
      {
        id: 'update',
        icon: '🔄',
        title: 'Actualizar Juego',
        sub: 'Descarga la última versión',
        tag: 'SISTEMA',
        heroTitle: 'Actualización del Sistema',
        desc: 'Descarga la última versión del juego con mejoras y correcciones sin borrar tu cuenta ni tu progreso.',
        pills: ['⚡ Sin perder datos', '🔄 Descarga directa'],
        ctaText: '🔄 ACTUALIZAR AHORA',
        act: 'update'
      },
      {
        id: 'keys',
        icon: '⌨️',
        title: 'Atajos de Teclado',
        sub: 'Teclas rápidas para PC',
        tag: 'CONTROLES',
        heroTitle: 'Atajos de Teclado',
        desc: 'Teclas rápidas para PC: Espacio para jugar, 1-5 para áreas de cocina, M para silenciar y F para pantalla completa.',
        pills: ['🕹️ Espacio: Jugar', '🔢 Teclas 1-5'],
        ctaText: '⌨️ VER ATAJOS',
        act: 'keys'
      },
      {
        id: 'classic',
        icon: '📋',
        title: 'Menú Clásico',
        sub: 'Volver a botones de lista',
        tag: 'VISTA ALTERNATIVA',
        heroTitle: 'Menú Clásico',
        desc: 'Si prefieres el diseño anterior de botones apilados en lista simple, puedes volver a él cuando quieras.',
        pills: ['📋 Lista Simple', '🏠 Alternable'],
        ctaText: '📋 ACTIVAR MENÚ CLÁSICO',
        act: 'classic'
      }
    ]
  };

  // ---------- arte vectorial animado y vivo ----------
  function getArtworkSvg(key) {
    switch (key) {
      case 'jugar':
      case 'camp':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <defs>
              <radialGradient id="hGlow1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffb300" stop-opacity="0.35"/>
                <stop offset="70%" stop-color="#ff7043" stop-opacity="0.12"/>
                <stop offset="100%" stop-color="#ff7043" stop-opacity="0"/>
              </radialGradient>
              <linearGradient id="hSoup" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffca28"/>
                <stop offset="50%" stop-color="#f57c00"/>
                <stop offset="100%" stop-color="#b71c1c"/>
              </linearGradient>
              <linearGradient id="hBowl" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#1565c0"/>
                <stop offset="60%" stop-color="#0d47a1"/>
                <stop offset="100%" stop-color="#051b3d"/>
              </linearGradient>
            </defs>
            <circle cx="260" cy="220" r="170" fill="url(#hGlow1)"/>
            <!-- Faroles tradicionales colgando -->
            <g class="h-lantern l-1">
              <line x1="90" y1="0" x2="90" y2="70" stroke="#8d6e63" stroke-width="2"/>
              <ellipse cx="90" cy="100" rx="32" ry="42" fill="#c62828" stroke="#ffca28" stroke-width="3"/>
              <rect x="74" y="60" width="32" height="8" rx="3" fill="#212121"/>
              <rect x="74" y="132" width="32" height="8" rx="3" fill="#212121"/>
              <text x="90" y="108" fill="#fff8e1" font-size="20" font-weight="900" text-anchor="middle" font-family="'Fredoka',sans-serif">拉</text>
            </g>
            <g class="h-lantern l-2">
              <line x1="430" y1="0" x2="430" y2="80" stroke="#8d6e63" stroke-width="2"/>
              <ellipse cx="430" cy="110" rx="30" ry="40" fill="#c62828" stroke="#ffca28" stroke-width="3"/>
              <rect x="415" y="72" width="30" height="8" rx="3" fill="#212121"/>
              <rect x="415" y="140" width="30" height="8" rx="3" fill="#212121"/>
              <text x="430" y="117" fill="#fff8e1" font-size="19" font-weight="900" text-anchor="middle" font-family="'Fredoka',sans-serif">麺</text>
            </g>
            <!-- Cuenco principal -->
            <g class="h-hero-float">
              <!-- Sombra del cuenco -->
              <ellipse cx="260" cy="330" rx="140" ry="32" fill="rgba(0,0,0,0.5)"/>
              <!-- Cuerpo del bowl -->
              <path d="M130,210 Q140,320 260,320 Q380,320 390,210 Z" fill="url(#hBowl)" stroke="#ffca28" stroke-width="4"/>
              <!-- Borde del bowl -->
              <ellipse cx="260" cy="210" rx="130" ry="38" fill="#1e88e5" stroke="#ffca28" stroke-width="4"/>
              <!-- Caldo brillante -->
              <ellipse cx="260" cy="212" rx="122" ry="32" fill="url(#hSoup)"/>
              <!-- Fideos rizados -->
              <path d="M170,215 Q210,195 240,218 Q270,235 310,210" stroke="#fff176" stroke-width="5" fill="none" stroke-linecap="round"/>
              <path d="M190,225 Q230,205 270,222 Q300,230 340,212" stroke="#ffe082" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <!-- Nori crujiente -->
              <rect x="320" y="140" width="36" height="65" rx="4" transform="rotate(18 320 140)" fill="#1c2b1e" stroke="#0e1710" stroke-width="2"/>
              <!-- Chasu dorado -->
              <ellipse cx="220" cy="218" rx="38" ry="24" fill="#a0522d" stroke="#5d280b" stroke-width="2.5" transform="rotate(-12 220 218)"/>
              <ellipse cx="220" cy="218" rx="28" ry="16" fill="#cd853f" transform="rotate(-12 220 218)"/>
              <!-- Huevo Ajitsuke -->
              <g transform="translate(290, 205) rotate(14)">
                <ellipse cx="0" cy="0" rx="26" ry="18" fill="#fff9e6" stroke="#d7ccc8" stroke-width="2"/>
                <ellipse cx="2" cy="0" rx="16" ry="12" fill="#ff6f00"/>
                <ellipse cx="4" cy="-2" rx="12" ry="8" fill="#ffa000"/>
                <circle cx="8" cy="-4" r="3" fill="#ffffff" opacity="0.8"/>
              </g>
              <!-- Cebolla china picada (negi) -->
              <circle cx="250" cy="205" r="4" fill="#66bb6a"/>
              <circle cx="262" cy="212" r="4.5" fill="#43a047"/>
              <circle cx="272" cy="202" r="4" fill="#81c784"/>
              <circle cx="240" cy="222" r="3.5" fill="#43a047"/>
              <!-- Palillos cruzados -->
              <line x1="120" y1="180" x2="380" y2="155" stroke="#bcaaa4" stroke-width="6" stroke-linecap="round"/>
              <line x1="125" y1="190" x2="375" y2="168" stroke="#8d6e63" stroke-width="5" stroke-linecap="round"/>
            </g>
            <!-- Vapores de caldo animados -->
            <g class="h-steam-group">
              <path class="h-steam s1" d="M220,170 Q210,120 230,80 Q250,50 240,20" stroke="rgba(255,255,255,0.7)" stroke-width="7" fill="none" stroke-linecap="round"/>
              <path class="h-steam s2" d="M260,165 Q280,115 260,75 Q240,40 265,15" stroke="rgba(255,255,255,0.6)" stroke-width="8" fill="none" stroke-linecap="round"/>
              <path class="h-steam s3" d="M300,175 Q320,130 300,90 Q285,60 305,25" stroke="rgba(255,255,255,0.65)" stroke-width="6" fill="none" stroke-linecap="round"/>
            </g>
          </svg>
        `;

      case 'rash':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <defs>
              <radialGradient id="hFireGlow" cx="50%" cy="60%" r="55%">
                <stop offset="0%" stop-color="#ff3d00" stop-opacity="0.5"/>
                <stop offset="60%" stop-color="#ff9100" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="#ff3d00" stop-opacity="0"/>
              </radialGradient>
              <linearGradient id="hWok" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#424242"/>
                <stop offset="60%" stop-color="#212121"/>
                <stop offset="100%" stop-color="#111111"/>
              </linearGradient>
            </defs>
            <circle cx="260" cy="240" r="180" fill="url(#hFireGlow)"/>
            <!-- Llamas de fuego ardientes -->
            <g class="h-flame-group">
              <path class="h-flame f-back" d="M160,250 Q200,90 260,110 Q320,80 360,250 Z" fill="#ff3d00" opacity="0.8"/>
              <path class="h-flame f-mid" d="M190,260 Q230,130 260,140 Q300,120 330,260 Z" fill="#ff9100"/>
              <path class="h-flame f-core" d="M220,265 Q250,170 260,180 Q280,165 300,265 Z" fill="#ffea00"/>
              <path class="h-flame f-blue" d="M245,270 Q260,220 275,270 Z" fill="#00e5ff" opacity="0.9"/>
            </g>
            <!-- Wok inclinada -->
            <g class="h-hero-float">
              <ellipse cx="260" cy="275" rx="140" ry="45" fill="url(#hWok)" stroke="#616161" stroke-width="4"/>
              <path d="M390,265 L460,240" stroke="#795548" stroke-width="12" stroke-linecap="round"/>
              <circle cx="460" cy="240" r="8" fill="#ffb300"/>
            </g>
            <!-- Chispas saltando -->
            <circle class="h-spark sp-1" cx="220" cy="140" r="4" fill="#ffee58"/>
            <circle class="h-spark sp-2" cx="300" cy="110" r="5" fill="#ff7043"/>
            <circle class="h-spark sp-3" cx="250" cy="80" r="4" fill="#ffca28"/>
            <circle class="h-spark sp-4" cx="340" cy="160" r="3.5" fill="#ffab00"/>
            <!-- Relámpago arcade de velocidad -->
            <polygon class="h-bolt" points="290,40 270,100 295,95 260,160 310,90 285,95" fill="#ffd600" stroke="#fff" stroke-width="2"/>
          </svg>
        `;

      case 'door':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <defs>
              <linearGradient id="hSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#311b92"/>
                <stop offset="45%" stop-color="#b71c1c"/>
                <stop offset="85%" stop-color="#ff8f00"/>
                <stop offset="100%" stop-color="#ffe082"/>
              </linearGradient>
            </defs>
            <rect x="50" y="30" width="420" height="340" rx="20" fill="url(#hSky)" opacity="0.4"/>
            <!-- Sol naciente -->
            <circle cx="260" cy="190" r="75" fill="#d32f2f" opacity="0.9"/>
            <!-- Monte Fuji -->
            <polygon points="120,310 260,110 400,310" fill="#283593"/>
            <!-- Cima nevada -->
            <polygon points="215,175 260,110 305,175 285,185 270,170 255,185 240,170 228,185" fill="#ffffff"/>
            <!-- Pagoda tradicional -->
            <g transform="translate(100, 160)">
              <polygon points="40,20 20,40 60,40" fill="#b71c1c"/>
              <rect x="32" y="40" width="16" height="20" fill="#3e2723"/>
              <polygon points="40,55 10,75 70,75" fill="#b71c1c"/>
              <rect x="30" y="75" width="20" height="25" fill="#3e2723"/>
              <polygon points="40,95 0,115 80,115" fill="#b71c1c"/>
              <rect x="25" y="115" width="30" height="35" fill="#3e2723"/>
            </g>
            <!-- Torii vermellón en primer plano -->
            <g class="h-hero-float" transform="translate(260, 240)">
              <rect x="-70" y="-80" width="140" height="10" rx="3" fill="#c62828" stroke="#ffca28" stroke-width="1.5"/>
              <rect x="-60" y="-68" width="120" height="8" rx="2" fill="#b71c1c"/>
              <rect x="-45" y="-60" width="12" height="90" fill="#c62828"/>
              <rect x="33" y="-60" width="12" height="90" fill="#c62828"/>
              <circle cx="0" cy="-45" r="8" fill="#ffd54f"/>
            </g>
            <!-- Pétalos de Sakura cayendo -->
            <g class="h-sakura-group">
              <ellipse class="h-sakura sk-1" cx="190" cy="90" rx="8" ry="5" fill="#f48fb1" transform="rotate(25 190 90)"/>
              <ellipse class="h-sakura sk-2" cx="340" cy="130" rx="9" ry="6" fill="#f8bbd0" transform="rotate(-35 340 130)"/>
              <ellipse class="h-sakura sk-3" cx="230" cy="210" rx="7" ry="5" fill="#f06292" transform="rotate(50 230 210)"/>
              <ellipse class="h-sakura sk-4" cx="380" cy="260" rx="8" ry="5" fill="#f8bbd0" transform="rotate(-15 380 260)"/>
            </g>
          </svg>
        `;

      case 'room':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <defs>
              <linearGradient id="hVersusRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ff1744"/>
                <stop offset="100%" stop-color="#b71c1c"/>
              </linearGradient>
              <linearGradient id="hVersusBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00e5ff"/>
                <stop offset="100%" stop-color="#0d47a1"/>
              </linearGradient>
            </defs>
            <!-- Aura dual de duelo -->
            <ellipse cx="190" cy="200" rx="110" ry="110" fill="#d50000" opacity="0.2"/>
            <ellipse cx="330" cy="200" rx="110" ry="110" fill="#00b0ff" opacity="0.2"/>
            <!-- Cuchillos cruzados -->
            <g class="h-hero-float">
              <!-- Cuchillo Rojo Izquierda -->
              <g transform="translate(260, 200) rotate(-42)">
                <rect x="-12" y="20" width="24" height="60" rx="6" fill="#4e342e" stroke="#ff8a80" stroke-width="2"/>
                <path d="M-10,20 L10,20 L10,-90 Q-10,-60 -10,20 Z" fill="url(#hVersusRed)" stroke="#ffffff" stroke-width="2"/>
              </g>
              <!-- Cuchillo Azul Derecha -->
              <g transform="translate(260, 200) rotate(42)">
                <rect x="-12" y="20" width="24" height="60" rx="6" fill="#263238" stroke="#80d8ff" stroke-width="2"/>
                <path d="M-10,20 L10,20 L10,-90 Q-10,-60 -10,20 Z" fill="url(#hVersusBlue)" stroke="#ffffff" stroke-width="2"/>
              </g>
              <!-- Destello central de colisión -->
              <circle class="h-burst" cx="260" cy="170" r="28" fill="#fffde7" stroke="#ffd600" stroke-width="4"/>
              <text x="260" y="178" font-size="20" font-weight="900" text-anchor="middle" fill="#d50000" font-family="'Fredoka',sans-serif">VS</text>
            </g>
            <!-- Trofeo de liga inferior -->
            <g transform="translate(260, 310)">
              <ellipse cx="0" cy="22" rx="45" ry="12" fill="rgba(0,0,0,0.4)"/>
              <path d="M-28,15 L28,15 L18,-15 L-18,-15 Z" fill="#ffb300" stroke="#ff6f00" stroke-width="2"/>
              <ellipse cx="0" cy="-15" rx="32" ry="16" fill="#ffd54f" stroke="#ff6f00" stroke-width="2"/>
              <text x="0" y="-8" font-size="16" font-weight="900" text-anchor="middle" fill="#ff6f00">👑</text>
            </g>
          </svg>
        `;

      case 'aprender':
      case 'aula':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <defs>
              <linearGradient id="hScroll" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#fff8e1"/>
                <stop offset="50%" stop-color="#ffecb3"/>
                <stop offset="100%" stop-color="#ffe082"/>
              </linearGradient>
            </defs>
            <circle cx="260" cy="200" r="150" fill="#43a047" opacity="0.15"/>
            <!-- Pergamino antiguo desplegado -->
            <g class="h-hero-float" transform="translate(260, 180)">
              <rect x="-140" y="-70" width="280" height="140" rx="8" fill="url(#hScroll)" stroke="#8d6e63" stroke-width="4"/>
              <!-- Cilindros de madera del pergamino -->
              <rect x="-152" y="-80" width="16" height="160" rx="5" fill="#5d4037" stroke="#3e2723" stroke-width="2"/>
              <rect x="136" y="-80" width="16" height="160" rx="5" fill="#5d4037" stroke="#3e2723" stroke-width="2"/>
              <!-- Caligrafía japonesa -->
              <text x="-90" y="-20" font-size="28" font-weight="900" fill="#3e2723">道</text>
              <text x="-90" y="25" font-size="28" font-weight="900" fill="#b71c1c">師</text>
              <!-- Ilustración de técnicas dentro del pergamino -->
              <g transform="translate(20, -10)">
                <circle cx="0" cy="0" r="28" fill="#ffe082" stroke="#ffb300" stroke-width="2"/>
                <text x="0" y="10" font-size="26" text-anchor="middle">🍜</text>
                <circle cx="65" cy="0" r="28" fill="#ffe082" stroke="#ffb300" stroke-width="2"/>
                <text x="65" y="10" font-size="26" text-anchor="middle">🍣</text>
              </g>
              <!-- Sello imperial rojo -->
              <rect x="75" y="32" width="28" height="28" rx="4" fill="#c62828"/>
              <text x="89" y="52" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">極</text>
            </g>
            <!-- Cuchillo Yanagiba descansando con brillo de filo -->
            <g transform="translate(260, 310)">
              <rect x="-150" y="0" width="300" height="16" rx="4" fill="#a1887f"/>
              <!-- Hoja plateada -->
              <path class="h-blade" d="M-80,-4 L120,-4 Q135,-12 110,-12 L-80,-12 Z" fill="#eceff1" stroke="#b0bec5" stroke-width="1.5"/>
              <!-- Mango de madera -->
              <rect x="-130" y="-13" width="50" height="10" rx="2" fill="#3e2723" stroke="#212121" stroke-width="1"/>
              <!-- Destello de filo que recorre la hoja -->
              <polygon class="h-glint" points="40,-4 50,-12 60,-12 50,-4" fill="#ffffff" opacity="0.9"/>
            </g>
          </svg>
        `;

      case 'tickets':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <!-- Ticket dorado de Retos -->
            <g class="h-hero-float" transform="translate(260, 180)">
              <rect x="-120" y="-80" width="240" height="150" rx="12" fill="#fff9c4" stroke="#fbc02d" stroke-width="4"/>
              <line x1="-120" y1="20" x2="120" y2="20" stroke="#fbc02d" stroke-width="2.5" stroke-dasharray="6,5"/>
              <circle cx="-120" cy="20" r="14" fill="#180b06"/>
              <circle cx="120" cy="20" r="14" fill="#180b06"/>
              <text x="0" y="-30" font-size="28" font-weight="900" fill="#f57f17" text-anchor="middle" font-family="'Fredoka',sans-serif">CHEF CHALLENGE</text>
              <text x="0" y="0" font-size="15" font-weight="800" fill="#5d4037" text-anchor="middle">27 RETOS DE TÉCNICA</text>
              <text x="0" y="52" font-size="18" font-weight="900" fill="#c62828" text-anchor="middle">★ PREMIOS EN PROPINAS ★</text>
            </g>
            <!-- Medallas flotantes: Oro, Plata, Bronce -->
            <g transform="translate(190, 310)">
              <circle cx="0" cy="0" r="26" fill="#ffd54f" stroke="#ff8f00" stroke-width="3"/>
              <text x="0" y="9" font-size="22" text-anchor="middle">🥇</text>
            </g>
            <g transform="translate(260, 300)">
              <circle cx="0" cy="0" r="30" fill="#fff" stroke="#ffb300" stroke-width="3"/>
              <text x="0" y="11" font-size="26" text-anchor="middle">🏆</text>
            </g>
            <g transform="translate(330, 310)">
              <circle cx="0" cy="0" r="26" fill="#b0bec5" stroke="#78909c" stroke-width="3"/>
              <text x="0" y="9" font-size="22" text-anchor="middle">🥈</text>
            </g>
          </svg>
        `;

      case 'free':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <circle cx="260" cy="200" r="150" fill="#81c784" opacity="0.15"/>
            <!-- Tabla de cortar Zen -->
            <g class="h-hero-float" transform="translate(260, 210)">
              <ellipse cx="0" cy="60" rx="140" ry="25" fill="rgba(0,0,0,0.3)"/>
              <rect x="-130" y="-40" width="260" height="90" rx="14" fill="#d7ccc8" stroke="#8d6e63" stroke-width="4"/>
              <!-- Cuchillo Santoku en reposo -->
              <path d="M-70,10 L80,10 Q110,2 100,-15 L-70,-15 Z" fill="#eceff1" stroke="#90a4ae" stroke-width="2"/>
              <rect x="-120" y="-18" width="50" height="16" rx="3" fill="#3e2723"/>
              <!-- Verduras frescas cortadas -->
              <circle cx="40" cy="0" r="12" fill="#ff7043" stroke="#e64a19" stroke-width="1.5"/>
              <circle cx="65" cy="-8" r="10" fill="#66bb6a" stroke="#2e7d32" stroke-width="1.5"/>
              <rect x="-20" y="-8" width="18" height="18" rx="2" fill="#fff9c4" stroke="#fbc02d" stroke-width="1.5"/>
            </g>
            <!-- Caña de bambú zen -->
            <g transform="translate(390, 80)">
              <rect x="0" y="0" width="12" height="260" rx="3" fill="#66bb6a"/>
              <line x1="-3" y1="60" x2="15" y2="60" stroke="#388e3c" stroke-width="3"/>
              <line x1="-3" y1="130" x2="15" y2="130" stroke="#388e3c" stroke-width="3"/>
              <line x1="-3" y1="200" x2="15" y2="200" stroke="#388e3c" stroke-width="3"/>
              <!-- Hojas -->
              <path d="M12,60 Q50,40 70,65 Q35,75 12,60" fill="#81c784"/>
              <path d="M0,130 Q-40,110 -60,135 Q-25,145 0,130" fill="#81c784"/>
            </g>
          </svg>
        `;

      case 'pantry':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <!-- Frascos de especias en estantería -->
            <g class="h-hero-float" transform="translate(260, 200)">
              <rect x="-140" y="50" width="280" height="18" rx="4" fill="#8d6e63"/>
              <!-- Frasco 1: Shoyu / Salsas -->
              <rect x="-110" y="-30" width="45" height="80" rx="8" fill="#5d4037" stroke="#d7ccc8" stroke-width="2"/>
              <rect x="-100" y="-42" width="25" height="12" rx="2" fill="#bcaaa4"/>
              <text x="-88" y="15" font-size="14" fill="#ffecb3" font-weight="900" text-anchor="middle">油</text>
              <!-- Frasco 2: Togarashi -->
              <rect x="-45" y="-45" width="40" height="95" rx="6" fill="#d32f2f" stroke="#ffcdd2" stroke-width="2"/>
              <text x="-25" y="10" font-size="14" fill="#fff" font-weight="900" text-anchor="middle">辛</text>
              <!-- Frasco 3: Ajonjolí -->
              <rect x="15" y="-35" width="42" height="85" rx="7" fill="#fff9c4" stroke="#fbc02d" stroke-width="2"/>
              <text x="36" y="12" font-size="14" fill="#f57f17" font-weight="900" text-anchor="middle">芝</text>
              <!-- Lupa dorada enfocando -->
              <g transform="translate(60, -30) rotate(-25)">
                <circle cx="0" cy="0" r="36" fill="rgba(255,255,255,0.25)" stroke="#ffd54f" stroke-width="6"/>
                <rect x="32" y="-5" width="45" height="10" rx="4" fill="#ffb300"/>
                <circle cx="-10" cy="-10" r="8" fill="#fff" opacity="0.6"/>
              </g>
            </g>
          </svg>
        `;

      case 'restaurante':
      case 'knives':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <defs>
              <linearGradient id="hGoldCoin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fff176"/>
                <stop offset="50%" stop-color="#ffd54f"/>
                <stop offset="100%" stop-color="#ff8f00"/>
              </linearGradient>
            </defs>
            <circle cx="260" cy="210" r="160" fill="#ffb300" opacity="0.18"/>
            <!-- Estante de cuchillos profesionales en madera de cerezo -->
            <g class="h-hero-float" transform="translate(260, 180)">
              <rect x="-140" y="-80" width="280" height="150" rx="10" fill="#4e342e" stroke="#8d6e63" stroke-width="4"/>
              <!-- Cuchillo 1: Yanagiba -->
              <g transform="translate(-85, 0)">
                <rect x="-6" y="-60" width="12" height="40" rx="2" fill="#212121"/>
                <path d="M-5,-20 L5,-20 L4,50 Q-5,60 -5,-20 Z" fill="#eceff1" stroke="#b0bec5" stroke-width="1.5"/>
              </g>
              <!-- Cuchillo 2: Deba pesado -->
              <g transform="translate(-30, 0)">
                <rect x="-7" y="-60" width="14" height="40" rx="2" fill="#3e2723"/>
                <path d="M-8,-20 L8,-20 L6,45 Q-8,55 -8,-20 Z" fill="#cfd8dc" stroke="#90a4ae" stroke-width="1.5"/>
              </g>
              <!-- Cuchillo 3: Santoku -->
              <g transform="translate(30, 0)">
                <rect x="-6" y="-60" width="12" height="40" rx="2" fill="#212121"/>
                <path d="M-6,-20 L6,-20 L5,48 Q-6,56 -6,-20 Z" fill="#eceff1" stroke="#b0bec5" stroke-width="1.5"/>
              </g>
              <!-- Cuchillo 4: Nakiri verduras -->
              <g transform="translate(85, 0)">
                <rect x="-6" y="-60" width="12" height="40" rx="2" fill="#3e2723"/>
                <rect x="-7" y="-20" width="14" height="65" rx="1" fill="#cfd8dc" stroke="#90a4ae" stroke-width="1.5"/>
              </g>
            </g>
            <!-- Bolsa de propinas 🧧 desbordando monedas de oro -->
            <g transform="translate(260, 310)">
              <rect x="-40" y="-30" width="80" height="50" rx="10" fill="#c62828" stroke="#ffca28" stroke-width="3"/>
              <circle cx="0" cy="-5" r="14" fill="#ffd54f"/>
              <text x="0" y="1" font-size="14" font-weight="900" text-anchor="middle" fill="#c62828">福</text>
              <!-- Monedas Koban doradas -->
              <ellipse class="h-coin c-1" cx="-50" cy="10" rx="18" ry="12" fill="url(#hGoldCoin)" stroke="#ff8f00" stroke-width="2" transform="rotate(-20 -50 10)"/>
              <ellipse class="h-coin c-2" cx="50" cy="12" rx="18" ry="12" fill="url(#hGoldCoin)" stroke="#ff8f00" stroke-width="2" transform="rotate(25 50 12)"/>
            </g>
          </svg>
        `;

      case 'book':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <!-- Gran Recetario Abierto -->
            <g class="h-hero-float" transform="translate(260, 200)">
              <!-- Cubierta de cuero exterior -->
              <path d="M-150,-80 Q0,-65 0,-50 Q0,-65 150,-80 L150,85 Q0,70 0,85 Q0,70 -150,85 Z" fill="#3e2723" stroke="#ffd54f" stroke-width="4"/>
              <!-- Páginas abiertas iluminadas -->
              <path d="M-140,-70 Q0,-55 0,-40 L0,75 Q0,60 -140,75 Z" fill="#fffde7" stroke="#d7ccc8" stroke-width="2"/>
              <path d="M140,-70 Q0,-55 0,-40 L0,75 Q0,60 140,75 Z" fill="#fffde7" stroke="#d7ccc8" stroke-width="2"/>
              <!-- Ilustración página izquierda: Ramen -->
              <circle cx="-70" cy="-5" r="28" fill="#ffe082"/>
              <text x="-70" y="5" font-size="28" text-anchor="middle">🍜</text>
              <line x1="-120" y1="40" x2="-20" y2="40" stroke="#8d6e63" stroke-width="3" stroke-linecap="round"/>
              <line x1="-110" y1="52" x2="-30" y2="52" stroke="#bcaaa4" stroke-width="2.5" stroke-linecap="round"/>
              <!-- Ilustración página derecha: Makis -->
              <circle cx="70" cy="-5" r="28" fill="#c8e6c9"/>
              <text x="70" y="5" font-size="28" text-anchor="middle">🍣</text>
              <line x1="20" y1="40" x2="120" y2="40" stroke="#8d6e63" stroke-width="3" stroke-linecap="round"/>
              <line x1="30" y1="52" x2="110" y2="52" stroke="#bcaaa4" stroke-width="2.5" stroke-linecap="round"/>
            </g>
          </svg>
        `;

      case 'board':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <defs>
              <radialGradient id="hTrophyGlow" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stop-color="#ffd54f" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="#ffd54f" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="260" cy="180" r="160" fill="url(#hTrophyGlow)"/>
            <!-- Copa de Oro Principal -->
            <g class="h-hero-float" transform="translate(260, 180)">
              <!-- Asas de la copa -->
              <path d="M-60,-30 Q-95,-30 -80,20 Q-65,60 -35,50" stroke="#ff8f00" stroke-width="8" fill="none" stroke-linecap="round"/>
              <path d="M60,-30 Q95,-30 80,20 Q65,60 35,50" stroke="#ff8f00" stroke-width="8" fill="none" stroke-linecap="round"/>
              <!-- Copa cuerpo -->
              <path d="M-55,-50 L55,-50 L45,40 Q0,80 -45,40 Z" fill="#ffd54f" stroke="#ff8f00" stroke-width="4"/>
              <ellipse cx="0" cy="-50" rx="55" ry="14" fill="#ffe082" stroke="#ff8f00" stroke-width="4"/>
              <!-- Tallo y base -->
              <rect x="-12" y="65" width="24" height="30" fill="#ffb300" stroke="#ff8f00" stroke-width="2"/>
              <polygon points="-40,115 40,115 30,95 -30,95" fill="#ffa000" stroke="#ff8f00" stroke-width="3"/>
              <!-- Estrella de campeón en la copa -->
              <text x="0" y="15" font-size="34" font-weight="900" text-anchor="middle" fill="#d84315">★ 1 ★</text>
            </g>
            <!-- Podio de laureles -->
            <g transform="translate(260, 335)">
              <rect x="-120" y="-20" width="240" height="35" rx="6" fill="#37474f" stroke="#78909c" stroke-width="2"/>
              <text x="0" y="4" font-size="16" font-weight="900" text-anchor="middle" fill="#eceff1" font-family="'Fredoka',sans-serif">TOP CHEFS DEL MUNDO</text>
            </g>
          </svg>
        `;

      case 'acct':
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <circle cx="260" cy="200" r="150" fill="#0288d1" opacity="0.15"/>
            <!-- Nube de respaldo -->
            <g class="h-hero-float" transform="translate(260, 170)">
              <path d="M-60,30 Q-90,30 -85,-5 Q-80,-40 -40,-40 Q-25,-75 25,-70 Q70,-65 75,-25 Q105,-20 100,15 Q95,30 60,30 Z" fill="#e1f5fe" stroke="#0288d1" stroke-width="4"/>
              <!-- Candado de seguridad dorado -->
              <g transform="translate(0, -5)">
                <!-- Arco del candado -->
                <path d="M-16,0 L-16,-18 Q0,-32 16,-18 L16,0" fill="none" stroke="#ffd54f" stroke-width="6" stroke-linecap="round"/>
                <!-- Cuerpo del candado -->
                <rect x="-24" y="0" width="48" height="38" rx="6" fill="#ffb300" stroke="#ff8f00" stroke-width="3"/>
                <circle cx="0" cy="16" r="5" fill="#3e2723"/>
                <line x1="0" y1="18" x2="0" y2="28" stroke="#3e2723" stroke-width="3"/>
              </g>
            </g>
            <!-- Sello Hanko tradicional del chef -->
            <g transform="translate(260, 305)">
              <rect x="-70" y="-15" width="140" height="30" rx="6" fill="#b71c1c" stroke="#ffca28" stroke-width="2"/>
              <text x="0" y="6" font-size="14" font-weight="900" fill="#fff" text-anchor="middle" font-family="'Fredoka',sans-serif">LICENCIA DE CHEF ☁️</text>
            </g>
          </svg>
        `;

      case 'gear':
      default:
        return `
          <svg viewBox="0 0 520 400" width="100%" height="100%" class="h-svg">
            <circle cx="260" cy="200" r="150" fill="#ffb300" opacity="0.15"/>
            <!-- Engranajes de precisión animados -->
            <g class="h-hero-float" transform="translate(260, 190)">
              <!-- Engranaje grande central -->
              <g class="h-gear g-main">
                <circle cx="0" cy="0" r="55" fill="#bcaaa4" stroke="#5d4037" stroke-width="4"/>
                <circle cx="0" cy="0" r="24" fill="#3e2723"/>
                <!-- Dientes -->
                <rect x="-8" y="-70" width="16" height="20" rx="3" fill="#8d6e63"/>
                <rect x="-8" y="50" width="16" height="20" rx="3" fill="#8d6e63"/>
                <rect x="-70" y="-8" width="20" height="16" rx="3" fill="#8d6e63"/>
                <rect x="50" y="-8" width="20" height="16" rx="3" fill="#8d6e63"/>
              </g>
              <!-- Engranaje dorado satélite -->
              <g class="h-gear g-sub" transform="translate(75, -50)">
                <circle cx="0" cy="0" r="32" fill="#ffd54f" stroke="#ff8f00" stroke-width="3"/>
                <circle cx="0" cy="0" r="12" fill="#3e2723"/>
              </g>
            </g>
            <!-- Panel indicador -->
            <g transform="translate(260, 315)">
              <rect x="-100" y="-15" width="200" height="30" rx="8" fill="#212121" stroke="#ffb300" stroke-width="2"/>
              <text x="0" y="5" font-size="14" font-weight="900" fill="#ffca28" text-anchor="middle">⚙️ AJUSTES DEL SISTEMA</text>
            </g>
          </svg>
        `;
    }
  }

  // ---------- estilos css del nuevo hub ----------
  const CSS = `
  #start-screen.ini-on .start-screen-content, #start-screen.ini-on .start-ambient-bg, #start-screen.ini-on .start-lantern, #start-screen.ini-on .start-steam-particles { display: none !important; }
  #start-screen.ini-on .start-footer-bar { display: none !important; }
  #start-screen.ini-on .start-screen-top-bar { pointer-events: none; }
  #start-screen.ini-on .start-screen-top-bar > *, #start-screen.ini-on .start-screen-top-bar button { pointer-events: auto; }
  #start-screen .ini-wrap, #start-screen .ini-back { display: none; }
  #start-screen.ini-on .ini-wrap { display: flex; }
  #start-screen:not(.ini-on) .ini-back { display: block; }

  /* Contenedor principal a pantalla completa */
  .ini-wrap {
    position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: row;
    background: radial-gradient(ellipse at 70% 50%, #32160d 0%, #1c0b06 60%, #0d0402 100%);
    font-family: 'Fredoka', sans-serif; color: #fff8e7; overflow: hidden; user-select: none; -webkit-user-select: none;
  }

  /* BARRA LATERAL IZQUIERDA */
  .hub-sidebar {
    width: clamp(290px, 35%, 350px); height: 100%; flex: none; display: flex; flex-direction: column;
    background: linear-gradient(180deg, rgba(34, 16, 9, 0.98), rgba(18, 8, 4, 0.98));
    border-right: 2.5px solid rgba(138, 90, 43, 0.5); box-shadow: 6px 0 24px rgba(0,0,0,0.6);
    padding: 10px 12px 10px; box-sizing: border-box; z-index: 10; position: relative;
  }

  /* Cabecera del sidebar */
  .hub-side-header { flex: none; margin-bottom: 6px; }
  .hub-brand { display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; border-bottom: 1.5px solid rgba(138,90,43,0.3); }
  .hub-brand-logo { font: 900 15px/1 'Fredoka', sans-serif; color: #ffe082; display: flex; align-items: center; gap: 6px; letter-spacing: 0.5px; }
  .hub-brand-logo span { color: #ffab91; font-size: 11px; font-weight: 700; }
  .hub-wallet-badge { background: rgba(0,0,0,0.4); border: 1.5px solid #ffb300; border-radius: 12px; padding: 2px 8px; font: 900 11px sans-serif; color: #ffd54f; }

  /* Botón de volver en submenú */
  .hub-back-btn {
    width: 100%; border: 2px solid #8a5a00; border-radius: 10px; background: linear-gradient(#ffe082, #ffb300);
    color: #3b2208; font: 900 12.5px/1 'Fredoka', sans-serif; padding: 7px 10px; display: flex; align-items: center; gap: 6px;
    cursor: pointer; box-shadow: 0 2px 0 #8a5a00; margin-bottom: 4px; transition: transform 0.12s, box-shadow 0.12s;
  }
  .hub-back-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #8a5a00; }
  .hub-sub-title { font: 900 10.5px 'Fredoka', sans-serif; text-transform: uppercase; letter-spacing: 0.8px; color: #ffcc80; padding: 0 2px 2px; }

  /* Lista de opciones con scroll vertical y snapping en Posición 2 */
  .hub-list-wrap {
    flex: 1; min-height: 0; overflow-y: scroll; display: flex; flex-direction: column;
    gap: 8px; padding-right: 2px;
    padding-top: 76px;    /* Espacio del Slot 1: el primer item inicia exactamente en Posición 2 */
    padding-bottom: 160px; /* Margen inferior para permitir que el último item alcance la Posición 2 */
    scroll-padding-top: 76px;
    scroll-snap-type: y mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 200, 60, 0.3) transparent;
    mask-image: linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 28px), transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 28px), transparent 100%);
  }

  /* Opciones del menú: amplias, con altura de 68px y padding ergonómico */
  .hub-item {
    height: 68px; flex: none; box-sizing: border-box;
    scroll-snap-align: start;
    border-radius: 14px;
    padding: 10px 14px;
    display: flex; align-items: center; gap: 10px;
    cursor: pointer; text-align: left;
    font-family: inherit;
    /* Estado desenfocado por defecto (Posiciones 1, 3 o 4) */
    opacity: 0.38;
    transform: scale(0.95);
    background: rgba(32, 14, 8, 0.72);
    border: 1.5px solid rgba(138, 90, 43, 0.3);
    color: #cbb393;
    box-shadow: none;
    transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), background 0.22s, border-color 0.22s, box-shadow 0.22s;
  }
  .hub-item:hover:not(.sel) { opacity: 0.65; transform: scale(0.98); }

  /* SOLO UNA OPCIÓN SE RESALTA: La que está en Posición 2 */
  .hub-item.sel {
    opacity: 1;
    transform: scale(1.02) translateX(4px);
    background: linear-gradient(135deg, #ffe9a8, #ffc84a);
    border: 2.5px solid #ffb300;
    color: #2c1605;
    box-shadow: 0 4px 18px rgba(255, 179, 0, 0.55), 0 0 12px rgba(255, 215, 0, 0.35);
  }
  .hub-item-icon { font-size: 26px; width: 32px; text-align: center; flex: none; line-height: 1; }
  .hub-item-text { flex: 1; min-width: 0; }
  .hub-item-text b { display: block; font: 900 15px/1.2 'Fredoka', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hub-item-text small { display: block; font: 700 11px/1.25 sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.9; }

  .hub-item:not(.sel) .hub-item-text b { color: #e0ccb4; }
  .hub-item:not(.sel) .hub-item-text small { color: #9c8065; }
  .hub-item.sel .hub-item-text b { color: #2c1605; }
  .hub-item.sel .hub-item-text small { color: #6d4810; font-weight: 800; }

  /* Badge indicador y flecha de acción */
  .hub-item-badge {
    display: none; font: 900 9px 'Fredoka', sans-serif; padding: 2px 6px; border-radius: 6px;
    background: rgba(44, 22, 5, 0.15); border: 1px solid rgba(44, 22, 5, 0.3); color: #2c1605;
  }
  .hub-item.sel .hub-item-badge { display: inline-block; }
  .hub-item-arrow { font-style: normal; font-weight: 900; color: #b71c1c; font-size: 15px; opacity: 0; transition: opacity 0.18s; }
  .hub-item.sel .hub-item-arrow { opacity: 1; }
  .hub-item.locked { opacity: 0.35; filter: grayscale(0.6); }

  /* ESCENARIO / VITRINA DE LA ILUSTRACIÓN DERECHA */
  .hub-stage {
    flex: 1; height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column;
    justify-content: flex-end; padding: 14px 20px 18px; box-sizing: border-box;
  }

  /* Ilustración animada viva de fondo / centro (completamente despejada) */
  .hub-art-wrap {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    pointer-events: none; z-index: 1; transition: opacity 0.22s ease, transform 0.22s ease;
  }
  .hub-art-wrap.fade-out { opacity: 0; transform: scale(0.96); }

  /* Tarjeta de Reseña y Acción sobrepuesta - compacta y con fondo translúcido no sólido */
  .hub-meta-card {
    position: relative; z-index: 3; max-width: min(440px, 88%);
    background: rgba(18, 8, 4, 0.42); /* Fondo translúcido para apreciar la animación viva detrás */
    border: 1.5px solid rgba(255, 200, 60, 0.28); border-radius: 16px; padding: 10px 16px 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.35), 0 0 12px rgba(255, 179, 0, 0.1);
    backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
    animation: hubCardIn 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
  }
  @keyframes hubCardIn { from { opacity: 0; transform: translateY(10px); } }

  .hub-meta-tag {
    display: inline-block; background: rgba(255, 179, 0, 0.15); border: 1px solid rgba(255, 179, 0, 0.6);
    border-radius: 6px; padding: 1px 6px; font: 900 9px 'Fredoka', sans-serif; color: #ffd54f;
    letter-spacing: 0.6px; margin-bottom: 2px; text-transform: uppercase;
  }
  .hub-meta-title { margin: 0 0 2px; font: 900 18px/1.15 'Fredoka', sans-serif; color: #fff8e7; text-shadow: 0 2px 4px rgba(0,0,0,0.9); }
  .hub-meta-desc { margin: 0 0 8px; font: 600 11px/1.35 sans-serif; color: #f5dfba; text-shadow: 0 1px 3px rgba(0,0,0,0.9); }

  .hub-meta-pills { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
  .hub-pill { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.16); border-radius: 6px; padding: 1.5px 6px; font: 800 10px sans-serif; color: #ffe082; }

  /* Botón CTA de acción compacto */
  .hub-cta-btn {
    border: 2px solid #ffe082; border-radius: 10px; padding: 7px 18px;
    background: linear-gradient(135deg, #ff9800, #e64a19 65%, #c62828);
    color: #ffffff; font: 900 13.5px/1 'Fredoka', sans-serif; cursor: pointer;
    box-shadow: 0 3px 0 #7f0000, 0 0 14px rgba(255, 152, 0, 0.45);
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5); transition: transform 0.12s, box-shadow 0.12s;
  }
  .hub-cta-btn:active { transform: translateY(1.5px); box-shadow: 0 1.5px 0 #7f0000; }
  .hub-cta-btn.locked { background: #616161; border-color: #9e9e9e; box-shadow: none; cursor: default; }

  /* ANIMACIONES DE LA ILUSTRACIÓN VIVA */
  .h-svg { overflow: visible; }
  .h-hero-float { animation: hHeroFloat 3.2s ease-in-out infinite; transform-origin: 50% 60%; }
  @keyframes hHeroFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  /* Faroles meciéndose */
  .h-lantern.l-1 { transform-origin: 90px 0; animation: hLantern 4s ease-in-out infinite; }
  .h-lantern.l-2 { transform-origin: 430px 0; animation: hLantern 3.6s ease-in-out infinite reverse; }
  @keyframes hLantern { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(6deg); } }

  /* Vapores ondulantes */
  .h-steam { stroke-dasharray: 80; stroke-dashoffset: 80; animation: hSteamRise 2.8s ease-out infinite; }
  .h-steam.s2 { animation-delay: 0.9s; }
  .h-steam.s3 { animation-delay: 1.8s; }
  @keyframes hSteamRise {
    0% { stroke-dashoffset: 80; opacity: 0; transform: translateY(8px); }
    40% { opacity: 0.75; }
    100% { stroke-dashoffset: 0; opacity: 0; transform: translateY(-24px); }
  }

  /* Llamas del Wok */
  .h-flame.f-back { animation: hFlame 0.35s ease-in-out infinite alternate; transform-origin: 50% 100%; }
  .h-flame.f-mid { animation: hFlame 0.28s ease-in-out infinite alternate-reverse; transform-origin: 50% 100%; }
  .h-flame.f-core { animation: hFlame 0.22s ease-in-out infinite alternate; transform-origin: 50% 100%; }
  @keyframes hFlame { 0% { transform: scaleY(0.92) scaleX(0.97); } 100% { transform: scaleY(1.1) scaleX(1.03); } }

  /* Chispas flotando */
  .h-spark { animation: hSpark 1.6s ease-out infinite; }
  .h-spark.sp-2 { animation-delay: 0.4s; }
  .h-spark.sp-3 { animation-delay: 0.8s; }
  .h-spark.sp-4 { animation-delay: 1.2s; }
  @keyframes hSpark {
    0% { transform: translateY(12px) scale(0.6); opacity: 0; }
    30% { opacity: 1; }
    100% { transform: translateY(-40px) scale(1.4); opacity: 0; }
  }

  /* Destello de filo de cuchillo */
  .h-glint { animation: hGlint 3s ease-in-out infinite; }
  @keyframes hGlint {
    0%, 70%, 100% { opacity: 0; transform: translateX(-30px); }
    85% { opacity: 0.95; transform: translateX(50px); }
  }

  /* Brillo de moneda */
  .h-coin { animation: hCoin 2.4s ease-in-out infinite alternate; transform-origin: center; }
  .h-coin.c-2 { animation-delay: 1.2s; }
  @keyframes hCoin { 0% { filter: brightness(0.9); } 100% { filter: brightness(1.25) drop-shadow(0 0 6px #ffb300); } }

  /* Pétalos de Sakura */
  .h-sakura { animation: hSakura 3.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .h-sakura.sk-2 { animation-delay: 0.9s; }
  .h-sakura.sk-3 { animation-delay: 1.8s; }
  .h-sakura.sk-4 { animation-delay: 2.7s; }
  @keyframes hSakura {
    0% { transform: translateY(-15px) rotate(0); opacity: 0; }
    30% { opacity: 0.9; }
    100% { transform: translateY(40px) rotate(180deg); opacity: 0; }
  }

  /* Engranajes rotando */
  .h-gear.g-main { animation: hSpin 18s linear infinite; transform-origin: 0 0; }
  .h-gear.g-sub { animation: hSpin 10s linear infinite reverse; transform-origin: 0 0; }
  @keyframes hSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

  /* Sala de transiciones */
  .ini-room { display: none; position: absolute; inset: 0; z-index: 48; padding-top: 44px; box-sizing: border-box; background: #1f0e08; overflow: hidden; }
  .ini-room.arrive { animation: iniArrive 0.36s cubic-bezier(.1,.7,.2,1); }
  .ini-room.leaving { animation: iniLeave 0.32s cubic-bezier(.6,0,1,.5) forwards; }
  @keyframes iniArrive { from { transform: scale(1.15); opacity: 0.2; } to { transform: none; opacity: 1; } }
  @keyframes iniLeave { to { transform: scale(0.85); opacity: 0; } }

  /* Botón de volver al modo nuevo si está en clásico */
  .ini-back { position: absolute; left: 10px; bottom: 36px; z-index: 120; border: 2px solid #ffe082; border-radius: 14px; background: rgba(60,25,12,0.92); color: #ffe9b0; font: 800 12px 'Fredoka', sans-serif; padding: 4px 12px; cursor: pointer; }

  /* Responsive para pantallas estrechas */
  @media (max-width: 680px) {
    .hub-sidebar { width: 240px; padding: 8px 10px; }
    .hub-item { height: 60px; padding: 8px 10px; }
    .hub-item-icon { font-size: 22px; width: 26px; }
    .hub-item-text b { font-size: 13.5px; }
    .hub-item-text small { font-size: 10px; }
    .hub-list-wrap { padding-top: 68px; scroll-padding-top: 68px; }
    .hub-stage { padding: 10px 14px 14px; }
    .hub-meta-card { padding: 8px 12px 10px; max-width: 95%; }
    .hub-meta-title { font-size: 16px; }
    .hub-meta-desc { font-size: 10.5px; margin-bottom: 5px; }
    .hub-cta-btn { padding: 6px 14px; font-size: 12.5px; }
  }
  `;

  function css() {
    if ($('ini-css')) return;
    const s = document.createElement('style'); s.id = 'ini-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---------- acciones del juego ----------
  const ACT = {
    lesson: k => Guia.start(k),
    train: ch => openTrainingModal(null, [ch]),
    tickets: () => openTrainingModal(),
    free: a => { window.startFreeAreas = a ? [a] : ['ramen']; setStartSelectedMode('FREE'); handleStartPlayClick(); },
    camp: () => { setStartSelectedMode('NORMAL'); if (startSelectedMode === 'NORMAL') handleStartPlayClick(); },
    rash: () => { setStartSelectedMode('RASH'); if (startSelectedMode === 'RASH') handleStartPlayClick(); },
    book: () => openRecipeModal(),
    board: () => openLeaderboardModal(),
    chest: () => openSecretosModal(),
    knives: () => openUpgradesModal(),
    pantry: () => reconOpen(),
    door: () => japonOpen(),
    room: () => MultiplayerManager.openLobbyModal(),
    acct: () => openAccountModal(),
    stats: () => openStatsModal(),
    order: () => openIngredientOrderModal(),
    sound: () => toggleAudioMute(),
    full: () => toggleFullScreen(),
    keys: () => openShortcutsModal(),
    update: () => forceAppCacheUpdate(),
    device: () => showDeviceInfoModal(),
    classic: () => Inicio.setView('classic'),
    hubview: () => Inicio.setView('hub'),
    enter: n => Inicio.enterRoom(n)
  };

  // ---------- estado del componente Hub ----------
  let S = null;

  function create() {
    css();
    const sc = $('start-screen'); if (!sc) return false;
    const wrap = document.createElement('div'); wrap.className = 'ini-wrap';

    // Barra lateral izquierda
    const side = document.createElement('div'); side.className = 'hub-sidebar';
    wrap.appendChild(side);

    // Escenario derecho
    const stage = document.createElement('div'); stage.className = 'hub-stage';
    wrap.appendChild(stage);

    // Contenedor de la ilustración viva
    const artWrap = document.createElement('div'); artWrap.className = 'hub-art-wrap';
    stage.appendChild(artWrap);

    // Contenedor de la tarjeta meta / reseña
    const metaWrap = document.createElement('div'); metaWrap.className = 'hub-meta-card';
    stage.appendChild(metaWrap);

    // Sala de transiciones (Aula, Secretos)
    const room = document.createElement('div'); room.className = 'ini-room';
    wrap.appendChild(room);

    sc.appendChild(wrap);

    S = {
      wrap, side, stage, artWrap, metaWrap, room,
      sub: null,         // null (nivel raíz pilares) | 'jugar' | 'aprender' | 'restaurante' | 'gear'
      item: 'jugar',     // clave del item actualmente seleccionado y mostrado en la vitrina
      curRoom: null,
      busy: false
    };

    render();
    return true;
  }

  // ---------- lógica de navegación y renderizado ----------
  function getItemData(key) {
    // Busca en pilares primero
    const p = DATA.pillars.find(x => x.id === key);
    if (p) return p;
    // Busca en submenús
    for (const group of ['jugar', 'aprender', 'restaurante', 'gear']) {
      const it = (DATA[group] || []).find(x => x.id === key);
      if (it) return it;
    }
    return DATA.pillars[0];
  }

  const SLOT_H = 76;
  const SLOT2_CENTER = 110;
  let scrollTicking = false;
  let snapTimer = null;

  function bindListScroll() {
    if (!S || !S.side) return;
    const list = S.side.querySelector('.hub-list-wrap');
    if (!list) return;

    const items = Array.from(list.querySelectorAll('.hub-item'));
    if (!items.length) return;

    // Buscar el índice del elemento actual
    const curIdx = items.findIndex(el => el.dataset.id === S.item);
    const targetIdx = curIdx >= 0 ? curIdx : 0;

    // Posicionar el elemento exactamente en Posición 2
    list.scrollTop = targetIdx * SLOT_H;

    // Asegurar que solo el item en targetIdx tenga .sel
    items.forEach((el, idx) => el.classList.toggle('sel', idx === targetIdx));

    // Listener de scroll fluido con detección de Posición 2
    list.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          updateHighlightFromScroll(list);
          scrollTicking = false;
        });
        scrollTicking = true;
      }
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        snapToClosestSlot(list);
      }, 140);
    }, { passive: true });
  }

  function snapToClosestSlot(list) {
    if (!list) return;
    const currentScroll = list.scrollTop;
    const targetIndex = Math.round(currentScroll / SLOT_H);
    const items = list.querySelectorAll('.hub-item');
    if (targetIndex >= 0 && targetIndex < items.length) {
      list.scrollTo({ top: targetIndex * SLOT_H, behavior: 'smooth' });
    }
  }

  function updateHighlightFromScroll(list) {
    if (!list || !S) return;
    const items = Array.from(list.querySelectorAll('.hub-item'));
    if (!items.length) return;

    const listRect = list.getBoundingClientRect();
    const targetCenterY = listRect.top + SLOT2_CENTER;

    let closest = null;
    let minDist = Infinity;

    items.forEach(item => {
      const r = item.getBoundingClientRect();
      const itemCenter = r.top + (r.height / 2);
      const dist = Math.abs(itemCenter - targetCenterY);
      if (dist < minDist) {
        minDist = dist;
        closest = item;
      }
    });

    if (closest && !closest.classList.contains('sel')) {
      items.forEach(el => el.classList.remove('sel'));
      closest.classList.add('sel');
      const id = closest.dataset.id;
      if (id && S.item !== id) {
        S.item = id;
        renderShowcase();
        sfx('click');
      }
    }
  }

  function handleItemClick(id, element) {
    if (!S) return;
    const list = element.closest('.hub-list-wrap');
    if (!list) return;

    // Si la opción ya está en Posición 2 (resaltada): se entra en sus opciones adicionales
    if (element.classList.contains('sel')) {
      triggerActiveItem();
    } else {
      // Si no estaba en Posición 2: hacer scroll suave hasta la Posición 2 y resaltar
      sfx('click');
      const items = Array.from(list.querySelectorAll('.hub-item'));
      const idx = items.indexOf(element);
      if (idx >= 0) {
        list.scrollTo({ top: idx * SLOT_H, behavior: 'smooth' });
      }
      items.forEach(el => el.classList.remove('sel'));
      element.classList.add('sel');
      S.item = id;
      renderShowcase();
    }
  }

  function selectOption(id) {
    if (!S || !S.side) return;
    const list = S.side.querySelector('.hub-list-wrap');
    if (!list) return;
    const target = list.querySelector(`.hub-item[data-id="${id}"]`);
    if (target) handleItemClick(id, target);
  }

  function goBack() {
    if (!S) return;
    sfx('click');
    const prevSub = S.sub;
    S.sub = null;
    S.item = prevSub || 'jugar';
    renderSidebar();
    renderShowcase();
  }

  function triggerActiveItem() {
    if (!S) return;
    const it = getItemData(S.item);
    if (!it) return;

    // Si estamos en la raíz y es un pilar: abrir sus opciones adicionales (submenú)
    if (!S.sub) {
      const pilar = DATA.pillars.find(p => p.id === S.item);
      if (pilar) {
        sfx('serve');
        S.sub = pilar.id;
        S.item = pilar.defaultItem || pilar.id;
        renderSidebar();
        renderShowcase();
        return;
      }
    }

    // Validación de tutorial previo
    if (it.reqTut && !tutDone()) {
      sfx('deny');
      try { showStationToast('🔒 Completa primero la lección de Ramen con el Maestro.'); } catch (e) {}
      return;
    }

    sfx('serve');
    if (it.act) {
      Inicio.act(it.act, it.arg);
    } else if (it.ctaAct) {
      Inicio.act(it.ctaAct, it.ctaArg);
    } else if (it.defaultItem) {
      S.sub = it.id;
      S.item = it.defaultItem;
      renderSidebar();
      renderShowcase();
    }
  }

  function renderSidebar() {
    if (!S) return;
    let html = '';

    if (!S.sub) {
      // NIVEL RAÍZ: 4 Pilares principales en lista deslizable
      html += `
        <div class="hub-side-header">
          <div class="hub-brand">
            <div class="hub-brand-logo">🏮 SHIMAYA <span>RAMEN MANIA</span></div>
            <div class="hub-wallet-badge">${wallet()} 🧧</div>
          </div>
        </div>
        <div class="hub-list-wrap">
          ${DATA.pillars.map(p => `
            <div class="hub-item ${S.item === p.id ? 'sel' : ''}" data-id="${p.id}" onclick="Inicio.onItemClick('${p.id}', this)">
              <span class="hub-item-icon">${p.icon}</span>
              <span class="hub-item-text">
                <b>${p.title}</b>
                <small>${p.sub}</small>
              </span>
              <span class="hub-item-badge">ENTRAR</span>
              <em class="hub-item-arrow">▶</em>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      // SUBMENÚ: Deslizado y sobrepuesto en el panel izquierdo (la vitrina derecha se mantiene intacta)
      const groupName = S.sub === 'jugar' ? 'Modos de Juego' : (S.sub === 'aprender' ? 'Aula y Práctica' : (S.sub === 'restaurante' ? 'Mi Restaurante' : 'Ajustes'));
      const items = DATA[S.sub] || [];

      html += `
        <div class="hub-side-header">
          <button class="hub-back-btn" onclick="Inicio.back()">
            <span>←</span> Volver al Menú Principal
          </button>
          <div class="hub-sub-title">${groupName}</div>
        </div>
        <div class="hub-list-wrap">
          ${items.map(it => {
            const isLocked = it.reqTut && !tutDone();
            return `
              <div class="hub-item ${S.item === it.id ? 'sel' : ''} ${isLocked ? 'locked' : ''}" data-id="${it.id}" onclick="Inicio.onItemClick('${it.id}', this)">
                <span class="hub-item-icon">${it.icon}</span>
                <span class="hub-item-text">
                  <b>${it.title}</b>
                  <small>${isLocked ? '🔒 Bloqueado hasta lección' : it.sub}</small>
                </span>
                <span class="hub-item-badge">${isLocked ? 'BLOQUEADO' : 'JUGAR'}</span>
                <em class="hub-item-arrow">▶</em>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    S.side.innerHTML = html;
    bindListScroll();
  }

  function renderShowcase() {
    if (!S) return;
    const it = getItemData(S.item);
    if (!it) return;

    // Transición suave de la ilustración viva
    S.artWrap.classList.add('fade-out');
    setTimeout(() => {
      if (!S) return;
      S.artWrap.innerHTML = getArtworkSvg(it.id);
      S.artWrap.classList.remove('fade-out');
    }, 120);

    // Render de la tarjeta meta (reseña y botón CTA)
    const isLocked = it.reqTut && !tutDone();
    S.metaWrap.innerHTML = `
      <div class="hub-meta-tag">${it.tag || 'SHIMAYA MASTER'}</div>
      <h2 class="hub-meta-title">${it.icon} ${it.heroTitle || it.title}</h2>
      <p class="hub-meta-desc">${it.desc || it.sub}</p>
      <div class="hub-meta-pills">
        ${(it.pills || []).map(pill => `<span class="hub-pill">${pill}</span>`).join('')}
      </div>
      <div>
        <button class="hub-cta-btn ${isLocked ? 'locked' : ''}" onclick="Inicio.trigger()">
          ${isLocked ? '🔒 LECCIÓN DE RAMEN REQUERIDA' : (it.ctaText || '▶ JUGAR AHORA')}
        </button>
      </div>
    `;
  }

  function render() {
    renderSidebar();
    renderShowcase();
  }

  // ---------- salas (Aula, Secretos): velocidad y retorno limpio ----------
  function enterRoom(name) {
    const R = ROOMS[name]; if (!S || !R || S.busy) return;
    S.busy = true; sfx('serve');
    const ms = reduced() ? 30 : 350;
    S.wrap.classList.add('zoomout');
    setTimeout(() => {
      S.curRoom = name;
      S.room.style.display = 'block'; S.room.className = 'ini-room arrive'; S.room.innerHTML = '';
      try { R.mount(S.room, roomApi()); } catch (e) { console.warn('sala', name, e); }
    }, ms);
    setTimeout(() => { S.room.classList.remove('arrive'); S.busy = false; }, ms + (reduced() ? 30 : 300));
  }

  function leaveRoom() {
    if (!S || !S.curRoom || S.busy) return;
    const R = ROOMS[S.curRoom]; S.busy = true; sfx('click');
    try { R && R.unmount && R.unmount(); } catch (e) {}
    S.room.classList.add('leaving');
    const ms = reduced() ? 30 : 320;
    setTimeout(() => {
      S.room.style.display = 'none'; S.room.className = 'ini-room'; S.room.innerHTML = '';
      S.curRoom = null; S.wrap.classList.remove('zoomout');
      S.busy = false;
      render();
    }, ms);
  }

  // ---------- API pública Inicio ----------
  const Inicio = window.Inicio = {
    act(k, arg) {
      sfx('click');
      const f = ACT[k];
      if (!f) return;
      try { f(arg); } catch (e) { console.warn('Inicio.act', k, e); }
    },
    pick(id) { selectOption(id); },
    onItemClick(id, el) { handleItemClick(id, el); },
    back() { goBack(); },
    trigger() { triggerActiveItem(); },
    gear() {
      if (!S) return;
      sfx('click');
      S.sub = 'gear';
      S.item = 'sound';
      renderSidebar();
      renderShowcase();
    },
    enterRoom,
    leaveRoom,
    registerRoom(name, room) { ROOMS[name] = room; },
    refresh() {
      if (S) {
        S.sub = null;
        S.item = 'jugar';
        render();
      }
    },
    setView(v) {
      if (v !== 'hub' && v !== 'classic') v = 'hub';
      store.set(VKEY, v);
      const sc = $('start-screen'); if (!sc) return;
      sc.classList.toggle('ini-on', v !== 'classic');
      if (v !== 'classic') {
        if (!S) create();
        else Inicio.refresh();
      }
      try { updateStartModesDisplay(); } catch (e) {}
    },
    view() { return S ? 'hub' : 'classic'; },
    _S: () => S
  };

  // Teclas rápidas de teclado para navegación en PC
  window.addEventListener('keydown', e => {
    if (!S || S.curRoom) return;
    const sc = $('start-screen');
    if (!sc || !sc.classList.contains('ini-on')) return;
    const list = S.side ? S.side.querySelector('.hub-list-wrap') : null;
    if (!list) return;

    const items = Array.from(list.querySelectorAll('.hub-item'));
    const curIdx = items.findIndex(el => el.classList.contains('sel'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = Math.min(items.length - 1, (curIdx >= 0 ? curIdx : 0) + 1);
      list.scrollTo({ top: nextIdx * SLOT_H, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = Math.max(0, (curIdx >= 0 ? curIdx : 0) - 1);
      list.scrollTo({ top: prevIdx * SLOT_H, behavior: 'smooth' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      triggerActiveItem();
    } else if (e.key === 'Escape' && S.sub) {
      e.preventDefault();
      goBack();
    }
  });

  // ---------- Inicialización ----------
  function init() {
    const sc = $('start-screen'); if (!sc) return;
    const v = store.get(VKEY) || 'hub';
    css();

    const back = document.createElement('button');
    back.className = 'ini-back';
    back.textContent = '🏠 Volver al inicio nuevo';
    back.onclick = () => Inicio.setView('hub');
    sc.appendChild(back);

    if (v !== 'classic') Inicio.setView('hub');

    const _r = window.returnToStartMenu;
    if (typeof _r === 'function') {
      window.returnToStartMenu = function () {
        const r = _r.apply(this, arguments);
        try { Inicio.refresh(); } catch (e) {}
        return r;
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
