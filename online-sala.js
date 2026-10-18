/* Sala online (Multijugador): pantalla horizontal con el estilo actual del juego (barra superior, escena de fondo, pestañas abajo).
   Reconstruye el interior de #multiplayer-lobby-modal conservando los ids y clases que usa multiplayer.js (mp-pane-*, mp-room-*, mp-areas-group…),
   así la lógica de salas y Realtime no cambia. Script clásico; se carga antes de multiplayer.js. */
(function () {
  'use strict';
  var CSS = `
  #multiplayer-lobby-modal { position: fixed; inset: 0; z-index: 10008; display: none; flex-direction: column; box-sizing: border-box; color: #fff; font-family: 'Fredoka', sans-serif;
    padding: var(--sat, 0px) var(--sar, 0px) 0 var(--sal, 0px); background: #120a06; }
  #multiplayer-lobby-modal.active { display: flex; }
  #multiplayer-lobby-modal::before { content: ''; position: absolute; inset: 0; z-index: 0; background: var(--mpl-bg); pointer-events: none; }
  #multiplayer-lobby-modal > * { position: relative; z-index: 1; }
  .mpl-top { flex: none; display: flex; align-items: center; gap: 10px; padding: 6px 12px; background: linear-gradient(#5a2c14, #2b1208); border-bottom: 3px solid #0e0805; }
  .mpl-back { flex: none; width: 40px; height: 34px; border: 2.5px solid #1a0e07; border-radius: 9px; background: linear-gradient(#ffb300, #e68a00); color: #2b1808; font-size: 18px; font-weight: 900; cursor: pointer; box-shadow: 0 2px 0 rgba(0,0,0,.5); }
  .mpl-top h2 { margin: 0; flex: 1; min-width: 0; font: 400 20px/1 'Fredoka One', 'Fredoka', sans-serif; color: #ffe082; text-shadow: 0 2px 0 #1a0e07; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mpl-top h2 small { display: block; margin-top: 2px; font: 800 10.5px 'Fredoka', sans-serif; color: #9ec9ff; letter-spacing: .5px; text-shadow: none; }
  .mpl-me { flex: none; display: flex; align-items: center; gap: 7px; max-width: 46%; padding: 3px 9px 3px 5px; border: 2px solid #1a0e07; border-radius: 10px; background: rgba(0,0,0,.4); color: #fff; font-family: inherit; cursor: pointer; text-align: left; }
  .mpl-me > span:first-child { flex: none; width: 30px; height: 30px; border-radius: 8px; background: #1b0f08; border: 2px solid #ffb300; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .mpl-me b { display: block; font: 900 12.5px/1.1 'Fredoka', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mpl-me small { display: block; font: 800 10px 'Fredoka', sans-serif; color: #ffcc80; white-space: nowrap; }
  .mpl-me > span + span { min-width: 0; } .mpl-me i { font-style: normal; font-size: 12px; opacity: .8; }
  .mpl-body { flex: 1; min-height: 0; position: relative; padding: 8px 12px; display: flex; }
  .mp-tab-pane { display: none; flex: 1; min-width: 0; min-height: 0; gap: 10px; }
  .mpl-tabs { flex: none; display: flex; align-items: center; justify-content: space-around; gap: 4px; height: 38px; padding: 0 8px; background: linear-gradient(#5a2c14, #2b1208); border-top: 3px solid #0e0805; }
  .mp-tab-btn { position: relative; border: 0; background: none; color: #d6c4a4; font: 900 12px/1 'Fredoka', sans-serif; letter-spacing: .4px; padding: 8px 10px; cursor: pointer; text-shadow: 0 1px 0 rgba(0,0,0,.6); white-space: nowrap; }
  .mp-tab-btn.active { color: #ffd54f; font-size: 14px; text-shadow: 0 2px 0 rgba(0,0,0,.7); }
  .mp-tab-btn.active::after { content: ''; position: absolute; left: 14%; right: 14%; bottom: 0; height: 3px; border-radius: 2px; background: #ffd54f; }
  /* tarjetas grandes del menú */
  .mpl-cards { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; min-height: 0; }
  .mpl-card { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 0; padding: 8px 12px; border: 3px solid #0e0805; border-radius: 12px; cursor: pointer; text-align: center; color: #fff; font-family: inherit; box-shadow: 0 4px 0 rgba(0,0,0,.5); overflow: hidden; }
  .mpl-card:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0,0,0,.5); }
  .mpl-card.g { background: linear-gradient(160deg, #1e88e5, #12408a 60%, #0b1f40); } .mpl-card.p { background: linear-gradient(160deg, #ff9800, #b8470a 60%, #3a1608); }
  .mpl-card img { width: 78px; height: 78px; object-fit: contain; filter: drop-shadow(0 3px 4px rgba(0,0,0,.55)); flex: none; }
  .mpl-card .em { font-size: 52px; line-height: 1; } .mpl-card h3 { margin: 0; font: 400 22px/1 'Fredoka One', 'Fredoka', sans-serif; text-shadow: 0 3px 0 rgba(0,0,0,.55); }
  .mpl-card p { margin: 0; max-width: 92%; font: 700 11.5px/1.25 'Fredoka', sans-serif; color: #fff; opacity: .95; text-shadow: 0 1px 0 rgba(0,0,0,.5); }
  .mpl-go { margin-top: 4px; padding: 7px 18px; border: 2px solid #ffe082; border-radius: 12px; background: linear-gradient(135deg, #ffb300, #e64a19 65%, #c62828); font: 900 13px/1 'Fredoka', sans-serif; box-shadow: 0 3px 0 #7f0000; }
  /* botones de opciones (reglas) */
  .mp-btn-group { display: flex; gap: 5px; flex-wrap: wrap; }
  .mp-opt-btn { flex: 1 1 auto; display: flex; align-items: center; justify-content: center; gap: 5px; min-height: 30px; background: #2a1a10; border: 2px solid #0e0805; color: #f1e3c8; font: 800 11.5px/1.1 'Fredoka', sans-serif; padding: 4px 8px; border-radius: 9px; cursor: pointer; box-shadow: 0 2px 0 rgba(0,0,0,.5); }
  .mp-opt-btn img { width: 24px; height: 24px; object-fit: contain; flex: none; }
  .mp-opt-btn.active { background: linear-gradient(135deg, #ffb300, #e65100); border-color: #fff0a8; color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.5); }
  .mp-mode-opt-btn { flex-direction: column; min-height: 58px; font-size: 12.5px; } .mp-mode-opt-btn img { width: 40px; height: 40px; } .mp-mode-opt-btn small { font: 700 9.5px/1.1 'Fredoka', sans-serif; opacity: .85; }
  .mpl-box { min-width: 0; min-height: 0; overflow-y: auto; padding: 8px 10px; border: 2px solid #0e0805; border-radius: 12px; background: rgba(20, 10, 5, .82); -webkit-overflow-scrolling: touch; }
  .mpl-box h4 { margin: 0 0 4px; font: 900 11px/1 'Fredoka', sans-serif; color: #ffb300; letter-spacing: .6px; text-transform: uppercase; }
  .mpl-box .mp-btn-group { margin-bottom: 6px; }
  .mpl-act { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; border: 2px solid #0e0805; border-radius: 11px; padding: 10px; font: 900 13px/1 'Fredoka', sans-serif; color: #fff; cursor: pointer; box-shadow: 0 3px 0 rgba(0,0,0,.55); }
  .mpl-act:disabled { opacity: .5; } .mpl-act:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,.55); }
  .mpl-act.red { background: linear-gradient(135deg, #e53935, #b71c1c); } .mpl-act.green { background: linear-gradient(135deg, #43a047, #1b5e20); } .mpl-act.blue { background: #00b8d4; color: #00262e; } .mpl-act.gold { background: linear-gradient(135deg, #ffb300, #e65100); }
  .mpl-join { display: flex; gap: 6px; margin-top: 4px; } .mpl-join input { flex: 1; min-width: 0; padding: 8px 10px; border: 2px solid #0e0805; border-radius: 9px; background: #fff7e6; color: #2b1808; font: 900 14px 'Fredoka', sans-serif; letter-spacing: 1px; text-transform: uppercase; }
  .mpl-join .mpl-act { width: auto; padding: 8px 14px; }
  /* sala */
  .mpl-room { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; min-height: 0; }
  .mpl-rhead { flex: none; display: flex; align-items: center; gap: 10px; padding: 6px 10px; border: 2px solid #0e0805; border-radius: 12px; background: rgba(20, 10, 5, .85); }
  .mpl-rhead > div:first-child { flex: 1; min-width: 0; } .mpl-rhead span { font: 900 10px 'Fredoka', sans-serif; color: #ffb300; letter-spacing: .6px; }
  #mp-room-code-display { font: 400 24px/1.05 'Fredoka One', 'Fredoka', sans-serif; letter-spacing: 1.5px; color: #fff; }
  #mp-room-rule-badge { font: 700 11px 'Fredoka', sans-serif; color: #ffccbc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mpl-rhead .mpl-act { width: auto; padding: 8px 12px; font-size: 11.5px; }
  .mp-slots-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .mp-player-slot { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; min-width: 0; padding: 8px 4px 6px; border: 2.5px dashed #5a3a20; border-radius: 12px; background: rgba(20, 10, 5, .72); text-align: center; }
  .mp-player-slot.filled { border-style: solid; box-shadow: 0 3px 0 rgba(0,0,0,.5); }
  .mp-slot-badge { position: absolute; top: 5px; left: 5px; font: 900 9px 'Fredoka', sans-serif; padding: 2px 6px; border-radius: 6px; color: #fff; }
  .mp-slot-avatar { font-size: 34px; line-height: 1; } .mp-slot-name { max-width: 100%; font: 900 13px 'Fredoka', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mp-slot-rank { display: inline-flex; align-items: center; gap: 3px; max-width: 100%; font: 800 10px 'Fredoka', sans-serif; background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.15); border-radius: 9px; padding: 1px 6px; white-space: nowrap; overflow: hidden; }
  .mp-slot-status { font: 800 11px 'Fredoka', sans-serif; } .mp-slot-status.ready { color: #81c784; } .mp-slot-status.pending { color: #ffb74d; }
  #mp-host-controls, #mp-guest-controls { flex: none; display: none; }
  #mp-lobby-toast { position: absolute; left: 50%; bottom: 46px; transform: translateX(-50%); z-index: 5; display: none; max-width: 86%; padding: 6px 14px; border-radius: 10px; font: 900 12px 'Fredoka', sans-serif; text-align: center; color: #fff; box-shadow: 0 3px 10px rgba(0,0,0,.6); }
  .mpl-wait { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-align: center; }
  .mpl-wait img { width: 86px; height: 86px; object-fit: contain; animation: heroPulse 1s infinite alternate; } .mpl-wait h3 { margin: 0; font: 400 20px 'Fredoka One', 'Fredoka', sans-serif; color: #7fd4ff; }
  #mp-global-timer { font: 400 30px 'Fredoka One', 'Fredoka', sans-serif; color: #ffca28; }
  /* cuenta regresiva y HUD de partida */
  #mp-countdown-num { font-size: 72px; }
  /* podio */
  #mp-podium-modal .modal-card { width: min(96%, 760px) !important; max-width: none !important; max-height: 100%; overflow-y: auto; padding: 10px 14px !important; }
  #mp-podium-title { font-size: 19px !important; margin: 0 0 6px !important; }
  #mp-podium-body { display: grid; grid-template-columns: 1fr 1.1fr; gap: 12px; align-items: start; text-align: left; }
  #mp-podium-body .mp-podium-list { margin: 0; gap: 6px; } .mp-podium-card > * { min-width: 0; }
  .mp-podium-card { gap: 6px; padding: 6px 10px !important; font: 800 11.5px 'Fredoka', sans-serif; flex-wrap: nowrap; }
  .mp-podium-rank { flex: none; } .mp-podium-chef { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .mp-podium-score { flex: none; color: #ffe082; }
  @media (max-height: 420px) { .mpl-card img { width: 64px; height: 64px; } .mpl-card h3 { font-size: 19px; } .mpl-card p { font-size: 10.5px; } .mp-player-slot { padding-top: 14px; } .mp-slot-avatar { font-size: 28px; } }
  `;
  var A = function (id, fb) { return window.ArteUI ? ArteUI.icon(id, fb) : fb; };
  function bg() {
    var base = 'linear-gradient(180deg, rgba(10,6,3,.72), rgba(10,6,3,.9))';
    return (window.ArteUI && ArteUI.has('esc', 'online')) ? base + ", url('assets/ui/escena_online.webp') center 40% / cover no-repeat" : 'linear-gradient(160deg, #12408a, #0b1f40 60%, #120a06)';
  }
  function html() {
    return '' +
    '<div class="mpl-top"><button class="mpl-back" onclick="MultiplayerManager.closeLobbyModal()" aria-label="Volver">◀</button>' +
      '<h2>MULTIJUGADOR<small>2 a 4 chefs · en vivo</small></h2>' +
      '<button class="mpl-me" onclick="openProfileModal()" aria-label="Tu perfil"><span id="mp-my-avatar-display">🍜</span><span><b id="mp-my-name-display">Cargando...</b><small id="mp-my-rank-display"></small></span><i>✏️</i></button></div>' +
    '<div class="mpl-body">' +
      '<div id="mp-pane-menu" class="mp-tab-pane" style="display:flex"><div class="mpl-cards">' +
        '<button class="mpl-card g" onclick="MultiplayerManager.joinGlobalQueue()">' + A('online_arrebato', '<span class="em">🌐</span>') + '<h3>PARTIDA GLOBAL</h3><p>Busca chefs de tu rango en línea y compite por el MMR.</p><span class="mpl-go">BUSCAR CHEFS ⚡</span></button>' +
        '<button class="mpl-card p" onclick="MultiplayerManager.switchLobbyTab(\'private\')">' + A('online_coop', '<span class="em">🔑</span>') + '<h3>PARTIDA PRIVADA</h3><p>Crea una sala con código para jugar con 2 a 4 amigos, en VS o en equipo.</p><span class="mpl-go">INVITAR AMIGOS 👥</span></button>' +
      '</div></div>' +
      '<div id="mp-pane-global-wait" class="mp-tab-pane"><div class="mpl-wait">' + A('online_arrebato', '<span style="font-size:52px">🌐</span>') +
        '<h3>Buscando chefs en línea…</h3><div id="mp-global-sbmm-status" style="font:800 12.5px Fredoka,sans-serif;color:#ffca28">Emparejando por rango MMR…</div>' +
        '<p id="mp-global-wait-desc" style="margin:0;font:700 11.5px Fredoka,sans-serif;color:#cfd8dc">Buscando rivales de tu misma categoría.</p><div id="mp-global-timer">00:00</div>' +
        '<button class="mpl-act" style="width:auto;padding:8px 22px;background:#455a64" onclick="MultiplayerManager.leaveRoom(); MultiplayerManager.switchLobbyTab(\'menu\');">Cancelar búsqueda</button></div></div>' +
      '<div id="mp-pane-private" class="mp-tab-pane">' +
        '<div class="mpl-box" style="flex:1.7">' +
          '<h4>1 · Modo de juego</h4><div class="mp-btn-group">' +
            '<button class="mp-opt-btn mp-mode-opt-btn active" data-mode="VS" onclick="MultiplayerManager.setRoomRules(\'VS\', null, null)">' + A('online_arrebato', '⚔️') + 'ARREBATO (VS)<small>Te quitan los clientes</small></button>' +
            '<button class="mp-opt-btn mp-mode-opt-btn" data-mode="COOP" onclick="MultiplayerManager.setRoomRules(\'COOP\', null, null)">' + A('online_coop', '🤝') + 'COCINA COMPARTIDA<small>Una caja para el equipo</small></button></div>' +
          '<h4>2 · Cómo se gana</h4><div class="mp-btn-group">' +
            '<button class="mp-opt-btn mp-win-type-btn active" data-wintype="TIME" onclick="MultiplayerManager.setRoomRules(null, \'TIME\', 180)">⏱️ Por tiempo</button>' +
            '<button class="mp-opt-btn mp-win-type-btn" data-wintype="MONEY" onclick="MultiplayerManager.setRoomRules(null, \'MONEY\', 600)">💰 Por dinero</button>' +
            '<button class="mp-opt-btn mp-win-type-btn" data-wintype="CUSTOMERS" onclick="MultiplayerManager.setRoomRules(null, \'CUSTOMERS\', 10)">🍜 Por clientes</button></div>' +
          '<h4>3 · Meta</h4><div class="mp-btn-group" id="mp-targets-group"></div>' +
          '<h4>4 · Cocinas que juegan</h4><div class="mp-btn-group" id="mp-areas-group"></div></div>' +
        '<div class="mpl-box" style="flex:1;display:flex;flex-direction:column;gap:8px;justify-content:center">' +
          '<button type="button" class="mpl-act red" onclick="MultiplayerManager.createPrivateRoom()">✨ CREAR SALA</button>' +
          '<div><h4>¿Tienes un código?</h4><div class="mpl-join"><input type="text" id="mp-join-code-input" placeholder="RAMEN-84" maxlength="12" autocomplete="off">' +
            '<button type="button" class="mpl-act blue" onclick="MultiplayerManager.joinPrivateRoom(document.getElementById(\'mp-join-code-input\').value)">UNIRSE</button></div></div></div></div>' +
      '<div id="mp-pane-room" class="mp-tab-pane"><div class="mpl-room">' +
        '<div class="mpl-rhead"><div><span>CÓDIGO DE SALA</span><div id="mp-room-code-display">RAMEN-00</div><div id="mp-room-rule-badge">Modo VS • Tiempo: 120s</div></div>' +
          '<button type="button" class="mpl-act" id="mp-host-edit-rules-btn" onclick="MultiplayerManager.switchLobbyTab(\'private\')" style="display:none;background:#4e342e">⚙️ Reglas</button>' +
          '<button type="button" class="mpl-act gold" onclick="MultiplayerManager.copyInviteLink()">📋 Copiar enlace</button></div>' +
        '<div class="mp-slots-grid" id="mp-room-slots-grid"></div>' +
        '<div id="mp-host-controls"><button class="mpl-act green" id="mp-start-game-btn" onclick="MultiplayerManager.startCountdownAndLaunch()">🚀 ¡COMENZAR PARTIDA!</button></div>' +
        '<div id="mp-guest-controls"><button class="mpl-act gold" id="mp-ready-btn" onclick="MultiplayerManager.toggleReady()">⏳ PULSAR LISTO</button></div></div></div>' +
    '</div>' +
    '<div id="mp-lobby-toast"></div>' +
    '<div class="mpl-tabs"><button class="mp-tab-btn active" data-tab="menu" onclick="MultiplayerManager.switchLobbyTab(\'menu\')">ELEGIR MODO</button>' +
      '<button class="mp-tab-btn" data-tab="private" onclick="MultiplayerManager.switchLobbyTab(\'private\')">AMIGOS / PRIVADA</button>' +
      '<button class="mp-tab-btn" data-tab="room" onclick="MultiplayerManager.switchLobbyTab(\'room\')">MI SALA</button></div>';
  }
  function build() {
    if (!document.getElementById('mpl-css')) { var s = document.createElement('style'); s.id = 'mpl-css'; s.textContent = CSS; document.head.appendChild(s); }
    var m = document.getElementById('multiplayer-lobby-modal');
    if (!m) { m = document.createElement('div'); m.id = 'multiplayer-lobby-modal'; document.body.appendChild(m); }
    m.className = ''; m.removeAttribute('onclick'); m.style.cssText = '--mpl-bg:' + bg();
    m.innerHTML = html();
  }
  window.OnlineSala = { build: build };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
