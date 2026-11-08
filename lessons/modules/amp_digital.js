/* =============================================================================
   04-2 디지털 앰프 (일반적인 Class D · DSP 내장 파워앰프) — 2026-11-04, 2026-11-08 일반화
   - STA_MODULES['amp-digital'] (모듈 데이터) + STAVisuals.da* (그림) + STASims.dampBench (가상 앰프 랙 실습)
   - 2026-11-08: 사용자 결정 「3층 장비 예시까지 모두 빼기」 — 특정 제조사 · 모델 · 3층 랙 배정을 빼고
     일반적인 4채널 디지털 앰프(화면형 · LED형)로 다시 씀. 교재(무대음향 6 · 9 · 15 · 16장) 내용은 살림.
   - 04-1 아날로그 앰프(amp.js)의 기본(임피던스·정격·dB·클리핑·브리지)은 되풀이하지 않고,
     Class D · 스위칭 전원 · 앰프 안 DSP(스피커 프리셋) · 디지털 입력 · 원격 제어 · 4채널 · 표시 · 감시를 다룸
   - 실습의 숫자(앰프 · 스피커 · 프리셋 이름, 입력 배정, 거리, 신호 크기, 리미터 시작점 −5 dBFS, 잰 Ω, 켜지는 시간)는 모두 교육용 예시.
   ============================================================================= */
