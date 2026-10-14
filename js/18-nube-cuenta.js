/* Módulo 18-nube-cuenta — Sesión en la nube y pantalla de cuenta.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// ================= Sesión en la nube (login inteligente) =================
// 1) El dispositivo se valida solo: guarda un secreto propio (en la base solo queda su huella) y entra
//    a SU cuenta sin pedir nada.
// 2) Para usar otra cuenta se escribe su clave única; esa sesión es TEMPORAL: se cierra tras 15 min sin
//    actividad (o al cerrar la pestaña) y se vuelve a la cuenta del dispositivo.
// 3) Todo el acceso a la cuenta (alias, contacto, propinas, mejoras) pasa por funciones del servidor que
//    exigen una sesión vigente; las tablas no se pueden leer desde el navegador.
const CLOUD_IDLE_KEY_MS = 15 * 60 * 1000;
const CLOUD_IDLE_DEVICE_MS = 30 * 60 * 1000;
const CLOUD_SESSION_KEY = 'ramen_cloud_session';
const DEVICE_SECRET_KEY = 'ramen_device_secret';
const ACCOUNT_OWNER_KEY = 'ramen_account_id';
const DEVICE_STASH_KEY = 'ramen_device_account_stash';
const CloudAuth = { token: null, kind: null, accountId: null, deviceAccountId: null, status: 'idle',
  lastActivity: Date.now(), touchedAt: 0, persistedAt: 0, pendingKey: null, loginPromise: null };

function getDeviceSecret() {
  let sec = safeStorage.getItem(DEVICE_SECRET_KEY);
  if (!sec) {
    try { const m = document.cookie.match(/(?:^|; )ramen_device_secret=([^;]*)/); if (m && m[1]) sec = m[1]; } catch (e) {}
  }
  if (!sec || sec.length < 32) {
    const bytes = new Uint8Array(32);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
    sec = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  safeStorage.setItem(DEVICE_SECRET_KEY, sec);
  try { document.cookie = `ramen_device_secret=${sec}; max-age=315360000; path=/; SameSite=Lax`; } catch (e) {}
  return sec;
}

// Llamada al servidor sin esperar respuesta (el cliente devuelve un objeto con .then, no una promesa completa).
function cloudFire(p) { try { Promise.resolve(p).catch(() => {}); } catch (e) {} }

async function cloudClient() {
  await ensureSupabaseLoaded();
  return initSupabase() || supabaseClient;
}

function persistCloudSession() {
  try {
    sessionStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify({ token: CloudAuth.token, kind: CloudAuth.kind,
      accountId: CloudAuth.accountId, deviceAccountId: CloudAuth.deviceAccountId, lastActivity: CloudAuth.lastActivity }));
  } catch (e) {}
}
function clearCloudSession() { try { sessionStorage.removeItem(CLOUD_SESSION_KEY); } catch (e) {} }

function readLocalProfile() {
  const p = (typeof DeviceManager !== 'undefined' && DeviceManager.currentPlayer) || null;
  return {
    alias: (p && p.playerName) || safeStorage.getItem('ramen_player_name') || '',
    avatar: (p && p.avatar) || safeStorage.getItem('ramen_player_avatar') || '🍜',
    contact: (p && p.contact) || safeStorage.getItem('ramen_player_contact') || ''
  };
}

// Escribe el perfil de la cuenta en el almacenamiento local (que usa el resto del juego).
function setLocalProfileFromAccount(acc) {
  const prev = (DeviceManager.currentPlayer) || {};
  const player = { ...prev, playerName: acc.alias, contact: acc.contact || '', avatar: acc.avatar || '🍜',
    deviceId: DeviceManager.deviceId, deviceInfo: DeviceManager.deviceInfoText, createdAt: prev.createdAt || new Date().toISOString() };
  DeviceManager.currentPlayer = player;
  safeStorage.setItem('ramen_profile_explicit_registered', 'true');
  safeStorage.setItem('ramen_player_profile', JSON.stringify(player));
  safeStorage.setItem('ramen_player_name', player.playerName);
  safeStorage.setItem('ramen_player_contact', player.contact);
  safeStorage.setItem('ramen_player_avatar', player.avatar);
  updateStartPlayerCard();
  renderLinkedUserBadges();
}

// Combina la cuenta del servidor con la caché local. La caché lleva el id de su dueño: si es de otra
// cuenta se REEMPLAZA (nunca se mezcla) para que las propinas de una cuenta no pasen a otra.
function applyCloudAccount(acc) {
  loadAccountProgressLocal();
  const owner = safeStorage.getItem(ACCOUNT_OWNER_KEY);
  const mergeLocal = !owner || owner === acc.id; // sin dueño = datos de antes de la nube: se adoptan
  let trainingAhead = false, statsAhead = false;
  if (mergeLocal) {
    accountProgress.earned = Math.max(accountProgress.earned, acc.tips_earned || 0);
    accountProgress.levels = mergeLevels(accountProgress.levels, acc.upgrades || {});
    accountProgress.training = mergeTraining(accountProgress.training || {}, acc.training || {});
    trainingAhead = JSON.stringify(accountProgress.training) !== JSON.stringify(mergeTraining({}, acc.training || {}));
    accountProgress.stats = mergeStats(accountProgress.stats, acc.stats || {});
    statsAhead = JSON.stringify(accountProgress.stats) !== JSON.stringify(mergeStats({}, acc.stats || {}));
  } else {
    accountProgress.earned = acc.tips_earned || 0;
    accountProgress.levels = mergeLevels({}, acc.upgrades || {});
    accountProgress.training = mergeTraining({}, acc.training || {});
    accountProgress.stats = mergeStats({}, acc.stats || {});
  }
  saveAccountProgressLocal();
  applyPvpFromAccount(acc, mergeLocal);
  safeStorage.setItem(ACCOUNT_OWNER_KEY, acc.id);
  CloudAuth.accountId = acc.id;
  try { if (typeof japonSyncAccount === 'function') japonSyncAccount(); } catch (e) {}
  const hasCloudProfile = acc.alias && acc.alias !== 'Chef';
  if (hasCloudProfile) setLocalProfileFromAccount(acc);
  updatePropinasHUD();
  return { mergeLocal, needsProfileUpload: mergeLocal && !hasCloudProfile && !!readLocalProfile().alias,
    localAhead: mergeLocal && (trainingAhead || statsAhead || accountProgress.earned > (acc.tips_earned || 0)) };
}

async function cloudLogin() {
  if (CloudAuth.loginPromise) return CloudAuth.loginPromise;
  CloudAuth.loginPromise = (async () => {
    const id = accountDeviceId();
    if (!id) return false;
    try {
      const client = await cloudClient();
      if (!client) throw new Error('sin cliente');
      CloudAuth.status = 'connecting';
      const local = readLocalProfile();
      const { data, error } = await client.rpc('auth_device', {
        p_device_id: id, p_secret: getDeviceSecret(), p_alias: local.alias || null, p_avatar: local.avatar || null });
      if (error || !data || !data.ok) throw new Error((data && data.error) || (error && error.message) || 'login');
      CloudAuth.token = data.token; CloudAuth.kind = 'device'; CloudAuth.status = 'device';
      CloudAuth.deviceAccountId = data.account.id; CloudAuth.lastActivity = Date.now();
      persistCloudSession();
      if (data.new_key) CloudAuth.pendingKey = data.new_key;
      const r = applyCloudAccount(data.account);
      if (r.needsProfileUpload) await cloudSaveProfile();
      if (r.localAhead) await accountPush();
      accountProgress.sync = 'ok';
      updateAccountButton();
      refreshUpgradesShopIfOpen();
      if (CloudAuth.pendingKey) maybeShowPendingKey();
      return true;
    } catch (e) {
      CloudAuth.status = 'offline';
      accountProgress.sync = 'error';
      updateAccountButton();
      return false;
    } finally {
      CloudAuth.loginPromise = null;
    }
  })();
  return CloudAuth.loginPromise;
}

// Al abrir el juego: se reutiliza la sesión de esta pestaña si sigue vigente; si no, el dispositivo entra solo.
async function cloudBoot() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CLOUD_SESSION_KEY) || 'null');
    if (saved && saved.token) {
      const ttl = saved.kind === 'key' ? CLOUD_IDLE_KEY_MS : CLOUD_IDLE_DEVICE_MS;
      if (Date.now() - (saved.lastActivity || 0) < ttl) {
        CloudAuth.token = saved.token; CloudAuth.kind = saved.kind; CloudAuth.accountId = saved.accountId;
        CloudAuth.deviceAccountId = saved.deviceAccountId; CloudAuth.lastActivity = saved.lastActivity;
        const client = await cloudClient();
        const { data } = client ? await client.rpc('get_account', { p_token: saved.token }) : { data: null };
        if (data && data.ok) {
          CloudAuth.status = saved.kind === 'key' ? 'key' : 'device';
          applyCloudAccount(data.account);
          accountProgress.sync = 'ok';
          updateAccountButton();
          refreshUpgradesShopIfOpen();
          return;
        }
      } else if (saved.kind === 'key') {
        showStationToast('🔐 Tu sesión temporal se cerró por inactividad.');
      }
    }
  } catch (e) {}
  CloudAuth.token = null; CloudAuth.kind = null; clearCloudSession();
  await cloudLogin();
}

// Llamada al servidor con la sesión actual; si caducó, el dispositivo se vuelve a validar solo.
async function cloudCall(fn, args) {
  const client = await cloudClient();
  if (!client) throw new Error('offline');
  if (!CloudAuth.token && !(await cloudLogin())) throw new Error('sin sesión');
  let { data, error } = await client.rpc(fn, { p_token: CloudAuth.token, ...(args || {}) });
  if (error) throw error;
  if (data && data.ok === false && data.error === 'sesion_vencida') {
    if (CloudAuth.kind === 'key') {
      await cloudReturnToDevice('Tu sesión temporal caducó');
      throw new Error('sesion temporal caducada');
    }
    CloudAuth.token = null;
    if (!(await cloudLogin())) throw new Error('sin sesión');
    ({ data, error } = await client.rpc(fn, { p_token: CloudAuth.token, ...(args || {}) }));
    if (error) throw error;
  }
  return data;
}

// Guarda el perfil indicado en la cuenta y devuelve la respuesta del servidor (p. ej. error 'alias_ocupado').
async function cloudSaveProfileNow(p) {
  try {
    return (await cloudCall('save_account', { p_alias: p.alias, p_avatar: p.avatar, p_contact: p.contact || '' })) || {};
  } catch (e) { return { offline: true }; }
}

// Ranking competitivo (MMR): si la cuenta ya lo tiene en el servidor, ese valor manda; una cuenta distinta no hereda el local.
function applyPvpFromAccount(acc, mergeLocal) {
  const pv = acc && acc.pvp;
  if (!pv) return;
  const num = k => parseInt(safeStorage.getItem(k) || '0', 10) || 0;
  const localGames = num('ramen_player_pvp_wins') + num('ramen_player_pvp_losses');
  const serverGames = (pv.wins || 0) + (pv.losses || 0);
  let v = null;
  if (pv.synced && (!mergeLocal || serverGames >= localGames)) v = pv;
  else if (!pv.synced && !mergeLocal) v = { mmr: 1000, rank_tier: 'Bronce IV', wins: 0, losses: 0, streak: 0, highest: 1000 };
  if (v) {
    safeStorage.setItem('ramen_player_mmr', String(v.mmr));
    safeStorage.setItem('ramen_player_rank_tier', v.rank_tier);
    safeStorage.setItem('ramen_player_pvp_wins', String(v.wins));
    safeStorage.setItem('ramen_player_pvp_losses', String(v.losses));
    safeStorage.setItem('ramen_player_pvp_streak', String(v.streak));
    safeStorage.setItem('ramen_player_highest_mmr', String(v.highest));
    const cp = DeviceManager.currentPlayer;
    if (cp) { cp.mmr = v.mmr; cp.rankTier = v.rank_tier; cp.pvpWins = v.wins; cp.pvpLosses = v.losses; cp.pvpStreak = v.streak; cp.highestMmr = v.highest; }
  } else if (!pv.synced && localGames > 0 && CloudAuth.kind === 'device') {
    // el dispositivo ya tenía partidas competitivas: se suben una sola vez
    cloudFire(cloudCall('pvp_sync', { p_mmr: num('ramen_player_mmr'), p_rank_tier: safeStorage.getItem('ramen_player_rank_tier') || 'Bronce IV',
      p_wins: num('ramen_player_pvp_wins'), p_losses: num('ramen_player_pvp_losses'), p_streak: num('ramen_player_pvp_streak'), p_highest: num('ramen_player_highest_mmr') }));
  }
}

async function cloudSaveProfile() {
  const p = readLocalProfile();
  if (!p.alias) return;
  try {
    await cloudCall('save_account', { p_alias: p.alias, p_avatar: p.avatar, p_contact: p.contact || '' });
  } catch (e) {}
}

// Trae la cuenta y la combina con lo local (lo mayor gana).
async function accountPull() {
  try {
    accountProgress.sync = 'syncing';
    refreshUpgradesShopIfOpen();
    const d = await cloudCall('get_account', {});
    if (d && d.ok) {
      const r = applyCloudAccount(d.account);
      if (r.localAhead) await accountPush();
    }
    accountProgress.sync = (d && d.ok) ? 'ok' : 'error';
  } catch (e) {
    accountProgress.sync = 'error';
  }
  refreshUpgradesShopIfOpen();
}

async function accountPush() {
  try {
    loadAccountProgressLocal();
    const d = await cloudCall('save_account', { p_tips: accountProgress.earned, p_upgrades: accountProgress.levels, p_training: accountProgress.training || {}, p_stats: accountProgress.stats });
    if (d && d.ok) {
      accountProgress.earned = Math.max(accountProgress.earned, d.account.tips_earned || 0);
      accountProgress.levels = mergeLevels(accountProgress.levels, d.account.upgrades || {});
      accountProgress.training = mergeTraining(accountProgress.training || {}, d.account.training || {});
      accountProgress.stats = mergeStats(accountProgress.stats, d.account.stats || {});
      accountProgress.statsDirty = false;
      saveAccountProgressLocal();
      updatePropinasHUD();
      accountProgress.sync = 'ok';
    } else accountProgress.sync = 'error';
  } catch (e) {
    accountProgress.sync = 'error';
  }
  refreshUpgradesShopIfOpen();
}

// Las propinas llegan de a pocas: se agrupan para no llamar al servidor en cada una.
function accountPushSoon(immediate) {
  clearTimeout(accountProgress.pushTimer);
  accountProgress.pushTimer = setTimeout(accountPush, immediate ? 0 : 2500);
}

// ----- Cambio de cuenta con clave -----
async function cloudSwitchWithKey(rawKey) {
  const key = (rawKey || '').trim();
  if (key.replace(/[^A-Za-z0-9]/g, '').length < 12) return { ok: false, message: 'Escribe la clave completa (RAMEN-XXXX-XXXX-XXXX-XXXX).' };
  const client = await cloudClient();
  if (!client) return { ok: false, message: 'Sin conexión: no se puede validar la clave.' };
  if (!CloudAuth.token) await cloudLogin();
  const { data, error } = await client.rpc('auth_key', { p_device_id: accountDeviceId(), p_secret: getDeviceSecret(), p_key: key });
  if (error || !data) return { ok: false, message: 'No se pudo validar la clave. Inténtalo de nuevo.' };
  if (!data.ok) {
    if (data.error === 'clave_no_valida') return { ok: false, message: `Clave no válida. Te quedan ${data.remaining} intento(s).` };
    if (data.error === 'bloqueado') return { ok: false, message: `Demasiados intentos. Espera ${Math.ceil(data.retry_in_seconds / 60)} min.` };
    return { ok: false, message: 'Este dispositivo no pudo validarse. Recarga la página.' };
  }
  if (data.account.id === CloudAuth.deviceAccountId) {
    cloudFire(client.rpc('end_session', { p_token: data.token }));
    return { ok: false, message: 'Esa es la cuenta de este dispositivo: ya estás en ella.' };
  }
  // Se guarda una copia de la cuenta del dispositivo para poder volver aunque no haya conexión.
  if (CloudAuth.kind === 'device') {
    loadAccountProgressLocal();
    safeStorage.setItem(DEVICE_STASH_KEY, JSON.stringify({ id: CloudAuth.deviceAccountId, profile: readLocalProfile(),
      earned: accountProgress.earned, levels: accountProgress.levels, training: accountProgress.training || {}, stats: accountProgress.stats }));
  }
  const oldToken = CloudAuth.token;
  CloudAuth.token = data.token; CloudAuth.kind = 'key'; CloudAuth.status = 'key'; CloudAuth.lastActivity = Date.now();
  persistCloudSession();
  if (oldToken && CloudAuth.deviceAccountId) cloudFire(client.rpc('end_session', { p_token: oldToken }));
  applyCloudAccount(data.account);
  accountProgress.sync = 'ok';
  updateAccountButton();
  refreshUpgradesShopIfOpen();
  return { ok: true, message: `Entraste como ${data.account.alias}. La sesión temporal se cierra tras 15 min sin actividad.` };
}

// Cierra la sesión temporal y vuelve a la cuenta del dispositivo.
async function cloudReturnToDevice(reason) {
  const oldToken = CloudAuth.token;
  CloudAuth.token = null; CloudAuth.kind = null; clearCloudSession();
  try {
    const client = await cloudClient();
    if (client && oldToken) cloudFire(client.rpc('end_session', { p_token: oldToken }));
  } catch (e) {}
  const ok = await cloudLogin();
  if (!ok) {
    try { // sin conexión: se restaura la copia de la cuenta del dispositivo
      const st = JSON.parse(safeStorage.getItem(DEVICE_STASH_KEY) || 'null');
      if (st) {
        accountProgress.earned = st.earned || 0; accountProgress.levels = st.levels || {}; accountProgress.training = st.training || {}; accountProgress.stats = mergeStats({}, st.stats || {});
        saveAccountProgressLocal();
        safeStorage.setItem(ACCOUNT_OWNER_KEY, st.id);
        if (st.profile && st.profile.alias) setLocalProfileFromAccount({ alias: st.profile.alias, avatar: st.profile.avatar, contact: st.profile.contact });
        updatePropinasHUD();
      }
    } catch (e) {}
  }
  if (reason) showStationToast(`🔐 ${reason}. Volviste a la cuenta de este dispositivo.`);
  updateAccountButton();
  refreshUpgradesShopIfOpen();
  refreshAccountModalIfOpen();
}

async function cloudLinkDevice() {
  try {
    const d = await cloudCall('link_device', {});
    if (!d || !d.ok) return { ok: false, message: 'No se pudo vincular. Vuelve a entrar con la clave.' };
    CloudAuth.token = d.token; CloudAuth.kind = 'device'; CloudAuth.status = 'device';
    CloudAuth.deviceAccountId = d.account.id; CloudAuth.accountId = d.account.id; CloudAuth.lastActivity = Date.now();
    safeStorage.removeItem(DEVICE_STASH_KEY);
    persistCloudSession();
    updateAccountButton();
    return { ok: true, message: 'Listo: este dispositivo ahora entra siempre a esta cuenta.' };
  } catch (e) {
    return { ok: false, message: 'No se pudo vincular (sin conexión).' };
  }
}

async function cloudRotateKey() {
  try {
    const d = await cloudCall('rotate_access_key', {});
    if (d && d.ok) { CloudAuth.pendingKey = d.key; return { ok: true, key: d.key }; }
    return { ok: false, message: d && d.error === 'solo_sesion_del_dispositivo' ? 'Vuelve a tu cuenta del dispositivo para cambiar su clave.' : 'No se pudo generar la clave.' };
  } catch (e) {
    return { ok: false, message: 'Sin conexión: no se puede generar la clave.' };
  }
}

// ----- Actividad e inactividad -----
function cloudMarkActivity() {
  const now = Date.now();
  CloudAuth.lastActivity = now;
  if (CloudAuth.token && now - CloudAuth.persistedAt > 10000) { CloudAuth.persistedAt = now; persistCloudSession(); }
  if (CloudAuth.token && now - CloudAuth.touchedAt > 120000) {
    CloudAuth.touchedAt = now;
    cloudClient().then(c => c && c.rpc('touch_session', { p_token: CloudAuth.token })).catch(() => {});
  }
}

function cloudIdleCheck() {
  const idle = Date.now() - CloudAuth.lastActivity;
  if (CloudAuth.kind === 'key' && idle > CLOUD_IDLE_KEY_MS) {
    cloudReturnToDevice('Sesión temporal cerrada por inactividad');
  } else if (CloudAuth.kind === 'device' && CloudAuth.token && idle > CLOUD_IDLE_DEVICE_MS) {
    CloudAuth.token = null; CloudAuth.status = 'idle'; clearCloudSession(); // el dispositivo vuelve a entrar solo al usarse
  }
}

['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(ev => document.addEventListener(ev, cloudMarkActivity, { passive: true, capture: true }));
setInterval(cloudIdleCheck, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) cloudIdleCheck(); });

// ----- Pantalla "Cuenta" -----
function updateAccountButton() {
  const btn = document.querySelector('.btn-account');
  if (!btn) return;
  const label = document.getElementById('acc-btn-label');
  const temp = CloudAuth.kind === 'key';
  btn.classList.toggle('is-temp', temp);
  btn.classList.toggle('has-key', !!CloudAuth.pendingKey);
  if (label) label.textContent = temp ? 'Temporal' : 'Cuenta';
}

function maybeShowPendingKey() {
  const start = document.getElementById('start-screen');
  const visible = start && !start.classList.contains('hidden') && start.style.display !== 'none';
  if (visible) openAccountModal();
  else showStationToast('🔐 Se creó tu cuenta. Abre "Cuenta" en el menú de inicio para ver tu clave.');
}

function openAccountModal() {
  renderAccountModal();
  document.getElementById('account-modal').style.display = '';
  document.getElementById('account-modal').classList.add('active');
}
function closeAccountModal() {
  document.getElementById('account-modal').classList.remove('active');
  CloudAuth.pendingKey = null;
  updateAccountButton();
}
function refreshAccountModalIfOpen() {
  const m = document.getElementById('account-modal');
  if (m && m.classList.contains('active')) renderAccountModal();
}

function renderAccountModal() {
  const temp = CloudAuth.kind === 'key';
  const p = readLocalProfile();
  const st = document.getElementById('acc-status');
  if (st) {
    const conn = CloudAuth.status === 'offline' ? '📴 Sin conexión con la nube' : (temp ? '🔓 Sesión temporal' : '🔒 Sesión del dispositivo');
    st.innerHTML = `<b>${escapeHtml(p.avatar)} ${escapeHtml(p.alias || 'Chef')}</b><span>${conn}${temp ? ' · se cierra tras 15 min sin actividad' : ' · este dispositivo entra solo'}</span>`;
  }
  const keyBox = document.getElementById('acc-key-box');
  if (keyBox) {
    keyBox.innerHTML = CloudAuth.pendingKey
      ? `<div class="acc-key">${escapeHtml(CloudAuth.pendingKey)}</div><div class="acc-warn">⚠️ Guárdala ahora: solo se muestra esta vez. Con ella puedes entrar a tu cuenta desde otro dispositivo.</div><button class="acc-btn" onclick="copyAccountKey()">📋 Copiar</button>`
      : `<div class="acc-hint">Tu clave no se puede volver a mostrar. Si la perdiste, genera una nueva (la anterior deja de funcionar).</div>`;
  }
  const rot = document.getElementById('acc-rotate-btn');
  if (rot) rot.style.display = temp ? 'none' : '';
  const tempBox = document.getElementById('acc-temp');
  if (tempBox) tempBox.style.display = temp ? '' : 'none';
  const msg = document.getElementById('acc-msg');
  if (msg && !msg.dataset.keep) msg.textContent = '';
}

async function accountUiRotate() {
  const msg = document.getElementById('acc-msg');
  msg.textContent = 'Generando clave…'; msg.dataset.keep = '1';
  const r = await cloudRotateKey();
  msg.dataset.keep = '';
  if (r.ok) { msg.textContent = ''; renderAccountModal(); } else msg.textContent = r.message;
}
async function accountUiSwitch() {
  const input = document.getElementById('acc-key-input');
  const msg = document.getElementById('acc-msg');
  msg.textContent = 'Validando…'; msg.dataset.keep = '1';
  const r = await cloudSwitchWithKey(input.value);
  msg.textContent = r.message; msg.dataset.keep = '1';
  msg.style.color = r.ok ? '#2e7d32' : '#c62828';
  if (r.ok) { input.value = ''; renderAccountModal(); renderUpgradesShop(); }
}
async function accountUiReturn() {
  await cloudReturnToDevice('Cerraste la sesión temporal');
  const msg = document.getElementById('acc-msg'); msg.textContent = ''; msg.dataset.keep = '';
}
async function accountUiLink() {
  const r = await cloudLinkDevice();
  const msg = document.getElementById('acc-msg'); msg.textContent = r.message; msg.dataset.keep = '1';
  msg.style.color = r.ok ? '#2e7d32' : '#c62828';
  renderAccountModal();
}
function copyAccountKey() {
  const k = CloudAuth.pendingKey; if (!k) return;
  try { navigator.clipboard.writeText(k); showStationToast('📋 Clave copiada.'); } catch (e) { showStationToast('Selecciona y copia la clave manualmente.'); }
}
