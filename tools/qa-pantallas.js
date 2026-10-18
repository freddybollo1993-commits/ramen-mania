/* Auditoría de pantalla (QA): abre las pantallas principales del juego y cuenta los elementos visibles que se salen del área útil.
 * Sirve para comprobar el escalado de escala-pantalla.js en tamaños chicos (iPhone SE 667×375, 568×320, 812×375, Safari con barras 844×340…).
 *
 * Uso (con el servidor en marcha y la ventana ya del tamaño a probar; mejor recargar la página antes para que el escalado se aplique):
 *   await (await fetch('/tools/qa-pantallas.js')).text().then(t => (0, eval)(t)); const r = await QAPantallas.run(); r
 * Resultado: { ventana: {...}, escala: {...}, pantallas: [{ pantalla, fuera: n, ejemplos: [...] }], total }.
 * Solo corre en localhost; no pulsa cuenta, nube, ranking ni compras; restaura el localStorage. No sustituye probar en el dispositivo real:
 * mide geometría, no si un gesto es cómodo.
 */
(function () {
  'use strict';
  if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) { window.QAPantallas = { run() { throw new Error('QAPantallas solo corre en localhost'); } }; return; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const label = el => (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') || el.tagName.toLowerCase();

  /** Elementos visibles que sobresalen del área visible (tolerancia 4 px; los que están fuera del todo se consideran escondidos a propósito); ignora los que están dentro de un contenedor desplazable (auto/scroll); lo recortado por overflow:hidden sí cuenta como desborde. */
  function fuera() {
    const W = innerWidth, H = innerHeight, out = [];
    const clipped = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (/(auto|scroll)/.test(cs.overflowX + cs.overflowY)) { const r = p.getBoundingClientRect(); if (r.width && r.height) return true; } } return false; };
    document.querySelectorAll('body *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || cs.pointerEvents === 'none' && cs.position === 'fixed') return;
      if (/^(SCRIPT|STYLE|LINK|META|HEAD|BR|SVG|PATH)$/i.test(el.tagName)) return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      if (r.right <= 0 || r.bottom <= 0 || r.left >= W || r.top >= H) return;                       // fuera del todo = escondido a propósito (avisos que entran, etc.)
      if (r.right > W + 4 || r.bottom > H + 4 || r.left < -4 || r.top < -4) { if (!clipped(el)) out.push({ el: label(el), r: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] }); }
    });
    return out;
  }

  async function run() {
    const snapshot = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); snapshot[k] = localStorage.getItem(k); } } catch (e) {}
    const pantallas = [];
    const medir = async (nombre, abrir, espera) => {
      try { await abrir(); await sleep(espera || 500); const f = fuera(); pantallas.push({ pantalla: nombre, fuera: f.length, ejemplos: f.slice(0, 6).map(x => x.el + ' [' + x.r.join(',') + ']') }); }
      catch (e) { pantallas.push({ pantalla: nombre, error: String(e.message || e) }); }
    };
    const cierra = async () => { try { document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')); } catch (e) {} for (const f of [() => Modos.close(), () => Taller.close(), () => Servicio.close(), () => Recetario.close(), () => MultiplayerManager.closeLobbyModal()]) { try { f(); } catch (e) {} } await sleep(150); };
    try {
      localStorage.setItem('ramen_tutorial_completed', 'true');
      await cierra();
      await medir('Inicio', async () => {});
      await medir('Modos de juego (Campaña)', async () => { Modos.open(); });
      await cierra(); await medir('Aprender', async () => { Modos.learn(); }); await cierra();
      await medir('Tienda', async () => { Taller.open('mejoras'); }); await cierra();
      await medir('Misiones', async () => { Servicio.open(); }); await cierra();
      await medir('Recetario', async () => { Recetario.open(); }); await cierra();
      await medir('Sala online', async () => { MultiplayerManager.openLobbyModal(); }); await medir('Sala online · reglas', async () => { MultiplayerManager.switchLobbyTab('private'); }); await cierra();
      // partida: nivel 16 (las cuatro áreas)
      gameState.gameMode = 'NORMAL'; setStartSelectedMode('NORMAL'); executeStartGame(); await sleep(300);
      gameState.gameMode = 'NORMAL'; startLevel(15); await sleep(500);
      const b = document.getElementById('level-brief'); if (b) { try { b.querySelector('.lb-go').click(); } catch (e) {} await sleep(200); }
      for (const a of ['ramen', 'salteados', 'makis', 'frituras']) {
        for (const st of ['cook', 'prod', 'plate']) await medir('Cocina ' + a + ' · ' + st, async () => { switchKitchenArea(a); await sleep(120); setKitchenStage(st); }, 450);
      }
      switchKitchenArea('ramen'); setKitchenStage('cook');
      await medir('Cierre de nivel', async () => { gameState.money = 999; winLevel(); }, 500);
      try { document.getElementById('level-end-modal').classList.remove('active'); returnToStartMenu(); } catch (e) {}
    } finally {
      try { localStorage.clear(); Object.keys(snapshot).forEach(k => localStorage.setItem(k, snapshot[k])); } catch (e) {}
    }
    const total = pantallas.reduce((n, p) => n + (p.fuera || 0), 0);
    const esc = window.EscalaPantalla ? EscalaPantalla.info() : null;
    return { ventana: { ancho: innerWidth, alto: innerHeight }, escala: esc, total, pantallas: pantallas.filter(p => p.fuera || p.error), revisadas: pantallas.length };
  }
  window.QAPantallas = { run };
})();
