/* =============================================================================
   물리음향 01 소리(파장) — 2026-11-04
   - STA_MODULES['phys-wave'] (모듈 데이터) + STAVisuals.pw* (그림 7개) + STASims.waveLab (파동 실험대 실습)
   - 다루는 것: 소밀파(종파) · 주파수와 주기 · 파장 λ = c / f 와 회절 · 진폭과 dB SPL · 역제곱 법칙 · 위상과 간섭 · 콤 필터 · 배음과 등청감 곡선
   - 확인한 숫자(출처는 맨 아래 sources):
       소리 빠르기 20 °C 약 343 m/s, c = 331.5 + 0.60 T (The Physics Factbook)
       가청 범위 흔히 20 Hz – 20 kHz, 2–5 kHz 에서 가장 예민 (Wikipedia Hearing range · HyperPhysics)
       목소리 기본음 남성 85–180 Hz · 여성 165–255 Hz (Wikipedia Voice frequency), 피아노 A0 27.5 Hz · A4 440 Hz · C8 4186 Hz
       0 dB SPL = 20 µPa, SPL = 20 log(p / p0), 음압 2배 +6 dB · 파워 2배 +3 dB · 두 배로 크게 약 +10 dB (Acoustic Glossary · sengpielaudio)
       점음원 · 자유 음장에서 거리 2배 → −6 dB (SFU Handbook · HyperPhysics)
       같은 신호 같은 시간 +6 dB, 첫 상쇄 = (1 / 지연) / 2, 1 ms → 500 Hz (Biamp)
       등청감 곡선: ISO 226:2003 표(af · Lu · Tf)와 식으로 계산, 2023 개정은 작은 수정 (FA2023 논문)
   - 실습의 기준 음량(1 m 에서 90 dB SPL), 스피커 배치(3 m 간격), 본당 크기, 자유 음장 가정은 교육용 예시.
   ============================================================================= */
