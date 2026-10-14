/* Módulo 28-perfil-ranking-pantalla — Perfil, registro, ranking, pantalla completa, PWA, recetario y orden de ingredientes.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

function updateStartPlayerCard() {
  const box = document.getElementById("start-profile-box");
  if (box) {
    box.style.display = "none";
    box.innerHTML = "";
  }

  const bestRash = parseInt(safeStorage.getItem('ramen_mania_rash_best') || '1');
  const curRash = parseInt(safeStorage.getItem('ramen_mania_rash_level') || '1');
  const rashStatsEl = document.getElementById("start-rash-stats-text");
  if (rashStatsEl) {
    rashStatsEl.innerHTML = `🏆 Tu Récord: <strong>Ronda ${bestRash} / 100</strong> (Guardado: R${curRash})`;
  }

  renderLinkedUserBadges();
}

function renderLinkedUserBadges() {
  const p = DeviceManager.currentPlayer;
  const startBadge = document.getElementById("start-linked-user-bar");
  const startPillTitle = document.getElementById("start-pill-title");
  const startPillName = document.getElementById("start-pill-name");
  const startPillAvatar = document.getElementById("start-pill-avatar");
  const startPillDot = document.getElementById("start-pill-dot");
  
  const hudBadge = document.getElementById("hud-linked-user");
  const hudName = document.getElementById("hud-user-name");
  const hudAvatar = document.getElementById("hud-user-avatar");

  if (startBadge) startBadge.style.display = "block";

  const rankPill = document.getElementById("start-pill-rank");
  if (rankPill) {
    const rawMmr = safeStorage.getItem("ramen_player_mmr");
    const mmr = (rawMmr !== null && !isNaN(parseInt(rawMmr))) ? parseInt(rawMmr) : 1000;
    const rankInfo = (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.getRankDetails)
      ? MultiplayerManager.getRankDetails(mmr)
      : { fullName: "Bronce IV", icon: "🥉", color: "#cd7f32" };
    rankPill.innerHTML = `${rankInfo.icon} <strong>${rankInfo.fullName}</strong> (${mmr} MMR)`;
    rankPill.style.color = rankInfo.color || "#ffb300";
    rankPill.style.display = "inline-flex";
  }

  if (p && p.playerName) {
    if (startPillTitle) startPillTitle.textContent = "CUENTA VINCULADA";
    if (startPillName) startPillName.textContent = `Chef ${p.playerName}`;
    if (startPillAvatar) startPillAvatar.textContent = p.avatar || "🍜";
    if (startPillDot) {
      startPillDot.style.color = "#00e676";
      startPillDot.title = "Dispositivo Conectado";
    }

    if (hudBadge) hudBadge.style.display = "inline-flex";
    if (hudName) hudName.textContent = `Chef ${p.playerName}`;
    if (hudAvatar) hudAvatar.textContent = p.avatar || "🍜";
  } else {
    if (startPillTitle) startPillTitle.textContent = "MI PERFIL";
    if (startPillName) startPillName.textContent = "Chef Invitado";
    if (startPillAvatar) startPillAvatar.textContent = "👤";
    if (startPillDot) {
      startPillDot.style.color = "#ffca28";
      startPillDot.title = "Toca para registrar tu alias";
    }

    if (hudBadge) hudBadge.style.display = "none";
  }
}

let welcomeToastTimer = null;
function showWelcomeToast(playerName, avatar) {
  const toast = document.getElementById("welcome-user-toast");
  const toastText = document.getElementById("welcome-toast-text");
  const toastAvatar = document.getElementById("welcome-toast-avatar");
  if (!toast || !playerName) return;

  if (toastText) toastText.textContent = `¡Hola de nuevo, Chef ${playerName}!`;
  if (toastAvatar) toastAvatar.textContent = avatar || "🍜";

  toast.classList.add("show");
  if (welcomeToastTimer) clearTimeout(welcomeToastTimer);
  welcomeToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 4500);
}

function dismissWelcomeToast() {
  const toast = document.getElementById("welcome-user-toast");
  if (toast) toast.classList.remove("show");
  if (welcomeToastTimer) clearTimeout(welcomeToastTimer);
}

let regModalPendingStartPlay = false;

function handleStartPlayClick() {
  if (!DeviceManager.currentPlayer) {
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const guestPlayer = {
      playerName: `Chef_${guestNum}`,
      contact: "",
      avatar: "🍜",
      deviceId: DeviceManager.deviceId || "DEV-LOCAL",
      deviceInfo: DeviceManager.deviceInfoText || "Dispositivo",
      createdAt: new Date().toISOString()
    };
    DeviceManager.currentPlayer = guestPlayer;
    safeStorage.setItem("ramen_profile_explicit_registered", "true");
    safeStorage.setItem("ramen_player_profile", JSON.stringify(guestPlayer));
    safeStorage.setItem("ramen_player_name", guestPlayer.playerName);
    updateStartPlayerCard();
    renderLinkedUserBadges();
  }

  if (startSelectedMode === 'TUTORIAL') {
    TutorialManager.start();
    return;
  }

  if (startSelectedMode === 'TRAINING') {
    openTrainingModal();
    return;
  }

  if (startSelectedMode === 'FREE') {
    executeStartGame();
    return;
  }

  if (!isTutorialCompleted()) {
    showLockedModeToast("🔒 Debes completar el Modo Tutorial antes de jugar este modo.");
    setStartSelectedMode('TUTORIAL');
    return;
  }

  executeStartGame();
}

function executeStartGame() {
  try { playSound('serve'); } catch(e) {}
  const startScreen = document.getElementById("start-screen");
  if (startScreen) {
    startScreen.classList.add("hidden");
    startScreen.style.display = "none";
    startScreen.style.visibility = "hidden";
    startScreen.style.pointerEvents = "none";
  }

  const rotateOverlay = document.getElementById("rotate-device-overlay");
  if (rotateOverlay) rotateOverlay.style.display = "none";

  gameState.gameMode = startSelectedMode;
  statsBump('g');
  if (startSelectedMode !== 'TRAINING') gameState.training = null;
  const freeOnly = window.startFreeAreas; window.startFreeAreas = null;   // desde el local isométrico: cocina libre de una sola área
  gameState.free = startSelectedMode === 'FREE' ? { auto: true, areas: (freeOnly && freeOnly.length) ? [...freeOnly] : [...FREE_AREAS] } : null;
  if (startSelectedMode === 'NORMAL') {
    startLevel(0);
  } else if (startSelectedMode === 'TRAINING' || startSelectedMode === 'FREE') {
    startLevel(0);
  } else {
    const savedRash = parseInt(safeStorage.getItem('ramen_mania_rash_level') || '1');
    startLevel(savedRash - 1);
  }
}

function returnToStartMenu() {
  if (window._updatePending) { window._updatePending = false; try { statsFlush(); } catch (e) {} location.reload(); return; }   // nueva versión descargada durante la partida
  updatePropinasHUD();
  statsFlush();
  if (gameState.gameMode === 'TRAINING') gameState.training = null;
  if (gameState.gameMode === 'FREE') gameState.free = null;
  const freeBtnMenu = document.getElementById('btn-free-menu');
  if (freeBtnMenu) freeBtnMenu.style.display = 'none';
  if (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.isInMultiplayer) {
    MultiplayerManager.leaveRoom();
  }
  if (!gameState.isGameOver) {
    AnalyticsTracker.endSession('ABANDONED');
  }
  gameState.isGameOver = true;
  clearInterval(gameLoopInterval);
  resetCookingStations();
  const startScreen = document.getElementById("start-screen");
  if (startScreen) {
    startScreen.classList.remove("hidden");
    startScreen.style.display = "flex";
    startScreen.style.visibility = "visible";
    startScreen.style.pointerEvents = "auto";
  }
  updateStartPlayerCard();
  updateStartModesDisplay();
  updateAudioToggleUI();
}

function openRegisterPlayerModal(fromPlay = false) {
  if (DeviceManager.currentPlayer) {
    if (fromPlay) {
      executeStartGame();
      return;
    }
    openProfileModal();
    return;
  }
  regModalPendingStartPlay = !!fromPlay;
  regSelectedAvatar = '🍜';
  selectRegAvatar('🍜');
  const nameInput = document.getElementById("reg-player-name");
  if (nameInput) {
    nameInput.value = "";
    nameInput.defaultValue = "";
    nameInput.setAttribute("value", "");
  }
  const contactInput = document.getElementById("reg-player-contact");
  if (contactInput) {
    contactInput.value = "";
    contactInput.defaultValue = "";
    contactInput.setAttribute("value", "");
  }
  const statusEl = document.getElementById("reg-status-msg");
  if (statusEl) {
    if (fromPlay) {
      statusEl.textContent = "🍜 Ingresa tu Alias para tus récords o pulsa 'Jugar como Invitado':";
      statusEl.style.color = "#ff9800";
    } else {
      statusEl.textContent = "";
    }
  }

  const titleEl = document.getElementById("reg-modal-title");
  if (titleEl) {
    titleEl.textContent = fromPlay ? "🍜 ¡Bienvenido Chef a Ramen Mania!" : "🍜 Registro de Chef";
  }

  const btnConfirm = document.getElementById("btn-confirm-register");
  if (btnConfirm) {
    btnConfirm.textContent = fromPlay ? "▶️ Guardar Alias y Entrar a Jugar" : "✨ Registrar y Vincular este Dispositivo";
  }

  const modal = document.getElementById("register-player-modal");
  if (modal) {
    modal.classList.add("active");
  }
  if (nameInput) {
    bindAliasInputValidation("reg-player-name", "reg-status-msg", false);
    setTimeout(() => nameInput.focus(), 150);
  }
}

let aliasCheckDebounceTimer = null;
function bindAliasInputValidation(inputId, statusMsgId, isProfileEdit = false) {
  const input = document.getElementById(inputId);
  const statusEl = document.getElementById(statusMsgId);
  if (!input || !statusEl || input.dataset.aliasCheckBound === "true") return;
  input.dataset.aliasCheckBound = "true";

  input.addEventListener("input", () => {
    clearTimeout(aliasCheckDebounceTimer);
    const val = input.value.trim();
    if (val.length === 0) {
      statusEl.textContent = "";
      return;
    }
    if (val.length < 2) {
      statusEl.textContent = "ℹ️ El alias debe tener al menos 2 caracteres.";
      statusEl.style.color = "#ff9800";
      return;
    }
    if (val.length > 20) {
      statusEl.textContent = "⚠️ Máximo 20 caracteres.";
      statusEl.style.color = "#c62828";
      return;
    }
    if (isProfileEdit && DeviceManager.currentPlayer && DeviceManager.currentPlayer.playerName.toLowerCase() === val.toLowerCase()) {
      statusEl.textContent = "ℹ️ Es tu alias actual.";
      statusEl.style.color = "#757575";
      return;
    }

    statusEl.textContent = `🔍 Comprobando disponibilidad de "${val}"...`;
    statusEl.style.color = "#ff9800";

    aliasCheckDebounceTimer = setTimeout(async () => {
      const currentVal = input.value.trim();
      if (currentVal !== val) return;
      const isTaken = await DeviceManager.isAliasTaken(currentVal);
      if (input.value.trim() !== currentVal) return;

      if (isTaken) {
        statusEl.textContent = `❌ El alias "${currentVal}" ya está en uso. Por favor elige otro nombre.`;
        statusEl.style.color = "#c62828";
      } else {
        statusEl.textContent = `✅ El alias "${currentVal}" está disponible.`;
        statusEl.style.color = "#2e7d32";
      }
    }, 350);
  });
}

function closeRegisterPlayerModal() {
  regModalPendingStartPlay = false;
  const modal = document.getElementById("register-player-modal");
  if (modal) modal.classList.remove("active");
}

function selectRegAvatar(av) {
  regSelectedAvatar = av;
  document.querySelectorAll("#reg-avatar-grid .avatar-opt-btn").forEach(btn => {
    if (btn.textContent.trim() === av) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

async function handlePlayAsGuest() {
  const statusEl = document.getElementById("reg-status-msg");
  if (statusEl) {
    statusEl.textContent = `⚡ Generando alias de invitado disponible...`;
    statusEl.style.color = "#ffb300";
  }
  let guestName = "";
  for (let i = 0; i < 5; i++) {
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const candidate = `Chef_${guestNum}`;
    const taken = await DeviceManager.isAliasTaken(candidate);
    if (!taken) {
      guestName = candidate;
      break;
    }
  }
  if (!guestName) guestName = `Chef_${Date.now().toString().slice(-4)}`;

  if (statusEl) {
    statusEl.textContent = `⚡ Entrando como ${guestName}...`;
    statusEl.style.color = "#ffb300";
  }
  await DeviceManager.register(guestName, "", regSelectedAvatar || "🍜");
  closeRegisterPlayerModal();
  updateStartPlayerCard();
  executeStartGame();
}

async function handleConfirmRegistration() {
  const nameInput = document.getElementById("reg-player-name");
  const contactInput = document.getElementById("reg-player-contact");
  const statusEl = document.getElementById("reg-status-msg");
  const btn = document.getElementById("btn-confirm-register");

  const playerName = (nameInput ? nameInput.value : "").trim();
  const contact = (contactInput ? contactInput.value : "").trim();

  if (playerName.length < 2) {
    if (regModalPendingStartPlay) {
      await handlePlayAsGuest();
      return;
    }
    if (statusEl) {
      statusEl.textContent = "⚠️ El alias debe tener al menos 2 caracteres.";
      statusEl.style.color = "#c62828";
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Vinculando...";
  }
  if (statusEl) {
    statusEl.textContent = "Registrando Chef...";
    statusEl.style.color = "#ff9800";
  }

  const res = await DeviceManager.register(playerName, contact, regSelectedAvatar);
  if (btn) {
    btn.disabled = false;
    btn.textContent = regModalPendingStartPlay ? "▶️ Guardar Alias y Entrar a Jugar" : "✨ Registrar y Vincular este Dispositivo";
  }

  if (!res.success) {
    if (statusEl) {
      statusEl.textContent = "⚠️ " + res.error;
      statusEl.style.color = "#c62828";
    }
  } else {
    if (statusEl) {
      statusEl.textContent = "🎉 ¡Chef vinculado exitosamente!";
      statusEl.style.color = "#2e7d32";
    }
    const shouldStart = regModalPendingStartPlay;
    regModalPendingStartPlay = false;
    setTimeout(() => {
      closeRegisterPlayerModal();
      updateStartPlayerCard();
      if (shouldStart) {
        executeStartGame();
      }
    }, 350);
  }
}

let pausedByProfileModal = false;

function openGameProfileModal() {
  if (!gameState.isGameOver && !gameState.isPaused) {
    togglePause();
    pausedByProfileModal = true;
  }
  openProfileModal();
}

function openProfileModal() {
  if (!DeviceManager.currentPlayer) {
    openRegisterPlayerModal();
    return;
  }
  const p = DeviceManager.currentPlayer;
  document.getElementById("prof-avatar-display").textContent = p.avatar || "🍜";
  document.getElementById("prof-name-display").textContent = `Chef ${p.playerName}`;
  document.getElementById("prof-device-status-display").textContent = `🔒 Vinculado a este Dispositivo (#${DeviceManager.deviceId.substring(0, 12)})`;
  
  const createdDate = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "Hoy";
  document.getElementById("prof-created-display").textContent = `Fecha de Registro: ${createdDate}`;

  const rawScores = safeStorage.getItem('ramen_local_scores') || "[]";
  let localScores = [];
  try { localScores = JSON.parse(rawScores); } catch(e) {}
  
  const normalScores = localScores.filter(s => s.game_mode === 'NORMAL');
  const normalBest = normalScores.length > 0 ? Math.max(...normalScores.map(s => s.score_money)) : 0;
  const rashBest = parseInt(safeStorage.getItem('ramen_mania_rash_best') || '1');

  document.getElementById("prof-stat-games").textContent = localScores.length;
  document.getElementById("prof-stat-normal-best").textContent = `S/ ${normalBest}`;
  document.getElementById("prof-stat-rash-best").textContent = `Ronda ${rashBest}`;

  // Datos de Rango MMR Competitivo
  const rawMmr = safeStorage.getItem("ramen_player_mmr");
  const mmr = (rawMmr !== null && !isNaN(parseInt(rawMmr))) ? parseInt(rawMmr) : 1000;
  const rank = (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.getRankDetails) 
    ? MultiplayerManager.getRankDetails(mmr)
    : { fullName: 'Bronce IV', icon: '🥉', color: '#cd7f32', lp: 0, progressPercent: 0, nextRankName: 'Bronce III' };

  const wins = parseInt(safeStorage.getItem('ramen_player_pvp_wins') || '0');
  const losses = parseInt(safeStorage.getItem('ramen_player_pvp_losses') || '0');
  const streak = parseInt(safeStorage.getItem('ramen_player_pvp_streak') || '0');
  const totalMatches = wins + losses;
  const winrate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const elIcon = document.getElementById("prof-rank-icon");
  if (elIcon) elIcon.textContent = rank.icon;
  const elName = document.getElementById("prof-rank-name");
  if (elName) elName.textContent = rank.fullName;
  const elMmr = document.getElementById("prof-rank-mmr");
  if (elMmr) elMmr.textContent = `${mmr.toLocaleString()} MMR`;
  const elCurr = document.getElementById("prof-rank-tier-curr");
  if (elCurr) elCurr.textContent = rank.fullName;
  const elPts = document.getElementById("prof-rank-progress-pts");
  if (elPts) elPts.textContent = `${rank.lp} / 100 LP`;
  const elNext = document.getElementById("prof-rank-tier-next");
  if (elNext) elNext.textContent = rank.nextRankName;
  const elBar = document.getElementById("prof-rank-progress-bar");
  if (elBar) elBar.style.width = `${rank.progressPercent}%`;

  const elWins = document.getElementById("prof-stat-pvp-wins");
  if (elWins) elWins.textContent = wins;
  const elLosses = document.getElementById("prof-stat-pvp-losses");
  if (elLosses) elLosses.textContent = losses;
  const elWr = document.getElementById("prof-stat-pvp-winrate");
  if (elWr) elWr.textContent = `${winrate}%`;
  const elStreak = document.getElementById("prof-stat-pvp-streak");
  if (elStreak) elStreak.textContent = `🔥 ${streak}`;

  profSelectedAvatar = p.avatar || "🍜";
  selectProfAvatar(profSelectedAvatar);
  const nameInput = document.getElementById("prof-name-input");
  if (nameInput) {
    nameInput.value = p.playerName || "";
    bindAliasInputValidation("prof-name-input", "prof-save-status", true);
  }
  document.getElementById("prof-contact-input").value = p.contact || "";
  document.getElementById("prof-save-status").textContent = "";

  document.getElementById("player-profile-modal").classList.add("active");
}

function closeProfileModal() {
  document.getElementById("player-profile-modal").classList.remove("active");
  if (pausedByProfileModal && gameState.isPaused && !gameState.isGameOver) {
    togglePause();
    pausedByProfileModal = false;
  }
}

function selectProfAvatar(av) {
  profSelectedAvatar = av;
  document.querySelectorAll("#prof-avatar-grid .avatar-opt-btn").forEach(btn => {
    if (btn.textContent.trim() === av) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

async function handleSaveProfileChanges() {
  const nameInput = document.getElementById("prof-name-input");
  const contactInput = document.getElementById("prof-contact-input");
  const statusEl = document.getElementById("prof-save-status");
  const newName = nameInput ? nameInput.value.trim() : "";
  const contact = contactInput.value.trim();

  if (newName && newName.length < 2) {
    statusEl.textContent = "⚠️ El nombre debe tener al menos 2 caracteres.";
    statusEl.style.color = "#c62828";
    return;
  }

  statusEl.textContent = "Guardando cambios...";
  statusEl.style.color = "#ff9800";

  const res = await DeviceManager.updateProfile(newName, contact, profSelectedAvatar);
  if (res.success) {
    document.getElementById("prof-avatar-display").textContent = profSelectedAvatar;
    if (newName) document.getElementById("prof-name-display").textContent = `Chef ${newName}`;
    statusEl.textContent = "✅ Perfil actualizado correctamente.";
    statusEl.style.color = "#2e7d32";
    setTimeout(() => {
      statusEl.textContent = "";
    }, 2000);
  } else {
    statusEl.textContent = res.error || "⚠️ Error al guardar cambios.";
    statusEl.style.color = "#c62828";
  }
}

/* ==========================================================================
   SISTEMA DE RÉCORDS Y LEADERBOARD (SUPABASE + LOCALSTORAGE)
   ========================================================================== */
