/* =============================================================================
   03-2 디지털 콘솔 (Behringer X32 기준) — 2026-11-03
   - STA_MODULES['console-digital'] (모듈 데이터) + STAVisuals.x32* (그림 6개) + 실습은 x32_photo_sim.js(STASims.x32Photo, X32 사진 위에서 마우스로 조작)
   - 03-1 아날로그 콘솔(console.js)과 같은 구성: 핵심 개념 · 이론(그림 + 개념 체크) · 실습(자동 확인 과제 6개) · 확인 문제 · 관련 미션 · 심화 학습
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
    var s = rect(4, 4, 592, 214, '#1f2933', '#0b0f14', 12) + t(14, 22, 'X32 조작면 — 구역별로 나눠 간단히 그린 그림 (실제 위치·크기와 다를 수 있어요)', { size: 10.5, fill: '#cbd5e1', anchor: 'start' });
    // 입력 구역
    s += rect(14, 34, 236, 172, 'rgba(34,211,238,.10)', '#22d3ee') + t(132, 52, '① 입력 채널 구역', { size: 11.5, weight: 800, fill: '#a5f3fc' });
    s += rect(22, 60, 36, 74, '#334155', null, 4) + t(40, 76, '레이어', { size: 8.5, fill: '#e2e8f0', weight: 700 }) + [0, 1, 2, 3].map(function (i) { return rect(27, 82 + i * 12, 26, 8, i === 0 ? '#fbbf24' : '#64748b', null, 2); }).join('');
    s += faders(72, 70, 16, 11, '#e5e7eb', 70) + t(155, 160, '페이더 16개 + SELECT · MUTE · 미터', { size: 9.5, fill: '#cbd5e1' }) + t(132, 196, '레이어로 1–16 · 17–32 · AUX · FX RTN 을 바꿔 불러요', { size: 9.5, fill: '#94a3b8' });
    // 가운데: 화면 + 채널 스트립
    s += rect(262, 34, 170, 172, 'rgba(251,191,36,.10)', '#fbbf24') + t(347, 52, '② 화면 · 채널 스트립', { size: 11.5, weight: 800, fill: '#fde68a' });
    s += rect(278, 62, 138, 62, '#0b1220', '#475569', 4) + t(347, 88, '컬러 화면', { size: 11, fill: '#e2e8f0', weight: 700 }) + t(347, 106, '고른 채널의 자세한 설정', { size: 9, fill: '#94a3b8' });
    [0, 1, 2, 3, 4, 5].forEach(function (i) { s += '<circle cx="' + (288 + i * 23) + '" cy="146" r="7" fill="#e5e7eb"/>'; });
    s += t(347, 170, 'GAIN · GATE · COMP · EQ 노브', { size: 9.5, fill: '#cbd5e1' }) + t(347, 186, 'SELECT 로 고른 채널만 조절', { size: 9.5, fill: '#fde68a', weight: 700 });
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
    s += t(300, 22, '한 채널 안에서 소리가 지나가는 길 (기본 설정 · 간단히 그림)', { size: 11, fill: C.sub });
    // 보내는 지점 → BUS
    s += rect(470, 146, 80, 30, '#fff7ed', C.orange, 6) + t(510, 166, 'BUS 1–16', { size: 10.5, weight: 800, fill: C.orange });
    s += '<path d="M494 71V146" stroke="' + C.orange + '" stroke-width="2.4" fill="none" stroke-dasharray="5 4"/>' + t(486, 120, 'PRE · 페이더 앞', { size: 10, fill: C.orange, weight: 700, anchor: 'end' }) + t(486, 134, '(무대 모니터)', { size: 9.5, fill: C.orange, anchor: 'end' });
    s += '<path d="M592 71V161H550" stroke="' + C.purple + '" stroke-width="2.4" fill="none" stroke-dasharray="5 4"/>' + t(596, 196, 'POST · 페이더 뒤 (이펙트)', { size: 10, fill: C.purple, weight: 700, anchor: 'end' });
    s += t(150, 140, 'EQ·컴프 순서와 보내는 곳은', { size: 10, fill: C.sub }) + t(150, 155, '화면에서 바꿀 수 있어요', { size: 10, fill: C.sub });
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
    s += t(457, 186, '예시예요 · 실제 연결은 교회마다 달라요', { size: 9, fill: C.sub });
    return svg(600, 198, s, '씬과 패치');
  };

  /* ---------------------------------------------------------------- 「그림으로 보기」 (2026-11-04)
     - 용어 · 확인 문제 · 심화에 붙이는 작은 그림. viewBox 400 안팎, 글자 13 이상
     - class 는 mod-pic-svg (최소 폭 = viewBox 의 83% — 휴대폰에서도 글자 13 이 11px 이상으로 보이게, 넘치면 상자 안에서 옆으로 밀어 봐요) */
  function psvg(w, h, body, label) { return '<div style="contain:inline-size;overflow-x:auto"><svg class="mod-pic-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" font-family="Pretendard, system-ui, sans-serif" style="display:block;width:100%;max-width:' + w + 'px;min-width:' + Math.round(w * 0.83) + 'px;height:auto;margin:0 auto">' + body + '</svg></div>'; }
  function num(x, y, n, col) { return '<circle cx="' + x + '" cy="' + y + '" r="11" fill="' + col + '"/>' + t(x, y + 5, n, { size: 13, weight: 800, fill: '#fff' }); }
  function fd(x, y, h, pos, col) { return '<path d="M' + x + ' ' + y + 'V' + (y + h) + '" stroke="#475569" stroke-width="3"/>' + rect(x - 8, y + pos - 5, 16, 10, col || '#e5e7eb', null, 2); }
  function knob(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="11" fill="#e5e7eb" stroke="#94a3b8" stroke-width="1.5"/><path d="M' + x + ' ' + y + 'L' + x + ' ' + (y - 9) + '" stroke="' + C.ink + '" stroke-width="2.5"/>'; }

  // 용어 SELECT — 고른 채널 하나를 노브 한 벌로
  V.x32SelectMini = function () {
    var s = rect(4, 4, 148, 128, '#1f2933', null, 10);
    for (var i = 0; i < 4; i++) { var x = 26 + i * 34, on = i === 2; s += fd(x, 14, 56, 30) + rect(x - 13, 80, 26, 16, on ? '#fbbf24' : '#64748b', null, 4) + t(x, 120, String(i + 1), { size: 13, weight: 800, fill: on ? '#fde68a' : '#cbd5e1' }); }
    s += t(78, 109, 'SELECT', { size: 13, fill: '#94a3b8', weight: 700 });
    s += arrow(154, 88, 172, 88, C.orange) + rect(174, 14, 122, 118, '#fff7ed', C.orange, 10) + t(235, 36, '노브 한 벌', { size: 14, weight: 800, fill: C.orange });
    [0, 1, 2, 3].forEach(function (i) { s += knob(196 + i * 26, 66); });
    s += t(235, 104, '지금은 CH3 만', { size: 13, weight: 800 }) + t(235, 122, '조절해요', { size: 13, fill: C.sub });
    return psvg(300, 136, s, 'SELECT 를 누른 채널 하나를 노브 한 벌로 조절해요');
  };


  // 용어 레이어 — 같은 페이더에 다른 채널 묶음을 불러오기
  V.x32LayerMini = function () {
    var s = '', tabs = [['1–16', false], ['17–32', true], ['AUX·FX', false], ['BUS', false]];
    tabs.forEach(function (b, i) { var x = 6 + i * 72; s += rect(x, 6, 66, 24, b[1] ? '#fbbf24' : '#e2e8f0', b[1] ? '#b45309' : '#94a3b8', 6) + t(x + 33, 23, b[0], { size: 13, weight: 800, fill: b[1] ? '#111827' : C.sub }); });
    s += rect(6, 36, 288, 96, '#1f2933', null, 8);
    for (var i = 0; i < 8; i++) { var x = 26 + i * 35; s += t(x, 56, String(17 + i), { size: 13, weight: 800, fill: '#fde68a' }) + fd(x, 64, 56, 14 + (i * 13) % 34); }
    s += t(150, 154, '책장을 넘기듯', { size: 14, weight: 800, fill: C.ink }) + t(150, 174, '같은 페이더에 다른 채널이 와요', { size: 13, fill: C.sub });
    return psvg(300, 180, s, '레이어 버튼으로 같은 페이더에 다른 채널 묶음을 불러와요');
  };


  // 용어 Sends on Fader — 페이더가 맡는 일이 바뀌어요
  V.x32SofMini = function () {
    function desk(x, title, col, pos, o1, o2, outCol) { var h = t(x + 59, 18, title, { size: 13, weight: 800, fill: outCol }) + rect(x, 26, 118, 70, '#1f2933', null, 8); pos.forEach(function (p, i) { h += fd(x + 20 + i * 26, 36, 50, p, col); }); return h + t(x + 59, 116, o1, { size: 13, weight: 800, fill: outCol }) + t(x + 59, 134, o2, { size: 13, weight: 800, fill: outCol }); }
    var s = desk(4, '평소', '#e5e7eb', [14, 22, 10, 30], '메인으로', '섞는 양', C.teal) + desk(178, 'BUS 1 을 고르면', '#fbbf24', [8, 38, 40, 34], 'BUS 1 로', '보내는 양', C.orange);
    s += arrow(124, 54, 174, 54, C.orange) + rect(126, 64, 46, 22, C.orange, null, 5) + t(149, 80, 'SoF', { size: 13, weight: 800, fill: '#fff' });
    return psvg(300, 140, s, 'Sends on Fader 를 켜면 페이더가 BUS 로 보내는 양이 돼요');
  };


  // 용어 DCA — 여러 채널 페이더의 리모컨
  V.x32DcaMini = function () {
    var s = rect(6, 20, 56, 104, C.purple, null, 10) + t(34, 40, 'DCA 1', { size: 13, weight: 800, fill: '#fff' }) + '<path d="M34 50V114" stroke="#ddd6fe" stroke-width="3"/>' + rect(24, 90, 20, 10, '#fff', null, 2) + arrow(52, 62, 52, 94, '#fde68a');
    s += '<path d="M62 36 H74 V9 H274" fill="none" stroke="' + C.purple + '" stroke-width="2" stroke-dasharray="4 3"/>';
    ['기타', '건반', '베이스', '드럼'].forEach(function (n, i) { var x = 106 + i * 56;
      s += '<path d="M' + x + ' 9V22" stroke="' + C.purple + '" stroke-width="2" stroke-dasharray="4 3"/>' + rect(x - 23, 22, 46, 80, '#f5f3ff', '#c4b5fd', 6) + t(x, 40, n, { size: 13, weight: 800 }) + fd(x, 48, 46, 18) + t(x, 120, '−6 dB', { size: 13, weight: 800, fill: C.purple });
    });
    s += t(178, 142, '페이더는 제자리 · 크기만 함께', { size: 13, fill: C.sub });
    return psvg(300, 148, s, 'DCA 는 여러 채널의 크기를 한 번에 바꾸는 리모컨이에요');
  };


  // 용어 씬 — 게임 저장처럼 SAVE · GO
  V.x32SceneMini = function () {
    var s = '', st = [['1', '리허설 끝', '설정 완성', C.teal], ['2', 'SAVE', '「01 주일 1부」', C.blue], ['3', '다음 주 GO', '같은 상태로', C.green]];
    st.forEach(function (r, i) { var x = 4 + i * 102; s += rect(x, 8, 90, 108, '#fff', r[3], 10) + num(x + 45, 32, r[0], r[3]) + t(x + 45, 70, r[1], { size: 14, weight: 800, fill: r[3] }) + t(x + 45, 94, r[2], { size: 13, fill: C.sub }); if (i < 2) s += arrow(x + 90, 62, x + 102, 62, C.ink); });
    return psvg(300, 122, s, '씬은 설정 전체를 저장했다가 한 번에 불러와요');
  };


  // 확인 문제 1 — 레이어가 바뀐 줄 모르고 페이더를 내림
  V.x32QuizLayer = function () {
    var s = t(34, 18, '레이어', { size: 13, weight: 800 }), lay = [['1–16', false], ['17–32', true], ['AUX', false], ['BUS', false]];
    lay.forEach(function (b, i) { var y = 28 + i * 32; s += rect(4, y, 60, 24, b[1] ? '#fbbf24' : '#e2e8f0', b[1] ? '#b45309' : '#94a3b8', 6) + t(34, y + 17, b[0], { size: 13, weight: 800, fill: b[1] ? '#111827' : C.sub }); });
    s += rect(74, 8, 262, 150, '#1f2933', null, 10);
    for (var i = 0; i < 7; i++) { var x = 96 + i * 36, hot = i === 2; s += rect(x - 15, 16, 30, 20, hot ? '#fde68a' : '#334155', null, 3) + t(x, 31, String(17 + i), { size: 13, weight: 800, fill: hot ? '#111827' : '#e2e8f0' }) + fd(x, 46, 84, hot ? 70 : 24 + (i * 11) % 20, hot ? '#f87171' : '#e5e7eb'); }
    s += arrow(168, 62, 168, 104, '#f87171') + t(205, 150, '왼쪽 세 번째 페이더를 내렸어요', { size: 13, fill: '#e2e8f0', weight: 700 });
    return psvg(340, 164, s, '레이어 17–32 에서 왼쪽 세 번째 페이더를 내린 모습');
  };


  // 확인 문제 3 — DCA 를 내리면 무엇이 바뀔까?
  V.x32QuizDca = function () {
    var s = rect(6, 8, 74, 150, C.purple, null, 10) + t(43, 30, 'DCA 1', { size: 13, weight: 800, fill: '#fff' }) + t(43, 48, '악기', { size: 13, fill: '#ede9fe' }) + '<path d="M36 58V146" stroke="#ddd6fe" stroke-width="3"/>' + rect(24, 112, 24, 12, '#fff', null, 2) + arrow(64, 74, 64, 116, '#fde68a') + t(64, 68, '−6', { size: 13, weight: 800, fill: '#fde68a' });
    s += rect(90, 8, 162, 150, '#f5f3ff', '#c4b5fd', 10) + t(171, 28, '악기 채널 페이더', { size: 13, weight: 800 });
    for (var i = 0; i < 8; i++) { var x = 108 + i * 18; s += '<path d="M' + x + ' 44V128" stroke="#94a3b8" stroke-width="3"/>' + t(x, 148, '?', { size: 14, weight: 800, fill: C.purple }); }
    s += rect(260, 8, 76, 150, '#fff7ed', '#fdba74', 10) + t(298, 32, '무대 모니터', { size: 13, weight: 800, fill: C.orange }) + t(298, 50, '(PRE)', { size: 13, fill: C.orange }) + '<circle cx="298" cy="96" r="22" fill="none" stroke="' + C.orange + '" stroke-width="2.5"/>' + t(298, 103, '?', { size: 20, weight: 800, fill: C.orange });
    return psvg(340, 164, s, 'DCA 1 을 6 dB 내렸을 때 채널 페이더와 무대 모니터는?');
  };


  // 심화 — 아날로그 멀티 케이블과 AES50 랜선 비교
  V.x32StageboxMini = function () {
    function row(y, title, sub, many, col) {
      var h = t(8, y, title, { size: 13, weight: 800, anchor: 'start', fill: col }) + rect(6, y + 10, 92, 46, '#fff', C.line, 8) + t(52, y + 38, many ? '무대' : '스테이지박스', { size: 13, weight: 800 }) + rect(246, y + 10, 88, 46, '#fff', C.line, 8) + t(290, y + 38, '콘솔', { size: 13, weight: 800 });
      if (many) { for (var k = 0; k < 9; k++) h += '<path d="M98 ' + (y + 18 + k * 4) + ' H246" stroke="' + col + '" stroke-width="2.4"/>'; } else h += '<path d="M98 ' + (y + 33) + ' H246" stroke="' + col + '" stroke-width="3"/>';
      return h + t(170, y + 76, sub, { size: 13, fill: C.sub });
    }
    var s = row(18, '아날로그 멀티 케이블', '채널마다 선이 따로 · 굵고 무거워요', true, C.sub) + row(118, 'AES50: 랜선 한 가닥', '한 가닥에 48채널씩 오가요 · 최대 100 m', false, C.teal);
    return psvg(340, 204, s, '아날로그 멀티 케이블과 AES50 랜선 한 가닥 비교');
  };


  // 심화 — 가상 사운드체크 순서
  V.x32VirtualSc = function () {
    var s = '', st = [['1', '주일 예배', '채널마다 따로 녹음', 6, 8], ['2', '평일', '녹음을 채널로 틀기', 178, 8], ['3', '연습', 'EQ·컴프·밸런스', 178, 92], ['4', '예배 전', '마이크 입력으로 복구', 6, 92]];
    st.forEach(function (r, i) { var x = r[3], y = r[4], col = i === 3 ? C.red : C.teal; s += rect(x, y, 156, 64, '#fff', col, 10) + num(x + 20, y + 22, r[0], col) + t(x + 38, y + 27, r[1], { size: 14, weight: 800, anchor: 'start', fill: col }) + t(x + 12, y + 52, r[2], { size: 13, anchor: 'start', fill: C.sub }); });
    s += arrow(162, 40, 176, 40, C.ink) + arrow(256, 72, 256, 90, C.ink) + arrow(178, 124, 164, 124, C.ink);
    return psvg(340, 162, s, '가상 사운드체크 순서');
  };


  /* 실습(X32 사진 위에서 마우스로 조작)은 lessons/modules/x32_photo_sim.js — 2026-11-04 */
})();

