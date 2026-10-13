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
  add({ seg: 'Ramen', area: 'ramen', stage: 'prod', title: '🔪 Cortar poro', target: () => sel('.fp-card .fp-btn[title="Cortar Poro"]'), text: 'Cada ficha es un insumo. Vamos a cortar <b>poro</b> (se usa en el Shio). Toca el botón <b>🔪 Cortar</b> de la ficha «Poro».', done: () => stGet('ramen').board && stGet('ramen').board.key === 'poro', assist: () => stProdStart('ramen', 'poro') });
  add({ seg: 'Ramen', area: 'ramen', stage: 'prod', title: '🔪 Prepara el cuchillo', target: '#shop-knife', to: '#shop-board', text: 'El poro quedó en la tabla de la izquierda. <b>Arrastra el cuchillo</b> (mantén el dedo sobre él y llévalo) hasta la tabla y suéltalo ahí.', done: () => stGet('ramen').knifeArmed || (stGet('ramen').board && stGet('ramen').board.taps > 0), assist: () => { stGet('ramen').knifeArmed = true; stRenderIfOpen('ramen'); } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'prod', title: '⚡ Corta con tajos rápidos', target: '#shop-board', setup() { base.poro = stGet('ramen').stock.poro; }, text: 'Ahora desliza el dedo <b>rápido de lado a lado</b> sobre el poro, como un tajo. Haz <b>3 tajos</b> (cada vez saliendo de la tabla y volviendo a cruzar): 3 cortes = 1 porción nueva de poro.', done: () => stGet('ramen').stock.poro > base.poro, assist: async () => { stGet('ramen').knifeArmed = true; stRenderIfOpen('ramen'); for (let k = 0; k < 8 && stGet('ramen').stock.poro <= base.poro; k++) { shopChop(); await sleep(520); } } });
  add({ seg: 'Ramen', area: 'ramen', stage: 'prod', title: '🍜 A cocinar', target: () => sel('.stage-panel-back'), text: '¡Poro listo! Los demás insumos ya están preparados para que no esperes. Toca <b>🍜 Cocinar</b> (arriba a la derecha) para pasar a la etapa 2.', done: () => stg('ramen') === 'cook', assist: () => setKitchenStage('cook') });
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
  add({ seg: 'Ramen', info: true, area: 'ramen', title: '🎉 ¡Primer plato servido!', text: 'Así se hace un ramen: <b>Producción → Cocinar → Emplatar → Servir</b>. En una partida real los clientes se impacientan, así que conviene tener insumos preparados y varios cuencos en marcha. ¡Ahora el <b>Salteado</b>!' });

  // ===== SALTEADO (Chicken Teriyaki, en sartén) =====
  const TERI = () => RECETAS_SALTEADOS.find(r => r.name === 'Chicken Teriyaki');
  const wk = () => gameState.woks[0];
  const cardBtn = (name, btnSel) => () => { const c = [...document.querySelectorAll('.fp-card')].find(x => x.querySelector('.fp-card-name') && x.querySelector('.fp-card-name').textContent.toLowerCase().includes(name)); return c ? c.querySelector(btnSel || '.fp-btn') : null; };
  const slotItem = a => stGet(a).slots.findIndex(s => s.item);
  add({ seg: 'Salteado', title: '🥘 Ahora, el SALTEADO', target: '.kitchen-area-tab-btn[data-area="salteados"]', setup() { cust(TERI()); }, text: 'Llegó otro cliente: pide un <b>Chicken Teriyaki</b> (pollo con salsa teriyaki, de acompañamiento arroz gohan y ensalada fría). Toca la pestaña <b>SALTEADO</b>.', done: () => gameState.activeArea === 'salteados', assist: () => switchKitchenArea('salteados') });
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
  add({ seg: 'Salteado', info: true, area: 'salteados', title: '🎉 ¡Salteado servido!', text: 'En el Salteado cuenta el <b>ritmo</b>: fuego, aceite, ingredientes en su ronda y 3 lanzamientos por ronda. Cada plato tiene sus propias rondas (el recetario las indica). Ahora los <b>Makis</b>.' });

  // ===== MAKIS (Maki California) =====
  const MKT = () => RECETAS_MAKIS.find(r => r.name === 'Maki California');
  const mkb = () => mkGet().build;
  const MK_FILL_IDS = [64, 54, 72];
  const sideBtn = rx => () => [...document.querySelectorAll('#mk2-side button')].find(b => b.offsetParent !== null && rx.test(b.textContent));
  add({ seg: 'Makis', title: '🍣 Ahora, los MAKIS', target: '.kitchen-area-tab-btn[data-area="makis"]', setup() { cust(MKT()); }, text: 'Un cliente pide un <b>Maki California</b>: arroz shari, nori, palta, langostino y queso crema, con ajonjolí negro encima. Toca la pestaña <b>MAKIS</b>.', done: () => gameState.activeArea === 'makis', assist: () => switchKitchenArea('makis') });
  add({ seg: 'Makis', info: true, area: 'makis', title: '🥬 Producción de Makis', target: '.kitchen-stage-btn[data-stage="prod"]', text: 'En <b>Producción</b> de Makis se prepara el <b>arroz shari</b> (lavarlo, cocerlo, aliñarlo con zu y abanicarlo), se corta la palta y el queso, se cuece el langostino y se corta el jengibre. Para no hacerte esperar, ya tienes insumos listos.' });
  add({ seg: 'Makis', area: 'makis', title: '🍣 Etapa de armado', target: '.kitchen-stage-btn[data-stage="cook"]', text: 'Entra a la etapa de armado (<b>🍣 Armar</b>): aquí enrollas el maki.', done: () => stg('makis') === 'cook', assist: () => setKitchenStage('cook') });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🎍 La esterilla', target: '#mk2-mat-tool', to: '#mk2-board', text: 'Arrastra la <b>esterilla de bambú</b> hasta la tabla y suéltala.', done: () => mkb().matPlaced, assist: () => mkPlaceMat() });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🍚 El arroz', target: () => tile(38), to: '#mk2-board', text: 'Arrastra el <b>Arroz Shari</b> (despensa de arriba) hasta la esterilla.', done: () => mkb().rice, assist: () => mkDropIngredient(ING(38), document.getElementById('mk2-board')) });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '↔️ Extiende hacia los lados', target: '#mk2-board', text: () => `Con el dedo sobre el arroz haz <b>pasadas cortas hacia los lados</b> (derecha ↔ izquierda), unas 4. Avance: ${Math.round(100 * Math.min(1, mkb().sx))} %.`, done: () => mkb().sx >= 1, assist: () => { for (let k = 0; k < 4; k++) mkSpreadStroke('x'); } });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '↕️ Extiende hacia abajo', target: '#mk2-board', text: () => `Ahora <b>hacia abajo</b>: arrastra el dedo de arriba abajo, sube y repite (unas 4 pasadas). Avance: ${Math.round(100 * Math.min(1, mkb().sy))} %.`, done: () => mkb().sy >= 1, assist: () => { for (let k = 0; k < 4; k++) mkSpreadStroke('y'); } });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🟩 El nori', target: () => tile(20), to: '#mk2-board', text: 'Arrastra el <b>Nori</b> sobre el arroz.', done: () => mkb().nori, assist: () => mkDropIngredient(ING(20), document.getElementById('mk2-board')) });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🥑 Los rellenos', target: () => { const n = MK_FILL_IDS.find(id => !mkb().fills.includes(id)); return n ? tile(n) : null; }, to: '#mk2-board', text: () => `Arrastra al maki los rellenos (en cualquier orden): ${orderNames(MK_FILL_IDS)}. Te marco el que falta.`, done: () => MK_FILL_IDS.every(id => mkb().fills.includes(id)), assist: () => MK_FILL_IDS.forEach(id => mkDropIngredient(ING(id), document.getElementById('mk2-board'))) });
  add({ seg: 'Makis', area: 'makis', stage: 'cook', title: '🌀 A enrollar', target: () => [...document.querySelectorAll('#game-container button')].find(b => b.offsetParent !== null && /Enrollar/.test(b.textContent)), text: 'Todo listo para enrollar. Toca <b>🌀 Enrollar</b>: verás el maki de lado.', done: () => mkb().rolling || mkGet().slots.some(Boolean), assist: () => mkStartRoll() });
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
  add({ seg: 'Makis', info: true, area: 'makis', title: '🎉 ¡Maki servido!', text: 'Los makis piden <b>precisión</b>: arroz bien extendido, enrollar en la zona verde, apretar y cortar con tajos limpios. Falta la última área: las <b>Frituras</b>.' });

  // ===== FRITURAS (Chicken Katsu) =====
  const KATSU = () => RECETAS_FRITURAS.find(r => r.name === 'Chicken Katsu');
  const fsn = () => gameState.fryStation;
  const KATSU_PLATE = [57, 52, 62, 30, 84, 74, 91];
  add({ seg: 'Frituras', title: '🍤 Por último, las FRITURAS', target: '.kitchen-area-tab-btn[data-area="frituras"]', setup() { cust(KATSU()); }, text: 'El último cliente pide un <b>Chicken Katsu</b>: bife de pollo empanizado y frito, con gohan, ensalada, salsa katsu y adornos. Toca la pestaña <b>FRITURAS</b>.', done: () => gameState.activeArea === 'frituras', assist: () => switchKitchenArea('frituras') });
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
  add({ seg: 'Final', info: true, title: '🏆 ¡Tutorial completado!', text: 'Ya cocinaste un plato de <b>cada área</b>: Ramen, Salteado, Makis y Frituras. Recuerda el camino: <b>Producción → Cocinar → Emplatar → Servir</b>. Ahora te espera la <b>Campaña</b> (con reloj y clientes reales), el <b>Modo Libre</b> para practicar cualquier plato y el modo <b>Ingredientes</b> para memorizar recetas. ¡Suerte, chef!' });

  steps = S;
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
  .gu-hand { position: fixed; font-size: 30px; pointer-events: none; animation: guHand 0.9s ease-in-out infinite; display: none; z-index: 2; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.6)); }
  @keyframes guHand { 50% { transform: translateY(-9px); } }
  .gu-card { position: fixed; width: min(380px, 52vw); background: #fff8e6; color: #3b2a1a; border: 3px solid #7a5a2a; border-radius: 14px; padding: 8px 10px 8px; pointer-events: auto; box-shadow: 0 6px 18px rgba(0,0,0,0.5); z-index: 3; transition: top 0.25s, left 0.25s; }
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
  @media (max-height: 460px) { .gu-card { width: min(350px, 47vw); padding: 6px 9px 6px; } .gu-title { font-size: 13px; } .gu-text { font-size: 11.5px; line-height: 1.25; } .gu-btns { margin-top: 4px; } .gu-btns button { padding: 4px 10px; } }
  body.guia-on #btn-free-menu { display: none !important; }
  `;
  function css() { if (document.getElementById('gu-css')) return; const s = document.createElement('style'); s.id = 'gu-css'; s.textContent = CSS; document.head.appendChild(s); }
  function ui() {
    let el = document.getElementById('guia');
    if (!el) {
      el = document.createElement('div'); el.id = 'guia';
      el.innerHTML = `<div class="gu-ring" id="gu-r1"></div><div class="gu-ring two" id="gu-r2"></div><div class="gu-hand" id="gu-hand">👆</div>
        <div class="gu-card" id="gu-card"><div class="gu-head"><span id="gu-seg"></span><span id="gu-n"></span></div><div class="gu-bar"><i id="gu-bar"></i></div>
        <h4 class="gu-title" id="gu-title"></h4><p class="gu-text" id="gu-text"></p><p class="gu-tip" id="gu-tip"></p>
        <div class="gu-btns"><button class="gu-exit" onclick="Guia.askExit()" title="Salir del tutorial">✕</button><span class="sp"></span><button class="gu-skip" id="gu-skip" onclick="Guia.skip()">Saltar paso</button><button class="gu-ok" id="gu-ok" onclick="Guia.ok()">Entendido ▶</button></div>
        <div class="gu-ask" id="gu-ask">¿Salir del tutorial? <button class="gu-skip" onclick="Guia.askExit(true)">Seguir</button><button class="gu-exit" onclick="Guia.exit()">Salir</button></div></div>`;
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
  function place(ring, r, pad) { if (!r) { ring.style.display = 'none'; return; } ring.style.display = 'block'; ring.style.left = (r.left - pad) + 'px'; ring.style.top = (r.top - pad) + 'px'; ring.style.width = (r.width + pad * 2) + 'px'; ring.style.height = (r.height + pad * 2) + 'px'; }
  const overlap = (a, b) => { if (!a || !b) return 0; const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0 && h > 0 ? w * h : 0; };
  function placeCard(r1, r2) {
    const card = document.getElementById('gu-card'), vw = innerWidth, vh = innerHeight, w = card.offsetWidth, h = card.offsetHeight, m = 8;
    const topY = 46, botY = vh - h - m;
    const cands = [[(vw - w) / 2, botY], [m, botY], [vw - w - m, botY], [(vw - w) / 2, topY], [m, topY], [vw - w - m, topY]];
    let best = null;
    cands.forEach(([x, y], k) => { const c = { left: x, top: y, right: x + w, bottom: y + h }, o = overlap(c, r1) * 2 + overlap(c, r2) * 1.5 + k * 40; if (!best || o < best.o) best = { x, y, o }; });
    card.style.left = Math.max(m, best.x) + 'px'; card.style.top = Math.max(m, best.y) + 'px';
  }
  function wrongPlace(s) {
    if (s.area && gameState.activeArea !== s.area) return { t: `.kitchen-area-tab-btn[data-area="${s.area}"]`, msg: `Primero ve a la pestaña <b>${AREA_NAME[s.area]}</b> (arriba).` };
    if (s.area && s.stage && stg(s.area) !== s.stage) return { t: `.kitchen-stage-btn[data-stage="${s.stage}"]`, msg: `Primero entra a la etapa <b>${STAGE_NAME[s.stage]}</b> (botón de arriba).` };
    return null;
  }
  function render() {
    const s = steps[i]; if (!s) return;
    const e = ui(); css(); document.body.classList.add('guia-on');
    document.getElementById('gu-seg').textContent = s.seg || '';
    document.getElementById('gu-n').textContent = `Paso ${i + 1} de ${steps.length}`;
    document.getElementById('gu-bar').style.width = Math.round(100 * i / steps.length) + '%';
    document.getElementById('gu-title').innerHTML = s.title || '';
    document.getElementById('gu-ok').style.display = s.info ? '' : 'none';
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
    place(document.getElementById('gu-r1'), r1, 5); place(document.getElementById('gu-r2'), r2, 5);
    const hand = document.getElementById('gu-hand');
    if (r1 && !s.info) { hand.style.display = 'block'; hand.style.left = (r1.left + r1.width / 2 - 14) + 'px'; hand.style.top = (Math.min(innerHeight - 40, r1.bottom - 6)) + 'px'; } else hand.style.display = 'none';
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
    start() {
      if (G.active) return;
      css();
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
    G.stop();
    try { safeStorage.setItem('ramen_tutorial_completed', 'true'); updateStartModesDisplay(); } catch (e) {}
    try { if (typeof japonSyncSoon === 'function') japonSyncSoon(); } catch (e) {}
    try { returnToStartMenu(); } catch (e) {}
    setTimeout(() => { try { playSound('win'); } catch (e) {} const modal = document.getElementById('tutorial-completed-modal'); if (modal) modal.style.display = 'flex'; }, 400);
  }
  G.complete = complete;
})();
