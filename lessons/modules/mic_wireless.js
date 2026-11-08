/* =============================================================================
   01-2 무선 마이크 — 2026-11-04
   - STA_MODULES['mic-wireless'] (모듈 데이터) + STAVisuals.wl* (그림 6개) + STASims.wirelessBench (실습)
   - 01-1 유선 마이크(modules_data.js 의 'mic')가 다이내믹·콘덴서, 지향성, 거리, 근접 효과, 팬텀 전원을 다루므로 여기서는 「무선」에서 더해지는 것만 다룸
   - 우리나라 주파수 규정은 과학기술정보통신부 고시 「신고하지 아니하고 개설할 수 있는 무선국용 무선기기」(제2026-9호)·KCA 안내 기준.
     실습 화면의 다른 신호·RF 칸 수·미터 값·간격 기준(0.4 MHz)은 교육용 근사
   ============================================================================= */
(function () {
  'use strict';
  var V = window.STAVisuals = window.STAVisuals || {};
  var C = { ink: '#0f1f33', sub: '#51627a', line: '#cbd5e1', bg: '#f8fafc', blue: '#2563eb', teal: '#0e7490', orange: '#ea580c', purple: '#7c3aed', red: '#dc2626', green: '#059669', amber: '#d97706' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 500) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '">' + s + '</text>'; }
  function rect(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 8 : r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.5"' : '') + '/>'; }
  function arrow(x1, y1, x2, y2, col) { var a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 7 * Math.cos(a), hy = y2 - 7 * Math.sin(a); return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="2.4" fill="none"/><path d="M' + x2 + ' ' + y2 + 'L' + (hx - 4 * Math.sin(a)) + ' ' + (hy + 4 * Math.cos(a)) + 'L' + (hx + 4 * Math.sin(a)) + ' ' + (hy - 4 * Math.cos(a)) + 'Z" fill="' + col + '"/>'; }
  function waves(x, y, col) { var s = ''; [14, 26, 38].forEach(function (r, i) { s += '<path d="M' + (x + r * 0.7) + ' ' + (y - r * 0.7) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + r * 0.7) + ' ' + (y + r * 0.7) + '" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-opacity="' + (1 - i * 0.25) + '"/>'; }); return s; }
  function handheld(x, y, col) {   // (x, y) = 그릴 가운데
    return '<path d="M' + (x - 9) + ' ' + (y + 12) + 'L' + (x - 6) + ' ' + (y + 84) + 'Q' + x + ' ' + (y + 90) + ' ' + (x + 6) + ' ' + (y + 84) + 'L' + (x + 9) + ' ' + (y + 12) + 'Z" fill="#334155"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="15" fill="#94a3b8" stroke="#475569" stroke-width="2"/><path d="M' + (x - 10) + ' ' + y + 'H' + (x + 10) + 'M' + x + ' ' + (y - 10) + 'V' + (y + 10) + '" stroke="#64748b"/>' +
      rect(x - 5, y + 40, 10, 14, col || '#22d3ee', null, 2);
  }
  function antenna(x, y, lab, col, h) { h = h || 30; return '<path d="M' + x + ' ' + y + 'V' + (y - h) + '" stroke="' + (col || C.ink) + '" stroke-width="3" stroke-linecap="round"/><circle cx="' + x + '" cy="' + (y - h) + '" r="3.5" fill="' + (col || C.ink) + '"/>' + (lab ? t(x, y - h - 8, lab, { size: 11, weight: 800, fill: col || C.ink }) : ''); }
  function cells(x, y, n, col) { var s = rect(x, y, 34, 12, '#0b1220', '#94a3b8', 2) + rect(x + 34, y + 3, 3, 6, '#94a3b8', null, 1); for (var i = 0; i < 5; i++) s += rect(x + 2 + i * 6.4, y + 2, 5, 8, i < n ? col : '#1f2937', null, 1); return s; }

  /* ---------------------------------------------------------------- 그림 1: 시스템 구성 */
  V.wlSystem = function () {
    var s = t(300, 18, '무선 마이크 = 마이크 → 송신기 → 전파 → 수신기 → 콘솔', { size: 12, weight: 800 });
    s += handheld(62, 52, '#22d3ee') + t(62, 166, '핸드헬드 송신기', { size: 11.5, weight: 800 }) + t(62, 182, '인도자 · 사회자', { size: 10, fill: C.sub });
    // 벨트팩 + 헤드셋
    s += '<circle cx="168" cy="56" r="17" fill="none" stroke="#475569" stroke-width="2"/><path d="M152 58 Q150 74 160 76 L178 74" fill="none" stroke="#475569" stroke-width="2"/><circle cx="180" cy="74" r="3.5" fill="#334155"/>';
    s += '<path d="M168 74 Q164 96 160 112" fill="none" stroke="#64748b" stroke-width="1.6"/>' + rect(140, 112, 42, 50, '#334155', null, 6) + rect(146, 120, 30, 10, '#22d3ee', null, 2) + '<path d="M176 112 V96" stroke="#334155" stroke-width="3"/>';
    s += t(162, 180, '벨트팩 + 헤드셋', { size: 11.5, weight: 800 }) + t(162, 196, '목사님 (핀 마이크도 꽂아요)', { size: 10, fill: C.sub });
    s += waves(198, 100, C.blue);
    // 수신기
    s += rect(282, 92, 168, 62, '#1f2933', '#0b0f14', 8) + antenna(298, 92, 'A', C.blue, 34) + antenna(434, 92, 'B', C.blue, 34);
    s += t(366, 118, '다이버시티 수신기', { size: 12, weight: 800, fill: '#e2e8f0' }) + t(366, 136, '925.5 MHz · RF ▮▮▮▮ · AUDIO', { size: 9.5, fill: '#94a3b8' });
    s += arrow(452, 123, 500, 123, C.teal) + t(476, 114, 'XLR', { size: 10, fill: C.teal, weight: 700 });
    s += rect(502, 92, 90, 62, '#fff', C.teal, 8) + t(547, 118, '콘솔 채널', { size: 12, weight: 800, fill: C.teal }) + t(547, 136, 'GAIN · 페이더', { size: 9.5, fill: C.sub });
    s += t(366, 176, '송신기 전파를 받아 다시 소리 신호로', { size: 10, fill: C.sub }) + t(547, 176, '보통 마이크 채널과 같아요', { size: 10, fill: C.sub });
    s += rect(10, 206, 580, 26, '#eff6ff', '#bfdbfe', 6) + t(300, 223, '송신기와 수신기는 같은 주파수(예: 925.5 MHz)로 짝을 맞춰야 소리가 나요', { size: 11, weight: 700, fill: C.blue });
    return svg(600, 238, s, '무선 마이크 시스템의 구성: 송신기, 수신기, 안테나, 콘솔');
  };

  /* ---------------------------------------------------------------- 그림 2: 우리나라 대역 */
  V.wlBands = function () {
    var s = t(300, 18, '우리나라 무선마이크 주파수 (2026년 고시 · KCA 안내 기준 — 바뀔 수 있어요)', { size: 11.5, weight: 800 });
    function card(x, col, bg, badge, head, lines, cross) {
      var b = rect(x, 30, 188, 160, bg, col, 10) + rect(x + 10, 40, 82, 20, col, null, 10) + t(x + 51, 54, badge, { size: 10, weight: 800, fill: '#fff' });
      b += t(x + 94, 84, head[0], { size: 14, weight: 800, fill: col }) + t(x + 94, 101, head[1], { size: 10, fill: C.sub });
      lines.forEach(function (L, i) { b += t(x + 94, 126 + i * 19, L, { size: 10.5, weight: i === 0 ? 700 : 500 }); });
      if (cross) b += '<path d="M' + (x + 150) + ' 42 l24 24 M' + (x + 174) + ' 42 l-24 24" stroke="' + col + '" stroke-width="4" stroke-linecap="round"/>';
      return b;
    }
    s += card(8, C.blue, '#eff6ff', '허가 필요', ['470 – 698 MHz', '지상파 TV 채널 14–51 과 같은 대역'], ['허가를 받아 사용', '쓰는 TV 채널을 피해 골라요', '전파관리소에 물어보기']);
    s += card(206, C.red, '#fef2f2', '사용 불가', ['742 – 752 MHz', '옛 「700 MHz 대역」'], ['휴대폰 통신용으로 바뀜', '2013년 판매·사용 중지', '2021년부터 단속 대상'], true);
    s += card(404, C.green, '#ecfdf5', '신고 없이', ['925 – 937.5 MHz', '소리 보내는 기기용 대역'], ['신고 없이 사용', '전파 세기 10 mW 이하', '예: Shure 한국 모델 X51 · X7']);
    s += t(300, 210, '근거: 과기정통부 고시 「신고하지 아니하고 개설할 수 있는 무선국용 무선기기」(제2026-9호) · KCA 안내(2021)', { size: 9.5, fill: C.sub });
    s += t(300, 226, '같은 고시 표에는 173.02–173.28 MHz · 217.25–220.11 MHz 같은 낮은 대역도 있어요', { size: 9.5, fill: C.sub });
    return svg(600, 234, s, '우리나라 무선마이크 주파수 대역: 470-698 MHz 허가, 742-752 MHz 사용 불가, 925-937.5 MHz 신고 없이');
  };

  /* ---------------------------------------------------------------- 그림 3: 혼변조 */
  V.wlIntermod = function () {
    var s = t(300, 18, '혼변조 — 송신기 두 대가 만드는 가짜 신호 (3차: 2×f1 − f2, 2×f2 − f1)', { size: 11.5, weight: 800 });
    var X = function (f) { return 60 + (f - 925) * 96; }, y0 = 150;
    s += '<path d="M40 ' + y0 + 'H560" stroke="#94a3b8" stroke-width="1.5"/>';
    [925, 926, 927, 928, 929, 930].forEach(function (f) { s += '<path d="M' + X(f) + ' ' + y0 + 'v5" stroke="#94a3b8"/>' + t(X(f), y0 + 18, f + ' MHz', { size: 9.5, fill: C.sub }); });
    s += rect(X(927) - 6, 62, 12, y0 - 62, C.blue, null, 2) + t(X(927), 54, 'f1 = 927 (①)', { size: 10.5, weight: 800, fill: C.blue });
    s += rect(X(928) - 6, 62, 12, y0 - 62, C.blue, null, 2) + t(X(928), 54, 'f2 = 928 (②)', { size: 10.5, weight: 800, fill: C.blue });
    s += rect(X(926) - 5, 112, 10, y0 - 112, C.orange, null, 2) + t(X(926), 104, '2×927 − 928 = 926', { size: 10, weight: 700, fill: C.orange });
    s += '<rect x="' + (X(929) - 8) + '" y="62" width="16" height="' + (y0 - 62) + '" rx="2" fill="none" stroke="' + C.purple + '" stroke-width="2" stroke-dasharray="4 3"/>';
    s += rect(X(929) - 5, 112, 10, y0 - 112, C.orange, null, 2) + t(X(929) + 14, 120, '2×928 − 927 = 929', { size: 10, weight: 700, fill: C.orange, anchor: 'start' });
    s += t(X(929), 54, '③ 을 929 에 두면', { size: 10.5, weight: 800, fill: C.red }) + t(X(929) + 14, 80, '겹쳐서 잡음!', { size: 10.5, weight: 800, fill: C.red, anchor: 'start' });
    s += '<path d="M' + (X(929) - 9) + ' 90 l18 18 M' + (X(929) + 9) + ' 90 l-18 18" stroke="' + C.red + '" stroke-width="3" stroke-linecap="round"/>';
    [['① 송신기 끄고 스캔', C.teal], ['② 빈 곳 · 혼변조 피해 고르기', C.orange], ['③ IR 창 맞대고 SYNC', C.purple]].forEach(function (b, i) {
      var x = 14 + i * 196; s += rect(x, 182, 176, 28, '#fff', b[1], 6) + t(x + 88, 201, b[0], { size: 11, weight: 800, fill: b[1] }); if (i < 2) s += arrow(x + 178, 196, x + 194, 196, '#94a3b8');
    });
    return svg(600, 216, s, '혼변조: 927 MHz 와 928 MHz 가 926 MHz 와 929 MHz 에 가짜 신호를 만든다');
  };

  /* ---------------------------------------------------------------- 그림 4: 다이버시티와 안테나 자리 */
  V.wlDiversity = function () {
    var s = t(166, 18, '위에서 본 예배당 (그림용 단순화)', { size: 11, fill: C.sub });
    s += rect(14, 28, 306, 198, '#f8fafc', C.line, 8) + rect(24, 34, 286, 34, '#fef3c7', '#fcd34d', 6) + t(60, 56, '무대', { size: 10.5, weight: 700, fill: '#92400e' });
    s += '<circle cx="170" cy="52" r="11" fill="' + C.purple + '"/>' + t(170, 56, '②', { size: 10, weight: 800, fill: '#fff' });
    s += rect(110, 118, 26, 26, '#64748b', null, 3) + t(128, 160, '기둥', { size: 10, fill: C.sub, anchor: 'start' });
    s += '<path d="M170 63 L92 196" stroke="' + C.red + '" stroke-width="2.4" stroke-dasharray="6 4"/>' + '<path d="M170 63 L250 196" stroke="' + C.green + '" stroke-width="2.6"/>';
    s += '<path d="M178 60 L312 120 L254 194" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-dasharray="3 4"/>' + t(292, 124, '튕김(반사)', { size: 9.5, fill: C.sub, anchor: 'end' });
    s += '<path d="M118 130 l12 12 M130 130 l-12 12" stroke="#fff" stroke-width="2.4"/>';
    s += antenna(90, 212, 'A', C.red, 18) + antenna(250, 212, 'B', C.green, 18);
    s += t(60, 186, 'A: 막힘', { size: 10.5, weight: 800, fill: C.red }) + t(274, 170, 'B: 잘 보임', { size: 10.5, weight: 800, fill: C.green });
    s += t(166, 244, '다이버시티 수신기는 그 순간 더 좋은 B 를 골라 써요', { size: 11, weight: 700, fill: C.ink });
    s += rect(334, 28, 258, 198, '#f0fdf4', '#86efac', 10) + t(463, 50, '안테나 자리 체크 (Shure 안내)', { size: 12, weight: 800, fill: C.green });
    ['막힘 없이 보이는 길 (유리·사람도 막아요)', '바닥에서 2 m 이상 높이', '10 mW 송신기와 3 m 이상', '벽·금속(튕기는 면)에서 1 파장 이상', 'A·B 간격 ¼ 파장 이상 (넓을수록 좋음)', '두 안테나는 V 자(90°)로 벌리기'].forEach(function (L, i) {
      s += t(348, 76 + i * 24, '✓', { size: 12, weight: 800, fill: C.green, anchor: 'start' }) + t(364, 76 + i * 24, L, { size: 10.5, anchor: 'start' });
    });
    s += t(463, 216, '1 파장 = 전파 물결 하나 길이 · 930 MHz 는 약 32 cm', { size: 9.5, fill: C.sub });
    return svg(600, 252, s, '다이버시티 수신과 안테나 자리: 막힌 A 대신 잘 보이는 B 를 고른다');
  };

  /* ---------------------------------------------------------------- 그림 5: 무선의 게인 구조 */
  V.wlGain = function () {
    var s = t(300, 18, '무선 마이크의 게인 구조 — 앞에서부터 차례로 맞춰요', { size: 12, weight: 800 });
    var B = [['목소리', '노래 · 말', C.ink], ['송신기 감도', 'SENS / GAIN', C.purple], ['전파', 'RF (세기 ≠ 소리 크기)', C.blue], ['수신기 미터', 'AUDIO · OL', C.amber], ['수신기 출력', 'MIC / LINE', C.teal], ['콘솔 GAIN', '→ 페이더', C.teal]];
    B.forEach(function (b, i) { var x = 6 + i * 99; s += rect(x, 36, 86, 56, '#fff', b[2], 8) + t(x + 43, 60, b[0], { size: 11.5, weight: 800, fill: b[2] }) + t(x + 43, 78, b[1], { size: 8.8, fill: C.sub }); if (i < B.length - 1) s += arrow(x + 87, 64, x + 98, 64, '#94a3b8'); });
    // 미터 그림
    var mx = 70, mw = 460, z = function (db) { return mx + (db + 40) / 46 * mw; };
    s += t(300, 116, '수신기 오디오 미터 (교육용 눈금)', { size: 10.5, weight: 700, fill: C.sub });
    s += rect(z(-40), 124, z(-12) - z(-40), 18, '#86efac', null, 0) + rect(z(-12), 124, z(-3) - z(-12), 18, '#fde047', null, 0) + rect(z(-3), 124, z(0) - z(-3), 18, '#fdba74', null, 0) + rect(z(0), 124, z(6) - z(0), 18, '#f87171', null, 0);
    s += '<rect x="' + mx + '" y="124" width="' + mw + '" height="18" fill="none" stroke="#64748b"/>';
    [[-40, '−40'], [-12, '−12'], [-3, '−3'], [0, '0']].forEach(function (p) { s += '<path d="M' + z(p[0]) + ' 142v5" stroke="#64748b"/>' + t(z(p[0]), 158, p[1], { size: 9.5, fill: C.sub }); });
    s += t((z(-40) + z(-12)) / 2, 137, '평소 말소리', { size: 9.5, weight: 700, fill: '#14532d' }) + t((z(-12) + z(-3)) / 2, 137, '큰 순간', { size: 9.5, weight: 700, fill: '#713f12' }) + t((z(0) + z(6)) / 2, 137, 'OL', { size: 9.5, weight: 800, fill: '#7f1d1d' });
    s += t(300, 182, '송신기 안에서 이미 찌그러진 소리는 뒤에서 콘솔 GAIN·페이더를 내려도 고쳐지지 않아요', { size: 10.5, weight: 700, fill: C.red });
    s += t(300, 200, '감도는 소리 크기를 바꿀 뿐, 전파 세기(RF)·끊김과는 상관없어요', { size: 10, fill: C.sub });
    return svg(600, 208, s, '무선 마이크 게인 구조: 송신기 감도, 수신기 미터, 출력 레벨, 콘솔 GAIN');
  };

  /* ---------------------------------------------------------------- 그림 6: 예배 전 점검 */
  V.wlCheck = function () {
    var s = t(150, 18, '수신기 화면 예시 (기종마다 표시가 달라요)', { size: 10.5, fill: C.sub });
    s += rect(10, 28, 284, 128, '#1f2933', '#0b0f14', 10) + rect(22, 40, 260, 104, '#0b1220', '#334155', 6);
    s += t(34, 60, '② 목사님 헤드셋', { size: 11, weight: 800, fill: '#e2e8f0', anchor: 'start' }) + t(270, 60, '925.5 MHz', { size: 11, weight: 800, fill: '#fde68a', anchor: 'end' });
    s += t(34, 86, 'RF', { size: 10, weight: 800, fill: '#94a3b8', anchor: 'start' });
    for (var i = 0; i < 5; i++) s += rect(56 + i * 10, 76 - i * 2, 7, 12 + i * 2, i < 4 ? '#38bdf8' : '#1f2937', null, 1);
    s += rect(116, 74, 16, 16, '#1f2937', '#475569', 3) + t(124, 86, 'A', { size: 9.5, weight: 800, fill: '#64748b' }) + rect(136, 74, 16, 16, '#22c55e', null, 3) + t(144, 86, 'B', { size: 9.5, weight: 800, fill: '#052e16' });
    s += cells(190, 76, 1, '#ef4444') + t(250, 86, 'LOW', { size: 9.5, weight: 800, fill: '#f87171', anchor: 'start' });
    s += t(34, 116, 'AUDIO', { size: 10, weight: 800, fill: '#94a3b8', anchor: 'start' }) + rect(80, 106, 150, 12, '#1f2937', null, 2) + rect(80, 106, 92, 12, '#facc15', null, 2) + rect(80, 106, 70, 12, '#4ade80', null, 2) + rect(236, 106, 34, 12, '#3f1d1d', '#7f1d1d', 2) + t(253, 116, 'OL', { size: 9, weight: 800, fill: '#7f1d1d' });
    s += t(34, 136, 'MUTE 꺼짐 · 송신기 전원 켜짐', { size: 9.5, fill: '#94a3b8', anchor: 'start' });
    s += t(150, 176, 'RF = 전파 세기 · AUDIO = 소리 크기 — 따로 봐요', { size: 10.5, weight: 700 }) + t(150, 194, '이 예시: 배터리 1칸 → 지금 새 것으로!', { size: 10.5, weight: 700, fill: C.red });
    s += rect(310, 28, 282, 172, '#fff7ed', '#fdba74', 10) + t(451, 50, '예배 전 점검 (30분 전)', { size: 12, weight: 800, fill: C.orange });
    ['① 새 배터리 (칸 수만 믿지 않기)', '② 송신기 전원 · MUTE 확인', '③ RF 미터 — A·B 가 고르게 들어오나', '④ AUDIO 미터 — 큰 소리에 OL 없나', '⑤ 걷기 테스트 — 실제 동선 따라 걷기', '⑥ 유선 예비 마이크 준비'].forEach(function (L, i) { s += t(324, 76 + i * 21, L, { size: 10.5, anchor: 'start' }); });
    return svg(600, 206, s, '예배 전 무선 마이크 점검: 배터리, MUTE, RF, 오디오, 걷기 테스트, 예비 마이크');
  };

  /* ================================================================ 그림으로 보기 (2026-11-04 · 교재 대조 때 추가)
     작은 그림(용어용)은 가로 360, 이론 · 문제용은 가로 400 안팎으로 그려 휴대폰에서도 글자가 읽히게 함 */

  function svgS() { return svg.apply(null, arguments).replace('<svg class="mod-svg"', '<svg class="mod-svg" style="min-width:0"'); }   // 새 그림은 휴대폰 폭에 맞게 줄어들게(기본 .mod-svg 는 최소 460px)
  function bars(x, y, n, col, max) { var s = ''; max = max || 4; for (var i = 0; i < max; i++) s += rect(x + i * 9, y - 6 - i * 5, 6, 6 + i * 5, i < n ? col : '#e2e8f0', null, 1); return s; }
  function micIcon(x, y, col) { return '<circle cx="' + x + '" cy="' + y + '" r="11" fill="#94a3b8" stroke="#475569" stroke-width="2"/><path d="M' + (x - 6) + ' ' + (y + 9) + 'L' + (x - 4) + ' ' + (y + 46) + 'H' + (x + 4) + 'L' + (x + 6) + ' ' + (y + 9) + 'Z" fill="#334155"/>' + rect(x - 3, y + 24, 6, 8, col || '#22d3ee', null, 1); }
  function rxBox(x, y, w, h, a, b) { return rect(x, y, w, h, '#1f2933', '#0b0f14', 8) + t(x + w / 2, y + (b ? h / 2 - 3 : h / 2 + 5), a, { size: 13, weight: 800, fill: '#e2e8f0' }) + (b ? t(x + w / 2, y + h / 2 + 15, b, { size: 13, weight: 800, fill: '#fde68a' }) : ''); }

  // 용어 「다이버시티」: 안테나 두 개 중 더 센 쪽을 골라요
  V.wlTermDiv = function () {
    var s = t(180, 18, '두 안테나 중 더 센 쪽을 골라 써요', { size: 14, weight: 800 });
    s += rxBox(104, 74, 152, 40, '다이버시티 수신기') + antenna(126, 74, '', C.red, 42) + antenna(234, 74, '', C.green, 42);
    s += t(62, 52, 'A 약함', { size: 14, weight: 800, fill: C.red }) + bars(40, 82, 1, C.red) + t(80, 104, '✕', { size: 15, weight: 800, fill: C.red });
    s += t(298, 52, 'B 셈', { size: 14, weight: 800, fill: C.green }) + bars(276, 82, 4, C.green) + t(318, 104, '✓', { size: 15, weight: 800, fill: C.green });
    return svgS(360, 120, s, '다이버시티: 안테나 A 는 약하고 B 는 세서 수신기가 B 를 골라 씀');
  };

  // 용어 「RF 미터」: 전파 세기와 소리 크기는 다른 미터
  V.wlTermRf = function () {
    var s = rect(6, 8, 160, 104, '#eff6ff', '#bfdbfe', 10) + t(86, 32, 'RF 미터', { size: 14, weight: 800, fill: C.blue }) + bars(62, 74, 3, C.blue) + t(86, 100, '전파가 얼마나 센지', { size: 13, fill: C.ink });
    s += t(180, 66, '≠', { size: 24, weight: 800, fill: C.sub });
    s += rect(194, 8, 160, 104, '#f0fdf4', '#86efac', 10) + t(274, 32, 'AUDIO 미터', { size: 14, weight: 800, fill: C.green }) + rect(214, 52, 120, 14, '#e2e8f0', null, 3) + rect(214, 52, 58, 14, '#4ade80', null, 3) + rect(272, 52, 22, 14, '#facc15', null, 0) + t(274, 100, '소리가 얼마나 큰지', { size: 13, fill: C.ink });
    return svgS(360, 120, s, 'RF 미터는 전파 세기, 오디오 미터는 소리 크기를 보여 줘요');
  };

  // 이론 1: 라디오 방송 비유 — 방송국 = 송신기, 라디오 = 수신기
  V.wlRadio = function () {
    var tower = function (x, y) { return '<path d="M' + (x - 14) + ' ' + (y + 52) + 'L' + x + ' ' + y + 'L' + (x + 14) + ' ' + (y + 52) + 'M' + (x - 9) + ' ' + (y + 34) + 'H' + (x + 9) + 'M' + (x - 5) + ' ' + (y + 18) + 'H' + (x + 5) + '" fill="none" stroke="' + C.ink + '" stroke-width="2.5"/><circle cx="' + x + '" cy="' + y + '" r="4" fill="' + C.red + '"/>'; };
    var radio = function (x, y, num) { return rect(x, y, 104, 52, '#fef3c7', C.amber, 10) + '<circle cx="' + (x + 24) + '" cy="' + (y + 26) + '" r="14" fill="#fff" stroke="' + C.amber + '" stroke-width="2"/>' + t(x + 70, y + 32, num, { size: 15, weight: 800, fill: '#92400e' }); };
    var s = t(8, 20, '라디오 방송', { size: 14, weight: 800, anchor: 'start', fill: C.amber });
    s += tower(50, 30) + t(50, 102, '방송국', { size: 13, weight: 700 }) + waves(70, 52, C.amber) + arrow(120, 56, 270, 56, '#cbd5e1') + t(195, 48, '전파 · 채널 95.9', { size: 13, weight: 700, fill: C.amber }) + radio(280, 30, '95.9') + t(332, 102, '집 라디오', { size: 13, weight: 700 });
    s += '<path d="M6 118H394" stroke="' + C.line + '" stroke-dasharray="4 4"/>';
    s += t(8, 140, '무선 마이크', { size: 14, weight: 800, anchor: 'start', fill: C.blue });
    s += micIcon(50, 156) + t(50, 224, '송신기', { size: 13, weight: 700 }) + waves(66, 172, C.blue) + arrow(120, 176, 270, 176, '#cbd5e1') + t(195, 168, '전파 · 925.5 MHz', { size: 13, weight: 700, fill: C.blue }) + rxBox(280, 150, 104, 52, '수신기', '925.5') + t(332, 224, '→ 콘솔로', { size: 13, weight: 700 });
    return svgS(400, 232, s, '라디오 방송국과 라디오처럼, 송신기와 수신기도 같은 주파수에 맞춰야 들려요');
  };

  // 이론 3: 주파수를 똑같은 간격으로 두면 ✕, 들쭉날쭉하게 두면 ○
  V.wlSpacing = function () {
    var X = function (f) { return 22 + (f - 924) * 35.6; };
    function panel(y, ok, mics, title, note) {
      var col = ok ? C.green : C.red, s = rect(4, y, 392, 112, ok ? '#f0fdf4' : '#fef2f2', ok ? '#86efac' : '#fecaca', 10) + t(14, y + 22, (ok ? '○ ' : '✕ ') + title, { size: 13, weight: 800, fill: col, anchor: 'start' });
      var base = y + 86; s += '<path d="M18 ' + base + 'H384" stroke="#94a3b8" stroke-width="1.5"/>';
      [924, 926, 928, 930, 932, 934].forEach(function (f) { s += '<path d="M' + X(f) + ' ' + base + 'v5" stroke="#94a3b8"/>' + t(X(f), base + 19, f, { size: 11, fill: C.sub }); });
      var ghosts = []; mics.forEach(function (a) { mics.forEach(function (b) { if (a !== b) ghosts.push(Math.round((2 * a - b) * 10) / 10); }); });
      mics.forEach(function (f) { s += rect(X(f) - 5, base - 46, 10, 46, C.blue, null, 2); });
      ghosts.forEach(function (g) { if (g < 924 || g > 934) return; var hit = mics.some(function (m) { return Math.abs(m - g) < 0.35; }); s += '<path d="M' + X(g) + ' ' + (base - 22) + 'l-6 22h12z" fill="' + (hit ? C.red : C.orange) + '" fill-opacity="' + (hit ? 1 : 0.8) + '"/>'; });
      return s + t(386, y + 22, note, { size: 13, weight: 700, fill: col, anchor: 'end' });
    }
    var s = panel(4, false, [926, 927, 928], '926 · 927 · 928', '가짜 신호가 마이크와 겹쳐요') + panel(124, true, [926, 927.2, 929.9], '926 · 927.2 · 929.9', '가짜 신호가 비켜 가요');
    s += rect(14, 244, 12, 12, C.blue, null, 2) + t(32, 255, '마이크', { size: 12, anchor: 'start' }) + '<path d="M96 256l6 -12l6 12z" fill="' + C.orange + '"/>' + t(114, 255, '혼변조(가짜 신호)', { size: 12, anchor: 'start' }) + '<path d="M232 256l6 -12l6 12z" fill="' + C.red + '"/>' + t(250, 255, '마이크와 겹침', { size: 12, anchor: 'start' });
    return svgS(400, 262, s, '주파수를 똑같은 간격으로 두면 혼변조가 마이크와 겹치고, 들쭉날쭉하게 두면 비켜 간다');
  };

  // 이론 3: 마이크가 늘면 3차 혼변조 수가 훨씬 빨리 늘어요 (교재 표 14.2)
  V.wlImdCount = function () {
    var rows = [[2, 2], [3, 9], [4, 24], [5, 50], [6, 90], [8, 225]], s = t(8, 18, '함께 쓰는 마이크 수 → 3차 가짜 신호 수', { size: 13, weight: 800, anchor: 'start' });
    rows.forEach(function (r, i) {
      var y = 34 + i * 30, w = Math.max(4, r[1] / 225 * 250);
      s += t(54, y + 16, r[0] + '대', { size: 13, weight: 700, anchor: 'end' }) + rect(64, y + 2, w, 20, i < 2 ? C.amber : C.orange, null, 4) + t(72 + w, y + 17, r[1] + '개', { size: 13, weight: 800, anchor: 'start', fill: i < 2 ? '#92400e' : C.orange });
    });
    return svgS(400, 232, s + t(392, 228, '교재 표 14.2 값', { size: 11, fill: C.sub, anchor: 'end' }), '마이크가 2대면 2개, 3대면 9개, 4대면 24개, 8대면 225개의 3차 혼변조가 생긴다');
  };

  // 이론 4: 다중 경로 페이딩 — A 와 B 가 약해지는 자리가 달라서, 더 센 쪽을 고르면 끊기지 않아요
  V.wlFade = function () {
    var x0 = 40, x1 = 388, top = 34, bot = 180, H = bot - top;
    var A = function (u) { return 0.58 + 0.34 * Math.sin(2 * Math.PI * 2.5 * u) + 0.06 * Math.sin(2 * Math.PI * 7 * u); };
    var B = function (u) { return 0.58 + 0.34 * Math.sin(2 * Math.PI * 2.5 * u + Math.PI) + 0.06 * Math.sin(2 * Math.PI * 6 * u + 1); };
    function path(f) { var d = ''; for (var i = 0; i <= 120; i++) { var u = i / 120; d += (i ? 'L' : 'M') + (x0 + (x1 - x0) * u).toFixed(1) + ' ' + (bot - f(u) * H).toFixed(1); } return d; }
    var s = t(8, 18, '송신기를 들고 걸을 때 받는 세기', { size: 13, weight: 800, anchor: 'start' });
    s += '<path d="M' + x0 + ' ' + top + 'V' + bot + 'H' + x1 + '" stroke="#475569" stroke-width="1.5" fill="none"/>' + t(x0 - 6, top + 12, '셈', { size: 12, fill: C.sub, anchor: 'end' }) + t(x0 - 6, bot, '약함', { size: 12, fill: C.sub, anchor: 'end' });
    var thr = bot - 0.3 * H; s += '<path d="M' + x0 + ' ' + thr + 'H' + x1 + '" stroke="' + C.red + '" stroke-dasharray="5 4"/>';
    s += '<path d="' + path(function (u) { return Math.max(A(u), B(u)); }) + '" stroke="' + C.green + '" stroke-width="9" stroke-opacity=".28" fill="none"/>';
    s += '<path d="' + path(A) + '" stroke="' + C.orange + '" stroke-width="2.2" fill="none"/><path d="' + path(B) + '" stroke="' + C.blue + '" stroke-width="2.2" fill="none" stroke-dasharray="6 3"/>';
    s += rect(x1 - 104, thr + 3, 104, 17, '#fff', null, 4) + t(x1 - 2, thr + 16, '이 아래면 끊겨요', { size: 12, weight: 700, fill: C.red, anchor: 'end' });
    s += t(214, bot + 20, '무대 왼쪽 → 오른쪽으로 걷기', { size: 12, fill: C.sub });
    s += '<path d="M14 214h22" stroke="' + C.orange + '" stroke-width="3"/>' + t(42, 219, '안테나 A', { size: 12, anchor: 'start' }) + '<path d="M118 214h22" stroke="' + C.blue + '" stroke-width="3" stroke-dasharray="6 3"/>' + t(146, 219, '안테나 B', { size: 12, anchor: 'start' }) + '<path d="M222 214h22" stroke="' + C.green + '" stroke-width="9" stroke-opacity=".3"/>' + t(250, 219, '수신기가 고른 쪽', { size: 12, anchor: 'start', fill: C.green, weight: 700 });
    return svgS(400, 228, s, '안테나 A 와 B 는 약해지는 자리가 달라서, 더 센 쪽을 고르면 끊기지 않아요 (교육용 그림)');
  };

  // 이론 4: 송신기 안테나 다루기 ○ / ✕
  V.wlAntCare = function () {
    function card(x, ok, title, sub, body) { var col = ok ? C.green : C.red; return rect(x, 6, 126, 196, ok ? '#f0fdf4' : '#fef2f2', ok ? '#86efac' : '#fecaca', 10) + t(x + 63, 28, (ok ? '○ ' : '✕ ') + title, { size: 13, weight: 800, fill: col }) + body(x + 63) + t(x + 63, 176, sub[0], { size: 12, fill: C.ink }) + t(x + 63, 192, sub[1], { size: 12, fill: C.ink }); }
    var pack = function (cx) { return rect(cx - 20, 46, 40, 54, '#334155', null, 6) + rect(cx - 13, 54, 26, 9, '#22d3ee', null, 2); };
    var s = card(4, true, '곧게', ['안테나를 아래로', '곧게 늘어뜨려요'], function (cx) { return pack(cx) + '<path d="M' + (cx + 12) + ' 100V156" stroke="' + C.ink + '" stroke-width="3" stroke-linecap="round"/>'; });
    s += card(137, false, '말거나 넣기', ['말거나 주머니에', '넣으면 약해져요'], function (cx) { return pack(cx) + '<path d="M' + (cx + 12) + ' 100c10 8 -16 14 -6 22s18 -2 8 10s-16 4 -8 12" stroke="' + C.ink + '" stroke-width="3" fill="none" stroke-linecap="round"/>' + rect(cx - 34, 124, 68, 36, 'none', C.sub, 6).replace('fill="none"', 'fill="none" stroke-dasharray="4 3"'); });
    s += card(270, false, '감싸 쥐기', ['핸드헬드 아랫부분을', '손으로 감싸면 약해요'], function (cx) { return micIcon(cx, 60) + '<path d="M' + (cx - 16) + ' 98h32v18h-32z" fill="#f2c9a0" stroke="#b45309" stroke-width="1.5"/>' + t(cx + 30, 112, '손', { size: 12, fill: '#b45309', anchor: 'start' }); });
    return svgS(400, 208, s, '송신기 안테나는 곧게 두고, 말거나 주머니에 넣거나 손으로 감싸지 않아요');
  };

  // 이론 5: 송신기 감도 — 너무 높음 · 알맞음 · 너무 낮음
  V.wlSens = function () {
    function panel(x, title, col, kind, a, b) {
      var s = rect(x, 6, 126, 190, '#fff', col, 10) + t(x + 63, 28, title, { size: 13, weight: 800, fill: col }), d = '', y0 = 92;
      for (var i = 0; i <= 100; i++) { var u = i / 100, v = Math.sin(2 * Math.PI * 3 * u), y;
        if (kind === 'hi') y = y0 - Math.max(-0.62, Math.min(0.62, 1.5 * v)) * 46; else if (kind === 'ok') y = y0 - 0.78 * v * 46; else y = y0 - (0.2 * v + 0.07 * Math.sin(2 * Math.PI * 41 * u + 1) + 0.05 * Math.sin(2 * Math.PI * 67 * u)) * 46;
        d += (i ? 'L' : 'M') + (x + 10 + 106 * u).toFixed(1) + ' ' + y.toFixed(1); }
      if (kind === 'hi') s += '<path d="M' + (x + 8) + ' ' + (y0 - 29) + 'H' + (x + 118) + 'M' + (x + 8) + ' ' + (y0 + 29) + 'H' + (x + 118) + '" stroke="' + C.red + '" stroke-dasharray="3 3"/>';
      return s + '<path d="' + d + '" stroke="' + col + '" stroke-width="2.4" fill="none"/>' + t(x + 63, 166, a, { size: 13, weight: 700, fill: col }) + t(x + 63, 184, b, { size: 12, fill: C.ink });
    }
    var s = panel(4, '감도 너무 높음', C.red, 'hi', '윗부분이 잘려요', '찌그러진 소리') + panel(137, '알맞음', C.green, 'ok', '알맞은 크기', '깨끗한 소리') + panel(270, '감도 너무 낮음', C.amber, 'lo', '소리가 작아요', '키우면 「쉬—」 잡음');
    return svgS(400, 202, s, '송신기 감도가 너무 높으면 찌그러지고, 알맞으면 깨끗하고, 너무 낮으면 잡음이 커져요');
  };

  // 개념 체크(이론 6): 끊기는 순간 RF 도 같이 떨어지는 그림
  V.wlDrop = function () {
    var x0 = 70, x1 = 390, s = t(8, 18, '설교 중 수신기 화면을 시간 순서로 본 그림', { size: 13, weight: 800, anchor: 'start' });
    s += rect(x0 + 168, 28, 54, 148, '#fef2f2', null, 6) + t(x0 + 195, 192, '끊긴 순간', { size: 12, weight: 800, fill: C.red });
    s += t(60, 66, 'RF', { size: 13, weight: 800, fill: C.blue, anchor: 'end' }) + t(60, 82, '(전파)', { size: 12, fill: C.sub, anchor: 'end' });
    for (var i = 0; i < 16; i++) { var x = x0 + 4 + i * 20, n = (i === 9 || i === 10) ? 0 : (i === 8 || i === 11 ? 2 : 4); s += bars(x, 86, n, C.blue); }
    s += t(60, 140, '소리', { size: 13, weight: 800, fill: C.green, anchor: 'end' }) + t(60, 156, '(AUDIO)', { size: 12, fill: C.sub, anchor: 'end' });
    var d = ''; for (var k = 0; k <= 160; k++) { var u = k / 160, xx = x0 + (x1 - x0) * u, gap = xx > x0 + 172 && xx < x0 + 218, y = 142 - (gap ? 0 : 16 * Math.sin(2 * Math.PI * 9 * u) * (0.5 + 0.5 * Math.abs(Math.sin(2 * Math.PI * 1.3 * u)))); d += (k ? 'L' : 'M') + xx.toFixed(1) + ' ' + y.toFixed(1); }
    s += '<path d="' + d + '" stroke="' + C.green + '" stroke-width="2" fill="none"/>' + t(x1, 210, '시간 →', { size: 12, fill: C.sub, anchor: 'end' });
    return svgS(400, 216, s, '소리가 끊긴 순간 RF 칸도 함께 떨어진 그림');
  };

  // 심화: 안테나 분배기 — 수신기마다 안테나 ✕, 안테나 한 쌍을 나눠 쓰기 ○
  V.wlSplitter = function () {
    function rx(x, y, w) { return rect(x, y, w, 18, '#1f2933', null, 4) + rect(x + 6, y + 6, 22, 6, '#fde68a', null, 1); }
    var s = rect(4, 6, 190, 200, '#fef2f2', '#fecaca', 10) + t(99, 28, '✕ 수신기마다 안테나', { size: 13, weight: 800, fill: C.red });
    for (var i = 0; i < 4; i++) { var y = 108 + i * 22; s += rx(30, y, 136) + antenna(40, y, '', '#64748b', 22 + (i % 2) * 6).replace('stroke-width="3"', 'stroke-width="2"') + antenna(156, y, '', '#64748b', 22 + ((i + 1) % 2) * 6).replace('stroke-width="3"', 'stroke-width="2"'); }
    s += t(99, 54, '안테나 8개가 랙 안에', { size: 12, fill: C.ink }) + t(99, 70, '서로 막고 엉켜요', { size: 12, fill: C.ink });
    s += rect(206, 6, 190, 200, '#f0fdf4', '#86efac', 10) + t(301, 28, '○ 분배기로 나눠 쓰기', { size: 13, weight: 800, fill: C.green });
    s += antenna(232, 80, 'A', C.green, 30) + antenna(370, 80, 'B', C.green, 30) + rect(222, 80, 158, 22, '#0e7490', null, 4) + t(301, 96, '안테나 분배기', { size: 12, weight: 800, fill: '#fff' });
    for (var j = 0; j < 4; j++) { var yy = 116 + j * 22; s += rx(232, yy, 138) + '<path d="M226 ' + (yy + 9) + 'H232M376 ' + (yy + 9) + 'H370" stroke="#0e7490" stroke-width="2"/>'; }
    s += '<path d="M226 102V' + (116 + 3 * 22 + 9) + 'M376 102V' + (116 + 3 * 22 + 9) + '" stroke="#0e7490" stroke-width="2"/>';
    return svgS(400, 212, s, '수신기마다 안테나를 달면 엉키고, 안테나 분배기를 쓰면 안테나 한 쌍을 여러 수신기가 나눠 써요');
  };
})();

