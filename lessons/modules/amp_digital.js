/* =============================================================================
   04-2 디지털 앰프 (d&b 40D · 10D 기준) — 2026-11-04
   - STA_MODULES['amp-digital'] (모듈 데이터) + STAVisuals.da* (그림 6개) + STASims.dampBench (앰프 랙 실습)
   - 04-1 아날로그 앰프(amp.js, Crown XLi1500)의 기본(임피던스·정격·dB·클리핑·브리지)은 되풀이하지 않고,
     Class D · 스위칭 전원 · 앰프 안 DSP(스피커 셋업) · 디지털 입력 · 원격 제어 · 4채널 · 대기/감시를 다룸
   - 장비 숫자(제조사 자료):
       d&b 40D — Class D 4채널, 2U · 13.3 kg, 4 × 2000 W/8Ω · 4 × 2400 W/4Ω (EIA-426B, CF 12 dB, 모든 채널),
                 사인파 1 kHz 장시간 +40 °C 250 W/4Ω, 아날로그 A1–A4 · AES3 D1/2 · D3/4 · Milan M1–M8,
                 EQ 16밴드 × 2, 딜레이 0.3 ms–10 s, LoadMatch(70 m), 부하 모니터링 · 시스템 체크,
                 SMPS + 능동 PFC, 대기 21 W · 무신호 130 W (보통), 켜고 소리 나기까지 45 초 미만, 대기 → 소리 4 초 미만,
                 4.3" 터치스크린, R1 · OCA/AES70
       d&b 10D — Class D 4채널, 2U · 10.6 kg, 4 × 700 W/4Ω · 4 × 350 W/8Ω (CF 6 dB, 모든 채널),
                 아날로그 4 · AES3 2입력(4채널), EQ 16밴드 × 2, 딜레이 최대 10 s, 입력 게인 −57.5 ~ +6 dB,
                 LED POWER · DATA · MUTE · ISP · GR(리미터 3 dB 이상) · OVL, 켜는 데 약 17 초, V 시리즈 미지원
       스피커 — Vi10P 8Ω(셋업 V10P) · V-SUB 8Ω · Yi10P/Yi7P 8Ω(셋업 Y10P/Y7P) · E8 12Ω · MAX2 8Ω
   - 실습의 그 밖의 숫자(Rio AES 출력 번호 배정, 거리, 신호 크기, 리미터 시작점 −5 dBFS, 잰 임피던스, 켜지는 시간)는 교육용 예시.
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
    var s = t(300, 18, 'Class D 앰프가 소리를 키우는 길 (교육용으로 단순화한 그림)', { size: 11, fill: C.sub });
    s += rect(8, 30, 170, 108, '#fff', C.line) + sine(18, 150, 80, 26, 1.5, C.blue) + '<path d="M18 80H168" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(93, 128, '① 소리 신호 (작은 전압)', { size: 10.5, weight: 700, fill: C.blue });
    // PWM 펄스: 소리가 클수록 펄스가 넓어짐
    var x0 = 224, w = 152, N = 22, slot = w / N, hi = 54, lo = 104, d = 'M' + x0 + ' ' + lo;
    for (var k = 0; k < N; k++) { var duty = 0.5 + 0.42 * Math.sin(2 * Math.PI * 1.5 * (k + 0.5) / N), xa = x0 + k * slot, xb = xa + duty * slot; d += 'L' + xa.toFixed(1) + ' ' + lo + 'L' + xa.toFixed(1) + ' ' + hi + 'L' + xb.toFixed(1) + ' ' + hi + 'L' + xb.toFixed(1) + ' ' + lo; }
    d += 'L' + (x0 + w) + ' ' + lo;
    s += rect(214, 30, 172, 108, '#fff', C.line) + t(300, 46, '출력 부품: 켜짐 / 꺼짐만', { size: 9.5, fill: C.sub }) + '<path d="' + d + '" fill="none" stroke="' + C.orange + '" stroke-width="1.8"/>' + t(300, 128, '② PWM — 클수록 펄스가 넓어요', { size: 10.5, weight: 700, fill: C.orange });
    s += rect(422, 30, 170, 108, '#fff', C.line) + sine(432, 150, 80, 36, 1.5, C.green, 3) + '<path d="M432 80H582" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(507, 128, '③ 출력 필터(코일·콘덴서)', { size: 10.5, weight: 700, fill: C.green });
    s += arrow(180, 84, 212, 84, '#94a3b8') + arrow(388, 84, 420, 84, '#94a3b8');
    s += rect(8, 150, 288, 58, '#fff7ed', '#fdba74') + t(152, 172, '「디지털 앰프」= 흔히 Class D 를 부르는 말', { size: 11.5, weight: 800, fill: C.orange }) + t(152, 192, 'Class D 의 「D」는 Digital 의 줄임말이 아니에요', { size: 10.5, fill: C.ink });
    s += rect(304, 150, 288, 58, '#ecfeff', '#67e8f9') + t(448, 172, '정말 「디지털」인 부분', { size: 11.5, weight: 800, fill: C.teal }) + t(448, 192, '앰프 안 DSP · AES3/네트워크 입력 · 원격 제어', { size: 10.5, fill: C.ink });
    return svg(600, 216, s, 'Class D 앰프의 PWM 과 출력 필터');
  };

  /* ---------------------------------------------------------------- 그림 2: 효율 · 열 · 전원부 */
  V.daEff = function () {
    var s = t(8, 18, '효율 = 쓴 전기 중 스피커로 보낸 출력의 비율 (Analog Devices 기술 자료)', { size: 10.5, fill: C.sub, anchor: 'start' });
    var bx = 112, full = 176;
    function bar(y, lab, v, col) { return t(bx - 8, y + 12, lab, { size: 10.5, anchor: 'end' }) + rect(bx, y, full, 16, '#eef2f7', null, 4) + rect(bx, y, (v / 100 * full).toFixed(1), 16, col, null, 4) + t(bx + v / 100 * full + 5, y + 12, v + '%', { size: 10.5, weight: 800, anchor: 'start' }); }
    s += t(8, 42, '가장 크게 틀 때 (클리핑 직전)', { size: 11, weight: 800, anchor: 'start', fill: C.ink });
    s += bar(50, 'Class B (이론)', 78.5, '#94a3b8') + bar(72, 'Class D', 90, C.teal);
    s += t(8, 108, '작게 틀 때 (10 W 앰프로 1 W)', { size: 11, weight: 800, anchor: 'start', fill: C.ink });
    s += bar(116, 'Class A', 3, '#cbd5e1') + bar(138, 'Class B', 28, '#94a3b8') + bar(160, 'Class D', 78, C.teal);
    s += t(8, 198, 'Class AB 의 손실은 대체로 Class B 에 가까워요 (같은 자료)', { size: 10, fill: C.sub, anchor: 'start' });
    s += t(8, 216, '이론 효율로 계산하면, 100 W 를 낼 때 열: B 약 27 W · D 약 11 W', { size: 10, fill: C.sub, anchor: 'start' });
    s += rect(344, 30, 248, 94, '#f0fdfa', '#5eead4') + t(468, 50, '전원부: SMPS + PFC', { size: 12, weight: 800, fill: C.teal });
    ['아주 빠르게 켰다 껐다 하는 전원부라', '변압기가 작고 가벼워요', 'PFC: 전류가 전압을 잘 따라가게 해서', '전기를 고르게 끌어 써요'].forEach(function (x, i) { s += t(468, 70 + i * 14, x, { size: 10.5 }); });
    s += rect(344, 134, 248, 94, '#eff6ff', '#93c5fd') + t(468, 154, 'd&b 40D (제조사 자료)', { size: 12, weight: 800, fill: C.blue });
    ['2U · 13.3 kg · Class D 4채널', '4 × 2400 W / 4Ω (CF 12 dB 신호)', '대기 21 W · 신호 없을 때 130 W', 'SMPS + 능동 PFC'].forEach(function (x, i) { s += t(468, 174 + i * 14, x, { size: 10.5 }); });
    return svg(600, 236, s, 'Class D 와 Class A·B 의 효율 비교, 스위칭 전원부');
  };

  /* ---------------------------------------------------------------- 그림 3: 앰프 안의 DSP */
  V.daDsp = function () {
    var s = t(300, 16, '40D · 10D 한 채널 안의 처리 (d&b 자료를 단순화한 교육용 그림 · 실제 내부 순서는 다를 수 있어요)', { size: 10, fill: C.sub });
    var row1 = [['입력 고르기', 'A1–A4 · D1–D4', '(40D 는 M1–M8 도)', C.teal], ['입력 게인', '−57.5 ~ +6 dB', '(10D 설명서)', C.teal], ['EQ', '16밴드 × 2', '사람이 조절', C.blue], ['딜레이', '0.3 ms ~ 10 s', '채널마다', C.blue]];
    row1.forEach(function (b, i) { var x = 8 + i * 150; s += rect(x, 30, 128, 60, '#fff', b[3]) + t(x + 64, 50, b[0], { size: 12, weight: 800, fill: b[3] }) + t(x + 64, 66, b[1], { size: 10, fill: C.ink }) + t(x + 64, 81, b[2], { size: 9.5, fill: C.sub }); if (i < 3) s += arrow(x + 128, 60, x + 148, 60, '#94a3b8'); });
    s += arrow(522, 90, 522, 118, '#94a3b8');
    s += rect(380, 120, 206, 64, '#f5f3ff', C.purple) + t(483, 140, '스피커 셋업', { size: 12.5, weight: 800, fill: C.purple }) + t(483, 157, 'V10P · Y7P · E8 … 스피커 이름으로', { size: 10, fill: C.ink }) + t(483, 173, '필터 · CUT/HFA/CPL · 리미터', { size: 10, fill: C.ink });
    s += arrow(378, 152, 334, 152, '#94a3b8');
    s += rect(200, 120, 132, 64, C.teal, null) + t(266, 146, '앰프 (Class D)', { size: 12, weight: 800, fill: '#fff' }) + t(266, 164, '전압·전류 키우기', { size: 10, fill: '#cffafe' });
    s += arrow(198, 152, 154, 152, '#94a3b8');
    s += rect(8, 120, 144, 64, '#fff', C.line) + t(80, 146, '스피커', { size: 12, weight: 800 }) + t(80, 164, 'Vi10P · Yi7P · E8 …', { size: 10, fill: C.sub });
    s += t(300, 204, '스피커 셋업 = 그 스피커에 맞춘 소리와 보호 · 사람이 조절하는 EQ · 딜레이와 따로예요', { size: 10.5, fill: C.ink, weight: 700 });
    return svg(600, 212, s, '디지털 앰프 한 채널 안의 DSP 처리');
  };

  /* ---------------------------------------------------------------- 그림 4: 입력과 네트워크 */
  V.daNet = function () {
    var s = t(8, 16, '우리 교회 3층: 소리 신호(굵은 선)와 제어(점선) — 교회 설치 자료 기준', { size: 10.5, fill: C.sub, anchor: 'start' });
    s += rect(8, 34, 112, 58, '#fff', C.ink) + t(64, 58, 'CL5 콘솔', { size: 12, weight: 800 }) + t(64, 76, '방송실', { size: 10, fill: C.sub });
    s += arrow(120, 63, 170, 63, C.blue) + t(145, 55, 'Dante', { size: 10, weight: 700, fill: C.blue });
    s += rect(172, 34, 124, 58, '#fff', C.ink) + t(234, 58, 'Rio 스테이지박스', { size: 11.5, weight: 800 }) + t(234, 76, '앰프 랙 맨 위', { size: 10, fill: C.sub });
    s += arrow(296, 52, 352, 42, C.orange) + arrow(296, 74, 352, 104, C.orange) + t(326, 70, 'AES/EBU', { size: 9.5, weight: 700, fill: C.orange });
    s += rect(354, 20, 110, 44, C.teal, null) + t(409, 39, '40D', { size: 12.5, weight: 800, fill: '#fff' }) + t(409, 55, '메인·서브·천장 가운데', { size: 9, fill: '#cffafe' });
    s += rect(354, 84, 110, 44, C.teal, null) + t(409, 103, '10D', { size: 12.5, weight: 800, fill: '#fff' }) + t(409, 119, '천장 좌우·기둥·모니터', { size: 9, fill: '#cffafe' });
    s += arrow(464, 42, 484, 42, C.red) + arrow(464, 106, 484, 106, C.red);
    s += rect(486, 20, 106, 44, '#fff', C.line) + t(539, 39, 'Vi10P · V-SUB', { size: 10, weight: 700 }) + t(539, 54, 'Yi10P', { size: 10, weight: 700 });
    s += rect(486, 84, 106, 44, '#fff', C.line) + t(539, 103, 'Yi7P · E8', { size: 10, weight: 700 }) + t(539, 118, 'MAX2', { size: 10, weight: 700 });
    s += rect(354, 156, 238, 46, '#f5f3ff', '#c4b5fd') + t(473, 176, 'R1 원격 제어 (PC · Mac)', { size: 11.5, weight: 800, fill: C.purple }) + t(473, 192, 'Ethernet · OCA/AES70 · 상태 보기 · 설정', { size: 9.5, fill: C.sub });
    s += '<path d="M392 156V128" stroke="' + C.purple + '" stroke-width="2" stroke-dasharray="5 4"/><path d="M474 156V42H464" stroke="' + C.purple + '" stroke-width="2" stroke-dasharray="5 4" fill="none"/>';
    ['• 40D · 10D 입력: 아날로그 4개 + AES3 4채널', '   (AES3 단자 2개, 한 단자에 2채널씩)', '• 40D 는 Milan 네트워크 입력 8채널도 있어요', '• 두 앰프 데이터시트에 Dante 입력은 없어요', '   → Rio 가 AES/EBU 로 바꿔서 보내 줘요'].forEach(function (x, i) { s += t(8, 124 + i * 17, x, { size: 10.5, anchor: 'start' }); });
    return svg(600, 212, s, '콘솔에서 Rio 를 거쳐 앰프로 가는 디지털 신호와 원격 제어');
  };

  /* ---------------------------------------------------------------- 그림 5: 3층 채널 배정 */
  var CH_ROWS = {
    a40: [['CH1', '메인 L', 'Vi10P × 1 · 셋업 V10P', '8 Ω'], ['CH2', '메인 R', 'Vi10P × 1 · 셋업 V10P', '8 Ω'], ['CH3', '서브 (우퍼)', 'V-SUB × 2 · 셋업 V-SUB', '4 Ω'], ['CH4', '천장 가운데', 'Yi10P × 1 · 셋업 Y10P', '8 Ω']],
    a10: [['CH1', '천장 좌우', 'Yi7P × 2 (링크) · 셋업 Y7P', '4 Ω'], ['CH2', '기둥 좌우', 'E8 × 2 (링크) · 셋업 E8', '6 Ω'], ['CH3', '바닥 모니터 L', 'MAX2 × 1 · 셋업 MAX2', '8 Ω'], ['CH4', '바닥 모니터 R', 'MAX2 × 1 · 셋업 MAX2', '8 Ω']]
  };
  V.daChurch = function () {
    var s = t(8, 16, '3층 앰프 채널 배정 (교회 설치 자료) · 셋업 이름 · 임피던스(Ω)는 d&b 자료', { size: 10.5, fill: C.sub, anchor: 'start' });
    [['a40', 8, '40D — 출력이 큰 앰프'], ['a10', 304, '10D — 작은 구역용 앰프']].forEach(function (A) {
      var x = A[1]; s += rect(x, 26, 288, 196, '#f8fafc', C.line, 10) + t(x + 144, 46, A[2], { size: 12, weight: 800, fill: C.teal });
      CH_ROWS[A[0]].forEach(function (r, i) { var y = 56 + i * 41;
        s += rect(x + 8, y, 272, 35, '#fff', '#e2e8f0', 6) + t(x + 18, y + 22, r[0], { size: 11, weight: 900, fill: C.orange, anchor: 'start' }) + t(x + 54, y + 15, r[1], { size: 11, weight: 800, anchor: 'start' }) + t(x + 54, y + 29, r[2], { size: 9.5, fill: C.sub, anchor: 'start' }) + t(x + 272, y + 23, r[3], { size: 12.5, weight: 800, fill: C.blue, anchor: 'end' }); });
    });
    s += t(300, 240, '한 채널에 같은 스피커 두 대 = 병렬(나란히): 8 Ω 2대 = 4 Ω, 12 Ω(E8) 2대 = 6 Ω', { size: 10.5, fill: C.ink, weight: 700 });
    return svg(600, 248, s, '3층 40D 와 10D 의 채널별 스피커 배정');
  };

  /* ---------------------------------------------------------------- 그림 6: 켜는 순서 · 표시등 */
  V.daPower = function () {
    var s = t(8, 18, '켜는 순서 (끌 때는 거꾸로)', { size: 12, weight: 800, anchor: 'start' });
    [['① CL5 콘솔', ''], ['② Rio 스테이지박스', ''], ['③ 40D · 10D 전원', '소리 나기까지: 40D 45초 미만 · 10D 약 17초'], ['④ 준비되면 MUTE 풀기', '작은 소리로 채널마다 확인']].forEach(function (r, i) { var y = 30 + i * 44;
      s += rect(8, y, 290, 34, i === 2 ? '#ecfeff' : '#fff', i === 2 ? '#67e8f9' : C.line, 7) + t(20, y + (r[1] ? 15 : 22), r[0], { size: 11.5, weight: 800, anchor: 'start' }) + (r[1] ? t(20, y + 29, r[1], { size: 9.5, fill: C.sub, anchor: 'start' }) : '');
      if (i < 3) s += arrow(40, y + 34, 40, y + 43, '#94a3b8'); });
    s += t(8, 222, '끌 때: MUTE → 앰프 → Rio → 콘솔 (④는 교회 운영 절차 예시)', { size: 10, fill: C.sub, anchor: 'start' });
    s += rect(312, 8, 280, 222, '#1f2933', '#0b0f14', 10) + t(452, 28, '앞면 표시등 (d&b 10D 설명서)', { size: 11.5, weight: 800, fill: '#e5e7eb' });
    [['POWER', '#22c55e', '켜짐 · 깜빡이면 대기'], ['DATA', '#facc15', '네트워크 연결 · 통신 중'], ['ISP', '#22c55e', '입력 신호가 들어와요'], ['GR', '#facc15', '리미터가 3 dB 이상 줄이는 중'], ['OVL', '#ef4444', '신호가 너무 큼 (−2 dBFS 넘음 등)'], ['MUTE', '#ef4444', '뮤트 · 깜빡이면 이상']].forEach(function (r, i) { var y = 52 + i * 27;
      s += '<circle cx="330" cy="' + y + '" r="6.5" fill="' + r[1] + '"/>' + t(344, y + 4, r[0], { size: 11, weight: 800, fill: '#fff', anchor: 'start' }) + t(584, y + 4, r[2], { size: 10, fill: '#cbd5e1', anchor: 'end' }); });
    s += t(452, 220, '표시등 배치 · 모양은 그림용이에요', { size: 9.5, fill: '#94a3b8' });
    return svg(600, 238, s, '디지털 앰프 켜는 순서와 앞면 표시등');
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

  /* 그림 10: Ω 이 반이 되면 출력은? — 이론 2배, 실제는 앰프마다 */
  V.daImpPower = function () {
    var s = t(240, 20, 'Ω 이 반(8 → 4 Ω)이 되면 출력은 몇 배?', { size: 15, weight: 800 });
    var bx = 150, full = 170;
    [['이론 (P = V² ÷ R)', 2, '×2', '#94a3b8'], ['교재 · 보통 앰프', 1.5, '약 ×1.5', C.amber], ['d&b 10D', 2, '350 → 700 W', C.teal], ['d&b 40D', 1.2, '2000 → 2400 W', C.blue]].forEach(function (r, i) { var y = 40 + i * 38;
      s += t(bx - 8, y + 17, r[0], { size: 13, weight: 700, anchor: 'end' }) + rect(bx, y + 2, full, 22, '#eef2f7', null, 4) + rect(bx, y + 2, (r[1] / 2 * full).toFixed(1), 22, r[3], null, 4) + t(bx + r[1] / 2 * full + 6, y + 18, r[2], { size: 13, weight: 800, anchor: 'start', fill: r[3] === '#94a3b8' ? C.sub : r[3] });
    });
    s += '<path d="M' + (bx + full / 2) + ' 36V194" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(bx + full / 2, 206, '×1 (그대로)', { size: 12, fill: C.sub });
    s += t(240, 228, '실제로는 전원부 · 전류 한계 때문에 덜 늘기도 해요', { size: 12.5, fill: C.ink });
    return pic(480, 236, s, '임피던스가 반이 될 때 출력이 늘어나는 정도');
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

  /* 그림 12 (용어 아이콘): 스피커 셋업 = 스피커마다 맞춘 옷 */
  V.daTermSetup = function () {
    var s = '';
    [['Vi10P', 'V10P ✓', true], ['Yi7P', 'Y7P ✓', true], ['Yi7P', 'LINEAR ✗', false]].forEach(function (r, i) { var x = 8 + i * 118, col = r[2] ? C.teal : C.red;
      s += rect(x + 32, 6, 46, 54, '#1f2933', null, 5) + '<circle cx="' + (x + 55) + '" cy="40" r="13" fill="#475569"/><circle cx="' + (x + 55) + '" cy="18" r="5" fill="#94a3b8"/>';
      s += t(x + 55, 80, r[0], { size: 13, weight: 800 }) + rect(x + 8, 88, 94, 26, r[2] ? '#ecfeff' : '#fef2f2', col, 6) + t(x + 55, 106, r[1], { size: 13.5, weight: 800, fill: col });
    });
    return pic(360, 120, s, '스피커마다 맞는 셋업을 고르기');
  };

  /* 그림 13 (확인 문제): 시스템 체크 — 기준값과 잰 값 */
  V.daZCheck = function () {
    var x0 = 30, x1 = 450, xv = function (z) { return x0 + z / 16 * (x1 - x0); };
    var s = t(240, 20, '10D CH2 (E8 두 대 링크) · 시스템 체크 결과', { size: 14, weight: 800 });
    s += '<path d="M' + x0 + ' 92H' + x1 + '" stroke="' + C.ink + '" stroke-width="2"/>';
    [0, 2, 4, 6, 8, 10, 12, 14, 16].forEach(function (z) { s += '<path d="M' + xv(z) + ' 86V98" stroke="' + C.ink + '" stroke-width="1.5"/>' + t(xv(z), 116, z, { size: 12.5, fill: C.sub }); });
    s += t(x1, 134, 'Ω', { size: 12.5, fill: C.sub, anchor: 'end' });
    s += '<path d="M' + xv(6) + ' 86l-8 -14h16z" fill="' + C.green + '"/>' + t(xv(6), 62, '기준 6 Ω', { size: 13.5, weight: 800, fill: C.green });
    s += '<path d="M' + xv(12) + ' 86l-8 -14h16z" fill="' + C.red + '"/>' + t(xv(12), 62, '잰 값 12 Ω', { size: 13.5, weight: 800, fill: C.red });
    s += '<path d="M' + (xv(6) + 10) + ' 46H' + (xv(12) - 10) + '" stroke="' + C.red + '" stroke-width="1.6" stroke-dasharray="4 3"/>' + t((xv(6) + xv(12)) / 2, 40, '기준의 2배', { size: 12.5, weight: 700, fill: C.red });
    return pic(480, 140, s, '시스템 체크에서 기준값과 잰 임피던스 비교');
  };

  /* =========================================================================== 실습: 앰프 랙 (STASims.dampBench) */
  var THR = -5;                         // 스피커 셋업 리미터 시작점 (교육용 가정, dBFS)
  var C_SOUND = 343;                    // 소리 빠르기 m/s (20 °C 근처)
  var SETUPS = ['LINEAR', 'V10P', 'V-SUB', 'Y10P', 'Y7P', 'E8', 'MAX2'];
  var AMPS = {
    a40: { name: '40D', setups: SETUPS, bootMs: 3500, real: '45초 미만', sheet: { D1: '메인 L', D2: '메인 R', D3: '서브', D4: '천장 가운데' }, src: { D1: -9, D2: -9, D3: -6, D4: -12 } },
    a10: { name: '10D', setups: ['LINEAR', 'Y10P', 'Y7P', 'E8', 'MAX2'], bootMs: 2500, real: '약 17초', sheet: { D1: '천장 좌우', D2: '기둥 좌우', D3: '바닥 모니터 L', D4: '바닥 모니터 R' }, src: { D1: -12, D2: -12, D3: -10, D4: -10 } }
  };
  var CHS = [
    { id: 'a40-1', amp: 'a40', n: 1, name: '메인 L', spk: 'Vi10P', cnt: 1, unit: 8, z: 8, setup: 'V10P', input: 'D1' },
    { id: 'a40-2', amp: 'a40', n: 2, name: '메인 R', spk: 'Vi10P', cnt: 1, unit: 8, z: 8, setup: 'V10P', input: 'D2' },
    { id: 'a40-3', amp: 'a40', n: 3, name: '서브', spk: 'V-SUB', cnt: 2, unit: 8, z: 4, setup: 'V-SUB', input: 'D3' },
    { id: 'a40-4', amp: 'a40', n: 4, name: '천장 가운데', spk: 'Yi10P', cnt: 1, unit: 8, z: 8, setup: 'Y10P', input: 'D4', dist: 8.4 },
    { id: 'a10-1', amp: 'a10', n: 1, name: '천장 좌우', spk: 'Yi7P', cnt: 2, unit: 8, z: 4, setup: 'Y7P', input: 'D1', dist: 9.2 },
    { id: 'a10-2', amp: 'a10', n: 2, name: '기둥 좌우', spk: 'E8', cnt: 2, unit: 12, z: 6, setup: 'E8', input: 'D2', dist: 15.8 },
    { id: 'a10-3', amp: 'a10', n: 3, name: '모니터 L', spk: 'MAX2', cnt: 1, unit: 8, z: 8, setup: 'MAX2', input: 'D3' },
    { id: 'a10-4', amp: 'a10', n: 4, name: '모니터 R', spk: 'MAX2', cnt: 1, unit: 8, z: 8, setup: 'MAX2', input: 'D4' }
  ];
  var FAULT_ID = 'a10-2';               // 실습용 고장: E8 한 대 링크 빠짐 → 12 Ω
  var CAUSES = [['ok', '정상이에요'], ['open', '스피커 일부가 끊겼어요 — 임피던스가 높게 나옴'], ['short', '케이블 선끼리 붙었어요(단락) — 임피던스가 아주 낮게 나옴']];
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
    var S = { cl5: false, rio: false, a40: 'off', a10: 'off', bootAt: { a40: 0, a10: 0 }, order: { a40: false, a10: false }, muteAll: true, msg: '앰프 랙의 모든 장비가 꺼져 있어요. 위 순서대로 켜 보세요.', msgCls: '',
      ch: {}, sel: 'a40-1', play: false, checking: 0, checked: false, mark: null, fixed: false, fb: '', fbCls: '', done: {} };
    CHS.forEach(function (c) { S.ch[c.id] = { input: 'A' + c.n, setup: 'LINEAR', gain: { 'a40-2': 3, 'a40-3': 6, 'a10-2': -15 }[c.id] || 0, delay: 0.3 }; });
    var alive = true, timer = 0;

    el.innerHTML = '<div class="sim-da">' +
      '<div class="sim-da-seq" data-role="seq"></div>' +
      '<div class="sim-da-body">' +
        '<div class="sim-da-main"><div class="sim-da-rack" data-role="rack" aria-label="앰프 랙 (가상): d&amp;b 40D · 10D 앞면"></div>' +
          '<div class="sim-box sim-da-ed" data-role="ed"></div></div>' +
        '<div class="sim-side">' +
          '<div class="sim-box sim-read"><h4>입력 신호 표 <small>Rio → 앰프 (실습용 배정)</small></h4>' + sheetHtml() + '</div>' +
          '<div class="sim-box sim-read" data-role="test"></div>' +
          '<div class="sim-box sim-read" data-role="chk"></div>' +
        '</div>' +
      '</div></div>';
    var q = function (s) { return el.querySelector(s); };

    function sheetHtml() {
      return ['a40', 'a10'].map(function (a) {
        var A = AMPS[a];
        return '<table class="sim-da-tbl" style="margin-bottom:6px"><tr><th colspan="2">' + A.name + ' 입력</th></tr>' +
          ['D1', 'D2', 'D3', 'D4'].map(function (k) { return '<tr><td><b>' + k + '</b> (AES3)</td><td>' + esc(A.sheet[k]) + '</td></tr>'; }).join('') +
          '<tr><td><b>A1–A4</b> (아날로그)</td><td>연결 없음</td></tr></table>';
      }).join('') + '<p class="sim-note">D1/D2 는 AES3 단자 하나, D3/D4 는 다른 단자 하나로 들어와요. 어느 신호를 몇 번에 보내는지는 실습용 예시예요.</p>';
    }

    /* ---------------- 계산 */
    function ampOn(a) { return S[a] === 'on'; }
    function calc(c) {
      var st = S.ch[c.id], on = ampOn(c.amp), dig = st.input.charAt(0) === 'D';
      var sig = dig ? AMPS[c.amp].sheet[st.input] : null;
      var src = on && S.play && dig ? AMPS[c.amp].src[st.input] : null;
      var lvl = src == null ? null : src + st.gain, lim = st.setup !== 'LINEAR', live = lvl != null && !S.muteAll;
      var gr = live && lim ? Math.max(0, lvl - THR) : 0, ovl = live && (lvl > -2 || gr >= 12);
      var hr = lvl != null && lim ? THR - lvl : null;
      var fault = c.id === FAULT_ID && !S.fixed, measured = fault ? c.unit : c.z * (1 + ((c.n * 7 + (c.amp === 'a40' ? 3 : 5)) % 5 - 2) / 100);
      return { st: st, on: on, sig: sig, lvl: lvl, lim: lim, gr: gr, ovl: ovl, hr: hr, isp: lvl != null, grOn: gr >= 3, mute: on && S.muteAll, fault: fault, measured: measured, bad: Math.abs(measured - c.z) / c.z > 0.3 };
    }
    function target(c) { return c.dist ? c.dist / C_SOUND * 1000 : null; }
    function routeOk() { return CHS.every(function (c) { return S.ch[c.id].input === c.input; }); }
    function presetOk() { return CHS.every(function (c) { return S.ch[c.id].setup === c.setup; }); }
    function delayOk() { return CHS.every(function (c) { var d = S.ch[c.id].delay, tg = target(c); return tg == null ? d <= 1.0 : (d >= c.dist / 344 * 1000 - 0.3 && d <= tg + 5); }); }
    function headOk() {
      if (!(ampOn('a40') && ampOn('a10') && S.play && !S.muteAll && routeOk() && presetOk())) return false;
      if (S.ch['a40-1'].gain !== S.ch['a40-2'].gain) return false;
      return CHS.every(function (c) { var k = calc(c); return k.hr != null && k.hr >= 0 && k.hr <= 8 && !k.ovl; });
    }
    function powerOk() { return S.cl5 && S.rio && ampOn('a40') && ampOn('a10') && S.order.a40 && S.order.a10 && !S.muteAll; }
    function checkTasks() {
      if (powerOk()) hit('power');
      if (ampOn('a40') && ampOn('a10') && routeOk()) hit('route');
      if (ampOn('a40') && ampOn('a10') && presetOk()) hit('preset');
      if (ampOn('a40') && ampOn('a10') && delayOk()) hit('delay');
      if (headOk()) hit('headroom');
      if (S.checked && S.mark && S.mark.ch === FAULT_ID && S.mark.cause === 'open') hit('fault');
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }

    /* ---------------- 그리기 */
    function renderSeq() {
      function step(k, label, cls, dis) { return '<button type="button" class="sim-da-step ' + cls + '" data-act="pw" data-k="' + k + '"' + (dis ? ' disabled' : '') + '><i></i><span class="lb">' + label + '</span></button>'; }
      function ampCls(a) { return S[a] === 'on' ? 'on' : S[a] === 'boot' ? 'boot' : ''; }
      var both = ampOn('a40') && ampOn('a10');
      q('[data-role=seq]').innerHTML = '<h4>켜는 순서 <small>버튼을 눌러 켜고 끄기 · 실습에서는 켜지는 시간을 몇 초로 줄였어요(실제 40D 45초 미만 · 10D 약 17초)</small></h4>' +
        step('cl5', '① CL5 콘솔' + (S.cl5 ? ' 켜짐' : ''), S.cl5 ? 'on' : '') + '<span class="sim-da-sep">→</span>' +
        step('rio', '② Rio' + (S.rio ? ' 켜짐' : ''), S.rio ? 'on' : '') + '<span class="sim-da-sep">→</span>' +
        step('a40', ampTxt('a40'), ampCls('a40')) + step('a10', ampTxt('a10'), ampCls('a10')) + '<span class="sim-da-sep">→</span>' +
        step('mute', S.muteAll ? '④ MUTE ALL 켜짐 (누르면 풀기)' : '④ 뮤트 풀림 (누르면 MUTE ALL)', S.muteAll ? 'mute' : 'unmuted', !both && S.muteAll) +
        '<p class="sim-da-msg ' + S.msgCls + '" role="status">' + esc(S.msg) + '</p>';
    }
    function renderRack() {
      q('[data-role=rack]').innerHTML = ['a40', 'a10'].map(function (a) {
        var A = AMPS[a], st = S[a];
        return '<div class="sim-da-amp"><header><b>d&amp;b ' + A.name + '</b><span><i class="sim-da-led g' + (st === 'on' ? ' on' : '') + '"></i> POWER</span><span><i class="sim-da-led y' + (st === 'on' ? ' on' : '') + '"></i> DATA</span>' +
          '<em class="' + (st === 'on' ? 'on' : st === 'boot' ? 'boot' : 'off') + '">' + (st === 'on' ? '켜짐' : st === 'boot' ? '켜는 중' : '꺼짐') + '</em></header><div class="sim-da-chs">' +
          CHS.filter(function (c) { return c.amp === a; }).map(function (c) {
            var k = calc(c), lv = k.lvl == null ? 0 : clamp((k.lvl + 40) / 40, 0, 1) * 100;
            return '<button type="button" class="sim-da-ch' + (S.sel === c.id ? ' sel' : '') + '" data-act="sel" data-ch="' + c.id + '" aria-pressed="' + (S.sel === c.id) + '" aria-label="' + A.name + ' CH' + c.n + ' ' + esc(c.name) + '">' +
              '<span class="n">CH' + c.n + '</span><span class="nm">' + esc(c.name) + '</span>' +
              '<span class="sim-da-tag' + (k.on && k.st.setup === 'LINEAR' ? ' lin' : '') + '">' + esc(k.on ? k.st.setup : '—') + '</span>' +
              '<span class="sim-da-leds"><span><i class="sim-da-led g' + (k.isp ? ' on' : '') + '"></i>ISP</span><span><i class="sim-da-led y' + (k.grOn ? ' on' : '') + '"></i>GR</span>' +
              '<span><i class="sim-da-led r' + (k.ovl ? ' on' : '') + '"></i>OVL</span><span><i class="sim-da-led r' + (k.mute ? ' on' : '') + (k.on && S.checked && k.fault ? ' blink' : '') + '"></i>MUTE</span></span>' +
              '<span class="sim-da-mtr"><i class="' + (k.ovl ? 'ovl' : k.gr > 0 ? 'lim' : '') + '" style="width:' + lv.toFixed(0) + '%"></i></span></button>';
          }).join('') + '</div></div>';
      }).join('');
    }
    function renderEd() {
      var c = chById(S.sel), A = AMPS[c.amp], st = S.ch[c.id], on = ampOn(c.amp), ed = q('[data-role=ed]');
      var load = c.spk + ' × ' + c.cnt + (c.cnt > 1 ? ' (' + c.unit + ' Ω 2대 병렬 = ' + c.z + ' Ω)' : ' (' + c.z + ' Ω)');
      var h = '<h4>채널 설정 — ' + A.name + ' CH' + c.n + ' · ' + esc(c.name) + ' <small>R1 화면을 단순화</small></h4><p class="sim-da-load">연결된 스피커: <b>' + esc(load) + '</b></p>';
      if (!on) { ed.innerHTML = h + '<div class="sim-da-off">' + A.name + ' 가 ' + (S[c.amp] === 'boot' ? '켜지는 중이에요. 잠시 기다려요.' : '꺼져 있어요. 위 「켜는 순서」를 따라 먼저 켜요.') + '</div>'; return; }
      h += '<div class="sim-da-row"><span>입력 <small>— 이 채널이 받을 신호</small></span><div class="sim-da-chips">' + ['A1', 'A2', 'A3', 'A4', 'D1', 'D2', 'D3', 'D4'].map(function (k) { return '<button type="button" class="sim-da-chip" data-act="in" data-v="' + k + '" aria-pressed="' + (st.input === k) + '">' + k + '</button>'; }).join('') + '</div></div>';
      h += '<div class="sim-da-row"><span>스피커 셋업 <small>— ' + A.name + ' 에서 고를 수 있는 것' + (c.amp === 'a10' ? ' (10D 는 V 시리즈 미지원)' : '') + '</small></span><div class="sim-da-chips">' + A.setups.map(function (k) { return '<button type="button" class="sim-da-chip" data-act="setup" data-v="' + k + '" aria-pressed="' + (st.setup === k) + '">' + k + '</button>'; }).join('') + '</div></div>';
      h += '<div class="sim-da-row"><label class="sim-range"><span><b>입력 게인</b> <output data-out="gain"></output></span><input type="range" min="-20" max="6" step="0.5" data-sim="gain" value="' + st.gain + '" aria-label="입력 게인"></label></div>';
      h += '<div class="sim-da-row"><label class="sim-range"><span><b>딜레이</b> <output data-out="delay"></output></span><input type="range" min="0.3" max="60" step="0.1" data-sim="delay" value="' + st.delay + '" aria-label="딜레이 (ms)"></label>' +
        '<div class="sim-da-fine">' + [-1, -0.1, 0.1, 1].map(function (d) { return '<button type="button" class="sim-btn" data-act="dly" data-v="' + d + '">' + (d > 0 ? '+' : '−') + Math.abs(d) + ' ms</button>'; }).join('') + '</div>' +
        '<p class="sim-note">' + (c.dist ? '메인 스피커에서 떨어진 거리(예시): <b>' + f1(c.dist) + ' m</b>. 딜레이(ms) = 거리 ÷ 343 × 1000 이에요. 메인 소리가 먼저 들리게 몇 ms 더 줘도 돼요.' : '이 채널은 딜레이 스피커가 아니에요. 이 실습에서는 가장 작은 값(0.3 ms) 근처로 둬요.') + ' <span data-out="dist"></span></p></div>';
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
      var sig = k.sig ? '이 입력으로 오는 신호: <b>' + esc(k.sig) + '</b>' : '<b>이 입력에는 아무것도 연결되어 있지 않아요</b>';
      var bar = '';
      if (!S.play) bar = '<p class="sim-note">「시험 재생」을 켜면 이 채널의 크기와 리미터 여유(리미터가 일하기 전까지 남은 크기)가 보여요.</p>';
      else if (k.lvl == null) bar = '<p class="sim-note">신호가 없어서 ISP 가 꺼져 있어요.</p>';
      else {
        var X = function (d) { return clamp((d + 40) / 40, 0, 1) * 100; };
        bar = '<div class="sim-da-hrlab"><span>−40 dBFS</span><span>리미터 시작 ' + THR + '</span><span>0</span></div><div class="sim-da-hr"><span class="zone" style="left:' + X(THR - 8).toFixed(1) + '%;width:' + (X(THR) - X(THR - 8)).toFixed(1) + '%"></span><i class="' + (k.ovl ? 'ovl' : k.gr > 0 ? 'lim' : '') + '" style="width:' + X(k.lvl).toFixed(1) + '%"></i><span class="thr" style="left:' + X(THR).toFixed(1) + '%"></span></div>' +
          '<div class="sim-row"><span>가장 큰 순간</span><b class="' + (k.ovl ? 'bad' : k.gr > 0 ? 'warn' : 'ok') + '">' + sg(k.lvl) + ' dBFS</b></div>' +
          '<div class="sim-row"><span>리미터 여유</span><b class="' + (k.hr == null ? 'warn' : k.hr < 0 ? 'bad' : k.hr > 8 ? 'warn' : 'ok') + '">' + (k.hr == null ? '스피커 맞춤 리미터 없음 (LINEAR)' : k.hr < 0 ? '리미터 작동 ' + f1(-k.hr) + ' dB 줄이는 중' : f1(k.hr) + ' dB' + (k.hr > 8 ? ' · 너무 작아요' : '')) + '</b></div>' +
          (S.muteAll ? '<p class="sim-note">MUTE ALL 이 켜져 있어 출력은 나가지 않아요(입력 표시만).</p>' : '');
      }
      lv.innerHTML = '<div class="sim-da-row sim-read"><span>지금 상태</span><p class="sim-da-load">' + sig + '</p>' + bar + '</div>';
    }
    function renderTest() {
      var both = ampOn('a40') && ampOn('a10');
      var rows = '';
      if (S.play && both) rows = '<div class="sim-da-sum">' + CHS.map(function (c) { var k = calc(c), v = k.lvl == null ? ['warn', '신호 없음'] : k.hr == null ? ['warn', 'LINEAR'] : k.ovl ? ['bad', 'OVL'] : k.hr < 0 ? ['bad', 'GR ' + f1(-k.hr) + ' dB'] : k.hr > 8 ? ['warn', '여유 ' + f1(k.hr) + ' · 작음'] : ['ok', '여유 ' + f1(k.hr) + ' dB'];
        return '<div class="sim-row"><span>' + AMPS[c.amp].name + ' CH' + c.n + ' ' + esc(c.name) + ' <small>' + sg(S.ch[c.id].gain) + ' dB</small></span><b class="' + v[0] + '">' + v[1] + '</b></div>'; }).join('') + '</div>' +
        (S.ch['a40-1'].gain !== S.ch['a40-2'].gain ? '<p class="sim-da-fb bad">메인 L · R 입력 게인이 달라요(' + sg(S.ch['a40-1'].gain) + ' / ' + sg(S.ch['a40-2'].gain) + ' dB).</p>' : '');
      q('[data-role=test]').innerHTML = '<h4>시험 재생 <small>찬양 최고 음량 (교육용 신호)</small></h4>' +
        '<button type="button" class="sim-btn sim-play' + (S.play ? ' on' : '') + '" data-act="play"' + (both ? '' : ' disabled') + '>' + (S.play ? '■ 시험 재생 끄기' : '▶ 찬양 최고 음량으로 시험 재생') + '</button>' +
        (both ? '' : '<p class="sim-note">두 앰프가 켜져야 시험할 수 있어요.</p>') + rows +
        '<p class="sim-note">목표: 모든 채널의 리미터 여유 0 ~ 8 dB(초록 칸), GR · OVL 꺼짐, 메인 L · R 게인 같게. 리미터 시작점 −5 dBFS 는 교육용 가정이에요.</p>';
    }
    function renderChk() {
      var both = ampOn('a40') && ampOn('a10'), c = chById(S.sel), h = '<h4>시스템 체크 <small>스피커 임피던스 재기</small></h4>';
      h += '<button type="button" class="sim-btn" data-act="check"' + (both && !S.checking ? '' : ' disabled') + '>' + (S.checking ? '재는 중…' : '시스템 체크 실행') + '</button>';
      if (!both) h += '<p class="sim-note">두 앰프가 켜져야 실행할 수 있어요.</p>';
      if (S.checked && !S.checking) {
        h += '<table class="sim-da-tbl" style="margin-top:6px"><tr><th>채널</th><th>기준</th><th>잰 값</th><th>판정</th></tr>' + CHS.map(function (x) { var k = calc(x);
          return '<tr class="' + (k.bad ? 'bad' : '') + (S.sel === x.id ? ' sel' : '') + '"><td><button type="button" data-act="sel" data-ch="' + x.id + '">' + AMPS[x.amp].name + ' CH' + x.n + '</button></td><td>' + zt(x.z) + ' Ω</td><td>' + f1(k.measured) + ' Ω</td><td>' + (k.bad ? '확인 필요' : '정상') + '</td></tr>'; }).join('') + '</table>';
        h += '<p class="sim-note">잰 값은 교육용 예시예요. 실제 임피던스는 소리 높낮이(주파수)마다 달라요. 그래서 앰프는 스피커 기본값과 비교해 판단해요.</p>';
        h += '<div class="sim-da-row"><span style="font-size:.76rem;font-weight:800">진단 — ' + AMPS[c.amp].name + ' CH' + c.n + ' ' + esc(c.name) + '</span><div class="sim-da-chips">' + CAUSES.map(function (r) { return '<button type="button" class="sim-da-chip wide" data-act="cause" data-v="' + r[0] + '" aria-pressed="' + !!(S.mark && S.mark.ch === c.id && S.mark.cause === r[0]) + '">' + r[1] + '</button>'; }).join('') + '</div></div>';
        if (S.fb) h += '<p class="sim-da-fb ' + S.fbCls + '" role="status">' + S.fb + '</p>';
        if (S.mark && S.mark.ch === FAULT_ID && S.mark.cause === 'open' && !S.fixed) h += '<button type="button" class="sim-btn" data-act="fix">E8 링크 케이블 다시 꽂기</button>';
      }
      q('[data-role=chk]').innerHTML = h;
    }
    function refresh(full) { renderSeq(); renderRack(); if (full) renderEd(); else renderLive(); renderTest(); renderChk(); }

    /* ---------------- 동작 */
    function power(k) {
      var now = performance.now();
      if (k === 'cl5' || k === 'rio') {
        var nm = k === 'cl5' ? 'CL5 콘솔' : 'Rio';
        S[k] = !S[k];
        if (!S[k] && (S.a40 !== 'off' || S.a10 !== 'off') && !S.muteAll) setMsg('앰프가 켜져 있고 뮤트도 풀린 채로 ' + nm + ' 를 껐어요. 이때 「퍽」 소리가 스피커로 나갈 수 있어요. 끌 때는 MUTE → 앰프 → Rio → 콘솔 순서예요.', 'bad');
        else setMsg(nm + (S[k] ? ' 를 켰어요.' : ' 를 껐어요.'), '');
        if (!S[k]) { S.play = false; }
      } else if (k === 'a40' || k === 'a10') {
        var A = AMPS[k];
        if (S[k] === 'off') {
          S[k] = 'boot'; S.bootAt[k] = now; S.order[k] = S.cl5 && S.rio;
          if (!S.order[k]) setMsg(A.name + ' 를 콘솔 · Rio 보다 먼저 켰어요. 나중에 켜는 장비의 잡음이 스피커로 나갈 수 있어요. ' + A.name + ' 를 다시 꺼요. 콘솔 · Rio 를 먼저 켠 뒤 다시 켜 보세요.', 'bad');
          else setMsg(A.name + ' 가 켜지는 중이에요. 실제로는 소리가 나기까지 ' + A.real + ' 걸려요(제조사 자료).', '');
        } else { S[k] = 'off'; S.order[k] = false; S.play = false; setMsg(A.name + ' 를 껐어요.', ''); }
      } else if (k === 'mute') {
        if (S.muteAll) { if (!(ampOn('a40') && ampOn('a10'))) return; S.muteAll = false; setMsg(powerOk() ? '좋아요. 신호원 → 앰프 순서로 켜고, 마지막에 뮤트를 풀었어요.' : '뮤트를 풀었어요. 그런데 켜는 순서가 맞지 않았어요. 위 안내를 확인해 보세요.', powerOk() ? 'ok' : 'bad'); }
        else { S.muteAll = true; setMsg('MUTE ALL 을 켰어요. 끌 때는 이 다음에 앰프를 꺼요.', ''); }
      }
      refresh(true); checkTasks();
    }
    function setMsg(m, cls) { S.msg = m; S.msgCls = cls || ''; }
    function ampTxt(a) { var A = AMPS[a]; if (S[a] === 'boot') { var left = Math.max(0, Math.ceil((A.bootMs - (performance.now() - S.bootAt[a])) / 1000)); return '③ ' + A.name + ' 켜는 중… ' + left; } return '③ ' + A.name + (S[a] === 'on' ? ' 켜짐' : ' 전원'); }
    function bootLabels() { ['a40', 'a10'].forEach(function (a) { var lb = q('[data-role=seq] [data-k=' + a + '] .lb'); if (lb && S[a] === 'boot') lb.textContent = ampTxt(a); }); }   // 켜는 중에는 글자만 바꿔서 버튼을 누르는 중에 다시 그리지 않음
    function tick() {
      if (!alive) return; var now = performance.now(), changed = false, seqOnly = false;
      ['a40', 'a10'].forEach(function (a) { if (S[a] === 'boot') { if (now - S.bootAt[a] >= AMPS[a].bootMs) { S[a] = 'on'; changed = true; if (S.order[a]) setMsg(AMPS[a].name + ' 가 준비됐어요(POWER 초록).' + (ampOn('a40') && ampOn('a10') ? ' 이제 MUTE ALL 을 풀어도 돼요.' : ''), ''); } else seqOnly = true; } });
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
        if (S.sel === FAULT_ID && k.fault) { S.fb = v === 'open' ? '맞아요. 기준은 6 Ω(12 Ω E8 두 대 병렬)인데 12 Ω 이 나왔어요. E8 한 대만 연결된 거예요. 링크 케이블이나 그 스피커를 확인해요.' : v === 'short' ? '단락이면 임피던스가 기준보다 아주 낮게 나와요. 이 채널은 기준보다 높아요.' : '잰 값이 기준의 두 배예요. 정상이 아니에요.'; S.fbCls = v === 'open' ? 'ok' : 'bad'; }
        else { S.fb = v === 'ok' ? '맞아요, 이 채널은 기준값과 거의 같아요. 「확인 필요」 채널을 찾아 보세요.' : '이 채널은 잰 값이 기준값과 거의 같아서 정상이에요. 「확인 필요」 채널을 찾아 보세요.'; S.fbCls = v === 'ok' ? '' : 'bad'; }
      } else if (act === 'fix') { S.fixed = true; S.fb = '케이블을 다시 꽂았어요. 시스템 체크를 다시 실행해 6 Ω 이 나오는지 확인해요.'; S.fbCls = ''; }
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
        return { ready: true, done: Object.keys(S.done), cl5: S.cl5, rio: S.rio, a40: S.a40, a10: S.a10, order: { a40: S.order.a40, a10: S.order.a10 }, muteAll: S.muteAll, play: S.play, checked: S.checked, checking: !!S.checking, mark: S.mark, fixed: S.fixed, sel: S.sel, ch: ch,
          ok: { power: powerOk(), route: routeOk(), preset: presetOk(), delay: delayOk(), headroom: headOk() } };
      },
      set: function (o) {
        o = o || {};
        if (o.sel && chById(o.sel)) S.sel = o.sel;
        if (o.ch) Object.keys(o.ch).forEach(function (id) { var st = S.ch[id], v = o.ch[id]; if (!st || !v) return; if (v.input) st.input = v.input; if (v.setup && SETUPS.indexOf(v.setup) >= 0) st.setup = v.setup; if (v.gain != null) st.gain = clamp(+v.gain, -20, 6); if (v.delay != null) st.delay = clamp(+v.delay, 0.3, 60); });
        if (o.play != null) S.play = !!o.play;
        refresh(true); checkTasks(); return this.state();
      },
      model: { CHS: CHS, AMPS: AMPS, THR: THR, C: C_SOUND }
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
    id: 'amp-digital', path: 'hardware', no: 4, noLabel: '04-2', status: 'ready', level: '중급', minutes: 45, img: 'img/modules/hw_amp.jpg',
    title: '디지털 앰프', sub: 'DSP(앰프 안의 작은 컴퓨터) · 디지털 입력 · 원격 제어가 들어 있는 설치용 앰프 — d&b 40D · 10D',
    topics: ['Class D · PWM', '효율 · 열 · 전원부(SMPS · PFC)', '스피커 셋업 · DSP', 'AES3 입력 · R1 원격 제어', '4채널 배정', '켜는 순서 · 스피커 연결 검사'],
    glanceDraft: {
      glance: [
        ['디지털 앰프', '흔히 Class D 앰프를 부르는 말 · 앰프 안에 DSP · 디지털 입력 · 네트워크 제어가 들어 있는 경우가 많아요'],
        ['Class D', '출력 소자를 아주 빠르게 켜고 끄며 키우는 방식 · 열이 적어 작고 가벼워요 (D ≠ Digital)'],
        ['스피커 셋업 (프리셋)', '스피커 모델에 맞춘 필터와 보호(리미터) 묶음 · 채널마다 그 스피커 것을 골라요'],
        ['시스템 체크', '앰프가 스피커 임피던스를 재서 끊긴 스피커나 고장을 찾아 주는 기능']
      ],
      heroVis: 'daChurch'
    },
    overview: {
      lead: '앰프의 기본인 임피던스 · 정격 · 클리핑은 04-1 에서 배웠어요. 이 기본은 디지털 앰프에도 그대로 통해요. 이번에는 3층 본당에 있는 <b>d&b 40D · 10D</b> 로 요즘 설치용 앰프를 배워요. 이 앰프들은 네 가지가 새로워요. 첫째, 소리를 키우는 부분이 열이 적은 <b>Class D</b> 방식이에요. 둘째, 앰프 안의 작은 컴퓨터(<b>DSP</b>)가 스피커마다 맞는 <b>스피커 셋업</b>과 딜레이를 맡아요. 셋째, 소리 신호를 Rio 에서 <b>AES3 디지털</b>로 받아요. 넷째, 설정과 상태를 컴퓨터 프로그램 <b>R1</b> 으로 네트워크를 통해 봐요. 한 대에 <b>4채널</b>이라서, 앰프 두 대로 3층 스피커 여덟 묶음을 따로따로 움직여요.',
      terms: [
        ['Class D (스위칭) 앰프', '출력 부품을 아주 빠르게 켰다 껐다 해서 소리를 키우는 앰프예요. 「D」는 디지털(Digital)의 줄임말이 아니에요. A · B · AB 처럼 방식에 붙인 이름일 뿐이에요.'],
        ['PWM 과 출력 필터', 'PWM(펄스 폭 변조)은 소리가 클수록 「켜짐」을 길게 만드는 빠른 신호예요. 출력 필터(코일 · 콘덴서)가 이 신호를 다시 매끈한 소리 파형으로 바꿔요.'],
        ['SMPS · PFC', 'SMPS(스위칭 전원)는 전기를 아주 빠르게 켰다 껐다 하는 전원부예요. 그래서 변압기가 작고 가벼워요. PFC(역률 보정)는 콘센트에서 전기를 고르게 끌어 쓰게 해 줘요.'],
        ['DSP', '앰프 안에서 소리를 숫자로 바꿔 다루는 작은 컴퓨터예요. EQ(음색 조절) · 딜레이(늦추기) · 필터 · 리미터(크기 제한)가 여기서 동작해요.'],
        ['스피커 셋업 (프리셋)', '스피커 모델마다 맞춘 소리 설정과 보호 장치(리미터)를 묶은 것이에요. d&b 는 「V10P」「Y7P」처럼 스피커 이름으로 골라요. 다른 회사는 흔히 「프리셋」이라고 불러요.', 'daTermSetup'],
        ['AES3 (AES/EBU)', '케이블 하나로 디지털 소리 2채널을 보내는 약속(규격)이에요. 40D · 10D 는 AES3 단자 2개로 4채널을 받아요.'],
        ['R1 · OCA/AES70', 'R1 은 d&b 앰프를 랜선(Ethernet)으로 조절하고 상태를 보는 컴퓨터 프로그램이에요. 앰프와는 OCA/AES70 이라는 약속된 방식으로 신호를 주고받아요.'],
        ['부하 모니터링 · 시스템 체크', '앰프가 스피커 쪽 임피던스(전기를 막는 정도)를 재는 기능이에요. 끊긴 케이블이나 고장 난 드라이버를 찾아 알려 줘요.']
      ],
      points: [
        '채널마다 <b>연결된 스피커에 맞는 셋업</b>을 골라야 해요. 다른 셋업이나 LINEAR 로 두면 소리도 틀어지고, 스피커 보호(리미터)도 맞지 않아요. 셋업 · EQ · 딜레이는 <b>담당자만</b> 바꾸고, 바꾸기 전에 지금 설정을 저장해 둬요.',
        '켜는 순서는 아날로그 앰프와 같아요. <b>콘솔 → Rio → 앰프</b> 순서로 켜고, 끌 때는 거꾸로 앰프를 먼저 꺼요. d&b 앰프는 켜고 나서 소리가 나기까지 시간이 걸려요(40D 45초 미만, 10D 약 17초).',
        '<b>GR(노란 불)</b>이 자주 켜지면 리미터가 소리를 줄이고 있다는 뜻이에요. 그때는 콘솔에서 그 출력을 내려요. 앰프 게인이나 셋업을 바꿔서 더 크게 만들지 않아요.'
      ],
      model: 'dbamp'   // 2026-11-04: 40D · 10D 3D
    },
    theory: [
      { title: '「디지털 앰프」는 무엇일까 — Class D 와 PWM', visual: 'daPwm',
        pics: [{ v: 'daPwmMake', cap: '소리 신호를 아주 빠른 삼각파와 견줘요. 소리가 더 높은 동안만 출력 부품이 켜져요. 그래서 소리가 클수록 「켜짐」이 길어져요.' }],
        body: '현장에서 「디지털 앰프」라고 부르는 앰프는 대부분 <b>Class D</b> 앰프예요. Class D 앰프는 소리 신호를 아주 빠른 펄스(켜짐 · 꺼짐 신호)로 바꿔요. 소리가 클수록 「켜짐」 시간이 길어져요. 이것을 <b>PWM</b>(펄스 폭 변조)이라고 해요. 전등 스위치를 아주 빠르게 켰다 껐다 하면, 켜 둔 시간이 길수록 더 밝아 보이는 것과 비슷해요. 출력 부품(출력 소자)은 이 펄스에 맞춰 완전히 켜지거나 꺼지기만 해요. 마지막에 코일과 콘덴서로 된 <b>출력 필터</b>가 펄스를 다시 매끈한 소리 파형으로 만들어요. 체로 거르듯 빠른 떨림을 걸러 내는 거예요. 그 소리가 스피커로 가요. 그런데 Class D 의 「D」는 디지털(Digital)의 줄임말이 아니에요. A · B · AB 처럼 출력 방식에 붙인 이름일 뿐이에요. 설치용 앰프를 「디지털」이라고 부르는 진짜 이유는 따로 있어요. 앰프 안의 <b>DSP</b>(작은 컴퓨터), <b>디지털 입력</b>, <b>네트워크 제어</b>가 그 이유예요.',
        more: '<ul><li><b>PWM (Analog Devices 기술 자료)</b>: 켜짐 시간(펄스 폭, 듀티)이 소리 크기에 맞춰 바뀌어요. 출력단은 + 전원과 − 전원 사이를 빠르게 오가며(스위칭) 펄스를 줄줄이 만들어요.</li> <li><b>출력 필터</b>: 보통 코일과 콘덴서로 만들어요. 같은 자료에 따르면, 일부러 전기를 써 버리는 부품은 스피커뿐이에요.</li> <li><b>「D」 ≠ Digital</b>: 오디오 잡지 Stereophile 은 「Class D 의 D 는 디지털의 줄임말이 아니다」라고 했어요.</li> <li>앰프 설계자 Bruno Putzeys 는 「스피커 콘을 코드(숫자)로 움직일 수는 없다」고 말해요. 스피커로 가는 것은 결국 전압이에요.</li> <li><b>PWM 을 만드는 법 (교재 6장)</b>: 소리 신호를 아주 빠른 삼각파와 견줘요(비교기). 소리가 삼각파보다 높은 동안만 「켜짐」이 돼요.</li> <li>디지털 신호를 바로 받는 Class D 칩도 있어요. 이런 칩은 디지털을 아날로그로 바꾸는 기능(DAC)을 안에 품고 있어요(Analog Devices).</li> <li><b>d&b 40D · 10D</b>: 제조사 자료에 Class D 4채널 앰프로 적혀 있어요.</li> <li>「Class D 라서 소리가 좋다 · 나쁘다」는 정해져 있지 않아요. 같은 방식이라도 설계에 따라 달라요.</li></ul>',
        check: { q: 'Class D 앰프의 「D」에 대한 설명으로 맞는 것은?', options: [
          { t: '디지털(Digital)의 줄임말이라서, 스피커로 숫자 신호를 보내요', why: '아니에요. 「D」는 디지털의 줄임말이 아니에요. 스피커로 가는 것은 출력 필터를 지난 전압이에요.' },
          { t: '출력 방식의 이름이고, 출력 부품을 켜고 끄는(스위칭) 방식이에요', ok: true, why: '맞아요. A · B · AB 처럼 출력 방식에 붙인 이름이에요. PWM 으로 켜고 끈 뒤, 출력 필터가 파형을 되살려요.' },
          { t: '디지털 입력(AES3)만 받을 수 있는 앰프예요', why: '아니에요. Class D 는 출력 방식의 이름이라 입력 종류와 상관없어요. 40D · 10D 에도 아날로그 입력이 있어요.' }] } },
      { title: '효율 · 열 · 무게 — Class AB 와 비교, 스위칭 전원', visual: 'daEff',
        pics: [{ v: 'daTap', cap: '비유예요. 반쯤 연 꼭지는 물살을 막으면서 일해서, 막힌 만큼 힘이 열로 바뀌어요. 다 열거나 다 잠그면 막히는 때가 거의 없어서 열이 적어요.' }],
        body: 'Class A · B · AB 앰프는 출력 부품이 반쯤 켜진 상태로 일해요. 반쯤 열린 수도꼭지가 물살을 막듯 전기를 막으면서 일해서, 막힌 만큼 열이 나요. Class D 는 「완전히 켜짐」과 「완전히 꺼짐」만 오가요. 그래서 버리는 열이 훨씬 적어요. 여기서 효율은 쓴 전기 중 스피커로 보낸 힘의 비율이에요. Analog Devices 기술 자료에 따르면, 가장 크게 틀 때(클리핑 직전) 효율은 이래요. Class B 는 이론상 78.5%, Class D 는 90% 정도예요. 작게 틀 때는 차이가 더 커요. 10 W 앰프로 1 W 를 낼 때 Class B 는 28%, Class D 는 78% 예요. 열이 적으면 큰 방열판(열을 식히는 쇠붙이)이 필요 없어요. 그래서 앰프가 작고 가벼워져요. 전원부도 큰 변압기 대신 <b>스위칭 전원(SMPS)</b>을 써서 더 가벼워요. 40D · 10D 의 SMPS 에는 전기를 고르게 끌어 쓰게 하는 <b>PFC(역률 보정)</b>도 들어 있어요.',
        more: '<ul><li>여기서 <b>효율</b>은 스피커로 보낸 출력의 비율이에요. 소리로 바뀌는 비율이 아니에요.</li> <li>Class AB 의 손실(버리는 전기)은 대체로 Class B 에 가까워요(Analog Devices).</li> <li>100 W 를 낼 때 버리는 열을 이론 효율로 계산해 봤어요(교육용 계산). Class B 는 약 27 W, Class D 는 약 11 W 예요.</li> <li><b>SMPS</b>: 아주 빠르게(높은 주파수로) 켰다 껐다 해서, 훨씬 작고 가벼운 변압기를 써요(RS DesignSpark).</li> <li><b>PFC</b>: 전류가 전압을 더 잘 따라가게 해요. 그래서 건물 전기 설비의 부담이 줄어요(Powersoft 기술 소개).</li> <li><b>그래도 열은 나요 (교재 15장)</b>: 앰프는 팬으로 열을 식혀서 조금 시끄러워요. 앰프 랙 · 앰프실은 바람이 잘 통하게 하고, 팬 소리가 무대 쪽으로 가지 않게 해요.</li> <li><b>d&b 40D (제조사 자료)</b>: 높이 2U(랙 2칸) · 무게 13.3 kg 이에요. 보통 소비 전력은 대기 21 W, 신호 없을 때 130 W 예요.</li> <li><b>40D 출력</b>: 4 × 2400 W/4Ω · 4 × 2000 W/8Ω (EIA-426B 신호, 크레스트 팩터 12 dB, 모든 채널 동시).</li> <li><b>d&b 10D (제조사 자료)</b>: 2U · 10.6 kg 이고, 100–240 V 전기에서 동작해요.</li> <li><b>10D 출력</b>: 4 × 700 W/4Ω · 4 × 350 W/8Ω (크레스트 팩터 6 dB, 모든 채널 동시).</li> <li><b>크레스트 팩터</b>: 신호의 가장 큰 순간이 평균보다 얼마나 큰지를 dB 로 적은 값이에요. 재는 신호가 다르면 W 숫자도 달라져요.</li> <li><b>숫자 비교 주의</b>: 40D 를 1 kHz 사인파로 오래(+40 °C) 재면 250 W/4Ω 이에요. 1 kHz 는 1초에 천 번 떨리는 소리예요.</li> <li>이렇게 같은 앰프도 재는 신호에 따라 W 숫자가 크게 달라요. 그래서 04-1 의 Crown XLi1500 숫자와 바로 비교하면 안 돼요.</li></ul>',
        check: { q: 'Class D 앰프를 같은 출력의 Class AB 앰프보다 가볍게 만들 수 있는 가장 큰 이유는?', options: [
          { t: '열로 버리는 전기가 적어 방열판이 작아도 되고, 전원부도 작은 스위칭 전원을 쓸 수 있어서', ok: true, why: '맞아요. 효율이 높아 열이 적어요. 그리고 SMPS 는 변압기가 작고 가벼워요.' },
          { t: '실제로는 출력이 훨씬 작아서', why: '아니에요. 40D 는 2U 크기에 4채널 × 2400 W/4Ω(CF 12 dB 신호) 정격이에요. 출력이 작아서가 아니에요.' },
          { t: '스피커 케이블이 필요 없어서', why: '아니에요. 디지털 앰프도 스피커까지는 스피커 케이블로 이어요.' }] } },
      { title: '앰프 안의 DSP — 스피커 셋업 · EQ · 딜레이 · 리미터', visual: 'daDsp',
        body: '40D · 10D 같은 설치용 앰프에는 <b>DSP</b>(소리를 숫자로 다루는 작은 컴퓨터)가 들어 있어요. 채널마다 연결된 스피커에 맞는 <b>스피커 셋업</b>을 골라요. 그러면 제조사가 그 스피커에 맞춰 만든 필터와 보호 장치(리미터)가 함께 걸려요. 스피커마다 몸에 맞는 옷을 골라 입히는 것과 비슷해요. d&b 는 셋업을 스피커 이름으로 불러요. 예를 들어 Vi10P 는 「V10P」, Yi7P 는 「Y7P」 셋업을 써요. 다른 회사 앰프에서는 보통 「프리셋」이라고 해요. 그 위에 사람이 조절하는 <b>EQ</b>(음색 조절)와 <b>딜레이</b>(소리 늦추기)가 있어요. EQ 는 채널마다 16밴드짜리가 2개 있어요. 딜레이는 0.3 ms ~ 10 s 까지 넣을 수 있어요. ms 는 1000분의 1초예요. 셋업에는 스위치도 있어요. <b>CUT</b> 은 서브우퍼와 함께 쓸 때 저음을 줄여요. <b>HFA</b> 는 가까운 자리나 딜레이 스피커에서 고음을 줄여요. <b>CPL</b> 은 벽 · 천장 가까이에서 커지는 저음을 바로잡아요.',
        more: '<ul><li><b>d&b 자료 (Yi7P/Yi10P 설명서)</b>: 「d&b 스피커는 바르게 설정된 d&b 앰프로만 쓰라」고 안내해요.</li> <li><b>셋업 이름</b>: Vi10P → V10P, Yi10P → Y10P, Yi7P → Y7P 예요. V-SUB · E8 · MAX2 는 스피커 이름 그대로예요.</li> <li><b>스피커 프로세서가 앰프 안에 (교재 16장)</b>: 스피커로 가는 소리를 다듬는 기계를 스피커 프로세서라고 해요. 따로 된 기계도 있지만, 40D · 10D 처럼 앰프 안에 들어 있기도 해요.</li> <li>프로세서의 <b>입력부</b>(게인 · EQ · 딜레이)는 스피커 전체나 시스템을 맞춰요. <b>출력부</b>(크로스오버 · EQ · 딜레이 · 리미터)는 드라이버 하나하나를 맞추고 지켜요.</li> <li>40D · 10D 에서는 사람이 만지는 EQ · 딜레이가 입력부, 스피커 셋업이 출력부에 가까워요.</li> <li><b>LINEAR</b>: 스피커 맞춤 처리 없이 앰프를 보통 파워앰프처럼 쓰는 설정이에요. d&b 스피커를 연결한 채널에는 쓰지 않아요.</li> <li><b>GR 표시등</b>: 셋업의 리미터가 소리를 3 dB 이상 줄이면 GR(노란 불)이 켜져요. 3 dB 는 귀로 알아챌 만큼 조금 작아진 정도예요.</li> <li><b>OVL 표시등 (10D 설명서)</b>: 12 dB 이상 줄이거나 −2 dBFS 를 넘으면 OVL(빨간 불)이 켜져요. dBFS 는 디지털 눈금이라 0 이 맨 꼭대기예요.</li> <li><b>어느 앰프에서 쓸 수 있나</b>: 10D 는 V 시리즈를 지원하지 않아요(제조사 페이지). 그래서 메인 Vi10P 와 서브 V-SUB 는 40D 가 맡아요.</li> <li>Yi7P · Yi10P · E8 · MAX2 는 10D 와 40D 모두 지원해요.</li> <li><b>채널당 대수 (d&b 자료)</b>: Vi10P · Yi7P · Yi10P · V-SUB · MAX2 는 2대까지예요. E8 은 3대까지예요.</li> <li><b>AmpPreset</b>: 앰프 설정 전체를 저장해 두고 불러오는 기능이에요. GPIO(바깥 스위치 단자)로 바꿀 수도 있어요.</li> <li>셋업 · EQ 를 바꾸기 전에는 지금 설정을 꼭 저장해 둬요. 그래야 잘못돼도 되돌릴 수 있어요.</li></ul>',
        check: { q: '천장 딜레이 Yi7P 채널을 셋업 Y7P 대신 LINEAR 로 두면 어떤 문제가 생길까요?', options: [
          { t: '그 스피커에 맞춘 필터와 보호(리미터)가 걸리지 않아요', ok: true, why: '맞아요. 소리가 그 스피커에 맞지 않아요. 스피커를 지켜 주는 리미터도 맞춰지지 않아요.' },
          { t: '소리가 아예 나지 않아요', why: '아니에요. LINEAR 에서도 소리는 나요. 다만 그 스피커에 맞춘 처리와 보호가 없어요.' },
          { t: '딜레이가 저절로 거리에 맞춰져요', why: '아니에요. 딜레이는 셋업과 따로, 사람이 채널마다 넣어요.' }] } },
      { title: '입력과 네트워크 — 아날로그 · AES3 · R1 원격 제어', visual: 'daNet',
        pics: [{ v: 'daGainCeiling', cap: '입력 게인을 올리면 같은 신호가 더 크게 나와요. 하지만 앰프가 낼 수 있는 가장 큰 힘(천장)은 그대로예요. 천장을 넘는 만큼은 리미터가 눌러요.' }],
        body: '40D · 10D 는 두 종류의 입력을 받아요. <b>아날로그 입력</b>이 4개(A1–A4) 있어요. <b>AES3 디지털 입력</b>도 4채널(D1–D4) 있어요. AES3 는 단자가 2개이고, 단자 하나에 2채널씩 들어와요. 이 입력들은 어느 출력 채널로든 보낼 수 있어요. 3층에서는 CL5 콘솔이 Dante(랜선으로 소리를 보내는 방식)로 Rio 스테이지박스와 이어져 있어요. 앰프는 Rio 의 <b>AES/EBU 출력</b>을 받아요. 두 앰프의 데이터시트(제품 설명표)에는 Dante 입력이 없어요. 그래서 Rio 가 소리를 AES3 로 바꿔 보내 주는 셈이에요. 통역사가 말을 바꿔 전해 주는 것과 비슷해요. 앰프 설정과 상태는 컴퓨터 프로그램 <b>d&b R1</b> 으로 보고 바꿔요. 컴퓨터와 앰프는 랜선(Ethernet)으로 이어져 있어요.',
        more: '<ul><li><b>AES3 입력 (제조사 자료)</b>: 트랜스 밸런스 110 Ω 이에요.</li> <li>40D 는 44.1 · 48 · 96 · 192 kHz 를 받아요. 이 숫자는 1초에 소리를 몇 번 재는지(샘플레이트)예요.</li> <li>10D 는 디지털 입력 쌍마다 샘플레이트 변환기가 따로 있어요. 재는 빠르기가 다른 신호도 맞춰 받을 수 있다는 뜻이에요.</li> <li><b>입력 게인</b>: 10D 는 입력마다 −57.5 ~ +6 dB 를 0.5 dB 단위로 맞춰요. 공장에서 나올 때 값은 0 dB 예요.</li> <li><b>입력 감도 (교재 6장)</b>: 앰프가 가장 큰 힘을 내는 데 필요한 입력 크기예요. 예를 들어 「1.4 V」면 1.4 V 가 들어올 때 가장 큰 힘이 나요.</li> <li>게인(감도)을 바꾸면 같은 입력에서 나오는 크기만 바뀌어요. 앰프가 낼 수 있는 가장 큰 힘은 그대로예요.</li> <li><b>Milan</b>: 최신 40D 데이터시트(1.6)에는 Milan(AVB) 네트워크 입력 8채널(M1–M8)도 있어요.</li> <li>3층 설치 자료에서는 앰프가 Rio 의 AES/EBU 출력을 받아요.</li> <li><b>R1 (제조사 자료)</b>: Windows · macOS 에서 동작해요. 앰프 상태와 오류를 읽어요.</li> <li>R1 은 여러 앰프를 묶어서 전원 · MUTE · 레벨 · EQ · 딜레이를 한 번에 조절해요. 앰프 없이 미리 준비하는 오프라인 모드도 있어요.</li> <li>40D 는 R1 으로 설정해요.</li> <li><b>10D 웹 화면</b>: 10D 는 앰프 안의 웹 화면을 브라우저로 열 수 있어요. 그래서 태블릿 · 휴대폰으로도 조절할 수 있어요.</li> <li>Rio3224-D2 의 AES/EBU 출력은 8채널이에요(Yamaha 자료).</li> <li>3층 Rio 의 어느 AES 출력이 어느 앰프 입력으로 가는지는 아직 확인하지 못했어요.</li></ul>',
        check: { q: '3층 40D · 10D 가 받는 소리 신호는 어디서 올까요? (교회 설치 자료 기준)', options: [
          { t: 'Rio 스테이지박스의 AES/EBU(AES3) 디지털 출력', ok: true, why: '맞아요. CL5 → Dante → Rio → AES/EBU → 앰프 순서예요.' },
          { t: 'CL5 콘솔에서 Dante 랜선으로 앰프에 바로', why: '아니에요. 두 앰프에는 Dante 입력이 없어요. Rio 를 거쳐 AES3 로 받아요.' },
          { t: '콘솔 뒷면의 아날로그 XLR 출력', why: '아니에요. 앰프에 아날로그 입력도 있지만, 3층에서는 Rio 의 AES/EBU 출력을 받아요.' }] } },
      { title: '4채널 설계 — 3층 40D · 10D 채널 배정', visual: 'daChurch',
        pics: [{ v: 'daImpPower', cap: '스피커를 병렬로 이어 Ω 이 반이 되면 앰프 출력이 늘어요. 이론은 2배지만 실제로 얼마나 느는지는 앰프마다 달라요(숫자는 제조사 자료).' }],
        body: '40D · 10D 는 한 대에 <b>4채널</b>이에요. 앰프 한 대(높이 2U)로 스피커 네 묶음을 따로따로 움직여요. 채널마다 셋업 · EQ · 딜레이를 다르게 줄 수 있어요. 3층에서는 출력이 큰 <b>40D</b> 가 네 곳을 맡아요. 메인 L · R(Vi10P), 서브(V-SUB 2대), 천장 가운데(Yi10P)예요. <b>10D</b> 도 네 곳을 맡아요. 천장 좌우(Yi7P 2대), 기둥(E8 2대), 바닥 모니터 L · R(MAX2)이에요. 한 채널에 같은 스피커 두 대를 이으면(링크) <b>병렬</b>(나란히 잇기)이 돼요. 그러면 임피던스(전기를 막는 정도)가 반으로 줄어요. 물 호스를 하나 더 나란히 달면 물이 더 잘 흐르는 것과 같아요. 8 Ω 두 대는 4 Ω, 12 Ω 인 E8 두 대는 6 Ω 이에요.',
        more: '<ul><li><b>40D (제조사 자료)</b>: 채널마다 2000 W/8Ω · 2400 W/4Ω 이에요(EIA-426B, CF 12 dB, 모든 채널 동시).</li> <li>40D 출력 한계는 180 V 피크 · 35 A 피크예요.</li> <li><b>10D (제조사 자료)</b>: 채널마다 350 W/8Ω · 700 W/4Ω 이에요(CF 6 dB, 모든 채널 동시).</li> <li>두 앰프는 재는 조건이 달라서 숫자를 바로 비교하지 않아요.</li> <li><b>Ω 이 반이 되면 (교재 6장)</b>: 이론으로는 출력이 2배가 돼요. 실제로는 덜 늘기도 해요(교재: 보통 약 1.5배). 40D 는 2000 → 2400 W, 10D 는 350 → 700 W 예요.</li> <li>병렬로 너무 많이 이어 Ω 이 앰프의 최소 부하보다 낮아지면, 앰프가 뜨거워져 망가질 위험이 커져요(교재).</li> <li><b>출력 모드 Dual Channel</b>: 채널마다 따로 TOP(서브가 아닌 스피커)이나 SUB(서브우퍼)를 맡겨요.</li> <li><b>출력 모드 Mix TOP/SUB</b>: A 에 TOP, B 에 SUB 를 보내요. 4심 케이블 하나로 둘을 함께 보내요.</li> <li>모드를 바꾸면 그 채널들이 뮤트(소리 꺼짐)돼요(10D 설명서).</li> <li><b>최소 부하</b>: 10D/30D 설명서는 채널당 4 Ω 이상을 권해요.</li> <li><b>스피커 단자</b>: 4핀 Euroblock 2개(A/B, C/D)예요. 04-1 의 speakON 과 달리 나사로 조이는 블록 단자예요.</li> <li><b>이 배정은 교회 설치 자료 기준</b>이에요. 실제로 배선을 바꾸거나 점검할 때는 방송실 자료와 담당자를 따라요.</li> <li>스피커 기종은 설치 자료의 Yi7P · Yi10P 표기를 따랐어요. Y7P · Y10P 의 설치형이에요.</li></ul>',
        check: { q: '10D CH2 에 12 Ω 인 E8 두 대를 링크로 이었어요. 앰프가 보는 임피던스는?', options: [
          { t: '6 Ω', ok: true, why: '맞아요. 같은 스피커 두 대를 병렬로 이으면 12 ÷ 2 = 6 Ω 이에요.' },
          { t: '24 Ω', why: '아니에요. 24 Ω 은 두 대를 직렬(줄줄이)로 이었을 때예요. 링크는 병렬이에요.' },
          { t: '12 Ω', why: '아니에요. 12 Ω 은 한 대만 연결됐을 때예요. 두 대를 병렬로 이으면 낮아져요.' }] } },
      { title: '전원 · 대기 · 감시 — 켜는 순서, 표시등, 부하 모니터링', visual: 'daPower',
        pics: [{ v: 'daPopOX', cap: '장비를 켤 때 나는 「퍽」 잡음을 앰프가 키우면 스피커가 다칠 수 있어요. 그래서 앰프는 맨 마지막에 켜고, 끌 때는 맨 먼저 꺼요.' }],
        body: '디지털 앰프도 켜는 순서는 같아요. <b>콘솔 → Rio → 앰프</b> 순서로 켜요. 끌 때는 거꾸로 앰프를 먼저 꺼요. 그래야 다른 장비를 켜고 끌 때 나는 「퍽」 소리가 스피커로 나가지 않아요. d&b 앰프는 켜고 나서 소리가 나기까지 시간이 걸려요. 제조사 자료에 따르면 40D 는 45초 미만, 10D 는 약 17초예요. 앞면 표시등으로 채널 상태를 봐요. 신호등처럼 색마다 뜻이 있어요. <b>ISP</b>(초록)는 입력 신호가 들어온다는 뜻이에요. <b>GR</b>(노랑)은 리미터가 소리를 3 dB 이상 줄이는 중이라는 뜻이에요. <b>OVL</b>(빨강)은 과부하(신호가 너무 큼)예요. <b>MUTE</b>(빨강)는 뮤트(소리 꺼짐)예요. MUTE 가 깜빡이면 이상이 생긴 거예요. 앰프에는 스피커 임피던스를 재는 기능(<b>시스템 체크 · 부하 모니터링</b>)도 있어요. 이 기능으로 끊긴 스피커나 고장 난 드라이버를 찾아 줘요.',
        more: '<ul><li><b>POWER</b>(초록): 켜지면 계속 켜져 있어요. 깜빡이면 대기(Standby)예요.</li> <li><b>DATA</b>(노랑): 네트워크에 연결되면 켜지고, 통신 중에는 깜빡여요(10D 설명서).</li> <li><b>뒷면 전원 스위치</b>: OFF 로 두어도 전기가 완전히 끊기지는 않아요. 앰프 안쪽 전원만 꺼진 상태예요(10D 설명서).</li> <li>그래서 정비할 때는 전원 플러그를 뽑아요. powerCON 커넥터는 전기가 흐를 때 꽂거나 빼지 않아요.</li> <li><b>대기(Standby)</b>: 전기를 덜 쓰지만 네트워크는 살아 있어요. 40D 는 대기 상태에서 4초 안에 소리가 나요(제조사 자료).</li> <li><b>OVL 이 켜지는 때</b>: 신호가 −2 dBFS 를 넘거나, 리미터가 12 dB 이상 줄일 때예요. 출력 전류 제한이나 내부 필터 이상 때도 켜져요.</li> <li><b>시스템 체크</b>: 스피커 임피던스를 재서 그 스피커의 기본값과 비교해요.</li> <li>통 안에 패시브 크로스오버(소리를 나누는 부품)가 든 스피커도 있어요. 이런 스피커도 저음 · 고음 드라이버를 따로 확인해요(제조사 자료).</li> <li>시스템 체크는 예배 직전이 아니라 시간 여유가 있을 때 해요.</li> <li><b>순차 전원 분배기 (교재 9장)</b>: 큰 시스템에서는 이 기계가 정해진 순서대로 하나씩 켜 줘요. 끌 때는 거꾸로 꺼요.</li> <li>교재의 켜는 순서는 네 단계예요. ① 소리를 내는 장비(컴퓨터 · 무선 수신기 · 전자 악기) ② 콘솔 · 효과기 ③ 스피커 프로세서 ④ 파워앰프 순서예요.</li> <li><b>교회 운영 절차 예시</b>: 끌 때 R1 에서 MUTE 를 걸고 앰프를 꺼요.</li> <li>그러면 다음에 켤 때 앰프가 준비된 뒤 뮤트를 풀고, 작은 소리로 확인할 수 있어요.</li></ul>',
        check: { q: '찬양 중 10D CH1(천장 좌우)의 GR(노랑)이 자주 켜져요. 알맞은 조치는?', options: [
          { t: '그 스피커로 가는 콘솔 출력을 조금 줄여요. 계속되면 담당자와 시스템 설정을 점검해요', ok: true, why: '맞아요. GR 은 리미터가 3 dB 이상 줄이는 중이라는 뜻이에요. 들어가는 신호를 줄이는 것이 먼저예요.' },
          { t: '앰프 입력 게인을 올려요', why: '아니에요. 게인을 올리면 리미터가 더 세게 일해요.' },
          { t: '셋업을 LINEAR 로 바꿔 리미터를 없애요', why: '아니에요. 스피커 보호가 사라져 스피커가 망가질 수 있어요.' }] } }
    ],
    practice: {
      kind: 'dampBench',
      lead: '3층 앰프 랙의 d&b 40D · 10D 를 단순하게 만든 가상 화면이에요. 이 화면은 R1 프로그램을 흉내 냈어요. 이렇게 해 봐요. ① 위 「켜는 순서」 버튼으로 장비를 켜요. ② 앰프 앞면의 채널(CH)을 눌러 골라요. ③ 아래 「채널 설정」에서 입력 · 스피커 셋업 · 입력 게인 · 딜레이를 바꿔요. ④ 「시험 재생」 · 「시스템 체크」 상자에서 소리 크기와 스피커 연결을 확인해요. 과제는 위에서부터 차례로 하면 쉬워요.',
      note: '40D · 10D 의 채널 수 · 입력 종류 · 셋업 이름 · 지원 스피커는 d&b 제조사 자료예요. 표시등 뜻과 스피커 공칭 임피던스(대표 Ω 값)도 제조사 자료예요. 채널별 스피커 배정은 교회 설치 자료 기준이에요. Rio AES 출력 → 앰프 입력 번호와 스피커까지 거리는 교육용 예시예요. 시험 신호 크기, 리미터 시작점(−5 dBFS), 잰 임피던스도 교육용 예시예요. 켜지는 시간은 실습에서 몇 초로 줄였어요. 실제 앰프 설정은 꼭 담당자와 함께 바꿔요.',
      tasks: [
        { id: 'power', title: '켜는 순서 지키기', text: '「켜는 순서」에서 ① CL5 콘솔 → ② Rio 를 켜요. 그다음 ③ 40D · 10D 를 켜요. 두 앰프가 다 준비되면(POWER 초록 불) 마지막에 ④ MUTE ALL 을 풀어요.' },
        { id: 'route', title: '입력 배정하기', text: '「입력 신호 표」를 보고 8개 채널의 입력을 맞춰요. Rio 에서 오는 AES3 입력(D1–D4)으로 골라요. 아날로그 A1–A4 에는 아무것도 연결되어 있지 않아요.' },
        { id: 'preset', title: '스피커 셋업 고르기', text: '채널마다 연결된 스피커에 맞는 셋업을 골라요. Vi10P → V10P, Yi10P → Y10P, Yi7P → Y7P 예요. V-SUB · E8 · MAX2 는 이름 그대로예요. LINEAR 는 하나도 남기지 않아요.' },
        { id: 'delay', title: '딜레이 스피커에 딜레이 넣기', text: '천장 가운데(40D CH4) · 천장 좌우(10D CH1) · 기둥(10D CH2)에 딜레이를 넣어요. 값은 「거리 ÷ 343 × 1000」 ms 부터 그보다 5 ms 큰 값 사이예요. 메인 · 서브 · 모니터는 0.3 ms 근처 그대로 둬요.' },
        { id: 'headroom', title: '리미터 여유 지키기', text: '「찬양 최고 음량으로 시험 재생」을 켜요. 입력 게인으로 모든 채널의 리미터 여유를 0 ~ 8 dB 로 맞춰요. GR · OVL 불이 없어야 하고, 메인 L · R 게인은 같아야 해요.' },
        { id: 'fault', title: '부하 이상 찾기', text: '「시스템 체크 실행」을 눌러요. 잰 임피던스를 기준값과 비교해요. 「확인 필요」 채널을 고르고, 알맞은 원인을 골라 진단해요.' }
      ],
      links: [
        { title: '3층 음향 시스템 · 앰프 랙', text: '실제 앰프 랙에서 Rio → 40D · 10D → 스피커로 가는 길을 3D 로 따라가 봐요.', go: { tab: 'tab2', trace: 'amp_40d' } },
        { title: '장비 브랜드 알아보기 · 파워앰프', text: 'd&b 10D · 30D · 40D 와 다른 회사 설치용 앰프를 함께 살펴봐요.', go: { tab: 'tabBrands' } }
      ]
    },
    quiz: [
      { q: '「디지털 앰프」라는 말에 대한 설명으로 가장 알맞은 것은?', options: [
        { t: '흔히 Class D 앰프를 부르는 말이에요. 정말 디지털인 부분은 앰프 안 DSP · 디지털 입력 · 네트워크 제어예요', ok: true, why: '맞아요. Class D 는 켜고 끄는(스위칭) 출력 방식이에요. 「D」는 디지털의 줄임말이 아니에요.' },
        { t: '스피커로 숫자(디지털) 신호를 보내는 앰프예요', why: '아니에요. 스피커로 가는 것은 출력 필터를 지난 전압이에요.' },
        { t: '디지털 입력만 받고 아날로그 입력은 없는 앰프예요', why: '아니에요. 40D · 10D 에도 아날로그 입력이 4개 있어요.' }] },
      { q: '천장 딜레이 스피커가 메인 스피커에서 10.3 m 떨어져 있어요. 딜레이 값은 얼마부터 시작하면 좋을까요? (소리 빠르기 343 m/s)', options: [
        { t: '약 3 ms', why: '아니에요. 10.3 ÷ 343 × 1000 을 계산해 보세요. 1 m 에 약 2.9 ms 예요.' },
        { t: '약 30 ms', ok: true, why: '맞아요. 10.3 ÷ 343 × 1000 ≈ 30 ms 예요. 메인 소리가 먼저 들리게 몇 ms 더 주기도 해요.' },
        { t: '약 300 ms', why: '아니에요. 300 ms 는 소리가 약 100 m 가는 시간이에요. 메아리처럼 들려요.' }] },
      { q: '그림처럼 시스템 체크에서 10D CH2(E8 두 대 링크, 기준 6 Ω)가 12 Ω 으로 나왔어요. 가장 그럴듯한 원인은?', visual: 'daZCheck', options: [
        { t: '케이블이 단락됐어요(+ 선과 − 선이 붙음)', why: '아니에요. 단락이면 임피던스가 기준보다 아주 낮게 나와요.' },
        { t: '정상이에요. 임피던스는 높을수록 좋아요', why: '아니에요. 기준의 두 배는 정상이 아니에요. 한 대 몫이 빠졌다는 신호예요.' },
        { t: 'E8 한 대가 연결되지 않았어요(링크 케이블 빠짐 등)', ok: true, why: '맞아요. 12 Ω E8 한 대만 남으면 12 Ω 이에요. 링크 케이블과 그 스피커를 확인해요.' }] },
      { q: '예배 중 메인 L 스피커에서 소리가 안 나요. 40D CH1 의 ISP(초록)가 꺼져 있어요. 먼저 확인할 곳은?', options: [
        { t: '앰프로 들어오는 입력(입력 배정 · Rio 의 AES/EBU 출력 · 콘솔 출력)', ok: true, why: '맞아요. ISP 는 입력 신호가 들어올 때 켜져요. 꺼져 있으면 앰프 앞쪽(입력)부터 봐요.' },
        { t: '스피커 케이블과 스피커', why: '아니에요. 스피커 쪽 문제라면 입력은 들어와서 ISP 는 켜져 있을 거예요.' },
        { t: '스피커 셋업을 다른 것으로 바꿔 보기', why: '아니에요. 셋업은 입력 신호가 없는 문제와 상관없어요. 셋업은 함부로 바꾸지도 않아요.' }] },
      { q: '40D 는 4 × 2400 W/4Ω, 04-1 의 Crown XLi1500 은 450 W/4Ω 이에요. 이 숫자를 비교할 때 맞는 생각은?', options: [
        { t: '40D 가 다섯 배 넘게 크게 들려요', why: '아니에요. W 가 늘어도 귀로 듣는 크기(dB)는 천천히 늘어요. 게다가 두 숫자는 재는 조건이 달라요.' },
        { t: '재는 신호와 조건이 달라서 바로 비교할 수 없어요', ok: true, why: '맞아요. 40D 의 2400 W 는 CF 12 dB 신호 정격이에요. 1 kHz 사인파로 오래(+40 °C) 재면 250 W/4Ω 이에요. XLi1500 은 1 kHz · THD(찌그러짐) 0.5% 조건이에요.' },
        { t: 'W 가 큰 앰프가 항상 더 좋은 앰프예요', why: '아니에요. 스피커 정격과 공간에 맞는지가 중요해요. W 숫자만으로 좋고 나쁨을 정하지 않아요.' }] }
    ],
    missions: [
      { title: '3층 음향 시스템 · 앰프 신호 따라가기', text: 'CL5 → Dante → Rio → 10D → 스피커로 가는 길을 3D 로 따라가 봐요. 앰프가 어느 스피커를 맡는지 확인해요.', go: { tab: 'tab2', trace: 'amp_10d' } },
      { title: '음향 트러블슈팅 · 미션 B', text: '스피커 한쪽만 소리가 안 날 때를 연습해요. 앰프 채널 표시등 → 입력 → 스피커 연결을 차례로 확인해요.', go: { tab: 'tab7', ts: 'B' } }
    ],
    deeper: [
      { title: 'LoadMatch — 긴 스피커 케이블 보상', text: '스피커 케이블이 길면 케이블의 전기적 성질 때문에 소리가 조금 달라져요. 특히 고음이 달라져요. d&b 앰프의 <b>LoadMatch</b> 는 이것을 앰프 안에서 바로잡아(보상해) 줘요.', more: '<ul><li><b>40D (제조사 자료)</b>: 케이블 길이 70 m 까지, 20 kHz(1초에 2만 번 떨림)까지 보상해요.</li> <li>케이블 길이 · 굵기(단면적) · 스피커 대수를 입력하면 돼요. 선을 따로 더 깔 필요는 없어요.</li> <li>10D 도 LoadMatch 를 지원해요(제조사 페이지). 스피커 셋업을 고를 때 함께 설정해요.</li> <li>LoadMatch 는 지원하는 d&b 스피커에서만 동작해요.</li> <li>설정값이 실제 케이블과 다르면 오히려 소리가 틀어질 수 있어요. 그래서 설치 자료의 케이블 길이를 확인해요.</li></ul>' },
      { title: 'Fallback 과 Override — 입력이 끊길 때 · 비상 방송', text: '40D · 10D 에는 입력이 끊길 때를 대비한 기능이 있어요. <b>Fallback</b> 은 주 입력이 끊기면 예비 입력으로 바꿔요. <b>Override</b> 는 정해 둔 입력을 가장 먼저 내보내요.', more: '<ul><li><b>Fallback (제조사 자료)</b>: 주 신호 길과 예비 신호 길을 정해 둬요. 손으로(Manual) 또는 자동(Auto)으로 바꿔요.</li> <li>예: AES3 입력이 끊기면 아날로그 입력으로 바꿔요.</li> <li><b>Override</b>: 비상 안내나 전체 안내 방송을 다른 모든 신호보다 앞세워 내보내요.</li> <li>3층에서 이 기능을 쓰는지는 이 자료로 확인되지 않았어요.</li> <li>이 기능이 설정되어 있다면, 예배 중 갑자기 소리가 바뀌는 원인이 될 수도 있어요. 담당자에게 확인해 둬요.</li></ul>' },
      { title: '자동 대기 · GPIO · FAULT 접점', text: '앰프는 신호가 없으면 스스로 쉬는 상태로 들어갈 수 있어요. 이것을 자동 대기(AutoStandby)라고 해요. AutoWakeup 은 신호가 들어오면 다시 깨우는 기능이에요. 다른 장비와 연결하는 단자도 있어요.', more: '<ul><li><b>AutoStandby (제조사 자료)</b>: 입력이 정해진 시간 동안 기준보다 작으면 대기로 들어가요. 채널 뮤트와는 따로 동작해요.</li> <li><b>AutoWakeup</b>: 입력이 기준을 넘으면 다시 켜요.</li> <li>40D 는 대기에서 소리가 나기까지 4초 미만이에요. 그래서 자동 대기를 쓰면 예배 첫 말이 잘릴 수 있어요.</li> <li>예배 전에 미리 소리를 내어 앰프가 깨어 있는지 확인해요.</li> <li><b>GPIO</b>: 바깥 스위치나 제어기와 신호를 주고받는 단자예요. 예를 들어 AmpPreset(저장한 설정)을 바꿀 수 있어요.</li> <li>GPIO 개수: 40D 는 입력 8 · 출력 4, 10D 는 5개예요.</li> <li><b>FAULT 접점</b>: 앰프에 이상이 생기면 바깥 장비(경고등 등)에 알리는 단자예요.</li></ul>' }
    ],
    sources: [
      { t: 'd&b 40D 데이터 시트 1.6 (제조사) — Class D 4채널 · 4 × 2000/2400 W (CF 12 dB) · 250 W/4Ω 사인파 · 입력 A1–A4 · AES3 · Milan · EQ 16밴드 × 2 · 딜레이 · LoadMatch · 부하 모니터링 · SMPS · PFC · 대기 21 W · 시작 45 초 미만 · AutoStandby', url: 'https://www.dbaudio.com/assets/products/downloads/manuals-documentation/electronics/dbaudio-datasheet-40d-1.6-en.pdf' },
      { t: 'd&b 40D 설계 사양 (제조사) — 4.3" 터치스크린 · OCA/AES70 · Fallback · Override · GPIO', url: 'https://www.dbaudio.com/assets/products/downloads/architectural-specifications/dbaudio-arch-specs-40d-en.txt' },
      { t: 'd&b 40D 제품 페이지 (제조사, 프랑스어) — R1 필요 · LoadMatch 70 m · 지원 스피커', url: 'https://www.dbaudio.com/fr/fr/produits/amplificateurs/40d' },
      { t: 'd&b 10D 제품 페이지 (제조사) — Class D · SMPS · PFC · 4 × 700/350 W · 입력 · V 시리즈 미지원 · 표시등 · 시스템 체크 · LoadMatch', url: 'https://www.dbaudio.com/global/en/products/amplifiers/10d/' },
      { t: 'd&b 10D 설계 사양 (제조사) — 4 × 700 W/4Ω · 4 × 350 W/8Ω (CF 6 dB) · 2U · 10.6 kg', url: 'https://www.dbaudio.com/assets/products/downloads/architectural-specifications/dbaudio-arch-specs-10d-en.txt' },
      { t: 'd&b 10D/30D 설명서 1.8 (제조사, 프랑스어) — POWER · DATA · MUTE · ISP · GR · OVL 표시등 · 시작 약 17 초 · 입력 게인 −57.5 ~ +6 dB · 출력 모드 · 최소 4 Ω', url: 'https://www.dbaudio.com/assets/products/downloads/manuals-documentation/electronics/dbaudio-manual-10d-30d-1.8-fr.pdf' },
      { t: 'd&b 10D/30D 소개 브로슈어 (제조사) — AmpPreset · 웹 화면 · R1', url: 'https://www.dbaudio.com/assets/products/downloads/brochures/dbaudio-intro-brochure-10d-30d-en.pdf' },
      { t: 'd&b R1 Remote control (제조사)', url: 'https://dbaudio.com/global/en/products/software/r1' },
      { t: 'd&b Vi10P 제품 페이지 — 8 Ω · 110° × 40° · 수동 3웨이', url: 'https://www.dbaudio.com/global/en/products/series/v-series/vi10p' },
      { t: 'd&b Vi7P/Vi10P 설명서 — 셋업 V10P · 채널당 2대 · CUT · HFA · CPL', url: 'https://www.dbaudio.com/assets/products/downloads/manuals-documentation/v-series/dbaudio-manual-vi7p-vi10p-1.5-en.pdf' },
      { t: 'd&b Yi7P/Yi10P 설명서 — 셋업 Y7P · Y10P · 8 Ω · 채널당 2대 · HFA 는 딜레이용', url: 'https://www.dbaudio.com/assets/products/downloads/manuals-documentation/y-series/dbaudio-manual-yi7p-yi10p-1.3-en.pdf' },
      { t: 'd&b Yi7P 제품 페이지 — 10D · 40D', url: 'https://www.dbaudio.com/global/en/products/series/y-series/yi7p/' },
      { t: 'd&b E8 제품 페이지 — 12 Ω · 채널당 3대 · 10D · 40D', url: 'https://www.dbaudio.com/global/en/products/series/e-series/e8/' },
      { t: 'd&b V-SUB 제품 페이지 — 8 Ω · 채널당 2대 · 40D', url: 'https://www.dbaudio.com/global/en/products/series/v-series/v-sub/' },
      { t: 'd&b MAX2 제품 페이지 — 8 Ω · 10D · 40D', url: 'https://www.dbaudio.com/global/en/products/series/monitors/max2/' },
      { t: 'Class D Audio Amplifiers: What, Why, and How — Analog Devices (PWM · 출력 필터 · 효율 78.5% / 90% · 28% / 78%)', url: 'https://www.analog.com/en/resources/analog-dialogue/articles/class-d-audio-amplifiers.html' },
      { t: 'Is Class-D Digital? — Stereophile (「D」는 디지털의 줄임말이 아님)', url: 'https://stereophile.com/content/ps-audio-stellar-m1200-monoblock-power-amplifier-class-d-digital' },
      { t: 'Pros and cons of switch mode power supplies — RS DesignSpark (SMPS 는 작고 가벼움)', url: 'https://www.rs-online.com/designspark/pros-and-cons-of-switch-mode-power-supplies-smps' },
      { t: 'PFC Switch Mode Power Supply — Powersoft (PFC 가 하는 일)', url: 'https://powersoft.com/en/technologies/pfc-switch-mode-power-supply' },
      { t: 'Sound Advice: Using delayed loudspeakers — QSC (거리 ÷ 소리 빠르기, 몇 ms 더 주기)', url: 'https://support.qscaudio.com/en_US/sound-advice/sound-advice-%7C-loudspeaker-placement-part-7-using-delayed-loudspeakers' },
      { t: 'Speed of Sound in Air — The Physics Factbook (20 °C 에서 약 343 m/s)', url: 'https://hypertextbook.com/facts/2000/CheukWong.shtml' },
      { t: 'Yamaha R Series (2세대) 사양 — Rio3224-D2 AES/EBU OUT 1–8', url: 'https://in.yamaha.com/en/products/proaudio/interfaces/r_series_adda_2/specs.html' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 6장 파워 앰프: 증폭 방식(Class D · PWM) p.178–179 · 출력과 임피던스 · 입력 감도 p.180–181', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 9장 순차 전원 분배기 p.284–285 · 15장 앰프 및 프로세서의 디자인(앰프실) p.441–442 · 16장 스피커 프로세서 p.459–462', url: '' }
    ]
  };
})();
