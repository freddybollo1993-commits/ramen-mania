/* Módulo 27-tutorial-antiguo — Tutorial antiguo (TutorialManager).
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

/* ==========================================================================
   DATOS Y GESTOR DEL MODO TUTORIAL (3 FASES INTERACTIVAS)
   ========================================================================== */
const TUTORIAL_DATA = [
  // --- FASE 1: PANTALLA DE INICIO (5 pasos) ---
  {
    phase: 1,
    phaseClass: "phase-1",
    targetId: "start-logo-box",
    title: "🍜 Fase 1: Menú de Inicio",
    text: "Toca 'Sig. ▶' para recorrer el menú, o '🍳 Cocina' para cocinar ramen ya.",
    screen: "START"
  },
  {
    phase: 1,
    phaseClass: "phase-1",
    targetId: "start-linked-user-bar",
    title: "👤 Tu Perfil de Chef",
    text: "Toca esta tarjeta superior para personalizar tu alias, avatar y registrar tus récords en el Ranking.",
    screen: "START"
  },
  {
    phase: 1,
    phaseClass: "phase-1",
    targetId: "start-modes-grid",
    title: "🎮 Selector de Modos",
    text: "Elige un modo: Entrenamiento (50 retos guiados), Cocina libre (todo el catálogo, sin prisa), Campaña (8 niveles) o Rash. Campaña y Rash se desbloquean al completar este tutorial.",
    screen: "START"
  },
  {
    phase: 1,
    phaseClass: "phase-1",
    targetId: "btn-start-play",
    title: "▶️ Botón JUGAR",
    text: "Toca 'Sig. ▶' para recorrer las opciones del menú y luego ingresar a la cocina.",
    screen: "START"
  },
  {
    phase: 1,
    phaseClass: "phase-1",
    targetId: "start-btn-row-box",
    title: "⚙️ Acciones Rápidas",
    text: "Accede al Ranking global de Chefs, los Secretos culinarios y el Recetario completo.",
    screen: "START"
  },

  // --- FASE 2: SUBDIVISIONES DE LA PANTALLA DE COCINA (6 pasos) ---
  {
    phase: 2,
    phaseClass: "phase-2",
    targetId: "game-hud-bar",
    title: "⏱️ Fase 2: Barra HUD",
    text: "Monitorea tiempo restante, ganancias en Soles (S/) y meta del restaurante.",
    screen: "KITCHEN"
  },
  {
    phase: 2,
    phaseClass: "phase-2",
    targetId: "customers-container",
    title: "👥 Clientes",
    text: "Piden ramen con receta específica; atiende antes que se agote su paciencia.",
    screen: "KITCHEN"
  },
  {
    phase: 2,
    phaseClass: "phase-2",
    targetId: "prep-board-box",
    title: "🥢 Despensa",
    text: "Filtra ingredientes por pestañas (Bases, Salsas, Proteínas, Toppings). Mantén pulsado uno y arrástralo hasta el plato.",
    screen: "KITCHEN"
  },
  {
    phase: 2,
    phaseClass: "phase-2",
    targetId: "cook-stations-panel",
    title: "🔥 Hornillas Activas",
    text: "Hierve fideos, calienta caldos Shio/Tonkotsu y sopletea láminas de Chasu.",
    screen: "KITCHEN"
  },
  {
    phase: 2,
    phaseClass: "phase-2",
    targetId: "bowls-dock-box",
    title: "🥣 Cuencos Donburi",
    text: "Toca un cuenco para activarlo y armar hasta 3 órdenes de ramen a la vez.",
    screen: "KITCHEN"
  },
  {
    phase: 2,
    phaseClass: "phase-2",
    targetId: "hud-side-actions",
    title: "⚡ Acciones Rápidas",
    text: "Pausa la partida, activa pantalla completa o consulta el recetario rápido.",
    screen: "KITCHEN"
  },

  // --- FASE 3: MECÁNICAS DE JUEGO Y ARMADO (5 pasos) ---
  {
    phase: 3,
    phaseClass: "phase-3",
    targetId: "btn-cook-noodles",
    title: "🥢 Fase 3: Fideos (Toque)",
    text: "¡Toca la olla para hervir fideos (4s)! Al brillar en verde, vuelve a tocar para recoger.",
    screen: "KITCHEN"
  },
  {
    phase: 3,
    phaseClass: "phase-3",
    targetId: "btn-heat-shio",
    title: "🥣 Caldos (Mantener pulsado)",
    text: "Mantén presionado el botón 3 segundos seguidos con tu dedo hasta que hierva.",
    screen: "KITCHEN"
  },
  {
    phase: 3,
    phaseClass: "phase-3",
    targetId: "btn-flame-chasu",
    title: "🥩 Chasu (Mantener soplete)",
    text: "Mantén pulsado el soplete 2 segundos continuos para dorar una lámina de carne.",
    screen: "KITCHEN"
  },
  {
    phase: 3,
    phaseClass: "phase-3",
    targetId: "bowl-card-0",
    title: "🍜 Armado en Cuenco",
    text: "Arrastra los ingredientes hasta tu cuenco: 1° Fideos → 2° Caldo → 3° Salsa → 4° Toppings. Toca uno ya puesto para retirarlo.",
    screen: "KITCHEN"
  },
  {
    phase: 3,
    phaseClass: "phase-3",
    targetId: "customers-container",
    title: "💰 Servir a Kenji",
    text: "Toca al cliente con su plato listo para servirlo. Verás ⭐ en el pedido: 3 estrellas pagan más y dejan propina doble.",
    screen: "KITCHEN"
  },
  {
    phase: 3,
    phaseClass: "phase-3",
    targetId: "kitchen-area-tabs",
    title: "🔓 Más áreas de cocina",
    text: "A medida que subes de nivel se abren Salteado, Makis y Frituras. Cada una trae su propia estación; las que ves con 🔒 aún están cerradas.",
    screen: "KITCHEN"
  },
  {
    phase: 3,
    phaseClass: "phase-3",
    targetId: "hud-stats-bar",
    title: "🧧 Propinas y ♻️ Dashi",
    text: "Las propinas se guardan entre partidas y servirán para comprar mejoras. Los recortes (♻️) se convierten en dashi gratis.",
    screen: "KITCHEN"
  }
];