/* =========================================================================== 실습: 무선 마이크 작업대 */
(function () {
  'use strict';
  /* 주파수는 0.1 MHz 단위 정수로 다룸 (9255 = 925.5 MHz) */
  var LO = 9250, HI = 9375, MINF = LO + 2, MAXF = HI - 2;
  var EXT = [{ lo: 9260, hi: 9261, h: 0.82 }, { lo: 9296, hi: 9310, h: 0.58 }, { lo: 9334, hi: 9335, h: 0.9 }];   // 스캔에 잡히는 다른 무선기기 신호 (교육용 예시)
  var GAP_EXT = 3, GAP_MIC = 4, GAP_IM = 3;   // 0.3 MHz · 0.4 MHz · 0.3 MHz(250 kHz 넘게) — 교육용 기준
  var MICS = [
    { n: '①', name: '인도자', kind: '핸드헬드', col: '#2563eb', base: 18, home: [10, 2.2], path: [[10, 2.2], [6, 2.2], [14, 2.2], [10, 2.2]] },
    { n: '②', name: '목사님', kind: '헤드셋 · 벨트팩', col: '#7c3aed', base: 12, home: [10, 4.4], path: [[10, 4.4], [10, 8], [6, 9.5], [10, 4.4]] },
    { n: '③', name: '사회자', kind: '핸드헬드', col: '#0e7490', base: -3, home: [15.5, 3.4], path: [[15.5, 3.4], [13, 5.6], [15.5, 3.4]] }
  ];
  var ROOM = { w: 20, d: 28 }, BOOTH = { x0: 7, y0: 24.5, x1: 13, y1: 28 }, PILLARS = [{ x0: 5.4, y0: 13, x1: 6.6, y1: 14.2 }, { x0: 13.4, y0: 13, x1: 14.6, y1: 14.2 }];
  var SENS_MIN = -42, SENS_MAX = 0, SENS_STEP = 3, TARGET = [-12, -3];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mhz(u) { return (u / 10).toFixed(1); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function inRect(p, r) { return p[0] > r.x0 && p[0] < r.x1 && p[1] > r.y0 && p[1] < r.y1; }
  function segHits(a, b, r) {   // 선분 a-b 가 사각형 r 을 지나는지 (Liang–Barsky)
    var t0 = 0, t1 = 1, dx = b[0] - a[0], dy = b[1] - a[1], P = [-dx, dx, -dy, dy], Q = [a[0] - r.x0, r.x1 - a[0], a[1] - r.y0, r.y1 - a[1]];
    for (var i = 0; i < 4; i++) { if (P[i] === 0) { if (Q[i] < 0) return false; } else { var u = Q[i] / P[i]; if (P[i] < 0) { if (u > t1) return false; if (u > t0) t0 = u; } else { if (u < t0) return false; if (u < t1) t1 = u; } } }
    return t0 < t1;
  }
  function link(ant, p) {   // 안테나 하나와 송신기 사이 RF 칸 수 (교육용 근사)
    var d = Math.hypot(ant[0] - p[0], ant[1] - p[1]), v = d <= 12 ? 5 : 5 - (d - 12) / 5, wall = false, pil = 0;
    var ai = inRect(ant, BOOTH), pi = inRect(p, BOOTH);
    if ((ai !== pi) || (!ai && segHits(ant, p, BOOTH))) { wall = true; v -= 1.8; }
    PILLARS.forEach(function (r) { if (segHits(ant, p, r)) { pil++; v -= 1.6; } });
    return { bars: clamp(v, 0, 5), d: d, blocked: wall || pil > 0, wall: wall, pillar: pil > 0, close: d < 3 };
  }
  function pathPts(path, n) {
    var segs = [], L = 0, i; for (i = 1; i < path.length; i++) { var l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); segs.push(l); L += l; }
    var out = []; for (var k = 0; k <= n; k++) out.push(along(path, segs, L, k / n)); return out;
  }
  function along(path, segs, L, f) {
    var dist = f * L; for (var i = 0; i < segs.length; i++) { if (dist <= segs[i] || i === segs.length - 1) { var u = segs[i] ? clamp(dist / segs[i], 0, 1) : 0; return [path[i][0] + (path[i + 1][0] - path[i][0]) * u, path[i][1] + (path[i + 1][1] - path[i][1]) * u]; } dist -= segs[i]; }
    return path[path.length - 1].slice();
  }
  function posAt(path, f) { var segs = [], L = 0; for (var i = 1; i < path.length; i++) { var l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); segs.push(l); L += l; } return along(path, segs, L, f); }
  function noiseAt(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }

  function injectCss() {
    if (document.getElementById('sta-mod-wl-css')) return;
    var s = document.createElement('style'); s.id = 'sta-mod-wl-css';
    s.textContent = [
      '.wl-sim{display:flex;flex-direction:column;gap:12px;min-width:0}',
      '.wl-sim .sim-box{min-width:0}',
      '.wl-sim h4 .wl-step{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#0c1f3b;color:#fff;font-size:.72rem;margin-right:6px}',
      '.wl-spec{display:block;width:100%;max-width:820px;margin:0 auto;height:auto;touch-action:none;cursor:crosshair;user-select:none;-webkit-user-select:none;border-radius:8px;background:#0b1220}',
      '.wl-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}',
      '.wl-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;border:1.5px solid #cbd5e1;background:#fff;font:inherit;font-size:.78rem;font-weight:700;color:#0f1f33;cursor:pointer}',
      '.wl-chip i{width:10px;height:10px;border-radius:50%;flex:none}',
      '.wl-chip[aria-pressed=true]{border-color:#0c1f3b;background:#0c1f3b;color:#fff}',
      '.wl-list{display:grid;gap:4px;margin:8px 0 0;padding:0;list-style:none;font-size:.78rem}',
      '.wl-list li{display:flex;gap:8px;align-items:baseline;padding:4px 8px;border-radius:6px;background:#f8fafc}',
      '.wl-list li b{flex:none;font-variant-numeric:tabular-nums}.wl-list li.ok{background:#ecfdf5;color:#065f46}.wl-list li.bad{background:#fef3f2;color:#b42318}.wl-list li.unk{color:#64748b}',
      '.wl-msg{margin:6px 0 0;font-size:.76rem;line-height:1.5;color:#334155;min-height:1.2em}',
      '.wl-two{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:12px;align-items:start}',
      '.wl-rack{display:grid;gap:8px}',
      '.wl-rx{display:grid;grid-template-columns:minmax(0,1fr) 74px;gap:8px;align-items:stretch;padding:8px;border-radius:10px;background:linear-gradient(180deg,#2b3038,#1a1e24);border:1px solid #0b0d10;color:#e5e7eb}',
      '.wl-rx__name{grid-column:1/3;display:flex;justify-content:space-between;gap:6px;font-size:.76rem}.wl-rx__name b{font-size:.8rem}.wl-rx__name small{color:#94a3b8}',
      '.wl-lcd{background:#0b1220;border:1px solid #334155;border-radius:6px;padding:6px 8px;display:grid;gap:5px;font-size:.72rem;min-width:0}',
      '.wl-lcd__r{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}',
      '.wl-lcd .f{color:#fde68a;font-weight:800;font-variant-numeric:tabular-nums}.wl-lcd .tx{color:#94a3b8;font-variant-numeric:tabular-nums}.wl-lcd .tx.bad{color:#f87171;font-weight:800}',
      '.wl-rf{display:inline-flex;align-items:flex-end;gap:2px;height:14px}.wl-rf i{width:5px;background:#1f2937;border-radius:1px}.wl-rf i.on{background:#38bdf8}',
      '.wl-rf i:nth-child(1){height:6px}.wl-rf i:nth-child(2){height:8px}.wl-rf i:nth-child(3){height:10px}.wl-rf i:nth-child(4){height:12px}.wl-rf i:nth-child(5){height:14px}',
      '.wl-ab{display:inline-flex;gap:3px}.wl-ab em{font-style:normal;font-weight:800;font-size:.64rem;width:15px;height:15px;display:grid;place-items:center;border-radius:3px;background:#1f2937;color:#64748b}.wl-ab em.on{background:#22c55e;color:#052e16}',
      '.wl-bat{display:inline-flex;align-items:center;gap:1px;padding:1px;border:1px solid #94a3b8;border-radius:2px;height:12px}.wl-bat i{width:4px;height:8px;background:#1f2937;border-radius:1px}.wl-bat i.on{background:#4ade80}.wl-bat.low i.on{background:#ef4444}',
      '.wl-meter{position:relative;flex:1 1 90px;min-width:70px;height:10px;border-radius:2px;background:#1f2937;overflow:hidden}',
      '.wl-meter i{position:absolute;inset:0;background:linear-gradient(90deg,#4ade80 0 60.9%,#facc15 60.9% 80.4%,#fb923c 80.4% 87%,#ef4444 87% 100%)}',
      '.wl-meter b{position:absolute;top:0;bottom:0;border-left:1px dashed rgba(255,255,255,.55)}',
      '.wl-ol{font-weight:800;font-size:.62rem;padding:0 4px;border-radius:3px;background:#3f1d1d;color:#7f1d1d}.wl-ol.on{background:#ef4444;color:#fff}',
      '.wl-pk{color:#cbd5e1;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.wl-st{color:#94a3b8;min-height:1em}.wl-st.bad{color:#fca5a5}.wl-st.ok{color:#86efac}',
      '.wl-rx__ctl{display:flex;flex-direction:column;gap:6px;align-items:stretch}',
      '.wl-ir{flex:1;min-height:40px;border-radius:6px;border:2px dashed #64748b;background:#3b0d0d;color:#fca5a5;font-size:.64rem;font-weight:800;display:grid;place-items:center;text-align:center;line-height:1.2;padding:2px}',
      '.wl-ir.hot{border-color:#fbbf24;background:#7f1d1d;color:#fff}.wl-ir.docked{border-style:solid;border-color:#22c55e;color:#bbf7d0}',
      '.wl-sync{font:inherit;font-size:.72rem;font-weight:800;padding:6px 4px;border-radius:6px;border:1px solid #0b0d10;background:#e5e7eb;color:#0f1f33;cursor:pointer}.wl-sync:hover{background:#fff}',
      '.wl-tray{display:grid;gap:8px}',
      '.wl-tray__h{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.76rem;color:#334155;flex-wrap:wrap}',
      '.wl-tx{display:grid;grid-template-columns:54px minmax(0,1fr);gap:8px;padding:8px;border-radius:10px;border:1px solid #cbd5e1;background:#fff}',
      '.wl-tx.off{background:#f1f5f9}',
      '.wl-grab{display:grid;place-items:center;border-radius:8px;background:#e2e8f0;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}.wl-grab:active{cursor:grabbing}.wl-grab svg{width:44px;height:72px;display:block}',
      '.wl-tx__top{display:flex;justify-content:space-between;gap:6px;align-items:baseline;font-size:.78rem;flex-wrap:wrap}.wl-tx__top small{color:#64748b}',
      '.wl-tx__lcd{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-top:4px;padding:4px 8px;border-radius:6px;background:#0b1220;color:#fde68a;font-size:.72rem;font-weight:800;font-variant-numeric:tabular-nums}.wl-tx__lcd .d{color:#86efac;font-weight:700}',
      '.wl-tx__btns{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.wl-tx__btns .sim-btn{padding:4px 8px;font-size:.72rem}',
      '.wl-tx__btns .sim-btn.mute.on{background:#dc2626;border-color:#dc2626;color:#fff}',
      '.wl-sens{display:grid;grid-template-columns:auto 26px minmax(60px,1fr) 26px auto;gap:5px;align-items:center;margin-top:6px;font-size:.72rem;font-weight:800;color:#334155}',
      '.wl-sens .sim-btn{padding:2px 0;text-align:center}.wl-sens output{font-variant-numeric:tabular-nums;min-width:46px;text-align:right}',
      '.wl-track{position:relative;height:22px;touch-action:none;cursor:pointer;outline:none}.wl-track::before{content:"";position:absolute;left:0;right:0;top:9px;height:4px;border-radius:2px;background:#cbd5e1}',
      '.wl-track i{position:absolute;left:0;top:9px;height:4px;border-radius:2px;background:#7c3aed}.wl-track b{position:absolute;top:2px;width:16px;height:18px;margin-left:-8px;border-radius:4px;background:#0f1f33;box-shadow:0 1px 3px rgba(0,0,0,.4)}',
      '.wl-track:focus-visible b{outline:2px solid #22d3ee;outline-offset:2px}',
      '.wl-ghost{position:fixed;z-index:9999;pointer-events:none;width:48px;height:76px;margin:-38px 0 0 -24px;opacity:.9;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35))}',
      '.wl-roomwrap{display:grid;grid-template-columns:minmax(0,400px) minmax(0,1fr);gap:12px;align-items:start}',
      '.wl-room{display:block;width:100%;height:auto;touch-action:none;user-select:none;-webkit-user-select:none;border-radius:8px;background:#fff;border:1px solid #e2e8f0}',
      '.wl-room .ant{cursor:grab}',
      '.wl-side{display:grid;gap:8px;min-width:0}',
      '.wl-legend{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:.72rem;color:#475569}.wl-legend span{display:inline-flex;align-items:center;gap:4px}.wl-legend i{display:inline-block;width:18px;height:0;border-top:3px solid}',
      '@media (max-width:900px){.wl-two{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:760px){.wl-roomwrap{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:420px){.wl-rx{grid-template-columns:minmax(0,1fr) 62px}.wl-sens{grid-template-columns:auto 24px minmax(40px,1fr) 24px}.wl-sens output{grid-column:1/-1;text-align:left}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function txIcon(i, col) {
    if (i === 1) return '<svg viewBox="0 0 44 72" aria-hidden="true"><path d="M30 4 V18" stroke="#334155" stroke-width="3" stroke-linecap="round"/><rect x="8" y="16" width="28" height="44" rx="5" fill="#334155"/><rect x="12" y="22" width="20" height="9" rx="2" fill="' + col + '"/><circle cx="22" cy="48" r="4" fill="#64748b"/><path d="M14 60 Q8 68 4 70" stroke="#64748b" stroke-width="1.6" fill="none"/></svg>';
    return '<svg viewBox="0 0 44 72" aria-hidden="true"><path d="M15 20 L18 66 Q22 70 26 66 L29 20Z" fill="#334155"/><circle cx="22" cy="13" r="10" fill="#94a3b8" stroke="#475569" stroke-width="2"/><rect x="18" y="36" width="8" height="10" rx="2" fill="' + col + '"/></svg>';
  }
  function cellsHtml(n) { var h = '<span class="wl-bat' + (n <= 1 ? ' low' : '') + '" title="배터리 ' + n + '/5">'; for (var i = 0; i < 5; i++) h += '<i class="' + (i < n ? 'on' : '') + '"></i>'; return h + '</span>'; }

  function wirelessBench(el, opts) {
    opts = opts || {}; injectCss();
    var S = {
      rx: [9260, 9270, 9280], sel: 0,
      tx: [{ f: 9260, on: true, mute: false, bat: 5, sens: -12 }, { f: 9270, on: true, mute: true, bat: 2, sens: -12 }, { f: 9280, on: true, mute: false, bat: 1, sens: -12 }],
      scan: null, scanning: null, dock: [null, null, null], spares: 2,
      ant: { A: [9.2, 26.3], B: [10.8, 26.3] }, walk: null, walkResult: null,
      drag: null, done: {}, t0: performance.now()
    };
    var alive = true, raf = 0, olHold = [0, 0, 0];

    el.innerHTML =
      '<div class="wl-sim">' +
        '<div class="sim-box"><h4><span class="wl-step">1</span>주파수 스캔 · 채널 고르기 <small>925.0 – 937.5 MHz (신고 없이 쓰는 대역)</small></h4>' +
          '<svg class="wl-spec" data-role="spec" viewBox="0 0 640 200" role="img" aria-label="주파수 스펙트럼 — 눌러서 고른 마이크의 수신기 주파수를 정해요"></svg>' +
          '<div class="wl-row" role="group" aria-label="주파수를 바꿀 마이크">' + MICS.map(function (m, i) { return '<button type="button" class="wl-chip" data-sel="' + i + '" aria-pressed="' + (i === 0) + '"><i style="background:' + m.col + '"></i>' + m.n + ' ' + m.name + '</button>'; }).join('') +
            '<button type="button" class="sim-btn" data-nudge="-1" aria-label="0.1 MHz 내리기">◀ 0.1</button><button type="button" class="sim-btn" data-nudge="1" aria-label="0.1 MHz 올리기">0.1 ▶</button><button type="button" class="sim-btn on" data-act="scan">스캔 시작</button></div>' +
          '<ul class="wl-list" data-role="flist"></ul><p class="wl-msg" data-role="msg1" role="status"></p></div>' +
        '<div class="sim-box"><h4><span class="wl-step">2</span>수신기 랙 · 송신기 <small>송신기 그림을 끌어 IR 창에 놓고 SYNC</small></h4><div class="wl-two">' +
          '<div class="wl-rack" data-role="rack">' + MICS.map(function (m, i) { return '<div class="wl-rx" data-rx="' + i + '">' +
              '<div class="wl-rx__name"><b style="color:' + (i === 0 ? '#93c5fd' : i === 1 ? '#c4b5fd' : '#67e8f9') + '">' + m.n + ' ' + m.name + ' 수신기</b><small>' + m.kind + '</small></div>' +
              '<div class="wl-lcd"><div class="wl-lcd__r"><span class="f" data-k="f"></span><span class="tx" data-k="tx"></span></div>' +
                '<div class="wl-lcd__r"><span>RF</span><span class="wl-rf" data-k="rf"><i></i><i></i><i></i><i></i><i></i></span><span class="wl-ab" data-k="ab"><em>A</em><em>B</em></span><span data-k="bat"></span></div>' +
                '<div class="wl-lcd__r"><span>AUDIO</span><span class="wl-meter" data-k="meter"><i></i><b style="left:60.9%"></b><b style="left:80.4%"></b></span><span class="wl-ol" data-k="ol">OL</span></div>' +
                '<div class="wl-lcd__r"><span class="wl-pk" data-k="pk"></span><span class="wl-st" data-k="st"></span></div></div>' +
              '<div class="wl-rx__ctl"><div class="wl-ir" data-ir="' + i + '">IR 창</div><button type="button" class="wl-sync" data-sync="' + i + '">SYNC</button></div></div>'; }).join('') + '</div>' +
          '<div class="wl-tray"><div class="wl-tray__h"><span>새 AA 배터리 세트: <b data-role="spares"></b></span><button type="button" class="sim-btn" data-act="spares">서랍에서 더 가져오기</button></div>' + MICS.map(function (m, i) { return '<div class="wl-tx" data-tx="' + i + '">' +
              '<div class="wl-grab" data-grab="' + i + '" title="끌어서 수신기 IR 창에 놓아요" aria-label="' + m.n + ' ' + m.name + ' 송신기 — 끌어서 수신기 IR 창에 놓기">' + txIcon(i, m.col) + '</div>' +
              '<div><div class="wl-tx__top"><b style="color:' + m.col + '">' + m.n + ' ' + m.name + ' 송신기</b><small>' + m.kind + '</small></div>' +
                '<div class="wl-tx__lcd"><span data-k="f"></span><span data-k="bat"></span><span class="d" data-k="dock"></span></div>' +
                '<div class="wl-tx__btns"><button type="button" class="sim-btn" data-pow="' + i + '">POWER</button><button type="button" class="sim-btn mute" data-mute="' + i + '">MUTE</button><button type="button" class="sim-btn" data-bat="' + i + '">배터리 교체</button></div>' +
                '<div class="wl-sens"><span>SENS</span><button type="button" class="sim-btn" data-sens="' + i + '" data-d="-3" aria-label="감도 3 dB 내리기">−</button>' +
                  '<div class="wl-track" data-track="' + i + '" tabindex="0" role="slider" aria-label="' + m.name + ' 송신기 감도" aria-valuemin="' + SENS_MIN + '" aria-valuemax="' + SENS_MAX + '"><i></i><b></b></div>' +
                  '<button type="button" class="sim-btn" data-sens="' + i + '" data-d="3" aria-label="감도 3 dB 올리기">+</button><output data-k="sens"></output></div></div></div>'; }).join('') +
            '<p class="wl-msg" data-role="msg2" role="status"></p></div></div></div>' +
        '<div class="sim-box"><h4><span class="wl-step">3</span>안테나 자리 · 걷기 테스트 <small>A · B 안테나를 끌어서 옮겨요</small></h4><div class="wl-roomwrap">' +
          '<svg class="wl-room" data-role="room" viewBox="0 0 380 528" role="img" aria-label="위에서 본 예배당과 안테나 위치"></svg>' +
          '<div class="wl-side"><div class="wl-legend"><span><i style="border-color:#16a34a"></i>막힘 없음 · RF 3칸 이상</span><span><i style="border-color:#d97706"></i>약함</span><span><i style="border-color:#dc2626;border-top-style:dashed"></i>막힘(벽·기둥)</span></div>' +
            '<ul class="wl-list" data-role="alist"></ul>' +
            '<button type="button" class="sim-btn sim-play" data-act="walk">걷기 테스트 시작</button><p class="wl-msg" data-role="msg3" role="status"></p></div></div></div>' +
      '</div>';
    var q = function (s) { return el.querySelector(s); }, qa = function (s) { return el.querySelectorAll(s); };
    var spec = q('[data-role=spec]'), room = q('[data-role=room]');
    var rxEls = Array.prototype.map.call(qa('.wl-rx'), function (r) { var o = {}; r.querySelectorAll('[data-k]').forEach(function (x) { o[x.getAttribute('data-k')] = x; }); o.ir = r.querySelector('[data-ir]'); return o; });
    var txEls = Array.prototype.map.call(qa('.wl-tx'), function (r) { var o = { root: r }; r.querySelectorAll('[data-k]').forEach(function (x) { o[x.getAttribute('data-k')] = x; }); o.track = r.querySelector('[data-track]'); o.pow = r.querySelector('[data-pow]'); o.mute = r.querySelector('[data-mute]'); return o; });
    function msg(n, h) { var m = q('[data-role=msg' + n + ']'); if (m) m.innerHTML = h || ''; }

    /* ------------------------------------------------ 계산 */
    function issues(i) {   // 고른 주파수 i 의 문제 (실제 상태 기준 — 화면에는 스캔 뒤에만 다른 신호를 보여 줌)
      var u = S.rx[i], out = [];
      if (u < MINF || u > MAXF) out.push('대역 끝에 너무 가까움');
      EXT.forEach(function (e) { if (u >= e.lo - GAP_EXT && u <= e.hi + GAP_EXT) out.push('다른 신호와 겹침(' + mhz(e.lo) + (e.hi > e.lo ? '–' + mhz(e.hi) : '') + ')'); });
      S.rx.forEach(function (v, j) { if (j !== i && Math.abs(v - u) < GAP_MIC) out.push(MICS[j].n + ' 와 너무 가까움'); });
      ims().forEach(function (p) { if (p.c === i) out.push('혼변조(' + MICS[p.a].n + '·' + MICS[p.b].n + ') 가 겹침'); });
      return out;
    }
    function ims() {   // 3차 혼변조 2·fa − fb 가 다른 마이크 c 에 GAP_IM 안으로 떨어지는 경우
      var out = [];
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) { if (a === b) continue; var p = 2 * S.rx[a] - S.rx[b];
        var hit = -1; for (var c = 0; c < 3; c++) if (c !== a && c !== b && Math.abs(p - S.rx[c]) < GAP_IM) hit = c;
        out.push({ a: a, b: b, f: p, c: hit }); }
      return out;
    }
    function allClean() { return [0, 1, 2].every(function (i) { return issues(i).length === 0; }); }
    function noisy(i) { var u = S.rx[i]; return EXT.some(function (e) { return u >= e.lo - GAP_EXT && u <= e.hi + GAP_EXT; }); }
    function perfPos(j) { if (S.walk && S.walk.pos) return S.walk.pos[j]; return MICS[j].home; }
    function best(p) { var a = link(S.ant.A, p), b = link(S.ant.B, p); return a.bars >= b.bars ? { bars: a.bars, ant: 'A', a: a, b: b } : { bars: b.bars, ant: 'B', a: a, b: b }; }
    function rxSignal(k) {   // 수신기 k 가 받는 송신기
      var js = []; S.tx.forEach(function (x, j) { if (x.on && x.bat > 0 && x.f === S.rx[k]) js.push(j); });
      if (!js.length) return { none: true };
      if (js.length > 1) return { dup: true, js: js };
      var j = js[0], bb = best(perfPos(j));
      if (bb.bars < 0.5) return { none: true, far: true, j: j };
      return { j: j, bars: bb.bars, ant: bb.ant, noisy: noisy(k) };
    }
    function okLink(j) { var r = rxSignal(j); return r.j === j && !r.dup && !r.none && !r.noisy; }
    function peak(j) { return MICS[j].base + S.tx[j].sens; }
    function antInfo() {
      var info = { rows: [], ok: true, why: [] };
      var sep = Math.hypot(S.ant.A[0] - S.ant.B[0], S.ant.A[1] - S.ant.B[1]);
      MICS.forEach(function (m, j) { var a = link(S.ant.A, m.home), b = link(S.ant.B, m.home); info.rows.push({ a: a, b: b });
        if (a.blocked || b.blocked) { info.ok = false; info.why.push(m.n + ' 쪽 선이 막혀요'); }
        if (a.bars < 3 || b.bars < 3) { info.ok = false; info.why.push(m.n + ' RF 3칸 미만'); } });
      var close = false; MICS.forEach(function (m) { pathPts(m.path, 30).forEach(function (p) { if (Math.hypot(p[0] - S.ant.A[0], p[1] - S.ant.A[1]) < 3 || Math.hypot(p[0] - S.ant.B[0], p[1] - S.ant.B[1]) < 3) close = true; }); });
      if (close) { info.ok = false; info.why.push('사람이 다니는 곳과 3 m 안쪽'); }
      if (sep < 1) { info.ok = false; info.why.push('A·B 가 너무 붙어 있어요'); }
      info.sep = sep; info.close = close; return info;
    }

    /* ------------------------------------------------ 과제 확인 (끌기 중에는 하지 않음) */
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function check() {
      if (S.drag || S.scanning || (S.walk && S.walk.running)) return;
      var clean = allClean();
      if (S.scan && S.scan.txOff && clean) hit('freq');
      if (S.scan && S.scan.txOff && clean && S.tx.every(function (x, j) { return x.f === S.rx[j]; })) hit('sync');
      if (antInfo().ok) hit('antenna');
      if ([0, 1, 2].every(function (j) { var p = peak(j); return okLink(j) && !S.tx[j].mute && p >= TARGET[0] && p <= TARGET[1]; })) hit('gain');
      if (S.tx.every(function (x) { return x.bat >= 4 && !x.mute && x.on; })) hit('battery');
    }

    /* ------------------------------------------------ 그리기: 스펙트럼 */
    var VBW = 640, SX0 = 36, SX1 = 624, SY0 = 26, SY1 = 146;   // 좁은 화면에서는 가로 좌표를 줄여 글자가 작아지지 않게 함
    function sx(u) { return SX0 + (u - LO) / (HI - LO) * (SX1 - SX0); }
    function specLevel(u10) {   // u10 = 0.01 MHz 단위 위치에서의 스캔 세기 0..1
      var u = u10 / 10, h = 0.05 + 0.05 * noiseAt(Math.round(u10));
      EXT.forEach(function (e) { var d = u < e.lo ? e.lo - u : u > e.hi ? u - e.hi : 0; h = Math.max(h, e.h * Math.exp(-d * d / 0.5)); });
      var sc = S.scanning ? S.scanning.res : S.scan; if (sc) sc.own.forEach(function (f) { var d = u - f; h = Math.max(h, 0.75 * Math.exp(-d * d / 0.35)); });
      return h;
    }
    function renderSpec() {
      var narrow = spec.clientWidth > 0 && spec.clientWidth < 520; VBW = narrow ? 380 : 640; SX0 = narrow ? 24 : 36; SX1 = VBW - 16; spec.setAttribute('viewBox', '0 0 ' + VBW + ' 200');
      var s = '<rect x="0" y="0" width="' + VBW + '" height="200" fill="#0b1220"/>';
      for (var g = 0; g <= 4; g++) s += '<path d="M' + SX0 + ' ' + (SY0 + g * 30) + 'H' + SX1 + '" stroke="#1e293b"/>';
      var prog = S.scanning ? S.scanning.p : (S.scan ? 1 : 0);
      if (prog > 0) {
        var end = LO * 10 + (HI - LO) * 10 * prog, d = 'M' + SX0 + ' ' + SY1;
        for (var u10 = LO * 10; u10 <= end; u10 += 4) d += 'L' + (SX0 + (u10 / 10 - LO) / (HI - LO) * (SX1 - SX0)).toFixed(1) + ' ' + (SY1 - specLevel(u10) * (SY1 - SY0)).toFixed(1);
        var xe = (SX0 + (end / 10 - LO) / (HI - LO) * (SX1 - SX0)).toFixed(1);
        s += '<path d="' + d + 'L' + xe + ' ' + SY1 + 'Z" fill="rgba(56,189,248,.22)" stroke="#38bdf8" stroke-width="1.4"/>';
        if (S.scanning) s += '<path d="M' + xe + ' ' + SY0 + 'V' + SY1 + '" stroke="#fbbf24" stroke-width="2"/>';
      } else {
        var cx = (SX0 + SX1) / 2; s += '<text x="' + cx + '" y="78" font-size="14" font-weight="700" fill="#94a3b8" text-anchor="middle">아직 스캔하지 않았어요</text>' + (narrow ? '<text x="' + cx + '" y="100" font-size="12" fill="#94a3b8" text-anchor="middle">송신기를 끄고 「스캔 시작」을 눌러</text><text x="' + cx + '" y="117" font-size="12" fill="#94a3b8" text-anchor="middle">주변 전파를 확인해요</text>' : '<text x="' + cx + '" y="102" font-size="12" fill="#94a3b8" text-anchor="middle">송신기를 끄고 「스캔 시작」을 눌러 주변 전파를 확인해요</text>');
      }
      if (S.scan && !S.scanning) {
        EXT.concat(S.scan.own.map(function (f) { return { lo: f, hi: f }; })).forEach(function (e) { s += '<text x="' + sx((e.lo + e.hi) / 2).toFixed(1) + '" y="' + (SY0 + 12) + '" font-size="10.5" font-weight="700" fill="#fca5a5" text-anchor="middle">사용 중</text>'; });
      }
      // 혼변조 (주황 ▲)
      ims().forEach(function (p) { if (p.f < LO || p.f > HI) return; var x = sx(p.f).toFixed(1), bad = p.c >= 0;
        s += '<path d="M' + x + ' ' + (SY1 + 2) + 'l-5 9h10z" fill="' + (bad ? '#ef4444' : '#fb923c') + '"><title>혼변조 2×' + MICS[p.a].n + ' − ' + MICS[p.b].n + ' = ' + mhz(p.f) + ' MHz</title></path>'; });
      // 마이크 표시
      S.rx.forEach(function (u, i) { var x = sx(u).toFixed(1), m = MICS[i], sel = i === S.sel;
        s += '<path d="M' + x + ' ' + (SY0 - 4) + 'V' + SY1 + '" stroke="' + m.col + '" stroke-width="' + (sel ? 3.5 : 2.4) + '"/>' +
          '<circle cx="' + x + '" cy="' + (SY0 - 12) + '" r="' + (sel ? 11 : 9) + '" fill="' + m.col + '" stroke="#fff" stroke-width="' + (sel ? 2 : 0) + '"/><text x="' + x + '" y="' + (SY0 - 8) + '" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">' + (i + 1) + '</text>'; });
      s += '<path d="M' + SX0 + ' ' + SY1 + 'H' + SX1 + '" stroke="#64748b"/>';
      [9250, 9275, 9300, 9325, 9350, 9375].forEach(function (u) { s += '<path d="M' + sx(u) + ' ' + SY1 + 'v14" stroke="#475569"/><text x="' + sx(u) + '" y="' + (SY1 + 28) + '" font-size="11" fill="#94a3b8" text-anchor="middle">' + mhz(u) + '</text>'; });
      s += '<text x="' + SX1 + '" y="194" font-size="10" fill="#94a3b8" text-anchor="end">' + (narrow ? 'MHz · ▲ 가짜 신호 (빨강 = 겹침)' : 'MHz · ▲ = 혼변조(가짜 신호) 자리 (빨강 = 마이크와 겹침)') + '</text>';
      spec.innerHTML = s;
    }
    function renderFlist() {
      var h = MICS.map(function (m, i) {
        var is = issues(i), known = !!S.scan, shown = is.filter(function (x) { return known || x.indexOf('다른 신호') < 0; });
        var cls = shown.length ? 'bad' : (known ? 'ok' : 'unk');
        return '<li class="' + cls + '"><b style="color:' + m.col + '">' + m.n + ' ' + mhz(S.rx[i]) + ' MHz</b><span>' + (shown.length ? '⚠ ' + shown.join(' · ') : known ? '✓ 깨끗해요' : '다른 신호는 스캔해야 알 수 있어요') + '</span></li>';
      }).join('');
      q('[data-role=flist]').innerHTML = h;
    }

    /* ------------------------------------------------ 그리기: 수신기 · 송신기 */
    function renderRack() {
      MICS.forEach(function (m, k) {
        var r = rxEls[k], sig = rxSignal(k), txt = '', st = '', stc = '';
        r.f.textContent = 'RX ' + mhz(S.rx[k]) + ' MHz';
        if (sig.dup) { txt = 'TX 2대!'; st = '같은 주파수 송신기가 2대예요'; stc = 'bad'; }
        else if (sig.none) { txt = '-No TX-'; st = sig.far ? '전파가 너무 약해요' : '이 주파수 송신기가 없어요'; stc = 'bad'; }
        else { txt = 'TX ' + MICS[sig.j].n; if (sig.j !== k) { st = MICS[sig.j].n + ' 송신기가 들어와요!'; stc = 'bad'; } else if (sig.noisy) { st = '잡음 · 간섭'; stc = 'bad'; } else if (S.tx[sig.j].mute) { st = 'TX MUTE'; stc = 'bad'; } else if (sig.bars < 1.5) { st = 'RF 약함 · 끊김'; stc = 'bad'; } else { st = '정상'; stc = 'ok'; } }
        r.tx.textContent = txt; r.tx.className = 'tx' + (sig.none || sig.dup || (sig.j != null && sig.j !== k) ? ' bad' : '');
        var bars = sig.none || sig.dup ? 0 : Math.round(sig.bars);
        r.rf.querySelectorAll('i').forEach(function (x, i) { x.classList.toggle('on', i < bars); });
        var ab = r.ab.querySelectorAll('em'); ab[0].classList.toggle('on', !!(bars && sig.ant === 'A')); ab[1].classList.toggle('on', !!(bars && sig.ant === 'B'));
        r.bat.innerHTML = sig.j != null && !sig.none ? cellsHtml(S.tx[sig.j].bat) : '';
        r.st.textContent = st; r.st.className = 'wl-st ' + stc;
        r.ir.classList.toggle('docked', S.dock[k] != null); r.ir.textContent = S.dock[k] != null ? MICS[S.dock[k]].n + ' 대어 있음' : 'IR 창';
      });
    }
    function renderTx() {
      S.tx.forEach(function (x, j) {
        var e = txEls[j]; e.root.classList.toggle('off', !x.on);
        e.f.textContent = x.on ? mhz(x.f) + ' MHz' : '전원 꺼짐'; e.bat.innerHTML = cellsHtml(x.bat);
        var k = S.dock.indexOf(j); e.dock.textContent = k >= 0 ? '→ ' + MICS[k].n + ' 수신기 IR 창' : '';
        e.pow.classList.toggle('on', x.on); e.pow.textContent = x.on ? 'POWER 켜짐' : 'POWER 꺼짐';
        e.mute.classList.toggle('on', x.mute); e.mute.textContent = x.mute ? 'MUTE 켜짐' : 'MUTE 꺼짐';
        var f = (x.sens - SENS_MIN) / (SENS_MAX - SENS_MIN) * 100; e.track.querySelector('i').style.width = f + '%'; e.track.querySelector('b').style.left = f + '%';
        e.track.setAttribute('aria-valuenow', x.sens); e.track.setAttribute('aria-valuetext', x.sens + ' dB');
        e.sens.textContent = (x.sens > 0 ? '+' : x.sens < 0 ? '−' : '') + Math.abs(x.sens) + ' dB';
      });
      q('[data-role=spares]').textContent = S.spares + '개';
    }

    /* ------------------------------------------------ 그리기: 방 */
    var RK = 18, RO = 10;
    function rx_(x) { return RO + x * RK; } function ry_(y) { return RO + y * RK; }
    function renderRoom() {
      var s = '<rect x="' + RO + '" y="' + RO + '" width="' + ROOM.w * RK + '" height="' + ROOM.d * RK + '" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>';
      s += '<rect x="' + rx_(3) + '" y="' + ry_(0) + '" width="' + 14 * RK + '" height="' + 5.8 * RK + '" fill="#fef3c7" stroke="#fcd34d"/><text x="' + rx_(3.4) + '" y="' + ry_(5.3) + '" font-size="11" font-weight="700" fill="#92400e">강단 · 무대</text>';
      for (var r = 0; r < 8; r++) { var yy = ry_(10.6 + r * 1.6); s += '<path d="M' + rx_(1.5) + ' ' + yy + 'H' + rx_(8.8) + 'M' + rx_(11.2) + ' ' + yy + 'H' + rx_(18.5) + '" stroke="#e2e8f0" stroke-width="7" stroke-linecap="round"/>'; }
      s += '<text x="' + rx_(10) + '" y="' + ry_(19.5) + '" font-size="11" fill="#94a3b8" text-anchor="middle">회중석</text>';
      PILLARS.forEach(function (p) { s += '<rect x="' + rx_(p.x0) + '" y="' + ry_(p.y0) + '" width="' + (p.x1 - p.x0) * RK + '" height="' + (p.y1 - p.y0) * RK + '" fill="#64748b"/><text x="' + rx_((p.x0 + p.x1) / 2) + '" y="' + ry_(p.y1 + 1) + '" font-size="10" fill="#475569" text-anchor="middle">기둥</text>'; });
      s += '<rect x="' + rx_(BOOTH.x0) + '" y="' + ry_(BOOTH.y0) + '" width="' + (BOOTH.x1 - BOOTH.x0) * RK + '" height="' + (BOOTH.y1 - BOOTH.y0) * RK + '" fill="#e2e8f0" stroke="#334155" stroke-width="4"/>';
      s += '<rect x="' + rx_(9.4) + '" y="' + ry_(26.7) + '" width="' + 1.2 * RK + '" height="' + 0.9 * RK + '" fill="#1f2933"/><text x="' + rx_(BOOTH.x0 - 0.3) + '" y="' + ry_(25.4) + '" font-size="10.5" font-weight="700" fill="#334155" text-anchor="end">방송실</text><text x="' + rx_(BOOTH.x0 - 0.3) + '" y="' + ry_(26.2) + '" font-size="9.5" fill="#64748b" text-anchor="end">(벽 · 유리 · 랙)</text>';
      MICS.forEach(function (m) { var d = 'M' + m.path.map(function (p) { return rx_(p[0]).toFixed(1) + ' ' + ry_(p[1]).toFixed(1); }).join('L'); s += '<path d="' + d + '" fill="none" stroke="' + m.col + '" stroke-opacity=".35" stroke-width="2" stroke-dasharray="4 4"/>'; });
      // 가시선
      ['A', 'B'].forEach(function (k) { var a = S.ant[k]; MICS.forEach(function (m, j) { var p = perfPos(j), L = link(a, p), col = L.blocked ? '#dc2626' : L.bars >= 3 ? '#16a34a' : '#d97706';
        s += '<path d="M' + rx_(a[0]).toFixed(1) + ' ' + ry_(a[1]).toFixed(1) + 'L' + rx_(p[0]).toFixed(1) + ' ' + ry_(p[1]).toFixed(1) + '" stroke="' + col + '" stroke-width="1.8" stroke-opacity=".8"' + (L.blocked ? ' stroke-dasharray="5 4"' : '') + '/>'; }); });
      MICS.forEach(function (m, j) { var p = perfPos(j); s += '<circle cx="' + rx_(p[0]).toFixed(1) + '" cy="' + ry_(p[1]).toFixed(1) + '" r="10" fill="' + m.col + '" stroke="#fff" stroke-width="2"/><text x="' + rx_(p[0]).toFixed(1) + '" y="' + (ry_(p[1]) + 4).toFixed(1) + '" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">' + (j + 1) + '</text>'; });
      var info = antInfo();
      ['A', 'B'].forEach(function (k) { var a = S.ant[k], x = rx_(a[0]), y = ry_(a[1]), close = MICS.some(function (m) { return pathPts(m.path, 30).some(function (p) { return Math.hypot(p[0] - a[0], p[1] - a[1]) < 3; }); });
        if (close) s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (3 * RK) + '" fill="rgba(220,38,38,.07)" stroke="#dc2626" stroke-dasharray="4 3"/>';
        s += '<g class="ant" data-ant="' + k + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="20" fill="transparent"/><path d="M' + x.toFixed(1) + ' ' + (y + 9).toFixed(1) + 'V' + (y - 13).toFixed(1) + '" stroke="#0c1f3b" stroke-width="3.5" stroke-linecap="round"/><circle cx="' + x.toFixed(1) + '" cy="' + (y - 13).toFixed(1) + '" r="4" fill="#0c1f3b"/>' +
          '<rect x="' + (x + 5).toFixed(1) + '" y="' + (y - 4).toFixed(1) + '" width="18" height="16" rx="4" fill="' + (S.drag && S.drag.ant === k ? '#fbbf24' : '#0c1f3b') + '"/><text x="' + (x + 14).toFixed(1) + '" y="' + (y + 8).toFixed(1) + '" font-size="11" font-weight="800" fill="' + (S.drag && S.drag.ant === k ? '#0c1f3b' : '#fff') + '" text-anchor="middle">' + k + '</text></g>'; });
      s += '<text x="' + rx_(19.6) + '" y="' + ry_(27.6) + '" font-size="9.5" fill="#64748b" text-anchor="end">가로 20 m × 세로 28 m</text><text x="' + rx_(19.6) + '" y="' + ry_(26.9) + '" font-size="9.5" fill="#64748b" text-anchor="end">그림용 단순화</text>';
      room.innerHTML = s;
      var al = MICS.map(function (m, j) { var row = info.rows[j], A = row.a, B = row.b;
        function one(L) { return (L.blocked ? '막힘' : 'RF ' + L.bars.toFixed(1)) ; }
        var ok = !A.blocked && !B.blocked && A.bars >= 3 && B.bars >= 3;
        return '<li class="' + (ok ? 'ok' : 'bad') + '"><b style="color:' + m.col + '">' + m.n + ' ' + m.name + '</b><span>A ' + one(A) + ' · B ' + one(B) + '</span></li>'; }).join('');
      al += '<li class="' + (info.close || info.sep < 1 ? 'bad' : 'ok') + '"><b>간격</b><span>A–B ' + info.sep.toFixed(1) + ' m' + (info.close ? ' · 사람 동선과 3 m 안쪽!' : ' · 사람과 3 m 이상') + '</span></li>';
      q('[data-role=alist]').innerHTML = al;
    }
    function update() { renderSpec(); renderFlist(); renderRack(); renderTx(); renderRoom(); }

    /* ------------------------------------------------ 애니메이션: 미터 · 스캔 · 걷기 */
    function frame(now) {
      if (!alive) return; raf = requestAnimationFrame(frame);
      var t = (now - S.t0) / 1000;
      if (S.drag && S.drag.tx != null && ghost && lastPt) {   // 휴대폰처럼 수신기가 화면 밖에 있으면 끄는 동안 화면을 굴려 줌
        var vh = window.innerHeight, edge = 70, dy = lastPt.clientY < edge ? -(edge - lastPt.clientY) / 3 : lastPt.clientY > vh - edge ? (lastPt.clientY - (vh - edge)) / 3 : 0;
        if (dy) { window.scrollBy(0, Math.round(clamp(dy, -24, 24))); moveGhost(lastPt); }
      }
      if (S.scanning) {
        S.scanning.p = clamp((now - S.scanning.t0) / 1400, 0, 1); renderSpec();
        if (S.scanning.p >= 1) { S.scan = S.scanning.res; S.scanning = null; scanDone(); }
      }
      if (S.walk && S.walk.running) {
        var f = clamp((now - S.walk.t0) / 4200, 0, 1); S.walk.pos = MICS.map(function (m) { return posAt(m.path, f); });
        renderRoom(); renderRack();
        if (f >= 1) walkDone();
      }
      MICS.forEach(function (m, k) {
        var r = rxEls[k], sig = rxSignal(k), lvl = -60;
        if (!sig.none && !sig.dup && !S.tx[sig.j].mute) {
          var j = sig.j, ph = (t * 1.6 + j * 0.37) % 1, e = ph < 0.75 ? 0.3 + 0.7 * Math.pow(Math.sin(Math.PI * ph / 0.75), 2) : 0.05;
          lvl = peak(j) - 26 * (1 - e);
          if (sig.noisy) lvl = Math.max(lvl, -18 + 6 * Math.sin(t * 9 + k));
          if (sig.bars < 1.5 && Math.sin(t * 7.3 + k * 2.1) > 0.35) lvl = -60;   // RF 가 약하면 소리가 끊김
          r.pk.textContent = '가장 큰 순간 ' + (peak(j) > 0 ? '+' : peak(j) < 0 ? '−' : '') + Math.abs(peak(j)) + ' dB';
        } else r.pk.textContent = '소리 없음';
        var w = clamp((lvl + 40) / 46, 0, 1);
        r.meter.querySelector('i').style.clipPath = 'inset(0 ' + ((1 - w) * 100).toFixed(1) + '% 0 0)';
        if (lvl >= 0) olHold[k] = now + 350;
        r.ol.classList.toggle('on', now < olHold[k]);
      });
    }
    function startScan() {
      if (S.scanning) return;
      var own = S.tx.filter(function (x) { return x.on; }).map(function (x) { return x.f; });
      S.scanning = { t0: performance.now(), p: 0, res: { txOff: own.length === 0, own: own } };
      S.scan = null; msg(1, '스캔하는 중이에요…');
    }
    function scanDone() {
      if (S.scan.txOff) msg(1, '스캔 끝! 「사용 중」(다른 무선기기, 교육용 예시)과 주황 ▲(혼변조)를 피해서 ①②③ 주파수를 골라요. 그림을 누르거나 번호 동그라미를 끌어서 옮겨요.');
      else msg(1, '⚠ 송신기 ' + S.scan.own.length + '대가 켜진 채로 스캔했어요. 그러면 우리 마이크 신호도 「사용 중」으로 잡혀요. 빈 곳을 제대로 알 수 없어요. 아래 송신기 POWER 를 모두 끄고 다시 스캔해요.');
      update(); check();
    }
    function startWalk() {
      if (S.walk && S.walk.running) return;
      S.walk = { running: true, t0: performance.now(), pos: MICS.map(function (m) { return m.home.slice(); }) }; msg(3, '세 사람이 평소 다니는 길을 걷고 있어요… 수신기 랙의 RF 칸과 A·B 표시를 보세요.');
    }
    function walkDone() {
      var res = MICS.map(function (m, j) { var mn = 5, close = false; pathPts(m.path, 40).forEach(function (p) { var b = best(p); mn = Math.min(mn, b.bars); if (b.a.close || b.b.close) close = true; }); return { min: mn, close: close, link: okLink(j) && issues(j).length === 0 }; });
      S.walk = null; S.walkResult = { rows: res, pass: res.every(function (r) { return r.min >= 2 && !r.close && r.link; }) };
      var lines = res.map(function (r, j) { return MICS[j].n + ' ' + (r.link ? '가장 약한 순간 RF ' + r.min.toFixed(1) + '칸' + (r.close ? ' · 안테나와 너무 가까움' : '') : '수신기와 연결 안 됨(주파수 · 싱크 · 배터리 확인)'); }).join('<br>');
      msg(3, (S.walkResult.pass ? '✓ 걷기 테스트 통과! 끊기는 곳이 없어요.<br>' : '✗ 끊길 수 있는 곳이 있어요. (통과하려면: RF 2칸 이상 · 모두 연결 · 안테나와 3 m 이상)<br>') + lines);
      update();
      if (S.walkResult.pass) hit('walk');
      check();
    }

    /* ------------------------------------------------ 입력 */
    function svgPt(svgEl, e, W, H) { var r = svgEl.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
    function specFreq(x) { return clamp(Math.round(LO + (x - SX0) / (SX1 - SX0) * (HI - LO)), LO, HI); }
    function onSpecDown(e) {
      if (S.scanning) return; e.preventDefault();
      var p = svgPt(spec, e, VBW, 200), near = -1, nd = 12;
      S.rx.forEach(function (u, i) { var d = Math.abs(sx(u) - p[0]); if (d < nd) { nd = d; near = i; } });
      if (near >= 0) S.sel = near;
      S.drag = { spec: true }; S.rx[S.sel] = specFreq(p[0]); selChips();
      try { spec.setPointerCapture(e.pointerId); } catch (x) { /* noop */ }
      renderSpec(); renderFlist();
    }
    function selChips() { qa('[data-sel]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-sel') === S.sel)); }); }
    var ghost = null, hotIr = null;
    function onDown(e) {
      var g = e.target.closest('[data-grab]'), tr = e.target.closest('[data-track]'), an = e.target.closest('.wl-room .ant');
      if (g) { e.preventDefault(); var j = +g.getAttribute('data-grab'); S.drag = { tx: j };
        ghost = document.createElement('div'); ghost.className = 'wl-ghost'; ghost.innerHTML = txIcon(j, MICS[j].col); document.body.appendChild(ghost); moveGhost(e); return; }
      if (tr) { e.preventDefault(); var k = +tr.getAttribute('data-track'); S.drag = { sens: k, el: tr }; tr.focus({ preventScroll: true }); setSensFrom(e); return; }
      if (an) { e.preventDefault(); S.drag = { ant: an.getAttribute('data-ant') }; moveAnt(e); }
    }
    var lastPt = null;
    function moveGhost(e) {
      lastPt = { clientX: e.clientX, clientY: e.clientY };
      ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
      var under = document.elementFromPoint(e.clientX, e.clientY), row = under && under.closest ? under.closest('[data-rx]') : null, ir = row ? row.querySelector('[data-ir]') : null;   // 수신기 카드 어디에 놓아도 그 IR 창으로
      if (ir && !el.contains(ir)) ir = null;
      if (hotIr && hotIr !== ir) hotIr.classList.remove('hot'); hotIr = ir; if (ir) ir.classList.add('hot');
    }
    function setSensFrom(e) { var r = S.drag.el.getBoundingClientRect(), f = clamp((e.clientX - r.left) / r.width, 0, 1), v = SENS_MIN + Math.round(f * (SENS_MAX - SENS_MIN) / SENS_STEP) * SENS_STEP; S.tx[S.drag.sens].sens = v; renderTx(); }
    function moveAnt(e) { var p = svgPt(room, e, 380, 528); S.ant[S.drag.ant] = [clamp((p[0] - RO) / RK, 0.4, ROOM.w - 0.4), clamp((p[1] - RO) / RK, 0.4, ROOM.d - 0.4)]; renderRoom(); renderRack(); }
    function onMove(e) {
      if (!S.drag) return;
      if (S.drag.spec) { e.preventDefault(); S.rx[S.sel] = specFreq(svgPt(spec, e, VBW, 200)[0]); renderSpec(); renderFlist(); renderRack(); }
      else if (S.drag.tx != null && ghost) { e.preventDefault(); moveGhost(e); }
      else if (S.drag.sens != null) { e.preventDefault(); setSensFrom(e); }
      else if (S.drag.ant) { e.preventDefault(); moveAnt(e); }
    }
    function onUp(e) {
      if (!S.drag) return; var d = S.drag;
      if (d.tx != null) {
        if (ghost) { ghost.remove(); ghost = null; } lastPt = null;
        var ir = hotIr; if (hotIr) hotIr.classList.remove('hot'); hotIr = null;
        if (ir) { var k = +ir.getAttribute('data-ir'); S.dock = S.dock.map(function (v) { return v === d.tx ? null : v; }); S.dock[k] = d.tx;
          msg(2, MICS[d.tx].n + ' 송신기를 ' + MICS[k].n + ' 수신기 IR 창에 댔어요. 그 수신기의 SYNC 를 누르세요.' + (d.tx !== k ? ' (번호가 달라요 — 정말 이 수신기와 짝을 맞출까요?)' : '')); }
        else msg(2, '송신기 그림을 수신기의 빨간 IR 창 위에 놓아 주세요.');
      }
      S.drag = null; update(); check();
    }
    function onClick(e) {
      var b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      if (b.hasAttribute('data-sel')) { S.sel = +b.getAttribute('data-sel'); selChips(); renderSpec(); return; }
      if (b.hasAttribute('data-nudge')) { S.rx[S.sel] = clamp(S.rx[S.sel] + +b.getAttribute('data-nudge'), LO, HI); update(); check(); return; }
      var act = b.getAttribute('data-act');
      if (act === 'scan') { startScan(); return; }
      if (act === 'walk') { startWalk(); return; }
      if (act === 'spares') { S.spares = 2; msg(2, '방송실 서랍에서 새 배터리 세트 2개를 가져왔어요.'); renderTx(); return; }
      if (b.hasAttribute('data-sync')) { var k = +b.getAttribute('data-sync'), j = S.dock[k];
        if (j == null) msg(2, '먼저 송신기 그림을 끌어서 ' + MICS[k].n + ' 수신기 IR 창에 대어 주세요.');
        else if (!S.tx[j].on) msg(2, MICS[j].n + ' 송신기 전원이 꺼져 있어요. POWER 를 켜야 싱크돼요.');
        else { S.tx[j].f = S.rx[k]; S.dock[k] = null; msg(2, '✓ ' + MICS[j].n + ' 송신기를 ' + mhz(S.rx[k]) + ' MHz(' + MICS[k].n + ' 수신기)로 맞췄어요.'); }
        update(); check(); return; }
      if (b.hasAttribute('data-pow')) { var p = +b.getAttribute('data-pow'); S.tx[p].on = !S.tx[p].on; update(); check(); return; }
      if (b.hasAttribute('data-mute')) { var mu = +b.getAttribute('data-mute'); S.tx[mu].mute = !S.tx[mu].mute; update(); check(); return; }
      if (b.hasAttribute('data-bat')) { var bt = +b.getAttribute('data-bat');
        if (S.spares <= 0) msg(2, '새 배터리가 없어요. 「서랍에서 더 가져오기」를 누르세요.');
        else { var was = S.tx[bt].bat; S.spares--; S.tx[bt].bat = 5; msg(2, was >= 4 ? MICS[bt].n + ' 은 배터리가 넉넉했어요(' + was + '칸). 꼭 필요한 송신기부터 바꿔요.' : '✓ ' + MICS[bt].n + ' 송신기 배터리를 새 것으로 바꿨어요.'); }
        update(); check(); return; }
      if (b.hasAttribute('data-sens')) { var sj = +b.getAttribute('data-sens'); S.tx[sj].sens = clamp(S.tx[sj].sens + +b.getAttribute('data-d'), SENS_MIN, SENS_MAX); renderTx(); check(); return; }
    }
    function onKey(e) {
      var tr = e.target.closest && e.target.closest('[data-track]'); if (!tr) return;
      var j = +tr.getAttribute('data-track'), d = { ArrowLeft: -3, ArrowDown: -3, ArrowRight: 3, ArrowUp: 3 }[e.key]; if (!d) return;
      e.preventDefault(); S.tx[j].sens = clamp(S.tx[j].sens + d, SENS_MIN, SENS_MAX); renderTx();
    }
    function onKeyUp(e) { if (e.target.closest && e.target.closest('[data-track]')) check(); }
    spec.addEventListener('pointerdown', onSpecDown);
    el.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove, { passive: false }); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClick); el.addEventListener('keydown', onKey); el.addEventListener('keyup', onKeyUp);
    msg(1, '지난주 설정(926.0 · 927.0 · 928.0 MHz)이 그대로예요. 먼저 송신기를 끄고 스캔해 보세요.');
    msg(2, '② 목사님 송신기의 MUTE(소리 끄기)가 켜져 있어요. 배터리가 약한 송신기도 있어요. 수신기 화면을 확인해요.');
    msg(3, '안테나가 방송실 안, 랙 옆에 있어요. 벽 · 유리에 막혀서 전파가 약해요.');
    update(); raf = requestAnimationFrame(frame);

    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); if (ghost) ghost.remove(); spec.removeEventListener('pointerdown', onSpecDown); el.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); el.removeEventListener('click', onClick); el.removeEventListener('keydown', onKey); el.removeEventListener('keyup', onKeyUp); el.innerHTML = ''; },
      state: function () {
        return { ready: true, done: Object.keys(S.done), rx: S.rx.map(function (u) { return u / 10; }), sel: S.sel,
          tx: S.tx.map(function (x) { return { freq: x.f / 10, power: x.on, mute: x.mute, bat: x.bat, sens: x.sens }; }),
          scan: S.scan ? { txOff: S.scan.txOff } : null, scanning: !!S.scanning, issues: [0, 1, 2].map(issues), clean: allClean(),
          linked: [0, 1, 2].map(okLink), peaks: [0, 1, 2].map(peak), dock: S.dock.slice(), spares: S.spares,
          ant: { A: S.ant.A.slice(), B: S.ant.B.slice() }, antOk: antInfo().ok, antWhy: antInfo().why,
          walking: !!(S.walk && S.walk.running), walk: S.walkResult, dragging: !!S.drag };
      },
      set: function (o) {   // 시험용
        o = o || {};
        if (o.rx) o.rx.forEach(function (f, i) { if (f != null) S.rx[i] = clamp(Math.round(f * 10), LO, HI); });
        if (o.tx) o.tx.forEach(function (x, i) { if (!x) return; var T = S.tx[i]; if (x.freq != null) T.f = Math.round(x.freq * 10); if (x.power != null) T.on = !!x.power; if (x.mute != null) T.mute = !!x.mute; if (x.bat != null) T.bat = clamp(+x.bat, 0, 5); if (x.sens != null) T.sens = clamp(Math.round(x.sens / 3) * 3, SENS_MIN, SENS_MAX); });
        if (o.ant) { if (o.ant.A) S.ant.A = o.ant.A.slice(); if (o.ant.B) S.ant.B = o.ant.B.slice(); }
        update(); check(); return this.state();
      }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.wirelessBench = wirelessBench;
})();

