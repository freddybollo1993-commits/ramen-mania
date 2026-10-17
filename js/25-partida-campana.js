/* Módulo 25-partida-campana — Partida: pedidos, reloj, HUD, Campaña y niveles.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// --- Paciencia según la complejidad del plato ---
// La fórmula base cuenta ingredientes; los platos de otras áreas además tienen pasos de proceso
// (salteado, freír, enrollar y cortar) y, en Makis y Frituras, una sola estación de trabajo:
// dos pedidos del mismo cliente en esas áreas se atienden uno tras otro, no en paralelo.
const AREA_PROCESS_SECONDS = { ramen: 0, salteados: 6, makis: 8, frituras: 12 };
const SINGLE_STATION_AREAS = ['makis', 'frituras'];
const SINGLE_STATION_EXTRA_SECONDS = 10;

function getRecipeArea(recipe) {
  return (recipe && recipe.area) || 'ramen';
}

// El ramen sigue siendo la base del menú (40 % de los pedidos); el resto se reparte entre las
// áreas que ya entraron al menú, para que todas las estaciones tengan trabajo.
function pickOrderRecipe(unlocked) {
  const byArea = {};
  unlocked.forEach(r => { (byArea[getRecipeArea(r)] = byArea[getRecipeArea(r)] || []).push(r); });
  const others = Object.keys(byArea).filter(a => a !== 'ramen');
  let area = 'ramen';
  if (!byArea.ramen) area = others[Math.floor(Math.random() * others.length)];
  else if (others.length && Math.random() >= 0.4) area = others[Math.floor(Math.random() * others.length)];
  const pool = byArea[area];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Segundos extra de paciencia por el proceso de los pedidos (0 si todo es Ramen).
function getOrdersProcessSeconds(orders) {
  const perArea = {};
  let total = 0;
  orders.forEach(o => {
    const area = getRecipeArea(o.recipe);
    total += AREA_PROCESS_SECONDS[area] || 0;
    if (stagedOn(area)) total += ST_EXTRA_SECONDS[area] || 0; // producción + emplatado
    perArea[area] = (perArea[area] || 0) + 1;
    if (SINGLE_STATION_AREAS.includes(area) && perArea[area] > 1) total += SINGLE_STATION_EXTRA_SECONDS;
  });
  return total;
}

function spawnCustomer(forced) {
  if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
    if (!MultiplayerManager.isHost) return;
  }
  shiftCustomersLeft();

  const cfg = getCurrentLevelConfig();
  const activeCount = gameState.customerSlots.filter(s => s !== null).length;
  if (activeCount >= (forced ? 4 : cfg.max_customers)) return;
  if (isFree() && !forced && gameState.free.auto === false) return;

  if (gameState.gameMode === 'RASH') {
    if (gameState.rashCustomersSpawned >= cfg.customers) return;
    gameState.rashCustomersSpawned++;
  }

  const emptyIndex = gameState.customerSlots.findIndex(s => s === null);
  if (emptyIndex === -1) return;

  const template = CUSTOMER_TEMPLATES[Math.floor(Math.random() * CUSTOMER_TEMPLATES.length)];
  const unlocked = getUnlockedRecipes();

  const numOrders = forced ? 1 : Math.floor(Math.random() * cfg.max_orders) + 1;
  const orders = [];
  if (isTraining()) {
    // solo lo que aún falta para el reto (así el reto es finito y el tiempo no depende de la suerte)
    orders.push(...trainingPickOrders(cfg));
    if (!orders.length) return;
  } else {
    for (let i = 0; i < numOrders; i++) {
      const r = forced ? forced : (isFree() ? freePickRecipe() : pickOrderRecipe(unlocked));
      orders.push({ recipe: r, served: false });
    }
  }

  let totalPatience = 0;
  const processSeconds = getOrdersProcessSeconds(orders);
  if (gameState.gameMode === 'RASH') {
    const baseP = cfg.base_patience;
    totalPatience = baseP + (orders.length - 1) * 8 + processSeconds;
  } else {
    const totalIngredients = orders.reduce((acc, o) => acc + o.recipe.ingredients.length, 0);
    totalPatience = (25 + totalIngredients * 2.5 + processSeconds) * (cfg.patience_mult || 1);
  }

  totalPatience *= 1 + [0, 0.08, 0.15, 0.25][getUpgradeLevel('te')] + japonBuffSafe('patience');

  gameState.customerSlots[emptyIndex] = {
    name: template.name,
    avatar: template.avatar,
    orders: orders,
    patience: totalPatience,
    maxPatience: totalPatience,
    spawnTime: Date.now(),
    minScore: customerMinScore(template.name)
  };

  renderCustomers();
  renderBowls();
  try { playSound('bell'); } catch (e) {}
  if (gameState.gameMode === 'RASH') {
    updateHUD();
  }

  if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
    if (MultiplayerManager.isHost) {
      MultiplayerManager.syncCustomerQueue(gameState.customerSlots);
    }
  }
}

function gameTick() {
  if (gameState.isPaused || gameState.isGameOver || (typeof TutorialManager !== 'undefined' && TutorialManager.isActive)) return;
  gameState.gameClock++;
  statsAddTime();
  stTick();
  try { if (window.Taller) Taller.tick(); } catch (e) {}      // técnicas activas: enfriamientos y pausa de paciencia

  if (gameState.gameMode === 'NORMAL') {
    gameState.timeLeft--;
    if (gameState.timeLeft <= 0) {
      const cfg = getCurrentLevelConfig();
      if (gameState.money >= cfg.goal) {
        winLevel();
      } else {
        loseLevel();
      }
      return;
    }
  } else if ((gameState.gameMode === 'JAPON' && gameState.japon)) {
    gameState.timeLeft--;
    if (gameState.timeLeft <= 0) { japonEnd('time'); return; }
  } else {
    gameState.elapsedTime++;
  }

  for (let i = 0; i < gameState.customerSlots.length; i++) {
    const c = gameState.customerSlots[i];
    if (c) {
      if (!isFree() && !(window.Taller && Taller.frozen())) c.patience -= 1; // en cocina libre los clientes esperan siempre; la Pausa del Maestro detiene la paciencia
      if (c.patience <= 0) {
        if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP' && !MultiplayerManager.isHost) {
          continue;
        }
        AnalyticsTracker.trackCustomerLost(c);
        playSound('lost');
        triggerAbolladoEffect();
        gameState.customersLost++;
        if (!isFree() && !isTraining()) statsBump('lc'); // solo cuenta donde perder clientes es posible
        gameState.customerSlots[i] = null;
        if (gameState.selectedCustomerModalIndex === i) closeCustomerOrderModal();
        shiftCustomersLeft(); // Mover la fila hacia la izquierda

        if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP' && MultiplayerManager.isHost) {
          MultiplayerManager.syncCustomerQueue(gameState.customerSlots);
        }

        if (gameState.gameMode === 'RASH') {
          gameState.rashLives--;
          if (gameState.rashLives <= 0) {
            loseLevel();
            return;
          }
          const cfg = getCurrentLevelConfig();
          const activeCount = gameState.customerSlots.filter(s => s !== null).length;
          if (gameState.rashCustomersSpawned >= cfg.customers && activeCount === 0) {
            if (gameState.rashLives > 0) {
              winLevel();
              return;
            }
          }
        }
      }
    }
  }

  const cfg = getCurrentLevelConfig();
  gameState.customerSpawnTimer++;
  const targetSpawnTime = (gameState.gameMode === 'RASH') ? (cfg.spawn_time || 3) : (cfg.spawn_time || 4);

  if (gameState.customerSpawnTimer >= targetSpawnTime) {
    if (typeof MultiplayerManager === 'undefined' || !MultiplayerManager.isGameActive || MultiplayerManager.gameMode !== 'COOP' || MultiplayerManager.isHost) {
      spawnCustomer();
    }
    gameState.customerSpawnTimer = 0;
  }

  updateHUD();
  renderCustomers();
  renderBowls();
  updateServeButtonsQuality();
}

function updateHUD() {
  const cfg = getCurrentLevelConfig();
  const badgeEl = document.getElementById("hud-level-badge");
  const modeBtn = document.getElementById("btn-mode-toggle");
  const goalLabel = document.getElementById("hud-goal-label");
  const timerIcon = document.getElementById("hud-timer-icon");

  const moneyEl = document.getElementById("hud-money");
  if (moneyEl) moneyEl.textContent = gameState.money;
  const titleEl = document.getElementById("hud-title");
  if (titleEl) titleEl.textContent = gameState.gameMode === 'NORMAL' ? '🏮 ' + cfg.name.replace(/Nivel \d+:\s*/, '') : '🍜 RAMEN MANIA';
  const tEl0 = document.getElementById("hud-timer");
  if (tEl0 && gameState.gameMode !== 'NORMAL') tEl0.classList.remove('urgent', 'crisis');

  const servedEl = document.getElementById("hud-served");
  if (servedEl) servedEl.textContent = gameState.customersServed;

  if (gameState.gameMode === 'NORMAL') {
    if (badgeEl) badgeEl.textContent = `LVL ${cfg.level}`;
    if (modeBtn) {
      modeBtn.innerHTML = '<span class="hud-icon">🏮</span><span class="btn-text">Normal</span>';
      modeBtn.style.background = "linear-gradient(180deg, #ff9800, #e65100)";
    }
    if (goalLabel) goalLabel.textContent = "Meta:";
    const goalEl = document.getElementById("hud-goal");
    const th = getLevelStarThresholds(cfg);
    const curStars = calculateLevelStars(cfg, gameState.money, gameState.customersLost);
    const pos = v => (100 * v / th.star3).toFixed(1), fill = Math.min(100, 100 * gameState.money / th.star3).toFixed(1);
    if (goalEl) goalEl.innerHTML = `<span class="gm" title="⭐ S/${th.star1} · ⭐⭐ S/${th.star2} · ⭐⭐⭐ S/${th.star3}"><span class="gm-bar"><i style="width:${fill}%"></i>`
      + [[th.star1, 1], [th.star2, 2], [th.star3, 3]].map(([v, k]) => `<b class="gm-k ${curStars >= k ? 'on' : ''}" style="left:${pos(v)}%">★</b>`).join('') + `</span><span class="gm-t">S/${cfg.goal}</span></span>`;
    if (timerIcon) timerIcon.textContent = "⏱️";
    const timerEl = document.getElementById("hud-timer");
    if (timerEl) {
      timerEl.textContent = `${gameState.timeLeft}s`;
      timerEl.style.color = (gameState.money >= cfg.goal) ? '#81c784' : '';
      const apuro = gameState.money < cfg.goal;
      timerEl.classList.toggle('urgent', apuro && gameState.timeLeft <= 20);
      timerEl.classList.toggle('crisis', apuro && gameState.timeLeft <= 10);
    }
  } else if ((gameState.gameMode === 'JAPON' && gameState.japon)) {
    if (badgeEl) badgeEl.textContent = '🗾 ' + gameState.japon.cityName;
    if (modeBtn) {
      modeBtn.innerHTML = '<span class="hud-icon">🏮</span><span class="btn-text">Local</span>';
      modeBtn.style.background = "linear-gradient(180deg, #d32f2f, #7a1f1f)";
    }
    if (goalLabel) goalLabel.textContent = "Caja:";
    const goalEl = document.getElementById("hud-goal");
    if (goalEl) goalEl.textContent = `S/${gameState.money}`;
    if (timerIcon) timerIcon.textContent = "⏱️";
    const timerEl = document.getElementById("hud-timer");
    if (timerEl) timerEl.textContent = `${gameState.timeLeft}s`;
  } else if (gameState.gameMode === 'FREE' && gameState.free) {
    if (badgeEl) badgeEl.textContent = 'LIBRE';
    if (modeBtn) {
      modeBtn.innerHTML = '<span class="hud-icon">🌿</span><span class="btn-text">Libre</span>';
      modeBtn.style.background = "linear-gradient(180deg, #66bb6a, #2e7d32)";
    }
    if (goalLabel) goalLabel.textContent = "Servidos:";
    const goalEl = document.getElementById("hud-goal");
    if (goalEl) goalEl.textContent = gameState.customersServed;
    if (timerIcon) timerIcon.textContent = "🌿";
    const timerEl = document.getElementById("hud-timer");
    if (timerEl) timerEl.textContent = "Sin prisa";
  } else if (gameState.gameMode === 'TRAINING' && gameState.training) {
    if (badgeEl) badgeEl.textContent = `RETO ${gameState.training.challenge.num}`;
    if (modeBtn) {
      modeBtn.innerHTML = '<span class="hud-icon">🏋️</span><span class="btn-text">Entreno</span>';
      modeBtn.style.background = "linear-gradient(180deg, #26a69a, #00695c)";
    }
    if (goalLabel) goalLabel.textContent = "Reto:";
    const goalEl = document.getElementById("hud-goal");
    if (goalEl) goalEl.textContent = `${trainingDoneInRun()}/${trainingTotalCount()}`;
    if (timerIcon) timerIcon.textContent = "⏱️";
    const timerEl = document.getElementById("hud-timer");
    if (timerEl) timerEl.textContent = formatTrainingTime(gameState.gameClock); // el reloj SUBE: mide tu tiempo
  } else {
    if (badgeEl) badgeEl.textContent = `RASH R${cfg.level}`;
    if (modeBtn) {
      modeBtn.innerHTML = '<span class="hud-icon">⚡</span><span class="btn-text">Rash</span>';
      modeBtn.style.background = "linear-gradient(180deg, #e65100, #bf360c)";
    }
    if (goalLabel) goalLabel.textContent = "Ronda:";
    const goalEl = document.getElementById("hud-goal");
    if (goalEl) goalEl.textContent = `${gameState.rashCustomersServed}/${cfg.customers}`;
    if (timerIcon) timerIcon.textContent = "❤️";
    const timerEl = document.getElementById("hud-timer");
    if (timerEl) timerEl.textContent = `${gameState.rashLives}/${gameState.rashMaxLives || 5}`;
  }
}

