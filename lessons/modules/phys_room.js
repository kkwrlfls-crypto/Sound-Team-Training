/* =============================================================================
   물리음향 03 공간(룸 어쿠스틱) — 2026-11-04
   - STA_MODULES['phys-room'] (모듈 데이터) + STAVisuals.pr* (그림 7개: 이론 6 + 첫 화면 1) + STASims.roomLab (예배당 평면 실습)
   - 믹싱 과정의 「공간계 이펙트(fx-space)」는 콘솔에서 더하는 인공 리버브, 이 과정은 실제 공간의 물리(반사 · 흡음 · 잔향 · 모드)
   - 숫자 출처 (sources 참고):
       흡음률 500 Hz — Hall 표(HyperPhysics): 콘크리트(타설) 0.02 · 두꺼운 판유리 0.04 · 석고보드 0.05 · 비닐 타일 0.03 · 카펫(콘크리트 위) 0.15 ·
                      벨루어 커튼 0.5 · 매단 흡음 타일 0.6 · 빈 나무 의자 0.03 · 사람 앉은 나무 의자 0.7 · 빈 천 의자 0.6 · 사람 앉은 천 의자 0.8
                      유리섬유판 2"(약 5 cm) — sengpielaudio 표: 125 Hz 0.22 · 500 Hz 이상 0.99
       세이빈 RT60 = 0.161 · V / A (sengpielaudio, c = 343 m/s · 20 °C)
       권장 RT (Acoustical Surfaces): 설교 0.8–1.2 s · 현대 예배 1.0–1.5 s · 전통 성가대 1.5–2.5 s · 오르간 2.0–3.0 s / Riedel(The Diapason): 현대 1.4–1.8 · 전례 2.0–3.0
       선행음 효과 (Wikipedia Precedence effect): 2 ms 미만 하나 · 합쳐 듣기 클릭 1–5 ms, 말 · 피아노 40 ms 까지 · 메아리 말 50 ms, 음악 약 100 ms · 최대 10 dB
       임계 거리 Dc = 0.057 √(Q V / RT) (Arup) · 마이크 거리 계수 무지향 1 · 카디오이드 1.7 · 슈퍼 1.9 (Shure 기술 팁) · 거리 2배마다 직접음 6 dB (SFU)
       축 모드 f = c / 2L (Recording Magazine: 1130 / 2L ft)
   - 실습의 교육용 가정: 확산판 α 0.1 · 정반사 70 % 흩음, 기타 흡음(문 · 창틀 · 조명 · 공기 등) 모든 면에 α 0.04 더하기, 목소리 Q 2,
     회중석 넓이 = (길이 − 5.5 m) × (폭 − 3.9 m), 스피커 높이 = min(5 m, 천장 − 1 m) · 귀 높이 1.2 m, 메아리 위험 = 50 ms 넘고 직접음 대비 −15 dB 이상,
     스피커 지향성과 주파수별 차이(500 Hz 하나로 계산)는 뺌.
   ============================================================================= */
