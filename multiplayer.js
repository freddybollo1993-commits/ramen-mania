/**
 * ==============================================================================
 * RAMEN MANIA ARCADE - MOTOR MULTIJUGADOR EN TIEMPO REAL (2 A 4 JUGADORES)
 * Soporta Modo Global (Matchmaking), Partida Privada (Amigos con código/enlace),
 * Modo VS (Arrebato de Clientes) y Modo Cooperativo (Caos con Bloqueo de Estaciones).
 * Desarrollado sobre Supabase Realtime (Channels, Presence y Broadcast).
 * ==============================================================================
 */

(function(window) {
  'use strict';

  // Configuración de paletas de jugadores P1 a P4
  const PLAYER_COLORS = [
    { name: 'Rojo Ramen', hex: '#e53935', bg: 'rgba(229, 57, 53, 0.2)', border: '#c62828', label: 'P1' },
    { name: 'Azul Shoyu', hex: '#1e88e5', bg: 'rgba(30, 136, 229, 0.2)', border: '#1565c0', label: 'P2' },
    { name: 'Verde Wasabi', hex: '#43a047', bg: 'rgba(67, 160, 71, 0.2)', border: '#2e7d32', label: 'P3' },
    { name: 'Dorado Miso', hex: '#ffb300', bg: 'rgba(255, 179, 0, 0.2)', border: '#f57f17', label: 'P4' }
  ];

  // Configuración del Sistema de Ranking MMR Competitivo (estilo Dota 2 / League of Legends)
  const MMR_CONFIG = {
    DEFAULT_MMR: 1000,
    TIERS: [
      { id: 'ROOKIE', name: 'Novato', icon: '🥢', minMmr: 0, maxMmr: 999, color: '#a1887f', bgGradient: 'linear-gradient(135deg, #4e342e, #3e2723)', hasDivisions: true },
      { id: 'BRONZE', name: 'Bronce', icon: '🥉', minMmr: 1000, maxMmr: 1399, color: '#cd7f32', bgGradient: 'linear-gradient(135deg, #6d4c41, #4e342e)', hasDivisions: true },
      { id: 'SILVER', name: 'Plata', icon: '🥈', minMmr: 1400, maxMmr: 1799, color: '#cfd8dc', bgGradient: 'linear-gradient(135deg, #78909c, #455a64)', hasDivisions: true },
      { id: 'GOLD', name: 'Oro', icon: '🥇', minMmr: 1800, maxMmr: 2199, color: '#ffd700', bgGradient: 'linear-gradient(135deg, #ff8f00, #ff6f00)', hasDivisions: true },
      { id: 'PLATINUM', name: 'Platino', icon: '💎', minMmr: 2200, maxMmr: 2599, color: '#00e5ff', bgGradient: 'linear-gradient(135deg, #00838f, #006064)', hasDivisions: true },
      { id: 'DIAMOND', name: 'Diamante', icon: '💠', minMmr: 2600, maxMmr: 2999, color: '#b388ff', bgGradient: 'linear-gradient(135deg, #512da8, #311b92)', hasDivisions: true },
      { id: 'MASTER', name: 'Maestro Itamae', icon: '👑', minMmr: 3000, maxMmr: 3499, color: '#ff4081', bgGradient: 'linear-gradient(135deg, #c2185b, #880e4f)', hasDivisions: false },
      { id: 'DRAGON', name: 'Gran Dragón Ramen', icon: '🐉🔥', minMmr: 3500, maxMmr: 99999, color: '#ff1744', bgGradient: 'linear-gradient(135deg, #b71c1c, #bf360c)', hasDivisions: false }
    ]
  };

  const REACTION_EMOJIS = ['🍜', '🔥', '😱', '👑', '💨', '👏'];

  const MultiplayerManager = {
    // Estado de la sala y conexión
    isInitialized: false,
    isInMultiplayer: false,
    isGameActive: false,
    isHost: false,
    channel: null,
    roomId: null,
    roomType: 'PRIVATE', // 'GLOBAL' o 'PRIVATE'
    
    // Reglas de la sala
    gameMode: 'VS', // 'VS' (Arrebato) o 'COOP' (Cocina Compartida)
    winCondition: {
      type: 'TIME', // 'TIME', 'MONEY', 'CUSTOMERS'
      target: 120    // 120s, $600, o 10 clientes
    },
    winPresets: {
      TIME: [
        { label: '⏱️ 120s (Normal)', target: 120 },
        { label: '⚡ 60s (Rápido)', target: 60 },
        { label: '🏆 180s (Maratón)', target: 180 }
      ],
      MONEY: [
        { label: '💰 S/ 600 (Normal)', target: 600 },
        { label: '⚡ S/ 300 (Rápido)', target: 300 },
        { label: '🏆 S/ 1000 (Maratón)', target: 1000 }
      ],
      CUSTOMERS: [
        { label: '🍜 10 Clientes (Normal)', target: 10 },
        { label: '⚡ 5 Clientes (Rápido)', target: 5 },
        { label: '🏆 15 Clientes (Maratón)', target: 15 }
      ]
    },

    // Jugadores en la sala
    players: [],
    myPlayerId: null,
    myColorIndex: 0,
    isReady: false,

    // Estado del juego en curso
    sharedTimeRemaining: 120,
    sharedMoney: 0,
    sharedReputation: 5, // 5 estrellas en Co-op
    myScore: 0,
    myCustomersServed: 0,
    myCustomersStolen: 0,
    
    // Bloqueo de estaciones (Modo Co-op)
    stationLocks: {}, // stationId -> { playerId, playerName, avatar, expiresAt }
    
    // Temporizadores internos
    countdownTimer: null,
    gameLoopTimer: null,
    presenceSyncTimer: null,
    globalQueueTimer: null,

    // Inicialización del motor
    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;
      this.myPlayerId = (typeof DeviceManager !== 'undefined' && DeviceManager.deviceId) 
        ? DeviceManager.deviceId 
        : `DEV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      this.setupDOMHooks();
      this.checkUrlRoomParam();
      console.log('🍜 MultiplayerManager inicializado correctamente con ID:', this.myPlayerId);
    },

    // Enlazar eventos de URL (ej: ?room=RAMEN-42)
    checkUrlRoomParam() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        if (roomCode) {
          setTimeout(() => {
            this.openLobbyModal();
            this.switchLobbyTab('private');
            const codeInput = document.getElementById('mp-join-code-input');
            if (codeInput) codeInput.value = roomCode.toUpperCase();
            this.joinPrivateRoom(roomCode.toUpperCase());
          }, 600);
        }
      } catch(e) {}
    },

    // Obtener cliente Supabase activo
    getSupabase() {
      if (typeof window.initSupabase === 'function') {
        const c = window.initSupabase();
        if (c) return c;
      }
      return window.supabaseClient || null;
    },

    /* ==========================================================================
       SISTEMA DE RANKING MMR COMPETITIVO (ESTILO DOTA 2 / LEAGUE OF LEGENDS)
       ========================================================================== */
    getPlayerMmr() {
      if (typeof safeStorage !== 'undefined') {
        const saved = safeStorage.getItem('ramen_player_mmr');
        if (saved !== null && saved !== undefined && !isNaN(parseInt(saved))) {
          return Math.max(0, parseInt(saved));
        }
      }
      return MMR_CONFIG.DEFAULT_MMR;
    },

    getRankDetails(rawMmr) {
      const mmr = Math.max(0, parseInt(rawMmr !== undefined && rawMmr !== null ? rawMmr : MMR_CONFIG.DEFAULT_MMR) || MMR_CONFIG.DEFAULT_MMR);
      const tiers = MMR_CONFIG.TIERS;
      let tier = tiers[1]; // Bronce por defecto
      for (let i = 0; i < tiers.length; i++) {
        if (mmr >= tiers[i].minMmr && mmr <= tiers[i].maxMmr) {
          tier = tiers[i];
          break;
        }
      }

      let division = '';
      let lp = 0;
      let nextRankName = '';
      let progressPercent = 0;

      if (tier.hasDivisions) {
        const span = (tier.maxMmr - tier.minMmr + 1);
        const divSpan = span / 4;
        const offset = Math.max(0, mmr - tier.minMmr);
        const divIndex = Math.min(3, Math.floor(offset / divSpan));
        const roman = ['IV', 'III', 'II', 'I'][divIndex];
        division = roman;
        lp = Math.floor(offset % divSpan);
        progressPercent = Math.min(100, Math.floor((lp / divSpan) * 100));

        if (divIndex < 3) {
          nextRankName = `${tier.name} ${['IV', 'III', 'II', 'I'][divIndex + 1]}`;
        } else {
          const nextTierIdx = tiers.findIndex(t => t.id === tier.id) + 1;
          nextRankName = (nextTierIdx < tiers.length) ? `${tiers[nextTierIdx].name} IV` : 'Cima del Ranking';
        }
      } else {
        if (tier.id === 'MASTER') {
          lp = Math.max(0, mmr - 3000);
          progressPercent = Math.min(100, Math.floor((lp / 500) * 100));
          nextRankName = 'Gran Dragón Ramen';
        } else {
          lp = mmr;
          progressPercent = 100;
          nextRankName = 'Leyenda Inmortal';
        }
      }

      const fullName = division ? `${tier.name} ${division}` : tier.name;

      return {
        mmr,
        tierId: tier.id,
        tierName: tier.name,
        division,
        fullName,
        icon: tier.icon,
        color: tier.color,
        bgGradient: tier.bgGradient,
        lp,
        progressPercent,
        nextRankName
      };
    },

    calculateMatchMmrDelta(placement, totalPlayers, isCoop, coopSuccess) {
      const currentStreak = parseInt((typeof safeStorage !== 'undefined' ? safeStorage.getItem('ramen_player_pvp_streak') : '0') || '0');
      let delta = 0;

      if (isCoop) {
        if (coopSuccess) {
          delta = 18;
        } else {
          delta = -8;
        }
      } else {
        // Modo VS (PvP competitivo)
        if (placement === 1) {
          const nextStreak = currentStreak + 1;
          const streakBonus = Math.min(15, (nextStreak > 1 ? (nextStreak - 1) * 4 : 0));
          delta = 28 + streakBonus;
        } else if (placement === 2 && totalPlayers >= 3) {
          delta = 12; // Top 2 en FFA de 3 o 4 jugadores
        } else if (placement === 2 && totalPlayers === 2) {
          delta = -20; // Derrota directa en 1v1
        } else if (placement === 3) {
          delta = -14;
        } else {
          delta = -22;
        }
      }
      return delta;
    },

    recordMatchMmr(placement, totalPlayers, isCoop, coopSuccess) {
      const oldMmr = this.getPlayerMmr();
      const delta = this.calculateMatchMmrDelta(placement, totalPlayers, isCoop, coopSuccess);
      const newMmr = Math.max(0, oldMmr + delta);

      let wins = parseInt((typeof safeStorage !== 'undefined' ? safeStorage.getItem('ramen_player_pvp_wins') : '0') || '0');
      let losses = parseInt((typeof safeStorage !== 'undefined' ? safeStorage.getItem('ramen_player_pvp_losses') : '0') || '0');
      let streak = parseInt((typeof safeStorage !== 'undefined' ? safeStorage.getItem('ramen_player_pvp_streak') : '0') || '0');
      let highestMmr = parseInt((typeof safeStorage !== 'undefined' ? safeStorage.getItem('ramen_player_highest_mmr') : '1000') || '1000');

      const isWin = isCoop ? coopSuccess : (placement === 1 || (placement === 2 && totalPlayers >= 3));
      if (isWin) {
        wins++;
        streak++;
      } else {
        losses++;
        streak = 0;
      }
      if (newMmr > highestMmr) highestMmr = newMmr;

      const oldRank = this.getRankDetails(oldMmr);
      const newRank = this.getRankDetails(newMmr);
      const isTierPromoted = newRank.tierId !== oldRank.tierId && newMmr > oldMmr;
      const isDivPromoted = newRank.division !== oldRank.division && newMmr > oldMmr;

      if (typeof safeStorage !== 'undefined') {
        safeStorage.setItem('ramen_player_mmr', String(newMmr));
        safeStorage.setItem('ramen_player_rank_tier', newRank.fullName);
        safeStorage.setItem('ramen_player_pvp_wins', String(wins));
        safeStorage.setItem('ramen_player_pvp_losses', String(losses));
        safeStorage.setItem('ramen_player_pvp_streak', String(streak));
        safeStorage.setItem('ramen_player_highest_mmr', String(highestMmr));
      }

      if (typeof DeviceManager !== 'undefined' && DeviceManager.currentPlayer) {
        DeviceManager.currentPlayer.mmr = newMmr;
        DeviceManager.currentPlayer.rankTier = newRank.fullName;
        DeviceManager.currentPlayer.pvpWins = wins;
        DeviceManager.currentPlayer.pvpLosses = losses;
        DeviceManager.currentPlayer.pvpStreak = streak;
        DeviceManager.currentPlayer.highestMmr = highestMmr;
      }

      // Se guarda en la cuenta (el servidor acota cuánto puede cambiar el MMR por partida y devuelve el valor oficial)
      if (typeof cloudCall === 'function') {
        cloudCall('pvp_sync', { p_mmr: newMmr, p_rank_tier: newRank.fullName, p_wins: wins, p_losses: losses, p_streak: streak, p_highest: highestMmr })
          .then(d => { if (d && d.ok && !d.ignored && d.account && typeof applyPvpFromAccount === 'function') applyPvpFromAccount(d.account, false); })
          .catch(() => {});
      }

      if (typeof renderLinkedUserBadges === 'function') {
        renderLinkedUserBadges();
      }

      return {
        delta,
        oldMmr,
        newMmr,
        oldRank,
        newRank,
        isTierPromoted,
        isDivPromoted,
        isPromoted: isTierPromoted || isDivPromoted,
        streak,
        wins,
        losses
      };
    },

    getMatchmakingRoomForMmr(mmr) {
      const rank = this.getRankDetails(mmr);
      if (rank.tierId === 'ROOKIE') return { bracket: 'Novato', room: 'RAMEN_SBMM_ROOKIE_V2' };
      if (rank.tierId === 'BRONZE') return { bracket: 'Bronce', room: 'RAMEN_SBMM_BRONZE_V2' };
      if (rank.tierId === 'SILVER') return { bracket: 'Plata', room: 'RAMEN_SBMM_SILVER_V2' };
      if (rank.tierId === 'GOLD') return { bracket: 'Oro', room: 'RAMEN_SBMM_GOLD_V2' };
      return { bracket: 'Platino y Superior', room: 'RAMEN_SBMM_HIGH_TIER_V2' };
    },

    // Obtener datos del jugador actual
    getMyProfile() {
      let name = 'Chef Invitado';
      let avatar = '🍜';
      let id = this.myPlayerId;

      if (typeof DeviceManager !== 'undefined' && DeviceManager.currentPlayer) {
        id = DeviceManager.deviceId;
        name = DeviceManager.currentPlayer.playerName || 'Chef Anónimo';
        avatar = DeviceManager.currentPlayer.avatar || '🍜';
      } else if (typeof safeStorage !== 'undefined') {
        name = safeStorage.getItem('ramen_player_name') || 'Chef Invitado';
        avatar = safeStorage.getItem('ramen_player_avatar') || '🍜';
      }

      const mmr = this.getPlayerMmr();
      const rank = this.getRankDetails(mmr);

      return {
        id: id,
        name: name,
        avatar: avatar,
        mmr: rank.mmr,
        rankTier: rank.fullName,
        rankIcon: rank.icon,
        rankColor: rank.color,
        rankBg: rank.bgGradient
      };
    },

    /* ==========================================================================
       GESTIÓN DE SALAS Y LOBBY
       ========================================================================== */
    openLobbyModal() {
      const modal = document.getElementById('multiplayer-lobby-modal');
      if (modal) {
        modal.classList.add('active');
        this.renderLobbyUI();
      }
    },

    closeLobbyModal() {
      if (this.isInMultiplayer && !this.isGameActive) {
        this.leaveRoom();
      }
      const modal = document.getElementById('multiplayer-lobby-modal');
      if (modal) modal.classList.remove('active');
    },

    switchLobbyTab(tab) {
      document.querySelectorAll('.mp-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });
      document.querySelectorAll('.mp-tab-pane').forEach(pane => {
        pane.style.display = (pane.id === `mp-pane-${tab}`) ? 'block' : 'none';
      });
      this.renderRulesUI();
      if (tab === 'room') {
        this.renderRoomSlots();
        this.updateHostControls();
      }
    },

    // Generar código amigable de sala ej: RAMEN-742
    generateRoomCode() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `RAMEN-${code}`;
    },

    // Crear Sala Privada
    async createPrivateRoom() {
      const sb = this.getSupabase();
      if (!sb) {
        this.showLobbyToast('⚠️ Error: Conexión en la nube no disponible.', '#c62828');
        return;
      }

      const myProf = this.getMyProfile();
      if (!myProf.name || myProf.name.startsWith('Chef Anónimo')) {
        if (typeof openRegisterPlayerModal === 'function') {
          openRegisterPlayerModal();
          this.showLobbyToast('ℹ️ Por favor registra tu nombre de chef antes de crear una sala.', '#ff9800');
          return;
        }
      }

      this.leaveRoom(); // Salir de cualquier sala anterior
      this.roomId = this.generateRoomCode();
      this.roomType = 'PRIVATE';
      this.isHost = true;
      this.isReady = true; // El Host siempre está listo
      this.gameMode = this.gameMode || 'VS';
      this.winCondition = this.winCondition || { type: 'TIME', target: 120 };

      await this.connectToChannel(this.roomId);
      this.switchLobbyTab('room');
      this.showLobbyToast(`✨ Sala creada: ${this.roomId}. ¡Invita a tus amigos!`, '#2e7d32');
    },

    // Unirse a Sala Privada con Código
    async joinPrivateRoom(code) {
      const cleanCode = (code || '').trim().toUpperCase();
      if (cleanCode.length < 4) {
        this.showLobbyToast('⚠️ Ingresa un código de sala válido (ej: RAMEN-82).', '#c62828');
        return;
      }

      const sb = this.getSupabase();
      if (!sb) {
        this.showLobbyToast('⚠️ Conexión en la nube no disponible.', '#c62828');
        return;
      }

      this.leaveRoom();
      this.roomId = cleanCode.startsWith('RAMEN-') ? cleanCode : `RAMEN-${cleanCode}`;
      this.roomType = 'PRIVATE';
      this.isHost = false;
      this.isReady = false;

      await this.connectToChannel(this.roomId);
      this.switchLobbyTab('room');
      this.showLobbyToast(`🔑 Conectando a sala ${this.roomId}...`, '#1976d2');
    },

    // Unirse a la Cola de Matchmaking Global con SBMM (Skill-Based Matchmaking)
    async joinGlobalQueue() {
      const sb = this.getSupabase();
      if (!sb) {
        this.showLobbyToast('⚠️ Conexión en la nube no disponible.', '#c62828');
        return;
      }

      this.leaveRoom();
      this.roomType = 'GLOBAL';

      const myMmr = this.getPlayerMmr();
      const matchInfo = this.getMatchmakingRoomForMmr(myMmr);
      this.roomId = matchInfo.room;
      this.isHost = false;
      this.isReady = true;

      const rank = this.getRankDetails(myMmr);
      const statusEl = document.getElementById('mp-global-sbmm-status');
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:${rank.color}; font-weight:900;">${rank.icon} Categoría: ${rank.fullName}</span> <span style="color:#ffca28; font-size:11px;">(${myMmr} MMR)</span>`;
      }
      const descEl = document.getElementById('mp-global-wait-desc');
      if (descEl) {
        descEl.textContent = `Buscando rivales en el rango ${rank.tierName}...`;
      }

      await this.connectToChannel(this.roomId);
      this.switchLobbyTab('global-wait');
      this.startGlobalQueueTimer(matchInfo);
    },

    startGlobalQueueTimer(matchInfo) {
      let seconds = 0;
      let expandedSearch = false;
      const timerEl = document.getElementById('mp-global-timer');
      const descEl = document.getElementById('mp-global-wait-desc');
      const statusEl = document.getElementById('mp-global-sbmm-status');

      clearInterval(this.globalQueueTimer);
      this.globalQueueTimer = setInterval(() => {
        seconds++;
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;

        // Si pasan 20 segundos y no hay contrincante, expandir búsqueda
        if (seconds >= 20 && !expandedSearch && this.players.length < 2) {
          expandedSearch = true;
          if (descEl) {
            descEl.innerHTML = '⚡ <em>Ampliando rango de búsqueda para emparejarte rápidamente...</em>';
          }
          if (statusEl) {
            statusEl.innerHTML += ' <span style="font-size:10px; color:#4fc3f7;">[Búsqueda Ampliada]</span>';
          }
        }
      }, 1000);
    },

    // Conectar a Canal de Supabase Realtime
    async connectToChannel(roomName) {
      const sb = this.getSupabase();
      if (!sb) return;

      const myProf = this.getMyProfile();
      const channelName = `ramen_mp_${roomName}`;

      // Crear canal Realtime con presencia y broadcast
      this.channel = sb.channel(channelName, {
        config: {
          presence: { key: myProf.id },
          broadcast: { self: false } // Recibir solo mensajes de los demás
        }
      });

      // 1. Manejo de Presencia (Jugadores que entran y salen)
      this.channel.on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync();
      });

      this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const joined = newPresences[0];
        if (joined) {
          this.showLobbyToast(`👋 ${joined.name || 'Un chef'} (${joined.rankTier || 'Novato'}) se ha unido a la sala.`, '#1976d2');
          this.playArcadeSound('join');
          if (this.isHost) {
            this.broadcastEvent('CONFIG_UPDATE', {
              gameMode: this.gameMode,
              winCondition: this.winCondition
            });
          }
        }
      });

      this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const left = leftPresences[0];
        if (left) {
          this.showLobbyToast(`🏃 ${left.name || 'Un chef'} ha salido de la sala.`, '#d32f2f');
          this.playArcadeSound('leave');
        }
      });

      // 2. Manejo de Eventos Broadcast (En tiempo real)
      this.channel.on('broadcast', { event: 'game_event' }, ({ payload }) => {
        this.handleIncomingBroadcast(payload);
      });

      // Suscribirse y publicar estado de presencia propio con MMR
      this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.isInMultiplayer = true;
          await this.channel.track({
            id: myProf.id,
            name: myProf.name,
            avatar: myProf.avatar,
            mmr: myProf.mmr,
            rankTier: myProf.rankTier,
            rankIcon: myProf.rankIcon,
            rankColor: myProf.rankColor,
            isHost: this.isHost,
            isReady: this.isReady,
            joinedAt: Date.now()
          });

          // Si soy Host en sala privada, emitir la configuración de juego actual
          if (this.isHost) {
            this.broadcastEvent('CONFIG_UPDATE', {
              gameMode: this.gameMode,
              winCondition: this.winCondition
            });
          }
        }
      });
    },

    // Sincronizar lista de jugadores a partir de Presence
    handlePresenceSync() {
      if (!this.channel) return;
      const state = this.channel.presenceState();
      const list = [];

      Object.keys(state).forEach(key => {
        const presences = state[key];
        if (presences && presences.length > 0) {
          list.push(presences[0]);
        }
      });

      // Ordenar por hora de llegada para asignar P1, P2, P3, P4
      list.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

      // Limitar a máximo 4 jugadores
      this.players = list.slice(0, 4);

      // Si el primer jugador soy yo y no había Host, asignarme Host
      if (this.players.length > 0 && this.players[0].id === this.myPlayerId) {
        this.isHost = true;
      }

      // Encontrar mi índice de color
      const myIdx = this.players.findIndex(p => p.id === this.myPlayerId);
      this.myColorIndex = myIdx >= 0 ? myIdx : 0;

      this.renderRoomSlots();
      this.updateHostControls();

      // En Modo Global: si somos 4 jugadores listos, arrancar automáticamente
      if (this.roomType === 'GLOBAL') {
        if (this.players.length >= 4) {
          if (this.isHost && !this.isGameActive && !this.countdownTimer) {
            this.startCountdownAndLaunch();
          }
        } else if (this.players.length >= 2 && !this.countdownTimer && !this.isGameActive) {
          // Si hay 2 o 3 jugadores en matchmaking global, arrancar en 6s si no entra un 4to
          if (!this.globalMatchLaunchTimer) {
            this.globalMatchLaunchTimer = setTimeout(() => {
              if (this.isHost && this.roomType === 'GLOBAL' && this.players.length >= 2 && !this.isGameActive && !this.countdownTimer) {
                this.startCountdownAndLaunch();
              }
              this.globalMatchLaunchTimer = null;
            }, 6000);
          }
        }
      }
    },

    // Salir de la sala actual y desconectar canal
    leaveRoom() {
      clearInterval(this.countdownTimer);
      clearInterval(this.gameLoopTimer);
      clearInterval(this.globalQueueTimer);
      if (this.globalMatchLaunchTimer) {
        clearTimeout(this.globalMatchLaunchTimer);
        this.globalMatchLaunchTimer = null;
      }
      this.countdownTimer = null;
      this.gameLoopTimer = null;

      if (this.channel) {
        try {
          this.channel.untrack();
          this.channel.unsubscribe();
        } catch(e) {}
        this.channel = null;
      }

      this.isInMultiplayer = false;
      this.isGameActive = false;
      this.isHost = false;
      this.isReady = false;
      this.roomId = null;
      this.players = [];
      this.stationLocks = {};

      const hud = document.getElementById('mp-game-hud');
      if (hud) hud.style.display = 'none';

      const lockOverlays = document.querySelectorAll('.station-lock-badge');
      lockOverlays.forEach(el => el.remove());
    },

    // Cambiar estado Listo / No Listo
    async toggleReady() {
      this.isReady = !this.isReady;
      if (this.channel) {
        const myProf = this.getMyProfile();
        await this.channel.track({
          id: myProf.id,
          name: myProf.name,
          avatar: myProf.avatar,
          mmr: myProf.mmr,
          rankTier: myProf.rankTier,
          rankIcon: myProf.rankIcon,
          rankColor: myProf.rankColor,
          isHost: this.isHost,
          isReady: this.isReady,
          joinedAt: Date.now()
        });
      }
      this.renderRoomSlots();
    },

    // El Host o creador cambia las reglas (VS/Co-op, Tiempo/Dinero/Clientes)
    setRoomRules(newMode, winType, winTarget) {
      // Si ya está dentro de una sala conectada y NO es el Host, los invitados no pueden cambiar
      if (this.isInMultiplayer && !this.isHost) {
        this.showLobbyToast('ℹ️ Solo el anfitrión de la sala puede modificar las reglas.', '#ff9800');
        return;
      }

      if (newMode) {
        this.gameMode = newMode;
      }

      if (winType) {
        this.winCondition.type = winType;
        if (winTarget !== null && winTarget !== undefined) {
          this.winCondition.target = Number(winTarget);
        } else {
          if (winType === 'TIME') this.winCondition.target = 120;
          else if (winType === 'MONEY') this.winCondition.target = 600;
          else if (winType === 'CUSTOMERS') this.winCondition.target = 10;
        }
      } else if (winTarget !== null && winTarget !== undefined) {
        this.winCondition.target = Number(winTarget);
      }

      this.renderRulesUI();

      if (this.isInMultiplayer && this.isHost) {
        this.broadcastEvent('CONFIG_UPDATE', {
          gameMode: this.gameMode,
          winCondition: this.winCondition
        });
        this.showLobbyToast(`⚙️ Reglas actualizadas: Modo ${this.gameMode} (${this.getWinConditionText()})`, '#ff9800');
      }
    },

    getWinConditionText() {
      if (this.winCondition.type === 'TIME') return `Tiempo: ${this.winCondition.target}s`;
      if (this.winCondition.type === 'MONEY') return `Meta: S/ ${this.winCondition.target}`;
      if (this.winCondition.type === 'CUSTOMERS') return `Meta: ${this.winCondition.target} Clientes`;
      return '';
    },

    // Iniciar cuenta regresiva y lanzar partida
    startCountdownAndLaunch() {
      if (!this.isHost) return;
      if (this.players.length < 2 && this.roomType === 'PRIVATE') {
        this.showLobbyToast('⚠️ Se necesitan al menos 2 jugadores para iniciar.', '#c62828');
        return;
      }

      this.broadcastEvent('START_COUNTDOWN', {
        seconds: 3,
        seed: Math.floor(Math.random() * 1000000)
      });
      this.triggerCountdown(3);
    },

    triggerCountdown(seconds) {
      let count = seconds;
      const overlay = document.getElementById('mp-countdown-overlay');
      const numEl = document.getElementById('mp-countdown-num');
      if (overlay) overlay.style.display = 'flex';
      if (numEl) numEl.textContent = count;

      this.playArcadeSound('countdown_tick');

      clearInterval(this.countdownTimer);
      this.countdownTimer = setInterval(() => {
        count--;
        if (count > 0) {
          if (numEl) numEl.textContent = count;
          this.playArcadeSound('countdown_tick');
        } else if (count === 0) {
          if (numEl) numEl.textContent = '¡A COCINAR! 🍜';
          this.playArcadeSound('countdown_go');
        } else {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
          if (overlay) overlay.style.display = 'none';
          this.launchGameSession();
        }
      }, 1000);
    },

    /* ==========================================================================
       LANZAMIENTO Y EJECUCIÓN DE LA PARTIDA
       ========================================================================== */
    launchGameSession() {
      this.isGameActive = true;
      this.closeLobbyModal();

      // Reset de estadísticas de la partida
      this.myScore = 0;
      this.myCustomersServed = 0;
      this.myCustomersStolen = 0;
      this.sharedMoney = 0;
      this.sharedReputation = 5;
      this.sharedTimeRemaining = this.winCondition.type === 'TIME' ? this.winCondition.target : 300;
      this.stationLocks = {};

      // Mostrar HUD superior multijugador
      const hud = document.getElementById('mp-game-hud');
      if (hud) hud.style.display = 'flex';

      // Activar pantalla de juego en Ramen Mania
      if (typeof executeStartGame === 'function') {
        executeStartGame();
      }

      this.updateMultiplayerHUD();

      // Loop de sincronización de reloj y victoria
      clearInterval(this.gameLoopTimer);
      this.gameLoopTimer = setInterval(() => {
        if (!this.isGameActive) return;

        if (this.isHost) {
          this.sharedTimeRemaining--;
          this.broadcastEvent('TIME_SYNC', {
            timeRemaining: this.sharedTimeRemaining
          });

          // Verificar condición de fin por tiempo
          if (this.winCondition.type === 'TIME' && this.sharedTimeRemaining <= 0) {
            this.handleMatchFinished();
          }
        }
        this.updateMultiplayerHUD();
      }, 1000);

      this.showLobbyToast(`🍜 ¡PARTIDA MULTIJUGADOR INICIADA! (${this.gameMode})`, '#43a047');
    },

    /* ==========================================================================
       MECÁNICA VS: ARREBATO DE CLIENTES (STEAL THE ORDER)
       ========================================================================== */
    // Llamado cuando el jugador sirve con éxito un plato a un cliente
    claimCustomerInVS(customerIndex, customerId, ramenName, price) {
      if (!this.isGameActive || this.gameMode !== 'VS') return;

      this.myScore += Number(price) || 30;
      this.myCustomersServed++;

      const myProf = this.getMyProfile();

      // Notificar a todos los rivales que me quedé con el cliente
      this.broadcastEvent('CLAIM_CUSTOMER', {
        customerIndex,
        customerId,
        ramenName,
        price,
        playerId: myProf.id,
        playerName: myProf.name,
        avatar: myProf.avatar,
        colorIndex: this.myColorIndex,
        score: this.myScore,
        customersServed: this.myCustomersServed
      });

      this.updateMultiplayerHUD();

      // Verificar si alcancé la condición de victoria
      if (this.winCondition.type === 'MONEY' && this.myScore >= this.winCondition.target) {
        this.handleMatchFinished(myProf.name);
      } else if (this.winCondition.type === 'CUSTOMERS' && this.myCustomersServed >= this.winCondition.target) {
        this.handleMatchFinished(myProf.name);
      }
    },

    /* ==========================================================================
       MECÁNICA COOPERATIVA: BLOQUEO DE ESTACIONES Y TAZONES COMPARTIDOS
       ========================================================================== */
    // Intentar bloquear una estación al tocarla
    requestStationLock(stationId) {
      if (!this.isGameActive || this.gameMode !== 'COOP') return true;

      const existingLock = this.stationLocks[stationId];
      if (existingLock && existingLock.playerId !== this.myPlayerId) {
        // Estación ocupada por un compañero
        this.playArcadeSound('lock_denied');
        this.showStationDeniedToast(stationId, existingLock.playerName, existingLock.avatar);
        return false;
      }

      // Bloquear localmente y notificar a los compañeros
      const myProf = this.getMyProfile();
      this.stationLocks[stationId] = {
        playerId: myProf.id,
        playerName: myProf.name,
        avatar: myProf.avatar,
        colorIndex: this.myColorIndex,
        expiresAt: Date.now() + 4500 // Expiración de seguridad de 4.5 segundos
      };

      this.broadcastEvent('STATION_LOCK', {
        stationId,
        playerId: myProf.id,
        playerName: myProf.name,
        avatar: myProf.avatar,
        colorIndex: this.myColorIndex
      });

      this.renderStationLocks();
      return true;
    },

    // Liberar la estación al terminar la acción
    releaseStationLock(stationId) {
      if (!this.isGameActive || this.gameMode !== 'COOP') return;

      const lock = this.stationLocks[stationId];
      if (lock && lock.playerId === this.myPlayerId) {
        delete this.stationLocks[stationId];
        this.broadcastEvent('STATION_UNLOCK', { stationId });
        this.renderStationLocks();
      }
    },

    // Sincronizar el contenido de un tazón compartido
    syncSharedBowl(bowlIndex, bowlData) {
      if (!this.isGameActive || this.gameMode !== 'COOP') return;

      this.broadcastEvent('BOWL_UPDATE', {
        bowlIndex,
        bowlData,
        playerId: this.myPlayerId
      });
    },

    // Sincronizar el estado de una estación de otra área (woks, tabla de makis, frituras) en Modo Co-op
    syncStation(area, index, data) {
      if (!this.isGameActive || this.gameMode !== 'COOP') return;
      this.broadcastEvent('STATION_SYNC', { area, index, data });
    },

    // Sincronizar existencias de cocina en Modo Co-op (fideos, shio, tonkotsu, chasu)
    syncKitchenStocks(stocks, source = '', delta = '') {
      if (!this.isGameActive || this.gameMode !== 'COOP') return;
      const myProf = this.getMyProfile();
      this.broadcastEvent('KITCHEN_STOCKS_UPDATE', {
        stocks: {
          noodles: stocks.noodles || 0,
          shio: stocks.shio || 0,
          tonkotsu: stocks.tonkotsu || 0,
          chasu: stocks.chasu || 0
        },
        source,
        delta,
        chefName: myProf.name,
        avatar: myProf.avatar
      });
    },

    // Sincronizar fila de clientes en Modo Co-op (el Host es la fuente de verdad)
    syncCustomerQueue(customerSlots) {
      if (!this.isGameActive || this.gameMode !== 'COOP' || !this.isHost) return;
      this.broadcastEvent('CUSTOMER_QUEUE_SYNC', {
        customerSlots
      });
    },

    // Servir un plato en cooperativo (suma a la caja y meta del equipo)
    coopServeCustomer(customerIndex, itemIndex, ramenName, price, bowlIndex, area = 'ramen') {
      if (!this.isGameActive || this.gameMode !== 'COOP') return;

      const amount = Number(price) || 35;
      this.sharedMoney += amount;
      this.myCustomersServed++;

      const myProf = this.getMyProfile();
      this.broadcastEvent('COOP_SERVE', {
        customerIndex,
        itemIndex,
        ramenName,
        price: amount,
        bowlIndex,
        area,
        sharedMoney: this.sharedMoney,
        serverName: myProf.name,
        avatar: myProf.avatar
      });

      this.updateMultiplayerHUD();

      if (this.winCondition.type === 'MONEY' && this.sharedMoney >= this.winCondition.target) {
        this.handleMatchFinished('¡El Equipo!');
      } else if (this.winCondition.type === 'CUSTOMERS' && this.myCustomersServed >= this.winCondition.target) {
        this.handleMatchFinished('¡El Equipo!');
      }
    },

    /* ==========================================================================
       MANEJO DE BROADCAST ENTRANTE
       ========================================================================== */
    broadcastEvent(eventType, payload) {
      if (!this.channel) return;
      try {
        this.channel.send({
          type: 'broadcast',
          event: 'game_event',
          payload: {
            eventType,
            senderId: this.myPlayerId,
            timestamp: Date.now(),
            ...payload
          }
        });
      } catch(e) {
        console.warn('Error al emitir evento broadcast:', e);
      }
    },

    handleIncomingBroadcast(data) {
      if (!data || data.senderId === this.myPlayerId) return;

      switch(data.eventType) {
        case 'CONFIG_UPDATE':
          this.gameMode = data.gameMode || this.gameMode;
          this.winCondition = data.winCondition || this.winCondition;
          this.renderRulesUI();
          break;

        case 'START_COUNTDOWN':
          this.triggerCountdown(data.seconds || 3);
          break;

        case 'TIME_SYNC':
          this.sharedTimeRemaining = data.timeRemaining;
          this.updateMultiplayerHUD();
          break;

        case 'CLAIM_CUSTOMER': // En Modo VS: Un rival se quedó con el cliente
          this.handleCustomerStolen(data);
          break;

        case 'STATION_LOCK': // En Modo Co-op: Un amigo ocupó una estación
          this.stationLocks[data.stationId] = {
            playerId: data.playerId,
            playerName: data.playerName,
            avatar: data.avatar,
            colorIndex: data.colorIndex,
            expiresAt: Date.now() + 4500
          };
          this.renderStationLocks();
          break;

        case 'STATION_UNLOCK': // En Modo Co-op: Se liberó la estación
          delete this.stationLocks[data.stationId];
          this.renderStationLocks();
          break;

        case 'BOWL_UPDATE': // En Modo Co-op: Actualización visual del tazón compartido
          this.applyRemoteBowlUpdate(data.bowlIndex, data.bowlData);
          break;

        case 'STATION_SYNC': // En Modo Co-op: estado de woks / tabla de makis / frituras
          if (typeof applyRemoteStation === 'function') applyRemoteStation(data.area, data.index, data.data);
          break;

        case 'KITCHEN_STOCKS_UPDATE': // En Modo Co-op: Sincronización de existencias de cocina
          if (typeof kitchenState !== 'undefined') {
            kitchenState.stocks = {
              noodles: data.stocks.noodles !== undefined ? data.stocks.noodles : kitchenState.stocks.noodles,
              shio: data.stocks.shio !== undefined ? data.stocks.shio : kitchenState.stocks.shio,
              tonkotsu: data.stocks.tonkotsu !== undefined ? data.stocks.tonkotsu : kitchenState.stocks.tonkotsu,
              chasu: data.stocks.chasu !== undefined ? data.stocks.chasu : kitchenState.stocks.chasu
            };
            if (typeof updateKitchenStationsUI === 'function') {
              updateKitchenStationsUI(true); // skipSync = true
            }
            if (data.delta && typeof showStationToast === 'function') {
              showStationToast(`${data.avatar || '👨‍🍳'} ${data.chefName}: ${data.delta}`);
            }
          }
          break;

        case 'CUSTOMER_QUEUE_SYNC': // En Modo Co-op: Sincronización de clientes desde el Host
          if (typeof gameState !== 'undefined') {
            gameState.customerSlots = data.customerSlots;
            if (typeof renderCustomers === 'function') renderCustomers();
          }
          break;

        case 'COOP_SERVE': // En Modo Co-op: Plato servido en equipo
          this.sharedMoney = data.sharedMoney;
          const areaIcon = (typeof AREA_ICONS !== 'undefined' && AREA_ICONS[data.area || 'ramen']) || '🍜';
          this.showActionToast(`${areaIcon} ${data.serverName} sirvió ${data.ramenName} (+S/ ${data.price})`, '#2e7d32');
          this.updateMultiplayerHUD();

          // Vaciar la estación correspondiente en la pantalla del compañero
          if (data.area && data.area !== 'ramen') {
            if (typeof applyRemoteStationServed === 'function') applyRemoteStationServed(data.area, data.bowlIndex);
          } else if (data.bowlIndex !== undefined && typeof gameState !== 'undefined' && gameState.bowls && gameState.bowls[data.bowlIndex]) {
            gameState.bowls[data.bowlIndex] = { ingredients: [], matchedRamen: null };
            if (typeof renderBowls === 'function') renderBowls();
          }

          // Marcar el cliente como atendido
          if (typeof gameState !== 'undefined' && gameState.customerSlots) {
            const cust = gameState.customerSlots[data.customerIndex];
            if (cust && cust.orders) {
              const order = (data.itemIndex !== undefined && cust.orders[data.itemIndex])
                ? cust.orders[data.itemIndex]
                : cust.orders.find(o => !o.served && o.recipe.name === data.ramenName) || cust.orders.find(o => !o.served);
              if (order) {
                order.served = true;
              }
              const allServed = cust.orders.every(o => o.served);
              if (allServed) {
                gameState.customerSlots[data.customerIndex] = null;
                if (typeof closeCustomerOrderModal === 'function') closeCustomerOrderModal();
                if (typeof shiftCustomersLeft === 'function') shiftCustomersLeft();
              }
              if (typeof renderCustomers === 'function') renderCustomers();
            }
          }

          if (this.isHost && typeof gameState !== 'undefined') {
            this.syncCustomerQueue(gameState.customerSlots);
          }
          break;

        case 'REACTION': // Emote flotante en el HUD
          this.showFloatingReaction(data.emoji, data.playerName, data.colorIndex);
          break;

        case 'GAME_OVER': // Fin de la partida
          this.handleMatchFinished(data.winnerName, false);
          break;
      }
    },

    // Alerta visual de cliente arrebatado (VS)
    handleCustomerStolen(data) {
      this.myCustomersStolen++;
      this.playArcadeSound('stolen');

      // Mostrar toast animado grande
      this.showActionToast(
        `💨 ¡${data.playerName} te arrebató el cliente! (+${data.avatar} S/ ${data.price})`,
        '#d32f2f'
      );

      // Actualizar ranking en HUD del rival
      const rival = this.players.find(p => p.id === data.playerId);
      if (rival) {
        rival.score = data.score;
        rival.customersServed = data.customersServed;
      }
      this.updateMultiplayerHUD();

      // Si el cliente estaba en la barra de clientes local, removerlo y traer otro
      if (typeof shiftCustomersLeft === 'function' && typeof gameState !== 'undefined') {
        if (gameState.customers && gameState.customers[data.customerIndex]) {
          gameState.customers.splice(data.customerIndex, 1);
          if (typeof renderCustomers === 'function') renderCustomers();
        }
      }
    },

    // Aplicar actualización visual de un tazón que otro amigo está armando
    applyRemoteBowlUpdate(bowlIndex, bowlData) {
      if (typeof gameState !== 'undefined' && gameState.bowls && gameState.bowls[bowlIndex]) {
        gameState.bowls[bowlIndex] = { ...gameState.bowls[bowlIndex], ...bowlData };
        if (typeof renderBowls === 'function') renderBowls();
      }
    },

    // Fin de la partida y mostrar Podio
    handleMatchFinished(winnerName = null, shouldBroadcast = true) {
      this.isGameActive = false;
      clearInterval(this.gameLoopTimer);

      if (shouldBroadcast) {
        this.broadcastEvent('GAME_OVER', {
          winnerName: winnerName || this.getMyProfile().name
        });
      }

      this.playArcadeSound('win');
      this.showPodiumModal(winnerName);
    },

    /* ==========================================================================
       RENDERIZADO DE LA INTERFAZ (UI)
       ========================================================================== */
    renderLobbyUI() {
      const myProf = this.getMyProfile();
      const nameEl = document.getElementById('mp-my-name-display');
      const avatarEl = document.getElementById('mp-my-avatar-display');
      if (nameEl) nameEl.textContent = myProf.name;
      if (avatarEl) avatarEl.textContent = myProf.avatar;

      this.renderRulesUI();
    },

    renderRulesUI() {
      // Indicadores de modo activo
      document.querySelectorAll('.mp-mode-opt-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === this.gameMode);
      });

      // Indicadores de condición de victoria
      document.querySelectorAll('.mp-win-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.wintype === this.winCondition.type);
      });

      // Indicadores y botones de valor meta adaptados a la condición elegida
      const targetGroup = document.getElementById('mp-targets-group');
      const presets = (this.winPresets && this.winPresets[this.winCondition.type]) || [
        { label: '⏱️ 120s (Normal)', target: 120 },
        { label: '⚡ 60s (Rápido)', target: 60 },
        { label: '🏆 180s (Maratón)', target: 180 }
      ];

      if (targetGroup) {
        targetGroup.innerHTML = presets.map(p => `
          <button type="button" class="mp-opt-btn mp-target-btn ${Number(p.target) === Number(this.winCondition.target) ? 'active' : ''}"
                  data-target="${p.target}"
                  onclick="MultiplayerManager.setRoomRules(null, null, ${p.target})">
            ${p.label}
          </button>
        `).join('');
      } else {
        document.querySelectorAll('.mp-target-btn').forEach(btn => {
          btn.classList.toggle('active', Number(btn.dataset.target) === Number(this.winCondition.target));
        });
      }

      const badge = document.getElementById('mp-room-rule-badge');
      if (badge) {
        badge.textContent = `Modo ${this.gameMode} • ${this.getWinConditionText()}`;
      }
    },

    renderRoomSlots() {
      const slotsContainer = document.getElementById('mp-room-slots-grid');
      if (!slotsContainer) return;

      const codeDisplay = document.getElementById('mp-room-code-display');
      if (codeDisplay) codeDisplay.textContent = this.roomId || '---';

      let html = '';
      for (let i = 0; i < 4; i++) {
        const player = this.players[i];
        const color = PLAYER_COLORS[i];

        if (player) {
          const isMe = player.id === this.myPlayerId;
          const isHost = player.isHost;
          const isReady = player.isReady || isHost;
          const rankTier = player.rankTier || 'Novato';
          const rankIcon = player.rankIcon || '🥢';
          const rankColor = player.rankColor || '#ffb300';
          const playerMmr = player.mmr || 1000;

          html += `
            <div class="mp-player-slot filled" style="border-color: ${color.hex}; background: ${color.bg};">
              <div class="mp-slot-badge" style="background: ${color.hex};">${color.label}</div>
              <div class="mp-slot-avatar">${player.avatar || '🍜'}</div>
              <div class="mp-slot-name">${player.name} ${isMe ? '<span style="font-size:10px; color:#ffb300;">(Tú)</span>' : ''}</div>
              <div class="mp-slot-rank" style="display:inline-flex; align-items:center; gap:4px; font-size:10.5px; font-weight:800; background:rgba(0,0,0,0.3); border-radius:10px; padding:2px 7px; margin-top:3px; color:${rankColor}; border:1px solid rgba(255,255,255,0.15);">
                <span>${rankIcon}</span>
                <span>${rankTier}</span>
                <span style="opacity:0.8; font-size:9.5px;">(${playerMmr} MMR)</span>
              </div>
              <div class="mp-slot-status ${isReady ? 'ready' : 'pending'}" style="margin-top:4px;">
                ${isHost ? '👑 Anfitrión' : (isReady ? '✅ Listo' : '⏳ Esperando...')}
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="mp-player-slot empty">
              <div class="mp-slot-badge" style="background:#555;">${color.label}</div>
              <div class="mp-slot-avatar" style="opacity:0.3;">👤</div>
              <div class="mp-slot-name" style="color:#777;">Slot Vacío</div>
              <div class="mp-slot-status" style="color:#555;">Esperando jugador...</div>
            </div>
          `;
        }
      }

      slotsContainer.innerHTML = html;
      this.updateHostControls();
    },

    updateHostControls() {
      const hostControls = document.getElementById('mp-host-controls');
      const guestControls = document.getElementById('mp-guest-controls');
      const startBtn = document.getElementById('mp-start-game-btn');
      const readyBtn = document.getElementById('mp-ready-btn');
      const editRulesBtn = document.getElementById('mp-host-edit-rules-btn');

      if (this.isHost) {
        if (hostControls) hostControls.style.display = 'block';
        if (guestControls) guestControls.style.display = 'none';
        if (editRulesBtn) editRulesBtn.style.display = 'inline-block';

        if (startBtn) {
          const canStart = this.players.length >= 2;
          startBtn.disabled = !canStart;
          startBtn.style.opacity = canStart ? '1' : '0.5';
          startBtn.textContent = canStart 
            ? `🚀 ¡COMENZAR PARTIDA (${this.players.length}/4)!` 
            : `⏳ Esperando amigos (mínimo 2 jugadores)...`;
        }
      } else {
        if (hostControls) hostControls.style.display = 'none';
        if (guestControls) guestControls.style.display = 'block';
        if (editRulesBtn) editRulesBtn.style.display = 'none';

        if (readyBtn) {
          readyBtn.textContent = this.isReady ? '✅ ¡ESTOY LISTO!' : '⏳ PULSAR LISTO';
          readyBtn.style.background = this.isReady ? '#2e7d32' : '#ff9800';
        }
      }
    },

    // Actualizar el HUD superior multijugador durante la partida
    updateMultiplayerHUD() {
      const container = document.getElementById('mp-hud-players');
      if (!container) return;

      const timerEl = document.getElementById('mp-hud-timer');
      if (timerEl) {
        if (this.winCondition.type === 'TIME') {
          const mins = String(Math.floor(this.sharedTimeRemaining / 60)).padStart(2, '0');
          const secs = String(this.sharedTimeRemaining % 60).padStart(2, '0');
          timerEl.textContent = `⏱️ ${mins}:${secs}`;
          timerEl.style.color = (this.sharedTimeRemaining <= 15) ? '#ff3b30' : '#ffb300';
        } else if (this.winCondition.type === 'MONEY') {
          timerEl.textContent = `💰 Meta: S/ ${this.winCondition.target}`;
        } else {
          timerEl.textContent = `🍜 Meta: ${this.winCondition.target} Clientes`;
        }
      }

      let html = '';
      if (this.gameMode === 'VS') {
        // En VS: Mostrar los 4 chefs ordenados por puntuación
        const sorted = [...this.players].sort((a, b) => {
          const scoreA = (a.id === this.myPlayerId) ? this.myScore : (a.score || 0);
          const scoreB = (b.id === this.myPlayerId) ? this.myScore : (b.score || 0);
          return scoreB - scoreA;
        });

        sorted.forEach((p, idx) => {
          const isMe = p.id === this.myPlayerId;
          const score = isMe ? this.myScore : (p.score || 0);
          const served = isMe ? this.myCustomersServed : (p.customersServed || 0);
          const color = PLAYER_COLORS[idx] || PLAYER_COLORS[0];
          const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '4º'));

          html += `
            <div class="mp-hud-chip ${isMe ? 'is-me' : ''}" style="border-color:${color.hex};">
              <span class="mp-hud-medal">${medal}</span>
              <span class="mp-hud-avatar">${p.avatar || '🍜'}</span>
              <span class="mp-hud-name">${p.name}</span>
              <span class="mp-hud-stat">S/ ${score} (${served}🍜)</span>
            </div>
          `;
        });
      } else {
        // En Co-op: Mostrar la caja registradora común y vidas del restaurante
        const myProf = this.getMyProfile();
        html = `
          <div class="mp-hud-chip coop-bank">
            <span>🏦 Caja Común: <strong>S/ ${this.sharedMoney}</strong></span>
          </div>
          <div class="mp-hud-chip coop-rep">
            <span>⭐ Reputación: <strong>${'★'.repeat(this.sharedReputation)}${'☆'.repeat(5 - this.sharedReputation)}</strong></span>
          </div>
          <div class="mp-hud-chip coop-chefs">
            <span>Chefs activos: <strong>${this.players.length}</strong></span>
          </div>
        `;
      }

      container.innerHTML = html;
    },

    // Renderizar candados y avatares de bloqueo sobre las estaciones
    renderStationLocks() {
      // Limpiar badges antiguos y clases de bloqueo
      document.querySelectorAll('.station-lock-badge').forEach(el => el.remove());
      document.querySelectorAll('.station-locked-by-remote').forEach(el => el.classList.remove('station-locked-by-remote'));

      const now = Date.now();
      Object.keys(this.stationLocks).forEach(stationId => {
        const lock = this.stationLocks[stationId];
        if (!lock || lock.expiresAt < now) {
          delete this.stationLocks[stationId];
          return;
        }

        const targetId = stationId.startsWith('bowl_') ? stationId.replace('bowl_', 'bowl-card-') : stationId;
        const btn = document.getElementById(targetId) || document.getElementById(stationId) || document.querySelector(`[data-station="${stationId}"]`);
        if (btn) {
          const isMe = lock.playerId === this.myPlayerId;
          const badge = document.createElement('div');
          badge.className = 'station-lock-badge';
          badge.style.background = isMe ? 'rgba(76, 175, 80, 0.9)' : 'rgba(211, 47, 47, 0.92)';
          badge.innerHTML = `🔒 ${lock.avatar} ${lock.playerName}`;
          btn.style.position = 'relative';
          btn.appendChild(badge);
          if (!isMe) {
            btn.classList.add('station-locked-by-remote');
          }
        }
      });
    },

    // Mostrar reacción flotante arcade
    sendReaction(emoji) {
      if (!this.channel) return;
      const myProf = this.getMyProfile();
      this.broadcastEvent('REACTION', {
        emoji,
        playerName: myProf.name,
        colorIndex: this.myColorIndex
      });
      this.showFloatingReaction(emoji, myProf.name, this.myColorIndex);
    },

    showFloatingReaction(emoji, playerName, colorIdx) {
      const container = document.getElementById('mp-reactions-layer') || document.body;
      const bubble = document.createElement('div');
      bubble.className = 'mp-reaction-bubble';
      bubble.innerHTML = `<span style="font-size:24px;">${emoji}</span><small>${playerName}</small>`;
      bubble.style.left = `${30 + Math.random() * 40}%`;
      bubble.style.top = '70%';
      container.appendChild(bubble);

      setTimeout(() => bubble.remove(), 2200);
      this.playArcadeSound('pop');
    },

    // Copiar enlace de invitación al portapapeles
    copyInviteLink() {
      if (!this.roomId) return;
      const url = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          this.showLobbyToast('📋 ¡Enlace copiado al portapapeles! Envíalo a tus amigos.', '#2e7d32');
        }).catch(() => {
          this.fallbackCopyText(url);
        });
      } else {
        this.fallbackCopyText(url);
      }
    },

    fallbackCopyText(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showLobbyToast('📋 ¡Enlace copiado! Pégalo en WhatsApp o Discord.', '#2e7d32');
    },

    // Mostrar Podio Final con MMR Delta
    showPodiumModal(winnerName) {
      const modal = document.getElementById('mp-podium-modal');
      if (!modal) return;

      const titleEl = document.getElementById('mp-podium-title');
      const bodyEl = document.getElementById('mp-podium-body');

      if (titleEl) {
        titleEl.textContent = (this.gameMode === 'VS') 
          ? `🏆 ¡Victoria de ${winnerName || 'el Maestro Chef'}!` 
          : `🎉 ¡Servicio Exitoso del Restaurante!`;
      }

      // 1. Determinar posición del jugador local
      let placement = 1;
      let sorted = [];
      const totalPlayers = Math.max(1, this.players.length);

      if (this.gameMode === 'VS') {
        sorted = [...this.players].sort((a, b) => (b.score || 0) - (a.score || 0));
        const myRankIdx = sorted.findIndex(p => p.id === this.myPlayerId);
        placement = myRankIdx >= 0 ? myRankIdx + 1 : 1;
      }

      const isCoopSuccess = this.sharedMoney >= (this.winCondition.target || 300);
      // 2. Registrar y calcular delta MMR
      const mmrInfo = this.recordMatchMmr(placement, totalPlayers, this.gameMode === 'COOP', isCoopSuccess);

      if (bodyEl) {
        const deltaSign = mmrInfo.delta >= 0 ? `+${mmrInfo.delta}` : `${mmrInfo.delta}`;
        const deltaColor = mmrInfo.delta >= 0 ? '#00e676' : '#ff5252';
        const streakBadge = (mmrInfo.streak > 1 && mmrInfo.delta >= 0) 
          ? `<span style="background:rgba(255,112,67,0.25); color:#ff7043; border:1px solid #ff7043; border-radius:10px; padding:2px 8px; font-size:11px; font-weight:900; margin-left:6px;">🔥 Racha x${mmrInfo.streak}</span>` 
          : '';

        let promoBanner = '';
        if (mmrInfo.isTierPromoted) {
          promoBanner = `
            <div style="background:linear-gradient(90deg, #ff8f00, #ffb300); color:#1a0c02; font-family:'Fredoka One', cursive; font-size:14.5px; padding:8px 12px; border-radius:8px; margin-bottom:12px; box-shadow:0 3px 10px rgba(255,179,0,0.5);">
              🎉 ¡FELICITACIONES! ASCENDISTE A ${mmrInfo.newRank.fullName.toUpperCase()} 🎉
            </div>
          `;
        } else if (mmrInfo.isDivPromoted) {
          promoBanner = `
            <div style="background:linear-gradient(90deg, #2e7d32, #43a047); color:#fff; font-family:'Fredoka One', cursive; font-size:13.5px; padding:6px 10px; border-radius:8px; margin-bottom:10px; box-shadow:0 3px 8px rgba(67,160,71,0.4);">
              ⭐ ¡Subiste a División ${mmrInfo.newRank.division}! (${mmrInfo.newRank.fullName})
            </div>
          `;
        }

        const mmrDeltaHtml = `
          ${promoBanner}
          <div class="mp-podium-mmr-card" style="background:linear-gradient(135deg, #2a1512, #180b09); border:2px solid ${mmrInfo.newRank.color}; border-radius:12px; padding:12px 14px; margin-bottom:14px; text-align:center; box-shadow:0 4px 14px rgba(0,0,0,0.5);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:11px; font-weight:900; color:#ffb300; text-transform:uppercase; letter-spacing:1px;">⚔️ Calificación Competitiva (MMR)</span>
              <div>${streakBadge}</div>
            </div>
            <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin:8px 0;">
              <div style="font-size:36px;">${mmrInfo.newRank.icon}</div>
              <div style="text-align:left;">
                <div style="font-family:'Fredoka One', cursive; font-size:19px; color:#fff;">${mmrInfo.newRank.fullName}</div>
                <div style="font-size:13px; font-weight:800; color:#e0e0e0;">
                  ${mmrInfo.newMmr.toLocaleString()} MMR 
                  <span style="color:${deltaColor}; font-weight:900; font-size:14px; margin-left:4px;">(${deltaSign} MMR)</span>
                </div>
              </div>
            </div>
            <!-- Barra de progreso -->
            <div style="margin-top:6px;">
              <div style="display:flex; justify-content:space-between; font-size:10px; color:#cfd8dc; margin-bottom:3px;">
                <span>Progreso a siguiente rango</span>
                <span style="font-weight:800; color:#ffca28;">${mmrInfo.newRank.lp} / 100 LP</span>
              </div>
              <div style="background:rgba(255,255,255,0.12); height:7px; border-radius:4px; overflow:hidden; border:1px solid rgba(255,255,255,0.15);">
                <div style="background:linear-gradient(90deg, #ff9800, #ffca28); width:${mmrInfo.newRank.progressPercent}%; height:100%; transition:width 0.5s ease;"></div>
              </div>
            </div>
          </div>
        `;

        if (this.gameMode === 'VS') {
          let html = mmrDeltaHtml + `<div class="mp-podium-list">`;
          sorted.forEach((p, idx) => {
            const medal = idx === 0 ? '🥇 Oro' : (idx === 1 ? '🥈 Plata' : (idx === 2 ? '🥉 Bronce' : '4º Puesto'));
            const isMe = p.id === this.myPlayerId;
            const rankIcon = p.rankIcon || '🥢';
            const rankTier = p.rankTier || 'Novato';
            html += `
              <div class="mp-podium-card rank-${idx + 1}">
                <div class="mp-podium-rank">${medal}</div>
                <div class="mp-podium-chef">
                  ${p.avatar} ${p.name} ${isMe ? '<strong>(Tú)</strong>' : ''}
                  <span style="display:inline-block; font-size:10px; opacity:0.85; margin-left:4px;">${rankIcon} ${rankTier}</span>
                </div>
                <div class="mp-podium-score">S/ ${p.score || 0} • ${p.customersServed || 0} ramen</div>
              </div>
            `;
          });
          html += `</div>`;
          bodyEl.innerHTML = html;
        } else {
          bodyEl.innerHTML = mmrDeltaHtml + `
            <div style="text-align:center; padding:15px; background:rgba(255,255,255,0.05); border-radius:10px;">
              <div style="font-size:42px;">⭐⭐⭐</div>
              <h3 style="color:#ffb300; margin:8px 0;">¡Cocina 3 Estrellas Michelin!</h3>
              <p>El equipo recaudó <strong>S/ ${this.sharedMoney}</strong> con un trabajo perfecto en equipo.</p>
            </div>
          `;
        }
      }

      modal.classList.add('active');
    },

    // Toasts y Feedback Visual
    showLobbyToast(msg, color = '#ff9800') {
      const toast = document.getElementById('mp-lobby-toast');
      if (toast) {
        toast.textContent = msg;
        toast.style.background = color;
        toast.style.display = 'block';
        toast.style.opacity = '1';
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => { toast.style.display = 'none'; }, 300);
        }, 3200);
      }
    },

    showActionToast(msg, color = '#c62828') {
      const container = document.getElementById('mp-action-toasts-wrap') || document.body;
      const toast = document.createElement('div');
      toast.className = 'mp-action-toast-float';
      toast.style.background = color;
      toast.innerHTML = msg;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
      }, 2500);
    },

    showStationDeniedToast(stationId, occupiedByName, avatar) {
      this.showActionToast(`⚠️ ¡Ocupado por ${avatar} ${occupiedByName}! Coordínate con él.`, '#e53935');
    },

    playArcadeSound(type) {
      if (typeof playSound === 'function') {
        try {
          if (type === 'countdown_tick') playSound('click');
          else if (type === 'countdown_go' || type === 'win') playSound('win');
          else if (type === 'stolen' || type === 'lock_denied') playSound('wrong');
          else if (type === 'pop') playSound('bell');
          else playSound('click');
        } catch(e) {}
      }
    },

    // Configuración inicial de ganchos en el DOM
    setupDOMHooks() {
      // Botón principal en pantalla de inicio
      const startCard = document.getElementById('start-mode-card-multiplayer');
      if (startCard) {
        startCard.addEventListener('click', () => this.openLobbyModal());
      }
    }
  };

  // Exponer globalmente
  window.MultiplayerManager = MultiplayerManager;

  // Auto-inicializar cuando el documento esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MultiplayerManager.init());
  } else {
    MultiplayerManager.init();
  }

})(window);
