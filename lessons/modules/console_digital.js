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
    // 2026-11-03: MUTE 칸은 뺌 — 채널 MUTE 가 PRE 보내기까지 끄는지는 설정·자료마다 달라서, 그림은 「페이더 앞/뒤」만 보여 줌
    var s = '', blocks = [['입력', '프리앰프', 'GAIN · +48V', C.teal], ['LOW CUT', '(HPF)', '저음 정리', C.teal], ['GATE', '게이트', '작은 잡음 닫기', C.purple], ['EQ', '4밴드', '음색', C.blue], ['DYN', '컴프레서', '크기 고르게', C.purple], ['페이더', '', '섞는 양', C.ink]];
    blocks.forEach(function (b, i) {
      var x = 8 + i * 100;
      s += rect(x, 40, 72, 62, '#fff', b[3], 8) + t(x + 36, 62, b[0], { size: 12, weight: 800, fill: b[3] }) + (b[1] ? t(x + 36, 77, b[1], { size: 9.5, fill: C.sub }) : '') + t(x + 36, 93, b[2], { size: 9, fill: C.sub });
      if (i < blocks.length - 1) s += arrow(x + 72, 71, x + 100, 71, '#94a3b8');
    });
    s += t(300, 22, '한 채널 안에서 소리가 지나가는 길 (기본 설정 기준 · 교육용 단순화)', { size: 11, fill: C.sub });
    // 보내는 지점 → BUS
    s += rect(470, 146, 80, 30, '#fff7ed', C.orange, 6) + t(510, 166, 'BUS 1–16', { size: 10.5, weight: 800, fill: C.orange });
    s += '<path d="M494 71V146" stroke="' + C.orange + '" stroke-width="2.4" fill="none" stroke-dasharray="5 4"/>' + t(486, 120, 'PRE · 페이더 앞', { size: 10, fill: C.orange, weight: 700, anchor: 'end' }) + t(486, 134, '(무대 모니터)', { size: 9.5, fill: C.orange, anchor: 'end' });
    s += '<path d="M592 71V161H550" stroke="' + C.purple + '" stroke-width="2.4" fill="none" stroke-dasharray="5 4"/>' + t(596, 196, 'POST · 페이더 뒤 (이펙트)', { size: 10, fill: C.purple, weight: 700, anchor: 'end' });
    s += t(150, 140, 'EQ·컴프 순서, 보내는 지점은', { size: 10, fill: C.sub }) + t(150, 155, '화면에서 바꿀 수 있어요', { size: 10, fill: C.sub });
    return svg(600, 204, s, 'X32 채널 안의 처리 순서');
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
    s += rect(24, 144, 120, 30, C.blue, null, 6) + t(84, 163, 'GO (불러오기)', { size: 10.5, weight: 800, fill: '#fff' }) + rect(156, 144, 136, 30, '#fff', C.blue, 6) + t(224, 163, 'SAVE (저장)', { size: 10.5, weight: 800, fill: C.blue });
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
      '.sim-x32-bot{display:flex;flex-wrap:wrap;gap:12px;align-items:stretch}',
      '.sim-x32-grp{display:flex;gap:8px;align-items:stretch;flex:0 1 auto;max-width:100%;overflow-x:auto;padding-bottom:4px}',
      '.sim-x32-grp>*{flex:0 0 auto}',
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
        '<div class="sim-x32-bot"><div class="sim-x32-grp" aria-label="입력 구역">' +
          '<div class="sim-x32-layers" role="group" aria-label="입력 레이어"><span class="sim-x32-note">입력 레이어</span>' +
            '<button type="button" class="sim-x32-btn" data-layer="0" aria-pressed="true">CH 1–8</button><button type="button" class="sim-x32-btn" data-layer="1" aria-pressed="false">CH 9–16</button></div>' +
          '<div class="sim-x32-fbank" data-role="inbank"></div></div><div class="sim-x32-grp" aria-label="버스·DCA 구역">' +
          '<div class="sim-x32-layers" role="group" aria-label="버스 쪽 레이어"><span class="sim-x32-note">버스 쪽 레이어</span>' +
            '<button type="button" class="sim-x32-btn" data-right="dca" aria-pressed="true">DCA 1–4</button><button type="button" class="sim-x32-btn" data-right="bus" aria-pressed="false">BUS 1–4</button>' +
            '<button type="button" class="sim-x32-btn sof" data-sof="1" aria-pressed="false">SENDS ON FADER</button></div>' +
          '<div class="sim-x32-fbank" data-role="rbank"></div>' +
          '<div class="sim-x32-main"><span class="nm">MAIN LR</span><button type="button" class="sim-x32-btn red" data-mmute="1" aria-pressed="false">MUTE</button><input type="range" min="0" max="1000" step="1" data-main="1" aria-label="MAIN LR 페이더"><b data-o="main"></b></div>' +
        '</div></div>' +
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
        '</div><div class="sim-x32-sbtns"><button type="button" class="sim-x32-btn" data-scene="recall">GO (불러오기)</button><button type="button" class="sim-x32-btn" data-scene="save">SAVE (저장)</button></div>' +
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