// Los récords se envían con la sesión de la cuenta: el servidor toma el nombre de la cuenta y rechaza valores imposibles.
async function submitRecordToServer(rec) {
  if (rec.game_mode !== 'NORMAL' && rec.game_mode !== 'RASH') return { ok: false, error: 'modo_invalido' };
  try {
    const d = await cloudCall('submit_record', { p_mode: rec.game_mode, p_money: rec.score_money, p_served: rec.customers_served,
      p_level: rec.level_reached, p_duration: AnalyticsTracker.lastDuration || null });
    return d || { ok: false, error: 'sin_respuesta' };
  } catch (e) {
    return { ok: false, error: 'offline' };
  }
}

// REGISTRO AUTOMÁTICO DE PUNTUACIÓN EN CADA PARTICIPACIÓN (SEA CUAL SEA EL RESULTADO)
async function recordGameScoreAutomatically(outcome = 'COMPLETED') {
  const p = DeviceManager.currentPlayer;
  const playerName = (p && p.playerName) ? p.playerName : (safeStorage.getItem('ramen_player_name') || 'Chef Anónimo');
  const contact = (p && p.contact) ? p.contact : (safeStorage.getItem('ramen_player_contact') || null);

  const levelReached = gameState.gameMode === 'NORMAL' ? (currentLevelIndex + 1) : gameState.rashLevel;
  const newRecord = {
    player_name: playerName,
    contact: contact || null,
    device_id: DeviceManager.deviceId,
    score_money: gameState.money || 0,
    customers_served: gameState.customersServed || 0,
    level_reached: levelReached,
    game_mode: gameState.gameMode,
    created_at: new Date().toISOString()
  };

  // 1. Guardar copia local de respaldo
  saveLocalScore(newRecord);

  // 2. Transmisión automática en tiempo real a Supabase
  const sent = await submitRecordToServer(newRecord);
  if (!sent.ok) console.warn("Récord no enviado al ranking:", sent.error);

  // 3. Notificación visual en el modal de fin de nivel
  const noticeEl = document.getElementById("end-auto-ranking-notice");
  if (noticeEl) {
    noticeEl.innerHTML = `✅ <strong>Récord registrado automáticamente:</strong> <em>Chef ${escapeHtml(playerName)}</em> • S/ ${newRecord.score_money} • ${newRecord.customers_served} atendidos`;
    noticeEl.style.display = "block";
  }
}


