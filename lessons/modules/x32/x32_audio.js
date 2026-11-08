/* READY — X32Audio (2026-11-08, 오디오 작업자). Web Audio 엔진 — X32Model 의 상태를 그대로 소리로 만들어요.
   =============================================================================
   var a = X32Audio.create(model, opts)
     opts: { sources:[{name,url}|…] (안 주면 X32Audio.DEFAULT_STEMS = 저장소 sources/ 스템 8개, 이름으로 자동 연결 · [] 면 음원 없음),
             onReady(a), onStatus({phase,loaded,total,mode}), onMeters(meters), listen:'main', mode:'auto'|'buffer'|'stream',
             volume:1, outGain:6(dB, 사이트 스피커 앰프 — 미터와 무관, 뒤에 리미터), worklet:true, context(테스트용) }
   a.start()            // 「소리 켜기」 단추에서 부르기(사용자 클릭 안). AudioContext 를 이때 만들어요. → Promise
   a.stop()             // 잠깐 멈춤(위치 기억 · 미터 −∞). 다시 a.start() 하면 이어서 재생
   a.destroy()          // 완전히 끝(모델 알림 끊기 · AudioContext 닫기)
   a.setSources(list)   // 스템 바꿔 끼우기. list: [{ name, url | file | data(ArrayBuffer) | buffer(AudioBuffer),
                        //   target?:{type:'ch',index} | Local 번호(0..31) | 'Local 5', side?:'L'|'R'|'mono', stereo?:true(L→잭 n, R→n+1) }] → Promise(매핑)
                        //   url 이 sources/xxx.mp3 이면 index.html 의 base64(MG12XU_SOURCE_AUDIO_BASE64) 를 먼저 써서 file:// 에서도 소리 남
   a.loadFiles(files, { append })   // 사용자가 끌어 넣은 FileList — 파일 이름으로 채널을 찾아 꽂아요(앞 번호 01_ 무시, 못 찾으면 번호로) → Promise(매핑)
   a.assign(stem, target, side)     // 직접 고르기(옮기기): stem = 이름 또는 번호, target = {type:'ch',index} | Local 번호 | null(빼기). 4번째 { keep:true } 면 나눠 꽂기
   a.mapping()          // [{ socket, input:'Local 05', stage, stem, side }]  지금 어느 입력 잭에 어떤 스템이 꽂혔나
   a.stems()            // [{ key, name, channels, duration, loaded, error, peak, stream }]
   a.listen(target)     // 사이트 스피커로 들을 곳: 'main'(기본, SOLO 켜지면 솔로 버스로) | 'solo' | 'monitor'(config.monitor.source) | 'm'
                        //   | {type:'bus',index:0..15} | {type:'mtx',index:0..5} | 'bus 3' (1부터)  → 지금 값. SOLO 가 켜지면 어느 것이든 솔로 버스가 이겨요(X32 헤드폰처럼)
                        //   main 말고는 모니터 레벨(config.monitor.level, −20 dB 일 때 메인과 같은 크기) · DIM · MONO 가 걸려요
   a.setVolume(0..1.5)  // 사이트 전체 소리 크기(콘솔과 무관한 마지막 볼륨)
   a.seek(sec) / a.position() / a.status() / a.whenLoaded() / a.mode() / a.syncInfo()  a.running  a.ctx  a.output(콘솔 출력 노드)
   모델 쪽 선택 항목(있으면 씀): ch.N.dyn.pos 'PRE'(EQ 앞) | 'POST'(기본, EQ 뒤) · ch.N.preamp.lowcut.slope 12|18|24 · gate/dyn.keySrc 'Ch 05'·'Aux 2'·'FX 1L'
     · gate/dyn.filter {on, type:'LC6'|'HC12'|'1.0'..'10.0'(대역 Q), freq} · fx[k].source {l,r:'MixBus 13'|'Main L'…} · fx[k].return(FX 리턴 채널 L 번호)
   미터(model.meters, 초당 약 43번, dBFS · 소리 없으면 −Infinity):
     ch/aux/fxr = 채널 미터(X32 채널 미터처럼 페이더 앞 · 처리 뒤), chIn/auxIn/fxrIn = GAIN 바로 뒤, chPost… = 페이더 뒤
     bus[16] mtx[6] main{l,r,m} solo{l,r} mon{l,r}(사이트로 나가는 소리) fx[8](FX1L,1R…4R 들어가는 소리)
     gate.ch[32] = 게이트가 줄인 dB(0 = 열림), gr.ch[32] · gr.bus[16] · gr.main = 컴프가 줄인 dB(양수)
   X32Audio.dsp: compGain(inDb, thr, ratio, knee, mode) · gateGain(inDb, mode, thr, range) · eqResponse(bands, freqs, fs) — 화면 그래프용(엔진과 같은 식)
   X32Audio.matchFiles(names, model) → 파일 이름만으로 어느 입력에 꽂힐지 미리 보기
   ============================================================================= */
