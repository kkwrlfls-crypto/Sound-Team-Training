/* =============================================================================
   03-2 디지털 콘솔 실습 — X32 사진 위 표면(surface) (2026-11-08 다시 씀: X32Model 기반)
   - STASims.x32Photo(el, { onTask }) → { destroy, state, set, model, knobValue }
   - 콘솔 상태 · 규칙은 window.X32Model(lessons/modules/x32/x32_model.js), 가운데 화면은 window.X32Screen, 소리는 window.X32Audio.
     화면 · 소리 파일이 없거나 오류가 나도 표면은 그대로 동작해요(간단한 대체 화면을 그림).
   - Behringer 공식 윗면 사진(2000×1389, 콘솔 부분 y 0~1200) 위에 투명 단추 · 페이더 · 노브 · LCD · 미터를 겹쳐 그림.
     좌표는 모두 사진 픽셀(2026-11-08 사진을 격자와 함께 확대해 다시 실측).
   - 동작은 X32 사용 설명서 기준: 레이어 · SELECT · SOLO · MUTE · 모터 페이더 · 스크리블 LCD · 채널 섹션(VIEW 로 화면 탭) ·
     메뉴 단추 · 화면 아래 엔코더 6개 · PAGE · LAYER · MONITOR · TALKBACK · SCENES · ASSIGN · MUTE GROUPS · SENDS ON FADER · USB 녹음기.
   ============================================================================= */