(function () {
  'use strict';
  var V = window.STAVisuals = window.STAVisuals || {};
  var C = { ink: '#0f1f33', sub: '#51627a', line: '#cbd5e1', bg: '#f8fafc', blue: '#2563eb', teal: '#0e7490', orange: '#ea580c', purple: '#7c3aed', red: '#dc2626', green: '#059669', amber: '#d97706' };
  var SOUND = 343;   // m/s, 20 °C 근처
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 500) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.halo ? ' stroke="' + o.halo + '" stroke-width="4" stroke-linejoin="round" paint-order="stroke"' : '') + '>' + s + '</text>'; }
  function rect(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 8 : r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.5"' : '') + '/>'; }
  function arrow(x1, y1, x2, y2, col) { var a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 7 * Math.cos(a), hy = y2 - 7 * Math.sin(a); return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="2" fill="none"/><path d="M' + x2 + ' ' + y2 + 'L' + (hx - 4 * Math.sin(a)).toFixed(1) + ' ' + (hy + 4 * Math.cos(a)).toFixed(1) + 'L' + (hx + 4 * Math.sin(a)).toFixed(1) + ' ' + (hy - 4 * Math.cos(a)).toFixed(1) + 'Z" fill="' + col + '"/>'; }
  function sine(x0, w, ym, amp, cyc, col, sw, ph, dash) { var d = ''; for (var i = 0; i <= 160; i++) { var x = x0 + i / 160 * w, y = ym - amp * Math.sin(i / 160 * Math.PI * 2 * cyc + (ph || 0)); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (sw || 2.4) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'; }
  function lx(f, x0, x1, f0, f1) { return x0 + (Math.log(f / f0) / Math.log(f1 / f0)) * (x1 - x0); }
  function spk(x, y, s, col) { s = s || 1; return '<rect x="' + (x - 12 * s) + '" y="' + (y - 22 * s) + '" width="' + 16 * s + '" height="' + 44 * s + '" rx="' + 3 * s + '" fill="' + (col || '#1e293b') + '"/><path d="M' + (x + 4 * s) + ' ' + (y - 12 * s) + 'L' + (x + 14 * s) + ' ' + (y - 20 * s) + 'L' + (x + 14 * s) + ' ' + (y + 20 * s) + 'L' + (x + 4 * s) + ' ' + (y + 12 * s) + 'Z" fill="' + (col || '#334155') + '" opacity=".85"/>'; }
  function brk(x1, x2, y, lab, col) { return '<path d="M' + x1 + ' ' + (y - 5) + 'V' + y + 'H' + x2 + 'V' + (y - 5) + '" fill="none" stroke="' + col + '" stroke-width="1.8"/>' + t((x1 + x2) / 2, y + 14, lab, { size: 11, weight: 800, fill: col }); }

  /* ---------------------------------------------------------------- 첫 화면 그림 */
  V.pwHero = function () {
    var s = t(300, 18, '소리는 공기의 떨림 — 떨림 횟수(Hz) · 한 걸음 길이(파장) · 세기(dB)', { size: 11.5, fill: C.sub });
    s += spk(30, 92, 1.4);
    var x0 = 56, w = 496, lam = w / 2.5;
    for (var j = 0; j < 2; j++) s += '<rect x="' + (x0 + lam * (j + 0.5) - lam * 0.18).toFixed(1) + '" y="40" width="' + (lam * 0.36).toFixed(1) + '" height="104" rx="6" fill="#dbeafe" opacity=".7"/>';
    s += '<path d="M' + x0 + ' 92H' + (x0 + w) + '" stroke="' + C.line + '" stroke-dasharray="4 4"/>' + sine(x0, w, 92, 40, 2.5, C.blue, 3, -Math.PI / 2);
    s += brk(x0 + lam * 0.5, x0 + lam * 1.5, 156, '파장 λ (빽빽한 곳 → 다음 빽빽한 곳)', C.orange);
    s += '<path d="M' + (x0 + w + 8) + ' 52V92M' + (x0 + w + 4) + ' 52H' + (x0 + w + 12) + '" stroke="' + C.purple + '" stroke-width="1.8"/>' + t(x0 + w + 14, 76, '진폭', { size: 11, weight: 800, fill: C.purple, anchor: 'start' });
    s += t(x0 + lam * 0.5, 36, '밀 (빽빽)', { size: 10.5, weight: 700, fill: C.blue }) + t(x0 + lam, 36, '소 (듬성)', { size: 10.5, weight: 700, fill: C.sub });
    var chips = [['100 Hz', 'λ ≈ 3.4 m', C.blue], ['1 kHz', 'λ ≈ 34 cm', C.teal], ['10 kHz', 'λ ≈ 3.4 cm', C.orange], ['음압 2배', '+6 dB', C.purple], ['거리 2배', '−6 dB', C.red]];
    chips.forEach(function (c, i) { var x = 8 + i * 118; s += rect(x, 182, 110, 50, '#fff', c[2]) + t(x + 55, 202, c[0], { size: 11.5, weight: 800, fill: c[2] }) + t(x + 55, 221, c[1], { size: 12, weight: 800 }); });
    s += t(300, 248, '파장 = 343 ÷ 주파수 · 소리는 1초에 약 343 m 를 가요 (20 °C)', { size: 10.5, fill: C.sub });
    return svg(600, 256, s, '소리의 파형, 파장, 진폭과 주요 숫자');
  };

  /* ---------------------------------------------------------------- 그림 1: 소밀파 */
  V.pwPressure = function () {
    var s = t(300, 16, '스피커가 공기를 밀고 당기면 빽빽한 곳(밀) · 듬성한 곳(소)이 번갈아 퍼져요', { size: 11, fill: C.sub });
    s += spk(30, 88, 1.6);
    var x0 = 60, x1 = 590, lam = (x1 - x0) / 3, kk = 2 * Math.PI / lam, s0 = 0.75 / kk;
    for (var r = 0; r < 7; r++) {
      var y = 48 + r * 13;
      for (var xi = x0 + (r % 2) * 3.5; xi <= x1; xi += 7) { var xd = xi + s0 * Math.sin(kk * (xi - x0)); if (xd > x0 - 2 && xd < x1 + 2) s += '<circle cx="' + xd.toFixed(1) + '" cy="' + y + '" r="2.1" fill="#475569"/>'; }
    }
    for (var c = 0; c < 3; c++) { var xc = x0 + lam * (c + 0.5); s += t(xc, 38, '밀 · 빽빽', { size: 10, weight: 800, fill: C.blue }); }
    [1, 2].forEach(function (c) { s += t(x0 + lam * c, 38, '소 · 듬성', { size: 10, weight: 700, fill: C.sub }); });
    var ym = 166, d = '';
    for (var i = 0; i <= 200; i++) { var x = x0 + i / 200 * (x1 - x0); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (ym + 20 * Math.cos(kk * (x - x0))).toFixed(1); }
    s += '<path d="M' + x0 + ' ' + ym + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="4 4"/><path d="' + d + '" fill="none" stroke="' + C.blue + '" stroke-width="2.6"/>';
    s += t(30, 150, '압력', { size: 10.5, weight: 800, fill: C.blue }) + t(30, 164, '+', { size: 12, weight: 800, fill: C.blue }) + t(30, 182, '−', { size: 12, weight: 800, fill: C.blue });
    s += t(x1, ym + 4, '평소 공기', { size: 9.5, fill: C.sub, anchor: 'end' });
    s += '<path d="M70 204H112" stroke="' + C.orange + '" stroke-width="2"/><path d="M70 204l6 -4v8z M112 204l-6 -4v8z" fill="' + C.orange + '"/>' + t(120, 208, '공기 알갱이는 제자리에서 앞뒤로만 흔들려요', { size: 10.5, weight: 700, fill: C.orange, anchor: 'start' });
    s += arrow(400, 204, 470, 204, C.teal) + t(478, 208, '떨림이 퍼지는 방향', { size: 10.5, weight: 700, fill: C.teal, anchor: 'start' });
    return svg(600, 216, s, '스피커 앞 공기의 밀한 곳과 소한 곳, 그리고 압력 그래프');
  };

  /* ---------------------------------------------------------------- 그림 2: 주파수 · 주기 · 가청 범위 */
  V.pwFreq = function () {
    var s = t(300, 16, '주파수 = 1초에 떨리는 횟수(Hz) · 한 번 떨리는 시간 = 주기', { size: 11.5, fill: C.sub });
    [[8, 1, '100 Hz — 10 ms 동안 1번 떨려요', C.blue], [304, 4, '400 Hz — 10 ms 동안 4번 떨려요', C.teal]].forEach(function (p) {
      s += rect(p[0], 26, 288, 96, '#fff', C.line) + '<path d="M' + (p[0] + 12) + ' 66H' + (p[0] + 276) + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + sine(p[0] + 12, 264, 66, 26, p[1], p[3], 2.4);
      s += t(p[0] + 144, 114, p[2], { size: 10.5, weight: 800, fill: p[3] });
    });
    var X0 = 40, X1 = 580, F = function (f) { return lx(f, X0, X1, 20, 20000); };
    [[20, 250, '#dbeafe', '저역 (낮은 소리)', C.blue], [250, 4000, '#ccfbf1', '중역 (가운데 소리)', C.teal], [4000, 20000, '#ffedd5', '고역 (높은 소리)', C.orange]].forEach(function (b) { s += '<rect x="' + F(b[0]).toFixed(1) + '" y="190" width="' + (F(b[1]) - F(b[0])).toFixed(1) + '" height="16" fill="' + b[2] + '"/>' + t(((F(b[0]) + F(b[1])) / 2).toFixed(1), 202, b[3], { size: 10.5, weight: 800, fill: b[4] }); });
    [[85, 180, 138, '남자 목소리', C.blue], [165, 255, 154, '여자 목소리', C.purple], [27.5, 4186, 170, '피아노 (27.5 Hz – 4186 Hz)', C.ink], [2000, 5000, 138, '귀가 가장 잘 들어요 (2–5 kHz)', C.red]].forEach(function (b) {
      var a = F(b[0]), z = F(b[1]); s += '<rect x="' + a.toFixed(1) + '" y="' + (b[2] - 6) + '" width="' + (z - a).toFixed(1) + '" height="7" rx="3" fill="' + b[4] + '" opacity=".8"/>' + t((z + 5).toFixed(1), b[2] + 1, b[3], { size: 9.5, weight: 700, fill: b[4], anchor: 'start' });
    });
    [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].forEach(function (f) { var x = F(f); s += '<path d="M' + x.toFixed(1) + ' 206v5" stroke="#94a3b8"/>' + t(x.toFixed(1), 222, f >= 1000 ? f / 1000 + 'k' : f, { size: 9.5, fill: C.sub }); });
    s += t(300, 240, '20 Hz 아래 · 20 kHz 위는 사람 귀에 안 들려요 · 낮은/가운데/높은 소리 경계는 공부용 구분', { size: 10, fill: C.sub });
    return svg(600, 248, s, '100 Hz 와 400 Hz 파형, 가청 범위와 목소리 · 피아노 음역');
  };

  /* ---------------------------------------------------------------- 그림 3: 파장과 회절 */
  V.pwLambda = function () {
    var s = t(300, 16, '파장 = 343 ÷ 주파수 (소리는 1초에 약 343 m 를 가요)', { size: 11.5, fill: C.sub });
    [['100 Hz', 'λ ≈ 3.4 m', '어른 키의 두 배쯤', C.blue, 1], ['1 kHz', 'λ ≈ 34 cm', '30 cm 자보다 조금 길어요', C.teal, 3], ['10 kHz', 'λ ≈ 3.4 cm', '손가락 한 마디쯤', C.orange, 8]].forEach(function (r, i) {
      var y = 28 + i * 52; s += rect(8, y, 292, 44, '#fff', C.line) + t(20, y + 19, r[0], { size: 12.5, weight: 800, fill: r[3], anchor: 'start' }) + t(20, y + 36, r[2], { size: 9.5, fill: C.sub, anchor: 'start' });
      s += sine(130, 80, y + 22, 9, r[4], r[3], 1.8) + t(290, y + 27, r[1], { size: 13, weight: 800, anchor: 'end' });
    });
    s += t(154, 200, '20 Hz ≈ 17 m · 20 kHz ≈ 1.7 cm', { size: 11, weight: 800 }) + t(154, 216, '(그림 속 물결 길이는 실제 비율이 아니에요)', { size: 9.5, fill: C.sub });
    s += '<defs><clipPath id="pwClipA"><rect x="312" y="28" width="280" height="100" rx="8"/></clipPath><clipPath id="pwClipB"><rect x="312" y="136" width="280" height="100" rx="8"/></clipPath></defs>';
    [[28, 'pwClipA', 34, '저음 (긴 파장): 기둥을 돌아 뒤까지 가요', C.blue, false], [136, 'pwClipB', 9, '고음 (짧은 파장): 기둥 뒤에 그늘이 져요', C.orange, true]].forEach(function (p) {
      var y = p[0], cy = y + 56, sx = 330, px = 450, arcs = '';
      for (var r = p[2]; r < 280; r += p[2]) arcs += '<circle cx="' + sx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + p[4] + '" stroke-width="' + (p[5] ? 1.1 : 2) + '" opacity=".55"/>';
      s += rect(312, y, 280, 100, '#f8fafc', C.line) + '<g clip-path="url(#' + p[1] + ')">' + arcs;
      if (p[5]) s += '<path d="M' + (px + 8) + ' ' + (cy - 14) + 'L600 ' + (cy - 40) + 'L600 ' + (cy + 40) + 'L' + (px + 8) + ' ' + (cy + 14) + 'Z" fill="#f8fafc"/>' + t(548, cy + 4, '그늘', { size: 10.5, weight: 800, fill: C.sub });
      s += '</g>' + '<circle cx="' + sx + '" cy="' + cy + '" r="6" fill="' + C.ink + '"/>' + rect(px, cy - 14, 16, 28, '#64748b', null, 3) + t(px + 8, cy + 30, '기둥', { size: 9.5, weight: 700, fill: C.ink, halo: '#f8fafc' });
      s += '<circle cx="' + (px + 60) + '" cy="' + (cy - 2) + '" r="5" fill="' + (p[5] ? '#94a3b8' : C.green) + '"/>';
      s += t(452, y + 16, p[3], { size: 10.5, weight: 800, fill: p[4], halo: '#f8fafc' });
    });
    return svg(600, 244, s, '주파수별 파장 길이와 기둥을 만난 저음 · 고음');
  };

  /* ---------------------------------------------------------------- 그림 4: dB 와 역제곱 법칙 */
  V.pwDb = function () {
    var s = t(150, 18, 'dB: 몇 배인지를 더하기로 나타내요', { size: 12, weight: 800 });
    [['+3 dB', '파워(에너지) 2배', C.teal], ['+6 dB', '음압(진폭) 2배', C.blue], ['+10 dB', '귀에 약 2배 크게 들려요', C.purple], ['+20 dB', '음압 10배', C.ink], ['−6 dB', '음압 반으로', C.red]].forEach(function (r, i) {
      var y = 28 + i * 38; s += rect(8, y, 284, 32, '#fff', C.line, 7) + t(24, y + 21, r[0], { size: 13, weight: 900, fill: r[2], anchor: 'start' }) + t(100, y + 21, r[1], { size: 11, weight: 700, anchor: 'start' });
    });
    s += t(150, 230, '0 dB SPL = 겨우 들리는 아주 작은 소리', { size: 10, fill: C.sub });
    s += t(452, 18, '멀어지면: 거리 2배 → −6 dB', { size: 12, weight: 800 });
    s += '<defs><clipPath id="pwClipDb"><rect x="304" y="28" width="290" height="174" rx="8"/></clipPath></defs>' + rect(304, 28, 290, 174, '#f8fafc', C.line);
    var sx = 322, sy = 112, R = function (m) { return 40 + Math.log(m) / Math.LN2 * 72; };
    s += '<g clip-path="url(#pwClipDb)">' + [1, 2, 4, 8].map(function (m) { return '<circle cx="' + sx + '" cy="' + sy + '" r="' + R(m) + '" fill="none" stroke="' + C.blue + '" stroke-width="1.4" stroke-dasharray="4 4" opacity=".6"/>'; }).join('') + '</g>';
    s += spk(sx - 2, sy, 0.7);
    [[1, '90'], [2, '84'], [4, '78'], [8, '72']].forEach(function (p) { var x = sx + R(p[0]); s += '<circle cx="' + x + '" cy="' + sy + '" r="5" fill="' + C.orange + '"/>' + t(x, sy - 12, p[1] + ' dB', { size: 11, weight: 800, fill: C.orange, halo: '#f8fafc' }) + t(x, sy + 20, p[0] + ' m', { size: 10.5, weight: 700, halo: '#f8fafc' }); });
    s += t(449, 176, '반사가 없을 때 · 1 m 에서 90 dB 은 예시 값', { size: 9.5, fill: C.sub, halo: '#f8fafc' }) + t(449, 192, '(그림 속 간격은 실제 거리 비율이 아니에요)', { size: 9.5, fill: C.sub, halo: '#f8fafc' });
    s += t(449, 222, '실제 본당은 벽 · 천장 반사가 더해져 계산과 달라요', { size: 10, fill: C.sub });
    return svg(600, 238, s, 'dB 비율 표와 거리에 따른 음압 레벨 감소');
  };

  /* ---------------------------------------------------------------- 그림 5: 위상 · 간섭 · 콤 필터 */
  V.pwPhase = function () {
    var s = '';
    [[8, '같은 박자 → +6 dB', 0, C.green], [204, '반대 박자 → 지워져요', Math.PI, C.red]].forEach(function (p) {
      s += rect(p[0], 8, 188, 116, '#fff', C.line) + t(p[0] + 94, 26, p[1], { size: 11.5, weight: 800, fill: p[3] });
      s += '<path d="M' + (p[0] + 10) + ' 78H' + (p[0] + 178) + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>';
      s += sine(p[0] + 10, 168, 78, 16, 1.5, C.blue, 1.4) + sine(p[0] + 10, 168, 78, 16, 1.5, C.orange, 1.4, p[2], '4 3');
      s += p[2] ? '<path d="M' + (p[0] + 10) + ' 78H' + (p[0] + 178) + '" stroke="' + C.green + '" stroke-width="3"/>' : sine(p[0] + 10, 168, 78, 32, 1.5, C.green, 3);
      s += t(p[0] + 94, 118, p[2] ? '높은 곳 + 낮은 곳 = 0' : '두 소리 합 = 2배', { size: 9.5, fill: C.sub });
    });
    s += rect(400, 8, 192, 116, '#fff', C.line) + t(496, 26, '거리 차이 → 늦게 도착', { size: 11.5, weight: 800, fill: C.purple });
    s += '<circle cx="424" cy="72" r="11" fill="#fde68a" stroke="#d97706"/>' + t(424, 98, '입', { size: 9.5, fill: C.sub });
    s += '<rect x="452" y="50" width="22" height="9" rx="4" fill="#334155"/><rect x="530" y="86" width="22" height="9" rx="4" fill="#334155"/>';
    s += '<path d="M436 70L452 55M436 75L530 90" stroke="' + C.purple + '" stroke-width="1.4" stroke-dasharray="3 3"/>';
    s += t(486, 46, '마이크 A', { size: 9.5, weight: 700 }) + t(560, 82, '마이크 B', { size: 9.5, weight: 700 }) + t(496, 112, 'B 까지 34 cm 더 멀면 약 1 ms 늦어요', { size: 9.5, weight: 700, fill: C.purple });
    var X0 = 52, X1 = 584, Y0 = 160, Y1 = 232, dt = 0.34 / SOUND, Yd = function (db) { return Y0 + (8 - db) / 38 * (Y1 - Y0); }, d = '';
    s += rect(8, 132, 584, 124, '#f8fafc', C.line);
    for (var i = 0; i <= 1200; i++) { var f = 20 * Math.pow(1000, i / 1200), m = Math.abs(2 * Math.cos(Math.PI * f * dt)), db = Math.max(-30, 20 * Math.log10(Math.max(m, 1e-6))); d += (i ? 'L' : 'M') + lx(f, X0, X1, 20, 20000).toFixed(1) + ' ' + Yd(db).toFixed(1); }
    s += '<path d="M' + X0 + ' ' + Yd(0).toFixed(1) + 'H' + X1 + '" stroke="#94a3b8" stroke-dasharray="3 3"/><path d="M' + X0 + ' ' + Yd(6).toFixed(1) + 'H' + X1 + '" stroke="' + C.green + '" stroke-dasharray="2 4" opacity=".7"/>';
    s += t(X0 - 4, Yd(6) + 4, '+6', { size: 9.5, fill: C.green, anchor: 'end' }) + t(X0 - 4, Yd(0) + 4, '0 dB', { size: 9.5, fill: C.sub, anchor: 'end' });
    s += '<path d="' + d + '" fill="none" stroke="' + C.purple + '" stroke-width="2"/>';
    [[1 / dt / 2, '약 500 Hz'], [3 / dt / 2, '1.5 k'], [5 / dt / 2, '2.5 k']].forEach(function (n) { s += t(lx(n[0], X0, X1, 20, 20000).toFixed(1), Y1 + 16, n[1], { size: 9.5, weight: 800, fill: C.red }); });
    s += t(300, 150, '콤 필터 — 34 cm 늦게 온 같은 소리를 더하면 빗살처럼 지워져요', { size: 10, weight: 700, fill: C.sub });
    return svg(600, 262, s, '같은 위상과 반대 위상의 합, 두 마이크 거리 차이로 생기는 콤 필터');
  };

  /* ---------------------------------------------------------------- 그림 6: 배음 · 등청감 곡선 (ISO 226:2003 식) */
  var ISO_F = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500];
  var ISO_AF = [0.532, 0.506, 0.480, 0.455, 0.432, 0.409, 0.387, 0.367, 0.349, 0.330, 0.315, 0.301, 0.288, 0.276, 0.267, 0.259, 0.253, 0.250, 0.246, 0.244, 0.243, 0.243, 0.243, 0.242, 0.242, 0.245, 0.254, 0.271, 0.301];
  var ISO_LU = [-31.6, -27.2, -23.0, -19.1, -15.9, -13.0, -10.3, -8.1, -6.2, -4.5, -3.1, -2.0, -1.1, -0.4, 0.0, 0.3, 0.5, 0.0, -2.7, -4.1, -1.0, 1.7, 2.5, 1.2, -2.1, -7.1, -11.2, -10.7, -3.1];
  var ISO_TF = [78.5, 68.7, 59.5, 51.1, 44.0, 37.5, 31.5, 26.5, 22.1, 17.9, 14.4, 11.4, 8.6, 6.2, 4.4, 3.0, 2.2, 2.4, 3.5, 1.7, -1.3, -4.2, -6.0, -5.4, -1.5, 6.0, 12.6, 13.9, 12.3];
  function isoLp(i, phon) { var A = 4.47e-3 * (Math.pow(10, 0.025 * phon) - 1.15) + Math.pow(0.4 * Math.pow(10, (ISO_TF[i] + ISO_LU[i]) / 10 - 9), ISO_AF[i]); return 10 / ISO_AF[i] * Math.log10(A) - ISO_LU[i] + 94; }
  V.pwEar = function () {
    var s = '';
    [[8, '배음이 많은 소리', function (n) { return 1 / n; }, C.orange], [128, '배음이 적은 소리', function (n) { return n === 1 ? 1 : n % 2 ? 0.25 / n : 0.04; }, C.blue]].forEach(function (p) {
      var y = p[0]; s += rect(8, y, 226, 112, '#fff', C.line) + t(121, y + 18, p[1], { size: 11, weight: 800, fill: p[3] });
      for (var n = 1; n <= 8; n++) { var h = p[2](n) * 62, x = 22 + (n - 1) * 26; s += '<rect x="' + x + '" y="' + (y + 90 - h).toFixed(1) + '" width="16" height="' + h.toFixed(1) + '" rx="2" fill="' + p[3] + '"' + (n === 1 ? '' : ' opacity=".7"') + '/>' + t(x + 8, y + 104, n === 1 ? '220' : '×' + n, { size: 9, fill: C.sub }); }
    });
    s += t(121, 254, '같은 220 Hz 라도 배음 모양이 달라요 (교육용 그림)', { size: 9.5, fill: C.sub });
    var X0 = 282, X1 = 584, Y = function (db) { return 236 - db / 120 * 196; }, F = function (f) { return lx(f, X0, X1, 20, 12500); };
    s += rect(244, 8, 348, 240, '#fff', C.line) + t(418, 26, '등청감 곡선 — 같은 크기로 들리려면 필요한 세기', { size: 11, weight: 800 });
    [0, 20, 40, 60, 80, 100, 120].forEach(function (db) { s += '<path d="M' + X0 + ' ' + Y(db).toFixed(1) + 'H' + X1 + '" stroke="#eef2f7"/>' + t(X0 - 4, Y(db) + 3.5, db, { size: 9, fill: C.sub, anchor: 'end' }); });
    [20, 100, 1000, 10000].forEach(function (f) { s += t(F(f).toFixed(1), 248 - 2, f >= 1000 ? f / 1000 + 'k' : f, { size: 9, fill: C.sub }); });
    s += t(256, 40, 'dB', { size: 9, fill: C.sub });
    [[20, C.teal], [40, C.blue], [60, C.purple], [80, C.red]].forEach(function (ph) {
      var d = ISO_F.map(function (f, i) { return (i ? 'L' : 'M') + F(f).toFixed(1) + ' ' + Y(isoLp(i, ph[0])).toFixed(1); }).join('');
      s += '<path d="' + d + '" fill="none" stroke="' + ph[1] + '" stroke-width="2"/>' + t(F(400), Y(isoLp(13, ph[0])) - 6, ph[0] + ' phon', { size: 9.5, weight: 800, fill: ph[1], halo: '#fff' });
    });
    var x100 = F(100); s += '<path d="M' + x100.toFixed(1) + ' ' + Y(110) + 'V236" stroke="' + C.orange + '" stroke-dasharray="3 3"/>' + t(x100 + 6, Y(112), '100 Hz', { size: 9.5, weight: 800, fill: C.orange, anchor: 'start' });
    s += t(x100 + 6, Y(8), '작은 소리에서 100 Hz 는 약 28 dB 더 세야 해요', { size: 9.5, weight: 700, fill: C.teal, anchor: 'start', halo: '#fff' });
    return svg(600, 262, s, '배음 막대 그림과 ISO 226 등청감 곡선');
  };

  /* =========================================================================== 2026-11-04 「그림으로 보기」 — 용어 · 이론 · 문제에 붙이는 쉬운 그림 */
  function svgM(w, h, body, label) { return svg(w, h, body, label).replace('<svg class="mod-svg"', '<svg class="mod-svg" style="min-width:0"'); }   // 작은 그림: 휴대폰에서 가로로 밀리지 않게(글자 13 이상)
  function dbl(x, y, col, w) { w = w || 10; return '<path d="M' + (x - w) + ' ' + y + 'H' + (x + w) + '" stroke="' + col + '" stroke-width="2"/><path d="M' + (x - w) + ' ' + y + 'l5 -3.5v7zM' + (x + w) + ' ' + y + 'l-5 -3.5v7z" fill="' + col + '"/>'; }
  function person(x, y, col) { return '<circle cx="' + x + '" cy="' + y + '" r="8" fill="' + (col || '#fde68a') + '" stroke="' + C.amber + '" stroke-width="1.5"/><path d="M' + x + ' ' + (y + 8) + 'V' + (y + 30) + 'M' + (x - 9) + ' ' + (y + 16) + 'H' + (x + 9) + 'M' + x + ' ' + (y + 30) + 'l-7 12M' + x + ' ' + (y + 30) + 'l7 12" stroke="#475569" stroke-width="2.2" fill="none" stroke-linecap="round"/>'; }
  function okx(x, y, ok) { return '<circle cx="' + x + '" cy="' + y + '" r="11" fill="' + (ok ? C.green : C.red) + '"/>' + (ok ? '<circle cx="' + x + '" cy="' + y + '" r="5.5" fill="none" stroke="#fff" stroke-width="2.4"/>' : '<path d="M' + (x - 5) + ' ' + (y - 5) + 'l10 10M' + (x + 5) + ' ' + (y - 5) + 'l-10 10" stroke="#fff" stroke-width="2.4"/>'); }

  /* 용어 「소밀파」: 줄 선 사람 어깨 밀기 비유 */
  V.pwTermLine = function () {
    var s = t(12, 16, '밀림이 퍼지는 방향', { size: 13, weight: 800, fill: C.teal, anchor: 'start' }) + arrow(150, 12, 350, 12, C.teal);
    var xs = [56, 80, 132, 184, 236, 288, 340];
    xs.forEach(function (x, i) { s += person(x, 34, i < 2 ? '#bfdbfe' : null) + dbl(x, 90, C.orange, 9); });
    s += '<path d="M10 52H34" stroke="' + C.ink + '" stroke-width="3"/><path d="M40 52l-8 -5v10z" fill="' + C.ink + '"/>' + t(22, 74, '툭', { size: 13, weight: 800 });
    s += t(68, 108, '빽빽(밀)', { size: 13, weight: 800, fill: C.blue }) + t(150, 112, '제자리에서 앞뒤로만 흔들려요', { size: 13, weight: 700, fill: C.orange, anchor: 'start' });
    return svgM(360, 120, s, '줄을 선 사람 어깨를 밀면 밀림이 차례로 전해지는 그림');
  };

  /* 용어 「주파수」: 같은 1초 동안 몇 번 떨리나 */
  V.pwTermHz = function () {
    var s = t(180, 16, '같은 1초 동안 몇 번 떨리나요?', { size: 13, weight: 800 });
    [[6, 2, C.blue, '천천히 떨려요', '→ 낮은 음 (Hz 작음)'], [184, 6, C.orange, '빨리 떨려요', '→ 높은 음 (Hz 큼)']].forEach(function (p) {
      s += rect(p[0], 24, 170, 54, '#fff', C.line) + '<path d="M' + (p[0] + 8) + ' 51H' + (p[0] + 162) + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + sine(p[0] + 8, 154, 51, 18, p[1], p[2], 2.4);
      s += t(p[0] + 85, 96, p[3], { size: 13, weight: 800, fill: p[2] }) + t(p[0] + 85, 114, p[4], { size: 13, weight: 700 });
    });
    return svgM(360, 120, s, '1초 동안 천천히 떨리는 낮은 음과 빨리 떨리는 높은 음');
  };

  /* 용어 「dB SPL」: 계단 비유 — 한 계단 +6 dB = 음압 2배 */
  V.pwTermStairs = function () {
    var s = t(10, 18, '한 계단(+6 dB) 오를 때마다', { size: 13, weight: 800, anchor: 'start' }) + t(10, 36, '음압이 2배가 돼요', { size: 13, weight: 800, fill: C.purple, anchor: 'start' });
    var lab = ['0 dB', '+6 dB', '+12 dB', '+18 dB'], mul = ['×1', '×2', '×4', '×8'];
    for (var i = 0; i < 4; i++) {
      var x = 30 + i * 80, top = 126 - 24 * (i + 1);
      s += '<rect x="' + x + '" y="' + top + '" width="80" height="' + (126 - top) + '" fill="' + ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa'][i] + '" stroke="#fff" stroke-width="1.5"/>';
      s += t(x + 40, top + 17, lab[i], { size: 13, weight: 800, fill: C.ink });
      s += t(x + 40, top - 6, '음압 ' + mul[i], { size: 13, weight: 700, fill: C.purple });
    }
    return svgM(360, 130, s, '계단 한 칸마다 6 dB 씩, 음압은 2배씩 커지는 그림');
  };

  /* 이론 4: 왜 「역제곱」일까 — 손전등 빛처럼 넓게 퍼져요 */
  V.pwSpread = function () {
    var s = t(200, 18, '손전등 빛처럼 멀수록 넓게 퍼져요', { size: 14, weight: 800 });
    var sx = 28, sy = 96;
    s += '<path d="M' + sx + ' ' + sy + 'L340 44M' + sx + ' ' + sy + 'L340 148" stroke="' + C.amber + '" stroke-width="1.4" stroke-dasharray="4 4"/>';
    s += spk(sx - 6, sy, 0.75);
    var sq = function (x, n, side, col) { var o = '', c = side / n, y0 = sy - side / 2; for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) o += '<rect x="' + (x + a * c).toFixed(1) + '" y="' + (y0 + b * c).toFixed(1) + '" width="' + c.toFixed(1) + '" height="' + c.toFixed(1) + '" fill="' + col + '" fill-opacity=".35" stroke="' + col + '" stroke-width="1.5"/>'; return o; };
    s += sq(128, 1, 40, C.blue) + sq(228, 2, 80, C.orange);
    s += t(148, 134, '1 m', { size: 13, weight: 800, fill: C.blue }) + t(148, 152, '1칸', { size: 13, weight: 700, fill: C.blue });
    s += t(268, 154, '2 m', { size: 13, weight: 800, fill: C.orange }) + t(318, 100, '4칸', { size: 14, weight: 800, fill: C.orange, anchor: 'start' });
    s += t(200, 180, '같은 에너지가 4칸에 나뉘어요 → 한 칸 세기 1/4', { size: 13, weight: 700 }) + t(200, 198, '세기 1/4 = 음압 1/2 = 약 −6 dB', { size: 13, weight: 800, fill: C.red });
    return svgM(400, 206, s, '거리가 2배가 되면 소리가 퍼지는 넓이가 4배가 되는 그림');
  };

  /* 이론 4 개념 체크: 그림을 보고 고르기 */
  V.pwCheckDist = function () {
    var s = '<path d="M10 86H312" stroke="' + C.line + '" stroke-width="2"/>';
    s += person(28, 40) + t(28, 108, '설교자', { size: 13, weight: 700 });
    [[150, '2 m', '84 dB', C.blue], [268, '4 m', '? dB', C.red]].forEach(function (p) {
      s += '<path d="M' + p[0] + ' 80V92" stroke="' + C.sub + '" stroke-width="2"/>' + '<circle cx="' + p[0] + '" cy="66" r="10" fill="' + p[3] + '"/>';
      s += t(p[0], 44, p[2], { size: 16, weight: 900, fill: p[3] }) + t(p[0], 108, p[1], { size: 14, weight: 800 });
    });
    s += t(160, 132, '반사는 없다고 생각해요 · 간격은 대강', { size: 13, fill: C.sub });
    return svgM(320, 140, s, '설교자에서 2 m 자리는 84 dB, 4 m 자리는 물음표');
  };

  /* 이론 5: 그네 비유 — 같은 박자 / 반대 박자 */
  V.pwSwing = function () {
    var s = '';
    [[4, true, '둘 다 같은 박자로 밀어요', C.green], [204, false, '한 명은 밀고, 한 명은 당겨요', C.red]].forEach(function (p) {
      var x = p[0], cx = x + 128;
      s += rect(x, 4, 192, 176, '#fff', C.line) + t(x + 96, 26, p[2], { size: 13, weight: 800, fill: p[3] });
      s += '<path d="M' + (cx - 30) + ' 44H' + (cx + 30) + 'M' + (cx - 30) + ' 44L' + (cx - 44) + ' 140M' + (cx + 30) + ' 44L' + (cx + 44) + ' 140" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>';
      var sw = p[1] ? 30 : 0;
      s += '<path d="M' + cx + ' 44L' + (cx + sw) + ' 112" stroke="#475569" stroke-width="2"/><rect x="' + (cx + sw - 12) + '" y="110" width="24" height="6" rx="2" fill="#475569"/>';
      if (p[1]) s += '<path d="M' + (cx + 40) + ' 100l8 -6M' + (cx + 42) + ' 112l9 -2" stroke="' + p[3] + '" stroke-width="2" stroke-linecap="round"/>';
      s += t(x + 12, 72, 'A', { size: 14, weight: 900, fill: C.blue, anchor: 'start' }) + arrow(x + 28, 67, x + 84, 67, C.blue) + t(x + 56, 88, '밀기', { size: 13.5, weight: 700, fill: C.blue });
      s += t(x + 12, 118, 'B', { size: 14, weight: 900, fill: p[1] ? C.blue : C.orange, anchor: 'start' }) + (p[1] ? arrow(x + 28, 113, x + 84, 113, C.blue) : arrow(x + 84, 113, x + 28, 113, C.orange)) + t(x + 56, 134, p[1] ? '밀기' : '당기기', { size: 13.5, weight: 700, fill: p[1] ? C.blue : C.orange });
      s += okx(x + 174, 160, p[1]) + t(x + 84, 165, p[1] ? '그네가 더 높이 가요' : '그네가 거의 멈춰요', { size: 13, weight: 800, fill: p[3] });
    });
    s += t(100, 198, '같은 박자 → +6 dB', { size: 13, weight: 800, fill: C.green }) + t(300, 198, '반대 박자 → 지워져요', { size: 13, weight: 800, fill: C.red });
    return svgM(400, 206, s, '두 사람이 같은 박자로 그네를 밀면 높이 가고, 한 명이 밀고 한 명이 당기면 거의 멈추는 그림');
  };

  /* 이론 6: 소리의 3요소 — 높이 · 크기 · 음색 */
  V.pwThree = function () {
    var s = t(200, 18, '소리를 구별하는 세 가지(소리의 3요소)', { size: 14, weight: 800 });
    var saw = function (x0, w, ym, amp, col) { var d = ''; for (var i = 0; i <= 120; i++) { var u = i / 120, y = 0; for (var n = 1; n <= 6; n++) y += Math.sin(u * Math.PI * 2 * 2 * n) / n; d += (i ? 'L' : 'M') + (x0 + u * w).toFixed(1) + ' ' + (ym - amp * y * 0.6).toFixed(1); } return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2.2"/>'; };
    [['높이', '= 주파수', C.blue], ['크기', '= 진폭', C.purple], ['음색', '= 파형 · 배음', C.orange]].forEach(function (c, i) {
      var x = 4 + i * 132;
      s += rect(x, 28, 128, 176, '#fff', C.line) + t(x + 64, 50, c[0], { size: 15, weight: 900, fill: c[2] }) + t(x + 64, 68, c[1], { size: 13, weight: 700, fill: c[2] });
      if (i === 0) s += sine(x + 10, 108, 104, 14, 1.5, c[2], 2.2) + sine(x + 10, 108, 158, 14, 4, c[2], 2.2);
      if (i === 1) s += sine(x + 10, 108, 104, 6, 2, c[2], 2.2) + sine(x + 10, 108, 158, 20, 2, c[2], 2.2);
      if (i === 2) s += sine(x + 10, 108, 104, 14, 2, c[2], 2.2) + saw(x + 10, 108, 158, 14, c[2]);
      var lab = [['낮은 음', '높은 음'], ['작은 소리', '큰 소리'], ['플루트 같은 소리', '바이올린 같은 소리']][i];
      s += t(x + 64, 128, lab[0], { size: 13, fill: C.sub }) + t(x + 64, 194, lab[1], { size: 13, fill: C.sub });
    });
    return svgM(400, 210, s, '소리의 높이는 주파수, 크기는 진폭, 음색은 파형과 배음으로 정해지는 그림');
  };

  /* 이론 6: 마스킹 — 큰 소리가 가까운 작은 소리를 가려요 */
  V.pwMask = function () {
    var s = t(200, 18, '큰 소리가 가까운 작은 소리를 가려요(마스킹)', { size: 13.5, weight: 800 });
    var X0 = 24, X1 = 388, Y0 = 156;
    s += '<path d="M' + X0 + ' ' + Y0 + 'H' + X1 + '" stroke="#94a3b8" stroke-width="1.5"/>' + t(X1, Y0 + 20, '높은 소리 →', { size: 13, fill: C.sub, anchor: 'end' }) + t(X0, Y0 + 20, '← 낮은 소리', { size: 13, fill: C.sub, anchor: 'start' });
    var d = 'M' + X0 + ' ' + Y0; for (var x = X0; x <= X1; x += 4) { var u = x - 110, h = u < 0 ? 104 * Math.exp(-u * u / 900) : 104 * Math.exp(-u / 90); d += 'L' + x + ' ' + (Y0 - h).toFixed(1); }
    s += '<path d="' + d + 'L' + X1 + ' ' + Y0 + 'Z" fill="#ede9fe" stroke="' + C.purple + '" stroke-width="1.6" stroke-dasharray="5 4"/>';
    s += '<rect x="98" y="46" width="24" height="110" rx="3" fill="' + C.purple + '"/>' + t(110, 40, '큰 베이스', { size: 13, weight: 800, fill: C.purple });
    s += '<rect x="168" y="118" width="16" height="38" rx="3" fill="#94a3b8"/>' + t(190, 76, '가려져서', { size: 13.5, weight: 800, fill: C.red, anchor: 'start' }) + t(190, 92, '안 들려요', { size: 13.5, weight: 800, fill: C.red, anchor: 'start' }) + '<path d="M196 98L180 114" stroke="' + C.red + '" stroke-width="1.5"/>';
    s += '<rect x="318" y="118" width="16" height="38" rx="3" fill="' + C.teal + '"/>' + t(326, 110, '들려요', { size: 13, weight: 800, fill: C.teal });
    s += t(206, 194, '저음은 위쪽(높은 소리)을 더 넓게 가려요', { size: 13.5, fill: C.sub });
    return svgM(400, 202, s, '큰 베이스 소리가 바로 위 작은 소리를 가리고, 멀리 떨어진 높은 소리는 들리는 그림');
  };

  /* 확인 문제 4: 마이크 두 개 상황 */
  V.pwMicPair = function () {
    var s = '<circle cx="30" cy="74" r="20" fill="#fde68a" stroke="' + C.amber + '" stroke-width="1.5"/>' + t(30, 112, '입', { size: 13, weight: 700 });
    s += '<rect x="76" y="56" width="34" height="11" rx="5" fill="#334155"/>' + t(93, 30, '마이크 A', { size: 13, weight: 800 }) + t(93, 46, '가까워요', { size: 13, fill: C.sub });
    s += '<rect x="152" y="98" width="34" height="11" rx="5" fill="#334155"/>' + t(169, 126, '마이크 B', { size: 13, weight: 800 }) + t(169, 142, '조금 멀어요', { size: 13, fill: C.sub });
    s += '<path d="M50 70L76 62M50 80L152 103" stroke="' + C.purple + '" stroke-width="1.6" stroke-dasharray="4 3"/>';
    s += rect(232, 8, 164, 166, '#f8fafc', C.line) + t(314, 28, 'A · B 둘 다 올리면', { size: 13, weight: 800, fill: C.purple });
    var d = '', X0 = 244, W = 140; for (var i = 0; i <= W; i++) { var f = 50 * Math.pow(200, i / W), th = 2 * Math.PI * f * 0.001, re = 1 + 0.8 * Math.cos(th), im = 0.8 * Math.sin(th), db = 20 * Math.log10(Math.hypot(re, im)); d += (i ? 'L' : 'M') + (X0 + i).toFixed(1) + ' ' + (66 - db * 2.2).toFixed(1); }
    s += '<path d="M' + X0 + ' 66H' + (X0 + W) + '" stroke="#94a3b8" stroke-dasharray="3 3"/><path d="' + d + '" fill="none" stroke="' + C.purple + '" stroke-width="2"/>';
    s += t(314, 140, '빗살처럼 들쭉날쭉', { size: 13.5, weight: 700, fill: C.purple }) + t(240, 162, '낮은 소리', { size: 13, fill: C.sub, anchor: 'start' }) + t(388, 162, '높은 소리', { size: 13, fill: C.sub, anchor: 'end' });
    return svgM(400, 178, s, '입에서 거리가 다른 마이크 두 개를 함께 올렸을 때 생기는 빗살 모양 주파수 그래프');
  };

  /* =========================================================================== 실습: 파동 실험대 (STASims.waveLab) */
  var FMIN = 10, FMAX = 24000, REF_DB = 90, S1X = -1.5, S2X = 1.5, RX = 6.5, RY0 = 0.5, RY1 = 7;
  var PX = 40, OX = 300, OY = 26;   // 본당 그림: 1 m = 40 px
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function f2v(f) { return Math.round(Math.log(f / FMIN) / Math.log(FMAX / FMIN) * 1000); }
  function v2f(v) { return FMIN * Math.pow(FMAX / FMIN, v / 1000); }
  function fmtF(f) { return f >= 10000 ? (f / 1000).toFixed(1) + ' kHz' : f >= 1000 ? (f / 1000).toFixed(2) + ' kHz' : f >= 100 ? f.toFixed(0) + ' Hz' : f.toFixed(1) + ' Hz'; }
  function fmtL(m) { return m >= 1 ? m.toFixed(2) + ' m' : m >= 0.1 ? (m * 100).toFixed(1) + ' cm' : m >= 0.01 ? (m * 100).toFixed(2) + ' cm' : (m * 1000).toFixed(1) + ' mm'; }
  function fmtT(ms) { return ms >= 10 ? ms.toFixed(1) + ' ms' : ms >= 1 ? ms.toFixed(2) + ' ms' : ms.toFixed(3) + ' ms'; }
  function sg(v, n) { return (v > 0.04 ? '+' : v < -0.04 ? '−' : '') + Math.abs(v).toFixed(n == null ? 1 : n); }
  function band(f) {
    if (f < 20) return ['초저주파', '20 Hz 아래 — 사람 귀에는 들리지 않아요', 'out'];
    if (f > 20000) return ['초음파', '20 kHz 위 — 사람 귀에는 들리지 않아요', 'out'];
    return f < 250 ? ['저역', '킥 · 베이스 · 목소리의 기본음 쪽이에요', 'lo'] : f < 4000 ? ['중역', '말소리가 또렷하게 들리는 데 중요한 쪽이에요', 'mid'] : ['고역', '배음 · 숨소리 · 심벌의 반짝임 쪽이에요', 'hi'];
  }
  function examples(f) {
    var o = [];
    if (Math.abs(f / 27.5 - 1) < 0.03) o.push('피아노 가장 낮은 음(A0) 27.5 Hz 근처');
    if (f >= 85 && f <= 180) o.push('남성 목소리 기본음 범위(약 85–180 Hz)');
    if (f >= 165 && f <= 255) o.push('여성 목소리 기본음 범위(약 165–255 Hz)');
    if (Math.abs(f / 440 - 1) < 0.02) o.push('A4(라) 440 Hz 근처');
    if (Math.abs(f / 4186 - 1) < 0.03) o.push('피아노 가장 높은 음(C8) 약 4186 Hz 근처');
    if (f >= 2000 && f <= 5000) o.push('사람 귀가 가장 예민한 2–5 kHz');
    if (f > 12000 && f <= 20000) o.push('높은 쪽 끝은 나이가 들수록 잘 안 들려요');
    return o;
  }
  var WINS = [0.04, 0.1, 0.2, 0.4, 1, 2, 4, 10, 20, 40];

  function injectCss() {
    if (document.getElementById('sta-mod-physwave-css')) return;
    var s = document.createElement('style'); s.id = 'sta-mod-physwave-css';
    s.textContent = [
      '.sim-pw{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:start;min-width:0}',
      '.sim-pw-col{display:flex;flex-direction:column;gap:10px;min-width:0}',
      '.sim-pw svg.pw-svg{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none}',
      '.sim-pw-stage{border-radius:8px;background:#0b1626;overflow:hidden}',
      '.sim-pw-room{touch-action:none;cursor:pointer;border-radius:8px;background:#f1f5f9}',
      '.sim-pw-read{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:8px}',
      '.sim-pw-read div{padding:6px 8px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;min-width:0}',
      '.sim-pw-read span{display:block;font-size:.66rem;color:#64748b;font-weight:700}',
      '.sim-pw-read b{display:block;font-size:.92rem;color:#0f2747;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.sim-pw-read b.out{color:#b91c1c}.sim-pw-read b.lo{color:#2563eb}.sim-pw-read b.mid{color:#0e7490}.sim-pw-read b.hi{color:#ea580c}',
      '.sim-pw-ex{font-size:.76rem;line-height:1.5;color:#475569;margin:6px 0 0;min-height:1.2em}',
      '.sim-pw-ctl{display:grid;gap:10px}',
      '.sim-pw-ctl .sim-range span{font-weight:700;color:#334155}.sim-pw-ctl .sim-range output{font-variant-numeric:tabular-nums;color:#0f2747;font-weight:800}',
      '.sim-pw-ctl input[type=range]{height:28px;accent-color:#0e7490;touch-action:pan-y}',
      '.sim-pw-btns{display:flex;flex-wrap:wrap;gap:4px}.sim-pw-btns .sim-btn{padding:4px 8px}',
      '.sim-pw-btns .sim-btn[aria-pressed=true]{background:#0f2747;color:#fff;border-color:#0f2747}',
      '.sim-pw-rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px}',
      '.sim-pw-rows .sim-row{min-width:0}.sim-pw-rows .sim-row b{white-space:nowrap}',
      '.sim-pw-msg{grid-column:1/-1;margin:0;padding:8px 12px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:.8rem;line-height:1.55;color:#334155}',
      '.sim-pw-msg.ok{background:#ecfdf5;border-color:#a7f3d0;color:#065f46;font-weight:700}',
      '.sim-pw-cap{font-size:.7rem;color:#7a8aa0;margin:4px 0 0;line-height:1.45}',
      '@media (max-width:980px){.sim-pw{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:520px){.sim-pw-read{grid-template-columns:repeat(2,minmax(0,1fr))}.sim-pw-rows{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function waveLab(el, opts) {
    opts = opts || {}; injectCss();
    var S = { f: 440, a: 1, s2: false, ph: 0, L: { x: S1X, y: 2 }, done: {}, msg: '슬라이더를 끌어 보세요. 오른쪽 그림의 주황 점(듣는 사람)도 끌어 옮겨 보세요.', msgOk: false };
    var alive = true, raf = 0, t0 = performance.now(), drag = null;
    var reduce = false; try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduce = false; }

    el.innerHTML = '<div class="sim-pw">' +
      '<div class="sim-pw-col">' +
        '<div class="sim-box"><h4>파형과 파장 — 음원 1 <small>공기 알갱이와 압력 (움직임은 실제보다 아주 느리게)</small></h4>' +
          '<div class="sim-pw-stage"><svg class="pw-svg" data-role="wave" viewBox="0 0 600 236" role="img" aria-label="음원 1 의 압력 파형과 파장 자" font-family="Pretendard, system-ui, sans-serif"></svg></div>' +
          '<div class="sim-pw-read" data-role="read"></div><p class="sim-pw-ex" data-role="ex"></p></div>' +
        '<div class="sim-box sim-pw-ctl"><h4>음원 1 조절 <small>슬라이더를 끌고, 손을 떼면 과제를 확인해요</small></h4>' +
          '<label class="sim-range"><span><b>주파수 f</b> <output data-out="f"></output></span><input type="range" min="0" max="1000" step="1" data-sim="f" aria-label="주파수"></label>' +
          '<div class="sim-pw-btns"><button type="button" class="sim-btn" data-act="fmul" data-v="0.5">÷2 (한 옥타브 아래)</button><button type="button" class="sim-btn" data-act="fmul" data-v="0.99">−1%</button><button type="button" class="sim-btn" data-act="fmul" data-v="1.01">+1%</button><button type="button" class="sim-btn" data-act="fmul" data-v="2">×2 (한 옥타브 위)</button></div>' +
          '<div class="sim-pw-btns" aria-label="예시 주파수"><button type="button" class="sim-btn" data-act="fset" data-v="100">100 Hz</button><button type="button" class="sim-btn" data-act="fset" data-v="1000">1 kHz</button><button type="button" class="sim-btn" data-act="fset" data-v="10000">10 kHz</button></div>' +
          '<label class="sim-range"><span><b>진폭 (음압)</b> <output data-out="a"></output></span><input type="range" min="0.25" max="4" step="0.05" data-sim="a" aria-label="진폭"></label>' +
          '<p class="sim-pw-cap">처음 진폭(×1)은 스피커 앞 1 m 에서 90 dB SPL 이라고 가정했어요(교육용 예시).</p></div>' +
      '</div>' +
      '<div class="sim-pw-col">' +
        '<div class="sim-box"><h4>본당을 위에서 본 그림 <small>교육용 배치 · 벽 반사가 없다고 보고 계산</small></h4>' +
          '<svg class="pw-svg sim-pw-room" data-role="room" viewBox="0 0 600 322" role="img" aria-label="두 스피커와 듣는 사람 위치. 끌어서 듣는 사람을 옮겨요" font-family="Pretendard, system-ui, sans-serif"></svg>' +
          '<p class="sim-pw-cap">주황 점(듣는 사람)을 끌어서 옮겨요. 점선 원은 음원 1 에서 1 · 2 · 4 m 예요.</p>' +
          '<div class="sim-pw-btns" style="margin-top:8px"><button type="button" class="sim-btn" data-act="s2" aria-pressed="false"></button></div>' +
          '<label class="sim-range" style="margin-top:8px"><span><b>음원 2 위상(박자)</b> <output data-out="ph"></output></span><input type="range" min="0" max="360" step="1" data-sim="ph" aria-label="음원 2 위상"></label>' +
          '<div class="sim-pw-btns" style="margin-top:4px"><button type="button" class="sim-btn" data-act="ph" data-v="-5">−5°</button><button type="button" class="sim-btn" data-act="ph" data-v="5">+5°</button></div>' +
          '<div class="sim-read sim-pw-rows" data-role="lst" style="margin-top:8px"></div></div>' +
        '<div class="sim-box"><h4>듣는 자리에서 들리는 파형 <small>시간에 따라 · 파랑 음원 1 · 주황 음원 2 · 초록 합</small></h4>' +
          '<svg class="pw-svg" data-role="time" viewBox="0 0 600 150" role="img" aria-label="듣는 자리의 시간 파형" font-family="Pretendard, system-ui, sans-serif"></svg>' +
          '<h4 style="margin-top:10px">두 음원 합 — 주파수마다 <small>음원 1 혼자일 때와 비교 (콤 필터)</small></h4>' +
          '<svg class="pw-svg" data-role="comb" viewBox="0 0 600 150" role="img" aria-label="두 음원을 합친 주파수 그래프" font-family="Pretendard, system-ui, sans-serif"></svg></div>' +
      '</div>' +
      '<p class="sim-pw-msg" data-role="msg" role="status"></p>' +
    '</div>';
    var q = function (s) { return el.querySelector(s); };
    var room = q('[data-role=room]'), waveSvg = q('[data-role=wave]');
    q('[data-sim=f]').value = f2v(S.f); q('[data-sim=a]').value = S.a; q('[data-sim=ph]').value = S.ph;

    /* ---------------- 계산 */
    function lam() { return SOUND / S.f; }
    function dB() { return 20 * Math.log10(S.a); }
    function r1() { return Math.max(0.05, Math.hypot(S.L.x - S1X, S.L.y)); }
    function r2() { return Math.max(0.05, Math.hypot(S.L.x - S2X, S.L.y)); }
    function lvl1() { return REF_DB + dB() - 20 * Math.log10(r1()); }
    function relAt(f) {   // 두 음원 합 ÷ 음원 1 혼자 (dB)
      var a = r1() / r2(), th = S.ph * Math.PI / 180 - 2 * Math.PI * f * (r2() - r1()) / SOUND, re = 1 + a * Math.cos(th), im = a * Math.sin(th), m = Math.hypot(re, im);
      return 20 * Math.log10(Math.max(m, 1e-6));
    }
    function rel() { return S.s2 ? relAt(S.f) : 0; }
    function judge() {
      var l = lam();
      if (Math.abs(l - 1) <= 0.03) hit('lambda', '좋아요. ' + fmtF(S.f) + ' 의 파장은 ' + fmtL(l) + ' 예요. 343 ÷ 343 = 1 m 예요.');
      if (S.f < 20 || S.f > 20000) hit('audible', fmtF(S.f) + ' 는 들리는 범위(약 20 Hz – 20 kHz) 밖이에요. 사람 귀에는 들리지 않아요. 파장은 ' + fmtL(l) + ' 로 ' + (S.f < 20 ? '아주 길어요.' : '아주 짧아요.'));
      if (S.a >= 1.95 && S.a <= 2.05) hit('amp', '진폭(음압) 2배 = ' + sg(dB()) + ' dB 예요. 음압이 2배가 될 때마다 약 6 dB 씩 늘어요.');
      if (!S.s2 && r1() >= 3.9 && r1() <= 4.1) hit('dist', '거리 2배(2 m → ' + r1().toFixed(2) + ' m)에서 ' + sg(-20 * Math.log10(r1() / 2)) + ' dB 예요. 넓게 퍼져서 약 6 dB 줄었어요.');
      if (S.s2 && rel() >= 5.5) hit('inphase', '두 소리가 같은 박자로 도착했어요. 음원 1 혼자일 때보다 ' + sg(rel()) + ' dB 커졌어요. 음압이 2배 가까이 됐어요.');
      if (S.s2 && rel() <= -15) hit('cancel', '두 소리가 반대 박자로 만나 거의 지워졌어요(' + sg(rel()) + ' dB). 이렇게 서로 지우는 것을 상쇄라고 해요.');
    }
    function hit(id, m) { if (S.done[id]) return; S.done[id] = true; S.msg = m; S.msgOk = true; if (opts.onTask) opts.onTask(id); }

    /* ---------------- 그리기 */
    function winW() { var l = lam(); for (var i = 0; i < WINS.length; i++) if (WINS[i] >= 1.6 * l) return WINS[i]; return WINS[WINS.length - 1]; }
    function drawWave(ph) {
      var W = winW(), l = lam(), x0 = 24, x1 = 584, pxm = (x1 - x0) / W, lpx = l * pxm, k = 2 * Math.PI / lpx, av = clamp(S.a, 0, 4) / 4;
      var s = '<rect x="0" y="0" width="600" height="236" fill="#0b1626"/>';
      // 공기 알갱이 (변위 = sin, 압력 = −cos → 밀한 곳이 압력 높음)
      var s0 = Math.min(0.55 * av + 0.35, 0.85) / k, dots = '';
      var step = Math.max(4, Math.min(9, lpx / 8));
      if (lpx >= 6) for (var r = 0; r < 5; r++) { var y = 30 + r * 11; for (var xi = x0 + (r % 2) * step / 2; xi <= x1; xi += step) { var xd = xi + s0 * Math.sin(k * (xi - x0) - ph); if (xd >= x0 - 1 && xd <= x1 + 1) dots += '<circle cx="' + xd.toFixed(1) + '" cy="' + y + '" r="1.9"/>'; } }
      else dots = '<text x="300" y="56" font-size="13" fill="#94a3b8" text-anchor="middle">알갱이 간격보다 파장이 짧아 생략했어요</text>';
      s += '<g fill="#93c5fd">' + dots + '</g>';
      var ym = 132, A = 12 + 44 * av, d = '', n = Math.min(900, Math.max(200, Math.round((x1 - x0) / lpx * 24)));
      for (var i = 0; i <= n; i++) { var x = x0 + i / n * (x1 - x0); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (ym + A * Math.cos(k * (x - x0) - ph)).toFixed(1); }
      s += '<path d="M' + x0 + ' ' + ym + 'H' + x1 + '" stroke="#334155" stroke-dasharray="4 4"/><path d="' + d + '" fill="none" stroke="#38bdf8" stroke-width="2.4"/>';
      // 파장 자: 첫 번째 압력 꼭대기(cos = −1 → 위)에서 한 파장
      var xs = x0 + ((Math.PI + ph) / k) % lpx; if (xs < x0) xs += lpx;
      if (xs + lpx > x1) xs -= lpx;
      if (lpx >= 6 && xs >= x0 - 0.5) { var xe = xs + lpx; s += '<path d="M' + xs.toFixed(1) + ' 194V184M' + xs.toFixed(1) + ' 189H' + xe.toFixed(1) + 'M' + xe.toFixed(1) + ' 194V184" stroke="#fb923c" stroke-width="2" fill="none"/><path d="M' + xs.toFixed(1) + ' ' + (ym - A) .toFixed(1) + 'V184M' + xe.toFixed(1) + ' ' + (ym - A).toFixed(1) + 'V184" stroke="#fb923c" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>'; }
      s += '<text x="300" y="210" font-size="20" font-weight="800" fill="#fdba74" text-anchor="middle">파장 = 343 ÷ ' + fmtF(S.f) + ' = ' + fmtL(l) + '</text>';
      // 눈금: 보이는 폭
      s += '<path d="M' + x0 + ' 226H' + x1 + '" stroke="#475569"/>';
      [0, 0.5, 1].forEach(function (u) { var x = x0 + u * (x1 - x0); s += '<path d="M' + x + ' 222V230" stroke="#64748b"/>'; });
      s += '<text x="' + x0 + '" y="18" font-size="15" fill="#94a3b8">스피커 쪽</text><text x="' + x1 + '" y="18" font-size="15" fill="#94a3b8" text-anchor="end">보이는 폭 ' + fmtL(W) + ' →</text>';
      s += '<text x="10" y="' + (ym + 4) + '" font-size="11" fill="#64748b">0</text>';
      waveSvg.innerHTML = s;
    }
    function P(x, y) { return [OX + x * PX, OY + y * PX]; }
    function drawRoom() {
      var s = '<rect x="0" y="0" width="600" height="322" fill="#f1f5f9"/><rect x="40" y="0" width="520" height="14" fill="#e2e8f0"/><text x="300" y="11" font-size="13" fill="#64748b" text-anchor="middle">강단</text>';
      var p1 = P(S1X, 0), p2 = P(S2X, 0), pl = P(S.L.x, S.L.y);
      [1, 2, 4].forEach(function (m) { s += '<circle cx="' + p1[0] + '" cy="' + p1[1] + '" r="' + m * PX + '" fill="none" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="4 5" opacity=".75"/><text x="' + p1[0] + '" y="' + (p1[1] + m * PX - 4) + '" font-size="15" font-weight="700" fill="#2563eb" text-anchor="middle">' + m + ' m</text>'; });
      // 음원에서 듣는 사람까지
      s += '<path d="M' + p1[0] + ' ' + p1[1] + 'L' + pl[0] + ' ' + pl[1] + '" stroke="#2563eb" stroke-width="2"/>';
      if (S.s2) s += '<path d="M' + p2[0] + ' ' + p2[1] + 'L' + pl[0] + ' ' + pl[1] + '" stroke="#ea580c" stroke-width="2" stroke-dasharray="6 4"/>';
      s += '<path d="M' + OX + ' 16V318" stroke="#94a3b8" stroke-dasharray="2 5"/><text x="' + (OX + 4) + '" y="316" font-size="14" fill="#64748b">가운데 선</text>';
      s += '<rect x="' + (p1[0] - 16) + '" y="' + (p1[1] - 10) + '" width="32" height="18" rx="4" fill="#1d4ed8"/><text x="' + p1[0] + '" y="' + (p1[1] + 3) + '" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">1</text>';
      s += '<rect x="' + (p2[0] - 16) + '" y="' + (p2[1] - 10) + '" width="32" height="18" rx="4" fill="' + (S.s2 ? '#ea580c' : '#cbd5e1') + '"/><text x="' + p2[0] + '" y="' + (p2[1] + 3) + '" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">2</text>';
      s += '<text x="' + (p1[0] - 22) + '" y="' + (p1[1] + 22) + '" font-size="15" font-weight="700" fill="#1d4ed8" text-anchor="end">메인 L</text><text x="' + (p2[0] + 22) + '" y="' + (p2[1] + 22) + '" font-size="15" font-weight="700" fill="' + (S.s2 ? '#c2410c' : '#94a3b8') + '">메인 R' + (S.s2 ? '' : ' (꺼짐)') + '</text>';
      s += '<circle cx="' + pl[0] + '" cy="' + pl[1] + '" r="26" fill="#ea580c" opacity=".12"/><circle cx="' + pl[0] + '" cy="' + pl[1] + '" r="11" fill="#f97316" stroke="#fff" stroke-width="3"/>';
      var lab = r1().toFixed(2) + ' m · ' + lvl1().toFixed(1) + ' dB', lx2 = clamp(pl[0], 110, 490), ly2 = pl[1] > 270 ? pl[1] - 22 : pl[1] + 30;
      s += '<text x="' + lx2 + '" y="' + ly2 + '" font-size="19" font-weight="800" fill="#9a3412" text-anchor="middle" stroke="#f1f5f9" stroke-width="4" paint-order="stroke">' + lab + '</text>';
      room.innerHTML = s;
    }
    function drawTime() {
      var s = '<rect x="0" y="0" width="600" height="150" fill="#fff"/>', x0 = 36, x1 = 588, ym = 72, H = 30, a2 = S.s2 ? r1() / r2() : 0, th2 = S.ph * Math.PI / 180 - 2 * Math.PI * S.f * (r2() - r1()) / SOUND;
      function path(fn, col, w, dash) { var d = ''; for (var i = 0; i <= 240; i++) { var u = i / 240 * 4 * Math.PI; d += (i ? 'L' : 'M') + (x0 + i / 240 * (x1 - x0)).toFixed(1) + ' ' + (ym - H * fn(u)).toFixed(1); } return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'; }
      s += '<path d="M' + x0 + ' ' + ym + 'H' + x1 + '" stroke="#e2e8f0"/>';
      s += path(function (u) { return Math.sin(u); }, '#2563eb', 1.6);
      if (S.s2) { s += path(function (u) { return a2 * Math.sin(u + th2); }, '#ea580c', 1.6, '5 4'); s += path(function (u) { return Math.sin(u) + a2 * Math.sin(u + th2); }, '#059669', 3); }
      var xm = x0 + (x1 - x0) / 2; s += '<path d="M' + x0 + ' 134V126M' + x0 + ' 130H' + xm + 'M' + xm + ' 134V126" stroke="#7c3aed" stroke-width="1.8" fill="none"/><text x="' + ((x0 + xm) / 2) + '" y="146" font-size="18" font-weight="800" fill="#7c3aed" text-anchor="middle">한 번 떨림(주기) ' + fmtT(1000 / S.f) + '</text>';
      s += '<text x="' + x1 + '" y="146" font-size="14" fill="#64748b" text-anchor="end">두 번 떨림만 보여요</text>';
      s += '<text x="4" y="' + (ym - H + 4) + '" font-size="10" fill="#64748b">+</text><text x="4" y="' + (ym + H + 4) + '" font-size="10" fill="#64748b">−</text>';
      q('[data-role=time]').innerHTML = s;
    }
    function drawComb() {
      var s = '<rect x="0" y="0" width="600" height="150" fill="#fff"/>', X0 = 50, X1 = 584, Y = function (db) { return 10 + (8 - db) / 38 * 112; }, F = function (f) { return lx(f, X0, X1, 20, 20000); };
      [6, 0, -10, -20, -30].forEach(function (db) { s += '<path d="M' + X0 + ' ' + Y(db).toFixed(1) + 'H' + X1 + '" stroke="' + (db === 0 ? '#94a3b8' : '#eef2f7') + '"' + (db === 0 ? ' stroke-dasharray="3 3"' : '') + '/><text x="' + (X0 - 4) + '" y="' + (Y(db) + 4).toFixed(1) + '" font-size="14" fill="#64748b" text-anchor="end">' + (db > 0 ? '+' : '') + db + '</text>'; });
      [20, 100, 1000, 10000, 20000].forEach(function (f) { s += '<text x="' + F(f).toFixed(1) + '" y="147" font-size="14" fill="#64748b" text-anchor="middle">' + (f >= 1000 ? f / 1000 + 'k' : f) + '</text>'; });
      if (!S.s2) { s += '<text x="316" y="70" font-size="17" fill="#94a3b8" text-anchor="middle">음원 2 를 켜면 두 소리를 합친 그래프가 나와요</text>'; q('[data-role=comb]').innerHTML = s; return; }
      var d = ''; for (var i = 0; i <= 500; i++) { var f = 20 * Math.pow(1000, i / 500); d += (i ? 'L' : 'M') + F(f).toFixed(1) + ' ' + Y(Math.max(-30, relAt(f))).toFixed(1); }
      s += '<path d="' + d + '" fill="none" stroke="#7c3aed" stroke-width="2"/>';
      if (S.f >= 20 && S.f <= 20000) { var xf = F(S.f), yv = Y(Math.max(-30, rel())); s += '<path d="M' + xf.toFixed(1) + ' 10V132" stroke="#ea580c" stroke-dasharray="3 3"/><circle cx="' + xf.toFixed(1) + '" cy="' + yv.toFixed(1) + '" r="5" fill="#ea580c"/>'; }
      q('[data-role=comb]').innerHTML = s;
    }
    function renderRead() {
      var b = band(S.f), l = lam();
      q('[data-role=read]').innerHTML = '<div><span>주파수 f</span><b>' + fmtF(S.f) + '</b></div><div><span>주기 T</span><b>' + fmtT(1000 / S.f) + '</b></div><div><span>파장 λ</span><b>' + fmtL(l) + '</b></div><div><span>높이 구간</span><b class="' + b[2] + '">' + b[0] + '</b></div>';
      var ex = examples(S.f); q('[data-role=ex]').textContent = b[1] + (ex.length ? ' · ' + ex.join(' · ') : '');
      q('[data-out=f]').textContent = fmtF(S.f); q('[data-out=a]').textContent = '×' + S.a.toFixed(2) + ' (' + sg(dB()) + ' dB)'; q('[data-out=ph]').textContent = Math.round(S.ph) + '°' + (Math.round(S.ph) === 180 ? ' (+ · − 를 뒤바꾼 것과 같아요)' : '');
      var bt = q('[data-act=s2]'); bt.textContent = S.s2 ? '음원 2 (메인 R) 끄기' : '음원 2 (메인 R) 켜기 — 같은 소리'; bt.setAttribute('aria-pressed', String(S.s2));
      var dd = r2() - r1(), rows = '<div class="sim-row"><span>음원 1 까지</span><b>' + r1().toFixed(2) + ' m</b></div><div class="sim-row"><span>음원 1 소리</span><b>' + lvl1().toFixed(1) + ' dB SPL</b></div>' +
        '<div class="sim-row"><span>2 m 자리와 비교</span><b>' + sg(-20 * Math.log10(r1() / 2)) + ' dB</b></div>';
      if (S.s2) {
        var rv = rel(), first = Math.abs(dd) > 0.005 ? SOUND / (2 * Math.abs(dd)) : null;
        rows += '<div class="sim-row"><span>음원 2 까지</span><b>' + r2().toFixed(2) + ' m</b></div><div class="sim-row"><span>거리 차</span><b>' + (Math.abs(dd) * 100).toFixed(1) + ' cm · ' + (Math.abs(dd) / SOUND * 1000).toFixed(2) + ' ms</b></div>' +
          '<div class="sim-row"><span>두 소리 합</span><b class="' + (rv >= 5.5 ? 'ok' : rv <= -15 ? 'bad' : '') + '">' + (rv <= -30 ? '거의 0 (상쇄)' : sg(rv) + ' dB') + '</b></div>' +
          '<div class="sim-row"><span>합친 소리</span><b>' + (rv <= -30 ? '아주 작음' : (lvl1() + rv).toFixed(1) + ' dB SPL') + '</b></div>' +
          '<div class="sim-row"><span>처음 지워지는 주파수</span><b>' + (first ? (S.ph === 0 ? fmtF(first) : '위상 0° 일 때 ' + fmtF(first)) : '거리 차 없음') + '</b></div>';
      }
      q('[data-role=lst]').innerHTML = rows;
      var m = q('[data-role=msg]'); m.textContent = S.msg; m.className = 'sim-pw-msg' + (S.msgOk ? ' ok' : '');
    }
    function phase() { return reduce ? 0 : ((performance.now() - t0) / 1000) * 2 * Math.PI * 0.5; }
    function refresh() { renderRead(); drawWave(phase()); drawRoom(); drawTime(); drawComb(); }
    var last = 0;
    function loop(now) { if (!alive) return; if (!now || now - last > 33) { last = now || 0; drawWave(phase()); } raf = requestAnimationFrame(loop); }   // 초당 30번 정도만 다시 그림

    /* ---------------- 동작 */
    function setF(f) { S.f = clamp(f, FMIN, FMAX); q('[data-sim=f]').value = f2v(S.f); }
    function onClick(e) {
      var b = e.target.closest('[data-act]'); if (!b || !el.contains(b)) return;
      var act = b.getAttribute('data-act'), v = parseFloat(b.getAttribute('data-v'));
      S.msgOk = false;
      if (act === 'fmul') { setF(S.f * v); S.msg = '주파수 ' + fmtF(S.f) + ' · 파장 ' + fmtL(lam()) + '. 주파수가 2배면 파장은 반이에요.'; }
      else if (act === 'fset') { setF(v); S.msg = fmtF(S.f) + ' 의 파장은 ' + fmtL(lam()) + ' 예요.'; }
      else if (act === 's2') { S.s2 = !S.s2; S.msg = S.s2 ? '메인 R 에서도 같은 소리가 나와요. 듣는 사람을 옮기거나 위상을 바꿔 보세요.' : '음원 2 를 껐어요.'; }
      else if (act === 'ph') { S.ph = ((Math.round(S.ph + v) % 360) + 360) % 360; q('[data-sim=ph]').value = S.ph; S.msg = '음원 2 위상 ' + S.ph + '°.'; }
      refresh(); judge(); renderRead();
    }
    function readInput(tg) {
      var k = tg.getAttribute && tg.getAttribute('data-sim'); if (!k) return false;
      if (k === 'f') S.f = v2f(+tg.value); else if (k === 'a') S.a = clamp(Math.round(+tg.value * 20) / 20, 0.25, 4); else if (k === 'ph') S.ph = clamp(Math.round(+tg.value), 0, 360) % 360;
      return true;
    }
    function onInput(e) { if (!readInput(e.target)) return; S.msgOk = false; refresh(); }   // 끄는 중: 화면만
    function onChange(e) { if (!readInput(e.target)) return; refresh(); judge(); renderRead(); }   // 손을 뗄 때 과제 확인
    function toWorld(e) {
      var pt = room.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = room.getScreenCTM(); if (!m) return null; var p = pt.matrixTransform(m.inverse());
      return { x: clamp((p.x - OX) / PX, -RX, RX), y: clamp((p.y - OY) / PX, RY0, RY1) };
    }
    function onDown(e) { var w = toWorld(e); if (!w) return; drag = e.pointerId; try { room.setPointerCapture(e.pointerId); } catch (er) { /* noop */ } S.L = { x: Math.round(w.x * 100) / 100, y: Math.round(w.y * 100) / 100 }; S.msgOk = false; e.preventDefault(); refresh(); }
    function onMove(e) { if (drag !== e.pointerId) return; var w = toWorld(e); if (!w) return; S.L = { x: Math.round(w.x * 100) / 100, y: Math.round(w.y * 100) / 100 }; e.preventDefault(); drawRoom(); drawTime(); drawComb(); renderRead(); }
    function onUp(e) { if (drag !== e.pointerId) return; drag = null; S.msg = '듣는 사람: 음원 1 에서 ' + r1().toFixed(2) + ' m.'; refresh(); judge(); renderRead(); }
    el.addEventListener('click', onClick); el.addEventListener('input', onInput); el.addEventListener('change', onChange);
    room.addEventListener('pointerdown', onDown); room.addEventListener('pointermove', onMove); room.addEventListener('pointerup', onUp); room.addEventListener('pointercancel', onUp);
    refresh(); if (!reduce) raf = requestAnimationFrame(loop);

    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); el.removeEventListener('click', onClick); el.removeEventListener('input', onInput); el.removeEventListener('change', onChange); el.innerHTML = ''; },
      state: function () {
        return { ready: true, done: Object.keys(S.done), f: S.f, lambda: lam(), period: 1000 / S.f, amp: S.a, dB: dB(), listener: { x: S.L.x, y: S.L.y }, r1: r1(), r2: r2(), level: lvl1(), s2: S.s2, phase: S.ph, sum: rel(), firstNull: Math.abs(r2() - r1()) > 0.005 ? SOUND / (2 * Math.abs(r2() - r1())) : null };
      },
      set: function (o) {
        o = o || {};
        if (o.f != null) setF(+o.f);
        if (o.amp != null) { S.a = clamp(+o.amp, 0.25, 4); q('[data-sim=a]').value = S.a; }
        if (o.s2 != null) S.s2 = !!o.s2;
        if (o.phase != null) { S.ph = ((Math.round(+o.phase) % 360) + 360) % 360; q('[data-sim=ph]').value = S.ph; }
        if (o.listener) S.L = { x: clamp(+o.listener.x, -RX, RX), y: clamp(+o.listener.y, RY0, RY1) };
        refresh(); judge(); renderRead(); return this.state();
      },
      model: { C: SOUND, REF_DB: REF_DB, S1X: S1X, S2X: S2X, PX: PX, OX: OX, OY: OY }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.waveLab = waveLab;
})();

/* =========================================================================== 모듈 데이터 */
(function () {
  'use strict';
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['phys-wave'] = {
    id: 'phys-wave', path: 'physics', no: 1, noLabel: '01', status: 'ready', level: '기본', minutes: 40, img: 'img/modules/phys_wave.svg',
    title: '소리(파장)', sub: '소리는 공기의 떨림 — 떨림 횟수(주파수) · 길이(파장) · 크기(dB) · 박자(위상) · 귀',
    topics: ['소밀파(종파)', '주파수 · 주기 · 가청 범위', '파장 λ = c / f · 회절', '진폭 · dB SPL · 역제곱 법칙', '위상 · 간섭 · 콤 필터', '배음 · 등청감 곡선'],
    glanceDraft: {
      glance: [
        ['주파수 (Hz)', '1초에 몇 번 떨리는지 · 높을수록 높은 음 · 사람은 약 20 Hz – 20 kHz 를 들어요'],
        ['파장 λ', '소리 한 번 떨림의 길이 · 343 ÷ 주파수 · 100 Hz 는 약 3.4 m, 10 kHz 는 약 3.4 cm'],
        ['dB SPL', '소리 크기를 비율의 로그로 나타낸 단위 · 음압 2배 = +6 dB · 거리 2배 = −6 dB'],
        ['콤 필터', '같은 소리가 조금 늦게 더해져 일부 주파수가 빗살처럼 지워지는 현상']
      ],
      heroVis: 'pwHero'
    },
    overview: {
      lead: '소리는 <b>공기가 떨리는 것</b>이에요. 마이크는 이 떨림을 전기로 바꾸고, 스피커는 다시 공기를 떨게 해요. 이 과정에서는 떨림의 빠르기(<b>주파수</b>)와 길이(<b>파장</b>)를 배워요. 소리 크기(<b>dB</b>), 두 소리가 만나는 박자(<b>위상</b>), 우리 귀의 성질도 배워요.',
      terms: [
        ['소밀파 (종파)', '공기가 빽빽한 곳과 듬성한 곳이 번갈아 퍼지는 파도예요. 줄 선 사람 어깨를 밀면 밀림이 전해지는 것과 같아요.', 'pwTermLine'],
        ['주파수 f (Hz)', '1초에 몇 번 떨리는지예요. 줄넘기를 빨리 돌릴수록 횟수가 많듯, 많이 떨릴수록 높은 소리예요.', 'pwTermHz'],
        ['주기 T', '한 번 떨리는 데 걸리는 시간이에요. 1초에 천 번 떨리면 한 번에 1 ms(1000분의 1초)예요.'],
        ['파장 λ', '한 번 떨리는 동안 소리가 가는 길이예요. 걸음의 보폭처럼, 낮은 소리는 길고 높은 소리는 짧아요.'],
        ['dB SPL', '소리 크기를 나타내는 단위예요. 계단 한 칸(+6 dB)을 오를 때마다 공기를 미는 힘(음압)이 2배가 돼요.', 'pwTermStairs'],
        ['역제곱 법칙', '멀어질수록 소리가 작아지는 규칙이에요. 손전등 빛처럼 넓게 퍼져서, 거리 2배면 약 6 dB 작아져요.'],
        ['위상 · 콤 필터', '위상은 소리 물결의 박자예요. 같은 소리가 조금 늦게 겹치면 박자가 어긋나 빗살처럼 일부가 지워져요(콤 필터).'],
        ['배음 · 등청감 곡선', '배음은 기본음의 2배 · 3배 높이로 함께 나는 소리예요. 등청감 곡선은 높이마다 귀가 다르게 듣는 것을 그린 선이에요.']
      ],
      points: [
        '<b>낮은 소리는 파장이 길고, 높은 소리는 짧아요.</b> 100 Hz 는 약 3.4 m, 10 kHz 는 약 3.4 cm 예요.',
        '<b>음압 2배 = +6 dB</b>, <b>거리 2배 = −6 dB</b> 예요. 귀에 「두 배 크게」 들리려면 약 +10 dB 가 필요해요.',
        '한 사람 소리에는 <b>마이크를 하나만</b> 올려요. 두 개를 올리면 소리가 겹쳐 빗살처럼 지워져요(콤 필터).'
      ],
      model: null
    },
    theory: [
      { title: '소리는 공기의 떨림 — 빽빽한 곳 · 듬성한 곳', visual: 'pwPressure',
        body: '줄을 선 사람의 어깨를 툭 밀면, 밀림이 앞사람에게 차례로 전해져요. 소리도 이렇게 공기를 타고 전해져요. 스피커 앞에는 앞뒤로 떨리는 판(콘)이 있어요. 판이 앞으로 나오면 공기가 눌려 빽빽해져요(<b>밀</b>). 판이 뒤로 들어가면 공기가 듬성해져요(<b>소</b>). 이 둘이 번갈아 퍼지는 것이 소리예요(<b>소밀파</b>). 공기 알갱이는 제자리에서 앞뒤로만 흔들려요. 멀리 가는 것은 공기가 아니라 떨림이에요. 설교자의 목소리도 이 떨림으로 마이크에 닿아요. 마이크는 떨림을 전기로, 스피커는 전기를 떨림으로 바꿔요. 기억해요: 소리는 바람이 아니라 공기의 떨림이에요.',
        more: '<ul><li><b>종파</b>: 흔들리는 방향과 퍼지는 방향이 같은 파도를 종파라고 해요. 소밀파와 같은 말이에요.</li> <li><b>파형 그래프</b>: 그림이나 콘솔 화면의 물결 선(파형)은 압력이 오르내리는 모습이에요. 공기가 위아래로 출렁이는 것은 아니에요.</li> <li><b>Physics Classroom</b>: 소리는 공기 같은 물질(매질)의 알갱이가 앞뒤로 떨려서 전해지는 파도예요. 압력이 높은 곳을 압축(compression), 낮은 곳을 희박(rarefaction)이라고 해요.</li> <li>소리는 공기 같은 매질이 있어야 전해져요. 그래서 공기가 없는 곳에서는 소리가 전해지지 않아요.</li> <li><b>아주 작은 변화</b>: 겨우 들리는 소리의 압력 변화는 아주 작아요. 공기 압력(대기압)의 10억분의 1보다도 작아요(HyperPhysics). 0 dB SPL 기준 음압은 20 µPa(마이크로파스칼)예요.</li> <li>물결(수면파)은 위아래로 움직여서 소리와 모양이 달라요. 그림에서 소리를 물결처럼 그리는 것은 보기 쉽게 하려는 거예요.</li></ul>',
        check: { q: '스피커 앞 공기 알갱이는 어떻게 움직일까요?', options: [
          { t: '바람처럼 멀리 흘러간다', why: '아니에요. 알갱이는 제자리에서 흔들려요. 멀리 가는 것은 떨림이에요.' },
          { t: '제자리에서 앞뒤로 흔들린다', ok: true, why: '맞아요. 알갱이는 앞뒤로만 흔들리고, 떨림이 퍼져 나가기 때문이에요.' },
          { t: '물결처럼 위아래로 출렁인다', why: '아니에요. 그림의 위아래는 압력의 높낮이예요. 공기는 앞뒤로 흔들려요.' }] } },
      { title: '주파수 — 1초에 몇 번 떨리나 · 들리는 범위', visual: 'pwFreq',
        body: '기타의 굵은 줄은 천천히, 가는 줄은 빨리 떨려요. 천천히 떨면 낮은 소리, 빨리 떨면 높은 소리가 나요. 1초에 몇 번 떨리는지를 <b>주파수</b>라고 해요. 단위는 Hz(헤르츠)예요. 100 Hz 는 1초에 100번 떨리는 낮은 소리예요. 1 kHz(킬로헤르츠)는 1초에 천 번 떨려요. 사람은 대략 20 Hz 부터 20 kHz 까지 들어요(<b>가청 범위</b>). 콘솔 EQ(소리 높이별 크기 조절)에 적힌 Hz 도 이 떨림 횟수예요. 그래서 「100 Hz 를 줄인다」는 낮은 웅웅 소리를 줄인다는 뜻이에요. 1초에 천 번 떨리면 한 번에 1 ms(1000분의 1초)가 걸려요(<b>주기</b>). 기억해요: Hz 가 클수록 높은 소리예요.',
        more: '<ul><li><b>주기 계산</b>: 주기 T = 1 ÷ 주파수 f 예요. 100 Hz 는 1 ÷ 100 = 0.01초 = 10 ms 예요. 1 kHz 는 1 ÷ 1000 = 0.001초 = 1 ms 예요.</li> <li><b>목소리 (Wikipedia Voice frequency)</b>: 남성 목소리의 기본음은 약 85–180 Hz, 여성은 약 165–255 Hz 예요.</li> <li><b>피아노</b>: 가장 낮은 음이 27.5 Hz, 가장 높은 음이 약 4186 Hz 예요.</li> <li><b>배음</b>: 목소리와 악기에는 기본음 위에 배음도 함께 나요. 그래서 실제 소리는 이보다 훨씬 높은 주파수까지 퍼져 있어요.</li> <li><b>저역 · 중역 · 고역</b>: 낮은 소리 · 가운데 소리 · 높은 소리를 말해요. 이 과정에서는 20–250 Hz 를 저역, 250 Hz – 4 kHz 를 중역으로 나눴어요. 4–20 kHz 는 고역이에요. 정해진 규칙이 아니라 공부하기 쉽게 나눈 거예요(교육용 구분). 책과 장비마다 경계가 조금씩 달라요.</li> <li><b>옥타브</b>: 주파수가 2배가 되면 한 옥타브 높은 음이에요. A4(라)는 440 Hz, 한 옥타브 위 A5 는 880 Hz 예요. 가운데 도(C4)는 약 261.6 Hz 예요(피아노 건반 주파수 표).</li> <li><b>귀가 가장 예민한 곳</b>: 사람 귀는 2–5 kHz 쯤을 가장 잘 들어요. Wikipedia · HyperPhysics 자료예요. 그래서 이 근처의 하울링은 귀에 더 아프게 들리는 경우가 많아요.</li> <li><b>들리지 않는 소리</b>: 20 Hz 아래를 초저주파, 20 kHz 위를 초음파라고 해요.</li> <li><b>나이와 고음</b>: 들리는 범위는 살면서 줄어들어요. 보통 어릴 때부터 가장 높은 쪽 끝이 조금씩 내려가요(Wikipedia Hearing range). 그래서 고음 EQ 는 한 사람 귀만 믿지 말고 여러 사람이 함께 들어 봐요.</li></ul>',
        check: { q: '1 kHz 소리는 한 번 떨리는 데 얼마나 걸릴까요?', options: [
          { t: '1 ms (1000분의 1초)', ok: true, why: '맞아요. 1초에 천 번 떨리니, 한 번에 1000분의 1초가 걸리기 때문이에요.' },
          { t: '1 초', why: '아니에요. 1초에 한 번 떨리면 1 Hz 예요.' },
          { t: '10 ms', why: '아니에요. 10 ms 는 100 Hz 가 한 번 떨리는 시간이에요.' }] } },
      { title: '파장 — 낮은 소리는 길고, 높은 소리는 짧아요', visual: 'pwLambda',
        body: '같은 거리를 걸어도, 큰 걸음은 적게, 작은 걸음은 많이 걸어요. 소리는 1초에 약 343 m 를 가요. 이때 한 번 떨리는 동안 가는 길이가 <b>파장</b>이에요. 파장은 소리의 걸음 하나라고 생각하면 쉬워요. 조금 떨리는 낮은 소리는 걸음이 커요. 예를 들어 100 Hz 는 343 ÷ 100 = 약 3.4 m 예요. 많이 떨리는 높은 소리는 걸음이 작아서, 10 kHz 는 약 3.4 cm 예요. 파장이 긴 저음은 기둥을 돌아서 뒤까지 가요(<b>회절</b>). 파장이 짧은 고음은 곧게 가서 기둥 뒤에 그늘이 생겨요. 그래서 기둥 뒷자리는 베이스는 들려도 말소리가 덜 또렷해요. 기억해요: 낮은 소리는 길고 돌아가고, 높은 소리는 짧고 곧게 가요.',
        more: '<ul><li><b>식</b>: 파장 λ(람다) = 소리 빠르기 c ÷ 주파수 f 예요(λ = c ÷ f). c 는 20 °C 에서 약 343 m/s 예요.</li> <li><b>여러 파장</b>: 1 kHz 는 343 ÷ 1000 = 약 34 cm 예요. 가장 낮은 20 Hz 는 약 17 m, 가장 높은 20 kHz 는 약 1.7 cm 예요.</li> <li><b>소리 빠르기와 온도</b>: 공기가 따뜻할수록 소리가 조금 빨라져요. 대략 331.5 + 0.60 × 온도(°C) m/s 예요(The Physics Factbook). 0 °C 에서 약 332 m/s, 20 °C 에서 약 343 m/s, 30 °C 에서 약 349 m/s 예요. 책에 따라 15 °C 의 약 340 m/s 를 쓰기도 해요(무대음향 표준교재). 기준 온도만 다른 거예요.</li> <li><b>1 ms 에 약 34 cm</b>: 소리는 1 ms(1000분의 1초) 동안 약 34 cm 를 가요. 딜레이 스피커 값을 구할 때도 같은 계산을 써요. 「거리 ÷ 343 × 1000 ms」예요.</li> <li><b>회절 (HyperPhysics)</b>: 장애물이나 틈이 파장보다 작을수록 소리가 잘 돌아가요. 파장이 긴 베이스 드럼 소리는 모퉁이를 잘 돌아가요. 파장이 짧은 높은 소리는 한쪽으로 곧게 가는 성질(방향성)이 강해요.</li> <li><b>스피커와 지향성</b>: 지향성은 소리가 어느 쪽으로 퍼지는지를 말해요. 같은 까닭으로 스피커도 저음은 사방으로 퍼져요. 고음일수록 정면 쪽으로 좁게 보내는 경우가 많아요. 그래서 스피커 정면에서 벗어난 자리는 고음이 먼저 줄어요. 실제 퍼지는 각도는 스피커 자료를 확인해요.</li> <li><b>굴절 — 온도가 소리 길을 휘게 해요 (무대음향 표준교재)</b>: 소리는 따뜻한 공기에서 더 빨라요. 그래서 공기 온도가 층마다 다르면 소리 길이 휘어요. 밤에는 땅 가까이가 차갑고 위가 따뜻해서, 소리가 땅 쪽으로 휘어 멀리까지 들려요. 낮에는 반대로 하늘 쪽으로 휘어요. 야외 행사에서 시간에 따라 먼 곳 소리가 달라지는 까닭 중 하나예요.</li> <li><b>그림 속 비교</b>: 「어른 키의 두 배」「30 cm 자」「손가락 한 마디」는 비유예요. 길이를 느끼게 하려는 교육용 근사예요.</li></ul>',
        check: { q: '1 kHz 소리의 파장은 대략 얼마일까요?', options: [
          { t: '약 3.4 m', why: '아니에요. 3.4 m 는 100 Hz 의 파장이에요.' },
          { t: '약 3.4 cm', why: '아니에요. 3.4 cm 는 10 kHz 의 파장이에요.' },
          { t: '약 34 cm', ok: true, why: '맞아요. 343 ÷ 1000 = 0.343 m 라서 약 34 cm 이기 때문이에요.' }] } },
      { title: '소리 크기 dB — 멀어지면 작아져요', visual: 'pwDb',
        body: '그네를 세게 밀수록 더 높이 올라가요. 소리도 세게 떨수록(<b>진폭</b>이 클수록) 크게 들려요. 소리 크기는 <b>dB</b>(데시벨)로 나타내요. dB 는 「몇 배」를 더하기로 바꾼 숫자예요. 공기를 미는 힘(음압)이 2배면 +6 dB 예요. 귀에 「두 배 크게」 들리려면 약 +10 dB 가 필요해요. 소리는 손전등 빛처럼 멀수록 넓게 퍼져요. 그래서 거리가 2배가 될 때마다 약 6 dB 씩 작아져요(<b>역제곱 법칙</b>). 예를 들어 1 m 에서 90 dB 이면, 2 m 에서는 84 dB 예요. 설교자가 마이크에서 멀어지면 소리가 확 줄어드는 것도 이 때문이에요. 기억해요: 음압 2배는 +6 dB, 거리 2배는 −6 dB 예요.',
        pics: [{ v: 'pwSpread', cap: '거리가 2배면 같은 소리가 4칸에 나뉘어 퍼져요. 한 칸에 닿는 세기는 1/4 이 되어 약 <b>6 dB</b> 작아져요.' }],
        more: '<ul><li><b>식</b>: SPL = 20 log(음압 ÷ 20 µPa) 예요. 0 dB SPL(20 µPa)은 1 kHz 소리를 사람이 겨우 듣는 크기예요. 20 log 2 ≈ 6.02 라서 음압 2배는 약 +6 dB 예요. 음압 10배는 +20 dB 예요(Acoustic Glossary).</li> <li><b>로그</b>: 「2배 하고 또 2배」를 「+6 dB 하고 또 +6 dB」처럼 더하기로 바꾸는 셈법이에요.</li> <li><b>파워와 음압</b>: 파워(에너지)가 2배가 되면 +3 dB 예요. 음압(진폭) 2배는 +6 dB 예요.</li> <li><b>왜 6 dB 일까</b>: 거리가 2배면 퍼지는 넓이는 4배(2 × 2)예요. 그래서 한 곳에 닿는 세기는 1/4 이 되고, 음압은 반이 돼요. 음압이 반이면 −6 dB 예요.</li> <li><b>계산 예</b>: 1 m 에서 90 dB 이면 2 m 에서 84 dB, 4 m 에서 78 dB 예요. 반사가 없을 때의 예시예요.</li> <li><b>+10 dB 와 두 배 크기</b>: 두 배로 크게 들리는 변화는 대략 6–10 dB 예요(sengpielaudio). 이 자료는 보통 +10 dB 를 써요. 귀의 느낌이라 딱 떨어지는 값은 아니에요.</li> <li><b>역제곱 법칙이 맞는 조건</b>: 점 같은 음원이어야 해요. 반사면이나 다른 소리가 없는 곳(자유 음장)이어야 해요(SFU Handbook · HyperPhysics). 실제 본당에서는 벽 · 천장에서 튕겨 온 소리(반사음)가 더해져 계산과 달라요. 실내 반사는 03 공간 과정에서 다뤄요.</li> <li><b>마이크와 입 거리</b>: 입에서 마이크까지 5 cm 에서 10 cm 로 멀어지면 약 6 dB 작아져요. 점음원으로 본 교육용 근사예요. 설교 중 고개를 돌리거나 마이크에서 멀어지면 소리가 확 줄어드는 이유예요.</li> <li><b>콘솔의 dB 와 다른 점</b>: 콘솔 미터의 dBFS · dBu 는 전기 신호용이라 기준이 달라요. 그래도 「+6 dB = 2배(전압 · 음압)」「+3 dB = 2배(파워)」 규칙은 똑같이 써요.</li></ul>',
        check: { q: '설교자 앞 2 m 자리가 84 dB 예요. 4 m 자리는 얼마쯤일까요?', visual: 'pwCheckDist', options: [
          { t: '약 42 dB', why: '아니에요. 거리가 2배라고 dB 가 반이 되지는 않아요.' },
          { t: '약 78 dB', ok: true, why: '맞아요. 거리가 2배면 약 6 dB 줄어서 84 − 6 = 78 dB 이기 때문이에요.' },
          { t: '약 81 dB', why: '아니에요. −3 dB 는 파워가 반일 때예요. 거리 2배는 −6 dB 예요.' }] } },
      { title: '위상 — 두 소리가 만나면 커지기도, 지워지기도 해요', visual: 'pwPhase',
        body: '두 사람이 그네를 같은 박자로 밀면 그네가 더 높이 가요. 한 명은 밀고 한 명은 당기면 그네가 거의 멈춰요. 소리 물결의 박자를 <b>위상</b>이라고 해요. 같은 소리가 같은 박자로 만나면 더 커져요(+6 dB). 박자가 반대로 만나면 서로 지워져요(<b>상쇄</b>). 같은 소리가 조금 늦게 겹치면, 어떤 높이는 커지고 어떤 높이는 지워져요. 그래프가 빗살 모양이 되어서 이것을 <b>콤 필터</b>라고 해요. 예를 들어 34 cm 더 멀면 약 1 ms 늦어서 500 Hz 가 지워져요. 강대상 마이크 두 개를 함께 올리면 이런 일이 생겨요. 목소리가 통 속에서 나는 것처럼 이상하게 들려요. 기억해요: 한 사람 소리에는 마이크를 하나만 올려요.',
        pics: [{ v: 'pwSwing', cap: '같은 박자로 밀면 그네가 더 높이 가요(같은 위상, <b>+6 dB</b>). 한 명이 밀 때 다른 한 명이 당기면 거의 멈춰요(반대 위상, <b>상쇄</b>).' }],
        more: '<ul><li><b>위상을 각도로</b>: 떨림 한 바퀴를 360° 로 보고, 지금 어디쯤인지를 각도로 말해요. 시계 바늘이 한 바퀴 중 어디를 가리키는지와 비슷해요. 반 바퀴(180°) 어긋나면 높은 곳과 낮은 곳이 만나 지워져요.</li> <li><b>왜 높이마다 다를까</b>: 두 소리가 지나온 거리가 다르면 늦게 온 소리는 위상이 어긋나요. 어긋나는 정도는 주파수마다 달라요. 그래서 500 Hz 다음에 1.5 kHz · 2.5 kHz … 에서도 또 지워져요.</li> <li><b>Biamp 기술 자료</b>: 같은 소리 두 개가 거의 같은 시간에 더해지면 +6 dB 가 돼요. 조금 늦게 더해지면 콤 필터가 생겨요. 첫 상쇄(처음 지워지는 높이)는 (1 ÷ 지연 시간) ÷ 2 에서 생겨요. 지연 1 ms → 500 Hz, 5 ms → 100 Hz, 10 ms → 50 Hz 예요.</li> <li><b>거리로 계산</b>: 늦는 시간(지연) = 거리 차 ÷ 343 이에요. 그래서 첫 상쇄 주파수 = 343 ÷ (2 × 거리 차) 예요. 예: 거리 차가 0.34 m 면 343 ÷ 0.68 = 약 500 Hz 예요. 거리 차가 클수록 첫 상쇄가 더 낮은 소리로 내려가고, 빗살이 촘촘해져요.</li> <li><b>크기 차이</b>: 두 소리 크기가 비슷할수록 빗살이 깊어요. 크기 차가 클수록 얕아요(Biamp). 그래서 한 사람 소리에는 가까운 마이크 하나만 올리고, 다른 마이크는 내리는 것이 좋아요.</li> <li><b>극성 반전과 시간 지연</b>: 케이블 배선이 뒤집혀 극성(+ · −)이 반대면 모든 주파수가 180° 어긋나요. 그래서 저음부터 크게 줄어요. 시간 지연은 주파수마다 어긋나는 정도가 달라서 빗살이 생겨요. 콘솔의 Ø(위상 반전) 버튼은 극성을 뒤집는 버튼이에요.</li> <li><b>가까운 반사도 콤 필터를 만들어요 (무대음향 표준교재)</b>: 마이크 두 개가 아니어도 생겨요. 강대상 판 · 바닥 · 보면대에서 튕긴 소리가 직접 소리와 함께 마이크에 들어가도 생겨요. 교재는 약 10 ms 안에 오는 반사가 콤 필터로 들린다고 해요. 그래서 마이크를 반사면에 너무 가까이 대지 않아요.</li> <li><b>맥놀이</b>: 주파수가 조금 다른 두 소리가 만나면 소리가 「우왕우왕」 커졌다 작아졌다 해요. 두 주파수의 차이만큼 1초에 그만큼 출렁여요. 예: 440 Hz 와 442 Hz 면 1초에 2번이에요(계산). 기타 두 줄을 맞출 때 이 출렁임이 없어지면 음이 맞은 거예요.</li> <li><b>스피커 여러 대</b>: 같은 모노 신호를 여러 스피커로 틀면 콤 필터가 들릴 수 있어요. 듣는 사람이 움직이면 빗살 위치가 바뀌어서, 소리가 미끄러지듯 변해요(Biamp). 본당 메인 L · R 사이를 걸을 때 소리 느낌이 슉슉 바뀌는 것도 같은 이유예요.</li></ul>',
        check: { q: '두 스피커 한가운데예요. 한쪽 선의 + · − 가 뒤바뀌면 어떻게 될까요?', options: [
          { t: '크게 줄어든다 (특히 저음)', ok: true, why: '맞아요. 박자가 반대가 되어 서로 지워지기 때문이에요. 실제 방에서는 반사 때문에 다 없어지지는 않아요.' },
          { t: '+6 dB 더 커진다', why: '아니에요. +6 dB 는 같은 박자로 만날 때예요.' },
          { t: '아무 변화가 없다', why: '아니에요. + 와 − 가 바뀌면 두 소리가 만날 때 큰 차이가 나요.' }] } },
      { title: '배음 · 음색과 귀 — 작게 들으면 저음이 덜 들려요', visual: 'pwEar',
        body: '같은 「도」를 쳐도 피아노와 기타는 소리가 달라요. 기본음 위에 2배 · 3배 높이의 소리(<b>배음</b>)가 함께 나기 때문이에요. 배음이 섞인 모양이 소리의 색깔(<b>음색</b>)을 만들어요. 소리는 높이 · 크기 · 음색, 세 가지로 구별해요(<b>소리의 3요소</b>). 그런데 우리 귀는 모든 높이를 똑같이 잘 듣지 않아요. 2–5 kHz(말소리가 또렷한 쪽)를 가장 잘 들어요. 높이마다 귀가 느끼는 크기를 그린 선이 <b>등청감 곡선</b>이에요. 소리가 작을수록 저음은 더 안 들려요. 그래서 새벽기도처럼 작게 틀면 베이스가 빠진 듯 들려요. 크게 틀면 반대로 저음이 많아진 듯 들려요. 기억해요: 믹스는 예배 때의 실제 음량으로 확인해요.',
        pics: [{ v: 'pwThree', cap: '<b>소리의 3요소</b> — 높이는 떨림 횟수(주파수), 크기는 떨림 세기(진폭)가 정해요. 음색은 물결 모양(배음)이 정해요.' }, { v: 'pwMask', cap: '<b>가리기(마스킹)</b> — 큰 소리가 높이가 가까운 작은 소리를 가려서 안 들리게 해요. 큰 저음은 위쪽 소리를 더 넓게 가려요.' }],
        more: '<ul><li><b>배음 (CUNY 교재)</b>: 같은 음을 내는 두 악기는 음색이 달라요. 같은 기본음 위에 배음(기본음의 정수배)이 서로 다르게 섞여 있기 때문이에요.</li> <li><b>ISO 226</b>: 등청감 곡선은 국제 표준 ISO 226 에 나와 있어요. 「같은 크기로 들리려면 얼마나 세야 하는지」를 높이마다 이은 선이에요.</li> <li><b>phon(폰) (HyperPhysics)</b>: 「들리는 크기」를 나타내는 단위예요. 1 kHz 에서 dB SPL 과 같은 값이 되게 정했어요. 40 phon 곡선은 1 kHz 40 dB 와 같은 크기로 들리는 점들을 이은 선이에요.</li> <li><b>작은 소리와 큰 소리 비교</b>: ISO 226 식으로 계산해 봤어요. 작은 소리(20 phon)에서는 100 Hz 가 1 kHz 보다 약 28 dB 더 세야 같게 들려요. 큰 소리(80 phon)에서는 약 12 dB 만 더 세면 돼요.</li> <li><b>계산값</b>: ISO 226:2003 표와 식으로 계산하고 반올림했어요. 100 Hz 는 20 phon 에 약 48 dB 가 필요해요. 80 phon 에는 약 92 dB 가 필요해요. 1 kHz 는 각각 20 dB · 80 dB 예요. 50 Hz 는 차이가 더 커서 20 phon 에 약 64 dB 예요.</li> <li><b>ISO 226:2023</b>: 지금 최신판은 2023년판이에요. 2003년판의 작은 계산 오차를 고친 것이라 곡선 모양은 거의 같아요(FA2023 논문). 이 곡선은 순음(삐- 하는 사인파) 기준이에요.</li> <li><b>엔벨로프(소리의 시작과 끝 모양)</b>: 음색은 배음만으로 정해지지 않아요. 소리가 얼마나 빨리 커지는지(어택), 조금 줄어드는지(디케이)도 음색을 바꿔요. 얼마나 이어지는지(서스테인), 어떻게 사라지는지(릴리스)도 그래요. 이 네 단계를 줄여 ADSR 이라고 해요(무대음향 표준교재). 컴프레서 · 게이트의 어택 · 릴리스와 이어지는 말이에요.</li> <li><b>마스킹 (무대음향 표준교재)</b>: 큰 소리가 다른 소리를 가려 잘 안 들리게 하는 일이에요. 저음은 고음을 잘 가리지만, 고음은 저음을 잘 못 가려요. 높이가 가까울수록, 가리는 소리가 클수록 더 잘 가려요. 그래서 베이스 · 킥이 너무 크면 목소리와 건반이 묻혀요.</li> <li><b>소음계의 dB(A) · dB(C)</b>: 소음계는 귀의 감도를 흉내 내는 필터(가중치)를 써요. <b>A</b> 는 40 phon 곡선을 본떠 저음을 많이 깎아요. 작은 소리(약 55 dB 이하)를 잴 때 써요. <b>C</b> 는 거의 평평해서 큰 소리(약 85 dB 이상)를 잴 때 써요(무대음향 표준교재). 같은 찬양도 저음이 많으면 dB(C) 가 dB(A) 보다 크게 나와요.</li> <li><b>역사</b>: 처음 측정은 1933년 Fletcher · Munson 이 발표했어요. 그래서 지금도 「플레처-먼슨 곡선」이라고 부르기도 해요.</li> <li><b>믹스할 때</b>: 헤드폰이나 방송실에서 작게 들으며 저음을 맞출 때가 있어요. 그러면 본당에서 크게 틀 때 저음이 너무 많을 수 있어요. 방송실 모니터 음량을 일정하게 정해 두면 판단이 흔들리지 않아요.</li></ul>',
        check: { q: '새벽기도 때 반주를 작게 틀었더니 베이스가 안 들려요. 왜일까요?', options: [
          { t: '작게 들으면 귀가 저음을 덜 느껴서', ok: true, why: '맞아요. 소리가 작을수록 저음은 더 세야 같은 크기로 들리기 때문이에요(등청감 곡선).' },
          { t: '저음은 파장이 짧아 금방 사라져서', why: '아니에요. 저음은 파장이 길어요. 이것은 귀의 성질 때문이에요.' },
          { t: '작게 틀면 스피커가 저음을 못 내서', why: '아니에요. 스피커보다 사람 귀가 작은 소리에서 저음을 덜 느끼는 것이 큰 이유예요.' }] } }
    ],
    practice: {
      kind: 'waveLab',
      lead: '소리를 직접 바꿔 보는 실험대예요. 왼쪽 슬라이더를 끌어 주파수와 진폭(떨림 세기)을 바꿔요. 오른쪽 그림의 주황 점(듣는 사람)은 끌어서 옮겨요. 「음원 2 (메인 R) 켜기」를 누르면 두 소리가 만나는 모습이 보여요. 과제는 손을 뗄 때 확인해요.',
      note: '파장 · 주기 · dB · 두 소리 합은 물리 식대로 계산했어요. 소리 빠르기는 343 m/s(20 °C)로 계산해요. 1 m 에서 90 dB SPL 이라는 기준은 공부용 예시예요. 스피커 간격 3 m 와 본당 모양도 예시예요. 낮은 · 가운데 · 높은 소리의 경계도 예시예요. 벽에 튕기는 소리(반사)는 없다고 보고 계산해요. 실제 본당에서는 반사 때문에 값이 달라져요.',
      tasks: [
        { id: 'lambda', title: '파장 1 m 만들기', text: '주파수 슬라이더를 끌어요. ±1% 버튼으로 다듬어요. 파장 λ 가 약 1 m(0.97–1.03 m)가 되면 성공이에요. 몇 Hz 일까요?' },
        { id: 'audible', title: '귀에 안 들리는 소리 만들기', text: '주파수를 20 Hz 아래나 20 kHz 위로 끌어요. 범위 밖으로 가면 성공이에요. 그때 파장이 얼마나 길거나 짧은지 봐요.' },
        { id: 'amp', title: '진폭 2배는 몇 dB?', text: '진폭 슬라이더를 ×2.0 까지 끌어 올려요. 옆 글자에 약 +6 dB 가 나오면 성공이에요.' },
        { id: 'dist', title: '거리 2배는 몇 dB?', text: '음원 2 는 끈 채로 해요. 주황 점을 음원 1 에서 4 m(3.9–4.1 m) 자리로 끌어요. 「2 m 자리와 비교」가 약 −6 dB 면 성공이에요.' },
        { id: 'inphase', title: '같은 박자로 +6 dB', text: '「음원 2 (메인 R) 켜기」를 눌러요. 주황 점을 가운데 선 위로 옮겨요. 위상 0° 에서 「두 소리 합」이 +5.5 dB 이상이면 성공이에요.' },
        { id: 'cancel', title: '반대 박자로 지우기', text: '음원 2 위상 슬라이더를 180° 근처로 끌어요. 「두 소리 합」이 −15 dB 이하가 되면 성공이에요. 아래 그래프도 함께 봐요.' }
      ],
      links: [
        { title: 'Ear Training', text: '낮은 소리 · 가운데 소리 · 높은 소리를 귀로 들으며 익혀요.', go: { tab: 'tab3' } }
      ]
    },
    quiz: [
      { q: '10 kHz 소리의 파장은 대략 얼마일까요?', options: [
        { t: '약 3.4 cm', ok: true, why: '맞아요. 343 ÷ 10000 = 0.0343 m 라서 약 3.4 cm 이기 때문이에요.' },
        { t: '약 34 cm', why: '아니에요. 34 cm 는 1 kHz 의 파장이에요.' },
        { t: '약 3.4 m', why: '아니에요. 3.4 m 는 100 Hz 의 파장이에요.' }] },
      { q: '기둥 뒷자리에서 베이스는 들리는데 말소리가 흐려요. 왜일까요?', options: [
        { t: '고음은 파장이 길어 막혀서', why: '아니에요. 고음은 파장이 짧아요.' },
        { t: '저음은 돌아오고, 고음은 막혀서', ok: true, why: '맞아요. 긴 저음은 기둥을 돌아오기 때문이에요(회절). 짧은 고음은 기둥 뒤에 그늘이 져요.' },
        { t: '기둥이 저음만 키워서', why: '아니에요. 기둥이 저음을 키우는 게 아니라, 저음이 기둥을 잘 돌아오는 거예요.' }] },
      { q: '진폭(공기를 미는 힘)을 2배로 키웠어요. 몇 dB 늘까요?', options: [
        { t: '+2 dB', why: '아니에요. dB 는 「몇 배」를 더하기로 바꾼 숫자라, 2배는 +2 dB 가 아니에요.' },
        { t: '+6 dB', ok: true, why: '맞아요. 음압 2배는 +6 dB 이기 때문이에요. 파워 2배는 +3 dB 예요.' },
        { t: '+20 dB', why: '아니에요. +20 dB 는 음압이 10배일 때예요.' }] },
      { q: '마이크 둘을 함께 올렸더니 목소리가 통 속 소리 같아요. 어떻게 할까요?', visual: 'pwMicPair', options: [
        { t: '두 마이크 소리를 더 키운다', why: '아니에요. 두 소리가 겹치는 것은 그대로라 콤 필터도 그대로예요.' },
        { t: '고음 EQ 를 크게 올린다', why: '아니에요. 콤 필터는 여러 높이에 빗살처럼 생겨서 EQ 로 고치기 어려워요.' },
        { t: '가까운 마이크 하나만 쓴다', ok: true, why: '맞아요. 같은 소리가 늦게 겹쳐 생긴 콤 필터라서, 하나만 열면 사라지기 때문이에요.' }] },
      { q: '「작은 소리일수록 저음이 덜 들려요」를 그린 선은?', options: [
        { t: '역제곱 법칙', why: '아니에요. 역제곱 법칙은 멀어질수록 소리가 작아지는 규칙이에요.' },
        { t: '등청감 곡선', ok: true, why: '맞아요. 작은 소리일수록 저음 쪽 선이 크게 올라가기 때문이에요.' },
        { t: '콤 필터', why: '아니에요. 콤 필터는 같은 소리가 늦게 겹쳐 생기는 일이에요.' }] }
    ],
    missions: [
      { title: 'Ear Training · 낮은 · 가운데 · 높은 소리 듣기', text: '낮은 소리 · 가운데 소리 · 높은 소리를 귀로 구분해 봐요. 이 과정에서 본 주파수와 파장을 떠올리며 들어요.', go: { tab: 'tab3' } },
      { title: '3층 음향 시스템 · 강대상 마이크 따라가기', text: '강대상 마이크 소리가 지나가는 길을 3D 로 봐요. 마이크 두 개를 함께 올리면 왜 콤 필터가 생기는지 생각해 봐요.', go: { tab: 'tab2', trace: 'mic_podium_L' } }
    ],
    deeper: [
      { title: '두 소리를 더하면 몇 dB 커질까?', text: '같은 크기의 소리 두 개를 더해도 늘어나는 양이 달라요. <b>같은 소리가 같은 박자</b>로 만나면 +6 dB 예요. <b>서로 다른 소리</b>는 약 +3 dB 예요. 두 사람이 따로 부르는 노래가 그 예예요.', more: '<ul><li>파워(에너지) 2배는 +3 dB, 음압 2배는 +6 dB 예요(sengpielaudio).</li> <li>같은 신호라도 거리 차가 있으면 높이마다 +6 dB 와 상쇄 사이를 오가요. 그래서 콤 필터가 생겨요(Biamp).</li> <li>그래서 「스피커를 한 대 더 켜면 +3 dB」 같은 말은 맞을 때도, 틀릴 때도 있어요. 자리 · 주파수마다 달라요.</li></ul>' },
      { title: '따뜻하면 소리가 조금 빨라져요', text: '공기가 따뜻하면 소리가 조금 더 빨리 가요. 20 °C 에서는 1초에 약 343 m 예요. 그래서 겨울 아침 본당과 여름 찬양 시간은 소리 빠르기가 조금 달라요.', more: '<ul><li><b>식</b>: 대략 331.5 + 0.60 × 온도(°C) m/s 예요. 20 °C 면 331.5 + 12 = 343.5, 약 343 m/s 예요.</li> <li>0 °C 약 332 m/s, 20 °C 약 343 m/s, 30 °C 약 349 m/s 예요. The Physics Factbook 식으로 계산했어요.</li> <li>10 m 를 가는 시간: 0 °C 약 30.2 ms, 30 °C 약 28.6 ms 예요. 그래서 딜레이 스피커 값이 1–2 ms 정도 달라질 수 있어요.</li> <li>파장도 같이 바뀌어요. 같은 1 kHz 라도 0 °C 에서 약 33 cm, 30 °C 에서 약 35 cm 예요.</li></ul>' },
      { title: '방 안에서는 「거리 2배 −6 dB」가 다 맞지 않아요', text: '「거리 2배면 −6 dB」는 벽에 튕기는 소리가 없을 때의 규칙이에요. 본당에는 벽 · 천장 · 바닥이 있어요. 그래서 튕겨 온 소리(반사음)가 더해져, 먼 자리는 덜 줄어들어요.', more: '<ul><li>이 규칙은 <b>점음원 · 자유 음장</b>(반사가 없는 곳)에서 맞아요. SFU Handbook 은 이 계산이 점음원과 자유 음장에서만 맞는다고 밝혀요. HyperPhysics 도 반사나 잔향이 없을 때 역제곱 법칙을 따른다고 해요.</li> <li>스피커 가까이에서는 직접음이 커요. 멀어질수록 반사음의 몫이 커져요. 그래서 먼 자리에서는 계산보다 덜 줄어드는 경우가 많아요(교육용 설명).</li> <li>방의 반사 · 잔향(울림) · 흡음은 물리음향 03 「공간(룸 어쿠스틱)」에서 자세히 다뤄요.</li></ul>' }
    ],
    sources: [
      { t: 'Speed of Sound in Air — The Physics Factbook (20 °C 약 343 m/s · 331.5 + 0.60 T)', url: 'https://hypertextbook.com/facts/2000/CheukWong.shtml' },
      { t: 'The Nature of a Sound Wave — The Physics Classroom (종파 · 압축과 희박)', url: 'https://www.physicsclassroom.com/Class/sound/U11L1c.html' },
      { t: 'Hearing range — Wikipedia (20 Hz – 20 kHz · 나이가 들면 고음 한계가 내려감 · 2–5 kHz 가장 예민)', url: 'https://en.wikipedia.org/wiki/Hearing_range' },
      { t: 'Voice frequency — Wikipedia (기본음 남성 85–180 Hz · 여성 165–255 Hz)', url: 'https://en.wikipedia.org/wiki/Voice_frequency' },
      { t: 'Piano key frequencies — Wikipedia (A0 27.5 Hz · C4 261.6 Hz · A4 440 Hz · C8 4186 Hz)', url: 'https://en.wikipedia.org/wiki/Piano_key_frequencies' },
      { t: 'Diffraction of Sound — HyperPhysics (파장보다 작은 장애물 · 저음은 모퉁이를 돌고 고음은 방향성이 강함)', url: 'https://hyperphysics.gsu.edu/hbase/Sound/diffrac.html' },
      { t: 'Sound Pressure — Acoustic Glossary (기준 음압 20 µPa · SPL = 20 log(p / p0) · 음압 2배 약 6 dB)', url: 'https://acoustic-glossary.co.uk/sound-pressure.htm' },
      { t: 'Level change calculator — sengpielaudio (음압 2배 +6 dB · 에너지 2배 +3 dB · 두 배 크기 대략 6–10 dB)', url: 'https://sengpielaudio.com/calculator-levelchange.htm' },
      { t: 'Inverse-Square Law — SFU Handbook for Acoustic Ecology (거리 2배 −6 dB · 점음원 · 자유 음장)', url: 'https://www.sfu.ca/sonic-studio-webdav/cmns/Handbook/Inverse-Square_Law.html' },
      { t: 'Inverse Square Law, Sound — HyperPhysics (점음원 · 반사와 잔향이 없을 때)', url: 'https://hyperphysics.gsu.edu/hbase/Acoustic/invsqs.html' },
      { t: 'Comb filters — Biamp (같은 시간 +6 dB · 첫 상쇄 (1 / 지연) / 2 · 1 ms → 500 Hz · 여러 스피커)', url: 'https://support.biamp.com/General/Audio/Comb_filters' },
      { t: 'Equal Loudness Curves — HyperPhysics (1 kHz 기준 phon · 작은 소리에서 저음 감도 낮음 · 2–5 kHz)', url: 'https://hyperphysics.gsu.edu/hbase/Sound/eqloud.html' },
      { t: 'ISO 226:2003 등청감 곡선 계산 코드 — University of Miami 강의 자료 (af · Lu · Tf 표와 식)', url: 'https://rabbit.eng.miami.edu/students/mfreeman/AcousticsEEN502/Project3/iso226.html' },
      { t: 'Loudness methods vs ISO 226:2023 — Forum Acusticum 2023 논문 (2023년판은 2003년판의 작은 수정 · 순음 기준)', url: 'https://dael.euracoustics.org/confs/fa2023/data/articles/000585.pdf' },
      { t: 'Timbre — Sensation and Perception, CUNY (같은 음 다른 음색 · 배음은 기본음의 정수배)', url: 'https://pressbooks.cuny.edu/sensationandperception/chapter/timbre/' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 1장 기초 음향 · 음향 기초(소리의 3요소 · 음속 15 °C 340 m/s · 엔벨로프) p.3–16', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 1장 기초 음향 · 음파 특성(굴절 · 위상 간섭 · 맥놀이 · 역제곱 법칙 · 콤필터 10 ms) p.17–24', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 1장 기초 음향 · 심리 음향(등청감곡선 · 가중치 A/C · 마스킹) p.25–29', url: '' }
    ]
  };
})();