(function () {
  'use strict';
  var NINF = -Infinity, OFFDB = -90;

  /* =========================================================================
     1) DSP 코어 — AudioWorklet 안(또는 예비로 ScriptProcessor)에서 그대로 돌아가는 함수.
        이 함수의 소스 글자를 Worklet 모듈로 보내기 때문에 바깥 변수를 쓰면 안 돼요.
     ========================================================================= */
  function coreFactory() {
    var NS = 48, NB = 16, NX = 6, BL = 128;
    var M_STRIP = 5, M_BUS = NS * 5, M_MTX = M_BUS + NB, M_MAIN = M_MTX + NX, M_SOLO = M_MAIN + 3, M_LIS = M_SOLO + 2, M_FX = M_LIS + 2, M_POS = M_FX + 8, M_BGR = M_POS + 1, M_MGR = M_BGR + NB, MLEN = M_MGR + 2;
    var KNEE_DB = 4;   // X32 knee 0..5 → 무릎 폭 0..20 dB
    function db2(x) { return Math.exp(x * 0.11512925464970229); }
    function l2db(x) { return x > 1e-15 ? 8.685889638065035 * Math.log(x) : -300; }
    function tc(ms, fs) { return ms <= 0 ? 0 : Math.exp(-1000 / (ms * fs)); }
    function BQ() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; this.w1 = 0; this.w2 = 0; this.sig = ''; this.pass = true; }
    // t: 0 HP(LCut) 1 LShv 2 PEQ 3 VEQ 4 HShv 5 LP(HCut) 6 BP 7 HP 1차 8 LP 1차
    function design(q, t, f, g, Q, fs) {
      var sig = t + '|' + f + '|' + g + '|' + Q; if (q.sig === sig) return; q.sig = sig;
      f = Math.max(10, Math.min(f, fs * 0.45)); Q = Math.max(0.1, Q || 0.707);
      q.pass = (t >= 1 && t <= 4 && Math.abs(g) < 0.01);
      var w0 = 2 * Math.PI * f / fs, cs = Math.cos(w0), sn = Math.sin(w0), A = Math.pow(10, g / 40), al, b0, b1, b2, a0, a1, a2, sq;
      if (t === 7 || t === 8) { var k = Math.tan(w0 / 2), n = 1 / (1 + k); if (t === 7) { b0 = n; b1 = -n; } else { b0 = k * n; b1 = k * n; } q.b0 = b0; q.b1 = b1; q.b2 = 0; q.a1 = (k - 1) * n; q.a2 = 0; return; }
      if (t === 3) Q = Q * (0.3 + 0.7 * Math.min(Math.abs(g), 15) / 15);   // VEQ: 조금만 올리면 넓게(빈티지 방식)
      al = sn / (2 * Q);
      if (t === 0) { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
      else if (t === 5) { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
      else if (t === 6) { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
      else if (t === 1 || t === 4) {   // 셸빙(S = 1)
        al = sn / 2 * Math.SQRT2; sq = 2 * Math.sqrt(A) * al;
        if (t === 1) { b0 = A * ((A + 1) - (A - 1) * cs + sq); b1 = 2 * A * ((A - 1) - (A + 1) * cs); b2 = A * ((A + 1) - (A - 1) * cs - sq); a0 = (A + 1) + (A - 1) * cs + sq; a1 = -2 * ((A - 1) + (A + 1) * cs); a2 = (A + 1) + (A - 1) * cs - sq; }
        else { b0 = A * ((A + 1) + (A - 1) * cs + sq); b1 = -2 * A * ((A - 1) + (A + 1) * cs); b2 = A * ((A + 1) + (A - 1) * cs - sq); a0 = (A + 1) - (A - 1) * cs + sq; a1 = 2 * ((A - 1) - (A + 1) * cs); a2 = (A + 1) - (A - 1) * cs - sq; }
      } else { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }
      q.b0 = b0 / a0; q.b1 = b1 / a0; q.b2 = b2 / a0; q.a1 = a1 / a0; q.a2 = a2 / a0;
    }
    function runBQ(q, x, n, second) {
      var b0 = q.b0, b1 = q.b1, b2 = q.b2, a1 = q.a1, a2 = q.a2, z1 = second ? q.w1 : q.z1, z2 = second ? q.w2 : q.z2, i, v, y;
      for (i = 0; i < n; i++) { v = x[i]; y = b0 * v + z1; z1 = b1 * v - a1 * y + z2; z2 = b2 * v - a2 * y; x[i] = y; }
      if (z1 < 1e-20 && z1 > -1e-20) z1 = 0; if (z2 < 1e-20 && z2 > -1e-20) z2 = 0;
      if (second) { q.w1 = z1; q.w2 = z2; } else { q.z1 = z1; q.z2 = z2; }
    }
    function eqDesign(bank, bands, fs) {   // bands: [[t,f,g,q]…]
      while (bank.length < bands.length) bank.push(new BQ());
      for (var i = 0; i < bands.length; i++) design(bank[i], bands[i][0], bands[i][1], bands[i][2], bands[i][3], fs);
    }
    function eqRun(bank, bands, x, n, second) { for (var i = 0; i < bands.length; i++) if (!bank[i].pass) runBQ(bank[i], x, n, second); }

    function Dyn() { this.gr = 0; this.gl = 1; this.ms = 0; this.hold = 0; this.avg = 0; this.max = 0; this.y1 = 0; this.yl = 0; this.env = 0; this.kq = new BQ(); this.kb = new Float32Array(BL); }
    // D: [on, mode(0 COMP 1 EXP), thr, ratio, knee, att, hold, rel, makeup, auto, rms, lin, mix(0..1), pre, key, kfType, kfFreq, kfQ]
    // 감지: COMP = 「매끈한 분리형 피크 감지」(줄일 양을 바로 잡고 HOLD 뒤 RELEASE 로 놓음 → ATTACK 으로 부드럽게),
    //       EXP = 소리 크기 엔벨로프로 열고(ATTACK) 닫음(RELEASE). LOG = dB 로 부드럽게, LIN = 선형 게인으로 부드럽게
    function dynRun(st, D, x, key, n, fs, key2) {
      var mode = D[1], T = D[2], R = D[3], W = D[4] * KNEE_DB, att = D[5], rel = D[7], mk = D[8], mix = D[12], i, k, lv, L, g, o, sl, c;
      if (D[9]) { att = 10; rel = 40 + 60 * st.avg; if (rel > 1500) rel = 1500; }
      var aC = tc(att, fs), rC = tc(rel, fs), holdN = D[6] * fs / 1000, rmsC = tc(10, fs), envR = tc(15, fs), rms = D[10], lin = D[11];
      var kb = key;
      if (D[15] >= 0) { kb = st.kb; for (i = 0; i < n; i++) kb[i] = key2 ? Math.max(Math.abs(key[i]), Math.abs(key2[i])) : key[i]; design(st.kq, D[15], D[16], 0, D[15] === 6 ? D[17] : 0.707, fs); runBQ(st.kq, kb, n); key2 = null; }
      var ms = st.ms, hold = st.hold, mx = st.max, y1 = st.y1, yl = st.yl, env = st.env, mkl = db2(mk), w2 = W / 2, gl = st.gl, gr = st.gr;
      sl = mode === 0 ? 1 / R - 1 : -(R - 1);
      for (i = 0; i < n; i++) {
        k = kb[i]; if (k < 0) k = -k; if (key2) { var k2 = key2[i]; if (k2 < 0) k2 = -k2; if (k2 > k) k = k2; }
        if (rms) { ms = k * k + (ms - k * k) * rmsC; lv = Math.sqrt(ms); } else lv = k;
        if (mode === 1) { env = lv > env ? lv : env * envR; lv = env; }
        L = l2db(lv);
        o = mode === 0 ? L - T : T - L;
        if (W > 0 && o > -w2 && o < w2) g = sl * (o + w2) * (o + w2) / (2 * W); else g = o > 0 ? sl * o : 0;
        if (g < -80) g = -80;
        c = lin ? 1 - db2(g) : -g;   // 줄일 양(LOG: dB, LIN: 0..1)
        if (mode === 0) {
          if (c >= y1) { y1 = c; hold = holdN; } else if (hold > 0) hold--; else y1 = c + (y1 - c) * rC;
          yl = y1 + (yl - y1) * aC;
        } else {
          if (c < yl) { yl = c + (yl - c) * aC; hold = holdN; } else if (hold > 0) hold--; else yl = c + (yl - c) * rC;
        }
        if (lin) { gl = 1 - yl; if (gl < 1e-4) gl = 1e-4; gr = l2db(gl); } else { gr = -yl; gl = db2(gr); }
        if (-gr > mx) mx = -gr;
        var y = x[i] * gl * mkl; x[i] = mix >= 1 ? y : x[i] * (1 - mix) + y * mix;
      }
      st.gr = gr; st.gl = gl; st.ms = ms; st.hold = hold; st.max = mx; st.y1 = y1; st.yl = yl; st.env = env; st.avg = st.avg * 0.995 + (-gr) * 0.005;
    }
    function Gate() { this.env = 0; this.g = 0; this.hold = 0; this.open = false; this.max = 0; this.kq = new BQ(); this.kb = new Float32Array(BL); }
    // G: [on, mode(0 EXP2 1 EXP3 2 EXP4 3 GATE 4 DUCK), thr, range, att, hold, rel, key, kfType, kfFreq, kfQ]
    function gateRun(st, G, x, key, n, fs) {
      // ATTACK = 다 열리는 데 걸리는 시간, RELEASE = RANGE 만큼 다 닫히는 데 걸리는 시간(dB 직선)
      var mode = G[1], thrL = db2(G[2]), clsL = db2(G[2] - 2), rng = -G[3], upS = G[4] > 0 ? G[3] / (G[4] * fs / 1000) : 1e9, dnS = G[3] / (Math.max(1, G[6]) * fs / 1000), holdN = G[5] * fs / 1000, envR = tc(15, fs), ratio = mode + 2, i, k, tgt;
      var kb = key;
      if (G[8] >= 0) { kb = st.kb; for (i = 0; i < n; i++) kb[i] = key[i]; design(st.kq, G[8], G[9], 0, G[8] === 6 ? G[10] : 0.707, fs); runBQ(st.kq, kb, n); }
      var env = st.env, gd = st.g, hold = st.hold, open = st.open, mx = st.max;
      for (i = 0; i < n; i++) {
        k = kb[i]; if (k < 0) k = -k; env = k > env ? k : env * envR;
        if (env >= thrL || (open && env >= clsL)) { open = true; hold = holdN; } else if (hold > 0) hold--; else open = false;
        if (mode === 4) tgt = open ? rng : 0;
        else if (mode === 3) tgt = open ? 0 : rng;
        else { if (open) tgt = 0; else { tgt = (l2db(env) - G[2]) * (ratio - 1); if (tgt < rng) tgt = rng; if (tgt > 0) tgt = 0; } }
        if (tgt > gd) { gd += mode === 4 ? dnS : upS; if (gd > tgt) gd = tgt; } else if (tgt < gd) { gd -= mode === 4 ? upS : dnS; if (gd < tgt) gd = tgt; }
        if (gd < -0.0005) x[i] *= db2(gd);
        if (-gd > mx) mx = -gd;
      }
      st.env = env; st.g = gd; st.hold = hold; st.open = open; st.max = mx;
    }
    function Ramp(v) { this.c = v || 0; }   // 블록마다 직선으로 목표값까지(지퍼 소리 막기)

    function makeCore(fs) {
      var core = { fs: fs, P: null, stems: [], t: 0, songLen: 0, playing: false, playG: 0, mframes: 1024, mcount: 0, onMeters: null };
      var meters = new Float32Array(MLEN);
      function newStrip() {
        return { tIN: new Float32Array(BL), tPRE: new Float32Array(BL), tPOST: new Float32Array(BL), x: new Float32Array(BL), lc: [new BQ(), new BQ()], lc1: new BQ(), eq: [], gate: new Gate(), dyn: new Dyn(),
          dl: null, dlw: 0, g: new Ramp(0), post: new Ramp(0), mu: new Ramp(0), mL: new Ramp(0), mR: new Ramp(0), mM: new Ramp(0), sL: new Ramp(0), sR: new Ramp(0), send: [], active: false, pk: [0, 0, 0] };
      }
      var S = []; for (var i = 0; i < NS; i++) { S.push(newStrip()); for (var b = 0; b < NB; b++) S[i].send.push(new Ramp(0)); }
      function newOut() { return { buf: new Float32Array(BL), out: new Float32Array(BL), eq: [], dyn: new Dyn(), fg: new Ramp(0), mL: new Ramp(0), mR: new Ramp(0), mM: new Ramp(0), mtx: [], used: false, tail: 0 }; }
      var B = [], X = []; for (i = 0; i < NB; i++) { B.push(newOut()); for (b = 0; b < NX; b++) B[i].mtx.push(new Ramp(0)); } for (i = 0; i < NX; i++) X.push(newOut());
      var MN = { L: new Float32Array(BL), R: new Float32Array(BL), oL: new Float32Array(BL), oR: new Float32Array(BL), eq: [], dyn: new Dyn(), fgL: new Ramp(0), fgR: new Ramp(0), mtxL: [], mtxR: [] };
      var MM = newOut(); for (i = 0; i < NX; i++) { MN.mtxL.push(new Ramp(0)); MN.mtxR.push(new Ramp(0)); MM.mtx.push(new Ramp(0)); }
      var SO = { L: new Float32Array(BL), R: new Float32Array(BL) }, LIS = { g: new Ramp(0) }, ZERO = new Float32Array(BL), K3 = new Float32Array(BL);
      var playR = new Ramp(0);

      core.setParams = function (P) {
        core.P = P; core.playing = !!P.playing;
        for (var i = 0; i < NS; i++) {
          var p = P.strips[i], s = S[i]; s.active = !!p;
          if (!p) continue;
          if (p.eq) eqDesign(s.eq, p.eq, fs);
          if (p.lc) { if (p.lc[0] === 24) { design(s.lc[0], 0, p.lc[1], 0, 0.5412, fs); design(s.lc[1], 0, p.lc[1], 0, 1.3066, fs); } else if (p.lc[0] === 18) { design(s.lc[0], 0, p.lc[1], 0, 1.0, fs); design(s.lc1, 7, p.lc[1], 0, 0, fs); } else design(s.lc[0], 0, p.lc[1], 0, 0.7071, fs); }
          if (p.dly > 0 && !s.dl) { s.dl = new Float32Array(Math.ceil(fs * 0.51)); s.dlw = 0; }
        }
        for (i = 0; i < NB; i++) if (P.buses[i] && P.buses[i].eq) eqDesign(B[i].eq, P.buses[i].eq, fs);
        for (i = 0; i < NX; i++) if (P.mtx[i] && P.mtx[i].eq) eqDesign(X[i].eq, P.mtx[i].eq, fs);
        if (P.main.eq) eqDesign(MN.eq, P.main.eq, fs);
        if (P.mono.eq) eqDesign(MM.eq, P.mono.eq, fs);
      };
      core.addStem = function (id, data, rate, peak) { core.stems[id] = { d: data, len: data.length, rate: rate, k: rate / fs, sc: data instanceof Int16Array ? 1 / 32768 : 1 }; core.recalcLen(); };
      core.dropStem = function (id) { core.stems[id] = null; core.recalcLen(); };
      core.recalcLen = function () { var L = 0; core.stems.forEach(function (s) { if (s) L = Math.max(L, Math.round(s.len / s.k)); }); core.songLen = L; if (L && core.t >= L) core.t = core.t % L; };
      core.seek = function (sec) { core.t = Math.max(0, Math.round(sec * fs)); if (core.songLen) core.t %= core.songLen; };

      function readStem(id, out, n, t0, gain) {   // 곡 위치 t0(fs 단위)부터 n 개, 반복 재생
        var s = core.stems[id]; if (!s) { for (var i = 0; i < n; i++) out[i] = 0; return; }
        var d = s.d, len = s.len, k = s.k, sc = s.sc * gain, L = core.songLen || 1, i2, p, j, fr;
        if (k === 1) { for (i2 = 0; i2 < n; i2++) { p = (t0 + i2) % L; out[i2] = p < len ? d[p] * sc : 0; } return; }
        for (i2 = 0; i2 < n; i2++) { p = ((t0 + i2) % L) * k; j = p | 0; fr = p - j; out[i2] = j + 1 < len ? (d[j] + (d[j + 1] - d[j]) * fr) * sc : 0; }
      }
      function ramp(r, tgt, n) { var c = r.c, inc = (tgt - c) / n; r.c = tgt; return inc === 0 ? null : [c, inc]; }

      core.process = function (inStream, inFx, outL, outR, outFx, n) {
        var P = core.P, i, j, b, s, p, x, v;
        for (i = 0; i < n; i++) { outL[i] = 0; outR[i] = 0; }
        for (j = 0; j < 8; j++) if (outFx[j]) for (i = 0; i < n; i++) outFx[j][i] = 0;
        if (!P) return;
        var pg0 = playR.c, pgT = P.stream ? 1 : (core.playing ? 1 : 0), pgInc = (pgT - pg0) / n; playR.c = pgT;
        var t0 = core.t, moving = core.playing && core.songLen > 0 && !P.stream;
        for (b = 0; b < NB; b++) { B[b].buf.fill(0); B[b].used = false; }
        for (b = 0; b < NX; b++) { X[b].buf.fill(0); X[b].used = false; }
        MN.L.fill(0); MN.R.fill(0); MM.buf.fill(0); SO.L.fill(0); SO.R.fill(0);
        var pfl = P.pfl, anySolo = P.anySolo;

        /* ---- 입력 채널 48개(ch 32 · aux 8 · fx return 8) ---- */
        for (var si = 0; si < NS; si++) {
          p = P.strips[si]; s = S[si];
          if (!p) { if (s.wasOn) { s.tIN.fill(0); s.wasOn = false; s.gate.g = 0; s.dyn.gr = 0; s.dyn.gl = 1; s.dyn.y1 = s.dyn.yl = 0; } continue; }
          s.wasOn = true;
          x = s.x;
          // 1) 소리 넣기
          if (p.sk === 1) { readStem(p.a, x, n, t0, p.lvl); if (p.b >= 0) { readStem(p.b, s.tPRE, n, t0, p.lvl); for (i = 0; i < n; i++) x[i] = (x[i] + s.tPRE[i]) * 0.5; } }
          else if (p.sk === 2) { var ia = inStream && inStream[p.a], ib = p.b >= 0 && inStream && inStream[p.b]; for (i = 0; i < n; i++) x[i] = ia ? (ib ? (ia[i] + ib[i]) * 0.5 : ia[i]) * p.lvl : 0; }
          else if (p.sk === 3) { var fa = inFx && inFx[p.a]; for (i = 0; i < n; i++) x[i] = fa ? fa[i] : 0; }
          else x.fill(0);
          if (p.sk === 1 || p.sk === 2) { if (pgInc === 0) { if (pg0 !== 1) for (i = 0; i < n; i++) x[i] *= pg0; } else for (i = 0; i < n; i++) x[i] *= pg0 + pgInc * i; }
          // 2) 프리앰프: GAIN · Ø · 딜레이 · LOW CUT
          var rg = ramp(s.g, p.g, n);
          if (rg) { for (i = 0; i < n; i++) x[i] *= rg[0] + rg[1] * i; } else if (p.g !== 1) for (i = 0; i < n; i++) x[i] *= p.g;
          if (p.dly > 0 && s.dl) { var dl = s.dl, L = dl.length, w = s.dlw, dn = Math.min(L - 1, p.dly | 0); for (i = 0; i < n; i++) { dl[w] = x[i]; var r = w - dn; if (r < 0) r += L; x[i] = dl[r]; w++; if (w >= L) w = 0; } s.dlw = w; }
          if (p.lc) { runBQ(s.lc[0], x, n); if (p.lc[0] === 24) runBQ(s.lc[1], x, n); else if (p.lc[0] === 18) runBQ(s.lc1, x, n); }
          var pk = 0; for (i = 0; i < n; i++) { v = x[i]; if (v < 0) v = -v; if (v > pk) pk = v; }
          if (pk > s.pk[0]) s.pk[0] = pk;
          s.tIN.set(x);
          // 3) GATE
          if (p.gt) gateRun(s.gate, p.gt, x, p.gt[7] >= 0 && p.gt[7] !== si ? S[p.gt[7]].tIN : x, n, fs);
          else s.gate.g = 0;
          s.tPRE.set(x);
          // 4) EQ · DYNAMICS (DYN 위치 PRE = EQ 앞, POST = EQ 뒤)
          var dk;
          if (p.dy && p.dy[13]) { dk = p.dy[14] >= 0 && p.dy[14] !== si ? S[p.dy[14]].tIN : s.tPRE; dynRun(s.dyn, p.dy, x, dk, n, fs); }
          if (p.eq) eqRun(s.eq, p.eq, x, n);
          s.tPOST.set(x);
          if (p.dy && !p.dy[13]) { dk = p.dy[14] >= 0 && p.dy[14] !== si ? S[p.dy[14]].tIN : s.tPOST; dynRun(s.dyn, p.dy, x, dk, n, fs); }
          if (!p.dy) { s.dyn.gr = 0; s.dyn.gl = 1; s.dyn.y1 = s.dyn.yl = 0; }
          pk = 0; for (i = 0; i < n; i++) { v = x[i]; if (v < 0) v = -v; if (v > pk) pk = v; }
          if (pk > s.pk[1]) s.pk[1] = pk;
          // 5) 페이더 · 뮤트 · PAN → MAIN LR / M · 솔로 · 센드
          var rp = ramp(s.post, p.fg, n), rL = ramp(s.mL, p.mL, n), rR = ramp(s.mR, p.mR, n), rM = ramp(s.mM, p.mM, n), rsL = ramp(s.sL, p.sL, n), rsR = ramp(s.sR, p.sR, n);
          var cP = rp ? rp[0] : p.fg, dP = rp ? rp[1] : 0, cL = rL ? rL[0] : p.mL, dL = rL ? rL[1] : 0, cR = rR ? rR[0] : p.mR, dR = rR ? rR[1] : 0, cM = rM ? rM[0] : p.mM, dM = rM ? rM[1] : 0;
          var cSL = rsL ? rsL[0] : p.sL, dSL = rsL ? rsL[1] : 0, cSR = rsR ? rsR[0] : p.sR, dSR = rsR ? rsR[1] : 0;
          var mL = MN.L, mR = MN.R, mM = MM.buf, soL = SO.L, soR = SO.R, pp = 0, doMain = cL !== 0 || dL !== 0 || cR !== 0 || dR !== 0, doM = cM !== 0 || dM !== 0, doSo = cSL !== 0 || dSL !== 0 || cSR !== 0 || dSR !== 0;
          for (i = 0; i < n; i++) {
            v = x[i]; var po = v * (cP + dP * i); if (po < 0) { if (-po > pp) pp = -po; } else if (po > pp) pp = po;
            if (doMain) { mL[i] += v * (cL + dL * i); mR[i] += v * (cR + dR * i); }
            if (doM) mM[i] += v * (cM + dM * i);
            if (doSo) { soL[i] += v * (cSL + dSL * i); soR[i] += v * (cSR + dSR * i); }
          }
          if (pp > s.pk[2]) s.pk[2] = pp;
          var sends = p.sends;
          for (b = 0; b < NB; b++) {
            var sd = sends[b], rr = s.send[b];
            var tg = sd ? sd[1] : 0; if (tg === 0 && rr.c === 0) continue;
            var src = !sd ? x : sd[0] === 0 ? s.tIN : sd[0] === 1 ? s.tPRE : sd[0] === 2 ? s.tPOST : x;
            var c0 = rr.c, inc = (tg - c0) / n, bb = B[b].buf; rr.c = tg; B[b].used = true;
            for (i = 0; i < n; i++) bb[i] += src[i] * (c0 + inc * i);
          }
        }

        /* ---- 믹스 버스 16 ---- */
        for (b = 0; b < NB; b++) {
          var pb = P.buses[b], bo = B[b]; if (!pb) { bo.out.fill(0); continue; }
          if (bo.used) bo.tail = Math.ceil(fs * 0.5 / n); else if (bo.tail > 0) bo.tail--;
          if (!bo.used && bo.tail <= 0 && bo.fg.c === 0 && bo.mL.c === 0) { bo.out.fill(0); continue; }
          x = bo.buf;
          if (pb.dy && pb.dy[13]) dynRun(bo.dyn, pb.dy, x, x, n, fs);
          if (pb.eq) eqRun(bo.eq, pb.eq, x, n);
          if (pb.dy && !pb.dy[13]) dynRun(bo.dyn, pb.dy, x, x, n, fs);
          if (!pb.dy) bo.dyn.gr = 0;
          var rf = ramp(bo.fg, pb.fg, n), o = bo.out, c1 = rf ? rf[0] : pb.fg, d1 = rf ? rf[1] : 0;
          for (i = 0; i < n; i++) o[i] = x[i] * (c1 + d1 * i);
          var rbl = ramp(bo.mL, pb.mL, n), rbr = ramp(bo.mR, pb.mR, n), rbm = ramp(bo.mM, pb.mM, n);
          var bl0 = rbl ? rbl[0] : pb.mL, bld = rbl ? rbl[1] : 0, br0 = rbr ? rbr[0] : pb.mR, brd = rbr ? rbr[1] : 0, bm0 = rbm ? rbm[0] : pb.mM, bmd = rbm ? rbm[1] : 0;
          if (bl0 || bld || br0 || brd) for (i = 0; i < n; i++) { MN.L[i] += o[i] * (bl0 + bld * i); MN.R[i] += o[i] * (br0 + brd * i); }
          if (bm0 || bmd) for (i = 0; i < n; i++) MM.buf[i] += o[i] * (bm0 + bmd * i);
          for (j = 0; j < NX; j++) { var tgm = pb.mtx[j] || 0, rm = bo.mtx[j]; if (tgm === 0 && rm.c === 0) continue; var cm0 = rm.c, im = (tgm - cm0) / n, xb = X[j].buf; rm.c = tgm; X[j].used = true; for (i = 0; i < n; i++) xb[i] += o[i] * (cm0 + im * i); }
          if (pb.solo) { var sl2 = pb.solo[0], sr2 = pb.solo[1]; for (i = 0; i < n; i++) { SO.L[i] += o[i] * sl2; SO.R[i] += o[i] * sr2; } }
          pk = 0; for (i = 0; i < n; i++) { v = o[i]; if (v < 0) v = -v; if (v > pk) pk = v; } if (pk > meters[M_BUS + b]) meters[M_BUS + b] = pk;
          if (bo.dyn.max > meters[M_BGR + b]) meters[M_BGR + b] = bo.dyn.max; bo.dyn.max = 0;
        }

        /* ---- MAIN LR · M/C ---- */
        var pm = P.main;
        if (pm.dy && pm.dy[13]) dynStereo(MN, pm.dy, n);
        if (pm.eq) { eqRun(MN.eq, pm.eq, MN.L, n, false); eqRun(MN.eq, pm.eq, MN.R, n, true); }
        if (pm.dy && !pm.dy[13]) dynStereo(MN, pm.dy, n);
        if (!pm.dy) { MN.dyn.gr = 0; MN.dyn.gl = 1; }
        var rfl = ramp(MN.fgL, pm.fL, n), rfr = ramp(MN.fgR, pm.fR, n), fl0 = rfl ? rfl[0] : pm.fL, fld = rfl ? rfl[1] : 0, fr0 = rfr ? rfr[0] : pm.fR, frd = rfr ? rfr[1] : 0;
        var oL = MN.oL, oR = MN.oR, pkL = 0, pkR = 0;
        for (i = 0; i < n; i++) { oL[i] = MN.L[i] * (fl0 + fld * i); oR[i] = MN.R[i] * (fr0 + frd * i); v = oL[i] < 0 ? -oL[i] : oL[i]; if (v > pkL) pkL = v; v = oR[i] < 0 ? -oR[i] : oR[i]; if (v > pkR) pkR = v; }
        if (pkL > meters[M_MAIN]) meters[M_MAIN] = pkL; if (pkR > meters[M_MAIN + 1]) meters[M_MAIN + 1] = pkR;
        if (MN.dyn.max > meters[M_MGR]) meters[M_MGR] = MN.dyn.max; MN.dyn.max = 0;
        for (j = 0; j < NX; j++) { var gL = pm.mtx[j] ? pm.mtx[j][0] : 0, gR = pm.mtx[j] ? pm.mtx[j][1] : 0, ra = MN.mtxL[j], rb = MN.mtxR[j]; if (gL === 0 && gR === 0 && ra.c === 0 && rb.c === 0) continue; var a0 = ra.c, ai = (gL - a0) / n, b0 = rb.c, bi = (gR - b0) / n, xb2 = X[j].buf; ra.c = gL; rb.c = gR; X[j].used = true; for (i = 0; i < n; i++) xb2[i] += oL[i] * (a0 + ai * i) + oR[i] * (b0 + bi * i); }
        if (pm.solo) for (i = 0; i < n; i++) { SO.L[i] += oL[i]; SO.R[i] += oR[i]; }
        var pmm = P.mono; x = MM.buf;
        if (pmm.dy && pmm.dy[13]) dynRun(MM.dyn, pmm.dy, x, x, n, fs);
        if (pmm.eq) eqRun(MM.eq, pmm.eq, x, n);
        if (pmm.dy && !pmm.dy[13]) dynRun(MM.dyn, pmm.dy, x, x, n, fs);
        var rmm = ramp(MM.fg, pmm.fg, n), mm0 = rmm ? rmm[0] : pmm.fg, mmd = rmm ? rmm[1] : 0, om = MM.out; pk = 0;
        for (i = 0; i < n; i++) { om[i] = x[i] * (mm0 + mmd * i); v = om[i] < 0 ? -om[i] : om[i]; if (v > pk) pk = v; }
        if (pk > meters[M_MAIN + 2]) meters[M_MAIN + 2] = pk;
        for (j = 0; j < NX; j++) { var gm = pmm.mtx[j] || 0, rq = MM.mtx[j]; if (gm === 0 && rq.c === 0) continue; var q0 = rq.c, qi = (gm - q0) / n, xb3 = X[j].buf; rq.c = gm; X[j].used = true; for (i = 0; i < n; i++) xb3[i] += om[i] * (q0 + qi * i); }
        if (pmm.solo) for (i = 0; i < n; i++) { SO.L[i] += om[i]; SO.R[i] += om[i]; }

        /* ---- MATRIX 6 ---- */
        for (j = 0; j < NX; j++) {
          var px = P.mtx[j], xo = X[j]; if (!px || (!xo.used && xo.fg.c === 0)) { xo.out.fill(0); continue; }
          x = xo.buf;
          if (px.dy && px.dy[13]) dynRun(xo.dyn, px.dy, x, x, n, fs);
          if (px.eq) eqRun(xo.eq, px.eq, x, n);
          if (px.dy && !px.dy[13]) dynRun(xo.dyn, px.dy, x, x, n, fs);
          var rx = ramp(xo.fg, px.fg, n), x0 = rx ? rx[0] : px.fg, xd = rx ? rx[1] : 0, ox = xo.out; pk = 0;
          for (i = 0; i < n; i++) { ox[i] = x[i] * (x0 + xd * i); v = ox[i] < 0 ? -ox[i] : ox[i]; if (v > pk) pk = v; }
          if (pk > meters[M_MTX + j]) meters[M_MTX + j] = pk;
          if (px.solo) for (i = 0; i < n; i++) { SO.L[i] += ox[i]; SO.R[i] += ox[i]; }
        }

        /* ---- FX 보내기(FX1-4 L/R) ---- */
        for (j = 0; j < 8; j++) {
          var code = P.fxs[j], dst = outFx[j]; if (!dst || code == null || code < 0) continue;
          var sb = code < 16 ? B[code].out : code === 16 ? oL : code === 17 ? oR : code === 18 ? om : ZERO;
          pk = 0; for (i = 0; i < n; i++) { dst[i] = sb[i]; v = sb[i] < 0 ? -sb[i] : sb[i]; if (v > pk) pk = v; }
          if (pk > meters[M_FX + j]) meters[M_FX + j] = pk;
        }

        /* ---- 솔로 버스 · 듣는 곳 ---- */
        pk = 0; var pk2 = 0; for (i = 0; i < n; i++) { v = SO.L[i] < 0 ? -SO.L[i] : SO.L[i]; if (v > pk) pk = v; v = SO.R[i] < 0 ? -SO.R[i] : SO.R[i]; if (v > pk2) pk2 = v; }
        if (pk > meters[M_SOLO]) meters[M_SOLO] = pk; if (pk2 > meters[M_SOLO + 1]) meters[M_SOLO + 1] = pk2;
        var Ls = P.listen, kind = Ls.k, srcL = oL, srcR = oR, lg = 1;
        if ((Ls.auto && anySolo) || kind === 1) { srcL = SO.L; srcR = SO.R; lg = Ls.mon; }
        else if (kind === 2) { srcL = B[Ls.i].out; srcR = Ls.i2 >= 0 ? B[Ls.i2].out : srcL; lg = Ls.mon; }
        else if (kind === 3) { srcL = srcR = X[Ls.i].out; lg = Ls.mon; }
        else if (kind === 4) { srcL = srcR = om; lg = Ls.mon; }
        else lg = Ls.main;
        var rl = ramp(LIS.g, lg, n), l0 = rl ? rl[0] : lg, ld = rl ? rl[1] : 0; pk = 0; pk2 = 0;
        for (i = 0; i < n; i++) {
          var gg = l0 + ld * i, a1 = srcL[i] * gg, a2 = srcR[i] * gg;
          if (Ls.mono) { a1 = a2 = (a1 + a2) * 0.5; }
          outL[i] = a1; outR[i] = a2; v = a1 < 0 ? -a1 : a1; if (v > pk) pk = v; v = a2 < 0 ? -a2 : a2; if (v > pk2) pk2 = v;
        }
        if (pk > meters[M_LIS]) meters[M_LIS] = pk; if (pk2 > meters[M_LIS + 1]) meters[M_LIS + 1] = pk2;

        if (moving) { core.t = t0 + n; if (core.t >= core.songLen) core.t -= core.songLen; }
        /* ---- 미터 모으기 ---- */
        core.mcount += n;
        if (core.mcount >= core.mframes) {
          core.mcount = 0;
          for (si = 0; si < NS; si++) { s = S[si]; var mb = si * M_STRIP; meters[mb] = s.pk[0]; meters[mb + 1] = s.pk[1]; meters[mb + 2] = s.pk[2]; meters[mb + 3] = s.active && P.strips[si].gt ? s.gate.max : 0; meters[mb + 4] = s.active && P.strips[si].dy ? s.dyn.max : 0; s.pk[0] = s.pk[1] = s.pk[2] = 0; s.gate.max = 0; s.dyn.max = 0; }
          meters[M_POS] = core.t / fs;
          if (core.onMeters) core.onMeters(meters);
          for (i = M_BUS; i < MLEN; i++) if (i !== M_POS) meters[i] = 0;
        }
      };
      function dynStereo(mn, D, n) {   // 스테레오 링크 컴프(L·R 큰 쪽으로 감지, 같은 이득을 L·R 에)
        var gains = K3; for (var i = 0; i < n; i++) gains[i] = 1;
        dynRun(mn.dyn, D, gains, mn.L, n, fs, mn.R);
        for (i = 0; i < n; i++) { mn.L[i] *= gains[i]; mn.R[i] *= gains[i]; }
      }
      core.meterLayout = { NS: NS, NB: NB, NX: NX, M_STRIP: M_STRIP, M_BUS: M_BUS, M_MTX: M_MTX, M_MAIN: M_MAIN, M_SOLO: M_SOLO, M_LIS: M_LIS, M_FX: M_FX, M_POS: M_POS, M_BGR: M_BGR, M_MGR: M_MGR, MLEN: MLEN };
      return core;
    }
    makeCore.dsp = { design: design, BQ: BQ, db2: db2, l2db: l2db, KNEE_DB: KNEE_DB };
    return makeCore;
  }

  var makeCore = coreFactory();

  /* ---- Worklet 모듈 글자(코어 + 프로세서) ---- */
  var WORKLET_SRC = 'var makeCore = (' + coreFactory.toString() + ')();\n' +
    'class X32Proc extends AudioWorkletProcessor {\n' +
    '  constructor() { super(); var self = this; this.core = makeCore(sampleRate); this.alive = true;\n' +
    '    this.core.onMeters = function (m) { self.port.postMessage({ t: "m", a: m.slice(0) }); };\n' +
    '    this.port.onmessage = function (e) { var d = e.data; if (d.t === "p") self.core.setParams(d.p); else if (d.t === "stem") self.core.addStem(d.id, d.data, d.rate); else if (d.t === "drop") self.core.dropStem(d.id); else if (d.t === "seek") self.core.seek(d.sec); else if (d.t === "mf") self.core.mframes = d.n; else if (d.t === "kill") self.alive = false; };\n' +
    '  }\n' +
    '  process(inputs, outputs) { var o0 = outputs[0], o1 = outputs[1]; var L = o0[0], R = o0[1] || o0[0]; var n = L.length;\n' +
    '    this.core.process(inputs[0], inputs[1], L, R, o1 || [], n); return this.alive; }\n' +
    '}\n' +
    'registerProcessor("x32-engine", X32Proc);\n';

  /* =========================================================================
     2) 화면 그래프용 도움 함수(엔진과 같은 식)
     ========================================================================= */
  var EQT = { LCut: 0, LShv: 1, PEQ: 2, VEQ: 3, HShv: 4, HCut: 5 };
  var dsp = {
    compGain: function (inDb, thr, ratio, knee, mode) {   // 줄어드는 양(dB, 0 이하)
      var W = (knee || 0) * makeCore.dsp.KNEE_DB, w2 = W / 2, o, sl = mode === 'EXP' ? -(ratio - 1) : 1 / ratio - 1;
      o = mode === 'EXP' ? thr - inDb : inDb - thr;
      var g = (W > 0 && o > -w2 && o < w2) ? sl * (o + w2) * (o + w2) / (2 * W) : (o > 0 ? sl * o : 0);
      return mode === 'EXP' ? Math.max(-80, g) : g;
    },
    gateGain: function (inDb, mode, thr, range) {
      var m = ['EXP2', 'EXP3', 'EXP4', 'GATE', 'DUCK'].indexOf(mode); if (m < 0) m = 3;
      if (m === 4) return inDb >= thr ? -range : 0; if (m === 3) return inDb >= thr ? 0 : -range;
      return inDb >= thr ? 0 : Math.max(-range, (inDb - thr) * (m + 1));
    },
    eqResponse: function (bands, freqs, fs) {   // 각 주파수에서 합친 dB
      fs = fs || 48000; var bq = [];
      (bands || []).forEach(function (b) { var q = new makeCore.dsp.BQ(); var t = EQT[b.type]; if (t == null) t = 2; makeCore.dsp.design(q, t, b.freq, b.gain || 0, (t === 0 || t === 5) ? 0.7071 : b.q, fs); bq.push(q); });
      return freqs.map(function (f) {
        var w = 2 * Math.PI * f / fs, db = 0;
        bq.forEach(function (q) { if (q.pass) return; var cr = Math.cos(w), ci = -Math.sin(w), c2r = Math.cos(2 * w), c2i = -Math.sin(2 * w);
          var nr = q.b0 + q.b1 * cr + q.b2 * c2r, ni = q.b1 * ci + q.b2 * c2i, dr = 1 + q.a1 * cr + q.a2 * c2r, di = q.a1 * ci + q.a2 * c2i;
          db += 10 * Math.log10((nr * nr + ni * ni) / (dr * dr + di * di)); });
        return db;
      });
    }
  };

  /* =========================================================================
     3) 기본 음원 · 이름 맞추기
     ========================================================================= */
  // 저장소 sources/ 스템(같은 곡, 191.5초, 44.1 kHz). peak = 파일 전체에서 가장 큰 순간(dBFS) — 스트리밍 모드에서 레벨 맞출 때 씀
  var DEFAULT_STEMS = [
    { name: 'leadVox', url: 'sources/leadVox.mp3', peak: -7.6 }, { name: 'bav1', url: 'sources/bav1.mp3', peak: -8.7 }, { name: 'bav2', url: 'sources/bav2.mp3', peak: -11.0 },
    { name: 'bav3', url: 'sources/bav3.mp3', peak: -11.4 }, { name: 'gt', url: 'sources/gt.mp3', peak: -12.0 }, { name: 'bass', url: 'sources/bass.mp3', peak: -8.7 },
    { name: 'keysLR', url: 'sources/keysLR.mp3', peak: -6.5 }, { name: 'drumLR', url: 'sources/drumLR.mp3', peak: -7.9 }
  ];
  function norm(s) { return String(s || '').toLowerCase().replace(/\.[a-z0-9]{2,4}$/, '').replace(/[\s_\-\.()\[\]]+/g, ' ').trim(); }
  // 무리(group): file = 파일 이름, ch = 무대 입력(채널) 이름. stereo 면 L/R 짝
  var GROUPS = [
    { id: 'lead', file: /lead|ld ?vo|main ?vo|leader|인도|리드|메인 ?보컬|^vox$|^vocal$/, ch: /인도|리드|lead|leader|ld ?vo|main ?vo|메인 ?보컬|^vox$|^vocal$/ },
    { id: 'bv1', file: /(bav|bgv|bv|back\w* ?vo\w*|cho\w*|singer|싱어|코러스|보컬) ?0?1$|^(bav|bgv|bv)$/, ch: /(싱어|singer|bv|bgv|cho\w*|코러스|보컬) ?0?1$/ },
    { id: 'bv2', file: /(bav|bgv|bv|back\w* ?vo\w*|cho\w*|singer|싱어|코러스|보컬) ?0?2$/, ch: /(싱어|singer|bv|bgv|cho\w*|코러스|보컬) ?0?2$/ },
    { id: 'bv3', file: /(bav|bgv|bv|back\w* ?vo\w*|cho\w*|singer|싱어|코러스|보컬) ?0?3$/, ch: /(싱어|singer|bv|bgv|cho\w*|코러스|보컬) ?0?3$/, fallback: ['choir'] },
    { id: 'ag', file: /^a ?(gt|gtr|guitar|기타)|ac\w* ?(gt|gtr|guitar)|^ag$|어쿠|통기타/, ch: /^a ?기타|^a ?gt|^ag$|어쿠|통기타|ac\w* ?(g|gt|gtr|guitar)$/ },
    { id: 'eg', file: /^e ?(gt|gtr|guitar|기타)|elec|^eg$|일렉/, ch: /^e ?기타|^e ?gt|^eg$|일렉|elec/ },
    { id: 'gtr', file: /^(gt|gtr|guitar|기타)( ?\d)?$/, ch: /기타|gtr|guitar|^gt$/, prefer: ['ag', 'eg'] },
    { id: 'bass', file: /bass|베이스|^bs$|^b ?gt$/, ch: /베이스|bass|^bs$/, not: /drum|kick|킥/ },
    { id: 'keys', file: /key|piano|pno|건반|피아노|키보드|synth|신스|organ|오르간|rhodes/, ch: /건반|key|piano|피아노|키보드|synth|신스/, stereo: true },
    { id: 'drums', file: /drum|드럼|^kit|^oh$|overhead/, ch: /^(드럼|drum|kit)/, stereo: true, fallback: ['oh'] },
    { id: 'oh', file: /^oh( ?[lr])?$|overhead|오버헤드/, ch: /^oh|overhead|오버헤드/, stereo: true },
    { id: 'kick', file: /kick|킥|^bd$|bass ?drum/, ch: /킥|kick|^bd$/ },
    { id: 'snare', file: /snare|스네어|^sd$/, ch: /스네어|snare|^sd$/ },
    { id: 'hat', file: /hi ?hat|^hh$|하이햇/, ch: /하이햇|hi ?hat|^hh$/ },
    { id: 'tom', file: /tom|탐/, ch: /탐|tom/ },
    { id: 'choir', file: /choir|성가대/, ch: /성가대|choir/, stereo: true },
    { id: 'pastor', file: /설교|pastor|preach|sermon|목사/, ch: /설교|pastor|preach|목사/ },
    { id: 'mc', file: /사회|^mc$|host/, ch: /사회|^mc$|host/ },
    { id: 'video', file: /영상|video|playback|^mr$|노트북|laptop|^pc$/, ch: /영상|video|노트북|laptop|^pc/, stereo: true }
  ];
  function sideOf(name) { var n = norm(name); return /( |^)l$|left|왼/.test(n) ? 'L' : /( |^)r$|right|오른/.test(n) ? 'R' : null; }
  function stripSide(n) { return n.replace(/(^| )(l|r|left|right)$/, '').trim(); }
  // names: 무대 입력 이름 32개(Local 1..32). 파일 하나 → [{socket, side}]
  function matchOne(fileName, chans, inputNames, used) {
    var f0 = norm(fileName), num = /^(\d{1,2})(\D|$)/.exec(f0), f = f0.replace(/^\d{1,3} */, '') || f0, fs = stripSide(f).replace(/ ?(lr|st|stereo)$/, ''), fSide = sideOf(fileName);
    var out = [];
    function free(i) { return i >= 0 && !used[i]; }
    function findCh(g, side) {
      for (var i = 0; i < inputNames.length; i++) { var n = norm(inputNames[i]); if (!n) continue; if (!g.ch.test(stripSide(n)) && !g.ch.test(n)) continue; if (g.not && g.not.test(n)) continue; var sd = sideOf(n); if (side === 'any' || sd === side || (side === null && !sd)) if (free(i)) return i; }
      return -1;
    }
    function tryGroup(g) {
      if (g.stereo || /lr$|stereo|st$/.test(f)) {
        if (fSide) { var one = findCh(g, fSide); if (one >= 0) return [{ socket: one, side: chans > 1 ? fSide : 'mono' }]; }
        var l = findCh(g, 'L'), r = findCh(g, 'R');
        if (l >= 0 && r >= 0) return [{ socket: l, side: chans > 1 ? 'L' : 'mono' }, { socket: r, side: chans > 1 ? 'R' : 'mono' }];
      }
      var m = findCh(g, null); if (m < 0) m = findCh(g, 'any'); return m >= 0 ? [{ socket: m, side: 'mono' }] : null;
    }
    var gsel = null;
    for (var k = 0; k < GROUPS.length; k++) { var g = GROUPS[k]; if (g.file.test(fs) || g.file.test(f)) { if (g.not && g.not.test(f)) continue; gsel = g; break; } }
    if (gsel) {
      var order = (gsel.prefer || []).concat([gsel.id]).concat(gsel.fallback || []);
      for (var o = 0; o < order.length; o++) { var gg = GROUPS.filter(function (x) { return x.id === order[o]; })[0]; var r = gg && tryGroup(gg); if (r) return r; }
    }
    // 같은 이름(공백 · 기호 빼고) / 포함
    var fz = fs.replace(/ /g, '');
    for (var i = 0; i < inputNames.length; i++) { var nz = norm(inputNames[i]).replace(/ /g, ''); if (nz && nz === fz && free(i)) return [{ socket: i, side: 'mono' }]; }
    for (i = 0; i < inputNames.length; i++) { var nz2 = norm(inputNames[i]).replace(/ /g, ''); if (nz2.length >= 2 && fz.length >= 2 && (fz.indexOf(nz2) >= 0 || nz2.indexOf(fz) >= 0) && free(i)) return [{ socket: i, side: 'mono' }]; }
    // 맨 앞 번호(01_Kick.wav → Local 1)
    if (num) { var nn = +num[1] - 1; if (nn >= 0 && nn < 32 && free(nn)) return [{ socket: nn, side: chans > 1 ? 'mono' : 'mono' }]; }
    return out;
  }
  function inputNamesOf(model) {
    var st = model && model.stage, chs = model && model.state && model.state.ch, a = [];
    for (var i = 0; i < 32; i++) a.push((st && st[i] && st[i][0]) || (chs && chs[i] && chs[i].name) || '');
    return a;
  }
  function matchFiles(names, model, chansList) {
    var inputs = inputNamesOf(model), used = {}, res = [];
    names.forEach(function (nm, k) { var r = matchOne(nm, chansList ? chansList[k] : 2, inputs, used); r.forEach(function (x) { used[x.socket] = 1; }); res.push({ name: nm, targets: r }); });
    return res;
  }

  /* =========================================================================
     4) 엔진
     ========================================================================= */
  function create(model, opts) {
    opts = opts || {};
    var st = function () { return model.state; };
    var ctx = null, node = null, core = null, sp = null, master = null, outTrim = null, limiter = null, fxIn = null, fxOut = null, fxDelay = null, fxSplit = null, streamMerger = null;
    var running = false, destroyed = false, building = null, listenT = parseListen(opts.listen || 'main'), volume = opts.volume == null ? 1 : opts.volume;
    var stems = [], stemSeq = 0, socketMap = {}, nextChanId = 0, mode = opts.mode || 'auto';
    var meterLayout = null, lastPos = 0, statusInfo = { phase: 'idle' };
    var fxUnits = [null, null, null, null];
    var api = {};

    function status(o) { statusInfo = o; if (opts.onStatus) try { opts.onStatus(o); } catch (e) {} }

    /* ---- 모델 → 엔진 파라미터 ---- */
    function dbv(d) { return d == null || !isFinite(d) || d <= OFFDB ? 0 : Math.pow(10, d / 20); }
    function panG(p) { p = Math.max(-100, Math.min(100, +p || 0)) / 100; var a = (p + 1) * Math.PI / 4; return [Math.cos(a) * Math.SQRT2 * 0.70710678, Math.sin(a) * Math.SQRT2 * 0.70710678]; }   // 등전력(가운데 −3 dB)
    function balG(p) { p = Math.max(-100, Math.min(100, +p || 0)) / 100; return [p > 0 ? 1 - p : 1, p < 0 ? 1 + p : 1]; }
    var GMODE = { EXP2: 0, EXP3: 1, EXP4: 2, GATE: 3, DUCK: 4 }, TAPC = { 'IN': 0, 'PRE EQ': 1, 'POST EQ': 2, 'PRE': 3, 'POST': 4, 'GRP': 4 };
    function keyIdx(k, self) {
      if (k == null || k === 'SELF' || k === '' || k === 0) return -1;
      if (typeof k === 'number') return k - 1 === self ? -1 : k - 1;
      var m = /^(ch|in|aux|fx\s*rtn|fxr|fx)\s*0?(\d+)\s*([lr])?/i.exec(String(k).trim()); if (!m) return -1;
      var t = m[1].toLowerCase(), n = +m[2] - 1, idx = t === 'ch' || t === 'in' ? n : t === 'aux' ? 32 + n : 40 + n * 2 + (m[3] && m[3].toLowerCase() === 'r' ? 1 : 0);
      return idx === self || idx < 0 || idx > 47 ? -1 : idx;
    }
    function kfOf(f) {
      if (!f || !f.on) return [-1, 1000, 1];
      var t = String(f.type || ''), fr = +f.freq || 1000;
      if (/^LC/.test(t)) return [0, fr, 0.707]; if (/^HC/.test(t)) return [5, fr, 0.707];
      return [6, fr, Math.max(0.3, parseFloat(t) || 2)];
    }
    function gateP(g, self) {
      if (!g || !g.on) return null; var kf = kfOf(g.filter);
      return [1, GMODE[g.mode] != null ? GMODE[g.mode] : 3, +g.thr, Math.max(0, +g.range || 0), +g.attack || 0, Math.max(0, +g.hold || 0), Math.max(1, +g.release || 5), keyIdx(g.keySrc, self), kf[0], kf[1], kf[2]];
    }
    function dynP(d, self) {
      if (!d || !d.on) return null; var kf = kfOf(d.filter);
      return [1, d.mode === 'EXP' ? 1 : 0, +d.thr, Math.max(1, +d.ratio || 1), +d.knee || 0, +d.attack || 0, Math.max(0, +d.hold || 0), Math.max(1, +d.release || 5), +d.gain || 0, !!d.auto, d.det === 'RMS', d.env === 'LIN',
        d.mix == null ? 1 : Math.max(0, Math.min(1, d.mix / 100)), d.pos === 'PRE' ? 1 : 0, keyIdx(d.keySrc, self), kf[0], kf[1], kf[2]];
    }
    function eqP(eq) {
      if (!eq || !eq.on || !eq.bands) return null;
      return eq.bands.map(function (b) { var t = EQT[b.type]; if (t == null) t = 2; return [t, +b.freq || 1000, (t === 0 || t === 5) ? 0 : +b.gain || 0, (t === 0 || t === 5) ? 0.7071 : (+b.q || 1)]; });
    }
    function dcaInfo(s) { var off = 0, mute = false, solo = false, S = st(); (s.dca || []).forEach(function (on, k) { if (!on || !S.dca[k]) return; var f = S.dca[k].fader; off += (f == null || f <= OFFDB) ? NINF : f; if (S.dca[k].mute) mute = true; if (S.dca[k].solo) solo = true; }); return { off: off, mute: mute, solo: solo }; }
    function mgMute(s) { var S = st(); return (s.muteGrp || []).some(function (on, k) { return on && S.muteGroups[k] && S.muteGroups[k].on; }); }
    function effFader(s, d) { var f = s.fader; if (f == null || f <= OFFDB || !isFinite(d.off)) return 0; return Math.pow(10, (f + d.off) / 20); }
    // 이 채널의 소리가 어느 입력 잭(socket)에서 오나: Local 1..32 = 0..31, AUX 1..6 = 32..37, USB 1..4 = 38..41. 없으면 −1
    function socketOf(type, i, s) {
      var S = st();
      if (type === 'ch') {
        var src = s.source == null ? i : +s.source; if (!(src >= 0 && src < 32)) return -1;
        var blk = (S.routing && S.routing.input && S.routing.input.blocks || [])[Math.floor(src / 8)] || '', m = /^(Local|AES50A|AES50B|Card)\s+(\d+)-/.exec(blk);
        if (!m || m[1] !== 'Local') return -1;   // AES50 · Card 쪽엔 이 실습에서 소리가 없음(연결된 장비 없음)
        return +m[2] - 1 + (src % 8);
      }
      if (type === 'aux') {
        var ab = (S.routing && S.routing.input && S.routing.input.aux) || 'AUX 1-6 / USB 2';
        if (/^AUX 1-6/.test(ab)) return i < 6 ? 32 + i : 38 + (i - 6);
        if (/^AUX 1-4/.test(ab)) return i < 4 ? 32 + i : 38 + (i - 4);
        return -1;
      }
      return -1;
    }
    function stageInfo(sock) {
      var stg = model.stage && model.stage[sock];
      if (sock < 32) return { peak: stg && isFinite(stg[2]) ? stg[2] : -30, phantom: !!(stg && stg[3]), name: stg ? stg[0] : '' };
      return { peak: -14, phantom: false, name: sock < 38 ? 'AUX ' + (sock - 31) : 'USB ' + (sock - 37) };
    }
    function stripP(type, i, s, idx) {
      if (!s) return null;
      var p = { sk: 0, a: -1, b: -1, lvl: 0 };
      if (type === 'fxr') {
        var ret = fxReturnOf(i); if (ret < 0) return null; p.sk = 3; p.a = i;
      } else {
        var sock = socketOf(type, i, s), mp = sock >= 0 ? socketMap[sock] : null;
        if (!mp) return null;
        var stem = stems.filter(function (x) { return x.key === mp.stem; })[0]; if (!stem || !stem.ready) return null;
        var info = stageInfo(sock);
        if (info.phantom && !(s.preamp && s.preamp.phantom)) return null;   // 콘덴서 마이크인데 48V 꺼짐 → 소리 없음
        var ch0 = stem.chans[0], ch1 = stem.chans[1] != null ? stem.chans[1] : ch0, side = mp.side;
        var A = side === 'R' ? ch1 : ch0, Bc = side === 'mono' && stem.chans.length > 1 ? ch1 : -1;
        p.sk = stem.stream ? 2 : 1; p.a = A; p.b = Bc;
        p.lvl = Math.pow(10, ((mp.peak != null ? mp.peak : info.peak) - stem.peak) / 20);
      }
      var pre = s.preamp || {};
      p.g = Math.pow(10, ((+pre.gain || 0) + (+pre.trim || 0)) / 20) * (pre.invert ? -1 : 1);
      p.dly = pre.delay && pre.delay.on ? Math.round((+pre.delay.ms || 0) / 1000 * (ctx ? ctx.sampleRate : 48000)) : 0;
      p.lc = pre.lowcut && pre.lowcut.on ? [+pre.lowcut.slope || 12, +pre.lowcut.freq || 100] : null;
      p.gt = gateP(s.gate, idx); p.dy = dynP(s.dyn, idx); p.eq = eqP(s.eq);
      var d = dcaInfo(s), mute = !!s.mute || d.mute || mgMute(s), fg = mute ? 0 : effFader(s, d), mu = mute ? 0 : 1;
      var mn = s.main || {}, pan = mn.pan != null ? mn.pan : s.pan, pg = panG(pan);
      p.fg = fg; p.mL = mn.st !== false ? fg * pg[0] : 0; p.mR = mn.st !== false ? fg * pg[1] : 0; p.mM = mn.mono ? fg * dbv(mn.mlevel) : 0;
      var solo = !!s.solo || d.solo, S = st(), afl = S.config && S.config.solo && S.config.solo.mode === 'AFL';
      p.sL = solo ? (afl ? fg * pg[0] : 1) : 0; p.sR = solo ? (afl ? fg * pg[1] : 1) : 0;
      // 센드: [탭, 게인] — 짝으로 묶인(stereo link) 버스는 홀수 버스 센드의 레벨 · PAN 으로 L/R
      p.sends = [];
      var buses = S.bus || [];
      for (var b = 0; b < 16; b++) {
        var bus = buses[b]; if (!bus) { p.sends.push(null); continue; }
        var linkL = b % 2 === 0 && bus.stereoLinkWithNext, linkR = b % 2 === 1 && buses[b - 1] && buses[b - 1].stereoLinkWithNext;
        var sd = (s.sends || [])[linkR ? b - 1 : b]; if (!sd || !sd.on || sd.level == null || sd.level <= OFFDB) { p.sends.push(null); continue; }
        var tap = TAPC[sd.tap] != null ? TAPC[sd.tap] : 4, g = dbv(sd.level) * (tap === 4 ? fg : mu);
        if (linkL || linkR) { var sp2 = panG(sd.pan); g *= linkL ? sp2[0] : sp2[1]; g *= Math.SQRT2; }
        p.sends.push(g > 0 ? [tap === 4 ? 3 : tap, g] : null);
      }
      return p;
    }
    function busP(b, i) {
      if (!b) return null; var S = st(), buses = S.bus;
      var d = dcaInfo(b), mute = !!b.mute || d.mute || mgMute(b), fg = mute ? 0 : effFader(b, d);
      var linkL = i % 2 === 0 && b.stereoLinkWithNext, linkR = i % 2 === 1 && buses[i - 1] && buses[i - 1].stereoLinkWithNext;
      var mn = b.main || {}, pan = mn.pan != null && mn.pan !== 0 ? mn.pan : (b.pan || 0), pg;
      if (linkL || linkR) { var bl = balG(pan); pg = linkL ? [bl[0], 0] : [0, bl[1]]; } else pg = panG(pan);
      var p = { eq: eqP(b.eq), dy: dynP(b.dyn, -1), fg: fg, mL: mn.st ? pg[0] : 0, mR: mn.st ? pg[1] : 0, mM: mn.mono ? dbv(mn.mlevel) : 0, mtx: [], solo: null };
      (b.mtxSends || []).forEach(function (m, k) { p.mtx[k] = m && (m.on !== false) ? dbv(typeof m === 'number' ? m : m.level) : 0; });
      if (b.solo || d.solo) p.solo = linkL ? [1, 0] : linkR ? [0, 1] : [1, 1];
      return p;
    }
    function fxReturnOf(j) {   // FX 리턴 채널 j 에 소리를 넣는 FX 슬롯(0..3) — 없으면 −1
      var fx = st().fx || []; for (var k = 0; k < 4; k++) { var f = fx[k]; if (!f || f['return'] == null) continue; if (f['return'] === j || f['return'] + 1 === j) return k; } return -1;
    }
    function fxSrcCode(s) {
      if (!s) return -1; s = String(s); var m = /MixBus\s*0?(\d+)/i.exec(s); if (m) return +m[1] - 1;
      if (/Main\s*L/i.test(s)) return 16; if (/Main\s*R/i.test(s)) return 17; if (/M\/C|Mono/i.test(s)) return 18; return -1;
    }
    function compile() {
      var S = st(), P = { strips: [], buses: [], mtx: [], fxs: [], playing: running, stream: mode === 'stream' };
      var i; for (i = 0; i < 32; i++) P.strips.push(stripP('ch', i, S.ch[i], i));
      for (i = 0; i < 8; i++) P.strips.push(stripP('aux', i, S.aux && S.aux[i], 32 + i));
      for (i = 0; i < 8; i++) P.strips.push(stripP('fxr', i, S.fxr && S.fxr[i], 40 + i));
      for (i = 0; i < 16; i++) P.buses.push(busP(S.bus[i], i));
      for (i = 0; i < 6; i++) { var mx = S.mtx[i]; P.mtx.push(mx ? { eq: eqP(mx.eq), dy: dynP(mx.dyn, -1), fg: (mx.mute || mgMute(mx)) ? 0 : dbv(mx.fader), solo: !!mx.solo } : null); }
      var ms = S.main.st, mm = S.main.m, bal = balG(ms.pan), mfg = (ms.mute || mgMute(ms)) ? 0 : dbv(ms.fader);
      P.main = { eq: eqP(ms.eq), dy: dynP(ms.dyn, -1), fL: mfg * bal[0], fR: mfg * bal[1], mtx: [], solo: !!ms.solo };
      (ms.mtxSends || []).forEach(function (m, k) { var g = m && m.on !== false ? dbv(m.level) : 0; var pg = panG(m && m.pan); P.main.mtx[k] = [g * pg[0] * Math.SQRT2 * 0.5, g * pg[1] * Math.SQRT2 * 0.5]; });
      P.mono = { eq: eqP(mm.eq), dy: dynP(mm.dyn, -1), fg: (mm.mute || mgMute(mm)) ? 0 : dbv(mm.fader), mtx: [], solo: !!mm.solo };
      (mm.mtxSends || []).forEach(function (m, k) { P.mono.mtx[k] = m && m.on !== false ? dbv(m.level) : 0; });
      for (var k = 0; k < 4; k++) { var f = S.fx && S.fx[k], src = f && f.source; P.fxs.push(src ? fxSrcCode(src.l) : -1, src ? fxSrcCode(src.r) : -1); }
      P.pfl = !(S.config && S.config.solo && S.config.solo.mode === 'AFL');
      P.anySolo = typeof model.anySolo === 'function' ? model.anySolo() : false;
      var mon = (S.config && S.config.monitor) || {}, monG = dbv((mon.level == null ? -20 : mon.level) + 20) * (mon.dim ? dbv(mon.dimAtt == null ? -20 : mon.dimAtt) : 1);
      var L = listenT, kind = 0, li = 0, li2 = -1, auto = true, monoL = false;
      if (L.type === 'monitor') { var ms2 = String(mon.source || 'Main LR'), mb = /MixBus\s*0?(\d+)/i.exec(ms2), mt = /Matrix\s*(\d)/i.exec(ms2); if (mb) { L = { type: 'bus', index: +mb[1] - 1 }; } else if (mt) L = { type: 'mtx', index: +mt[1] - 1 }; else if (/^M\/C$/i.test(ms2)) L = { type: 'm' }; else L = { type: 'main' }; monoL = !!mon.mono; }
      if (L.type === 'solo') kind = 1; else if (L.type === 'bus') { kind = 2; li = L.index; var bb = S.bus; if (li % 2 === 0 && bb[li] && bb[li].stereoLinkWithNext) li2 = li + 1; else if (li % 2 === 1 && bb[li - 1] && bb[li - 1].stereoLinkWithNext) { li2 = li; li = li - 1; } }
      else if (L.type === 'mtx') kind = 3; else if (L.type === 'm') kind = 4;
      if (kind === 3) li = L.index;
      P.listen = { k: kind, i: li, i2: li2, auto: auto, mon: monG * volume, main: (listenT.type === 'monitor' ? monG : 1) * volume, mono: monoL };
      return P;
    }
    var dirty = false;
    function push() {
      if (!core && !node) return;
      var P = compile();
      if (node) node.port.postMessage({ t: 'p', p: P }); else if (core) core.setParams(P);
      syncFx();
    }
    function schedule() { if (dirty) return; dirty = true; Promise.resolve().then(function () { dirty = false; if (!destroyed) push(); }); }
    function onModel(path) { schedule(); }
    model.on(onModel);

    /* ---- 미터 → model.meters ---- */
    function dB(v) { return v > 0 ? 20 * Math.log10(v) : NINF; }
    function ensureMeters() {
      var M = model.meters || (model.meters = {});
      function arr(k, n, v) { if (!Array.isArray(M[k]) || M[k].length < n) { M[k] = []; for (var i = 0; i < n; i++) M[k].push(v); } return M[k]; }
      arr('ch', 32, NINF); arr('aux', 8, NINF); arr('fxr', 8, NINF); arr('bus', 16, NINF); arr('mtx', 6, NINF); arr('chIn', 32, NINF); arr('auxIn', 8, NINF); arr('fxrIn', 8, NINF); arr('chPost', 32, NINF); arr('auxPost', 8, NINF); arr('fxrPost', 8, NINF); arr('fx', 8, NINF);
      M.main = M.main || { l: NINF, r: NINF, m: NINF }; M.solo = M.solo || { l: NINF, r: NINF }; M.mon = M.mon || { l: NINF, r: NINF };
      M.gr = M.gr || {}; if (!Array.isArray(M.gr.ch)) M.gr.ch = []; if (!Array.isArray(M.gr.bus)) M.gr.bus = []; M.gate = M.gate || {}; if (!Array.isArray(M.gate.ch)) M.gate.ch = [];
      ['aux', 'fxr'].forEach(function (k) { if (!Array.isArray(M.gr[k])) M.gr[k] = []; if (!Array.isArray(M.gate[k])) M.gate[k] = []; });
      return M;
    }
    function onMeters(a) {
      if (!running || destroyed) return;
      var L = meterLayout, M = ensureMeters(), i, b;
      for (i = 0; i < 48; i++) {
        b = i * L.M_STRIP; var t = i < 32 ? 'ch' : i < 40 ? 'aux' : 'fxr', j = i < 32 ? i : i < 40 ? i - 32 : i - 40;
        M[t + 'In'][j] = dB(a[b]); M[t][j] = dB(a[b + 1]); M[t + 'Post'][j] = dB(a[b + 2]);
        M.gate[t][j] = a[b + 3] > 0.05 ? Math.round(a[b + 3] * 10) / 10 : 0; M.gr[t][j] = a[b + 4] > 0.05 ? Math.round(a[b + 4] * 10) / 10 : 0;
      }
      for (i = 0; i < 16; i++) { M.bus[i] = dB(a[L.M_BUS + i]); M.gr.bus[i] = a[L.M_BGR + i] > 0.05 ? Math.round(a[L.M_BGR + i] * 10) / 10 : 0; }
      for (i = 0; i < 6; i++) M.mtx[i] = dB(a[L.M_MTX + i]);
      M.main.l = dB(a[L.M_MAIN]); M.main.r = dB(a[L.M_MAIN + 1]); M.main.m = dB(a[L.M_MAIN + 2]); M.gr.main = a[L.M_MGR] > 0.05 ? Math.round(a[L.M_MGR] * 10) / 10 : 0;
      M.solo.l = dB(a[L.M_SOLO]); M.solo.r = dB(a[L.M_SOLO + 1]); M.mon.l = dB(a[L.M_LIS]); M.mon.r = dB(a[L.M_LIS + 1]);
      for (i = 0; i < 8; i++) M.fx[i] = dB(a[L.M_FX + i]);
      M.time = a[L.M_POS]; lastPos = a[L.M_POS];
      M.stamp = Date.now();
      if (opts.onMeters) try { opts.onMeters(M); } catch (e) {}
    }
    function clearMeters() {
      var M = ensureMeters();
      ['ch', 'aux', 'fxr', 'bus', 'mtx', 'chIn', 'auxIn', 'fxrIn', 'chPost', 'auxPost', 'fxrPost', 'fx'].forEach(function (k) { for (var i = 0; i < M[k].length; i++) M[k][i] = NINF; });
      M.main.l = M.main.r = M.main.m = NINF; M.solo.l = M.solo.r = NINF; M.mon.l = M.mon.r = NINF;
      ['ch', 'bus', 'aux', 'fxr'].forEach(function (k) { if (M.gr[k]) for (var i = 0; i < M.gr[k].length; i++) M.gr[k][i] = 0; if (M.gate[k]) for (var j = 0; j < M.gate[k].length; j++) M.gate[k][j] = 0; });
      M.gr.main = 0;
    }

    /* ---- FX 랙(슬롯 1-4 = 보내기 이펙트, 5-8 = 인서트 전용 → 이 실습에선 소리 길에 안 넣음) ---- */
    function pnum(p, keys, def) { if (!p) return def; for (var i = 0; i < keys.length; i++) { var v = p[keys[i]]; if (v != null && v !== '' && !isNaN(+v)) return +v; } return def; }
    function factor(v) { if (v == null) return 1; if (typeof v === 'number') return v; var m = /^(\d+)\s*\/\s*(\d+)$/.exec(String(v)); return m ? +m[1] / +m[2] : (+v || 1); }
    function fxKind(t) { t = String(t || ''); if (/Reverb|Ambience|Hall|Plate|Room|Chamber/i.test(t)) return 'rev'; if (/Delay|Echo/i.test(t)) return 'dly'; if (/Chorus|Flanger/i.test(t)) return 'cho'; if (/Graphic EQ/i.test(t)) return 'geq'; return 'thru'; }
    function makeIR(type, p) {
      var fs = ctx.sampleRate, decay = Math.max(0.1, Math.min(10, pnum(p, ['decay', 'DECAY', 'time'], 2))), size = Math.max(2, Math.min(100, pnum(p, ['size', 'SIZE'], 60)));
      var damp = Math.max(500, Math.min(20000, pnum(p, ['damping', 'damp', 'DAMP'], 6000))), lo = Math.max(10, pnum(p, ['lowcut', 'locut', 'loCut', 'LO CUT'], 100)), hi = Math.min(20000, pnum(p, ['hicut', 'hiCut', 'HI CUT'], 10000));
      var kind = /Plate/i.test(type) ? 'plate' : /Room|Chamber/i.test(type) ? 'room' : /Ambience/i.test(type) ? 'amb' : 'hall';
      var len = Math.min(fs * 6, Math.floor(fs * (decay * 1.15 + 0.08))), buf = ctx.createBuffer(2, len, fs);
      var build = kind === 'plate' ? 0.004 : kind === 'room' ? 0.006 + size * 0.0001 : kind === 'amb' ? 0.003 : 0.012 + size * 0.0003;
      for (var c = 0; c < 2; c++) {
        var d = buf.getChannelData(c), seed = c ? 987654321 : 123456789, lp = 0, hp = 0, hpx = 0, en = 0;
        var hiA = Math.exp(-2 * Math.PI * hi / fs), loA = Math.exp(-2 * Math.PI * lo / fs);
        for (var i = 0; i < len; i++) {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff; var nz = seed / 0x3fffffff - 1, t = i / fs;
          var env = Math.exp(-6.9078 * t / decay) * (1 - Math.exp(-t / build));
          var fc = hi * Math.pow(Math.max(0.05, damp / hi), Math.min(1, t / decay)), a = Math.exp(-2 * Math.PI * Math.min(fc, fs * 0.45) / fs);   // 시간이 갈수록 고음이 먼저 줄어듦(DAMP)
          lp = nz * (1 - a) + lp * a; var y = lp * env;
          var h = loA * (hp + y - hpx); hpx = y; hp = h;   // LO CUT(1차 하이패스)
          d[i] = h; en += h * h;
        }
        if (kind !== 'plate') {   // 초기 반사(방 크기에 따라 간격)
          var taps = kind === 'room' ? 6 : kind === 'amb' ? 8 : 5;
          for (var k = 1; k <= taps; k++) { var ti = Math.floor(fs * (0.003 + size * 0.0007 * k * (c ? 1.13 : 1))); if (ti < len) d[ti] += (c ^ (k & 1) ? 1 : -1) * 0.5 * Math.exp(-k * 0.35) * Math.sqrt(en / len) * 30; }
        }
        var sc = 1 / Math.sqrt(Math.max(1e-9, en)) * 0.9; for (i = 0; i < len; i++) d[i] *= sc;
      }
      return buf;
    }
    function buildFx(k, f) {
      var kind = fxKind(f && f.type), p = (f && f.params) || {}, u = { kind: kind, type: f && f.type, sig: '', nodes: [] };
      var inp = ctx.createChannelMerger(2), out = ctx.createGain(); u.inp = inp; u.out = out;
      fxSplit.connect(inp, 2 * k, 0); fxSplit.connect(inp, 2 * k + 1, 1);
      if (kind === 'rev') {
        u.pre = ctx.createDelay(1); u.conv = ctx.createConvolver(); u.conv.normalize = false; u.wet = ctx.createGain();
        inp.connect(u.pre); u.pre.connect(u.conv); u.conv.connect(u.wet); u.wet.connect(out);
      } else if (kind === 'dly') {
        u.sp = ctx.createChannelSplitter(2); u.mg = ctx.createChannelMerger(2); u.dry = ctx.createGain(); u.wet = ctx.createGain(); inp.connect(u.sp); inp.connect(u.dry); u.dry.connect(out);
        u.d = [ctx.createDelay(10), ctx.createDelay(10)]; u.fb = [ctx.createGain(), ctx.createGain()]; u.hc = [ctx.createBiquadFilter(), ctx.createBiquadFilter()]; u.lc = [ctx.createBiquadFilter(), ctx.createBiquadFilter()];
        for (var c = 0; c < 2; c++) { u.hc[c].type = 'lowpass'; u.lc[c].type = 'highpass'; u.sp.connect(u.lc[c], c); u.lc[c].connect(u.hc[c]); u.hc[c].connect(u.d[c]); u.d[c].connect(u.fb[c]); u.fb[c].connect(u.d[c]); u.d[c].connect(u.mg, 0, c); }
        u.mg.connect(u.wet); u.wet.connect(out);
      } else if (kind === 'cho') {
        u.sp = ctx.createChannelSplitter(2); u.mg = ctx.createChannelMerger(2); u.dry = ctx.createGain(); u.wet = ctx.createGain(); inp.connect(u.sp); inp.connect(u.dry); u.dry.connect(out);
        u.d = [ctx.createDelay(0.1), ctx.createDelay(0.1)]; u.lfo = ctx.createOscillator(); u.dep = [ctx.createGain(), ctx.createGain()];
        u.lfo.connect(u.dep[0]); u.lfo.connect(u.dep[1]); u.dep[0].connect(u.d[0].delayTime); u.dep[1].connect(u.d[1].delayTime); u.lfo.start();
        for (c = 0; c < 2; c++) { u.sp.connect(u.d[c], c); u.d[c].connect(u.mg, 0, c); }
        u.mg.connect(u.wet); u.wet.connect(out);
      } else if (kind === 'geq') {
        var F = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000], prev = inp; u.geq = [];
        F.forEach(function (fr) { var q = ctx.createBiquadFilter(); q.type = 'peaking'; q.frequency.value = Math.min(fr, ctx.sampleRate * 0.45); q.Q.value = 4.3; prev.connect(q); prev = q; u.geq.push(q); });
        prev.connect(out);
      } else inp.connect(out);
      var ret = f && f['return'];
      if (ret != null && ret >= 0 && ret < 8) { var spo = ctx.createChannelSplitter(2); out.connect(spo); spo.connect(fxIn, 0, ret); if (ret + 1 < 8) spo.connect(fxIn, 1, ret + 1); u.spo = spo; }
      u.ret = ret;
      updFx(u, f);
      return u;
    }
    function updFx(u, f) {
      var p = (f && f.params) || {}, now = ctx.currentTime, mix = Math.max(0, Math.min(1, pnum(p, ['mix', 'MIX', 'level'], 100) / 100));
      if (u.kind === 'rev') {
        u.pre.delayTime.setTargetAtTime(Math.max(0, Math.min(0.2, pnum(p, ['predelay', 'preDelay', 'predly', 'pre'], 20) / 1000)), now, 0.01);
        u.wet.gain.setTargetAtTime(mix, now, 0.02);
        var sig = [u.type, pnum(p, ['decay'], 2), pnum(p, ['size'], 60), pnum(p, ['damping', 'damp'], 6000), pnum(p, ['lowcut', 'locut'], 100), pnum(p, ['hicut'], 10000)].join('|');
        if (sig !== u.irSig) { u.irSig = sig; clearTimeout(u.irT); var first = !u.conv.buffer; u.irT = setTimeout(function () { if (!ctx || destroyed) return; try { u.conv.buffer = makeIR(u.type, p); } catch (e) {} }, first ? 0 : 180); }
      } else if (u.kind === 'dly') {
        var tm = Math.max(1, Math.min(3000, pnum(p, ['time', 'TIME'], 375))) / 1000, fl = factor(p.factorL), fr = factor(p.factorR != null ? p.factorR : p.factorL);
        var fbL = pnum(p, ['feedL', 'feedback', 'fb'], 30), fbR = pnum(p, ['feedR', 'feedback', 'fb'], 30);
        u.d[0].delayTime.setTargetAtTime(Math.min(9.9, tm * fl), now, 0.03); u.d[1].delayTime.setTargetAtTime(Math.min(9.9, tm * fr), now, 0.03);
        u.fb[0].gain.setTargetAtTime(Math.min(0.95, fbL / 100), now, 0.02); u.fb[1].gain.setTargetAtTime(Math.min(0.95, fbR / 100), now, 0.02);
        for (var c = 0; c < 2; c++) { u.hc[c].frequency.value = Math.min(ctx.sampleRate * 0.45, pnum(p, ['hicut', 'hiCut'], 8000)); u.lc[c].frequency.value = pnum(p, ['lowcut', 'loCut', 'locut'], 100); }
        u.wet.gain.setTargetAtTime(mix, now, 0.02); u.dry.gain.setTargetAtTime(1 - mix, now, 0.02);
      } else if (u.kind === 'cho') {
        var base = Math.max(0.5, Math.min(40, pnum(p, ['delay', 'delayL'], 10))) / 1000, dep = Math.max(0, Math.min(100, pnum(p, ['depth', 'depthL'], 40))) / 100;
        u.lfo.frequency.setTargetAtTime(Math.max(0.05, Math.min(5, pnum(p, ['speed', 'rate'], 0.5))), now, 0.05);
        for (c = 0; c < 2; c++) { u.d[c].delayTime.value = base; u.dep[c].gain.setTargetAtTime((c ? -1 : 1) * base * 0.6 * dep, now, 0.05); }
        u.wet.gain.setTargetAtTime(mix, now, 0.02); u.dry.gain.setTargetAtTime(1 - mix, now, 0.02);
      } else if (u.kind === 'geq') {
        var bands = p.bands || []; u.geq.forEach(function (q, i) { q.gain.setTargetAtTime(+bands[i] || 0, now, 0.02); });
      }
    }
    function killFx(u) {
      if (!u) return; ['inp', 'out', 'pre', 'conv', 'wet', 'dry', 'sp', 'mg', 'spo', 'lfo'].forEach(function (k) { try { u[k] && u[k].disconnect(); } catch (e) {} });
      (u.d || []).concat(u.fb || [], u.hc || [], u.lc || [], u.dep || [], u.geq || []).forEach(function (n) { try { n.disconnect(); } catch (e) {} });
      try { u.lfo && u.lfo.stop(); } catch (e) {}
      try { fxSplit.disconnect(u.inp); } catch (e) {}
    }
    function syncFx() {
      if (!ctx || !fxSplit) return; var fx = st().fx || [];
      for (var k = 0; k < 4; k++) {
        var f = fx[k], src = f && f.source, ins = !src || /INS/i.test(String(src.l)) && /INS/i.test(String(src.r));
        var want = f && !ins ? fxKind(f.type) + '|' + f.type + '|' + f['return'] : '';
        var u = fxUnits[k];
        if (!want) { if (u) { killFx(u); fxUnits[k] = null; } continue; }
        if (!u || u.want !== want) { killFx(u); u = fxUnits[k] = buildFx(k, f); u.want = want; }
        else updFx(u, f);
      }
    }

    /* ---- 소리 파일 읽기 ---- */
    function isMobile() { var n = typeof navigator !== 'undefined' ? navigator : {}; return /Mobi|Android|iPhone|iPad|iPod/i.test(n.userAgent || '') || (n.deviceMemory && n.deviceMemory <= 4) || (n.maxTouchPoints > 1 && /Macintosh/.test(n.userAgent || '')); }
    function b64ToBuf(uri) { var i = uri.indexOf(','), s = atob(uri.slice(i + 1)), n = s.length, u = new Uint8Array(n); for (var k = 0; k < n; k++) u[k] = s.charCodeAt(k); return u.buffer; }
    function embedded(name, url) {   // index.html 이 미리 넣어 둔 base64 음원(file:// 에서도 됨): 이름 · 파일 이름 · 「(leadVox)」 모두로 찾기
      var E = window.MG12XU_SOURCE_AUDIO_BASE64; if (!E) return null;
      var keys = [name, url && String(url).replace(/^.*\//, '').replace(/\.\w+$/, ''), (/\(([^)]+)\)/.exec(name || '') || [])[1]];
      for (var i = 0; i < keys.length; i++) if (keys[i] && E[keys[i]]) return E[keys[i]];
      return null;
    }
    function getBytes(src) {
      if (src.data) return Promise.resolve(src.data.slice ? src.data.slice(0) : src.data);
      if (src.file) return src.file.arrayBuffer ? src.file.arrayBuffer() : new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsArrayBuffer(src.file); });
      var e = embedded(src.name, src.url); if (e) return Promise.resolve(b64ToBuf(e));
      if (!src.url) return Promise.reject(new Error('no source'));
      if (/^data:/.test(src.url)) return Promise.resolve(b64ToBuf(src.url));
      return fetch(src.url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }).catch(function () {
        return new Promise(function (res, rej) { var x = new XMLHttpRequest(); x.open('GET', src.url); x.responseType = 'arraybuffer'; x.onload = function () { if (x.status === 0 || x.status === 200) res(x.response); else rej(new Error('XHR ' + x.status)); }; x.onerror = function () { rej(new Error('읽을 수 없음(file:// 이면 서버로 열어 주세요)')); }; x.send(); });
      });
    }
    function decode(ab) { return new Promise(function (res, rej) { var p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }); }
    function estBytes(list) {   // 버퍼 모드로 풀면 대략 몇 바이트(16비트 · 모노 기준)
      var t = 0; list.forEach(function (s) { var sz = s.file ? s.file.size : s.data ? s.data.byteLength : s.buffer ? s.buffer.length * s.buffer.numberOfChannels * 4 : (embedded(s.name, s.url) || '').length * 0.75 || 2.7e6; var wav = /\.wav$|\.aiff?$/i.test((s.file && s.file.name) || s.name || ''); t += wav ? sz * 0.5 : sz * 7; }); return t;
    }
    function isIOS() { var n = typeof navigator !== 'undefined' ? navigator : {}; return /iPhone|iPad|iPod/i.test(n.userAgent || '') || (n.maxTouchPoints > 1 && /Macintosh/.test(n.userAgent || '')); }
    // buffer = 다 풀어서 Worklet 안에서 한 시계로 재생(완벽히 맞음, 메모리 많이 씀: 16비트) · stream = <audio> 로 흘려 재생(메모리 적음, 1.5초마다 서로 맞춤)
    // iOS Safari 는 클릭 뒤 늦게 시작하는 <audio> 재생을 막을 수 있어 버퍼(예산 400 MB)를 써요.
    function chooseMode(list) {
      if (opts.mode === 'buffer' || opts.mode === 'stream') return opts.mode;
      var est = estBytes(list); if (isIOS()) return est > 400e6 ? 'stream' : 'buffer';
      return est > (isMobile() ? 110e6 : 600e6) ? 'stream' : 'buffer';
    }

    function stemKey(src, k) { return String(src.key || src.name || ('stem' + k)); }
    function prepStems(list) {
      stems.forEach(function (s) { dropStem(s); });
      stems = list.map(function (src, k) { return { key: stemKey(src, k), name: src.name || (src.file && src.file.name) || ('stem ' + (k + 1)), src: src, chans: [], ready: false, peak: src.peak != null ? src.peak : -6, channels: 0, duration: 0, error: null, stream: false }; });
    }
    function dropStem(s) {
      if (s.stream && s.el) { try { s.el.pause(); s.el.removeAttribute('src'); s.el.load(); } catch (e) {} try { s.msrc && s.msrc.disconnect(); s.split && s.split.disconnect(); } catch (e) {} if (s.url) try { URL.revokeObjectURL(s.url); } catch (e) {} }
      if (!s.stream) s.chans.forEach(function (id) { if (node) node.port.postMessage({ t: 'drop', id: id }); else if (core) core.dropStem(id); });
    }
    function sendStem(id, data, rate) { if (node) node.port.postMessage({ t: 'stem', id: id, data: data, rate: rate }, [data.buffer]); else if (core) core.addStem(id, data, rate); }
    function loadStemBuffer(s) {
      var src = s.src, pAB = src.buffer ? Promise.resolve(src.buffer) : src.channels ? Promise.resolve(null) : getBytes(src).then(decode);
      return pAB.then(function (buf) {
        var chs = buf ? [] : src.channels, rate = buf ? buf.sampleRate : (src.rate || ctx.sampleRate), i;
        if (buf) for (i = 0; i < buf.numberOfChannels; i++) chs.push(buf.getChannelData(i));
        var len = chs[0].length, same = chs.length > 1;
        if (same) for (i = 0; i < len; i += 97) { if (Math.abs(chs[0][i] - chs[1][i]) > 1e-4) { same = false; break; } }
        var use = same || chs.length === 1 ? [chs[0]] : [chs[0], chs[1]], pk = 0;
        use.forEach(function (c) { for (var j = 0; j < len; j++) { var v = c[j]; if (v < 0) v = -v; if (v > pk) pk = v; } });
        s.peak = src.peak != null ? src.peak : (pk > 0 ? 20 * Math.log10(pk) : -6); s.channels = use.length; s.duration = len / rate;
        s.chans = use.map(function (c) {
          var id = nextChanId++, data;
          if (src.float || len < rate * 20) data = new Float32Array(c);   // 짧은 시험음은 그대로
          else { data = new Int16Array(len); for (var j = 0; j < len; j++) { var v = c[j] * 32767; data[j] = v > 32767 ? 32767 : v < -32768 ? -32768 : v; } }
          sendStem(id, data, rate); return id;
        });
        s.ready = true;
      });
    }
    function loadStemStream(s, chBase) {
      var src = s.src, url = src.file ? (s.url = URL.createObjectURL(src.file)) : embedded(src.name, src.url) || src.url;
      return new Promise(function (res, rej) {
        var el = new Audio(); el.preload = 'auto'; el.loop = true; el.crossOrigin = 'anonymous'; s.el = el;
        var done = false; el.addEventListener('canplaythrough', function () { if (done) return; done = true; res(); }, { once: true });
        el.addEventListener('error', function () { if (!done) { done = true; rej(new Error('재생할 수 없는 파일')); } }, { once: true });
        el.src = url; el.load();
      }).then(function () {
        s.msrc = ctx.createMediaElementSource(s.el); s.split = ctx.createChannelSplitter(2); s.msrc.connect(s.split);
        s.split.connect(streamMerger, 0, chBase); s.split.connect(streamMerger, 1, chBase + 1);
        s.stream = true; s.chans = [chBase, chBase + 1]; s.channels = 2; s.duration = s.el.duration || 0; s.ready = true;
        if (src.peak == null && !/^sources\//.test(src.url || '')) s.peak = -6;
        if (running) syncStreams(true);
      });
    }
    var streamTimer = null;
    function syncStreams(hard) {
      var els = stems.filter(function (s) { return s.stream && s.ready && s.el; }).map(function (s) { return s.el; }); if (!els.length) return;
      var master = els[0];
      els.forEach(function (el) {
        if (running) { if (el.paused) el.play().catch(function () {}); } else if (!el.paused) el.pause();
        if (el === master) return;
        var d = el.currentTime - master.currentTime, dur = master.duration || 0;
        if (dur && Math.abs(d) > dur / 2) d -= Math.sign(d) * dur;
        if (hard || Math.abs(d) > 0.06) { try { el.currentTime = master.currentTime; } catch (e) {} el.playbackRate = 1; }
        else el.playbackRate = d > 0.012 ? 0.997 : d < -0.012 ? 1.003 : 1;
      });
    }
    // target 이 정해진 스템: side 가 없고 stereo:true 면 L → 그 잭, R → 다음 잭
    function placeTarget(s, used) {
      var sock = targetSocket(s.src.target); if (sock < 0) return;
      var side = s.src.side;
      if (!side && s.src.stereo && sock + 1 < 42) { socketMap[sock] = { stem: s.key, side: 'L' }; socketMap[sock + 1] = { stem: s.key, side: 'R' }; used[sock] = used[sock + 1] = 1; return; }
      socketMap[sock] = { stem: s.key, side: side || 'mono' }; used[sock] = 1;
    }
    function autoMap() {
      var inputs = inputNamesOf(model), used = {}; socketMap = {};
      stems.forEach(function (s) { if (s.src.target != null) placeTarget(s, used); });
      stems.forEach(function (s) {
        if (s.src.target != null) return;
        matchOne(s.name, s.channels || (s.src.channels ? s.src.channels.length : 2), inputs, used).forEach(function (r) { used[r.socket] = 1; socketMap[r.socket] = { stem: s.key, side: r.side }; });
      });
      schedule();
    }
    function targetSocket(t) {
      if (t == null) return -1; if (typeof t === 'number') return t;
      if (typeof t === 'string') { var m = /^(local|aux|usb)\s*0?(\d+)/i.exec(t.trim()); if (m) return m[1].toLowerCase() === 'local' ? +m[2] - 1 : m[1].toLowerCase() === 'aux' ? 31 + +m[2] : 37 + +m[2]; return -1; }
      if (t.type === 'ch') { var s = st().ch[t.index]; var sk = s ? socketOf('ch', t.index, s) : -1; return sk >= 0 ? sk : t.index; }
      if (t.type === 'aux') { var s2 = st().aux[t.index]; var sk2 = s2 ? socketOf('aux', t.index, s2) : -1; return sk2 >= 0 ? sk2 : (t.index < 6 ? 32 + t.index : 38 + t.index - 6); }
      if (t.socket != null) return t.socket; return -1;
    }
    var loading = null;
    function loadAll() {
      if (!ctx) return Promise.resolve();
      var list = stems, base = 0;
      mode = chooseMode(list.map(function (s) { return s.src; }));
      status({ phase: 'loading', loaded: 0, total: list.length, mode: mode });
      var n = 0, chain = Promise.resolve();
      // 하나씩 차례로 풀어요(휴대폰 메모리 아끼기). 다 풀린 것부터 바로 같은 곡 위치에서 같이 나와요.
      list.forEach(function (s) {
        chain = chain.then(function () {
          if (destroyed || stems !== list) return;
          var p = mode === 'stream' && !s.src.buffer && !s.src.channels ? loadStemStream(s, (base += 2) - 2) : loadStemBuffer(s);
          return p.then(function () { n++; status({ phase: 'loading', loaded: n, total: list.length, mode: mode }); schedule(); }, function (e) { s.error = String(e && e.message || e); n++; });
        });
      });
      loading = chain.then(function () { if (stems !== list) return; autoMapIfNeeded(); status({ phase: 'ready', loaded: n, total: list.length, mode: mode, errors: list.filter(function (s) { return s.error; }).map(function (s) { return s.name + ': ' + s.error; }) }); if (opts.onReady) try { opts.onReady(api); } catch (e) {} schedule(); });
      return loading;
    }
    var mappedOnce = false;
    function autoMapIfNeeded() { if (!mappedOnce) { autoMap(); mappedOnce = true; } else schedule(); }

    /* ---- 오디오 그래프 만들기 ---- */
    function build() {
      if (building) return building;
      building = new Promise(function (res) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (opts.context) ctx = opts.context;
        else { try { ctx = new AC({ sampleRate: 44100, latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); } }
        // iOS: 누른 그 순간(같은 호출 안)에 resume + 아주 짧은 무음을 틀어야 소리가 풀려요
        try { if (ctx.resume) ctx.resume(); var ub = ctx.createBufferSource(); ub.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); ub.connect(ctx.destination); ub.start(0); } catch (e) {}
        // 콘솔 출력(master, 미터와 같은 크기) → 사이트 스피커 앰프(outTrim, 기본 +6 dB) → 찢어짐 막는 리미터 → 스피커
        master = ctx.createGain(); master.gain.value = 1; outTrim = ctx.createGain(); outTrim.gain.value = Math.pow(10, (opts.outGain == null ? 6 : opts.outGain) / 20);
        limiter = ctx.createDynamicsCompressor(); limiter.threshold.value = -1.5; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.12;
        master.connect(outTrim); outTrim.connect(limiter); limiter.connect(ctx.destination);
        fxIn = ctx.createChannelMerger(8); fxDelay = ctx.createDelay(0.1); fxDelay.delayTime.value = 0; fxIn.connect(fxDelay);
        streamMerger = ctx.createChannelMerger(32);
        var ok = function () { meterLayout = makeCore(ctx.sampleRate).meterLayout; res(); };
        var useWorklet = ctx.audioWorklet && typeof AudioWorkletNode !== 'undefined' && opts.worklet !== false;
        (useWorklet ? ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' }))).then(function () {
          node = new AudioWorkletNode(ctx, 'x32-engine', { numberOfInputs: 2, numberOfOutputs: 2, outputChannelCount: [2, 8], channelCount: 32, channelCountMode: 'explicit', channelInterpretation: 'discrete' });
          node.port.onmessage = function (e) { if (e.data && e.data.t === 'm') onMeters(e.data.a); };
          streamMerger.connect(node, 0, 0); fxDelay.connect(node, 0, 1);
          node.connect(master, 0); fxSplit = ctx.createChannelSplitter(8); node.connect(fxSplit, 1);
          var mf = Math.round(ctx.sampleRate / 43 / 128) * 128; node.port.postMessage({ t: 'mf', n: Math.max(256, mf) });
        }) : Promise.reject(new Error('no worklet'))).catch(function () {
          // 예비: ScriptProcessor 에서 같은 코어를 돌려요(옛 브라우저)
          node = null; core = makeCore(ctx.sampleRate); core.onMeters = function (m) { var c = m.slice(0); setTimeout(function () { onMeters(c); }, 0); };
          core.mframes = Math.max(256, Math.round(ctx.sampleRate / 43 / 128) * 128);
          sp = ctx.createScriptProcessor(1024, 32, 10);
          var chm = ctx.createChannelMerger(32), sms = ctx.createChannelSplitter(32); streamMerger.connect(sms); for (var q = 0; q < 24; q++) sms.connect(chm, q, q);
          var fxs = ctx.createChannelSplitter(8); fxDelay.connect(fxs); for (q = 0; q < 8; q++) fxs.connect(chm, q, 24 + q);
          chm.connect(sp); fxSplit = ctx.createChannelSplitter(10); sp.connect(fxSplit);
          var lm = ctx.createChannelMerger(2); fxSplit.connect(lm, 0, 0); fxSplit.connect(lm, 1, 1); lm.connect(master);
          var tmpL = new Float32Array(128), tmpR = new Float32Array(128), tmpF = []; for (q = 0; q < 8; q++) tmpF.push(new Float32Array(128));
          sp.onaudioprocess = function (ev) {
            var ib = ev.inputBuffer, ob = ev.outputBuffer, N = ob.length, ins = [], fxi = [], k, q2, L = ob.getChannelData(0), R = ob.getChannelData(1), F = [];
            for (k = 0; k < 8; k++) F.push(ob.getChannelData(2 + k));
            for (var off = 0; off < N; off += 128) {
              ins = []; fxi = []; for (k = 0; k < 24; k++) ins.push(ib.getChannelData(k).subarray(off, off + 128)); for (k = 0; k < 8; k++) fxi.push(ib.getChannelData(24 + k).subarray(off, off + 128));
              core.process(ins, fxi, tmpL, tmpR, tmpF, 128);
              L.set(tmpL, off); R.set(tmpR, off); for (q2 = 0; q2 < 8; q2++) F[q2].set(tmpF[q2], off);
            }
          };
          // 10채널 분배기에서 FX 2..9 를 쓰게 맞춤
          var fx8 = ctx.createChannelSplitter(8), shim = ctx.createChannelMerger(8); for (q = 0; q < 8; q++) fxSplit.connect(shim, 2 + q, q); shim.connect(fx8); fxSplit = fx8;
        }).then(ok);
      });
      return building;
    }

    /* ---- 바깥 약속(API) ---- */
    api.start = function () {
      if (destroyed) return Promise.reject(new Error('destroyed'));
      var first = !ctx;
      if (ctx && ctx.resume) try { ctx.resume(); } catch (e) {}   // 사용자 클릭 안에서 바로
      return build().then(function () {
        running = true; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(1, ctx.currentTime, 0.01);
        var r = ctx.resume ? ctx.resume() : null;
        if (first) { if (!stems.length) prepStems(opts.sources || DEFAULT_STEMS.slice()); loadAll(); }
        push(); syncStreams(false); clearInterval(streamTimer); streamTimer = setInterval(function () { syncStreams(false); }, 1500);
        return r;
      }).then(function () { return api; });
    };
    api.stop = function () {
      if (!ctx) return Promise.resolve();
      running = false; push(); syncStreams(false); clearInterval(streamTimer);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
      return new Promise(function (res) { setTimeout(function () { if (!running && ctx && ctx.suspend && !opts.context) ctx.suspend().then(res, res); else res(); clearMeters(); }, 120); });
    };
    api.destroy = function () {
      destroyed = true; running = false; model.off(onModel); clearInterval(streamTimer);
      stems.forEach(dropStem); fxUnits.forEach(killFx);
      try { if (node) { node.port.postMessage({ t: 'kill' }); node.disconnect(); } if (sp) { sp.onaudioprocess = null; sp.disconnect(); } } catch (e) {}
      if (ctx && !opts.context && ctx.close) ctx.close().catch(function () {});
      ctx = null; node = null; core = null; clearMeters();
    };
    api.setSources = function (list) {
      list = (list || []).map(function (s, k) { return typeof s === 'string' ? { name: s.replace(/^.*\//, '').replace(/\.\w+$/, ''), url: s } : s; });
      prepStems(list); mappedOnce = false;
      opts.sources = list;
      if (!ctx) { autoMapNames(); return Promise.resolve(api.mapping()); }
      return loadAll().then(function () { return api.mapping(); });
    };
    function autoMapNames() { var inputs = inputNamesOf(model), used = {}; socketMap = {}; stems.forEach(function (s) { if (s.src.target != null) placeTarget(s, used); }); stems.forEach(function (s) { if (s.src.target != null) return; matchOne(s.name, 2, inputs, used).forEach(function (r) { used[r.socket] = 1; socketMap[r.socket] = { stem: s.key, side: r.side }; }); }); }
    api.loadFiles = function (files, o) {
      var arr = []; for (var i = 0; i < (files ? files.length : 0); i++) { var f = files[i]; if (!f || (f.type && !/^audio\//.test(f.type) && !/\.(wav|mp3|m4a|aac|ogg|flac|aiff?)$/i.test(f.name))) continue; arr.push({ name: f.name.replace(/\.\w+$/, ''), file: f, key: f.name }); }
      if (o && o.append) arr = stems.map(function (s) { return s.src; }).concat(arr);
      return api.setSources(arr);
    };
    api.assign = function (stem, target, side) {
      var s = typeof stem === 'number' ? stems[stem] : stems.filter(function (x) { return x.key === stem || x.name === stem; })[0];
      if (target == null) { Object.keys(socketMap).forEach(function (k) { if (s && socketMap[k].stem === s.key) delete socketMap[k]; }); schedule(); return api.mapping(); }
      var sock = targetSocket(target); if (sock < 0) return api.mapping();
      if (!s) { delete socketMap[sock]; schedule(); return api.mapping(); }
      side = side || 'mono';
      // 옮기기: 같은 스템(같은 쪽)이 꽂혀 있던 잭은 비워요. 여러 잭에 똑같이 나누려면 assign(stem, target, side, { keep:true })
      if (!(arguments[3] && arguments[3].keep)) Object.keys(socketMap).forEach(function (k) { var e = socketMap[k]; if (e.stem === s.key && (side === 'mono' || e.side === side || e.side === 'mono')) delete socketMap[k]; });
      socketMap[sock] = { stem: s.key, side: side }; mappedOnce = true; schedule(); return api.mapping();
    };
    api.setSourceLevel = function (sock, peakDb) { var t = targetSocket(sock); if (socketMap[t]) { socketMap[t].peak = peakDb; schedule(); } };
    api.mapping = function () {
      return Object.keys(socketMap).map(Number).sort(function (a, b) { return a - b; }).map(function (k) {
        var m = socketMap[k], si = stageInfo(k); return { socket: k, input: k < 32 ? 'Local ' + (k < 9 ? '0' : '') + (k + 1) : si.name, stage: si.name, stem: m.stem, side: m.side };
      });
    };
    api.stems = function () { return stems.map(function (s) { return { key: s.key, name: s.name, channels: s.channels, duration: s.duration, loaded: s.ready, error: s.error, peak: s.peak, stream: s.stream }; }); };
    function parseListen(t) {
      if (t && typeof t === 'object') return { type: t.type || 'main', index: t.index | 0 };
      var s = String(t || 'main').trim().toLowerCase(), m = /^(bus|mixbus|mtx|matrix)[\s:]*0?(\d+)$/.exec(s);
      if (m) return { type: /^m(tx|atrix)/.test(m[1]) ? 'mtx' : 'bus', index: Math.max(0, +m[2] - 1) };
      if (s === 'solo' || s === 'pfl' || s === 'afl') return { type: 'solo' }; if (s === 'monitor' || s === 'mon') return { type: 'monitor' }; if (s === 'm' || s === 'm/c' || s === 'mono') return { type: 'm' };
      return { type: 'main' };
    }
    api.listen = function (t) { if (t !== undefined) { listenT = parseListen(t); schedule(); } return { type: listenT.type, index: listenT.index }; };
    api.listening = function () { return api.listen(); };
    api.setVolume = function (v) { volume = Math.max(0, Math.min(1.5, +v || 0)); schedule(); };
    api.seek = function (sec) { if (node) node.port.postMessage({ t: 'seek', sec: sec }); else if (core) core.seek(sec); stems.forEach(function (s) { if (s.el) try { s.el.currentTime = sec; } catch (e) {} }); };
    function streamEls() { return stems.filter(function (s) { return s.stream && s.ready && s.el; }).map(function (s) { return s.el; }); }
    api.position = function () { var e = streamEls(); return e.length ? e[0].currentTime : lastPos; };
    api.syncInfo = function () { var e = streamEls(), t = e.map(function (x) { return x.currentTime; }); return { mode: mode, times: t, spreadMs: t.length ? Math.round((Math.max.apply(null, t) - Math.min.apply(null, t)) * 1000) : 0 }; };
    api.status = function () { return statusInfo; };
    api.refresh = function () { schedule(); };
    api.whenLoaded = function () { return loading || Promise.resolve(); };
    api.mode = function () { return mode; };
    Object.defineProperty(api, 'running', { get: function () { return running; } });
    Object.defineProperty(api, 'ctx', { get: function () { return ctx; } });
    Object.defineProperty(api, 'output', { get: function () { return master; } });   // 테스트 · 녹음용(콘솔에서 나가는 소리, 미터와 같은 크기)
    api._compile = function () { return compile(); };
    prepStems(opts.sources || DEFAULT_STEMS.slice()); autoMapNames(); mappedOnce = true;
    clearMeters();
    return api;
  }

  window.X32Audio = { create: create, dsp: dsp, matchFiles: matchFiles, DEFAULT_STEMS: DEFAULT_STEMS, _makeCore: makeCore, version: 1 };
})();
