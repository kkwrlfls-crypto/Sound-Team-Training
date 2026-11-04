/* =============================================================================
   03-2 디지털 콘솔 실습 — X32 사진 위에서 마우스로 조작 (2026-11-04)
   - STASims.x32Photo(el, { onTask }) → { destroy, state, set }
   - MG12XU 실습처럼 실제 콘솔 사진(Behringer 공식 윗면 사진 2000×1389) 위에 페이더 · 노브 · 버튼 · LCD · 미터 · 화면을 겹쳐 그림.
     좌표는 모두 그 사진의 픽셀(가로 2000, 세로는 콘솔 부분 1200 까지).
   - 페이더 · 노브는 끌어서(노브는 휠 · 화살표 키도), 버튼은 눌러서 조작.
   - 채널 배치 · 이름은 교회 예배 예시, 레벨(dB)·미터는 교육용 근사. 화면 내용은 직접 그린 단순화 화면.
   ============================================================================= */
(function () {
  'use strict';
  var IMG = 'https://cdn-media.empowertribe.com/cdn-cgi/image/width=2000,quality=85,format=auto/e5ba63fb0e6f4e69a1626c5811115e16/Image_BE_0603-ACE_X32_Top_XL.png';
  var PW = 2000, PH = 1200;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var NINF = -Infinity;
  function psum(arr) { var p = 0; arr.forEach(function (d) { if (isFinite(d)) p += Math.pow(10, d / 10); }); return p > 0 ? 10 * Math.log10(p) : NINF; }
  function fmt(d) { return !isFinite(d) || d < -90 ? '−∞' : (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d).toFixed(Math.abs(d) < 10 ? 1 : 0); }
  function fin(d) { return !isFinite(d) ? null : Math.round(d * 10) / 10; }
  // 페이더 0–1 ↔ dB (X32 눈금 단순화: 0.75 ≈ 0 dB, 1 = +10 dB)
  var FPTS = [[0, NINF], [0.06, -60], [0.25, -30], [0.5, -10], [0.75, 0], [1, 10]];
  function fdb(p) { if (p <= 0.004) return NINF; for (var i = 1; i < FPTS.length; i++) { var a = FPTS[i - 1], b = FPTS[i]; if (p <= b[0]) { if (a[1] === NINF) return b[1] - (b[0] - p) / (b[0] - a[0]) * 30; return a[1] + (b[1] - a[1]) * (p - a[0]) / (b[0] - a[0]); } } return 10; }
  function fpos(d) { if (d == null || d === NINF) return 0; for (var i = 1; i < FPTS.length; i++) { var a = FPTS[i - 1], b = FPTS[i]; if (d <= b[1]) { if (a[1] === NINF) return Math.max(0.01, b[0] - (b[1] - d) / 30 * (b[0] - a[0])); return a[0] + (b[0] - a[0]) * (d - a[1]) / (b[1] - a[1]); } } return 1; }

  /* ---- 사진 위 위치 (px) ---- */
  var STRIP_IN = [213, 267, 319, 371, 424, 476, 530, 582, 634, 686, 738, 790, 844, 895, 948, 1000];
  var STRIP_R = [1113, 1165, 1219, 1272, 1324, 1376, 1428, 1480], STRIP_MAIN = 1552;   // 2026-11-04: 사진 확대 실측
  var ROW = { select: 485, solo: 609, lcd: 653, mute: 706, fTop: 772, fBot: 1000, led: [530, 537, 544, 551, 558, 565] };
  var BW = 28, BH = 22;

  /* ---- 교회 예배 예시 채널 32개: [이름, 입력, GAIN 0 dB 일 때 가장 큰 순간(dBFS), 콘덴서, 색] ---- */
  var CY = '#22d3ee', GR = '#4ade80', YE = '#facc15', MA = '#e879f9', WH = '#e5e7eb', OFF = '#6b7280';
  var CHS = [
    ['인도자', 'SM58', -48, 0, CY], ['싱어 1', 'SM58', -50, 0, CY], ['싱어 2', 'SM58', -50, 0, CY], ['A.기타', 'DI', -30, 0, GR],
    ['건반 L', 'DI', -20, 0, GR], ['건반 R', 'DI', -20, 0, GR], ['베이스', 'DI', -24, 0, GR], ['킥', '드럼 마이크', -38, 0, GR],
    ['스네어', '드럼 마이크', -36, 0, GR], ['하이햇', '콘덴서', -46, 1, GR], ['탐', '드럼 마이크', -40, 0, GR], ['OH L', '콘덴서', -44, 1, GR],
    ['OH R', '콘덴서', -44, 1, GR], ['E.기타', '앰프 마이크', -40, 0, GR], ['성가대 L', '콘덴서', -46, 1, YE], ['성가대 R', '콘덴서', -46, 1, YE],
    ['설교', '구즈넥 콘덴서', -45, 1, MA], ['사회', '무선 수신기', -26, 0, MA], ['영상 L', '노트북 USB', -18, 0, WH], ['영상 R', '노트북 USB', -18, 0, WH]
  ];
  while (CHS.length < 32) CHS.push(['CH ' + (CHS.length + 1), '(안 씀)', NINF, 0, OFF]);
  var DCAS = [['악기', [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]], ['보컬', [1, 2, 3]], ['설교·사회', [17, 18]], ['성가대', [15, 16]]];
  var BUSES = [['인도자 모니터', 'PRE'], ['싱어 모니터', 'PRE'], ['드럼 모니터', 'PRE'], ['방송·녹음', 'POST']];
  var MGS = [['밴드', [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]], ['보컬', [1, 2, 3]], ['설교·사회', [17, 18]], ['성가대', [15, 16]], ['영상', [19, 20]], ['(비어 있음)', []]];
  var EQB = ['LOW', 'LO MID', 'HI MID', 'HIGH'], EQF = [100, 400, 2500, 8000];
  var MENU = [['home', 'HOME'], ['meters', 'METERS'], ['routing', 'ROUTING'], ['setup', 'SETUP'], ['library', 'LIBRARY'], ['effects', 'EFFECTS'], ['mutegrp', 'MUTE GRP'], ['utility', 'UTILITY']];
  var MENU_Y = [102, 130, 160, 190, 218, 248, 278, 306];
  var INFO = { routing: '입력·출력 연결(패치)을 정하는 곳이에요. 잘못 바꾸면 소리가 엉뚱한 곳으로 가요. 그래서 이 실습에서는 보기만 해요.', setup: '날짜·밝기·네트워크(원격 앱 연결) 같은 콘솔 기본 설정이에요.',
    library: '채널 하나나 이펙트 하나의 설정만 따로 저장하고 불러와요. 콘솔 전체 설정은 SCENES(씬)에서 해요.', effects: '안에 든 이펙터 8대(리버브 · 딜레이 등)를 고르고 조절해요.', utility: '지금 화면에서 쓰는 도움 기능(복사 · 이름 바꾸기 등)이 나와요.' };
  var KN = { // 노브: [px, py, 지름 px, 이름]
    gain: [200, 202, 32, 'GAIN'], lcf: [342, 202, 32, 'LOW CUT FREQUENCY'], gthr: [200, 342, 32, 'GATE THRESHOLD'], dthr: [342, 342, 32, 'DYNAMICS THRESHOLD'],
    eqq: [553, 202, 32, 'EQ Q'], eqf: [603, 288, 32, 'EQ FREQ'], eqg: [518, 346, 32, 'EQ GAIN'],
    s1: [778, 198, 30, 'BUS SEND 1'], s2: [778, 266, 30, 'BUS SEND 2'], s3: [778, 334, 30, 'BUS SEND 3'], s4: [778, 400, 30, 'BUS SEND 4'],
    mlev: [954, 198, 30, 'MAIN BUS LEVEL'], mpan: [954, 334, 30, 'PAN / BAL'], mon: [1712, 182, 28, 'MONITOR LEVEL'], phn: [1712, 268, 28, 'PHONES LEVEL'], talk: [1824, 268, 28, 'TALK LEVEL']
  };
  var ENC = [1110, 1165, 1221, 1278, 1340, 1398];

  function injectCss() {
    if (document.getElementById('sta-x32p-css')) return;
    var st = document.createElement('style'); st.id = 'sta-x32p-css';
    st.textContent = [
      '.x32p{display:flex;flex-direction:column;gap:8px;min-width:0}',
      '.x32p-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:.78rem;color:var(--sta-ink-2,#475569)}',
      '.x32p-bar .sp{flex:1 1 200px;min-width:0}',
      '.x32p-bar button{border:1px solid var(--sta-line,#cbd5e1);background:var(--sta-surface-2,#f1f5f9);color:inherit;font:inherit;font-weight:700;font-size:.74rem;padding:5px 10px;border-radius:999px;cursor:pointer}',
      '.x32p-bar button[aria-pressed="true"]{background:var(--sta-blue,#2563eb);color:#fff;border-color:transparent}',
      '.x32p-scroll{overflow:auto;border-radius:12px;background:#0f1b2b;border:1px solid #0b1220;max-height:82vh}',
      '.x32p-stage{position:relative;aspect-ratio:2000/1200;width:max(100%,940px);container-type:inline-size;user-select:none;-webkit-user-select:none;touch-action:pan-x pan-y}',
      '.x32p-stage>img{position:absolute;left:0;top:0;width:100%;height:auto;pointer-events:none}',
      '.x32p-stage *{box-sizing:border-box}',
      '.x32p-btn{position:absolute;border:0;border-radius:.28cqw;background:linear-gradient(180deg,#6b6e75,#4b4e55);box-shadow:inset 0 -.12cqw 0 rgba(0,0,0,.45),0 0 0 .06cqw #111,0 0 0 .3cqw rgba(36,37,40,.96);cursor:pointer;padding:0}',
      '.x32p-btn:hover{filter:brightness(1.18)}',
      '.x32p-btn:focus-visible{outline:.15cqw solid #60a5fa;outline-offset:.08cqw}',
      '.x32p-btn.on.y{background:radial-gradient(circle,#fff3c4 0,#ffc93a 55%,#e69a00 100%);box-shadow:0 0 0 .3cqw rgba(36,37,40,.96),0 0 .9cqw rgba(255,180,0,.85)}',
      '.x32p-btn.on.g{background:radial-gradient(circle,#d9ffe9 0,#3dffa0 55%,#10b867 100%);box-shadow:0 0 0 .3cqw rgba(36,37,40,.96),0 0 .9cqw rgba(16,220,120,.8)}',
      '.x32p-btn.on.r{background:radial-gradient(circle,#ffe0e0 0,#ff5a5a 55%,#d81b1b 100%);box-shadow:0 0 0 .3cqw rgba(36,37,40,.96),0 0 .9cqw rgba(255,40,40,.8)}',
      '.x32p-btn.on.o{background:radial-gradient(circle,#ffe7cf 0,#ff9a3d 55%,#e36a00 100%);box-shadow:0 0 0 .3cqw rgba(36,37,40,.96),0 0 .9cqw rgba(255,120,0,.85)}',
      '.x32p-btn.dim{opacity:.55;cursor:default}',
      '.x32p-bl{display:block;font-size:.5cqw;font-weight:900;color:#e5e7eb;letter-spacing:-.01em;line-height:1;white-space:nowrap}.x32p-btn.on .x32p-bl{color:#052e16}',
      '.x32p-lcd{position:absolute;border-radius:.2cqw;background:var(--c,#475569);color:#0b0c0e;display:flex;flex-direction:column;justify-content:center;align-items:center;line-height:1.05;box-shadow:inset 0 0 0 .08cqw rgba(0,0,0,.35);pointer-events:none;overflow:hidden}',
      '.x32p-lcd span{font-size:.62cqw;font-weight:800;opacity:.75}.x32p-lcd b{font-size:.78cqw;font-weight:900;white-space:nowrap}',
      '.x32p-lcd.sof{box-shadow:inset 0 0 0 .14cqw #f97316}',
      '.x32p-slot{position:absolute;border-radius:.2cqw;background:repeating-linear-gradient(180deg,transparent 0,transparent 4.1%,rgba(255,255,255,.28) 4.1%,rgba(255,255,255,.28) 4.6%) 0 0/20% 100% no-repeat,repeating-linear-gradient(180deg,transparent 0,transparent 4.1%,rgba(255,255,255,.28) 4.1%,rgba(255,255,255,.28) 4.6%) 100% 0/20% 100% no-repeat,linear-gradient(90deg,transparent 0 44%,#030303 44% 56%,transparent 56%),#26272b;cursor:pointer}',
      '.x32p-cap{position:absolute;left:50%;width:82%;height:0;cursor:grab;touch-action:none}',
      '.x32p-cap i{position:absolute;left:0;right:0;top:-1.25cqw;height:2.5cqw;border-radius:.25cqw;background:linear-gradient(180deg,#f4f5f7 0,#c9ccd2 45%,#9ea2aa 52%,#d9dce1 100%);box-shadow:0 .25cqw .5cqw rgba(0,0,0,.6),inset 0 -.1cqw 0 rgba(0,0,0,.3)}',
      '.x32p-cap i::after{content:"";position:absolute;left:12%;right:12%;top:47%;height:.12cqw;background:#3f4249}',
      '.x32p-cap.sof i{background:linear-gradient(180deg,#ffe6cc 0,#ffa64d 45%,#e07000 52%,#ffbf80 100%)}',
      '.x32p-cap.main i{background:linear-gradient(180deg,#ffd6d6 0,#f87171 45%,#c81e1e 52%,#fca5a5 100%)}',
      '.x32p-cap:focus-visible{outline:none}.x32p-cap:focus-visible i{outline:.15cqw solid #60a5fa}',
      '.x32p-cap.drag{cursor:grabbing}',
      '.x32p-val{position:absolute;font-size:.66cqw;font-weight:800;color:#fde68a;text-align:center;font-variant-numeric:tabular-nums;pointer-events:none;text-shadow:0 0 .2cqw #000}',
      '.x32p-mtr{position:absolute;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:.05cqw 0;background:#141518;border-radius:.1cqw;pointer-events:none}',
      '.x32p-mtr i{display:block;width:70%;height:12%;border-radius:.05cqw;background:#2a2c30}',
      '.x32p-mtr i.on.g{background:#3dff8a;box-shadow:0 0 .3cqw #22c55e}.x32p-mtr i.on.y{background:#ffd23d;box-shadow:0 0 .3cqw #eab308}.x32p-mtr i.on.r{background:#ff4d4d;box-shadow:0 0 .3cqw #ef4444}',
      '.x32p-knob{position:absolute;border-radius:50%;cursor:ns-resize;touch-action:none}',
      '.x32p-knob svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}',
      '.x32p-knob:focus-visible{outline:.15cqw solid #60a5fa;outline-offset:.1cqw}',
      '.x32p-scr{position:absolute;background:#0b1a2c;border-radius:.2cqw;color:#e5e7eb;font-size:.82cqw;overflow:hidden;display:flex;flex-direction:column;pointer-events:none}',
      '.x32p-scr .hd{display:flex;justify-content:space-between;align-items:center;gap:.4cqw;padding:.25cqw .45cqw;background:#020617;font-weight:800}',
      '.x32p-scr .hd b{color:#fbbf24}.x32p-scr .hd small{color:#bfdbfe;font-weight:700;font-size:.66cqw}',
      '.x32p-scr .bd{flex:1;padding:.35cqw .45cqw;display:flex;flex-direction:column;gap:.25cqw;min-height:0}',
      '.x32p-scr .sof{background:#f97316;color:#111;font-weight:900;text-align:center;padding:.12cqw;font-size:.7cqw}',
      '.x32p-scr .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.25cqw}',
      '.x32p-scr .grid div{background:rgba(255,255,255,.08);border-radius:.15cqw;padding:.2cqw .3cqw;line-height:1.25}',
      '.x32p-scr .grid div span{display:block;color:#93c5fd;font-size:.6cqw;font-weight:800}',
      '.x32p-scr .on{color:#4ade80;font-weight:800}.x32p-scr .off{color:#94a3b8}',
      '.x32p-scr .enc{display:grid;grid-template-columns:repeat(6,1fr);gap:.15cqw;padding:.2cqw .3cqw;background:#020617}',
      '.x32p-scr .enc div{text-align:center;line-height:1.15;font-size:.6cqw}.x32p-scr .enc div b{display:block;color:#fde68a;font-size:.7cqw}',
      '.x32p-scr .lst div{padding:.12cqw .3cqw;border-radius:.12cqw}.x32p-scr .lst div.cur{background:#1d4ed8;color:#fff;font-weight:800}',
      '.x32p-scr .mt{display:flex;gap:.12cqw;align-items:flex-end;height:5cqw}.x32p-scr .mt i{flex:1;background:linear-gradient(0deg,#22c55e 0 70%,#facc15 70% 90%,#ef4444 90%);clip-path:inset(var(--cut,100%) 0 0 0);height:100%}',
      '.x32p-pmtr{position:absolute;display:flex;gap:.12cqw;pointer-events:none}',
      '.x32p-pmtr div{flex:1;display:flex;flex-direction:column;justify-content:space-between;background:#0b0c0e;padding:.08cqw}',
      '.x32p-pmtr i{display:block;height:2.6%;border-radius:.03cqw;background:#25272b}',
      '.x32p-hint{position:absolute;padding:.25cqw .5cqw;border-radius:.3cqw;background:rgba(17,24,39,.92);color:#fff;font-size:.8cqw;font-weight:700;pointer-events:none;white-space:nowrap;transform:translate(-50%,-130%);display:none;z-index:3}',
      '.x32p-read{display:flex;flex-wrap:wrap;gap:6px;font-size:.74rem}',
      '.x32p-read>span{padding:4px 9px;border-radius:7px;background:var(--sta-surface-2,#f1f5f9);border:1px solid var(--sta-line,#e2e8f0);color:var(--sta-ink-2,#475569)}',
      '.x32p-read>span b{margin-left:4px;color:var(--sta-ink,#0f172a);font-variant-numeric:tabular-nums}.x32p-read>span b.bad{color:#dc2626}',
      '.x32p-note{margin:0;font-size:.72rem;color:var(--sta-ink-2,#64748b)}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function x32Photo(el, opts) {
    opts = opts || {}; injectCss();
    function initState() {
      return {
        ch: CHS.map(function (c, i) {
          var n = i + 1, used = isFinite(c[2]);
          var g = { 1: 36, 2: 36, 3: 36, 4: 18, 5: 8, 6: 8, 7: 12, 8: 26, 9: 24, 10: 30, 11: 26, 12: 30, 13: 30, 14: 26, 15: 32, 16: 32, 17: 20, 18: 12, 19: 6, 20: 6 }[n] || 0;
          return { gain: g, p48: !!c[3] && n !== 17, phase: false, lc: [1, 2, 3, 15, 16, 18].indexOf(n) >= 0, lcf: n === 17 ? 40 : 100, gate: [8, 9, 11].indexOf(n) >= 0, gthr: -50, dyn: [1, 2, 3, 7].indexOf(n) >= 0, dthr: -20,
            eq: true, eqg: [0, 0, 0, 0], eqq: 2, mono: false, mlev: 0.5, mute: !used, solo: false, fader: !used ? NINF : n === 17 ? 0 : -5, pan: n === 19 ? -100 : n === 20 ? 100 : n === 12 ? -60 : n === 13 ? 60 : 0, lr: used,
            send: [n === 1 ? NINF : n <= 3 ? -8 : NINF, n <= 3 ? -4 : NINF, n >= 7 && n <= 13 ? -6 : NINF, used ? -10 : NINF] };
        }),
        dca: [0, 0, 0, 0], dcaMute: [false, false, false, false], bus: [0, 0, 0, 0], busMute: [false, false, false, false], mg: [false, false, false, false, false, false],
        main: 0, mainMute: false, mon: 0.6, phn: 0.5, talk: 0.4, mlevSel: 0
      };
    }
    function clone(o) { return JSON.parse(JSON.stringify(o, function (k, v) { return v === NINF ? '-inf' : v; }), function (k, v) { return v === '-inf' ? NINF : v; }); }
    var M = initState(), scenes = [['01', '주일 1부 예배', clone(M)], ['02', '주일 2부 예배', clone(M)], ['03', '수요 예배', clone(M)]], undo = null;
    var S = { layerL: 'in1', layerR: 'dca', sel: 1, sof: -1, page: 'home', band: 3, sendBank: 0, sceneCur: 0, dirty: false, sawSof: false, done: {}, frame: 0, mono: false, dim: false, talkA: false, talkB: false, soloAny: false };
    var alive = true, raf = 0;

    /* ---------- 신호 (교육용 근사) */
    function mgMuted(n) { return MGS.some(function (g, k) { return M.mg[k] && g[1].indexOf(n) >= 0; }); }
    function chIn(n) { var c = CHS[n - 1], m = M.ch[n - 1]; if (!isFinite(c[2]) || (c[3] && !m.p48)) return NINF; return c[2] + m.gain; }
    function chOut(n) { var m = M.ch[n - 1], d = 0; if (m.mute || mgMuted(n)) return NINF; DCAS.forEach(function (dc, k) { if (dc[1].indexOf(n) >= 0) d += M.dcaMute[k] ? NINF : M.dca[k]; }); var lv = chIn(n) + m.fader + d; return isFinite(lv) ? lv : NINF; }
    function mainLv() { if (M.mainMute) return NINF; var a = []; for (var n = 1; n <= 32; n++) if (M.ch[n - 1].lr) a.push(chOut(n) - 10); return psum(a) + M.main; }
    function busLv(b) { if (M.busMute[b]) return NINF; var a = []; for (var n = 1; n <= 32; n++) { var m = M.ch[n - 1]; if (m.mute || mgMuted(n)) continue; a.push((BUSES[b][1] === 'PRE' ? chIn(n) : chOut(n)) + m.send[b] - 6); } return psum(a) + M.bus[b]; }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function judge() {
      var c = M.ch[16], i17 = chIn(17);
      if (S.sel === 17 && c.p48) hit('p48');
      if (S.sel === 17 && c.p48 && i17 >= -18 && i17 <= -6) hit('gain');
      if (S.sel === 17 && c.lc && c.lcf >= 80 && c.lcf <= 150) hit('lowcut');
      if (S.sof === 0 && M.ch[0].send[0] >= -10 && S.sawSof) hit('sof');
      if (M.dca[0] <= -10 && !M.dcaMute[0]) hit('dca');
    }
    function changed() { S.dirty = true; }

    /* ---------- 레이어: 지금 페이더가 맡은 것 */
    function leftItems() {   // 16개
      var out = [], i;
      if (S.layerL === 'in1' || S.layerL === 'in2') { var b = S.layerL === 'in2' ? 16 : 0; for (i = 1; i <= 16; i++) out.push({ kind: 'ch', n: b + i }); }
      else if (S.layerL === 'busm') { for (i = 0; i < 16; i++) out.push(i < 4 ? { kind: 'bus', n: i } : { kind: 'none', label: 'BUS ' + (i + 1) }); }
      else { for (i = 0; i < 16; i++) out.push({ kind: 'none', label: i < 8 ? 'AUX ' + (i + 1) : 'FX ' + (i - 7) }); }
      return out;
    }
    function rightItems() {  // 8개
      var out = [], i;
      if (S.layerR === 'dca') for (i = 0; i < 8; i++) out.push(i < 4 ? { kind: 'dca', n: i } : { kind: 'none', label: 'DCA ' + (i + 1) });
      else if (S.layerR === 'bus1') for (i = 0; i < 8; i++) out.push(i < 4 ? { kind: 'bus', n: i } : { kind: 'none', label: 'BUS ' + (i + 1) });
      else if (S.layerR === 'bus2') for (i = 0; i < 8; i++) out.push({ kind: 'none', label: 'BUS ' + (i + 9) });
      else for (i = 0; i < 8; i++) out.push({ kind: 'none', label: i < 6 ? 'MTX ' + (i + 1) : i === 6 ? 'MAIN C' : '—' });
      return out;
    }
    function itemInfo(it) {   // 이름표 · 페이더 값 읽기/쓰기
      if (it.kind === 'ch') { var c = CHS[it.n - 1], m = M.ch[it.n - 1], sof = S.sof >= 0;
        return { no: 'CH ' + String(it.n).padStart(2, '0'), name: c[0], color: c[4], get: function () { return sof ? m.send[S.sof] : m.fader; }, set: function (v) { if (sof) { m.send[S.sof] = v; S.sawSof = true; } else m.fader = v; },
          mute: function () { return m.mute; }, tmute: function () { m.mute = !m.mute; }, solo: function () { return m.solo; }, tsolo: function () { m.solo = !m.solo; }, meter: function () { return chIn(it.n) - (m.mute ? 200 : 0); }, sof: sof, sel: S.sel === it.n }; }
      if (it.kind === 'bus') return { no: 'BUS ' + (it.n + 1), name: BUSES[it.n][0], color: '#f87171', get: function () { return M.bus[it.n]; }, set: function (v) { M.bus[it.n] = v; },
        mute: function () { return M.busMute[it.n]; }, tmute: function () { M.busMute[it.n] = !M.busMute[it.n]; }, meter: function () { return busLv(it.n) + 12; }, sel: S.sof === it.n };
      if (it.kind === 'dca') return { no: 'DCA ' + (it.n + 1), name: DCAS[it.n][0], color: '#a78bfa', get: function () { return M.dca[it.n]; }, set: function (v) { M.dca[it.n] = v; },
        mute: function () { return M.dcaMute[it.n]; }, tmute: function () { M.dcaMute[it.n] = !M.dcaMute[it.n]; }, meter: null, sel: false };
      return { no: it.label, name: '(안 씀)', color: OFF, none: true };
    }

    /* ---------- 뼈대 */
    var stage, scroll, read, hint, strips = [], knobs = {}, btns = {}, encs = [];
    el.innerHTML = '<div class="x32p">' +
      '<div class="x32p-bar"><span class="sp">페이더 · 노브는 끌어서 움직여요(노브는 마우스 휠 · 화살표 키도 돼요). 버튼은 눌러요. 이름이 궁금하면 마우스를 올려 보세요.</span>' +
        '<span role="group" aria-label="크게 보기"><button type="button" data-zoom="1" aria-pressed="true">전체</button> <button type="button" data-zoom="1.6" aria-pressed="false">크게</button> <button type="button" data-zoom="2.3" aria-pressed="false">더 크게</button></span></div>' +
      '<div class="x32p-scroll" data-role="scroll"><div class="x32p-stage" data-role="stage" role="application" aria-label="X32 콘솔 사진 위에서 조작하는 실습"><img src="' + IMG + '" alt="Behringer X32 윗면 (공식 제품 사진)" draggable="false"></div></div>' +
      '<div class="x32p-read" data-role="read" aria-live="polite"></div>' +
      '<p class="x32p-note">사진: Behringer 공식 제품 사진. 페이더 · 노브 · 버튼 · 이름표 · 미터 · 화면은 사진 위에 겹쳐 그렸어요. 소리 크기(dB)는 공부용으로 비슷하게 만든 값(교육용 근사)이에요. 실제 X32 의 기능이 모두 되지는 않아요. AUX · FX · MATRIX 레이어, ASSIGN 등은 모양만 있어요.</p></div>';
    scroll = el.querySelector('[data-role=scroll]'); stage = el.querySelector('[data-role=stage]'); read = el.querySelector('[data-role=read]');
    function P(x, y, w, h, node, centered) { var s = node.style; if (centered !== false) { x -= w / 2; y -= h / 2; } s.left = (x / PW * 100).toFixed(3) + '%'; s.top = (y / PH * 100).toFixed(3) + '%'; s.width = (w / PW * 100).toFixed(3) + '%'; s.height = (h / PH * 100).toFixed(3) + '%'; return node; }
    function mk(tag, cls, attrs) { var n = document.createElement(tag); if (cls) n.className = cls; if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); stage.appendChild(n); return n; }
    hint = mk('div', 'x32p-hint');
    function button(id, x, y, w, h, title, color) { var b = mk('button', 'x32p-btn ' + (color || 'y'), { type: 'button', 'data-b': id, 'data-tip': title, 'aria-label': title, 'aria-pressed': 'false' }); P(x, y, w || BW, h || BH, b); btns[id] = b; return b; }

    // 채널 스트립 25개
    function addStrip(id, cx, side, i) {
      var o = { id: id, cx: cx, side: side, i: i };
      o.sel = button(id + '.sel', cx, ROW.select, BW, BH, 'SELECT', 'g');
      o.mtr = mk('div', 'x32p-mtr'); P(cx - 6, (ROW.led[0] + ROW.led[5]) / 2, 8, 44, o.mtr); o.mtr.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
      if (side !== 'main') o.solo = button(id + '.solo', cx, ROW.solo, BW, BH, 'SOLO', 'y'); else { button('main.clearsolo', cx, 562, BW, BH, 'CLEAR SOLO', 'y'); o.solo = button('main.solo', cx, 608, BW, BH, 'SOLO', 'y'); }
      o.lcd = mk('div', 'x32p-lcd'); P(cx, ROW.lcd, 50, 32, o.lcd);
      o.mute = button(id + '.mute', cx, ROW.mute, BW, BH, 'MUTE', 'r');
      o.slot = mk('div', 'x32p-slot', { 'data-slot': id }); P(cx, (ROW.fTop + ROW.fBot) / 2 + 2, 40, ROW.fBot - ROW.fTop + 24, o.slot);
      o.cap = document.createElement('div'); o.cap.className = 'x32p-cap' + (side === 'main' ? ' main' : ''); o.cap.setAttribute('tabindex', '0'); o.cap.setAttribute('role', 'slider'); o.cap.setAttribute('data-f', id); o.slot.appendChild(o.cap); o.cap.innerHTML = '<i></i>';
      o.cap.style.transform = 'translateX(-50%)';
      o.val = mk('div', 'x32p-val'); P(cx, ROW.fBot + 26, 50, 16, o.val);
      strips.push(o); return o;
    }
    STRIP_IN.forEach(function (x, i) { addStrip('L' + i, x, 'L', i); });
    STRIP_R.forEach(function (x, i) { addStrip('R' + i, x, 'R', i); });
    addStrip('MAIN', STRIP_MAIN, 'main', 0);
    // 레이어 · SOF
    [['layer.in1', 162, 718, 'CH 1–16'], ['layer.in2', 162, 774, 'CH 17–32'], ['layer.aux', 162, 830, 'AUX IN / USB · FX RETURNS'], ['layer.busm', 162, 886, 'BUS MASTER']].forEach(function (b) { button(b[0], b[1], b[2], 28, 23, '입력 레이어: ' + b[3], 'g'); });
    [['layerR.dca', 1064, 718, 'GROUP DCA 1–8'], ['layerR.bus1', 1064, 774, 'BUS 1–8'], ['layerR.bus2', 1064, 830, 'BUS 9–16'], ['layerR.mtx', 1064, 886, 'MATRIX 1–6 / MAIN C']].forEach(function (b) { button(b[0], b[1], b[2], 28, 23, '버스 쪽 레이어: ' + b[3], 'g'); });
    button('sof', 1064, 496, 28, 23, 'SENDS ON FADER', 'o'); button('daw', 162, 498, 28, 23, 'DAW REMOTE (이 실습에서는 안 씀)', 'y').classList.add('dim');
    // 채널 스트립 구역 버튼
    [['p48', 178, 264, '48V (팬텀 전원)', 'y'], ['phase', 232, 264, 'Ø (위상 반전: 소리 파도를 뒤집기)', 'y'], ['lc', 346, 264, 'LOW CUT', 'y'], ['gate', 204, 412, 'GATE / DUCKER 켜기', 'y'], ['dyn', 342, 412, 'COMP / EXP 켜기', 'y'],
     ['eqmode', 492, 264, 'EQ MODE', 'y'], ['band3', 686, 226, 'EQ HIGH 밴드 고르기', 'y'], ['band2', 686, 276, 'EQ HIGH MID 밴드 고르기', 'y'], ['band1', 686, 326, 'EQ LOW MID 밴드 고르기', 'y'], ['band0', 686, 376, 'EQ LOW 밴드 고르기', 'y'], ['eq', 518, 412, 'EQUALIZER 켜기', 'y'],
     ['sb0', 844, 226, 'BUS SENDS 1–4', 'y'], ['sb1', 844, 277, 'BUS SENDS 5–8', 'y'], ['sb2', 844, 326, 'BUS SENDS 9–12', 'y'], ['sb3', 844, 374, 'BUS SENDS 13–16', 'y'],
     ['mono', 954, 264, 'MONO BUS 로 보내기 (LEVEL 노브 = 모노 버스로 보내는 양)', 'y'], ['lr', 954, 396, 'STEREO BUS(메인) 로 보내기', 'y'],
     ['monmono', 1714, 348, '모니터 MONO', 'y'], ['dim', 1714, 396, '모니터 DIM', 'y'], ['talka', 1826, 348, 'TALK A', 'y'], ['talkb', 1826, 396, 'TALK B', 'y'],
     ['sc.prev', 1628, 502, 'SCENES: PREV (앞 씬)', 'y'], ['sc.next', 1678, 502, 'SCENES: NEXT (다음 씬)', 'y'], ['sc.undo', 1732, 502, 'SCENES: UNDO (불러오기 되돌리기)', 'y'], ['sc.go', 1802, 502, 'SCENES: GO (불러오기)', 'g'], ['sc.view', 1858, 520, 'SCENES: VIEW (화면에 씬 목록)', 'y']
    ].forEach(function (b) { button(b[0], b[1], b[2], b[0] === 'sc.go' ? 38 : b[0] === 'sc.view' ? 18 : BW, b[0] === 'sc.go' ? 34 : b[0] === 'sc.view' ? 14 : BH, b[3], b[4]); });
    btns['sc.view'].classList.remove('y'); btns['sc.view'].classList.add('y');
    [[1624, 906], [1674, 906], [1624, 952], [1674, 952], [1624, 998], [1674, 998]].forEach(function (p, k) { button('mg' + k, p[0], p[1], 32, 25, 'MUTE GROUP ' + (k + 1) + ' · ' + MGS[k][0], 'r'); });
    MENU.forEach(function (m, k) { var b = button('menu.' + m[0], 1576, MENU_Y[k], 54, 22, '화면 메뉴: ' + m[1], 'g'); b.innerHTML = '<span class="x32p-bl">' + m[1] + '</span>'; });
    [['up', 1498, 344], ['down', 1498, 378], ['pgl', 1558, 362], ['pgr', 1590, 362]].forEach(function (b) { button('nav.' + b[0], b[1], b[2], 22, 22, b[0] === 'up' || b[0] === 'down' ? 'LAYER ' + (b[0] === 'up' ? '위' : '아래') + ' (화면 안 이동)' : 'PAGE SELECT ' + (b[0] === 'pgl' ? '◀' : '▶'), 'y'); });
    // 미터: 프리앰프(입력) · 다이내믹스(GR)
    var pm = mk('div', 'x32p-mtr'); P(274, 203, 10, 62, pm); pm.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
    var gm = mk('div', 'x32p-mtr'); P(274, 346, 10, 44, gm); gm.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
    // 메인 미터(화면 옆)
    var mm = mk('div', 'x32p-pmtr'); P(1472, 208, 66, 136, mm); mm.innerHTML = '<div data-mm="0"></div><div data-mm="1"></div><div data-mm="2"></div>';
    mm.querySelectorAll('div').forEach(function (d) { for (var i = 0; i < 24; i++) d.appendChild(document.createElement('i')); });
    // 화면
    var scr = mk('div', 'x32p-scr'); P(1088, 102, 316, 188, scr, false);
    // 노브
    function knob(id, d, title, get, set, step) {
      var k = mk('div', 'x32p-knob', { tabindex: '0', role: 'slider', 'aria-label': title, 'data-tip': title, 'data-k': id }); var R = 64; P(d[0], d[1], R, R, k);
      var dots = ''; for (var i = 0; i < 13; i++) { var a = (-135 + i * 22.5) * Math.PI / 180; dots += '<circle cx="' + (50 + Math.sin(a) * 36).toFixed(2) + '" cy="' + (50 - Math.cos(a) * 36).toFixed(2) + '" r="4.2"/>'; }
      k.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="#141518"/><circle cx="50" cy="50" r="' + (d[2] * 0.82) + '" fill="url(#x32pKnob)" stroke="#0a0a0b" stroke-width="2"/><g class="dots">' + dots + '</g></svg>';
      knobs[id] = { el: k, get: get, set: set, step: step || 0.02 }; return k;
    }
    var defs = mk('div', ''); defs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; defs.innerHTML = '<svg width="0" height="0"><defs><radialGradient id="x32pKnob" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4a4d53"/><stop offset=".6" stop-color="#232427"/><stop offset="1" stop-color="#121214"/></radialGradient></defs></svg>';
    function cm() { return M.ch[S.sel - 1]; }
    // 값 0..1 ↔ 실제 값
    var KV = {
      gain: [function () { return (cm().gain + 12) / 72; }, function (v) { cm().gain = Math.round((v * 72 - 12) * 2) / 2; }],
      lcf: [function () { return Math.log(cm().lcf / 20) / Math.log(20); }, function (v) { cm().lcf = Math.round(20 * Math.pow(20, v)); }],
      gthr: [function () { return (cm().gthr + 80) / 80; }, function (v) { cm().gthr = Math.round(v * 80 - 80); }],
      dthr: [function () { return (cm().dthr + 60) / 60; }, function (v) { cm().dthr = Math.round(v * 60 - 60); }],
      eqq: [function () { return (cm().eqq - 0.3) / 9.7; }, function (v) { cm().eqq = Math.round((0.3 + v * 9.7) * 10) / 10; }],
      eqf: [function () { return 0.5; }, function () {}],
      eqg: [function () { return (cm().eqg[S.band] + 15) / 30; }, function (v) { cm().eqg[S.band] = Math.round((v * 30 - 15) * 2) / 2; }],
      mlev: [function () { return cm().mlev; }, function (v) { cm().mlev = v; }],
      mpan: [function () { return (cm().pan + 100) / 200; }, function (v) { cm().pan = Math.round(v * 200 - 100); }],
      mon: [function () { return M.mon; }, function (v) { M.mon = v; }], phn: [function () { return M.phn; }, function (v) { M.phn = v; }], talk: [function () { return M.talk; }, function (v) { M.talk = v; }]
    };
    [0, 1, 2, 3].forEach(function (k) { KV['s' + (k + 1)] = [function () { var b = S.sendBank * 4 + k; return b < 4 ? fpos(cm().send[b]) : 0; }, function (v) { var b = S.sendBank * 4 + k; if (b < 4) { cm().send[b] = fdb(v); if (S.sof === b) S.sawSof = true; } }]; });
    Object.keys(KN).forEach(function (id) { knob(id, KN[id], KN[id][3], KV[id][0], KV[id][1]); });
    // 화면 아래 노브 6개 — 화면 맨 아래 줄의 값을 바꿈
    var ENCMAP = ['gain', 'lcf', 'gthr', 'dthr', 'eqg', 'mpan'];
    ENC.forEach(function (x, i) { knob('enc' + i, [x, 362, 30], '화면 노브 ' + (i + 1), KV[ENCMAP[i]][0], KV[ENCMAP[i]][1]); });

    /* ---------- 그리기 */
    function lit(b, on) { if (!b) return; b.classList.toggle('on', !!on); b.setAttribute('aria-pressed', String(!!on)); }
    function knobDraw(id) { var k = knobs[id], v = clamp(k.get(), 0, 1), dots = k.el.querySelectorAll('.dots circle'); dots.forEach(function (c, i) { var on = i / 12 <= v + 1e-6 && !(id.indexOf('s') === 0 && id.length === 2 && S.sendBank > 0); c.setAttribute('fill', on ? '#ff8a1f' : '#3a2412'); c.setAttribute('filter', ''); }); k.el.setAttribute('aria-valuenow', Math.round(v * 100)); }
    function stripDraw(o, it) {
      var main = o.side === 'main', inf = main ? null : itemInfo(it);
      if (main) inf = { no: 'MAIN', name: 'LR', color: '#fca5a5', get: function () { return M.main; }, mute: function () { return M.mainMute; }, meter: function () { return mainLv() + 12; }, sel: false };
      o.item = it; o.inf = inf;
      o.lcd.style.setProperty('--c', inf.color); o.lcd.classList.toggle('sof', !!inf.sof); o.lcd.innerHTML = '<span>' + esc(inf.no) + '</span><b>' + esc(inf.name) + '</b>';
      lit(o.sel, inf.sel); lit(o.mute, inf.mute ? inf.mute() : false); if (o.solo) lit(o.solo, inf.solo ? inf.solo() : false);
      o.cap.classList.toggle('sof', !!inf.sof); o.cap.style.display = inf.none ? 'none' : '';
      [o.sel, o.mute, o.solo].forEach(function (b) { if (b) b.classList.toggle('dim', !!inf.none); });
      var v = inf.get ? inf.get() : NINF; capPos(o, fpos(v)); o.val.textContent = inf.none ? '' : fmt(v);
      o.cap.setAttribute('aria-label', inf.no + ' ' + inf.name + (inf.sof ? ' → BUS ' + (S.sof + 1) + ' 보내는 양' : ' 페이더')); o.cap.setAttribute('aria-valuetext', fmt(v) + ' dB');
    }
    function capPos(o, p) { o.cap.style.top = ((1 - p) * (ROW.fBot - ROW.fTop) / (ROW.fBot - ROW.fTop + 24) * 100 + 12 / (ROW.fBot - ROW.fTop + 24) * 100).toFixed(3) + '%'; }
    function scrHtml() {
      var n = S.sel, c = CHS[n - 1], m = M.ch[n - 1], sc = scenes[S.sceneCur], h = '';
      var head = '<div class="hd"><span><b>' + String(n).padStart(2, '0') + '</b> ' + esc(c[0]) + '</span><small>씬 ' + sc[0] + ' · ' + esc(sc[1]) + (S.dirty ? ' *' : '') + '</small></div>';
      var sof = S.sof >= 0 ? '<div class="sof">SENDS ON FADER → BUS ' + (S.sof + 1) + ' ' + esc(BUSES[S.sof][0]) + '</div>' : '';
      function oo(v) { return '<span class="' + (v ? 'on' : 'off') + '">' + (v ? 'ON' : 'OFF') + '</span>'; }
      if (S.page === 'scenes') {
        h = '<div class="bd"><b>SCENES — PREV · NEXT 로 고르고 GO</b><div class="lst">' + scenes.map(function (s, i) { return '<div class="' + (i === S.sceneCur ? 'cur' : '') + '">' + s[0] + ' · ' + esc(s[1]) + '</div>'; }).join('') + '</div>' +
          '<div class="' + (S.dirty ? '' : 'off') + '">' + (S.dirty ? '불러온 뒤에 바꾼 설정이 있어요' : '씬과 같은 상태예요') + (undo ? ' · UNDO 가능' : '') + '</div></div>';
      } else if (S.page === 'meters') {
        h = '<div class="bd"><b>METERS — 입력 1–20 · BUS 1–4 · MAIN</b><div class="mt">' + Array.apply(null, Array(25)).map(function (x, i) { return '<i data-sm="' + i + '"></i>'; }).join('') + '</div></div>';
      } else if (S.page === 'mutegrp') {
        h = '<div class="bd"><b>MUTE GRP — 아래 MUTE GROUPS 버튼 1–6</b><div class="lst">' + MGS.map(function (g, k) { return '<div class="' + (M.mg[k] ? 'cur' : '') + '">' + (k + 1) + ' · ' + esc(g[0]) + (g[1].length ? ' (CH ' + g[1][0] + (g[1].length > 1 ? '–' + g[1][g[1].length - 1] : '') + ')' : '') + (M.mg[k] ? ' — 꺼짐' : '') + '</div>'; }).join('') + '</div></div>';
      } else if (INFO[S.page]) {
        h = '<div class="bd"><b>' + S.page.toUpperCase() + '</b><div>' + esc(INFO[S.page]) + '</div><div class="off">이 실습에서는 HOME 화면을 써요.</div></div>';
      } else {
        h = '<div class="bd">' + sof + '<div class="grid">' +
          '<div><span>CONFIG</span>GAIN ' + (m.gain > 0 ? '+' : '') + m.gain.toFixed(1) + ' dB<br>48V ' + oo(m.p48) + ' Ø ' + oo(m.phase) + '</div>' +
          '<div><span>LOW CUT</span>' + oo(m.lc) + ' ' + m.lcf + ' Hz</div>' +
          '<div><span>GATE · DYN</span>GATE ' + oo(m.gate) + '<br>COMP ' + oo(m.dyn) + '</div>' +
          '<div><span>EQ · ' + EQB[S.band] + '</span>' + oo(m.eq) + ' ' + (m.eqg[S.band] > 0 ? '+' : '') + m.eqg[S.band].toFixed(1) + ' dB</div>' +
          '<div><span>SENDS</span>' + BUSES.map(function (b, k) { return (k + 1) + ' ' + fmt(m.send[k]); }).join(' · ') + '</div>' +
          '<div><span>MAIN</span>LR ' + oo(m.lr) + ' · ' + (m.pan === 0 ? 'C' : (m.pan < 0 ? 'L' : 'R') + Math.abs(m.pan)) + '<br>' + fmt(m.fader) + ' dB</div></div>' +
          '<div style="display:flex;align-items:center;gap:.3cqw"><span style="font-size:.6cqw;color:#93c5fd">입력</span><div class="mt" style="height:.7cqw;flex:1;flex-direction:row"><i data-si="1" style="clip-path:inset(0 var(--cut,100%) 0 0);background:linear-gradient(90deg,#22c55e 0 70%,#facc15 70% 90%,#ef4444 90%)"></i></div><span data-si="v" style="font-size:.6cqw;min-width:3.2cqw;text-align:right"></span></div></div>';
      }
      var enc = '<div class="enc">' + [['GAIN', (m.gain > 0 ? '+' : '') + m.gain.toFixed(1)], ['LC FREQ', m.lcf + 'Hz'], ['GATE', m.gthr], ['DYN', m.dthr], ['EQ ' + EQB[S.band], m.eqg[S.band].toFixed(1)], ['PAN', m.pan === 0 ? 'C' : m.pan]].map(function (e) { return '<div>' + e[0] + '<b>' + e[1] + '</b></div>'; }).join('') + '</div>';
      return head + h + (S.page === 'home' ? enc : '');
    }
    function render() {
      var L = leftItems(), R = rightItems();
      strips.forEach(function (o) { stripDraw(o, o.side === 'L' ? L[o.i] : o.side === 'R' ? R[o.i] : null); });
      ['in1', 'in2', 'aux', 'busm'].forEach(function (k) { lit(btns['layer.' + k], S.layerL === k); });
      ['dca', 'bus1', 'bus2', 'mtx'].forEach(function (k) { lit(btns['layerR.' + k], S.layerR === k); });
      lit(btns.sof, S.sof >= 0);
      var m = cm(); lit(btns.p48, m.p48); lit(btns.phase, m.phase); lit(btns.lc, m.lc); lit(btns.gate, m.gate); lit(btns.dyn, m.dyn); lit(btns.eq, m.eq); lit(btns.lr, m.lr); lit(btns.mono, m.mono);
      [0, 1, 2, 3].forEach(function (k) { lit(btns['band' + k], S.band === k); lit(btns['sb' + k], S.sendBank === k); });
      lit(btns.monmono, S.mono); lit(btns.dim, S.dim); lit(btns.talka, S.talkA); lit(btns.talkb, S.talkB);
      M.mg.forEach(function (v, k) { lit(btns['mg' + k], v); });
      MENU.forEach(function (p) { lit(btns['menu.' + p[0]], S.page === p[0]); }); lit(btns['sc.view'], S.page === 'scenes');
      Object.keys(knobs).forEach(knobDraw);
      scr.innerHTML = scrHtml(); judge(); renderRead();
    }
    function lv(d) { return !isFinite(d) || d < -60 ? '<b class="bad">소리 없음</b>' : '<b>' + fmt(d) + ' dB</b>'; }
    function renderRead() {
      var inn = chIn(S.sel);
      read.innerHTML = '<span>지금 상태 · 교육용 근사</span><span>고른 채널 CH ' + S.sel + ' ' + esc(CHS[S.sel - 1][0]) + ' 입력' + (isFinite(inn) ? '<b>' + fmt(inn) + ' dBFS</b>' : '<b class="bad">신호 없음</b>') + '</span>' +
        '<span>메인(회중석)' + lv(mainLv()) + '</span>' + BUSES.map(function (b, k) { return '<span>BUS ' + (k + 1) + ' ' + esc(b[0]) + lv(busLv(k)) + '</span>'; }).join('') + '<span>DCA 1 악기<b>' + fmt(M.dca[0]) + ' dB</b></span>';
    }
    function refreshValues() {   // 끄는 중에는 이것만 (요소를 다시 만들지 않음)
      strips.forEach(function (o) { if (!o.inf || o.inf.none) return; var v = o.inf.get(); if (!o.drag) capPos(o, fpos(v)); o.val.textContent = fmt(v); o.cap.setAttribute('aria-valuetext', fmt(v) + ' dB'); });
      Object.keys(knobs).forEach(knobDraw); scr.innerHTML = scrHtml(); if (!drag) judge(); renderRead();   // 끄는 중에는 과제 판정 안 함 — 손을 뗄 때 판정
    }
    /* ---------- 미터 움직임 */
    function ledSet(box, d, n) {
      var is = box.querySelectorAll('i'), N = is.length;
      is.forEach(function (x, i) { var th = n[i], on = isFinite(d) && d >= th; x.className = on ? 'on ' + (i === 0 ? 'r' : i <= (N > 6 ? 2 : 1) ? 'y' : 'g') : ''; });
    }
    var STRIP_TH = [-1, -6, -12, -18, -30, -60], PRE_TH = [-1, -3, -6, -9, -12, -18, -30, -50];
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick); S.frame++; if (S.frame % 3) return;
      function env(i) { return 20 * Math.log10(0.5 + 0.5 * Math.abs(Math.sin(S.frame / (19 + i % 5))) * Math.abs(Math.sin(S.frame / (6.1 + i % 3)))); }
      strips.forEach(function (o, i) { if (!o.inf || !o.inf.meter) { ledSet(o.mtr, NINF, STRIP_TH); return; } ledSet(o.mtr, o.inf.meter() + env(i), STRIP_TH); });
      var pk = chIn(S.sel), now = isFinite(pk) ? pk + env(3) : NINF; ledSet(pm, now, PRE_TH);
      var cmp = cm().dyn && isFinite(now) ? Math.max(0, now - cm().dthr) * 0.6 : 0; ledSet(gm, cmp > 0 ? -60 + cmp * 12 : NINF, [-1, -12, -24, -36, -48, -58]);
      var ml = mainLv(); [0, 1, 2].forEach(function (c) { var d = c === 0 ? (strips.some(function (o) { return o.inf && o.inf.solo && o.inf.solo(); }) ? ml : NINF) : ml + env(c + 7) + 12; mm.querySelectorAll('[data-mm="' + c + '"] i').forEach(function (x, i) { var th = 0 - i * 2.5; x.style.background = isFinite(d) && d >= th ? (i < 3 ? '#ff4d4d' : i < 8 ? '#ffd23d' : '#3dff8a') : '#25272b'; }); });
      var si = scr.querySelector('[data-si="1"]'), sv = scr.querySelector('[data-si="v"]'); if (si) { si.style.setProperty('--cut', (100 - clamp((now + 60) / 60 * 100, 0, 100)) + '%'); sv.textContent = isFinite(pk) ? fmt(pk) + ' dBFS' : '신호 없음'; }
      scr.querySelectorAll('[data-sm]').forEach(function (x) { var i = +x.getAttribute('data-sm'), d = i < 20 ? chIn(i + 1) : i < 24 ? busLv(i - 20) + 12 : mainLv() + 12; x.style.setProperty('--cut', (100 - clamp((d + env(i) + 60) / 60 * 100, 0, 100)) + '%'); });
    }

    /* ---------- 조작 */
    function stripByEl(n) { return strips.filter(function (o) { return o.cap === n || o.slot === n; })[0]; }
    var drag = null;
    function faderFromY(o, clientY) { var r = o.slot.getBoundingClientRect(), pad = r.height * 12 / (ROW.fBot - ROW.fTop + 24), p = 1 - (clientY - r.top - pad) / (r.height - 2 * pad); return clamp(p, 0, 1); }
    function setFader(o, p) { if (!o.inf || o.inf.none) return; var v = fdb(p); if (o.side === 'main') M.main = v; else o.inf.set(v); capPos(o, p); changed(); refreshValues(); }
    function onDown(e) {
      var t = e.target, cap = t.closest('.x32p-cap'), slot = t.closest('.x32p-slot'), kn = t.closest('.x32p-knob');
      if (cap || slot) { var o = stripByEl(cap || slot); if (!o || !o.inf || o.inf.none) return; e.preventDefault(); o.drag = true; o.cap.classList.add('drag'); drag = { type: 'f', o: o, id: e.pointerId };
        try { (cap || slot).setPointerCapture(e.pointerId); } catch (x) { /* noop */ }
        if (!cap) setFader(o, faderFromY(o, e.clientY)); else { drag.dy = e.clientY; drag.p0 = fpos(o.side === 'main' ? M.main : o.inf.get()); } return; }
      if (kn) { e.preventDefault(); var id = kn.getAttribute('data-k'); drag = { type: 'k', id: id, y: e.clientY, v0: knobs[id].get() }; try { kn.setPointerCapture(e.pointerId); } catch (x) { /* noop */ } kn.focus({ preventScroll: true }); }
    }
    function onMove(e) {
      if (!drag) return; e.preventDefault();
      if (drag.type === 'f') { var o = drag.o, r = o.slot.getBoundingClientRect(), span = r.height * (ROW.fBot - ROW.fTop) / (ROW.fBot - ROW.fTop + 24); var p = drag.dy != null ? clamp(drag.p0 - (e.clientY - drag.dy) / span, 0, 1) : faderFromY(o, e.clientY); setFader(o, p); return; }
      var k = knobs[drag.id], v = clamp(drag.v0 - (e.clientY - drag.y) / 160, 0, 1); k.set(v); changed(); refreshValues();
    }
    function onUp() { if (!drag) return; if (drag.type === 'f') { drag.o.drag = false; drag.o.cap.classList.remove('drag'); } drag = null; refreshValues(); }
    function onWheel(e) { var kn = e.target.closest && e.target.closest('.x32p-knob'); if (!kn) return; e.preventDefault(); var k = knobs[kn.getAttribute('data-k')]; k.set(clamp(k.get() + (e.deltaY < 0 ? 1 : -1) * 0.025, 0, 1)); changed(); refreshValues(); }
    function onKey(e) {
      var t = e.target, d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      if (t.classList.contains('x32p-knob')) { e.preventDefault(); var k = knobs[t.getAttribute('data-k')]; k.set(clamp(k.get() + d * 0.02, 0, 1)); changed(); refreshValues(); }
      else if (t.classList.contains('x32p-cap')) { e.preventDefault(); var o = stripByEl(t); if (o && o.inf && !o.inf.none) setFader(o, clamp(fpos(o.side === 'main' ? M.main : o.inf.get()) + d * 0.02, 0, 1)); }
    }
    function onClick(e) {
      var zb = e.target.closest('[data-zoom]'); if (zb && el.contains(zb)) { var z = +zb.getAttribute('data-zoom'); stage.style.width = 'max(' + (100 * z) + '%,' + Math.round(940 * z) + 'px)'; el.querySelectorAll('[data-zoom]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === zb)); }); return; }
      var b = e.target.closest('.x32p-btn'); if (!b || !el.contains(b) || b.classList.contains('dim')) return; var id = b.getAttribute('data-b'), m = cm(), a;
      if ((a = id.match(/^(L|R|MAIN)(\d*)\.(sel|mute|solo)$/)) || id === 'main.solo' || id === 'main.clearsolo') {
        if (id === 'main.clearsolo') { M.ch.forEach(function (c) { c.solo = false; }); render(); return; }
        var o = id === 'main.solo' ? strips[24] : strips.filter(function (s) { return s.id === (a[1] === 'MAIN' ? 'MAIN' : a[1] + a[2]); })[0], what = id === 'main.solo' ? 'solo' : a[3], it = o.item;
        if (o.side === 'main') { if (what === 'mute') { M.mainMute = !M.mainMute; changed(); } render(); return; }
        if (!it || it.kind === 'none') return;
        if (what === 'sel') { if (it.kind === 'ch') S.sel = it.n; else if (it.kind === 'bus' && S.sof >= 0) S.sof = it.n; render(); return; }
        if (what === 'mute') { o.inf.tmute(); changed(); render(); return; }
        if (what === 'solo' && o.inf.tsolo) { o.inf.tsolo(); render(); return; }
        return;
      }
      if ((a = id.match(/^layer\.(\w+)$/))) { S.layerL = a[1]; render(); return; }
      if ((a = id.match(/^layerR\.(\w+)$/))) { S.layerR = a[1]; render(); return; }
      if (id === 'sof') { if (S.sof >= 0) S.sof = -1; else { S.sof = 0; S.layerR = 'bus1'; } render(); return; }
      if (['p48', 'phase', 'lc', 'gate', 'dyn', 'eq', 'lr', 'mono'].indexOf(id) >= 0) { m[id] = !m[id]; changed(); render(); return; }
      if ((a = id.match(/^band(\d)$/))) { S.band = +a[1]; render(); return; }
      if ((a = id.match(/^sb(\d)$/))) { S.sendBank = +a[1]; render(); return; }
      if (id === 'monmono') { S.mono = !S.mono; render(); return; } if (id === 'dim') { S.dim = !S.dim; render(); return; }
      if (id === 'talka') { S.talkA = !S.talkA; render(); return; } if (id === 'talkb') { S.talkB = !S.talkB; render(); return; }
      if ((a = id.match(/^mg(\d)$/))) { if (MGS[+a[1]][1].length) { M.mg[+a[1]] = !M.mg[+a[1]]; changed(); } render(); return; }
      if ((a = id.match(/^menu\.(\w+)$/))) { S.page = a[1]; render(); return; }
      if (id === 'sc.view') { S.page = S.page === 'scenes' ? 'home' : 'scenes'; render(); return; }
      if (id === 'sc.prev' || id === 'sc.next') { S.page = 'scenes'; S.sceneCur = clamp(S.sceneCur + (id === 'sc.next' ? 1 : -1), 0, scenes.length - 1); render(); return; }
      if (id === 'sc.go') { var was = S.dirty; undo = { M: clone(M), dirty: S.dirty }; M = clone(scenes[S.sceneCur][2]); S.dirty = false; S.page = 'scenes'; if (was && S.sceneCur === 0) hit('scene'); render(); flash(b); return; }
      if (id === 'sc.undo') { if (undo) { M = undo.M; S.dirty = undo.dirty; undo = null; } render(); return; }
      if (id === 'eqmode' || /^nav\./.test(id)) { flash(b); return; }
    }
    function flash(b) { b.classList.add('on'); setTimeout(function () { if (alive) b.classList.remove('on'); }, 220); }
    function onOver(e) { var t = e.target.closest && e.target.closest('[data-tip], .x32p-cap'); if (!t || !stage.contains(t)) { hint.style.display = 'none'; return; } var txt = t.getAttribute('data-tip') || t.getAttribute('aria-label'); var r = t.getBoundingClientRect(), sr = stage.getBoundingClientRect(); hint.textContent = txt; hint.style.left = (r.left + r.width / 2 - sr.left) + 'px'; hint.style.top = (r.top - sr.top) + 'px'; hint.style.display = 'block'; }
    function onLeave() { hint.style.display = 'none'; }
    stage.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove, { passive: false }); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    stage.addEventListener('wheel', onWheel, { passive: false }); stage.addEventListener('keydown', onKey); el.addEventListener('click', onClick);
    stage.addEventListener('mouseover', onOver); stage.addEventListener('mouseleave', onLeave);
    render(); tick();

    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); el.removeEventListener('click', onClick); el.innerHTML = ''; },
      state: function () {
        var c = M.ch[16];
        return { ready: true, audio: false, layerL: S.layerL, layerR: S.layerR, sel: S.sel, sof: S.sof, page: S.page, scene: scenes[S.sceneCur][0], dirty: S.dirty,
          ch17: { p48: c.p48, gain: c.gain, input: fin(chIn(17)), lc: c.lc, lcf: c.lcf }, ch1: { fader: fin(M.ch[0].fader), send1: fin(M.ch[0].send[0]), out: fin(chOut(1)) },
          dca: M.dca.map(fin), main: fin(mainLv()), bus: [0, 1, 2, 3].map(function (k) { return fin(busLv(k)); }), mg: M.mg.slice(), done: Object.keys(S.done),
          lcds: strips.map(function (o) { return o.inf ? o.inf.no + ' ' + o.inf.name : ''; }) };
      },
      // set: 테스트·디버그용 (layerL, layerR, sel, sof, path 없이 간단히)
      set: function (o) { o = o || {}; ['layerL', 'layerR', 'sel', 'sof', 'page', 'sceneCur'].forEach(function (k) { if (o[k] != null) S[k] = o[k]; }); render(); return this.state(); },
      knobValue: function (id) { return knobs[id] ? knobs[id].get() : null; }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.x32Photo = x32Photo;
})();
