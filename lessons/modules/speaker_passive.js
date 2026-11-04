/* =============================================================================
   05-1 패시브 스피커 — 2026-11-04
   - STA_MODULES['speaker-passive'] (모듈 데이터) + STAVisuals.ps* (그림 6개) + STASims.passiveRig (실습)
   - 05-2 액티브 스피커(speaker.js · EV ZXA1)와 나눔: 이 과정은 「앰프에서 힘을 받는 스피커」를 깊게 다룸
     (패시브 크로스오버 · 앰프 스피커 설정 · 임피던스와 병렬/직렬 · 파워 정격과 앰프 매칭 · 케이블 굵기/손실/댐핑 · speakON 핀 · 극성 · 바이앰프 · 보호)
   - 장비 숫자(제조사 자료 — sources 참고):
       d&b Vi10P  — 3웨이 패시브, 2 × 10" + 8" + 1.4" 컴프레션 드라이버, 패시브 크로스오버, 8 Ω, 500/2000 W(RMS/피크 10 ms), 110° × 40°,
                    59 Hz–18 kHz(−5 dB), CUT 100 Hz–18 kHz, 채널당 2대, 설치용 앰프 40D, 핀 1+/1−(2± 는 액티브 서브우퍼용), 두 NL4 의 네 핀은 병렬
       d&b Y7P    — 2웨이 패시브, 2 × 8" + 1.4", 8 Ω, 400/1600 W, 75° × 40°, NLT4 F/M, 핀 1+/1−, 앰프 40D · 25D · 10D 등
       d&b Y10P   — 2웨이 패시브, 2 × 8" + 1.4", 8 Ω, 400/1600 W, 110° × 40°
       d&b E8     — 패시브, 150/800 W, 90° × 50°(회전), 현재 제품 페이지 12 Ω(예전 설명서 16 Ω), 앰프 10D · 40D 등
       d&b 40D    — 4 × 2000 W/8 Ω · 4 × 2400 W/4 Ω(EIA-426B, CF 12 dB), 출력 Euroblock, Dual Channel · Mix TOP/SUB · 2-Way Active, LoadMatch(최대 70 m), 부하 모니터링
       d&b 10D    — 4 × 350 W/8 Ω · 4 × 700 W/4 Ω, V-Series 는 지원하지 않음(→ Vi10P 는 40D)
       EV ZX1     — 패시브 8 Ω, 200 W 연속 / 400 W 프로그램 / 800 W 피크 · Crown XLi1500 — 330 W/8 Ω, 450 W/4 Ω, 브리지 900 W/8 Ω
       구리선 저항 — 10 AWG 3.277 · 12 AWG 5.211 · 14 AWG 8.286 · 16 AWG 13.17 · 18 AWG 20.95 mΩ/m
   - 실습의 손실·댐핑 팩터는 공칭 임피던스로 계산(앰프 출력 임피던스·온도는 뺌) — 교육용 근사. 「앰프 매칭 기준」도 교육용 기준.
   ============================================================================= */
