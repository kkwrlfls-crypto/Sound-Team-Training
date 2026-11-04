/* =============================================================================
   02-2 디지털 케이블 — 2026-11-04
   - STA_MODULES['cable-digital'] (모듈 데이터) + STAVisuals.dc* (그림 7개) + STASims.digitalLinkBench (디지털 연결 작업대)
   - 02-1 아날로그 케이블(cable.js)에서 다룬 XLR·TRS·speakON·밸런스는 되풀이하지 않고, 디지털 연결만 자세히 다룸
   - 사실(채널 수·임피던스·길이 등)은 sources[] 의 자료 기준. 실습 화면의 거리·장비 A·B·C·디지털 앰프는 교육용 예시
   ============================================================================= */
(function () {
  'use strict';
  var V = window.STAVisuals = window.STAVisuals || {};
  var C = { ink: '#0f1f33', sub: '#51627a', line: '#cbd5e1', bg: '#f8fafc', blue: '#2563eb', teal: '#0e7490', orange: '#ea580c', purple: '#7c3aed', red: '#dc2626', green: '#059669', amber: '#d97706', opt: '#f97316' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 500) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '">' + s + '</text>'; }
  function rect(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 8 : r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.5"' : '') + '/>'; }
  function arrow(x1, y1, x2, y2, col, w) { var a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 7 * Math.cos(a), hy = y2 - 7 * Math.sin(a); return '<path d="M' + x1 + ' ' + y1 + 'L' + hx.toFixed(1) + ' ' + hy.toFixed(1) + '" stroke="' + col + '" stroke-width="' + (w || 2.4) + '" fill="none"/><path d="M' + x2 + ' ' + y2 + 'L' + (hx - 4 * Math.sin(a)).toFixed(1) + ' ' + (hy + 4 * Math.cos(a)).toFixed(1) + 'L' + (hx + 4 * Math.sin(a)).toFixed(1) + ' ' + (hy - 4 * Math.cos(a)).toFixed(1) + 'Z" fill="' + col + '"/>'; }
  function line(x1, y1, x2, y2, col, w, dash) { return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="' + (w || 2) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' fill="none"/>'; }
  function dev(x, y, w, h, a, b, fill, stroke) { return rect(x, y, w, h, fill || '#fff', stroke || '#94a3b8', 8) + t(x + w / 2, y + (b ? h / 2 - 2 : h / 2 + 4), a, { size: 11.5, weight: 800 }) + (b ? t(x + w / 2, y + h / 2 + 12, b, { size: 9.5, fill: C.sub }) : ''); }

  /* ---------------------------------------------------------------- 그림 0: 디지털 연결 커넥터 한눈에 (학습 화면 맨 위 그림) */
  V.dcOverview = function () {
    function card(i, row, tag, tagCol, icon, title, sub) {
      var x = 8 + i * 197, y = 8 + row * 150;
      return rect(x, y, 187, 140, C.bg, C.line, 12) + rect(x + 8, y + 8, tag.length * 10 + 14, 18, tagCol, null, 9).replace('fill="' + tagCol + '"', 'fill="' + tagCol + '" fill-opacity=".14"') +
        t(x + 15, y + 21, tag, { size: 10, fill: tagCol, anchor: 'start', weight: 700 }) + icon(x + 93, y + 66) + t(x + 93, y + 112, title, { size: 13, weight: 800 }) + t(x + 93, y + 129, sub, { size: 10.5, fill: C.sub });
    }
    var xlr = function (cx, cy) { return '<circle cx="' + cx + '" cy="' + cy + '" r="24" fill="#ede9fe" stroke="' + C.purple + '" stroke-width="2"/>' + [[-9, -5], [9, -5], [0, 10]].map(function (p) { return '<circle cx="' + (cx + p[0]) + '" cy="' + (cy + p[1]) + '" r="3.6" fill="' + C.ink + '"/>'; }).join('') + '<rect x="' + (cx - 3) + '" y="' + (cy - 27) + '" width="6" height="6" fill="' + C.ink + '"/>'; };
    var rca = function (cx, cy) { return '<circle cx="' + cx + '" cy="' + cy + '" r="22" fill="#fed7aa" stroke="' + C.orange + '" stroke-width="2.5"/><circle cx="' + cx + '" cy="' + cy + '" r="12" fill="#fff" stroke="#9ca3af" stroke-width="2"/><circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#9ca3af"/>'; };
    var tos = function (cx, cy) { return '<path d="M' + (cx - 22) + ' ' + (cy - 18) + 'H' + (cx + 22) + 'V' + (cy + 8) + 'L' + (cx + 12) + ' ' + (cy + 18) + 'H' + (cx - 12) + 'L' + (cx - 22) + ' ' + (cy + 8) + 'Z" fill="#1f2937"/><circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#ef4444"/><circle cx="' + cx + '" cy="' + cy + '" r="12" fill="#ef4444" fill-opacity=".25"/>'; };
    var bnc = function (cx, cy) { return '<circle cx="' + cx + '" cy="' + cy + '" r="22" fill="#e2e8f0" stroke="#475569" stroke-width="2.5"/><circle cx="' + cx + '" cy="' + cy + '" r="13" fill="#f8fafc" stroke="#94a3b8"/><circle cx="' + cx + '" cy="' + cy + '" r="3" fill="#b45309"/><rect x="' + (cx - 27) + '" y="' + (cy - 3) + '" width="6" height="6" fill="#475569"/><rect x="' + (cx + 21) + '" y="' + (cy - 3) + '" width="6" height="6" fill="#475569"/>'; };
    var ecn = function (cx, cy) { var s = '<circle cx="' + cx + '" cy="' + cy + '" r="26" fill="#cbd5e1" stroke="#475569" stroke-width="2"/><rect x="' + (cx - 16) + '" y="' + (cy - 12) + '" width="32" height="22" rx="3" fill="#1e3a8a"/>'; for (var i = 0; i < 8; i++) s += '<rect x="' + (cx - 13 + i * 3.4) + '" y="' + (cy - 9) + '" width="1.8" height="7" fill="#fbbf24"/>'; return s + '<rect x="' + (cx - 5) + '" y="' + (cy + 10) + '" width="10" height="5" fill="#1e3a8a"/>'; };
    /* 2026-11-04: USB 는 실제 플러그 모양(정면)으로 — A(컴퓨터 쪽 직사각) · B(오디오 장비 쪽 윗모서리 깎인 사각) · C(양면 둥근 타원) */
    var usb = function (cx, cy) {
      var a = cx - 52, b = cx - 6, c = cx + 40, y = cy - 4, lab = function (x, s) { return t(x, cy + 26, s, { size: 9.5, weight: 800, fill: C.sub }); };
      var sA = '<rect x="' + (a - 17) + '" y="' + (y - 8) + '" width="34" height="16" rx="1.5" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/><rect x="' + (a - 14) + '" y="' + (y - 5) + '" width="28" height="6" fill="#1e3a8a"/>' + [0, 1, 2, 3].map(function (k) { return '<rect x="' + (a - 11 + k * 6.4) + '" y="' + (y - 4) + '" width="3.6" height="2" fill="#fbbf24"/>'; }).join('');
      var sB = '<path d="M' + (b - 12) + ' ' + (y + 11) + 'V' + (y - 5) + 'L' + (b - 6) + ' ' + (y - 11) + 'H' + (b + 6) + 'L' + (b + 12) + ' ' + (y - 5) + 'V' + (y + 11) + 'Z" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/><rect x="' + (b - 5) + '" y="' + (y - 5) + '" width="10" height="11" rx="1" fill="#1f2937"/>' + [[-3, -3], [1.4, -3], [-3, 2], [1.4, 2]].map(function (q) { return '<rect x="' + (b + q[0]) + '" y="' + (y + q[1]) + '" width="1.8" height="2.6" fill="#fbbf24"/>'; }).join('');
      var sC = '<rect x="' + (c - 16) + '" y="' + (y - 6) + '" width="32" height="12" rx="6" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/><rect x="' + (c - 11) + '" y="' + (y - 2) + '" width="22" height="4" rx="2" fill="#1f2937"/>';
      return sA + sB + sC + lab(a, 'USB-A') + lab(b, 'USB-B') + lab(c, 'USB-C');
    };
    return svg(600, 310,
      card(0, 0, '전기 · 110 Ω', C.purple, xlr, 'AES/EBU (AES3)', 'XLR 모양 · 2채널 · 전문가용') + card(1, 0, '전기 · 75 Ω', C.orange, rca, 'S/PDIF 동축', 'RCA · 2채널 · 가정용') + card(2, 0, '빛 (광)', C.red, tos, 'TOSLINK 광', 'ADAT 8채널 · S/PDIF') +
      card(0, 1, '전기 · 75 Ω', C.teal, bnc, 'BNC 동축', 'MADI 최대 64채널 · 워드클럭') + card(1, 1, '네트워크', C.blue, ecn, 'etherCON · RJ45', 'Dante · AES50 · Ultranet') + card(2, 1, '컴퓨터', C.sub, usb, 'USB 2.0', '녹음 · 한 구간 5 m'),
      '디지털 오디오 연결에 쓰는 커넥터 여섯 가지');
  };

  /* ---------------------------------------------------------------- 그림 1: 샘플 · 비트 · 클럭, 그리고 디지털의 「갑자기 끊김」 */
  V.dcBits = function () {
    var s = rect(6, 6, 344, 228, C.bg, C.line, 10) + t(18, 26, '소리를 일정한 박자로 재서 숫자로 적어요', { size: 12, weight: 800, anchor: 'start' });
    var d = '', dots = '', ticks = '';
    for (var i = 0; i <= 150; i++) { var x = 24 + i * 2, y = 88 - 38 * Math.sin(i / 150 * Math.PI * 2.2); d += (i ? 'L' : 'M') + x + ' ' + y.toFixed(1); }
    s += '<path d="' + d + '" stroke="#94a3b8" stroke-width="2" fill="none"/>' + line(24, 88, 326, 88, C.line, 1, '3 3');
    for (var k = 0; k <= 15; k++) {
      var xs = 24 + k * 20, ys = 88 - 38 * Math.sin(k * 20 / 300 * Math.PI * 2.2);
      dots += line(xs, 88, xs, ys.toFixed(1), C.blue, 1.6) + '<circle cx="' + xs + '" cy="' + ys.toFixed(1) + '" r="3.6" fill="' + C.blue + '"/>';
      ticks += '<path d="M' + xs + ' 168V152H' + (xs + 10) + 'V168H' + (xs + 20) + '" stroke="' + C.green + '" stroke-width="2" fill="none"/>';
    }
    s += dots + t(18, 144, '클럭(박자) — 이 박자마다 한 번씩 재요', { size: 10.5, fill: C.green, weight: 700, anchor: 'start' }) + '<g>' + ticks + '</g>';
    s += t(18, 194, '샘플레이트 48 kHz = 1초에 48,000번 재기', { size: 10.5, anchor: 'start', weight: 700, fill: C.blue }) + t(18, 212, '비트 24 = 한 번 잰 값을 0·1 스물네 자리로 적기', { size: 10.5, anchor: 'start', fill: C.sub }) + t(18, 228, '(점 사이 간격은 이해를 돕는 그림 · 실제는 훨씬 촘촘해요)', { size: 9.5, anchor: 'start', fill: C.sub });
    // 오른쪽: 아날로그는 점점 나빠지고 디지털은 한계에서 갑자기
    var gx = 392, gy = 40, gw = 190, gh = 140;
    s += rect(358, 6, 236, 228, '#fff', C.line, 10) + t(476, 26, '케이블이 길어지거나 나빠지면', { size: 12, weight: 800 });
    s += line(gx, gy + gh, gx + gw, gy + gh, '#475569', 1.5) + line(gx, gy, gx, gy + gh, '#475569', 1.5) + t(gx + gw / 2, gy + gh + 16, '케이블 길이 · 상태 나쁨 →', { size: 9.5, fill: C.sub }) + t(gx - 6, gy + 6, '소리', { size: 9.5, fill: C.sub, anchor: 'end' }) + t(gx - 6, gy + 18, '품질', { size: 9.5, fill: C.sub, anchor: 'end' });
    s += '<path d="M' + gx + ' ' + (gy + 12) + 'C' + (gx + 70) + ' ' + (gy + 22) + ' ' + (gx + 130) + ' ' + (gy + 70) + ' ' + (gx + gw) + ' ' + (gy + 118) + '" stroke="' + C.teal + '" stroke-width="2.6" fill="none"/>';
    s += '<path d="M' + gx + ' ' + (gy + 10) + 'H' + (gx + 140) + 'L' + (gx + 150) + ' ' + (gy + gh - 4) + 'H' + (gx + gw) + '" stroke="' + C.blue + '" stroke-width="2.6" fill="none"/>';
    s += t(gx + 56, gy + 4, '디지털: 끝까지 깨끗', { size: 10, fill: C.blue, weight: 700 }) + t(gx + 136, gy + 116, '한계에서 갑자기', { size: 10, fill: C.red, weight: 700, anchor: 'end' }) + t(gx + 136, gy + 130, '「틱」· 끊김 →', { size: 10, fill: C.red, weight: 700, anchor: 'end' });
    s += t(gx + 8, gy + 62, '아날로그:', { size: 10, fill: C.teal, weight: 700, anchor: 'start' }) + t(gx + 8, gy + 76, '점점 잡음이 늘어요', { size: 10, fill: C.teal, weight: 700, anchor: 'start' });
    s += t(476, 226, '대략적인 모양 그림이에요', { size: 9.5, fill: C.sub });
    return svg(600, 240, s, '샘플레이트·비트·클럭과 디지털 연결의 특징');
  };

  /* ---------------------------------------------------------------- 그림 2: AES/EBU 와 마이크 케이블, S/PDIF */
  V.dcAesSpdif = function () {
    var bits = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1];
    function square(x0, y0, w, h) { var d = 'M' + x0 + ' ' + (y0 + (bits[0] ? 0 : h)), bw = w / bits.length; bits.forEach(function (b, i) { var y = y0 + (b ? 0 : h); d += 'V' + y + 'H' + (x0 + (i + 1) * bw).toFixed(1); }); return d; }
    function smear(x0, y0, w, h) { var bw = w / bits.length, v = bits[0] ? 1 : 0, d = '', n = 0; bits.forEach(function (b) { for (var j = 0; j < 12; j++) { v += ((b ? 1 : 0) - v) * 0.22; var x = x0 + n * bw / 12, y = y0 + h - v * h + Math.sin(n * 1.7) * 1.4; d += (n ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); n++; } }); return d; }
    var s = rect(6, 6, 330, 236, C.bg, C.line, 10) + t(18, 26, '모양은 같은 XLR, 속은 달라요', { size: 12, weight: 800, anchor: 'start' });
    s += t(18, 50, '① AES/EBU 110 Ω 디지털 케이블', { size: 11, weight: 800, fill: C.purple, anchor: 'start' }) + '<path d="' + square(24, 60, 296, 26) + '" stroke="' + C.purple + '" stroke-width="2.2" fill="none"/>' + t(24, 104, '받는 쪽: 0 과 1 이 또렷해요 → 잠금(LOCK)', { size: 10.5, fill: C.green, weight: 700, anchor: 'start' });
    s += t(18, 134, '② 일반 마이크 케이블 (아날로그용)', { size: 11, weight: 800, fill: C.teal, anchor: 'start' }) + '<path d="' + smear(24, 144, 296, 26) + '" stroke="' + C.amber + '" stroke-width="2.2" fill="none"/>' + t(24, 188, '모서리가 무너져 0·1 을 잘못 읽기 쉬워요', { size: 10.5, fill: C.amber, weight: 700, anchor: 'start' }) + t(24, 204, '→ 「틱」 소리 · 끊김 (케이블이 길수록 심해져요)', { size: 10.5, fill: C.amber, weight: 700, anchor: 'start' });
    s += t(24, 230, '교육용 그림 (신호 모양은 예시)', { size: 9.5, fill: C.sub, anchor: 'start' });
    // 오른쪽: S/PDIF
    s += rect(344, 6, 250, 236, '#fff7ed', '#fed7aa', 10) + t(469, 26, 'S/PDIF — 가정용 2채널', { size: 12, weight: 800 });
    s += '<circle cx="398" cy="74" r="20" fill="#fed7aa" stroke="' + C.orange + '" stroke-width="2.5"/><circle cx="398" cy="74" r="10" fill="#fff" stroke="#9ca3af" stroke-width="2"/><circle cx="398" cy="74" r="3.5" fill="#9ca3af"/>' +
      t(430, 68, '동축 (RCA)', { size: 11.5, weight: 800, anchor: 'start' }) + t(430, 84, '75 Ω · 보통 주황색 단자', { size: 10, fill: C.sub, anchor: 'start' });
    s += '<path d="M378 122H418V144L410 152H386L378 144Z" fill="#1f2937"/><circle cx="398" cy="136" r="5" fill="#ef4444"/><circle cx="398" cy="136" r="11" fill="#ef4444" fill-opacity=".22"/>' +
      t(430, 132, '광 (TOSLINK)', { size: 11.5, weight: 800, anchor: 'start' }) + t(430, 148, '빛으로 보내 전기 잡음이 없어요', { size: 10, fill: C.sub, anchor: 'start' });
    s += t(358, 184, 'AES3 와 거의 같은 규격이고,', { size: 10.5, anchor: 'start' }) + t(358, 200, '동축은 보통 10 m 안팎으로 짧게 써요.', { size: 10.5, anchor: 'start' }) + t(358, 222, '무대 장비끼리는 AES/EBU 를 써요.', { size: 10.5, anchor: 'start', fill: C.orange, weight: 700 });
    return svg(600, 248, s, 'AES/EBU 110 옴 케이블과 마이크 케이블 비교, S/PDIF 단자');
  };

  /* ---------------------------------------------------------------- 그림 3: 케이블 한 가닥에 몇 채널? */
  V.dcMulti = function () {
    var rows = [['AES/EBU · S/PDIF', 'XLR · RCA · 광', '2채널', 10, C.purple], ['ADAT (광)', 'TOSLINK', '8채널 (96 kHz 는 4)', 34, C.red], ['USB (X32 X-USB)', 'USB 2.0', '32 × 32채널', 82, C.sub],
      ['AES50 (단자 하나)', 'etherCON · 차폐 Cat-5e', '48채널씩 양방향', 110, C.purple], ['MADI (AES10)', 'BNC 동축 · 광', '최대 64채널', 136, C.teal], ['Dante (기가비트)', 'Cat5e · Cat6', '최대 512채널씩 양방향', 290, C.blue]];
    var s = t(8, 16, '케이블 한 가닥에 실을 수 있는 채널 수 (48 kHz 기준 · 막대 길이는 대략적인 비교)', { size: 10.5, fill: C.sub, anchor: 'start' });
    rows.forEach(function (r, i) {
      var y = 30 + i * 34;
      s += t(8, y + 14, r[0], { size: 11.5, weight: 800, anchor: 'start' }) + t(8, y + 27, r[1], { size: 9.5, fill: C.sub, anchor: 'start' }) + rect(150, y + 4, r[3], 20, r[4], null, 4) +
        (i === 5 ? '<path d="M' + 268 + ' ' + (y + 2) + 'l6 24M' + 276 + ' ' + (y + 2) + 'l6 24" stroke="#fff" stroke-width="3"/>' : '') + t(158 + r[3], y + 19, r[2], { size: 11, weight: 700, anchor: 'start', fill: r[4] });
    });
    return svg(600, 238, s, '디지털 케이블 종류별 채널 수 비교');
  };

  /* ---------------------------------------------------------------- 그림 4: 워드클럭 — 마스터는 하나 */
  V.dcClock = function () {
    function wave(x0, y0, w, clicks) { var d = ''; for (var i = 0; i <= 100; i++) { var x = x0 + i * w / 100, y = y0 - 12 * Math.sin(i / 100 * Math.PI * 6); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } var s = '<path d="' + d + '" stroke="' + (clicks ? C.amber : C.green) + '" stroke-width="2" fill="none"/>'; if (clicks) [0.22, 0.51, 0.83].forEach(function (u) { var x = x0 + u * w; s += line(x, y0 - 22, x, y0 + 22, C.red, 2.4) + t(x, y0 - 26, '틱', { size: 10, weight: 800, fill: C.red }); }); return s; }
    var s = rect(6, 6, 290, 236, '#ecfdf5', '#6ee7b7', 10) + t(151, 26, '✓ 마스터 하나 — 모두 같은 박자', { size: 12, weight: 800, fill: C.green });
    s += dev(18, 44, 82, 46, '장비 A', '내부 INT', '#fff', C.green) + t(66, 108, '마스터', { size: 10.5, weight: 800, fill: C.green, anchor: 'start' });
    s += dev(114, 44, 82, 46, '장비 B', 'W.CLK IN', '#fff', '#94a3b8') + dev(210, 44, 78, 46, '장비 C', 'W.CLK IN', '#fff', '#94a3b8');
    s += line(59, 90, 59, 124, C.teal, 2.4) + line(59, 124, 249, 124, C.teal, 2.4) + line(155, 124, 155, 90, C.teal, 2.4) + line(249, 124, 249, 90, C.teal, 2.4) + '<circle cx="155" cy="124" r="4" fill="' + C.teal + '"/>' +
      rect(238, 128, 22, 14, '#0f766e', null, 3) + t(249, 156, '75 Ω 종단', { size: 9.5, fill: C.teal, weight: 700 }) + t(120, 140, 'BNC 워드클럭 (T자로 이어요)', { size: 10, fill: C.teal, weight: 700 });
    s += wave(24, 196, 260, false) + t(151, 230, 'B · C 는 A 의 박자를 따라가요 → 깨끗해요', { size: 10.5, fill: C.green, weight: 700 });
    s += rect(304, 6, 290, 236, '#fef2f2', '#fecaca', 10) + t(449, 26, '✕ 마스터 둘 — 박자가 어긋나요', { size: 12, weight: 800, fill: C.red });
    s += dev(318, 44, 110, 50, '장비 A', '내부 INT · 48 kHz', '#fff', C.red) + dev(466, 44, 116, 50, '장비 B', '내부 INT · 48 kHz', '#fff', C.red) + arrow(428, 69, 466, 69, C.purple) + t(447, 108, '디지털 오디오', { size: 9.5, fill: C.purple, weight: 700 });
    s += t(449, 134, '숫자로는 둘 다 48 kHz 라도 시계가 따로 놀아', { size: 10.5, fill: C.ink }) + t(449, 150, '조금씩 어긋나요 → 샘플을 놓치거나 겹쳐 읽어요', { size: 10.5, fill: C.ink });
    s += wave(322, 196, 256, true) + t(449, 230, '「틱 · 톡」 클릭, 잡음, 소리가 안 나기도 해요', { size: 10.5, fill: C.red, weight: 700 });
    return svg(600, 248, s, '워드클럭 마스터가 하나일 때와 둘일 때');
  };

  /* ---------------------------------------------------------------- 그림 5: 랜선으로 가는 오디오 네 가지 */
  V.dcLanFamily = function () {
    var s = t(8, 16, '같은 랜선 · etherCON 모양이라도 안에 흐르는 「규격」이 달라요 (단순화한 그림)', { size: 10.5, fill: C.sub, anchor: 'start' });
    function row(i, name, sub, col, body, note1, note2) {
      var y = 26 + i * 66;
      return rect(4, y, 592, 58, i % 2 ? '#fff' : C.bg, C.line, 10) + t(16, y + 25, name, { size: 13, weight: 800, fill: col, anchor: 'start' }) + t(16, y + 42, sub, { size: 9.5, fill: C.sub, anchor: 'start' }) + body(y) +
        t(588, y + 25, note1, { size: 10, fill: col, weight: 700, anchor: 'end' }) + t(588, y + 41, note2, { size: 10, fill: C.sub, anchor: 'end' });
    }
    function sbox(x, y, w, a, col, h) { h = h || 26; return rect(x, y, w, h, '#fff', col || '#94a3b8', 6) + t(x + w / 2, y + h / 2 + 4, a, { size: 10, weight: 800 }); }
    s += row(0, 'Dante', 'Audinate · IP 네트워크', C.blue, function (y) { return sbox(126, y + 16, 54, 'CL5') + line(180, y + 29, 214, y + 29, C.blue, 3) + rect(214, y + 12, 62, 34, '#dbeafe', C.blue, 6) + t(245, y + 33, '스위치', { size: 10, weight: 800, fill: C.blue }) + line(276, y + 29, 306, y + 29, C.blue, 3) + sbox(306, y + 16, 62, 'Rio3224') + line(245, y + 12, 245, y + 4, C.blue, 2) + t(258, y + 9, '+ 녹음 PC 등', { size: 9, fill: C.blue, anchor: 'start' }); }, '스위치로 여러 장비', 'Cat5e 이상 · 구간 100 m');
    s += row(1, 'AES50', 'Midas · Behringer', C.purple, function (y) { return sbox(126, y + 16, 54, 'X32') + line(180, y + 29, 306, y + 29, C.purple, 3.4) + t(243, y + 22, '1:1 직접', { size: 10, weight: 800, fill: C.purple }) + t(243, y + 46, '스위치 ✕', { size: 9.5, weight: 700, fill: C.red }) + sbox(306, y + 16, 62, 'S16'); }, '48채널씩 양방향', '차폐 Cat-5e · 최대 100 m');
    s += row(2, 'Ultranet', 'Behringer · 개인 모니터', C.orange, function (y) { return sbox(126, y + 16, 54, 'X32') + arrow(180, y + 29, 212, y + 29, C.orange, 3) + sbox(214, y + 16, 62, 'P16-D') + arrow(276, y + 22, 304, y + 18, C.orange, 2.4) + arrow(276, y + 36, 304, y + 40, C.orange, 2.4) + sbox(306, y + 6, 62, 'P16-M', null, 22) + sbox(306, y + 32, 62, 'P16-M', null, 22); }, '16채널 · 한 방향', '이더넷 아님 · 스위치 ✕');
    s += row(3, 'AVB · Milan', 'IEEE 802.1 · Avnu 인증', C.teal, function (y) { return sbox(126, y + 16, 54, '장비') + line(180, y + 29, 214, y + 29, C.teal, 3) + rect(214, y + 12, 62, 34, '#ccfbf1', C.teal, 6) + t(245, y + 27, 'AVB', { size: 10, weight: 800, fill: C.teal }) + t(245, y + 40, '스위치', { size: 9.5, weight: 700, fill: C.teal }) + line(276, y + 29, 306, y + 29, C.teal, 3) + sbox(306, y + 16, 62, '장비'); }, 'AVB 지원 스위치 필요', '여기서는 이름만 알아 둬요');
    return svg(600, 294, s, 'Dante, AES50, Ultranet, AVB 비교');
  };

  /* ---------------------------------------------------------------- 그림 6: Dante 이중화 — CL5 · Rio3224-D2 */
  V.dcDante = function () {
    var P = C.blue, S2 = C.orange, s = '';
    s += rect(6, 30, 132, 132, '#fff', '#94a3b8', 10) + t(72, 54, 'CL5', { size: 14, weight: 800 }) + t(72, 70, '방송실 콘솔', { size: 10, fill: C.sub });
    s += rect(462, 30, 132, 132, '#fff', '#94a3b8', 10) + t(528, 54, 'Rio3224-D2', { size: 13, weight: 800 }) + t(528, 70, '무대 스테이지박스', { size: 10, fill: C.sub });
    [['PRIMARY', 100, P], ['SECONDARY', 138, S2]].forEach(function (r) {
      s += t(126, r[1] + 4, r[0], { size: 9.5, weight: 800, fill: r[2], anchor: 'end' }) + '<circle cx="138" cy="' + r[1] + '" r="6" fill="#22c55e" stroke="' + r[2] + '" stroke-width="2.5"/>' +
        t(474, r[1] + 4, r[0], { size: 9.5, weight: 800, fill: r[2], anchor: 'start' }) + '<circle cx="462" cy="' + r[1] + '" r="6" fill="#22c55e" stroke="' + r[2] + '" stroke-width="2.5"/>';
    });
    s += rect(232, 76, 136, 42, '#dbeafe', P, 8) + t(300, 95, '스위치 A', { size: 11.5, weight: 800, fill: P }) + t(300, 110, 'Primary 네트워크', { size: 9.5, fill: P });
    s += rect(232, 124, 136, 42, '#ffedd5', S2, 8) + t(300, 143, '스위치 B', { size: 11.5, weight: 800, fill: S2 }) + t(300, 158, 'Secondary 네트워크', { size: 9.5, fill: S2 });
    s += line(144, 100, 232, 100, P, 3) + line(368, 100, 456, 100, P, 3) + line(144, 138, 200, 138, S2, 3) + line(200, 138, 200, 145, S2, 3) + line(200, 145, 232, 145, S2, 3) + line(400, 145, 368, 145, S2, 3) + line(400, 145, 400, 138, S2, 3) + line(400, 138, 456, 138, S2, 3);
    s += t(300, 22, '같은 소리를 두 네트워크로 동시에 보내요', { size: 12, weight: 800 }) + t(300, 186, '✕ 스위치 A 와 B 를 서로 잇지 않아요 (고리 → 장비가 멈출 수 있어요)', { size: 10.5, fill: C.red, weight: 700 });
    s += line(144, 214, 456, 214, '#475569', 1.5) + line(144, 208, 144, 220, '#475569', 1.5) + line(300, 208, 300, 220, '#475569', 1.5) + line(456, 208, 456, 220, '#475569', 1.5) + t(222, 232, '한 구간 최대 100 m', { size: 10.5, weight: 700 }) + t(378, 232, '한 구간 최대 100 m', { size: 10.5, weight: 700 }) + t(300, 252, '더 멀면 스위치를 중간에 두거나, 스위치 사이를 광케이블로 이어요', { size: 10, fill: C.sub });
    s += t(594, 276, '예시 그림 · 3층의 실제 배선은 교회 설정을 따라요', { size: 9.5, fill: C.sub, anchor: 'end' }) + t(6, 276, 'LED 초록 = 링크 정상', { size: 9.5, fill: C.green, anchor: 'start', weight: 700 });
    return svg(600, 282, s, 'CL5 와 Rio3224-D2 의 Dante Primary·Secondary 이중화');
  };
})();

