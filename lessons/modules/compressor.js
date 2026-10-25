/* =============================================================================
   학습 모듈: compressor — Compressor (음량 편차를 고르게)  (믹싱 스킬 04)
   - 등록: window.STA_MODULES.compressor / STAVisuals.comp* / STASims.compressorSim
   - 그림의 곡선은 공식으로 계산(전달 곡선: 출력 = T + (입력 − T) ÷ Ratio, 시간 변화: 1차 지연 근사).
   - 장비 수치는 제조사 자료(MG12XU 사용설명서·기술 사양, CL/QL 레퍼런스 매뉴얼)에서만 가져옴.
   - 실습: 실제 보컬 녹음(leadVox)을 Web Audio DynamicsCompressorNode 로 실시간 처리.
     GR 미터는 소리를 켜면 노드의 reduction 값, 끄면 같은 녹음의 레벨(5 ms 피크)로 계산한 모델.
   ============================================================================= */
(function () {
  'use strict';
  var VIS = window.STAVisuals = window.STAVisuals || {};
  var SIMS = window.STASims = window.STASims || {};
  var C = { ink: '#0f2747', sub: '#5b6b80', line: '#cbd5e1', teal: '#0e7490', cyan: '#22d3ee', blue: '#2563eb', red: '#dc2626', amber: '#f59e0b', green: '#16a34a', bg: '#f8fafc', orange: '#ea580c', violet: '#7c3aed' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + s + '</text>'; }
  function f1(v) { return (+v).toFixed(1); }
  function nd(v) { var s = String(Math.round(v * 10) / 10); return s.replace('-', '−'); }
  function dB(x) { return 20 * Math.log10(Math.max(x, 1e-9)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ------------------------------------------------------------------ 계산 */
  // 교과서식 전달 곡선(가운데 소프트 니, W = 니 폭 dB). W = 0 이면 하드 니.
  function tbOut(x, T, R, W) {
    W = W || 0; var d = x - T;
    if (W > 0 && Math.abs(d) <= W / 2) return x + (1 / R - 1) * Math.pow(d + W / 2, 2) / (2 * W);
    return d <= 0 ? x : T + d / R;
  }
  // Web Audio(Chromium) DynamicsCompressor 의 정적 곡선 — 실습 소리와 똑같은 모양을 그리려고 같은 방식으로 계산.
  //  Threshold 에서 시작해 Knee 폭만큼 위쪽에서 부드럽게 꺾임(가운데 기준인 교과서식과 다름).
  function waCurve(T, K, R) {
    var linT = Math.pow(10, T / 20), slope = 1 / R;
    function knee(x, k) { return linT + (1 - Math.exp(-k * (x - linT))) / k; }
    function slopeAt(x, k) { if (x < linT) return 1; var x2 = x * 1.001; return (dB(knee(x2, k)) - dB(knee(x, k))) / (dB(x2) - dB(x)); }
    var xk = Math.pow(10, (T + K) / 20), minK = 0.1, maxK = 10000, k = 5;
    for (var i = 0; i < 15; i++) { if (slopeAt(xk, k) < slope) maxK = k; else minK = k; k = Math.sqrt(minK * maxK); }
    var kT = T + K, yk = K > 0 ? dB(knee(xk, k)) : T;
    return function (x) { if (x <= T) return x; if (x < kT) return dB(knee(Math.pow(10, x / 20), k)); return yk + slope * (x - kT); };
  }
  // 1차 지연으로 GR 을 따라가게 하는 근사(Attack·Release 는 「약 10 dB 를 움직이는 시간」 기준 → τ ≈ 시간 ÷ 2.3)
  function tau(ms) { return Math.max(0.0002, ms / 1000 / 2.3); }
  // 한 음절 확대: −30 dBFS → 40 ms 에 −6 dBFS(200 ms 동안) → 다시 −30 dBFS
  function burst(p, dt) {
    var f = waCurve(p.threshold, p.knee, p.ratio), ta = tau(p.attack), tr = tau(p.release), g = 0, out = [], step = dt || 0.00025;
    var ka = 1 - Math.exp(-step / ta), kr = 1 - Math.exp(-step / tr), sumGR = 0, nGR = 0, grss = Math.max(0, -6 - f(-6));
    for (var s = 0; s <= 0.3; s += step) {
      var x = (s >= 0.04 && s < 0.24) ? -6 : -30, tg = p.on ? Math.max(0, x - f(x)) : 0;
      g += (tg - g) * (tg > g ? ka : kr);
      if (s >= 0.04 && s < 0.05) { sumGR += g; nGR++; }
      out.push([s, x, x - g, g]);
    }
    var early = nGR ? sumGR / nGR : 0;
    return { pts: out, grss: p.on ? grss : 0, pass: p.on ? Math.max(0, grss - early) : 0 };
  }

  /* ------------------------------------------------------------------ 그림 */
  // 그림용 가상 노래 레벨: 0–5 s 조용한 절, 5–10 s 힘찬 후렴 (음절마다 오르내림)
  function phrase(s) { var base = s < 5 ? -28 : -8, ph = (s % 0.45) / 0.45; return base - 14 * (1 - Math.pow(Math.sin(Math.PI * Math.min(1, ph / 0.8)), 2)) + 2 * Math.sin(s * 3.1); }
  V();
  function V() {
    VIS.compDynamics = function () {
      var x0 = 60, x1 = 570, y0 = 26, y1 = 176, fx = function (s) { return x0 + s / 10 * (x1 - x0); }, fy = function (d) { return y0 + (-d) / 40 * (y1 - y0); };
      var T = -18, R = 4, MU = 8, din = '', dout = '', mx = [-99, -99], ox = [-99, -99];
      for (var s = 0; s <= 10.0001; s += 0.02) {
        var x = phrase(s), y = tbOut(x, T, R, 0) + MU, h = s < 5 ? 0 : 1;
        din += (din ? 'L' : 'M') + fx(s).toFixed(1) + ' ' + fy(x).toFixed(1); dout += (dout ? 'L' : 'M') + fx(s).toFixed(1) + ' ' + fy(Math.min(0, y)).toFixed(1);
        if (x > mx[h]) mx[h] = x; if (y > ox[h]) ox[h] = y;
      }
      var dIn = mx[1] - mx[0], dOut = ox[1] - ox[0];
      var grid = [0, -10, -20, -30, -40].map(function (d) { return '<path d="M' + x0 + ' ' + fy(d) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="' + (d ? '3 3' : '0') + '"/>' + t(x0 - 6, fy(d) + 4, nd(d), { size: 10, fill: C.sub, anchor: 'end' }); }).join('');
      return svg(600, 220, grid + '<path d="M' + x0 + ' ' + fy(T) + 'H' + x1 + '" stroke="' + C.red + '" stroke-width="1.5" stroke-dasharray="6 4"/>' +
        '<path d="' + din + '" fill="none" stroke="#94a3b8" stroke-width="2"/><path d="' + dout + '" fill="none" stroke="' + C.teal + '" stroke-width="2.4"/>' +
        '<path d="M' + fx(5) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.ink + '" stroke-opacity=".25"/>' + t(fx(2.5), y1 + 18, '조용한 절', { size: 12, fill: C.sub }) + t(fx(7.5), y1 + 18, '힘찬 후렴', { size: 12, fill: C.sub }) +
        t(x0, 16, 'dB', { size: 10, fill: C.sub, anchor: 'start' }) +
        '<rect x="' + (x0 + 6) + '" y="' + (y0 + 2) + '" width="272" height="56" rx="6" fill="#fff" stroke="' + C.line + '"/>' +
        '<path d="M' + (x0 + 14) + ' ' + (y0 + 15) + 'h18" stroke="#94a3b8" stroke-width="2.5"/>' + t(x0 + 38, y0 + 19, '컴프 전: 절·후렴 큰 부분 차이 약 ' + Math.round(dIn) + ' dB', { size: 11, anchor: 'start' }) +
        '<path d="M' + (x0 + 14) + ' ' + (y0 + 32) + 'h18" stroke="' + C.teal + '" stroke-width="2.5"/>' + t(x0 + 38, y0 + 36, '컴프 후(4:1 + Makeup 8 dB): 약 ' + Math.round(dOut) + ' dB', { size: 11, anchor: 'start', fill: C.teal, weight: 700 }) +
        '<path d="M' + (x0 + 14) + ' ' + (y0 + 48) + 'h18" stroke="' + C.red + '" stroke-width="1.5" stroke-dasharray="6 4"/>' + t(x0 + 38, y0 + 52, 'Threshold −18 dB (이 선을 넘는 부분만 줄임)', { size: 11, anchor: 'start', fill: C.red }) +
        t(x1, 212, '노래 레벨 「예시」 — 계산으로 만든 가상 곡선', { size: 10, fill: C.sub, anchor: 'end' }), '컴프레서 전후 음량 변화 예시');
    };
    VIS.compCurve = function () {
      var x0 = 50, x1 = 290, y0 = 16, y1 = 256, T = -20, fx = function (d) { return x0 + (d + 60) / 60 * (x1 - x0); }, fy = function (d) { return y1 - (d + 60) / 60 * (y1 - y0); };
      function line(R, W) { var d = ''; for (var x = -60; x <= 0.001; x += 0.5) d += (d ? 'L' : 'M') + fx(x).toFixed(1) + ' ' + fy(tbOut(x, T, R, W)).toFixed(1); return d; }
      var grid = [-60, -50, -40, -30, -20, -10, 0].map(function (d) { return '<path d="M' + fx(d) + ' ' + y0 + 'V' + y1 + 'M' + x0 + ' ' + fy(d) + 'H' + x1 + '" stroke="' + C.line + '" stroke-width=".8"/>' + t(fx(d), y1 + 14, nd(d), { size: 9, fill: C.sub }) + t(x0 - 5, fy(d) + 3, nd(d), { size: 9, fill: C.sub, anchor: 'end' }); }).join('');
      var ex = -8, ey = tbOut(ex, T, 4, 0);
      var body = grid + '<path d="M' + fx(-60) + ' ' + fy(-60) + 'L' + fx(0) + ' ' + fy(0) + '" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 4"/>' +
        '<path d="M' + fx(T) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.red + '" stroke-dasharray="3 3"/>' + t(fx(T) + 4, y1 - 6, 'Threshold', { size: 10, fill: C.red, anchor: 'start' }) +
        '<path d="' + line(2, 0) + '" fill="none" stroke="' + C.blue + '" stroke-width="2"/>' +
        '<path d="' + line(1e9, 0) + '" fill="none" stroke="' + C.red + '" stroke-width="2"/>' +
        '<path d="' + line(4, 12) + '" fill="none" stroke="' + C.violet + '" stroke-width="2" stroke-dasharray="4 3"/>' +
        '<path d="' + line(4, 0) + '" fill="none" stroke="' + C.teal + '" stroke-width="3"/>' +
        '<path d="M' + fx(ex) + ' ' + fy(ex) + 'V' + (fy(ey) - 3) + '" stroke="' + C.orange + '" stroke-width="2"/><path d="M' + (fx(ex) - 4) + ' ' + (fy(ey) - 7) + 'l4 6 4 -6" fill="none" stroke="' + C.orange + '" stroke-width="2"/>' +
        '<circle cx="' + fx(ex) + '" cy="' + fy(ey) + '" r="4" fill="' + C.teal + '"/>' + t(fx(ex) - 6, (fy(ex) + fy(ey)) / 2 + 4, 'GR ' + nd(ex - ey) + ' dB', { size: 11, fill: C.orange, weight: 800, anchor: 'end' }) +
        t((x0 + x1) / 2, y1 + 28, '입력 (dB)', { size: 10, fill: C.sub }) + t(x0 - 30, y0 - 4, '출력 (dB)', { size: 10, fill: C.sub, anchor: 'start' });
      var lg = [[C.teal, '4:1 (하드 니)', ''], [C.blue, '2:1', ''], [C.red, '∞:1 (리미터)', ''], [C.violet, '4:1 소프트 니 (폭 12 dB)', '4 3'], ['#94a3b8', '1:1 (컴프 없음)', '5 4']];
      body += lg.map(function (l, i) { var y = 34 + i * 20; return '<path d="M318 ' + y + 'h24" stroke="' + l[0] + '" stroke-width="2.5"' + (l[2] ? ' stroke-dasharray="' + l[2] + '"' : '') + '/>' + t(348, y + 4, l[1], { size: 11, anchor: 'start' }); }).join('');
      body += '<rect x="312" y="140" width="276" height="96" rx="10" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(324, 160, '출력 = T + (입력 − T) ÷ Ratio', { size: 12, weight: 800, anchor: 'start' }) +
        t(324, 180, '예) T −20 dB, 4:1, 입력 −8 dB', { size: 11, anchor: 'start', fill: C.sub }) + t(324, 198, '→ 넘은 12 dB 가 3 dB 로 → 출력 ' + nd(ey) + ' dB', { size: 11, anchor: 'start' }) +
        t(324, 216, '→ 줄어든 양 GR = 12 × (1 − 1/4) = 9 dB', { size: 11, anchor: 'start', fill: C.orange, weight: 700 }) + t(324, 232, '(그림의 선은 이 공식으로 계산)', { size: 10, anchor: 'start', fill: C.sub });
      return svg(600, 290, body, '컴프레서 전달 곡선: Threshold −20 dB, Ratio 2:1, 4:1, 무한대:1, 소프트 니');
    };
    VIS.compTime = function () {
      var x0 = 50, x1 = 570, y0 = 24, y1 = 170, fx = function (s) { return x0 + s / 0.3 * (x1 - x0); }, fy = function (d) { return y0 + (6 - d) / 42 * (y1 - y0); };
      var fast = burst({ on: true, threshold: -20, ratio: 4, knee: 0, attack: 1, release: 100 }), slow = burst({ on: true, threshold: -20, ratio: 4, knee: 0, attack: 25, release: 100 });
      function path(b, i) { return b.pts.filter(function (p, k) { return k % 4 === 0; }).map(function (p, k) { return (k ? 'L' : 'M') + fx(p[0]).toFixed(1) + ' ' + fy(Math.max(-36, p[i])).toFixed(1); }).join(''); }
      var grid = [0, -12, -24, -36].map(function (d) { return '<path d="M' + x0 + ' ' + fy(d) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(x0 - 6, fy(d) + 4, nd(d), { size: 10, fill: C.sub, anchor: 'end' }); }).join('') +
        [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3].map(function (s) { return t(fx(s), y1 + 15, Math.round(s * 1000) + ' ms', { size: 9, fill: C.sub }); }).join('');
      return svg(600, 244, grid + '<rect x="' + fx(0.04) + '" y="' + y0 + '" width="' + (fx(0.05) - fx(0.04)) + '" height="' + (y1 - y0) + '" fill="' + C.amber + '" fill-opacity=".22"/>' + t(fx(0.045), y0 - 6, '자음(첫 10 ms)', { size: 10, fill: '#92400e' }) +
        '<path d="M' + x0 + ' ' + fy(-20) + 'H' + x1 + '" stroke="' + C.red + '" stroke-dasharray="6 4"/>' + t(x1, fy(-20) - 4, 'Threshold −20', { size: 10, fill: C.red, anchor: 'end' }) +
        '<path d="' + path(fast, 1) + '" fill="none" stroke="#94a3b8" stroke-width="2"/>' +
        '<path d="' + path(fast, 2) + '" fill="none" stroke="' + C.red + '" stroke-width="2.2"/>' + '<path d="' + path(slow, 2) + '" fill="none" stroke="' + C.teal + '" stroke-width="2.6"/>' +
        '<path d="M' + x0 + ' 206h16" stroke="#94a3b8" stroke-width="2.5"/>' + t(x0 + 22, 210, '입력', { size: 11, anchor: 'start' }) +
        '<path d="M' + (x0 + 70) + ' 206h16" stroke="' + C.red + '" stroke-width="2.5"/>' + t(x0 + 92, 210, 'Attack 1 ms: 자음까지 눌림', { size: 11, anchor: 'start', fill: C.red }) +
        '<path d="M' + (x0 + 280) + ' 206h16" stroke="' + C.teal + '" stroke-width="2.5"/>' + t(x0 + 302, 210, 'Attack 25 ms: 앞부분 통과', { size: 11, anchor: 'start', fill: C.teal }) +
        t(fx(0.27), fy(-30) - 8, 'Release', { size: 10, fill: C.sub }) +
        t(x1, 236, 'Threshold −20, 4:1, Release 100 ms · 1차 지연 계산(교육용 근사)', { size: 10, fill: C.sub, anchor: 'end' }) + t(x0, 14, 'dB', { size: 10, fill: C.sub, anchor: 'start' }), 'Attack 빠름과 느림의 비교');
    };
    VIS.compGR = function () {
      function meter(x, label, val, kind, note) {
        var segs = kind === 'gr' ? [1, 2, 3, 4, 6, 8, 10, 12] : [0, -3, -6, -9, -12, -18, -24, -30], h = '';
        segs.forEach(function (s, i) { var y = 34 + i * 16, on = kind === 'gr' ? val >= s : val >= s, col = kind === 'gr' ? (s >= 10 ? C.red : C.orange) : (s >= 0 ? C.red : s >= -6 ? C.amber : C.green);
          h += '<rect x="' + x + '" y="' + y + '" width="30" height="12" rx="2" fill="' + col + '" fill-opacity="' + (on ? 1 : 0.15) + '"/>' + t(x - 5, y + 10, kind === 'gr' ? '−' + s : nd(s), { size: 9, fill: C.sub, anchor: 'end' }); });
        return '<rect x="' + (x - 30) + '" y="6" width="96" height="190" rx="10" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(x + 15, 24, label, { size: 12, weight: 800 }) + h + t(x + 15, 180, note, { size: 10, fill: C.sub });
      }
      return svg(600, 210, meter(52, '입력', -4, 'in', '피크 −4') + '<path d="M118 100h16" stroke="' + C.ink + '" stroke-width="2"/><path d="M128 95l6 5-6 5" fill="none" stroke="' + C.ink + '" stroke-width="2"/>' +
        meter(178, 'GR', 6, 'gr', '지금 6 dB 줄임') + '<path d="M244 100h16" stroke="' + C.ink + '" stroke-width="2"/><path d="M254 95l6 5-6 5" fill="none" stroke="' + C.ink + '" stroke-width="2"/>' +
        meter(304, '출력', -10, 'in', 'Makeup 0 dB') + meter(430, '출력', -4, 'in', 'Makeup +6 dB') +
        t(520, 70, '→', { size: 18, fill: C.teal }) + t(588, 120, '줄어든 6 dB 를', { size: 11, anchor: 'end', fill: C.teal }) + t(588, 136, 'Makeup 으로', { size: 11, anchor: 'end', fill: C.teal }) + t(588, 152, '다시 올려요', { size: 11, anchor: 'end', fill: C.teal, weight: 700 }) +
        t(588, 200, '미터 값은 「예시」', { size: 10, fill: C.sub, anchor: 'end' }), 'GR 미터와 Makeup Gain 예시');
    };
    VIS.compWorship = function () {
      function card(x, title, sub, rows, col) {
        return '<g transform="translate(' + x + ',8)"><rect width="282" height="196" rx="14" fill="' + C.bg + '" stroke="' + col + '" stroke-width="1.5"/>' + t(141, 26, title, { size: 14, weight: 800, fill: col }) + t(141, 44, sub, { size: 11, fill: C.sub }) +
          rows.map(function (r, i) { var y = 72 + i * 26; return t(18, y, r[0], { size: 12, fill: C.sub, anchor: 'start' }) + t(264, y, r[1], { size: 12, weight: 700, anchor: 'end' }) + (i < rows.length - 1 ? '<path d="M18 ' + (y + 9) + 'H264" stroke="' + C.line + '" stroke-dasharray="2 3"/>' : ''); }).join('') + '</g>';
      }
      return svg(600, 232, card(8, '말 (설교·기도·광고)', '변화는 작지만 갑자기 튀어요', [['Ratio', '2:1 – 3:1'], ['큰 부분 GR', '약 2 – 4 dB'], ['Attack', '약 10 – 30 ms'], ['Release', '약 100 – 300 ms'], ['목표', '자연스럽게, 가볍게']], C.blue) +
        card(310, '찬양 보컬', '절과 후렴의 차이가 커요', [['Ratio', '3:1 – 4:1'], ['큰 부분 GR', '약 3 – 6 dB'], ['Attack', '약 5 – 20 ms'], ['Release', '약 100 – 250 ms'], ['목표', '후렴이 튀지 않게']], C.teal) +
        t(300, 226, '흔히 쓰는 「출발점 예시」예요 — 정답이 아니니 꼭 귀로 확인하세요', { size: 11, fill: C.sub }), '말과 찬양 보컬의 컴프레서 출발점 예시');
    };
    VIS.compOver = function () {
      var x0 = 40, x1 = 330, y0 = 30, y1 = 170, fx = function (s) { return x0 + s / 3 * (x1 - x0); }, fy = function (g) { return y0 + g / 24 * (y1 - y0); };
      function grPath(T, R, rel) { var f = waCurve(T, 0, R), g = 0, d = '', ka = 1 - Math.exp(-0.005 / tau(5)), kr = 1 - Math.exp(-0.005 / tau(rel)); for (var s = 0; s <= 3.0001; s += 0.005) { var x = phrase(5 + s), tg = Math.max(0, x - f(x)); g += (tg - g) * (tg > g ? ka : kr); d += (d ? 'L' : 'M') + fx(s).toFixed(1) + ' ' + fy(Math.min(24, g)).toFixed(1); } return d; }
      var grid = [0, 6, 12, 18, 24].map(function (g) { return '<path d="M' + x0 + ' ' + fy(g) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(x0 - 5, fy(g) + 4, g ? '−' + g : 0, { size: 9, fill: C.sub, anchor: 'end' }); }).join('');
      var left = grid + '<path d="' + grPath(-14, 3, 200) + '" fill="none" stroke="' + C.teal + '" stroke-width="2.4"/><path d="' + grPath(-36, 20, 60) + '" fill="none" stroke="' + C.red + '" stroke-width="2.2"/>' +
        t(x0, 18, 'GR (dB) — 후렴 3초', { size: 11, fill: C.sub, anchor: 'start' }) + t(x1, y1 + 18, '가벼운 압축(청록): 큰 부분만 조금', { size: 11, fill: C.teal, anchor: 'end' }) + t(x1, y1 + 34, '과도한 압축(빨강): 크게 출렁임 = 펌핑', { size: 11, fill: C.red, anchor: 'end', weight: 700 });
      var bx = 380, by = 160, bars = [['컴프 없음', 0, '#94a3b8'], ['가볍게\n+3 dB', 3, C.teal], ['세게\n+12 dB', 12, C.red]];
      var right = t(485, 18, '조용한 순간의 이득 (Makeup 만큼 ↑)', { size: 11, fill: C.sub }) + '<path d="M' + bx + ' ' + by + 'H590" stroke="' + C.ink + '"/>' +
        bars.map(function (b, i) { var x = bx + 14 + i * 70, h = 6 + b[1] * 9; return '<rect x="' + x + '" y="' + (by - h) + '" width="44" height="' + h + '" rx="4" fill="' + b[2] + '"/>' + t(x + 22, by - h - 6, '+' + b[1] + ' dB', { size: 11, weight: 800, fill: b[2] }) + b[0].split('\n').map(function (s, k) { return t(x + 22, by + 14 + k * 13, s, { size: 10, fill: C.sub }); }).join(''); }).join('') +
        t(485, 202, '→ 피드백 여유가 그만큼 줄어요', { size: 11, fill: C.red, weight: 700 });
      return svg(600, 214, left + right, '과도한 압축의 펌핑과 피드백 여유 감소');
    };
  }

  /* ------------------------------------------------------------------ 녹음 불러오기 (fx-space 와 함께 씀) */
  function b64ToBuf(uri) { var b = atob(uri.slice(uri.indexOf(',') + 1)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  function getVox(cb) {
    var Vx = window.STA_VOX || (window.STA_VOX = { st: 0, cbs: [] });
    if (Vx.st === 2) { cb(Vx); return; }
    Vx.cbs.push(cb); if (Vx.st === 1) return; Vx.st = 1;
    var uri = window.MG12XU_SOURCE_AUDIO_BASE64 && window.MG12XU_SOURCE_AUDIO_BASE64.leadVox, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    function finish(buf, env, blk) { if (Vx.st === 2) return; Vx.buf = buf; Vx.env = env; Vx.blk = blk; Vx.n = env.length; Vx.dur = env.length * blk; Vx.synthetic = !buf; Vx.st = 2; var l = Vx.cbs; Vx.cbs = []; l.forEach(function (f) { try { f(Vx); } catch (e) { /* 다음 콜백 */ } }); }
    function synth() { var blk = 0.005, n = Math.round(60 / blk), env = new Float32Array(n); for (var i = 0; i < n; i++) env[i] = Math.pow(10, phrase((i * blk) % 10) / 20); finish(null, env, blk); }
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

  /* ------------------------------------------------------------------ 실습: 컴프레서 */
  var RATIOS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20], ATTACKS = [0, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 70, 100], RELEASES = [20, 30, 50, 70, 100, 150, 200, 250, 300, 400, 500, 700, 1000];
  var START = 20.5;   // 노래가 시작되는 부분부터 재생(초)
  function nearest(list, v) { var bi = 0; list.forEach(function (x, i) { if (Math.abs(x - v) < Math.abs(list[bi] - v)) bi = i; }); return bi; }
  function compressorSim(el, opts) {
    opts = opts || {};
    var DEF = { on: true, threshold: 0, ratio: 2, attack: 10, release: 250, knee: 0, makeup: 0 };
    var S = { on: DEF.on, threshold: DEF.threshold, ratio: DEF.ratio, attack: DEF.attack, release: DEF.release, knee: DEF.knee, makeup: DEF.makeup, done: {}, audio: false, t0: performance.now(), lastChange: performance.now(), hist: [], trail: [], sawFast: false, at: 0, markAt: 0 };
    var CTRL = [
      ['threshold', 'Threshold', -50, 0, 1, function (v) { return v + ' dBFS'; }],
      ['ratio', 'Ratio', 0, RATIOS.length - 1, 1, function (v) { return v + ':1'; }, RATIOS],
      ['attack', 'Attack', 0, ATTACKS.length - 1, 1, function (v) { return v + ' ms'; }, ATTACKS],
      ['release', 'Release', 0, RELEASES.length - 1, 1, function (v) { return v + ' ms'; }, RELEASES],
      ['knee', 'Knee', 0, 20, 1, function (v) { return v ? v + ' dB (소프트)' : '0 (하드)'; }],
      ['makeup', 'Makeup', 0, 20, 0.5, function (v) { return '+' + f1(v) + ' dB'; }]
    ];
    var SEG_IN = [0, -3, -6, -9, -12, -18, -24, -30, -40], SEG_GR = [1, 2, 3, 4, 6, 8, 10, 12, 15, 20];
    function mtr(role, segs, gr) { return '<div class="sim-cmp-meter' + (gr ? ' gr' : '') + '" data-m="' + role + '">' + segs.map(function (s) { return '<span data-v="' + s + '" class="' + (gr ? (s >= 12 ? 'r' : 'o') : (s >= 0 ? 'r' : s >= -6 ? 'y' : 'g')) + '"><em>' + (gr ? '−' + s : String(s).replace('-', '−')) + '</em></span>'; }).join('') + '</div>'; }
    el.innerHTML =
      '<div class="sim-cmp">' +
        '<div class="sim-cmp-main">' +
          '<div class="sim-cmp-top">' +
            '<div class="sim-cmp-mtrs" aria-label="입력·GR·출력 미터">' +
              '<div class="sim-cmp-mcol"><div class="sim-cmp-lbl">입력</div>' + mtr('in', SEG_IN) + '<b data-o="in">−∞</b></div>' +
              '<div class="sim-cmp-mcol"><div class="sim-cmp-lbl">GR</div>' + mtr('gr', SEG_GR, true) + '<b data-o="gr">0</b></div>' +
              '<div class="sim-cmp-mcol"><div class="sim-cmp-lbl">출력</div>' + mtr('out', SEG_IN) + '<b data-o="out">−∞</b></div>' +
            '</div>' +
            '<div class="sim-cmp-cbox"><canvas data-cv="curve" aria-label="전달 곡선과 지금의 입력·출력 점"></canvas><small>전달 곡선 · 점 = 지금 입력 → 출력 (Makeup 포함)</small></div>' +
          '</div>' +
          '<div class="sim-cmp-plots">' +
            '<div class="sim-cmp-pbox"><canvas data-cv="hist" aria-label="최근 6초 레벨과 GR 기록"></canvas><small>최근 6초 · 회색 입력 · 청록 출력 · 주황 GR(위에서 아래로)</small></div>' +
            '<div class="sim-cmp-pbox"><canvas data-cv="zoom" aria-label="한 음절 확대"></canvas><small>한 음절 확대(교육용 계산) · 노란 띠 = 자음 구간(첫 10 ms)</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="sim-side">' +
          '<div class="sim-box"><h4>소리</h4><button type="button" class="sim-btn sim-play" data-sim="play">🔊 소리 켜기</button>' +
            '<label class="sim-switch"><input type="checkbox" data-sim="on" checked><span>COMP <b>ON</b> (끄면 원래 소리와 비교)</span></label><p class="sim-note" data-role="src"></p></div>' +
          '<div class="sim-box"><h4>컴프레서 조절</h4>' + CTRL.map(function (c) { return '<label class="sim-range sim-cmp-rng"><span>' + c[1] + ' <b data-out="' + c[0] + '"></b></span><input type="range" min="' + c[2] + '" max="' + c[3] + '" step="' + c[4] + '" data-k="' + c[0] + '" aria-label="' + c[1] + '"></label>'; }).join('') +
            '<div class="sim-btns"><button type="button" class="sim-btn" data-sim="reset">처음 상태로</button></div></div>' +
          '<div class="sim-box sim-read" data-role="read"></div>' +
        '</div>' +
      '</div>';
    injectCss();
    var $ = function (s) { return el.querySelector(s); }, read = $('[data-role=read]'), cvs = { curve: $('[data-cv=curve]'), hist: $('[data-cv=hist]'), zoom: $('[data-cv=zoom]') };
    var Vx = null, curveFn = waCurve(S.threshold, S.knee, S.ratio), actx = null, N = null, raf = 0, alive = true, M = { idx: -1, gr: 0 }, dpr = Math.min(2, window.devicePixelRatio || 1), Z = burst(S);
    function ctrlVal(k) { return S[k]; }
    function syncUi() {
      CTRL.forEach(function (c) { var inp = el.querySelector('[data-k=' + c[0] + ']'), v = ctrlVal(c[0]); inp.value = c[6] ? nearest(c[6], v) : v; el.querySelector('[data-out=' + c[0] + ']').textContent = c[5](v); });
      el.querySelector('[data-sim=on]').checked = S.on;
    }
    function changed() { curveFn = waCurve(S.threshold, S.knee, S.ratio); Z = burst(S); S.lastChange = performance.now(); S.markAt = S.at; syncUi(); applyAudio(); drawCurve(); drawZoom(); }
    /* --- 소리 */
    function now() { if (S.audio && actx && N) return ((actx.currentTime - N.start) % Vx.dur + Vx.dur) % Vx.dur; return (((performance.now() - S.t0) / 1000 + START) % (Vx ? Vx.dur : 60)); }
    var mkTimer = 0;
    function applyAudio() {
      if (!N) return; var c = N.comp, tt = actx.currentTime;
      c.threshold.setValueAtTime(S.threshold, tt); c.knee.setValueAtTime(S.knee, tt); c.ratio.setValueAtTime(S.ratio, tt); c.attack.setValueAtTime(S.attack / 1000, tt); c.release.setValueAtTime(S.release / 1000, tt);
      N.mk.gain.setTargetAtTime(Math.pow(10, S.makeup / 20), tt, 0.02); N.onG.gain.setTargetAtTime(S.on ? 1 : 0, tt, 0.01); N.byG.gain.setTargetAtTime(S.on ? 0 : 1, tt, 0.01);
      // 브라우저 컴프레서가 스스로 더하는 자동 보정(makeup)을 재서 되돌림 → 출력 크기는 Makeup 슬라이더만 반영
      clearTimeout(mkTimer); mkTimer = setTimeout(function () { measureAuto(S.threshold, S.knee, S.ratio, function (g) { if (N) N.auto.gain.setTargetAtTime(1 / g, actx.currentTime, 0.03); }); }, 60);
    }
    function measureAuto(T, K, R, cb) {
      var formula = Math.pow(1 / Math.pow(10, waCurve(T, K, R)(0) / 20), 0.6);
      var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      try {
        var oc = new OAC(1, 2048, 44100); if (!oc.createConstantSource) { cb(formula); return; }
        var cs = oc.createConstantSource(), c = oc.createDynamicsCompressor(); cs.offset.value = 1e-4; c.threshold.value = T; c.knee.value = K; c.ratio.value = R;
        cs.connect(c); c.connect(oc.destination); cs.start();
        var p = oc.startRendering(); if (p && p.then) p.then(function (b) { var d = b.getChannelData(0), g = d[d.length - 1] / 1e-4; cb(g > 0.5 && g < 20 ? g : formula); }, function () { cb(formula); }); else cb(formula);
      } catch (e) { cb(formula); }
    }
    function startAudio() {
      if (!Vx || !Vx.buf) { $('[data-role=src]').textContent = '녹음을 불러오지 못해 소리는 들을 수 없어요(미터는 가상 신호로 동작).'; return; }
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      actx = actx || new AC(); if (actx.resume) actx.resume();
      var src = actx.createBufferSource(); src.buffer = Vx.buf; src.loop = true;
      var inG = actx.createGain(), comp = actx.createDynamicsCompressor(), auto = actx.createGain(), mk = actx.createGain(), onG = actx.createGain(), byG = actx.createGain(), out = actx.createGain(), mon = actx.createGain();
      var anIn = actx.createAnalyser(), anOut = actx.createAnalyser(); anIn.fftSize = 1024; anOut.fftSize = 1024; mon.gain.value = 0.7;
      src.connect(inG); inG.connect(comp); comp.connect(auto); auto.connect(mk); mk.connect(onG); onG.connect(out); inG.connect(byG); byG.connect(out); out.connect(mon); mon.connect(actx.destination);
      inG.connect(anIn); out.connect(anOut);
      var start = actx.currentTime + 0.05, off = now(); src.start(start, off);
      N = { src: src, comp: comp, auto: auto, mk: mk, onG: onG, byG: byG, mon: mon, anIn: anIn, anOut: anOut, buf: new Float32Array(1024), start: start - off };
      S.audio = true; applyAudio();
    }
    function stopAudio() { if (N) { try { N.src.stop(); N.mon.disconnect(); } catch (e) { /* 이미 멈춤 */ } } var p = now(); N = null; S.audio = false; S.t0 = performance.now() - (p - START) * 1000; }
    function peakOf(an, buf) { an.getFloatTimeDomainData(buf); var p = 0; for (var i = 0; i < buf.length; i++) { var v = Math.abs(buf[i]); if (v > p) p = v; } return dB(p); }
    /* --- 모델(소리를 끈 상태에서도 미터가 움직이게) */
    function advance(pos) {
      var n = Vx.n, idx = Math.floor(pos / Vx.blk) % n, steps = M.idx < 0 ? 1 : (idx - M.idx + n) % n;
      if (steps > 1600) { M.idx = (idx - 1 + n) % n; steps = 1; }
      var ka = 1 - Math.exp(-Vx.blk / tau(S.attack)), kr = 1 - Math.exp(-Vx.blk / tau(S.release)), r = { inDb: -120, gr: 0, outDb: -120 }, ch = M.ch;
      for (var s = 0; s < steps; s++) {
        M.idx = (M.idx + 1) % n; var x = dB(Vx.env[M.idx]), tg = S.on ? Math.max(0, x - curveFn(x)) : 0;
        M.gr += (tg - M.gr) * (tg > M.gr ? ka : kr);
        var y = x - (S.on ? M.gr - S.makeup : 0);
        if (x > r.inDb) r.inDb = x; if (M.gr > r.gr) r.gr = M.gr; if (y > r.outDb) r.outDb = y;
        // 50 ms 묶음 기록(화면이 느려도 녹음 시간 기준으로 통계를 냄)
        if (!ch) ch = M.ch = { k: 0, inDb: -120, gr: 0, grMin: 99, outDb: -120 };
        if (x > ch.inDb) ch.inDb = x; if (M.gr > ch.gr) ch.gr = M.gr; if (x > -45 && M.gr < ch.grMin) ch.grMin = M.gr; if (y > ch.outDb) ch.outDb = y;
        if (++ch.k >= 10) { if (!S.audio) pushChunk(ch.k * Vx.blk, ch); ch = M.ch = null; }
      }
      return r;
    }
    function pushChunk(dur, c) { S.at += dur; S.hist.push({ t: S.at, dur: dur, inDb: c.inDb, gr: c.gr, grMin: c.grMin, outDb: c.outDb }); while (S.hist.length && S.at - S.hist[0].t > 6) S.hist.shift(); }
    function setMeter(role, v) { el.querySelectorAll('[data-m=' + role + '] span').forEach(function (s) { s.classList.toggle('on', v >= +s.getAttribute('data-v')); }); }
    function fmt(v) { return v <= -80 ? '−∞' : (v > 0 ? '+' : '') + v.toFixed(1); }
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick);
      var tnow = performance.now(), L = advance(now());
      if (S.audio && N) { L = { inDb: peakOf(N.anIn, N.buf), outDb: peakOf(N.anOut, N.buf), gr: S.on ? Math.max(0, -(N.comp.reduction && N.comp.reduction.value != null ? N.comp.reduction.value : N.comp.reduction) || 0) : 0 }; }
      setMeter('in', L.inDb); setMeter('out', L.outDb); setMeter('gr', L.gr);
      el.querySelector('[data-o=in]').textContent = fmt(L.inDb); el.querySelector('[data-o=out]').textContent = fmt(L.outDb); el.querySelector('[data-o=gr]').textContent = L.gr >= 0.05 ? '−' + L.gr.toFixed(1) : '0';
      if (S.audio && N) { var at = actx.currentTime, dt = S.lastAt ? Math.min(0.5, at - S.lastAt) : 0; S.lastAt = at; if (dt > 0) pushChunk(dt, { inDb: L.inDb, gr: L.gr, grMin: L.inDb > -45 ? L.gr : 99, outDb: L.outDb }); } else S.lastAt = 0;
      S.trail.push([L.inDb, L.outDb]); if (S.trail.length > 24) S.trail.shift();
      // 최근 3초(녹음 시간 기준, 마지막으로 조절한 뒤부터) 통계
      var from = Math.max(S.at - 3, S.markAt), w = S.hist.filter(function (h) { return h.t - h.dur >= from - 1e-6; }), maxIn = -120, maxOut = -120, maxGR = 0, minGR = 99;
      w.forEach(function (h) { if (h.inDb > maxIn) maxIn = h.inDb; if (h.outDb > maxOut) maxOut = h.outDb; if (h.gr > maxGR) maxGR = h.gr; if (h.grMin < minGR) minGR = h.grMin; });
      if (minGR === 99) minGR = 0;
      S.span = w.length ? (S.at - (w[0].t - w[0].dur)) * 1000 : 0; S.maxIn = maxIn; S.maxOut = maxOut; S.maxGR = maxGR; S.minGR = minGR; S.swing = maxGR - minGR;
      S.pump = S.on && S.ratio >= 8 && maxGR >= 12 && S.swing >= 8 ? 'heavy' : (S.on && maxGR >= 8 && S.swing >= 6 ? 'some' : 'none');
      judge();
      S.frame = (S.frame || 0) + 1; if (S.frame % 6 === 1) renderRead();
      drawCurve(L); drawHist();
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function judge() {
      if (!S.on) return;
      var full = S.span >= 2500;
      if (full && S.ratio >= 2 && S.maxGR >= 3 && S.maxGR <= 6) hit('peak');
      if (full && S.maxGR >= 3 && S.makeup >= 1 && Math.abs(S.maxOut - S.maxIn) <= 1.5) hit('makeup');
      if (full && S.ratio >= 10 && S.pump === 'heavy') hit('pump');
      if (S.span >= 1500 && S.maxGR >= 3) { if (S.attack <= 2) S.sawFast = true; if (S.sawFast && S.attack >= 15 && S.attack <= 40) hit('attack'); }
    }
    function renderRead() {
      var diff = S.maxOut - S.maxIn, gr = S.maxGR || 0, pm = { none: ['ok', '없음'], some: ['warn', '조금 — 출렁임이 들려요'], heavy: ['bad', '심함 — 「훅훅」 출렁여요'] }[S.pump || 'none'];
      var grq = !S.on ? ['', 'COMP OFF'] : gr < 0.5 ? ['warn', '거의 동작 안 함'] : gr <= 6 ? ['ok', '알맞은 편'] : gr <= 10 ? ['warn', '조금 셈'] : ['bad', '너무 셈'];
      var pass = Z.pass, ps = !S.on || Z.grss < 1 ? ['', '—'] : pass >= 0.4 * Z.grss ? ['ok', '살아 있어요 (약 ' + f1(pass) + ' dB 덜 눌림)'] : pass >= 0.2 * Z.grss ? ['warn', '조금 눌려요 (' + f1(pass) + ' dB)'] : ['bad', '눌려요 (' + f1(pass) + ' dB)'];
      read.innerHTML = '<h4>지금 상태 <small>최근 3초 · 교육용 근사</small></h4>' +
        '<div class="sim-row"><span>GR 최대 / 출렁임</span><b class="' + grq[0] + '">' + (S.on ? f1(gr) + ' dB / ' + f1(S.swing || 0) + ' dB · ' : '') + grq[1] + '</b></div>' +
        '<div class="sim-row"><span>입력 피크 → 출력 피크</span><b>' + fmt(S.maxIn) + ' → ' + fmt(S.maxOut) + ' dBFS</b></div>' +
        '<div class="sim-row"><span>출력 − 입력(피크)</span><b class="' + (Math.abs(diff) <= 1.5 ? 'ok' : 'warn') + '">' + (diff >= 0 ? '+' : '') + f1(diff) + ' dB</b></div>' +
        '<div class="sim-row"><span>자음(첫 10 ms)</span><b class="' + ps[0] + '">' + ps[1] + '</b></div>' +
        '<div class="sim-row"><span>펌핑</span><b class="' + pm[0] + '">' + (S.on ? pm[1] : '—') + '</b></div>' +
        '<div class="sim-row"><span>조용한 순간 이득</span><b class="' + (!S.on || S.makeup < 6 ? 'ok' : S.makeup < 10 ? 'warn' : 'bad') + '">' + (S.on ? '+' + f1(S.makeup) + ' dB → 피드백 여유 ' + (S.makeup ? '−' + f1(S.makeup) : '0') + ' dB' : '0 dB') + '</b></div>' +
        '<p class="sim-note">조용한 순간에는 GR 이 0 이라 Makeup 만큼 그대로 커져요. 스피커 소리가 마이크로 돌아가는 양도 같이 커져요.</p>';
    }
    /* --- 그리기 */
    function prep(cv, h) { var w = cv.parentNode.clientWidth || 300; if (h === 'sq') h = Math.min(w, 300); cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); return { x: x, w: w, h: h }; }
    var G = {};
    function size() { G.curve = prep(cvs.curve, 'sq'); G.hist = prep(cvs.hist, 130); G.zoom = prep(cvs.zoom, 130); drawCurve(); drawHist(); drawZoom(); }
    function axisTxt(c, s, x, y, al) { c.fillStyle = '#64748b'; c.font = '10px sans-serif'; c.textAlign = al || 'center'; c.fillText(s, x, y); }
    function drawCurve(L) {
      var g = G.curve; if (!g) return; var c = g.x, w = g.w, h = g.h, l = 34, r = w - 8, tp = 10, bt = h - 22;
      var fx = function (d) { return l + (clamp(d, -60, 0) + 60) / 60 * (r - l); }, fy = function (d) { return bt - (clamp(d, -60, 10) + 60) / 70 * (bt - tp); };
      c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#e2e8f0'; c.lineWidth = 1; for (var d = -60; d <= 0; d += 10) { c.beginPath(); c.moveTo(fx(d), tp); c.lineTo(fx(d), bt); c.stroke(); axisTxt(c, d, fx(d), bt + 13); }
      for (d = -60; d <= 10; d += 10) { c.beginPath(); c.moveTo(l, fy(d)); c.lineTo(r, fy(d)); c.stroke(); axisTxt(c, d, l - 4, fy(d) + 3, 'right'); }
      c.setLineDash([4, 4]); c.strokeStyle = '#94a3b8'; c.beginPath(); c.moveTo(fx(-60), fy(-60)); c.lineTo(fx(0), fy(0)); c.stroke();
      c.strokeStyle = '#dc2626'; c.beginPath(); c.moveTo(fx(S.threshold), tp); c.lineTo(fx(S.threshold), bt); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#dc2626'; c.font = 'bold 10px sans-serif'; c.textAlign = 'left'; c.fillText('T ' + S.threshold, Math.min(fx(S.threshold) + 3, r - 34), tp + 10);
      c.strokeStyle = S.on ? '#0e7490' : '#94a3b8'; c.lineWidth = 2.5; c.beginPath();
      for (var x = -60; x <= 0.001; x += 0.5) { var y = S.on ? curveFn(x) + S.makeup : x; if (x === -60) c.moveTo(fx(x), fy(y)); else c.lineTo(fx(x), fy(y)); } c.stroke();
      S.trail.forEach(function (p, i) { if (p[0] < -60) return; c.fillStyle = 'rgba(234,88,12,' + (0.08 + i / S.trail.length * 0.4) + ')'; c.beginPath(); c.arc(fx(p[0]), fy(p[1]), 3, 0, 6.3); c.fill(); });
      if (L && L.inDb > -60) { c.fillStyle = '#ea580c'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(fx(L.inDb), fy(L.outDb), 6, 0, 6.3); c.fill(); c.stroke(); }
      axisTxt(c, '입력 dBFS →', r, bt - 4, 'right'); axisTxt(c, '↑ 출력 dBFS', l + 6, tp + 38, 'left');
      c.fillStyle = '#0f2747'; c.font = 'bold 11px sans-serif'; c.textAlign = 'left'; c.fillText(S.on ? S.ratio + ':1' + (S.knee ? ' · Knee ' + S.knee : '') + (S.makeup ? ' · +' + f1(S.makeup) : '') : 'COMP OFF', l + 6, tp + 24);
    }
    function drawHist() {
      var g = G.hist; if (!g) return; var c = g.x, w = g.w, h = g.h, l = 30, r = w - 6, tp = 8, bt = h - 16, tn = S.at;
      var fx = function (tt) { return r - (tn - tt) / 6 * (r - l); }, fy = function (d) { return tp + (-clamp(d, -50, 0)) / 50 * (bt - tp); }, fg = function (gr) { return tp + clamp(gr, 0, 24) / 24 * (bt - tp) * 0.7; };
      c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#e2e8f0'; c.lineWidth = 1; [0, -10, -20, -30, -40, -50].forEach(function (d) { c.beginPath(); c.moveTo(l, fy(d)); c.lineTo(r, fy(d)); c.stroke(); axisTxt(c, d, l - 4, fy(d) + 3, 'right'); });
      c.setLineDash([4, 4]); c.strokeStyle = '#dc2626'; c.beginPath(); c.moveTo(l, fy(S.threshold)); c.lineTo(r, fy(S.threshold)); c.stroke(); c.setLineDash([]);
      var H = S.hist; if (H.length > 1) {
        c.fillStyle = 'rgba(234,88,12,0.35)'; c.beginPath(); c.moveTo(fx(H[0].t), tp); H.forEach(function (p) { c.lineTo(fx(p.t), fg(p.gr)); }); c.lineTo(fx(H[H.length - 1].t), tp); c.closePath(); c.fill();
        [['inDb', '#94a3b8', 1.5], ['outDb', '#0e7490', 2]].forEach(function (k) { c.strokeStyle = k[1]; c.lineWidth = k[2]; c.beginPath(); H.forEach(function (p, i) { var y = fy(p[k[0]]); if (i) c.lineTo(fx(p.t), y); else c.moveTo(fx(p.t), y); }); c.stroke(); });
      }
      axisTxt(c, '−6초', l + 10, h - 4); axisTxt(c, '지금', r - 10, h - 4);
    }
    function drawZoom() {
      var g = G.zoom; if (!g) return; var c = g.x, w = g.w, h = g.h, l = 30, r = w - 6, tp = 8, bt = h - 18;
      var fx = function (s) { return l + s / 0.3 * (r - l); }, fy = function (d) { return tp + (6 - clamp(d, -36, 6)) / 42 * (bt - tp); };
      c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(245,158,11,0.22)'; c.fillRect(fx(0.04), tp, fx(0.05) - fx(0.04), bt - tp);
      c.strokeStyle = '#e2e8f0'; [0, -12, -24, -36].forEach(function (d) { c.beginPath(); c.moveTo(l, fy(d)); c.lineTo(r, fy(d)); c.stroke(); axisTxt(c, d, l - 4, fy(d) + 3, 'right'); });
      [0, 100, 200, 300].forEach(function (ms) { axisTxt(c, ms + 'ms', clamp(fx(ms / 1000), l + 12, r - 16), h - 4); });
      [[1, '#94a3b8', 1.5], [2, '#0e7490', 2.4]].forEach(function (k) { c.strokeStyle = k[1]; c.lineWidth = k[2]; c.beginPath(); Z.pts.forEach(function (p, i) { if (i % 2) return; var y = fy(p[k[0]]); if (i) c.lineTo(fx(p[0]), y); else c.moveTo(fx(p[0]), y); }); c.stroke(); });
      c.fillStyle = '#0f2747'; c.font = 'bold 10px sans-serif'; c.textAlign = 'right'; c.fillText('Attack ' + S.attack + ' ms · Release ' + S.release + ' ms', r - 2, tp + 10);
    }
    /* --- 입력 */
    function onInput(e) {
      var k = e.target.getAttribute('data-k'); if (!k) return; var c = CTRL.find(function (x) { return x[0] === k; }), v = +e.target.value;
      S[k] = c[6] ? c[6][v] : v; changed();
    }
    el.addEventListener('input', onInput);
    el.addEventListener('change', function (e) { if (e.target.getAttribute('data-sim') === 'on') { S.on = e.target.checked; changed(); } });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var k = b.getAttribute('data-sim');
      if (k === 'play') { if (S.audio) { stopAudio(); b.textContent = '🔊 소리 켜기'; b.classList.remove('on'); } else { startAudio(); if (S.audio) { b.textContent = '🔇 소리 끄기'; b.classList.add('on'); } } }
      if (k === 'reset') { Object.keys(DEF).forEach(function (x) { S[x] = DEF[x]; }); S.sawFast = false; changed(); }
    });
    var lastW = -1, ro = window.ResizeObserver ? new ResizeObserver(function (en) { var w = Math.round(en[0].contentRect.width); if (w === lastW) return; lastW = w; requestAnimationFrame(function () { if (alive) size(); }); }) : null; if (ro) ro.observe(el.querySelector('.sim-cmp')); else window.addEventListener('resize', size);
    syncUi(); size();
    $('[data-role=src]').textContent = '녹음을 불러오는 중…';
    getVox(function (v) { if (!alive) return; Vx = v; $('[data-role=src]').textContent = v.synthetic ? '녹음을 불러오지 못해 가상 신호로 미터만 보여 줘요.' : '찬양 리드 보컬 녹음이 반복 재생돼요. 처음엔 소리가 꺼져 있어요.'; S.t0 = performance.now(); tick(); });
    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); clearTimeout(mkTimer); stopAudio(); if (actx && actx.close) { try { actx.close(); } catch (e) { /* noop */ } } if (ro) ro.disconnect(); else window.removeEventListener('resize', size); el.innerHTML = ''; },
      state: function () { return { on: S.on, threshold: S.threshold, ratio: S.ratio, attack: S.attack, release: S.release, knee: S.knee, makeup: S.makeup, maxGR: S.maxGR, minGR: S.minGR, swing: S.swing, maxIn: S.maxIn, maxOut: S.maxOut, span: S.span, pump: S.pump, pass: Z.pass, grss: Z.grss, sawFast: S.sawFast, audio: S.audio, ready: !!Vx, synthetic: !!(Vx && Vx.synthetic), pos: Vx ? now() : 0, done: Object.keys(S.done) }; },
      set: function (o) {
        var any = false; ['threshold', 'ratio', 'attack', 'release', 'knee', 'makeup'].forEach(function (k) { if (o[k] != null) { S[k] = +o[k]; any = true; } });
        if (o.on != null) { S.on = !!o.on; any = true; }
        if (o.seek != null && Vx) { S.lastChange = performance.now(); S.markAt = S.at; M.ch = null; if (S.audio) { stopAudio(); S.t0 = performance.now() - (o.seek - START) * 1000; startAudio(); } else S.t0 = performance.now() - (o.seek - START) * 1000; M.idx = -1; }
        if (any) changed(); return this.state();
      },
      curve: function (T, K, R) { return waCurve(T, K, R); }
    };
  }
  SIMS.compressorSim = compressorSim;

  function injectCss() {
    if (document.getElementById('sta-mod-compressor-css')) return;
    var s = document.createElement('style'); s.id = 'sta-mod-compressor-css';
    s.textContent =
      '.sim-cmp{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:12px;align-items:start}' +
      '.sim-cmp-main{display:flex;flex-direction:column;gap:10px;min-width:0}' +
      '.sim-cmp-top{display:flex;gap:10px;flex-wrap:wrap;align-items:stretch}' +
      '.sim-cmp-mtrs{display:flex;gap:6px;justify-content:center;padding:12px 8px;border-radius:var(--sta-r,12px);background:linear-gradient(180deg,#2a2f36,#1a1e24);border:1px solid #0f1215;flex:none}' +
      '.sim-cmp-mcol{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:56px;color:#e5e7eb}' +
      '.sim-cmp-mcol>b{font-size:.74rem;font-variant-numeric:tabular-nums;color:#fde68a;min-width:40px;text-align:center}' +
      '.sim-cmp-lbl{font-size:.72rem;font-weight:800;letter-spacing:.04em;color:#cbd5e1}' +
      '.sim-cmp-meter{display:flex;flex-direction:column;gap:3px;padding:5px;border-radius:6px;background:#0b0d10;margin-left:22px}' +
      '.sim-cmp-meter span{position:relative;width:20px;height:16px;border-radius:2px;background:#1f2937}' +
      '.sim-cmp-meter span em{position:absolute;right:25px;top:1px;font-style:normal;font-size:.6rem;color:#9ca3af;white-space:nowrap;font-variant-numeric:tabular-nums}' +
      '.sim-cmp-meter span.on.g{background:#22c55e}.sim-cmp-meter span.on.y{background:#eab308}.sim-cmp-meter span.on.r{background:#ef4444}.sim-cmp-meter span.on.o{background:#f97316}' +
      '.sim-cmp-cbox{flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:4px}' +
      '.sim-cmp-cbox canvas,.sim-cmp-pbox canvas{display:block;border:1px solid var(--sta-line,#d6dee8);border-radius:10px;background:#fff;max-width:100%}' +
      '.sim-cmp-cbox small,.sim-cmp-pbox small{font-size:.72rem;color:#64748b;line-height:1.4}' +
      '.sim-cmp-plots{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}' +
      '.sim-cmp-pbox{display:flex;flex-direction:column;gap:4px;min-width:0}' +
      '.sim-cmp-rng{margin-bottom:6px}.sim-cmp-rng b{font-variant-numeric:tabular-nums;color:#0e7490}' +
      '@media (max-width:860px){.sim-cmp{grid-template-columns:minmax(0,1fr)}}' +
      '@media (max-width:520px){.sim-cmp-mtrs{width:100%}.sim-cmp-mcol{min-width:50px}}';
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ 모듈 데이터 */
  var MG_OM = 'https://usa.yamaha.com/files/download/other_assets/8/1506928/mg16x_en_om_a0.pdf',
    MG_TS = 'https://usa.yamaha.com/files/download/other_assets/6/1525326/mg12x_en_ts_a0.pdf';
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES.compressor = {
    id: 'compressor', path: 'mixing', no: 4, status: 'ready', level: '중급', minutes: 40, thumb: 'comp',
    title: 'Compressor', sub: '음량 편차를 고르게',
    prereq: ['signal-flow'],
    overview: {
      lead: '컴프레서는 소리가 정해 둔 크기(<b>Threshold</b>)를 넘으면, 넘은 만큼을 정해 둔 비율(<b>Ratio</b>)로 줄여서 큰 소리와 작은 소리의 차이(<b>다이내믹 레인지</b>)를 좁혀 주는 장치예요. 줄어든 만큼은 <b>Makeup Gain</b> 으로 다시 올려, 작은 소리는 잘 들리고 큰 소리는 튀지 않게 만들어요.',
      terms: [
        ['다이내믹 레인지', '가장 작은 소리와 가장 큰 소리의 크기 차이(dB)예요. 조용히 부르다 후렴에서 크게 부르면 이 차이가 커져요.'],
        ['Threshold (스레숄드)', '컴프레서가 일하기 시작하는 기준 크기예요. 이 선을 넘는 큰 부분만 줄여요.'],
        ['Ratio (레이쇼·비율)', 'Threshold 를 넘은 양을 얼마나 줄일지 정해요. 4:1 이면 넘은 4 dB 가 1 dB 로 줄어요.'],
        ['Attack (어택)', '소리가 Threshold 를 넘은 뒤 얼마나 빨리 줄이는지예요. 너무 빠르면 자음의 앞부분까지 눌려요.'],
        ['Release (릴리스)', '소리가 Threshold 아래로 내려간 뒤 원래 크기로 돌아오는 데 걸리는 시간이에요.'],
        ['Knee (니)', 'Threshold 근처에서 줄이기 시작하는 모양이에요. Hard 는 딱 꺾이고, Soft 는 서서히 부드럽게 시작해요.'],
        ['Gain Reduction (GR)', '컴프레서가 지금 몇 dB 를 줄이고 있는지예요. GR 미터로 확인해요.'],
        ['Makeup Gain (출력 게인)', '줄어든 만큼 출력 전체를 다시 올리는 양이에요. CL5 에서는 OUT GAIN 이라고 해요.']
      ],
      points: [
        '컴프레서는 <b>큰 부분만 줄여</b> 음량 차이를 좁히고, 줄어든 만큼 <b>Makeup</b> 으로 전체를 다시 올려요.',
        '보컬·설교의 출발점: <b>Ratio 2:1–4:1</b>, 큰 부분에서 <b>GR 3–6 dB</b> 정도. 그다음 귀로 듣고 조절해요.',
        '너무 세게 걸면 소리가 출렁이고(펌핑), 조용한 순간이 커져 <b>피드백이 쉬워져요.</b> MG12XU 설명서도 이 점을 주의하라고 해요. (제조사 자료)'
      ],
      model: 'compCurve'
    },
    theory: [
      { title: '다이내믹 레인지와 컴프레서의 역할', visual: 'compDynamics',
        body: '찬양 인도자는 조용한 절에서는 작게, 후렴에서는 크게 불러요. 페이더 하나로 맞추면, 절에 맞추면 후렴이 너무 크고 후렴에 맞추면 절이 묻혀요. 컴프레서는 <b>Threshold 를 넘는 큰 부분만 자동으로 눌러</b> 그 차이를 줄여요. 차이가 줄면 전체를 조금 올려도 큰 부분이 튀지 않아서, 작은 부분까지 잘 들리게 돼요.',
        more: '<ul><li>컴프레서는 「아주 빠르게 움직이는 자동 페이더」라고 생각하면 쉬워요. 사람 손보다 훨씬 빨리(수 ms ~ 수백 ms) 반응해요.</li><li><b>리미터</b>는 Ratio 가 아주 큰(10:1 이상, ∞:1) 컴프레서예요. 소리가 넘지 말아야 할 천장을 지키는 데 써요.</li><li>컴프레서는 GAIN 이 잘못 맞춰진 것이나 마이크가 입에서 멀어진 것을 대신 고쳐 주지 못해요. Gain Structure 와 마이크 거리가 먼저예요.</li><li>그림의 레벨 변화는 이해를 돕기 위해 계산으로 만든 <b>예시</b>예요.</li></ul>',
        check: { q: '컴프레서가 하는 일로 알맞은 것은?', options: [
          { t: '큰 부분을 줄여 큰 소리와 작은 소리의 차이를 줄인다', ok: true, why: '맞아요. Threshold 를 넘는 부분만 줄여 다이내믹 레인지를 좁혀요.' },
          { t: '모든 소리를 똑같이 키운다', why: '모든 소리를 똑같이 키우는 것은 GAIN·페이더의 일이에요.' },
          { t: '특정 주파수(음색)만 줄인다', why: '주파수별 조절은 EQ 의 일이에요. 컴프레서는 크기를 다뤄요.' }] } },
      { title: 'Threshold 와 Ratio — 전달 곡선 읽기', visual: 'compCurve',
        body: '전달 곡선은 <b>가로축이 입력, 세로축이 출력</b>인 그래프예요. Threshold 아래에서는 입력 = 출력(대각선)이라 아무 일도 하지 않아요. Threshold 를 넘으면 선이 눕고, Ratio 가 클수록 더 많이 누워요. 계산은 <b>출력 = Threshold + (입력 − Threshold) ÷ Ratio</b> 예요. 예를 들어 Threshold −20 dB, Ratio 4:1 에서 입력이 −8 dB 이면 넘은 12 dB 가 3 dB 가 되어 출력은 −17 dB, 줄어든 양(GR)은 9 dB 예요.',
        more: '<ul><li>줄어드는 양: <b>GR = (입력 − Threshold) × (1 − 1/Ratio)</b>. 2:1 이면 넘은 양의 절반, 4:1 이면 3/4 을 줄여요.</li><li>Ratio 1:1 은 아무것도 줄이지 않아요. ∞:1 은 Threshold 를 넘지 않게 막는 리미터예요.</li><li><b>Knee</b>: Hard knee 는 Threshold 에서 딱 꺾이고, Soft knee 는 Threshold 근처 몇 dB 에서 서서히 꺾여 더 자연스럽게 들려요. CL5 의 KNEE 는 Hard 와 1–5 단계가 있고, 숫자가 클수록 부드러워요. (제조사 자료)</li><li>그림의 선은 위 공식으로 계산했어요(Threshold −20 dB 예시).</li></ul>',
        check: { q: 'Threshold −20 dB, Ratio 4:1 일 때 입력이 −12 dB 이면 출력은?', options: [
          { t: '−18 dB', ok: true, why: '맞아요. 넘은 8 dB 가 4:1 로 2 dB 가 되어 −20 + 2 = −18 dB 예요.' },
          { t: '−12 dB (그대로)', why: 'Threshold(−20 dB)를 넘었으니 넘은 부분이 줄어들어요.' },
          { t: '−20 dB', why: 'Threshold 에 딱 붙는 것은 ∞:1(리미터)일 때예요.' }] } },
      { title: 'Attack 과 Release — 얼마나 빨리 누르고 놓을까', visual: 'compTime',
        body: '<b>Attack</b> 은 큰 소리가 들어왔을 때 줄이기 시작하는 빠르기, <b>Release</b> 는 소리가 작아진 뒤 원래대로 놓아주는 빠르기예요. Attack 이 너무 빠르면 「ㅅ·ㅊ·ㅌ·ㅋ」 같은 자음의 앞부분까지 눌려 말이 뭉개지고 답답해져요. 조금 느리게(약 10–30 ms) 두면 앞부분은 지나가고 뒤쪽 큰 부분만 눌러 또렷해요. Release 가 너무 짧으면 소리가 떨리듯 출렁이고, 너무 길면 다음 작은 소리까지 눌린 채로 남아요.',
        more: '<ul><li><b>MG12XU COMP</b>: Attack 약 25 ms, Release 약 300 ms 로 정해져 있어 따로 바꿀 수 없어요. (제조사 자료)</li><li><b>CL5 채널 컴프레서</b>: ATTACK 0–120 ms, RELEASE 5 ms–42.3 s(48 kHz 기준)에서 고를 수 있어요. (제조사 자료)</li><li>음절이 촘촘한 빠른 곡은 Release 를 조금 짧게, 느린 곡은 조금 길게 두면 자연스러워요.</li><li>그림은 1차 지연(지수 곡선)으로 계산한 <b>교육용 근사</b>예요. 실제 컴프레서마다 움직이는 모양이 조금씩 달라요.</li></ul>',
        check: { q: '컴프를 건 뒤 보컬의 자음이 뭉개지고 답답하게 들려요. Attack 을 어떻게 바꿔 볼까요?', options: [
          { t: '조금 느리게(길게) 한다', ok: true, why: '맞아요. 자음의 앞부분이 눌리기 전에 지나가서 또렷해져요.' },
          { t: '0 ms 로 가장 빠르게 한다', why: '가장 빠르면 앞부분까지 눌려 더 답답해져요.' },
          { t: 'Attack 은 음색과 상관없다', why: 'Attack 은 소리의 앞부분을 얼마나 누를지 정해서 음색에 큰 영향을 줘요.' }] } },
      { title: 'Gain Reduction 미터와 Makeup Gain', visual: 'compGR',
        body: '<b>GR 미터</b>는 위에서 아래로 켜지며 지금 몇 dB 를 줄이고 있는지 보여 줘요. 큰 부분을 줄인 만큼 소리 전체가 작아지니, <b>Makeup Gain</b> 으로 다시 올려 원래 크기 근처로 맞춰요. 컴프를 켰다 껐다 비교할 때는 두 소리의 크기를 맞춰야 해요. 크기가 다르면 큰 쪽이 더 좋게 들리는 착각이 생기기 때문이에요.',
        more: '<ul><li><b>CL5</b>: OUT GAIN 으로 Makeup 을 0.0 ~ +18.0 dB 범위에서 직접 맞춰요. (제조사 자료)</li><li><b>MG12XU</b>: COMP 노브를 오른쪽으로 돌리면 출력 게인도 0 ~ +7 dB 범위에서 함께 올라가요. 따로 Makeup 노브는 없어요. (제조사 자료)</li><li>소리가 날 때 GR 미터가 쉬지 않고 계속 켜져 있다면 Threshold 가 너무 낮은 거예요. 큰 부분에서만 움직이는 것이 보통이에요.</li><li>그림의 미터 값은 <b>예시</b>예요.</li></ul>',
        check: { q: '컴프레서를 걸었더니 보컬이 전체적으로 작아졌어요. 무엇으로 맞출까요?', options: [
          { t: 'Makeup Gain(출력 게인)을 올린다', ok: true, why: '맞아요. 줄어든 만큼 출력을 다시 올려요.' },
          { t: 'Threshold 를 더 낮춘다', why: '더 많이 줄어들어 오히려 더 작아져요.' },
          { t: 'Ratio 를 더 높인다', why: '더 세게 눌러 오히려 더 작아져요.' }] } },
      { title: '예배 보컬 음량 관리 — 말과 노래', visual: 'compWorship',
        body: '<b>설교·기도·광고</b> 같은 말은 노래보다 크기 변화가 작지만, 입과 마이크 거리가 바뀌거나 갑자기 목소리를 높일 때 튀어요. 말에는 <b>낮은 Ratio(2:1–3:1)로 가볍게</b> 걸어 자연스러움을 지켜요. <b>찬양 보컬</b>은 조용한 절과 힘찬 후렴의 차이가 커서 조금 더 걸 수 있어요(3:1–4:1, 큰 부분에서 GR 3–6 dB). 어느 쪽이든 숫자보다 귀가 먼저예요. 컴프를 켰다 껐다 하며 비교해요.',
        more: '<ul><li><b>마이크 사용이 먼저</b>예요. 입과 마이크 거리가 일정하면 컴프를 조금만 걸어도 돼요. 「마이크」 모듈의 거리 이야기를 떠올려 보세요.</li><li><b>MG12XU</b>: COMP 노브는 CH1–4 에만 있어요. 설교·보컬 마이크를 이 채널에 꽂아야 COMP 를 쓸 수 있어요. (제조사 자료)</li><li><b>CL5</b>: 입력 채널마다 다이내믹스가 두 개 있어요. DYNAMICS 1 은 Gate·Ducking·Comp·Expander, DYNAMICS 2 는 Comp·De-Esser·Compander H·Compander S 중에서 골라요. 다이내믹스 라이브러리에는 「Solo Vocal」, 「Announcer」 같은 프리셋이 있어 출발점으로 쓸 수 있어요. (제조사 자료)</li><li>그림의 설정값은 흔히 쓰는 <b>출발점 예시</b>예요. 목소리·곡·공간에 따라 달라요.</li></ul>',
        check: { q: '설교 마이크 컴프레서의 출발점으로 가장 알맞은 것은?', options: [
          { t: 'Ratio 2:1–3:1 정도로 가볍게, 큰 소리에서 몇 dB 만 줄인다', ok: true, why: '맞아요. 말은 자연스러움이 중요해서 가볍게 걸어요.' },
          { t: 'Ratio ∞:1, Threshold 를 아주 낮게 해 늘 세게 누른다', why: '말이 답답해지고, 조용한 순간이 커져 피드백에도 약해져요.' },
          { t: '말에는 컴프레서를 절대 쓰지 않는다', why: '가볍게 쓰면 갑자기 커지는 소리를 다듬는 데 도움이 돼요.' }] } },
      { title: '과도한 압축 — 펌핑과 피드백 위험', visual: 'compOver',
        body: 'Threshold 를 너무 낮추고 Ratio 를 너무 높이면 문제가 생겨요. ① 소리가 납작하고 답답해져요. ② 큰 소리가 지나갈 때마다 전체 소리가 「훅훅」 줄었다 올라오는 <b>펌핑</b>이 들려요. ③ 줄어든 만큼 Makeup 으로 올렸기 때문에, 노래가 멈춘 순간에는 잡음·주변 소리·<b>스피커에서 돌아오는 소리까지 커져요.</b> 그래서 <b>피드백 여유가 줄어</b> 하울링이 쉽게 나요. MG12XU 설명서도 「압축을 너무 높게 설정하지 마세요. 평균 출력 레벨이 높아져 피드백이 생길 수 있어요.」라고 안내해요. (제조사 자료)',
        more: '<ul><li>예: 큰 부분에서 GR 10 dB 를 걸고 Makeup 을 +10 dB 올리면, 큰 부분 크기는 그대로지만 <b>조용한 순간의 이득은 +10 dB</b> 커져요. 스피커 → 마이크 → 스피커로 도는 소리도 10 dB 커지는 셈이에요.</li><li>MG12XU 설명서의 문제 해결 표에도 「컴프레서가 너무 높게 설정되어 있지 않나요? COMP 노브로 낮추세요」라는 항목이 있어요. (제조사 자료)</li><li>고치는 순서: Threshold 를 올리고 → Ratio 를 낮추고 → 필요하면 Release 를 조금 길게. GR 미터가 늘 10 dB 넘게 켜져 있으면 너무 센 거예요.</li><li>그림의 값은 계산으로 만든 <b>교육용 근사</b>예요.</li></ul>',
        check: { q: '컴프를 세게 걸고 Makeup 으로 크기를 맞췄더니 하울링이 잘 생겨요. 가장 큰 이유는?', options: [
          { t: '조용한 순간의 이득이 커져, 스피커 소리가 마이크로 돌아가는 양도 커졌기 때문', ok: true, why: '맞아요. Makeup 으로 올린 만큼 조용할 때 전체 이득이 커져 피드백 여유가 줄어요.' },
          { t: '컴프레서가 고음만 키웠기 때문', why: '컴프레서는 주파수가 아니라 크기를 다뤄요.' },
          { t: 'Attack 이 느려서', why: 'Attack 은 앞부분을 누르는 빠르기라 이 문제의 주된 원인이 아니에요.' }] } }
    ],
    practice: {
      kind: 'compressorSim',
      lead: '실제 찬양 보컬 녹음이 컴프레서를 지나가요. Threshold·Ratio·Attack·Release·Knee·Makeup 을 움직이며 입력·GR·출력 미터와 전달 곡선 위의 점이 어떻게 움직이는지 보세요. 「소리 켜기」를 누르면 바뀐 소리를 바로 들을 수 있어요.',
      note: '소리는 브라우저의 컴프레서(Web Audio)로 실제 녹음을 처리해요. 미터의 dBFS 눈금, 펌핑·자음 판정, 「조용한 순간 이득」은 교육용 근사이고 MG12XU·CL5 의 실제 소리·수치와는 달라요. 소리를 켜지 않아도 같은 녹음의 레벨을 분석해 미터가 움직여요.',
      tasks: [
        { id: 'peak', title: '피크를 3–6 dB 줄이기', text: 'COMP ON, Ratio 2:1 이상에서 Threshold 를 내려, 노래의 큰 부분에서 GR(최근 3초 최대)이 3–6 dB 가 되게 맞추세요.' },
        { id: 'makeup', title: 'Makeup 으로 원래 크기 맞추기', text: 'GR 이 3 dB 이상 걸린 상태에서 Makeup 을 올려, 출력 피크를 입력 피크와 ±1.5 dB 안으로 맞추세요.' },
        { id: 'pump', title: '너무 센 압축 — 펌핑 확인', text: 'Ratio 를 10:1 이상으로 올리고 Threshold 를 낮춰, GR 이 12 dB 넘게 출렁이는 「펌핑: 심함」 상태를 만들어 보세요.' },
        { id: 'attack', title: 'Attack 을 바꿔 자음 살리기', text: 'GR 이 3 dB 이상 걸린 상태에서 Attack 을 2 ms 이하로 해 자음이 눌리는 것을 본 뒤, 15–40 ms 로 바꿔 「자음: 살아 있어요」를 확인하세요.' }
      ],
      links: [
        { title: 'MG12XU 기능부 설명 · COMP', text: '1~4번 채널의 원 노브 컴프레서가 콘솔 어디에 있는지 봐요.', go: { tab: 'tab6', sec: 'comp' } },
        { title: 'MG12XU 실습 · 오디오 테스트', text: '실제 콘솔 화면에서 보컬 채널의 COMP 노브를 돌려 소리가 어떻게 바뀌는지 들어 봐요.', go: { tab: 'tab6', audio: true } }
      ]
    },
    quiz: [
      { q: 'Threshold −18 dB, Ratio 4:1 에서 입력이 −6 dB 일 때 줄어드는 양(GR)은?', options: [
        { t: '3 dB', why: '3 dB 는 줄어든 뒤 Threshold 위에 남는 양이에요. 넘은 12 dB 중 9 dB 가 줄어요.' },
        { t: '9 dB', ok: true, why: '맞아요. 넘은 12 dB × (1 − 1/4) = 9 dB 를 줄여 출력은 −15 dB 예요.' },
        { t: '12 dB', why: '12 dB 를 모두 줄이는 것은 ∞:1(리미터)일 때예요.' }] },
      { q: '노래하는 동안 GR 미터가 쉬지 않고 10 dB 넘게 켜져 있고 소리가 답답해요. 먼저 할 일은?', options: [
        { t: 'Makeup 을 더 올린다', why: '크기만 커지고 답답함은 그대로예요. 피드백 여유도 줄어요.' },
        { t: 'Threshold 를 올리거나 Ratio 를 낮춰 덜 누른다', ok: true, why: '맞아요. 큰 부분에서만 몇 dB 줄이도록 압축을 줄여요.' },
        { t: 'Attack 을 0 ms 로 한다', why: '앞부분까지 눌러 더 답답해져요.' }] },
      { q: 'MG12XU 의 COMP 노브를 오른쪽으로 돌리면 어떻게 될까요?', options: [
        { t: 'Threshold·Ratio·출력 게인이 함께 바뀌어 압축이 세지고 출력도 보정된다', ok: true, why: '맞아요. 제조사 설명서: 노브 하나로 Threshold(+22 ~ −8 dBu)·Ratio(1:1 ~ 4:1)·출력 게인(0 ~ +7 dB)이 함께 바뀌어요.' },
        { t: 'Attack 시간만 짧아진다', why: 'MG12XU COMP 의 Attack(약 25 ms)·Release(약 300 ms)는 고정이에요.' },
        { t: '고음(EQ HIGH)이 올라간다', why: 'COMP 는 음색이 아니라 크기를 다뤄요.' }] },
      { q: 'Makeup Gain 을 쓰는 이유로 알맞은 것은?', options: [
        { t: '피크를 더 많이 줄이려고', why: '피크를 줄이는 것은 Threshold·Ratio 의 일이에요.' },
        { t: '피드백을 줄이려고', why: '오히려 조용한 순간의 이득이 커져 피드백 여유가 줄어요.' },
        { t: '압축으로 줄어든 만큼 전체 크기를 되돌리려고', ok: true, why: '맞아요. 줄어든 만큼 출력을 다시 올려 원래 크기 근처로 맞춰요.' }] },
      { q: '「펌핑」이란 어떤 현상일까요?', options: [
        { t: '큰 소리가 올 때마다 전체 소리가 눈에 띄게 줄었다 다시 올라오는 출렁임', ok: true, why: '맞아요. Threshold 가 너무 낮고 Ratio 가 너무 높을 때 잘 생겨요.' },
        { t: '마이크를 입에 가까이 대면 저음이 커지는 현상', why: '그것은 근접 효과예요.' },
        { t: '디지털 미터가 0 dBFS 를 넘어 잘리는 현상', why: '그것은 클리핑이에요.' }] }
    ],
    missions: [
      { title: 'Ear Training · 볼륨 변화 트레이닝', text: '몇 dB 바뀌었는지 귀로 맞히는 연습이에요. GR 3 dB 와 6 dB 의 차이를 귀로 구분하는 힘이 길러져요.', go: { tab: 'tab3' } },
      { title: 'CL5 콘솔 트레이닝 · 예배 식순', text: '식순에 맞춰 설교 마이크와 찬양 보컬 채널을 바꿔 켜는 연습이에요. 말과 노래에 컴프를 다르게 거는 이유를 떠올리며 해 보세요.', go: { tab: 'tab5' } }
    ],
    deeper: [
      { title: '리미터와 시스템 보호', text: 'Ratio 가 아주 큰(10:1 이상, ∞:1) 컴프레서를 리미터라고 해요. 갑작스러운 큰 소리가 앰프·스피커의 한계를 넘지 않게 지키는 데 써요.', more: '리미터는 소리를 만드는 도구라기보다 사고를 막는 안전장치예요. 리미터가 늘 동작하고 있다면 앞 단계의 레벨이 너무 큰 거예요. Gain Structure 부터 다시 확인하세요.' },
      { title: '디에서 (De-Esser)', text: '「ㅅ·ㅆ」 같은 치찰음이 귀를 찌를 때, 그 고음 대역만 감지해 순간적으로 줄이는 컴프레서예요. CL5 의 DYNAMICS 2 에서 고를 수 있어요. (제조사 자료)', more: 'EQ 로 고음을 늘 깎으면 평소 음색까지 어두워지지만, 디에서는 치찰음이 나올 때만 줄여 평소 음색을 지켜요.' },
      { title: '컴프레서 앞의 저음 정리', text: '불필요한 저음(무대 울림, 마이크 잡는 소리)이 많으면 그 저음 때문에 컴프가 자주 동작해요. HPF 로 불필요한 저음을 먼저 정리하면 컴프가 목소리에만 반응해요.', more: '「EQ」 모듈의 HPF 이야기와 함께 보세요. 저음을 크게 올리는 EQ 도 컴프를 더 자주 동작하게 만들어요.' }
    ],
    sources: [
      { t: 'Yamaha MG20XU/MG16XU/MG12XU 사용설명서(제조사) — COMP·AUX/FX·피드백 주의·문제 해결', url: MG_OM },
      { t: 'Yamaha MG12XU 기술 사양(제조사) — COMP CH1–4: Threshold +22 ~ −8 dBu, Ratio 1:1 ~ 4:1, 출력 0 ~ +7 dB, Attack 약 25 ms, Release 약 300 ms', url: MG_TS },
      { t: 'Yamaha — The intelligent 1-Knob-Compressor', url: 'https://uk.yamaha.com/en/news_events/2016/20160807_edu01_uk.html' },
      { t: 'Yamaha CL5 레퍼런스 매뉴얼 — Mixer Basic Parameters(DYNAMICS 1·2 종류)', url: 'https://manualslib.mx/manual/582/Yamaha-Cl5.html?page=334' },
      { t: 'Yamaha CL5 레퍼런스 매뉴얼 — Dynamics Library(Solo Vocal·Announcer, 파라미터 이름)', url: 'https://manualslib.mx/manual/205/Yamaha-Cl5.html?page=257' },
      { t: 'Yamaha CL/QL 레퍼런스 매뉴얼 — COMPRESSOR 파라미터 범위(QL5 판)', url: 'https://manualslib.mx/manual/431/Yamaha-Ql5.html?page=268' },
      { t: 'W3C Web Audio API — DynamicsCompressorNode(실습 소리 처리)', url: 'https://www.w3.org/TR/webaudio/#DynamicsCompressorNode' }
    ]
  };
})();