const TutorialManager = {
  currentStep: 0,
  isActive: false,
  _listenersAttached: false,

  // El tutorial ahora es guiado e interactivo (guia.js): se hace cocinando 1 plato de cada área.
  start() {
    if (typeof Guia !== 'undefined') { Guia.begin(); return; }
    this.startLegacy();
  },

  startLegacy() {
    this.isActive = true;
    this.currentStep = 0;
    const overlay = document.getElementById("tutorial-overlay");
    if (overlay) overlay.classList.add("active");
    this.attachOverlayListeners();
    this.renderStep(0);
    window.addEventListener("resize", this._onResize);
    window.addEventListener("orientationchange", this._onResize);
    document.addEventListener("fullscreenchange", this._onResize);
    document.addEventListener("webkitfullscreenchange", this._onResize);
    const startScr = document.getElementById("start-screen");
    if (startScr) {
      startScr.addEventListener("scroll", this._onScroll);
    }
  },

  attachOverlayListeners() {
    if (this._listenersAttached) return;
    this._listenersAttached = true;

    const overlay = document.getElementById("tutorial-overlay");
    const spotlight = document.getElementById("tutorial-spotlight-box");

    if (overlay) {
      overlay.addEventListener("click", (e) => {
        // Tocar el fondo oscuro fuera de la tarjeta avanza de forma fluida
        if (!e.target.closest("#tutorial-card") && !e.target.closest("#tutorial-spotlight-box")) {
          TutorialManager.next();
        }
      });
    }

    if (spotlight) {
      spotlight.addEventListener("click", (e) => {
        e.stopPropagation();
        const step = TUTORIAL_DATA[TutorialManager.currentStep];
        if (!step) {
          TutorialManager.next();
          return;
        }

        // Si es una estación o cuenco interactivo, accionar su click
        const target = document.getElementById(step.targetId);
        if (target && (step.targetId === 'btn-cook-noodles' || step.targetId === 'btn-heat-shio' || step.targetId === 'btn-flame-chasu' || step.targetId === 'bowl-card-0')) {
          try {
            target.click();
          } catch(err) {}
        } else {
          TutorialManager.next();
        }
      });
    }
  },

  _onResize() {
    if (TutorialManager.isActive) {
      TutorialManager.updatePosition();
    }
  },

  _onScroll() {
    if (TutorialManager.isActive) {
      TutorialManager.updatePosition();
    }
  },

  jumpToKitchen() {
    try { playSound('add'); } catch(e) {}
    this.renderStep(5);
  },

  renderStep(index) {
    if (index < 0) index = 0;
    if (index >= TUTORIAL_DATA.length) {
      this.complete();
      return;
    }
    this.currentStep = index;
    const step = TUTORIAL_DATA[index];

    // Asegurar pantalla correcta
    if (step.screen === 'START') {
      const startScr = document.getElementById("start-screen");
      if (startScr) {
        startScr.classList.remove("hidden");
        startScr.style.display = "flex";
        startScr.style.visibility = "visible";
      }
    } else if (step.screen === 'KITCHEN') {
      const startScr = document.getElementById("start-screen");
      if (startScr) {
        startScr.classList.add("hidden");
        startScr.style.display = "none";
        startScr.style.visibility = "hidden";
      }
      this.ensureDemoKitchen();
    }

    // Actualizar datos de la barra compacta
    const badgeEl = document.getElementById("tutorial-phase-badge");
    const counterEl = document.getElementById("tutorial-step-counter");
    const titleEl = document.getElementById("tutorial-title");
    const bodyEl = document.getElementById("tutorial-body");
    const prevBtn = document.getElementById("tutorial-btn-prev");
    const nextBtn = document.getElementById("tutorial-btn-next");
    const kitchenBtn = document.getElementById("tutorial-btn-kitchen");

    if (badgeEl) {
      badgeEl.textContent = `FASE ${step.phase}`;
      badgeEl.className = `tutorial-phase-badge ${step.phaseClass}`;
    }
    if (counterEl) {
      counterEl.textContent = `${index + 1} / ${TUTORIAL_DATA.length}`;
    }
    if (titleEl) {
      titleEl.innerHTML = step.title;
    }
    if (bodyEl) {
      bodyEl.textContent = step.text;
    }
    if (prevBtn) {
      prevBtn.style.display = index === 0 ? "none" : "inline-flex";
    }
    if (kitchenBtn) {
      kitchenBtn.style.display = (step.screen === 'START') ? "inline-flex" : "none";
    }
    if (nextBtn) {
      if (index === TUTORIAL_DATA.length - 1) {
        nextBtn.innerHTML = "🎓 Fin";
        nextBtn.classList.add("tutorial-btn-primary");
      } else {
        nextBtn.innerHTML = "Sig. ▶";
        nextBtn.classList.remove("tutorial-btn-primary");
      }
    }

    // Barra de progreso continua
    const fillEl = document.getElementById("tutorial-progress-fill");
    if (fillEl) {
      const pct = Math.round(((index + 1) / TUTORIAL_DATA.length) * 100);
      fillEl.style.width = `${pct}%`;
    }

    // Scroll suave en pantalla de inicio si el elemento está fuera de vista
    if (step.screen === 'START') {
      const target = document.getElementById(step.targetId);
      if (target) {
        try { target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e) {}
      }
    }

    // Posicionar foco y anclaje
    setTimeout(() => {
      this.updatePosition();
    }, 40);
  },

  updatePosition() {
    if (!this.isActive) return;
    const step = TUTORIAL_DATA[this.currentStep];
    const target = document.getElementById(step.targetId);
    const overlay = document.getElementById("tutorial-overlay");
    const spotlight = document.getElementById("tutorial-spotlight-box");
    const card = document.getElementById("tutorial-card");
    const pointer = document.getElementById("tutorial-pointer-badge");
    if (!spotlight || !card) return;

    if (target && target.offsetParent !== null) {
      const rect = target.getBoundingClientRect();
      const overlayRect = overlay ? overlay.getBoundingClientRect() : { top: 0, left: 0 };
      const top = rect.top - overlayRect.top;
      const left = rect.left - overlayRect.left;
      const pad = 6;
      spotlight.style.display = "block";
      spotlight.style.top = `${Math.max(0, top - pad)}px`;
      spotlight.style.left = `${Math.max(0, left - pad)}px`;
      spotlight.style.width = `${rect.width + pad * 2}px`;
      spotlight.style.height = `${rect.height + pad * 2}px`;

      this.positionCard(rect);
    } else {
      spotlight.style.display = "none";
      if (pointer) pointer.style.display = "none";
      this.positionCard(null);
    }
  },

  positionCard(targetRect) {
    const card = document.getElementById("tutorial-card");
    const pointer = document.getElementById("tutorial-pointer-badge");
    if (!card) return;

    card.style.top = "";
    card.style.bottom = "";
    card.style.left = "";
    card.style.right = "";

    if (!targetRect) {
      card.className = "tutorial-dock-bottom";
      if (pointer) pointer.style.display = "none";
      return;
    }

    const vh = window.innerHeight;
    const targetCenterY = targetRect.top + (targetRect.height / 2);

    if (targetCenterY >= vh * 0.45) {
      card.className = "tutorial-dock-top";
      if (pointer) {
        pointer.style.display = "block";
        pointer.className = "pointer-at-top";
        pointer.innerHTML = "👆 AQUÍ";
      }
    } else {
      card.className = "tutorial-dock-bottom";
      if (pointer) {
        pointer.style.display = "block";
        pointer.className = "pointer-at-bottom";
        pointer.innerHTML = "👇 AQUÍ";
      }
    }
  },

  skip() {
    const toast = document.getElementById("mode-locked-toast");
    if (toast) toast.classList.remove("show");
    this.complete();
  },

  next() {
    try { playSound('add'); } catch(e) {}
    this.renderStep(this.currentStep + 1);
  },

  prev() {
    try { playSound('add'); } catch(e) {}
    this.renderStep(this.currentStep - 1);
  },

  stop() {
    this.isActive = false;
    const overlay = document.getElementById("tutorial-overlay");
    if (overlay) overlay.classList.remove("active");
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("orientationchange", this._onResize);
    document.removeEventListener("fullscreenchange", this._onResize);
    document.removeEventListener("webkitfullscreenchange", this._onResize);
    const startScr = document.getElementById("start-screen");
    if (startScr) {
      startScr.removeEventListener("scroll", this._onScroll);
    }
    returnToStartMenu();
  },

  ensureDemoKitchen() {
    gameState.isPaused = false;
    gameState.isGameOver = false;
    gameState.money = 0;
    gameState.activeBowlIndex = 0;
    gameState.bowls = [
      { ingredients: [], matchedRamen: null },
      { ingredients: [], matchedRamen: null },
      { ingredients: [], matchedRamen: null }
    ];
    const shioRecipe = RECETAS_RAMEN.find(r => r.name.toLowerCase().includes("shio")) || RECETAS_RAMEN[0];
    gameState.customerSlots = [
      {
        name: "Kenji",
        avatar: "👨‍🍳",
        orders: [{ recipe: shioRecipe, served: false }],
        patience: 100,
        maxPatience: 100,
        spawnTime: Date.now()
      },
      null,
      null,
      null
    ];
    initRecipeTable();
    renderPantryGrid();
    setupKitchenStations();
    resetCookingStations();
    renderBowls();
    renderCustomers();
    updateHUD();
  },

  complete() {
    this.isActive = false;
    const overlay = document.getElementById("tutorial-overlay");
    if (overlay) overlay.classList.remove("active");
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("orientationchange", this._onResize);
    document.removeEventListener("fullscreenchange", this._onResize);
    document.removeEventListener("webkitfullscreenchange", this._onResize);

    // Guardar desbloqueo permanente
    safeStorage.setItem('ramen_tutorial_completed', 'true');
    updateStartModesDisplay();

    try { playSound('win'); } catch(e) {}

    const modal = document.getElementById("tutorial-completed-modal");
    if (modal) modal.style.display = "flex";
  },

  restartTutorial() {
    const modal = document.getElementById("tutorial-completed-modal");
    if (modal) modal.style.display = "none";
    this.start();
  },

  finishAndGoNormal() {
    const modal = document.getElementById("tutorial-completed-modal");
    if (modal) modal.style.display = "none";
    setStartSelectedMode('NORMAL');
    executeStartGame();
  },

  finishAndGoMenu() {
    const modal = document.getElementById("tutorial-completed-modal");
    if (modal) modal.style.display = "none";
    returnToStartMenu();
  }
};