/* =========================================================================== 실습: 디지털 연결 작업대 (STASims.digitalLinkBench) */
(function () {
  'use strict';
  var C = { ink: '#0f1f33', sub: '#51627a', line: '#cbd5e1', blue: '#2563eb', orange: '#ea580c', purple: '#7c3aed', red: '#dc2626', green: '#16a34a', amber: '#f59e0b', teal: '#0e7490' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 500) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '" style="pointer-events:none">' + s + '</text>'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var CABLES = [
    ['aes', 'AES/EBU 110 Ω 케이블', 'xlr', '#7c3aed'], ['mic', '마이크 케이블 (XLR)', 'xlr', '#0e7490'], ['stp', '랜선 Cat5e STP (차폐)', 'rj45', '#2563eb'],
    ['utp', '랜선 Cat5e UTP (차폐 없음)', 'rj45', '#64748b'], ['opt', '광케이블 (TOSLINK)', 'opt', '#f97316'], ['bnc', 'BNC 75 Ω 동축', 'bnc', '#0f766e']
  ];
  var CAB = {}; CABLES.forEach(function (c) { CAB[c[0]] = { name: c[1], plug: c[2], col: c[3] }; });
  var PLUG_TXT = { xlr: 'XLR', rj45: '랜선(RJ45 · etherCON)', opt: '광(TOSLINK)', bnc: 'BNC' };
  var PLUG_COL = { xlr: '#334155', rj45: '#1d4ed8', opt: '#f97316', bnc: '#0f766e' };

  /* ---------- ① 작업대 장비와 단자 */
  var D1 = { rio: ['Rio3224-D2', '스테이지박스 (Dante)'], amp: ['디지털 앰프', 'AES3 입력 (예시 장비)'], x32: ['X32', '디지털 콘솔'], s16: ['S16', '스테이지박스 (AES50)'], iface: ['오디오 인터페이스', 'ADAT 입력 · 녹음 PC'] };
  var P1 = {
    rioAes: { dev: 'rio', label: 'AES/EBU OUT', plug: 'xlr', kind: 'aesOut' },
    ampAes: { dev: 'amp', label: 'AES3 IN', plug: 'xlr', kind: 'aesIn' }, ampAna: { dev: 'amp', label: 'ANALOG IN', plug: 'xlr', kind: 'anaIn' },
    x32A: { dev: 'x32', label: 'AES50 A', plug: 'rj45', kind: 'aes50' }, x32U: { dev: 'x32', label: 'ULTRANET', plug: 'rj45', kind: 'ultranet' }, x32E: { dev: 'x32', label: 'ETHERNET', plug: 'rj45', kind: 'eth' },
    s16A: { dev: 's16', label: 'AES50 A', plug: 'rj45', kind: 'aes50' }, s16B: { dev: 's16', label: 'AES50 B', plug: 'rj45', kind: 'aes50' }, s16Adat: { dev: 's16', label: 'ADAT OUT', plug: 'opt', kind: 'adatOut' },
    ifAdat: { dev: 'iface', label: 'OPTICAL IN', plug: 'opt', kind: 'adatIn' }
  };
  var L1 = {
    wide: { W: 640, H: 274, dev: { rio: [16, 14, 176, 80], amp: [448, 10, 176, 98], x32: [16, 128, 150, 134], s16: [252, 128, 158, 134], iface: [488, 150, 136, 100] },
      port: { rioAes: [192, 66, 'r'], ampAes: [448, 60, 'l'], ampAna: [448, 90, 'l'], x32A: [166, 178, 'r'], x32U: [166, 208, 'r'], x32E: [166, 238, 'r'], s16A: [252, 184, 'l'], s16B: [252, 228, 'l'], s16Adat: [410, 206, 'r'], ifAdat: [488, 206, 'l'] } },
    narrow: { W: 360, H: 408, dev: { rio: [8, 8, 150, 80], amp: [202, 8, 150, 100], x32: [8, 132, 150, 136], s16: [202, 132, 150, 136], iface: [8, 300, 150, 96] },
      port: { rioAes: [158, 62, 'r'], ampAes: [202, 58, 'l'], ampAna: [202, 88, 'l'], x32A: [158, 180, 'r'], x32U: [158, 212, 'r'], x32E: [158, 244, 'r'], s16A: [202, 186, 'l'], s16B: [202, 230, 'l'], s16Adat: [277, 268, 'b'], ifAdat: [158, 360, 'r'] } }
  };
  function judge1(a, b, cab) {
    var A = P1[a], B = P1[b], pair = [A.kind, B.kind].sort().join('|');
    if (pair === 'aesIn|aesOut') return cab === 'aes' ? ['ok', 'AES/EBU 2채널 · LOCK', '맞아요. 110 Ω AES/EBU 디지털 케이블로 2채널을 보내요. 앰프 입력의 LOCK 표시가 켜져요.']
      : ['warn', '불안정', '모양은 맞지만 마이크 케이블은 아날로그용이라 110 Ω 디지털 규격이 아니에요. 0·1 모양이 흐트러져 「틱」 소리나 끊김이 생길 수 있어요(길수록 심해져요). AES/EBU 110 Ω 케이블로 바꿔 보세요.'];
    if (pair === 'aesOut|anaIn') return ['bad', '소리 안 남', '앰프의 ANALOG IN 은 아날로그 입력이에요. 디지털(AES/EBU) 신호는 AES3 IN 에 꽂아요.'];
    if (pair === 'aes50|aes50') return cab === 'stp' ? ['ok', 'AES50 · 48채널씩', '맞아요. 차폐(STP) Cat-5e 로 X32 와 S16 을 1:1 로 이었어요. AES50 은 클럭도 함께 실어 보내서 S16 이 X32 의 박자를 따라가요.']
      : ['warn', '불안정', 'Behringer 는 AES50 에 차폐(STP) Cat-5e 케이블만 쓰라고 안내해요. 차폐 없는 UTP 는 잡음과 끊김 위험이 있어서 실습에서는 「불안정」으로 표시해요.'];
    if (pair === 'adatIn|adatOut') return ['ok', 'ADAT 8채널', '맞아요. 광케이블 한 가닥에 48 kHz 기준 8채널이 가요. ②에서 클럭을 확인해 보세요.'];
    if (pair === 'aes50|ultranet') return ['bad', '연결 안 됨', 'ULTRANET 은 P16 개인 모니터로 16채널을 보내는 출력이에요. S16 은 X32 의 AES50 A·B 단자에 이어요.'];
    if (pair === 'aes50|eth') return ['bad', '연결 안 됨', 'X32 의 ETHERNET 은 앱·컴퓨터로 원격 조작하는 단자예요. 오디오는 AES50 A·B 로 다녀요.'];
    return ['bad', '맞지 않음', '두 단자는 서로 다른 신호를 주고받아요.'];
  }

  /* ---------- ③ Dante 네트워크 */
  var TOTAL = 140;   // 방송실 CL5 ↔ 무대 Rio 케이블 경로 길이 (교육용 예시, m)
  var D3 = { cl5: ['CL5', '방송실 콘솔'], rio: ['Rio3224-D2', '무대 스테이지박스'] };
  var P3 = {
    clPri: { dev: 'cl5', label: 'PRIMARY', net: 'pri' }, clSec: { dev: 'cl5', label: 'SECONDARY', net: 'sec' }, rioPri: { dev: 'rio', label: 'PRIMARY', net: 'pri' }, rioSec: { dev: 'rio', label: 'SECONDARY', net: 'sec' },
    a1: { dev: 'swA' }, a2: { dev: 'swA' }, a3: { dev: 'swA' }, b1: { dev: 'swB' }, b2: { dev: 'swB' }, b3: { dev: 'swB' }
  };
  function L3(mode, p) {
    if (mode === 'wide') {
      var x0 = 150, x1 = 490, rxMin = 225, rxMax = 415, rx = clamp(x0 + p / TOTAL * (x1 - x0), rxMin, rxMax);
      return { W: 640, H: 284, axis: 'x', a0: x0, a1: x1, rMin: rxMin, rMax: rxMax, r: rx,
        dev: { cl5: [10, 24, 140, 176], rio: [490, 24, 140, 176] }, swA: [rx - 55, 50, 110, 56], swB: [rx - 55, 132, 110, 56], frame: [rx - 65, 40, 130, 164],
        port: { clPri: [150, 78, 'r'], clSec: [150, 160, 'r'], rioPri: [490, 78, 'l'], rioSec: [490, 160, 'l'], a1: [rx - 55, 78, 'l'], a2: [rx + 55, 78, 'r'], a3: [rx, 106, 'b'], b1: [rx - 55, 160, 'l'], b2: [rx + 55, 160, 'r'], b3: [rx, 132, 't'] } };
    }
    var y0 = 92, y1 = 468, ryMin = 142, ryMax = 418, ry = clamp(y0 + p / TOTAL * (y1 - y0), ryMin, ryMax);
    return { W: 360, H: 560, axis: 'y', a0: y0, a1: y1, rMin: ryMin, rMax: ryMax, r: ry,
      dev: { cl5: [44, 8, 300, 84], rio: [44, 468, 300, 84] }, swA: [69, ry - 28, 110, 56], swB: [209, ry - 28, 110, 56], frame: [59, ry - 44, 270, 88],
      port: { clPri: [124, 92, 'b'], clSec: [264, 92, 'b'], rioPri: [124, 468, 't'], rioSec: [264, 468, 't'], a1: [124, ry - 28, 't'], a2: [124, ry + 28, 'b'], a3: [179, ry, 'r'], b1: [264, ry - 28, 't'], b2: [264, ry + 28, 'b'], b3: [209, ry, 'l'] } };
  }
  function meterOf(id, p) { var d = P3[id].dev; return d === 'cl5' ? 0 : d === 'rio' ? TOTAL : p; }

  function injectCss() {
    if (document.getElementById('sta-mod-dl-css')) return;
    var st = document.createElement('style'); st.id = 'sta-mod-dl-css';
    st.textContent = [
      '.sim-dl{display:grid;gap:12px;min-width:0}',
      '.sim-dl-card{border:1px solid var(--sta-line,#d6dee8);border-radius:12px;background:#fff;padding:12px 14px;min-width:0}',
      '.sim-dl-card>h4{margin:0 0 4px;font-size:.95rem;color:var(--sta-navy,#0f2747)}',
      '.sim-dl-lead{margin:0 0 8px;font-size:.8rem;color:#51627a;line-height:1.55;word-break:keep-all}',
      '.sim-dl-tray{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}',
      '.sim-dl-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--sta-line,#d6dee8);border-radius:999px;font-size:.76rem;font-weight:700;cursor:pointer;background:#f8fafc}',
      '.sim-dl-chip input{margin:0;accent-color:#0e7490}.sim-dl-chip i{width:16px;height:5px;border-radius:3px;display:inline-block}',
      '.sim-dl-chip:has(input:checked){border-color:#0e7490;background:#e6f6f9}',
      '.sim-dl-svg{display:block;width:100%;max-width:780px;height:auto;margin:0 auto;touch-action:none;user-select:none;-webkit-user-select:none;border-radius:10px;background:#f1f5f9}',
      '.sim-dl-svg [data-port]{cursor:crosshair}.sim-dl-svg [data-conn]{cursor:pointer}.sim-dl-svg [data-rack]{cursor:grab}',
      '.sim-dl-svg.dragging,.sim-dl-svg.dragging *{cursor:grabbing}',
      '.sim-dl-fb{margin:8px 0 0;font-size:.8rem;line-height:1.55;word-break:keep-all;padding:7px 9px;border-radius:8px;background:#f8fafc;color:#51627a}',
      '.sim-dl-fb.ok{background:#ecfdf5;color:#047857}.sim-dl-fb.warn{background:#fffbeb;color:#b45309}.sim-dl-fb.bad{background:#fef2f2;color:#b91c1c}',
      '.sim-dl-list{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:4px}',
      '.sim-dl-list li{display:flex;gap:8px;align-items:center;font-size:.76rem;padding:4px 8px;border-radius:8px;background:#f8fafc;word-break:keep-all;flex-wrap:wrap}',
      '.sim-dl-pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.72rem;font-weight:800;white-space:nowrap}',
      '.sim-dl-pill.ok{background:#dcfce7;color:#166534}.sim-dl-pill.warn{background:#fef3c7;color:#92400e}.sim-dl-pill.bad{background:#fee2e2;color:#991b1b}.sim-dl-pill.off{background:#e2e8f0;color:#475569}',
      '.sim-dl-clk{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}',
      '.sim-dl-box{border:1px solid #e2e8f0;border-radius:10px;padding:10px;min-width:0}',
      '.sim-dl-box>b{display:block;font-size:.84rem;margin-bottom:4px;color:var(--sta-navy,#0f2747)}',
      '.sim-dl-devs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:6px}',
      '.sim-dl-dev{border:1px solid #e2e8f0;border-radius:8px;padding:6px;display:grid;gap:5px;justify-items:start;min-width:0;background:#fff}',
      '.sim-dl-dev>strong{font-size:.8rem}.sim-dl-dev>small{font-size:.68rem;color:#64748b;line-height:1.35;word-break:keep-all}',
      '.sim-dl-seg{display:flex;flex-wrap:wrap;gap:4px}',
      '.sim-dl-seg button{border:1px solid var(--sta-line,#d6dee8);background:#f8fafc;border-radius:6px;padding:5px 7px;font:inherit;font-size:.72rem;font-weight:700;cursor:pointer;color:var(--sta-ink,#0f1f33)}',
      '.sim-dl-seg button[aria-pressed=true]{background:#0e7490;border-color:#0e7490;color:#fff}',
      '.sim-dl-wave{display:block;width:100%;height:auto;border-radius:8px;background:#0b1220;margin:6px 0}',
      '.sim-dl-panel{display:grid;gap:4px;margin-top:8px;font-size:.78rem}',
      '.sim-dl-panel .row{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px dashed #e2e8f0;flex-wrap:wrap}',
      '.sim-dl-panel .row span{color:#64748b}',
      '@keyframes sim-dl-blink{50%{opacity:.25}}.sim-dl-blink{animation:sim-dl-blink .9s steps(1) infinite}',
      '@media (prefers-reduced-motion:reduce){.sim-dl-blink{animation:none}}',
      '@media (max-width:520px){.sim-dl-devs{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function curve(a, b) {
    function dir(s) { return s === 'r' ? [1, 0] : s === 'l' ? [-1, 0] : s === 'b' ? [0, 1] : [0, -1]; }
    var dist = Math.hypot(b[0] - a[0], b[1] - a[1]), k = clamp(dist * 0.4, 24, 70), da = dir(a[2]), db = b[2] ? dir(b[2]) : [0, 0];
    var c1 = [a[0] + da[0] * k, a[1] + da[1] * k], c2 = [b[0] + db[0] * k, b[1] + db[1] * k];
    return { d: 'M' + a[0] + ' ' + a[1] + 'C' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1),
      mid: [(a[0] + 3 * c1[0] + 3 * c2[0] + b[0]) / 8, (a[1] + 3 * c1[1] + 3 * c2[1] + b[1]) / 8] };
  }
  function badge(x, y, s, col) { return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" fill="#fff" stroke="' + col + '" stroke-width="2" style="pointer-events:none"/>' + t(x.toFixed(1), (y + 4).toFixed(1), s, { size: 11, weight: 800, fill: col }); }

  function digitalLinkBench(el, opts) {
    opts = opts || {}; injectCss();
    var S = { cab1: null, cab3: null, c1: [], c3: [], rackP: 30, wc: { A: 'int', B: 'int', C: 'int' }, ifClk: 'int', sawClicks: false, armed: null, done: {}, mode: 'wide' };
    var alive = true, drag = null, rdrag = null;
    function tray(z) { return '<div class="sim-dl-tray" role="radiogroup" aria-label="케이블 고르기">' + CABLES.filter(function (c) { return z === 1 || c[2] === 'rj45' || c[0] === 'opt' || c[0] === 'mic'; }).map(function (c) { return '<label class="sim-dl-chip"><input type="radio" name="dlCab' + z + '" value="' + c[0] + '" data-cab="' + z + '"><i style="background:' + c[3] + '"></i><span>' + esc(c[1]) + '</span></label>'; }).join('') + '</div>'; }
    el.innerHTML = '<div class="sim-dl">' +
      '<section class="sim-dl-card"><h4>① 디지털 케이블 연결 작업대</h4><p class="sim-dl-lead">케이블을 고른 뒤, 단자(동그라미)에서 다른 단자로 <b>끌어서 놓으면</b> 연결돼요. 단자를 한 번 누르고 다른 단자를 눌러도 돼요. 꽂힌 케이블을 누르면 뽑혀요. 모양이 맞지 않는 플러그는 꽂히지 않아요.</p>' + tray(1) +
        '<svg class="sim-dl-svg" data-z="1" role="img" aria-label="디지털 장비 연결 작업대"></svg><p class="sim-dl-fb" data-fb="1">케이블을 먼저 골라 보세요.</p><ul class="sim-dl-list" data-list="1"></ul></section>' +
      '<section class="sim-dl-card"><h4>② 클럭 맞추기</h4><p class="sim-dl-lead">디지털 장비끼리는 같은 박자(클럭)로 움직여야 해요. 박자를 정하는 <b>마스터는 하나</b>, 나머지는 그 박자를 따라가요.</p><div class="sim-dl-clk">' +
        '<div class="sim-dl-box"><b>워드클럭으로 이어진 장비 A · B · C</b><svg class="sim-dl-wave" data-role="wcsvg" viewBox="0 0 520 74" aria-hidden="true"></svg><div class="sim-dl-devs" data-role="wcdevs"></div><p class="sim-dl-fb" data-fb="wc"></p></div>' +
        '<div class="sim-dl-box"><b>S16 → (ADAT 광) → 오디오 인터페이스</b><svg class="sim-dl-wave" data-role="adwave" viewBox="0 0 520 110" aria-label="인터페이스로 들어온 소리 모양"></svg><div class="sim-dl-dev"><strong>인터페이스 클럭 소스</strong><div class="sim-dl-seg" data-role="ifseg">' +
          [['int', '내부 (INT)'], ['adat', 'ADAT 입력'], ['wc', '워드클럭 (BNC)']].map(function (o) { return '<button type="button" data-ifclk="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div><p class="sim-dl-fb" data-fb="ad"></p></div>' +
      '</div></section>' +
      '<section class="sim-dl-card"><h4>③ Dante 네트워크 — CL5 · Rio3224-D2</h4><p class="sim-dl-lead">방송실 CL5 와 무대 Rio3224-D2 사이 케이블 경로는 <b>140 m</b> 라고 해 볼게요(연습용 예시). 랜선을 골라 단자를 잇고, 점선 틀 안의 <b>스위치 랙을 끌어</b> 옮길 수 있어요. 단자 동그라미의 색이 링크 LED 예요.</p>' + tray(3) +
        '<svg class="sim-dl-svg" data-z="3" role="img" aria-label="Dante 네트워크 배선"></svg><p class="sim-dl-fb" data-fb="3">랜선을 골라 PRIMARY · SECONDARY 단자를 스위치에 이어 보세요.</p><div class="sim-dl-panel" data-role="net"></div>' +
        '<p class="sim-note">LED: 초록 = 링크 정상 · 주황 깜빡임 = 100 m 초과로 불안정 · 빨강 = 두 네트워크가 합쳐짐 · 흰색 = 연결 없음. 실제 장비 표시등의 모양·이름은 기종마다 달라요.</p></section>' +
    '</div>';
    var q = function (s) { return el.querySelector(s); };
    var sv1 = q('svg[data-z="1"]'), sv3 = q('svg[data-z="3"]');

    /* ---------------------------------------------------------------- ① */
    function conn1Of(id) { return S.c1.find(function (c) { return c.a === id || c.b === id; }); }
    function render1() {
      var L = L1[S.mode], s = '';
      sv1.setAttribute('viewBox', '0 0 ' + L.W + ' ' + L.H);
      Object.keys(D1).forEach(function (k) { var b = L.dev[k]; s += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" rx="10" fill="#fff" stroke="#94a3b8" stroke-width="1.5" style="pointer-events:none"/>' + t(b[0] + 10, b[1] + 19, D1[k][0], { size: 13, weight: 800, anchor: 'start' }) + t(b[0] + 10, b[1] + 34, D1[k][1], { size: 10, fill: C.sub, anchor: 'start' }); });
      S.c1.forEach(function (c, i) {
        var cv = curve(L.port[c.a], L.port[c.b]), col = CAB[c.cab].col, st = c.st[0], dash = st === 'ok' ? '' : ' stroke-dasharray="7 5"';
        s += '<g data-conn="1:' + i + '"><path d="' + cv.d + '" stroke="transparent" stroke-width="16" fill="none"/><path d="' + cv.d + '" stroke="' + col + '" stroke-width="4" fill="none"' + dash + ' stroke-linecap="round"/></g>' +
          badge(cv.mid[0], cv.mid[1], st === 'ok' ? '✓' : st === 'warn' ? '!' : '✕', st === 'ok' ? '#15803d' : st === 'warn' ? '#b45309' : '#b91c1c');
      });
      Object.keys(P1).forEach(function (id) { s += portSvg(id, P1[id].label, P1[id].plug, L.port[id], !!conn1Of(id), 1); });
      s += '<path data-temp d="" stroke="#0f172a" stroke-width="2.5" stroke-dasharray="5 4" fill="none" style="pointer-events:none"/>';
      sv1.innerHTML = s;
      var lst = q('[data-list="1"]');
      lst.innerHTML = S.c1.length ? S.c1.map(function (c) { var st = c.st[0]; return '<li><span class="sim-dl-pill ' + st + '">' + (st === 'ok' ? '✓ 정상' : st === 'warn' ? '! 불안정' : '✕ 안 됨') + '</span><span>' + esc(D1[P1[c.a].dev][0] + ' ' + P1[c.a].label + ' ↔ ' + D1[P1[c.b].dev][0] + ' ' + P1[c.b].label) + ' · ' + esc(CAB[c.cab].name) + ' — ' + esc(c.st[1]) + '</span></li>'; }).join('') : '<li><span class="sim-dl-pill off">연결 없음</span><span>아직 이은 케이블이 없어요.</span></li>';
    }
    function portSvg(id, label, plug, p, occ, z, led) {
      var col = PLUG_COL[plug], armed = S.armed && S.armed.id === id, x = p[0], y = p[1], side = p[2], lab = '';
      if (label) {
        if (side === 'r') lab = t(x - 13, y + 4, label, { size: 10.5, weight: 700, anchor: 'end', fill: '#334155' });
        else if (side === 'l') lab = t(x + 13, y + 4, label, { size: 10.5, weight: 700, anchor: 'start', fill: '#334155' });
        else if (side === 'b') lab = t(x, y - 14, label, { size: 10.5, weight: 700, fill: '#334155' });
        else lab = t(x, y + 22, label, { size: 10.5, weight: 700, fill: '#334155' });
      }
      var fill = led ? led[0] : (occ ? col : '#fff');
      return lab + '<g data-port="' + id + '" data-zone="' + z + '"><circle cx="' + x + '" cy="' + y + '" r="13" fill="transparent"/>' + (armed ? '<circle cx="' + x + '" cy="' + y + '" r="12" fill="none" stroke="#0f172a" stroke-width="2" stroke-dasharray="3 3"/>' : '') +
        '<circle cx="' + x + '" cy="' + y + '" r="7.5" fill="' + fill + '" stroke="' + col + '" stroke-width="2.6"' + (led && led[1] ? ' class="sim-dl-blink"' : '') + '/></g>';
    }
    function fb(z, cls, msg) { var f = q('[data-fb="' + z + '"]'); f.className = 'sim-dl-fb' + (cls ? ' ' + cls : ''); f.textContent = msg; }
    function plugCheck(z, a, b, P) {
      var cab = z === 1 ? S.cab1 : S.cab3;
      if (!cab) return [null, '먼저 위에서 케이블을 골라 주세요.'];
      var pa = z === 1 ? P[a].plug : 'rj45', pb = z === 1 ? P[b].plug : 'rj45', cp = CAB[cab].plug;
      if (cp !== pa || cp !== pb) { var bad = cp !== pa ? pa : pb; return [null, CAB[cab].name + ' 의 플러그(' + PLUG_TXT[cp] + ')는 이 단자(' + PLUG_TXT[bad] + ')에 맞지 않아 꽂히지 않아요.']; }
      return [cab];
    }
    function connect(z, a, b) {
      S.armed = null;
      if (z === 1) {
        if (P1[a].dev === P1[b].dev) { fb(1, 'bad', '같은 장비의 단자끼리는 잇지 않아요.'); render1(); return; }
        if (conn1Of(a) || conn1Of(b)) { fb(1, 'bad', '이미 케이블이 꽂힌 단자예요. 꽂힌 케이블을 눌러 먼저 뽑아 주세요.'); render1(); return; }
        var pc = plugCheck(1, a, b, P1); if (!pc[0]) { fb(1, 'bad', pc[1]); render1(); return; }
        var st = judge1(a, b, pc[0]); S.c1.push({ a: a, b: b, cab: pc[0], st: st }); fb(1, st[0], (st[0] === 'ok' ? '✓ ' : st[0] === 'warn' ? '⚠ ' : '✕ ') + st[2]);
        render1(); render2(); check(); return;
      }
      var A = P3[a], B = P3[b];
      if (A.dev === B.dev) { fb(3, 'bad', /^sw/.test(A.dev) ? '같은 스위치의 포트끼리 이으면 고리(루프)가 생겨요. 잇지 않아요.' : '같은 장비의 PRIMARY 와 SECONDARY 를 서로 이으면 안 돼요.'); render3(); return; }
      if (conn3Of(a) || conn3Of(b)) { fb(3, 'bad', '이미 랜선이 꽂힌 단자예요. 꽂힌 랜선을 눌러 먼저 뽑아 주세요.'); render3(); return; }
      var pc3 = plugCheck(3, a, b, P3); if (!pc3[0]) { fb(3, 'bad', pc3[1]); render3(); return; }
      S.c3.push({ a: a, b: b, cab: pc3[0] });
      var len = linkLen(S.c3[S.c3.length - 1]), msg = '연결했어요 · 길이 약 ' + len + ' m.', cls = 'ok';
      var sw = [A, B].filter(function (x) { return /^sw/.test(x.dev); }), dn = [A, B].filter(function (x) { return x.net; });
      if (sw.length === 2) { msg = '⚠ 스위치 A 와 B 를 이었어요. Primary 와 Secondary 가 한 네트워크로 합쳐져 이중화가 깨지고, 고리가 생기면 Dante 장비가 멈출 수도 있어요.'; cls = 'bad'; }
      else if (dn.length === 2) { msg = '⚠ 장비끼리 바로 이었어요. 길이가 ' + len + ' m 라 한 구간 100 m 를 넘어요. 스위치를 거쳐 이어 보세요.'; cls = 'warn'; }
      else if (dn.length === 1 && sw.length === 1) {
        var wrong = (dn[0].net === 'pri' && sw[0].dev !== 'swA') || (dn[0].net === 'sec' && sw[0].dev !== 'swB');
        if (wrong) { msg = '⚠ ' + dn[0].label + ' 단자를 ' + (sw[0].dev === 'swA' ? '스위치 A(Primary 네트워크)' : '스위치 B(Secondary 네트워크)') + '에 꽂았어요. PRIMARY 는 스위치 A, SECONDARY 는 스위치 B 예요.'; cls = 'warn'; }
        else if (len > 100) { msg = '⚠ 연결은 했지만 길이 약 ' + len + ' m — 한 구간 100 m 를 넘어 링크가 불안정해요. 스위치 랙을 옮겨 보세요.'; cls = 'warn'; }
      }
      if (cls === 'ok' && pc3[0] === 'utp') msg += ' (Dante 는 Cat5e 이상이면 돼요. Yamaha 는 STP 를 권장해요.)';
      fb(3, cls, msg); render3(); check();
    }
    function removeConn(z, i) {
      if (z === 1) { var c = S.c1.splice(i, 1)[0]; if (c) fb(1, '', '케이블을 뽑았어요: ' + D1[P1[c.a].dev][0] + ' ' + P1[c.a].label + ' ↔ ' + D1[P1[c.b].dev][0] + ' ' + P1[c.b].label); render1(); render2(); check(); return; }
      var c3 = S.c3.splice(i, 1)[0]; if (c3) fb(3, '', '랜선을 뽑았어요: ' + name3(c3.a) + ' ↔ ' + name3(c3.b) + '.'); render3(); check();
    }

    /* ---------------------------------------------------------------- ② 클럭 */
    function adatLink() { var c = S.c1.find(function (x) { var k = [x.a, x.b].sort().join('|'); return k === 'ifAdat|s16Adat'; }); return !!(c && c.st[0] === 'ok'); }
    function wcEval() {
      var r = {}, A = S.wc.A;
      r.A = A === 'int' ? ['ok', 'MASTER · 박자를 내보내요'] : ['bad', 'UNLOCK · IN 에 꽂힌 시계가 없어요'];
      ['B', 'C'].forEach(function (k) { var v = S.wc[k];
        if (v === 'ext') r[k] = A === 'int' ? ['ok', 'LOCK · A 의 박자를 따라가요'] : ['bad', 'UNLOCK · A 가 박자를 내보내지 않아요'];
        else r[k] = ['warn', '자기 박자로 동작 — A 와 어긋나 「틱」 클릭']; });
      r.allOk = A === 'int' && S.wc.B === 'ext' && S.wc.C === 'ext'; return r;
    }
    function adEval() {
      if (!adatLink()) return ['off', 'ADAT 신호 없음 — ①에서 S16 ADAT OUT → 인터페이스 OPTICAL IN 을 광케이블로 이어 주세요.'];
      if (S.ifClk === 'int') return ['clicks', '⚠ 「틱 · 톡」 클릭이 섞여요. 인터페이스가 자기 시계(INT)로 숫자를 읽어서, S16 이 보내는 박자와 조금씩 어긋나요.'];
      if (S.ifClk === 'wc') return ['unlock', '✕ UNLOCK — 워드클럭 BNC 단자에 아무것도 꽂혀 있지 않아 잠기지 않아요. 소리가 나오지 않아요.'];
      return ['lock', '✓ LOCK — 인터페이스가 ADAT 신호에 실려 온 S16 의 박자를 따라가요. 클릭이 사라졌어요.'];
    }
    function render2() {
      var r = wcEval(), devs = q('[data-role=wcdevs]');
      var col = function (s) { return s === 'ok' ? '#22c55e' : s === 'warn' ? '#f59e0b' : '#ef4444'; };
      q('[data-role=wcsvg]').innerHTML = '<rect width="520" height="74" fill="#0b1220"/>' +
        [['A', 70], ['B', 260], ['C', 450]].map(function (d) { var st = r[d[0]][0]; return '<rect x="' + (d[1] - 46) + '" y="8" width="92" height="34" rx="7" fill="#111a2e" stroke="' + col(st) + '" stroke-width="2"/>' + t(d[1] - 10, 31, d[0], { size: 17, weight: 800, fill: '#e2e8f0' }) + '<circle cx="' + (d[1] + 22) + '" cy="25" r="7" fill="' + col(st) + '"' + (st === 'warn' ? ' class="sim-dl-blink"' : '') + '/>'; }).join('') +
        '<path d="M70 42V60H450V42M260 60V42" stroke="#2dd4bf" stroke-width="3" fill="none"/><circle cx="260" cy="60" r="4" fill="#2dd4bf"/><rect x="440" y="62" width="20" height="9" rx="2" fill="#2dd4bf"/>';
      devs.innerHTML = ['A', 'B', 'C'].map(function (k) { var st = r[k];
        return '<div class="sim-dl-dev"><strong>장비 ' + k + '</strong><span class="sim-dl-pill ' + st[0] + '">SYNC ' + (st[0] === 'ok' ? '●' : st[0] === 'warn' ? '◐' : '○') + '</span><small>' + esc(st[1]) + '</small><div class="sim-dl-seg">' +
          [['int', '내부 INT'], ['ext', 'W.CLK IN']].map(function (o) { return '<button type="button" data-wc="' + k + ':' + o[0] + '" aria-pressed="' + (S.wc[k] === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>' +
          '<small>' + (k === 'A' ? 'WORD CLOCK OUT → B · C 로 이어져 있어요' : k === 'B' ? 'WORD CLOCK IN ← A (T자 연결)' : 'WORD CLOCK IN ← A · 끝에 75 Ω 종단') + '</small></div>'; }).join('');
      fb('wc', r.allOk ? 'ok' : '', r.allOk ? '✓ 마스터는 A 하나, B · C 는 A 를 따라가요. 세 장비 모두 같은 박자예요.' : '세 장비의 SYNC 를 모두 초록으로 만들어 보세요. 지금 마스터(INT)는 ' + ['A', 'B', 'C'].filter(function (k) { return S.wc[k] === 'int'; }).length + '대예요.');
      var a = adEval(); if (a[0] === 'clicks') S.sawClicks = true;
      var w = '', i, base = 56;
      if (a[0] === 'off' || a[0] === 'unlock') w = '<path d="M10 ' + base + 'H510" stroke="#475569" stroke-width="2"/>';
      else { var d = ''; for (i = 0; i <= 250; i++) { var x = 10 + i * 2, y = base - 30 * Math.sin(i / 250 * Math.PI * 10); d += (i ? 'L' : 'M') + x + ' ' + y.toFixed(1); } w = '<path d="' + d + '" stroke="' + (a[0] === 'lock' ? '#4ade80' : '#fbbf24') + '" stroke-width="2" fill="none"/>';
        if (a[0] === 'clicks') [0.13, 0.37, 0.58, 0.86].forEach(function (u) { var x = 10 + u * 500; w += '<path d="M' + x + ' ' + (base - 46) + 'V' + (base + 46) + '" stroke="#ef4444" stroke-width="3"/>'; }); }
      q('[data-role=adwave]').innerHTML = '<rect width="520" height="110" fill="#0b1220"/>' + w;
      el.querySelectorAll('[data-ifclk]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-ifclk') === S.ifClk)); });
      var hint = a[0] === 'lock' && !S.sawClicks ? ' (아직 클릭 증상을 보지 못했어요. 「내부 (INT)」로 두면 어떻게 되는지 먼저 확인해 보세요.)' : '';
      fb('ad', a[0] === 'lock' ? 'ok' : a[0] === 'clicks' ? 'warn' : a[0] === 'unlock' ? 'bad' : '', a[1] + hint);
    }

    /* ---------------------------------------------------------------- ③ Dante */
    function conn3Of(id) { return S.c3.find(function (c) { return c.a === id || c.b === id; }); }
    function name3(id) { var p = P3[id]; return p.net ? D3[p.dev][0] + ' ' + p.label : (p.dev === 'swA' ? '스위치 A' : '스위치 B'); }
    function linkLen(c) { var ma = meterOf(c.a, S.rackP), mb = meterOf(c.b, S.rackP); return Math.max(1, Math.round(Math.abs(ma - mb))); }
    function net() {
      var nodes = Object.keys(P3).concat(['swA', 'swB']);
      function uf(onlyOk) { var par = {}; nodes.forEach(function (n) { par[n] = n; }); function f(x) { while (par[x] !== x) x = par[x] = par[par[x]]; return x; } function u(a, b) { par[f(a)] = f(b); }
        Object.keys(P3).forEach(function (id) { if (/^sw/.test(P3[id].dev)) u(id, P3[id].dev); });
        S.c3.forEach(function (c) { if (!onlyOk || linkLen(c) <= 100) u(c.a, c.b); }); return function (a, b) { return f(a) === f(b); }; }
      var topo = uf(false), okc = uf(true);
      var merged = topo('swA', 'swB') || topo('clPri', 'clSec') || topo('rioPri', 'rioSec');
      var priTopo = topo('clPri', 'rioPri') && topo('clPri', 'swA'), secTopo = topo('clSec', 'rioSec') && topo('clSec', 'swB');
      var audioPri = !merged && okc('clPri', 'rioPri'), audioSec = !merged && okc('clSec', 'rioSec');
      var lens = S.c3.map(linkLen), allOk = lens.every(function (l) { return l <= 100; });
      return { merged: merged, priTopo: priTopo, secTopo: secTopo, priConn: topo('clPri', 'rioPri'), audioPri: audioPri, audioSec: audioSec, audio: audioPri || audioSec, allOk: allOk, lens: lens };
    }
    function ledOf(id, N) {
      var c = conn3Of(id); if (!c) return null;
      if (N.merged) return ['#ef4444', false];
      return linkLen(c) <= 100 ? ['#22c55e', false] : ['#f59e0b', true];
    }
    function render3() {
      var L = L3(S.mode, S.rackP); S.rackP = Math.round((L.r - L.a0) / (L.a1 - L.a0) * TOTAL);
      var N = net(), s = '';
      sv3.setAttribute('viewBox', '0 0 ' + L.W + ' ' + L.H);
      // 바닥 거리 눈금
      var pM = (L.r - L.a0) / (L.a1 - L.a0) * TOTAL;
      if (L.axis === 'x') {
        var ry = 222; s += '<path d="M' + L.a0 + ' ' + ry + 'H' + L.a1 + '" stroke="#64748b" stroke-width="1.5"/>';
        for (var m = 0; m <= TOTAL; m += 20) { var xx = L.a0 + m / TOTAL * (L.a1 - L.a0); s += '<path d="M' + xx + ' ' + (ry - 4) + 'V' + (ry + 4) + '" stroke="#64748b"/>'; }
        s += t(L.a0, ry + 18, '0 m 방송실', { size: 10, fill: C.sub }) + t(L.a1, ry + 18, '140 m 무대', { size: 10, fill: C.sub }) + '<path d="M' + L.r + ' ' + (ry - 8) + 'l-6 -9h12z" fill="#0f172a"/>';
        var l1 = Math.round(pM), l2 = TOTAL - l1;
        s += t((L.a0 + L.r) / 2, ry + 36, '← ' + l1 + ' m →', { size: 11.5, weight: 800, fill: l1 <= 100 ? '#15803d' : '#b91c1c' }) + t((L.r + L.a1) / 2, ry + 36, '← ' + l2 + ' m →', { size: 11.5, weight: 800, fill: l2 <= 100 ? '#15803d' : '#b91c1c' });
      } else {
        var rx = 22; s += '<path d="M' + rx + ' ' + L.a0 + 'V' + L.a1 + '" stroke="#64748b" stroke-width="1.5"/>';
        for (var m2 = 0; m2 <= TOTAL; m2 += 20) { var yy = L.a0 + m2 / TOTAL * (L.a1 - L.a0); s += '<path d="M' + (rx - 4) + ' ' + yy + 'H' + (rx + 4) + '" stroke="#64748b"/>'; }
        s += '<path d="M' + (rx + 8) + ' ' + L.r + 'l9 -6v12z" fill="#0f172a"/>';
        var k1 = Math.round(pM), k2 = TOTAL - k1;
        s += t(rx, (L.a0 + L.r) / 2, k1 + ' m', { size: 10.5, weight: 800, fill: k1 <= 100 ? '#15803d' : '#b91c1c' }) + t(rx, (L.r + L.a1) / 2, k2 + ' m', { size: 10.5, weight: 800, fill: k2 <= 100 ? '#15803d' : '#b91c1c' });
      }
      Object.keys(D3).forEach(function (k) { var b = L.dev[k], wide = L.axis === 'x', ok = N.audio;
        var ty = wide ? b[1] + 21 : (k === 'cl5' ? b[1] + 21 : b[1] + 50), sy = ty + 15;
        s += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" rx="10" fill="#fff" stroke="#94a3b8" stroke-width="1.5" style="pointer-events:none"/>' + t(b[0] + 10, ty, D3[k][0], { size: 13, weight: 800, anchor: 'start' }) + t(b[0] + 10, sy, D3[k][1], { size: 10, fill: C.sub, anchor: 'start' });
        var sx = wide ? b[0] + 12 : b[0] + b[2] - 12, syn = wide ? b[1] + b[3] - 14 : ty;
        s += '<circle cx="' + (wide ? sx + 4 : sx - 4) + '" cy="' + (syn - 4) + '" r="5" fill="' + (ok ? '#22c55e' : '#cbd5e1') + '" style="pointer-events:none"/>' + t(wide ? sx + 14 : sx - 14, syn, 'SYNC ' + (ok ? '정상' : '없음'), { size: 10, weight: 800, anchor: wide ? 'start' : 'end', fill: ok ? '#15803d' : '#64748b' });
      });
      var f = L.frame;
      s += '<g data-rack="1"><rect x="' + f[0] + '" y="' + f[1] + '" width="' + f[2] + '" height="' + f[3] + '" rx="12" fill="rgba(15,23,42,.04)" stroke="#64748b" stroke-width="1.5" stroke-dasharray="6 5"/>' +
        '<rect x="' + L.swA[0] + '" y="' + L.swA[1] + '" width="' + L.swA[2] + '" height="' + L.swA[3] + '" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>' +
        '<rect x="' + L.swB[0] + '" y="' + L.swB[1] + '" width="' + L.swB[2] + '" height="' + L.swB[3] + '" rx="8" fill="#ffedd5" stroke="#ea580c" stroke-width="1.5"/>' +
        t(L.swA[0] + L.swA[2] / 2, L.swA[1] + 24, '스위치 A', { size: 11.5, weight: 800, fill: '#1d4ed8' }) + t(L.swA[0] + L.swA[2] / 2, L.swA[1] + 39, 'Primary', { size: 9.5, fill: '#1d4ed8' }) +
        t(L.swB[0] + L.swB[2] / 2, L.swB[1] + 24, '스위치 B', { size: 11.5, weight: 800, fill: '#c2410c' }) + t(L.swB[0] + L.swB[2] / 2, L.swB[1] + 39, 'Secondary', { size: 9.5, fill: '#c2410c' }) +
        (L.axis === 'x' ? t(L.r, f[1] + f[3] - 6, '⇆ 랙 끌어 옮기기', { size: 9.5, weight: 700, fill: '#475569' }) : t(f[0] + f[2] - 8, f[1] + 11, '⇅ 랙 끌기', { size: 9.5, weight: 700, fill: '#475569', anchor: 'end' })) + '</g>';
      S.c3.forEach(function (c, i) {
        var cv = curve(L.port[c.a], L.port[c.b]), col = CAB[c.cab].col, len = linkLen(c), ok = len <= 100 && !N.merged;
        s += '<g data-conn="3:' + i + '"><path d="' + cv.d + '" stroke="transparent" stroke-width="16" fill="none"/><path d="' + cv.d + '" stroke="' + col + '" stroke-width="4" fill="none" stroke-linecap="round"' + (ok ? '' : ' stroke-dasharray="7 5"') + '/></g>';
      });
      Object.keys(P3).forEach(function (id) { var p = P3[id]; s += portSvg(id, p.label || '', 'rj45', L.port[id], !!conn3Of(id), 3, ledOf(id, N) || ['#fff', false]); });
      s += '<path data-temp d="" stroke="#0f172a" stroke-width="2.5" stroke-dasharray="5 4" fill="none" style="pointer-events:none"/>';
      sv3.innerHTML = s;
      var aud = N.merged ? ['bad', '불안정 — 두 네트워크가 합쳐졌어요'] : N.audioPri && N.audioSec ? ['ok', '들어옴 · Primary + Secondary (예비 있음)'] : N.audioPri ? ['ok', '들어옴 · Primary 만 (예비 없음)'] : N.audioSec ? ['warn', '들어옴 · Secondary 만 — Primary 를 빨리 고쳐요'] : ['bad', '끊김'];
      var segTxt = S.c3.length ? S.c3.map(function (c) { var l = linkLen(c); return name3(c.a) + '↔' + name3(c.b) + ' ' + l + ' m' + (l > 100 ? ' ✕' : ''); }).join(' · ') : '없음';
      q('[data-role=net]').innerHTML = '<div class="row"><span>Primary 네트워크 (스위치 A)</span><b>' + (N.priTopo && !N.merged ? '배선됨' : '아직') + '</b></div><div class="row"><span>Secondary 네트워크 (스위치 B)</span><b>' + (N.secTopo && !N.merged ? '배선됨' : '아직') + '</b></div>' +
        '<div class="row"><span>랜선 구간</span><b>' + esc(segTxt) + '</b></div><div class="row"><span>무대 입력 (Rio 32채널) → CL5</span><span class="sim-dl-pill ' + aud[0] + '">' + aud[1] + '</span></div>';
    }

    /* ---------------------------------------------------------------- 과제 확인 (놓은 뒤·누른 뒤에만) */
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function check() {
      if (!alive || drag || rdrag) return;
      var okPair = function (x, y) { return S.c1.some(function (c) { return ((c.a === x && y.indexOf(c.b) >= 0) || (c.b === x && y.indexOf(c.a) >= 0)) && c.st[0] === 'ok'; }); };
      if (okPair('rioAes', ['ampAes']) && okPair('x32A', ['s16A', 's16B']) && okPair('s16Adat', ['ifAdat'])) hit('match');
      if (wcEval().allOk) hit('clock');
      if (S.sawClicks && adatLink() && S.ifClk === 'adat') hit('clicks');
      var N = net();
      if (N.priTopo && N.secTopo && !N.merged) hit('redund');
      if (S.c3.length && N.allOk && N.audioPri && !N.merged) hit('length');
      if (S.done.redund && !N.merged && !N.priConn && N.audioSec) hit('failover');
    }

    /* ---------------------------------------------------------------- 마우스 · 터치 */
    function svgPt(sv, e) { var pt = sv.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = sv.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
    function portPos(z, id) { return z === 1 ? L1[S.mode].port[id] : L3(S.mode, S.rackP).port[id]; }
    function onDown(e) {
      if (e.button != null && e.button !== 0) return;
      var pg = e.target.closest && e.target.closest('[data-port]');
      if (pg && el.contains(pg)) { e.preventDefault(); var z = +pg.getAttribute('data-zone'); drag = { z: z, from: pg.getAttribute('data-port'), sv: z === 1 ? sv1 : sv3, x0: e.clientX, y0: e.clientY, moved: false }; return; }
      var rk = e.target.closest && e.target.closest('[data-rack]');
      if (rk && el.contains(rk)) { e.preventDefault(); var L = L3(S.mode, S.rackP), p0 = svgPt(sv3, e); rdrag = { start: L.axis === 'x' ? p0.x : p0.y, r0: L.r }; sv3.classList.add('dragging'); }
    }
    function onMove(e) {
      if (drag) {
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 5) drag.moved = true;
        if (!drag.moved) return; e.preventDefault();
        var p = svgPt(drag.sv, e), a = portPos(drag.z, drag.from), tp = drag.sv.querySelector('[data-temp]');
        if (tp) tp.setAttribute('d', curve(a, [p.x, p.y]).d);
        return;
      }
      if (rdrag) {
        e.preventDefault(); var L = L3(S.mode, S.rackP), pt = svgPt(sv3, e), cur = clamp(rdrag.r0 + ((L.axis === 'x' ? pt.x : pt.y) - rdrag.start), L.rMin, L.rMax);
        S.rackP = Math.round((cur - L.a0) / (L.a1 - L.a0) * TOTAL); render3();   // 끄는 동안은 그림만 바꾸고 과제는 놓은 뒤에 확인
      }
    }
    function onUp(e) {
      if (drag) {
        var d = drag; drag = null;
        var tp = d.sv.querySelector('[data-temp]'); if (tp) tp.setAttribute('d', '');
        var under = document.elementFromPoint(e.clientX, e.clientY), tg = under && under.closest && under.closest('[data-port]');
        var to = tg && +tg.getAttribute('data-zone') === d.z ? tg.getAttribute('data-port') : null;
        if (to && to !== d.from) { connect(d.z, d.from, to); return; }
        if (!d.moved && to === d.from) {
          if (S.armed && S.armed.z === d.z && S.armed.id !== d.from) { connect(d.z, S.armed.id, d.from); return; }
          S.armed = S.armed && S.armed.id === d.from ? null : { z: d.z, id: d.from };
          if (S.armed) fb(d.z === 1 ? 1 : 3, '', '단자를 골랐어요. 이을 다른 단자를 누르세요. (같은 단자를 다시 누르면 취소)');
          if (d.z === 1) render1(); else render3(); return;
        }
        S.armed = null; if (d.z === 1) render1(); else render3();
        return;
      }
      if (rdrag) { rdrag = null; sv3.classList.remove('dragging'); render3(); var N = net(); fb(3, N.allOk ? 'ok' : 'warn', '스위치 랙을 옮겼어요. ' + (S.c3.length ? (N.allOk ? '모든 랜선 구간이 100 m 이하예요.' : '100 m 를 넘는 구간이 있어요.') : '랜선을 이어 보세요.')); check(); }
    }
    function onClick(e) {
      var cg = e.target.closest && e.target.closest('[data-conn]');
      if (cg && el.contains(cg)) { var pr = cg.getAttribute('data-conn').split(':'); removeConn(+pr[0], +pr[1]); return; }
      var wb = e.target.closest && e.target.closest('[data-wc]');
      if (wb) { var kv = wb.getAttribute('data-wc').split(':'); S.wc[kv[0]] = kv[1]; render2(); check(); return; }
      var ib = e.target.closest && e.target.closest('[data-ifclk]');
      if (ib) { S.ifClk = ib.getAttribute('data-ifclk'); render2(); check(); }
    }
    function onChange(e) { var z = e.target.getAttribute && e.target.getAttribute('data-cab'); if (!z) return; if (z === '1') S.cab1 = e.target.value; else S.cab3 = e.target.value; S.armed = null;
      fb(+z, '', '「' + CAB[e.target.value].name + '」를 골랐어요. 단자에서 단자로 끌어 이어 보세요.'); }
    function layout() { var w = el.clientWidth || 640, m = w < 600 ? 'narrow' : 'wide'; if (m !== S.mode) { S.mode = m; render1(); render3(); } }
    el.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove, { passive: false }); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClick); el.addEventListener('change', onChange);
    var ro = window.ResizeObserver ? new ResizeObserver(layout) : null; if (ro) ro.observe(el); else window.addEventListener('resize', layout);
    S.mode = (el.clientWidth || 640) < 600 ? 'narrow' : 'wide';
    render1(); render2(); render3();

    function snap() { var N = net(); return { ready: true, done: Object.keys(S.done), mode: S.mode, cab1: S.cab1, cab3: S.cab3,
      c1: S.c1.map(function (c) { return { a: c.a, b: c.b, cab: c.cab, st: c.st[0] }; }), c3: S.c3.map(function (c) { return { a: c.a, b: c.b, cab: c.cab, len: linkLen(c) }; }),
      rackP: S.rackP, wc: { A: S.wc.A, B: S.wc.B, C: S.wc.C }, wcOk: wcEval().allOk, ifClk: S.ifClk, adat: adatLink(), adStatus: adEval()[0], sawClicks: S.sawClicks, net: N, armed: S.armed && S.armed.id }; }
    return {
      destroy: function () { alive = false; el.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
        el.removeEventListener('click', onClick); el.removeEventListener('change', onChange); if (ro) ro.disconnect(); else window.removeEventListener('resize', layout); el.innerHTML = ''; },
      state: snap,
      set: function (o) {   // 시험용: 상태를 바로 맞춤 (화면 조작과 같은 판정을 거침)
        o = o || {};
        if (o.cab1) S.cab1 = o.cab1; if (o.cab3) S.cab3 = o.cab3;
        (o.c1 || []).forEach(function (c) { var k = S.cab1; S.cab1 = c[2]; connect(1, c[0], c[1]); S.cab1 = k; });
        (o.c3 || []).forEach(function (c) { var k = S.cab3; S.cab3 = c[2]; connect(3, c[0], c[1]); S.cab3 = k; });
        if (o.rackP != null) { S.rackP = clamp(Math.round(+o.rackP), 0, TOTAL); render3(); }
        if (o.wc) { Object.keys(o.wc).forEach(function (k) { if (S.wc[k]) S.wc[k] = o.wc[k] === 'ext' ? 'ext' : 'int'; }); render2(); }
        if (o.ifClk) { S.ifClk = o.ifClk; render2(); }
        check(); return snap();
      }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.digitalLinkBench = digitalLinkBench;
})();

/* =========================================================================== 모듈 데이터 */
(function () {
  'use strict';
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['cable-digital'] = {
    id: 'cable-digital', path: 'hardware', no: 2, noLabel: '02-2', status: 'ready', level: '중급', minutes: 40, img: 'rio3224D2.jpg',
    title: '디지털 케이블', sub: '숫자와 박자를 나르는 길 — AES/EBU · ADAT · MADI · Dante · AES50',
    topics: ['디지털 오디오의 숫자와 클럭', 'AES/EBU 와 S/PDIF', 'ADAT · MADI · USB', '워드클럭과 동기', 'Dante · AES50 · Ultranet · AVB', 'Dante 이중화와 점검'],
    glanceDraft: {
      glance: [
        ['디지털 케이블', '소리를 숫자(0과 1)와 박자(클럭)로 바꿔 보내는 길'],
        ['AES/EBU', 'XLR 모양 · 110 Ω 디지털 케이블 한 가닥에 2채널'],
        ['클럭 마스터', '박자를 정하는 장비는 하나만 — 둘이면 「틱틱」 클릭'],
        ['Dante · AES50', '랜선 한 가닥에 수십 채널 · 한 구간 최대 100 m']
      ],
      heroVis: 'dcOverview'
    },
    overview: {
      lead: '디지털 케이블은 소리를 <b>숫자(0과 1)</b>로 바꿔 보내는 길이에요. 숫자와 함께 <b>박자(클럭)</b>도 실어 보내서, 받는 쪽이 같은 박자로 숫자를 읽어요. 같은 XLR · 랜선 모양이라도 안에 흐르는 규격이 달라서, 단자에 맞는 케이블을 골라야 해요. 이 과정에서는 <b>AES/EBU · S/PDIF · ADAT · MADI</b> 같은 디지털 케이블과, 랜선 한 가닥으로 수십 채널을 보내는 <b>Dante · AES50 · Ultranet</b> 을 배워요. 3층 본당의 <b>Yamaha CL5 ↔ Rio3224-D2</b> 가 Dante 로, 03-2 디지털 콘솔 과정의 <b>Behringer X32 ↔ S16</b> 이 AES50 으로 이어지는 원리도 함께 봐요.',
      terms: [
        ['샘플레이트 · 비트', '1초에 소리를 몇 번 재는지(예: 48 kHz = 48,000번)와, 한 번 잰 값을 몇 자리 0·1 로 적는지(예: 24비트)예요.'],
        ['클럭 (워드클럭)', '디지털 장비들이 숫자를 주고받는 박자예요. 한 장비가 박자를 정하고(마스터·리더) 나머지는 따라가요. 박자만 나누는 BNC 케이블 연결을 워드클럭이라고 해요.'],
        ['AES/EBU (AES3)', 'XLR 모양 단자와 110 Ω 디지털 케이블로 2채널을 보내는 전문가용 규격이에요. 모양은 마이크 케이블과 같지만 다른 케이블이에요.'],
        ['S/PDIF', 'AES3 와 거의 같은 가정용 2채널 규격이에요. 75 Ω 동축(RCA) 이나 광(TOSLINK) 케이블을 써요.'],
        ['ADAT (라이트파이프)', '광(TOSLINK) 케이블 한 가닥에 48 kHz 기준 8채널을 보내는 규격이에요. 녹음용 인터페이스와 프리앰프·스테이지박스를 이을 때 써요.'],
        ['MADI (AES10)', '75 Ω 동축(BNC) 이나 광케이블 한 가닥에 최대 64채널(48 kHz)을 보내는 규격이에요. 방송·대형 공연장에서 많이 써요.'],
        ['Dante', '이더넷 스위치로 네트워크를 만들어 여러 장비가 많은 채널을 주고받는 네트워크 오디오예요(Audinate). CL5 와 Rio3224-D2 가 Dante 로 이어져요.'],
        ['AES50', 'Midas · Behringer 장비끼리 차폐 Cat-5e 랜선 한 가닥으로 직접 잇는 연결이에요. X32 의 단자 하나에 48채널씩 주고받고, 최대 100 m 예요.']
      ],
      points: [
        '모양이 같아도 규격이 달라요. <b>AES/EBU 단자에는 110 Ω 디지털 케이블</b>, <b>AES50 에는 차폐(STP) Cat-5e</b>, <b>ADAT 에는 광케이블</b>을 써요.',
        '디지털 장비끼리는 <b>클럭 마스터가 하나</b>여야 해요. 「틱틱」 클릭이나 끊김이 나면 케이블과 함께 <b>클럭 설정</b>부터 확인해요.',
        '랜선 한 구간은 <b>최대 100 m</b>. 예배 중에는 Dante · AES50 랜선과 네트워크 스위치를 <b>뽑거나 끄지 않아요</b> — 그 길로 다니는 채널이 한꺼번에 끊겨요.'
      ],
      model: 'dconn'   // 2026-11-04: 커넥터 3D(USB 는 C · A-B 실제 모양)
    },
    theory: [
      { title: '디지털 오디오 케이블이란 — 숫자 · 샘플레이트 · 클럭', visual: 'dcBits',
        body: '디지털 연결은 소리를 일정한 박자로 재서 <b>숫자</b>로 바꿔 보내요. 1초에 재는 횟수가 <b>샘플레이트</b>(예: 48 kHz = 1초에 48,000번)이고, 한 번 잰 값을 몇 자리 0·1 로 적는지가 <b>비트</b>(예: 24비트)예요. 받는 쪽이 숫자를 제때 읽으려면 보내는 쪽과 <b>같은 박자(클럭)</b>에 맞춰야 해요. 그래서 디지털 케이블은 「숫자」와 「박자」를 함께 나르는 길이에요. 아날로그는 케이블이 길어질수록 잡음이 조금씩 늘지만, 디지털은 한계까지는 깨끗하다가 한계를 넘으면 <b>갑자기 「틱」 하거나 끊겨요</b>.',
        more: '<ul><li><b>박자도 함께 실려요</b>: AES3 · S/PDIF · ADAT 신호에는 클럭이 데이터 안에 함께 들어 있어서, 받는 장비는 그 입력을 시계로 삼을 수 있어요(4번 주제).</li><li><b>CL5 (제조사 자료)</b>: 44.1 kHz · 48 kHz 로 동작해요. 서로 이어진 장비는 샘플레이트도 같아야 해요.</li><li>디지털 케이블이 「소리를 더 좋게」 만드는 것은 아니에요. 숫자가 <b>제대로 도착하느냐, 못 하느냐</b>의 문제예요. 그래서 규격에 맞는 케이블과 길이를 지키는 게 중요해요.</li><li>디지털 연결 하나에는 여러 채널이 함께 다녀요. 케이블 하나가 빠지면 <b>그 안의 채널이 모두 한꺼번에</b> 사라져요.</li></ul>',
        check: { q: '디지털 장비 두 대를 이었더니 소리 사이사이에 「틱틱」 소리가 섞여요. 가장 먼저 의심할 것은?', options: [
          { t: '두 장비의 박자(클럭)가 맞지 않는다', ok: true, why: '맞아요. 받는 쪽이 다른 박자로 숫자를 읽으면 클릭이 생겨요. 클럭 설정부터 확인해요.' },
          { t: 'EQ 의 고음이 너무 높다', why: 'EQ 는 소리 색을 바꿀 뿐, 규칙적인 틱 소리를 만들지는 않아요.' },
          { t: '케이블이 너무 짧다', why: '짧아서 생기는 문제는 거의 없어요. 너무 길거나 규격이 틀릴 때 문제가 생겨요.' }] } },
      { title: 'AES/EBU (AES3) 와 S/PDIF — 케이블 한 가닥에 2채널', visual: 'dcAesSpdif',
        body: '<b>AES3</b>(흔히 AES/EBU)는 전문가용 디지털 연결이에요. 케이블 한 가닥에 <b>2채널</b>을 보내고, <b>110 Ω 꼬임선 · XLR 단자</b>를 써요. 모양이 마이크 케이블과 똑같아서 헷갈리지만, 마이크 케이블은 아날로그용으로 만들어져 110 Ω 규격이 아니에요. 스피커 제조사 Genelec 은 AES/EBU 입력에 <b>마이크 케이블을 쓰지 말고</b> AES/EBU 용 케이블을 쓰라고 안내해요. 잘못 쓰면 소리가 나빠지거나 신호를 받지 못하고, 케이블이 길수록 심해져요. <b>S/PDIF</b> 는 AES3 와 거의 같은 <b>가정용</b> 규격으로, 75 Ω 동축(RCA) 이나 광(TOSLINK) 케이블을 써요.',
        more: '<ul><li><b>왜 케이블이 달라야 할까</b>: 아날로그 오디오는 100 kHz 아래 주파수만 다루지만, AES/EBU 디지털 신호는 대략 0.5 ~ 30 MHz 까지 넓게 써요(Genelec 자료). 그래서 케이블의 「임피던스(110 Ω)」를 맞춰야 신호가 되튀지 않아요.</li><li><b>길이</b>: 110 Ω 균형형 AES3 는 보통 100 m 안팎까지 써요(자료에 따라 최대 150 m 로도 적어요). S/PDIF 동축은 보통 10 m 안팎으로 짧게 써요.</li><li><b>Rio3224-D2 (제조사 자료)</b>: 아날로그 입력 32 · 출력 16 외에 <b>AES/EBU 디지털 출력 8채널</b>이 있어요. 디지털 입력이 있는 앰프·프로세서로 보낼 때 써요.</li><li><b>구분 방법</b>: AES/EBU 케이블에는 보통 「AES/EBU」「110 Ω」「Digital」 같은 표기가 있어요. 마이크 케이블과 섞이지 않게 색 테이프나 이름표로 따로 표시해 두세요.</li><li>광(TOSLINK)은 빛으로 보내서 장비 사이 전기가 이어지지 않아요. 그라운드 루프 험을 피하는 데 도움이 돼요.</li></ul>',
        check: { q: 'Rio3224-D2 의 AES/EBU 출력을 디지털 입력이 있는 앰프에 이으려 해요. 알맞은 케이블은?', options: [
          { t: '110 Ω AES/EBU 디지털 케이블', ok: true, why: '맞아요. 모양은 XLR 이지만 디지털 규격(110 Ω)에 맞춘 케이블이에요.' },
          { t: '모양이 같으니 아무 마이크 케이블', why: '마이크 케이블은 110 Ω 규격이 아니라 틱 소리나 끊김이 생길 수 있어요.' },
          { t: 'speakON 스피커 케이블', why: 'speakON 은 앰프 → 패시브 스피커의 큰 전력용이에요. 디지털 신호용이 아니에요.' }] } },
      { title: '한 가닥에 여러 채널 — ADAT · MADI · USB', visual: 'dcMulti',
        body: '채널이 많으면 케이블 한 가닥에 여러 채널을 묶어 보내요. <b>ADAT</b>(라이트파이프)는 광(TOSLINK) 케이블 한 가닥에 48 kHz 기준 <b>8채널</b>, 96 kHz 에서는 4채널을 보내요. <b>MADI</b>(AES10)는 75 Ω 동축(BNC) 이나 광케이블 한 가닥에 최대 <b>64채널</b>(48 kHz)을 보내요. 컴퓨터 녹음에는 <b>USB</b> 를 많이 쓰는데, X32 의 X-USB 카드는 USB 로 32채널을 주고받아요. USB 2.0 케이블은 한 구간 <b>5 m</b> 가 한계예요.',
        more: '<ul><li><b>S16 (제조사 자료)</b>: 마이크 입력 16 · 출력 8 외에 <b>ADAT 광 출력 2개(각 8채널)</b>가 있어요. 녹음용 인터페이스의 ADAT 입력으로 보낼 수 있어요.</li><li><b>MADI</b>: 동축은 100 m 넘게도 쓰고, 광케이블은 km 단위까지 보낼 수 있어요. 예전 규격은 56채널이었고, 샘플레이트를 높이면 채널 수가 줄어요.</li><li><b>USB 가 더 멀어야 할 때</b>: 전원이 있는 USB 허브나 액티브(증폭) USB 케이블을 중간에 넣어요. 그래도 멀면 녹음 컴퓨터를 콘솔 가까이 두는 편이 안전해요.</li><li><b>광케이블 다루기</b>: 심하게 꺾으면(보통 케이블 지름의 10배보다 작게) 속심이 상해요. 쓰지 않는 플러그는 <b>먼지 마개</b>를 씌우고, 밟거나 문틈에 끼우지 말고, 케이블 타이 대신 벨크로로 묶어요.</li></ul>',
        check: { q: 'S16 의 ADAT 출력 8채널을 녹음용 오디오 인터페이스로 보내려 해요. 어떤 케이블을 쓸까요?', options: [
          { t: '광(TOSLINK) 케이블', ok: true, why: '맞아요. ADAT 은 빛으로 보내는 광케이블 한 가닥에 8채널(48 kHz)을 실어요.' },
          { t: 'XLR 마이크 케이블 8가닥', why: 'ADAT 단자는 광 단자예요. XLR 은 꽂히지 않아요.' },
          { t: 'USB 케이블', why: 'USB 는 인터페이스와 컴퓨터 사이에 써요. S16 ADAT 출력은 광 단자예요.' }] } },
      { title: '워드클럭과 동기 — 시계는 하나만', visual: 'dcClock',
        body: '디지털 장비를 서로 이으면 모두 <b>같은 박자</b>로 움직여야 해요. 한 장비가 <b>마스터</b>(리더)가 되어 박자를 내보내고, 나머지는 그 박자를 따라가요(팔로워). AES3 · S/PDIF · ADAT 신호에는 박자가 함께 실려 있어서 받는 장비가 그 입력을 시계로 고를 수 있고, 박자만 따로 나누는 <b>워드클럭</b>(BNC 케이블)도 있어요. 마스터가 둘이거나 아무도 맞추지 않으면 <b>「틱 · 톡」 클릭, 잡음</b>이 생기고, 소리가 아예 안 나기도 해요.',
        more: '<ul><li><b>정하는 방법</b>: 마스터 장비 하나만 「내부(INT)」, 나머지는 「외부」(워드클럭 IN, 또는 신호가 들어오는 AES · ADAT 입력)로 맞춰요.</li><li><b>워드클럭 배선</b>: BNC 케이블로 마스터의 WORD CLOCK OUT → 다른 장비의 IN 으로 이어요. T자 커넥터로 여러 대를 잇는다면 마지막 장비는 <b>75 Ω 종단</b>해요.</li><li><b>CL5 (제조사 자료)</b>: 뒷면에 WORD CLOCK IN · OUT(BNC)이 있어요.</li><li><b>Dante 의 클럭</b>: Dante 장비들은 네트워크(PTP)로 박자를 맞춰요. 그중 하나가 자동으로 <b>리더</b>가 되고, Dante Controller 에서 원하는 장비를 「Preferred Leader」로 정할 수도 있어요. 설정이 서로 부딪히면 동기를 잃고 소리가 꺼질 수 있어요(Audinate 자료).</li><li>샘플레이트(풀업·풀다운 설정 포함)가 다른 Dante 장비끼리는 연결(구독)이 되지 않아요.</li><li><b>점검 요령</b>: 설정을 바꿀 때마다 일정한 사인파(예: 4 kHz)를 틀어 놓고 클릭이 나는지 들어 보면 빨리 찾을 수 있어요.</li></ul>',
        check: { q: '오디오 인터페이스가 ADAT 입력으로 S16 의 신호를 받는데 「틱틱」 소리가 나요. 인터페이스의 클럭 설정은?', options: [
          { t: 'ADAT 입력(S16 의 박자를 따라가게)', ok: true, why: '맞아요. 신호를 보내는 쪽 박자를 받아 읽으면 클릭이 사라져요.' },
          { t: '내부(INT) — 인터페이스가 스스로 박자를 정한다', why: '그러면 S16 과 인터페이스 두 장비가 각자 박자를 정해 어긋나요.' },
          { t: '아무거나 같다', why: '클럭 소스가 틀리면 클릭이 나거나 소리가 안 나요.' }] } },
      { title: '랜선으로 보내는 오디오 — Dante · AES50 · Ultranet · AVB', visual: 'dcLanFamily',
        body: '같은 랜선 · etherCON 이라도 안에 흐르는 <b>규격</b>이 달라서 서로 바꿔 꽂으면 동작하지 않아요. <b>Dante</b> 는 이더넷 스위치로 네트워크를 만들어 여러 장비가 채널을 주고받아요(CL5 ↔ Rio3224-D2). <b>AES50</b> 은 Midas · Behringer 장비끼리 <b>1:1 로 직접</b> 잇는 연결이에요. X32 ↔ S16 처럼 쓰고, Behringer 는 <b>차폐 Cat-5e · etherCON</b> 케이블만, <b>최대 100 m</b> 까지 쓰라고 안내해요. <b>Ultranet</b> 은 Behringer 의 개인 모니터(P16)용 16채널 연결로, 이더넷이 아니라서 스위치에 꽂지 않아요. <b>AVB · Milan</b> 은 IEEE 표준 네트워크 오디오로, AVB 를 지원하는 스위치가 있어야 해요.',
        more: '<ul><li><b>X32 뒷면 (제조사 자료)</b>: AES50 A · B (S16 이나 다른 X32 계열 장비와 연결), ULTRANET (P16 개인 모니터로 16채널), ETHERNET (앱·컴퓨터 원격 조작용) 단자가 따로 있어요. 모두 랜선 단자라 헷갈리기 쉬워요.</li><li><b>AES50</b>: 이더넷 케이블의 물리 규격만 빌려 쓰고 클럭도 함께 실어 보내요. 일반 네트워크 스위치를 거쳐 나눌 수 없어서 장비끼리 직접 이어요. S16 은 AES50 단자가 2개라 이어 붙일 수도 있어요.</li><li><b>Ultranet</b>: Ultranet 단자는 다른 Ultranet 단자에만 이어요. 분배기 P16-D 는 랜선으로 P16 8대까지 전원도 함께 보내요. Behringer 는 차폐 Cat-5e 를 권해요.</li><li><b>Dante</b>: 기가비트 링크 하나로 48 kHz 기준 최대 512채널씩 양방향을 보낼 수 있어요(Yamaha 자료). Cat5e 또는 Cat6 를 써요.</li><li><b>AVB · Milan</b>: 시간(802.1AS)과 대역 예약(802.1Qat · Qav) 기능이 있는 스위치가 필요하고, Avnu 가 장비와 스위치를 인증해요. 이 과정에서는 이름만 알아 둬요.</li></ul>',
        check: { q: 'X32 뒷면 ETHERNET 단자에 S16 의 랜선을 꽂았어요. 어떻게 될까요?', options: [
          { t: '소리가 오지 않아요. S16 은 AES50 A · B 단자에 꽂아야 해요', ok: true, why: '맞아요. ETHERNET 은 원격 조작용이고, 오디오는 AES50 으로 다녀요.' },
          { t: '모양이 같으니 그대로 잘 된다', why: '모양은 같아도 규격이 달라서 오디오가 오가지 않아요.' },
          { t: 'ULTRANET 에 꽂아도 똑같다', why: 'ULTRANET 은 P16 개인 모니터로 보내는 출력이에요. S16 연결은 AES50 이에요.' }] } },
      { title: 'Dante 이중화 · 거리 · 점검 — CL5 와 Rio3224-D2', visual: 'dcDante',
        body: '3층 본당은 무대의 <b>Rio3224-D2</b> 스테이지박스가 마이크 신호를 디지털로 바꿔 방송실 <b>CL5</b> 로 Dante 로 보내요. 두 장비 모두 <b>PRIMARY · SECONDARY</b> 두 단자(etherCON)가 있어요. 둘 다 쓰면 같은 소리를 <b>두 네트워크로 동시에</b> 보내서, 한쪽이 끊겨도 다른 쪽으로 소리가 이어져요. 이때 Primary 와 Secondary 는 <b>서로 다른 스위치</b>(별도 네트워크)로 나누고, 두 네트워크를 서로 잇지 않아요. 랜선 한 구간은 이더넷 규격상 <b>최대 100 m</b> 이고, 더 멀면 중간에 스위치를 두거나 스위치 사이를 광케이블로 이어요.',
        more: '<ul><li><b>CL5 (제조사 자료)</b>: Dante 입력 64 · 출력 64채널(48 kHz), 단자는 PRIMARY · SECONDARY etherCON(Cat5e)이에요.</li><li><b>Rio3224-D2 (제조사 자료)</b>: 아날로그 입력 32 · 출력 16, AES/EBU 출력 8채널, Primary · Secondary 이중화와 이어 붙이기(데이지 체인)를 지원하고 전원부도 2개예요.</li><li><b>케이블</b>: Yamaha 는 STP(차폐) 케이블을 권하고, 어떤 케이블은 기가비트에서 100 m 가 아니라 75 ~ 85 m 까지만 보장된다고 안내해요. 스위치는 기가비트를 쓰고, 절전 기능(EEE)은 꺼야 동기가 흔들리지 않아요.</li><li><b>두 네트워크를 이으면</b>: 신호가 고리처럼 돌아 Dante 장비가 멈출 수 있어요(Symetrix 자료).</li><li><b>점검 순서</b>: ① 단자 옆 링크(LINK/ACT) 불빛 → ② 장비의 SYNC 표시 → ③ Dante Controller 의 연결(구독)과 클럭 상태 → ④ 케이블 바꿔 보기. 3층의 실제 스위치 위치와 배선은 교회 설정을 따르고, 예배 중에는 랜선·스위치를 건드리지 않아요.</li></ul>',
        check: { q: '이중화로 연결된 CL5 · Rio3224-D2 에서 Primary 랜선이 빠졌는데 소리는 계속 나요. 알맞은 판단은?', options: [
          { t: 'Secondary 로 같은 소리가 오고 있어요. 지금은 예비가 없는 상태라 예배 뒤 바로 고쳐요', ok: true, why: '맞아요. 이중화 덕에 소리는 이어지지만, 한쪽이 더 끊기면 소리가 사라져요.' },
          { t: '소리가 나니 Primary 는 필요 없어요', why: '예비 길이 없어져서 다음 고장 때 바로 소리가 끊겨요.' },
          { t: '두 스위치를 랜선으로 이어 주면 더 튼튼해져요', why: '두 네트워크를 이으면 이중화가 깨지고 장비가 멈출 수 있어요.' }] } }
    ],
    practice: {
      kind: 'digitalLinkBench',
      lead: '가상 디지털 연결 작업대예요. ① 장비 단자에 알맞은 디지털 케이블을 마우스로 끌어 잇고, ② 클럭 마스터를 하나로 맞추고 ADAT 클릭의 원인을 고치고, ③ CL5 · Rio3224-D2 를 Dante Primary · Secondary 로 이중화 배선한 뒤 100 m 규칙을 지켜 스위치 랙을 옮겨 봐요. 마지막에는 Primary 랜선을 뽑아 소리가 Secondary 로 이어지는지 확인해요.',
      note: '단자 배치·표시등·케이블 길이는 교육용으로 단순화했어요. 140 m 거리, 디지털 앰프, 장비 A · B · C 는 연습용 예시예요. 「불안정」(마이크 케이블 · UTP · 100 m 초과)은 실제로는 바로 끊기지 않고, 가끔 틱 소리가 나거나 어느 순간 갑자기 끊기는 식으로 나타날 수 있어요. 3층의 실제 배선은 교회 설정을 따라요.',
      tasks: [
        { id: 'match', title: '알맞은 디지털 케이블로 잇기', text: '① 세 연결을 모두 「정상」으로 만드세요: Rio3224-D2 AES/EBU OUT → 디지털 앰프 AES3 IN, X32 AES50 A ↔ S16 AES50 단자, S16 ADAT OUT → 인터페이스 OPTICAL IN.' },
        { id: 'clock', title: '클럭 마스터는 하나', text: '② 워드클럭으로 이어진 장비 A · B · C 의 클럭을 정해 세 장비의 SYNC 를 모두 초록으로 만드세요.' },
        { id: 'clicks', title: '「틱틱」 클릭 원인 고치기', text: '② ①에서 ADAT 광케이블을 이으면 인터페이스에 클릭이 생겨요. 클릭을 확인한 뒤 인터페이스의 클럭 소스를 바꿔 없애세요.' },
        { id: 'redund', title: 'Dante 이중화 배선', text: '③ 랜선으로 CL5 · Rio3224-D2 의 PRIMARY 는 스위치 A, SECONDARY 는 스위치 B 에 이으세요. 두 스위치는 서로 잇지 않아요.' },
        { id: 'length', title: '한 구간 100 m 지키기', text: '③ 스위치 랙을 끌어 옮겨 모든 랜선 구간을 100 m 이하로 만들고, Primary 로 무대 입력이 들어오게 하세요.' },
        { id: 'failover', title: 'Primary 가 끊겨도 이어지는지', text: '③ 이중화 배선 뒤 Primary 랜선 하나를 눌러 뽑아 보세요. Secondary 로 무대 입력이 계속 들어오면 성공이에요(실제 예배 중에는 뽑지 않아요).' }
      ],
      links: [
        { title: 'CL5 콘솔 트레이닝', text: 'Rio3224-D2 에서 Dante 로 들어온 채널을 CL5 에서 예배 식순에 맞춰 다뤄 봐요.', go: { tab: 'tab5' } },
        { title: '3층 음향 시스템 · 신호 따라가기', text: '강대상 마이크 신호가 무대에서 방송실 CL5 까지 가는 길을 3D 로 따라가 봐요.', go: { tab: 'tab2', trace: 'mic_podium_L' } }
      ]
    },
    quiz: [
      { q: '디지털 앰프의 AES/EBU 입력을 일반 마이크 케이블로 이었더니 가끔 「틱」 소리가 나요. 가장 알맞은 조치는?', options: [
        { t: '110 Ω AES/EBU 디지털 케이블로 바꾼다', ok: true, why: '맞아요. 마이크 케이블은 110 Ω 규격이 아니라 디지털 신호가 흐트러질 수 있어요.' },
        { t: '앰프 볼륨을 줄인다', why: '볼륨과 상관없이 디지털 신호를 잘못 읽어서 생기는 소리예요.' },
        { t: '마이크 케이블을 더 긴 것으로 바꾼다', why: '길수록 더 심해져요.' }] },
      { q: 'S16 을 X32 에서 120 m 떨어진 곳에 두고 AES50 으로 이으려 해요. 알맞은 판단은?', options: [
        { t: 'Behringer 안내 최대 길이(100 m)를 넘으니 S16 을 더 가까이 두도록 배치를 바꾼다', ok: true, why: '맞아요. AES50 은 장비끼리 직접 잇는 연결이라 한 구간 100 m 안에 들어와야 해요.' },
        { t: '랜선 두 개를 젠더로 이어 120 m 로 만든다', why: '이어 붙여도 전체 길이가 한 구간으로 120 m 라 규격을 넘어요.' },
        { t: '중간에 일반 이더넷 스위치를 넣는다', why: 'AES50 은 일반 네트워크 스위치를 지나지 못해요.' }] },
      { q: 'P16 개인 모니터로 가는 X32 의 ULTRANET 랜선을 Dante 네트워크 스위치에 꽂았어요. 어떻게 될까요?', options: [
        { t: '동작하지 않아요. Ultranet 은 이더넷이 아니라 Ultranet 단자끼리만 이어요', ok: true, why: '맞아요. 모양만 랜선이고 규격이 달라요.' },
        { t: '스위치가 알아서 P16 으로 보내 줘요', why: 'Ultranet 은 네트워크 스위치가 다루는 이더넷 신호가 아니에요.' },
        { t: 'Dante 채널이 16개 늘어나요', why: 'Ultranet 과 Dante 는 서로 다른 규격이에요.' }] },
      { q: '녹음용 컴퓨터를 콘솔에서 12 m 떨어진 곳에 두려고 USB 2.0 케이블 하나로 이으려 해요. 알맞은 판단은?', options: [
        { t: 'USB 2.0 은 한 구간 5 m 가 한계라, 컴퓨터를 가까이 두거나 전원 있는 허브·액티브 케이블을 쓴다', ok: true, why: '맞아요. 5 m 를 넘으면 중계 장치가 필요해요.' },
        { t: 'USB 는 길이 제한이 없다', why: 'USB 2.0 규격은 한 구간 5 m 예요.' },
        { t: '랜선 젠더로 USB 를 이어 붙인다', why: '규격이 다른 케이블을 이어 붙이면 동작을 보장할 수 없어요.' }] },
      { q: '워드클럭으로 이은 디지털 장비 세 대가 모두 「내부(INT)」 클럭이에요. 소리에 클릭이 섞일 때 알맞은 조치는?', options: [
        { t: '한 대만 INT(마스터)로 두고, 나머지는 워드클럭 IN 을 따르게 한다', ok: true, why: '맞아요. 박자를 정하는 장비는 하나여야 해요.' },
        { t: '세 대 모두 워드클럭 IN 으로 바꾼다', why: '그러면 박자를 내보내는 장비가 없어 잠기지 않아요(UNLOCK).' },
        { t: '케이블을 모두 새것으로 바꾼다', why: '케이블이 아니라 클럭 설정 문제예요.' }] }
    ],
    missions: [
      { title: '3층 음향 시스템 · 신호 따라가기', text: '무대의 마이크가 Rio3224-D2 를 거쳐 Dante 로 방송실 CL5 까지 가는 길을 3D 로 보고, 어디가 디지털 구간인지 짚어 봐요.', go: { tab: 'tab2', trace: 'mic_podium_L' } },
      { title: '음향 트러블슈팅 · 미션 A', text: '「소리가 안 나요」를 해결할 때 아날로그 경로와 함께 디지털 연결(링크 불빛 · SYNC · 클럭)도 점검 순서에 넣어 봐요.', go: { tab: 'tab7', ts: 'A' } }
    ],
    deeper: [
      { title: 'Dante Controller — 연결과 클럭 상태 보기', text: 'Dante 네트워크에서 어떤 채널을 어디로 보낼지(구독)는 Audinate 의 <b>Dante Controller</b> 프로그램에서 정해요. 같은 프로그램에서 각 장비의 클럭 상태도 볼 수 있어요.', more: '<ul><li><b>클럭 리더</b>: Dante 장비들은 PTP 로 박자를 맞추고, 그중 하나가 리더가 돼요. 워드클럭 · AES3 같은 외부 시계 입력이 있는 장비, 기가비트로 연결된 장비가 리더로 먼저 뽑혀요. 「Preferred Leader」로 정해 둘 수도 있어요.</li><li><b>Clock Status</b> 화면에서 리더와 팔로워, 동기 상태를 확인해요. 「clock domain mismatch」 메시지는 장비끼리 샘플레이트(풀업·풀다운) 설정이 달라 연결할 수 없다는 뜻이에요.</li><li>Dante 설정은 담당자만 바꾸고, 바꾸기 전 지금 상태를 저장해 두세요.</li></ul>' },
      { title: 'Dante 용 네트워크 스위치 고르기', text: 'Dante 는 일반 이더넷 장비를 쓰지만 아무 스위치나 되는 것은 아니에요. 기가비트 · 막힘 없는(non-blocking) 스위치를 쓰고, 관리형 스위치가 설정과 점검에 편해요.', more: '<ul><li><b>EEE(절전 이더넷) 끄기</b>: 클럭 동기를 흔들어 소리가 끊길 수 있어서 꺼야 해요(Yamaha 자료).</li><li><b>QoS</b>: Yamaha 는 DSCP 기반 4단계 우선순위(Strict priority)를 권해요. 클럭 신호가 먼저 지나가게 하는 설정이에요.</li><li><b>먼 거리</b>: 스위치끼리는 광 모듈(SFP)로 이어 100 m 보다 멀리 보낼 수 있어요.</li><li>교회 사무실·인터넷 공유기 네트워크에 Dante 장비를 함부로 섞지 않아요. 다른 데이터가 많아지면 오디오가 끊길 수 있어요.</li></ul>' },
      { title: 'MADI 와 광케이블 장거리 연결', text: '방송 중계나 큰 행사에서는 MADI 나 광케이블로 무대와 방송차·별관을 이어요. 동축은 수십~100 m, 광케이블은 km 단위까지 보낼 수 있어요.', more: '<ul><li><b>MADI (AES10)</b>: 48 kHz 에서 최대 64채널(예전 규격 56채널). 75 Ω 동축(BNC) 이나 광(SC 커넥터 권장)을 써요.</li><li><b>광케이블 관리</b>: 지름의 약 10배보다 작게 꺾지 않기, 먼지 마개 씌우기, 밟거나 무거운 것 올리지 않기, 케이블 타이 대신 벨크로, 커넥터는 전용 클리너로 닦기.</li><li>광 연결은 전기가 통하지 않아 건물 사이 접지 차이로 생기는 험을 피하는 데도 좋아요.</li></ul>' }
    ],
    sources: [
      { t: 'Genelec — AES/EBU 입력에 아날로그 마이크 케이블을 써도 되나요? (110 Ω, 대역 0.5–30 MHz)', url: 'https://support.genelec.com/hc/en-us/articles/360013426279-Can-I-use-normal-balanced-analogue-microphone-cable-to-interconnect-my-SAM-Systems-and-their-AES-EBU-digital-audio-input' },
      { t: 'Wikipedia — AES3 (2채널 PCM, 110 Ω XLR, 클럭을 함께 싣는 BMC 부호, 균형형 최대 150 m)', url: 'https://en.wikipedia.org/wiki/AES3' },
      { t: 'Nassau National Cable — What is AES/EBU Cable? (110 Ω XLR 은 100 m 까지)', url: 'https://nassaunationalcable.com/blogs/blog/what-is-aes-ebu-cable' },
      { t: 'Wikipedia — S/PDIF (75 Ω 동축 RCA · TOSLINK 광, 2채널, AES3 와의 관계, 동축 약 10 m)', url: 'https://en.wikipedia.org/wiki/S/PDIF' },
      { t: 'Wikipedia — ADAT Lightpipe (TOSLINK, 48 kHz 8채널, S/MUX 96 kHz 4채널, 24비트)', url: 'https://en.wikipedia.org/wiki/ADAT_Lightpipe' },
      { t: 'Focusrite — All About ADAT (S/MUX, ADAT 연결 시 클럭 맞추기)', url: 'https://us.focusrite.com/articles/all-about-adat' },
      { t: 'Wikipedia — MADI (AES10, 48 kHz 56/64채널, 75 Ω BNC · 광)', url: 'https://en.wikipedia.org/wiki/MADI' },
      { t: 'Audient — Clocking Explained (마스터 하나, 클릭·팝, 워드클럭 BNC · 75 Ω 종단, 4 kHz 사인파 점검)', url: 'https://support.audient.com/hc/en-us/articles/202587353' },
      { t: 'Audinate — Dante Controller 사용 설명: Clock Synchronization (PTP, 리더 선출, Preferred Leader)', url: 'https://dev.audinate.com/GA/dante-controller/userguide/webhelp/content/clock_synchronization.htm' },
      { t: 'Audinate FAQ — clock domain mismatch (샘플레이트 풀업·풀다운이 다르면 구독 불가)', url: 'https://www.audinate.com/learning/faqs/im-trying-to-set-up-a-subscription-between-devices-in-dante-controller-but-im-getting-a-clock-domain-mismatch-message-why-is-this' },
      { t: 'Audinate FAQ — Dante 에 권장하는 이더넷 케이블 (Cat5e · Cat6)', url: 'https://www.audinate.com/learning/faqs/what-type-of-ethernet-cable-is-recommended-for-dante' },
      { t: 'Yamaha — What\'s Dante: Scalable (STP 100 m, 기가비트 스위치, EEE 끄기, QoS, 광 SFP, 512채널씩 양방향)', url: 'https://usa.yamaha.com/products/contents/proaudio/whats_dante/scalable/index.html' },
      { t: 'Symetrix — Dante redundancy (Primary·Secondary 별도 네트워크, 이으면 고리로 장비가 멈출 수 있음)', url: 'https://www.symetrix.co/tech-tips/dante-redundancy' },
      { t: 'Yamaha CL 시리즈 사양 — CL5 Dante 64/64, PRIMARY·SECONDARY etherCON, WORD CLOCK BNC, 44.1/48 kHz', url: 'https://usa.yamaha.com/products/proaudio/mixers/cl_series/specs.html' },
      { t: 'Audinate 제품 목록 — Yamaha Rio3224-D2 (입력 32 · 출력 16 · AES/EBU 출력 8, 이중화)', url: 'https://audinate.com/products/dante-enabled/yamaha/yamaha-rio3224-d2' },
      { t: 'Full Compass — Yamaha Rio3224-D2 (이중화, 데이지 체인, 전원부 2개)', url: 'https://www.fullcompass.com/prod/543820-yamaha-rio3224-d2-32-channel-digital-network-remote-with-dante' },
      { t: 'Behringer X32 계열 사용설명서 (ManualsLib) — AES50 은 차폐 Cat-5e · etherCON, 최대 100 m', url: 'https://www.manualslib.com/manual/909783/Behringer-X32.html?page=22' },
      { t: 'Behringer X32 계열 사용설명서 (ManualsLib) — 뒷면 AES50 A·B, ULTRANET 16채널, ETHERNET 원격, X-USB 32채널', url: 'https://www.manualslib.com/manual/909783/Behringer-X32.html?page=10' },
      { t: 'Full Compass — Behringer S16 (입력 16 · 출력 8, AES50 2개, ADAT 출력 2×8채널, 차폐 Cat-5e, 100 m)', url: 'https://www.fullcompass.com/prod/218133-behringer-s16-digital-snake-stagebox-with-16-inputs-8-outputs' },
      { t: 'Mix — Klark Teknik SuperMAC (AES50 의 바탕: 48채널 양방향, 이더넷 물리층 사용, 클럭 함께 전송)', url: 'https://www.mixonline.com/?p=78548' },
      { t: 'ProSoundWeb 포럼 — AES50 은 일반 이더넷 스위치를 지나지 못함 (사용자 설명, 참고용)', url: 'https://forums.prosoundweb.com/index.php/topic,169141.40.html' },
      { t: 'Sweetwater — Behringer P16 설정 (Ultranet 16채널, 이더넷 아님, P16-D 가 P16 8대에 전원, 차폐 Cat5e)', url: 'https://www.sweetwater.com/sweetcare/articles/behringer-p16-setup/' },
      { t: 'Meyer Sound — Milan AVB 시스템용 스위치 (802.1AS · Qav · Qat, Avnu 인증)', url: 'https://docs.meyersound.com/products/en/recommended-network-switches-for-milan-avb-systems.html' },
      { t: 'Audio-Technica — USB 케이블 최대 길이 (USB 2.0 한 구간 5 m, 허브·액티브 케이블)', url: 'https://audio-technica.com/en-us/support/audio-solutions-question-of-the-week-what-is-the-maximum-length-for-a-usb-cable' },
      { t: 'Oracle — 광케이블 다루기 (최소 굽힘 반경 지름의 10배, 먼지 마개, 벨크로)', url: 'https://docs.oracle.com/cd/E65650_01/E63124_01/refFCCableCare.html' }
    ]
  };
})();
