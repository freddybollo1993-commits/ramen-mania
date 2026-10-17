/* Módulo 04-estado-y-audio — Estado de la partida y sistema de audio.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */
/* funciones declaradas en otro módulo que se usan al cargar este (se suben aquí para conservar el orden de ejecución original) */
function newWok(prev) {
  return { ingredients: [], result: null, matchedRecipe: null, stirring: false, stirSeconds: 0,
    fire: !!(prev && prev.fire), heat: prev ? (prev.heat || 0) : 0,     // el fuego y la temperatura se quedan al vaciar el wok
    tool: (prev && prev.tool) || 'wok',                                  // el utensilio también se queda en la hornilla
    oil: false,                                                          // el aceite de cocina se echa al empezar cada plato (el de ajonjolí es un ingrediente más de las rondas)
    toss: 0, taps: 0, rounds: 0, addRound: {}, log: [], cookT: 0, interrupts: 0, burnPeak: 0, lastAct: 0,
    parked: prev ? (prev.parked || null) : null };                         // el otro utensilio de la hornilla (wok o sartén), guardado con lo que tenga dentro
}

const CUSTOMER_TEMPLATES = [
  { name: "Kenji", avatar: "👨🏻" },
  { name: "Sakura", avatar: "👩🏻" },
  { name: "Hiroshi", avatar: "👴🏻" },
  { name: "Akemi", avatar: "👧🏻" },
  { name: "Takeshi", avatar: "🧑🏻" },
  { name: "Yuki", avatar: "👱🏻‍♀️" },
  { name: "Ren", avatar: "👦🏻" },
  { name: "Aoi", avatar: "👩🏻‍🦰" }
];

let currentLevelIndex = 0;
let gameState = {
  gameMode: 'NORMAL',
  rashLevel: 1,
  rashCustomersSpawned: 0,
  rashCustomersServed: 0,
  rashLives: 5,
  rashMaxLives: 5,
  elapsedTime: 0,
  money: 0,
  customersServed: 0,
  customersLost: 0,
  timeLeft: 90,
  isPaused: false,
  isGameOver: true,
  activeBowlIndex: 0,
  currentCategory: 'todos',
  activeArea: 'ramen',
  stages: { ramen: 'cook', salteados: 'cook', makis: 'cook', frituras: 'cook' }, // etapa abierta en cada área
  st: null, // etapas por área: existencias, preparación, pase y plato (ver stInit)
  makiRoll: { ingredients: [], matPlaced: false, rollState: 'NONE', rollProgress: 0, cutState: 'NONE', cutProgress: 0 },
  woks: [newWok(), newWok()],
  activeWokIndex: 0,
  fryStation: { ingredients: [], phase: 'BUILDING', proteinId: null, coat: 0, fryResult: null, frySeconds: 0, fryTone: '', matchedRecipe: null, cutState: 'NONE', cutProgress: 0 },
  selectedCustomerModalIndex: null,
  targetCustomerIndex: null,
  bowls: [
    { ingredients: [], matchedRamen: null },
    { ingredients: [], matchedRamen: null },
    { ingredients: [], matchedRamen: null }
  ],
  customerSlots: [null, null, null, null],
  customerSpawnTimer: 0,
  free: null, // Cocina libre: { auto: clientes automáticos, areas: áreas que pueden pedir }
  propinasSession: 0, // propinas ganadas en esta partida (el total acumulado vive en localStorage)
  gameClock: 0, // segundos de juego (no avanza en pausa): edad de los platos listos
  recortes: 0, // mottainai: mermas aprovechables (3 = 1 dashi)
  dashi: 0
};

let currentLbTab = 'NORMAL';
let gameLoopInterval = null;
let audioCtx = null;
let cachedWhiteNoiseBuffer = null;

function getWhiteNoiseBuffer() {
  if (!audioCtx) return null;
  if (!cachedWhiteNoiseBuffer || cachedWhiteNoiseBuffer.sampleRate !== audioCtx.sampleRate) {
    const bufferSize = Math.floor(audioCtx.sampleRate * 0.25);
    cachedWhiteNoiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = cachedWhiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.14;
    }
  }
  return cachedWhiteNoiseBuffer;
}

