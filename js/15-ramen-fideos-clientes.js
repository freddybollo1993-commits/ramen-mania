/* Módulo 15-ramen-fideos-clientes — Ramen: fideos, botones de cocción, cuencos y clientes.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

function startNoodlesInterval() {
  if (kitchenState.noodles.intervalId) return;
  kitchenState.noodles.intervalId = setInterval(noodleTick, 100);
}

function stopNoodlesInterval() {
  if (kitchenState.noodles.intervalId) {
    clearInterval(kitchenState.noodles.intervalId);
    kitchenState.noodles.intervalId = null;
  }
}

function handleNoodlesBtnClick() {
  if (gameState.isPaused || gameState.isGameOver) return;

  // Bloqueo de estación en Modo Cooperativo
  if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
    if (!MultiplayerManager.requestStationLock('btn-cook-noodles')) return;
  }

  const btn = document.getElementById('btn-cook-noodles');
  const fillEl = document.getElementById('noodles-fill');
  const statusEl = document.getElementById('noodles-status');

  if (kitchenState.noodles.state === 'IDLE') {
    // Iniciar cocción del primer fideo: 4 segundos
    kitchenState.noodles.state = 'COOKING';
    kitchenState.noodles.portionsCooking = 1;
    kitchenState.noodles.totalCookTime = 4.0;
    kitchenState.noodles.cookTimeRemaining = 4.0;
    if (btn) {
      btn.classList.remove('noodle-ready-collect', 'noodle-burnt');
      btn.classList.add('cooking-active');
    }
    if (fillEl) fillEl.style.width = '0%';
    playSound('bubble');
    if (statusEl) statusEl.textContent = 'Cociendo (1x) 4s ⏳';
    startNoodlesInterval();
    updateCookingVisualOverlay();
  } else if (kitchenState.noodles.state === 'COOKING') {
    // Añadir más fideos hasta el máximo de la olla (+1s cada uno)
    if (kitchenState.noodles.portionsCooking < noodleCap()) {
      kitchenState.noodles.portionsCooking += 1;
      kitchenState.noodles.totalCookTime += 1.0;
      kitchenState.noodles.cookTimeRemaining += 1.0;
      playSound('bubble');
      showStationToast(`🍜 +1 Fideo en olla (${kitchenState.noodles.portionsCooking}/${noodleCap()})`);
      updateCookingVisualOverlay();
    } else {
      showStationToast(`⚠️ Olla llena (máximo ${noodleCap()} fideos)`);
    }
  } else if (kitchenState.noodles.state === 'READY') {
    // Recoger los fideos antes de que se quemen
    stopNoodlesInterval();
    const portions = kitchenState.noodles.portionsCooking;
    kitchenState.stocks.noodles += portions;
    playSound('stock_add');
    showStationToast(`🍜 ¡+${portions} Fideos Ramen recogidos! (Total: ${kitchenState.stocks.noodles})`);

    // Liberar estación al recoger
    if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
      MultiplayerManager.releaseStationLock('btn-cook-noodles');
    }

    kitchenState.noodles.state = 'IDLE';
    kitchenState.noodles.portionsCooking = 0;
    kitchenState.noodles.cookTimeRemaining = 0;
    kitchenState.noodles.burnTimeRemaining = 0;
    if (btn) {
      btn.classList.remove('noodle-ready-collect', 'cooking-active');
    }
    if (fillEl) fillEl.style.width = '0%';
    if (statusEl) statusEl.textContent = 'Toca para cocer';
    updateKitchenStationsUI(false, 'noodles', `+${portions} Fideos Ramen recogidos`);
    updateCookingVisualOverlay();
  }
}

function noodleTick() {
  if (gameState.isPaused || gameState.isGameOver) return;

  const btn = document.getElementById('btn-cook-noodles');
  const fillEl = document.getElementById('noodles-fill');
  const statusEl = document.getElementById('noodles-status');

  if (kitchenState.noodles.state === 'COOKING') {
    kitchenState.noodles.cookTimeRemaining -= 0.1;
    const fillPct = Math.min(100, Math.max(0, (1 - kitchenState.noodles.cookTimeRemaining / kitchenState.noodles.totalCookTime) * 100));
    if (fillEl) fillEl.style.width = `${fillPct}%`;

    const secLeft = Math.ceil(Math.max(0, kitchenState.noodles.cookTimeRemaining));
    if (statusEl) {
      statusEl.textContent = `Cociendo (${kitchenState.noodles.portionsCooking}x) ${secLeft}s ⏳`;
    }

    // Actualizar indicador del overlay de cocción
    const noodlesPillText = document.getElementById('vfx-noodles-pill-text');
    if (noodlesPillText) {
      noodlesPillText.textContent = `🍜 Cociendo Fideos Ramen (${kitchenState.noodles.portionsCooking}x) ${secLeft}s...`;
    }

    if (kitchenState.noodles.cookTimeRemaining <= 0) {
      // Fideos listos: ventana de 5s para recoger
      kitchenState.noodles.state = 'READY';
      kitchenState.noodles.burnTimeRemaining = 5.0;
      playSound('ding');
      if (btn) {
        btn.classList.remove('cooking-active');
        btn.classList.add('noodle-ready-collect');
      }
      updateCookingVisualOverlay();
    }
  } else if (kitchenState.noodles.state === 'READY') {
    kitchenState.noodles.burnTimeRemaining -= 0.1;
    if (getUpgradeLevel('aprendiz') > 0 && kitchenState.noodles.burnTimeRemaining <= 3.5) {
      showStationToast('🧑‍🍳 El aprendiz recogió los fideos.');
      handleNoodlesBtnClick();
      return;
    }
    const fillPct = Math.max(0, (kitchenState.noodles.burnTimeRemaining / 5.0) * 100);
    if (fillEl) fillEl.style.width = `${fillPct}%`;

    if (statusEl) {
      statusEl.innerHTML = `⚠️ ¡RECOGER! ${kitchenState.noodles.burnTimeRemaining.toFixed(1)}s`;
    }

    const noodlesPillText = document.getElementById('vfx-noodles-pill-text');
    if (noodlesPillText) {
      noodlesPillText.textContent = `✨ ¡Fideos Listos (${kitchenState.noodles.portionsCooking}x)! ¡RECOGER! ${kitchenState.noodles.burnTimeRemaining.toFixed(1)}s`;
    }

    if (kitchenState.noodles.burnTimeRemaining <= 0) {
      // Se pasaron los 5s: Fideos quemados y pérdida económica
      stopNoodlesInterval();
      kitchenState.noodles.state = 'BURNING';
      const penalty = 10;
      gameState.money = Math.max(0, (gameState.money || 0) - penalty);
      updateHUD();
      playSound('burn');
      showStationToast(`💥 ¡Fideos quemados! Se dañaron (-S/ ${penalty})`);

      if (btn) {
        btn.classList.remove('noodle-ready-collect');
        btn.classList.add('noodle-burnt');
      }
      if (statusEl) statusEl.textContent = `💥 ¡Quemado! (-S/${penalty})`;
      updateCookingVisualOverlay();

      setTimeout(() => {
        if (btn) btn.classList.remove('noodle-burnt');
        kitchenState.noodles.state = 'IDLE';
        kitchenState.noodles.portionsCooking = 0;
        kitchenState.noodles.cookTimeRemaining = 0;
        kitchenState.noodles.burnTimeRemaining = 0;
        if (fillEl) fillEl.style.width = '0%';
        if (statusEl) statusEl.textContent = 'Toca para cocer';
        updateCookingVisualOverlay();
      }, 1300);
    }
  } else {
    stopNoodlesInterval();
    updateCookingVisualOverlay();
  }
}

function initNoodlesLoop() {
  stopNoodlesInterval();
}

function setupShioButton() {
  const btn = document.getElementById('btn-heat-shio');
  if (!btn || btn._hasListeners) return;
  btn._hasListeners = true;
  // con etapas la hornilla del Shio es un interruptor: se enciende y se apaga (no hay que mantener pulsado)
  btn.addEventListener('pointerdown', (e) => {
    if (!stagedOn('ramen')) return;
    e.stopImmediatePropagation();
    if (e.cancelable) e.preventDefault();
    shioToggle();
  }, true);

  let heatInterval = null;

  const startHeating = (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (gameState.isPaused || gameState.isGameOver) return;

    if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
      if (!MultiplayerManager.requestStationLock('btn-heat-shio')) return;
    }

    if (kitchenState.shio.isHeating) return;

    try { if (e && e.pointerId && btn.setPointerCapture) btn.setPointerCapture(e.pointerId); } catch(err) {}

    kitchenState.shio.isHeating = true;
    kitchenState.shio.heatSeconds = 0;
    btn.classList.add('heating-active');
    playSound('flame');
    updateCookingVisualOverlay();

    const fillEl = document.getElementById('shio-fill');
    const statusEl = document.getElementById('shio-status');

    heatInterval = setInterval(() => {
      if (gameState.isPaused || gameState.isGameOver) return;
      kitchenState.shio.heatSeconds += 0.05;
      const pct = Math.min(100, (kitchenState.shio.heatSeconds / 3.0) * 100);
      if (fillEl) fillEl.style.width = `${pct}%`;
      const rem = Math.max(0, 3.0 - kitchenState.shio.heatSeconds).toFixed(1);
      if (statusEl) statusEl.textContent = `Calentando... ${rem}s 🔥`;

      if (kitchenState.shio.heatSeconds >= 3.0) {
        clearInterval(heatInterval);
        heatInterval = null;
        kitchenState.shio.isHeating = false;
        kitchenState.stocks.shio = stockCap();
        btn.classList.remove('heating-active');
        if (fillEl) fillEl.style.width = '100%';
        if (statusEl) statusEl.textContent = `🔥 ¡Caliente! (${stockCap()})`;
        playSound('ding');
        showStationToast(`🥣 ¡Caldo Shio caliente al punto! (${stockCap()} porciones)`);
        updateKitchenStationsUI(false, 'shio', '¡Caldo Shio caliente! (4)');
        updateCookingVisualOverlay();
      }
    }, 50);
  };

  const stopHeating = (e) => {
    try { if (e && e.pointerId && btn.hasPointerCapture && btn.hasPointerCapture(e.pointerId)) btn.releasePointerCapture(e.pointerId); } catch(err) {}
    if (heatInterval) {
      clearInterval(heatInterval);
      heatInterval = null;
    }
    if (kitchenState.shio.isHeating) {
      kitchenState.shio.isHeating = false;
      btn.classList.remove('heating-active');
      const fillEl = document.getElementById('shio-fill');
      const statusEl = document.getElementById('shio-status');
      if (fillEl) fillEl.style.width = '0%';
      if (statusEl) statusEl.textContent = kitchenState.stocks.shio > 0 ? `Listo (${kitchenState.stocks.shio})` : 'Mantén 3s';
      updateCookingVisualOverlay();
      updateKitchenStationsUI();
    }

    if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
      MultiplayerManager.releaseStationLock('btn-heat-shio');
    }
  };

  btn.addEventListener('pointerdown', startHeating);
  btn.addEventListener('pointerup', stopHeating);
  btn.addEventListener('pointerleave', stopHeating);
  btn.addEventListener('pointercancel', stopHeating);
}

function setupTonkotsuButton() {
  const btn = document.getElementById('btn-heat-tonkotsu');
  if (!btn || btn._hasListeners) return;
  btn._hasListeners = true;

  let heatInterval = null;

  const startHeating = (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (gameState.isPaused || gameState.isGameOver) return;

    if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
      if (!MultiplayerManager.requestStationLock('btn-heat-tonkotsu')) return;
    }

    if (kitchenState.tonkotsu.isHeating) return;

    try { if (e && e.pointerId && btn.setPointerCapture) btn.setPointerCapture(e.pointerId); } catch(err) {}

    kitchenState.tonkotsu.isHeating = true;
    kitchenState.tonkotsu.heatSeconds = 0;
    btn.classList.add('heating-active');
    playSound('flame');
    updateCookingVisualOverlay();

    const fillEl = document.getElementById('tonkotsu-fill');
    const statusEl = document.getElementById('tonkotsu-status');

    heatInterval = setInterval(() => {
      if (gameState.isPaused || gameState.isGameOver) return;
      kitchenState.tonkotsu.heatSeconds += 0.05;
      const pct = Math.min(100, (kitchenState.tonkotsu.heatSeconds / 3.0) * 100);
      if (fillEl) fillEl.style.width = `${pct}%`;
      const rem = Math.max(0, 3.0 - kitchenState.tonkotsu.heatSeconds).toFixed(1);
      if (statusEl) statusEl.textContent = `Calentando... ${rem}s 🔥`;

      if (kitchenState.tonkotsu.heatSeconds >= 3.0) {
        clearInterval(heatInterval);
        heatInterval = null;
        kitchenState.tonkotsu.isHeating = false;
        kitchenState.stocks.tonkotsu = stockCap();
        btn.classList.remove('heating-active');
        if (fillEl) fillEl.style.width = '100%';
        if (statusEl) statusEl.textContent = `🔥 ¡Caliente! (${stockCap()})`;
        playSound('ding');
        showStationToast('🫕 ¡Caldo Tonkotsu hirviendo y listo! (4 porciones)');
        updateKitchenStationsUI(false, 'tonkotsu', '¡Caldo Tonkotsu listo! (4)');
        updateCookingVisualOverlay();
      }
    }, 50);
  };

  const stopHeating = (e) => {
    try { if (e && e.pointerId && btn.hasPointerCapture && btn.hasPointerCapture(e.pointerId)) btn.releasePointerCapture(e.pointerId); } catch(err) {}
    if (heatInterval) {
      clearInterval(heatInterval);
      heatInterval = null;
    }
    if (kitchenState.tonkotsu.isHeating) {
      kitchenState.tonkotsu.isHeating = false;
      btn.classList.remove('heating-active');
      const fillEl = document.getElementById('tonkotsu-fill');
      const statusEl = document.getElementById('tonkotsu-status');
      if (fillEl) fillEl.style.width = '0%';
      if (statusEl) statusEl.textContent = kitchenState.stocks.tonkotsu > 0 ? `Listo (${kitchenState.stocks.tonkotsu})` : 'Mantén 3s';
      updateCookingVisualOverlay();
      updateKitchenStationsUI();
    }

    if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
      MultiplayerManager.releaseStationLock('btn-heat-tonkotsu');
    }
  };

  btn.addEventListener('pointerdown', startHeating);
  btn.addEventListener('pointerup', stopHeating);
  btn.addEventListener('pointerleave', stopHeating);
  btn.addEventListener('pointercancel', stopHeating);
}

function setupChasuButton() {
  const btn = document.getElementById('btn-flame-chasu');
  if (!btn || btn._hasListeners) return;
  btn._hasListeners = true;

  let flameInterval = null;

  const startFlaming = (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (gameState.isPaused || gameState.isGameOver) return;

    if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
      if (!MultiplayerManager.requestStationLock('btn-flame-chasu')) return;
    }

    if (kitchenState.chasu.isFlaming) return;

    if (kitchenState.stocks.chasu >= stockCap()) {
      showStationToast(`🥩 ¡Máximo stock de Chasu flameado (${stockCap()}/${stockCap()})!`);
      return;
    }

    try { if (e && e.pointerId && btn.setPointerCapture) btn.setPointerCapture(e.pointerId); } catch(err) {}

    kitchenState.chasu.isFlaming = true;
    kitchenState.chasu.flameSeconds = 0;
    btn.classList.add('flaming-active');
    playSound('flame');
    updateCookingVisualOverlay();

    const fillEl = document.getElementById('chasu-fill');
    const statusEl = document.getElementById('chasu-status');

    flameInterval = setInterval(() => {
      if (gameState.isPaused || gameState.isGameOver) return;
      kitchenState.chasu.flameSeconds += 0.05;

      const subCycle = kitchenState.chasu.flameSeconds % 2.0;
      const pct = Math.min(100, (subCycle / 2.0) * 100);
      if (fillEl) fillEl.style.width = `${pct}%`;

      const rem = Math.max(0, 2.0 - subCycle).toFixed(1);
      if (statusEl) statusEl.textContent = `Flameando... ${rem}s 🔥`;

      if (kitchenState.chasu.flameSeconds >= 2.0) {
        kitchenState.chasu.flameSeconds = 0;
        kitchenState.stocks.chasu = Math.min(stockCap(), kitchenState.stocks.chasu + 1);
        playSound('ding');
        showStationToast(`🥩 +1 Chasu flameado! (${kitchenState.stocks.chasu}/${stockCap()})`);
        updateKitchenStationsUI(false, 'chasu', `+1 Chasu flameado (${kitchenState.stocks.chasu}/${stockCap()})`);

        if (kitchenState.stocks.chasu >= stockCap()) {
          clearInterval(flameInterval);
          flameInterval = null;
          kitchenState.chasu.isFlaming = false;
          btn.classList.remove('flaming-active');
          if (fillEl) fillEl.style.width = '100%';
          if (statusEl) statusEl.textContent = '¡Máximo (4/4)!';
          updateCookingVisualOverlay();
        }
      }
    }, 50);
  };

  const stopFlaming = (e) => {
    try { if (e && e.pointerId && btn.hasPointerCapture && btn.hasPointerCapture(e.pointerId)) btn.releasePointerCapture(e.pointerId); } catch(err) {}
    if (flameInterval) {
      clearInterval(flameInterval);
      flameInterval = null;
    }
    if (kitchenState.chasu.isFlaming) {
      kitchenState.chasu.isFlaming = false;
      btn.classList.remove('flaming-active');
      const fillEl = document.getElementById('chasu-fill');
      const statusEl = document.getElementById('chasu-status');
      if (fillEl) fillEl.style.width = '0%';
      if (statusEl) statusEl.textContent = kitchenState.stocks.chasu >= stockCap() ? `Listo (${stockCap()}/${stockCap()})` : 'Mantén (2s c/u)';
      updateCookingVisualOverlay();
      updateKitchenStationsUI();
    }

    if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
      MultiplayerManager.releaseStationLock('btn-flame-chasu');
    }
  };

  btn.addEventListener('pointerdown', startFlaming);
  btn.addEventListener('pointerup', stopFlaming);
  btn.addEventListener('pointerleave', stopFlaming);
  btn.addEventListener('pointercancel', stopFlaming);
}

function setupKitchenStations() {
  setupShioButton();
  setupTonkotsuButton();
  setupChasuButton();
  initNoodlesLoop();
  updateKitchenStationsUI();
  setupWokStirButtons();
  attachMakiTools();
  attachFryItemDrag();
  attachFryKnifeDrag();
}

function resetCookingStations() {
  stopNoodlesInterval();
  kitchenState.stocks.noodles = 0;
  kitchenState.stocks.shio = 0;
  kitchenState.stocks.tonkotsu = 0;
  kitchenState.stocks.chasu = 0;

  kitchenState.noodles.state = 'IDLE';
  kitchenState.noodles.portionsCooking = 0;
  kitchenState.noodles.cookTimeRemaining = 0;
  kitchenState.noodles.burnTimeRemaining = 0;

  kitchenState.shio.isHeating = false;
  kitchenState.shio.heatSeconds = 0;
  Object.assign(kitchenState.shio, { fire: false, hot: false, heat: 0, reduce: 0 });
  kitchenState.tonkotsu.isHeating = false;
  kitchenState.tonkotsu.heatSeconds = 0;
  kitchenState.chasu.isFlaming = false;
  kitchenState.chasu.flameSeconds = 0;

  const noodlesBtn = document.getElementById('btn-cook-noodles');
  if (noodlesBtn) {
    noodlesBtn.classList.remove('cooking-active', 'noodle-ready-collect', 'noodle-burnt', 'guide-highlight');
  }
  const noodlesFill = document.getElementById('noodles-fill');
  if (noodlesFill) noodlesFill.style.width = '0%';
  const noodlesStatus = document.getElementById('noodles-status');
  if (noodlesStatus) noodlesStatus.textContent = 'Toca para cocer';

  const shioBtn = document.getElementById('btn-heat-shio');
  if (shioBtn) shioBtn.classList.remove('heating-active', 'guide-highlight');
  const shioFill = document.getElementById('shio-fill');
  if (shioFill) shioFill.style.width = '0%';
  const shioStatus = document.getElementById('shio-status');
  if (shioStatus) shioStatus.textContent = 'Mantén 3s';

  const tonkotsuBtn = document.getElementById('btn-heat-tonkotsu');
  if (tonkotsuBtn) tonkotsuBtn.classList.remove('heating-active', 'guide-highlight');
  const tonkotsuFill = document.getElementById('tonkotsu-fill');
  if (tonkotsuFill) tonkotsuFill.style.width = '0%';
  const tonkotsuStatus = document.getElementById('tonkotsu-status');
  if (tonkotsuStatus) tonkotsuStatus.textContent = 'Mantén 3s';

  const chasuBtn = document.getElementById('btn-flame-chasu');
  if (chasuBtn) chasuBtn.classList.remove('flaming-active', 'guide-highlight');
  const chasuFill = document.getElementById('chasu-fill');
  if (chasuFill) chasuFill.style.width = '0%';
  const chasuStatus = document.getElementById('chasu-status');
  if (chasuStatus) chasuStatus.textContent = 'Mantén (2s c/u)';

  updateKitchenStationsUI();
  updateCookingVisualOverlay();
}

function renderBowls() {
  for (let i = 0; i < 3; i++) {
    const bowl = gameState.bowls[i];
    const cardEl = document.getElementById(`bowl-card-${i}`);
    const badgeEl = document.getElementById(`bowl-badge-${i}`);
    const artEl = document.getElementById(`bowl-art-${i}`);
    const tagEl = document.getElementById(`bowl-tag-${i}`);
    if (!cardEl || !bowl) continue;

    const isActive = (gameState.activeBowlIndex === i);
    cardEl.classList.toggle('bowl-locked', i >= bowlLimit());
    if (isActive) {
      cardEl.classList.add("active");
      if (tagEl) tagEl.style.display = "block";
    } else {
      cardEl.classList.remove("active");
      if (tagEl) tagEl.style.display = "none";
    }

    const analysis = analyzeBowl(i);
    if (analysis.status !== 'READY') bowl.readyAt = null;
    else if (bowl.readyAt == null) bowl.readyAt = gameState.gameClock;
    const bowlSig = `${i}_${bowl.ingredients.join(',')}_${analysis.status}_${analysis.recipe ? analysis.recipe.id : ''}_${isActive}_${Math.round((bowl.spread || 0) * 20)}`;
    const looseNoodles = stagedOn('ramen') && bowl.ingredients.includes(1) && (bowl.spread || 0) < 0.8;

    if (artEl && artEl._lastRenderedSig !== bowlSig) {
      artEl.innerHTML = generateBowlSVG(bowl, analysis);
      artEl._lastRenderedSig = bowlSig;
    }

    if (analysis.status === "EMPTY") {
      bowl.matchedRamen = null;
      if (badgeEl && badgeEl._lastText !== "Vacío") {
        badgeEl.textContent = "Vacío";
        badgeEl._lastText = "Vacío";
      }
      cardEl.onclick = () => selectBowl(i);
    } else if (analysis.status === "READY") {
      const staged = stagedOn('ramen');
      bowl.matchedRamen = staged ? null : analysis.recipe;   // con etapas el plato solo se sirve ya emplatado
      const readyText = staged ? (looseNoodles ? '🥢 ¡Mueve los fideos!' : (bowl.orderErrors ? '⚠ Base lista (desordenada): toca para emplatar' : '¡Base lista! Toca para emplatar'))
        : (bowl.orderErrors ? `⚠ ${analysis.recipe.name} (desordenado)` : `¡Listo: ${analysis.recipe.name}!`);
      if (badgeEl && badgeEl._lastText !== readyText) {
        badgeEl.textContent = readyText;
        badgeEl._lastText = readyText;
      }

      cardEl.onclick = () => {
        if (staged) { stPassFromBowl(i); return; }
        if (gameState.activeBowlIndex !== i) {
          selectBowl(i);
        } else {
          // Si ya está activo y listo, buscar cliente para entrega rápida
          for (let cIdx = 0; cIdx < gameState.customerSlots.length; cIdx++) {
            const c = gameState.customerSlots[cIdx];
            if (c) {
              const itemIdx = c.orders.findIndex(o => !o.served && sameDish(o.recipe, analysis.recipe));
              if (itemIdx !== -1) {
                serveRamenToCustomer(cIdx, itemIdx, i);
                return;
              }
            }
          }
        }
      };
    } else {
      bowl.matchedRamen = null;
      let armandoText = `Armando (${bowl.ingredients.length})${bowl.orderErrors ? ' ⚠' : ''}${looseNoodles ? ' 🥢' : ''}`;
      if (getUpgradeLevel('libro') > 0 && analysis.recipe) {
        const nextId = analysis.recipe.ingredients.find(id => !bowl.ingredients.includes(id));
        if (nextId) armandoText += ` · sigue: ${RAMEN_STAGE_NAMES[ramenStage(nextId)]}`;
      }
      if (badgeEl && badgeEl._lastText !== armandoText) {
        badgeEl.textContent = armandoText;
        badgeEl._lastText = armandoText;
      }
      cardEl.onclick = () => selectBowl(i);
    }
  }
  renderPans();
  updateAreaTabAlerts();
}

function shiftCustomersLeft() {
  const active = gameState.customerSlots.filter(s => s !== null);
  const newSlots = [null, null, null, null];
  for (let i = 0; i < active.length; i++) {
    newSlots[i] = active[i];
  }
  gameState.customerSlots = newSlots;
}

function renderCustomers() {
  const container = document.getElementById("customers-container");
  if (!container) return;

  let lowestPatience = 1.1;
  let mostUrgentIndex = -1;
  gameState.customerSlots.forEach((c, index) => {
    if (c && c.orders && c.orders.some(o => !o.served)) {
      const ratio = c.patience / c.maxPatience;
      if (ratio < lowestPatience) {
        lowestPatience = ratio;
        mostUrgentIndex = index;
      }
    }
  });

  const desiredIds = new Set();
  const readyDishes = getReadyDishes();

  gameState.customerSlots.forEach((c, index) => {
    if (!c) return;
    const cardId = `cust-slot-card-${index}`;
    desiredIds.add(cardId);

    const pct = Math.max(0, Math.min(100, (c.patience / c.maxPatience) * 100));
    const isUrgent = (index === mostUrgentIndex && pct <= 40);

    const r = 16;
    const circ = 2 * Math.PI * r; // ≈ 100.53
    const offset = circ * (1 - pct / 100);
    let strokeColor = "#4ade80";
    let glowColor = "rgba(74, 222, 128, 0.4)";
    if (pct < 30) {
      strokeColor = "#ef4444";
      glowColor = "rgba(239, 68, 68, 0.7)";
    } else if (pct < 60) {
      strokeColor = "#facc15";
      glowColor = "rgba(250, 204, 21, 0.5)";
    }

    let card = document.getElementById(cardId);
    const custKey = `${c.name}_${c.spawnTime}`;

    if (!card || card._custKey !== custKey) {
      if (card) card.remove();
      card = document.createElement("div");
      card.id = cardId;
      card._custKey = custKey;
      card.className = `customer-circle-card ${isUrgent ? "urgent" : ""}`;
      card.title = `Toca para entregar ramen o ver detalle de ${c.name}`;

      card.onclick = () => {
        const slot = Number(card.id.replace('cust-slot-card-', ''));
        if (tryServeAnyOrder(slot)) return;
        openCustomerOrderModal(slot);
      };

      card.innerHTML = `
        <div class="cust-portrait-box">
          <svg class="cust-patience-ring-svg ${isUrgent ? 'urgent-ring' : ''}" viewBox="0 0 38 38">
            <circle cx="19" cy="19" r="${r}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3.5" />
            <circle class="cust-patience-circle" cx="19" cy="19" r="${r}" fill="none" stroke="${strokeColor}" stroke-width="3.5"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
              style="filter: drop-shadow(0 0 3px ${glowColor}); transition: stroke-dashoffset 0.3s ease, stroke 0.3s ease;"
              transform="rotate(-90 19 19)" />
          </svg>
          <div class="cust-face-circle">${customerPortraitHtml(c, customerMood(pct / 100, c))}</div>
        </div>
        <div class="cust-info-column">
          <div class="cust-name-label">${c.name}</div>
          <div class="cust-orders-wrap"></div>
        </div>
      `;
      container.appendChild(card);
    } else {
      card.classList.toggle("urgent", isUrgent);
      const ringSvg = card.querySelector(".cust-patience-ring-svg");
      if (ringSvg) ringSvg.classList.toggle("urgent-ring", isUrgent);
      const faceEl = card.querySelector('.cust-face-circle');
      const moodNow = customerMood(pct / 100, c);
      if (faceEl && card._mood !== moodNow) { card._mood = moodNow; faceEl.innerHTML = customerPortraitHtml(c, moodNow); }
      const circleEl = card.querySelector(".cust-patience-circle");
      if (circleEl) {
        circleEl.setAttribute("stroke-dashoffset", offset);
        circleEl.setAttribute("stroke", strokeColor);
        circleEl.style.filter = `drop-shadow(0 0 3px ${glowColor})`;
      }
    }

    const ordersWrap = card.querySelector(".cust-orders-wrap");
    if (ordersWrap) {
      const ordersSig = c.orders.map(o => {
        const rd = findReadyDishFor(o.recipe, readyDishes);
        return `${o.recipe.area}_${o.recipe.id}_${o.served}_${rd ? qualityTier(evaluateDish(rd), c.minScore != null ? c.minScore : 35) : 'x'}`;
      }).join('|');

      if (ordersWrap._lastOrdersSig !== ordersSig) {
        ordersWrap._lastOrdersSig = ordersSig;
        ordersWrap.innerHTML = c.orders.map(o => {
          const rd = findReadyDishFor(o.recipe, readyDishes);
          const icon = AREA_ICONS[o.recipe.area || 'ramen'];
          if (o.served) return `<span class="cust-order-pill" style="background:#2e7d32; color:#fff;">✓ ${o.recipe.name}${o.stars ? ' ' + '⭐'.repeat(o.stars) : ''}</span>`;
          if (rd) return `<span class="cust-order-pill ready-deliver">⚡ ${o.recipe.name} ${starsText(qualityTier(evaluateDish(rd), c.minScore != null ? c.minScore : 35))}</span>`;
          return `<span class="cust-order-pill" title="${AREA_LABELS[o.recipe.area || 'ramen']}">${icon} ${o.recipe.name}</span>`;
        }).join("");
      }
    }
  });

  Array.from(container.children).forEach(child => {
    if (!desiredIds.has(child.id)) {
      child.remove();
    }
  });
}

function openCustomerOrderModal(customerIndex) {
  gameState.selectedCustomerModalIndex = customerIndex;
  const c = gameState.customerSlots[customerIndex];
  if (!c) return;

  document.getElementById("modal-cust-name").textContent = `Pedido de ${c.name} (Asiento ${customerIndex + 1})`;
  const itemsContainer = document.getElementById("modal-cust-items");
  itemsContainer.innerHTML = "";

  c.orders.forEach((orderItem, itemIdx) => {
    const row = document.createElement("div");
    row.style.background = "#fff3e0";
    row.style.border = "1px solid #ffe0b2";
    row.style.borderRadius = "8px";
    row.style.padding = "8px 10px";
    row.style.marginBottom = "8px";
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";

    const readyDish = orderItem.served ? null : findReadyDishFor(orderItem.recipe);
    const canServe = !!readyDish;
    const orderArea = orderItem.recipe.area || 'ramen';

    let actionBtnHtml = "";
    if (orderItem.served) {
      actionBtnHtml = `<span style="font-size:10px; font-weight:900; padding:2px 6px; border-radius:4px; background:#c8e6c9; color:#2e7d32;">✓ Servido</span>`;
    } else if (canServe) {
      actionBtnHtml = `
        <button class="btn" style="background:#2e7d32; color:white; font-size:11px;" onclick="tryServeOrder(${customerIndex}, ${itemIdx})">
          ⚡ Servir (${readyDish.label}) ${starsText(qualityTier(evaluateDish(readyDish), c.minScore != null ? c.minScore : 35))}
        </button>
      `;
    } else if (orderArea !== 'ramen' && gameState.activeArea !== orderArea) {
      actionBtnHtml = `
        <button class="btn" style="background:#ef6c00; color:white; font-size:11px;" onclick="closeCustomerOrderModal(); switchKitchenArea('${orderArea}')">
          ${AREA_ICONS[orderArea]} Ir a ${AREA_LABELS[orderArea]}
        </button>
      `;
    } else {
      actionBtnHtml = `<button class="btn" style="background:#2e7d32; color:white; font-size:11px;" disabled>Preparar</button>`;
    }

    const ingsList = orderItem.recipe.ingredients.map(ingId => {
      const ing = INGREDIENTES.find(i => i.id === ingId);
      const ic = ing.img ? `<img src="${ing.img}" class="pixel-sprite-large" style="width:14px; height:14px; vertical-align:middle; margin-right:2px;">` : ing.icon;
      return `<span class="badge-ing" style="font-size:9px; padding:1px 5px; margin:1px;">${ic} ${ing.display}</span>`;
    }).join("");

    row.innerHTML = `
      <div style="flex: 1; margin-right: 8px;">
        <div style="font-size:13px; font-weight:800; color:#3e2723;">${itemIdx + 1}. ${AREA_ICONS[orderArea]} ${orderItem.recipe.name} (S/ ${orderItem.recipe.price})</div>
        <div style="font-size:10px; color:#5d4037; margin-bottom: 4px;">${orderItem.recipe.desc}</div>
        <div style="display:flex; flex-wrap:wrap; gap:3px;">${ingsList}</div>
      </div>
      <div>${actionBtnHtml}</div>
    `;
    itemsContainer.appendChild(row);
  });

  document.getElementById("customer-order-modal").classList.add("active");
}

function closeCustomerOrderModal() {
  document.getElementById("customer-order-modal").classList.remove("active");
  gameState.selectedCustomerModalIndex = null;
}
