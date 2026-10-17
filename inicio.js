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
  // ---------- avisos en las opciones del menú (NUEVO · ¡MEJORA! · ¡EMPIEZA!) ----------
  // Se calculan con el estado real del juego. Los de «novedad» se quitan al abrir esa opción (se guardan como vistos).
  const SEEN_KEY = 'ramen_ini_seen';
  const NUEVO_V = { sound: 'v172', pantry: 'v176' };                  // funciones nuevas: «NUEVO» hasta que se abren una vez
  const unlockedLevel = () => { try { return getCampaignStatsSummary().unlockedLevel || 1; } catch (e) { return 1; } };
  const seenMap = () => { try { return JSON.parse(store.get(SEEN_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const alertToken = id => id === 'camp' ? 'L' + unlockedLevel() : (NUEVO_V[id] || null);
  const markSeen = id => { const t = alertToken(id); if (t == null) return; const m = seenMap(); if (m[id] === t) return; m[id] = t; store.set(SEEN_KEY, JSON.stringify(m)); };
  const cheapestUpgrade = () => { try { let c = null; UPGRADES.forEach(u => { const lv = getUpgradeLevel(u.id); if (lv < u.costs.length && (c == null || u.costs[lv] < c)) c = u.costs[lv]; }); return c; } catch (e) { return null; } };
  const ALERT_RANK = { buy: 3, go: 2, new: 1 };
  function itemAlert(id) {
    try {
      if (id === 'camp') { const L = unlockedLevel(); return tutDone() && L > 1 && seenMap().camp !== 'L' + L ? { t: 'NIVEL ' + L, k: 'new' } : null; }
      if (NUEVO_V[id]) return seenMap()[id] === NUEVO_V[id] ? null : { t: 'NUEVO', k: 'new' };
      if (id === 'knives') { const c = cheapestUpgrade(); return c != null && wallet() >= c ? { t: '¡MEJORA!', k: 'buy' } : null; }
      if (id === 'aula') return tutDone() ? null : { t: '¡EMPIEZA!', k: 'go' };
      if (id === 'book' && window.Recetario) { const n = Recetario.summary().fresh; return n > 0 && tutDone() ? { t: n + ' POR PROBAR', k: 'new' } : null; }
      if (DATA[id]) { let best = null; DATA[id].forEach(c => { const a = itemAlert(c.id); if (a && (!best || ALERT_RANK[a.k] > ALERT_RANK[best.k])) best = a; }); return best; }   // pilar: el aviso más importante de sus opciones
    } catch (e) {}
    return null;
  }
  const flagHtml = id => { const a = itemAlert(id); return a ? `<i class="hub-flag ${a.k}">${a.t}</i>` : ''; };
  const chefName = () => {
    try {
      if (window.DeviceManager && DeviceManager.currentPlayer) {
        const n = DeviceManager.currentPlayer.playerName || DeviceManager.currentPlayer.name;
        if (n) return String(n).replace(/^Chef\s+/i, '');
      }
      const el = $('start-pill-name');
      if (el && el.textContent) return el.textContent.replace(/^Chef\s+/i, '').trim();
    } catch (e) {}
    return 'Invitado';
  };
  const chefAvatar = () => {
    try {
      if (window.DeviceManager && DeviceManager.currentPlayer && DeviceManager.currentPlayer.avatar) {
        return DeviceManager.currentPlayer.avatar;
      }
      const av = $('start-pill-avatar');
      if (av && av.textContent) return av.textContent.trim();
    } catch (e) {}
    return '👤';
  };
  function getStatBadge(id) {
    switch (id) {
      case 'jugar':
      case 'camp': {
        if (!tutDone()) return '🔒 Completa lección';
        if (typeof getCampaignStatsSummary === 'function') {
          const s = getCampaignStatsSummary();
          return `⭐ ${s.stars}/${s.maxStars} · Nivel ${s.unlockedLevel}/20`;
        }
        return '⭐ 20 Niveles';
      }
      case 'rash':
        return `⚡ Récord: Ronda ${rashLvl()}`;
      case 'door':
        return '🗾 9 Ciudades 24/7';
      case 'room':
        return '⚔️ Matchmaking Realtime';
      case 'aprender':
      case 'aula':
        return `🎓 Lecciones ${(window.Guia && Guia.doneCount ? Guia.doneCount() : (tutDone() ? 4 : 0))}/4`;
      case 'tickets':
        return `🎫 ${retosHechos()}/${window.TRAINING_CHALLENGES ? window.TRAINING_CHALLENGES.length : 50} Completados`;
      case 'free':
        return '🌿 Sin reloj · Zen';
      case 'pantry':
        return '🍱 35 Recetas';
      case 'restaurante':
      case 'knives':
        return `🧧 ${wallet()} Propinas`;
      case 'book':
        return '📖 35 Platos Reales';
      case 'board':
        return '🏆 Ranking Mundial';
      case 'acct':
        return '☁️ Progreso en Nube';
      case 'gear':
      case 'sound':
      case 'full':
      case 'update':
      case 'keys':
      case 'classic':
        return '⚙️ Sistema v142';
      default:
        return '⭐ Shimaya Master';
    }
  }

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
        desc: 'Servicio en vivo: 20 niveles de Campaña en 5 arcos, Supervivencia Rash extrema, Recorrido por Japón y Multijugador en línea.',
        pills: ['🏮 20 Niveles', '🔥 4 Cocinas', '⏱️ Contrarreloj', '🌐 Online'],
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
        desc: 'Academia tradicional: 4 disciplinas guiadas por el Maestro, 50 retos de técnica y práctica libre zen sin reloj.',
        pills: ['🎓 4 Lecciones', '🥋 50 Retos', '🌿 Práctica Zen'],
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
        sub: '20 niveles en 5 arcos culinarios',
        tag: 'MODO HISTORIA',
        heroTitle: 'Campaña Gastronómica',
        desc: 'Atiende comandas a contrarreloj a lo largo de 20 niveles y 5 arcos temáticos. Desbloquea áreas progresivamente, gana hasta 3 estrellas por servicio impecable y repite niveles para mejorar tu récord.',
        pills: ['🏮 20 Niveles', '⭐ 1 a 3 Estrellas', '🔁 Niveles Repetibles', '🔓 4 Áreas Progresivas'],
        ctaText: '🏮 MAPA DE CAMPAÑA',
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
        sub: '50 desafíos con medallas',
        tag: 'DESAFÍOS TÉCNICOS',
        heroTitle: '50 Retos del Chef',
        desc: 'Comprueba tu velocidad y técnica bajo presión: comandas a ciegas y cortes express con medallas y propinas.',
        pills: [`🎫 ${retosHechos()}/${window.TRAINING_CHALLENGES ? window.TRAINING_CHALLENGES.length : 50} Listos`, '🥇 Medallas', '🧧 Propinas'],
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
        sub: 'Volumen, ambiente y música',
        tag: 'AJUSTES DE AUDIO',
        heroTitle: 'Audio y Efectos Sonoros',
        desc: 'Ajusta por separado los efectos, el ambiente de la cocina (hervor, fuego, aceite, clientes) y la música, que cambian con la paciencia de los clientes y la dificultad.',
        pills: ['🥢 Efectos', '🍲 Ambiente', '🎵 Música'],
        ctaText: '🔊 AJUSTAR SONIDO',
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
    // Escenas vivas con arte final (escena-cocina.js); el resto sigue con los SVG de abajo
    if (window.EscenaCocina && EscenaCocina.has(key)) return EscenaCocina.html(key);
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
              <text x="0" y="0" font-size="15" font-weight="800" fill="#5d4037" text-anchor="middle">50 RETOS DE TÉCNICA</text>
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

  // ---------- fondo animado continuo: cocina y cocineros corriendo ----------
  function getKitchenRunnersSvg() {
    return `
      <svg class="hub-kitchen-svg" viewBox="0 0 620 130" preserveAspectRatio="none">
        <defs>
          <linearGradient id="kFloor" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#ffb300" stop-opacity="0.05"/>
            <stop offset="25%" stop-color="#ffb300" stop-opacity="0.35"/>
            <stop offset="75%" stop-color="#ff9800" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#ffb300" stop-opacity="0.05"/>
          </linearGradient>
        </defs>

        <!-- Silueta de la cocina de fondo: estantes, campana, utensilios -->
        <g stroke="#ffca28" stroke-width="1.2" stroke-linecap="round" opacity="0.35" fill="none">
          <!-- Línea del suelo / mesada -->
          <line x1="0" y1="114" x2="620" y2="114" stroke="url(#kFloor)" stroke-width="2.5"/>

          <!-- Estante superior izquierdo con cuencos de ramen apilados -->
          <line x1="30" y1="20" x2="170" y2="20"/>
          <ellipse cx="50" cy="16" rx="8" ry="4"/>
          <ellipse cx="70" cy="16" rx="8" ry="4"/>
          <ellipse cx="90" cy="16" rx="8" ry="4"/>
          <ellipse cx="130" cy="14" rx="10" ry="6"/>
          <path d="M125,8 Q130,5 135,8" stroke-width="1"/>

          <!-- Colgador central con utensilios tradicionales -->
          <line x1="260" y1="14" x2="410" y2="14"/>
          <path d="M280,14 L280,32 M276,32 A4,4 0 0,0 284,32"/> <!-- Cazo para caldo -->
          <path d="M315,14 L315,30 M312,30 L318,30 L315,38 Z"/> <!-- Espátula wok -->
          <path d="M350,14 L350,34 M346,34 L354,34"/> <!-- Cuchillo santoku -->
          <path d="M385,14 L385,30 M381,30 A4,4 0 0,0 389,30"/> <!-- Colador de fideos -->

          <!-- Campana extractora silueta sutil -->
          <path d="M470,0 L490,26 L580,26 L600,0" stroke-dasharray="3,3"/>
          <line x1="505" y1="26" x2="565" y2="26"/>
        </g>

        <!-- COCINERO 1: Chef corriendo de izquierda a derecha con tazón de ramen humeante -->
        <g class="chef-runner-1">
          <g class="chef-trot-1" transform="translate(0, 70)">
            <ellipse cx="-10" cy="38" rx="6" ry="3" fill="#ffe082" opacity="0.35"/>
            <ellipse cx="-20" cy="36" rx="4" ry="2" fill="#ffe082" opacity="0.2"/>
            <path d="M4,36 L0,44 L-6,44 M8,36 L15,42 L22,42" stroke="#ffca28" stroke-width="2.8" stroke-linecap="round" fill="none"/>
            <path d="M2,18 Q14,16 16,32 L2,34 Z" fill="#ffca28"/>
            <rect x="0" y="20" width="14" height="13" rx="2" fill="#fff9c4"/>
            <circle cx="8" cy="12" r="7.5" fill="#ffe082"/>
            <path d="M2,11 L14,11 M1,11 L-8,8 M1,11 L-7,14" stroke="#d32f2f" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <path d="M4,7 C2,1 6,-3 10,-3 C14,-3 16,1 14,7 Z" fill="#ffffff" stroke="#ffca28" stroke-width="1"/>
            <path d="M8,22 L18,22" stroke="#ffca28" stroke-width="2.5" stroke-linecap="round"/>
            <ellipse cx="23" cy="22" rx="7.5" ry="4.5" fill="#d32f2f" stroke="#ffca28" stroke-width="1.2"/>
            <path d="M20,20 Q23,17 26,20" stroke="#fff176" stroke-width="1.5" fill="none"/>
            <path d="M22,17 Q21,13 23,9" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.75"/>
          </g>
        </g>

        <!-- COCINERO 2: Chef corriendo de derecha a izquierda con sartén Wok ardiente -->
        <g class="chef-runner-2">
          <g class="chef-trot-2" transform="translate(0, 70) scale(-1, 1)">
            <ellipse cx="-8" cy="38" rx="5" ry="2.5" fill="#ffb300" opacity="0.3"/>
            <path d="M4,36 L-2,43 L-8,43 M8,36 L13,40 L18,44" stroke="#ffb300" stroke-width="2.8" stroke-linecap="round" fill="none"/>
            <path d="M2,18 Q14,16 16,32 L2,34 Z" fill="#ffb300"/>
            <rect x="0" y="20" width="14" height="13" rx="2" fill="#fff8e1"/>
            <circle cx="8" cy="12" r="7.5" fill="#ffe082"/>
            <path d="M2,11 L14,11 M1,11 L-7,9 M1,11 L-6,13" stroke="#1976d2" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <path d="M3,7 C1,0 6,-4 10,-4 C15,-4 16,0 15,7 Z" fill="#ffffff" stroke="#ffb300" stroke-width="1"/>
            <path d="M6,22 L17,24" stroke="#ffb300" stroke-width="2.5" stroke-linecap="round"/>
            <ellipse cx="23" cy="24" rx="8.5" ry="4" fill="#37474f"/>
            <path d="M29,24 L36,22" stroke="#5d4037" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M21,22 Q23,14 25,22" stroke="#ff5722" stroke-width="2" fill="none"/>
          </g>
        </g>

        <!-- COCINERO 3: Aprendiz veloz con pila de vaporeras de bambú -->
        <g class="chef-runner-3">
          <g class="chef-trot-3" transform="translate(0, 73) scale(0.92)">
            <ellipse cx="-10" cy="37" rx="6" ry="3" fill="#ffe082" opacity="0.4"/>
            <path d="M4,36 L-4,44 M8,36 L17,44" stroke="#ffd54f" stroke-width="2.6" stroke-linecap="round" fill="none"/>
            <path d="M2,18 Q13,16 15,32 L2,34 Z" fill="#ffd54f"/>
            <rect x="1" y="20" width="12" height="12" rx="2" fill="#ffffff"/>
            <circle cx="8" cy="12" r="7" fill="#ffe082"/>
            <path d="M2,11 L13,11 M1,11 L-7,8" stroke="#f57c00" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path d="M4,7 C3,1 6,-2 9,-2 C13,-2 15,1 13,7 Z" fill="#ffffff" stroke="#ffd54f" stroke-width="1"/>
            <path d="M4,20 L8,14 L18,14" stroke="#ffd54f" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <rect x="14" y="6" width="15" height="6.5" rx="2" fill="#d7ccc8" stroke="#8d6e63" stroke-width="1"/>
            <rect x="15" y="-1" width="13" height="6.5" rx="2" fill="#d7ccc8" stroke="#8d6e63" stroke-width="1"/>
            <rect x="16" y="-8" width="11" height="6.5" rx="2" fill="#d7ccc8" stroke="#8d6e63" stroke-width="1"/>
          </g>
        </g>

        <!-- COCINERO 4: Chef apresurado con tetera de dashi / cazo -->
        <g class="chef-runner-4">
          <g class="chef-trot-4" transform="translate(0, 71) scale(-0.95, 0.95)">
            <path d="M4,36 L-3,44 M8,36 L16,43" stroke="#ffb74d" stroke-width="2.6" stroke-linecap="round" fill="none"/>
            <path d="M2,18 Q14,16 16,32 L2,34 Z" fill="#ffb74d"/>
            <rect x="0" y="20" width="14" height="12" rx="2" fill="#fffde7"/>
            <circle cx="8" cy="12" r="7.5" fill="#ffe082"/>
            <path d="M2,11 L14,11 M1,11 L-8,9" stroke="#388e3c" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path d="M3,7 C1,0 6,-3 10,-3 C15,-3 16,0 15,7 Z" fill="#ffffff" stroke="#ffb74d" stroke-width="1"/>
            <path d="M6,22 L16,22" stroke="#ffb74d" stroke-width="2.2" stroke-linecap="round"/>
            <ellipse cx="22" cy="22" rx="7" ry="5" fill="#4e342e" stroke="#8d6e63" stroke-width="1"/>
            <path d="M19,16 L25,16" stroke="#d7ccc8" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M27,20 L31,18" stroke="#4e342e" stroke-width="1.8" stroke-linecap="round"/>
          </g>
        </g>
      </svg>
    `;
  }

  // ---------- estilos css del nuevo hub ----------
  const CSS = `
  #start-screen.ini-on .start-screen-content, #start-screen.ini-on .start-ambient-bg, #start-screen.ini-on .start-lantern, #start-screen.ini-on .start-steam-particles { display: none !important; }
  #start-screen.ini-on .start-footer-bar { display: none !important; }
  #start-screen.ini-on .start-screen-top-bar { display: none !important; }
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
    padding: 8px 10px 10px; box-sizing: border-box; z-index: 10; position: relative;
  }

  /* Cabecera del sidebar integrada */
  .hub-side-header { flex: none; margin-bottom: 4px; }
  .hub-brand-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding-bottom: 5px; border-bottom: 1.5px solid rgba(138,90,43,0.3); }
  .hub-brand-logo { font: 900 13.5px/1 'Fredoka', sans-serif; color: #ffe082; display: flex; align-items: center; gap: 4px; letter-spacing: 0.5px; }
  .hub-brand-logo span { color: #ffab91; font-size: 10px; font-weight: 700; }

  .hub-header-actions { display: flex; align-items: center; gap: 4px; }
  .hub-hdr-btn {
    width: 26px; height: 26px; border-radius: 8px; border: 1.5px solid rgba(138,90,43,0.5);
    background: rgba(30, 14, 8, 0.85); color: #ffd54f; font-size: 12px; display: inline-flex;
    align-items: center; justify-content: center; cursor: pointer; padding: 0;
    transition: transform 0.12s, border-color 0.12s;
  }
  .hub-hdr-btn:active { transform: scale(0.92); }
  .hub-hdr-chip {
    height: 26px; border-radius: 13px; border: 1.5px solid #ffb300; background: rgba(26, 12, 6, 0.9);
    color: #ffd54f; font: 900 10.5px sans-serif; display: inline-flex; align-items: center; gap: 4px;
    padding: 0 7px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    transition: transform 0.12s;
  }
  .hub-hdr-chip:active { transform: scale(0.95); }
  .hub-hdr-chip.profile { border-color: rgba(255, 179, 0, 0.45); color: #fff8e7; }
  .hub-prof-name { max-width: 60px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 10px; font-weight: 800; }

  /* Submenú header con fila compacta */
  .hub-submenu-top-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 3px; }
  .hub-back-btn {
    flex: 1; border: 2px solid #8a5a00; border-radius: 10px; background: linear-gradient(#ffe082, #ffb300);
    color: #3b2208; font: 900 12px/1 'Fredoka', sans-serif; padding: 6px 10px; display: flex; align-items: center; gap: 6px;
    cursor: pointer; box-shadow: 0 2px 0 #8a5a00; transition: transform 0.12s, box-shadow 0.12s;
  }
  .hub-back-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #8a5a00; }
  .hub-sub-title { font: 900 10px 'Fredoka', sans-serif; text-transform: uppercase; letter-spacing: 0.8px; color: #ffcc80; padding: 0 2px; }

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
    animation: hubListFadeIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
  }
  @keyframes hubListFadeIn {
    from { opacity: 0; transform: translateX(8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* Opciones del menú: amplias, con altura de 68px y padding ergonómico */
  .hub-item {
    position: relative; height: 68px; flex: none; box-sizing: border-box;
    scroll-snap-align: start;
    border-radius: 14px;
    padding: 10px 14px;
    display: flex; align-items: center; gap: 10px;
    cursor: pointer; text-align: left;
    font-family: inherit;
    /* Estado desenfocado por defecto (Posiciones 1, 3 o 4) */
    opacity: 0.35;
    transform: scale(0.95);
    background: rgba(30, 13, 7, 0.72);
    border: 1.5px solid rgba(138, 90, 43, 0.3);
    color: #bfa787;
    box-shadow: none;
    transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), background 0.22s, border-color 0.22s, box-shadow 0.22s;
  }
  .hub-item:hover:not(.sel) { opacity: 0.65; transform: scale(0.98); }

  /* SOLO UNA OPCIÓN SE RESALTA: La que está en Posición 2 */
  .hub-item.sel {
    opacity: 1;
    transform: scale(1.025) translateX(4px);
    background: linear-gradient(135deg, #fff4cc 0%, #ffd666 45%, #ffb300 100%);
    border: 2.5px solid #ff9100;
    color: #261203;
    box-shadow: 0 4px 20px rgba(255, 145, 0, 0.45), 0 0 14px rgba(255, 215, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  .hub-item-icon { font-size: 26px; width: 32px; text-align: center; flex: none; line-height: 1; }
  .hub-item-text { flex: 1; min-width: 0; }
  .hub-item-text b { display: block; font: 900 15px/1.2 'Fredoka', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hub-item-text small { display: block; font: 700 11px/1.25 sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.9; }

  .hub-item:not(.sel) .hub-item-text b { color: #e0ccb4; }
  .hub-item:not(.sel) .hub-item-text small { color: #9c8065; }
  .hub-item.sel .hub-item-text b { color: #261203; }
  .hub-item.sel .hub-item-text small { color: #6b3e05; font-weight: 800; }

  /* Badge indicador y flecha de acción */
  .hub-item-badge {
    display: none; font: 900 9px 'Fredoka', sans-serif; padding: 2px 6px; border-radius: 6px;
    background: rgba(44, 22, 5, 0.15); border: 1px solid rgba(44, 22, 5, 0.3); color: #261203;
  }
  .hub-item.sel .hub-item-badge { display: inline-block; }
  .hub-item-arrow { font-style: normal; font-weight: 900; color: #b71c1c; font-size: 15px; opacity: 0; transition: opacity 0.18s; }
  .hub-item.sel .hub-item-arrow { opacity: 1; }
  .hub-item.locked { opacity: 0.35; filter: grayscale(0.6); }

  /* ESCENARIO / VITRINA DE LA ILUSTRACIÓN DERECHA */
  .hub-stage {
    flex: 1; height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column;
    justify-content: space-between; align-items: stretch; padding: 6px 16px 10px; box-sizing: border-box;
    gap: 6px;
  }

  /* Ilustración animada viva en su ESPACIO FIJO SUPERIOR (100% despejada, nunca tapada) */
  .hub-art-wrap {
    flex: 1 1 auto; width: 100%; min-height: 0; position: relative; display: flex;
    align-items: center; justify-content: center; overflow: visible;
    pointer-events: none; z-index: 1; transition: opacity 0.16s ease;
  }
  .hub-art-wrap.fade-out { opacity: 0; }
  .hub-art-scene { display: contents; }
  .hub-art-wrap .h-svg {
    width: auto; height: 100%; max-height: 100%; max-width: 100%; object-fit: contain;
    display: block; filter: drop-shadow(0 4px 16px rgba(0,0,0,0.45));
  }

  /* Tarjeta de Reseña y Acción sobrepuesta - compacta, translúcida y con cocineros animados en el fondo */
  .hub-meta-card {
    position: relative; flex: 0 0 auto; width: 100%; max-width: min(600px, 100%); margin: 0 auto;
    z-index: 3; background: rgba(18, 8, 4, 0.6); /* translúcido, sin desenfoque: el backdrop-filter sobre un video en movimiento hacía saltar el menú en el celular */
    border: 1.5px solid rgba(255, 204, 80, 0.32); border-radius: 15px; padding: 7px 15px 9px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.45), 0 0 14px rgba(255, 179, 0, 0.08);
    overflow: hidden; box-sizing: border-box;
    animation: hubCardIn 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
  }
  @keyframes hubCardIn { from { opacity: 0; transform: translateY(8px); } }

  /* Capa de fondo animado de cocineros corriendo en la cocina */
  .hub-card-kitchen-bg {
    position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
    opacity: 0.22;
  }
  .hub-kitchen-svg { width: 100%; height: 100%; display: block; }

  /* Pistas de carrera de los cocineros */
  .chef-runner-1 { animation: runAcross1 7.4s linear infinite; }
  .chef-runner-2 { animation: runAcross2 9.4s linear infinite; animation-delay: 2.5s; }
  .chef-runner-3 { animation: runAcross3 5.8s linear infinite; animation-delay: 4.8s; }
  .chef-runner-4 { animation: runAcross4 8.6s linear infinite; animation-delay: 6.8s; }

  @keyframes runAcross1 { from { transform: translateX(-100px); } to { transform: translateX(680px); } }
  @keyframes runAcross2 { from { transform: translateX(680px); } to { transform: translateX(-100px); } }
  @keyframes runAcross3 { from { transform: translateX(-100px); } to { transform: translateX(680px); } }
  @keyframes runAcross4 { from { transform: translateX(680px); } to { transform: translateX(-100px); } }

  /* Trote y rebote de los cocineros */
  .chef-trot-1 { animation: chefBob1 0.26s ease-in-out infinite alternate; transform-origin: 50% 100%; }
  .chef-trot-2 { animation: chefBob2 0.30s ease-in-out infinite alternate; transform-origin: 50% 100%; }
  .chef-trot-3 { animation: chefBob3 0.22s ease-in-out infinite alternate; transform-origin: 50% 100%; }
  .chef-trot-4 { animation: chefBob4 0.28s ease-in-out infinite alternate; transform-origin: 50% 100%; }

  @keyframes chefBob1 { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(-3.5px) rotate(2deg); } }
  @keyframes chefBob2 { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(-4px) rotate(-3deg); } }
  @keyframes chefBob3 { 0% { transform: translateY(0) scaleY(0.96); } 100% { transform: translateY(-4.5px) scaleY(1.04); } }
  @keyframes chefBob4 { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(-3px) rotate(-2deg); } }

  /* Contenido frontal del cuadro de diálogo */
  .hub-meta-content { position: relative; z-index: 2; }

  .hub-meta-header-row {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 2px;
  }
  .hub-meta-tag {
    display: inline-block; background: rgba(255, 179, 0, 0.15); border: 1px solid rgba(255, 179, 0, 0.6);
    border-radius: 6px; padding: 1px 6px; font: 900 9px 'Fredoka', sans-serif; color: #ffd54f;
    letter-spacing: 0.6px; text-transform: uppercase;
  }
  .hub-meta-stat-pill {
    background: rgba(0, 229, 255, 0.12); border: 1px solid rgba(0, 229, 255, 0.35); border-radius: 6px;
    padding: 1px 7px; font: 900 10px sans-serif; color: #80deea; display: inline-flex; align-items: center; gap: 4px;
  }

  .hub-meta-title { margin: 0 0 2px; font: 900 17px/1.15 'Fredoka', sans-serif; color: #fff8e7; text-shadow: 0 2px 4px rgba(0,0,0,0.9); }
  .hub-meta-desc { margin: 0 0 7px; font: 600 10.5px/1.32 sans-serif; color: #f5dfba; text-shadow: 0 1px 3px rgba(0,0,0,0.9); }

  /* Fila de acción bimanual: pills a la izquierda y CTA accesible para el pulgar derecho */
  .hub-meta-action-row {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
  }
  .hub-cta-group { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .hub-cta-btn.ghost { background: rgba(255,255,255,0.1); border-color: rgba(255,224,130,0.55); color: #ffe082; box-shadow: 0 3px 0 rgba(0,0,0,0.35); padding-left: 12px; padding-right: 12px; }
  /* avisos sobre las opciones de la lista: esquina superior derecha, con latido suave */
  .hub-flag { position: absolute; top: -7px; right: 10px; z-index: 2; font: normal 900 9.5px/1 'Fredoka', sans-serif; letter-spacing: 0.3px; color: #fff; padding: 3px 7px; border-radius: 9px; border: 1.5px solid #fff3d0; pointer-events: none;
    background: #e53935; box-shadow: 0 2px 0 #7f0000; animation: hubFlagPulse 1.3s ease-in-out infinite; }
  .hub-flag.buy { background: #2e9e4f; box-shadow: 0 2px 0 #14532d; } .hub-flag.go { background: #ff8f00; box-shadow: 0 2px 0 #8a4b00; }
  @keyframes hubFlagPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
  @media (prefers-reduced-motion: reduce) { .hub-flag { animation: none; } }
  .hub-back-btn.compact { flex: none; width: 38px; height: 32px; padding: 0; justify-content: center; font-size: 15px; border-radius: 9px; }
  .hub-submenu-top-row .hub-sub-title { flex: 1; min-width: 0; font: 900 14px 'Fredoka', sans-serif; letter-spacing: 0.6px; color: #ffd978; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 0 rgba(0,0,0,0.5); }
  .hub-meta-pills { display: flex; flex-wrap: wrap; gap: 4px; flex: 1; min-width: 0; }
  .hub-pill { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.16); border-radius: 6px; padding: 1.5px 6px; font: 800 9.5px sans-serif; color: #ffe082; }

  /* Botón CTA accesible para el pulgar derecho */
  .hub-cta-btn {
    border: 2px solid #ffe082; border-radius: 12px; padding: 7px 18px;
    background: linear-gradient(135deg, #ff9800, #e64a19 65%, #c62828);
    color: #ffffff; font: 900 13px/1 'Fredoka', sans-serif; cursor: pointer;
    box-shadow: 0 3px 0 #7f0000, 0 0 14px rgba(255, 152, 0, 0.45);
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5); transition: transform 0.12s, box-shadow 0.12s;
    flex-shrink: 0;
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
  #start-screen.ini-on .ini-room { padding-top: 0; }
  .ini-room.arrive { animation: iniArrive 0.36s cubic-bezier(.1,.7,.2,1); }
  .ini-room.leaving { animation: iniLeave 0.32s cubic-bezier(.6,0,1,.5) forwards; }
  @keyframes iniArrive { from { transform: scale(1.15); opacity: 0.2; } to { transform: none; opacity: 1; } }
  @keyframes iniLeave { to { transform: scale(0.85); opacity: 0; } }

  /* Botón de volver al modo nuevo si está en clásico */
  .ini-back { position: absolute; left: 10px; bottom: 36px; z-index: 120; border: 2px solid #ffe082; border-radius: 14px; background: rgba(60,25,12,0.92); color: #ffe9b0; font: 800 12px 'Fredoka', sans-serif; padding: 4px 12px; cursor: pointer; }

  /* Responsive para pantallas estrechas o bajas (móvil horizontal: 873x393 px) */
  @media (max-width: 680px) {
    .hub-sidebar { width: 240px; padding: 8px 10px; }
    .hub-item { height: 60px; padding: 8px 10px; }
    .hub-item-icon { font-size: 22px; width: 26px; }
    .hub-item-text b { font-size: 13.5px; }
    .hub-item-text small { font-size: 10px; }
    .hub-list-wrap { padding-top: 68px; scroll-padding-top: 68px; }
    .hub-stage { padding: 6px 10px 8px; }
    .hub-meta-card { padding: 6px 12px 8px; max-width: 100%; }
    .hub-meta-title { font-size: 15px; }
    .hub-meta-desc { font-size: 10px; margin-bottom: 4px; }
    .hub-cta-btn { padding: 6px 14px; font-size: 12px; }
  }

  @media (max-height: 420px) {
    .hub-stage { padding: 4px 12px 8px; gap: 4px; }
    .hub-meta-card { padding: 5px 12px 7px; border-radius: 13px; }
    .hub-meta-title { font-size: 15px; margin-bottom: 1px; }
    .hub-meta-desc { font-size: 10px; margin-bottom: 4px; line-height: 1.25; }
    .hub-meta-action-row { gap: 6px; }
    .hub-pill { font-size: 9px; padding: 1px 5px; }
    .hub-cta-btn { padding: 5px 14px; font-size: 12px; }
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
    camp: () => {
      if (typeof openCampaignModal === 'function') {
        openCampaignModal();
      } else {
        setStartSelectedMode('NORMAL');
        if (startSelectedMode === 'NORMAL') handleStartPlayClick();
      }
    },
    rash: () => { setStartSelectedMode('RASH'); if (startSelectedMode === 'RASH') handleStartPlayClick(); },
    book: () => (window.Recetario ? Recetario.open() : openRecipeModal()),
    board: () => openLeaderboardModal(),
    chest: () => openSecretosModal(),
    knives: () => openUpgradesModal(),
    pantry: () => reconOpen(),
    door: () => japonOpen(),
    room: () => MultiplayerManager.openLobbyModal(),
    acct: () => openAccountModal(),
    stats: () => openStatsModal(),
    order: () => openIngredientOrderModal(),
    sound: () => (window.Ambiente && Ambiente.panel ? Ambiente.panel() : toggleAudioMute()),
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

    // Contenedor de la ilustración viva (espacio superior fijo y despejado)
    const artWrap = document.createElement('div'); artWrap.className = 'hub-art-wrap';
    stage.appendChild(artWrap);

    // Contenedor de la tarjeta meta / reseña (segmento inferior de información)
    const metaWrap = document.createElement('div'); metaWrap.className = 'hub-meta-card';

    // Fondo animado continuo: cocina y cocineros corriendo
    const metaBg = document.createElement('div'); metaBg.className = 'hub-card-kitchen-bg';
    metaBg.innerHTML = getKitchenRunnersSvg();
    metaWrap.appendChild(metaBg);

    // Capa frontal para la información
    const metaContent = document.createElement('div'); metaContent.className = 'hub-meta-content';
    metaWrap.appendChild(metaContent);

    stage.appendChild(metaWrap);

    // Sala de transiciones (Aula, Secretos)
    const room = document.createElement('div'); room.className = 'ini-room';
    wrap.appendChild(room);

    sc.appendChild(wrap);

    S = {
      wrap, side, stage, artWrap, metaWrap, metaBg, metaContent, room,
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
        renderShowcase(true);
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
    markSeen(it.id);

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
      setTimeout(() => {
        if (!S) return;
        S.sub = 'aprender';
        S.item = 'aula';
        renderSidebar();
        renderShowcase();
      }, 350);
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
          <div class="hub-brand-row">
            <div class="hub-brand-logo">🏮 SHIMAYA <span>RAMEN</span></div>
            <div class="hub-header-actions">
              <button class="hub-hdr-btn" onclick="toggleAudioMute(); this.textContent = window.isSoundMuted ? '🔇' : '🔊';" title="Audio (M)">${window.isSoundMuted ? '🔇' : '🔊'}</button>
              <button class="hub-hdr-btn" onclick="toggleFullScreen()" title="Pantalla completa (F)">⛶</button>
              <button class="hub-hdr-chip wallet" onclick="openUpgradesModal()" title="Cartera de propinas">
                🧧 <b>${wallet()}</b>
              </button>
              <button class="hub-hdr-chip profile" onclick="openProfileModal()" title="Perfil de Chef">
                <span>${chefAvatar()}</span> <b class="hub-prof-name">${chefName()}</b>
              </button>
            </div>
          </div>
        </div>
        <div class="hub-list-wrap">
          ${DATA.pillars.map(p => `
            <div class="hub-item ${S.item === p.id ? 'sel' : ''}" data-id="${p.id}" onclick="Inicio.onItemClick('${p.id}', this)">
              ${flagHtml(p.id)}
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
          <div class="hub-submenu-top-row">
            <button class="hub-back-btn compact" onclick="Inicio.back()" title="Volver al menú principal" aria-label="Volver al menú principal">◀</button>
            <div class="hub-sub-title">${groupName}</div>
            <div class="hub-header-actions">
              <button class="hub-hdr-chip wallet" onclick="openUpgradesModal()" title="Cartera de propinas">
                🧧 <b>${wallet()}</b>
              </button>
            </div>
          </div>
        </div>
        <div class="hub-list-wrap">
          ${items.map(it => {
            const isLocked = it.reqTut && !tutDone();
            return `
              <div class="hub-item ${S.item === it.id ? 'sel' : ''} ${isLocked ? 'locked' : ''}" data-id="${it.id}" onclick="Inicio.onItemClick('${it.id}', this)">
                ${isLocked ? '' : flagHtml(it.id)}
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

  // Las escenas vivas (cocina) se crean UNA vez y se conservan ocultas: volver a «Jugar» ya no reconstruye la placa, ni reposiciona los videos
  // (mover un video lo pausa y volvía a verse la foto) ni vuelve a decodificar las imágenes. El resto de ilustraciones (SVG) son livianas y se reemplazan.
  function swapArt(id) {
    if (!S || !S.artWrap) return;
    let next;
    if (window.EscenaCocina && EscenaCocina.has(id)) {
      S.scenes = S.scenes || {};
      if (!S.scenes[id]) { const d = document.createElement('div'); d.className = 'hub-art-scene'; d.innerHTML = getArtworkSvg(id); S.scenes[id] = d; }
      next = S.scenes[id];
    } else {
      next = document.createElement('div'); next.className = 'hub-art-scene'; next.innerHTML = getArtworkSvg(id);
    }
    if (S.artCur === next) return;
    S.artWrap.classList.add('fade-out');
    clearTimeout(S.artFade);
    S.artFade = setTimeout(() => {
      if (!S) return;
      const prev = S.artCur;
      if (prev && prev !== next) { if (S.scenes && Object.values(S.scenes).includes(prev)) prev.style.display = 'none'; else prev.remove(); }
      if (next.parentNode !== S.artWrap) S.artWrap.appendChild(next);
      next.style.display = '';
      S.artCur = next;
      S.artWrap.classList.remove('fade-out');
    }, 110);
  }

  function renderShowcase(fromScroll) {
    if (!S) return;
    const it = getItemData(S.item);
    if (!it) return;

    // Ilustración viva: al pasar la lista con el dedo solo se cambia cuando el scroll se asienta (una vez por gesto, no por cada opción que se cruza)
    clearTimeout(S.artT);
    if (fromScroll) S.artT = setTimeout(() => swapArt(it.id), 150); else swapArt(it.id);

    // Render de la tarjeta meta (en la capa frontal sobre el fondo de cocineros)
    const isLocked = it.reqTut && !tutDone();
    const cont = (it.id === 'jugar' || it.id === 'camp') && tutDone() && typeof playCampaignLevel === 'function';      // atajo al siguiente nivel de Campaña
    const target = S.metaContent || S.metaWrap;
    target.innerHTML = `
      <div class="hub-meta-header-row">
        <span class="hub-meta-tag">${it.tag || 'SHIMAYA MASTER'}</span>
        <span class="hub-meta-stat-pill">${getStatBadge(it.id)}</span>
      </div>
      <h2 class="hub-meta-title">${it.icon} ${it.heroTitle || it.title}</h2>
      <p class="hub-meta-desc">${it.desc || it.sub}</p>
      <div class="hub-meta-action-row">
        <div class="hub-meta-pills">
          ${(it.pills || []).map(pill => `<span class="hub-pill">${pill}</span>`).join('')}
        </div>
        ${cont ? `<div class="hub-cta-group"><button class="hub-cta-btn ghost" onclick="Inicio.trigger()">${it.id === 'jugar' ? 'MODOS' : 'MAPA'}</button><button class="hub-cta-btn" onclick="Inicio.play()">▶ CONTINUAR · NIVEL ${unlockedLevel()}</button></div>` : `<button class="hub-cta-btn ${isLocked ? 'locked' : ''}" onclick="Inicio.trigger()">
          ${isLocked ? '🔒 HACER LECCIÓN DE RAMEN' : (it.ctaText || '▶ JUGAR AHORA')}
        </button>`}
      </div>
    `;
  }

  function render() {
    renderSidebar();
    renderShowcase();
  }

  // ---------- salas (Aula, Secretos): velocidad y retorno limpio ----------
  /** Entra a una sala (Aula, Secretos) con el efecto de velocidad. Si la sala falla, el menú vuelve a quedar utilizable. @param {string} name clave registrada con registerRoom */
  function enterRoom(name) {
    const R = ROOMS[name]; if (!S || !S.room || !R || S.busy) return;
    S.busy = true; sfx('serve');
    const ms = reduced() ? 30 : 350;
    S.wrap.classList.add('zoomout');
    setTimeout(() => {
      try {
        S.curRoom = name;
        S.room.style.display = 'block'; S.room.className = 'ini-room arrive'; S.room.innerHTML = '';
        R.mount(S.room, roomApi());
      } catch (e) {
        console.warn('sala', name, e);
        S.curRoom = null; S.room.style.display = 'none'; S.room.className = 'ini-room'; S.room.innerHTML = '';
        S.wrap.classList.remove('zoomout'); S.busy = false;
      }
    }, ms);
    setTimeout(() => { if (S.room) S.room.classList.remove('arrive'); S.busy = false; }, ms + (reduced() ? 30 : 300));
  }

  /** Sale de la sala actual con la transición al revés y vuelve a pintar el menú. */
  function leaveRoom() {
    if (!S || !S.room || !S.curRoom || S.busy) return;
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
    play() {                                           // CONTINUAR: entra directo al siguiente nivel de Campaña (con la explicación del Maestro si es la primera vez)
      if (!tutDone()) return triggerActiveItem();
      sfx('serve'); markSeen('camp');
      try { playCampaignLevel(Math.max(0, unlockedLevel() - 1)); } catch (e) { console.warn('Inicio.play', e); triggerActiveItem(); }
    },
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

    // Sincronización en vivo de propinas
    const _upHUD = window.updatePropinasHUD;
    if (typeof _upHUD === 'function') {
      window.updatePropinasHUD = function () {
        const r = _upHUD.apply(this, arguments);
        try {
          const wEls = document.querySelectorAll('.hub-hdr-chip.wallet b');
          const val = wallet();
          wEls.forEach(el => el.textContent = val);
        } catch (e) {}
        return r;
      };
    }

    // Sincronización en vivo del perfil
    const _syncBar = window.syncLinkedUserBar;
    if (typeof _syncBar === 'function') {
      window.syncLinkedUserBar = function () {
        const r = _syncBar.apply(this, arguments);
        try {
          const nameEl = document.querySelector('.hub-prof-name');
          if (nameEl) nameEl.textContent = chefName();
          const avEl = document.querySelector('.hub-hdr-chip.profile span');
          if (avEl) avEl.textContent = chefAvatar();
        } catch (e) {}
        return r;
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