(function () {
  'use strict';
  var V = window.STAVisuals = window.STAVisuals || {};
  var C = { ink: '#0f2747', sub: '#5b6b80', line: '#cbd5e1', teal: '#0e7490', blue: '#2563eb', red: '#dc2626', amber: '#d97706', green: '#16a34a', bg: '#f8fafc', violet: '#7c3aed', dark: '#1f2937' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 500) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '">' + s + '</text>'; }
  function box(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 8 : r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.6"' : '') + '/>'; }
  function arrow(x1, y1, x2, y2, col, w) { col = col || C.ink; var a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 8 * Math.cos(a), hy = y2 - 8 * Math.sin(a);
    return '<path d="M' + x1 + ' ' + y1 + 'L' + hx.toFixed(1) + ' ' + hy.toFixed(1) + '" stroke="' + col + '" stroke-width="' + (w || 2.4) + '" fill="none"/><path d="M' + x2 + ' ' + y2 + 'L' + (hx + 4.5 * Math.sin(a)).toFixed(1) + ' ' + (hy - 4.5 * Math.cos(a)).toFixed(1) + 'L' + (hx - 4.5 * Math.sin(a)).toFixed(1) + ' ' + (hy + 4.5 * Math.cos(a)).toFixed(1) + 'Z" fill="' + col + '"/>'; }
  function blk(x, y, w, h, title, sub, col, fill) { return box(x, y, w, h, fill || '#fff', col || C.ink, 6) + t(x + w / 2, y + (sub ? h / 2 - 2 : h / 2 + 4), title, { size: 11, weight: 800, fill: col || C.ink }) + (sub ? t(x + w / 2, y + h / 2 + 12, sub, { size: 9, fill: C.sub }) : ''); }

  /* 구리선 저항(mΩ/m) — 제조사 표 */
  var GAUGES = [{ g: 18, mm: 0.82, r: 0.02095 }, { g: 16, mm: 1.31, r: 0.01317 }, { g: 14, mm: 2.08, r: 0.008286 }, { g: 12, mm: 3.31, r: 0.005211 }, { g: 10, mm: 5.26, r: 0.003277 }];
  var GCOL = { 18: '#94a3b8', 16: '#dc2626', 14: '#d97706', 12: '#2563eb', 10: '#16a34a' };
  function gauge(g) { for (var i = 0; i < GAUGES.length; i++) if (GAUGES[i].g === g) return GAUGES[i]; return GAUGES[1]; }
  function cableCalc(g, len, R) { var rc = 2 * len * gauge(g).r; return { rc: rc, loss: 20 * Math.log10(R / (R + rc)), df: rc > 0 ? R / rc : Infinity }; }

  /* ---------------------------------------------------------------- 그림 1: 패시브 시스템의 구조 (hero 로도 씀) */
  V.psSystem = function () {
    var s = '';
    // 줄 1 — 일반 패시브
    s += t(8, 18, '1. 일반 패시브 시스템 (예: 확성 실습 3 — XLi1500 + ZX1)', { size: 11, weight: 800, anchor: 'start', fill: C.sub });
    s += blk(8, 40, 72, 40, '콘솔', '라인 신호', C.ink) + arrow(80, 60, 108, 60, C.blue);
    s += blk(110, 34, 112, 52, '파워앰프', '힘을 키움', C.red, '#fef2f2');
    s += arrow(222, 60, 314, 60, C.red, 3.2) + t(268, 52, '스피커 레벨', { size: 9.5, fill: C.red, weight: 700 }) + t(268, 76, 'speakON', { size: 9, fill: C.sub });
    s += box(316, 28, 276, 64, C.bg, C.ink, 10) + t(592, 20, '패시브 스피커 (통)', { size: 9.5, fill: C.sub, anchor: 'end', weight: 700 });
    s += blk(326, 42, 112, 40, '패시브 크로스오버', '코일 · 콘덴서', C.violet, '#f5f3ff');
    s += arrow(438, 54, 466, 50, C.violet, 1.8) + arrow(438, 70, 466, 76, C.violet, 1.8);
    s += blk(468, 38, 116, 22, '우퍼 (저음)', '', C.teal) + blk(468, 64, 116, 22, '고음 드라이버', '', C.amber);
    // 줄 2 — d&b 3층
    s += t(8, 124, '2. 3층 d&b 시스템 — 앰프의 「스피커 설정」 + 통 안의 크로스오버가 한 세트', { size: 11, weight: 800, anchor: 'start', fill: C.teal });
    s += blk(8, 150, 72, 40, '콘솔', '라인 신호', C.ink) + arrow(80, 170, 108, 170, C.blue);
    s += box(110, 136, 112, 68, '#ecfeff', C.teal, 6) + t(166, 154, 'd&b 40D', { size: 11.5, weight: 800, fill: C.teal }) + t(166, 170, '설정: Vi10P', { size: 9.5, fill: C.ink, weight: 700 }) + t(166, 184, 'EQ · CUT/HFA', { size: 9, fill: C.sub }) + t(166, 197, '보호 · 딜레이', { size: 9, fill: C.sub });
    s += arrow(222, 170, 314, 170, C.red, 3.2) + t(268, 162, '스피커 레벨', { size: 9.5, fill: C.red, weight: 700 }) + t(268, 186, '스피커 케이블', { size: 9, fill: C.sub });
    s += box(316, 132, 276, 78, C.bg, C.teal, 10) + t(592, 124, 'Vi10P (3웨이 패시브)', { size: 9.5, fill: C.teal, anchor: 'end', weight: 700 });
    s += blk(326, 152, 112, 44, '패시브 크로스오버', '통 안 부품', C.violet, '#f5f3ff');
    s += arrow(438, 162, 466, 156, C.violet, 1.6) + arrow(438, 174, 466, 174, C.violet, 1.6) + arrow(438, 186, 466, 192, C.violet, 1.6);
    s += blk(468, 148, 116, 16, '저음 2 × 10"', '', C.teal) + blk(468, 167, 116, 16, '중음 8"', '', C.violet) + blk(468, 186, 116, 16, '고음 1.4"', '', C.amber);
    s += t(300, 232, '패시브 = 힘(앰프)은 바깥에, 소리 나누기(크로스오버)는 통 안에 · 구성은 제조사 자료, 그림은 단순화', { size: 10, fill: C.sub });
    return svg(600, 240, s, '패시브 스피커 시스템의 구조 — 일반 패시브와 3층 d&b 시스템');
  };

  /* ---------------------------------------------------------------- 그림 2: 병렬 · 직렬 */
  V.psLoad = function () {
    var s = '';
    function amp(x, y) { return box(x, y, 54, 70, C.dark, null, 6) + t(x + 27, y + 16, '앰프 CH', { size: 9.5, fill: '#e5e7eb', weight: 700 }) + t(x + 46, y + 33, '+', { size: 13, fill: '#fca5a5', weight: 800 }) + t(x + 46, y + 59, '−', { size: 13, fill: '#e5e7eb', weight: 800 }); }
    function spk(x, y, w, lab) { return box(x, y, w, 30, '#fff', C.ink, 5) + '<circle cx="' + (x + 15) + '" cy="' + (y + 15) + '" r="9" fill="none" stroke="' + C.ink + '" stroke-width="1.6"/>' + t(x + w / 2 + 8, y + 20, lab, { size: 11, weight: 800 }); }
    // 병렬
    s += box(6, 6, 290, 222, '#f0fdfa', '#99f6e4', 10) + t(151, 26, '병렬(나란히) — 링크 케이블로 이었을 때', { size: 12, weight: 800, fill: C.teal });
    s += amp(16, 70);
    s += '<path d="M70 98H112V62H150M112 98V136H150" stroke="' + C.red + '" stroke-width="2.4" fill="none"/>';
    s += '<path d="M70 126H96V186H282V62H262M282 136H262" stroke="' + C.ink + '" stroke-width="2.4" fill="none"/>';
    s += spk(150, 47, 112, '8 Ω') + spk(150, 121, 112, '8 Ω');
    s += t(151, 210, '8 ÷ 2 = 4 Ω  (부하가 낮아져요)', { size: 13, weight: 800, fill: C.teal });
    s += t(206, 106, '두 단자는 안에서 병렬', { size: 9, fill: C.sub });
    // 직렬
    s += box(304, 6, 290, 222, '#fff7ed', '#fdba74', 10) + t(449, 26, '직렬(줄줄이) — 따로 만든 배선일 때', { size: 12, weight: 800, fill: C.amber });
    s += amp(314, 70);
    s += '<path d="M368 98H380V62H392" stroke="' + C.red + '" stroke-width="2.4" fill="none"/>';
    s += spk(392, 47, 84, '8 Ω') + '<path d="M476 62H492" stroke="' + C.amber + '" stroke-width="2.4"/>' + spk(492, 47, 84, '8 Ω');
    s += '<path d="M576 62H586V150H380V126H368" stroke="' + C.ink + '" stroke-width="2.4" fill="none"/>';
    s += t(484, 40, '앞 스피커 − → 뒤 스피커 +', { size: 9, fill: C.amber });
    s += t(449, 176, '한 대가 끊기면 둘 다 꺼져요', { size: 10, fill: C.sub }) + t(449, 192, '같은 전압이면 4 Ω 의 ¼ 전력', { size: 10, fill: C.sub });
    s += t(449, 214, '8 + 8 = 16 Ω  (부하가 높아져요)', { size: 13, weight: 800, fill: C.amber });
    return svg(600, 234, s, '스피커 두 대를 병렬과 직렬로 연결했을 때의 부하');
  };

  /* ---------------------------------------------------------------- 그림 3: 파워 정격과 앰프 매칭 */
  V.psPower = function () {
    var s = '', x0 = 150, x1 = 584, xw = function (w) { return x0 + w / 1000 * (x1 - x0); };
    s += t(8, 16, 'EV ZX1 (8 Ω) 정격 — 제조사 자료 · 앰프는 「같은 8 Ω 에서」 비교', { size: 11, weight: 800, anchor: 'start', fill: C.sub });
    s += '<rect x="' + xw(200) + '" y="28" width="' + (xw(400) - xw(200)) + '" height="176" fill="' + C.green + '" fill-opacity=".09"/>';
    [0, 200, 400, 600, 800, 1000].forEach(function (w) { s += '<path d="M' + xw(w) + ' 28V204" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(xw(w), 218, w + ' W', { size: 9.5, fill: C.sub }); });
    [['연속 (AES · RMS)', 200, C.teal, '200 W — 오래 견디는 힘 (기준)'], ['프로그램', 400, C.blue, '400 W = 연속 × 2 (+3 dB)'], ['피크', 800, C.violet, '800 W = 연속 × 4 (+6 dB) · 아주 짧게']].forEach(function (r, i) {
      var y = 36 + i * 30, inside = i === 2; s += t(x0 - 8, y + 15, r[0], { size: 10.5, weight: 700, anchor: 'end' }) + box(x0, y, xw(r[1]) - x0, 20, r[2], null, 4) + t(inside ? xw(r[1]) - 8 : xw(r[1]) + 6, y + 14, r[3], { size: 9.5, fill: inside ? '#fff' : r[2], anchor: inside ? 'end' : 'start', weight: 700 });
    });
    s += t(x0 - 8, 146, '앰프 (8 Ω)', { size: 10.5, weight: 700, anchor: 'end' });
    [[100, '100 W 예시', C.red, '✗ 작아서 자주 클리핑'], [330, 'XLi1500 330 W', C.green, '✓ 연속 ~ 2배 사이'], [900, '브리지 900 W', C.amber, '⚠ 너무 큼']].forEach(function (a, i) {
      var x = xw(a[0]); s += '<path d="M' + x + ' 128V198" stroke="' + a[2] + '" stroke-width="3"/>' + t(x + (i === 2 ? -6 : 6), 152 + (i === 1 ? 20 : 0), a[1], { size: 10, weight: 800, fill: a[2], anchor: i === 2 ? 'end' : 'start' }) + t(x + (i === 2 ? -6 : 6), 166 + (i === 1 ? 20 : 0), a[3], { size: 9.5, fill: a[2], anchor: i === 2 ? 'end' : 'start' });
    });
    s += t(300, 236, '초록 칸 = 이 과정의 교육용 기준(연속 정격 ~ 프로그램 정격) · 정격은 회사마다 재는 방법이 달라요', { size: 10, fill: C.sub });
    return svg(600, 244, s, '스피커 파워 정격(연속·프로그램·피크)과 앰프 크기 비교');
  };

  /* ---------------------------------------------------------------- 그림 4: 케이블 손실 */
  V.psCable = function () {
    var s = '', x0 = 54, x1 = 410, y0 = 26, y1 = 190, L = 60, xl = function (m) { return x0 + m / L * (x1 - x0); }, yd = function (d) { return y0 + (-d) / 2 * (y1 - y0); };
    [0, 10, 20, 30, 40, 50, 60].forEach(function (m) { s += '<path d="M' + xl(m) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.line + '"/>' + t(xl(m), y1 + 14, m + ' m', { size: 9.5, fill: C.sub }); });
    [0, -0.5, -1, -1.5, -2].forEach(function (d) { s += '<path d="M' + x0 + ' ' + yd(d) + 'H' + x1 + '" stroke="' + (d === -0.5 ? C.red : C.line) + '"' + (d === -0.5 ? ' stroke-width="1.6" stroke-dasharray="6 4"' : '') + '/>' + t(x0 - 6, yd(d) + 4, d === 0 ? '0' : '−' + Math.abs(d), { size: 9.5, fill: C.sub, anchor: 'end' }); });
    s += t(x0 + 6, yd(-0.5) + 14, '−0.5 dB 목표', { size: 9.5, fill: C.red, anchor: 'start', weight: 700 });
    [16, 14, 12, 10].forEach(function (g) { var d = ''; for (var m = 0; m <= L; m += 1) { var v = Math.max(-2, cableCalc(g, m, 8).loss); d += (m ? 'L' : 'M') + xl(m).toFixed(1) + ' ' + yd(v).toFixed(1); }
      var end = Math.max(-2, cableCalc(g, L, 8).loss); s += '<path d="' + d + '" fill="none" stroke="' + GCOL[g] + '" stroke-width="2.6"/>' + t(x1 + 4, yd(end) + 4, g + ' AWG', { size: 9.5, fill: GCOL[g], anchor: 'start', weight: 800 }); });
    s += t(x0, 16, '8 Ω 스피커 한 대 · 케이블 손실(dB) — 공식으로 계산한 근사', { size: 10.5, fill: C.sub, anchor: 'start', weight: 700 });
    // 오른쪽: 계산 방법
    var bx = 462; s += box(bx, 22, 134, 196, C.bg, C.line, 8);
    [['1) 왕복 저항', 700], ['= 2 × 길이 × Ω/m', 400], ['2) 손실 (dB)', 700], ['= 20·log(R ÷', 400], ['   (R + 왕복 저항))', 400], ['3) 댐핑 팩터', 700], ['≈ R ÷ 왕복 저항', 400], ['목표: 손실 −0.5 dB', 700], ['이내 · DF 20 이상', 700]].forEach(function (r, i) { s += t(bx + 8, 42 + i * 20, r[0], { size: 10, anchor: 'start', weight: r[1], fill: i >= 7 ? C.red : C.ink }); });
    s += t(300, 226, 'R = 스피커 Ω(공칭 임피던스) · AWG 숫자가 작을수록 굵어요 (12 AWG ≈ 3.3 mm², 14 AWG ≈ 2.1 mm²)', { size: 10, fill: C.sub });
    return svg(600, 234, s, '케이블 굵기와 길이에 따른 손실, 계산 방법');
  };

  /* ---------------------------------------------------------------- 그림 5: speakON 핀 · 극성 */
  V.psSpeakon = function () {
    var s = '';
    function face(cx, cy, r, pins, title, sub) {
      var b = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + C.dark + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 8) + '" fill="none" stroke="#475569" stroke-width="2"/><rect x="' + (cx - 5) + '" y="' + (cy - r) + '" width="10" height="10" fill="#475569"/>';
      pins.forEach(function (p) { b += '<circle cx="' + (cx + p[0]) + '" cy="' + (cy + p[1]) + '" r="11" fill="' + p[3] + '"/>' + t(cx + p[0], cy + p[1] + 4, p[2], { size: 9.5, weight: 800, fill: '#0f172a' }); });
      return b + t(cx, cy + r + 18, title, { size: 11.5, weight: 800 }) + t(cx, cy + r + 32, sub, { size: 9.5, fill: C.sub });
    }
    s += face(84, 92, 58, [[-24, -20, '1+', '#fca5a5'], [24, -20, '1−', '#e5e7eb'], [-24, 22, '2+', '#fde68a'], [24, 22, '2−', '#e5e7eb']], 'NL4 (4핀)', '1+ · 1− · 2+ · 2−');
    s += face(224, 92, 48, [[-18, 4, '1+', '#fca5a5'], [18, 4, '1−', '#e5e7eb']], 'NL2 (2핀)', '1+ · 1− 만');
    s += t(154, 196, '핀 위치는 단순화한 그림이에요', { size: 9, fill: C.sub });
    var bx = 304, rows = [['풀레인지 패시브 (Vi10P · Yi7P)', '1+ / 1−', C.ink], ['d&b 4선 케이블의 2± 핀', '액티브 서브우퍼용', C.violet], ['바이앰프 모드 (예: QSC AP)', '저음 1± · 고음 2±', C.blue], ['NL2 플러그 → NL4 소켓', '✓ 1± 로 연결', C.green], ['NL4 플러그 → NL2 소켓', '✗ 맞지 않음', C.red]];
    s += box(bx, 8, 290, 168, C.bg, C.line, 8);
    rows.forEach(function (r, i) { var y = 34 + i * 32; s += t(bx + 10, y, r[0], { size: 10, anchor: 'start', weight: 700 }) + t(bx + 280, y, r[1], { size: 10, anchor: 'end', weight: 800, fill: r[2] }) + (i < rows.length - 1 ? '<path d="M' + (bx + 10) + ' ' + (y + 14) + 'H' + (bx + 280) + '" stroke="#e2e8f0"/>' : ''); });
    s += box(304, 186, 290, 40, '#fef2f2', '#fecaca', 8) + t(449, 204, '+ ↔ − 가 바뀌면 극성 반대', { size: 11, weight: 800, fill: C.red }) + t(449, 219, '같은 구역을 덮는 스피커끼리 저음이 서로 지워져요(상쇄)', { size: 9.5, fill: C.red });
    return svg(600, 234, s, 'speakON NL4 와 NL2 의 핀, 쓰임새와 극성');
  };

  /* ---------------------------------------------------------------- 그림 6: 바이앰프 · 클리핑 */
  V.psProtect = function () {
    var s = '';
    s += box(6, 6, 290, 222, C.bg, C.line, 10) + t(151, 24, '패시브 모드 ↔ 바이앰프 모드 (지원하는 스피커만)', { size: 11, weight: 800, fill: C.ink });
    s += t(16, 48, '패시브 모드', { size: 10.5, weight: 800, anchor: 'start', fill: C.teal });
    s += blk(16, 56, 62, 30, '앰프 1채널', '', C.red) + arrow(78, 71, 100, 71, C.red, 2) + t(89, 64, '1±', { size: 9, fill: C.red, weight: 700 }) + blk(102, 56, 84, 30, '크로스오버', '', C.violet, '#f5f3ff') + arrow(186, 64, 206, 60, C.violet, 1.6) + arrow(186, 78, 206, 82, C.violet, 1.6) + blk(208, 50, 78, 18, '우퍼', '', C.teal) + blk(208, 74, 78, 18, '고음', '', C.amber);
    s += t(16, 120, '바이앰프 모드', { size: 10.5, weight: 800, anchor: 'start', fill: C.blue });
    s += blk(16, 128, 62, 26, 'DSP 로 나눔', '', C.blue, '#eff6ff') + arrow(78, 134, 100, 134, C.red, 2) + arrow(78, 148, 100, 170, C.red, 2);
    s += blk(102, 124, 62, 22, '앰프 저음', '', C.red) + blk(102, 160, 62, 22, '앰프 고음', '', C.red) + arrow(164, 135, 206, 135, C.red, 2) + arrow(164, 171, 206, 171, C.red, 2) + t(185, 128, '1±', { size: 9, fill: C.red, weight: 700 }) + t(185, 164, '2±', { size: 9, fill: C.red, weight: 700 });
    s += blk(208, 124, 78, 22, '우퍼', '', C.teal) + blk(208, 160, 78, 22, '고음', '', C.amber);
    s += t(151, 206, '바이앰프로 바꾸면 크로스오버를 앰프 앞에서', { size: 9.5, fill: C.sub }) + t(151, 220, '꼭 해 줘야 해요 (고음에 저음이 가면 위험)', { size: 9.5, fill: C.red, weight: 700 });
    // 클리핑
    s += box(304, 6, 290, 222, '#fff', C.line, 10) + t(449, 24, '고음 드라이버가 타는 이유 — 클리핑', { size: 11, weight: 800, fill: C.red });
    var ox = 318, oy = 90, w = 262, A = 32, cl = 19, d1 = '', d2 = '';
    for (var i = 0; i <= 120; i++) { var x = ox + i / 120 * w, v = A * Math.sin(i / 120 * Math.PI * 4); d1 += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (oy - v).toFixed(1); d2 += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (oy - Math.max(-cl, Math.min(cl, v * 1.6))).toFixed(1); }
    s += '<path d="M' + ox + ' ' + oy + 'H' + (ox + w) + '" stroke="' + C.line + '"/><path d="' + d1 + '" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-dasharray="4 3"/><path d="' + d2 + '" fill="none" stroke="' + C.red + '" stroke-width="2.6"/>';
    s += t(ox, 44, '회색: 원래 파형 · 빨강: 앰프 한계에서 잘린 파형', { size: 9.5, fill: C.sub, anchor: 'start' });
    // 성분 막대 (모양은 예시)
    var hb = [[1, 34, 30], [3, 0, 10], [5, 0, 6], [7, 0, 4]];
    s += t(380, 144, '깨끗한 신호', { size: 10, weight: 700, fill: C.sub }) + t(520, 144, '클리핑된 신호', { size: 10, weight: 700, fill: C.red });
    hb.forEach(function (h, i) { var y0 = 194; s += (h[1] ? box(340 + i * 22, y0 - h[1], 14, h[1], '#94a3b8', null, 2) : '') + box(480 + i * 22, y0 - h[2], 14, h[2], i ? C.amber : C.red, null, 2) + t(347 + i * 22, y0 + 12, (i ? h[0] + '배' : '기본'), { size: 8.5, fill: C.sub }) + t(487 + i * 22, y0 + 12, (i ? h[0] + '배' : '기본'), { size: 8.5, fill: C.sub }); });
    s += t(449, 220, '평균 힘 ↑ + 고음 성분 ↑ → 고음 드라이버가 뜨거워짐 (막대는 예시)', { size: 9.5, fill: C.red, weight: 700 });
    return svg(600, 234, s, '바이앰프 모드와 클리핑이 고음 드라이버에 주는 부담');
  };

  /* ===================================================================== 실습: STASims.passiveRig */
  function injectCss() {
    if (document.getElementById('sta-mod-ps-css')) return;
    var st = document.createElement('style'); st.id = 'sta-mod-ps-css';
    st.textContent = [
      '.sim-ps{display:flex;flex-direction:column;gap:10px}',
      '.sim-ps-scenes{display:flex;gap:6px;flex-wrap:wrap}',
      '.sim-ps-scenes button{flex:1 1 130px;border:1px solid var(--sta-line);background:#f8fafc;border-radius:10px;padding:8px 10px;font:inherit;font-size:.84rem;font-weight:800;color:var(--sta-ink);cursor:pointer;text-align:left}',
      '.sim-ps-scenes button[aria-pressed=true]{background:var(--sta-navy);border-color:var(--sta-navy);color:#fff}',
      '.sim-ps-scenes small{display:block;font-weight:600;font-size:.7rem;opacity:.8}',
      '.sim-ps-body{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:12px;align-items:start}',
      '.sim-ps-view{min-width:0;border:1px solid var(--sta-line);border-radius:12px;overflow:hidden;background:#eef3f8}',
      '.sim-ps-scroll{overflow-x:auto}',
      '.sim-ps-svg{display:block;width:100%;min-width:540px;height:auto;user-select:none;-webkit-user-select:none}',
      '.sim-ps-svg [data-drag]{cursor:grab;touch-action:none}',
      '.sim-ps-svg.dragging,.sim-ps-svg.dragging [data-drag]{cursor:grabbing}',
      '.sim-ps-pane[hidden]{display:none}',
      '.sim-ps-verdict{margin-top:6px;padding:7px 10px;border-radius:8px;font-size:.78rem;line-height:1.5;word-break:keep-all}',
      '.sim-ps-verdict.ok{background:var(--sta-ok-bg);color:var(--sta-ok);border:1px solid var(--sta-ok-line)}.sim-ps-verdict.warn{background:var(--sta-warn-bg);color:var(--sta-warn);border:1px solid var(--sta-warn-line)}.sim-ps-verdict.bad{background:var(--sta-bad-bg);color:var(--sta-bad);border:1px solid var(--sta-bad-line)}',
      '.sim-ps .sim-range output{font-variant-numeric:tabular-nums;font-weight:800}',
      '.sim-ps-gauges{display:grid;grid-template-columns:1fr 1fr;gap:5px}',
      '@media (max-width:860px){.sim-ps-body{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  var VB = { wire: [640, 380], pins: [640, 360], cable: [640, 300], match: [640, 262] };
  var PORTS = {
    ch1: { x: 66, y: 142, kind: 'out', name: '앰프 CH1 OUT' }, ch2: { x: 156, y: 142, kind: 'out', name: '앰프 CH2 OUT' },
    lin: { x: 66, y: 306, kind: 'line', name: 'ZXA1 LINE IN' },
    aIn: { x: 470, y: 128, cab: 'A', name: '스피커 A IN' }, aLk: { x: 570, y: 128, cab: 'A', name: '스피커 A LINK' },
    bIn: { x: 470, y: 312, cab: 'B', name: '스피커 B IN' }, bLk: { x: 570, y: 312, cab: 'B', name: '스피커 B LINK' }
  };
  var CAB_R = 8, AMP_MIN = 4;
  var TERM = { '1+': [-40, -36], '1-': [40, -36], '2+': [-40, 38], '2-': [40, 38] };
  var PLUG = { A: { cx: 170, cy: 196 }, B: { cx: 470, cy: 196 } };
  var AMPS = {
    small: { name: '작은 앰프 (예시)', w: 100, note: '8 Ω 에서 100 W' },
    xli: { name: 'Crown XLi1500 한 채널', w: 330, note: '8 Ω 에서 330 W (제조사 자료)' },
    bridge: { name: 'XLi1500 브리지', w: 900, note: '8 Ω 에서 900 W (제조사 자료)' }
  };
  var SPK = { name: 'EV ZX1', R: 8, cont: 200, prog: 400, peak: 800 };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function f1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
  function sgnDb(v) { return (v < 0 ? '−' : '') + f2(Math.abs(v)) + ' dB'; }
  function ohm(v) { return (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : f1(v)) + ' Ω'; }

  function initCables() { return [
    { col: '#f97316', ends: [{ port: 'ch1' }, { port: 'lin' }] },
    { col: '#2563eb', ends: [{ port: null, x: 262, y: 330 }, { port: null, x: 372, y: 330 }] },
    { col: '#16a34a', ends: [{ port: null, x: 262, y: 360 }, { port: null, x: 372, y: 360 }] }
  ]; }

  function passiveRig(el, opts) {
    opts = opts || {}; injectCss();
    var S = { scene: 'wire', mode: 'parallel', cables: initCables(), wires: { A: { r: null, k: null }, B: { r: '1-', k: '1+' } }, gauge: 16, len: 15, R: 8, amp: null, done: {} };
    var scenes = [['wire', '① 연결 · 부하', '두 대를 한 채널에'], ['pins', '② speakON 핀', '1± 배선 · 극성'], ['cable', '③ 케이블 굵기', '길이 · 손실 · 댐핑'], ['match', '④ 앰프 매칭', '정격과 여유']];
    el.innerHTML =
      '<div class="sim-ps">' +
        '<div class="sim-ps-scenes" role="group" aria-label="실습 장면">' + scenes.map(function (s) { return '<button type="button" data-scene="' + s[0] + '" aria-pressed="' + (s[0] === S.scene) + '">' + s[1] + '<small>' + s[2] + '</small></button>'; }).join('') + '</div>' +
        '<div class="sim-ps-body">' +
          '<div class="sim-ps-view"><div class="sim-ps-scroll"><svg class="sim-ps-svg" data-role="svg" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif" role="application" aria-label="패시브 스피커 실습 화면"></svg></div><div class="sim-hint" data-role="hint"></div></div>' +
          '<div class="sim-side">' +
            // ① 연결
            '<div class="sim-ps-pane" data-pane="wire">' +
              '<div class="sim-box"><h4>스피커끼리 잇는 방식 <small>실습용</small></h4><div class="sim-types">' +
                '<label class="sim-type"><input type="radio" name="simPsMode" value="parallel" checked><span><b>링크 케이블 (병렬)</b><small>IN · LINK 단자가 안에서 병렬 — 보통의 연결</small></span></label>' +
                '<label class="sim-type"><input type="radio" name="simPsMode" value="series"><span><b>직렬 배선 (특수 케이블)</b><small>앞 스피커 − 를 뒤 스피커 + 로 — 계산 비교용</small></span></label></div>' +
                '<div class="sim-btns"><button type="button" class="sim-btn" data-act="resetWire">처음 상태로</button></div></div>' +
              '<div class="sim-box sim-read" data-role="readWire"></div></div>' +
            // ② 핀
            '<div class="sim-ps-pane" data-pane="pins" hidden>' +
              '<div class="sim-box sim-read" data-role="readPins"></div>' +
              '<div class="sim-box"><p class="sim-note" style="margin:0">두 스피커(Vi10P · Yi7P 같은 풀레인지 패시브)는 <b>1+ / 1−</b> 로 소리를 받아요. 빨강 = 앰프 +, 검정 = 앰프 − 예요.</p><div class="sim-btns"><button type="button" class="sim-btn" data-act="resetPins">처음 상태로</button></div></div></div>' +
            // ③ 케이블
            '<div class="sim-ps-pane" data-pane="cable" hidden>' +
              '<div class="sim-box"><h4>부하</h4><div class="sim-types">' +
                '<label class="sim-type"><input type="radio" name="simPsR" value="8" checked><span><b>8 Ω — 스피커 1대</b><small>예: Vi10P · Yi7P 한 대</small></span></label>' +
                '<label class="sim-type"><input type="radio" name="simPsR" value="4"><span><b>4 Ω — 8 Ω 2대 병렬</b><small>링크로 두 대를 이었을 때</small></span></label></div></div>' +
              '<div class="sim-box"><h4>케이블 굵기 <small>구리선 저항: 제조사 표</small></h4><div class="sim-ps-gauges">' + GAUGES.map(function (g) { return '<label class="sim-type"><input type="radio" name="simPsG" value="' + g.g + '"' + (g.g === S.gauge ? ' checked' : '') + '><span><b>' + g.g + ' AWG</b><small>약 ' + g.mm + ' mm²</small></span></label>'; }).join('') + '</div>' +
                '<label class="sim-range" style="margin-top:8px"><span>케이블 길이 (한 방향) <output data-out="len"></output></span><input type="range" min="0" max="60" step="1" data-sim="len" aria-label="케이블 길이(m)"></label></div>' +
              '<div class="sim-box sim-read" data-role="readCable"></div></div>' +
            // ④ 매칭
            '<div class="sim-ps-pane" data-pane="match" hidden>' +
              '<div class="sim-box"><h4>스피커: EV ZX1 <small>제조사 자료</small></h4><p class="sim-note" style="margin:0">패시브 8 Ω · 연속 200 W · 프로그램 400 W · 피크 800 W</p></div>' +
              '<div class="sim-box"><h4>앰프 고르기</h4><div class="sim-types">' + Object.keys(AMPS).map(function (k) { var a = AMPS[k]; return '<label class="sim-type"><input type="radio" name="simPsAmp" value="' + k + '"><span><b>' + a.name + '</b><small>' + a.note + '</small></span></label>'; }).join('') + '</div></div>' +
              '<div class="sim-box sim-read" data-role="readMatch"></div></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    var q = function (s) { return el.querySelector(s); }, svgEl = q('[data-role=svg]');
    var drag = null, R = {};

    /* ------------------------------------------------ 계산 */
    function endPos(e) { return e.port ? { x: PORTS[e.port].x, y: PORTS[e.port].y } : { x: e.x, y: e.y }; }
    function analyze() {
      var par = {}; Object.keys(PORTS).forEach(function (k) { par[k] = k; });
      function find(a) { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }
      function uni(a, b) { par[find(a)] = find(b); }
      uni('aIn', 'aLk'); uni('bIn', 'bLk');
      var cabCab = false;
      S.cables.forEach(function (c) { var a = c.ends[0].port, b = c.ends[1].port; if (a && b) { uni(a, b); if (PORTS[a].cab && PORTS[b].cab && PORTS[a].cab !== PORTS[b].cab) cabCab = true; } });
      var short = find('ch1') === find('ch2');
      function ch(id) { var r = find(id), cabs = ['A', 'B'].filter(function (c) { return find(c.toLowerCase() + 'In') === r; }), n = cabs.length, load = null;
        if (n === 1) load = CAB_R; else if (n === 2) load = (S.mode === 'series' && cabCab) ? 2 * CAB_R : CAB_R / 2;
        return { n: n, cabs: cabs, load: load, ok: load != null && load >= AMP_MIN && !short }; }
      var c1 = ch('ch1'), c2 = ch('ch2'), lr = find('lin');
      var lineDanger = lr === find('ch1') || lr === find('ch2');
      var linePlug = S.cables.some(function (c) { return c.ends.some(function (e) { return e.port === 'lin'; }); });
      return { ch1: c1, ch2: c2, short: short, lineDanger: lineDanger, linePlug: linePlug, cabCab: cabCab };
    }
    function pinStatus(cab) { var w = S.wires[cab], r = w.r, k = w.k;
      if (!r || !k) return 'open'; if (r === '1+' && k === '1-') return 'normal'; if (r === '1-' && k === '1+') return 'reversed';
      if ((r === '2+' && k === '2-') || (r === '2-' && k === '2+')) return 'pin2'; return 'bad'; }
    function calc() { R.w = analyze(); R.pa = pinStatus('A'); R.pb = pinStatus('B'); R.c = cableCalc(S.gauge, S.len, S.R); }

    /* ------------------------------------------------ 과제 (놓은 뒤 · 고른 뒤에만 확인) */
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function check() {
      calc(); var w = R.w;
      if (!w.short && [w.ch1, w.ch2].some(function (c) { return c.n === 2 && c.ok; })) hit('load');
      if (!w.lineDanger && !w.short && (w.ch1.n + w.ch2.n) >= 1) hit('lineIn');
      if (R.pa === 'normal') hit('pins');
      if (R.pb === 'normal') hit('polarity');
      if (S.R === 8 && S.len >= 30 && R.c.loss > -0.5 && R.c.df >= 20) hit('cable');
      if (S.amp === 'xli') hit('match');
    }

    /* ------------------------------------------------ 그리기 */
    function T(x, y, s, o) { return t(x, y, s, o); }
    var LAB = [];   // 단자 이름은 케이블 위에 다시 그림(가려지지 않게)
    function halo(x, y, s2, o) { return t(x, y, s2, o).replace('<text ', '<text stroke="#111827" stroke-width="3" paint-order="stroke" '); }
    function sock(p, label, col, sub) { LAB.push(halo(p.x, p.y + 32, label, { size: 10.5, weight: 800, fill: '#e5e7eb' }) + (sub ? halo(p.x, p.y + 45, sub, { size: 9, fill: '#cbd5e1' }) : '')); return '<circle cx="' + p.x + '" cy="' + p.y + '" r="17" fill="#0b0f14" stroke="' + (col || '#64748b') + '" stroke-width="2"/><circle cx="' + p.x + '" cy="' + p.y + '" r="7" fill="none" stroke="#475569" stroke-width="2"/>'; }
    function cablePath(a, b) { var sag = Math.max(36, Math.abs(a.x - b.x) * 0.22 + Math.abs(a.y - b.y) * 0.1); return 'M' + a.x + ' ' + a.y + 'C' + a.x + ' ' + Math.min(a.y + sag, 374) + ' ' + b.x + ' ' + Math.min(b.y + sag, 374) + ' ' + b.x + ' ' + b.y; }
    function drawWire() {
      var w = R.w, s = '<rect width="640" height="380" fill="#eef3f8"/>'; LAB = [];
      // 앰프
      s += box(14, 22, 200, 176, '#1f2937', '#0b0f14', 10) + T(114, 42, '실습 파워앰프 (예시)', { size: 12, weight: 800, fill: '#fff' }) + T(114, 60, '정격 8 Ω · 4 Ω — 4 Ω 미만 금지', { size: 9.5, fill: '#fbbf24', weight: 700 });
      [['ch1', w.ch1], ['ch2', w.ch2]].forEach(function (c) { var p = PORTS[c[0]], st = c[1], col = w.short ? '#ef4444' : !st.n ? '#64748b' : st.ok ? '#22c55e' : '#ef4444';
        s += sock(p, c[0] === 'ch1' ? 'CH1 OUT' : 'CH2 OUT', col, st.n ? '부하 ' + ohm(st.load) : '연결 없음'); });
      s += T(114, 88, 'speakON 출력', { size: 9, fill: '#94a3b8' });
      // ZXA1
      s += box(14, 236, 200, 128, '#e5e7eb', '#94a3b8', 10) + T(114, 256, '액티브 스피커 ZXA1 뒷면', { size: 11.5, weight: 800 }) + T(114, 272, 'LINE IN 은 라인 레벨만 받아요', { size: 9.5, fill: C.sub });
      var lp = PORTS.lin; s += '<circle cx="' + lp.x + '" cy="' + lp.y + '" r="17" fill="#fff" stroke="' + (w.lineDanger ? C.red : '#475569') + '" stroke-width="2.4"/><circle cx="' + (lp.x - 6) + '" cy="' + (lp.y - 4) + '" r="2.2" fill="#334155"/><circle cx="' + (lp.x + 6) + '" cy="' + (lp.y - 4) + '" r="2.2" fill="#334155"/><circle cx="' + lp.x + '" cy="' + (lp.y + 6) + '" r="2.2" fill="#334155"/>' + T(lp.x, lp.y + 32, 'LINE IN', { size: 10.5, weight: 800 }) + T(lp.x, lp.y + 45, 'XLR/TRS 콤보', { size: 9, fill: C.sub });
      if (w.lineDanger) s += box(100, 284, 108, 44, '#fef2f2', C.red, 6) + T(154, 302, '⚠ 스피커 레벨이', { size: 10, weight: 800, fill: C.red }) + T(154, 318, '라인 입력에!', { size: 10, weight: 800, fill: C.red });
      else if (w.linePlug) s += T(154, 306, '스피커 케이블은 빼요', { size: 9.5, fill: C.amber, weight: 700 });
      // 스피커
      [['A', 22], ['B', 206]].forEach(function (c) { var y = c[1]; s += box(420, y, 204, 152, '#111827', '#000', 10) + T(522, y + 20, '패시브 스피커 ' + c[0] + ' · 8 Ω', { size: 12, weight: 800, fill: '#fff' }) + T(522, y + 36, 'IN · LINK 는 안에서 병렬', { size: 9.5, fill: '#94a3b8' }) +
        '<circle cx="452" cy="' + (y + 64) + '" r="14" fill="#374151" stroke="#4b5563" stroke-width="2"/><circle cx="452" cy="' + (y + 64) + '" r="5" fill="#6b7280"/>' + T(474, y + 68, '스피커 단자판', { size: 9.5, fill: '#cbd5e1', anchor: 'start' }); });
      ['aIn', 'aLk', 'bIn', 'bLk'].forEach(function (k) { s += sock(PORTS[k], /In$/.test(k) ? 'IN' : 'LINK', '#64748b'); });
      // 보관함
      s += '<rect x="226" y="300" width="182" height="72" rx="10" fill="#fff" stroke="#94a3b8" stroke-dasharray="6 4"/>' + T(317, 316, '케이블 보관함 · 끝을 끌어 꽂아요', { size: 9.5, fill: C.sub });
      if (w.short) s += box(222, 110, 186, 40, '#fef2f2', C.red, 6) + T(315, 127, '⚠ CH1 · CH2 출력이 서로 이어졌어요', { size: 10, weight: 800, fill: C.red }) + T(315, 142, '출력끼리 연결하면 안 돼요', { size: 9.5, fill: C.red });
      // 케이블
      S.cables.forEach(function (c, ci) { var a = endPos(c.ends[0]), b = endPos(c.ends[1]);
        s += '<path d="' + cablePath(a, b) + '" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round" opacity=".35"/><path d="' + cablePath(a, b) + '" fill="none" stroke="' + c.col + '" stroke-width="5.5" stroke-linecap="round"/>';
        c.ends.forEach(function (e, ei) { var p = endPos(e), on = drag && drag.type === 'plug' && drag.ci === ci && drag.ei === ei;
          s += '<g data-drag="plug"><circle cx="' + p.x + '" cy="' + p.y + '" r="' + (on ? 14 : 12) + '" fill="' + c.col + '" stroke="#0f172a" stroke-width="2.4"/><circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="#0f172a" opacity=".55"/></g>'; }); });
      s += LAB.join('');
      if (drag && drag.type === 'plug') { var near = nearPort(drag.pt, drag.ci, drag.ei); if (near) s += '<circle cx="' + PORTS[near].x + '" cy="' + PORTS[near].y + '" r="24" fill="none" stroke="#22d3ee" stroke-width="3" stroke-dasharray="5 4"/>'; }
      return s;
    }
    function drawPins() {
      var s = '<rect width="640" height="360" fill="#eef3f8"/>';
      ['A', 'B'].forEach(function (cab) {
        var P = PLUG[cab], st = cab === 'A' ? R.pa : R.pb, msg = { normal: ['✓ 소리 남 · 극성 정상', C.green], reversed: ['⚠ 소리는 나지만 극성 반대', C.amber], pin2: ['✗ 소리 안 남 — 2± 는 이 스피커에서 안 써요', C.red], bad: ['✗ 회로가 안 이어져요', C.red], open: ['선이 아직 덜 꽂혔어요', C.sub] }[st];
        s += T(P.cx, 20, cab === 'A' ? '케이블 A — 새로 만들기 (스피커 A)' : '케이블 B — 점검 (스피커 B)', { size: 12, weight: 800 }) + T(P.cx, 38, msg[0], { size: 10.5, weight: 800, fill: msg[1] });
        s += box(P.cx - 34, 46, 68, 14, '#334155', null, 4) + T(P.cx, 57, '앰프 쪽', { size: 8.5, fill: '#cbd5e1' });
        s += '<circle cx="' + P.cx + '" cy="' + P.cy + '" r="92" fill="#1f2937"/><circle cx="' + P.cx + '" cy="' + P.cy + '" r="80" fill="none" stroke="#475569" stroke-width="3"/><rect x="' + (P.cx - 8) + '" y="' + (P.cy - 92) + '" width="16" height="14" fill="#475569"/>';
        s += T(P.cx, P.cy + 6, 'NL4 플러그 (뒤쪽 단자)', { size: 9.5, fill: '#94a3b8' });
        Object.keys(TERM).forEach(function (k) { var tx = P.cx + TERM[k][0], ty = P.cy + TERM[k][1], used = S.wires[cab].r === k || S.wires[cab].k === k;
          s += '<circle cx="' + tx + '" cy="' + ty + '" r="15" fill="' + (/^1/.test(k) ? '#e5e7eb' : '#fde68a') + '" stroke="' + (used ? '#22d3ee' : '#64748b') + '" stroke-width="2.4"/>' + T(tx + (TERM[k][0] < 0 ? -26 : 26), ty + 4, k.replace('-', '−'), { size: 12, weight: 800, fill: '#fff' }); });
        if (drag && drag.type === 'wire' && drag.cab === cab) { var nt = nearTerm(cab, drag.pt, drag.col); if (nt) s += '<circle cx="' + (P.cx + TERM[nt][0]) + '" cy="' + (P.cy + TERM[nt][1]) + '" r="22" fill="none" stroke="#22d3ee" stroke-width="3" stroke-dasharray="5 4"/>'; }
        [['r', '#dc2626', -12], ['k', '#111827', 12]].forEach(function (wc) {
          var ex = P.cx + wc[2], ey = 60, p = wirePos(cab, wc[0]);
          s += '<path d="M' + ex + ' ' + ey + 'C' + ex + ' ' + (ey + 50) + ' ' + p.x + ' ' + (p.y - 50) + ' ' + p.x + ' ' + p.y + '" fill="none" stroke="' + wc[1] + '" stroke-width="5" stroke-linecap="round"/>';
          s += '<g data-drag="wire"><circle cx="' + p.x + '" cy="' + p.y + '" r="10" fill="' + wc[1] + '" stroke="#fff" stroke-width="2.4"/></g>';
        });
        s += T(P.cx - 70, 352, '빨강 = +', { size: 10, fill: '#dc2626', weight: 800 }) + T(P.cx + 70, 352, '검정 = −', { size: 10, fill: '#111827', weight: 800 });
      });
      return s;
    }
    function wirePos(cab, col) { if (drag && drag.type === 'wire' && drag.cab === cab && drag.col === col) return drag.pt; var k = S.wires[cab][col], P = PLUG[cab];
      if (k) return { x: P.cx + TERM[k][0], y: P.cy + TERM[k][1] }; return { x: P.cx + (col === 'r' ? -70 : 70), y: 322 }; }
    function drawCable() {
      var s = '<rect width="640" height="300" fill="#fff"/>', x0 = 70, x1 = 560, y0 = 30, y1 = 214, L = 60, xl = function (m) { return x0 + m / L * (x1 - x0); }, yd = function (d) { return y0 + Math.min(2, -d) / 2 * (y1 - y0); };
      [0, 10, 20, 30, 40, 50, 60].forEach(function (m) { s += '<path d="M' + xl(m) + ' ' + y0 + 'V' + y1 + '" stroke="#e2e8f0"/>' + T(xl(m), y1 + 14, m + ' m', { size: 10, fill: C.sub }); });
      [0, -0.5, -1, -1.5, -2].forEach(function (d) { s += '<path d="M' + x0 + ' ' + yd(d) + 'H' + x1 + '" stroke="' + (d === -0.5 ? C.red : '#e2e8f0') + '"' + (d === -0.5 ? ' stroke-dasharray="6 4" stroke-width="1.6"' : '') + '/>' + T(x0 - 6, yd(d) + 4, d === 0 ? '0 dB' : '−' + Math.abs(d), { size: 10, fill: C.sub, anchor: 'end' }); });
      s += T(x0 + 6, yd(-0.5) + 15, '목표 −0.5 dB', { size: 10, fill: C.red, anchor: 'start', weight: 700 }) + T(x0, 18, '부하 ' + S.R + ' Ω · 굵기별 케이블 손실 (교육용 계산)', { size: 11, fill: C.sub, anchor: 'start', weight: 700 });
      GAUGES.forEach(function (g) { var d = '', sel = g.g === S.gauge; for (var m = 0; m <= L; m++) { var v = cableCalc(g.g, m, S.R).loss; d += (m ? 'L' : 'M') + xl(m).toFixed(1) + ' ' + yd(v).toFixed(1); }
        var lv = cableCalc(g.g, L, S.R).loss; s += '<path d="' + d + '" fill="none" stroke="' + GCOL[g.g] + '" stroke-width="' + (sel ? 4 : 1.6) + '" opacity="' + (sel ? 1 : 0.55) + '"/>' + T(x1 + 6, yd(lv) + 4, g.g + (sel ? ' AWG ◀' : ''), { size: sel ? 11 : 9.5, fill: GCOL[g.g], anchor: 'start', weight: sel ? 800 : 600 }); });
      var c = R.c, x = xl(S.len), y = yd(c.loss), ok = c.loss > -0.5;
      s += '<path d="M' + x + ' ' + y0 + 'V' + y1 + '" stroke="#0f172a" stroke-width="1.6" stroke-dasharray="3 3"/><circle cx="' + x + '" cy="' + y + '" r="6" fill="' + (ok ? C.green : C.red) + '" stroke="#fff" stroke-width="2"/>';
      s += T(x + (S.len > 40 ? -10 : 10), Math.max(y0 + 14, y - 10), sgnDb(c.loss), { size: 12, weight: 800, fill: ok ? C.green : C.red, anchor: S.len > 40 ? 'end' : 'start' });
      s += '<path d="M' + x0 + ' 262H' + x1 + '" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round"/><path d="M' + x0 + ' 262H' + x + '" stroke="#0e7490" stroke-width="6" stroke-linecap="round"/>';
      s += '<g data-drag="len"><circle cx="' + x + '" cy="262" r="' + (drag && drag.type === 'len' ? 15 : 13) + '" fill="#fff" stroke="#0e7490" stroke-width="3"/>' + T(x, 266, S.len, { size: 10, weight: 800, fill: '#0e7490' }) + '</g>';
      s += T(x0, 290, '◀ 동그라미를 좌우로 끌어 케이블 길이(한 방향)를 바꿔요 ▶', { size: 10, fill: C.sub, anchor: 'start' });
      return s;
    }
    function drawMatch() {
      var s = '<rect width="640" height="262" fill="#fff"/>', x0 = 150, x1 = 610, xw = function (w) { return x0 + w / 1000 * (x1 - x0); };
      s += '<rect x="' + xw(SPK.cont) + '" y="24" width="' + (xw(SPK.prog) - xw(SPK.cont)) + '" height="196" fill="' + C.green + '" fill-opacity=".1"/>' + T((xw(200) + xw(400)) / 2, 18, '교육용 기준 칸', { size: 10, fill: C.green, weight: 800 });
      [0, 200, 400, 600, 800, 1000].forEach(function (w) { s += '<path d="M' + xw(w) + ' 24V220" stroke="#e2e8f0"/>' + T(xw(w), 236, w + ' W', { size: 10, fill: C.sub }); });
      [['연속 (AES)', SPK.cont, C.teal], ['프로그램', SPK.prog, C.blue], ['피크', SPK.peak, C.violet]].forEach(function (r, i) { var y = 34 + i * 32;
        s += T(x0 - 8, y + 15, r[0], { size: 11, weight: 700, anchor: 'end' }) + box(x0, y, xw(r[1]) - x0, 22, r[2], null, 4) + T(xw(r[1]) + 6, y + 15, r[1] + ' W', { size: 10.5, weight: 800, fill: r[2], anchor: 'start' }); });
      s += T(x0 - 8, 196, '앰프 (8 Ω)', { size: 11, weight: 700, anchor: 'end' });
      Object.keys(AMPS).forEach(function (k, i) { var a = AMPS[k], x = xw(a.w), sel = S.amp === k, col = sel ? (k === 'xli' ? C.green : C.red) : '#94a3b8';
        s += '<path d="M' + x + ' 140V214" stroke="' + col + '" stroke-width="' + (sel ? 4 : 2) + '"' + (sel ? '' : ' stroke-dasharray="4 3"') + '/>' + T(x + (i === 2 ? -6 : 6), 176 + i * 14, a.w + ' W' + (sel ? ' ◀ 고름' : ''), { size: sel ? 11.5 : 10, weight: 800, fill: col, anchor: i === 2 ? 'end' : 'start' }); });
      s += T(x0, 254, '앰프 W 는 스피커와 같은 Ω(여기서는 8 Ω) 정격으로 비교해요', { size: 10, fill: C.sub, anchor: 'start' });
      return s;
    }

    /* ------------------------------------------------ 읽기 칸 */
    function row(k, v, cls) { return '<div class="sim-row"><span>' + k + '</span><b class="' + (cls || '') + '">' + v + '</b></div>'; }
    function verdict(cls, html) { return '<div class="sim-ps-verdict ' + cls + '">' + html + '</div>'; }
    function readWire() {
      var w = R.w, h = '<h4>앰프가 보는 부하</h4>';
      [['CH1', w.ch1], ['CH2', w.ch2]].forEach(function (c) { var st = c[1];
        h += row(c[0], st.n ? st.cabs.join(' + ') + ' · ' + ohm(st.load) : '연결 없음', st.n ? (st.ok ? 'ok' : 'bad') : '');
        if (st.n) h += row('　같은 전압일 때 전력', (st.load === 4 ? '8 Ω 한 대의 2배' : st.load === 16 ? '8 Ω 한 대의 ½' : '기준 (1배)')); });
      if (w.short) h += verdict('bad', '두 채널 출력이 스피커를 거쳐 서로 이어졌어요. 앰프 출력끼리는 절대 잇지 않아요.');
      else if (w.lineDanger) h += verdict('bad', '앰프 스피커 출력이 액티브 스피커 <b>LINE IN</b> 에 들어가 있어요. 수십 V 가 라인 입력에 들어가면 장비가 망가질 수 있어요. 케이블 끝을 끌어서 빼요.');
      else if (w.ch1.n === 2 || w.ch2.n === 2) { var c = w.ch1.n === 2 ? w.ch1 : w.ch2; h += verdict(c.ok ? 'ok' : 'bad', (S.mode === 'series' && w.cabCab ? '직렬: 8 + 8 = 16 Ω 이에요. 안전하지만 같은 전압에서 힘이 ¼ 이라 소리가 덜 커요.' : '병렬: 8 ÷ 2 = 4 Ω 이에요. 이 앰프 정격(4 Ω 이상) 안이에요. Vi10P 도 제조사 표에 「채널당 2대」예요.')); }
      else h += verdict('warn', '보관함의 케이블 끝을 끌어 앰프 CH OUT → 스피커 A IN, 스피커 A LINK → 스피커 B IN 으로 이어 보세요.');
      q('[data-role=readWire]').innerHTML = h;
    }
    function readPins() {
      var txt = { normal: ['정상', 'ok'], reversed: ['극성 반대', 'warn'], pin2: ['소리 안 남 (2±)', 'bad'], bad: ['회로 안 됨', 'bad'], open: ['덜 꽂힘', ''] }, h = '<h4>점검 결과</h4>';
      h += row('스피커 A', txt[R.pa][0], txt[R.pa][1]) + row('스피커 B', txt[R.pb][0], txt[R.pb][1]);
      var sa = R.pa === 'normal' || R.pa === 'reversed', sb = R.pb === 'normal' || R.pb === 'reversed';
      if (sa && sb) h += R.pa === R.pb ? verdict('ok', 'A · B 가 같은 극성이에요. 겹치는 곳에서 저음이 함께 밀어 줘요.') : verdict('warn', 'A · B 극성이 서로 달라요. 두 소리가 겹치는 곳에서 저음이 서로 지워져요(상쇄). +/− 가 바뀐 케이블을 고쳐요.');
      else h += verdict('warn', '선 끝(동그라미)을 끌어 단자에 놓아요. 빨강(+) → 1+, 검정(−) → 1− 이 기본이에요.');
      q('[data-role=readPins]').innerHTML = h;
    }
    function readCable() {
      var c = R.c, g = gauge(S.gauge), ok1 = c.loss > -0.5, ok2 = c.df >= 20, h = '<h4>계산 결과 <small>교육용 근사</small></h4>';
      h += row('왕복 길이', (2 * S.len) + ' m') + row('케이블 저항', f2(g.r * 1000) + ' mΩ/m × ' + (2 * S.len) + ' m = ' + f2(c.rc) + ' Ω');
      h += row('손실', sgnDb(c.loss), ok1 ? 'ok' : 'bad') + row('댐핑 팩터 (케이블만)', isFinite(c.df) ? f1(c.df) : '—', ok2 ? 'ok' : 'warn') + row('스피커에서 열로 사라지는 힘', f1((1 - Math.pow(10, c.loss / 10)) * 100) + ' %');
      h += verdict(ok1 && ok2 ? 'ok' : ok1 ? 'warn' : 'bad', ok1 && ok2 ? '손실 0.5 dB 이내, 댐핑 팩터 20 이상이에요.' : ok1 ? '손실은 괜찮지만 댐핑 팩터가 20 보다 작아요. 더 굵은 케이블로 바꿔 보세요.' : '손실이 0.5 dB 를 넘어요. 더 굵은 케이블(AWG 숫자가 작은 것)을 골라요. 아니면 앰프를 스피커 가까이 둬요.');
      if (S.gauge === 10) h += '<p class="sim-note">참고: 10 AWG(약 5.3 mm²)는 일반 speakON 커넥터 NL4FXX-W-L(1.5–4 mm²)에 바로 물리지 않을 수 있어요(심화 학습).</p>';
      q('[data-role=readCable]').innerHTML = h; q('[data-out=len]').textContent = S.len + ' m';
    }
    function readMatch() {
      var h = '<h4>판단 <small>교육용 기준</small></h4>';
      if (!S.amp) h += verdict('warn', '앰프를 하나 골라 보세요. 기준은 앰프 W(8 Ω)가 스피커 <b>연속 정격 ~ 2배(프로그램 정격)</b> 사이인 거예요.');
      else { var a = AMPS[S.amp], r = a.w / SPK.cont; h += row('고른 앰프', a.w + ' W / 8 Ω') + row('연속 정격의', f1(r) + ' 배', r >= 1 && r <= 2 ? 'ok' : 'bad');
        h += S.amp === 'xli' ? verdict('ok', '연속 200 W ~ 프로그램 400 W 사이예요. 여유가 있어서 클리핑 없이 쓰기 쉬워요. 그래도 CLIP 표시등과 소리를 확인하며 음량을 맞춰요.')
          : S.amp === 'small' ? verdict('bad', '앰프가 작으면 원하는 음량을 내려다 자주 <b>클리핑</b>돼요(소리 파형이 잘림). 찌그러진 신호는 고음 드라이버를 오히려 더 위험하게 해요. 작은 앰프가 안전한 게 아니에요.')
          : verdict('bad', '연속 정격의 4.5배예요. 조금만 실수해도 스피커가 견디는 힘을 크게 넘을 수 있어요. 이런 조합은 리미터 · 설정으로 확실히 보호할 수 있을 때만 써요.'); }
      q('[data-role=readMatch]').innerHTML = h;
    }
    var HINT = { wire: '케이블 끝(색 동그라미)을 끌어 단자에 놓으면 꽂혀요. 꽂힌 끝을 끌어내면 빠져요. 판정은 손을 놓을 때 해요. (좁은 화면에서는 그림을 옆으로 밀어 볼 수 있어요)', pins: 'NL4 플러그 뒤쪽 단자예요. 빨강 · 검정 선 끝을 끌어 단자(1+ · 1− · 2+ · 2−)에 놓아요.', cable: '굵기와 부하를 골라요. 아래 동그라미를 끌어 길이를 바꿔요(오른쪽 막대도 돼요). 판정은 손을 놓을 때 해요.', match: '오른쪽에서 앰프를 골라 ZX1 의 정격과 비교해요.' };
    function update() {
      calc();
      var vb = VB[S.scene]; svgEl.setAttribute('viewBox', '0 0 ' + vb[0] + ' ' + vb[1]);
      svgEl.innerHTML = { wire: drawWire, pins: drawPins, cable: drawCable, match: drawMatch }[S.scene]();
      svgEl.classList.toggle('dragging', !!drag);
      el.querySelectorAll('[data-scene]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-scene') === S.scene)); });
      el.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== S.scene; });
      el.querySelectorAll('input[name=simPsMode]').forEach(function (r) { r.checked = r.value === S.mode; });
      el.querySelectorAll('input[name=simPsR]').forEach(function (r) { r.checked = +r.value === S.R; });
      el.querySelectorAll('input[name=simPsG]').forEach(function (r) { r.checked = +r.value === S.gauge; });
      el.querySelectorAll('input[name=simPsAmp]').forEach(function (r) { r.checked = r.value === S.amp; });
      var rg = q('[data-sim=len]'); if (+rg.value !== S.len) rg.value = S.len;
      q('[data-role=hint]').textContent = HINT[S.scene];
      readWire(); readPins(); readCable(); readMatch();
    }

    /* ------------------------------------------------ 마우스 */
    function pt(e) { var m = svgEl.getScreenCTM(); if (!m) return { x: 0, y: 0 }; var p = svgEl.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; var r = p.matrixTransform(m.inverse()); return { x: r.x, y: r.y }; }
    function occupied(port, ci, ei) { return S.cables.some(function (c, i) { return c.ends.some(function (e, j) { return e.port === port && !(i === ci && j === ei); }); }); }
    function nearPort(p, ci, ei) { var best = null, bd = 26; Object.keys(PORTS).forEach(function (k) { var d = Math.hypot(p.x - PORTS[k].x, p.y - PORTS[k].y); if (d < bd && !occupied(k, ci, ei)) { bd = d; best = k; } }); return best; }
    function nearTerm(cab, p, col) { var P = PLUG[cab], other = S.wires[cab][col === 'r' ? 'k' : 'r'], best = null, bd = 26; Object.keys(TERM).forEach(function (k) { if (k === other) return; var d = Math.hypot(p.x - P.cx - TERM[k][0], p.y - P.cy - TERM[k][1]); if (d < bd) { bd = d; best = k; } }); return best; }
    var LX0 = 70, LX1 = 560;
    function onDown(e) {
      if (e.button != null && e.button !== 0) return; var p = pt(e), i, j;
      if (S.scene === 'wire') {
        for (i = S.cables.length - 1; i >= 0 && !drag; i--) for (j = 1; j >= 0; j--) { var ep = endPos(S.cables[i].ends[j]); if (Math.hypot(p.x - ep.x, p.y - ep.y) < 18) { drag = { type: 'plug', ci: i, ei: j, pt: p }; break; } }
      } else if (S.scene === 'pins') {
        ['A', 'B'].forEach(function (cab) { ['r', 'k'].forEach(function (col) { if (drag) return; var wp = wirePos(cab, col); if (Math.hypot(p.x - wp.x, p.y - wp.y) < 16) drag = { type: 'wire', cab: cab, col: col, pt: p }; }); });
      } else if (S.scene === 'cable') {
        if (p.y > 240 && p.y < 284 && p.x > LX0 - 20 && p.x < LX1 + 20) { drag = { type: 'len', pt: p }; S.len = clamp(Math.round((p.x - LX0) / (LX1 - LX0) * 60), 0, 60); }
      }
      if (!drag) return;
      e.preventDefault(); try { svgEl.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
      update();
    }
    function onMove(e) {
      if (!drag) return; var p = pt(e); drag.pt = { x: clamp(p.x, 8, VB[S.scene][0] - 8), y: clamp(p.y, 8, VB[S.scene][1] - 8) };
      if (drag.type === 'plug') { var en = S.cables[drag.ci].ends[drag.ei]; en.port = null; en.x = drag.pt.x; en.y = drag.pt.y; }
      else if (drag.type === 'wire') { S.wires[drag.cab][drag.col] = null; }
      else if (drag.type === 'len') S.len = clamp(Math.round((p.x - LX0) / (LX1 - LX0) * 60), 0, 60);
      update();   // 끄는 동안에는 그림만 바꾸고 과제는 확인하지 않음
    }
    function onUp() {
      if (!drag) return; var d = drag;
      if (d.type === 'plug') { var en = S.cables[d.ci].ends[d.ei], np = nearPort(d.pt, d.ci, d.ei); if (np) { en.port = np; } else { en.port = null; en.x = d.pt.x; en.y = d.pt.y; } }
      else if (d.type === 'wire') { S.wires[d.cab][d.col] = nearTerm(d.cab, d.pt, d.col); }
      drag = null; update(); check();   // 손을 놓은 뒤에만 판정
    }
    function onChange(e) { var tg = e.target;
      if (tg.name === 'simPsMode') S.mode = tg.value; else if (tg.name === 'simPsR') S.R = +tg.value; else if (tg.name === 'simPsG') S.gauge = +tg.value; else if (tg.name === 'simPsAmp') S.amp = tg.value; else if (tg.getAttribute('data-sim') === 'len') S.len = +tg.value; else return;
      update(); check(); }
    function onInput(e) { if (e.target.getAttribute('data-sim') === 'len') { S.len = +e.target.value; update(); } }   // 끄는 중: 그림만
    function onClick(e) {
      var sc = e.target.closest('[data-scene]'); if (sc) { S.scene = sc.getAttribute('data-scene'); drag = null; update(); return; }
      var b = e.target.closest('[data-act]'); if (!b) return; var k = b.getAttribute('data-act');
      if (k === 'resetWire') { S.cables = initCables(); S.mode = 'parallel'; }
      if (k === 'resetPins') S.wires = { A: { r: null, k: null }, B: { r: '1-', k: '1+' } };
      update();
    }
    svgEl.addEventListener('pointerdown', onDown); svgEl.addEventListener('pointermove', onMove); svgEl.addEventListener('pointerup', onUp); svgEl.addEventListener('pointercancel', onUp);
    el.addEventListener('change', onChange); el.addEventListener('input', onInput); el.addEventListener('click', onClick);
    update();

    return {
      destroy: function () { svgEl.removeEventListener('pointerdown', onDown); svgEl.removeEventListener('pointermove', onMove); svgEl.removeEventListener('pointerup', onUp); svgEl.removeEventListener('pointercancel', onUp);
        el.removeEventListener('change', onChange); el.removeEventListener('input', onInput); el.removeEventListener('click', onClick); el.innerHTML = ''; },
      state: function () { calc(); var w = R.w; return { scene: S.scene, mode: S.mode,
        cables: S.cables.map(function (c) { return c.ends.map(function (e) { return e.port; }); }), ch1: { n: w.ch1.n, load: w.ch1.load, ok: w.ch1.ok }, ch2: { n: w.ch2.n, load: w.ch2.load, ok: w.ch2.ok }, short: w.short, lineDanger: w.lineDanger,
        wires: JSON.parse(JSON.stringify(S.wires)), pinA: R.pa, pinB: R.pb, gauge: S.gauge, len: S.len, load: S.R, loss: R.c.loss, df: R.c.df, amp: S.amp, dragging: !!drag,
        ports: JSON.parse(JSON.stringify(PORTS)), terms: JSON.parse(JSON.stringify(TERM)), plugs: JSON.parse(JSON.stringify(PLUG)), viewBox: VB[S.scene],
        ready: true, done: Object.keys(S.done) }; },
      set: function (o) { o = o || {};
        if (o.scene && VB[o.scene]) S.scene = o.scene; if (o.mode && /^(parallel|series)$/.test(o.mode)) S.mode = o.mode;
        if (o.gauge != null && GAUGES.some(function (g) { return g.g === +o.gauge; })) S.gauge = +o.gauge; if (o.len != null) S.len = clamp(Math.round(+o.len), 0, 60);
        if (o.load === 4 || o.load === 8) S.R = o.load; if (o.amp && AMPS[o.amp]) S.amp = o.amp;
        update(); check(); return this.state(); }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.passiveRig = passiveRig;
})();

