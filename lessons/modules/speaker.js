/* =============================================================================
   학습 모듈: speaker (스피커 — 전기 신호를 다시 소리로 바꾸는 장치)  2026-10-21
   - 등록: window.STA_MODULES.speaker (모양은 modules_data.js 의 mic 과 같음)
   - 그림: STAVisuals.spkActivePassive / spkDrivers / spkCoverage / spkInputs / spkStage / spkTuning
   - 실습: STASims.speakerRoom — ① 객석 커버리지(위에서 본 방, 레벨 지도) ② 모니터와 카디오이드 마이크(피드백) ③ 딜레이 스피커 시간 맞추기
     (실제 녹음 + 지연된 복사본을 Web Audio 로 더해 콤 필터·메아리를 들려줌)
   - 장비 숫자(제조사 자료):
       EV ZxA1-90 — 액티브, 8" + 1", 800 W Class D 바이앰프, 60 Hz–20 kHz(−3 dB) / 48 Hz–20 kHz(−10 dB), 90°×50°, 최대 126 dB,
                    크로스오버 1.8 kHz 24 dB/oct, XLR 마이크 입력(게인) · XLR/TRS 콤보 라인 입력 · XLR 링크 출력, 100 Hz HPF, Power On·Limit 표시등
       EV ZX1     — 패시브, 8Ω, 200 W 연속 / 400 W 프로그램 / 800 W 피크, 60 Hz–20 kHz(−3 dB), 크로스오버 1.7 kHz, speakON NL4, ZX1-90 은 90°×50° 회전형 혼
       d&b E8     — 8"/1" 동축, 62 Hz–18 kHz(−5 dB), 90°×50°(회전해 50°×90°), 150 W RMS / 800 W 피크, speakON NLT4
       d&b Yi7P   — 2 × 8" + 1.4", 59 Hz–18 kHz(−5 dB), 75°×40°(회전형 혼), 400 W RMS / 1600 W 피크, NL4 ×2 + 나사 단자
       d&b Vi10P  — 2 × 10" + 8" + 1.4"(동축), 59 Hz–18 kHz(−5 dB), 110°×40°(회전형 혼), 500 W RMS / 2000 W 피크, NL4 ×2 + 나사 단자
       d&b 10D/40D — 채널마다 16밴드 EQ 2개, 딜레이 최대 10 s
   - 실습의 레벨 지도·피드백 여유·고음 감소·콤 필터는 역제곱 법칙 + 단순 지향성 모델(교육용 근사). 반사음은 넣지 않음.
   ============================================================================= */
