/* Módulo 01-nucleo-supabase-dispositivo — Núcleo: Supabase, almacenamiento seguro, dispositivo y analítica.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */
/* ==========================================================================
   CONFIGURACIÓN DE SUPABASE (BASE DE DATOS EN LA NUBE)
   ========================================================================== */
const SUPABASE_CONFIG = {
  url: "https://byfvmwupbimvocmxrgab.supabase.co",
  anonKey: "sb_publishable_cY2QwNiaJzKEIbIwsYsFIw_9kSH7h2L"
};

let supabaseClient = null;
let supabaseLoadingPromise = null;

function initSupabase() {
  if (supabaseClient) return supabaseClient;
  try {
    if (window.supabase && SUPABASE_CONFIG.url && SUPABASE_CONFIG.url !== "https://TU_PROYECTO.supabase.co") {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    }
  } catch (err) {
    console.warn("Supabase no configurado:", err);
  }
  return supabaseClient;
}

function ensureSupabaseLoaded() {
  if (window.supabase) {
    if (!supabaseClient) initSupabase();
    return Promise.resolve(supabaseClient);
  }
  if (supabaseLoadingPromise) return supabaseLoadingPromise;

  supabaseLoadingPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.async = true;
    s.onload = () => {
      initSupabase();
      resolve(supabaseClient);
    };
    s.onerror = () => {
      console.warn('Supabase no disponible sin conexión');
      resolve(null);
    };
    document.head.appendChild(s);
  });
  return supabaseLoadingPromise;
}

/* ==========================================================================
   ALMACENAMIENTO SEGURO Y COMPATIBILIDAD
   ========================================================================== */
const safeStorage = {
  _mem: {},
  getItem: function(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch(e) {}
    return this._mem[key] || null;
  },
  setItem: function(key, val) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, String(val));
        return;
      }
    } catch(e) {}
    this._mem[key] = String(val);
  },
  removeItem: function(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch(e) {}
    delete this._mem[key];
  },
  clear: function() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch(e) {}
    this._mem = {};
  }
};

/* ==========================================================================
   GESTOR DE IDENTIDAD DEL DISPOSITIVO Y JUGADOR (ANTI-DUPLICADOS)
   ========================================================================== */
