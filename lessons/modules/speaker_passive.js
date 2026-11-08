/* =============================================================================
   05-1 패시브 스피커 — 2026-11-04 · 2026-11-08 「일반적인 패시브 스피커」로 다시 씀(3층 장비 예시 모두 뺌) + 2차 쉬운 말
   - STA_MODULES['speaker-passive'] (모듈 데이터) + STAVisuals.ps* (그림) + STASims.passiveRig (실습)
   - 05-2 액티브 스피커(speaker.js)와 나눔: 이 과정은 「앰프에서 힘을 받는 스피커」를 깊게 다룸
     (구조 · 2웨이/3웨이 · 드라이버 · 임피던스와 병렬/직렬 · 파워 정격과 앰프 고르기 · 케이블 굵기/손실/댐핑 · speakON 핀 · 극성 · 서브우퍼 · 바이앰프 · 설치)
   - 예시 장비는 제조사 · 모델명 없이 「12인치 2웨이 패시브(8 Ω · 연속 200 W / 프로그램 400 W / 피크 800 W)」「앰프 100 · 330 · 900 W」처럼 씀
       (숫자는 흔한 제품의 정격을 본뜬 예시 — sources 의 EV ZX1 · Crown XLi1500 자료와 같은 크기)
       구리선 저항 — 10 AWG 3.277 · 12 AWG 5.211 · 14 AWG 8.286 · 16 AWG 13.17 · 18 AWG 20.95 mΩ/m
   - 근거: 무대예술전문인 표준교재 「무대음향」 6장(임피던스 · 직병렬 · 정격허용입력 · 감도 · 드라이버 · 인클로저 · 서브우퍼 · 패시브 스피커),
           15장(서브우퍼 자리 · 프로그램 파워 · 채널당 4 Ω), 16장(패시브/액티브 크로스오버), 5장(케이블 손실)
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

  /* ---------------------------------------------------------------- 그림 1: 패시브와 액티브의 구조 (첫 화면 그림으로도 씀) — 2026-11-08 일반 장비로 */
  V.psSystem = function () {
    var s = '';
    // 줄 1 — 패시브
    s += t(8, 18, '1. 패시브 스피커 — 앰프가 바깥에 있어요', { size: 11.5, weight: 800, anchor: 'start', fill: C.ink });
    s += blk(8, 40, 72, 40, '콘솔', '작은 소리', C.ink) + arrow(80, 60, 108, 60, C.blue);
    s += blk(110, 34, 112, 52, '파워앰프', '힘을 키워요', C.red, '#fef2f2');
    s += arrow(222, 60, 314, 60, C.red, 3.2) + t(268, 52, '큰 힘', { size: 10, fill: C.red, weight: 800 }) + t(268, 76, 'speakON 케이블', { size: 9.5, fill: C.sub });
    s += box(316, 28, 276, 64, C.bg, C.ink, 10) + t(592, 20, '패시브 스피커 · 전원 단자 없음', { size: 9.5, fill: C.sub, anchor: 'end', weight: 700 });
    s += blk(326, 42, 112, 40, '크로스오버', '높낮이 나누기', C.violet, '#f5f3ff');
    s += arrow(438, 54, 466, 50, C.violet, 1.8) + arrow(438, 70, 466, 76, C.violet, 1.8);
    s += blk(468, 38, 116, 22, '우퍼 (저음)', '', C.teal) + blk(468, 64, 116, 22, '혼 (고음)', '', C.amber);
    // 줄 2 — 액티브 (비교)
    s += t(8, 124, '2. 액티브 스피커 — 앰프가 통 안에 있어요 (비교)', { size: 11.5, weight: 800, anchor: 'start', fill: C.teal });
    s += blk(8, 150, 72, 40, '콘솔', '작은 소리', C.ink) + arrow(80, 170, 314, 170, C.blue, 2.4) + t(197, 162, '작은 소리 그대로', { size: 10, fill: C.blue, weight: 800 }) + t(197, 186, 'XLR 케이블', { size: 9.5, fill: C.sub });
    s += box(316, 132, 276, 78, C.bg, C.teal, 10) + t(592, 124, '액티브 스피커 · 전원 꽂음', { size: 9.5, fill: C.teal, anchor: 'end', weight: 700 });
    s += blk(326, 150, 74, 40, '크로스오버', '', C.violet, '#f5f3ff') + arrow(400, 162, 408, 156, C.violet, 1.6) + arrow(400, 178, 408, 186, C.violet, 1.6);
    s += blk(410, 144, 50, 22, '앰프', '', C.red, '#fef2f2') + blk(410, 176, 50, 22, '앰프', '', C.red, '#fef2f2') + arrow(460, 155, 468, 155, C.red, 1.6) + arrow(460, 187, 468, 187, C.red, 1.6);
    s += blk(470, 144, 114, 22, '우퍼 (저음)', '', C.teal) + blk(470, 176, 114, 22, '혼 (고음)', '', C.amber);
    s += t(300, 232, '패시브 = 앰프는 바깥, 나누기는 통 안 · 액티브 = 둘 다 통 안 (그림은 단순하게 그렸어요)', { size: 10, fill: C.sub });
    return svg(600, 240, s, '패시브 스피커와 액티브 스피커의 구조 비교');
  };

  /* ---------------------------------------------------------------- 그림 2: 병렬 · 직렬 */
  V.psLoad = function () {
    var s = '';
    function amp(x, y) { return box(x, y, 54, 70, C.dark, null, 6) + t(x + 27, y + 16, '앰프 CH', { size: 9.5, fill: '#e5e7eb', weight: 700 }) + t(x + 46, y + 33, '+', { size: 13, fill: '#fca5a5', weight: 800 }) + t(x + 46, y + 59, '−', { size: 13, fill: '#e5e7eb', weight: 800 }); }
    function spk(x, y, w, lab) { return box(x, y, w, 30, '#fff', C.ink, 5) + '<circle cx="' + (x + 15) + '" cy="' + (y + 15) + '" r="9" fill="none" stroke="' + C.ink + '" stroke-width="1.6"/>' + t(x + w / 2 + 8, y + 20, lab, { size: 11, weight: 800 }); }
    // 병렬
    s += box(6, 6, 290, 222, '#f0fdfa', '#99f6e4', 10) + t(151, 26, '나란히(병렬) — 링크 케이블로 이었을 때', { size: 12, weight: 800, fill: C.teal });
    s += amp(16, 70);
    s += '<path d="M70 98H112V62H150M112 98V136H150" stroke="' + C.red + '" stroke-width="2.4" fill="none"/>';
    s += '<path d="M70 126H96V186H282V62H262M282 136H262" stroke="' + C.ink + '" stroke-width="2.4" fill="none"/>';
    s += spk(150, 47, 112, '8 Ω') + spk(150, 121, 112, '8 Ω');
    s += t(151, 210, '8 ÷ 2 = 4 Ω  (Ω 이 낮아져요)', { size: 13, weight: 800, fill: C.teal });
    s += t(206, 106, '두 단자는 안에서 나란히', { size: 9, fill: C.sub });
    // 직렬
    s += box(304, 6, 290, 222, '#fff7ed', '#fdba74', 10) + t(449, 26, '한 줄로(직렬) — 따로 만든 배선일 때', { size: 12, weight: 800, fill: C.amber });
    s += amp(314, 70);
    s += '<path d="M368 98H380V62H392" stroke="' + C.red + '" stroke-width="2.4" fill="none"/>';
    s += spk(392, 47, 84, '8 Ω') + '<path d="M476 62H492" stroke="' + C.amber + '" stroke-width="2.4"/>' + spk(492, 47, 84, '8 Ω');
    s += '<path d="M576 62H586V150H380V126H368" stroke="' + C.ink + '" stroke-width="2.4" fill="none"/>';
    s += t(484, 40, '앞 스피커 − → 뒤 스피커 +', { size: 9, fill: C.amber });
    s += t(449, 176, '한 대가 끊기면 둘 다 꺼져요', { size: 10, fill: C.sub }) + t(449, 192, '같은 전압이면 4 Ω 일 때 힘의 ¼', { size: 10, fill: C.sub });
    s += t(449, 214, '8 + 8 = 16 Ω  (Ω 이 높아져요)', { size: 13, weight: 800, fill: C.amber });
    return svg(600, 234, s, '스피커 두 대를 병렬과 직렬로 연결했을 때의 부하');
  };

  /* ---------------------------------------------------------------- 그림 3: 파워 정격과 앰프 매칭 */
  V.psPower = function () {
    var s = '', x0 = 150, x1 = 584, xw = function (w) { return x0 + w / 1000 * (x1 - x0); };
    s += t(8, 16, '12인치 2웨이 패시브 스피커(8 Ω) 정격 예시 · 앰프는 「같은 8 Ω 에서」 비교', { size: 11, weight: 800, anchor: 'start', fill: C.sub });
    s += '<rect x="' + xw(200) + '" y="28" width="' + (xw(400) - xw(200)) + '" height="176" fill="' + C.green + '" fill-opacity=".09"/>';
    [0, 200, 400, 600, 800, 1000].forEach(function (w) { s += '<path d="M' + xw(w) + ' 28V204" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(xw(w), 218, w + ' W', { size: 9.5, fill: C.sub }); });
    [['연속 (RMS)', 200, C.teal, '200 W — 오래 견디는 힘 (기준)'], ['프로그램', 400, C.blue, '400 W = 연속의 2배'], ['피크', 800, C.violet, '800 W = 연속의 4배 · 아주 잠깐']].forEach(function (r, i) {
      var y = 36 + i * 30, inside = i === 2; s += t(x0 - 8, y + 15, r[0], { size: 10.5, weight: 700, anchor: 'end' }) + box(x0, y, xw(r[1]) - x0, 20, r[2], null, 4) + t(inside ? xw(r[1]) - 8 : xw(r[1]) + 6, y + 14, r[3], { size: 9.5, fill: inside ? '#fff' : r[2], anchor: inside ? 'end' : 'start', weight: 700 });
    });
    s += t(x0 - 8, 146, '앰프 (8 Ω)', { size: 10.5, weight: 700, anchor: 'end' });
    [[100, '100 W 앰프', C.red, '✗ 작아서 자주 클리핑'], [330, '330 W 앰프', C.green, '✓ 연속 ~ 2배 사이'], [900, '900 W 앰프', C.amber, '⚠ 너무 커요']].forEach(function (a, i) {
      var x = xw(a[0]); s += '<path d="M' + x + ' 128V198" stroke="' + a[2] + '" stroke-width="3"/>' + t(x + (i === 2 ? -6 : 6), 152 + (i === 1 ? 20 : 0), a[1], { size: 10, weight: 800, fill: a[2], anchor: i === 2 ? 'end' : 'start' }) + t(x + (i === 2 ? -6 : 6), 166 + (i === 1 ? 20 : 0), a[3], { size: 9.5, fill: a[2], anchor: i === 2 ? 'end' : 'start' });
    });
    s += t(300, 236, '초록 칸 = 이 과정의 기준(연속 ~ 2배) · 숫자는 예시예요 · 재는 방법은 회사마다 달라요', { size: 10, fill: C.sub });
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
    s += t(x0, 16, '8 Ω 스피커 한 대 · 길이에 따라 줄어드는 힘(dB) — 어림 계산', { size: 10.5, fill: C.sub, anchor: 'start', weight: 700 });
    // 오른쪽: 계산 방법
    var bx = 462; s += box(bx, 22, 134, 196, C.bg, C.line, 8);
    [['손실을 줄이려면', 700], ['① 굵은 선', 400], ['   (AWG 숫자 ↓)', 400], ['② 짧은 길이', 400], ['③ 나란히 이은', 400], ['   스피커 수 줄이기', 400], ['', 400], ['목표: −0.5 dB 안', 700], ['댐핑 팩터 20 이상', 700]].forEach(function (r, i) { s += t(bx + 8, 42 + i * 20, r[0], { size: 10, anchor: 'start', weight: r[1], fill: i >= 7 ? C.red : C.ink }); });
    s += t(300, 226, 'AWG 숫자가 작을수록 굵어요 (12 AWG ≈ 3.3 mm² · 14 AWG ≈ 2.1 mm²) · 길이는 한 방향', { size: 10, fill: C.sub });
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
    var bx = 304, rows = [['보통 패시브 스피커', '1+ / 1−', C.ink], ['4심 케이블의 2± 핀', '다른 신호용 (설명서)', C.violet], ['바이앰프 모드 스피커', '저음 1± · 고음 2±', C.blue], ['NL2 플러그 → NL4 소켓', '✓ 1± 로 이어져요', C.green], ['NL4 플러그 → NL2 소켓', '✗ 맞지 않아요', C.red]];
    s += box(bx, 8, 290, 168, C.bg, C.line, 8);
    rows.forEach(function (r, i) { var y = 34 + i * 32; s += t(bx + 10, y, r[0], { size: 10, anchor: 'start', weight: 700 }) + t(bx + 280, y, r[1], { size: 10, anchor: 'end', weight: 800, fill: r[2] }) + (i < rows.length - 1 ? '<path d="M' + (bx + 10) + ' ' + (y + 14) + 'H' + (bx + 280) + '" stroke="#e2e8f0"/>' : ''); });
    s += box(304, 186, 290, 40, '#fef2f2', '#fecaca', 8) + t(449, 204, '+ ↔ − 가 바뀌면 극성 반대', { size: 11, weight: 800, fill: C.red }) + t(449, 219, '같은 곳을 비추는 두 스피커의 저음이 서로 지워져요', { size: 9.5, fill: C.red });
    return svg(600, 234, s, 'speakON NL4 와 NL2 의 핀, 쓰임새와 극성');
  };

  /* ---------------------------------------------------------------- 그림 6: 바이앰프 · 서브우퍼 — 저음은 따로 (2026-11-08: 클리핑은 그림 6-2 psClip 으로 옮김) */
  V.psProtect = function () {
    var s = '';
    s += box(6, 6, 290, 222, C.bg, C.line, 10) + t(151, 24, '패시브 모드 ↔ 바이앰프 모드', { size: 11.5, weight: 800, fill: C.ink });
    s += t(16, 48, '패시브 모드 (보통)', { size: 10.5, weight: 800, anchor: 'start', fill: C.teal });
    s += blk(16, 56, 62, 30, '앰프 1채널', '', C.red) + arrow(78, 71, 100, 71, C.red, 2) + t(89, 64, '1±', { size: 9, fill: C.red, weight: 700 }) + blk(102, 56, 84, 30, '크로스오버', '', C.violet, '#f5f3ff') + arrow(186, 64, 206, 60, C.violet, 1.6) + arrow(186, 78, 206, 82, C.violet, 1.6) + blk(208, 50, 78, 18, '우퍼', '', C.teal) + blk(208, 74, 78, 18, '혼 (고음)', '', C.amber);
    s += t(16, 120, '바이앰프 모드 (스위치로 바꾸는 스피커)', { size: 10.5, weight: 800, anchor: 'start', fill: C.blue });
    s += blk(16, 128, 62, 26, '프로세서', '', C.blue, '#eff6ff') + arrow(78, 134, 100, 134, C.red, 2) + arrow(78, 148, 100, 170, C.red, 2);
    s += blk(102, 124, 62, 22, '앰프 저음', '', C.red) + blk(102, 160, 62, 22, '앰프 고음', '', C.red) + arrow(164, 135, 206, 135, C.red, 2) + arrow(164, 171, 206, 171, C.red, 2) + t(185, 128, '1±', { size: 9, fill: C.red, weight: 700 }) + t(185, 164, '2±', { size: 9, fill: C.red, weight: 700 });
    s += blk(208, 124, 78, 22, '우퍼', '', C.teal) + blk(208, 160, 78, 22, '혼 (고음)', '', C.amber);
    s += t(151, 206, '바이앰프에서는 소리 나누기를 앰프 앞에서', { size: 9.5, fill: C.sub }) + t(151, 220, '꼭 해요 (고음에 저음이 가면 망가져요)', { size: 9.5, fill: C.red, weight: 700 });
    // 서브우퍼
    s += box(304, 6, 290, 222, '#f5f3ff', '#c4b5fd', 10) + t(449, 24, '서브우퍼와 함께 — 저음은 따로', { size: 11.5, weight: 800, fill: C.violet });
    s += blk(314, 96, 66, 44, '프로세서', '높낮이 나누기', C.blue, '#eff6ff');
    s += arrow(380, 108, 404, 74, C.blue, 2) + arrow(380, 128, 404, 162, C.blue, 2);
    s += blk(406, 58, 62, 30, '앰프 CH1', '', C.red, '#fef2f2') + blk(406, 148, 62, 30, '앰프 CH2', '', C.red, '#fef2f2');
    s += arrow(468, 73, 488, 73, C.red, 2.4) + arrow(468, 163, 488, 163, C.red, 2.4);
    s += box(490, 50, 94, 46, '#1f2937', null, 6) + '<circle cx="512" cy="73" r="12" fill="#374151" stroke="' + C.teal + '" stroke-width="2"/><path d="M532 64H574L566 82H540Z" fill="#374151" stroke="' + C.amber + '" stroke-width="1.6"/>';
    s += t(537, 110, '위쪽 스피커', { size: 10.5, weight: 800, fill: C.ink }) + t(537, 124, '100 Hz 위 (예)', { size: 9.5, fill: C.sub });
    s += box(490, 140, 94, 46, '#1f2937', null, 6) + '<circle cx="537" cy="163" r="19" fill="#374151" stroke="' + C.violet + '" stroke-width="2.4"/><circle cx="537" cy="163" r="7" fill="#4b5563"/>';
    s += t(537, 200, '서브우퍼 18″', { size: 10.5, weight: 800, fill: C.violet }) + t(537, 214, '100 Hz 아래 (예)', { size: 9.5, fill: C.sub });
    s += t(350, 168, '나누는 높이는', { size: 9.5, fill: C.sub }) + t(350, 182, '스피커마다 달라요', { size: 9.5, fill: C.sub });
    return svg(600, 234, s, '바이앰프 모드와 서브우퍼 시스템 — 앰프 앞에서 소리를 나눠요');
  };

  /* 그림 6-2 (이론 3): 클리핑 — 앰프 힘이 모자라면 파형이 잘려요 */
  V.psClip = function () {
    var s = t(240, 20, '앰프 힘이 모자라면 — 클리핑', { size: 15, weight: 800, fill: C.red });
    var ox = 20, oy = 78, w = 440, A = 36, cl = 21, d1 = '', d2 = '';
    for (var i = 0; i <= 160; i++) { var x = ox + i / 160 * w, v = A * Math.sin(i / 160 * Math.PI * 4); d1 += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (oy - v).toFixed(1); d2 += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (oy - Math.max(-cl, Math.min(cl, v * 1.6))).toFixed(1); }
    s += '<path d="M' + ox + ' ' + oy + 'H' + (ox + w) + '" stroke="' + C.line + '"/><path d="' + d1 + '" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-dasharray="4 3"/><path d="' + d2 + '" fill="none" stroke="' + C.red + '" stroke-width="3"/>';
    s += t(20, 132, '회색 = 원래 소리 · 빨강 = 위아래가 잘린 소리', { size: 12.5, fill: C.sub, anchor: 'start' });
    var hb = [[1, 34, 30], [3, 0, 12], [5, 0, 8], [7, 0, 5]];
    s += t(110, 154, '깨끗한 소리', { size: 12.5, weight: 700, fill: C.sub }) + t(370, 154, '잘린 소리', { size: 12.5, weight: 700, fill: C.red });
    hb.forEach(function (h, i) { var y0 = 198; s += (h[1] ? box(64 + i * 26, y0 - h[1], 16, h[1], '#94a3b8', null, 2) : '') + box(324 + i * 26, y0 - h[2], 16, h[2], i ? C.amber : C.red, null, 2) + t(72 + i * 26, y0 + 14, (i ? h[0] + '배' : '기본'), { size: 11, fill: C.sub }) + t(332 + i * 26, y0 + 14, (i ? h[0] + '배' : '기본'), { size: 11, fill: C.sub }); });
    s += t(240, 234, '없던 고음이 생기고 평균 힘이 올라 → 고음 드라이버가 뜨거워져요 (막대는 예시)', { size: 12, fill: C.red, weight: 700 });
    return pic(480, 242, s, '클리핑: 잘린 파형에 고음 성분이 새로 생겨요');
  };

  /* 그림 6-3 (이론 1): 12인치 2웨이 패시브 스피커 속 — 앞에서 · 옆에서 자른 모습 (일반 예시) */
  V.psInside = function () {
    var s = box(6, 6, 200, 216, C.bg, C.line, 10) + t(106, 28, '앞 (그릴을 뗀 모습)', { size: 13, weight: 800 });
    s += box(46, 40, 120, 172, '#1f2937', null, 8);
    s += '<path d="M60 50H152L134 94H78Z" fill="#334155" stroke="' + C.amber + '" stroke-width="2.5"/><circle cx="106" cy="72" r="5" fill="#94a3b8"/>';
    s += t(106, 112, '혼 · 고음', { size: 12.5, weight: 800, fill: '#fde68a' });
    s += '<circle cx="106" cy="158" r="44" fill="#111827" stroke="' + C.teal + '" stroke-width="3"/><circle cx="106" cy="158" r="28" fill="#374151"/><circle cx="106" cy="158" r="9" fill="#4b5563"/>';
    s += t(106, 163, '우퍼 · 저음', { size: 12.5, weight: 800, fill: '#99f6e4' });
    s += box(216, 6, 258, 216, '#fff', C.line, 10) + t(345, 28, '옆에서 자른 모습', { size: 13, weight: 800 });
    s += box(236, 42, 204, 160, '#eef2f7', C.sub, 6) + '<path d="M236 42V202" stroke="#64748b" stroke-width="4" stroke-dasharray="2 3"/>' + t(232, 214, '그릴', { size: 11.5, fill: C.sub, anchor: 'start' });
    s += '<path d="M240 52L296 70V82L240 100Z" fill="#334155"/>' + box(296, 64, 28, 24, '#475569', null, 3) + t(330, 62, '고음 드라이버', { size: 12, anchor: 'start', weight: 800, fill: C.amber });
    s += '<path d="M240 112L288 134V170L240 192Z" fill="#111827"/>' + box(288, 140, 22, 24, '#475569', null, 3) + t(316, 176, '우퍼', { size: 12, anchor: 'start', weight: 800, fill: C.teal });
    s += box(356, 104, 74, 28, '#dcfce7', C.green, 4) + t(393, 123, '크로스오버', { size: 11.5, weight: 800, fill: C.green });
    s += '<path d="M440 176H422V132M380 132V152H310M368 104V96H310V88" fill="none" stroke="' + C.red + '" stroke-width="1.8"/>';
    s += '<circle cx="440" cy="176" r="8" fill="' + C.dark + '"/>' + t(462, 214, 'speakON 입력', { size: 11.5, anchor: 'end', weight: 700, fill: C.ink });
    return pic(480, 228, s, '12인치 2웨이 패시브 스피커 속 구조: 우퍼, 혼과 고음 드라이버, 크로스오버, speakON 입력');
  };

  /* ===================================================================== 2026-11-04 「그림으로 보기」 (교재 6장 · 15장 대조 뒤 추가)
     - 작은 칸(용어 · 2단 그림)에서도 글자가 읽히게 viewBox 를 좁게(360 · 480) 그리고, 폭 줄임을 허용 — 480 폭 그림은 휴대폰에서 글자가 10px 아래로 작아지지 않게 380px 까지만 줄이고 그 아래는 칸 안에서 옆으로 밀어 봐요 */
  function pic(w, h, body, label) { return '<svg class="mod-svg" style="min-width:' + (w > 400 ? '380px' : '0') + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function mini(x, y, lab, col) { return box(x, y, 50, 40, '#fff', col || C.ink, 5) + '<circle cx="' + (x + 16) + '" cy="' + (y + 20) + '" r="10" fill="none" stroke="' + (col || C.ink) + '" stroke-width="1.8"/>' + t(x + 38, y + 25, lab, { size: 12.5, weight: 800, fill: col || C.ink }); }

  /* 그림 7 (용어 아이콘): 공칭 임피던스 — 실제 임피던스는 높낮이마다 오르내려요 (교재 그림 6-10 의 생각) */
  V.psTermZ = function () {
    var x0 = 14, x1 = 236, y8 = 74, yz = function (z) { return z >= 8 ? y8 - (z - 8) * 2.8 : y8 + (8 - z) * 10; }, d = '';
    for (var i = 0; i <= 80; i++) { var u = i / 80, lf = Math.log10(20) + u * 3, f = Math.pow(10, lf), z = 8 + 16 * Math.exp(-Math.pow((lf - Math.log10(70)) / 0.16, 2)) + 0.4 * Math.max(0, lf - 2.6) * 6 * Math.max(0, lf - 2.6);
      d += (i ? 'L' : 'M') + (x0 + u * (x1 - x0)).toFixed(1) + ' ' + yz(Math.min(z, 26)).toFixed(1); }
    var s = '<path d="M' + x0 + ' ' + y8 + 'H' + x1 + '" stroke="' + C.teal + '" stroke-width="2" stroke-dasharray="6 4"/>' + '<path d="M' + x0 + ' ' + yz(6.7) + 'H' + x1 + '" stroke="' + C.amber + '" stroke-width="2" stroke-dasharray="2 3"/>';
    s += '<path d="' + d + '" fill="none" stroke="' + C.ink + '" stroke-width="2.6"/>';
    s += t(x0, 112, '저음', { size: 13, fill: C.sub, anchor: 'start' }) + t(x1, 112, '고음', { size: 13, fill: C.sub, anchor: 'end' });
    s += t(248, 70, '공칭 8 Ω', { size: 13.5, weight: 800, fill: C.teal, anchor: 'start' }) + t(248, 96, '테스터 값', { size: 13, weight: 700, fill: C.amber, anchor: 'start' }) + t(248, 112, '약 6.7 Ω (예)', { size: 13, weight: 700, fill: C.amber, anchor: 'start' });
    s += t(x0 + 6, 18, '실제 Ω (오르내림)', { size: 13, weight: 700, anchor: 'start' });
    return pic(360, 120, s, '주파수에 따라 오르내리는 임피던스와 공칭 임피던스');
  };

  /* 그림 8: 직 · 병렬 — 8 Ω 네 대를 써도 8 Ω (교재 6장 예) */
  V.psSeriesPar = function () {
    var s = t(240, 20, '직 · 병렬: 8 Ω 네 대를 이어도 8 Ω', { size: 15, weight: 800 });
    s += box(10, 76, 70, 70, C.dark, null, 6) + t(45, 104, '앰프', { size: 13, weight: 800, fill: '#fff' }) + t(45, 122, '1채널', { size: 12.5, fill: '#cbd5e1' });
    s += '<path d="M80 96H118V62H140M118 96V150H140" stroke="' + C.red + '" stroke-width="2.4" fill="none"/>';
    s += mini(140, 42, '8 Ω') + '<path d="M190 62H222" stroke="' + C.amber + '" stroke-width="2.4"/>' + mini(222, 42, '8 Ω');
    s += mini(140, 130, '8 Ω') + '<path d="M190 150H222" stroke="' + C.amber + '" stroke-width="2.4"/>' + mini(222, 130, '8 Ω');
    s += '<path d="M272 62H292V182H100V126H80M272 150H292" stroke="' + C.ink + '" stroke-width="2.4" fill="none"/>';
    s += t(386, 56, '한 줄 = 직렬', { size: 13, weight: 800, fill: C.amber }) + t(386, 74, '8 + 8 = 16 Ω', { size: 13, fill: C.ink });
    s += t(386, 118, '두 줄 = 병렬', { size: 13, weight: 800, fill: C.teal }) + t(386, 136, '16 ÷ 2 = 8 Ω', { size: 13, fill: C.ink });
    s += t(240, 212, '앰프는 8 Ω 한 대를 이은 것과 같은 짐을 져요', { size: 13.5, weight: 800, fill: C.teal });
    return pic(480, 222, s, '스피커 네 대를 직렬과 병렬로 섞어 이은 연결');
  };

  /* 그림 9: 앰프 힘 나눠 갖기 — 피자 비유 (교재 6장: 같은 Ω 이면 똑같이, Ω 이 낮으면 더 많이) */
  V.psPizza = function () {
    function slice(cx, cy, r, a0, a1, col) { var p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
      return '<path d="M' + cx + ' ' + cy + 'L' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'Z" fill="' + col + '" stroke="#fff" stroke-width="3"/>'; }
    function lab(cx, cy, r, a, txt, col) { return t(cx + r * Math.cos(a), cy + r * Math.sin(a) + 5, txt, { size: 13, weight: 800, fill: col || '#fff' }); }
    var s = t(240, 20, '앰프의 힘을 스피커가 나눠 가져요', { size: 15, weight: 800 }), P = Math.PI;
    s += t(120, 46, '8 Ω 네 대 병렬 · 앰프 400 W', { size: 13, weight: 700 });
    [0, 1, 2, 3].forEach(function (k) { s += slice(120, 124, 62, -P / 2 + k * P / 2, -P / 2 + (k + 1) * P / 2, [C.teal, '#0891b2', '#0e7490', '#155e75'][k]) + lab(120, 124, 34, -P / 4 + k * P / 2, '100 W'); });
    s += t(120, 212, '같은 Ω 이면 똑같이 나눠요', { size: 13, weight: 800, fill: C.teal });
    s += t(360, 46, '8 Ω 와 16 Ω 를 병렬로', { size: 13, weight: 700 });
    s += slice(360, 124, 62, -P / 2, -P / 2 + 2 * P * 2 / 3, C.blue) + slice(360, 124, 62, -P / 2 + 2 * P * 2 / 3, P * 3 / 2, C.amber);
    s += lab(360, 124, 32, P / 6, '8 Ω') + t(360 + 32 * Math.cos(P / 6), 124 + 32 * Math.sin(P / 6) + 22, '2/3', { size: 13, weight: 800, fill: '#fff' });
    s += t(360 + 36 * Math.cos(P * 7 / 6), 124 + 36 * Math.sin(P * 7 / 6) - 2, '16 Ω', { size: 12.5, weight: 800, fill: '#fff' }) + t(360 + 36 * Math.cos(P * 7 / 6), 124 + 36 * Math.sin(P * 7 / 6) + 14, '1/3', { size: 12.5, weight: 800, fill: '#fff' });
    s += t(360, 212, 'Ω 이 낮은 쪽이 더 많이 받아요', { size: 13, weight: 800, fill: C.blue });
    return pic(480, 222, s, '병렬로 이은 스피커가 앰프 출력을 나눠 받는 모습');
  };

  /* 그림 10: 감도 — 같은 1 W 로 1 m 에서 잰 크기 (교재 6장) */
  V.psSensitivity = function () {
    function row(y, lab, db, col, w) { return t(10, y + 26, lab, { size: 13.5, weight: 800, anchor: 'start', fill: col }) + box(100, y + 6, 60, 34, '#fef2f2', C.red, 6) + t(130, y + 28, '1 W', { size: 13, weight: 800, fill: C.red }) + arrow(160, y + 23, 186, y + 23, C.red, 2) +
      box(188, y, 40, 46, C.dark, null, 5) + '<circle cx="208" cy="' + (y + 23) + '" r="12" fill="#475569"/>' + '<path d="M232 ' + (y + 23) + 'H330" stroke="' + C.line + '" stroke-width="1.6" stroke-dasharray="4 3"/>' + t(281, y + 17, '1 m', { size: 12.5, fill: C.sub }) +
      '<circle cx="338" cy="' + (y + 23) + '" r="6" fill="' + C.ink + '"/>' + box(356, y + 8, 114, 30, col === C.teal ? '#ecfeff' : '#f1f5f9', col, 6) + t(413, y + 29, db + ' dB', { size: 14, weight: 800, fill: col }); }
    var s = t(240, 20, '감도: 1 W 를 넣고 1 m 앞에서 잰 크기', { size: 15, weight: 800 });
    s += row(36, '스피커 A', 100, C.teal, 0) + row(96, '스피커 B', 94, C.sub, 0);
    s += t(240, 172, 'A 가 6 dB 더 커요 → B 로 같은 크기를 내려면 힘이 4배 필요해요', { size: 12.5, fill: C.ink, weight: 700 });
    s += t(240, 194, '힘(W) 2배 = +3 dB · 4배 = +6 dB (숫자는 예시)', { size: 12.5, fill: C.sub });
    return pic(480, 204, s, '스피커 감도 비교: 같은 1 W 에서 나는 크기');
  };

  /* 그림 11: 물 호스 비유 — 케이블 굵기와 길이 */
  V.psHose = function () {
    function tap(x, y) { return box(x, y, 34, 30, '#94a3b8', null, 4) + t(x + 17, y + 20, '앰프', { size: 12, weight: 800, fill: '#fff' }); }
    var s = box(6, 6, 228, 196, '#ecfeff', '#67e8f9', 10) + t(120, 28, '굵고 짧은 케이블', { size: 14, weight: 800, fill: C.teal });
    s += tap(18, 60) + '<path d="M52 75H150" stroke="#60a5fa" stroke-width="16" stroke-linecap="round"/>' + '<path d="M156 75q30 0 52 50" stroke="#60a5fa" stroke-width="10" fill="none" stroke-linecap="round"/>' + t(120, 160, '물살(힘)이 세게 가요', { size: 13 }) + t(120, 180, '손실이 작아요', { size: 13, weight: 800, fill: C.teal });
    s += box(246, 6, 228, 196, '#fff7ed', '#fdba74', 10) + t(360, 28, '가늘고 긴 케이블', { size: 14, weight: 800, fill: C.amber });
    s += tap(258, 60) + '<path d="M292 75H340q20 0 20 18q0 18 -20 18H300q-14 0 -14 14q0 14 18 14H410" stroke="#60a5fa" stroke-width="5" fill="none" stroke-linecap="round"/>' + '<path d="M414 139q14 0 22 18" stroke="#60a5fa" stroke-width="3" fill="none" stroke-linecap="round"/>';
    s += t(360, 176, '가는 길에 힘이 줄어요', { size: 13, weight: 800, fill: C.amber }) + t(360, 194, '(손실 ↑ · 댐핑 ↓)', { size: 12.5, fill: C.sub });
    return pic(480, 208, s, '물 호스 비유: 굵고 짧은 케이블과 가늘고 긴 케이블');
  };

  /* 그림 12: 댐핑 팩터는 대부분 케이블이 정해요 (앰프 사양표 값 500 은 앰프만 잰 값) */
  V.psDfShare = function () {
    var s = t(240, 20, '댐핑 팩터를 정하는 건 대부분 케이블이에요', { size: 15, weight: 800 });
    s += t(10, 52, '콘을 붙잡는 힘을 막는 것 (8 Ω 스피커 · 30 m · 12 AWG 예)', { size: 12.5, fill: C.sub, anchor: 'start' });
    var x0 = 10, W = 460, a = 0.016, c = 0.313, tot = a + c, wa = Math.max(6, a / tot * W);
    s += box(x0, 62, wa, 34, C.violet, null, 3) + box(x0 + wa, 62, W - wa, 34, C.amber, null, 3) + t(x0 + wa + (W - wa) / 2, 85, '케이블 왕복 저항 약 0.31 Ω', { size: 13.5, weight: 800, fill: '#fff' });
    s += '<path d="M' + (x0 + wa / 2) + ' 98V118" stroke="' + C.violet + '" stroke-width="1.6"/>' + t(x0, 134, '앰프 속 0.016 Ω (사양표 댐핑 500 일 때)', { size: 12.5, weight: 700, fill: C.violet, anchor: 'start' });
    s += box(10, 150, 225, 46, C.bg, C.line, 8) + t(122, 170, '앰프만 보면', { size: 13, fill: C.sub }) + t(122, 188, '댐핑 500', { size: 14, weight: 800, fill: C.violet });
    s += box(245, 150, 225, 46, '#fff7ed', '#fdba74', 8) + t(357, 170, '케이블까지 보면', { size: 13, fill: C.sub }) + t(357, 188, '약 24 (8 ÷ 0.33)', { size: 14, weight: 800, fill: C.amber });
    return pic(480, 206, s, '앰프 출력 임피던스와 케이블 저항이 댐핑 팩터에 주는 몫');
  };

  /* 그림 13: 극성 — 수레 밀기 비유 */
  V.psCart = function () {
    function person(x, y, col, flip) { return '<circle cx="' + x + '" cy="' + (y - 34) + '" r="8" fill="' + col + '"/><path d="M' + x + ' ' + (y - 26) + 'V' + (y - 4) + 'M' + x + ' ' + (y - 4) + 'L' + (x - 7) + ' ' + (y + 14) + 'M' + x + ' ' + (y - 4) + 'L' + (x + 7) + ' ' + (y + 14) + 'M' + x + ' ' + (y - 20) + 'L' + (x + (flip ? -16 : 16)) + ' ' + (y - 14) + '" stroke="' + col + '" stroke-width="3" fill="none" stroke-linecap="round"/>'; }
    function cart(x, y) { return box(x, y - 30, 70, 30, '#e2e8f0', C.sub, 4) + '<circle cx="' + (x + 16) + '" cy="' + (y + 6) + '" r="7" fill="' + C.sub + '"/><circle cx="' + (x + 54) + '" cy="' + (y + 6) + '" r="7" fill="' + C.sub + '"/>'; }
    var s = box(6, 6, 228, 190, '#ecfdf5', '#86efac', 10) + t(120, 28, '극성 같음', { size: 14, weight: 800, fill: C.green });
    s += person(44, 110, C.teal, false) + person(64, 112, C.blue, false) + cart(84, 116) + arrow(160, 100, 214, 100, C.green, 3);
    s += t(120, 158, '둘 다 밀어요', { size: 13 }) + t(120, 178, '잘 가요 · 저음이 커져요', { size: 13, weight: 800, fill: C.green });
    s += box(246, 6, 228, 190, '#fef2f2', '#fecaca', 10) + t(360, 28, '극성 반대', { size: 14, weight: 800, fill: C.red });
    s += person(288, 110, C.teal, false) + cart(312, 116) + person(406, 110, C.amber, true) + arrow(296, 64, 326, 64, C.teal, 2.4) + arrow(398, 64, 368, 64, C.amber, 2.4);
    s += t(360, 158, '서로 반대쪽으로 밀어요', { size: 13 }) + t(360, 178, '안 가요 · 저음이 지워져요', { size: 13, weight: 800, fill: C.red });
    return pic(480, 202, s, '극성 비유: 같은 쪽으로 미는 수레와 서로 반대로 미는 수레');
  };

  /* 그림 14 (확인 문제): 링크로 세 대 */
  V.psQuizChain = function () {
    var s = box(8, 34, 92, 64, C.dark, null, 6) + t(54, 58, '앰프 CH', { size: 13, weight: 800, fill: '#fff' }) + t(54, 78, '4 Ω 이상', { size: 12.5, fill: '#fca5a5', weight: 700 });
    [0, 1, 2].forEach(function (i) { var x = 140 + i * 116; s += box(x, 30, 76, 72, '#fff', C.ink, 6) + '<circle cx="' + (x + 38) + '" cy="58" r="16" fill="none" stroke="' + C.ink + '" stroke-width="2"/>' + t(x + 38, 94, '8 Ω', { size: 13, weight: 800 });
      s += '<path d="M' + (i ? x - 40 : 100) + ' 66H' + x + '" stroke="' + C.red + '" stroke-width="3"/>' + t(i ? x - 20 : 120, 124, i ? '링크' : '', { size: 12.5, fill: C.sub }); });
    s += t(240, 18, '스피커 세 대를 링크로 이었어요', { size: 14, weight: 800 });
    return pic(480, 132, s, '앰프 한 채널에 8 옴 스피커 세 대를 링크로 연결');
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
    lin: { x: 66, y: 306, kind: 'line', name: '액티브 스피커 LINE IN' },
    aIn: { x: 470, y: 128, cab: 'A', name: '스피커 A IN' }, aLk: { x: 570, y: 128, cab: 'A', name: '스피커 A LINK' },
    bIn: { x: 470, y: 312, cab: 'B', name: '스피커 B IN' }, bLk: { x: 570, y: 312, cab: 'B', name: '스피커 B LINK' }
  };
  var CAB_R = 8, AMP_MIN = 4;
  var TERM = { '1+': [-40, -36], '1-': [40, -36], '2+': [-40, 38], '2-': [40, 38] };
  var PLUG = { A: { cx: 170, cy: 196 }, B: { cx: 470, cy: 196 } };
  var AMPS = {
    small: { name: '앰프 ① (예시)', w: 100, note: '8 Ω 에서 100 W' },
    xli: { name: '앰프 ② (예시)', w: 330, note: '8 Ω 에서 330 W' },
    bridge: { name: '앰프 ③ (예시)', w: 900, note: '8 Ω 에서 900 W' }
  };
  var SPK = { name: '12인치 2웨이 패시브 (예시)', R: 8, cont: 200, prog: 400, peak: 800 };   // 2026-11-08: 흔한 12인치 2웨이 패시브를 본뜬 예시 숫자
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
    var scenes = [['wire', '① 두 대 잇기', '한 채널에 · Ω 보기'], ['pins', '② speakON 핀', '빨강 · 검정 선 놓기'], ['cable', '③ 케이블 굵기', '길이 · 줄어드는 힘'], ['match', '④ 앰프 고르기', '스피커 정격과 비교']];
    el.innerHTML =
      '<div class="sim-ps">' +
        '<div class="sim-ps-scenes" role="group" aria-label="실습 장면">' + scenes.map(function (s) { return '<button type="button" data-scene="' + s[0] + '" aria-pressed="' + (s[0] === S.scene) + '">' + s[1] + '<small>' + s[2] + '</small></button>'; }).join('') + '</div>' +
        '<div class="sim-ps-body">' +
          '<div class="sim-ps-view"><div class="sim-ps-scroll"><svg class="sim-ps-svg" data-role="svg" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif" role="application" aria-label="패시브 스피커 실습 화면"></svg></div><div class="sim-hint" data-role="hint"></div></div>' +
          '<div class="sim-side">' +
            // ① 연결
            '<div class="sim-ps-pane" data-pane="wire">' +
              '<div class="sim-box"><h4>스피커끼리 잇는 방법 <small>실습용</small></h4><div class="sim-types">' +
                '<label class="sim-type"><input type="radio" name="simPsMode" value="parallel" checked><span><b>링크 케이블 (나란히 · 병렬)</b><small>IN · LINK 가 안에서 나란히 — 보통 이렇게 이어요</small></span></label>' +
                '<label class="sim-type"><input type="radio" name="simPsMode" value="series"><span><b>한 줄로 (직렬 · 특수 배선)</b><small>앞 스피커 − 를 뒤 스피커 + 로 — 비교용</small></span></label></div>' +
                '<div class="sim-btns"><button type="button" class="sim-btn" data-act="resetWire">처음 상태로</button></div></div>' +
              '<div class="sim-box sim-read" data-role="readWire"></div></div>' +
            // ② 핀
            '<div class="sim-ps-pane" data-pane="pins" hidden>' +
              '<div class="sim-box sim-read" data-role="readPins"></div>' +
              '<div class="sim-box"><p class="sim-note" style="margin:0">두 스피커는 보통 패시브 스피커처럼 <b>1+ / 1−</b> 로 소리를 받아요. 빨강 = 앰프 +, 검정 = 앰프 − 예요.</p><div class="sim-btns"><button type="button" class="sim-btn" data-act="resetPins">처음 상태로</button></div></div></div>' +
            // ③ 케이블
            '<div class="sim-ps-pane" data-pane="cable" hidden>' +
              '<div class="sim-box"><h4>스피커 Ω (부하)</h4><div class="sim-types">' +
                '<label class="sim-type"><input type="radio" name="simPsR" value="8" checked><span><b>8 Ω — 스피커 1대</b><small>예: 12인치 2웨이 한 대</small></span></label>' +
                '<label class="sim-type"><input type="radio" name="simPsR" value="4"><span><b>4 Ω — 8 Ω 2대 나란히</b><small>링크로 두 대를 이었을 때</small></span></label></div></div>' +
              '<div class="sim-box"><h4>케이블 굵기 <small>구리선 저항: 표 값</small></h4><div class="sim-ps-gauges">' + GAUGES.map(function (g) { return '<label class="sim-type"><input type="radio" name="simPsG" value="' + g.g + '"' + (g.g === S.gauge ? ' checked' : '') + '><span><b>' + g.g + ' AWG</b><small>약 ' + g.mm + ' mm²</small></span></label>'; }).join('') + '</div>' +
                '<label class="sim-range" style="margin-top:8px"><span>케이블 길이 (한 방향) <output data-out="len"></output></span><input type="range" min="0" max="60" step="1" data-sim="len" aria-label="케이블 길이(m)"></label></div>' +
              '<div class="sim-box sim-read" data-role="readCable"></div></div>' +
            // ④ 매칭
            '<div class="sim-ps-pane" data-pane="match" hidden>' +
              '<div class="sim-box"><h4>스피커: 12인치 2웨이 패시브 <small>예시</small></h4><p class="sim-note" style="margin:0">8 Ω · 연속 200 W · 프로그램 400 W · 피크 800 W</p></div>' +
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
      s += box(14, 22, 200, 176, '#1f2937', '#0b0f14', 10) + T(114, 42, '실습 파워앰프 (예시)', { size: 12, weight: 800, fill: '#fff' }) + T(114, 60, '8 Ω · 4 Ω 까지 — 4 Ω 아래는 안 돼요', { size: 9.5, fill: '#fbbf24', weight: 700 });
      [['ch1', w.ch1], ['ch2', w.ch2]].forEach(function (c) { var p = PORTS[c[0]], st = c[1], col = w.short ? '#ef4444' : !st.n ? '#64748b' : st.ok ? '#22c55e' : '#ef4444';
        s += sock(p, c[0] === 'ch1' ? 'CH1 OUT' : 'CH2 OUT', col, st.n ? '부하 ' + ohm(st.load) : '연결 없음'); });
      s += T(114, 88, 'speakON 출력', { size: 9, fill: '#94a3b8' });
      // 액티브 스피커 (잘못 꽂힌 케이블 찾기용)
      s += box(14, 236, 200, 128, '#e5e7eb', '#94a3b8', 10) + T(114, 256, '액티브 스피커 뒷면', { size: 11.5, weight: 800 }) + T(114, 272, 'LINE IN 은 작은 소리(라인)만 받아요', { size: 9.5, fill: C.sub });
      var lp = PORTS.lin; s += '<circle cx="' + lp.x + '" cy="' + lp.y + '" r="17" fill="#fff" stroke="' + (w.lineDanger ? C.red : '#475569') + '" stroke-width="2.4"/><circle cx="' + (lp.x - 6) + '" cy="' + (lp.y - 4) + '" r="2.2" fill="#334155"/><circle cx="' + (lp.x + 6) + '" cy="' + (lp.y - 4) + '" r="2.2" fill="#334155"/><circle cx="' + lp.x + '" cy="' + (lp.y + 6) + '" r="2.2" fill="#334155"/>' + T(lp.x, lp.y + 32, 'LINE IN', { size: 10.5, weight: 800 }) + T(lp.x, lp.y + 45, 'XLR/TRS 콤보', { size: 9, fill: C.sub });
      if (w.lineDanger) s += box(100, 284, 108, 44, '#fef2f2', C.red, 6) + T(154, 302, '⚠ 앰프의 큰 힘이', { size: 10, weight: 800, fill: C.red }) + T(154, 318, 'LINE IN 에!', { size: 10, weight: 800, fill: C.red });
      else if (w.linePlug) s += T(154, 306, '스피커 케이블은 빼요', { size: 9.5, fill: C.amber, weight: 700 });
      // 스피커
      [['A', 22], ['B', 206]].forEach(function (c) { var y = c[1]; s += box(420, y, 204, 152, '#111827', '#000', 10) + T(522, y + 20, '패시브 스피커 ' + c[0] + ' · 8 Ω', { size: 12, weight: 800, fill: '#fff' }) + T(522, y + 36, 'IN · LINK 는 안에서 나란히', { size: 9.5, fill: '#94a3b8' }) +
        '<circle cx="452" cy="' + (y + 64) + '" r="14" fill="#374151" stroke="#4b5563" stroke-width="2"/><circle cx="452" cy="' + (y + 64) + '" r="5" fill="#6b7280"/>' + T(474, y + 68, '스피커 단자판', { size: 9.5, fill: '#cbd5e1', anchor: 'start' }); });
      ['aIn', 'aLk', 'bIn', 'bLk'].forEach(function (k) { s += sock(PORTS[k], /In$/.test(k) ? 'IN' : 'LINK', '#64748b'); });
      // 보관함
      s += '<rect x="226" y="300" width="182" height="72" rx="10" fill="#fff" stroke="#94a3b8" stroke-dasharray="6 4"/>' + T(317, 316, '케이블 보관함 · 끝을 끌어 꽂아요', { size: 9.5, fill: C.sub });
      if (w.short) s += box(222, 110, 186, 40, '#fef2f2', C.red, 6) + T(315, 127, '⚠ CH1 · CH2 출력이 서로 이어졌어요', { size: 10, weight: 800, fill: C.red }) + T(315, 142, '출력끼리는 잇지 않아요', { size: 9.5, fill: C.red });
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
      s += T(x0 + 6, yd(-0.5) + 15, '목표 −0.5 dB', { size: 10, fill: C.red, anchor: 'start', weight: 700 }) + T(x0, 18, '스피커 ' + S.R + ' Ω · 굵기별로 줄어드는 힘 (어림 계산)', { size: 11, fill: C.sub, anchor: 'start', weight: 700 });
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
      s += '<rect x="' + xw(SPK.cont) + '" y="24" width="' + (xw(SPK.prog) - xw(SPK.cont)) + '" height="196" fill="' + C.green + '" fill-opacity=".1"/>' + T((xw(200) + xw(400)) / 2, 18, '알맞은 칸 (연속 ~ 2배)', { size: 10, fill: C.green, weight: 800 });
      [0, 200, 400, 600, 800, 1000].forEach(function (w) { s += '<path d="M' + xw(w) + ' 24V220" stroke="#e2e8f0"/>' + T(xw(w), 236, w + ' W', { size: 10, fill: C.sub }); });
      [['연속', SPK.cont, C.teal], ['프로그램', SPK.prog, C.blue], ['피크', SPK.peak, C.violet]].forEach(function (r, i) { var y = 34 + i * 32;
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
      var w = R.w, h = '<h4>앰프가 보는 Ω (부하)</h4>';
      [['CH1', w.ch1], ['CH2', w.ch2]].forEach(function (c) { var st = c[1];
        h += row(c[0], st.n ? st.cabs.join(' + ') + ' · ' + ohm(st.load) : '연결 없음', st.n ? (st.ok ? 'ok' : 'bad') : '');
        if (st.n) h += row('　같은 전압일 때 힘', (st.load === 4 ? '8 Ω 한 대의 2배' : st.load === 16 ? '8 Ω 한 대의 ½' : '기준 (1배)')); });
      if (w.short) h += verdict('bad', '두 채널 출력이 스피커를 거쳐 서로 이어졌어요. 앰프 출력끼리는 절대 잇지 않아요.');
      else if (w.lineDanger) h += verdict('bad', '앰프 출력이 액티브 스피커 <b>LINE IN</b> 에 꽂혀 있어요. 큰 전기(수십 V)가 들어가 장비가 망가질 수 있어요. 케이블 끝을 끌어서 빼요.');
      else if (w.ch1.n === 2 || w.ch2.n === 2) { var c = w.ch1.n === 2 ? w.ch1 : w.ch2; h += verdict(c.ok ? 'ok' : 'bad', (S.mode === 'series' && w.cabCab ? '한 줄로(직렬): 8 + 8 = 16 Ω 이에요. 안전하지만 힘이 ¼ 이라 소리가 작아요.' : '나란히(병렬): 8 ÷ 2 = 4 Ω 이에요. 이 앰프가 견디는 4 Ω 안이에요.')); }
      else h += verdict('warn', '보관함의 케이블 끝을 끌어요. 앰프 CH OUT → 스피커 A IN, 스피커 A LINK → 스피커 B IN 으로 이어 봐요.');
      q('[data-role=readWire]').innerHTML = h;
    }
    function readPins() {
      var txt = { normal: ['정상', 'ok'], reversed: ['극성 반대', 'warn'], pin2: ['소리 안 남 (2±)', 'bad'], bad: ['회로 안 됨', 'bad'], open: ['덜 꽂힘', ''] }, h = '<h4>점검 결과</h4>';
      h += row('스피커 A', txt[R.pa][0], txt[R.pa][1]) + row('스피커 B', txt[R.pb][0], txt[R.pb][1]);
      var sa = R.pa === 'normal' || R.pa === 'reversed', sb = R.pb === 'normal' || R.pb === 'reversed';
      if (sa && sb) h += R.pa === R.pb ? verdict('ok', 'A · B 가 같은 극성이에요. 겹치는 곳에서 저음이 함께 밀어 줘요.') : verdict('warn', 'A · B 극성이 서로 달라요. 겹치는 곳에서 저음이 지워져요(상쇄). +/− 가 바뀐 케이블을 고쳐요.');
      else h += verdict('warn', '선 끝(동그라미)을 끌어 단자에 놓아요. 빨강(+) → 1+, 검정(−) → 1− 이 기본이에요.');
      q('[data-role=readPins]').innerHTML = h;
    }
    function readCable() {
      var c = R.c, g = gauge(S.gauge), ok1 = c.loss > -0.5, ok2 = c.df >= 20, h = '<h4>계산 결과 <small>교육용 근사</small></h4>';
      h += row('왕복 길이', (2 * S.len) + ' m') + row('케이블 저항', f2(g.r * 1000) + ' mΩ/m × ' + (2 * S.len) + ' m = ' + f2(c.rc) + ' Ω');
      h += row('손실', sgnDb(c.loss), ok1 ? 'ok' : 'bad') + row('댐핑 팩터 (케이블만)', isFinite(c.df) ? f1(c.df) : '—', ok2 ? 'ok' : 'warn') + row('케이블에서 열로 사라져 스피커에 덜 가는 힘', f1((1 - Math.pow(10, c.loss / 10)) * 100) + ' %');
      h += verdict(ok1 && ok2 ? 'ok' : ok1 ? 'warn' : 'bad', ok1 && ok2 ? '좋아요. 손실 0.5 dB 안, 댐핑 팩터 20 이상이에요.' : ok1 ? '손실은 괜찮아요. 하지만 댐핑 팩터가 20 보다 작아요. 더 굵은 케이블로 바꿔 봐요.' : '손실이 0.5 dB 를 넘어요. 더 굵은 케이블(AWG 숫자가 작은 것)을 골라요. 앰프를 스피커 가까이 둬도 돼요.');
      if (S.gauge === 10) h += '<p class="sim-note">참고: 10 AWG(약 5.3 mm²)는 흔한 speakON 커넥터(1.5–4 mm²)에 안 들어갈 수 있어요(이론 4 더 알아보기).</p>';
      q('[data-role=readCable]').innerHTML = h; q('[data-out=len]').textContent = S.len + ' m';
    }
    function readMatch() {
      var h = '<h4>판단 <small>이 과정의 기준</small></h4>';
      if (!S.amp) h += verdict('warn', '앰프를 하나 골라 봐요. 앰프 W(8 Ω)가 스피커 <b>연속 정격 ~ 2배</b> 사이면 알맞아요.');
      else { var a = AMPS[S.amp], r = a.w / SPK.cont; h += row('고른 앰프', a.w + ' W / 8 Ω') + row('연속 정격의', f1(r) + ' 배', r >= 1 && r <= 2 ? 'ok' : 'bad');
        h += S.amp === 'xli' ? verdict('ok', '알맞아요. 연속 200 W ~ 400 W 사이라 여유가 있어요. 그래도 CLIP 표시등을 보며 음량을 맞춰요.')
          : S.amp === 'small' ? verdict('bad', '앰프가 작으면 음량을 내려다 자주 <b>클리핑</b>돼요(파형이 잘림). 잘린 소리는 고음 드라이버를 뜨겁게 해요. 작은 앰프가 안전한 게 아니에요.')
          : verdict('bad', '연속 정격의 4.5배예요. 조금만 실수해도 스피커가 견디는 힘을 크게 넘어요. 리미터(크기를 막는 장치)로 꼭 막을 수 있을 때만 써요.'); }
      q('[data-role=readMatch]').innerHTML = h;
    }
    var HINT = { wire: '케이블 끝(색 동그라미)을 끌어 단자에 놓으면 꽂혀요. 꽂힌 끝을 끌어내면 빠져요. 손을 놓으면 결과가 나와요. (좁은 화면에서는 그림을 옆으로 밀어 봐요)', pins: 'NL4 플러그 뒤쪽 단자예요. 빨강 · 검정 선 끝을 끌어 단자(1+ · 1− · 2+ · 2−)에 놓아요.', cable: '굵기와 Ω 을 골라요. 아래 동그라미를 끌어 길이를 바꿔요(오른쪽 막대도 돼요). 손을 놓으면 결과가 나와요.', match: '오른쪽에서 앰프를 골라 스피커 정격과 비교해요.' };
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
    id: 'speaker-passive', path: 'hardware', no: 5, noLabel: '05-1', status: 'ready', level: '중급', minutes: 45, img: 'img/modules/speaker_passive_card.svg',   // 2026-11-08: 3층 스피커 사진 → 일반 패시브 스피커 그림
    title: '패시브 스피커', sub: '앰프의 힘을 받아 소리를 내는 스피커 — 구조 · 연결 · 앰프 · 케이블',
    topics: ['패시브와 액티브 · 2웨이와 3웨이', '임피던스(Ω) · 나란히 · 한 줄로', '파워 정격과 앰프 고르기', '스피커 케이블 굵기와 길이', 'speakON 핀과 극성', '서브우퍼와 바이앰프'],
    glanceDraft: {
      glance: [
        ['패시브 스피커', '안에 앰프가 없어 파워앰프에 이어 쓰는 스피커'],
        ['임피던스 (Ω)', '전기가 흐르기 어려운 정도 · 8 Ω 두 대를 나란히 이으면 4 Ω'],
        ['파워 정격', '스피커가 견디는 힘(W) · 오래 견디는 「연속」이 기준'],
        ['speakON', '앰프와 스피커를 잇는 잠금 커넥터 · 보통 1+ / 1− 핀']
      ],
      heroVis: 'psSystem'
    },
    overview: {
      lead: '<b>패시브 스피커</b>는 안에 앰프가 없는 스피커예요. 그래서 바깥의 <b>파워앰프</b>가 힘을 키워 줘야 소리가 나요. 이 과정에서는 스피커 속 구조, 잇는 방법, 앰프와 케이블 고르기를 차례로 배워요.',
      terms: [
        ['패시브 스피커', '안에 앰프가 없는 스피커예요. 손수레처럼 파워앰프가 밀어 줘야 소리가 나요.'],
        ['패시브 크로스오버', '통 안에서 소리를 높낮이별로 나누는 부품이에요. 저음은 우퍼로, 고음은 혼으로 보내요.'],
        ['드라이버 (우퍼 · 혼)', '소리를 내는 부품이에요. 큰 우퍼는 저음을, 나팔(혼)이 달린 드라이버는 고음을 맡아요.'],
        ['임피던스 (Ω)', '전기가 흐르기 어려운 정도예요. 스피커에 적힌 8 Ω 은 대표값(공칭)이에요.', 'psTermZ'],
        ['나란히(병렬) · 한 줄로(직렬)', '나란히 이으면 Ω 이 줄고(8 Ω 둘 → 4 Ω), 한 줄로 이으면 더해져요(→ 16 Ω).'],
        ['파워 정격', '스피커가 견디는 힘(W)이에요. 오래 견디는 「연속」 값을 기준으로 봐요.'],
        ['케이블 손실 · 댐핑 팩터', '가늘고 긴 선에서 힘이 줄어드는 게 손실이에요. 앰프가 콘을 꽉 잡는 정도는 댐핑 팩터예요.'],
        ['speakON (NL4 · NL2)', '앰프와 스피커를 잇는, 돌려서 잠그는 커넥터예요. 보통 1+ / 1− 핀으로 소리를 받아요.']
      ],
      points: [
        '8 Ω 두 대를 링크로 나란히 이으면 앰프는 <b>4 Ω</b> 을 봐요. 앰프가 견디는 Ω 아래로 내려가지 않게 해요.',
        '앰프는 스피커 <b>연속 정격 ~ 2배</b> 사이로 골라요. 너무 작은 앰프는 <b>클리핑</b>으로 오히려 위험해요.',
        '멀리 가면 <b>굵은 케이블</b>을 써요. 앰프의 스피커 출력은 꼭 <b>패시브 스피커에만</b> 꽂아요.'
      ],
      model: 'dbspk'   // 2026-11-08: 새 일반 모델은 assets3d/generic_passive_speakers_model.js(GenericPassiveSpk) — modules.js 연결은 메인 작업자가 함
    },
    theory: [
      { title: '패시브 스피커와 파워앰프', visual: 'psSystem',
        pics: [{ v: 'psInside', cap: '흔한 12인치 2웨이 패시브 스피커 속이에요. 앰프에서 온 힘이 speakON 으로 들어와요. 크로스오버가 나눠서 우퍼와 고음 드라이버로 보내요.' }],
        body: '손수레는 혼자 못 가요. 누가 밀어 줘야 해요. <b>패시브 스피커</b>도 같아요. 안에 앰프가 없어서 혼자서는 소리를 못 내요. 콘솔에서 나온 소리는 1 V 안팎(건전지 하나쯤)으로 작아요. 바깥의 <b>파워앰프</b>가 이 힘을 크게 키워서 보내 줘요. 통 안의 <b>크로스오버</b>는 소리를 높낮이별로 나눠요. 낮은 소리는 큰 <b>우퍼</b>로 가요. 높은 소리는 나팔 모양 <b>혼</b>이 달린 고음 드라이버로 가요. 둘로 나누면 <b>2웨이</b>, 셋으로 나누면 <b>3웨이</b>예요. 그래서 패시브 스피커 뒤에는 전원 단자가 없어요. 대신 앰프와 잇는 speakON 단자가 있어요. 기억할 한 줄: 「앰프는 바깥에, 나누기는 통 안에」.',
        more: '<ul><li><b>드라이버</b>는 소리를 내는 부품이에요. 스피커 한 통에 드라이버가 여러 개 들어 있기도 해요.</li> <li><b>우퍼</b>: 고깔 모양 콘 드라이버예요. 공연용 저음 드라이버는 보통 10 · 12 · 15인치예요(교재 6장).</li> <li><b>컴프레션 드라이버 + 혼</b>: 공연용 스피커의 고음을 맡아요. 혼은 소리를 멀리, 원하는 방향으로 보내 줘요(교재 6장).</li> <li><b>돔 트위터</b>: 반구 모양 진동판이에요. 넓게 퍼지지만 크게 내기 어려워 집 · 스튜디오용에 주로 써요(교재 6장).</li> <li><b>2웨이</b> 예: 12인치 우퍼 + 고음 컴프레션 드라이버예요. 가장 흔한 구조예요.</li> <li><b>3웨이</b>: 저음 · 중음 · 고음 드라이버가 따로 있어요. 나누는 곳이 두 곳이에요.</li> <li><b>패시브 크로스오버(네트워크)</b>: 코일 · 콘덴서 같은 부품으로 만든 회로예요. 앰프가 키운 큰 신호를 나눠요(교재 6장 · 16장).</li> <li>패시브 크로스오버가 없는 스피커도 있어요. 이때는 앰프 앞에서 나누는 액티브 크로스오버를 써요(교재 6장).</li> <li>그런 스피커는 고음 드라이버를 지키는 작은 패시브 부품만 넣기도 해요(교재 6장).</li> <li><b>통(인클로저)</b>: 콘 뒤에서 나온 소리가 앞소리를 지우지 않게 막아 줘요. 구멍(포트)을 뚫어 저음을 보태는 통도 많아요(교재 6장).</li> <li><b>「풀레인지」</b>: 원래 드라이버 하나짜리를 뜻했어요. 요즘은 서브우퍼 없이 저음 위 소리를 다 내는 2웨이 · 3웨이도 풀레인지라고 불러요.</li> <li>공연용 풀레인지 스피커는 대개 60 Hz ~ 18 kHz 쯤을 내요(교재 6장).</li> <li><b>프로세서가 든 앰프</b>: 스피커 회사가 자기 스피커에 맞춘 설정(프리셋)을 앰프에 넣어 두기도 해요. 이때는 앰프에서 그 스피커 이름의 설정을 골라요.</li> <li>이런 스피커는 제조사가 권하는 앰프 · 설정대로 써요(교재 15장 · 04-2 「디지털 앰프」).</li> <li>액티브 스피커와의 차이 · 소리가 퍼지는 범위(커버리지)는 05-2 「액티브 스피커」에서 배워요.</li></ul>',
        check: { q: '패시브 스피커 뒤에 전원 단자가 없어요. 소리를 내려면?', options: [
          { t: '파워앰프의 스피커 출력에 이어요', ok: true, why: '맞아요. 안에 앰프가 없어서 바깥 앰프가 힘을 줘야 해요.' },
          { t: '콘솔 출력에 바로 이어요', why: '아니에요. 콘솔 소리는 너무 작아서 스피커를 거의 못 움직여요.' },
          { t: '전원 케이블만 꽂아요', why: '아니에요. 패시브 스피커에는 전원 단자가 없어요. 앰프가 힘을 줘요.' }] } },
      { title: '임피던스(Ω)와 연결 — 나란히 · 한 줄로', visual: 'psLoad',
        pics: [{ v: 'psSeriesPar', cap: '두 대씩 한 줄로 묶고, 그 두 줄을 다시 나란히 이으면 네 대를 써도 8 Ω 이에요(직 · 병렬, 교재 6장).' }, { v: 'psPizza', cap: '나란히 이은 스피커는 앰프의 힘을 나눠 가져요. Ω 이 같으면 똑같이, 다르면 Ω 이 낮은 쪽이 더 많이 받아요(교재 6장).' }],
        body: '호스가 좁으면 물이 잘 안 흘러요. 스피커도 전기가 흐르기 어려운 정도가 있어요. 이것을 <b>임피던스</b>라고 하고, 단위는 <b>Ω(옴)</b>이에요. 흔한 스피커는 <b>8 Ω</b> 이에요. 앰프 한 채널에 스피커를 여러 대 이으면 Ω 이 바뀌어요. <b>나란히(병렬)</b> 이으면 Ω 이 줄어요. 8 Ω 두 대는 4 Ω 이에요. <b>한 줄로(직렬)</b> 이으면 Ω 이 더해져요. 8 Ω 두 대는 16 Ω 이에요. 스피커 뒤 링크 단자로 다음 스피커를 이으면 나란히가 돼요. Ω 이 너무 낮으면 앰프가 뜨거워지거나 소리가 끊겨요. 기억할 한 줄: 「나란히 이을수록 Ω 이 낮아지니, 앰프가 견디는 Ω 까지만」.',
        more: '<ul><li><b>같은 스피커 n대를 나란히</b> = R ÷ n 이에요. 8 Ω 2대 = 4 Ω, 3대 ≈ 2.7 Ω, 4대 = 2 Ω.</li> <li><b>한 줄로</b>는 더하기예요(8 + 8 = 16 Ω).</li> <li><b>공칭 임피던스</b>는 스피커에 적힌 대표값이에요. 실제 Ω 은 소리 높낮이마다 오르내려요.</li> <li>교재는 재생 범위에서 가장 낮은 값을 공칭 임피던스로 봐요(교재 6장).</li> <li>흔한 스피커는 8 Ω 이고, 4 ~ 16 Ω 인 스피커도 있어요(교재 6장). 그래서 계산 전에 라벨 · 설명서를 꼭 봐요.</li> <li>많은 패시브 스피커는 뒷면 speakON 두 개가 안에서 나란히 이어져 있어요. 하나는 앰프에서 받고, 하나는 다음 스피커로 보내요(링크).</li> <li><b>한 줄로의 단점</b>: 특수 배선이 필요하고, 한 대가 끊기면 둘 다 꺼져요.</li> <li>같은 앰프 전압이면 16 Ω 은 4 Ω 보다 힘이 ¼ 이에요(P = V² ÷ R). 이 과정에서는 비교용으로만 다뤄요.</li> <li>앰프 전압이 30 V 라면 8 Ω 에서 약 112 W, 4 Ω 에서 225 W 예요. Ω 이 낮으면 힘이 커지는 대신 앰프가 더 힘들어요(교재 6장).</li> <li><b>직 · 병렬 (교재 6장)</b>: 두 대씩 한 줄로 묶은 것을 다시 나란히 이어요. 8 Ω 네 대가 (8 + 8) ÷ 2 = 8 Ω 이 돼요.</li> <li><b>힘 나누기 (교재 6장)</b>: 앰프 400 W 를 8 Ω 네 대가 나란히 나누면 한 대에 100 W 예요.</li> <li>Ω 이 다른 스피커를 섞으면 Ω 이 낮은 쪽이 더 많이 받아요.</li> <li><b>채널당 4 Ω (교재 15장)</b>: 많이 나란히 이으면 앰프가 스피커를 붙잡는 힘이 약해져 소리가 나빠져요. 오래 크게 쓰면 앰프도 뜨거워져요.</li> <li>그래서 보통 채널당 4 Ω 아래로 내리지 않아요(교재 15장).</li> <li>제조사가 「한 채널에 몇 대까지」를 정해 두기도 해요. 그 숫자를 지키는 것이 가장 확실해요.</li> <li>앰프 쪽 정격과 낮은 Ω 의 위험은 04-1 「아날로그 앰프」에서 자세히 배웠어요.</li></ul>',
        check: { q: '8 Ω 스피커 2대를 링크로 이었어요. 앰프가 보는 Ω 은?', options: [
          { t: '4 Ω', ok: true, why: '맞아요. 링크는 나란히(병렬)라서 8 ÷ 2 = 4 Ω 이에요.' },
          { t: '16 Ω', why: '아니에요. 16 Ω 은 한 줄로(직렬) 이었을 때예요.' },
          { t: '8 Ω 그대로', why: '아니에요. 나란히 더 이으면 Ω 이 낮아져요.' }] } },
      { title: '파워 정격 읽기와 앰프 고르기', visual: 'psPower',
        pics: [{ v: 'psClip', cap: '앰프 힘이 모자라면 소리 위아래가 잘려요(클리핑). 원래 없던 고음이 생겨서 고음 드라이버가 뜨거워져요.' }, { v: 'psSensitivity', cap: '감도는 1 W 를 넣고 1 m 앞에서 잰 소리 크기예요. 감도가 6 dB 낮으면 같은 크기에 힘이 4배 필요해요(숫자는 예시).' }],
        body: '가방은 오래 멜 수 있는 무게와 잠깐 들 수 있는 무게가 달라요. 스피커도 견디는 힘(W, 와트)이 두세 가지로 적혀 있어요. <b>연속(RMS)</b>은 오래 견디는 힘이에요. 가장 중요한 기준이에요. <b>프로그램</b>은 보통 연속의 2배예요. <b>피크</b>는 아주 잠깐만 견디는 힘이에요. 앰프는 같은 Ω 에서 잰 W 끼리 비교해요. 교재는 앰프 힘을 연속 정격의 2배(프로그램) 쯤으로 고르라고 해요. 앰프가 너무 작아도 위험해요. 끝까지 올리면 소리 위아래가 잘리는 <b>클리핑</b>이 생겨요. 클리핑은 고음 드라이버를 뜨겁게 해요. 기억할 한 줄: 「연속 정격을 보고, 연속 ~ 2배 사이 앰프를 골라요」.',
        more: '<ul><li><b>정격허용입력 (교재 6장)</b>: 스피커가 일정 시간 견디는 가장 큰 힘이에요. 핑크 노이즈(쉬익 하는 시험 소리)를 1시간 넣어서 재요.</li> <li>교재는 순간 최대 허용입력(피크)을 정격의 4배로 적어요. 예: 정격 300 W → 순간 최대 1,200 W.</li> <li><b>AES 방식 (B&C Speakers)</b>: 정해진 핑크 노이즈를 2시간 넣어 재요.</li> <li>이 시험 소리의 크레스트 팩터(가장 큰 순간과 평균의 차이)는 6 dB 예요.</li> <li>「프로그램 정격」은 보통 AES 정격의 2배로 적어요. B&C 는 클리핑 없이 쓸 때 권하는 앰프 크기라고 안내해요.</li> <li>회사마다 재는 시험 소리 · 시간 · 기준이 달라요. 「800 W 피크」끼리 비교해도 같은 뜻이 아닐 수 있어요.</li> <li><b>앰프 고르기 (교재 15장)</b>: 앰프 출력은 같은 Ω 에서 정격의 2배인 프로그램 파워를 기준으로 해요.</li> <li>이 과정의 실습은 「연속 ~ 2배」 사이를 알맞은 칸으로 봐요(교육용 기준).</li> <li>프로세서가 든 전용 앰프를 쓰는 스피커는 제조사가 권하는 앰프 · 설정을 따라요(교재 15장).</li> <li><b>EAW</b>: 앰프가 작다고 안전한 게 아니에요. 작은 앰프는 쉽게 클리핑돼요.</li> <li>클리핑되면 더 낮은 음량에서도 열 때문에 고장 날 수 있어요(EAW).</li> <li>B&C 는 앰프를 자주 한계까지 몰아 클리핑시킨다면, 앰프가 스피커 AES 정격보다 작아야 한다고도 해요.</li> <li><b>클리핑</b>: 앰프 힘이 모자라 소리 파형 위아래가 잘리는 거예요. 평균 힘이 올라가고, 원래 없던 고음 성분이 생겨요(EAW).</li> <li>찬양 중 CLIP 표시등이 계속 켜지면 음량을 줄여요. 그 음량이 꼭 필요하면 더 알맞은 앰프 · 스피커를 써요.</li> <li><b>감도 (교재 6장)</b>: 스피커에 1 W 를 넣고 1 m 앞에서 잰 소리 크기(dB)예요. 8 Ω 스피커라면 2.83 V 를 넣어요.</li> <li>감도가 높으면 같은 힘으로 더 크게 나요. 그래도 감도가 높다고 더 좋은 스피커는 아니에요(교재 6장).</li> <li>힘을 2배로 늘려도 소리는 3 dB 만 커져요. 그래서 감도 3 dB 차이는 앰프 힘 2배와 맞먹어요.</li></ul>',
        check: { q: '연속 200 W · 프로그램 400 W 스피커(8 Ω)예요. 알맞은 앰프는?', options: [
          { t: '8 Ω 에서 330 W', ok: true, why: '맞아요. 연속 ~ 2배 사이라 여유가 있어요. 클리핑 없이 쓰기 쉬워요.' },
          { t: '8 Ω 에서 100 W', why: '아니에요. 작은 앰프는 쉽게 클리핑돼요. 고음 드라이버에 더 위험해요.' },
          { t: '8 Ω 에서 900 W', why: '아니에요. 연속 정격의 4.5배예요. 실수 한 번에 스피커가 망가질 수 있어요.' }] } },
      { title: '스피커 케이블 — 굵기와 길이', visual: 'psCable',
        pics: [{ v: 'psHose', cap: '길고 가는 호스에서 물살이 약해지듯, 길고 가는 케이블에서는 스피커로 가는 힘이 줄어요.' }, { v: 'psDfShare', cap: '앰프 사양표의 댐핑 팩터(예: 500)는 앰프만 잰 값이에요. 케이블 저항이 더해지면 훨씬 작아져요. 그래서 케이블 굵기가 중요해요.' }],
        body: '긴 호스로 물을 뿌리면 끝에서 물살이 약해져요. 스피커 케이블도 같아요. 선이 길고 가늘수록 힘이 길에서 사라지는 <b>손실</b>이 커져요. 전기는 + 선으로 갔다가 − 선으로 돌아와요. 그래서 길이는 <b>왕복(2배)</b>으로 생각해요. 굵기는 <b>AWG</b> 숫자로 적는데, 숫자가 <b>작을수록 굵어요</b>. 손실은 <b>0.5 dB</b>(귀로 거의 모르는 차이) 안이면 충분해요. 선이 굵고 짧으면 앰프가 스피커 진동판(콘)을 꽉 붙잡아요. 그 정도를 <b>댐핑 팩터</b>라고 하고, 20 이상이면 충분해요. 스피커를 나란히 많이 달수록 더 굵은 케이블이 필요해요. 가장 좋은 방법은 앰프를 스피커 가까이 두는 거예요. 기억할 한 줄: 「멀면 굵게, 가능하면 가깝게」.',
        more: '<ul><li><b>계산 ①</b> 왕복 저항 = 2 × 길이(m) × 1 m 당 저항(Ω).</li> <li><b>계산 ②</b> 손실(dB) = 20 × log(스피커 Ω ÷ (스피커 Ω + 왕복 저항)). log 는 계산기의 log 버튼이에요.</li> <li><b>계산 ③</b> 댐핑 팩터 ≈ 스피커 Ω ÷ 왕복 저항. 라이브 음향에서는 20 이상이면 충분하다고 봐요(EAW).</li> <li><b>구리선 1 m 당 저항(표 값)</b>: 18 AWG 약 20.9 mΩ, 16 AWG 약 13.2 mΩ, 14 AWG 약 8.3 mΩ.</li> <li>12 AWG 약 5.2 mΩ, 10 AWG 약 3.3 mΩ 이에요. mΩ(밀리옴)은 1000분의 1 Ω 이에요.</li> <li><b>AWG 와 mm²</b>: 12 AWG ≈ 3.3 mm², 14 AWG ≈ 2.1 mm² 예요. 국내에서는 mm²(SQ)로 적는 경우가 많아요.</li> <li><b>예(어림)</b>: 8 Ω 한 대, 30 m, 12 AWG → 왕복 저항 ≈ 0.31 Ω, 손실 ≈ −0.33 dB, 댐핑 팩터 ≈ 26.</li> <li>같은 길이에 14 AWG 면 손실 ≈ −0.52 dB 로 목표를 조금 넘어요.</li> <li>4 Ω(두 대 나란히), 30 m, 14 AWG → 손실 ≈ −1.0 dB. Ω 이 낮으면 같은 케이블에서도 손실이 커져요.</li> <li><b>앰프 사양표의 댐핑 팩터 (교재 6장)</b>: 스피커 Ω 을 앰프 출력 임피던스로 나눈 값이에요. 앰프만 잰 값이라 500 이상처럼 커요.</li> <li>실제로는 케이블 저항이 더해져서 훨씬 작아져요. 그래서 이 과정에서는 케이블까지 넣어 계산해요.</li> <li><b>EAW</b>: 케이블이 15 m(50 ft)를 넘으면 댐핑은 앰프보다 케이블 저항이 주로 정해요. 그래서 댐핑 팩터를 먼저 보고 케이블을 고르라고 해요.</li> <li><b>ProSoundWeb</b>: 손실이 0.5 dB 이내면 충분하다고 봐요.</li> <li><b>교재 (5장 · 15장)</b>: 앰프를 스피커 가까이 두고, 충분히 굵은 케이블을 써요.</li> <li><b>커넥터도 확인해요</b>: speakON 케이블 커넥터마다 물리는 선 굵기가 정해져 있어요.</li> <li>예: 흔한 4핀 커넥터(Neutrik NL4FXX-W-L)는 선 굵기 1.5–4 mm²(17–11 AWG)까지 물려요.</li> <li>이 커넥터의 케이블 바깥 지름은 10–16 mm, 최대 전류는 37 A rms 예요.</li> <li>2핀 커넥터(NL2FX, 판매처 사양)는 16–12 AWG, 접점당 40 A rms 예요. A(암페어)는 흐르는 전기의 양이에요.</li> <li>그래서 10 AWG(약 5.3 mm²) 같은 아주 굵은 선은 흔한 커넥터에 안 들어갈 수 있어요. 아주 멀면 앰프를 가까이 두는 방법도 생각해요.</li> <li>이 계산은 공칭 임피던스로 한 <b>어림값</b>이에요. 앰프 출력 임피던스와 온도 변화는 뺐어요.</li></ul>',
        check: { q: '30 m 케이블에 스피커를 1대에서 2대(나란히)로 늘렸어요. 손실은?', options: [
          { t: '커져요 — Ω 이 낮아져서요', ok: true, why: '맞아요. Ω 이 낮을수록 같은 케이블 저항이 더 크게 느껴져요.' },
          { t: '작아져요 — 힘이 나뉘어서요', why: '아니에요. 반대예요. Ω 이 낮으면 케이블 영향이 더 커져요.' },
          { t: '길이가 같으니 그대로예요', why: '아니에요. 케이블은 같아도 스피커 Ω 이 바뀌어 손실이 달라져요.' }] } },
      { title: 'speakON 핀과 극성', visual: 'psSpeakon',
        pics: [{ v: 'psCart', cap: '두 스피커 콘이 같은 쪽으로 밀면 소리가 더해져요. 서로 반대로 밀면 겹치는 곳에서 저음이 지워져요.' }],
        body: '두 사람이 수레를 같은 쪽으로 밀면 잘 굴러가요. 서로 반대로 밀면 꿈쩍도 안 해요. 스피커 두 대도 같은 쪽으로 밀어야 해요. 이 미는 방향을 <b>극성</b>이라고 해요. 앰프와 스피커는 보통 <b>speakON</b>(돌려서 잠그는 커넥터)으로 이어요. 4핀 <b>NL4</b> 에는 1+ · 1− · 2+ · 2− 핀이 있어요. 보통 패시브 스피커는 <b>1+ / 1−</b> 로 소리를 받아요. 케이블을 만들 때는 앰프 + → 1+, 앰프 − → 1− 로 이어요. +와 −가 바뀌면 극성이 반대가 돼요. 그러면 두 소리가 겹치는 곳에서 저음이 지워지는 <b>상쇄</b>가 생겨요. 기억할 한 줄: 「빨강(+)은 1+, 검정(−)은 1−」.',
        more: '<ul><li><b>NL2</b> 는 1+ · 1− 두 핀이에요. NL2 플러그는 NL4 소켓에 꽂히고 1± 에 닿아요(Neutrik).</li> <li>반대로 NL2 소켓(장비에 붙은 2핀)에는 NL4 플러그가 맞지 않아요(Neutrik).</li> <li><b>2± 핀</b>: 같은 4심 케이블로 다른 신호를 보낼 때 써요. 예: 바이앰프 스피커의 고음, 서브우퍼용 신호.</li> <li>어떤 핀을 쓰는지는 스피커 설명서를 꼭 봐요.</li> <li><b>앰프 쪽 핀도 확인해요</b>: 어떤 2채널 앰프는 CH1 단자의 2± 핀에 CH2 가 나와요(04-1).</li> <li>그래서 1± 만 쓰는 스피커에는 CH1 만 들어가요.</li> <li>4심 케이블을 1± 만 쓰는 스피커에 쓸 때도, 2± 선을 끊지 말고 같은 번호로 이어 둬요. 나중에 그대로 쓸 수 있어요.</li> <li>「+」는 같은 극(높은 쪽), 「−」는 반대 극이에요.</li> <li><b>극성 확인</b>: 극성 검사기나 측정 프로그램으로 확인해요.</li> <li>건전지를 대어 콘이 나오는지 보는 방법은 우퍼에만 통해요. 고음 드라이버는 진동판이 아주 조금만 움직여서 알 수 없어요(ProSoundWeb).</li> <li>선 색깔 표시도 늘 믿을 수는 없어요.</li> <li>새 케이블은 쓰기 전에 케이블 테스터로 확인해요. 양 끝 번호가 같은지, 선끼리 붙지(단락) 않았는지 봐요.</li> <li>케이블 양 끝에는 같은 번호표를 붙여요.</li> <li>극성이 반대일 때 소리가 지워지는 모습은 05-2 「액티브 스피커」 실습 ③ 에서 볼 수 있어요.</li></ul>',
        check: { q: '새 NL4 케이블을 만들어요. 앰프 + 선과 − 선은 어디에?', options: [
          { t: '+ → 1+, − → 1−', ok: true, why: '맞아요. 보통 패시브 스피커는 1+ / 1− 로 소리를 받아요.' },
          { t: '+ → 2+, − → 2−', why: '아니에요. 1± 만 쓰는 스피커라면 소리가 안 나요.' },
          { t: '+ → 1−, − → 1+', why: '아니에요. 소리는 나지만 극성이 반대예요. 겹치는 곳에서 저음이 지워져요.' }] } },
      { title: '서브우퍼와 바이앰프 — 저음은 따로', visual: 'psProtect',
        body: '합창에서 베이스 파트가 든든하면 노래 전체가 든든해져요. 스피커도 아주 낮은 저음을 따로 맡기면 좋아요. 이런 스피커가 <b>서브우퍼</b>예요. 보통 18인치처럼 큰 우퍼가 든 무거운 통이에요. 서브우퍼는 대략 100 Hz(1초에 100번 떨림) 아래를 맡아요. 위쪽 스피커는 그 위를 맡아요. 나누는 일은 보통 앰프 앞의 <b>프로세서</b>(소리를 나누고 다듬는 장치)가 해요. 그래서 서브우퍼는 보통 앰프 채널을 따로 써요. 2웨이 스피커의 저음과 고음에 앰프를 따로 쓰는 방식도 있어요. 이것을 <b>바이앰프</b>라고 해요. 바이앰프에서는 고음 쪽에 저음이 가지 않게 꼭 앞에서 나눠요. 기억할 한 줄: 「저음은 따로, 나누기는 앰프 앞에서」.',
        more: '<ul><li><b>서브우퍼 (교재 6장)</b>: 보통 30 ~ 100 Hz 쯤을 맡아요.</li> <li>무대음향에서는 중고음보다 10 dB 넘게 큰 저음이 필요할 때가 많아요. 그래서 서브우퍼는 견디는 힘과 소리 크기를 크게 만들어요(교재 6장).</li> <li>서브우퍼는 크고 무거워서 보통 바닥에 둬요. 라인 어레이와 함께 매다는 서브도 있어요(교재 6장).</li> <li><b>서브 자리 (교재 15장)</b>: 바닥에 둘 때는 가장 가까운 자리와 거리를 둬요. 그래야 앞뒤 저음 차이가 줄어요.</li> <li>무대 좌우에 한 대씩 두면, 두 저음이 서로 지워지는 자리가 객석에 생길 수 있어요(교재 15장).</li> <li>서브 위에 기둥(폴)을 꽂고 위쪽 스피커를 올려 쓰기도 해요. 폴 · 소켓이 견디는 무게를 꼭 확인해요.</li> <li><b>위쪽 스피커의 HPF</b>: 서브와 함께 쓰면 위쪽 스피커에 낮은 소리를 걸러 내는 필터(HPF)를 걸어요. 위쪽 스피커가 덜 힘들어져요.</li> <li><b>바이앰프 모드</b>: 어떤 패시브 스피커는 스위치로 패시브 모드와 바이앰프 모드를 바꿔요.</li> <li>바이앰프 모드에서는 저음을 1±, 고음을 2± 로 따로 받는 경우가 많아요(제조사 설명서 예).</li> <li>바이앰프 모드에서는 통 안의 크로스오버를 쓰지 않아요. 고음 드라이버에 저음이 들어가면 망가질 수 있어요.</li> <li><b>패시브 · 액티브 크로스오버 (교재 16장)</b>: 패시브는 앰프 한 채널로 여러 드라이버를 울려서 값이 싸요. 대신 세밀하게 맞추기 어렵고, 힘이 조금 줄어요.</li> <li>앰프 앞에서 나누는 액티브(바이앰프)는 앰프 채널과 프로세서가 더 필요해요. 대신 드라이버마다 세밀하게 맞출 수 있어 소리에 유리해요(교재 16장).</li> <li>저음이 스피커가 감당할 수 있는 것보다 많으면, 콘이 한계를 넘어 움직여서 고장 날 수도 있어요(EAW).</li> <li>무대 쪽으로 가는 저음을 줄이는 서브 배치(카디오이드)는 05-2 「액티브 스피커」에서 볼 수 있어요.</li></ul>',
        check: { q: '바이앰프 모드로 바꾸고 앞에서 나누지 않았어요. 무엇이 위험할까요?', options: [
          { t: '고음 드라이버에 저음이 들어가요', ok: true, why: '맞아요. 고음 드라이버는 저음을 견디지 못해 망가질 수 있어요. 꼭 앰프 앞에서 나눠요.' },
          { t: '서브우퍼 소리가 커져요', why: '아니에요. 서브와는 상관없어요. 고음 드라이버가 위험해져요.' },
          { t: '아무 일도 없어요', why: '아니에요. 바이앰프 모드에서는 통 안의 나누기가 꺼져요. 앞에서 나눠야 해요.' }] } }
    ],
    practice: {
      kind: 'passiveRig',
      lead: '네 장면에서 직접 해 봐요. ① 스피커 두 대를 앰프 한 채널에 이어요. ② speakON 핀에 빨강 · 검정 선을 놓아요. ③ 케이블 굵기와 길이를 골라요. ④ 스피커에 맞는 앰프를 골라요.',
      note: '스피커 · 앰프 숫자는 흔한 장비를 본뜬 예시예요. 스피커는 8 Ω · 연속 200 W, 앰프는 100 · 330 · 900 W 예요. 구리선 저항은 표 값이에요. 손실과 댐핑 팩터는 교육용으로 어림한 값이에요. 「연속 ~ 2배」도 교육용 기준이에요. 잘못된 연결은 이 화면에서만 해 봐요. 실제 장비로는 하지 마세요.',
      tasks: [
        { id: 'load', title: '두 대를 한 채널에 — 안전한 Ω', text: '① 장면에서 케이블 끝을 끌어 이어요. 앰프 CH OUT → 스피커 A IN, A LINK → 스피커 B IN 이에요. 한 채널에 두 대가 4 Ω 이상으로 이어지면 성공이에요.' },
        { id: 'lineIn', title: '잘못 꽂힌 케이블 빼기', text: '① 장면에서 앰프 출력이 액티브 스피커 LINE IN 에 꽂혀 있어요. 그 끝을 끌어서 빼요. 앰프 출력이 패시브 스피커에만 이어지면 성공이에요.' },
        { id: 'pins', title: 'speakON 1+ / 1− 배선', text: '② 장면 케이블 A 에서 선 끝을 끌어요. 빨강(+)은 1+, 검정(−)은 1− 에 놓으면 성공이에요.' },
        { id: 'polarity', title: '극성 반대 고치기', text: '② 장면의 케이블 B 는 소리는 나는데 저음이 이상해요. 바뀐 선을 찾아 바로 놓으면 성공이에요.' },
        { id: 'cable', title: '30 m 케이블 굵기 고르기', text: '③ 장면에서 8 Ω, 길이 30 m 이상으로 맞춰요. 손실 0.5 dB 안 · 댐핑 팩터 20 이상인 굵기를 고르면 성공이에요.' },
        { id: 'match', title: '정격에 맞는 앰프 고르기', text: '④ 장면에서 앰프를 하나 골라요. 스피커 연속 200 W ~ 2배(400 W) 사이 앰프면 성공이에요.' }
      ],
      links: [
        { title: '장비 브랜드 알아보기 · 스피커', text: '현장에서 자주 만나는 스피커 회사와 대표 제품을 살펴봐요.', go: { tab: 'tabBrands' } },
        { title: '확성 시스템의 기본 · 3D 실습 ③', text: '앰프의 speakON 출력에 패시브 스피커를 이어 소리를 내 봐요.', go: { tab: 'tab1', card: 's3' } }
      ]
    },
    quiz: [
      { q: '「4 Ω 이상」 앰프에 8 Ω 세 대를 링크로 이었어요. 어떻게 될까요?', visual: 'psQuizChain', options: [
        { t: '약 2.7 Ω — 너무 낮아 위험해요', ok: true, why: '맞아요. 8 ÷ 3 ≈ 2.7 Ω 이에요. 다른 채널로 나눠 이어요.' },
        { t: '24 Ω — 소리가 작아져요', why: '아니에요. 24 Ω 은 한 줄로(직렬) 이었을 때예요. 링크는 나란히예요.' },
        { t: '많을수록 앰프가 편해요', why: '아니에요. 나란히 더 달면 Ω 이 낮아져 앰프가 더 힘들어요.' }] },
      { q: '스피커에 「800 W 피크」라고 적혀 있어요. 무슨 뜻일까요?', options: [
        { t: '아주 잠깐만 견디는 힘이에요', ok: true, why: '맞아요. 앰프를 고를 때는 연속 정격을 기준으로 봐요.' },
        { t: '늘 800 W 를 넣어도 돼요', why: '아니에요. 늘 넣을 수 있는 힘은 연속 정격이에요.' },
        { t: '가장 큰 소리 크기(dB)예요', why: '아니에요. W 는 받는 전기의 힘이에요. 소리 크기는 dB SPL 로 따로 적어요.' }] },
      { q: '앰프에서 스피커까지 40 m 라서 손실이 커요. 어떻게 할까요?', options: [
        { t: '굵은 선을 쓰거나 앰프를 가까이 둬요', ok: true, why: '맞아요. 왕복 저항이 줄어 손실이 줄고 댐핑 팩터가 커져요.' },
        { t: '스피커를 한 대 더 나란히 달아요', why: '아니에요. Ω 이 낮아져 손실이 더 커져요.' },
        { t: 'AWG 숫자가 큰 선으로 바꿔요', why: '아니에요. AWG 숫자가 클수록 가늘어서 손실이 커져요.' }] },
      { q: 'NL2 플러그를 앰프의 NL4 소켓에 꽂으면?', options: [
        { t: '꽂히고 1+ / 1− 에 이어져요', ok: true, why: '맞아요. NL2 플러그는 NL4 소켓에 맞아요. 반대(NL4 플러그 → NL2 소켓)는 안 맞아요.' },
        { t: '2+ / 2− 에 이어져요', why: '아니에요. NL2 는 1+ / 1− 두 핀뿐이에요.' },
        { t: '모양이 달라 안 꽂혀요', why: '아니에요. 안 맞는 건 NL4 플러그 → NL2 소켓이에요.' }] },
      { q: '앰프 스피커 출력을 액티브 스피커 LINE IN 에 꽂으면?', options: [
        { t: '큰 전기가 들어가 장비가 망가질 수 있어요', ok: true, why: '맞아요. 앰프 출력은 수십 V 예요. 패시브 스피커에만 이어요.' },
        { t: '소리가 조금 커질 뿐이에요', why: '아니에요. LINE IN 은 1 V 안팎의 작은 소리용이에요. 앰프 출력은 너무 커요.' },
        { t: '패시브 스피커처럼 동작해요', why: '아니에요. 액티브 스피커에는 앰프 출력을 받는 입력이 없어요.' }] }
    ],
    missions: [
      { title: '음향 트러블슈팅 · 미션 C', text: '패시브 스피커에서 소리가 안 날 때를 연습해요. 앰프 전원 → LEVEL → speakON 순서로 봐요.', go: { tab: 'tab7', ts: 'C' } },
      { title: '음향 트러블슈팅 · 미션 B', text: '스피커 한쪽만 소리가 안 날 때를 연습해요. 앰프 채널 → 표시등 → 스피커 케이블 순서로 봐요.', go: { tab: 'tab7', ts: 'B' } }
    ],
    deeper: [
      { title: '패시브 스피커 설치 — 높이 · 각도 · 안전', text: '스피커는 손전등처럼 앞쪽으로 소리를 보내요. 귀보다 높이 두고, 뒷줄 쪽을 향해 살짝 숙이면 앞뒤가 고르게 들려요. 매달 때는 정해진 매달기 지점과 전용 장비만 써요.', more: '<ul><li><b>높이</b>: 스피커를 사람 머리보다 높이 두면 앞사람에게 소리가 가려지지 않아요.</li> <li>높이 두면 앞줄과 뒷줄의 거리 차도 줄어서 고르게 들려요.</li> <li><b>각도</b>: 정면을 뒷줄 쪽으로 겨눠요. 가까운 앞줄은 정면에서 조금 벗어나 소리가 조금 작아져요. 그래서 앞뒤가 고르게 들려요.</li> <li>너무 숙이면 뒷줄이, 덜 숙이면 앞줄이 소리 범위 밖으로 빠져요.</li> <li>벽 · 천장을 직접 겨누면 튕겨 나온 소리가 늘어 말소리가 흐려져요.</li> <li><b>스탠드</b>: 많은 패시브 스피커 바닥에는 스탠드 기둥을 꽂는 구멍(폴 소켓)이 있어요. 스탠드가 견디는 무게와 다리 벌림을 확인해요.</li> <li><b>매달기(리깅)</b>: 스피커의 매달기 지점(나사 구멍 등)과 전용 브래킷만 써요. 손잡이에 매달면 안 돼요.</li> <li>매달 때는 허용 무게를 확인하고, 떨어짐을 막는 안전줄을 함께 걸어요. 전문가와 함께 해요.</li> <li>메인 스피커는 마이크보다 앞(회중석 쪽)에 둬요. 그래야 피드백이 줄어요.</li> <li>소리가 퍼지는 각도(커버리지)와 배치 방식(집중 · 분산)은 05-2 에서 자세히 배워요(교재 15장).</li></ul>' },
      { title: '스피커에 적힌 Ω 과 테스터로 잰 Ω', text: '스피커에 적힌 「8 Ω」은 대표값(공칭 임피던스)이에요. 실제 Ω 은 소리 높낮이마다 오르내려요. 테스터로 재면 8 Ω 보다 조금 낮게 나와요. 그래서 이 과정의 손실 계산은 「대략 이 정도」를 알려 줘요.', more: '<ul><li><b>테스터로 재 보면 (교재 6장)</b>: 테스터(멀티미터)로 잰 직류 저항(DC 저항)은 공칭값보다 낮게 나와요.</li> <li>교재는 공칭 임피던스가 DC 저항보다 약 20% 높다고 해요. 8 Ω 스피커가 6.7 Ω 안팎으로 재져도 고장이 아니에요.</li> <li><b>EAW</b>: 댐핑 팩터는 원래 보이스코일(콘을 움직이는 코일)의 DC 저항으로 구해요. 이 값을 (케이블 저항 + 앰프 출력 임피던스)로 나눠요.</li> <li>EAW 의 표도 공칭 임피던스로 계산한 어림값이라고 밝혀요.</li> <li>DC 저항은 공칭값보다 작아요. 그래서 실제 댐핑 팩터는 이 과정의 계산보다 조금 작게 나와요.</li> <li>그러니 케이블 굵기는 「겨우 통과」보다 한 단계 여유 있게 골라요.</li> <li>모든 패시브 스피커가 8 Ω 은 아니에요. 4 Ω · 16 Ω 처럼 다른 값도 있어요(교재 6장). 라벨을 먼저 봐요.</li> <li>나란히 이으면 가장 낮은 Ω 도 함께 낮아져요. 그래서 제조사가 정한 「한 채널에 몇 대」를 지키는 게 가장 확실해요.</li></ul>' },
      { title: '패시브 스피커에서 소리가 안 날 때', text: '패시브 스피커는 스스로 켜지는 곳이 없어요. 그래서 소리가 안 나면 앞에서부터 차례로 봐요. 콘솔 → 앰프 → 케이블 → 스피커 순서예요.', more: '<ul><li><b>① 앰프</b>: 전원 · 채널 MUTE(소리 끔) · 신호 표시등(SIGNAL)을 봐요.</li> <li>신호가 앰프까지 안 오면 콘솔 · 신호 길부터 확인해요.</li> <li><b>② 앰프 채널과 핀</b>: 스피커가 이어진 채널이 맞는지 봐요. 그 채널이 speakON 의 1± 로 나오는지도 봐요.</li> <li>어떤 2채널 앰프는 CH1 단자의 2± 에 CH2 가 나와요(04-1 「아날로그 앰프」).</li> <li><b>③ 케이블</b>: speakON 이 돌려서 잠겼는지, 링크 케이블이 빠지지 않았는지 봐요.</li> <li>다른 케이블로 바꿔 끼워 보면 빨라요.</li> <li><b>④ 앰프 설정</b>: 프로세서가 든 앰프라면 그 채널의 스피커 설정 · 음소거를 봐요(04-2).</li> <li><b>⑤ 한 음역만 안 날 때</b>(고음만 없음 등): 드라이버나 패시브 크로스오버 고장일 수 있어요.</li> <li>이때는 음량을 올려 확인하지 말고 담당자에게 알려요.</li> <li>케이블을 꽂고 뺄 때는 앰프를 끄거나 음량을 내린 상태에서 해요.</li> <li>켤 때는 콘솔 먼저, 앰프는 마지막에 켜요. 끌 때는 앰프를 먼저 꺼요.</li></ul>' }
    ],
    sources: [
      { t: 'Neutrik 스피커 커넥터 설명서 — NL2 케이블 커넥터는 4핀 섀시와 맞물려 1± 접촉 · 2핀 섀시는 4핀 케이블 커넥터와 맞지 않음', url: 'https://manualmachine.com/neutrik/loudspeakerconnectors/1653039-user-manual' },
      { t: 'Neutrik NL2FX — 4핀 섀시와 맞물림 · 접점당 40 A rms (Full Compass)', url: 'https://www.fullcompass.com/prod/247173-neutrik-nl2fx-2-pole-speakon-cable-connector' },
      { t: 'Neutrik NL4FXX-W-L 데이터 시트 — 1.5–4 mm² (17–11 AWG) · 케이블 지름 10–16 mm · 37 A rms', url: 'https://www.mouser.com/datasheet/2/289/nl4fxx_w_l-3104531.pdf' },
      { t: 'Copper Wire Resistance AWG Chart — AWG 별 저항 (MISUMI)', url: 'https://us.misumi-ec.com/blog/copper-wire-resistance-awg-chart/' },
      { t: 'EAW — Damping Factor (댐핑 팩터 · 케이블 저항 · 손실 공식, DF 20 이상)', url: 'https://eaw.com/wp-content/uploads/2020/12/Damping_factor.pdf' },
      { t: 'ProSoundWeb — Getting Your Wire Gauge Right (손실 0.5 dB 이내)', url: 'https://www.prosoundweb.com/tech-tip-of-the-day-getting-your-wire-gauge-right/' },
      { t: 'EAW — Power Handling (AES2 시험 · 작은 앰프가 안전하지 않음 · 클리핑과 열 고장)', url: 'https://eaw.com/wp-content/uploads/2020/12/Power_Handling.pdf' },
      { t: 'B&C Speakers — Power Handling (AES2-1984 · 2시간 · 크레스트 팩터 6 dB · 프로그램 = 2배)', url: 'https://bcspeakers.com/en/products-overview/power-handling' },
      { t: 'QSC AcousticPerformance AP-4122m Quick Start — 패시브/바이앰프 모드 · 저음 1± · 고음 2± (바이앰프 모드 예)', url: 'https://in.qsc.com/resource-files/productresources/spk/ap/ap4122m/q_spk_ap_4122m_quickstart.pdf' },
      { t: 'ProSoundWeb — 극성과 위상 · 건전지 확인은 고음 드라이버에 통하지 않음', url: 'https://www.prosoundweb.com/?p=39790' },
      { t: 'Electro-Voice ZX1 제품 페이지 — 8 Ω · 200/400/800 W (실습 예시 숫자의 크기 근거)', url: 'https://products.electrovoice.com/la/en/zx1' },
      { t: 'Crown XLi 1500 제품 페이지 — 330 W/8 Ω · 450 W/4 Ω · 브리지 900 W/8 Ω (실습 예시 숫자의 크기 근거)', url: 'https://jblpro.com/en/products/xli-1500' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 6장 파워 앰프와 스피커: 댐핑 계수 p.181–182 · 공칭 임피던스 · 직렬/병렬/직병렬 · 개별 스피커 출력 p.183–187 · 정격허용입력 · 감도 p.190 · 드라이버 · 혼 · 인클로저 p.191–196 · 크로스오버 · 풀레인지 · 서브우퍼 p.196–199 · 패시브 스피커 p.200', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 5장 케이블의 신호 손실 p.172 · 15장 서브 우퍼 p.438 · 앰프 및 프로세서의 디자인(프로그램 파워 · 채널당 4 Ω) p.441–442 · 16장 패시브/액티브 크로스오버 p.458–459', url: '' }
    ]
  };
})();
