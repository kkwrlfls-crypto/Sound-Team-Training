/* =============================================================================
   학습 모듈: fx-space — 공간계 이펙트 (Reverb 와 Delay 로 공간감 더하기)  (믹싱 스킬 05)
   - 등록: window.STA_MODULES['fx-space'] / STAVisuals.fx* / STASims.fxSpaceSim
   - 반사음 그림은 거울상 음원(이미지 소스) 방법으로 경로 길이를 계산하고, 343 m/s 로 시간을 구함.
   - 장비 수치는 제조사 자료(MG12XU 사용설명서·기술 사양, CL5 레퍼런스 매뉴얼·브로슈어)에서만 가져옴.
   - 실습: 실제 보컬 녹음(leadVox) → 채널 페이더(Dry) + FX1 리버브(ConvolverNode, 생성한 임펄스 응답)
           + FX2 딜레이(DelayNode + 피드백), PRE/POST 보내기. 소리를 끄면 같은 녹음의 레벨로 계산한 모델이 미터를 움직임.
   ============================================================================= */
(function () {
  'use strict';
  var VIS = window.STAVisuals = window.STAVisuals || {};
  var SIMS = window.STASims = window.STASims || {};
  var C = { ink: '#0f2747', sub: '#5b6b80', line: '#cbd5e1', teal: '#0e7490', cyan: '#22d3ee', blue: '#2563eb', red: '#dc2626', amber: '#f59e0b', green: '#16a34a', bg: '#f8fafc', orange: '#ea580c', violet: '#7c3aed' };
  var SOUND = 343, SONG_BPM = 127;   // 음속(m/s, 20 °C) · 실습 곡 템포(드럼 녹음 분석값, 교육용 근사)
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + s + '</text>'; }
  function nd(v) { return String(Math.round(v * 10) / 10).replace('-', '−'); }
  function dB(x) { return 20 * Math.log10(Math.max(x, 1e-9)); }
  function lin(d) { return d === -Infinity ? 0 : Math.pow(10, d / 20); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  function arrow(x1, y1, x2, y2, col, w, dash) { var a = Math.atan2(y2 - y1, x2 - x1), h = 7; return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="' + (w || 2) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' fill="none"/><path d="M' + (x2 - h * Math.cos(a - 0.45)).toFixed(1) + ' ' + (y2 - h * Math.sin(a - 0.45)).toFixed(1) + 'L' + x2 + ' ' + y2 + 'L' + (x2 - h * Math.cos(a + 0.45)).toFixed(1) + ' ' + (y2 - h * Math.sin(a + 0.45)).toFixed(1) + '" stroke="' + col + '" stroke-width="' + (w || 2) + '" fill="none"/>'; }

  /* ------------------------------------------------------------------ 반사음 계산(그림용) */
  // 옆에서 본 예시 공간: 길이 16 m, 천장 6 m, 스피커(0.5 m, 높이 2.5 m), 듣는 사람(10.5 m, 귀 높이 1.2 m)
  var ROOM = { L: 16, H: 6, S: [0.5, 2.5], R: [10.5, 1.2], k: 0.7 };
  function paths() {
    var S = ROOM.S, Rr = ROOM.R, out = [];
    function add(name, img, hitFn, col) { var dx = Rr[0] - img[0], dy = Rr[1] - img[1], d = Math.hypot(dx, dy); out.push({ name: name, d: d, ms: d / SOUND * 1000, hit: hitFn ? hitFn(img) : null, col: col }); }
    add('직접음', S, null, C.ink);
    add('바닥 반사', [S[0], -S[1]], function (im) { var tt = (0 - im[1]) / (Rr[1] - im[1]); return [im[0] + tt * (Rr[0] - im[0]), 0]; }, C.teal);
    add('천장 반사', [S[0], 2 * ROOM.H - S[1]], function (im) { var tt = (im[1] - ROOM.H) / (im[1] - Rr[1]); return [im[0] + tt * (Rr[0] - im[0]), ROOM.H]; }, C.blue);
    add('뒤 벽 반사', [2 * ROOM.L - S[0], S[1]], function (im) { var tt = (im[0] - ROOM.L) / (im[0] - Rr[0]); return [ROOM.L, im[1] + tt * (Rr[1] - im[1])]; }, C.violet);
    var d0 = out[0].d; out.forEach(function (p, i) { p.late = p.ms - out[0].ms; p.lvl = i ? dB(d0 / p.d * ROOM.k) : 0; });
    return out;
  }

  /* ------------------------------------------------------------------ 그림 */
  VIS.fxReflections = function () {
    var P = paths(), sx = 22, ox = 24, oy = 20, X = function (m) { return ox + m * sx; }, Y = function (m) { return oy + (ROOM.H - m) * sx; };
    var room = '<rect x="' + X(0) + '" y="' + Y(ROOM.H) + '" width="' + ROOM.L * sx + '" height="' + ROOM.H * sx + '" fill="' + C.bg + '" stroke="' + C.ink + '" stroke-width="2"/>' +
      t(X(ROOM.L / 2), Y(ROOM.H) - 6, '천장 (6 m)', { size: 10, fill: C.sub }) + t(X(ROOM.L / 2), Y(0) + 13, '바닥 · 길이 16 m (예시 공간)', { size: 10, fill: C.sub }) + t(X(ROOM.L) - 4, Y(4.6), '뒤 벽', { size: 10, fill: C.sub, anchor: 'end' });
    var lines = P.map(function (p, i) {
      var S = ROOM.S, Rr = ROOM.R;
      if (!i) return arrow(X(S[0]) + 8, Y(S[1]), X(Rr[0]) - 8, Y(Rr[1]), p.col, 2.4);
      return '<path d="M' + X(S[0]) + ' ' + Y(S[1]) + 'L' + X(p.hit[0]).toFixed(1) + ' ' + Y(p.hit[1]).toFixed(1) + '" stroke="' + p.col + '" stroke-width="1.6" fill="none" stroke-dasharray="5 3"/>' + arrow(+X(p.hit[0]).toFixed(1), +Y(p.hit[1]).toFixed(1), X(Rr[0]) - 6, Y(Rr[1]), p.col, 1.6, '5 3');
    }).join('');
    var spk = '<rect x="' + (X(ROOM.S[0]) - 7) + '" y="' + (Y(ROOM.S[1]) - 12) + '" width="14" height="24" rx="3" fill="' + C.ink + '"/>' + t(X(ROOM.S[0]) + 12, Y(ROOM.S[1]) - 16, '스피커', { size: 11, weight: 700, anchor: 'start' });
    var ear = '<circle cx="' + X(ROOM.R[0]) + '" cy="' + Y(ROOM.R[1]) + '" r="8" fill="#f2d2b6" stroke="#8b5e3c" stroke-width="2"/>' + t(X(ROOM.R[0]), Y(ROOM.R[1]) + 24, '듣는 사람', { size: 11, weight: 700 });
    var tx = 396, table = '<rect x="' + (tx - 8) + '" y="12" width="210" height="140" rx="10" fill="#fff" stroke="' + C.line + '"/>' + t(tx, 32, '경로', { size: 11, fill: C.sub, anchor: 'start' }) + t(tx + 112, 32, '거리', { size: 11, fill: C.sub, anchor: 'end' }) + t(tx + 196, 32, '직접음보다', { size: 11, fill: C.sub, anchor: 'end' }) +
      P.map(function (p, i) { var y = 56 + i * 24; return '<path d="M' + tx + ' ' + (y - 4) + 'h14" stroke="' + p.col + '" stroke-width="2.4"' + (i ? ' stroke-dasharray="5 3"' : '') + '/>' + t(tx + 20, y, p.name, { size: 11, anchor: 'start', weight: i ? 400 : 700 }) + t(tx + 112, y, p.d.toFixed(1) + ' m', { size: 11, anchor: 'end' }) + t(tx + 196, y, i ? '+' + p.late.toFixed(1) + ' ms' : nd(p.ms) + ' ms 도착', { size: 11, anchor: 'end', weight: 700, fill: i ? p.col : C.ink }); }).join('') +
      t(tx, 148, '시간 = 거리 ÷ 343 m/s (1 m ≈ 2.9 ms)', { size: 10, fill: C.sub, anchor: 'start' });
    // 아래: 도착 시간 그래프(에코그램)
    var ex0 = 40, ex1 = 584, ey = 262, eh = 52, fx = function (ms) { return ex0 + ms / 90 * (ex1 - ex0); }, fy = function (lv) { return ey - clamp(lv + 24, 0, 24) / 24 * eh; };
    var r = rng(7), tail = '';
    for (var ms = P[0].ms + 14; ms < 90; ms += 0.9) { var lv = -7 - (ms - P[0].ms - 14) * 0.32 - r() * 9; tail += '<path d="M' + fx(ms).toFixed(1) + ' ' + ey + 'V' + fy(lv).toFixed(1) + '" stroke="#94a3b8" stroke-width="1"/>'; }
    var eg = '<path d="M' + ex0 + ' ' + ey + 'H' + ex1 + '" stroke="' + C.ink + '"/>' + [0, 15, 30, 45, 60, 75, 90].map(function (ms) { return t(fx(ms), ey + 13, ms + ' ms', { size: 9, fill: C.sub }); }).join('') + tail +
      P.map(function (p) { return '<path d="M' + fx(p.ms).toFixed(1) + ' ' + ey + 'V' + fy(p.lvl).toFixed(1) + '" stroke="' + p.col + '" stroke-width="3"/>'; }).join('') +
      '<path d="M' + fx(P[0].ms) + ' ' + (ey - eh - 6) + 'h' + (fx(P[0].ms + 30) - fx(P[0].ms)) + '" stroke="' + C.amber + '" stroke-width="3"/>' + t((fx(P[0].ms) + fx(P[0].ms + 30)) / 2, ey - eh - 11, '직접음 뒤 약 30 ms 안: 하나로 들림(선행음 효과)', { size: 10, fill: '#92400e' }) +
      t(fx(P[0].ms) - 4, ey - 20, '직접음', { size: 10, anchor: 'end', weight: 700 }) + t(fx(72), ey - 30, '잔향 (셀 수 없이 많은 반사) →', { size: 10, fill: C.sub }) + t(ex0, ey - eh + 2, '도착 시간', { size: 10, fill: C.sub, anchor: 'start' });
    return svg(600, 290, room + lines + spk + ear + table + eg, '직접음, 초기 반사음, 잔향이 도착하는 시간 계산 예시');
  };
  VIS.fxRoomDecay = function () {
    var x0 = 52, x1 = 380, y0 = 24, y1 = 178, fx = function (s) { return x0 + s / 3 * (x1 - x0); }, fy = function (d) { return y0 + (-d) / 60 * (y1 - y0); };
    var grid = [0, -20, -40, -60].map(function (d) { return '<path d="M' + x0 + ' ' + fy(d) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="' + (d === -60 ? '0' : '3 3') + '"/>' + t(x0 - 6, fy(d) + 4, nd(d), { size: 10, fill: C.sub, anchor: 'end' }); }).join('') +
      [0, 0.5, 1, 1.5, 2, 2.5, 3].map(function (s) { return t(fx(s), y1 + 15, s + ' s', { size: 9, fill: C.sub }); }).join('');
    var L = [[0.6, C.teal, '흡음 많은 작은 방 0.6 s'], [1.5, C.blue, '중간 크기 예배당 1.5 s'], [2.5, C.red, '돌·유리 많은 큰 공간 2.5 s']];
    var body = grid + L.map(function (l) { return '<path d="M' + fx(0) + ' ' + fy(0) + 'L' + fx(l[0]) + ' ' + fy(-60) + '" stroke="' + l[1] + '" stroke-width="3"/><circle cx="' + fx(l[0]) + '" cy="' + fy(-60) + '" r="4" fill="' + l[1] + '"/>'; }).join('') +
      t(x0, 14, '잔향 크기 (dB)', { size: 10, fill: C.sub, anchor: 'start' });
    body += L.map(function (l, i) { var y = 48 + i * 26; return '<path d="M400 ' + (y - 4) + 'h20" stroke="' + l[1] + '" stroke-width="3"/>' + t(426, y, l[2], { size: 11, anchor: 'start' }); }).join('') +
      '<circle cx="408" cy="' + 122 + '" r="4" fill="' + C.ink + '"/>' + t(418, 126, '점 = −60 dB 까지 걸린 시간(RT60)', { size: 11, anchor: 'start', weight: 700 }) +
      t(400, 152, '사람·카펫·쿠션: 흡수 ↑ → 짧아짐', { size: 11, fill: C.sub, anchor: 'start' }) + t(400, 170, '콘크리트·유리·돌: 반사 ↑ → 길어짐', { size: 11, fill: C.sub, anchor: 'start' }) +
      t(594, 212, '값은 비교를 위한 「예시」 — 우리 본당 측정값 아님', { size: 10, fill: C.sub, anchor: 'end' });
    return svg(600, 220, body, '공간에 따른 잔향 시간 RT60 예시');
  };
  VIS.fxRevVsDelay = function () {
    function panel(ox, title, sub, spikes, col) {
      var x0 = ox + 14, x1 = ox + 280, y1 = 150, h = 100, fx = function (ms) { return x0 + ms / 1300 * (x1 - x0); }, fy = function (lv) { return y1 - clamp(lv + 36, 0, 36) / 36 * h; };
      return '<rect x="' + ox + '" y="6" width="292" height="190" rx="12" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(ox + 146, 26, title, { size: 13, weight: 800, fill: col }) + t(ox + 146, 42, sub, { size: 11, fill: C.sub }) +
        '<path d="M' + x0 + ' ' + y1 + 'H' + x1 + '" stroke="' + C.ink + '"/>' + [0, 300, 600, 900, 1200].map(function (ms) { return t(fx(ms), y1 + 14, ms, { size: 9, fill: C.sub }); }).join('') + t(x1, y1 + 28, 'ms', { size: 9, fill: C.sub, anchor: 'end' }) +
        spikes.map(function (s) { return '<path d="M' + fx(s[0]).toFixed(1) + ' ' + y1 + 'V' + fy(s[1]).toFixed(1) + '" stroke="' + (s[2] || col) + '" stroke-width="' + (s[3] || 1) + '"/>'; }).join('');
    }
    var r = rng(11), rv = [[0, 0, C.ink, 3]];
    for (var ms = 6; ms < 1300; ms += 2.2) rv.push([ms, -8 - ms / 1200 * 60 * 0.6 - r() * 10]);
    var dl = [[0, 0, C.ink, 3]]; for (var k = 1; k * 300 < 1300; k++) dl.push([k * 300, -6 * k, C.orange, 3]);
    return svg(600, 204, panel(4, '리버브 (Reverb)', '촘촘한 반사가 이어지며 줄어드는 「울림」', rv, C.teal) + panel(304, '딜레이 (Delay)', '같은 소리가 일정 간격으로 「반복」', dl, C.orange) +
      t(450, 186, '예시: 300 ms 간격, 반복마다 −6 dB (Feedback 50%)', { size: 10, fill: C.sub }) + t(150, 186, '검은 선 = 원래 소리(직접음) · 「예시」', { size: 10, fill: C.sub }), '리버브와 딜레이의 반사 모양 비교');
  };
  VIS.fxPredelay = function () {
    function row(oy, pre, title, ok) {
      var x0 = 120, x1 = 584, fx = function (ms) { return x0 + ms / 300 * (x1 - x0); }, base = oy + 70, fy = function (lv) { return base - clamp(lv + 36, 0, 36) / 36 * 60; };
      var r = rng(5 + pre), sp = '';
      for (var ms = pre; ms < 300; ms += 1.6) sp += '<path d="M' + fx(ms).toFixed(1) + ' ' + base + 'V' + fy(-10 - (ms - pre) / 1500 * 60 - r() * 8).toFixed(1) + '" stroke="' + C.teal + '" stroke-opacity=".75" stroke-width="1"/>';
      return '<rect x="' + fx(0) + '" y="' + (oy + 6) + '" width="' + (fx(30) - fx(0)) + '" height="64" fill="' + (ok ? C.green : C.red) + '" fill-opacity=".14"/>' +
        '<path d="M' + x0 + ' ' + base + 'H' + x1 + '" stroke="' + C.ink + '"/>' + sp + '<path d="M' + fx(0) + ' ' + base + 'V' + fy(0) + '" stroke="' + C.ink + '" stroke-width="3"/>' +
        (pre ? '<path d="M' + fx(0) + ' ' + (oy + 14) + 'H' + fx(pre) + '" stroke="' + C.violet + '" stroke-width="2"/>' + t((fx(0) + fx(pre)) / 2 + 30, oy + 12, 'Pre-delay ' + pre + ' ms', { size: 10, fill: C.violet, weight: 700, anchor: 'start' }) : '') +
        t(10, oy + 34, title, { size: 12, weight: 800, anchor: 'start' }) + t(10, oy + 52, ok ? '자음 가림: 적음' : '자음 가림: 많음', { size: 11, anchor: 'start', fill: ok ? C.green : C.red, weight: 700 });
    }
    var x0 = 120, x1 = 584, fx = function (ms) { return x0 + ms / 300 * (x1 - x0); };
    return svg(600, 214, row(4, 0, 'Pre-delay 0 ms', false) + row(96, 40, 'Pre-delay 40 ms', true) +
      [0, 50, 100, 150, 200, 250, 300].map(function (ms) { return t(fx(ms), 186, ms + ' ms', { size: 9, fill: C.sub }); }).join('') +
      t(10, 206, '검은 선 = 직접음 · 청록 = 잔향 · 색 띠 = 자음 구간(직접음 뒤 첫 30 ms, 교육용 근사)', { size: 10, fill: C.sub, anchor: 'start' }), 'Pre-delay 가 없을 때와 40 ms 일 때 비교');
  };
  VIS.fxTempo = function () {
    var bpm = 120, q = 60000 / bpm, x0 = 120, x1 = 584, fx = function (ms) { return x0 + ms / 2000 * (x1 - x0); };
    var beats = ''; for (var ms = 0; ms <= 2000; ms += q) beats += '<path d="M' + fx(ms) + ' 20V150" stroke="' + C.line + '" stroke-width="' + (ms % (q * 4) ? 1 : 2) + '"/>' + t(fx(ms), 16, '♩', { size: 11, fill: C.sub });
    function row(y, name, step, col) { var h = t(10, y + 4, name, { size: 12, weight: 700, anchor: 'start' }) + t(110, y + 4, Math.round(step) + ' ms', { size: 11, anchor: 'end', fill: col, weight: 800 }), k = 0; for (var ms = 0; ms <= 2000 + 1; ms += step) { h += '<circle cx="' + fx(ms).toFixed(1) + '" cy="' + y + '" r="' + (k ? 6 - Math.min(4, k * 0.5) : 7) + '" fill="' + (k ? col : C.ink) + '" fill-opacity="' + (k ? Math.max(0.25, 1 - k * 0.12) : 1) + '"/>'; k++; } return h; }
    return svg(600, 236, beats + row(48, '4분음표', q, C.teal) + row(84, '8분음표', q / 2, C.blue) + row(120, '점8분음표', q * 0.75, C.violet) +
      t(x0, 170, '120 BPM 예시: 4분음표 = 60000 ÷ 120 = 500 ms', { size: 12, anchor: 'start', weight: 800 }) +
      t(x0, 190, '8분음표 = 500 ÷ 2 = 250 ms · 점8분음표 = 500 × 0.75 = 375 ms', { size: 11, anchor: 'start', fill: C.sub }) +
      t(x0, 212, '다른 템포: 70 BPM → ' + Math.round(60000 / 70) + ' ms · 100 BPM → 600 ms · ' + SONG_BPM + ' BPM → ' + Math.round(60000 / SONG_BPM) + ' ms', { size: 11, anchor: 'start', fill: C.sub }) +
      t(10, 230, '검은 점 = 원래 소리, 색 점 = 딜레이 반복(Feedback 으로 점점 작아짐)', { size: 10, fill: C.sub, anchor: 'start' }), '템포에 맞춘 딜레이 시간');
  };
  // 신호 흐름(채널 → 페이더 → ST, PRE/POST 에서 FX 로 보내고 FX RTN 으로 돌아옴). live: 실습에서 지금 상태를 강조
  function flowSvg(o) {
    o = o || {}; var post = o.mode !== 'pre', on = '#0e7490', off = '#cbd5e1', fOff = o.faderOff;
    function box(x, y, w, l1, l2, hot, dim) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="46" rx="9" fill="' + (hot ? on : dim ? '#f1f5f9' : C.bg) + '" stroke="' + (hot ? on : C.line) + '" stroke-width="1.6"/>' + t(x + w / 2, y + 20, l1, { size: 12, weight: 800, fill: hot ? '#fff' : dim ? '#94a3b8' : C.ink }) + (l2 ? t(x + w / 2, y + 36, l2, { size: 10, fill: hot ? '#e0f2fe' : C.sub }) : ''); }
    var h = box(8, 30, 76, '입력', '보컬 마이크') + arrow(84, 53, 110, 53, C.ink) + box(112, 30, 84, 'GAIN·EQ', '') + arrow(196, 53, 234, 53, C.ink) +
      box(236, 30, 84, '채널 페이더', fOff ? '내려감' : 'Dry 양', false, fOff) + arrow(320, 53, 358, 53, fOff ? off : C.ink) + box(360, 30, 84, 'ST 버스', '메인 믹스') + arrow(444, 53, 482, 53, C.ink) + box(484, 30, 104, '메인 스피커', '회중석');
    var pre = !post, preCol = pre ? on : '#94a3b8', postCol = post ? on : '#94a3b8';
    h += '<circle cx="216" cy="53" r="6" fill="' + (pre ? on : '#fff') + '" stroke="' + preCol + '" stroke-width="2"/>' + t(216, 22, 'PRE', { size: 10, weight: 800, fill: preCol });
    h += '<circle cx="340" cy="53" r="6" fill="' + (post ? on : '#fff') + '" stroke="' + postCol + '" stroke-width="2"/>' + t(340, 22, 'POST', { size: 10, weight: 800, fill: postCol });
    h += '<path d="M216 59V136" stroke="' + preCol + '" stroke-width="' + (pre ? 2.6 : 1.4) + '" stroke-dasharray="' + (pre ? '0' : '4 3') + '"/>';
    h += '<path d="M340 59V118H250V136" fill="none" stroke="' + postCol + '" stroke-width="' + (post ? 2.6 : 1.4) + '" stroke-dasharray="' + (post ? '0' : '4 3') + '"/>';
    h += box(150, 136, 120, 'FX SEND', o.live ? 'FX1·FX2 Send' : 'AUX2/FX 노브') + arrow(270, 159, 298, 159, C.ink) + box(300, 136, 116, '이펙터', o.live ? '리버브 · 딜레이' : 'SPX (100% Wet)') + arrow(416, 159, 444, 159, C.ink) + box(446, 136, 100, 'FX RTN', 'Return 양');
    h += '<path d="M496 136V100H402V80" fill="none" stroke="' + C.ink + '" stroke-width="2"/><path d="M396 86L402 78L408 86" fill="none" stroke="' + C.ink + '" stroke-width="2"/>';
    h += (post ? t(348, 128, 'POST: 페이더 지난 소리', { size: 10, fill: on, anchor: 'start', weight: 700 }) : '') + (pre ? t(208, 112, 'PRE: 페이더 앞 소리', { size: 10, fill: on, anchor: 'end', weight: 700 }) : '');
    if (!o.live) h += t(300, 204, 'MG12XU: 채널 AUX2/FX 노브 → 내장 SPX → FX RTN 페이더 → ST (제조사 자료를 바탕으로 단순화)', { size: 10, fill: C.sub });
    return svg(600, o.live ? 190 : 212, h, 'FX Send/Return 신호 흐름과 PRE·POST 보내는 위치');
  }
  VIS.fxSendReturn = function () { return flowSvg({ mode: 'post' }); };
  VIS.fxEchogram = function () {
    var x0 = 40, x1 = 584, base = 176, fx = function (ms) { return x0 + ms / 700 * (x1 - x0); }, fy = function (lv) { return base - clamp(lv + 40, 0, 40) / 40 * 130; };
    var r = rng(3), pre = 30, h = '<path d="M' + x0 + ' ' + base + 'H' + x1 + '" stroke="' + C.ink + '"/>' + [0, 100, 200, 300, 400, 500, 600, 700].map(function (ms) { return t(fx(ms), base + 14, ms + ' ms', { size: 9, fill: C.sub }); }).join('');
    [[12, -5], [19, -7], [27, -8], [36, -10], [44, -11], [55, -12]].forEach(function (e) { h += '<path d="M' + fx(e[0]).toFixed(1) + ' ' + base + 'V' + fy(e[1]).toFixed(1) + '" stroke="' + C.blue + '" stroke-width="2.4"/>'; });
    for (var ms = 60; ms < 700; ms += 1.8) h += '<path d="M' + fx(ms).toFixed(1) + ' ' + base + 'V' + fy(-12 - (ms - 60) / 600 * 34 - r() * 7).toFixed(1) + '" stroke="' + C.teal + '" stroke-opacity=".7" stroke-width="1"/>';
    h += '<path d="M' + fx(0) + ' ' + base + 'V' + fy(0) + '" stroke="' + C.ink + '" stroke-width="3.5"/>';
    h += t(fx(0) + 6, fy(0) - 6, '① 직접음', { size: 12, weight: 800, anchor: 'start' }) + t(fx(62), fy(-4) + 2, '← ② 초기 반사음', { size: 12, weight: 800, fill: C.blue, anchor: 'start' }) + t(fx(300), fy(-16), '③ 잔향 (Reverb tail)', { size: 12, weight: 800, fill: C.teal });
    h += '<path d="M' + fx(0) + ' ' + (base + 26) + 'H' + fx(pre) + '" stroke="' + C.violet + '" stroke-width="2"/>' + t(fx(pre) + 4, base + 30, '← 첫 반사까지의 틈 (리버브의 Pre-delay 가 흉내 냄)', { size: 10, fill: C.violet, anchor: 'start' });
    h += t(x1, 16, '소리 크기 ↑ · 시간 → · 「예시」 그림', { size: 10, fill: C.sub, anchor: 'end' });
    return svg(600, 214, h, '직접음, 초기 반사음, 잔향을 나타낸 에코그램 예시');
  };

  /* ------------------------------------------------------------------ 녹음 불러오기 (compressor 와 함께 씀) */
  function b64ToBuf(uri) { var b = atob(uri.slice(uri.indexOf(',') + 1)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  function synthEnv(s) { var base = s % 10 < 5 ? -28 : -8, ph = (s % 0.45) / 0.45; return base - 14 * (1 - Math.pow(Math.sin(Math.PI * Math.min(1, ph / 0.8)), 2)); }
  function getVox(cb) {
    var Vx = window.STA_VOX || (window.STA_VOX = { st: 0, cbs: [] });
    if (Vx.st === 2) { cb(Vx); return; }
    Vx.cbs.push(cb); if (Vx.st === 1) return; Vx.st = 1;
    var uri = window.MG12XU_SOURCE_AUDIO_BASE64 && window.MG12XU_SOURCE_AUDIO_BASE64.leadVox, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    function finish(buf, env, blk) { if (Vx.st === 2) return; Vx.buf = buf; Vx.env = env; Vx.blk = blk; Vx.n = env.length; Vx.dur = env.length * blk; Vx.synthetic = !buf; Vx.st = 2; var l = Vx.cbs; Vx.cbs = []; l.forEach(function (f) { try { f(Vx); } catch (e) { /* 다음 콜백 */ } }); }
    function synth() { var blk = 0.005, n = Math.round(60 / blk), env = new Float32Array(n); for (var i = 0; i < n; i++) env[i] = Math.pow(10, synthEnv(i * blk) / 20); finish(null, env, blk); }
    function decoded(buf) {
      if (Vx.st === 2) return;
      var blk = 0.005, sr = buf.sampleRate, n = Math.floor(buf.duration / blk), env = new Float32Array(n), ch = [];
      for (var c = 0; c < buf.numberOfChannels; c++) ch.push(buf.getChannelData(c));
      for (var i = 0; i < n; i++) { var p = 0, s0 = Math.floor(i * blk * sr), s1 = Math.min(ch[0].length, Math.floor((i + 1) * blk * sr)); for (var k = 0; k < ch.length; k++) { var d = ch[k]; for (var j = s0; j < s1; j++) { var v = d[j] < 0 ? -d[j] : d[j]; if (v > p) p = v; } } env[i] = p; }
      finish(buf, env, blk);
    }
    if (!uri || !OAC) { synth(); return; }
    try { var oc = new OAC(1, 2, 44100), pr = oc.decodeAudioData(b64ToBuf(uri), decoded, synth); if (pr && pr.catch) pr.catch(function () { /* 콜백에서 처리 */ }); } catch (e) { synth(); }
  }

  /* ------------------------------------------------------------------ 실습: FX Send/Return */
  var FADER_PTS = [[0, -Infinity], [0.06, -60], [0.25, -30], [0.5, -10], [0.75, 0], [1, 10]];
  function faderDb(p) { if (p <= 0) return -Infinity; for (var i = 1; i < FADER_PTS.length; i++) { var a = FADER_PTS[i - 1], b = FADER_PTS[i]; if (p <= b[0]) { if (a[1] === -Infinity) return -60 - (b[0] - p) / b[0] * 30; return a[1] + (b[1] - a[1]) * (p - a[0]) / (b[0] - a[0]); } } return 10; }
  function faderPos(d) { if (d === -Infinity) return 0; for (var i = 1; i < FADER_PTS.length; i++) { var a = FADER_PTS[i - 1], b = FADER_PTS[i]; if (d <= b[1]) { if (a[1] === -Infinity) return Math.max(0.001, b[0] - (-60 - d) / 30 * b[0]); return a[0] + (b[0] - a[0]) * (d - a[1]) / (b[1] - a[1]); } } return 1; }
  var START = 20.5, NOTES = { q: [1, '4분음표'], e: [0.5, '8분음표'], de: [0.75, '점8분음표'] };
  function fxSpaceSim(el, opts) {
    opts = opts || {};
    var DEF = { fader: 0, mode: 'post', revSend: -8, revRtn: 0, decay: 2.4, pre: 0, dlySend: -Infinity, dlyRtn: 0, time: 350, fb: 30, note: 'q' };
    var S = {}; Object.keys(DEF).forEach(function (k) { S[k] = DEF[k]; }); S.done = {}; S.audio = false; S.t0 = performance.now(); S.sawPre = false; S.taps = [];
    var SND = function (v) { return v === -Infinity ? '−∞' : (v > 0 ? '+' : '') + nd(v) + ' dB'; };
    var CTRL = {
      fader: ['채널 페이더', 0, 1000, 1], revSend: ['Send', -41, 6, 1], decay: ['Decay (잔향 길이)', 0.3, 4, 0.1], pre: ['Pre-delay', 0, 150, 1], revRtn: ['Return', -41, 6, 1],
      dlySend: ['Send', -41, 6, 1], time: ['Delay Time', 50, 1200, 1], fb: ['Feedback (반복)', 0, 80, 1], dlyRtn: ['Return', -41, 6, 1]
    };
    function rng2(k) { var c = CTRL[k]; return '<label class="sim-range sim-fx-rng"><span>' + c[0] + ' <b data-out="' + k + '"></b></span><input type="range" min="' + c[1] + '" max="' + c[2] + '" step="' + c[3] + '" data-k="' + k + '" aria-label="' + c[0] + '"></label>'; }
    el.innerHTML =
      '<div class="sim-fx">' +
        '<div class="sim-fx-main">' +
          '<div class="sim-fx-flow" data-role="flow"></div>' +
          '<div class="sim-fx-pbox"><canvas data-cv="echo" aria-label="에코그램: 직접음, 리버브, 딜레이 반복"></canvas><small>에코그램(교육용 근사) · 검은 선 = Dry(직접음) · 청록 = 리버브 · 주황 = 딜레이 반복 · 점선 = 이 곡의 4분음표(' + SONG_BPM + ' BPM)</small></div>' +
          '<div class="sim-fx-pbox"><canvas data-cv="zoom" aria-label="첫 150 ms 확대"></canvas><small>첫 150 ms 확대 · 색 띠 = 자음 구간(직접음 뒤 첫 30 ms)</small></div>' +
          '<div class="sim-fx-mtrs" data-role="mtrs">' + ['dry', 'wet', 'main'].map(function (k) { return '<div class="sim-fx-mrow"><span>' + { dry: 'Dry', wet: 'Wet (FX)', main: '메인 출력' }[k] + '</span><i class="sim-fx-bar" data-m="' + k + '"><i></i></i><b data-o="' + k + '">−∞</b></div>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="sim-side">' +
          '<div class="sim-box"><h4>소리</h4><button type="button" class="sim-btn sim-play" data-sim="play">🔊 소리 켜기</button><p class="sim-note" data-role="src"></p></div>' +
          '<div class="sim-box"><h4>채널 (보컬)</h4>' + rng2('fader') +
            '<div class="sim-fx-seg" role="radiogroup" aria-label="FX 보내는 위치"><span>FX 보내는 위치</span><label><input type="radio" name="simFxMode" value="pre"><b>PRE</b><small>페이더 앞</small></label><label><input type="radio" name="simFxMode" value="post"><b>POST</b><small>페이더 뒤</small></label></div></div>' +
          '<div class="sim-box"><h4>FX1 · 리버브 <small>교육용 근사</small></h4>' + rng2('revSend') + rng2('decay') + rng2('pre') + rng2('revRtn') + '</div>' +
          '<div class="sim-box"><h4>FX2 · 딜레이</h4>' + rng2('dlySend') + rng2('time') +
            '<div class="sim-fx-time"><label>ms 직접 입력 <input type="number" min="50" max="1200" step="1" data-sim="timeNum" aria-label="딜레이 시간 ms"></label>' +
            '<label>탭 음표 <select data-sim="note" aria-label="탭 템포 음표">' + Object.keys(NOTES).map(function (k) { return '<option value="' + k + '">' + NOTES[k][1] + '</option>'; }).join('') + '</select></label>' +
            '<button type="button" class="sim-btn" data-sim="tap">👆 탭 템포</button></div><p class="sim-note" data-role="tap">박자에 맞춰 「탭 템포」를 3번 이상 누르면 그 간격으로 Delay Time 이 정해져요.</p>' +
            rng2('fb') + rng2('dlyRtn') + '</div>' +
          '<div class="sim-box sim-read" data-role="read"></div>' +
          '<div class="sim-btns"><button type="button" class="sim-btn" data-sim="reset">처음 상태로</button></div>' +
        '</div>' +
      '</div>';
    injectCss();
    var $ = function (s) { return el.querySelector(s); }, read = $('[data-role=read]'), flow = $('[data-role=flow]'), cvE = $('[data-cv=echo]'), cvZ = $('[data-cv=zoom]');
    var Vx = null, actx = null, N = null, raf = 0, alive = true, dpr = Math.min(2, window.devicePixelRatio || 1), G = {}, M = { idx: -1, e: 0 }, irTimer = 0;
    /* --- 계산 */
    function calc() {
      var F = S.fader, post = S.mode === 'post', rs = S.revSend + S.revRtn, ds = S.dlySend + S.dlyRtn;
      var revMain = post ? F + rs : rs, dlyMain = post ? F + ds : ds;     // 메인에 나오는 효과음(dB, 입력 기준)
      var revAmt = revMain - F, dlyAmt = dlyMain - F;                       // Dry 대비 효과음 양(dB)
      if (isNaN(revMain)) revMain = -Infinity; if (isNaN(dlyMain)) dlyMain = -Infinity; if (isNaN(revAmt)) revAmt = -Infinity; if (isNaN(dlyAmt)) dlyAmt = -Infinity;
      var revOn = revMain > -60 && S.revSend > -41 && S.revRtn > -41, dlyOn = dlyMain > -60 && S.dlySend > -41 && S.dlyRtn > -41;
      var mask = !revOn ? 'off' : S.pre < 10 ? 'many' : S.pre < 20 ? 'some' : 'few', q = 60000 / SONG_BPM;
      return { F: F, post: post, revMain: revMain, dlyMain: dlyMain, revAmt: revAmt, dlyAmt: dlyAmt, revOn: revOn, dlyOn: dlyOn, mask: mask, q: q, tempoErr: S.time - q, sendRevOn: S.revSend > -41 && S.revRtn > -41 && rs >= -30 };
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function judge(c) {
      if (c.F >= -10 && S.decay <= 1.0 && c.revOn && c.revAmt <= -15 && c.revAmt > -45 && (!c.dlyOn || c.dlyAmt <= -40)) hit('sermon');
      if (c.F >= -10 && S.decay >= 1.5 && c.revAmt >= -20 && c.revAmt <= -6 && S.pre >= 20 && S.pre <= 80) hit('predelay');
      if (c.dlyOn && c.dlyAmt >= -30 && Math.abs(c.tempoErr) <= 5) hit('tempo');
      if (!c.post && c.sendRevOn && c.F <= -40 && c.revMain >= -30) S.sawPre = true;
      if (c.post && S.sawPre && c.sendRevOn && c.F <= -40 && c.revMain <= -40) hit('post');
    }
    function update() {
      var c = calc(); S.last = c;
      Object.keys(CTRL).forEach(function (k) { var inp = el.querySelector('[data-k=' + k + ']'), v = S[k], o = el.querySelector('[data-out=' + k + ']');
        if (k === 'fader') { inp.value = Math.round(faderPos(v) * 1000); o.textContent = SND(v); }
        else if (k === 'revSend' || k === 'revRtn' || k === 'dlySend' || k === 'dlyRtn') { inp.value = v === -Infinity ? -41 : v; o.textContent = SND(v); }
        else if (k === 'decay') { inp.value = v; o.textContent = v.toFixed(1) + ' s'; }
        else if (k === 'fb') { inp.value = v; o.textContent = v + ' %'; }
        else { inp.value = v; o.textContent = Math.round(v) + ' ms'; } });
      var tn = $('[data-sim=timeNum]'); if (document.activeElement !== tn) tn.value = Math.round(S.time);
      $('[data-sim=note]').value = S.note;
      el.querySelectorAll('input[name=simFxMode]').forEach(function (r) { r.checked = r.value === S.mode; });
      flow.innerHTML = flowSvg({ mode: S.mode, faderOff: c.F <= -40, live: true });
      judge(c); renderRead(c); drawEcho(c); drawZoom(c); applyAudio();
    }
    function renderRead(c) {
      var amt = function (v) { return v === -Infinity ? '꺼짐' : v === Infinity ? 'Dry 없음 — 효과음만' : (v > 0 ? '+' : '') + nd(v) + ' dB'; };
      var maskTxt = { off: ['', '— (리버브 꺼짐)'], many: ['bad', '많음 — 가사가 흐려요'], some: ['warn', '조금'], few: ['ok', S.pre >= 100 ? '적음 · 잔향이 따로 들릴 수 있어요' : '적음 — 자음이 먼저 들려요'] }[c.mask];
      var revQ = !c.revOn ? ['', ''] : c.revAmt > -6 ? ['bad', ' · 아주 많음'] : c.revAmt > -15 ? ['warn', ' · 많은 편(찬양)'] : ['ok', ' · 적은 편(설교)'];
      var bpmNow = 60000 / S.time, err = c.tempoErr;
      read.innerHTML = '<h4>지금 상태 <small>교육용 근사</small></h4>' +
        '<div class="sim-row"><span>리버브 양 (Dry 대비)</span><b class="' + revQ[0] + '">' + (c.revOn ? amt(c.F === -Infinity && !c.post ? Infinity : c.revAmt) + revQ[1] : '꺼짐') + '</b></div>' +
        '<div class="sim-row"><span>Decay / Pre-delay</span><b>' + S.decay.toFixed(1) + ' s / ' + Math.round(S.pre) + ' ms</b></div>' +
        '<div class="sim-row"><span>자음 가림</span><b class="' + maskTxt[0] + '">' + maskTxt[1] + '</b></div>' +
        '<div class="sim-row"><span>딜레이 양 (Dry 대비)</span><b>' + (c.dlyOn ? amt(c.F === -Infinity && !c.post ? Infinity : c.dlyAmt) : '꺼짐') + '</b></div>' +
        '<div class="sim-row"><span>딜레이 = 4분음표라면</span><b>' + bpmNow.toFixed(1) + ' BPM</b></div>' +
        '<div class="sim-row"><span>이 곡 4분음표와 차이</span><b class="' + (Math.abs(err) <= 5 ? 'ok' : Math.abs(err) <= 30 ? 'warn' : '') + '">' + (err >= 0 ? '+' : '−') + Math.abs(err).toFixed(1) + ' ms</b></div>' +
        '<div class="sim-row"><span>메인에 나가는 리버브</span><b class="' + (c.F <= -40 && c.revMain > -30 ? 'bad' : '') + '">' + (c.revOn || c.revMain > -90 ? SND(Math.round(c.revMain)) : '없음') + (c.F <= -40 ? (c.revMain > -30 ? ' — 페이더를 내렸는데 남아요' : ' — 페이더와 함께 줄었어요') : '') + '</b></div>' +
        '<p class="sim-note">이 곡의 템포는 약 ' + SONG_BPM + ' BPM 이에요(드럼 녹음 분석값). 4분음표 = 60000 ÷ BPM.</p>';
    }
    /* --- 그리기 */
    function prep(cv, h) { var w = cv.parentNode.clientWidth || 300; cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); return { x: x, w: w, h: h }; }
    function size() { G.e = prep(cvE, 180); G.z = prep(cvZ, 96); if (S.last) { drawEcho(S.last); drawZoom(S.last); } }
    function txt(c, s, x, y, al, col, b) { c.fillStyle = col || '#64748b'; c.font = (b ? 'bold ' : '') + '10px sans-serif'; c.textAlign = al || 'center'; c.fillText(s, x, y); }
    function drawEcho(c) {
      var g = G.e; if (!g) return; var x = g.x, w = g.w, h = g.h, l = 34, r = w - 8, tp = 12, bt = h - 18, T = 1600;
      var fx = function (ms) { return l + ms / T * (r - l); }, fy = function (lv) { return bt - clamp(lv + 60, 0, 70) / 70 * (bt - tp); };
      x.clearRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#e2e8f0'; x.lineWidth = 1; [10, 0, -20, -40, -60].forEach(function (d) { x.beginPath(); x.moveTo(l, fy(d)); x.lineTo(r, fy(d)); x.stroke(); txt(x, nd(d), l - 4, fy(d) + 3, 'right'); });
      for (var ms = 0; ms <= T; ms += (w < 520 ? 400 : 200)) txt(x, ms + (ms ? '' : ' ms'), clamp(fx(ms), l + 10, r - 14), h - 4);
      x.setLineDash([3, 4]); x.strokeStyle = '#a78bfa'; for (var b = c.q; b < T; b += c.q) { x.beginPath(); x.moveTo(fx(b), tp); x.lineTo(fx(b), bt); x.stroke(); } x.setLineDash([]);
      txt(x, '♩ ' + SONG_BPM + ' BPM', fx(c.q) + 3, tp + 8, 'left', '#7c3aed', true);
      if (c.revOn) {   // 리버브 꼬리: Pre-delay 뒤에 시작해 Decay 동안 60 dB 줄어듦
        var r0 = c.revMain - 6, rr = rng(9); x.strokeStyle = 'rgba(14,116,144,0.55)'; x.lineWidth = 1;
        for (ms = S.pre; ms < T; ms += 4) { var lv = r0 - (ms - S.pre) / (S.decay * 1000) * 60 - rr() * 6; if (lv < -60) break; x.beginPath(); x.moveTo(fx(ms), bt); x.lineTo(fx(ms), fy(lv)); x.stroke(); }
        x.strokeStyle = '#0e7490'; x.lineWidth = 2; x.beginPath(); x.moveTo(fx(S.pre), fy(r0)); x.lineTo(fx(Math.min(T, S.pre + S.decay * 1000)), fy(r0 - 60 * Math.min(1, (T - S.pre) / (S.decay * 1000)))); x.stroke();
      }
      if (c.dlyOn) { x.lineWidth = 3; x.strokeStyle = '#ea580c'; for (var k = 1; k * S.time < T; k++) { var lv2 = c.dlyMain + dB(Math.pow(S.fb / 100, k - 1)); if (lv2 < -60) break; x.beginPath(); x.moveTo(fx(k * S.time), bt); x.lineTo(fx(k * S.time), fy(lv2)); x.stroke(); } }
      if (c.F > -90) { x.lineWidth = 3.5; x.strokeStyle = '#0f2747'; x.beginPath(); x.moveTo(fx(0), bt); x.lineTo(fx(0), fy(c.F)); x.stroke(); }
      else txt(x, 'Dry 없음 (페이더 −∞)', l + 6, tp + 22, 'left', '#c2410c', true);
      txt(x, 'dB', 4, tp + 2, 'left');
    }
    function drawZoom(c) {
      var g = G.z; if (!g) return; var x = g.x, w = g.w, h = g.h, l = 34, r = w - 8, tp = 8, bt = h - 18, T = 150;
      var fx = function (ms) { return l + ms / T * (r - l); }, fy = function (lv) { return bt - clamp(lv + 60, 0, 70) / 70 * (bt - tp); };
      x.clearRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.fillStyle = c.mask === 'many' ? 'rgba(220,38,38,0.16)' : c.mask === 'some' ? 'rgba(245,158,11,0.2)' : 'rgba(22,163,74,0.14)'; x.fillRect(fx(0), tp, fx(30) - fx(0), bt - tp);
      txt(x, '자음 구간', fx(15), tp + 10, 'center', '#334155', true);
      for (var ms = 0; ms <= T; ms += (w < 520 ? 50 : 25)) txt(x, ms + (ms === T ? ' ms' : ''), clamp(fx(ms), l + 8, r - 18), h - 4);
      if (c.revOn) { var r0 = c.revMain - 6, rr = rng(9); x.strokeStyle = 'rgba(14,116,144,0.6)'; x.lineWidth = 1; for (ms = S.pre; ms < T; ms += 1.2) { var lv = r0 - (ms - S.pre) / (S.decay * 1000) * 60 - rr() * 6; x.beginPath(); x.moveTo(fx(ms), bt); x.lineTo(fx(ms), fy(lv)); x.stroke(); }
        x.strokeStyle = '#7c3aed'; x.lineWidth = 2; x.beginPath(); x.moveTo(fx(0), tp + 18); x.lineTo(fx(S.pre), tp + 18); x.stroke(); txt(x, 'Pre-delay ' + Math.round(S.pre) + ' ms', Math.min(fx(S.pre) + 4, r - 70), tp + 22, 'left', '#7c3aed', true); }
      if (c.dlyOn && S.time <= T) { x.lineWidth = 3; x.strokeStyle = '#ea580c'; x.beginPath(); x.moveTo(fx(S.time), bt); x.lineTo(fx(S.time), fy(c.dlyMain)); x.stroke(); }
      if (c.F > -90) { x.lineWidth = 3.5; x.strokeStyle = '#0f2747'; x.beginPath(); x.moveTo(fx(0), bt); x.lineTo(fx(0), fy(c.F)); x.stroke(); }
      x.strokeStyle = '#0f2747'; x.lineWidth = 1; x.beginPath(); x.moveTo(l, bt); x.lineTo(r, bt); x.stroke();
    }
    /* --- 소리 */
    function now() { if (S.audio && actx && N) return ((actx.currentTime - N.start) % Vx.dur + Vx.dur) % Vx.dur; return (((performance.now() - S.t0) / 1000 + START) % (Vx ? Vx.dur : 60)); }
    function makeIR(rt) {
      var sr = actx.sampleRate, len = Math.floor(sr * Math.min(5, rt * 1.15 + 0.05)), b = actx.createBuffer(2, len, sr), E = 0, d0 = b.getChannelData(0), d1 = b.getChannelData(1);
      for (var i = 0; i < len; i++) { var tt = i / sr, a = Math.exp(-6.9078 * tt / rt) * (tt < 0.004 ? tt / 0.004 : 1), v0 = (Math.random() * 2 - 1) * a, v1 = (Math.random() * 2 - 1) * a; d0[i] = v0; d1[i] = v1; E += (v0 * v0 + v1 * v1) / 2; }
      var k = 1 / Math.sqrt(E || 1); for (i = 0; i < len; i++) { d0[i] *= k; d1[i] *= k; }
      return b;
    }
    function applyAudio() {
      if (!N) return; var tt = actx.currentTime, post = S.mode === 'post', sm = function (p, v) { p.setTargetAtTime(v, tt, 0.03); };
      sm(N.fad.gain, lin(S.fader));
      sm(N.rsPre.gain, post ? 0 : lin(S.revSend)); sm(N.rsPost.gain, post ? lin(S.revSend) : 0); sm(N.rRtn.gain, lin(S.revRtn));
      sm(N.dsPre.gain, post ? 0 : lin(S.dlySend)); sm(N.dsPost.gain, post ? lin(S.dlySend) : 0); sm(N.dRtn.gain, lin(S.dlyRtn));
      sm(N.preD.delayTime, S.pre / 1000); N.dly.delayTime.setTargetAtTime(S.time / 1000, tt, 0.05); sm(N.fbG.gain, S.fb / 100);
      if (N.rt !== S.decay) { clearTimeout(irTimer); irTimer = setTimeout(function () { if (N && N.rt !== S.decay) { N.rt = S.decay; N.conv.buffer = makeIR(S.decay); } }, 150); }
    }
    function startAudio() {
      if (!Vx || !Vx.buf) { $('[data-role=src]').textContent = '녹음을 불러오지 못해 소리는 들을 수 없어요(미터는 가상 신호로 동작).'; return; }
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      actx = actx || new AC(); if (actx.resume) actx.resume();
      var g = function () { return actx.createGain(); }, src = actx.createBufferSource(); src.buffer = Vx.buf; src.loop = true;
      var chIn = g(), fad = g(), dry = g(), rsPre = g(), rsPost = g(), rBus = g(), preD = actx.createDelay(0.5), conv = actx.createConvolver(), rLp = actx.createBiquadFilter(), rHp = actx.createBiquadFilter(), rRtn = g();
      var dsPre = g(), dsPost = g(), dBus = g(), dly = actx.createDelay(2.0), fbLp = actx.createBiquadFilter(), fbG = g(), dRtn = g(), wet = g(), master = g(), mon = g();
      var anDry = actx.createAnalyser(), anWet = actx.createAnalyser(), anMain = actx.createAnalyser(); [anDry, anWet, anMain].forEach(function (a) { a.fftSize = 1024; });
      conv.normalize = false; conv.buffer = makeIR(S.decay); rLp.type = 'lowpass'; rLp.frequency.value = 6500; rHp.type = 'highpass'; rHp.frequency.value = 180; fbLp.type = 'lowpass'; fbLp.frequency.value = 5000; mon.gain.value = 0.6;
      src.connect(chIn); chIn.connect(fad); fad.connect(dry); dry.connect(master);
      chIn.connect(rsPre); fad.connect(rsPost); rsPre.connect(rBus); rsPost.connect(rBus); rBus.connect(preD); preD.connect(conv); conv.connect(rHp); rHp.connect(rLp); rLp.connect(rRtn); rRtn.connect(wet);
      chIn.connect(dsPre); fad.connect(dsPost); dsPre.connect(dBus); dsPost.connect(dBus); dBus.connect(dly); dly.connect(dRtn); dly.connect(fbLp); fbLp.connect(fbG); fbG.connect(dly); dRtn.connect(wet);
      wet.connect(master); master.connect(mon); mon.connect(actx.destination); dry.connect(anDry); wet.connect(anWet); master.connect(anMain);
      var start = actx.currentTime + 0.05, off = now(); src.start(start, off);
      N = { src: src, fad: fad, rsPre: rsPre, rsPost: rsPost, rRtn: rRtn, preD: preD, conv: conv, dsPre: dsPre, dsPost: dsPost, dRtn: dRtn, dly: dly, fbG: fbG, mon: mon, anDry: anDry, anWet: anWet, anMain: anMain, buf: new Float32Array(1024), rt: S.decay, start: start - off };
      S.audio = true; applyAudio();
    }
    function stopAudio() { clearTimeout(irTimer); if (N) { try { N.src.stop(); N.mon.disconnect(); N.fbG.disconnect(); } catch (e) { /* 이미 멈춤 */ } } var p = now(); N = null; S.audio = false; S.t0 = performance.now() - (p - START) * 1000; }
    function peakOf(an) { an.getFloatTimeDomainData(N.buf); var p = 0; for (var i = 0; i < N.buf.length; i++) { var v = Math.abs(N.buf[i]); if (v > p) p = v; } return dB(p); }
    /* --- 모델 미터(소리를 꺼도 움직임) */
    function model(pos) {
      var n = Vx.n, blk = Vx.blk, idx = Math.floor(pos / blk) % n, steps = M.idx < 0 ? 1 : (idx - M.idx + n) % n, c = S.last;
      if (steps > 400) { M.idx = (idx - 1 + n) % n; steps = 1; }
      var kE = 1 - Math.exp(-blk / (S.decay / 13.8)), post = c.post, fl = lin(S.fader), rg = lin(S.revSend) * lin(S.revRtn) * (post ? fl : 1), dg = lin(S.dlySend) * lin(S.dlyRtn) * (post ? fl : 1), lag = Math.round(S.time / 1000 / blk), fb = S.fb / 100, out = { dry: 0, wet: 0, main: 0 };
      for (var s = 0; s < steps; s++) {
        M.idx = (M.idx + 1) % n; var xv = Vx.env[M.idx]; M.e += (xv * xv - M.e) * kE;
        var dsum = 0, g = 1; for (var k = 1; k <= 6 && g > 0.01; k++) { var v = Vx.env[(M.idx - k * lag % n + n * 6) % n] * g; dsum += v * v; g *= fb; }
        var dry = xv * fl, wet = Math.sqrt(M.e * 0.5 * rg * rg + dsum * dg * dg), main = Math.sqrt(dry * dry + wet * wet);
        if (dry > out.dry) out.dry = dry; if (wet > out.wet) out.wet = wet; if (main > out.main) out.main = main;
      }
      return { dry: dB(out.dry), wet: dB(out.wet), main: dB(out.main) };
    }
    function setBar(k, v) { var p = clamp((v + 60) / 60, 0, 1) * 100, b = el.querySelector('[data-m=' + k + '] i'); b.style.width = p.toFixed(1) + '%'; b.className = v > -3 ? 'r' : v > -12 ? 'y' : 'g'; el.querySelector('[data-o=' + k + ']').textContent = v <= -80 ? '−∞' : nd(v); }
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick);
      var L = model(now());
      if (S.audio && N) L = { dry: peakOf(N.anDry), wet: peakOf(N.anWet), main: peakOf(N.anMain) };
      S.meters = L; ['dry', 'wet', 'main'].forEach(function (k) { setBar(k, L[k]); });
    }
    /* --- 입력 */
    function setK(k, v) {
      if (k === 'fader') S.fader = v; else if (/Send|Rtn/.test(k)) S[k] = v <= -41 ? -Infinity : v; else S[k] = v;
    }
    el.addEventListener('input', function (e) {
      var tg = e.target, k = tg.getAttribute('data-k');
      if (k) { var v = +tg.value; setK(k, k === 'fader' ? faderDb(v / 1000) : v); update(); return; }
      if (tg.getAttribute('data-sim') === 'timeNum') { var ms = +tg.value; if (ms >= 50 && ms <= 1200) { S.time = ms; update(); } }
    });
    el.addEventListener('change', function (e) {
      var tg = e.target;
      if (tg.name === 'simFxMode') { S.mode = tg.value; update(); }
      if (tg.getAttribute('data-sim') === 'note') { S.note = tg.value; update(); }
      if (tg.getAttribute('data-sim') === 'timeNum') { S.time = clamp(Math.round(+tg.value) || S.time, 50, 1200); update(); }
    });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var k = b.getAttribute('data-sim');
      if (k === 'play') { if (S.audio) { stopAudio(); b.textContent = '🔊 소리 켜기'; b.classList.remove('on'); } else { startAudio(); if (S.audio) { b.textContent = '🔇 소리 끄기'; b.classList.add('on'); } } }
      if (k === 'tap') {
        var tn = performance.now(); if (S.taps.length && tn - S.taps[S.taps.length - 1] > 2000) S.taps = []; S.taps.push(tn); if (S.taps.length > 5) S.taps.shift();
        var info = $('[data-role=tap]');
        if (S.taps.length >= 3) { var iv = (S.taps[S.taps.length - 1] - S.taps[0]) / (S.taps.length - 1); S.time = clamp(Math.round(iv * NOTES[S.note][0]), 50, 1200); info.textContent = '탭 간격 ' + Math.round(iv) + ' ms ≈ ' + (60000 / iv).toFixed(1) + ' BPM → ' + NOTES[S.note][1] + ' ' + S.time + ' ms'; update(); }
        else info.textContent = '한 번 더 눌러 주세요… (' + S.taps.length + '번)';
      }
      if (k === 'reset') { Object.keys(DEF).forEach(function (x) { S[x] = DEF[x]; }); S.sawPre = false; update(); }
    });
    var lastW = -1, ro = window.ResizeObserver ? new ResizeObserver(function (en) { var w = Math.round(en[0].contentRect.width); if (w === lastW) return; lastW = w; requestAnimationFrame(function () { if (alive) size(); }); }) : null;
    if (ro) ro.observe(el.querySelector('.sim-fx')); else window.addEventListener('resize', size);
    size(); update();
    $('[data-role=src]').textContent = '녹음을 불러오는 중…';
    getVox(function (v) { if (!alive) return; Vx = v; $('[data-role=src]').textContent = v.synthetic ? '녹음을 불러오지 못해 가상 신호로 미터만 보여 줘요.' : '찬양 리드 보컬 녹음이 반복 재생돼요. 처음엔 소리가 꺼져 있어요.'; S.t0 = performance.now(); tick(); });
    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); stopAudio(); if (actx && actx.close) { try { actx.close(); } catch (e) { /* noop */ } } if (ro) ro.disconnect(); else window.removeEventListener('resize', size); el.innerHTML = ''; },
      state: function () { var c = S.last || calc(); return { fader: S.fader, mode: S.mode, revSend: S.revSend, revRtn: S.revRtn, decay: S.decay, pre: S.pre, dlySend: S.dlySend, dlyRtn: S.dlyRtn, time: S.time, fb: S.fb, note: S.note, revAmt: c.revAmt, dlyAmt: c.dlyAmt, revMain: c.revMain, dlyMain: c.dlyMain, mask: c.mask, tempoErr: c.tempoErr, quarter: c.q, sawPre: S.sawPre, meters: S.meters || null, audio: S.audio, ready: !!Vx, synthetic: !!(Vx && Vx.synthetic), done: Object.keys(S.done) }; },
      set: function (o) { Object.keys(o).forEach(function (k) { if (k in DEF) setK(k, o[k] === null ? -Infinity : o[k]); }); update(); return this.state(); }
    };
  }
  SIMS.fxSpaceSim = fxSpaceSim;

  function injectCss() {
    if (document.getElementById('sta-mod-fx-space-css')) return;
    var s = document.createElement('style'); s.id = 'sta-mod-fx-space-css';
    s.textContent =
      '.sim-fx{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:12px;align-items:start}' +
      '.sim-fx-main{display:flex;flex-direction:column;gap:10px;min-width:0}' +
      '.sim-fx-flow{border:1px solid var(--sta-line,#d6dee8);border-radius:10px;background:#fff;padding:6px;overflow-x:auto}' +
      '.sim-fx-flow svg{display:block;width:100%;min-width:420px;height:auto}' +
      '.sim-fx-pbox{display:flex;flex-direction:column;gap:4px;min-width:0}' +
      '.sim-fx-pbox canvas{display:block;border:1px solid var(--sta-line,#d6dee8);border-radius:10px;background:#fff;max-width:100%}' +
      '.sim-fx-pbox small{font-size:.72rem;color:#64748b;line-height:1.45}' +
      '.sim-fx-mtrs{display:grid;gap:6px;padding:10px 12px;border-radius:10px;background:linear-gradient(180deg,#2a2f36,#1a1e24);color:#e5e7eb}' +
      '.sim-fx-mrow{display:grid;grid-template-columns:76px minmax(0,1fr) 48px;gap:8px;align-items:center;font-size:.76rem}' +
      '.sim-fx-mrow span{font-weight:800;color:#cbd5e1}.sim-fx-mrow b{text-align:right;color:#fde68a;font-variant-numeric:tabular-nums}' +
      '.sim-fx-bar{display:block;height:12px;border-radius:3px;background:#0b0d10;overflow:hidden}' +
      '.sim-fx-bar i{display:block;height:100%;width:0;background:#22c55e;transition:width .05s linear}.sim-fx-bar i.y{background:#eab308}.sim-fx-bar i.r{background:#ef4444}' +
      '.sim-fx-rng{margin-bottom:6px}.sim-fx-rng b{font-variant-numeric:tabular-nums;color:#0e7490}' +
      '.sim-fx-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;font-size:.8rem}.sim-fx-seg>span{grid-column:1/-1;color:#64748b;font-size:.76rem}' +
      '.sim-fx-seg label{display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px;border:1px solid var(--sta-line,#d6dee8);border-radius:8px;cursor:pointer;text-align:center}' +
      '.sim-fx-seg label:has(input:checked){border-color:var(--sta-cyan,#0e7490);background:var(--sta-cyan-soft,#e6f6f9)}' +
      '.sim-fx-seg input{position:absolute;opacity:0;pointer-events:none}.sim-fx-seg label:focus-within{outline:2px solid var(--sta-cyan,#0e7490);outline-offset:1px}' +
      '.sim-fx-seg small{font-size:.68rem;color:#64748b}' +
      '.sim-fx-time{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;font-size:.74rem;color:#64748b;margin:2px 0 4px}' +
      '.sim-fx-time label{display:flex;flex-direction:column;gap:2px}.sim-fx-time input,.sim-fx-time select{font:inherit;font-size:.8rem;padding:4px 6px;border:1px solid var(--sta-line,#d6dee8);border-radius:6px;width:92px;color:#0f1f33}' +
      '@media (max-width:860px){.sim-fx{grid-template-columns:minmax(0,1fr)}}';
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ 모듈 데이터 */
  var MG_OM = 'https://usa.yamaha.com/files/download/other_assets/8/1506928/mg16x_en_om_a0.pdf',
    MG_TS = 'https://usa.yamaha.com/files/download/other_assets/6/1525326/mg12x_en_ts_a0.pdf';
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['fx-space'] = {
    id: 'fx-space', path: 'mixing', no: 5, status: 'ready', level: '중급', minutes: 35, thumb: 'reverb',
    title: '공간계 이펙트', sub: 'Reverb 와 Delay 로 공간감 더하기',
    prereq: ['signal-flow', 'gain-fader'],
    overview: {
      lead: '큰 공간에서 소리는 벽·바닥·천장에 부딪히며 여러 번 반사된 뒤 귀에 도착해요. <b>리버브</b>는 이런 수많은 반사가 겹친 「울림」을, <b>딜레이</b>는 같은 소리가 일정한 시간 뒤 또렷하게 들리는 「반복」을 만들어요. 콘솔에서는 채널 소리의 일부를 <b>FX 버스로 보내(Send)</b> 이펙터를 지난 효과음(Wet)을 <b>다시 섞어(Return)</b> 공간감을 더해요. 공간감은 소리를 풍성하게 하지만, 많을수록 말은 덜 또렷해져요.',
      terms: [
        ['직접음', '음원(입·스피커)에서 귀로 곧바로 오는 첫 소리예요. 소리의 방향과 또렷함을 정해요.'],
        ['초기 반사음', '가까운 벽·바닥·천장에 한두 번 튕겨 직접음 뒤 수십 ms 안에 오는 소리예요. 공간의 크기를 느끼게 해요.'],
        ['잔향 (Reverb tail)', '셀 수 없이 많은 반사가 겹치며 점점 작아지는 울림이에요.'],
        ['RT60 · Decay', '소리를 멈춘 뒤 잔향이 60 dB 작아질 때까지 걸리는 시간이에요. 리버브의 Decay(Reverb Time)가 이 길이를 정해요.'],
        ['Pre-delay', '직접음이 지나간 뒤 잔향이 시작되기까지의 틈(ms)이에요. 적당히 주면 가사가 잔향에 덜 묻혀요.'],
        ['Delay Time · Feedback', '딜레이에서 한 번 반복되기까지의 시간(ms)과, 반복이 몇 번 이어질지를 정하는 양이에요.'],
        ['Wet / Dry', 'Dry 는 효과가 없는 원래 소리, Wet 은 이펙터를 지난 효과음이에요. 둘의 비율이 공간감의 양이에요.'],
        ['FX Send / Return', '채널 소리를 이펙터로 보내는 길(Send)과, 효과음이 콘솔로 돌아와 메인에 섞이는 길(Return)이에요.']
      ],
      points: [
        '소리는 1 m 를 가는 데 약 <b>2.9 ms</b> 걸려요(343 m/s, 20 °C). 반사음이 늦게 올수록 공간이 크게 느껴져요.',
        '<b>설교·광고는 리버브를 짧고 적게</b>, 찬양은 조금 더. 말이 또렷하게 들리는지가 먼저예요.',
        '리버브·딜레이는 보통 <b>POST(페이더 뒤)</b>로 보내요. 페이더를 내리면 효과음도 함께 줄어들어요.'
      ],
      model: 'fxEchogram'
    },
    theory: [
      { title: '반사음과 시간 지연', visual: 'fxReflections',
        body: '소리는 공기 속에서 1초에 약 <b>343 m</b>(20 °C)를 가요. 그래서 <b>1 m 에 약 2.9 ms</b>, 10 m 면 약 29 ms 가 걸려요. 귀에는 ① 음원에서 곧바로 온 <b>직접음</b> ② 바닥·벽·천장에 한두 번 튕겨 조금 늦게 온 <b>초기 반사음</b> ③ 수많은 반사가 겹쳐 점점 작아지는 <b>잔향</b>이 차례로 도착해요. 반사음은 더 먼 길을 돌아오니 늦게 오고, 벽에 일부가 흡수되어 더 작아요.',
        more: '<ul><li><b>지연 시간 = 거리 차이 ÷ 343 m/s</b>. 예: 직접음 경로가 10 m, 천장 반사 경로가 14 m 면 4 m 차이 → 약 11.7 ms 늦게 도착해요.</li><li><b>선행음 효과(하스 효과)</b>: 같은 소리가 약 30 ms 안에 뒤따라 오면 귀는 둘을 하나로 듣고, 먼저 도착한 쪽에서 소리가 난다고 느껴요. 뒤 소리가 조금(약 10 dB 까지) 더 커도 방향은 먼저 온 쪽으로 느껴져요.</li><li>약 50 ms 보다 늦게 오는 큰 반사는 따로 떨어진 <b>메아리(에코)</b>로 들리기 쉬워 말을 흐려요.</li><li>그래서 회중석 중간·뒤를 맡는 <b>딜레이 스피커</b>는 메인 스피커 소리가 도착하는 시간에 맞춰 신호를 늦춰 보내요. 3층 본당 3D 모델에서 메인 스피커와 천장 가운데 스피커(d&amp;b Yi10P)는 앞뒤로 약 14.5 m 떨어져 있어서, 그 뒤쪽 자리에는 메인 소리가 약 42 ms 늦게 도착해요. (교육용 근사 — 실제 설정값은 측정과 시스템 튜닝으로 정해요)</li><li>그림의 공간과 경로는 계산을 보여 주기 위한 <b>예시</b>예요(반사할 때 소리의 30% 가 흡수된다고 가정).</li></ul>',
        check: { q: '스피커에서 17 m 떨어진 자리에는 소리가 약 얼마 뒤에 도착할까요?', options: [
          { t: '약 5 ms', why: '1 m 에 약 2.9 ms 라서 17 m 면 약 50 ms 예요.' },
          { t: '약 50 ms', ok: true, why: '맞아요. 17 × 2.9 ≈ 49.6 ms 예요(17 ÷ 343 초).' },
          { t: '약 500 ms', why: '500 ms 는 약 170 m 떨어졌을 때예요.' }] } },
      { title: '공간이 더하는 잔향 — 예배당도 리버브예요', visual: 'fxRoomDecay',
        body: '예배당은 그 자체로 커다란 리버브 장치예요. 스피커에서 나온 소리도 벽·천장에 반사되어 잔향이 생겨요. 잔향의 길이는 보통 <b>RT60</b>(소리를 멈춘 뒤 60 dB 작아질 때까지의 시간)으로 말해요. 공간이 크고 단단한 면(콘크리트·유리·돌)이 많을수록 길고, 흡음(카펫·의자 쿠션·사람)이 많을수록 짧아요. 이미 울림이 많은 본당에서는 콘솔 리버브를 조금만 넣어도 충분하거나, 거의 넣지 않아도 될 때가 있어요.',
        more: '<ul><li>콘솔에서 넣은 리버브는 공간의 잔향에 <b>더해져요</b>. 공간의 울림을 콘솔에서 빼 줄 수는 없어요.</li><li>사람이 가득 찬 예배 때는 사람과 옷이 소리를 흡수해 빈 본당에서 리허설할 때보다 잔향이 짧아져요. 리허설 때 맞춘 리버브 양이 예배 때는 다르게 들릴 수 있어요.</li><li>잔향이 길면 앞 음절의 울림이 다음 음절을 덮어 말이 뭉개져요. 그래서 말을 전하는 공간은 잔향이 짧을수록 유리해요.</li><li>그림의 RT60 값들은 비교를 위한 <b>예시</b>예요. 우리 본당의 측정값이 아니에요.</li></ul>',
        check: { q: '사람이 가득 찬 예배 때는 빈 본당에서 리허설할 때보다 울림이 어떨까요?', options: [
          { t: '사람과 옷이 소리를 흡수해 잔향이 짧아진다', ok: true, why: '맞아요. 흡음이 늘어 잔향이 짧아져요. 리허설 때 맞춘 효과가 달리 들릴 수 있어요.' },
          { t: '사람이 많으면 잔향이 길어진다', why: '사람은 소리를 흡수해서 잔향을 줄여요.' },
          { t: '아무 차이가 없다', why: '흡음이 늘면 잔향이 달라져요.' }] } },
      { title: 'Reverb 와 Delay 의 차이', visual: 'fxRevVsDelay',
        body: '<b>리버브</b>는 아주 많은 반사가 촘촘히 이어지며 줄어드는 「울림」이에요. 소리를 큰 공간에 둔 것처럼 풍성하게 해요. <b>딜레이</b>는 같은 소리가 정해 둔 시간 뒤에 또렷하게 「반복」되는 효과예요. 리버브는 주로 <b>Decay(잔향 길이)·Pre-delay</b>로, 딜레이는 <b>Delay Time(반복 간격)·Feedback(반복 횟수)</b>으로 조절해요.',
        more: '<ul><li><b>MG12XU 내장 SPX</b>: 24개 프로그램 중 PROGRAM 노브로 골라요. REV HALL 1·2, REV ROOM 1·2, REV STAGE 1·2, REV PLATE 같은 리버브와 SINGLE DLY, DELAY, VOCAL ECHO 같은 딜레이가 있어요. PARAMETER 노브는 리버브에서는 Reverb Time, 딜레이에서는 Delay Time 을 바꿔요. (제조사 자료)</li><li><b>CL5</b>: 내장 이펙트에 REV-X HALL·ROOM·PLATE, REVERB HALL·ROOM·STAGE·PLATE 같은 리버브와 MONO DELAY, STEREO DELAY, ECHO 같은 딜레이가 있어요. (제조사 자료)</li><li>Hall 은 크고 긴 울림, Room 은 작은 방처럼 짧은 울림, Plate 는 금속판 울림을 흉내 낸 밝은 잔향이에요.</li><li>그림은 두 효과의 반사 모양을 비교한 <b>예시</b>예요.</li></ul>',
        check: { q: '같은 소리가 「똑… 똑… 똑…」 또렷하게 반복되어 들려요. 어떤 이펙트일까요?', options: [
          { t: '딜레이', ok: true, why: '맞아요. 정해 둔 시간마다 또렷하게 반복되는 것이 딜레이예요.' },
          { t: '리버브', why: '리버브는 반사가 촘촘히 이어져 하나의 울림으로 들려요.' },
          { t: '컴프레서', why: '컴프레서는 음량 차이를 줄이는 장치예요.' }] } },
      { title: 'Decay 와 Pre-delay', visual: 'fxPredelay',
        body: '<b>Decay</b>(Reverb Time)는 잔향이 얼마나 오래 남는지, <b>Pre-delay</b> 는 직접음이 지나간 뒤 잔향이 시작되기까지의 틈이에요. Pre-delay 를 20–60 ms 쯤 주면 가사의 첫 자음이 잔향에 덮이기 전에 먼저 들려 또렷해지고, 울림은 그 뒤에 풍성하게 따라와요. 너무 길면(약 100 ms 이상) 잔향이 따로 떨어진 메아리처럼 들릴 수 있어요.',
        more: '<ul><li>Decay 가 길수록 풍성하지만 앞 음절의 울림이 다음 음절을 덮어요. 빠른 곡은 짧게, 느린 곡은 조금 길게 두는 것이 보통이에요.</li><li>Pre-delay 는 「첫 반사가 오기까지 걸리는 시간」을 흉내 낸다고 생각해도 좋아요. 40 ms 는 소리가 약 14 m 를 더 돌아오는 시간이에요(40 ÷ 2.9).</li><li>그림의 「자음 구간」은 직접음 뒤 첫 30 ms 를 나타낸 <b>교육용 근사</b>예요.</li></ul>',
        check: { q: '찬양 보컬에 리버브를 넣었더니 가사가 흐려요. 울림은 살리면서 가사를 또렷하게 하려면?', options: [
          { t: 'Pre-delay 를 조금(20–60 ms) 늘린다', ok: true, why: '맞아요. 자음이 잔향보다 먼저 들려 또렷해지고, 울림은 뒤에서 따라와요.' },
          { t: 'Decay 를 두 배로 늘린다', why: '잔향이 더 길어져 가사가 더 흐려져요.' },
          { t: 'Pre-delay 를 0 ms 로 한다', why: '잔향이 직접음과 바로 겹쳐 자음이 더 묻혀요.' }] } },
      { title: '템포에 맞춘 딜레이', visual: 'fxTempo',
        body: '딜레이의 반복이 곡의 박자에 맞으면 리듬 속에 자연스럽게 숨고, 어긋나면 지저분하게 들려요. 한 박(4분음표)의 길이는 <b>60000 ÷ BPM</b> (ms)이에요. 120 BPM 이면 500 ms, 8분음표는 그 절반인 250 ms, 점8분음표는 375 ms 예요. <b>Feedback</b> 은 반복이 몇 번 이어질지 정해요. 많이 올리면 반복이 쌓여 소리가 흐려져요.',
        more: '<ul><li>예: 76 BPM → 60000 ÷ 76 ≈ 789 ms, 100 BPM → 600 ms.</li><li><b>탭 템포</b>: 박에 맞춰 버튼을 몇 번 두드리면 그 간격으로 딜레이 시간을 정해 줘요. CL5 의 이펙트에도 탭 템포 기능이 있어요. (제조사 자료)</li><li><b>MG12XU</b>: 딜레이 프로그램(SINGLE DLY·DELAY·VOCAL ECHO 등)을 고르면 PARAMETER 노브로 Delay Time 을 바꿔요. (제조사 자료)</li><li>설교에는 딜레이를 쓰지 않는 것이 보통이에요. 말이 겹쳐 알아듣기 어려워져요.</li></ul>',
        check: { q: '100 BPM 곡에서 4분음표 딜레이 시간은?', options: [
          { t: '100 ms', why: '60000 ÷ 100 = 600 ms 예요.' },
          { t: '600 ms', ok: true, why: '맞아요. 60000 ÷ 100 = 600 ms 예요.' },
          { t: '1000 ms', why: '1000 ms 는 60 BPM 의 한 박이에요.' }] } },
      { title: 'FX Send/Return 과 명료도', visual: 'fxSendReturn',
        body: '콘솔에서는 채널마다 이펙터를 따로 꽂지 않고, 여러 채널이 <b>Send 노브</b>로 하나의 FX 버스에 소리를 보내요. 이펙터는 효과음(Wet)만 내보내고, 그 소리가 <b>FX Return</b> 으로 돌아와 메인에 섞여요. 원래 소리(Dry)는 채널 페이더로, 효과음 전체 양은 Return 으로 정해요. 리버브는 보통 <b>POST(페이더 뒤)</b>로 보내서 페이더를 내리면 효과음도 함께 줄어요. PRE 로 보내면 페이더를 내려도 효과음만 남는 실수가 생겨요.',
        more: '<ul><li><b>MG12XU</b>: 채널의 AUX2/FX 노브가 AUX2 버스와 내장 이펙트(SPX)에 같은 양을 보내요. 효과음은 FX RTN 페이더로 ST(메인)나 GROUP 1-2 에 섞고, FX RTN 페이더는 AUX 로 보내는 양에는 영향을 주지 않아요. 이펙트 ON 버튼과 풋 스위치(별매 FC5)로 효과를 켜고 끌 수 있어요. (제조사 자료)</li><li>MG12XU 설명서의 빠른 시작: FX RTN 페이더를 「0」에 두고, FX RTN 페이더로 효과의 전체 깊이를 조절해요. (제조사 자료)</li><li>MG12XU 채널의 ON 을 끄면 그 채널 소리는 AUX·GROUP 버스로도 가지 않아요. (제조사 자료)</li><li><b>CL5</b>: 이펙트 랙이 8개 있고, MIX 버스로 보내는 지점을 Pre EQ · Pre Fader · Post On(페이더·ON 뒤) 중에서 고를 수 있어요. (제조사 자료)</li><li><b>공간감과 명료도</b>: 설교·기도·광고는 리버브를 짧고 적게(또는 끄고), 찬양은 조금 더. 리버브는 회중석에서 「있는 듯 없는 듯」할 때가 알맞은 경우가 많아요.</li><li>이펙터를 채널에 직접 꽂는(Insert) 방식이면 이펙터의 Wet/Dry(Mix) 비율로, Send/Return 방식이면 이펙터를 100% Wet 으로 두고 Send·Return 양으로 조절해요.</li></ul>',
        check: { q: '리버브를 PRE 로 보내고 있었는데, 설교자 마이크 페이더를 끝까지 내렸어요. 어떻게 될까요?', options: [
          { t: '리버브 소리만 계속 남아 들린다', ok: true, why: '맞아요. PRE 는 페이더 앞에서 보내서 페이더와 상관없이 효과음이 나가요.' },
          { t: '리버브도 함께 꺼진다', why: '그것은 POST 로 보낼 때예요.' },
          { t: '마이크 소리가 더 커진다', why: '페이더를 내리면 Dry 소리는 줄어요.' }] } }
    ],
    practice: {
      kind: 'fxSpaceSim',
      lead: '실제 찬양 보컬 녹음을 가상 채널에 넣고 리버브(FX1)와 딜레이(FX2)로 보내요. Send·Return·Decay·Pre-delay·Delay Time·Feedback 과 PRE/POST 를 바꾸며 에코그램과 Dry·Wet 미터가 어떻게 바뀌는지 보세요. 「소리 켜기」로 바로 들을 수 있어요.',
      note: '리버브는 지수로 줄어드는 잡음으로 만든 임펄스 응답(교육용 근사)이고, 딜레이는 실제 시간 지연과 피드백으로 처리해요. 에코그램의 레벨, 「자음 가림」 판정, 곡 템포(드럼 녹음을 분석한 약 127 BPM)는 교육용 근사예요. MG12XU SPX·CL5 이펙트의 실제 소리와는 달라요.',
      tasks: [
        { id: 'sermon', title: '설교용: 리버브를 짧고 적게', text: 'Decay 를 1.0 s 이하로 줄이고, 리버브 양(Dry 대비)을 −15 dB 이하로 낮추세요(완전히 끄지는 말고). 딜레이는 꺼 두세요.' },
        { id: 'predelay', title: '찬양 보컬: Pre-delay 로 명료도 살리기', text: 'Decay 1.5 s 이상, 리버브 양 −20 ~ −6 dB 의 풍성한 리버브에서 Pre-delay 를 20–80 ms 로 맞춰 「자음 가림: 적음」을 만드세요.' },
        { id: 'tempo', title: 'BPM 에 맞춘 딜레이 시간', text: '이 곡은 약 127 BPM 이에요. 딜레이 Send·Return 을 올려 반복이 들리게 하고(양 −30 dB 이상), Delay Time 을 4분음표 길이(60000 ÷ BPM)에 ±5 ms 안으로 맞추세요.' },
        { id: 'post', title: 'PRE 와 POST 비교', text: 'PRE 로 바꿔 페이더를 −40 dB 아래로 내리면 리버브만 남는 것을 본 뒤, POST 로 바꿔 페이더와 함께 리버브도 줄어드는 것을 확인하세요.' }
      ],
      links: [
        { title: 'MG12XU 기능부 설명 · AUX2/FX · SPX · FX RTN', text: '채널의 AUX2/FX 노브, SPX 이펙터(PROGRAM·PARAMETER), FX RTN 페이더가 콘솔 어디에 있는지 봐요.', go: { tab: 'tab6', sec: 'fx' } },
        { title: 'MG12XU 실습 · 오디오 테스트', text: '실제 콘솔 화면에서 AUX2/FX 를 올리고 SPX 리버브·딜레이를 바꿔 들어 봐요.', go: { tab: 'tab6', audio: true } }
      ]
    },
    quiz: [
      { q: '설교 순서에 알맞은 리버브 설정은?', options: [
        { t: '짧은 Decay, 적은 양 (또는 끔)', ok: true, why: '맞아요. 말은 또렷함이 먼저라 울림을 짧고 적게 해요.' },
        { t: '긴 Decay, 많은 양', why: '말이 다음 음절의 울림에 덮여 알아듣기 어려워져요.' },
        { t: '템포에 맞춘 딜레이를 크게', why: '말에 딜레이를 걸면 말이 겹쳐 들려요.' }] },
      { q: '무대에서 34 m 떨어진 뒤쪽 벽에 반사되어 무대로 돌아오는 소리(왕복 68 m)는 약 얼마 뒤에 도착할까요?', options: [
        { t: '약 20 ms', why: '1 m 에 약 2.9 ms 라서 68 m 면 약 200 ms 예요.' },
        { t: '약 200 ms', ok: true, why: '맞아요. 68 ÷ 343 ≈ 0.198 s 로, 따로 들리는 메아리가 될 만큼 늦어요.' },
        { t: '약 2 s', why: '2 s 면 약 690 m 를 가야 해요.' }] },
      { q: '84 BPM 곡에서 8분음표 딜레이 시간은 약 얼마일까요?', options: [
        { t: '약 714 ms', why: '그것은 4분음표(60000 ÷ 84)예요. 8분음표는 그 절반이에요.' },
        { t: '약 357 ms', ok: true, why: '맞아요. 60000 ÷ 84 ≈ 714 ms, 그 절반이 약 357 ms 예요.' },
        { t: '약 84 ms', why: 'BPM 숫자를 그대로 ms 로 쓰면 안 돼요.' }] },
      { q: 'Send/Return 방식에서 이펙터(리버브)의 Wet/Dry 는 보통 어떻게 둘까요?', options: [
        { t: '100% Wet — 원래 소리는 채널 페이더로 따로 가니까', ok: true, why: '맞아요. Dry 는 채널에서 이미 메인으로 가고, Return 으로 효과음 양만 더해요.' },
        { t: '100% Dry', why: '그러면 이펙터가 원래 소리만 다시 보내 효과가 없고 소리만 커져요.' },
        { t: '50% / 50%', why: 'Send/Return 에서는 Dry 가 두 번 섞여 소리가 겹치고 커져요.' }] },
      { q: 'MG12XU 에서 내장 이펙트(SPX)로 보내는 양을 정하는 곳은?', options: [
        { t: '채널의 AUX2/FX 노브', ok: true, why: '맞아요. 제조사 설명서: AUX2/FX 노브가 AUX2 버스와 FX 버스로 같은 양을 보내요. 효과음 전체 양은 FX RTN 페이더로 맞춰요.' },
        { t: '채널의 GAIN 노브', why: 'GAIN 은 입력 크기를 맞추는 첫 단계예요.' },
        { t: 'PHONES 노브', why: 'PHONES 는 헤드폰 음량이에요.' }] }
    ],
    missions: [
      { title: '3층 음향 시스템 · 딜레이 스피커', text: '회중석 천장 가운데 스피커(d&b Yi10P)가 어디에 있고 신호가 어디서 오는지 따라가 보세요. 메인 스피커와의 거리로 지연 시간을 어림해 봐요(1 m ≈ 2.9 ms).', go: { tab: 'tab2', trace: 'y10p_C' } },
      { title: 'CL5 콘솔 트레이닝 · 예배 식순', text: '식순에 맞춰 채널을 켜고 끄는 연습이에요. 찬양에서 설교로 넘어갈 때 리버브 양을 어떻게 바꿀지, 채널을 끄면 POST 로 보낸 효과음은 어떻게 되는지 함께 떠올려 보세요.', go: { tab: 'tab5' } }
    ],
    deeper: [
      { title: '딜레이 스피커와 시간 맞추기', text: '메인에서 먼 자리를 돕는 스피커 소리가 메인 소리보다 먼저 도착하면, 소리가 그 스피커 쪽에서 나는 것처럼 들리고 울림이 지저분해져요. 그래서 거리만큼(1 m ≈ 2.9 ms) 신호를 늦추고, 선행음 효과를 생각해 몇 ms 를 더 주기도 해요.', more: '3층 본당의 천장 스피커(Yi10P·Yi7P)와 기둥 스피커(E8)가 이런 딜레이 스피커 역할을 해요. 실제 지연 값은 측정과 시스템 튜닝으로 정해요.' },
      { title: '콤 필터 — 아주 짧은 지연이 만드는 음색 변화', text: '같은 소리가 1–10 ms 정도의 짧은 간격으로 겹치면 특정 주파수들이 서로 상쇄되어 「통 속에서 나는 듯한」 소리가 돼요. 마이크 두 개가 한 사람의 목소리를 함께 받을 때나 가까운 단단한 면의 반사에서도 생겨요.', more: '첫 상쇄 주파수는 1 ÷ (2 × 지연 시간)이에요. 예: 1 ms 지연이면 500 Hz, 1.5 kHz, 2.5 kHz … 에서 소리가 패여요. 마이크 모듈의 3:1 법칙도 이 문제를 줄이려는 것이에요.' },
      { title: '모니터에도 리버브를 보낼까?', text: '무대 모니터에 리버브를 조금 보내면 싱어가 편하게 부르기도 하지만, 울림이 모니터로 나가면 피드백 여유가 줄고 소리가 흐려질 수 있어요. 필요할 때만 조금 쓰고, 설교자 모니터에는 보내지 않는 것이 보통이에요.', more: '' }
    ],
    sources: [
      { t: 'Yamaha MG20XU/MG16XU/MG12XU 사용설명서(제조사) — AUX2/FX·FX RTN·풋 스위치·SPX 24 프로그램 목록', url: MG_OM },
      { t: 'Yamaha MG12XU 기술 사양(제조사) — SPX 24 프로그램, PARAMETER 1, FOOT SW(FX RTN on/off)', url: MG_TS },
      { t: 'Yamaha CL5 레퍼런스 매뉴얼 — Effect Type List(REV-X·REVERB·DELAY 종류, 탭 템포)', url: 'https://manualslib.mx/manual/582/Yamaha-Cl5.html?page=294' },
      { t: 'Yamaha CL5 레퍼런스 매뉴얼 — Mixer Basic Parameters(Mix Send Point: Pre EQ/Pre Fader/Post On, 이펙트 8개)', url: 'https://manualslib.mx/manual/582/Yamaha-Cl5.html?page=334' },
      { t: 'Yamaha CL 시리즈 브로슈어(제조사) — Effect Rack 8', url: 'https://dk.yamaha.com/files/download/brochure/6/329186/CL_brochure_Jan2013_L_en.pdf' },
      { t: 'W3C Web Audio API — ConvolverNode·DelayNode(실습 소리 처리)', url: 'https://www.w3.org/TR/webaudio/#ConvolverNode' }
    ]
  };
})();
