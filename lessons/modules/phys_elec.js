/* =============================================================================
   물리음향 02 전기 — 2026-11-04
   - STA_MODULES['phys-elec'] (모듈 데이터) + STAVisuals.pe* (그림 6개 + 첫 화면 1개) + STASims.circuitLab (전기 실험대 실습)
   - 장비 과정과 겹치는 깊은 내용(케이블 · 핀 배열 = 02-1, 앰프 정격 · 매칭 = 04-1, 디지털 앰프 = 04-2)은 기초만 다루고 안내함
   - 확인한 숫자(출처는 sources):
       옴의 법칙 V = I × R · 물 비유(SparkFun, HyperPhysics), P = V × I(HyperPhysics) → P = V²/R, I²R 은 계산
       8 Ω 두 대: 직렬 16 Ω · 병렬 4 Ω (Eminence)
       한국 전원 220 V · 60 Hz (LG전자 고객지원) — 꼭대기 311 V, 한 주기 16.7 ms 는 계산
       0 dBu = 0.7746 V(600 Ω 에 1 mW) · 0 dBV = 1 V · +4 dBu ≈ 1.228 V · −10 dBV ≈ 0.316 V (Wikipedia Line level) — 차이 11.8 dB 는 계산
       SM58 감도 −54.5 dBV/Pa = 1.85 mV (94 dB SPL = 1 Pa, Shure 사양서) — −52.4 dBu 는 계산
       평형: 똑같이 들어온 잡음은 지워짐 · 핀 1 실드 / 2 핫 / 3 콜드(보통) · 콜드 반전이 꼭 필요하진 않음(Wikipedia Balanced audio)
       비평형 케이블은 3 m 미만 권고(Rane Note 110), 험은 주로 60 Hz · 버즈는 그 배음, 안전 접지 끊지 않기(Jensen AN-004)
       앰프는 마지막에 켜고 먼저 끄기(Sweetwater), 멀티탭 = V × A, 80 % 정도만(IT동아 · 한국전기안전공사 연구원 인용)
       팬텀 P48: 48 V · 6.81 kΩ · 최대 10 mA (IEC 61938, Wikipedia Phantom power)
       구리 비저항 1.68 × 10⁻⁸ Ω·m (HyperPhysics 표)
   - 실습의 그 밖의 숫자(앰프 20 V, 장비 소비 전력, 잡음 크기, 케이블 길이)는 교육용 예시.
   ============================================================================= */
