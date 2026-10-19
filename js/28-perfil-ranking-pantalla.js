/* Módulo 28-perfil-ranking-pantalla — Perfil, registro, récords, pantalla completa y PWA.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

/** Refresca las insignias del perfil: la de la partida y la tarjeta de la pantalla principal. */
function updateStartPlayerCard() { renderLinkedUserBadges(); }

function renderLinkedUserBadges() {
  const p = DeviceManager.currentPlayer;
  const hudBadge = document.getElementById("hud-linked-user");
  const hudName = document.getElementById("hud-user-name");
  const hudAvatar = document.getElementById("hud-user-avatar");
  if (p && p.playerName) {
    if (hudBadge) hudBadge.style.display = "inline-flex";
    if (hudName) hudName.textContent = `Chef ${p.playerName}`;
    if (hudAvatar) hudAvatar.textContent = p.avatar || "🍜";
  } else if (hudBadge) {
    hudBadge.style.display = "none";
  }
  try { if (window.Inicio) Inicio.refresh(); } catch (e) {}
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

  if (startSelectedMode === 'TRAINING') {
    if (typeof openLevelRetos === 'function') openLevelRetos();
    return;
  }

  if (startSelectedMode === 'FREE') {
    executeStartGame();
    return;
  }

  if (!isTutorialCompleted()) {
    showLockedModeToast("🔒 Completa primero la lección de Ramen del Maestro para jugar este modo.");
    try { Modos.learn(); } catch (e) {}
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

  gameState.gameMode = isMultiplayerSession() ? 'MULTI' : startSelectedMode;   // Online tiene su propio modo: no hereda el reloj ni las reglas de la última partida (Campaña, Rash, Cocina libre…)
  statsBump('g');
  if (startSelectedMode !== 'TRAINING') gameState.training = null;
  const freeOnly = window.startFreeAreas; window.startFreeAreas = null;   // desde el local isométrico: cocina libre de una sola área
  gameState.free = startSelectedMode === 'FREE' ? { auto: true, areas: (freeOnly && freeOnly.length) ? [...freeOnly] : [...FREE_AREAS] } : null;
  if (isMultiplayerSession()) {
    startLevel(0);
  } else if (startSelectedMode === 'NORMAL') {
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
function saveLocalScore(record) {
  try {
    const raw = safeStorage.getItem('ramen_local_scores') || "[]";
    const scores = JSON.parse(raw);
    scores.push(record);
    safeStorage.setItem('ramen_local_scores', JSON.stringify(scores));
  } catch(e) {}
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

/** Paga la compensación del hito de Rash (cada 5 rondas) una sola vez por hito; devuelve las propinas pagadas (0 si no es hito o ya se cobró). */
function rashClaimMilestone(round, key) {
  try {
    const bonus = rashMilestoneBonus(round);
    if (!bonus) return 0;
    const k = key || 'ramen_rash_hito';
    if (round <= parseInt(safeStorage.getItem(k) || '0')) return 0;
    safeStorage.setItem(k, round);
    addPropinas(bonus);
    return bonus;
  } catch (e) { return 0; }
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
  const installBtn = document.getElementById('btn-install-app');
  if (installBtn) {
    installBtn.style.display = 'inline-flex';
  }
});

window.addEventListener('appinstalled', (evt) => {
  deferredInstallPrompt = null;
  const installBtn = document.getElementById('btn-install-app');
  if (installBtn) {
    installBtn.innerHTML = '✓ ¡Instalado!';
    setTimeout(() => { installBtn.style.display = 'none'; }, 3500);
  }
});

{
  navigator.serviceWorker.register('./sw.js')
    .then(reg => {
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

/* El ranking y el orden de ingredientes viven ahora en pantallas-bs.js (Ajustes, Clasificaciones y Orden de ingredientes). */