/* =========================================================================== 모듈 데이터 */
(function () {
  'use strict';
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['mic-wireless'] = {
    id: 'mic-wireless', path: 'hardware', no: 1, noLabel: '01-2', status: 'ready', level: '기본', minutes: 40, img: 'https://products.shureweb.eu/cdn-cgi/image/width=900,height=900,format=auto/shure_product_db/product_main_images/files/67c/0a4/37-/original/a63ca7f1e7b45a53c3f11898a7c6280a.webp', imgPos: '50% 55%', imgFallback: 'img/modules/hw_mic.jpg'   /* 2026-11-04: Shure SLX-D+ 공식 제품 사진(사이트에서 바로 불러옴), 실패하면 01-1 사진 */,   // 썸네일은 01-1 사진을 잠시 같이 씀
    title: '무선 마이크', sub: '전파로 소리를 보내는 마이크 — 주파수 · 안테나 · 배터리',
    topics: ['송신기와 수신기', '우리나라 무선마이크 주파수', '스캔 · 혼변조 · 싱크', '다이버시티와 안테나', '송신기 감도와 게인 구조', '예배 전 점검'],
    glanceDraft: {
      glance: [
        ['무선 마이크', '마이크 소리를 전파에 실어 보내고(송신기), 받아서(수신기) 콘솔로 넣는 장비'],
        ['주파수', '송신기와 수신기가 맞춰 쓰는 전파 자리 — 우리나라는 쓸 수 있는 대역이 법으로 정해져 있어요'],
        ['다이버시티', '안테나 두 개로 받아 더 좋은 쪽을 고르는 방식 — 끊김이 줄어요'],
        ['RF 미터', '수신기가 받는 전파 세기 표시 — 소리 크기(오디오 미터)와 따로 봐요']
      ],
      heroVis: 'wlSystem'
    },
    overview: {
      lead: '무선 마이크는 줄 없이 <b>전파</b>로 소리를 보내는 마이크예요. 라디오처럼 <b>송신기</b>가 보내고, <b>수신기</b>가 받아요. 그래서 <b>주파수 · 안테나 · 배터리</b>를 잘 챙겨야 해요.',
      terms: [
        ['송신기 (핸드헬드 · 벨트팩)', '소리를 전파로 보내는 「작은 방송국」이에요. 손에 쥐는 것, 허리에 차는 것이 있어요.'],
        ['수신기', '송신기 전파를 받는 「라디오」 같은 상자예요. 받은 소리를 콘솔로 보내요.'],
        ['헤드셋 · 핀 마이크 (라발리에)', '벨트팩에 꽂는 작은 마이크예요. 헤드셋은 귀에 걸고, 핀 마이크는 옷깃에 달아요.'],
        ['UHF 주파수', '무선 마이크가 많이 쓰는 전파 구간이에요. 어느 구간을 쓸지는 나라가 법으로 정해요.'],
        ['혼변조 (IMD)', '송신기 전파끼리 섞여 생긴 「가짜 신호」예요. 다른 마이크와 겹치면 잡음이 나요.'],
        ['스캔 · 싱크 (IR)', '스캔은 빈 주파수 찾기예요. 싱크는 송신기를 수신기 주파수에 맞추는 일이에요.'],
        ['다이버시티', '안테나 두 개 중 잘 받는 쪽을 쓰는 방식이에요. 창문 둘 중 잘 보이는 쪽을 보는 것과 같아요.', 'wlTermDiv'],
        ['RF 미터', '수신기가 받는 전파 세기를 칸으로 보여 줘요. 칸이 떨어지면 소리가 끊길 수 있어요.', 'wlTermRf']
      ],
      points: [
        '<b>742–752 MHz</b>(옛 700 MHz 대역) 무선 마이크는 쓰면 안 돼요. 장비 라벨의 주파수를 꼭 확인해요.',
        '주파수는 <b>송신기 끄고 스캔</b> → 빈 곳 고르기 → <b>IR 싱크</b> 순서로 맞춰요. 똑같은 간격으로 줄 세우지 않아요.',
        '예배 전에는 <b>새 배터리 · MUTE · 미터 · 걷기 테스트</b>를 확인해요. <b>유선 예비 마이크</b>도 준비해요.'
      ],
      model: null
    },
    theory: [
      { title: '무선 마이크는 세 부분 — 송신기 · 수신기 · 안테나', visual: 'wlSystem',
        body: '라디오를 떠올려 보세요. 방송국이 전파를 보내면, 집 라디오가 받아서 소리를 내요. 무선 마이크도 똑같아요. <b>송신기</b>가 소리를 전파로 보내고, <b>수신기</b>가 받아요. 전파를 내보내고 받는 막대가 <b>안테나</b>예요. 수신기는 받은 소리를 XLR 케이블로 콘솔에 보내요. 줄이 없어서 무대에서 마음껏 움직일 수 있어요. 찬양 인도자와 사회자는 손에 드는 <b>핸드헬드</b>를 많이 써요. 설교자는 손이 자유로운 <b>벨트팩 + 헤드셋</b>을 많이 써요. 콘솔에서 보면 수신기 하나는 마이크 한 개와 같아요. 기억해요: 송신기와 수신기는 늘 한 쌍이에요.',
        more: '<ul><li><b>핸드헬드</b>: 마이크 머리(캡슐) · 송신기 · 배터리가 한 몸에 들어 있어요. 유선 마이크보다 조금 큰 정도예요(Shure 안내).</li> <li>핸드헬드의 캡슐은 다이내믹 · 콘덴서 둘 다 있어요. 지향성 · 거리 · 근접 효과는 「01-1 유선 마이크」와 똑같아요.</li> <li><b>벨트팩</b>: 허리띠에 끼우거나 몸에 차는 작은 송신기예요. 헤드셋 · 핀 마이크 · 악기 케이블을 꽂아 써요.</li> <li><b>벨트팩 입력 단자</b>: 회사마다 달라요(3.5 mm 잭, 작은 XLR 모양 등). 모양이 같아도 속의 선 연결이 다를 수 있어요. 다른 회사 헤드셋을 꽂기 전에 맞는지 꼭 확인해요(교재).</li> <li><b>플러그온 송신기</b>: 유선 마이크의 XLR 끝에 꽂아 무선으로 바꿔 주는 작은 송신기예요. 콘덴서 마이크용 팬텀 전원을 주는 제품도 있어요(교재).</li> <li><b>헤드셋과 핀 마이크</b>: 헤드셋은 입과의 거리가 늘 비슷해서 소리가 고르게 나요. 핀 마이크는 입에서 더 멀어요. 그래서 GAIN(들어온 소리를 키우는 노브)을 더 올려야 해요.</li> <li>마이크가 멀수록 피드백(「삐—」 하고 우는 소리)이 잘 생겨요(01-1 에서 배운 내용).</li> <li><b>수신기 자리</b>: 보통 방송실 랙(장비를 층층이 넣는 선반)이나 콘솔 가까이에 둬요. 그리고 XLR 케이블로 콘솔 채널에 이어요.</li> <li>안테나는 수신기에 바로 달 수도 있고, 케이블로 따로 빼서 달 수도 있어요(4번 주제).</li> <li>송신기는 소리를 높은 주파수의 전파(반송파)에 실어 보내요. 이것을 변조라고 해요.</li> <li>수신기는 전파에서 소리를 다시 꺼내요. 이것을 복조라고 해요. 라디오 방송과 같은 원리예요.</li> <li>아날로그 무선과 디지털 무선의 차이는 「심화 학습」에서 다뤄요.</li></ul>',
        pics: [{ v: 'wlRadio', cap: '송신기는 <b>방송국</b>, 수신기는 <b>집 라디오</b>와 같아요. 라디오를 95.9 에 맞춰야 그 방송이 들리죠. 수신기도 송신기와 <b>같은 주파수</b>에 맞춰야 소리가 나요.' }],
        check: { q: '설교자가 두 손을 쓰고, 입과 거리도 늘 같게 하려면?', options: [
          { t: '벨트팩 + 헤드셋 마이크', ok: true, why: '맞아요. 헤드셋은 입 옆에 붙어 있어서, 고개를 돌려도 거리가 거의 그대로예요.' },
          { t: '핸드헬드를 스탠드에 꽂기', why: '스탠드는 제자리에 있어요. 설교자가 움직이면 멀어져서 소리가 작아지고 피드백도 잘 생겨요.' },
          { t: '수신기를 강대상 위에 두기', why: '수신기는 전파를 받는 상자예요. 소리를 받는 마이크가 아니에요.' }] } },
      { title: '주파수 — 나라가 정한 전파 자리', visual: 'wlBands',
        body: '라디오는 방송국마다 채널 번호가 달라요. 무선 마이크도 정해진 <b>주파수</b>(전파 채널)로 소리를 보내요. 어떤 주파수를 써도 되는지는 나라가 법으로 정해요. 아무 데나 쓰면 휴대폰 · TV 같은 다른 전파와 부딪혀요. 교회에서는 보통 <b>925–937.5 MHz</b> 장비를 써요. MHz(메가헤르츠)는 1초에 백만 번 떨린다는 뜻이에요. 이 구간은 신고 없이 쓸 수 있어요. <b>470–698 MHz</b> 는 허가를 받아야 써요. 예전에 쓰던 <b>742–752 MHz</b> 는 휴대폰 통신용으로 바뀌었어요. 그래서 지금은 무선 마이크로 쓸 수 없어요. 기억해요: 장비 라벨의 주파수부터 확인해요.',
        more: '<ul><li><b>UHF</b>: 300 MHz ~ 3 GHz 의 전파예요. 무선 마이크가 가장 많이 쓰는 구간(대역)이에요.</li> <li>UHF 는 그보다 낮은 VHF(30–300 MHz)보다 채널을 많이 쓸 수 있어요. 대신 장애물에 더 잘 막혀요.</li> <li><b>925–937.5 MHz</b>: 신고 없이 쓰는 구간이에요. 전파 세기(실효복사전력)는 10 mW 이하여야 해요.</li> <li><b>742–752 MHz</b>: 2013년부터 팔거나 쓰는 것이 중지됐어요. 2021년부터는 단속 대상이에요.</li> <li><b>과학기술정보통신부 고시(제2026-9호)</b>: 정부가 「신고 없이 써도 되는 무선기기」를 정해 둔 글이에요. 이름은 「신고하지 아니하고 개설할 수 있는 무선국용 무선기기」예요.</li> <li>그 고시의 「음성 및 음향신호 전송용 무선기기」 표에 925～937.5 MHz 가 있어요. 실효복사전력(안테나에서 나가는 전파 세기)은 10 mW 이하예요.</li> <li>같은 표에는 낮은 구간도 있어요. 예: 173.020～173.280 MHz, 217.250～220.110 MHz.</li> <li><b>KCA 안내(2021)</b>: KCA 는 한국방송통신전파진흥원이에요. 170 MHz · 200 MHz · 900 MHz 대역 등은 허가 · 신고 없이 써요. 470–698 MHz 는 허가를 받아 써요.</li> <li>700 MHz 대역 기기는 전파법이 지켜 주는 대상(보호 대상)이 아니에요. 그래서 새 장비로 바꾸는 비용은 쓰는 사람이 내요(KCA 안내).</li> <li><b>교재 표(2023)</b>: 925–937.5 MHz 는 허가 없이 10 mW 이하로 써요. 470–698 MHz 는 허가 대역이고 출력은 50 mW 이하예요.</li> <li>교재는 470–698 MHz 허가 대역을 쓰는 곳을 「방송국 · 법인사업자」로 적어요. 허가를 받으면 정기 검사와 전파 사용료도 있어요. 그래서 교회는 보통 925 MHz 대 장비를 써요.</li> <li><b>470–698 MHz</b> 는 지상파 디지털 TV(채널 14–51)와 같은 구간이에요. 그래서 우리 지역에서 방송 중인 TV 채널을 피해서 골라야 해요.</li> <li>Shure 도 이 구간의 한국 모델에 「사용자 운용 허가가 필요」하다고 적어요. 예: QLX-D · ULX-D 의 J51 모델. 허가 방법은 지역 전파관리소에 물어봐요(<b>지역 규정 확인</b>).</li> <li>같은 제품도 나라마다 주파수가 다른 모델이 있어요. 예: Shure 한국용 X51 · X7 모델 = 925–937.5 MHz. 해외에서 산 제품은 우리나라에서 못 쓰는 주파수일 수 있어요.</li> <li>규정은 바뀌어요. 정부는 2026년에 「간이이용제도」 실증(시험 운영)을 추진한다고 밝혔어요. 470–698 MHz 무선마이크를 시간 단위로 허가하는 제도예요(전자신문, 2026년 8월).</li> <li>장비를 살 때와 쓸 때 최신 고시를 확인해요.</li></ul>',
        check: { q: '창고에서 「742 MHz」라고 적힌 마이크를 찾았어요. 어떻게 할까요?', options: [
          { t: '쓰지 않고 925 MHz 대 장비로 바꾼다', ok: true, why: '맞아요. 742–752 MHz 는 2013년부터 쓸 수 없어요. 2021년부터는 단속도 해요.' },
          { t: '소리가 나면 그대로 쓴다', why: '소리가 나도 쓸 수 없는 주파수예요. 지금은 휴대폰 통신용이에요.' },
          { t: '전파 세기만 낮춰서 쓴다', why: '전파 세기와 상관없어요. 그 주파수 자체를 무선 마이크로 쓸 수 없어요.' }] } },
      { title: '주파수 고르기 — 스캔 · 혼변조 · 싱크', visual: 'wlIntermod',
        body: '친구 셋이 한꺼번에 말하면 잘 안 들리죠. 무선 마이크도 주파수가 겹치면 잡음이 나요. 그래서 여러 대를 쓸 때는 주파수를 잘 골라야 해요. 먼저 우리 송신기를 모두 끄고 <b>스캔</b>해요. 스캔은 주변 전파를 쭉 훑어 빈 자리를 찾는 일이에요. 다음은 <b>혼변조</b>를 피해요. 혼변조는 송신기 전파끼리 섞여 생기는 가짜 신호예요. 예를 들어 927 과 928 MHz 를 함께 쓴다고 해 봐요. 그러면 간격만큼 바깥인 926 · 929 MHz 에 생겨요. 주파수를 골랐으면 송신기와 수신기의 <b>IR 창</b>(적외선 창)을 마주 대요. 그리고 <b>SYNC</b> 를 눌러 같은 주파수로 맞춰요. 기억해요: 끄고 스캔 → 고르기 → 싱크.',
        more: '<ul><li><b>계산식</b>: 두 마이크의 주파수를 f1, f2 라고 해요. 그러면 <b>2×f1 − f2</b> 와 <b>2×f2 − f1</b> 자리에 3차 혼변조가 생겨요.</li> <li>예: 927 · 928 MHz 면 926 · 929 MHz 에 생겨요. 세 번째 마이크를 929 MHz 에 두면 바로 겹쳐요. 그래서 <b>똑같은 간격으로 줄 세우기</b>는 피해요.</li> <li><b>Shure 안내</b>: 대부분의 제조사는 3차 혼변조와 쓰는 주파수 사이를 <b>250 kHz 이상</b> 띄우라고 권해요. 250 kHz 는 0.25 MHz 예요.</li> <li>송신기끼리 가까이 있을수록, 출력이 클수록 혼변조가 세져요. 송신기가 3대 이상이면 5차 혼변조도 생겨요.</li> <li><b>마이크가 늘면 가짜 신호는 훨씬 빨리 늘어요</b>(교재 표). 2대면 2개, 3대면 9개예요. 4대면 24개, 8대면 225개예요. 그래서 마이크가 많으면 계산 프로그램이 필요해요.</li> <li>제조사의 <b>그룹 · 채널 표</b>를 쓰면 편해요. 같은 그룹 채널끼리는 서로 부딪히지 않게 맞춰져 있어요.</li> <li>다만 그룹 · 채널 표는 「주변 전파가 깨끗하다」고 보고 만든 거예요. 그래서 스캔과 함께 써요.</li> <li><b>스캔할 때는 우리 송신기를 모두 꺼요</b>(Shure SLX-D 설명서). 켜 두면 우리 마이크 신호도 「사용 중」으로 잡혀요.</li> <li>SLX-D 설명서의 싱크 순서: 송신기 켜기 → IR 창 맞추기 → sync 누르기.</li> <li>마이크가 아주 많거나 큰 행사라면 주파수 정리 프로그램을 써요. 예: Shure Wireless Workbench.</li></ul>',
        pics: [{ v: 'wlSpacing', cap: '위: 1 MHz 씩 <b>똑같은 간격</b>이면 가짜 신호(▲)가 옆 마이크 자리에 떨어져요. 아래: 간격을 <b>들쭉날쭉</b> 두면 가짜 신호가 마이크를 비켜 가요.' }, { v: 'wlImdCount', cap: '마이크가 2대에서 8대로 늘면, 가짜 신호는 2개에서 225개로 늘어요(교재 표 14.2). 그래서 마이크가 많을수록 빈자리 찾기가 어려워요.' }],
        check: { q: '마이크 두 대가 930 · 931 MHz 예요. 가짜 신호는 어디에 생길까요?', options: [
          { t: '929 MHz 와 932 MHz', ok: true, why: '맞아요. 간격(1 MHz)만큼 바깥에 생겨요. 2×930 − 931 = 929, 2×931 − 930 = 932 예요.' },
          { t: '930.5 MHz (두 주파수의 가운데)', why: '가운데가 아니에요. 간격만큼 바깥쪽에 생겨요.' },
          { t: '두 대만 있으면 안 생긴다', why: '두 대만 있어도 생겨요. 그 자리에 다른 마이크가 있으면 문제가 돼요.' }] } },
      { title: '다이버시티와 안테나 자리', visual: 'wlDiversity',
        body: '휴대폰도 지하에 가면 신호가 약해지죠. 무선 마이크 전파도 벽 · 금속 · 사람에 막히면 약해져요. 그래서 송신기와 안테나 사이가 <b>막힘 없이 보이면</b> 좋아요. 벽에 튕긴 전파와 바로 온 전파가 엇갈려 서로 지우기도 해요. 그러면 그 자리에서 소리가 순간 끊겨요. <b>다이버시티</b> 수신기는 떨어진 안테나 두 개(A · B)로 받아요. 그리고 그 순간 더 잘 받는 쪽을 골라 써요. 그래서 끊김이 줄어요. 수신기를 금속 랙 안에 넣으면 전파가 막힐 수 있어요. 그럴 때는 안테나를 밖으로 빼서, 무대가 보이는 높은 곳에 달아요. 기억해요: 안테나는 높이, 막힘 없이.',
        more: '<ul><li><b>가시선</b>: 송신기와 안테나 사이에 막힘 없이 보이는 길이에요.</li> <li><b>다중 경로 페이딩</b>: 튕긴 전파와 바로 온 전파가 엇갈려 서로 지우는 일이에요. 그 자리에서 소리가 순간 끊겨요.</li> <li><b>Shure 안내</b>: 가시선은 「안테나가 눈에 보인다」는 뜻만이 아니에요. 유리 · 물 · 철망도 전파를 막아요.</li> <li>사람 몸도 전파를 빨아들여요(흡수). 그래서 회중이 가득 차면 신호가 약해질 수 있어요. 안테나를 높이 다는 이유예요.</li> <li><b>높이</b>: 안테나는 바닥에서 <b>2 m 이상</b> 높이 달아요.</li> <li><b>벽에서 떼기</b>: 벽 · 금속처럼 전파가 튕기는 면에서는 <b>1 파장 이상</b> 떼요. 파장은 전파 물결 하나의 길이예요.</li> <li>930 MHz 의 1 파장은 약 32 cm 예요(빛의 속도 ÷ 주파수). ¼ 파장은 약 8 cm 예요.</li> <li><b>A · B 사이</b>: 최소 <b>¼ 파장</b>이에요. Shure 는 ½~1 파장, 교재는 1 파장 이상을 권해요.</li> <li><b>사람과 떼기</b>: <b>10 mW 송신기</b>와 안테나는 <b>3 m 이상</b> 떼요. 증폭기 없는(수동) 무지향(모든 방향으로 받는) 안테나 기준이에요. 너무 가까우면 수신기에 전파가 너무 세게 들어가요(과부하).</li> <li><b>V 자로 벌리는 이유</b>: 전파에는 떨리는 방향(편파)이 있어요. 송신기 안테나와 받는 안테나의 방향이 같을수록 잘 받아요.</li> <li>그런데 송신기 방향은 계속 바뀌어요. 그래서 두 안테나를 V 자(서로 90°)로 벌려 둬요. 그러면 어느 쪽이든 덜 약해져요(교재: 손실 약 3 dB 이하).</li> <li><b>안테나 종류</b>: 수신기 앞에 꽂는 짧은 안테나(¼ 파장)는 수신기나 분배기에 바로 꽂아 써요.</li> <li>멀리 따로 달 때는 케이블로 이어 쓰는 원격용 안테나(½ 파장 · 패들)를 써요(교재).</li> <li>송신기 안테나(핸드헬드 아래쪽, 벨트팩 안테나)를 손으로 감싸 쥐지 않게 알려 줘요(DPA 안내).</li> <li><b>벨트팩 안테나</b>는 말거나 접지 말고 곧게 늘어뜨려요. 피부에 닿거나 주머니 · 금속 장식 안에 들어가면 전파가 크게 약해져요(교재).</li> <li>수신기는 무선 인이어 · 인터컴 송신기 같은 다른 무선 송신기와 떨어뜨려 둬요. UPS 같은 전원 장치와도 떨어뜨려요(교재).</li> <li>안테나 분배기 · 부스터 · 방향을 가진 안테나(패들)는 「심화 학습」에서 다뤄요.</li></ul>',
        pics: [{ v: 'wlFade', cap: '걸어가는 동안 안테나 A(주황)와 B(파랑)는 <b>약해지는 자리가 서로 달라요</b>. 수신기가 그때그때 더 센 쪽(초록)을 고르면 빨간 점선 아래로 내려가지 않아요. (교육용 그림)' }, { v: 'wlAntCare', cap: '송신기 쪽 안테나도 중요해요. 벨트팩 안테나는 <b>곧게</b> 늘어뜨려요. 핸드헬드는 <b>아랫부분(안테나)</b>을 감싸 쥐지 않게 알려 줘요.' }],
        check: { q: '수신기를 금속 랙에 넣었더니 소리가 자꾸 끊겨요. 먼저 할 일은?', options: [
          { t: '안테나를 랙 밖 높은 곳에 단다', ok: true, why: '맞아요. 막힘 없는 길이 생기면 전파(RF)가 안정돼요.' },
          { t: '송신기 감도(SENS)를 올린다', why: '감도는 소리 크기를 정해요. 전파 끊김은 그대로예요.' },
          { t: '콘솔 GAIN 을 올린다', why: '전파 때문에 끊기는 거라면, 콘솔에서 키워도 그대로예요.' }] } },
      { title: '송신기 감도 — 처음부터 알맞은 크기로', visual: 'wlGain',
        body: '귀에 대고 소리치면 귀가 아프죠. 송신기도 너무 큰 소리가 들어오면 소리가 찌그러져요. 그래서 송신기에는 <b>감도</b>(소리를 얼마나 크게 받을지) 조절이 있어요. 감도가 너무 높으면 송신기 안에서 찌그러져요. 이 소리는 뒤에서 줄여도 고쳐지지 않아요. 너무 낮으면 뒤에서 많이 키워야 해서 「쉬—」 잡음이 커져요. 그래서 실제 목소리로 말하거나 노래하게 하고 맞춰요. <b>수신기 오디오 미터</b>가 평소에는 초록 · 노랑이면 돼요. 가장 큰 순간에만 가끔 빨강(OL, 너무 큼)이 켜지면 알맞아요. 그다음 콘솔 GAIN(들어온 소리를 키우는 노브)을 맞춰요. 기억해요: 찌그러지는 곳에서 줄여요.',
        more: '<ul><li><b>게인 구조</b>: 소리를 키우는 단계의 순서예요. 무선 마이크는 송신기 감도 → 수신기 출력 → 콘솔 GAIN 순서예요. 콘솔 GAIN 은 Gain Structure 과정에서 배운 대로 맞춰요.</li> <li><b>수신기 출력 레벨(MIC/LINE)</b>: 수신기에서 나가는 소리 크기를 콘솔 입력에 맞춰요. MIC 는 작은 신호, LINE 은 그보다 큰 신호예요.</li> <li><b>어디서 조절할까</b>: 기종마다 달라요. Sennheiser ew G4 벨트팩(SK 100 G4)은 송신기의 SENSITIVITY(감도)를 바꿔요.</li> <li>SK 100 G4 의 감도는 0 ~ −60 dB 사이에서 6 dB 씩 바꿔요. dB(데시벨)는 소리 크기를 비교하는 단위예요.</li> <li>Shure ULX-D 는 수신기에서 게인(−18 ~ +42 dB)을 조절해요. 송신기 입력이 찌그러지면 수신기 화면에 「Tx OVERLOAD」(송신기 과부하)가 떠요.</li> <li><b>Shure BLX 설명서</b>: 수신기 오디오 LED 가 초록이면 정상, 빨강이면 너무 커요(과부하). 빨강은 크게 말하거나 노래할 때만 가끔 켜지게 해요.</li> <li><b>Shure ULX-D 설명서</b>: 평소 크기는 초록 · 노랑이에요. 가장 큰 순간에 OL 이 잠깐 켜지는 정도가 좋아요.</li> <li>ULX-D 수신기 XLR 출력은 되도록 LINE 으로 둬요. 그러면 시스템 잡음이 줄어요. 콘솔 마이크 입력에 LINE 신호를 넣을 때는 콘솔 GAIN 을 충분히 낮출 수 있는지 봐요.</li> <li>사람마다 목소리 크기가 달라요. 크게 노래하는 인도자와 작게 말하는 사회자는 감도가 다를 수 있어요. 송신기를 다른 사람이 쓰면 감도를 다시 확인해요.</li> <li>감도는 소리 크기만 바꿔요. 소리 끊김(드롭아웃)은 감도로 고쳐지지 않아요.</li></ul>',
        pics: [{ v: 'wlSens', cap: '감도가 <b>너무 높으면</b> 소리 윗부분이 잘려 찌그러져요. <b>너무 낮으면</b> 뒤에서 많이 키워야 해서 「쉬—」 잡음도 같이 커져요. 가운데처럼 맞춰요.' }],
        check: { q: '수신기에 「Tx OVERLOAD」(송신기 소리 넘침)가 떠요. 어떻게 할까요?', options: [
          { t: '송신기 감도를 낮춘다', ok: true, why: '맞아요. 찌그러지는 곳(송신기)에서 소리를 줄여야 해요. 패드(소리를 줄이는 스위치)가 있으면 켜도 돼요.' },
          { t: '콘솔 페이더를 내린다', why: '송신기에서 이미 찌그러진 소리는 페이더를 내려도 그대로예요.' },
          { t: '안테나를 더 높이 단다', why: '안테나는 전파 세기 문제예요. 소리 넘침과는 상관없어요.' }] } },
      { title: '예배 전 점검 — 배터리 · RF · 걷기 테스트', visual: 'wlCheck',
        body: '비행기 조종사는 날기 전에 점검표를 하나씩 확인해요. 무선 마이크도 예배 전 점검으로 사고를 많이 막아요. ① <b>배터리</b>: 중요한 예배 전에는 새 것으로 바꿔요. ② <b>전원 · MUTE</b>: 송신기가 켜졌는지, 소리 끄기(MUTE)가 풀렸는지 봐요. ③ <b>미터 두 개</b>: RF(전파 세기)와 오디오(소리 크기)를 따로 봐요. ④ <b>걷기 테스트</b>: 마이크를 켜고 실제로 다니는 길을 걸어요. 걸으면서 끊기는 곳이 없는지 들어요. ⑤ 급할 때 바꿀 <b>유선 예비 마이크</b>를 준비해요. 기억해요: 남은 칸 수만 믿지 말고 새 배터리로.',
        more: '<ul><li><b>DPA 안내</b>: 배터리 칸 수만 믿지 말고, 중요한 행사 전에는 배터리를 바꿔요.</li> <li><b>Shure ULX-D 수신기 화면</b>: AA 배터리는 5칸으로 보여 줘요. Shure 충전지는 남은 시간(분)으로 보여 줘요.</li> <li>송신기 전파가 없으면 수신기에 「-No TX-」(송신기 없음)가 떠요(ULX-D).</li> <li><b>Shure SLX-D</b>: AA 2개로 「최대」 8시간 써요(제조사 자료). 예배가 여러 번이면 중간에 바꿀 계획을 세워요.</li> <li><b>걷는 길</b>: 무대 · 강대상 · 회중석 앞처럼 마이크를 들고 실제로 다니는 곳을 걸어요.</li> <li><b>끊길 때 (Shure 안내)</b>: 끊기는 순간 RF 표시도 같이 떨어지는지 봐요. 그렇다면 전파 문제(안테나 · 주파수 · 거리)일 가능성이 커요.</li> <li>범위를 좁히는 방법: 다른 무선을 끄고 그 마이크만 시험해요. 스캔해서 새 주파수를 받아 봐요. 다른 수신기와 짝을 맞춰 봐요.</li> <li><b>교재의 배터리 기준</b>: 남은 양이 20% 아래면 바꿔요. 추운 곳에서는 배터리가 빨리 닳아요. 그래서 미리 써 보고 얼마나 가는지 확인해요.</li> <li><b>스위치 잠금</b>: 손이나 몸에 눌려 송신기가 꺼지거나 MUTE 될 수 있어요. 잠금(LOCK) 기능이 있으면 예배 전에 켜 둬요(교재).</li> <li><b>땀 · 물</b>: 몸에 차는 벨트팩은 땀에 젖기 쉬워요. 물이 스며들면 고장 나요. 그래서 전용 주머니(파우치)에 넣어 차요(교재).</li> <li><b>스켈치(squelch)</b>: 송신기 전파가 없을 때 수신기 소리를 막아 주는 기능이에요.</li> <li>스켈치가 없으면 송신기를 껐을 때 큰 「쉬—」 잡음이 스피커로 나갈 수 있어요.</li> <li>스켈치를 너무 낮게 맞추면 그 잡음이 새요. 너무 높게 맞추면 약한 전파일 때 소리가 끊겨요. 보통은 기본값으로 두고, 바꿀 때는 설명서를 따라요(교재).</li> <li>배터리 바꾼 날짜와 주파수를 표로 적어 두세요. 그러면 봉사자가 바뀌어도 관리가 쉬워요.</li></ul>',
        check: { q: '설교 중 소리가 끊길 때 RF 표시도 같이 떨어져요(그림). 무엇이 문제일까요?', visual: 'wlDrop', options: [
          { t: '전파 문제 (안테나 · 주파수)', ok: true, why: '맞아요. RF 가 같이 떨어지면 전파가 약하거나 막힌 거예요.' },
          { t: '송신기 감도가 너무 낮다', why: '감도는 소리 크기예요. RF 표시와는 상관없어요.' },
          { t: '콘솔 EQ 설정', why: 'EQ 는 소리 색깔(음색)을 바꿔요. 소리가 끊기는 원인이 아니에요.' }] } }
    ],
    practice: {
      kind: 'wirelessBench',
      lead: '주일 예배 30분 전이에요. 무선 마이크 세 대(① 인도자 · ② 목사님 헤드셋 · ③ 사회자)를 준비해요. 위에서부터 차례로 해요. 스캔 → 싱크 → 안테나 → 감도 → 배터리 → 걷기 테스트 순서예요. 그림은 마우스로 끌고, 버튼은 눌러요.',
      note: '주파수 구간(925–937.5 MHz)은 우리나라 고시 기준이에요. 스캔에 잡히는 다른 신호와 걷는 길은 교육용 예시예요. 간격 기준도 교육용으로 비슷하게 정했어요. 다른 신호와는 0.3 MHz 를 띄워요. 마이크끼리는 0.4 MHz, 혼변조와는 0.3 MHz 예요. RF 칸 수(거리 · 벽 · 기둥)도 교육용 값이에요. 오디오 미터 값도 마찬가지예요. 실제 기종의 메뉴와 표시는 설명서를 따르세요.',
      tasks: [
        { id: 'freq', title: '깨끗한 주파수 고르기', text: '송신기 3대의 POWER 를 끄고 「스캔 시작」을 눌러요. 스캔 그림을 눌러 ①②③ 마이크의 주파수를 골라요. 「사용 중」과 빨강 ▲(혼변조)는 피해요. 세 줄 모두 「✓ 깨끗해요」가 되면 성공이에요.' },
        { id: 'sync', title: 'IR 싱크로 송신기 맞추기', text: '송신기 POWER 를 다시 켜요. 송신기 그림을 끌어 같은 번호 수신기의 IR 창에 놓고 SYNC 를 눌러요. 세 대 모두 수신기와 주파수가 같아지면 성공이에요.' },
        { id: 'antenna', title: '안테나 자리 잡기', text: '방송실 안의 A · B 안테나를 끌어서 옮겨요. 두 안테나 모두 세 사람에게 막힘 없는 선이 이어지게 해요. RF 3칸 이상, 사람 다니는 곳과 3 m 이상이면 성공이에요.' },
        { id: 'gain', title: '송신기 감도 맞추기', text: 'SENS(송신기 감도)를 끌거나 −/+ 로 바꿔요. 세 수신기의 「가장 큰 순간」을 −12 ~ −3 dB(노랑)에 맞춰요. dB 는 소리 크기 단위예요. OL(빨강)이 켜지지 않으면 성공이에요.' },
        { id: 'battery', title: '배터리 · MUTE 점검', text: '수신기 화면의 배터리 칸을 봐요. 약한 송신기의 배터리를 바꾸고, 켜진 MUTE(소리 끄기)도 꺼요. 모두 4칸 이상이 되면 성공이에요.' },
        { id: 'walk', title: '걷기 테스트', text: '「걷기 테스트 시작」을 눌러요. 세 사람이 평소 다니는 길을 걷는 동안 RF 칸을 지켜봐요. RF 가 2칸 아래로 떨어지지 않고 모두 연결되면 성공이에요.' }
      ],
      links: [
        { title: '음향 트러블슈팅 · 미션 A', text: '마이크 소리가 안 날 때, 소리 길을 따라가며 막힌 곳을 찾아요. 무선이라면 RF · 배터리 · MUTE 부터 봐요.', go: { tab: 'tab7', ts: 'A' } },
        { title: '콘솔 실습(MG12XU) · 오디오 테스트', text: '수신기 소리가 들어오는 콘솔 채널에서 GAIN · PFL(헤드폰으로 미리 듣기)을 맞춰 봐요.', go: { tab: 'tab6', audio: true } }
      ]
    },
    quiz: [
      { q: '신고 없이 쓸 수 있는 무선 마이크 주파수는?', options: [
        { t: '925–937.5 MHz (10 mW 이하)', ok: true, why: '맞아요. 정부 고시에 「신고 없이 쓰는 기기」로 적힌 구간이에요.' },
        { t: '742–752 MHz', why: '옛 700 MHz 대역이에요. 2013년부터 쓸 수 없고, 2021년부터 단속해요.' },
        { t: '470–698 MHz', why: '아니에요. 470–698 MHz 는 허가를 받아야 쓰는 구간이에요.' }] },
      { q: '마이크 세 대를 926 · 927 · 928 MHz 에 뒀어요. 왜 잡음이 날까요?', options: [
        { t: '똑같은 간격이라 가짜 신호가 겹쳐서', ok: true, why: '맞아요. 2×927 − 926 = 928 처럼, 가짜 신호가 옆 마이크 자리에 떨어져요.' },
        { t: '주파수 사이가 너무 넓어서', why: '넓은 게 문제가 아니에요. 가짜 신호 자리에 마이크를 둔 게 문제예요.' },
        { t: '콘솔 GAIN 이 낮아서', why: '콘솔 GAIN 은 전파 간섭과 상관없어요.' }] },
      { q: '주파수 스캔을 하기 전에 먼저 할 일은?', options: [
        { t: '우리 송신기를 모두 끈다', ok: true, why: '맞아요. 켜 두면 우리 마이크도 「사용 중」으로 잡혀요. 그러면 빈 곳을 잘못 알게 돼요.' },
        { t: '우리 송신기를 모두 켜 둔다', why: '그러면 우리 신호까지 다른 신호처럼 잡혀요.' },
        { t: '콘솔 페이더를 모두 내린다', why: '페이더는 소리 크기를 정해요. 전파 스캔과는 상관없어요.' }] },
      { q: '디지털 무선 마이크를 새로 샀어요. 맞는 설명은?', options: [
        { t: '채널은 더 넣지만 소리가 조금 늦다', ok: true, why: '맞아요(Shure 안내). 암호화도 되고 채널도 더 넣어요. 대신 처리 시간만큼 늦어요(예: SLX-D 3.2 ms, 1000분의 3.2초).' },
        { t: '소리가 전혀 늦지 않다', why: '아니에요. 늦음(지연)이 거의 없는 쪽은 아날로그예요. 디지털은 처리하는 시간만큼 늦어요.' },
        { t: '주파수 규정을 안 지켜도 된다', why: '디지털도 전파를 써요. 그래서 똑같이 허가된 구간을 써야 해요.' }] },
      { q: '인도자 수신기 미터가 노래할 때마다 빨강(OL)에 붙어요. 어떻게 할까요?', options: [
        { t: '송신기 감도를 낮춘다', ok: true, why: '맞아요. 가장 큰 순간에만 가끔 닿게 해요. 소리가 처음 찌그러지는 곳(송신기)에서 줄여요.' },
        { t: '안테나를 더 높이 단다', why: 'OL 은 소리가 너무 크다는 뜻이에요. 전파 세기와는 상관없어요.' },
        { t: '콘솔 페이더만 내린다', why: '앞에서 찌그러진 소리는 페이더를 내려도 그대로예요.' }] }
    ],
    missions: [
      { title: '음향 트러블슈팅 · 미션 A', text: '「강대상 마이크 소리가 안 나요」 — 무선이라면 송신기 전원 · MUTE · 배터리부터 봐요. 수신기 RF 도 봐요. 그다음 콘솔 채널을 따라가며 막힌 곳을 찾아요.', go: { tab: 'tab7', ts: 'A' } },
      { title: '콘솔 실습(MG12XU) · 예배 순서대로 마이크 쓰기', text: '찬양 때는 인도자 마이크, 설교 때는 헤드셋 채널 페이더를 올려요. 예배 순서에 맞춰 올리고 내려 봐요.', go: { tab: 'tab6' } }   /* 2026-11-08: 3층 CL5 트레이닝 대신 MG12XU 실습 */
    ],
    deeper: [
      { title: '아날로그 무선과 디지털 무선', text: '아날로그 무선은 소리를 전파에 그대로 실어요. 디지털 무선은 소리를 숫자로 바꿔 실어요. 어느 쪽이든 주파수 · 안테나 · 배터리 관리는 똑같이 중요해요.', more: '<ul><li><b>아날로그</b>: 전파에 싣기 전에 큰 소리와 작은 소리의 차이를 줄여요(압축). 수신기에서 다시 늘려요. 이것을 컴팬딩이라고 해요(Shure 안내).</li> <li>값싼 아날로그 기종일수록 컴팬딩의 티가 날 수 있어요. 대신 소리가 늦는 일(지연)은 거의 없어요.</li> <li><b>디지털</b>: 같은 주파수 폭에 더 많은 마이크를 넣을 수 있는 경우가 많아요. 어떤 시스템은 두 배예요(Shure 안내).</li> <li>암호화(남이 엿듣지 못하게 잠그기)는 디지털에서만 돼요.</li> <li>디지털은 처리하는 시간만큼 소리가 늦어요(지연 · 레이턴시). 예: Shure SLX-D 3.2 ms(제조사 자료). 라이브에서는 지연 사양을 확인해요.</li> <li><b>2.4 GHz 디지털 무선</b>(와이파이와 같은 구간)은 보통 4~5대 정도만 함께 써요(Shure 안내). 마이크가 많으면 UHF 기종이 유리해요.</li> <li>아날로그든 디지털이든 전파가 약하면 끊길 수 있어요. 방식과 상관없이 RF 미터와 걷기 테스트로 확인해요.</li></ul>' },
      { title: '안테나 나눠 쓰기 — 분배기 · 부스터', text: '수신기가 여러 대면 안테나도 그만큼 많아져요. <b>안테나 분배기</b>를 쓰면 안테나 한 쌍을 여러 수신기가 나눠 써요. 안테나를 멀리 달면 줄어든 전파를 <b>부스터</b>로 채우기도 해요.', visual: 'wlSplitter', more: '<ul><li><b>분배기</b>: 예를 들어 Shure UA844+SWB 한 대는 안테나 한 쌍을 수신기 5대에 나눠 줘요. 수신기 전원(DC)도 함께 줘요(제조사 자료).</li> <li><b>원격 안테나</b>: 수신기가 방송실 안에 있어도, 안테나만 케이블로 빼서 무대가 보이는 높은 곳에 달 수 있어요.</li> <li>안테나 케이블이 길수록 신호가 줄어요. 그래서 굵고 손실이 적은 케이블을 써요. 또는 줄어든 만큼 키워 주는 <b>부스터(인라인 증폭기)</b>를 써요.</li> <li><b>안테나 케이블</b>: 50 Ω 동축 케이블과 BNC 단자로 이어요. 영상용 75 Ω 케이블은 쓰지 않아요(교재).</li> <li>교재 표로는 900 MHz 대에서 100 m 면 많이 줄어요. 가는 RG58 은 54 dB, 굵은 RG213 은 26 dB 줄어요. 굵을수록 덜 줄어요.</li> <li><b>부스터는 손실만큼만</b>: 케이블 손실이 5 dB 이상일 때 써요. 케이블 손실과 부스터 증폭을 더해 0 dB 쯤이 되게 맞춰요.</li> <li>부스터로 너무 키우면 잡음과 다른 전파까지 커져요(교재).</li> <li><b>방향을 가진 안테나</b>: 패들(로그 주기) 안테나는 앞쪽(약 120°)을 더 세게 받아요. 무대 쪽을 향해 달면 튕긴 전파와 다른 방향 잡음을 덜 받아요(교재).</li> <li>전원이 필요한 액티브 안테나는 액티브 분배기와 함께 써요(교재).</li> <li>무조건 크게 키운다고 좋은 게 아니에요. RF 가 너무 세도 수신기가 둔해질 수 있어요(DPA 안내).</li> <li>분배기 · 부스터를 넣은 뒤 끊김이 생기면, 안테나를 수신기에 바로 꽂아 비교해 봐요(Shure 안내).</li> <li>분배기 · 안테나도 쓰는 구간(예: 900 MHz 대)에 맞는 모델을 골라요.</li></ul>' },
      { title: '우리 교회 무선 주파수 표 만들기', text: '마이크마다 <b>주파수 · 송신기 번호 · 배터리 바꾼 날 · 감도</b>를 표로 적어요. 방송실에 붙여 두면 봉사자가 바뀌어도 똑같이 준비할 수 있어요.', more: '<ul><li>표에는 장비 라벨의 <b>주파수 구간</b>도 적어요(예: 925–937.5 MHz 모델인지). 700 MHz 대역 장비가 섞여 있지 않은지도 확인해요.</li> <li>옆 건물 · 교육관에 무선 마이크나 행사용 장비가 새로 생기면, 다시 스캔해서 표를 고쳐요.</li> <li><b>470–698 MHz 허가 대역</b> 장비를 쓰려면 허가가 필요해요.</li> <li>정부는 2026년에 이 구간을 시간 단위로 허가하는 「간이이용제도」 실증(시험 운영)을 시작한다고 밝혔어요. 지침을 만든 뒤 2027년에 넓혀 갈 계획이에요(전자신문, 2026년 8월).</li> <li>제도는 바뀔 수 있으니 전파관리소 · KCA 안내를 확인해요.</li> <li>허가 없이 쓰는 무선기기(비면허 무선기기)는 KCA 비면허무선기기지원센터에 물어볼 수 있어요. 전화는 080-700-9009 예요(KCA 안내, 2021).</li></ul>' }
    ],
    sources: [
      { t: '과학기술정보통신부 고시 제2026-9호 「신고하지 아니하고 개설할 수 있는 무선국용 무선기기」 — 음성·음향신호 전송용 925～937.5 MHz 등, 실효복사전력 10 mW 이하 (국가법령정보센터 첨부)', url: 'https://www.law.go.kr/LSW/flDownload.do?flSeq=161548805' },
      { t: 'KCA 「700㎒ 대역 무선마이크 이용종료에 따른 안내」(2021) — 2013년 사용 중지, 2021년 단속, 170·200·900 MHz 신고 없이, 470–698 MHz 허가', url: 'https://www.kca.kr/boardView.do?pageId=www47&boardId=NOTICE&seq=4272388' },
      { t: '재경일보(2012.11.30) — 742∼752 MHz 회수, 925∼937.5 MHz 새 무선마이크 대역 할당 결정', url: 'https://news.jkn.co.kr/post/730326' },
      { t: '방송공학회지 「디지털 전환과 방송전파의 활용」 — DTV 채널 14~51(470~698 MHz), 무선마이크는 470~698 MHz 허가', url: 'https://koreascience.kr/article/JAKO201217034923044.pdf' },
      { t: '전자신문(2026.8.5) — 470–698 MHz 무선마이크 대상 주파수 「간이이용제도」 실증 추진', url: 'https://www.etnews.com/20260805000191' },
      { t: 'Shure Frequency Versions (Asia) — 한국 모델 X51·X7 925–937.5 MHz, 470–698 MHz 대 모델은 운용 허가 필요', url: 'https://www.shure.com/en-asia/support/wireless-spectrum' },
      { t: 'Shure — Introduction to Wireless Systems (구성 · 핸드헬드 · 벨트팩 · 다이버시티)', url: 'https://www.shure.com/en-GB/insights/introduction-to-wireless-systems' },
      { t: 'Shure — All About Wireless Intermodulation Distortion (2×f1−f2, 250 kHz, 5차)', url: 'https://www.shure.com/en-US/insights/all-about-wireless-intermodulation-distortion' },
      { t: 'Shure — Wireless Antenna Positioning Best Practices (가시선 · 2 m · 3 m · ¼ 파장 · V 자)', url: 'https://shure.com/en-us/insights/all-about-wireless-antenna-positioning-best-practices' },
      { t: 'Shure — Troubleshooting Wireless Dropouts: 10 Simple Steps (RF 표시 · 스캔 · 안테나 직결)', url: 'https://www.shure.com/en-US/insights/troubleshooting-wireless-dropouts-10-simple-steps' },
      { t: 'Shure — Analogue vs Digital Wireless Microphones (컴팬딩 · 지연 · 암호화 · 2.4 GHz)', url: 'https://shure.com/en-US/insights/analogue-vs-digital-wireless-microphones' },
      { t: 'Shure SLX-D User Guide — 스캔 · IR 싱크 · 지연 3.2 ms · AA 2개 최대 8시간', url: 'https://fullcompass.com/common/files/89942-SLXDUserGuide.pdf' },
      { t: 'Shure SLX-D 사용설명서(일본어) — 스캔 전 송신기 끄기 · 싱크 순서', url: 'https://www.soundhouse.co.jp/download/shure/slx-d-user-guide.pdf' },
      { t: 'Shure ULX-D User Guide — Setting Gain · Tx OVERLOAD · LINE 출력 (ManualsLib p.14)', url: 'https://www.manualslib.com/manual/708709/Shure-Ulx-D.html?page=14' },
      { t: 'Shure ULX-D User Guide — 수신기 화면: 배터리 5칸 · -No TX- (ManualsLib p.12)', url: 'https://www.manualslib.com/manual/708709/Shure-Ulx-D.html?page=12' },
      { t: 'Shure BLX88 User Guide — Adjusting Gain: 오디오 LED 초록·빨강 (ManualsLib)', url: 'https://www.manualslib.com/manual/2735435/Shure-Blx88.html?page=12' },
      { t: 'Sennheiser ew G4 — SK 100 G4 Sensitivity (0 ~ −60 dB, 6 dB 단위)', url: 'https://docs.cloud.sennheiser.com/en-us/ew-g4/ew-g4/sk100g4-menu-sensitivity.html' },
      { t: 'DPA — Your first wireless system: comprehensive guide (가시선 · 배터리 · 과도한 RF)', url: 'https://www.dpamicrophones.com/mic-university/background-knowledge/your-first-wireless-system-comprehensive-guide/' },
      { t: 'Shure UA844+SWB 안테나 분배기 — 수신기 5대 (Full Compass 제품 페이지)', url: 'https://www.fullcompass.com/prod/564357-shure-ua844-antenna-distribution-system' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 14장 무선마이크 시스템 · 변조와 반송파 · VHF/UHF · 허가 대역 50 mW · 비허가 10 mW p.400–403', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 14장 무선마이크 시스템 · 3차 혼변조와 마이크 수(표 14.2) · 250 kHz p.403–405', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 14장 무선마이크 시스템 · 다중 경로 페이딩 · 다이버시티 · 스켈치 p.406–408', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 14장 무선마이크 시스템 · 송신기 종류(플러그온) · 안테나(¼ 파장 직결 · ½ 파장 · 패들) · 50 Ω 안테나 케이블 p.409–412', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 14장 무선마이크 시스템 · 벨트팩 단자 호환 · 송신기 안테나 다루기 · 수신기 설치 p.412–416', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 14장 무선마이크 시스템 · 안테나 간격(표 14.3) · 편파와 V 자 · 부스터 손실 보상 · 케이블 손실(표 14.4) p.417–420', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 14장 무선마이크 시스템 · 스위치 잠금 · 땀 · 배터리 20% p.422', url: '' }
    ]
  };
})();
