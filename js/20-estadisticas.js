/* Módulo 20-estadisticas — Estadísticas de cocina y curva de aprendizaje.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// ================= ESTADÍSTICAS DE COCINA =================
// Por cuenta: cuántas veces sirves cada plato, su calidad (puntaje 0-100 y estrellas) y el tiempo jugado por modo.
const STATS_MODES = { free: '🌿 Cocina libre', training: '🏋️ Entrenamiento', normal: '🏮 Campaña', rash: '⚡ Rash', multi: '⚔️ Multijugador' };
let statsTickCount = 0;

function statsDishKey(area, name) {
  return area + ':' + name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
function statsModeKey() {
  if (isMultiplayerSession()) return 'multi';
  return { NORMAL: 'normal', RASH: 'rash', TRAINING: 'training', FREE: 'free' }[gameState.gameMode] || 'normal';
}

// Historial diario (para ver la curva de aprendizaje): tiempo, platos, calidad y tipos de error de cada día.
function statsDayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function statsDay() {
  const h = accountProgress.stats.h || (accountProgress.stats.h = {});
  const k = statsDayKey();
  if (!h[k]) {
    h[k] = { t: 0, n: 0, s: 0, s3: 0, er: 0, bu: 0, cr: 0, rj: 0, lc: 0, g: 0 };
    const keys = Object.keys(h).sort();
    while (keys.length > STATS_DAYS_KEPT) delete h[keys.shift()];
  }
  return h[k];
}
function statsBump(field, n = 1) {
  loadAccountProgressLocal();
  statsDay()[field] += n;
  accountProgress.statsDirty = true;
}
// Tipo de error del plato: desorden (proceso), quemado o crudo.
function statsMistakes(ev) {
  const day = statsDay();
  if (ev.plate != null ? (ev.plateErrors > 0 || ev.wrong > 0 || ev.procRaw < 30) : ev.proc < 30) day.er++;
  if (ev.cook.state === 'QUEMADO' || ev.cook.state === 'CARBONIZADO') day.bu++;
  else if (ev.cook.state === 'CRUDO') day.cr++;
}

function statsRecordDish(recipe, ev) {
  loadAccountProgressLocal();
  let tier = ev.score >= 85 ? 3 : (ev.score >= 60 ? 2 : 1);
  if (ev.capped) tier = Math.min(tier, 1);
  const k = statsDishKey(getRecipeArea(recipe), recipe.name);
  const d = accountProgress.stats.d[k] || (accountProgress.stats.d[k] = { n: 0, s: 0, s1: 0, s2: 0, s3: 0, b: 0, f: 0, e: 0, ne: 0 });
  d.n++; d.s += ev.score; d['s' + tier]++;
  if ((d.ne || 0) < 5) { d.e = (d.e || 0) + ev.score; d.ne = (d.ne || 0) + 1; } // primeros 5 intentos: punto de partida
  const day = statsDay();
  day.n++; day.s += ev.score; if (tier === 3) day.s3++;
  statsMistakes(ev);
  d.b = Math.max(d.b, ev.score);
  if (isFree()) d.f++;
  accountProgress.statsDirty = true;
  saveAccountProgressLocal();
  accountPushSoon(false);
}

// Cada segundo de juego activo (no cuenta pausa ni pantallas de resultado).
function statsAddTime() {
  loadAccountProgressLocal();
  const m = statsModeKey();
  accountProgress.stats.t[m] = (accountProgress.stats.t[m] || 0) + 1;
  statsDay().t++;
  accountProgress.statsDirty = true;
  if (++statsTickCount % 10 === 0) saveAccountProgressLocal();
}

// Guarda en la nube lo pendiente (al salir al menú, al ocultar la pestaña y cada minuto).
function statsFlush() {
  if (!accountProgress.statsDirty) return;
  saveAccountProgressLocal();
  accountPush();
}
document.addEventListener('visibilitychange', () => { if (document.hidden) statsFlush(); });
window.addEventListener('pagehide', () => {
  if (!accountProgress.statsDirty) return;
  saveAccountProgressLocal();
  // al cerrar la pestaña el navegador cancela las llamadas normales: se usa keepalive
  try {
    if (CloudAuth.token) {
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/save_account`, { method: 'POST', keepalive: true,
        headers: { apikey: SUPABASE_CONFIG.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_token: CloudAuth.token, p_stats: accountProgress.stats }) });
    }
  } catch (e) {}
});
setInterval(statsFlush, 60000);

// --- Tu curva de aprendizaje (resumen para el jugador) ---
function learningSummary() {
  const st = accountProgress.stats, tr = accountProgress.training || {};
  const days = Object.keys(st.h || {}).filter(k => st.h[k].n > 0).sort();
  const series = days.slice(-14).map(k => ({ day: k, avg: st.h[k].s / st.h[k].n, n: st.h[k].n }));
  // calidad de tus primeros 5 platos de cada receta frente al resto
  let eSum = 0, eN = 0, rSum = 0, rN = 0;
  Object.values(st.d).forEach(d => {
    if ((d.ne || 0) >= 5 && d.n - d.ne >= 3) { eSum += d.e; eN += d.ne; rSum += d.s - d.e; rN += d.n - d.ne; }
  });
  // mejora de tiempo en los retos: primer intento frente a tu mejor marca
  const gains = Object.values(tr).filter(x => x.f && x.t && x.n >= 2).map(x => (x.f - x.t) / x.f);
  // errores por plato: últimos 7 días frente a los 7 anteriores
  const last = days.slice(-14);
  const sum = (arr, f) => arr.reduce((t, k) => t + (st.h[k][f] || 0), 0);
  const prevDays = last.slice(0, Math.max(0, last.length - 7)), nowDays = last.slice(-7);
  const rate = (arr) => { const n = sum(arr, 'n'); return n ? (sum(arr, 'er') + sum(arr, 'bu') + sum(arr, 'cr')) / n : null; };
  return { series, first: eN ? eSum / eN : null, rest: rN ? rSum / rN : null,
    trainGain: gains.length ? 100 * gains.reduce((a, b) => a + b, 0) / gains.length : null, trainCount: gains.length,
    errNow: rate(nowDays), errPrev: prevDays.length ? rate(prevDays) : null };
}

function learningSparkline(series) {
  if (series.length < 2) return '';
  const W = 260, H = 54, pad = 6;
  const pts = series.map((p, i) => [pad + i * (W - 2 * pad) / (series.length - 1), H - pad - (Math.max(0, Math.min(100, p.avg)) / 100) * (H - 2 * pad)]);
  return `<svg viewBox="0 0 ${W} ${H}" class="stt-spark" role="img" aria-label="Calidad media por día">
    <polyline fill="none" stroke="#43a047" stroke-width="2.5" stroke-linejoin="round" points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}"/>
    ${pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.8" fill="#ef6c00"/>`).join('')}</svg>`;
}

function renderLearningBlock() {
  const L = learningSummary();
  const lines = [];
  if (L.first != null && L.rest != null) {
    const diff = Math.round(L.rest - L.first);
    lines.push(diff > 0 ? `📈 Tus primeros platos de cada receta sacaron <b>${Math.round(L.first)}</b> y ahora sacas <b>${Math.round(L.rest)}</b> (+${diff}). ¡Mejoras con la práctica!`
      : `🎯 Tus primeros platos sacaron <b>${Math.round(L.first)}</b> y ahora <b>${Math.round(L.rest)}</b>. Prueba con la Cocina libre para afinar los puntos débiles.`);
  }
  if (L.trainGain != null) {
    lines.push(L.trainGain > 0 ? `⏱ En el Entrenamiento ahora tardas en promedio un <b>${Math.round(L.trainGain)}%</b> menos que en tu primer intento (${L.trainCount} retos).`
      : `⏱ Repite retos del Entrenamiento para bajar tus tiempos.`);
  }
  if (L.errNow != null && L.errPrev != null) {
    const a = Math.round(L.errPrev * 100), b = Math.round(L.errNow * 100);
    lines.push(b < a ? `✅ Fallos por plato (desorden, crudo o quemado): de <b>${a}%</b> a <b>${b}%</b> esta semana.` : `🔎 Fallos por plato esta semana: <b>${b}%</b> (antes ${a}%). Revisa el orden y los puntos de cocción.`);
  }
  if (!lines.length && L.series.length < 2) return '<div class="stt-learn"><div class="free-note">📈 Juega en varios días y aquí verás tu curva de aprendizaje.</div></div>';
  return `<div class="stt-learn"><div class="stt-learn-h">📈 Tu curva de aprendizaje <small>calidad media por día</small></div>${learningSparkline(L.series)}${lines.map(l => `<div class="stt-learn-l">${l}</div>`).join('')}</div>`;
}

// --- Pantalla "Mis estadísticas" ---
let statsView = { area: 'all' };
function formatPlayTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : (m > 0 ? `${m} min` : `${sec} s`);
}
function statsStarsFor(avg) { return avg >= 85 ? '⭐⭐⭐' : (avg >= 60 ? '⭐⭐' : '⭐'); }

function openStatsModal() {
  statsView = { area: 'all' };
  renderStatsModal();
  const m = document.getElementById('stats-modal');
  m.style.display = '';
  m.classList.add('active');
}
function closeStatsModal() { const m = document.getElementById('stats-modal'); if (m) m.classList.remove('active'); }
function setStatsArea(a) { statsView.area = a; renderStatsModal(); }

function renderStatsModal() {
  loadAccountProgressLocal();
  const body = document.getElementById('stats-body');
  if (!body) return;
  const st = accountProgress.stats;
  const index = {};
  freeAllRecipes().forEach(r => { index[statsDishKey(getRecipeArea(r), r.name)] = r; });
  const rows = Object.entries(st.d).filter(([k, d]) => d.n > 0 && index[k]).map(([k, d]) => ({ r: index[k], d }))
    .filter(x => statsView.area === 'all' || getRecipeArea(x.r) === statsView.area)
    .sort((a, b) => b.d.n - a.d.n);
  const totalTime = Object.values(st.t).reduce((t, v) => t + v, 0);
  const served = Object.values(st.d).reduce((t, d) => t + d.n, 0);
  const score = Object.values(st.d).reduce((t, d) => t + d.s, 0);
  const avgAll = served ? score / served : 0;
  const times = Object.entries(STATS_MODES).filter(([m]) => st.t[m]).map(([m, label]) => `<span class="stt-chip">${label} <b>${formatPlayTime(st.t[m])}</b></span>`).join('');
  const chips = [['all', 'Todos'], ['ramen', '🍜 Ramen'], ['salteados', '🍳 Salteado'], ['makis', '🍣 Makis'], ['frituras', '🍤 Frituras']]
    .map(([a, l]) => `<button class="stt-filter ${statsView.area === a ? 'on' : ''}" onclick="setStatsArea('${a}')">${l}</button>`).join('');
  const table = rows.length ? `<table class="stt-table"><thead><tr><th>Plato</th><th>Servidos</th><th>Calidad media</th><th>⭐⭐⭐</th><th>Mejor</th></tr></thead><tbody>` + rows.map(({ r, d }) => {
    const avg = d.s / d.n;
    return `<tr><td>${AREA_ICONS[getRecipeArea(r)]} ${r.name}</td><td>${d.n}${d.f ? ` <small>(${d.f} en libre)</small>` : ''}</td>
      <td><div class="stt-bar"><i style="width:${Math.round(avg)}%"></i></div>${Math.round(avg)} ${statsStarsFor(avg)}</td><td>${Math.round(100 * d.s3 / d.n)}%</td><td>${Math.round(d.b)}</td></tr>`;
  }).join('') + '</tbody></table>' : '<div class="free-note">Aún no hay platos servidos en este filtro. ¡Sirve algunos y vuelve!</div>';
  body.innerHTML = `
    <div class="stt-kpis">
      <div class="stt-kpi"><span>⏱ Tiempo jugado</span><b>${formatPlayTime(totalTime)}</b></div>
      <div class="stt-kpi"><span>🍽️ Platos servidos</span><b>${served}</b></div>
      <div class="stt-kpi"><span>⭐ Calidad media</span><b>${served ? Math.round(avgAll) + ' ' + statsStarsFor(avgAll) : '—'}</b></div>
    </div>
    <div class="stt-times">${times || '<span class="free-note">Aún no hay tiempo registrado.</span>'}</div>
    ${renderLearningBlock()}
    <div class="stt-filters">${chips}</div>
    ${table}`;
}
