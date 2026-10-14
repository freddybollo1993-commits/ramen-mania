/* Módulo 26-inicio-menu-modales — Menú de inicio clásico y modales del sistema.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

/* ==========================================================================
   SISTEMA DE PANTALLA DE INICIO Y MODALES DE USUARIO
   ========================================================================== */
let startSelectedMode = (function () {
  try {
    const done = localStorage.getItem('ramen_tutorial_completed') === 'true';
    const last = localStorage.getItem('ramen_last_mode');
    if (!done) return 'TUTORIAL';
    return ['TRAINING', 'FREE', 'NORMAL', 'RASH', 'TUTORIAL'].includes(last) ? last : 'TRAINING';
  } catch (e) { return 'TUTORIAL'; }
})();
let regSelectedAvatar = '🍜';
let profSelectedAvatar = '🍜';

function isTutorialCompleted() {
  return safeStorage.getItem('ramen_tutorial_completed') === 'true';
}

let lockedToastTimer = null;
function showLockedModeToast(msg) {
  const toast = document.getElementById("mode-locked-toast");
  const text = document.getElementById("mode-locked-toast-text");
  if (!toast) return;
  if (text) text.textContent = msg || "Completa primero el Modo Tutorial para desbloquear el Modo Normal y Rash.";
  toast.classList.add("show");
  try { playSound('fail'); } catch(e) {}
  if (lockedToastTimer) clearTimeout(lockedToastTimer);
  lockedToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// Panel con el detalle del modo elegido (copia el texto de su tarjeta, que se mantiene actualizado).
function renderStartModeDetail() {
  const el = document.getElementById('start-mode-detail');
  if (!el) return;
  const ids = { TUTORIAL: 'tutorial', TRAINING: 'training', FREE: 'free', NORMAL: 'normal', RASH: 'rash' };
  const card = document.getElementById('start-mode-card-' + (ids[startSelectedMode] || 'tutorial'));
  if (!card) return;
  const name = card.querySelector('.start-mode-name');
  const desc = card.querySelector('.start-mode-desc');
  const status = card.querySelector('.start-mode-status');
  const icon = card.querySelector('.start-mode-icon');
  el.innerHTML = `<div class="start-detail-main"><div class="start-detail-title">${icon ? icon.textContent : ''} ${name ? name.textContent : ''}</div><div class="start-detail-desc">${desc ? desc.textContent.trim() : ''}</div></div><div class="start-detail-status">${status ? status.innerHTML : ''}</div>`;
}

function toggleStartMoreMenu(e) {
  if (e) e.stopPropagation();
  const m = document.getElementById('start-more-menu');
  if (m) m.classList.toggle('open');
}
document.addEventListener('click', e => {
  const m = document.getElementById('start-more-menu');
  if (m && m.classList.contains('open') && !e.target.closest('.start-more-wrap')) m.classList.remove('open');
});

function updateStartModesDisplay() {
  setTimeout(renderStartModeDetail, 0);
  const freeCard = document.getElementById('start-mode-card-free');
  if (freeCard) freeCard.classList.toggle('active', startSelectedMode === 'FREE');
  const trnCard = document.getElementById('start-mode-card-training');
  if (trnCard) {
    trnCard.classList.toggle('active', startSelectedMode === 'TRAINING');
    const st = document.getElementById('start-training-stats-text');
    if (st) {
      const next = trainingNextChallenge();
      st.innerHTML = next
        ? `🏋️ Retos <strong>${trainingDoneCount()}/${TRAINING_CHALLENGES.length}</strong> · Próximo: ${next.title}`
        : '🏆 <strong>Recorrido completo</strong> · mejora tus tiempos';
    }
  }
  const tutCompleted = isTutorialCompleted();
  const tutCard = document.getElementById("start-mode-card-tutorial");
  const normalCard = document.getElementById("start-mode-card-normal");
  const rashCard = document.getElementById("start-mode-card-rash");

  if (normalCard) {
    if (!tutCompleted) {
      normalCard.classList.add("locked");
    } else {
      normalCard.classList.remove("locked");
    }
    normalCard.classList.toggle("active", startSelectedMode === 'NORMAL');
  }

  if (rashCard) {
    if (!tutCompleted) {
      rashCard.classList.add("locked");
    } else {
      rashCard.classList.remove("locked");
    }
    rashCard.classList.toggle("active", startSelectedMode === 'RASH');
  }

  if (tutCard) {
    tutCard.classList.toggle("active", startSelectedMode === 'TUTORIAL');
    const tutBadge = tutCard.querySelector(".start-mode-badge");
    const tutStatus = document.getElementById("start-tutorial-stats-text");
    if (tutBadge && tutStatus) {
      if (tutCompleted) {
        tutBadge.textContent = "COMPLETADO ✓";
        tutBadge.style.background = "#2e7d32";
        tutBadge.style.color = "#fff";
        tutStatus.innerHTML = `✅ <strong>Lecciones ${typeof Guia !== 'undefined' ? Guia.doneCount() : 0}/4</strong> (toca para elegir)`;
      } else {
        tutBadge.textContent = "PASO INICIAL";
        tutBadge.style.background = "#00e5ff";
        tutBadge.style.color = "#002b36";
        tutStatus.innerHTML = `⭐ <strong>Completa aquí para desbloquear el juego</strong>`;
      }
    }
  }

  const btnPlay = document.getElementById("btn-start-play");
  if (btnPlay) {
    if (startSelectedMode === 'TUTORIAL') {
      const isRepeat = isTutorialCompleted();
      btnPlay.innerHTML = isRepeat 
        ? '<span style="font-size: 22px;">🎓</span><span>REPETIR TUTORIAL COMPLETO</span><span class="play-keyboard-tag desktop-only">[ESPACIO]</span>'
        : '<span style="font-size: 22px;">🎓</span><span>INICIAR TUTORIAL</span><span class="play-keyboard-tag desktop-only">[ESPACIO]</span>';
      btnPlay.style.background = "linear-gradient(135deg, #00b0ff 0%, #0091ea 60%, #01579b 100%)";
      btnPlay.style.borderColor = "#80d8ff";
      btnPlay.style.boxShadow = "0 5px 0 #002f6c, 0 0 20px rgba(0, 176, 255, 0.6)";
    } else if (startSelectedMode === 'FREE') {
      btnPlay.innerHTML = '<span style="font-size: 22px;">🌿</span><span>COCINAR LIBRE</span><span class="play-keyboard-tag desktop-only">[ESPACIO]</span>';
      btnPlay.style.background = "linear-gradient(135deg, #66bb6a 0%, #43a047 60%, #1b5e20 100%)";
      btnPlay.style.borderColor = "#c8e6c9";
      btnPlay.style.boxShadow = "0 5px 0 #0b2e13, 0 0 20px rgba(102, 187, 106, 0.6)";
    } else if (startSelectedMode === 'TRAINING') {
      btnPlay.innerHTML = '<span style="font-size: 22px;">🏋️</span><span>ENTRENAR</span><span class="play-keyboard-tag desktop-only">[ESPACIO]</span>';
      btnPlay.style.background = "linear-gradient(135deg, #26a69a 0%, #00897b 60%, #004d40 100%)";
      btnPlay.style.borderColor = "#b2dfdb";
      btnPlay.style.boxShadow = "0 5px 0 #00251f, 0 0 20px rgba(38, 166, 154, 0.6)";
    } else if (startSelectedMode === 'RASH') {
      btnPlay.innerHTML = '<span style="font-size: 22px;">⚡</span><span>JUGAR RASH</span><span class="play-keyboard-tag desktop-only">[ESPACIO]</span>';
      btnPlay.style.background = "linear-gradient(135deg, #ff9800 0%, #e65100 60%, #bf360c 100%)";
      btnPlay.style.borderColor = "#ffe082";
      btnPlay.style.boxShadow = "0 5px 0 #4e1900, 0 0 20px rgba(255, 152, 0, 0.6)";
    } else {
      btnPlay.innerHTML = '<span style="font-size: 22px;">▶️</span><span>JUGAR CAMPAÑA</span><span class="play-keyboard-tag desktop-only">[ESPACIO]</span>';
      btnPlay.style.background = "linear-gradient(135deg, #ff9800 0%, #d32f2f 60%, #b71c1c 100%)";
      btnPlay.style.borderColor = "#ffe082";
      btnPlay.style.boxShadow = "0 5px 0 #5f0000, 0 0 20px rgba(255, 152, 0, 0.6)";
    }
  }
}

function setStartSelectedMode(mode) {
  if (mode !== 'TUTORIAL' && mode !== 'TRAINING' && mode !== 'FREE' && !isTutorialCompleted()) {
    showLockedModeToast("🔒 Completa primero el Modo Tutorial para desbloquear el Modo Normal y Rash.");
    const cardEl = mode === 'NORMAL' 
      ? document.getElementById("start-mode-card-normal") 
      : document.getElementById("start-mode-card-rash");
    if (cardEl) {
      cardEl.classList.remove("card-shake");
      void cardEl.offsetWidth; // trigger reflow
      cardEl.classList.add("card-shake");
    }
    if ('vibrate' in navigator) {
      try { navigator.vibrate([25, 35, 25]); } catch(e) {}
    }
    return;
  }
  startSelectedMode = mode;
  safeStorage.setItem('ramen_last_mode', mode);
  try { playSound('add'); } catch(e) {}
  if ('vibrate' in navigator) {
    try { navigator.vibrate(12); } catch(e) {}
  }
  updateStartModesDisplay();
}

function handleTutorialCardClick() {
  if (startSelectedMode === 'TUTORIAL') {
    TutorialManager.start();
    return;
  }
  setStartSelectedMode('TUTORIAL');
}

function openShortcutsModal() {
  try { playSound('click'); } catch(e) {}
  const m = document.getElementById("shortcuts-modal");
  if (m) m.style.display = "flex";
}

function closeShortcutsModal() {
  try { playSound('click'); } catch(e) {}
  const m = document.getElementById("shortcuts-modal");
  if (m) m.style.display = "none";
}

function showDeviceInfoModal() {
  try { playSound('click'); } catch(e) {}
  const devId = (typeof DeviceManager !== 'undefined' && DeviceManager.deviceId) ? DeviceManager.deviceId : "DEV-LOCAL";
  const devInfo = (typeof DeviceManager !== 'undefined' && DeviceManager.deviceInfoText) ? DeviceManager.deviceInfoText : "Dispositivo";
  showLockedModeToast(`🛡️ ${devInfo} · ID: ${devId} (Seguro)`);
}

function closeAllActiveModals() {
  const openModals = document.querySelectorAll(".modal-overlay");
  openModals.forEach(m => {
    if (m.id !== 'tutorial-completed-modal' && (m.style.display === "flex" || m.classList.contains("active"))) {
      m.style.display = "none";
      m.classList.remove("active");
    }
  });
  if (typeof clearSwapSelection === "function") clearSwapSelection();
}

// Atajos globales de teclado arcade
window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
    return;
  }
  
  const startScr = document.getElementById("start-screen");
  const isStartVisible = startScr && !startScr.classList.contains("hidden") && startScr.style.display !== "none";

  if (e.key === "Escape") {
    closeAllActiveModals();
    return;
  }

  if (e.key === "m" || e.key === "M") {
    toggleAudioMute();
    return;
  }

  if (e.key === "f" || e.key === "F") {
    toggleFullScreen();
    return;
  }

  if (isStartVisible) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleStartPlayClick();
    } else if (e.key === "1") {
      setStartSelectedMode('TUTORIAL');
    } else if (e.key === "2") {
      setStartSelectedMode('TRAINING');
    } else if (e.key === "3") {
      setStartSelectedMode('FREE');
    } else if (e.key === "4") {
      setStartSelectedMode('NORMAL');
    } else if (e.key === "5") {
      setStartSelectedMode('RASH');
    } else if (e.key === "r" || e.key === "R") {
      openLeaderboardModal();
    } else if (e.key === "s" || e.key === "S") {
      openSecretosModal();
    } else if (e.key === "l" || e.key === "L") {
      openRecipeModal();
    } else if (e.key === "o" || e.key === "O") {
      openIngredientOrderModal();
    } else if (e.key === "?" || e.key === "h" || e.key === "H") {
      openShortcutsModal();
    }
  }
});

async function forceAppCacheUpdate() {
  try {
    try { playSound('click'); } catch(e) {}
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }
    }
  } catch(e) {
    console.warn('Error limpiando caché:', e);
  }
  window.location.href = window.location.origin + window.location.pathname + '?reload=' + Date.now();
}