function openSaveScoreModal() {
  document.getElementById("record-summary-money").textContent = `S/ ${gameState.money}`;
  document.getElementById("record-summary-served").textContent = `${gameState.customersServed} ramen`;
  
  const modeText = gameState.gameMode === 'NORMAL' 
    ? `Modo Normal (Nivel ${currentLevelIndex + 1})` 
    : `Modo Rash (Ronda ${gameState.rashLevel})`;
  document.getElementById("record-summary-mode").textContent = modeText;

  const nameInput = document.getElementById("record-player-name");
  const contactInput = document.getElementById("record-player-contact");

  if (DeviceManager.currentPlayer) {
    nameInput.value = DeviceManager.currentPlayer.playerName;
    nameInput.readOnly = true;
    nameInput.style.backgroundColor = "#e8f5e9";
    nameInput.title = "Alias verificado de este dispositivo";
    contactInput.value = DeviceManager.currentPlayer.contact || "";
  } else {
    nameInput.value = safeStorage.getItem('ramen_player_name') || "";
    nameInput.readOnly = false;
    nameInput.style.backgroundColor = "#fff";
    contactInput.value = safeStorage.getItem('ramen_player_contact') || "";
  }

  const statusEl = document.getElementById("save-record-status");
  statusEl.textContent = "";
  statusEl.style.color = "#5d4037";

  document.getElementById("save-score-modal").classList.add("active");
}

