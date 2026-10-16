/* Panel Shimaya: seguimiento del progreso y de la curva de aprendizaje de los jugadores.
   Script clásico: usa los datos globales del panel (allPlayers, allSessions, allStats) y los ayudantes del script principal
   (escapeHtml, learnPlayer, LEARN_CHALLENGES, STATS_DISHES…). Los datos del juego salen de datos-juego.js (PANEL_PLATOS, PANEL_NIVELES).
   Fuentes: admin_players (cuentas), admin_sessions (partidas, hasta 2000 recientes) y admin_stats (estadísticas, historial diario y retos de cada cuenta). */
(function () {
  'use strict';
  const DAY = 86400000;
  const esc = s => escapeHtml(s == null ? '' : s);
  const lc = s => String(s || '').trim().toLowerCase();
  const pct = (a, b) => b ? Math.round(100 * a / b) : null;
  const P = v => v == null ? '—' : v + '%';
  const N = (v, d = 0) => v == null || isNaN(v) ? '—' : Number(v).toFixed(d);
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const dkey = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dnum = t => { const d = new Date(t); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / DAY + 0.5); };   // día local como número entero
  const fdate = t => { const d = new Date(t); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
  const mins = s => s == null ? '—' : (s >= 3600 ? Math.floor(s / 3600) + ' h ' + Math.round((s % 3600) / 60) + ' min' : Math.round(s / 60) + ' min');
  const AREA_ICON = { ramen: '🍜', salteados: '🍳', makis: '🍣', frituras: '🍤' };
  const ARCOS = { ramen: ['🍜', 'Ramen', 1, 4], salteado: ['🍳', 'Salteado', 5, 8], makis: ['🍣', 'Makis', 9, 12], frituras: ['🍤', 'Frituras', 13, 16], maestria: ['🏯', 'Maestría', 17, 20] };
  const COL = { gold: '#ffb300', green: '#66bb6a', red: '#ef5350', blue: '#42a5f5', purple: '#ab47bc', orange: '#ff9800', teal: '#26a69a', grid: 'rgba(255,255,255,0.06)', tx: '#bcaaa4' };
  const charts = {};
  const tick = { ticks: { color: COL.tx }, grid: { color: COL.grid } };
  const legend = { labels: { color: '#d7ccc8', boxWidth: 12 } };
  function chart(key, id, cfg) {
    if (charts[key]) { charts[key].destroy(); delete charts[key]; }
    const el = document.getElementById(id);
    if (el && window.Chart) charts[key] = new Chart(el, cfg);
  }
  const kpi = (icon, label, value, sub) => '<div class="kpi-card"><div class="kpi-icon">' + icon + '</div><div class="kpi-content"><span class="kpi-label">' + label + '</span><span class="kpi-value">' + value + '</span><span class="kpi-sub">' + sub + '</span></div></div>';
  const card = (title, sub, inner) => '<div class="pnl-card"><div class="pnl-card-t">' + title + '</div><div class="pnl-card-s">' + sub + '</div>' + inner + '</div>';
  const box = id => '<div style="height:230px;"><canvas id="' + id + '"></canvas></div>';
  const empty = msg => '<div class="pnl-empty">' + msg + '</div>';
  const nivelData = L => (window.PANEL_NIVELES || []).find(n => n.nivel === L) || null;
  const arcoDe = L => { const n = nivelData(L); return n ? n.arco : (L <= 4 ? 'ramen' : L <= 8 ? 'salteado' : L <= 12 ? 'makis' : L <= 16 ? 'frituras' : 'maestria'); };

  // ---------- modelo: une cuentas, estadísticas y partidas por jugador ----------
  let cache = null, cacheKey = '';
  function model() {
    const key = [allPlayers.length, allSessions.length, (window.allStats || []).length, allSessions[0] && allSessions[0].created_at, window.__panelStamp].join('|');
    if (cache && key === cacheKey) return cache;
    const map = new Map();
    const get = (name, extra) => {
      const k = lc(name); if (!k) return null;
      let o = map.get(k);
      if (!o) { o = { key: k, alias: name, avatar: '', created: 0, lastLogin: 0, p: null, row: null, sessions: [] }; map.set(k, o); }
      return Object.assign(o, extra || {}), o;
    };
    allPlayers.forEach(p => { const o = get(p.player_name); if (o) { o.p = p; o.avatar = p.avatar || o.avatar; o.created = +new Date(p.created_at) || 0; o.lastLogin = +new Date(p.last_login) || 0; } });
    (window.allStats || []).forEach(r => { const o = get(r.alias); if (o) { o.row = r; o.avatar = o.avatar || r.avatar || ''; if (!o.created) o.created = +new Date(r.created_at) || 0; if (!o.lastLogin) o.lastLogin = +new Date(r.last_login) || 0; } });
    allSessions.forEach(s => { const o = get(s.player_name); if (o) o.sessions.push(Object.assign({}, s, { t: +new Date(s.created_at) })); });
    const arr = [...map.values()];
    arr.forEach(o => {
      o.sessions.sort((a, b) => a.t - b.t);
      o.days = [...new Set(o.sessions.map(s => dnum(s.t)))].sort((a, b) => a - b);
      o.firstT = o.sessions.length ? o.sessions[0].t : 0;
      o.lastT = o.sessions.length ? o.sessions[o.sessions.length - 1].t : 0;
      o.cohort = o.created || o.firstT;
      o.camp = o.sessions.filter(s => s.game_mode === 'NORMAL');
      o.maxLevel = o.camp.reduce((m, s) => Math.max(m, s.level_number || 0), 0);
      o.wonLevel = o.camp.filter(s => s.outcome === 'WON').reduce((m, s) => Math.max(m, s.level_number || 0), 0);
      o.playSec = o.sessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);
    });
    cache = { now: Date.now(), players: arr };
    cacheKey = key;
    return cache;
  }
  const hasData = () => allPlayers.length || allSessions.length || (window.allStats || []).length;

  // ================= SEGUIMIENTO =================
  function renderFollow() {
    const el = document.getElementById('follow-content'); if (!el) return;
    if (!hasData()) { el.innerHTML = empty('Aún no hay datos. Cuando los jugadores abran el juego con su cuenta aparecerán aquí.'); return; }
    const M = model(), now = M.now, pl = M.players, today = dnum(now);
    const activeIn = d => pl.filter(o => o.lastT >= now - d * DAY);
    const act7 = activeIn(7), act30 = activeIn(30);
    const new7 = pl.filter(o => o.cohort >= now - 7 * DAY);
    // retención: cuántos vuelven después del día en que se registraron
    const ret = n => {
      const el2 = pl.filter(o => o.cohort && today - dnum(o.cohort) >= n), c0 = el2.map(o => dnum(o.cohort));
      const ok = el2.filter((o, i) => o.days.some(d => d - c0[i] >= 1 && d - c0[i] <= n));
      return { n: el2.length, ok: ok.length, p: pct(ok.length, el2.length) };
    };
    const r1 = ret(1), r7 = ret(7);
    const sess30 = allSessions.filter(s => +new Date(s.created_at) >= now - 30 * DAY);
    const durs = allSessions.filter(s => s.duration_seconds > 20).map(s => s.duration_seconds);
    const camp = allSessions.filter(s => s.game_mode === 'NORMAL'), won = camp.filter(s => s.outcome === 'WON').length;
    const perPlayer30 = act30.length ? sess30.length / act30.length : null;
    const totalSec = allSessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);

    // actividad por día (30 días)
    const days = Array.from({ length: 30 }, (_, i) => today - 29 + i), idx = new Map(days.map((d, i) => [d, i]));
    const nS = days.map(() => 0), who = days.map(() => new Set());
    allSessions.forEach(s => { const i = idx.get(dnum(+new Date(s.created_at))); if (i != null) { nS[i]++; who[i].add(lc(s.player_name)); } });
    const hours = Array(24).fill(0); allSessions.forEach(s => hours[new Date(s.created_at).getHours()]++);

    // cohortes semanales
    const cohorts = new Map();
    pl.filter(o => o.cohort).forEach(o => {
      const d = new Date(o.cohort), mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)), k = mon.getTime();
      (cohorts.get(k) || cohorts.set(k, []).get(k)).push(o);
    });
    const cohRows = [...cohorts.entries()].sort((a, b) => b[0] - a[0]).slice(0, 8).map(([k, list]) => {
      const cell = n => { const e = list.filter(o => today - dnum(o.cohort) >= n); if (!e.length) return '<td class="pnl-dim">—</td>'; const ok = e.filter(o => o.days.some(d => d - dnum(o.cohort) >= 1 && d - dnum(o.cohort) <= n)).length, p = pct(ok, e.length); return '<td><span class="pnl-heat" style="--p:' + p + '">' + p + '%</span> <small>' + ok + '/' + e.length + '</small></td>'; };
      return '<tr><td>Semana del ' + fdate(k) + '</td><td>' + list.length + '</td>' + cell(1) + cell(3) + cell(7) + cell(14) + '</tr>';
    }).join('');

    // jugadores que piden atención
    const nuncaVuelven = pl.filter(o => o.cohort && today - dnum(o.cohort) >= 2 && o.days.length <= 1).sort((a, b) => b.cohort - a.cohort);
    const inactivos = pl.filter(o => o.days.length >= 3 && o.lastT && now - o.lastT >= 4 * DAY).sort((a, b) => a.lastT - b.lastT);
    const atascados = [];
    pl.forEach(o => { const by = {}; o.camp.forEach(s => { const b = by[s.level_number] || (by[s.level_number] = { n: 0, w: 0 }); b.n++; if (s.outcome === 'WON') b.w++; });
      Object.entries(by).forEach(([L, b]) => { if (b.n >= 3 && !b.w) atascados.push({ o, L: +L, n: b.n }); }); });
    atascados.sort((a, b) => b.n - a.n);
    const avance = pl.map(o => ({ o, L: o.camp.filter(s => s.t >= now - 7 * DAY && s.outcome === 'WON').reduce((m, s) => Math.max(m, s.level_number), 0) })).filter(x => x.L).sort((a, b) => b.L - a.L).slice(0, 5);
    const li = (o, txt) => '<li><b>' + esc((o.avatar || '') + ' ' + o.alias) + '</b> <span class="pnl-dim">' + txt + '</span> <a href="#" onclick="panelOpenPlayer(\'' + esc(o.key).replace(/'/g, '') + '\');return false;">ver</a></li>';
    const list = (arr, fn, vacio) => arr.length ? '<ul class="pnl-list">' + arr.slice(0, 8).map(fn).join('') + (arr.length > 8 ? '<li class="pnl-dim">…y ' + (arr.length - 8) + ' más</li>' : '') + '</ul>' : '<div class="pnl-empty small">' + vacio + '</div>';

    el.innerHTML =
      '<div class="kpi-grid">' +
        kpi('🟢', 'Activos 7 días', act7.length, 'de ' + pl.length + ' cuentas · ' + act30.length + ' en 30 días') +
        kpi('🌱', 'Nuevos 7 días', new7.length, 'cuentas creadas esta semana') +
        kpi('↩️', 'Vuelven al día siguiente', P(r1.p), r1.n ? r1.ok + ' de ' + r1.n + ' con más de 1 día' : 'aún sin datos') +
        kpi('📆', 'Vuelven en la 1.ª semana', P(r7.p), r7.n ? r7.ok + ' de ' + r7.n + ' con más de 7 días' : 'aún sin datos') +
        kpi('🎮', 'Partidas por jugador (30 d)', N(perPlayer30, 1), sess30.length + ' partidas en 30 días') +
        kpi('⏱️', 'Duración típica', durs.length ? mins(med(durs)) : '—', 'mediana por partida · ' + mins(totalSec) + ' en total') +
        kpi('🏮', 'Victorias en Campaña', camp.length ? P(pct(won, camp.length)) : '—', won + ' de ' + camp.length + ' partidas') +
      '</div>' +
      '<div class="pnl-grid">' +
        card('Actividad de los últimos 30 días', 'Partidas por día (barras) y jugadores distintos (línea)', box('ch-follow-days')) +
        card('¿A qué hora juegan?', 'Partidas según la hora del día (hora de este aparato)', box('ch-follow-hours')) +
      '</div>' +
      '<div class="pnl-grid">' +
        card('🔔 Nunca volvieron', 'Se registraron hace 2+ días y solo jugaron un día', list(nuncaVuelven, o => li(o, 'registro ' + fdate(o.cohort) + ' · ' + o.sessions.length + ' partida(s)'), 'Todos volvieron al menos una vez.')) +
        card('😴 Se están alejando', 'Jugaron 3+ días y llevan 4+ días sin entrar', list(inactivos, o => li(o, 'última vez ' + fdate(o.lastT) + ' · ' + o.days.length + ' días jugados'), 'Nadie se ha alejado.')) +
        card('🚧 Atascados en un nivel', '3+ intentos en el mismo nivel de Campaña sin ganarlo', list(atascados, x => li(x.o, 'nivel ' + x.L + ' · ' + x.n + ' intentos'), 'Nadie atascado por ahora.')) +
        card('🚀 Mayor avance esta semana', 'Nivel más alto ganado en los últimos 7 días', list(avance, x => li(x.o, 'ganó el nivel ' + x.L), 'Nadie ha ganado niveles esta semana.')) +
      '</div>' +
      '<div class="table-title" style="margin:14px 0 6px;"><span>👥 Retención por semana de registro</span></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Cohorte</th><th>Cuentas</th><th>Vuelven en 1 día</th><th>en 3 días</th><th>en 7 días</th><th>en 14 días</th></tr></thead><tbody>' + (cohRows || '<tr><td colspan="6" class="pnl-dim">Aún no hay cuentas.</td></tr>') + '</tbody></table></div>' +
      '<div class="pnl-foot"><b>Cómo leerlo.</b> «Vuelven en N días» cuenta a quien volvió a jugar un día distinto, hasta N días después de registrarse (solo cuentas con más de N días de antigüedad). Las partidas vienen del registro del servidor (las 2000 más recientes); una cuenta sin partidas registradas aparece sin actividad aunque haya jugado sin conexión.</div>';

    chart('fdays', 'ch-follow-days', { type: 'bar', data: { labels: days.map(d => fdate(d * DAY + DAY / 2)), datasets: [
      { type: 'bar', label: 'Partidas', data: nS, backgroundColor: 'rgba(255,179,0,0.75)', yAxisID: 'y' },
      { type: 'line', label: 'Jugadores', data: who.map(s => s.size), borderColor: COL.green, backgroundColor: COL.green, tension: 0.3, yAxisID: 'y' }] },
      options: { maintainAspectRatio: false, plugins: { legend }, scales: { x: { ...tick, ticks: { color: COL.tx, maxTicksLimit: 8 } }, y: { ...tick, beginAtZero: true, ticks: { color: COL.tx, precision: 0 } } } } });
    chart('fhours', 'ch-follow-hours', { type: 'bar', data: { labels: hours.map((_, h) => h + ' h'), datasets: [{ label: 'Partidas', data: hours, backgroundColor: 'rgba(66,165,245,0.75)' }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ...tick, ticks: { color: COL.tx, maxTicksLimit: 12 } }, y: { ...tick, beginAtZero: true, ticks: { color: COL.tx, precision: 0 } } } } });
  }

  // ================= CAMPAÑA =================
  function renderCampaign() {
    const el = document.getElementById('campaign-content'); if (!el) return;
    const camp = allSessions.filter(s => s.game_mode === 'NORMAL');
    if (!camp.length) { el.innerHTML = empty('Aún no hay partidas de Campaña registradas.'); return; }
    const M = model(), pl = M.players, niveles = window.PANEL_NIVELES || [], maxL = Math.max(20, ...camp.map(s => s.level_number || 0));
    const rows = [];
    for (let L = 1; L <= maxL; L++) {
      const ss = camp.filter(s => s.level_number === L);
      const players = new Set(ss.map(s => lc(s.player_name)));
      const reached = pl.filter(o => o.maxLevel >= L).length;
      const won = ss.filter(s => s.outcome === 'WON'), lost = ss.filter(s => s.outcome === 'LOST'), ab = ss.filter(s => s.outcome === 'ABANDONED');
      // intentos hasta ganar: por jugador, cuántas partidas hizo hasta su primera victoria en ese nivel
      const toWin = [], stuck = [];
      pl.forEach(o => { const mine = o.camp.filter(s => s.level_number === L); if (!mine.length) return; const i = mine.findIndex(s => s.outcome === 'WON'); if (i >= 0) toWin.push(i + 1); else if (mine.length >= 3) stuck.push(o.alias); });
      const dur = ss.filter(s => s.duration_seconds > 0).map(s => s.duration_seconds);
      rows.push({ L, n: ss.length, players: players.size, reached, won: won.length, lost: lost.length, ab: ab.length, winRate: pct(won.length, ss.length), toWin: avg(toWin), nWin: toWin.length, stuck,
        dur: avg(dur), served: avg(ss.map(s => s.customers_served || 0)), lostC: avg(ss.map(s => s.customers_lost || 0)), meta: nivelData(L) });
    }
    const used = rows.filter(r => r.n > 0);
    const flag = r => {
      if (r.n < 5) return '<span class="pnl-pill dim">pocos datos</span>';
      const f = [];
      if (r.winRate < 40) f.push('<span class="pnl-pill red">🚧 bloquea</span>');
      else if (r.toWin != null && r.toWin >= 2.5) f.push('<span class="pnl-pill orange">⚠ difícil</span>');
      if (r.ab / r.n > 0.25) f.push('<span class="pnl-pill purple">🚪 abandonan</span>');
      return f.join(' ') || '<span class="pnl-pill green">✓ fluye</span>';
    };
    const hard = used.filter(r => r.n >= 5).sort((a, b) => a.winRate - b.winRate).slice(0, 3);
    let drop = null; for (let i = 0; i < used.length - 1; i++) { const a = used[i], b = rows.find(r => r.L === a.L + 1); if (b && a.reached >= 3) { const d = (a.reached - b.reached) / a.reached; if (!drop || d > drop.d) drop = { d, a, b }; } }
    const ins = [];
    if (hard.length) ins.push('🚧 Niveles con menor tasa de victoria: ' + hard.map(r => '<b>nivel ' + r.L + '</b> (' + r.winRate + '%)').join(', ') + '.');
    if (drop && drop.d > 0) ins.push('📉 Mayor caída entre niveles: de <b>' + drop.a.L + '</b> a <b>' + drop.b.L + '</b> (' + Math.round(drop.d * 100) + '% de quienes llegaron al ' + drop.a.L + ' no llegan al siguiente).');
    const slow = used.filter(r => r.toWin != null && r.toWin >= 2.5 && r.nWin >= 2);
    if (slow.length) ins.push('🔁 Se necesitan 2,5+ intentos para ganar en: ' + slow.map(r => '<b>nivel ' + r.L + '</b> (' + N(r.toWin, 1) + ')').join(', ') + '.');
    const quick = used.filter(r => r.n >= 5 && r.winRate >= 95);
    if (quick.length) ins.push('🪶 Casi todos ganan al instante en: ' + quick.map(r => '<b>' + r.L + '</b>').join(', ') + ' (posible exceso de facilidad).');
    if (!ins.length) ins.push('📊 Con pocos intentos todavía no se pueden señalar niveles problemáticos; hacen falta 5+ partidas por nivel.');

    const body = rows.filter(r => r.n > 0 || r.L <= 20).map(r => {
      const m = r.meta, a = ARCOS[arcoDe(r.L)] || ['', ''];
      return '<tr' + (r.n ? '' : ' class="pnl-dimrow"') + '><td><b>' + r.L + '</b> ' + (r.L % 4 === 0 ? '🎓' : '') + '</td><td>' + (m ? esc(m.nombre) : '—') + '<br><small class="pnl-dim">' + a[0] + ' ' + a[1] + (m ? ' · meta ' + m.meta + ' · ' + m.tiempo + ' s' : '') + '</small></td><td>' + r.reached + '</td><td>' + r.n + '</td>' +
        '<td>' + (r.n ? '<span class="pnl-bar" style="--p:' + r.winRate + '"></span> ' + r.winRate + '%' : '—') + '</td><td>' + (r.toWin != null ? N(r.toWin, 1) : '—') + '</td><td>' + (r.dur != null ? mins(r.dur) : '—') + '</td><td>' + (r.n ? N(r.served, 1) + ' / ' + N(r.lostC, 1) : '—') + '</td><td>' + (r.n ? flag(r) : '') + (r.stuck.length ? '<br><small class="pnl-dim">atascados: ' + esc(r.stuck.slice(0, 3).join(', ')) + '</small>' : '') + '</td></tr>';
    }).join('');
    // arcos
    const arcRows = Object.entries(ARCOS).map(([k, [ic, nm, a, b]]) => {
      const ss = camp.filter(s => s.level_number >= a && s.level_number <= b);
      if (!ss.length) return '<tr class="pnl-dimrow"><td>' + ic + ' ' + nm + ' <small>(niv. ' + a + '–' + b + ')</small></td><td>0</td><td>0</td><td>—</td><td>—</td></tr>';
      const w = ss.filter(s => s.outcome === 'WON').length, reached = pl.filter(o => o.maxLevel >= a).length, done = pl.filter(o => o.wonLevel >= b).length;
      return '<tr><td>' + ic + ' ' + nm + ' <small>(niv. ' + a + '–' + b + ')</small></td><td>' + reached + '</td><td>' + done + '</td><td>' + ss.length + '</td><td>' + pct(w, ss.length) + '%</td></tr>';
    }).join('');
    // Rash
    const rash = pl.map(o => { const rs = o.sessions.filter(s => s.game_mode === 'RASH'); return { o, n: rs.length, best: rs.reduce((m, s) => Math.max(m, s.level_number || 0), 0) }; }).filter(x => x.n);
    rash.sort((a, b) => b.best - a.best);

    el.innerHTML =
      '<div class="kpi-grid">' +
        kpi('🏮', 'Jugadores en Campaña', pl.filter(o => o.camp.length).length, 'con al menos una partida') +
        kpi('🎯', 'Nivel más alto ganado', Math.max(0, ...pl.map(o => o.wonLevel)) || '—', 'de ' + niveles.length + ' niveles') +
        kpi('🏆', 'Terminaron la Campaña', pl.filter(o => o.wonLevel >= 20).length, 'ganaron el nivel 20') +
        kpi('🔁', 'Intentos por victoria', camp.filter(s => s.outcome === 'WON').length ? N(camp.length / camp.filter(s => s.outcome === 'WON').length, 1) : '—', 'partidas jugadas por cada victoria') +
      '</div>' +
      '<div style="background:rgba(255,179,0,0.08); border:1px solid rgba(255,179,0,0.3); border-radius:10px; padding:10px 12px; margin-bottom:14px;"><div style="font-size:12px; font-weight:800; margin-bottom:4px;">💡 Lectura rápida</div><ul style="margin:0; padding-left:18px; font-size:12.5px; line-height:1.6;">' + ins.map(x => '<li>' + x + '</li>').join('') + '</ul></div>' +
      '<div class="pnl-grid">' +
        card('Embudo de la Campaña', 'Jugadores que llegaron a cada nivel (barras) y % de partidas ganadas (línea)', box('ch-camp-funnel')) +
        card('Intentos hasta ganar', 'Media de partidas que necesita un jugador para ganar el nivel por primera vez (línea roja = 2,5)', box('ch-camp-attempts')) +
      '</div>' +
      '<div class="table-title" style="margin:14px 0 6px;"><span>🪜 Nivel por nivel</span></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Nivel</th><th>Nombre</th><th>Llegaron</th><th>Partidas</th><th>Victorias</th><th>Intentos p/ ganar</th><th>Duración media</th><th>Atendidos / perdidos</th><th>Estado</th></tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="table-title" style="margin:14px 0 6px;"><span>🏯 Por arco</span></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Arco</th><th>Llegaron</th><th>Lo terminaron</th><th>Partidas</th><th>% victoria</th></tr></thead><tbody>' + arcRows + '</tbody></table></div>' +
      '<div class="table-title" style="margin:14px 0 6px;"><span>⚡ Rash (supervivencia)</span></div>' +
      (rash.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Jugador</th><th>Partidas</th><th>Mejor ronda</th></tr></thead><tbody>' + rash.slice(0, 10).map(x => '<tr><td>' + esc((x.o.avatar || '') + ' ' + x.o.alias) + '</td><td>' + x.n + '</td><td>' + x.best + '</td></tr>').join('') + '</tbody></table></div>' : empty('Nadie ha jugado Rash todavía.')) +
      '<div class="pnl-foot"><b>Cómo leerlo.</b> «Llegaron» = jugadores que han jugado ese nivel o uno posterior. «Intentos p/ ganar» solo cuenta a quienes ya ganaron. 🚧 bloquea: menos de 40 % de victorias (con 5+ partidas). ⚠ difícil: se necesitan 2,5+ intentos. 🚪 abandonan: más de 25 % de partidas abandonadas. 🎓 = nivel de examen. Las estrellas por nivel aún no se registran en el servidor.</div>';

    const labels = rows.map(r => r.L);
    chart('cfunnel', 'ch-camp-funnel', { type: 'bar', data: { labels, datasets: [
      { type: 'bar', label: 'Llegaron', data: rows.map(r => r.reached), backgroundColor: rows.map(r => ({ ramen: '#ff9800', salteado: '#ef5350', makis: '#26a69a', frituras: '#ffb300', maestria: '#66bb6a' }[arcoDe(r.L)])), yAxisID: 'y' },
      { type: 'line', label: '% victoria', data: rows.map(r => r.n ? r.winRate : null), borderColor: '#fff3d0', backgroundColor: '#fff3d0', tension: 0.25, spanGaps: true, yAxisID: 'y1' }] },
      options: { maintainAspectRatio: false, plugins: { legend }, scales: { x: tick, y: { ...tick, beginAtZero: true, ticks: { color: COL.tx, precision: 0 } }, y1: { ...tick, position: 'right', min: 0, max: 100, grid: { display: false } } } } });
    chart('cattempts', 'ch-camp-attempts', { type: 'bar', data: { labels, datasets: [
      { label: 'Intentos hasta ganar', data: rows.map(r => r.toWin != null ? +r.toWin.toFixed(2) : null), backgroundColor: 'rgba(171,71,188,0.8)' },
      { type: 'line', label: '2,5', data: rows.map(() => 2.5), borderColor: COL.red, borderDash: [6, 4], pointRadius: 0 }] },
      options: { maintainAspectRatio: false, plugins: { legend }, scales: { x: tick, y: { ...tick, beginAtZero: true } } } });
  }

  // ================= JUGADOR =================
  let selKey = '';
  window.panelOpenPlayer = key => { selKey = key; try { switchTab('tab-profile'); } catch (e) {} };
  function playerList() { return model().players.filter(o => o.sessions.length || o.row || o.p).sort((a, b) => (b.lastT || b.lastLogin) - (a.lastT || a.lastLogin)); }
  function renderPlayer() {
    const host = document.getElementById('player-content'), sel = document.getElementById('pl-select'); if (!host || !sel) return;
    const list = playerList();
    if (!list.length) { sel.innerHTML = ''; host.innerHTML = empty('Aún no hay jugadores.'); return; }
    const q = lc((document.getElementById('pl-search') || {}).value);
    const shown = list.filter(o => !q || o.key.includes(q));
    if (!selKey || !list.some(o => o.key === selKey)) selKey = list[0].key;
    sel.innerHTML = shown.map(o => '<option value="' + esc(o.key) + '"' + (o.key === selKey ? ' selected' : '') + '>' + esc((o.avatar || '') + ' ' + o.alias) + ' · ' + (o.lastT ? 'activo ' + fdate(o.lastT) : 'sin partidas') + '</option>').join('') || '<option>Sin coincidencias</option>';
    const o = list.find(x => x.key === selKey);
    if (!o) return;
    const L = o.row ? learnPlayer(o.row) : null, st = (o.row && o.row.stats) || {}, h = st.h || {}, d = st.d || {};
    const stageTxt = L && typeof LEARN_STAGES !== 'undefined' ? LEARN_STAGES[L.stage] : '—';
    const camp = o.camp, won = camp.filter(s => s.outcome === 'WON').length;
    const days = L ? L.days : [];
    const q10 = k => { const x = h[k]; return x && x.n ? x.s / x.n : null; };
    const failD = k => { const x = h[k]; const a = x ? (x.n || 0) + (x.rj || 0) : 0; return a ? 100 * ((x.er || 0) + (x.bu || 0) + (x.cr || 0)) / a : null; };
    // dominio por plato
    const nameOf = {}; (window.PANEL_PLATOS || []).forEach(p => { nameOf[p.slug] = (AREA_ICON[p.area] || '') + ' ' + p.nombre; });
    const dishes = Object.entries(d).filter(([, v]) => v.n > 0).map(([k, v]) => { const a = v.s / v.n, first = v.ne ? v.e / v.ne : null, rest = (v.n - (v.ne || 0)) > 0 ? (v.s - (v.e || 0)) / (v.n - v.ne) : null; return { k, name: nameOf[k] || k, n: v.n, avg: a, s3: pct(v.s3, v.n), best: v.b, first, rest, delta: first != null && rest != null && v.ne >= 5 && v.n - v.ne >= 3 ? rest - first : null }; }).sort((a, b) => a.avg - b.avg);
    const refuerzo = dishes.filter(x => x.n >= 3 && (x.avg < 70)).slice(0, 4);
    // por nivel
    const lvRows = []; const byL = {}; camp.forEach(s => { const b = byL[s.level_number] || (byL[s.level_number] = { n: 0, w: 0, lost: 0, ab: 0, dur: [], first: 0 }); b.n++; if (s.outcome === 'WON') { b.w++; if (!b.first) b.first = b.n; } if (s.outcome === 'LOST') b.lost++; if (s.outcome === 'ABANDONED') b.ab++; if (s.duration_seconds) b.dur.push(s.duration_seconds); });
    Object.keys(byL).map(Number).sort((a, b) => a - b).forEach(l => { const b = byL[l], m = nivelData(l); lvRows.push('<tr><td><b>' + l + '</b> ' + (m ? '<small class="pnl-dim">' + esc(m.nombre) + '</small>' : '') + '</td><td>' + b.n + '</td><td>' + b.w + '</td><td>' + b.lost + '</td><td>' + (b.first ? b.first : '<span class="pnl-pill red">sin ganar</span>') + '</td><td>' + mins(avg(b.dur)) + '</td></tr>'); });
    // retos del entrenamiento
    const tr = (o.row && o.row.training) || {}, chal = (typeof LEARN_CHALLENGES !== 'undefined' ? LEARN_CHALLENGES : []);
    const chips = chal.map(([id, title], i) => { const r = tr[id], m = r && r.m || 0; return '<span class="pnl-chip m' + m + '" title="' + esc(title) + (r && r.t ? ' · mejor ' + Math.round(r.t) + ' s' : '') + '">' + (i + 1) + '</span>'; }).join('');
    const sessLast = o.sessions.slice(-30);

    host.innerHTML =
      '<div class="pnl-prof"><div class="pnl-av">' + esc(o.avatar || '🥋') + '</div><div><div class="pnl-name">' + esc(o.alias) + '</div><div class="pnl-dim">' + stageTxt + ' · cuenta creada ' + (o.cohort ? fdate(o.cohort) : '—') + ' · última partida ' + (o.lastT ? formatRelativeTime(new Date(o.lastT).toISOString()) : '—') + (o.p && o.p.mmr ? ' · MMR ' + o.p.mmr : '') + '</div></div></div>' +
      '<div class="kpi-grid">' +
        kpi('🏮', 'Nivel de Campaña', o.wonLevel ? o.wonLevel : (o.maxLevel ? 'jugando ' + o.maxLevel : '—'), won + ' victorias · ' + (camp.length - won) + ' sin ganar') +
        kpi('🎮', 'Partidas', o.sessions.length, o.days.length + ' día(s) distintos · ' + mins(o.playSec)) +
        kpi('🍽️', 'Platos servidos', L ? L.served : '—', L ? 'calidad media ' + N(L.avg, 0) + ' / 100' : 'sin estadísticas') +
        kpi('📈', 'Mejora de calidad', L && L.delta != null ? (L.delta > 0 ? '+' : '') + Math.round(L.delta) : '—', L && L.qE != null ? 'primeros días ' + Math.round(L.qE) + ' → últimos ' + Math.round(L.qL) : 'necesita 2+ días de juego') +
        kpi('🎯', 'Fallos por plato', L && L.fL != null ? P(Math.round(L.fL * 100)) : '—', L && L.fE != null ? 'antes ' + Math.round(L.fE * 100) + '%' : 'quemado, crudo o desorden') +
        kpi('🏋️', 'Entrenamiento', L ? L.trn + '/' + (chal.length || 27) : '—', L ? Math.round(L.share * 100) + '% del tiempo en práctica' : '') +
      '</div>' +
      '<div class="pnl-grid">' +
        card('Su curva de aprendizaje', 'Calidad media (línea verde) y % de fallos (roja) por día jugado', days.length >= 1 ? box('ch-pl-curve') : empty('Aún no hay historial diario.')) +
        card('Sus últimas partidas', 'Clientes atendidos en cada partida (verde = ganó, rojo = perdió, gris = otro)', sessLast.length ? box('ch-pl-sess') : empty('Sin partidas registradas.')) +
      '</div>' +
      (refuerzo.length ? '<div class="pnl-alert">💡 <b>Para reforzar:</b> ' + refuerzo.map(x => esc(x.name) + ' (' + Math.round(x.avg) + ')').join(' · ') + '. Calidad baja tras 3+ intentos: conviene una práctica dirigida en Cocina libre o un reto.</div>' : '') +
      '<div class="table-title" style="margin:14px 0 6px;"><span>🪜 Campaña por nivel</span></div>' +
      (lvRows.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Nivel</th><th>Intentos</th><th>Victorias</th><th>Derrotas</th><th>Ganó en el intento</th><th>Duración media</th></tr></thead><tbody>' + lvRows.join('') + '</tbody></table></div>' : empty('Sin partidas de Campaña.')) +
      '<div class="table-title" style="margin:14px 0 6px;"><span>🍲 Dominio por plato</span></div>' +
      (dishes.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Plato</th><th>Veces</th><th>Calidad</th><th>⭐⭐⭐</th><th>Mejor</th><th>Primeros 5 → después</th></tr></thead><tbody>' + dishes.map(x => '<tr><td>' + esc(x.name) + '</td><td>' + x.n + '</td><td><span class="pnl-bar" style="--p:' + Math.round(x.avg) + '"></span> ' + Math.round(x.avg) + '</td><td>' + P(x.s3) + '</td><td>' + Math.round(x.best) + '</td><td>' + (x.delta != null ? Math.round(x.first) + ' → ' + Math.round(x.rest) + ' <b style="color:' + (x.delta >= 0 ? '#66bb6a' : '#ef5350') + '">(' + (x.delta > 0 ? '+' : '') + Math.round(x.delta) + ')</b>' : '<span class="pnl-dim">pocos datos</span>') + '</td></tr>').join('') + '</tbody></table></div>' : empty('Aún no ha servido platos con estadísticas.')) +
      '<div class="table-title" style="margin:14px 0 6px;"><span>🏋️ Retos del Entrenamiento</span></div>' +
      (chal.length ? '<div class="pnl-chips">' + chips + '</div><div class="pnl-dim" style="font-size:11px;margin-top:4px;">Gris: sin completar · 🥉 bronce · 🥈 plata · 🥇 oro (pasa el dedo por un número para ver el reto)</div>' : empty('Sin datos de retos.')) +
      (o.p && o.p.contact ? '<div class="pnl-foot"><b>Contacto:</b> ' + esc(o.p.contact) + '</div>' : '');

    if (days.length >= 1) chart('plcurve', 'ch-pl-curve', { type: 'line', data: { labels: days.map(k => k.slice(5).split('-').reverse().join('/')), datasets: [
      { label: 'Calidad media', data: days.map(q10), borderColor: COL.green, backgroundColor: COL.green, tension: 0.3, yAxisID: 'y' },
      { label: '% fallos', data: days.map(failD), borderColor: COL.red, backgroundColor: COL.red, tension: 0.3, yAxisID: 'y1' }] },
      options: { maintainAspectRatio: false, plugins: { legend }, scales: { x: tick, y: { ...tick, min: 0, max: 100 }, y1: { ...tick, position: 'right', min: 0, grid: { display: false } } } } });
    if (sessLast.length) chart('plsess', 'ch-pl-sess', { type: 'bar', data: { labels: sessLast.map(s => fdate(s.t) + (s.game_mode === 'NORMAL' ? ' N' + s.level_number : ' ' + String(s.game_mode).slice(0, 3))), datasets: [
      { label: 'Atendidos', data: sessLast.map(s => s.customers_served || 0), backgroundColor: sessLast.map(s => s.outcome === 'WON' ? COL.green : s.outcome === 'LOST' ? COL.red : '#9e9e9e') },
      { label: 'Perdidos', data: sessLast.map(s => s.customers_lost || 0), backgroundColor: 'rgba(239,83,80,0.35)' }] },
      options: { maintainAspectRatio: false, plugins: { legend }, scales: { x: { ...tick, ticks: { color: COL.tx, maxRotation: 70, autoSkip: true } }, y: { ...tick, beginAtZero: true, ticks: { color: COL.tx, precision: 0 } } } } });
  }
  window.panelPlayerPick = key => { selKey = key; renderPlayer(); };

  // ================= PLATOS =================
  let dishArea = 'todas';
  window.panelDishArea = a => { dishArea = a; renderDishes(); };
  function renderDishes() {
    const el = document.getElementById('dishes-content'); if (!el) return;
    const catalog = window.PANEL_PLATOS || [];
    const agg = {};
    (window.allStats || []).forEach(r => Object.entries(((r.stats || {}).d) || {}).forEach(([k, v]) => {
      const o = agg[k] || (agg[k] = { n: 0, s: 0, s3: 0, e: 0, ne: 0, best: 0, players: 0, free: 0 });
      o.n += v.n || 0; o.s += v.s || 0; o.s3 += v.s3 || 0; o.e += v.e || 0; o.ne += v.ne || 0; o.best = Math.max(o.best, v.b || 0); o.free += v.f || 0; if (v.n > 0) o.players++;
    }));
    const rows = catalog.filter(p => !p.hervido && (dishArea === 'todas' || p.area === dishArea)).map(p => {
      const a = agg[p.slug] || null;
      const q = a && a.n ? a.s / a.n : null, first = a && a.ne ? a.e / a.ne : null, rest = a && a.n - a.ne > 0 ? (a.s - a.e) / (a.n - a.ne) : null;
      return { p, a, q, first, rest, delta: first != null && rest != null && a.n - a.ne >= 3 ? rest - first : null };
    });
    const withQ = rows.filter(r => r.q != null && r.a.n >= 5);
    const hardest = withQ.slice().sort((x, y) => x.q - y.q).slice(0, 3), noLearn = withQ.filter(r => r.delta != null && r.delta < 5 && r.q < 70);
    const ins = [];
    if (hardest.length) ins.push('🔥 Platos con menor calidad media: ' + hardest.map(r => '<b>' + esc(r.p.nombre) + '</b> (' + Math.round(r.q) + ')').join(', ') + '.');
    if (noLearn.length) ins.push('⚠️ No mejoran con la práctica y siguen bajos: ' + noLearn.map(r => '<b>' + esc(r.p.nombre) + '</b>').join(', ') + '.');
    const complex = withQ.filter(r => r.p.ingredientes >= 11 && r.q < 75);
    if (complex.length) ins.push('🧩 Los platos de 11+ ingredientes con calidad baja sugieren que el emplatado largo pesa: ' + complex.map(r => esc(r.p.nombre)).join(', ') + '.');
    if (!ins.length) ins.push('📊 Con pocos platos servidos aún no hay conclusiones; hacen falta 5+ por plato.');
    const chip = (k, t) => '<button class="pnl-fchip' + (dishArea === k ? ' on' : '') + '" onclick="panelDishArea(\'' + k + '\')">' + t + '</button>';
    el.innerHTML =
      '<div class="pnl-chips" style="margin-bottom:10px;">' + chip('todas', 'Todas') + chip('ramen', '🍜 Ramen') + chip('salteados', '🍳 Salteados') + chip('makis', '🍣 Makis') + chip('frituras', '🍤 Frituras') + '</div>' +
      '<div style="background:rgba(255,179,0,0.08); border:1px solid rgba(255,179,0,0.3); border-radius:10px; padding:10px 12px; margin-bottom:14px;"><ul style="margin:0; padding-left:18px; font-size:12.5px; line-height:1.6;">' + ins.map(x => '<li>' + x + '</li>').join('') + '</ul></div>' +
      '<div class="pnl-grid">' + card('Complejidad frente a calidad', 'Cada punto es un plato: ingredientes de su receta completa (X) y calidad media (Y)', box('ch-dish-scatter')) + '</div>' +
      '<div class="table-title" style="margin:14px 0 6px;"><span>🍲 Platos del juego</span></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Plato</th><th>Entra en</th><th>Ingredientes</th><th>Precio</th><th>Servidos</th><th>Calidad</th><th>⭐⭐⭐</th><th>Primeros 5 → después</th><th>Diagnóstico</th></tr></thead><tbody>' + rows.map(r => {
        const a = r.a, diag = !a || a.n < 5 ? '<span class="pnl-dim">pocos datos</span>' : (r.q < 70 && (r.delta == null || r.delta < 5) ? '<span class="pnl-pill red">⚠ no mejora</span>' : (r.delta != null && r.delta >= 10 ? '<span class="pnl-pill green">🌱 se aprende</span>' : '<span class="pnl-pill dim">➡ estable</span>'));
        return '<tr><td><b>' + (AREA_ICON[r.p.area] || '') + ' ' + esc(r.p.nombre) + '</b></td><td>' + (r.p.nivel ? 'nivel ' + r.p.nivel : '—') + (r.p.rash ? '<br><small class="pnl-dim">Rash ' + r.p.rash + '</small>' : '') + '</td><td title="' + esc(r.p.lista.join(', ')) + '">' + r.p.ingredientes + ' <small class="pnl-dim">(' + r.p.cocina + ' cocina · ' + r.p.emplatado + ' plato)</small></td><td>S/ ' + r.p.precio + '</td><td>' + (a ? a.n : 0) + (a ? ' <small class="pnl-dim">' + a.players + ' jug.</small>' : '') + '</td><td>' + (r.q != null ? '<span class="pnl-bar" style="--p:' + Math.round(r.q) + '"></span> ' + Math.round(r.q) : '—') + '</td><td>' + (a && a.n ? P(pct(a.s3, a.n)) : '—') + '</td><td>' + (r.delta != null ? Math.round(r.first) + ' → ' + Math.round(r.rest) + ' <b style="color:' + (r.delta >= 0 ? '#66bb6a' : '#ef5350') + '">(' + (r.delta > 0 ? '+' : '') + Math.round(r.delta) + ')</b>' : '—') + '</td><td>' + diag + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="pnl-foot"><b>Cómo leerlo.</b> Los ingredientes son los de la receta completa de Campaña (cocción + emplatado; gari y wasabi son opcionales y no cuentan). Pasa el dedo por el número de ingredientes para ver la lista. Calidad = puntaje 0–100 (cocción, proceso, emplatado y frescura). «Primeros 5 → después» compara los primeros 5 platos de cada jugador con el resto: cuánto se aprende cocinándolo.</div>';
    const pts = withQ.map(r => ({ x: r.p.ingredientes, y: +r.q.toFixed(1), r: Math.max(4, Math.min(16, Math.sqrt(r.a.n))), name: r.p.nombre, area: r.p.area }));
    chart('dscatter', 'ch-dish-scatter', { type: 'bubble', data: { datasets: [{ label: 'Platos', data: pts, backgroundColor: pts.map(p => ({ ramen: 'rgba(255,152,0,.7)', salteados: 'rgba(239,83,80,.7)', makis: 'rgba(38,166,154,.7)', frituras: 'rgba(255,179,0,.7)' }[p.area])) }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + c.raw.name + ': ' + c.raw.x + ' ingredientes · calidad ' + c.raw.y } } }, scales: { x: { ...tick, title: { display: true, text: 'Ingredientes de la receta', color: COL.tx } }, y: { ...tick, min: 0, max: 100, title: { display: true, text: 'Calidad media', color: COL.tx } } } } });
  }

  // ---------- enganche con el panel ----------
  window.panelAfterLoad = function () {
    const act = document.querySelector('.tab-pane.active'), id = act ? act.id : '';
    cache = null;
    try { if (id === 'tab-follow') renderFollow(); else if (id === 'tab-campaign') renderCampaign(); else if (id === 'tab-profile') renderPlayer(); else if (id === 'tab-dishes') renderDishes(); } catch (e) { console.warn('[panel]', e); }
  };
  window.panelRenderTab = function (id) {
    try { if (id === 'tab-follow') renderFollow(); else if (id === 'tab-campaign') renderCampaign(); else if (id === 'tab-profile') renderPlayer(); else if (id === 'tab-dishes') renderDishes(); } catch (e) { console.warn('[panel]', e); }
  };
  document.addEventListener('input', e => { if (e.target && e.target.id === 'pl-search') renderPlayer(); });
  document.addEventListener('change', e => { if (e.target && e.target.id === 'pl-select') { selKey = e.target.value; renderPlayer(); } });
  window.panelProgressCSV = function () {
    const M = model(), head = 'Jugador,Registro,Ultima_partida,Dias_jugados,Partidas,Minutos,Nivel_ganado,Nivel_jugado,Victorias_campana,Platos,Calidad_media,Mejora_calidad,Fallos_actuales,Retos\n';
    const rows = M.players.map(o => { const L = o.row ? learnPlayer(o.row) : null, w = o.camp.filter(s => s.outcome === 'WON').length;
      return [o.alias, o.cohort ? new Date(o.cohort).toISOString().slice(0, 10) : '', o.lastT ? new Date(o.lastT).toISOString().slice(0, 10) : '', o.days.length, o.sessions.length, Math.round(o.playSec / 60), o.wonLevel, o.maxLevel, w,
        L ? L.served : '', L ? Math.round(L.avg) : '', L && L.delta != null ? Math.round(L.delta) : '', L && L.fL != null ? Math.round(L.fL * 100) + '%' : '', L ? L.trn : ''].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','); }).join('\n');
    downloadCSV('﻿' + head + rows, 'shimaya_progreso_jugadores_' + new Date().toISOString().slice(0, 10) + '.csv');
  };
})();
