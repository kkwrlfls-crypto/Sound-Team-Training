/* =============================================================================
   학습 모듈: amp (앰프 — 신호를 스피커를 움직일 힘으로 키우는 장비)  2026-10-21
   - 등록: window.STA_MODULES.amp (모양은 modules_data.js 의 mic 과 같음)
   - 그림: STAVisuals.ampChain / ampImpedance / ampPower / ampDb / ampClip / ampConnect
   - 실습: STASims.ampBench (Crown XLi1500 한 채널 + 8Ω 스피커 부하 실험대, 실제 녹음을 Web Audio 로 클리핑)
   - 장비 숫자(제조사 자료):
       Crown XLi1500  — 330 W/8Ω, 450 W/4Ω, 브리지 900 W/8Ω (1 kHz, THD 0.5%), 감도 0.775 V / 1.4 V(8Ω 정격 출력 기준),
                        전압 이득 31 dB, 입력 XLR·RCA, 출력 speakON·바인딩 포스트, 앞면 채널마다 SIGNAL·CLIP·FAULT 표시등,
                        모드 STEREO / PARALLEL / BRIDGE, 단락·무부하·켜고 끌 때 잡음·RF 보호
       EV ZX1         — 8Ω, 200 W 연속 / 400 W 프로그램 / 800 W 피크, speakON NL4
   - 실습의 그 밖의 동작(정격이 없는 16Ω·2Ω, 보호 동작, 음악을 사인파로 환산한 출력)은 교육용 근사.
   ============================================================================= */