function closeSaveScoreModal() {
  document.getElementById("save-score-modal").classList.remove("active");
}

async function submitScoreToSupabase() {
  const nameInput = document.getElementById("record-player-name");
  const contactInput = document.getElementById("record-player-contact");
  const statusEl = document.getElementById("save-record-status");
  const btn = document.getElementById("btn-submit-record");

  let playerName = nameInput.value.trim();
  let contact = contactInput.value.trim();

  if (DeviceManager.currentPlayer) {
    playerName = DeviceManager.currentPlayer.playerName;
    if (!contact) contact = DeviceManager.currentPlayer.contact || "";
  }

  if (playerName.length < 2) {
    statusEl.textContent = "⚠️ Ingresa un nombre o apodo de al menos 2 caracteres.";
    statusEl.style.color = "#c62828";
    return;
  }

  safeStorage.setItem('ramen_player_name', playerName);
  safeStorage.setItem('ramen_player_contact', contact);

  btn.disabled = true;
  btn.textContent = "⏳ Guardando récord...";
  statusEl.textContent = "Enviando puntuación...";
  statusEl.style.color = "#ff9800";

  const levelReached = gameState.gameMode === 'NORMAL' ? (currentLevelIndex + 1) : gameState.rashLevel;
  const newRecord = {
    player_name: playerName,
    contact: contact || null,
    device_id: DeviceManager.deviceId,
    score_money: gameState.money,
    customers_served: gameState.customersServed,
    level_reached: levelReached,
    game_mode: gameState.gameMode,
    created_at: new Date().toISOString()
  };

  // Guardar siempre una copia local
  saveLocalScore(newRecord);

  let success = false;
  const sent = await submitRecordToServer(newRecord);
  if (sent.ok) {
    success = true;
    statusEl.textContent = "🎉 ¡Récord registrado con éxito en el Ranking Oficial!";
    statusEl.style.color = "#2e7d32";
  } else if (sent.error === 'registro_invalido' || sent.error === 'demasiados_registros') {
    statusEl.textContent = "⚠️ El ranking no aceptó este récord (valores fuera de lo normal).";
    statusEl.style.color = "#c62828";
  } else {
    statusEl.textContent = "Guardado localmente (sin conexión con el ranking). Se mostrará en tu dispositivo.";
    statusEl.style.color = "#f57c00";
  }

  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "🚀 Enviar al Ranking Oficial";
    closeSaveScoreModal();
    openLeaderboardModal();
  }, 1200);
}

