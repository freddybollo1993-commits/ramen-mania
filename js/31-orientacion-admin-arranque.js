/* Módulo 31-orientacion-admin-arranque — Orientación, panel de administración y arranque de la interfaz.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// El manifiesto ya no fuerza horizontal (orientation: any): con 'landscape' la app instalada no abría al primer toque desde una pantalla de inicio
// en vertical (la otra PWA, en vertical, abre al instante). Ahora se abre como cualquier app y el juego pide horizontal al iniciar.
let userDismissedRotateOverlay = false;       // (antes vivía por error al final del módulo de los modelos 3D)
function lockLandscapeIfInstalled() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (!isStandalone || !(screen.orientation && screen.orientation.lock)) return;
  screen.orientation.lock('landscape').catch(() => { window._orientLockFailed = true; try { checkOrientation(); } catch (e) {} });
}
function checkOrientation() {
  if (userDismissedRotateOverlay) return;
  const overlay = document.getElementById('rotate-device-overlay');
  if (!overlay) return;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone && !window._orientLockFailed) {      // app instalada: el juego pide horizontal por código (ver lockLandscapeIfInstalled)
    overlay.style.display = 'none';
    return;
  }

  const isPortrait = window.innerHeight > window.innerWidth;
  const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 750;

  if (isPortrait && isSmallScreen) {
    overlay.style.display = 'flex';
  } else {
    overlay.style.display = 'none';
  }
}

function dismissRotateOverlay() {
  userDismissedRotateOverlay = true;
  const overlay = document.getElementById('rotate-device-overlay');
  if (overlay) overlay.style.display = 'none';
}

function dismissRotateOverlayAndPlay() {
  dismissRotateOverlay();
  handleStartPlayClick();
}

window.addEventListener('resize', () => {
  setTimeout(checkOrientation, 150);
});
window.addEventListener('orientationchange', () => {
  setTimeout(checkOrientation, 250);
});

/* ==========================================================================
   PANEL DE MONITOREO MASTER & ADMINISTRACIÓN (acceso validado por el servidor)
   ========================================================================== */
let isAdminLoggedIn = false;
let currentAdminTab = 'users';
let cachedAdminData = {
  sessions: [],
  users: {},
  levels: {},
  ramenFails: {},
  leaderboard: []
};

function openAdminLoginModal() {
  if (isAdminLoggedIn) {
    openAdminDashboardModal();
    return;
  }
  const userInp = document.getElementById("admin-user-input");
  const passInp = document.getElementById("admin-pass-input");
  const statusEl = document.getElementById("admin-login-status");
  if (userInp) userInp.value = "";
  if (passInp) passInp.value = "";
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.style.color = "#5d4037";
  }
  const modal = document.getElementById("admin-login-modal");
  if (modal) modal.classList.add("active");
}

function closeAdminLoginModal() {
  const modal = document.getElementById("admin-login-modal");
  if (modal) modal.classList.remove("active");
}

async function handleAdminLogin() {
  const passInp = document.getElementById("admin-pass-input");
  const statusEl = document.getElementById("admin-login-status");
  const pass = (passInp ? passInp.value : "").trim();
  if (!pass) return;
  if (statusEl) { statusEl.textContent = "Verificando…"; statusEl.style.color = "#ff9800"; }
  let ok = false, offline = false;
  try {
    const client = await cloudClient();
    const { data, error } = client ? await client.rpc('admin_check', { p_secret: pass }) : { data: null, error: true };
    ok = !!(data && data.ok);
    offline = !!error;
  } catch (e) { offline = true; }
  if (ok) {
    try { sessionStorage.setItem('ramen_admin_secret', pass); } catch (e) {}
    isAdminLoggedIn = true;
    if (passInp) passInp.value = "";
    closeAdminLoginModal();
    openAdminDashboardModal();
  } else {
    if (statusEl) {
      statusEl.textContent = offline ? "⚠️ Sin conexión con el servidor." : "❌ Contraseña incorrecta. Acceso restringido.";
      statusEl.style.color = "#c62828";
    }
    if (passInp) passInp.value = "";
  }
}

function openAdminDashboardModal() {
  if (!isAdminLoggedIn) {
    openAdminLoginModal();
    return;
  }
  if (!gameState.isGameOver && !gameState.isPaused) {
    togglePause();
  }
  const modal = document.getElementById("admin-dashboard-modal");
  if (modal) modal.classList.add("active");
  
  // Renderizado instantáneo con datos locales (0ms)
  processAndRenderAdminData([], [], []);
  switchAdminTab(currentAdminTab || 'users');

  // Sincronizar en segundo plano con Supabase
  refreshAdminDashboard();
}

