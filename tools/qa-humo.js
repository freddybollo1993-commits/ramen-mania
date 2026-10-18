/* Bot de humo de Ramen Mania (QA) — se ejecuta DENTRO del juego, sin instalar nada.
 *
 * Qué hace: recorre los 20 niveles de la Campaña, comprueba las etapas y la ficha del Maestro, simula 40 s de partida por nivel,
 * prueba dobles toques en acciones críticas, reinicia niveles 30 veces para detectar temporizadores y nodos que se acumulan,
 * y devuelve un informe JSON. Protecciones: solo corre en localhost; BLOQUEA toda petición a Supabase (como si no hubiera red) para
 * no escribir nunca en la nube; guarda y restaura el localStorage; no pulsa botones de cuenta, nube, ranking ni compras.
 *
 * Cómo usarlo (con el servidor de pruebas en marcha, p. ej. http://localhost:3100):
 *   1) Abre el juego y, en la consola del navegador (o con javascript_tool del panel):
 *        await (await fetch('/tools/qa-humo.js')).text().then(t => (0, eval)(t)); const r = await QAHumo.run(); r
 *   2) Opciones: QAHumo.run({ niveles: [1, 5, 9], ticks: 40, reinicios: 30 })
 *   3) r.ok = true si no hubo errores ni avisos graves; r.problemas lista lo que hay que mirar.
 * Modo Rash: await QAHumo.rash() (ver más abajo). Limitaciones: no juega con gestos (arrastres, círculos, tajos); eso se prueba en el celular. El panel de pruebas puede no avanzar
 * requestAnimationFrame con la pestaña oculta: este bot usa gameTick() directamente, no depende de él.
 */