function saveLocalScore(record) {
  try {
    const raw = safeStorage.getItem('ramen_local_scores') || "[]";
    const scores = JSON.parse(raw);
    scores.push(record);
    safeStorage.setItem('ramen_local_scores', JSON.stringify(scores));
  } catch(e) {}
}

function openLeaderboardModal() {
  if (!gameState.isGameOver && !gameState.isPaused) {
    togglePause();
  }
  document.getElementById("leaderboard-modal").classList.add("active");
  loadLeaderboard();
}

function closeLeaderboardModal() {
  document.getElementById("leaderboard-modal").classList.remove("active");
  if (gameState.isPaused && !gameState.isGameOver) {
    togglePause();
  }
}

function switchLeaderboardTab(mode) {
  currentLbTab = mode;
  const tabNormal = document.getElementById("tab-lb-normal");
  const tabRash = document.getElementById("tab-lb-rash");
  const tabMmr = document.getElementById("tab-lb-mmr");
  if (tabNormal) tabNormal.className = `pantry-tab ${mode === 'NORMAL' ? 'active' : ''}`;
  if (tabRash) tabRash.className = `pantry-tab ${mode === 'RASH' ? 'active' : ''}`;
  if (tabMmr) tabMmr.className = `pantry-tab ${mode === 'MMR' ? 'active' : ''}`;
  loadLeaderboard();
}

