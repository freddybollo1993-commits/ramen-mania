/* Tutorial guiado (100 % interactivo): te lleva de la mano hasta servir 1 plato de cada área (Ramen, Salteado, Makis y Frituras).
   Cada paso muestra un texto claro, marca con un recuadro amarillo (y una manita) dónde tocar y avanza SOLO cuando haces la acción.
   Si te atascas, «Saltar paso» hace la acción por ti. Usa una partida de Cocina libre (sin tiempo ni clientes que se vayan) con todas las etapas activas. */
(function () {
  'use strict';
  const G = (window.Guia = { active: false });
  let steps = [], i = 0, timer = 0, tEnter = 0, advancing = false, base = {}, exitAsk = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ING = id => INGREDIENTES.find(x => x.id === id);
  const nm = id => (ING(id) ? ING(id).display : '#' + id);
  const tile = id => [...document.querySelectorAll('.ing-station-tile')].find(t => t.getAttribute('aria-label') === nm(id));
  const sel = (s, root) => (root || document).querySelector(s);
  const stg = a => getStage(a);
  const AREA_NAME = { ramen: 'RAMEN', salteados: 'SALTEADO', frituras: 'FRITURAS', makis: 'MAKIS' };
  const STAGE_NAME = { prod: 'Producción', cook: 'Cocinar', plate: 'Emplatar' };
  const dropIn = (elId, id) => applyIngredientDrop(document.getElementById(elId), ING(id), 0);
  const served = () => gameState.customersServed || 0;
  const cust = recipe => { gameState.customerSlots = [null, null, null, null]; spawnCustomer(recipe); renderCustomers(); };
  const orderNames = ids => ids.map(nm).join(' → ');
  const cardBtn = (name, btnSel) => () => { const c = [...document.querySelectorAll('.fp-card')].find(x => x.querySelector('.fp-card-name') && x.querySelector('.fp-card-name').textContent.toLowerCase().includes(name)); return c ? c.querySelector(btnSel || '.fp-btn') : null; };

  // ---------------------------------------------------------------- pasos
  const S = [];
  const add = o => { S.push(o); return o; };

  // ===== Bienvenida =====
  add({ seg: 'Bienvenida', info: true, title: '🍜 ¡Bienvenido a Ramen Mania!', text: 'Vas a aprender cocinando: en este tutorial preparas <b>1 plato de cada área</b> (Ramen, Salteado, Makis y Frituras). Yo te guío paso a paso: tocas donde te marco con el <b>recuadro amarillo</b> y el tutorial avanza solo. Aquí no hay tiempo: nadie se va. Si te atascas, usa «Saltar paso» y lo hago por ti.' });
  add({ seg: 'Bienvenida', info: true, title: '🏪 Las 4 áreas de la cocina', target: '#kitchen-area-tabs', text: 'Arriba están las <b>4 áreas</b>: RAMEN, SALTEADO, FRITURAS y MAKIS. Cada una tiene su propia mesa de trabajo. Tocas una pestaña para cambiar de área.' });
  add({ seg: 'Bienvenida', info: true, title: '🧭 Las 3 etapas de cada área', target: '#kitchen-stage-tabs', text: 'En cada área trabajas en <b>3 etapas</b>: <b>🥬 Producción</b> (preparar los insumos: cortar, lavar, cocer), <b>🍳 Cocinar</b> (cocinar el plato base) y <b>🍽️ Emplatar</b> (terminar el plato con sus acompañamientos y servirlo). Se cambia de etapa con estos botones.' });

  // ===== RAMEN (Shio) =====
  add({ seg: 'Ramen', area: 'ramen', title: '👤 Llega un cliente', target: '#cust-slot-card-0', setup() { cust(RECETAS_RAMEN[0]); }, text: 'Llegó un cliente y pide un <b>ramen Shio</b>. Toca su tarjeta para ver qué lleva el pedido.', done: () => gameState.selectedCustomerModalIndex === 0, assist: () => openCustomerOrderModal(0) });
  add({ seg: 'Ramen', area: 'ramen', title: '📋 El pedido', target: '#customer-order-modal .btn-danger', text: 'Aquí ves el plato y sus ingredientes. Recuerda: caldo Shio, fideos y de adorno chasu, huevo, poro, cebolla china, ajonjolí, nori y moyashi. Toca <b>✕</b> para cerrar.', done: () => gameState.selectedCustomerModalIndex == null, assist: () => closeCustomerOrderModal() });
  add({ seg: 'Ramen', area: 'ramen', stage: null, title: '🥬 Etapa 1: Producción', target: '.kitchen-stage-btn[data-stage="prod"]', text: 'Todo plato empieza preparando insumos. Toca el botón <b>🥬 Producción</b>.', done: () => stg('ramen') === 'prod', assist: () => setKitchenStage('prod') });
  add({ seg: 'Ramen', area: 'ramen', stage: 'prod', title: '🔪 Cortar poro', target: () => cardBtn('poro')() || sel('.fp-card .fp-btn[title="Cortar Poro"]'), text: 'Cada ficha es un insumo. Vamos a cortar <b>poro</b> (se usa en el Shio). Toca el botón <b>🔪 Cortar</b> de la ficha «Poro».', done: () => stGet('ramen').board && stGet('ramen').board.key === 'poro', assist: () => stProdStart('ramen', 'poro') });
  add({ seg: 'Ramen', area: 'ramen', stage: 'prod', title: '🔪 Prepara el cuchillo', target: '#shop-knife', to: '#shop-board', text: 'El poro quedó en la tabla de la izquierda. <b>Arrastra el cuchillo</b> (mantén el dedo sobre él y llévalo) hasta la tabla y suéltalo ahí.', done: () => stGet('ramen').knifeArmed || (stGet('ramen').board && stGet('ramen').board.taps > 0), assist: () => { stGet('ramen').knifeArmed = true; stRenderIfOpen('ramen'); } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'prod', title: '⚡ Corta con tajos rápidos', target: '#shop-board', setup() { base.poro = stGet('ramen').stock.poro; }, text: 'Ahora desliza el dedo <b>rápido de lado a lado</b> sobre el poro, como un tajo. Haz <b>3 tajos</b> (cada vez saliendo de la tabla y volviendo a cruzar): 3 cortes = 1 porción nueva de poro.', done: () => stGet('ramen').stock.poro > base.poro, assist: async () => { stGet('ramen').knifeArmed = true; stRenderIfOpen('ramen'); for (let k = 0; k < 8 && stGet('ramen').stock.poro <= base.poro; k++) { shopChop(); await sleep(520); } } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'prod', title: '🍜 A cocinar', target: () => sel('.stage-panel-back') || sel('.kitchen-stage-btn[data-stage="cook"]'), text: '¡Poro listo! Los demás insumos ya están preparados para que no esperes. Toca <b>🍜 Cocinar</b> (arriba a la derecha) para pasar a la etapa 2.', done: () => stg('ramen') === 'cook', assist: () => setKitchenStage('cook') });
  add({ seg: 'Ramen', area: 'ramen', stage: 'cook', title: '🍜 Cocer los fideos', target: '#btn-cook-noodles', text: 'Etapa 2: aquí se cocina la base. Primero los <b>fideos</b>: toca la olla «Fideos» para empezar a cocerlos.', done: () => kitchenState.noodles.state !== 'IDLE' || kitchenState.stocks.noodles > 0, assist: () => { if (kitchenState.noodles.state === 'IDLE') handleNoodlesBtnClick(); } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'cook', title: '✨ Recoge los fideos a tiempo', target: '#btn-cook-noodles', text: () => kitchenState.noodles.state === 'COOKING' ? 'Se están cociendo… espera a que la olla brille en dorado (unos 4 segundos).' : 'Los fideos están listos: toca la olla <b>otra vez</b> para recogerlos. Si te demoras, se queman.', done: () => kitchenState.stocks.noodles > 0, assist: async () => { if (kitchenState.noodles.state === 'COOKING') kitchenState.noodles.cookTimeRemaining = 0.05; await sleep(400); if (kitchenState.noodles.state === 'READY') handleNoodlesBtnClick(); } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'cook', title: '🥣 Calentar el caldo Shio', target: '#btn-heat-shio', text: 'Ahora el <b>caldo Shio</b>: toca la hornilla «Caldo Shio» para encenderla. Tarda unos segundos en calentarse.', done: () => kitchenState.shio.fire || kitchenState.stocks.shio > 0, assist: () => { if (!kitchenState.shio.fire) shioToggle(); } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'cook', title: '🧯 Apaga la hornilla', target: '#btn-heat-shio', text: () => kitchenState.stocks.shio > 0 ? '¡Caldo caliente (4 porciones)! Toca la hornilla <b>otra vez para apagarla</b>. En una partida normal, si la dejas encendida el caldo se va reduciendo hasta secarse.' : 'Calentando el caldo… espera un momento.', done: () => kitchenState.stocks.shio > 0 && !kitchenState.shio.fire, assist: async () => { if (!kitchenState.shio.fire && kitchenState.stocks.shio <= 0) shioToggle(); for (let k = 0; k < 40 && kitchenState.stocks.shio <= 0; k++) await sleep(150); if (kitchenState.shio.fire) shioToggle(); } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'cook', title: '🔥 Flamear el chasu', target: '.tool-item[data-kind="torch"]', to: '#btn-flame-chasu', text: 'El <b>chasu</b> (cerdo) se flamea con el soplete. Mantén el dedo sobre el <b>Flameador</b> de la fila de herramientas y <b>arrástralo hasta la bandeja «Chasu a flamear»</b>.', done: () => toolArmedMap.has('torch') || kitchenState.stocks.chasu > 0, assist: () => { if (!toolArmedMap.has('torch')) toolArm('torch'); } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'cook', title: '⏳ Espera una porción', target: '#btn-flame-chasu', text: () => kitchenState.stocks.chasu > 0 ? '¡Ya hay 1 porción de chasu flameado! Ahora <b>toca el flameador</b> para retirarlo (así no se quema).' : 'Flameando… cada 2 segundos se hace 1 porción de chasu.', done: () => kitchenState.stocks.chasu > 0 && !toolArmedMap.has('torch'), assist: async () => { for (let k = 0; k < 40 && kitchenState.stocks.chasu <= 0; k++) await sleep(150); toolDisarm('torch'); } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'cook', title: '🍜 Fideos al cuenco', target: () => tile(1), to: '#bowl-card-0', text: 'Armamos el cuenco. <b>1º los fideos</b>: mantén el dedo sobre la ficha «Fideo Ramen» (arriba) y <b>arrástrala al Cuenco 1</b>.', done: () => gameState.bowls[0].ingredients.includes(1), assist: () => dropIn('bowl-card-0', 1) });
  add({ seg: 'Ramen', area: 'ramen', stage: 'cook', title: '🥣 Ahora el caldo', target: () => tile(2), to: '#bowl-card-0', text: '<b>2º el caldo</b>: arrastra «Caldo Shio» al mismo cuenco. El orden importa: primero fideos, luego caldo.', done: () => gameState.bowls[0].ingredients.includes(2), assist: () => dropIn('bowl-card-0', 2) });
  add({ seg: 'Ramen', area: 'ramen', stage: 'cook', title: '🥢 Reparte los fideos', target: '.tool-item[data-kind="ohashi"]', to: '#bowl-card-0', text: 'Los fideos cayeron apelmazados. Arrastra los <b>ohashi</b> (palillos) de la fila de herramientas hasta el cuenco y, <b>manteniendo pulsado</b> sobre ellos, espera unos 3 segundos hasta que digan «¡Fideos bien repartidos!».', done: () => (gameState.bowls[0].spread || 0) >= 1, assist: () => { gameState.bowls[0].spread = 1; toolDisarm('ohashi'); renderBowls(); } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'cook', title: '➡️ Pasa el cuenco a Emplatar', target: '#bowl-card-0', text: 'El cuenco dice «¡Base lista!». <b>Tócalo</b> para mandarlo al pase de Emplatar.', done: () => stGet('ramen').pass.length > 0 || stGet('ramen').slots.some(s => s.item), assist: () => stPassFromBowl(0) });
  add({ seg: 'Ramen', area: 'ramen', stage: null, title: '🍽️ Etapa 3: Emplatar', target: '.kitchen-stage-btn[data-stage="plate"]', text: 'Toca el botón <b>🍽️ Emplatar</b>: ahí se termina el plato.', done: () => stg('ramen') === 'plate', assist: () => setKitchenStage('plate') });
  add({ seg: 'Ramen', area: 'ramen', stage: 'plate', title: '📥 Del pase al cuenco', target: '.fp-pass-card', text: 'A la izquierda, el <b>Pase</b> guarda los platos listos de la cocina. Toca el plato del pase para ponerlo en un cuenco de emplatado.', done: () => stGet('ramen').slots.some(s => s.item), assist: () => stPassToSlot('ramen', 0) });
  const SHIO_PLATE = [11, 15, 17, 18, 19, 20, 25];
  add({ seg: 'Ramen', area: 'ramen', stage: 'plate', title: '🥚 Ponle sus adornos', target: () => { const sl = stGet('ramen').slots.find(s => s.item); const n = SHIO_PLATE.find(id => !sl || !sl.items.includes(id)); return n ? tile(n) : null; }, to: '.plate-bowl:not(.is-empty)', text: () => { const sl = stGet('ramen').slots.find(s => s.item), left = SHIO_PLATE.filter(id => !sl || !sl.items.includes(id)); return `Arrastra los adornos al cuenco <b>en este orden</b>: ${orderNames(SHIO_PLATE)}. Te marco el que sigue${left.length ? ` (faltan ${left.length}: <b>${nm(left[0])}</b>)` : ''}.`; }, done: () => { const sl = stGet('ramen').slots.find(s => s.item); return !!sl && SHIO_PLATE.every(id => sl.items.includes(id)); }, assist: () => { const k = stGet('ramen').slots.findIndex(s => s.item); SHIO_PLATE.forEach(id => stPlateAddItem('ramen', k, id)); } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'plate', title: '✅ ¡Servir!', target: '.plate-bowl:not(.is-empty) .fp-serve', text: 'El plato está completo. Toca <b>✅ Servir</b>: el cliente lo recibe y te paga según la calidad (⭐).', setup() { base.served = served(); }, done: () => served() > base.served, assist: () => stPlateServe('ramen', Math.max(0, stGet('ramen').slots.findIndex(s => s.item))) });
  add({ seg: 'Ramen', info: true, area: 'ramen', title: '🎉 ¡Primer plato servido!', text: () => 'Así se hace un ramen: <b>Producción → Cocinar → Emplatar → Servir</b>. En una partida real los clientes se impacientan, así que conviene tener insumos preparados y varios cuencos en marcha.' + rewardLine('ramen') });

  // ===== SALTEADO (Chicken Teriyaki, en sartén) =====
  const TERI = () => RECETAS_SALTEADOS.find(r => r.name === 'Chicken Teriyaki');
  const wk = () => gameState.woks[0];
  const slotItem = a => stGet(a).slots.findIndex(s => s.item);
  add({ seg: 'Salteado', title: '🥘 Lección: SALTEADO', target: '.kitchen-area-tab-btn[data-area="salteados"]', setup() { cust(TERI()); }, text: 'En esta lección cocinas un plato de Salteado. Llegó un cliente que pide un <b>Chicken Teriyaki</b> (pollo con salsa teriyaki, de acompañamiento arroz gohan y ensalada fría). Toca la pestaña <b>SALTEADO</b>.', done: () => gameState.activeArea === 'salteados', assist: () => switchKitchenArea('salteados') });
  add({ seg: 'Salteado', area: 'salteados', title: '🥬 Producción: la ensalada', target: '.kitchen-stage-btn[data-stage="prod"]', text: 'Primero un insumo del plato: la <b>ensalada fría</b>. Entra a la etapa <b>🥬 Producción</b>.', done: () => stg('salteados') === 'prod', assist: () => setKitchenStage('prod') });
  add({ seg: 'Salteado', area: 'salteados', stage: 'prod', title: '🧺 Limpiar la ensalada', target: cardBtn('ensalada'), text: 'En Salteado hay insumos que se <b>limpian</b> en vez de cortarse. Toca <b>🧺 Limpiar</b> en la ficha «Ensaladas».', done: () => stGet('salteados').board && stGet('salteados').board.key === 'ensalada', assist: () => stProdStart('salteados', 'ensalada') });
  add({ seg: 'Salteado', area: 'salteados', stage: 'prod', title: '👋 Frota de lado a lado', target: '#shop-board', setup() { base.ens = stGet('salteados').stock.ensalada; }, text: 'Pasa el dedo sobre la ensalada <b>de lado a lado</b>, como lavándola. <b>3 pasadas</b> = 1 porción limpia.', done: () => stGet('salteados').stock.ensalada > base.ens, assist: async () => { for (let k = 0; k < 8 && stGet('salteados').stock.ensalada <= base.ens; k++) { shopClean(); await sleep(520); } } });
  add({ seg: 'Salteado', area: 'salteados', title: '🍳 A cocinar', target: '.kitchen-stage-btn[data-stage="cook"]', text: 'Listo. Pasa a la etapa <b>🍳 Cocinar</b>: ahí están las dos hornillas.', done: () => stg('salteados') === 'cook', assist: () => setKitchenStage('cook') });
  add({ seg: 'Salteado', area: 'salteados', stage: 'cook', title: '🔁 Cambia a SARTÉN', target: '#wok-swap-0', text: 'Este plato se cocina en <b>sartén</b>, no en wok (si usas el equivocado, pierdes calidad). En la hornilla izquierda toca el botón <b>WOK ⇄</b> para cambiar a SARTÉN.', done: () => wk().tool === 'pan', assist: () => { if (wk().tool !== 'pan') wokSwapTool(0); } });
  add({ seg: 'Salteado', area: 'salteados', stage: 'cook', title: '🔥 Enciende el fuego', target: '#wok-fire-0', text: 'Todo salteado empieza con la sartén <b>caliente y con aceite</b>. Primero el fuego: toca la <b>perilla</b> de la hornilla.', done: () => wk().fire, assist: () => { if (!wk().fire) wokFireToggle(0); } });
  add({ seg: 'Salteado', area: 'salteados', stage: 'cook', title: '🛢️ Echa el aceite', target: '.tool-item[data-kind="sauce"][data-id="108"]', to: '#wok-card-0', text: 'Ahora el <b>aceite de cocina</b>: arrastra la botella <b>«Aceite»</b> (la primera de la fila de abajo) hasta la sartén y suéltala. Luego toca la botella para verter.', done: () => wk().oil, assist: () => wokPour(0, 108) });
  add({ seg: 'Salteado', area: 'salteados', stage: 'cook', title: '⏳ Espera que caliente', target: '#wok-heat-fill-0', text: () => (wk().heat || 0) >= 0.9 ? '¡Caliente! Ya puedes cocinar.' : 'Espera unos 3 segundos a que se llene la <b>barra de temperatura</b> de la hornilla.', done: () => (wk().heat || 0) >= 0.9, assist: async () => { for (let k = 0; k < 50 && (wk().heat || 0) < 0.9; k++) await sleep(150); } });
  add({ seg: 'Salteado', area: 'salteados', stage: 'cook', title: '🍗 Ronda 1: el pollo', target: () => tile(106), to: '#wok-card-0', text: 'El plato se cocina en <b>rondas</b>. En la ronda 1 entra el <b>Pollo Teriyaki</b>: arrastra su ficha (arriba) hasta la sartén.', done: () => wk().ingredients.includes(106), assist: () => dropIn('wok-card-0', 106) });
  add({ seg: 'Salteado', area: 'salteados', stage: 'cook', title: '⤴ Saltea 3 veces', target: '#wok-card-0', text: () => `Desliza el dedo <b>hacia arriba</b> sobre la sartén con un golpe seco para lanzar la comida. <b>3 lanzamientos = 1 ronda</b> (también vale tocar). Llevas ${wk().taps || 0} de 3.`, done: () => (wk().rounds || 0) >= 1, assist: async () => { for (let k = 0; k < 6 && (wk().rounds || 0) < 1; k++) { wokToss(0); await sleep(900); } } });
  add({ seg: 'Salteado', area: 'salteados', stage: 'cook', title: '💧 Ronda 2: la salsa', target: '.tool-item[data-kind="sauce"][data-id="87"]', to: '#wok-card-0', text: 'Ronda 2: la salsa. Arrastra la botella <b>«Teriyaki»</b> hasta la sartén y toca la botella para verter.', done: () => wk().ingredients.includes(87), assist: () => wokPour(0, 87) });
  add({ seg: 'Salteado', area: 'salteados', stage: 'cook', title: '⤴ Saltea otra ronda', target: '#wok-card-0', text: () => `Otra ronda: <b>3 lanzamientos hacia arriba</b> para integrar la salsa. Llevas ${wk().taps || 0} de 3. No te pases: si das rondas de más, el plato se seca.`, done: () => (wk().rounds || 0) >= 2 || !!wk().result, assist: async () => { for (let k = 0; k < 6 && (wk().rounds || 0) < 2; k++) { wokToss(0); await sleep(900); } } });
  add({ seg: 'Salteado', area: 'salteados', stage: 'cook', title: '✅ Retira el plato', target: '#wok-stir-btn-0', text: 'El botón de la hornilla dice <b>✅ ¡Listo! Toca para retirar</b>. Tócalo en su punto: antes sale crudo y si te demoras se quema.', done: () => !!wk().result, assist: () => { if (!wk().result) wokStagedTap(0); } });
  add({ seg: 'Salteado', area: 'salteados', stage: 'cook', title: '➡️ Manda el plato a Emplatar', target: '#wok-serve-btn-0', text: 'Toca <b>→ A emplatar</b> para mandarlo al pase.', done: () => stGet('salteados').pass.length > 0 || slotItem('salteados') >= 0, assist: () => wokServeClick(0) });
  add({ seg: 'Salteado', area: 'salteados', title: '🍽️ Emplatar', target: '.kitchen-stage-btn[data-stage="plate"]', text: 'Entra a <b>🍽️ Emplatar</b>.', done: () => stg('salteados') === 'plate', assist: () => setKitchenStage('plate') });
  add({ seg: 'Salteado', area: 'salteados', stage: 'plate', title: '📥 Del pase al cuenco', target: '.fp-pass-card', text: 'Toca el plato del <b>pase</b> para ponerlo en un cuenco.', done: () => slotItem('salteados') >= 0, assist: () => stPassToSlot('salteados', 0) });
  const TERI_PLATE = [37, 56];
  add({ seg: 'Salteado', area: 'salteados', stage: 'plate', title: '🍚 Arroz y ensalada', target: () => { const k = slotItem('salteados'), sl = k >= 0 ? stGet('salteados').slots[k] : null; const n = TERI_PLATE.find(id => !sl || !sl.items.includes(id)); return n ? tile(n) : null; }, to: '.plate-bowl:not(.is-empty)', text: () => `Arrastra al plato, <b>en este orden</b>: ${orderNames(TERI_PLATE)}.`, done: () => { const k = slotItem('salteados'); return k >= 0 && TERI_PLATE.every(id => stGet('salteados').slots[k].items.includes(id)); }, assist: () => { const k = slotItem('salteados'); TERI_PLATE.forEach(id => stPlateAddItem('salteados', k, id)); } });
  add({ seg: 'Salteado', area: 'salteados', stage: 'plate', title: '✅ ¡Servir!', target: '.plate-bowl:not(.is-empty) .fp-serve', setup() { base.served = served(); }, text: 'Toca <b>✅ Servir</b> para entregar el Chicken Teriyaki.', done: () => served() > base.served, assist: () => stPlateServe('salteados', Math.max(0, slotItem('salteados'))) });
  add({ seg: 'Salteado', info: true, area: 'salteados', title: '🎉 ¡Salteado servido!', text: () => 'En el Salteado cuenta el <b>ritmo</b>: fuego, aceite, ingredientes en su ronda y 3 lanzamientos por ronda. Cada plato tiene sus propias rondas (el recetario las indica).' + rewardLine('salteados') });

  // ===== MAKIS (Maki California) =====
  const MKT = () => RECETAS_MAKIS.find(r => r.name === 'Maki California');
  const mkb = () => mkGet().build;
  const MK_FILL_IDS = [64, 54, 72];
  const sideBtn = rx => () => sel('button[data-mk-act="press"]') || sel('button[data-mk-act="press2"]') || [...document.querySelectorAll('#mk2-side button')].find(b => b.offsetParent !== null && rx.test(b.textContent));
  add({ seg: 'Makis', title: '🍣 Lección: MAKIS', target: '.kitchen-area-tab-btn[data-area="makis"]', setup() { cust(MKT()); }, text: 'En esta lección armas un maki. Un cliente pide un <b>Maki California</b>: arroz shari, nori, palta, langostino y queso crema, con ajonjolí negro encima. Toca la pestaña <b>MAKIS</b>.', done: () => gameState.activeArea === 'makis', assist: () => switchKitchenArea('makis') });
  add({ seg: 'Makis', info: true, area: 'makis', title: '🥬 Producción de Makis', target: '.kitchen-stage-btn[data-stage="prod"]', text: 'En <b>Producción</b> de Makis se prepara el <b>arroz shari</b> (lavarlo, cocerlo, aliñarlo con zu y abanicarlo), se corta la palta y el queso, se cuece el langostino y se corta el jengibre. Para no hacerte esperar, ya tienes insumos listos.' });
  add({ seg: 'Makis', area: 'makis', title: '🍣 Etapa de armado', target: '.kitchen-stage-btn[data-stage="cook"]', text: 'Entra a la etapa de armado (<b>🍣 Armar</b>): aquí enrollas el maki.', done: () => stg('makis') === 'cook', assist: () => setKitchenStage('cook') });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🎍 La esterilla', target: '#mk2-mat-tool', to: '#mk2-board', text: 'Arrastra la <b>esterilla de bambú</b> hasta la tabla y suéltala.', done: () => mkb().matPlaced, assist: () => mkPlaceMat() });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🍚 El arroz', target: () => tile(38), to: '#mk2-board', text: 'Arrastra el <b>Arroz Shari</b> (despensa de arriba) hasta la esterilla.', done: () => mkb().rice, assist: () => mkDropIngredient(ING(38), document.getElementById('mk2-board')) });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '↔️ Extiende hacia los lados', target: '#mk2-board', text: () => `Con el dedo sobre el arroz haz <b>pasadas cortas hacia los lados</b> (derecha ↔ izquierda), unas 4. Avance: ${Math.round(100 * Math.min(1, mkb().sx))} %.`, done: () => mkb().sx >= 1, assist: () => { for (let k = 0; k < 4; k++) mkSpreadStroke('x'); } });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '↕️ Extiende hacia abajo', target: '#mk2-board', text: () => `Ahora <b>hacia abajo</b>: arrastra el dedo de arriba abajo, sube y repite (unas 4 pasadas). Avance: ${Math.round(100 * Math.min(1, mkb().sy))} %.`, done: () => mkb().sy >= 1, assist: () => { for (let k = 0; k < 4; k++) mkSpreadStroke('y'); } });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🟩 El nori', target: () => tile(20), to: '#mk2-board', text: 'Arrastra el <b>Nori</b> sobre el arroz.', done: () => mkb().nori, assist: () => mkDropIngredient(ING(20), document.getElementById('mk2-board')) });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🥑 Los rellenos', target: () => { const n = MK_FILL_IDS.find(id => !mkb().fills.includes(id)); return n ? tile(n) : null; }, to: '#mk2-board', text: () => `Arrastra al maki los rellenos (en cualquier orden): ${orderNames(MK_FILL_IDS)}. Te marco el que falta.`, done: () => MK_FILL_IDS.every(id => mkb().fills.includes(id)), assist: () => MK_FILL_IDS.forEach(id => mkDropIngredient(ING(id), document.getElementById('mk2-board'))) });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🌀 A enrollar', target: () => sel('button[data-mk-act="roll"]') || [...document.querySelectorAll('#game-container button')].find(b => b.offsetParent !== null && /Enrollar/.test(b.textContent)), text: 'Todo listo para enrollar. Toca <b>🌀 Enrollar</b>: verás el maki de lado.', done: () => mkb().rolling || mkGet().slots.some(Boolean), assist: () => mkStartRoll() });
  [['↑ Enrolla (1 de 3)', 1], ['↑ Enrolla (2 de 3)', 3], ['↑ Enrolla (3 de 3)', 5]].forEach(([t, n]) => {
    add({ seg: 'Makis', area: 'makis', stage: 'cook', title: t, target: '#mk2-main', text: 'Desliza el dedo <b>hacia arriba</b> sobre la esterilla de <b>un solo movimiento</b>, ni muy rápido ni muy lento: intenta que la marca caiga en la <b>zona verde</b> de la barra.', done: () => mkGet().slots.some(Boolean) || (mkb().rolling && mkb().step >= n), assist: () => { if (mkb().rolling) mkRollGesture(0, -120, 120, 150); } });
    add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🤏 Aprieta el rollo', target: sideBtn(/Apretar/), text: 'Después de cada vuelta se <b>aprieta</b>: toca <b>🤏 Apretar</b>.', done: () => mkGet().slots.some(Boolean) || (mkb().rolling && mkb().step >= n + 1), assist: () => { if (mkb().rolling) mkPress(); } });
  });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🍣 Elige tu maki', target: '.mk2-slot:not(.is-empty)', text: 'El maki quedó en la <b>tabla de la izquierda</b> (caben hasta 3). Tócalo para seleccionarlo.', done: () => mkGet().sel >= 0, assist: () => mkSelect(mkGet().slots.findIndex(Boolean)) });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🤏 Un último apretón', target: sideBtn(/Apretar/), text: 'Antes de cortar se aprieta una vez más: toca <b>🤏 Apretar</b>. (Las coberturas de pescado se agregarían aquí; el California no lleva.)', done: () => gameState.makiRoll.pressed2, assist: () => mkPress2() });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🔪 Corta el maki', target: () => sel('#maki-roll-wrap') || sel('#maki-board-zone') || sel('#mk2-main'), text: () => `Desliza el dedo <b>rápido de lado a lado</b> sobre el maki, como un tajo. Haz <b>3 tajos</b> (cada vez saliendo y volviendo a cruzar): sale en 10 piezas. Llevas ${Math.round((gameState.makiRoll.cutProgress || 0) * 3)} de 3.`, done: () => gameState.makiRoll.cutState === 'CUT', assist: async () => { for (let k = 0; k < 8 && gameState.makiRoll.cutState !== 'CUT'; k++) { makiCutSlash(); await sleep(520); } } });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '➡️ A Emplatar', target: '#maki-serve-btn', text: 'Toca <b>➡ A emplatar</b> para mandar el maki cortado al pase.', done: () => stGet('makis').pass.length > 0 || slotItem('makis') >= 0, assist: () => makiServeClick() });
  add({ seg: 'Makis', area: 'makis', title: '🍽️ Emplatar', target: '.kitchen-stage-btn[data-stage="plate"]', text: 'Entra a <b>🍽️ Emplatar</b>.', done: () => stg('makis') === 'plate', assist: () => setKitchenStage('plate') });
  add({ seg: 'Makis', area: 'makis', stage: 'plate', title: '📥 Del pase al plato', target: '.fp-pass-card', text: 'Toca el maki del <b>pase</b> para ponerlo en la tabla de emplatado.', done: () => slotItem('makis') >= 0, assist: () => stPassToSlot('makis', 0) });
  const MK_PLATE = [34, 97, 96];
  add({ seg: 'Makis', area: 'makis', stage: 'plate', title: '🌸 Ajonjolí, jengibre y wasabi', target: () => { const k = slotItem('makis'), sl = k >= 0 ? stGet('makis').slots[k] : null; const n = MK_PLATE.find(id => !sl || !sl.items.includes(id)); return n ? tile(n) : null; }, to: '.plate-bowl:not(.is-empty)', text: () => `Arrastra al plato, <b>en este orden</b>: ${orderNames(MK_PLATE)}. (Los makis con salsa y flameado se terminan también aquí.)`, done: () => { const k = slotItem('makis'); return k >= 0 && MK_PLATE.every(id => stGet('makis').slots[k].items.includes(id)); }, assist: () => { const k = slotItem('makis'); MK_PLATE.forEach(id => stPlateAddItem('makis', k, id)); } });
  add({ seg: 'Makis', area: 'makis', stage: 'plate', title: '✅ ¡Servir!', target: '.plate-bowl:not(.is-empty) .fp-serve', setup() { base.served = served(); }, text: 'Toca <b>✅ Servir</b> para entregar el Maki California.', done: () => served() > base.served, assist: () => stPlateServe('makis', Math.max(0, slotItem('makis'))) });
  add({ seg: 'Makis', info: true, area: 'makis', title: '🎉 ¡Maki servido!', text: () => 'Los makis piden <b>precisión</b>: arroz bien extendido, enrollar en la zona verde, apretar y cortar con tajos limpios.' + rewardLine('makis') });

  // ===== FRITURAS (Chicken Katsu) =====
  const KATSU = () => RECETAS_FRITURAS.find(r => r.name === 'Chicken Katsu');
  const fsn = () => gameState.fryStation;
  const KATSU_PLATE = [57, 52, 62, 30, 84, 74, 91];
  add({ seg: 'Frituras', title: '🍤 Lección: FRITURAS', target: '.kitchen-area-tab-btn[data-area="frituras"]', setup() { cust(KATSU()); }, text: 'En esta lección cocinas una fritura. Un cliente pide un <b>Chicken Katsu</b>: bife de pollo empanizado y frito, con gohan, ensalada, salsa katsu y adornos. Toca la pestaña <b>FRITURAS</b>.', done: () => gameState.activeArea === 'frituras', assist: () => switchKitchenArea('frituras') });
  add({ seg: 'Frituras', area: 'frituras', title: '🥬 Producción: zanahoria', target: '.kitchen-stage-btn[data-stage="prod"]', text: 'Entra a <b>🥬 Producción</b>: vamos a rallar la zanahoria de la ensalada.', done: () => stg('frituras') === 'prod', assist: () => setKitchenStage('prod') });
  add({ seg: 'Frituras', area: 'frituras', stage: 'prod', title: '🧀 La mandolina', target: cardBtn('zanahoria'), text: 'Toca <b>🧀 Rallar</b> en la ficha de la <b>Zanahoria</b>.', done: () => stGet('frituras').board && stGet('frituras').board.key === 'zanahoria', assist: () => stProdStart('frituras', 'zanahoria') });
  add({ seg: 'Frituras', area: 'frituras', stage: 'prod', title: '↗️ Ralla en diagonal', target: '#fr-mando', setup() { base.zan = stGet('frituras').stock.zanahoria; }, text: 'Pasa la zanahoria <b>en diagonal ↗ ↙</b> sobre la mandolina (arrastra el dedo de una punta a la otra y vuelve). <b>4 pasadas = 1 porción</b>; los hilos van cayendo a la pila.', done: () => stGet('frituras').stock.zanahoria > base.zan, assist: async () => { for (let k = 0; k < 6 && stGet('frituras').stock.zanahoria <= base.zan; k++) { frGrateStroke(); await sleep(300); } } });
  add({ seg: 'Frituras', area: 'frituras', title: '🍤 A cocinar', target: '.kitchen-stage-btn[data-stage="cook"]', text: 'Pasa a la etapa <b>🍳 Cocinar</b>.', done: () => stg('frituras') === 'cook', assist: () => setKitchenStage('cook') });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '🍗 El bife a la tabla', target: () => tile(44), to: '#fry-table-card', text: 'Arrastra el <b>Bife de Pollo</b> (despensa de arriba) hasta la <b>tabla de cocina</b>.', done: () => fsn().proteinId === 44, assist: () => dropIn('fry-table-card', 44) });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '🌾 1.º Harina', target: '#fry-slot-0', text: () => `Para empanizar se pasa por <b>3 bandejas en orden</b>. Primero la <b>harina</b>: tócala <b>3 veces</b> (llevas ${fsn().coat >= 1 ? 3 : (fsn().bp || 0)} de 3).`, done: () => fsn().coat >= 1, assist: () => { for (let k = 0; k < 3; k++) if (fsn().coat < 1) fryBreadAdvance(document.getElementById('fry-slot-0')); } });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '🥚 2.º Huevo', target: '#fry-slot-1', text: () => `Ahora el <b>huevo</b>: haz <b>círculos con el dedo</b> sobre la bandeja, 2 vueltas completas (llevas ${fsn().coat >= 2 ? 2 : (fsn().bp || 0)} de 2).`, done: () => fsn().coat >= 2, assist: () => { for (let k = 0; k < 2; k++) if (fsn().coat < 2) fryBreadAdvance(document.getElementById('fry-slot-1')); } });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '🍞 3.º Panko', target: '#fry-slot-2', text: () => `Por último el <b>panko</b>: tócalo <b>3 veces</b> (llevas ${fsn().coat >= 3 ? 3 : (fsn().bp || 0)} de 3).`, done: () => fsn().coat >= 3, assist: () => { for (let k = 0; k < 3; k++) if (fsn().coat < 3) fryBreadAdvance(document.getElementById('fry-slot-2')); } });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '🔥 Enciende el aceite', target: '#fry-fire-btn', text: 'Mientras tanto el aceite debe estar <b>caliente</b>: toca el botón <b>🔥</b> de la olla de aceite.', done: () => fryer().fire, assist: () => { if (!fryer().fire) fryFireToggle(); } });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '⏳ Espera que caliente', target: '#fry-heat-fill', text: () => fryer().temp >= FRY_HOT_TEMP ? '¡Aceite listo!' : 'Espera unos 4 segundos a que la <b>barra de temperatura</b> se llene: con aceite frío sale grasoso.', done: () => fryer().temp >= FRY_HOT_TEMP, assist: async () => { for (let k = 0; k < 60 && fryer().temp < FRY_HOT_TEMP; k++) await sleep(150); } });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '🛢️ A la olla', target: '#fry-table-strip .fry-board-item', to: '#fry-oil-card', text: 'El bife ya está empanizado. <b>Arrástralo desde la tabla hasta la olla de aceite.</b>', done: () => fsn().phase !== 'BUILDING', assist: () => startFryingFromBoard() });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '✋ Retíralo a punto', target: '#fry-action-btn', text: () => `Se está friendo: el contador de la olla pasa de <b>crudo</b> a <b>dorado</b> y luego a <b>quemado</b>. Toca <b>✋ Retirar</b> cuando esté dorado (${(fsn().frySeconds || 0).toFixed(1)} s).`, done: () => fsn().phase === 'FRIED', assist: async () => { for (let k = 0; k < 60 && (fsn().frySeconds || 0) < fryProfile(44).ready + 0.2; k++) await sleep(150); if (fsn().phase === 'FRYING') handleFryActionClick(); } });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '💧 Escurre el aceite', target: '#fry-table-strip .fry-board-item', text: 'Recién frito brilla de aceite. <b>Sacúdelo de arriba abajo</b> (arrastra el dedo ↕ sobre él) hasta que deje de gotear.', done: () => (fsn().drain || 0) >= 1, assist: () => { fsn().drain = 1; renderFryStation(); } });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '🔪 Córtalo en tajos', target: '#fry-table-card', text: () => `La tabla se agrandó. Desliza el dedo <b>rápido de lado a lado</b> sobre el bife: <b>3 tajos</b> (cada vez saliendo y volviendo a cruzar). Llevas ${Math.round((fsn().cutProgress || 0) * 3)} de 3.`, done: () => fsn().cutState === 'CUT', assist: async () => { for (let k = 0; k < 8 && fsn().cutState !== 'CUT'; k++) { fryCutSlash(); await sleep(520); } } });
  add({ seg: 'Frituras', area: 'frituras', stage: 'cook', title: '➡️ A Emplatar', target: '.fry-btn-serve', text: 'Toca <b>➡ A emplatar</b> para mandarlo al pase.', done: () => stGet('frituras').pass.length > 0 || slotItem('frituras') >= 0, assist: () => attemptServeFryStation() });
  add({ seg: 'Frituras', area: 'frituras', title: '🍽️ Emplatar', target: '.kitchen-stage-btn[data-stage="plate"]', text: 'Entra a <b>🍽️ Emplatar</b>.', done: () => stg('frituras') === 'plate', assist: () => setKitchenStage('plate') });
  add({ seg: 'Frituras', area: 'frituras', stage: 'plate', title: '📥 Del pase al plato', target: '.fp-pass-card', text: 'Toca el katsu del <b>pase</b> para ponerlo en el plato.', done: () => slotItem('frituras') >= 0, assist: () => stPassToSlot('frituras', 0) });
  add({ seg: 'Frituras', area: 'frituras', stage: 'plate', title: '🥗 Guarnición y adornos', target: () => { const k = slotItem('frituras'), sl = k >= 0 ? stGet('frituras').slots[k] : null; const n = KATSU_PLATE.find(id => !sl || !sl.items.includes(id)); return n ? tile(n) : null; }, to: '.plate-bowl:not(.is-empty)', text: () => `El katsu va abajo; arriba, de izquierda a derecha: arroz, ensalada de col con mayonesa y zanahoria, y la salsa; decora con rulos y togarashi. Arrastra <b>en este orden</b>: ${orderNames(KATSU_PLATE)}.`, done: () => { const k = slotItem('frituras'); return k >= 0 && KATSU_PLATE.every(id => stGet('frituras').slots[k].items.includes(id)); }, assist: () => { const k = slotItem('frituras'); KATSU_PLATE.forEach(id => stPlateAddItem('frituras', k, id)); } });
  add({ seg: 'Frituras', area: 'frituras', stage: 'plate', title: '✅ ¡Servir!', target: '.plate-bowl:not(.is-empty) .fp-serve', setup() { base.served = served(); }, text: 'Toca <b>✅ Servir</b> para entregar el Chicken Katsu.', done: () => served() > base.served, assist: () => stPlateServe('frituras', Math.max(0, slotItem('frituras'))) });
  add({ seg: 'Frituras', info: true, area: 'frituras', title: '🎉 ¡Katsu servido!', text: () => 'Las frituras piden <b>punto y limpieza</b>: empanizar en orden, aceite caliente, retirar dorado, escurrir y cortar. Con esto ya conoces <b>las 4 áreas</b> de la cocina.' + rewardLine('frituras') });

  // ---- lecciones: cada área es una lección corta con su recompensa en propinas (la primera vez) ----
  const LESSON_OF = { Bienvenida: 'ramen', Ramen: 'ramen', Salteado: 'salteados', Makis: 'makis', Frituras: 'frituras' };
  const LESSONS = {};
  S.forEach(s => { const k = LESSON_OF[s.seg]; (LESSONS[k] = LESSONS[k] || []).push(s); });
  const ORDER = ['ramen', 'salteados', 'makis', 'frituras'];
  const LESSON_INFO = { ramen: { icon: '🍜', name: 'Ramen', dish: 'Ramen Shio', min: '≈ 5 min', note: 'Incluye lo básico: etapas, pedido y cuenco.' }, salteados: { icon: '🥘', name: 'Salteado', dish: 'Chicken Teriyaki', min: '≈ 4 min', note: 'Sartén, aceite y rondas de salteo.' },
    makis: { icon: '🍣', name: 'Makis', dish: 'Maki California', min: '≈ 5 min', note: 'Esterilla, arroz, enrollar y cortar.' }, frituras: { icon: '🍤', name: 'Frituras', dish: 'Chicken Katsu', min: '≈ 5 min', note: 'Empanizado, aceite y corte.' } };
  const REWARD = { ramen: 60, salteados: 80, makis: 100, frituras: 120 };
  const FKEY = 'ramen_tut_areas';
  const flags = () => { try { return JSON.parse(safeStorage.getItem(FKEY) || '{}') || {}; } catch (e) { return {}; } };
  G.flags = flags;
  G.doneCount = () => ORDER.filter(k => flags()[k]).length;
  G.lessonOrder = ORDER;
  function rewardLine(k) { return flags()[k] ? ' <span style="color:#6b5a3a">Ya reclamaste la recompensa de esta lección.</span>' : ' 🎁 Al terminar ganas <b>+' + REWARD[k] + ' 🧧 propinas</b> para comprar tus primeras mejoras.'; }
  steps = LESSONS.ramen;
  G.lesson = 'ramen';
  window.GUIA_STEPS = S;
  G.addSteps = fn => { fn({ add, sleep, ING, nm, tile, sel, stg, dropIn, served, cust, orderNames, base: () => base, setBase: (k, v) => { base[k] = v; } }); steps = S; };

  // ---------------------------------------------------------------- interfaz
  const CSS = `
  #guia { position: fixed; inset: 0; z-index: 9800; pointer-events: none; font-family: 'Fredoka','Nunito',system-ui,sans-serif; }
  #guia * { box-sizing: border-box; }
  .gu-ring { position: fixed; border: 3px solid #ffe066; border-radius: 12px; box-shadow: 0 0 0 3px rgba(255,160,0,0.55), 0 0 18px 4px rgba(255,214,64,0.8); pointer-events: none; animation: guPulse 1s ease-in-out infinite; display: none; z-index: 1; }
  .gu-ring.two { border-style: dashed; border-color: #80d8ff; box-shadow: 0 0 0 3px rgba(0,150,255,0.35), 0 0 16px 3px rgba(128,216,255,0.7); }
  .gu-ring.ok { border-color: #69f0ae; box-shadow: 0 0 22px 6px rgba(105,240,174,0.9); animation: none; }
  @keyframes guPulse { 50% { transform: scale(1.04); opacity: 0.85; } }
  .gu-hand { position: fixed; font-size: 30px; pointer-events: none; animation: guHand 0.9s ease-in-out infinite; display: none; z-index: 3; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.6)); }
  @keyframes guHand { 50% { transform: translateY(-7px); } }
  .gu-drag-svg { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; display: none; }
  #gu-drag-path { animation: guDash 1.2s linear infinite; }
  @keyframes guDash { to { stroke-dashoffset: -24; } }
  .gu-card { position: fixed; width: min(370px, 50vw); max-height: calc(100vh - 16px); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(122, 90, 42, 0.4) transparent; background: #fff8e6; color: #3b2a1a; border: 3px solid #7a5a2a; border-radius: 14px; padding: 8px 10px 8px; pointer-events: auto; box-shadow: 0 6px 20px rgba(0,0,0,0.55); z-index: 4; transition: top 0.22s, left 0.22s; }
  .gu-head { display: flex; justify-content: space-between; font-size: 10px; font-weight: 900; color: #8a6a35; text-transform: uppercase; letter-spacing: 0.4px; }
  .gu-bar { height: 5px; background: #e6d7b0; border-radius: 3px; overflow: hidden; margin: 3px 0 4px; } .gu-bar i { display: block; height: 100%; background: linear-gradient(90deg, #ffb300, #43a047); width: 0; transition: width 0.4s; }
  .gu-title { margin: 0 0 2px; font-size: 14px; color: #7a1f1f; line-height: 1.15; }
  .gu-text { margin: 0; font-size: 12px; line-height: 1.3; font-weight: 600; } .gu-text b { color: #b71c1c; }
  .gu-tip { margin: 4px 0 0; font-size: 11px; color: #00695c; font-weight: 800; display: none; }
  .gu-btns { display: flex; gap: 6px; margin-top: 6px; justify-content: flex-end; align-items: center; }
  .gu-btns button { border: 0; border-radius: 9px; padding: 5px 11px; font: 900 12px inherit; cursor: pointer; font-family: inherit; }
  .gu-ok { background: #43a047; color: #fff; } .gu-skip { background: #e6d7b0; color: #5a3a12; } .gu-exit { background: #b71c1c; color: #fff; } .gu-btns .sp { flex: 1; }
  .gu-ask { display: none; font-size: 12px; font-weight: 800; margin-top: 6px; background: #ffe0e0; border-radius: 8px; padding: 5px 8px; }
  .gu-ask button { margin-left: 6px; }
  @media (max-height: 460px) {
    .gu-card { width: min(340px, 46vw); padding: 6px 9px 6px; max-height: calc(100vh - 10px); }
    .gu-title { font-size: 13px; margin: 0 0 2px; }
    .gu-text { font-size: 11px; line-height: 1.25; }
    .gu-btns { margin-top: 4px; gap: 4px; }
    .gu-btns button { padding: 4px 8px; font-size: 11px; }
  }
  .gu-menuwrap { position: fixed; inset: 0; z-index: 9850; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; padding: 8px; font-family: 'Fredoka','Nunito',system-ui,sans-serif; color: #3b2a1a; box-sizing: border-box; }
  .gu-menubox { width: min(640px, 100%); max-height: calc(100vh - 16px); overflow-y: auto; background: #fff8e6; border: 3px solid #7a5a2a; border-radius: 16px; padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box; }
  .gu-menubox h3 { margin: 0; color: #7a1f1f; font-size: 17px; } .gu-menubox p { margin: 0; font-size: 12px; font-weight: 600; line-height: 1.3; } .gu-menubox p b { color: #b71c1c; }
  .gu-lessons { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px; }
  .gu-lesson { position: relative; background: #f4ead2; border: 2px solid #c9b78a; border-radius: 12px; padding: 6px 8px 18px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; min-height: 92px; }
  .gu-lesson b { font-size: 13.5px; color: #7a1f1f; } .gu-lesson small { font-size: 10px; color: #6b5a3a; font-weight: 700; line-height: 1.15; } .gu-lesson em { font-style: normal; font-size: 10.5px; font-weight: 900; color: #8a6a35; margin-top: auto; }
  .gu-lesson .rw { position: absolute; right: 5px; bottom: 3px; background: #ffe082; color: #5a3a00; border-radius: 8px; padding: 0 6px; font-size: 10px; font-weight: 900; }
  .gu-lesson.next { border-color: #43a047; background: #e8f5e0; box-shadow: 0 0 0 2px rgba(67,160,71,0.35); } .gu-lesson.next em { color: #2e7d32; } .gu-lesson.done { background: #eef3e6; } .gu-lesson.done em { color: #2e7d32; }
  .gu-mbtns { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; } .gu-mb { border: 0; border-radius: 10px; padding: 6px 12px; font: 900 12px inherit; font-family: inherit; cursor: pointer; background: #c9a24a; color: #2b1a08; } .gu-mb.green { background: #43a047; color: #fff; } .gu-mb.gold { background: #ffb300; } .gu-mb.ghost { background: #e6d7b0; }
  body.guia-on #btn-free-menu { display: none !important; }
  `;
  function css() { if (document.getElementById('gu-css')) return; const s = document.createElement('style'); s.id = 'gu-css'; s.textContent = CSS; document.head.appendChild(s); }
  function ui() {
    let el = document.getElementById('guia');
    if (!el) {
      el = document.createElement('div'); el.id = 'guia';
      el.innerHTML = `
        <div class="gu-ring" id="gu-r1"></div>
        <div class="gu-ring two" id="gu-r2"></div>
        <svg id="gu-drag-svg" class="gu-drag-svg">
          <defs>
            <linearGradient id="guLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffd54f"/>
              <stop offset="100%" stop-color="#00e5ff"/>
            </linearGradient>
            <marker id="guArrowHead" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#00e5ff"/>
            </marker>
          </defs>
          <path id="gu-drag-path" stroke="url(#guLineGrad)" stroke-width="3" stroke-dasharray="6 6" fill="none" marker-end="url(#guArrowHead)"/>
        </svg>
        <div class="gu-hand" id="gu-hand">👆</div>
        <div class="gu-card" id="gu-card">
          <div class="gu-head"><span id="gu-seg"></span><span id="gu-n"></span></div>
          <div class="gu-bar"><i id="gu-bar"></i></div>
          <h4 class="gu-title" id="gu-title"></h4>
          <p class="gu-text" id="gu-text"></p>
          <p class="gu-tip" id="gu-tip"></p>
          <div class="gu-btns">
            <button class="gu-exit" onclick="Guia.askExit()" title="Salir del tutorial">✕</button>
            <span class="sp"></span>
            <button class="gu-skip" id="gu-skip" onclick="Guia.skip()">Saltar paso</button>
            <button class="gu-ok" id="gu-ok" onclick="Guia.ok()">Entendido ▶</button>
          </div>
          <div class="gu-ask" id="gu-ask">¿Salir del tutorial? <button class="gu-skip" onclick="Guia.askExit(true)">Seguir</button><button class="gu-exit" onclick="Guia.exit()">Salir</button></div>
        </div>`;
      document.body.appendChild(el);
    }
    return el;
  }
  function resolve(t) {
    if (!t) return null;
    if (typeof t === 'function') { try { t = t(); } catch (e) { return null; } if (!t) return null; }
    if (t instanceof Element) return t;
    if (Array.isArray(t)) { for (const s of t) { const e = resolve(s); if (e) return e; } return null; }
    for (const e of document.querySelectorAll(t)) { const r = e.getBoundingClientRect(); if (r.width > 2 && r.height > 2 && (e.offsetParent !== null || getComputedStyle(e).position === 'fixed')) return e; }
    return null;
  }
  const rectOf = e => { if (!e) return null; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? r : null; };
  function place(ring, r, pad) {
    if (!r) { ring.style.display = 'none'; return; }
    ring.style.display = 'block';
    const vw = window.innerWidth, vh = window.innerHeight;
    const l = Math.max(2, Math.min(vw - 24, r.left - pad));
    const t = Math.max(2, Math.min(vh - 24, r.top - pad));
    const w = Math.max(16, Math.min(vw - l - 2, r.width + pad * 2));
    const h = Math.max(16, Math.min(vh - t - 2, r.height + pad * 2));
    ring.style.left = l + 'px';
    ring.style.top = t + 'px';
    ring.style.width = w + 'px';
    ring.style.height = h + 'px';
  }
  const overlap = (a, b) => { if (!a || !b) return 0; const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0 && h > 0 ? w * h : 0; };
  function placeCard(r1, r2) {
    const card = document.getElementById('gu-card');
    if (!card) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = card.offsetWidth || 340, h = card.offsetHeight || 130;
    const m = 8;

    const topY = Math.max(m, Math.min(vh - h - m, 46));
    const botY = Math.max(m, vh - h - m);
    const midY = Math.max(m, Math.min(vh - h - m, (vh - h) / 2));

    const leftX = m;
    const rightX = Math.max(m, vw - w - m);
    const centerX = Math.max(m, Math.min(vw - w - m, (vw - w) / 2));

    const cands = [
      [rightX, botY],
      [leftX, botY],
      [centerX, botY],
      [rightX, topY],
      [leftX, topY],
      [centerX, topY],
      [rightX, midY],
      [leftX, midY]
    ];

    let best = null;
    for (let k = 0; k < cands.length; k++) {
      const [x, y] = cands[k];
      const c = { left: x, top: y, right: x + w, bottom: y + h };
      const o1 = overlap(c, r1);
      const o2 = overlap(c, r2);

      let cost = o1 * 100 + o2 * 60;

      if (r1) {
        const r1Center = r1.left + r1.width / 2;
        if (r1Center < vw / 2 && x === leftX) cost += 40;
        if (r1Center >= vw / 2 && x === rightX) cost += 40;
        if (r1.top > vh / 2 && y === botY) cost += 50;
        if (r1.bottom < vh / 2 && y === topY) cost += 50;
      }

      if (r1 && r2) {
        const mx = (r1.left + r2.left) / 2;
        const my = (r1.top + r2.top) / 2;
        if (x <= mx && mx <= x + w && y <= my && my <= y + h) {
          cost += 35;
        }
      }

      cost += k * 3;

      if (!best || cost < best.cost) {
        best = { x, y, cost };
      }
    }

    const finalX = Math.max(m, Math.min(vw - w - m, best ? best.x : rightX));
    const finalY = Math.max(m, Math.min(vh - h - m, best ? best.y : botY));
    card.style.left = finalX + 'px';
    card.style.top = finalY + 'px';
  }
  function wrongPlace(s) {
    if (s.area && gameState.activeArea !== s.area) return { t: `.kitchen-area-tab-btn[data-area="${s.area}"]`, msg: `Primero ve a la pestaña <b>${AREA_NAME[s.area]}</b> (arriba).` };
    if (s.area && s.stage && stg(s.area) !== s.stage) return { t: `.kitchen-stage-btn[data-stage="${s.stage}"]`, msg: `Primero entra a la etapa <b>${STAGE_NAME[s.stage]}</b> (botón de arriba).` };
    return null;
  }
  function render() {
    const s = steps[i]; if (!s) return;
    const e = ui(); css(); document.body.classList.add('guia-on');
    document.getElementById('gu-seg').textContent = 'Lección: ' + LESSON_INFO[G.lesson].name;
    document.getElementById('gu-n').textContent = `Paso ${i + 1} de ${steps.length}`;
    document.getElementById('gu-bar').style.width = Math.round(100 * i / steps.length) + '%';
    document.getElementById('gu-title').innerHTML = s.title || '';
    document.getElementById('gu-ok').style.display = s.info ? '' : 'none';
    document.getElementById('gu-ok').textContent = i === steps.length - 1 ? (flags()[G.lesson] ? 'Terminar ▶' : '🧧 Reclamar y terminar ▶') : 'Entendido ▶';
    document.getElementById('gu-skip').style.display = s.info || !s.assist ? 'none' : '';
    document.getElementById('gu-tip').style.display = 'none';
    document.getElementById('gu-ask').style.display = 'none'; exitAsk = false;
    refresh(true);
  }
  function refresh(force) {
    const s = steps[i]; if (!s) return;
    const wp = !s.info ? wrongPlace(s) : null;
    const txt = wp ? wp.msg : (typeof s.text === 'function' ? s.text() : s.text);
    const tEl = document.getElementById('gu-text'); if (tEl.dataset.k !== txt || force) { tEl.innerHTML = txt; tEl.dataset.k = txt; }
    const t1 = resolve(wp ? wp.t : s.target), t2 = wp ? null : resolve(s.to);
    const r1 = rectOf(t1), r2 = rectOf(t2);
    place(document.getElementById('gu-r1'), r1, 5);
    place(document.getElementById('gu-r2'), r2, 5);

    // Conector de trayectoria entre r1 y r2 para acciones de arrastrar
    const dragSvg = document.getElementById('gu-drag-svg');
    const dragPath = document.getElementById('gu-drag-path');
    if (r1 && r2 && !s.info && dragSvg && dragPath) {
      dragSvg.style.display = 'block';
      const x1 = r1.left + r1.width / 2;
      const y1 = r1.top + r1.height / 2;
      const x2 = r2.left + r2.width / 2;
      const y2 = r2.top + r2.height / 2;
      const dx = x2 - x1, dy = y2 - y1;
      const cx = (x1 + x2) / 2 - (dy * 0.15);
      const cy = (y1 + y2) / 2 + (dx * 0.15);
      dragPath.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
    } else if (dragSvg) {
      dragSvg.style.display = 'none';
    }

    // Manita indicadora estrictamente acotada a la pantalla
    const hand = document.getElementById('gu-hand');
    if (r1 && !s.info) {
      hand.style.display = 'block';
      const vw = window.innerWidth, vh = window.innerHeight;
      const handX = Math.max(6, Math.min(vw - 38, r1.left + r1.width / 2 - 14));
      const nearBottom = r1.bottom > vh - 68;
      let handY;
      if (nearBottom) {
        hand.textContent = '👇';
        handY = Math.max(4, r1.top - 28);
      } else {
        hand.textContent = '👆';
        handY = Math.min(vh - 38, Math.max(4, r1.bottom - 6));
      }
      hand.style.left = handX + 'px';
      hand.style.top = handY + 'px';
    } else if (hand) {
      hand.style.display = 'none';
    }

    placeCard(r1, r2);
    const tip = document.getElementById('gu-tip');
    if (!s.info && Date.now() - tEnter > 28000 && s.assist) { tip.textContent = '¿Atascado? Toca «Saltar paso» y lo hago por ti.'; tip.style.display = 'block'; }
  }
  async function enter(k) {
    i = k; advancing = false; tEnter = Date.now();
    if (i >= steps.length) { complete(); return; }
    const s = steps[i];
    try { if (s.setup && !s._did) { s._did = true; await s.setup(); } } catch (e) { console.warn(e); }
    render();
  }
  function tick() {
    if (!G.active || advancing) return;
    const s = steps[i]; if (!s) return;
    if (gameState.isGameOver) return;
    try {
      if (!s.info && s.done && s.done()) { advance(); return; }
    } catch (e) {}
    refresh(false);
  }
  async function advance() {
    if (advancing) return; advancing = true;
    const r = document.getElementById('gu-r1'); if (r) { r.classList.add('ok'); }
    try { playSound('match'); } catch (e) {}
    await sleep(520);
    if (r) r.classList.remove('ok');
    if (!G.active) return;
    enter(i + 1);
  }
  Object.assign(G, {
    steps: () => steps,
    diag() { const s = steps[i]; if (!s) return null; const wp = !s.info ? wrongPlace(s) : null; return { i, title: s.title, wrongPlace: !!wp, target: !!rectOf(resolve(wp ? wp.t : s.target)), hasTarget: !!(s.target || wp), to: s.to ? !!rectOf(resolve(s.to)) : null }; },
    index: () => i,
    ok() { try { playSound('add'); } catch (e) {} const s = steps[i]; if (s && s.info) advance(); },
    async skip() {
      const s = steps[i]; if (!s || advancing) return;
      if (s.info) { advance(); return; }
      try { await s.assist(); } catch (e) { console.warn('assist', e); }
      for (let k = 0; k < 30 && !(s.done && s.done()); k++) await sleep(100);
    },
    askExit(hide) { const a = document.getElementById('gu-ask'); if (a) a.style.display = hide ? 'none' : 'block'; },
    exit() { G.stop(); try { returnToStartMenu(); } catch (e) {} },
    stop() { G.active = false; clearInterval(timer); const e = document.getElementById('guia'); if (e) e.remove(); document.body.classList.remove('guia-on'); },
    start(key) {
      if (G.active) return;
      css();
      G.lesson = LESSONS[key] ? key : 'ramen'; steps = LESSONS[G.lesson];
      S.forEach(s => { delete s._did; });
      base = {}; G.active = true;
      const prev = startSelectedMode; startSelectedMode = 'FREE';
      try { executeStartGame(); } finally { startSelectedMode = prev; }
      setTimeout(() => {
        if (!G.active) return;
        const old = document.querySelector('.station-guide-toast'); if (old) old.remove();
        try { gameState.free.auto = false; } catch (e) {}
        gameState.customerSlots = [null, null, null, null]; try { renderCustomers(); } catch (e) {}
        clearInterval(timer); timer = setInterval(tick, 160);
        enter(0);
      }, 900);
    }
  });
  function complete() {
    const key = G.lesson, f = flags(), first = !f[key], reward = first ? REWARD[key] : 0;
    G.stop();
    f[key] = true;
    try { safeStorage.setItem(FKEY, JSON.stringify(f)); } catch (e) {}
    if (first) { try { addPropinas(REWARD[key]); } catch (e) { console.warn(e); } }
    if (key === 'ramen') { try { safeStorage.setItem('ramen_tutorial_completed', 'true'); } catch (e) {} }      // con la lección de Ramen ya se abren Campaña y Rash
    try { updateStartModesDisplay(); } catch (e) {}
    try { if (typeof japonSyncSoon === 'function') japonSyncSoon(); } catch (e) {}
    try { returnToStartMenu(); } catch (e) {}
    setTimeout(() => showDone(key, first, reward), 450);
  }
  function modal(id, html) {
    css(); const old = document.getElementById(id); if (old) old.remove();
    const el = document.createElement('div'); el.id = id; el.className = 'gu-menuwrap'; el.innerHTML = html; document.body.appendChild(el); return el;
  }
  function showDone(key, first, reward) {
    const nxt = ORDER.find(k => !flags()[k]), info = LESSON_INFO[key], all = G.doneCount() === ORDER.length;
    try { playSound('win'); } catch (e) {}
    modal('gu-done', `<div class="gu-menubox"><h3>${all && first ? '🏆 ¡Tutorial completo!' : '🎉 ¡Lección de ' + info.name + ' completada!'}</h3>
      <p>${first ? '🎁 Recompensa: <b style="color:#b71c1c">+' + reward + ' 🧧 propinas</b>. Ya tienes <b>' + getPropinasWallet() + ' 🧧</b> para comprar mejoras en la tienda.' : 'Repetiste la lección (la recompensa se gana solo la primera vez).'}${key === 'ramen' && first ? ' 🔓 <b>Campaña y Rash desbloqueados.</b>' : ''}</p>
      <div class="gu-mbtns"><button class="gu-mb gold" onclick="document.getElementById('gu-done').remove(); openUpgradesModal()">🧧 Ver mejoras</button>
      ${nxt ? '<button class="gu-mb green" onclick="document.getElementById(\'gu-done\').remove(); Guia.start(\'' + nxt + '\')">Siguiente: ' + LESSON_INFO[nxt].name + ' ▶</button>' : ''}
      <button class="gu-mb" onclick="document.getElementById('gu-done').remove(); Guia.menu()">Elegir lección</button><button class="gu-mb ghost" onclick="document.getElementById('gu-done').remove()">Menú</button></div></div>`);
  }
  G.menu = function () {
    const f = flags(), nxt = ORDER.find(k => !f[k]);
    modal('gu-menu', `<div class="gu-menubox"><h3>🎓 Tutorial por áreas</h3>
      <p>Elige una lección: cocinas <b>1 plato</b> de esa área con ayuda paso a paso. Cada lección es corta y da una <b>recompensa en propinas 🧧</b> la primera vez, para comprar tus primeras mejoras.</p>
      <div class="gu-lessons">${ORDER.map(k => { const n = LESSON_INFO[k]; return '<div class="gu-lesson ' + (f[k] ? 'done' : (k === nxt ? 'next' : '')) + '" onclick="document.getElementById(\'gu-menu\').remove(); Guia.start(\'' + k + '\')"><b>' + n.icon + ' ' + n.name + '</b><small>' + n.dish + ' · ' + n.min + '</small><small>' + n.note + '</small><em>' + (f[k] ? '✓ Completada' : (k === nxt ? '▶ Te recomiendo esta' : 'Pendiente')) + '</em><span class="rw">' + (f[k] ? '🧧 ganada' : '🧧 +' + REWARD[k]) + '</span></div>'; }).join('')}</div>
      <div class="gu-mbtns"><button class="gu-mb ghost" onclick="document.getElementById('gu-menu').remove()">Cerrar</button></div></div>`);
  };
  // entrada desde el menú: quien nunca hizo una lección empieza directo por Ramen; el resto elige la lección
  G.begin = function () { if (G.doneCount() === 0) G.start('ramen'); else G.menu(); };
  G.complete = complete;
})();
