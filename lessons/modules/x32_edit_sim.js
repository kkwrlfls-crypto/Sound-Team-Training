/* =============================================================================
   03-2 디지털 콘솔 실습 — X32-Edit 스타일 가상 편집 화면 (2026-11-03)
   - STASims.x32Edit(el, { onTask }) → { destroy, state, set }
   - 화면 구성은 Behringer X32-Edit(원격 편집 프로그램)의 배치를 따름:
       위 = 페이지 버튼(HOME · METERS · ROUTING · SETUP · LIBRARY · EFFECTS · MUTE GRP · UTILITY) + SCENES
       왼쪽 = 고른 채널의 채널 스트립,  가운데 = 페이지(HOME 은 Home·Config·Gate·Dyn·EQ·Sends·Main 탭)
       아래 = 믹서(페이더 뱅크 · SENDS ON FADER · MAIN LR)
   - 로고·아이콘·화면 그림은 쓰지 않고 직접 그린 단순화 화면. 실제 X32-Edit 는 한 번에 16채널 · 페이지·기능이 더 많음.
   - 레벨(dB)·미터는 교육용 근사.
   ============================================================================= */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var NINF = -Infinity;
  function psum(arr) { var p = 0; arr.forEach(function (d) { if (isFinite(d)) p += Math.pow(10, d / 10); }); return p > 0 ? 10 * Math.log10(p) : NINF; }
  function fmt(d) { return !isFinite(d) || d < -90 ? '−∞' : (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d).toFixed(Math.abs(d) < 10 ? 1 : 0); }
  function fin(d) { return !isFinite(d) ? null : Math.round(d * 10) / 10; }
  // 페이더: 0–1000 → dB (X32 눈금을 단순화: 750 ≈ 0 dB, 1000 = +10 dB)
  var FPTS = [[0, NINF], [60, -60], [250, -30], [500, -10], [750, 0], [1000, 10]];
  function fdb(p) { if (p <= 0) return NINF; for (var i = 1; i < FPTS.length; i++) { var a = FPTS[i - 1], b = FPTS[i]; if (p <= b[0]) { if (a[1] === NINF) return b[1] - (b[0] - p) / (b[0] - a[0]) * 30; return a[1] + (b[1] - a[1]) * (p - a[0]) / (b[0] - a[0]); } } return 10; }
  function fpos(d) { if (d == null || d === NINF) return 0; for (var i = 1; i < FPTS.length; i++) { var a = FPTS[i - 1], b = FPTS[i]; if (d <= b[1]) { if (a[1] === NINF) return Math.max(1, b[0] - (b[1] - d) / 30 * (b[0] - a[0])); return a[0] + (b[0] - a[0]) * (d - a[1]) / (b[1] - a[1]); } } return 1000; }
  // LOW CUT 주파수: 슬라이더 0–100 → 20–400 Hz (로그)
  function lcHz(p) { return Math.round(20 * Math.pow(20, p / 100)); }
  function lcPos(hz) { return Math.round(Math.log(hz / 20) / Math.log(20) * 100); }

  // 교회 예배 예시 채널: [이름, 입력 장비, GAIN 0 dB 일 때 가장 큰 순간 입력(dBFS, 교육용 가정), 콘덴서(팬텀 필요), 스크리블 색]
  var CY = '#22d3ee', GR = '#4ade80', YE = '#facc15', MA = '#e879f9', WH = '#e5e7eb';
  var CHS = [
    ['인도자 보컬', 'SM58', -48, 0, CY], ['싱어 1', 'SM58', -50, 0, CY], ['싱어 2', 'SM58', -50, 0, CY], ['어쿠스틱 기타', 'DI', -30, 0, GR],
    ['건반 L', 'DI', -20, 0, GR], ['건반 R', 'DI', -20, 0, GR], ['베이스', 'DI', -24, 0, GR], ['킥', '드럼 마이크', -38, 0, GR],
    ['스네어', '드럼 마이크', -36, 0, GR], ['오버헤드', '콘덴서', -44, 1, GR], ['일렉 기타', '앰프 마이크', -40, 0, GR], ['성가대 L', '콘덴서', -46, 1, YE],
    ['성가대 R', '콘덴서', -46, 1, YE], ['설교 (구즈넥)', '콘덴서', -45, 1, MA], ['사회 (무선)', '무선 수신기', -26, 0, MA], ['노트북 영상', 'USB·라인', -18, 0, WH]
  ];
  var DCAS = [['악기', [4, 5, 6, 7, 8, 9, 10, 11]], ['보컬', [1, 2, 3]], ['설교·사회', [14, 15]], ['성가대', [12, 13]]];
  var BUSES = [['인도자 모니터', 'PRE'], ['싱어 모니터', 'PRE'], ['드럼 모니터', 'PRE'], ['방송·녹음', 'POST']];
  var MGS = [['밴드', [4, 5, 6, 7, 8, 9, 10, 11]], ['보컬', [1, 2, 3]], ['설교·사회', [14, 15]], ['성가대', [12, 13]], ['영상', [16]], ['(비어 있음)', []]];
  var EQB = [['LOW', '100 Hz'], ['LO MID', '400 Hz'], ['HI MID', '2.5 kHz'], ['HIGH', '8 kHz']];
  var PAGES = [['home', 'HOME'], ['meters', 'METERS'], ['routing', 'ROUTING'], ['setup', 'SETUP'], ['library', 'LIBRARY'], ['effects', 'EFFECTS'], ['mutegrp', 'MUTE GRP'], ['utility', 'UTILITY']];
  var TABS = [['home', 'Home'], ['config', 'Config'], ['gate', 'Gate'], ['dyn', 'Dyn'], ['eq', 'EQ'], ['sends', 'Sends'], ['main', 'Main']];
  var INFO = {
    routing: ['ROUTING — 입력·출력 연결(패치)', '어느 단자(로컬 입력 · AES50 스테이지박스 · USB)가 몇 번 채널로 들어오고, BUS·MAIN 이 어느 출력 단자로 나갈지 정하는 곳이에요. 잘못 바꾸면 소리가 엉뚱한 곳으로 가니, 이 실습에서는 열어 보기만 해요.'],
    setup: ['SETUP — 콘솔 기본 설정', '날짜·화면 밝기·네트워크(원격 앱 연결용 IP 주소) 같은 기본 설정이에요. X32-Edit 가 콘솔을 찾지 못할 때 여기서 네트워크를 확인해요.'],
    library: ['LIBRARY — 채널·이펙트 설정 저장', '채널 하나의 설정(EQ·컴프 등)이나 이펙트 설정을 따로 저장해 두었다가 다른 채널에 불러오는 곳이에요. 콘솔 전체 설정은 SCENES(씬)에서 저장해요.'],
    effects: ['EFFECTS — 이펙터 8대', 'X32 안에 들어 있는 이펙터 8대(리버브·딜레이 등)를 고르고 조절해요. 1–4번은 BUS 로 보내 쓰거나 인서트로, 5–8번은 인서트로만 써요.'],
    utility: ['UTILITY — 지금 화면의 보조 기능', '지금 보고 있는 화면에 따라 복사·붙여넣기, 이름·색 바꾸기 같은 보조 기능이 나와요.']
  };

  function injectCss() {
    if (document.getElementById('sta-x32e-css')) return;
    var st = document.createElement('style'); st.id = 'sta-x32e-css';
    st.textContent = [
      '.xe{--bg:#1b1d21;--pn:#26292f;--pn2:#2f333a;--ln:#3b4049;--tx:#e5e7eb;--sub:#9aa3af;--acc:#f59e0b;--on:#fbbf24;--red:#ef4444;--sof:#f97316;',
      'display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:12px;background:var(--bg);color:var(--tx);border:1px solid #0b0c0e;font-size:.78rem;min-width:0}',
      '.xe button{font:inherit;cursor:pointer}',
      '.xe-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0}',
      '.xe-app{font-weight:800;font-size:.72rem;color:var(--sub);letter-spacing:.03em;padding-right:4px}',
      '.xe-pages{display:flex;gap:4px;flex-wrap:wrap;min-width:0}',
      '.xe-pg{padding:5px 9px;border-radius:5px;border:1px solid #111;background:var(--pn2);color:var(--tx);font-size:.68rem!important;font-weight:800;letter-spacing:.02em}',
      '.xe-pg[aria-pressed="true"]{background:var(--acc);color:#111}',
      '.xe-pg.scn{background:#1e3a5f;color:#bfdbfe}.xe-pg.scn[aria-pressed="true"]{background:#60a5fa;color:#0b1220}',
      '.xe-scn{margin-left:auto;padding:4px 10px;border-radius:999px;background:#0b1220;border:1px solid #334155;font-weight:800;font-size:.7rem;color:#bfdbfe;white-space:nowrap}',
      '.xe-scn.dirty::after{content:" · 바뀜";color:#fde68a}',
      '.xe-mid{display:grid;grid-template-columns:200px minmax(0,1fr);gap:8px;min-width:0}',
      '.xe-cs{background:var(--pn);border:1px solid var(--ln);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px;min-width:0}',
      '.xe-cs-h{display:flex;flex-direction:column;gap:1px;padding:6px 8px;border-radius:6px;background:var(--c);color:#0b0c0e}',
      '.xe-cs-h span{font-size:.64rem;font-weight:800;opacity:.8}.xe-cs-h b{font-size:.86rem}',
      '.xe-sec{border:1px solid var(--ln);border-radius:6px;padding:6px;display:flex;flex-direction:column;gap:5px;background:rgba(0,0,0,.18)}',
      '.xe-sec>button.hd{all:unset;cursor:pointer;display:flex;justify-content:space-between;font-weight:800;font-size:.66rem;color:#cbd5e1;letter-spacing:.05em}',
      '.xe-sec>button.hd:focus-visible{outline:2px solid var(--acc)}',
      '.xe-sec>button.hd::after{content:"열기 ›";color:var(--sub);font-weight:600}',
      '.xe-row{display:flex;gap:4px;flex-wrap:wrap;align-items:center}',
      '.xe-b{padding:4px 7px;border-radius:5px;border:1px solid #0b0c0e;background:#444a54;color:var(--tx);font-size:.66rem!important;font-weight:800;box-shadow:inset 0 -2px 0 rgba(0,0,0,.35)}',
      '.xe-b[aria-pressed="true"]{background:var(--on);color:#111}',
      '.xe-b.mute[aria-pressed="true"]{background:var(--red);color:#fff}',
      '.xe-b.solo[aria-pressed="true"]{background:#facc15;color:#111}',
      '.xe-b.sof[aria-pressed="true"]{background:var(--sof);color:#111;box-shadow:0 0 10px rgba(249,115,22,.6)}',
      '.xe-b[disabled]{opacity:.35;cursor:default}',
      '.xe-sl{display:grid;grid-template-columns:auto minmax(0,1fr) 4.6em;gap:5px;align-items:center}',
      '.xe-sl>span{font-size:.64rem;color:var(--sub);white-space:nowrap}',
      '.xe-sl input{width:100%;min-width:0;accent-color:var(--acc)}',
      '.xe-sl b,.xe-v{font-variant-numeric:tabular-nums;font-size:.68rem;color:#fde68a;text-align:right}',
      '.xe-scr{background:#11141a;border:1px solid #39404b;border-radius:8px;display:flex;flex-direction:column;min-width:0;min-height:260px}',
      '.xe-tabs{display:flex;gap:2px;padding:4px 4px 0;border-bottom:1px solid #39404b;overflow-x:auto}',
      '.xe-tab{padding:6px 11px;border:0;border-radius:6px 6px 0 0;background:#1f242c;color:var(--sub);font-size:.7rem!important;font-weight:800;white-space:nowrap}',
      '.xe-tab[aria-selected="true"]{background:#2d3542;color:#fff;box-shadow:inset 0 2px 0 var(--acc)}',
      '.xe-pgc{padding:10px;display:flex;flex-direction:column;gap:8px;min-width:0}',
      '.xe-pgc h5{margin:0;font-size:.74rem;color:#93c5fd;letter-spacing:.03em}',
      '.xe-pgc p{margin:0;color:#cbd5e1;line-height:1.55}',
      '.xe-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px}',
      '.xe-card{background:#1a1f27;border:1px solid #333b47;border-radius:6px;padding:7px;display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.xe-card>b{font-size:.66rem;color:#cbd5e1;letter-spacing:.05em}',
      '.xe-card>span{color:#e5e7eb}',
      '.xe-tag{display:inline-block;padding:1px 7px;border-radius:999px;font-size:.62rem;font-weight:800;background:#334155;color:#e2e8f0}',
      '.xe-tag.on{background:#166534;color:#dcfce7}.xe-tag.off{background:#3f3f46;color:#a1a1aa}.xe-tag.sof{background:var(--sof);color:#111}',
      '.xe-hm{position:relative;height:14px;border-radius:4px;background:linear-gradient(90deg,#14532d 0 70%,#713f12 70% 90%,#7f1d1d 90% 100%);overflow:hidden}',
      '.xe-hm i{position:absolute;left:0;top:0;bottom:0;width:100%;background:linear-gradient(90deg,#22c55e 0 70%,#facc15 70% 90%,#ef4444 90%);clip-path:inset(0 var(--cut,100%) 0 0)}',
      '.xe-hm b{position:absolute;top:0;width:2px;height:14px;background:#fff;left:var(--pk,0%)}',
      '.xe-hm em{position:absolute;top:0;bottom:0;left:70%;width:20%;border:1px dashed rgba(255,255,255,.55);border-width:0 1px}',
      '.xe-scale{display:flex;justify-content:space-between;font-size:.58rem;color:var(--sub)}',
      '.xe-eqsvg{width:100%;height:auto;display:block;background:#0b0f15;border-radius:6px;border:1px solid #2a313b}',
      '.xe-mix{background:var(--pn);border:1px solid var(--ln);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px;min-width:0}',
      '.xe-banks{display:flex;gap:4px;flex-wrap:wrap;align-items:center}',
      '.xe-banks .lb{font-size:.62rem;color:var(--sub);margin-right:2px}',
      '.xe-bk{padding:5px 9px;border-radius:5px;border:1px solid #0b0c0e;background:#3a3f48;color:var(--tx);font-size:.66rem!important;font-weight:800}',
      '.xe-bk[aria-pressed="true"]{background:#e5e7eb;color:#111}',
      '.xe-sofbus{display:flex;gap:3px;align-items:center}',
      '.xe-faders{display:flex;gap:6px;align-items:stretch;overflow-x:auto;padding-bottom:4px}',
      '.xe-st{flex:0 0 66px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:4px 3px 6px;border-radius:6px;background:#1e2126;border:1px solid #31353d}',
      '.xe-st.sel{border-color:var(--on);box-shadow:0 0 0 1px var(--on) inset}',
      '.xe-st.sofm{background:#2a1d12}',
      '.xe-st.off{opacity:.38}',
      '.xe-scrib{width:100%;border-radius:4px;background:var(--c,#475569);color:#0b0c0e;padding:2px 3px;text-align:center;line-height:1.15;min-height:2.6em;display:flex;flex-direction:column;justify-content:center}',
      '.xe-scrib span{font-size:.56rem;font-weight:800;opacity:.75}.xe-scrib b{font-size:.6rem;font-weight:800;word-break:keep-all}',
      '.xe-st .xe-b{width:100%;padding:3px 0;font-size:.6rem!important}',
      '.xe-fw{display:flex;gap:4px;align-items:stretch;height:132px}',
      '.xe-vm{position:relative;width:6px;border-radius:3px;background:#0b0f15;overflow:hidden}',
      '.xe-vm i{position:absolute;left:0;right:0;bottom:0;top:0;background:linear-gradient(0deg,#22c55e 0 70%,#facc15 70% 90%,#ef4444 90%);clip-path:inset(var(--cut,100%) 0 0 0)}',
      '.xe-fd{writing-mode:vertical-lr;direction:rtl;width:22px;height:132px;margin:0;accent-color:#d1d5db}',
      '.xe-st.sofm .xe-fd{accent-color:var(--sof)}',
      '.xe-st.dca .xe-fd{accent-color:#a78bfa}',
      '.xe-st .xe-v{text-align:center}',
      '.xe-st.main{flex-basis:70px;background:#2a1717;border-color:#5b2323}',
      '.xe-st.main .xe-fd{accent-color:var(--red)}',
      '.xe-mtrs{display:flex;gap:6px;flex-wrap:wrap}',
      '.xe-mtrs .m{display:flex;flex-direction:column;align-items:center;gap:3px;width:42px}',
      '.xe-mtrs .m .xe-vm{width:10px;height:90px}',
      '.xe-mtrs .m span{font-size:.56rem;color:var(--sub);text-align:center;line-height:1.2}',
      '.xe-mg{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px}',
      '.xe-mg button{padding:10px 8px;border-radius:7px;border:1px solid #0b0c0e;background:#3a3f48;color:var(--tx);text-align:left;display:flex;flex-direction:column;gap:2px}',
      '.xe-mg button[aria-pressed="true"]{background:var(--red);color:#fff}',
      '.xe-mg button b{font-size:.74rem}.xe-mg button span{font-size:.62rem;opacity:.8}',
      '.xe-scl{display:grid;gap:4px}',
      '.xe-scl label{display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:6px;background:#1a1f27;border:1px solid #333b47;cursor:pointer}',
      '.xe-scl label:has(input:checked){border-color:#60a5fa;background:#13243d}',
      '.xe-read{display:flex;flex-wrap:wrap;gap:6px;font-size:.68rem}',
      '.xe-read>span{padding:4px 8px;border-radius:6px;background:#0f1216;border:1px solid #2e333b;color:var(--sub)}',
      '.xe-read>span b{color:#e5e7eb;margin-left:4px;font-variant-numeric:tabular-nums}',
      '.xe-read>span b.bad{color:#fca5a5}.xe-read>span b.warn{color:#fde68a}',
      '.xe-note{font-size:.64rem;color:var(--sub);margin:0}',
      '@media (max-width:720px){.xe-mid{grid-template-columns:minmax(0,1fr)}.xe-scn{margin-left:0}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function x32Edit(el, opts) {
    opts = opts || {}; injectCss();
    function initState() {
      return {
        ch: CHS.map(function (c, i) {
          var n = i + 1, g = { 1: 36, 2: 36, 3: 36, 4: 18, 5: 8, 6: 8, 7: 12, 8: 26, 9: 24, 10: 30, 11: 26, 12: 32, 13: 32, 14: 20, 15: 12, 16: 6 }[n];
          return { gain: g, p48: !!c[3] && n !== 14, phase: false, lc: [1, 2, 3, 12, 13, 15].indexOf(n) >= 0, lcf: n === 14 ? 40 : 100,
            gate: [8, 9].indexOf(n) >= 0, gthr: -50, dyn: [1, 2, 3, 7].indexOf(n) >= 0, dthr: -20, ratio: 3, eq: true, eqg: [0, 0, 0, 0],
            mute: false, solo: false, fader: n === 14 ? 0 : n === 16 ? NINF : -5, pan: 0, lr: true,
            send: [n === 1 ? NINF : n <= 3 ? -8 : -15, n <= 3 ? -4 : -18, n >= 7 && n <= 10 ? -6 : NINF, -10] };
        }),
        dca: [0, 0, 0, 0], dcaMute: [false, false, false, false], bus: [0, 0, 0, 0], busMute: [false, false, false, false],
        mg: [false, false, false, false, false, false], main: 0, mainMute: false
      };
    }
    function clone(o) { return JSON.parse(JSON.stringify(o, function (k, v) { return v === NINF ? '-inf' : v; }), function (k, v) { return v === '-inf' ? NINF : v; }); }
    var M = initState(), scenes = { '01': clone(M), '02': null }, sceneSel = '01';
    var S = { page: 'home', tab: 'home', bank: 'in1', sel: 1, sof: -1, dirty: false, sawSof: false, done: {}, frame: 0 };
    var alive = true, raf = 0;

    /* ---------- 신호 계산 (교육용 근사) */
    function mgMuted(n) { return MGS.some(function (g, k) { return M.mg[k] && g[1].indexOf(n) >= 0; }); }
    function chIn(n) { var c = CHS[n - 1], m = M.ch[n - 1]; if (c[3] && !m.p48) return NINF; return c[2] + m.gain; }
    function chOut(n) { var m = M.ch[n - 1], d = 0; if (m.mute || mgMuted(n)) return NINF; DCAS.forEach(function (dc, k) { if (dc[1].indexOf(n) >= 0) d += M.dcaMute[k] ? NINF : M.dca[k]; }); var lv = chIn(n) + m.fader + d; return isFinite(lv) ? lv : NINF; }
    function mainLv() { if (M.mainMute) return NINF; var a = []; for (var n = 1; n <= 16; n++) if (M.ch[n - 1].lr) a.push(chOut(n) - 10); return psum(a) + M.main; }
    function busLv(b) { if (M.busMute[b]) return NINF; var a = []; for (var n = 1; n <= 16; n++) { var m = M.ch[n - 1]; if (m.mute || mgMuted(n)) continue; a.push((BUSES[b][1] === 'PRE' ? chIn(n) : chOut(n)) + m.send[b] - 6); } return psum(a) + M.bus[b]; }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function judge() {
      var c = M.ch[13], i14 = chIn(14);
      if (S.sel === 14 && c.p48) hit('p48');
      if (S.sel === 14 && c.p48 && i14 >= -18 && i14 <= -6) hit('gain');
      if (S.sel === 14 && c.lc && c.lcf >= 80 && c.lcf <= 150) hit('lowcut');
      if (S.sof === 0 && M.ch[0].send[0] >= -10 && S.sawSof) hit('sof');
      if (M.dca[0] <= -10 && !M.dcaMute[0]) hit('dca');
    }

    /* ---------- 경로(path) 읽기·쓰기: 'ch.14.gain', 'ch.1.send.0', 'dca.0', 'busMute.2', 'main' … */
    function ref(p) { var a = p.split('.'), o = M, i; for (i = 0; i < a.length - 1; i++) { var k = a[i]; if (o === M && k === 'ch') { o = M.ch[+a[++i] - 1]; continue; } o = o[k]; } return [o, a[a.length - 1]]; }
    function get(p) { var r = ref(p); return r[0][r[1]]; }
    function put(p, v) { var r = ref(p); r[0][r[1]] = v; }
    var SC = {
      fader: { min: 0, max: 1000, step: 1, to: fpos, from: fdb, txt: function (v) { return fmt(v); } },
      gain: { min: -12, max: 60, step: 0.5, to: function (v) { return v; }, from: function (v) { return v; }, txt: function (v) { return (v > 0 ? '+' : '') + v.toFixed(1) + ' dB'; } },
      lcf: { min: 0, max: 100, step: 1, to: lcPos, from: lcHz, txt: function (v) { return v + ' Hz'; } },
      thr: { min: -80, max: 0, step: 1, to: function (v) { return v; }, from: function (v) { return v; }, txt: function (v) { return v + ' dB'; } },
      eqg: { min: -15, max: 15, step: 0.5, to: function (v) { return v; }, from: function (v) { return v; }, txt: function (v) { return (v > 0 ? '+' : '') + v.toFixed(1); } },
      pan: { min: -100, max: 100, step: 1, to: function (v) { return v; }, from: function (v) { return v; }, txt: function (v) { return v === 0 ? 'C' : (v < 0 ? 'L' : 'R') + Math.abs(v); } }
    };
    function rng(p, sc, label, cls) { var s = SC[sc]; return '<input type="range" class="' + (cls || '') + '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + s.to(get(p)) + '" data-k="' + p + '" data-sc="' + sc + '" aria-label="' + esc(label) + '">'; }
    function val(p, sc) { return '<b class="xe-v" data-v="' + p + '" data-sc="' + sc + '">' + SC[sc].txt(get(p)) + '</b>'; }
    function sl(label, p, sc, aria) { return '<div class="xe-sl"><span>' + label + '</span>' + rng(p, sc, aria || label) + val(p, sc) + '</div>'; }
    function tg(p, label, cls, aria) { return '<button type="button" class="xe-b ' + (cls || '') + '" data-tg="' + p + '" aria-pressed="' + !!get(p) + '"' + (aria ? ' aria-label="' + esc(aria) + '"' : '') + '>' + label + '</button>'; }
    function onoff(v) { return '<span class="xe-tag ' + (v ? 'on' : 'off') + '">' + (v ? 'ON' : 'OFF') + '</span>'; }

    /* ---------- 뼈대 */
    var q = function (s) { return el.querySelector(s); };
    el.innerHTML = '<div class="xe" aria-label="X32-Edit 스타일 가상 편집 화면 (교육용 단순화)">' +
      '<div class="xe-top"><span class="xe-app">X32-Edit 스타일</span><div class="xe-pages" role="group" aria-label="페이지">' +
        PAGES.map(function (p) { return '<button type="button" class="xe-pg" data-page="' + p[0] + '" aria-pressed="false">' + p[1] + '</button>'; }).join('') +
        '<button type="button" class="xe-pg scn" data-page="scenes" aria-pressed="false">SCENES</button></div>' +
        '<span class="xe-scn" data-role="scn"></span></div>' +
      '<div class="xe-mid"><aside class="xe-cs" data-role="cs" aria-label="고른 채널의 채널 스트립"></aside><section class="xe-scr" data-role="scr" aria-label="편집 화면"></section></div>' +
      '<div class="xe-mix" aria-label="믹서"><div class="xe-banks" data-role="banks"></div><div class="xe-faders" data-role="faders"></div></div>' +
      '<div class="xe-read" data-role="read" aria-live="polite"></div>' +
      '<p class="xe-note">실제 X32-Edit 는 한 화면에 16채널 페이더와 더 많은 페이지·기능이 있어요. 여기서는 8개씩 · 예배에 필요한 것만 남겼어요. 레벨은 교육용 근사예요.</p>' +
    '</div>';
    var cs = q('[data-role=cs]'), scr = q('[data-role=scr]'), banks = q('[data-role=banks]'), faders = q('[data-role=faders]'), read = q('[data-role=read]'), scn = q('[data-role=scn]');

    function renderCs() {
      var n = S.sel, c = CHS[n - 1], p = 'ch.' + n + '.';
      cs.innerHTML = '<div class="xe-cs-h" style="--c:' + c[4] + '"><span>CH ' + String(n).padStart(2, '0') + ' · 로컬 입력 ' + n + '</span><b>' + esc(c[0]) + '</b></div>' +
        '<div class="xe-sec"><button type="button" class="hd" data-tab="config">CONFIG / PREAMP</button>' + sl('GAIN', p + 'gain', 'gain', 'CH' + n + ' GAIN') +
          '<div class="xe-row">' + tg(p + 'p48', '48V', '', 'CH' + n + ' 48V 팬텀') + tg(p + 'phase', 'Ø') + tg(p + 'lc', 'LOW CUT') + '</div></div>' +
        '<div class="xe-sec"><button type="button" class="hd" data-tab="gate">GATE · DYN</button><div class="xe-row">' + tg(p + 'gate', 'GATE') + tg(p + 'dyn', 'COMP') + '</div></div>' +
        '<div class="xe-sec"><button type="button" class="hd" data-tab="eq">EQUALIZER</button><div class="xe-row">' + tg(p + 'eq', 'EQ') + '</div></div>' +
        '<div class="xe-sec"><button type="button" class="hd" data-tab="sends">BUS SENDS</button>' + BUSES.map(function (b, k) { return sl(String(k + 1), p + 'send.' + k, 'fader', 'CH' + n + ' → BUS ' + (k + 1) + ' ' + b[0]); }).join('') + '</div>' +
        '<div class="xe-sec"><button type="button" class="hd" data-tab="main">MAIN BUS</button><div class="xe-row">' + tg(p + 'lr', 'LR') + '</div>' + sl('PAN', p + 'pan', 'pan') + '</div>';
    }
    function eqSvg(m) {
      var W = 300, H = 90, fx = [100, 400, 2500, 8000], pts = [];
      for (var i = 0; i <= 60; i++) { var f = 20 * Math.pow(1000, i / 60), g = 0; if (m.eq) fx.forEach(function (c, k) { var d = Math.log2(f / c); g += m.eqg[k] * Math.exp(-d * d * 1.6); }); if (m.lc) g += Math.min(0, 12 * Math.log2(f / m.lcf)); pts.push([i / 60 * W, H / 2 - clamp(g, -18, 18) / 18 * (H / 2 - 6)]); }
      return '<svg class="xe-eqsvg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path d="M0 ' + H / 2 + 'H' + W + '" stroke="#334155"/>' + [100, 1000, 10000].map(function (f) { var x = Math.log(f / 20) / Math.log(1000) * W; return '<path d="M' + x + ' 0V' + H + '" stroke="#1f2937"/>'; }).join('') +
        '<path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + '" stroke="' + (m.eq ? '#fbbf24' : '#64748b') + '" stroke-width="2" fill="none"/></svg>';
    }
    function tabHtml(n) {
      var m = M.ch[n - 1], c = CHS[n - 1], p = 'ch.' + n + '.';
      switch (S.tab) {
        case 'config': return '<h5>Config — 입력 · 프리앰프</h5><div class="xe-grid">' +
            '<div class="xe-card"><b>SOURCE</b><span>로컬 입력 ' + n + ' · ' + esc(c[1]) + '</span></div>' +
            '<div class="xe-card"><b>48V · Ø</b><div class="xe-row">' + tg(p + 'p48', '48V', '', 'CH' + n + ' 48V 팬텀') + tg(p + 'phase', 'Ø (위상)') + '</div></div></div>' +
          sl('GAIN', p + 'gain', 'gain', 'CH' + n + ' GAIN (Config)') +
          '<div><div class="xe-hm" data-m="in:' + n + '"><i></i><em></em><b></b></div><div class="xe-scale"><span>−60</span><span>−30</span><span>−18</span><span>−6</span><span>0 dBFS</span></div></div>' +
          '<p>흰 선은 소리가 가장 큰 순간이에요. 점선 칸(−18 ~ −6 dBFS)에 오게 맞춰요.' + (c[3] ? ' 이 채널은 콘덴서 마이크라 48V 가 꺼져 있으면 소리가 들어오지 않아요.' : '') + '</p>' +
          '<div class="xe-card"><b>LOW CUT</b><div class="xe-row">' + tg(p + 'lc', 'LOW CUT') + '</div>' + sl('FREQ', p + 'lcf', 'lcf', 'CH' + n + ' LOW CUT 주파수') + '</div>';
        case 'gate': return '<h5>Gate — 작은 소리 닫기</h5><div class="xe-row">' + tg(p + 'gate', 'GATE ON') + '</div>' + sl('THRESHOLD', p + 'gthr', 'thr') +
          '<p>THRESHOLD 보다 작은 소리는 닫아요. 드럼 마이크에 다른 소리가 새어 들어오는 것을 줄일 때 써요.</p>';
        case 'dyn': return '<h5>Dyn — 컴프레서</h5><div class="xe-row">' + tg(p + 'dyn', 'COMP ON') + '</div>' + sl('THRESHOLD', p + 'dthr', 'thr') +
          '<div class="xe-row"><span class="xe-note">RATIO</span>' + [2, 3, 4, 10].map(function (r) { return '<button type="button" class="xe-b" data-ratio="' + r + '" aria-pressed="' + (m.ratio === r) + '">' + r + ':1</button>'; }).join('') + '</div>' +
          '<p>THRESHOLD 를 넘는 큰 소리를 RATIO 만큼 눌러서 크기를 고르게 해요.</p>';
        case 'eq': return '<h5>EQ — 4밴드</h5><div class="xe-row">' + tg(p + 'eq', 'EQ ON') + '</div>' + eqSvg(m) +
          EQB.map(function (b, k) { return sl(b[0] + ' ' + b[1], p + 'eqg.' + k, 'eqg', 'CH' + n + ' EQ ' + b[0]); }).join('') +
          '<p>입력 채널 EQ 는 4밴드예요. 노란 선이 지금 소리 모양이고, LOW CUT 을 켜면 왼쪽 끝이 내려가요.</p>';
        case 'sends': return '<h5>Sends — BUS 로 보내는 양</h5>' +
          BUSES.map(function (b, k) { return '<div class="xe-card"><b>BUS ' + (k + 1) + ' · ' + esc(b[0]) + ' <span class="xe-tag">' + b[1] + '</span></b>' + sl('SEND', p + 'send.' + k, 'fader', 'CH' + n + ' → BUS ' + (k + 1)) + '</div>'; }).join('') +
          '<p>모니터 BUS 1–3 은 PRE(페이더 앞), 방송·녹음 BUS 4 는 POST(페이더 뒤)로 보내요. BUS 5–16 은 이 교회 예시에서 쓰지 않아요.</p>';
        case 'main': return '<h5>Main — 메인 보내기 · 그룹</h5><div class="xe-row">' + tg(p + 'lr', 'MAIN LR') + '</div>' + sl('PAN', p + 'pan', 'pan') +
          '<div class="xe-card"><b>DCA</b><span>' + (DCAS.map(function (d, k) { return d[1].indexOf(n) >= 0 ? 'DCA ' + (k + 1) + ' ' + d[0] : ''; }).filter(Boolean).join(', ') || '없음') + '</span></div>' +
          '<div class="xe-card"><b>MUTE GROUP</b><span>' + (MGS.map(function (g, k) { return g[1].indexOf(n) >= 0 ? (k + 1) + ' ' + g[0] : ''; }).filter(Boolean).join(', ') || '없음') + '</span></div>';
        default: return '<h5>Home — CH ' + n + ' 한눈에</h5><div class="xe-grid">' +
          '<div class="xe-card"><b>CONFIG</b><span>GAIN ' + SC.gain.txt(m.gain) + '</span><span>48V ' + onoff(m.p48) + ' LOW CUT ' + onoff(m.lc) + '</span></div>' +
          '<div class="xe-card"><b>GATE · DYN</b><span>GATE ' + onoff(m.gate) + '</span><span>COMP ' + onoff(m.dyn) + ' ' + m.ratio + ':1</span></div>' +
          '<div class="xe-card"><b>EQ</b>' + eqSvg(m) + '</div>' +
          '<div class="xe-card"><b>SENDS</b>' + BUSES.map(function (b, k) { return '<span>' + (k + 1) + ' ' + esc(b[0]) + ' ' + fmt(m.send[k]) + '</span>'; }).join('') + '</div>' +
          '<div class="xe-card"><b>MAIN</b><span>LR ' + onoff(m.lr) + ' · PAN ' + SC.pan.txt(m.pan) + '</span><span>페이더 ' + fmt(m.fader) + ' dB</span></div></div>' +
          '<p class="xe-note">위 탭이나 왼쪽 채널 스트립의 제목을 누르면 그 화면이 열려요.</p>';
      }
    }
    function renderScr() {
      var h = '';
      if (S.page === 'home') {
        h = '<div class="xe-tabs" role="tablist" aria-label="채널 편집 탭">' + TABS.map(function (t) { return '<button type="button" class="xe-tab" role="tab" data-tab="' + t[0] + '" aria-selected="' + (S.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
          '<div class="xe-pgc">' + tabHtml(S.sel) + '</div>';
      } else if (S.page === 'meters') {
        h = '<div class="xe-pgc"><h5>METERS — 모든 채널 미터</h5><div class="xe-mtrs">' +
          CHS.map(function (c, i) { return '<div class="m"><div class="xe-vm" data-m="ch:' + (i + 1) + '"><i></i></div><span>' + (i + 1) + '<br>' + esc(c[0]) + '</span></div>'; }).join('') +
          BUSES.map(function (b, k) { return '<div class="m"><div class="xe-vm" data-m="bus:' + k + '"><i></i></div><span>BUS ' + (k + 1) + '<br>' + esc(b[0]) + '</span></div>'; }).join('') +
          '<div class="m"><div class="xe-vm" data-m="main"><i></i></div><span>MAIN<br>LR</span></div></div><p>소리가 어디서 막혔는지 찾을 때 먼저 여기서 미터를 봐요.</p></div>';
      } else if (S.page === 'mutegrp') {
        h = '<div class="xe-pgc"><h5>MUTE GRP — 뮤트 그룹 6개</h5><div class="xe-mg">' + MGS.map(function (g, k) { return '<button type="button" data-mg="' + k + '" aria-pressed="' + M.mg[k] + '"' + (g[1].length ? '' : ' disabled') + '><b>' + (k + 1) + ' · ' + esc(g[0]) + '</b><span>' + (g[1].length ? 'CH ' + g[1].join(', ') : '배정된 채널 없음') + '</span></button>'; }).join('') +
          '</div><p>버튼 하나로 여러 채널을 한꺼번에 끄고 켜요. 예: 설교 시작 전 「밴드」를 눌러 악기를 모두 꺼요.</p></div>';
      } else if (S.page === 'scenes') {
        h = '<div class="xe-pgc"><h5>SCENES — 씬 저장 · 불러오기</h5><div class="xe-scl" role="radiogroup" aria-label="씬 목록">' +
          [['01', '주일 1부 예배'], ['02', scenes['02'] ? '저장됨' : '(비어 있음)']].map(function (r) { return '<label><input type="radio" name="xeScene" value="' + r[0] + '"' + (sceneSel === r[0] ? ' checked' : '') + '>' + r[0] + ' · ' + esc(r[1]) + '</label>'; }).join('') +
          '</div><div class="xe-row"><button type="button" class="xe-b" data-scene="recall">GO (불러오기)</button><button type="button" class="xe-b" data-scene="save">SAVE (저장)</button></div>' +
          '<p>' + (S.dirty ? '불러온 뒤 바뀐 설정이 있어요. GO 를 누르면 고른 씬의 상태로 돌아가요.' : '지금은 불러온 씬과 같은 상태예요.') + '</p></div>';
      } else {
        var inf = INFO[S.page] || ['', ''];
        h = '<div class="xe-pgc"><h5>' + esc(inf[0]) + '</h5><p>' + esc(inf[1]) + '</p><p class="xe-note">이 실습에서는 이 페이지를 쓰지 않아요. HOME 으로 돌아가 채널을 편집하세요.</p><div class="xe-row"><button type="button" class="xe-b" data-page="home">HOME 으로</button></div></div>';
      }
      scr.innerHTML = h;
    }
    function strip(o) {
      return '<div class="xe-st' + (o.cls ? ' ' + o.cls : '') + '" style="--c:' + (o.color || '#475569') + '"><div class="xe-scrib"><span>' + o.no + '</span><b>' + esc(o.name) + '</b></div>' +
        (o.sel ? '<button type="button" class="xe-b" ' + o.sel + '>SEL</button>' : '<button type="button" class="xe-b" disabled>SEL</button>') +
        (o.solo || '') + (o.mute || '<button type="button" class="xe-b mute" disabled>MUTE</button>') +
        '<div class="xe-fw">' + (o.meter ? '<div class="xe-vm" data-m="' + o.meter + '"><i></i></div>' : '') + (o.fader || '<input type="range" class="xe-fd" disabled aria-label="' + esc(o.name) + ' (안 씀)">') + '</div>' + (o.val || '<b class="xe-v">—</b>') + '</div>';
    }
    function renderMix() {
      var B = [['in1', 'CH 1–8'], ['in2', 'CH 9–16'], ['bus', 'BUS 1–8'], ['dca', 'DCA 1–8']];
      banks.innerHTML = '<span class="lb">뱅크</span>' + B.map(function (b) { return '<button type="button" class="xe-bk" data-bank="' + b[0] + '" aria-pressed="' + (S.bank === b[0]) + '">' + b[1] + '</button>'; }).join('') +
        '<button type="button" class="xe-b sof" data-sof="1" aria-pressed="' + (S.sof >= 0) + '">SENDS ON FADER</button>' +
        (S.sof >= 0 ? '<span class="xe-sofbus" role="group" aria-label="보낼 BUS">' + BUSES.map(function (b, k) { return '<button type="button" class="xe-b" data-sofbus="' + k + '" aria-pressed="' + (S.sof === k) + '" title="' + esc(b[0]) + '">BUS ' + (k + 1) + '</button>'; }).join('') + '<span class="xe-tag sof">→ ' + esc(BUSES[S.sof][0]) + '</span></span>' : '');
      var h = '', i, k;
      if (S.bank === 'in1' || S.bank === 'in2') {
        for (i = 1; i <= 8; i++) {
          var n = (S.bank === 'in2' ? 8 : 0) + i, c = CHS[n - 1], fp = S.sof >= 0 ? 'ch.' + n + '.send.' + S.sof : 'ch.' + n + '.fader';
          h += strip({ cls: (S.sel === n ? 'sel' : '') + (S.sof >= 0 ? ' sofm' : ''), color: c[4], no: 'CH ' + String(n).padStart(2, '0'), name: c[0], meter: 'ch:' + n,
            sel: 'data-csel="' + n + '" aria-pressed="' + (S.sel === n) + '" aria-label="' + esc(c[0]) + ' SELECT"', solo: tg('ch.' + n + '.solo', 'SOLO', 'solo', c[0] + ' SOLO'), mute: tg('ch.' + n + '.mute', 'MUTE', 'mute', c[0] + ' MUTE'),
            fader: rng(fp, 'fader', c[0] + (S.sof >= 0 ? ' → BUS ' + (S.sof + 1) + ' 보내는 양' : ' 페이더'), 'xe-fd'), val: val(fp, 'fader') });
        }
      } else if (S.bank === 'bus') {
        for (k = 0; k < 8; k++) {
          if (k >= 4) { h += strip({ cls: 'off', no: 'BUS ' + (k + 1), name: '(안 씀)' }); continue; }
          h += strip({ cls: S.sof === k ? 'sel' : '', color: '#f87171', no: 'BUS ' + (k + 1), name: BUSES[k][0], meter: 'bus:' + k,
            sel: 'data-bsel="' + k + '" aria-pressed="' + (S.sof === k) + '" aria-label="BUS ' + (k + 1) + ' ' + esc(BUSES[k][0]) + ' SELECT"', mute: tg('busMute.' + k, 'MUTE', 'mute', 'BUS ' + (k + 1) + ' MUTE'),
            fader: rng('bus.' + k, 'fader', 'BUS ' + (k + 1) + ' ' + BUSES[k][0] + ' 페이더', 'xe-fd'), val: val('bus.' + k, 'fader') });
        }
      } else {
        for (k = 0; k < 8; k++) {
          if (k >= 4) { h += strip({ cls: 'off dca', no: 'DCA ' + (k + 1), name: '(안 씀)' }); continue; }
          h += strip({ cls: 'dca', color: '#a78bfa', no: 'DCA ' + (k + 1), name: DCAS[k][0], mute: tg('dcaMute.' + k, 'MUTE', 'mute', 'DCA ' + (k + 1) + ' MUTE'),
            fader: rng('dca.' + k, 'fader', 'DCA ' + (k + 1) + ' ' + DCAS[k][0] + ' 페이더', 'xe-fd'), val: val('dca.' + k, 'fader') });
        }
      }
      h += strip({ cls: 'main', color: '#fca5a5', no: 'MAIN', name: 'LR', meter: 'main', mute: tg('mainMute', 'MUTE', 'mute', 'MAIN LR MUTE'), fader: rng('main', 'fader', 'MAIN LR 페이더', 'xe-fd'), val: val('main', 'fader') });
      faders.innerHTML = h;
    }
    function lv(d) { return !isFinite(d) || d < -60 ? '<b class="bad">소리 없음</b>' : '<b class="' + (d > 0 ? 'warn' : '') + '">' + fmt(d) + ' dB</b>'; }
    function renderRead() {
      var inn = chIn(S.sel);
      read.innerHTML = '<span>지금 상태 · 교육용 근사</span><span>CH ' + S.sel + ' 입력' + (isFinite(inn) ? '<b>' + fmt(inn) + ' dBFS</b>' : '<b class="bad">신호 없음</b>') + '</span>' +
        '<span>메인(회중석)' + lv(mainLv()) + '</span>' + BUSES.map(function (b, k) { return '<span>BUS ' + (k + 1) + ' ' + esc(b[0]) + lv(busLv(k)) + '</span>'; }).join('') +
        '<span>DCA 1 악기<b>' + fmt(M.dca[0]) + ' dB</b></span>';
      scn.textContent = sceneSel === '01' || !scenes['02'] ? '01 · 주일 1부 예배' : '02 · 저장한 씬'; scn.classList.toggle('dirty', S.dirty);
    }
    function render() {
      el.querySelectorAll('[data-page]').forEach(function (b) { if (b.classList.contains('xe-pg')) b.setAttribute('aria-pressed', String(b.getAttribute('data-page') === S.page)); });
      renderCs(); renderScr(); renderMix(); judge(); renderRead();
    }
    // 값만 새로 고침 (끌고 있는 슬라이더는 그대로 두어 드래그가 끊기지 않게)
    function refresh(active) {
      el.querySelectorAll('[data-v]').forEach(function (b) { b.textContent = SC[b.getAttribute('data-sc')].txt(get(b.getAttribute('data-v'))); });
      el.querySelectorAll('input[data-k]').forEach(function (r) { if (r !== active) r.value = SC[r.getAttribute('data-sc')].to(get(r.getAttribute('data-k'))); });
      el.querySelectorAll('[data-tg]').forEach(function (b) { b.setAttribute('aria-pressed', String(!!get(b.getAttribute('data-tg')))); });
      var svg = el.querySelectorAll('.xe-eqsvg'); if (svg.length) svg.forEach(function (s) { s.outerHTML = eqSvg(M.ch[S.sel - 1]); });
      judge(); renderRead();
    }
    function changed() { S.dirty = true; }
    function mtrLv(key) {
      var a = key.split(':');
      if (a[0] === 'in' || a[0] === 'ch') return chIn(+a[1]) - (M.ch[+a[1] - 1].mute && a[0] === 'ch' ? 200 : 0);
      if (a[0] === 'bus') return busLv(+a[1]) + 12;
      return mainLv() + 12;
    }
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick); S.frame++;
      if (S.frame % 2) return;
      el.querySelectorAll('[data-m]').forEach(function (m, i) {
        var pk = mtrLv(m.getAttribute('data-m')), env = 0.5 + 0.5 * Math.abs(Math.sin(S.frame / (19 + i % 5))) * Math.abs(Math.sin(S.frame / (6.1 + i % 3)));
        var now = isFinite(pk) ? pk + 20 * Math.log10(env) : -100, pos = function (d) { return clamp((d + 60) / 60 * 100, 0, 100); };
        m.style.setProperty('--cut', (100 - pos(now)) + '%'); if (m.classList.contains('xe-hm')) m.style.setProperty('--pk', pos(isFinite(pk) ? pk : -100) + '%');
      });
    }
    function onInput(e) {
      var r = e.target, p = r.getAttribute && r.getAttribute('data-k'); if (!p) return;
      var v = SC[r.getAttribute('data-sc')].from(+r.value); put(p, v); changed();
      if (/^ch\.\d+\.send\./.test(p) && S.sof >= 0) S.sawSof = true;
      refresh(r);
    }
    function onClick(e) {
      var b = e.target.closest('button, label'); if (!b || !el.contains(b) || b.disabled) return; var a;
      if ((a = b.getAttribute('data-page'))) { S.page = a; if (a === 'home') S.tab = S.tab || 'home'; render(); return; }
      if ((a = b.getAttribute('data-tab'))) { S.page = 'home'; S.tab = a; render(); return; }
      if ((a = b.getAttribute('data-bank'))) { S.bank = a; render(); return; }
      if (b.getAttribute('data-sof')) { S.sof = S.sof >= 0 ? -1 : 0; render(); return; }
      if ((a = b.getAttribute('data-sofbus')) != null) { S.sof = +a; render(); return; }
      if ((a = b.getAttribute('data-csel'))) { S.sel = +a; render(); return; }
      if ((a = b.getAttribute('data-bsel')) != null) { if (S.sof >= 0) S.sof = +a; render(); return; }
      if ((a = b.getAttribute('data-tg'))) { put(a, !get(a)); changed(); if (/\.(lc|p48|gate|dyn|eq|lr|phase)$/.test(a) && S.page === 'home' && S.tab === 'home') renderScr(); refresh(); return; }
      if ((a = b.getAttribute('data-ratio'))) { M.ch[S.sel - 1].ratio = +a; changed(); renderScr(); refresh(); return; }
      if ((a = b.getAttribute('data-mg')) != null) { M.mg[+a] = !M.mg[+a]; changed(); renderScr(); refresh(); return; }
      if ((a = b.getAttribute('data-scene'))) {
        if (a === 'save') { scenes[sceneSel] = clone(M); S.dirty = false; render(); return; }
        if (a === 'recall' && scenes[sceneSel]) { var was = S.dirty; M = clone(scenes[sceneSel]); S.dirty = false; if (was && sceneSel === '01') hit('scene'); render(); }
      }
    }
    function onChange(e) { if (e.target.name === 'xeScene') { sceneSel = e.target.value; renderScr(); renderRead(); } }
    el.addEventListener('input', onInput); el.addEventListener('click', onClick); el.addEventListener('change', onChange);
    render(); tick();

    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); el.removeEventListener('input', onInput); el.removeEventListener('click', onClick); el.removeEventListener('change', onChange); el.innerHTML = ''; },
      state: function () {
        var c = M.ch[13];
        return { page: S.page, tab: S.tab, bank: S.bank, sel: S.sel, sof: S.sof, dirty: S.dirty, ready: true, audio: false,
          ch14: { p48: c.p48, gain: c.gain, input: fin(chIn(14)), lc: c.lc, lcf: c.lcf }, ch1: { fader: fin(M.ch[0].fader), send1: fin(M.ch[0].send[0]), out: fin(chOut(1)) },
          dca: M.dca.map(fin), main: fin(mainLv()), bus: [0, 1, 2, 3].map(function (k) { return fin(busLv(k)); }), mg: M.mg.slice(), done: Object.keys(S.done) };
      },
      // set: 테스트·디버그용 (page, tab, bank, sel, sof, path:{ 'ch.14.gain': 30, … }, scene:'save'|'recall')
      set: function (o) {
        o = o || {};
        ['page', 'tab', 'bank', 'sel', 'sof'].forEach(function (k) { if (o[k] != null) S[k] = o[k]; });
        if (o.path) { Object.keys(o.path).forEach(function (p) { put(p, o.path[p]); if (/^ch\.\d+\.send\./.test(p) && S.sof >= 0) S.sawSof = true; }); changed(); }
        render();
        if (o.scene) { S.page = 'scenes'; render(); var b = q('[data-scene=' + o.scene + ']'); if (b) b.click(); }
        return this.state();
      }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.x32Edit = x32Edit;
})();