let audioUnlocked = false;
function initAudio() {
  if (audioUnlocked && audioCtx && audioCtx.state === 'running') return;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) { { try { audioCtx = new AudioCtxClass({ latencyHint: 'playback' }); } catch (e) { audioCtx = new AudioCtxClass(); } } if (window.Ambiente) Ambiente.conectar(audioCtx); }   // ambiente y música (audio-ambiente.js): los efectos pasan por su bus
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => { audioUnlocked = true; }).catch(() => {});
    } else if (audioCtx && audioCtx.state === 'running') {
      audioUnlocked = true;
    }
  } catch(e) {}
}

let isSoundMuted = safeStorage.getItem('ramen_sound_muted') === 'true';

function toggleAudioMute() {
  isSoundMuted = !isSoundMuted;
  safeStorage.setItem('ramen_sound_muted', isSoundMuted ? 'true' : 'false');
  if (!isSoundMuted) {
    try { playSound('click'); } catch(e) {}
  }
}

// Sonidos de los procesos de cocina: síntesis procedural (sin archivos). Los más frecuentes se limitan en el tiempo.
const _sfxLast = {};
function sfxEvery(type, ms) {
  const t = performance.now();
  if (t - (_sfxLast[type] || 0) < ms) return;
  _sfxLast[type] = t;
  playSound(type);
}
function sfxNoise(ctx, now, o) {
  const buf = getWhiteNoiseBuffer();
  if (!buf) return;
  const dur = o.dur || 0.1, t0 = now + (o.delay || 0);
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = dur > 0.24;
  const filt = ctx.createBiquadFilter(); filt.type = o.type || 'bandpass'; filt.Q.value = o.q || 1;
  filt.frequency.setValueAtTime(o.f0 || 1000, t0);
  if (o.f1) filt.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime((o.vol || 0.1) * 4, t0 + 0.004);   // el ruido base es muy suave: se compensa
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt); filt.connect(g); g.connect(ctx.destination);
  src.start(t0); src.stop(t0 + dur + 0.02);
}
function sfxTone(ctx, now, o) {
  const dur = o.dur || 0.1, t0 = now + (o.delay || 0);
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f || 440, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
  g.gain.setValueAtTime(o.vol || 0.1, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}
const SFX_EXTRA = {
  win: (c, t) => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => sfxTone(c, t, { f, dur: 0.26, type: 'triangle', vol: 0.13, delay: i * 0.09 })),
  fail: (c, t) => [392, 329.63, 261.63].forEach((f, i) => sfxTone(c, t, { f, dur: 0.22, type: 'sawtooth', vol: 0.09, delay: i * 0.13 })),
  wrong: (c, t) => { sfxTone(c, t, { f: 210, to: 150, dur: 0.1, type: 'square', vol: 0.07 }); sfxTone(c, t, { f: 210, to: 150, dur: 0.1, type: 'square', vol: 0.07, delay: 0.12 }); },
  error: (c, t) => { sfxTone(c, t, { f: 240, to: 170, dur: 0.12, type: 'square', vol: 0.06 }); },
  bell: (c, t) => { sfxTone(c, t, { f: 1568, dur: 0.5, vol: 0.09 }); sfxTone(c, t, { f: 2093, dur: 0.38, vol: 0.05, delay: 0.02 }); },
  pat: (c, t) => { sfxNoise(c, t, { dur: 0.09, type: 'lowpass', f0: 1300, f1: 500, vol: 0.13 }); sfxTone(c, t, { f: 150, to: 90, dur: 0.07, vol: 0.06 }); },
  splat: (c, t) => { sfxNoise(c, t, { dur: 0.17, f0: 900, f1: 350, q: 2, vol: 0.14 }); sfxTone(c, t, { f: 320, to: 110, dur: 0.12, vol: 0.07 }); },
  crunch: (c, t) => [0, 0.045, 0.09].forEach(d => sfxNoise(c, t, { dur: 0.04, type: 'highpass', f0: 2600, vol: 0.14, delay: d })),
  splash: (c, t) => {
    sfxNoise(c, t, { dur: 0.38, f0: 2200, f1: 600, q: 0.9, vol: 0.17 });
    sfxTone(c, t, { f: 180, to: 70, dur: 0.18, vol: 0.09 });
    [0.12, 0.2, 0.3].forEach(d => sfxNoise(c, t, { dur: 0.03, type: 'highpass', f0: 3000, vol: 0.1, delay: d }));
  },
  crackle: (c, t) => [0, 0.05 + Math.random() * 0.05, 0.12 + Math.random() * 0.06].forEach(d => sfxNoise(c, t, { dur: 0.025, type: 'highpass', f0: 2800 + Math.random() * 1500, vol: 0.06, delay: d })),
  chop: (c, t) => { sfxNoise(c, t, { dur: 0.05, f0: 1800, q: 1.2, vol: 0.15 }); sfxTone(c, t, { f: 170, to: 100, dur: 0.06, vol: 0.1 }); },
  swish: (c, t) => sfxNoise(c, t, { dur: 0.2, f0: 350, f1: 1500, q: 1, vol: 0.11 }),
  sizzle: (c, t) => sfxNoise(c, t, { dur: 0.14, type: 'highpass', f0: 3200, vol: 0.07 }),
  stir: (c, t) => { sfxNoise(c, t, { dur: 0.12, f0: 800, f1: 1100, q: 1.5, vol: 0.08 }); sfxTone(c, t, { f: 1200, dur: 0.05, type: 'triangle', vol: 0.03 }); },
  clink: (c, t) => { sfxTone(c, t, { f: 2300, dur: 0.14, vol: 0.07 }); sfxTone(c, t, { f: 3100, dur: 0.1, vol: 0.05, delay: 0.015 }); },
  prep: (c, t) => [0, 0.11, 0.22].forEach(d => { sfxNoise(c, t, { dur: 0.05, f0: 1500, q: 1.2, vol: 0.1, delay: d }); sfxTone(c, t, { f: 160, to: 100, dur: 0.05, vol: 0.06, delay: d }); }),
  pour: (c, t) => sfxNoise(c, t, { dur: 0.35, type: 'lowpass', f0: 900, f1: 350, vol: 0.1 })
};

