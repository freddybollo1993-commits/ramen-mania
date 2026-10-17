/* Panel Shimaya: acceso con secreto de administrador, instalación como app propia, ajustes y modo demostración.
   Script clásico. Se carga después del script principal del panel (usa supabaseClient, initSupabase, fetchLiveMetrics…). */
(function () {
  'use strict';
  const PANEL_VERSION = 'p2';
  const SKEY = 'ramen_admin_secret', LKEY = 'shimaya_panel_secret', RKEY = 'shimaya_panel_refresh';
  window.PANEL_DEMO = false;
  window.allStats = [];
  const $ = id => document.getElementById(id);
  const sget = k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  const sset = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} };
  const lget = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lset = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };
  window.panelSecret = () => sget(SKEY);

  // ---------- acceso ----------
  function showGate(msg) {
    const g = $('pnl-gate'); if (!g) return;
    g.hidden = false; document.body.classList.add('pnl-locked');
    const m = $('pnl-gate-msg'); if (m) m.textContent = msg || '';
    const l = $('loading-overlay'); if (l) l.style.display = 'none';
    setTimeout(() => { const i = $('pnl-gate-secret'); if (i && !msg) i.focus(); }, 50);
  }
  function hideGate() { const g = $('pnl-gate'); if (g) g.hidden = true; document.body.classList.remove('pnl-locked'); }
  window.panelShowGate = showGate;
  async function verify(secret) {
    if (!supabaseClient) initSupabase();
    if (!supabaseClient) return { ok: false, offline: true };
    try {
      const { data, error } = await supabaseClient.rpc('admin_check', { p_secret: secret });
      if (error) return { ok: false, offline: true };
      return { ok: !!(data && data.ok) };
    } catch (e) { return { ok: false, offline: true }; }
  }
  async function enter(secret, remember) {
    const btn = $('pnl-gate-btn'); if (btn) btn.disabled = true;
    const r = await verify(secret);
    if (btn) btn.disabled = false;
    if (!r.ok) { showGate(r.offline ? 'Sin conexión con el servidor. Revisa internet e inténtalo de nuevo.' : 'Secreto incorrecto.'); return false; }
    sset(SKEY, secret);
    lset(LKEY, remember ? secret : null);
    hideGate(); startLoop();
    return true;
  }
  window.panelLogin = () => { const v = ($('pnl-gate-secret') || {}).value || ''; if (!v.trim()) { showGate('Escribe el secreto de administrador.'); return; } enter(v.trim(), !!($('pnl-gate-remember') || {}).checked); };
  window.panelLogout = () => {
    try { sessionStorage.removeItem(SKEY); } catch (e) {}
    lset(LKEY, null); window.PANEL_DEMO = false; stopLoop();
    allPlayers = []; allSessions = []; allLeaderboard = []; window.allStats = [];
    const b = $('pnl-demo-banner'); if (b) b.remove();
    const i = $('pnl-gate-secret'); if (i) i.value = '';
    showGate('Sesión cerrada.');
  };

  // ---------- actualización periódica ----------
  let timer = null;
  const every = () => { const v = lget(RKEY); return v == null ? 30 : +v; };
  function startLoop() { stopLoop(); fetchLiveMetrics(true); const s = every(); if (s > 0) timer = setInterval(() => { if (!document.hidden) fetchLiveMetrics(false); }, s * 1000); }
  function stopLoop() { if (timer) { clearInterval(timer); timer = null; } }
  window.panelSetRefresh = v => { lset(RKEY, String(v)); stopLoop(); const s = every(); if (s > 0 && panelSecret() || window.PANEL_DEMO) timer = s > 0 ? setInterval(() => { if (!document.hidden) fetchLiveMetrics(false); }, s * 1000) : null; };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && (panelSecret() || window.PANEL_DEMO) && every() > 0) fetchLiveMetrics(false); });

  // ---------- instalación ----------
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; const b = $('btn-install'); if (b) b.hidden = false; });
  window.addEventListener('appinstalled', () => { deferredInstall = null; const b = $('btn-install'); if (b) b.hidden = true; });
  window.panelInstall = async () => { if (!deferredInstall) { switchTab('tab-settings'); return; } deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) {} deferredInstall = null; const b = $('btn-install'); if (b) b.hidden = true; };
  const standalone = () => window.matchMedia && matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

  // ---------- ajustes ----------
  window.panelRenderSettings = function () {
    const el = $('settings-content'); if (!el) return;
    const sel = (v, t) => '<option value="' + v + '"' + (every() === v ? ' selected' : '') + '>' + t + '</option>';
    el.innerHTML =
      '<div class="pnl-grid">' +
        '<div class="pnl-card"><div class="pnl-card-t">🔌 Conexión</div><div class="pnl-card-s">Servidor y datos</div>' +
          '<div class="pnl-kv"><span>Servidor</span><b>' + (SUPABASE_CONFIG.url.replace('https://', '')) + '</b></div>' +
          '<div class="pnl-kv"><span>Estado</span><b>' + ((($('conn-status-text') || {}).textContent) || '—') + '</b></div>' +
          '<div class="pnl-kv"><span>Última actualización</span><b>' + (window.__panelStamp ? new Date(window.__panelStamp).toLocaleTimeString('es-PE') : '—') + '</b></div>' +
          '<div class="pnl-kv"><span>Cuentas · partidas · estadísticas</span><b>' + allPlayers.length + ' · ' + allSessions.length + ' · ' + (window.allStats || []).length + '</b></div>' +
          '<label class="pnl-row">Actualizar cada <select class="search-input" onchange="panelSetRefresh(this.value)">' + sel(15, '15 s') + sel(30, '30 s') + sel(60, '1 min') + sel(300, '5 min') + sel(0, 'solo manual') + '</select></label>' +
          '<button class="btn-action" onclick="fetchLiveMetrics(true)">🔄 Actualizar ahora</button></div>' +
        '<div class="pnl-card"><div class="pnl-card-t">🔐 Acceso</div><div class="pnl-card-s">El panel pide el secreto de administrador al abrir</div>' +
          '<div class="pnl-kv"><span>Recordado en este aparato</span><b>' + (lget(LKEY) ? 'Sí' : 'No') + '</b></div>' +
          '<div class="pnl-dim" style="font-size:12px;margin:6px 0;">Si lo recuerdas, queda guardado en este aparato; no lo actives en un aparato compartido. El secreto se cambia en Supabase (ver supabase/SEGURIDAD.md).</div>' +
          '<button class="btn-action" onclick="panelLogout()">🔒 Cerrar sesión y olvidar el secreto</button></div>' +
        '<div class="pnl-card"><div class="pnl-card-t">📲 Instalar como app</div><div class="pnl-card-s">Es independiente del juego: tiene su propio icono</div>' +
          (standalone() ? '<div class="pnl-pill green">✓ Ya está instalada</div>' : (deferredInstall ? '<button class="btn-action btn-primary" onclick="panelInstall()">📲 Instalar ahora</button>' : '<div class="pnl-dim" style="font-size:12px;">En Chrome (Android): menú ⋮ → «Instalar aplicación» o «Añadir a la pantalla de inicio». En iPhone (Safari): compartir → «Añadir a pantalla de inicio».</div>')) +
          '<div class="pnl-dim" style="font-size:12px;margin-top:8px;">Dirección: <b>' + location.origin + '/panel/</b></div></div>' +
        '<div class="pnl-card"><div class="pnl-card-t">📥 Exportar</div><div class="pnl-card-s">Para Excel o Google Sheets</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn-action btn-primary" onclick="panelProgressCSV()">📈 Progreso por jugador</button><button class="btn-action" onclick="exportPlayersCSV()">👥 Jugadores</button><button class="btn-action" onclick="exportDataToCSV()">🏆 Ranking</button></div></div>' +
        '<div class="pnl-card"><div class="pnl-card-t">ℹ️ Acerca del panel</div><div class="pnl-card-s">Qué mide y de dónde sale</div>' +
          '<div class="pnl-kv"><span>Versión del panel</span><b>' + PANEL_VERSION + '</b></div>' +
          '<div class="pnl-dim" style="font-size:12px;line-height:1.5;">Las partidas son las 2000 más recientes registradas por el servidor. Las estadísticas por plato, el historial diario y los retos son acumulados que el juego sincroniza desde cada cuenta. Los platos y niveles salen de <b>datos-juego.js</b>, que se regenera con <code>tools/exportar-datos-panel.js</code> cuando cambian las recetas.</div></div>' +
      '</div>';
  };

  // ---------- modo demostración (datos inventados, solo para ver el panel) ----------
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  window.panelStartDemo = function () {
    window.PANEL_DEMO = true; hideGate(); stopLoop();
    if (!$('pnl-demo-banner')) { const b = document.createElement('div'); b.id = 'pnl-demo-banner'; b.innerHTML = '🧪 <b>MODO DEMOSTRACIÓN</b>: todos los datos son inventados. <button class="btn-action" onclick="panelLogout()">Salir</button>'; document.body.insertBefore(b, document.body.firstChild); }
    fetchLiveMetrics(true);
  };
  function demoData() {
    const R = rng(20261016), now = Date.now(), day = 86400000;
    const names = [['Aoi', '🌸', .82, 1.0, 26], ['Kenji', '🥋', .7, .9, 22], ['Sakura', '🍙', .6, .8, 18], ['Hiroshi', '🍜', .55, .7, 14], ['Takeshi', '🔥', .8, .5, 9], ['Yuki', '❄️', .5, .9, 12], ['Ren', '🌊', .45, .5, 6], ['Akemi', '🌅', .65, .6, 8], ['Daichi', '⛰️', .4, .4, 5], ['Mika', '🎏', .72, .85, 20], ['Sora', '☁️', .5, .3, 3], ['Haru', '🌱', .35, .5, 4]];
    const platos = (window.PANEL_PLATOS || []).filter(p => !p.hervido && p.nivel);
    const chIds = (typeof LEARN_CHALLENGES !== 'undefined' ? LEARN_CHALLENGES : []).map(c => c[0]);
    const players = [], sessions = [], stats = [], lb = [];
    names.forEach(([alias, av, skill, learn, span], pi) => {
      const created = now - span * day - R() * day * 0.5;
      players.push({ id: 'demo-' + pi, player_name: alias, avatar: av, contact: '+51 9' + String(10000000 + Math.floor(R() * 8e7)), created_at: new Date(created).toISOString(), last_login: new Date(now - (pi % 5 === 0 ? 6 : R() * 2) * day).toISOString(), mmr: 1000 + Math.round(R() * 300) });
      let level = 1, xp = 0; const h = {}, d = {}, t = { normal: 0, training: 0, free: 0, rash: 0 }, sMine = [];
      for (let k = 0; k < span; k++) {
        if (R() > 0.25 + 0.55 * learn) continue;                                    // no jugó ese día
        const dayStart = created + k * day, n = 1 + Math.floor(R() * 3);
        const hk = (() => { const x = new Date(dayStart); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); })();
        const hd = h[hk] = { t: 0, n: 0, s: 0, s3: 0, er: 0, bu: 0, cr: 0, rj: 0, lc: 0, g: 0 };
        for (let j = 0; j < n; j++) {
          const r = R(), mode = r < .72 ? 'NORMAL' : r < .84 ? 'TRAINING' : r < .92 ? 'FREE' : 'RASH';
          const ability = Math.min(1, skill * 0.75 + xp * 0.012 * learn), lvl = mode === 'NORMAL' ? level : (mode === 'RASH' ? 1 + Math.floor(R() * 12 * ability) : 1);
          const difficulty = mode === 'NORMAL' ? 0.25 + level * 0.032 : 0.4;
          const win = R() < Math.max(0.05, Math.min(0.97, 0.5 + (ability - difficulty) * 1.7));
          const dur = Math.round(120 + R() * 200 * (win ? 1.4 : 0.9)), served = Math.round(4 + level * 1.1 + ability * 8 + R() * 3), lost = win ? Math.floor(R() * 2) : 2 + Math.floor(R() * 5);
          const outcome = mode === 'NORMAL' ? (win ? 'WON' : (R() < 0.12 ? 'ABANDONED' : 'LOST')) : 'COMPLETED';
          const when = dayStart + (9 + R() * 12) * 3600000 + j * 1500000;
          sessions.push({ id: 'ds' + sessions.length, player_name: alias, game_mode: mode, level_number: lvl, duration_seconds: dur, customers_served: served, customers_lost: lost, failed_recipes: [], outcome, created_at: new Date(when).toISOString() });
          if (mode === 'NORMAL' && win && level < 20) level++;
          xp += win ? 1.5 : 0.6;
          const key = mode === 'NORMAL' ? 'normal' : mode.toLowerCase(); t[key] = (t[key] || 0) + dur; hd.t += dur; hd.g++;
          for (let c = 0; c < served; c++) {
            const pool = platos.filter(p => mode === 'NORMAL' ? p.nivel <= lvl : p.nivel <= 8); if (!pool.length) break;
            const p = pool[Math.floor(R() * pool.length)], dd = d[p.slug] || (d[p.slug] = { n: 0, s: 0, s1: 0, s2: 0, s3: 0, b: 0, f: 0, e: 0, ne: 0 });
            const q = Math.max(15, Math.min(100, Math.round(42 + ability * 38 + Math.min(dd.n, 30) * 0.9 * learn - p.ingredientes * 1.1 + (R() - 0.5) * 22)));
            dd.n++; dd.s += q; dd['s' + (q >= 85 ? 3 : q >= 60 ? 2 : 1)]++; dd.b = Math.max(dd.b, q); if (dd.ne < 5) { dd.e += q; dd.ne++; } if (mode === 'FREE') dd.f++;
            hd.n++; hd.s += q; if (q >= 85) hd.s3++;
            if (q < 45) { const e = R(); if (e < 0.5) hd.er++; else if (e < 0.8) hd.bu++; else hd.cr++; }
          }
          hd.lc += lost; if (R() < 0.1) hd.rj++;
        }
      }
      const tr = {}; chIds.slice(0, Math.min(chIds.length, Math.round(chIds.length * skill * learn * 0.9))).forEach((id, i) => { const f = 80 + R() * 140, bt = f * (0.55 + R() * 0.3); tr[id] = { t: Math.round(bt), f: Math.round(f), l: Math.round(bt * 1.1), m: 1 + Math.floor(R() * 3), n: 1 + Math.floor(R() * 4), paid: 1 }; });
      stats.push({ alias, avatar: av, created_at: new Date(created).toISOString(), last_login: players[pi].last_login, tips_earned: Math.round(R() * 400), stats: { d, t, h }, training: tr, training_done: Object.keys(tr).length });
      const best = Math.round(120 + level * 30 + R() * 90);
      lb.push({ id: 'dl' + pi, player_name: alias, score_money: best * 4, customers_served: best, level_reached: level, game_mode: 'NORMAL', created_at: new Date(now - R() * span * day).toISOString() });
    });
    sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { players, sessions: sessions.slice(0, 2000), stats, lb };
  }
  window.panelLoadDemo = function () {
    const D = demoData();
    allPlayers = D.players; allSessions = D.sessions; allLeaderboard = D.lb; window.allStats = D.stats; window.__panelStamp = Date.now();
    const t = $('conn-status-text'), dot = document.querySelector('.status-dot'); if (t) t.textContent = 'Demostración'; if (dot) dot.style.background = '#ab47bc';
    computeAndRenderKPIs(); renderPlayersTable(allPlayers); renderLeaderboardTable(allLeaderboard); renderSessionsTable(allSessions); renderCharts();
    if (typeof panelAfterLoad === 'function') panelAfterLoad();
    const l = $('loading-overlay'); if (l) l.style.display = 'none';
  };

  // ---------- arranque ----------
  window.addEventListener('DOMContentLoaded', async () => {
    initSupabase();
    if (location.hash === '#demo') { panelStartDemo(); return; }
    const saved = sget(SKEY) || lget(LKEY);
    if (saved) {
      const r = await verify(saved);
      if (r.ok) { sset(SKEY, saved); hideGate(); startLoop(); return; }
      if (!r.offline) lset(LKEY, null);
      showGate(r.offline ? 'Sin conexión con el servidor. Inténtalo de nuevo cuando haya internet.' : 'El secreto guardado ya no es válido.');
      return;
    }
    showGate('');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'pnl-gate-secret') panelLogin(); });
})();