function renderEndStarsHtml(stars) {
  if (stars === 3) {
    return '<div class="level-stars-display" style="font-size:34px; line-height:1; margin:6px 0; color:#ffb300; text-shadow:0 0 10px rgba(255,179,0,0.8);">⭐⭐⭐</div>';
  }
  if (stars === 2) {
    return '<div class="level-stars-display" style="font-size:34px; line-height:1; margin:6px 0; color:#ffb300;">⭐⭐<span style="opacity:0.25;">★</span></div>';
  }
  return '<div class="level-stars-display" style="font-size:34px; line-height:1; margin:6px 0; color:#ffb300;">⭐<span style="opacity:0.25;">★★</span></div>';
}

function replayCurrentLevel() {
  document.getElementById("level-end-modal").classList.remove("active");
  startLevel(currentLevelIndex);
}

function openCampaignModalFromEnd() {
  document.getElementById("level-end-modal").classList.remove("active");
  returnToStartMenu();
  openCampaignModal();
}

let campaignFilterArc = 'all';

function openCampaignModal(filterArc) {
  // Campaña 2.0: el mapa ilustrado (campana-mapa.js) sustituye a la lista; el modal de abajo queda solo como respaldo si ese archivo no cargó
  if (window.CampMapa) { loadAccountProgressLocal(); CampMapa.open(filterArc); return; }
  if (filterArc) campaignFilterArc = filterArc;
  loadAccountProgressLocal();
  renderCampaignModal();
  const m = document.getElementById('campaign-modal');
  if (m) {
    m.style.display = '';
    m.classList.add('active');
  }
}