async function loadLeaderboard() {
  const tbody = document.getElementById("leaderboard-body");
  const statusEl = document.getElementById("leaderboard-status-text");
  const thead = document.querySelector("#leaderboard-table thead");

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:#5d4037;">Cargando la clasificación oficial...</td></tr>`;

  // 1. Caso Pestaña Ranking MMR (PvP Competitivo)
  if (currentLbTab === 'MMR') {
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th style="width:38px; text-align:center;">#</th>
          <th>Chef</th>
          <th>Rango & División</th>
          <th style="text-align:right;">MMR</th>
          <th style="text-align:center;">V / D (Ratio)</th>
          <th style="text-align:center;">Racha</th>
        </tr>
      `;
    }

    let records = [];
    let isFromSupabase = false;

    await ensureSupabaseLoaded();
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.rpc('pvp_ranking');
        if (!error && data && data.length > 0) {
          records = data;
          isFromSupabase = true;
        }
      } catch(e) {
        console.warn("Fallo cargando ranking MMR de Supabase:", e);
      }
    }

    // Fallback a perfil local si aún no hay jugadores en Supabase
    if (records.length === 0) {
      const myName = (DeviceManager.currentPlayer && DeviceManager.currentPlayer.playerName) || safeStorage.getItem('ramen_player_name') || 'Chef Anónimo';
      const myAvatar = (DeviceManager.currentPlayer && DeviceManager.currentPlayer.avatar) || safeStorage.getItem('ramen_player_avatar') || '🍜';
      const myMmr = parseInt(safeStorage.getItem('ramen_player_mmr') || '1000');
      const myRank = safeStorage.getItem('ramen_player_rank_tier') || 'Bronce IV';
      const wins = parseInt(safeStorage.getItem('ramen_player_pvp_wins') || '0');
      const losses = parseInt(safeStorage.getItem('ramen_player_pvp_losses') || '0');
      const streak = parseInt(safeStorage.getItem('ramen_player_pvp_streak') || '0');
      records = [{
        player_name: myName,
        avatar: myAvatar,
        mmr: myMmr,
        rank_tier: myRank,
        pvp_wins: wins,
        pvp_losses: losses,
        pvp_streak: streak,
        device_id: DeviceManager.deviceId
      }];
    }

    statusEl.textContent = isFromSupabase 
      ? "🟢 Clasificación Competitiva Oficial en Tiempo Real (Supabase)" 
      : "🟡 Mostrando puntuaciones locales (Conecta tus llaves de Supabase para ver la clasificación global).";

    tbody.innerHTML = "";
    const medals = ["🥇", "🥈", "🥉"];
    records.forEach((rec, idx) => {
      const tr = document.createElement("tr");
      const rankDisplay = idx < 3 ? medals[idx] : `#${idx + 1}`;
      const isCurrentPlayer = (DeviceManager.currentPlayer && DeviceManager.currentPlayer.playerName && DeviceManager.currentPlayer.playerName.toLowerCase() === (rec.player_name || '').toLowerCase()) || (rec.device_id && rec.device_id === DeviceManager.deviceId);
      const rankDetails = (typeof MultiplayerManager !== 'undefined' && MultiplayerManager.getRankDetails) 
        ? MultiplayerManager.getRankDetails(rec.mmr || 1000)
        : { fullName: rec.rank_tier || 'Bronce IV', icon: '🥉', color: '#cd7f32' };

      const wins = rec.pvp_wins || 0;
      const losses = rec.pvp_losses || 0;
      const total = wins + losses;
      const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
      const streak = rec.pvp_streak || 0;

      tr.style.backgroundColor = isCurrentPlayer ? "#fffde7" : "";
      tr.innerHTML = `
        <td style="text-align:center; font-weight:900; font-size:13px;">${rankDisplay}</td>
        <td style="font-weight:800; color:#3e2723;">
          <span style="font-size:14px; margin-right:4px;">${rec.avatar || '🍜'}</span>
          ${escapeHtml(rec.player_name)} ${isCurrentPlayer ? '<span style="font-size:9px; background:#ff9800; color:#fff; padding:1px 4px; border-radius:4px;">TÚ</span>' : ''}
        </td>
        <td>
          <span style="display:inline-flex; align-items:center; gap:4px; font-weight:800; color:${rankDetails.color};">
            <span>${rankDetails.icon}</span>
            <span>${rankDetails.fullName}</span>
          </span>
        </td>
        <td style="text-align:right; font-weight:900; color:#b71c1c; font-size:12px;">
          ${(rec.mmr || 1000).toLocaleString()} MMR
        </td>
        <td style="text-align:center; font-size:11px;">
          <span style="color:#2e7d32; font-weight:800;">${wins}V</span> - <span style="color:#c62828; font-weight:800;">${losses}D</span>
          <span style="color:#757575; font-size:9px;">(${winrate}%)</span>
        </td>
        <td style="text-align:center; font-weight:800; color:${streak >= 3 ? '#ff3d00' : '#757575'};">
          ${streak > 0 ? `🔥 ${streak}` : '-'}
        </td>
      `;
      tbody.appendChild(tr);
    });
    return;
  }

  // 2. Modos Campaña (NORMAL y RASH)
  if (thead) {
    thead.innerHTML = `
      <tr>
        <th style="width:40px; text-align:center;">#</th>
        <th>Jugador</th>
        <th>Recaudado</th>
        <th>Atendidos</th>
        <th>Nivel</th>
        <th>Fecha</th>
      </tr>
    `;
  }

  let records = [];
  let isFromSupabase = false;

  await ensureSupabaseLoaded();
  if (supabaseClient) {
    try {
      const query = supabaseClient
        .from('leaderboard')
        .select('id,player_name,score_money,customers_served,level_reached,game_mode,created_at')
        .eq('game_mode', currentLbTab);

      if (currentLbTab === 'NORMAL') {
        query.order('score_money', { ascending: false }).order('customers_served', { ascending: false });
      } else {
        query.order('level_reached', { ascending: false }).order('score_money', { ascending: false });
      }

      const { data, error } = await query.limit(10);
      if (!error && data && data.length > 0) {
        records = data;
        isFromSupabase = true;
      }
    } catch(e) {
      console.warn("Fallo cargando de Supabase:", e);
    }
  }

  // Fallback a puntuaciones locales si no hay en Supabase
  if (records.length === 0) {
    try {
      const raw = safeStorage.getItem('ramen_local_scores') || "[]";
      const local = JSON.parse(raw).filter(r => r.game_mode === currentLbTab);
      local.sort((a, b) => {
        if (currentLbTab === 'NORMAL') return b.score_money - a.score_money;
        return (b.level_reached - a.level_reached) || (b.score_money - a.score_money);
      });
      records = local.slice(0, 10);
    } catch(e) {}
  }

  statusEl.textContent = isFromSupabase 
    ? "🟢 Conectado a la Base de Datos en tiempo real (Supabase)" 
    : "🟡 Mostrando puntuaciones locales (Conecta tus llaves de Supabase para ver el ranking global).";

  tbody.innerHTML = "";
  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:#8d6e63;">Aún no hay récords registrados en este modo. ¡Sé el primero en jugar!</td></tr>`;
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  records.forEach((rec, idx) => {
    const tr = document.createElement("tr");
    const rankDisplay = idx < 3 ? medals[idx] : `#${idx + 1}`;
    const dateFormatted = rec.created_at ? new Date(rec.created_at).toLocaleDateString() : "-";
    const levelLabel = rec.game_mode === 'NORMAL' ? `Nivel ${rec.level_reached}` : `Ronda ${rec.level_reached}`;
    const isCurrentPlayer = (DeviceManager.currentPlayer && DeviceManager.currentPlayer.playerName.toLowerCase() === rec.player_name.toLowerCase()) || (rec.device_id && rec.device_id === DeviceManager.deviceId);

    tr.style.backgroundColor = isCurrentPlayer ? "#fffde7" : "";
    tr.innerHTML = `
      <td style="text-align:center; font-weight:900; font-size:13px;">${rankDisplay}</td>
      <td style="font-weight:800; color:#3e2723;">
        ${escapeHtml(rec.player_name)} ${isCurrentPlayer ? '<span style="font-size:9px; background:#ff9800; color:#fff; padding:1px 4px; border-radius:4px;">TÚ</span>' : ''}
      </td>
      <td style="font-weight:900; color:#b71c1c;">S/ ${rec.score_money}</td>
      <td style="font-weight:700;">${rec.customers_served}</td>
      <td style="font-size:10px; font-weight:800; color:#e65100;">${levelLabel}</td>
      <td style="font-size:9px; color:#757575;">${dateFormatted}</td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function openModeSelectModal() {
  if (!gameState.isGameOver && !gameState.isPaused) {
    togglePause();
  }
  const best = parseInt(safeStorage.getItem('ramen_mania_rash_best') || '1');
  const current = parseInt(safeStorage.getItem('ramen_mania_rash_level') || '1');
  const statsEl = document.getElementById("mode-select-rash-stats");
  if (statsEl) {
    statsEl.innerHTML = `🏆 Tu Récord: <strong>Ronda ${best} / 100</strong> (Guardado: Ronda ${current})`;
  }
  const resumeBtn = document.getElementById("btn-resume-rash");
  if (resumeBtn) {
    resumeBtn.textContent = `▶️ Jugar Ronda ${current}`;
  }
  document.getElementById("mode-select-modal").classList.add("active");
}

function closeModeSelectModal() {
  document.getElementById("mode-select-modal").classList.remove("active");
  if (gameState.isPaused && !gameState.isGameOver) {
    togglePause();
  }
}

function selectGameMode(mode, targetLevel) {
  if (!DeviceManager.currentPlayer) {
    document.getElementById("mode-select-modal").classList.remove("active");
    openRegisterPlayerModal();
    const statusEl = document.getElementById("reg-status-msg");
    if (statusEl) {
      statusEl.textContent = "⚠️ Debes registrar tu alias de Chef antes de poder jugar.";
      statusEl.style.color = "#d32f2f";
    }
    return;
  }
  document.getElementById("mode-select-modal").classList.remove("active");
  gameState.gameMode = mode;
  if (mode === 'NORMAL') {
    startLevel(targetLevel !== null && targetLevel !== undefined ? targetLevel : 0);
  } else {
    let lvl = targetLevel;
    if (lvl === null || lvl === undefined) {
      lvl = parseInt(safeStorage.getItem('ramen_mania_rash_level') || '1');
    }
    gameState.rashLevel = lvl;
    saveRashProgress(lvl);
    startLevel(lvl - 1);
  }
}

function saveRashProgress(lvl) {
  try {
    const l = lvl || gameState.rashLevel || 1;
    safeStorage.setItem('ramen_mania_rash_level', l);
    const best = Math.max(l, parseInt(safeStorage.getItem('ramen_mania_rash_best') || '1'));
    safeStorage.setItem('ramen_mania_rash_best', best);
  } catch(e) {}
}

function toggleFullScreen() {
  const doc = window.document;
  const elem = doc.documentElement || document.getElementById('game-container');

  if (isIOS) {
    alert('📱 En iPhone/iPad Safari:\n\nApple no permite la API de pantalla completa en páginas web comunes.\n\nPara jugar en Pantalla Completa Limpia:\n1. Toca el botón Compartir de Safari (icono cuadrado con flecha hacia arriba ⎋).\n2. Elige "Agregar a pantalla de inicio".\n3. Ábrelo desde tu pantalla de inicio como una App nativa sin barras.');
    return;
  }

  const requestFullScreen = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
  const cancelFullScreen = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
    if (requestFullScreen) {
      try {
        const res = requestFullScreen.call(elem);
        if (res && typeof res.then === 'function') {
          res.then(() => handleFullscreenChange()).catch(err => {
            alert('Aviso: Tu navegador restringió la pantalla completa directa.\n\nPuedes agregar el juego a la Pantalla de Inicio.');
          });
        } else {
          handleFullscreenChange();
        }
      } catch(e) {
        alert('Aviso: Para pantalla completa limpia, agrega el archivo a tu Pantalla de Inicio.');
      }
    }
  } else {
    if (cancelFullScreen) {
      try {
        const res = cancelFullScreen.call(doc);
        if (res && typeof res.then === 'function') {
          res.then(() => handleFullscreenChange()).catch(() => {});
        } else {
          handleFullscreenChange();
        }
      } catch(e) {}
    }
  }
}

function handleFullscreenChange() {
  updateFullscreenBtn();
  if (typeof TutorialManager !== 'undefined' && TutorialManager && TutorialManager.isActive) {
    setTimeout(() => {
      TutorialManager.updatePosition();
    }, 120);
  }
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function updateFullscreenBtn() {
  const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  const hudBtn = document.getElementById('btn-fullscreen');
  if (hudBtn) {
    hudBtn.innerHTML = isFull ? '🗗' : '⛶';
    hudBtn.title = isFull ? 'Salir de Pantalla Completa (Esc)' : 'Entrar a Pantalla Completa';
    if (isFull) {
      hudBtn.classList.add('fullscreen-active');
    } else {
      hudBtn.classList.remove('fullscreen-active');
    }
  }
  const startBtn = document.getElementById('btn-start-fullscreen');
  if (startBtn) {
    startBtn.innerHTML = isFull ? '🗗 Salir Pantalla Completa' : '⛶ Pantalla Completa';
  }
}

const isIOS = (typeof navigator !== 'undefined') && (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || ((navigator.platform === 'MacIntel' || (navigator.userAgent && navigator.userAgent.includes('Macintosh'))) && navigator.maxTouchPoints > 1));

function unlockAudioOnce() {
  initAudio();
  window.removeEventListener('touchstart', unlockAudioOnce);
  window.removeEventListener('touchend', unlockAudioOnce);
  window.removeEventListener('click', unlockAudioOnce);
}
window.addEventListener('touchstart', unlockAudioOnce, { passive: true });
window.addEventListener('touchend', unlockAudioOnce, { passive: true });
window.addEventListener('click', unlockAudioOnce, { passive: true });

// ==========================================
// PWA INSTALLATION & SERVICE WORKER LOGIC
// ==========================================
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  console.log('[PWA] Evento beforeinstallprompt capturado con éxito');
  const installBtn = document.getElementById('btn-install-app');
  if (installBtn) {
    installBtn.style.display = 'inline-flex';
  }
});

window.addEventListener('appinstalled', (evt) => {
  console.log('[PWA] Ramen Mania instalado con éxito');
  deferredInstallPrompt = null;
  const installBtn = document.getElementById('btn-install-app');
  if (installBtn) {
    installBtn.innerHTML = '✓ ¡Instalado!';
    setTimeout(() => { installBtn.style.display = 'none'; }, 3500);
  }
});

function handlePwaInstallClick() {
  playSound('click');
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] Usuario aceptó la instalación');
      } else {
        console.log('[PWA] Usuario pospuso la instalación');
      }
      deferredInstallPrompt = null;
    });
  } else {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      alert('🍜 ¡Ramen Mania ya está instalado y ejecutándose como App nativa en este dispositivo!');
      return;
    }

    if (isIOS) {
      alert('📲 Para instalar Ramen Mania en tu iPhone o iPad:\n\n1. Toca el botón Compartir de Safari (icono cuadrado con flecha hacia arriba ⎋ en la barra de Safari).\n2. Desplaza hacia abajo y toca "Agregar a pantalla de inicio" (o "Add to Home Screen").\n3. ¡Listo! Se creará el acceso directo con el icono del Chef Shimaya para jugar a pantalla completa sin barras.');
    } else {
      alert('📲 Para instalar Ramen Mania desde tu navegador:\n\n1. En Google Chrome / Edge / Brave: Toca el menú de 3 puntos (⋮) o el botón de instalar ⊕ en la barra de direcciones.\n2. Toca "Instalar Ramen Mania" o "Agregar a pantalla principal".\n3. ¡Listo! Se descargará el icono oficial del Chef Shimaya y podrás jugar directamente desde tu pantalla de inicio.');
    }
  }
}

// Registro limpio del Service Worker (arranque silencioso y actualización automática)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => {
      console.log('[PWA] Service Worker registrado:', reg.scope);
      // Forzar chequeo de actualización en cada apertura de la app instalada
      if (reg.update) {
        reg.update().catch(() => {});
      }
    })
    .catch(err => {
      console.warn('[PWA] Error registrando Service Worker:', err);
    });

  // Antes la página se recargaba SIEMPRE al activarse un service worker (también en la primera instalación y a mitad de partida):
  // al abrir la app instalada se cargaba dos veces. Ahora: primera instalación = no se recarga (ya es la última versión);
  // actualización = se recarga solo en el menú de inicio; en partida se avisa y se aplica al volver al menú.
  const swHadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!swHadController || window._swRefreshed) return;
    window._swRefreshed = true;
    const start = document.getElementById('start-screen');
    const inMenu = !start || getComputedStyle(start).display !== 'none';
    if (inMenu) { window.location.reload(); return; }
    window._updatePending = true;
    const b = document.getElementById('app-version-btn'); if (b) b.style.borderColor = '#ffb300';
    try { showStationToast('🔄 Hay una versión nueva: se aplicará al volver al menú.'); } catch (e) {}
  });
}

function togglePause() {
  if (gameState.isGameOver) return;
  gameState.isPaused = !gameState.isPaused;
  document.getElementById("btn-pause").textContent = gameState.isPaused ? "▶️" : "⏸️";
}

function openRecipeModal() {
  initRecipeTable();
  const titleEl = document.getElementById("modal-recipe-title");
  if (titleEl) {
    titleEl.textContent = `📖 Recetario (${getCurrentLevelConfig().name})`;
  }
  const modal = document.getElementById("recipe-modal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeRecipeModal() {
  document.getElementById("recipe-modal").classList.remove("active");
}

function openSecretosModal() {
  playSound('click');
  const modal = document.getElementById("secretos-modal");
  if (modal) {
    modal.classList.add("active");
    renderSecretosCards(currentSecretFilter || 'todos');
  }
}

function closeSecretosModal() {
  playSound('click');
  const modal = document.getElementById("secretos-modal");
  if (modal) modal.classList.remove("active");
}

/* ==========================================================================
   CONFIGURACIÓN DE ORDEN PERSONALIZADO DE INGREDIENTES (TABLERO RAMEN)
   ========================================================================== */
let selectedSwapTile = null;

function getCatColor(cat) {
  switch (cat) {
    case 'bases': return '#00b0ff';
    case 'salsas': return '#ba68c8';
    case 'proteinas': return '#ff5722';
    case 'vegetales': return '#4caf50';
    default: return '#ffb300';
  }
}

function getCatDisplay(cat) {
  switch (cat) {
    case 'bases': return 'Base';
    case 'salsas': return 'Salsa';
    case 'proteinas': return 'Proteína';
    case 'vegetales': return 'Vegetal';
    default: return 'Ingrediente';
  }
}

function openIngredientOrderModal() {
  try { playSound('click'); } catch(e) {}
  const modal = document.getElementById("ingredient-order-modal");
  if (!modal) return;

  let currentOrder = getCustomIngredientOrder();
  if (!currentOrder || !Array.isArray(currentOrder) || currentOrder.length === 0) {
    currentOrder = INGREDIENTES.map(i => i.id);
  } else {
    // Asegurar que todos los 28 ingredientes existan en la lista (por si faltara alguno)
    const existing = new Set(currentOrder.map(Number));
    INGREDIENTES.forEach(i => {
      if (!existing.has(i.id)) currentOrder.push(i.id);
    });
  }

  renderConfigOrderGrid(currentOrder);
  modal.classList.add("active");
  modal.style.display = "flex";
}

function closeIngredientOrderModal() {
  try { playSound('click'); } catch(e) {}
  const modal = document.getElementById("ingredient-order-modal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
  clearSwapSelection();
}

function renderConfigOrderGrid(orderIds) {
  const grid = document.getElementById("config-ingredients-grid");
  if (!grid) return;
  grid.innerHTML = "";
  clearSwapSelection();

  orderIds.forEach((id, idx) => {
    const ing = INGREDIENTES.find(i => i.id === id);
    if (!ing) return;

    const tile = document.createElement("div");
    tile.className = "config-ing-tile";
    tile.dataset.ingId = ing.id;
    tile.dataset.index = idx;
    tile.title = `${ing.display} (${getCatDisplay(ing.cat)}) - Arrastra para reordenar`;

    const catColor = getCatColor(ing.cat);
    const catLabel = getCatDisplay(ing.cat);

    const artHtml = ing.img 
      ? `<img src="${ing.img}" class="pixel-sprite-large" alt="${ing.display}" style="width:24px; height:24px; pointer-events:none;">`
      : `<div style="font-size:22px; pointer-events:none;">${ing.icon}</div>`;

    tile.innerHTML = `
      <div class="config-tile-num" style="background:${catColor};">#${idx + 1}</div>
      <div class="config-tile-grip">⠿</div>
      ${artHtml}
      <div class="config-tile-name">${ing.display}</div>
      <div class="config-tile-cat" style="color:${catColor};">${catLabel}</div>
    `;

    setupTileDragAndTap(tile, grid);
    grid.appendChild(tile);
  });
}

function setupTileDragAndTap(tile, grid) {
  let isDown = false;
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let proxyEl = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  tile.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    isDown = true;
    startX = e.clientX;
    startY = e.clientY;
    isDragging = false;

    const rect = tile.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    const onPointerMove = (moveEvent) => {
      if (!isDown) return;
      const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);

      if (!isDragging && dist > 5) {
        isDragging = true;
        tile.classList.add("is-dragging");

        // Crear elemento flotante para arrastre suave
        proxyEl = tile.cloneNode(true);
        proxyEl.className = "config-ing-tile config-ing-tile-proxy";
        proxyEl.style.width = `${rect.width}px`;
        proxyEl.style.height = `${rect.height}px`;
        proxyEl.style.left = `${moveEvent.clientX - dragOffsetX}px`;
        proxyEl.style.top = `${moveEvent.clientY - dragOffsetY}px`;
        document.body.appendChild(proxyEl);

        try { playSound('add'); } catch(err) {}
      }

      if (isDragging && proxyEl) {
        proxyEl.style.left = `${moveEvent.clientX - dragOffsetX}px`;
        proxyEl.style.top = `${moveEvent.clientY - dragOffsetY}px`;

        // Detectar casilla sobre la que se arrastra
        const elemBelow = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const overTile = elemBelow ? elemBelow.closest(".config-ing-tile:not(.config-ing-tile-proxy)") : null;

        if (overTile && overTile !== tile && overTile.parentElement === grid) {
          const children = Array.from(grid.children);
          const tileIdx = children.indexOf(tile);
          const overIdx = children.indexOf(overTile);

          // Cambiar posición en vivo ("los ingredientes van cambiando de posición")
          if (tileIdx < overIdx) {
            grid.insertBefore(tile, overTile.nextSibling);
          } else {
            grid.insertBefore(tile, overTile);
          }

          refreshGridSlotNumbers(grid);
          try { playSound('click'); } catch(err) {}
        }
      }
    };

    const onPointerUp = (upEvent) => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (isDragging) {
        if (proxyEl) {
          proxyEl.remove();
          proxyEl = null;
        }
        tile.classList.remove("is-dragging");
        refreshGridSlotNumbers(grid);
        try { playSound('ding'); } catch(err) {}
        isDragging = false;
        isDown = false;
        return;
      }

      isDown = false;

      // Toque/clic para selección o intercambio directo
      handleTileTap(tile, grid);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  });
}

function handleTileTap(tile, grid) {
  if (!selectedSwapTile) {
    selectedSwapTile = tile;
    tile.classList.add("selected-for-swap");
    updateSwapIndicator(tile);
    try { playSound('click'); } catch(e) {}
  } else if (selectedSwapTile === tile) {
    clearSwapSelection();
    try { playSound('click'); } catch(e) {}
  } else {
    // Intercambiar posiciones entre selectedSwapTile y tile
    swapTiles(selectedSwapTile, tile, grid);
    clearSwapSelection();
    refreshGridSlotNumbers(grid);
    try { playSound('ding'); } catch(e) {}
  }
}

function clearSwapSelection() {
  if (selectedSwapTile) {
    selectedSwapTile.classList.remove("selected-for-swap");
    selectedSwapTile = null;
  }
  updateSwapIndicator(null);
}

function swapTiles(tileA, tileB, grid) {
  const nextA = tileA.nextSibling;
  const nextB = tileB.nextSibling;
  if (nextA === tileB) {
    grid.insertBefore(tileB, tileA);
  } else if (nextB === tileA) {
    grid.insertBefore(tileA, tileB);
  } else {
    grid.insertBefore(tileA, nextB);
    grid.insertBefore(tileB, nextA);
  }
}

function nudgeSelectedTile(direction) {
  if (!selectedSwapTile) return;
  const grid = document.getElementById("config-ingredients-grid");
  if (!grid) return;
  const children = Array.from(grid.children);
  const idx = children.indexOf(selectedSwapTile);
  if (direction === -1 && idx > 0) {
    grid.insertBefore(selectedSwapTile, children[idx - 1]);
    refreshGridSlotNumbers(grid);
    try { playSound('click'); } catch(e) {}
  } else if (direction === 1 && idx < children.length - 1) {
    grid.insertBefore(selectedSwapTile, children[idx + 1].nextSibling);
    refreshGridSlotNumbers(grid);
    try { playSound('click'); } catch(e) {}
  }
  updateSwapIndicator(selectedSwapTile);
}

function updateSwapIndicator(tile) {
  const txt = document.getElementById("swap-nudge-text");
  const controls = document.getElementById("swap-nudge-controls");
  if (!txt || !controls) return;

  if (tile) {
    const id = Number(tile.dataset.ingId);
    const ing = INGREDIENTES.find(i => i.id === id);
    const idx = Number(tile.dataset.index) + 1;
    txt.innerHTML = `📌 Seleccionado: <strong style="color:#00e5ff;">${ing ? ing.display : 'Ingrediente'}</strong> (Ranura #${idx}) — Toca otro para intercambiar o muévelo con las flechas:`;
    controls.style.display = "flex";
  } else {
    txt.innerHTML = "💡 Toca un ingrediente para seleccionarlo y moverlo con precisión o arrástralo directamente.";
    controls.style.display = "none";
  }
}

function refreshGridSlotNumbers(grid) {
  const tiles = grid.querySelectorAll(".config-ing-tile");
  tiles.forEach((t, i) => {
    t.dataset.index = i;
    const numEl = t.querySelector(".config-tile-num");
    if (numEl) numEl.textContent = `#${i + 1}`;
  });
}

function saveIngredientOrder() {
  const grid = document.getElementById("config-ingredients-grid");
  if (!grid) return;
  const tiles = Array.from(grid.querySelectorAll(".config-ing-tile"));
  const newOrder = tiles.map(t => Number(t.dataset.ingId));
  localStorage.setItem("ramen_custom_ingredient_order", JSON.stringify(newOrder));

  // Actualizar la estación en el juego si estuviera activa
  if (typeof renderPantryGrid === "function") {
    renderPantryGrid();
  }

  showIngOrderToast("✅ ¡Orden de ingredientes guardado exitosamente!");
  try { playSound('ding'); } catch(e) {}
}

function resetIngredientOrderDefault() {
  const defaultOrder = INGREDIENTES.map(i => i.id);
  renderConfigOrderGrid(defaultOrder);
  showIngOrderToast("🔄 Orden restablecido al predeterminado");
  try { playSound('click'); } catch(e) {}
}

function sortIngredientOrderByCategory() {
  const catPriority = { bases: 1, salsas: 2, proteinas: 3, vegetales: 4 };
  const sorted = [...INGREDIENTES].sort((a, b) => {
    const prioA = catPriority[a.cat] || 99;
    const prioB = catPriority[b.cat] || 99;
    if (prioA !== prioB) return prioA - prioB;
    return a.id - b.id;
  }).map(i => i.id);
  renderConfigOrderGrid(sorted);
  showIngOrderToast("🔀 Ingredientes agrupados por categoría");
  try { playSound('click'); } catch(e) {}
}

function showIngOrderToast(msg) {
  let toast = document.getElementById("config-order-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "config-order-toast";
    toast.className = "config-order-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