(function () {
  'use strict';
  /* ------------------------------------------------------------------ 그림 공통 (modules_visuals.js 와 같은 모양) */
  var C = { ink: '#0f2747', sub: '#5b6b80', line: '#cbd5e1', teal: '#0e7490', cyan: '#22d3ee', blue: '#2563eb', red: '#dc2626', amber: '#f59e0b', green: '#16a34a', bg: '#f8fafc', violet: '#7c3aed' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + s + '</text>'; }
  function box(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 10 : r) + '" fill="' + fill + '" stroke="' + (stroke || 'none') + '" stroke-width="2"/>'; }
  function arrow(x1, y1, x2, y2, col, w) { col = col || C.ink; var a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 9 * Math.cos(a), hy = y2 - 9 * Math.sin(a);
    return '<path d="M' + x1 + ' ' + y1 + 'L' + hx.toFixed(1) + ' ' + hy.toFixed(1) + '" stroke="' + col + '" stroke-width="' + (w || 2.5) + '"/><path d="M' + x2 + ' ' + y2 + 'L' + (hx + 5 * Math.sin(a)).toFixed(1) + ' ' + (hy - 5 * Math.cos(a)).toFixed(1) + 'L' + (hx - 5 * Math.sin(a)).toFixed(1) + ' ' + (hy + 5 * Math.cos(a)).toFixed(1) + 'Z" fill="' + col + '"/>'; }
  function spkIcon(x, y, w, h, label, col) { col = col || C.ink; return box(x, y, w, h, '#fff', col, 5) + '<circle cx="' + (x + 13) + '" cy="' + (y + h / 2) + '" r="' + Math.min(9, h / 2 - 3) + '" fill="none" stroke="' + col + '" stroke-width="1.6"/>' + t(x + w / 2 + 8, y + h / 2 + 4, label, { size: 11, weight: 700, fill: col }); }
  // 병렬 n 줄 × 직렬 m 대 배선도 (앰프 +, − 에서 시작)
  function strings(x0, y0, rows, opt) {
    opt = opt || {}; var gap = opt.gap || 30, sw = opt.sw || 52, sh = opt.sh || 22, n = rows.length, maxM = Math.max.apply(null, rows), col = opt.col || C.ink;
    var xp = x0, xr = x0 + 18 + maxM * (sw + 12) + 10, h = '', ys = rows.map(function (m, i) { return y0 + i * gap; });
    h += '<path d="M' + xp + ' ' + ys[0] + 'V' + ys[n - 1] + '" stroke="' + C.red + '" stroke-width="2.4"/>';
    h += '<path d="M' + xr + ' ' + ys[0] + 'V' + (ys[n - 1] + 14) + 'H' + (xp - 10) + '" stroke="' + C.ink + '" stroke-width="2.4" fill="none"/>';
    rows.forEach(function (m, i) { var y = ys[i], x = xp;
      h += '<path d="M' + xp + ' ' + y + 'H' + (xp + 18) + '" stroke="' + C.red + '" stroke-width="2"/>'; x = xp + 18;
      for (var k = 0; k < m; k++) { h += spkIcon(x, y - sh / 2, sw, sh, '8Ω', col); x += sw; h += '<path d="M' + x + ' ' + y + 'H' + (k < m - 1 ? x + 12 : xr) + '" stroke="' + C.ink + '" stroke-width="2"/>'; x += 12; }
    });
    return { svg: h, right: xr, bottom: ys[n - 1] + 14 };
  }

  var V = window.STAVisuals = window.STAVisuals || {};

  V.ampChain = function () {
    var b = '';
    b += box(16, 30, 150, 70, C.bg, C.line) + t(91, 58, '콘솔', { size: 14, weight: 800 }) + t(91, 78, 'MG12XU', { size: 11, fill: C.sub });
    b += box(224, 30, 160, 70, C.teal, C.teal) + t(304, 58, '파워앰프', { size: 14, weight: 800, fill: '#fff' }) + t(304, 78, 'Crown XLi1500', { size: 11, fill: '#e0f2fe' });
    b += box(440, 30, 146, 70, C.bg, C.line) + t(513, 58, '패시브 스피커', { size: 14, weight: 800 }) + t(513, 78, 'EV ZX1 (8Ω)', { size: 11, fill: C.sub });
    b += arrow(168, 65, 222, 65, C.blue) + t(195, 56, 'XLR', { size: 10, fill: C.blue }) + arrow(386, 65, 438, 65, C.red, 4) + t(412, 56, 'speakON', { size: 10, fill: C.red });
    b += t(91, 120, '라인 레벨 · 약 1 V', { size: 12, fill: C.blue, weight: 700 }) + t(91, 136, '(+4 dBu ≈ 1.23 V)', { size: 10, fill: C.sub });
    b += t(304, 120, '소리의 힘을 크게 키움', { size: 12, fill: C.teal, weight: 700 }) + t(304, 136, '전압 약 35배 = 31 dB (제조사 자료)', { size: 10, fill: C.sub });
    b += t(513, 120, '스피커 레벨 · 수십 V', { size: 12, fill: C.red, weight: 700 }) + t(513, 136, '330 W/8Ω ≈ 51 V (P = V²/R)', { size: 10, fill: C.sub });
    b += '<path d="M16 156 H586" stroke="' + C.line + '" stroke-dasharray="4 4"/>';
    b += box(16, 170, 150, 46, C.bg, C.line) + t(91, 198, '콘솔', { size: 13, weight: 800 });
    b += box(224, 170, 362, 46, '#ecfeff', C.teal) + t(405, 191, '액티브 스피커 EV ZXA1 = 앰프가 안에 있음 (800 W, 제조사 자료)', { size: 12, weight: 800, fill: C.teal }) + t(405, 208, '전원 + 라인 신호만 연결해요', { size: 11, fill: C.sub });
    b += arrow(168, 193, 222, 193, C.blue) + t(195, 186, 'XLR', { size: 10, fill: C.blue });
    b += t(16, 18, '확성 실습 ③ 구성과 액티브 스피커 비교 (전압은 사인파로 계산한 값)', { size: 11, fill: C.sub, anchor: 'start' });
    return svg(600, 226, b, '콘솔에서 파워앰프를 거쳐 패시브 스피커로 가는 신호');
  };

  V.ampImpedance = function () {
    var b = '', cards = [
      { x: 8, rows: [1], name: '1대', z: '8Ω', col: C.ink },
      { x: 156, rows: [1, 1], name: '2대 병렬', z: '8 ÷ 2 = 4Ω', col: C.teal },
      { x: 304, rows: [2], name: '2대 직렬', z: '8 + 8 = 16Ω', col: C.blue },
      { x: 452, rows: [1, 1, 1, 1], name: '4대 병렬', z: '8 ÷ 4 = 2Ω', col: C.red }
    ];
    cards.forEach(function (c) {
      b += box(c.x, 24, 140, 186, C.bg, c.col === C.red ? '#fecaca' : C.line);
      b += t(c.x + 70, 44, c.name, { size: 13, weight: 800, fill: c.col });
      var two = c.rows[0] === 2, s = strings(c.x + (two ? 10 : 14), 66, c.rows, { gap: 24, sw: two ? 40 : 60, sh: 18, col: c.col });
      b += s.svg;
      b += t(c.x + 70, 182, c.z, { size: 14, weight: 800, fill: c.col });
    });
    b += t(522, 202, 'XLi1500 정격 밖', { size: 10.5, fill: C.red, weight: 700 });
    b += t(8, 14, '전기는 + 단자(빨강)에서 스피커를 지나 − 단자(검정)로 돌아와요. 병렬 = R ÷ n, 직렬 = 더하기', { size: 11, fill: C.sub, anchor: 'start' });
    return svg(600, 216, b, '스피커 연결 방법에 따른 합성 임피던스');
  };

  V.ampPower = function () {
    var x0 = 150, sc = 400 / 900, b = '';
    var rows = [['XLi1500 · 8Ω (채널당)', 330, C.teal], ['XLi1500 · 4Ω (채널당)', 450, C.teal], ['XLi1500 · 브리지 8Ω', 900, C.teal], ['ZX1 · 연속 정격', 200, C.amber], ['ZX1 · 프로그램 정격', 400, C.amber], ['ZX1 · 피크 정격', 800, C.amber]];
    rows.forEach(function (r, i) { var y = 34 + i * 28 + (i >= 3 ? 12 : 0);
      b += t(x0 - 8, y + 14, r[0], { size: 11, anchor: 'end' }) + '<rect x="' + x0 + '" y="' + y + '" width="' + (r[1] * sc).toFixed(1) + '" height="18" rx="4" fill="' + r[2] + '" fill-opacity="' + (i === 2 || i === 5 ? 0.55 : 0.9) + '"/>' + t(x0 + r[1] * sc + 6, y + 14, r[1] + ' W', { size: 12, weight: 800, anchor: 'start' }); });
    b += '<path d="M' + x0 + ' 26V218" stroke="' + C.line + '"/>';
    b += t(8, 16, '앰프가 낼 수 있는 힘(청록)과 스피커가 견디는 힘(주황) — 제조사 자료', { size: 11, fill: C.sub, anchor: 'start' });
    b += t(592, 228, 'XLi: 1 kHz · THD 0.5% 조건. 회사마다 측정 조건이 달라요.', { size: 10, fill: C.sub, anchor: 'end' });
    return svg(600, 236, b, 'Crown XLi1500 출력 정격과 EV ZX1 정격 비교');
  };

  V.ampDb = function () {
    var b = '', rowsP = [['×2', '+3 dB'], ['×4', '+6 dB'], ['×10', '+10 dB'], ['×½', '−3 dB']], rowsV = [['×2', '+6 dB'], ['×10', '+20 dB'], ['×½', '−6 dB']];
    b += box(8, 24, 170, 96, C.bg, C.line) + t(93, 42, '전력 (W) · 10 × log', { size: 12, weight: 800, fill: C.teal });
    rowsP.forEach(function (r, i) { b += t(40, 62 + i * 15, r[0], { size: 12, weight: 700 }) + t(120, 62 + i * 15, r[1], { size: 12, fill: C.teal, weight: 700 }); });
    b += box(8, 128, 170, 82, C.bg, C.line) + t(93, 146, '전압 (V) · 20 × log', { size: 12, weight: 800, fill: C.blue });
    rowsV.forEach(function (r, i) { b += t(40, 166 + i * 15, r[0], { size: 12, weight: 700 }) + t(120, 166 + i * 15, r[1], { size: 12, fill: C.blue, weight: 700 }); });
    // 오른쪽: W (직선 눈금) 에 따른 dB (1 W 기준)
    var x0 = 230, x1 = 580, y0 = 44, y1 = 196, fx = function (w) { return x0 + w / 1000 * (x1 - x0); }, fy = function (d) { return y1 - d / 32 * (y1 - y0); };
    var g = [0, 250, 500, 750, 1000].map(function (w) { return '<path d="M' + fx(w) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.line + '"/>' + t(fx(w), y1 + 14, w + ' W', { size: 10, fill: C.sub }); }).join('') +
      [0, 10, 20, 30].map(function (d) { return '<path d="M' + x0 + ' ' + fy(d) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(x0 - 6, fy(d) + 4, d, { size: 10, fill: C.sub, anchor: 'end' }); }).join('');
    var d = ''; for (var w = 1; w <= 1000; w *= 1.06) d += (d ? 'L' : 'M') + fx(w).toFixed(1) + ' ' + fy(10 * Math.log10(w)).toFixed(1);
    d += 'L' + fx(1000).toFixed(1) + ' ' + fy(30).toFixed(1);
    function mark(w, lab, col, pos) { var X = fx(w), Y = fy(10 * Math.log10(w)); return '<circle cx="' + X.toFixed(1) + '" cy="' + Y.toFixed(1) + '" r="4.5" fill="' + col + '"/>' + (pos === 'right' ? t(X + 9, Y + 14, lab, { size: 10, fill: col, weight: 700, anchor: 'start' }) : t(X, Y + (pos === 'up' ? -10 : 18), lab, { size: 10, fill: col, weight: 700 })); }
    b += g + '<path d="' + d + '" fill="none" stroke="' + C.teal + '" stroke-width="3"/>' + mark(100, '100 W · 20 dB', C.sub, 'right') + mark(200, '200 W · 23 dB', C.sub, 'up') + mark(330, '330 W · 25.2', C.teal, 'down') + mark(660, '660 W · 28.2 (+3)', C.red, 'down');
    b += t(x0, 34, 'dB (1 W 기준) — W 를 2배로 늘려도 +3 dB 뿐', { size: 11, fill: C.sub, anchor: 'start' });
    b += t(8, 14, '같은 스피커라면 전압 ×1.41 = 전력 ×2 = +3 dB', { size: 11, fill: C.sub, anchor: 'start' });
    return svg(600, 222, b, '데시벨과 전압·전력의 관계');
  };

  V.ampClip = function () {
    var b = '', x0 = 20, w = 330, ym = 110, A = 70, rail = 48, d1 = '', d2 = '';
    for (var i = 0; i <= 200; i++) { var x = x0 + i / 200 * w, s = Math.sin(i / 200 * Math.PI * 4); d1 += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (ym - s * 40).toFixed(1); d2 += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (ym - Math.max(-rail, Math.min(rail, s * A))).toFixed(1); }
    b += '<path d="M' + x0 + ' ' + (ym - rail) + 'H' + (x0 + w) + 'M' + x0 + ' ' + (ym + rail) + 'H' + (x0 + w) + '" stroke="' + C.red + '" stroke-dasharray="6 4" stroke-width="1.6"/>';
    b += '<path d="M' + x0 + ' ' + ym + 'H' + (x0 + w) + '" stroke="' + C.line + '"/>';
    b += '<path d="' + d1 + '" fill="none" stroke="' + C.green + '" stroke-width="2.4"/><path d="' + d2 + '" fill="none" stroke="' + C.red + '" stroke-width="3"/>';
    b += t(x0 + w, ym - rail - 6, '앰프가 낼 수 있는 최대 전압', { size: 11, fill: C.red, anchor: 'end' });
    b += t(x0 + 4, 196, '초록: 정상 · 빨강: 너무 커서 윗부분이 잘림(클리핑)', { size: 11, fill: C.sub, anchor: 'start' });
    // 앞면 표시등 (XLi1500: 채널마다 SIGNAL·CLIP·FAULT)
    var px = 380; b += box(px, 30, 204, 150, '#1f2328', '#0b0d10');
    b += t(px + 102, 52, 'XLi1500 CH1 표시등', { size: 12, fill: '#e5e7eb', weight: 800 });
    [['SIGNAL', '#22c55e', true, '신호가 들어옴'], ['CLIP', '#ef4444', true, '클리핑 중'], ['FAULT', '#f59e0b', false, '이상·보호 상태']].forEach(function (r, i) { var y = 78 + i * 34;
      b += '<circle cx="' + (px + 22) + '" cy="' + y + '" r="7" fill="' + (r[2] ? r[1] : '#3f3f46') + '"' + (r[2] ? ' stroke="#fff" stroke-opacity=".5"' : '') + '/>' + t(px + 38, y + 4, r[0], { size: 12, fill: '#fff', weight: 800, anchor: 'start' }) + t(px + 196, y + 4, r[3], { size: 11, fill: '#cbd5e1', anchor: 'end' }); });
    b += t(px + 102, 196, '표시등 종류: 제조사 자료 · 색은 그림용', { size: 10, fill: C.sub });
    b += t(20, 18, '클리핑 그림 「예시」', { size: 11, fill: C.sub, anchor: 'start' });
    return svg(600, 206, b, '클리핑된 파형과 앰프 표시등');
  };

  V.ampConnect = function () {
    var b = '', cx = 92, cy = 104;
    b += '<circle cx="' + cx + '" cy="' + cy + '" r="62" fill="' + C.bg + '" stroke="' + C.ink + '" stroke-width="3"/><circle cx="' + cx + '" cy="' + cy + '" r="22" fill="#fff" stroke="' + C.ink + '" stroke-width="2"/>';
    [[-38, -26, '1+', C.red], [38, -26, '1−', C.ink], [-38, 30, '2+', C.amber], [38, 30, '2−', C.sub]].forEach(function (p) { b += '<rect x="' + (cx + p[0] - 9) + '" y="' + (cy + p[1] - 8) + '" width="18" height="16" rx="3" fill="#fff" stroke="' + p[3] + '" stroke-width="2"/>' + t(cx + p[0], cy + p[1] + 5, p[2], { size: 11, weight: 800, fill: p[3] }); });
    b += t(cx, 20, 'speakON (NL4) 핀', { size: 12, weight: 800 });
    b += t(cx, 188, 'CH1 단자: 1± = CH1, 2± = CH2', { size: 11, fill: C.ink, weight: 700 }) + t(cx, 204, 'CH2 단자: 1± = CH2', { size: 11, fill: C.ink, weight: 700 }) + t(cx, 220, '(XLi1500 뒷면 표시 · 핀 모양은 그림용)', { size: 10, fill: C.sub });
    function mode(x, y, title, ins, chs, spk, note) {
      var h = box(x, y, 196, 62, C.bg, C.line, 8) + t(x + 8, y + 16, title, { size: 12, weight: 800, anchor: 'start', fill: C.teal });
      h += ins + chs + spk + t(x + 188, y + 16, note, { size: 10, fill: C.sub, anchor: 'end' }); return h;
    }
    var mx = 200, my = 22;
    b += mode(mx, my, 'STEREO', t(mx + 20, my + 36, 'IN1', { size: 10 }) + t(mx + 20, my + 52, 'IN2', { size: 10 }), arrow(mx + 34, my + 33, mx + 74, my + 33, C.blue, 1.6) + arrow(mx + 34, my + 49, mx + 74, my + 49, C.blue, 1.6) + t(mx + 92, my + 36, 'CH1', { size: 10, weight: 700 }) + t(mx + 92, my + 52, 'CH2', { size: 10, weight: 700 }), arrow(mx + 108, my + 33, mx + 140, my + 33, C.red, 1.6) + arrow(mx + 108, my + 49, mx + 140, my + 49, C.red, 1.6) + t(mx + 166, my + 36, '스피커 A', { size: 10 }) + t(mx + 166, my + 52, '스피커 B', { size: 10 }), '두 채널 따로');
    my = 92;
    b += mode(mx, my, 'PARALLEL', t(mx + 20, my + 44, 'IN1', { size: 10 }), arrow(mx + 34, my + 40, mx + 74, my + 33, C.blue, 1.6) + arrow(mx + 34, my + 40, mx + 74, my + 49, C.blue, 1.6) + t(mx + 92, my + 36, 'CH1', { size: 10, weight: 700 }) + t(mx + 92, my + 52, 'CH2', { size: 10, weight: 700 }), arrow(mx + 108, my + 33, mx + 140, my + 33, C.red, 1.6) + arrow(mx + 108, my + 49, mx + 140, my + 49, C.red, 1.6) + t(mx + 166, my + 36, '스피커 A', { size: 10 }) + t(mx + 166, my + 52, '스피커 B', { size: 10 }), '한 입력을 함께');
    my = 162;
    b += mode(mx, my, 'BRIDGE', t(mx + 20, my + 44, 'IN1', { size: 10 }), arrow(mx + 34, my + 40, mx + 60, my + 40, C.blue, 1.6) + t(mx + 90, my + 44, 'CH1+CH2', { size: 10, weight: 700 }), arrow(mx + 120, my + 40, mx + 140, my + 40, C.red, 2.6) + t(mx + 166, my + 36, '스피커 1대', { size: 10 }) + t(mx + 166, my + 52, '900 W/8Ω', { size: 10, fill: C.teal, weight: 700 }), '둘을 묶어 하나로');
    b += box(410, 22, 182, 202, '#fff7ed', '#fdba74', 10) + t(501, 44, '⚠ 연결 안전', { size: 13, weight: 800, fill: '#c2410c' });
    ['앰프 출력(speakON)은', '스피커에만 연결해요.', '콘솔·액티브 스피커의', '입력에 넣으면 안 돼요.', '', '케이블은 앰프를 끄거나', 'LEVEL 을 내린 뒤 꽂고,', '꽂은 뒤 돌려서 잠가요.'].forEach(function (s, i) { b += t(501, 68 + i * 19, s, { size: 11, fill: C.ink }); });
    return svg(600, 232, b, 'speakON 핀, 앰프 동작 모드, 연결 안전');
  };

  /* ------------------------------------------------------------------ 「그림으로 보기」 (2026-11-04)
     - 비유 · 단계 · 전/후 비교 그림. viewBox 400 안팎, 글자 13 이상
     - class 는 mod-pic-svg (최소 폭 = viewBox 의 83% — 휴대폰에서도 글자 13 이 11px 이상으로 보이게, 넘치면 상자 안에서 옆으로 밀어 봐요) */
  function psvg(w, h, body, label) { return '<div style="contain:inline-size;overflow-x:auto"><svg class="mod-pic-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif" style="display:block;width:100%;max-width:' + w + 'px;min-width:' + Math.round(w * 0.83) + 'px;height:auto;margin:0 auto">' + body + '</svg></div>'; }
  // ○/× 처럼 두 칸으로 나뉜 그림: 칸마다 따로 그려 좁은 화면에서는 위아래로 쌓아요(글자 크기 그대로)
  function psvgPair(w, h, a, b, label) { function one(body, lab) { return '<svg class="mod-pic-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + lab + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif" style="display:block;flex:1 1 ' + Math.round(w * 0.85) + 'px;max-width:' + w + 'px;min-width:' + Math.round(w * 0.85) + 'px;height:auto">' + body + '</svg>'; }
    return '<div role="group" aria-label="' + label + '" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">' + one(a, label + ' (1)') + one(b, label + ' (2)') + '</div>'; }
  function wv(x, y, w, f, n) { var d = ''; n = n || 120; for (var i = 0; i <= n; i++) { var u = i / n; d += (i ? 'L' : 'M') + (x + u * w).toFixed(1) + ' ' + (y - f(u)).toFixed(1); } return d; }
  function num(x, y, n, col) { return '<circle cx="' + x + '" cy="' + y + '" r="11" fill="' + col + '"/>' + t(x, y + 5, n, { size: 13, weight: 800, fill: '#fff' }); }
  function mini(x, y, w, h, label, col, fill) { return box(x, y, w, h, fill || '#fff', col || C.ink, 6) + '<circle cx="' + (x + 14) + '" cy="' + (y + h / 2) + '" r="' + Math.min(9, h / 2 - 4) + '" fill="none" stroke="' + (col || C.ink) + '" stroke-width="2"/>' + t(x + w / 2 + 9, y + h / 2 + 5, label, { size: 13, weight: 800, fill: col || C.ink }); }

  // 용어 임피던스 — 좁은 호스 · 넓은 호스
  V.ampHoseMini = function () {
    var b = box(6, 14, 60, 104, C.teal, null, 10) + t(36, 62, '앰프', { size: 14, weight: 800, fill: '#fff' }) + t(36, 82, '(펌프)', { size: 13, fill: '#e0f2fe' });
    b += '<path d="M66 40 H186" stroke="' + C.cyan + '" stroke-width="6"/>' + arrow(186, 40, 202, 40, C.blue, 2) + t(126, 28, '좁은 호스', { size: 13, fill: C.sub }) + t(208, 36, '높은 Ω', { size: 13, weight: 800, anchor: 'start' }) + t(208, 54, '전류 적게', { size: 13, fill: C.sub, anchor: 'start' });
    b += '<path d="M66 94 H186" stroke="' + C.cyan + '" stroke-width="24"/>' + arrow(186, 94, 202, 94, C.red, 3) + t(126, 74, '넓은 호스', { size: 13, fill: C.sub }) + t(208, 90, '낮은 Ω', { size: 13, weight: 800, anchor: 'start', fill: C.red }) + t(208, 108, '전류 많이', { size: 13, fill: C.sub, anchor: 'start' });
    return psvg(300, 128, b, '임피던스를 호스 굵기로 비유한 그림');
  };


  // 용어 클리핑 — 천장에 머리가 닿아 잘려요
  V.ampClipMini = function () {
    var b = '<path d="M6 26H294M6 106H294" stroke="' + C.red + '" stroke-width="2" stroke-dasharray="6 4"/>' + t(294, 18, '앰프가 낼 수 있는 끝', { size: 13, fill: C.red, anchor: 'end' });
    b += '<path d="' + wv(8, 66, 120, function (u) { return 30 * Math.sin(u * Math.PI * 4); }) + '" fill="none" stroke="' + C.green + '" stroke-width="3"/>' + t(68, 124, '알맞음', { size: 13, weight: 800, fill: C.green });
    b += '<path d="' + wv(168, 66, 120, function (u) { return Math.max(-40, Math.min(40, 64 * Math.sin(u * Math.PI * 4))); }) + '" fill="none" stroke="' + C.red + '" stroke-width="3"/>' + t(228, 124, '너무 큼 → 잘림', { size: 13, weight: 800, fill: C.red });
    return psvg(300, 130, b, '앰프가 낼 수 있는 끝을 넘으면 파형 윗부분이 잘려요');
  };


  // 용어 데시벨 — W 가 2배일 때마다 한 계단(+3 dB)
  V.ampDbStairs = function () {
    var b = t(6, 18, 'W 가 2배 될 때마다 한 계단 (+3 dB)', { size: 13, weight: 800, anchor: 'start', fill: C.teal });
    [[1, 0], [2, 3], [4, 6], [8, 9], [16, 12]].forEach(function (r, i) { var x = 6 + i * 58, top = 128 - i * 20;
      b += '<rect x="' + x + '" y="' + top + '" width="54" height="' + (166 - top) + '" rx="4" fill="' + C.teal + '" fill-opacity="' + (0.35 + i * 0.15) + '"/>' + t(x + 27, top + 24, r[0] + ' W', { size: 13, weight: 800, fill: i ? '#fff' : C.ink }) + t(x + 27, top - 8, (r[1] ? '+' : '') + r[1] + ' dB', { size: 13, weight: 800, fill: C.ink }); });
    return psvg(300, 168, b, '전력이 2배가 될 때마다 3 dB 씩 올라가는 계단');
  };


  // 이론 2 — 병렬과 직렬
  V.ampSeriesParallel = function () {
    function panel(x, title, z, sub, col, par) {
      var h = box(x, 4, 194, 200, C.bg, C.line, 10) + t(x + 97, 26, title, { size: 14, weight: 800, fill: col });
      h += box(x + 8, 50, 36, 80, C.ink, null, 6) + t(x + 26, 86, '앰', { size: 13, weight: 800, fill: '#fff' }) + t(x + 26, 104, '프', { size: 13, weight: 800, fill: '#fff' }) + t(x + 50, 58, '+', { size: 14, weight: 800, fill: C.red }) + t(x + 50, 134, '−', { size: 14, weight: 800 });
      var plus = '<path d="' + (par ? 'M' + (x + 44) + ' 64 H' + (x + 58) + ' M' + (x + 58) + ' 51 V113 M' + (x + 58) + ' 51 H' + (x + 70) + ' M' + (x + 58) + ' 113 H' + (x + 70) : 'M' + (x + 44) + ' 64 H' + (x + 58) + ' V51 H' + (x + 70)) + '" fill="none" stroke="' + C.red + '" stroke-width="2.5"/>';
      var minus = '<path d="' + (par ? 'M' + (x + 154) + ' 51 H' + (x + 172) + ' V146 H' + (x + 26) + ' V130 M' + (x + 154) + ' 113 H' + (x + 172) : 'M' + (x + 154) + ' 51 H' + (x + 172) + ' V113 H' + (x + 154) + ' M' + (x + 70) + ' 113 H' + (x + 58) + ' V146 H' + (x + 26) + ' V130') + '" fill="none" stroke="' + C.ink + '" stroke-width="2.5"/>';
      h += plus + minus + mini(x + 70, 38, 84, 26, '8Ω', col) + mini(x + 70, 100, 84, 26, '8Ω', col) + t(x + 112, 88, par ? '길이 2개' : '한 줄로', { size: 13, fill: col, weight: 700 });
      return h + t(x + 97, 172, z, { size: 15, weight: 800, fill: col }) + t(x + 97, 194, sub, { size: 13, fill: C.sub });
    }
    return psvgPair(200, 208, panel(4, '병렬 (나란히)', '8Ω 2대 → 4Ω', '물길이 넓어져 잘 흘러요', C.teal, true), panel(4, '직렬 (한 줄로)', '8Ω + 8Ω → 16Ω', '길이 길어져 더 막혀요', C.blue, false), '스피커를 병렬로 이으면 임피던스가 낮아지고, 직렬로 이으면 높아져요');
  };

  // 이론 2 — 테스터로 재면 적힌 값보다 조금 낮아요
  V.ampMeterCheck = function () {
    var b = box(6, 16, 100, 150, '#facc15', '#a16207', 14) + box(16, 28, 80, 44, '#e5e7eb', '#475569', 6) + t(56, 58, '6.6 Ω', { size: 18, weight: 800 }) + '<circle cx="56" cy="112" r="22" fill="#1f2937"/>' + t(56, 117, 'Ω', { size: 14, weight: 800, fill: '#fff' }) + t(56, 156, '테스터', { size: 13, weight: 800 });
    b += '<path d="M36 166 C48 200 140 196 170 132" fill="none" stroke="' + C.red + '" stroke-width="3"/><path d="M76 166 C88 190 150 184 170 150" fill="none" stroke="' + C.ink + '" stroke-width="3"/>';
    b += box(170, 50, 62, 120, '#fff', C.ink, 8) + '<circle cx="201" cy="96" r="20" fill="none" stroke="' + C.ink + '" stroke-width="2.5"/>' + t(201, 152, '8Ω', { size: 14, weight: 800 }) + t(201, 40, '스피커', { size: 13, weight: 800 });
    b += t(244, 74, '적힌 값', { size: 13, anchor: 'start', fill: C.sub }) + t(244, 92, '8Ω', { size: 14, anchor: 'start', weight: 800 }) + t(244, 120, '테스터', { size: 13, anchor: 'start', fill: C.sub }) + t(244, 138, '6~7 Ω', { size: 14, anchor: 'start', weight: 800, fill: C.teal }) + t(244, 160, '→ 정상이에요', { size: 13, anchor: 'start', fill: C.teal, weight: 700 });
    b += t(170, 200, '앰프에서 케이블을 뺀 뒤에 재요', { size: 13, fill: C.sub });
    return psvg(340, 208, b, '테스터로 잰 스피커 저항은 적힌 공칭 임피던스보다 조금 낮게 나와요');
  };


  // 이론 3 — 댐핑: 신호가 멈추면 콘도 멈추게 하는 브레이크
  V.ampDamping = function () {
    function row(y, title, sub, ring, col) {
      var h = t(8, y, title, { size: 13, weight: 800, anchor: 'start', fill: col }) + t(332, y, sub, { size: 13, anchor: 'end', fill: C.sub }) + '<path d="M12 ' + (y + 44) + 'H332" stroke="' + C.line + '"/>';
      h += '<path d="' + wv(12, y + 44, 320, function (u) { var x = u * 320; if (x < 160) return 26 * Math.sin(x / 160 * Math.PI * 4); var k = (x - 160); return ring ? 20 * Math.exp(-k / 46) * Math.sin(k / 20 * Math.PI * 2) : 0; }, 240) + '" fill="none" stroke="' + col + '" stroke-width="3"/>';
      return h + '<path d="M172 ' + (y + 10) + 'V' + (y + 78) + '" stroke="' + C.sub + '" stroke-dasharray="4 3"/>';
    }
    var b = row(18, '댐핑이 클 때', '바로 멈춰요', false, C.teal) + row(116, '댐핑이 작을 때', '더 흔들려요 → 「웅웅」', true, C.red);
    b += t(178, 208, '↑ 신호가 멈춘 때', { size: 13, fill: C.sub, anchor: 'start' });
    return psvg(340, 214, b, '댐핑이 크면 신호가 멈출 때 스피커 콘도 바로 멈춰요');
  };


  // 이론 5 — 켜고 끄는 순서
  V.ampPowerOrder = function () {
    function row(y, title, items, col) {
      var h = t(6, y + 30, title, { size: 14, weight: 800, anchor: 'start', fill: col });
      items.forEach(function (it, i) { var x = 58 + i * 94, amp = /앰프/.test(it[0]); h += box(x, y, 86, 50, amp ? C.teal : '#fff', amp ? C.teal : C.line, 8) + '<circle cx="' + (x + 12) + '" cy="' + (y + 12) + '" r="9" fill="' + (amp ? C.ink : col) + '"/>' + t(x + 12, y + 17, String(i + 1), { size: 13, weight: 800, fill: '#fff' }) + t(x + 52, y + (it[1] ? 24 : 31), it[0], { size: 13, weight: 800, fill: amp ? '#fff' : C.ink }) + (it[1] ? t(x + 52, y + 42, it[1], { size: 13, fill: amp ? '#e0f2fe' : C.sub }) : ''); if (i < 2) h += arrow(x + 86, y + 25, x + 94, y + 25, C.ink, 2); });
      return h;
    }
    var b = row(10, '켤 때', [['음원·악기', ''], ['콘솔', ''], ['앰프', '마지막']], C.green) + row(78, '끌 때', [['앰프', '먼저'], ['콘솔', ''], ['음원·악기', '']], C.red);
    b += t(170, 160, '앰프가 켜진 동안 앞 장비를 켜고 끄면', { size: 13, fill: C.sub }) + t(170, 178, '「퍽」 소리가 스피커로 나가요', { size: 13, fill: C.sub });
    return psvg(340, 186, b, '확성 장비를 켜고 끄는 순서');
  };


  // 심화 — Class A · B · AB 를 일꾼으로
  V.ampClassAB = function () {
    function col(x, title, f, top, bot, l1, l2, mark) {
      var h = box(x, 4, 108, 198, C.bg, C.line, 10) + t(x + 54, 26, title, { size: 15, weight: 800 });
      h += '<path d="M' + (x + 8) + ' 96H' + (x + 100) + '" stroke="' + C.line + '"/>';
      h += '<path d="' + wv(x + 8, 96, 46, function (u) { return f(u * 0.5); }, 80) + '" fill="none" stroke="' + top + '" stroke-width="3"/>';
      h += '<path d="' + wv(x + 54, 96, 46, function (u) { return f(0.5 + u * 0.5); }, 80) + '" fill="none" stroke="' + bot + '" stroke-width="3"/>';
      if (mark) h += '<circle cx="' + (x + 54) + '" cy="96" r="12" fill="none" stroke="' + C.red + '" stroke-width="2"/>';
      return h + t(x + 54, 166, l1, { size: 13, weight: 800 }) + t(x + 54, 186, l2, { size: 13, fill: C.sub });
    }
    function sine(u) { return 40 * Math.sin(u * Math.PI * 2); }
    function cross(u) { var v = Math.sin(u * Math.PI * 2), a = Math.abs(v); return a < 0.22 ? 0 : 40 * Math.sign(v) * (a - 0.22) / 0.78; }
    var b = col(4, 'Class A', sine, C.violet, C.violet, '한 일꾼이 전부', '늘 뜨거워요', false) + col(116, 'Class B', cross, C.teal, C.amber, '위·아래 반씩', '이음매 찌그러짐', true) + col(228, 'Class AB', sine, C.teal, C.amber, '반씩 + 살짝 겹침', '공연용에 많이', false);
    b += t(170, 222, '색 = 그 부분을 맡은 증폭 부품(일꾼)', { size: 13, fill: C.sub });
    return psvg(340, 230, b, 'Class A, B, AB 증폭 방식을 일꾼 비유로 비교');
  };


  // 확인 문제 1 — 8Ω 2대 병렬
  V.ampQuizParallel = function () {
    var b = box(6, 22, 64, 92, C.ink, null, 8) + t(38, 62, '앰프', { size: 13, weight: 800, fill: '#fff' }) + t(38, 80, 'CH1', { size: 13, fill: '#cbd5e1' });
    b += '<path d="M70 44 H96 M96 30 V96 M96 30 H114 M96 96 H114" fill="none" stroke="' + C.red + '" stroke-width="2.5"/>' + t(82, 38, '+', { size: 15, weight: 800, fill: C.red });
    b += mini(114, 16, 90, 28, '8Ω', C.ink) + mini(114, 82, 90, 28, '8Ω', C.ink);
    b += '<path d="M204 30 H222 V96 H204 M222 96 V122 H84 V96 H70" fill="none" stroke="' + C.ink + '" stroke-width="2.5"/>' + t(78, 90, '−', { size: 15, weight: 800 });
    b += t(284, 66, '전체', { size: 13, fill: C.sub }) + t(284, 92, '? Ω', { size: 22, weight: 800, fill: C.teal });
    return psvg(340, 130, b, '8Ω 스피커 2대를 앰프 한 채널에 병렬로 연결한 모습');
  };


  /* ------------------------------------------------------------------ 실습: 앰프 + 스피커 부하 실험대 */
  var XLI = { v8: Math.sqrt(330 * 8), v4: Math.sqrt(450 * 4), vb8: Math.sqrt(900 * 8) };   // 정격(제조사 자료)에서 계산한 최대 출력 전압(사인파 실효값)
  var WIRES = {
    '1': { name: '1대', desc: '8Ω 스피커 1대', rows: [1] },
    '2p': { name: '2대 병렬', desc: '8Ω 2대를 병렬로', rows: [1, 1] },
    '2s': { name: '2대 직렬', desc: '8Ω 2대를 직렬로', rows: [2] },
    '3p': { name: '3대 병렬', desc: '8Ω 3대를 병렬로', rows: [1, 1, 1] },
    '4p': { name: '4대 병렬', desc: '8Ω 4대를 모두 병렬로', rows: [1, 1, 1, 1] },
    '4sp': { name: '4대 직렬-병렬', desc: '2대 직렬 줄 2개를 병렬로', rows: [2, 2] }
  };
  Object.keys(WIRES).forEach(function (k) { var w = WIRES[k], m = w.rows[0]; w.n = w.rows.reduce(function (a, b) { return a + b; }, 0); w.series = m; w.z = 8 * m / w.rows.length; });
  var ZX1_PROG = 400;   // EV ZX1 프로그램 정격(제조사 자료)

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function db20(x) { return 20 * Math.log10(Math.max(x, 1e-9)); }
  function fx(v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }
  function zTxt(z) { return Math.abs(z - Math.round(z)) < 0.01 ? String(Math.round(z)) : z.toFixed(2); }

  var audioCache = {};
  function b64ToBuf(uri) { var b = atob(uri.slice(uri.indexOf(',') + 1)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  function loadStem(key, cb) {
    if (audioCache[key]) { cb(audioCache[key]); return; }
    var uri = window.MG12XU_SOURCE_AUDIO_BASE64 && window.MG12XU_SOURCE_AUDIO_BASE64[key], OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, fired = false;
    function synth() { if (fired) return; fired = true; var blk = 0.05, env = []; for (var i = 0; i < 400; i++) { var tt = i * blk, ph = (tt % 4) / 4; env.push(ph < 0.85 ? 0.3 + 0.7 * Math.pow(Math.sin(Math.PI * ph / 0.85), 2) : 0.02); } cb({ env: env, blk: blk, dur: 400 * blk, buffer: null, max: 1, synthetic: true }); }
    if (!uri || !OAC) { synth(); return; }
    try {
      var oc = new OAC(1, 2, 44100), pr = oc.decodeAudioData(b64ToBuf(uri), function (buf) { done(buf); }, function () { synth(); });
      if (pr && pr.catch) pr.catch(function () { /* 콜백에서 처리 */ });
    } catch (e) { synth(); }
    function done(buf) {
      if (fired) return; fired = true;
      var blk = 0.05, n = Math.floor(buf.duration / blk), sr = buf.sampleRate, ch = [], i, k, max = 0, env = [];
      for (k = 0; k < buf.numberOfChannels; k++) ch.push(buf.getChannelData(k));
      for (i = 0; i < n; i++) { var p = 0, s0 = Math.floor(i * blk * sr), s1 = Math.min(ch[0].length, Math.floor((i + 1) * blk * sr)); for (k = 0; k < ch.length; k++) for (var j = s0; j < s1; j += 2) { var v = Math.abs(ch[k][j]); if (v > p) p = v; } env.push(p); if (p > max) max = p; }
      env = env.map(function (v) { return v / (max || 1); });
      audioCache[key] = { env: env, blk: blk, dur: n * blk, buffer: buf, max: max || 1, synthetic: false }; cb(audioCache[key]);
    }
  }

  function injectCss() {
    if (document.getElementById('sta-mod-amp-css')) return;
    var s = document.createElement('style'); s.id = 'sta-mod-amp-css';
    s.textContent = [
      '.sim-amp{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:12px;align-items:start}',
      '.sim-amp-main{display:flex;flex-direction:column;gap:10px;min-width:0}',
      '.sim-amp-front{display:grid;grid-template-columns:auto 1fr auto auto;gap:14px;align-items:center;padding:14px 16px;border-radius:12px;background:linear-gradient(180deg,#2b3038,#1a1e24);border:1px solid #0b0d10;color:#e5e7eb}',
      '.sim-amp-brand b{display:block;font-size:1.2rem;font-weight:900;letter-spacing:.02em;color:#fff}.sim-amp-brand span{font-size:.78rem;font-style:italic;color:#cbd5e1}',
      '.sim-amp-lvl{display:flex;align-items:center;gap:10px;min-width:0}.sim-amp-lvl label{display:grid;gap:4px;font-size:.72rem;font-weight:800;color:#cbd5e1;flex:1;min-width:0}',
      '.sim-amp-lvl input{width:100%;accent-color:#f59e0b}.sim-amp-lvl output{font-size:.78rem;color:#fde68a;font-variant-numeric:tabular-nums}',
      '.sim-amp-knob{width:52px;height:52px;border-radius:50%;flex:none;background:radial-gradient(circle at 40% 35%,#f3f4f6,#9ca3af 60%,#4b5563);box-shadow:0 2px 6px rgba(0,0,0,.5);position:relative}',
      '.sim-amp-knob i{position:absolute;left:50%;top:5px;width:4px;height:19px;margin-left:-2px;background:#111827;border-radius:2px;transform-origin:50% 21px}',
      '.sim-amp-leds{display:grid;grid-template-columns:auto auto;gap:5px 8px;font-size:.66rem;font-weight:800;color:#cbd5e1;align-items:center}',
      '.sim-amp-leds .h{grid-column:1/3;font-size:.64rem;color:#94a3b8}',
      '.sim-amp-led{width:12px;height:12px;border-radius:50%;background:#3f3f46;border:1px solid #18181b}',
      '.sim-amp-led.sig.on{background:#22c55e;box-shadow:0 0 8px #22c55e}.sim-amp-led.clip.on{background:#ef4444;box-shadow:0 0 10px #ef4444}.sim-amp-led.fault.on{background:#f59e0b;box-shadow:0 0 10px #f59e0b}.sim-amp-led.pwr{background:#60a5fa;box-shadow:0 0 8px #60a5fa}',
      '.sim-amp-rear{display:flex;flex-wrap:wrap;gap:8px 16px;padding:10px 12px;border-radius:10px;background:#e5e7eb;border:1px solid #cbd5e1;font-size:.78rem}',
      '.sim-amp-rear fieldset{border:0;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center}.sim-amp-rear legend{font-weight:800;color:#334155;margin-right:4px;float:left;padding:0}',
      '.sim-amp-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:999px;border:1px solid #94a3b8;background:#fff;cursor:pointer;font-weight:700;font-size:.78rem;color:#0f2747;position:relative}',
      '.sim-amp-chip:has(input:checked){background:#0f2747;color:#fff;border-color:#0f2747}.sim-amp-chip input{position:absolute;opacity:0;pointer-events:none}',
      '.sim-amp-chip:has(input:focus-visible){outline:2px solid #22d3ee;outline-offset:2px}',
      '.sim-amp-wire svg{display:block;width:100%;height:auto}',
      '.sim-amp-wires{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}',
      '.sim-amp-wires .sim-amp-chip{justify-content:center;border-radius:8px;font-size:.76rem;padding:6px 4px;text-align:center}',
      '.sim-amp-calc{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;font-size:.8rem}.sim-amp-calc input{width:74px;padding:5px 6px;border:1px solid #cbd5e1;border-radius:6px;font:inherit}',
      '.sim-amp-calc .ok{color:#047857;font-weight:800}.sim-amp-calc .no{color:#c2410c;font-weight:700}',
      '.sim-amp-wave{display:block;width:100%;height:130px;border-radius:8px;background:#0b1220}',
      '.sim-amp-warn{margin-top:8px;padding:8px 10px;border-radius:8px;font-size:.78rem;line-height:1.5;background:#fff4ed;border:1px solid #fb923c;color:#9a3412}',
      '.sim-amp-ref{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
      '.sim-amp .sim-range output{font-variant-numeric:tabular-nums;font-weight:800}',
      '@media (max-width:860px){.sim-amp{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:520px){.sim-amp-front{grid-template-columns:1fr auto auto;gap:10px 12px}.sim-amp-lvl{grid-column:1/4;order:3}.sim-amp-wires{grid-template-columns:repeat(2,minmax(0,1fr))}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function wireSvg(key, shown, unsafe) {
    var w = WIRES[key], s = strings(150, 34, w.rows, { gap: 32, sw: 64, sh: 24, col: unsafe ? C.red : C.ink });
    var h = box(10, 18, 96, 34 + (w.rows.length - 1) * 32 + 16, '#1f2328', '#0b0d10', 8) + t(58, 40, 'XLi1500', { size: 11, fill: '#fff', weight: 800 }) + t(58, 56, 'CH1', { size: 11, fill: '#cbd5e1' });
    h += '<path d="M106 34H150" stroke="' + C.red + '" stroke-width="2.4"/>' + t(122, 28, '+', { size: 13, fill: C.red, weight: 800 });
    var yb = s.bottom; h += '<path d="M106 ' + yb + 'H140" stroke="' + C.ink + '" stroke-width="2.4"/>' + t(122, yb - 6, '−', { size: 13, weight: 800 });
    h += s.svg;
    var VW = s.right + 150;
    h += t(VW - 8, 22, w.desc, { size: 11, fill: C.sub, anchor: 'end' });
    h += t(VW - 8, yb + 2, shown ? '전체 ' + zTxt(w.z) + ' Ω' : '전체 ? Ω', { size: 14, weight: 800, anchor: 'end', fill: unsafe && shown ? C.red : C.teal });
    return '<svg style="max-width:' + VW + 'px" viewBox="0 0 ' + VW + ' ' + Math.max(yb + 14, 34 + (w.rows.length - 1) * 32 + 40) + '" role="img" aria-label="앰프 CH1 과 스피커 연결: ' + esc(w.desc) + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + h + '</svg>';
  }

  function ampBench(el, opts) {
    opts = opts || {}; injectCss();
    var S = { wiring: '1', mode: 'stereo', sens: 1.4, inDbu: 0, att: -10, src: 'keysLR', calc: '', revealed: {}, ref: null, sawUnsafe: false, done: {}, mcSince: 0, audio: false, t0: performance.now() };
    el.innerHTML =
      '<div class="sim-amp">' +
        '<div class="sim-amp-main">' +
          '<div class="sim-box"><h4>콘솔 출력</h4><label class="sim-range"><span>콘솔 → 앰프 입력 (가장 큰 순간) <output data-out="in"></output></span><input type="range" min="-20" max="20" step="0.5" data-sim="in" aria-label="콘솔 출력 레벨"></label></div>' +
          '<div class="sim-amp-front" aria-label="Crown XLi1500 앞면 (가상)">' +
            '<div class="sim-amp-brand"><b>crown</b><span>XLi1500 (가상)</span></div>' +
            '<div class="sim-amp-lvl"><div class="sim-amp-knob" data-role="knob"><i></i></div><label>CH1 LEVEL (들어온 신호 줄이기)<input type="range" min="-40" max="0" step="0.5" data-sim="att" aria-label="CH1 LEVEL"><output data-out="att"></output></label></div>' +
            '<div class="sim-amp-leds"><span class="h">CH1</span><i class="sim-amp-led sig" data-led="sig1"></i><span>SIGNAL</span><i class="sim-amp-led clip" data-led="clip1"></i><span>CLIP</span><i class="sim-amp-led fault" data-led="fault1"></i><span>FAULT</span></div>' +
            '<div class="sim-amp-leds"><span class="h">CH2</span><i class="sim-amp-led sig" data-led="sig2"></i><span>SIGNAL</span><i class="sim-amp-led clip" data-led="clip2"></i><span>CLIP</span><i class="sim-amp-led fault" data-led="fault2"></i><span>FAULT</span><i class="sim-amp-led pwr"></i><span>POWER</span></div>' +
          '</div>' +
          '<div class="sim-amp-rear" aria-label="뒷면 스위치 (가상)">' +
            '<fieldset><legend>MODE</legend>' + [['stereo', 'STEREO'], ['parallel', 'PARALLEL'], ['bridge', 'BRIDGE']].map(function (m) { return '<label class="sim-amp-chip"><input type="radio" name="simAmpMode" value="' + m[0] + '"' + (m[0] === S.mode ? ' checked' : '') + '>' + m[1] + '</label>'; }).join('') + '</fieldset>' +
            '<fieldset><legend>SENSITIVITY</legend>' + [['0.775', '0.775 V'], ['1.4', '1.4 V']].map(function (m) { return '<label class="sim-amp-chip"><input type="radio" name="simAmpSens" value="' + m[0] + '"' + (+m[0] === S.sens ? ' checked' : '') + '>' + m[1] + '</label>'; }).join('') + '</fieldset>' +
          '</div>' +
          '<div class="sim-box"><h4>스피커 연결 <small>앰프 CH1 → 8Ω 스피커</small></h4><div class="sim-amp-wire" data-role="wire"></div>' +
            '<div class="sim-amp-calc"><label for="simAmpCalc">내 계산: 합친 임피던스</label><input id="simAmpCalc" type="number" inputmode="decimal" step="0.01" min="0" data-sim="calc" placeholder="?"><span>Ω</span><button type="button" class="sim-btn" data-sim="reveal">정답 보기</button><span data-role="calcfb"></span></div>' +
            '<div data-role="warn"></div></div>' +
          '<div class="sim-box"><h4>출력 파형 <small>공부용: 가장 큰 순간을 사인파로 그림</small></h4><canvas class="sim-amp-wave" data-role="wave" aria-label="앰프 출력 파형과 최대 전압 선"></canvas></div>' +
        '</div>' +
        '<div class="sim-side">' +
          '<div class="sim-box"><h4>연결 고르기</h4><div class="sim-amp-wires">' + Object.keys(WIRES).map(function (k) { return '<label class="sim-amp-chip"><input type="radio" name="simAmpWire" value="' + k + '"' + (k === S.wiring ? ' checked' : '') + '>' + WIRES[k].name + '</label>'; }).join('') + '</div></div>' +
          '<div class="sim-box"><h4>소리</h4><button type="button" class="sim-btn sim-play" data-sim="play">🔊 소리 켜기</button>' +
            '<div class="sim-btns">' + [['keysLR', '키보드'], ['leadVox', '보컬']].map(function (m) { return '<label class="sim-amp-chip"><input type="radio" name="simAmpSrc" value="' + m[0] + '"' + (m[0] === S.src ? ' checked' : '') + '>' + m[1] + '</label>'; }).join('') + '</div><p class="sim-note" data-role="srcnote">녹음을 불러오는 중…</p></div>' +
          '<div class="sim-box sim-read" data-role="read"></div>' +
          '<div class="sim-box sim-read"><h4>dB 계산 <small>기준과 비교</small></h4><div data-role="refout" class="sim-note">「기준 저장」을 누르면 지금 출력이 기준이 돼요.</div><div class="sim-amp-ref"><button type="button" class="sim-btn" data-sim="ref">기준 저장</button><button type="button" class="sim-btn" data-sim="refclear">기준 지우기</button></div></div>' +
        '</div>' +
      '</div>';
    var q = function (s) { return el.querySelector(s); };
    var attIn = q('[data-sim=att]'), inIn = q('[data-sim=in]'), calcIn = q('[data-sim=calc]'), read = q('[data-role=read]'), wave = q('[data-role=wave]'), wctx = wave.getContext('2d');
    var leds = {}; ['sig1', 'clip1', 'fault1', 'sig2', 'clip2', 'fault2'].forEach(function (k) { leds[k] = q('[data-led=' + k + ']'); });
    var env = null, actx = null, nodes = null, raf = 0, alive = true, last = null, dpr = Math.min(2, window.devicePixelRatio || 1);

    function calc() {
      var w = WIRES[S.wiring], bridge = S.mode === 'bridge', z = w.z;
      var rated = bridge ? z >= 8 : z >= 4, unsafe = !rated && z < (bridge ? 8 : 4);
      var vclip = bridge ? (z >= 8 ? XLI.vb8 : XLI.vb8 * Math.sqrt(z / 8)) : (z >= 8 ? XLI.v8 : z >= 4 ? XLI.v4 : XLI.v4 * Math.sqrt(z / 4));
      var gain = XLI.v8 / S.sens * (bridge ? 2 : 1);                 // 감도 = 8Ω 정격 출력에 필요한 입력 전압
      var vin = 0.775 * Math.pow(10, S.inDbu / 20), vlin = vin * gain * Math.pow(10, S.att / 20);
      var muted = unsafe && vlin > 1;                                  // 보호 동작 흉내 (교육용)
      var vout = muted ? 0 : Math.min(vlin, vclip), clipping = !muted && vlin > vclip;
      var p = vout * vout / z, perV = vout / w.series, perP = perV * perV / 8, amps = vout / z;
      var head = db20(vclip / Math.max(vlin, 1e-6));
      return { w: w, z: z, bridge: bridge, unsafe: unsafe, estimated: !unsafe && (z > 8 || (bridge && z > 8)), vclip: vclip, gainDb: db20(gain), vin: vin, vlin: vlin, vout: vout, clipping: clipping, muted: muted, p: p, perP: perP, amps: amps, head: head, overSpk: perP > ZX1_PROG, pmax: vclip * vclip / z };
    }
    function shown() { return !!S.revealed[S.wiring]; }
    function update() {
      var c = calc(); last = c;
      if (c.unsafe) S.sawUnsafe = true;
      var cv0 = parseFloat(String(S.calc).replace(',', '.')); if (!isNaN(cv0) && Math.abs(cv0 - c.z) <= 0.05) S.revealed[S.wiring] = true;
      attIn.value = S.att; q('[data-out=att]').textContent = (S.att > 0 ? '+' : '') + fx(S.att, 1) + ' dB';
      q('[data-role=knob] i').style.transform = 'rotate(' + (-135 + (S.att + 40) / 40 * 270) + 'deg)';
      inIn.value = S.inDbu; q('[data-out=in]').textContent = (S.inDbu > 0 ? '+' : '') + fx(S.inDbu, 1) + ' dBu (' + fx(c.vin, 2) + ' V)';
      q('[data-role=wire]').innerHTML = wireSvg(S.wiring, shown(), c.unsafe);
      var fb = q('[data-role=calcfb]'), cv = parseFloat(String(S.calc).replace(',', '.'));
      if (S.calc === '' || isNaN(cv)) fb.innerHTML = ''; else if (Math.abs(cv - c.z) <= 0.05) fb.innerHTML = '<span class="ok">✓ 맞아요</span>'; else fb.innerHTML = '<span class="no">다시 계산해 보세요</span>';
      var warn = '';
      if (c.unsafe) warn = '<div class="sim-amp-warn" role="status"><b>⚠ 안전하지 않은 부하 (' + zTxt(c.z) + 'Ω)</b><br>XLi1500 의 제조사 정격은 ' + (c.bridge ? '브리지 8Ω' : '스테레오 8Ω·4Ω') + ' 이에요. 이보다 낮으면 전기(전류)가 너무 많이 흘러요. 앰프가 뜨거워지거나, 보호 회로가 출력을 끊을 수 있어요. 실습에서는 FAULT 불이 켜지고 출력이 꺼지는 것으로 보여 줘요(교육용).</div>';
      else if (c.overSpk) warn = '<div class="sim-amp-warn" role="status"><b>⚠ 스피커 정격보다 큰 출력</b><br>스피커 1대에 ' + fx(c.perP, 0) + ' W — ZX1 프로그램 정격 400 W(제조사 자료)를 넘어요. 브리지 출력은 작은 스피커 한 대에는 너무 커요.</div>';
      else if (c.estimated) warn = '<p class="sim-note">16Ω 이상은 제조사 정격이 없어요. 그래서 8Ω 와 같은 최대 전압이라고 정했어요(교육용 근사). Ω 이 높으면 안전하지만, 낼 수 있는 W 는 작아져요.</p>';
      q('[data-role=warn]').innerHTML = warn;
      checkTasks(c, performance.now());
      renderRead(c); renderRef(c); applyAudio();
    }
    function renderRead(c) {
      var hb = c.muted ? ['bad', '출력 꺼짐 (보호)'] : c.clipping ? ['bad', '클리핑 ' + fx(-c.head, 1) + ' dB 넘음'] : c.head <= 1 ? ['warn', fx(c.head, 1) + ' dB · 클리핑 직전'] : ['ok', fx(c.head, 1) + ' dB'];
      read.innerHTML = '<h4>지금 상태 <small>가장 큰 순간 · 사인파로 바꿔 계산</small></h4>' +
        row('부하 (합친 임피던스)', shown() ? zTxt(c.z) + ' Ω' + (c.unsafe ? ' · 정격 밖' : '') : '? Ω (직접 계산해 보세요)', c.unsafe ? 'bad' : '') +
        row('앰프가 키우는 양', fx(c.gainDb, 1) + ' dB' + (c.bridge ? ' (브리지)' : '')) +
        row('입력 전압', fx(c.vin, 2) + ' V') +
        row('출력 전압', fx(c.vout, 1) + ' V / 최대 ' + (c.unsafe ? '— (정격 없음)' : fx(c.vclip, 1) + ' V')) +
        row('전류', fx(c.amps, 1) + ' A') +
        row('출력 전력 (전체)', fx(c.p, c.p < 10 ? 1 : 0) + ' W / 최대 ' + (c.unsafe ? '— (정격 없음)' : fx(c.pmax, 0) + ' W'), c.muted ? 'bad' : '') +
        row('스피커 1대당', fx(c.perP, c.perP < 10 ? 1 : 0) + ' W × ' + c.w.n + '대', c.overSpk ? 'bad' : '') +
        row('클리핑까지 여유', hb[1], hb[0]) +
        '<p class="sim-note">P = V² ÷ R, I = V ÷ R. 음악의 평균 전력은 이 값보다 훨씬 작아요.</p>';
    }
    function row(a, b, cls) { return '<div class="sim-row"><span>' + a + '</span><b class="' + (cls || '') + '">' + b + '</b></div>'; }
    function renderRef(c) {
      var out = q('[data-role=refout]');
      if (!S.ref) { out.innerHTML = '「기준 저장」을 누르면 지금 출력이 기준이 돼요.'; return; }
      var r = S.ref, same = r.wiring === S.wiring && r.mode === S.mode;
      if (!(c.p > 0) || !(r.p > 0)) { out.innerHTML = '기준: ' + fx(r.p, 1) + ' W — 출력이 0 이라 비교할 수 없어요.'; return; }
      var pr = c.p / r.p, vr = c.vout / r.v, dp = 10 * Math.log10(pr), dv = db20(vr);
      out.innerHTML = '<div class="sim-row"><span>기준</span><b>' + fx(r.p, r.p < 10 ? 1 : 0) + ' W · ' + fx(r.v, 1) + ' V (' + WIRES[r.wiring].name + ')</b></div>' +
        '<div class="sim-row"><span>전력</span><b>×' + fx(pr, 2) + ' → ' + (dp >= 0 ? '+' : '') + fx(dp, 1) + ' dB</b></div>' +
        '<div class="sim-row"><span>전압</span><b>×' + fx(vr, 2) + ' → ' + (dv >= 0 ? '+' : '') + fx(dv, 1) + ' dB</b></div>' +
        (same ? '<p class="sim-note">같은 스피커라면 전력 dB(10 log) 와 전압 dB(20 log) 가 같아요.</p>' : '<p class="sim-note">연결이 기준과 달라요. 스피커 대수가 다르면 소리 크기 비교는 이 숫자와 달라요.</p>');
    }
    function checkTasks(c, now) {
      var cv = parseFloat(String(S.calc).replace(',', '.'));
      if (S.wiring === '2p' && !isNaN(cv) && Math.abs(cv - 4) <= 0.05) hit('load4');
      var mc = !c.unsafe && !c.muted && !c.overSpk && c.vlin <= c.vclip && c.head <= 1.0;
      if (mc) { if (!S.mcSince) S.mcSince = now; if (now - S.mcSince >= 1000) hit('maxclean'); } else S.mcSince = 0;
      if (S.ref && S.ref.wiring === S.wiring && S.ref.mode === S.mode && S.ref.p > 0.5 && !c.unsafe && !c.clipping && c.p > 0) { var dp = 10 * Math.log10(c.p / S.ref.p); if (Math.abs(dp - 3) <= 0.3) hit('plus3'); }
      if (S.sawUnsafe && c.w.n === 4 && !c.unsafe) hit('unsafe');
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function envAt() { if (!env) return 1; var tt = (S.audio && nodes) ? (actx.currentTime - nodes.start) % env.dur : ((performance.now() - S.t0) / 1000) % env.dur; return env.env[Math.floor(tt / env.blk) % env.env.length] || 0; }
    function sizeWave() { var w = wave.clientWidth || 400, h = wave.clientHeight || 130; if (wave.width !== Math.round(w * dpr)) { wave.width = Math.round(w * dpr); wave.height = Math.round(h * dpr); } }
    function drawWave(c, e) {
      sizeWave(); var W = wave.width / dpr, H = wave.height / dpr; wctx.setTransform(dpr, 0, 0, dpr, 0, 0); wctx.clearRect(0, 0, W, H);
      var top = 12, bot = H - 12, mid = (top + bot) / 2, full = Math.max(c.vclip * 1.5, 30), k = (bot - top) / 2 / full;
      wctx.strokeStyle = '#1e293b'; wctx.lineWidth = 1; wctx.beginPath(); wctx.moveTo(0, mid); wctx.lineTo(W, mid); wctx.stroke();
      if (!c.unsafe) { wctx.setLineDash([6, 4]); wctx.strokeStyle = '#f87171'; wctx.beginPath(); wctx.moveTo(0, mid - c.vclip * k); wctx.lineTo(W, mid - c.vclip * k); wctx.moveTo(0, mid + c.vclip * k); wctx.lineTo(W, mid + c.vclip * k); wctx.stroke(); wctx.setLineDash([]);
      wctx.fillStyle = '#fca5a5'; wctx.font = '11px sans-serif'; wctx.textAlign = 'right'; wctx.fillText('최대 ±' + fx(c.vclip, 0) + ' V', W - 6, mid - c.vclip * k - 4); }
      var a = c.muted ? 0 : c.vlin * e, clipNow = !c.muted && a > c.vclip;
      wctx.strokeStyle = clipNow ? '#ef4444' : '#22c55e'; wctx.lineWidth = 2.2; wctx.beginPath();
      for (var x = 0; x <= W; x += 2) { var v = a * Math.sin(x / W * Math.PI * 6), y = mid - clamp(v, -c.vclip, c.vclip) * k; if (x) wctx.lineTo(x, y); else wctx.moveTo(x, y); } wctx.stroke();
      wctx.textAlign = 'left'; wctx.fillStyle = '#cbd5e1'; wctx.fillText(c.muted ? '출력 없음 (보호 회로가 끊음 · 교육용)' : '지금 ' + fx(Math.min(a, c.vclip), 1) + ' V' + (clipNow ? ' — 잘림!' : ''), 6, 14);
      return clipNow;
    }
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick);
      var c = last || calc(), e = envAt(), clipNow = drawWave(c, e), sig = !c.muted && c.vlin * e > 0.3, both = S.mode !== 'stereo';
      leds.sig1.classList.toggle('on', sig); leds.clip1.classList.toggle('on', clipNow); leds.fault1.classList.toggle('on', c.muted);
      leds.sig2.classList.toggle('on', both && sig); leds.clip2.classList.toggle('on', both && clipNow); leds.fault2.classList.toggle('on', both && c.muted);
      S.clipNow = clipNow; var now = performance.now(); checkTasks(c, now);
    }
    // ---- 소리 (Web Audio): 녹음 → 입력 이득 → 클리핑(웨이브셰이퍼) → 출력 전압에 비례한 크기 ----
    function curve() { var n = 4097, cu = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1, u = x * 4, a = Math.abs(u), y = a < 0.9 ? a : 0.9 + 0.1 * Math.tanh((a - 0.9) / 0.1); cu[i] = (u < 0 ? -1 : 1) * Math.min(1, y); } return cu; }
    function applyAudio() {
      if (!nodes || !last) return; var c = last, tt = actx.currentTime;
      nodes.pre.gain.setTargetAtTime((c.vlin / c.vclip) / (env.max || 1) / 4, tt, 0.02);
      nodes.post.gain.setTargetAtTime(c.muted ? 0 : (c.vclip / XLI.vb8) * 0.8, tt, 0.02);
    }
    function startAudio() {
      if (!env || !env.buffer) { q('[data-role=srcnote]').textContent = '녹음을 불러오지 못해 소리는 들을 수 없어요. 표시등·파형은 가상 신호로 움직여요.'; return; }
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      actx = actx || new AC(); if (actx.resume) actx.resume();
      var src = actx.createBufferSource(); src.buffer = env.buffer; src.loop = true;
      var pre = actx.createGain(), shp = actx.createWaveShaper(), post = actx.createGain(); shp.curve = curve(); shp.oversample = '2x';
      src.connect(pre); pre.connect(shp); shp.connect(post); post.connect(actx.destination);
      var off = ((performance.now() - S.t0) / 1000) % env.dur, start = actx.currentTime + 0.05; src.start(start, off);
      nodes = { src: src, pre: pre, post: post, start: start - off }; S.audio = true; applyAudio();
    }
    function stopAudio() {
      if (nodes) { var tt = (actx.currentTime - nodes.start) % env.dur; try { nodes.src.stop(); nodes.post.disconnect(); } catch (e) { /* 이미 멈춤 */ } S.t0 = performance.now() - tt * 1000; }
      nodes = null; S.audio = false;
    }
    function setPlayBtn() { var b = q('[data-sim=play]'); b.textContent = S.audio ? '🔇 소리 끄기' : '🔊 소리 켜기'; b.classList.toggle('on', S.audio); }
    function load(key) {
      q('[data-role=srcnote]').textContent = '녹음을 불러오는 중…';
      loadStem(key, function (e) { if (!alive || S.src !== key) return; var wasOn = S.audio; if (wasOn) stopAudio(); env = e; S.t0 = performance.now();
        q('[data-role=srcnote]').textContent = e.synthetic ? '녹음을 불러오지 못해 가상 신호로 표시등만 보여 줘요.' : (key === 'leadVox' ? '보컬' : '키보드') + ' 녹음(콘솔 실습(MG12XU)과 같은 음원)이 계속 반복돼요. 앰프가 클리핑하면 소리도 찌그러져요.';
        if (wasOn) { startAudio(); setPlayBtn(); } update(); });
    }
    function saveRef() { var c = last || calc(); S.ref = { p: c.p, v: c.vout, wiring: S.wiring, mode: S.mode }; update(); }
    function onInput(e) { var tg = e.target; if (tg === attIn) { S.att = +attIn.value; update(); } else if (tg === inIn) { S.inDbu = +inIn.value; update(); } else if (tg === calcIn) { S.calc = calcIn.value; update(); } }
    function onChange(e) { var tg = e.target; if (tg.name === 'simAmpWire') { S.wiring = tg.value; S.calc = ''; calcIn.value = ''; update(); } else if (tg.name === 'simAmpMode') { S.mode = tg.value; update(); } else if (tg.name === 'simAmpSens') { S.sens = +tg.value; update(); } else if (tg.name === 'simAmpSrc') { S.src = tg.value; load(S.src); } }
    function onClick(e) {
      var b = e.target.closest('button[data-sim]'); if (!b) return; var k = b.getAttribute('data-sim');
      if (k === 'play') { if (S.audio) stopAudio(); else startAudio(); setPlayBtn(); }
      if (k === 'reveal') { S.revealed[S.wiring] = true; update(); }
      if (k === 'ref') saveRef();
      if (k === 'refclear') { S.ref = null; update(); }
    }
    el.addEventListener('input', onInput); el.addEventListener('change', onChange); el.addEventListener('click', onClick);
    update(); load(S.src); tick();
    function syncInputs() {
      var r = el.querySelector('input[name=simAmpWire][value="' + S.wiring + '"]'); if (r) r.checked = true;
      r = el.querySelector('input[name=simAmpMode][value="' + S.mode + '"]'); if (r) r.checked = true;
      r = el.querySelector('input[name=simAmpSens][value="' + (S.sens === 1.4 ? '1.4' : '0.775') + '"]'); if (r) r.checked = true;
      calcIn.value = S.calc;
    }
    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); stopAudio(); if (actx && actx.close) { try { actx.close(); } catch (e) { /* noop */ } } el.removeEventListener('input', onInput); el.removeEventListener('change', onChange); el.removeEventListener('click', onClick); el.innerHTML = ''; },
      state: function () { var c = last || calc(); return { wiring: S.wiring, mode: S.mode, sens: S.sens, inDbu: S.inDbu, att: S.att, z: c.z, unsafe: c.unsafe, muted: c.muted, vin: c.vin, vout: c.vout, vclip: c.vclip, clipping: c.clipping, clipNow: !!S.clipNow, headroom: c.head, power: c.p, perSpeaker: c.perP, amps: c.amps, overSpk: c.overSpk, ref: S.ref, calc: S.calc, audio: S.audio, ready: !!env, synthetic: !!(env && env.synthetic), src: S.src, done: Object.keys(S.done) }; },
      set: function (o) {
        o = o || {};
        if (o.wiring != null && WIRES[o.wiring]) { if (o.wiring !== S.wiring) S.calc = ''; S.wiring = o.wiring; }
        if (o.mode != null && /^(stereo|parallel|bridge)$/.test(o.mode)) S.mode = o.mode;
        if (o.sens != null) S.sens = +o.sens === 0.775 ? 0.775 : 1.4;
        if (o.inDbu != null) S.inDbu = clamp(+o.inDbu, -20, 20);
        if (o.att != null) S.att = clamp(+o.att, -40, 0);
        if (o.calc != null) S.calc = String(o.calc);
        syncInputs(); update();
        if (o.saveRef) saveRef();
        if (o.src && o.src !== S.src && window.MG12XU_SOURCE_AUDIO_BASE64) { S.src = o.src; syncInputs(); var r = el.querySelector('input[name=simAmpSrc][value="' + S.src + '"]'); if (r) r.checked = true; load(S.src); }
        return this.state();
      },
      model: { XLI: XLI, WIRES: WIRES }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.ampBench = ampBench;

  /* ------------------------------------------------------------------ 모듈 데이터 */
  var MODS = window.STA_MODULES = window.STA_MODULES || {}, stub = MODS.amp || {};
  MODS.amp = {
    id: 'amp', path: stub.path || 'hardware', no: stub.no || 4, noLabel: '04-1', status: 'ready', level: stub.level || '중급', minutes: stub.minutes || 30, img: 'img/modules/crown_xli1500.jpg',   /* 2026-10-23: 확성 실습의 Crown XLi1500 사진 · 2026-11-08: 초등학생 눈높이로 다시 씀 */
    title: '아날로그 앰프', sub: '작은 신호를 스피커를 움직일 힘으로 키우는 장비 — Crown XLi1500 (Class AB)',
    overview: {
      lead: '파워앰프는 작은 소리를 스피커가 움직일 만큼 크게 키우는 장비예요. 스피커를 어떻게 잇느냐에 따라 앰프가 편할 수도, 힘들 수도 있어요. 너무 크게 키우면 소리가 찌그러져요(<b>클리핑</b>).',
      terms: [
        ['파워앰프', '작은 소리를 스피커가 움직일 힘으로 키우는 장비예요. 예: 확성 실습의 Crown XLi1500.'],
        ['스피커 레벨', '앰프에서 스피커로 가는 아주 센 전기 신호예요. 그래서 스피커에만 연결해요.'],
        ['임피던스 (Ω)와 부하', '앰프에 달린 스피커(부하)가 전기를 막는 정도예요. 호스가 좁을수록 물이 덜 흐르는 것과 같아요.', 'ampHoseMini'],
        ['정격 출력 (W)', '앰프가 정해진 조건에서 낼 수 있는 힘이에요. 「8Ω 에서 330 W」처럼 적어요.'],
        ['입력 감도', '앰프가 최대 힘을 내는 데 필요한 입력 크기예요. 숫자가 작을수록 작은 입력에도 크게 나와요.'],
        ['데시벨 (dB)', '「몇 배인지」를 더하기 쉬운 숫자로 바꾼 단위예요. 힘(W)이 2배면 +3 dB 예요.', 'ampDbStairs'],
        ['클리핑', '앰프 한계를 넘어 소리 물결 윗부분이 잘리는 것이에요. 소리가 찌그러지고 CLIP 불이 켜져요.', 'ampClipMini'],
        ['브리지 모드', '두 채널을 하나로 묶어 스피커 한 대에 더 큰 힘을 주는 방식이에요.']
      ],
      points: [
        '8Ω 스피커 2대를 <b>나란히(병렬)</b> 이으면 <b>4Ω</b> 이 돼요. XLi1500 은 4Ω 보다 낮게 잇지 않아요.',
        '힘(W) 2배는 <b>+3 dB</b>, 전압 2배는 <b>+6 dB</b> 예요. W 를 두 배로 늘려도 소리는 조금만 커져요.',
        '<b>CLIP</b> 불이 켜지면 크기를 내려요. 앰프는 <b>마지막에 켜고, 가장 먼저 꺼요.</b>'
      ],
      model: 'crown'
    },
    theory: [
      { title: '파워앰프의 역할', visual: 'ampChain',
        body: '작은 목소리는 멀리 안 들려서 메가폰으로 키우죠. 콘솔에서 나온 소리도 약 1 V 로 아주 작아요(<b>라인 레벨</b>). 이 힘으로는 스피커 판(콘)을 크게 밀지 못해요. <b>파워앰프</b>는 이 작은 소리를 크게 키우는(증폭) 장비예요. 소리 모양은 그대로 두고 힘만 키워요. 키운 소리는 수십 V 의 <b>스피커 레벨</b>이 돼요. 앰프가 없는 <b>패시브 스피커</b>(EV ZX1)는 꼭 파워앰프가 필요해요. 앰프가 안에 든 <b>액티브 스피커</b>(EV ZXA1)는 따로 필요 없어요. 패시브 스피커 앞에는 꼭 파워앰프예요.',
        more: '<ul><li>확성 실습 ③ 의 구성: SM58S → MG12XU → <b>Crown XLi1500</b> → <b>EV ZX1</b>(패시브).</li> <li>앰프는 그림을 모양 그대로 크게 늘리는 확대 복사와 비슷해요. 전압과 전류만 크게 키워요.</li> <li><b>Crown XLi1500 (제조사 자료)</b>: 2채널 앰프예요. 입력은 XLR·RCA(전자식 밸런스)예요.</li> <li>출력은 speakON·바인딩 포스트(나사로 조이는 단자)예요.</li> <li>앰프 안에서는 단계를 나눠 키워요. 먼저 전압을 크게 키우고(전압 증폭), 그다음 스피커를 밀 전류를 키워요(드라이브·출력단).</li> <li>입력 감도는 0.775 V / 1.4 V 중에서 골라요(8Ω 정격 출력 기준).</li> <li>전압 이득(전압을 키우는 양)은 31 dB 예요. 전압을 약 35배로 키운다는 뜻이에요.</li> <li>설치용 앰프에는 DSP(소리를 계산해서 다듬는 칩)가 든 것이 많아요. 스피커별 설정과 EQ·딜레이를 앰프 안에서 해요(04-2 디지털 앰프 과정).</li></ul>',
        check: { q: '패시브 스피커 EV ZX1 에서 소리가 나려면 무엇이 필요할까요?', options: [
          { t: '콘솔 출력을 바로 잇는다', why: '아니에요. 콘솔 소리는 너무 작아서 스피커를 거의 못 움직여요. 파워앰프가 필요해요.' },
          { t: '파워앰프의 스피커 출력(speakON)', ok: true, why: '맞아요. 앰프가 소리를 스피커 레벨로 키워 줘야 소리가 나요.' },
          { t: '스피커에 전원선을 꽂는다', why: '아니에요. ZX1 같은 패시브 스피커에는 전원 단자가 없어요. 힘은 앰프가 줘요.' }] } },
      { title: '임피던스와 부하', visual: 'ampImpedance',
        body: '물 호스를 떠올려 봐요. 좁은 호스는 물이 적게, 넓은 호스는 많이 흘러요. 앰프에 달린 스피커가 바로 이 호스예요. 앰프가 짊어진 짐이라서 <b>부하</b>라고 불러요. 전기가 흐르기 어려운 정도는 <b>임피던스</b>라고 해요. 단위는 Ω(옴)이에요. 임피던스가 낮으면 전기가 많이 흘러 앰프가 힘들어요. 스피커를 <b>나란히(병렬)</b> 더 달면 임피던스가 낮아져요. 호스를 나란히 여러 개 놓은 것과 같아요. <b>한 줄로(직렬)</b> 이으면 높아져요. 스피커를 더 달기 전에 Ω 부터 계산해요.',
        more: '<ul><li>같은 스피커 n대를 병렬로 이으면 R ÷ n 이에요(R 은 스피커 한 대의 임피던스).</li> <li>예: 8Ω 2대는 4Ω, 4대는 2Ω 이에요.</li> <li>서로 다른 두 개를 병렬로 이으면 R1 × R2 ÷ (R1 + R2) 예요.</li> <li>직렬은 더하기예요(8Ω + 8Ω = 16Ω). 2대 직렬 줄 2개를 병렬로 하면 다시 8Ω 이에요.</li> <li>옴의 법칙: I = V ÷ R(전류 = 전압 ÷ 임피던스)이에요. 전력은 P = V² ÷ R 이에요.</li> <li>같은 전압이면 4Ω 은 8Ω 보다 전류도 전력도 2배예요.</li> <li>스피커에 적힌 「8Ω」은 <b>공칭 임피던스</b>(대표로 적은 값)예요.</li> <li>실제 임피던스는 소리 높이(주파수)마다 오르내려요. 대표값보다 낮아지는 곳도 있어요.</li> <li>테스터로 스피커 단자를 재면 적힌 값보다 조금 낮게 나와요. 적힌 값이 잰 값보다 약 20% 높은 셈이에요.</li> <li>테스터는 직류 저항만 재기 때문이에요. 8Ω 스피커가 6~7 Ω 쯤이면 정상이에요. 잴 때는 앰프에서 케이블을 빼요.</li> <li>XLi1500 정격(제조사가 정한 사용 조건)은 스테레오 8Ω·4Ω, 브리지 8Ω 뿐이에요.</li> <li>정격에 없는 낮은 부하(예: 스테레오 2Ω)는 연결하지 마세요.</li> <li>패시브 스피커의 링크 단자(입력·출력)는 안에서 서로 병렬로 이어져 있어요. 그래서 8Ω 2대를 링크로 이으면 앰프는 4Ω 을 봐요.</li></ul>',
        pics: [{ v: 'ampSeriesParallel', cap: '<b>병렬</b>은 물길을 나란히 늘리는 것이라 임피던스가 <b>낮아져요</b>. <b>직렬</b>은 한 줄로 길게 잇는 것이라 <b>높아져요</b>.' }, { v: 'ampMeterCheck', cap: '테스터(멀티미터)로 재면 적힌 값보다 조금 낮게 나와요. 8Ω 스피커가 6~7 Ω 이면 정상이에요.' }],
        check: { q: '8Ω 스피커 4대를 한 채널에 모두 병렬로 이었어요. 합친 값은?', options: [
          { t: '32Ω', why: '아니에요. 32Ω 은 4대를 모두 직렬로 이었을 때예요.' },
          { t: '2Ω', ok: true, why: '맞아요. 8 ÷ 4 = 2Ω 이에요. XLi1500 정격(4Ω)보다 낮아서 피해야 해요.' },
          { t: '8Ω', why: '아니에요. 8Ω 은 2대 직렬 줄 2개를 병렬로 했을 때예요.' }] } },
      { title: '출력 정격과 짝 맞추기(매칭)', visual: 'ampPower',
        body: '역도 선수마다 들 수 있는 무게가 정해져 있어요. 앰프와 스피커에도 힘의 한계가 있어요. 앰프가 낼 수 있는 힘을 <b>정격 출력</b>이라고 해요. 「8Ω 에서 330 W」처럼 Ω 과 함께 적어요. 같은 앰프도 Ω 이 낮으면 W 숫자가 커져요. 스피커에는 견딜 수 있는 힘(정격)이 적혀 있어요. 앰프는 스피커와 힘이 비슷하거나 조금 넉넉한 것을 골라요. 너무 작은 앰프는 자꾸 찌그러져서 오히려 위험해요. 가장 중요한 건 <b>클리핑 없이</b> 쓰는 거예요. 앰프와 스피커는 힘을 맞춰 짝지어요.',
        more: '<ul><li>스피커 정격은 세 가지로 적어요. <b>연속</b>은 오래 계속 견디는 힘이에요.</li> <li><b>프로그램</b>은 음악처럼 커졌다 작아졌다 하는 소리일 때의 값이에요. <b>피크</b>는 아주 잠깐 견디는 힘이에요.</li> <li><b>Crown XLi1500 (제조사 자료)</b>: 채널당 330 W/8Ω, 450 W/4Ω 이에요. 1 kHz · THD 0.5% 조건에서 잰 값이에요.</li> <li>XLi1500 브리지는 900 W/8Ω 이에요(제조사 자료).</li> <li><b>EV ZX1 (제조사 자료)</b>: 8Ω, 200 W 연속 · 400 W 프로그램 · 800 W 피크예요.</li> <li>XLi1500 한 채널(330 W/8Ω)에 ZX1 1대를 달면, 앰프가 스피커 연속 정격보다 조금 커요. 흔한 조합이에요.</li> <li>그래도 음량은 CLIP 불과 소리를 보며 알맞게 맞춰요.</li> <li>8Ω 에서 4Ω 으로 바꿔도 정확히 2배(660 W)가 되지는 않아요. 앰프의 전원과 전류에 한계가 있기 때문이에요.</li> <li>보통 1.5배 안팎으로 늘어요(XLi1500 은 약 1.4배).</li> <li><b>댐핑 계수</b>(Damping Factor): 신호가 멈추면 스피커 콘도 바로 멈추게 잡아 주는 힘이에요. 클수록 저음이 또렷해요.</li> <li>댐핑 계수는 스피커 임피던스 ÷ 앰프 출력 임피던스로 구해요. 가늘고 긴 스피커 케이블은 이 힘을 줄여요.</li> <li>XLi1500 의 댐핑 계수는 200 이 넘어요(8Ω, 제조사 자료).</li> <li><b>신호 대 잡음비</b>(S/N): 소리와 「쉬-」 하는 바탕 잡음의 차이예요. 클수록 조용해요.</li> <li>공연용 앰프는 S/N 90 dB 이상이 좋아요. XLi1500 은 100 dB 이상이에요(제조사 자료).</li> <li><b>THD</b>(고조파 왜곡률): 원래 없던 배음(덧붙는 높은 소리)이 섞여 찌그러진 정도예요. 낮을수록 좋아요.</li> <li>사람이 알아채는 THD 한계는 약 1% 로 알려져 있어요. XLi1500 정격은 0.5% 에서 잰 값이에요.</li> <li>정격은 회사마다 재는 조건(측정 신호·시간·찌그러짐 기준)이 달라요. 조건이 다르면 숫자를 바로 비교할 수 없어요.</li> <li>앰프가 너무 작으면 원하는 음량을 내려다 자주 클리핑돼요. 찌그러진 신호는 고음을 내는 부품(고음 드라이버)에 무리를 줄 수 있어요.</li></ul>',
        pics: [{ v: 'ampDamping', cap: '<b>댐핑</b>은 스피커 콘을 잡아 주는 브레이크예요. 브레이크가 세면 신호가 멈출 때 콘도 바로 멈춰요.' }],
        check: { q: 'XLi1500 은 8Ω 에서 330 W, 4Ω 에서 450 W 예요. 왜 4Ω 이 더 클까요?', options: [
          { t: 'Ω 이 낮으면 전류가 더 흘러서', ok: true, why: '맞아요. P = V² ÷ R 이라 R 이 작으면 W 가 커져요. 대신 앰프는 더 힘들게 일해요.' },
          { t: '4Ω 에서는 앰프가 덜 일해서', why: '아니에요, 반대예요. 4Ω 에서는 전류가 커져 앰프가 더 힘들어요.' },
          { t: '4Ω 스피커가 소리를 더 잘 내서', why: '아니에요. 스피커 성능이 아니라 앰프와 부하 사이의 전기 관계 때문이에요.' }] } },
      { title: '데시벨, 전압, 전력', visual: 'ampDb',
        body: '계단을 한 칸 오를 때마다 조금씩 높아진다고 생각해 봐요. <b>dB</b>(데시벨)는 「몇 배인지」를 이런 계단 숫자로 바꾼 단위예요. 힘(전력)이 2배가 되면 한 칸, <b>+3 dB</b> 올라가요. 전압이 2배가 되면 <b>+6 dB</b> 올라가요. 그래서 330 W 앰프를 660 W 로 바꿔도 +3 dB 예요. 3 dB 는 귀로 「조금 커졌네」 하는 정도예요. 「두 배 크게」 들리려면 약 +10 dB(힘 10배)가 필요해요. 앰프만 키운다고 소리가 확 커지지는 않아요. 힘 2배 = +3 dB 를 기억해요.',
        more: '<ul><li>계산식: 전압은 <b>20 × log(비율)</b>, 전력은 <b>10 × log(비율)</b> 이에요.</li> <li>log 는 「10을 몇 번 곱해야 그 수가 되는지」를 세는 계산이에요.</li> <li>전력: 2배 +3 dB · 4배 +6 dB · 10배 +10 dB · 절반 −3 dB.</li> <li>전압: 2배 +6 dB · 10배 +20 dB · 절반 −6 dB.</li> <li>같은 스피커에서 전압이 2배면 전력은 4배(+6 dB)가 돼요. P = V² ÷ R 이기 때문이에요.</li> <li>그래서 같은 스피커라면 전압으로 계산한 dB 와 전력으로 계산한 dB 가 같아요. 예: 전압 ×1.41 = 전력 ×2 = +3 dB.</li> <li>사람은 대략 <b>+10 dB</b>(전력 10배)쯤 커져야 「두 배 크게」 느낀다고 알려져 있어요.</li> <li>예: 1 W → 330 W 는 10 × log(330) ≈ +25 dB 예요. 330 W → 450 W 는 약 +1.3 dB 예요.</li> <li>dBu 는 전압을 나타내는 dB 예요. 0.775 V 를 0 dBu 로 정해요.</li> <li>+4 dBu ≈ 1.23 V, +6 dBu ≈ 1.55 V(0 dBu 의 2배 전압)예요.</li></ul>',
        check: { q: '앰프 출력이 50 W 에서 100 W 가 되면 몇 dB 커질까요?', options: [
          { t: '+3 dB', ok: true, why: '맞아요. 힘(전력) 2배는 +3 dB 예요.' },
          { t: '+6 dB', why: '아니에요. +6 dB 는 전압이 2배(전력 4배)일 때예요.' },
          { t: '+50 dB', why: '아니에요. dB 는 W 차이가 아니라 몇 배인지(2배)로 계산해요.' }] } },
      { title: '클리핑, 리미터와 보호', visual: 'ampClip',
        body: '천장이 낮은 방에서 높이 뛰면 머리가 천장에 막혀요. 앰프도 낼 수 있는 가장 큰 전압이 정해져 있어요. 그보다 크게 키우면 소리 물결 윗부분이 잘려요. 이것이 <b>클리핑</b>이고, 소리가 찌그러져요. 클리핑이 생기면 앰프의 <b>CLIP</b> 불이 켜져요. CLIP 불이 깜빡이면 앰프 LEVEL 이나 콘솔 출력을 조금 내려요. 어떤 앰프나 액티브 스피커에는 <b>리미터</b>가 있어요. 리미터는 넘치기 전에 저절로 소리를 줄여 줘요. 장비가 고장 나지 않게 지키는 <b>보호 회로</b>도 있어요. 빨간 CLIP 불이 보이면 크기를 내려요.',
        more: '<ul><li>보호 회로는 단락(선끼리 닿음)이나 과열(너무 뜨거워짐)이 생기면 출력을 막아요.</li> <li><b>Crown XLi1500 앞면 (제조사 자료)</b>: 채널마다 SIGNAL(신호 있음)·CLIP(잘림)·FAULT(이상) 불이 있어요. POWER 불도 있어요.</li> <li>제조사는 여러 보호 기능을 안내해요. 단락과 스피커 없음(무부하)을 막아요. 켜고 끌 때의 「퍽」 소리와 전파 간섭도 막아요.</li> <li>다른 앰프에서는 FAULT 대신 PROTECT 라고 적기도 해요.</li> <li>CLIP 이 계속 켜져 있다면, 그 음량에 비해 앰프·스피커가 작다는 뜻이에요.</li> <li>FAULT 가 켜지면 먼저 소리를 줄여요. 그리고 스피커 케이블 단락, 너무 낮은 부하, 통풍(과열)을 확인해요.</li> <li>EV ZXA1(액티브)에는 <b>Limit</b> 불이 있어요. 안에 든 리미터가 동작할 때 켜져요(제조사 자료).</li> <li><b>켜는 순서</b>: 음원·콘솔을 먼저 켜고, 앰프(또는 액티브 스피커)는 마지막에 켜요.</li> <li><b>끄는 순서</b>: 앰프를 먼저 끄고, 콘솔은 나중에 꺼요. 켜기 전에 앰프 LEVEL 을 내려 두면 더 안전해요.</li></ul>',
        pics: [{ v: 'ampPowerOrder', cap: '앰프는 <b>마지막에 켜고, 가장 먼저 꺼요.</b> 앞 장비를 켜고 끌 때 나는 「퍽」 소리가 스피커로 나가지 않게요.' }],
        check: { q: 'XLi1500 의 CLIP 불이 켜졌어요. 무슨 뜻일까요?', options: [
          { t: '소리가 한계를 넘어 잘리고 있다', ok: true, why: '맞아요. 그래서 LEVEL 이나 콘솔 출력을 낮춰야 해요.' },
          { t: '스피커가 연결되지 않았다', why: '아니에요. CLIP 은 스피커가 없을 때가 아니라 소리가 너무 클 때 켜져요.' },
          { t: '신호가 잘 들어오고 있다', why: '아니에요. 그건 SIGNAL 불이에요.' }] } },
      { title: '채널, 브리지 모드, 스피커 연결', visual: 'ampConnect',
        body: 'XLi1500 안에는 앰프가 두 개(2채널) 들어 있어요. 두 사람이 따로 일할 수도, 힘을 합칠 수도 있는 것과 같아요. 뒷면 <b>MODE</b> 스위치로 일하는 방식을 골라요. <b>STEREO</b> 는 두 채널이 따로 일해요. <b>PARALLEL</b> 은 입력 하나를 두 채널이 함께 받아요. <b>BRIDGE</b> 는 두 채널이 힘을 합쳐 스피커 한 대를 밀어요. 스피커는 <b>speakON</b> 케이블로 이어요. 꽂은 뒤에는 돌려서 잠가요. 앰프 출력에는 수십 V 가 나와요. 앰프 출력은 꼭 스피커에만 이어요.',
        more: '<ul><li>speakON(NL4)에는 1+ · 1− · 2+ · 2− 네 핀이 있어요.</li> <li>XLi1500 뒷면 표시: <b>CH1 단자</b>는 1± = CH1, 2± = CH2 예요. <b>CH2 단자</b>는 1± = CH2 예요.</li> <li>풀레인지 패시브 스피커(높은 소리와 낮은 소리를 한 통에서 다 내는 스피커)는 보통 1+/1− 로 소리를 받아요(스피커 설명서 확인).</li> <li>브리지 모드 정격은 900 W/8Ω 이에요(제조사 자료). 브리지에서는 스피커를 두 채널의 + 단자 사이에 이어요.</li> <li>그래서 스피커에 걸리는 전압이 2배가 돼요. 계산으로는 힘이 4배예요.</li> <li>하지만 실제로는 한 채널의 2~3배 정도예요(XLi1500 은 330 W → 900 W).</li> <li>브리지에서는 두 채널이 부하를 반씩 나눠 맡는 셈이에요. 그래서 8Ω 브리지는 각 채널에 4Ω 을 단 것만큼 힘들어요.</li> <li>브리지에서도 정격보다 낮은 부하는 연결하지 마세요. 연결 단자는 뒷면 BRIDGE 표시와 설명서를 따라요.</li> <li>브리지 900 W 는 ZX1(200 W 연속) 한 대에는 너무 커요. 앰프 출력이 클수록 스피커 정격을 더 꼼꼼히 확인해요.</li> <li><b>주의</b>: 앰프 스피커 출력을 콘솔이나 액티브 스피커의 입력에 연결하면 안 돼요.</li> <li>케이블은 앰프를 끄거나 LEVEL 을 내린 상태에서 꽂고 빼요.</li> <li>설치용 앰프 중에는 스피커 출력이 나사로 조이는 블록 단자(Euroblock 등)도 있어요.</li></ul>',
        check: { q: 'STEREO 모드예요. CH1 speakON 단자에 1± 로 받는 스피커를 꽂으면?', options: [
          { t: 'CH1 소리가 나요', ok: true, why: '맞아요. CH1 단자의 1± 핀에는 CH1 이 나오기 때문이에요.' },
          { t: 'CH2 소리가 나요', why: '아니에요. CH2 는 이 단자의 2± 핀으로 나와요. 1± 만 쓰는 스피커에는 안 들어가요.' },
          { t: '두 채널이 섞여 나요', why: '아니에요. STEREO 모드에서 두 채널은 따로예요. 섞이지 않아요.' }] } }
    ],
    practice: {
      kind: 'ampBench',
      lead: 'Crown XLi1500 한 채널에 8Ω 스피커를 여러 방법으로 이어 봐요. ① 오른쪽에서 연결 방법을 골라요. ② 콘솔 출력·앰프 LEVEL·감도를 바꿔 봐요. ③ 전압·전력과 CLIP·FAULT 불이 어떻게 변하는지 봐요. 「소리 켜기」를 누르면 앰프를 지나며 찌그러지는 소리도 들을 수 있어요.',
      note: 'XLi1500 정격(330 W/8Ω · 450 W/4Ω · 브리지 900 W/8Ω)은 제조사 자료예요. 감도(0.775 V · 1.4 V)와 ZX1 정격도 제조사 자료예요. 그 밖의 동작은 공부용으로 비슷하게 만든 것(교육용 근사)이에요. 16Ω·2Ω 동작, 보호 동작, 음악을 사인파로 바꾼 출력이 그래요. 실제 장비로 낮은 부하를 시험하지 마세요.',
      tasks: [
        { id: 'load4', title: '4Ω 부하 계산', text: '① 「2대 병렬」을 골라요. ② 합친 임피던스를 직접 계산해 「내 계산」 칸에 써요. ③ 「✓ 맞아요」가 나오면 성공이에요.' },
        { id: 'maxclean', title: 'CLIP 없이 최대 음량', text: '① 안전한 연결을 골라요. ② 콘솔 출력이나 LEVEL 을 올려 「클리핑까지 여유」를 0–1 dB 로 맞춰요. ③ CLIP 없이 1초 버티면 성공이에요.' },
        { id: 'plus3', title: '+3 dB 에 필요한 전력', text: '① 「기준 저장」을 눌러요. ② 같은 연결에서 출력을 +3 dB(±0.3) 올려요. ③ 맞추면 성공이에요. 전력이 몇 배가 됐는지 봐요.' },
        { id: 'unsafe', title: '안전하지 않은 부하 피하기', text: '① 「4대 병렬」을 골라 2Ω 경고를 확인해요. ② 4대를 그대로 쓰면서 다른 연결로 바꿔요. ③ 4Ω 이상(정격 안)이 되면 성공이에요.' }
      ],
      links: [
        { title: '음향 시스템 설계 실습 · 3D 실습 ③', text: 'MG12XU → Crown XLi1500 → ZX1 패시브 스피커를 speakON 으로 직접 이어 봐요.', go: { tab: 'tab1', card: 's3' } },
        { title: '장비 브랜드 알아보기 · 파워앰프', text: '현장에서 자주 만나는 파워앰프 브랜드와 대표 제품을 살펴봐요.', go: { tab: 'tabBrands' } }
      ]
    },
    quiz: [
      { q: '그림처럼 8Ω 스피커 2대를 한 채널에 병렬로 이었어요. 합친 값은?', visual: 'ampQuizParallel', options: [
        { t: '16Ω', why: '아니에요. 16Ω 은 2대를 직렬로 이었을 때예요.' },
        { t: '4Ω', ok: true, why: '맞아요. 같은 스피커 2대 병렬은 8 ÷ 2 = 4Ω 이에요.' },
        { t: '8Ω', why: '아니에요. 병렬로 더 달면 임피던스는 낮아져요.' }] },
      { q: '앰프 출력을 100 W 에서 200 W 로 올리면 약 몇 dB 커질까요?', options: [
        { t: '+3 dB', ok: true, why: '맞아요. 힘(전력) 2배는 +3 dB 예요.' },
        { t: '+6 dB', why: '아니에요. +6 dB 는 전력 4배(전압 2배)일 때예요.' },
        { t: '+10 dB(두 배 크게)', why: '아니에요. +10 dB 는 전력 10배일 때예요.' }] },
      { q: '같은 스피커에서 전압이 20 V 에서 40 V 로 2배가 됐어요. 어떻게 될까요?', options: [
        { t: '+6 dB, 전력은 4배', ok: true, why: '맞아요. 전압 2배는 +6 dB 예요. P = V² ÷ R 이라 전력은 4배가 돼요.' },
        { t: '+3 dB, 전력은 2배', why: '아니에요. 전압이 2배면 전력은 2배가 아니라 4배예요.' },
        { t: '+20 dB', why: '아니에요. +20 dB 는 전압 10배일 때예요.' }] },
      { q: '찬양 중 앰프의 CLIP 불이 자주 켜져요. 어떻게 할까요?', options: [
        { t: 'LEVEL 이나 콘솔 출력을 조금 내린다', ok: true, why: '맞아요. 클리핑 없이 쓰는 게 먼저예요. 그래도 음량이 모자라면 더 큰 앰프·스피커를 알아봐요.' },
        { t: '스피커를 병렬로 더 단다', why: '아니에요. 부하가 낮아져 앰프가 더 힘들어요. 정격 밖이면 위험해요.' },
        { t: '소리만 나면 그대로 둔다', why: '아니에요. 찌그러진 소리는 듣기에도 나쁘고 스피커에도 무리를 줘요.' }] },
      { q: '확성 장비를 켜고 끄는 순서로 알맞은 것은?', options: [
        { t: '켤 때 앰프 마지막, 끌 때 앰프 먼저', ok: true, why: '맞아요. 앞 장비를 켜고 끌 때 나는 「퍽」 소리가 스피커로 안 나가게 해요.' },
        { t: '켤 때 앰프 먼저, 끌 때 콘솔 먼저', why: '아니에요. 앰프가 켜진 채 콘솔을 켜고 끄면 「퍽」 소리가 스피커로 나가요.' },
        { t: '순서는 상관없다', why: '아니에요. 순서를 지키면 스피커와 귀를 지킬 수 있어요.' }] }
    ],
    missions: [
      { title: '음향 트러블슈팅 · 미션 C', text: '패시브 스피커(ZX1)에서 소리가 안 날 때를 연습해요. 앰프 전원·LEVEL·speakON 연결을 차례로 확인해요.', go: { tab: 'tab7', ts: 'C' } },
      { title: '음향 트러블슈팅 · 미션 B', text: '스피커 한쪽만 소리가 안 날 때를 연습해요. 앰프 채널·표시등·스피커 케이블을 차례로 확인해요.', go: { tab: 'tab7', ts: 'B' } }
    ],
    deeper: [
      { title: '앰프 LEVEL 은 어디에 둘까?', text: '앰프 LEVEL 은 예배 중에 돌리는 볼륨이 아니에요. 처음 설치할 때 한 번 맞춰 둬요. 콘솔 출력이 알맞을 때 필요한 만큼 크게 나오게 맞춰요. 예배 중에는 콘솔에서 조절해요.', more: '<ul><li>감도 스위치(0.775 V / 1.4 V)는 「정격 출력을 내는 데 필요한 입력 전압」이에요.</li> <li>0.775 V 로 두면 같은 콘솔 출력에서 약 5 dB 더 크게 나와요. 계산하면 20 × log(1.4 ÷ 0.775) ≈ 5.1 dB 예요.</li> <li>감도를 바꿔도 앰프가 낼 수 있는 최대 출력(330 W/8Ω)은 그대로예요. 같은 입력에서 얼마나 크게 나오는지만 달라져요.</li> <li>콘솔과 앰프가 둘 다 찌그러지지 않는 쪽으로 고르면 돼요.</li></ul>' },
      { title: '스피커 케이블은 왜 굵을까요', text: 'Ω 이 낮을수록 전기(전류)가 많이 흘러요. 그래서 스피커 케이블은 굵어야 해요. 케이블이 길수록 도중에 잃어버리는 힘도 커져요.', more: '<ul><li>XLi1500 이 4Ω 에 450 W 를 내면 전류는 약 10.6 A 예요. 계산식은 I = √(P ÷ R) 이에요.</li> <li>케이블에도 저항(전기를 막는 정도)이 있어서 부하의 일부가 돼요.</li> <li>그래서 길고 가는 케이블에서는 앰프 힘의 일부가 열로 사라져요.</li> <li>앰프는 스피커 가까이 두는 게 좋아요. 멀면 더 굵은 스피커 케이블을 써요.</li></ul>' },
      { title: '디지털 앰프는 04-2 과정에서', text: '이 과정의 Crown XLi1500 은 아날로그 방식이에요. 무거운 전원 트랜스(전압을 바꾸는 부품)와 <b>Class AB</b> 출력단을 써요. 가볍고 열이 적은 Class D 앰프도 있어요. 이런 앰프는 <b>04-2 디지털 앰프 과정</b>에서 자세히 다뤄요.', visual: 'ampClassAB', more: '<ul><li><b>Class A</b>: 증폭 부품 하나가 파형 전체를 맡아요. 찌그러짐은 적지만, 소리가 없을 때도 전기가 늘 흘러 뜨겁고 효율이 낮아요. 그래서 확성용으로는 거의 쓰지 않아요.</li> <li><b>Class B</b>: 부품 두 개가 파형의 위·아래 반쪽을 나눠 맡아요(푸시풀). 효율은 좋지만, 두 반쪽이 이어지는 곳이 찌그러지기 쉬워요(크로스오버 왜곡).</li> <li><b>Class AB</b>: 작은 소리 부분은 둘이 살짝 겹쳐 맡아 이음매를 매끈하게 해요. 효율과 음질을 함께 챙겨 공연용 앰프에 많이 써요.</li> <li><b>Class D</b>: 신호를 아주 빠른 펄스로 바꿔 켰다 껐다 하며 키워요(스위칭). 열이 적고 가벼워요(04-2 과정).</li> <li>요즘 앰프 중에는 Class D 출력에 DSP · 네트워크 제어까지 갖춘 것이 많아요.</li> <li>임피던스 · 부하 · 정격 · dB · 클리핑 · 켜고 끄는 순서는 디지털 앰프도 똑같아요.</li></ul>' }   /* 2026-11-04: 04-2 로 옮김 · 2026-11-08: 특정 장소 장비 예시 뺌 */
    ],
    sources: [
      { t: 'Crown XLi Series 데이터 시트(제조사) — 정격 출력·감도·표시등·보호', url: 'https://www.farnell.com/datasheets/1760422.pdf' },
      { t: 'Crown XLi 1500 제품 페이지(JBL Professional) — 사양표', url: 'https://jblpro.com/en/products/xli-1500' },
      { t: 'Electro-Voice ZX1 제품 페이지(제조사) — 정격·단자', url: 'https://products.electrovoice.com/la/en/zx1' },
      { t: 'Electro-Voice ZxA1-90 엔지니어링 데이터 시트(제조사) — Limit 표시등', url: 'https://www.fullcompass.com/common/files/24805-ElectroVoiceZxA190BDatasheet.pdf' },
      { t: 'Class D Audio Amplifiers: What, Why, and How — Analog Devices (PWM·출력 필터·효율)', url: 'https://www.analog.com/en/resources/analog-dialogue/articles/class-d-audio-amplifiers.html' },
      { t: 'Is Class-D Digital? — Stereophile (「D」는 디지털의 줄임말이 아님)', url: 'https://stereophile.com/content/ps-audio-stellar-m1200-monoblock-power-amplifier-class-d-digital' },
      { t: 'The Truth About Digital Class D Amplifiers — Audioholics', url: 'https://www.audioholics.com/education/amplifier-technology/the-truth-about-digital-class-d-amplifiers' },
      { t: 'Crown XLi 1500 제품 사양(JBL Professional) — 댐핑 계수 200 이상(8Ω) · S/N 100 dB 이상 · THD 0.5% 미만', url: 'https://jblpro.com/en-US/products/xli-1500' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 6장 파워 앰프: 구동 원리 · 증폭 방식(Class A · B · AB · D) · 출력 · 입력 감도 · 댐핑 계수 · S/N · THD p.177–182', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 6장 파워 앰프와 스피커 연결: 스테레오 · 패러럴 · 브릿지(BTL) · 공칭 임피던스 · 직렬 · 병렬 p.182–187', url: '' }
    ]
  };
})();