function closeAdminDashboardModal() {
  const modal = document.getElementById("admin-dashboard-modal");
  if (modal) modal.classList.remove("active");
  if (gameState.isPaused && !gameState.isGameOver) {
    togglePause();
  }
}

function handleAdminLogout() {
  isAdminLoggedIn = false;
  try { sessionStorage.removeItem('ramen_admin_secret'); } catch (e) {}
  closeAdminDashboardModal();
}

function switchAdminTab(tab) {
  currentAdminTab = tab;
  ['users', 'levels', 'ramen', 'sessions'].forEach(t => {
    const btn = document.getElementById(`adm-tab-${t}`);
    const view = document.getElementById(`adm-view-${t}`);
    if (btn) btn.className = `admin-tab-btn ${t === tab ? 'active' : ''}`;
    if (view) view.style.display = (t === tab) ? 'block' : 'none';
  });

  if (tab === 'users') renderAdminUsersTable();
  else if (tab === 'levels') renderAdminLevelsView();
  else if (tab === 'ramen') renderAdminRamenView();
  else if (tab === 'sessions') renderAdminSessionsView();
}

function formatSeconds(sec) {
  if (!sec || isNaN(sec)) return "0s";
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remS = s % 60;
  if (m < 60) return `${m}m ${remS}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM}m`;
}