function closeCampaignModal() {
  const m = document.getElementById('campaign-modal');
  if (m) m.classList.remove('active');
}

const CAMPAIGN_ARCS = [
  { id: 'ramen', icon: '🍜', name: 'Fundamentos de Ramen', levels: [1, 2, 3, 4], areas: '🍜' },
  { id: 'salteado', icon: '🍳', name: 'El Fuego del Wok', levels: [5, 6, 7, 8], areas: '🍜 🍳' },
  { id: 'makis', icon: '🍣', name: 'Barra de Makis Nikkei', levels: [9, 10, 11, 12], areas: '🍜 🍳 🍣' },
  { id: 'frituras', icon: '🍤', name: 'El Aceite Dorado', levels: [13, 14, 15, 16], areas: '🍜 🍳 🍣 🍤' },
  { id: 'maestria', icon: '🏆', name: 'Restaurante Insignia', levels: [17, 18, 19, 20], areas: '⭐ Las 4 Áreas' }
];

function setCampaignArcFilter(arcId) {
  campaignFilterArc = arcId;
  renderCampaignModal();
}

function playCampaignLevel(lvlIndex) {
  const go = () => {
    closeCampaignModal(); if (window.CampMapa) CampMapa.close();
    setStartSelectedMode('NORMAL');
    executeStartGame();
    startLevel(lvlIndex);
  };
  // primera vez en un nivel que presenta algo nuevo: el Maestro lo explica antes de empezar (campana-mapa.js)
  if (window.CampMapa && CampMapa.needsBrief(NIVELES[lvlIndex])) { CampMapa.brief(NIVELES[lvlIndex], go); return; }
  go();
}