/* =========================================================================== 모듈 데이터 */
(function () {
  'use strict';
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['speaker-passive'] = {
    id: 'speaker-passive', path: 'hardware', no: 5, noLabel: '05-1', status: 'ready', level: '중급', minutes: 45, img: 'img/modules/hw_speaker.jpg',   // 3층 d&b 서브우퍼 · E8 · Vi10P
    title: '패시브 스피커', sub: '앰프의 힘을 받아 소리를 내는 스피커 — 3층 d&b Vi10P · Yi7P · Yi10P · E8',
    topics: ['패시브 크로스오버와 앰프 스피커 설정', '임피던스 · 병렬 · 직렬', '파워 정격과 앰프 고르기', '스피커 케이블 굵기 · 손실 · 댐핑', 'speakON 핀과 극성', '바이앰프와 보호'],
    glanceDraft: {
      glance: [
        ['패시브 스피커', '앰프가 없어서 파워앰프의 스피커 출력으로 소리를 내는 스피커 (3층 Vi10P · Yi7P · Yi10P · E8)'],
        ['임피던스 (Ω)', '앰프가 보는 스피커의 부하 — 8 Ω 두 대를 병렬(링크)로 이으면 4 Ω'],
        ['파워 정격', '스피커가 견디는 힘 — 연속 · 프로그램 · 피크 중 「연속」이 기준'],
        ['speakON', '앰프와 스피커를 잇는 잠금식 커넥터 — 풀레인지 패시브는 1+ / 1− 핀']
      ],
      heroVis: 'psSystem'
    },
    overview: {
      lead: '<b>패시브 스피커</b>는 안에 앰프가 없는 스피커예요. 그래서 혼자서는 소리를 내지 못해요. 콘솔에서 나온 작은 신호(라인 신호)를 <b>파워앰프</b>가 크게 키워 줘야 해요. 이렇게 키운 큰 신호를 스피커 레벨이라고 해요. 스피커 레벨은 스피커 케이블을 타고 스피커로 가요. 통 안의 <b>패시브 크로스오버</b>는 이 신호를 저음과 고음으로 나눠요. 그리고 각 드라이버(소리를 내는 부품)에 보내요. 3층 본당의 d&b <b>Vi10P · Yi7P · Yi10P · E8</b> 은 모두 패시브 스피커예요. Vi10P 는 메인 L/R, Yi7P · Yi10P 는 딜레이 스피커예요. 방송실의 d&b <b>40D · 10D</b> 앰프가 이 스피커들에 힘을 줘요. 이 과정에서는 네 가지를 배워요. 첫째, 스피커를 몇 대, 어떻게 이을지(<b>임피던스</b>) 배워요. 둘째, 어떤 앰프를 고를지(<b>파워 정격</b>) 배워요. 셋째, 어떤 케이블을 쓸지(<b>굵기 · 길이</b>) 배워요. 넷째, <b>speakON 핀 · 극성 · 보호</b>를 배워요. 액티브 스피커와의 차이 · 커버리지 · 배치는 05-2 에서 다뤄요.',
      terms: [
        ['패시브 스피커', '안에 앰프가 없는 스피커예요. 파워앰프의 스피커 출력을 받아야 소리가 나요. 전원 케이블을 꽂는 곳이 없어요. 예: d&b Vi10P · Yi7P, EV ZX1'],
        ['패시브 크로스오버', '스피커 통 안에 있는 코일 · 콘덴서 같은 부품이에요. 앰프에서 받은 큰 신호를 나눠요. 저음은 우퍼로, 고음은 고음 드라이버로 보내요.'],
        ['스피커 설정 (d&b setup)', 'd&b 앰프 안에 들어 있는 스피커별 맞춤 설정이에요. 앰프에서 스피커 이름(예: Vi10P)을 골라야 해요. 그래야 그 스피커에 맞는 음색과 보호가 들어가요.'],
        ['공칭 임피던스 · 부하', '임피던스는 스피커가 전기(전류)를 얼마나 막는지 나타내요. 단위는 Ω(옴)이고, 「공칭」은 대표값이라는 뜻이에요. 앰프 한 채널에 이어진 스피커 전체를 그 채널의 「부하(짊어진 짐)」라고 해요. Vi10P · Yi7P 는 8 Ω 이에요.'],
        ['병렬 · 직렬', '병렬은 나란히 잇기예요. 스피커 두 대의 +끼리, −끼리 이어요(링크 케이블). 그러면 Ω 이 줄어요(8 Ω 2대 → 4 Ω). 직렬은 줄줄이 잇기라 Ω 이 더해져요(→ 16 Ω).'],
        ['파워 정격 (연속 · 프로그램 · 피크)', '스피커가 견딜 수 있는 힘(W, 와트)이에요. 연속(AES · RMS)은 오래 견디는 기준값이에요. 프로그램은 보통 연속의 2배예요. 피크는 아주 짧은 순간만 견디는 값이에요.'],
        ['케이블 손실 · 댐핑 팩터', '손실은 케이블 저항 때문에 줄어드는 힘(dB)이에요. 댐핑 팩터는 앰프가 스피커 콘의 움직임을 꽉 붙잡는 정도예요. 케이블이 길고 가늘수록 손실은 커지고 댐핑 팩터는 작아져요.'],
        ['speakON (NL4 · NL2)', '앰프와 스피커를 잇는, 돌려서 잠그는 커넥터예요. NL4 는 1+ · 1− · 2+ · 2− 네 핀, NL2 는 1+ · 1− 두 핀이에요. 풀레인지(저음부터 고음까지 한 통에서 내는) 패시브 스피커는 1+ / 1− 로 소리를 받아요.']
      ],
      points: [
        '8 Ω 스피커 2대를 링크로 이으면 앰프는 <b>4 Ω</b> 을 봐요. 먼저 앰프 채널이 견디는 Ω(정격)을 확인해요. 제조사의 「채널당 대수」(Vi10P 는 <b>채널당 2대</b>)도 확인해요.',
        '케이블은 갔다가 돌아오는 <b>왕복 길이</b>로 계산해요. 손실 <b>0.5 dB 이내</b> · 댐핑 팩터 <b>20 이상</b>이 되게 굵기를 골라요.',
        '<b>작은 앰프가 안전한 게 아니에요.</b> 소리가 잘리는 클리핑은 고음 드라이버를 더 위험하게 해요. 그리고 앰프의 스피커 출력은 꼭 패시브 스피커에만 꽂아요. 라인 입력에 꽂으면 장비가 망가질 수 있어요.'
      ],
      model: 'dbspk'   // 2026-11-04: 3층 d&b 스피커 3D
    },
    theory: [
      { title: '패시브 스피커와 파워앰프 — 힘은 바깥에서', visual: 'psSystem',
        body: '패시브 스피커에는 앰프가 없어요. 콘솔의 라인 신호는 1 V 안팎으로 작아요. <b>파워앰프</b>가 이 신호를 수십 V 의 <b>스피커 레벨</b>로 키워요. 그 신호를 스피커 케이블로 보내야 소리가 나요. 통 안에는 <b>패시브 크로스오버</b>가 있어요. 앰프에서 받은 큰 신호를 음역(대역)별로 나눠 각 드라이버로 보내요. 3층 메인 <b>Vi10P</b> 는 <b>3웨이 패시브</b> 스피커예요. 우퍼 2개(10인치), 중음 1개(8인치), 고음 컴프레션 드라이버 1개(1.4인치)가 들어 있어요. 이 셋을 패시브 크로스오버로 나눠요. d&b 는 패시브 스피커를 <b>d&b 앰프와 한 세트</b>로 설계해요. 앰프 안에 스피커마다 맞춘 <b>스피커 설정</b>이 있어요. 앰프에서 그 스피커 이름을 골라야 음색과 보호가 맞춰져요.',
        more: '<ul><li><b>d&b Vi10P (제조사 자료)</b>: 3웨이 패시브 스피커예요. 제품 페이지의 설치용 앰프는 <b>40D</b> 예요.</li> <li>Vi10P 구성: 2 × 10" + 8" + 1.4" 컴프레션 드라이버, 패시브 크로스오버, 8 Ω.</li> <li>Vi10P 정격과 퍼짐: 500 W RMS / 2000 W 피크(10 ms), 110° × 40°, 59 Hz–18 kHz(−5 dB).</li> <li><b>d&b Yi7P · Yi10P (제조사 자료)</b>: Y7P · Y10P 의 설치용 버전이에요. 소리 사양은 같고, 앰프 셋업도 Y7P · Y10P 를 골라요.</li> <li>Yi7P · Yi10P 사양: 2웨이 패시브, 2 × 8" + 1.4", 8 Ω, 400 W RMS / 1600 W 피크.</li> <li>소리가 퍼지는 각도는 Yi7P 75° × 40°, Yi10P 110° × 40° 예요. Y7P 제품 페이지에는 10D · 40D 가 사용 가능 앰프로 나와요.</li> <li><b>d&b E8 (제조사 자료)</b>: 패시브, 150 W RMS / 800 W 피크, 90° × 50°(혼을 돌리면 50° × 90°).</li> <li><b>왜 Vi10P 는 40D 일까요</b>: 10D 는 V-Series 설정을 지원하지 않아요(제조사 페이지). 3층에서 메인(Vi10P)을 40D 에 연결한 것도 이와 맞아요.</li> <li><b>d&b 설명서</b>: 「올바르게 설정된 d&b 앰프로만 d&b 스피커를 쓰세요. 그렇지 않으면 스피커 부품이 망가질 위험이 있어요.」</li> <li>앰프 설정은 담당자만 바꿔요. 스피커 설정 · EQ · 딜레이는 04-2 「디지털 앰프」에서 자세히 배워요.</li> <li>확성 실습 ③ 의 <b>EV ZX1</b> 도 패시브(8 Ω)예요. Crown XLi1500 처럼 DSP 가 없는 앰프도 있어요. 이때는 통 안의 패시브 크로스오버만으로 소리를 나눠요.</li></ul>',
        check: { q: '3층 Vi10P 를 40D 로 쓸 때, 「Vi10P 에 맞는 스피커 설정」을 꼭 골라야 하는 이유는?', options: [
          { t: '앰프 안의 스피커 설정이 그 스피커에 맞춘 음색과 보호를 넣어 주기 때문이에요', ok: true, why: '맞아요. d&b 는 스피커와 앰프 설정을 한 세트로 만들어요. 잘못된 설정은 스피커를 망가뜨릴 수 있어요.' },
          { t: '설정을 고르지 않으면 앰프 전원이 켜지지 않기 때문이에요', why: '아니에요. 전원과는 상관없어요. 설정은 음색과 스피커 보호를 정해요.' },
          { t: 'Vi10P 안에도 앰프가 있어서 두 앰프를 맞춰야 하기 때문이에요', why: '아니에요. Vi10P 는 패시브 스피커라 안에 앰프가 없어요.' }] } },
      { title: '임피던스와 연결 — 병렬 · 직렬과 부하', visual: 'psLoad',
        body: '스피커마다 <b>공칭 임피던스</b>가 있어요. 스피커가 전기를 얼마나 막는지 나타내는 대표값이고, 단위는 Ω(옴)이에요. 물 호스로 치면 호스가 얼마나 좁은지와 비슷해요. Vi10P · Yi7P · Yi10P 는 <b>8 Ω</b> 이에요. 앰프 한 채널에 여러 대를 이으면, 앰프가 짊어지는 짐(<b>부하</b>)이 바뀌어요. 스피커 뒷면의 speakON 두 개는 안에서 <b>병렬</b>(나란히)로 이어져 있어요. 그래서 링크 단자로 다음 스피커를 이으면 병렬 연결이 돼요. 병렬로 이으면 Ω 이 <b>줄어요</b>. 8 Ω 2대는 4 Ω 이에요. 호스를 하나 더 나란히 달면 물이 더 잘 흐르는 것과 같아요. 직렬(줄줄이)로 이으면 Ω 이 <b>더해져요</b>. 8 Ω 2대는 16 Ω 이에요. 부하가 앰프 채널이 견디는 값(정격)보다 낮아지면 위험해요. 앰프가 뜨거워지거나, 앰프가 스스로를 지키려고 소리를 끊을 수 있어요.',
        more: '<ul><li><b>같은 스피커 n대 병렬</b> = R ÷ n 이에요. 8 Ω 2대 = 4 Ω, 3대 ≈ 2.7 Ω, 4대 = 2 Ω.</li> <li><b>직렬</b>은 더하기예요(8 + 8 = 16 Ω).</li> <li><b>d&b Vi10P 설명서</b>: 두 NL4 단자의 네 핀은 모두 병렬로 이어져 있어요.</li> <li>Vi10P 제품 페이지에는 「채널당 2대」로 나와요. 8 Ω 2대 병렬이면 4 Ω 이에요.</li> <li><b>8 Ω 이 아닌 스피커도 있어요</b>: d&b E8 의 현재 제품 페이지는 12 Ω 이에요. 예전 E8 설명서에는 16 Ω 으로 적혀 있어요.</li> <li>그래서 계산하기 전에 설치된 제품의 라벨 · 설명서를 꼭 확인해요.</li> <li><b>직렬의 단점</b>: 특수 배선이 필요하고, 한 대가 끊기면 둘 다 꺼져요.</li> <li>같은 앰프 전압이면 16 Ω 은 4 Ω 보다 전력이 ¼ 이에요(P = V² ÷ R). 이 과정에서는 계산 비교용으로만 다뤄요.</li> <li>앰프 쪽 정격과 낮은 부하의 위험은 04-1 「아날로그 앰프」에서 자세히 배웠어요.</li></ul>',
        check: { q: 'Yi7P(8 Ω) 2대를 링크 케이블로 이어 앰프 한 채널에 연결했어요. 앰프가 보는 부하는?', options: [
          { t: '4 Ω', ok: true, why: '맞아요. 링크 단자는 안에서 병렬이라 8 ÷ 2 = 4 Ω 이에요.' },
          { t: '16 Ω', why: '아니에요. 16 Ω 은 직렬로 따로 배선했을 때예요. 링크 케이블은 병렬이에요.' },
          { t: '8 Ω 그대로', why: '아니에요. 스피커를 병렬로 더 달면 부하(Ω)는 낮아져요.' }] } },
      { title: '파워 정격 읽기와 앰프 고르기(매칭)', visual: 'psPower',
        body: '스피커 사양표에는 W(와트, 힘) 숫자가 여러 개 있어요. <b>연속(RMS · AES)</b>은 오래 견디는 힘이에요. 가장 중요한 기준이에요. AES 방식은 정해진 음역의 핑크 노이즈(쉬익 하는 시험 소리)를 <b>2시간</b> 넣어서 재요. 이 시험 소리의 크레스트 팩터(가장 큰 순간과 평균의 차이)는 6 dB 예요. 그래도 성능이 영구히 바뀌지 않는 가장 큰 힘이 연속 정격이에요. <b>프로그램</b>은 음악처럼 오르내리는 신호를 생각한 값이에요. 보통 연속의 <b>2배(+3 dB)</b>로 적어요. <b>피크</b>는 아주 짧은 순간만 견디는 값이에요. d&b 는 피크를 10 ms(1000분의 10초)로 재요. 짐으로 치면 연속은 오래 들고 있을 수 있는 무게, 피크는 잠깐 번쩍 드는 무게예요. 예를 들어 EV ZX1 은 200 W 연속 · 400 W 프로그램 · 800 W 피크예요. 앰프와 비교할 때는 같은 Ω 에서의 정격끼리 비교해요. 이 과정에서는 <b>연속 정격 ~ 2배(프로그램)</b> 사이의 앰프를 교육용 기준으로 써요.',
        more: '<ul><li><b>B&C Speakers</b>: 「연속 프로그램 정격」은 보통 AES 정격의 2배로 적어요. 클리핑 없이 쓸 때 권하는 앰프 출력이라고 안내해요.</li> <li>B&C 는 앰프를 자주 한계까지 몰아 클리핑시킨다면, 앰프 정격이 스피커 AES 정격보다 낮아야 한다고도 해요.</li> <li><b>EAW</b>: 앰프가 작다고 안전한 게 아니에요. 작은 앰프는 쉽게 클리핑돼요.</li> <li>클리핑되면 더 낮은 음량에서도 열 때문에 고장이 날 수 있어요. 그래서 EAW 는 클리핑이 안 생길 만큼 큰 앰프를 고르라고 해요.</li> <li>정격은 회사마다 재는 신호 · 시간 · 기준이 달라요. 「800 W 피크」끼리 비교해도 같은 뜻이 아닐 수 있어요.</li> <li><b>3층 d&b 의 경우</b>: Vi10P 는 500 W RMS 예요. 그런데 40D 는 채널당 2000 W/8 Ω 이에요(제조사 자료).</li> <li>d&b 시스템에서는 이 계산 대신 <b>앰프에서 그 스피커의 설정을 고르는 것</b>이 보호의 핵심이에요. 스피커 설명서도 「올바르게 설정된 d&b 앰프로만 쓰라」고 해요.</li> <li>d&b 앰프의 <b>LINEAR</b> 설정은 앰프를 일반 파워앰프처럼 쓰는 설정이에요(제조사 설명서). d&b 스피커에는 그 스피커 이름의 설정을 골라요.</li></ul>',
        check: { q: 'EV ZX1(8 Ω · 연속 200 W · 프로그램 400 W)에 이 과정의 기준으로 알맞은 앰프 채널은?', options: [
          { t: '8 Ω 에서 330 W 인 채널', ok: true, why: '맞아요. 연속 정격 ~ 2배 사이라 여유가 있어요. 클리핑 없이 쓰기 쉬워요.' },
          { t: '8 Ω 에서 100 W 인 채널 — 작을수록 안전하니까', why: '아니에요. 작은 앰프는 쉽게 클리핑돼요. 찌그러진 신호는 고음 드라이버에 더 위험해요.' },
          { t: '8 Ω 에서 900 W 인 브리지 채널', why: '아니에요. 연속 정격의 4.5배예요. 실수 한 번에 스피커가 견디는 힘을 크게 넘을 수 있어요.' }] } },
      { title: '스피커 케이블 — 굵기 · 길이 · 손실 · 댐핑', visual: 'psCable',
        body: '스피커 케이블에도 작은 저항(전기를 막는 힘)이 있어요. 길고 가는 호스로는 물이 약하게 나오는 것과 같아요. 전류는 + 선으로 갔다가 − 선으로 돌아와요. 그래서 <b>왕복 길이(2 × 길이)</b>로 계산해요. 계산 순서는 세 단계예요. ① <b>왕복 저항</b>은 2 × 길이(m) × 1 m 당 저항(Ω)으로 구해요. ② <b>손실(dB)</b>은 20 × log(스피커 Ω ÷ (스피커 Ω + 왕복 저항))으로 구해요. log 는 계산기의 log 버튼으로 계산해요. ③ <b>댐핑 팩터</b>는 스피커 Ω ÷ 왕복 저항으로 대략 구해요. 흔히 손실은 <b>0.5 dB 이내</b>면 충분하다고 봐요. 0.5 dB 는 귀로는 거의 모를 만큼 작은 차이예요. 라이브 음향의 댐핑 팩터는 <b>20 이상</b>이면 충분하다고 봐요. 부하 Ω 이 낮을수록 케이블의 영향이 커져요. 병렬로 여러 대를 달 때가 그래요. 그때는 더 굵은 케이블이 필요해요.',
        more: '<ul><li><b>구리선 1 m 당 저항(표 값)</b>: 18 AWG 약 20.9 mΩ · 16 AWG 약 13.2 mΩ · 14 AWG 약 8.3 mΩ · 12 AWG 약 5.2 mΩ · 10 AWG 약 3.3 mΩ.</li> <li>mΩ(밀리옴)은 1000분의 1 Ω 이에요.</li> <li><b>AWG</b> 는 미국식 굵기 번호예요. 숫자가 <b>작을수록 굵어요</b>(12 AWG ≈ 3.3 mm², 14 AWG ≈ 2.1 mm²).</li> <li>국내에서는 굵기를 mm²(SQ)로 적는 경우가 많아요.</li> <li><b>예(근사)</b>: 8 Ω 한 대, 30 m, 12 AWG → 왕복 저항 ≈ 0.31 Ω, 손실 ≈ −0.33 dB, 댐핑 팩터 ≈ 26.</li> <li>같은 길이에 14 AWG 면 손실 ≈ −0.52 dB 로 목표를 조금 넘어요.</li> <li><b>4 Ω(두 대 병렬)</b>, 30 m, 14 AWG → 손실 ≈ −1.0 dB. 부하가 낮으면 같은 케이블에서도 손실이 커져요.</li> <li><b>EAW</b>: 케이블이 15 m(50 ft)를 넘으면, 댐핑은 앰프보다 케이블 저항이 주로 정해요.</li> <li>그래서 EAW 는 손실보다 댐핑 팩터를 먼저 보고 케이블을 고르라고 해요.</li> <li><b>d&b 40D 의 LoadMatch</b>: 앰프가 케이블의 전기적 성질을 바로잡아 줘요. 최대 70 m 케이블에서도 음색 균형을 지켜 줘요(제조사 자료 · 04-2 「디지털 앰프」 심화).</li> <li>그래도 케이블 굵기를 고르는 기본은 같아요.</li> <li>이 계산은 공칭 임피던스로 한 <b>근사</b>예요. 앰프 출력 임피던스와 온도 변화는 뺐어요.</li></ul>',
        check: { q: '같은 30 m 케이블에 스피커를 1대(8 Ω)에서 2대 병렬(4 Ω)로 늘렸어요. 케이블 손실은 어떻게 될까요?', options: [
          { t: '커져요 — 부하 Ω 이 낮아져 케이블 저항의 몫이 커지기 때문이에요', ok: true, why: '맞아요. 손실 = 20·log(R ÷ (R + 케이블)) 에서 R 이 작아지면 손실이 커져요.' },
          { t: '작아져요 — 스피커가 늘어 힘이 나뉘기 때문이에요', why: '아니에요. 반대예요. 부하가 낮으면 같은 케이블의 영향이 더 커져요.' },
          { t: '케이블 길이가 같으니 그대로예요', why: '아니에요. 케이블 저항은 같아도 부하와의 비율이 바뀌어서 손실이 달라져요.' }] } },
      { title: 'speakON 핀 · NL2 와 NL4 · 극성', visual: 'psSpeakon',
        body: '<b>speakON</b> 은 꽂은 뒤 돌려서 잠그는 스피커 커넥터예요. <b>NL4</b> 에는 <b>1+ · 1− · 2+ · 2−</b> 네 핀이 있어요. <b>NL2</b> 에는 <b>1+ · 1−</b> 두 핀이 있어요. NL2 플러그는 NL4 소켓에 꽂히고, 1+ / 1− 에 이어져요. 하지만 NL4 플러그는 NL2 소켓에 맞지 않아요. Vi10P · Yi7P 같은 풀레인지 패시브 스피커는 <b>1+ / 1−</b> 로 소리를 받아요. d&b 설명서에서 2+ / 2− 는 <b>액티브 서브우퍼용</b>으로 정해져 있어요. 케이블을 만들 때는 앰프 + → 1+, 앰프 − → 1− 로 이어요. +와 −가 바뀌면 <b>극성</b>이 반대가 돼요. 한 스피커 콘이 앞으로 밀 때, 다른 스피커 콘은 뒤로 당기게 되는 거예요. 한 사람은 밀고 한 사람은 당기면 수레가 잘 안 움직이는 것과 같아요. 그래서 같은 구역을 덮는 스피커끼리 저음이 서로 지워져요. 이것을 상쇄라고 해요.',
        more: '<ul><li><b>Neutrik (제조사 자료)</b>: 2핀 케이블 커넥터(NL2FX)는 4핀 섀시 커넥터와 맞물려요. 그래서 +1 / −1 에 닿아요.</li> <li>반대로 2핀 섀시 커넥터(장비에 붙은 소켓)는 4핀 케이블 커넥터와 맞지 않아요.</li> <li>「+」는 같은 극(높은 쪽), 「−」는 반대 극이에요.</li> <li><b>앰프 쪽 핀도 확인해요</b>: Crown XLi1500 은 CH1 단자의 2± 핀에 CH2 가 나와요. 04-1 「아날로그 앰프」에서 배웠어요.</li> <li>그래서 1± 만 쓰는 스피커에는 CH1 만 들어가요.</li> <li><b>극성 확인</b>: 극성 검사기나 측정 프로그램으로 확인해요.</li> <li>ProSoundWeb 에 따르면, 건전지를 대어 콘이 나오는지 보는 방법은 우퍼에만 통해요. 고음 드라이버는 진동판이 아주 조금만 움직여서 이 방법으로 알 수 없어요.</li> <li>선 색깔 표시도 늘 믿을 수는 없어요.</li> <li>극성이 반대일 때 소리가 지워지는 모습은 05-2 「액티브 스피커」 실습 ③ 에서 볼 수 있어요.</li> <li>케이블 양 끝에는 같은 번호표를 붙여요. 새로 만든 케이블은 쓰기 전에 꼭 점검해요.</li></ul>',
        check: { q: '풀레인지 패시브 스피커용 NL4 케이블을 새로 만들어요. 앰프의 + 선과 − 선은 어느 핀에 이을까요?', options: [
          { t: '+ → 1+, − → 1−', ok: true, why: '맞아요. Vi10P · Yi7P 같은 풀레인지 패시브 스피커는 1+ / 1− 로 소리를 받아요.' },
          { t: '+ → 2+, − → 2−', why: '아니에요. 이 스피커들은 2± 를 쓰지 않아서 소리가 나지 않아요. d&b 는 2± 를 액티브 서브우퍼용으로 정해 두었어요.' },
          { t: '+ → 1−, − → 1+', why: '아니에요. 소리는 나지만 극성이 반대가 돼요. 다른 스피커와 겹치는 곳에서 저음이 지워져요(상쇄).' }] } },
      { title: '바이앰프와 보호 — 고음 드라이버가 타는 이유', visual: 'psProtect',
        body: '어떤 스피커는 <b>패시브 모드</b>와 <b>바이앰프 모드</b>를 바꿀 수 있어요. 바이앰프는 저음과 고음에 앰프를 하나씩 따로 쓰는 방식이에요. 예를 들어 QSC AcousticPerformance 스피커는 기본이 패시브 모드예요. 바이앰프 모드에서는 저음을 <b>1±</b>, 고음을 <b>2±</b> 로 따로 받아요. 이때는 통 안의 크로스오버를 쓰지 않아요. 그래서 앰프 앞의 DSP 에서 저음과 고음을 <b>꼭 나눠서</b> 보내야 해요. 고음 드라이버에 저음이 들어가면 망가질 수 있기 때문이에요. 고음 드라이버를 망가뜨리는 대표적인 원인은 <b>클리핑</b>이에요. 클리핑은 앰프 힘이 모자라 소리 파형의 위아래가 잘리는 거예요. 파형이 잘리면 평균 힘이 올라가요. 원래 없던 고음 성분도 새로 생겨요. 그래서 고음 드라이버가 뜨거워질(과열) 수 있어요. 너무 작은 앰프를 끝까지 올려 쓰는 것이 오히려 위험한 이유예요.',
        more: '<ul><li><b>QSC AP 시리즈 (제조사 자료)</b>: 바이앰프가 되는 모델은 저음 1± · 고음 2± 로 받아요.</li> <li>패시브 풀레인지로 쓸 때는 패시브 모드로 두고 1± 를 써요. 2± 는 다음 장비로 그대로 넘겨요.</li> <li><b>d&b 40D</b>: 출력 방식을 세 가지 중에서 골라요. Dual Channel · Mix TOP/SUB · 2-Way Active 예요.</li> <li>40D 에는 출력 보호 장치도 있어요(제조사 자료). 과전류 · DC · 고음 전압 리미터 · 켜고 끌 때 잡음 억제예요.</li> <li><b>EAW</b>: 클리핑은 신호의 평균 힘(RMS)을 올려 열을 늘려요. 고음도 더해서 스피커를 열 고장 쪽으로 몰아요.</li> <li>저음이 스피커가 감당할 수 있는 것보다 많으면, 콘이 한계를 넘어 움직여서 기계적으로 고장 날 수도 있어요.</li> <li><b>스피커 출력은 스피커에만</b>: 앰프 출력에는 수십 V 가 나와요. 콘솔이나 액티브 스피커(ZXA1)의 입력에 꽂으면 장비가 망가질 수 있어요.</li> <li><b>켜고 끄는 순서</b>: 콘솔을 먼저 켜고 앰프는 마지막에 켜요. 끌 때는 앰프를 먼저 꺼요.</li> <li>케이블은 앰프를 끄거나 음량을 내린 상태에서 꽂고 빼요.</li></ul>',
        check: { q: '찬양 중 작은 앰프를 끝까지 올려서 CLIP 표시등이 계속 켜져 있어요. 고음 드라이버에 어떤 일이 생길 수 있을까요?', options: [
          { t: '잘린 파형 때문에 평균 힘과 고음 성분이 늘어 뜨거워질(과열) 수 있어요', ok: true, why: '맞아요. 앰프 음량을 줄여요. 그 음량이 꼭 필요하면 알맞은 크기의 앰프 · 스피커를 써요.' },
          { t: '앰프가 작아서 스피커에는 아무 문제가 없어요', why: '아니에요. 작은 앰프도 클리핑되면 스피커, 특히 고음 드라이버에 무리를 줘요.' },
          { t: '저음만 줄어들고 고음은 오히려 보호돼요', why: '아니에요. 클리핑은 원래 없던 고음 성분을 더해요. 고음 드라이버가 더 위험해져요.' }] } }
    ],
    practice: {
      kind: 'passiveRig',
      lead: '네 장면에서 패시브 스피커를 직접 연결해 봐요. ① 케이블 끝을 끌어 앰프 한 채널에 스피커 두 대를 이어요. 잘못 꽂힌 케이블도 찾아서 빼요. ② speakON 플러그 뒤쪽 단자에 빨강(+) · 검정(−) 선을 놓아요. 핀과 극성을 맞춰요. ③ 케이블 길이와 굵기를 바꿔 봐요. 손실과 댐핑 팩터가 어떻게 바뀌는지 봐요. ④ 스피커 정격에 맞는 앰프를 골라요.',
      note: 'Vi10P · Yi7P(8 Ω, 1+/1−)와 EV ZX1 정격(200/400/800 W)은 제조사 자료예요. Crown XLi1500 정격(330 W/8 Ω, 브리지 900 W/8 Ω)과 구리선 저항도 제조사 자료예요. 실습 앰프(4 Ω 이상)와 100 W 앰프는 예시예요. 손실 · 댐핑 팩터는 공칭 임피던스로 계산한 교육용 근사예요(앰프 출력 임피던스 · 온도 제외). 「연속 ~ 2배」 앰프 기준도 교육용 기준이에요. 낮은 부하나 잘못된 연결은 꼭 이 실습 화면에서만 해 봐요. 실제 장비로는 시험하지 마세요.',
      tasks: [
        { id: 'load', title: '두 대를 한 채널에 — 안전한 부하', text: '① 장면에서 케이블 끝을 끌어서 이어요. 앰프 CH OUT → 스피커 A IN, 스피커 A LINK → 스피커 B IN 이에요. 그러면 한 채널에 두 대가 연결돼요. 부하는 앰프 정격(4 Ω 이상) 안이어야 해요. 병렬과 직렬의 Ω 도 비교해 봐요.' },
        { id: 'lineIn', title: '잘못 꽂힌 케이블 빼기', text: '① 장면에서 앰프 스피커 출력이 액티브 스피커 ZXA1 의 LINE IN 에 꽂혀 있어요. 그 끝을 끌어서 빼요. 앰프 출력은 패시브 스피커에만 이어지게 해요.' },
        { id: 'pins', title: 'speakON 1+ / 1− 배선', text: '② 장면의 케이블 A 에서 빨강(+) 선을 1+ 단자에 끌어 놓아요. 검정(−) 선은 1− 단자에 놓아요.' },
        { id: 'polarity', title: '극성 반대 고치기', text: '② 장면의 케이블 B 는 소리는 나는데 저음이 이상해요. 무엇이 바뀌었는지 찾아요. 그리고 극성을 정상으로 고쳐요.' },
        { id: 'cable', title: '30 m 케이블 굵기 고르기', text: '③ 장면에서 부하 8 Ω, 길이 30 m 이상으로 맞춰요. 손실 0.5 dB 이내 · 댐핑 팩터 20 이상이 되는 굵기를 골라요.' },
        { id: 'match', title: '정격에 맞는 앰프 고르기', text: '④ 장면에서 EV ZX1(연속 200 W · 프로그램 400 W)에 맞는 앰프를 골라요. 기준은 8 Ω 에서 연속 정격 ~ 2배 사이예요.' }
      ],
      links: [
        { title: '3층 음향 시스템', text: '본당의 Vi10P · Yi7P · Yi10P · E8 과 40D · 10D 의 위치와 배선을 3D 로 보고 직접 이어 봐요.', go: { tab: 'tab2' } },
        { title: '확성 시스템의 기본 · 3D 실습 ③', text: 'Crown XLi1500 의 speakON 출력에 패시브 ZX1 을 연결해 소리를 내 봐요.', go: { tab: 'tab1', card: 's3' } }
      ]
    },
    quiz: [
      { q: '정격이 「4 Ω 이상」인 앰프 채널에 8 Ω 스피커 3대를 링크로 모두 이었어요. 어떻게 될까요?', options: [
        { t: '약 2.7 Ω 이 되어 정격보다 낮아요. 위험해요', ok: true, why: '맞아요. 8 ÷ 3 ≈ 2.7 Ω 이에요. 다른 채널로 나누거나, 제조사가 허용하는 대수만 이어요.' },
        { t: '24 Ω 이 되어 소리가 작아져요', why: '아니에요. 24 Ω 은 3대를 직렬로 이었을 때예요. 링크 케이블은 병렬이에요.' },
        { t: '스피커가 많을수록 앰프가 덜 힘들어요', why: '아니에요. 병렬로 더 달면 Ω 이 낮아져서 앰프가 더 힘들게 일해요.' }] },
      { q: '스피커 정격이 「200 W 연속 / 400 W 프로그램 / 800 W 피크」예요. 「800 W 피크」는 무슨 뜻일까요?', options: [
        { t: '아주 짧은 순간만 견디는 값이에요. 앰프를 800 W 로 고르라는 뜻이 아니에요', ok: true, why: '맞아요. 앰프를 고를 때는 연속 정격을 기준으로 봐요.' },
        { t: '이 스피커에 늘 800 W 를 넣어도 돼요', why: '아니에요. 늘 넣을 수 있는 힘은 연속 정격(200 W)이에요.' },
        { t: '스피커가 낼 수 있는 가장 큰 소리(dB)예요', why: '아니에요. W 는 스피커가 받는 전기의 힘이에요. 가장 큰 소리는 따로 dB SPL 로 적어요.' }] },
      { q: '앰프에서 스피커까지 40 m 를 가야 해서 손실이 커요. 알맞은 방법은?', options: [
        { t: '더 굵은 케이블(AWG 숫자가 작은 것)을 쓰거나, 앰프를 스피커 가까이 둬요', ok: true, why: '맞아요. 왕복 저항을 줄이면 손실이 줄고 댐핑 팩터가 커져요.' },
        { t: '스피커를 병렬로 한 대 더 달아요', why: '아니에요. 부하 Ω 이 낮아져서 같은 케이블에서 손실이 더 커져요.' },
        { t: 'AWG 숫자가 더 큰 케이블로 바꿔요', why: '아니에요. AWG 숫자가 클수록 가늘어서 손실이 더 커져요.' }] },
      { q: 'NL2 플러그 케이블을 앰프의 NL4 소켓에 꽂으면 어떻게 될까요?', options: [
        { t: '꽂히고, 1+ / 1− 에 연결돼요', ok: true, why: '맞아요. NL2 플러그는 NL4 소켓과 맞물려 1± 에 닿아요(Neutrik). 반대로 NL4 플러그는 NL2 소켓에 맞지 않아요.' },
        { t: '2+ / 2− 에 연결돼요', why: '아니에요. NL2 는 1+ / 1− 두 핀뿐이라 1± 에 이어져요.' },
        { t: '모양이 달라 꽂을 수 없어요', why: '아니에요. NL2 플러그는 NL4 소켓에 꽂혀요. 맞지 않는 것은 NL4 플러그 → NL2 소켓이에요.' }] },
      { q: '앰프의 스피커 출력 케이블을 액티브 스피커 ZXA1 의 LINE IN 에 꽂으면?', options: [
        { t: '수십 V 의 스피커 레벨이 라인 입력에 들어가 장비가 망가질 수 있어요', ok: true, why: '맞아요. 앰프 스피커 출력은 패시브 스피커에만 연결해요.' },
        { t: '소리가 조금 커질 뿐 문제없어요', why: '아니에요. 라인 입력은 1 V 안팎의 신호용이에요. 스피커 레벨은 너무 커요.' },
        { t: 'ZXA1 이 저절로 패시브 스피커처럼 동작해요', why: '아니에요. 액티브 스피커는 라인 신호를 받아 안의 앰프로 키워요. 스피커 레벨을 받는 입력이 없어요.' }] }
    ],
    missions: [
      { title: '음향 트러블슈팅 · 미션 C', text: '패시브 스피커(ZX1)에서 소리가 안 날 때를 연습해요. 앰프 전원 → LEVEL → speakON 연결을 차례로 확인해요.', go: { tab: 'tab7', ts: 'C' } },
      { title: '3층 음향 시스템 · 배선', text: '40D · 10D 앰프의 채널이 어느 스피커로 가는지 따라가요. Vi10P · Yi7P · Yi10P · E8 을 찾아봐요. 그리고 직접 배선해 봐요.', go: { tab: 'tab2' } }
    ],
    deeper: [
      { title: 'speakON 커넥터와 케이블 굵기', text: '굵은 케이블을 골랐다면, 커넥터에 들어가는지도 확인해야 해요. speakON 케이블 커넥터마다 물릴 수 있는 선 굵기가 정해져 있어요. 케이블 바깥 지름도 정해져 있어요.', more: '<ul><li><b>Neutrik NL4FXX-W-L (제조사 자료)</b>: 4핀, 선 굵기 1.5–4 mm²(17–11 AWG), 케이블 바깥 지름 10–16 mm, 최대 37 A rms.</li> <li><b>Neutrik NL2FX (판매처 사양)</b>: 2핀, 선 굵기 16–12 AWG, 접점당 40 A rms 연속.</li> <li>A(암페어)는 흐르는 전류의 양이에요.</li> <li>그래서 10 AWG(약 5.3 mm²) 케이블은 이런 일반 커넥터에 바로 물리지 않을 수 있어요.</li> <li>아주 긴 거리라면 앰프를 스피커 가까이 두는 방법도 함께 생각해요.</li> <li>4심 케이블을 1± 만 쓰는 스피커에 쓸 때도, 2± 선을 끊지 말고 같은 번호로 이어 둬요.</li> <li>그러면 나중에 서브우퍼(2±)를 함께 보낼 때 그대로 쓸 수 있어요.</li> <li>새 케이블은 쓰기 전에 케이블 테스터로 확인해요. 1+ · 1− · 2+ · 2− 가 양 끝에서 같은 번호로 이어졌는지 봐요.</li> <li>선끼리 붙지(단락) 않았는지도 확인해요.</li></ul>' },
      { title: '공칭 임피던스와 DC 저항 — 계산이 「근사」인 이유', text: '스피커의 「8 Ω」은 대표값(공칭 임피던스)이에요. 실제 임피던스는 주파수(소리 높낮이)마다 오르내려요. 전선 코일의 직류 저항(DC 저항)은 공칭값보다 낮아요. 그래서 이 과정의 손실 · 댐핑 팩터 계산은 「대략 이 정도」를 아는 데 써요.', more: '<ul><li><b>EAW</b>: 댐핑 팩터는 원래 보이스코일(콘을 움직이는 코일)의 DC 저항으로 구해요. 이 값을 (케이블 저항 + 앰프 출력 임피던스)로 나눠요.</li> <li>EAW 의 표도 공칭 임피던스로 계산한 근사값이라고 밝혀요.</li> <li>DC 저항은 공칭값보다 작아요. 그래서 같은 케이블이면 실제 댐핑 팩터는 이 과정의 계산보다 조금 작게 나와요.</li> <li>그러니 굵기는 「겨우 통과」보다 한 단계 여유 있게 고르면 좋아요.</li> <li><b>라벨을 먼저 봐요</b>: d&b E8 은 현재 제품 페이지에 12 Ω, 예전 설명서에는 16 Ω 으로 적혀 있어요. 모든 패시브 스피커가 8 Ω 인 것은 아니에요.</li> <li>스피커를 병렬로 이으면 가장 낮은 임피던스도 함께 낮아져요. 그래서 제조사가 정한 「채널당 대수」(Vi10P 는 2대)를 지키는 것이 가장 확실해요.</li></ul>' },
      { title: '패시브 스피커에서 소리가 안 날 때 — 점검 순서', text: '패시브 스피커는 스스로 켜지는 부분이 없어요. 그래서 소리가 안 나면 「앞에서부터」 차례로 확인하는 것이 빨라요.', more: '<ul><li><b>① 앰프</b>: 전원 · 채널 MUTE · 입력 신호 표시등(SIGNAL)을 봐요.</li> <li>신호가 앰프까지 안 오면 콘솔 · 신호 길부터 확인해요.</li> <li><b>② 앰프 채널과 핀</b>: 스피커가 이어진 채널이 맞는지 봐요. 그 채널이 speakON 의 1± 로 나오는지도 확인해요. 예를 들어 XLi1500 CH1 단자의 2± 는 CH2 예요.</li> <li><b>③ 케이블</b>: speakON 이 돌려서 잠겼는지 봐요. 링크 케이블 중간이 빠지지 않았는지도 봐요.</li> <li>다른 케이블로 바꿔 끼워 보면 빨라요.</li> <li><b>④ 스피커 설정</b>: d&b 앰프라면 그 채널의 스피커 설정이 맞는지 확인해요(04-2 「디지털 앰프」).</li> <li><b>⑤ 한 음역만 안 날 때</b>(고음만 없음 등): 드라이버나 패시브 크로스오버 고장일 수 있어요.</li> <li>이때는 음량을 올려서 확인하지 말고, 담당자에게 알려요.</li> <li>케이블을 꽂고 뺄 때는 앰프를 끄거나 음량을 내린 상태에서 해요.</li></ul>' }
    ],
    sources: [
      { t: 'd&b audiotechnik Vi10P 제품 페이지 — 8 Ω · 500/2000 W · 110°×40° · 2×NL4 + 나사 단자 · 채널당 2대 · 설치용 앰프 40D · 3웨이 패시브', url: 'https://www.dbaudio.com/global/en/products/series/v-series/vi10p' },
      { t: 'd&b audiotechnik Vi10P 데이터 시트 — 2×10" + 8" + 1.4" · 패시브 크로스오버 · 59 Hz–18 kHz · CUT 100 Hz–18 kHz', url: 'https://dbaudio.com/assets/products/downloads/manuals-documentation/v-series/dbaudio-datasheet-vi10p-en.pdf' },
      { t: 'd&b audiotechnik Vi7P · Vi10P 사용설명서 — 핀 1+/1− · 2± 는 액티브 서브우퍼용 · 두 NL4 네 핀 병렬 · 올바르게 설정된 d&b 앰프로만 · CUT/HFA/CPL', url: 'https://manualmachine.com/dbaudiotechnik/vi10p/23076391-user-manual' },
      { t: 'd&b audiotechnik Yi10P 제품 페이지 — Y10P 의 설치용 버전(외함 · 마감 · 설치 부품만 다름) · 8 Ω · 400/1600 W · 110°×40° · 앰프 10D · 40D', url: 'https://www.dbaudio.com/global/en/products/series/y-series/yi10p/' },
      { t: 'd&b audiotechnik Y7P 제품 페이지 — 8 Ω · 400/1600 W · 75°×40° · 2웨이 패시브 · 앰프 40D · 25D · 10D', url: 'https://www.dbaudio.com/global/en/products/series/y-series/y7p/' },
      { t: 'd&b audiotechnik Y10P 설계 사양 — 2웨이 패시브 · 2×8" + 1.4" · 110°×40° · 400/1600 W', url: 'https://www.dbaudio.com/assets/products/downloads/architectural-specifications/dbaudio-arch-specs-y10p-en.txt' },
      { t: 'd&b Y7P/Y10P 사용설명서 사양 — 8 Ω · 400/1600 W · NLT4 F/M · 핀 1+/1− (ManualsDir)', url: 'https://www.manualsdir.com/manuals/751258/db-y7p.html?page=10' },
      { t: 'd&b audiotechnik E8 제품 페이지 — 12 Ω · 150/800 W · 90°×50° 회전 · 앰프 10D · 40D', url: 'https://www.dbaudio.com/global/en/products/series/e-series/e8/' },
      { t: 'd&b E8 (예전) 사용설명서 — 16 Ω · 핀 1+/1− · Mix TOP/SUB (ManualsDir · ManualsLib)', url: 'https://www.manualsdir.com/manuals/751180/db-e8.html?page=8' },
      { t: 'd&b audiotechnik 40D 데이터 시트 — 4×2000 W/8 Ω · 4×2400 W/4 Ω · Euroblock 출력 · Dual Channel/Mix TOP/SUB/2-Way Active · LoadMatch 70 m · 부하 모니터링 · 출력 보호', url: 'https://www.dbaudio.com/assets/products/downloads/manuals-documentation/electronics/dbaudio-datasheet-40d-1.6-en.pdf' },
      { t: 'd&b audiotechnik 10D 제품 페이지 — 4×350 W/8 Ω · 4×700 W/4 Ω · V-Series 미지원 · LoadMatch', url: 'https://www.dbaudio.com/global/en/products/amplifiers/10d/' },
      { t: 'd&b D80 설명서 — 스피커별 설정 · CUT/HFA/CPL · LINEAR 설정 (ManualsLib)', url: 'https://www.manualslib.com/manual/1221699/DAndb-D80.html?page=6' },
      { t: 'Neutrik 스피커 커넥터 설명서 — NL2 케이블 커넥터는 4핀 섀시와 맞물려 1± 접촉 · 2핀 섀시는 4핀 케이블 커넥터와 맞지 않음', url: 'https://manualmachine.com/neutrik/loudspeakerconnectors/1653039-user-manual' },
      { t: 'Neutrik NL2FX — 4핀 섀시와 맞물림 · 접점당 40 A rms (Full Compass)', url: 'https://www.fullcompass.com/prod/247173-neutrik-nl2fx-2-pole-speakon-cable-connector' },
      { t: 'Neutrik NL4FXX-W-L 데이터 시트 — 1.5–4 mm² (17–11 AWG) · 케이블 지름 10–16 mm · 37 A rms', url: 'https://www.mouser.com/datasheet/2/289/nl4fxx_w_l-3104531.pdf' },
      { t: 'Copper Wire Resistance AWG Chart — AWG 별 저항 (MISUMI)', url: 'https://us.misumi-ec.com/blog/copper-wire-resistance-awg-chart/' },
      { t: 'EAW — Damping Factor (댐핑 팩터 · 케이블 저항 · 손실 공식, DF 20 이상)', url: 'https://eaw.com/wp-content/uploads/2020/12/Damping_factor.pdf' },
      { t: 'ProSoundWeb — Getting Your Wire Gauge Right (손실 0.5 dB 이내)', url: 'https://www.prosoundweb.com/tech-tip-of-the-day-getting-your-wire-gauge-right/' },
      { t: 'EAW — Power Handling (AES2 시험 · 작은 앰프가 안전하지 않음 · 클리핑과 열 고장)', url: 'https://eaw.com/wp-content/uploads/2020/12/Power_Handling.pdf' },
      { t: 'B&C Speakers — Power Handling (AES2-1984 · 2시간 · 크레스트 팩터 6 dB · 프로그램 = 2배)', url: 'https://bcspeakers.com/en/products-overview/power-handling' },
      { t: 'QSC AcousticPerformance AP-4122m Quick Start — 패시브/바이앰프 모드 · 저음 1± · 고음 2±', url: 'https://in.qsc.com/resource-files/productresources/spk/ap/ap4122m/q_spk_ap_4122m_quickstart.pdf' },
      { t: 'ProSoundWeb — 극성과 위상 · 건전지 확인은 고음 드라이버에 통하지 않음', url: 'https://www.prosoundweb.com/?p=39790' },
      { t: 'Electro-Voice ZX1 제품 페이지 — 8 Ω · 200/400/800 W', url: 'https://products.electrovoice.com/la/en/zx1' },
      { t: 'Crown XLi 1500 제품 페이지 — 330 W/8 Ω · 450 W/4 Ω · 브리지 900 W/8 Ω', url: 'https://jblpro.com/en/products/xli-1500' }
    ]
  };
})();