function processAndRenderAdminData(dbSessions = [], dbPlayers = [], dbLeaderboard = []) {
  let sessions = (dbSessions && dbSessions.length > 0) ? dbSessions : [];
  if (sessions.length === 0) {
    try {
      const rawSessions = safeStorage.getItem('ramen_analytics_sessions') || "[]";
      sessions = JSON.parse(rawSessions);
    } catch(e) {}
  }

  let userAnalytics = {};
  try {
    const rawUsers = safeStorage.getItem('ramen_user_analytics') || "{}";
    userAnalytics = JSON.parse(rawUsers);
  } catch(e) {}

  let failStats = {};
  try {
    const rawFails = safeStorage.getItem('ramen_fail_stats') || "{}";
    failStats = JSON.parse(rawFails);
  } catch(e) {}

  const usersMap = {};

  // 1. Extraer de tabla players en Supabase (si existe)
  if (Array.isArray(dbPlayers)) {
    dbPlayers.forEach(p => {
      const name = (p.player_name || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      usersMap[key] = {
        playerName: name,
        avatar: p.avatar || '🍜',
        deviceId: p.device_id || 'DEV-REGISTRADO',
        deviceInfo: p.device_info || 'Dispositivo Web',
        contact: p.contact || '',
        totalAttempts: 0,
        totalPlayTimeSeconds: 0,
        maxNormalLevel: 1,
        maxRashLevel: 1,
        customersServed: 0,
        customersLost: 0,
        maxScore: 0,
        createdAt: p.created_at || new Date().toISOString(),
        lastActive: p.last_login || p.created_at || new Date().toISOString(),
        isLinkedCurrentDevice: (DeviceManager.deviceId && p.device_id === DeviceManager.deviceId)
      };
    });
  }

  // 2. Extraer de Supabase leaderboard (para consolidar a TODOS los usuarios registrados y con récords)
  if (Array.isArray(dbLeaderboard)) {
    dbLeaderboard.forEach(r => {
      const name = (r.player_name || '').trim();
      if (!name || name === 'Chef Anónimo') return;
      const key = name.toLowerCase();
      if (!usersMap[key]) {
        usersMap[key] = {
          playerName: name,
          avatar: '🍜',
          deviceId: 'DEV-REGISTRADO',
          deviceInfo: 'Dispositivo Vinculado',
          contact: r.contact || '',
          totalAttempts: (r.game_mode !== 'REGISTRO') ? 1 : 0,
          totalPlayTimeSeconds: 0,
          maxNormalLevel: r.level_reached || 1,
          maxRashLevel: 1,
          customersServed: r.customers_served || 0,
          customersLost: 0,
          maxScore: r.score_money || 0,
          createdAt: r.created_at || new Date().toISOString(),
          lastActive: r.created_at || new Date().toISOString(),
          isLinkedCurrentDevice: (DeviceManager.currentPlayer && DeviceManager.currentPlayer.playerName.toLowerCase() === key)
        };
      } else {
        if (r.contact && !usersMap[key].contact) usersMap[key].contact = r.contact;
        usersMap[key].maxScore = Math.max(usersMap[key].maxScore || 0, r.score_money || 0);
        usersMap[key].maxNormalLevel = Math.max(usersMap[key].maxNormalLevel || 1, r.level_reached || 1);
        usersMap[key].customersServed = Math.max(usersMap[key].customersServed || 0, r.customers_served || 0);
        if (r.game_mode !== 'REGISTRO') usersMap[key].totalAttempts += 1;
        if (new Date(r.created_at) > new Date(usersMap[key].lastActive || 0)) usersMap[key].lastActive = r.created_at;
        if (new Date(r.created_at) < new Date(usersMap[key].createdAt || Date.now())) usersMap[key].createdAt = r.created_at;
      }
    });
  }

  // 3. Extraer usuario actual del dispositivo
  if (DeviceManager.currentPlayer) {
    const cp = DeviceManager.currentPlayer;
    const key = cp.playerName.toLowerCase();
    if (!usersMap[key]) {
      usersMap[key] = {
        playerName: cp.playerName,
        avatar: cp.avatar || '🍜',
        deviceId: cp.deviceId || DeviceManager.deviceId,
        deviceInfo: DeviceManager.deviceInfoText,
        contact: cp.contact || '',
        totalAttempts: 0,
        totalPlayTimeSeconds: 0,
        maxNormalLevel: 1,
        maxRashLevel: 1,
        customersServed: 0,
        customersLost: 0,
        maxScore: 0,
        createdAt: cp.createdAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isLinkedCurrentDevice: true
      };
    } else {
      usersMap[key].isLinkedCurrentDevice = true;
      if (!usersMap[key].contact && cp.contact) usersMap[key].contact = cp.contact;
      if (cp.deviceId) usersMap[key].deviceId = cp.deviceId;
      if (cp.deviceInfo) usersMap[key].deviceInfo = cp.deviceInfo;
    }
  }

  // 4. Extraer usuarios guardados localmente
  try {
    const localRegs = JSON.parse(safeStorage.getItem("ramen_registered_users") || "[]");
    localRegs.forEach(reg => {
      const key = (reg.playerName || '').toLowerCase().trim();
      if (!key) return;
      if (!usersMap[key]) {
        usersMap[key] = {
          playerName: reg.playerName,
          avatar: reg.avatar || '🍜',
          deviceId: reg.deviceId || DeviceManager.deviceId,
          deviceInfo: reg.deviceInfo || DeviceManager.deviceInfoText,
          contact: reg.contact || '',
          totalAttempts: 0,
          totalPlayTimeSeconds: 0,
          maxNormalLevel: 1,
          maxRashLevel: 1,
          customersServed: 0,
          customersLost: 0,
          maxScore: 0,
          createdAt: reg.createdAt || new Date().toISOString(),
          lastActive: reg.createdAt || new Date().toISOString(),
          isLinkedCurrentDevice: true
        };
      }
    });
  } catch(e) {}

  Object.values(userAnalytics).forEach(u => {
    const key = u.playerName.toLowerCase();
    if (!usersMap[key]) {
      usersMap[key] = { ...u, avatar: '🍜', isLinkedCurrentDevice: false };
    } else {
      usersMap[key].totalAttempts = Math.max(usersMap[key].totalAttempts, u.totalAttempts || 0);
      usersMap[key].totalPlayTimeSeconds = Math.max(usersMap[key].totalPlayTimeSeconds, u.totalPlayTimeSeconds || 0);
      usersMap[key].maxNormalLevel = Math.max(usersMap[key].maxNormalLevel, u.maxNormalLevel || 1);
      usersMap[key].maxRashLevel = Math.max(usersMap[key].maxRashLevel, u.maxRashLevel || 1);
      usersMap[key].customersServed = Math.max(usersMap[key].customersServed, u.customersServed || 0);
      usersMap[key].customersLost = Math.max(usersMap[key].customersLost, u.customersLost || 0);
    }
  });

  const levelStatsMap = {};
  const aggregatedFails = { ...failStats };

  sessions.forEach(s => {
    const pName = s.player_name || "Chef Anónimo";
    const key = pName.toLowerCase();
    if (!usersMap[key]) {
      usersMap[key] = {
        playerName: pName,
        avatar: '🍜',
        deviceId: s.device_id || 'DEV-LOCAL',
        deviceInfo: 'Navegador Web',
        contact: '',
        totalAttempts: 0,
        totalPlayTimeSeconds: 0,
        maxNormalLevel: 1,
        maxRashLevel: 1,
        customersServed: 0,
        customersLost: 0,
        maxScore: 0,
        createdAt: s.created_at,
        lastActive: s.created_at,
        isLinkedCurrentDevice: false
      };
    }
    const u = usersMap[key];
    u.totalAttempts += 1;
    u.totalPlayTimeSeconds += (s.duration_seconds || 0);
    u.customersServed += (s.customers_served || 0);
    u.customersLost += (s.customers_lost || 0);
    if (s.game_mode === 'NORMAL' && s.level_number > u.maxNormalLevel) u.maxNormalLevel = s.level_number;
    if (s.game_mode === 'RASH' && s.level_number > u.maxRashLevel) u.maxRashLevel = s.level_number;
    if (new Date(s.created_at) > new Date(u.lastActive || 0)) u.lastActive = s.created_at;

    const lvlKey = `${s.game_mode}_${s.level_number}`;
    if (!levelStatsMap[lvlKey]) {
      levelStatsMap[lvlKey] = {
        mode: s.game_mode,
        level: s.level_number,
        totalAttempts: 0,
        wins: 0,
        losses: 0,
        abandoned: 0,
        totalDuration: 0
      };
    }
    const ls = levelStatsMap[lvlKey];
    ls.totalAttempts += 1;
    ls.totalDuration += (s.duration_seconds || 0);
    if (s.outcome === 'WON') ls.wins += 1;
    else if (s.outcome === 'LOST') ls.losses += 1;
    else ls.abandoned += 1;

    if (Array.isArray(s.failed_recipes)) {
      s.failed_recipes.forEach(rName => {
        aggregatedFails[rName] = (aggregatedFails[rName] || 0) + 1;
      });
    }
  });

  cachedAdminData = {
    sessions: sessions,
    users: usersMap,
    levels: levelStatsMap,
    ramenFails: aggregatedFails,
    leaderboard: dbLeaderboard
  };

  const totalPlayersCount = Object.keys(usersMap).length;
  const totalAttemptsCount = sessions.length || Object.values(usersMap).reduce((a, b) => a + (b.totalAttempts || 0), 0);
  const totalPlaySeconds = Object.values(usersMap).reduce((acc, u) => acc + (u.totalPlayTimeSeconds || 0), 0) || sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

  let worstRamenName = "Ninguno";
  let maxFailCount = 0;
  Object.entries(aggregatedFails).forEach(([rName, count]) => {
    if (count > maxFailCount) {
      maxFailCount = count;
      worstRamenName = `${rName} (${count} fallos)`;
    }
  });

  let maxScore = 0;
  if (dbLeaderboard && dbLeaderboard.length > 0) {
    dbLeaderboard.forEach(r => {
      if (r.score_money > maxScore) maxScore = r.score_money;
    });
  }
  if (maxScore === 0) {
    try {
      const rawScores = safeStorage.getItem('ramen_local_scores') || "[]";
      const scores = JSON.parse(rawScores);
      maxScore = scores.reduce((m, s) => Math.max(m, s.score_money || 0), 0);
    } catch(e) {}
  }

  const kpiPlayersEl = document.getElementById("kpi-total-players");
  const kpiAttemptsEl = document.getElementById("kpi-total-attempts");
  const kpiTimeEl = document.getElementById("kpi-total-time");
  const kpiWorstRamenEl = document.getElementById("kpi-worst-ramen");
  const kpiMaxScoreEl = document.getElementById("kpi-max-score");

  if (kpiPlayersEl) kpiPlayersEl.textContent = totalPlayersCount;
  if (kpiAttemptsEl) kpiAttemptsEl.textContent = totalAttemptsCount;
  if (kpiTimeEl) kpiTimeEl.textContent = formatSeconds(totalPlaySeconds);
  if (kpiWorstRamenEl) kpiWorstRamenEl.textContent = worstRamenName;
  if (kpiMaxScoreEl) kpiMaxScoreEl.textContent = `S/ ${maxScore}`;

  if (currentAdminTab === 'users') renderAdminUsersTable();
  else if (currentAdminTab === 'levels') renderAdminLevelsView();
  else if (currentAdminTab === 'ramen') renderAdminRamenView();
  else if (currentAdminTab === 'sessions') renderAdminSessionsView();
}

// Contacto y dispositivo de cada récord: solo se piden al servidor con el secreto de administrador.
async function mergePrivateLeaderboard(rows) {
  let secret = null;
  try { secret = sessionStorage.getItem('ramen_admin_secret'); } catch (e) {}
  if (!secret || !supabaseClient) return rows;
  try {
    const { data } = await supabaseClient.rpc('admin_private_leaderboard', { p_secret: secret });
    if (data && data.ok) {
      const byId = new Map(data.rows.map(r => [r.id, r]));
      rows.forEach(r => { const p = byId.get(r.id); if (p) { r.contact = p.contact; r.device_id = p.device_id; } });
    } else {
      sessionStorage.removeItem('ramen_admin_secret');
    }
  } catch (e) {}
  return rows;
}

function adminUnlockPrivateData() {
  const secret = window.prompt('Secreto de administrador para ver contactos y dispositivos:');
  if (!secret) return;
  try { sessionStorage.setItem('ramen_admin_secret', secret.trim()); } catch (e) {}
  refreshAdminDashboard();
}

async function refreshAdminDashboard() {
  let dbSessions = [];
  let dbPlayers = [];
  let dbLeaderboard = [];

  await ensureSupabaseLoaded();
  if (supabaseClient) {
    try {
      let secret = null;
      try { secret = sessionStorage.getItem('ramen_admin_secret'); } catch (e) {}
      const [resSessions, resPlayers, resLb] = await Promise.all([
        secret ? supabaseClient.rpc('admin_sessions', { p_secret: secret, p_limit: 300 }) : Promise.resolve({ data: null }),
        secret ? supabaseClient.rpc('admin_players', { p_secret: secret }) : Promise.resolve({ data: null }),
        supabaseClient.from('leaderboard').select('id,player_name,score_money,customers_served,level_reached,game_mode,created_at').order('created_at', { ascending: false })
      ]);
      dbSessions = (resSessions.data && resSessions.data.ok) ? resSessions.data.rows : [];
      dbPlayers = (resPlayers.data && resPlayers.data.ok) ? resPlayers.data.rows : [];
      dbLeaderboard = await mergePrivateLeaderboard(resLb.data || []);
    } catch(err) {
      console.warn("Error cargando analíticas de Supabase:", err);
    }
  }

  processAndRenderAdminData(dbSessions, dbPlayers, dbLeaderboard);
}

function renderAdminUsersTable() {
  const tbody = document.getElementById("adm-users-tbody");
  if (!tbody) return;
  const filterVal = (document.getElementById("adm-user-filter")?.value || "").toLowerCase().trim();
  const countLbl = document.getElementById("adm-users-count-label");

  let users = Object.values(cachedAdminData.users || {});
  if (filterVal) {
    users = users.filter(u => 
      (u.playerName && u.playerName.toLowerCase().includes(filterVal)) || 
      (u.contact && u.contact.toLowerCase().includes(filterVal)) ||
      (u.deviceId && u.deviceId.toLowerCase().includes(filterVal))
    );
  }

  // Ordenar por actividad reciente o récord
  users.sort((a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0));

  if (countLbl) {
    countLbl.textContent = `👥 Total Registrados: ${users.length} usuario(s)`;
  }

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:20px; color:#bcaaa4; font-size:12px;">No se encontraron usuarios registrados en la base de datos.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map((u, idx) => {
    const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-";
    const lastActiveDate = u.lastActive ? new Date(u.lastActive).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "-";
    const devShort = u.deviceId ? (u.deviceId.length > 16 ? u.deviceId.substring(0, 16) + '...' : u.deviceId) : 'DEV-ACTIVO';
    const isThisDevice = u.isLinkedCurrentDevice;
    
    // Botón de WhatsApp si hay dígitos
    let contactHtml = `<span style="color:#b0bec5; font-style:italic;">No registrado</span>`;
    if (u.contact) {
      const cleanDigits = u.contact.replace(/\\D/g, '');
      contactHtml = `
        <div style="display:flex; align-items:center; gap:4px;">
          <span style="font-weight:700; color:#fff;">📞 ${escapeHtml(u.contact)}</span>
          ${cleanDigits.length >= 8 ? `<a href="https://wa.me/51${cleanDigits}" target="_blank" class="admin-wa-btn" title="Abrir chat de WhatsApp">💬 WA</a>` : ''}
        </div>
      `;
    }

    return `
      <tr style="${isThisDevice ? 'background:rgba(46, 125, 50, 0.18);' : ''}">
        <td style="text-align:center; font-weight:900; color:#bcaaa4; font-size:10px;">
          ${idx + 1}
        </td>
        <td style="font-weight:900; color:#ffca28; display:flex; align-items:center; gap:6px;">
          <span style="font-size:15px;">${u.avatar || '🍜'}</span>
          <span>${escapeHtml(u.playerName)}</span>
          ${isThisDevice ? `<span style="font-size:8px; background:#2e7d32; color:#fff; padding:1px 4px; border-radius:4px; font-weight:900;">ESTE DISPOSITIVO</span>` : ''}
        </td>
        <td style="font-size:11px;">
          ${contactHtml}
        </td>
        <td style="font-size:10px; color:#cfd8dc; font-family:monospace;" title="${escapeHtml(u.deviceId || '')}">
          <div><strong>${escapeHtml(devShort)}</strong></div>
          <div style="font-size:8.5px; color:#90a4ae;">${escapeHtml(u.deviceInfo || 'Dispositivo Web')}</div>
        </td>
        <td style="font-weight:900; color:#69f0ae; text-align:center;">
          S/ ${u.maxScore || 0}
        </td>
        <td style="font-size:10px; color:#ffe082;">
          <div>🏮 Normal: <strong>Nivel ${u.maxNormalLevel || 1}/5</strong></div>
          <div>⚡ Rash: <strong>Ronda ${u.maxRashLevel || 1}/100</strong></div>
        </td>
        <td style="font-weight:900; color:#ffb300; text-align:center;">
          ${u.totalAttempts}
        </td>
        <td style="font-size:10px; color:#b0bec5; white-space:nowrap;">
          ${regDate}
        </td>
        <td style="font-size:10px; color:#b0bec5; white-space:nowrap;">
          ${lastActiveDate}
        </td>
        <td style="text-align:center;">
          <span style="background:rgba(46,125,50,0.25); color:#81c784; border:1px solid #2e7d32; padding:2px 6px; border-radius:10px; font-size:9.5px; font-weight:800;">🟢 Vinculado</span>
        </td>
      </tr>
    `;
  }).join('');
}

