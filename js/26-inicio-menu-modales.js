/* Módulo 26-inicio-menu-modales — Estado del modo elegido, avisos del sistema y atajos de teclado.
   (La pantalla de inicio clásica y su menú «Más» se eliminaron en v201: la pantalla principal es home.js.)
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

let startSelectedMode = 'NORMAL';
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
  if (text) text.textContent = msg || "Completa primero la lección de Ramen del Maestro para desbloquear el juego.";
  toast.classList.add("show");
  try { playSound('fail'); } catch(e) {}
  if (lockedToastTimer) clearTimeout(lockedToastTimer);
  lockedToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

/** Elige el modo con el que se arranca la partida (NORMAL, RASH, FREE o TRAINING). Campaña y Rash piden haber hecho la lección de Ramen. */
function setStartSelectedMode(mode) {
  if (mode !== 'TRAINING' && mode !== 'FREE' && !isTutorialCompleted()) {
    showLockedModeToast("🔒 Completa primero la lección de Ramen del Maestro para jugar este modo.");
    if ('vibrate' in navigator) {
      try { navigator.vibrate([25, 35, 25]); } catch(e) {}
    }
    return;
  }
  startSelectedMode = mode;
  try { playSound('add'); } catch(e) {}
  if ('vibrate' in navigator) {
    try { navigator.vibrate(12); } catch(e) {}
  }
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
    if (m.style.display === "flex" || m.classList.contains("active")) {
      m.style.display = "none";
      m.classList.remove("active");
    }
  });
  if (typeof clearSwapSelection === "function") clearSwapSelection();
}

// Atajos globales de teclado (PC). Dentro de la partida solo M y F; en la pantalla principal también el resto.
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

  if (isStartVisible && !document.querySelector('#mds, #tll, #rcb, #svc, #hp, #cm-root, #cmb-root, #jp-screen, #rc-screen, .modal-overlay.active')) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (window.Home) Home.play();
    } else if (e.key === "r" || e.key === "R") {
      openLeaderboardModal();
    } else if (e.key === "s" || e.key === "S") {
      if (window.Taller) Taller.open('secretos');
    } else if (e.key === "l" || e.key === "L") {
      if (window.Recetario) Recetario.open();
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