const DeviceManager = {
  deviceId: "DEV-LOCAL-0001",
  deviceFingerprint: "HARDWARE-INIT",
  deviceInfoText: "Navegador Web",
  currentPlayer: null,
  isInitialized: false,

  // Genera huella técnica única instantánea (0ms, sin tocar GPU ni Canvas)
  generateFingerprint() {
    const parts = [
      navigator.userAgent || "",
      navigator.platform || "",
      navigator.language || "",
      navigator.hardwareConcurrency || "4",
      navigator.deviceMemory || "4",
      `${screen.width}x${screen.height}x${screen.colorDepth || 24}`,
      window.devicePixelRatio || 1
    ];
    try {
      parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    } catch(e) {}

    const raw = parts.join("|||");
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  },

  // Genera o recupera el token persistente de dispositivo
  getPersistentToken() {
    let token = safeStorage.getItem("ramen_device_token");
    if (!token) {
      try {
        const match = document.cookie.match(/(?:^|; )ramen_device_token=([^;]*)/);
        if (match && match[1]) token = match[1];
      } catch(e) {}
    }
    if (!token) {
      token = "TKN" + Math.random().toString(36).substring(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase();
      safeStorage.setItem("ramen_device_token", token);
      try {
        document.cookie = `ramen_device_token=${token}; max-age=315360000; path=/`;
      } catch(e) {}
    }
    return token;
  },

  // Detecta el nombre amigable del dispositivo y navegador
  detectDeviceInfo() {
    const ua = navigator.userAgent || "";
    let os = "Dispositivo";
    if (/Windows NT/i.test(ua)) os = "Windows PC";
    else if (/Android/i.test(ua)) os = "Android Móvil";
    else if (/iPhone/i.test(ua)) os = "iPhone";
    else if (/iPad/i.test(ua)) os = "iPad";
    else if (/Macintosh/i.test(ua)) os = "Mac";
    else if (/Linux/i.test(ua)) os = "Linux";

    let browser = "Navegador";
    if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
    else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
    else if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";

    return `${os} • ${browser}`;
  },

  // Inicializa el sistema de dispositivo y busca la cuenta vinculada (0ms de bloqueo)
  init() {
    try {
      let cachedFp = safeStorage.getItem("ramen_device_fingerprint");
      if (!cachedFp) {
        cachedFp = this.generateFingerprint();
        safeStorage.setItem("ramen_device_fingerprint", cachedFp);
      }
      this.deviceFingerprint = cachedFp;
      const token = this.getPersistentToken();
      this.deviceId = `DEV-${this.deviceFingerprint}-${token.substring(0, 6)}`;
      this.deviceInfoText = this.detectDeviceInfo();

      // Actualizar badges visuales de dispositivo
      const badge = document.getElementById("start-device-info-bar");
      if (badge) badge.innerHTML = `🔒 Dispositivo: <strong>${this.deviceId}</strong> (${this.deviceInfoText})`;
      const regPill = document.getElementById("reg-device-info-pill");
      if (regPill) regPill.innerHTML = `📱 <strong>Dispositivo:</strong> ${this.deviceInfoText}<br>🔑 <strong>ID de Hardware:</strong> ${this.deviceId}`;
      const profRaw = document.getElementById("prof-device-raw");
      if (profRaw) profRaw.innerHTML = `${this.deviceInfoText}<br><strong>ID Único:</strong> ${this.deviceId}<br><strong>Huella Hardware:</strong> #${this.deviceFingerprint}`;

      // 1. Limpieza de perfiles auto-asignados por versiones anteriores
      const wasExplicitlyRegistered = safeStorage.getItem("ramen_profile_explicit_registered") === "true";
      if (!wasExplicitlyRegistered) {
        // Si el dispositivo no tiene un registro manual explícito, limpiar cualquier dato residual
        safeStorage.removeItem("ramen_player_profile");
        safeStorage.removeItem("ramen_player_name");
        safeStorage.removeItem("ramen_player_contact");
        safeStorage.removeItem("ramen_player_avatar");
      }

      // 2. Buscar perfil legítimo en almacenamiento local (0ms delay)
      let player = null;
      if (wasExplicitlyRegistered) {
        try {
          const raw = safeStorage.getItem("ramen_player_profile");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.playerName && parsed.playerName.trim().length >= 2) {
              player = parsed;
            }
          }
        } catch(e) {}
      }

      // 3. Asignar estado del jugador INMEDIATAMENTE para respuesta instantánea
      if (player && player.playerName && wasExplicitlyRegistered) {
        this.currentPlayer = player;
        try {
          const regList = JSON.parse(safeStorage.getItem("ramen_registered_users") || "[]");
          const idx = regList.findIndex(u => u.deviceId === this.deviceId || (u.playerName && u.playerName.toLowerCase() === player.playerName.toLowerCase()));
          if (idx >= 0) regList[idx] = player;
          else regList.unshift(player);
          safeStorage.setItem("ramen_registered_users", JSON.stringify(regList));
        } catch(e) {}
      } else {
        this.currentPlayer = null;
      }

      this.isInitialized = true;
      updateStartPlayerCard();
      renderLinkedUserBadges();

      if (this.currentPlayer && this.currentPlayer.playerName) {
        setTimeout(() => {
          showWelcomeToast(this.currentPlayer.playerName, this.currentPlayer.avatar);
        }, 300);
      }

      // 4. El perfil de la nube llega con la cuenta (cloudBoot / applyCloudAccount).
    } catch(err) {
      console.error("Error en DeviceManager.init:", err);
      this.isInitialized = true;
    }
  },

  // Verifica de manera asíncrona si un alias ya está en uso por otro dispositivo (Supabase + local)
  async isAliasTaken(name) {
    const cleanName = (name || "").trim();
    if (cleanName.length < 2) return false;

    // Si coincide con el alias actual de este mismo dispositivo, no está bloqueado para sí mismo
    if (this.currentPlayer && this.currentPlayer.playerName && this.currentPlayer.playerName.toLowerCase() === cleanName.toLowerCase()) {
      return false;
    }

    // 1. Consulta en el servidor: el alias debe ser único entre todas las cuentas
    try {
      const client = await cloudClient();
      if (client) {
        const { data, error } = await client.rpc('alias_available', { p_alias: cleanName, p_token: CloudAuth.token || null });
        if (!error && data && data.ok && data.available === false) return true;
      }
    } catch(err) {
      console.warn("Aviso al verificar alias en el servidor:", err);
    }

    // 2. Consulta en registro local de cuentas en este navegador
    try {
      const regList = JSON.parse(safeStorage.getItem("ramen_registered_users") || "[]");
      const localTaken = regList.some(u => 
        u.playerName && 
        u.playerName.toLowerCase() === cleanName.toLowerCase() && 
        u.deviceId && u.deviceId !== this.deviceId
      );
      if (localTaken) return true;
    } catch(e) {}

    return false;
  },

  // Registrar un nuevo jugador vinculado a este dispositivo
  async register(playerName, contact, avatar) {
    const cleanName = (playerName || "").trim();
    const cleanContact = (contact || "").trim();
    const cleanAvatar = avatar || "🍜";

    if (cleanName.length < 2) {
      return { success: false, error: "El nombre debe tener al menos 2 caracteres." };
    }
    if (cleanName.length > 20) {
      return { success: false, error: "El nombre no puede exceder 20 caracteres." };
    }

    // Validación estricta de alias único
    const isTaken = await this.isAliasTaken(cleanName);
    if (isTaken) {
      return { 
        success: false, 
        error: `El alias "${cleanName}" ya está ocupado por otro chef. Por favor elige otro nombre.` 
      };
    }

    // Si el dispositivo ya tiene una cuenta registrada, se renombra/actualiza limpiamente
    if (this.currentPlayer && this.currentPlayer.playerName.toLowerCase() !== cleanName.toLowerCase()) {
      console.log(`Actualizando nombre de ${this.currentPlayer.playerName} a ${cleanName} en este dispositivo`);
    }

    // El perfil se guarda en la cuenta; el servidor garantiza que el alias sea único
    const saved = await cloudSaveProfileNow({ alias: cleanName, avatar: cleanAvatar, contact: cleanContact });
    if (saved && saved.error === 'alias_ocupado') {
      return { success: false, error: `El alias "${cleanName}" ya está ocupado por otro chef. Por favor elige otro nombre.` };
    }

    const newPlayer = {
      playerName: cleanName,
      contact: cleanContact,
      avatar: cleanAvatar,
      deviceId: this.deviceId,
      deviceInfo: this.deviceInfoText,
      createdAt: this.currentPlayer ? this.currentPlayer.createdAt : new Date().toISOString()
    };

    this.currentPlayer = newPlayer;
    safeStorage.setItem("ramen_profile_explicit_registered", "true");
    safeStorage.setItem("ramen_player_profile", JSON.stringify(newPlayer));
    safeStorage.setItem("ramen_player_name", cleanName);
    safeStorage.setItem("ramen_player_contact", cleanContact);
    safeStorage.setItem("ramen_player_avatar", cleanAvatar);

    try {
      const regList = JSON.parse(safeStorage.getItem("ramen_registered_users") || "[]");
      const idx = regList.findIndex(u => u.deviceId === this.deviceId || (u.playerName && u.playerName.toLowerCase() === cleanName.toLowerCase()));
      if (idx >= 0) regList[idx] = newPlayer;
      else regList.push(newPlayer);
      safeStorage.setItem("ramen_registered_users", JSON.stringify(regList));
    } catch(e) {}

    updateStartPlayerCard();
    renderLinkedUserBadges();
    showWelcomeToast(cleanName, cleanAvatar);
    if (typeof cloudSaveProfile === 'function') cloudSaveProfile();
    return { success: true, player: newPlayer };
  },

  // Actualizar nombre, contacto o avatar del perfil registrado
  async updateProfile(newName, contact, avatar) {
    if (!this.currentPlayer) return { success: false, error: "No hay jugador registrado." };

    const cleanName = (newName || "").trim() || this.currentPlayer.playerName;
    const cleanContact = (contact || "").trim();
    const cleanAvatar = avatar || this.currentPlayer.avatar || "🍜";

    // Si cambia de nombre, validar que el nuevo alias no esté ocupado por otro chef
    if (this.currentPlayer.playerName && cleanName.toLowerCase() !== this.currentPlayer.playerName.toLowerCase()) {
      const isTaken = await this.isAliasTaken(cleanName);
      if (isTaken) {
        return { 
          success: false, 
          error: `El alias "${cleanName}" ya está ocupado por otro chef. Por favor elige otro nombre.` 
        };
      }
    }

    const saved = await cloudSaveProfileNow({ alias: cleanName, avatar: cleanAvatar, contact: cleanContact });
    if (saved && saved.error === 'alias_ocupado') {
      return { success: false, error: `El alias "${cleanName}" ya está ocupado por otro chef. Por favor elige otro nombre.` };
    }

    this.currentPlayer.playerName = cleanName;
    this.currentPlayer.contact = cleanContact;
    this.currentPlayer.avatar = cleanAvatar;

    safeStorage.setItem("ramen_player_profile", JSON.stringify(this.currentPlayer));
    safeStorage.setItem("ramen_player_name", cleanName);
    safeStorage.setItem("ramen_player_contact", cleanContact);
    safeStorage.setItem("ramen_player_avatar", cleanAvatar);

    try {
      const regList = JSON.parse(safeStorage.getItem("ramen_registered_users") || "[]");
      const idx = regList.findIndex(u => u.deviceId === this.deviceId || u.playerName.toLowerCase() === cleanName.toLowerCase());
      if (idx >= 0) regList[idx] = this.currentPlayer;
      else regList.unshift(this.currentPlayer);
      safeStorage.setItem("ramen_registered_users", JSON.stringify(regList));
    } catch(e) {}

    if (typeof cloudSaveProfile === 'function') cloudSaveProfile();
    updateStartPlayerCard();
    renderLinkedUserBadges();
    return { success: true, player: this.currentPlayer };
  }
};
window.DeviceManager = DeviceManager;