function renderCampaignModal() {
  const body = document.getElementById('camp-modal-body');
  if (!body) return;
  const prog = loadCampaignProgress();
  const unlockedLvl = prog.unlockedLevel || 1;
  const totalStars = getCampaignTotalStars();
  const totalLevels = NIVELES.length;
  const maxPossibleStars = totalLevels * 3;
  const completedCount = Object.values(prog.levels || {}).filter(l => (l.stars || 0) >= 1).length;

  const nextLvlIndex = Math.min(totalLevels - 1, unlockedLvl - 1);
  const nextCfg = NIVELES[nextLvlIndex];

  const filterTabs = [
    { id: 'all', label: `⭐ Todos (${totalLevels})` },
    ...CAMPAIGN_ARCS.map(arc => ({ id: arc.id, label: `${arc.icon} ${arc.name}` }))
  ].map(tab => {
    const active = campaignFilterArc === tab.id ? 'active' : '';
    return `<button class="camp-filter-btn ${active}" onclick="setCampaignArcFilter('${tab.id}')">${tab.label}</button>`;
  }).join('');

  const activeArcs = CAMPAIGN_ARCS.filter(a => campaignFilterArc === 'all' || a.id === campaignFilterArc);

  const arcsHtml = activeArcs.map(arc => {
    const arcLevels = NIVELES.filter(lvl => arc.levels.includes(lvl.level));
    const arcCards = arcLevels.map(cfg => {
      const idx = cfg.level - 1;
      const lvlData = (prog.levels && prog.levels[String(cfg.level)]) || null;
      const isUnlocked = cfg.level <= unlockedLvl;
      const stars = lvlData ? lvlData.stars : 0;
      const isNext = cfg.level === unlockedLvl && stars === 0;

      let starsDisplay = '';
      if (!isUnlocked) {
        starsDisplay = '<span style="color:#90a4ae;">🔒 Bloqueado</span>';
      } else if (stars === 3) {
        starsDisplay = '<span class="camp-stars" title="3 Estrellas: Perfección">⭐⭐⭐</span>';
      } else if (stars === 2) {
        starsDisplay = '<span class="camp-stars" title="2 Estrellas: Buen Servicio">⭐⭐<span style="opacity:0.35;">★</span></span>';
      } else if (stars === 1) {
        starsDisplay = '<span class="camp-stars" title="1 Estrella: Superado">⭐<span style="opacity:0.35;">★★</span></span>';
      } else {
        starsDisplay = '<span style="color:#e65100; font-weight:800; font-size:11px;">▶ Nuevo</span>';
      }

      const bestText = lvlData && lvlData.bestMoney ? `Récord: S/ ${lvlData.bestMoney}` : `Meta: S/ ${cfg.goal}`;
      const stateClass = !isUnlocked ? 'locked' : (stars > 0 ? 'done' : 'open');

      return `
        <button class="camp-card ${stateClass} ${isNext ? 'next' : ''}" ${isUnlocked ? '' : 'disabled'} onclick="playCampaignLevel(${idx})">
          <span class="camp-num">${cfg.level}</span>
          <span class="camp-areas-tag">${arc.areas}</span>
          <span class="camp-title">${cfg.name.replace(/Nivel \d+:\s*/, '')}</span>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
            <div>${starsDisplay}</div>
            <div class="camp-meta">${bestText}</div>
          </div>
        </button>
      `;
    }).join('');

    return `
      <div class="camp-arc-section">
        <div class="camp-arc-head">
          <span>${arc.icon} ${arc.name} (Niveles ${arc.levels[0]}–${arc.levels[arc.levels.length - 1]})</span>
          <span style="font-size:11px; color:#6d4c41;">${arc.areas}</span>
        </div>
        <div class="camp-grid">${arcCards}</div>
      </div>
    `;
  }).join('');

  body.innerHTML = `
    <div class="camp-summary">
      <div class="camp-sumline">
        <b>Progreso de Campaña: ${completedCount}/${totalLevels} Niveles</b>
        <span>⭐ <b>${totalStars}/${maxPossibleStars}</b> Estrellas</span>
        <span>🧧 Saldo: ${getPropinasWallet()}</span>
      </div>
      <div class="camp-bar"><i style="width:${Math.round(100 * totalStars / maxPossibleStars)}%"></i></div>
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-top:2px;">
        <span style="font-size:10.5px; color:#5d4037;">Repite cualquier nivel para mejorar tus estrellas (⭐ S/ goal · ⭐⭐ +20% · ⭐⭐⭐ +35%).</span>
        <button class="acc-btn" style="padding:4px 12px; font-size:11px;" onclick="playCampaignLevel(${nextLvlIndex})">
          ▶ Continuar Nivel ${nextCfg.level}: ${nextCfg.name.replace(/Nivel \d+:\s*/, '')}
        </button>
      </div>
    </div>
    <div class="camp-filter-bar">${filterTabs}</div>
    ${arcsHtml}
  `;
}

