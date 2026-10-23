/* =============================================================================
   하울링 제어 훈련 (2026-10-22) — index.html 의 #tabFeedback > #fbtRoot 에 그림
   4가지 화면: 원리 보기 · 링아웃 연습 · 예배 중 돌발 대응 · 귀로 주파수 맞히기
   - 진짜 웹 오디오 피드백 루프는 만들지 않아요. 울림은 사인파 하나(+아주 작은 2배음)로 합성하고
     부드럽게 켜고 끄며(≥120 ms), 최대 −18 dBFS 로 묶은 뒤 「전체 소리 크기」 → 리미터(컴프레서)를 지나요.
   - 모델 숫자는 모두 「교육용 근사」 예요.
   - 테스트용: window.FBTrainer = { state(), set(obj), mode(name), stop(), ff(kind) }
   - 진도: localStorage 'soundTrainerFeedback_v1'
   ============================================================================= */
(function () {
  'use strict';
  if (window.FBTrainer) return;

  /* ------------------------------------------------------------------ 상수 · 모델 */
  var BANDS = [125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000];
  var NB = BANDS.length;
  var CAP_DB = -18, CAP = Math.pow(10, CAP_DB / 20);   // 울림 소리 최대(마스터 볼륨 전)
  var OVERLAP = 0.35;                                  // 1/3옥타브 GEQ 필터가 옆 칸에 미치는 정도(교육용 근사)
  var K = 12;                                          // 루프 이득 기준값: 처음(AUX −10 dB, 옆 90°, EQ 평평) 여유 ≈ 4 dB
  var START_SEND = -10, START_PLACE = 90;
  var LS_KEY = 'soundTrainerFeedback_v1';
  var STEM_KEY = 'leadVox:20.5:80.5';                 // eq.js · gate.js 와 같은 구간 · 같은 캐시
  var PLACES = [
    { deg: 45, name: '앞쪽 비스듬히', short: '앞 45°' },
    { deg: 90, name: '옆', short: '옆 90°' },
    { deg: 135, name: '뒤쪽 비스듬히', short: '뒤 135°' },
    { deg: 180, name: '바로 뒤', short: '뒤 180°' }
  ];
  var TASKS = [
    { id: 'ro1', mode: 'ringout', t: '첫 하울링 주파수 찾아 3 dB 이상 깎기', d: 'AUX 를 천천히 올려 처음 울린 대역을 GEQ 에서 3 dB 이상 깎아요.' },
    { id: 'ro2', mode: 'ringout', t: '하울링 여유 +6 dB 더 확보하기', d: '처음(EQ 평평)보다 여유를 6 dB 이상 늘려요. 깎는 대역은 4개까지만.' },
    { id: 'ro3', mode: 'ringout', t: '모니터를 마이크 뒤로 옮기기', d: 'AUX 를 올려 하울링 직전(여유 3 dB 미만)까지 간 뒤, 모니터를 마이크 바로 뒤로 옮겨 여유가 크게 느는 걸 확인해요.' },
    { id: 'ro4', mode: 'ringout', t: '필요 없는 대역은 깎지 않기', d: '여유 +6 dB 를 얻으면서, 울림과 상관없는 대역을 3 dB 이상 깎은 곳은 1개 이하로.' },
    { id: 'em', mode: 'emerg', t: '예배 중 돌발 하울링 5라운드', d: '5라운드 중 4번 이상 방금 올린 페이더·센드를 내려서 해결하고, MAIN 은 한 번도 내리지 않기.' },
    { id: 'ear', mode: 'ear', t: '귀로 주파수 맞히기 8 / 10', d: '10문제 중 8개 이상을 ±1칸 안으로 맞혀요.' }
  ];
  var MODES = [['theory', '원리 보기'], ['ringout', '링아웃 연습'], ['emerg', '예배 중 돌발 대응'], ['ear', '귀로 주파수 맞히기']];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function lin(db) { return Math.pow(10, db / 20); }
  function fmtHz(f) { return f >= 1000 ? String(f / 1000) + 'k' : String(f); }
  function fmtHzL(f) { return f >= 1000 ? String(f / 1000) + ' kHz' : f + ' Hz'; }
  function sdb(v, d) { d = d == null ? 1 : d; var r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d); if (r === 0) return '0 dB'; return (r > 0 ? '+' : '−') + Math.abs(r).toFixed(d) + ' dB'; }
  function sint(v) { v = Math.round(v); return v === 0 ? '0' : (v > 0 ? '+' : '−') + Math.abs(v); }
  function placeDb(deg) { var v = 0.5 + 0.5 * Math.cos(deg * Math.PI / 180); return Math.max(-18, 20 * Math.log10(Math.max(v, 1e-9))); }
  function placeOf(deg) { for (var i = 0; i < PLACES.length; i++) if (PLACES[i].deg === deg) return PLACES[i]; return PLACES[1]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function now() { return performance.now() / 1000; }

  /* ------------------------------------------------------------------ 진도 저장 */
  var done = {};
  function loadDone() { try { var o = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); if (o && o.done && typeof o.done === 'object') done = o.done; } catch (e) { done = {}; } }
  function saveDone() { try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 1, done: done, t: Date.now() })); } catch (e) { /* 저장 못 해도 계속 */ } }
  function complete(id) { if (done[id]) return; done[id] = Date.now(); saveDone(); renderCheck(); toast('✅ 과제 완료: ' + TASKS.filter(function (t) { return t.id === id; })[0].t); }
  function allDone() { return TASKS.every(function (t) { return !!done[t.id]; }); }

  /* ------------------------------------------------------------------ 상태 */
  var S = { mode: 'theory', vol: 35, analyzer: true, sound: false, active: false, built: false };
  var RO = { send: START_SEND, place: START_PLACE, geq: zeros(), peaks: [], R: [], ring: { on: false, band: -1, db: -30, t: 0, edge: false, edgeBand: -1 }, firstRing: null, lastMove: null };
  var CHS = [
    { name: '설교(강대상)', mon: '강대상 모니터', fader: 0, send: -12 },
    { name: '찬양 보컬 1', mon: '보컬 1 모니터', fader: -3, send: -6 },
    { name: '찬양 보컬 2', mon: '보컬 2 모니터', fader: -3, send: -6 },
    { name: '성가대', mon: '성가대 모니터', fader: -6, send: -12 }
  ];
  var EM = { status: 'idle', plan: [], rounds: [], cur: null, ch: [], main: 0, ring: { db: -30, on: false }, msg: '' };
  var EAR = { q: 0, target: 0, heard: false, answered: false, results: [], compare: false, mix: true, last: null, playing: false };
  function zeros() { var a = []; for (var i = 0; i < NB; i++) a.push(0); return a; }

  /* ---------- 링아웃 모델 (교육용 근사) */
  function makeScenario(peaksIn) {
    var peaks, i;
    if (peaksIn && peaksIn.length) peaks = peaksIn.map(function (p) { return { i: p[0], h: p[1] }; });
    else {
      var n = Math.random() < 0.5 ? 3 : 4, H = [0, -2, -4, -5], idx = [], guard = 0;
      while (idx.length < n && guard++ < 1000) { var c = Math.floor(Math.random() * NB); if (idx.every(function (j) { return Math.abs(j - c) >= 3; })) idx.push(c); }
      peaks = idx.map(function (b, k) { return { i: b, h: H[k] }; });
    }
    var ph = rnd(0, 6.28), R = [];
    for (i = 0; i < NB; i++) R.push(-9.5 + 1.2 * Math.sin(i * 0.75 + ph) + rnd(-0.4, 0.4));   // 고르지 않은 바탕 (최대 ≈ −7.9)
    peaks.forEach(function (p) { [p.i - 1, p.i + 1].forEach(function (j) { if (j >= 0 && j < NB) R[j] = Math.max(R[j], p.h - 6); }); });
    peaks.forEach(function (p) { R[p.i] = p.h; });
    return { peaks: peaks, R: R };
  }
  function effCut(geq, i) { return geq[i] + OVERLAP * ((geq[i - 1] || 0) + (geq[i + 1] || 0)); }
  function loopArr(geq, place, send) {
    var p = placeDb(place == null ? RO.place : place), s = send == null ? RO.send : send, g = geq || RO.geq, out = [];
    for (var i = 0; i < NB; i++) out.push(s + RO.R[i] + p - effCut(g, i) + K);
    return out;
  }
  function maxOf(a) { var v = -Infinity, k = -1; for (var i = 0; i < a.length; i++) if (a[i] > v) { v = a[i]; k = i; } return { v: v, i: k }; }
  function nearPeak(i) { return RO.peaks.some(function (p) { return Math.abs(p.i - i) <= 1; }); }
  function roStats() {
    var L = loopArr(), m = maxOf(L), mf = maxOf(loopArr(zeros())), cut = 0, waste = 0;
    for (var i = 0; i < NB; i++) { if (RO.geq[i] >= 1) cut++; if (RO.geq[i] >= 3 && !nearPeak(i)) waste++; }
    return { L: L, maxL: m.v, worst: m.i, margin: -m.v, eqGain: mf.v - m.v, cutBands: cut, waste: waste };
  }
  function newScenario(peaksIn) {
    var sc = makeScenario(peaksIn);
    RO.peaks = sc.peaks; RO.R = sc.R; RO.send = START_SEND; RO.place = START_PLACE; RO.geq = zeros();
    RO.ring = { on: false, band: -1, db: -30, t: 0, edge: false, edgeBand: -1 }; RO.firstRing = null; RO.lastMove = null;
  }
  newScenario();

  /* ------------------------------------------------------------------ 녹음 불러오기 */
  var STEM = null, stemTried = false;
  var CACHE = window.__staStemCache = window.__staStemCache || {};
  function b64ToBuf(uri) { var b = atob(uri.slice(uri.indexOf(',') + 1)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  function prepStem(st) {
    var d = st.data, pk = 0, i; for (i = 0; i < d.length; i++) { var a = Math.abs(d[i]); if (a > pk) pk = a; }
    var blk = Math.round(st.sr * 0.05), env = [], mx = 1e-9;
    for (i = 0; i + blk <= d.length; i += blk) { var s = 0; for (var k = 0; k < blk; k++) s += d[i + k] * d[i + k]; var r = Math.sqrt(s / blk); env.push(r); if (r > mx) mx = r; }
    STEM = { data: d, sr: st.sr, dur: st.dur, norm: pk > 0 ? 0.95 / pk : 1, env: env.map(function (v) { return v / mx; }), blk: 0.05 };
    if (S.sound && A.ctx) voxStart();
    updateSoundUI();
  }
  function loadStem() {
    if (STEM || stemTried) return; stemTried = true;
    if (CACHE[STEM_KEY]) { prepStem(CACHE[STEM_KEY]); return; }
    var uri = window.MG12XU_SOURCE_AUDIO_BASE64 && window.MG12XU_SOURCE_AUDIO_BASE64.leadVox, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!uri || !OAC) { updateSoundUI(); return; }
    try {
      var oc = new OAC(1, 2, 44100);
      var pr = oc.decodeAudioData(b64ToBuf(uri), function (buf) {
        var sr = buf.sampleRate, s0 = Math.min(buf.length - 1, Math.round(20.5 * sr)), s1 = Math.min(buf.length, Math.round(80.5 * sr)), n = s1 - s0, out = new Float32Array(n), k, i;
        for (k = 0; k < buf.numberOfChannels; k++) { var ch = buf.getChannelData(k); for (i = 0; i < n; i++) out[i] += ch[s0 + i] / buf.numberOfChannels; }
        var fade = Math.min(n >> 1, Math.round(sr * 0.02)); for (i = 0; i < fade; i++) { var w = i / fade; out[i] *= w; out[n - 1 - i] *= w; }
        var v = { data: out, sr: sr, dur: n / sr }; CACHE[STEM_KEY] = v; prepStem(v);
      }, function () { updateSoundUI(); });
      if (pr && pr.catch) pr.catch(function () { /* 콜백에서 처리 */ });
    } catch (e) { updateSoundUI(); }
  }

  /* ------------------------------------------------------------------ 오디오 엔진 (진짜 피드백 루프 없음) */
  var A = blankA(), lastCtx = null;
  function blankA() { return { ctx: null, master: null, comp: null, toneBus: null, ana: null, anaBuf: null, eq: [], voxIn: null, voxGain: null, vox: null, voxT0: 0, voxBuf: null, rings: {}, peakNow: 0, peakMax: 0, toneTarget: 0 }; }
  function masterGain() { return 1.4 * S.vol / 100; }
  function ensureCtx() {
    if (A.ctx && A.ctx.state !== 'closed') { if (A.ctx.state === 'suspended' && A.ctx.resume) A.ctx.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    var c; try { c = new AC(); } catch (e) { return false; }
    A = blankA(); A.ctx = c; lastCtx = c;
    A.comp = c.createDynamicsCompressor();   // 리미터처럼: 갑자기 커져도 귀를 보호
    A.comp.threshold.value = -10; A.comp.knee.value = 0; A.comp.ratio.value = 20; A.comp.attack.value = 0.003; A.comp.release.value = 0.25;
    A.master = c.createGain(); A.master.gain.value = masterGain(); A.master.connect(A.comp); A.comp.connect(c.destination);
    A.toneBus = c.createGain(); A.toneBus.gain.value = CAP; A.ana = c.createAnalyser(); A.ana.fftSize = 2048; A.anaBuf = new Float32Array(A.ana.fftSize);
    A.toneBus.connect(A.ana); A.toneBus.connect(A.master);
    A.voxIn = c.createGain(); A.voxGain = c.createGain(); A.voxGain.gain.value = 0;
    var prev = A.voxIn;
    A.eq = BANDS.map(function (f) { var b = c.createBiquadFilter(); b.type = 'peaking'; b.frequency.value = f; b.Q.value = 4.32; b.gain.value = 0; prev.connect(b); prev = b; return b; });
    prev.connect(A.voxGain); A.voxGain.connect(A.master);
    if (c.resume) c.resume();
    applyEqAudio();
    return true;
  }
  function voxStart() {
    if (!A.ctx || !STEM || A.vox) return;
    var c = A.ctx;
    if (!A.voxBuf) { A.voxBuf = c.createBuffer(1, STEM.data.length, STEM.sr); A.voxBuf.getChannelData(0).set(STEM.data); }
    var src = c.createBufferSource(); src.buffer = A.voxBuf; src.loop = true; src.connect(A.voxIn);
    var t0 = c.currentTime + 0.03; src.start(t0); A.vox = src; A.voxT0 = t0;
  }
  function voxEnvNow() {
    if (!A.vox || !STEM) return 0;
    var pos = ((A.ctx.currentTime - A.voxT0) % STEM.dur + STEM.dur) % STEM.dur, k = Math.floor(pos / STEM.blk);
    return STEM.env[Math.min(STEM.env.length - 1, k)] || 0;
  }
  function setVox(db) {   // db: 정규화한 녹음 최대값 기준
    if (!A.ctx || !A.voxGain) return;
    var g = db <= -60 ? 0 : lin(db) * (STEM ? STEM.norm : 1);
    A.voxGain.gain.setTargetAtTime(g, A.ctx.currentTime, 0.08);
  }
  function applyEqAudio() {
    if (!A.ctx) return; var t = A.ctx.currentTime;
    A.eq.forEach(function (b, i) { b.gain.setTargetAtTime(S.mode === 'ringout' ? -RO.geq[i] : 0, t, 0.03); });
  }
  // 울림 한 줄(사인 + 작은 2배음). amp 는 0..1 (1 = −18 dBFS 상한)
  function ringSet(key, f, amp) {
    if (!A.ctx) return;
    var c = A.ctx, v = A.rings[key];
    if (v && f && Math.abs(v.f - f) > 0.5) { ringKill(key); v = null; }
    if (!v) {
      if (!f || amp <= 0) return;
      v = { f: f, g: c.createGain(), o1: c.createOscillator(), o2: c.createOscillator(), g1: c.createGain(), g2: c.createGain(), amp: 0 };
      v.o1.type = 'sine'; v.o2.type = 'sine'; v.o1.frequency.value = f; v.o2.frequency.value = 2 * f;
      v.g1.gain.value = 1 / 1.06; v.g2.gain.value = 0.06 / 1.06;   // 합쳐도 최대 1
      v.g.gain.value = 0; v.o1.connect(v.g1); v.o2.connect(v.g2); v.g1.connect(v.g); v.g2.connect(v.g); v.g.connect(A.toneBus);
      v.o1.start(); v.o2.start(); A.rings[key] = v;
    }
    v.amp = clamp(amp || 0, 0, 1);
    v.g.gain.setTargetAtTime(v.amp, c.currentTime, 0.07);   // 10→90 % ≈ 150 ms: 부드럽게 켜고 끔
  }
  function ringKill(key) {
    var v = A.rings[key]; if (!v || !A.ctx) return; delete A.rings[key];
    var t = A.ctx.currentTime; v.g.gain.setTargetAtTime(0, t, 0.06);
    try { v.o1.stop(t + 0.6); v.o2.stop(t + 0.6); } catch (e) { /* 이미 멈춤 */ }
    setTimeout(function () { try { v.g.disconnect(); } catch (e) { /* 무시 */ } }, 800);
  }
  function oneTone(f, dur, amp, withVox) {   // 귀 훈련용 짧은 소리
    if (!ensureCtx()) return false;
    var c = A.ctx, t = c.currentTime + 0.02, g = c.createGain(), o = c.createOscillator();
    o.type = 'sine'; o.frequency.value = f; g.gain.value = 0;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.15); g.gain.setValueAtTime(amp, t + dur - 0.3); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(A.toneBus); o.start(t); o.stop(t + dur + 0.05);
    A.toneTarget = amp; setTimeout(function () { A.toneTarget = 0; try { g.disconnect(); } catch (e) { /* 무시 */ } }, (dur + 0.2) * 1000);
    if (withVox && STEM) {
      voxStart(); var vg = A.voxGain.gain, n = lin(-22) * STEM.norm;
      vg.cancelScheduledValues(t); vg.setValueAtTime(vg.value, t); vg.linearRampToValueAtTime(n, t + 0.2); vg.setValueAtTime(n, t + dur - 0.3); vg.linearRampToValueAtTime(0, t + dur + 0.1);
    }
    return true;
  }
  function measureTone() {
    if (!A.ctx || !A.ana || A.ctx.state !== 'running') { A.peakNow = 0; return; }
    A.ana.getFloatTimeDomainData(A.anaBuf); var m = 0;
    for (var i = 0; i < A.anaBuf.length; i++) { var a = Math.abs(A.anaBuf[i]); if (a > m) m = a; }
    A.peakNow = m; if (m > A.peakMax) A.peakMax = m;
  }
  function silenceAll() {   // 컨텍스트는 두고 소리만 끔(화면 전환)
    if (!A.ctx) return;
    Object.keys(A.rings).forEach(ringKill);
    if (A.voxGain) { A.voxGain.gain.cancelScheduledValues(A.ctx.currentTime); A.voxGain.gain.setTargetAtTime(0, A.ctx.currentTime, 0.05); }
  }
  function stopAudio() {
    var c = A.ctx; if (!c) return;
    silenceAll();
    var vox = A.vox; A = blankA();
    setTimeout(function () { try { if (vox) vox.stop(); } catch (e) { /* 무시 */ } try { if (c.state !== 'closed') c.close(); } catch (e) { /* 무시 */ } }, 220);
  }
  function audioNodes() { if (!A.ctx) return 0; return 6 + A.eq.length + Object.keys(A.rings).length * 5 + (A.vox ? 1 : 0); }

  /* ------------------------------------------------------------------ 타이머 */
  var tickId = null, lastT = 0;
  function needTick() { return S.active && (S.mode === 'ringout' || S.mode === 'emerg'); }
  function ensureTick() { if (needTick() && !tickId) { lastT = now(); tickId = setInterval(tick, 60); } else if (!needTick() && tickId) { clearInterval(tickId); tickId = null; } }
  function tick() {
    var t = now(), dt = Math.min(0.25, Math.max(0, t - lastT)); lastT = t;
    try { if (S.mode === 'ringout') roTick(dt); else if (S.mode === 'emerg') emTick(t, dt); measureTone(); } catch (e) { if (window.console) console.warn('[FBTrainer]', e); }
  }

  /* ------------------------------------------------------------------ 링아웃: 시간에 따라 */
  function roTick(dt) {
    var st = roStats(), r = RO.ring;
    if (st.maxL > 0) {
      if (!r.on || r.band !== st.worst) { r.on = true; r.band = st.worst; r.db = -30; r.t = 0; }
      r.db = Math.min(0, r.db + (3 + 4 * st.maxL) * dt); r.t += dt;
      if (r.t >= 0.25 && RO.firstRing == null) RO.firstRing = r.band;
    } else { r.on = false; r.band = -1; r.db = -30; r.t = 0; }
    r.edge = st.maxL > -3 && st.maxL <= 0; r.edgeBand = r.edge ? st.worst : -1;
    if (A.ctx && S.sound) {
      if (r.on) ringSet('ro', BANDS[r.band], lin(r.db));
      else if (r.edge && A.vox) ringSet('ro', BANDS[r.edgeBand], voxEnvNow() * lin(-20 + 10 * st.maxL / 3));   // 목소리를 따라 살짝 남는 울림
      else ringSet('ro', null, 0);
      setVox(clamp(-4 + 0.6 * RO.send, -40, -1));
    }
    roCheck(st); roUI(st);
  }
  function roCheck(st) {
    st = st || roStats();
    if (RO.firstRing != null && RO.geq[RO.firstRing] >= 3) complete('ro1');
    if (st.eqGain >= 6 - 1e-6 && st.cutBands <= 4) complete('ro2');
    if (st.eqGain >= 6 - 1e-6 && st.waste <= 1) complete('ro4');
  }
  function setPlace(deg) {
    deg = +deg; if (!PLACES.some(function (p) { return p.deg === deg; }) || deg === RO.place) return;
    var before = roStats().margin, old = RO.place; RO.place = deg; var after = roStats().margin;
    RO.lastMove = { from: old, to: deg, before: before, after: after, pushed: RO.send > START_SEND };
    if (deg === 180 && old !== 180 && before < 3 && after - before >= 10 && RO.send > START_SEND) complete('ro3');
    roRender(); roCheck();
  }
  function setSend(v) { RO.send = clamp(Math.round(+v), -30, 10); roCheck(); roUI(); }
  function setGeq(i, v) { RO.geq[i] = clamp(Math.round(+v), 0, 12); applyEqAudio(); roCheck(); roUI(); }

  /* ------------------------------------------------------------------ 예배 중 돌발 대응 */
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function emPlan() {
    var paths = shuffle(['mon', 'mon', 'main', 'main', Math.random() < 0.5 ? 'mon' : 'main']), lastCh = -1;
    return paths.map(function (p) {
      var pool = p === 'mon' ? [1, 2, 3, 0, 1, 2] : [0, 0, 3, 1, 2], ch; do { ch = pool[Math.floor(Math.random() * pool.length)]; } while (ch === lastCh);
      lastCh = ch;
      return { path: p, ch: ch, d: rint(4, 6), delay: rnd(1.0, 2.0), band: p === 'mon' ? rint(9, 15) : rint(3, 8) };
    });
  }
  function emResetConsole() { EM.ch = CHS.map(function (c) { return { fader: c.fader, send: c.send, mute: false }; }); EM.main = 0; }
  emResetConsole();
  function emReset() { EM.status = 'idle'; EM.plan = emPlan(); EM.rounds = []; EM.cur = null; EM.msg = ''; emResetConsole(); emRingOff(); }
  function emStartRound() {
    if (EM.rounds.length >= 5) return;
    if (!EM.plan.length) EM.plan = emPlan();
    var p = EM.plan[EM.rounds.length]; emResetConsole();
    var c = EM.ch[p.ch], key = p.path === 'mon' ? 'send' : 'fader', base = c[key];
    c[key] = clamp(base + p.d, -30, 10);
    EM.cur = { path: p.path, ch: p.ch, d: p.d, band: p.band, key: key, raised: c[key], t0: now(), howlAt: now() + p.delay, howlStart: null, mainPulled: false, wrong: 0 };
    EM.status = 'announce'; EM.msg = ''; EM.ring = { db: -30, on: false };
    emRender();
  }
  function emL() {
    var cur = EM.cur; if (!cur) return -99; var c = EM.ch[cur.ch];
    if (c.mute) return -99;
    var L = 2.5 + (c[cur.key] - cur.raised);
    if (cur.path === 'main') L += EM.main;   // 메인 경로만 MAIN 의 영향을 받아요 (모니터 AUX 는 보통 프리 페이더)
    return L;
  }
  function emRingOff() { EM.ring = { db: -30, on: false }; if (A.ctx) ringSet('em', null, 0); }
  function emFinish(outcome) {
    var cur = EM.cur, t = now();
    var rec = { path: cur.path, ch: cur.ch, d: cur.d, band: cur.band, outcome: outcome, rt: cur.howlStart != null && outcome !== 'early' && outcome !== 'late' ? t - cur.howlStart : null, wrong: cur.wrong, mainPulled: cur.mainPulled };
    EM.rounds.push(rec); EM.cur = null; emRingOff();
    EM.status = EM.rounds.length >= 5 ? 'done' : 'result';
    EM.msg = emOutcomeText(rec);
    if (outcome === 'late') emResetConsole();
    if (EM.status === 'done') { var s = emSummary(); if (s.ok >= 4 && s.main === 0) complete('em'); }
    emRender();
  }
  function emSummary() { var s = { ok: 0, mute: 0, main: 0, late: 0, early: 0, n: EM.rounds.length }; EM.rounds.forEach(function (r) { s[r.outcome] = (s[r.outcome] || 0) + 1; }); return s; }
  function ctlName(path, ch) { return path === 'mon' ? CHS[ch].name + ' 모니터 센드(MON)' : CHS[ch].name + ' 페이더'; }
  function emOutcomeText(r) {
    var c = ctlName(r.path, r.ch), rt = r.rt != null ? r.rt.toFixed(1) + '초' : '', extra = r.wrong ? ' (다른 조작 ' + r.wrong + '번은 효과가 없었어요.)' : '';
    if (r.outcome === 'ok') return '✅ 정답! ' + rt + ' 만에 방금 올린 ' + c + '를 내려서 하울링이 멈췄어요. 소리도 그대로 살아 있어요.' + extra;
    if (r.outcome === 'mute') return '⚠️ 하울링은 멈췄지만 ' + CHS[r.ch].name + ' 소리가 끊겼어요 — 뮤트는 최후 수단이에요. 방금 올린 ' + c + '를 3 dB 쯤 내리면 소리를 살리면서 멈출 수 있어요.' + extra;
    if (r.outcome === 'main') return '❌ MAIN 을 내려서 설교·찬양 모두 끊겼어요. 회중 전체가 소리를 잃어요.' + (r.path === 'mon' ? ' 게다가 모니터 하울링은 MAIN 과 따로 가서(AUX 는 보통 프리 페이더) MAIN 으로는 멈추지 않아요.' : '') + ' 방금 올린 ' + c + '부터 내려요.';
    if (r.outcome === 'late') return '⏰ 8초가 지나 선배가 대신 내렸어요. 하울링이 나면 「방금 바뀐 것」을 바로 떠올려 그 페이더를 3 dB 이상 내려요.';
    return '하울링이 나기 전에 되돌렸어요. 이번 훈련은 하울링이 났을 때 반응하는 연습이라 정답으로 세지 않아요.';
  }
  function emInput(kind, ch, val) {
    var cur = EM.cur, prevMain = EM.main;
    if (kind === 'main') EM.main = clamp(Math.round(+val), -30, 10);
    else if (kind === 'mute') EM.ch[ch].mute = val == null ? !EM.ch[ch].mute : !!val;
    else EM.ch[ch][kind] = clamp(Math.round(+val), -30, 10);
    if (cur && (EM.status === 'announce' || EM.status === 'howl')) {
      var isPath = kind === cur.key && ch === cur.ch;
      if (EM.status === 'announce') { if (isPath && EM.ch[ch][kind] - cur.raised <= -3) emFinish('early'); else emUI(); return; }
      if (EM.main <= -3) cur.mainPulled = true;
      var helps = isPath || (kind === 'mute' && ch === cur.ch) || (kind === 'main' && cur.path === 'main');
      if (!helps && !(kind === 'main' && EM.main >= prevMain)) cur.wrong++;
      if (emL() <= 0) { emFinish(cur.mainPulled ? 'main' : EM.ch[cur.ch].mute ? 'mute' : 'ok'); return; }
      if (kind === 'main' && cur.path === 'mon' && cur.mainPulled) EM.msg = 'MAIN 을 내렸지만 무대 쪽 하울링은 그대로예요 — 그리고 회중석 소리는 끊겼어요.';
    }
    emUI();
  }
  function emTick(t, dt) {
    var cur = EM.cur;
    if (EM.status === 'announce' && cur && t >= cur.howlAt) { EM.status = 'howl'; cur.howlStart = t; EM.ring = { db: -30, on: true }; emRender(); }
    if (EM.status === 'howl' && cur) {
      var L = emL();
      if (L > 0) { EM.ring.on = true; EM.ring.db = Math.min(0, EM.ring.db + (3 + 4 * L) * dt); } else { EM.ring.on = false; EM.ring.db = -30; }
      if (t - cur.howlStart > 8) { emFinish('late'); return; }
    }
    if (A.ctx && S.sound) {
      if (EM.ring.on && cur) ringSet('em', BANDS[cur.band], lin(EM.ring.db)); else ringSet('em', null, 0);
      setVox(clamp(-10 + EM.main, -60, -1));
    }
    emUI();
  }

  /* ------------------------------------------------------------------ 귀로 주파수 맞히기 */
  function earNew(reset) {
    if (reset) { EAR.q = 0; EAR.results = []; }
    var t; do { t = rint(0, NB - 1); } while (t === EAR.last); EAR.last = t;
    EAR.target = t; EAR.heard = false; EAR.answered = false;
  }
  earNew(true);
  function earScore() { var s = 0, ex = 0; EAR.results.forEach(function (r) { if (Math.abs(r.diff) <= 1) s++; if (r.diff === 0) ex++; }); return { within: s, exact: ex, n: EAR.results.length }; }
  function earPlayQ() {
    if (EAR.results.length >= 10) return;
    if (oneTone(BANDS[EAR.target], 1.5, 0.55, EAR.mix)) { EAR.heard = true; }
    else EAR.heard = true;   // 소리를 낼 수 없는 브라우저에서도 문제는 진행
    earUI();
  }
  function earPick(i) {
    if (EAR.compare) { oneTone(BANDS[i], 1.1, 0.55, false); earUI('비교: ' + fmtHzL(BANDS[i]) + ' 소리예요.'); return; }
    if (!EAR.heard || EAR.answered || EAR.results.length >= 10) return;
    var diff = i - EAR.target; EAR.results.push({ target: EAR.target, pick: i, diff: diff }); EAR.answered = true;
    if (EAR.results.length >= 10 && earScore().within >= 8) complete('ear');
    earRender();
  }

  /* ------------------------------------------------------------------ 화면 */
  var root = null, tabEl = null, toastT = null;
  function $(sel) { return root ? root.querySelector(sel) : null; }
  function setHtml(el, h) { if (el && el._fbtH !== h) { el._fbtH = h; el.innerHTML = h; } }
  function injectCss() {
    if (document.getElementById('fbt-css')) return;
    var st = document.createElement('style'); st.id = 'fbt-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  var CSS = [
    '.fbt{--fbt-red:#dc2626;--fbt-red-bg:#fef2f2;--fbt-amber:#d97706;--fbt-amber-bg:#fffbeb;--fbt-teal:#0e7490;display:flex;flex-direction:column;gap:12px;min-width:0;color:var(--sta-ink,#0f1f33)}',
    '.fbt *{box-sizing:border-box}',
    '.fbt .mod-tabs{margin-bottom:0;position:static}',
    '.fbt-check{border:1px solid var(--sta-line);border-radius:var(--sta-r,12px);background:var(--sta-surface,#fff);padding:10px 14px}',
    '.fbt-check summary{cursor:pointer;font-weight:800;font-size:.9rem;color:var(--sta-navy);display:flex;gap:8px;align-items:center;list-style:none}',
    '.fbt-check summary::-webkit-details-marker{display:none}',
    '.fbt-check summary::after{content:"⌄";margin-left:auto;color:#94a3b8}.fbt-check[open] summary::after{content:"⌃"}',
    '.fbt-check summary small{font-weight:700;color:#7a8aa0;font-variant-numeric:tabular-nums}',
    '.fbt-check ol{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:6px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}',
    '.fbt-check li{display:flex;gap:8px;align-items:flex-start;padding:7px 9px;border-radius:8px;background:#f8fafc;border:1px solid transparent}',
    '.fbt-check li.cur{border-color:#bfe3ea}',
    '.fbt-check li b{font-size:.82rem}.fbt-check li p{margin:2px 0 0;font-size:.74rem;line-height:1.5;color:var(--sta-ink-2,#334155);word-break:keep-all}',
    '.fbt-check li.done{background:var(--sta-ok-bg)}',
    '.fbt-ck{width:20px;height:20px;border-radius:50%;border:2px solid #cbd5e1;flex:none;display:grid;place-items:center;font-size:.72rem;font-weight:800;color:#fff;margin-top:1px}',
    '.fbt-check li.done .fbt-ck{background:#059669;border-color:#059669}',
    '.fbt-party{margin:10px 0 0;padding:10px 12px;border-radius:10px;background:var(--sta-ok-bg);border:1px solid var(--sta-ok-line);color:var(--sta-ok);font-weight:800;font-size:.88rem}',
    '.fbt-sound{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:10px 12px;border:1px solid var(--sta-line);border-radius:var(--sta-r,12px);background:#f8fafc}',
    '.fbt-sound[hidden]{display:none}',
    '.fbt-sound .sim-btn{font-size:.84rem;padding:8px 12px}',
    '.fbt-vol{display:flex;align-items:center;gap:8px;font-size:.8rem;font-weight:700;color:var(--sta-navy);flex:1 1 220px;min-width:0}',
    '.fbt-vol input{flex:1;min-width:80px;accent-color:var(--fbt-teal)}.fbt-vol b{font-variant-numeric:tabular-nums;min-width:3.2em;text-align:right}',
    '.fbt-sound__msg{font-size:.74rem;color:#64748b;flex:1 1 100%;margin:0}',
    '.fbt-note{font-size:.78rem;color:#8a5a00;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;margin:0;line-height:1.55;word-break:keep-all}',
    '.fbt-p{font-size:.9rem;line-height:1.75;margin:6px 0;word-break:keep-all}',
    '.fbt-h{margin:0 0 6px;font-size:1rem;color:var(--sta-navy)}',
    '.fbt-sec{border:1px solid var(--sta-line);border-radius:var(--sta-r,12px);background:var(--sta-surface,#fff);padding:14px 16px}',
    '.fbt-sec ul{margin:6px 0 0;padding-left:18px;display:grid;gap:6px;font-size:.86rem;line-height:1.65;word-break:keep-all}',
    '.fbt-sec li b{color:var(--sta-navy)}',
    '.fbt-theory{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:12px;align-items:start}',
    '.fbt-theory .fbt-sec.wide{grid-column:1/-1}',
    '.fbt-svg{display:block;width:100%;height:auto;max-width:520px;margin:4px auto 0}',
    '.fbt-bad li::marker{content:"✕  ";color:var(--fbt-red);font-weight:800}',
    '.fbt-good li::marker{content:"✓  ";color:#059669;font-weight:800}',
    '.fbt-src{font-size:.72rem;color:#64748b;margin:0;line-height:1.6;word-break:keep-all}.fbt-src a{color:inherit}',
    /* 링아웃 */
    '.fbt-ro{display:grid;grid-template-columns:270px minmax(0,1fr);gap:12px;align-items:start}',
    '.fbt-side{display:flex;flex-direction:column;gap:10px;min-width:0}',
    '.fbt-main{display:flex;flex-direction:column;gap:10px;min-width:0}',
    '.fbt-stepper{display:flex;gap:6px;margin-top:6px}.fbt-stepper .sim-btn{flex:1}',
    '.fbt-places{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}',
    '.fbt-places .sim-btn{padding:7px 6px}',
    '.fbt-place-svg{display:block;width:100%;max-width:200px;height:auto;margin:0 auto}',
    '.fbt-move{font-size:.74rem;color:var(--sta-ink-2,#334155);margin:6px 0 0;line-height:1.5;word-break:keep-all}',
    '.fbt-ring{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid var(--sta-ok-line);background:var(--sta-ok-bg);font-size:.86rem;font-weight:700;color:var(--sta-ok);min-height:46px;word-break:keep-all}',
    '.fbt-ring.edge{border-color:#fcd34d;background:var(--fbt-amber-bg);color:#92400e}',
    '.fbt-ring.howl{border-color:#fca5a5;background:var(--fbt-red-bg);color:#991b1b}',
    '.fbt-ring i{font-style:normal;font-size:1.2rem}',
    '.fbt-ring.howl i{animation:fbtPulse .7s ease-in-out infinite alternate}',
    '@keyframes fbtPulse{from{transform:scale(1)}to{transform:scale(1.25)}}',
    '.fbt-seg{display:inline-flex;border:1px solid var(--sta-line);border-radius:9px;overflow:hidden}',
    '.fbt-seg button{border:0;background:#fff;padding:7px 12px;font:inherit;font-size:.8rem;font-weight:700;color:#475569;cursor:pointer}',
    '.fbt-seg button[aria-pressed="true"]{background:var(--sta-navy);color:#fff}',
    '.fbt-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}',
    '.fbt-scroll{overflow-x:auto;max-width:100%;min-width:0;width:100%;-webkit-overflow-scrolling:touch;border:1px solid var(--sta-line);border-radius:10px;background:#fff}',
    '.fbt-geqbox{padding:8px 8px 6px;min-width:0}',
    '.fbt-g19{display:grid;grid-template-columns:repeat(19,minmax(0,1fr));gap:2px}',
    '.fbt-ana{position:relative;height:150px;margin-bottom:6px;background:linear-gradient(#fff,#f8fafc);border-bottom:1px solid #e2e8f0}',
    '.fbt-ana .fbt-g19{position:absolute;inset:0}',
    '.fbt-anacol{position:relative;height:100%}',
    '.fbt-anacol i{position:absolute;left:12%;right:12%;bottom:0;border-radius:3px 3px 0 0;background:#94a3b8;transition:height .12s linear}',
    '.fbt-anacol.edge i{background:#f59e0b}.fbt-anacol.hot i{background:#ef4444}',
    '.fbt-anacol.worst::after{content:"";position:absolute;inset:0 4%;border:2px solid #ef4444;border-radius:4px}',
    '.fbt-line{position:absolute;left:0;right:0;border-top:2px solid #ef4444;z-index:1;pointer-events:none}',
    '.fbt-line.warn{border-top:1px dashed #f59e0b}',
    '.fbt-line span{position:absolute;right:2px;top:-15px;font-size:.62rem;font-weight:800;color:#b91c1c;background:rgba(255,255,255,.85);padding:0 3px;border-radius:3px}',
    '.fbt-line.warn span{color:#92400e;top:1px}',
    '.fbt-ana.off .fbt-g19,.fbt-ana.off .fbt-line{visibility:hidden}',
    '.fbt-ana__off{display:none;position:absolute;inset:0;place-items:center;text-align:center;padding:10px;font-size:.8rem;color:#64748b;word-break:keep-all}',
    '.fbt-ana.off .fbt-ana__off{display:grid}',
    '.fbt-geqcol{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}',
    '.fbt-geqcol input[type=range]{writing-mode:vertical-lr;direction:ltr;width:22px;height:120px;margin:0;padding:0;accent-color:var(--fbt-teal);cursor:pointer}',
    '.fbt-geqcol b{font-size:.66rem;font-variant-numeric:tabular-nums;color:#475569}',
    '.fbt-geqcol b.cut{color:var(--fbt-red)}',
    '.fbt-geqcol span{font-size:.6rem;color:#64748b;white-space:nowrap}',
    '.fbt-geqcol.peakhint span{color:var(--sta-navy);font-weight:800}',
    '.fbt-swipe{display:none;font-size:.72rem;color:#64748b;margin:0}',
    '.fbt-how summary{cursor:pointer;font-size:.84rem;font-weight:800;color:#6d4fc2}',
    '.fbt-how ol{margin:8px 0 0;padding-left:20px;font-size:.84rem;line-height:1.7;display:grid;gap:2px;word-break:keep-all}',
    /* 돌발 대응 */
    '.fbt-em__st{border:1px solid var(--sta-line);border-radius:var(--sta-r,12px);background:#fff;padding:12px 14px;display:grid;gap:6px}',
    '.fbt-em__top{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:.8rem;font-weight:800;color:#7a8aa0}',
    '.fbt-em__ann{font-size:.95rem;font-weight:800;color:var(--sta-navy);margin:0;word-break:keep-all}',
    '.fbt-em__hint{font-size:.88rem;font-weight:700;margin:0;padding:8px 10px;border-radius:8px;word-break:keep-all}',
    '.fbt-em__hint.howl{background:var(--fbt-red-bg);color:#991b1b}',
    '.fbt-em__hint.res{background:#f1f5f9;color:var(--sta-ink)}',
    '.fbt-em__timer{font-variant-numeric:tabular-nums;color:#b91c1c}',
    '.fbt-console{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:12px 8px;border-radius:var(--sta-r,12px);background:linear-gradient(180deg,#2a2f36,#1a1e24);border:1px solid #0f1215;max-width:560px;width:100%;margin:0 auto}',
    '.fbt-ch{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;padding:6px 2px;border-radius:8px;background:rgba(255,255,255,.03);color:#e5e7eb}',
    '.fbt-ch.master{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25)}',
    '.fbt-ch__n{font-size:.68rem;font-weight:800;color:#e2e8f0;text-align:center;line-height:1.25;min-height:2.5em;word-break:keep-all}',
    '.fbt-vs{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:.6rem;font-weight:800;letter-spacing:.04em;color:#94a3b8;padding:3px;border-radius:6px}',
    '.fbt-vs b{font-size:.7rem;color:#fde68a;font-variant-numeric:tabular-nums;letter-spacing:0}',
    '.fbt-vs input[type=range]{writing-mode:vertical-lr;direction:rtl;width:24px;margin:0;cursor:pointer}',
    '.fbt-vs.mon input{height:80px;accent-color:#38bdf8}.fbt-vs.fad input{height:130px;accent-color:#e5e7eb}',
    '.fbt-vs.moved{outline:2px solid #facc15;background:rgba(250,204,21,.12)}',
    '.fbt-mute{border:1px solid #4b5563;background:#374151;color:#e5e7eb;border-radius:6px;font:inherit;font-size:.64rem;font-weight:800;padding:5px 4px;cursor:pointer;width:100%;max-width:58px}',
    '.fbt-mute[aria-pressed="true"]{background:#dc2626;border-color:#dc2626;color:#fff}',
    '.fbt-table{width:100%;border-collapse:collapse;font-size:.8rem}',
    '.fbt-table th,.fbt-table td{padding:6px 6px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top;word-break:keep-all}',
    '.fbt-table th{color:#64748b;font-weight:700;font-size:.74rem}',
    '.fbt-table td.num{font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.fbt-tag{display:inline-block;padding:1px 7px;border-radius:999px;font-size:.72rem;font-weight:800;white-space:normal;line-height:1.4}',
    '.fbt-tag.ok{background:var(--sta-ok-bg);color:var(--sta-ok)}.fbt-tag.mute{background:var(--fbt-amber-bg);color:#92400e}.fbt-tag.main{background:var(--fbt-red-bg);color:#b91c1c}.fbt-tag.late,.fbt-tag.early{background:#f1f5f9;color:#475569}',
    '.fbt-sum{font-size:.88rem;font-weight:700;padding:10px 12px;border-radius:10px;background:#f8fafc;border:1px solid var(--sta-line);margin:0;word-break:keep-all}',
    '.fbt-sum.good{background:var(--sta-ok-bg);border-color:var(--sta-ok-line);color:var(--sta-ok)}',
    /* 귀 훈련 */
    '.fbt-ear__top{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}',
    '.fbt-ear__q{font-weight:800;color:var(--sta-navy);font-variant-numeric:tabular-nums}',
    '.fbt-opt{display:inline-flex;gap:6px;align-items:center;font-size:.8rem;cursor:pointer}.fbt-opt input{width:17px;height:17px;accent-color:var(--fbt-teal)}',
    '.fbt-bands{display:grid;grid-template-columns:repeat(19,minmax(0,1fr));gap:3px}',
    '.fbt-band{border:1px solid var(--sta-line);background:#f8fafc;border-radius:6px;padding:10px 0;font:inherit;font-size:.68rem;font-weight:800;color:var(--sta-ink);cursor:pointer;min-width:0;white-space:nowrap}',
    '.fbt-band:hover:not(:disabled){border-color:var(--fbt-teal)}',
    '.fbt-band:disabled{opacity:.45;cursor:default}',
    '.fbt-band.ok{background:#059669;border-color:#059669;color:#fff}.fbt-band.near{background:#fde68a;border-color:#f59e0b}.fbt-band.no{background:#fecaca;border-color:#ef4444}',
    '.fbt-bands.cmp .fbt-band{border-style:dashed}',
    '.fbt-fb{font-size:.9rem;font-weight:700;padding:10px 12px;border-radius:10px;margin:0;min-height:44px;background:#f8fafc;border:1px solid var(--sta-line);word-break:keep-all}',
    '.fbt-fb.ok{background:var(--sta-ok-bg);color:var(--sta-ok);border-color:var(--sta-ok-line)}.fbt-fb.near{background:var(--fbt-amber-bg);color:#92400e;border-color:#fcd34d}.fbt-fb.no{background:var(--fbt-red-bg);color:#991b1b;border-color:#fca5a5}',
    '.fbt-dots{display:flex;flex-wrap:wrap;gap:4px;margin:0;padding:0;list-style:none}',
    '.fbt-dots li{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:.68rem;font-weight:800;background:#e2e8f0;color:#64748b}',
    '.fbt-dots li.ok{background:#059669;color:#fff}.fbt-dots li.near{background:#f59e0b;color:#fff}.fbt-dots li.no{background:#ef4444;color:#fff}',
    '.fbt-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:60;max-width:calc(100vw - 32px);background:var(--sta-navy);color:#fff;font-size:.86rem;font-weight:700;padding:10px 16px;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .2s}',
    '.fbt-toast.on{opacity:1}',
    '@media (max-width:860px){.fbt-theory{grid-template-columns:minmax(0,1fr)}.fbt-ro{display:flex;flex-direction:column;gap:10px}.fbt-side,.fbt-main{display:contents}.fbt-ro>*>*{order:6;min-width:0}.fbt-ro .fbt-o1{order:1}.fbt-ro .fbt-ring{order:2}.fbt-ro .fbt-tools{order:3}.fbt-ro .fbt-swipe{order:4}.fbt-ro .fbt-scroll{order:5}.fbt-ro .fbt-o7{order:7}.fbt-ro .fbt-o8{order:8}.fbt-ro .fbt-o9{order:9}.fbt-ro .fbt-o10{order:10}}',
    '@media (max-width:640px){.fbt-geqbox{min-width:560px}.fbt-swipe{display:block}.fbt-bands{grid-template-columns:repeat(5,minmax(0,1fr))}.fbt-band{padding:11px 0;font-size:.74rem}}',
    '@media (max-width:420px){.fbt-console{gap:3px;padding:10px 4px}.fbt-ch__n{font-size:.62rem}.fbt-vs.fad input{height:110px}.fbt-sec{padding:12px}.fbt-side{grid-template-columns:minmax(0,1fr)}}',
    '@media (prefers-reduced-motion:reduce){.fbt-ring.howl i{animation:none}.fbt-anacol i{transition:none}}'
  ].join('\n');

  function toast(msg) {
    var t = document.getElementById('fbtToast');
    if (!t) { t = document.createElement('div'); t.id = 'fbtToast'; t.className = 'fbt-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }

  function build() {
    root = document.getElementById('fbtRoot'); tabEl = document.getElementById('tabFeedback');
    if (!root || S.built) return; S.built = true;
    injectCss(); loadDone();
    root.innerHTML = '<div class="fbt">' +
      '<div class="mod-tabs fbt-tabs" role="tablist" aria-label="하울링 훈련 화면">' + MODES.map(function (m, i) {
        return '<button type="button" class="mod-tab" role="tab" data-fbt-mode="' + m[0] + '" aria-selected="false"><span class="n">' + (i + 1) + '</span>' + m[1] + '</button>'; }).join('') + '</div>' +
      '<details class="fbt-check" data-role="check"' + (window.innerWidth > 640 ? ' open' : '') + '></details>' +
      '<div class="fbt-sound" data-role="soundbar" hidden>' +
        '<button type="button" class="sim-btn" data-fbt="sound">🔊 소리 켜기</button>' +
        '<label class="fbt-vol">전체 소리 크기 <input type="range" min="0" max="100" step="1" value="' + S.vol + '" data-fbt="vol" aria-label="전체 소리 크기"><b data-out="vol">' + S.vol + ' %</b></label>' +
        '<p class="fbt-sound__msg" data-out="soundmsg"></p></div>' +
      '<div data-role="body"></div>' +
      '</div>';
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    renderCheck(); setMode('theory');
    if (tabEl && window.MutationObserver) {
      new MutationObserver(onTabClass).observe(tabEl, { attributes: true, attributeFilter: ['class'] });
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden && S.active) stop(); });
    onTabClass();
  }
  function onTabClass() {
    var act = !!(tabEl && tabEl.classList.contains('active'));
    if (act && !S.active) { S.active = true; loadStem(); ensureTick(); }
    else if (!act && S.active) { S.active = false; stop(); }
  }

  function renderCheck() {
    var el = $('[data-role=check]'); if (!el) return;
    var n = TASKS.filter(function (t) { return done[t.id]; }).length;
    el.innerHTML = '<summary>훈련 과제 <small>' + n + ' / ' + TASKS.length + ' 완료</small></summary><ol>' + TASKS.map(function (t) {
      return '<li class="' + (done[t.id] ? 'done ' : '') + (t.mode === S.mode ? 'cur' : '') + '" data-task="' + t.id + '"><span class="fbt-ck">' + (done[t.id] ? '✓' : '') + '</span><div><b>' + esc(t.t) + '</b><p>' + esc(t.d) + '</p></div></li>'; }).join('') + '</ol>' +
      (allDone() ? '<p class="fbt-party">🎉 모든 하울링 훈련 과제를 마쳤어요! 이제 예배 전 링아웃과 돌발 대응을 실제로 도와 드릴 수 있어요.</p>' : '');
  }

  function setMode(m) {
    if (!MODES.some(function (x) { return x[0] === m; })) return;
    if (S.mode !== m) {
      if (EM.status === 'announce' || EM.status === 'howl') emAbort();
      silenceAll(); S.sound = false;
    }
    S.mode = m;
    [].forEach.call(root.querySelectorAll('[data-fbt-mode]'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-fbt-mode') === m ? 'true' : 'false'); });
    var bar = $('[data-role=soundbar]'); bar.hidden = m === 'theory';
    $('[data-fbt=sound]').hidden = m === 'ear';
    if (m === 'theory') renderTheory(); else if (m === 'ringout') roRender(); else if (m === 'emerg') emRender(); else earRender();
    renderCheck(); updateSoundUI(); applyEqAudio(); ensureTick();
  }
  function emAbort() {
    if (EM.cur) { EM.cur = null; EM.status = EM.rounds.length ? 'result' : 'idle'; EM.msg = '화면을 떠나서 이번 라운드는 멈췄어요. 「다음 라운드」를 누르면 다시 시작해요.'; emResetConsole(); }
    EM.ring = { db: -30, on: false };
  }

  function updateSoundUI() {
    var b = $('[data-fbt=sound]'), m = $('[data-out=soundmsg]'); if (!b || !m) return;
    b.textContent = S.sound ? '🔇 소리 끄기' : '🔊 소리 켜기'; b.classList.toggle('on', S.sound);
    var AC = window.AudioContext || window.webkitAudioContext, txt;
    if (!AC) txt = '이 브라우저는 소리를 낼 수 없어요. 화면과 숫자로는 그대로 연습할 수 있어요.';
    else if (S.mode === 'ear') txt = '「▶ 문제 소리 듣기」를 누르면 짧고 작은 울림 소리가 나요. 처음엔 소리 크기를 작게 두고 시작하세요.';
    else if (S.mode === 'ringout') txt = S.sound ? (STEM ? '실제 보컬 녹음이 모니터로 나가요. 시스템이 한계를 넘을 때만 울림(삐—) 소리가 나고, 고치면 부드럽게 사라져요.' : (stemTried ? '녹음을 불러오지 못해 목소리 없이 울림 소리만 들려요.' : '녹음을 불러오는 중…')) : '소리를 꺼도 그래프와 숫자로 연습할 수 있어요. 울림 소리는 최대 −18 dBFS 로 작게 묶여 있어요.';
    else txt = S.sound ? '예배 소리(보컬 녹음)가 작게 나와요. 하울링이 나면 울림 소리가 들려요.' : '「훈련 시작」을 누르면 소리가 켜져요. 소리를 꺼도 화면으로 연습할 수 있어요.';
    m.textContent = txt;
  }
  function toggleSound(on) {
    on = on == null ? !S.sound : on;
    if (on) { if (!ensureCtx()) { S.sound = false; updateSoundUI(); return; } S.sound = true; voxStart(); }
    else { S.sound = false; silenceAll(); }
    updateSoundUI();
  }

  /* ---------- 원리 보기 */
  function loopSvg() {
    var T = function (x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 13) + '" font-weight="' + (o.w || 700) + '" fill="' + (o.fill || '#0f2747') + '" text-anchor="' + (o.a || 'middle') + '">' + s + '</text>'; };
    var box = function (x, y, w, h, t1, t2, fill) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="9" fill="' + (fill || '#fff') + '" stroke="#0f2747" stroke-width="1.6"/>' + T(x + w / 2, y + (t2 ? h / 2 - 2 : h / 2 + 5), t1, { size: 13, w: 800 }) + (t2 ? T(x + w / 2, y + h / 2 + 14, t2, { size: 10.5, w: 600, fill: '#475569' }) : ''); };
    var arr = function (d, col) { return '<path d="' + d + '" fill="none" stroke="' + (col || '#0e7490') + '" stroke-width="2.4" marker-end="url(#fbtAr' + (col ? 'R' : '') + ')"/>'; };
    return '<svg class="fbt-svg" viewBox="0 0 440 270" role="img" aria-label="하울링 루프: 마이크, 콘솔, 앰프, 스피커를 지나 소리가 다시 마이크로 들어가는 그림">' +
      '<defs><marker id="fbtAr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#0e7490"/></marker>' +
      '<marker id="fbtArR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#dc2626"/></marker></defs>' +
      box(8, 30, 108, 50, '🎤 마이크', '목소리+돌아온 소리') + box(152, 30, 92, 50, '콘솔', 'GAIN·페이더·AUX') + box(290, 30, 92, 50, '앰프', '전기 신호 키움') +
      box(290, 176, 132, 54, '🔈 스피커', '모니터 · 메인', '#fff') +
      arr('M116 55H148') + arr('M244 55H286') + arr('M336 80V172') +
      '<path d="M288 204C220 222 120 222 66 120" fill="none" stroke="#dc2626" stroke-width="2.4" stroke-dasharray="6 5" marker-end="url(#fbtArR)"/>' +
      T(170, 236, '공기를 지나 다시 마이크로 (방·거리·마이크 방향)', { size: 11.5, fill: '#b91c1c' }) +
      '<rect x="120" y="104" width="164" height="76" rx="10" fill="#fef2f2" stroke="#fca5a5"/>' +
      T(202, 126, '한 바퀴 돈 이득(루프 이득)', { size: 11.5 }) + T(202, 146, '어느 한 주파수라도 ≥ 1 (0 dB)', { size: 12.5, w: 800, fill: '#b91c1c' }) +
      T(202, 166, '→ 돌 때마다 커짐 = 하울링', { size: 12, w: 800, fill: '#b91c1c' }) +
      T(18, 262, '소리는 한 바퀴에 수 ms ~ 수십 ms 만에 돌아요. 그래서 순식간에 커져요.', { size: 10.5, w: 600, fill: '#64748b', a: 'start' }) + '</svg>';
  }
  function renderTheory() {
    $('[data-role=body]').innerHTML = '<div class="fbt-theory">' +
      '<section class="fbt-sec"><h3 class="fbt-h">하울링은 왜 생겨요?</h3>' + loopSvg() +
        '<p class="fbt-p">마이크로 들어간 소리는 콘솔 → 앰프 → 스피커를 지나 <b>공기를 타고 다시 마이크로</b> 들어가요. 한 바퀴 돌아온 소리가 처음보다 작으면(루프 이득 1 미만) 금방 사라지지만, <b>어느 한 주파수에서라도 한 바퀴 이득이 1 이상(0 dB 이상)이고 박자(위상)가 맞아 더해지면</b> 그 주파수가 돌 때마다 커져서 「삐—」, 「우웅—」 하는 하울링이 돼요.</p>' +
        '<p class="fbt-p">방의 울림, 스피커·마이크의 주파수 특성은 고르지 않아서 <b>몇몇 주파수가 먼저</b> 0 dB 를 넘어요. 그래서 하울링은 보통 한 음처럼 들려요. 대략 250–500 Hz 는 「우웅」, 1 kHz 근처는 노래하듯, 2 kHz 이상은 「삐익」 소리로 들려요.</p>' +
        '<p class="fbt-p"><b>하울링까지 남은 여유</b> = 지금보다 몇 dB 더 올리면 하울링이 시작되는지예요. 이 여유가 클수록 안전해요.</p></section>' +
      '<div style="display:grid;gap:12px;min-width:0">' +
      '<section class="fbt-sec"><h3 class="fbt-h">여유를 늘리는 방법</h3><ul class="fbt-good">' +
        '<li><b>마이크를 입 가까이</b> — 거리가 절반이 되면 목소리가 약 6 dB 커져서, 볼륨을 그만큼 덜 올려도 돼요.</li>' +
        '<li><b>모니터는 마이크가 가장 둔한 쪽(널)에</b> — 카디오이드(SM58 등)는 바로 뒤(180°), 슈퍼카디오이드는 뒤쪽 비스듬히(약 120–130°)예요.</li>' +
        '<li><b>안 쓰는 마이크는 꺼요</b> — 열린 마이크 수가 2배가 될 때마다 여유가 약 3 dB 줄어요.</li>' +
        '<li><b>울리는 주파수만 좁게 깎기</b> — 링아웃: GEQ 에서 울리는 한 칸을 약 3 dB 깎고, 다시 올려서 다음 울림을 찾아요.</li>' +
        '<li><b>무대 소리 줄이기</b> — 모니터·악기 앰프를 필요한 만큼만. 스피커와 마이크는 멀리 둬요.</li>' +
        '<li><b>그릴(마이크 머리)을 손으로 감싸 쥐지 않기</b> — 지향성이 무지향처럼 바뀌어 하울링이 잘 나요.</li></ul></section>' +
      '<section class="fbt-sec"><h3 class="fbt-h">이렇게 하면 안 돼요</h3><ul class="fbt-bad">' +
        '<li><b>예배 중에 MAIN 마스터를 확 내리기</b> — 설교·찬양이 모두 끊겨요. 모니터(AUX) 하울링이면 소용도 없어요. <b>방금 올린 페이더나 모니터 센드</b>부터 내려요.</li>' +
        '<li><b>모든 대역을 넓고 깊게 깎기</b> — 소리가 답답하고 작아져서 결국 볼륨을 더 올리게 돼요. 울리는 곳만, 필요한 만큼만.</li>' +
        '<li><b>울리는 채로 오래 두기</b> — 귀와 스피커(특히 고음 드라이버)를 상하게 할 수 있어요. 울리면 바로 내려요.</li></ul></section></div>' +
      '<section class="fbt-sec wide"><h3 class="fbt-h">이 탭에서 연습할 것</h3><p class="fbt-p" style="margin:0">「링아웃 연습」에서 모니터를 천천히 올려 울리는 대역을 찾아 깎고, 「예배 중 돌발 대응」에서 하울링이 났을 때 어떤 페이더를 내려야 하는지 몸에 익히고, 「귀로 주파수 맞히기」로 울리는 높이를 귀로 알아듣는 연습을 해요. 울림 소리는 실제 하울링이 아니라 작은 사인파로 만든 소리라 안전해요.</p></section>' +
      '</div>';
  }

  /* ---------- 링아웃 연습 */
  function placeSvg(deg) {
    var cx = 90, cy = 66, i, pts = [];
    for (i = 0; i <= 360; i += 6) { var a = i * Math.PI / 180, r = 6 + 34 * (0.5 + 0.5 * Math.cos(a)); pts.push((cx + r * Math.sin(a)).toFixed(1) + ',' + (cy - r * Math.cos(a)).toFixed(1)); }
    var R = 52, ra = deg * Math.PI / 180, mx = cx + R * Math.sin(ra), my = cy - R * Math.cos(ra);
    return '<svg class="fbt-place-svg" viewBox="0 0 180 136" role="img" aria-label="위에서 본 마이크와 모니터 위치: ' + placeOf(deg).name + '">' +
      '<text x="' + cx + '" y="10" font-size="10" font-weight="800" fill="#0f2747" text-anchor="middle">👄 입 (마이크 앞)</text>' +
      '<polygon points="' + pts.join(' ') + '" fill="rgba(14,116,144,.12)" stroke="#0e7490" stroke-width="1.2"/>' +
      '<rect x="' + (cx - 3.5) + '" y="' + (cy - 2) + '" width="7" height="22" rx="3" fill="#334155"/><circle cx="' + cx + '" cy="' + (cy - 5) + '" r="6" fill="#64748b" stroke="#1f2937"/>' +
      '<text x="' + cx + '" y="132" font-size="9" fill="#0e7490" text-anchor="middle">뒤쪽 = 가장 둔한 곳(널)</text>' +
      '<g transform="rotate(' + deg + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1) + ')"><rect x="' + (mx - 13).toFixed(1) + '" y="' + (my - 7).toFixed(1) + '" width="26" height="14" rx="3" fill="#0f2747"/><rect x="' + (mx - 9).toFixed(1) + '" y="' + (my - 7).toFixed(1) + '" width="18" height="4" rx="1" fill="#22d3ee"/></g>' +
      '</svg>';
  }
  function roRender() {
    if (S.mode !== 'ringout' || !root) return;
    var body = $('[data-role=body]'), pl = placeOf(RO.place), mv = RO.lastMove;
    var cols = BANDS.map(function (f, i) { return '<div class="fbt-anacol" data-ana="' + i + '"><i></i></div>'; }).join('');
    var geq = BANDS.map(function (f, i) { return '<div class="fbt-geqcol" data-gcol="' + i + '"><input type="range" min="0" max="12" step="1" value="' + RO.geq[i] + '" data-geq="' + i + '" aria-label="' + fmtHzL(f) + ' 깎기(dB)"><b data-gv="' + i + '">0</b><span>' + fmtHz(f) + '</span></div>'; }).join('');
    body.innerHTML = '<p class="fbt-note">교육용 근사: 방·모니터·마이크의 울림을 단순한 숫자로 만든 연습용 모델이에요(울리기 쉬운 곳 3–4군데). 실제 방에서는 주파수와 dB 가 달라요. 실제 링아웃은 볼륨을 아주 조금씩 올리고, 울리면 바로 내려요.</p>' +
      '<div class="fbt-ro"><div class="fbt-side">' +
        '<div class="sim-box fbt-o1"><h4>모니터 보내는 양 (AUX) <small>보컬 → 모니터</small></h4>' +
          '<label class="sim-range"><span>센드 <b data-out="send">' + sint(RO.send) + ' dB</b></span><input type="range" min="-30" max="10" step="1" value="' + RO.send + '" data-fbt="send" aria-label="모니터 보내는 양 (AUX) dB"></label>' +
          '<div class="fbt-stepper"><button type="button" class="sim-btn" data-fbt="send-">− 1 dB</button><button type="button" class="sim-btn" data-fbt="send+">+ 1 dB</button></div></div>' +
        '<div class="sim-box fbt-o8"><h4>모니터 위치 <small>카디오이드 보컬 마이크 기준</small></h4><div data-role="placesvg">' + placeSvg(RO.place) + '</div>' +
          '<div class="fbt-places">' + PLACES.map(function (p) { return '<button type="button" class="sim-btn' + (p.deg === RO.place ? ' on' : '') + '" data-place="' + p.deg + '" aria-pressed="' + (p.deg === RO.place) + '">' + p.short + '</button>'; }).join('') + '</div>' +
          '<p class="fbt-move" data-out="move">' + (mv ? '모니터를 ' + placeOf(mv.to).name + '(으)로 옮겼어요: 여유 ' + sdb(mv.before) + ' → ' + sdb(mv.after) + (mv.to === 180 && mv.after - mv.before >= 10 && !mv.pushed ? ' (과제는 AUX 를 올려 하울링 직전까지 간 뒤 옮겨야 인정돼요)' : '') : '지금: ' + pl.name + ' (' + pl.deg + '°) — 마이크가 이쪽 소리를 ' + sdb(placeDb(pl.deg)) + ' 로 받아요.') + '</p></div>' +
        '<div class="sim-box sim-read fbt-o7" data-role="read"></div>' +
        '<div class="sim-btns fbt-o9" style="margin:0"><button type="button" class="sim-btn" data-fbt="newsc">🎲 새 상황</button></div>' +
      '</div><div class="fbt-main">' +
        '<div class="fbt-ring" data-role="ring" role="status" aria-live="polite"><i>✓</i><span>안정적이에요</span></div>' +
        '<div class="fbt-tools"><div class="fbt-seg" role="group" aria-label="보기 방식"><button type="button" data-fbt="ana-on" aria-pressed="' + S.analyzer + '">분석기 보기</button><button type="button" data-fbt="ana-off" aria-pressed="' + !S.analyzer + '">귀로만</button></div>' +
          '<button type="button" class="sim-btn" data-fbt="geq0" style="margin:0">GEQ 모두 0</button></div>' +
        '<p class="fbt-swipe">← GEQ 는 옆으로 밀어서 볼 수 있어요 →</p>' +
        '<div class="fbt-scroll"><div class="fbt-geqbox">' +
          '<div class="fbt-ana' + (S.analyzer ? '' : ' off') + '" data-role="ana"><div class="fbt-line" style="bottom:80%"><span>하울링 선 0 dB</span></div><div class="fbt-line warn" style="bottom:70%"><span>−3 dB</span></div><div class="fbt-g19">' + cols + '</div>' +
            '<div class="fbt-ana__off">귀로만 듣는 중이에요. 소리를 켜고, 울리는 높이를 귀로 찾아 GEQ 에서 깎아 보세요.</div></div>' +
          '<div class="fbt-g19 fbt-geq">' + geq + '</div></div></div>' +
        '<p class="sim-note" style="margin:0">위 막대: 대역별 「한 바퀴 이득」(루프 이득, 교육용 근사). 빨간 선(0 dB)을 넘는 대역이 울려요. 아래 GEQ 는 깎기만 해요(0 ~ −12 dB). 한 칸을 깎으면 옆 칸도 조금(약 35 %) 같이 내려가요.</p>' +
        '<details class="fbt-how fbt-o10" open><summary>링아웃 순서 (예배 전 사운드체크 때)</summary><ol>' +
          '<li>「소리 켜기」를 누르고 전체 소리 크기를 편하게 맞춰요.</li><li>AUX 를 1 dB 씩 천천히 올려요.</li><li>울리기 시작하면 바로 1–2 dB 내리고, 그 대역을 GEQ 에서 3 dB 쯤 깎아요.</li>' +
          '<li>다시 조금씩 올려서 다음 울림을 찾아요(보통 3–4군데까지).</li><li>모니터를 마이크 뒤쪽으로 놓으면 여유가 크게 늘어요.</li></ol></details>' +
      '</div></div>';
    roUI();
  }
  function roUI(st) {
    if (S.mode !== 'ringout' || !root) return;
    st = st || roStats(); var r = RO.ring, i;
    var so = $('[data-out=send]'); if (so) so.textContent = sint(RO.send) + ' dB';
    var sIn = $('[data-fbt=send]'); if (sIn && document.activeElement !== sIn && +sIn.value !== RO.send) sIn.value = RO.send;
    for (i = 0; i < NB; i++) {
      var col = root.querySelector('[data-ana="' + i + '"]'), v = st.L[i];
      if (col) { col.firstChild.style.height = (clamp((v + 24) / 30, 0, 1) * 100).toFixed(1) + '%'; col.className = 'fbt-anacol' + (v > 0 ? ' hot' : v > -3 ? ' edge' : '') + (r.on && r.band === i ? ' worst' : ''); col.title = fmtHzL(BANDS[i]) + ': ' + sdb(v); }
      var gv = root.querySelector('[data-gv="' + i + '"]'); if (gv) { gv.textContent = RO.geq[i] ? '−' + RO.geq[i] : '0'; gv.className = RO.geq[i] ? 'cut' : ''; }
      var gi = root.querySelector('[data-geq="' + i + '"]'); if (gi && document.activeElement !== gi && +gi.value !== RO.geq[i]) gi.value = RO.geq[i];
    }
    var ring = $('[data-role=ring]');
    if (ring) {
      var cls = r.on ? 'howl' : r.edge ? 'edge' : '', ic, tx;
      if (r.on) { ic = '🔔'; tx = '하울링! ' + (S.analyzer ? fmtHzL(BANDS[r.band]) + ' 대역이 울려요 — ' : '어느 높이인지 귀로 찾아요 — ') + 'AUX 를 내리거나 그 대역을 깎아요.' + (S.sound ? '' : ' (소리를 켜면 들려요)'); }
      else if (r.edge) { ic = '〰'; tx = '하울링 직전이에요. 목소리 끝에 울림이 살짝 남아요(여유 ' + sdb(st.margin) + ').'; }
      else { ic = '✓'; tx = '안정적이에요. 하울링까지 ' + sdb(st.margin) + ' 남았어요.'; }
      ring.className = 'fbt-ring ' + cls; setHtml(ring, '<i>' + ic + '</i><span>' + tx + '</span>');
    }
    var rd = $('[data-role=read]');
    if (rd) {
      var mcls = st.margin < 0 ? 'bad' : st.margin < 3 ? 'warn' : 'ok', pl = placeOf(RO.place);
      setHtml(rd, '<div class="sim-row"><span>하울링까지 남은 여유</span><b class="' + mcls + '" data-out="margin">' + (st.margin < 0 ? '하울링 중 (' + sdb(st.margin) + ')' : sdb(st.margin)) + '</b></div>' +
        '<span class="sim-bar ' + mcls + '"><i style="width:' + (clamp(st.margin / 20, 0, 1) * 100).toFixed(0) + '%"></i></span>' +
        '<div class="sim-row"><span>EQ 로 늘린 여유</span><b class="' + (st.eqGain >= 6 - 1e-6 ? 'ok' : '') + '" data-out="eqgain">' + sdb(st.eqGain) + '</b></div>' +
        '<div class="sim-row"><span>깎은 대역</span><b class="' + (st.cutBands > 4 ? 'warn' : '') + '" data-out="cuts">' + st.cutBands + '개 <small>(4개까지)</small></b></div>' +
        '<div class="sim-row"><span>필요 없는 컷 (3 dB 이상)</span><b class="' + (st.waste > 1 ? 'bad' : st.waste ? 'warn' : '') + '" data-out="waste">' + st.waste + '개</b></div>' +
        '<div class="sim-row"><span>모니터 위치</span><b>' + pl.name + ' · ' + sdb(placeDb(pl.deg)) + '</b></div>' +
        '<p class="sim-note">「EQ 로 늘린 여유」는 처음(GEQ 평평)보다 몇 dB 더 올릴 수 있게 됐는지예요. 교육용 근사.</p>');
    }
  }

  /* ---------- 예배 중 돌발 대응 */
  function emRender() {
    if (S.mode !== 'emerg' || !root) return;
    var body = $('[data-role=body]');
    var chs = CHS.map(function (c, i) {
      return '<div class="fbt-ch" data-ch="' + i + '"><b class="fbt-ch__n">' + c.name + '</b>' +
        '<label class="fbt-vs mon" data-vs="send-' + i + '">MON<input type="range" min="-30" max="10" step="1" value="' + EM.ch[i].send + '" data-em="send" data-ch="' + i + '" aria-label="' + c.name + ' 모니터 센드"><b data-emv="send-' + i + '"></b></label>' +
        '<label class="fbt-vs fad" data-vs="fader-' + i + '">FADER<input type="range" min="-30" max="10" step="1" value="' + EM.ch[i].fader + '" data-em="fader" data-ch="' + i + '" aria-label="' + c.name + ' 페이더"><b data-emv="fader-' + i + '"></b></label>' +
        '<button type="button" class="fbt-mute" data-em="mute" data-ch="' + i + '" aria-pressed="false">MUTE</button></div>'; }).join('');
    var st = EM.status, n = EM.rounds.length;
    var btn = st === 'idle' ? '<button type="button" class="sim-btn on" data-fbt="emstart">▶ 훈련 시작</button>' :
      st === 'result' ? '<button type="button" class="sim-btn on" data-fbt="emnext">다음 라운드 ▶</button>' :
      st === 'done' ? '<button type="button" class="sim-btn on" data-fbt="emagain">↻ 다시 하기</button>' : '';
    var rows = EM.rounds.map(function (r, i) {
      var lab = { ok: '정답', mute: '뮤트 (소리가 끊김, 최후 수단)', main: 'MAIN 내림 (설교·찬양 모두 끊김)', late: '시간 초과', early: '하울링 전에 되돌림' }[r.outcome];
      return '<tr><td class="num">' + (i + 1) + '</td><td>' + CHS[r.ch].name + ' · ' + (r.path === 'mon' ? '모니터' : '메인') + ' +' + r.d + ' dB</td><td><span class="fbt-tag ' + r.outcome + '">' + lab + '</span></td><td class="num">' + (r.rt != null ? r.rt.toFixed(1) + '초' : '—') + '</td></tr>'; }).join('');
    var sum = '';
    if (st === 'done') { var s = emSummary(), good = s.ok >= 4 && s.main === 0;
      sum = '<p class="fbt-sum' + (good ? ' good' : '') + '" data-out="emsum">5라운드 결과: 정답 ' + s.ok + ' · 뮤트 ' + s.mute + ' · MAIN 내림 ' + s.main + ' · 시간 초과 ' + s.late + (s.early ? ' · 미리 되돌림 ' + s.early : '') + ' — ' + (good ? '🎉 과제 달성! 하울링이 나면 「방금 바꾼 것」을 되돌리는 습관이 잘 잡혔어요.' : '정답 4번 이상, MAIN 0번이 목표예요. 다시 해 볼까요?') + '</p>'; }
    body.innerHTML = '<p class="fbt-note">교육용 근사: 예배 중 선배가 페이더나 모니터 센드를 올리고, 잠시 뒤 그 경로에서 하울링이 나요. 방금 올린 것을 3 dB 이상 내리면 멈춰요. 모니터(AUX)는 보통 프리 페이더라 채널 페이더·MAIN 과 따로 움직여요. 라운드마다 콘솔은 처음 상태로 돌아가요.</p>' +
      '<div class="fbt-em__st"><div class="fbt-em__top"><span data-out="emround">' + (st === 'idle' ? '준비' : '라운드 ' + Math.min(5, n + (EM.cur ? 1 : 0)) + ' / 5') + '</span><span class="fbt-em__timer" data-out="emtimer"></span></div>' +
        '<p class="fbt-em__ann" data-out="emann"></p><p class="fbt-em__hint" data-out="emhint" hidden></p></div>' +
      '<div class="fbt-console" role="group" aria-label="미니 콘솔">' + chs +
        '<div class="fbt-ch master"><b class="fbt-ch__n">MAIN<br>마스터</b><label class="fbt-vs fad" data-vs="main">MAIN<input type="range" min="-30" max="10" step="1" value="' + EM.main + '" data-em="main" aria-label="MAIN 마스터 페이더"><b data-emv="main"></b></label></div></div>' +
      '<div class="sim-btns" style="margin:0;justify-content:center">' + btn + '</div>' +
      (rows ? '<table class="fbt-table"><thead><tr><th>#</th><th>상황</th><th>내 대응</th><th>반응 시간</th></tr></thead><tbody>' + rows + '</tbody></table>' : '') + sum;
    emUI();
  }
  function emUI() {
    if (S.mode !== 'emerg' || !root) return;
    var cur = EM.cur, st = EM.status, i;
    for (i = 0; i < CHS.length; i++) {
      ['send', 'fader'].forEach(function (k) {
        var inp = root.querySelector('[data-em="' + k + '"][data-ch="' + i + '"]'), v = EM.ch[i][k];
        if (inp && document.activeElement !== inp && +inp.value !== v) inp.value = v;
        var o = root.querySelector('[data-emv="' + k + '-' + i + '"]'); if (o) o.textContent = sint(v);
        var lab = root.querySelector('[data-vs="' + k + '-' + i + '"]'); if (lab) lab.classList.toggle('moved', !!(cur && cur.ch === i && cur.key === k));
      });
      var mb = root.querySelector('[data-em="mute"][data-ch="' + i + '"]'); if (mb) mb.setAttribute('aria-pressed', EM.ch[i].mute ? 'true' : 'false');
    }
    var mi = $('[data-em=main]'); if (mi && document.activeElement !== mi && +mi.value !== EM.main) mi.value = EM.main;
    var mo = $('[data-emv=main]'); if (mo) mo.textContent = sint(EM.main);
    var ann = $('[data-out=emann]'), hint = $('[data-out=emhint]'), tm = $('[data-out=emtimer]');
    if (!ann) return;
    if (st === 'idle') { ann.textContent = '「훈련 시작」을 누르면 예배가 시작돼요. 선배가 콘솔을 만지면 잘 보고 들으세요. 하울링이 나면 바로 대응해요!'; hint.hidden = true; tm.textContent = ''; }
    else if (cur) {
      ann.textContent = '📣 방금 ' + (cur.path === 'mon' ? CHS[cur.ch].mon + '(' + CHS[cur.ch].name + ' MON)를' : CHS[cur.ch].name + ' 페이더를') + ' +' + cur.d + ' dB 올렸어요' + (cur.path === 'mon' ? ' — "제 소리가 잘 안 들려요" 라고 해서요.' : ' — "뒤쪽에서 잘 안 들려요" 라고 해서요.');
      if (st === 'howl') {
        hint.hidden = false; hint.className = 'fbt-em__hint howl';
        hint.textContent = (cur.path === 'mon' ? '🔈 소리가 무대 쪽(모니터 스피커)에서 나는 것 같아요 — 삐이~' : '🔊 회중석 스피커(메인)에서 우웅~ 하고 울려요') + (EM.msg ? ' · ' + EM.msg : '');
        tm.textContent = '⏱ ' + (now() - cur.howlStart).toFixed(1) + '초 (8초 안에)';
      } else { hint.hidden = true; tm.textContent = ''; }
    } else {
      ann.textContent = st === 'done' ? '5라운드를 모두 마쳤어요.' : '라운드 ' + EM.rounds.length + ' 결과';
      hint.hidden = !EM.msg; hint.className = 'fbt-em__hint res'; hint.textContent = EM.msg; tm.textContent = '';
    }
  }

  /* ---------- 귀로 주파수 맞히기 */
  function earRender() {
    if (S.mode !== 'ear' || !root) return;
    var body = $('[data-role=body]'), n = EAR.results.length, fin = n >= 10, sc = earScore();
    var last = EAR.answered && n ? EAR.results[n - 1] : null;
    var bands = BANDS.map(function (f, i) {
      var cls = '';
      if (last && !EAR.compare) { if (i === last.target) cls = 'ok'; else if (i === last.pick) cls = Math.abs(last.diff) <= 1 ? 'near' : 'no'; }
      return '<button type="button" class="fbt-band ' + cls + '" data-band="' + i + '" aria-label="' + fmtHzL(f) + '">' + fmtHz(f) + '</button>'; }).join('');
    var fb = '', fcls = '';
    if (last) {
      if (last.diff === 0) { fcls = 'ok'; fb = '✅ 정답! ' + fmtHzL(BANDS[last.target]) + ' 였어요.'; }
      else if (Math.abs(last.diff) === 1) { fcls = 'near'; fb = '👍 가까워요! 정답은 ' + fmtHzL(BANDS[last.target]) + ' (고른 것: ' + fmtHzL(BANDS[last.pick]) + ', 한 칸 차이).'; }
      else { fcls = 'no'; fb = '아니에요. 정답은 ' + fmtHzL(BANDS[last.target]) + ' 였어요 (고른 것: ' + fmtHzL(BANDS[last.pick]) + '). 「비교해 듣기」로 두 소리를 번갈아 들어 보세요.'; }
    } else if (!fin) fb = EAR.heard ? '어느 대역이었나요? 아래에서 골라요.' : '「▶ 문제 소리 듣기」를 먼저 눌러요.';
    var dots = []; for (var i = 0; i < 10; i++) { var r = EAR.results[i]; dots.push('<li class="' + (r ? (r.diff === 0 ? 'ok' : Math.abs(r.diff) === 1 ? 'near' : 'no') : '') + '">' + (i + 1) + '</li>'); }
    body.innerHTML = '<p class="fbt-note">짧고 작은 울림 소리(사인파)를 듣고 1/3옥타브 19칸 중 어느 칸인지 골라요. 실제 하울링도 이렇게 한 음처럼 들려요. ±1칸 안이면 실전에서 GEQ 를 찾기에 충분해요.</p>' +
      '<div class="sim-box"><div class="fbt-ear__top"><span class="fbt-ear__q" data-out="earq">' + (fin ? '끝!' : '문제 ' + (n + (EAR.answered ? 0 : 1)) + ' / 10') + '</span>' +
        (fin ? '' : '<button type="button" class="sim-btn on" data-fbt="earplay"' + (EAR.answered ? ' disabled' : '') + '>▶ 문제 소리 듣기</button>') +
        '<label class="fbt-opt"><input type="checkbox" data-fbt="earmix"' + (EAR.mix ? ' checked' : '') + '> 작은 목소리 위에 섞기</label>' +
        '<label class="fbt-opt"><input type="checkbox" data-fbt="earcmp"' + (EAR.compare ? ' checked' : '') + '> 비교해 듣기 (칸을 누르면 그 소리)</label></div></div>' +
      '<div class="fbt-bands' + (EAR.compare ? ' cmp' : '') + '" data-role="bands">' + bands + '</div>' +
      '<p class="fbt-fb ' + fcls + '" data-out="earfb" role="status" aria-live="polite">' + fb + '</p>' +
      '<div class="fbt-tools"><ol class="fbt-dots" aria-label="문제별 결과">' + dots.join('') + '</ol><div class="sim-btns" style="margin:0">' +
        (EAR.answered && !fin ? '<button type="button" class="sim-btn on" data-fbt="earnext">다음 문제 ▶</button>' : '') +
        '<button type="button" class="sim-btn" data-fbt="earreset">↻ 처음부터</button></div></div>' +
      (fin ? '<p class="fbt-sum' + (sc.within >= 8 ? ' good' : '') + '" data-out="earsum">10문제 중 ±1칸 안 ' + sc.within + '개 (정답 ' + sc.exact + '개) — ' + (sc.within >= 8 ? '🎉 과제 달성! 귀가 하울링 높이를 잘 찾아요.' : '8개 이상이 목표예요. 「비교해 듣기」로 낮은 소리·높은 소리를 먼저 익혀 보세요.') + '</p>' : '');
    earUI();
  }
  function earUI(msg) {
    if (S.mode !== 'ear' || !root) return;
    var fin = EAR.results.length >= 10;
    [].forEach.call(root.querySelectorAll('[data-band]'), function (b) { b.disabled = !EAR.compare && (!EAR.heard || EAR.answered || fin); });
    if (msg) { var f = $('[data-out=earfb]'); if (f) { f.className = 'fbt-fb'; f.textContent = msg; } }
    else if (EAR.heard && !EAR.answered && !EAR.compare) { var f2 = $('[data-out=earfb]'); if (f2 && !f2.className.match(/ok|near|no/)) f2.textContent = '어느 대역이었나요? 아래에서 골라요. (다시 들어도 돼요)'; }
  }

  /* ------------------------------------------------------------------ 입력 */
  function onClick(e) {
    var b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    var m = b.getAttribute('data-fbt-mode'); if (m) { setMode(m); return; }
    var pl = b.getAttribute('data-place'); if (pl) { setPlace(+pl); return; }
    var band = b.getAttribute('data-band'); if (band != null && S.mode === 'ear') { earPick(+band); return; }
    var em = b.getAttribute('data-em'); if (em === 'mute') { emInput('mute', +b.getAttribute('data-ch')); return; }
    var f = b.getAttribute('data-fbt');
    switch (f) {
      case 'sound': toggleSound(); break;
      case 'send-': setSend(RO.send - 1); break;
      case 'send+': setSend(RO.send + 1); break;
      case 'newsc': newScenario(); applyEqAudio(); roRender(); toast('새 상황이에요. 울리는 곳이 바뀌었어요.'); break;
      case 'geq0': RO.geq = zeros(); applyEqAudio(); roUI(); break;
      case 'ana-on': S.analyzer = true; roRender(); break;
      case 'ana-off': S.analyzer = false; roRender(); break;
      case 'emstart': emReset(); toggleSound(true); emStartRound(); break;
      case 'emnext': if (!S.sound) toggleSound(true); emStartRound(); break;
      case 'emagain': emReset(); emRender(); break;
      case 'earplay': earPlayQ(); break;
      case 'earnext': earNew(false); earRender(); break;
      case 'earreset': earNew(true); earRender(); break;
    }
  }
  function onInput(e) {
    var t = e.target, f = t.getAttribute('data-fbt');
    if (f === 'vol') { S.vol = clamp(+t.value, 0, 100); var o = $('[data-out=vol]'); if (o) o.textContent = S.vol + ' %'; if (A.ctx) A.master.gain.setTargetAtTime(masterGain(), A.ctx.currentTime, 0.05); return; }
    if (f === 'send') { setSend(t.value); return; }
    var g = t.getAttribute('data-geq'); if (g != null) { setGeq(+g, t.value); return; }
    var em = t.getAttribute('data-em'); if (em && em !== 'mute') { emInput(em, +t.getAttribute('data-ch'), t.value); }
  }
  function onChange(e) {
    var t = e.target, f = t.getAttribute('data-fbt');
    if (f === 'earmix') EAR.mix = t.checked;
    if (f === 'earcmp') { EAR.compare = t.checked; earRender(); }
  }

  /* ------------------------------------------------------------------ 바깥에서 쓰는 API (테스트) */
  function stop() {
    if (tickId) { clearInterval(tickId); tickId = null; }
    if (EM.status === 'announce' || EM.status === 'howl') { emAbort(); emRender(); }
    S.sound = false; stopAudio(); updateSoundUI();
    if (S.active) ensureTick();   // 탭이 보이는 중에 stop() 을 부른 경우 화면 계산은 계속
  }
  function state() {
    var st = roStats(), c = A.ctx || lastCtx;
    return {
      mode: S.mode, active: S.active, vol: S.vol, analyzer: S.analyzer, sound: S.sound, stemReady: !!STEM, timer: !!tickId,
      audio: { ctx: c ? c.state : 'none', nodes: audioNodes(), rings: Object.keys(A.rings).map(function (k) { return { key: k, f: A.rings[k].f, amp: A.rings[k].amp }; }),
        cap: CAP, capDb: CAP_DB, toneGain: CAP * Object.keys(A.rings).reduce(function (s, k) { return s + A.rings[k].amp; }, 0) + CAP * A.toneTarget,
        tonePeak: A.peakNow, tonePeakMax: A.peakMax, master: A.master ? A.master.gain.value : masterGain(), vox: !!A.vox },
      ro: { send: RO.send, place: RO.place, placeDb: placeDb(RO.place), geq: RO.geq.slice(), peaks: RO.peaks.map(function (p) { return { i: p.i, f: BANDS[p.i], h: p.h }; }), R: RO.R.slice(),
        L: st.L, maxL: st.maxL, worst: st.worst, margin: st.margin, eqGain: st.eqGain, cutBands: st.cutBands, waste: st.waste,
        ring: { on: RO.ring.on, band: RO.ring.band, f: RO.ring.on ? BANDS[RO.ring.band] : null, db: RO.ring.db, edge: RO.ring.edge }, firstRing: RO.firstRing, lastMove: RO.lastMove },
      em: { status: EM.status, round: EM.rounds.length + (EM.cur ? 1 : 0), cur: EM.cur ? { path: EM.cur.path, ch: EM.cur.ch, key: EM.cur.key, d: EM.cur.d, raised: EM.cur.raised, band: EM.cur.band, f: BANDS[EM.cur.band], mainPulled: EM.cur.mainPulled, wrong: EM.cur.wrong } : null,
        L: emL(), ring: { on: EM.ring.on, db: EM.ring.db }, ch: EM.ch.map(function (c) { return { fader: c.fader, send: c.send, mute: c.mute }; }), main: EM.main,
        rounds: EM.rounds.map(function (r) { return { path: r.path, ch: r.ch, outcome: r.outcome, rt: r.rt, wrong: r.wrong }; }), summary: emSummary(), msg: EM.msg },
      ear: { q: EAR.results.length + (EAR.answered ? 0 : 1), target: EAR.target, targetF: BANDS[EAR.target], heard: EAR.heard, answered: EAR.answered, compare: EAR.compare, mix: EAR.mix, results: EAR.results.slice(), score: earScore() },
      done: Object.keys(done).filter(function (k) { return done[k]; }), allDone: allDone(), bands: BANDS.slice()
    };
  }
  function set(o) {
    o = o || {};
    if (o.mode) setMode(o.mode);
    if (o.vol != null) { S.vol = clamp(+o.vol, 0, 100); if (A.ctx) A.master.gain.setTargetAtTime(masterGain(), A.ctx.currentTime, 0.05); var vi = $('[data-fbt=vol]'); if (vi) vi.value = S.vol; var vo = $('[data-out=vol]'); if (vo) vo.textContent = S.vol + ' %'; }
    if (o.analyzer != null) { S.analyzer = !!o.analyzer; if (S.mode === 'ringout') roRender(); }
    if (o.scenario) { newScenario(o.scenario.peaks); applyEqAudio(); if (S.mode === 'ringout') roRender(); }
    if (o.send != null) setSend(o.send);
    if (o.geq) { if (Array.isArray(o.geq)) RO.geq = o.geq.map(function (v) { return clamp(Math.round(+v || 0), 0, 12); }).concat(zeros()).slice(0, NB); else Object.keys(o.geq).forEach(function (k) { RO.geq[+k] = clamp(Math.round(+o.geq[k]), 0, 12); }); applyEqAudio(); roCheck(); roUI(); }
    if (o.place != null) setPlace(o.place);
    if (o.emInput) emInput(o.emInput.kind, o.emInput.ch, o.emInput.value);
    if (o.earCompare != null) { EAR.compare = !!o.earCompare; earRender(); }
    if (o.earMix != null) { EAR.mix = !!o.earMix; earRender(); }
    if (o.resetProgress) { done = {}; saveDone(); renderCheck(); }
    if (o.tick) tick();
    return state();
  }
  function ff(kind) {   // 테스트용 빨리 감기: 'howl' = 지금 하울링 시작, 'timeout' = 8초 지난 것으로
    var t = now();
    if ((kind || 'howl') === 'howl' && EM.status === 'announce' && EM.cur) EM.cur.howlAt = t;
    if (kind === 'timeout' && EM.status === 'howl' && EM.cur) EM.cur.howlStart = t - 8.5;
    if (S.mode === 'emerg') emTick(t, 0.06);
    return state();
  }

  window.FBTrainer = { state: state, set: set, mode: function (m) { setMode(m); return state(); }, stop: function () { stop(); return state(); }, ff: ff };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
