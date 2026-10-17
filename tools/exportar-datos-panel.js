/* Exporta los datos del juego que usa el panel (panel/datos-juego.js): platos (con su receta completa de Campaña) y niveles.
   Se ejecuta DENTRO de la página del juego (localhost:3100) y devuelve el texto del archivo:
     await (await fetch('/tools/exportar-datos-panel.js')).text().then(t => (0, eval)(t));   // devuelve el texto en window.__panelDatos
     copy(window.__panelDatos)                                                                // o léelo desde la consola
   Hay que volver a generarlo cuando cambien recetas, niveles o desbloqueos. */
(function () {
  const AREAS = { ramen: RECETAS_RAMEN, salteados: RECETAS_SALTEADOS, frituras: RECETAS_FRITURAS, makis: RECETAS_MAKIS };
  const opt = { makis: [96, 97] };
  const nm = id => { const i = INGREDIENTES.find(x => x.id === id); return i ? (i.short || i.display) : String(id); };
  const platos = [];
  Object.entries(AREAS).forEach(([area, lista]) => lista.forEach(r => {
    let full, cook = null, plate = [];
    if (area === 'salteados' && SAL_STAGED[r.name]) {
      cook = salCookIds(r.name); plate = SAL_STAGED[r.name].plate;
      full = [...new Set([...cook, ...plate])];
    } else {
      plate = stParts(area, r); const s = new Set(r.ingredients); plate.forEach(i => s.add(i));
      if (area === 'frituras' && FRY_PLATING[r.name]) s.add(FRY_PLATING[r.name].protein);
      full = [...s];
      cook = full.filter(i => !plate.includes(i));
    }
    full = full.filter(i => !(opt[area] || []).includes(i));
    // nivel de Campaña en que entra: ramen por ramen_names, el resto por AREA_DISH_UNLOCKS
    let nivel = null, rash = null;
    if (area === 'ramen') { const n = NIVELES.find(l => l.ramen_names.includes(r.name)); nivel = n ? n.level : null; }
    else { const u = (AREA_DISH_UNLOCKS[area] || []).find(d => d[0] === r.name); if (u) { nivel = u[1]; rash = u[2]; } }
    platos.push({ area, nombre: r.name, slug: statsDishKey(area, r.name), precio: r.price, ingredientes: full.length, cocina: cook.length, emplatado: plate.filter(i => !(opt[area] || []).includes(i)).length,
      lista: full.map(nm), nivel, rash, hervido: r.metodo === 'hervido' || undefined });
  }));
  const niveles = NIVELES.map(n => ({ nivel: n.level, nombre: n.name.replace(/^Nivel \d+:\s*/, ''), arco: n.arc, meta: n.goal, tiempo: n.time, clientes: n.max_customers, pedidos: n.max_orders, areas: n.areas, mecanica: n.focus && n.focus.mechanic, platos: n.ramen_names.length }));
  // retos del Entrenamiento (los mismos ids que guardan las cuentas) con su tiempo de oro
  const retos = TRAINING_CHALLENGES.map(c => ({ id: c.id, ch: c.ch, titulo: c.title, par: trainingPar(c), total: trainingTotal(c) }));
  const txt = '/* Generado por tools/exportar-datos-panel.js desde el juego (' + ((document.getElementById('app-version') || {}).textContent || '?') + '). No editar a mano. */\n'
    + 'window.PANEL_PLATOS = ' + JSON.stringify(platos) + ';\nwindow.PANEL_NIVELES = ' + JSON.stringify(niveles) + ';\nwindow.PANEL_RETOS = ' + JSON.stringify(retos) + ';\n';
  window.__panelDatos = txt;
  return txt.length;
})();