(function () {
  'use strict';
  var C = { ink: '#0f2747', sub: '#5b6b80', line: '#cbd5e1', teal: '#0e7490', cyan: '#22d3ee', blue: '#2563eb', red: '#dc2626', amber: '#f59e0b', green: '#16a34a', bg: '#f8fafc', violet: '#7c3aed' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + s + '</text>'; }
  function box(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 10 : r) + '" fill="' + fill + '" stroke="' + (stroke || 'none') + '" stroke-width="2"/>'; }
  function arrow(x1, y1, x2, y2, col, w) { col = col || C.ink; var a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 9 * Math.cos(a), hy = y2 - 9 * Math.sin(a);
    return '<path d="M' + x1 + ' ' + y1 + 'L' + hx.toFixed(1) + ' ' + hy.toFixed(1) + '" stroke="' + col + '" stroke-width="' + (w || 2.5) + '"/><path d="M' + x2 + ' ' + y2 + 'L' + (hx + 5 * Math.sin(a)).toFixed(1) + ' ' + (hy - 5 * Math.cos(a)).toFixed(1) + 'L' + (hx - 5 * Math.sin(a)).toFixed(1) + ' ' + (hy + 5 * Math.cos(a)).toFixed(1) + 'Z" fill="' + col + '"/>'; }
  function logx(x0, x1, f0, f1) { return function (f) { return x0 + (Math.log10(f) - Math.log10(f0)) / (Math.log10(f1) - Math.log10(f0)) * (x1 - x0); }; }

  var V = window.STAVisuals = window.STAVisuals || {};

  V.spkActivePassive = function () {
    var b = '';
    function inner(x, y, w, lab, col) { return box(x, y, w, 30, '#fff', col, 6) + t(x + w / 2, y + 20, lab, { size: 11, weight: 700, fill: col }); }
    b += box(8, 24, 286, 176, '#ecfeff', C.teal) + t(151, 46, '액티브 · EV ZXA1', { size: 14, weight: 800, fill: C.teal });
    b += t(24, 78, '전원(AC)', { size: 11, anchor: 'start', fill: C.amber, weight: 700 }) + t(24, 128, '라인·마이크', { size: 11, anchor: 'start', fill: C.blue, weight: 700 }) + t(24, 142, '(XLR · TRS)', { size: 10, anchor: 'start', fill: C.sub });
    b += arrow(80, 74, 104, 92, C.amber, 2) + arrow(86, 124, 104, 106, C.blue, 2);
    b += inner(106, 84, 82, '내장 앰프', C.teal) + inner(198, 84, 86, '크로스오버', C.ink);
    b += inner(150, 134, 134, '우퍼 8" · 고음 1"', C.ink) + arrow(240, 116, 230, 132, C.ink, 1.6);
    b += t(151, 188, '전원 + 라인 신호만 연결 (800 W 내장, 제조사 자료)', { size: 10.5, fill: C.sub });
    b += box(306, 24, 286, 176, C.bg, C.line) + t(449, 46, '패시브 · EV ZX1', { size: 14, weight: 800 });
    b += t(318, 92, '파워앰프', { size: 11, anchor: 'start', fill: C.red, weight: 700 }) + t(318, 106, '(XLi1500)', { size: 10, anchor: 'start', fill: C.sub });
    b += arrow(372, 99, 428, 99, C.red, 3) + t(400, 90, 'speakON', { size: 9.5, fill: C.red, weight: 700 });
    b += inner(430, 84, 152, '크로스오버 (패시브)', C.ink) + inner(448, 134, 134, '우퍼 8" · 고음 1"', C.ink) + arrow(506, 116, 512, 132, C.ink, 1.6);
    b += t(449, 188, '앰프는 바깥에 · 8Ω · 전원 단자 없음', { size: 10.5, fill: C.sub });
    b += t(8, 14, '같은 모양의 상자라도 연결 방법이 달라요', { size: 11, fill: C.sub, anchor: 'start' });
    return svg(600, 208, b, '액티브 스피커와 패시브 스피커의 구조');
  };

  /* 2026-10-23: 풀레인지 · 2웨이 · 3웨이 구조 비교 */
  V.spkWays = function () {
    var b = '', COL = { lo: C.teal, mid: C.violet, hi: C.amber, full: C.blue };
    function drv(cx, cy, r, col, lab) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#1f2937" stroke="' + col + '" stroke-width="3"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.35) + '" fill="#4b5563"/>' + (lab ? t(cx + r + 8, cy + 4, lab, { size: 10.5, anchor: 'start', fill: col, weight: 700 }) : ''); }
    function horn(cx, cy, col, lab) { return '<path d="M' + (cx - 22) + ' ' + (cy - 12) + 'H' + (cx + 22) + 'L' + (cx + 10) + ' ' + (cy + 12) + 'H' + (cx - 10) + 'Z" fill="#1f2937" stroke="' + col + '" stroke-width="3"/><circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#9ca3af"/>' + (lab ? t(cx + 30, cy + 4, lab, { size: 10.5, anchor: 'start', fill: col, weight: 700 }) : ''); }
    function band(x, y, w, parts) { var s2 = '', xx = x; parts.forEach(function (p2) { var ww = w * p2[0]; s2 += '<rect x="' + xx + '" y="' + y + '" width="' + ww + '" height="14" fill="' + p2[1] + '" fill-opacity=".85"/>'; xx += ww; }); return s2 + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="14" fill="none" stroke="' + C.line + '"/>' + t(x, y + 28, '저음', { size: 9.5, fill: C.sub, anchor: 'start' }) + t(x + w, y + 28, '고음', { size: 9.5, fill: C.sub, anchor: 'end' }); }
    // 풀레인지
    b += box(14, 30, 170, 196, C.bg, C.line) + t(99, 52, '풀레인지 (1웨이)', { size: 13, weight: 800 }) + box(64, 66, 70, 96, '#e5e7eb', '#9ca3af', 8) + drv(99, 114, 24, COL.full) + band(34, 178, 130, [[1, COL.full]]);
    // 2웨이
    b += box(214, 30, 170, 196, '#ecfeff', C.teal) + t(299, 52, '2웨이', { size: 13, weight: 800, fill: C.teal }) + box(244, 62, 70, 104, '#e5e7eb', '#9ca3af', 8) + horn(279, 80, COL.hi, '고음') + drv(279, 130, 26, COL.lo, '저음') + band(234, 178, 130, [[0.55, COL.lo], [0.45, COL.hi]]);
    // 3웨이
    b += box(414, 30, 172, 196, '#f5f3ff', C.violet) + t(500, 52, '3웨이', { size: 13, weight: 800, fill: C.violet }) + box(444, 60, 70, 108, '#e5e7eb', '#9ca3af', 8) + horn(479, 74, COL.hi, '고음') + drv(479, 104, 13, COL.mid, '중음') + drv(479, 142, 21, COL.lo, '저음') + band(434, 178, 132, [[0.4, COL.lo], [0.33, COL.mid], [0.27, COL.hi]]);
    b += t(8, 16, '드라이버마다 잘하는 대역을 나눠 맡아요 · 나누는 일은 크로스오버가 해요', { size: 11, fill: C.sub, anchor: 'start' });
    b += t(300, 250, '예: EV ZXA1 = 2웨이 (8인치 우퍼 + 1인치 고음 드라이버, 1.8 kHz 에서 나눔 · 제조사 자료)', { size: 10.5, fill: C.ink });
    return svg(600, 260, b, '풀레인지, 2웨이, 3웨이 스피커 구조 비교');
  };

  V.spkDrivers = function () {
    var x0 = 50, x1 = 580, y0 = 34, y1 = 180, fx = logx(x0, x1, 20, 20000), fy = function (d) { return y0 + (6 - d) / 36 * (y1 - y0); }, fc = 1800;
    var g = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].map(function (f) { return '<path d="M' + fx(f).toFixed(1) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.line + '"/>' + t(fx(f), y1 + 15, f >= 1000 ? (f / 1000) + 'k' : f, { size: 10, fill: C.sub }); }).join('') +
      [0, -6, -12, -24].map(function (d) { return '<path d="M' + x0 + ' ' + fy(d).toFixed(1) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="' + (d ? '3 3' : '0') + '"/>' + t(x0 - 6, fy(d) + 4, d, { size: 10, fill: C.sub, anchor: 'end' }); }).join('');
    function lo(f) { var r = Math.pow(f / 60, 2); return 10 * Math.log10(r * r / (1 + r * r)); }   // 우퍼의 저역 끝(예시, −3 dB @ 60 Hz)
    function lp(f) { return -20 * Math.log10(1 + Math.pow(f / fc, 4)); }
    function hp(f) { var r = Math.pow(f / fc, 4); return 20 * Math.log10(r / (1 + r)); }
    function path(fn) { var d = ''; for (var f = 20; f <= 20000; f *= 1.04) { var v = Math.max(-30, fn(f)); d += (d ? 'L' : 'M') + fx(f).toFixed(1) + ' ' + fy(v).toFixed(1); } return d; }
    var sub = '<rect x="' + fx(25).toFixed(1) + '" y="' + y0 + '" width="' + (fx(100) - fx(25)).toFixed(1) + '" height="' + (y1 - y0) + '" fill="' + C.violet + '" fill-opacity=".08"/>' + t((fx(25) + fx(100)) / 2, y0 + 16, '서브우퍼 영역', { size: 10.5, fill: C.violet, weight: 700 });
    return svg(600, 204, g + sub + '<path d="' + path(function (f) { return lp(f) + lo(f); }) + '" fill="none" stroke="' + C.teal + '" stroke-width="3"/>' +
      '<path d="' + path(function (f) { return hp(f); }) + '" fill="none" stroke="' + C.amber + '" stroke-width="3"/>' +
      '<path d="M' + fx(fc).toFixed(1) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.red + '" stroke-dasharray="5 4"/>' + t(fx(fc), y0 - 4, '크로스오버 1.8 kHz (ZXA1 제조사 자료)', { size: 10.5, fill: C.red, weight: 700 }) +
      t(fx(250), fy(2), '우퍼 (저음)', { size: 12, fill: C.teal, weight: 800 }) + t(fx(7000), fy(2), '고음 드라이버', { size: 12, fill: C.amber, weight: 800 }) +
      t(x1, 16, '곡선 모양은 「예시」 (24 dB/oct 크로스오버로 계산)', { size: 10.5, fill: C.sub, anchor: 'end' }) + t(x0, 16, 'dB', { size: 10, fill: C.sub, anchor: 'start' }), '우퍼와 고음 드라이버를 나누는 크로스오버');
  };

  V.spkCoverage = function () {
    var b = '', sx = 40, sy = 112, R = 135, half = 45, rad = Math.PI / 180;
    var ex1 = sx + R * Math.cos(-half * rad), ey1 = sy + R * Math.sin(-half * rad), ex2 = sx + R * Math.cos(half * rad), ey2 = sy + R * Math.sin(half * rad);
    b += '<path d="M' + sx + ' ' + sy + 'L' + ex1.toFixed(1) + ' ' + ey1.toFixed(1) + 'A' + R + ' ' + R + ' 0 0 1 ' + ex2.toFixed(1) + ' ' + ey2.toFixed(1) + 'Z" fill="' + C.teal + '" fill-opacity=".12" stroke="none"/>';
    b += '<path d="M' + sx + ' ' + sy + 'L' + ex1.toFixed(1) + ' ' + ey1.toFixed(1) + 'M' + sx + ' ' + sy + 'L' + ex2.toFixed(1) + ' ' + ey2.toFixed(1) + '" stroke="' + C.teal + '" stroke-width="2" stroke-dasharray="6 4"/>';
    b += '<path d="M' + sx + ' ' + sy + 'H' + (sx + R) + '" stroke="' + C.ink + '" stroke-width="1.5"/>';
    [[34, '1 m · 0 dB'], [68, '2 m · −6 dB'], [135, '4 m · −12 dB']].forEach(function (a) { b += '<path d="M' + (sx + a[0] * Math.cos(-20 * rad)).toFixed(1) + ' ' + (sy + a[0] * Math.sin(-20 * rad)).toFixed(1) + 'A' + a[0] + ' ' + a[0] + ' 0 0 1 ' + (sx + a[0] * Math.cos(20 * rad)).toFixed(1) + ' ' + (sy + a[0] * Math.sin(20 * rad)).toFixed(1) + '" fill="none" stroke="' + C.blue + '" stroke-width="1.5"/>' + t(sx + a[0] + 3, sy + (a[0] > 100 ? 44 : a[0] > 50 ? 30 : 16), a[1], { size: 10, fill: C.blue, anchor: 'start' }); });
    b += box(sx - 14, sy - 16, 18, 32, C.ink, null, 3);
    b += t(ex1 - 4, ey1 + 16, '−6 dB 선', { size: 11, fill: C.teal, weight: 700, anchor: 'end' }) + t(ex2 - 4, ey2 - 6, '−6 dB 선', { size: 11, fill: C.teal, weight: 700, anchor: 'end' }) + t(sx + 112, sy - 6, '정면(축)', { size: 11, weight: 700 });
    b += t(8, 16, '위에서 본 모양: 90° 커버리지 = 양쪽 45° 에서 −6 dB', { size: 11, fill: C.sub, anchor: 'start' });
    // 옆에서 본 모양 (뒷줄을 향해 겨누기)
    var ox = 330, oy = 50;
    b += box(ox - 6, 24, 276, 176, C.bg, C.line);
    b += '<path d="M' + ox + ' 176H' + (ox + 264) + '" stroke="' + C.sub + '" stroke-width="2"/>';
    b += box(ox + 8, oy, 16, 26, C.ink, null, 3);
    for (var i = 0; i < 6; i++) b += '<circle cx="' + (ox + 70 + i * 36) + '" cy="160" r="7" fill="' + C.amber + '"/>';
    b += '<path d="M' + (ox + 24) + ' ' + (oy + 13) + 'L' + (ox + 250) + ' 158" stroke="' + C.teal + '" stroke-width="2.5"/>' + t(ox + 150, 100, '축 → 뒷줄', { size: 11, fill: C.teal, weight: 800 });
    b += '<path d="M' + (ox + 24) + ' ' + (oy + 13) + 'L' + (ox + 70) + ' 152" stroke="' + C.sub + '" stroke-dasharray="4 4"/>' + t(ox + 78, 146, '앞줄: 축에서 벗어남', { size: 10, fill: C.sub, anchor: 'start' });
    b += t(ox + 132, 44, '옆에서 본 모양 「예시」', { size: 11, fill: C.sub }) + t(ox + 132, 194, '가까워서 큰 앞줄 ↔ 축에서 벗어나 작아짐 → 고르게', { size: 10, fill: C.ink });
    return svg(600, 208, b, '커버리지 각도와 거리에 따른 감소, 뒷줄을 향해 겨누기');
  };

  V.spkInputs = function () {
    var b = '';
    function xlr(x, y, lab, col) { return '<circle cx="' + x + '" cy="' + y + '" r="15" fill="#fff" stroke="' + (col || C.ink) + '" stroke-width="2"/><circle cx="' + (x - 5) + '" cy="' + (y - 4) + '" r="2" fill="' + C.ink + '"/><circle cx="' + (x + 5) + '" cy="' + (y - 4) + '" r="2" fill="' + C.ink + '"/><circle cx="' + x + '" cy="' + (y + 5) + '" r="2" fill="' + C.ink + '"/>' + t(x, y + 30, lab, { size: 10.5, weight: 700, fill: col || C.ink }); }
    function nl4(x, y, lab) { return '<circle cx="' + x + '" cy="' + y + '" r="16" fill="#fff" stroke="' + C.red + '" stroke-width="2.4"/><circle cx="' + x + '" cy="' + y + '" r="6" fill="none" stroke="' + C.red + '" stroke-width="1.6"/>' + t(x, y + 31, lab, { size: 10.5, weight: 700, fill: C.red }); }
    b += box(8, 24, 330, 164, '#1f2328', '#0b0d10') + t(173, 44, 'ZXA1 뒷면 (액티브)', { size: 13, weight: 800, fill: '#fff' });
    b += '<g>' + box(18, 56, 310, 120, '#f8fafc', null, 8) + '</g>';
    b += xlr(54, 92, 'MIC IN', C.blue) + '<circle cx="54" cy="148" r="10" fill="#9ca3af"/>' + t(54, 172, 'MIC 게인', { size: 9.5, fill: C.sub });
    b += xlr(120, 92, 'LINE IN', C.teal) + t(120, 136, 'XLR/TRS 콤보', { size: 9.5, fill: C.sub });
    b += xlr(186, 92, 'LINK OUT', C.ink) + t(186, 136, '다음 스피커로', { size: 9.5, fill: C.sub });
    b += box(236, 76, 34, 18, '#fff', C.ink, 4) + t(253, 108, '100 Hz', { size: 9.5, fill: C.ink, weight: 700 }) + t(253, 120, 'HPF', { size: 9.5, fill: C.sub });
    b += '<circle cx="296" cy="80" r="5" fill="#60a5fa"/>' + t(296, 96, 'POWER', { size: 9, fill: C.sub }) + '<circle cx="296" cy="110" r="5" fill="#ef4444"/>' + t(296, 126, 'LIMIT', { size: 9, fill: C.sub });
    b += box(236, 140, 76, 26, '#e5e7eb', C.sub, 4) + t(274, 157, '전원 (AC)', { size: 10, fill: C.ink, weight: 700 });
    b += box(350, 24, 242, 164, C.bg, C.line) + t(471, 44, 'ZX1 뒷면 (패시브)', { size: 13, weight: 800 });
    b += nl4(420, 98, 'speakON') + nl4(522, 98, 'speakON') + '<path d="M436 98H506" stroke="' + C.red + '" stroke-dasharray="4 3"/>' + t(471, 90, '병렬', { size: 10, fill: C.red });
    b += t(471, 152, '하나는 앰프에서 받고,', { size: 11 }) + t(471, 168, '하나는 다음 스피커로 링크', { size: 11 });
    b += t(8, 14, '단자 종류는 제조사 자료 · 배치는 「예시」(실제 위치와 다를 수 있어요)', { size: 11, fill: C.sub, anchor: 'start' });
    b += t(300, 206, '⚠ 앰프의 스피커 출력을 ZXA1 의 XLR/TRS 입력에 연결하면 안 돼요', { size: 11.5, fill: C.red, weight: 800 });
    return svg(600, 214, b, '액티브와 패시브 스피커의 입력 단자');
  };

  V.spkStage = function () {
    var b = '';
    b += box(8, 24, 380, 182, '#eef3f8', C.line) + t(198, 196, '↓ 회중석', { size: 11, fill: C.sub });
    b += '<path d="M8 150H388" stroke="' + C.line + '" stroke-dasharray="5 4"/>' + t(16, 146, '단상 끝', { size: 10, fill: C.sub, anchor: 'start' });
    // 보컬 + 카디오이드 (마이크 정면이 위쪽 = 보컬 쪽)
    var mx = 198, my = 82, d = '';
    for (var i = 0; i <= 360; i += 4) { var th = i * Math.PI / 180, r = 36 * Math.abs(0.5 + 0.5 * Math.cos(th)); d += (i ? 'L' : 'M') + (mx + r * Math.sin(th)).toFixed(1) + ' ' + (my - r * Math.cos(th)).toFixed(1); }
    b += '<path d="' + d + 'Z" fill="' + C.teal + '" fill-opacity=".15" stroke="' + C.teal + '" stroke-width="1.8"/>';
    b += '<ellipse cx="198" cy="58" rx="13" ry="11" fill="#f2d2b6" stroke="#8b5e3c" stroke-width="2"/>' + t(232, 54, '보컬', { size: 11, weight: 700, anchor: 'start' });
    b += '<circle cx="198" cy="82" r="5" fill="#334155"/>' + '<path d="M204 86L236 100" stroke="' + C.teal + '" stroke-width="1.2"/>' + t(239, 104, '마이크 (카디오이드)', { size: 10.5, anchor: 'start', fill: C.teal, weight: 700 });
    // 모니터: 마이크 뒤 (보컬 앞, 보컬을 향함)
    b += '<path d="M180 128 L216 128 L212 140 L184 140 Z" fill="#1f2937"/>' + t(198, 160, '모니터 ✓ 마이크 뒤 (빈 곳)', { size: 10.5, fill: C.green, weight: 800 });
    b += arrow(198, 126, 198, 106, C.green, 1.8);
    // 나쁜 자리: 마이크 옆
    b += '<path d="M92 66 L104 70 L104 94 L92 98 Z" fill="#9ca3af"/>' + t(98, 114, '✗ 모니터를 옆 90° 에', { size: 10, fill: C.red, weight: 700 }) + t(98, 126, '(약 −6 dB 만 줄어요)', { size: 9, fill: C.red });
    // 메인 스피커: 단상 앞 양옆, 회중석을 향함
    [[40, 'L'], [340, 'R']].forEach(function (p) { b += box(p[0], 162, 28, 22, C.ink, null, 3) + arrow(p[0] + 14, 184, p[0] + 14, 200, C.ink, 1.6) + t(p[0] + 14, 158, '메인 ' + p[1], { size: 10, weight: 700 }); });
    b += box(290, 38, 64, 30, '#4c1d95', null, 4) + t(322, 58, '서브', { size: 11, fill: '#fff', weight: 700 });
    // 오른쪽 설명
    b += box(400, 24, 192, 182, C.bg, C.line);
    [['메인', '회중석 · 마이크보다 앞에 두고', '마이크 쪽을 향하지 않게'], ['모니터', '단상 위 사람 · 마이크가', '가장 덜 받는 방향에'], ['서브우퍼', '아주 낮은 저음 · 바닥에', '두고 사방으로 퍼짐']].forEach(function (r, i) { var y = 50 + i * 54;
      b += t(412, y, r[0], { size: 12.5, weight: 800, anchor: 'start', fill: C.teal }) + t(412, y + 17, r[1], { size: 10.5, anchor: 'start' }) + t(412, y + 31, r[2], { size: 10.5, anchor: 'start' }); });
    b += t(8, 14, '단상을 위에서 본 배치 「예시」 · 카디오이드는 바로 뒤가 빈 곳', { size: 11, fill: C.sub, anchor: 'start' });
    return svg(600, 214, b, '메인, 모니터, 서브우퍼의 배치와 피드백');
  };

  V.spkTuning = function () {
    var b = '';
    // 왼쪽: 옆에서 본 메인·딜레이 스피커
    b += box(8, 24, 270, 182, C.bg, C.line) + '<path d="M18 172H268" stroke="' + C.sub + '" stroke-width="2"/>';
    b += box(22, 56, 16, 26, C.ink, null, 3) + t(30, 50, '메인', { size: 10.5, weight: 700 });
    b += box(160, 70, 16, 22, C.teal, null, 3) + t(168, 64, '딜레이', { size: 10.5, weight: 700, fill: C.teal });
    b += '<circle cx="236" cy="150" r="8" fill="' + C.amber + '"/>' + t(236, 188, '듣는 자리', { size: 10, fill: C.sub });
    b += '<path d="M38 69L230 146" stroke="' + C.ink + '" stroke-width="2" stroke-dasharray="6 4"/>' + t(110, 124, '메인까지 거리', { size: 10, fill: C.ink });
    b += '<path d="M176 82L231 144" stroke="' + C.teal + '" stroke-width="2.4"/>' + t(222, 104, '가까움', { size: 10, fill: C.teal, anchor: 'start' });
    b += t(143, 202, '딜레이 ≈ 거리 차 ÷ 343 m/s (1 m ≈ 2.9 ms)', { size: 10.5, weight: 700 });
    // 오른쪽: 콤 필터
    var x0 = 320, x1 = 590, y0 = 40, y1 = 170, fx = logx(x0, x1, 50, 16000), fy = function (d) { return y0 + (8 - d) / 32 * (y1 - y0); };
    var g = [100, 1000, 10000].map(function (f) { return '<path d="M' + fx(f).toFixed(1) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.line + '"/>' + t(fx(f), y1 + 14, f >= 1000 ? (f / 1000) + 'k' : f, { size: 10, fill: C.sub }); }).join('') +
      [6, 0, -12, -24].map(function (d) { return '<path d="M' + x0 + ' ' + fy(d).toFixed(1) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="' + (d ? '3 3' : '0') + '"/>' + t(x0 - 4, fy(d) + 4, d, { size: 9.5, fill: C.sub, anchor: 'end' }); }).join('');
    function comb(dt, gg, s) { var d = ''; for (var f = 50; f <= 16000; f *= 1.012) { var w = 2 * Math.PI * f * dt, re = 1 + s * gg * Math.cos(w), im = -s * gg * Math.sin(w), v = Math.max(-24, 10 * Math.log10(re * re + im * im)); d += (d ? 'L' : 'M') + fx(f).toFixed(1) + ' ' + fy(v).toFixed(1); } return d; }
    b += g + '<path d="' + comb(0.001, 0.9, 1) + '" fill="none" stroke="' + C.blue + '" stroke-width="1.8"/>' + '<path d="' + comb(0.0003, 0.9, -1) + '" fill="none" stroke="' + C.red + '" stroke-width="2.4"/>';
    b += t(x0, 30, '같은 소리 두 개를 더했을 때 (교육용 계산)', { size: 10.5, fill: C.sub, anchor: 'start' });
    b += t(x1, 198, '파랑: 1 ms 어긋남 → 콤 필터 · 빨강: 극성 반대 → 저음 상쇄', { size: 10, fill: C.ink, anchor: 'end' });
    b += t(8, 14, '시간 맞추기와 극성 「예시」', { size: 11, fill: C.sub, anchor: 'start' });
    return svg(600, 214, b, '딜레이 스피커 시간 맞추기와 콤 필터, 극성');
  };

  /* ------------------------------------------------------------------ 실습 */
  var MODELS = {
    zxa1: { name: 'EV ZXA1-90 · ZX1-90', h: 90, v: 50 },
    zx1rot: { name: 'ZX1-90 혼을 돌림', h: 50, v: 90 },
    yi7p: { name: '좁은 커버리지', h: 75, v: 40 },
    vi10p: { name: '넓은 커버리지', h: 110, v: 40 }
  };
  var ROOM = { W: 16, H: 12, stage: 3, hgt: 2.5 };
  var SEATS = []; (function () { for (var j = 0; j < 6; j++) for (var i = 0; i < 6; i++) SEATS.push({ x: 5 + 1.8 * j, y: 2 + 1.6 * i, row: j }); })();
  var STG = { W: 6, H: 4, singer: { x: 3, y: 1.2 }, mic: { x: 3, y: 1.34 }, mains: [{ x: 0.5, y: 3.7 }, { x: 5.5, y: 3.7 }] };
  var DL = { len: 26, main: { x: 0.5, y: 4.0 }, del: { x: 12, y: 3.0 }, ear: 1.2, c: 343 };
  DL.trim = 20 * Math.log10(Math.hypot(16 - DL.del.x, DL.del.y - DL.ear) / Math.hypot(16 - DL.main.x, DL.main.y - DL.ear));   // L = 16 m 에서 두 소리가 같은 크기

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function db20(x) { return 20 * Math.log10(Math.max(x, 1e-9)); }
  function fx(v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }
  function sgn(v, d) { return (v > 0 ? '+' : v < 0 ? '−' : '') + fx(Math.abs(v), d); }
  function dirLoss(th, half) { return Math.max(-30, -6 * Math.pow(th / half, 2)); }   // 커버리지 경계(반각)에서 −6 dB 인 단순 모델
  function wrap(a) { while (a > 180) a -= 360; while (a < -180) a += 360; return a; }
  function cardio(th) { return Math.max(0.06, Math.abs(0.5 + 0.5 * Math.cos(th))); }   // 뒤쪽 최소 약 −24 dB

  var audioCache = {};
  function b64ToBuf(uri) { var b = atob(uri.slice(uri.indexOf(',') + 1)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  function loadStem(key, cb) {
    if (audioCache[key]) { cb(audioCache[key]); return; }
    var uri = window.MG12XU_SOURCE_AUDIO_BASE64 && window.MG12XU_SOURCE_AUDIO_BASE64[key], OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, fired = false;
    function fail() { if (fired) return; fired = true; cb({ buffer: null, synthetic: true }); }
    if (!uri || !OAC) { fail(); return; }
    try { var oc = new OAC(1, 2, 44100), pr = oc.decodeAudioData(b64ToBuf(uri), function (buf) { if (fired) return; fired = true; audioCache[key] = { buffer: buf, synthetic: false }; cb(audioCache[key]); }, fail); if (pr && pr.catch) pr.catch(function () { /* 콜백에서 처리 */ }); } catch (e) { fail(); }
  }

  function injectCss() {
    if (document.getElementById('sta-mod-speaker-css')) return;
    var s = document.createElement('style'); s.id = 'sta-mod-speaker-css';
    s.textContent = [
      '.sim-speaker{display:flex;flex-direction:column;gap:10px}',
      '.sim-speaker-scenes{display:flex;gap:6px;flex-wrap:wrap}',
      '.sim-speaker-scenes button{flex:1 1 150px;border:1px solid var(--sta-line);background:#f8fafc;border-radius:10px;padding:8px 10px;font:inherit;font-size:.84rem;font-weight:800;color:var(--sta-ink);cursor:pointer;text-align:left}',
      '.sim-speaker-scenes button[aria-pressed=true]{background:var(--sta-navy);border-color:var(--sta-navy);color:#fff}',
      '.sim-speaker-scenes small{display:block;font-weight:600;font-size:.7rem;opacity:.8}',
      '.sim-speaker-body{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:12px;align-items:start}',
      '.sim-speaker-pane[hidden]{display:none}',
      '.sim-speaker-view{display:flex;flex-direction:column;gap:8px;min-width:0}',
      '.sim-speaker-cv{display:block;width:100%;touch-action:none;border:1px solid var(--sta-line);border-radius:12px;background:#eef3f8}',
      '.sim-speaker-graph{display:block;width:100%;height:190px;border:1px solid var(--sta-line);border-radius:12px;background:#fff}',
      '.sim-speaker-legend{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:.72rem;color:#475569}.sim-speaker-legend i{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:4px}',
      '.sim-speaker-models{display:grid;gap:5px}',
      '.sim-speaker .sim-range output{font-variant-numeric:tabular-nums;font-weight:800}',
      '.sim-speaker-verdict{margin-top:6px;padding:7px 10px;border-radius:8px;font-size:.78rem;line-height:1.5}',
      '.sim-speaker-verdict.ok{background:var(--sta-ok-bg);color:var(--sta-ok);border:1px solid var(--sta-ok-line)}.sim-speaker-verdict.warn{background:var(--sta-warn-bg);color:var(--sta-warn);border:1px solid var(--sta-warn-line)}.sim-speaker-verdict.bad{background:var(--sta-bad-bg);color:var(--sta-bad);border:1px solid var(--sta-bad-line)}',
      '.sim-speaker-pol{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.sim-speaker-pol label{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;border:1px solid var(--sta-line);font-size:.78rem;font-weight:700;cursor:pointer}',
      '.sim-speaker-pol label:has(input:checked){background:var(--sta-cyan-soft);border-color:var(--sta-cyan)}',
      '@media (max-width:860px){.sim-speaker-body{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function speakerRoom(el, opts) {
    opts = opts || {}; injectCss();
    var S = { scene: 'cover', model: 'zxa1', sx: 1.0, sy: 1.0, aim: 0, tilt: 20, sel: 35, hgt: 2.5, sawLow: false,
      mx: 1.9, my: 1.34, listener: 16, delayMs: 0, delLvl: 0, polarity: 'normal', delayOn: true, sawRev: false, src: 'leadVox', done: {}, audio: false };
    var scenes = [['cover', '① 객석 커버리지', '메인 스피커 겨누기'], ['monitor', '② 모니터와 피드백', '카디오이드 마이크와 모니터'], ['delay', '③ 딜레이 맞추기', '도착 시간·콤 필터·극성']];
    el.innerHTML =
      '<div class="sim-speaker">' +
        '<div class="sim-speaker-scenes" role="group" aria-label="실습 장면">' + scenes.map(function (s) { return '<button type="button" data-scene="' + s[0] + '" aria-pressed="' + (s[0] === S.scene) + '">' + s[1] + '<small>' + s[2] + '</small></button>'; }).join('') + '</div>' +
        // ① 커버리지
        '<div class="sim-speaker-pane" data-pane="cover"><div class="sim-speaker-body">' +
          '<div class="sim-speaker-view"><canvas class="sim-speaker-cv" data-cv="cover" aria-label="위에서 본 예배실: 단상(왼쪽)의 메인 스피커와 좌석 36개의 레벨 지도"></canvas>' +
            '<canvas class="sim-speaker-cv" data-cv="side" aria-label="옆에서 본 예배실: 스피커 높이와 세로 커버리지, 줄마다 앉은 사람"></canvas>' +
            '<div class="sim-speaker-legend"><span><i style="background:#16a34a"></i>평균 ±3 dB</span><span><i style="background:#f59e0b"></i>3–6 dB 큼</span><span><i style="background:#dc2626"></i>6 dB 넘게 큼</span><span><i style="background:#60a5fa"></i>3–6 dB 작음</span><span><i style="background:#1e3a8a"></i>6 dB 넘게 작음</span></div>' +
            '<div class="sim-hint">스피커(단상 위 검은 상자)를 끌어 옮기고, 노란 손잡이를 끌어 방향을 돌리세요. 좌석을 누르면 그 자리의 레벨과 거리를 볼 수 있어요.</div></div>' +
          '<div class="sim-side">' +
            '<div class="sim-box"><h4>스피커 <small>커버리지: 제조사 자료</small></h4><div class="sim-speaker-models">' + Object.keys(MODELS).map(function (k) { var m = MODELS[k]; return '<label class="sim-type"><input type="radio" name="simSpkModel" value="' + k + '"' + (k === S.model ? ' checked' : '') + '><span><b>' + esc(m.name) + '</b><small>가로 ' + m.h + '° × 세로 ' + m.v + '°</small></span></label>'; }).join('') + '</div></div>' +
            '<div class="sim-box"><h4>겨누기</h4><label class="sim-range"><span>방향 (가로) <output data-out="aim"></output></span><input type="range" min="-90" max="90" step="1" data-sim="aim" aria-label="스피커 가로 방향"></label>' +
              '<label class="sim-range"><span>아래로 숙이기 (세로) <output data-out="tilt"></output></span><input type="range" min="0" max="45" step="1" data-sim="tilt" aria-label="스피커 아래로 숙이는 각도"></label>' +
              '<label class="sim-range"><span>스피커 높이 (바닥에서) <output data-out="hgt"></output></span><input type="range" min="1.8" max="6" step="0.1" data-sim="hgt" aria-label="스피커 높이(바닥에서, m)"></label>' +
              '<div class="sim-btns"><button type="button" class="sim-btn" data-sim="resetCover">처음 위치</button></div></div>' +
            '<div class="sim-box sim-read" data-role="readCover"></div>' +
          '</div></div></div>' +
        // ② 모니터
        '<div class="sim-speaker-pane" data-pane="monitor" hidden><div class="sim-speaker-body">' +
          '<div class="sim-speaker-view"><canvas class="sim-speaker-cv" data-cv="monitor" aria-label="위에서 본 단상: 보컬, 카디오이드 마이크, 바닥 모니터, 메인 스피커"></canvas>' +
            '<div class="sim-hint">바닥 모니터(검은 사다리꼴)를 끌어 옮기세요. 모니터는 늘 보컬을 향해요. 청록색 모양이 마이크의 카디오이드 지향성이에요.</div></div>' +
          '<div class="sim-side"><div class="sim-box sim-read" data-role="readMon"></div><div class="sim-box"><div class="sim-btns"><button type="button" class="sim-btn" data-sim="resetMon">처음 위치</button></div><p class="sim-note">이 장면은 소리 없이 계산값으로 봐요.</p></div></div>' +
        '</div></div>' +
        // ③ 딜레이
        '<div class="sim-speaker-pane" data-pane="delay" hidden><div class="sim-speaker-body">' +
          '<div class="sim-speaker-view"><canvas class="sim-speaker-cv" data-cv="delay" aria-label="옆에서 본 예배실: 메인 스피커, 천장 딜레이 스피커, 듣는 자리"></canvas>' +
            '<canvas class="sim-speaker-graph" data-cv="graph" aria-label="두 소리의 도착 시간과 더해진 소리의 주파수 응답"></canvas></div>' +
          '<div class="sim-side">' +
            '<div class="sim-box"><h4>딜레이 스피커 설정</h4><label class="sim-range"><span>딜레이(지연) <output data-out="delay"></output></span><input type="range" min="0" max="80" step="0.5" data-sim="delayMs" aria-label="딜레이 스피커 지연 시간"></label>' +
              '<label class="sim-range"><span>딜레이 스피커 레벨 (16 m 자리에서 메인 대비) <output data-out="lvl"></output></span><input type="range" min="-12" max="6" step="1" data-sim="delLvl" aria-label="딜레이 스피커 레벨"></label>' +
              '<label class="sim-range"><span>듣는 자리 (메인에서) <output data-out="lis"></output></span><input type="range" min="13" max="24" step="0.5" data-sim="listener" aria-label="듣는 자리 위치"></label>' +
              '<div class="sim-speaker-pol" role="radiogroup" aria-label="딜레이 스피커 극성"><label><input type="radio" name="simSpkPol" value="normal" checked>극성 정상</label><label><input type="radio" name="simSpkPol" value="reversed">극성 반대</label></div>' +
              '<label class="sim-switch"><input type="checkbox" data-sim="delayOn" checked><span>딜레이 스피커 켜기 (꺼서 비교)</span></label></div>' +
            '<div class="sim-box sim-read" data-role="readDel"></div>' +
          '</div></div></div>' +
        /* 2026-10-24: 「소리 켜기」(자리별 소리 듣기)는 요청으로 뺌 — 그림·계산·과제는 그대로 */
      '</div>';
    var q = function (s) { return el.querySelector(s); };
    var cvs = { cover: q('[data-cv=cover]'), side: q('[data-cv=side]'), monitor: q('[data-cv=monitor]'), delay: q('[data-cv=delay]'), graph: q('[data-cv=graph]') };
    var ctxs = {}; Object.keys(cvs).forEach(function (k) { ctxs[k] = cvs[k].getContext('2d'); });
    var dpr = Math.min(2, window.devicePixelRatio || 1), px = { cover: 1, monitor: 1, delay: 1 }, alive = true, stem = null, actx = null, nodes = null, R = {};

    /* ---- 계산 ---- */
    function coverCalc() {
      var m = MODELS[S.model], lv = SEATS.map(function (s) { return seatLevel(s.x, s.y, m); });
      var vals = lv.map(function (o) { return o.L; }), mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals), sorted = vals.slice().sort(function (a, b) { return a - b; }), med = (sorted[17] + sorted[18]) / 2;
      var front = 0, back = 0; SEATS.forEach(function (s, i) { if (s.row === 0) front += vals[i] / 6; if (s.row === 5) back += vals[i] / 6; });
      var outside = lv.filter(function (o) { return o.th > m.h / 2; }).length;
      var rowsIn = 0; for (var rj = 0; rj < 6; rj++) { var dxr = 5 + 1.8 * rj - S.sx, elr = Math.atan2(S.hgt, dxr) * 180 / Math.PI; if (Math.abs(elr - S.tilt) <= m.v / 2) rowsIn++; }
      return { m: m, lv: lv, max: mx, min: mn, spread: mx - mn, med: med, front: front, back: back, outside: outside, rowsIn: rowsIn };
    }
    function seatLevel(x, y, m) {
      var dx = x - S.sx, dy = y - S.sy, flat = Math.hypot(dx, dy), r = Math.hypot(flat, S.hgt);
      var th = Math.abs(wrap(Math.atan2(dy, dx) * 180 / Math.PI - S.aim)), el2 = Math.atan2(S.hgt, flat) * 180 / Math.PI, tv = Math.abs(el2 - S.tilt);
      var dh = th > 90 ? -30 : dirLoss(th, m.h / 2), dv = dirLoss(tv, m.v / 2);
      return { L: -db20(r) + dh + dv, r: r, th: th, tv: tv, off: Math.max(th / (m.h / 2), tv / (m.v / 2)) };
    }
    function monCalc() {
      var mic = STG.mic, axis = Math.atan2(STG.singer.y - mic.y, STG.singer.x - mic.x);
      function pick(p, lvl) { var d = Math.max(0.3, Math.hypot(p.x - mic.x, p.y - mic.y)), a = wrap((Math.atan2(p.y - mic.y, p.x - mic.x) - axis) * 180 / Math.PI); return { d: d, ang: Math.abs(a), P: lvl - db20(d) + db20(cardio(a * Math.PI / 180)) }; }
      var w = pick({ x: S.mx, y: S.my }, 6), ms = STG.mains.map(function (p) { return pick(p, 6 - 12); });   // 메인 스피커 뒤쪽으로 새는 소리 −12 dB (교육용)
      var sum = Math.pow(10, w.P / 10) + ms.reduce(function (a, o) { return a + Math.pow(10, o.P / 10); }, 0), loop = 10 * Math.log10(sum), margin = -loop;
      var ds = Math.hypot(S.mx - STG.singer.x, S.my - STG.singer.y);
      return { w: w, ms: ms, margin: margin, risk: margin >= 15 ? 'low' : margin >= 8 ? 'mid' : 'high', ds: ds };
    }
    function delCalc() {
      var L = S.listener, dm = Math.hypot(L - DL.main.x, DL.main.y - DL.ear), dd = Math.hypot(L - DL.del.x, DL.del.y - DL.ear);
      var tm = dm / DL.c * 1000, td0 = dd / DL.c * 1000, td = td0 + S.delayMs, dt = td - tm;
      var g = S.delayOn ? (dm / dd) * Math.pow(10, (DL.trim + S.delLvl) / 20) : 0, s = S.polarity === 'reversed' ? -1 : 1;
      return { dm: dm, dd: dd, tm: tm, td0: td0, td: td, dt: dt, g: g, s: s, need: tm - td0, aligned: S.delayOn && dt >= 0 && dt <= 10 };
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function check() {
      var c = R.cover, m = R.mon, d = R.del;
      if (c && c.spread <= 6) hit('cover');
      if (S.hgt + 1.2 <= 2.0) S.sawLow = true;
      if (c && S.sawLow && S.hgt + 1.2 >= 3.5 && c.rowsIn === 6 && c.spread <= 6) hit('height');
      if (m && m.risk === 'low' && m.ds <= 2.0) hit('monitor');
      if (d && d.aligned) hit('delay');
      if (d && d.aligned && S.polarity === 'reversed') S.sawRev = true;
      if (d && d.aligned && S.polarity === 'normal' && S.sawRev) hit('polarity');
    }

    /* ---- 그리기 ---- */
    function prep(k, aspect) { var cv = cvs[k], w = cv.clientWidth || (cv.parentNode && cv.parentNode.clientWidth) || 600, h = Math.round(w * aspect); cv.style.height = h + 'px'; if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } var c = ctxs[k]; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h); return { c: c, w: w, h: h }; }
    function devColor(dev) { return dev > 6 ? '#dc2626' : dev > 3 ? '#f59e0b' : dev >= -3 ? '#16a34a' : dev >= -6 ? '#60a5fa' : '#1e3a8a'; }
    function handlePos(p) { var a = S.aim * Math.PI / 180, r = 1.3; return { x: (S.sx + r * Math.cos(a)) * p, y: (S.sy + r * Math.sin(a)) * p }; }
    function drawCover() {
      var g = prep('cover', ROOM.H / ROOM.W), c = g.c, p = g.w / ROOM.W; px.cover = p; var cc = R.cover, m = cc.m;
      c.fillStyle = '#f1f5f9'; c.fillRect(0, 0, g.w, g.h);
      // 레벨 지도 (좌석 중앙값 기준 편차)
      var N = 40, M = 30, cw = (ROOM.W - ROOM.stage) / N, chh = ROOM.H / M;
      for (var i = 0; i < N; i++) for (var j = 0; j < M; j++) { var x = ROOM.stage + (i + 0.5) * cw, y = (j + 0.5) * chh, L = seatLevel(x, y, m).L; c.fillStyle = devColor(L - cc.med); c.globalAlpha = 0.28; c.fillRect((ROOM.stage + i * cw) * p, j * chh * p, cw * p + 1, chh * p + 1); }
      c.globalAlpha = 1;
      c.fillStyle = '#cbd5e1'; c.fillRect(0, 0, ROOM.stage * p, g.h); c.fillStyle = '#475569'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.fillText('단상', ROOM.stage * p / 2, g.h - 10);
      c.fillStyle = '#64748b'; c.font = '11px sans-serif'; c.textAlign = 'right'; c.fillText('예배실 16 m × 12 m · 스피커 높이 ' + fx(S.hgt + 1.2, 1) + ' m (귀보다 ' + fx(S.hgt, 1) + ' m 위)', g.w - 8, g.h - 8);
      // 커버리지 선 (가로 ±반각)
      var a = S.aim * Math.PI / 180, hh = m.h / 2 * Math.PI / 180, L2 = ROOM.W * 1.6 * p, P = { x: S.sx * p, y: S.sy * p };
      c.save(); c.beginPath(); c.rect(0, 0, g.w, g.h); c.clip();
      c.fillStyle = 'rgba(14,116,144,0.10)'; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(P.x + L2 * Math.cos(a - hh), P.y + L2 * Math.sin(a - hh)); c.lineTo(P.x + L2 * Math.cos(a + hh), P.y + L2 * Math.sin(a + hh)); c.closePath(); c.fill();
      c.setLineDash([6, 5]); c.strokeStyle = '#0e7490'; c.lineWidth = 2; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(P.x + L2 * Math.cos(a - hh), P.y + L2 * Math.sin(a - hh)); c.moveTo(P.x, P.y); c.lineTo(P.x + L2 * Math.cos(a + hh), P.y + L2 * Math.sin(a + hh)); c.stroke(); c.setLineDash([]);
      c.strokeStyle = 'rgba(15,39,71,.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(P.x + L2 * Math.cos(a), P.y + L2 * Math.sin(a)); c.stroke(); c.restore();
      // 좌석
      SEATS.forEach(function (s, i) { var o = cc.lv[i]; c.beginPath(); c.arc(s.x * p, s.y * p, Math.max(6, 0.32 * p), 0, Math.PI * 2); c.fillStyle = devColor(o.L - cc.med); c.fill(); c.lineWidth = i === S.sel ? 3 : 1; c.strokeStyle = i === S.sel ? '#0f2747' : 'rgba(255,255,255,.9)'; c.stroke(); });
      var sp = SEATS[S.sel]; c.fillStyle = '#0f2747'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText('듣는 자리', sp.x * p, sp.y * p - Math.max(9, 0.4 * p));
      // 스피커
      c.save(); c.translate(P.x, P.y); c.rotate(a); c.fillStyle = '#111827'; c.fillRect(-0.35 * p, -0.28 * p, 0.45 * p, 0.56 * p); c.fillStyle = '#e5e7eb'; c.fillRect(0.06 * p, -0.2 * p, 0.06 * p, 0.4 * p); c.restore();
      var hp = handlePos(p); c.strokeStyle = '#92400e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(hp.x, hp.y); c.stroke();
      c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(hp.x, hp.y, 9, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#92400e'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#0f2747'; c.font = 'bold 11px sans-serif'; c.textAlign = 'left'; c.fillText('−6 dB 선', P.x + L2 * 0.12 * Math.cos(a - hh) + 6, P.y + L2 * 0.12 * Math.sin(a - hh) - 4);
    }
    function drawMon() {
      var g = prep('monitor', STG.H / STG.W), c = g.c, p = g.w / STG.W; px.monitor = p; var mm = R.mon;
      c.fillStyle = '#eef3f8'; c.fillRect(0, 0, g.w, g.h);
      c.strokeStyle = '#d6dee8'; c.lineWidth = 1; for (var gx = 0; gx <= STG.W; gx += 0.5) { c.beginPath(); c.moveTo(gx * p, 0); c.lineTo(gx * p, g.h); c.stroke(); } for (var gy = 0; gy <= STG.H; gy += 0.5) { c.beginPath(); c.moveTo(0, gy * p); c.lineTo(g.w, gy * p); c.stroke(); }
      c.fillStyle = '#64748b'; c.font = '11px sans-serif'; c.textAlign = 'left'; c.fillText('격자 한 칸 = 50 cm · 아래쪽이 회중석', 8, g.h - 8);
      // 마이크 지향성 (카디오이드, 정면 = 보컬 쪽)
      var M = { x: STG.mic.x * p, y: STG.mic.y * p }, ax = Math.atan2(STG.singer.y - STG.mic.y, STG.singer.x - STG.mic.x), Rr = 0.9 * p;
      c.beginPath(); for (var dd = 0; dd <= 360; dd += 4) { var th = dd * Math.PI / 180, r = Rr * Math.abs(0.5 + 0.5 * Math.cos(th)), x = M.x + r * Math.cos(ax + th), y = M.y + r * Math.sin(ax + th); if (dd) c.lineTo(x, y); else c.moveTo(x, y); } c.closePath();
      c.fillStyle = 'rgba(14,116,144,0.16)'; c.fill(); c.strokeStyle = '#0e7490'; c.lineWidth = 2; c.stroke();
      // 보컬
      var Sg = { x: STG.singer.x * p, y: STG.singer.y * p };
      c.fillStyle = '#f2d2b6'; c.strokeStyle = '#8b5e3c'; c.lineWidth = 2; c.beginPath(); c.ellipse(Sg.x, Sg.y - 0.06 * p, 0.16 * p, 0.13 * p, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#0f2747'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.fillText('보컬', Sg.x, Sg.y - 0.26 * p);
      c.fillStyle = '#334155'; c.beginPath(); c.arc(M.x, M.y, Math.max(5, 0.05 * p), 0, Math.PI * 2); c.fill();
      c.fillStyle = '#0e7490'; c.textAlign = 'left'; c.fillText('마이크', M.x + 0.12 * p, M.y + 0.05 * p);
      // 메인 스피커 (회중석 쪽을 향함)
      STG.mains.forEach(function (m2, i) { var X = m2.x * p, Y = m2.y * p; c.fillStyle = '#111827'; c.fillRect(X - 0.25 * p, Y - 0.15 * p, 0.5 * p, 0.3 * p); c.fillStyle = '#0f2747'; c.textAlign = 'center'; c.font = 'bold 11px sans-serif'; c.fillText(i ? '메인 R' : '메인 L', X, Y - 0.22 * p); });
      // 모니터 (보컬을 향함)
      var W = { x: S.mx * p, y: S.my * p }, wa = Math.atan2(STG.singer.y - S.my, STG.singer.x - S.mx);
      c.setLineDash([5, 5]); c.strokeStyle = mm.risk === 'low' ? '#16a34a' : mm.risk === 'mid' ? '#d97706' : '#dc2626'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(W.x, W.y); c.lineTo(M.x, M.y); c.stroke(); c.setLineDash([]);
      c.save(); c.translate(W.x, W.y); c.rotate(wa); c.fillStyle = '#1f2937'; c.beginPath(); c.moveTo(-0.18 * p, -0.3 * p); c.lineTo(0.14 * p, -0.25 * p); c.lineTo(0.14 * p, 0.25 * p); c.lineTo(-0.18 * p, 0.3 * p); c.closePath(); c.fill();
      c.strokeStyle = '#94a3b8'; c.lineWidth = 2; for (var k = 1; k <= 2; k++) { c.beginPath(); c.arc(0.14 * p, 0, (0.08 + k * 0.08) * p, -0.6, 0.6); c.stroke(); } c.restore();
      c.fillStyle = '#0f2747'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText('모니터', W.x, W.y + 0.45 * p);
    }
    function drawDelay() {
      var g = prep('delay', 0.34), c = g.c, sx = g.w / DL.len, H = 7, sy = g.h / H; px.delay = sx; var d = R.del;
      function X(x) { return x * sx; } function Y(y) { return g.h - y * sy; }
      c.fillStyle = '#f8fafc'; c.fillRect(0, 0, g.w, g.h);
      c.fillStyle = '#e2e8f0'; c.fillRect(0, Y(0.2), g.w, g.h); c.strokeStyle = '#94a3b8'; c.beginPath(); c.moveTo(0, Y(6.2)); c.lineTo(g.w, Y(6.2)); c.stroke();
      c.fillStyle = '#64748b'; c.font = '10px sans-serif'; c.textAlign = 'left'; c.fillText('천장', 4, Y(6.2) - 3);
      for (var x = 2; x <= DL.len; x += 2) { c.fillText(x + 'm', X(x) - 8, g.h - 2); }
      // 소리 길
      c.lineWidth = 2; c.setLineDash([6, 4]); c.strokeStyle = '#0f2747'; c.beginPath(); c.moveTo(X(DL.main.x), Y(DL.main.y)); c.lineTo(X(S.listener), Y(DL.ear)); c.stroke();
      c.strokeStyle = S.delayOn ? '#0e7490' : '#cbd5e1'; c.setLineDash([]); c.beginPath(); c.moveTo(X(DL.del.x), Y(DL.del.y)); c.lineTo(X(S.listener), Y(DL.ear)); c.stroke();
      // 장비
      c.fillStyle = '#111827'; c.fillRect(X(DL.main.x) - 6, Y(DL.main.y) - 12, 14, 24); c.fillStyle = S.delayOn ? '#0e7490' : '#94a3b8'; c.fillRect(X(DL.del.x) - 7, Y(DL.del.y) - 10, 14, 20);
      c.fillStyle = '#0f2747'; c.font = 'bold 11px sans-serif'; c.textAlign = 'left'; c.fillText('메인', X(DL.main.x) + 10, Y(DL.main.y) - 6); c.fillText('딜레이 스피커', X(DL.del.x) + 10, Y(DL.del.y) - 6);
      c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(X(S.listener), Y(DL.ear), 7, 0, Math.PI * 2); c.fill(); c.fillStyle = '#0f2747'; c.textAlign = 'center'; c.fillText('듣는 자리', X(S.listener), Y(DL.ear) - 12);
      c.font = '11px sans-serif'; c.fillStyle = '#0f2747'; c.textAlign = 'left'; c.fillText('메인 → ' + fx(d.dm, 1) + ' m', X(4), Y(1.9));
      if (S.delayOn) { c.fillStyle = '#0e7490'; c.fillText(fx(d.dd, 1) + ' m', X((DL.del.x + S.listener) / 2) + 4, Y(2.4)); }
      drawGraph(d);
    }
    function drawGraph(d) {
      var cv = cvs.graph, c = ctxs.graph, w = cv.clientWidth || 600, h = cv.clientHeight || 190;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      // 위: 도착 시간 막대 (0–100 ms)
      var tx0 = 46, tx1 = w - 12, tmax = 100, T = function (ms) { return tx0 + clamp(ms, 0, tmax) / tmax * (tx1 - tx0); };
      c.fillStyle = '#0f2747'; c.font = 'bold 11px sans-serif'; c.textAlign = 'left'; c.fillText('도착 시간', 6, 20);
      c.strokeStyle = '#cbd5e1'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx0, 30); c.lineTo(tx1, 30); c.stroke();
      c.fillStyle = '#64748b'; c.font = '10px sans-serif'; c.textAlign = 'center'; for (var ms = 0; ms <= tmax; ms += 20) { c.fillText(ms + ' ms', T(ms), 46); c.beginPath(); c.moveTo(T(ms), 27); c.lineTo(T(ms), 33); c.stroke(); }
      function mark(ms, col, lab, up) { c.fillStyle = col; c.fillRect(T(ms) - 2, 16, 4, 20); c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.fillText(lab, T(ms), up ? 13 : 58); }
      mark(d.tm, '#0f2747', '메인 ' + fx(d.tm, 1), true); if (S.delayOn) mark(d.td, '#0e7490', '딜레이 ' + fx(d.td, 1), false);
      // 아래: 주파수 응답 (메인만 = 0 dB)
      var x0 = 46, x1 = w - 12, y0 = 72, y1 = h - 22, f0 = 50, f1 = 16000, FX = function (f) { return x0 + (Math.log10(f) - Math.log10(f0)) / (Math.log10(f1) - Math.log10(f0)) * (x1 - x0); }, FY = function (v) { return y0 + (8 - v) / 32 * (y1 - y0); };
      c.strokeStyle = '#e2e8f0'; c.fillStyle = '#64748b'; c.font = '10px sans-serif';
      [100, 1000, 10000].forEach(function (f) { c.beginPath(); c.moveTo(FX(f), y0); c.lineTo(FX(f), y1); c.stroke(); c.textAlign = 'center'; c.fillText(f >= 1000 ? (f / 1000) + 'k' : String(f), FX(f), h - 8); });
      [6, 0, -12, -24].forEach(function (v) { c.beginPath(); c.moveTo(x0, FY(v)); c.lineTo(x1, FY(v)); c.stroke(); c.textAlign = 'right'; c.fillText(String(v), x0 - 4, FY(v) + 3); });
      c.textAlign = 'left'; c.fillStyle = '#0f2747'; c.font = 'bold 11px sans-serif'; c.fillText('듣는 자리의 음색 (메인만 = 0 dB, 교육용 계산)', 6, y0 - 4);
      c.strokeStyle = '#dc2626'; c.lineWidth = 2; c.beginPath();
      var dt = d.dt / 1000, first = true; for (var f = f0; f <= f1; f *= 1.01) { var wv = 2 * Math.PI * f * dt, re = 1 + d.s * d.g * Math.cos(wv), im = -d.s * d.g * Math.sin(wv), v = clamp(10 * Math.log10(Math.max(1e-6, re * re + im * im)), -24, 8); if (first) { c.moveTo(FX(f), FY(v)); first = false; } else c.lineTo(FX(f), FY(v)); }
      c.stroke();
    }
    /* 2026-10-23: 옆에서 본 모습 — 스피커 높이·숙이기와 세로 커버리지, 줄마다 앉은 사람(귀 높이 1.2 m) */
    function drawSide() {
      var HM = 6.6, g = prep('side', HM / ROOM.W), c = g.c, p = g.w / ROOM.W, cc = R.cover, m = cc.m, Y = function (h) { return g.h - 16 - h * (g.h - 26) / HM; }, X = function (x) { return x * p; };
      c.fillStyle = '#f8fafc'; c.fillRect(0, 0, g.w, g.h);
      c.fillStyle = '#e2e8f0'; c.fillRect(0, Y(0), g.w, g.h - Y(0)); c.fillStyle = '#cbd5e1'; c.fillRect(0, Y(0.4), X(ROOM.stage), Y(0) - Y(0.4));
      c.fillStyle = '#475569'; c.font = 'bold 11px sans-serif'; c.textAlign = 'left'; c.fillText('옆에서 본 모습 · 세로 커버리지 ±' + (m.v / 2) + '°', 8, 16);
      var spH = S.hgt + 1.2, P = { x: X(S.sx), y: Y(spH) }, tl = S.tilt * Math.PI / 180, hv = m.v / 2 * Math.PI / 180, L = g.w * 2;
      var sx2 = (g.h - 26) / HM / p;   // 가로·세로 축척 비(같게 그리면 1)
      function ray(a) { return { x: P.x + L * Math.cos(a), y: P.y + L * Math.sin(a) * sx2 }; }
      c.save(); c.beginPath(); c.rect(0, 0, g.w, Y(0)); c.clip();
      var a1 = ray(tl - hv), a2 = ray(tl + hv), a0 = ray(tl);
      c.fillStyle = 'rgba(14,116,144,0.12)'; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(a1.x, a1.y); c.lineTo(a2.x, a2.y); c.closePath(); c.fill();
      c.setLineDash([6, 5]); c.strokeStyle = '#0e7490'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(a1.x, a1.y); c.moveTo(P.x, P.y); c.lineTo(a2.x, a2.y); c.stroke(); c.setLineDash([]);
      c.strokeStyle = 'rgba(15,39,71,.45)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(a0.x, a0.y); c.stroke(); c.restore();
      for (var j = 0; j < 6; j++) {
        var x = 5 + 1.8 * j, el = Math.atan2(S.hgt, x - S.sx) * 180 / Math.PI, inside = Math.abs(el - S.tilt) <= m.v / 2, col = inside ? '#16a34a' : '#f59e0b';
        c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(X(x), Y(0)); c.lineTo(X(x), Y(0.95)); c.stroke();
        c.fillStyle = col; c.beginPath(); c.arc(X(x), Y(1.2), Math.max(4, 0.16 * p), 0, Math.PI * 2); c.fill();
        c.fillStyle = '#475569'; c.font = '10px sans-serif'; c.textAlign = 'center'; c.fillText((j + 1) + '줄', X(x), g.h - 3);
      }
      c.save(); c.translate(P.x, P.y); c.rotate(Math.atan2(Math.sin(tl) * sx2, Math.cos(tl))); c.fillStyle = '#111827'; c.fillRect(-0.35 * p, -0.25 * p, 0.45 * p, 0.5 * p); c.fillStyle = '#e5e7eb'; c.fillRect(0.06 * p, -0.17 * p, 0.06 * p, 0.34 * p); c.restore();
      c.strokeStyle = '#94a3b8'; c.lineWidth = 1; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(P.x, Y(0)); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#0f2747'; c.font = 'bold 11px sans-serif'; c.textAlign = 'left'; c.fillText(fx(spH, 1) + ' m', P.x + 6, (P.y + Y(0)) / 2);
      c.fillStyle = '#64748b'; c.font = '10px sans-serif'; c.textAlign = 'right'; c.fillText('초록 = 세로 커버리지 안 · 주황 = 밖 (앉은 귀 높이 1.2 m)', g.w - 6, 16);
    }
    function drawAll() { if (S.scene === 'cover') { drawCover(); drawSide(); } if (S.scene === 'monitor') drawMon(); if (S.scene === 'delay') drawDelay(); }

    /* ---- 글 ---- */
    function row(a, b, cls) { return '<div class="sim-row"><span>' + a + '</span><b class="' + (cls || '') + '">' + b + '</b></div>'; }
    function readCover() {
      var c = R.cover, o = c.lv[S.sel], sel = SEATS[S.sel], ok = c.spread <= 6, mid = c.spread <= 9;
      q('[data-out=aim]').textContent = sgn(S.aim, 0) + '°'; q('[data-out=tilt]').textContent = S.tilt + '°'; q('[data-out=hgt]').textContent = fx(S.hgt + 1.2, 1) + ' m';
      q('[data-sim=aim]').value = S.aim; q('[data-sim=tilt]').value = S.tilt; q('[data-sim=hgt]').value = fx(S.hgt + 1.2, 1);
      q('[data-role=readCover]').innerHTML = '<h4>결과 <small>교육용 근사 · 반사음 없음</small></h4>' +
        row('좌석 레벨 차이 (최대 − 최소)', fx(c.spread, 1) + ' dB', ok ? 'ok' : mid ? 'warn' : 'bad') +
        row('앞줄 평균 − 뒷줄 평균', sgn(c.front - c.back, 1) + ' dB') +
        row('가로 커버리지 밖 좌석', c.outside + '석', c.outside ? 'warn' : 'ok') +
        row('세로 커버리지 안에 든 줄', c.rowsIn + ' / 6줄', c.rowsIn === 6 ? 'ok' : 'warn') +
        row('듣는 자리 (' + (sel.row + 1) + '번째 줄)', sgn(o.L - c.max, 1) + ' dB · 거리 ' + fx(o.r, 1) + ' m') +
        row('축에서 벗어난 각도', '가로 ' + fx(o.th, 0) + '° · 세로 ' + fx(o.tv, 0) + '°', o.off > 1 ? 'warn' : '') +
        '<div class="sim-speaker-verdict ' + (ok ? 'ok' : mid ? 'warn' : 'bad') + '">' + (ok ? '좋아요. 모든 좌석이 6 dB 안에서 고르게 들려요.' : c.front - c.back > 4 ? '앞줄이 너무 커요. 스피커를 더 뒤쪽(뒷줄)으로 겨누거나 덜 숙여 보세요.' : c.outside ? '커버리지 밖 좌석이 있어요. 방향을 객석 가운데로 돌리거나 더 넓은 스피커를 골라 보세요.' : '자리마다 차이가 커요. 위치·방향·기울기를 바꿔 보세요.') + '</div>' +
        '<p class="sim-note">거리 2배 → −6 dB, 커버리지 경계 → −6 dB 로 계산했어요. 축에서 벗어난 자리는 고음이 줄어 먹먹하게 들려요. 스피커가 낮으면 앞줄이 뒷줄보다 훨씬 가까워져 앞뒤 차이가 커지고, 높이면 거리 차가 줄어요. 대신 높일수록 더 숙여야 앞줄이 세로 커버리지 안에 들어와요.</p>';
    }
    function readMon() {
      var m = R.mon, rk = { low: ['ok', '낮음'], mid: ['warn', '보통'], high: ['bad', '높음 (하울링 위험)'] }[m.risk], hear = m.ds <= 2.0;
      q('[data-role=readMon]').innerHTML = '<h4>결과 <small>교육용 근사 계산</small></h4>' +
        row('모니터 방향 (마이크 정면 기준)', fx(m.w.ang, 0) + '°') +
        row('모니터 ↔ 마이크', fx(m.w.d, 2) + ' m') +
        row('피드백 위험', rk[1] + ' (여유 ' + fx(m.margin, 0) + ' dB)', rk[0]) +
        '<span class="sim-bar ' + rk[0] + '"><i style="width:' + clamp((m.margin + 10) / 40 * 100, 0, 100).toFixed(1) + '%"></i></span>' +
        row('보컬 ↔ 모니터', fx(m.ds, 1) + ' m · ' + (hear ? '잘 들려요' : '멀어서 잘 안 들려요'), hear ? 'ok' : 'warn') +
        '<p class="sim-note">카디오이드는 정면(0°)을 가장 잘, 바로 뒤(180°)를 가장 적게 받아요. 메인 스피커는 마이크보다 앞(회중석 쪽)에서 회중석을 향해 있어 마이크로 적게 들어와요.</p>';
    }
    function readDel() {
      var d = R.del, v, cls;
      q('[data-out=delay]').textContent = fx(S.delayMs, 1) + ' ms'; q('[data-out=lis]').textContent = fx(S.listener, 1) + ' m';
      q('[data-sim=delayMs]').value = S.delayMs; q('[data-sim=listener]').value = S.listener; q('[data-sim=delLvl]').value = S.delLvl; q('[data-out=lvl]').textContent = sgn(S.delLvl, 0) + ' dB';
      if (!S.delayOn) { v = '딜레이 스피커가 꺼져 있어요. 메인 소리만 들려요.'; cls = 'warn'; }
      else if (d.dt < -1) { v = '딜레이 스피커 소리가 ' + fx(-d.dt, 1) + ' ms 먼저 와요. 소리가 천장에서 나는 것처럼 들리고, 차이가 크면 메아리처럼 들려요.'; cls = 'bad'; }
      else if (d.dt < 0) { v = '거의 동시예요. 하지만 딜레이 스피커가 아주 조금 먼저 와요. 조금 더 늦춰 보세요.'; cls = 'warn'; }
      else if (d.dt <= 10) { v = '알맞아요. 메인보다 ' + fx(d.dt, 1) + ' ms 늦게 도착해 소리가 무대 쪽에서 들리는 느낌이 남아요.' + (S.polarity === 'reversed' ? ' 그런데 극성이 반대라 저음이 상쇄돼요!' : ' 두 소리가 겹치는 자리에서는 콤 필터(빗살 모양)가 생겨요. 딜레이 스피커 레벨을 조금 낮추면 골이 얕아져요.'); cls = S.polarity === 'reversed' ? 'warn' : 'ok'; }
      else if (d.dt <= 30) { v = fx(d.dt, 1) + ' ms 늦어요. 소리가 번지고 말소리가 흐려져요.'; cls = 'warn'; }
      else { v = fx(d.dt, 1) + ' ms 늦어요. 메아리처럼 따로 들려요.'; cls = 'bad'; }
      q('[data-role=readDel]').innerHTML = '<h4>결과 <small>소리 속도 343 m/s</small></h4>' +
        row('메인 → 듣는 자리', fx(d.dm, 1) + ' m · ' + fx(d.tm, 1) + ' ms') +
        row('딜레이 스피커 → 듣는 자리', fx(d.dd, 1) + ' m · ' + fx(d.td0, 1) + ' ms') +
        row('딜레이 설정을 더하면', fx(d.td, 1) + ' ms') +
        row('도착 시간 차이 (딜레이 − 메인)', S.delayOn ? sgn(d.dt, 1) + ' ms' : '—', S.delayOn ? (d.aligned ? 'ok' : 'warn') : '') +
        row('크기 차이 (딜레이 − 메인)', S.delayOn ? sgn(db20(d.g), 1) + ' dB' : '—') +
        '<div class="sim-speaker-verdict ' + cls + '">' + v + '</div>' +
        '<p class="sim-note">힌트: 필요한 지연 ≈ (메인 거리 − 딜레이 스피커 거리) ÷ 343 m/s. 자리를 옮기면 맞는 값이 조금씩 달라져요.</p>';
    }

    /* ---- 소리 ---- */
    function applyAudio() {
      if (!nodes) return; var tt = actx.currentTime, n = nodes;
      if (S.scene === 'cover') { var c = R.cover, o = c.lv[S.sel], cut = 16000 * Math.pow(2, -2 * Math.max(0, o.off - 0.7));
        n.dA.delayTime.setTargetAtTime(0, tt, 0.02); n.gA.gain.setTargetAtTime(Math.pow(10, (o.L - c.max) / 20) * 0.8, tt, 0.03); n.lp.frequency.setTargetAtTime(clamp(cut, 1500, 18000), tt, 0.03); n.gB.gain.setTargetAtTime(0, tt, 0.02); n.mon.gain.setTargetAtTime(0.9, tt, 0.03); }
      else if (S.scene === 'delay') { var d = R.del, base = Math.min(d.tm, d.td);
        n.dA.delayTime.setTargetAtTime((d.tm - base) / 1000, tt, 0.03); n.dB.delayTime.setTargetAtTime((d.td - base) / 1000, tt, 0.03);
        n.gA.gain.setTargetAtTime(0.6, tt, 0.02); n.gB.gain.setTargetAtTime(0.6 * d.g * d.s, tt, 0.02); n.lp.frequency.setTargetAtTime(18000, tt, 0.02); n.mon.gain.setTargetAtTime(0.8, tt, 0.03); }
      else { n.mon.gain.setTargetAtTime(0, tt, 0.03); }
    }
    function startAudio() {
      if (!stem || !stem.buffer) { q('[data-role=srcnote]').textContent = '녹음을 불러오지 못해 소리는 들을 수 없어요(그림과 계산은 그대로 동작).'; return; }
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      actx = actx || new AC(); if (actx.resume) actx.resume();
      var src = actx.createBufferSource(); src.buffer = stem.buffer; src.loop = true;
      var dA = actx.createDelay(1), gA = actx.createGain(), lp = actx.createBiquadFilter(), dB = actx.createDelay(1), gB = actx.createGain(), mon = actx.createGain();
      lp.type = 'lowpass'; lp.Q.value = 0.7; lp.frequency.value = 18000; mon.gain.value = 0;
      src.connect(dA); dA.connect(gA); gA.connect(lp); lp.connect(mon); src.connect(dB); dB.connect(gB); gB.connect(mon); mon.connect(actx.destination);
      src.start(actx.currentTime + 0.05);
      nodes = { src: src, dA: dA, gA: gA, lp: lp, dB: dB, gB: gB, mon: mon }; S.audio = true; applyAudio();
    }
    function stopAudio() { if (nodes) { try { nodes.src.stop(); nodes.mon.disconnect(); } catch (e) { /* 이미 멈춤 */ } } nodes = null; S.audio = false; }
    function setPlayBtn() { var b = q('[data-sim=play]'); b.textContent = S.audio ? '🔇 소리 끄기' : '🔊 소리 켜기'; b.classList.toggle('on', S.audio); }
    function load(key) {
      q('[data-role=srcnote]').textContent = '녹음을 불러오는 중…';
      loadStem(key, function (e) { if (!alive || S.src !== key) return; var on = S.audio; if (on) stopAudio(); stem = e;
        q('[data-role=srcnote]').textContent = e.synthetic ? '녹음을 불러오지 못해 소리는 들을 수 없어요.' : (key === 'leadVox' ? '보컬' : '키보드') + ' 녹음(MG12XU 실습과 같은 음원)이 반복돼요. ① 은 고른 좌석에서 듣는 소리, ③ 은 메인 + 딜레이 스피커가 더해진 소리예요.';
        if (on) { startAudio(); setPlayBtn(); } });
    }

    /* ---- 갱신 ---- */
    function update() {
      R.cover = coverCalc(); R.mon = monCalc(); R.del = delCalc();
      Object.keys(MODELS).forEach(function (k) { var r = el.querySelector('input[name=simSpkModel][value="' + k + '"]'); if (r) r.checked = k === S.model; });
      el.querySelectorAll('input[name=simSpkPol]').forEach(function (r) { r.checked = r.value === S.polarity; }); q('[data-sim=delayOn]').checked = S.delayOn;
      el.querySelectorAll('[data-scene]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-scene') === S.scene)); });
      el.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== S.scene; });
      readCover(); readMon(); readDel(); check(); drawAll(); applyAudio();
    }

    /* ---- 입력 ---- */
    var drag = null;
    function pt(cv, e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function downCover(e) {
      var p = pt(cvs.cover, e), k = px.cover, hp = handlePos(k);
      if (Math.hypot(p.x - hp.x, p.y - hp.y) < 16) drag = 'rot';
      else if (Math.hypot(p.x - S.sx * k, p.y - S.sy * k) < Math.max(20, 0.5 * k)) drag = 'move';
      else { var best = -1, bd = 1e9; SEATS.forEach(function (s, i) { var dd = Math.hypot(p.x - s.x * k, p.y - s.y * k); if (dd < bd) { bd = dd; best = i; } }); if (bd < Math.max(14, 0.6 * k)) { S.sel = best; update(); } return; }
      cvs.cover.setPointerCapture(e.pointerId); e.preventDefault();
    }
    function moveCover(e) {
      if (!drag) return; var p = pt(cvs.cover, e), k = px.cover;
      if (drag === 'move') { S.sx = clamp(p.x / k, 0.4, ROOM.stage - 0.2); S.sy = clamp(p.y / k, 0.4, ROOM.H - 0.4); }
      else S.aim = clamp(Math.round(Math.atan2(p.y / k - S.sy, p.x / k - S.sx) * 180 / Math.PI), -90, 90);
      update();
    }
    function downMon(e) { var p = pt(cvs.monitor, e), k = px.monitor; if (Math.hypot(p.x - S.mx * k, p.y - S.my * k) < Math.max(22, 0.4 * k)) { drag = 'mon'; cvs.monitor.setPointerCapture(e.pointerId); e.preventDefault(); } }
    function moveMon(e) { if (drag !== 'mon') return; var p = pt(cvs.monitor, e), k = px.monitor; S.mx = clamp(p.x / k, 0.3, STG.W - 0.3); S.my = clamp(p.y / k, 0.3, STG.H - 0.3); update(); }
    function up() { drag = null; }
    function onInput(e) { var tg = e.target, k = tg.getAttribute('data-sim'); if (k === 'aim') S.aim = +tg.value; else if (k === 'tilt') S.tilt = +tg.value; else if (k === 'hgt') S.hgt = clamp(+tg.value - 1.2, 0.6, 4.8); else if (k === 'delayMs') S.delayMs = +tg.value; else if (k === 'listener') S.listener = +tg.value; else if (k === 'delLvl') S.delLvl = +tg.value; else return; update(); }
    function onChange(e) { var tg = e.target; if (tg.name === 'simSpkModel') { S.model = tg.value; update(); } else if (tg.name === 'simSpkPol') { S.polarity = tg.value; update(); } else if (tg.getAttribute('data-sim') === 'delayOn') { S.delayOn = tg.checked; update(); } else if (tg.name === 'simSpkSrc') { S.src = tg.value; load(S.src); } }
    function onClick(e) {
      var sc = e.target.closest('[data-scene]'); if (sc) { S.scene = sc.getAttribute('data-scene'); update(); return; }
      var b = e.target.closest('button[data-sim]'); if (!b) return; var k = b.getAttribute('data-sim');
      if (k === 'play') { if (S.audio) stopAudio(); else startAudio(); setPlayBtn(); }
      if (k === 'resetCover') { S.sx = 1.0; S.sy = 1.0; S.aim = 0; S.tilt = 20; S.hgt = 2.5; S.model = 'zxa1'; update(); }
      if (k === 'resetMon') { S.mx = 1.9; S.my = 1.34; update(); }
    }
    cvs.cover.addEventListener('pointerdown', downCover); cvs.cover.addEventListener('pointermove', moveCover); cvs.cover.addEventListener('pointerup', up); cvs.cover.addEventListener('pointercancel', up);
    cvs.monitor.addEventListener('pointerdown', downMon); cvs.monitor.addEventListener('pointermove', moveMon); cvs.monitor.addEventListener('pointerup', up); cvs.monitor.addEventListener('pointercancel', up);
    el.addEventListener('input', onInput); el.addEventListener('change', onChange); el.addEventListener('click', onClick);
    var ro = window.ResizeObserver ? new ResizeObserver(function () { drawAll(); }) : null; if (ro) ro.observe(el); else window.addEventListener('resize', drawAll);
    update();   // 2026-10-24: 녹음 불러오기·소리 재생 없음

    return {
      destroy: function () { alive = false; stopAudio(); if (actx && actx.close) { try { actx.close(); } catch (e) { /* noop */ } } if (ro) ro.disconnect(); else window.removeEventListener('resize', drawAll);
        cvs.cover.removeEventListener('pointerdown', downCover); cvs.cover.removeEventListener('pointermove', moveCover); cvs.cover.removeEventListener('pointerup', up); cvs.cover.removeEventListener('pointercancel', up);
        cvs.monitor.removeEventListener('pointerdown', downMon); cvs.monitor.removeEventListener('pointermove', moveMon); cvs.monitor.removeEventListener('pointerup', up); cvs.monitor.removeEventListener('pointercancel', up);
        el.removeEventListener('input', onInput); el.removeEventListener('change', onChange); el.removeEventListener('click', onClick); el.innerHTML = ''; },
      state: function () { var c = R.cover, m = R.mon, d = R.del; return { scene: S.scene, model: S.model, sx: S.sx, sy: S.sy, aim: S.aim, tilt: S.tilt, height: S.hgt + 1.2, rowsIn: c.rowsIn, sel: S.sel, spread: c.spread, frontMinusBack: c.front - c.back, outside: c.outside,
        mx: S.mx, my: S.my, margin: m.margin, risk: m.risk, monAngle: m.w.ang, ds: m.ds, listener: S.listener, delayMs: S.delayMs, delLvl: S.delLvl, polarity: S.polarity, delayOn: S.delayOn, tMain: d.tm, tDelay: d.td, dt: d.dt, need: d.need, aligned: d.aligned,
        audio: S.audio, ready: true, synthetic: false, done: Object.keys(S.done) }; },
      set: function (o) {
        o = o || {};
        if (o.scene && /^(cover|monitor|delay)$/.test(o.scene)) S.scene = o.scene;
        if (o.model && MODELS[o.model]) S.model = o.model;
        if (o.sx != null) S.sx = clamp(+o.sx, 0.4, ROOM.stage - 0.2); if (o.sy != null) S.sy = clamp(+o.sy, 0.4, ROOM.H - 0.4);
        if (o.aim != null) S.aim = clamp(+o.aim, -90, 90); if (o.tilt != null) S.tilt = clamp(+o.tilt, 0, 45); if (o.height != null) S.hgt = clamp(+o.height - 1.2, 0.6, 4.8);
        if (o.sel != null) S.sel = clamp(Math.round(+o.sel), 0, SEATS.length - 1);
        if (o.mx != null) S.mx = clamp(+o.mx, 0.3, STG.W - 0.3); if (o.my != null) S.my = clamp(+o.my, 0.3, STG.H - 0.3);
        if (o.listener != null) S.listener = clamp(+o.listener, 13, 24); if (o.delLvl != null) S.delLvl = clamp(Math.round(+o.delLvl), -12, 6); if (o.delayMs != null) S.delayMs = clamp(+o.delayMs, 0, 80);
        if (o.polarity && /^(normal|reversed)$/.test(o.polarity)) S.polarity = o.polarity;
        if (o.delayOn != null) S.delayOn = !!o.delayOn;
        update(); return this.state();
      },
      model: { ROOM: ROOM, SEATS: SEATS, STG: STG, DL: DL, MODELS: MODELS }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.speakerRoom = speakerRoom;

  /* ------------------------------------------------------------------ 모듈 데이터 */
  var MODS = window.STA_MODULES = window.STA_MODULES || {}, stub = MODS.speaker || {};
  MODS.speaker = {
    id: 'speaker', path: stub.path || 'hardware', no: stub.no || 5, status: 'ready', level: stub.level || '중급', minutes: stub.minutes || 30, img: 'img/modules/ev_zxa1.jpg',   /* 2026-10-23: 3층 d&b 사진 → 확성 실습의 EV ZXA1 */
    title: stub.title || '스피커', sub: stub.sub || '전기 신호를 다시 소리로 바꾸는 장치',
    overview: {
      lead: '스피커는 앰프가 키운 전기 신호로 콘(진동판)을 움직여 다시 소리로 바꾸는 장치예요. <b>액티브·패시브</b>에 따라 연결 방법이 다르고, 소리를 어느 방향으로 얼마나 넓게 보내는지(<b>지향성·커버리지</b>), 그리고 <b>어디에 두고 어디로 겨누는지</b>가 회중석의 소리와 피드백을 결정해요.',
      terms: [
        ['액티브 스피커', '앰프가 스피커 안에 들어 있어서 전원과 라인 신호만 연결하면 소리가 나요. 예: EV ZXA1'],
        ['패시브 스피커', '앰프가 없어서 파워앰프의 스피커 출력(speakON)을 받아야 소리가 나요. 예: EV ZX1'],
        ['우퍼 · 고음 드라이버', '스피커 안에서 저음을 맡는 큰 드라이버가 우퍼, 고음을 맡는 작은 드라이버가 고음 드라이버(트위터)예요.'],
        ['크로스오버', '소리를 주파수대로 나눠 저음은 우퍼로, 고음은 고음 드라이버로 보내는 회로예요.'],
        ['커버리지 각도', '스피커가 소리를 고르게 보내는 범위예요. 보통 정면보다 6 dB 작아지는 지점까지의 각도(예: 가로 90° × 세로 50°)로 적어요.'],
        ['서브우퍼', '아주 낮은 저음(대략 100 Hz 아래)만 맡는 스피커예요. 보통 바닥에 두고 메인 스피커와 함께 써요.'],
        ['딜레이(필) 스피커', '메인 소리가 약한 곳을 보강하는 스피커예요. 메인 소리가 도착하는 시간에 맞춰 신호를 늦춰서 보내요.'],
        ['극성', '같은 신호에 스피커 콘이 앞으로 나가는지 뒤로 들어가는지의 방향이에요. 두 스피커의 극성이 반대면 겹치는 곳에서 소리가 상쇄돼요.']
      ],
      points: [
        '액티브(ZXA1)는 <b>전원 + 라인 신호</b>, 패시브(ZX1)는 <b>앰프의 speakON 출력</b>이 필요해요.',
        '커버리지 각도는 정면보다 <b>6 dB</b> 작아지는 경계예요. 스피커를 <b>뒷줄 쪽으로 겨누면</b> 앞뒤 차이가 줄어요.',
        '소리는 1 m 가는 데 약 <b>2.9 ms</b> 걸려요. 딜레이 스피커는 메인 소리가 도착하는 시간에 맞춰 늦춰요.'
      ],
      model: 'zxa1'
    },
    theory: [
      { title: '액티브 스피커와 패시브 스피커', visual: 'spkActivePassive',
        body: '<b>액티브</b> 스피커는 앰프와 크로스오버가 안에 들어 있어서 전원과 라인(또는 마이크) 신호만 연결하면 돼요. <b>패시브</b> 스피커는 앰프가 없어서 파워앰프의 스피커 출력을 speakON 케이블로 받아야 해요. 겉모습이 비슷해도 연결 방법은 완전히 달라요.',
        more: '<ul><li><b>EV ZXA1 (제조사 자료)</b>: 액티브, 8" 우퍼 + 1" 고음 드라이버, 내장 Class D 바이앰프 800 W, 최대 음압 126 dB, 무게 8.6 kg.</li><li><b>EV ZX1 (제조사 자료)</b>: 패시브, 8Ω, 200 W 연속 · 400 W 프로그램 · 800 W 피크, speakON(NL4) 단자.</li><li>교회 확성 실습: 3D 실습 ①·② 는 ZXA1, ③ 은 Crown XLi1500 + ZX1 구성이에요.</li><li>액티브 스피커는 전원을 켜고 끄는 순서도 중요해요. 콘솔을 먼저 켜고 스피커는 마지막에 켜요.</li></ul>',
        check: { q: '액티브 스피커 ZXA1 에서 소리가 나려면 무엇을 연결해야 할까요?', options: [
          { t: '전원, 그리고 라인(또는 마이크) 신호', ok: true, why: '맞아요. 앰프가 안에 있어서 전원과 신호만 있으면 돼요.' },
          { t: '파워앰프의 speakON 출력', why: 'speakON 출력은 패시브 스피커용이에요. ZXA1 의 입력에 앰프 출력을 넣으면 안 돼요.' },
          { t: '신호 없이 전원만', why: '전원만으로는 소리가 나지 않아요. 콘솔이나 마이크의 신호가 필요해요.' }] } },
      { title: '스피커의 기본 구조 — 풀레인지 · 2웨이 · 3웨이', visual: 'spkWays',
        body: '스피커 통(인클로저) 안에는 소리를 내는 <b>드라이버</b>가 들어 있어요. 드라이버 하나로 모든 소리를 내면 <b>풀레인지(1웨이)</b>, 저음용 <b>우퍼</b>와 고음용 <b>고음 드라이버(트위터)</b>로 나누면 <b>2웨이</b>, 여기에 중음용 <b>미드레인지</b>를 더하면 <b>3웨이</b>예요. 나눌수록 드라이버마다 잘하는 대역만 맡아서 더 크고 깨끗한 소리를 낼 수 있지만, 구조가 복잡해지고 값이 올라가요. 소리를 대역별로 나눠 각 드라이버에 보내는 것이 <b>크로스오버</b>예요.',
        more: '<ul><li><b>풀레인지 (1웨이)</b>: 작은 드라이버 하나. 천장·벽 안내 방송 스피커처럼 말소리 위주로 써요. 아주 낮은 저음과 아주 높은 고음은 약해요.</li><li><b>2웨이</b>: 가장 흔한 구조예요. 예: EV ZXA1 은 8인치 우퍼 + 1인치 고음 드라이버이고 1.8 kHz 에서 나눠요(제조사 자료).</li><li><b>3웨이</b>: 저음·중음·고음 세 드라이버, 크로스오버가 두 곳이에요(예: 약 500 Hz 와 3 kHz — 모델마다 달라요). 큰 메인 스피커나 스튜디오 모니터에서 볼 수 있어요.</li><li><b>패시브 크로스오버와 바이앰프</b>: 패시브 스피커는 통 안의 부품(코일·콘덴서)으로 나누고, 액티브 스피커는 앰프 앞에서 나눈 뒤 드라이버마다 따로 앰프를 붙이기도 해요(바이앰프). ZXA1 의 내장 앰프가 바이앰프예요.</li><li><b>서브우퍼</b>를 더하면 시스템 전체로는 아주 낮은 저음 대역 하나가 더 생겨요.</li><li>우퍼와 고음 드라이버를 한 축에 겹쳐 넣은 <b>동축형</b>은 심화 학습에서 다뤄요.</li></ul>',
        check: { q: '8인치 우퍼 하나와 1인치 고음 드라이버 하나가 들어 있는 스피커는?', options: [
          { t: '2웨이', ok: true, why: '맞아요. 저음과 고음 두 대역으로 나눠요.' },
          { t: '3웨이', why: '3웨이는 저음·중음·고음 세 드라이버가 있어요.' },
          { t: '풀레인지', why: '풀레인지는 드라이버 하나로 모든 대역을 내요.' }] } },
      { title: '드라이버와 주파수 응답', visual: 'spkDrivers',
        body: '한 개의 드라이버로 낮은 소리부터 높은 소리까지 모두 잘 내기는 어려워요. 그래서 큰 <b>우퍼</b>는 저음을, 작은 <b>고음 드라이버</b>(트위터)는 고음을 맡고, <b>크로스오버</b>가 소리를 주파수대로 나눠 보내요. <b>주파수 응답</b>은 스피커가 어느 범위의 소리를 얼마나 고르게 내는지 보여 줘요.',
        more: '<ul><li><b>ZXA1 (제조사 자료)</b>: 주파수 응답 60 Hz–20 kHz (−3 dB), 범위 48 Hz–20 kHz (−10 dB), 크로스오버 1.8 kHz (24 dB/oct).</li><li><b>ZX1 (제조사 자료)</b>: 60 Hz–20 kHz (−3 dB), 크로스오버 1.7 kHz.</li><li>더 낮은 저음(킥드럼·베이스)은 <b>서브우퍼</b>가 맡아요. ZXA1 에는 서브우퍼와 함께 쓸 때 켜는 <b>100 Hz 하이패스 필터</b> 스위치가 있어요(제조사 자료).</li><li>「−3 dB」「−10 dB」는 범위의 끝을 어디서 잘랐는지를 뜻해요. 기준이 다르면 숫자를 바로 비교하기 어려워요.</li></ul>',
        check: { q: '스피커 안의 크로스오버가 하는 일은?', options: [
          { t: '소리를 크게 키운다', why: '소리를 키우는 것은 앰프의 일이에요.' },
          { t: '소리를 주파수대로 나눠 우퍼와 고음 드라이버로 보낸다', ok: true, why: '맞아요. ZXA1 은 1.8 kHz 에서 나눠요(제조사 자료).' },
          { t: '두 스피커의 도착 시간을 맞춘다', why: '도착 시간을 맞추는 것은 딜레이의 일이에요.' }] } },
      { title: '지향성과 커버리지, 설치 방향', visual: 'spkCoverage',
        body: '스피커는 주로 앞쪽으로 소리를 보내요. <b>커버리지 각도</b>는 정면보다 약 6 dB 작아지는 경계까지의 각도로, 「가로 × 세로」로 적어요(예: 90° × 50°). 회중석 전체가 이 범위 안에 들어오게 <b>위치·방향·기울기</b>를 정해요. 거리가 2배가 되면 약 6 dB 작아지므로, <b>뒷줄 쪽으로 겨누면</b> 가까운 앞줄은 축에서 벗어나 조금 작아지고 먼 뒷줄은 정면으로 받아서 앞뒤 차이가 줄어요.',
        more: '<ul><li><b>EV ZXA1-90 · ZX1-90 (제조사 자료)</b>: 90° × 50°. ZX1-90 은 혼을 돌려 50° × 90° 로도 쓸 수 있어요.</li><li>고음일수록 지향성이 좁아지고 저음은 넓게 퍼지는 편이에요. 그래서 커버리지 밖에서는 소리가 작아질 뿐 아니라 고음이 줄어 먹먹하게 들려요.</li><li>벽·천장을 직접 겨누면 반사음이 늘어 말소리가 흐려져요. 소리는 사람(귀 높이)을 향하게 해요.</li><li><b>높이와 상하 각도</b>: 스피커를 높이 두면 앞줄과 뒷줄의 거리 차가 줄어 고르게 들려요. 대신 높일수록 아래로 더 숙여야 앞줄이 세로 커버리지 안에 들어와요. 너무 숙이면 뒷줄이, 덜 숙이면 앞줄이 빠져요.</li><li>스탠드·매달기 장비의 허용 하중과 안전 수칙을 꼭 지켜요.</li></ul>',
        check: { q: '회중석 앞줄은 너무 크고 뒷줄은 작게 들려요. 알맞은 방법은?', options: [
          { t: '스피커를 조금 더 뒷줄 쪽으로 겨누고(덜 숙이고), 가능하면 높이를 올린다', ok: true, why: '맞아요. 앞줄은 축에서 벗어나 조금 작아지고, 뒷줄은 정면으로 받아 앞뒤 차이가 줄어요.' },
          { t: '스피커를 앞줄 바로 앞으로 옮긴다', why: '앞줄이 더 가까워져 앞뒤 차이가 더 커져요.' },
          { t: '스피커를 천장 쪽으로 향하게 한다', why: '천장 반사음이 늘어 말소리가 흐려져요.' }] } },
      { title: '입력 단자와 연결', visual: 'spkInputs',
        body: '스피커 뒷면 단자를 보면 연결 방법을 알 수 있어요. 액티브 ZXA1 에는 <b>XLR 마이크 입력</b>, <b>XLR/TRS 콤보 라인 입력</b>, 다음 스피커로 보내는 <b>XLR 링크 출력</b>이 있어요. 패시브 ZX1 에는 <b>speakON(NL4) 단자</b>가 있어 앰프의 스피커 출력을 받아요.',
        more: '<ul><li><b>ZXA1 (제조사 자료)</b>: 게인 조절이 있는 XLR 마이크 입력, XLR/TRS 콤보 라인 입력, XLR 링크 출력, 100 Hz 하이패스 스위치, Power On · Limit 표시등.</li><li>콘솔의 출력(라인 레벨)은 ZXA1 의 <b>라인 입력</b>에 넣어요. 마이크 입력에 넣으면 너무 커서 찌그러지기 쉬워요.</li><li><b>절대 금지</b>: 앰프의 스피커 출력을 액티브 스피커의 XLR/TRS 입력에 연결하지 마세요. 반대로 콘솔 라인 출력을 패시브 스피커에 연결해도 소리가 거의 나지 않아요.</li><li>패시브 스피커를 링크 단자로 이어 여러 대를 달면 앰프 입장에서는 병렬 연결이라 임피던스가 낮아져요(「앰프」 모듈 참고).</li></ul>',
        check: { q: 'MG12XU 의 STEREO OUT 을 ZXA1 에 연결할 때 알맞은 단자는?', options: [
          { t: 'XLR/TRS 콤보 라인 입력', ok: true, why: '맞아요. 콘솔 출력은 라인 레벨이라 라인 입력으로 넣어요.' },
          { t: '게인이 있는 XLR 마이크 입력', why: '라인 신호는 마이크 입력에 너무 커서 찌그러지기 쉬워요.' },
          { t: 'speakON 단자', why: 'ZXA1 에는 speakON 입력이 없어요. speakON 은 패시브 스피커와 앰프 사이에 써요.' }] } },
      { title: '메인·모니터·서브우퍼와 피드백', visual: 'spkStage',
        body: '<b>메인</b> 스피커는 회중석을, <b>모니터</b> 스피커는 단상 위 사람을, <b>서브우퍼</b>는 아주 낮은 저음을 맡아요. 피드백을 줄이려면 메인 스피커는 <b>마이크보다 앞(회중석 쪽)</b>에 두고 마이크를 향하지 않게 하고, 모니터는 마이크가 <b>소리를 가장 덜 받는 방향</b>(카디오이드는 바로 뒤)에 둬요.',
        more: '<ul><li>마이크와 스피커가 가까울수록, 마이크가 스피커를 향할수록 피드백이 쉽게 나요.</li><li>모니터 소리는 필요한 만큼만 — 크게 할수록 피드백 여유가 줄어요.</li><li>저음은 사방으로 넓게 퍼져서 마이크 뒤쪽에서도 들어가요. 보컬 채널은 HPF 로 불필요한 저음을 줄여요.</li></ul>',
        check: { q: '카디오이드 보컬 마이크의 바닥 모니터는 어디에 두는 것이 가장 좋을까요?', options: [
          { t: '보컬 앞쪽 바닥, 마이크 꼬리(뒤쪽) 방향에서 보컬을 향하게', ok: true, why: '맞아요. 카디오이드는 바로 뒤(180°)를 가장 적게 받아요.' },
          { t: '보컬 뒤에서 마이크 정면을 향하게', why: '마이크 정면은 가장 잘 받는 방향이라 피드백이 바로 나요.' },
          { t: '마이크 바로 옆(90°)', why: '옆에서는 정면보다 약 6 dB 만 줄어서 피드백에 약해요.' }] } },
      { title: '스피커의 지향성 및 시스템 튜닝 기초', visual: 'spkTuning',
        body: '여러 스피커가 함께 일하는 시스템은 ① 스피커마다 <b>맡을 구역</b>을 커버리지 각도로 나누고, ② 멀리 있는 <b>딜레이(필) 스피커</b>는 메인 소리가 도착하는 시간에 맞춰 <b>딜레이</b>를 주고, ③ 모든 스피커의 <b>극성</b>을 같게 하고, ④ 마지막으로 <b>시스템 EQ</b>로 방과 스피커의 음색을 다듬어요.',
        more: '<ul><li><b>딜레이 시간</b> ≈ 두 소리의 거리 차 ÷ 343 m/s(약 20 °C). 1 m ≈ 2.9 ms, 10 m ≈ 29 ms.</li><li>딜레이 스피커 소리가 메인보다 <b>살짝 늦게</b>(대략 0–10 ms) 도착하게 맞추면 소리가 무대 쪽에서 들리는 느낌이 남아요(선행음 효과). 먼저 도착하면 소리가 천장·기둥에서 나는 것처럼 들리고, 30–50 ms 넘게 어긋나면 메아리처럼 들려요.</li><li>같은 소리가 조금 어긋나 겹치면 특정 주파수가 비는 <b>콤 필터</b>가 생겨요. 그래서 딜레이 스피커는 메인이 약해지는 구역만 맡게 겨누고 레벨을 맞춰요.</li><li>실제 딜레이 값은 측정해서 정하고, 정한 값은 프로세서나 앰프 설정에 저장해 두고 함부로 바꾸지 않아요.</li><li><b>극성</b>: speakON 의 +와 −가 바뀌면 극성이 뒤집혀요. 같은 구역을 덮는 두 스피커(또는 메인과 서브우퍼)의 극성이 반대면 저음부터 크게 상쇄돼요.</li><li><b>시스템 EQ</b>: 측정 마이크와 핑크 노이즈로 보고 들으며 큰 문제부터 고치고, 올리기보다 깎기를 먼저 해요. 겨누기·배치로 고칠 문제를 EQ 로 덮지 않아요.</li></ul>',
        check: { q: '메인에서 17 m, 딜레이 스피커에서 3 m 떨어진 자리예요. 딜레이 스피커 신호를 대략 얼마나 늦춰야 할까요?', options: [
          { t: '약 41 ms (거리 차 14 m ÷ 343 m/s)', ok: true, why: '맞아요. 14 ÷ 343 ≈ 0.041 초 = 약 41 ms 예요. 여기에 몇 ms 를 더 늦춰 메인보다 살짝 늦게 오게 하기도 해요.' },
          { t: '약 14 ms', why: '거리(m)를 그대로 ms 로 쓰면 안 돼요. 1 m 에 약 2.9 ms 예요.' },
          { t: '늦추지 않아도 된다', why: '늦추지 않으면 딜레이 스피커 소리가 약 41 ms 먼저 도착해 메아리처럼 들려요.' }] } }
    ],
    practice: {
      kind: 'speakerRoom',
      lead: '세 장면에서 스피커를 다뤄요. ① 예배실을 위와 옆에서 보며 메인 스피커의 위치·방향·높이·숙이는 각도를 맞춰 자리마다 고르게 들리게 하고, ② 단상에서 카디오이드 마이크와 모니터의 자리를 잡아 피드백을 줄이고, ③ 딜레이 스피커의 시간을 맞춰요.',
      note: '커버리지 각도 90°×50°(ZXA1-90·ZX1-90)는 제조사 자료이고, 「넓은·좁은 커버리지」는 비교용 예시예요. 레벨 지도·피드백 여유·고음 감소·콤 필터는 역제곱 법칙과 단순한 지향성 모델로 계산한 교육용 근사예요. 반사음은 계산에 넣지 않았어요.',
      tasks: [
        { id: 'cover', title: '객석 고르게 덮기', text: '① 장면에서 메인 스피커를 옮기고 겨눠, 좌석 레벨 차이(가장 큰 자리 − 가장 작은 자리)를 6 dB 이하로 만드세요.' },
        { id: 'height', title: '높이와 상하 각도', text: '① 장면에서 스피커를 바닥 2 m 이하로 낮춰 앞뒤 차이가 커지는 것을 본 뒤, 3.5 m 이상으로 올리고 숙이기를 맞춰 6줄 모두 세로 커버리지 안 + 좌석 레벨 차이 6 dB 이하로 만드세요.' },
        { id: 'monitor', title: '모니터 자리 잡기', text: '② 장면에서 모니터를 끌어 「피드백 위험: 낮음」을 만들고, 보컬과의 거리는 2 m 이내로 두세요.' },
        { id: 'delay', title: '딜레이 시간 맞추기', text: '③ 장면에서 딜레이 스피커 소리가 메인보다 0–10 ms 늦게 도착하도록 딜레이를 맞추세요.' },
        { id: 'polarity', title: '극성 확인', text: '시간을 맞춘 상태에서 딜레이 스피커 극성을 「반대」로 바꿔 저음 상쇄를 확인한 뒤, 다시 「정상」으로 돌려놓으세요.' }
      ],
      links: [
        { title: '장비 브랜드 알아보기 · 스피커', text: '현장에서 자주 만나는 스피커 브랜드와 대표 제품을 살펴봐요.', go: { tab: 'tabBrands' } },
        { title: '확성 시스템의 기본 · 3D 실습 ①', text: 'SM58S 를 ZXA1 액티브 스피커에 바로 연결해 소리를 내 봐요.', go: { tab: 'tab1', card: 's1' } }
      ]
    },
    quiz: [
      { q: '패시브 스피커 ZX1 을 콘솔 STEREO OUT 에 바로 연결했더니 소리가 거의 안 나요. 이유는?', options: [
        { t: '패시브 스피커라 파워앰프가 필요해서', ok: true, why: '맞아요. 콘솔 → 파워앰프 → speakON → ZX1 순서로 연결해요.' },
        { t: '콘솔 출력이 너무 커서', why: '반대예요. 라인 신호는 패시브 스피커를 움직이기에 너무 작아요.' },
        { t: '스피커 전원이 꺼져 있어서', why: '패시브 스피커에는 전원 스위치가 없어요.' }] },
      { q: '스피커의 커버리지 각도가 「90° × 50°」라는 뜻은?', options: [
        { t: '가로 90°, 세로 50° 범위 안에서 정면보다 약 6 dB 안쪽으로 소리를 보낸다', ok: true, why: '맞아요. 이 범위 밖에서는 소리가 더 작아지고 먹먹해져요.' },
        { t: '90 m 까지 들린다', why: '커버리지 각도는 거리와 관계없이 방향을 나타내요.' },
        { t: '스피커를 90° 기울여 설치해야 한다', why: '설치 각도가 아니라 소리를 보내는 범위예요.' }] },
      { q: '딜레이 스피커 소리가 메인보다 먼저 도착하면 어떻게 들릴까요?', options: [
        { t: '소리가 딜레이 스피커 쪽에서 나는 것처럼 들리고, 차이가 크면 메아리처럼 들린다', ok: true, why: '맞아요. 그래서 메인 소리가 도착하는 시간에 맞춰 늦춰요.' },
        { t: '소리가 더 또렷해진다', why: '두 소리가 어긋나면 오히려 흐려지거나 메아리처럼 들려요.' },
        { t: '아무 차이가 없다', why: '수 ms 만 어긋나도 음색이 바뀌고, 수십 ms 면 따로 들려요.' }] },
      { q: '같은 구역을 덮는 두 스피커 중 한 대의 speakON + / − 가 바뀌어 연결됐어요. 어떤 일이 생길까요?', options: [
        { t: '극성이 반대가 되어 겹치는 곳에서 저음이 크게 줄어든다', ok: true, why: '맞아요. 한쪽 콘이 나갈 때 다른 쪽은 들어가서 서로 상쇄돼요.' },
        { t: '소리가 두 배로 커진다', why: '극성이 반대면 커지는 게 아니라 상쇄돼요.' },
        { t: '아무 변화가 없다', why: '두 스피커 소리가 겹치는 곳에서는 분명한 차이가 생겨요.' }] },
      { q: 'ZXA1 과 서브우퍼를 함께 쓸 때 ZXA1 에서 켜는 기능은?', options: [
        { t: '100 Hz 하이패스 필터', ok: true, why: '맞아요. 낮은 저음은 서브우퍼에 맡기고 ZXA1 은 그 위를 맡아요(제조사 자료).' },
        { t: 'Limit', why: 'Limit 는 내장 리미터가 동작할 때 켜지는 표시등이에요.' },
        { t: '마이크 게인을 최대로', why: '마이크 게인은 마이크 입력의 크기를 정하는 손잡이예요.' }] }
    ],
    missions: [
      { title: '음향 트러블슈팅 · 미션 B', text: '좌우 스피커(ZXA1) 중 한쪽만 소리가 나지 않을 때, 케이블·전원·입력을 차례로 확인해요.', go: { tab: 'tab7', ts: 'B' } },
      { title: '확성 시스템의 기본 · 3D 실습 ③', text: '패시브 ZX1 을 Crown XLi1500 의 speakON 출력에 연결해 소리를 내 봐요.', go: { tab: 'tab1', card: 's3' } }
    ],
    deeper: [
      { title: '포인트 소스 vs 라인 어레이', text: '<b>포인트 소스</b>는 한 점에서 소리가 퍼져 나가는 일반 스피커예요. 거리가 2배가 되면 약 6 dB 작아져요. <b>라인 어레이</b>는 여러 통을 세로로 길게 이어 매달아 하나의 긴 소리 줄처럼 동작하게 만든 스피커예요. 세로로는 좁게 모아 멀리 보내고, 가로로는 넓게 퍼뜨려요.', more: '<ul><li><b>포인트 소스</b>: 설치가 쉽고 작은·중간 크기 예배실에 알맞아요. 앞줄과 뒷줄의 크기 차이가 커지기 쉬워서 높이와 각도를 잘 맞춰야 해요.</li><li><b>라인 어레이</b>: 통마다 각도를 조금씩 다르게 꺾어(커브) 앞줄부터 뒷줄까지 고르게 덮어요. 가까운 거리에서는 거리가 2배가 될 때 6 dB 보다 적게 줄어들어 멀리까지 고르게 가요. 크고 깊은 공간·야외에 써요.</li><li>라인 어레이는 각도·매달기 설계를 제조사 프로그램으로 계산하고, 전문 리깅이 필요해요. 작은 공간에서는 오히려 포인트 소스가 나을 때가 많아요.</li><li>요즘은 작은 통을 세로로 쌓은 <b>컬럼(기둥형) 스피커</b>도 많이 써요. 말소리 전달이 좋고 눈에 덜 띄어 예배실·강당에 잘 맞아요.</li></ul>' },
      { title: '동축형 스피커와 웨지 모니터', text: '<b>동축형</b>은 고음 드라이버를 우퍼 한가운데 같은 축에 겹쳐 넣은 2웨이 스피커예요. 소리가 한 점에서 나와 가까이에서 들어도 저음과 고음이 잘 어울리고, 통을 작게 만들 수 있어요. <b>웨지(Wedge)</b>는 바닥에 놓고 단상 위 사람을 비스듬히 향하게 만든 쐐기 모양의 모니터 스피커예요.', more: '<ul><li><b>동축형의 장점</b>: 듣는 위치가 조금 바뀌어도 음색이 고르고, 가까운 거리(모니터·천장·필 스피커)에 잘 맞아요. 통이 작아 눈에 덜 띄어요.</li><li><b>웨지 모니터</b>: 보통 바닥에서 약 30–60° 각도로 사람의 귀를 향하게 놓여요. 마이크가 소리를 가장 덜 받는 방향(카디오이드는 바로 뒤)에 두고, 필요한 만큼만 크게 해요.</li><li>많은 웨지 모니터가 동축형이에요. 가까이에서 노래하는 사람에게 고르게 들리게 하려는 이유예요.</li><li>요즘은 바닥 모니터 대신 <b>인이어 모니터</b>를 쓰는 팀도 있어요. 무대 소리가 줄어 피드백도 줄지만, 귀를 보호하려면 볼륨을 적당히 해요.</li></ul>' },
      { title: '스피커 튜닝이 필요한 이유', text: '같은 스피커라도 방의 크기·벽 재질·설치 위치에 따라 소리가 완전히 달라져요. 벽·천장 반사로 특정 저음이 부풀거나, 스피커 여러 대가 겹치는 곳에서 소리가 비거나, 먼 자리의 소리가 늦게 도착해요. <b>튜닝</b>은 이런 문제를 측정하고 고쳐서 모든 자리에서 고르고 또렷하게 들리게 하는 작업이에요.', more: '<ul><li><b>순서</b>: ① 위치·높이·각도(겨누기)를 먼저 맞추고 ② 스피커 사이 레벨과 딜레이(도착 시간)를 맞추고 ③ 극성을 확인하고 ④ 마지막에 시스템 EQ 로 다듬어요. EQ 로 겨누기 문제를 덮지 않아요.</li><li><b>측정</b>: 측정 마이크와 분석 프로그램으로 여러 자리를 재요. 한 자리에만 맞춘 EQ 는 다른 자리를 나쁘게 만들 수 있어요.</li><li><b>효과</b>: 말씀이 또렷해지고, 피드백 전에 낼 수 있는 음량(여유)이 늘고, 자리마다 크기와 음색 차이가 줄어요.</li><li><b>마지막은 귀로</b>: 측정한 뒤에는 잘 아는 음악과 실제 말소리로 여러 자리를 걸으며 들어 확인해요. 튜닝한 설정은 저장하고 기록해 둬요.</li></ul>' }
    ],
    sources: [
      { t: 'Electro-Voice ZxA1-90 엔지니어링 데이터 시트(제조사)', url: 'https://www.fullcompass.com/common/files/24805-ElectroVoiceZxA190BDatasheet.pdf' },
      { t: 'Electro-Voice ZX1 제품 페이지(제조사)', url: 'https://products.electrovoice.com/la/en/zx1' },
      { t: 'd&b audiotechnik E8 설계 사양(제조사)', url: 'https://www.dbaudio.com/assets/products/downloads/architectural-specifications/dbaudio-arch-specs-e8-en.txt' },
      { t: 'd&b audiotechnik Yi7P 설계 사양(제조사)', url: 'https://www.dbaudio.com/assets/products/downloads/architectural-specifications/dbaudio-arch-specs-yi7p-en.txt' },
      { t: 'd&b audiotechnik Vi10P 설계 사양(제조사)', url: 'https://www.dbaudio.com/assets/products/downloads/architectural-specifications/dbaudio-arch-specs-vi10p-en.txt' },
      { t: 'd&b audiotechnik 10D 설계 사양(제조사) — EQ·딜레이', url: 'https://www.dbaudio.com/assets/products/downloads/architectural-specifications/dbaudio-arch-specs-10d-en.txt' }
    ]
  };
})();