function exportAdminUsersCSV() {
  const users = Object.values(cachedAdminData.users || {});
  if (users.length === 0) {
    alert("No hay usuarios para exportar.");
    return;
  }
  let csv = "Numero,Nombre_Chef,Contacto,Dispositivo_ID,Dispositivo_Info,Record_Dinero,Nivel_Normal,Ronda_Rash,Partidas_Jugadas,Fecha_Registro,Ultima_Actividad\\n";
  users.forEach((u, idx) => {
    csv += `"${idx + 1}","${(u.playerName || '').replace(/"/g, '""')}","${(u.contact || '').replace(/"/g, '""')}","${(u.deviceId || '').replace(/"/g, '""')}","${(u.deviceInfo || '').replace(/"/g, '""')}","${u.maxScore || 0}","${u.maxNormalLevel || 1}","${u.maxRashLevel || 1}","${u.totalAttempts || 0}","${u.createdAt || ''}","${u.lastActive || ''}"\\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `usuarios_registrados_ramen_mania_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderAdminLevelsView() {
  const normContainer = document.getElementById("adm-levels-normal-container");
  const rashContainer = document.getElementById("adm-levels-rash-container");
  const levels = cachedAdminData.levels || {};

  // Modo Normal Niveles 1 al 5
  if (normContainer) {
    normContainer.innerHTML = NIVELES.map((cfg, idx) => {
      const lvlNum = idx + 1;
      const key = `NORMAL_${lvlNum}`;
      const stat = levels[key] || { totalAttempts: 0, wins: 0, losses: 0, abandoned: 0, totalDuration: 0 };
      const winRate = stat.totalAttempts > 0 ? Math.round((stat.wins / stat.totalAttempts) * 100) : 0;
      const avgDuration = stat.totalAttempts > 0 ? Math.round(stat.totalDuration / stat.totalAttempts) : 0;

      return `
        <div style="background:#2c1611; border:1px solid #5d2e22; border-radius:8px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div>
              <span style="font-family:'Fredoka One', cursive; font-size:13px; color:#ffca28;">${cfg.name}</span>
              <span style="font-size:10px; color:#bcaaa4; margin-left:6px;">(Meta: S/ ${cfg.goal} • Tiempo: ${cfg.time}s)</span>
            </div>
            <div style="display:flex; gap:8px; font-size:11px;">
              <span style="color:#ffb300; font-weight:800;">🎮 Intentos: ${stat.totalAttempts}</span>
              <span style="color:#81c784; font-weight:800;">🏆 Ganadas: ${stat.wins}</span>
              <span style="color:#e57373; font-weight:800;">💔 Perdidas: ${stat.losses}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="font-size:10px; color:#cfd8dc; width:90px;">Éxito: <strong>${winRate}%</strong></div>
            <div class="admin-bar-track" style="flex:1;">
              <div class="admin-bar-fill" style="width:${winRate}%; background:linear-gradient(90deg, #e65100, #2e7d32);"></div>
            </div>
            <div style="font-size:10px; color:#bcaaa4; width:110px; text-align:right;">Prom: ${avgDuration}s/partida</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Modo Rash - Resumen de Rondas
  if (rashContainer) {
    const rashKeys = Object.keys(levels).filter(k => k.startsWith('RASH_'));
    let totalRashAttempts = 0;
    let maxRashReached = 1;
    rashKeys.forEach(k => {
      totalRashAttempts += levels[k].totalAttempts;
      const num = parseInt(k.replace('RASH_', ''));
      if (num > maxRashReached) maxRashReached = num;
    });

    rashContainer.innerHTML = `
      <div style="background:#2c1611; border:1px solid #e65100; border-radius:8px; padding:10px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div>
            <span style="font-family:'Fredoka One', cursive; font-size:14px; color:#ff9800;">⚡ Modo Rash - Supervivencia Extrema</span>
          </div>
          <div style="font-size:11px; color:#ffca28; font-weight:800;">
            Total Intentos Rash: ${totalRashAttempts} • Máxima Ronda Jugada: Ronda ${maxRashReached} / 100
          </div>
        </div>
        <div style="font-size:11px; color:#d7ccc8;">
          Distribución de dificultad: A medida que sube la ronda (hasta la 100), la paciencia base de los clientes cae de 45s a 15s y se exigen hasta 404 clientes.
        </div>
      </div>
    `;
  }
}

function renderAdminRamenView() {
  const tbody = document.getElementById("adm-ramen-tbody");
  if (!tbody) return;
  const failStats = cachedAdminData.ramenFails || {};
  const totalFails = Object.values(failStats).reduce((a, b) => a + b, 0) || 1;

  // Crear lista combinada con todas las recetas
  const ramenList = RECETAS_RAMEN.map(r => {
    const failCount = failStats[r.name] || 0;
    const failPct = Math.round((failCount / totalFails) * 100);
    let diag = "✅ Fácil / Bajo Fracaso";
    let diagColor = "#81c784";

    if (r.ingredients.length >= 10 || failPct >= 20) {
      diag = "🔥 Alta Complejidad (" + r.ingredients.length + " ingredientes)";
      diagColor = "#e57373";
    } else if (r.ingredients.length >= 8 || failPct >= 10) {
      diag = "⚠️ Dificultad Moderada";
      diagColor = "#ffb74d";
    }

    return {
      ...r,
      failCount: failCount,
      failPct: failPct,
      diag: diag,
      diagColor: diagColor
    };
  });

  // Ordenar por ramen con más fallos primero
  ramenList.sort((a, b) => b.failCount - a.failCount);

  tbody.innerHTML = ramenList.map((r, idx) => {
    const ingsDisplay = r.ingredients.map(ingId => {
      const ing = INGREDIENTES.find(i => i.id === ingId);
      return ing ? `${ing.icon} ${ing.display}` : "";
    }).join(", ");

    return `
      <tr>
        <td style="text-align:center; font-weight:900; color:#ffca28;">#${idx + 1}</td>
        <td style="font-weight:900; color:#ffffff; font-size:12px;">🍜 ${escapeHtml(r.name)}</td>
        <td style="font-weight:800; color:#81c784;">S/ ${r.price}</td>
        <td style="font-size:10px; color:#cfd8dc; max-width:240px; line-height:1.3;">${ingsDisplay}</td>
        <td style="font-weight:900; color:#ff5252; text-align:center; font-size:13px;">${r.failCount}</td>
        <td style="width:130px;">
          <div style="font-size:9px; color:#ffca28; margin-bottom:2px;">${r.failPct}% del total de fallos</div>
          <div class="admin-bar-track">
            <div class="admin-bar-fill" style="width:${Math.max(5, r.failPct)}%; background:${r.failCount > 0 ? '#ff5252' : '#757575'};"></div>
          </div>
        </td>
        <td style="font-size:10px; font-weight:800; color:${r.diagColor};">
          ${r.diag}
        </td>
      </tr>
    `;
  }).join('');
}

function renderAdminSessionsView() {
  const tbody = document.getElementById("adm-sessions-tbody");
  if (!tbody) return;
  const sessions = cachedAdminData.sessions || [];

  if (sessions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:16px; color:#bcaaa4;">Aún no hay sesiones registradas en la telemetría.</td></tr>`;
    return;
  }

  tbody.innerHTML = sessions.slice(0, 50).map(s => {
    const timeFormatted = s.created_at ? new Date(s.created_at).toLocaleString() : "-";
    const modeLabel = s.game_mode === 'NORMAL' ? `🏮 Normal (N${s.level_number})` : `⚡ Rash (R${s.level_number})`;
    let outcomeBadge = '<span style="background:#757575; color:#fff; padding:2px 6px; border-radius:4px; font-size:9px;">ABANDONÓ</span>';
    if (s.outcome === 'WON') {
      outcomeBadge = '<span style="background:#2e7d32; color:#fff; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:900;">✓ GANÓ</span>';
    } else if (s.outcome === 'LOST') {
      outcomeBadge = '<span style="background:#b71c1c; color:#fff; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:900;">✗ PERDIÓ</span>';
    }

    const failedRamenText = (Array.isArray(s.failed_recipes) && s.failed_recipes.length > 0)
      ? s.failed_recipes.join(", ")
      : "<span style='color:#81c784;'>Ninguno</span>";

    return `
      <tr>
        <td style="font-size:10px; color:#b0bec5;">${timeFormatted}</td>
        <td style="font-weight:800; color:#ffca28;">${escapeHtml(s.player_name || "Chef Anónimo")}</td>
        <td style="font-weight:700; color:#ff9800; font-size:10px;">${modeLabel}</td>
        <td style="text-align:center; font-weight:800;">${s.level_number}</td>
        <td style="color:#81c784; font-weight:700;">${formatSeconds(s.duration_seconds)}</td>
        <td style="font-size:10px;">
          <span style="color:#81c784;">✓ ${s.customers_served || 0}</span> / <span style="color:#e57373;">✗ ${s.customers_lost || 0}</span>
        </td>
        <td style="font-size:10px; color:#ffab91;">${failedRamenText}</td>
        <td style="text-align:center;">${outcomeBadge}</td>
      </tr>
    `;
  }).join('');
}

let isGameUIBooted = false;
// Los botones que solo tienen un emoji o icono toman su nombre del title para lectores de pantalla.
function applyA11yLabels(root) {
  (root || document).querySelectorAll('button[title]:not([aria-label]), [role="button"][title]:not([aria-label])').forEach(el => {
    el.setAttribute('aria-label', el.getAttribute('title'));
  });
}

function bootGameUI() {
  if (isGameUIBooted) return;
  isGameUIBooted = true;
  applyA11yLabels();
  setTimeout(() => { updatePropinasHUD(); cloudBoot(); }, 1800);

  const bootSplash = document.getElementById('boot-splash');
  if (bootSplash) bootSplash.remove();
  const startScr = document.getElementById("start-screen");
  if (startScr) {
    startScr.classList.remove("hidden");
    startScr.style.display = "flex";
    startScr.style.visibility = "visible";
  }

  initSupabase();
  DeviceManager.init();
  try { lockLandscapeIfInstalled(); } catch (e) {}
  checkOrientation();
  updateStartPlayerCard();
  if (!isTutorialCompleted()) {
    setStartSelectedMode('TUTORIAL');
  } else {
    setStartSelectedMode('NORMAL');
  }
  updateStartModesDisplay();
  updateAudioToggleUI();
  setupKitchenStations();
  resetCookingStations();

  if (window.location.search.includes('tutorial=1')) {
    setTimeout(() => {
      if (typeof TutorialManager !== 'undefined') TutorialManager.start();
    }, 300);
  }
}

// Ejecución instantánea y única sin duplicados
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGameUI);
} else {
  bootGameUI();
}
