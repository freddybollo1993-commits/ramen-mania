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

    // Obtener datos del jugador actual
    getMyProfile() {
      if (typeof DeviceManager !== 'undefined' && DeviceManager.currentPlayer) {
        return {
          id: DeviceManager.deviceId,
          name: DeviceManager.currentPlayer.playerName || 'Chef Anónimo',
          avatar: DeviceManager.currentPlayer.avatar || '🍜'
        };
      }
      const savedName = (typeof safeStorage !== 'undefined') ? safeStorage.getItem('ramen_player_name') : 'Chef Invitado';
      const savedAvatar = (typeof safeStorage !== 'undefined') ? safeStorage.getItem('ramen_player_avatar') : '🍜';
      return {
        id: this.myPlayerId,
        name: savedName || 'Chef Invitado',
        avatar: savedAvatar || '🍜'
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
      this.gameMode = 'VS';
      this.winCondition = { type: 'TIME', target: 120 };

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

    // Unirse a la Cola de Matchmaking Global
    async joinGlobalQueue() {
      const sb = this.getSupabase();
      if (!sb) {
        this.showLobbyToast('⚠️ Conexión en la nube no disponible.', '#c62828');
        return;
      }

      this.leaveRoom();
      this.roomType = 'GLOBAL';
      this.roomId = 'RAMEN_GLOBAL_LOBBY_V1';
      this.isHost = false;
      this.isReady = true;

      await this.connectToChannel(this.roomId);
      this.switchLobbyTab('global-wait');
      this.startGlobalQueueTimer();
    },

    startGlobalQueueTimer() {
      let seconds = 0;
      const timerEl = document.getElementById('mp-global-timer');
      clearInterval(this.globalQueueTimer);
      this.globalQueueTimer = setInterval(() => {
        seconds++;
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
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
          this.showLobbyToast(`👋 ${joined.name || 'Un chef'} se ha unido a la sala.`, '#1976d2');
          this.playArcadeSound('join');
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

      // Suscribirse y publicar estado de presencia propio
      this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.isInMultiplayer = true;
          await this.channel.track({
            id: myProf.id,
            name: myProf.name,
            avatar: myProf.avatar,
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
      if (this.roomType === 'GLOBAL' && this.players.length >= 4) {
        if (this.isHost && !this.isGameActive && !this.countdownTimer) {
          this.startCountdownAndLaunch();
        }
      }
    },

    // Salir de la sala actual y desconectar canal
    leaveRoom() {
      clearInterval(this.countdownTimer);
      clearInterval(this.gameLoopTimer);
      clearInterval(this.globalQueueTimer);
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
          isHost: this.isHost,
          isReady: this.isReady,
          joinedAt: Date.now()
        });
      }
      this.renderRoomSlots();
    },

    // El Host cambia las reglas (VS/Co-op, Tiempo/Dinero/Clientes)
    setRoomRules(newMode, winType, winTarget) {
      if (!this.isHost) return;
      this.gameMode = newMode || this.gameMode;
      this.winCondition = {
        type: winType || this.winCondition.type,
        target: Number(winTarget) || this.winCondition.target
      };

      this.renderRulesUI();
      this.broadcastEvent('CONFIG_UPDATE', {
        gameMode: this.gameMode,
        winCondition: this.winCondition
      });
      this.showLobbyToast(`⚙️ Reglas actualizadas: Modo ${this.gameMode} (${this.getWinConditionText()})`, '#ff9800');
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

    // Servir un plato en cooperativo (suma a la caja y meta del equipo)
    coopServeCustomer(customerIndex, ramenName, price) {
      if (!this.isGameActive || this.gameMode !== 'COOP') return;

      const amount = Number(price) || 35;
      this.sharedMoney += amount;
      this.myCustomersServed++;

      const myProf = this.getMyProfile();
      this.broadcastEvent('COOP_SERVE', {
        customerIndex,
        ramenName,
        price: amount,
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

        case 'COOP_SERVE': // En Modo Co-op: Plato servido en equipo
          this.sharedMoney = data.sharedMoney;
          this.showActionToast(`🍜 ${data.serverName} sirvió ${data.ramenName} (+S/ ${data.price})`, '#2e7d32');
          this.updateMultiplayerHUD();
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

      // Indicadores de valor meta
      document.querySelectorAll('.mp-target-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.target) === Number(this.winCondition.target));
      });

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

          html += `
            <div class="mp-player-slot filled" style="border-color: ${color.hex}; background: ${color.bg};">
              <div class="mp-slot-badge" style="background: ${color.hex};">${color.label}</div>
              <div class="mp-slot-avatar">${player.avatar || '🍜'}</div>
              <div class="mp-slot-name">${player.name} ${isMe ? '<span style="font-size:10px; color:#ffb300;">(Tú)</span>' : ''}</div>
              <div class="mp-slot-status ${isReady ? 'ready' : 'pending'}">
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
    },

    updateHostControls() {
      const hostControls = document.getElementById('mp-host-controls');
      const guestControls = document.getElementById('mp-guest-controls');
      const startBtn = document.getElementById('mp-start-game-btn');
      const readyBtn = document.getElementById('mp-ready-btn');

      if (this.isHost) {
        if (hostControls) hostControls.style.display = 'block';
        if (guestControls) guestControls.style.display = 'none';

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
      // Limpiar badges antiguos
      document.querySelectorAll('.station-lock-badge').forEach(el => el.remove());

      const now = Date.now();
      Object.keys(this.stationLocks).forEach(stationId => {
        const lock = this.stationLocks[stationId];
        if (!lock || lock.expiresAt < now) {
          delete this.stationLocks[stationId];
          return;
        }

        const btn = document.getElementById(stationId) || document.querySelector(`[data-station="${stationId}"]`);
        if (btn) {
          const isMe = lock.playerId === this.myPlayerId;
          const badge = document.createElement('div');
          badge.className = 'station-lock-badge';
          badge.style.background = isMe ? 'rgba(76, 175, 80, 0.9)' : 'rgba(211, 47, 47, 0.92)';
          badge.innerHTML = `🔒 ${lock.avatar} ${lock.playerName}`;
          btn.style.position = 'relative';
          btn.appendChild(badge);
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

    // Mostrar Podio Final
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

      if (bodyEl) {
        if (this.gameMode === 'VS') {
          const sorted = [...this.players].sort((a, b) => (b.score || 0) - (a.score || 0));
          let html = `<div class="mp-podium-list">`;
          sorted.forEach((p, idx) => {
            const medal = idx === 0 ? '🥇 Oro' : (idx === 1 ? '🥈 Plata' : (idx === 2 ? '🥉 Bronce' : '4º Puesto'));
            const isMe = p.id === this.myPlayerId;
            html += `
              <div class="mp-podium-card rank-${idx + 1}">
                <div class="mp-podium-rank">${medal}</div>
                <div class="mp-podium-chef">${p.avatar} ${p.name} ${isMe ? '<strong>(Tú)</strong>' : ''}</div>
                <div class="mp-podium-score">S/ ${p.score || 0} • ${p.customersServed || 0} ramen</div>
              </div>
            `;
          });
          html += `</div>`;
          bodyEl.innerHTML = html;
        } else {
          bodyEl.innerHTML = `
            <div style="text-align:center; padding:15px;">
              <div style="font-size:48px;">⭐⭐⭐</div>
              <h3 style="color:#ffb300; margin:10px 0;">¡Cocina 3 Estrellas Michelin!</h3>
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
