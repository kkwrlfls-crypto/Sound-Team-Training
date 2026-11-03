/* =============================================================================
   03-2 디지털 콘솔 (Behringer X32 기준) — 2026-11-03
   - STA_MODULES['console-digital'] (모듈 데이터) + STAVisuals.x32* (그림 6개) + STASims.x32Desk (가상 X32 조작면)
   - 03-1 아날로그 콘솔(console.js)과 같은 구성: 핵심 개념 · 이론(그림 + 개념 체크) · 실습(자동 확인 과제 5개) · 확인 문제 · 관련 미션 · 심화 학습
   - 사실(채널·버스·DCA·씬 수 등)은 제조사 자료 기준, 실습 화면은 교육용으로 단순화(실제 X32 는 입력 페이더 16개 · 버스 쪽 8개)
   ============================================================================= */
(function () {
  'use strict';
  var V = window.STAVisuals = window.STAVisuals || {};
  var C = { ink: '#0f1f33', sub: '#51627a', line: '#cbd5e1', bg: '#f8fafc', blue: '#2563eb', teal: '#0e7490', orange: '#ea580c', purple: '#7c3aed', red: '#dc2626', green: '#059669', amber: '#d97706' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 500) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '">' + s + '</text>'; }
  function rect(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 8 : r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.5"' : '') + '/>'; }
  function arrow(x1, y1, x2, y2, col) { var a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 7 * Math.cos(a), hy = y2 - 7 * Math.sin(a); return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="2.4" fill="none"/><path d="M' + x2 + ' ' + y2 + 'L' + (hx - 4 * Math.sin(a)) + ' ' + (hy + 4 * Math.cos(a)) + 'L' + (hx + 4 * Math.sin(a)) + ' ' + (hy - 4 * Math.cos(a)) + 'Z" fill="' + col + '"/>'; }
  function faders(x, y, n, gap, col, h) { var s = ''; for (var i = 0; i < n; i++) { var fx = x + i * gap; s += '<path d="M' + fx + ' ' + y + 'V' + (y + (h || 46)) + '" stroke="#475569" stroke-width="2"/>' + rect(fx - 5, y + 12 + (i * 7) % 20, 10, 7, col || '#e5e7eb', null, 2); } return s; }

  /* ---------------------------------------------------------------- 그림 1: 조작면 구역 */
  V.x32Surface = function () {
    var s = rect(4, 4, 592, 214, '#1f2933', '#0b0f14', 12) + t(14, 22, 'X32 조작면 — 구역별로 단순화한 그림 (실제 배치와 크기는 다를 수 있어요)', { size: 10.5, fill: '#cbd5e1', anchor: 'start' });
    // 입력 구역
    s += rect(14, 34, 236, 172, 'rgba(34,211,238,.10)', '#22d3ee') + t(132, 52, '① 입력 채널 구역', { size: 11.5, weight: 800, fill: '#a5f3fc' });
    s += rect(22, 60, 36, 74, '#334155', null, 4) + t(40, 76, '레이어', { size: 8.5, fill: '#e2e8f0', weight: 700 }) + [0, 1, 2, 3].map(function (i) { return rect(27, 82 + i * 12, 26, 8, i === 0 ? '#fbbf24' : '#64748b', null, 2); }).join('');
    s += faders(72, 70, 16, 11, '#e5e7eb', 70) + t(155, 160, '페이더 16개 + SELECT · MUTE · 미터', { size: 9.5, fill: '#cbd5e1' }) + t(132, 196, '레이어로 1–16 · 17–32 · AUX · FX RTN 을 바꿔 불러요', { size: 9.5, fill: '#94a3b8' });
    // 가운데: 화면 + 채널 스트립
    s += rect(262, 34, 170, 172, 'rgba(251,191,36,.10)', '#fbbf24') + t(347, 52, '② 화면 · 채널 스트립', { size: 11.5, weight: 800, fill: '#fde68a' });
    s += rect(278, 62, 138, 62, '#0b1220', '#475569', 4) + t(347, 88, '컬러 화면', { size: 11, fill: '#e2e8f0', weight: 700 }) + t(347, 106, '고른 채널의 자세한 설정', { size: 9, fill: '#94a3b8' });
    [0, 1, 2, 3, 4, 5].forEach(function (i) { s += '<circle cx="' + (288 + i * 23) + '" cy="146" r="7" fill="#e5e7eb"/>'; });
    s += t(347, 170, 'GAIN · GATE · COMP · EQ 노브', { size: 9.5, fill: '#cbd5e1' }) + t(347, 186, 'SELECT 한 채널 하나만 조절', { size: 9.5, fill: '#fde68a', weight: 700 });
    // 버스·DCA 구역
    s += rect(444, 34, 104, 172, 'rgba(167,139,250,.12)', '#a78bfa') + t(496, 52, '③ 버스·DCA', { size: 11.5, weight: 800, fill: '#ddd6fe' }) + faders(456, 70, 8, 11, '#e5e7eb', 70) + t(496, 160, '페이더 8개', { size: 9.5, fill: '#cbd5e1' }) + t(496, 178, 'DCA · BUS · MATRIX', { size: 9, fill: '#94a3b8' }) + t(496, 192, '레이어', { size: 9, fill: '#94a3b8' });
    // 메인
    s += rect(556, 34, 32, 172, 'rgba(248,113,113,.14)', '#f87171') + t(572, 52, '④', { size: 11.5, weight: 800, fill: '#fecaca' }) + faders(572, 70, 1, 0, '#ef4444', 70) + t(572, 160, 'MAIN', { size: 9, fill: '#fecaca', weight: 800 }) + t(572, 172, 'LR', { size: 9, fill: '#fecaca', weight: 800 });
    return svg(600, 222, s, 'X32 조작면의 네 구역');
  };

  /* ---------------------------------------------------------------- 그림 2: 레이어 */
  V.x32Layers = function () {
    var s = '', layers = [['CH 1–16', '입력 채널 1~16', '#0e7490'], ['CH 17–32', '입력 채널 17~32', '#0369a1'], ['AUX IN · USB', '보조 입력 · USB 재생', '#4f46e5'], ['FX RTN', '이펙트 돌려받기', '#7c3aed'], ['BUS MASTER', '버스 1~16 마스터', '#9333ea']];
    layers.forEach(function (L, i) {
      var y = 26 + i * 34, on = i === 1;
      s += rect(12, y, 108, 26, on ? '#fbbf24' : '#e2e8f0', on ? '#b45309' : '#94a3b8', 6) + t(66, y + 17, L[0], { size: 11, weight: 800, fill: on ? '#111827' : C.sub });
    });
    s += t(66, 16, '레이어 버튼', { size: 11, weight: 800 });
    s += arrow(126, 77, 176, 77, '#b45309');
    s += rect(184, 22, 404, 170, '#1f2933', '#0b0f14', 10);
    for (var i = 0; i < 16; i++) { var x = 202 + i * 24; s += '<path d="M' + x + ' 64V160" stroke="#475569" stroke-width="2"/>' + rect(x - 7, 92 + (i * 13) % 40, 14, 9, '#e5e7eb', null, 2) + t(x, 54, String(17 + i), { size: 9.5, fill: '#fde68a', weight: 700 }); }
    s += t(386, 40, '같은 페이더 16개가 지금은 「CH 17–32」를 보여 줘요', { size: 11.5, fill: '#e2e8f0', weight: 700 }) + t(386, 182, '화면·채널 이름표로 지금 레이어를 늘 확인해요', { size: 10, fill: '#94a3b8' });
    return svg(600, 200, s, 'X32 레이어 — 같은 페이더로 다른 채널을 불러오기');
  };

  /* ---------------------------------------------------------------- 그림 3: 채널 처리 순서 */
  V.x32Chain = function () {
    var s = '', blocks = [['입력', '프리앰프', 'GAIN · +48V', C.teal], ['LOW CUT', '(HPF)', '저음 정리', C.teal], ['GATE', '게이트', '작은 잡음 닫기', C.purple], ['EQ', '4밴드', '음색', C.blue], ['DYN', '컴프레서', '크기 고르게', C.purple], ['MUTE', '', '끄고 켜기', C.amber], ['페이더', '', '섞는 양', C.ink]];
    blocks.forEach(function (b, i) {
      var x = 8 + i * 84;
      s += rect(x, 40, 72, 62, '#fff', b[3], 8) + t(x + 36, 62, b[0], { size: 12, weight: 800, fill: b[3] }) + (b[1] ? t(x + 36, 77, b[1], { size: 9.5, fill: C.sub }) : '') + t(x + 36, 93, b[2], { size: 9, fill: C.sub });
      if (i < blocks.length - 1) s += arrow(x + 72, 71, x + 84, 71, '#94a3b8');
    });
    s += t(300, 22, '한 채널 안에서 소리가 지나가는 길 (기본 설정 기준 · 교육용 단순화)', { size: 11, fill: C.sub });
    // 보내는 지점
    s += '<path d="M380 102V140H560" stroke="' + C.orange + '" stroke-width="2.4" fill="none" stroke-dasharray="5 4"/>' + t(470, 134, 'PRE: 페이더 앞에서 BUS 로 (모니터)', { size: 10, fill: C.orange, weight: 700 });
    s += '<path d="M580 102V170H560" stroke="' + C.purple + '" stroke-width="2.4" fill="none" stroke-dasharray="5 4"/>' + t(470, 166, 'POST: 페이더 뒤에서 BUS 로 (이펙트)', { size: 10, fill: C.purple, weight: 700 });
    s += t(150, 140, 'EQ·컴프 순서, 보내는 지점은', { size: 10, fill: C.sub }) + t(150, 155, '화면에서 바꿀 수 있어요', { size: 10, fill: C.sub });
    return svg(600, 180, s, 'X32 채널 안의 처리 순서');
  };

  /* ---------------------------------------------------------------- 그림 4: Sends on Fader */
  V.x32Sof = function () {
    var s = '';
    function desk(x, title, sub, faderCol, vals, tag) {
      var b = rect(x, 28, 270, 150, '#1f2933', '#0b0f14', 10) + t(x + 135, 18, title, { size: 12, weight: 800 }) + t(x + 135, 172, sub, { size: 10, fill: '#cbd5e1' });
      vals.forEach(function (v, i) { var fx = x + 30 + i * 30; b += '<path d="M' + fx + ' 48V140" stroke="#475569" stroke-width="2"/>' + rect(fx - 8, 48 + v, 16, 10, faderCol, null, 2) + t(fx, 156, 'CH' + (i + 1), { size: 8.5, fill: '#94a3b8' }); });
      if (tag) b += rect(x + 200, 40, 62, 22, '#fbbf24', null, 5) + t(x + 231, 55, tag, { size: 9.5, weight: 800, fill: '#111827' });
      return b;
    }
    s += desk(10, '평소: 페이더 = 메인(LR)으로 섞는 양', '회중석 메인 믹스', '#e5e7eb', [30, 40, 26, 50, 34, 60, 44], '');
    s += desk(320, 'SENDS ON FADER + BUS 1 선택', '페이더 = BUS 1(인도자 모니터)로 보내는 양', '#fbbf24', [20, 70, 74, 62, 78, 80, 80], 'BUS 1');
    s += arrow(284, 104, 316, 104, C.orange);
    return svg(600, 186, s, 'Sends on Fader — 같은 페이더로 모니터 믹스 만들기');
  };

  /* ---------------------------------------------------------------- 그림 5: DCA · 뮤트 그룹 */
  V.x32Dca = function () {
    var s = '';
    s += rect(8, 22, 284, 168, '#f5f3ff', '#a78bfa', 10) + t(150, 42, 'DCA — 여러 페이더의 리모컨', { size: 12, weight: 800, fill: C.purple });
    ['기타', '건반', '베이스', '드럼'].forEach(function (n, i) { var x = 40 + i * 50; s += rect(x - 18, 56, 36, 22, '#fff', '#c4b5fd', 5) + t(x, 71, n, { size: 9.5, weight: 700 }) + '<path d="M' + x + ' 78V102" stroke="#c4b5fd" stroke-dasharray="3 3"/>'; });
    s += rect(30, 102, 180, 28, C.purple, null, 6) + t(120, 121, 'DCA 1 「악기」 −10 dB', { size: 11, weight: 800, fill: '#fff' });
    s += t(150, 152, '채널 페이더는 그대로, 실제로 나가는 크기만 함께 줄어요', { size: 9.5, fill: C.sub }) + t(150, 168, '소리를 한 버스로 모으지는 않아요 (GROUP 과 다른 점)', { size: 9.5, fill: C.sub });
    s += rect(306, 22, 286, 168, '#fff7ed', '#fdba74', 10) + t(449, 42, '뮤트 그룹 — 여러 채널 한 번에 끄기', { size: 12, weight: 800, fill: C.orange });
    ['싱어 1', '싱어 2', '싱어 3', '성가대'].forEach(function (n, i) { var x = 340 + i * 54; s += rect(x - 22, 58, 44, 22, '#fff', '#fdba74', 5) + t(x, 73, n, { size: 9.5, weight: 700 }); });
    s += rect(354, 98, 190, 30, C.orange, null, 6) + t(449, 118, 'MUTE GROUP 1 누름 → 4채널 꺼짐', { size: 11, weight: 800, fill: '#fff' });
    s += t(449, 152, '설교 시간에 찬양팀 마이크를 한 번에 끄고', { size: 9.5, fill: C.sub }) + t(449, 168, '다시 한 번 눌러 한꺼번에 켜요', { size: 9.5, fill: C.sub });
    return svg(600, 198, s, 'DCA 와 뮤트 그룹');
  };

  /* ---------------------------------------------------------------- 그림 6: 씬 · 패치 */
  V.x32Scene = function () {
    var s = '';
    s += rect(8, 22, 300, 170, '#eff6ff', '#93c5fd', 10) + t(158, 42, '씬(Scene) — 설정 전체를 저장·불러오기', { size: 12, weight: 800, fill: C.blue });
    [['01', '주일 1부 예배'], ['02', '주일 2부 예배'], ['03', '수요 예배']].forEach(function (r, i) { var y = 54 + i * 28; s += rect(24, y, 268, 22, i === 0 ? '#dbeafe' : '#fff', '#bfdbfe', 5) + t(36, y + 15, r[0], { size: 10, weight: 800, anchor: 'start', fill: C.blue }) + t(60, y + 15, r[1], { size: 10.5, anchor: 'start' }); });
    s += rect(24, 144, 120, 30, C.blue, null, 6) + t(84, 163, 'RECALL (불러오기)', { size: 10.5, weight: 800, fill: '#fff' }) + rect(156, 144, 136, 30, '#fff', C.blue, 6) + t(224, 163, 'SAVE (저장)', { size: 10.5, weight: 800, fill: C.blue });
    s += rect(322, 22, 270, 170, '#f0fdfa', '#5eead4', 10) + t(457, 42, '패치 — 어디서 들어와 어디로 나갈지', { size: 12, weight: 800, fill: C.teal });
    [['로컬 입력 1–32', '채널 1–32'], ['AES50 (스테이지박스)', '채널 1–32'], ['MAIN LR', '출력 15·16'], ['BUS 1', '출력 1']].forEach(function (r, i) { var y = 56 + i * 32; s += rect(334, y, 104, 24, '#fff', '#99f6e4', 5) + t(386, y + 16, r[0], { size: 9, weight: 700 }) + arrow(440, y + 12, 470, y + 12, C.teal) + rect(472, y, 104, 24, '#fff', '#99f6e4', 5) + t(524, y + 16, r[1], { size: 9, weight: 700 }); });
    s += t(457, 186, '예시 배정이에요 · 실제 연결은 교회 설정을 따라요', { size: 9, fill: C.sub });
    return svg(600, 198, s, '씬과 패치');
  };

  /* =========================================================================== 실습: 가상 X32 조작면 */
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

  // 교회 예배 예시 채널 (src = GAIN 0 dB 일 때 소리의 가장 큰 순간 입력 레벨 dBFS, 교육용 가정)
  var CHS = [
    ['인도자 보컬', 'SM58', -48, 0], ['싱어 1', 'SM58', -50, 0], ['싱어 2', 'SM58', -50, 0], ['어쿠스틱 기타', 'DI', -30, 0],
    ['건반 L', 'DI', -20, 0], ['건반 R', 'DI', -20, 0], ['베이스', 'DI', -24, 0], ['킥', '드럼 마이크', -38, 0],
    ['스네어', '드럼 마이크', -36, 0], ['오버헤드', '콘덴서', -44, 1], ['일렉 기타', '앰프 마이크', -40, 0], ['성가대 L', '콘덴서', -46, 1],
    ['성가대 R', '콘덴서', -46, 1], ['설교 (구즈넥)', '콘덴서', -45, 1], ['사회 (무선)', '무선 수신기', -26, 0], ['노트북 영상', 'USB·라인', -18, 0]
  ];
  var DCAS = [['악기', [4, 5, 6, 7, 8, 9, 10, 11]], ['보컬', [1, 2, 3]], ['설교·사회', [14, 15]], ['성가대', [12, 13]]];
  var BUSES = ['인도자 모니터', '싱어 모니터', '드럼 모니터', '방송·녹음'];

  function injectCss() {
    if (document.getElementById('sta-mod-x32-css')) return;
    var st = document.createElement('style'); st.id = 'sta-mod-x32-css';
    st.textContent = [
      '.sim-x32{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:12px;align-items:start;min-width:0}',
      '.sim-x32-desk{display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:12px;background:linear-gradient(180deg,#2b313a,#1a1f26);border:1px solid #0f1215;color:#e5e7eb;min-width:0}',
      '.sim-x32-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:10px}',
      '.sim-x32-screen{border-radius:8px;background:#0b1220;border:1px solid #334155;padding:10px;min-width:0}',
      '.sim-x32-screen h5{margin:0 0 4px;font-size:.72rem;color:#93c5fd;letter-spacing:.04em}',
      '.sim-x32-screen .nm{font-size:1rem;font-weight:800;color:#f8fafc}',
      '.sim-x32-screen .tg{display:inline-block;margin-top:6px;padding:2px 8px;border-radius:999px;background:#fbbf24;color:#111827;font-size:.7rem;font-weight:800}',
      '.sim-x32-scenes{display:grid;gap:4px;margin-top:8px}',
      '.sim-x32-scenes label{display:flex;gap:6px;align-items:center;font-size:.74rem;padding:3px 6px;border-radius:6px;background:rgba(255,255,255,.05);cursor:pointer}',
      '.sim-x32-scenes label:has(input:checked){background:rgba(147,197,253,.2)}',
      '.sim-x32-sbtns{display:flex;gap:6px;margin-top:6px}',
      '.sim-x32-strip{border-radius:8px;background:rgba(255,255,255,.04);border:1px solid #334155;padding:10px;display:grid;gap:8px;min-width:0}',
      '.sim-x32-strip h5{margin:0;font-size:.72rem;color:#fde68a;letter-spacing:.04em}',
      '.sim-x32-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
      '.sim-x32-gain{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px;align-items:center;font-size:.74rem}',
      '.sim-x32-gain input{width:100%;accent-color:#fbbf24}',
      '.sim-x32-in{position:relative;height:12px;border-radius:6px;background:linear-gradient(90deg,#14532d 0 60%,#713f12 60% 85%,#7f1d1d 85% 100%);overflow:hidden}',
      '.sim-x32-in i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#22c55e 0,#22c55e 60%,#facc15 60%,#facc15 85%,#ef4444 85%);clip-path:inset(0 var(--cut,100%) 0 0)}',
      '.sim-x32-in b{position:absolute;top:-1px;width:2px;height:14px;background:#fff;left:var(--pk,0%)}',
      '.sim-x32-scale{display:flex;justify-content:space-between;font-size:.6rem;color:#94a3b8}',
      '.sim-x32-btn{min-width:52px;padding:6px 8px;border-radius:6px;border:1px solid #111;background:#4b5563;color:#e5e7eb;font:inherit;font-size:.72rem;font-weight:800;cursor:pointer;box-shadow:inset 0 -2px 0 rgba(0,0,0,.35)}',
      '.sim-x32-btn[aria-pressed="true"]{background:#fbbf24;color:#111827}',
      '.sim-x32-btn.red[aria-pressed="true"]{background:#ef4444;color:#fff}',
      '.sim-x32-btn.sof[aria-pressed="true"]{background:#f97316;color:#111827;box-shadow:0 0 10px rgba(249,115,22,.6)}',
      '.sim-x32-bot{display:grid;grid-template-columns:auto minmax(0,1fr) auto minmax(0,auto) auto;gap:8px;align-items:stretch;overflow-x:auto;padding-bottom:4px}',
      '.sim-x32-layers{display:flex;flex-direction:column;gap:5px;justify-content:flex-start}',
      '.sim-x32-layers .sim-x32-btn{min-width:74px;font-size:.68rem;padding:6px 4px}',
      '.sim-x32-fbank{display:flex;gap:4px}',
      '.sim-x32-fs{display:flex;flex-direction:column;align-items:center;gap:4px;width:52px;padding:5px 2px;border-radius:7px;background:rgba(255,255,255,.04)}',
      '.sim-x32-fs.sel{background:rgba(251,191,36,.16);outline:1px solid rgba(251,191,36,.55)}',
      '.sim-x32-fs.sofm{background:rgba(249,115,22,.14)}',
      '.sim-x32-fs .nm{font-size:.62rem;font-weight:800;text-align:center;line-height:1.15;min-height:2.3em;color:#f8fafc}',
      '.sim-x32-fs .no{font-size:.6rem;color:#94a3b8}',
      '.sim-x32-fs .sim-x32-btn{min-width:44px;padding:3px 0;font-size:.62rem}',
      '.sim-x32-fs input[type=range]{writing-mode:vertical-lr;direction:rtl;width:24px;height:120px;accent-color:#e5e7eb}',
      '.sim-x32-fs.sofm input[type=range]{accent-color:#f97316}',
      '.sim-x32-fs b{font-size:.62rem;color:#fde68a;font-variant-numeric:tabular-nums}',
      '.sim-x32-fs .dca{font-size:.56rem;color:#c4b5fd}',
      '.sim-x32-main{display:flex;flex-direction:column;align-items:center;gap:4px;width:56px;padding:5px 2px;border-radius:7px;background:rgba(239,68,68,.1)}',
      '.sim-x32-main .nm{font-size:.66rem;font-weight:800;color:#fecaca}',
      '.sim-x32-main input[type=range]{writing-mode:vertical-lr;direction:rtl;width:24px;height:120px;accent-color:#ef4444}',
      '.sim-x32-main b{font-size:.62rem;color:#fde68a}',
      '.sim-x32-note{font-size:.66rem;color:#94a3b8;margin:0}',
      '@media (max-width:900px){.sim-x32{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:640px){.sim-x32-top{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function x32Desk(el, opts) {
    opts = opts || {}; injectCss();
    function initState() {
      return {
        ch: CHS.map(function (c, i) {
          var n = i + 1, gainDef = { 1: 36, 2: 36, 3: 36, 4: 18, 5: 8, 6: 8, 7: 12, 8: 26, 9: 24, 10: 30, 11: 26, 12: 32, 13: 32, 14: 20, 15: 12, 16: 6 }[n];
          return { gain: gainDef, p48: c[3] && n !== 14, lc: [1, 2, 3, 12, 13, 14, 15].indexOf(n) >= 0, gate: [8, 9].indexOf(n) >= 0, comp: [1, 2, 3, 7, 14].indexOf(n) >= 0, mute: false,
            fader: n === 14 ? 0 : n === 16 ? -60 : -5, send: [n === 1 ? -60 : n <= 3 ? -8 : -15, n <= 3 ? -4 : -18, n >= 7 && n <= 10 ? -6 : -60, -10] };
        }),
        dca: [0, 0, 0, 0], dcaMute: [false, false, false, false], bus: [0, 0, 0, 0], busMute: [false, false, false, false], main: 0, mainMute: false
      };
    }
    var M = initState(), scenes = { '01': JSON.stringify(M), '02': null }, sceneSel = '01';
    var S = { layer: 0, right: 'dca', sel: 1, sof: -1, dirty: false, sawSof: false, done: {}, frame: 0 };
    var alive = true, raf = 0;

    function chIn(n) { var c = CHS[n - 1], m = M.ch[n - 1]; if (c[3] && !m.p48) return NINF; return c[2] + m.gain; }   // 입력 미터(dBFS, 가장 큰 순간)
    function chOut(n) { var m = M.ch[n - 1], d = 0; if (m.mute) return NINF; DCAS.forEach(function (dc, k) { if (dc[1].indexOf(n) >= 0) d += M.dcaMute[k] ? NINF : M.dca[k]; }); var lv = chIn(n) + m.fader + d; return isFinite(lv) ? lv : NINF; }
    function mainLv() { if (M.mainMute) return NINF; var arr = []; for (var n = 1; n <= 16; n++) arr.push(chOut(n) - 10); return psum(arr) + M.main; }   // 여러 채널 합 (교육용)
    function busLv(b) { if (M.busMute[b]) return NINF; var arr = []; for (var n = 1; n <= 16; n++) { var m = M.ch[n - 1]; if (m.mute) continue; arr.push(chIn(n) + m.send[b] - 6); } return psum(arr) + M.bus[b]; }   // 모니터 BUS 는 PRE(페이더 앞)
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function judge() {
      var c14 = M.ch[13], in14 = chIn(14);
      if (S.sel === 14 && c14.p48) hit('p48');
      if (S.sel === 14 && c14.p48 && in14 >= -18 && in14 <= -6) hit('gain');
      if (S.sof === 0 && M.ch[0].send[0] >= -10 && S.sawSof) hit('sof');
      if (M.dca[0] <= -10 && !M.dcaMute[0]) hit('dca');
    }

    var q = function (s) { return el.querySelector(s); };
    el.innerHTML = '<div class="sim-x32">' +
      '<div class="sim-x32-desk" aria-label="가상 X32 조작면 (교육용 단순화)">' +
        '<div class="sim-x32-top">' +
          '<div class="sim-x32-screen" data-role="screen"></div>' +
          '<div class="sim-x32-strip" data-role="strip"></div>' +
        '</div>' +
        '<div class="sim-x32-bot">' +
          '<div class="sim-x32-layers" role="group" aria-label="입력 레이어"><span class="sim-x32-note">입력 레이어</span>' +
            '<button type="button" class="sim-x32-btn" data-layer="0" aria-pressed="true">CH 1–8</button><button type="button" class="sim-x32-btn" data-layer="1" aria-pressed="false">CH 9–16</button></div>' +
          '<div class="sim-x32-fbank" data-role="inbank"></div>' +
          '<div class="sim-x32-layers" role="group" aria-label="버스 쪽 레이어"><span class="sim-x32-note">버스 쪽 레이어</span>' +
            '<button type="button" class="sim-x32-btn" data-right="dca" aria-pressed="true">DCA 1–4</button><button type="button" class="sim-x32-btn" data-right="bus" aria-pressed="false">BUS 1–4</button>' +
            '<button type="button" class="sim-x32-btn sof" data-sof="1" aria-pressed="false">SENDS ON FADER</button></div>' +
          '<div class="sim-x32-fbank" data-role="rbank"></div>' +
          '<div class="sim-x32-main"><span class="nm">MAIN LR</span><button type="button" class="sim-x32-btn red" data-mmute="1" aria-pressed="false">MUTE</button><input type="range" min="0" max="1000" step="1" data-main="1" aria-label="MAIN LR 페이더"><b data-o="main"></b></div>' +
        '</div>' +
        '<p class="sim-x32-note">실제 X32 는 입력 페이더 16개 · 버스 쪽 8개이고 레이어가 더 많아요. 여기서는 8개 · 4개로 줄였어요.</p>' +
      '</div>' +
      '<div class="sim-side"><div class="sim-box sim-read" data-role="read"></div></div>' +
    '</div>';
    var screen = q('[data-role=screen]'), strip = q('[data-role=strip]'), inbank = q('[data-role=inbank]'), rbank = q('[data-role=rbank]'), read = q('[data-role=read]');

    function fsHtml(kind, i, name, sub, val, sel, mute, extra, sofm) {
      return '<div class="sim-x32-fs' + (sel ? ' sel' : '') + (sofm ? ' sofm' : '') + '"><span class="no">' + sub + '</span><span class="nm">' + esc(name) + '</span>' +
        '<button type="button" class="sim-x32-btn" data-' + kind + 'sel="' + i + '" aria-pressed="' + sel + '" aria-label="' + esc(name) + ' SELECT">SEL</button>' +
        '<button type="button" class="sim-x32-btn red" data-' + kind + 'mute="' + i + '" aria-pressed="' + mute + '" aria-label="' + esc(name) + ' MUTE">MUTE</button>' +
        '<input type="range" min="0" max="1000" step="1" data-' + kind + 'f="' + i + '" value="' + Math.round(fpos(val)) + '" aria-label="' + esc(name) + (sofm ? ' 보내는 양' : ' 페이더') + '"><b>' + fmt(val) + '</b>' + (extra || '') + '</div>';
    }
    function render() {
      var base = S.layer * 8;
      // 입력 페이더
      var h = '';
      for (var i = 1; i <= 8; i++) {
        var n = base + i, m = M.ch[n - 1], sofm = S.sof >= 0, val = sofm ? m.send[S.sof] : m.fader;
        var dk = DCAS.map(function (d, k) { return d[1].indexOf(n) >= 0 ? 'DCA' + (k + 1) : ''; }).filter(Boolean).join(' ');
        h += fsHtml('c', n, CHS[n - 1][0], 'CH ' + n, val, S.sel === n, m.mute, '<span class="dca">' + dk + '</span>', sofm);
      }
      inbank.innerHTML = h;
      // 버스 쪽
      var r = '';
      for (var k = 0; k < 4; k++) {
        if (S.right === 'dca') r += fsHtml('d', k, DCAS[k][0], 'DCA ' + (k + 1), M.dca[k], false, M.dcaMute[k], '', false);
        else r += fsHtml('b', k, BUSES[k], 'BUS ' + (k + 1), M.bus[k], S.sof === k, M.busMute[k], '', false);
      }
      rbank.innerHTML = r;
      el.querySelectorAll('[data-layer]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-layer') === S.layer)); });
      el.querySelectorAll('[data-right]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-right') === S.right)); });
      q('[data-sof]').setAttribute('aria-pressed', String(S.sof >= 0));
      q('[data-main]').value = Math.round(fpos(M.main)); q('[data-o=main]').textContent = fmt(M.main); q('[data-mmute]').setAttribute('aria-pressed', String(M.mainMute));
      renderStrip(); renderScreen(); judge(); renderRead();
    }
    function renderStrip() {
      var n = S.sel, m = M.ch[n - 1], c = CHS[n - 1];
      strip.innerHTML = '<h5>채널 스트립 · 지금 고른 채널: CH ' + n + ' ' + esc(c[0]) + '</h5>' +
        '<div class="sim-x32-gain"><span>GAIN</span><input type="range" min="0" max="60" step="0.5" data-gain="1" value="' + m.gain + '" aria-label="CH' + n + ' GAIN"><b>' + m.gain.toFixed(1) + ' dB</b></div>' +
        '<div><div class="sim-x32-in" data-role="inmeter"><i></i><b></b></div><div class="sim-x32-scale"><span>−60</span><span>−18</span><span>−6</span><span>0 dBFS</span></div></div>' +
        '<div class="sim-x32-row">' +
          '<button type="button" class="sim-x32-btn" data-tg="p48" aria-pressed="' + m.p48 + '">+48V</button>' +
          '<button type="button" class="sim-x32-btn" data-tg="lc" aria-pressed="' + m.lc + '">LOW CUT</button>' +
          '<button type="button" class="sim-x32-btn" data-tg="gate" aria-pressed="' + m.gate + '">GATE</button>' +
          '<button type="button" class="sim-x32-btn" data-tg="comp" aria-pressed="' + m.comp + '">COMP</button></div>' +
        '<p class="sim-x32-note">입력: ' + esc(c[1]) + (c[3] ? ' · 콘덴서라 +48V 가 있어야 소리가 나요' : '') + '. 팬텀(+48V)은 채널마다 따로 켜요.</p>';
    }
    function renderScreen() {
      var n = S.sel, c = CHS[n - 1];
      screen.innerHTML = '<h5>화면 · HOME</h5><div class="nm">CH ' + n + ' · ' + esc(c[0]) + '</div>' +
        (S.sof >= 0 ? '<span class="tg">SENDS ON FADER · BUS ' + (S.sof + 1) + ' ' + esc(BUSES[S.sof]) + '</span>' : '') +
        '<h5 style="margin-top:10px">SCENES</h5><div class="sim-x32-scenes" role="radiogroup" aria-label="씬 목록">' +
        [['01', '주일 1부 예배'], ['02', scenes['02'] ? '저장됨' : '(비어 있음)']].map(function (r) { return '<label><input type="radio" name="simX32Scene" value="' + r[0] + '"' + (sceneSel === r[0] ? ' checked' : '') + '>' + r[0] + ' · ' + esc(r[1]) + '</label>'; }).join('') +
        '</div><div class="sim-x32-sbtns"><button type="button" class="sim-x32-btn" data-scene="recall">RECALL</button><button type="button" class="sim-x32-btn" data-scene="save">SAVE</button></div>' +
        (S.dirty ? '<p class="sim-x32-note" style="color:#fde68a">불러온 뒤 바뀐 설정이 있어요</p>' : '<p class="sim-x32-note">씬과 같은 상태예요</p>');
    }
    function lv(d) { return !isFinite(d) || d < -60 ? '<b class="bad">소리 없음</b>' : '<b class="' + (d > 0 ? 'warn' : 'ok') + '">' + fmt(d) + ' dB</b>'; }
    function renderRead() {
      var inn = chIn(S.sel);
      read.innerHTML = '<h4>지금 상태 <small>교육용 근사</small></h4>' +
        '<div class="sim-row"><span>고른 채널 입력</span><b>' + (isFinite(inn) ? fmt(inn) + ' dBFS' : '신호 없음') + '</b></div>' +
        '<div class="sim-row"><span>메인(LR) 회중석</span>' + lv(mainLv()) + '</div>' +
        BUSES.map(function (b, k) { return '<div class="sim-row"><span>BUS ' + (k + 1) + ' ' + esc(b) + '</span>' + lv(busLv(k)) + '</div>'; }).join('') +
        '<div class="sim-row"><span>CH1 인도자 보컬 → 메인</span>' + lv(chOut(1)) + '</div>' +
        '<div class="sim-row"><span>DCA 1 「악기」</span><b>' + fmt(M.dca[0]) + ' dB</b></div>' +
        '<p class="sim-note">모니터 BUS 1–3 은 PRE(페이더 앞)로 보내요. 그래서 메인 페이더를 움직여도 모니터 크기는 그대로예요.</p>';
    }
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick); S.frame++;
      var bar = el.querySelector('[data-role=inmeter]'); if (!bar) return;
      var pk = chIn(S.sel), env = 0.55 + 0.45 * Math.abs(Math.sin(S.frame / 23)) * Math.abs(Math.sin(S.frame / 7.3));
      var now = isFinite(pk) ? pk + 20 * Math.log10(env) : -100, pos = function (d) { return clamp((d + 60) / 60 * 100, 0, 100); };
      bar.style.setProperty('--cut', (100 - pos(now)) + '%'); bar.style.setProperty('--pk', pos(isFinite(pk) ? pk : -100) + '%');
    }
    function changed() { S.dirty = true; }
    function onInput(e) {
      var tg = e.target, a;
      if ((a = tg.getAttribute('data-cf'))) { var n = +a, d = fdb(+tg.value); if (S.sof >= 0) { M.ch[n - 1].send[S.sof] = d; S.sawSof = true; } else M.ch[n - 1].fader = d; S.sel = n; changed(); render(); return; }
      if ((a = tg.getAttribute('data-df')) != null) { M.dca[+a] = fdb(+tg.value); changed(); render(); return; }
      if ((a = tg.getAttribute('data-bf')) != null) { M.bus[+a] = fdb(+tg.value); changed(); render(); return; }
      if (tg.getAttribute('data-main')) { M.main = fdb(+tg.value); changed(); render(); return; }
      if (tg.getAttribute('data-gain')) { M.ch[S.sel - 1].gain = +tg.value; changed(); var foc = true; render(); if (foc) { var g = q('[data-gain]'); if (g) g.focus(); } }
    }
    function onClick(e) {
      var b = e.target.closest('button'); if (!b || !el.contains(b)) return; var a;
      if ((a = b.getAttribute('data-layer')) != null) { S.layer = +a; render(); return; }
      if ((a = b.getAttribute('data-right'))) { S.right = a; if (a === 'dca') S.sof = -1; render(); return; }
      if (b.getAttribute('data-sof')) { if (S.sof >= 0) S.sof = -1; else { S.right = 'bus'; S.sof = 0; } render(); return; }
      if ((a = b.getAttribute('data-csel'))) { S.sel = +a; render(); return; }
      if ((a = b.getAttribute('data-bsel')) != null) { if (S.sof >= 0) S.sof = +a; render(); return; }
      if (b.getAttribute('data-dsel') != null) return;
      if ((a = b.getAttribute('data-cmute'))) { M.ch[+a - 1].mute = !M.ch[+a - 1].mute; changed(); render(); return; }
      if ((a = b.getAttribute('data-dmute')) != null) { M.dcaMute[+a] = !M.dcaMute[+a]; changed(); render(); return; }
      if ((a = b.getAttribute('data-bmute')) != null) { M.busMute[+a] = !M.busMute[+a]; changed(); render(); return; }
      if (b.getAttribute('data-mmute')) { M.mainMute = !M.mainMute; changed(); render(); return; }
      if ((a = b.getAttribute('data-tg'))) { var m = M.ch[S.sel - 1]; m[a] = !m[a]; changed(); render(); return; }
      if ((a = b.getAttribute('data-scene'))) {
        if (a === 'save') { scenes[sceneSel] = JSON.stringify(M); S.dirty = false; render(); return; }
        if (a === 'recall' && scenes[sceneSel]) { var wasDirty = S.dirty; M = JSON.parse(scenes[sceneSel]); fixInf(M); S.dirty = false; if (wasDirty && sceneSel === '01') hit('scene'); render(); }
      }
    }
    function fixInf(o) { o.ch.forEach(function (m) { if (m.fader == null) m.fader = NINF; m.send = m.send.map(function (v) { return v == null ? NINF : v; }); }); ['dca', 'bus'].forEach(function (k) { o[k] = o[k].map(function (v) { return v == null ? NINF : v; }); }); if (o.main == null) o.main = NINF; }
    function onChange(e) { if (e.target.name === 'simX32Scene') { sceneSel = e.target.value; render(); } }
    el.addEventListener('input', onInput); el.addEventListener('click', onClick); el.addEventListener('change', onChange);
    render(); tick();

    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); el.removeEventListener('input', onInput); el.removeEventListener('click', onClick); el.removeEventListener('change', onChange); el.innerHTML = ''; },
      state: function () {
        return { layer: S.layer, right: S.right, sel: S.sel, sof: S.sof, dirty: S.dirty, ready: true, audio: false,
          ch14: { p48: M.ch[13].p48, gain: M.ch[13].gain, input: fin(chIn(14)) }, ch1: { fader: fin(M.ch[0].fader), send1: fin(M.ch[0].send[0]), out: fin(chOut(1)) },
          dca: M.dca.map(fin), main: fin(mainLv()), bus: [0, 1, 2, 3].map(function (k) { return fin(busLv(k)); }), done: Object.keys(S.done) };
      },
      // set: 테스트·디버그용 (layer, right, sel, sof, gain(고른 채널), p48(고른 채널), dca:[..], chFader:{n:dB}, send:{n:dB}(지금 SOF 버스), scene:'save'|'recall')
      set: function (o) {
        o = o || {};
        if (o.layer != null) S.layer = o.layer; if (o.right) S.right = o.right; if (o.sel) S.sel = o.sel; if (o.sof != null) S.sof = o.sof;
        if (o.gain != null) { M.ch[S.sel - 1].gain = o.gain; changed(); } if (o.p48 != null) { M.ch[S.sel - 1].p48 = !!o.p48; changed(); }
        if (o.dca) { o.dca.forEach(function (v, k) { if (v != null) M.dca[k] = v; }); changed(); }
        if (o.chFader) { Object.keys(o.chFader).forEach(function (n) { M.ch[n - 1].fader = o.chFader[n]; }); changed(); }
        if (o.send && S.sof >= 0) { Object.keys(o.send).forEach(function (n) { M.ch[n - 1].send[S.sof] = o.send[n]; }); S.sawSof = true; changed(); }
        render();
        if (o.scene) { var b = q('[data-scene=' + o.scene + ']'); if (b) b.click(); }
        return this.state();
      }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.x32Desk = x32Desk;
})();