(function () {
  'use strict';
  var V = window.STAVisuals = window.STAVisuals || {};
  var C = { ink: '#0f1f33', sub: '#51627a', line: '#cbd5e1', bg: '#f8fafc', blue: '#2563eb', teal: '#0e7490', orange: '#ea580c', purple: '#7c3aed', red: '#dc2626', green: '#059669', amber: '#d97706' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 500) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '">' + s + '</text>'; }
  function rect(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 8 : r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.5"' : '') + '/>'; }
  function arrow(x1, y1, x2, y2, col) { var a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 7 * Math.cos(a), hy = y2 - 7 * Math.sin(a); return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="2.4" fill="none"/><path d="M' + x2 + ' ' + y2 + 'L' + (hx - 4 * Math.sin(a)).toFixed(1) + ' ' + (hy + 4 * Math.cos(a)).toFixed(1) + 'L' + (hx + 4 * Math.sin(a)).toFixed(1) + ' ' + (hy - 4 * Math.cos(a)).toFixed(1) + 'Z" fill="' + col + '"/>'; }
  function sine(x0, w, ym, amp, cyc, col, sw) { var d = ''; for (var i = 0; i <= 120; i++) { var x = x0 + i / 120 * w, y = ym - amp * Math.sin(i / 120 * Math.PI * 2 * cyc); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (sw || 2.4) + '"/>'; }

  /* ---------------------------------------------------------------- 그림 1: Class D 와 PWM */
  V.daPwm = function () {
    var s = t(300, 18, 'Class D 앰프가 소리를 키우는 길 (쉽게 줄인 그림)', { size: 11, fill: C.sub });
    s += rect(8, 30, 170, 108, '#fff', C.line) + sine(18, 150, 80, 26, 1.5, C.blue) + '<path d="M18 80H168" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(93, 128, '① 들어온 소리 (작은 전기)', { size: 10.5, weight: 700, fill: C.blue });
    // PWM 펄스: 소리가 클수록 펄스가 넓어짐
    var x0 = 224, w = 152, N = 22, slot = w / N, hi = 54, lo = 104, d = 'M' + x0 + ' ' + lo;
    for (var k = 0; k < N; k++) { var duty = 0.5 + 0.42 * Math.sin(2 * Math.PI * 1.5 * (k + 0.5) / N), xa = x0 + k * slot, xb = xa + duty * slot; d += 'L' + xa.toFixed(1) + ' ' + lo + 'L' + xa.toFixed(1) + ' ' + hi + 'L' + xb.toFixed(1) + ' ' + hi + 'L' + xb.toFixed(1) + ' ' + lo; }
    d += 'L' + (x0 + w) + ' ' + lo;
    s += rect(214, 30, 172, 108, '#fff', C.line) + t(300, 46, '켜짐 / 꺼짐만 아주 빠르게', { size: 9.5, fill: C.sub }) + '<path d="' + d + '" fill="none" stroke="' + C.orange + '" stroke-width="1.8"/>' + t(300, 128, '② PWM — 클수록 「켜짐」이 길어요', { size: 10.5, weight: 700, fill: C.orange });
    s += rect(422, 30, 170, 108, '#fff', C.line) + sine(432, 150, 80, 36, 1.5, C.green, 3) + '<path d="M432 80H582" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(507, 128, '③ 필터로 매끈하게 → 스피커', { size: 10.5, weight: 700, fill: C.green });
    s += arrow(180, 84, 212, 84, '#94a3b8') + arrow(388, 84, 420, 84, '#94a3b8');
    s += rect(8, 150, 288, 58, '#fff7ed', '#fdba74') + t(152, 172, '「디지털 앰프」= 흔히 Class D 를 부르는 말', { size: 11.5, weight: 800, fill: C.orange }) + t(152, 192, '「D」는 Digital 의 줄임말이 아니에요', { size: 10.5, fill: C.ink });
    s += rect(304, 150, 288, 58, '#ecfeff', '#67e8f9') + t(448, 172, '정말 「디지털」인 부분', { size: 11.5, weight: 800, fill: C.teal }) + t(448, 192, '앰프 안 작은 컴퓨터(DSP) · 디지털 입력 · 원격 제어', { size: 10.5, fill: C.ink });
    return svg(600, 216, s, 'Class D 앰프의 PWM 과 출력 필터');
  };

  /* ---------------------------------------------------------------- 그림 2: 효율 · 열 · 환기 */
  V.daEff = function () {
    var s = t(8, 18, '효율 = 쓴 전기 중 스피커로 보낸 힘의 비율 (Analog Devices 기술 자료)', { size: 10.5, fill: C.sub, anchor: 'start' });
    var bx = 112, full = 176;
    function bar(y, lab, v, col) { return t(bx - 8, y + 12, lab, { size: 10.5, anchor: 'end' }) + rect(bx, y, full, 16, '#eef2f7', null, 4) + rect(bx, y, (v / 100 * full).toFixed(1), 16, col, null, 4) + t(bx + v / 100 * full + 5, y + 12, v + '%', { size: 10.5, weight: 800, anchor: 'start' }); }
    s += t(8, 42, '가장 크게 틀 때 (찌그러지기 직전)', { size: 11, weight: 800, anchor: 'start', fill: C.ink });
    s += bar(50, 'Class B (이론)', 78.5, '#94a3b8') + bar(72, 'Class D', 90, C.teal);
    s += t(8, 108, '작게 틀 때 (10 W 앰프로 1 W)', { size: 11, weight: 800, anchor: 'start', fill: C.ink });
    s += bar(116, 'Class A', 3, '#cbd5e1') + bar(138, 'Class B', 28, '#94a3b8') + bar(160, 'Class D', 78, C.teal);
    s += t(8, 198, 'Class AB 는 대체로 Class B 에 가까워요 (같은 자료)', { size: 10, fill: C.sub, anchor: 'start' });
    s += t(8, 216, '100 W 를 낼 때 버리는 열(이론): B 약 27 W · D 약 11 W', { size: 10, fill: C.sub, anchor: 'start' });
    s += rect(344, 30, 248, 94, '#f0fdfa', '#5eead4') + t(468, 50, '가벼운 까닭', { size: 12, weight: 800, fill: C.teal });
    ['열이 적어 방열판이 작아요', '전원부: 스위칭 전원(SMPS)', '빠르게 켜고 꺼서 변압기가 작아요', '→ 같은 힘이면 작고 가벼워요'].forEach(function (x, i) { s += t(468, 70 + i * 14, x, { size: 10.5 }); });
    s += rect(344, 134, 248, 94, '#eff6ff', '#93c5fd') + t(468, 154, '그래도 열은 나요 (교재 15장)', { size: 12, weight: 800, fill: C.blue });
    ['팬으로 식혀요 · 조금 시끄러워요', '앞 · 뒤 바람길을 막지 않아요', '앰프실은 환기 · 냉방을 해요', '팬 소리가 무대로 안 가게 해요'].forEach(function (x, i) { s += t(468, 174 + i * 14, x, { size: 10.5 }); });
    return svg(600, 236, s, 'Class D 와 Class A·B 의 효율 비교, 가벼운 까닭과 환기');
  };

  /* ---------------------------------------------------------------- 그림 3: 앰프 안의 DSP (교재 16장 그림 16-9 의 입력부 · 출력부를 단순화) */
  V.daDsp = function () {
    var s = t(300, 16, '한 채널 안의 처리 (교재 16장 그림을 쉽게 줄임 · 순서는 제품마다 조금 달라요)', { size: 10, fill: C.sub });
    var row1 = [['입력 고르기', '아날로그 · 디지털', '· 네트워크', C.teal], ['입력 게인', '크기 맞추기', '채널마다', C.teal], ['EQ', '소리 색 다듬기', '사람이 조절', C.blue], ['딜레이', '소리 늦추기', '거리 맞추기', C.blue]];
    row1.forEach(function (b, i) { var x = 8 + i * 150; s += rect(x, 30, 128, 60, '#fff', b[3]) + t(x + 64, 50, b[0], { size: 12, weight: 800, fill: b[3] }) + t(x + 64, 66, b[1], { size: 10, fill: C.ink }) + t(x + 64, 81, b[2], { size: 9.5, fill: C.sub }); if (i < 3) s += arrow(x + 128, 60, x + 148, 60, '#94a3b8'); });
    s += arrow(522, 90, 522, 118, '#94a3b8');
    s += rect(380, 120, 206, 64, '#f5f3ff', C.purple) + t(483, 140, '스피커 프리셋', { size: 12.5, weight: 800, fill: C.purple }) + t(483, 157, '메인 · 서브 · 모니터 … 종류별로', { size: 10, fill: C.ink }) + t(483, 173, '크로스오버 · EQ · 리미터', { size: 10, fill: C.ink });
    s += arrow(378, 152, 334, 152, '#94a3b8');
    s += rect(200, 120, 132, 64, C.teal, null) + t(266, 146, '앰프 (Class D)', { size: 12, weight: 800, fill: '#fff' }) + t(266, 164, '힘을 크게 키우기', { size: 10, fill: '#cffafe' });
    s += arrow(198, 152, 154, 152, '#94a3b8');
    s += rect(8, 120, 144, 64, '#fff', C.line) + t(80, 146, '스피커', { size: 12, weight: 800 }) + t(80, 164, '메인 · 서브 · 보조 …', { size: 10, fill: C.sub });
    s += t(300, 204, '프리셋 = 그 스피커에 맞춘 소리와 보호 · 사람이 만지는 EQ · 딜레이와 따로예요', { size: 10.5, fill: C.ink, weight: 700 });
    return svg(600, 212, s, '디지털 앰프 한 채널 안의 DSP 처리');
  };

  /* ---------------------------------------------------------------- 그림 4: 소리 길과 제어 길 (일반 예시) */
  V.daNet = function () {
    var s = t(8, 16, '소리 길(굵은 선)과 제어 길(점선) — 일반적인 예', { size: 10.5, fill: C.sub, anchor: 'start' });
    s += rect(8, 34, 132, 58, '#fff', C.ink) + t(74, 58, '콘솔', { size: 12, weight: 800 }) + t(74, 76, '(또는 스테이지박스)', { size: 10, fill: C.sub });
    s += arrow(140, 50, 352, 42, C.orange) + t(244, 36, '디지털 (AES3)', { size: 9.5, weight: 700, fill: C.orange });
    s += arrow(140, 78, 352, 106, C.blue) + t(244, 104, '아날로그 (XLR)', { size: 9.5, weight: 700, fill: C.blue });
    s += rect(354, 20, 110, 44, C.teal, null) + t(409, 39, '앰프 A', { size: 12.5, weight: 800, fill: '#fff' }) + t(409, 55, '화면형 · 4채널', { size: 9, fill: '#cffafe' });
    s += rect(354, 84, 110, 44, C.teal, null) + t(409, 103, '앰프 B', { size: 12.5, weight: 800, fill: '#fff' }) + t(409, 119, 'LED형 · 4채널', { size: 9, fill: '#cffafe' });
    s += arrow(464, 42, 484, 42, C.red) + arrow(464, 106, 484, 106, C.red);
    s += rect(486, 20, 106, 44, '#fff', C.line) + t(539, 39, '메인 · 서브', { size: 10, weight: 700 }) + t(539, 54, '스피커', { size: 10, weight: 700 });
    s += rect(486, 84, 106, 44, '#fff', C.line) + t(539, 103, '보조 · 모니터', { size: 10, weight: 700 }) + t(539, 118, '스피커', { size: 10, weight: 700 });
    s += rect(354, 156, 238, 46, '#f5f3ff', '#c4b5fd') + t(473, 176, '노트북 · 태블릿 (원격 제어)', { size: 11.5, weight: 800, fill: C.purple }) + t(473, 192, '랜선 · 설정 바꾸기 · 상태 · 경고 보기', { size: 9.5, fill: C.sub });
    s += '<path d="M392 156V128" stroke="' + C.purple + '" stroke-width="2" stroke-dasharray="5 4"/><path d="M474 156V42H464" stroke="' + C.purple + '" stroke-width="2" stroke-dasharray="5 4" fill="none"/>';
    ['• 아날로그 입력: XLR 케이블', '• 디지털 입력(AES3): 한 줄에 2채널', '• 랜선 한 줄로 여러 채널을 받는', '   네트워크 오디오 입력도 있어요', '• 소리 길과 제어 길은 따로 봐요'].forEach(function (x, i) { s += t(8, 124 + i * 17, x, { size: 10.5, anchor: 'start' }); });
    return svg(600, 212, s, '콘솔에서 디지털 · 아날로그로 앰프에 가는 소리와 노트북 원격 제어');
  };

  /* ---------------------------------------------------------------- 그림 5: 4채널 앰프 두 대의 채널 배정 (교육용 예시 · 첫 화면 그림) */
  var CH_ROWS = {
    a: [['CH1', '메인 L', '메인 2웨이 × 1 · MAIN12', '8 Ω'], ['CH2', '메인 R', '메인 2웨이 × 1 · MAIN12', '8 Ω'], ['CH3', '서브 (우퍼)', '서브우퍼 × 2 나란히 · SUB18', '4 Ω'], ['CH4', '뒤쪽 가운데 보조', '보조 8인치 × 1 · FILL8', '8 Ω']],
    b: [['CH1', '뒤쪽 좌우 보조', '보조 8인치 × 2 나란히 · FILL8', '4 Ω'], ['CH2', '맨 뒤 보조', '소형 16 Ω × 2 나란히 · FILL6', '8 Ω'], ['CH3', '바닥 모니터 L', '모니터 × 1 · MON12', '8 Ω'], ['CH4', '바닥 모니터 R', '모니터 × 1 · MON12', '8 Ω']]
  };
  V.daChurch = function () {   // 이름은 그대로(첫 화면 그림 hero.vis 가 가리킴) — 2026-11-08 내용은 일반 앰프 · 일반 스피커 예시로
    var s = t(8, 16, '예시: 4채널 디지털 앰프 두 대 → 스피커 여덟 묶음 (교육용 예시 · 이름은 프리셋)', { size: 10.5, fill: C.sub, anchor: 'start' });
    [['a', 8, '앰프 A — 화면형 · 큰 출력'], ['b', 304, '앰프 B — LED형 · 작은 출력']].forEach(function (A) {
      var x = A[1]; s += rect(x, 26, 288, 196, '#f8fafc', C.line, 10) + t(x + 144, 46, A[2], { size: 12, weight: 800, fill: C.teal });
      CH_ROWS[A[0]].forEach(function (r, i) { var y = 56 + i * 41;
        s += rect(x + 8, y, 272, 35, '#fff', '#e2e8f0', 6) + t(x + 18, y + 22, r[0], { size: 11, weight: 900, fill: C.orange, anchor: 'start' }) + t(x + 54, y + 15, r[1], { size: 11, weight: 800, anchor: 'start' }) + t(x + 54, y + 29, r[2], { size: 9.5, fill: C.sub, anchor: 'start' }) + t(x + 272, y + 23, r[3], { size: 12.5, weight: 800, fill: C.blue, anchor: 'end' }); });
    });
    s += t(300, 240, '같은 스피커 두 대를 나란히(병렬) 이으면 Ω 이 반: 8 Ω 2대 = 4 Ω, 16 Ω 2대 = 8 Ω', { size: 10.5, fill: C.ink, weight: 700 });
    return svg(600, 248, s, '4채널 디지털 앰프 두 대의 채널별 스피커 배정 예시');
  };

  /* ---------------------------------------------------------------- 그림 6: 켜는 순서 · 앞면 표시 (일반 예) */
  V.daPower = function () {
    var s = t(8, 18, '켜는 순서 (끌 때는 거꾸로)', { size: 12, weight: 800, anchor: 'start' });
    [['① 음원 장비', '무선 수신기 · 컴퓨터 · 전자 악기'], ['② 콘솔', '효과기도 함께'], ['③ 앰프 전원', '소리 나기까지 몇 초 ~ 수십 초'], ['④ 준비되면 MUTE 풀기', '작은 소리로 채널마다 확인']].forEach(function (r, i) { var y = 30 + i * 44;
      s += rect(8, y, 290, 34, i === 2 ? '#ecfeff' : '#fff', i === 2 ? '#67e8f9' : C.line, 7) + t(20, y + (r[1] ? 15 : 22), r[0], { size: 11.5, weight: 800, anchor: 'start' }) + (r[1] ? t(20, y + 29, r[1], { size: 9.5, fill: C.sub, anchor: 'start' }) : '');
      if (i < 3) s += arrow(40, y + 34, 40, y + 43, '#94a3b8'); });
    s += t(8, 222, '끌 때: MUTE → 앰프 → 콘솔 → 음원 장비', { size: 10, fill: C.sub, anchor: 'start' });
    s += rect(312, 8, 280, 222, '#1f2933', '#0b0f14', 10) + t(452, 28, '앞면 불빛 (흔한 예)', { size: 11.5, weight: 800, fill: '#e5e7eb' });
    [['POWER', '#22c55e', '켜짐 · 깜빡이면 쉬는 중'], ['SIGNAL', '#22c55e', '소리가 들어와요'], ['LIMIT', '#facc15', '리미터가 줄이는 중'], ['CLIP', '#ef4444', '소리가 너무 커요'], ['PROTECT', '#ef4444', '이상 · 앰프가 스스로 보호'], ['MUTE', '#ef4444', '소리 꺼짐']].forEach(function (r, i) { var y = 52 + i * 27;
      s += '<circle cx="330" cy="' + y + '" r="6.5" fill="' + r[1] + '"/>' + t(344, y + 4, r[0], { size: 11, weight: 800, fill: '#fff', anchor: 'start' }) + t(584, y + 4, r[2], { size: 10, fill: '#cbd5e1', anchor: 'end' }); });
    s += t(452, 220, '이름 · 색은 제품마다 달라요 · 화면형은 화면에', { size: 9.5, fill: '#94a3b8' });
    return svg(600, 238, s, '디지털 앰프 켜는 순서와 앞면 불빛');
  };

  /* =========================================================================== 2026-11-04 「그림으로 보기」 (교재 6장 · 9장 대조 뒤 추가)
     - 작은 칸(용어 · 2단 그림)에서도 글자가 읽히게 viewBox 를 좁게(360 · 480) 그리고, 폭 줄임을 허용 — 480 폭 그림은 휴대폰에서 글자가 10px 아래로 작아지지 않게 380px 까지만 줄이고 그 아래는 칸 안에서 옆으로 밀어 봐요 */
  function pic(w, h, body, label) { return '<svg class="mod-svg" style="min-width:' + (w > 400 ? '380px' : '0') + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }

  /* 그림 7: PWM 을 만드는 법 — 소리와 빠른 삼각파를 견줘요 (교재 그림 6-6 의 생각을 파형으로 다시 그림) */
  V.daPwmMake = function () {
    var x0 = 24, w = 432, P = 13, N = 520, tri = function (u) { var ph = (u * P) % 1; return 4 * Math.abs(ph - 0.5) - 1; }, sig = function (u) { return 0.72 * Math.sin(2 * Math.PI * u); };
    var dT = '', dS = '', dP = '', prev = null;
    for (var i = 0; i <= N; i++) { var u = i / N, x = (x0 + u * w).toFixed(1); dT += (i ? 'L' : 'M') + x + ' ' + (94 - 26 * tri(u)).toFixed(1); dS += (i ? 'L' : 'M') + x + ' ' + (94 - 26 * sig(u)).toFixed(1);
      var on = sig(u) > tri(u), y = on ? 178 : 220; if (prev === null) dP = 'M' + x + ' ' + y; else if (on !== prev) dP += 'L' + x + ' ' + (prev ? 178 : 220) + 'L' + x + ' ' + y; else dP += 'L' + x + ' ' + y; prev = on; }
    var s = t(240, 20, 'PWM 은 이렇게 만들어요', { size: 15, weight: 800 });
    s += rect(8, 32, 464, 100, '#fff', C.line) + t(18, 52, '① 소리(파랑)와 아주 빠른 삼각파(회색)를 겹쳐요', { size: 13, weight: 700, anchor: 'start' });
    s += '<path d="' + dT + '" fill="none" stroke="#94a3b8" stroke-width="1.4"/><path d="' + dS + '" fill="none" stroke="' + C.blue + '" stroke-width="3"/>';
    s += rect(8, 140, 464, 92, '#fff7ed', '#fdba74') + t(18, 160, '② 소리가 삼각파보다 높을 때만 「켜짐」', { size: 13, weight: 700, anchor: 'start', fill: C.orange });
    s += '<path d="' + dP + '" fill="none" stroke="' + C.orange + '" stroke-width="2"/>';
    s += t(240, 254, '③ 소리가 클수록 「켜짐」이 길어요', { size: 14, weight: 800, fill: C.ink });
    return pic(480, 264, s, 'PWM 을 만드는 방법: 소리 신호와 삼각파를 견줌');
  };

  /* 그림 8: 수도꼭지 비유 — 반쯤 열기(Class A·B·AB) ↔ 다 열기/다 잠그기(Class D) */
  V.daTap = function () {
    function tap(x, y, stream, lab) { var b = rect(x, y, 64, 14, '#94a3b8', null, 3) + rect(x + 50, y + 14, 14, 16, '#94a3b8', null, 2) + rect(x + 22, y - 14, 6, 14, '#64748b', null, 1) + rect(x + 10, y - 20, 30, 7, '#64748b', null, 3);
      if (stream) b += rect(x + 57 - stream / 2, y + 30, stream, 52, '#60a5fa', null, 2);
      return b + (lab ? t(x + 57, y + 102, lab, { size: 13, weight: 800, fill: stream ? C.blue : C.sub }) : ''); }
    var s = rect(6, 6, 228, 226, '#fff7ed', '#fdba74', 10) + t(120, 28, 'Class A · B · AB', { size: 14, weight: 800, fill: C.orange }) + t(120, 46, '반쯤 연 수도꼭지', { size: 13, weight: 700 });
    s += tap(62, 76, 4, '');
    s += '<path d="M112 72q4 -4.5 0 -9q-4 -4.5 0 -9M124 72q4 -4.5 0 -9q-4 -4.5 0 -9M136 72q4 -4.5 0 -9q-4 -4.5 0 -9" fill="none" stroke="' + C.red + '" stroke-width="2"/>';
    s += t(158, 70, '열', { size: 15, weight: 900, fill: C.red });
    s += t(120, 200, '물살을 막으면서 일해요', { size: 13 }) + t(120, 218, '막힌 만큼 열이 나요', { size: 13, weight: 800, fill: C.red });
    s += rect(246, 6, 228, 226, '#ecfeff', '#67e8f9', 10) + t(360, 28, 'Class D', { size: 14, weight: 800, fill: C.teal }) + t(360, 46, '다 열기 · 다 잠그기만', { size: 13, weight: 700 });
    s += tap(262, 76, 9, '열림') + tap(370, 76, 0, '잠김');
    s += t(348, 64, '빠르게', { size: 13, weight: 700, fill: C.teal }) + arrow(334, 74, 364, 74, C.teal) + arrow(364, 74, 334, 74, C.teal);
    s += t(360, 200, '막히는 때가 거의 없어서', { size: 13 }) + t(360, 218, '열이 아주 적어요', { size: 13, weight: 800, fill: C.teal });
    return pic(480, 238, s, '수도꼭지 비유: 반쯤 열린 꼭지와 다 열고 닫는 꼭지');
  };

  /* 그림 9: 입력 게인(감도)을 올려도 앰프의 「천장」(최대 출력)은 그대로 — 교재 6장 입력 감도 */
  V.daGainCeiling = function () {
    var s = t(240, 20, '게인을 올려도 앰프의 「천장」은 그대로예요', { size: 15, weight: 800 });
    function col(cx, title, top, over) {
      var b = rect(cx - 96, 34, 192, 170, '#fff', C.line, 10) + t(cx, 56, title, { size: 13.5, weight: 800, fill: over ? C.orange : C.green });
      b += '<path d="M' + (cx - 80) + ' 186H' + (cx + 80) + '" stroke="' + C.sub + '" stroke-width="1.5"/>';
      b += rect(cx - 54, top < 84 ? 84 : top, 108, 186 - (top < 84 ? 84 : top), over ? C.orange : C.green, null, 4);
      if (top < 84) b += '<rect x="' + (cx - 54) + '" y="' + top + '" width="108" height="' + (84 - top) + '" fill="none" stroke="' + C.red + '" stroke-width="2" stroke-dasharray="4 3"/>';
      b += '<path d="M' + (cx - 84) + ' 84H' + (cx + 84) + '" stroke="' + C.red + '" stroke-width="2.4" stroke-dasharray="7 4"/>';
      return b;
    }
    s += col(124, '입력 게인 0 dB', 112, false) + col(356, '입력 게인 +6 dB', 64, true);
    s += t(124, 104, '여유 있어요', { size: 13, weight: 700, fill: C.green }) + t(204, 80, '천장', { size: 12.5, weight: 800, fill: C.red });
    s += t(436, 80, '천장', { size: 12.5, weight: 800, fill: C.red }) + t(356, 120, '넘친 만큼', { size: 13, weight: 700, fill: '#fff' }) + t(356, 138, '리미터가 눌러요', { size: 13, weight: 700, fill: '#fff' });
    s += t(240, 226, '빨간 점선 = 앰프가 낼 수 있는 가장 큰 힘 (최대 출력)', { size: 12.5, fill: C.sub });
    return pic(480, 236, s, '입력 게인을 바꿔도 앰프의 최대 출력은 그대로');
  };

  /* 그림 10: Ω 이 반이 되면 출력은? — 이론 2배, 실제는 앰프마다 (2026-11-08: 제조사 숫자 대신 교재 그림 6-7 의 앰프) */
  V.daImpPower = function () {
    var s = t(240, 20, 'Ω 이 반(8 → 4 Ω)이 되면 출력은 몇 배?', { size: 15, weight: 800 });
    var bx = 150, full = 170;
    [['이론 (P = V² ÷ R)', 2, '×2', '#94a3b8'], ['교재 · 보통 앰프', 1.5, '약 ×1.5', C.amber], ['교재 그림 6-7 앰프', 1.68, '475 → 800 W', C.teal]].forEach(function (r, i) { var y = 44 + i * 44;
      s += t(bx - 8, y + 17, r[0], { size: 13, weight: 700, anchor: 'end' }) + rect(bx, y + 2, full, 22, '#eef2f7', null, 4) + rect(bx, y + 2, (r[1] / 2 * full).toFixed(1), 22, r[3], null, 4) + t(bx + r[1] / 2 * full + 6, y + 18, r[2], { size: 13, weight: 800, anchor: 'start', fill: r[3] === '#94a3b8' ? C.sub : r[3] });
    });
    s += '<path d="M' + (bx + full / 2) + ' 40V178" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(bx + full / 2, 194, '×1 (그대로)', { size: 12, fill: C.sub });
    s += t(240, 222, '실제로는 전원부 · 전류 한계 때문에 덜 늘어요', { size: 12.5, fill: C.ink });
    return pic(480, 232, s, '임피던스가 반이 될 때 출력이 늘어나는 정도');
  };

  /* 그림 11: 켜는 순서 ○ / × — 앰프를 먼저 켜 두면 「퍽」이 스피커로 (교재 9장 순차 전원 분배기) */
  V.daPopOX = function () {
    function row(y, ok, title, boxes) {
      var col = ok ? C.green : C.red, b = t(8, y, title, { size: 14, weight: 800, anchor: 'start', fill: col });
      boxes.forEach(function (bx, i) { var x = 8 + i * 160; b += rect(x, y + 10, 140, 54, i === 2 ? (ok ? '#ecfdf5' : '#fef2f2') : '#fff', i === 2 ? col : C.line, 8) + t(x + 70, y + 32, bx[0], { size: 13, weight: 800, fill: i === 2 ? col : C.ink }) + t(x + 70, y + 52, bx[1], { size: 12.5, fill: C.sub }); if (i < 2) b += arrow(x + 141, y + 37, x + 159, y + 37, '#94a3b8'); });
      return b;
    }
    var s = row(20, false, '× 앰프를 먼저 켜 두면', [['콘솔을 켤 때', '「퍽」 잡음이 나요'], ['앰프 켜져 있음', '잡음도 키워요'], ['스피커', '「퍽!」 크게 나요']]);
    s += row(112, true, '○ 앰프를 맨 마지막에 켜면', [['콘솔을 켤 때', '「퍽」 잡음이 나요'], ['앰프 아직 꺼짐', '잡음이 못 가요'], ['스피커', '조용해요']]);
    s += t(240, 210, '끌 때는 거꾸로 앰프를 맨 먼저 꺼요', { size: 13.5, weight: 800, fill: C.ink });
    return pic(480, 220, s, '켜는 순서를 지킬 때와 어길 때 비교');
  };

  /* 그림 12 (용어 아이콘): 스피커 프리셋 = 스피커마다 맞춘 옷 */
  V.daTermSetup = function () {
    var s = '';
    [['메인', 'MAIN12 ✓', true, 0], ['서브', 'SUB18 ✓', true, 1], ['서브', 'LINEAR ✗', false, 1]].forEach(function (r, i) { var x = 8 + i * 118, col = r[2] ? C.teal : C.red;
      if (r[3]) s += rect(x + 27, 6, 56, 54, '#1f2933', null, 5) + '<circle cx="' + (x + 55) + '" cy="33" r="20" fill="#475569"/><circle cx="' + (x + 55) + '" cy="33" r="7" fill="#334155"/>';
      else s += rect(x + 32, 6, 46, 54, '#1f2933', null, 5) + '<circle cx="' + (x + 55) + '" cy="40" r="13" fill="#475569"/><circle cx="' + (x + 55) + '" cy="18" r="5" fill="#94a3b8"/>';
      s += t(x + 55, 80, r[0], { size: 13, weight: 800 }) + rect(x + 8, 88, 94, 26, r[2] ? '#ecfeff' : '#fef2f2', col, 6) + t(x + 55, 106, r[1], { size: 13.5, weight: 800, fill: col });
    });
    return pic(360, 120, s, '스피커마다 맞는 프리셋을 고르기');
  };

  /* 그림 13 (확인 문제): 스피커 점검 — 기준값과 잰 값 */
  V.daZCheck = function () {
    var x0 = 30, x1 = 450, xv = function (z) { return x0 + z / 20 * (x1 - x0); };
    var s = t(240, 20, '앰프 B CH2 (16 Ω 두 대 나란히) · 스피커 점검 결과', { size: 14, weight: 800 });
    s += '<path d="M' + x0 + ' 92H' + x1 + '" stroke="' + C.ink + '" stroke-width="2"/>';
    [0, 4, 8, 12, 16, 20].forEach(function (z) { s += '<path d="M' + xv(z) + ' 86V98" stroke="' + C.ink + '" stroke-width="1.5"/>' + t(xv(z), 116, z, { size: 12.5, fill: C.sub }); });
    s += t(x1, 134, 'Ω', { size: 12.5, fill: C.sub, anchor: 'end' });
    s += '<path d="M' + xv(8) + ' 86l-8 -14h16z" fill="' + C.green + '"/>' + t(xv(8), 62, '기준 8 Ω', { size: 13.5, weight: 800, fill: C.green });
    s += '<path d="M' + xv(16) + ' 86l-8 -14h16z" fill="' + C.red + '"/>' + t(xv(16), 62, '잰 값 16 Ω', { size: 13.5, weight: 800, fill: C.red });
    s += '<path d="M' + (xv(8) + 10) + ' 46H' + (xv(16) - 10) + '" stroke="' + C.red + '" stroke-width="1.6" stroke-dasharray="4 3"/>' + t((xv(8) + xv(16)) / 2, 40, '기준의 2배', { size: 12.5, weight: 700, fill: C.red });
    return pic(480, 140, s, '스피커 점검에서 기준값과 잰 임피던스 비교');
  };

  /* =========================================================================== 실습: 가상 앰프 랙 (STASims.dampBench) — 2026-11-08 일반 4채널 디지털 앰프 두 대(화면형 · LED형)로 */
  var THR = -5;                         // 스피커 프리셋 리미터 시작점 (교육용 가정, dBFS)
  var C_SOUND = 343;                    // 소리 빠르기 m/s (20 °C 근처)
  var PRESETS = ['LINEAR', 'MAIN12', 'SUB18', 'FILL8', 'FILL6', 'MON12'];   // 교육용 프리셋 이름 (특정 제품 아님)
  var PRESET_TXT = { LINEAR: '맞춤 없음', MAIN12: '메인 12인치', SUB18: '서브 18인치', FILL8: '보조 8인치', FILL6: '소형 6인치', MON12: '모니터 12인치' };
  var AMPS = {
    a: { name: '앰프 A', kind: '화면형', ui: '앞면 화면', setups: PRESETS, bootMs: 3500, sheet: { D1: '메인 L', D2: '메인 R', D3: '서브', D4: '뒤쪽 가운데 보조' }, src: { D1: -9, D2: -9, D3: -6, D4: -12 } },
    b: { name: '앰프 B', kind: 'LED형', ui: '제어 프로그램', setups: PRESETS, bootMs: 2500, sheet: { D1: '뒤쪽 좌우 보조', D2: '맨 뒤 보조', D3: '모니터 L', D4: '모니터 R' }, src: { D1: -12, D2: -12, D3: -10, D4: -10 } }
  };
  var CHS = [
    { id: 'a-1', amp: 'a', n: 1, name: '메인 L', spk: '메인 2웨이(12인치)', cnt: 1, unit: 8, z: 8, setup: 'MAIN12', input: 'D1' },
    { id: 'a-2', amp: 'a', n: 2, name: '메인 R', spk: '메인 2웨이(12인치)', cnt: 1, unit: 8, z: 8, setup: 'MAIN12', input: 'D2' },
    { id: 'a-3', amp: 'a', n: 3, name: '서브', spk: '서브우퍼(18인치)', cnt: 2, unit: 8, z: 4, setup: 'SUB18', input: 'D3' },
    { id: 'a-4', amp: 'a', n: 4, name: '뒤쪽 가운데 보조', spk: '보조 2웨이(8인치)', cnt: 1, unit: 8, z: 8, setup: 'FILL8', input: 'D4', dist: 8.4 },
    { id: 'b-1', amp: 'b', n: 1, name: '뒤쪽 좌우 보조', spk: '보조 2웨이(8인치)', cnt: 2, unit: 8, z: 4, setup: 'FILL8', input: 'D1', dist: 9.2 },
    { id: 'b-2', amp: 'b', n: 2, name: '맨 뒤 보조', spk: '소형 보조(6인치)', cnt: 2, unit: 16, z: 8, setup: 'FILL6', input: 'D2', dist: 15.8 },
    { id: 'b-3', amp: 'b', n: 3, name: '모니터 L', spk: '바닥 모니터(12인치)', cnt: 1, unit: 8, z: 8, setup: 'MON12', input: 'D3' },
    { id: 'b-4', amp: 'b', n: 4, name: '모니터 R', spk: '바닥 모니터(12인치)', cnt: 1, unit: 8, z: 8, setup: 'MON12', input: 'D4' }
  ];
  var FAULT_ID = 'b-2';                 // 실습용 고장: 16 Ω 두 대 중 한 대 링크 빠짐 → 16 Ω
  var CAUSES = [['ok', '정상이에요'], ['open', '스피커 한 대가 빠졌어요 — Ω 이 높게 나와요'], ['short', '선끼리 붙었어요(단락) — Ω 이 아주 낮게 나와요']];
  var POW = { src: ['① 음원 장비', '음원 장비를'], con: ['② 콘솔', '콘솔을'] };
  function chById(id) { for (var i = 0; i < CHS.length; i++) if (CHS[i].id === id) return CHS[i]; return null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function f1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function sg(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + f1(Math.abs(v)); }
  function zt(z) { return Math.abs(z - Math.round(z)) < 0.05 ? String(Math.round(z)) : f1(z); }

  function injectCss() {
    if (document.getElementById('sta-mod-ampdig-css')) return;
    var s = document.createElement('style'); s.id = 'sta-mod-ampdig-css';
    s.textContent = [
      '.sim-da{display:flex;flex-direction:column;gap:10px;min-width:0}',
      '.sim-da-seq{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 12px;border:1px solid var(--sta-line,#cbd5e1);border-radius:10px;background:#fff}',
      '.sim-da-seq h4{margin:0;font-size:.86rem;color:var(--sta-navy,#0f2747);width:100%}.sim-da-seq h4 small{font-weight:500;color:#94a3b8;font-size:.7rem}',
      '.sim-da-step{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;border:1px solid #94a3b8;background:#f8fafc;font:inherit;font-size:.78rem;font-weight:700;cursor:pointer;color:#0f2747}',
      '.sim-da-step i{width:10px;height:10px;border-radius:50%;background:#cbd5e1;flex:none}',
      '.sim-da-step.on i{background:#22c55e;box-shadow:0 0 6px #22c55e}.sim-da-step.boot i{background:#f59e0b;animation:simDaBlink .6s infinite}',
      '.sim-da-step.mute{border-color:#ef4444}.sim-da-step.mute i{background:#ef4444;box-shadow:0 0 6px #ef4444}.sim-da-step.unmuted i{background:#22c55e}',
      '.sim-da-step:disabled{opacity:.45;cursor:not-allowed}.sim-da-step:focus-visible,.sim-da-ch:focus-visible,.sim-da-chip:focus-visible{outline:2px solid #22d3ee;outline-offset:2px}',
      '.sim-da-sep{color:#94a3b8;font-size:.8rem}',
      '.sim-da-msg{font-size:.76rem;line-height:1.5;width:100%;margin:2px 0 0;color:#475569}.sim-da-msg.bad{color:#b91c1c;font-weight:700}.sim-da-msg.ok{color:#047857;font-weight:700}',
      '.sim-da-body{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:12px;align-items:start}',
      '.sim-da-main{display:flex;flex-direction:column;gap:10px;min-width:0}',
      '.sim-da-rack{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:10px;border-radius:12px;background:linear-gradient(180deg,#2b3038,#16191e);border:1px solid #0b0d10}',
      '.sim-da-amp{display:flex;flex-direction:column;gap:6px;padding:8px;border-radius:8px;background:#1f2328;border:1px solid #3f4650;color:#e5e7eb;min-width:0}',
      '.sim-da-amp header{display:flex;align-items:center;gap:6px;font-size:.7rem;color:#cbd5e1;flex-wrap:wrap}.sim-da-amp header b{font-size:.95rem;font-weight:900;color:#fff;margin-right:auto}',
      '.sim-da-amp header em{font-style:normal;font-weight:800}.sim-da-amp header em.on{color:#86efac}.sim-da-amp header em.boot{color:#fcd34d}.sim-da-amp header em.off{color:#94a3b8}',
      '.sim-da-chs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}',
      '.sim-da-amp header small{font-size:.66rem;color:#94a3b8;font-weight:700}.sim-da-amp.scr .sim-da-chs{background:#0c2a4a;border:1px solid #1e4b7a;border-radius:6px;padding:4px}.sim-da-amp.scr .sim-da-ch{background:#123a63;border-color:#2b5c8f}',
      '.sim-da-ch{display:flex;flex-direction:column;gap:3px;padding:5px 4px;border-radius:6px;border:1px solid #3f4650;background:#272c33;color:#e5e7eb;font:inherit;cursor:pointer;text-align:center;min-width:0}',
      '.sim-da-ch.sel{border-color:#22d3ee;box-shadow:0 0 0 2px rgba(34,211,238,.35)}',
      '.sim-da-ch .n{font-size:.68rem;font-weight:900;color:#fde68a}.sim-da-ch .nm{font-size:.62rem;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.sim-da-leds{display:grid;grid-template-columns:auto auto;justify-content:space-between;gap:2px 3px;font-size:.56rem;font-weight:800;color:#94a3b8}',
      '.sim-da-leds span{display:flex;align-items:center;gap:2px;justify-content:flex-start;white-space:nowrap}',
      '.sim-da-led{display:inline-block;width:7px;height:7px;border-radius:50%;background:#3f3f46;flex:none}',
      '.sim-da-led.g.on{background:#22c55e;box-shadow:0 0 5px #22c55e}.sim-da-led.y.on{background:#facc15;box-shadow:0 0 5px #facc15}.sim-da-led.r.on{background:#ef4444;box-shadow:0 0 6px #ef4444}',
      '.sim-da-led.blink{background:#ef4444;animation:simDaBlink .5s infinite}',
      '.sim-da-mtr{height:5px;border-radius:3px;background:#111827;overflow:hidden}.sim-da-mtr i{display:block;height:100%;background:#22c55e}.sim-da-mtr i.lim{background:#facc15}.sim-da-mtr i.ovl{background:#ef4444}',
      '.sim-da-tag{font-size:.56rem;font-weight:800;padding:1px 3px;border-radius:3px;background:#334155;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sim-da-tag.lin{background:#7f1d1d;color:#fecaca}',
      '.sim-da-ed .sim-da-row{display:grid;gap:5px;margin-top:10px}.sim-da-ed .sim-da-row > span{font-size:.76rem;font-weight:800;color:#334155}',
      '.sim-da-ed .sim-da-row > span small{font-weight:500;color:#64748b}',
      '.sim-da-load{font-size:.78rem;color:#334155;margin:0}',
      '.sim-da-chips{display:flex;flex-wrap:wrap;gap:4px}',
      '.sim-da-chip{padding:4px 9px;border-radius:999px;border:1px solid #94a3b8;background:#fff;font:inherit;font-size:.74rem;font-weight:700;color:#0f2747;cursor:pointer}',
      '.sim-da-chip[aria-pressed=true]{background:#0f2747;color:#fff;border-color:#0f2747}.sim-da-chip:disabled{opacity:.4;cursor:not-allowed}',
      '.sim-da-chip.wide{border-radius:8px;text-align:left}',
      '.sim-da-fine{display:flex;gap:4px;flex-wrap:wrap}.sim-da-fine .sim-btn{padding:4px 8px}',
      '.sim-da-hr{position:relative;height:16px;border-radius:4px;background:#e2e8f0;overflow:hidden}',
      '.sim-da-hr i{position:absolute;left:0;top:0;bottom:0;background:#10b981}.sim-da-hr i.lim{background:#f59e0b}.sim-da-hr i.ovl{background:#ef4444}',
      '.sim-da-hr .zone{position:absolute;top:0;bottom:0;background:rgba(16,185,129,.22);border-left:1px dashed #059669}.sim-da-hr .thr{position:absolute;top:0;bottom:0;width:2px;background:#dc2626}',
      '.sim-da-hrlab{display:flex;justify-content:space-between;font-size:.66rem;color:#64748b}',
      '.sim-da-off{padding:14px;border-radius:8px;background:#f1f5f9;color:#475569;font-size:.8rem;text-align:center;margin-top:8px}',
      '.sim-da-tbl{width:100%;border-collapse:collapse;font-size:.72rem}.sim-da-tbl th,.sim-da-tbl td{padding:3px 4px;border-bottom:1px dashed #e2e8f0;text-align:left;font-variant-numeric:tabular-nums}',
      '.sim-da-tbl th{color:#64748b;font-weight:700}.sim-da-tbl tr.bad td{color:#b91c1c;font-weight:800}.sim-da-tbl tr.sel td{background:#ecfeff}',
      '.sim-da-tbl button{font:inherit;border:0;background:none;color:inherit;cursor:pointer;padding:0;text-decoration:underline dotted}',
      '.sim-da-fb{font-size:.76rem;line-height:1.5;margin:6px 0 0}.sim-da-fb.ok{color:#047857;font-weight:700}.sim-da-fb.bad{color:#b91c1c;font-weight:700}',
      '.sim-da-sum{display:grid;gap:2px;margin-top:6px}',
      '@keyframes simDaBlink{50%{opacity:.25}}',
      '@media (prefers-reduced-motion:reduce){.sim-da-step.boot i,.sim-da-led.blink{animation:none}}',
      '@media (max-width:860px){.sim-da-body{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:640px){.sim-da-rack{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function dampBench(el, opts) {
    opts = opts || {}; injectCss();
    var S = { src: false, con: false, a: 'off', b: 'off', bootAt: { a: 0, b: 0 }, order: { a: false, b: false }, muteAll: true, msg: '모든 장비가 꺼져 있어요. 위 순서대로 켜 보세요.', msgCls: '',
      ch: {}, sel: 'a-1', play: false, checking: 0, checked: false, mark: null, fixed: false, fb: '', fbCls: '', done: {} };
    CHS.forEach(function (c) { S.ch[c.id] = { input: 'A' + c.n, setup: 'LINEAR', gain: { 'a-2': 3, 'a-3': 6, 'b-2': -15 }[c.id] || 0, delay: 0.3 }; });
    var alive = true, timer = 0;

    el.innerHTML = '<div class="sim-da">' +
      '<div class="sim-da-seq" data-role="seq"></div>' +
      '<div class="sim-da-body">' +
        '<div class="sim-da-main"><div class="sim-da-rack" data-role="rack" aria-label="가상 앰프 랙: 4채널 디지털 앰프 두 대의 앞면"></div>' +
          '<div class="sim-box sim-da-ed" data-role="ed"></div></div>' +
        '<div class="sim-side">' +
          '<div class="sim-box sim-read"><h4>입력 신호 표 <small>콘솔 → 앰프 (실습용 배정)</small></h4>' + sheetHtml() + '</div>' +
          '<div class="sim-box sim-read" data-role="test"></div>' +
          '<div class="sim-box sim-read" data-role="chk"></div>' +
        '</div>' +
      '</div></div>';
    var q = function (s) { return el.querySelector(s); };

    function sheetHtml() {
      return ['a', 'b'].map(function (a) {
        var A = AMPS[a];
        return '<table class="sim-da-tbl" style="margin-bottom:6px"><tr><th colspan="2">' + A.name + ' 입력</th></tr>' +
          ['D1', 'D2', 'D3', 'D4'].map(function (k) { return '<tr><td><b>' + k + '</b> (디지털)</td><td>' + esc(A.sheet[k]) + '</td></tr>'; }).join('') +
          '<tr><td><b>A1–A4</b> (아날로그)</td><td>연결 없음</td></tr></table>';
      }).join('') + '<p class="sim-note">이 실습에서는 콘솔이 디지털(AES3)로 보내요. D1/D2 는 한 단자, D3/D4 는 다른 단자로 들어와요. 배정은 실습용 예시예요.</p>';
    }

    /* ---------------- 계산 */
    function ampOn(a) { return S[a] === 'on'; }
    function bothOn() { return ampOn('a') && ampOn('b'); }
    function calc(c) {
      var st = S.ch[c.id], on = ampOn(c.amp), dig = st.input.charAt(0) === 'D';
      var sig = dig ? AMPS[c.amp].sheet[st.input] : null;
      var src = on && S.play && dig ? AMPS[c.amp].src[st.input] : null;
      var lvl = src == null ? null : src + st.gain, lim = st.setup !== 'LINEAR', live = lvl != null && !S.muteAll;
      var gr = live && lim ? Math.max(0, lvl - THR) : 0, ovl = live && (lvl > -2 || gr >= 12);
      var hr = lvl != null && lim ? THR - lvl : null;
      var fault = c.id === FAULT_ID && !S.fixed, measured = fault ? c.unit : c.z * (1 + ((c.n * 7 + (c.amp === 'a' ? 3 : 5)) % 5 - 2) / 100);
      return { st: st, on: on, sig: sig, lvl: lvl, lim: lim, gr: gr, ovl: ovl, hr: hr, isp: lvl != null, grOn: gr >= 3, mute: on && S.muteAll, fault: fault, measured: measured, bad: Math.abs(measured - c.z) / c.z > 0.3 };
    }
    function target(c) { return c.dist ? c.dist / C_SOUND * 1000 : null; }
    function routeOk() { return CHS.every(function (c) { return S.ch[c.id].input === c.input; }); }
    function presetOk() { return CHS.every(function (c) { return S.ch[c.id].setup === c.setup; }); }
    function delayOk() { return CHS.every(function (c) { var d = S.ch[c.id].delay, tg = target(c); return tg == null ? d <= 1.0 : (d >= c.dist / 344 * 1000 - 0.3 && d <= tg + 5); }); }
    function headOk() {
      if (!(bothOn() && S.play && !S.muteAll && routeOk() && presetOk())) return false;
      if (S.ch['a-1'].gain !== S.ch['a-2'].gain) return false;
      return CHS.every(function (c) { var k = calc(c); return k.hr != null && k.hr >= 0 && k.hr <= 8 && !k.ovl; });
    }
    function powerOk() { return S.src && S.con && bothOn() && S.order.a && S.order.b && !S.muteAll; }
    function checkTasks() {
      if (powerOk()) hit('power');
      if (bothOn() && routeOk()) hit('route');
      if (bothOn() && presetOk()) hit('preset');
      if (bothOn() && delayOk()) hit('delay');
      if (headOk()) hit('headroom');
      if (S.checked && S.mark && S.mark.ch === FAULT_ID && S.mark.cause === 'open') hit('fault');
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }

    /* ---------------- 그리기 */
    function renderSeq() {
      function step(k, label, cls, dis) { return '<button type="button" class="sim-da-step ' + cls + '" data-act="pw" data-k="' + k + '"' + (dis ? ' disabled' : '') + '><i></i><span class="lb">' + label + '</span></button>'; }
      function ampCls(a) { return S[a] === 'on' ? 'on' : S[a] === 'boot' ? 'boot' : ''; }
      q('[data-role=seq]').innerHTML = '<h4>켜는 순서 <small>버튼을 눌러 켜고 꺼요 · 실습에서는 켜지는 시간을 몇 초로 줄였어요</small></h4>' +
        step('src', POW.src[0] + (S.src ? ' 켜짐' : ''), S.src ? 'on' : '') + '<span class="sim-da-sep">→</span>' +
        step('con', POW.con[0] + (S.con ? ' 켜짐' : ''), S.con ? 'on' : '') + '<span class="sim-da-sep">→</span>' +
        step('a', ampTxt('a'), ampCls('a')) + step('b', ampTxt('b'), ampCls('b')) + '<span class="sim-da-sep">→</span>' +
        step('mute', S.muteAll ? '④ MUTE ALL 켜짐 (누르면 풀기)' : '④ 뮤트 풀림 (누르면 MUTE ALL)', S.muteAll ? 'mute' : 'unmuted', !bothOn() && S.muteAll) +
        '<p class="sim-da-msg ' + S.msgCls + '" role="status">' + esc(S.msg) + '</p>';
    }
    function renderRack() {
      q('[data-role=rack]').innerHTML = ['a', 'b'].map(function (a) {
        var A = AMPS[a], st = S[a];
        return '<div class="sim-da-amp' + (a === 'a' ? ' scr' : '') + '"><header><b>' + A.name + ' <small>' + A.kind + ' · 4채널</small></b><span><i class="sim-da-led g' + (st === 'on' ? ' on' : '') + '"></i> POWER</span><span><i class="sim-da-led y' + (st === 'on' ? ' on' : '') + '"></i> NET</span>' +
          '<em class="' + (st === 'on' ? 'on' : st === 'boot' ? 'boot' : 'off') + '">' + (st === 'on' ? '켜짐' : st === 'boot' ? '켜는 중' : '꺼짐') + '</em></header><div class="sim-da-chs">' +
          CHS.filter(function (c) { return c.amp === a; }).map(function (c) {
            var k = calc(c), lv = k.lvl == null ? 0 : clamp((k.lvl + 40) / 40, 0, 1) * 100;
            return '<button type="button" class="sim-da-ch' + (S.sel === c.id ? ' sel' : '') + '" data-act="sel" data-ch="' + c.id + '" aria-pressed="' + (S.sel === c.id) + '" aria-label="' + A.name + ' CH' + c.n + ' ' + esc(c.name) + '">' +
              '<span class="n">CH' + c.n + '</span><span class="nm">' + esc(c.name) + '</span>' +
              '<span class="sim-da-tag' + (k.on && k.st.setup === 'LINEAR' ? ' lin' : '') + '">' + esc(k.on ? k.st.setup : '—') + '</span>' +
              '<span class="sim-da-leds"><span><i class="sim-da-led g' + (k.isp ? ' on' : '') + '"></i>SIG</span><span><i class="sim-da-led y' + (k.grOn ? ' on' : '') + '"></i>LIM</span>' +
              '<span><i class="sim-da-led r' + (k.ovl ? ' on' : '') + '"></i>CLIP</span><span><i class="sim-da-led r' + (k.mute ? ' on' : '') + (k.on && S.checked && k.fault ? ' blink' : '') + '"></i>MUTE</span></span>' +
              '<span class="sim-da-mtr"><i class="' + (k.ovl ? 'ovl' : k.gr > 0 ? 'lim' : '') + '" style="width:' + lv.toFixed(0) + '%"></i></span></button>';
          }).join('') + '</div></div>';
      }).join('');
    }
    function renderEd() {
      var c = chById(S.sel), A = AMPS[c.amp], st = S.ch[c.id], on = ampOn(c.amp), ed = q('[data-role=ed]');
      var load = c.spk + ' × ' + c.cnt + (c.cnt > 1 ? ' (' + c.unit + ' Ω 2대 나란히 = ' + c.z + ' Ω)' : ' (' + c.z + ' Ω)');
      var h = '<h4>채널 설정 — ' + A.name + ' CH' + c.n + ' · ' + esc(c.name) + ' <small>' + A.ui + '을 단순화</small></h4><p class="sim-da-load">연결된 스피커: <b>' + esc(load) + '</b></p>';
      if (!on) { ed.innerHTML = h + '<div class="sim-da-off">' + A.name + ' 가 ' + (S[c.amp] === 'boot' ? '켜지는 중이에요. 잠시 기다려요.' : '꺼져 있어요. 위 「켜는 순서」를 따라 먼저 켜요.') + '</div>'; return; }
      h += '<div class="sim-da-row"><span>입력 <small>— 이 채널이 받을 소리</small></span><div class="sim-da-chips">' + ['A1', 'A2', 'A3', 'A4', 'D1', 'D2', 'D3', 'D4'].map(function (k) { return '<button type="button" class="sim-da-chip" data-act="in" data-v="' + k + '" aria-pressed="' + (st.input === k) + '">' + k + '</button>'; }).join('') + '</div></div>';
      h += '<div class="sim-da-row"><span>스피커 프리셋 <small>— 연결된 스피커에 맞는 것을 골라요</small></span><div class="sim-da-chips">' + A.setups.map(function (k) { return '<button type="button" class="sim-da-chip" data-act="setup" data-v="' + k + '" aria-pressed="' + (st.setup === k) + '" title="' + PRESET_TXT[k] + '">' + k + '</button>'; }).join('') + '</div>' +
        '<p class="sim-note">MAIN12 = 메인 12인치 · SUB18 = 서브 18인치 · FILL8 = 보조 8인치 · FILL6 = 소형 6인치 · MON12 = 모니터 12인치 · LINEAR = 맞춤 없음</p></div>';
      h += '<div class="sim-da-row"><label class="sim-range"><span><b>입력 게인</b> <output data-out="gain"></output></span><input type="range" min="-20" max="6" step="0.5" data-sim="gain" value="' + st.gain + '" aria-label="입력 게인"></label></div>';
      h += '<div class="sim-da-row"><label class="sim-range"><span><b>딜레이</b> <output data-out="delay"></output></span><input type="range" min="0.3" max="60" step="0.1" data-sim="delay" value="' + st.delay + '" aria-label="딜레이 (ms)"></label>' +
        '<div class="sim-da-fine">' + [-1, -0.1, 0.1, 1].map(function (d) { return '<button type="button" class="sim-btn" data-act="dly" data-v="' + d + '">' + (d > 0 ? '+' : '−') + Math.abs(d) + ' ms</button>'; }).join('') + '</div>' +
        '<p class="sim-note">' + (c.dist ? '메인 스피커에서 떨어진 거리(예시): <b>' + f1(c.dist) + ' m</b>. 딜레이(ms) = 거리 ÷ 343 × 1000 이에요. 메인 소리가 먼저 들리게 몇 ms 더 줘도 돼요.' : '이 채널은 보조(딜레이) 스피커가 아니에요. 가장 작은 값(0.3 ms) 근처로 둬요.') + ' <span data-out="dist"></span></p></div>';
      h += '<div data-role="live"></div>';
      ed.innerHTML = h;
      renderLive();
    }
    function renderLive() {
      var c = chById(S.sel), st = S.ch[c.id], k = calc(c), lv = q('[data-role=live]');
      var go = q('[data-out=gain]'); if (go) go.textContent = sg(st.gain) + ' dB';
      var dg = q('[data-out=delay]'); if (dg) dg.textContent = f1(st.delay) + ' ms';
      var dd = q('[data-out=dist]'); if (dd) dd.textContent = '(지금 값은 소리가 ' + f1(st.delay * C_SOUND / 1000) + ' m 가는 시간이에요)';
      if (!lv) return;
      var sig = k.sig ? '이 입력으로 오는 소리: <b>' + esc(k.sig) + '</b>' : '<b>이 입력에는 아무것도 연결되어 있지 않아요</b>';
      var bar = '';
      if (!S.play) bar = '<p class="sim-note">「시험 재생」을 켜면 이 채널의 크기와 리미터 여유(리미터가 일하기 전까지 남은 크기)가 보여요.</p>';
      else if (k.lvl == null) bar = '<p class="sim-note">소리가 들어오지 않아 SIG 불이 꺼져 있어요.</p>';
      else {
        var X = function (d) { return clamp((d + 40) / 40, 0, 1) * 100; };
        bar = '<div class="sim-da-hrlab"><span>−40 dBFS</span><span>리미터 시작 ' + THR + '</span><span>0</span></div><div class="sim-da-hr"><span class="zone" style="left:' + X(THR - 8).toFixed(1) + '%;width:' + (X(THR) - X(THR - 8)).toFixed(1) + '%"></span><i class="' + (k.ovl ? 'ovl' : k.gr > 0 ? 'lim' : '') + '" style="width:' + X(k.lvl).toFixed(1) + '%"></i><span class="thr" style="left:' + X(THR).toFixed(1) + '%"></span></div>' +
          '<div class="sim-row"><span>가장 큰 순간</span><b class="' + (k.ovl ? 'bad' : k.gr > 0 ? 'warn' : 'ok') + '">' + sg(k.lvl) + ' dBFS</b></div>' +
          '<div class="sim-row"><span>리미터 여유</span><b class="' + (k.hr == null ? 'warn' : k.hr < 0 ? 'bad' : k.hr > 8 ? 'warn' : 'ok') + '">' + (k.hr == null ? '스피커 맞춤 리미터 없음 (LINEAR)' : k.hr < 0 ? '리미터가 ' + f1(-k.hr) + ' dB 줄이는 중' : f1(k.hr) + ' dB' + (k.hr > 8 ? ' · 너무 작아요' : '')) + '</b></div>' +
          (S.muteAll ? '<p class="sim-note">MUTE ALL 이 켜져 있어 소리는 나가지 않아요(입력 표시만).</p>' : '');
      }
      lv.innerHTML = '<div class="sim-da-row sim-read"><span>지금 상태</span><p class="sim-da-load">' + sig + '</p>' + bar + '</div>';
    }
    function renderTest() {
      var both = bothOn();
      var rows = '';
      if (S.play && both) rows = '<div class="sim-da-sum">' + CHS.map(function (c) { var k = calc(c), v = k.lvl == null ? ['warn', '소리 없음'] : k.hr == null ? ['warn', 'LINEAR'] : k.ovl ? ['bad', 'CLIP'] : k.hr < 0 ? ['bad', 'LIMIT ' + f1(-k.hr) + ' dB'] : k.hr > 8 ? ['warn', '여유 ' + f1(k.hr) + ' · 작음'] : ['ok', '여유 ' + f1(k.hr) + ' dB'];
        return '<div class="sim-row"><span>' + AMPS[c.amp].name + ' CH' + c.n + ' ' + esc(c.name) + ' <small>' + sg(S.ch[c.id].gain) + ' dB</small></span><b class="' + v[0] + '">' + v[1] + '</b></div>'; }).join('') + '</div>' +
        (S.ch['a-1'].gain !== S.ch['a-2'].gain ? '<p class="sim-da-fb bad">메인 L · R 입력 게인이 달라요(' + sg(S.ch['a-1'].gain) + ' / ' + sg(S.ch['a-2'].gain) + ' dB).</p>' : '');
      q('[data-role=test]').innerHTML = '<h4>시험 재생 <small>찬양의 가장 큰 소리 (교육용 신호)</small></h4>' +
        '<button type="button" class="sim-btn sim-play' + (S.play ? ' on' : '') + '" data-act="play"' + (both ? '' : ' disabled') + '>' + (S.play ? '■ 시험 재생 끄기' : '▶ 찬양의 가장 큰 소리로 시험 재생') + '</button>' +
        (both ? '' : '<p class="sim-note">두 앰프가 켜져야 시험할 수 있어요.</p>') + rows +
        '<p class="sim-note">목표: 모든 채널의 리미터 여유 0 ~ 8 dB(초록 칸), LIMIT · CLIP 꺼짐, 메인 L · R 게인 같게. 리미터 시작점 −5 dBFS 는 교육용 가정이에요.</p>';
    }
    function renderChk() {
      var both = bothOn(), c = chById(S.sel), h = '<h4>스피커 점검 <small>스피커 Ω 재기</small></h4>';
      h += '<button type="button" class="sim-btn" data-act="check"' + (both && !S.checking ? '' : ' disabled') + '>' + (S.checking ? '재는 중…' : '스피커 점검 실행') + '</button>';
      if (!both) h += '<p class="sim-note">두 앰프가 켜져야 실행할 수 있어요.</p>';
      if (S.checked && !S.checking) {
        h += '<table class="sim-da-tbl" style="margin-top:6px"><tr><th>채널</th><th>기준</th><th>잰 값</th><th>판정</th></tr>' + CHS.map(function (x) { var k = calc(x);
          return '<tr class="' + (k.bad ? 'bad' : '') + (S.sel === x.id ? ' sel' : '') + '"><td><button type="button" data-act="sel" data-ch="' + x.id + '">' + AMPS[x.amp].name + ' CH' + x.n + '</button></td><td>' + zt(x.z) + ' Ω</td><td>' + f1(k.measured) + ' Ω</td><td>' + (k.bad ? '확인 필요' : '정상') + '</td></tr>'; }).join('') + '</table>';
        h += '<p class="sim-note">잰 값은 교육용 예시예요. 스피커 Ω 은 소리 높이(주파수)마다 달라요. 그래서 앰프는 정해 둔 기준값과 견줘요.</p>';
        h += '<div class="sim-da-row"><span style="font-size:.76rem;font-weight:800">진단 — ' + AMPS[c.amp].name + ' CH' + c.n + ' ' + esc(c.name) + '</span><div class="sim-da-chips">' + CAUSES.map(function (r) { return '<button type="button" class="sim-da-chip wide" data-act="cause" data-v="' + r[0] + '" aria-pressed="' + !!(S.mark && S.mark.ch === c.id && S.mark.cause === r[0]) + '">' + r[1] + '</button>'; }).join('') + '</div></div>';
        if (S.fb) h += '<p class="sim-da-fb ' + S.fbCls + '" role="status">' + S.fb + '</p>';
        if (S.mark && S.mark.ch === FAULT_ID && S.mark.cause === 'open' && !S.fixed) h += '<button type="button" class="sim-btn" data-act="fix">링크 케이블 다시 꽂기</button>';
      }
      q('[data-role=chk]').innerHTML = h;
    }
    function refresh(full) { renderSeq(); renderRack(); if (full) renderEd(); else renderLive(); renderTest(); renderChk(); }

    /* ---------------- 동작 */
    function power(k) {
      var now = performance.now();
      if (k === 'src' || k === 'con') {
        S[k] = !S[k];
        if (!S[k] && (S.a !== 'off' || S.b !== 'off') && !S.muteAll) setMsg('앰프가 켜지고 뮤트도 풀린 채로 ' + POW[k][1] + ' 껐어요. 이때 「퍽」 소리가 스피커로 나갈 수 있어요. 끌 때는 MUTE → 앰프 → 콘솔 → 음원 장비 순서예요.', 'bad');
        else setMsg(POW[k][1] + (S[k] ? ' 켰어요.' : ' 껐어요.'), '');
        if (!S[k]) { S.play = false; }
      } else if (k === 'a' || k === 'b') {
        var A = AMPS[k];
        if (S[k] === 'off') {
          S[k] = 'boot'; S.bootAt[k] = now; S.order[k] = S.src && S.con;
          if (!S.order[k]) setMsg(A.name + ' 를 음원 장비 · 콘솔보다 먼저 켰어요. 나중에 켜는 장비의 「퍽」 소리가 스피커로 나갈 수 있어요. ' + A.name + ' 를 끄고, 음원 장비 · 콘솔을 먼저 켠 뒤 다시 켜 보세요.', 'bad');
          else setMsg(A.name + ' 가 켜지는 중이에요. 실제 앰프는 소리가 나기까지 몇 초 ~ 수십 초 걸려요.', '');
        } else { S[k] = 'off'; S.order[k] = false; S.play = false; setMsg(A.name + ' 를 껐어요.', ''); }
      } else if (k === 'mute') {
        if (S.muteAll) { if (!bothOn()) return; S.muteAll = false; setMsg(powerOk() ? '좋아요. 음원 장비 → 콘솔 → 앰프 순서로 켜고, 마지막에 뮤트를 풀었어요.' : '뮤트를 풀었어요. 그런데 켜는 순서가 맞지 않았어요. 위 안내를 확인해 보세요.', powerOk() ? 'ok' : 'bad'); }
        else { S.muteAll = true; setMsg('MUTE ALL 을 켰어요. 끌 때는 이다음에 앰프를 꺼요.', ''); }
      }
      refresh(true); checkTasks();
    }
    function setMsg(m, cls) { S.msg = m; S.msgCls = cls || ''; }
    function ampTxt(a) { var A = AMPS[a]; if (S[a] === 'boot') { var left = Math.max(0, Math.ceil((A.bootMs - (performance.now() - S.bootAt[a])) / 1000)); return '③ ' + A.name + ' 켜는 중… ' + left; } return '③ ' + A.name + (S[a] === 'on' ? ' 켜짐' : ' 전원'); }
    function bootLabels() { ['a', 'b'].forEach(function (a) { var lb = q('[data-role=seq] [data-k=' + a + '] .lb'); if (lb && S[a] === 'boot') lb.textContent = ampTxt(a); }); }   // 켜는 중에는 글자만 바꿔서 버튼을 누르는 중에 다시 그리지 않음
    function tick() {
      if (!alive) return; var now = performance.now(), changed = false, seqOnly = false;
      ['a', 'b'].forEach(function (a) { if (S[a] === 'boot') { if (now - S.bootAt[a] >= AMPS[a].bootMs) { S[a] = 'on'; changed = true; if (S.order[a]) setMsg(AMPS[a].name + ' 가 준비됐어요(POWER 초록).' + (bothOn() ? ' 이제 MUTE ALL 을 풀어도 돼요.' : ''), ''); } else seqOnly = true; } });
      if (S.checking && now - S.checking >= 1200) { S.checking = 0; S.checked = true; changed = true; }
      if (changed) { refresh(true); checkTasks(); } else if (seqOnly) bootLabels();
    }
    function onClick(e) {
      var b = e.target.closest('[data-act]'); if (!b || !el.contains(b) || b.disabled) return;
      var act = b.getAttribute('data-act'), v = b.getAttribute('data-v'), c = chById(S.sel), st = S.ch[S.sel];
      if (act === 'pw') { power(b.getAttribute('data-k')); return; }
      if (act === 'sel') { S.sel = b.getAttribute('data-ch'); S.fb = ''; refresh(true); return; }
      if (!ampOn(c.amp) && (act === 'in' || act === 'setup' || act === 'dly')) return;
      if (act === 'in') st.input = v;
      else if (act === 'setup') { if (AMPS[c.amp].setups.indexOf(v) >= 0) st.setup = v; }
      else if (act === 'dly') st.delay = clamp(Math.round((st.delay + parseFloat(v)) * 10) / 10, 0.3, 60);
      else if (act === 'play') S.play = !S.play;
      else if (act === 'check') { S.checking = performance.now(); S.checked = false; S.fb = ''; }
      else if (act === 'cause') {
        S.mark = { ch: S.sel, cause: v }; var k = calc(c);
        if (S.sel === FAULT_ID && k.fault) { S.fb = v === 'open' ? '맞아요. 기준은 8 Ω(16 Ω 두 대 나란히)인데 16 Ω 이 나왔어요. 한 대만 이어져 있어요. 링크 케이블과 그 스피커를 확인해요.' : v === 'short' ? '단락이면 Ω 이 기준보다 아주 낮게 나와요. 이 채널은 기준보다 높아요.' : '잰 값이 기준의 두 배예요. 정상이 아니에요.'; S.fbCls = v === 'open' ? 'ok' : 'bad'; }
        else { S.fb = v === 'ok' ? '맞아요, 이 채널은 기준값과 거의 같아요. 「확인 필요」 채널을 찾아 보세요.' : '이 채널은 잰 값이 기준값과 거의 같아서 정상이에요. 「확인 필요」 채널을 찾아 보세요.'; S.fbCls = v === 'ok' ? '' : 'bad'; }
      } else if (act === 'fix') { S.fixed = true; S.fb = '케이블을 다시 꽂았어요. 스피커 점검을 다시 실행해 8 Ω 이 나오는지 확인해요.'; S.fbCls = ''; }
      refresh(act === 'in' || act === 'setup' || act === 'dly'); checkTasks();
    }
    function onInput(e) {   // 끄는 중에는 화면만 바꾸고, 과제 확인은 손을 뗄 때(change)
      var tg = e.target, k = tg.getAttribute && tg.getAttribute('data-sim'); if (!k) return; var st = S.ch[S.sel];
      if (!ampOn(chById(S.sel).amp)) return;
      if (k === 'gain') st.gain = clamp(Math.round(+tg.value * 2) / 2, -20, 6); else if (k === 'delay') st.delay = clamp(Math.round(+tg.value * 10) / 10, 0.3, 60); else return;
      renderLive(); renderRack(); renderTest();
    }
    function onChange(e) { var tg = e.target; if (!tg.getAttribute || !tg.getAttribute('data-sim')) return; onInput(e); checkTasks(); }
    el.addEventListener('click', onClick); el.addEventListener('input', onInput); el.addEventListener('change', onChange);
    refresh(true); timer = setInterval(tick, 200);

    return {
      destroy: function () { alive = false; clearInterval(timer); el.removeEventListener('click', onClick); el.removeEventListener('input', onInput); el.removeEventListener('change', onChange); el.innerHTML = ''; },
      state: function () {
        var ch = {}; CHS.forEach(function (c) { var k = calc(c); ch[c.id] = { input: k.st.input, setup: k.st.setup, gain: k.st.gain, delay: k.st.delay, level: k.lvl, headroom: k.hr, gr: k.gr, ovl: k.ovl, isp: k.isp, measured: k.measured, target: target(c) }; });
        return { ready: true, done: Object.keys(S.done), src: S.src, con: S.con, a: S.a, b: S.b, order: { a: S.order.a, b: S.order.b }, muteAll: S.muteAll, play: S.play, checked: S.checked, checking: !!S.checking, mark: S.mark, fixed: S.fixed, sel: S.sel, ch: ch,
          ok: { power: powerOk(), route: routeOk(), preset: presetOk(), delay: delayOk(), headroom: headOk() } };
      },
      set: function (o) {
        o = o || {};
        if (o.sel && chById(o.sel)) S.sel = o.sel;
        if (o.ch) Object.keys(o.ch).forEach(function (id) { var st = S.ch[id], v = o.ch[id]; if (!st || !v) return; if (v.input) st.input = v.input; if (v.setup && PRESETS.indexOf(v.setup) >= 0) st.setup = v.setup; if (v.gain != null) st.gain = clamp(+v.gain, -20, 6); if (v.delay != null) st.delay = clamp(+v.delay, 0.3, 60); });
        if (o.play != null) S.play = !!o.play;
        refresh(true); checkTasks(); return this.state();
      },
      model: { CHS: CHS, AMPS: AMPS, THR: THR, C: C_SOUND, PRESETS: PRESETS }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.dampBench = dampBench;
})();

/* =========================================================================== 모듈 데이터 */
(function () {
  'use strict';
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['amp-digital'] = {
    id: 'amp-digital', path: 'hardware', no: 4, noLabel: '04-2', status: 'ready', level: '중급', minutes: 45, img: 'img/modules/amp_digital_card.svg',   // 2026-11-08: 3층 앰프 사진(hw_amp.jpg) 대신 일반 그림
    title: '디지털 앰프', sub: '작은 컴퓨터(DSP)가 들어 있는 Class D 파워앰프 — 프리셋 · 원격 제어 · 4채널',
    topics: ['Class D · PWM', '효율 · 열 · 환기', 'DSP · 스피커 프리셋', '입력 · 네트워크 제어', '채널 · 출력 · Ω 맞추기', '켜는 순서 · 앞면 표시'],
    glanceDraft: {
      glance: [
        ['디지털 앰프', '흔히 Class D 앰프를 부르는 말 · 안에 작은 컴퓨터(DSP)가 든 경우가 많아요'],
        ['Class D', '아주 빠르게 켰다 껐다 하며 소리를 키워요 · 열이 적어 가벼워요'],
        ['스피커 프리셋', '스피커 종류에 맞춘 설정 묶음 · 채널마다 맞는 것을 골라요'],
        ['스피커 점검', '앰프가 Ω 을 재서 끊긴 스피커를 찾아 줘요']
      ],
      heroVis: 'daChurch'   // 이름은 그대로(modules_glance.js 의 hero.vis) — 그림 내용은 일반 앰프 · 스피커 배정 예시
    },
    overview: {
      lead: '디지털 앰프는 소리를 크게 키워 스피커로 보내는 파워앰프예요. 열이 적은 <b>Class D</b> 방식이고, 안에 작은 컴퓨터(<b>DSP</b>)가 있어요. 스피커 연결 같은 기본은 04-1 아날로그 앰프와 같아요.',
      terms: [
        ['Class D 앰프', '전등 스위치를 아주 빠르게 켰다 껐다 하듯 소리를 키우는 앰프예요. 「D」는 Digital 이 아니에요.'],
        ['PWM · 출력 필터', 'PWM 은 소리가 클수록 「켜짐」을 길게 만드는 신호예요. 출력 필터가 체처럼 걸러 매끈한 소리로 되돌려요.'],
        ['스위칭 전원 (SMPS)', '전기를 아주 빠르게 켰다 껐다 해서 바꾸는 전원부예요. 큰 변압기가 없어 가벼워요.'],
        ['DSP', '앰프 안에서 소리를 숫자로 다루는 작은 컴퓨터예요. 앰프의 「두뇌」 같아요.'],
        ['스피커 프리셋', '스피커 종류마다 맞춘 설정 묶음이에요. 몸에 맞는 옷을 고르듯 채널마다 골라요.', 'daTermSetup'],
        ['디지털 입력 (AES3)', '케이블 한 가닥에 디지털 소리 2채널을 실어 보내는 약속이에요. 두 칸짜리 기차 같아요.'],
        ['원격 제어', '랜선으로 노트북 · 태블릿에서 앰프를 다루는 것이에요. TV 리모컨처럼 멀리서 조절해요.'],
        ['스피커 점검 (부하 모니터링)', '앰프가 스피커 쪽 Ω 을 재는 기능이에요. 맥박을 재듯 끊긴 스피커를 찾아 줘요.']
      ],
      points: [
        '채널마다 <b>연결된 스피커에 맞는 프리셋</b>을 골라요. 프리셋 · EQ · 딜레이는 담당자만 바꾸고, 바꾸기 전에 꼭 저장해요.',
        '켤 때는 <b>음원 장비 → 콘솔 → 앰프</b> 순서예요. 앰프는 맨 나중에 켜고, 끌 때는 맨 먼저 꺼요.',
        '<b>LIMIT(노란 불)</b>이 자주 켜지면 콘솔에서 소리를 줄여요. 앰프 게인을 올리거나 프리셋을 빼지 않아요.'
      ],
      model: 'dbamp'   // 3D 연결은 메인 작업자 담당 — 새 일반 모델: assets3d/generic_dsp_amp_model.js (window.GenericDspAmp)
    },
    theory: [
      { title: '「디지털 앰프」는 무엇일까 — Class D 와 PWM', visual: 'daPwm',
        pics: [{ v: 'daPwmMake', cap: '들어온 소리를 아주 빠른 삼각파와 견줘요. 소리가 더 높은 동안만 「켜짐」이에요. 그래서 소리가 클수록 「켜짐」이 길어요.' }],
        body: '방 전등 스위치를 아주 빠르게 켰다 껐다 한다고 생각해 봐요. 켜 둔 시간이 길수록 방이 더 밝아 보여요. Class D 앰프는 이 방법으로 소리를 크게 키우는(증폭) 앰프예요. 소리가 클수록 「켜짐」 시간을 길게 만들어요. 이것을 <b>PWM</b>(펄스 폭 변조)이라고 해요. 마지막에 <b>출력 필터</b>가 빠른 깜빡임을 걸러 매끈한 소리로 되돌려요. 그런데 「D」는 디지털(Digital)의 줄임말이 아니에요. A · B · AB 다음에 붙인 방식 이름일 뿐이에요. 「디지털」이라 부르는 진짜 까닭은 앰프 안의 작은 컴퓨터(DSP)예요. 기억할 한 줄: Class D 는 아주 빠른 켜고 끄기로 소리를 키워요.',
        more: '<ul><li><b>PWM (Analog Devices 기술 자료)</b>: 「켜짐」 시간의 비율(듀티)이 소리 크기에 맞춰 바뀌어요.</li> <li>출력 부품(출력단)은 + 전원과 − 전원 사이를 아주 빠르게 오가요(스위칭).</li> <li><b>PWM 을 만드는 법 (교재 6장 그림 6-6)</b>: 소리와 아주 빠른 삼각파를 견줘요(비교기). 소리가 더 높은 동안만 「켜짐」이에요.</li> <li><b>출력 필터</b>: 교재는 로우 패스 필터라고 불러요. 보통 코일과 콘덴서로 만들어요.</li> <li>같은 자료(Analog Devices)는 일부러 전기를 써 버리는 부품이 스피커뿐이라고 해요.</li> <li><b>「D」 ≠ Digital</b>: 오디오 잡지 Stereophile 도 같은 말을 했어요.</li> <li>앰프 설계자 Bruno Putzeys 는 「스피커 콘을 숫자로 움직일 수는 없다」고 말해요. 스피커로 가는 것은 결국 전압이에요.</li> <li><b>교재 6장</b>: Class D 는 디지털 입력을 DAC 없이 바로 바꿀 수 있어요. DAC 는 디지털을 아날로그로 바꾸는 부품이에요.</li> <li>「Class D 라서 소리가 좋다 · 나쁘다」는 정해져 있지 않아요. 같은 방식이라도 설계에 따라 달라요.</li></ul>',
        check: { q: 'Class D 의 「D」는 무슨 뜻일까요?', options: [
          { t: '디지털의 줄임말이에요', why: '아니에요. 「D」는 디지털의 줄임말이 아니에요. 스피커로 가는 것도 숫자가 아니라 전압이에요.' },
          { t: '켜고 끄는 방식에 붙인 이름이에요', ok: true, why: '맞아요. A · B · AB 처럼 방식에 붙인 이름이기 때문이에요. 빠르게 켜고 끄는 방식이에요.' },
          { t: '디지털 입력만 받는 앰프예요', why: '아니에요. 입력 종류와는 상관없어요. 아날로그 입력이 있는 Class D 앰프도 많아요.' }] } },
      { title: '열이 적은 앰프 — 효율 · 무게 · 환기', visual: 'daEff',
        pics: [{ v: 'daTap', cap: '비유예요. 반쯤 연 꼭지는 물살을 막으며 일해서 막힌 만큼 열이 나요. 다 열거나 다 잠그면 막히는 때가 거의 없어 열이 적어요.' }],
        body: '수도꼭지를 반쯤 열면 물살이 막히면서 흘러요. Class A · B · AB 앰프는 이렇게 전기를 막으며 일해서 열이 나요. Class D 는 「다 열기」와 「다 잠그기」만 해서 열이 훨씬 적어요. 그래서 열을 식히는 쇠붙이(방열판)가 작아도 돼요. 전원부도 빠르게 켜고 끄는 <b>스위칭 전원(SMPS)</b>이라 가벼워요. 그래서 같은 힘이면 Class D 앰프가 작고 가벼워요. 하지만 열이 아예 없지는 않아요. 앰프는 팬으로 바람을 넣어 스스로 식혀요. 랙의 바람길을 막지 말고, 앰프실은 바람이 잘 통하게 해요. 기억할 한 줄: 열이 적어도 바람길은 꼭 열어 둬요.',
        more: '<ul><li>여기서 <b>효율</b>은 쓴 전기 중 스피커로 보낸 힘의 비율이에요. 소리로 바뀌는 비율이 아니에요. 아래 숫자는 Analog Devices 자료예요.</li> <li><b>가장 크게 틀 때</b> 효율: Class B 는 이론상 78.5%, Class D 는 약 90% 예요.</li> <li><b>작게 틀 때</b>(10 W 앰프로 1 W): Class B 는 28%, Class D 는 78% 예요. 작게 틀수록 차이가 커요.</li> <li>Class AB 의 손실(버리는 전기)은 대체로 Class B 에 가까워요(Analog Devices).</li> <li>100 W 를 낼 때 버리는 열(이론): Class B 약 27 W, Class D 약 11 W 예요.</li> <li><b>교재 6장</b>: Class D 는 발열이 매우 적어 작은 방열판과 변압기(트랜스포머)를 써요. 그래서 같은 출력의 Class AB 앰프보다 작고 가벼워요.</li> <li><b>SMPS</b>: 높은 주파수로 켰다 껐다 해서 훨씬 작은 변압기를 써요(RS DesignSpark).</li> <li><b>PFC(역률 보정)</b>: 전류가 전압을 잘 따라가게 해서 건물 전기 설비의 부담을 줄여요(Powersoft). 설치용 디지털 앰프에 흔히 들어 있어요.</li> <li><b>교재 15장</b>: 앰프는 팬 때문에 조금 시끄러워요. 팬 소리가 무대로 가지 않게 해요.</li> <li>따로 앰프실을 두면 환기 · 냉방 설비를 꼭 생각해요(교재 15장).</li> <li>바람 방향은 제품마다 달라요. 많은 앰프가 앞에서 빨아들여 뒤로 내보내요. 설명서를 보고 그 길을 막지 않아요.</li> <li><b>출력 숫자 비교 주의</b>: 같은 앰프도 재는 신호(사인파 · 음악 같은 신호)에 따라 W 숫자가 크게 달라요.</li> <li><b>크레스트 팩터</b>: 신호의 가장 큰 순간이 평균보다 몇 dB 큰지예요. 이 값이 다르면 W 숫자를 바로 견주지 않아요.</li></ul>',
        check: { q: 'Class D 앰프가 가벼운 가장 큰 까닭은?', options: [
          { t: '열이 적고 전원부가 가벼워서', ok: true, why: '맞아요. 열이 적어 방열판이 작고, 스위칭 전원은 변압기가 작기 때문이에요.' },
          { t: '출력이 훨씬 작아서', why: '아니에요. 작고 가벼워도 채널마다 수백 ~ 수천 W 를 내는 앰프가 많아요.' },
          { t: '스피커 케이블이 필요 없어서', why: '아니에요. 디지털 앰프도 스피커까지는 스피커 케이블로 이어요.' }] } },
      { title: '앰프 안의 작은 컴퓨터 — 프리셋 · 크로스오버 · 딜레이 · 리미터', visual: 'daDsp',
        body: '옷 가게에서 몸에 맞는 옷을 고르듯, 스피커에도 맞는 설정이 있어요. 디지털 앰프 안에는 소리를 숫자로 다루는 작은 컴퓨터(<b>DSP</b>)가 있어요. 채널마다 그 스피커에 맞춘 설정 묶음(<b>스피커 프리셋</b>)을 골라요. 프리셋 안에는 소리 높이를 나누는 <b>크로스오버</b>가 있어요. 소리 색을 다듬는 <b>EQ</b>도 있어요. 스피커를 지키는 <b>리미터</b>(크기 울타리)도 있어요. 그 위에 사람이 만지는 EQ 와 <b>딜레이</b>(소리 늦추기)가 따로 있어요. 프리셋을 잘못 고르면 소리도 틀어지고 스피커 보호도 어긋나요. 그래서 담당자만 바꾸고, 바꾸기 전에 지금 설정을 저장해요. 기억할 한 줄: 스피커마다 맞는 프리셋을 입혀요.',
        more: '<ul><li><b>스피커 프로세서 (교재 16장)</b>: 스피커로 가는 소리를 다듬는 DSP 예요. 따로 된 기계도 있고, 앰프 안에 들어 있기도 해요.</li> <li><b>교재 15장</b>: 요즘은 스피커 회사가 자기 스피커용 처리 · 보호를 넣은 「프로세서 내장 앰프」를 많이 써요. 이때는 제조사가 권하는 대로 써요.</li> <li><b>입력부</b>는 스피커 전체나 시스템 전체를 맞춰요. 게인 · EQ · 딜레이가 있어요(교재 16장).</li> <li><b>출력부</b>는 드라이버(스피커 안의 울림판) 하나하나를 맞추고 지켜요. 크로스오버 · EQ · 딜레이 · 리미터 · 출력 크기가 있어요.</li> <li><b>크로스오버</b>: HPF 와 LPF 를 묶어 소리 높이를 나눠요(교재 16장). HPF 는 낮은 소리를, LPF 는 높은 소리를 걸러 내요.</li> <li><b>출력부 딜레이</b>: 한 스피커 안 드라이버 사이의 거리를 맞춰요. 보통 2 ms 안쪽의 작은 값이에요(교재). ms 는 1000분의 1초예요.</li> <li><b>입력부 딜레이</b>: 메인과 보조 스피커처럼 몇 m ~ 수십 m 떨어진 거리를 맞춰요. 그래서 값이 커요(교재).</li> <li><b>리미터</b>: 프로세서의 리미터 · 컴프레서는 스피커 보호용이에요. 앰프를 지나 스피커에 얼마나 큰 힘이 가는지 셈해서 정해요(교재 16장).</li> <li><b>이름은 회사마다 달라요</b>: 「프리셋」「스피커 셋업」「스피커 라이브러리」 등으로 불러요.</li> <li><b>LINEAR(평탄)</b>: 스피커 맞춤 처리 없이 보통 파워앰프처럼 쓰는 설정이에요. 맞는 프리셋이 있는 스피커 채널에는 쓰지 않아요.</li> <li>한 채널에 이어도 되는 스피커 대수를 제조사 자료에 정해 두기도 해요.</li> <li>앰프 설정 전체를 저장하고 불러오는 기능이 흔해요. 바꾸기 전에 저장해 두면 잘못돼도 되돌릴 수 있어요.</li></ul>',
        check: { q: '보조 스피커 채널을 LINEAR 로 두면 어떻게 될까요?', options: [
          { t: '맞춤 소리 · 보호가 빠져요', ok: true, why: '맞아요. 그 스피커에 맞춘 필터와 리미터가 걸리지 않기 때문이에요.' },
          { t: '소리가 아예 안 나요', why: '아니에요. LINEAR 에서도 소리는 나요. 맞춤 처리와 보호만 없어요.' },
          { t: '딜레이가 저절로 맞춰져요', why: '아니에요. 딜레이는 프리셋과 따로, 사람이 채널마다 넣어요.' }] } },
      { title: '입력과 네트워크 — 소리 길과 원격 제어', visual: 'daNet',
        pics: [{ v: 'daGainCeiling', cap: '입력 게인을 올리면 같은 소리가 더 크게 나와요. 하지만 앰프가 낼 수 있는 가장 큰 힘(천장)은 그대로예요. 천장을 넘는 만큼은 리미터가 눌러요.' }],
        body: '집에 현관문과 뒷문이 있듯, 앰프에도 소리가 들어오는 문이 여러 개예요. 보통 XLR 케이블로 받는 <b>아날로그 입력</b>이 있어요. 디지털로 받는 <b>AES3 입력</b>이 있는 앰프도 많아요. 랜선 한 줄로 여러 채널을 받는 <b>네트워크 오디오</b> 입력도 있어요. 어느 입력을 어느 채널로 보낼지는 앰프 화면이나 프로그램에서 정해요. 앰프를 랜선으로 노트북과 이으면 멀리서도 다뤄요. 이것을 <b>원격 제어</b>라고 해요. TV 리모컨처럼 방송실에서 앰프 랙을 살펴요. 채널 크기 · 뮤트 · 리미터 · 온도 · 경고를 한 화면에서 봐요. 예배 전에는 모든 채널에 소리가 들어오는지 확인해요. 기억할 한 줄: 소리 길과 제어 길은 따로예요.',
        more: '<ul><li><b>AES3 (AES/EBU)</b>: XLR 모양 단자 하나에 디지털 2채널이에요. 110 Ω 전용 케이블을 써요.</li> <li><b>샘플레이트</b>: 1초에 소리를 몇 번 재는지예요(예: 48 kHz). 보내는 쪽과 받는 쪽이 맞아야 해요.</li> <li>받는 쪽에서 샘플레이트를 바꿔 맞추는 변환기(SRC)가 든 앰프도 있어요.</li> <li><b>네트워크 오디오</b>: Dante · AES67 · Milan(AVB) 같은 방식이 있어요. 앰프마다 되는 방식이 달라서 설명서를 확인해요.</li> <li><b>입력 게인</b>: 입력마다 0.5 dB 단위 등으로 크기를 맞춰요. 처음 값은 0 dB 인 제품이 많아요.</li> <li><b>입력 감도 (교재 6장)</b>: 앰프가 가장 큰 힘을 내는 데 필요한 입력 크기예요. 예를 들어 「1.4 V」면 1.4 V 가 들어올 때 가장 큰 힘이 나요.</li> <li>게인(감도)을 바꾸면 같은 입력에서 나오는 크기만 바뀌어요. 앰프가 낼 수 있는 가장 큰 힘은 그대로예요(교재).</li> <li><b>교재 16장</b>: 프로세서는 USB · 시리얼 · 이더넷(랜선)으로 PC 에서 원격 제어하기도 해요.</li> <li><b>원격 제어 프로그램</b>: 여러 앰프를 묶어 전원 · 뮤트 · 크기 · EQ · 딜레이를 한 번에 다뤄요.</li> <li>앰프 없이 미리 설정을 준비하는 「오프라인 모드」가 있는 프로그램도 있어요.</li> <li><b>웹 화면</b>: 앰프 안의 웹 화면을 브라우저로 여는 제품도 있어요. 그러면 휴대폰 · 태블릿으로도 볼 수 있어요.</li> <li><b>제어 약속</b>: OCA/AES70 같은 공통 약속으로 제어하는 제품도 있어요.</li> <li>앰프 제어망은 비밀번호나 따로 된 네트워크로 아무나 못 들어오게 지켜요.</li></ul>',
        check: { q: '노트북과 앰프를 랜선으로 이었어요. 주로 무엇을 할까요?', options: [
          { t: '설정 바꾸기 · 상태 보기', ok: true, why: '맞아요. 제어 길이기 때문이에요. 소리는 보통 입력 단자로 따로 들어와요.' },
          { t: '스피커로 소리 보내기', why: '아니에요. 스피커로는 스피커 케이블이 소리를 보내요.' },
          { t: '앰프에 전기 넣기', why: '아니에요. 전기는 전원 케이블로 들어와요. 앰프의 랜선은 전원선이 아니에요.' }] } },
      { title: '4채널 나누기 — 출력과 Ω 맞추기', visual: 'daChurch',
        pics: [{ v: 'daImpPower', cap: '스피커를 나란히 이어 Ω 이 반이 되면 앰프 출력이 늘어요. 이론은 2배지만, 실제로 얼마나 느는지는 앰프마다 달라요(숫자는 교재).' }],
        body: '수도에 호스 네 개가 따로 달린 것을 떠올려 봐요. <b>4채널</b> 앰프는 한 대로 스피커 네 묶음을 따로 움직여요. 채널마다 프리셋 · EQ · 딜레이를 다르게 줄 수 있어요. 한 채널에 같은 스피커 두 대를 이으면 보통 나란히(<b>병렬</b>) 잇는 거예요. 그러면 Ω(전기가 흐르기 어려운 정도)이 반이 돼요. 호스를 하나 더 나란히 달면 물이 더 잘 흐르는 것과 같아요. 예를 들어 8 Ω 두 대는 4 Ω 이에요. Ω 이 낮아지면 앰프가 더 큰 힘을 내지만 그만큼 뜨거워져요. 그래서 교재는 한 채널이 4 Ω 아래로 내려가지 않게 권해요. 기억할 한 줄: 나란히 두 대면 Ω 이 반이에요.',
        more: '<ul><li><b>출력 숫자 예</b>: 4채널 디지털 앰프에 「8 Ω 채널당 1000 W 정도」처럼 적혀 있어요. 같은 앰프가 4 Ω 에서는 더 큰 숫자로 적혀요.</li> <li><b>Ω 이 반이 되면 (교재 6장)</b>: 이론으로는 출력이 2배가 돼요. 실제로는 보통 약 1.5배예요.</li> <li><b>교재 그림 6-7 의 앰프</b>: 8 Ω 475 W, 4 Ω 800 W, 2 Ω 1000 W 예요. Ω 이 반이 될 때마다 느는 폭이 줄어요.</li> <li>나란히 너무 많이 이어 최소 Ω 보다 낮아지면 앰프가 뜨거워져 망가질 위험이 커요(교재 6장).</li> <li><b>교재 15장</b>: 채널당 스피커를 모두 합한 Ω 이 4 Ω 아래로 내려가지 않게 쓰는 것이 좋아요. 앰프마다 허락하는 가장 낮은 Ω 은 설명서를 봐요.</li> <li><b>앰프 출력 고르기 (교재 15장)</b>: 「프로그램 파워」를 기준으로 해요. 같은 Ω 에서 스피커 정격 입력(견디는 힘)의 2배예요.</li> <li><b>한 줄로(직렬) 잇기</b>: 8 Ω 두 대를 한 줄로 이으면 16 Ω 이에요.</li> <li><b>브리지 모드 (교재 6장)</b>: 두 채널을 묶어 한 채널처럼 쓰는 방법이에요. 이론은 4배, 실제는 2~3배 정도예요. 자세한 건 04-1 에서 배워요.</li> <li><b>채널 묶어 보내기</b>: 4심 케이블 하나로 두 채널(예: 보조 + 서브)을 함께 보내게 하는 앰프도 있어요.</li> <li><b>스피커 단자</b>: speakON 이 흔해요. 나사로 조이는 블록 단자를 쓰는 설치용 앰프도 있어요.</li> <li><b>숫자 견주기 주의</b>: Ω · 재는 신호 · 모든 채널을 함께 쟀는지가 다르면 W 숫자를 바로 견주지 않아요.</li> <li>실제로 배선을 바꾸거나 점검할 때는 그 장소의 배정 자료와 담당자를 따라요.</li></ul>',
        check: { q: '16 Ω 스피커 두 대를 한 채널에 나란히 이었어요. 몇 Ω 일까요?', options: [
          { t: '8 Ω', ok: true, why: '맞아요. 같은 스피커 두 대를 나란히 이으면 16 ÷ 2 = 8 Ω 이기 때문이에요.' },
          { t: '32 Ω', why: '아니에요. 32 Ω 은 두 대를 한 줄로(직렬) 이었을 때예요.' },
          { t: '16 Ω', why: '아니에요. 16 Ω 은 한 대만 이었을 때예요. 나란히 두 대면 낮아져요.' }] } },
      { title: '켜고 끄는 순서 · 앞면 표시 · 스피커 점검', visual: 'daPower',
        pics: [{ v: 'daPopOX', cap: '켤 때 나는 「퍽」 소리를 앰프가 키우면 스피커가 다칠 수 있어요. 그래서 앰프는 맨 마지막에 켜고, 끌 때는 맨 먼저 꺼요.' }],
        body: '스피커 볼륨을 다 올린 채 장비를 켜면 「퍽」 소리가 나요. 앰프가 켜져 있으면 이 「퍽」을 아주 크게 키워 스피커를 다치게 해요. 그래서 켤 때는 <b>음원 장비 → 콘솔 → 앰프</b> 순서예요. 끌 때는 거꾸로 앰프를 맨 먼저 꺼요. 디지털 앰프는 켜고 소리가 나기까지 몇 초에서 수십 초 걸리기도 해요. 앞면에는 상태를 알려 주는 불빛(LED)이나 작은 화면이 있어요. 초록 SIGNAL 은 소리가 들어온다는 뜻이에요. 노란 LIMIT 은 리미터가 소리를 줄이는 중이에요. 빨간 CLIP · PROTECT 는 너무 크거나 이상이 있다는 뜻이에요. 많은 앰프는 <b>스피커 점검</b>으로 끊긴 스피커도 찾아 줘요. 기억할 한 줄: 앰프는 맨 나중에 켜고 맨 먼저 꺼요.',
        more: '<ul><li><b>순차 전원 분배기 (교재 9장)</b>: 큰 시스템에서는 이 기계가 정해진 순서대로 하나씩 켜 줘요. 끌 때는 거꾸로 꺼요.</li> <li><b>교재의 켜는 순서</b>는 네 단계예요. ① 음원 장비 → ② 콘솔 · 효과기 → ③ 스피커 프로세서 → ④ 파워앰프예요.</li> <li>① 음원 장비는 컴퓨터 · 오디오 인터페이스 · 무선 수신기 · 전자 악기예요.</li> <li><b>대기(Standby)</b>: 전기를 덜 쓰고 네트워크는 살아 있는 상태예요. 대기에서 깨면 보통 몇 초 안에 소리가 나요.</li> <li>뒷면 전원 스위치를 꺼도 전기가 완전히 끊기지 않는 앰프도 있어요. 그래서 정비할 때는 전원 플러그를 뽑아요.</li> <li>잠금식 전원 단자 중에는 전기가 흐를 때 꽂거나 빼면 안 되는 종류도 있어요. 설명서를 확인해요.</li> <li><b>화면형 앞면</b>: 채널 크기 · 프리셋 이름 · 리미터 · 경고를 글자와 그림으로 보여 줘요. 다이얼이나 터치로 메뉴를 고르는 제품도 있어요.</li> <li><b>LED형 앞면</b>: 채널마다 불빛 몇 개로 보여 줘요. 자세한 내용은 원격 제어 프로그램으로 봐요.</li> <li><b>불빛 이름</b>은 제품마다 달라요. 예: SIGNAL(SIG) · LIMIT(LIM, GR) · CLIP(OVL) · PROTECT(FAULT).</li> <li><b>보호(PROTECT)</b>: 앰프가 스스로 소리를 끊어 자기와 스피커를 지켜요. 너무 뜨겁거나, 출력선이 붙었거나(단락), 전기가 이상할 때예요.</li> <li><b>스피커 점검</b>: 스피커 Ω 을 재서 정해 둔 기준값과 견줘요. 제품마다 「부하 모니터링」「시스템 체크」 등으로 불러요.</li> <li>스피커 Ω 은 소리 높이(주파수)마다 달라요. 그래서 한 숫자가 아니라 기준값과의 차이로 판단해요.</li> <li>스피커 점검은 예배 직전이 아니라 시간 여유가 있을 때 해요.</li> <li><b>교회에서의 예</b>: 끝날 때 MUTE 를 걸고 앰프를 꺼요. 다음에 켤 때는 준비된 뒤 뮤트를 풀고, 작은 소리로 확인해요.</li></ul>',
        check: { q: '찬양 중 보조 스피커 채널의 LIMIT(노랑)이 자주 켜져요. 어떻게 할까요?', options: [
          { t: '콘솔에서 그 출력을 조금 줄여요', ok: true, why: '맞아요. 리미터가 일하는 중이라, 들어가는 소리를 줄이는 게 먼저이기 때문이에요. 계속되면 담당자와 점검해요.' },
          { t: '앰프 입력 게인을 올려요', why: '아니에요. 게인을 올리면 리미터가 더 세게 일해요.' },
          { t: '프리셋을 LINEAR 로 바꿔요', why: '아니에요. 스피커 보호가 사라져 스피커가 망가질 수 있어요.' }] } }
    ],
    practice: {
      kind: 'dampBench',
      lead: '4채널 디지털 앰프 두 대를 단순하게 만든 가상 화면이에요. ① 위 「켜는 순서」 버튼으로 장비를 켜요. ② 앰프 앞면의 채널(CH)을 눌러 골라요. ③ 「채널 설정」에서 입력 · 프리셋 · 게인 · 딜레이를 바꿔요. ④ 「시험 재생」과 「스피커 점검」으로 확인해요. 과제는 위에서부터 차례로 하면 쉬워요.',
      note: '이 화면의 이름과 입력 배정은 모두 교육용 예시예요. 실제 제품마다 메뉴와 이름이 달라요. 거리 · 신호 크기 · 리미터 시작점 · 잰 Ω 도 예시예요. 켜지는 시간은 실습에서 몇 초로 줄였어요. 실제 앰프 설정은 꼭 담당자와 함께 바꿔요.',
      tasks: [
        { id: 'power', title: '켜는 순서 지키기', text: '① 음원 장비 → ② 콘솔 → ③ 앰프 A · B 순서로 켜요. 두 앰프의 POWER 가 초록이 되면 ④ MUTE ALL 을 풀어요. 순서가 맞으면 성공이에요.' },
        { id: 'route', title: '입력 고르기', text: '「입력 신호 표」를 봐요. 채널마다 「입력」에서 표에 적힌 D1–D4 를 골라요. 8개 채널이 모두 맞으면 성공이에요.' },
        { id: 'preset', title: '스피커 프리셋 고르기', text: '채널을 누르고, 연결된 스피커에 맞는 프리셋을 골라요. 예를 들어 메인 스피커는 MAIN12 예요. 이름 뜻은 버튼 아래에 있어요. LINEAR 가 하나도 없으면 성공이에요.' },
        { id: 'delay', title: '보조 스피커에 딜레이 넣기', text: '보조 스피커 세 채널에 딜레이를 넣어요. 앰프 A CH4, 앰프 B CH1 · CH2 예요. 값은 「거리 ÷ 343 × 1000」 ms 부터 5 ms 더 큰 값 사이예요. 나머지는 0.3 ms 그대로 둬요.' },
        { id: 'headroom', title: '리미터 여유 지키기', text: '「시험 재생」을 켜요. 입력 게인으로 리미터 여유를 0 ~ 8 dB(초록 칸)로 맞춰요. LIMIT · CLIP 이 꺼지고, 메인 L · R 게인이 같으면 성공이에요.' },
        { id: 'fault', title: '끊긴 스피커 찾기', text: '「스피커 점검 실행」을 눌러요. 「확인 필요」 채널을 골라 알맞은 원인을 눌러요. 원인을 맞히면 성공이에요.' }
      ],
      links: [
        { title: '음향 시스템 설계 실습 · 3D 실습 ③', text: '콘솔 → 파워앰프 → 패시브 스피커를 speakON 으로 이어 봐요. 앰프의 기본을 손으로 익혀요.', go: { tab: 'tab1', card: 's3' } },
        { title: '장비 브랜드 알아보기 · 파워앰프', text: '여러 회사의 설치용 디지털 앰프를 함께 살펴봐요.', go: { tab: 'tabBrands' } }
      ]
    },
    quiz: [
      { q: '「디지털 앰프」를 바르게 말한 것은?', options: [
        { t: '흔히 Class D 앰프를 부르는 말', ok: true, why: '맞아요. 정말 디지털인 부분은 앰프 안 DSP · 디지털 입력 · 원격 제어이기 때문이에요.' },
        { t: '스피커로 숫자 신호를 보내요', why: '아니에요. 스피커로 가는 것은 필터를 지난 전압이에요.' },
        { t: '아날로그 입력이 없어요', why: '아니에요. 아날로그 입력이 있는 디지털 앰프가 많아요.' }] },
      { q: '보조 스피커가 10.3 m 뒤에 있어요. 딜레이는? (소리 343 m/s)', options: [
        { t: '약 3 ms', why: '아니에요. 1 m 에 약 2.9 ms 라서, 10 m 면 약 30 ms 예요.' },
        { t: '약 30 ms', ok: true, why: '맞아요. 10.3 ÷ 343 × 1000 ≈ 30 ms 이기 때문이에요. 메인 소리가 먼저 들리게 몇 ms 더 주기도 해요.' },
        { t: '약 300 ms', why: '아니에요. 300 ms 는 소리가 약 100 m 가는 시간이에요. 메아리처럼 들려요.' }] },
      { q: '그림처럼 기준 8 Ω 채널이 16 Ω 으로 나왔어요. 왜일까요?', visual: 'daZCheck', options: [
        { t: '선끼리 붙었어요(단락)', why: '아니에요. 단락이면 Ω 이 기준보다 아주 낮게 나와요.' },
        { t: '정상이에요. 높을수록 좋아요', why: '아니에요. 기준의 2배는 정상이 아니에요. 한 대 몫이 빠졌다는 뜻이에요.' },
        { t: '스피커 한 대가 빠졌어요', ok: true, why: '맞아요. 16 Ω 두 대 중 한 대만 남으면 16 Ω 이기 때문이에요. 링크 케이블과 그 스피커를 확인해요.' }] },
      { q: '메인 L 소리가 안 나고 SIGNAL(초록)도 꺼져 있어요. 먼저 볼 곳은?', options: [
        { t: '앰프로 들어오는 입력', ok: true, why: '맞아요. SIGNAL 은 입력이 들어올 때 켜지기 때문이에요. 입력 고르기 · 케이블 · 콘솔 출력을 봐요.' },
        { t: '스피커 케이블과 스피커', why: '아니에요. 스피커 쪽 문제라면 입력은 들어와서 SIGNAL 이 켜져 있어요.' },
        { t: '프리셋을 바꿔 보기', why: '아니에요. 프리셋은 입력이 없는 문제와 상관없어요. 함부로 바꾸지도 않아요.' }] },
      { q: '앰프 두 대의 W 숫자를 견줘요. 맞는 생각은?', options: [
        { t: 'W 가 2배면 2배 크게 들려요', why: '아니에요. W 가 2배여도 귀에는 조금(약 3 dB) 커질 뿐이에요.' },
        { t: '잰 조건이 같은지 먼저 봐요', ok: true, why: '맞아요. Ω · 재는 신호 · 모든 채널을 함께 쟀는지가 다르면 숫자가 크게 달라지기 때문이에요.' },
        { t: 'W 가 큰 앰프가 늘 좋아요', why: '아니에요. 스피커가 견디는 힘과 공간에 맞는지가 더 중요해요.' }] }
    ],
    missions: [
      { title: '음향 트러블슈팅 · 미션 C', text: '패시브 스피커에서 소리가 안 날 때를 연습해요. 앰프 전원 → 크기 → 스피커 연결을 차례로 봐요.', go: { tab: 'tab7', ts: 'C' } },
      { title: '음향 트러블슈팅 · 미션 B', text: '스피커 한쪽만 소리가 안 날 때를 연습해요. 앰프 불빛 → 입력 → 스피커 연결 순서로 봐요.', go: { tab: 'tab7', ts: 'B' } }
    ],
    deeper: [
      { title: '긴 스피커 케이블 — 케이블 보정 기능', text: '스피커 케이블이 아주 길면 높은 소리가 조금 약해질 수 있어요. 어떤 디지털 앰프는 이것을 앰프 안에서 바로잡아 줘요. 케이블 길이와 굵기를 넣으면 돼요. 그래도 먼저 앰프를 스피커 가까이 두고, 굵은 케이블을 써요.', more: '<ul><li><b>교재 5장</b>: 케이블이 가늘고 길수록 저항이 커져 힘이 줄고 소리가 나빠져요.</li> <li>그래서 앰프실은 스피커와 가까운 곳에 두고, 충분히 굵은 케이블을 써요(교재 5장 · 15장).</li> <li><b>보정 기능</b>: 케이블 길이 · 굵기 · 스피커 대수를 넣으면 앰프가 높은 소리 쪽 변화를 바로잡아요.</li> <li>제조사 자료에 정한 스피커 · 길이 안에서만 동작하는 경우가 많아요.</li> <li>실제 케이블과 다른 값을 넣으면 오히려 소리가 틀어질 수 있어요. 그래서 설치 자료의 케이블 길이를 확인해요.</li></ul>' },
      { title: '입력이 끊길 때 · 비상 방송 — 예비 입력과 우선 입력', text: '어떤 앰프는 주 입력이 끊기면 예비 입력(Fallback)으로 바꿔요. 정해 둔 입력을 가장 먼저 내보내는 기능(Override)도 있어요. 비상 안내 방송에 써요.', more: '<ul><li><b>Fallback</b>: 주 소리 길과 예비 소리 길을 정해 둬요. 손으로 또는 자동으로 바꿔요.</li> <li>예: 디지털 입력이 끊기면 아날로그 입력으로 바꿔요.</li> <li><b>Override</b>: 비상 안내나 전체 방송을 다른 모든 소리보다 앞세워 내보내요.</li> <li>이 기능이 켜져 있으면 예배 중 갑자기 소리가 바뀌는 원인이 될 수도 있어요. 담당자에게 설정을 확인해 둬요.</li></ul>' },
      { title: '스스로 쉬는 앰프 — 자동 대기 · 바깥 단자', text: '소리가 한동안 없으면 스스로 쉬는(자동 대기) 앰프가 있어요. 소리가 들어오면 다시 깨어나요. 다른 장비와 신호를 주고받는 단자도 있어요.', more: '<ul><li><b>자동 대기</b>: 입력이 정한 시간 동안 기준보다 작으면 대기로 들어가요. 전기를 아껴요.</li> <li><b>자동 깨우기</b>: 입력이 기준을 넘으면 다시 켜져요.</li> <li>깨어나는 데 몇 초가 걸릴 수 있어요. 그래서 예배 첫 말이 잘릴 수 있어요.</li> <li>예배 전에 미리 소리를 내어 앰프가 깨어 있는지 확인해요.</li> <li><b>GPIO</b>: 바깥 스위치 · 제어기와 신호를 주고받는 단자예요. 저장한 설정을 바꾸는 데 쓰기도 해요.</li> <li><b>고장 알림 단자(FAULT)</b>: 앰프에 이상이 생기면 경고등 같은 바깥 장비에 알려요.</li></ul>' }
    ],
    sources: [   // 2026-11-08: 3층 장비(d&b 앰프 · 스피커 · Yamaha Rio) 자료 줄은 뺌 — 일반 기술 자료와 교재만
      { t: 'Class D Audio Amplifiers: What, Why, and How — Analog Devices (PWM · 출력 필터 · 효율 78.5% / 90% · 28% / 78%)', url: 'https://www.analog.com/en/resources/analog-dialogue/articles/class-d-audio-amplifiers.html' },
      { t: 'Is Class-D Digital? — Stereophile (「D」는 디지털의 줄임말이 아님)', url: 'https://stereophile.com/content/ps-audio-stellar-m1200-monoblock-power-amplifier-class-d-digital' },
      { t: 'Pros and cons of switch mode power supplies — RS DesignSpark (SMPS 는 작고 가벼움)', url: 'https://www.rs-online.com/designspark/pros-and-cons-of-switch-mode-power-supplies-smps' },
      { t: 'PFC Switch Mode Power Supply — Powersoft (PFC 가 하는 일)', url: 'https://powersoft.com/en/technologies/pfc-switch-mode-power-supply' },
      { t: 'Sound Advice: Using delayed loudspeakers — QSC (거리 ÷ 소리 빠르기, 몇 ms 더 주기)', url: 'https://support.qscaudio.com/en_US/sound-advice/sound-advice-%7C-loudspeaker-placement-part-7-using-delayed-loudspeakers' },
      { t: 'Speed of Sound in Air — The Physics Factbook (20 °C 에서 약 343 m/s)', url: 'https://hypertextbook.com/facts/2000/CheukWong.shtml' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 5장 케이블의 신호 손실 p.172 · 6장 파워 앰프: 증폭 방식(Class D · PWM) p.178–179 · 출력과 임피던스 · 입력 감도 p.180–181 · 브리지 p.183', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 9장 순차 전원 분배기 p.284–285 · 15장 앰프 및 프로세서의 디자인(프로세서 내장 앰프 · 프로그램 파워 · 4 Ω · 앰프실) p.441–442 · 16장 스피커 프로세서 p.459–462', url: '' }
    ]
  };
})();