function winLevel() {
  gameState.isGameOver = true;
  clearInterval(gameLoopInterval);
  resetCookingStations();
  AnalyticsTracker.endSession('WON');
  recordGameScoreAutomatically('WON');

  const modal = document.getElementById("level-end-modal");
  const title = document.getElementById("end-title");
  const desc = document.getElementById("end-desc");
  const btn = document.getElementById("btn-next-level");

  document.getElementById("end-money").textContent = `S/ ${gameState.money}`;
  document.getElementById("end-served").textContent = gameState.customersServed;
  document.getElementById("end-lost").textContent = gameState.customersLost;
  const endTips = document.getElementById("end-tips");
  if (endTips) endTips.textContent = `🧧 ${gameState.propinasSession}`;

  const btnReplay = document.getElementById("btn-replay-level");
  const btnMap = document.getElementById("btn-campaign-map");

  if (gameState.gameMode === 'NORMAL') {
    if (btnReplay) btnReplay.style.display = '';
    if (btnMap) btnMap.style.display = '';

    const lvlNum = currentLevelIndex + 1;
    const cfg = NIVELES[currentLevelIndex];
    const rec = recordCampaignLevelVictory(lvlNum, gameState.money, gameState.customersServed, gameState.customersLost, gameState.propinasSession);
    const th = getLevelStarThresholds(cfg);

    const bonusTips = rec.stars > rec.prevStars ? (rec.stars - rec.prevStars) * 10 : 0;
    if (bonusTips > 0) addPropinas(bonusTips);

    const starsHtml = renderEndStarsHtml(rec.stars);
    const starDesc = rec.stars === 3
      ? '⭐⭐⭐ ¡PUNTUACIÓN MÁXIMA DE 3 ESTRELLAS! Servicio impecable.'
      : (rec.stars === 2 ? '⭐⭐ ¡Muy buen servicio! 2 Estrellas conseguidas.' : '⭐ Nivel superado a medias (1 Estrella). ¡Repite el nivel para alcanzar las 3 estrellas!');

    title.textContent = `🎉 ¡${cfg.name} Superado!`;
    desc.innerHTML = `
      ${starsHtml}
      <div style="font-size:12.5px; font-weight:800; color:#3e2723; margin:4px 0;">${starDesc}</div>
      <div style="font-size:11px; color:#5d4037;">Meta base: S/ ${th.star1} · 2★: S/ ${th.star2} · 3★: S/ ${th.star3}</div>
      ${bonusTips > 0 ? `<div style="font-size:11.5px; font-weight:900; color:#e65100; margin-top:4px;">🧧 +${bonusTips} propinas conseguidas por tus nuevas estrellas</div>` : ''}
      ${(() => { try { const rl = trainingOfLevel(lvlNum); if (!rl.length) return ''; const dn = rl.filter(c => (trainingProgressOf(c.id) || {}).m > 0).length; return `<div style="font-size:12px; font-weight:900; color:#00695c; margin-top:5px;">🎫 ${rec.prevStars === 0 ? '¡Se abrieron ' + rl.length + ' reto' + (rl.length > 1 ? 's' : '') + ' de este nivel!' : 'Retos de este nivel: ' + dn + '/' + rl.length}</div><button class="acc-btn alt" style="margin-top:4px;" onclick="openLevelRetos(${lvlNum})">🎫 Ver retos del nivel</button>`; } catch (e) { return ''; } })()}
    `;
    title.style.color = "#2e7d32";

    if (currentLevelIndex < NIVELES.length - 1) {
      btn.textContent = `▶️ Siguiente Nivel (${currentLevelIndex + 2})`;
      btn.style.display = '';
    } else {
      btn.textContent = "🏆 ¡Completaste toda la Campaña!";
      btn.style.display = '';
    }
  } else {
    if (btnReplay) btnReplay.style.display = 'none';
    if (btnMap) btnMap.style.display = 'none';
    const curLvl = gameState.rashLevel;
    saveRashProgress(curLvl + 1);

    if (curLvl < 100) {
      title.textContent = `⚡ ¡Ronda ${curLvl} Superada!`;
      desc.textContent = `¡Completaste los ${getCurrentLevelConfig().customers} clientes manteniendo ${gameState.rashLives} vida(s)! Siguiente ronda: +4 clientes y menor paciencia.`;
      title.style.color = "#ff9800";
      btn.textContent = `▶️ Iniciar Ronda ${curLvl + 1}`;
    } else {
      title.textContent = "🏆 ¡LEYENDA SUPREMA DEL MODO RASH: NIVEL 100!";
      desc.textContent = "¡Increíble hazaña! Has sobrevivido a las 100 rondas del Modo Rash con la máxima velocidad culinaria.";
      title.style.color = "var(--ramen-gold)";
      btn.textContent = "🔄 Reiniciar Modo Rash";
    }
  }
  modal.classList.add("active");
}