(function () {
  'use strict';
  var V = window.STAVisuals = window.STAVisuals || {};
  var C = { ink: '#0f1f33', sub: '#51627a', line: '#cbd5e1', bg: '#f8fafc', blue: '#2563eb', teal: '#0e7490', orange: '#ea580c', purple: '#7c3aed', red: '#dc2626', green: '#059669', amber: '#d97706', navy: '#0b1626' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 500) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '">' + s + '</text>'; }
  function rect(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 8 : r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.5"' : '') + '/>'; }
  function arrow(x1, y1, x2, y2, col) { var a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 7 * Math.cos(a), hy = y2 - 7 * Math.sin(a); return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="2.4" fill="none"/><path d="M' + x2 + ' ' + y2 + 'L' + (hx - 4 * Math.sin(a)).toFixed(1) + ' ' + (hy + 4 * Math.cos(a)).toFixed(1) + 'L' + (hx + 4 * Math.sin(a)).toFixed(1) + ' ' + (hy - 4 * Math.cos(a)).toFixed(1) + 'Z" fill="' + col + '"/>'; }
  function wave(x0, w, ym, amp, f, col, sw, n) { n = n || 120; var d = ''; for (var i = 0; i <= n; i++) { var u = i / n, x = x0 + u * w, y = ym - amp * f(u); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (sw || 2.2) + '" stroke-linejoin="round"/>'; }
  function sinF(cyc) { return function (u) { return Math.sin(u * Math.PI * 2 * cyc); }; }
  function buzzF(u) { return 0.6 * Math.sin(u * Math.PI * 2 * 11) + 0.4 * Math.sin(u * Math.PI * 2 * 27 + 1); }
  function zig(x, y1, y2, col, sw) { var n = 6, h = (y2 - y1) / n, d = 'M' + x + ' ' + y1; for (var i = 0; i < n; i++) d += 'L' + (x + (i % 2 ? -9 : 9)) + ' ' + (y1 + h * (i + 0.5)).toFixed(1); d += 'L' + x + ' ' + y2; return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (sw || 2.4) + '" stroke-linejoin="round"/>'; }
  function zigH(x1, x2, y, col, sw) { var n = 6, w = (x2 - x1) / n, d = 'M' + x1 + ' ' + y; for (var i = 0; i < n; i++) d += 'L' + (x1 + w * (i + 0.5)).toFixed(1) + ' ' + (y + (i % 2 ? -8 : 8)); d += 'L' + x2 + ' ' + y; return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (sw || 2.4) + '" stroke-linejoin="round"/>'; }

  /* ---------------------------------------------------------------- 첫 화면: 소리 → 전기 → 소리 */
  V.peHero = function () {
    var s = t(300, 18, '예배 찬양 한 소절이 지나가는 길 — 곳마다 전압 크기가 달라요 (교육용 예시 값)', { size: 11, fill: C.sub });
    var cols = [
      ['노래 소리', '공기 압력의 떨림', null, 0, C.sub],
      ['마이크', '소리를 전기로', '약 2 mV', 3, C.teal],
      ['콘솔 출력', '라인 레벨 +4 dBu', '약 1.2 V', 13, C.blue],
      ['파워앰프', '스피커 레벨', '약 28 V', 30, C.orange],
      ['스피커', '전기를 소리로', null, 0, C.purple]
    ];
    cols.forEach(function (c, i) {
      var x = 8 + i * 118, cx = x + 53;
      s += rect(x, 30, 106, 132, '#fff', i === 0 || i === 4 ? C.line : c[4], 10) + t(cx, 50, c[0], { size: 12.5, weight: 800, fill: c[4] === C.sub ? C.ink : c[4] }) + t(cx, 66, c[1], { size: 9.5, fill: C.sub });
      s += '<path d="M' + (x + 10) + ' 108H' + (x + 96) + '" stroke="#e2e8f0" stroke-dasharray="3 3"/>';
      if (i === 0 || i === 4) { for (var k = 0; k < 9; k++) { var dx = x + 14 + k * 9.5, dens = Math.sin(k / 8 * Math.PI * 2 * 1.5); s += '<path d="M' + dx.toFixed(1) + ' ' + (92 - 6 * dens).toFixed(1) + 'V' + (124 + 6 * dens).toFixed(1) + '" stroke="' + (i === 0 ? '#94a3b8' : C.purple) + '" stroke-width="' + (1.4 + 1.2 * (dens + 1)).toFixed(1) + '" opacity=".7"/>'; } }
      else s += wave(x + 10, 86, 108, c[3], sinF(1.5), c[4], 2.4);
      if (c[2]) s += t(cx, 150, c[2], { size: 13, weight: 900, fill: c[4] });
      else s += t(cx, 150, i === 0 ? '성도 · 찬양팀' : '본당 회중석', { size: 10.5, fill: C.sub });
      if (i < 4) s += arrow(x + 106, 96, x + 117, 96, '#94a3b8');
    });
    [['V', '전압', '전기를 미는 힘', C.blue], ['A', '전류', '실제로 흐르는 양', C.orange], ['Ω', '저항 · 임피던스', '흐르기 어려운 정도', C.teal], ['W', '전력', '전압 × 전류', C.purple]].forEach(function (b, i) {
      var x = 8 + i * 148;
      s += rect(x, 174, 140, 46, '#f8fafc', '#e2e8f0', 8) + t(x + 22, 205, b[0], { size: 20, weight: 900, fill: b[3] }) + t(x + 42, 193, b[1], { size: 11.5, weight: 800, anchor: 'start' }) + t(x + 42, 210, b[2], { size: 10, fill: C.sub, anchor: 'start' });
    });
    return svg(600, 228, s, '소리가 마이크에서 전기 신호가 되어 콘솔과 앰프를 지나 다시 소리가 되는 길과 전압 크기');
  };

  /* ---------------------------------------------------------------- 그림 1: 물 비유와 옴의 법칙 */
  V.peOhm = function () {
    var s = t(150, 18, '물 비유', { size: 12, weight: 800 }) + t(450, 18, '전기 회로', { size: 12, weight: 800 });
    // 물: 펌프 · 관 · 좁은 관
    s += '<path d="M40 60H250V170H40Z" fill="none" stroke="#93c5fd" stroke-width="14" stroke-linejoin="round"/>';
    s += '<path d="M250 92V138" stroke="#fff" stroke-width="16"/><path d="M250 92V138" stroke="#93c5fd" stroke-width="4"/>';
    s += '<circle cx="40" cy="115" r="24" fill="#eff6ff" stroke="' + C.blue + '" stroke-width="2"/>' + arrow(40, 128, 40, 100, C.blue);
    [[90, 60, 1], [170, 60, 1], [145, 170, -1]].forEach(function (a) { s += arrow(a[0] - 14 * a[2], a[1], a[0] + 14 * a[2], a[1], '#1d4ed8'); });
    s += t(76, 112, '펌프', { size: 11, weight: 800, fill: C.blue, anchor: 'start' }) + t(76, 127, '= 전원 (전압 V)', { size: 10.5, fill: C.ink, anchor: 'start' });
    s += t(145, 46, '물 흐름 = 전류 (I)', { size: 10.5, weight: 700, fill: '#1d4ed8' });
    s += t(242, 112, '좁은 관', { size: 11, weight: 800, fill: C.orange, anchor: 'end' }) + t(242, 127, '= 저항 (R)', { size: 10.5, fill: C.ink, anchor: 'end' });
    s += t(150, 198, '압력이 세면 많이 흐르고, 관이 좁으면 적게 흘러요', { size: 10.5, fill: C.sub });
    // 회로
    s += '<path d="M360 60H560V170H360Z" fill="none" stroke="' + C.ink + '" stroke-width="2.2"/>';
    s += '<path d="M560 88V142" stroke="#fff" stroke-width="6"/>' + zig(560, 88, 142, C.orange, 2.6);
    s += '<rect x="352" y="100" width="16" height="30" fill="#fff"/><path d="M346 106H374" stroke="' + C.ink + '" stroke-width="3"/><path d="M352 124H368" stroke="' + C.ink + '" stroke-width="5"/>';
    s += t(340, 100, '+', { size: 12, weight: 800, anchor: 'end' }) + t(336, 131, '전원', { size: 10.5, fill: C.blue, weight: 700, anchor: 'end' });
    s += '<circle cx="460" cy="60" r="15" fill="#fff" stroke="' + C.ink + '" stroke-width="2"/>' + t(460, 65, 'A', { size: 13, weight: 900 });
    s += t(574, 112, 'R', { size: 13, weight: 900, fill: C.orange, anchor: 'start' });
    s += rect(372, 82, 170, 70, '#fff7ed', '#fdba74', 8) + t(457, 106, '전류 = 전압 ÷ 저항', { size: 15, weight: 900, fill: C.orange }) + t(457, 124, '(옴의 법칙 V = I × R)', { size: 10.5, fill: C.sub }) + t(457, 141, '20 V ÷ 8 Ω = 2.5 A', { size: 11, weight: 700, fill: C.blue });
    s += t(460, 198, '단위: 전압 V(볼트) · 전류 A(암페어) · 저항 Ω(옴)', { size: 10.5, fill: C.sub });
    s += t(300, 222, '물 비유는 전기를 쉽게 이해하도록 돕는 그림이에요', { size: 10, fill: C.sub });
    return svg(600, 232, s, '물 비유로 본 전압 전류 저항과 옴의 법칙');
  };

  /* ---------------------------------------------------------------- 그림 2: 전력과 스피커 직렬 · 병렬 */
  function spk(x, y, lab, col) { return rect(x, y, 46, 34, '#fff', col || C.ink, 6) + '<path d="M' + (x + 10) + ' ' + (y + 11) + 'h8l9 -7v28l-9 -7h-8z" fill="' + (col || C.ink) + '" opacity=".8"/>' + t(x + 37, y + 21, lab, { size: 9.5, weight: 800 }); }
  V.pePower = function () {
    var s = rect(8, 8, 284, 50, '#f5f3ff', '#c4b5fd', 8) + t(150, 30, '전력(W) = 전압 × 전류', { size: 15, weight: 900, fill: C.purple }) + t(150, 48, '단위 W(와트) — 1초 동안 전기가 하는 일', { size: 10.5, fill: C.ink });
    var rows = [['20 V', '8 Ω', '2.5 A', '50 W'], ['28.3 V', '8 Ω', '3.5 A', '100 W'], ['28.3 V', '4 Ω', '7.1 A', '200 W *']];
    s += t(20, 82, '앰프 전압', { size: 10, fill: C.sub, anchor: 'start' }) + t(110, 82, '스피커', { size: 10, fill: C.sub }) + t(178, 82, '전류', { size: 10, fill: C.sub }) + t(250, 82, '전력', { size: 10, fill: C.sub });
    rows.forEach(function (r, i) { var y = 104 + i * 28; s += rect(8, y - 18, 284, 24, i === 2 ? '#fff7ed' : '#fff', '#e2e8f0', 6) + t(20, y - 1, r[0], { size: 11.5, weight: 800, anchor: 'start', fill: C.blue }) + t(110, y - 1, r[1], { size: 11.5, weight: 700 }) + t(178, y - 1, r[2], { size: 11.5, weight: 700, fill: C.orange }) + t(250, y - 1, r[3], { size: 12, weight: 900, fill: C.purple }); });
    s += t(8, 200, '* 같은 전압에서 Ω 이 반이면 전류 · 전력이 두 배 (계산)', { size: 9.5, fill: C.sub, anchor: 'start' });
    s += t(8, 216, '  실제 앰프는 딱 두 배까지는 못 내요', { size: 9.5, fill: C.sub, anchor: 'start' });
    // 직렬
    s += rect(306, 8, 286, 104, '#fff', C.line, 10) + t(318, 28, '직렬 — 한 줄로 이어요', { size: 11.5, weight: 800, anchor: 'start' });
    s += rect(318, 46, 40, 50, '#1f2933', null, 6) + t(338, 75, '앰프', { size: 10, weight: 800, fill: '#fff' });
    s += '<path d="M358 56H400M446 56H470V64M470 98V104H380V86H358" fill="none" stroke="' + C.red + '" stroke-width="2"/>';
    s += spk(400, 40, '8 Ω') + spk(448, 64, '8 Ω');
    s += t(574, 70, '16 Ω', { size: 15, weight: 900, fill: C.orange, anchor: 'end' }) + t(574, 88, '8 + 8', { size: 10.5, fill: C.sub, anchor: 'end' });
    // 병렬
    s += rect(306, 120, 286, 104, '#fff', C.line, 10) + t(318, 140, '병렬 — 나란히 이어요 (링크)', { size: 11.5, weight: 800, anchor: 'start' });
    s += rect(318, 158, 40, 50, '#1f2933', null, 6) + t(338, 187, '앰프', { size: 10, weight: 800, fill: '#fff' });
    s += '<path d="M358 170H372V150H495V162M425 150V162M358 198H372V214H495V196M425 214V196" fill="none" stroke="' + C.red + '" stroke-width="2"/>';
    s += spk(402, 162, '8 Ω') + spk(472, 162, '8 Ω');
    s += t(580, 190, '4 Ω', { size: 15, weight: 900, fill: C.teal, anchor: 'end' }) + t(580, 140, '8 Ω 둘 → 반으로', { size: 10.5, fill: C.sub, anchor: 'end' });
    return svg(600, 232, s, '전력 공식과 스피커 두 대의 직렬 병렬 임피던스');
  };

  /* ---------------------------------------------------------------- 그림 3: 교류와 오디오 신호 */
  V.peAc = function () {
    var s = t(8, 16, '소리 → 전기 → 소리 : 소리 신호는 + 와 − 를 오가는 교류 전기예요', { size: 10.5, fill: C.sub, anchor: 'start' });
    // 공기 압력
    s += rect(8, 26, 112, 92, '#fff', C.line) + t(64, 44, '공기 압력', { size: 11, weight: 800 });
    for (var k = 0; k < 10; k++) { var dx = 18 + k * 9.5, dn = Math.sin(k / 9 * Math.PI * 3); s += '<path d="M' + dx.toFixed(1) + ' ' + (60 - 4 * dn).toFixed(1) + 'V' + (92 + 4 * dn).toFixed(1) + '" stroke="#94a3b8" stroke-width="' + (1.2 + 1.3 * (dn + 1)).toFixed(1) + '"/>'; }
    s += t(64, 111, '빽빽 · 성김이 반복', { size: 9.5, fill: C.sub });
    s += arrow(120, 72, 140, 72, '#94a3b8');
    s += rect(142, 26, 96, 92, '#ecfeff', '#67e8f9') + t(190, 46, '마이크', { size: 11.5, weight: 800, fill: C.teal }) + t(190, 64, '소리를 전기로', { size: 10, fill: C.ink }) + t(190, 82, '떨리는 판 + 코일', { size: 9.5, fill: C.sub }) + t(190, 96, '+ 자석', { size: 9.5, fill: C.sub }) + t(190, 112, '움직이면 → 전기', { size: 9.5, fill: C.teal, weight: 700 });
    s += arrow(238, 72, 258, 72, '#94a3b8');
    s += rect(260, 26, 200, 92, '#fff', C.blue) + '<path d="M270 72H450" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + wave(270, 180, 72, 30, function (u) { return 0.7 * Math.sin(u * Math.PI * 6) + 0.3 * Math.sin(u * Math.PI * 17); }, C.blue, 2.4);
    s += t(266, 44, '+', { size: 12, weight: 900, fill: C.blue, anchor: 'start' }) + t(266, 110, '−', { size: 14, weight: 900, fill: C.blue, anchor: 'start' }) + t(450, 112, '교류 전압 (AC)', { size: 10, weight: 800, fill: C.blue, anchor: 'end' });
    s += arrow(460, 72, 480, 72, '#94a3b8');
    s += rect(482, 26, 110, 92, '#f5f3ff', '#c4b5fd') + t(537, 46, '스피커', { size: 11.5, weight: 800, fill: C.purple }) + t(537, 64, '전기를 소리로', { size: 10, fill: C.ink }) + t(537, 82, '전기가 코일을', { size: 9.5, fill: C.sub }) + t(537, 96, '자석과 밀고 당겨', { size: 9.5, fill: C.sub }) + t(537, 112, '판이 떨려 → 소리', { size: 9.5, fill: C.purple, weight: 700 });
    // 콘센트 교류
    s += rect(8, 130, 388, 98, '#fff', C.line) + t(20, 148, '벽 콘센트 (한국): 220 V · 60 Hz', { size: 11.5, weight: 800, anchor: 'start' });
    s += '<path d="M60 186H384" stroke="' + C.line + '"/>' + wave(60, 300, 186, 28, sinF(2), C.orange, 2.4);
    s += '<path d="M56 158H64M56 214H64" stroke="' + C.ink + '"/>' + t(52, 162, '+311', { size: 9.5, anchor: 'end' }) + t(52, 190, '0', { size: 9.5, anchor: 'end' }) + t(52, 218, '−311 V', { size: 9.5, anchor: 'end' });
    s += '<path d="M60 222V226H210V222" fill="none" stroke="' + C.orange + '" stroke-width="1.4"/>';
    s += t(232, 148, '1초에 60번 왕복해요 (60 Hz)', { size: 10, fill: C.orange, weight: 700, anchor: 'start' });
    s += rect(406, 130, 186, 98, '#f8fafc', '#e2e8f0') + t(418, 150, '직류 (DC)', { size: 11.5, weight: 800, anchor: 'start' }) + t(418, 166, '건전지처럼 한 방향', { size: 10, fill: C.sub, anchor: 'start' });
    s += '<path d="M418 196H580" stroke="' + C.line + '"/><path d="M418 180H580" stroke="' + C.green + '" stroke-width="2.4"/>' + t(418, 216, '장비 안 전원부가 교류 → 직류로', { size: 9.5, fill: C.sub, anchor: 'start' });
    return svg(600, 236, s, '소리가 마이크에서 교류 전압이 되고 스피커에서 다시 소리가 되는 과정, 220 V 60 Hz 전원');
  };

  /* ---------------------------------------------------------------- 그림 4: 신호 레벨 사다리 */
  V.peLevels = function () {
    var x0 = 40, x1 = 560, X = function (d) { return x0 + (d + 60) / 100 * (x1 - x0); };
    var s = t(8, 16, '신호 크기 비교 — 오른쪽일수록 커요 (20 dB 마다 전압 10배)', { size: 10.5, fill: C.sub, anchor: 'start' });
    s += '<path d="M' + x0 + ' 118H' + x1 + '" stroke="' + C.ink + '" stroke-width="2"/>';
    [-60, -40, -20, 0, 20, 40].forEach(function (d) { s += '<path d="M' + X(d) + ' 113V123" stroke="' + C.ink + '"/>' + t(X(d), 138, (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d), { size: 10, fill: C.sub }); });
    s += t(x1, 152, 'dBu', { size: 10, fill: C.sub, anchor: 'end' });
    var marks = [[-52.4, '마이크', 'SM58 · 1.85 mV', C.teal, 1], [-7.8, '가정용 라인', '−10 dBV = 0.316 V', C.green, -1], [4, '업무용 라인', '+4 dBu = 1.23 V', C.blue, 1], [31.2, '스피커', '100 W · 8 Ω ≈ 28 V', C.orange, -1]];
    marks.forEach(function (m) { var x = X(m[0]), up = m[4] > 0;
      s += '<circle cx="' + x.toFixed(1) + '" cy="118" r="6" fill="' + m[3] + '"/>';
      s += '<path d="M' + x.toFixed(1) + ' ' + (up ? 112 : 124) + 'V' + (up ? 78 : 160) + '" stroke="' + m[3] + '" stroke-width="1.5" stroke-dasharray="3 2"/>';
      var bx = Math.max(8, Math.min(592 - 128, x - 64));
      s += rect(bx, up ? 34 : 162, 128, 42, '#fff', m[3], 7) + t(bx + 64, up ? 52 : 180, m[1], { size: 11.5, weight: 800, fill: m[3] }) + t(bx + 64, up ? 68 : 196, m[2], { size: 10, fill: C.ink }); });
    s += rect(8, 210, 584, 24, '#f8fafc', '#e2e8f0', 6) + t(300, 226, '0 dBu = 0.775 V · 0 dBV = 1 V (0 으로 삼는 기준만 달라요)', { size: 10.5, weight: 700 });
    return svg(600, 240, s, '마이크 레벨 라인 레벨 스피커 레벨의 전압 비교');
  };

  /* ---------------------------------------------------------------- 그림 5: 평형과 비평형 */
  V.peBal = function () {
    var sig = sinF(1.5), s = '';
    function row(y, title, sub, col) { return rect(8, y, 584, 112, '#fff', col, 10) + t(20, y + 20, title, { size: 12, weight: 800, fill: col, anchor: 'start' }) + t(20, y + 36, sub, { size: 10, fill: C.sub, anchor: 'start' }); }
    s += row(8, '비평형 (TS 기타 케이블 등)', '신호선 1가닥 + 그라운드(실드)', C.red);
    s += t(192, 74, '신호선', { size: 10, fill: C.sub, anchor: 'end' }) + wave(200, 140, 70, 18, function (u) { return sig(u) + 0.35 * buzzF(u); }, C.red, 2);
    s += '<path d="M340 52l12 10-8 2 10 10" fill="none" stroke="' + C.amber + '" stroke-width="2"/>' + t(366, 66, '잡음이 신호에 섞임', { size: 10, fill: C.amber, anchor: 'start', weight: 700 });
    s += arrow(476, 70, 494, 70, '#94a3b8') + wave(498, 84, 70, 18, function (u) { return sig(u) + 0.35 * buzzF(u); }, C.red, 2) + t(540, 106, '콘솔: 신호 + 잡음', { size: 10, weight: 800, fill: C.red });
    s += row(128, '평형 (XLR · 평형 TRS)', '1번 실드 · 2번 핫 · 3번 콜드', C.teal);
    s += t(192, 180, '핫 (2번)', { size: 10, fill: C.sub, anchor: 'end' }) + wave(200, 140, 176, 12, function (u) { return sig(u) + 0.4 * buzzF(u); }, '#be123c', 2);
    s += t(192, 220, '콜드 (3번)', { size: 10, fill: C.sub, anchor: 'end' }) + wave(200, 140, 216, 12, function (u) { return -sig(u) + 0.4 * buzzF(u); }, C.blue, 2);
    s += t(400, 180, '잡음은 두 가닥에', { size: 10, fill: C.amber, weight: 700 }) + t(400, 194, '똑같이 들어와요', { size: 10, fill: C.amber, weight: 700 }) + t(400, 214, '받는 쪽: 두 선의 차이만', { size: 10.5, weight: 800, fill: C.teal });
    s += arrow(476, 196, 494, 196, '#94a3b8') + wave(498, 84, 194, 22, sig, C.teal, 2.4) + t(540, 230, '소리 2배 · 잡음 0', { size: 10, weight: 800, fill: C.teal });
    return svg(600, 246, s, '비평형 연결은 잡음이 남고 평형 연결은 핫과 콜드의 차이로 잡음이 지워지는 원리');
  };

  /* ---------------------------------------------------------------- 그림 6: 접지 · 그라운드 루프 · 전원 */
  V.peGround = function () {
    var s = rect(8, 8, 330, 230, '#fff', C.line, 10) + t(20, 28, '그라운드 루프 (교육용 단순화)', { size: 11.5, weight: 800, anchor: 'start' });
    s += rect(20, 42, 84, 40, '#f1f5f9', '#94a3b8', 6) + t(62, 60, '무대 장비', { size: 10.5, weight: 800 }) + t(62, 74, '건반 · DI', { size: 9.5, fill: C.sub });
    s += rect(236, 42, 90, 40, '#f1f5f9', '#94a3b8', 6) + t(281, 60, '콘솔', { size: 10.5, weight: 800 }) + t(281, 74, '방송실', { size: 9.5, fill: C.sub });
    s += '<path d="M104 62H236" stroke="' + C.ink + '" stroke-width="2.4"/>' + t(170, 56, '신호 케이블 실드', { size: 9.5, fill: C.sub });
    s += '<path d="M104 62H236M281 82V140M281 170V200H62V170M62 140V82" fill="none" stroke="' + C.red + '" stroke-width="9" stroke-linejoin="round" opacity=".18"/>';
    s += '<path d="M62 82V140M281 82V140" stroke="' + C.ink + '" stroke-width="2"/>';
    s += rect(36, 140, 52, 30, '#fff', C.ink, 5) + t(62, 159, '회로 2', { size: 10, weight: 700 }) + rect(255, 140, 52, 30, '#fff', C.ink, 5) + t(281, 159, '회로 1', { size: 10, weight: 700 });
    s += '<path d="M62 170V200H281V170" fill="none" stroke="#92400e" stroke-width="2" stroke-dasharray="5 3"/>' + t(170, 214, '건물 접지 — 콘센트 회로마다 전압이 조금 달라요', { size: 9.5, fill: '#92400e' });
    s += t(170, 96, '빨간 고리 = 그라운드 루프', { size: 10.5, weight: 800, fill: C.red }) + t(170, 128, '험: 60 Hz 와 그 2 · 3 · 4배 (Hz)', { size: 9.5, fill: C.sub });
    // 험 스펙트럼
    [[60, 1], [120, 0.55], [180, 0.4], [240, 0.25]].forEach(function (b, i) { var x = 128 + i * 26, h = 30 * b[1]; s += '<rect x="' + x + '" y="' + (168 - h).toFixed(1) + '" width="14" height="' + h.toFixed(1) + '" fill="' + C.red + '" opacity="' + (1 - i * 0.18) + '"/>' + t(x + 7, 180, b[0], { size: 8.5, fill: C.sub }); });
    // 오른쪽 상자
    [['전원 순서', ['켤 때: 콘솔 → 앰프 (마지막)', '끌 때: 앰프 먼저 → 콘솔'], C.blue], ['멀티탭 용량', ['220 V × 16 A = 3520 W', '여유 두기: 80 % ≈ 2800 W'], C.orange], ['팬텀 전원 +48 V', ['콘솔 → 콘덴서 마이크 · 액티브 DI', '꽂고 빼기 전 채널 뮤트'], C.purple]].forEach(function (b, i) {
      var y = 8 + i * 78;
      s += rect(348, y, 244, 70, '#fff', b[2], 8) + t(360, y + 22, b[0], { size: 12, weight: 800, fill: b[2], anchor: 'start' }) + t(360, y + 42, b[1][0], { size: 10.5, anchor: 'start' }) + t(360, y + 59, b[1][1], { size: 10.5, anchor: 'start' });
    });
    return svg(600, 246, s, '그라운드 루프 험과 전원 순서 멀티탭 용량 팬텀 전원');
  };

  /* =========================================================================== 2026-11-04 「그림으로 보기」 — 용어 · 이론 · 문제에 붙이는 쉬운 그림 */
  function svgM(w, h, body, label) { return svg(w, h, body, label).replace('<svg class="mod-svg"', '<svg class="mod-svg" style="min-width:0"'); }   // 작은 그림: 휴대폰에서 가로로 밀리지 않게(글자 13 이상)
  function okx(x, y, ok) { return '<circle cx="' + x + '" cy="' + y + '" r="11" fill="' + (ok ? C.green : C.red) + '"/>' + (ok ? '<circle cx="' + x + '" cy="' + y + '" r="5.5" fill="none" stroke="#fff" stroke-width="2.4"/>' : '<path d="M' + (x - 5) + ' ' + (y - 5) + 'l10 10M' + (x + 5) + ' ' + (y - 5) + 'l-10 10" stroke="#fff" stroke-width="2.4"/>'); }
  function drops(x0, x1, y, n, col) { var o = ''; for (var i = 0; i < n; i++) { var x = x0 + (i + 0.5) * (x1 - x0) / n; o += '<path d="M' + (x - 6).toFixed(1) + ' ' + y + 'h9" stroke="' + col + '" stroke-width="3" stroke-linecap="round"/><path d="M' + (x + 6).toFixed(1) + ' ' + y + 'l-5 -4v8z" fill="' + col + '"/>'; } return o; }

  /* 용어 「전압」: 물탱크가 높을수록 세게 밀어요 */
  V.peTermVolt = function () {
    var s = '';
    [[10, 70, '낮은 물탱크', '약하게 밀어요 = 전압 작음', 70], [190, 26, '높은 물탱크', '세게 밀어요 = 전압 큼', 150]].forEach(function (p) {
      var x = p[0], top = p[1];
      s += rect(x + 6, top, 46, 36, '#dbeafe', C.blue, 4) + '<rect x="' + (x + 6) + '" y="' + (top + 10) + '" width="46" height="26" fill="' + C.blue + '" opacity=".45"/>';
      s += '<path d="M' + (x + 29) + ' ' + (top + 36) + 'V96H' + (x + 64) + '" stroke="#64748b" stroke-width="6" fill="none"/>';
      s += '<path d="M' + (x + 66) + ' 96' + (p[4] > 100 ? 'q48 -6 86 24' : 'q12 -1 18 18') + '" stroke="' + C.blue + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
      s += t(x + 29, top - 6, p[2], { size: 13, weight: 800, fill: C.blue }) + t(x + 84, 130, p[3], { size: 13, weight: 700 });
    });
    return svgM(360, 138, s, '높은 물탱크가 물을 더 세게 미는 것처럼 전압이 클수록 전기를 세게 밀어요');
  };

  /* 용어 「저항 · 임피던스」: 관이 좁을수록 덜 흘러요 */
  V.peTermOhm = function () {
    var s = '';
    [[16, 30, '넓은 관 = 저항 작음', '물(전류)이 많이 흘러요', 6, C.teal], [16, 86, '좁은 관 = 저항 큼', '물(전류)이 조금 흘러요', 2, C.orange]].forEach(function (p) {
      var y = p[1], h = p[4] === 6 ? 26 : 10;
      s += '<rect x="' + p[0] + '" y="' + (y - h / 2) + '" width="150" height="' + h + '" rx="' + h / 2 + '" fill="#e0f2fe" stroke="#64748b" stroke-width="2"/>' + drops(p[0] + 8, p[0] + 142, y, p[4], C.blue);
      s += t(184, y - 3, p[2], { size: 13, weight: 800, fill: p[5], anchor: 'start' }) + t(184, y + 15, p[3], { size: 13, fill: C.sub, anchor: 'start' });
    });
    return svgM(360, 116, s, '넓은 관에는 물이 많이 흐르고 좁은 관에는 조금 흐르는 것처럼 저항이 클수록 전류가 적어요');
  };

  /* 용어 「교류」: 한 방향(직류) / 앞뒤로 바뀌어요(교류) */
  V.peTermAcDc = function () {
    var s = '';
    [[4, '직류 (DC) · 건전지', C.green, false, '한 방향으로만 흘러요'], [184, '교류 (AC) · 콘센트 · 소리', C.purple, true, '방향이 앞뒤로 바뀌어요']].forEach(function (p) {
      var x = p[0];
      s += rect(x, 4, 172, 112, '#fff', C.line) + t(x + 86, 24, p[1], { size: 13, weight: 800, fill: p[2] });
      s += '<path d="M' + (x + 12) + ' 66H' + (x + 160) + '" stroke="#cbd5e1" stroke-dasharray="3 3"/>';
      s += p[3] ? wave(x + 12, 148, 66, 22, sinF(2), p[2], 2.6) + t(x + 8, 50, '+', { size: 13, weight: 800, fill: p[2], anchor: 'start' }) + t(x + 8, 92, '−', { size: 13, weight: 800, fill: p[2], anchor: 'start' }) : '<path d="M' + (x + 12) + ' 46H' + (x + 160) + '" stroke="' + p[2] + '" stroke-width="2.6"/>' + t(x + 8, 50, '+', { size: 13, weight: 800, fill: p[2], anchor: 'start' });
      s += t(x + 86, 108, p[4], { size: 13, weight: 700 });
    });
    return svgM(360, 120, s, '직류는 한 방향, 교류는 + 와 − 를 오가요');
  };

  /* 용어 「평형 연결」: 둘 다 똑같이 올라가도 키 차이는 그대로 */
  V.peTermBal = function () {
    var s = '';
    var who = function (x, foot, h, col) { var head = foot - h; return '<circle cx="' + x + '" cy="' + (head + 8) + '" r="8" fill="' + col + '"/><path d="M' + x + ' ' + (head + 16) + 'V' + (foot - 14) + 'M' + x + ' ' + (foot - 14) + 'l-6 14M' + x + ' ' + (foot - 14) + 'l6 14M' + (x - 8) + ' ' + (head + 24) + 'H' + (x + 8) + '" stroke="#475569" stroke-width="2.2" stroke-linecap="round"/>'; };
    [[0, false, '그냥 서 있을 때'], [180, true, '둘 다 같은 상자에 올라도']].forEach(function (p) {
      var x = p[0], g = p[1] ? 88 : 108;
      s += rect(x + 4, 4, 172, 128, '#fff', C.line) + t(x + 90, 22, p[2], { size: 13, weight: 800 });
      if (p[1]) s += '<rect x="' + (x + 26) + '" y="88" width="104" height="20" rx="3" fill="#fdba74"/>' + t(x + 78, 102, '잡음 상자', { size: 13, weight: 700, fill: '#7c2d12' });
      s += who(x + 50, g, 62, C.blue) + who(x + 106, g, 44, C.orange);
      s += '<path d="M' + (x + 116) + ' ' + (g - 62) + 'H' + (x + 140) + 'M' + (x + 116) + ' ' + (g - 44) + 'H' + (x + 140) + 'M' + (x + 136) + ' ' + (g - 62) + 'V' + (g - 44) + '" stroke="' + C.purple + '" stroke-width="2"/>';
      s += t(x + 143, g - 49, '차이', { size: 13, weight: 800, fill: C.purple, anchor: 'start' });
      s += t(x + 90, 126, p[1] ? '키 차이(신호)는 그대로!' : '키 차이 = 신호', { size: 13, weight: 800, fill: C.purple });
    });
    return svgM(360, 136, s, '두 사람이 같은 상자에 올라가도 키 차이는 그대로인 것처럼 평형 연결은 똑같이 들어온 잡음을 지워요');
  };

  /* 이론 2: 직렬 · 병렬 길 비유 */
  V.peRoad = function () {
    var s = '';
    [[4, '직렬 — 한 줄 길', '문 두 개를 차례로 지나요', '더 막혀요 → 8 + 8 = 16 Ω', C.orange, false], [204, '병렬 — 두 갈래 길', '길이 두 개라 더 잘 지나가요', '덜 막혀요 → 8 Ω 두 대 = 4 Ω', C.teal, true]].forEach(function (p) {
      var x = p[0];
      s += rect(x, 4, 192, 180, '#fff', C.line) + t(x + 96, 24, p[1], { size: 13.5, weight: 800, fill: p[4] });
      if (!p[5]) {
        s += '<rect x="' + (x + 12) + '" y="62" width="168" height="26" rx="4" fill="#e2e8f0"/>';
        [70, 124].forEach(function (gx) { s += '<rect x="' + (x + gx) + '" y="54" width="14" height="42" rx="3" fill="' + p[4] + '"/>' + t(x + gx + 7, 118, '8 Ω', { size: 13, weight: 800, fill: p[4] }); });
        s += drops(x + 14, x + 66, 75, 2, C.blue) + drops(x + 86, x + 122, 75, 1, C.blue) + drops(x + 140, x + 178, 75, 1, C.blue);
      } else {
        s += '<path d="M' + (x + 12) + ' 76H' + (x + 44) + 'M' + (x + 44) + ' 56V96M' + (x + 44) + ' 56H' + (x + 150) + 'M' + (x + 44) + ' 96H' + (x + 150) + 'M' + (x + 150) + ' 56V96M' + (x + 150) + ' 76H' + (x + 180) + '" stroke="#e2e8f0" stroke-width="18" stroke-linecap="round" fill="none"/>';
        [56, 96].forEach(function (gy) { s += '<rect x="' + (x + 90) + '" y="' + (gy - 15) + '" width="14" height="30" rx="3" fill="' + p[4] + '"/>' + drops(x + 50, x + 86, gy, 1, C.blue) + drops(x + 108, x + 146, gy, 1, C.blue); });
        s += t(x + 97, 130, '8 Ω 두 대', { size: 13, weight: 800, fill: p[4] }) + drops(x + 12, x + 42, 76, 1, C.blue);
      }
      s += t(x + 96, 154, p[2], { size: 13.5, fill: C.sub }) + t(x + 96, 174, p[3], { size: 13, weight: 800, fill: p[4] });
    });
    return svgM(400, 188, s, '직렬은 한 줄 길에 문 두 개, 병렬은 두 갈래 길이라 더 잘 흐르는 그림');
  };

  /* 이론 6: 3상 4선식 분전반 */
  V.pe3Phase = function () {
    var s = t(200, 18, '공연장 · 교회 큰 분전반: 3상 4선식', { size: 14, weight: 800 });
    var L = [['L1', '#92400e', '갈색'], ['L2', '#111827', '검정'], ['L3', '#6b7280', '회색'], ['N', '#2563eb', '파랑'], ['PE', '#16a34a', '녹색-노랑']];
    L.forEach(function (l, i) {
      var y = 40 + i * 24;
      s += '<path d="M60 ' + y + 'H390" stroke="' + l[1] + '" stroke-width="' + (i === 4 ? 4 : 5) + '"' + (i === 4 ? ' stroke-dasharray="10 6"' : '') + '/>' + t(8, y + 5, l[0], { size: 14, weight: 900, fill: l[1], anchor: 'start' });
    });
    s += t(8, 168, '선 색(2022년 규정): L1 갈색 · L2 검정 · L3 회색', { size: 13, fill: C.sub, anchor: 'start' }) + t(8, 186, 'N 파랑 · 접지(PE) 녹색-노랑', { size: 13, fill: C.sub, anchor: 'start' });
    var tap = function (x, ya, yb, lab, col) { return '<circle cx="' + x + '" cy="' + ya + '" r="4" fill="' + col + '"/><circle cx="' + x + '" cy="' + yb + '" r="4" fill="' + col + '"/><path d="M' + x + ' ' + ya + 'V' + yb + '" stroke="' + col + '" stroke-width="2" stroke-dasharray="3 2"/>' + '<rect x="' + (x + 6) + '" y="' + ((ya + yb) / 2 - 11) + '" width="' + (lab.length * 8 + 12) + '" height="20" rx="4" fill="#fff" stroke="' + col + '"/>' + t(x + 12, (ya + yb) / 2 + 4, lab, { size: 13.5, weight: 800, fill: col, anchor: 'start' }); };
    s += tap(110, 40, 112, '220 V', C.blue) + tap(200, 64, 112, '220 V', C.blue) + tap(280, 88, 112, '220 V', C.blue) + tap(318, 40, 64, '380 V', C.red);
    s += t(8, 210, '음향 장비(220 V)는 한 상과 N 에서 받아요.', { size: 13, weight: 700, fill: C.ink, anchor: 'start' }) + t(8, 228, '장비를 세 상에 고르게 나눠 꽂아요.', { size: 13, weight: 700, fill: C.ink, anchor: 'start' });
    return svgM(400, 236, s, '3상 4선식 분전반: L1 L2 L3 와 N, 한 상과 N 사이 220 V, 두 상 사이 380 V');
  };

  /* 이론 6: 누전 · 단락 · 지락 */
  V.peFaults = function () {
    var s = '';
    [[2, '누전', '선 밖으로 새요', '금속 외함에 흘러요', C.amber], [136, '단락 (쇼트)', '두 선이 붙어요', '불꽃 · 퓨즈 끊김', C.red], [270, '지락', '접지에 닿아요', '감전 위험', C.purple]].forEach(function (p, i) {
      var x = p[0], cx = x + 64;
      s += rect(x, 4, 128, 168, '#fff', C.line) + t(cx, 26, p[1], { size: 14, weight: 900, fill: p[4] });
      s += '<path d="M' + (x + 14) + ' 54H' + (x + 114) + 'M' + (x + 14) + ' 96H' + (x + 114) + '" stroke="#475569" stroke-width="3"/>' + t(x + 10, 50, 'L', { size: 13, weight: 800, fill: C.sub, anchor: 'start' }) + t(x + 10, 92, i === 2 ? '' : 'N', { size: 13, weight: 800, fill: C.sub, anchor: 'start' });
      if (i === 0) s += '<rect x="' + (cx - 26) + '" y="66" width="52" height="22" rx="4" fill="#e2e8f0" stroke="#64748b"/>' + t(cx, 81, '외함', { size: 13, weight: 700 }) + '<path d="M' + (cx - 4) + ' 56l5 5 -5 4 5 5" stroke="' + p[4] + '" stroke-width="2.2" fill="none"/>';
      if (i === 1) s += '<path d="M' + cx + ' 54V96" stroke="' + p[4] + '" stroke-width="4"/><path d="M' + (cx + 6) + ' 70l12 -6M' + (cx + 6) + ' 78l14 2M' + (cx - 6) + ' 72l-12 -5" stroke="' + C.amber + '" stroke-width="2.4" stroke-linecap="round"/>';
      if (i === 2) s += '<path d="M' + cx + ' 54V100" stroke="' + p[4] + '" stroke-width="4"/><path d="M' + (cx - 16) + ' 100H' + (cx + 16) + 'M' + (cx - 10) + ' 106H' + (cx + 10) + 'M' + (cx - 4) + ' 112H' + (cx + 4) + '" stroke="#16a34a" stroke-width="2.4"/>' + t(x + 104, 92, '접지', { size: 13, weight: 700, fill: '#16a34a' });
      s += t(cx, 140, p[2], { size: 13, weight: 700 }) + t(cx, 160, p[3], { size: 13, fill: C.sub });
    });
    return svgM(400, 176, s, '누전은 선 밖으로 새는 것, 단락은 두 선이 바로 붙는 것, 지락은 전기선이 접지와 붙는 것');
  };

  /* 확인 문제: 켜는 순서 그림을 보고 끄는 순서 고르기 */
  V.peOnOrder = function () {
    var s = t(200, 18, '예배 전 켤 때 순서', { size: 14, weight: 800 });
    var box = function (x, n, lab, sub, col) { return rect(x, 30, 112, 70, '#fff', col, 10) + '<circle cx="' + (x + 18) + '" cy="48" r="11" fill="' + col + '"/>' + t(x + 18, 52.5, n, { size: 13, weight: 900, fill: '#fff' }) + t(x + 62, 54, lab, { size: 14, weight: 800, fill: col }) + t(x + 56, 84, sub, { size: 13, fill: C.sub }); };
    s += box(8, '1', '콘솔', '먼저 켜요', C.blue) + arrow(124, 65, 144, 65, '#94a3b8') + box(146, '2', '앰프', '마지막에 켜요', C.orange) + arrow(262, 65, 282, 65, '#94a3b8');
    s += rect(284, 30, 108, 70, '#fff7ed', C.orange, 10) + t(338, 58, '스피커에서', { size: 13, weight: 800, fill: C.orange }) + t(338, 78, '「퍽」 없음', { size: 13, weight: 800, fill: C.orange });
    s += t(200, 126, '끌 때는 어느 쪽을 먼저 끌까요?', { size: 13.5, weight: 800, fill: C.purple });
    return svgM(400, 136, s, '켤 때는 콘솔 다음 앰프 순서이고, 끌 때 순서를 묻는 그림');
  };

  /* =========================================================================== 실습: 전기 실험대 (STASims.circuitLab) */
  var VREF_DBU = 0.7746;                       // 0 dBu (600 Ω 에 1 mW)
  var OHM_TARGET = 2;                          // 과제 1: 전류 2 A
  var R_CHOICES = [4, 8, 16];
  var AMP_V = 20;                              // 과제 2: 앰프 출력 전압 (교육용)
  var SPK_Z = 8;
  var TERMS = { 'P+': [126, 130], 'P-': [126, 200], 'A+': [330, 54], 'A-': [330, 98], 'B+': [330, 207], 'B-': [330, 251] };
  var WIRE_COL = ['#dc2626', '#334155', '#ea580c', '#2563eb'];
  var JACKS = [
    { id: 'mic', x: 64, name: '마이크 출력', sub: 'SM58 · 94 dB SPL', v: 0.00185, kind: '마이크 레벨', col: '#0e7490' },
    { id: 'home', x: 184, name: '가정용 기기', sub: '−10 dBV 기준', v: 0.3162, kind: '라인 레벨 (가정용)', col: '#059669' },
    { id: 'pro', x: 304, name: '콘솔 출력', sub: '+4 dBu 기준', v: 1.2277, kind: '라인 레벨 (업무용)', col: '#2563eb' },
    { id: 'spk', x: 424, name: '앰프 출력', sub: '100 W · 8 Ω', v: Math.sqrt(800), kind: '스피커 레벨', col: '#ea580c' }
  ];
  var CABLE_Y = 85;
  var OUTLETS = { B: [70, 238, '무대 콘센트', '회로 2'], A2: [190, 238, '음향 전용 콘센트', '회로 1'] };
  var DEVS = [
    { id: 'con', x: 66, name: '콘솔', w: 150 },
    { id: 'a1', x: 182, name: '파워앰프 1', w: 900 },
    { id: 'a2', x: 298, name: '파워앰프 2', w: 900 },
    { id: 'pot', x: 414, name: '커피포트', w: 1800 }
  ];
  var SOCKS = [100, 190, 280, 370], SOCK_Y = 236;
  var MAINS = 220, TAP_A = 16, TAP_W = MAINS * TAP_A, TAP_SAFE = TAP_W * 0.8;
  var PANELS = [['ohm', '① 옴의 법칙'], ['wire', '② 스피커 배선'], ['level', '③ 신호 레벨'], ['bal', '④ 평형 연결'], ['ground', '⑤ 그라운드 루프'], ['tap', '⑥ 멀티탭 · 전원']];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function f1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
  function sg(v, d) { var r = d === 0 ? String(Math.round(Math.abs(v))) : f1(Math.abs(v)); return (v > 0.04 ? '+' : v < -0.04 ? '−' : '') + r; }
  function dbu(v) { return 20 * Math.log(v / VREF_DBU) / Math.LN10; }
  function dbv(v) { return 20 * Math.log(v) / Math.LN10; }
  function vtxt(v) { return v < 0.1 ? f2(v * 1000) + ' mV' : v < 10 ? f2(v) + ' V' : f1(v) + ' V'; }
  function zt(z) { return !isFinite(z) ? '연결 안 됨' : z < 0.05 ? '0 Ω (단락)' : (Math.abs(z - Math.round(z)) < 0.05 ? String(Math.round(z)) : f1(z)) + ' Ω'; }
  function dist(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }

  function injectCss() {
    if (document.getElementById('sta-mod-physelec-css')) return;
    var s = document.createElement('style'); s.id = 'sta-mod-physelec-css';
    s.textContent = [
      '.sim-pe{display:flex;flex-direction:column;gap:10px;min-width:0}',
      '.sim-pe-nav{display:flex;flex-wrap:wrap;gap:6px}',
      '.sim-pe-nav button{display:inline-flex;align-items:center;gap:5px;padding:7px 11px;border-radius:999px;border:1px solid #94a3b8;background:#fff;font:inherit;font-size:.78rem;font-weight:800;color:#0f2747;cursor:pointer}',
      '.sim-pe-nav button[aria-pressed=true]{background:#0f2747;color:#fff;border-color:#0f2747}',
      '.sim-pe-nav button i{font-style:normal;color:#059669;font-weight:900}.sim-pe-nav button[aria-pressed=true] i{color:#6ee7b7}',
      '.sim-pe-nav button:focus-visible,.sim-pe-chip:focus-visible,.sim-pe-knob:focus-visible{outline:2px solid #22d3ee;outline-offset:2px}',
      '.sim-pe-body{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:12px;align-items:start}',
      '.sim-pe-stage{border:1px solid var(--sta-line,#cbd5e1);border-radius:12px;background:#f8fafc;overflow:hidden;min-width:0}',
      '.sim-pe-stage h4{margin:0;padding:9px 12px 0;font-size:.86rem;color:var(--sta-navy,#0f2747)}.sim-pe-stage h4 small{font-weight:500;color:#64748b;font-size:.72rem}',
      '.sim-pe-svg{display:block;width:100%;height:auto;touch-action:none;user-select:none;-webkit-user-select:none}',
      '.sim-pe-svg [data-drag]{cursor:grab}.sim-pe-svg.dragging [data-drag]{cursor:grabbing}.sim-pe-svg [data-act]{cursor:pointer}',
      '.sim-pe-hint{font-size:.76rem;color:#475569;padding:6px 12px 9px;margin:0;line-height:1.5}',
      '.sim-pe-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}',
      '.sim-pe-chip{padding:5px 10px;border-radius:999px;border:1px solid #94a3b8;background:#fff;font:inherit;font-size:.76rem;font-weight:800;color:#0f2747;cursor:pointer}',
      '.sim-pe-chip[aria-pressed=true]{background:#0f2747;color:#fff;border-color:#0f2747}',
      '.sim-pe-msg{font-size:.78rem;line-height:1.55;margin:8px 0 0;color:#475569}.sim-pe-msg.ok{color:#047857;font-weight:700}.sim-pe-msg.bad{color:#b91c1c;font-weight:700}.sim-pe-msg.warn{color:#b45309;font-weight:700}',
      '.sim-pe-big{font-size:1.25rem;font-weight:900;font-variant-numeric:tabular-nums;color:#0f2747}',
      '.sim-pe-eq{font-size:.78rem;background:#f1f5f9;border-radius:8px;padding:6px 8px;margin:6px 0 0;font-variant-numeric:tabular-nums;color:#0f2747}',
      '.sim-pe-ladder{position:relative;height:30px;margin:8px 2px 18px;border-radius:6px;background:linear-gradient(90deg,#ccfbf1,#dbeafe 55%,#ffedd5)}',
      '.sim-pe-ladder i{position:absolute;top:-3px;bottom:-3px;width:4px;margin-left:-2px;border-radius:2px}',
      '.sim-pe-ladder span{position:absolute;top:33px;font-size:.62rem;color:#64748b;transform:translateX(-50%)}',
      '.sim-pe-tbl{width:100%;border-collapse:collapse;font-size:.72rem;margin-top:4px}.sim-pe-tbl th,.sim-pe-tbl td{padding:3px 4px;border-bottom:1px dashed #e2e8f0;text-align:left;font-variant-numeric:tabular-nums}',
      '.sim-pe-tbl th{color:#64748b;font-weight:700}.sim-pe-tbl td.r{text-align:right}',
      '.sim-pe-spec{display:flex;align-items:flex-end;gap:6px;height:64px;padding:4px 6px 0;border-radius:8px;background:#0b1626;margin-top:4px}',
      '.sim-pe-spec div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:2px}',
      '.sim-pe-spec b{display:block;width:70%;border-radius:3px 3px 0 0;background:#ef4444;transition:height .25s}',
      '.sim-pe-spec small{font-size:.58rem;color:#94a3b8;padding-bottom:3px}',
      '.sim-pe-bar{height:10px;border-radius:5px;background:#e2e8f0;overflow:hidden;margin:3px 0 2px}.sim-pe-bar i{display:block;height:100%;background:#10b981;transition:width .2s}.sim-pe-bar i.warn{background:#f59e0b}.sim-pe-bar i.bad{background:#ef4444}',
      '@keyframes simPeFlow{to{stroke-dashoffset:-30}}',
      '.sim-pe-flow{stroke-dasharray:4 11;animation:simPeFlow 1s linear infinite}',
      '@keyframes simPeCone{50%{transform:scale(1.12)}}',
      '.sim-pe-cone{transform-box:fill-box;transform-origin:center;animation:simPeCone .35s ease-in-out infinite}',
      '@media (prefers-reduced-motion:reduce){.sim-pe-flow,.sim-pe-cone{animation:none}}',
      '@media (max-width:900px){.sim-pe-body{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------------- 회로 계산: 선으로 이은 단자 → 합성 임피던스 (노드 해석) */
  function solveNet(wires) {
    var par = {}; Object.keys(TERMS).forEach(function (k) { par[k] = k; });
    function find(k) { while (par[k] !== k) { par[k] = par[par[k]]; k = par[k]; } return k; }
    wires.forEach(function (w) { if (w[0].t && w[1].t) { var a = find(w[0].t), b = find(w[1].t); if (a !== b) par[a] = b; } });
    var hi = find('P+'), lo = find('P-');
    var res = [['A', find('A+'), find('A-')], ['B', find('B+'), find('B-')]];
    var out = { z: Infinity, short: false, iA: 0, iB: 0, nodes: {} };
    if (hi === lo) { out.short = true; out.z = 0; return out; }
    var nodes = [], idx = {};
    res.forEach(function (r) { [r[1], r[2]].forEach(function (n) { if (n !== hi && n !== lo && idx[n] == null) { idx[n] = nodes.length; nodes.push(n); } }); });
    var N = nodes.length, g = 1 / SPK_Z, M = [], b = [], i, j;
    for (i = 0; i < N; i++) { M.push(new Array(N).fill(0)); b.push(0); }
    function vk(n) { return n === hi ? 1 : n === lo ? 0 : null; }
    res.forEach(function (r) { var p = r[1], q = r[2]; if (p === q) return;
      [[p, q], [q, p]].forEach(function (pq) { var a = pq[0], c = pq[1]; if (idx[a] == null) return; var ia = idx[a]; M[ia][ia] += g; if (idx[c] != null) M[ia][idx[c]] -= g; else b[ia] += g * vk(c); }); });
    for (i = 0; i < N; i++) {   // 가우스 소거 (떠 있는 노드는 0 V 로)
      var pv = i; for (j = i + 1; j < N; j++) if (Math.abs(M[j][i]) > Math.abs(M[pv][i])) pv = j;
      if (Math.abs(M[pv][i]) < 1e-12) { for (j = 0; j < N; j++) M[i][j] = 0; M[i][i] = 1; b[i] = 0; continue; }
      var tm = M[i]; M[i] = M[pv]; M[pv] = tm; var tb = b[i]; b[i] = b[pv]; b[pv] = tb;
      for (j = 0; j < N; j++) if (j !== i) { var f = M[j][i] / M[i][i]; if (f) { for (var k = i; k < N; k++) M[j][k] -= f * M[i][k]; b[j] -= f * b[i]; } }
    }
    var volt = function (n) { var v = vk(n); return v != null ? v : b[idx[n]] / M[idx[n]][idx[n]]; };
    var cur = { A: (volt(res[0][1]) - volt(res[0][2])) * g, B: (volt(res[1][1]) - volt(res[1][2])) * g };
    if (res[0][1] === res[0][2]) cur.A = 0; if (res[1][1] === res[1][2]) cur.B = 0;
    var itot = 0; res.forEach(function (r) { if (r[1] === r[2]) return; if (r[1] === hi) itot += (1 - volt(r[2])) * g; else if (r[2] === hi) itot += (1 - volt(r[1])) * g; });
    out.z = itot > 1e-9 ? 1 / itot : Infinity; out.iA = cur.A; out.iB = cur.B;
    return out;
  }

  function circuitLab(el, opts) {
    opts = opts || {}; injectCss();
    var S = {
      panel: 'ohm', done: {},
      ohm: { v: 12, r: 8 },
      wires: [[{ t: 'P+' }, { t: 'A+' }], [{ t: 'P-' }, { t: 'A-' }], [{ t: null, x: 46, y: 302 }, { t: null, x: 126, y: 302 }], [{ t: null, x: 176, y: 302 }, { t: null, x: 256, y: 302 }]],
      probe: { x: 240, y: 140, at: null }, measured: {}, fixedScale: false,
      bal: { mode: 'unbal', nx: 240, ny: 262 },
      gnd: { plug: { x: 70, y: 238, at: 'B' }, lift: false, adp: { x: 300, y: 196, on: false }, warned: false },
      tap: { dev: {}, tripped: false, order: { a1: false, a2: false }, msg: '', cls: '' },
      msg: {}
    };
    DEVS.forEach(function (d) { S.tap.dev[d.id] = { sock: null, on: false, x: d.x, y: 150 }; });
    var alive = true, drag = null;

    el.innerHTML = '<div class="sim-pe"><div class="sim-pe-nav" role="group" aria-label="실험 고르기" data-role="nav"></div>' +
      '<div class="sim-pe-body"><div class="sim-pe-stage"><h4 data-role="title"></h4><svg class="sim-pe-svg" data-role="svg" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif"><g data-role="layer"></g></svg><p class="sim-pe-hint" data-role="hint"></p></div>' +
      '<div class="sim-side"><div class="sim-box sim-read" data-role="read"></div></div></div></div>';
    var q = function (s) { return el.querySelector(s); };
    var svgEl = q('[data-role=svg]'), layer = q('[data-role=layer]');

    /* ---------------- 계산 */
    function ohmCalc() { var v = S.ohm.v, r = S.ohm.r, i = v / r; return { v: v, r: r, i: i, p: v * i }; }
    function wireCalc() { var n = solveNet(S.wires), vA = n.iA * SPK_Z * AMP_V, vB = n.iB * SPK_Z * AMP_V; return { z: n.z, short: n.short, iA: n.iA * AMP_V, iB: n.iB * AMP_V, pA: vA * vA / SPK_Z, pB: vB * vB / SPK_Z, i: isFinite(n.z) && n.z > 0 ? AMP_V / n.z : 0 }; }
    function wireKind(k) { if (k.short) return '단락'; if (!isFinite(k.z)) return '끊김'; var a = Math.abs(k.iA) > 1e-6, b = Math.abs(k.iB) > 1e-6; if (a && b && Math.abs(k.z - 16) < 0.1) return '직렬'; if (a && b && Math.abs(k.z - 4) < 0.1) return '병렬'; if (a !== b) return '한 대'; return '기타'; }
    function probeJack() { for (var i = 0; i < JACKS.length; i++) if (JACKS[i].id === S.probe.at) return JACKS[i]; return null; }
    function balCalc() { var d = Math.max(0, Math.abs(S.bal.ny - CABLE_Y) - 18), c = clamp(1 - d / 120, 0, 1), n = c * 0.9; return { c: c, n: n, out: S.bal.mode === 'bal' ? n * 0.02 : n }; }
    function gndCalc() { var G = S.gnd, powered = !!G.plug.at; var loop = powered && G.plug.at === 'B' && !G.lift; var hum = loop && !G.adp.on; return { powered: powered, loop: loop, hum: hum, unsafe: G.adp.on, ok: powered && !G.adp.on && !(G.plug.at === 'B' && !G.lift) }; }
    function tapCalc() { var w = 0, plugged = 0; DEVS.forEach(function (d) { var st = S.tap.dev[d.id]; if (st.sock != null) { plugged += d.w; if (st.on) w += d.w; } }); return { w: w, a: w / MAINS, plugged: plugged }; }
    function tapOk() { var T = S.tap, k = tapCalc(); return !T.tripped && ['con', 'a1', 'a2'].every(function (id) { return T.dev[id].on; }) && T.order.a1 && T.order.a2 && k.w <= TAP_SAFE; }

    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); renderNav(); }
    function checkTasks() {
      var o = ohmCalc(); if (Math.abs(o.i - OHM_TARGET) < 0.02) hit('ohm');
      var w = wireCalc(); if (wireKind(w) === '병렬' && w.iA > 0 && w.iB > 0) hit('parallel');
      if (JACKS.every(function (j) { return S.measured[j.id]; })) hit('levels');
      var b = balCalc(); if (S.bal.mode === 'bal' && b.c >= 0.6) hit('balanced');
      if (gndCalc().ok && S.gnd.seenHum) hit('ground');
      if (tapOk()) hit('tap');
    }

    /* ---------------- 그리기 공통 */
    function T(x, y, s, o) { return t(x, y, s, o); }
    function setView(w, h) { svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h); }
    function renderNav() {
      q('[data-role=nav]').innerHTML = PANELS.map(function (p) { var d = { ohm: 'ohm', wire: 'parallel', level: 'levels', bal: 'balanced', ground: 'ground', tap: 'tap' }[p[0]];
        return '<button type="button" data-act="panel" data-v="' + p[0] + '" aria-pressed="' + (S.panel === p[0]) + '">' + (S.done[d] ? '<i>✓</i>' : '') + p[1] + '</button>'; }).join('');
    }
    function render() { ({ ohm: drawOhm, wire: drawWire, level: drawLevel, bal: drawBal, ground: drawGround, tap: drawTap })[S.panel](); }

    /* ---------------- ① 옴의 법칙 */
    function knobAng(v) { return -135 + v / 48 * 270; }
    function drawOhm() {
      var k = ohmCalc(); setView(480, 300);
      q('[data-role=title]').innerHTML = '① 옴의 법칙 실험대 <small>전압 노브를 돌리고 저항을 골라요</small>';
      var s = rect(14, 30, 156, 250, '#1f2933', '#0b0f14', 12) + T(92, 54, '전원 장치', { size: 14, weight: 800, fill: '#fff' });
      s += rect(32, 66, 120, 42, '#0b1626', '#334155', 6) + T(92, 96, f1(k.v) + ' V', { size: 22, weight: 900, fill: '#5eead4' });
      var a = knobAng(k.v) * Math.PI / 180, cx = 92, cy = 186;
      for (var i = 0; i <= 12; i++) { var aa = (-135 + i * 22.5) * Math.PI / 180; s += '<path d="M' + (cx + 50 * Math.sin(aa)).toFixed(1) + ' ' + (cy - 50 * Math.cos(aa)).toFixed(1) + 'L' + (cx + 57 * Math.sin(aa)).toFixed(1) + ' ' + (cy - 57 * Math.cos(aa)).toFixed(1) + '" stroke="#94a3b8" stroke-width="' + (i % 3 ? 1.2 : 2.2) + '"/>'; }
      s += T(cx - 50, cy + 60, '0', { size: 12, fill: '#cbd5e1' }) + T(cx + 50, cy + 60, '48 V', { size: 12, fill: '#cbd5e1' });
      s += '<g data-drag="knob"><circle cx="' + cx + '" cy="' + cy + '" r="46" fill="transparent"/><circle cx="' + cx + '" cy="' + cy + '" r="40" fill="#e5e7eb" stroke="#4b5563" stroke-width="3"/><circle cx="' + cx + '" cy="' + cy + '" r="31" fill="#cbd5e1"/>' +
        '<path d="M' + cx + ' ' + cy + 'L' + (cx + 34 * Math.sin(a)).toFixed(1) + ' ' + (cy - 34 * Math.cos(a)).toFixed(1) + '" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/></g>';
      s += T(cx, 271, '노브를 돌려요', { size: 12.5, fill: '#94a3b8' });
      // 회로
      var hot = clamp(k.p / 150, 0, 1), rc = 'rgb(' + Math.round(148 + 92 * hot) + ',' + Math.round(163 - 100 * hot) + ',' + Math.round(184 - 150 * hot) + ')';
      var loop = 'M170 92H296M324 92H420V128M420 212V246H170';
      s += '<path d="' + loop + '" fill="none" stroke="#334155" stroke-width="3"/>';
      if (k.i > 0.01) s += '<path d="M170 92H420V246H170" fill="none" stroke="#fbbf24" stroke-width="3" class="sim-pe-flow" style="animation-duration:' + clamp(3 / k.i, 0.25, 6).toFixed(2) + 's"/>';
      s += '<circle cx="170" cy="92" r="7" fill="#dc2626"/><circle cx="170" cy="246" r="7" fill="#111827"/>' + T(160, 84, '+', { size: 14, weight: 900, fill: '#fff', anchor: 'end' });
      s += '<circle cx="310" cy="92" r="20" fill="#fff" stroke="#0f172a" stroke-width="2.4"/>' + T(310, 98, 'A', { size: 16, weight: 900 }) + T(310, 134, f2(k.i) + ' A', { size: 16, weight: 900, fill: '#ea580c' }) + T(310, 154, '전류계', { size: 12.5, fill: C.sub });
      if (hot > 0.05) s += '<rect x="404" y="124" width="32" height="92" rx="10" fill="#f97316" opacity="' + (0.12 + 0.35 * hot).toFixed(2) + '"/>';
      s += '<g data-act="rcycle">' + '<rect x="398" y="124" width="44" height="92" fill="transparent"/>' + zig(420, 128, 212, rc, 3.2) + '</g>';
      s += T(440, 166, k.r + ' Ω', { size: 15, weight: 900, fill: '#0e7490', anchor: 'start' }) + T(440, 186, '저항', { size: 12.5, fill: C.sub, anchor: 'start' });
      s += '<path d="M420 140H378M420 200H378" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="360" cy="170" r="18" fill="#fff" stroke="#7c3aed" stroke-width="2"/>' + T(360, 176, 'V', { size: 15, weight: 900, fill: '#7c3aed' }) + T(352, 214, f1(k.v) + ' V', { size: 13, weight: 800, fill: '#7c3aed', anchor: 'end' });
      s += rect(194, 256, 270, 34, '#fff', '#c4b5fd', 8) + T(329, 279, '전력 P = V × I = ' + f1(k.p) + ' W', { size: 14, weight: 900, fill: '#7c3aed' });
      layer.innerHTML = s;
      q('[data-role=hint]').textContent = '노브를 마우스(손가락)로 잡고 돌리면 전압이 바뀌어요. 저항 기호를 누르거나 오른쪽에서 저항 값을 골라요. 노란 점이 빠를수록 전류가 많이 흘러요.';
      var ok = Math.abs(k.i - OHM_TARGET) < 0.02;
      q('[data-role=read]').innerHTML = '<h4>측정값 <small>옴의 법칙</small></h4>' +
        '<div class="sim-row"><span>전압 V</span><b>' + f1(k.v) + ' V</b></div><div class="sim-row"><span>저항 R</span><b>' + k.r + ' Ω</b></div>' +
        '<div class="sim-row"><span>전류 I = V ÷ R</span><b class="' + (ok ? 'ok' : '') + '">' + f2(k.i) + ' A</b></div><div class="sim-row"><span>전력 P = V × I</span><b>' + f1(k.p) + ' W</b></div>' +
        '<p class="sim-pe-eq">' + f1(k.v) + ' V ÷ ' + k.r + ' Ω = ' + f2(k.i) + ' A</p>' +
        '<div class="sim-pe-chips" role="group" aria-label="저항 고르기">' + R_CHOICES.map(function (r) { return '<button type="button" class="sim-pe-chip" data-act="r" data-v="' + r + '" aria-pressed="' + (S.ohm.r === r) + '">' + r + ' Ω</button>'; }).join('') + '</div>' +
        '<div class="sim-pe-chips">' + [-1, -0.5, 0.5, 1].map(function (d) { return '<button type="button" class="sim-btn" data-act="dv" data-v="' + d + '">' + (d > 0 ? '+' : '−') + Math.abs(d) + ' V</button>'; }).join('') + '</div>' +
        '<p class="sim-pe-msg ' + (ok ? 'ok' : '') + '">' + (ok ? '좋아요. 전류가 2 A 예요. 저항을 바꾸면 같은 2 A 를 만드는 전압도 바뀌어요.' : '목표: 전류계가 <b>2.00 A</b> 를 가리키게 해요. 물 비유로 압력(전압)과 관 굵기(저항)를 함께 생각해요.') + '</p>' +
        '<p class="sim-note">전원 장치 · 저항은 교육용이에요. 실제 장비 전원을 직접 재지 않아요.</p>';
    }

    /* ---------------- ② 스피커 배선 */
    function endPos(e) { return e.t ? TERMS[e.t] : [e.x, e.y]; }
    function wirePath(a, b) { var sag = 26 + Math.abs(a[0] - b[0]) * 0.08; return 'M' + a[0] + ' ' + a[1] + 'C' + (a[0] + (b[0] - a[0]) * 0.3).toFixed(1) + ' ' + (a[1] + sag).toFixed(1) + ' ' + (b[0] - (b[0] - a[0]) * 0.3).toFixed(1) + ' ' + (b[1] + sag).toFixed(1) + ' ' + b[0] + ' ' + b[1]; }
    function drawWire() {
      var k = wireCalc(), kind = wireKind(k); setView(480, 330);
      q('[data-role=title]').innerHTML = '② 스피커 배선 <small>선 끝을 끌어다 단자에 놓아요</small>';
      var s = rect(14, 60, 112, 180, '#1f2933', '#0b0f14', 10) + T(70, 86, '파워앰프', { size: 14, weight: 800, fill: '#fff' }) + T(70, 105, '출력 20 V', { size: 12.5, fill: '#cbd5e1' }) + T(70, 121, '(교육용)', { size: 11.5, fill: '#94a3b8' });
      s += T(108, 135, '+', { size: 15, weight: 900, fill: '#fca5a5', anchor: 'end' }) + T(108, 205, '−', { size: 17, weight: 900, fill: '#e5e7eb', anchor: 'end' });
      s += T(70, 160, kind === '단락' ? '보호 동작!' : isFinite(k.z) ? f1(k.i) + ' A' : '— A', { size: 14, weight: 900, fill: kind === '단락' ? '#fca5a5' : '#fde68a' });
      s += T(70, 228, kind === '단락' ? '' : '부하 ' + zt(k.z), { size: 12, fill: '#cbd5e1' });
      [['A', 20, k.iA, k.pA], ['B', 173, k.iB, k.pB]].forEach(function (sp) { var y = sp[1], live = Math.abs(sp[2]) > 1e-6, rev = sp[2] < -1e-6;
        s += rect(330, y, 136, 110, '#fff', live ? (rev ? '#dc2626' : '#0e7490') : C.line, 10);
        s += '<circle cx="420" cy="' + (y + 52) + '" r="34" fill="#e2e8f0" stroke="#475569" stroke-width="2"/><circle cx="420" cy="' + (y + 52) + '" r="16" fill="#334155"' + (live ? ' class="sim-pe-cone"' : '') + '/>';
        s += T(398, y + 102, '스피커 ' + sp[0] + ' · 8 Ω', { size: 13, weight: 800 });
        s += T(352, y + 38, '+', { size: 14, weight: 900, fill: '#dc2626' }) + T(352, y + 84, '−', { size: 16, weight: 900 });
        if (live) s += T(462, y + 14, (rev ? '극성 반대 · ' : '') + f1(sp[3]) + ' W', { size: 12, weight: 800, fill: rev ? '#dc2626' : '#0e7490', anchor: 'end' });
      });
      s += rect(14, 270, 300, 54, '#fff', '#94a3b8', 8).replace('/>', ' stroke-dasharray="5 4"/>') + T(24, 287, '선 보관함', { size: 12, fill: C.sub, anchor: 'start' });
      Object.keys(TERMS).forEach(function (id) { var p = TERMS[id]; s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="#fde68a" stroke="' + (id.charAt(1) === '+' ? '#dc2626' : '#111827') + '" stroke-width="3"/>'; });
      S.wires.forEach(function (w, i) { var a = endPos(w[0]), b = endPos(w[1]); s += '<path d="' + wirePath(a, b) + '" fill="none" stroke="' + WIRE_COL[i] + '" stroke-width="4" stroke-linecap="round" opacity=".92"/>'; });
      S.wires.forEach(function (w, i) { [0, 1].forEach(function (e) { var p = endPos(w[e]); s += '<g data-drag="wend" data-w="' + i + '" data-e="' + e + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="16" fill="transparent"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="6.5" fill="' + WIRE_COL[i] + '" stroke="#fff" stroke-width="2"/></g>'; }); });
      layer.innerHTML = s;
      q('[data-role=hint]').textContent = '선 끝(동그라미)을 끌어서 앰프나 스피커 단자(노란 동그라미) 근처에 놓으면 붙어요. 보관함의 선 2개도 쓸 수 있어요. 빨간 + 는 + 끼리, − 는 − 끼리 이어요.';
      var msg, cls = '';
      if (kind === '단락') { msg = '앰프의 + 와 − 가 선으로 바로 붙었어요(단락). 막는 것이 0 Ω 이라 전기가 끝없이 흐르려 해요. 그래서 실제 앰프는 보호 회로가 출력을 끊어요. 그 선을 떼어 내요.'; cls = 'bad'; }
      else if (kind === '끊김') { msg = '앰프에서 스피커까지 길이 끊겼어요. 전류가 흐를 길이 없어서 소리가 안 나요.'; cls = 'warn'; }
      else if ((k.iA < -1e-6) || (k.iB < -1e-6)) { msg = '한 스피커의 + · − 가 거꾸로예요(극성 반대). 소리는 나요. 하지만 두 스피커가 서로 반대로 움직여서 저음이 약해져요.'; cls = 'warn'; }
      else if (kind === '직렬') { msg = '직렬(한 줄)이에요. 저항이 더해져 16 Ω 이에요. 같은 20 V 에서 전류가 줄어요. 두 스피커를 합해 ' + f1(k.pA + k.pB) + ' W 예요.'; }
      else if (kind === '병렬') { msg = '병렬(나란히)이에요. 8 Ω 두 대가 나란히 이어져 4 Ω 이에요. 같은 20 V 에서 스피커마다 50 W 예요. 앰프 전류는 5 A 예요.'; cls = 'ok'; }
      else if (kind === '한 대') { msg = '지금은 스피커 한 대만 소리가 나요(8 Ω). 남은 선으로 스피커 B 를 이어 봐요.'; }
      else msg = '연결 상태를 확인해요.';
      q('[data-role=read]').innerHTML = '<h4>앰프에 이어진 전체 저항 <small>합친 Ω</small></h4>' +
        '<div class="sim-row"><span>연결</span><b class="' + (kind === '병렬' && cls === 'ok' ? 'ok' : kind === '단락' ? 'bad' : '') + '">' + kind + '</b></div>' +
        '<div class="sim-row"><span>합친 저항 (Ω)</span><b>' + zt(k.z) + '</b></div>' +
        '<div class="sim-row"><span>앰프 전류 (20 V ÷ Z)</span><b>' + (k.short ? '보호 동작' : f2(k.i) + ' A') + '</b></div>' +
        '<div class="sim-row"><span>스피커 A 전력</span><b>' + f1(k.pA) + ' W</b></div><div class="sim-row"><span>스피커 B 전력</span><b>' + f1(k.pB) + ' W</b></div>' +
        '<p class="sim-pe-eq">한 줄(직렬): 8 + 8 = 16 Ω<br>나란히(병렬): 8 Ω 둘 → 4 Ω</p>' +
        '<p class="sim-pe-msg ' + cls + '" role="status">' + msg + '</p>' +
        '<div class="sim-pe-chips"><button type="button" class="sim-btn" data-act="wreset">선 처음 상태로</button></div>' +
        '<p class="sim-note">스피커 임피던스는 실제로 주파수마다 달라요. 실습에서는 8 Ω 고정 저항처럼 계산해요. 앰프는 설명서의 최소 임피던스보다 낮게 연결하지 않아요.</p>';
    }

    /* ---------------- ③ 신호 레벨 */
    var DIVS = [1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20];
    function divTxt(d) { return d < 0.1 ? +(d * 1000).toPrecision(2) + ' mV' : +d.toPrecision(2) + ' V'; }
    function drawLevel() {
      var j = probeJack(); setView(480, 340);
      q('[data-role=title]').innerHTML = '③ 신호 레벨 <small>프로브를 끌어서 단자에 대 봐요</small>';
      var s = '';
      JACKS.forEach(function (J) { var on = S.probe.at === J.id;
        s += rect(J.x - 54, 12, 108, 88, '#fff', on ? J.col : (S.measured[J.id] ? '#94a3b8' : C.line), 10) + T(J.x, 33, J.name, { size: 14, weight: 800, fill: J.col }) + T(J.x, 51, J.sub, { size: 11.5, fill: C.sub });
        s += '<circle cx="' + J.x + '" cy="78" r="12" fill="#1f2933" stroke="' + J.col + '" stroke-width="3"/><circle cx="' + J.x + '" cy="78" r="4" fill="#fde68a"/>';
        if (S.measured[J.id]) s += T(J.x + 36, 84, '✓', { size: 13, weight: 900, fill: '#059669' });
      });
      // 오실로스코프
      s += rect(14, 196, 300, 136, '#0b1626', '#1e293b', 8);
      for (var gx = 1; gx < 10; gx++) s += '<path d="M' + (14 + gx * 30) + ' 200V328" stroke="#1e3a5f" stroke-width="1"/>';
      for (var gy = 1; gy < 8; gy++) s += '<path d="M18 ' + (196 + gy * 17) + 'H310" stroke="' + (gy === 4 ? '#335a85' : '#1e3a5f') + '" stroke-width="1"/>';
      var div = 1, amp = 0;
      if (j) { var pk = j.v * Math.SQRT2; if (S.fixedScale) div = 10; else { div = DIVS[DIVS.length - 1]; for (var di = 0; di < DIVS.length; di++) if (pk / DIVS[di] <= 3.2) { div = DIVS[di]; break; } } amp = clamp(pk / div, 0, 3.9) * 17; }
      s += wave(18, 292, 264, amp, sinF(3), j ? j.col === '#0e7490' ? '#5eead4' : j.col === '#059669' ? '#6ee7b7' : j.col === '#2563eb' ? '#93c5fd' : '#fdba74' : '#5eead4', 2.2, 200);
      s += T(22, 214, '오실로스코프', { size: 12, weight: 700, fill: '#94a3b8', anchor: 'start' }) + T(308, 214, '한 칸 = ' + divTxt(div), { size: 12.5, weight: 700, fill: '#fde68a', anchor: 'end' });
      s += T(22, 327, '0 V 를 가운데로 + · − 를 오가요 (교류)', { size: 11, fill: '#64748b', anchor: 'start' });
      // 디지털 표시
      s += rect(326, 196, 140, 136, '#1f2933', '#0b0f14', 8) + T(396, 217, '레벨 미터', { size: 12.5, weight: 700, fill: '#cbd5e1' });
      if (j) s += T(396, 248, vtxt(j.v), { size: 20, weight: 900, fill: '#fff' }) + T(396, 266, '평소 크기 (RMS)', { size: 11, fill: '#94a3b8' }) + T(396, 290, sg(dbu(j.v)) + ' dBu', { size: 15, weight: 800, fill: '#fde68a' }) + T(396, 312, sg(dbv(j.v)) + ' dBV', { size: 13, weight: 700, fill: '#93c5fd' });
      else s += T(396, 270, '신호 없음', { size: 14, weight: 800, fill: '#64748b' }) + T(396, 292, '프로브를 단자에', { size: 11.5, fill: '#94a3b8' });
      // 프로브 선 + 프로브
      var px = S.probe.x, py = S.probe.y;
      s += '<path d="M164 196C164 170 ' + px + ' ' + (py + 60) + ' ' + px + ' ' + (py + 22) + '" fill="none" stroke="#475569" stroke-width="4" stroke-linecap="round"/>';
      s += '<g data-drag="probe"><circle cx="' + px + '" cy="' + py + '" r="22" fill="transparent"/><rect x="' + (px - 7) + '" y="' + (py + 4) + '" width="14" height="22" rx="4" fill="#dc2626"/><path d="M' + px + ' ' + (py - 10) + 'V' + (py + 6) + '" stroke="#e5e7eb" stroke-width="3" stroke-linecap="round"/><circle cx="' + px + '" cy="' + py + '" r="5" fill="#fde68a" stroke="#0f172a" stroke-width="1.5"/></g>';
      if (!S.probe.at) s += T(px + 16, py + 24, '프로브', { size: 12, weight: 700, fill: '#dc2626', anchor: 'start' });
      layer.innerHTML = s;
      q('[data-role=hint]').textContent = '빨간 프로브를 끌어서 위 단자 네 곳에 차례로 대요. 놓는 순간 미터가 읽어요. 「같은 눈금」으로 바꾸면 크기 차이가 한눈에 보여요.';
      var X = function (d) { return clamp((d + 60) / 100 * 100, 0, 100); };
      var rows = JACKS.map(function (J) { return '<tr><td>' + (S.measured[J.id] ? '✓ ' : '') + esc(J.kind) + '</td><td class="r">' + (S.measured[J.id] ? vtxt(J.v) : '—') + '</td><td class="r">' + (S.measured[J.id] ? sg(dbu(J.v)) : '—') + '</td></tr>'; }).join('');
      var n = JACKS.filter(function (J) { return S.measured[J.id]; }).length;
      q('[data-role=read]').innerHTML = '<h4>잰 값 비교 <small>' + n + ' / 4 곳</small></h4>' +
        '<table class="sim-pe-tbl"><tr><th>신호</th><th class="r">전압</th><th class="r">dBu</th></tr>' + rows + '</table>' +
        '<div class="sim-pe-ladder" aria-hidden="true">' + JACKS.filter(function (J) { return S.measured[J.id]; }).map(function (J) { return '<i style="left:' + X(dbu(J.v)).toFixed(1) + '%;background:' + J.col + '"></i>'; }).join('') +
          [-60, -20, 20].map(function (d) { return '<span style="left:' + X(d) + '%">' + (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d) + '</span>'; }).join('') + '<span style="left:96%">dBu</span></div>' +
        '<div class="sim-pe-chips"><button type="button" class="sim-pe-chip" data-act="scale" aria-pressed="' + !S.fixedScale + '">자동 눈금</button><button type="button" class="sim-pe-chip" data-act="scale" aria-pressed="' + S.fixedScale + '">같은 눈금 (10 V/칸)</button></div>' +
        (j ? '<p class="sim-pe-msg">' + esc(j.kind) + ': ' + vtxt(j.v) + ' = ' + sg(dbu(j.v)) + ' dBu = ' + sg(dbv(j.v)) + ' dBV' + (j.id === 'spk' ? ' — 이 전압을 콘솔 입력에 넣으면 망가질 수 있어요.' : j.id === 'mic' ? ' — 콘솔 MIC 입력의 게인으로 키워야 해요.' : '') + '</p>' : '') +
        '<p class="sim-note">마이크 값은 Shure SM58 사양이에요(1 Pa = 94 dB SPL 소리에서 1.85 mV). 스피커 값은 8 Ω 에 100 W 를 보낼 때의 계산값이에요. 실제 신호는 노래에 따라 계속 바뀌어요.</p>';
    }

    /* ---------------- ④ 평형 연결 */
    function drawBal() {
      var k = balCalc(), bal = S.bal.mode === 'bal'; setView(480, 300);
      q('[data-role=title]').innerHTML = '④ 평형 · 비평형 연결 <small>잡음원을 끌어 케이블 가까이 놓아 봐요</small>';
      var s = rect(10, 50, 80, 70, '#1f2933', null, 8) + T(50, 80, '건반', { size: 12.5, weight: 800, fill: '#fff' }) + T(50, 100, '무대', { size: 11.5, fill: '#cbd5e1' });
      s += rect(390, 50, 80, 70, '#1f2933', null, 8) + T(430, 80, '콘솔 입력', { size: 12, weight: 800, fill: '#fff' }) + T(430, 100, '방송실', { size: 11.5, fill: '#cbd5e1' });
      s += T(240, 30, (bal ? '평형 XLR 케이블 · 30 m (교육용)' : '비평형 TS 케이블 · 30 m (교육용)'), { size: 12, weight: 800, fill: bal ? '#0e7490' : '#dc2626' });
      if (bal) { s += wave(90, 300, CABLE_Y - 3, 6, sinF(7), '#be123c', 2.4, 160) + wave(90, 300, CABLE_Y - 3, -6, sinF(7), '#2563eb', 2.4, 160) + '<path d="M90 ' + (CABLE_Y + 11) + 'H390" stroke="#64748b" stroke-width="2.4"/>';
        s += T(240, CABLE_Y - 22, '핫 · 콜드 (꼬임) + 실드', { size: 12, fill: C.sub }); }
      else { s += '<path d="M90 ' + (CABLE_Y - 4) + 'H390" stroke="#be123c" stroke-width="2.4"/><path d="M90 ' + (CABLE_Y + 8) + 'H390" stroke="#64748b" stroke-width="2.4"/>' + T(240, CABLE_Y - 18, '신호선 + 실드(그라운드)', { size: 12, fill: C.sub }); }
      if (k.c > 0.02) for (var i = 0; i < 5; i++) { var x = S.bal.nx - 48 + i * 24, y0 = S.bal.ny - 22, y1 = CABLE_Y + 16; s += '<path d="M' + x + ' ' + y0 + 'Q' + (x + 8) + ' ' + ((y0 + y1) / 2) + ' ' + x + ' ' + y1 + '" fill="none" stroke="#f59e0b" stroke-width="1.6" stroke-dasharray="3 3" opacity="' + (0.25 + 0.7 * k.c).toFixed(2) + '"/>'; }
      var nx = S.bal.nx, ny = S.bal.ny;
      s += '<g data-drag="noise"><rect x="' + (nx - 74) + '" y="' + (ny - 22) + '" width="148" height="44" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><path d="M' + (nx - 54) + ' ' + (ny - 12) + 'l-8 13h7l-5 12 13-16h-7l5-9z" fill="#d97706"/>' +
        '<text x="' + (nx + 8) + '" y="' + (ny - 2) + '" font-size="13" font-weight="800" fill="#92400e" text-anchor="middle">조명 디머 전원선</text><text x="' + (nx + 8) + '" y="' + (ny + 15) + '" font-size="11.5" fill="#92400e" text-anchor="middle">잡음원 · 끌어요</text></g>';
      layer.innerHTML = s;
      q('[data-role=hint]').textContent = '노란 잡음원을 끌어서 케이블 가까이 놓으면 잡음이 케이블에 들어와요. 오른쪽에서 연결 방식을 바꿔 콘솔에 들어가는 소리를 비교해요.';
      var sig = sinF(1.5), buzz = function (u) { return buzzF(u); }, H = 40;
      function trace(y, f, col, lab) { return '<text x="6" y="' + (y - 14) + '" font-size="10.5" font-weight="700" fill="#475569">' + lab + '</text>' + '<path d="M70 ' + y + 'H290" stroke="#e2e8f0"/>' + wave(70, 220, y, 12, f, col, 2, 160); }
      var sc = '<svg class="sim-pe-svg" viewBox="0 0 296 ' + (H * 3 + 20) + '" role="img" aria-label="케이블 안 신호 파형" font-family="Pretendard, system-ui, sans-serif" style="touch-action:auto">';
      if (bal) sc += trace(32, function (u) { return sig(u) * 0.8 + k.n * buzz(u); }, '#be123c', '핫 (2번)') + trace(32 + H, function (u) { return -sig(u) * 0.8 + k.n * buzz(u); }, '#2563eb', '콜드 (3번)') + trace(32 + 2 * H, function (u) { return sig(u) + k.out * buzz(u); }, '#0e7490', '콘솔: 핫 − 콜드');
      else sc += trace(32, function (u) { return sig(u) * 0.8 + k.n * buzz(u); }, '#be123c', '신호선') + trace(32 + H, function (u) { return 0; }, '#64748b', '그라운드') + trace(32 + 2 * H, function (u) { return sig(u) * 0.8 + k.out * buzz(u); }, '#dc2626', '콘솔 입력');
      sc += '</svg>';
      var nPct = clamp(k.out / 0.9 * 100, 0, 100), cls = nPct > 40 ? 'bad' : nPct > 8 ? 'warn' : '';
      var msg = k.c < 0.6 ? '잡음원이 멀어서 잡음이 거의 안 들어와요. 잡음원을 케이블 가까이 끌어와 봐요.' : bal ? '잡음은 핫 · 콜드에 똑같이 들어왔어요. 콘솔이 둘의 차이만 써서 잡음이 지워졌어요.' : '잡음이 신호선에 그대로 섞여 콘솔까지 가요. 「지지직」 소리가 나요. 평형 연결로 바꿔 봐요.';
      q('[data-role=read]').innerHTML = '<h4>케이블 안 신호 <small>교육용 파형</small></h4>' + sc +
        '<div class="sim-row"><span>케이블에 들어온 잡음</span><b>' + Math.round(k.c * 100) + ' %</b></div>' +
        '<div><span style="font-size:.76rem;color:#64748b">콘솔에 남은 잡음</span><div class="sim-pe-bar"><i class="' + cls + '" style="width:' + Math.max(1, nPct).toFixed(0) + '%"></i></div></div>' +
        '<div class="sim-pe-chips" role="group" aria-label="연결 방식"><button type="button" class="sim-pe-chip" data-act="bal" data-v="unbal" aria-pressed="' + !bal + '">비평형 (TS)</button><button type="button" class="sim-pe-chip" data-act="bal" data-v="bal" aria-pressed="' + bal + '">평형 (XLR)</button></div>' +
        '<p class="sim-pe-msg ' + (k.c >= 0.6 ? (bal ? 'ok' : 'bad') : '') + '" role="status">' + msg + '</p>' +
        '<p class="sim-note">그림은 이해를 돕게 콜드에 뒤집힌 신호를 그렸어요. 잡음이 지워지는 핵심은 두 선이 잡음을 똑같이 받는 거예요. 남은 잡음 2 % 는 교육용 값이에요.</p>';
    }

    /* ---------------- ⑤ 그라운드 루프 */
    function drawGround() {
      var G = S.gnd, k = gndCalc(); setView(480, 330);
      q('[data-role=title]').innerHTML = '⑤ 그라운드 루프 찾기 <small>험의 원인을 찾아 안전하게 없애요</small>';
      var s = '';
      if (k.loop) s += '<path d="M66 82V52H150M234 52H352M407 82V178M407 212V304H70V250M70 228C70 160 66 130 66 82" fill="none" stroke="#ef4444" stroke-width="10" stroke-linejoin="round" opacity="' + (k.hum ? 0.22 : 0.1) + '"/>';
      s += rect(16, 24, 100, 58, '#1f2933', null, 8) + T(66, 49, '건반', { size: 14, weight: 800, fill: '#fff' }) + T(66, 69, '접지 플러그', { size: 11.5, fill: '#cbd5e1' });
      s += '<path d="M116 52H150" stroke="#334155" stroke-width="3"/>' + rect(150, 28, 84, 50, '#334155', null, 8) + T(192, 50, 'DI 박스', { size: 13, weight: 800, fill: '#fff' }) + T(192, 68, G.lift ? 'LIFT 켬' : 'GND 연결', { size: 11, fill: G.lift ? '#fde68a' : '#cbd5e1' });
      s += '<g data-act="lift"><rect x="152" y="84" width="80" height="28" rx="14" fill="' + (G.lift ? '#f59e0b' : '#cbd5e1') + '" stroke="#475569" stroke-width="1.5"/><circle cx="' + (G.lift ? 217 : 167) + '" cy="98" r="11" fill="#fff" stroke="#475569"/><text x="192" y="130" font-size="12" font-weight="800" fill="#475569" text-anchor="middle">GND LIFT 스위치</text></g>';
      s += '<path d="M234 52H352" stroke="#334155" stroke-width="3"/>' + T(293, 43, 'XLR · 실드 = 1번 핀', { size: 11, fill: C.sub });
      if (G.lift) s += '<path d="M240 46l8 12M248 46l-8 12" stroke="#f59e0b" stroke-width="2.4"/>';
      s += rect(352, 24, 112, 58, '#1f2933', null, 8) + T(408, 49, '콘솔', { size: 14, weight: 800, fill: '#fff' }) + T(408, 69, '방송실', { size: 11.5, fill: '#cbd5e1' });
      s += '<path d="M407 82V178" stroke="#334155" stroke-width="3"/>' + rect(380, 178, 54, 36, '#fff', '#0f172a', 6) + '<circle cx="397" cy="196" r="3.5" fill="#0f172a"/><circle cx="417" cy="196" r="3.5" fill="#0f172a"/>' + T(407, 232, '방송실 콘센트', { size: 12, weight: 700 }) + T(407, 248, '회로 1', { size: 11, fill: C.sub });
      s += '<path d="M70 258V304H407V214M190 258V304" fill="none" stroke="#92400e" stroke-width="2" stroke-dasharray="6 4"/>' + T(240, 324, '건물 접지선 — 회로 1 과 2 는 접지 전압이 조금 달라요', { size: 11.5, fill: '#92400e' });
      Object.keys(OUTLETS).forEach(function (id) { var o = OUTLETS[id]; s += rect(o[0] - 27, o[1] - 18, 54, 36, '#fff', '#0f172a', 6) + '<circle cx="' + (o[0] - 10) + '" cy="' + o[1] + '" r="3.5" fill="#0f172a"/><circle cx="' + (o[0] + 10) + '" cy="' + o[1] + '" r="3.5" fill="#0f172a"/>' + T(o[0] + 32, o[1] - 2, o[2], { size: 12, weight: 700, anchor: 'start' }) + T(o[0] + 32, o[1] + 14, o[3], { size: 11, fill: C.sub, anchor: 'start' }); });
      var px = G.plug.x, py = G.plug.y;
      s += '<path d="M66 82C66 140 ' + px + ' ' + (py - 70) + ' ' + px + ' ' + (py - 14) + '" fill="none" stroke="#111827" stroke-width="3.5"/>';
      s += '<g data-drag="plug"><circle cx="' + px + '" cy="' + py + '" r="22" fill="transparent"/><rect x="' + (px - 15) + '" y="' + (py - 14) + '" width="30" height="28" rx="6" fill="#111827"/><circle cx="' + (px - 6) + '" cy="' + py + '" r="2.5" fill="#e5e7eb"/><circle cx="' + (px + 6) + '" cy="' + py + '" r="2.5" fill="#e5e7eb"/>' +
        (G.adp.on ? '<rect x="' + (px - 18) + '" y="' + (py + 8) + '" width="36" height="12" rx="3" fill="#dc2626"/>' : '') + '</g>';
      if (!G.plug.at) s += T(px + 24, py + 4, '전원 빠짐', { size: 12, weight: 800, fill: '#b91c1c', anchor: 'start' });
      if (!G.adp.on) { var ax = G.adp.x, ay = G.adp.y; s += '<g data-drag="adp"><rect x="' + (ax - 62) + '" y="' + (ay - 19) + '" width="124" height="38" rx="8" fill="#fee2e2" stroke="#dc2626" stroke-width="1.8"/><text x="' + ax + '" y="' + (ay - 2) + '" font-size="12" font-weight="800" fill="#b91c1c" text-anchor="middle">접지 끊는 어댑터</text><text x="' + ax + '" y="' + (ay + 13) + '" font-size="10.5" fill="#b91c1c" text-anchor="middle">(위험 · 시험용)</text></g>'; }
      else s += '<g data-act="adpoff"><rect x="238" y="177" width="124" height="38" rx="8" fill="#dc2626"/><text x="300" y="201" font-size="12.5" font-weight="800" fill="#fff" text-anchor="middle">어댑터 빼기</text></g>';
      if (k.hum) s += T(300, 150, '「웅-」 험이 나요', { size: 17, weight: 900, fill: '#dc2626' }) + T(300, 168, '빨간 고리 = 그라운드 루프', { size: 12, fill: '#dc2626' });
      layer.innerHTML = s;
      q('[data-role=hint]').textContent = '건반 전원 플러그를 끌어 다른 콘센트에 꽂거나, DI 의 GND LIFT 스위치를 눌러 봐요. 빨간 어댑터는 무엇이 위험한지 보여 주는 시험용이에요.';
      var bars = [[60, 1], [120, 0.55], [180, 0.42], [240, 0.3], [300, 0.22]];
      var msg, cls = '';
      if (G.adp.on) { msg = '험은 사라졌지만 매우 위험해요. 전원 플러그의 접지를 끊었기 때문이에요. 고장 나면 장비 몸체와 케이블에 감전될 전압이 걸릴 수 있어요. 어댑터를 빼고 다른 방법을 써요.'; cls = 'bad'; }
      else if (!k.powered) { msg = '건반 전원이 빠졌어요. 소리도 안 나요. 콘센트에 꽂아 주세요.'; cls = 'warn'; }
      else if (k.hum) { msg = '건반은 회로 2, 콘솔은 회로 1 에서 전원을 받아요. 그런데 XLR 실드로도 서로 이어졌어요. 접지가 고리(루프)가 되어 실드로 전류가 돌아요.'; cls = 'bad'; }
      else if (G.plug.at === 'A2') { msg = '건반 전원을 콘솔과 같은 회로 1(음향 전용 콘센트)로 옮겼어요. 접지 전압 차이가 없어져 험이 사라졌어요.'; cls = 'ok'; }
      else { msg = 'DI 의 GND LIFT 로 신호 케이블 쪽 접지만 끊었어요. 고리가 열려 험이 사라졌어요. 전원 접지는 그대로라 안전해요.'; cls = 'ok'; }
      q('[data-role=read]').innerHTML = '<h4>험 분석기 <small>스피커 소리의 낮은 주파수</small></h4>' +
        '<div class="sim-pe-spec" aria-label="험 스펙트럼">' + bars.map(function (b) { return '<div><b style="height:' + (k.hum ? 48 * b[1] : 2).toFixed(0) + 'px"></b><small>' + b[0] + '</small></div>'; }).join('') + '</div>' +
        '<p class="sim-note" style="margin-top:2px">가로: Hz · 한국 전원 60 Hz 와 그 배음</p>' +
        '<div class="sim-row"><span>건반 전원</span><b>' + (G.plug.at ? OUTLETS[G.plug.at][2] + ' (' + OUTLETS[G.plug.at][3] + ')' : '빠짐') + '</b></div>' +
        '<div class="sim-row"><span>DI GND LIFT</span><b>' + (G.lift ? '켬' : '끔') + '</b></div>' +
        '<div class="sim-row"><span>험</span><b class="' + (k.hum ? 'bad' : 'ok') + '">' + (k.hum ? '들려요' : '없어요') + '</b></div>' +
        '<p class="sim-pe-msg ' + cls + '" role="status">' + msg + '</p>' +
        '<p class="sim-note">실제 현장에서는 장비를 하나씩 빼 보며 험이 사라지는 곳을 찾아요. 전원 플러그의 접지는 절대 끊지 않아요(Jensen 기술 자료).</p>';
    }

    /* ---------------- ⑥ 멀티탭 · 전원 순서 */
    function drawTap() {
      var T2 = S.tap, k = tapCalc(); setView(480, 330);
      q('[data-role=title]').innerHTML = '⑥ 멀티탭 용량 · 전원 순서 <small>플러그를 끌어 꽂고, 순서대로 켜요</small>';
      var s = '';
      DEVS.forEach(function (d) { var st = T2.dev[d.id], on = st.on;
        s += rect(d.x - 54, 12, 108, 92, d.id === 'pot' ? '#fff7ed' : '#1f2933', d.id === 'pot' ? '#fdba74' : '#0b0f14', 10) + T(d.x, 34, d.name, { size: 12.5, weight: 800, fill: d.id === 'pot' ? '#9a3412' : '#fff' }) + T(d.x, 52, d.w + ' W', { size: 11, weight: 700, fill: d.id === 'pot' ? '#c2410c' : '#fde68a' });
        s += '<g data-act="pw" data-v="' + d.id + '"><rect x="' + (d.x - 36) + '" y="64" width="72" height="28" rx="14" fill="' + (on ? '#16a34a' : '#475569') + '" stroke="#0f172a"/><circle cx="' + (d.x - 20) + '" cy="78" r="5" fill="' + (on ? '#86efac' : '#1f2933') + '"/><text x="' + (d.x + 6) + '" y="83" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">' + (on ? '켜짐' : '전원') + '</text></g>';
        var p = st.sock != null ? [SOCKS[st.sock], SOCK_Y] : [st.x, st.y];
        s += '<path d="M' + d.x + ' 104C' + d.x + ' 150 ' + p[0] + ' ' + (p[1] - 60) + ' ' + p[0] + ' ' + (p[1] - 14) + '" fill="none" stroke="#111827" stroke-width="3"/>';
      });
      s += '<path d="M40 236H16V322" fill="none" stroke="#111827" stroke-width="4"/>' + rect(40, 210, 400, 52, T2.tripped ? '#fee2e2' : '#e2e8f0', T2.tripped ? '#dc2626' : '#94a3b8', 12);
      SOCKS.forEach(function (x) { s += '<circle cx="' + x + '" cy="' + SOCK_Y + '" r="16" fill="#fff" stroke="#64748b" stroke-width="2"/><circle cx="' + (x - 6) + '" cy="' + SOCK_Y + '" r="2.6" fill="#334155"/><circle cx="' + (x + 6) + '" cy="' + SOCK_Y + '" r="2.6" fill="#334155"/>'; });
      s += '<g data-act="reset"><rect x="398" y="222" width="36" height="28" rx="6" fill="' + (T2.tripped ? '#dc2626' : '#94a3b8') + '"/><text x="416" y="241" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">리셋</text></g>';
      s += T(240, 281, '멀티탭에 적힌 16 A · 우리 전압 220 V', { size: 12.5, weight: 800, fill: '#334155' }) + T(240, 299, '최대 220 × 16 = 3520 W · 여유 80 % = 2816 W', { size: 11.5, fill: C.sub });
      var pct = clamp(k.a / TAP_A, 0, 1.2);
      s += rect(150, 306, 260, 12, '#e2e8f0', null, 6) + '<rect x="150" y="306" width="' + (260 * Math.min(1, pct)).toFixed(1) + '" height="12" rx="6" fill="' + (k.w > TAP_SAFE ? '#dc2626' : k.w > TAP_SAFE * 0.85 ? '#f59e0b' : '#10b981') + '"/>' + '<path d="M' + (150 + 260 * 0.8) + ' 302V322" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="2 2"/>';
      s += T(142, 318, f1(k.a) + ' A', { size: 12.5, weight: 800, anchor: 'end' });
      DEVS.forEach(function (d) { var st = T2.dev[d.id], p = st.sock != null ? [SOCKS[st.sock], SOCK_Y] : [st.x, st.y];
        s += '<g data-drag="tplug" data-v="' + d.id + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="22" fill="transparent"/><rect x="' + (p[0] - 13) + '" y="' + (p[1] - 14) + '" width="26" height="28" rx="6" fill="' + (d.id === 'pot' ? '#c2410c' : '#111827') + '"/><text x="' + p[0] + '" y="' + (p[1] + 4) + '" font-size="10.5" font-weight="800" fill="#fff" text-anchor="middle">' + (d.id === 'con' ? '콘솔' : d.id === 'pot' ? '포트' : '앰프') + '</text></g>'; });
      if (T2.tripped) s += T(240, 196, '과부하! 멀티탭 차단기가 내려갔어요', { size: 13, weight: 900, fill: '#dc2626' });
      layer.innerHTML = s;
      q('[data-role=hint]').textContent = '각 장비의 플러그를 끌어 멀티탭 구멍에 꽂아요. 그다음 장비의 「전원」 버튼을 눌러 켜요. 켜는 순서와 전체 전력을 함께 봐요.';
      var rows = DEVS.map(function (d) { var st = T2.dev[d.id]; return '<tr><td>' + esc(d.name) + '</td><td class="r">' + (st.sock != null ? '꽂힘' : '빠짐') + '</td><td class="r">' + (st.on ? d.w + ' W' : '—') + '</td></tr>'; }).join('');
      q('[data-role=read]').innerHTML = '<h4>전력 계산 <small>I = P ÷ V</small></h4>' +
        '<div class="sim-row"><span>켜진 장비 합계</span><b class="' + (k.w > TAP_SAFE ? 'bad' : '') + '">' + k.w + ' W</b></div>' +
        '<div class="sim-row"><span>전류 = ' + k.w + ' ÷ 220</span><b class="' + (k.a > TAP_A ? 'bad' : k.w > TAP_SAFE ? 'warn' : '') + '">' + f1(k.a) + ' A / 16 A</b></div>' +
        '<table class="sim-pe-tbl"><tr><th>장비</th><th class="r">플러그</th><th class="r">쓰는 전력</th></tr>' + rows + '</table>' +
        '<div class="sim-row"><span>켜는 순서</span><b class="' + (T2.order.a1 && T2.order.a2 ? 'ok' : '') + '">' + (T2.order.a1 && T2.order.a2 ? '콘솔 → 앰프 ✓' : '확인 중') + '</b></div>' +
        (T2.msg ? '<p class="sim-pe-msg ' + T2.cls + '" role="status">' + T2.msg + '</p>' : '<p class="sim-pe-msg">목표: 콘솔 · 앰프 2대를 꽂고 <b>콘솔 → 앰프</b> 순서로 켜요. 전체가 80 %(2816 W)를 넘지 않게 해요.</p>') +
        '<p class="sim-note">장비 소비 전력은 교육용 예시예요(앰프는 음량에 따라 달라요). 멀티탭에 「16 A 250 V」라고 적혀 있어도 우리 전압은 220 V 예요. 그래서 3520 W 가 한계예요. 벽 콘센트 용량도 따로 정해져 있어요.</p>';
    }
    function tapMsg(m, c) { S.tap.msg = m; S.tap.cls = c || ''; }
    function tapPower(id) {
      var T2 = S.tap, st = T2.dev[id], d = DEVS.filter(function (x) { return x.id === id; })[0];
      if (T2.tripped) { tapMsg('차단기가 내려가 있어요. 너무 많은 장비를 빼고 「리셋」을 눌러요.', 'bad'); return; }
      if (st.sock == null) { tapMsg(d.name + ' 플러그가 빠져 있어요. 먼저 멀티탭에 꽂아요.', 'warn'); return; }
      if (st.on) {
        st.on = false;
        if (id === 'con' && (T2.dev.a1.on || T2.dev.a2.on)) { T2.order.a1 = false; T2.order.a2 = false; tapMsg('앰프가 켜진 채로 콘솔을 껐어요. 이때 「퍽」 소리가 스피커로 나갈 수 있어요. 끌 때는 앰프를 먼저 꺼요. 앰프를 끄고 다시 해 봐요.', 'bad'); }
        else { if (id === 'a1' || id === 'a2') T2.order[id] = false; tapMsg(d.name + ' 를 껐어요.', ''); }
        return;
      }
      st.on = true;
      if (id === 'a1' || id === 'a2') {
        T2.order[id] = T2.dev.con.on;
        if (!T2.dev.con.on) tapMsg(d.name + ' 를 콘솔보다 먼저 켰어요. 나중에 콘솔이 켜질 때 「퍽」 소리가 스피커로 나갈 수 있어요. 앰프를 끄고 콘솔부터 켜요.', 'bad');
        else tapMsg(d.name + ' 를 켰어요. 콘솔이 먼저 켜져 있어서 좋아요.', 'ok');
      } else if (id === 'con') tapMsg('콘솔을 켰어요. 이제 앰프를 켜요.', '');
      else tapMsg('커피포트를 켰어요. 전력이 아주 큰 기기예요.', 'warn');
      var k = tapCalc();
      if (k.a > TAP_A) { DEVS.forEach(function (x) { T2.dev[x.id].on = false; }); T2.order.a1 = false; T2.order.a2 = false; T2.tripped = true; tapMsg('합계 ' + k.w + ' W = ' + f1(k.a) + ' A 예요. 16 A 를 넘어서 멀티탭 차단기가 내려갔어요. 예배 중이면 모든 소리가 꺼져요. 커피포트처럼 열을 내는 큰 기기는 음향 멀티탭에 꽂지 않아요.', 'bad'); }
      else if (k.w > TAP_SAFE) tapMsg('합계 ' + k.w + ' W 로 권장 80 %(2816 W)를 넘었어요. 멀티탭과 콘센트가 뜨거워질 수 있어요.', 'warn');
    }

    /* ---------------- 포인터 · 드래그 */
    function svgPt(e) { var p = svgEl.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; var m = svgEl.getScreenCTM(); if (!m) return { x: 0, y: 0 }; var r = p.matrixTransform(m.inverse()); return { x: r.x, y: r.y }; }
    function vb() { var v = svgEl.viewBox.baseVal; return [v.width, v.height]; }
    function onDown(e) {
      var g = e.target.closest && e.target.closest('[data-drag]'); if (!g || !svgEl.contains(g)) return;
      e.preventDefault(); drag = { kind: g.getAttribute('data-drag'), w: +g.getAttribute('data-w'), e: +g.getAttribute('data-e'), v: g.getAttribute('data-v'), id: e.pointerId, moved: false };
      try { svgEl.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
      svgEl.classList.add('dragging'); if (drag.kind === 'knob') onMove(e);
    }
    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return; var p = svgPt(e), sz = vb(), x = clamp(p.x, 6, sz[0] - 6), y = clamp(p.y, 6, sz[1] - 6); drag.moved = true;
      if (drag.kind === 'knob') { var a = Math.atan2(p.x - 92, -(p.y - 186)) * 180 / Math.PI; a = clamp(a, -135, 135); S.ohm.v = clamp(Math.round((a + 135) / 270 * 48 * 2) / 2, 0, 48); }
      else if (drag.kind === 'wend') { var en = S.wires[drag.w][drag.e]; en.t = null; en.x = x; en.y = y; }
      else if (drag.kind === 'probe') { S.probe.at = null; S.probe.x = x; S.probe.y = clamp(y, 20, 180); }
      else if (drag.kind === 'noise') { S.bal.nx = clamp(x, 76, 404); S.bal.ny = clamp(y, 118, 278); }
      else if (drag.kind === 'plug') { S.gnd.plug.at = null; S.gnd.plug.x = x; S.gnd.plug.y = clamp(y, 100, 300); }
      else if (drag.kind === 'adp') { S.gnd.adp.x = clamp(x, 56, 424); S.gnd.adp.y = clamp(y, 20, 310); }
      else if (drag.kind === 'tplug') { var st = S.tap.dev[drag.v]; if (st.sock != null) { st.sock = null; if (st.on) { st.on = false; plugPulled(drag.v); } } st.x = x; st.y = clamp(y, 112, 318); }
      render();
    }
    function plugPulled(id) { var T2 = S.tap; if (id === 'a1' || id === 'a2') T2.order[id] = false; if (id === 'con' && (T2.dev.a1.on || T2.dev.a2.on)) { T2.order.a1 = false; T2.order.a2 = false; tapMsg('앰프가 켜진 채로 콘솔 플러그를 뽑았어요. 「퍽」 소리가 날 수 있어요. 끌 때는 앰프를 먼저 꺼요.', 'bad'); } }
    function onUp(e) {   // 손을 뗄 때 붙이기 · 판정
      if (!drag || e.pointerId !== drag.id) return; var d = drag; drag = null; svgEl.classList.remove('dragging');
      try { svgEl.releasePointerCapture(e.pointerId); } catch (er) { /* noop */ }
      if (d.kind === 'wend') { var en = S.wires[d.w][d.e], best = null, bd = 26; Object.keys(TERMS).forEach(function (id) { var dd = dist([en.x, en.y], TERMS[id]); if (dd < bd) { bd = dd; best = id; } }); if (best) en.t = best; }
      else if (d.kind === 'probe') { var bj = null, bdj = 40; JACKS.forEach(function (J) { var dd = dist([S.probe.x, S.probe.y], [J.x, 78]); if (dd < bdj) { bdj = dd; bj = J; } }); if (bj) { S.probe.at = bj.id; S.probe.x = bj.x; S.probe.y = 78; S.measured[bj.id] = true; } }
      else if (d.kind === 'plug') { var bo = null, bdo = 34; Object.keys(OUTLETS).forEach(function (id) { var dd = dist([S.gnd.plug.x, S.gnd.plug.y], OUTLETS[id]); if (dd < bdo) { bdo = dd; bo = id; } }); if (bo) { S.gnd.plug.at = bo; S.gnd.plug.x = OUTLETS[bo][0]; S.gnd.plug.y = OUTLETS[bo][1]; } }
      else if (d.kind === 'adp') { if (S.gnd.plug.at && dist([S.gnd.adp.x, S.gnd.adp.y], [S.gnd.plug.x, S.gnd.plug.y]) < 40) { S.gnd.adp.on = true; } }
      else if (d.kind === 'tplug') { var st = S.tap.dev[d.v], bs = null, bds = 30; SOCKS.forEach(function (x, i) { var used = DEVS.some(function (o) { return o.id !== d.v && S.tap.dev[o.id].sock === i; }); var dd = dist([st.x, st.y], [x, SOCK_Y]); if (!used && dd < bds) { bds = dd; bs = i; } }); if (bs != null) st.sock = bs; }
      if (S.panel === 'ground' && gndCalc().hum) S.gnd.seenHum = true;
      render(); checkTasks();
    }
    function onClick(e) {
      var b = e.target.closest && e.target.closest('[data-act]'); if (!b || !el.contains(b) || b.disabled) return;
      var act = b.getAttribute('data-act'), v = b.getAttribute('data-v');
      if (act === 'panel') { S.panel = v; if (v === 'ground' && gndCalc().hum) S.gnd.seenHum = true; renderNav(); render(); return; }
      if (act === 'r') S.ohm.r = +v;
      else if (act === 'rcycle') S.ohm.r = R_CHOICES[(R_CHOICES.indexOf(S.ohm.r) + 1) % R_CHOICES.length];
      else if (act === 'dv') S.ohm.v = clamp(S.ohm.v + parseFloat(v), 0, 48);
      else if (act === 'wreset') S.wires = [[{ t: 'P+' }, { t: 'A+' }], [{ t: 'P-' }, { t: 'A-' }], [{ t: null, x: 46, y: 302 }, { t: null, x: 126, y: 302 }], [{ t: null, x: 176, y: 302 }, { t: null, x: 256, y: 302 }]];
      else if (act === 'scale') S.fixedScale = b.textContent.indexOf('같은') >= 0;
      else if (act === 'bal') S.bal.mode = v === 'bal' ? 'bal' : 'unbal';
      else if (act === 'lift') S.gnd.lift = !S.gnd.lift;
      else if (act === 'adpoff') { S.gnd.adp.on = false; S.gnd.adp.x = 300; S.gnd.adp.y = 196; }
      else if (act === 'pw') tapPower(v);
      else if (act === 'reset') { if (S.tap.tripped) { var k = 0; DEVS.forEach(function (x) { if (S.tap.dev[x.id].sock != null) k += x.w; }); S.tap.tripped = false; tapMsg('차단기를 올렸어요. 장비는 모두 꺼진 상태예요. 콘솔부터 다시 켜요.' + (k > TAP_W ? ' 꽂힌 장비를 모두 켜면 또 넘쳐요.' : ''), ''); } }
      else return;
      render(); checkTasks();
    }
    function onKey(e) {
      if (S.panel !== 'ohm' || !(e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowLeft')) return;
      if (!(e.target && (e.target === svgEl || svgEl.contains(e.target)))) return;
      e.preventDefault(); S.ohm.v = clamp(S.ohm.v + (e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 0.5 : -0.5), 0, 48); render(); checkTasks();
    }
    svgEl.setAttribute('tabindex', '0'); svgEl.setAttribute('aria-label', '전기 실험대 (가상) — 끌기와 누르기로 조작');
    svgEl.addEventListener('pointerdown', onDown); svgEl.addEventListener('pointermove', onMove); svgEl.addEventListener('pointerup', onUp); svgEl.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClick); svgEl.addEventListener('keydown', onKey);
    renderNav(); render();

    return {
      destroy: function () { alive = false; svgEl.removeEventListener('pointerdown', onDown); svgEl.removeEventListener('pointermove', onMove); svgEl.removeEventListener('pointerup', onUp); svgEl.removeEventListener('pointercancel', onUp); el.removeEventListener('click', onClick); svgEl.removeEventListener('keydown', onKey); el.innerHTML = ''; },
      state: function () {
        var o = ohmCalc(), w = wireCalc(), b = balCalc(), g = gndCalc(), tp = tapCalc();
        return { ready: alive, done: Object.keys(S.done), panel: S.panel,
          ohm: { v: o.v, r: o.r, i: o.i, p: o.p },
          wire: { z: w.z, kind: wireKind(w), iA: w.iA, iB: w.iB, ends: S.wires.map(function (x) { return [x[0].t, x[1].t]; }) },
          level: { at: S.probe.at, measured: Object.keys(S.measured), fixedScale: S.fixedScale },
          bal: { mode: S.bal.mode, coupling: b.c, noiseOut: b.out },
          ground: { plug: S.gnd.plug.at, lift: S.gnd.lift, adapter: S.gnd.adp.on, hum: g.hum, seenHum: !!S.gnd.seenHum },
          tap: { watts: tp.w, amps: tp.a, tripped: S.tap.tripped, order: { a1: S.tap.order.a1, a2: S.tap.order.a2 }, dev: JSON.parse(JSON.stringify(S.tap.dev)) } };
      },
      set: function (o) { o = o || {}; if (o.panel && PANELS.some(function (p) { return p[0] === o.panel; })) { S.panel = o.panel; if (o.panel === 'ground' && gndCalc().hum) S.gnd.seenHum = true; } renderNav(); render(); return this.state(); },
      model: { TERMS: TERMS, JACKS: JACKS, OUTLETS: OUTLETS, SOCKS: SOCKS, SOCK_Y: SOCK_Y, DEVS: DEVS, KNOB: [92, 186], CABLE_Y: CABLE_Y }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.circuitLab = circuitLab;
})();

/* =========================================================================== 모듈 데이터 */
(function () {
  'use strict';
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['phys-elec'] = {
    id: 'phys-elec', path: 'physics', no: 2, noLabel: '02', status: 'ready', level: '기본', minutes: 40, img: 'img/modules/phys_elec.svg',
    title: '전기', sub: '전기를 미는 힘 · 흐르는 양 · 흐르기 어려운 정도부터 잡음 막기 · 전원 안전까지',
    topics: ['전압 · 전류 · 저항 · 옴의 법칙', '전력 · 스피커 직렬 / 병렬', '교류와 오디오 신호', '신호 레벨 · dBu · dBV', '평형 연결과 잡음', '접지 · 험 · 전원 안전'],
    glanceDraft: {
      glance: [
        ['전압 (V)', '전기를 미는 힘 · 물 비유로는 수압 — 콘센트는 220 V, 콘솔 라인 출력은 약 1.2 V'],
        ['옴의 법칙', '전압 = 전류 × 저항 (V = I × R) · 같은 전압이면 저항이 작을수록 전류가 많이 흘러요'],
        ['신호 레벨', '같은 소리도 마이크 몇 mV → 라인 약 1 V → 스피커 수십 V 로 크기가 달라요'],
        ['평형 연결', '핫 · 콜드 두 가닥에 똑같이 들어온 잡음을 받는 쪽이 지워 주는 연결 (XLR)']
      ],
      heroVis: 'peHero'
    },
    overview: {
      lead: '마이크 · 콘솔 · 앰프 · 스피커는 모두 소리를 <b>전기</b>로 바꿔 다뤄요. 전기는 수도관의 물로 생각하면 쉬워요. 이 과정에서는 전기의 힘 · 양 · 흐르기 어려운 정도를 배워요. 잡음을 막는 연결과 전원을 안전하게 쓰는 법도 배워요.',
      terms: [
        ['전압 (V, 볼트)', '전기를 미는 힘이에요. 물탱크가 높을수록 물을 세게 미는 것과 같아요. 한국 콘센트는 220 V 예요.', 'peTermVolt'],
        ['전류 (A, 암페어)', '실제로 흐르는 전기의 양이에요. 관 속을 흐르는 물의 양과 같아요.'],
        ['저항 · 임피던스 (Ω, 옴)', '전기가 흐르기 어려운 정도예요. 관이 좁을수록 물이 덜 흐르는 것과 같아요.', 'peTermOhm'],
        ['전력 (W, 와트)', '전기가 1초 동안 하는 일의 양이에요. 제품에 적힌 W 가 클수록 전기를 많이 써요.'],
        ['교류 (AC)', '흐르는 방향이 그네처럼 앞뒤로 바뀌는 전기예요. 건전지처럼 한 방향으로만 흐르면 직류(DC)예요.', 'peTermAcDc'],
        ['dBu · dBV', '소리 신호의 전기 크기를 나타내는 단위예요. 키를 재는 기준선처럼, 0 으로 삼는 기준만 서로 달라요.'],
        ['평형 (밸런스) 연결', '두 선에 똑같이 들어온 잡음을 지우는 연결이에요. 둘이 같은 상자에 올라도 키 차이는 그대로인 것과 같아요.', 'peTermBal'],
        ['그라운드 루프', '장비의 땅 연결선(접지)이 고리처럼 이어진 상태예요. 이때 「웅-」 하는 잡음(험)이 나요.']
      ],
      points: [
        '<b>흐르는 양 = 미는 힘 ÷ 흐르기 어려운 정도</b>예요. 스피커 Ω 이 작을수록 전기가 많이 흘러 앰프가 힘들어요.',
        '신호는 <b>크기에 맞는 곳</b>에 꽂아요. 앰프의 스피커 출력은 절대 콘솔 입력에 꽂지 않아요.',
        '전원은 <b>켤 때 콘솔 → 앰프</b>, <b>끌 때 앰프 먼저</b>예요. 험이 나도 전원 플러그의 접지는 절대 끊지 않아요.'
      ],
      model: null
    },
    theory: [
      { title: '전압 · 전류 · 저항 — 물로 보는 전기', visual: 'peOhm',
        body: '수도꼭지를 세게 틀면 물이 많이 나와요. 호스가 좁으면 물이 조금만 나와요. 전기도 이렇게 물처럼 생각하면 쉬워요. <b>전압(V, 볼트)</b>은 물을 미는 힘이에요. <b>전류(A, 암페어)</b>는 실제로 흐르는 물의 양이에요. <b>저항(Ω, 옴)</b>은 관이 좁아서 흐르기 어려운 정도예요. 그래서 흐르는 양은 「미는 힘 ÷ 흐르기 어려운 정도」예요(<b>옴의 법칙</b>). 예를 들어 20 V 로 8 Ω 을 밀면 20 ÷ 8 = 2.5 A 가 흘러요. 앰프가 스피커로 전기를 보낼 때도 똑같아요. 기억해요: 세게 밀면 많이, 좁으면 적게 흘러요.',
        more: '<ul><li><b>식</b>: 옴의 법칙은 V = I × R(전압 = 전류 × 저항)이에요. 같은 식을 I = V ÷ R, R = V ÷ I 로도 써요. 구하고 싶은 것을 왼쪽에 두면 돼요.</li> <li><b>두 가지 경우</b>: 전압이 같으면 저항이 작을수록 전류가 많이 흘러요. 저항이 같으면 전압이 클수록 전류가 많이 흘러요.</li> <li><b>물 비유 (SparkFun · HyperPhysics)</b>: 압력 = 전압, 흐름 = 전류, 관의 굵기 = 저항이에요. 전원은 물을 밀어 올리는 펌프와 같아요.</li> <li><b>전선과 저항</b>: 전선은 아주 넓은 관이라 흐름을 거의 막지 않아요. 그래서 전압은 대부분 저항(장비 · 스피커)에서 떨어져요(HyperPhysics).</li> <li><b>전압은 두 점의 차이</b>예요. 그래서 기준이 되는 점(그라운드)이 필요해요. 물로 치면 물이 돌아오는 저수지예요(HyperPhysics).</li> <li><b>임피던스</b>: 교류(소리 신호)에서 흐름을 막는 정도예요. 스피커의 8 Ω 은 대표값이에요. 실제로는 소리 높이(주파수)마다 달라요. 이 과정은 이해하기 쉽게 고정된 저항처럼 계산해요(교육용 근사).</li> <li><b>코일과 콘덴서 (무대음향 표준교재)</b>: 임피던스가 주파수마다 다른 까닭은 코일 · 콘덴서 때문이에요. 코일은 낮은 소리를 잘 통과시키고, 높은 소리는 막아요. 콘덴서는 반대로 높은 소리를 잘 통과시키고, 낮은 소리는 막아요. 스피커 크로스오버(소리 높이 나누기)와 EQ 회로가 이 성질을 써요.</li></ul>',
        check: { q: '같은 20 V 에서 8 Ω 을 4 Ω 으로 바꾸면 전류는요?', options: [
          { t: '반으로 줄어 1.25 A', why: '아니에요. 덜 막으니까 전류는 늘어요.' },
          { t: '두 배인 5 A', ok: true, why: '맞아요. 20 ÷ 4 = 5 A 라서 두 배가 되기 때문이에요.' },
          { t: '그대로 2.5 A', why: '아니에요. 전류는 미는 힘과 막는 정도 둘 다로 정해져요.' }] } },
      { title: '전력 — 앰프의 힘, 스피커 한 줄로 · 나란히 잇기', visual: 'pePower',
        body: '전기 주전자에는 「1800 W」처럼 W 숫자가 적혀 있어요. W 는 전기가 1초 동안 하는 일의 양이에요(<b>전력</b>). 전력은 미는 힘(V)과 흐르는 양(A)을 곱해서 구해요. 예를 들어 20 V 로 2.5 A 가 흐르면 20 × 2.5 = 50 W 예요. 스피커 두 대를 한 줄로 이으면 <b>직렬</b>이에요. 직렬은 막는 정도가 더해져서 8 + 8 = 16 Ω 이 돼요. 두 대를 나란히 이으면 <b>병렬</b>이에요. 길이 두 갈래가 되어서 8 Ω 두 대가 4 Ω 이 돼요. Ω 이 작아지면 전기가 더 많이 흘러 앰프가 힘들어져요. 그래서 앰프 설명서에 적힌 가장 낮은 Ω 보다 낮게 잇지 않아요. 기억해요: 한 줄로 이으면 Ω 이 커지고, 나란히 이으면 작아져요.',
        pics: [{ v: 'peRoad', cap: '<b>직렬</b>은 한 줄 길에 문이 두 개라 더 막혀요(16 Ω). <b>병렬</b>은 길이 두 갈래라 더 잘 흘러요(4 Ω). 그래서 병렬로 이으면 앰프가 전기를 더 많이 보내야 해요.' }],
        more: '<ul><li><b>전력 식 (HyperPhysics)</b>: P = V × I(전력 = 전압 × 전류)예요. 옴의 법칙을 넣으면 P = I² × R, P = V² ÷ R 이에요.</li> <li><b>계산 예</b>: 8 Ω 에 100 W 를 보내려면 V = √(100 × 8) ≈ 28.3 V 예요. 전류는 I = 28.3 ÷ 8 ≈ 3.5 A 예요.</li> <li><b>같은 전압에서 4 Ω 이면</b>: 전류와 전력이 8 Ω 일 때의 두 배가 돼요. 그만큼 앰프가 더 힘들게 일해요.</li> <li><b>직렬 · 병렬 (Eminence 배선도)</b>: 8 Ω 두 대를 직렬로 이으면 16 Ω, 병렬로 이으면 4 Ω 이에요. 같은 스피커 n 대를 병렬로 이으면 「한 대 값 ÷ n」이에요. 값이 다르면 1/R = 1/R₁ + 1/R₂ 로 계산해요.</li> <li><b>스피커 링크 단자</b>: 스피커의 링크(Link) 단자로 다음 스피커를 이으면 병렬이에요. 예: 3층 서브(V-SUB 8 Ω 두 대)는 4 Ω 이에요. 기둥 E8(12 Ω 두 대)은 6 Ω 이에요.</li> <li><b>딱 두 배가 아닐 때</b>: 계산으로는 4 Ω 에서 전력이 두 배예요. 하지만 실제 앰프는 전원부의 한계 때문에 딱 두 배가 되지 않아요. 예: d&b 40D 는 8 Ω 2000 W · 4 Ω 2400 W 예요(제조사 자료).</li> <li>앰프 정격(낼 수 있는 힘)과 짝 맞추기(매칭)는 <b>04-1 아날로그 앰프</b> 과정에서 다뤄요. dB 와 W 관계, 클리핑(소리가 찌그러짐), 브리지 모드도 거기서 다뤄요.</li></ul>',
        check: { q: '8 Ω 스피커 두 대를 나란히(병렬로) 이었어요. 몇 Ω 일까요?', options: [
          { t: '16 Ω', why: '아니에요. 16 Ω 은 한 줄로(직렬) 이을 때예요.' },
          { t: '4 Ω', ok: true, why: '맞아요. 길이 두 갈래가 되어 반인 4 Ω 이 되기 때문이에요.' },
          { t: '8 Ω', why: '아니에요. 8 Ω 은 한 대만 이었을 때예요.' }] } },
      { title: '교류와 소리 신호 — 소리가 전기가 되는 길', visual: 'peAc',
        body: '그네는 앞뒤로 오가기를 되풀이해요. 이렇게 방향이 앞뒤로 바뀌는 전기를 <b>교류(AC)</b>라고 해요. 건전지처럼 한 방향으로만 흐르는 전기는 <b>직류(DC)</b>예요. 소리는 공기 압력이 오르내리는 떨림이에요. 마이크는 이 떨림을 똑같은 모양의 교류 전기로 바꿔요. 마이크 안의 얇은 판이 떨면 전선(코일)이 자석 옆에서 움직여요. 그때 전기가 생겨요. 스피커는 거꾸로, 전기로 판(콘)을 밀고 당겨 소리를 내요. 그래서 둘 다 「바꾸는 장치」(<b>변환기</b>)라고 해요. 벽 콘센트 전기도 교류예요. 한국은 220 V 이고, 1초에 60번 바뀌어요(60 Hz). 기억해요: 소리 신호는 + 와 − 를 오가는 교류예요.',
        more: '<ul><li><b>마이크 (Shure 자료)</b>: 소리가 진동판을 움직이면 거기 붙은 보이스 코일도 움직여요. 코일은 자석 옆(자기장 안)에 있어요. 그때 소리와 같은 모양의 전기 신호가 생겨요. 이 부분을 변환기(transducer)라고 해요.</li> <li><b>스피커 (Cyberphysics)</b>: 교류 전류가 코일을 자석(전자석)으로 만들어요. 신호 방향이 바뀔 때마다 고정 자석과 밀고 당겨서 콘이 앞뒤로 움직여요. 전류가 클수록 더 크게 움직여 소리가 커져요.</li> <li><b>모양 차이</b>: 소리 신호는 노래에 따라 여러 주파수가 섞여서 모양이 늘 바뀌어요. 전원의 60 Hz 는 늘 같은 모양으로 되풀이돼요.</li> <li><b>220 V 는 실효값</b>이에요. 실효값은 「같은 열을 내는 직류 전압」으로 나타낸 값이에요. 파형의 꼭대기는 약 220 × √2 ≈ 311 V 예요(계산).</li> <li><b>60 Hz</b>: 한 번 왕복하는 데 1 ÷ 60 ≈ 16.7 ms 가 걸려요(계산). 한국은 220 V · 60 Hz 가 표준이에요(LG전자 고객지원).</li> <li><b>장비 안 전원부</b>: 콘솔 · 앰프의 전원부는 콘센트의 교류를 직류로 바꿔 회로에 써요. 소리 신호(교류)와 전원(교류 → 직류)은 서로 다른 길이에요.</li> <li>콘덴서 마이크는 전원이 필요한 다른 방식이에요. 마이크 종류는 01-1 유선 마이크 과정에서 다뤄요.</li></ul>',
        check: { q: '마이크와 스피커가 하는 일로 맞는 것은?', options: [
          { t: '마이크는 소리→전기, 스피커는 전기→소리', ok: true, why: '맞아요. 둘 다 바꾸는 장치(변환기)이고, 방향만 반대이기 때문이에요.' },
          { t: '둘 다 신호를 크게 키운다', why: '아니에요. 신호를 키우는 것은 콘솔의 GAIN 과 파워앰프예요.' },
          { t: '마이크는 한 방향 전기(직류)를 만든다', why: '아니에요. 소리는 오르내리는 떨림이라 마이크 신호도 교류예요.' }] } },
      { title: '신호 크기 — 마이크 · 라인 · 스피커', visual: 'peLevels',
        body: '속삭임과 보통 말, 고함은 크기가 아주 달라요. 소리 신호도 지나가는 곳마다 전기 크기(<b>레벨</b>)가 달라요. 마이크에서 나오는 전기는 아주 작아요(<b>마이크 레벨</b>, 몇 mV). 장비끼리 주고받는 보통 크기는 <b>라인 레벨</b>이에요. dBu · dBV 는 이런 신호 크기를 나타내는 단위예요. 업무용 장비는 +4 dBu(약 1.2 V)를 써요. 가정용 기기는 −10 dBV(약 0.3 V)를 써요. 앰프가 스피커로 보내는 전기는 수십 V 로 아주 커요(<b>스피커 레벨</b>). 그래서 마이크는 콘솔 MIC 입력에, 플레이어는 LINE 입력에 꽂아요. 앰프의 스피커 출력을 콘솔에 꽂으면 장비가 망가질 수 있어요. 기억해요: 신호는 크기에 맞는 구멍에 꽂아요.',
        more: '<ul><li><b>마이크 (Shure SM58 사양)</b>: 1 Pa(94 dB SPL) 크기의 소리에서 약 1.85 mV 를 내요. 감도(같은 소리에서 내는 전압)는 −54.5 dBV/Pa 예요. dBu 로 바꾸면 약 −52 dBu 예요(계산). 큰 소리로 가까이 부르면 이보다 커져요.</li> <li><b>스피커</b>: 8 Ω 에 100 W 면 √(100 × 8) ≈ 28.3 V 예요. 약 +31 dBu 예요(계산). 마이크 신호의 약 15,000배(약 84 dB)예요.</li> <li><b>dBu (Wikipedia Line level)</b>: 0 dBu 는 약 0.775 V(0.7746 V)예요. +4 dBu 는 약 1.228 V 예요.</li> <li><b>dBV</b>: 0 dBV = 1 V 예요. −10 dBV 는 약 0.316 V 예요.</li> <li><b>600 Ω 은 유래일 뿐이에요</b>: 0.775 V 는 600 Ω 에 1 mW 를 내는 전압이라서 생긴 숫자예요. 하지만 dBu 는 임피던스와 상관없이 0.775 V 를 기준으로 써요. 600 Ω · 1 mW 를 기준으로 하는 전력 단위는 dBm 이에요(무대음향 표준교재).</li> <li><b>숫자 차이 주의</b>: 이름만 보면 14 dB 차이 같아요. 하지만 기준이 달라서 실제 차이는 약 11.8 dB 예요. 계산은 20 × log(1.228 ÷ 0.316) 이에요.</li> <li><b>dBu 와 dBV 바꾸기</b>: 같은 전압이면 dBu 숫자가 dBV 보다 약 2.2 커요. 예: 0 dBV(1 V) ≈ +2.2 dBu 예요(무대음향 표준교재).</li> <li><b>dBFS — 디지털 장비의 단위</b>: 디지털 콘솔이 담을 수 있는 가장 큰 값을 0 dBFS 로 정해요. 그래서 그 아래는 모두 − 숫자로 적어요. 0 dBFS 를 넘으면 소리가 잘려 찌그러져요(클리핑).</li> <li><b>디지털과 아날로그 기준 맞추기 (무대음향 표준교재)</b>: 나라마다 기준이 있어요. SMPTE 기준은 −20 dBFS 를 +4 dBu 로 내보내요. 미국 · 아시아에서 흔해요. 유럽 EBU 기준은 −18 dBFS 를 0 dBu 로 내보내요. 장비마다 다를 수 있어서 설명서를 확인해요.</li> <li><b>dB 계산</b>: 전압 dB = 20 × log(전압 ÷ 기준)이에요. 20 dB 마다 전압이 10배예요.</li> <li><b>게인</b>: 콘솔 MIC 입력의 GAIN(들어온 소리를 키우는 노브)이 마이크 레벨을 라인 레벨 근처까지 키워요. 믹싱 스킬의 Gain Structure 과정에서 이어서 배워요.</li> <li>케이블과 단자 고르기는 02-1 아날로그 케이블 과정에서 자세히 다뤄요.</li></ul>',
        check: { q: '업무용 +4 dBu 와 가정용 −10 dBV, 맞는 말은?', options: [
          { t: '이름만 다르고 크기는 같다', why: '아니에요. 약 1.2 V 와 약 0.3 V 로 크기가 달라요.' },
          { t: '업무용 +4 dBu 가 더 크다', ok: true, why: '맞아요. 약 1.2 V 라서 약 0.3 V 인 가정용보다 크기 때문이에요(차이 약 11.8 dB).' },
          { t: '−10 dBV 는 마이크 레벨이다', why: '아니에요. −10 dBV 는 가정용 라인 레벨이에요. 마이크는 훨씬 작은 mV 예요.' }] } },
      { title: '평형 연결 — 잡음을 지우는 세 가닥 연결', visual: 'peBal',
        body: '조명 전원선 옆을 지나는 긴 케이블은 「지지직」 잡음을 받기 쉬워요. 긴 케이블은 안테나처럼 주변 잡음을 받거든요. <b>비평형</b> 연결은 신호선이 한 가닥이라 잡음이 그대로 섞여요. 기타 케이블(TS)이 비평형이에요. <b>평형</b> 연결은 신호선 두 가닥(핫 · 콜드)과 실드를 써요. 두 신호선은 꼬여 있어서 잡음이 두 가닥에 똑같이 들어와요. 받는 쪽은 두 선의 <b>차이</b>만 써요. 두 사람이 같은 상자에 올라서도 키 차이는 그대로인 것과 같아요. 그래서 똑같이 들어온 잡음은 지워지고 소리만 남아요. 마이크 · 긴 케이블 · 콘솔 출력처럼 먼 구간은 평형(XLR)으로 이어요. 기억해요: 길게 보낼 때는 평형 케이블을 써요.',
        more: '<ul><li><b>세 가닥</b>: 평형 케이블은 핫(2번 핀), 콜드(3번 핀), 그라운드(1번 핀, 실드)를 써요. 보통 1번 실드, 2번 핫, 3번 콜드예요.</li> <li><b>공통 모드 잡음</b>: 두 선에 똑같이 들어온 잡음을 이렇게 불러요. 받는 쪽 입력(차동 입력)은 두 선의 차이에만 반응해요. 그래서 똑같이 든 잡음은 지워져요(Wikipedia Balanced audio).</li> <li><b>잡음이 생기는 곳</b>: 전원선, 조명 디머(밝기 조절기) 근처에서 잡음이 잘 들어와요. 스네이크(여러 줄을 묶은 긴 케이블)도 평형으로 보내요.</li> <li><b>콜드에 꼭 뒤집힌 신호가 있어야 할까</b>: 아니에요. 같은 자료는 잡음을 지우는 핵심이 두 선의 <b>임피던스 균형</b>이라고 해요. 두 선이 똑같은 조건이어야 한다는 뜻이에요. 이 과정의 그림 · 실습은 이해를 돕게 콜드를 뒤집어 그렸어요.</li> <li><b>보통 장비는 뒤집어 보내요 (무대음향 표준교재)</b>: 대부분의 평형 출력은 콜드에 뒤집힌 신호를 보내요. 그러면 받는 쪽에서 「핫 − 콜드」를 할 때 잡음은 지워지고, 신호는 2배가 돼요. 다만 잡음을 지우는 힘 자체는 두 선이 똑같은 조건인지(임피던스 균형)에 달려 있어요.</li> <li><b>비평형은 짧게 (Rane Note 110)</b>: 비평형 케이블은 3 m(10 ft)보다 짧게 쓰라고 권해요. 평형과 비평형을 섞어 잇는 곳이 험의 흔한 원인이에요.</li> <li><b>장비 설계도 중요</b>: 평형 입력이라도 장비 안의 접지 설계가 나쁘면 잡음에 약할 수 있어요(Rane).</li> <li><b>DI 박스</b>: 건반 · 기타 같은 비평형 출력을 평형 마이크 레벨로 바꿔요. 그래서 멀리까지 보낼 수 있어요. 핀 배열과 커넥터는 02-1 과정에서 자세히 다뤄요.</li></ul>',
        check: { q: '평형 연결에서 잡음이 지워지는 까닭은?', options: [
          { t: '케이블이 두꺼워 잡음이 못 들어와서', why: '아니에요. 잡음은 평형 케이블에도 들어와요. 들어온 다음에 지워지는 거예요.' },
          { t: '두 선에 똑같이 든 잡음이 빼져서', ok: true, why: '맞아요. 받는 쪽이 두 선의 차이만 쓰니, 똑같이 든 잡음은 0 이 되기 때문이에요.' },
          { t: '실드가 잡음을 다 버려서', why: '아니에요. 실드도 돕지만, 핵심은 차이만 쓰는 받는 쪽이에요.' }] } },
      { title: '접지 · 「웅-」 험 · 전원 안전', visual: 'peGround',
        body: '예배 전 스피커에서 「웅-」 소리(<b>험</b>)가 나면 무척 거슬려요. 장비에는 안전을 위해 땅과 이어진 선(<b>접지</b>)이 있어요. 두 장비가 다른 콘센트와 신호 케이블로 함께 이어지면 접지가 고리가 돼요. 이 고리를 <b>그라운드 루프</b>라고 하고, 여기서 험이 생겨요. 고칠 때는 음향 장비를 같은 콘센트 회로에 모아요. 또는 DI 의 GND LIFT(신호 쪽 접지만 끊는 스위치)를 눌러요. 전원 플러그의 접지는 감전 위험 때문에 절대 끊지 않아요. 전원은 켤 때 콘솔 → 앰프, 끌 때 앰프를 먼저예요. 그래야 「퍽」 소리가 스피커로 나가지 않아요. 멀티탭은 220 V × 16 A = 3520 W 까지라서, 80 % 정도만 써요. 콘덴서 마이크는 콘솔이 보내는 팬텀 전원(+48 V)으로 움직여요. 기억해요: 앰프는 마지막에 켜고, 가장 먼저 꺼요.',
        pics: [{ v: 'pe3Phase', cap: '큰 건물의 분전반은 선이 4개(<b>3상 4선식</b>)예요. 한 상과 N 사이는 <b>220 V</b>, 두 상 사이는 <b>380 V</b> 예요. 장비는 세 상에 고르게 나눠 꽂아요.' }, { v: 'peFaults', cap: '<b>누전</b>은 전기가 선 밖으로 새는 일, <b>단락</b>은 두 선이 바로 붙는 일이에요. <b>지락</b>은 전기선이 땅(접지)에 닿는 일이에요. 셋 다 감전 · 불이 날 수 있어요.' }],
        more: '<ul><li><b>접지 두 가지 일</b>: 접지(그라운드)는 전압을 재는 기준점이에요. 감전을 막는 안전 통로이기도 해요.</li> <li><b>왜 험이 날까</b>: 콘센트 회로마다 접지 전압이 조금 달라요. 그래서 고리가 생기면 신호 케이블 실드로 전류가 돌아요.</li> <li><b>험과 버즈 (Jensen AN-004)</b>: 험은 주로 전원 주파수(60 Hz) 소리예요. 「지지직」 하는 버즈는 60 Hz 의 2배 · 3배(120 · 180 Hz …) 소리가 섞인 거예요. 가장 나쁜 경우는 접지된 두 장비가 서로 다른 분기 회로에 있을 때예요.</li> <li><b>안전 접지 (Jensen)</b>: 「안전 접지를 끊지 마세요」라고 해요. 끊으면 이어진 모든 장비에 위험한 전압이 생길 수 있어요.</li> <li><b>GND LIFT (Rane Note 110)</b>: 급할 때 쓰는 임시방편이에요. 스위치는 전원을 끈 상태에서 바꿔요. 근본 해결은 배선과 전원 회로를 정리하는 거예요.</li> <li><b>다른 방법 (무대음향 표준교재)</b>: 변압기(트랜스)가 든 DI · 스플리터를 써요. 두 장비의 접지를 떼어 놓아 줘요. 케이블 실드(1번 핀)를 한쪽 끝에서만 잇는 방법도 있어요(텔레스코핑 접지). 험이 나지 않으면 굳이 접지를 끊지 않아요.</li> <li><b>전원 순서 (Sweetwater)</b>: 파워앰프 · 파워드 스피커는 마지막에 켜고 처음에 꺼요. 다른 장비가 켜지고 꺼질 때 나는 「퍽」 소리가 스피커로 나가지 않게 하려는 거예요.</li> <li><b>켜는 차례 (무대음향 표준교재)</b>: 소리가 흐르는 길을 따라가요. ① 무선 수신기 · 악기 → ② 콘솔 · 이펙터 → ③ 스피커 프로세서 → ④ 파워앰프예요. 끌 때는 거꾸로예요. 이 순서를 자동으로 해 주는 장치가 <b>순차 전원 분배기</b>(시퀀서)예요.</li> <li><b>3상 4선식 (무대음향 표준교재)</b>: 공연장 분전반은 선이 4개예요. 세 상(L1 · L2 · L3)과 중성선(N)이에요. 한 상과 N 사이가 220 V, 두 상 사이가 380 V 예요. 세 상의 부하가 한쪽으로 몰리면 N 에 전류가 많이 흘러 뜨거워질 수 있어요. 2022년부터 선 색은 L1 갈색 · L2 검정 · L3 회색 · N 파랑 · 접지 녹색-노랑이에요.</li> <li><b>차단기 (무대음향 표준교재)</b>: 분전반의 주 차단기는 너무 많이 쓰면(과부하) 전기를 끊어요. 누전 차단기는 새는 전류(15–30 mA)를 느끼면 약 0.03초 안에 끊어요. 장비 전체 전류는 늘 차단기 정격 전류(오래 써도 되는 전류)보다 작아야 해요. 예: 220 V · 50 A 단상 차단기는 220 × 50 = 11,000 W 예요.</li> <li><b>누전 · 단락 · 지락 (같은 교재)</b>: 누전은 전기가 선 밖으로 새어 금속 외함 등으로 흐르는 일이에요. 단락(쇼트)은 두 선이 장비를 거치지 않고 바로 붙는 일이에요. 지락은 전기선이 접지와 붙는 일이에요.</li> <li><b>정전압 장치 · UPS (같은 교재)</b>: 정전압 장치(AVR)는 들쭉날쭉한 전압을 고르게 맞춰 줘요. UPS(무정전 전원 장치)는 정전 때 잠시 전기를 대 줘요. 디지털 콘솔은 작은 UPS 라도 달면 정전 때 작업 내용을 지킬 수 있어요.</li> <li><b>멀티탭 (IT동아 · 한국전기안전공사 연구원 인용)</b>: 쓸 수 있는 용량은 전압 × 전류(멀티탭에 적힌 A)예요. 80 % 정도만 쓰는 것이 좋아요. 멀티탭을 바꿔도 벽 콘센트 용량은 정해져 있어요.</li> <li><b>「16 A 250 V」라고 적혀 있다면</b>: 우리 전압은 220 V 예요. 그래서 220 × 16 = 3520 W 까지예요(계산).</li> <li><b>팬텀 전원 P48 (IEC 61938, Wikipedia 정리)</b>: 48 V 를 2번 · 3번 핀에 6.81 kΩ 저항으로 똑같이 걸어요. 마이크 하나에 최대 10 mA 예요. 콘덴서 마이크 · 액티브 DI 가 이 전원으로 움직여요.</li> <li><b>팬텀 전원 주의</b>: 평형 다이내믹 마이크에는 보통 영향이 없어요. 하지만 비평형 장비나 고장 난 케이블에서는 장비가 상할 수 있어요. 꽂고 빼기 전에 채널을 뮤트(소리 끄기)해요. 필요 없는 채널은 팬텀을 꺼 둬요.</li> <li>케이블 관리 · DI 는 <b>02-1</b>, 앰프 켜는 순서 · 보호는 <b>04-1 · 04-2</b> 에서 자세히 다뤄요.</li></ul>',
        check: { q: '건반 DI 를 꽂자 「웅-」 험이 나요. 무엇을 할까요?', options: [
          { t: '전원 플러그 접지를 끊는 어댑터를 쓴다', why: '아니에요. 험은 줄어도 감전 위험이 있어요. 절대 하지 않아요.' },
          { t: 'GND LIFT 를 켜거나 같은 회로에 꽂는다', ok: true, why: '맞아요. 신호 쪽 접지만 끊거나 같은 회로로 모으면 고리가 없어지기 때문이에요.' },
          { t: '콘솔 EQ 로 저음을 다 깎는다', why: '아니에요. 찬양의 저음까지 사라지고, 험의 높은 성분은 남아요. 원인을 고쳐야 해요.' }] } }
    ],
    practice: {
      kind: 'circuitLab',
      lead: '전기 실험대를 쉽게 만든 가상 화면이에요. 위의 ① ~ ⑥ 버튼으로 실험을 골라요. 노브를 돌리거나 선 · 프로브(재는 막대) · 플러그를 끌어다 놓아요. 손을 떼면 과제를 확인해요. 과제는 어느 순서로 해도 돼요.',
      note: '옴의 법칙 · 전력 식, 8 Ω 직렬 · 병렬 값은 자료로 확인했어요. dBu · dBV 기준과 SM58 값, 220 V · 60 Hz 도 그래요. 앰프 전압(20 V), 케이블 길이, 잡음 크기는 공부용 예시예요. 장비 전력(콘솔 150 W · 앰프 900 W · 포트 1800 W)도 예시예요. 실제 전원 · 앰프는 직접 재지 말고 담당자와 함께 확인해요.',
      tasks: [
        { id: 'ohm', title: '전류 2 A 만들기', text: '① 에서 전압 노브를 돌리고 저항을 골라요. 전류계가 2.00 A 가 되면 성공이에요. (전류 = 전압 ÷ 저항)' },
        { id: 'parallel', title: '스피커 두 대 나란히 잇기', text: '② 에서 선 끝을 끌어 스피커 B 도 이어요. + 는 +, − 는 − 끼리 이어요. 전체가 4 Ω 이 되면 성공이에요.' },
        { id: 'levels', title: '네 곳의 신호 크기 재기', text: '③ 에서 빨간 프로브를 끌어 단자 네 곳에 하나씩 대요. 마이크 · 가정용 · 콘솔 · 앰프를 모두 재면 성공이에요.' },
        { id: 'balanced', title: '평형 연결로 잡음 지우기', text: '④ 에서 노란 잡음원을 케이블 가까이 끌어요. 「평형 (XLR)」을 눌러요. 콘솔의 잡음이 지워지면 성공이에요.' },
        { id: 'ground', title: '「웅-」 험 없애기', text: '⑤ 에서 건반 플러그를 다른 콘센트로 옮기거나 GND LIFT 를 눌러요. 접지 끊는 어댑터는 쓰지 않아요. 험이 사라지면 성공이에요.' },
        { id: 'tap', title: '멀티탭 꽂고 차례로 켜기', text: '⑥ 에서 콘솔 · 앰프 2대를 멀티탭에 꽂아요. 콘솔 → 앰프 순서로 켜요. 합계가 2816 W(80 %) 이하면 성공이에요.' }
      ]
    },
    quiz: [
      { q: '앰프가 8 Ω 스피커에 28.3 V 를 걸어요. 전류는 약 몇 A?', options: [
        { t: '약 0.28 A', why: '아니에요. 나누기를 거꾸로 했어요. 28.3 ÷ 8 이에요.' },
        { t: '약 3.5 A', ok: true, why: '맞아요. 전류 = 전압 ÷ 저항이라 28.3 ÷ 8 ≈ 3.5 A 이기 때문이에요.' },
        { t: '약 226 A', why: '아니에요. 곱하기를 했어요. 전류는 전압 ÷ 저항이에요.' }] },
      { q: '「16 A」 멀티탭을 220 V 콘센트에 꽂았어요. 알맞은 생각은?', options: [
        { t: '3520 W 까지, 80 % 만 쓴다', ok: true, why: '맞아요. 220 × 16 = 3520 W 가 한계예요. 갑자기 많이 쓸 때를 대비해 여유를 두기 때문이에요.' },
        { t: '16 W 까지만 쓸 수 있다', why: '아니에요. A(전류)와 W(전력)는 달라요. 전력 = 전압 × 전류예요.' },
        { t: '차단기가 있으니 마음껏 꽂는다', why: '아니에요. 넘치면 차단기가 내려가 예배 중 소리가 꺼져요. 열이 나서 위험하기도 해요.' }] },
      { q: '켤 때는 콘솔 → 앰프였어요. 예배 후 끌 때 순서는?', visual: 'peOnOrder', options: [
        { t: '콘솔 먼저, 앰프 나중', why: '아니에요. 앰프가 켜진 채 콘솔이 꺼지면 「퍽」 소리가 나갈 수 있어요.' },
        { t: '앰프 먼저, 콘솔 나중', ok: true, why: '맞아요. 앰프가 먼저 꺼져 있어야 「퍽」 소리가 스피커로 안 나가기 때문이에요.' },
        { t: '멀티탭으로 한꺼번에 끈다', why: '아니에요. 장비마다 꺼지는 순간이 달라서 「퍽」 소리가 날 수 있어요.' }] },
      { q: '콘솔 LINE 입력에 절대 꽂으면 안 되는 것은?', options: [
        { t: '노트북 · 플레이어 출력', why: '아니에요. 가정용 라인 크기라 LINE 입력에 넣어도 돼요.' },
        { t: '다른 콘솔의 출력', why: '아니에요. 업무용 라인 크기라 LINE 입력에 맞아요.' },
        { t: '파워앰프의 스피커 출력', ok: true, why: '맞아요. 수십 V 나 되는 큰 전기라 입력 회로가 망가질 수 있기 때문이에요.' }] },
      { q: '팬텀 전원(+48 V)에 대해 맞는 말은?', options: [
        { t: '모든 마이크는 팬텀을 켜야 한다', why: '아니에요. 다이내믹 마이크는 전원이 필요 없어요.' },
        { t: '콘덴서 마이크 · 액티브 DI 용이다', ok: true, why: '맞아요. 이 장비들에 콘솔이 전원을 보내기 때문이에요. 그래도 꽂고 빼기 전에는 채널을 뮤트해요.' },
        { t: '스피커를 울리는 큰 전기다', why: '아니에요. 팬텀은 마이크용 작은 전원이에요. 최대 10 mA 정도예요.' }] }
    ],
    missions: [
      { title: '자가 진단 기준표 · 전원 · 접지 · 시스템 레벨', text: '평소 험 · 잡음이 없는지 기준표로 점검해 봐요. 전원 순서와 신호 크기 설정이 맞는지도 봐요.', go: { tab: 'tabCheck' } },
      { title: '음향 트러블슈팅 · 미션 C', text: '패시브 스피커에서 소리가 나지 않을 때를 연습해요. 앰프 전원과 스피커 연결을 차례로 확인해요. 실습 ② 의 「끊김 · 단락(+ 와 − 가 바로 붙음)」을 떠올려 봐요.', go: { tab: 'tab7', ts: 'C' } }
    ],
    deeper: [
      { title: '같은 「2배」라도 dB 가 달라요', text: '데시벨(dB)은 두 값이 몇 배인지를 나타내요. 그런데 무엇이 2배인지에 따라 dB 가 달라요. <b>전압</b>이 2배면 약 +6 dB, <b>전력</b>이 2배면 약 +3 dB 예요.', more: '<ul><li><b>계산법</b>: 전압은 20 × log, 전력은 10 × log 로 계산해요.</li> <li>전압이 2배면 약 +6 dB, 10배면 +20 dB 예요.</li> <li>전력이 2배면 약 +3 dB, 10배면 +10 dB 예요.</li> <li>같은 저항에서 전압이 2배면 전력은 4배예요(P = V² ÷ R). 그래서 두 계산 모두 +6 dB 로 같아요.</li> <li>그래서 앰프 출력을 100 W 에서 200 W 로 올려도 약 +3 dB 밖에 커지지 않아요. 04-1 앰프 과정의 「데시벨, 전압, 전력」에서 이어서 봐요.</li></ul>' },
      { title: '스피커 케이블에도 저항이 있어요', text: '전선에도 아주 작은 저항이 있어요. 길고 가는 케이블일수록 저항이 커져요. 그래서 앰프가 보낸 힘의 일부가 케이블에서 열로 사라져요.', more: '<ul><li>전선은 길수록, 가늘수록 저항이 커요. 식으로 쓰면 <b>전선 저항 = 비저항 × 길이 ÷ 굵기(단면적)</b>예요.</li> <li>비저항은 재료마다 정해진 「막는 정도」예요. 구리는 20 °C 에서 약 1.68 × 10⁻⁸ Ω·m 예요(HyperPhysics 표).</li> <li><b>계산 예 (교육용 근사)</b>: 2.5 mm² 케이블로 30 m 떨어진 스피커를 이으면 왕복 60 m 예요. 저항은 약 0.4 Ω 이에요.</li> <li>8 Ω 스피커라면 출력의 약 5 % 가 케이블에서 사라져요. 4 Ω 이면 약 9 % 예요(0.4 ÷ 8.4, 0.4 ÷ 4.4 계산).</li> <li>그래서 Ω 이 낮을수록, 케이블이 길수록 더 굵은 케이블을 써요. 04-1 의 「전류와 스피커 케이블」과 이어져요.</li></ul>' },
      { title: '미터의 두 숫자 — 평균 크기와 꼭대기', text: '교류 전기는 계속 바뀌어서 크기를 나타내는 방법이 여러 가지예요. <b>실효값(RMS)</b>은 같은 열을 내는 직류로 바꿔 본 크기예요. <b>피크</b>는 가장 높이 올라간 순간의 크기예요.', more: '<ul><li><b>실효값</b>: 같은 열을 내는 직류 전압으로 나타낸 값이에요.</li> <li>사인파는 피크 = 실효값 × √2(약 1.41)예요. 220 V 콘센트의 피크는 약 311 V 예요(계산).</li> <li>+4 dBu(1.228 V) 같은 레벨 값도 보통 실효값이에요. 사인파라면 피크는 약 1.74 V 예요(계산).</li> <li><b>피크 팩터(크레스트 팩터)</b>: 피크가 실효값보다 몇 배 큰지를 dB 로 나타낸 값이에요. 사인파는 1.414배라 약 3 dB, 사각파는 0 dB 예요(무대음향 표준교재).</li> <li>노래 · 악기 신호는 사인파보다 순간 피크가 훨씬 커요. 그래서 디지털 콘솔의 미터와 앰프의 리미터는 피크에 여유(헤드룸)를 둬요. Gain Structure 과정에서 이어서 배워요.</li></ul>' }
    ],
    sources: [
      { t: 'Voltage, Current, Resistance, and Ohm\'s Law — SparkFun (물 비유: 압력 = 전압 · 흐름 = 전류 · 관 굵기 = 저항, V = I × R)', url: 'https://learn.sparkfun.com/tutorials/voltage-current-resistance-and-ohms-law/all' },
      { t: 'DC Circuit Water Analogy — HyperPhysics (펌프 = 전원, 전선 = 넓은 관, 저항에서 전압이 떨어짐, 그라운드 = 기준)', url: 'https://hyperphysics.gsu.edu/hbase/electric/watcir.html' },
      { t: 'Electric Power — HyperPhysics (P = V × I)', url: 'https://hyperphysics.gsu.edu/hbase/electric/elepow.html' },
      { t: 'General Wiring Diagrams — Eminence (8 Ω 두 대 직렬 16 Ω · 병렬 4 Ω)', url: 'https://www.eminence.com/support/wiring-diagrams' },
      { t: 'Mic Basics: Transducers — Shure (진동판 · 보이스 코일 · 자기장 → 전기 신호)', url: 'https://www.shure.com/en-us/insights/mic-basics-transducers' },
      { t: 'The Loudspeaker — Cyberphysics (교류 전류 → 코일 · 자석 → 콘 진동)', url: 'https://www.cyberphysics.co.uk/topics/magnetsm/electro/loudspeaker.htm' },
      { t: 'LG전자 고객지원 — 국내 제품은 220 V · 60 Hz 국내 산업 표준', url: 'https://www.lg.com/ae/support/product-help/CT20076033-1431689538241' },
      { t: 'Line level — Wikipedia (0 dBu ≈ 0.7746 V · 0 dBV = 1 V · +4 dBu ≈ 1.228 V · −10 dBV ≈ 0.316 V)', url: 'https://en.wikipedia.org/wiki/Line_level' },
      { t: 'Shure SM58 사양서 — 감도 −54.5 dBV/Pa (1.85 mV), 1 Pa = 94 dB SPL', url: 'https://www.fullcompass.com/common/files/1626-ShureSM58SpecsSheet.pdf' },
      { t: 'Balanced audio — Wikipedia (공통 모드 잡음 제거 · 핀 1/2/3 · 임피던스 균형)', url: 'https://en.wikipedia.org/wiki/Balanced_audio' },
      { t: 'Sound System Interconnection (RaneNote 110) — Rane (비평형 3 m 미만 · 안전 접지 유지 · 그라운드 리프트는 임시방편)', url: 'https://www.ranecommercial.com/legacy/note110.html' },
      { t: 'AN-004 Hum and Buzz — Jensen Transformers (험 60 Hz · 버즈 = 배음 · 서로 다른 회로 · 안전 접지를 끊지 말 것)', url: 'https://www.jensen-transformers.com/wp-content/uploads/2014/08/an004.pdf' },
      { t: 'Avoiding Those Power-up/Power-down Transients — Sweetwater (앰프는 마지막에 켜고 먼저 끄기)', url: 'https://www.sweetwater.com/insync/avoiding-those-power-up-power-down-transients/' },
      { t: '[IT강의실] 멀티탭 무심코 사용하다 화재 — IT동아 · 다음 (허용 용량 = 전압 × 전류, 80 % 사용 권장, 한국전기안전공사 연구원 인용)', url: 'https://v.daum.net/v/20220204151205141' },
      { t: 'Phantom power — Wikipedia (IEC 61938 P48: 48 V · 6.81 kΩ · 최대 10 mA, 평형 다이내믹 마이크 영향 없음, 주의 사항)', url: 'https://en.wikipedia.org/wiki/Phantom_power' },
      { t: 'Resistivity and Temperature Coefficient at 20 °C — HyperPhysics (구리 1.68 × 10⁻⁸ Ω·m)', url: 'https://hyperphysics.gsu.edu/hbase/Tables/rstiv.html' },
      { t: 'd&b 40D 데이터 시트 (제조사) — 4 × 2000 W/8Ω · 4 × 2400 W/4Ω', url: 'https://www.dbaudio.com/assets/products/downloads/manuals-documentation/electronics/dbaudio-datasheet-40d-1.6-en.pdf' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 1장 기초 음향 · 전기 음향(직류 · 교류 · 옴의 법칙 · 임피던스 · 코일과 콘덴서 · 데시벨) p.32–39', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 9장 전원 시스템(3상 4선식 · 분전반 · 차단기 · 전원 용량 · 누전 · 단락/지락 · 접지 · 그라운드 루프 · AVR · UPS · 순차 전원) p.269–285', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 9장 기타 무대음향 기기 · 다이렉트 박스(밸런스 전송 · 그라운드 리프트) p.285–288', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 10장 음향 신호와 레벨(교류 전압 · 피크 팩터 · dBm/dBu/dBV/dBFS · 표준 운용 레벨) p.307–315', url: '' }
    ]
  };
})();