(function () {
  'use strict';
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const AREAS = ['ramen', 'salteados', 'makis', 'frituras'];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function run(opt) {
    opt = Object.assign({ niveles: null, ticks: 40, reinicios: 30 }, opt || {});
    if (!LOCAL) throw new Error('QAHumo solo corre en localhost (para no tocar la nube ni a otros jugadores).');
    const t0 = performance.now(), problemas = [], avisos = [], niveles = [];
    const P = m => problemas.push(m), A = m => avisos.push(m);

    // --- protecciones: red bloqueada, almacenamiento restaurable ---
    const snapshot = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); snapshot[k] = localStorage.getItem(k); } } catch (e) {}
    const origFetch = window.fetch, bloqueadas = [];
    window.fetch = function (u) { const url = String((u && u.url) || u); if (/supabase\.co/.test(url)) { bloqueadas.push(url.replace(/\?.*/, '').slice(0, 90)); return Promise.reject(new TypeError('Failed to fetch (bloqueado por QAHumo)')); } return origFetch.apply(this, arguments); };
    const origBeacon = navigator.sendBeacon; try { navigator.sendBeacon = () => false; } catch (e) {}

    // --- contabilidad de temporizadores ---
    const live = new Map(), oSI = window.setInterval, oCI = window.clearInterval;
    window.setInterval = function (fn, ms) { const id = oSI.apply(this, arguments); live.set(id, ms); return id; };
    window.clearInterval = function (id) { live.delete(id); return oCI.apply(this, arguments); };

    // --- errores ---
    const errores = [];
    const onErr = e => errores.push((e.message || e.reason && e.reason.message || String(e.reason || 'error')) + (e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : ''));
    window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr);
    const oCE = console.error; console.error = function () { errores.push('console.error: ' + Array.from(arguments).map(String).join(' ').slice(0, 160)); return oCE.apply(this, arguments); };

    let dom0 = 0, domFin = 0, heap0 = null, heapFin = null, soak = [];
    try {
      localStorage.setItem('ramen_tutorial_completed', 'true'); localStorage.removeItem('ramen_camp_brief_seen');
      dom0 = document.getElementsByTagName('*').length; heap0 = performance.memory ? performance.memory.usedJSHeapSize : null;
      setStartSelectedMode('NORMAL'); executeStartGame(); await sleep(150);

      // 1) recorrido de niveles
      const lista = (opt.niveles || NIVELES.map(n => n.level)).map(n => n - 1);
      for (const i of lista) {
        const cfg = NIVELES[i], nota = [];
        gameState.gameMode = 'NORMAL'; startLevel(i); await sleep(120);
        const ficha = document.getElementById('level-brief');
        const fichaEsperada = !!(cfg.brief && cfg.brief.card);
        if (!!ficha !== fichaEsperada) nota.push(ficha ? 'ficha inesperada' : 'falta la ficha del Maestro');
        if (ficha) { if (!gameState.isPaused) nota.push('la ficha no pausó la partida'); ficha.querySelector('.lb-go').click(); ficha.querySelector && 0; if (gameState.isPaused) nota.push('la partida sigue pausada tras cerrar la ficha'); }
        AREAS.forEach(a => { if (stagedOn(a) !== cfg.areas.includes(a)) nota.push('etapas de ' + a + ' ' + (stagedOn(a) ? 'activas sin estar abierta' : 'apagadas en un área abierta')); });
        for (const a of cfg.areas) {
          try { switchKitchenArea(a); await sleep(40); const tabs = Array.from(document.querySelectorAll('#kitchen-stage-tabs .kitchen-stage-btn')); const bloq = tabs.filter(t => t.classList.contains('locked')).length; if (tabs.length < 3 || bloq) nota.push(a + ': pestañas de etapa ' + tabs.length + ', bloqueadas ' + bloq); ['prod', 'plate', 'cook'].forEach(s => { try { setKitchenStage(s); } catch (e) { nota.push(a + '/' + s + ': ' + e.message); } }); } catch (e) { nota.push(a + ': ' + e.message); }
        }
        // 40 s de partida simulada: sin NaN ni negativos
        for (let k = 0; k < opt.ticks; k++) { try { gameTick(); } catch (e) { nota.push('gameTick: ' + e.message); break; } }
        const bad = v => typeof v !== 'number' || !isFinite(v);
        if (bad(gameState.money) || gameState.money < 0) nota.push('dinero inválido: ' + gameState.money);
        if (bad(gameState.timeLeft)) nota.push('tiempo inválido: ' + gameState.timeLeft);
        (gameState.customerSlots || []).forEach((c, ci) => { if (c && (bad(c.patience) || bad(c.maxPatience))) nota.push('paciencia inválida del cliente ' + ci); });
        niveles.push({ nivel: cfg.level, ok: !nota.length, notas: nota });
        nota.forEach(n => P('Nivel ' + cfg.level + ': ' + n));
      }

      // 2) dobles acciones críticas
      const dobles = [];
      { const n0 = live.size; gameState.gameMode = 'NORMAL'; startLevel(0); startLevel(0); await sleep(100); const n1 = live.size; dobles.push({ prueba: 'startLevel doble seguido', intervalosAntes: n0, intervalosDespues: n1 }); if (n1 - n0 > 3) P('startLevel doble deja ' + (n1 - n0) + ' temporizadores nuevos (¿se duplica el bucle?)'); }
      { const b = document.getElementById('level-brief'); if (b) { const go = b.querySelector('.lb-go'); go.click(); go.click(); } await sleep(30); if (gameState.isPaused) P('doble toque en «¡Empezar!» dejó la partida pausada'); }
      { const p0 = gameState.isPaused; togglePause(); togglePause(); if (gameState.isPaused !== p0) P('togglePause doble no vuelve al estado original'); }

      // 3) reinicios repetidos (fugas)
      for (let r = 1; r <= opt.reinicios; r++) {
        gameState.gameMode = 'NORMAL'; startLevel(r % NIVELES.length); if (document.getElementById('level-brief')) document.getElementById('level-brief').querySelector('.lb-go').click();
        for (let k = 0; k < 5; k++) { try { gameTick(); } catch (e) { P('gameTick en reinicio ' + r + ': ' + e.message); break; } }
        if ([1, 10, opt.reinicios].includes(r)) soak.push({ reinicio: r, intervalosVivos: live.size, nodosDOM: document.getElementsByTagName('*').length });
      }
      if (soak.length >= 2 && soak[soak.length - 1].intervalosVivos > soak[0].intervalosVivos + 1) P('los temporizadores crecen con los reinicios: ' + soak.map(s => s.reinicio + '→' + s.intervalosVivos).join(', '));
      // la pantalla de partida añade nodos la primera vez: se compara el reinicio 10 con el último (si siguen creciendo, hay fuga)
      if (soak.length >= 3 && soak[soak.length - 1].nodosDOM > soak[1].nodosDOM * 1.05 + 30) A('el DOM crece con los reinicios: ' + soak.map(s => s.reinicio + '→' + s.nodosDOM).join(', '));

      try { returnToStartMenu(); } catch (e) { A('returnToStartMenu: ' + e.message); }
      await sleep(200);
      domFin = document.getElementsByTagName('*').length; heapFin = performance.memory ? performance.memory.usedJSHeapSize : null;
      if (live.size > 2) A('quedan ' + live.size + ' temporizadores vivos creados durante la prueba tras volver al menú (' + Array.from(live.values()).join(' ms, ') + ' ms)');
      errores.forEach(e => P('error de ejecución: ' + e));

      const informe = {
        ok: !problemas.length, version: (document.getElementById('app-version') || {}).textContent, fecha: new Date().toISOString(), segundos: +((performance.now() - t0) / 1000).toFixed(1),
        niveles, dobles, soak, intervalos: { vivosAlFinal: live.size }, dom: { inicio: dom0, final: domFin }, heapMB: heap0 != null ? { inicio: +(heap0 / 1048576).toFixed(1), final: +(heapFin / 1048576).toFixed(1) } : null,
        peticionesBloqueadas: bloqueadas.length, problemas, avisos
      };
      window.__ULTIMO_QA__ = informe;
      console.log('[QAHumo] ' + (informe.ok ? '✓ sin problemas' : '✗ ' + problemas.length + ' problemas') + ' · ' + niveles.length + ' niveles · ' + informe.segundos + ' s');
      return informe;
    } finally {
      window.fetch = origFetch; try { navigator.sendBeacon = origBeacon; } catch (e) {}
      window.setInterval = oSI; window.clearInterval = oCI; console.error = oCE;
      window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr);
      try { localStorage.clear(); Object.keys(snapshot).forEach(k => localStorage.setItem(k, snapshot[k])); } catch (e) {}
    }
  }
  /* Recorrido del modo RASH: para cada ronda elegida comprueba las etapas y las pestañas de las áreas abiertas, y juega con dos jugadores sintéticos:
   *  · «perfecto»: sirve al instante cada pedido con un plato de 3★ (comprueba que la ronda se GANA: contador, vidas, pantalla de cierre, guardado y paso a la siguiente);
   *  · «ausente»: no sirve nada (comprueba que se PIERDE al agotar las vidas y que sale la pantalla de ronda fallida).
   * No mide si un humano puede ganar (eso lo estima tools/simular-rash.cjs). Mismas protecciones que run(): solo localhost, Supabase bloqueado, localStorage restaurado.
   * Uso: await QAHumo.rash({ rondas: [1, 6, 12, 22, 40, 100] }) */
  async function rash(opt) {
    opt = Object.assign({ rondas: [1, 2, 3, 6, 12, 22, 40, 100], maxTicks: 6000 }, opt || {});
    if (!LOCAL) throw new Error('QAHumo solo corre en localhost (para no tocar la nube ni a otros jugadores).');
    const t0 = performance.now(), problemas = [], filas = [], P = m => problemas.push(m);
    const snapshot = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); snapshot[k] = localStorage.getItem(k); } } catch (e) {}
    const origFetch = window.fetch, bloqueadas = [];
    window.fetch = function (u) { const url = String((u && u.url) || u); if (/supabase\.co/.test(url)) { bloqueadas.push(url); return Promise.reject(new TypeError('Failed to fetch (bloqueado por QAHumo)')); } return origFetch.apply(this, arguments); };
    const origBeacon = navigator.sendBeacon; try { navigator.sendBeacon = () => false; } catch (e) {}
    const errores = [], onErr = e => errores.push((e.message || e.reason && e.reason.message || String(e.reason || 'error')) + (e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : ''));
    window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr);
    const orig = { evaluateDish: window.evaluateDish, qualityTier: window.qualityTier, consumeReadyDish: window.consumeReadyDish };
    const restaura = () => { window.evaluateDish = orig.evaluateDish; window.qualityTier = orig.qualityTier; window.consumeReadyDish = orig.consumeReadyDish; };
    const modal = () => document.getElementById('level-end-modal'), titulo = () => (document.getElementById('end-title') || {}).textContent || '';
    const cierra = () => { try { modal().classList.remove('active'); } catch (e) {} };
    try {
      localStorage.setItem('ramen_tutorial_completed', 'true');
      setStartSelectedMode('RASH'); executeStartGame(); await sleep(150);
      for (const r of opt.rondas) {
        const fila = { ronda: r, notas: [] }, nota = m => { fila.notas.push(m); P('Ronda ' + r + ': ' + m); };
        // --- jugador perfecto: gana la ronda ---
        cierra(); gameState.gameMode = 'RASH'; startLevel(r - 1); await sleep(80);
        const cfg = getCurrentLevelConfig(); fila.clientes = cfg.customers; fila.vidas = gameState.rashLives; fila.spawn = cfg.spawn_time; fila.paciencia = cfg.base_patience;
        const abiertas = AREAS.filter(a => isAreaUnlocked(a)); fila.areas = abiertas.join('/');
        AREAS.forEach(a => { if (stagedOn(a) !== isAreaUnlocked(a)) nota('etapas de ' + a + ' ' + (stagedOn(a) ? 'activas sin estar abierta' : 'apagadas en un área abierta')); });
        for (const a of abiertas) { try { switchKitchenArea(a); await sleep(30); const tabs = Array.from(document.querySelectorAll('#kitchen-stage-tabs .kitchen-stage-btn')); const bloq = tabs.filter(t => t.classList.contains('locked')).length; if (tabs.length < 3 || bloq) nota(a + ': pestañas de etapa ' + tabs.length + ', bloqueadas ' + bloq); ['prod', 'plate', 'cook'].forEach(st => { try { setKitchenStage(st); } catch (e) { nota(a + '/' + st + ': ' + e.message); } }); } catch (e) { nota(a + ': ' + e.message); } }
        window.evaluateDish = () => ({ score: 100, cook: { state: 'PERFECTO' }, plate: { score: 25 }, errors: [], notes: [] });
        window.qualityTier = () => 3; window.consumeReadyDish = () => {};
        let ticks = 0;
        while (ticks < opt.maxTicks && !gameState.isGameOver) {
          try { gameTick(); } catch (e) { nota('gameTick: ' + e.message); break; } ticks++;
          (gameState.customerSlots || []).forEach((c, ci) => { if (c) c.orders.forEach((o, oi) => { if (!o.served) { try { serveOrder(ci, oi, { area: o.recipe.area || 'ramen', index: 0, recipe: o.recipe, quality: 'PERFECTO', meta: {} }); } catch (e) { nota('serveOrder: ' + e.message); } } }); });
        }
        const ganada = gameState.isGameOver && /Superada|LEYENDA/.test(titulo()) && modal().classList.contains('active');
        fila.ticksGanar = ticks; fila.servidos = gameState.rashCustomersServed;
        if (!ganada) nota('el jugador perfecto no ganó la ronda (título «' + titulo() + '», ' + ticks + ' s, servidos ' + gameState.rashCustomersServed + '/' + cfg.customers + ', vidas ' + gameState.rashLives + ')');
        else {
          if (gameState.rashCustomersServed !== cfg.customers) nota('servidos ' + gameState.rashCustomersServed + ' ≠ clientes de la ronda ' + cfg.customers);
          const guardada = +(localStorage.getItem('ramen_mania_rash_level') || 0); if (r < 100 && guardada !== r + 1) nota('progreso guardado ' + guardada + ' (esperaba ' + (r + 1) + ')');
          if (r < 100) { handleNextLevelButton(); await sleep(60); if (gameState.rashLevel !== r + 1 || gameState.isGameOver) nota('«Iniciar ronda ' + (r + 1) + '» no arrancó la siguiente ronda (ronda ' + gameState.rashLevel + ')'); }
        }
        clearInterval(gameLoopInterval); cierra(); restaura();
        // --- jugador ausente: pierde ---
        gameState.gameMode = 'RASH'; startLevel(r - 1); await sleep(60); ticks = 0;
        while (ticks < opt.maxTicks && !gameState.isGameOver) { try { gameTick(); } catch (e) { nota('gameTick (ausente): ' + e.message); break; } ticks++; }
        const perdida = gameState.isGameOver && /Fallida/.test(titulo()) && modal().classList.contains('active');
        fila.ticksPerder = ticks; if (!perdida) nota('el jugador ausente no perdió la ronda (título «' + titulo() + '», ' + ticks + ' s, vidas ' + gameState.rashLives + ')');
        const bad = v => typeof v !== 'number' || !isFinite(v); if (bad(gameState.money) || bad(gameState.rashLives)) nota('valores inválidos: dinero ' + gameState.money + ', vidas ' + gameState.rashLives);
        clearInterval(gameLoopInterval); cierra();
        filas.push(fila);
      }
      try { returnToStartMenu(); } catch (e) {}
      errores.forEach(e => P('error de ejecución: ' + e));
      const informe = { ok: !problemas.length, version: (document.getElementById('app-version') || {}).textContent, segundos: +((performance.now() - t0) / 1000).toFixed(1), rondas: filas, peticionesBloqueadas: bloqueadas.length, problemas };
      window.__ULTIMO_QA_RASH__ = informe; console.log('[QAHumo.rash] ' + (informe.ok ? '✓ sin problemas' : '✗ ' + problemas.length + ' problemas') + ' · ' + filas.length + ' rondas');
      return informe;
    } finally {
      window.fetch = origFetch; try { navigator.sendBeacon = origBeacon; } catch (e) {}
      restaura();
      window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr);
      try { localStorage.clear(); Object.keys(snapshot).forEach(k => localStorage.setItem(k, snapshot[k])); } catch (e) {}
    }
  }
  window.QAHumo = { run, rash };
})();