function loseLevel() {
  gameState.isGameOver = true;
  clearInterval(gameLoopInterval);
  resetCookingStations();
  AnalyticsTracker.endSession('LOST');
  recordGameScoreAutomatically('LOST');

  const modal = document.getElementById("level-end-modal");
  const title = document.getElementById("end-title");
  const desc = document.getElementById("end-desc");
  const btn = document.getElementById("btn-next-level");

  document.getElementById("end-money").textContent = `S/ ${gameState.money}`;
  document.getElementById("end-served").textContent = gameState.customersServed;
  document.getElementById("end-lost").textContent = gameState.customersLost;
  const endTips = document.getElementById("end-tips");
  if (endTips) endTips.textContent = `🧧 ${gameState.propinasSession}`;

  const btnReplay = document.getElementById("btn-replay-level");
  const btnMap = document.getElementById("btn-campaign-map");

  if (gameState.gameMode === 'NORMAL') {
    if (btnReplay) btnReplay.style.display = 'none';
    if (btnMap) btnMap.style.display = '';

    const cfg = getCurrentLevelConfig();
    title.textContent = "⏱️ Tiempo Agotado";
    desc.innerHTML = `No lograste la meta básica de <b>S/ ${cfg.goal}</b>.<br><span style="font-size:11px; color:#5d4037;">Recaudaste S/ ${gameState.money}. ¡Repite el nivel para afinar tu ritmo de comanda!</span>`;
    title.style.color = "#c62828";
    btn.textContent = "🔄 Reintentar Nivel";
  } else {
    if (btnReplay) btnReplay.style.display = 'none';
    if (btnMap) btnMap.style.display = 'none';
    title.textContent = "💔 Ronda Fallida";
    desc.textContent = `Se agotaron tus vidas en la Ronda ${gameState.rashLevel}. ¡Guarda tu récord para el ranking!`;
    title.style.color = "#c62828";
    btn.textContent = `🔄 Reintentar Ronda ${gameState.rashLevel}`;
  }
  modal.classList.add("active");
}

function handleNextLevelButton() {
  document.getElementById("level-end-modal").classList.remove("active");

  if (gameState.gameMode === 'NORMAL') {
    const cfg = getCurrentLevelConfig();
    if (gameState.money >= cfg.goal) {
      if (currentLevelIndex < NIVELES.length - 1) {
        currentLevelIndex++;
      } else {
        currentLevelIndex = 0;
      }
    }
    startLevel(currentLevelIndex);
  } else {
    if (gameState.rashLives > 0) {
      if (gameState.rashLevel < 100) {
        gameState.rashLevel++;
      } else {
        gameState.rashLevel = 1;
      }
      saveRashProgress(gameState.rashLevel);
    }
    startLevel(gameState.rashLevel - 1);
  }
}

/** Ficha del Maestro: se abre sola la primera vez que se juega un nivel que presenta algo nuevo (cfg.brief.card) y pausa la partida hasta cerrarla.
 *  Devuelve true si la abrió (entonces no hace falta el aviso corto). */