(function () {
  'use strict';
  var V = window.STAVisuals = window.STAVisuals || {};
  var C = { ink: '#0f1f33', sub: '#51627a', line: '#cbd5e1', bg: '#f8fafc', blue: '#2563eb', teal: '#0e7490', orange: '#ea580c', purple: '#7c3aed', red: '#dc2626', green: '#059669', amber: '#d97706', gray: '#64748b' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 500) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.halo ? ' paint-order="stroke" stroke="' + o.halo + '" stroke-width="3.5" stroke-linejoin="round"' : '') + (o.extra || '') + '>' + s + '</text>'; }
  function rect(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 8 : r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.5"' : '') + '/>'; }
  function line(x1, y1, x2, y2, col, w, dash, op) { return '<path d="M' + f(x1) + ' ' + f(y1) + 'L' + f(x2) + ' ' + f(y2) + '" stroke="' + col + '" stroke-width="' + (w || 2) + '" fill="none"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + (op != null ? ' opacity="' + op + '"' : '') + ' stroke-linecap="round"/>'; }
  function arrow(x1, y1, x2, y2, col, w) { var a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 8 * Math.cos(a), hy = y2 - 8 * Math.sin(a); return line(x1, y1, hx, hy, col, w || 2.4) + '<path d="M' + f(x2) + ' ' + f(y2) + 'L' + f(hx - 4.5 * Math.sin(a)) + ' ' + f(hy + 4.5 * Math.cos(a)) + 'L' + f(hx + 4.5 * Math.sin(a)) + ' ' + f(hy - 4.5 * Math.cos(a)) + 'Z" fill="' + col + '"/>'; }
  function f(v) { return (Math.round(v * 10) / 10).toString(); }
  function poly(pts, col, w, extra) { return '<path d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); }).join('') + '" stroke="' + col + '" stroke-width="' + (w || 2) + '" fill="none" stroke-linejoin="round" stroke-linecap="round"' + (extra || '') + '/>'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(x, y, n, col) { return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="7.5" fill="' + col + '"/>' + t(x, y + 3.6, n, { size: 10, weight: 900, fill: '#fff' }); }
  function f1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
  function db(v) { return (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + f1(Math.abs(v)) + ' dB'; }

  /* =========================================================================== 공통 모델 (그림과 실습이 같이 씀) */
  var CS = 343, MISC = 0.04, VOICE_Q = 2;
  var MAT = {   // 벽 재질 — α 는 500 Hz (Hall 표 · sengpielaudio), 확산판은 교육용 가정
    concrete: { n: '콘크리트', a: 0.02, s: 0, col: '#64748b' },
    glass: { n: '유리', a: 0.04, s: 0, col: '#0ea5e9' },
    curtain: { n: '커튼', a: 0.5, s: 0, col: '#be123c' },
    absorber: { n: '흡음판', a: 0.99, s: 0, col: '#059669' },
    diffuser: { n: '확산판', a: 0.1, s: 0.7, col: '#7c3aed' }
  };
  var MAT_KEYS = ['concrete', 'glass', 'curtain', 'absorber', 'diffuser'];
  var CEIL = { gypsum: { n: '석고보드', a: 0.05 }, tile: { n: '흡음 천장', a: 0.6 } };
  var FLOOR = { vinyl: { n: '타일', a: 0.03 }, carpet: { n: '카펫', a: 0.15 } };
  var SEAT = { wood: { n: '나무 의자', e: 0.03, f: 0.7 }, cloth: { n: '천 씌운 의자', e: 0.6, f: 0.8 } };
  var DF = { omni: { n: '무지향', k: 1 }, card: { n: '카디오이드', k: 1.7 }, sup: { n: '슈퍼카디오이드', k: 1.9 } };
  var WALL_N = { front: '앞벽 (강단)', back: '뒷벽', s1: '위쪽 옆벽', s2: '아래쪽 옆벽' };
  function hard(m) { return m.a < 0.3 && !m.s; }
  function seatArea(L, W) { return Math.max(0, L - 5.5) * Math.max(0, W - 3.9); }
  function surfaces(r) {   // r: {L,W,H,walls,ceil,floor,seat}, people: bool
    var L = r.L, W = r.W, H = r.H, sa = seatArea(L, W);
    return [
      { k: 'front', n: WALL_N.front, S: W * H, a: MAT[r.walls.front].a, m: MAT[r.walls.front].n },
      { k: 'back', n: WALL_N.back, S: W * H, a: MAT[r.walls.back].a, m: MAT[r.walls.back].n },
      { k: 's1', n: WALL_N.s1, S: L * H, a: MAT[r.walls.s1].a, m: MAT[r.walls.s1].n },
      { k: 's2', n: WALL_N.s2, S: L * H, a: MAT[r.walls.s2].a, m: MAT[r.walls.s2].n },
      { k: 'ceil', n: '천장', S: L * W, a: CEIL[r.ceil].a, m: CEIL[r.ceil].n },
      { k: 'floor', n: '바닥 (통로 · 강단)', S: L * W - sa, a: FLOOR[r.floor].a, m: FLOOR[r.floor].n },
      { k: 'seat', n: '회중석', S: sa, a: null, m: SEAT[r.seat].n }
    ];
  }
  function rtOf(r, people) {
    var V0 = r.L * r.W * r.H, list = surfaces(r), A = 0, St = 0;
    list.forEach(function (s) { var a = s.k === 'seat' ? (people ? SEAT[r.seat].f : SEAT[r.seat].e) : s.a; s.aa = a; s.A = a * s.S; A += s.A; if (s.k !== 'seat') St += s.S; });
    var misc = MISC * St; A += misc;
    return { V: V0, A: A, misc: misc, St: St, rt: 0.161 * V0 / A, list: list };
  }
  function dcOf(V0, rt, q) { return 0.057 * Math.sqrt((q || 1) * V0 / rt); }
  var DEF = { L: 28, W: 20, H: 9, walls: { front: 'concrete', back: 'concrete', s1: 'concrete', s2: 'concrete' }, ceil: 'gypsum', floor: 'vinyl', seat: 'wood' };
  function copyRoom(r) { return { L: r.L, W: r.W, H: r.H, walls: { front: r.walls.front, back: r.walls.back, s1: r.walls.s1, s2: r.walls.s2 }, ceil: r.ceil, floor: r.floor, seat: r.seat }; }
  var DEF_E = rtOf(DEF, false).rt, DEF_F = rtOf(DEF, true).rt;

  /* ---------------------------------------------------------------- 첫 화면 그림: 예배당 평면 · 소리 길 · 잔향 */
  V.prHero = function () {
    var s = rect(0, 0, 600, 300, '#f8fafc', null, 12);
    var x0 = 30, y0 = 34, w = 360, h = 230;
    s += t(x0, 22, '본당 평면 (교육용 그림) — 스피커 소리는 곧장도, 벽에 튕겨서도 와요', { size: 11, fill: C.sub, anchor: 'start' });
    s += rect(x0, y0, w, h, '#fff', null, 2) + '<rect x="' + x0 + '" y="' + y0 + '" width="54" height="' + h + '" fill="#fef3c7"/>' + t(x0 + 27, y0 + 18, '강단', { size: 10.5, weight: 700, fill: C.amber });
    for (var i = 0; i < 13; i++) { var xx = x0 + 74 + i * 21; s += line(xx, y0 + 18, xx, y0 + h / 2 - 12, '#e2e8f0', 4) + line(xx, y0 + h / 2 + 12, xx, y0 + h - 18, '#e2e8f0', 4); }
    s += '<path d="M' + x0 + ' ' + y0 + 'H' + (x0 + w) + 'V' + (y0 + h) + 'H' + x0 + 'Z" fill="none" stroke="#64748b" stroke-width="6"/>';
    s += '<rect x="' + (x0 + w - 6) + '" y="' + (y0 + 20) + '" width="8" height="' + (h - 40) + '" fill="' + C.green + '" rx="2"/>' + t(x0 + w - 12, y0 + h - 26, '흡음', { size: 10, weight: 800, fill: C.green, anchor: 'end', halo: '#fff' });
    var Sx = x0 + 26, Sy = y0 + h / 2, Px = x0 + 236, Py = y0 + 150;
    s += poly([[Sx, Sy], [Sx + (Px - Sx) * (h / 2) / (h / 2 + 150 - 0), y0], [Px, Py]], C.orange, 2.2, ' opacity=".85"');
    s += poly([[Sx, Sy], [x0 + w, (Sy + Py) / 2 + 4], [Px, Py]], C.orange, 2, ' stroke-dasharray="5 4" opacity=".55"');
    s += poly([[Sx, Sy], [Sx + (Px - Sx) * (h / 2) / (h / 2 + (y0 + h - Py)), y0 + h], [Px, Py]], C.orange, 2.2, ' opacity=".85"');
    s += arrow(Sx, Sy, Px - 6, Py - 3, C.teal, 3);
    s += rect(Sx - 7, Sy - 10, 14, 20, '#0f2747', null, 3) + '<circle cx="' + Px + '" cy="' + Py + '" r="9" fill="' + C.blue + '" stroke="#fff" stroke-width="2.5"/>';
    s += t(Sx + 2, Sy + 28, '스피커', { size: 10, weight: 700, halo: '#fef3c7' }) + t(Px, Py + 24, '듣는 자리', { size: 10, weight: 700, fill: C.blue, halo: '#fff' });
    s += t(x0 + 150, y0 + 108, '직접음', { size: 11, weight: 800, fill: C.teal, halo: '#fff' }) + t(x0 + 120, y0 + 44, '옆벽에 튕김', { size: 10.5, weight: 700, fill: C.orange, halo: '#fff' }) + t(x0 + 300, y0 + 128, '뒷벽에 튕김', { size: 10.5, weight: 700, fill: C.orange, halo: '#fff' });
    // 잔향 곡선
    var gx = 412, gy = 40, gw = 176, gh = 150;
    s += rect(gx - 8, gy - 8, gw + 16, gh + 70, '#fff', C.line, 10) + t(gx + gw / 2, gy + 8, '소리를 멈춘 뒤 줄어드는 모습', { size: 10.5, weight: 800 });
    var top = gy + 22, bot = gy + gh - 4, tx = function (sec) { return gx + 6 + sec / 8 * (gw - 12); }, ty = function (d) { return top + (-d) / 60 * (bot - top); };
    s += line(gx + 6, bot, gx + gw - 6, bot, C.line, 1.5) + line(gx + 6, top, gx + 6, bot, C.line, 1.5);
    s += line(tx(0), ty(0), tx(DEF_E), ty(-60), C.gray, 2.4) + line(tx(0), ty(0), tx(DEF_F), ty(-60), C.blue, 3);
    s += t(tx(DEF_E * 0.5) + 6, ty(-30) - 8, '빈 본당 ' + f1(DEF_E) + ' s', { size: 10, weight: 800, fill: C.gray, anchor: 'start', halo: '#fff' }) + t(tx(DEF_F) + 5, ty(-60) - 2, '회중 가득 ' + f1(DEF_F) + ' s', { size: 10, weight: 800, fill: C.blue, anchor: 'start', halo: '#fff' });
    s += t(gx + 6, bot + 16, '0', { size: 9.5, fill: C.sub }) + t(tx(4), bot + 16, '4', { size: 9.5, fill: C.sub }) + t(gx + gw - 6, bot + 16, '8 s', { size: 9.5, fill: C.sub }) + t(gx + 2, top + 4, '0 dB', { size: 9, fill: C.sub, anchor: 'end' });
    s += t(gx + gw / 2, bot + 34, 'RT60 = 울림이 사라지는 시간', { size: 10.5, weight: 700, fill: C.ink }) + t(gx + gw / 2, bot + 50, '(실습 예시 방 · 공부용 계산)', { size: 9.5, fill: C.sub });
    s += t(300, 290, '같은 본당도 사람이 차면 소리를 더 흡수해서 잔향이 짧아져요', { size: 11, weight: 700, fill: C.ink });
    return svg(600, 300, s, '예배당 평면에서 직접음 · 반사음 경로와 빈 본당 · 회중이 찬 본당의 잔향');
  };

  /* ---------------------------------------------------------------- 그림 1: 반사 · 흡음 · 확산 · 투과 + 흡음률 */
  V.prSurface = function () {
    var s = t(8, 16, '소리가 벽을 만나면 (교육용 그림)', { size: 11, fill: C.sub, anchor: 'start' });
    var cells = [['반사', '거울처럼 튕겨 나가요'], ['흡음', '재질 속으로 사라져요'], ['확산', '여러 방향으로 흩어져요'], ['투과', '벽 너머로 새어 나가요']];
    cells.forEach(function (c, i) {
      var bx = 8 + (i % 2) * 130, by = 26 + Math.floor(i / 2) * 104, wx = bx + 78;
      s += rect(bx, by, 124, 98, '#fff', C.line, 8);
      s += (i === 2 ? '<path d="M' + wx + ' ' + (by + 8) + 'l8 8l-8 8l8 8l-8 8l8 8l-8 8l8 8l-8 8V' + (by + 80) + 'h12V' + (by + 8) + 'Z" fill="#c4b5fd"/>' : rect(wx, by + 8, i === 1 ? 18 : 14, 72, i === 1 ? '#a7f3d0' : '#94a3b8', null, 2));
      s += arrow(bx + 10, by + 22, wx - 2, by + 44, C.orange, 2.4);
      if (i === 0) s += arrow(wx - 2, by + 46, bx + 12, by + 70, C.orange, 2.4);
      if (i === 1) s += '<path d="M' + (wx + 3) + ' ' + (by + 44) + 'q3 -6 6 0t6 0" stroke="' + C.red + '" stroke-width="2" fill="none"/>' + arrow(wx - 2, by + 48, bx + 34, by + 62, C.orange, 1.2);
      if (i === 2) { s += arrow(wx - 2, by + 46, bx + 14, by + 34, C.purple, 1.8) + arrow(wx - 2, by + 46, bx + 12, by + 58, C.purple, 1.8) + arrow(wx - 2, by + 46, bx + 26, by + 76, C.purple, 1.8); }
      if (i === 3) s += arrow(wx - 2, by + 46, bx + 20, by + 66, C.orange, 1.8) + arrow(wx + 16, by + 50, bx + 120, by + 60, C.teal, 1.6);
      s += t(bx + 10, by + 92, '<tspan font-weight="800">' + c[0] + '</tspan> ' + c[1], { size: 9.5, anchor: 'start', fill: C.ink });
    });
    // 흡음률 그래프
    var gx = 300, gy = 38, gw = 286, gh = 140, F = ['125', '250', '500', '1k', '2k', '4k'];
    var D = [['콘크리트 (타설)', [0.01, 0.01, 0.02, 0.02, 0.02, 0.03], C.gray], ['카펫 (콘크리트 위)', [0.02, 0.06, 0.15, 0.4, 0.6, 0.6], C.orange], ['벨루어 커튼', [0.07, 0.3, 0.5, 0.7, 0.7, 0.6], '#be123c'], ['사람 앉은 나무 의자', [0.4, 0.4, 0.7, 0.7, 0.8, 0.7], C.blue], ['유리섬유판 약 5 cm', [0.22, 0.82, 0.99, 0.99, 0.99, 0.99], C.green]];
    s += t(gx - 10, 16, '흡음률 α — 소리 높이(Hz)마다 달라요', { size: 11, weight: 800, anchor: 'start' });
    var X = function (i) { return gx + 14 + i * (gw - 28) / 5; }, Y = function (a) { return gy + gh - a * gh; };
    [0, 0.5, 1].forEach(function (a) { s += line(gx, Y(a), gx + gw, Y(a), '#e2e8f0', 1) + t(gx - 4, Y(a) + 4, a, { size: 9.5, fill: C.sub, anchor: 'end' }); });
    F.forEach(function (lb, i) { s += t(X(i), gy + gh + 14, lb, { size: 9.5, fill: C.sub }); });
    D.forEach(function (d) { s += poly(d[1].map(function (a, i) { return [X(i), Y(a)]; }), d[2], 2.6); d[1].forEach(function (a, i) { s += '<circle cx="' + f(X(i)) + '" cy="' + f(Y(a)) + '" r="2.6" fill="' + d[2] + '"/>'; }); });
    D.forEach(function (d, i) { var lx = gx - 10 + (i % 2) * 150, ly = gy + gh + 32 + Math.floor(i / 2) * 15; s += line(lx, ly - 4, lx + 14, ly - 4, d[2], 3) + t(lx + 18, ly, d[0], { size: 9.5, anchor: 'start' }); });
    s += t(gx - 10, 252, '출처: Hall 표(HyperPhysics) · 유리섬유판은 sengpielaudio 표', { size: 9, fill: C.sub, anchor: 'start' });
    return svg(600, 258, s, '반사 · 흡음 · 확산 · 투과와 재질별 흡음률 그래프');
  };

  /* ---------------------------------------------------------------- 그림 2: 직접음 · 반사음 도착 */
  V.prArrivals = function () {
    var s = t(8, 16, '한 자리에 도착하는 소리 (교육용 그림)', { size: 11, fill: C.sub, anchor: 'start' });
    var x0 = 10, y0 = 30, w = 220, h = 150;
    s += rect(x0, y0, w, h, '#fff', null, 2) + '<path d="M' + x0 + ' ' + y0 + 'H' + (x0 + w) + 'V' + (y0 + h) + 'H' + x0 + 'Z" fill="none" stroke="#64748b" stroke-width="5"/>';
    var Sx = x0 + 18, Sy = y0 + h / 2, Px = x0 + 90, Py = y0 + 104;
    s += poly([[Sx, Sy], [Sx + (Px - Sx) * (Sy - y0) / ((Sy - y0) + (Py - y0)), y0], [Px, Py]], C.orange, 2);
    s += poly([[Sx, Sy], [x0 + w, (Sy + Py) / 2 + 10], [Px, Py]], C.red, 2.2, ' stroke-dasharray="6 4"');
    s += arrow(Sx, Sy, Px - 5, Py - 4, C.teal, 3);
    s += rect(Sx - 6, Sy - 9, 12, 18, '#0f2747', null, 3) + '<circle cx="' + Px + '" cy="' + Py + '" r="8" fill="' + C.blue + '" stroke="#fff" stroke-width="2"/>';
    s += num(x0 + 34, y0 + 120, 1, C.teal) + t(x0 + 44, y0 + 124, '직접음', { size: 10.5, weight: 800, fill: C.teal, anchor: 'start', halo: '#fff' }) + num(x0 + 96, y0 + 18, 2, C.orange) + t(x0 + 106, y0 + 22, '초기 반사', { size: 10.5, weight: 800, fill: C.orange, anchor: 'start', halo: '#fff' }) + num(x0 + 140, y0 + 134, 3, C.red) + t(x0 + 150, y0 + 138, '뒷벽 반사', { size: 10.5, weight: 800, fill: C.red, anchor: 'start', halo: '#fff' });
    s += t(x0, y0 + h + 18, '길이 1 m 더 돌아오면 약 2.9 ms 늦어요', { size: 10, fill: C.ink, anchor: 'start', weight: 700 }) + t(x0, y0 + h + 34, '(소리 빠르기 343 m/s, 20 °C)', { size: 9.5, fill: C.sub, anchor: 'start' });
    // 에코그램
    var gx = 262, gy = 50, gw = 326, gh = 122, T = 160, X = function (ms) { return gx + ms / T * gw; }, Y = function (d) { return gy + gh - (d + 36) / 36 * gh; };
    s += t(gx, 18, '언제, 얼마나 크게 도착할까', { size: 11, weight: 800, anchor: 'start' });
    s += '<rect x="' + gx + '" y="' + gy + '" width="' + f(X(40) - gx) + '" height="' + gh + '" fill="#ecfdf5"/>' + '<rect x="' + f(X(50)) + '" y="' + gy + '" width="' + f(gx + gw - X(50)) + '" height="' + gh + '" fill="#fef2f2"/>';
    s += t(X(20), gy - 6, '하나로 들려요', { size: 9.5, weight: 800, fill: C.green }) + t(X(105), gy - 6, '말은 50 ms 넘으면 메아리로', { size: 9.5, weight: 800, fill: C.red });
    s += line(gx, gy + gh, gx + gw, gy + gh, C.ink, 1.4);
    [0, 40, 50, 100, 150].forEach(function (ms) { s += line(X(ms), gy + gh, X(ms), gy + gh + 4, C.ink, 1) + t(X(ms), gy + gh + 16, ms + (ms === 150 ? ' ms' : ''), { size: 9.5, fill: C.sub }); });
    var tail = ''; for (var ms = 24; ms <= 158; ms += 2.2) { var d = -9 - (ms - 24) / 1000 * 60 / 1.6 - ((ms * 7) % 5); tail += line(X(ms), gy + gh, X(ms), Y(d), '#cbd5e1', 1.4); }
    s += tail + line(X(0.6), gy + gh, X(0.6), Y(0), C.teal, 5) + [[7, -5], [12, -7], [17, -8], [26, -10]].map(function (r) { return line(X(r[0]), gy + gh, X(r[0]), Y(r[1]), C.orange, 3.4); }).join('') + line(X(118), gy + gh, X(118), Y(-8), C.red, 4);
    s += num(X(0.6) + 12, Y(0) + 10, 1, C.teal) + num(X(16), Y(-5) - 10, 2, C.orange) + num(X(118) + 12, Y(-8) + 10, 3, C.red);
    s += t(X(70), Y(-24), '잔향 — 촘촘히 이어지며 줄어요', { size: 9.5, fill: C.sub, halo: '#fff' });
    s += t(gx, gy + gh + 34, '1 과 2 는 하나로 들리고, 방향은 1 쪽으로 느껴요 (선행음 효과)', { size: 10, fill: C.ink, anchor: 'start', weight: 700 }) + t(gx, gy + gh + 50, '3 처럼 늦고 큰 반사는 따로 떨어진 메아리로 들려요', { size: 10, fill: C.ink, anchor: 'start', weight: 700 });
    return svg(600, 236, s, '직접음 · 초기 반사 · 잔향 · 메아리의 도착 시간');
  };

  /* ---------------------------------------------------------------- 그림 3: RT60 · 세이빈 · 권장 범위 */
  V.prRt60 = function () {
    var s = '', gx = 40, gy = 30, gw = 230, gh = 130, T = 3, X = function (sec) { return gx + sec / T * gw; }, Y = function (d) { return gy + (-d) / 70 * gh; };
    s += t(8, 16, 'RT60: 소리를 멈춘 뒤 울림이 사라질(60 dB 줄) 때까지 걸리는 시간', { size: 11, fill: C.sub, anchor: 'start' });
    s += line(gx, gy, gx, gy + gh, C.ink, 1.4) + line(gx, gy + gh, gx + gw, gy + gh, C.ink, 1.4);
    [0, -20, -40, -60].forEach(function (d) { s += line(gx, Y(d), gx + gw, Y(d), '#eef2f7', 1) + t(gx - 4, Y(d) + 4, d === 0 ? '0 dB' : '−' + (-d), { size: 9.5, fill: C.sub, anchor: 'end' }); });
    [0, 1, 2, 3].forEach(function (sec) { s += t(X(sec), gy + gh + 14, sec + ' s', { size: 9.5, fill: C.sub }); });
    var noisy = function (rt, col, w) { var pts = []; for (var i = 0; i <= 60; i++) { var sec = i / 60 * Math.min(T, rt * 1.12), d = -60 * sec / rt + Math.sin(i * 2.3) * 1.6; pts.push([X(sec), Y(Math.max(-69, d))]); } return poly(pts, col, w); };
    s += '<rect x="' + gx + '" y="' + gy + '" width="' + f(X(0.1) - gx) + '" height="' + gh + '" fill="#fde68a" opacity=".6"/>' + t(X(0.05), gy - 4, '소리 멈춤', { size: 9, fill: C.amber, anchor: 'start' });
    s += noisy(1.0, C.teal, 2.4) + noisy(2.2, C.purple, 2.4);
    s += line(X(1.0), Y(-60), X(1.0), gy + gh, C.teal, 1.4, '3 3') + line(X(2.2), Y(-60), X(2.2), gy + gh, C.purple, 1.4, '3 3') + line(gx, Y(-60), X(2.4), Y(-60), C.red, 1.4, '5 3');
    s += t(X(1.0) + 3, Y(-50), '1.0 s', { size: 10, weight: 800, fill: C.teal, anchor: 'start', halo: '#fff' }) + t(X(2.2) + 3, Y(-36), '2.2 s', { size: 10, weight: 800, fill: C.purple, anchor: 'start', halo: '#fff' });
    s += rect(8, 186, 282, 48, '#eff6ff', '#93c5fd', 8) + t(149, 206, '방이 클수록 길고, 많이 먹을수록 짧아요', { size: 12.5, weight: 900, fill: C.blue }) + t(149, 224, '세이빈 공식: 0.161 × 부피 ÷ 흡음력', { size: 10.5, fill: C.ink });
    // 권장 범위
    var bx = 336, bw = 196, BX = function (sec) { return bx + sec / 3 * bw; };
    s += t(bx - 18, 30, '예배 공간에 알맞은 울림 시간', { size: 11, weight: 800, anchor: 'start' });
    [['설교 · 강의', 0.8, 1.2, C.teal, '0.8–1.2 s'], ['현대 예배', 1.0, 1.5, C.blue, '1.0–1.5 s'], ['전통 성가대 예배', 1.5, 2.5, C.purple, '1.5–2.5 s'], ['오르간 음악', 2.0, 3.0, '#9333ea', '2.0–3.0 s']].forEach(function (r, i) { var y = 44 + i * 30;
      s += t(bx - 18, y + 9, r[0], { size: 10, anchor: 'start', weight: 700 }) + rect(BX(r[1]), y + 13, BX(r[2]) - BX(r[1]), 11, r[3], null, 4) + t(BX(r[2]) + 5, y + 22, r[4], { size: 9.5, weight: 800, fill: r[3], anchor: 'start' }); });
    s += line(bx, 166, bx + bw, 166, C.line, 1.2); [0, 1, 2, 3].forEach(function (sec) { s += t(BX(sec), 180, sec + ' s', { size: 9.5, fill: C.sub }); });
    s += t(bx - 18, 204, '자료마다 조금 달라요 (Riedel: 현대 1.4–1.8 s)', { size: 9.5, fill: C.sub, anchor: 'start' });
    s += t(bx - 18, 222, '실습 예시 방: 빈 ' + f1(DEF_E) + ' s → 회중 찬 ' + f1(DEF_F) + ' s (교육용 계산)', { size: 10, fill: C.ink, anchor: 'start', weight: 700 });
    return svg(600, 240, s, 'RT60 잔향 곡선, 세이빈 공식, 예배 공간 권장 잔향 범위');
  };

  /* ---------------------------------------------------------------- 그림 4: 임계 거리 */
  V.prCritical = function () {
    var s = t(8, 16, '멀어질 때 곧장 온 소리와 울림 (교육용 그림, 임계 거리 2 m 인 예)', { size: 11, fill: C.sub, anchor: 'start' });
    var gx = 52, gy = 30, gw = 330, gh = 150, d0 = 0.125, d1 = 16, Dc = 2;
    var X = function (d) { return gx + Math.log(d / d0) / Math.log(d1 / d0) * gw; }, Y = function (v) { return gy + (24 - v) / 48 * gh; };
    s += '<rect x="' + gx + '" y="' + gy + '" width="' + f(X(Dc) - gx) + '" height="' + gh + '" fill="#ecfeff"/><rect x="' + f(X(Dc)) + '" y="' + gy + '" width="' + f(gx + gw - X(Dc)) + '" height="' + gh + '" fill="#f5f3ff"/>';
    s += line(gx, gy + gh, gx + gw, gy + gh, C.ink, 1.4) + line(gx, gy, gx, gy + gh, C.ink, 1.4);
    [0.125, 0.25, 0.5, 1, 2, 4, 8, 16].forEach(function (d) { s += t(X(d), gy + gh + 14, d < 1 ? String(d).replace('0.', '.') : d, { size: 9.5, fill: C.sub }); });
    s += t(gx + gw, gy + gh + 28, '거리 (m) · 칸마다 두 배', { size: 9.5, fill: C.sub, anchor: 'end' });
    s += line(X(d0), Y(20 * Math.log10(Dc / d0)), X(d1), Y(20 * Math.log10(Dc / d1)), C.teal, 3) + line(gx, Y(0), gx + gw, Y(0), C.purple, 3, '7 4');
    s += t(X(0.3), Y(20 * Math.log10(Dc / 0.3)) - 8, '직접음 — 거리 두 배마다 −6 dB', { size: 10, weight: 800, fill: C.teal, anchor: 'start', halo: '#fff' });
    s += t(X(5), Y(0) - 8, '잔향음 — 어디서나 비슷', { size: 10, weight: 800, fill: C.purple, halo: '#fff' });
    s += '<circle cx="' + f(X(Dc)) + '" cy="' + f(Y(0)) + '" r="5" fill="' + C.red + '"/>' + line(X(Dc), gy, X(Dc), gy + gh, C.red, 1.4, '3 3') + t(X(Dc), gy - 4, '임계 거리', { size: 10.5, weight: 800, fill: C.red });
    s += t(X(0.5), gy + gh - 10, '직접음이 커요 → 또렷', { size: 10, weight: 800, fill: C.teal, halo: '#ecfeff' }) + t(X(7), gy + gh - 10, '잔향이 커요 → 흐릿', { size: 10, weight: 800, fill: C.purple, halo: '#f5f3ff' });
    s += rect(400, 30, 192, 74, '#eff6ff', '#93c5fd', 8) + t(496, 52, '임계 거리는 이렇게 바뀌어요', { size: 11.5, weight: 900, fill: C.blue }) + t(496, 72, '방이 클수록 → 길어져요', { size: 10.5, fill: C.ink }) + t(496, 90, '울림이 길수록 → 짧아져요', { size: 10.5, fill: C.ink });
    s += rect(400, 114, 192, 96, '#fff', C.line, 8) + t(496, 134, '마이크를 입 가까이 두면', { size: 11, weight: 800 });
    ['거리 1/10 → 직접음 +20 dB', '방 울림 · 스피커 소리는 그대로', '→ 목소리가 또렷하고', '하울링에도 강해져요'].forEach(function (x, i) { s += t(496, 154 + i * 15, x, { size: 10, fill: i < 2 ? C.ink : C.green, weight: i < 2 ? 500 : 700 }); });
    return svg(600, 222, s, '거리에 따른 직접음과 잔향음, 임계 거리');
  };

  /* ---------------------------------------------------------------- 그림 5: 룸 모드 · 플러터 에코 */
  V.prModes = function () {
    var s = t(8, 16, '마주 보는 두 벽 사이에 갇힌 저음 (교육용 그림)', { size: 11, fill: C.sub, anchor: 'start' });
    var x0 = 34, x1 = 304, ym = 96, A = 52;
    s += rect(x0 - 14, 30, 14, 132, '#94a3b8', null, 2) + rect(x1, 30, 14, 132, '#94a3b8', null, 2);
    var env = function (n, sign) { var p = []; for (var i = 0; i <= 80; i++) { var u = i / 80; p.push([x0 + u * (x1 - x0), ym - sign * A * Math.abs(Math.cos(Math.PI * n * u))]); } return p; };
    s += '<path d="' + env(1, 1).concat(env(1, -1).reverse()).map(function (p, i) { return (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); }).join('') + 'Z" fill="' + C.blue + '" opacity=".14"/>';
    s += poly(env(1, 1), C.blue, 2.6) + poly(env(1, -1), C.blue, 2.6) + poly(env(2, 1), C.orange, 1.8, ' stroke-dasharray="5 4"');
    s += t(x0 + 30, 40, '1차: 벽 사이 = 반 파장', { size: 10, weight: 800, fill: C.blue, anchor: 'start' }) + t(x1 - 6, 40, '2차 (2배 높이)', { size: 10, weight: 800, fill: C.orange, anchor: 'end' });
    s += '<circle cx="' + (x0 + 16) + '" cy="' + (ym) + '" r="7" fill="' + C.blue + '"/>' + t(x0 + 4, ym + 66, '벽 가까이: 크게', { size: 10, weight: 800, fill: C.blue, anchor: 'start' });
    s += '<circle cx="' + ((x0 + x1) / 2) + '" cy="' + ym + '" r="7" fill="#fff" stroke="' + C.blue + '" stroke-width="2.4"/>' + t((x0 + x1) / 2, ym + 66, '가운데(마디): 작게', { size: 10, weight: 800, fill: C.blue });
    s += line(x0, 176, x1, 176, C.ink, 1.2) + t(x0 + (x1 - x0) * 0.8, 172, '두 벽 사이', { size: 10, weight: 800 });
    s += rect(20, 190, 296, 44, '#eff6ff', '#93c5fd', 8) + t(168, 208, '가장 낮은 저음 = 343 ÷ (벽 사이 × 2)', { size: 12.5, weight: 900, fill: C.blue }) + t(168, 226, '벽 사이 8 m → 약 21 · 43 · 64 Hz', { size: 10.5, fill: C.ink });
    // 플러터
    var fx = 340, fw = 250;
    s += t(fx, 30, '플러터 에코 — 평행하고 단단한 두 벽', { size: 11, weight: 800, anchor: 'start' });
    [[46, false], [146, true]].forEach(function (r) { var y = r[0], zig = [], n = 9;
      s += rect(fx, y, fw, 8, '#94a3b8', null, 2) + rect(fx, y + 72, fw, 8, r[1] ? C.green : '#94a3b8', null, 2);
      for (var i = 0; i <= n; i++) zig.push([fx + 14 + i * (fw - 28) / n, i % 2 ? y + 70 : y + 10]);
      s += poly(zig, C.orange, 2.2, r[1] ? ' opacity=".3" stroke-dasharray="4 4"' : '');
      s += t(fx + fw / 2, y + 46, r[1] ? '한쪽에 흡음 · 확산 → 되풀이가 사라져요' : '「따다다닥」 빠르게 되풀이', { size: 10, weight: 800, fill: r[1] ? C.green : C.orange, halo: '#fff' }); });
    return svg(600, 240, s, '두 벽 사이 축 모드의 저음 분포와 플러터 에코');
  };

  /* ---------------------------------------------------------------- 그림 6: 공간과 확성 */
  V.prPa = function () {
    var s = t(8, 16, '본당 단면 — 스피커를 어디로 겨눌까 (교육용 그림)', { size: 11, fill: C.sub, anchor: 'start' });
    function room(x, good) {
      var w = 284, y = 30, h = 160, r = '';
      r += rect(x, y, w, h, '#fff', C.line, 6) + rect(x, y + h - 12, w, 12, '#e2e8f0', null, 0);
      for (var i = 0; i < 9; i++) r += rect(x + 90 + i * 20, y + h - 26, 10, 14, good ? '#93c5fd' : '#cbd5e1', null, 2) + '<circle cx="' + (x + 95 + i * 20) + '" cy="' + (y + h - 31) + '" r="4" fill="' + (good ? '#60a5fa' : '#cbd5e1') + '"/>';
      r += rect(x + w - 8, y + 10, 8, h - 22, good ? C.green : '#94a3b8', null, 1);
      var sx = x + 40, sy = y + 34;
      r += rect(x + 8, y + h - 40, 50, 28, '#fef3c7', null, 3) + t(x + 33, y + h - 22, '강단', { size: 9.5, fill: C.amber, weight: 700 });
      r += line(x + 46, y + h - 40, x + 46, y + h - 62, '#334155', 2) + '<circle cx="' + (x + 46) + '" cy="' + (y + h - 64) + '" r="3.5" fill="#334155"/>';
      if (good) {
        r += '<path d="M' + sx + ' ' + sy + 'L' + (x + 290 - 20) + ' ' + (y + h - 30) + 'L' + (x + 100) + ' ' + (y + h - 30) + 'Z" fill="' + C.teal + '" opacity=".16"/>';
        r += arrow(sx, sy, x + 190, y + h - 40, C.teal, 2.8);
        r += t(x + w / 2 + 10, y + 26, '회중 쪽으로 겨눠요', { size: 10.5, weight: 800, fill: C.teal });
        r += t(x + w - 14, y + 70, '뒷벽 흡음', { size: 9.5, weight: 800, fill: C.green, anchor: 'end' });
      } else {
        r += '<path d="M' + sx + ' ' + sy + 'L' + (x + w - 8) + ' ' + (y + 6) + 'L' + (x + w - 8) + ' ' + (y + 96) + 'Z" fill="' + C.red + '" opacity=".12"/>';
        r += arrow(sx, sy, x + w - 10, y + 40, C.red, 2.6) + arrow(x + w - 10, y + 44, x + 56, y + h - 64, C.orange, 2) + arrow(sx + 30, sy - 6, x + 150, y + 2, C.red, 2);
        r += t(x + 186, y + 100, '벽 · 천장을 때리면', { size: 10.5, weight: 800, fill: C.red, halo: '#fff' }) + t(x + 186, y + 116, '메아리 · 잔향 · 하울링 ↑', { size: 10.5, weight: 800, fill: C.red, halo: '#fff' });
        r += t(x + 58, y + 74, '마이크로', { size: 9.5, weight: 700, fill: C.orange, anchor: 'start', halo: '#fff' });
      }
      r += rect(sx - 8, sy - 12, 16, 24, '#0f2747', null, 3);
      r += t(x + w / 2, y + h + 18, good ? '좋은 예 — 필요한 곳(회중)에만' : '피할 예 — 벽 · 천장으로 새는 소리', { size: 11, weight: 800, fill: good ? C.green : C.red });
      return r;
    }
    s += room(8, true) + room(308, false);
    s += t(300, 232, '흡음재는 메아리가 나오는 면(예: 뒷벽)부터 · 확산재는 울림은 남기고 메아리만 흩어요', { size: 10, fill: C.ink, weight: 700 });
    return svg(600, 240, s, '스피커를 회중 쪽으로 겨눈 예와 벽 · 천장을 때리는 예');
  };

  /* =========================================================================== 2026-11-04 「그림으로 보기」 — 용어 · 이론 · 문제에 붙이는 쉬운 그림 */
  function svgM(w, h, body, label) { return svg(w, h, body, label).replace('<svg class="mod-svg"', '<svg class="mod-svg" style="min-width:0"'); }   // 작은 그림: 휴대폰에서 가로로 밀리지 않게(글자 13 이상)
  function okx(x, y, ok) { return '<circle cx="' + x + '" cy="' + y + '" r="11" fill="' + (ok ? C.green : C.red) + '"/>' + (ok ? '<circle cx="' + x + '" cy="' + y + '" r="5.5" fill="none" stroke="#fff" stroke-width="2.4"/>' : '<path d="M' + (x - 5) + ' ' + (y - 5) + 'l10 10M' + (x + 5) + ' ' + (y - 5) + 'l-10 10" stroke="#fff" stroke-width="2.4"/>'); }
  function spkR(x, y, a) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (a || 0) + ')"><rect x="-10" y="-9" width="14" height="18" rx="3" fill="#1e293b"/><path d="M4 -6L12 -11V11L4 6Z" fill="#334155"/></g>'; }

  /* 용어 「흡음률 α」: 0 에서 1 까지 자 */
  V.prTermAlpha = function () {
    var X0 = 24, X1 = 336, X = function (a) { return X0 + a * (X1 - X0); };
    var s = t(180, 16, '흡음률 α — 소리를 먹는 몫 (500 Hz)', { size: 13, weight: 800 });
    s += '<defs><linearGradient id="prAlG" x1="0" x2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#6ee7b7"/></linearGradient></defs><rect x="' + X0 + '" y="52" width="' + (X1 - X0) + '" height="14" rx="7" fill="url(#prAlG)"/>';
    [[0.02, '콘크리트', 0], [0.15, '카펫', 1], [0.5, '커튼', 0], [0.8, '사람 앉은 의자', 1]].forEach(function (m) {
      var x = X(m[0]), up = m[2]; s += '<circle cx="' + f(x) + '" cy="59" r="5" fill="' + C.ink + '"/>' + line(x, up ? 52 : 66, x, up ? 40 : 78, C.ink, 1.4);
      s += t(x, up ? 35 : 92, m[1] + ' ' + m[0], { size: 13.5, weight: 700, anchor: m[0] < 0.1 ? 'start' : m[0] > 0.7 ? 'end' : 'middle' });
    });
    s += t(X0, 114, '0 = 다 튕겨요(반사)', { size: 13, weight: 800, fill: C.gray, anchor: 'start' }) + t(X1, 114, '1 = 다 먹어요(흡수)', { size: 13, weight: 800, fill: C.green, anchor: 'end' });
    return svgM(360, 122, s, '흡음률 0 에서 1 까지 자 위에 콘크리트, 카펫, 커튼, 사람 앉은 의자');
  };

  /* 용어 「RT60」: 목욕탕 vs 이불 많은 방 */
  V.prTermBath = function () {
    var s = '';
    [[4, '목욕탕 (단단한 타일)', '「음-」이 오래 울려요', 150, C.blue], [184, '이불 · 커튼 많은 방', '금방 조용해져요', 40, C.green]].forEach(function (p) {
      var x = p[0], d = '';
      s += rect(x, 4, 172, 112, '#fff', C.line) + t(x + 86, 24, p[1], { size: 13, weight: 800, fill: p[4] });
      for (var i = 0; i <= 140; i++) { var u = i, a = 26 * Math.exp(-u / (p[3] / 3)) ; d += (i ? 'L' : 'M') + (x + 16 + u) + ' ' + f(66 - a * Math.sin(u * 0.9)); }
      s += '<path d="M' + (x + 16) + ' 66H' + (x + 158) + '" stroke="#e2e8f0"/><path d="' + d + '" fill="none" stroke="' + p[4] + '" stroke-width="1.8"/>';
      s += t(x + 86, 108, p[2], { size: 13, weight: 700 });
    });
    return svgM(360, 120, s, '목욕탕은 소리가 오래 울리고 이불 많은 방은 금방 조용해지는 그림');
  };

  /* 용어 「선행음 효과」: 먼저 온 쪽에서 들려요 */
  V.prTermHaas = function () {
    var X0 = 20, X = function (ms) { return X0 + ms * 4.6; };
    var s = t(180, 16, '같은 소리가 두 번 오면?', { size: 13, weight: 800 });
    s += '<path d="M' + X0 + ' 84H' + X(70) + '" stroke="#94a3b8" stroke-width="1.5"/>';
    s += '<rect x="' + f(X(0) - 4) + '" y="34" width="8" height="50" rx="2" fill="' + C.teal + '"/>' + t(X(0) + 8, 44, '먼저 온 소리', { size: 13.5, weight: 800, fill: C.teal, anchor: 'start' });
    s += '<rect x="' + f(X(20) - 4) + '" y="50" width="8" height="34" rx="2" fill="' + C.orange + '"/>' + t(X(20) + 8, 62, '20 ms 뒤', { size: 13.5, weight: 800, fill: C.orange, anchor: 'start' });
    s += '<rect x="' + f(X(50)) + '" y="30" width="' + f(X(70) - X(50)) + '" height="54" fill="#fee2e2" opacity=".7"/>' + t(X(60), 46, '50 ms 넘으면', { size: 13, weight: 700, fill: C.red }) + t(X(60), 62, '메아리', { size: 13, weight: 800, fill: C.red });
    [0, 20, 50].forEach(function (ms) { s += t(X(ms), 98, ms + ' ms', { size: 13, fill: C.sub }); });
    s += t(180, 116, '귀: 하나로 듣고, 먼저 온 쪽에서 난다고 느껴요', { size: 13, weight: 700 });
    return svgM(360, 122, s, '먼저 온 소리와 20 ms 늦은 소리는 하나로 들리고 50 ms 를 넘으면 메아리');
  };

  /* 이론 1: 오목한 면은 소리를 모으고(초점), 볼록 · 울퉁불퉁한 면은 흩어요 */
  V.prFocus = function () {
    var s = '';
    [[4, false, '오목한 벽 · 둥근 천장', '한 곳에 모여요 (음향 초점)'], [204, true, '볼록 · 울퉁불퉁한 면', '고르게 흩어져요 (확산)']].forEach(function (p) {
      var x = p[0], sx = x + 30, sy = 92;
      s += rect(x, 4, 192, 176, '#fff', C.line) + t(x + 96, 24, p[2], { size: 13, weight: 800, fill: p[1] ? C.green : C.red });
      s += spkR(sx, sy, 0);
      if (!p[1]) {
        s += '<path d="M' + (x + 160) + ' 40Q' + (x + 196) + ' 92 ' + (x + 160) + ' 144" stroke="#64748b" stroke-width="6" fill="none"/>';
        [-36, -18, 0, 18, 36].forEach(function (dy) { var hx = x + 168 - Math.abs(dy) * 0.25; s += line(sx + 12, sy, hx, sy + dy * 1.25, C.orange, 1.6, null, 0.8) + line(hx, sy + dy * 1.25, x + 92, sy + 4, C.red, 1.6, '4 3'); });
        s += '<circle cx="' + (x + 92) + '" cy="' + (sy + 4) + '" r="9" fill="' + C.red + '" opacity=".85"/>' + t(x + 92, sy + 30, '여기만 커요', { size: 13, weight: 800, fill: C.red, halo: '#fff' });
      } else {
        s += '<path d="M' + (x + 166) + ' 40Q' + (x + 146) + ' 92 ' + (x + 166) + ' 144" stroke="#64748b" stroke-width="6" fill="none"/>';
        [-36, -18, 0, 18, 36].forEach(function (dy) { var hx = x + 156 + Math.abs(dy) * 0.12, hy = sy + dy * 1.25, ex = x + 96, ey = sy + dy * 3.2; s += line(sx + 12, sy, hx, hy, C.orange, 1.6, null, 0.8) + arrow(hx, hy, ex, Math.max(40, Math.min(150, ey)), C.green, 1.6); });
      }
      s += t(x + 96, 168, p[3], { size: 13, weight: 800, fill: p[1] ? C.green : C.red }) + okx(x + 176, 22, p[1]);
    });
    return svgM(400, 184, s, '오목한 벽은 소리를 한 곳에 모으고 볼록한 면은 고르게 흩는 그림');
  };

  /* 이론 3: 빈 예배당 vs 회중이 찬 예배당 */
  V.prEmptyFull = function () {
    var s = '';
    [[4, '빈 예배당 (리허설)', '울림이 길어요', 1, C.blue, false], [204, '회중이 찬 예배당', '울림이 짧아요 · 더 메말라요', 0.4, C.green, true]].forEach(function (p) {
      var x = p[0];
      s += rect(x, 4, 192, 160, '#fff', C.line) + t(x + 96, 24, p[1], { size: 13, weight: 800, fill: p[4] });
      for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) { var cx = x + 30 + c * 26, cy = 50 + r * 20; s += '<rect x="' + (cx - 9) + '" y="' + (cy + 4) + '" width="18" height="6" rx="2" fill="#cbd5e1"/>' + (p[5] ? '<circle cx="' + cx + '" cy="' + (cy - 2) + '" r="6" fill="#fdba74"/>' : ''); }
      var d = '', L = 160 * p[3]; for (var i = 0; i <= 160; i++) { var a = 18 * Math.max(0, 1 - i / L); d += (i ? 'L' : 'M') + (x + 16 + i) + ' ' + f(124 - a * Math.sin(i * 0.8)); }
      s += '<path d="M' + (x + 16) + ' 124H' + (x + 176) + '" stroke="#e2e8f0"/><path d="' + d + '" fill="none" stroke="' + p[4] + '" stroke-width="1.8"/>';
      s += t(x + 96, 156, p[2], { size: 13, weight: 700 });
    });
    s += t(200, 186, '사람과 옷이 소리를 먹어서 잔향(RT60)이 짧아져요', { size: 13, weight: 700, fill: C.ink });
    return svgM(400, 194, s, '빈 예배당은 울림이 길고 회중이 찬 예배당은 울림이 짧은 전후 비교 그림');
  };

  /* 이론 4: 마이크를 입 가까이 ○ / 멀리 × */
  V.prMicNear = function () {
    var s = '';
    [[4, true, '입 가까이 (3 cm)', '목소리가 또렷해요'], [204, false, '입에서 멀리 (50 cm)', '울림에 묻혀 흐릿해요']].forEach(function (p) {
      var x = p[0];
      s += rect(x, 4, 192, 176, '#fff', C.line) + t(x + 88, 24, p[2], { size: 13, weight: 800, fill: p[1] ? C.green : C.red }) + okx(x + 176, 22, p[1]);
      s += '<circle cx="' + (x + 30) + '" cy="58" r="14" fill="#fde68a" stroke="' + C.amber + '" stroke-width="1.5"/>';
      var mx = p[1] ? x + 50 : x + 120; s += '<rect x="' + mx + '" y="53" width="30" height="10" rx="5" fill="#334155"/>' + line(x + 44, 58, mx, 58, C.teal, 1.6, '3 3');
      [[p[1] ? 74 : 30, '목소리(직접음)', C.teal, 92], [30, '방 울림(잔향)', C.purple, 122]].forEach(function (b) {
        s += t(x + 12, b[3] - 4, b[1], { size: 13, weight: 700, fill: b[2], anchor: 'start' }) + '<rect x="' + (x + 12) + '" y="' + b[3] + '" width="' + (b[0] * 2.2) + '" height="12" rx="3" fill="' + b[2] + '"/>';
      });
      s += t(x + 96, 166, p[3], { size: 13, weight: 800, fill: p[1] ? C.green : C.red });
    });
    return svgM(400, 184, s, '마이크가 입 가까이 있으면 목소리가 울림보다 훨씬 크고, 멀면 울림에 묻히는 비교 그림');
  };

  /* 이론 6: 말이 울려서 안 들릴 때 고치는 순서 */
  V.prFixSteps = function () {
    var steps = [['스피커를 회중 쪽으로', '벽 · 천장을 덜 때려요', C.teal], ['마이크를 입 가까이', '목소리를 크게 받아요', C.blue], ['문제 면에 흡음 · 확산', '뒷벽 · 오목한 면부터', C.green], ['그다음 EQ · 리버브', '콘솔은 마지막에 다듬어요', C.purple]];
    var s = t(200, 16, '말이 울려서 잘 안 들릴 때 — 해 볼 순서', { size: 13.5, weight: 800 });
    steps.forEach(function (st, i) {
      var x = 4 + (i % 2) * 200, y = 28 + Math.floor(i / 2) * 76;
      s += rect(x, y, 192, 66, '#fff', st[2], 10) + '<circle cx="' + (x + 20) + '" cy="' + (y + 22) + '" r="10" fill="' + st[2] + '"/>' + t(x + 20, y + 26.5, String(i + 1), { size: 13, weight: 900, fill: '#fff' }) + t(x + 34, y + 27, st[0], { size: 13, weight: 800, fill: st[2], anchor: 'start' }) + t(x + 34, y + 49, st[1], { size: 13, fill: C.sub, anchor: 'start' });
    });
    return svgM(400, 182, s, '스피커 겨누기, 마이크 가까이, 흡음과 확산, 마지막으로 EQ 와 리버브 순서');
  };

  /* 확인 문제 3: 뒷벽 메아리 상황 */
  V.prEchoPlan = function () {
    var s = rect(20, 10, 360, 140, '#f8fafc', null, 4) + line(20, 10, 20, 150, C.gray, 4) + line(380, 10, 380, 150, C.red, 6);
    s += t(28, 24, '강단', { size: 13.5, weight: 800, fill: C.gray, anchor: 'start' }) + t(374, 24, '단단한 뒷벽', { size: 13.5, weight: 800, fill: C.red, anchor: 'end', halo: '#f8fafc' });
    s += spkR(40, 52, 15);
    for (var r = 0; r < 5; r++) for (var c = 0; c < 8; c++) s += '<rect x="' + (110 + c * 30) + '" y="' + (44 + r * 20) + '" width="18" height="8" rx="2" fill="#cbd5e1"/>';
    s += '<circle cx="128" cy="100" r="8" fill="' + C.blue + '"/>' + t(128, 124, '앞쪽 자리', { size: 13.5, weight: 800, fill: C.blue, halo: '#f8fafc' });
    s += arrow(52, 56, 120, 96, C.teal) + t(84, 92, '①', { size: 13, weight: 800, fill: C.teal });
    s += arrow(52, 54, 376, 72, C.orange) + arrow(376, 74, 138, 98, C.orange) + t(300, 100, '② 늦게 되돌아와요', { size: 13.5, weight: 800, fill: C.orange, halo: '#f8fafc' });
    s += t(200, 168, '① 직접음  ② 뒷벽에서 튕겨 온 소리', { size: 13.5, fill: C.sub });
    return svgM(400, 176, s, '강단 스피커 소리가 단단한 뒷벽에서 튕겨 앞쪽 자리로 늦게 되돌아오는 그림');
  };

  /* =========================================================================== 실습: 예배당 평면 (STASims.roomLab) */
  var VBW = 614, VBH = 470, OX = 34, OY = 32, KP = 13.5;        // 평면: 길이 L → 오른쪽(최대 40 m), 폭 W → 아래(최대 30 m)
  var LMIN = 8, LMAX = 40, WMIN = 6, WMAX = 30, HMIN = 5, HMAX = 12;
  var MS = { w: 600, h: 170, x0: 92, x1: 580, dmin: 0.03, dmax: 10, top: 30, bot: 116 };   // 마이크 거리 띠(로그 눈금)
  var ECHO_MS = 50, ECHO_DB = -15;

  function injectCss() {
    if (document.getElementById('sta-mod-physroom-css')) return;
    var s = document.createElement('style'); s.id = 'sta-mod-physroom-css';
    s.textContent = [
      '.sim-pr{display:flex;flex-direction:column;gap:10px;min-width:0}',
      '.sim-pr-tools{display:grid;gap:7px}',
      '.sim-pr-row{display:flex;flex-wrap:wrap;gap:5px;align-items:center;min-width:0}',
      '.sim-pr-row>.lb{font-size:.74rem;font-weight:800;color:#334155;min-width:84px}',
      '.sim-pr-row>.lb small{display:block;font-weight:500;color:#64748b;font-size:.66rem}',
      '.sim-pr-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;border:1px solid #94a3b8;background:#fff;font:inherit;font-size:.74rem;font-weight:700;color:#0f2747;cursor:pointer}',
      '.sim-pr-chip i{width:10px;height:10px;border-radius:3px;flex:none}',
      '.sim-pr-chip small{font-weight:500;color:#64748b}',
      '.sim-pr-chip[aria-pressed=true]{background:#0f2747;color:#fff;border-color:#0f2747}.sim-pr-chip[aria-pressed=true] small{color:#cbd5e1}',
      '.sim-pr-chip:focus-visible{outline:2px solid #22d3ee;outline-offset:2px}',
      '.sim-pr-body{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:12px;align-items:start}',
      '.sim-pr-main{display:flex;flex-direction:column;gap:10px;min-width:0}',
      '.sim-pr-svg{display:block;width:100%;height:auto;touch-action:none;-webkit-user-select:none;user-select:none}',
      '.sim-pr-svg [data-wall]{cursor:pointer}.sim-pr-svg.dragging{cursor:grabbing}',
      '.sim-pr-msg{font-size:.78rem;line-height:1.5;margin:0;padding:8px 10px;border-radius:8px;background:#f1f5f9;color:#334155}',
      '.sim-pr-msg.ok{background:#ecfdf5;color:#047857;font-weight:700}.sim-pr-msg.bad{background:#fef2f2;color:#b91c1c;font-weight:700}',
      '.sim-pr-big{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}.sim-pr-big b{font-size:1.6rem;font-weight:900;color:#0f2747;font-variant-numeric:tabular-nums}.sim-pr-big span{font-size:.76rem;color:#64748b}',
      '.sim-pr-tbl{width:100%;border-collapse:collapse;font-size:.7rem;margin-top:4px}.sim-pr-tbl th,.sim-pr-tbl td{padding:3px 3px;border-bottom:1px dashed #e2e8f0;text-align:right;font-variant-numeric:tabular-nums}',
      '.sim-pr-tbl th:first-child,.sim-pr-tbl td:first-child{text-align:left}.sim-pr-tbl th{color:#64748b;font-weight:700}',
      '.sim-pr-tbl tr.risk td{color:#b91c1c;font-weight:800}.sim-pr-tbl tr.sum td{font-weight:800;color:#0f2747;border-bottom:0}',
      '.sim-pr details summary{cursor:pointer;font-size:.74rem;font-weight:800;color:#6d4fc2;margin-top:6px}',
      '.sim-pr-flag{font-size:.74rem;line-height:1.45;margin:6px 0 0;padding:6px 8px;border-radius:6px}',
      '.sim-pr-flag.bad{background:#fef2f2;color:#b91c1c;font-weight:700}.sim-pr-flag.ok{background:#ecfdf5;color:#047857;font-weight:700}.sim-pr-flag.warn{background:#fffbeb;color:#92400e;font-weight:700}',
      '.sim-pr-range{display:flex;align-items:center;gap:8px;flex:1;min-width:160px}.sim-pr-range input{flex:1;min-width:0;accent-color:#0e7490}.sim-pr-range output{font-size:.78rem;font-weight:800;min-width:44px;font-variant-numeric:tabular-nums}',
      '@media (max-width:860px){.sim-pr-body{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function roomLab(el, opts) {
    opts = opts || {}; injectCss();
    var S = { room: copyRoom(DEF), people: false, peopleToggled: false, paint: 'absorber', mode: 'off', lx: 24, ly: 13, mic: { d: 3, pat: 'omni' },
      msg: '재질을 고른 뒤 그림의 벽을 누르면 그 벽이 바뀌어요. 파란 동그라미(듣는 자리)는 끌 수 있어요. 오른쪽 아래 네모(방 크기)도 끌 수 있어요.', msgCls: '', done: {} };
    var drag = null, justDragged = false, planZ = 1;

    function chip(act, v, label, on, sw, small) { return '<button type="button" class="sim-pr-chip" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + !!on + '">' + (sw ? '<i style="background:' + sw + '"></i>' : '') + label + (small ? ' <small>' + small + '</small>' : '') + '</button>'; }
    el.innerHTML = '<div class="sim-pr">' +
      '<div class="sim-box sim-pr-tools" data-role="tools"></div>' +
      '<div class="sim-pr-body">' +
        '<div class="sim-pr-main">' +
          '<div class="sim-stage"><svg class="sim-pr-svg" data-role="plan" viewBox="0 0 ' + VBW + ' ' + VBH + '" role="img" aria-label="예배당 평면 (가상): 벽을 눌러 재질 바꾸기, 듣는 자리와 방 크기 끌기" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif"></svg>' +
          '<div class="sim-hint">위에서 본 본당이에요. 왼쪽이 강단(앞벽), 오른쪽이 뒷벽이에요. 격자 한 칸은 5 m 예요. 판정은 손을 뗄 때 해요.</div></div>' +
          '<p class="sim-pr-msg" data-role="msg" role="status"></p>' +
          '<div class="sim-box" data-role="micbox"><h4>설교자 마이크 거리 <small>임계 거리 — 끌어서 마이크 옮기기</small></h4>' +
            '<div class="sim-pr-row" data-role="micpat"></div>' +
            '<svg class="sim-pr-svg" data-role="mic" viewBox="0 0 ' + MS.w + ' ' + MS.h + '" role="img" aria-label="설교자 입에서 마이크까지 거리 (끌어서 바꾸기)" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif" style="margin-top:6px"></svg>' +
            '<div class="sim-read" data-role="micread"></div></div>' +
        '</div>' +
        '<div class="sim-side">' +
          '<div class="sim-box sim-read" data-role="rt"></div>' +
          '<div class="sim-box sim-read" data-role="arr"></div>' +
          '<div class="sim-box sim-read" data-role="modes"></div>' +
        '</div>' +
      '</div></div>';
    var q = function (s) { return el.querySelector(s); }, plan = q('[data-role=plan]'), micSvg = q('[data-role=mic]');

    /* ---------------- 계산 */
    function X(m) { return OX + m * KP; } function Y(m) { return OY + m * KP; }
    function rts() { var e = rtOf(S.room, false), fl = rtOf(S.room, true); return { e: e, f: fl, cur: S.people ? fl : e }; }
    function geo() {
      var r = S.room, L = r.L, W = r.W, H = r.H, hs = Math.min(5, H - 1), he = 1.2, dz = hs - he;
      var sx = 1.0, sy = W / 2, lx = S.lx, ly = S.ly;
      function d3(dx, dy, z) { return Math.sqrt(dx * dx + dy * dy + z * z); }
      var dir = d3(lx - sx, ly - sy, dz);
      function mk(k, n, path, m, pt) { var dl = (path - dir) / CS * 1000, R = (1 - m.a) * (1 - (m.s || 0)), geom = -20 * Math.log10(path / dir), lv = geom + 10 * Math.log10(Math.max(R, 1e-4));
        return { k: k, n: n, path: path, ms: dl, lvl: lv, geom: geom, mat: m.n, pt: pt, risk: dl > ECHO_MS && lv >= ECHO_DB, geomRisk: dl > ECHO_MS && geom >= ECHO_DB }; }
      var out = [];
      out.push(mk('s1', WALL_N.s1, d3(lx - sx, ly + sy, dz), MAT[r.walls.s1], [sx + (lx - sx) * sy / (sy + ly), 0]));
      out.push(mk('s2', WALL_N.s2, d3(lx - sx, 2 * W - ly - sy, dz), MAT[r.walls.s2], [sx + (lx - sx) * (W - sy) / ((W - sy) + (W - ly)), W]));
      out.push(mk('back', WALL_N.back, d3(2 * L - lx - sx, ly - sy, dz), MAT[r.walls.back], [L, sy + (ly - sy) * (L - sx) / ((L - sx) + (L - lx))]));
      out.push(mk('ceil', '천장', d3(lx - sx, ly - sy, 2 * H - hs - he), { a: CEIL[r.ceil].a, s: 0, n: CEIL[r.ceil].n }, null));
      out.sort(function (a, b) { return a.ms - b.ms; });
      return { dir: dir, dirMs: dir / CS * 1000, refl: out, sx: sx, sy: sy, hs: hs };
    }
    function reflBy(g, k) { for (var i = 0; i < g.refl.length; i++) if (g.refl[i].k === k) return g.refl[i]; return null; }
    function flutter() { return hard(MAT[S.room.walls.s1]) && hard(MAT[S.room.walls.s2]); }
    function modes() { var r = S.room; return { L: CS / (2 * r.L), W: CS / (2 * r.W), H: CS / (2 * r.H) }; }
    function bassAt() { return Math.abs(Math.cos(Math.PI * S.ly / S.room.W)); }
    function micCalc(rt) { var V0 = S.room.L * S.room.W * S.room.H, dc0 = dcOf(V0, rt, VOICE_Q), dc = dc0 * DF[S.mic.pat].k; return { dc0: dc0, dc: dc, dr: 20 * Math.log10(dc / S.mic.d) }; }

    /* ---------------- 과제 */
    function okRt(R) { return S.people && R.f.rt >= 1.0 && R.f.rt <= 1.5; }
    function okSeat(R) { return S.room.seat === 'cloth' && S.peopleToggled && Math.abs(R.e.rt - R.f.rt) <= 0.5; }
    function okEcho(g) { var b = reflBy(g, 'back'); return !!b && b.geomRisk && !b.risk && !hard(MAT[S.room.walls.back]); }
    function okFlutter() { return !flutter(); }
    function okMode() { return modes().W >= 20 && bassAt() <= 0.3; }
    function okMic(R) { return micCalc(R.cur.rt).dr >= 10; }
    function checkTasks() {
      var R = rts(), g = geo();
      if (okRt(R)) hit('rt'); if (okSeat(R)) hit('seats'); if (okEcho(g)) hit('echo'); if (okFlutter()) hit('flutter'); if (okMode()) hit('mode'); if (okMic(R)) hit('mic');
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function setMsg(m, c) { S.msg = m; S.msgCls = c || ''; }

    /* ---------------- 그리기 */
    function renderTools() {
      var r = S.room, h = '';
      h += '<div class="sim-pr-row"><span class="lb">벽 재질<small>고른 뒤 벽 누르기</small></span>' + MAT_KEYS.map(function (k) { var m = MAT[k]; return chip('paint', k, m.n, S.paint === k, m.col, 'α ' + m.a); }).join('') + '</div>';
      h += '<div class="sim-pr-row"><span class="lb">천장</span>' + Object.keys(CEIL).map(function (k) { return chip('ceil', k, CEIL[k].n, r.ceil === k, null, 'α ' + CEIL[k].a); }).join('') +
        '<label class="sim-pr-range"><span style="font-size:.74rem;font-weight:800;color:#334155">높이</span><input type="range" min="' + HMIN + '" max="' + HMAX + '" step="0.5" value="' + r.H + '" data-sim="H" aria-label="천장 높이 (m)"><output data-out="H">' + f1(r.H) + ' m</output></label></div>';
      h += '<div class="sim-pr-row"><span class="lb">통로 바닥</span>' + Object.keys(FLOOR).map(function (k) { return chip('floor', k, FLOOR[k].n, r.floor === k, null, 'α ' + FLOOR[k].a); }).join('') + '</div>';
      h += '<div class="sim-pr-row"><span class="lb">회중석 의자</span>' + Object.keys(SEAT).map(function (k) { return chip('seat', k, SEAT[k].n, r.seat === k, null, '빈 ' + SEAT[k].e + ' · 사람 ' + SEAT[k].f); }).join('') + '</div>';
      h += '<div class="sim-pr-row"><span class="lb">회중</span>' + chip('people', 'off', '빈 예배당', !S.people) + chip('people', 'on', '회중 가득', S.people) + '</div>';
      h += '<div class="sim-pr-row"><span class="lb">저음 모드 보기</span>' + chip('mode', 'off', '끔', S.mode === 'off') + chip('mode', 'w', '폭 방향 1차', S.mode === 'w') + chip('mode', 'l', '길이 방향 1차', S.mode === 'l') +
        '<button type="button" class="sim-btn" data-act="reset" style="margin-left:auto">처음 상태로</button></div>';
      q('[data-role=tools]').innerHTML = h;
    }
    function zoom(svgEl) { var w = svgEl.getBoundingClientRect().width; return w && w < 520 ? 1.6 : 1; }   // 좁은 화면: 글자 · 손잡이를 크게
    function drawPlan(g) {
      var Z = zoom(plan), r = S.room, L = r.L, W = r.W, s = '<rect width="' + VBW + '" height="' + VBH + '" fill="#eef3f8"/>';
      for (var gx = 0; gx <= LMAX; gx += 5) s += line(X(gx), Y(0), X(gx), Y(WMAX), '#dde5ee', 1);
      for (var gy = 0; gy <= WMAX; gy += 5) s += line(X(0), Y(gy), X(LMAX), Y(gy), '#dde5ee', 1);
      s += '<rect x="' + X(0) + '" y="' + Y(0) + '" width="' + f(L * KP) + '" height="' + f(W * KP) + '" fill="#fff"/>';
      if (S.mode !== 'off') { var N = 28, i, p;
        for (i = 0; i < N; i++) { p = Math.abs(Math.cos(Math.PI * (i + 0.5) / N));
          s += S.mode === 'w' ? '<rect x="' + X(0) + '" y="' + f(Y(i / N * W)) + '" width="' + f(L * KP) + '" height="' + f(W * KP / N + 0.6) + '" fill="#2563eb" opacity="' + f2(0.04 + 0.32 * p) + '"/>'
            : '<rect x="' + f(X(i / N * L)) + '" y="' + Y(0) + '" width="' + f(L * KP / N + 0.6) + '" height="' + f(W * KP) + '" fill="#2563eb" opacity="' + f2(0.04 + 0.32 * p) + '"/>'; } }
      s += '<rect x="' + X(0) + '" y="' + Y(0) + '" width="' + f(3.5 * KP) + '" height="' + f(W * KP) + '" fill="#fef3c7" opacity=".75"/>';
      var xs0 = 4, xs1 = L - 1.5, half = (W - 3.9) / 2;
      if (xs1 > xs0 && half > 0) { var blocks = [[1.2, 1.2 + half], [W / 2 + 0.75, W / 2 + 0.75 + half]], rows = '', ppl = '';
        for (var x = xs0 + 0.4; x < xs1; x += 1.0) blocks.forEach(function (b) { rows += line(X(x), Y(b[0]), X(x), Y(b[1]), S.people ? '#fdba74' : '#cbd5e1', 3);
          if (S.people) for (var yy = b[0] + 0.3; yy < b[1]; yy += 0.75) ppl += '<circle cx="' + f(X(x) + 4.5) + '" cy="' + f(Y(yy)) + '" r="2.6" fill="#f59e0b"/>'; });
        s += rows + ppl; }
      // 반사 경로
      g.refl.forEach(function (rf) { if (!rf.pt) return; var op = clamp(1 + rf.lvl / 26, 0.18, 1), col = rf.risk ? C.red : C.orange;
        s += poly([[X(g.sx), Y(g.sy)], [X(rf.pt[0]), Y(rf.pt[1])], [X(S.lx), Y(S.ly)]], col, rf.risk ? 2.8 : 2, ' opacity="' + f2(op) + '"' + (rf.lvl < ECHO_DB ? ' stroke-dasharray="5 4"' : ''));
        s += '<circle cx="' + f(X(rf.pt[0])) + '" cy="' + f(Y(rf.pt[1])) + '" r="3.4" fill="' + col + '" opacity="' + f2(op) + '"/>'; });
      s += line(X(g.sx), Y(g.sy), X(S.lx), Y(S.ly), C.teal, 3.2);
      // 벽
      var walls = { front: [0, 0, 0, W], back: [L, 0, L, W], s1: [0, 0, L, 0], s2: [0, W, L, W] };
      Object.keys(walls).forEach(function (k) { var w = walls[k], m = MAT[r.walls[k]];
        s += '<path d="M' + f(X(w[0])) + ' ' + f(Y(w[1])) + 'L' + f(X(w[2])) + ' ' + f(Y(w[3])) + '" stroke="' + m.col + '" stroke-width="7" stroke-linecap="square"' + (k === 'front' ? '' : '') + (r.walls[k] === 'diffuser' ? ' stroke-dasharray="7 3"' : r.walls[k] === 'curtain' ? ' stroke-dasharray="3 2"' : '') + '/>'; });
      // 플러터: 두 옆벽 사이를 오가는 소리
      if (flutter()) { var span = Math.min(9, L * 0.4), fx0 = L * 0.55 - span / 2, zig = [], n = 6; for (var zi = 0; zi <= n; zi++) zig.push([X(fx0 + zi * span / n), Y(zi % 2 ? W - 0.3 : 0.3)]);
        s += poly(zig, '#f59e0b', 2.2, ' stroke-dasharray="6 4" opacity=".9"') + t(X(fx0 + span / 2), Y(W * 0.2) + 4 * Z, '플러터', { size: 13 * Z, weight: 800, fill: '#b45309', halo: '#fff' }); }
      // 벽 이름 · 재질 (벽 바깥쪽)
      var wl = function (k) { return (k === 'front' ? '앞벽 · ' : k === 'back' ? '뒷벽 · ' : '옆벽 · ') + MAT[r.walls[k]].n; }, fz = 12.5 * Z;
      s += t(X(L / 2), Y(0) - 7, wl('s1'), { size: fz, weight: 800, fill: MAT[r.walls.s1].col, halo: '#eef3f8' }) + t(X(L / 2), Y(W) + 6 + fz, wl('s2'), { size: fz, weight: 800, fill: MAT[r.walls.s2].col, halo: '#eef3f8' });
      s += t(X(0) - 7, Y(W / 2), wl('front'), { size: fz, weight: 800, fill: MAT[r.walls.front].col, halo: '#eef3f8', extra: ' transform="rotate(-90 ' + f(X(0) - 7) + ' ' + f(Y(W / 2)) + ')"' });
      s += t(X(L) + 7, Y(W / 2), wl('back'), { size: fz, weight: 800, fill: MAT[r.walls.back].col, halo: '#eef3f8', extra: ' transform="rotate(90 ' + f(X(L) + 7) + ' ' + f(Y(W / 2)) + ')"' });
      // 스피커
      s += '<path d="M' + f(X(g.sx)) + ' ' + f(Y(g.sy)) + 'L' + f(X(g.sx + 5)) + ' ' + f(Y(g.sy - 2.6)) + 'L' + f(X(g.sx + 5)) + ' ' + f(Y(g.sy + 2.6)) + 'Z" fill="' + C.teal + '" opacity=".12"/>' +
        '<rect x="' + f(X(g.sx) - 7) + '" y="' + f(Y(g.sy) - 10) + '" width="14" height="20" rx="3" fill="#0f2747"/>' + t(X(g.sx) + 2, Y(g.sy) - 14, '스피커', { size: 12 * Z, weight: 800, halo: '#fef3c7', anchor: 'start' });
      // 듣는 자리
      var on = drag && drag.type === 'lis';
      var lx = X(S.lx), ly = Y(S.ly), lr = (on ? 14 : 12) * Z;
      s += '<g data-h="listener"><circle cx="' + f(lx) + '" cy="' + f(ly) + '" r="' + f(lr) + '" fill="' + C.blue + '" stroke="#fff" stroke-width="3"/><circle cx="' + f(lx) + '" cy="' + f(ly - lr * 0.2) + '" r="' + f(lr * 0.3) + '" fill="#fff"/><path d="M' + f(lx - lr * 0.5) + ' ' + f(ly + lr * 0.58) + 'q' + f(lr * 0.5) + ' ' + f(-lr * 0.66) + ' ' + f(lr) + ' 0" fill="#fff"/></g>';
      s += t(lx, ly + lr + 4 + 12 * Z, '듣는 자리', { size: 12 * Z, weight: 800, fill: C.blue, halo: '#fff' });
      // 방 크기 손잡이
      var cx = X(L), cy = Y(W), co = drag && drag.type === 'size';
      var hz = 10 * Z, hi = 4 * Z;
      s += '<g data-h="size"><rect x="' + f(cx - hz) + '" y="' + f(cy - hz) + '" width="' + f(2 * hz) + '" height="' + f(2 * hz) + '" rx="4" fill="' + (co ? C.orange : '#0f2747') + '" stroke="#fff" stroke-width="2"/><path d="M' + f(cx - hi) + ' ' + f(cy - hi) + 'L' + f(cx + hi) + ' ' + f(cy + hi) + 'M' + f(cx + hi) + ' ' + f(cy - hi * 0.25) + 'V' + f(cy + hi) + 'H' + f(cx - hi * 0.25) + '" stroke="#fff" stroke-width="2" fill="none"/></g>';
      // 벽 누르는 칸 (맨 위)
      Object.keys(walls).forEach(function (k) { var w = walls[k]; s += '<path data-wall="' + k + '" d="M' + f(X(w[0])) + ' ' + f(Y(w[1])) + 'L' + f(X(w[2])) + ' ' + f(Y(w[3])) + '" stroke="transparent" stroke-width="' + f(24 * Z) + '" fill="none"><title>' + WALL_N[k] + ' — 눌러서 재질 바꾸기</title></path>'; });
      plan.innerHTML = s; plan.classList.toggle('dragging', !!drag); planZ = Z;
    }
    function MX(d) { return MS.x0 + Math.log(d / MS.dmin) / Math.log(MS.dmax / MS.dmin) * (MS.x1 - MS.x0); }
    function drawMic(mc) {
      var Z = zoom(micSvg), top = MS.top, bot = MS.bot, Yd = function (v) { return top + (30 - clamp(v, -20, 30)) / 50 * (bot - top); }, s = '<rect width="' + MS.w + '" height="' + MS.h + '" fill="#fff"/>', fs = function (v) { return v * Z; };
      var g10 = mc.dc / Math.pow(10, 0.5);
      s += '<rect x="' + MS.x0 + '" y="' + top + '" width="' + f(clamp(MX(g10), MS.x0, MS.x1) - MS.x0) + '" height="' + (bot - top) + '" fill="#ecfdf5"/>';
      (Z > 1 ? [-20, 0, 20] : [-20, -10, 0, 10, 20, 30]).forEach(function (v) { s += line(MS.x0, Yd(v), MS.x1, Yd(v), '#eef2f7', 1) + t(MS.x0 - 6, Yd(v) + fs(4), (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v), { size: fs(11), fill: C.sub, anchor: 'end' }); });
      (Z > 1 ? [0.03, 0.3, 3] : [0.03, 0.1, 0.3, 1, 3, 10]).forEach(function (d) { s += line(MX(d), bot, MX(d), bot + 4, C.ink, 1) + t(MX(d), bot + 4 + fs(13), (d < 1 ? Math.round(d * 100) + ' cm' : d + ' m'), { size: fs(12), fill: C.sub, anchor: d === 0.03 ? 'start' : 'middle' }); });
      s += line(MS.x0, Yd(0), MS.x1, Yd(0), C.purple, 2.4, '7 4') + t(MS.x0 + 6, Yd(0) - 6, '잔향 (0 dB)', { size: fs(11.5), weight: 800, fill: C.purple, anchor: 'start', halo: '#fff' });
      var dA = MS.dmin, dB = MS.dmax; s += line(MX(dA), Yd(20 * Math.log10(mc.dc / dA)), MX(dB), Yd(20 * Math.log10(mc.dc / dB)), C.teal, 3);
      if (mc.dc > MS.dmin && mc.dc < MS.dmax) { var ax = MX(mc.dc); s += line(ax, top, ax, bot, C.red, 1.6, '3 3') + t(ax, top - 6, '임계 거리 ' + f2(mc.dc) + ' m', { size: fs(11.5), weight: 800, fill: C.red, anchor: ax > MS.x1 - 70 * Z ? 'end' : ax < MS.x0 + 70 * Z ? 'start' : 'middle' }); }
      s += t(MS.x0 + 6, bot - 6, Z > 1 ? '+10 dB 이상' : '직접음 +10 dB 이상', { size: fs(11), weight: 800, fill: C.green, anchor: 'start', halo: '#ecfdf5' });
      s += '<circle cx="34" cy="62" r="' + f(15 * Math.min(Z, 1.3)) + '" fill="#fde68a" stroke="#d97706" stroke-width="2"/><circle cx="' + f(34 + 5 * Math.min(Z, 1.3)) + '" cy="' + f(62 - 4 * Math.min(Z, 1.3)) + '" r="2.4" fill="#0f2747"/>' + t(34, 92 + 10 * Z, '설교자', { size: fs(12), weight: 800 });
      var mx = MX(S.mic.d), my = Yd(mc.dr), on = drag && drag.type === 'mic', mr = (on ? 14 : 12) * Z;
      s += '<g data-h="mic"><circle cx="' + f(mx) + '" cy="' + f(my) + '" r="' + f(mr) + '" fill="#0f2747" stroke="#fff" stroke-width="3"/><rect x="' + f(mx - mr * 0.3) + '" y="' + f(my - mr * 0.6) + '" width="' + f(mr * 0.6) + '" height="' + f(mr * 0.85) + '" rx="' + f(mr * 0.3) + '" fill="#fff"/><path d="M' + f(mx) + ' ' + f(my + mr * 0.25) + 'V' + f(my + mr * 0.6) + '" stroke="#fff" stroke-width="2"/></g>';
      var up = my > top + mr + fs(16);
      s += t(clamp(mx, MS.x0 + 30 * Z, MS.x1 - 30 * Z), up ? my - mr - 5 : my + mr + fs(13), (S.mic.d < 1 ? Math.round(S.mic.d * 100) + ' cm' : f2(S.mic.d) + ' m'), { size: fs(12), weight: 800, fill: '#0f2747', halo: '#fff' });
      s += t(MS.x0, MS.h - 4, Z > 1 ? '세로: 직접음 − 잔향 (dB)' : '세로: 직접음 − 잔향 (dB) · 가로: 입에서 마이크까지 (칸마다 약 3배)', { size: fs(11), fill: C.sub, anchor: 'start' });
      micSvg.innerHTML = s; micSvg.classList.toggle('dragging', on);
    }
    function row(k, v, cls) { return '<div class="sim-row"><span>' + k + '</span><b class="' + (cls || '') + '">' + v + '</b></div>'; }
    function renderRead(R, g) {
      var r = S.room, cur = R.cur, band = function (v) { return v >= 1.0 && v <= 1.5 ? 'ok' : v < 0.8 || v > 2.5 ? 'bad' : 'warn'; };
      var h = '<h4>잔향 시간 RT60 <small>500 Hz · 세이빈 공식 · 교육용 계산</small></h4>';
      h += '<div class="sim-pr-big"><b>' + f2(cur.rt) + ' s</b><span>지금 (' + (S.people ? '회중 가득' : '빈 예배당') + ')</span></div>';
      h += row('빈 예배당', f2(R.e.rt) + ' s', band(R.e.rt)) + row('회중 가득', f2(R.f.rt) + ' s', band(R.f.rt)) + row('차이', f2(Math.abs(R.e.rt - R.f.rt)) + ' s');
      h += row('방 크기', f1(r.L) + ' × ' + f1(r.W) + ' × ' + f1(r.H) + ' m') + row('부피 V', Math.round(cur.V).toLocaleString() + ' m³') + row('흡음력 A', f1(cur.A) + ' m²') + row('0.161 × V ÷ A', f2(cur.rt) + ' s');
      h += '<p class="sim-note">권장(Acoustical Surfaces): 설교 0.8–1.2 s · 현대 예배 1.0–1.5 s · 성가대 1.5–2.5 s</p>';
      h += '<details><summary>면마다 흡음력 보기</summary><table class="sim-pr-tbl"><tr><th>면</th><th>넓이 m²</th><th>α</th><th>A m²</th></tr>' +
        cur.list.map(function (sf) { return '<tr><td>' + sf.n + ' · ' + sf.m + '</td><td>' + Math.round(sf.S) + '</td><td>' + f2(sf.aa) + '</td><td>' + f1(sf.A) + '</td></tr>'; }).join('') +
        '<tr><td>기타 (문 · 창틀 · 조명 · 공기)</td><td>' + Math.round(cur.St) + '</td><td>+' + MISC + '</td><td>' + f1(cur.misc) + '</td></tr><tr class="sum"><td>합계 A</td><td></td><td></td><td>' + f1(cur.A) + '</td></tr></table>' +
        '<p class="sim-note">기타 흡음 α 0.04 와 회중석 넓이는 교육용 가정이에요.</p></details>';
      q('[data-role=rt]').innerHTML = h;
      // 도착 시간
      var a = '<h4>듣는 자리에 도착하는 소리 <small>직접음 기준</small></h4>';
      a += row('직접음', f1(g.dir) + ' m · ' + f1(g.dirMs) + ' ms 뒤', 'ok');
      a += '<table class="sim-pr-tbl"><tr><th>반사</th><th>늦게</th><th>크기</th></tr>' + g.refl.map(function (rf) { return '<tr class="' + (rf.risk ? 'risk' : '') + '"><td>' + rf.n + ' · ' + rf.mat + '</td><td>+' + f1(rf.ms) + ' ms</td><td>' + db(rf.lvl) + '</td></tr>'; }).join('') + '</table>';
      a += echogram(g, cur.rt);
      var b = reflBy(g, 'back'), first = g.refl[0];
      a += '<p class="sim-pr-flag ' + (first.ms <= 40 ? 'ok' : 'warn') + '">첫 반사(' + first.n + ')는 직접음보다 ' + f1(first.ms) + ' ms 늦어요. ' + (first.ms <= 40 ? '40 ms 안이라 직접음과 하나로 들려요(선행음 효과).' : '40 ms 를 넘어서 따로 들리기 시작할 수 있어요.') + '</p>';
      if (b.risk) a += '<p class="sim-pr-flag bad">메아리 위험: 뒷벽 반사가 ' + f1(b.ms) + ' ms 늦고 크기가 ' + db(b.lvl) + ' 예요(50 ms 넘고 −15 dB 이상, 교육용 기준).</p>';
      else if (b.geomRisk) a += '<p class="sim-pr-flag ok">뒷벽(' + b.mat + ')이 반사를 줄여서 메아리 위험이 없어졌어요. 단단한 벽이었다면 ' + db(b.geom) + ' 로 돌아왔을 거예요.</p>';
      q('[data-role=arr]').innerHTML = a;
      // 모드 · 플러터
      var md = modes(), m = '<h4>룸 모드 · 플러터 에코 <small>343 ÷ (벽 사이 × 2)</small></h4>';
      m += '<table class="sim-pr-tbl"><tr><th>방향</th><th>길이</th><th>1차</th><th>2차</th><th>3차</th></tr>' + [['길이', r.L, md.L], ['폭', r.W, md.W], ['높이', r.H, md.H]].map(function (x) { return '<tr><td>' + x[0] + '</td><td>' + f1(x[1]) + ' m</td><td>' + f1(x[2]) + ' Hz</td><td>' + f1(2 * x[2]) + '</td><td>' + f1(3 * x[2]) + '</td></tr>'; }).join('') + '</table>';
      var ba = bassAt();
      m += '<p class="sim-pr-flag ' + (md.W >= 20 ? (ba <= 0.3 ? 'ok' : 'warn') : 'warn') + '">폭 방향 1차 모드 ' + f1(md.W) + ' Hz' + (md.W < 20 ? ' — 20 Hz 보다 낮아 귀에 잘 안 들려요. 방이 작아지면 올라와요.' : ' — 들리는 저음이에요.') + ' 듣는 자리에서 이 저음의 크기: ' + Math.round(ba * 100) + ' % (' + (ba <= 0.3 ? '마디 근처 · 작게' : ba >= 0.8 ? '벽 근처 · 크게' : '중간') + ')</p>';
      m += flutter() ? '<p class="sim-pr-flag bad">플러터 에코: 마주 보는 두 옆벽이 모두 단단해요(' + MAT[r.walls.s1].n + ' · ' + MAT[r.walls.s2].n + '). 손뼉 소리가 약 ' + f1(2 * r.W / CS * 1000) + ' ms 마다 되풀이돼요.</p>'
        : '<p class="sim-pr-flag ok">옆벽 한쪽 이상이 흡음 · 확산 재질이라 플러터 에코가 줄었어요.</p>';
      q('[data-role=modes]').innerHTML = m;
      // 마이크
      var mc = micCalc(cur.rt);
      q('[data-role=micpat]').innerHTML = '<span class="lb">마이크 지향성<small>거리 계수 (Shure)</small></span>' + Object.keys(DF).map(function (k) { return chip('pat', k, DF[k].n, S.mic.pat === k, null, '× ' + DF[k].k); }).join('');
      q('[data-role=micread]').innerHTML = row('목소리 임계 거리 (무지향 기준)', f2(mc.dc0) + ' m') + row('이 마이크 기준 (× ' + DF[S.mic.pat].k + ')', f2(mc.dc) + ' m') +
        row('직접음 − 잔향', db(mc.dr), mc.dr >= 10 ? 'ok' : mc.dr >= 0 ? 'warn' : 'bad') + '<p class="sim-note">지금 RT60 ' + f2(cur.rt) + ' s, 부피 ' + Math.round(cur.V).toLocaleString() + ' m³ 로 계산해요. 목소리의 지향성 Q = 2 는 교육용 가정이에요.</p>';
      drawMic(mc);
    }
    function echogram(g, rt) {
      var W0 = 280, H0 = 112, x0 = 8, x1 = 272, T = 200, top = 16, bot = 88, X2 = function (ms) { return x0 + clamp(ms, 0, T) / T * (x1 - x0); }, Y2 = function (d) { return top + (-clamp(d, -36, 0)) / 36 * (bot - top); };
      var s = '<rect x="' + x0 + '" y="' + top + '" width="' + f(X2(40) - x0) + '" height="' + (bot - top) + '" fill="#ecfdf5"/><rect x="' + f(X2(50)) + '" y="' + top + '" width="' + f(x1 - X2(50)) + '" height="' + (bot - top) + '" fill="#fef2f2"/>';
      for (var ms = 8; ms <= T; ms += 3) { var d = -6 - 60 * (ms / 1000) / rt - ((ms * 13) % 7) * 0.6; s += line(X2(ms), bot, X2(ms), Y2(d), '#cbd5e1', 1.2); }
      s += line(X2(0.5), bot, X2(0.5), Y2(0), C.teal, 4);
      g.refl.forEach(function (rf) { s += line(X2(rf.ms), bot, X2(rf.ms), Y2(rf.lvl), rf.risk ? C.red : C.orange, 3); });
      s += line(x0, bot, x1, bot, C.ink, 1.2) + [0, 50, 100, 150, 200].map(function (ms) { return t(X2(ms), bot + 13, ms + (ms === 200 ? ' ms' : ''), { size: 9.5, fill: C.sub }); }).join('');
      s += t(X2(20), top - 4, '하나로', { size: 9.5, weight: 800, fill: C.green }) + t(X2(125), top - 4, '50 ms 넘음: 메아리 구역', { size: 9.5, weight: 800, fill: C.red });
      s += t(x0, H0 - 2, '청록: 직접음 · 주황: 반사 · 회색: 잔향(RT60 기울기)', { size: 9.5, fill: C.sub, anchor: 'start' });
      return '<svg viewBox="0 0 ' + W0 + ' ' + H0 + '" style="display:block;width:100%;height:auto;margin-top:6px" role="img" aria-label="에코그램" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + s + '</svg>';
    }
    function render(tools) {
      var R = rts(), g = geo();
      if (tools) renderTools();
      var ho = q('[data-out=H]'); if (ho) ho.textContent = f1(S.room.H) + ' m';
      drawPlan(g); renderRead(R, g);
      var m = q('[data-role=msg]'); m.textContent = S.msg; m.className = 'sim-pr-msg ' + S.msgCls;
    }

    /* ---------------- 마우스 */
    function pt(svgEl, e) { var m = svgEl.getScreenCTM(); if (!m) return { x: 0, y: 0 }; var p = svgEl.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; var r = p.matrixTransform(m.inverse()); return { x: r.x, y: r.y }; }
    function clampLis() { S.lx = clamp(S.lx, 0.6, S.room.L - 0.6); S.ly = clamp(S.ly, 0.6, S.room.W - 0.6); }
    function onPlanDown(e) {
      if (e.button != null && e.button !== 0) return; var p = pt(plan, e);
      var dS = Math.hypot(p.x - X(S.room.L), p.y - Y(S.room.W)), dL = Math.hypot(p.x - X(S.lx), p.y - Y(S.ly));   // 둘이 가까우면 더 가까운 쪽
      if (dL < 24 * planZ && dL <= dS) drag = { type: 'lis', ox: p.x - X(S.lx), oy: p.y - Y(S.ly) };
      else if (dS < 22 * planZ) drag = { type: 'size' };
      if (!drag) return;
      e.preventDefault(); try { plan.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
      render(false);
    }
    function onPlanMove(e) {
      if (!drag || drag.type === 'mic') return; var p = pt(plan, e);
      if (drag.type === 'lis') { S.lx = (p.x - drag.ox - OX) / KP; S.ly = (p.y - drag.oy - OY) / KP; clampLis(); }
      else { S.room.L = clamp(Math.round((p.x - OX) / KP * 2) / 2, LMIN, LMAX); S.room.W = clamp(Math.round((p.y - OY) / KP * 2) / 2, WMIN, WMAX); clampLis(); }
      render(false);   // 끄는 동안에는 그림만 바꾸고 과제는 확인하지 않음
    }
    function onPlanUp() {
      if (!drag || drag.type === 'mic') return; var d = drag; drag = null; justDragged = true; setTimeout(function () { justDragged = false; }, 0);
      var g = geo(), b = reflBy(g, 'back');
      if (d.type === 'lis') setMsg(b.risk ? '이 자리에서는 뒷벽 반사가 ' + f1(b.ms) + ' ms 늦게 와요. 크기는 직접음보다 ' + db(b.lvl) + ' 예요. 메아리로 들릴 수 있어요. 뒷벽 재질을 바꿔 보세요.' : '듣는 자리를 옮겼어요. 첫 반사는 ' + f1(g.refl[0].ms) + ' ms, 뒷벽 반사는 ' + f1(b.ms) + ' ms 늦게 와요.', b.risk ? 'bad' : '');
      else setMsg('방 크기: 길이 ' + f1(S.room.L) + ' m × 폭 ' + f1(S.room.W) + ' m. 폭 방향 1차 모드는 ' + f1(modes().W) + ' Hz 예요.', '');
      render(false); checkTasks();
    }
    function onMicDown(e) {
      if (e.button != null && e.button !== 0) return; var p = pt(micSvg, e); if (p.x < MS.x0 - 30) return;
      drag = { type: 'mic' }; e.preventDefault(); try { micSvg.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
      micMove(p);
    }
    function micMove(p) { var u = clamp((p.x - MS.x0) / (MS.x1 - MS.x0), 0, 1); S.mic.d = Math.round(MS.dmin * Math.pow(MS.dmax / MS.dmin, u) * 1000) / 1000; render(false); }
    function onMicMove(e) { if (!drag || drag.type !== 'mic') return; micMove(pt(micSvg, e)); }
    function onMicUp() { if (!drag || drag.type !== 'mic') return; drag = null; var mc = micCalc(rts().cur.rt);
      setMsg(mc.dr >= 10 ? '좋아요. 목소리 직접음이 방 잔향보다 ' + db(mc.dr) + ' 커요. 또렷하고 하울링에도 유리해요.' : mc.dr >= 0 ? '임계 거리 안이지만 직접음이 잔향보다 ' + db(mc.dr) + ' 만 커요. 조금 더 가까이 둬 보세요.' : '임계 거리 밖이에요. 마이크가 목소리보다 방 울림을 더 많이 받아요.', mc.dr >= 10 ? 'ok' : mc.dr >= 0 ? '' : 'bad');
      render(false); checkTasks(); }
    function onClick(e) {
      var w = e.target.closest && e.target.closest('[data-wall]');
      if (w && plan.contains(w)) { if (justDragged) return; var k = w.getAttribute('data-wall'), old = S.room.walls[k]; S.room.walls[k] = S.paint;
        var R0 = rts(); setMsg(WALL_N[k] + ': ' + MAT[old].n + ' → ' + MAT[S.paint].n + '. RT60 ' + f2(R0.cur.rt) + ' s (' + (S.people ? '회중 가득' : '빈 예배당') + ').', ''); render(false); checkTasks(); return; }
      var b = e.target.closest && e.target.closest('[data-act]'); if (!b || !el.contains(b)) return;
      var act = b.getAttribute('data-act'), v = b.getAttribute('data-v');
      if (act === 'paint') { S.paint = v; setMsg(MAT[v].n + ' 를 골랐어요. 이제 그림의 벽을 눌러요.', ''); }
      else if (act === 'ceil') S.room.ceil = v;
      else if (act === 'floor') S.room.floor = v;
      else if (act === 'seat') S.room.seat = v;
      else if (act === 'people') { var np = v === 'on'; if (np !== S.people) { S.people = np; S.peopleToggled = true; } var R1 = rts(); setMsg((np ? '회중이 가득 찼어요. ' : '빈 예배당이에요. ') + 'RT60: 빈 ' + f2(R1.e.rt) + ' s · 가득 ' + f2(R1.f.rt) + ' s.', ''); }
      else if (act === 'mode') S.mode = v;
      else if (act === 'pat') S.mic.pat = v;
      else if (act === 'reset') { S.room = copyRoom(DEF); S.people = false; S.lx = 24; S.ly = 13; S.mic = { d: 3, pat: 'omni' }; S.mode = 'off'; setMsg('처음 상태로 돌렸어요. 마친 과제는 그대로 남아요.', ''); }
      else return;
      render(true); checkTasks();
    }
    function onInput(e) { if (e.target.getAttribute && e.target.getAttribute('data-sim') === 'H') { S.room.H = clamp(+e.target.value, HMIN, HMAX); render(false); } }
    function onChange(e) { if (e.target.getAttribute && e.target.getAttribute('data-sim') === 'H') { S.room.H = clamp(+e.target.value, HMIN, HMAX); setMsg('천장 높이 ' + f1(S.room.H) + ' m. 부피가 바뀌어 RT60 도 바뀌어요.', ''); render(false); checkTasks(); } }
    plan.addEventListener('pointerdown', onPlanDown); plan.addEventListener('pointermove', onPlanMove); plan.addEventListener('pointerup', onPlanUp); plan.addEventListener('pointercancel', onPlanUp);
    micSvg.addEventListener('pointerdown', onMicDown); micSvg.addEventListener('pointermove', onMicMove); micSvg.addEventListener('pointerup', onMicUp); micSvg.addEventListener('pointercancel', onMicUp);
    el.addEventListener('click', onClick); el.addEventListener('input', onInput); el.addEventListener('change', onChange);
    render(true);

    return {
      destroy: function () {
        plan.removeEventListener('pointerdown', onPlanDown); plan.removeEventListener('pointermove', onPlanMove); plan.removeEventListener('pointerup', onPlanUp); plan.removeEventListener('pointercancel', onPlanUp);
        micSvg.removeEventListener('pointerdown', onMicDown); micSvg.removeEventListener('pointermove', onMicMove); micSvg.removeEventListener('pointerup', onMicUp); micSvg.removeEventListener('pointercancel', onMicUp);
        el.removeEventListener('click', onClick); el.removeEventListener('input', onInput); el.removeEventListener('change', onChange); el.innerHTML = '';
      },
      state: function () {
        var R = rts(), g = geo(), mc = micCalc(R.cur.rt), b = reflBy(g, 'back');
        return { ready: true, done: Object.keys(S.done), room: copyRoom(S.room), people: S.people, peopleToggled: S.peopleToggled, paint: S.paint, mode: S.mode,
          rt: R.cur.rt, rtEmpty: R.e.rt, rtFull: R.f.rt, A: R.cur.A, V: R.cur.V, listener: { x: S.lx, y: S.ly }, direct: { m: g.dir, ms: g.dirMs },
          refl: g.refl.map(function (r) { return { k: r.k, ms: r.ms, lvl: r.lvl, risk: r.risk, geomRisk: r.geomRisk }; }), back: { ms: b.ms, lvl: b.lvl, risk: b.risk, geomRisk: b.geomRisk },
          flutter: flutter(), modes: modes(), bass: bassAt(), mic: { d: S.mic.d, pat: S.mic.pat, dc: mc.dc, dc0: mc.dc0, dr: mc.dr }, dragging: !!drag,
          geom: { vb: [VBW, VBH], ox: OX, oy: OY, k: KP, mic: { vb: [MS.w, MS.h], x0: MS.x0, x1: MS.x1, dmin: MS.dmin, dmax: MS.dmax } },
          ok: { rt: okRt(R), seats: okSeat(R), echo: okEcho(g), flutter: okFlutter(), mode: okMode(), mic: okMic(R) } };
      },
      set: function (o) {
        o = o || {};
        if (o.walls) Object.keys(o.walls).forEach(function (k) { if (S.room.walls[k] && MAT[o.walls[k]]) S.room.walls[k] = o.walls[k]; });
        if (o.ceil && CEIL[o.ceil]) S.room.ceil = o.ceil; if (o.floor && FLOOR[o.floor]) S.room.floor = o.floor; if (o.seat && SEAT[o.seat]) S.room.seat = o.seat;
        if (o.L != null) S.room.L = clamp(+o.L, LMIN, LMAX); if (o.W != null) S.room.W = clamp(+o.W, WMIN, WMAX); if (o.H != null) S.room.H = clamp(+o.H, HMIN, HMAX);
        if (o.people != null && !!o.people !== S.people) { S.people = !!o.people; S.peopleToggled = true; }
        if (o.listener) { S.lx = +o.listener.x; S.ly = +o.listener.y; } clampLis();
        if (o.mic) { if (o.mic.d != null) S.mic.d = clamp(+o.mic.d, MS.dmin, MS.dmax); if (o.mic.pat && DF[o.mic.pat]) S.mic.pat = o.mic.pat; }
        render(true); checkTasks(); return this.state();
      },
      model: { MAT: MAT, CEIL: CEIL, FLOOR: FLOOR, SEAT: SEAT, DF: DF, rtOf: rtOf, DEF: DEF }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.roomLab = roomLab;
})();

/* =========================================================================== 모듈 데이터 */
(function () {
  'use strict';
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['phys-room'] = {
    id: 'phys-room', path: 'physics', no: 3, noLabel: '03', status: 'ready', level: '중급', minutes: 45, img: 'img/modules/phys_room.svg',
    title: '공간(룸 어쿠스틱)', sub: '벽 · 천장 · 사람이 바꾸는 소리 — 튕김 · 흡음 · 울림 · 마이크 거리 · 저음 자리',
    topics: ['반사 · 흡음 · 확산 · 투과', '직접음 · 반사음 · 선행음 효과', 'RT60 · 세이빈 공식', '임계 거리 · 마이크 거리', '정재파 · 룸 모드 · 플러터', '공간과 확성'],
    glanceDraft: {
      glance: [
        ['흡음률 α', '벽에 닿은 소리 중 반사되지 않고 없어지는 비율 · 0 은 다 반사, 1 은 다 흡수'],
        ['RT60', '소리를 멈춘 뒤 60 dB 줄어들 때까지 걸리는 시간 · 공간이 얼마나 울리는지'],
        ['임계 거리', '직접음과 잔향음의 크기가 같아지는 거리 · 마이크를 입 가까이 두는 이유'],
        ['룸 모드', '마주 보는 두 면 사이에 생기는 저음 정재파 · 자리마다 저음 크기가 달라져요']
      ],
      heroVis: 'prHero'
    },
    overview: {
      lead: '예배당은 그 자체로 소리를 바꾸는 큰 악기예요. 소리는 벽 · 천장 · 의자 · 사람을 만나 튕기고, 먹히고, 흩어져요. 이 과정에서는 공간이 만드는 <b>울림</b>을 배워요. 그리고 스피커 · 마이크를 어디에 둘지 알아봐요.',
      terms: [
        ['흡음률 α', '벽이 소리를 먹는 몫이에요. 0 이면 공처럼 다 튕기고, 1 이면 스펀지처럼 다 먹어요.', 'prTermAlpha'],
        ['반사 · 확산 · 투과', '반사는 거울처럼 튕기기, 확산은 여러 쪽으로 흩어지기예요. 투과는 벽 너머로 새어 나가는 거예요.'],
        ['직접음 · 초기 반사음 · 잔향', '직접음은 곧장 온 소리, 초기 반사음은 벽에 한두 번 튕겨 온 소리예요. 잔향은 길게 남는 울림이에요.'],
        ['선행음 효과 (하스 효과)', '같은 소리가 조금 늦게 또 오면 귀는 하나로 들어요. 그리고 먼저 온 쪽에서 난다고 느껴요.', 'prTermHaas'],
        ['RT60 (잔향 시간)', '소리를 멈춘 뒤 울림이 거의 사라질 때까지 걸리는 시간이에요. 목욕탕은 길고, 이불 많은 방은 짧아요.', 'prTermBath'],
        ['세이빈 공식', '울림 시간을 어림하는 식이에요. 방이 클수록 길고, 소리를 많이 먹을수록 짧아요.'],
        ['임계 거리', '곧장 온 소리와 울림의 크기가 같아지는 거리예요. 이보다 가까우면 또렷하고, 멀면 흐릿해요.'],
        ['룸 모드 (정재파)', '두 벽 사이에 갇혀 맴도는 저음이에요. 그래서 자리마다 베이스가 크게도, 작게도 들려요.']
      ],
      points: [
        '<b>회중이 차면 울림이 짧아져요.</b> 빈 본당에서 맞춘 리버브(울림 효과) · 음량은 예배 때 다시 확인해요.',
        '<b>마이크는 입 가까이</b> 둬요. 목소리는 커지고 방 울림은 그대로라 또렷해져요.',
        '<b>스피커는 회중을 향해</b> 겨눠요. 벽 · 천장을 덜 때려야 말이 또렷해요.'
      ],
      model: null
    },
    theory: [
      { title: '소리가 벽을 만나면 — 튕기고 · 먹히고 · 흩어져요', visual: 'prSurface',
        body: '공을 벽에 던지면 튕겨 나오고, 이불에 던지면 푹 멈춰요. 소리도 벽을 만나면 비슷한 일이 생겨요. 거울처럼 튕겨 나가는 것을 <b>반사</b>라고 해요. 재질 속으로 들어가 사라지는 것은 <b>흡음</b>(소리를 먹음)이에요. 울퉁불퉁한 면에서 여러 쪽으로 흩어지는 것은 <b>확산</b>이에요. 소리를 먹는 몫은 <b>흡음률 α</b>(알파)로 나타내요. 0 이면 다 튕기고, 1 이면 다 먹어요. 콘크리트는 약 0.02, 커튼은 약 0.5 예요. 커튼 · 카펫 같은 얇은 흡음재는 높은 소리는 잘 먹어요. 하지만 저음은 잘 못 먹어요. 둥글게 오목한 벽은 소리를 한 곳에 모아서 그 자리만 커져요. 기억해요: 단단한 면은 튕기고, 부드러운 면은 먹어요.',
        pics: [{ v: 'prFocus', cap: '<b>오목한 벽 · 둥근 천장</b>은 손전등 반사경처럼 소리를 한 점에 모아요(음향 초점). <b>볼록하거나 울퉁불퉁한 면</b>은 소리를 고르게 흩어요(확산).' }],
        more: '<ul><li><b>투과</b>: 소리가 벽을 지나 건너편으로 새어 나가는 거예요. 네 가지(반사 · 흡음 · 확산 · 투과)는 보통 함께 일어나요.</li> <li><b>500 Hz 흡음률 (Hall 표, HyperPhysics)</b>: 단단한 것은 작고, 부드러운 것과 사람은 커요. <ul><li>콘크리트(타설) 0.02 · 두꺼운 판유리 0.04 · 석고보드 0.05</li> <li>카펫(콘크리트 위) 0.15 · 벨루어 커튼 0.5</li> <li>사람 앉은 나무 의자 0.7 · 사람 앉은 천 의자 0.8</li></ul></li> <li><b>계산 예</b>: α 가 0.5 면 닿은 소리의 반을 먹어요.</li> <li><b>주파수마다 달라요</b>: 카펫(콘크리트 위)은 125 Hz 에서 0.02, 4 kHz 에서 0.6 이에요(같은 표). 같은 카펫이 저음은 거의 튕겨 내고, 고음은 많이 먹어요.</li> <li><b>다공성 흡음재</b>: 카펫 · 커튼 · 얇은 흡음판처럼 작은 구멍이 많은 흡음재예요. 고음은 잘 먹지만 저음은 잘 못 먹어요.</li> <li><b>유리섬유판 약 5 cm (sengpielaudio 표, 2인치)</b>: 125 Hz 에서 0.22, 500 Hz 이상에서 0.99 예요. 두께가 있는 흡음판도 가장 낮은 소리에는 약해요.</li> <li><b>베이스 트랩 (Wikipedia 「Bass trap」)</b>: 저음용 흡음 장치예요. 구멍이 많은 흡음재가 낮은 소리까지 먹으려면 꽤 두꺼워야 해요. 그 소리 파장의 꽤 큰 몫만큼 두꺼워야 해요. 얇은 판이 떨면서 저음을 먹는 판 진동형 흡음재도 있어요.</li> <li><b>흡음재 세 종류 (무대음향 표준교재)</b>: ① 다공질형(스펀지 · 글라스울 · 커튼)은 주로 고음을 먹어요. ② 판진동형(얇은 판)은 낮은 소리 한 대역을 먹어요. ③ 공명기형은 좁은 대역을 먹어요. 구멍 뚫린 <b>타공판</b>이 공명기형이에요.</li> <li><b>타공판 주의 (같은 교재)</b>: 타공판을 벽에 바로 붙이면 흡음이 거의 안 돼요. 판 뒤에 공기층을 두고, 흡음재를 채워야 해요.</li> <li><b>음향 초점 (같은 교재)</b>: 오목한 뒷벽 · 돔 천장은 소리를 한 곳에 모아요. 그 자리만 커지고 다른 자리는 작아져요. 그 아래에 확산판을 달거나 흡음해서 고쳐요. 오목한 뒷벽은 강단 쪽으로 메아리를 돌려보내기도 해요.</li> <li><b>흡음과 차음은 달라요</b>: 흡음재는 방 안의 반사를 줄여요. 옆방으로 새는 소리(투과)를 막는 일(차음)은 따로예요.</li></ul>',
        check: { q: '뒷벽에 얇은 천 흡음판을 붙였어요. 무엇이 가장 줄까요?', options: [
          { t: '뒷벽에서 튕겨 오는 높은 소리', ok: true, why: '맞아요. 얇은 흡음재는 높은 소리 쪽을 잘 먹기 때문이에요.' },
          { t: '서브우퍼의 웅웅 저음', why: '아니에요. 얇은 흡음재는 저음을 거의 못 먹어요. 저음은 두꺼운 흡음재가 필요해요.' },
          { t: '옆 교육관으로 새는 소리', why: '아니에요. 흡음재는 방 안 반사를 줄여요. 벽 너머로 새는 소리를 막는 것과는 달라요.' }] } },
      { title: '곧장 온 소리와 튕겨 온 소리 — 메아리', visual: 'prArrivals',
        body: '산에서 「야호」 하면 조금 뒤 또렷한 메아리가 돌아와요. 본당 자리에도 같은 소리가 여러 번 도착해요. 스피커에서 곧장 온 <b>직접음</b>이 가장 먼저 와요. 그다음 벽 · 천장에 튕긴 <b>반사음</b>이 조금 늦게 와요. 소리는 1 m 를 더 돌면 약 3 ms(1000분의 3초) 늦어요. 아주 조금 늦은 소리는 귀가 직접음과 하나로 들어요. 소리 방향은 먼저 온 쪽으로 느껴요(<b>선행음 효과</b>). 하지만 말소리는 약 50 ms 보다 늦게 온 큰 반사가 따로 들려요. 이것이 <b>메아리</b>(에코)예요. 기억해요: 늦고 큰 반사(메아리)는 말을 흐리게 해요.',
        more: '<ul><li><b>계산</b>: 소리는 1초에 약 343 m 를 가요. 그래서 1 m 를 더 돌아오면 1 ÷ 343 ≈ 0.0029초, 약 2.9 ms 늦어요.</li> <li><b>잔향과 메아리</b>: 잔향은 수많은 반사가 촘촘히 이어지며 서서히 줄어드는 울림이에요. 메아리는 한 번 또렷하게 되돌아오는 소리예요.</li> <li><b>선행음 효과 (Wikipedia 「Precedence effect」)</b>: 2 ms 보다 짧은 차이는 하나의 소리로 들려요. 하나로 합쳐 듣는 범위는 소리마다 달라요. 딸깍 소리는 1–5 ms, 말 · 피아노 같은 소리는 40 ms 까지예요.</li> <li><b>메아리 문턱 (같은 자료)</b>: 말은 50 ms, 음악은 약 100 ms 보다 늦으면 메아리로 들려요.</li> <li><b>크기</b>: Haas 의 실험에서는 늦게 온 소리가 최대 10 dB 더 커도 따로 들리지 않았어요(같은 자료). Sound On Sound 용어집도 비슷하게 정리해요. 30 ms 까지는 10 dB 더 커도 방향이 먼저 온 쪽에 남는다고 해요.</li> <li><b>본당의 흔한 메아리</b>: 앞쪽 자리는 직접음이 빨리 와요. 하지만 뒷벽까지 갔다 오는 반사는 훨씬 늦게 와요. 뒷벽이 단단하면 이 소리가 메아리로 들릴 수 있어요. 실습에서 직접 찾아봐요.</li> <li><b>빨리 오는 반사는 도움이 돼요 (무대음향 표준교재)</b>: 직접음 뒤 약 50 ms 안에 오는 반사는 목소리를 더 크고 또렷하게 해 줘요. 그래서 이 몫이 클수록 말이 잘 들려요(음성 명료도 D50).</li> <li><b>딜레이 스피커</b>: 메인 소리가 먼저 도착하게 딜레이(늦추기)를 넣는 것도 선행음 효과를 쓰는 거예요. 그러면 소리가 앞(강단)에서 나는 것처럼 느껴져요.</li></ul>',
        check: { q: '다섯째 줄에서 뒷벽 소리가 120 ms 늦게 또렷이 들려요. 무엇일까요?', options: [
          { t: '직접음과 하나로 들리는 반사', why: '아니에요. 말소리는 약 50 ms 보다 늦으면 하나로 듣지 못해요.' },
          { t: '따로 들리는 메아리(에코)', ok: true, why: '맞아요. 50 ms 를 훨씬 넘겨 또렷하게 돌아오기 때문이에요. 뒷벽 흡음 · 확산이 도움이 돼요.' },
          { t: '방 크기 때문에 생긴 룸 모드', why: '아니에요. 룸 모드는 저음이 자리마다 커지거나 작아지는 일이에요.' }] } },
      { title: '울림 시간 RT60 — 빈 예배당과 찬 예배당', visual: 'prRt60',
        body: '목욕탕에서 「음-」 하면 오래 울려요. 이불이 많은 방에서는 금방 조용해져요. 소리를 멈춘 뒤 울림이 거의 사라지는 시간을 재 봐요. 이 시간을 <b>RT60</b>(잔향 시간)이라고 해요. 방이 클수록 길고, 소리를 많이 먹을수록 짧아요. 세이빈이라는 과학자가 이 시간을 어림하는 식을 만들었어요(<b>세이빈 공식</b>). 소리를 먹는 양은 흡음력이라고 해요. 예를 들어 부피 1000 m³, 흡음력 100 m² 인 방은 약 1.6초예요. 말씀은 울림이 짧아야 앞 글자가 다음 글자를 덮지 않아요. 찬양은 조금 긴 울림이 소리를 풍성하게 이어 줘요. 같은 본당도 사람이 차면, 사람과 옷이 소리를 먹어서 RT60 이 짧아져요. 기억해요: 빈 본당에서 맞춘 소리는 예배 때 다시 들어 봐요.',
        pics: [{ v: 'prEmptyFull', cap: '같은 본당이라도 <b>회중이 차면</b> 사람과 옷이 소리를 먹어서 울림이 짧아져요. 빈 본당에서 맞춘 리버브 · 음량은 예배 때 다시 확인해요.' }],
        more: '<ul><li><b>식</b>: RT60 ≈ 0.161 × V ÷ A 예요. V 는 방의 부피(m³)예요. A 는 면마다 「넓이 × 흡음률」을 모두 더한 <b>흡음력</b>(m², 사빈)이에요. 예: 0.161 × 1000 ÷ 100 ≈ 1.6초예요.</li> <li><b>60 의 뜻</b>: 소리 크기가 60 dB 작아질 때까지의 시간이라 RT60 이에요. 60 dB 는 소리가 거의 사라지는 정도예요.</li> <li><b>권장 범위 (Acoustical Surfaces, 예배 공간)</b>: 말이 중심일수록 짧고, 음악이 중심일수록 길어요. <ul><li>설교 · 강의 0.8–1.2 s</li> <li>현대 예배 1.0–1.5 s</li> <li>전통 성가대 예배 1.5–2.5 s</li> <li>오르간 음악 2.0–3.0 s</li></ul></li> <li><b>자료마다 조금 달라요</b>: 오르간 자문가 Scott Riedel 은 현대 음악 예배에 1.4–1.8 s 를 권해요. 성가 · 오르간 중심 예배에는 2.0–3.0 s 를 권해요(The Diapason). 그래서 정답 하나보다 범위로 봐요.</li> <li><b>0.161</b> 은 소리 빠르기 343 m/s(20 °C)에서 나온 숫자(상수)예요(sengpielaudio). 피트 단위로는 보통 0.049 를 써요(ProSoundTraining).</li> <li><b>빈 의자와 찬 의자 (Hall 표, 500 Hz)</b>: 나무 의자는 비었을 때 0.03, 사람이 앉으면 0.7 이에요. 천 씌운 의자는 비었을 때 0.6, 사람이 앉으면 0.8 이에요.</li> <li>그래서 천 씌운 의자는 빈 상태에서도 사람과 비슷하게 소리를 먹어요. 리허설과 예배의 울림 차이가 작아요.</li> <li><b>RT60 은 보통 500 Hz 값 (무대음향 표준교재)</b>: 따로 말이 없으면 500 Hz 값을 말해요. 실제로 60 dB 가 줄어드는 것을 다 재기는 어려워요. 그래서 30 dB 줄어드는 시간을 재서 2배 해요(T30).</li> <li><b>말이 얼마나 잘 들리나 — STI (같은 교재)</b>: 0 에서 1 사이 숫자로 말소리 명료도를 나타내요. 0.45–0.6 은 「알아들을 수 있다」예요. 0.6–0.75 는 「잘 들린다」, 0.75 이상은 「매우 또렷하다」예요. 스피커로 키운 소리는 간단한 방식(STIPA)으로 재요.</li> <li><b>실습 예시 방</b>(28 × 20 × 9 m, 단단한 벽, 나무 의자)을 계산했어요. 빈 상태는 약 6.4 s, 회중이 찼을 때는 약 2.2 s 예요. 기타 흡음을 어림한 교육용 계산이에요.</li></ul>',
        check: { q: '부피는 그대로, 흡음력(먹는 양)만 2배가 되면 RT60 은요?', options: [
          { t: '약 두 배로 길어진다', why: '아니에요. 소리를 더 많이 먹으면 울림은 짧아져요.' },
          { t: '약 절반으로 짧아진다', ok: true, why: '맞아요. 많이 먹을수록 짧아져서, 2배로 먹으면 울림 시간이 반이 되기 때문이에요.' },
          { t: '부피가 같으니 그대로다', why: '아니에요. 부피가 같아도 먹는 양이 바뀌면 RT60 이 바뀌어요.' }] } },
      { title: '임계 거리 — 왜 마이크를 입 가까이 둘까', visual: 'prCritical',
        body: '시끄러운 식당에서도 친구 입 가까이 귀를 대면 말이 잘 들려요. 소리 나는 곳에서 멀어질수록 곧장 온 소리(직접음)는 작아져요. 하지만 방 안의 울림은 어디서나 비슷하게 깔려 있어요. 그래서 두 소리 크기가 같아지는 거리가 생겨요(<b>임계 거리</b>). 그보다 가까우면 목소리가 커서 또렷해요. 그보다 멀면 울림이 커서 흐릿해요. 울림이 긴 방일수록 임계 거리는 짧아져요. 마이크도 입 가까이 둘수록 목소리가 또렷해요. 예를 들어 거리를 반으로 줄이면 목소리가 약 6 dB 커져요. 한쪽 소리를 주로 받는 마이크(카디오이드)도 도움이 돼요. 기억해요: 마이크를 입 가까이 두면 또렷하고, 하울링에도 강해요.',
        pics: [{ v: 'prMicNear', cap: '방의 울림(잔향)은 마이크 위치와 상관없이 비슷해요. <b>마이크를 입 가까이</b> 두면 목소리만 훨씬 커져서 또렷해요. 멀리 두면 목소리가 울림에 묻혀요.' }],
        more: '<ul><li><b>공식 (Arup 계산 도움말)</b>: D<sub>c</sub> = 0.057 √(Q V ÷ RT) 예요. D<sub>c</sub> 는 m, V 는 m³, RT 는 초예요. 방이 클수록 길고, 잔향이 길수록 짧아요.</li> <li><b>Q</b>: 소리가 한쪽으로 모이는 정도(지향성)예요. 소리를 좁게 보내는 스피커는 Q 가 커서 임계 거리를 늘려 줘요.</li> <li><b>예 (Hearing Review, 2021)</b>: 무지향(Q = 1)일 때를 봐요. 부피 750 m³, RT60 1 s 인 방의 임계 거리는 약 1.56 m 예요.</li> <li><b>마이크 거리 계수 (Shure 기술 팁)</b>: 무지향 1, 카디오이드 1.7, 슈퍼카디오이드 1.9, 하이퍼카디오이드 2.0 이에요.</li> <li>카디오이드는 주변 소리를 덜 받아요. 그래서 무지향보다 1.7배 멀리 두어도, 목소리와 주변 소리의 비가 같아요.</li> <li><b>하울링 전 여유를 늘리는 방법 (HyperPhysics)</b>: 마이크는 소리 내는 사람 가까이 둬요. 스피커는 마이크에서 멀리 둬요. 지향성이 좁은 마이크 · 스피커를 써요.</li> <li><b>재 보기 (Sweetwater)</b>: 소리를 틀어 두고 멀어지며 크기를 재요. 닫힌 방에서는 거리 두 배마다 보통 4–5 dB 씩 줄어요. 그러다 거의 줄지 않는 곳이 나와요. 그 근처가 임계 거리예요.</li> <li>거리 두 배마다 6 dB 는 반사가 없는 이상적인 경우예요(SFU 음향 사전).</li></ul>',
        check: { q: '헤드셋은 입에서 3 cm, 구즈넥은 30 cm 예요. 맞는 말은?', options: [
          { t: '3 cm 쪽이 목소리를 약 20 dB 크게 받는다', ok: true, why: '맞아요. 거리가 1/10 이면 목소리가 약 20 dB 커지기 때문이에요. 그만큼 GAIN 을 덜 올려도 돼요.' },
          { t: '거리와 상관없이 똑같다', why: '아니에요. 목소리는 가까울수록 커지고, 울림은 그대로예요.' },
          { t: '멀수록 울림이 줄어든다', why: '아니에요. 멀어지면 목소리가 줄어서 울림의 몫이 오히려 커져요.' }] } },
      { title: '룸 모드 — 저음이 자리마다 다른 이유', visual: 'prModes',
        body: '목욕탕에서 어떤 높이로 「음-」 하면 유난히 크게 울려요. 마주 보는 두 벽 사이를 저음이 오가면, 나가는 소리와 돌아오는 소리가 겹쳐요. 그러면 제자리에 선 파도가 생겨요(<b>룸 모드</b>, 정재파). 이 저음은 벽 가까이에서는 크고, 가운데 「마디」 자리에서는 아주 작아요. 그래서 같은 베이스가 자리마다 크게도, 작게도 들려요. 가장 낮은 모드는 343 을 「벽 사이 거리 × 2」로 나눠서 구해요. 예를 들어 벽 사이가 8 m 면 343 ÷ 16 = 약 21 Hz 예요. 작은 방일수록 이 저음이 높아져 귀에 잘 들려요. 평행한 두 단단한 벽 사이에서는 손뼉 소리가 「따다다닥」 되풀이돼요. 이것이 <b>플러터 에코</b>예요. 두 벽 중 한쪽만 흡음 · 확산해도 줄어요. 기억해요: 작은 방의 저음은 자리를 옮겨 가며 들어 봐요.',
        more: '<ul><li><b>식</b>: 축 모드(마주 보는 두 면 사이의 모드)는 f = c ÷ 2L 이에요. L 은 두 벽 사이 거리, c 는 소리 빠르기(343 m/s)예요. 그 2배 · 3배 주파수에도 생겨요.</li> <li><b>계산 예</b>: 벽 사이 8 m 면 축 모드가 약 21 · 43 · 64 Hz 예요. 20 m 면 약 8.6 · 17 · 26 Hz 예요.</li> <li><b>Recording Magazine</b>: 축 모드를 1130 ÷ 2L(피트 단위)로 계산해요. 정재파의 큰 곳과 작은 곳은 정해진 자리에 생겨요. 벽에 얇은 폼 · 커튼을 붙여도 정재파는 거의 바뀌지 않는다고 설명해요.</li> <li>모드에는 마주 보는 두 면 사이의 <b>축 모드</b>만 있는 게 아니에요. 네 면을 도는 접선 모드, 여섯 면을 모두 도는 사선 모드도 있어요. 접선 모드는 축 모드의 약 1/2, 사선 모드는 약 1/4 크기예요(무대음향 표준교재).</li> <li><b>플러터 에코 (Vicoustic)</b>: 서로 마주 보는 평평하고 단단한 두 면에서 생겨요. 두 면을 모두 처리할 필요는 없어요. 한쪽만 흡음 · 확산 처리해도 돼요. 새로 지을 때는 한쪽 벽을 5° 이상 비스듬히 세우는 방법도 있어요(무대음향 표준교재). 주로 중고음에서 들리는 문제예요.</li> <li>큰 본당은 처음 몇 개의 축 모드가 아주 낮아서 귀에 잘 안 들려요. 소예배실 · 방송실 · 자모실 같은 작은 방에서 룸 모드가 더 문제가 돼요.</li></ul>',
        check: { q: '방송실 앞벽과 뒷벽 사이가 3.4 m 예요. 가장 낮은 모드는 약 몇 Hz?', options: [
          { t: '약 25 Hz', why: '아니에요. 343 ÷ (2 × 3.4) = 343 ÷ 6.8 을 계산해 봐요.' },
          { t: '약 50 Hz', ok: true, why: '맞아요. 343 ÷ 6.8 ≈ 50 Hz 이기 때문이에요. 100 · 150 Hz 근처에도 생겨요.' },
          { t: '약 100 Hz', why: '아니에요. 343 ÷ 3.4 로, 2 를 곱하는 것을 빠뜨린 값이에요.' }] } },
      { title: '공간과 확성 — 스피커 겨누기 · 하울링 · 흡음 자리', visual: 'prPa',
        body: '손전등은 비춰야 할 곳만 비춰야 눈이 부시지 않아요. 스피커 소리도 필요한 곳, 곧 회중에게만 보내요. 벽 · 천장 · 뒷벽을 바로 때리면 반사와 울림이 커져요. 튕긴 소리는 강단 마이크로도 돌아가요. 이 소리가 다시 스피커로 나가면 「삐-」 <b>하울링</b>이 생기기 쉬워요. 흡음재는 메아리를 만드는 면(예: 뒷벽)부터 붙여요. 확산재는 소리를 흩어서, 울림은 남기고 메아리만 줄여요. 콘솔 리버브는 울림을 더하는 효과라 공간의 울림을 빼지 못해요. 그래서 말이 울릴 때는 공간 쪽부터 고쳐요. 기억해요: 스피커 방향 → 마이크 거리 → 흡음 → 마지막에 EQ 예요.',
        pics: [{ v: 'prFixSteps', cap: '말이 울려서 잘 안 들릴 때는 <b>공간 쪽부터</b> 고쳐요. 스피커 방향 → 마이크 거리 → 흡음 · 확산 순서예요. EQ · 리버브는 마지막이에요.' }],
        more: '<ul><li><b>확성</b>: 소리를 키워 퍼뜨리는 일이에요. 첫걸음은 소리를 필요한 곳(회중)에 보내는 거예요.</li> <li><b>QSC 사운드 어드바이스</b>: 유리 · 돌 · 타일 · 콘크리트 같은 큰 반사면을 스피커가 마주 보지 않게 하라고 해요. 첫 반사를 줄이면 더 또렷하게 들린다고 안내해요.</li> <li><b>하울링 전 여유 (HyperPhysics)</b>: 이런 방법을 들어요. 스피커를 마이크에서 멀게 둬요. 마이크를 입 가까이 둬요. 지향성이 좁은 마이크 · 스피커를 써요. 피드백 서프레서 · EQ 를 써요.</li> <li>스피커를 듣는 사람 가까이 두고 딜레이를 넣는 방법도 들어요.</li> <li><b>흡음은 적당히 (The Diapason)</b>: 오르간 자문가 Riedel 은 알맞은 잔향이 회중 찬양을 받쳐 준다고 봐요. 너무 많이 흡음하면 회중 찬양이 힘을 잃을 수 있어요. 그래서 말씀과 찬양의 균형을 맞춘 범위를 목표로 해요.</li> <li><b>공간계 이펙트와 구분</b>: 믹싱 과정의 「공간계 이펙트」는 콘솔에서 더하는 인공 울림(리버브)이에요. 이 과정의 잔향은 공간이 만드는 진짜 울림이에요. 콘솔의 리버브는 공간의 잔향 위에 더해져요. 이미 잔향이 긴 본당에서는 리버브를 아주 조금만 넣거나 안 넣어도 될 때가 있어요.</li> <li><b>발코니 아래 자리 (무대음향 표준교재)</b>: 발코니가 천장 반사를 가려요. 그래서 소리가 덜 또렷하고, 저음이 많게 들리기 쉬워요. 그래서 발코니 아래에는 딜레이 스피커를 따로 두기도 해요.</li> <li>3층 본당의 실제 스피커 위치는 「3층 음향 시스템」 3D 에서 볼 수 있어요.</li></ul>',
        check: { q: '설교 말이 울려서 뒤쪽에서 잘 안 들린대요. 먼저 할 일은?', options: [
          { t: '콘솔 리버브를 더 넣는다', why: '아니에요. 리버브는 울림을 더하는 효과라 더 흐려져요.' },
          { t: '전체 음량을 크게 올린다', why: '아니에요. 소리가 커지면 반사와 울림도 같이 커지고, 하울링 위험도 커져요.' },
          { t: '마이크는 입 가까이, 스피커는 회중 쪽으로', ok: true, why: '맞아요. 목소리를 키우고 반사를 줄이는 것이 먼저이기 때문이에요. 뒤쪽은 딜레이 스피커도 도움이 돼요.' }] } }
    ],
    practice: {
      kind: 'roomLab',
      lead: '본당을 위에서 본 가상 그림이에요. 「벽 재질」에서 재질을 고른 뒤 그림의 벽을 눌러 바꿔요. 파란 동그라미(듣는 자리)와 오른쪽 아래 네모(방 크기)는 끌 수 있어요. 아래 「설교자 마이크 거리」에서는 마이크를 끌어요. 오른쪽 숫자를 보며 과제를 해요.',
      note: '흡음률은 500 Hz 값(Hall 표 · sengpielaudio)이에요. RT60 은 세이빈 공식으로 계산해요. 권장 범위는 Acoustical Surfaces 자료예요. 마이크 거리 계수는 Shure 자료예요. 확산판(α 0.1, 반사의 70 % 를 흩음)은 공부용 가정이에요. 기타 흡음(모든 면에 α 0.04 더함)도 가정이에요. 회중석 넓이, 스피커 · 귀 높이, 목소리 지향성 Q = 2 도 가정이에요. 메아리 위험 기준(50 ms 넘고 −15 dB 이상)도 그래요. 실제 공간은 주파수마다, 자리마다 달라서 측정으로 확인해요.',
      tasks: [
        { id: 'rt', title: '찬양 예배에 맞는 울림', text: '「회중 가득」을 눌러요. 벽 · 천장 · 바닥 재질을 바꿔요. RT60 이 1.0–1.5 s(초)가 되면 성공이에요.' },
        { id: 'seats', title: '빈 예배당 · 찬 예배당 비교', text: '「빈 예배당」과 「회중 가득」을 번갈아 눌러요. 의자를 「천 씌운 의자」로 바꿔요. 두 RT60 차이가 0.5 s 이하면 성공이에요.' },
        { id: 'echo', title: '뒷벽 메아리 없애기', text: '듣는 자리를 끌어 「메아리 위험」이 뜨는 자리를 찾아요. 그 자리에서 뒷벽을 흡음판이나 확산판으로 바꿔요. 위험이 사라지면 성공이에요.' },
        { id: 'flutter', title: '플러터 에코 막기', text: '옆벽 한쪽을 흡음판 · 커튼 · 확산판 중 하나로 바꿔요. 「플러터 에코가 줄었어요」가 뜨면 성공이에요.' },
        { id: 'mode', title: '작은 방의 저음 자리', text: '방 크기 네모를 끌어 폭을 8.5 m 이하로 줄여요. 「저음 모드 보기 · 폭 방향 1차」를 켜요. 듣는 자리를 가운데 줄(마디)로 옮기면 성공이에요.' },
        { id: 'mic', title: '마이크는 입 가까이', text: '「설교자 마이크 거리」에서 마이크를 입 쪽으로 끌어요. 「직접음 − 잔향」이 +10 dB 이상이면 성공이에요. 지향성 버튼도 바꿔 봐요.' }
      ],
      links: [
        { title: '하울링 제어 훈련', text: '마이크 · 스피커 · 반사가 만드는 하울링을 직접 줄여 봐요.', go: { tab: 'tabFeedback' } },
        { title: '3층 음향 시스템', text: '본당에 실제로 설치된 스피커 위치를 3D 로 봐요.', go: { tab: 'tab2' } }
      ]
    },
    quiz: [
      { q: 'RT60 = 0.161 × 부피 ÷ 흡음력이에요. 3000 m³ · 400 m² 면?', options: [
        { t: '약 0.12 s', why: '아니에요. 0.161 × 3000 ÷ 400 을 다시 계산해 봐요.' },
        { t: '약 1.2 s', ok: true, why: '맞아요. 0.161 × 3000 ÷ 400 ≈ 1.2 s 이기 때문이에요. 현대 예배에 알맞은 범위예요.' },
        { t: '약 12 s', why: '아니에요. 계산을 다시 해 봐요. 0.161 × 3000 은 약 483 이에요.' }] },
      { q: '리허설은 빈 본당, 주일은 회중이 가득해요. 예배 때 소리는요?', options: [
        { t: '울림이 짧아져 더 메마르게 들린다', ok: true, why: '맞아요. 사람 앉은 의자(0.7)가 빈 나무 의자(0.03)보다 소리를 훨씬 많이 먹기 때문이에요.' },
        { t: '사람이 많아 울림이 길어진다', why: '아니에요. 사람과 옷은 소리를 먹어서 울림을 줄여요.' },
        { t: '공간과 상관없이 똑같다', why: '아니에요. 스피커 소리도 공간에서 튕기고 먹혀요.' }] },
      { q: '그림처럼 앞쪽 자리에서 뒷벽 메아리가 들려요. 어떻게 할까요?', visual: 'prEchoPlan', options: [
        { t: '강단 앞벽에만 흡음재를 붙인다', why: '아니에요. 메아리는 뒷벽에서 튕겨 오는 소리예요. 문제 면부터 처리해요.' },
        { t: '콘솔 리버브를 줄인다', why: '아니에요. 공간이 만드는 메아리는 콘솔로 뺄 수 없어요.' },
        { t: '뒷벽에 흡음 · 확산재를 둔다', ok: true, why: '맞아요. 뒷벽 반사를 줄이거나 흩으면 메아리가 줄기 때문이에요. 스피커가 뒷벽을 때리지 않게 겨누는 것도 좋아요.' }] },
      { q: '같은 본당에서 RT60 이 길어지면 임계 거리는요?', options: [
        { t: '짧아진다 — 마이크를 더 가까이', ok: true, why: '맞아요. 방에 깔린 울림이 커져서, 또렷하게 들리는 거리가 짧아지기 때문이에요.' },
        { t: '길어진다', why: '아니에요. 울림이 길어지면 임계 거리는 줄어요.' },
        { t: '마이크 종류로만 정해진다', why: '아니에요. 방 크기와 울림, 소리 내는 쪽의 방향성이 함께 정해요.' }] },
      { q: '소예배실에서 베이스가 어떤 자리는 크고 옆줄은 작아요. 왜일까요?', options: [
        { t: '선행음 효과', why: '아니에요. 선행음 효과는 소리 방향을 먼저 온 쪽으로 느끼는 일이에요.' },
        { t: '룸 모드(정재파)', ok: true, why: '맞아요. 두 벽 사이에 갇힌 저음이 자리마다 크게 또는 작게 들리기 때문이에요.' },
        { t: '커튼의 흡음률', why: '아니에요. 얇은 커튼은 저음을 거의 못 먹고, 자리마다 다른 저음을 만들지도 않아요.' }] }
    ],
    missions: [
      { title: '하울링 제어 훈련', text: '스피커 소리가 마이크로 되돌아가 생기는 하울링을 직접 겪고 줄여 봐요. 마이크는 입 가까이, 스피커는 마이크에서 멀게 두는 이유를 확인해요.', go: { tab: 'tabFeedback' } },
      { title: '자가 진단 기준표 · 룸 어쿠스틱', text: '우리 본당의 울림 · 메아리 · 스피커가 퍼뜨리는 각도를 항목별로 점검해요. 고칠 순서도 정해 봐요.', go: { tab: 'tabCheck' } }
    ],
    deeper: [
      { title: '세이빈 공식이 잘 안 맞을 때', text: '세이빈 공식은 소리가 방에 고르게 퍼진다고 생각하고 계산해요. 소리를 먹는 것이 아주 많거나 한쪽에 몰리면 실제와 달라져요. 그래서 설계할 때는 다른 식도 함께 봐요.', more: '<ul><li><b>세이빈과 에어링 (ProSoundTraining)</b>: 세이빈 식은 흡음이 적은 방에서 더 잘 맞아요. 무대음향 표준교재는 평균 흡음률 0.2 를 기준으로 나눠요. 0.2 이하면 세이빈, 넘으면 에어링 식이 잘 맞는다고 해요. 흡음이 많은 방에서는 에어링(Eyring) 식이 더 짧은 잔향을 내요. 그래서 설계 프로그램은 두 식을 함께 보여 주기도 해요.</li> <li>큰 공간에서는 높은 소리를 <b>공기</b>가 먹는 몫도 커져요. 이 실습은 공기 · 문 · 창틀 같은 나머지를 「기타 흡음」 하나로 어림했어요.</li> <li>실제 설계는 주파수마다(보통 125 Hz–4 kHz) 따로 계산해요. 다 지은 뒤에는 측정해서 확인해요.</li></ul>' },
      { title: '저음 울림이 더 오래 남는 이유', text: '사람 · 카펫 · 커튼은 높은 소리를 잘 먹어요. 하지만 저음은 덜 먹어요. 그래서 많은 공간에서 저음 울림이 더 오래 남아 「웅웅」 거려요.', more: '<ul><li><b>Hall 표 (HyperPhysics)</b>: 사람 앉은 나무 의자는 125 Hz 0.4, 1 kHz 0.7 이에요. 카펫(콘크리트 위)은 125 Hz 0.02, 2 kHz 0.6 이에요.</li> <li>저음을 줄이는 방법은 세 가지예요(Wikipedia 「Bass trap」). 두꺼운 흡음재, 모서리에 두는 <b>베이스 트랩</b>이 있어요. 얇은 판이 떨며 저음을 먹는 판 진동형 흡음재도 있어요.</li> <li>서브우퍼 음량 · 위치도 공간의 저음에 큰 영향을 줘요. 저음이 자리마다 다르면 여러 자리를 걸어 다니며 들어 봐요.</li></ul>' },
      { title: '우리 본당 울림 재 보기', text: '정확히 재려면 측정 마이크와 프로그램이 필요해요. 그래도 손뼉 같은 쉬운 방법으로 우리 본당의 울림을 짐작할 수 있어요.', more: '<ul><li><b>손뼉 · 풍선</b>: 빈 본당에서 크게 손뼉을 치고, 소리가 사라질 때까지 들어 봐요. 같은 자리에서 회중이 찼을 때와 견주면 차이를 느낄 수 있어요. 「따다다닥」 되풀이되면 플러터 에코예요.</li> <li><b>RT60 측정 앱 · 소음계</b>: 휴대폰 앱으로 대강 잴 수 있어요. 하지만 휴대폰 마이크는 정밀하지 않아요. 결과는 참고로만 봐요.</li> <li><b>임계 거리 걷기 (Sweetwater)</b>: 소리를 틀어 두고 멀어지며 크기를 재요. 거리 두 배마다 4–5 dB 씩 줄다가, 거의 줄지 않는 곳이 나와요. 그 근처가 임계 거리예요.</li></ul>' }
    ],
    sources: [
      { t: 'Modeling Reverberation Time — HyperPhysics (Hall 「Musical Acoustics」 2판 표 15.1: 재질별 흡음률 125 Hz–4 kHz)', url: 'https://hyperphysics.gsu.edu/hbase/Acoustic/revmod.html' },
      { t: 'Reverberation time RT60 calculator — sengpielaudio (세이빈 RT60 = 0.161 · V / A, c = 343 m/s · 20 °C)', url: 'https://sengpielaudio.com/calculator-RT60.htm' },
      { t: 'Absorption coefficients — sengpielaudio (유리섬유판 2" · 사람 · 의자 흡음률)', url: 'https://sengpielaudio.com/calculator-RT60Coeff.htm' },
      { t: 'The Impact of Acoustics on Worship Spaces & Churches — Acoustical Surfaces (설교 0.8–1.2 s · 현대 예배 1.0–1.5 s · 성가대 1.5–2.5 s · 오르간 2.0–3.0 s)', url: 'https://www.acousticalsurfaces.com/?p=77725' },
      { t: 'Acoustics in the Worship Space IX — Scott R. Riedel, The Diapason (현대 예배 1.4–1.8 s · 전례 2.0–3.0 s · 회중 찬양 지원)', url: 'https://thediapason.com/content/acoustics-worship-space-ix' },
      { t: 'Precedence effect — Wikipedia (2 ms · 합쳐 듣기 1–5 ms / 40 ms · 메아리 50 ms / 100 ms · 최대 10 dB)', url: 'https://en.wikipedia.org/wiki/Precedence_effect' },
      { t: 'Haas Effect — Sound On Sound 용어집 (30 ms · 10 dB)', url: 'https://www.soundonsound.com/glossary/haas-effect' },
      { t: 'Critical distance — Arup Strutt 도움말 (D_c = 0.057 √(QV/RT))', url: 'https://strutt.arup.com/help/Electroacoustics/DCritical.htm' },
      { t: 'Critical Distance — Hearing Review, 2021 (750 m³ · RT60 1 s → 약 1.56 m)', url: 'https://hearingreview.com/hearing-loss/health-wellness/critical-distance' },
      { t: 'Shure Apps Tech Tip: Microphone Distance Factor (무지향 1 · 카디오이드 1.7 · 슈퍼 1.9 · 하이퍼 2.0, 판매점 게시 사본)', url: 'https://geartechs.com/blogs/resources/shure-apps-tech-tip-microphone-distance-factor' },
      { t: 'How to determine critical distance — Sweetwater (거리 두 배마다 4–5 dB, 카디오이드는 약 두 배 거리)', url: 'https://www.sweetwater.com/insync/determine-critical-distance/' },
      { t: 'Increasing Potential Acoustic Gain — HyperPhysics (하울링 전 여유 늘리기)', url: 'https://hyperphysics.gsu.edu/hbase/Audio/pagi.html' },
      { t: 'Inverse-Square Law — SFU Handbook for Acoustic Ecology (거리 두 배마다 6 dB, 자유 음장)', url: 'https://www.sfu.ca/sonic-studio-webdav/cmns/Handbook/Inverse-Square_Law.html' },
      { t: 'Room Acoustics Fundamentals — Recording Magazine (축 모드 1130 / 2L ft, 정재파의 큰 곳 · 작은 곳)', url: 'https://www.recordingmag.com/resources/recording-info/acoustics-monitoring/room-acoustics-fundamentals' },
      { t: 'What Is Flutter Echo? — Vicoustic (평행하고 단단한 두 면, 한쪽만 처리)', url: 'https://vicoustic.com/blogs/articles/what-is-flutter-echo' },
      { t: 'Bass trap — Wikipedia (다공성 흡음재 두께와 저음, 판 진동형 흡음재)', url: 'https://en.wikipedia.org/wiki/Bass_trap' },
      { t: 'Calculating Reverberation Time (RT) — Richard Honeycutt, ProSoundTraining (세이빈 · 에어링, 피트 단위 상수 0.049)', url: 'https://www.prosoundtraining.com/?p=43887' },
      { t: 'Sound Advice: Loudspeaker placement part 5 — Reflective surfaces, QSC (큰 반사면을 마주 보지 않게)', url: 'https://support.qscaudio.com/en_US/sound-advice/sound-advice-%7C-loudspeaker-placement-part-5-reflective-surfaces' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 1장 기초 음향 · 음파 특성(반사 · 확산 · 흡음 · 차음 · 정재파 축파/접선파/경사파) p.19–23', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 11장 공연장 실내음향 · 소리 전파 · 최적 잔향 · 평가지표(RT 500 Hz · T30 · 세이빈/에어링 0.2 · D50 · STI/STIPA) p.327–343', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 11장 음향 장해(음의 초점 · 에코 · 플러터 에코 5° · 실내 공진) p.345–349', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 11장 흡음과 확산 · 공연장 구조(다공질 · 판진동 · 공명기형 · 타공판 · 오목 면 · 돔 천장 · 발코니) p.351–361', url: '' }
    ]
  };
})();
