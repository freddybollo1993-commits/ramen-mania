/* Ambiente y música adaptativa de Ramen Mania (skill game-audio-director) - v1
   Todo se SINTETIZA con Web Audio (sin archivos: funciona sin red y pesa 0 KB); más adelante se pueden mezclar muestras de Lyria/Veo por las mismas capas.
   Cadena:  efectos (sfx) · ambiente (amb) · música (mus) · reverberación corta  ->  master -> filtro de pausa -> compresor/limitador -> salida real.
   Los efectos que ya existían (playSound) siguen igual pero ahora pasan por el bus sfx: se redefine `audioCtx.destination` en la instancia, sin tocar el resto del código.
   Tensión T (0-1) cada segundo: paciencia del cliente más cerca de irse, clientes esperando, tiempo usado, dificultad y estrés (quemados, clientes perdidos).
   Scripts clásicos: nada de import/export. API: window.Ambiente = { panel, conectar, actualizar, evento, volumen, sync, medir, estado, detener }. */
(function () {
  'use strict';

  // ---------- constantes de diseño (un solo lugar) ----------
  const AUDIO_TENSION = { pat: 0.45, cli: 0.20, tiempo: 0.15, dif: 0.10, estres: 0.10, sube: 0.6, baja: 0.2 };   // pesos y suavizado por segundo
  const ANCLAS_T = [0.12, 0.4, 0.68, 0.92];                       // centros de Calma, Ritmo, Presión, Crisis
  const CAPAS = {                                                // volumen de cada capa en cada tramo (interpolado por T)
    room:   [0.50, 0.50, 0.45, 0.40],
    boil:   [0.40, 0.60, 0.80, 0.90],
    fire:   [0.40, 0.60, 0.80, 0.90],
    oil:    [0.40, 0.60, 0.80, 0.90],
    crowd:  [0.30, 0.50, 0.60, 0.50],
    street: [0.40, 0.20, 0.10, 0.00],
    musCalm:[0.60, 0.40, 0.15, 0.00],
    musTens:[0.00, 0.25, 0.60, 0.85],
    heart:  [0.00, 0.00, 0.20, 0.70],
    taps:   [0.00, 0.20, 0.50, 0.70]
  };
  // qué capas suenan en cada modo y con qué factor; T se limita o se fuerza según el modo
  const PERFIL = {
    menu:     { room: .35, boil: .35, fire: .12, oil: 0,  crowd: .15, street: .9, musCalm: .8, musTens: 0, heart: 0, taps: 0, T: 0 },
    aula:     { room: .20, boil: 0,   fire: 0,   oil: 0,  crowd: 0,   street: .5, musCalm: .5, musTens: 0, heart: 0, taps: 0, T: 0 },
    secretos: { room: .30, boil: 0,   fire: 0,   oil: 0,  crowd: 0,   street: .3, musCalm: .3, musTens: 0, heart: 0, taps: 0, T: 0 },
    libre:    { room: .30, boil: .25, fire: .15, oil: .10, crowd: .15, street: .7, musCalm: 1.0, musTens: 0, heart: 0, taps: 0, T: 0 },
    entreno:  { room: .35, boil: .30, fire: .20, oil: .15, crowd: 0,  street: .3, musCalm: .2, musTens: .25, heart: .3, taps: .3, T: .5 },
    japon:    { room: .30, boil: .30, fire: .12, oil: 0,  crowd: .30, street: 1.0, musCalm: .9, musTens: 0, heart: 0, taps: 0, T: 0 },
    campana:  { room: 1, boil: 1, fire: 1, oil: 1, crowd: 1, street: 1, musCalm: 1, musTens: 1, heart: 1, taps: 1, T: 1 },
    rash:     { room: 1, boil: .8, fire: .8, oil: .8, crowd: 1, street: .5, musCalm: .4, musTens: 1.1, heart: 1, taps: 1, T: 1, Tmin: .45 }
  };
  const ARCO = {                                                // la cocina que se oye según el arco de la Campaña
    ramen:    { room: 1,   boil: 1,   fire: .15, oil: 0 },
    salteado: { room: .9,  boil: .6,  fire: 1,   oil: 0 },
    makis:    { room: .7,  boil: .35, fire: .2,  oil: 0 },
    frituras: { room: .9,  boil: .5,  fire: .4,  oil: 1 },
    maestria: { room: 1,   boil: .8,  fire: .7,  oil: .7 }
  };
  const BUS_BASE = { sfx: 1, amb: 1.0, mus: 1.0 };
  const GAN = { room: 0.09, boil: 0.12, fire: 0.09, oil: 0.06, crowd: 0.07, street: 0.10 };      // ganancia máxima de cada capa continua
  const MAX_VOCES = 28;
  const VOL_KEY = 'ramen_audio_vol';
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const HIRAJOSHI = [293.66, 329.63, 349.23, 440.0, 466.16, 587.33, 659.25, 698.46];   // re menor «japonesa» (hirajoshi) en dos octavas
  function interp(arr, T) { if (T <= ANCLAS_T[0]) return arr[0]; for (let i = 1; i < 4; i++) if (T <= ANCLAS_T[i]) { const k = (T - ANCLAS_T[i - 1]) / (ANCLAS_T[i] - ANCLAS_T[i - 1]); return arr[i - 1] + (arr[i] - arr[i - 1]) * k; } return arr[3]; }

  let E = null;                                                  // motor activo (null hasta que hay un AudioContext)

  // ---------- construcción del grafo (sirve para el contexto real y para el offline de las pruebas) ----------
  function crear(ctx, opt) {
    opt = opt || {};
    const eng = { ctx, offline: !!opt.offline, voces: 0, capas: {}, T: 0, Tobj: 0, estres: 0, modo: 'menu', arco: 'ramen', n: 0, minPat: 1, muted: false, pausa: false, t: { }, vol: { sfx: 1, amb: 1, mus: 1 } };
    try { const v = JSON.parse(store.get(VOL_KEY) || '{}'); ['sfx', 'amb', 'mus'].forEach(k => { if (typeof v[k] === 'number') eng.vol[k] = clamp(v[k], 0, 1); }); } catch (e) {}
    const sr = ctx.sampleRate;
    // ruido de 3 s (se reutiliza en todas las capas)
    const nb = ctx.createBuffer(1, sr * 3, sr), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    eng.noise = nb;
    // reverberación corta de cocina con azulejos
    const rl = Math.floor(sr * 1.1), ir = ctx.createBuffer(2, rl, sr);
    for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); for (let i = 0; i < rl; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.6); }
    // buses
    const g = (v) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    eng.sfx = g(BUS_BASE.sfx * eng.vol.sfx); eng.amb = g(BUS_BASE.amb * eng.vol.amb); eng.mus = g(BUS_BASE.mus * eng.vol.mus);
    eng.master = g(1);
    eng.conv = ctx.createConvolver(); eng.conv.buffer = ir; eng.wet = g(0.6);
    eng.sendAmb = g(0.18); eng.sendMus = g(0.35);
    eng.amb.connect(eng.sendAmb); eng.mus.connect(eng.sendMus); eng.sendAmb.connect(eng.conv); eng.sendMus.connect(eng.conv); eng.conv.connect(eng.wet); eng.wet.connect(eng.master);
    eng.lp = ctx.createBiquadFilter(); eng.lp.type = 'lowpass'; eng.lp.frequency.value = 20000; eng.lp.Q.value = 0.4;
    eng.comp = ctx.createDynamicsCompressor(); eng.comp.threshold.value = -14; eng.comp.knee.value = 12; eng.comp.ratio.value = 10; eng.comp.attack.value = 0.004; eng.comp.release.value = 0.25;
    eng.sfx.connect(eng.master); eng.amb.connect(eng.master); eng.mus.connect(eng.master);
    eng.master.connect(eng.lp); eng.lp.connect(eng.comp);
    eng.out = opt.salida || opt.destino || ctx.destination; eng.comp.connect(eng.out);

    // capas continuas: ruido filtrado con su ganancia
    const capa = (nombre, tipo, f, q, dest, mod) => {
      const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; fl.Q.value = q;
      const m = ctx.createGain(); m.gain.value = mod ? 0.7 : 1;
      const ga = ctx.createGain(); ga.gain.value = 0;
      s.connect(fl); fl.connect(m); m.connect(ga); ga.connect(dest);
      if (mod) { const lfo = ctx.createOscillator(); lfo.frequency.value = mod.f; const dp = ctx.createGain(); dp.gain.value = mod.d; lfo.connect(dp); dp.connect(m.gain); lfo.start(); eng.fuentes.push(lfo); }
      s.start(0, Math.random() * 2); eng.fuentes.push(s);
      eng.capas[nombre] = { g: ga, nivel: 0, techo: 0 };
      return fl;
    };
    eng.fuentes = [];
    capa('room', 'lowpass', 380, 0.5, eng.amb, { f: 0.09, d: 0.12 });
    const rumble = capa('boil', 'lowpass', 260, 0.7, eng.amb, { f: 0.23, d: 0.15 });
    capa('fire', 'lowpass', 950, 0.6, eng.amb, { f: 0.31, d: 0.25 });
    capa('oil', 'highpass', 3600, 0.7, eng.amb, { f: 0.5, d: 0.2 });
    // murmullo: dos formantes
    const cs = ctx.createBufferSource(); cs.buffer = nb; cs.loop = true; const f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter();
    f1.type = f2.type = 'bandpass'; f1.frequency.value = 470; f1.Q.value = 1.2; f2.frequency.value = 1450; f2.Q.value = 1.6;
    const cg = ctx.createGain(); cg.gain.value = 0; const cm = ctx.createGain(); cm.gain.value = 0.7; const l2 = ctx.createOscillator(); l2.frequency.value = 0.41; const d2 = ctx.createGain(); d2.gain.value = 0.35; l2.connect(d2); d2.connect(cm.gain); l2.start();
    cs.connect(f1); cs.connect(f2); f1.connect(cm); f2.connect(cm); cm.connect(cg); cg.connect(eng.amb); cs.start(0, Math.random() * 2); eng.fuentes.push(cs, l2);
    eng.capas.crowd = { g: cg, nivel: 0, techo: 0 };
    capa('street', 'bandpass', 620, 0.5, eng.amb, { f: 0.07, d: 0.3 });
    ['musCalm', 'musTens', 'heart', 'taps'].forEach(n => { eng.capas[n] = { g: null, nivel: 0, techo: 0 }; });   // estas son voces puntuales programadas por pump()
    return eng;
  }

  // ---------- voces puntuales ----------
  function voz(eng, t, dur, fn) {                                    // limita las voces que suenan A LA VEZ (no las programadas por adelantado)
    const ahora = eng.ctx.currentTime; eng.v = (eng.v || []).filter(x => x.t1 >= ahora - 0.1);
    let n = 0; for (const x of eng.v) if (x.t0 <= t + dur && x.t1 >= t) n++;
    if (n >= MAX_VOCES) return false;
    eng.v.push({ t0: t, t1: t + dur + 0.05 }); fn(); return true;
  }
  function env(ctx, node, t, a, pico, dec, fin) { node.gain.setValueAtTime(0.0001, t); node.gain.linearRampToValueAtTime(pico, t + a); node.gain.exponentialRampToValueAtTime(fin || 0.0001, t + a + dec); }
  function burbuja(eng, t, g) {
    const c = eng.ctx;
    voz(eng, t, 0.2, () => {
      if (Math.random() < 0.55) { const o = c.createOscillator(), ga = c.createGain(); o.type = 'sine'; const f0 = rnd(230, 420); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * rnd(1.6, 2.2), t + 0.05); env(c, ga, t, 0.004, g * 0.9, 0.06); o.connect(ga); ga.connect(eng.amb); o.start(t); o.stop(t + 0.1); }
      else { const s = c.createBufferSource(); s.buffer = eng.noise; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rnd(350, 1100); bp.Q.value = 4; const ga = c.createGain(); env(c, ga, t, 0.003, g, rnd(0.03, 0.08)); s.connect(bp); bp.connect(ga); ga.connect(eng.amb); s.start(t, rnd(0, 2), 0.14); }
    });
  }
  function chisporroteo(eng, t, g) { const c = eng.ctx; voz(eng, t, 0.05, () => { const s = c.createBufferSource(); s.buffer = eng.noise; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = rnd(2800, 5500); const ga = c.createGain(); env(c, ga, t, 0.001, g, rnd(0.008, 0.02)); s.connect(hp); hp.connect(ga); ga.connect(eng.amb); s.start(t, rnd(0, 2), 0.04); }); }
  function campana(eng, t, f, g, dec, dest) {                       // campanilla / furin: parcial fundamental + inarmónico
    const c = eng.ctx;
    voz(eng, t, dec + 0.1, () => { [[f, 1], [f * 2.76, 0.28], [f * 5.4, 0.1]].forEach(([fr, k]) => { const o = c.createOscillator(), ga = c.createGain(); o.type = 'sine'; o.frequency.value = fr * rnd(0.998, 1.002); env(c, ga, t, 0.002, g * k, dec * (k === 1 ? 1 : 0.5)); o.connect(ga); ga.connect(dest || eng.amb); o.start(t); o.stop(t + dec + 0.1); }); });
  }
  function taiko(eng, t, g) {
    const c = eng.ctx;
    voz(eng, t, 0.45, () => {
      const o = c.createOscillator(), ga = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(62, t + 0.22); env(c, ga, t, 0.003, g, 0.3); o.connect(ga); ga.connect(eng.mus); o.start(t); o.stop(t + 0.4);
      const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'triangle'; o2.frequency.setValueAtTime(340, t); o2.frequency.exponentialRampToValueAtTime(120, t + 0.12); env(c, g2, t, 0.002, g * 0.5, 0.14); o2.connect(g2); g2.connect(eng.mus); o2.start(t); o2.stop(t + 0.25);   // el armónico se oye en un altavoz sin graves
      const s = c.createBufferSource(); s.buffer = eng.noise; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1; const g3 = c.createGain(); env(c, g3, t, 0.001, g * 0.35, 0.03); s.connect(bp); bp.connect(g3); g3.connect(eng.mus); s.start(t, rnd(0, 2), 0.06);
    });
  }
  function pulsado(eng, t, f, g) {                                   // koto: cuerda pulsada
    const c = eng.ctx;
    voz(eng, t, 1.6, () => { const o = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), ga = c.createGain(); o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.003;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 0.9); env(c, ga, t, 0.004, g, 1.2);
      o.connect(lp); o2.connect(lp); lp.connect(ga); ga.connect(eng.mus); o.start(t); o2.start(t); o.stop(t + 1.5); o2.stop(t + 1.5); });
  }
  function shaku(eng, t, f, dur, g) {                                // shakuhachi: tono con vibrato y aire
    const c = eng.ctx;
    voz(eng, t, dur + 0.8, () => { const o = c.createOscillator(), vib = c.createOscillator(), vd = c.createGain(), ga = c.createGain(); o.type = 'sine'; o.frequency.value = f; vib.frequency.value = 5; vd.gain.value = f * 0.006; vib.connect(vd); vd.connect(o.frequency);
      ga.gain.setValueAtTime(0.0001, t); ga.gain.linearRampToValueAtTime(g, t + 0.45); ga.gain.setValueAtTime(g, t + dur - 0.2); ga.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
      const s = c.createBufferSource(); s.buffer = eng.noise; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 6; const gn = c.createGain(); gn.gain.value = 0.5; s.connect(bp); bp.connect(gn); gn.connect(ga);
      o.connect(ga); ga.connect(eng.mus); o.start(t); vib.start(t); s.start(t, rnd(0, 2), dur + 0.7); o.stop(t + dur + 0.7); vib.stop(t + dur + 0.7); });
  }
  function latido(eng, t, g) {
    const c = eng.ctx;
    [0, 0.28].forEach((dt, i) => voz(eng, t + dt, 0.3, () => { const o = c.createOscillator(), o2 = c.createOscillator(), ga = c.createGain(); o.frequency.value = 95; o2.frequency.value = 190; o.type = o2.type = 'sine'; env(c, ga, t + dt, 0.01, g * (i ? 0.7 : 1), 0.14); o.connect(ga); o2.connect(ga); ga.connect(eng.mus); o.start(t + dt); o2.start(t + dt); o.stop(t + dt + 0.25); o2.stop(t + dt + 0.25); }));
  }
  function toque(eng, t, g, agudo) { const c = eng.ctx; voz(eng, t, 0.05, () => { const s = c.createBufferSource(); s.buffer = eng.noise; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = agudo ? 1600 : 900; bp.Q.value = 3; const ga = c.createGain(); env(c, ga, t, 0.001, g, 0.012); s.connect(bp); bp.connect(ga); ga.connect(eng.sfx); s.start(t, rnd(0, 2), 0.03); }); }
  function tictac(eng, t, g) { const c = eng.ctx; voz(eng, t, 0.05, () => { const o = c.createOscillator(), ga = c.createGain(); o.type = 'square'; o.frequency.value = 1700; env(c, ga, t, 0.001, g, 0.012); o.connect(ga); ga.connect(eng.sfx); o.start(t); o.stop(t + 0.03); }); }
  function golpe(eng, t, g) {                                        // cliente perdido: golpe sordo
    const c = eng.ctx;
    voz(eng, t, 0.5, () => { const o = c.createOscillator(), ga = c.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.3); env(c, ga, t, 0.004, g, 0.35); o.connect(ga); ga.connect(eng.sfx); o.start(t); o.stop(t + 0.5); const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'triangle'; o2.frequency.setValueAtTime(260, t); o2.frequency.exponentialRampToValueAtTime(90, t + 0.2); env(c, g2, t, 0.003, g * 0.5, 0.2); o2.connect(g2); g2.connect(eng.sfx); o2.start(t); o2.stop(t + 0.3); });
  }
  function encendedor(eng, t, g) {                                   // tic-tic-tic y soplido del gas
    const c = eng.ctx;
    [0, 0.09, 0.18].forEach(dt => toque(eng, t + dt, g * 0.8, true));
    voz(eng, t + 0.28, 0.6, () => { const s = c.createBufferSource(); s.buffer = eng.noise; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t + 0.28); lp.frequency.exponentialRampToValueAtTime(2200, t + 0.5); const ga = c.createGain(); env(c, ga, t + 0.28, 0.06, g * 0.9, 0.35); s.connect(lp); lp.connect(ga); ga.connect(eng.amb); s.start(t + 0.28, rnd(0, 2), 0.5); });
  }

  // ---------- planificador: programa los sonidos puntuales con el reloj de audio ----------
  function pump(eng, horizonte, ahora) {
    const c = eng.ctx, now = ahora != null ? ahora : c.currentTime, fin = now + horizonte, S = eng.s;           // S = nivel actual de cada capa (0-1) calculado en actualizar()
    if (!S) return;
    const sig = (k, ini) => { if (eng.t[k] == null || eng.t[k] < now - 0.3) eng.t[k] = now + ini; return eng.t[k]; };   // si el reloj se atrasó (pestaña dormida) se reinicia sin ráfagas
    // burbujas del hervor: más cuanto más intenso
    while (S.boil > 0.02 && sig('bub', rnd(0, .5)) < fin) { burbuja(eng, eng.t.bub, 0.035 * S.boil + 0.01); eng.t.bub += 1 / (1.5 + 9 * S.boil) * rnd(0.4, 1.6); }
    // chisporroteo del aceite
    while (S.oil > 0.02 && sig('crk', rnd(0, .3)) < fin) { chisporroteo(eng, eng.t.crk, 0.05 * S.oil); eng.t.crk += 1 / (4 + 22 * S.oil) * rnd(0.3, 1.8); }
    // encendedor del gas (cocina del wok)
    while (S.fire > 0.5 && sig('ign', rnd(4, 12)) < fin) { encendedor(eng, eng.t.ign, 0.05); eng.t.ign += rnd(14, 28); }
    // campanilla de viento y lejanía (calma)
    while (S.street > 0.05 && sig('furin', rnd(2, 6)) < fin) { campana(eng, eng.t.furin, rnd(2100, 3200), 0.018 * S.street, rnd(1.2, 2.2), eng.amb); eng.t.furin += rnd(5, 11) / Math.max(0.3, S.street); }
    // koto suave (música de calma): notas sueltas de la escala hirajoshi con huecos
    while (S.musCalm > 0.03 && sig('koto', rnd(.5, 2)) < fin) { const i = Math.floor(rnd(0, HIRAJOSHI.length)); pulsado(eng, eng.t.koto, HIRAJOSHI[i], 0.05 * S.musCalm); if (Math.random() < 0.35) pulsado(eng, eng.t.koto + rnd(0.18, 0.35), HIRAJOSHI[(i + 2) % HIRAJOSHI.length], 0.035 * S.musCalm); eng.t.koto += rnd(1.6, 3.8); }
    // pulso de taiko y shakuhachi (música de tensión): el ritmo sube con T
    const bpm = 66 + 54 * eng.T, paso = 60 / bpm;
    while (S.musTens > 0.03 && sig('tai', .2) < fin) { const n = (eng.t.taiN = ((eng.t.taiN || 0) + 1) % 4); taiko(eng, eng.t.tai, (n === 0 ? 0.22 : 0.12) * S.musTens); eng.t.tai += paso * (n === 3 && eng.T > 0.6 ? 0.5 : 1); }
    while (S.musTens > 0.2 && eng.T > 0.45 && sig('shk', 1) < fin) { shaku(eng, eng.t.shk, [329.63, 349.23, 293.66, 311.13][Math.floor(rnd(0, 4))] * (Math.random() < .3 ? 2 : 1), rnd(2.5, 4.5), 0.03 * S.musTens); eng.t.shk += rnd(5, 9); }
    // latido grave en la crisis
    while (S.heart > 0.05 && sig('hrt', .5) < fin) { latido(eng, eng.t.hrt, 0.16 * S.heart); eng.t.hrt += clamp(1.5 - 0.7 * eng.T, 0.7, 1.4); }
    // dedos golpeando la barra: más rápido cuanto menos paciencia queda
    if (S.taps > 0.05 && eng.minPat < 0.3) { while (sig('tap', 1) < fin) { const t0 = eng.t.tap, ag = eng.minPat < 0.1; [0, 0.17, 0.34].forEach(dt => toque(eng, t0 + dt, 0.05 * S.taps, ag)); eng.t.tap += ag ? 1.1 : 2.2; } } else eng.t.tap = null;
  }

  // ---------- estado del juego -> modo, arco y tensión ----------
  function sala() { try { return (window.Inicio && Inicio._S && Inicio._S.room) || null; } catch (e) { return null; } }
  function enPartida() { try { const gc = document.getElementById('game-container'); return !gameState.isGameOver && gc && gc.offsetParent !== null && gc.getBoundingClientRect().height > 0; } catch (e) { return false; } }
  function muestrear() {
    const r = { modo: 'menu', arco: 'ramen', T: 0, n: 0, minPat: 1, tiempo: 99, falta: false };
    if (!enPartida()) { const sa = sala(); r.modo = sa === 'aula' ? 'aula' : (sa === 'secretos' ? 'secretos' : 'menu'); return r; }
    const gs = gameState, slots = (gs.customerSlots || []).filter(Boolean);
    slots.forEach(c => { if (c.orders && c.orders.some(o => !o.served)) r.minPat = Math.min(r.minPat, c.patience / c.maxPatience); });
    r.n = slots.length; let max = 4, uso = 0, dif = 0.3, cfg = null;
    if (gs.gameMode === 'NORMAL') { r.modo = 'campana'; cfg = NIVELES[currentLevelIndex]; max = cfg.max_customers; uso = 1 - gs.timeLeft / cfg.time; dif = cfg.level / 20; r.arco = cfg.arc || 'ramen'; r.tiempo = gs.timeLeft; r.falta = gs.money < cfg.goal; }
    else if (gs.gameMode === 'RASH') { r.modo = 'rash'; uso = Math.min(1, (gs.rashLevel || 1) / 100); dif = Math.min(1, (gs.rashLevel || 1) / 50); r.arco = 'maestria'; }
    else if (gs.gameMode === 'JAPON' && gs.japon) { r.modo = 'campana'; r.arco = 'maestria'; dif = 0.4; }
    else if (gs.gameMode === 'TRAINING') r.modo = 'entreno';
    else if (gs.gameMode === 'FREE') r.modo = 'libre';
    else r.modo = 'entreno';
    const W = AUDIO_TENSION;
    r.T = clamp(W.pat * (1 - r.minPat) + W.cli * (r.n / Math.max(1, max)) + W.tiempo * uso + W.dif * dif + W.estres * clamp(E ? E.estres : 0, 0, 1), 0, 1);
    return r;
  }

  function aplicar(eng, m, dtSeg) {
    const P = PERFIL[m.modo] || PERFIL.menu, ar = ARCO[m.arco] || ARCO.ramen, W = AUDIO_TENSION;
    let Tobj = m.T * (P.T === undefined ? 1 : P.T); if (P.Tmin) Tobj = Math.max(Tobj, P.Tmin + 0.3 * m.T);
    eng.Tobj = Tobj; eng.T += (Tobj - eng.T) * (Tobj > eng.T ? W.sube : W.baja) * Math.min(1, dtSeg);
    eng.modo = m.modo; eng.arco = m.arco; eng.n = m.n; eng.minPat = m.minPat;
    eng.estres = Math.max(0, eng.estres - 0.08 * dtSeg);              // el estrés (quemados, perdidos) se disipa solo
    const T = eng.T, S = {};
    const cocina = k => (m.modo === 'campana' || m.modo === 'rash' ? (ar[k] === undefined ? 1 : ar[k]) : 1);
    ['room', 'boil', 'fire', 'oil', 'crowd', 'street', 'musCalm', 'musTens', 'heart', 'taps'].forEach(k => { S[k] = interp(CAPAS[k], T) * (P[k] === undefined ? 1 : P[k]) * (k === 'room' || k === 'boil' || k === 'fire' || k === 'oil' ? cocina(k) : 1); });
    S.crowd *= clamp(m.n / 3, 0.15, 1);                                // el murmullo crece con la cantidad de clientes
    if (m.modo === 'menu' || m.modo === 'libre') S.crowd = 0.15 * (P.crowd || 0) * 4;
    eng.s = S;
    const ahora = eng.ctx.currentTime, tc = 1.4;
    const gan = GAN;
    Object.keys(gan).forEach(k => { const c = eng.capas[k]; if (c && c.g) c.g.gain.setTargetAtTime(S[k] * gan[k], ahora, tc); });
    // pausa: la mezcla «se aleja»
    const pausa = !!(m.modo !== 'menu' && gameState && gameState.isPaused);
    eng.lp.frequency.setTargetAtTime(pausa ? 700 : 20000, ahora, 0.15); eng.amb.gain.setTargetAtTime(BUS_BASE.amb * eng.vol.amb * (pausa ? 0.6 : 1), ahora, 0.2);
    eng.master.gain.setTargetAtTime(eng.muted ? 0 : 1, ahora, 0.08);
  }

  // ---------- API ----------
  function conectar(ctx) {
    if (E || !ctx) return;
    try {
      const real = ctx.destination;                                  // la salida real, antes de redefinirla
      E = crear(ctx, { salida: real });
      Object.defineProperty(ctx, 'destination', { get: () => E.sfx, configurable: true });       // todos los efectos antiguos pasan por el bus sfx
      sync(); E.timer = setInterval(actualizar, 1000); E.pump = setInterval(() => { if (!E.muted && ctx.state === 'running') pump(E, 1.6); }, 400);
      actualizar();
    } catch (e) { try { console.warn('[Ambiente]', e); } catch (er) {} E = null; }
  }
  function actualizar() {
    if (!E) return;
    try { sync(); aplicar(E, muestrear(), 1); } catch (e) {}
  }
  function sync() { if (!E) return; E.muted = (typeof isSoundMuted !== 'undefined') && isSoundMuted; try { E.master.gain.setTargetAtTime(E.muted ? 0 : 1, E.ctx.currentTime, 0.08); } catch (e) {} }
  function evento(tipo) {
    if (!E || E.muted || E.ctx.state !== 'running') return;
    const t = E.ctx.currentTime + 0.01;
    try {
      if (tipo === 'bell') { campana(E, t, 1318, 0.05, 1.4, E.sfx); campana(E, t + 0.16, 1760, 0.035, 1.2, E.sfx); }        // campanilla de la puerta
      else if (tipo === 'lost' || tipo === 'fail') { golpe(E, t, 0.28); E.estres = Math.min(1, E.estres + 0.45); E.amb.gain.setTargetAtTime(BUS_BASE.amb * E.vol.amb * 0.4, E.ctx.currentTime, 0.05); E.amb.gain.setTargetAtTime(BUS_BASE.amb * E.vol.amb, E.ctx.currentTime + 1.4, 0.6); }
      else if (tipo === 'burn') E.estres = Math.min(1, E.estres + 0.35);
      else if (tipo === 'error' || tipo === 'wrong') E.estres = Math.min(1, E.estres + 0.06);
      else if (tipo === 'serve' || tipo === 'win') { campana(E, t, 880, 0.03, 1.2, E.sfx); E.estres = Math.max(0, E.estres - 0.3); E.T = Math.max(0, E.T - 0.1); }
    } catch (e) {}
  }
  function volumen(bus, v) {
    if (!E || !E.vol.hasOwnProperty(bus)) return; E.vol[bus] = clamp(+v, 0, 1); store.set(VOL_KEY, JSON.stringify(E.vol));
    E[bus].gain.setTargetAtTime(BUS_BASE[bus] * E.vol[bus], E.ctx.currentTime, 0.05);
  }
  // Panel de volumen (Ajustes → Sonido y Música): efectos, ambiente y música por separado, y silenciar todo
  let panelCss = false;
  function panel() {
    try { initAudio(); } catch (e) {}
    if (!panelCss) { panelCss = true; const st = document.createElement('style'); st.textContent = `
      .aud-ov { position: fixed; inset: 0; z-index: 9300; background: rgba(12,6,3,.82); display: flex; align-items: center; justify-content: center; padding: 8px; box-sizing: border-box; font-family: 'Fredoka', 'Fredoka One', system-ui, sans-serif; color: #ffe9b0; }
      .aud-card { width: min(420px, 100%); max-height: 96vh; overflow-y: auto; background: linear-gradient(#4a2a14, #2b1810); border: 3px solid #1a0e07; outline: 2px solid #ffb300; border-radius: 16px; padding: 12px 16px 14px; box-shadow: 0 10px 30px rgba(0,0,0,.6); }
      .aud-card h2 { margin: 0 0 8px; font: 400 20px 'Fredoka One', cursive, system-ui; color: #fff3d0; }
      .aud-row { display: flex; align-items: center; gap: 10px; margin: 8px 0; } .aud-row label { width: 92px; font-weight: 800; font-size: 13px; } .aud-row input { flex: 1; accent-color: #ffb300; height: 26px; } .aud-row b { width: 38px; text-align: right; font-size: 12px; color: #ffd978; }
      .aud-btns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; flex-wrap: wrap; }
      .aud-btn { background: linear-gradient(#ffb300, #ff8f00); color: #2b1810; border: 2px solid #2b1810; border-radius: 10px; padding: 6px 14px; font: 400 13px 'Fredoka One', cursive, system-ui; cursor: pointer; box-shadow: 0 2px 0 #8a4b00; }
      .aud-btn.sec { background: linear-gradient(#5b3a22, #3b2415); color: #ffe9b0; box-shadow: 0 2px 0 #1a0e07; }
      .aud-hint { font-size: 11px; color: #c9a77e; margin-top: 4px; }`; document.head.appendChild(st); }
    const old = document.getElementById('aud-ov'); if (old) old.remove();
    const ov = document.createElement('div'); ov.className = 'aud-ov'; ov.id = 'aud-ov';
    setTimeout(() => {
      const v = (E && E.vol) || { sfx: 1, amb: 1, mus: 1 }, fila = (k, n) => '<div class="aud-row"><label>' + n + '</label><input type="range" min="0" max="100" value="' + Math.round(v[k] * 100) + '" data-b="' + k + '"><b>' + Math.round(v[k] * 100) + '</b></div>';
      const muted = (typeof isSoundMuted !== 'undefined') && isSoundMuted;
      ov.innerHTML = '<div class="aud-card"><h2>🔊 Sonido y música</h2>' + fila('sfx', '🥢 Efectos') + fila('amb', '🍲 Ambiente') + fila('mus', '🎵 Música')
        + '<div class="aud-hint">El ambiente y la música cambian con la paciencia de los clientes y la dificultad del nivel.</div>'
        + '<div class="aud-btns"><button class="aud-btn sec" data-a="mute">' + (muted ? '🔇 Sonido apagado' : '🔊 Sonido activo') + '</button><button class="aud-btn sec" data-a="test">🔔 Probar</button><button class="aud-btn" data-a="ok">Listo</button></div></div>';
      document.body.appendChild(ov);
      ov.addEventListener('input', e => { const r = e.target.closest('input[data-b]'); if (!r) return; r.nextElementSibling.textContent = r.value; volumen(r.dataset.b, r.value / 100); });
      ov.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) { if (e.target === ov) ov.remove(); return; }
        if (b.dataset.a === 'ok') ov.remove();
        else if (b.dataset.a === 'test') { try { playSound('bell'); playSound('serve'); } catch (er) {} }
        else if (b.dataset.a === 'mute') { toggleAudioMute(); b.textContent = isSoundMuted ? '🔇 Sonido apagado' : '🔊 Sonido activo'; }
      });
    }, 80);
  }
  function detener() { if (!E) return; try { clearInterval(E.timer); clearInterval(E.pump); E.fuentes.forEach(s => { try { s.stop(); } catch (e) {} }); E.master.disconnect(); } catch (e) {} E = null; }

  // Medición offline (pruebas): renderiza `seg` segundos de un modo con una tensión forzada y devuelve pico y RMS en dBFS tras el limitador.
  async function medir(opt) {
    opt = Object.assign({ modo: 'campana', arco: 'ramen', T: 0.2, n: 2, minPat: 0.8, seg: 6 }, opt || {});
    const sr = 44100, oc = new OfflineAudioContext(2, sr * opt.seg, sr), eng = crear(oc, { offline: true });
    eng.T = opt.T; aplicar(eng, { modo: opt.modo, arco: opt.arco, T: opt.T, n: opt.n, minPat: opt.minPat }, 100); eng.T = opt.T;
    // en offline no hay reloj: las capas continuas se fijan ya y los sonidos puntuales se programan en bloque
    Object.keys(eng.capas).forEach(k => { const c = eng.capas[k]; if (c.g) { const gan = GAN[k]; c.g.gain.value = eng.s[k] * gan; } });
    pump(eng, opt.seg, 0);
    const buf = await oc.startRendering(), ch = [buf.getChannelData(0), buf.getChannelData(1)]; let pico = 0, sum = 0, n = 0;
    ch.forEach(d => { for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pico) pico = a; sum += d[i] * d[i]; n++; } });
    const db = v => (v > 0 ? 20 * Math.log10(v) : -120);
    return { modo: opt.modo, T: opt.T, picoDb: +db(pico).toFixed(1), rmsDb: +db(Math.sqrt(sum / n)).toFixed(1), vocesProgramadas: (eng.v || []).length };
  }

  // ---------- enganche con el resto del juego (sin editar los otros archivos) ----------
  try {
    if (typeof playSound === 'function') { const _ps = playSound; playSound = function (tipo) { const r = _ps.apply(this, arguments); try { evento(tipo); } catch (e) {} return r; }; }
    if (typeof toggleAudioMute === 'function') { const _tm = toggleAudioMute; toggleAudioMute = function () { const r = _tm.apply(this, arguments); sync(); return r; }; }
  } catch (e) {}
  document.addEventListener('visibilitychange', () => { if (!E) return; try { if (document.hidden) E.ctx.suspend(); else if (!E.muted) E.ctx.resume(); } catch (e) {} });

  window.Ambiente = { panel, conectar, actualizar, evento, volumen, sync, medir, detener, estado: () => (E ? { modo: E.modo, arco: E.arco, T: +E.T.toFixed(2), Tobj: +E.Tobj.toFixed(2), n: E.n, minPat: +E.minPat.toFixed(2), vol: E.vol, voces: (E.v || []).filter(x => x.t0 <= E.ctx.currentTime && x.t1 >= E.ctx.currentTime).length, capas: E.s, estres: +E.estres.toFixed(2), ctx: E.ctx.state } : null) };
})();