function showLevelBrief(cfg) {
  const b = cfg.brief; if (!b || !b.card) return false;
  let seen = {}; try { seen = JSON.parse(safeStorage.getItem('ramen_camp_brief_seen') || '{}') || {}; } catch (e) {}
  if (seen[cfg.level]) return false;
  const old = document.getElementById('level-brief'); if (old) old.remove();
  const html = t => String(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const el = document.createElement('div'); el.id = 'level-brief';
  el.innerHTML = '<div class="lb-card"><div class="lb-tag">🏮 Nivel ' + cfg.level + ' · ' + html(cfg.name.replace(/Nivel \d+:\s*/, '')) + '</div>'
    + '<h2>' + html(b.title) + '</h2>' + b.lines.map(l => '<p>' + html(l) + '</p>').join('')
    + '<div class="lb-focus">Mecánica del nivel: ' + html(cfg.focus.mechanic) + '</div>'
    + '<div class="lb-hint">📚 Puedes repasarla en Aprender → Aula.</div>'
    + '<button class="lb-go" type="button">▶ ¡Empezar!</button></div>';
  (document.getElementById('game-container') || document.body).appendChild(el);
  gameState.isPaused = true;
  el.querySelector('.lb-go').onclick = () => {
    seen[cfg.level] = 1; try { safeStorage.setItem('ramen_camp_brief_seen', JSON.stringify(seen)); } catch (e) {}
    el.remove(); gameState.isPaused = false; try { playSound('click'); } catch (e) {}
  };
  return true;
}

function startLevel(lvlIndex) {
  if (!DeviceManager.currentPlayer) {
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    DeviceManager.currentPlayer = {
      playerName: `Chef_${guestNum}`,
      contact: "",
      avatar: "🍜",
      deviceId: DeviceManager.deviceId || "DEV-GUEST",
      deviceInfo: DeviceManager.deviceInfoText || "Dispositivo",
      createdAt: new Date().toISOString()
    };
    safeStorage.setItem("ramen_profile_explicit_registered", "true");
    safeStorage.setItem("ramen_player_profile", JSON.stringify(DeviceManager.currentPlayer));
    safeStorage.setItem("ramen_player_name", DeviceManager.currentPlayer.playerName);
    updateStartPlayerCard();
    renderLinkedUserBadges();
    if (typeof cloudSaveProfile === 'function') cloudSaveProfile();
  }

  if (gameState.gameMode === 'NORMAL') {
    currentLevelIndex = lvlIndex !== undefined ? lvlIndex : 0;
    const cfg = NIVELES[currentLevelIndex];
    gameState.timeLeft = cfg.time;
  } else if ((gameState.gameMode === 'JAPON' && gameState.japon)) {
    gameState.timeLeft = japonRunConfig().time;      // jornada en un local: tiempo fijo según la dificultad
  } else if (gameState.gameMode === 'TRAINING' || gameState.gameMode === 'FREE') {
    gameState.timeLeft = 0; // sin cuenta regresiva (entrenamiento: el reloj sube; cocina libre: sin tiempo)
  } else {
    if (lvlIndex !== undefined && lvlIndex !== null) {
      gameState.rashLevel = lvlIndex + 1;
    } else {
      gameState.rashLevel = parseInt(safeStorage.getItem('ramen_mania_rash_level') || '1');
    }
    if (gameState.rashLevel > 100) gameState.rashLevel = 100;
    gameState.rashCustomersSpawned = 0;
    gameState.rashCustomersServed = 0;
    const maxLivesForLevel = 5 + (gameState.rashLevel - 1);
    gameState.rashMaxLives = maxLivesForLevel;
    gameState.rashLives = maxLivesForLevel;
    gameState.elapsedTime = 0;
    saveRashProgress(gameState.rashLevel);
  }

  AnalyticsTracker.startSession(
    gameState.gameMode,
    gameState.gameMode === 'NORMAL' ? (currentLevelIndex + 1) : gameState.rashLevel
  );

  const cfg = getCurrentLevelConfig();

  gameState.money = 0;
  gameState.customersServed = 0;
  gameState.customersLost = 0;
  gameState.isPaused = false;
  gameState.isGameOver = false;
  gameState.activeBowlIndex = 0;
  gameState.selectedCustomerModalIndex = null;
  gameState.targetCustomerIndex = null;
  gameState.customerSpawnTimer = 0;
  gameState.bowls = [
    { ingredients: [], matchedRamen: null },
    { ingredients: [], matchedRamen: null },
    { ingredients: [], matchedRamen: null }
  ];
  gameState.customerSlots = [null, null, null, null];
  gameState.pans = null;
  gameState.recortes = 0;
  gameState.dashi = 0;
  gameState.gameClock = 0;
  gameState.propinasSession = 0;
  updatePropinasHUD();
  const mottCap = document.querySelector('.stat-mottainai');
  if (mottCap) mottCap.style.display = (isTraining() && !trainingFeature('mottainai')) ? 'none' : '';
  const freeBtn = document.getElementById('btn-free-menu');
  if (freeBtn) freeBtn.style.display = isFree() ? '' : 'none';
  Object.keys(_lastStationSig).forEach(k => delete _lastStationSig[k]);
  updateMottainaiHUD();

  document.getElementById("btn-pause").textContent = "⏸️";

  resetCookingStations();
  applyMiseEnPlace();
  initRecipeTable();
  updateHUD();
  renderBowls();
  renderCustomers();
  gameState.activeArea = (gameState.gameMode === 'JAPON' && gameState.japon) ? japonFirstArea()
    : ((gameState.gameMode === 'FREE' && gameState.free && gameState.free.areas.length === 1) ? gameState.free.areas[0] : (isMultiplayerSession() ? (mpAreas()[0] || 'ramen') : 'ramen'));   // cocina libre de una sola área: empieza en ella
  gameState.stages = { ramen: 'cook', salteados: 'cook', makis: 'cook', frituras: 'cook' };
  cleanupMakiToolDrag();
  gameState.makiRoll = newMakiRoll();
  gameState.mk = null;                                   // el estudio de Makis (esterilla, rollos en la tabla, pescado) empieza vacío en cada partida
  gameState.woks = [newWok(), newWok()];
  if (fryTimerInterval) { clearInterval(fryTimerInterval); fryTimerInterval = null; }
  cleanupFryItemDrag();
  cleanupFryKnifeDrag();
  gameState.fryStation = newFryStation();
  stInit();
  updateStationVisibilityForArea();
  renderPantryGrid();

  if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isGameActive && MultiplayerManager.gameMode === 'COOP') {
    if (MultiplayerManager.isHost) {
      spawnCustomer();
      if (cfg.max_customers >= 2) spawnCustomer();
      MultiplayerManager.syncCustomerQueue(gameState.customerSlots);
      MultiplayerManager.syncKitchenStocks(kitchenState.stocks);
    }
  } else {
    spawnCustomer();
    if (cfg.max_customers >= 2 && !isTraining()) spawnCustomer();
  }

  clearInterval(gameLoopInterval);
  gameLoopInterval = setInterval(gameTick, 1000);
  if (gameState.gameMode === 'NORMAL' && cfg.intro && !isMultiplayerSession()) {
    if (!showLevelBrief(cfg)) setTimeout(() => showStationToast(`🏮 ${cfg.name}<br>${cfg.intro}`), 400);
  }
  if (isFree()) {
    setTimeout(() => showStationToast('🌿 Cocina libre: todo el catálogo, sin tiempo y sin perder clientes.<br>Toca 🍽️ para pedir el plato que quieras practicar.'), 400);
  }
  if (isTraining()) {
    const ch = gameState.training.challenge;
    setTimeout(() => showStationToast(`🏋️ Reto ${ch.num}: ${ch.title}<br>${trainingObjectiveText(ch)}`), 400);
  }
}
