/* =============================================================================
   학습 모듈: Gate — 작은 잡음을 닫아 깨끗하게 (믹싱 스킬 03)
   - 모듈 데이터: window.STA_MODULES.gate
   - 그림: STAVisuals.gateTransfer / gateConcept / gateTimes / gateSeparate / gateChop / gateTom / gateCl5
   - 실습: STASims.gateSim — 실제 녹음(leadVox 또는 drumLR) + 일정한 배경 잡음을 실시간 게이트로 처리.
     게이트 계산(검출 → Hold → Release)은 한 함수(mkGate)로, 소리를 켜면 ScriptProcessorNode 안에서,
     소리를 끄면 화면 갱신마다 같은 함수로 계산 → file:// 와 https 모두 동작(AudioWorklet 를 쓰지 않음).
   - 장비 수치: CL5 레퍼런스 매뉴얼(제조사 자료). 모델링 값은 「교육용 근사」로 표시.
   ============================================================================= */
(function () {
  'use strict';
  var C = { ink: '#0f2747', sub: '#5b6b80', line: '#cbd5e1', teal: '#0e7490', cyan: '#22d3ee', blue: '#2563eb', red: '#dc2626', amber: '#f59e0b', green: '#16a34a', violet: '#7c3aed', bg: '#f8fafc' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + s + '</text>'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function db(x) { return 20 * Math.log10(Math.max(x, 1e-9)); }

  /* ------------------------------------------------------------- 그림용: 블록 단위 게이트(교육용 근사) */
  function rnd(seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function sumDb(a, b) { return 10 * Math.log10(Math.pow(10, a / 10) + Math.pow(10, b / 10)); }
  function blockGate(lv, dt, P) {   // lv: dB 배열(검출 레벨) → 게인 dB 배열
    var g = P.range, hold = 0, out = [], fl = P.range;
    lv.forEach(function (v) {
      if (v >= P.thr) { hold = P.hold; g = P.att > 0 ? Math.min(0, g + (0 - fl) * dt / P.att) : 0; }
      else if (hold > 0) { hold -= dt; g = P.att > 0 ? Math.min(0, g + (0 - fl) * dt / P.att) : 0; }
      else g = Math.max(fl, g - (0 - fl) * dt / Math.max(dt, P.rel));
      out.push(g);
    });
    return out;
  }
  function plot(o) { // o: x0,x1,y0,y1,t1,dbMin,dbMax
    o.tx = function (s) { return o.x0 + s / o.t1 * (o.x1 - o.x0); }; o.ly = function (d) { return o.y0 + (o.dbMax - clamp(d, o.dbMin, o.dbMax)) / (o.dbMax - o.dbMin) * (o.y1 - o.y0); };
    o.line = function (arr, dt) { return arr.map(function (v, i) { return (i ? 'L' : 'M') + o.tx(i * dt).toFixed(1) + ' ' + o.ly(v).toFixed(1); }).join(''); };
    o.area = function (arr, dt) { return o.line(arr, dt) + 'L' + o.tx((arr.length - 1) * dt).toFixed(1) + ' ' + o.y1 + 'L' + o.x0 + ' ' + o.y1 + 'Z'; };
    o.frame = '<rect x="' + o.x0 + '" y="' + o.y0 + '" width="' + (o.x1 - o.x0) + '" height="' + (o.y1 - o.y0) + '" fill="' + C.bg + '" stroke="' + C.line + '"/>';
    return o;
  }
  function spans(arr, dt, pred) { var r = [], s = -1; arr.forEach(function (v, i) { var p = pred(v, i); if (p && s < 0) s = i; if (!p && s >= 0) { r.push([s * dt, i * dt]); s = -1; } }); if (s >= 0) r.push([s * dt, arr.length * dt]); return r; }

  /* ======================================================================= 그림 */
  var V = window.STAVisuals = window.STAVisuals || {};
  V.gateTransfer = function () {
    var x0 = 60, x1 = 330, y0 = 24, y1 = 214, mn = -72, thr = -40;
    function X(d) { return x0 + (d - mn) / (0 - mn) * (x1 - x0); } function Y(d) { return y1 - (clamp(d, mn, 0) - mn) / (0 - mn) * (y1 - y0); }
    var grid = [-72, -60, -48, -36, -24, -12, 0].map(function (d) { return '<path d="M' + X(d) + ' ' + y0 + 'V' + y1 + 'M' + x0 + ' ' + Y(d) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(X(d), y1 + 15, d, { size: 10, fill: C.sub }) + t(x0 - 6, Y(d) + 4, d, { size: 10, fill: C.sub, anchor: 'end' }); }).join('');
    var ref = '<path d="M' + X(mn) + ' ' + Y(mn) + 'L' + X(0) + ' ' + Y(0) + '" stroke="#94a3b8" stroke-dasharray="5 4"/>';
    var r20 = '<path d="M' + X(-52) + ' ' + Y(-72) + 'L' + X(thr) + ' ' + Y(thr - 20) + 'L' + X(thr) + ' ' + Y(thr) + '" stroke="' + C.amber + '" stroke-width="2.4" fill="none"/>';
    var inf = '<path d="M' + X(thr) + ' ' + y1 + 'L' + X(thr) + ' ' + Y(thr) + 'L' + X(0) + ' ' + Y(0) + '" stroke="' + C.teal + '" stroke-width="3.4" fill="none"/>';
    return svg(600, 252, grid + ref + r20 + inf + '<path d="M' + X(thr) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.red + '" stroke-width="1.6" stroke-dasharray="6 4"/>' + t(X(thr) + 4, y0 + 12, 'Threshold −40 dB', { size: 11, fill: C.red, weight: 800, anchor: 'start' }) +
      t((x0 + x1) / 2, 248, '입력 (dB)', { size: 11, fill: C.sub }) + t(18, 120, '출력', { size: 11, fill: C.sub }) +
      '<g>' + t(352, 52, '열림 (Threshold 위)', { size: 13, weight: 800, fill: C.teal, anchor: 'start' }) + t(352, 70, '입력이 그대로 나가요 (1:1)', { size: 11.5, fill: C.sub, anchor: 'start' }) +
      t(352, 104, '닫힘 (Threshold 아래)', { size: 13, weight: 800, fill: C.ink, anchor: 'start' }) + t(352, 122, 'Range 만큼 줄여요', { size: 11.5, fill: C.sub, anchor: 'start' }) +
      '<path d="M352 142h26" stroke="' + C.teal + '" stroke-width="3.4"/>' + t(384, 146, 'Range −∞ : 완전히 끔', { size: 11.5, fill: C.teal, weight: 700, anchor: 'start' }) +
      '<path d="M352 164h26" stroke="' + C.amber + '" stroke-width="2.4"/>' + t(384, 168, 'Range −20 dB : 20 dB 만 줄임', { size: 11.5, fill: '#b45309', weight: 700, anchor: 'start' }) +
      '<path d="M352 186h26" stroke="#94a3b8" stroke-dasharray="5 4"/>' + t(384, 190, '게이트 없음', { size: 11.5, fill: C.sub, anchor: 'start' }) +
      t(352, 222, '입력·출력 관계 (교육용 그림)', { size: 10.5, fill: C.sub, anchor: 'start' }) + '</g>', '게이트의 입력과 출력 관계');
  };
  function speech(seed, T, dt, noise, words) {   // 잡음 + 말(단어) 레벨(dB)
    var r = rnd(seed), out = [], clean = [];
    for (var i = 0; i * dt < T; i++) {
      var s = i * dt, c = -120;
      words.forEach(function (w) { var a = w[0], b = w[1], pk = w[2];
        if (s >= a && s < b) { var on = Math.min(1, (s - a) / 0.05), syl = pk - 7 * Math.abs(Math.sin(Math.PI * (s - a) / 0.2)); c = Math.max(c, on < 1 ? -42 + (syl + 42) * on : syl); }
        else if (s >= b) c = Math.max(c, pk - 6 - (s - b) * 75); });
      clean.push(c); out.push(sumDb(c, noise + (r() - 0.5) * 6));
    }
    return { lv: out, clean: clean };
  }
  V.gateConcept = function () {
    var dt = 0.01, T = 3, sp = speech(7, T, dt, -50, [[0.35, 1.05, -12], [1.75, 2.45, -16]]), P = { thr: -38, att: 0.002, hold: 0.04, rel: 0.12, range: -60 };
    var g = blockGate(sp.lv, dt, P), o = plot({ x0: 46, x1: 584, y0: 26, y1: 150, t1: T, dbMin: -66, dbMax: 0 });
    var open = spans(g, dt, function (v) { return v > -6; });
    var body = o.frame + [-60, -40, -20, 0].map(function (d) { return '<path d="M' + o.x0 + ' ' + o.ly(d) + 'H' + o.x1 + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(o.x0 - 5, o.ly(d) + 4, d, { size: 10, fill: C.sub, anchor: 'end' }); }).join('') +
      '<path d="' + o.area(sp.lv, dt) + '" fill="#94a3b8" fill-opacity=".35"/><path d="' + o.line(sp.lv, dt) + '" fill="none" stroke="#64748b" stroke-width="1.4"/>' +
      '<path d="M' + o.x0 + ' ' + o.ly(P.thr) + 'H' + o.x1 + '" stroke="' + C.red + '" stroke-width="2" stroke-dasharray="7 4"/>' + t(o.x1 - 4, o.ly(P.thr) - 6, 'Threshold', { size: 11, fill: C.red, weight: 800, anchor: 'end' }) +
      t(o.tx(0.7), o.ly(-6), '말', { size: 12, weight: 800 }) + t(o.tx(2.1), o.ly(-10), '말', { size: 12, weight: 800 }) + t(o.tx(1.4), o.ly(-61), '잡음만 (말 사이)', { size: 11, fill: C.sub, weight: 700 }) +
      '<rect x="' + o.x0 + '" y="164" width="' + (o.x1 - o.x0) + '" height="20" rx="4" fill="#e2e8f0"/>' + open.map(function (s) { return '<rect x="' + o.tx(s[0]).toFixed(1) + '" y="164" width="' + (o.tx(s[1]) - o.tx(s[0])).toFixed(1) + '" height="20" rx="4" fill="' + C.green + '"/>'; }).join('') +
      t(o.x0 - 5, 178, '게이트', { size: 10, fill: C.sub, anchor: 'end' }) + (open.length ? t(((o.tx(open[0][0]) + o.tx(open[0][1])) / 2).toFixed(1), 178, '열림', { size: 11, fill: '#fff', weight: 800 }) : '') + (open.length > 1 ? t(((o.tx(open[0][1]) + o.tx(open[1][0])) / 2).toFixed(1), 178, '닫힘', { size: 11, fill: C.sub, weight: 800 }) : '') +
      t(o.x0, 206, '0', { size: 10, fill: C.sub }) + t(o.x1, 206, '3초', { size: 10, fill: C.sub }) + t(584, 16, '입력 크기(dB)와 게이트 상태 — 교육용 근사 그림', { size: 11, fill: C.sub, anchor: 'end' }) + t(46, 16, 'dB', { size: 10, fill: C.sub, anchor: 'end' });
    return svg(600, 214, body, '입력 크기와 Threshold, 게이트가 열리고 닫히는 구간');
  };
  V.gateTimes = function () {
    var x0 = 40, x1 = 584, T = 1.2;
    function X(s) { return x0 + s / T * (x1 - x0); }
    var lvY = function (d) { return 30 + (-d) / 70 * 70; }, gY = function (d) { return 132 + (-d) / 40 * 70; };
    var a = 0.2, b = 0.62, att = 0.06, hold = 0.16, rel = 0.3;
    var inp = 'M' + X(0) + ' ' + lvY(-55) + 'L' + X(a) + ' ' + lvY(-55) + 'L' + X(a + 0.01) + ' ' + lvY(-14) + 'L' + X(b) + ' ' + lvY(-18) + 'L' + X(b + 0.06) + ' ' + lvY(-55) + 'L' + X(T) + ' ' + lvY(-55);
    var gp = 'M' + X(0) + ' ' + gY(-40) + 'L' + X(a) + ' ' + gY(-40) + 'L' + X(a + att) + ' ' + gY(0) + 'L' + X(b + hold) + ' ' + gY(0) + 'L' + X(b + hold + rel) + ' ' + gY(-40) + 'L' + X(T) + ' ' + gY(-40);
    var thrY = lvY(-35);
    function brk(s0, s1, y, txt, col) { return '<path d="M' + X(s0) + ' ' + (y - 5) + 'V' + (y + 5) + 'M' + X(s0) + ' ' + y + 'H' + X(s1) + 'M' + X(s1) + ' ' + (y - 5) + 'V' + (y + 5) + '" stroke="' + col + '" stroke-width="1.8"/>' + t((X(s0) + X(s1)) / 2, y - 7, txt, { size: 11.5, fill: col, weight: 800 }); }
    return svg(600, 236, '<rect x="' + x0 + '" y="24" width="' + (x1 - x0) + '" height="80" fill="' + C.bg + '" stroke="' + C.line + '"/><rect x="' + x0 + '" y="126" width="' + (x1 - x0) + '" height="80" fill="' + C.bg + '" stroke="' + C.line + '"/>' +
      '<path d="' + inp + '" fill="none" stroke="#64748b" stroke-width="2.2"/><path d="M' + x0 + ' ' + thrY + 'H' + x1 + '" stroke="' + C.red + '" stroke-dasharray="7 4" stroke-width="1.6"/>' + t(x1 - 4, thrY - 5, 'Threshold', { size: 11, fill: C.red, weight: 800, anchor: 'end' }) + t(x0 + 4, 40, '입력', { size: 11, fill: C.sub, weight: 800, anchor: 'start' }) +
      '<path d="' + gp + '" fill="none" stroke="' + C.teal + '" stroke-width="3"/>' + t(x0 + 4, 142, '게이트 게인', { size: 11, fill: C.sub, weight: 800, anchor: 'start' }) + t(x0 - 4, gY(0) + 4, '0 dB', { size: 10, fill: C.sub, anchor: 'end' }) + t(x0 - 4, gY(-40) + 4, '−40', { size: 10, fill: C.sub, anchor: 'end' }) +
      '<path d="M' + X(a) + ' 24V206M' + X(b + 0.035) + ' 24V206" stroke="#94a3b8" stroke-dasharray="2 3"/>' +
      brk(a, a + att, 120, 'Attack', C.blue) + brk(b + 0.035, b + hold, 120, 'Hold', C.amber) + brk(b + hold, b + hold + rel, 120, 'Release', C.violet) +
      '<path d="M' + X(1.12) + ' ' + gY(0) + 'V' + gY(-40) + '" stroke="' + C.red + '" stroke-width="2"/><path d="M' + (X(1.12) - 4) + ' ' + (gY(-40) - 7) + 'L' + X(1.12) + ' ' + gY(-40) + 'L' + (X(1.12) + 4) + ' ' + (gY(-40) - 7) + '" fill="none" stroke="' + C.red + '" stroke-width="2"/>' + t(X(1.1), gY(-20), 'Range', { size: 11.5, fill: C.red, weight: 800, anchor: 'end' }) +
      t(X(a) + 3, 220, '기준을 넘음', { size: 10.5, fill: C.sub, anchor: 'start' }) + t(X(b + 0.035) + 3, 220, '기준 아래로', { size: 10.5, fill: C.sub, anchor: 'start' }) + t(584, 14, '시간 → (보기 쉽게 시간을 늘려 그린 교육용 그림)', { size: 11, fill: C.sub, anchor: 'end' }), 'Attack Hold Release Range 의 역할');
  };
  V.gateSeparate = function () {
    function Y(d) { return 24 + (-d) / 70 * 170; }
    function col(x, title, nz, sp, thr, okTxt, ok) {
      return t(x + 120, 16, title, { size: 13, weight: 800, fill: ok ? C.green : C.red }) +
        '<rect x="' + (x + 40) + '" y="' + Y(sp[1]) + '" width="70" height="' + (Y(sp[0]) - Y(sp[1])) + '" rx="6" fill="' + C.teal + '" fill-opacity=".8"/>' + t(x + 75, Y(sp[1]) - 5, '말소리', { size: 11, fill: C.teal, weight: 800 }) +
        '<rect x="' + (x + 130) + '" y="' + Y(nz[1]) + '" width="70" height="' + (Y(nz[0]) - Y(nz[1])) + '" rx="6" fill="#94a3b8" fill-opacity=".85"/>' + t(x + 165, Y(nz[1]) - 5, '잡음', { size: 11, fill: C.sub, weight: 800 }) +
        '<path d="M' + (x + 30) + ' ' + Y(thr) + 'H' + (x + 214) + '" stroke="' + C.red + '" stroke-width="2" stroke-dasharray="7 4"/>' + t(x + 216, Y(thr) + 4, 'Threshold?', { size: 10.5, fill: C.red, weight: 700, anchor: 'start' }) +
        t(x + 120, 218, okTxt, { size: 11.5, fill: ok ? C.green : C.red, weight: 700 });
    }
    var ticks = [0, -20, -40, -60].map(function (d) { return t(24, Y(d) + 4, d, { size: 10, fill: C.sub, anchor: 'end' }) + '<path d="M28 ' + Y(d) + 'H580" stroke="' + C.line + '" stroke-dasharray="2 4"/>'; }).join('');
    return svg(600, 246, ticks + t(24, 12, 'dB', { size: 10, fill: C.sub, anchor: 'end' }) + col(20, '간격이 넉넉해요', [-56, -46], [-30, -6], -38, '잡음 위·말소리 아래에 둘 곳이 있어요', true) + col(310, '간격이 좁아요', [-44, -32], [-40, -12], -36, '어디에 두어도 말이 잘리거나 잡음이 남아요', false) +
      t(580, 240, '크기 범위는 예시 (교육용 그림)', { size: 10, fill: C.sub, anchor: 'end' }), '잡음과 말소리의 크기 차이에 따른 게이트 사용 가능성');
  };
  V.gateChop = function () {
    var dt = 0.005, T = 1.6;
    function lvl(s) {   // 「사랑합니다」 (교육용 근사)
      var c = -120;
      if (s >= 0.2 && s < 0.29) c = -38 + (s - 0.2) * 40;            // ㅅ (작은 마찰음)
      else if (s >= 0.29 && s < 1.05) c = -13 - 8 * Math.abs(Math.sin(Math.PI * (s - 0.29) / 0.19));   // 모음들
      else if (s >= 1.05) c = -21 - (s - 1.05) * 90;                  // 「다」 끝이 작아짐
      return c;
    }
    var clean = [], lv = [], r = rnd(3); for (var i = 0; i * dt < T; i++) { clean.push(lvl(i * dt)); lv.push(sumDb(clean[i], -54 + (r() - 0.5) * 4)); }
    function row(y0, P, title, col) {
      var g = blockGate(lv, dt, P), o = plot({ x0: 46, x1: 584, y0: y0, y1: y0 + 74, t1: T, dbMin: -60, dbMax: 0 });
      var outLv = lv.map(function (v, i) { return v + g[i]; });
      var cut = spans(clean, dt, function (v, i) { return v > -48 && g[i] < -6; });
      return o.frame + cut.map(function (s) { return '<rect x="' + o.tx(s[0]).toFixed(1) + '" y="' + y0 + '" width="' + Math.max(2, o.tx(s[1]) - o.tx(s[0])).toFixed(1) + '" height="74" fill="' + C.red + '" fill-opacity=".18"/>'; }).join('') +
        '<path d="' + o.line(lv, dt) + '" fill="none" stroke="#94a3b8" stroke-width="1.2"/><path d="' + o.area(outLv, dt) + '" fill="' + col + '" fill-opacity=".35"/><path d="' + o.line(outLv, dt) + '" fill="none" stroke="' + col + '" stroke-width="1.8"/>' +
        '<path d="M46 ' + o.ly(P.thr) + 'H584" stroke="' + C.red + '" stroke-dasharray="6 4"/>' + t(52, y0 + 14, title, { size: 11.5, weight: 800, fill: col, anchor: 'start' }) +
        (cut.length ? t(o.tx(cut[0][0]) + 2, y0 + 70, '잘림', { size: 10.5, fill: C.red, weight: 800, anchor: 'start' }) + (cut.length > 1 ? t(o.tx(cut[cut.length - 1][0]) + 2, y0 + 70, '잘림', { size: 10.5, fill: C.red, weight: 800, anchor: 'start' }) : '') : '');
    }
    return svg(600, 228, t(o2(0.245), 18, 'ㅅ', { size: 12, weight: 800 }) + t(o2(0.65), 18, '사 · 랑 · 합 · 니', { size: 12, weight: 800 }) + t(o2(1.2), 18, '다 (작아지는 끝)', { size: 12, weight: 800 }) +
      row(26, { thr: -26, att: 0.001, hold: 0, rel: 0.01, range: -60 }, 'Threshold 높음 · Hold 0 · Release 짧음', C.red) + row(112, { thr: -44, att: 0.001, hold: 0.06, rel: 0.25, range: -60 }, 'Threshold 알맞게 · Hold·Release 넉넉히', C.teal) +
      t(584, 204, '회색 선 = 게이트 앞, 색 = 게이트 뒤, 빨간 칸 = 말인데 잘린 곳', { size: 10.5, fill: C.sub, anchor: 'end' }) + t(584, 220, '「사랑합니다」 크기 변화 (교육용 근사)', { size: 10.5, fill: C.sub, anchor: 'end' }), '말의 시작과 끝이 잘리는 경우와 알맞은 경우');
    function o2(s) { return 46 + s / T * 538; }
  };
  V.gateTom = function () {
    var dt = 0.005, T = 4, lv = [], r = rnd(11);
    for (var i = 0; i * dt < T; i++) { var s = i * dt, c = -58 + (r() - 0.5) * 4;
      var sn = s % 0.5; if (sn < 0.25) c = sumDb(c, -24 - sn * 140);                         // 스네어 블리드
      [1.25, 2.75, 3.05].forEach(function (h) { if (s >= h) c = sumDb(c, -6 - (s - h) * 70); });   // 탐 타격
      lv.push(c); }
    var P = { thr: -18, att: 0.0005, hold: 0.03, rel: 0.25, range: -60 }, g = blockGate(lv, dt, P), out = lv.map(function (v, k) { return v + g[k]; });
    function lane(y0, arr, title, col) { var o = plot({ x0: 46, x1: 584, y0: y0, y1: y0 + 76, t1: T, dbMin: -60, dbMax: 0 });
      return o.frame + '<path d="' + o.area(arr, dt) + '" fill="' + col + '" fill-opacity=".3"/><path d="' + o.line(arr, dt) + '" fill="none" stroke="' + col + '" stroke-width="1.4"/>' + '<path d="M46 ' + o.ly(P.thr) + 'H584" stroke="' + C.red + '" stroke-dasharray="6 4"/>' + t(52, y0 + 14, title, { size: 11.5, weight: 800, fill: C.ink, anchor: 'start' }) + t(40, o.ly(P.thr) + 4, '기준', { size: 10, fill: C.red, anchor: 'end' }); }
    function X(s) { return 46 + s / T * 538; }
    return svg(600, 220, lane(20, lv, '탐 마이크 입력: 스네어 블리드(작은 봉우리) + 탐(큰 봉우리)', '#64748b') + lane(116, out, '게이트 뒤: 탐을 칠 때만 열림', C.teal) +
      [1.25, 2.75, 3.05].map(function (h) { return t(X(h) + 2, 108, '▲탐', { size: 10.5, fill: C.teal, weight: 800, anchor: 'start' }); }).join('') + t(584, 210, '4초 동안의 크기 (dB) · 교육용 근사 그림', { size: 10.5, fill: C.sub, anchor: 'end' }), '탐 마이크 게이트로 스네어 블리드 줄이기');
  };
  V.gateCl5 = function () {
    var K = [['THRESHOLD', '−72 ~ 0 dB', 0.55], ['RANGE', '−∞ ~ 0 dB', 0.25], ['ATTACK', '0 ~ 120 ms', 0.1], ['HOLD', '0.02 ms ~ 1.96 s', 0.35], ['DECAY', '5 ms ~ 42.3 s', 0.45]];
    var knobs = K.map(function (k, i) { var cx = 70 + i * 104, cy = 92, a = (-135 + k[2] * 270) * Math.PI / 180;
      return '<circle cx="' + cx + '" cy="' + cy + '" r="27" fill="#1f2937" stroke="#0b1220" stroke-width="2"/><circle cx="' + cx + '" cy="' + cy + '" r="21" fill="#374151"/>' +
        '<path d="M' + cx + ' ' + cy + 'L' + (cx + 19 * Math.sin(a)).toFixed(1) + ' ' + (cy - 19 * Math.cos(a)).toFixed(1) + '" stroke="#22d3ee" stroke-width="3.5" stroke-linecap="round"/>' +
        t(cx, 140, k[0], { size: 11.5, fill: '#e5e7eb', weight: 800 }) + t(cx, 158, k[1], { size: 10.5, fill: '#fde68a' }); }).join('');
    return svg(600, 220, '<rect x="8" y="8" width="584" height="170" rx="12" fill="#111827"/>' + t(22, 32, 'DYNAMICS 1 · GATE', { size: 13, fill: '#a5f3fc', weight: 900, anchor: 'start' }) + t(578, 32, '48 kHz 기준', { size: 10.5, fill: '#9ca3af', anchor: 'end' }) + knobs +
      t(300, 200, 'CL5 입력 채널 게이트의 값 범위 (제조사 자료 · 화면은 단순화한 그림)', { size: 11, fill: C.sub }), 'CL5 입력 채널 게이트 파라미터 범위');
  };

  /* ======================================================================= 게이트 계산 (실습용 · 교육용 근사) */
  // 검출: 피크 엔벨로프(놓아 주는 시간 10 ms) / 열기: Attack 동안 게인을 선형으로 올림 / Hold / 닫기: Release 동안 dB 로 일정하게 Range 까지 내림
  function mkGate(sr, onBlock, Pext) {
    var P = Pext || { on: true, thr: -60, att: 1, hold: 2, rel: 10, range: -80 };   // 바깥의 설정 객체를 그대로 읽음
    var env = 0, g = 1, gDb = 0, holdCnt = 0, detK = Math.exp(-1 / (0.010 * sr)), BLK = Math.round(sr * 0.01), onsetWait = -1, acc;
    function resetAcc() { acc = { inPk: 0, mix2: 0, cl2: 0, outPk: 0, gMin: 1, gSum: 0, open: 0, n: 0, onset: null, st: 0 }; }
    resetAcc();
    function process(clean, noise, nGain, outL, outR, n, outGain) {
      var thrLin = Math.pow(10, P.thr / 20), fl = P.range <= -80 ? -80 : P.range, attN = Math.max(1, P.att * sr / 1000), relStep = -fl / Math.max(1, P.rel * sr / 1000), holdN = Math.round(P.hold * sr / 1000), og = outGain == null ? 1 : outGain;
      for (var i = 0; i < n; i++) {
        var c = clean[i], x = c + noise[i] * nGain, a = x < 0 ? -x : x, want = true;
        env = a > env ? a : env * detK;
        if (!P.on) { g = 1; gDb = 0; holdCnt = 0; }
        else {
          var trig = env >= thrLin;
          if (trig) holdCnt = holdN; else if (holdCnt > 0) holdCnt--;
          want = trig || holdCnt > 0;
          if (want) {
            if (g < 1) { if (g < 0.5 && onsetWait < 0) onsetWait = Math.round(sr * 0.001); g = P.att <= 0 ? 1 : Math.min(1, g + 1 / attN); }
            gDb = db(g);
          } else if (gDb > fl) { gDb = Math.max(fl, gDb - relStep); g = (gDb <= -80) ? 0 : Math.pow(10, gDb / 20); }
          else { gDb = fl; g = fl <= -80 ? 0 : Math.pow(10, fl / 20); }
          if (onsetWait >= 0) { if (onsetWait === 0) acc.onset = g; onsetWait--; }
        }
        var y = x * g; if (outL) { outL[i] = y * og; if (outR) outR[i] = y * og; }
        if (a > acc.inPk) acc.inPk = a; var ay = y < 0 ? -y : y; if (ay > acc.outPk) acc.outPk = ay;
        acc.mix2 += x * x; acc.cl2 += c * c; if (g < acc.gMin) acc.gMin = g; acc.gSum += g; if (want) acc.open++; acc.n++;
        if (acc.n >= BLK) {
          var st = !P.on ? 1 : (want && g >= 0.99) ? 1 : want ? 2 : (g > 0.01 && gDb > fl + 0.5) ? 3 : 0;   // 1 열림 · 2 여는 중/Hold · 3 닫히는 중 · 0 닫힘
          if (onBlock) onBlock({ inPk: acc.inPk, mix: Math.sqrt(acc.mix2 / acc.n), cl: Math.sqrt(acc.cl2 / acc.n), outPk: acc.outPk, gMin: acc.gMin, gAvg: acc.gSum / acc.n, open: acc.open / acc.n, onset: acc.onset, st: st, hold: holdCnt > 0 && env < thrLin });
          resetAcc();
        }
      }
    }
    return { P: P, process: process };
  }
  function pink(n) {   // 분홍 잡음(폴 켈렛 필터) — RMS 1 로 맞춤
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, o = new Float32Array(n), s = 0, i;
    for (i = 0; i < n; i++) { var w = Math.random() * 2 - 1; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980; var p = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926; o[i] = p; s += p * p; }
    var r = Math.sqrt(s / n) || 1, fade = 2048; for (i = 0; i < n; i++) o[i] /= r;
    for (i = 0; i < fade; i++) { var k = i / fade, a = o[i], z = o[n - fade + i]; o[n - fade + i] = z * (1 - k) + a * k; }   // 반복 이음새를 부드럽게
    return o;
  }

  /* ------------------------------------------------------------- 녹음 불러오기(공용 캐시, eq.js 와 같은 방식) */
  var CACHE = window.__staStemCache = window.__staStemCache || {};
  function b64ToBuf(uri) { var b = atob(uri.slice(uri.indexOf(',') + 1)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  function loadStem(name, a, b, cb) {
    var key = name + ':' + a + ':' + b; if (CACHE[key]) { setTimeout(function () { cb(CACHE[key]); }, 0); return; }
    var uri = window.MG12XU_SOURCE_AUDIO_BASE64 && window.MG12XU_SOURCE_AUDIO_BASE64[name], OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, fired = false;
    function fin(v) { if (fired) return; fired = true; if (v) CACHE[key] = v; cb(v); }
    if (!uri || !OAC) { fin(null); return; }
    try {
      var oc = new OAC(1, 2, 44100);
      var pr = oc.decodeAudioData(b64ToBuf(uri), function (buf) {
        var sr = buf.sampleRate, s0 = Math.min(buf.length - 1, Math.round(a * sr)), s1 = Math.min(buf.length, Math.round(b * sr)), n = s1 - s0, out = new Float32Array(n), k, i;
        for (k = 0; k < buf.numberOfChannels; k++) { var ch = buf.getChannelData(k); for (i = 0; i < n; i++) out[i] += ch[s0 + i] / buf.numberOfChannels; }
        var fade = Math.min(n >> 1, Math.round(sr * 0.02)); for (i = 0; i < fade; i++) { var w = i / fade; out[i] *= w; out[n - 1 - i] *= w; }
        fin({ data: out, sr: sr, dur: n / sr });
      }, function () { fin(null); });
      if (pr && pr.catch) pr.catch(function () { /* 콜백에서 처리 */ });
    } catch (e) { fin(null); }
  }
  function synthStem(kind, sr) {   // 녹음이 없을 때의 가상 신호(톤 버스트)
    var n = sr * 8, d = new Float32Array(n), i;
    for (i = 0; i < n; i++) { var s = i / sr, ph = s % (kind === 'drum' ? 0.5 : 2), e;
      if (kind === 'drum') e = Math.exp(-ph * 14) * 0.5; else e = ph < 1.4 ? 0.25 * Math.min(1, ph / 0.05) * (0.6 + 0.4 * Math.sin(s * 9)) : 0.25 * Math.exp(-(ph - 1.4) * 9);
      d[i] = e * Math.sin(2 * Math.PI * (kind === 'drum' ? 90 : 220) * s); }
    return { data: d, sr: sr, dur: 8, synthetic: true };
  }

  /* ======================================================================= 실습: 게이트 */
  var CSS = '' +
    '.sim-gate{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:12px;align-items:start}' +
    '.sim-gate-main{display:flex;flex-direction:column;gap:10px;min-width:0}' +
    '.sim-gate-scope{border:1px solid #1e293b;border-radius:12px;overflow:hidden;background:#0b1a2e}' +
    '.sim-gate-scope canvas{display:block;width:100%}' +
    '.sim-gate-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;padding:8px 10px;background:#0f2238;border-top:1px solid #1e293b;color:#cbd5e1;font-size:.74rem}' +
    '.sim-gate-led{display:inline-flex;align-items:center;gap:6px;font-weight:900;letter-spacing:.03em}' +
    '.sim-gate-led i{width:14px;height:14px;border-radius:50%;background:#334155;border:1px solid #64748b}' +
    '.sim-gate-led.open i{background:#22c55e;box-shadow:0 0 10px #22c55e;border-color:#86efac}.sim-gate-led.hold i{background:#f59e0b;box-shadow:0 0 8px #f59e0b}' +
    '.sim-gate-meter{flex:1 1 180px;min-width:160px;display:grid;gap:3px}' +
    '.sim-gate-meter span{display:flex;justify-content:space-between;font-variant-numeric:tabular-nums}' +
    '.sim-gate-track{position:relative;height:10px;border-radius:5px;background:#1e293b;overflow:hidden}' +
    '.sim-gate-track b{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#22c55e,#eab308 80%,#ef4444)}' +
    '.sim-gate-track em{position:absolute;top:-2px;bottom:-2px;width:3px;margin-left:-1px;background:#f87171}' +
    '.sim-gate-track.gr b{left:auto;right:0;background:#f59e0b}' +
    '.sim-gate-ctl{border:1px solid var(--sta-line);border-radius:10px;background:#fff;padding:10px 12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px 16px}' +
    '.sim-gate-ctl .sim-range b{font-variant-numeric:tabular-nums}.sim-gate-ctl .sim-range input{accent-color:#0e7490}' +
    '.sim-gate-ctl .sim-range small{color:#7a8aa0;font-size:.7rem}.sim-gate-lb{font-style:normal}' +
    '.sim-gate-src{display:flex;gap:6px;flex-wrap:wrap}.sim-gate-src label{flex:1 1 110px;display:flex;gap:6px;align-items:center;padding:6px 8px;border:1px solid var(--sta-line);border-radius:8px;font-size:.78rem;cursor:pointer}' +
    '.sim-gate-src label:has(input:checked){border-color:var(--sta-cyan);background:var(--sta-cyan-soft)}' +
    '@media (max-width:860px){.sim-gate{grid-template-columns:minmax(0,1fr)}}';
  function injectCss(id, css) { if (document.getElementById(id)) return; var s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s); }

  var SRC = { vox: { stem: 'leadVox', seg: [20.5, 80.5], name: '보컬 + 잡음', sp: -30 }, drum: { stem: 'drumLR', seg: [0.8, 11.9], name: '드럼 + 잡음', sp: -30 } };
  var INITP = { on: true, thr: -60, att: 1, hold: 2, rel: 10, range: -80 };
  var MAP = {   // 슬라이더(0–1000) ↔ 값
    thr: [function (v) { return Math.round(-72 + v * 72 / 1000); }, function (x) { return Math.round((x + 72) / 72 * 1000); }],
    att: [function (v) { return Math.round(120 * Math.pow(v / 1000, 3) * 100) / 100; }, function (x) { return Math.round(Math.pow(x / 120, 1 / 3) * 1000); }],
    hold: [function (v) { return Math.round(1000 * Math.pow(v / 1000, 2.5)); }, function (x) { return Math.round(Math.pow(x / 1000, 1 / 2.5) * 1000); }],
    rel: [function (v) { return Math.round(5 * Math.pow(400, v / 1000)); }, function (x) { return Math.round(Math.log(Math.max(5, x) / 5) / Math.log(400) * 1000); }],
    range: [function (v) { return Math.round(-80 + v * 80 / 1000); }, function (x) { return Math.round((x + 80) / 80 * 1000); }],
    noise: [function (v) { return Math.round(-60 + v * 20 / 1000); }, function (x) { return Math.round((x + 60) / 20 * 1000); }]
  };
  function fmtMs(x) { return x >= 1000 ? (x / 1000).toFixed(2) + ' s' : (x < 10 ? x.toFixed(x < 1 ? 2 : 1) : Math.round(x)) + ' ms'; }
  function fmtV(k, x) { if (k === 'thr' || k === 'noise') return x + ' dB'; if (k === 'range') return x <= -80 ? '−∞ dB' : x + ' dB'; return fmtMs(x); }

  function gateSim(el, opts) {
    opts = opts || {};
    injectCss('sta-mod-gate-css', CSS);
    var SR = 44100, S = { P: JSON.parse(JSON.stringify(INITP)), noise: -50, src: 'vox', audio: false, done: {}, sawSlow: false, pos: 0, npos: 0 };
    el.innerHTML =
      '<div class="sim-gate">' +
        '<div class="sim-gate-main">' +
          '<div class="sim-gate-scope"><canvas aria-label="최근 4초 파형: 회색은 게이트 앞, 청록색은 게이트 뒤, 빨간 선은 Threshold"></canvas>' +
            '<div class="sim-gate-bar"><span class="sim-gate-led" data-role="led"><i></i><span>닫힘</span></span>' +
              '<div class="sim-gate-meter"><span><span>입력</span><b data-role="inval">−∞</b></span><div class="sim-gate-track"><b data-role="inbar"></b><em data-role="thrmark"></em></div></div>' +
              '<div class="sim-gate-meter"><span><span>줄이는 양(GR)</span><b data-role="grval">0 dB</b></span><div class="sim-gate-track gr"><b data-role="grbar"></b></div></div></div></div>' +
          '<div class="sim-gate-ctl">' + ['thr', 'att', 'hold', 'rel', 'range', 'noise'].map(function (k) {
            var lb = { thr: 'Threshold', att: 'Attack', hold: 'Hold', rel: 'Release <small>(CL5: DECAY)</small>', range: 'Range', noise: '배경 잡음 크기 <small>(연습용)</small>' }[k];
            return '<label class="sim-range"><span><em class="sim-gate-lb">' + lb + '</em><b data-out="' + k + '"></b></span><input type="range" min="0" max="1000" step="1" data-g="' + k + '" aria-label="' + lb.replace(/<[^>]+>/g, '') + '"></label>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="sim-side">' +
          '<div class="sim-box"><h4>소리</h4><div class="sim-gate-src">' + Object.keys(SRC).map(function (k) { return '<label><input type="radio" name="simGateSrc" value="' + k + '"' + (k === 'vox' ? ' checked' : '') + '>' + SRC[k].name + '</label>'; }).join('') + '</div>' +
            '<button type="button" class="sim-btn sim-play" data-sim="play" style="margin-top:8px">🔊 소리 켜기</button><p class="sim-note" data-role="srcnote">녹음을 불러오는 중…</p>' +
            '<label class="sim-switch"><input type="checkbox" data-sim="on" checked><span><b>GATE ON</b> (끄면 게이트 없이 원래 소리)</span></label>' +
            '<div class="sim-btns"><button type="button" class="sim-btn" data-sim="init">처음 값으로</button></div></div>' +
          '<div class="sim-box sim-read" data-role="read"></div>' +
        '</div>' +
      '</div>';
    var cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), read = el.querySelector('[data-role=read]'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 600, H = 220;
    var stems = {}, noiseBuf = pink(SR * 4), ring = [], RING = 400, A = null, alive = true, raf = 0, last = performance.now(), frame = 0, blockIdx = 0;
    function cur() { return stems[S.src]; }

    /* ---------- 결과 집계 (설정을 바꾼 뒤부터) */
    var acc;
    function resetAcc() { acc = { n: 0, sp: 0, spO: 0, gp: 0, gpC: 0, tl: 0, tlK: 0, closes: 0, lastSp: -999, prevOpen: true, ons: [] }; }
    resetAcc();
    function onBlock(b) {
      ring.push(b); if (ring.length > RING) ring.shift(); blockIdx++;
      var cDb = db(b.cl), closedLin = Math.pow(10, Math.max(S.P.range, -60) * 0.5 / 20), sp = SRC[S.src].sp;
      acc.n++;
      if (cDb >= sp) { acc.sp++; if (b.gAvg >= 0.7) acc.spO++; acc.lastSp = acc.n; }
      else if (cDb < S.noise - 1) { acc.gp++; if (b.gAvg <= closedLin) acc.gpC++; }
      else if (acc.n - acc.lastSp <= 50) { acc.tl++; if (b.gAvg >= 0.5) acc.tlK++; }
      var op = b.gAvg > 0.5; if (acc.prevOpen && !op) acc.closes++; acc.prevOpen = op;
      if (b.onset != null) { acc.ons.push(b.onset); if (acc.ons.length > 30) acc.ons.shift(); }
    }
    function metrics() {
      var m = { secs: acc.n / 100, spOpen: acc.sp ? acc.spO / acc.sp : null, gapClosed: acc.gp ? acc.gpC / acc.gp : null, tailKept: acc.tl ? acc.tlK / acc.tl : null, closesPerSec: acc.n ? acc.closes / (acc.n / 100) : 0, nSp: acc.sp, nGap: acc.gp, nTail: acc.tl, nOn: acc.ons.length };
      m.onset = acc.ons.length ? acc.ons.reduce(function (a, v) { return a + v; }, 0) / acc.ons.length : null; return m;
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function evalTasks() {
      var m = metrics(), P = S.P; if (!P.on || !cur()) return m;
      if (S.src === 'vox') {
        if (P.range <= -20 && m.nSp >= 150 && m.nGap >= 10 && m.gapClosed >= 0.7 && m.spOpen >= 0.95) hit('close');
        if ((P.hold >= 20 || P.rel >= 80) && m.nGap >= 10 && m.nTail >= 150 && m.gapClosed >= 0.5 && m.tailKept >= 0.85) hit('tail');
        if (P.range >= -20 && P.range <= -8 && m.nSp >= 150 && m.nGap >= 10 && m.gapClosed >= 0.6 && m.spOpen >= 0.9) hit('range');
        if (P.thr >= -20 && m.nSp >= 150 && m.spOpen <= 0.85) hit('toohigh');
      } else if (S.src === 'drum' && m.nOn >= 4) {
        if (P.att >= 20 && m.onset <= 0.6) S.sawSlow = true;
        if (S.sawSlow && P.att <= 1 && m.onset >= 0.9 && m.nGap >= 30 && m.gapClosed >= 0.7) hit('drum');
      }
      return m;
    }

    /* ---------- 계산 엔진 */
    var dsp = mkGate(SR, onBlock, S.P);
    var bufC = new Float32Array(4096), bufN = new Float32Array(4096);
    function fill(n, ratio) {   // 녹음·잡음을 n 샘플 읽기 (ratio = 녹음 sr / 출력 sr)
      var st = cur(), d = st.data, L = d.length, nb = noiseBuf, NL = nb.length;
      for (var i = 0; i < n; i++) {
        var p = S.pos, i0 = Math.floor(p), fr = p - i0, a = d[i0 % L], b = d[(i0 + 1) % L]; bufC[i] = a + (b - a) * fr;
        var q = S.npos, j0 = Math.floor(q); bufN[i] = nb[j0 % NL];
        S.pos += ratio; if (S.pos >= L) S.pos -= L; S.npos += ratio; if (S.npos >= NL) S.npos -= NL;
      }
    }
    function runModel(sec) {   // 소리 없이 sec 초만큼 계산
      if (!cur()) return; var total = Math.round(sec * SR), ng = Math.pow(10, S.noise / 20);
      while (total > 0) { var n = Math.min(2048, total); fill(n, 1); dsp.process(bufC, bufN, ng, null, null, n); total -= n; }
    }

    /* ---------- 그리기 */
    function size() { W = Math.max(280, cv.parentNode.clientWidth || 600); H = Math.round(clamp(W * 0.36, 170, 240)); cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); draw(); }
    function hy(d, mid, half) { return clamp((d + 72) / 72, 0, 1) * half; }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#0b1a2e'; ctx.fillRect(0, 0, W, H);
      var stripH = 14, top = 6, bot = H - stripH - 16, mid = (top + bot) / 2, half = (bot - top) / 2, n = ring.length, cw = W / RING, x0 = W - n * cw;
      ctx.strokeStyle = '#1c3350'; ctx.lineWidth = 1; ctx.font = '10px sans-serif'; ctx.fillStyle = '#7f93ab'; ctx.textAlign = 'left';
      [-60, -40, -20].forEach(function (d) { var h = hy(d, mid, half); [mid - h, mid + h].forEach(function (y) { ctx.beginPath(); ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(W, Math.round(y) + 0.5); ctx.stroke(); }); ctx.fillText(d + ' dB', 4, mid - h - 2); });
      for (var i = 0; i < n; i++) {
        var b = ring[i], x = x0 + i * cw, hi = hy(db(b.inPk), mid, half), ho = hy(db(b.outPk), mid, half);
        ctx.fillStyle = 'rgba(148,163,184,0.45)'; ctx.fillRect(x, mid - hi, Math.max(1, cw), hi * 2);
        ctx.fillStyle = 'rgba(34,211,238,0.85)'; ctx.fillRect(x, mid - ho, Math.max(1, cw), ho * 2);
        ctx.fillStyle = b.st === 1 ? '#22c55e' : b.st === 2 ? '#86efac' : b.st === 3 ? '#f59e0b' : '#334155'; ctx.fillRect(x, H - stripH - 4, Math.max(1, cw) + 0.5, stripH);
      }
      var th = hy(S.P.thr, mid, half); ctx.strokeStyle = '#f87171'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); [mid - th, mid + th].forEach(function (y) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }); ctx.setLineDash([]);
      ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('Threshold ' + S.P.thr + ' dB', W - 6, mid - th - 4);
      ctx.fillStyle = '#7f93ab'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('게이트: 초록=열림 · 주황=닫히는 중 · 회색=닫힘', 4, H - stripH - 7);
      ctx.textAlign = 'right'; ctx.fillText('← 4초 전 · 지금 →', W - 6, H - stripH - 7);
      if (!S.P.on) { ctx.fillStyle = '#fde68a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GATE OFF — 원래 소리 그대로', W / 2, top + 14); }
    }
    function meters() {
      var b = ring[ring.length - 1]; if (!b) return;
      var inDb = db(b.inPk), gr = db(Math.max(b.gAvg, 1e-6)), led = el.querySelector('[data-role=led]');
      el.querySelector('[data-role=inval]').textContent = inDb <= -90 ? '−∞' : inDb.toFixed(0) + ' dB';
      el.querySelector('[data-role=inbar]').style.width = clamp((inDb + 72) / 72 * 100, 0, 100).toFixed(1) + '%';
      el.querySelector('[data-role=thrmark]').style.left = clamp((S.P.thr + 72) / 72 * 100, 0, 100) + '%';
      el.querySelector('[data-role=grval]').textContent = gr <= -79 ? '−∞ dB' : (gr < -0.05 ? gr.toFixed(0) : '0') + ' dB';
      el.querySelector('[data-role=grbar]').style.width = clamp(-gr / 80 * 100, 0, 100).toFixed(1) + '%';
      var st = b.st, txt = !S.P.on ? '게이트 꺼짐' : st === 1 ? '열림' : st === 2 ? (b.hold ? 'Hold' : '여는 중') : st === 3 ? '닫히는 중' : '닫힘';
      led.className = 'sim-gate-led' + (st === 1 || !S.P.on ? ' open' : st === 2 || st === 3 ? ' hold' : ''); led.querySelector('span').textContent = txt;
    }
    function pct(v) { return v == null ? '—' : Math.round(v * 100) + '%'; }
    function renderRead(m) {
      var vox = S.src === 'vox', wait = m.nSp < 150 || m.nGap < 10;
      var rows = '<div class="sim-row"><span>말소리 통과</span><b class="' + (m.spOpen == null ? '' : m.spOpen >= 0.95 ? 'ok' : m.spOpen >= 0.85 ? 'warn' : 'bad') + '">' + pct(m.spOpen) + '</b></div>' +
        '<div class="sim-row"><span>' + (vox ? '말' : '타격') + ' 사이 잡음 닫힘</span><b class="' + (m.gapClosed == null ? '' : m.gapClosed >= 0.7 ? 'ok' : 'warn') + '">' + pct(m.gapClosed) + '</b></div>' +
        (vox ? '<div class="sim-row"><span>말끝 보존</span><b class="' + (m.tailKept == null ? '' : m.tailKept >= 0.85 ? 'ok' : m.tailKept >= 0.7 ? 'warn' : 'bad') + '">' + pct(m.tailKept) + '</b></div>'
          : '<div class="sim-row"><span>타격 첫머리 (1 ms 뒤)</span><b class="' + (m.onset == null ? '' : m.onset >= 0.9 ? 'ok' : m.onset >= 0.6 ? 'warn' : 'bad') + '">' + (m.onset == null ? '—' : Math.round(m.onset * 100) + '% 열림') + '</b></div>') +
        '<div class="sim-row"><span>닫힘 횟수</span><b class="' + (m.closesPerSec > 2.5 ? 'warn' : '') + '">' + m.closesPerSec.toFixed(1) + '회/초' + (m.closesPerSec > 2.5 ? ' · 떨림(채터링)?' : '') + '</b></div>';
      var tip = !S.P.on ? '게이트가 꺼져 있어요. GATE ON 을 켜세요.' : S.P.thr < S.noise + 12 && vox ? 'Threshold 가 잡음보다 낮거나 비슷해 잡음에도 게이트가 열려요. 천천히 올려 보세요.' : vox && m.spOpen != null && m.spOpen < 0.85 ? 'Threshold 가 너무 높아 말하는 도중에도 닫혀요.' : vox && m.tailKept != null && m.tailKept < 0.85 ? '말끝이 잘리고 있어요. Hold·Release 를 늘려 보세요.' : '좋아요. 소리를 켜고 GATE ON/OFF 를 번갈아 들어 보세요.';
      read.innerHTML = '<h4>결과 <small>설정을 바꾼 뒤 ' + m.secs.toFixed(1) + '초 · 교육용 근사</small></h4>' + rows + '<p class="sim-note">' + (wait ? '판정 중… 몇 초 기다려 주세요. ' : '') + tip + '</p>';
    }
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick);
      var nowT = performance.now(), dt = Math.min(0.1, (nowT - last) / 1000); last = nowT;
      if (!S.audio) runModel(dt);
      frame++; draw(); meters();
      if (frame % 8 === 1) { var m = evalTasks(); renderRead(m); }
    }

    /* ---------- 소리 (ScriptProcessorNode: file:// 에서도 동작) */
    function startAudio() {
      var AC = window.AudioContext || window.webkitAudioContext, note = el.querySelector('[data-role=srcnote]');
      if (!cur()) return; if (!AC) { note.textContent = '이 브라우저는 웹 오디오를 지원하지 않아요. 파형은 계속 동작해요.'; return; }
      try { if (!A) { var c; try { c = new AC({ sampleRate: SR }); } catch (e) { c = new AC(); } A = { ctx: c }; } } catch (e2) { note.textContent = '소리를 켤 수 없어요.'; return; }
      var c2 = A.ctx; if (c2.resume) c2.resume();
      if (!c2.createScriptProcessor) { note.textContent = '이 브라우저에서는 소리를 낼 수 없어요. 파형은 계속 동작해요.'; return; }
      var sp = c2.createScriptProcessor(1024, 1, 2), ratio = SR / c2.sampleRate, d2 = mkGate(c2.sampleRate, onBlock, S.P);
      sp.onaudioprocess = function (e) {
        var L = e.outputBuffer.getChannelData(0), R = e.outputBuffer.numberOfChannels > 1 ? e.outputBuffer.getChannelData(1) : null, n = L.length;
        if (!cur()) { L.fill(0); if (R) R.fill(0); return; }
        if (bufC.length < n) { bufC = new Float32Array(n); bufN = new Float32Array(n); }
        fill(n, ratio);
        d2.process(bufC, bufN, Math.pow(10, S.noise / 20), L, R, n, 0.9); A.blocks = (A.blocks || 0) + 1;
      };
      sp.connect(c2.destination); A.sp = sp; A.dsp = d2; S.audio = true;
      note.textContent = '실제 녹음 + 배경 잡음이 게이트를 지나 들려요(실시간 계산). 헤드폰으로 들으면 잡음이 잘 들려요.';
    }
    function stopAudio() { if (A && A.sp) { try { A.sp.onaudioprocess = null; A.sp.disconnect(); } catch (e) { /* noop */ } A.sp = null; } S.audio = false; last = performance.now(); }

    /* ---------- 컨트롤 */
    function syncUI() {
      ['thr', 'att', 'hold', 'rel', 'range', 'noise'].forEach(function (k) { var v = k === 'noise' ? S.noise : S.P[k]; el.querySelector('[data-g=' + k + ']').value = MAP[k][1](v); el.querySelector('[data-out=' + k + ']').textContent = fmtV(k, v); });
      el.querySelector('[data-sim=on]').checked = !!S.P.on;
      var r = el.querySelector('input[name=simGateSrc][value=' + S.src + ']'); if (r) r.checked = true;
    }
    function changedParams() { resetAcc(); syncUI(); }
    el.addEventListener('input', function (e) { var k = e.target.getAttribute('data-g'); if (!k) return; var v = MAP[k][0](+e.target.value); if (k === 'noise') S.noise = v; else S.P[k] = v; changedParams(); });
    el.addEventListener('change', function (e) {
      var t2 = e.target;
      if (t2.getAttribute('data-sim') === 'on') { S.P.on = t2.checked; changedParams(); }
      if (t2.name === 'simGateSrc') setSrc(t2.value);
    });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !el.contains(b)) return; var s = b.getAttribute('data-sim');
      if (s === 'play') { if (S.audio) { stopAudio(); b.textContent = '🔊 소리 켜기'; b.classList.remove('on'); } else { startAudio(); if (S.audio) { b.textContent = '🔇 소리 끄기'; b.classList.add('on'); } } }
      if (s === 'init') { Object.keys(INITP).forEach(function (k) { S.P[k] = INITP[k]; }); S.noise = -50; changedParams(); }
    });
    function setSrc(k) {
      if (!SRC[k]) return; S.src = k; S.pos = 0; ring.length = 0; changedParams();
      if (!stems[k]) { var note = el.querySelector('[data-role=srcnote]'); note.textContent = '녹음을 불러오는 중…'; loadSrc(k); }
    }
    function loadSrc(k) {
      var info = SRC[k];
      loadStem(info.stem, info.seg[0], info.seg[1], function (st) {
        if (!alive) return; stems[k] = st || synthStem(k, SR);
        var note = el.querySelector('[data-role=srcnote]');
        if (S.src === k) note.textContent = st ? '실제 ' + (k === 'vox' ? '보컬' : '드럼') + ' 녹음(MG12XU 실습과 같은 음원)에 일정한 배경 잡음(쉬—)을 섞었어요. 처음엔 소리가 꺼져 있어요.' : '녹음을 불러오지 못해 가상 신호로 보여 줘요.';
        if (S.src === k) { S.pos = 0; resetAcc(); }
      });
    }
    var ro = window.ResizeObserver ? new ResizeObserver(function () { size(); }) : null; if (ro) ro.observe(cv.parentNode); else window.addEventListener('resize', size);
    syncUI(); size(); renderRead(metrics()); loadSrc('vox'); tick();

    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); stopAudio(); if (A && A.ctx && A.ctx.close) { try { A.ctx.close(); } catch (e) { /* noop */ } } A = null; if (ro) ro.disconnect(); else window.removeEventListener('resize', size); el.innerHTML = ''; },
      state: function () { var m = metrics(), b = ring[ring.length - 1]; return { src: S.src, on: S.P.on, thr: S.P.thr, att: S.P.att, hold: S.P.hold, rel: S.P.rel, range: S.P.range, noise: S.noise, audio: S.audio, audioBlocks: A ? (A.blocks || 0) : 0, ready: !!cur(), synthetic: !!(cur() && cur().synthetic), m: m, gateState: b ? b.st : null, inDb: b ? db(b.inPk) : null, sawSlow: S.sawSlow, done: Object.keys(S.done) }; },
      set: function (o) {
        o = o || {};
        if (o.src && o.src !== S.src) setSrc(o.src);
        ['on', 'thr', 'att', 'hold', 'rel', 'range'].forEach(function (k) { if (o[k] != null) S.P[k] = o[k]; });
        if (o.noise != null) S.noise = o.noise;
        if (['on', 'thr', 'att', 'hold', 'rel', 'range', 'noise', 'src'].some(function (k) { return o[k] != null; })) changedParams();
        if (o.advance && !S.audio) { runModel(o.advance); var m = evalTasks(); renderRead(m); draw(); meters(); }
        return this.state();
      }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.gateSim = gateSim;
  window.STASims._gateDSP = mkGate;

  /* ======================================================================= 모듈 데이터 */
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES.gate = {
    id: 'gate', path: 'mixing', no: 3, status: 'ready', level: '중급', minutes: 30, thumb: 'gate',
    title: 'Gate', sub: '작은 잡음을 닫아 깨끗하게',
    prereq: ['signal-flow'],
    overview: {
      lead: '게이트(Gate)는 <b>소리가 정한 크기(Threshold)보다 작으면 채널을 닫아</b> 잡음을 줄이는 도구예요. 말이나 연주가 없는 사이의 「쉬—」 잡음, 다른 악기에서 새어 들어온 소리(블리드)를 줄여요. 하지만 잘못 쓰면 <b>말의 시작과 끝이 잘려</b> 부자연스러워지니, 어디에 쓰고 어디에 쓰지 않을지 아는 것이 중요해요.',
      terms: [
        ['게이트 (Gate)', '입력이 Threshold 보다 작으면 소리를 줄이고(닫힘), 크면 그대로 통과시키는(열림) 다이내믹 도구예요.'],
        ['Threshold', '열리고 닫히는 기준 크기(dB)예요. 잡음보다 높고, 지키고 싶은 소리보다 낮게 맞춰요.'],
        ['Attack', '기준을 넘었을 때 게이트가 얼마나 빨리 열리는지예요. 너무 길면 소리의 첫머리가 뭉개져요.'],
        ['Hold', '소리가 기준 아래로 내려가도 바로 닫지 않고 열어 두는 시간이에요.'],
        ['Release (Decay)', 'Hold 가 끝난 뒤 얼마나 천천히 닫히는지예요. CL5 에서는 DECAY 라고 불러요.'],
        ['Range', '닫혔을 때 소리를 얼마나 줄일지예요. −∞ 면 완전히 끄고, −10 dB 면 조금만 줄여요.'],
        ['블리드 (bleed)', '한 마이크에 다른 악기·스피커 소리가 새어 들어오는 것이에요. 탐 마이크에 들어온 스네어 소리처럼요.'],
        ['채터링', 'Threshold 근처에서 게이트가 빠르게 열렸다 닫혔다 하며 소리가 덜덜 끊기는 현상이에요.']
      ],
      points: [
        '<b>Threshold 는 잡음 위, 말소리 아래.</b> 둘 사이 크기 차이가 클수록 게이트가 잘 동작해요.',
        '말끝이 잘리면 <b>Hold·Release 를 늘리고</b>, 그래도 어색하면 <b>Range 를 얕게</b>(−10 ~ −20 dB) 써요.',
        '설교·보컬처럼 작은 소리도 중요한 마이크에는 게이트를 <b>쓰지 않거나 아주 약하게</b> 써요. 드럼 탐처럼 소리와 사이가 분명한 곳에 잘 맞아요.'
      ],
      model: 'gateTransfer'
    },
    theory: [
      { title: '게이트와 Threshold', visual: 'gateConcept',
        body: '게이트는 문지기예요. 입력 소리가 <b>Threshold(기준)</b>보다 크면 문을 열어 그대로 통과시키고, 작으면 문을 닫아 소리를 줄여요. 말이 없는 사이에는 잡음만 남아 있으니, Threshold 를 <b>잡음보다 조금 높게</b> 두면 그 사이를 조용하게 만들 수 있어요.',
        more: '<ul><li>게이트는 소리를 <b>더 좋게</b> 만드는 게 아니라, 신호가 없을 때 <b>덜 들리게</b> 하는 도구예요. 말하는 동안에는 잡음도 함께 열려 그대로 들려요.</li>' +
          '<li>그림의 위쪽은 입력 크기, 아래쪽 띠는 게이트가 열린 구간이에요. 소리 크기는 계속 변해서, Threshold 근처에서는 열렸다 닫혔다 할 수 있어요(교육용 근사 그림).</li>' +
          '<li>디지털 콘솔의 Threshold 는 보통 dBFS(디지털 최대치 기준) 단위예요. CL5 게이트는 −72 dB ~ 0 dB 에서 정해요(제조사 자료).</li>' +
          '<li>게이트를 쓰기 전에 <b>GAIN 을 먼저 알맞게</b> 맞춰요. GAIN 을 바꾸면 신호와 잡음이 함께 커지거나 작아져서 Threshold 를 다시 맞춰야 해요.</li></ul>',
        check: { q: '게이트 Threshold 를 맞추는 기본 원칙은?', options: [
          { t: '잡음보다 조금 높고, 지키고 싶은 소리보다 낮게', ok: true, why: '맞아요. 그래야 잡음만 있을 때 닫히고, 소리가 나면 열려요.' },
          { t: '잡음보다 낮게', why: '잡음에도 게이트가 열려 있어서 아무 효과가 없어요.' },
          { t: '말소리보다 높게', why: '말하는 중에도 닫혀서 말이 끊겨요.' }] } },
      { title: 'Attack · Hold · Release · Range', visual: 'gateTimes',
        body: '게이트가 언제, 얼마나 빨리, 얼마나 많이 열고 닫는지는 네 가지로 정해요. <b>Attack</b>: 기준을 넘었을 때 열리는 속도. <b>Hold</b>: 기준 아래로 내려가도 열어 두는 시간. <b>Release</b>: Hold 뒤에 닫히는 속도. <b>Range</b>: 닫혔을 때 줄이는 양. 시간은 보통 ms(1/1000초) 단위예요.',
        more: '<ul><li><b>Attack</b>: 북·말 첫소리처럼 빠른 소리는 짧게(1 ms 안팎) 둬요. 너무 길면 첫머리가 뭉개지고, 아주 짧으면 낮은 소리에서 「딱」 하는 클릭이 들릴 수도 있어요.</li>' +
          '<li><b>Hold</b>: 말소리는 낱말 사이에서도 순간순간 작아져요. Hold 를 수십 ms 정도 두면 말하는 도중에 덜덜 닫히는 채터링이 줄어요.</li>' +
          '<li><b>Release</b>: 말끝·울림이 자연스럽게 사라지도록 보통 Attack 보다 훨씬 길게(수십–수백 ms) 둬요. 너무 짧으면 말끝이 「뚝」 잘리고, 너무 길면 다음 소리 전까지 닫히지 않아요.</li>' +
          '<li><b>Range</b>: −∞ 는 완전히 끄고, −10 ~ −20 dB 는 잡음을 줄이면서도 「뚝 끊기는」 느낌을 덜어 줘요.</li>' +
          '<li>그림은 네 값의 역할을 보여 주는 교육용 그림이에요. 게이트마다 Release 를 재는 방식은 조금씩 달라요.</li></ul>',
        check: { q: '말끝이 「뚝」 잘리는 느낌이 나요. 먼저 늘려 볼 값은?', options: [
          { t: 'Hold 나 Release', ok: true, why: '맞아요. 기준 아래로 내려간 뒤에도 조금 더 열어 두고 천천히 닫아요.' },
          { t: 'Attack', why: 'Attack 은 열릴 때(시작 부분)의 속도예요. 끝부분과는 관계가 적어요.' },
          { t: 'Threshold (더 높게)', why: 'Threshold 를 높이면 더 일찍 닫혀서 더 많이 잘려요.' }] } },
      { title: '잡음과 신호를 구분하기', visual: 'gateSeparate',
        body: '게이트가 잘 동작하려면 <b>지키고 싶은 소리와 잡음의 크기 차이</b>가 커야 해요. 잡음이 −50 dB, 말소리가 −30 ~ −6 dB 근처라면 그 사이(예: −38 dB)에 Threshold 를 둘 수 있어요. 하지만 작게 말하는 부분이 잡음과 비슷하면, 어디에 두어도 말이 잘리거나 잡음이 남아요. 이때는 게이트보다 <b>잡음 자체를 줄이는 것</b>이 먼저예요.',
        more: '<ul><li><b>크기 차이를 키우는 방법</b>: 마이크를 입(악기)에 가까이 → 신호가 커져요. 잡음원(에어컨·앰프·모니터 스피커)과 마이크를 멀리 → 잡음이 작아져요.</li>' +
          '<li>잡음에는 크기가 늘 비슷한 「쉬—」(히스)·「웅—」(험)도 있고, 다른 악기의 블리드처럼 크기가 계속 바뀌는 것도 있어요. 블리드가 더 까다로워요.</li>' +
          '<li><b>키 인 필터(사이드체인 필터)</b>: 게이트가 소리를 「듣는」 신호에만 필터를 걸어, 원하는 대역(예: 탐의 낮은 대역)에 더 잘 반응하게 하는 기능이에요. 실제로 나가는 소리에는 필터가 걸리지 않아요.</li>' +
          '<li>게이트는 잡음을 「없애는」 게 아니라 소리가 없을 때만 닫아요. 말하는 동안의 잡음은 그대로 남아요.</li></ul>',
        check: { q: '말소리(작게 말하는 부분)와 잡음의 크기가 거의 같다면 게이트는?', options: [
          { t: '잘 구분하지 못해 말이 잘리거나 잡음이 남는다', ok: true, why: '맞아요. 이럴 때는 마이크 거리·잡음원부터 바로잡아요.' },
          { t: '잡음만 정확히 골라 없앤다', why: '게이트는 크기로만 판단해서, 크기가 같으면 구분하지 못해요.' },
          { t: 'Range 를 −∞ 로 하면 해결된다', why: 'Range 는 닫혔을 때 줄이는 양일 뿐, 구분하는 능력은 그대로예요.' }] } },
      { title: '말의 시작과 끝이 잘리는 문제', visual: 'gateChop',
        body: '말은 「ㅅ」「ㅎ」 같은 작은 소리로 시작하고, 끝은 점점 작아지며 사라져요. Threshold 가 높거나 Release 가 짧으면 이 <b>작은 시작과 끝</b>이 잘려요. 첫소리 「ㅅ」이 잘리면 「사랑합니다」가 「아랑합니다」처럼 들리고, 끝이 잘리면 말끝이 「뚝」 끊겨요. 이런 부분은 작아도 알아듣는 데 아주 중요해요.',
        more: '<ul><li><b>시작이 잘릴 때</b>: Threshold 를 조금 낮추고, Attack 을 짧게 해요.</li>' +
          '<li><b>끝이 잘릴 때</b>: Hold 와 Release 를 늘려요. 그래도 어색하면 Range 를 얕게 해요.</li>' +
          '<li><b>확인 방법</b>: 게이트를 껐다 켜 보며(바이패스) 첫소리와 끝소리가 똑같이 들리는지 들어 봐요. 말하는 도중에 게이트 표시가 자주 꺼지면 Threshold 가 너무 높은 거예요.</li>' +
          '<li>「ㅅ·ㅆ·ㅎ·ㅍ」 같은 자음은 모음보다 훨씬 작아서 먼저 잘려요(그림의 크기는 교육용 근사).</li></ul>',
        check: { q: '설교자 말의 첫소리가 자꾸 잘려요(「아랑합니다」). 알맞은 조치는?', options: [
          { t: 'Threshold 를 조금 낮추고 Attack 을 짧게 한다', ok: true, why: '맞아요. 작은 첫소리에도 빨리 열리게 해요.' },
          { t: 'Threshold 를 높이고 Range 를 −∞ 로 한다', why: '더 많이, 더 깊게 잘려요.' },
          { t: 'Release 를 아주 짧게 한다', why: 'Release 는 끝부분이에요. 짧게 하면 말끝까지 잘려요.' }] } },
      { title: '라이브에서의 한계와 드럼 게이트', visual: 'gateTom',
        body: '게이트는 <b>소리와 사이가 분명한 곳</b>에 잘 맞아요. 대표가 <b>드럼 탐 마이크</b>예요. 탐은 가끔만 치는데, 마이크는 늘 스네어·심벌 소리(블리드)를 받아요. 탐을 칠 때만 열리게 하면 드럼 소리가 깔끔해져요. 반대로 <b>설교·보컬</b>은 작은 소리·숨결·말끝까지 중요해서, 게이트를 쓰면 오히려 어색해지기 쉬워요.',
        more: '<ul><li><b>게이트를 피하거나 약하게 쓸 곳</b>: 설교·기도·낭독 마이크, 리드 보컬, 성가대 마이크, 피아노·어쿠스틱 기타처럼 여리게 연주하는 악기. 꼭 쓰려면 Range 를 얕게(−10 dB 정도) 해요.</li>' +
          '<li><b>왜 위험할까?</b> 말을 시작하는 순간이 잘리거나, 작게 기도하는 부분이 통째로 닫혀 「마이크가 꺼졌다」고 느낄 수 있어요. 디지털 콘솔에서 소리가 갑자기 안 나면 게이트 Threshold 도 확인할 곳이에요.</li>' +
          '<li><b>드럼 탐</b>: Attack 은 짧게, Threshold 는 스네어 블리드보다 높게, Release 는 탐 울림이 자연스럽게 끝날 만큼(보통 수백 ms) 둬요. 세게 치는 연주자와 여리게 치는 연주자는 값이 달라요.</li>' +
          '<li><b>킥(베이스 드럼)</b>에도 게이트를 자주 써요. 하지만 오버헤드(심벌 위 마이크)처럼 늘 소리가 있는 마이크에는 쓰지 않아요.</li>' +
          '<li>무대 모니터가 크면 그 소리도 블리드가 되어 게이트가 엉뚱하게 열려요. 모니터 음량을 알맞게 하는 것이 먼저예요.</li></ul>',
        check: { q: '게이트가 가장 잘 맞는 마이크는?', options: [
          { t: '드럼 탐 마이크', ok: true, why: '맞아요. 탐을 칠 때와 안 칠 때의 크기 차이가 분명하고, 사이에 블리드만 있어요.' },
          { t: '설교 마이크', why: '작은 목소리·말끝이 잘리기 쉬워 보통 쓰지 않거나 아주 약하게 써요.' },
          { t: '성가대 마이크', why: '여러 사람의 작은 소리까지 받아야 해서 게이트가 어색하게 끊어요.' }] } },
      { title: 'CL5 채널 게이트 살펴보기', visual: 'gateCl5',
        body: '3층 CL5 는 입력 채널마다 <b>Dynamics 1</b> 에서 게이트를 고를 수 있어요(제조사 자료). THRESHOLD · RANGE · ATTACK · HOLD · DECAY 를 정하고, 게이트가 얼마나 줄이고 있는지 미터로 확인해요. 값의 범위는 넓지만, 맞추는 순서는 이 모듈에서 배운 것과 같아요.',
        more: '<ul><li><b>CL5 게이트 범위 (제조사 자료, 48 kHz 동작 기준)</b>: THRESHOLD −72 ~ 0 dB · RANGE −∞ ~ 0 dB · ATTACK 0 ~ 120 ms · HOLD 0.02 ms ~ 1.96 s · DECAY 5 ms ~ 42.3 s</li>' +
          '<li>CL5 의 <b>DECAY</b> 가 이 모듈의 Release 와 같은 역할(Hold 뒤 닫히는 속도)이에요.</li>' +
          '<li>Dynamics 1 은 GATE 말고도 DUCKING · COMPRESSOR · EXPANDER 로 바꿀 수 있고, Dynamics 2 는 COMPRESSOR · COMPANDER-H · COMPANDER-S · DE-ESSER 예요(제조사 자료).</li>' +
          '<li><b>맞추는 순서 예시</b>: ① 게이트를 켜고 Threshold 를 가장 낮게 ② 소리가 없을 때 잡음이 닫힐 때까지 Threshold 를 천천히 올림 ③ 말·연주를 시키며 첫소리·끝소리가 잘리지 않는지 확인 ④ HOLD·DECAY·RANGE 로 자연스럽게 다듬기 ⑤ 게이트를 껐다 켜며 비교</li>' +
          '<li>MG12XU 사양에는 게이트가 없어요. 다이내믹 기능은 1–4번 채널의 원 노브 컴프레서뿐이에요(제조사 자료).</li></ul>',
        check: { q: 'CL5 게이트에서 「Hold 가 끝난 뒤 닫히는 속도」를 정하는 값은?', options: [
          { t: 'DECAY', ok: true, why: '맞아요. 이 모듈의 Release 와 같은 역할이에요.' },
          { t: 'ATTACK', why: 'ATTACK 은 열리는 속도예요.' },
          { t: 'THRESHOLD', why: 'THRESHOLD 는 열리고 닫히는 기준 크기예요.' }] } }
    ],
    practice: {
      kind: 'gateSim',
      lead: '실제 보컬 녹음에 일정한 배경 잡음(쉬—)을 섞었어요. Threshold·Attack·Hold·Release·Range 를 움직이며 게이트가 열리고 닫히는 모습을 파형과 미터로 보고, 「소리 켜기」로 들어 보세요. 드럼 녹음으로 바꿀 수도 있어요.',
      note: '게이트 동작(검출·Hold·Release 곡선)과 배경 잡음은 교육용 근사 모델이에요. 값의 범위는 CL5 게이트(제조사 자료)를 참고해 줄였어요. 결과(말소리 통과·잡음 닫힘·말끝 보존)는 설정을 바꾼 뒤부터 새로 세요. 소리를 끈 상태에서도 같은 계산으로 파형과 미터가 움직여요.',
      tasks: [
        { id: 'close', title: '말 사이 잡음 닫기', text: 'Range 는 −20 dB 보다 깊게 두고 Threshold 를 올려, 말 사이 잡음은 70% 이상 닫히고 말소리는 95% 이상 통과하게 하세요.' },
        { id: 'tail', title: '말끝이 잘리지 않게 Hold·Release', text: '잡음은 닫힌 채로 Hold 나 Release 를 늘려, 말끝(작아지며 사라지는 부분)이 85% 이상 살아 있게 하세요(잡음 닫힘 50% 이상).' },
        { id: 'range', title: 'Range 로 자연스럽게', text: 'Range 를 −8 ~ −20 dB 로 얕게 해, 잡음을 완전히 끄지 않고 조금만 줄이세요(잡음 닫힘 60% 이상).' },
        { id: 'toohigh', title: 'Threshold 가 너무 높을 때', text: 'Threshold 를 −20 dB 이상으로 올려, 말하는 도중에도 게이트가 닫혀(말소리 통과 85% 이하) 말이 끊기는 것을 확인하세요.' },
        { id: 'drum', title: '드럼: Attack 과 타격음', text: '드럼으로 바꿔 북 사이를 닫고, Attack 을 20 ms 이상으로 길게 했다가 1 ms 이하로 줄여 타격음 첫머리가 살아나는 것을 확인하세요.' }
      ],
      links: [
        { title: '3층 음향 시스템 · 신호 따라가기', text: '강대상 마이크가 게이트가 있는 CL5 채널까지 가는 길을 봐요.', go: { tab: 'tab2', trace: 'mic_podium_L' } },
        { title: 'Ear Training', text: '작은 볼륨 변화와 대역 차이를 귀로 구분하는 연습을 해요.', go: { tab: 'tab3' } }
      ]
    },
    quiz: [
      { q: '말 사이 잡음이 미터에서 약 −50 dB, 말소리는 −25 ~ −8 dB 예요. Threshold 로 가장 알맞은 것은?', options: [
        { t: '약 −40 dB', ok: true, why: '맞아요. 잡음보다 조금 높고 말소리보다 낮아요. 실제로는 들으며 조금씩 조절해요.' },
        { t: '약 −60 dB', why: '잡음보다 낮아서 게이트가 늘 열려 있어요.' },
        { t: '약 −15 dB', why: '말소리 일부보다 높아서 말이 끊겨요.' }] },
      { q: '게이트 Range 를 −∞ 에서 −12 dB 로 바꾸면?', options: [
        { t: '닫혔을 때도 소리를 12 dB 만 줄여 더 자연스럽다', ok: true, why: '맞아요. 잡음은 줄면서 「뚝 끊기는」 느낌은 덜해요.' },
        { t: '게이트가 더 빨리 열린다', why: '열리는 속도는 Attack 이 정해요.' },
        { t: 'Threshold 가 12 dB 높아진다', why: 'Range 와 Threshold 는 서로 다른 값이에요.' }] },
      { q: 'Hold 를 0, Release 를 아주 짧게 하면 말하는 도중 생기기 쉬운 현상은?', options: [
        { t: '채터링(덜덜 끊김)과 말끝 잘림', ok: true, why: '맞아요. 말소리가 순간순간 작아질 때마다 바로 닫혀요.' },
        { t: '근접 효과', why: '근접 효과는 마이크를 입에 바짝 댈 때 저음이 커지는 현상이에요.' },
        { t: '클리핑', why: '클리핑은 신호가 너무 클 때 생겨요.' }] },
      { q: '예배 중 기도 인도자의 작은 목소리가 갑자기 들리지 않아요(디지털 콘솔, 게이트 사용 중). 의심할 것은?', options: [
        { t: 'Threshold 가 작은 목소리보다 높아 게이트가 닫혔다', ok: true, why: '맞아요. 게이트 표시와 GR 미터를 확인하고 Threshold 를 낮추거나 게이트를 꺼요.' },
        { t: 'Attack 이 짧다', why: '짧은 Attack 은 빨리 열리게 할 뿐이에요.' },
        { t: 'Range 가 얕다', why: '얕은 Range 는 오히려 덜 줄여요.' }] },
      { q: '드럼 탐 마이크에 게이트를 쓰는 주된 이유는?', options: [
        { t: '탐을 치지 않을 때 들어오는 스네어·심벌 블리드를 줄이려고', ok: true, why: '맞아요. 탐을 칠 때만 열어 드럼 소리를 깔끔하게 해요.' },
        { t: '탐 소리를 더 크게 키우려고', why: '게이트는 소리를 키우지 않아요. 닫을 때 줄일 뿐이에요.' },
        { t: '피드백을 완전히 없애려고', why: '게이트는 피드백을 해결하는 도구가 아니에요.' }] }
    ],
    missions: [
      { title: '음향 트러블슈팅 · 미션 A', text: '「마이크 소리가 나오지 않음」을 신호를 따라가며 해결해요. 디지털 콘솔이라면 게이트가 닫혀 있는지도 확인 목록에 넣어 두세요.', go: { tab: 'tab7', ts: 'A' } },
      { title: 'CL5 콘솔 트레이닝', text: '예배 순서에 맞춰 채널을 켜고 끄는 연습을 해요. 쓰지 않는 마이크는 게이트보다 채널 ON/OFF 로 정리하는 것이 기본이에요.', go: { tab: 'tab5' } }
    ],
    deeper: [
      { title: '익스팬더 (Expander)', text: '게이트처럼 기준 아래를 줄이지만, 한 번에 닫지 않고 비율(Ratio)만큼 천천히 줄여요. 게이트가 어색한 보컬에 더 자연스러워요. CL5 Dynamics 1 에서 고를 수 있어요(제조사 자료).', more: '예를 들어 Ratio 1:2 면 기준보다 10 dB 작은 소리는 20 dB 작아져요. 작은 소리를 「끄는」 게 아니라 「더 작게」 해요.' },
      { title: '키 인 (사이드체인)', text: '게이트가 다른 신호를 듣고 열리게 할 수 있어요. 예를 들어 킥 드럼이 칠 때만 다른 채널의 게이트를 여는 식이에요. CL5 는 다이내믹의 키 인 소스를 고를 수 있어요(제조사 자료).', more: '' },
      { title: '게이트와 컴프레서의 순서', text: '보통 게이트를 컴프레서 앞에 둬요. 컴프레서가 먼저 큰 소리를 누르고 메이크업 게인으로 전체를 키우면, 작은 잡음도 커져서 게이트가 소리와 잡음을 구분하기 어려워져요.', more: '다음 모듈 「Compressor」에서 Threshold·Ratio·Makeup Gain 을 자세히 배워요.' }
    ],
    sources: [
      { t: 'Yamaha CL5/CL3/CL1 Reference Manual (Dynamics Parameters, 제조사)', url: 'https://data.yamaha.com/files/download/other_assets/1/392941/cl5_3_1_en_rm_d1.pdf' },
      { t: 'CL5 레퍼런스 매뉴얼 · Dynamics Parameters (GATE 표)', url: 'https://www.manualslib.com/manual/907139/Yamaha-Cl5.html?page=214' },
      { t: 'CL5 레퍼런스 매뉴얼 · Mixer Basic Parameters (Dynamics 1 범위)', url: 'https://manualslib.mx/manual/582/Yamaha-Cl5.html?page=334' },
      { t: 'Yamaha CL Series Specs (Dynamics 1/2 종류, 제조사)', url: 'https://usa.yamaha.com/products/proaudio/mixers/cl_series/specs.html' },
      { t: 'Yamaha MG12XU/MG12 Technical Specifications (입력 채널 기능, 제조사)', url: 'https://c3.zzounds.com/media/mg12xu_mg12_en_ts_a0-e2c63cdc55417602e98f65e82fc3b6fa.pdf' }
    ]
  };
})();