function playSound(type) {
  if (isSoundMuted) return;
  try {
    initAudio();
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;
    if (SFX_EXTRA[type]) { SFX_EXTRA[type](audioCtx, now); return; }

    if (type === 'add') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'trash') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'serve') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.07);
      osc.frequency.setValueAtTime(783.99, now + 0.14);
      osc.frequency.setValueAtTime(1046.50, now + 0.21);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'lost') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'match') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'click' || type === 'tap') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'bubble') {
      // Procedural boiling water bubble pop
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      const startFreq = 420 + Math.random() * 220;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 2.1, now + 0.07);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'flame') {
      // Procedural burner / blowtorch flame whoosh (usando buffer cacheado)
      const noiseBuffer = getWhiteNoiseBuffer();
      if (!noiseBuffer) return;
      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.exponentialRampToValueAtTime(280, now + 0.22);
      filter.Q.setValueAtTime(1.4, now);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.22);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start(now);
      noise.stop(now + 0.22);
    } else if (type === 'ding') {
      // Microwave / kitchen bell ding chime (harmonic)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(1318.51, now); // E6
      osc2.frequency.setValueAtTime(2637.02, now); // E7
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    } else if (type === 'burn') {
      // Burnt food penalty buzz
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.linearRampToValueAtTime(45, now + 0.35);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'stock_add') {
      // Ascending chime when stock is added
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0, now + idx * 0.05 + 0.12);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.12);
      });
    }
  } catch(e) {}
}

// Cartel grande de aviso: por defecto "ESTAS ABOLLADO"; con texto propio sirve para avisos del plato (variante ámbar, con línea de detalle)
function triggerAbolladoEffect(text, sub) {
  const overlay = document.getElementById("screen-flash-overlay");
  const banner = document.getElementById("abollado-banner");
  if (banner) {
    banner.innerHTML = text ? `${text}${sub ? `<small>${sub}</small>` : ''}` : '💥 ESTAS ABOLLADO 💥';
    banner.classList.toggle('banner-dish', !!text);
  }

  if (overlay) {
    overlay.classList.remove("flash-active");
    void overlay.offsetWidth;
    overlay.classList.add("flash-active");
  }

  if (banner) {
    banner.classList.remove("banner-active");
    void banner.offsetWidth;
    banner.classList.add("banner-active");
  }
}