/* =========================================================================== 모듈 데이터 */
(function () {
  'use strict';
  var X32 = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Behringer_X32_%281%29.jpg/1280px-Behringer_X32_%281%29.jpg';
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['console-digital'] = {
    id: 'console-digital', path: 'hardware', no: 3, noLabel: '03-2', status: 'ready', level: '중급', minutes: 45, img: X32,
    title: '디지털 콘솔', sub: '화면과 SELECT 로 다루는 콘솔 — Behringer X32',
    overview: {
      lead: '디지털 콘솔은 들어온 소리를 숫자(디지털)로 바꿔 콘솔 안에서 처리하는 콘솔이에요. 이 과정은 교회와 공연장에서 많이 쓰는 <b>Behringer X32</b> 를 기준으로 배워요. 신호가 지나가는 순서(GAIN → 처리 → 페이더 → 버스)는 03-1 아날로그 콘솔과 똑같아요. 달라지는 것은 조작 방법이에요. 채널마다 노브가 따로 있지 않아서, 채널을 <b>SELECT</b> 로 고른 뒤 <b>화면과 공용 노브</b>로 조절하고, 같은 페이더로 <b>레이어</b>를 바꿔 가며 많은 채널을 다뤄요. 설정 전체는 <b>씬</b>으로 저장했다가 한 번에 불러와요.',
      terms: [
        ['SELECT', '채널마다 있는 버튼이에요. 누른 채널 하나의 설정이 화면과 채널 스트립 노브에 나타나요. 한 번에 한 채널만 고를 수 있어요.'],
        ['채널 스트립', '화면 옆에 모인 공용 노브예요. GAIN·+48V·LOW CUT, GATE, COMP, EQ, 버스 보내기를 SELECT 한 채널에 대해 조절해요.'],
        ['레이어', '같은 페이더 16개로 CH 1–16, CH 17–32, AUX IN·USB·FX RTN, BUS MASTER 를 바꿔 불러오는 것이에요. 오른쪽 8개도 DCA · BUS · MATRIX 레이어가 있어요.'],
        ['믹스 버스 (BUS 1–16)', '모니터·이펙트·녹음용으로 따로 섞는 길이에요. 아날로그 콘솔의 AUX 와 같은 역할이고, X32 에는 16개 있어요.'],
        ['Sends on Fader', '페이더를 「메인으로 섞는 양」 대신 「고른 BUS 로 보내는 양」으로 바꿔 주는 버튼이에요. 모니터 믹스를 페이더로 만들 때 써요.'],
        ['DCA', '여러 채널 페이더를 한 번에 움직이는 리모컨 페이더예요. 소리를 한 버스로 모으지는 않아요. X32 에는 8개 있어요.'],
        ['뮤트 그룹', '여러 채널을 버튼 하나로 한꺼번에 끄고 켜는 기능이에요. X32 에는 6개 있어요.'],
        ['씬 (Scene)', '페이더·MUTE·EQ·라우팅까지 콘솔 설정 전체를 저장했다가 한 번에 불러오는 것이에요. X32 는 씬 100개를 저장할 수 있어요.']
      ],
      points: [
        '조절하기 전에 <b>화면의 채널 이름과 레이어</b>를 먼저 확인해요. 디지털 콘솔 실수의 대부분은 「다른 채널을 만지고 있었다」예요.',
        '팬텀(+48V)은 <b>채널마다 따로</b> 켜요. 콘덴서 마이크 채널만 켜고, 확인 없이 모두 켜지 않아요.',
        '<b>씬을 불러오면 설정이 한꺼번에 바뀌어요.</b> 예배 중에는 함부로 불러오지 않고, 바꾼 설정은 저장(SAVE)해야 다음 주에도 남아요.'
      ],
      model: null
    },
    theory: [
      { title: '아날로그와 무엇이 다를까 — 화면 · SELECT · 공용 노브', visual: 'x32Surface',
        body: '아날로그 콘솔은 채널마다 GAIN·EQ·AUX 노브가 세로로 한 줄씩 달려 있어요. 디지털 콘솔 X32 는 채널마다 <b>페이더 · SELECT · MUTE · SOLO</b> 만 있고, 나머지 노브는 화면 옆 <b>채널 스트립</b>에 한 벌만 있어요. 채널의 <b>SELECT</b> 를 누르면 그 채널의 설정이 화면과 채널 스트립에 나타나고, 그때부터 노브는 그 채널만 조절해요. 신호 순서는 아날로그와 같아서, 03-1 에서 배운 원리를 그대로 쓰면 돼요.',
        more: '<ul><li><b>X32 (제조사 자료)</b>: 모터 페이더 25개 — 입력 쪽 16개, 버스·DCA 쪽 8개, MAIN LR 1개. 7인치 컬러 화면, 채널마다 이름을 보여 주는 작은 컬러 LCD(스크리블 스트립)가 있어요.</li><li>채널 스트립은 CONFIG/PREAMP · GATE/DYNAMICS · EQ · BUS SENDS · MAIN BUS 구역으로 나뉘고, 구역마다 VIEW 버튼을 누르면 화면에 자세한 설정이 열려요.</li><li>SELECT 는 한 번에 한 채널만 켜져요. 노브를 돌리기 전에 <b>지금 어느 채널이 골라져 있는지</b> 화면 위쪽 이름을 꼭 봐요.</li><li>입력은 마이크 프리앰프 32개(뒷면 XLR) 외에 AUX IN 6개, 스테이지박스용 AES50 단자 2개가 있어요.</li></ul>',
        check: { q: 'X32 에서 CH5 의 EQ 를 바꾸려고 해요. 가장 먼저 할 일은?', options: [
          { t: 'CH5 의 SELECT 를 누르고 화면에 CH5 가 나왔는지 확인한다', ok: true, why: '맞아요. 채널 스트립 노브는 SELECT 한 채널만 조절해요.' },
          { t: 'CH5 위에 있는 EQ 노브를 바로 돌린다', why: '그건 아날로그 콘솔이에요. X32 는 채널마다 EQ 노브가 따로 없어요.' },
          { t: 'CH5 페이더를 끝까지 올린다', why: '페이더는 메인으로 섞는 양이에요. EQ 와는 상관없어요.' }] } },
      { title: '레이어 — 페이더 16개로 더 많은 채널 다루기', visual: 'x32Layers',
        body: 'X32 는 입력 채널이 32개인데 입력 페이더는 16개예요. 그래서 왼쪽 <b>레이어 버튼</b>으로 같은 페이더에 <b>CH 1–16</b>, <b>CH 17–32</b>, <b>AUX IN·USB·FX RTN</b>, <b>BUS MASTER</b> 를 바꿔 불러와요. 오른쪽 8개 페이더도 <b>DCA 1–8</b>, <b>BUS 1–8</b>, <b>BUS 9–16</b>, <b>MATRIX 1–6 · MAIN C</b> 레이어가 있어요. 레이어를 바꾸면 모터 페이더가 저절로 움직여 그 채널들의 위치로 가요.',
        more: '<ul><li><b>MAIN LR 페이더는 레이어와 상관없이 늘 그 자리</b>에 있어요.</li><li>레이어를 바꿔도 소리는 바뀌지 않아요. 페이더가 「보여 주는 채널」만 바뀌어요.</li><li>가장 흔한 실수: 레이어가 CH 17–32 인 줄 모르고 1번 페이더를 내렸는데, 실제로는 17번 채널이 내려가는 것. 페이더 위 이름표(LCD)를 꼭 확인해요.</li><li>자주 쓰는 채널(보컬·설교)은 1–16 에, 덜 만지는 채널은 17–32 에 두면 예배 중 레이어를 덜 바꿔도 돼요.</li></ul>',
        check: { q: '레이어가 「CH 17–32」일 때 왼쪽 첫 번째 페이더를 내리면 어느 채널이 내려갈까요?', options: [
          { t: 'CH 17', ok: true, why: '맞아요. 같은 페이더가 지금은 17–32 를 보여 주고 있어요.' },
          { t: 'CH 1', why: 'CH 1 은 「CH 1–16」 레이어일 때 첫 번째 페이더예요.' },
          { t: 'MAIN LR', why: 'MAIN LR 은 오른쪽 끝 따로 있는 페이더예요.' }] } },
      { title: '채널 처리 — 프리앰프 · LOW CUT · GATE · EQ · COMP', visual: 'x32Chain',
        body: '모든 입력 채널에 같은 처리 도구가 들어 있어요. <b>프리앰프</b>(GAIN · +48V · 위상), 저음을 거르는 <b>LOW CUT</b>(아날로그의 HPF, 주파수를 바꿀 수 있어요), 작은 잡음을 닫는 <b>GATE</b>, 음색을 다듬는 <b>4밴드 EQ</b>, 크기를 고르게 하는 <b>COMP</b> 예요. 아날로그 MG12XU 는 팬텀 스위치가 하나지만, X32 는 <b>+48V 를 채널마다 따로</b> 켜고 꺼요.',
        more: '<ul><li><b>X32 (제조사 자료)</b>: 입력 채널 EQ 는 4밴드, BUS·MAIN·MATRIX 의 EQ 는 6밴드예요. 컴프레서는 EQ 앞이나 뒤로 순서를 바꿀 수 있어요.</li><li>GATE·EQ·COMP 는 채널 스트립의 버튼으로 켜고 끄고, VIEW 를 누르면 화면에서 자세히 조절해요. 자세한 사용법은 「믹싱 스킬」의 EQ · Gate · Compressor 과정에서 연습해요.</li><li>X32 안에는 이펙트 자리(FX 슬롯)가 8개 있어요. 1–4번은 보내기용·삽입용 모두, 5–8번은 삽입(인서트)용으로만 써요.</li><li>디지털 콘솔은 처리할 수 있는 게 많지만, <b>처음에는 GAIN · LOW CUT · MUTE · 페이더</b>만으로도 예배를 충분히 운영할 수 있어요.</li></ul>',
        check: { q: '설교 구즈넥(콘덴서) 마이크 채널에서 소리가 전혀 안 나요. X32 에서 가장 먼저 볼 것은?', options: [
          { t: '그 채널을 SELECT 하고 +48V 가 켜져 있는지 본다', ok: true, why: '맞아요. 콘덴서 마이크는 팬텀 전원이 있어야 동작하고, X32 는 채널마다 따로 켜요.' },
          { t: '모든 채널의 +48V 를 한꺼번에 켠다', why: '필요 없는 장비에까지 전원이 갈 수 있어요. 필요한 채널만 켜요.' },
          { t: 'EQ 의 고음을 올린다', why: '신호가 아예 없으면 EQ 로는 소리가 나지 않아요.' }] } },
      { title: '모니터 믹스 — BUS 와 Sends on Fader', visual: 'x32Sof',
        body: '아날로그의 AUX 처럼, X32 는 <b>믹스 버스(BUS) 16개</b>로 무대 모니터·이펙트·방송용 믹스를 따로 만들어요. 채널마다 BUS 로 보내는 양은 채널 스트립의 BUS SENDS 노브로 바꿀 수도 있지만, <b>Sends on Fader</b> 를 쓰면 더 쉬워요. Sends on Fader 를 켜고 BUS 하나(예: BUS 1 인도자 모니터)를 고르면, 입력 페이더가 잠시 <b>「BUS 1 로 보내는 양」</b>으로 바뀌어요. 페이더로 모니터 믹스를 만든 뒤 다시 끄면 페이더는 메인 위치로 돌아와요.',
        more: '<ul><li><b>X32 (제조사 자료)</b>: Sends on Fader 는 믹스 버스 1–16 에만 쓸 수 있고, DCA · MAIN · MATRIX 에는 쓰지 않아요. 버튼을 1초 넘게 누르면 켜진 채로 유지돼요.</li><li>BUS 로 보내는 지점은 화면에서 고를 수 있어요(입력, EQ 앞·뒤, 페이더 앞·뒤 등). 무대 모니터는 보통 <b>페이더 앞(PRE)</b>으로 보내서, 메인 페이더를 움직여도 모니터가 그대로이게 해요.</li><li>Sends on Fader 를 켠 채 잊으면, 메인을 조절한다고 생각하고 모니터를 바꾸게 돼요. 화면과 버튼 불빛을 늘 확인하고, 다 쓰면 꺼요.</li><li>X32 의 BUS 6개 정도는 모니터, 2개는 리버브·딜레이 같은 이펙트, 1–2개는 방송·녹음용으로 나눠 쓰는 경우가 많아요(교회마다 달라요).</li></ul>',
        check: { q: 'Sends on Fader 를 켜고 BUS 1(인도자 모니터)을 고른 상태에서 CH1 보컬 페이더를 올리면?', options: [
          { t: '인도자 모니터로 가는 보컬이 커지고, 회중석 메인은 그대로다', ok: true, why: '맞아요. 지금 페이더는 BUS 1 로 보내는 양을 보여 줘요.' },
          { t: '회중석 메인의 보컬이 커진다', why: 'Sends on Fader 가 켜져 있으면 페이더는 메인이 아니라 BUS 로 보내는 양이에요.' },
          { t: '모든 모니터가 함께 커진다', why: '고른 BUS 1 로 보내는 양만 바뀌어요.' }] } },
      { title: 'DCA 와 뮤트 그룹 — 여러 채널 한 번에', visual: 'x32Dca',
        body: '<b>DCA</b> 는 여러 채널 페이더를 한 번에 움직이는 리모컨 페이더예요. 예를 들어 DCA 1 에 기타·건반·베이스·드럼을 넣어 두면, DCA 1 페이더 하나로 악기 전체를 함께 줄이고 키울 수 있어요. 채널 페이더는 제자리에 있고, 실제로 나가는 크기만 함께 바뀌어요. <b>뮤트 그룹</b>은 정해 둔 채널들을 버튼 하나로 한꺼번에 끄고 켜요. X32 에는 DCA 8개, 뮤트 그룹 6개가 있어요.',
        more: '<ul><li><b>DCA 와 GROUP 의 차이</b>: 아날로그의 GROUP 은 소리를 실제로 한 버스에 모아요. DCA 는 소리를 모으지 않고 「크기 조절 명령」만 보내요. 그래서 DCA 로 줄여도 각 채널이 보내는 모니터(PRE)는 그대로예요.</li><li>DCA 는 SELECT 할 수 없어요(제조사 자료). DCA 에 넣을 채널은 화면에서 정해요.</li><li>뮤트 그룹 버튼은 MAIN LR 페이더 오른쪽에 있어요. 설교 시간에 찬양팀 마이크를 한 번에 끄고, 다음 찬양 때 한 번에 켜는 데 많이 써요.</li><li>뮤트 그룹으로 끈 채널은 채널 MUTE 버튼도 불이 켜져요. 「왜 안 나지?」 할 때 뮤트 그룹 버튼부터 확인해요.</li></ul>',
        check: { q: '찬양 중 악기 소리 전체를 조금 줄이고 싶어요. 각 악기 사이의 비율은 그대로 두려면?', options: [
          { t: '악기들이 들어 있는 DCA 페이더를 내린다', ok: true, why: '맞아요. DCA 는 넣어 둔 채널들을 같은 양만큼 함께 움직여요.' },
          { t: '악기 채널 페이더를 하나씩 비슷하게 내린다', why: '할 수는 있지만 느리고 비율이 흐트러지기 쉬워요.' },
          { t: '악기 채널의 GAIN 을 내린다', why: 'GAIN 은 입력 크기라 모니터(PRE)까지 함께 줄어요.' }] } },
      { title: '씬과 패치 — 저장 · 불러오기 · 어디서 어디로', visual: 'x32Scene',
        body: '<b>씬</b>은 페이더·MUTE·EQ·라우팅 등 콘솔 설정 전체를 저장한 것이에요. 리허설 때 맞춘 설정을 「주일 1부 예배」로 <b>저장(SAVE)</b>해 두면, 다음 주에 <b>불러와서(GO)</b> 같은 상태에서 시작할 수 있어요. <b>패치</b>는 어떤 입력 단자(콘솔 뒷면, 스테이지박스)를 몇 번 채널로 받고, 어떤 BUS 를 몇 번 출력 단자로 내보낼지 정하는 일이에요. 아날로그 콘솔에서는 케이블을 꽂는 자리로 정해지지만, 디지털 콘솔은 화면(ROUTING)에서 정해요.',
        more: '<ul><li><b>X32 (제조사 자료)</b>: 씬 100개를 저장할 수 있어요. 일부 설정만 저장·불러오는 스니펫(Snippet)도 있어요.</li><li><b>세이프(Safe)</b>: 씬을 불러와도 바뀌면 안 되는 채널이나 설정을 지정해 두는 기능이에요. 예: 설교 마이크 GAIN, 출력 패치.</li><li>씬을 불러오면 페이더가 모터로 한꺼번에 움직여요. <b>예배 중에는 꼭 필요한 때만</b> 불러오고, 불러오기 전에 지금 상태를 다른 번호로 저장해 두면 되돌릴 수 있어요.</li><li>바꾼 설정은 저장하지 않으면 다음에 그 씬을 불러올 때 사라져요. 예배 후 「이번 주 설정」을 저장할지 팀에서 정해 두세요.</li><li>패치를 잘못 바꾸면 모든 채널 소리가 엉뚱한 곳으로 갈 수 있어요. 패치는 담당자만 바꿔요.</li></ul>',
        check: { q: '리허설에서 맞춘 콘솔 설정을 다음 주 같은 예배에도 그대로 쓰고 싶어요. 알맞은 방법은?', options: [
          { t: '씬으로 저장(SAVE)해 두고 다음 주에 불러온다(GO)', ok: true, why: '맞아요. 씬은 설정 전체를 저장했다 한 번에 불러와요.' },
          { t: '페이더 위치를 사진으로 찍어 두고 다음 주에 맞춘다', why: '페이더 말고도 EQ·GATE·BUS 보내기 등 저장할 것이 많아요. 씬이 훨씬 정확해요.' },
          { t: '전원만 끄지 않으면 그대로 남는다', why: '다른 예배·행사에서 설정이 바뀌면 사라져요. 씬으로 저장해요.' }] } }
    ],
    practice: {
      kind: 'x32Desk',
      lead: '가상 X32 조작면이에요. 레이어를 바꿔 채널을 찾고, SELECT 한 채널의 +48V·GAIN 을 맞추고, Sends on Fader 로 모니터를 보내고, DCA 로 악기를 한 번에 줄이고, 씬을 불러와 설정을 되돌려 봐요. 실제 X32 는 입력 페이더 16개 · 버스 쪽 8개인데, 여기서는 8개 · 4개로 줄였어요.',
      note: '레벨(dB)·미터·페이더 눈금은 교육용 근사예요. 채널 배치와 DCA·BUS 이름은 교회 예배 예시이고, 버튼 이름과 구성은 X32 를 따랐지만 단순화했어요.',
      tasks: [
        { id: 'p48', title: '레이어 바꿔 채널 찾기', text: 'CH 9–16 레이어로 넘겨 설교 마이크(CH 14, 콘덴서)를 SELECT 하고, 채널 스트립의 +48V 를 켜세요.' },
        { id: 'gain', title: '고른 채널 GAIN 맞추기', text: '설교 마이크의 GAIN 을 맞춰 입력 미터의 흰 선(가장 큰 순간)이 −18 ~ −6 dBFS 사이에 오게 하세요.' },
        { id: 'sof', title: 'Sends on Fader 로 모니터 보내기', text: 'SENDS ON FADER 를 켜고 BUS 1(인도자 모니터)을 고른 뒤, CH1 인도자 보컬 페이더를 −10 dB 이상으로 올리세요. 메인은 그대로예요.' },
        { id: 'dca', title: 'DCA 로 악기 한 번에 줄이기', text: 'DCA 1–4 레이어에서 DCA 1 「악기」를 −10 dB 이하로 내리세요. 악기 채널 페이더는 움직이지 않아요.' },
        { id: 'scene', title: '씬 불러오기로 되돌리기', text: '설정을 바꾼 상태에서 화면의 SCENES 에서 「01 주일 1부 예배」를 고르고 GO 를 눌러 처음 설정으로 되돌리세요.' }
      ],
      links: [
        { title: 'CL5 콘솔 트레이닝', text: '다른 디지털 콘솔(Yamaha CL5)로 예배 식순에 맞춰 채널을 켜고 DCA 를 다뤄 봐요.', go: { tab: 'tab5' } },
        { title: 'MG12XU 실습', text: '같은 일을 아날로그 콘솔에서는 어떻게 하는지 비교해 봐요.', go: { tab: 'tab6' } }
      ]
    },
    quiz: [
      { q: '예배 중 CH 3 보컬을 조금 줄이려고 왼쪽 세 번째 페이더를 내렸는데 엉뚱한 채널이 줄었어요. 가장 그럴듯한 이유는?', options: [
        { t: '레이어가 CH 1–16 이 아니었다', ok: true, why: '맞아요. 같은 페이더가 다른 레이어의 채널을 보여 주고 있었을 거예요. 이름표를 먼저 확인해요.' },
        { t: 'SELECT 가 켜져 있지 않아서', why: '페이더는 SELECT 와 상관없이 움직여요.' },
        { t: '씬이 저장되지 않아서', why: '씬 저장 여부는 지금 페이더가 어느 채널인지와 상관없어요.' }] },
      { q: 'Sends on Fader 를 켜 둔 것을 깜빡 잊고 메인 소리를 조절했어요. 어떤 일이 생길까요?', options: [
        { t: '메인 대신 고른 BUS(모니터)로 보내는 양이 바뀐다', ok: true, why: '맞아요. 다 쓰면 Sends on Fader 를 꼭 꺼요.' },
        { t: '메인과 모니터가 함께 바뀐다', why: 'Sends on Fader 가 켜져 있으면 페이더는 BUS 로 보내는 양만 바꿔요.' },
        { t: '아무것도 바뀌지 않는다', why: '고른 BUS 로 보내는 양이 바뀌어요.' }] },
      { q: '찬양팀 악기 8채널을 DCA 1 로 −6 dB 줄였어요. 각 악기 채널 페이더와 PRE 로 보내는 무대 모니터는?', options: [
        { t: '채널 페이더는 제자리, PRE 모니터도 그대로다', ok: true, why: '맞아요. DCA 는 실제로 나가는 크기만 바꾸고, 페이더 앞(PRE)에서 보내는 모니터에는 영향이 없어요.' },
        { t: '채널 페이더가 모두 6 dB 만큼 내려간다', why: 'DCA 는 채널 페이더를 움직이지 않고 나가는 크기만 바꿔요.' },
        { t: '모니터도 모두 6 dB 줄어든다', why: 'PRE 로 보내는 모니터는 페이더·DCA 앞이라 그대로예요.' }] },
      { q: 'X32 의 팬텀 전원(+48V)에 대한 설명으로 맞는 것은?', options: [
        { t: '입력 채널마다 따로 켜고 끌 수 있다', ok: true, why: '맞아요. 콘덴서 마이크 채널만 골라서 켜요.' },
        { t: '스위치 하나로 모든 채널에 한꺼번에 걸린다', why: '그건 MG12XU 같은 아날로그 콘솔이에요.' },
        { t: '씬을 불러오면 항상 모두 꺼진다', why: '팬텀 설정도 콘솔 설정의 일부예요. 세이프로 지정할 수도 있어요.' }] },
      { q: '리허설 뒤 설정을 저장하지 않고 다음 주에 「주일 1부 예배」 씬을 불러왔어요. 어떻게 될까요?', options: [
        { t: '리허설에서 바꾼 것은 사라지고 예전에 저장한 설정으로 돌아간다', ok: true, why: '맞아요. 씬에는 마지막으로 저장한 상태만 들어 있어요.' },
        { t: '리허설 설정이 자동으로 들어 있다', why: '저장(SAVE)하지 않으면 씬에 들어가지 않아요.' },
        { t: '콘솔이 꺼진다', why: '씬을 불러와도 콘솔은 꺼지지 않아요. 설정만 바뀌어요.' }] }
    ],
    missions: [
      { title: 'CL5 콘솔 트레이닝 · 예배 식순 운영', text: '디지털 콘솔에서 식순에 맞춰 채널을 켜고 끄고, DCA 로 그룹 레벨을 다뤄요.', go: { tab: 'tab5' } },
      { title: '음향 트러블슈팅 · 미션 A', text: '입력은 있는데 소리가 안 날 때, 레이어·MUTE·뮤트 그룹·페이더 순서로 막힌 곳을 찾아요.', go: { tab: 'tab7', ts: 'A' } }
    ],
    deeper: [
      { title: '스테이지박스와 AES50', text: 'X32 뒷면에는 <b>AES50</b> 단자가 2개 있어요. 무대에 둔 스테이지박스와 랜선 한 가닥으로 연결해서 마이크 신호를 디지털로 주고받아요.', more: '<ul><li><b>X32 (제조사 자료)</b>: AES50 단자 하나에 48채널 입력 · 48채널 출력, Cat-5e 케이블로 최대 100 m 까지 연결해요.</li><li>굵은 아날로그 멀티 케이블 대신 랜선 한 가닥이라 설치가 쉬워요. 대신 그 케이블이 빠지면 무대 쪽 채널이 한꺼번에 끊기니, 케이블 보호와 예비선이 중요해요.</li><li>어떤 스테이지박스 입력을 몇 번 채널로 받을지는 화면의 ROUTING(패치)에서 정해요.</li></ul>' },
      { title: '멀티트랙 녹음과 가상 사운드체크', text: 'X32 에 기본으로 들어 있는 <b>X-USB 카드</b>로 컴퓨터에 32채널을 녹음하고, 녹음한 소리를 다시 콘솔 채널로 재생할 수 있어요.', more: '<ul><li><b>X32 (제조사 자료)</b>: X-USB 카드는 USB 2.0 으로 32채널 입력·32채널 출력을 주고받아요. 선택 카드인 X-LIVE 는 SD 카드에 32채널을 바로 녹음해요.</li><li><b>가상 사운드체크</b>: 주일 예배를 채널별로 녹음해 두고, 평일에 그 소리를 콘솔 채널로 다시 틀면 찬양팀 없이도 EQ·컴프·밸런스를 연습할 수 있어요. 봉사자 훈련에 아주 좋아요.</li><li>재생할 때는 채널 입력을 「녹음 재생」으로 바꿔야 하고, 예배 전에는 꼭 원래(마이크 입력)로 돌려놔요.</li></ul>' },
      { title: '원격 조작 앱', text: '태블릿·노트북으로 X32 를 조절할 수 있어요. 회중석에서 소리를 들으며 조절하거나, 연주자가 자기 모니터를 직접 맞출 때 써요.', more: '<ul><li><b>X32-Edit</b>: PC·Mac·Linux 용 제조사 프로그램이에요. 콘솔 없이 미리 씬을 만들어 볼 수도 있어요(오프라인).</li><li><b>MX-Mix · MX-Q</b>: 지금 제조사가 안내하는 태블릿·휴대폰 앱이에요(예전 앱 X32-Mix · X32-Q 는 오래 업데이트되지 않았어요). Mixing Station 같은 다른 회사 앱도 있어요.</li><li>여러 사람이 동시에 만지면 서로 설정을 바꿔 버릴 수 있어요. 누가 무엇을 조절할지 정하고, 연주자 앱은 자기 모니터만 바꾸게 설정해요.</li></ul>' }
    ],
    sources: [
      { t: 'Behringer X32 제품 페이지 — 프리앰프 32개 · 채널별 팬텀 · 모터 페이더 25개 · 7인치 화면 · AES50 2개 · X-USB · DCA 8 · 뮤트 그룹 6 · 씬 100', url: 'https://www.behringer.com/en/products/0603-ace' },
      { t: 'Behringer X32 Quick Start Guide — 레이어 버튼 · 채널 스트립 · Sends on Fader · FX 슬롯', url: 'https://www.heliart.ee/static/custom/File/Tooteinfo/quick_start/Behringer_X32_QSG.pdf' },
      { t: 'Behringer X32 User Manual — 버스 16 · 매트릭스 6 · 입력 EQ 4밴드 · 버스 EQ 6밴드 · AES50 48×48', url: 'https://media.vsl-uk.com/manuals/sound/Behringer_X32_User_Manual.pdf' },
      { t: 'Behringer X32 User Manual — Scenes 화면 · Safes (ManualsLib)', url: 'https://manualslib.com/manual/453343/Behringer-X32-Digital-Mixer.html?page=63' },
      { t: 'Behringer X-LIVE 확장 카드', url: 'https://www.behringer.com/en/products/0606-ABU' },
      { t: 'Behringer MX-Mix · MX-Q 앱 안내 — Sweetwater', url: 'https://www.sweetwater.com/sweetcare/articles/behringer-mx-mix-and-mx-q-mobile-apps-quickstart-guide/' },
      { t: '사진: Cjp24, 「Behringer X32 (1)」, CC BY-SA 4.0 — Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Behringer_X32_(1).jpg' }
    ]
  };
})();