/* =========================================================================== 모듈 데이터 */
(function () {
  'use strict';
  var X32 = 'https://cdn-media.empowertribe.com/cdn-cgi/image/width=2000,quality=85,format=auto/e5ba63fb0e6f4e69a1626c5811115e16/Image_BE_0603-ACE_X32_Top_XL.png';   // Behringer 공식 제품 사진(윗면)
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['console-digital'] = {
    id: 'console-digital', path: 'hardware', no: 3, noLabel: '03-2', status: 'ready', level: '중급', minutes: 45, img: X32,
    title: '디지털 콘솔', sub: '화면과 SELECT 로 다루는 콘솔 — Behringer X32',
    overview: {
      lead: '디지털 콘솔은 들어온 소리를 숫자(디지털)로 바꿔서 콘솔 안에서 다듬는 콘솔이에요. 이 과정은 교회와 공연장에서 많이 쓰는 <b>Behringer X32</b> 로 배워요. 소리가 지나가는 순서(GAIN → 다듬기 → 페이더 → 버스)는 03-1 아날로그 콘솔과 똑같아요. 달라지는 것은 다루는 방법이에요. 디지털 콘솔은 채널마다 노브가 따로 있지 않아요. 먼저 <b>SELECT</b> 버튼으로 채널을 골라요. 그다음 <b>화면과 함께 쓰는 노브</b>(공용 노브)로 조절해요. 같은 페이더에 <b>레이어</b>(페이더 줄 바꾸기)로 다른 채널을 불러와 많은 채널을 다뤄요. 설정 전체는 <b>씬</b>으로 저장했다가 한 번에 불러와요.',
      terms: [
        ['SELECT', '채널마다 있는 「고르기」 버튼이에요. 누른 채널 하나의 설정이 화면과 채널 스트립 노브에 나타나요. 한 번에 한 채널만 고를 수 있어요.', 'x32SelectMini'],
        ['채널 스트립', '화면 옆에 모인, 여러 채널이 함께 쓰는 노브들(공용 노브)이에요. SELECT 로 고른 채널을 조절해요. GAIN·+48V·LOW CUT, GATE, COMP, EQ, 버스 보내기가 있어요.'],
        ['레이어', '같은 페이더 16개에 다른 채널 묶음을 불러오는 기능이에요. 책장을 넘기듯 CH 1–16, CH 17–32 로 바꿔요. AUX IN·USB·FX RTN, BUS MASTER 도 불러와요. 오른쪽 8개 페이더에도 DCA · BUS · MATRIX 레이어가 있어요.', 'x32LayerMini'],
        ['믹스 버스 (BUS 1–16)', '모니터·이펙트·녹음용 소리를 따로 섞는 길이에요. 아날로그 콘솔의 AUX 와 같은 역할이에요. X32 에는 16개 있어요.'],
        ['Sends on Fader', '페이더가 맡는 일을 바꾸는 버튼이에요. 「메인으로 섞는 양」 대신 「고른 BUS 로 보내는 양」이 돼요. 모니터 소리를 페이더로 만들 때 써요.', 'x32SofMini'],
        ['DCA', '여러 채널 페이더를 한 번에 움직이는 리모컨 페이더예요. 소리를 한 버스로 모으지는 않아요. X32 에는 8개 있어요.', 'x32DcaMini'],
        ['뮤트 그룹', '여러 채널을 버튼 하나로 한꺼번에 끄고 켜는 기능이에요. X32 에는 6개 있어요.'],
        ['씬 (Scene)', '콘솔 설정 전체를 사진 찍듯 저장해 두는 것이에요. 페이더·MUTE·EQ·라우팅(소리 길)까지 들어가요. 나중에 한 번에 불러와요. 콘솔에 따라 스냅숏 · 큐라고도 불러요. X32 는 씬을 100개 저장할 수 있어요.', 'x32SceneMini']
      ],
      points: [
        '조절하기 전에 <b>화면의 채널 이름과 레이어</b>를 먼저 봐요. 디지털 콘솔 실수는 대부분 「다른 채널을 만지고 있었다」예요.',
        '팬텀 전원(+48V)은 <b>채널마다 따로</b> 켜요. 콘덴서 마이크를 꽂은 채널인지 확인하고, 그 채널만 켜요.',
        '<b>씬을 불러오면 설정이 한꺼번에 바뀌어요.</b> 예배 중에는 꼭 필요할 때만 불러와요. 바꾼 설정은 저장(SAVE)해야 다음 주에도 남아요.'
      ],
      model: 'x32'
    },
    theory: [
      { title: '아날로그와 무엇이 다를까 — 화면 · SELECT · 함께 쓰는 노브', visual: 'x32Surface',
        body: '아날로그 콘솔은 채널마다 GAIN·EQ·AUX 노브가 세로로 한 줄씩 달려 있어요. 디지털 콘솔 X32 는 채널마다 <b>페이더 · SELECT · MUTE · SOLO</b> 만 있어요. 나머지 노브는 화면 옆 <b>채널 스트립</b>에 한 벌만 있어요. 채널의 <b>SELECT</b> 를 누르면 그 채널의 설정이 화면과 채널 스트립에 나타나요. 그때부터 노브는 그 채널만 조절해요. 노브 한 벌을 여러 채널이 돌려 쓰는 셈이에요. 소리 순서는 아날로그와 같아요. 그래서 03-1 에서 배운 원리를 그대로 쓰면 돼요.',
        more: '<ul><li><b>X32 (제조사 자료)</b>: 모터로 저절로 움직이는 페이더가 25개 있어요. 입력 쪽 16개, 버스·DCA 쪽 8개, MAIN LR 1개예요.</li> <li>7인치 컬러 화면이 있어요. 채널마다 이름을 보여 주는 작은 컬러 화면(스크리블 스트립 LCD)도 있어요.</li> <li>채널 스트립은 다섯 구역으로 나뉘어요. CONFIG/PREAMP · GATE/DYNAMICS · EQ · BUS SENDS · MAIN BUS 예요. 구역마다 VIEW 버튼을 누르면 화면에 자세한 설정이 열려요.</li> <li>SELECT 는 한 번에 한 채널만 켜져요. 노브를 돌리기 전에 <b>지금 어느 채널을 골랐는지</b> 화면 위쪽 이름을 꼭 봐요.</li> <li>입력은 마이크 프리앰프 32개(뒷면 XLR)가 있어요. 그 밖에 AUX IN 6개, 스테이지박스(무대에 두는 입력 상자)용 AES50 단자 2개도 있어요.</li> <li>프리앰프를 지난 소리는 <b>AD 변환기</b>에서 숫자로 바뀌어요. X32 는 1초에 48,000번(48 kHz) 소리 크기를 재요. 한 번 잴 때마다 24비트로 아주 잘게 적어요(제조사 자료).</li> <li>숫자로 바꾸고 계산하느라 아주 짧은 지연(<b>레이턴시</b>)이 생겨요. X32 는 입력에서 출력까지 약 0.8 ms(1000분의 1초보다 짧음)라서 귀로는 거의 느끼지 못해요(제조사 자료).</li></ul>',
        check: { q: 'X32 에서 CH5 의 EQ 를 바꾸려고 해요. 가장 먼저 할 일은?', options: [
          { t: 'CH5 의 SELECT 를 누르고, 화면에 CH5 가 나왔는지 본다', ok: true, why: '맞아요. 채널 스트립 노브는 SELECT 로 고른 채널만 조절하기 때문이에요.' },
          { t: 'CH5 위에 있는 EQ 노브를 바로 돌린다', why: '아니에요. 그건 아날로그 콘솔이에요. X32 는 채널마다 EQ 노브가 따로 없어요.' },
          { t: 'CH5 페이더를 끝까지 올린다', why: '아니에요. 페이더는 메인으로 섞는 양이에요. EQ 와는 상관없어요.' }] } },
      { title: '레이어 — 페이더 16개로 더 많은 채널 다루기', visual: 'x32Layers',
        body: 'X32 는 입력 채널이 32개인데, 입력 페이더는 16개뿐이에요. 그래서 왼쪽 <b>레이어 버튼</b>으로 같은 페이더에 다른 채널을 불러와요. 책장을 넘기듯 <b>CH 1–16</b>, <b>CH 17–32</b> 로 바꿔요. <b>AUX IN·USB·FX RTN</b>, <b>BUS MASTER</b> 도 불러와요. 오른쪽 8개 페이더에도 레이어가 있어요. <b>DCA 1–8</b>, <b>BUS 1–8</b>, <b>BUS 9–16</b>, <b>MATRIX 1–6 · MAIN C</b> 예요. 레이어를 바꾸면 모터 페이더가 저절로 움직여요. 새로 불러온 채널들의 위치로 가는 거예요.',
        more: '<ul><li><b>MAIN LR 페이더는 레이어와 상관없이 늘 그 자리</b>에 있어요.</li> <li>레이어를 바꿔도 소리는 바뀌지 않아요. 페이더가 「보여 주는 채널」만 바뀌어요.</li> <li>가장 흔한 실수가 있어요. 레이어가 CH 17–32 인 줄 모르고 1번 페이더를 내리는 거예요. 그러면 실제로는 17번 채널이 내려가요. 페이더 위 이름표(LCD)를 꼭 확인해요.</li> <li>자주 쓰는 채널(보컬·설교)은 1–16 에 두고, 덜 만지는 채널은 17–32 에 둬요. 그러면 예배 중에 레이어를 덜 바꿔도 돼요.</li></ul>',
        check: { q: '레이어가 「CH 17–32」일 때 왼쪽 첫 번째 페이더를 내리면 어느 채널이 내려갈까요?', options: [
          { t: 'CH 17', ok: true, why: '맞아요. 같은 페이더가 지금은 17–32 를 보여 주고 있기 때문이에요.' },
          { t: 'CH 1', why: '아니에요. CH 1 은 「CH 1–16」 레이어일 때 첫 번째 페이더예요.' },
          { t: 'MAIN LR', why: '아니에요. MAIN LR 은 오른쪽 끝에 따로 있는 페이더예요.' }] } },
      { title: '채널 다듬기 — 프리앰프 · LOW CUT · GATE · EQ · COMP', visual: 'x32Chain',
        body: '모든 입력 채널에 같은 다듬기 도구가 들어 있어요. 하나씩 볼게요. <b>프리앰프</b>는 소리를 키워요. GAIN · +48V · 극성 뒤집기(Ø) 버튼이 여기 있어요. <b>LOW CUT</b> 은 낮은 저음을 걸러요. 아날로그의 HPF 와 같고, 거르는 높이(주파수)를 바꿀 수 있어요. <b>GATE</b> 는 작은 잡음이 들어오지 못하게 문을 닫아요. <b>4밴드 EQ</b> 는 네 칸으로 음색을 다듬어요. <b>COMP</b> 는 큰 소리를 눌러 크기를 고르게 해요. MG12XU 는 팬텀 스위치가 하나예요. 하지만 X32 는 <b>+48V 를 채널마다 따로</b> 켜고 꺼요.',
        more: '<ul><li><b>극성 뒤집기(Ø)</b>는 XLR 의 2번·3번 핀 신호를 맞바꿔 파형을 위아래로 뒤집어요. 스네어 드럼 위·아래 마이크처럼 두 마이크 소리가 서로 깎아 먹을 때, 한쪽에 켜요. 위상 반전이라고도 불러요.</li> <li><b>X32 (제조사 자료)</b>: 입력 채널 EQ 는 4칸(4밴드)이에요. BUS·MAIN·MATRIX 의 EQ 는 6칸(6밴드)이에요.</li> <li>컴프레서는 EQ 앞이나 뒤로 순서를 바꿀 수 있어요.</li> <li>GATE·EQ·COMP 는 채널 스트립 버튼으로 켜고 꺼요. VIEW 를 누르면 화면에서 자세히 조절해요. 자세한 사용법은 「믹싱 스킬」의 EQ · Gate · Compressor 과정에서 연습해요.</li> <li>X32 안에는 이펙트 자리(FX 슬롯)가 8개 있어요. 1–4번은 보내기용과 삽입용(인서트) 모두로 써요. 5–8번은 삽입용으로만 써요. 삽입은 채널 중간에 이펙트를 끼워 넣는 방식이에요.</li> <li>디지털 미터의 <b>0 dBFS</b> 는 더 커질 수 없는 맨 꼭대기예요. 평소 소리(표준 운용 레벨)는 보통 −18 ~ −20 dBFS 쯤에 둬요. 미터 색이 초록에서 노랑으로 바뀌는 곳 근처예요. 그래야 갑자기 큰 소리가 와도 여유가 있어요.</li> <li>디지털 콘솔은 할 수 있는 게 많아요. 그래도 <b>처음에는 GAIN · LOW CUT · MUTE · 페이더</b>만으로도 예배를 충분히 운영할 수 있어요.</li></ul>',
        check: { q: '설교 구즈넥 마이크(목이 길게 휘는 콘덴서 마이크) 채널에서 소리가 전혀 안 나요. X32 에서 가장 먼저 볼 것은?', options: [
          { t: '그 채널을 SELECT 하고 +48V 가 켜져 있는지 본다', ok: true, why: '맞아요. 콘덴서 마이크는 팬텀 전원이 있어야 동작해요. X32 는 채널마다 따로 켜요.' },
          { t: '모든 채널의 +48V 를 한꺼번에 켠다', why: '아니에요. 필요 없는 장비에까지 전기가 갈 수 있어요. 필요한 채널만 켜요.' },
          { t: 'EQ 의 고음을 올린다', why: '아니에요. 신호가 아예 없으면 EQ 를 바꿔도 소리가 나지 않아요.' }] } },
      { title: '모니터 믹스 — BUS 와 Sends on Fader', visual: 'x32Sof',
        body: 'X32 는 <b>믹스 버스(BUS) 16개</b>로 무대 모니터·이펙트·방송용 소리를 따로 만들어요. 아날로그의 AUX 와 같은 일이에요. 채널마다 BUS 로 보내는 양은 채널 스트립의 BUS SENDS 노브로 바꿀 수 있어요. 그런데 <b>Sends on Fader</b> 를 쓰면 더 쉬워요. Sends on Fader 를 켜고 BUS 하나를 골라요. 예를 들면 BUS 1(인도자 모니터)이에요. 그러면 입력 페이더가 잠시 <b>「BUS 1 로 보내는 양」</b>으로 바뀌어요. 페이더로 모니터 소리를 만든 뒤 다시 꺼요. 그러면 페이더는 메인 위치로 돌아와요.',
        more: '<ul><li><b>X32 (제조사 자료)</b>: Sends on Fader 는 믹스 버스 1–16 에만 쓸 수 있어요. DCA · MAIN · MATRIX 에는 쓰지 않아요.</li> <li>버튼을 1초 넘게 누르면 켜진 채로 있어요.</li> <li>BUS 로 보내는 곳은 화면에서 고를 수 있어요(입력, EQ 앞·뒤, 페이더 앞·뒤 등). 무대 모니터는 보통 <b>페이더 앞(PRE)</b>에서 보내요. 그래야 메인 페이더를 움직여도 모니터가 그대로예요.</li> <li>Sends on Fader 를 켠 채 잊으면 문제가 생겨요. 메인을 만진다고 생각했는데, 실제로는 모니터를 바꾸게 돼요. 화면과 버튼 불빛을 늘 보고, 다 쓰면 꺼요.</li> <li>BUS 를 나눠 쓰는 예를 볼게요. 6개 정도는 모니터, 2개는 리버브·딜레이 같은 이펙트에 써요. 1–2개는 방송·녹음용이에요(교회마다 달라요).</li></ul>',
        check: { q: 'Sends on Fader 를 켜고 BUS 1(인도자 모니터)을 골랐어요. 이때 CH1 보컬 페이더를 올리면?', options: [
          { t: '인도자 모니터의 보컬이 커지고, 회중석 메인은 그대로다', ok: true, why: '맞아요. 지금 페이더는 BUS 1 로 보내는 양이기 때문이에요.' },
          { t: '회중석 메인의 보컬이 커진다', why: '아니에요. Sends on Fader 가 켜져 있으면 페이더는 BUS 로 보내는 양이에요.' },
          { t: '모든 모니터가 함께 커진다', why: '아니에요. 고른 BUS 1 로 보내는 양만 바뀌어요.' }] } },
      { title: 'DCA 와 뮤트 그룹 — 여러 채널 한 번에', visual: 'x32Dca',
        body: '<b>DCA</b> 는 여러 채널 페이더를 한 번에 움직이는 리모컨 페이더예요. 예를 들어 DCA 1 에 기타·건반·베이스·드럼을 넣어 둬요. 그러면 DCA 1 페이더 하나로 악기 전체를 함께 줄이고 키울 수 있어요. 이때 채널 페이더는 제자리에 있어요. 실제로 나가는 크기만 함께 바뀌어요. <b>뮤트 그룹</b>은 정해 둔 채널들을 버튼 하나로 한꺼번에 끄고 켜요. X32 에는 DCA 8개, 뮤트 그룹 6개가 있어요.',
        more: '<ul><li><b>DCA 와 GROUP 의 차이</b>: 아날로그의 GROUP 은 소리를 실제로 한 버스에 모아요. DCA 는 소리를 모으지 않고 「크기를 바꾸라는 명령」만 보내요. 그래서 DCA 로 줄여도 각 채널이 보내는 모니터(PRE)는 그대로예요.</li> <li>DCA 는 SELECT 할 수 없어요(제조사 자료). DCA 에 넣을 채널은 화면에서 정해요.</li> <li>뮤트 그룹 버튼은 MAIN LR 페이더 오른쪽에 있어요. 설교 시간에 찬양팀 마이크를 한 번에 끄고, 다음 찬양 때 한 번에 켜는 데 많이 써요.</li> <li>뮤트 그룹으로 끈 채널은 채널 MUTE 버튼에도 불이 켜져요. 「왜 소리가 안 나지?」 싶을 때 뮤트 그룹 버튼부터 확인해요.</li></ul>',
        check: { q: '찬양 중 악기 소리 전체를 조금 줄이고 싶어요. 악기끼리의 크기 비율은 그대로 두려면?', options: [
          { t: '악기들이 들어 있는 DCA 페이더를 내린다', ok: true, why: '맞아요. DCA 는 넣어 둔 채널들을 같은 양만큼 함께 움직이기 때문이에요.' },
          { t: '악기 채널 페이더를 하나씩 비슷하게 내린다', why: '할 수는 있어요. 하지만 느리고 비율이 흐트러지기 쉬워요.' },
          { t: '악기 채널의 GAIN 을 내린다', why: '아니에요. GAIN 은 입력 크기라서 모니터(PRE)까지 함께 줄어요.' }] } },
      { title: '씬과 패치 — 저장 · 불러오기 · 어디서 어디로', visual: 'x32Scene',
        body: '<b>씬</b>은 콘솔 설정 전체를 저장한 것이에요. 페이더·MUTE·EQ·라우팅(소리 길)까지 모두 들어가요. 게임의 「저장하기」와 비슷해요. 리허설 때 맞춘 설정을 「주일 1부 예배」로 <b>저장(SAVE)</b>해 둬요. 그러면 다음 주에 <b>불러와서(GO)</b> 같은 상태로 시작할 수 있어요. <b>패치</b>는 소리가 어디서 들어와 어디로 나갈지 정하는 일이에요. 어떤 입력 단자(콘솔 뒷면, 스테이지박스)를 몇 번 채널로 받을지 정해요. 어떤 BUS 를 몇 번 출력 단자로 내보낼지도 정해요. 아날로그 콘솔은 케이블을 꽂는 자리로 정해져요. 디지털 콘솔은 화면(ROUTING)에서 정해요.',
        more: '<ul><li><b>X32 (제조사 자료)</b>: 씬을 100개 저장할 수 있어요. 설정 일부만 저장하고 불러오는 스니펫(Snippet)도 있어요.</li> <li><b>세이프(Safe)</b>: 씬을 불러와도 바뀌면 안 되는 채널이나 설정을 정해 두는 기능이에요. 예: 설교 마이크 GAIN, 출력 패치.</li> <li>씬을 불러오면 페이더가 모터로 한꺼번에 움직여요. 그래서 <b>예배 중에는 꼭 필요한 때만</b> 불러와요. 불러오기 전에 지금 상태를 다른 번호로 저장해 두면 되돌릴 수 있어요.</li> <li>바꾼 설정은 저장해야 남아요. 저장하지 않으면 다음에 그 씬을 불러올 때 사라져요. 예배 후 「이번 주 설정」을 저장할지 팀에서 정해 두세요.</li> <li>패치를 잘못 바꾸면 모든 채널 소리가 엉뚱한 곳으로 갈 수 있어요. 그래서 패치는 담당자만 바꿔요.</li></ul>',
        check: { q: '리허설에서 맞춘 콘솔 설정을 다음 주 같은 예배에도 쓰고 싶어요. 알맞은 방법은?', options: [
          { t: '씬으로 저장(SAVE)하고, 다음 주에 불러온다(GO)', ok: true, why: '맞아요. 씬은 설정 전체를 저장했다가 한 번에 불러오기 때문이에요.' },
          { t: '페이더 위치를 사진으로 찍어 두고 다음 주에 맞춘다', why: '아니에요. 페이더 말고도 EQ·GATE·BUS 보내기 등 저장할 것이 많아요. 씬이 훨씬 정확해요.' },
          { t: '전원만 끄지 않으면 그대로 남는다', why: '아니에요. 다른 예배나 행사에서 설정이 바뀌면 사라져요. 씬으로 저장해요.' }] } }
    ],
    practice: {
      kind: 'x32Photo',
      lead: 'MG12XU 실습처럼 실제 X32 사진 위에서 마우스로 조작해요. 페이더와 노브는 끌어서 움직이고, 버튼은 눌러요. 입력 레이어 버튼으로 CH 1–16 과 17–32 를 바꿔요. SELECT 로 고른 채널은 위쪽 채널 스트립 노브와 화면으로 다뤄요. 예시 교회에서는 1–16 번이 찬양팀 · 성가대예요. 17–20 번은 설교 · 사회 · 영상이에요.',
      note: '사진: Behringer 공식 제품 사진. 페이더 · 노브 · 버튼 · 이름표 · 미터 · 화면은 사진 위에 겹쳐 그렸어요. 소리 크기(dB)와 미터는 공부용으로 비슷하게 만든 값(교육용 근사)이에요. AUX · FX · MATRIX 레이어와 ASSIGN 은 모양만 있어요.',
      tasks: [
        { id: 'p48', title: '레이어 바꿔 채널 찾고 48V 켜기', text: '왼쪽 입력 레이어 버튼 CH 17–32 를 누르세요. 이름표가 「설교」인 CH 17 의 SELECT 를 눌러요. 그다음 CONFIG / PREAMP 의 48V 를 켜세요.' },
        { id: 'gain', title: 'GAIN 노브로 입력 맞추기', text: 'GAIN 노브를 위아래로 끌어 보세요. 입력 미터는 CONFIG 옆 불빛과 화면 아래 막대예요. 미터의 가장 큰 순간이 −18 ~ −6 dBFS 에 오게 해요. dBFS 는 0 이 맨 꼭대기(더 커질 수 없는 끝)인 디지털 눈금이에요.' },
        { id: 'lowcut', title: 'LOW CUT 으로 저음 정리', text: 'LOW CUT 버튼을 켜세요. FREQUENCY 노브로 80 ~ 150 Hz 에 맞춰요(화면에 Hz 가 나와요). 구즈넥 마이크의 쿵쿵거리는 잡음이 줄어요.' },
        { id: 'sof', title: 'Sends on Fader 로 모니터 보내기', text: 'SENDS ON FADER 를 누르세요. 오른쪽 BUS 1–8 레이어에서 BUS 1(인도자 모니터)의 SELECT 를 눌러요. 그다음 CH 1–16 레이어로 돌아가 CH1 인도자 페이더를 −10 dB 이상으로 올리세요.' },
        { id: 'dca', title: 'DCA 로 악기 한 번에 줄이기', text: 'SENDS ON FADER 를 끄세요. 오른쪽 GROUP DCA 1–8 레이어에서 DCA 1 「악기」 페이더를 −10 dB 이하로 내려요. 악기 채널 페이더는 그대로예요.' },
        { id: 'scene', title: '씬 불러오기로 되돌리기', text: '설정을 바꾼 상태에서 해요. SCENES 의 PREV · NEXT 로 「01 주일 1부 예배」를 고르고 GO 를 누르세요. 처음 설정으로 돌아가요. UNDO 로 다시 되돌릴 수도 있어요.' }
      ],
      links: [
        { title: 'CL5 콘솔 트레이닝', text: '다른 디지털 콘솔(Yamaha CL5)로 연습해요. 예배 순서에 맞춰 채널을 켜고 DCA 를 다뤄 봐요.', go: { tab: 'tab5' } },
        { title: 'MG12XU 실습', text: '같은 일을 아날로그 콘솔에서는 어떻게 하는지 비교해 봐요.', go: { tab: 'tab6' } }
      ]
    },
    quiz: [
      { q: '예배 중 CH 3 보컬을 줄이려고 왼쪽 세 번째 페이더를 내렸어요. 그런데 엉뚱한 채널이 줄었어요. 그림을 보고 이유를 골라 보세요.', visual: 'x32QuizLayer', options: [
        { t: '레이어가 CH 1–16 이 아니었다', ok: true, why: '맞아요. 같은 페이더가 다른 레이어의 채널을 맡고 있었을 거예요. 이름표를 먼저 확인해요.' },
        { t: 'SELECT 가 켜져 있지 않아서', why: '아니에요. 페이더는 SELECT 와 상관없이 움직여요.' },
        { t: '씬이 저장되지 않아서', why: '아니에요. 씬 저장은 지금 페이더가 어느 채널인지와 상관없어요.' }] },
      { q: 'Sends on Fader 를 켜 둔 걸 깜빡 잊고 메인 소리를 조절했어요. 어떤 일이 생길까요?', options: [
        { t: '메인 대신 고른 BUS(모니터)로 보내는 양이 바뀐다', ok: true, why: '맞아요. 그래서 다 쓰면 Sends on Fader 를 꼭 꺼요.' },
        { t: '메인과 모니터가 함께 바뀐다', why: '아니에요. Sends on Fader 가 켜져 있으면 페이더는 BUS 로 보내는 양만 바꿔요.' },
        { t: '아무것도 바뀌지 않는다', why: '아니에요. 고른 BUS 로 보내는 양이 바뀌어요.' }] },
      { q: '그림처럼 찬양팀 악기 8채널이 든 DCA 1 을 6 dB 내렸어요. 악기 채널 페이더와 PRE 로 보내는 무대 모니터는 어떻게 될까요?', visual: 'x32QuizDca', options: [
        { t: '채널 페이더는 제자리, PRE 모니터도 그대로다', ok: true, why: '맞아요. DCA 는 실제로 나가는 크기만 바꿔요. 페이더 앞(PRE)에서 보내는 모니터에는 영향이 없어요.' },
        { t: '채널 페이더가 모두 6 dB 만큼 내려간다', why: '아니에요. DCA 는 채널 페이더를 움직이지 않아요. 나가는 크기만 바꿔요.' },
        { t: '모니터도 모두 6 dB 줄어든다', why: '아니에요. PRE 로 보내는 모니터는 페이더·DCA 보다 앞이라 그대로예요.' }] },
      { q: 'X32 의 팬텀 전원(+48V)에 대한 설명으로 맞는 것은?', options: [
        { t: '입력 채널마다 따로 켜고 끌 수 있다', ok: true, why: '맞아요. 그래서 콘덴서 마이크 채널만 골라서 켜요.' },
        { t: '스위치 하나로 모든 채널에 한꺼번에 들어간다', why: '아니에요. 그건 MG12XU 같은 아날로그 콘솔이에요.' },
        { t: '씬을 불러오면 항상 모두 꺼진다', why: '아니에요. 팬텀 설정도 콘솔 설정의 일부예요. 세이프로 지정해 둘 수도 있어요.' }] },
      { q: '리허설 뒤 설정을 저장하지 않았어요. 다음 주에 「주일 1부 예배」 씬을 불러오면 어떻게 될까요?', options: [
        { t: '리허설에서 바꾼 것은 사라지고, 예전에 저장한 설정으로 돌아간다', ok: true, why: '맞아요. 씬에는 마지막으로 저장한 상태만 들어 있기 때문이에요.' },
        { t: '리허설 설정이 자동으로 들어 있다', why: '아니에요. 저장(SAVE)하지 않으면 씬에 들어가지 않아요.' },
        { t: '콘솔이 꺼진다', why: '아니에요. 씬을 불러와도 콘솔은 꺼지지 않아요. 설정만 바뀌어요.' }] }
    ],
    missions: [
      { title: 'CL5 콘솔 트레이닝 · 예배 식순 운영', text: '디지털 콘솔에서 예배 순서에 맞춰 채널을 켜고 꺼요. DCA 로 여러 채널 크기를 함께 다뤄요.', go: { tab: 'tab5' } },
      { title: '음향 트러블슈팅 · 미션 A', text: '입력은 있는데 소리가 안 날 때를 연습해요. 레이어·MUTE·뮤트 그룹·페이더 순서로 막힌 곳을 찾아요.', go: { tab: 'tab7', ts: 'A' } }
    ],
    deeper: [
      { title: '스테이지박스와 AES50', text: 'X32 뒷면에는 <b>AES50</b> 단자가 2개 있어요. 무대에 둔 스테이지박스(마이크를 꽂는 입력 상자)와 랜선 한 가닥으로 이어요. 이 선으로 마이크 소리를 디지털로 주고받아요.', visual: 'x32StageboxMini', more: '<ul><li><b>X32 (제조사 자료)</b>: AES50 단자 하나로 48채널을 받고 48채널을 보내요. Cat-5e 케이블(랜선의 한 종류)로 최대 100 m 까지 이어요.</li> <li>굵은 아날로그 멀티 케이블 대신 랜선 한 가닥이라 설치가 쉬워요. 대신 그 선이 빠지면 무대 쪽 채널이 한꺼번에 끊겨요. 그래서 케이블 보호와 예비선이 중요해요.</li> <li>어떤 스테이지박스 입력을 몇 번 채널로 받을지는 화면의 ROUTING(패치)에서 정해요.</li> <li>디지털 콘솔은 세 부분으로 나눠 생각할 수 있어요. 손으로 만지는 <b>조작면</b>, 계산을 맡는 <b>DSP 엔진</b>이 있어요. 소리가 들고 나는 <b>입출력 상자</b>(스테이지박스 · I/O 랙)도 있어요. X32 는 조작면 안에 셋이 다 들어 있고, 스테이지박스를 더 붙일 수 있어요.</li></ul>' },
      { title: '멀티트랙 녹음과 가상 사운드체크', text: 'X32 에는 <b>X-USB 카드</b>가 기본으로 들어 있어요. 이 카드로 컴퓨터에 32채널을 따로따로 녹음할 수 있어요. 녹음한 소리를 다시 콘솔 채널로 틀 수도 있어요.', visual: 'x32VirtualSc', more: '<ul><li><b>X32 (제조사 자료)</b>: X-USB 카드는 USB 2.0 으로 32채널을 받고 32채널을 보내요. 따로 사는 카드인 X-LIVE 는 SD 카드에 32채널을 바로 녹음해요.</li> <li><b>가상 사운드체크</b>: 주일 예배를 채널별로 녹음해 둬요. 평일에 그 소리를 콘솔 채널로 다시 틀어요. 그러면 찬양팀 없이도 EQ·컴프·밸런스를 연습할 수 있어요. 봉사자 훈련에 아주 좋아요.</li> <li>틀 때는 채널 입력을 「녹음 재생」으로 바꿔요. 예배 전에는 꼭 원래(마이크 입력)로 돌려놔요.</li></ul>' },
      { title: '원격 조작 앱', text: '태블릿이나 노트북으로 X32 를 조절할 수 있어요. 회중석에서 소리를 들으며 조절할 때 써요. 연주자가 자기 모니터를 직접 맞출 때도 써요.', more: '<ul><li><b>X32-Edit</b>: PC·Mac·Linux 용 제조사 프로그램이에요. 콘솔 없이 미리 씬을 만들어 볼 수도 있어요(오프라인).</li> <li><b>MX-Mix · MX-Q</b>: 지금 제조사가 안내하는 태블릿·휴대폰 앱이에요. 예전 앱 X32-Mix · X32-Q 는 오래 업데이트되지 않았어요. Mixing Station 같은 다른 회사 앱도 있어요.</li> <li>여러 사람이 동시에 만지면 서로 설정을 바꿔 버릴 수 있어요. 누가 무엇을 조절할지 정해요. 연주자 앱은 자기 모니터만 바꾸게 설정해요.</li></ul>' }
    ],
    sources: [
      { t: 'Behringer X32 제품 페이지 — 프리앰프 32개 · 채널별 팬텀 · 모터 페이더 25개 · 7인치 화면 · AES50 2개 · X-USB · DCA 8 · 뮤트 그룹 6 · 씬 100', url: 'https://www.behringer.com/en/products/0603-ace' },
      { t: 'Behringer X32 Quick Start Guide — 레이어 버튼 · 채널 스트립 · Sends on Fader · FX 슬롯', url: 'https://www.heliart.ee/static/custom/File/Tooteinfo/quick_start/Behringer_X32_QSG.pdf' },
      { t: 'Behringer X32 User Manual — 버스 16 · 매트릭스 6 · 입력 EQ 4밴드 · 버스 EQ 6밴드 · AES50 48×48', url: 'https://media.vsl-uk.com/manuals/sound/Behringer_X32_User_Manual.pdf' },
      { t: 'Behringer X32 User Manual — Scenes 화면 · Safes (ManualsLib)', url: 'https://manualslib.com/manual/453343/Behringer-X32-Digital-Mixer.html?page=63' },
      { t: 'Behringer X-LIVE 확장 카드', url: 'https://www.behringer.com/en/products/0606-ABU' },
      { t: 'Behringer MX-Mix · MX-Q 앱 안내 — Sweetwater', url: 'https://www.sweetwater.com/sweetcare/articles/behringer-mx-mix-and-mx-q-mobile-apps-quickstart-guide/' },
      { t: '사진: Behringer X32 공식 제품 사진 (윗면 · 뒷면 · 옆면) — 3D 모델 배치도 이 사진들을 기준으로 맞춤', url: 'https://www.behringer.com/en/products/0603-ace' },
      { t: 'Behringer X32 User Manual 사양 — AD/DA 24비트 44.1/48 kHz · 로컬 입출력 지연 0.8 ms (ManualsLib)', url: 'https://www.manualslib.com/manual/1126904/Behringer-X32.html?page=24' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 4장 3절 디지털 믹싱 콘솔: 아날로그와 비교 · 구성(조작면 · I/O 랙 · DSP 엔진) · 라우팅 · 레이어 · 씬(스냅숏 · 큐) · 원격 제어 · 가상 사운드 체크 · 센드 온 페이더 p.131–136', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 4장 극성 반전 p.125 · 표준 운용 레벨 p.137–138, 2장 디지털 변환 · 레이턴시 p.43–50, 10장 EBU · SMPTE 표준 레벨 p.314–315', url: '' }
    ]
  };
})();