(function () {
  'use strict';
  var NINF = -Infinity, OFF = -90;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(d) { return d == null || !isFinite(d) || d <= OFF ? '−∞' : (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d).toFixed(Math.abs(d) < 10 ? 1 : 0); }
  function fin(d) { return d == null || !isFinite(d) || d <= OFF ? null : Math.round(d * 10) / 10; }
  function psum(arr) { var p = 0; arr.forEach(function (d) { if (isFinite(d)) p += Math.pow(10, d / 10); }); return p > 0 ? 10 * Math.log10(p) : NINF; }
  // X32 페이더 눈금(사진의 눈금과 같음: +10 = y777, 0 = y832, −10 = y888, −30 = y944, −60 = y985, −∞ = y999)
  function f2db(f) { if (f <= 0) return NINF; if (f >= 0.5) return f * 40 - 30; if (f >= 0.25) return f * 80 - 50; if (f >= 0.0625) return f * 160 - 70; return f * 480 - 90; }
  function db2f(d) { if (d == null || !isFinite(d) || d <= OFF) return 0; if (d < -60) return (d + 90) / 480; if (d < -30) return (d + 70) / 160; if (d < -10) return (d + 50) / 80; return Math.min(1, (d + 30) / 40); }

  /* ---------------- 사진 위 위치 (px) — 콘솔마다 「배치(layout)」 하나. X32 = 2026-11-08 실측, M32 = 아래 M32L ---------------- */
  var X32L = {
    key: 'x32', name: 'X32', brand: 'Behringer', alt: 'Behringer X32 윗면 (공식 제품 사진)',
    IMG: 'https://cdn-media.empowertribe.com/cdn-cgi/image/width=2000,quality=85,format=auto/e5ba63fb0e6f4e69a1626c5811115e16/Image_BE_0603-ACE_X32_Top_XL.png',
    PW: 2000, PH: 1200,
    SCREEN_RECT: { x: 1088, y: 101, w: 317, h: 190 },          // 가운데 컬러 화면(800×480 비율)
    STRIP_IN: [213, 266, 318, 371, 424, 476, 530, 582, 634, 686, 738, 790, 844, 895, 948, 1000],
    STRIP_R: [1115, 1167, 1220, 1272, 1325, 1377, 1430, 1481], STRIP_MAIN: 1552,
    ROW: { select: 485, solo: 609, lcd: 653, mute: 706, fTop: 777, fBot: 999, led: [518, 530, 536.5, 543, 550.5, 557.5, 564.5, 576] },
    BW: 28, BH: 22, KNOB_BOX: 64, ENC_BOX: 40, LCD: [45, 34], SLOT_W: 40,
    KN: { // 노브: [x, y, 지름, 이름]
      gain: [204, 207, 32, 'GAIN'], lcf: [345, 207, 32, 'LOW CUT FREQUENCY'], gthr: [204, 349, 32, 'GATE THRESHOLD'], dthr: [345, 349, 32, 'DYNAMICS THRESHOLD'],
      eqq: [551, 200, 32, 'EQ Q'], eqf: [610, 288, 32, 'EQ FREQ'], eqg: [517, 350, 32, 'EQ GAIN'],
      s1: [776, 200, 30, 'BUS SENDS 노브 1'], s2: [776, 267, 30, 'BUS SENDS 노브 2'], s3: [776, 333, 30, 'BUS SENDS 노브 3'], s4: [776, 397, 30, 'BUS SENDS 노브 4'],
      mlev: [954, 200, 30, 'MAIN BUS LEVEL (MONO/CENTER 로 보내는 양)'], mpan: [954, 334, 30, 'PAN / BAL'],
      mon: [1716, 182, 28, 'MONITOR LEVEL (모니터 스피커 크기)'], phn: [1716, 270, 28, 'PHONES LEVEL (헤드폰 크기)'], talk: [1826, 270, 28, 'TALK LEVEL (토크백 마이크 크기)'],
      as1: [1629, 591, 30, 'ASSIGN 노브 1'], as2: [1698, 591, 30, 'ASSIGN 노브 2'], as3: [1768, 591, 30, 'ASSIGN 노브 3'], as4: [1837, 591, 30, 'ASSIGN 노브 4']
    },
    ENC: [1114, 1170, 1226, 1283, 1339, 1397], ENC_Y: 364,
    MENU: [['home', 'HOME', 101], ['meters', 'METERS', 131], ['routing', 'ROUTING', 160], ['setup', 'SETUP', 189], ['library', 'LIBRARY', 218], ['effects', 'EFFECTS', 247], ['mutegrp', 'MUTE GRP', 276], ['utility', 'UTILITY', 305]],
    MENU_X: 1576, MENU_W: 54, MENU_H: 21,
    LAYER_L: [['ch1-16', 719, 'CH 1-16'], ['ch17-32', 776, 'CH 17-32'], ['aux-fx', 832, 'AUX IN / USB · FX RETURNS'], ['bus1-8', 889, 'BUS MASTER']],
    LAYER_R: [['dca', 718, 'GROUP DCA 1-8'], ['bus1-8', 775, 'BUS 1-8'], ['bus9-16', 832, 'BUS 9-16'], ['mtx-main', 889, 'MATRIX 1-6 / MAIN C']],
    LAYER_LX: 162, LAYER_RX: 1063, LAYER_W: 28, LAYER_H: 23, SOF: [1063, 499, 28, 23], DAW: [160, 497, 28, 23],
    EQ_TYPE_LED: [['HCut', 220], ['HShv', 232], ['VEQ', 260], ['PEQ', 270], ['LShv', 296], ['LCut', 307]], EQ_LED_X: 453, EQ_LED: [10, 6],
    BTNS: [['p48', 178, 264, '+48V (팬텀 전원 — 콘덴서 마이크 전기)'], ['phase', 232, 264, 'Ø (극성 뒤집기: 소리 물결을 위아래로 뒤집기)'], ['lc', 346, 264, 'LOW CUT (낮은 소리 걸러 내기) 켜기'], ['v.config', 396, 276, 'VIEW — 화면에 CONFIG/PREAMP 페이지', 'y', 18, 14],
     ['gate', 204, 412, 'GATE 켜기 (작은 소리 막기)'], ['v.gate', 254, 420, 'VIEW — 화면에 GATE 페이지', 'y', 18, 14], ['dyn', 346, 412, 'DYNAMICS 켜기 (컴프: 큰 소리 누르기)'], ['v.dyn', 396, 420, 'VIEW — 화면에 DYNAMICS 페이지', 'y', 18, 14],
     ['eqmode', 492, 264, 'EQ MODE (고른 밴드의 모양 바꾸기)'], ['band3', 685, 227, 'EQ HIGH 밴드 고르기'], ['band2', 685, 274, 'EQ HIGH MID 밴드 고르기'], ['band1', 685, 326, 'EQ LOW MID 밴드 고르기'], ['band0', 685, 375, 'EQ LOW 밴드 고르기'],
     ['eq', 517, 410, 'EQUALIZER 켜기'], ['v.eq', 713, 419, 'VIEW — 화면에 EQ 페이지', 'y', 18, 14],
     ['sb0', 844, 227, 'BUS SENDS 1-4 (노브 4개가 BUS 1-4)'], ['sb1', 844, 277, 'BUS SENDS 5-8'], ['sb2', 844, 326, 'BUS SENDS 9-12'], ['sb3', 844, 376, 'BUS SENDS 13-16'], ['v.sends', 872, 422, 'VIEW — 화면에 SENDS 페이지', 'y', 18, 14],
     ['mono', 954, 263, 'MONO BUS 로 보내기 (LEVEL 노브로 양 정하기)'], ['lr', 954, 396, 'STEREO BUS (메인 LR) 로 보내기'], ['v.main', 995, 422, 'VIEW — 화면에 MAIN 페이지', 'y', 18, 14],
     ['v.usb', 995, 127, 'USB RECORDER VIEW — 화면에 녹음기 페이지', 'y', 18, 14],
     ['monmono', 1715, 348, '모니터 MONO (헤드폰 · 모니터를 모노로)'], ['dim', 1715, 397, '모니터 DIM (모니터 소리를 잠깐 줄이기)'], ['v.mon', 1748, 422, 'MONITOR VIEW — 화면에 모니터 페이지', 'y', 18, 14],
     ['talka', 1826, 348, 'TALK A (토크백 마이크를 A 로)'], ['talkb', 1826, 397, 'TALK B (토크백 마이크를 B 로)'], ['v.talk', 1859, 422, 'TALKBACK VIEW — 화면에 토크백 설정', 'y', 18, 14],
     ['sc.prev', 1629, 502, 'SCENES: PREV (앞 씬 고르기)'], ['sc.next', 1678, 502, 'SCENES: NEXT (다음 씬 고르기)'], ['sc.undo', 1733, 502, 'SCENES: UNDO (불러오기 되돌리기)', 'y', 27, 21], ['sc.go', 1802, 502, 'SCENES: GO (고른 씬 불러오기)', 'g', 27, 21], ['sc.view', 1859, 522, 'SCENES VIEW — 화면에 씬 목록', 'y', 18, 14],
     ['as.setA', 1663, 810, 'ASSIGN SET A', 'r', 18, 14], ['as.setB', 1732, 810, 'ASSIGN SET B', 'r', 18, 14], ['as.setC', 1802, 810, 'ASSIGN SET C', 'r', 18, 14], ['v.assign', 1858, 841, 'ASSIGN VIEW — 화면에 ASSIGN 설정', 'y', 18, 14]],
    ASSIGN_B: [[1628, 705], [1698, 705], [1767, 705], [1836, 705], [1628, 755], [1698, 755], [1767, 755], [1836, 755]], ASSIGN_BS: [27, 21],
    MG_B: [[1623, 907], [1674, 907], [1623, 952], [1674, 952], [1623, 997], [1674, 997]], MG_BS: [27, 21],
    NAV: [['up', 1500, 342, 'LAYER ▲ (화면 안에서 위 줄로)'], ['down', 1500, 378, 'LAYER ▼ (화면 안에서 아래 줄로)'], ['pgl', 1557, 360, 'PAGE SELECT ◀ (앞 탭)'], ['pgr', 1593, 360, 'PAGE SELECT ▶ (다음 탭)']], NAV_S: 20,
    PRE_M: { box: [276, 202, 10, 68], x: 276, ys: [172, 184, 190, 198, 205, 212, 219, 231], s: [7, 4] },
    GR_M: { box: [276, 349, 10, 58], x: 276, ys: [331, 338, 346, 353, 360, 367], gate: 378, s: [7, 4] },
    USB_LED: [960, 133, 7, 5],
    MAIN_M: { xs: [1445, 1478, 1497], y0: 145, y1: 274, s: [7, 3.6] },
    ALCD: { xs: [1629, 1698, 1768, 1837], y: 655, w: 45, h: 31 }
  };
  var HOME_TABS = ['home', 'config', 'gate', 'dyn', 'eq', 'sends', 'main'];
  var LAYER_L = [['ch1-16', 719, 'CH 1-16'], ['ch17-32', 776, 'CH 17-32'], ['aux-fx', 832, 'AUX IN / USB · FX RETURNS'], ['bus1-8', 889, 'BUS MASTER']];
  var LAYER_R = [['dca', 718, 'GROUP DCA 1-8'], ['bus1-8', 775, 'BUS 1-8'], ['bus9-16', 832, 'BUS 9-16'], ['mtx-main', 889, 'MATRIX 1-6 / MAIN C']];
  var LL_OLD = { 'ch1-16': 'in1', 'ch17-32': 'in2', 'aux-fx': 'aux', 'bus1-8': 'busm', 'bus9-16': 'busm' }, LR_OLD = { dca: 'dca', 'bus1-8': 'bus1', 'bus9-16': 'bus2', 'mtx-main': 'mtx', user: 'user' };
  var EQ_BANDS = [['LOW', 375], ['LOW MID', 326], ['HIGH MID', 274], ['HIGH', 227]];
  var EQ_TYPE_LED = [['HCut', 220], ['HShv', 232], ['VEQ', 260], ['PEQ', 270], ['LShv', 296], ['LCut', 307]];
  var EQ_MODES = [['LCut', 'LShv', 'PEQ', 'VEQ'], ['PEQ', 'VEQ'], ['PEQ', 'VEQ'], ['PEQ', 'VEQ', 'HShv', 'HCut']];
  var MAIN_TH = [0, -1, -2, -3, -4, -6, -8, -10, -12, -15, -18, -21, -24, -27, -30, -33, -36, -39, -42, -45, -48, -51, -54, -57];
  var STRIP_TH = [-0.5, -6, -12, -18, -30, -60], PRE_TH = [-0.5, -3, -6, -9, -12, -18, -30, -60], GR_TH = [2, 4, 6, 10, 18, 30];
  var STEMS = [ // 기본 음원(임시): Local 입력 번호(0부터) ← 파일
    { input: 0, name: '인도자 (leadVox)', url: 'sources/leadVox.mp3' }, { input: 1, name: '싱어 1 (bav1)', url: 'sources/bav1.mp3' }, { input: 2, name: '싱어 2 (bav2)', url: 'sources/bav2.mp3' },
    { input: 3, name: 'A.기타 (gt)', url: 'sources/gt.mp3' }, { input: 4, name: '건반 (keysLR)', url: 'sources/keysLR.mp3', stereo: true }, { input: 6, name: '베이스 (bass)', url: 'sources/bass.mp3' },
    { input: 7, name: '드럼 (drumLR)', url: 'sources/drumLR.mp3', stereo: true }, { input: 14, name: '성가대 (bav3)', url: 'sources/bav3.mp3' }
  ];

  function injectCss() {
    if (document.getElementById('sta-x32p-css')) return;
    var st = document.createElement('style'); st.id = 'sta-x32p-css';
    st.textContent = [
      '.x32p{display:flex;flex-direction:column;gap:8px;min-width:0}',
      '.x32p-bar{display:flex;gap:6px 8px;align-items:center;flex-wrap:wrap;font-size:.78rem;color:var(--sta-ink-2,#475569);min-width:0}',
      '.x32p-bar .sp{flex:1 1 220px;min-width:0}',
      '.x32p-bar button,.x32p-bar select,.x32p-bar label.file{border:1px solid var(--sta-line,#cbd5e1);background:var(--sta-surface-2,#f1f5f9);color:inherit;font:inherit;font-weight:700;font-size:.74rem;padding:5px 10px;border-radius:999px;cursor:pointer;max-width:100%}',
      '.x32p-bar button[aria-pressed="true"]{background:var(--sta-blue,#2563eb);color:#fff;border-color:transparent}',
      '.x32p-bar .snd[aria-pressed="true"]{background:#16a34a}',
      '.x32p-bar label.file input{display:none}',
      '.x32p-bar .grp{display:flex;gap:6px;flex-wrap:wrap;align-items:center;min-width:0}',
      '.x32p-scroll{overflow:auto;border-radius:12px;background:#0f1b2b;border:1px solid #0b1220;max-height:82vh}',
      '.x32p-stage{position:relative;aspect-ratio:2000/1200;width:max(100%,940px);container-type:inline-size;user-select:none;-webkit-user-select:none;touch-action:pan-x pan-y;background:#2a2c31}',
      '.x32p-stage>img{position:absolute;left:0;top:0;width:100%;height:auto;pointer-events:none}',
      '.x32p-stage *{box-sizing:border-box}',
      '.x32p-btn{position:absolute;border:0;border-radius:.28cqw;background:linear-gradient(180deg,#6b6e75,#4b4e55);box-shadow:inset 0 -.12cqw 0 rgba(0,0,0,.45),0 0 0 .06cqw #111,0 0 0 .3cqw rgba(36,37,40,.96);cursor:pointer;padding:0;color:#e5e7eb}',
      '.x32p-btn:hover{filter:brightness(1.18)}',
      '.x32p-btn:focus-visible{outline:.15cqw solid #60a5fa;outline-offset:.08cqw}',
      '.x32p-btn.sm{border-radius:.18cqw;box-shadow:inset 0 -.08cqw 0 rgba(0,0,0,.45),0 0 0 .06cqw #111,0 0 0 .18cqw rgba(36,37,40,.96)}',
      '.x32p-btn.on.y{background:radial-gradient(circle,#fff3c4 0,#ffc93a 55%,#e69a00 100%);box-shadow:0 0 0 .3cqw rgba(36,37,40,.96),0 0 .9cqw rgba(255,180,0,.85)}',
      '.x32p-btn.on.g{background:radial-gradient(circle,#d9ffe9 0,#3dffa0 55%,#10b867 100%);box-shadow:0 0 0 .3cqw rgba(36,37,40,.96),0 0 .9cqw rgba(16,220,120,.8)}',
      '.x32p-btn.on.r{background:radial-gradient(circle,#ffe0e0 0,#ff5a5a 55%,#d81b1b 100%);box-shadow:0 0 0 .3cqw rgba(36,37,40,.96),0 0 .9cqw rgba(255,40,40,.8)}',
      '.x32p-btn.on.o{background:radial-gradient(circle,#ffe7cf 0,#ff9a3d 55%,#e36a00 100%);box-shadow:0 0 0 .3cqw rgba(36,37,40,.96),0 0 .9cqw rgba(255,120,0,.85)}',
      '.x32p-btn.blink.on{animation:x32pBlink 1s steps(2,start) infinite}',
      '@keyframes x32pBlink{to{filter:brightness(.45)}}',
      '.x32p-btn.dim{opacity:.55;cursor:default}',
      '.x32p-bl{display:block;font-size:.5cqw;font-weight:900;color:#e5e7eb;letter-spacing:-.01em;line-height:1;white-space:nowrap}.x32p-btn.on .x32p-bl{color:#052e16}',
      '.x32p-lcd{position:absolute;border-radius:.2cqw;background:var(--c,#475569);color:var(--fg,#0b0c0e);display:flex;flex-direction:column;justify-content:space-between;align-items:stretch;padding:.12cqw .22cqw;line-height:1.05;box-shadow:inset 0 0 0 .08cqw rgba(0,0,0,.35),0 0 .5cqw var(--glow,transparent);pointer-events:auto;cursor:pointer;overflow:hidden}',
      '.x32p-lcd span{font-size:.5cqw;font-weight:900;display:flex;justify-content:space-between;white-space:nowrap}.x32p-lcd span i{font-style:normal;opacity:.85;font-size:.42cqw}.x32p-lcd b{font-size:.54cqw;font-weight:900;line-height:1.08;overflow:hidden;word-break:break-all;max-height:2.2em;display:flex;align-items:flex-end}',
      '.x32p-lcd.inv{box-shadow:inset 0 0 0 .1cqw var(--fg)}',
      '.x32p-lcd.sof{box-shadow:inset 0 0 0 .16cqw #f97316}',
      '.x32p-lcd.none{background:#111214;color:#4b5563}',
      '.x32p-slot{position:absolute;border-radius:.2cqw;background:repeating-linear-gradient(180deg,transparent 0,transparent 4.1%,rgba(255,255,255,.28) 4.1%,rgba(255,255,255,.28) 4.6%) 0 0/20% 100% no-repeat,repeating-linear-gradient(180deg,transparent 0,transparent 4.1%,rgba(255,255,255,.28) 4.1%,rgba(255,255,255,.28) 4.6%) 100% 0/20% 100% no-repeat,linear-gradient(90deg,transparent 0 44%,#030303 44% 56%,transparent 56%),#26272b;cursor:pointer}',
      '.x32p-cap{position:absolute;left:50%;width:82%;height:0;cursor:grab;touch-action:none;transition:top .45s cubic-bezier(.3,.7,.3,1)}',
      '.x32p-cap.drag{transition:none;cursor:grabbing}',
      '.x32p-cap i{position:absolute;left:0;right:0;top:-1.25cqw;height:2.5cqw;border-radius:.25cqw;background:linear-gradient(180deg,#f4f5f7 0,#c9ccd2 45%,#9ea2aa 52%,#d9dce1 100%);box-shadow:0 .25cqw .5cqw rgba(0,0,0,.6),inset 0 -.1cqw 0 rgba(0,0,0,.3)}',
      '.x32p-cap i::after{content:"";position:absolute;left:12%;right:12%;top:47%;height:.12cqw;background:#3f4249}',
      '.x32p-cap.sof i{background:linear-gradient(180deg,#ffe6cc 0,#ffa64d 45%,#e07000 52%,#ffbf80 100%)}',
      '.x32p-cap.main i{background:linear-gradient(180deg,#ffd6d6 0,#f87171 45%,#c81e1e 52%,#fca5a5 100%)}',
      '.x32p-cap:focus-visible{outline:none}.x32p-cap:focus-visible i{outline:.15cqw solid #60a5fa}',
      '.x32p-val{position:absolute;font-size:.66cqw;font-weight:800;color:#fde68a;text-align:center;font-variant-numeric:tabular-nums;pointer-events:none;text-shadow:0 0 .2cqw #000}',
      '.x32p-mtr{position:absolute;display:flex;flex-direction:column;justify-content:space-between;align-items:center;background:#141518;border-radius:.1cqw;pointer-events:none}',
      '.x32p-led{position:absolute;border-radius:.06cqw;background:#2a2c30;pointer-events:none}',
      '.x32p-led.g{background:#3dff8a;box-shadow:0 0 .3cqw #22c55e}.x32p-led.y{background:#ffd23d;box-shadow:0 0 .3cqw #eab308}.x32p-led.r{background:#ff4d4d;box-shadow:0 0 .3cqw #ef4444}.x32p-led.o{background:#ff9a3d;box-shadow:0 0 .3cqw #f97316}',
      '.x32p-knob{position:absolute;border-radius:50%;cursor:ns-resize;touch-action:none}',
      '.x32p-knob svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}',
      '.x32p-knob:focus-visible{outline:.15cqw solid #60a5fa;outline-offset:.1cqw}',
      '.x32p-knob.enc{cursor:ew-resize}',
      '.x32p-scr{position:absolute;background:#0b1a2c;border-radius:.2cqw;color:#e5e7eb;font-size:.82cqw;overflow:hidden;display:flex;flex-direction:column}',
      '.x32p-scr .fb{display:flex;flex-direction:column;height:100%;pointer-events:none}',
      '.x32p-scr .hd{display:flex;justify-content:space-between;align-items:center;gap:.4cqw;padding:.25cqw .45cqw;background:#020617;font-weight:800}',
      '.x32p-scr .hd b{color:#fbbf24}.x32p-scr .hd small{color:#bfdbfe;font-weight:700;font-size:.66cqw}',
      '.x32p-scr .tabs{display:flex;gap:.12cqw;padding:.1cqw .3cqw;background:#0f2742;font-size:.58cqw}.x32p-scr .tabs span{padding:.05cqw .3cqw;border-radius:.12cqw;color:#93c5fd}.x32p-scr .tabs span.on{background:#1d4ed8;color:#fff}',
      '.x32p-scr .bd{flex:1;padding:.35cqw .45cqw;display:flex;flex-direction:column;gap:.25cqw;min-height:0}',
      '.x32p-scr .sof{background:#f97316;color:#111;font-weight:900;text-align:center;padding:.12cqw;font-size:.7cqw}',
      '.x32p-scr .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.25cqw}',
      '.x32p-scr .grid div{background:rgba(255,255,255,.08);border-radius:.15cqw;padding:.2cqw .3cqw;line-height:1.25}',
      '.x32p-scr .grid div span{display:block;color:#93c5fd;font-size:.6cqw;font-weight:800}',
      '.x32p-scr .on{color:#4ade80;font-weight:800}.x32p-scr .off{color:#94a3b8}',
      '.x32p-scr .modal{position:absolute;inset:8% 6%;background:#0f172a;border:.1cqw solid #60a5fa;border-radius:.3cqw;padding:.4cqw;display:flex;flex-direction:column;gap:.3cqw;pointer-events:auto;font-size:.7cqw}',
      '.x32p-scr .modal input{font:inherit;padding:.15cqw .3cqw;border-radius:.15cqw;border:0}.x32p-scr .modal .cols{display:flex;flex-wrap:wrap;gap:.15cqw}.x32p-scr .modal .cols button{width:1.4cqw;height:1cqw;border:.08cqw solid #000;border-radius:.1cqw;cursor:pointer}',
      '.x32p-scr .modal .cols button[aria-pressed="true"]{outline:.12cqw solid #fff}.x32p-scr .modal .ok{align-self:flex-end;font:inherit;font-weight:800;padding:.1cqw .5cqw;border-radius:.15cqw;border:0;background:#2563eb;color:#fff;cursor:pointer}',
      '.x32p-alcd{position:absolute;border-radius:.15cqw;background:#06210f;border:.08cqw solid #22c55e;color:#86efac;font-size:.4cqw;font-weight:800;line-height:1.15;padding:.08cqw .15cqw;overflow:hidden;pointer-events:none;white-space:nowrap;text-shadow:0 0 .2cqw #22c55e}',
      '.x32p-hint{position:absolute;padding:.25cqw .5cqw;border-radius:.3cqw;background:rgba(17,24,39,.92);color:#fff;font-size:.8cqw;font-weight:700;pointer-events:none;white-space:nowrap;transform:translate(-50%,-130%);display:none;z-index:5}',
      '.x32p-read{display:flex;flex-wrap:wrap;gap:6px;font-size:.74rem}',
      '.x32p-read>span{padding:4px 9px;border-radius:7px;background:var(--sta-surface-2,#f1f5f9);border:1px solid var(--sta-line,#e2e8f0);color:var(--sta-ink-2,#475569)}',
      '.x32p-read>span b{margin-left:4px;color:var(--sta-ink,#0f172a);font-variant-numeric:tabular-nums}.x32p-read>span b.bad{color:#dc2626}',
      '.x32p-msg{font-size:.76rem;color:var(--sta-ink,#0f172a);background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:5px 9px;display:none}',
      /* M32: 사진이 비스듬하고 조금 작아서 페이더 손잡이 · 글자를 줄임 */
      /* M32 (위에서 찍은 Sweetwater 사진, 3000 px 폭 → 1cqw = 30 px): 페이더 홈 = 사진의 판 색 + 검은 홈 + 사진과 같은 자리 눈금(+10 · +5 · 0 · −5 · −10 · −20 · −30 · −40 · −50 · −60 · −∞) */
      '.x32p-stage.x32p-m32{overflow:hidden}',
      '.x32p-m32 .x32p-slot{border-radius:0;background:linear-gradient(90deg,transparent 0 42%,#060707 42% 58%,transparent 58%),linear-gradient(90deg,rgba(47,50,55,0) 0,#2f3237 9%,#2f3237 91%,rgba(47,50,55,0) 100%)}',
      '.x32p-m32 .x32p-slot .tk{position:absolute;left:3%;right:12%;height:.13cqw;margin-top:-.065cqw;background:linear-gradient(90deg,#e9eaee 0 40%,transparent 40% 57%,#e9eaee 57% 100%);pointer-events:none}',
      '.x32p-m32 .x32p-slot .tk.z{left:0;right:6%}',
      '.x32p-m32 .x32p-cap{width:74%;z-index:1}',
      '.x32p-m32 .x32p-cap i{top:-.62cqw;height:1.24cqw;border-radius:.16cqw;background:linear-gradient(180deg,#fbfbfc 0,#e3e5e9 30%,#b9bdc4 48%,#7d828b 52%,#c7cad0 70%,#9da1a9 100%);box-shadow:0 .2cqw .35cqw rgba(0,0,0,.7),inset 0 0 0 .04cqw rgba(0,0,0,.35)}',
      '.x32p-m32 .x32p-cap i::after{left:6%;right:6%;top:48%;height:.07cqw;background:#1f2125}',
      '.x32p-m32 .x32p-cap.sof i{background:linear-gradient(180deg,#fff1e0 0,#ffc285 30%,#f08a2a 48%,#c25a00 52%,#ffb066 70%,#e07a1c 100%)}.x32p-m32 .x32p-cap.main i{background:linear-gradient(180deg,#ffe3e3 0,#f99 30%,#e04848 48%,#a51616 52%,#f27b7b 70%,#c92a2a 100%)}',
      '.x32p-m32 .x32p-lcd span{font-size:.36cqw}.x32p-m32 .x32p-lcd b{font-size:.4cqw}.x32p-m32 .x32p-bl{font-size:.36cqw}.x32p-m32 .x32p-val{font-size:.5cqw}.x32p-m32 .x32p-alcd{font-size:.3cqw}',
      '.x32p-note{margin:0;font-size:.72rem;color:var(--sta-ink-2,#64748b)}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // x32_model.js 가 아직 안 불렸으면(index.html 연결 전) 이 파일 옆 x32/ 에서 직접 불러와요.
  var BASE = (function () { var c = document.currentScript && document.currentScript.src; return c ? c.replace(/[^\/]*$/, '') : 'lessons/modules/'; })();
  var modelWait = null;
  function needModel(cb) {
    if (window.X32Model) { cb(); return; }
    if (!modelWait) { modelWait = []; var sc = document.createElement('script'); sc.src = BASE + 'x32/x32_model.js'; sc.onload = function () { var w = modelWait; modelWait = null; w.forEach(function (f) { f(); }); }; sc.onerror = function () { var w = modelWait; modelWait = null; w.forEach(function (f) { f(); }); }; document.head.appendChild(sc); }
    modelWait.push(cb);
  }
  function x32Photo(el, opts) {
    opts = opts || {}; injectCss();
    if (window.X32Model) return build(el, opts);
    var real = null, dead = false;
    el.innerHTML = '<p class="x32p-note">콘솔 실습을 준비하고 있어요…</p>';
    needModel(function () { if (dead) return; if (!window.X32Model) { el.innerHTML = '<p class="x32p-note">X32 실습 파일(x32_model.js)을 불러오지 못했어요. 페이지를 새로 고쳐 봐요.</p>'; return; } real = build(el, opts); });
    return {
      get model() { return real ? real.model : null; },
      destroy: function () { dead = true; if (real) real.destroy(); else el.innerHTML = ''; },
      state: function () { return real ? real.state() : { ready: false }; },
      set: function (o) { return real ? real.set(o) : { ready: false }; },
      knobValue: function (id) { return real ? real.knobValue(id) : null; }
    };
  }
  function build(el, opts) {
    var X = window.X32Model, m = X.create(opts.model || {}), S = m.state;
    var U = { done: {}, sawSof: false, alive: true, raf: 0, frame: 0, dirtyR: false, tapT: 0, msgT: 0, screen: null, audio: null, audioOn: false, seq: 0, fbScreen: false };
    var COLORS = X.COLORS;
    var LY = opts.layout || X32L, IMG = LY.IMG, PW = LY.PW, PH = LY.PH, SCREEN_RECT = LY.SCREEN_RECT, STRIP_IN = LY.STRIP_IN, STRIP_R = LY.STRIP_R, STRIP_MAIN = LY.STRIP_MAIN, ROW = LY.ROW, BW = LY.BW, BH = LY.BH,
      KN = LY.KN, ENC = LY.ENC, ENC_Y = LY.ENC_Y, MENU = LY.MENU, LAYER_L = LY.LAYER_L, LAYER_R = LY.LAYER_R, EQ_TYPE_LED = LY.EQ_TYPE_LED, NM = LY.name;

    /* ---------- 교육용 추정(소리 파일 없이 과제 판정 · 아래 읽기 줄에 씀) ---------- */
    function chIn(ci) { return m.estInput(ci); }
    function chOut(ci) { var c = S.ch[ci]; if (m.effMute('ch', ci)) return NINF; var v = chIn(ci) + (c.fader <= OFF ? NINF : c.fader) + m.dcaOffset('ch', ci); return isFinite(v) ? v : NINF; }
    function mainLv() { var M = S.main.st; if (M.mute) return NINF; var a = []; S.ch.forEach(function (c, i) { if (c.main.st) a.push(chOut(i) - 10); }); var f = M.fader <= OFF ? NINF : M.fader; return psum(a) + f; }
    function busLv(b) {
      var B = S.bus[b]; if (m.effMute('bus', b)) return NINF; var a = [];
      S.ch.forEach(function (c, i) { var s = c.sends[b]; if (!s || !s.on || s.level <= OFF || m.effMute('ch', i)) return; var pre = /^(IN|PRE)/.test(s.tap); a.push((pre ? chIn(i) : chOut(i)) + s.level - 6); });
      return psum(a) + (B.fader <= OFF ? NINF : B.fader);
    }
    function hit(id) { if (U.done[id]) return; U.done[id] = true; if (opts.onTask) try { opts.onTask(id); } catch (e) { /* noop */ } }
    function selCh() { var s = S.config.selected; return s && s.type === 'ch' ? s.index : -1; }
    function judge() {
      var c = S.ch[16], sel = selCh();
      if (sel === 16 && c.preamp.phantom) hit('p48');
      var i17 = chIn(16); if (sel === 16 && c.preamp.phantom && i17 >= -18 && i17 <= -6) hit('gain');
      if (sel === 16 && c.preamp.lowcut.on && c.preamp.lowcut.freq >= 80 && c.preamp.lowcut.freq <= 150) hit('lowcut');
      if (S.config.sendsOnFader && S.config.sofTarget === 0 && S.ch[0].sends[0].level >= -10 && U.sawSof) hit('sof');
      if (S.dca[0].fader <= -10 && !S.dca[0].mute) hit('dca');
    }

    /* ---------- 지금 페이더 한 칸이 맡은 것 ---------- */
    function sofOn() { return !!S.config.sendsOnFader; }
    function info(it, side) {
      if (!it) return { none: true, id: '', name: '', color: 0 };
      var t = it.type, i = it.index, st = m.strip(t, i), base = (t === 'main' ? 'main.' + (i ? 'm' : 'st') : t + '.' + i);
      var o = { type: t, index: i, strip: st, base: base, id: idOf(t, i), name: m.label(t, i), color: st.color || 0, fpath: base + '.fader', mpath: base + '.mute', spath: base + '.solo', sof: false };
      var sel = S.config.selected;
      if (sofOn()) {
        var tg = S.config.sofTarget;
        if ((t === 'ch' || t === 'aux' || t === 'fxr') && tg != null && side === 'L') { o.fpath = base + '.sends.' + tg + '.level'; o.sof = true; }
        else if (t === 'bus' && side === 'R' && sel && (sel.type === 'ch' || sel.type === 'aux' || sel.type === 'fxr')) { o.fpath = sel.type + '.' + sel.index + '.sends.' + i + '.level'; o.sof = true; o.sofFrom = m.shortId(sel.type, sel.index); }
        else if (t === 'mtx' && sel && sel.type === 'bus') { o.fpath = 'bus.' + sel.index + '.mtxSends.' + i + '.level'; o.sof = true; }
      }
      return o;
    }
    function idOf(t, i) { return t === 'ch' ? 'CH ' + pad2(i + 1) : t === 'bus' ? 'BUS ' + (i + 1) : t === 'dca' ? 'DCA ' + (i + 1) : t === 'main' ? (i ? 'M/C' : 'MAIN') : m.shortId(t, i); }
    function meterOf(o) {
      if (!o || o.none) return NINF; var M = m.meters, t = o.type, i = o.index;
      if (t === 'ch') return M.ch[i]; if (t === 'aux') return M.aux[i]; if (t === 'fxr') return M.fxr[i]; if (t === 'bus') return M.bus[i]; if (t === 'mtx') return M.mtx[i];
      if (t === 'main') return i ? M.main.m : Math.max(M.main.l, M.main.r);
      if (t === 'dca') { var v = NINF; ['ch', 'aux', 'fxr', 'bus'].forEach(function (tt) { S[tt].forEach(function (s, k) { if (s.dca && s.dca[i]) { var mv = (M[tt] || [])[k]; if (mv > v) v = mv; } }); }); return v; }
      return NINF;
    }

    /* ---------- 뼈대 ---------- */
    var stage, scroll, read, msg, hint, scr, strips = [], knobs = {}, btns = {}, leds = {}, alcds = [];
    el.innerHTML = '<div class="x32p">' +
      '<div class="x32p-bar">' +
        '<span class="grp"><button type="button" class="snd" data-act="sound" aria-pressed="false">🔊 소리 켜기</button>' +
        '<select data-act="src" aria-label="음원 고르기"><option value="stems">음원: 찬양 멀티트랙(기본)</option><option value="none">음원 없이(미터 꺼짐)</option></select>' +
        '<label class="file">내 음원 파일 넣기<input type="file" accept="audio/*" multiple data-act="files"></label>' +
        '<select data-act="listen" aria-label="스피커로 들을 곳"><option value="main">듣기: 메인 LR (SOLO 켜면 솔로)</option><option value="monitor">듣기: 모니터 · 헤드폰</option><option value="bus0">듣기: BUS 1 인도자 모니터</option><option value="bus1">듣기: BUS 2 싱어 모니터</option><option value="bus2">듣기: BUS 3 드럼 모니터</option><option value="bus3">듣기: BUS 4 방송 · 녹음</option></select></span>' +
        '<span class="sp">페이더 · 노브는 끌어요(노브는 휠 · 화살표 키도 돼요). 단추는 눌러요. 이름이 궁금하면 마우스를 올려 봐요.</span>' +
        '<span class="grp" role="group" aria-label="크게 보기"><button type="button" data-zoom="1" aria-pressed="true">전체</button><button type="button" data-zoom="1.6" aria-pressed="false">크게</button><button type="button" data-zoom="2.3" aria-pressed="false">더 크게</button></span></div>' +
      '<div class="x32p-msg" data-role="msg" role="status"></div>' +
      '<div class="x32p-scroll" data-role="scroll"><div class="x32p-stage x32p-' + LY.key + '" data-role="stage" role="application" aria-label="' + NM + ' 콘솔 사진 위에서 조작하는 실습" style="aspect-ratio:' + PW + '/' + PH + '"><img src="' + IMG + '" alt="' + esc(LY.alt) + '" draggable="false" onerror="this.style.visibility=\'hidden\'"></div></div>' +
      '<div class="x32p-read" data-role="read" aria-live="polite"></div>' +
      '<p class="x32p-note">' + (LY.photoSrc ? '사진: ' + LY.photoSrc : '사진: ' + LY.brand + ' 공식 제품 사진' + (LY.photoNote || '')) + '. 단추 · 페이더 · 노브 · 이름표(LCD) · 미터는 사진 위에 겹쳐 그렸어요. 미터는 「소리 켜기」를 눌러야 움직여요. 아래 「지금 상태」의 dB 는 공부용으로 어림한 값(교육용 근사)이에요.</p></div>';
    scroll = el.querySelector('[data-role=scroll]'); stage = el.querySelector('[data-role=stage]'); read = el.querySelector('[data-role=read]'); msg = el.querySelector('[data-role=msg]');
    function P(x, y, w, h, node, centered) { var s = node.style; if (centered !== false) { x -= w / 2; y -= h / 2; } s.left = (x / PW * 100).toFixed(3) + '%'; s.top = (y / PH * 100).toFixed(3) + '%'; s.width = (w / PW * 100).toFixed(3) + '%'; s.height = (h / PH * 100).toFixed(3) + '%'; return node; }
    function mk(tag, cls, attrs, parent) { var n = document.createElement(tag); if (cls) n.className = cls; if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); (parent || stage).appendChild(n); return n; }
    hint = mk('div', 'x32p-hint');
    function button(id, x, y, w, h, title, color, small) { var b = mk('button', 'x32p-btn ' + (color || 'y') + (small ? ' sm' : ''), { type: 'button', 'data-b': id, 'data-tip': title, 'aria-label': title, 'aria-pressed': 'false' }); P(x, y, w || BW, h || BH, b); btns[id] = b; return b; }
    function led(id, x, y, w, h) { var d = mk('div', 'x32p-led'); P(x, y, w, h, d); leds[id] = d; return d; }

    // 채널 스트립 25개 — 칸마다 위치(geo): X32 는 세로 줄 그대로, M32 처럼 비스듬히 찍은 사진은 LY.geo 가 줄마다 x 를 옮겨 줌
    function geoOf(cx, side) {
      if (LY.geo) return LY.geo(cx, side);
      var g = { sel: [cx, ROW.select], ledX: cx - 5, ledYs: ROW.led, solo: [cx, ROW.solo], lcd: [cx, ROW.lcd], mute: [cx, ROW.mute], fTop: [cx, ROW.fTop], fBot: [cx, ROW.fBot], val: [cx, ROW.fBot + 24] };
      if (side === 'main') { g.comp = [cx - 5, 518]; g.clr = [cx, 563]; g.solo = [cx, 609]; }
      return g;
    }
    function addStrip(id, cx, side, i) {
      var o = { id: id, cx: cx, side: side, i: i, leds: [] }, g = geoOf(cx, side), LW = (LY.LCD || [45, 34]);
      o.sel = button(id + '.sel', g.sel[0], g.sel[1], BW, BH, 'SELECT (이 채널을 채널 섹션 · 화면에서 고르기)', 'g');
      if (side !== 'main') {
        var ly = g.ledYs, lw = LY.LED_W || 6, lh = LY.LED_H || 3.6;
        o.mtr = mk('div', 'x32p-mtr'); P(g.ledX, (ly[0] + ly[ly.length - 1]) / 2, lw + 3, ly[ly.length - 1] - ly[0] + lh * 2 + 1, o.mtr);
        ly.forEach(function (y, k) { o.leds.push(led(id + '.led' + k, g.ledX, y, lw, lh)); });
        o.solo = button(id + '.solo', g.solo[0], g.solo[1], BW, BH, 'SOLO (헤드폰 · 모니터로 이것만 듣기)', 'y');
      } else {
        o.leds.push(led('main.comp', g.comp[0], g.comp[1], LY.LED_W || 6, LY.LED_H || 3.6));
        button('main.clearsolo', g.clr[0], g.clr[1], BW, BH, 'CLEAR SOLO (켜진 SOLO 를 모두 끄기)', 'y');
        o.solo = button('MAIN.solo', g.solo[0], g.solo[1], BW, BH, 'SOLO (메인)', 'y');
      }
      o.lcd = mk('div', 'x32p-lcd', { 'data-lcd': id, 'data-tip': '스크리블 LCD (이름 · 색) — 두 번 누르면 이름 바꾸기' }); P(g.lcd[0], g.lcd[1], LW[0], LW[1], o.lcd);
      o.mute = button(id + '.mute', g.mute[0], g.mute[1], BW, BH, 'MUTE (소리 끄기)', 'r');
      // 페이더 홈: 위(+10) · 아래(−∞) 두 점 사이. 비스듬하면 그만큼 돌려 놓음
      // LY.SLOT_SKEW: 사진이 위에서 조금 비스듬해 페이더 홈이 기울어 보이면, 돌리지(rotate) 않고 옆으로 밀어(skewX) 눈금은 가로 그대로 · 홈만 기울게
      var dx = g.fBot[0] - g.fTop[0], dy = g.fBot[1] - g.fTop[1], len = LY.SLOT_SKEW ? dy : Math.sqrt(dx * dx + dy * dy), pad = LY.SLOT_PAD || 12;
      o.span = len; o.pad = pad;
      o.slot = mk('div', 'x32p-slot', { 'data-slot': id }); P((g.fTop[0] + g.fBot[0]) / 2, (g.fTop[1] + g.fBot[1]) / 2, LY.SLOT_W || 40, len + pad * 2, o.slot);
      if (Math.abs(dx) > 0.5) o.slot.style.transform = LY.SLOT_SKEW ? 'skewX(' + (Math.atan2(dx, dy) * 180 / Math.PI).toFixed(2) + 'deg)' : 'rotate(' + (-Math.atan2(dx, dy) * 180 / Math.PI).toFixed(2) + 'deg)';
      if (LY.SLOT_TICKS) LY.SLOT_TICKS.forEach(function (f) { var tk = document.createElement('i'); tk.className = 'tk' + (f === 0.75 ? ' z' : ''); tk.style.top = ((pad + (1 - f) * len) / (len + pad * 2) * 100).toFixed(3) + '%'; o.slot.appendChild(tk); });
      o.cap = document.createElement('div'); o.cap.className = 'x32p-cap' + (side === 'main' ? ' main' : ''); o.cap.setAttribute('tabindex', '0'); o.cap.setAttribute('role', 'slider'); o.cap.setAttribute('data-f', id); o.slot.appendChild(o.cap); o.cap.innerHTML = '<i></i>';
      o.cap.style.transform = 'translateX(-50%)';
      o.val = mk('div', 'x32p-val'); P(g.val[0], g.val[1], 50, 16, o.val);
      strips.push(o); return o;
    }
    STRIP_IN.forEach(function (x, i) { addStrip('L' + i, x, 'L', i); });
    STRIP_R.forEach(function (x, i) { addStrip('R' + i, x, 'R', i); });
    addStrip('MAIN', STRIP_MAIN, 'main', 0);
    // 레이어 · SOF · DAW
    LAYER_L.forEach(function (b) { button('layer.' + b[0], b[3] != null ? b[3] : LY.LAYER_LX, b[1], LY.LAYER_W, LY.LAYER_H, '입력 쪽 레이어: ' + b[2], 'g'); });
    LAYER_R.forEach(function (b) { button('layerR.' + b[0], b[3] != null ? b[3] : LY.LAYER_RX, b[1], LY.LAYER_W, LY.LAYER_H, '출력 쪽 레이어: ' + b[2], 'g'); });
    button('sof', LY.SOF[0], LY.SOF[1], LY.SOF[2], LY.SOF[3], LY.SOF_TIP || 'SENDS ON FADER (페이더로 BUS 에 보내는 양 조절)', 'o'); button('daw', LY.DAW[0], LY.DAW[1], LY.DAW[2], LY.DAW[3], 'DAW REMOTE (컴퓨터 녹음 프로그램 조종)', 'y');
    // 채널 섹션 · 모니터 · 토크백 · 씬 · ASSIGN 단추
    LY.BTNS.forEach(function (b) { button(b[0], b[1], b[2], b[5] || BW, b[6] || BH, b[3], b[4] || 'y', !!b[5] && b[5] < 20); });
    LY.ASSIGN_B.forEach(function (p, k) { button('as.b' + k, p[0], p[1], LY.ASSIGN_BS[0], LY.ASSIGN_BS[1], 'ASSIGN 단추 ' + (k + 5), 'y'); });
    LY.MG_B.forEach(function (p, k) { button('mg' + k, p[0], p[1], LY.MG_BS[0], LY.MG_BS[1], 'MUTE GROUP ' + (k + 1), 'r'); });
    MENU.forEach(function (mm) { var b = button('menu.' + mm[0], LY.MENU_X, mm[2], LY.MENU_W, LY.MENU_H, '화면 메뉴: ' + mm[1], 'g'); b.innerHTML = '<span class="x32p-bl">' + mm[1] + '</span>'; });
    LY.NAV.forEach(function (b) { button('nav.' + b[0], b[1], b[2], LY.NAV_S, LY.NAV_S, b[3], 'y'); });
    // 표시등: EQ 모양 · 입력 미터 · GR 미터 · USB ACCESS · ASSIGN LCD · 메인 미터
    EQ_TYPE_LED.forEach(function (t) { led('eqt.' + t[0], LY.EQ_LED_X, t[1], LY.EQ_LED[0], LY.EQ_LED[1]); });
    var PM = LY.PRE_M, GM = LY.GR_M, MM = LY.MAIN_M, AL = LY.ALCD;
    var pmBox = mk('div', 'x32p-mtr'); P(PM.box[0], PM.box[1], PM.box[2], PM.box[3], pmBox); var pmL = PM.ys.map(function (y, k) { return led('pre' + k, PM.x, y, PM.s[0], PM.s[1]); });
    var grBox = mk('div', 'x32p-mtr'); P(GM.box[0], GM.box[1], GM.box[2], GM.box[3], grBox); var grL = GM.ys.map(function (y, k) { return led('gr' + k, GM.x, y, GM.s[0], GM.s[1]); }); var gateL = led('gr.gate', GM.x, GM.gate, GM.s[0], GM.s[1]);
    led('usb.access', LY.USB_LED[0], LY.USB_LED[1], LY.USB_LED[2], LY.USB_LED[3]);
    var mainL = MM.xs.map(function (x, c) { var col = []; for (var k = 0; k < 24; k++) col.push(led('mm' + c + '.' + k, x, MM.y0 + k * (MM.y1 - MM.y0) / 23, MM.s[0], MM.s[1])); return col; });
    AL.xs.forEach(function (x, k) { var d = mk('div', 'x32p-alcd'); P(x, AL.y, AL.w, AL.h, d); alcds.push(d); });
    // 화면 자리
    scr = mk('div', 'x32p-scr', { 'data-role': 'screen' }); P(SCREEN_RECT.x, SCREEN_RECT.y, SCREEN_RECT.w, SCREEN_RECT.h, scr, false);
    // 노브
    var defs = mk('div', ''); defs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; defs.innerHTML = '<svg width="0" height="0"><defs><radialGradient id="x32pKnob" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4a4d53"/><stop offset=".6" stop-color="#232427"/><stop offset="1" stop-color="#121214"/></radialGradient></defs></svg>';
    function knob(id, d, title, map, enc) {
      var k = mk('div', 'x32p-knob' + (enc ? ' enc' : ''), { tabindex: '0', role: 'slider', 'aria-label': title, 'data-tip': title, 'data-k': id }); var R = enc ? (LY.ENC_BOX || 40) : (LY.KNOB_BOX || 64); P(d[0], d[1], R, R, k);
      var dots = ''; if (!enc) for (var i = 0; i < 13; i++) { var a = (-135 + i * 22.5) * Math.PI / 180; dots += '<circle cx="' + (50 + Math.sin(a) * 36).toFixed(2) + '" cy="' + (50 - Math.cos(a) * 36).toFixed(2) + '" r="4.2"/>'; }
      k.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + (enc ? '' : '<circle cx="50" cy="50" r="44" fill="#141518"/>') + '<circle cx="50" cy="50" r="' + (enc ? 40 : d[2] * 0.82) + '" fill="url(#x32pKnob)" stroke="#0a0a0b" stroke-width="2"/><line class="ptr" x1="50" y1="50" x2="50" y2="' + (enc ? 14 : 30) + '" stroke="#d1d5db" stroke-width="' + (enc ? 4 : 3) + '" stroke-linecap="round"/><g class="dots">' + dots + '</g></svg>';
      knobs[id] = { el: k, map: map, enc: !!enc, bip: map && map.bip }; return k;
    }

    /* ---------- 노브가 맡은 값(0..1) ---------- */
    function sel() { return S.config.selected || { type: 'ch', index: 0 }; }
    function selBase() { var s = sel(); return s.type === 'main' ? 'main.' + (s.index ? 'm' : 'st') : s.type + '.' + s.index; }
    function selStrip() { var s = sel(); return m.strip(s.type, s.index); }
    function isInput(t) { return t === 'ch' || t === 'aux' || t === 'fxr'; }
    function bandIdx() { var st = selStrip(), n = st && st.eq ? st.eq.bands.length : 4, b = S.config.view.eqBand; return clamp(b, 0, n - 1); }
    function lin(path, lo, hi) { return { path: path, get: function () { var v = m.get(typeof path === 'function' ? path() : path); return v == null ? null : (v - lo) / (hi - lo); }, set: function (u) { m.set(typeof path === 'function' ? path() : path, lo + u * (hi - lo), { from: 'surface' }); } }; }
    function logm(path, lo, hi) { return { get: function () { var p = path(); if (!p) return null; var v = m.get(p); return v == null ? null : Math.log(v / lo) / Math.log(hi / lo); }, set: function (u) { var p = path(); if (p) m.set(p, lo * Math.pow(hi / lo, u), { from: 'surface' }); } }; }
    function fad(path) { return { get: function () { var p = path(); if (!p) return null; var v = m.get(p); return v == null ? null : db2f(v); }, set: function (u) { var p = path(); if (p) { var d = f2db(u); m.set(p, isFinite(d) ? d : OFF, { from: 'surface' }); } } }; }
    function pre(name) { return function () { var s = sel(); return isInput(s.type) && s.type !== 'fxr' ? selBase() + '.preamp.' + name : null; }; }
    function sendPath(k) { return function () { var s = sel(), b = (S.config.view.sendBank || 0) * 4 + k; if (isInput(s.type)) return b < 16 ? selBase() + '.sends.' + b + '.level' : null; if (s.type === 'bus') return b < 6 ? selBase() + '.mtxSends.' + b + '.level' : null; return null; }; }
    function mainPath(k) { return function () { var s = sel(); if (s.type === 'mtx' || s.type === 'main' || s.type === 'dca') return null; return selBase() + '.main.' + k; }; }
    function assignMap(k) {
      function tgt() { var a = S.config.assign.sets[S.config.assign.set]; return a && a.knobs[k] ? a.knobs[k].target : ''; }
      return { get: function () { var t = tgt(); if (!t) return null; var v = m.get(t); if (v == null) return null; if (/preamp\.gain$/.test(t)) return (v + 12) / 72; if (/(fader|level)$/.test(t)) return db2f(v); if (/mix$/.test(t)) return v / 100; return null; },
        set: function (u) { var t = tgt(); if (!t) return; if (/preamp\.gain$/.test(t)) m.set(t, u * 72 - 12); else if (/(fader|level)$/.test(t)) { var d = f2db(u); m.set(t, isFinite(d) ? d : OFF); } else if (/mix$/.test(t)) m.set(t, Math.round(u * 100)); } };
    }
    var KMAP = {
      gain: { get: function () { var p = pre('gain')(); return p ? (m.get(p) + 12) / 72 : null; }, set: function (u) { var p = pre('gain')(); if (p) m.set(p, u * 72 - 12, { from: 'surface' }); } },
      lcf: logm(pre('lowcut.freq'), 20, 400),
      gthr: { get: function () { var s = selStrip(); return s && s.gate ? (s.gate.thr + 80) / 80 : null; }, set: function (u) { if (selStrip().gate) m.set(selBase() + '.gate.thr', u * 80 - 80, { from: 'surface' }); } },
      dthr: { get: function () { var s = selStrip(); return s && s.dyn ? (s.dyn.thr + 60) / 60 : null; }, set: function (u) { if (selStrip().dyn) m.set(selBase() + '.dyn.thr', u * 60 - 60, { from: 'surface' }); } },
      eqq: { get: function () { var s = selStrip(); if (!s || !s.eq) return null; var q = s.eq.bands[bandIdx()].q; return 1 - Math.log(q / 0.3) / Math.log(10 / 0.3); }, set: function (u) { if (selStrip().eq) m.set(selBase() + '.eq.bands.' + bandIdx() + '.q', 0.3 * Math.pow(10 / 0.3, 1 - u), { from: 'surface' }); } },
      eqf: logm(function () { return selStrip() && selStrip().eq ? selBase() + '.eq.bands.' + bandIdx() + '.freq' : null; }, 20, 20000),
      eqg: { bip: true, get: function () { var s = selStrip(); return s && s.eq ? (s.eq.bands[bandIdx()].gain + 15) / 30 : null; }, set: function (u) { if (selStrip().eq) m.set(selBase() + '.eq.bands.' + bandIdx() + '.gain', u * 30 - 15, { from: 'surface' }); } },
      mlev: fad(mainPath('mlevel')), mpan: { bip: true, get: function () { var p = mainPath('pan')(); if (!p) { var s = sel(); if (s.type === 'main' || s.type === 'mtx') { var v = m.get(selBase() + '.pan'); return v == null ? null : (v + 100) / 200; } return null; } return (m.get(p) + 100) / 200; },
        set: function (u) { var p = mainPath('pan')(); var s = sel(); if (!p && (s.type === 'main' || s.type === 'mtx')) p = selBase() + '.pan'; if (p) m.set(p, u * 200 - 100, { from: 'surface' }); } },
      mon: fad(function () { return 'config.monitor.level'; }), phn: fad(function () { return 'config.monitor.phones'; }), talk: fad(function () { return 'config.talkback.level'; })
    };
    [0, 1, 2, 3].forEach(function (k) { var f = fad(sendPath(k)); KMAP['s' + (k + 1)] = { get: f.get, set: function (u) { f.set(u); var b = (S.config.view.sendBank || 0) * 4 + k; if (S.config.sendsOnFader && S.config.sofTarget === b && selCh() === 0 && b === 0) U.sawSof = true; } }; KMAP['as' + (k + 1)] = assignMap(k); });
    Object.keys(KN).forEach(function (id) { knob(id, KN[id], KN[id][3], KMAP[id]); });
    ENC.forEach(function (x, i) { knob('enc' + i, [x, ENC_Y, LY.ENC_D || 30], '화면 노브 ' + (i + 1) + ' (돌리기 · 누르기)', null, true); });

    /* ---------- 그리기 ---------- */
    function lit(b, on) { if (!b) return; b.classList.toggle('on', !!on); b.setAttribute('aria-pressed', String(!!on)); }
    function knobDraw(id) {
      var k = knobs[id]; if (k.enc) return; var v = k.map.get(), none = v == null; v = none ? 0 : clamp(v, 0, 1);
      var dots = k.el.querySelectorAll('.dots circle'); dots.forEach(function (c, i) { var p = i / 12, on = !none && (k.map.bip ? (v >= 0.5 ? p >= 0.5 - 1e-6 && p <= v + 1e-6 : p <= 0.5 + 1e-6 && p >= v - 1e-6) : p <= v + 1e-6); c.setAttribute('fill', on ? '#ff8a1f' : '#3a2412'); });
      k.el.querySelector('.ptr').setAttribute('transform', 'rotate(' + (-135 + v * 270) + ' 50 50)'); k.el.setAttribute('aria-valuenow', Math.round(v * 100)); k.el.classList.toggle('dim', none);
    }
    function capPos(o, p) { var span = o.span, tot = span + o.pad * 2; o.cap.style.top = ((o.pad + (1 - p) * span) / tot * 100).toFixed(3) + '%'; }
    function colorOf(n) { return COLORS[clamp(n | 0, 0, 15)] || COLORS[0]; }
    function stripDraw(o, it) {
      var inf = o.side === 'main' ? info({ type: 'main', index: 0 }, 'M') : info(it, o.side); o.inf = inf;
      if (inf.none) {
        o.lcd.className = 'x32p-lcd none'; o.lcd.innerHTML = '<span>—</span><b></b>'; o.cap.style.display = 'none'; o.val.textContent = '';
        [o.sel, o.mute, o.solo].forEach(function (b) { if (b) { lit(b, false); b.classList.add('dim'); } }); return;
      }
      var c = colorOf(inf.color), st = inf.strip;
      o.lcd.className = 'x32p-lcd' + (c.inv ? ' inv' : '') + (inf.sof ? ' sof' : ''); o.lcd.style.setProperty('--c', c.bg); o.lcd.style.setProperty('--fg', c.fg); o.lcd.style.setProperty('--glow', c.inv || c.id === 'OFF' ? 'transparent' : c.bg + '88');
      o.lcd.innerHTML = '<span>' + esc(inf.id) + (inf.sof ? '<i>→' + esc(inf.sofFrom ? inf.sofFrom : 'BUS ' + (S.config.sofTarget + 1)) + '</i>' : '') + '</span><b>' + esc(inf.name) + '</b>';
      var s = S.config.selected; lit(o.sel, s && s.type === inf.type && s.index === inf.index);
      lit(o.mute, st.mute || (st.muteGrp && st.muteGrp.some(function (on, k) { return on && S.muteGroups[k].on; })));
      if (o.solo) lit(o.solo, !!st.solo);
      [o.sel, o.mute, o.solo].forEach(function (b) { if (b) b.classList.remove('dim'); });
      o.cap.style.display = ''; o.cap.classList.toggle('sof', inf.sof);
      var v = m.get(inf.fpath); if (!o.drag) capPos(o, db2f(v)); o.val.textContent = fmt(v);
      o.cap.setAttribute('aria-label', inf.id + ' ' + inf.name + (inf.sof ? ' 보내는 양(Sends on Fader)' : ' 페이더')); o.cap.setAttribute('aria-valuetext', fmt(v) + ' dB');
    }
    function render() {
      U.dirtyR = false; var L = m.layerItems('left'), R = m.layerItems('right');
      strips.forEach(function (o) { stripDraw(o, o.side === 'L' ? L[o.i] : o.side === 'R' ? R[o.i] : null); });
      LAYER_L.forEach(function (b) { lit(btns['layer.' + b[0]], S.config.layer.left === b[0] || (b[0] === 'bus1-8' && S.config.layer.left === 'bus9-16')); });
      LAYER_R.forEach(function (b) { lit(btns['layerR.' + b[0]], S.config.layer.right === b[0]); });
      lit(btns.sof, sofOn()); lit(btns.daw, !!S.config.dawRemote);
      var st = selStrip(), s = sel(), inp = isInput(s.type), pa = st.preamp;
      lit(btns.p48, inp && pa && pa.phantom); lit(btns.phase, pa && pa.invert); lit(btns.lc, pa && pa.lowcut.on);
      lit(btns.gate, st.gate && st.gate.on); lit(btns.dyn, st.dyn && st.dyn.on); lit(btns.eq, st.eq && st.eq.on);
      lit(btns.lr, st.main && st.main.st); lit(btns.mono, st.main && st.main.mono);
      var bi = bandIdx(); [0, 1, 2, 3].forEach(function (k) { lit(btns['band' + k], bi === k || (st.eq && st.eq.bands.length > 4 && ((k === 0 && bi <= 1) || (k === 3 && bi >= 4) || (k === 1 && bi === 2) || (k === 2 && bi === 3)))); lit(btns['sb' + k], (S.config.view.sendBank || 0) === k); });
      var ty = st.eq ? st.eq.bands[bi].type : ''; EQ_TYPE_LED.forEach(function (t) { leds['eqt.' + t[0]].className = 'x32p-led' + (ty === t[0] ? ' o' : ''); });
      lit(btns.monmono, S.config.monitor.mono); lit(btns.dim, S.config.monitor.dim); lit(btns.talka, S.config.talkback.a); lit(btns.talkb, S.config.talkback.b);
      S.muteGroups.forEach(function (g, k) { lit(btns['mg' + k], g.on); });
      var pg = S.screen.page, tab = S.screen.tab;
      MENU.forEach(function (p) { lit(btns['menu.' + p[0]], pg === p[0]); });
      lit(btns['sc.view'], pg === 'scenes'); lit(btns['v.mon'], pg === 'monitor' && tab === 0); lit(btns['v.talk'], pg === 'monitor' && tab === 1); lit(btns['v.assign'], pg === 'assign'); lit(btns['v.usb'], pg === 'recorder');
      ['config', 'gate', 'dyn', 'eq', 'sends', 'main'].forEach(function (t) { lit(btns['v.' + t], pg === 'home' && HOME_TABS[tab] === t); });
      lit(btns['sc.undo'], S.config.scenes.canUndo);
      var clr = m.anySolo(); lit(btns['main.clearsolo'], clr); btns['main.clearsolo'].classList.toggle('blink', clr);
      ['A', 'B', 'C'].forEach(function (k) { lit(btns['as.set' + k], S.config.assign.set === k); });
      var aset = S.config.assign.sets[S.config.assign.set];
      aset.buttons.forEach(function (b, k) { var t = b.target, v = t && t.indexOf(':') < 0 ? m.get(t) : false; lit(btns['as.b' + k], v === true); });
      alcds.forEach(function (d, k) { d.innerHTML = esc((k + 1) + ' ' + (aset.knobs[k].label || '—')) + '<br>' + esc((k + 5) + ' ' + (aset.buttons[k].label || '—')) + '<br>' + esc((k + 9) + ' ' + (aset.buttons[k + 4].label || '—')); });
      leds['usb.access'].className = 'x32p-led' + (S.config.usb.recording ? ' r' : S.config.usb.playing ? ' g' : '');
      Object.keys(knobs).forEach(knobDraw);
      if (U.fbScreen) fallbackScreen();
      if (!drag) judge(); renderRead();
    }
    function schedule() { if (U.dirtyR) return; U.dirtyR = true; requestAnimationFrame(function () { if (U.alive && U.dirtyR) render(); }); }
    function lvB(d) { return !isFinite(d) || d < -60 ? '<b class="bad">소리 없음</b>' : '<b>' + fmt(d) + ' dB</b>'; }
    function renderRead() {
      var s = sel(), ci = s.type === 'ch' ? s.index : -1, inn = ci >= 0 ? chIn(ci) : NINF, src = ci >= 0 ? m.inputSource(ci) : null;
      read.innerHTML = '<span>지금 상태 · 교육용 근사</span><span>고른 채널 ' + esc(m.shortId(s.type, s.index)) + ' ' + esc(m.label(s.type, s.index)) +
        (ci >= 0 ? ' 입력' + (isFinite(inn) ? '<b>' + fmt(inn) + ' dBFS</b>' : '<b class="bad">' + (src && !src.live ? '입력 없음(라우팅)' : '신호 없음') + '</b>') : '') + '</span>' +
        '<span>메인(예배당)' + lvB(mainLv()) + '</span>' + [0, 1, 2, 3].map(function (k) { return '<span>BUS ' + (k + 1) + ' ' + esc(m.label('bus', k)) + lvB(busLv(k)) + '</span>'; }).join('') +
        '<span>DCA 1 ' + esc(m.label('dca', 0)) + '<b>' + fmt(S.dca[0].fader) + ' dB</b></span>';
    }
    function say(t) { msg.textContent = t; msg.style.display = t ? 'block' : 'none'; clearTimeout(U.msgT); if (t) U.msgT = setTimeout(function () { if (U.alive) msg.style.display = 'none'; }, 6000); }

    /* ---------- 대체 화면(X32Screen 이 없을 때만) ---------- */
    var PAGE_NAME = { home: 'HOME', meters: 'METERS', routing: 'ROUTING', setup: 'SETUP', library: 'LIBRARY', effects: 'EFFECTS', mutegrp: 'MUTE GRP', utility: 'UTILITY', scenes: 'SCENES', monitor: 'MONITOR', assign: 'ASSIGN', recorder: 'USB RECORDER' };
    function fallbackScreen() {
      var s = sel(), st = selStrip(), pg = S.screen.page, sc = S.config.scenes, h = '';
      function oo(v) { return '<span class="' + (v ? 'on' : 'off') + '">' + (v ? 'ON' : 'OFF') + '</span>'; }
      var head = '<div class="hd"><span><b>' + esc(m.shortId(s.type, s.index)) + '</b> ' + esc(m.label(s.type, s.index)) + '</span><small>' + PAGE_NAME[pg] + ' · 씬 ' + pad2(sc.current + 1) + ' ' + esc(sc.list[sc.current] ? sc.list[sc.current].name : '') + (sc.dirty ? ' *' : '') + '</small></div>';
      var tabs = pg === 'home' ? '<div class="tabs">' + HOME_TABS.map(function (t, k) { return '<span class="' + (S.screen.tab === k ? 'on' : '') + '">' + t.toUpperCase() + '</span>'; }).join('') + '</div>' : '';
      var sofb = sofOn() ? '<div class="sof">SENDS ON FADER → BUS ' + ((S.config.sofTarget || 0) + 1) + ' ' + esc(m.label('bus', S.config.sofTarget || 0)) + '</div>' : '';
      if (pg === 'scenes') h = '<div class="bd"><b>SCENES — PREV · NEXT 로 고르고 GO</b>' + sc.list.map(function (x, i) { return '<div' + (i === sc.next ? ' style="background:#1d4ed8"' : '') + '>' + pad2(i + 1) + ' · ' + esc(x.name) + (i === sc.current ? ' (지금)' : '') + '</div>'; }).join('') + '</div>';
      else if (pg === 'home') {
        var pa = st.preamp, b = st.eq ? st.eq.bands[bandIdx()] : null;
        h = '<div class="bd">' + sofb + '<div class="grid">' +
          (pa ? '<div><span>CONFIG</span>GAIN ' + (pa.gain > 0 ? '+' : '') + pa.gain.toFixed(1) + ' dB<br>48V ' + oo(pa.phantom) + ' Ø ' + oo(pa.invert) + '</div><div><span>LOW CUT</span>' + oo(pa.lowcut.on) + ' ' + Math.round(pa.lowcut.freq) + ' Hz</div>' : '') +
          (st.gate ? '<div><span>GATE</span>' + oo(st.gate.on) + ' ' + st.gate.thr + ' dB</div>' : '') + (st.dyn ? '<div><span>DYNAMICS</span>' + oo(st.dyn.on) + ' ' + st.dyn.thr + ' dB</div>' : '') +
          (b ? '<div><span>EQ ' + b.type + '</span>' + oo(st.eq.on) + ' ' + Math.round(b.freq) + ' Hz ' + (b.gain > 0 ? '+' : '') + b.gain.toFixed(1) + '</div>' : '') +
          '<div><span>FADER</span>' + fmt(st.fader) + ' dB</div></div></div>';
      } else h = '<div class="bd"><b>' + PAGE_NAME[pg] + '</b><div class="off">화면 파일(x32_screen.js)을 불러오지 못해 간단히 보여 줘요.</div></div>';
      var modal = '';
      if (S.screen.modal && S.screen.modal.kind === 'name') {
        var md = S.screen.modal, ms = m.strip(md.type, md.index);
        var dk = md.type + '.' + md.index; if (!U.draft || U.draft.k !== dk) U.draft = { k: dk, v: ms.name };
        modal = '<div class="modal" data-role="modal"><b>' + esc(m.shortId(md.type, md.index)) + ' 이름 · 색 바꾸기</b><input data-role="nm" maxlength="12" value="' + esc(U.draft.v) + '" aria-label="채널 이름">' +
          '<div class="cols">' + COLORS.map(function (c, k) { return '<button type="button" data-col="' + k + '" aria-pressed="' + (ms.color === k) + '" title="' + esc(c.name) + '" style="background:' + c.bg + ';color:' + c.fg + '"></button>'; }).join('') + '</div><button type="button" class="ok" data-role="ok">확인</button></div>';
      }
      var keepFocus = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-role') === 'nm';
      if (keepFocus) return;
      scr.innerHTML = '<div class="fb">' + head + tabs + h + '</div>' + modal;
    }
    function mountScreen() {
      U.fbScreen = true;
      if (window.X32Screen && typeof window.X32Screen.mount === 'function') {
        try { U.screen = window.X32Screen.mount(scr, m, { width: 800, height: 480, rect: SCREEN_RECT, photo: { w: PW, h: PH }, name: NM }); U.fbScreen = !U.screen; }
        catch (e) { if (window.console) console.warn('X32Screen.mount 실패 — 대체 화면을 써요', e); U.screen = null; U.fbScreen = true; scr.innerHTML = ''; }
      }
    }

    /* ---------- 미터 (model.meters → 불빛, 소리가 없으면 모두 꺼짐) ---------- */
    function setLed(d, cls) { var c = 'x32p-led' + (cls ? ' ' + cls : ''); if (d.className !== c) d.className = c; }
    function stripLeds(o) {
      if (o.side === 'main') { setLed(o.leds[0], S.main.st.dyn && S.main.st.dyn.on && (+m.meters.gr.main || 0) > 0.5 ? 'o' : ''); return; }
      var inf = o.inf, v = meterOf(inf), t = inf && inf.type, i = inf && inf.index;
      var gr = t === 'ch' ? m.meters.gr.ch[i] : t === 'bus' && m.meters.gr.bus ? m.meters.gr.bus[i] : 0, gt = t === 'ch' ? m.meters.gate.ch[i] : 0;
      setLed(o.leds[0], gr > 0.5 ? 'o' : '');
      STRIP_TH.forEach(function (th, k) { setLed(o.leds[k + 1], isFinite(v) && v >= th ? (k === 0 ? 'r' : k <= 2 ? 'y' : 'g') : ''); });
      setLed(o.leds[7], (t === 'ch' && S.ch[i].gate.on && gt > 0.5) ? 'y' : '');
    }
    function tick() {
      if (!U.alive) return; U.raf = requestAnimationFrame(tick); U.frame++; if (U.frame % 2) return;
      strips.forEach(stripLeds);
      var s = sel(), M = m.meters, inV = s.type === 'ch' ? (M.chIn || M.ch)[s.index] : s.type === 'aux' ? M.aux[s.index] : s.type === 'fxr' ? M.fxr[s.index] : s.type === 'bus' ? M.bus[s.index] : NINF;
      pmL.forEach(function (d, k) { var th = PRE_TH[k]; setLed(d, isFinite(inV) && inV >= th ? (k === 0 ? 'r' : k <= 3 ? 'y' : 'g') : ''); });
      var gr = s.type === 'ch' ? M.gr.ch[s.index] : 0; grL.forEach(function (d, k) { setLed(d, gr >= GR_TH[k] - 0.01 && gr > 0.3 ? 'y' : ''); });
      setLed(gateL, s.type === 'ch' && S.ch[s.index].gate.on && M.gate.ch[s.index] > 0.5 ? 'g' : '');
      var solo = m.anySolo(), mc = solo ? Math.max(M.solo ? M.solo.l : NINF, M.solo ? M.solo.r : NINF) : M.main.m;
      [mc, M.main.l, M.main.r].forEach(function (v, c) { mainL[c].forEach(function (d, k) { setLed(d, isFinite(v) && v >= MAIN_TH[k] ? (k === 0 ? 'r' : k <= 6 ? 'y' : 'g') : ''); }); });
    }

    /* ---------- 조작 ---------- */
    function stripByEl(n) { return strips.filter(function (o) { return o.cap === n || o.slot === n || o.lcd === n; })[0]; }
    var drag = null;
    function faderFromY(o, clientY) { var r = o.slot.getBoundingClientRect(), tot = o.span + o.pad * 2, pad = r.height * o.pad / tot; return clamp(1 - (clientY - r.top - pad) / (r.height - 2 * pad), 0, 1); }
    function setFader(o, p) {
      if (!o.inf || o.inf.none) return; var d = f2db(p); m.set(o.inf.fpath, isFinite(d) ? d : OFF, { from: 'surface' }); capPos(o, p);
      if (o.inf.sof && S.config.sofTarget === 0 && o.inf.type === 'ch' && o.inf.index === 0) U.sawSof = true;
    }
    function onDown(e) {
      var t = e.target, cap = t.closest('.x32p-cap'), slot = t.closest('.x32p-slot'), kn = t.closest('.x32p-knob');
      if (cap || slot) { var o = stripByEl(cap || slot); if (!o || !o.inf || o.inf.none) return; e.preventDefault(); o.drag = true; o.cap.classList.add('drag'); drag = { type: 'f', o: o, id: e.pointerId };
        try { (cap || slot).setPointerCapture(e.pointerId); } catch (x) { /* noop */ }
        if (!cap) setFader(o, faderFromY(o, e.clientY)); else { drag.dy = e.clientY; drag.p0 = db2f(m.get(o.inf.fpath)); } return; }
      if (kn) { e.preventDefault(); var id = kn.getAttribute('data-k'), k = knobs[id]; drag = { type: k.enc ? 'e' : 'k', id: id, y: e.clientY, x: e.clientX, v0: k.enc ? 0 : (k.map.get() || 0), acc: 0, moved: false }; try { kn.setPointerCapture(e.pointerId); } catch (x) { /* noop */ } kn.focus({ preventScroll: true }); }
    }
    function sendInput(o) { U.seq++; o.seq = U.seq; m.set('screen.input', o, { from: 'surface' }); if (U.fbScreen) fallbackInput(o); }
    function encInput(i, o) { o.kind = 'enc'; o.index = i; sendInput(o); }
    function onMove(e) {
      if (!drag) return; e.preventDefault();
      if (drag.type === 'f') { var o = drag.o, r = o.slot.getBoundingClientRect(), span = r.height * o.span / (o.span + o.pad * 2); var p = drag.dy != null ? clamp(drag.p0 - (e.clientY - drag.dy) / span, 0, 1) : faderFromY(o, e.clientY); setFader(o, p); return; }
      if (drag.type === 'e') { var d = (e.clientX - drag.x) - (e.clientY - drag.y), st = Math.trunc((d - drag.acc) / 8); if (Math.abs(d) > 3) drag.moved = true; if (st) { drag.acc += st * 8; encInput(+drag.id.slice(3), { delta: st > 0 ? 1 : -1, steps: Math.abs(st) }); } return; }
      var k = knobs[drag.id]; if (!k.map.get || k.map.get() == null) return; k.map.set(clamp(drag.v0 - (e.clientY - drag.y) / 160, 0, 1));
    }
    function onUp() { if (!drag) return; var d = drag; if (d.type === 'f') { d.o.drag = false; d.o.cap.classList.remove('drag'); } if (d.type === 'e' && !d.moved) encInput(+d.id.slice(3), { press: true }); drag = null; schedule(); }
    function onWheel(e) {
      var kn = e.target.closest && e.target.closest('.x32p-knob'); if (!kn) return; e.preventDefault(); var id = kn.getAttribute('data-k'), k = knobs[id], d = e.deltaY < 0 ? 1 : -1;
      if (k.enc) { encInput(+id.slice(3), { delta: d }); return; } var v = k.map.get(); if (v == null) return; k.map.set(clamp(v + d * 0.025, 0, 1));
    }
    function onKey(e) {
      var t = e.target; if (t.getAttribute && t.getAttribute('data-role') === 'nm') { if (e.key === 'Enter') commitName(); return; }
      var d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0;
      if (t.classList.contains('x32p-knob')) { var k = knobs[t.getAttribute('data-k')]; if (k.enc) { if (d) { e.preventDefault(); encInput(+t.getAttribute('data-k').slice(3), { delta: d }); } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); encInput(+t.getAttribute('data-k').slice(3), { press: true }); } return; }
        if (!d) return; e.preventDefault(); var v = k.map.get(); if (v != null) k.map.set(clamp(v + d * 0.02, 0, 1)); }
      else if (d && t.classList.contains('x32p-cap')) { e.preventDefault(); var o = stripByEl(t); if (o && o.inf && !o.inf.none) setFader(o, clamp(db2f(m.get(o.inf.fpath)) + d * 0.02, 0, 1)); }
    }
    function goPage(page, tab) { m.batch(function () { m.set('screen.modal', null); m.set('screen.page', page); m.set('screen.tab', tab || 0); }); }
    function toggle(path) { m.set(path, !m.get(path), { from: 'surface' }); }
    function fallbackInput(o) {   // 화면 파일이 없을 때: PAGE ◀▶ 로 HOME 탭 이동만
      if (o.kind === 'page' && S.screen.page === 'home') m.set('screen.tab', (S.screen.tab + o.dir + HOME_TABS.length) % HOME_TABS.length);
    }
    function selectItem(it) {
      if (!it) return;
      m.batch(function () {
        m.select(it.type, it.index);
        if (sofOn() && it.type === 'bus') m.set('config.sofTarget', it.index);
      });
    }
    function doAssignButton(k) {
      var b = S.config.assign.sets[S.config.assign.set].buttons[k], t = b && b.target; if (!t) { flash(btns['as.b' + k]); say('ASSIGN 단추 ' + (k + 5) + ' 에는 아직 맡긴 일이 없어요. ASSIGN VIEW 화면에서 정해요.'); return; }
      if (t === 'scene:next' || t === 'scene:prev') { m.set('config.scenes.next', clamp(S.config.scenes.next + (t === 'scene:next' ? 1 : -1), 0, S.config.scenes.list.length - 1)); goPage('scenes'); flash(btns['as.b' + k]); return; }
      if (/^tap:/.test(t)) { var fx = +t.split(':')[1], now = Date.now(), dt = now - U.tapT; U.tapT = now; if (dt > 100 && dt < 3000) { m.set('fx.' + fx + '.params.time', Math.round(dt)); say('TAP TEMPO: FX' + (fx + 1) + ' 딜레이 시간을 ' + Math.round(dt) + ' ms 로 맞췄어요.'); } else say('TAP TEMPO: 박자에 맞춰 한 번 더 눌러요.'); flash(btns['as.b' + k]); return; }
      if (typeof m.get(t) === 'boolean') toggle(t);
    }
    function commitName() { var md = S.screen.modal; if (!md) return; var inp = scr.querySelector('[data-role=nm]'); if (inp) { m.set((md.type === 'main' ? 'main.' + (md.index ? 'm' : 'st') : md.type + '.' + md.index) + '.name', inp.value); inp.blur(); } U.draft = null; m.set('screen.modal', null); }
    function onInput(e) { if (e.target.getAttribute && e.target.getAttribute('data-role') === 'nm' && U.draft) U.draft.v = e.target.value; }
    function onClick(e) {
      var a = e.target.closest('[data-act]'); if (a && el.contains(a)) { var act = a.getAttribute('data-act'); if (act === 'sound') toggleSound(); return; }
      var zb = e.target.closest('[data-zoom]'); if (zb && el.contains(zb)) { var z = +zb.getAttribute('data-zoom'); stage.style.width = 'max(' + (100 * z) + '%,' + Math.round(940 * z) + 'px)'; el.querySelectorAll('[data-zoom]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === zb)); }); return; }
      if (U.fbScreen) { var cb = e.target.closest('[data-col]'); var md = S.screen.modal; if (cb && md) { m.set((md.type === 'main' ? 'main.' + (md.index ? 'm' : 'st') : md.type + '.' + md.index) + '.color', +cb.getAttribute('data-col')); return; } if (e.target.closest('[data-role=ok]')) { commitName(); return; } }
      var b = e.target.closest('.x32p-btn'); if (!b || !el.contains(b) || b.classList.contains('dim')) return; var id = b.getAttribute('data-b'), s = sel(), base = selBase(), st = selStrip(), r;
      if ((r = id.match(/^(L|R|MAIN)(\d*)\.(sel|mute|solo)$/))) {
        var o = strips.filter(function (x) { return x.id === r[1] + r[2]; })[0], inf = o && o.inf, what = r[3]; if (!inf || inf.none) return;
        if (what === 'sel') { selectItem({ type: inf.type, index: inf.index }); return; }
        if (what === 'mute') { toggle(inf.mpath); return; }
        if (what === 'solo') { if (S.config.solo.exclusive) m.batch(function () { clearSolo(); }); toggle(inf.spath); return; }
        return;
      }
      if (id === 'main.clearsolo') { m.batch(clearSolo); return; }
      if ((r = id.match(/^layer\.(.+)$/))) { m.set('config.layer.left', r[1]); return; }
      if ((r = id.match(/^layerR\.(.+)$/))) { m.set('config.layer.right', r[1]); return; }
      if (id === 'sof') { m.batch(function () { if (sofOn()) { m.set('config.sendsOnFader', false); } else { m.set('config.sendsOnFader', true); if (s.type === 'bus') m.set('config.sofTarget', s.index); else if (S.config.sofTarget == null) m.set('config.sofTarget', 0); if (S.config.layer.right === 'dca' || S.config.layer.right === 'mtx-main') m.set('config.layer.right', 'bus1-8'); } }); return; }
      if (id === 'daw') { toggle('config.dawRemote'); say(S.config.dawRemote ? 'DAW REMOTE 를 켰어요. 컴퓨터 녹음 프로그램(DAW)이 연결되어 있지 않아서 이 실습에서는 페이더가 DAW 를 움직이지 않아요.' : 'DAW REMOTE 를 껐어요.'); return; }
      if (id === 'p48') { if (s.type === 'ch' || s.type === 'aux') { if (s.type === 'aux') { say('AUX IN 은 팬텀 전원(48V)이 없어요. 마이크 입력(CH)에서만 켜요.'); return; } toggle(base + '.preamp.phantom'); } else say('48V 는 입력 채널(CH)을 SELECT 해야 켤 수 있어요.'); return; }
      if (id === 'phase') { if (st.preamp) toggle(base + '.preamp.invert'); return; }
      if (id === 'lc') { if (st.preamp) toggle(base + '.preamp.lowcut.on'); return; }
      if (id === 'gate') { if (st.gate) toggle(base + '.gate.on'); else say('GATE 는 입력 채널에만 있어요.'); return; }
      if (id === 'dyn') { if (st.dyn) toggle(base + '.dyn.on'); return; }
      if (id === 'eq') { if (st.eq) toggle(base + '.eq.on'); return; }
      if (id === 'eqmode') { if (!st.eq) return; var bi = bandIdx(), n = st.eq.bands.length, list = n > 4 ? (bi === 0 ? EQ_MODES[0] : bi === n - 1 ? EQ_MODES[3] : EQ_MODES[1]) : EQ_MODES[bi], cur = st.eq.bands[bi].type; m.set(base + '.eq.bands.' + bi + '.type', list[(list.indexOf(cur) + 1) % list.length]); return; }
      if ((r = id.match(/^band(\d)$/))) { var k = +r[1], six = st.eq && st.eq.bands.length > 4, cb2 = S.config.view.eqBand, map6 = [0, 2, 3, 5], nb = six ? map6[k] : k;
        if (six && k === 0 && cb2 === 0) nb = 1; if (six && k === 3 && cb2 === 5) nb = 4;   // 버스 6밴드: LOW 를 한 번 더 → LOW2, HIGH 를 한 번 더 → HIGH2
        m.set('config.view.eqBand', nb); return; }
      if ((r = id.match(/^sb(\d)$/))) { m.set('config.view.sendBank', +r[1]); return; }
      if (id === 'mono' || id === 'lr') { if (st.main) toggle(base + '.main.' + (id === 'lr' ? 'st' : 'mono')); return; }
      if ((r = id.match(/^v\.(config|gate|dyn|eq|sends|main)$/))) { goPage('home', HOME_TABS.indexOf(r[1])); return; }
      if (id === 'v.usb') { goPage('recorder'); return; }
      if (id === 'v.mon') { goPage('monitor', 0); return; }
      if (id === 'v.talk') { goPage('monitor', 1); return; }
      if (id === 'v.assign') { goPage('assign', 1 + 'ABC'.indexOf(S.config.assign.set)); return; }
      if (id === 'sc.view') { goPage(S.screen.page === 'scenes' ? 'home' : 'scenes'); return; }
      if (id === 'monmono') { toggle('config.monitor.mono'); return; } if (id === 'dim') { toggle('config.monitor.dim'); return; }
      if (id === 'talka') { toggle('config.talkback.a'); return; } if (id === 'talkb') { toggle('config.talkback.b'); return; }
      if ((r = id.match(/^mg(\d)$/))) { toggle('muteGroups.' + r[1] + '.on'); return; }
      if ((r = id.match(/^menu\.(\w+)$/))) {
        if (r[1] === 'utility') {   // X32: UTILITY 는 지금 페이지의 도움 기능. CONFIG 탭에서 누르면 이름 · 색 · 아이콘 편집
          if (!U.fbScreen) { sendInput({ kind: 'utility' }); return; }
          if (S.screen.modal) { m.set('screen.modal', null); return; }
          if (S.screen.page === 'home' && S.screen.tab === 1) { m.set('screen.modal', { kind: 'name', type: s.type, index: s.index }); return; }
          goPage(S.screen.page === 'utility' ? 'home' : 'utility'); return;
        }
        if (S.screen.page === r[1] && !S.screen.modal) { sendInput({ kind: 'page', dir: 1 }); return; }   // 같은 메뉴 단추를 또 누르면 다음 탭
        goPage(r[1]); return;
      }
      if ((r = id.match(/^nav\.(\w+)$/))) { sendInput(r[1] === 'pgl' || r[1] === 'pgr' ? { kind: 'page', dir: r[1] === 'pgr' ? 1 : -1 } : { kind: 'layer', dir: r[1] === 'down' ? 1 : -1 }); flash(b); return; }
      if (id === 'sc.prev' || id === 'sc.next') { m.batch(function () { m.set('config.scenes.next', clamp(S.config.scenes.next + (id === 'sc.next' ? 1 : -1), 0, S.config.scenes.list.length - 1)); }); goPage('scenes'); return; }
      if (id === 'sc.go') { var was = S.config.scenes.dirty, nx = S.config.scenes.next; if (m.loadScene(nx)) { if (was && nx === 0) hit('scene'); goPage('scenes'); flash(b); } return; }
      if (id === 'sc.undo') { if (!m.undoScene()) say('되돌릴 씬 불러오기가 없어요.'); return; }
      if ((r = id.match(/^as\.set([ABC])$/))) { m.set('config.assign.set', r[1]); return; }
      if ((r = id.match(/^as\.b(\d)$/))) { doAssignButton(+r[1]); return; }
    }
    function clearSolo() { ['ch', 'aux', 'fxr', 'bus', 'mtx', 'dca'].forEach(function (t) { S[t].forEach(function (x, i) { if (x.solo) m.set(t + '.' + i + '.solo', false); }); }); ['st', 'm'].forEach(function (k) { if (S.main[k].solo) m.set('main.' + k + '.solo', false); }); }
    function onDbl(e) {   // LCD 두 번 누르기 → SELECT + HOME config 탭 + 이름 편집(UTILITY 와 같은 창)
      var l = e.target.closest('.x32p-lcd'); if (!l || !stage.contains(l)) return; var o = stripByEl(l); if (!o || !o.inf || o.inf.none) return;
      m.batch(function () { m.select(o.inf.type, o.inf.index); m.set('screen.page', 'home'); m.set('screen.tab', 1); m.set('screen.modal', { kind: 'name', type: o.inf.type, index: o.inf.index }); });
    }
    function flash(b) { b.classList.add('on'); setTimeout(function () { if (U.alive) { b.classList.remove('on'); schedule(); } }, 220); }
    function onOver(e) { var t = e.target.closest && e.target.closest('[data-tip], .x32p-cap'); if (!t || !stage.contains(t)) { hint.style.display = 'none'; return; } var txt = t.getAttribute('data-tip') || t.getAttribute('aria-label'); var r = t.getBoundingClientRect(), sr = stage.getBoundingClientRect(); hint.textContent = txt; hint.style.left = (r.left + r.width / 2 - sr.left) + 'px'; hint.style.top = (r.top - sr.top) + 'px'; hint.style.display = 'block'; }
    function onLeave() { hint.style.display = 'none'; }

    /* ---------- 소리 (X32Audio) ---------- */
    function audioSources() { var v = el.querySelector('[data-act=src]').value; return v === 'none' ? [] : undefined; }   // undefined = 오디오 엔진의 기본 스템(sources/ 8개, 이름으로 자동 연결)
    function toggleSound() {
      var b = el.querySelector('[data-act=sound]');
      if (U.audioOn) { try { U.audio && U.audio.stop(); } catch (e) { /* noop */ } U.audioOn = false; b.setAttribute('aria-pressed', 'false'); b.textContent = '🔊 소리 켜기'; return; }
      if (!window.X32Audio || typeof window.X32Audio.create !== 'function') { say('소리 파일(x32_audio.js)이 아직 준비되지 않았어요. 조작은 그대로 해 볼 수 있어요.'); return; }
      try {
        if (!U.audio) { var o = { onReady: function () { schedule(); } }, src = audioSources(); if (src) o.sources = src; U.audio = window.X32Audio.create(m, o); }
        var pr = U.audio.start(); U.audioOn = true; b.setAttribute('aria-pressed', 'true'); b.textContent = '🔊 소리 끄기'; applyListen();
        if (pr && pr.catch) pr.catch(function () { say('소리를 켜지 못했어요. 브라우저가 소리를 막았을 수 있어요.'); U.audioOn = false; b.setAttribute('aria-pressed', 'false'); b.textContent = '🔊 소리 켜기'; });
      } catch (e) { if (window.console) console.warn('X32Audio 오류', e); say('소리를 켜지 못했어요. 브라우저가 소리를 막았을 수 있어요.'); }
    }
    function applyListen() { if (!U.audio || !U.audio.listen) return; var v = el.querySelector('[data-act=listen]').value; try { U.audio.listen(/^bus/.test(v) ? { type: 'bus', index: +v.slice(3) } : v); } catch (x) { /* noop */ } }
    function onChange(e) {
      var t = e.target;
      if (t.matches('[data-act=src]')) { if (U.audio && U.audio.setSources) try { var sl = audioSources(); U.audio.setSources(sl || (window.X32Audio && X32Audio.DEFAULT_STEMS) || STEMS.map(function (x) { return { name: x.name, url: x.url, target: x.input }; })); } catch (x) { /* noop */ } return; }
      if (t.matches('[data-act=listen]')) { applyListen(); return; }
      if (t.matches('[data-act=files]') && t.files && t.files.length) {
        if (!window.X32Audio) { say('소리 파일(x32_audio.js)이 아직 준비되지 않았어요.'); return; }
        try {
          if (!U.audio) U.audio = window.X32Audio.create(m, { sources: [], onReady: function () { schedule(); } });
          var n = t.files.length, pr = U.audio.loadFiles ? U.audio.loadFiles(t.files) : null;
          var done = function (map) { var list = Array.isArray(map) ? map.filter(function (x) { return x && x.stem; }).map(function (x) { return x.input + ' ← ' + x.stem; }) : []; say('내 음원 ' + n + '개를 넣었어요. ' + (list.length ? list.slice(0, 6).join(', ') + (list.length > 6 ? ' …' : '') + '. ' : '') + '「소리 켜기」를 눌러 들어 봐요.'); };
          if (pr && pr.then) pr.then(done, function () { say('음원을 넣지 못했어요.'); }); else done(null);
        } catch (x) { say('음원을 넣지 못했어요.'); }
      }
    }

    /* ---------- 연결 ---------- */
    function onModel(path) {
      if (path === 'screen.input') return;
      if (path === '*' || path.indexOf('screen.modal') === 0 || path.indexOf('screen.page') === 0) { schedule(); return; }
      schedule();
    }
    m.on(onModel);
    stage.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove, { passive: false }); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    stage.addEventListener('wheel', onWheel, { passive: false }); stage.addEventListener('keydown', onKey); el.addEventListener('click', onClick); el.addEventListener('change', onChange); stage.addEventListener('dblclick', onDbl); stage.addEventListener('input', onInput);
    stage.addEventListener('mouseover', onOver); stage.addEventListener('mouseleave', onLeave);
    mountScreen(); render(); tick();

    function lcdText(o) { return o.inf && !o.inf.none ? o.inf.id + ' ' + o.inf.name : ''; }
    var api = {
      model: m,
      destroy: function () {
        U.alive = false; cancelAnimationFrame(U.raf); m.off(onModel); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
        try { U.screen && U.screen.destroy && U.screen.destroy(); } catch (e) { /* noop */ } try { U.audio && U.audio.destroy && U.audio.destroy(); } catch (e) { /* noop */ }
        el.removeEventListener('click', onClick); el.removeEventListener('change', onChange); el.innerHTML = '';
      },
      state: function () {
        if (U.dirtyR) render();
        var c = S.ch[16], s = sel(), sc = S.config.scenes;
        return { ready: true, audio: U.audioOn, screen: !U.fbScreen, layerL: LL_OLD[S.config.layer.left], layerR: LR_OLD[S.config.layer.right], layer: { left: S.config.layer.left, right: S.config.layer.right },
          sel: s.type === 'ch' ? s.index + 1 : null, selected: { type: s.type, index: s.index }, sof: S.config.sendsOnFader ? (S.config.sofTarget == null ? 0 : S.config.sofTarget) : -1,
          page: S.screen.page, tab: S.screen.tab, modal: S.screen.modal, lastInput: S.screen.input, scene: pad2(sc.next + 1), sceneCurrent: pad2(sc.current + 1), dirty: !!sc.dirty,
          ch17: { p48: c.preamp.phantom, gain: c.preamp.gain, input: fin(chIn(16)), lc: c.preamp.lowcut.on, lcf: c.preamp.lowcut.freq }, ch1: { fader: fin(S.ch[0].fader), send1: fin(S.ch[0].sends[0].level), out: fin(chOut(0)) },
          dca: S.dca.map(function (d) { return fin(d.fader); }), main: fin(mainLv()), bus: [0, 1, 2, 3].map(function (k) { return fin(busLv(k)); }), mg: S.muteGroups.map(function (g) { return g.on; }), done: Object.keys(U.done),
          lcds: strips.map(lcdText), faders: strips.map(function (o) { return o.inf && !o.inf.none ? Math.round(db2f(m.get(o.inf.fpath)) * 1000) / 1000 : null; }) };
      },
      // set: 테스트 · 디버그용 — { layerL:'in2', layerR:'bus1', sel:17, page:'home', 'ch.0.mute': true … }
      set: function (o) {
        o = o || {}; var inv = function (map, v) { var k = Object.keys(map).filter(function (x) { return map[x] === v; })[0]; return k || v; };
        m.batch(function () {
          Object.keys(o).forEach(function (k) {
            var v = o[k];
            if (k === 'layerL') m.set('config.layer.left', inv(LL_OLD, v)); else if (k === 'layerR') m.set('config.layer.right', inv(LR_OLD, v));
            else if (k === 'sel') m.select('ch', v - 1); else if (k === 'sof') { m.set('config.sendsOnFader', v >= 0); if (v >= 0) m.set('config.sofTarget', v); }
            else if (k === 'page') m.set('screen.page', v); else if (k === 'sceneCur') m.set('config.scenes.next', v); else if (k.indexOf('.') > 0) m.set(k, v);
          });
        });
        render(); return this.state();
      },
      knobValue: function (id) { return knobs[id] && !knobs[id].enc ? knobs[id].map.get() : null; },
      SCREEN_RECT: SCREEN_RECT, layout: LY.key
    };
    return api;
  }
  window.STASims = window.STASims || {};
  window.STASims.x32Photo = x32Photo;
  window.STASims.x32PhotoScreenRect = X32L.SCREEN_RECT;
  window.STASims.x32Layouts = { x32: X32L };
  /* M32: 같은 X32Model · X32Screen · X32Audio(같은 펌웨어 4) 위에 Midas M32 LIVE 사진 배치만 바꿔요 — lessons/modules/m32_layout.js 가 STASims.x32Layouts.m32 를 넣어요 */
  window.STASims.m32Photo = function (el, opts) { opts = opts || {}; var L = window.STASims.x32Layouts.m32; if (!L) { el.innerHTML = '<p class="x32p-note">M32 배치 파일(m32_layout.js)을 불러오지 못했어요.</p>'; return { destroy: function () { el.innerHTML = ''; }, state: function () { return { ready: false }; }, set: function () { return { ready: false }; }, knobValue: function () { return null; } }; }
    var o2 = {}; Object.keys(opts).forEach(function (k) { o2[k] = opts[k]; }); o2.layout = L; return x32Photo(el, o2); };
})();