/* ==========================================================================
   SISTEMA DE TELEMETRÍA Y ANALÍTICAS DE JUEGO
   ========================================================================== */
const AnalyticsTracker = {
  sessionStartTime: null,
  currentLevelNumber: 1,
  currentMode: 'NORMAL',
  sessionFailedRamen: [],
  sessionCustomersServed: 0,
  sessionCustomersLost: 0,

  startSession(mode, level) {
    this.sessionStartTime = Date.now();
    this.currentMode = mode || 'NORMAL';
    this.currentLevelNumber = level || 1;
    this.sessionFailedRamen = [];
    this.sessionCustomersServed = 0;
    this.sessionCustomersLost = 0;
    this.incrementLevelAttempt(this.currentMode, this.currentLevelNumber);
  },

  trackCustomerLost(customer) {
    if (!customer || !customer.orders) return;
    this.sessionCustomersLost++;
    const unserved = customer.orders.filter(o => !o.served);
    unserved.forEach(o => {
      const rName = o.recipe ? o.recipe.name : "Ramen";
      this.sessionFailedRamen.push(rName);
      this.incrementRamenFail(rName);
    });
  },

  trackCustomerServed() {
    this.sessionCustomersServed++;
  },

  async endSession(outcome) {
    if (!this.sessionStartTime) return;
    const durationSeconds = Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 1000));
    this.lastDuration = durationSeconds;
    this.sessionStartTime = null;

    const playerName = DeviceManager.currentPlayer ? DeviceManager.currentPlayer.playerName : (safeStorage.getItem('ramen_player_name') || "Chef Anónimo");
    const deviceId = DeviceManager.deviceId;

    const sessionData = {
      device_id: deviceId,
      player_name: playerName,
      game_mode: this.currentMode,
      level_number: this.currentLevelNumber,
      duration_seconds: durationSeconds,
      customers_served: this.sessionCustomersServed,
      customers_lost: this.sessionCustomersLost,
      failed_recipes: this.sessionFailedRamen,
      outcome: outcome || 'COMPLETED',
      created_at: new Date().toISOString()
    };

    this.saveLocalSession(sessionData);
    this.accumulateUserStats(playerName, deviceId, durationSeconds, this.currentMode, this.currentLevelNumber, outcome);

    // Se registra en el servidor con la sesión de la cuenta (no hay acceso directo a la tabla)
    cloudCall('log_session', { p_mode: sessionData.game_mode, p_level: sessionData.level_number, p_duration: durationSeconds,
      p_served: sessionData.customers_served, p_lost: sessionData.customers_lost, p_failed: sessionData.failed_recipes,
      p_outcome: sessionData.outcome }).catch(e => { console.warn("Analytics error:", e); });
  },

  incrementLevelAttempt(mode, level) {
    try {
      const raw = safeStorage.getItem('ramen_level_attempts') || "{}";
      const stats = JSON.parse(raw);
      const key = `${mode}_${level}`;
      stats[key] = (stats[key] || 0) + 1;
      safeStorage.setItem('ramen_level_attempts', JSON.stringify(stats));
    } catch(e) {}
  },

  incrementRamenFail(ramenName) {
    try {
      const raw = safeStorage.getItem('ramen_fail_stats') || "{}";
      const stats = JSON.parse(raw);
      stats[ramenName] = (stats[ramenName] || 0) + 1;
      safeStorage.setItem('ramen_fail_stats', JSON.stringify(stats));
    } catch(e) {}
  },

  saveLocalSession(session) {
    try {
      const raw = safeStorage.getItem('ramen_analytics_sessions') || "[]";
      const sessions = JSON.parse(raw);
      sessions.unshift(session);
      if (sessions.length > 250) sessions.length = 250;
      safeStorage.setItem('ramen_analytics_sessions', JSON.stringify(sessions));
    } catch(e) {}
  },

  accumulateUserStats(playerName, deviceId, durationSeconds, mode, level, outcome) {
    try {
      const raw = safeStorage.getItem('ramen_user_analytics') || "{}";
      const users = JSON.parse(raw);
      if (!users[playerName]) {
        users[playerName] = {
          playerName: playerName,
          deviceId: deviceId,
          totalAttempts: 0,
          totalPlayTimeSeconds: 0,
          maxNormalLevel: 1,
          maxRashLevel: 1,
          customersServed: 0,
          customersLost: 0,
          lastActive: new Date().toISOString()
        };
      }
      const u = users[playerName];
      u.totalAttempts += 1;
      u.totalPlayTimeSeconds += durationSeconds;
      u.customersServed += this.sessionCustomersServed;
      u.customersLost += this.sessionCustomersLost;
      u.lastActive = new Date().toISOString();
      if (mode === 'NORMAL' && level > u.maxNormalLevel) u.maxNormalLevel = level;
      if (mode === 'RASH' && level > u.maxRashLevel) u.maxRashLevel = level;

      safeStorage.setItem('ramen_user_analytics', JSON.stringify(users));
    } catch(e) {}
  }
};
