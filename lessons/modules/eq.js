/* =============================================================================
   학습 모듈: EQ — 주파수별로 음색을 다듬기 (믹싱 스킬 02)
   - 모듈 데이터: window.STA_MODULES.eq
   - 그림: STAVisuals.eqOverview / eqWave / eqRanges / eqHpf / eqQ / eqBoostCut / eqChannels
     (EQ 곡선은 모두 바이쿼드 공식(RBJ Audio EQ Cookbook = Web Audio BiquadFilterNode 와 같은 식)으로 계산)
   - 실습: STASims.eqParam — 실제 보컬 녹음(leadVox)에 HPF + 4밴드 PEQ(BiquadFilterNode)를 실시간으로 걸고,
     주파수 응답 곡선과 스펙트럼(AnalyserNode)을 그림. 소리를 끈 상태에서는 녹음을 미리 분석한 스펙트럼으로 같은 그림을 그림.
   - 장비 수치: MG12XU 사양서, CL5 사양·레퍼런스 매뉴얼(제조사 자료). 모델링 값은 「교육용 근사」로 표시.
   ============================================================================= */
(function () {
  'use strict';
  var C = { ink: '#0f2747', sub: '#5b6b80', line: '#cbd5e1', teal: '#0e7490', cyan: '#22d3ee', blue: '#2563eb', red: '#dc2626', amber: '#f59e0b', green: '#16a34a', violet: '#7c3aed', bg: '#f8fafc' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + s + '</text>'; }
  function fmtHz(f) { return f >= 1000 ? (Math.round(f / 10) / 100) + 'k' : String(Math.round(f)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ------------------------------------------------------------- 바이쿼드(RBJ) — Web Audio BiquadFilterNode 와 같은 공식 */
  // type: 'peaking'(Q 선형) · 'lowshelf' · 'highshelf'(S=1, Q 안 씀) · 'highpass'(qLin: 선형 Q, 기본 0.7071 = 12 dB/oct 버터워스)
  function coefs(type, f0, g, q, fs) {
    var w = 2 * Math.PI * Math.min(f0, fs * 0.499) / fs, cw = Math.cos(w), sw = Math.sin(w), A = Math.pow(10, g / 40), al, b0, b1, b2, a0, a1, a2;
    if (type === 'peaking') { al = sw / (2 * q); b0 = 1 + al * A; b1 = -2 * cw; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cw; a2 = 1 - al / A; }
    else if (type === 'lowshelf') { al = sw / 2 * Math.SQRT2; var sA = 2 * Math.sqrt(A) * al;
      b0 = A * ((A + 1) - (A - 1) * cw + sA); b1 = 2 * A * ((A - 1) - (A + 1) * cw); b2 = A * ((A + 1) - (A - 1) * cw - sA); a0 = (A + 1) + (A - 1) * cw + sA; a1 = -2 * ((A - 1) + (A + 1) * cw); a2 = (A + 1) + (A - 1) * cw - sA; }
    else if (type === 'highshelf') { al = sw / 2 * Math.SQRT2; var sB = 2 * Math.sqrt(A) * al;
      b0 = A * ((A + 1) + (A - 1) * cw + sB); b1 = -2 * A * ((A - 1) + (A + 1) * cw); b2 = A * ((A + 1) + (A - 1) * cw - sB); a0 = (A + 1) - (A - 1) * cw + sB; a1 = 2 * ((A - 1) - (A + 1) * cw); a2 = (A + 1) - (A - 1) * cw - sB; }
    else { al = sw / (2 * (q || Math.SQRT1_2)); b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
    return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
  }
  function cplx(c, f, fs) { // H(e^jw) → [re, im]
    var w = 2 * Math.PI * f / fs, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
    var nr = c[0] + c[1] * c1 + c[2] * c2, ni = -(c[1] * s1 + c[2] * s2), dr = 1 + c[3] * c1 + c[4] * c2, di = -(c[3] * s1 + c[4] * s2), d = dr * dr + di * di;
    return [(nr * dr + ni * di) / d, (ni * dr - nr * di) / d];
  }
  function magDb(c, f, fs) { var h = cplx(c, f, fs); return 10 * Math.log10(Math.max(1e-20, h[0] * h[0] + h[1] * h[1])); }
  function bandDb(type, f0, g, q, f, fs) { return magDb(coefs(type, f0, g, q, fs || 48000), f, fs || 48000); }
  function hp1Db(fc, f) { return 20 * Math.log10(f / Math.sqrt(f * f + fc * fc)); }   // 1차(−6 dB/oct) HPF, 그림용

  /* ------------------------------------------------------------- 그림 공통: 로그 주파수 축 */
  function axes(o) { // o: x0,x1,y0,y1,f0,f1,dbMin,dbMax,ticks(db list)
    var lf0 = Math.log10(o.f0), lf1 = Math.log10(o.f1);
    o.fx = function (f) { return o.x0 + (Math.log10(f) - lf0) / (lf1 - lf0) * (o.x1 - o.x0); };
    o.fy = function (db) { return o.y0 + (o.dbMax - clamp(db, o.dbMin, o.dbMax)) / (o.dbMax - o.dbMin) * (o.y1 - o.y0); };
    var fl = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].filter(function (f) { return f >= o.f0 && f <= o.f1; });
    o.grid = fl.map(function (f) { return '<path d="M' + o.fx(f).toFixed(1) + ' ' + o.y0 + 'V' + o.y1 + '" stroke="' + C.line + '"/>' + t(o.fx(f).toFixed(1), o.y1 + 15, fmtHz(f), { size: 10, fill: C.sub }); }).join('') +
      (o.ticks || []).map(function (d) { return '<path d="M' + o.x0 + ' ' + o.fy(d).toFixed(1) + 'H' + o.x1 + '" stroke="' + (d === 0 ? '#94a3b8' : C.line) + '" stroke-dasharray="' + (d === 0 ? '0' : '3 3') + '"/>' + t(o.x0 - 5, o.fy(d) + 4, (d > 0 ? '+' : '') + d, { size: 10, fill: C.sub, anchor: 'end' }); }).join('') +
      t(o.x0 - 5, o.y0 - 6, 'dB', { size: 10, fill: C.sub, anchor: 'end' }) + t(o.x0 - 13, o.y1 + 15, 'Hz', { size: 10, fill: C.sub, anchor: 'end' });
    o.path = function (fn, n) { var d = '', N = n || 220; for (var i = 0; i <= N; i++) { var f = Math.pow(10, lf0 + (lf1 - lf0) * i / N); d += (i ? 'L' : 'M') + o.fx(f).toFixed(1) + ' ' + o.fy(fn(f)).toFixed(1); } return d; };
    return o;
  }
  function curve(o, fn, col, w, dash) { return '<path d="' + o.path(fn) + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 2.5) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' stroke-linejoin="round"/>'; }

  /* ======================================================================= 그림 */
  var V = window.STAVisuals = window.STAVisuals || {};
  V.eqOverview = function () {
    var o = axes({ x0: 40, x1: 580, y0: 34, y1: 196, f0: 20, f1: 20000, dbMin: -24, dbMax: 15, ticks: [-18, -12, -6, 0, 6, 12] });
    var B = [['highpass', 90, 0, 0.7071, 'HPF', C.sub], ['lowshelf', 120, 2, 0, 'LOW', C.blue], ['peaking', 400, -5, 4, 'LOW MID', C.red], ['peaking', 3500, 3, 0.9, 'HIGH MID', C.green], ['highshelf', 10000, 2, 0, 'HIGH', C.violet]];
    function tot(f) { return B.reduce(function (a, b) { return a + bandDb(b[0], b[1], b[2], b[3], f); }, 0); }
    var dots = B.map(function (b) { var x = o.fx(b[1]), y = o.fy(b[0] === 'highpass' ? tot(b[1]) : b[2]);
      return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7" fill="#fff" stroke="' + b[5] + '" stroke-width="2.5"/>' + t((b[0] === 'highpass' ? x - 10 : x).toFixed(1), (b[2] < 0 || b[0] === 'highpass' ? y + 22 : y - 12).toFixed(1), b[4], { size: 11, fill: b[5], weight: 800, anchor: b[0] === 'highpass' ? 'end' : 'middle' }); }).join('');
    return svg(600, 220, o.grid + B.map(function (b) { return b[0] === 'highpass' ? '' : curve(o, function (f) { return bandDb(b[0], b[1], b[2], b[3], f); }, b[5], 1.2, '4 3'); }).join('') +
      '<path d="' + o.path(tot) + 'L' + o.x1 + ' ' + o.fy(0) + 'L' + o.x0 + ' ' + o.fy(0) + 'Z" fill="' + C.teal + '" fill-opacity=".08"/>' + curve(o, tot, C.teal, 3.2) + dots +
      t(o.x1, 18, 'HPF + 4밴드 PEQ (CL5 와 같은 구성 · 값은 예시, 바이쿼드 공식으로 계산)', { size: 11, fill: C.sub, anchor: 'end' }), 'HPF와 4밴드 파라메트릭 EQ 곡선 예시');
  };
  V.eqWave = function () {
    var rows = [[20, '17 m'], [100, '3.4 m'], [1000, '34 cm'], [10000, '3.4 cm'], [20000, '1.7 cm']];
    var left = t(14, 22, '파장 = 343 m/s ÷ 주파수', { size: 13, weight: 800, anchor: 'start' }) + t(14, 40, '(공기 20 °C · 막대 길이는 로그 눈금)', { size: 10, fill: C.sub, anchor: 'start' }) +
      rows.map(function (r, i) { var y = 66 + i * 34, lam = 343 / r[0], w = 20 + (Math.log10(lam) - Math.log10(0.017)) / (Math.log10(17.15) - Math.log10(0.017)) * 150;
        return t(64, y + 5, fmtHz(r[0]) + ' Hz', { size: 12, weight: 700, anchor: 'end' }) + '<rect x="74" y="' + (y - 8) + '" width="' + w.toFixed(1) + '" height="14" rx="4" fill="' + C.teal + '" fill-opacity="' + (0.95 - i * 0.15) + '"/>' + t(80 + w, y + 5, r[1], { size: 12, fill: C.ink, anchor: 'start', weight: 700 }); }).join('') +
      t(14, 236, '낮은 소리일수록 파장이 길어 잘 돌아 퍼지고 막기 어려워요.', { size: 10.5, fill: C.sub, anchor: 'start' });
    function wave(x0, y0, w, h, ph, inv, col, dash) { var d = ''; for (var i = 0; i <= 80; i++) { var x = x0 + w * i / 80, th = 2 * Math.PI * 2 * i / 80 - ph, v = Math.sin(th) * (inv ? -1 : 1); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (y0 - v * h).toFixed(1); } return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2.2"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'; }
    var P = [['같은 위상', 0, false, '합: 2배 (+6 dB)', C.green], ['90° 어긋남 (시간 차이)', Math.PI / 2, false, '합: 약 1.4배 (+3 dB)', C.amber], ['극성 반전 (Ø)', 0, true, '합: 0 — 지워짐', C.red]];
    var right = P.map(function (p, i) { var y = 54 + i * 66;
      return t(318, y - 26, p[0], { size: 12, weight: 800, anchor: 'start' }) + '<path d="M318 ' + y + 'H478" stroke="' + C.line + '"/>' + wave(318, y, 160, 16, 0, false, C.teal) + wave(318, y, 160, 16, p[1], p[2], C.amber, '5 3') +
        t(488, y + 4, p[3], { size: 11, fill: p[4], weight: 800, anchor: 'start' }); }).join('') +
      t(318, 236, '두 소리(실선·점선) 크기가 같을 때의 합 · 교육용 그림', { size: 10.5, fill: C.sub, anchor: 'start' });
    return svg(600, 246, '<path d="M300 10V236" stroke="' + C.line + '"/>' + left + right, '주파수와 파장, 위상과 극성');
  };
  V.eqRanges = function () {
    var o = axes({ x0: 20, x1: 580, y0: 30, y1: 222, f0: 20, f1: 20000, dbMin: 0, dbMax: 1, ticks: [] });
    var R = [[20, 80, '바닥 울림·손 잡는 소리·바람', '#64748b'], [85, 180, '남성 말소리 기본음', C.blue], [165, 255, '여성 말소리 기본음', C.violet], [200, 500, '웅웅·답답 (머디)', '#b45309'], [400, 900, '통 울림 (박시)', '#c2410c'],
      [800, 1500, '코맹맹이 (나잘)', C.red], [2000, 5000, '또렷함 (명료도)', C.green], [2500, 5000, '귀를 찌름 (하시)', '#be123c'], [5000, 9000, 'ㅅ·ㅆ·ㅊ 치찰음', C.teal], [10000, 20000, '공기감·숨결', '#0891b2']];
    var bars = R.map(function (r, i) { var y = 36 + i * 18.6, x0 = o.fx(r[0]), x1 = o.fx(r[1]), right = x1 > 430;
      return '<rect x="' + x0.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (x1 - x0).toFixed(1) + '" height="13" rx="4" fill="' + r[3] + '" fill-opacity=".85"/>' +
        t((right ? x0 - 6 : x1 + 6).toFixed(1), (y + 11).toFixed(1), r[2] + ' <tspan fill="' + C.sub + '" font-weight="400">' + fmtHz(r[0]) + '–' + fmtHz(r[1]) + '</tspan>', { size: 11, fill: C.ink, weight: 700, anchor: right ? 'end' : 'start' }); }).join('');
    return svg(600, 244, o.grid.replace(/>dB</, '><') + bars + t(580, 18, '목소리 기준 「대략적인 범위」 — 사람·마이크·방에 따라 달라요', { size: 11, fill: C.sub, anchor: 'end' }), '목소리의 주파수 대역과 음색 문제의 대략적인 범위');
  };
  V.eqHpf = function () {
    var o = axes({ x0: 44, x1: 580, y0: 28, y1: 190, f0: 20, f1: 2000, dbMin: -30, dbMax: 3, ticks: [0, -6, -12, -18, -24] });
    var hp80 = function (f) { return bandDb('highpass', 80, 0, Math.SQRT1_2, f); };
    var body = '<rect x="' + o.fx(85).toFixed(1) + '" y="' + o.y0 + '" width="' + (o.fx(180) - o.fx(85)).toFixed(1) + '" height="' + (o.y1 - o.y0) + '" fill="' + C.blue + '" fill-opacity=".07"/>' + t(o.fx(124), o.y1 - 8, '남성 말소리 기본음(대략)', { size: 10, fill: C.blue }) +
      curve(o, function (f) { return hp1Db(80, f); }, C.amber, 2.2, '6 4') + curve(o, function (f) { return bandDb('highpass', 150, 0, Math.SQRT1_2, f); }, C.violet, 2, '2 3') + curve(o, hp80, C.teal, 3.2) +
      [[80, '−3'], [40, '−12'], [20, '−24']].map(function (p) { var x = o.fx(p[0]), y = o.fy(hp80(p[0])); return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4" fill="' + C.teal + '"/>' + t((x + 8).toFixed(1), (y + 14).toFixed(1), p[1] + ' dB', { size: 11, fill: C.teal, weight: 800, anchor: 'start' }); }).join('') +
      '<g font-size="11">' + t(330, 70, '— 80 Hz · 12 dB/oct (MG12XU HPF)', { size: 11, fill: C.teal, weight: 800, anchor: 'start' }) + t(330, 88, '- - 80 Hz · 6 dB/oct (1차, 더 완만)', { size: 11, fill: '#b45309', weight: 700, anchor: 'start' }) + t(330, 106, '··· 150 Hz · 12 dB/oct (너무 높으면 목소리가 얇아져요)', { size: 11, fill: C.violet, weight: 700, anchor: 'start' }) + '</g>' +
      t(580, 16, 'HPF 주파수 응답 (바이쿼드·1차 필터 공식으로 계산)', { size: 11, fill: C.sub, anchor: 'end' });
    return svg(600, 210, o.grid + body, 'HPF 주파수 응답 비교');
  };
  V.eqQ = function () {
    var o = axes({ x0: 40, x1: 580, y0: 30, y1: 190, f0: 20, f1: 20000, dbMin: -6, dbMax: 15, ticks: [-6, 0, 6, 12] });
    var Q = [[0.67, '약 2옥타브', C.blue], [1.4, '약 1옥타브', C.green], [4.3, '약 1/3옥타브', C.red]];
    var body = Q.map(function (q) { return curve(o, function (f) { return bandDb('peaking', 1000, 9, q[0], f); }, q[2], 2.6); }).join('') +
      curve(o, function (f) { return bandDb('highshelf', 8000, 6, 0, f); }, C.sub, 2, '6 4') + t(o.fx(12000), o.fy(6) - 8, '하이 쉘빙 +6 dB', { size: 11, fill: C.sub, weight: 700 }) +
      Q.map(function (q, i) { return t(56, 50 + i * 17, 'Q ' + q[0] + ' — ' + q[1], { size: 11.5, fill: q[2], weight: 800, anchor: 'start' }); }).join('') +
      t(o.fx(1000), o.fy(9) - 10, '1 kHz · +9 dB', { size: 11, weight: 800 }) + t(580, 16, '피킹: 같은 주파수·게인, Q 만 다르게 (Q 값이 클수록 좁아요 · 바이쿼드 공식)', { size: 11, fill: C.sub, anchor: 'end' });
    return svg(600, 210, o.grid + body, '주파수 게인 Q 에 따른 EQ 곡선');
  };
  V.eqBoostCut = function () {
    var o = axes({ x0: 40, x1: 580, y0: 30, y1: 190, f0: 20, f1: 20000, dbMin: -24, dbMax: 9, ticks: [-18, -12, -6, 0, 6] });
    var B = [['highpass', 100, 0, Math.SQRT1_2], ['peaking', 400, -5, 5], ['peaking', 4000, 3, 0.8]];
    function tot(f) { return B.reduce(function (a, b) { return a + bandDb(b[0], b[1], b[2], b[3], f); }, 0); }
    var body = curve(o, function (f) { return bandDb('peaking', 400, -5, 5, f); }, C.red, 1.6, '4 3') + curve(o, function (f) { return bandDb('peaking', 4000, 3, 0.8, f); }, C.green, 1.6, '4 3') + curve(o, tot, C.teal, 3.2) +
      t(o.fx(400), o.fy(-5) + 20, '① 좁게 깎기: 400 Hz · −5 dB · Q 5', { size: 11, fill: C.red, weight: 800 }) + t(o.fx(4000), o.fy(3) - 10, '② 넓게 조금 올리기: 4 kHz · +3 dB · Q 0.8', { size: 11, fill: C.green, weight: 800 }) +
      t(o.fx(58) - 6, o.fy(-11), 'HPF 100 Hz', { size: 11, fill: C.teal, weight: 800, anchor: 'end' }) + t(580, 16, '보컬 EQ 「예시」 — 출발점일 뿐, 귀로 맞춰요 (바이쿼드 공식으로 계산)', { size: 11, fill: C.sub, anchor: 'end' });
    return svg(600, 210, o.grid + body, '좁게 깎고 넓게 올리는 보컬 EQ 예시');
  };
  V.eqChannels = function () {
    function box(x, y, w, h, a, b, hot) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="9" fill="' + (hot ? C.teal : C.bg) + '" stroke="' + (hot ? C.teal : C.line) + '" stroke-width="2"/>' + t(x + w / 2, y + h / 2 - 1, a, { size: 12, weight: 800, fill: hot ? '#fff' : C.ink }) + (b ? t(x + w / 2, y + h / 2 + 14, b, { size: 10, fill: hot ? '#e0f2fe' : C.sub }) : ''); }
    function arr(x1, y1, x2, y2) { return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + C.ink + '" stroke-width="1.8"/><path d="M' + (x2 - 6) + ' ' + (y2 - 4) + 'L' + x2 + ' ' + y2 + 'L' + (x2 - 6) + ' ' + (y2 + 4) + '" fill="none" stroke="' + C.ink + '" stroke-width="1.8"/>'; }
    var ch = ['보컬 마이크', '설교 마이크', '건반'].map(function (n, i) { var y = 22 + i * 38; return box(8, y, 92, 30, n) + arr(100, y + 15, 120, y + 15) + box(120, y, 110, 30, '채널 HPF·EQ', '', true) + arr(230, y + 15, 262, 60); }).join('');
    var top = ch + box(262, 40, 92, 40, 'MIX / STEREO', '버스(섞기)') + arr(354, 60, 374, 60) + box(374, 34, 110, 52, '출력 EQ', 'GEQ·PEQ', true) + arr(484, 60, 500, 60) + box(500, 40, 92, 40, '앰프·스피커', '메인·모니터') +
      t(175, 140, '마이크 하나의 음색', { size: 11, fill: C.teal, weight: 800 }) + t(429, 104, '스피커·방·피드백 보정', { size: 11, fill: C.teal, weight: 800 });
    var iso = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000];
    var gx = 120, gw = 14, base = 196;
    var geq = iso.map(function (f, i) { var g = f === 250 ? -5 : f === 2500 ? -6 : 0, x = gx + i * gw, h = g * 4;
      return '<rect x="' + x + '" y="' + (g < 0 ? base : base - 1) + '" width="' + (gw - 4) + '" height="' + Math.max(2, -h) + '" rx="2" fill="' + (g < 0 ? C.red : '#94a3b8') + '"/>' + (i % 3 === 0 ? t(x + 5, 244, fmtHz(f), { size: 8.5, fill: C.sub }) : ''); }).join('');
    return svg(600, 250, top + '<path d="M' + (gx - 4) + ' ' + base + 'H' + (gx + 31 * gw) + '" stroke="' + C.sub + '"/>' + geq + t(gx - 8, base + 4, '0 dB', { size: 10, fill: C.sub, anchor: 'end' }) +
      t(gx, 172, '31밴드 GEQ 로 피드백 주파수만 좁게 깎은 「예시」 (250 Hz −5 dB · 2.5 kHz −6 dB)', { size: 11, fill: C.red, weight: 700, anchor: 'start' }), '채널 EQ와 출력 EQ의 위치, GEQ로 피드백 줄이기 예시');
  };

  /* ======================================================================= 녹음 불러오기(공용 캐시) */
  var CACHE = window.__staStemCache = window.__staStemCache || {};
  function b64ToBuf(uri) { var b = atob(uri.slice(uri.indexOf(',') + 1)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  function loadStem(name, a, b, cb) {   // → { data: Float32Array(모노), sr, dur } 또는 null
    var key = name + ':' + a + ':' + b; if (CACHE[key]) { setTimeout(function () { cb(CACHE[key]); }, 0); return; }
    var uri = window.MG12XU_SOURCE_AUDIO_BASE64 && window.MG12XU_SOURCE_AUDIO_BASE64[name], OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, fired = false;
    function fin(v) { if (fired) return; fired = true; if (v) CACHE[key] = v; cb(v); }
    if (!uri || !OAC) { fin(null); return; }
    try {
      var oc = new OAC(1, 2, 44100);
      var pr = oc.decodeAudioData(b64ToBuf(uri), function (buf) {
        var sr = buf.sampleRate, s0 = Math.min(buf.length - 1, Math.round(a * sr)), s1 = Math.min(buf.length, Math.round(b * sr)), n = s1 - s0, out = new Float32Array(n), k, i;
        for (k = 0; k < buf.numberOfChannels; k++) { var ch = buf.getChannelData(k); for (i = 0; i < n; i++) out[i] += ch[s0 + i] / buf.numberOfChannels; }
        var fade = Math.min(n >> 1, Math.round(sr * 0.02)); for (i = 0; i < fade; i++) { var w = i / fade; out[i] *= w; out[n - 1 - i] *= w; }   // 반복 이음새 딸깍 방지
        fin({ data: out, sr: sr, dur: n / sr });
      }, function () { fin(null); });
      if (pr && pr.catch) pr.catch(function () { /* 콜백에서 처리 */ });
    } catch (e) { fin(null); }
  }

  /* ------------------------------------------------------------- FFT · 스펙트럼 (AnalyserNode 와 같은 눈금: 블랙먼 창, 1/N, dB) */
  function fft(re, im) {
    var n = re.length, i, j, k, l;
    for (i = 1, j = 0; i < n; i++) { var bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { var tr = re[i]; re[i] = re[j]; re[j] = tr; var ti = im[i]; im[i] = im[j]; im[j] = ti; } }
    for (l = 2; l <= n; l <<= 1) { var ang = -2 * Math.PI / l, wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += l) { var cr = 1, ci = 0; for (k = 0; k < l / 2; k++) { var a = i + k, b = a + l / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } }
  }
  var NB = 120, BF = [];   // 표시용 1/12옥타브 칸(20 Hz–20 kHz)
  for (var bi0 = 0; bi0 < NB; bi0++) BF.push(20 * Math.pow(1000, (bi0 + 0.5) / NB));
  function toBands(magPow, binHz, out) {   // magPow: 빈별 선형 파워(|X|²) → 칸별 dB
    var nb = magPow.length;
    for (var i = 0; i < NB; i++) {
      var lo = 20 * Math.pow(1000, i / NB) / binHz, hi = 20 * Math.pow(1000, (i + 1) / NB) / binHz, s = 0, c = 0;
      for (var k = Math.ceil(lo); k < hi && k < nb; k++) { s += magPow[k]; c++; }
      if (!c) { var kk = Math.min(nb - 1, Math.round((lo + hi) / 2)); s = magPow[kk]; c = 1; }
      out[i] = 10 * Math.log10(s / c + 1e-20);
    }
    return out;
  }
  function analyze(data, sr, hop) {   // 짧은 구간마다 스펙트럼 → [Float32Array(NB)]
    var N = 4096, win = new Float32Array(N), re = new Float32Array(N), im = new Float32Array(N), pw = new Float32Array(N / 2), frames = [], i;
    for (i = 0; i < N; i++) win[i] = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / N) + 0.08 * Math.cos(4 * Math.PI * i / N);
    var step = Math.round(hop * sr);
    for (var p = 0; p + N <= data.length; p += step) {
      for (i = 0; i < N; i++) { re[i] = data[p + i] * win[i]; im[i] = 0; }
      fft(re, im); for (i = 0; i < N / 2; i++) { var r = re[i] / N, m = im[i] / N; pw[i] = r * r + m * m; }
      frames.push(toBands(pw, sr / N, new Float32Array(NB)));
    }
    return frames;
  }

  /* ======================================================================= 실습: 파라메트릭 EQ */
  var CSS = '' +
    '.sim-eq{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:12px;align-items:start}' +
    '.sim-eq-main{display:flex;flex-direction:column;gap:10px;min-width:0}' +
    '.sim-eq-graph{position:relative;border:1px solid #1e293b;border-radius:12px;overflow:hidden;background:#0b1a2e}' +
    '.sim-eq-graph canvas{display:block;width:100%;touch-action:none;cursor:crosshair}' +
    '.sim-eq-legend{display:flex;flex-wrap:wrap;gap:4px 12px;padding:6px 10px;font-size:.72rem;color:#cbd5e1;background:#0f2238;border-top:1px solid #1e293b}' +
    '.sim-eq-legend i{display:inline-block;width:14px;height:3px;border-radius:2px;vertical-align:middle;margin-right:4px}' +
    '.sim-eq-bands{display:flex;gap:6px;flex-wrap:wrap}' +
    '.sim-eq-bands button{flex:1 1 64px;border:1px solid var(--sta-line);background:#f8fafc;border-radius:9px;padding:7px 6px;font:inherit;font-size:.78rem;font-weight:800;color:var(--sta-ink);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px}' +
    '.sim-eq-bands button small{font-weight:600;font-size:.68rem;color:#64748b;font-variant-numeric:tabular-nums}' +
    '.sim-eq-bands button[aria-pressed=true]{border-color:var(--b,#0e7490);box-shadow:inset 0 0 0 2px var(--b,#0e7490);background:#fff}' +
    '.sim-eq-bands button.off{opacity:.6}' +
    '.sim-eq-panel{border:1px solid var(--sta-line);border-radius:10px;background:#fff;padding:10px 12px;display:grid;gap:8px}' +
    '.sim-eq-panel h4{margin:0;font-size:.86rem;color:var(--sta-navy);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}' +
    '.sim-eq-panel .sim-range b{font-variant-numeric:tabular-nums}' +
    '.sim-eq-panel .sim-range input{accent-color:var(--b,#0e7490)}' +
    '.sim-eq-onbtn{width:100%;font-size:.95rem;padding:10px;border-radius:10px;border:2px solid #0e7490;background:#0e7490;color:#fff;font-weight:900;cursor:pointer;letter-spacing:.04em}' +
    '.sim-eq-onbtn.off{background:#fff;color:#64748b;border-color:#cbd5e1}' +
    '.sim-eq-hint{font-size:.74rem;color:#64748b;margin:0;line-height:1.5}' +
    '@media (max-width:860px){.sim-eq{grid-template-columns:minmax(0,1fr)}}';
  function injectCss(id, css) { if (document.getElementById(id)) return; var s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s); }

  var SEG = [20.5, 80.5];                       // 사용할 보컬 구간(초) — 노래가 있는 부분
  var PROB_LIST = [315, 400, 500, 630, 800, 1000, 1250, 2500, 3150];   // 숨은 울림 후보 (교육용)
  var PROB_G = 10, PROB_Q = 4;
  var BANDS = [
    { k: 'hpf', name: 'HPF', type: 'highpass', col: '#94a3b8' },
    { k: 'low', name: 'LOW', type: 'lowshelf', col: '#60a5fa' },
    { k: 'lm', name: 'LOW MID', type: 'peaking', col: '#f87171' },
    { k: 'hm', name: 'HIGH MID', type: 'peaking', col: '#4ade80' },
    { k: 'high', name: 'HIGH', type: 'highshelf', col: '#c084fc' }
  ];
  var INIT = { hpf: { on: false, f: 40 }, low: { f: 100, g: 0 }, lm: { f: 500, g: 0, q: 1.4 }, hm: { f: 2500, g: 0, q: 1.4 }, high: { f: 10000, g: 0 } };
  function lin2f(v) { return 20 * Math.pow(1000, v / 1000); } function f2lin(f) { return Math.round(Math.log(f / 20) / Math.log(1000) * 1000); }
  function lin2hp(v) { return 20 * Math.pow(30, v / 1000); } function hp2lin(f) { return Math.round(Math.log(f / 20) / Math.log(30) * 1000); }
  function lin2q(v) { return 0.1 * Math.pow(100, v / 1000); } function q2lin(q) { return Math.round(Math.log(q / 0.1) / Math.log(100) * 1000); }

  function eqParam(el, opts) {
    opts = opts || {};
    injectCss('sta-mod-eq-css', CSS);
    var S = { eqOn: true, sel: 'lm', prob: true, rumble: true, probF: PROB_LIST[Math.floor(Math.random() * PROB_LIST.length)], audio: false, done: {}, sawOff: 0, revealed: false, t0: performance.now() };
    Object.keys(INIT).forEach(function (k) { S[k] = JSON.parse(JSON.stringify(INIT[k])); });
    el.innerHTML =
      '<div class="sim-eq">' +
        '<div class="sim-eq-main">' +
          '<div class="sim-eq-graph"><canvas aria-label="EQ 주파수 응답 곡선과 스펙트럼. 점을 끌어 주파수와 게인을 바꿔요."></canvas>' +
            '<div class="sim-eq-legend"><span><i style="background:#22d3ee"></i>EQ 곡선(전체)</span><span><i style="background:#475569"></i>스펙트럼: 지금 소리</span><span data-role="specsrc"></span></div></div>' +
          '<div class="sim-eq-bands" role="group" aria-label="밴드 고르기">' + BANDS.map(function (b) { return '<button type="button" data-band="' + b.k + '" style="--b:' + b.col + '" aria-pressed="false">' + b.name + '<small data-bsum="' + b.k + '"></small></button>'; }).join('') + '</div>' +
          '<div class="sim-eq-panel" data-role="panel"></div>' +
        '</div>' +
        '<div class="sim-side">' +
          '<div class="sim-box"><h4>소리</h4><button type="button" class="sim-btn sim-play" data-sim="play">🔊 소리 켜기</button><p class="sim-note" data-role="src">녹음을 불러오는 중…</p></div>' +
          '<div class="sim-box"><button type="button" class="sim-eq-onbtn" data-sim="eqon" aria-pressed="true">EQ ON</button><p class="sim-eq-hint" style="margin-top:6px">눌러서 끄면(바이패스) EQ 를 걸기 전 소리를 들어요.</p></div>' +
          '<div class="sim-box"><h4>연습용 문제 상황</h4>' +
            '<label class="sim-switch"><input type="checkbox" data-sim="rumble" checked><span>바닥 울림 (아주 낮은 저음 잡음)</span></label>' +
            '<label class="sim-switch"><input type="checkbox" data-sim="prob" checked><span>숨은 울림 (어딘가 +10 dB 공진)</span></label>' +
            '<div class="sim-btns"><button type="button" class="sim-btn" data-sim="newprob">다른 문제 내기</button><button type="button" class="sim-btn" data-sim="reset">EQ 모두 0 으로</button></div></div>' +
          '<div class="sim-box sim-read" data-role="read"></div>' +
        '</div>' +
      '</div>';
    var cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), read = el.querySelector('[data-role=read]'), panel = el.querySelector('[data-role=panel]');
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = 600, H = 300, alive = true, raf = 0;
    var stem = null, frames = null, rumSpec = null, actx = null, N = null, liveSpec = new Float32Array(NB), dispSpec = new Float32Array(NB), haveDisp = false;
    function fsNow() { return actx ? actx.sampleRate : 48000; }

    /* ---------- 응답 계산 */
    function bandList(st) {   // 현재 사용자 EQ 의 바이쿼드 목록
      st = st || S; var L = [];
      if (st.hpf.on) L.push(['highpass', st.hpf.f, 0, Math.SQRT1_2]);
      L.push(['lowshelf', st.low.f, st.low.g, 0], ['peaking', st.lm.f, st.lm.g, st.lm.q], ['peaking', st.hm.f, st.hm.g, st.hm.q], ['highshelf', st.high.f, st.high.g, 0]);
      return L;
    }
    function eqDb(f, st) { var fs = fsNow(); return bandList(st).reduce(function (a, b) { return a + (b[0] !== 'highpass' && Math.abs(b[2]) < 1e-6 ? 0 : bandDb(b[0], b[1], b[2], b[3], f, fs)); }, 0); }
    function probDb(f) { return S.prob ? bandDb('peaking', S.probF, PROB_G, PROB_Q, f, fsNow()) : 0; }
    function oneDb(k, f) { var b = S[k], fs = fsNow(); if (k === 'hpf') return b.on ? bandDb('highpass', b.f, 0, Math.SQRT1_2, f, fs) : 0; return bandDb(k === 'low' ? 'lowshelf' : k === 'high' ? 'highshelf' : 'peaking', b.f, b.g, b.q || 0, f, fs); }

    /* ---------- 그리기 */
    var PL = 34, PR = 10, PT = 12, PB = 22;
    function fx(f) { return PL + Math.log(f / 20) / Math.log(1000) * (W - PL - PR); }
    function xf(x) { return 20 * Math.pow(1000, clamp((x - PL) / (W - PL - PR), 0, 1)); }
    function gy(db) { return PT + (20 - db) / 40 * (H - PT - PB); }
    function yg(y) { return 20 - (y - PT) / (H - PT - PB) * 40; }
    function sy(db) { return PT + (-10 - db) / 110 * (H - PT - PB); }   // 스펙트럼: −10 ~ −120 dB(상대 눈금)
    function size() { W = Math.max(280, cv.parentNode.clientWidth || 600); H = Math.round(clamp(W * 0.48, 210, 330)); cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); draw(); }
    function handlePos(k) { var b = S[k]; if (k === 'hpf') return { x: fx(b.f), y: gy(b.on ? eqDb(b.f) : 0) }; return { x: fx(b.f), y: gy(b.g) }; }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0b1a2e'; ctx.fillRect(0, 0, W, H);
      ctx.font = '10px sans-serif'; ctx.lineWidth = 1;
      [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].forEach(function (f) { var x = Math.round(fx(f)) + 0.5; ctx.strokeStyle = '#1c3350'; ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, H - PB); ctx.stroke(); ctx.fillStyle = '#7f93ab'; ctx.textAlign = 'center'; ctx.fillText(fmtHz(f), x, H - 7); });
      [-18, -12, -6, 0, 6, 12, 18].forEach(function (d) { var y = Math.round(gy(d)) + 0.5; ctx.strokeStyle = d === 0 ? '#3b5878' : '#162b45'; ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke(); ctx.fillStyle = '#7f93ab'; ctx.textAlign = 'right'; ctx.fillText((d > 0 ? '+' : '') + d, PL - 4, y + 3); });
      // 스펙트럼
      if (haveDisp) {
        ctx.beginPath(); ctx.moveTo(fx(BF[0]), H - PB);
        for (var i = 0; i < NB; i++) ctx.lineTo(fx(BF[i]), clamp(sy(dispSpec[i]), PT, H - PB));
        ctx.lineTo(fx(BF[NB - 1]), H - PB); ctx.closePath(); ctx.fillStyle = 'rgba(148,163,184,0.28)'; ctx.fill(); ctx.strokeStyle = 'rgba(203,213,225,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
      }
      if (S.revealed && S.prob) { var px = fx(S.probF); ctx.strokeStyle = '#fbbf24'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(px, PT); ctx.lineTo(px, H - PB); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'left'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('숨은 울림 ' + fmtHz(S.probF) + ' Hz', Math.min(px + 4, W - 110), PT + 12); }
      // 밴드별 곡선(얇게) + 전체 곡선
      var M = Math.max(120, Math.round(W / 3));
      BANDS.forEach(function (b) { if (b.k === 'hpf' && !S.hpf.on) return; if (b.k !== 'hpf' && Math.abs(S[b.k].g) < 0.05) return; ctx.beginPath(); for (var j = 0; j <= M; j++) { var f = 20 * Math.pow(1000, j / M), y = gy(oneDb(b.k, f)); if (j) ctx.lineTo(fx(f), y); else ctx.moveTo(fx(f), y); } ctx.strokeStyle = b.col; ctx.globalAlpha = S.sel === b.k ? 0.9 : 0.45; ctx.lineWidth = 1.3; ctx.stroke(); ctx.globalAlpha = 1; });
      ctx.beginPath(); for (var j2 = 0; j2 <= M; j2++) { var f2 = 20 * Math.pow(1000, j2 / M), y2 = gy(eqDb(f2)); if (j2) ctx.lineTo(fx(f2), clamp(y2, PT - 4, H - PB + 4)); else ctx.moveTo(fx(f2), y2); }
      ctx.strokeStyle = S.eqOn ? '#22d3ee' : 'rgba(34,211,238,0.35)'; ctx.lineWidth = 3; ctx.setLineDash(S.eqOn ? [] : [6, 5]); ctx.stroke(); ctx.setLineDash([]);
      if (!S.eqOn) { ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('EQ OFF (바이패스) — 곡선이 적용되지 않아요', PL + 6, PT + 14); }
      // 손잡이
      BANDS.forEach(function (b) { var p = handlePos(b.k), on = b.k !== 'hpf' || S.hpf.on; ctx.beginPath(); ctx.arc(p.x, clamp(p.y, PT, H - PB), S.sel === b.k ? 9 : 7, 0, Math.PI * 2); ctx.fillStyle = on ? b.col : '#334155'; ctx.fill(); ctx.lineWidth = S.sel === b.k ? 3 : 1.5; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.k === 'lm' ? 'LM' : b.k === 'hm' ? 'HM' : b.name, p.x, clamp(p.y, PT, H - PB) - 12); });
    }

    /* ---------- 컨트롤 */
    function fmtF(f) { return f >= 1000 ? (f / 1000).toFixed(f >= 10000 ? 1 : 2) + ' kHz' : Math.round(f) + ' Hz'; }
    function sumTxt(k) { var b = S[k]; if (k === 'hpf') return b.on ? fmtF(b.f) : 'OFF'; return (b.g > 0 ? '+' : '') + b.g.toFixed(1) + ' dB'; }
    function renderPanel() {
      var k = S.sel, b = S[k], meta = BANDS.filter(function (x) { return x.k === k; })[0], h = '';
      panel.style.setProperty('--b', meta.col);
      if (k === 'hpf') {
        h = '<h4><span>HPF (로우컷) · 12 dB/oct</span><label class="sim-switch" style="margin:0"><input type="checkbox" data-c="hpfon"' + (b.on ? ' checked' : '') + '><span>HPF 켜기</span></label></h4>' +
          '<label class="sim-range"><span>주파수 <b data-o="f">' + fmtF(b.f) + '</b></span><input type="range" min="0" max="1000" step="1" value="' + hp2lin(b.f) + '" data-c="f" aria-label="HPF 주파수"></label>' +
          '<p class="sim-eq-hint">이 주파수 아래 저음을 점점 줄여요. 범위 20–600 Hz (CL5 와 같음). MG12XU 는 80 Hz 고정이에요.</p>';
      } else {
        h = '<h4><span>' + meta.name + ' · ' + (b.q != null ? '피킹(벨)' : (k === 'low' ? '로우 쉘빙' : '하이 쉘빙')) + '</span><button type="button" class="sim-btn" data-c="zero">이 밴드 0 dB</button></h4>' +
          '<label class="sim-range"><span>주파수 <b data-o="f">' + fmtF(b.f) + '</b></span><input type="range" min="0" max="1000" step="1" value="' + f2lin(b.f) + '" data-c="f" aria-label="' + meta.name + ' 주파수"></label>' +
          '<label class="sim-range"><span>게인 <b data-o="g">' + (b.g > 0 ? '+' : '') + b.g.toFixed(1) + ' dB</b></span><input type="range" min="-18" max="18" step="0.5" value="' + b.g + '" data-c="g" aria-label="' + meta.name + ' 게인"></label>' +
          (b.q != null ? '<label class="sim-range"><span>Q (클수록 좁게) <b data-o="q">' + b.q.toFixed(2) + '</b></span><input type="range" min="0" max="1000" step="1" value="' + q2lin(b.q) + '" data-c="q" aria-label="' + meta.name + ' Q"></label>'
            : '<p class="sim-eq-hint">쉘빙은 Q 손잡이가 없어요(CL5 도 쉘빙일 때 Q 가 표시되지 않아요). 이 주파수 ' + (k === 'low' ? '아래' : '위') + ' 전체를 올리고 내려요.</p>');
      }
      panel.innerHTML = h;
      el.querySelectorAll('[data-band]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-band') === k)); });
    }
    function refreshOuts() {
      var b = S[S.sel], o;
      if ((o = panel.querySelector('[data-o=f]'))) o.textContent = fmtF(b.f);
      if ((o = panel.querySelector('[data-o=g]'))) o.textContent = (b.g > 0 ? '+' : '') + b.g.toFixed(1) + ' dB';
      if ((o = panel.querySelector('[data-o=q]'))) o.textContent = b.q.toFixed(2);
      var inp; if ((inp = panel.querySelector('[data-c=f]'))) inp.value = S.sel === 'hpf' ? hp2lin(b.f) : f2lin(b.f);
      if ((inp = panel.querySelector('[data-c=g]'))) inp.value = b.g; if ((inp = panel.querySelector('[data-c=q]'))) inp.value = q2lin(b.q);
      if ((inp = panel.querySelector('[data-c=hpfon]'))) inp.checked = !!S.hpf.on;
      BANDS.forEach(function (x) { var s = el.querySelector('[data-bsum=' + x.k + ']'); if (s) s.textContent = sumTxt(x.k); var bt = el.querySelector('[data-band=' + x.k + ']'); if (bt) bt.classList.toggle('off', x.k === 'hpf' ? !S.hpf.on : Math.abs(S[x.k].g) < 0.05); });
      var ob = el.querySelector('[data-sim=eqon]'); ob.textContent = S.eqOn ? 'EQ ON' : 'EQ OFF (바이패스)'; ob.classList.toggle('off', !S.eqOn); ob.setAttribute('aria-pressed', String(S.eqOn));
      el.querySelector('[data-sim=prob]').checked = S.prob; el.querySelector('[data-sim=rumble]').checked = S.rumble;
    }
    function changed() { applyAudio(); refreshOuts(); evalTasks(); renderRead(); draw(); }

    /* ---------- 과제 판정 (상태로만) */
    function flat() { return !S.hpf.on && ['low', 'lm', 'hm', 'high'].every(function (k) { return Math.abs(S[k].g) < 2; }); }
    function findOk() {
      if (!S.prob) return false;
      var near = ['lm', 'hm'].some(function (k) { var b = S[k]; return b.g <= -3 && Math.abs(Math.log(b.f / S.probF) / Math.LN2) <= 1 / 3; });
      if (!near) return false;
      var at = eqDb(S.probF), fs = fsNow();
      function mids(f) { return ['lm', 'hm'].reduce(function (a, k) { return a + bandDb('peaking', S[k].f, S[k].g, S[k].q, f, fs); }, 0); }
      var far = Math.min(mids(S.probF / 4), mids(Math.min(18000, S.probF * 4)));
      return at <= -3 && far >= -3;   // 그 주파수는 3 dB 이상 줄이고, 2옥타브 떨어진 곳은 거의 그대로(넓게 다 깎지 않기)
    }
    function nwOk() {
      var narrowCut = ['lm', 'hm'].some(function (k) { return S[k].g <= -3 && S[k].q >= 2; });
      var wideBoost = ['lm', 'hm'].some(function (k) { return S[k].g >= 2 && S[k].g <= 6 && S[k].q <= 1.2; }) || ['low', 'high'].some(function (k) { return S[k].g >= 2 && S[k].g <= 6; });
      return narrowCut && wideBoost;
    }
    function evalTasks() {
      if (S.hpf.on && S.hpf.f >= 78 && S.hpf.f <= 152) hit('hpf');
      if (findOk()) { S.revealed = true; hit('find'); }
      if (nwOk()) hit('narrowwide');
      if (!S.eqOn && !flat()) { if (!S.sawOff) S.sawOff = performance.now(); }
      else if (S.eqOn && S.sawOff) { if (performance.now() - S.sawOff >= 1000 && !flat()) hit('bypass'); S.sawOff = 0; }
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function renderRead() {
      var lowCut = eqDb(40), at = S.prob ? probDb(S.probF) + eqDb(S.probF) : null, rows = '';
      rows += '<div class="sim-row"><span>EQ</span><b class="' + (S.eqOn ? 'ok' : 'warn') + '">' + (S.eqOn ? 'ON' : 'OFF (바이패스)') + '</b></div>';
      rows += '<div class="sim-row"><span>40 Hz (바닥 울림) 변화</span><b class="' + (lowCut <= -6 ? 'ok' : '') + '">' + (lowCut > 0 ? '+' : '') + lowCut.toFixed(1) + ' dB</b></div>';
      rows += '<div class="sim-row"><span>숨은 울림</span><b class="' + (S.done.find ? 'ok' : 'warn') + '">' + (!S.prob ? '꺼짐' : S.revealed ? fmtF(S.probF) + ' · 처음 +10 → 지금 ' + (at > 0 ? '+' : '') + at.toFixed(1) + ' dB' : '찾는 중 (+10 dB 숨어 있음)') + '</b></div>';
      var boost = ['low', 'lm', 'hm', 'high'].reduce(function (a, k) { return Math.max(a, S[k].g); }, 0);
      rows += '<div class="sim-row"><span>가장 큰 부스트</span><b class="' + (boost > 6 ? 'warn' : '') + '">' + (boost > 0 ? '+' + boost.toFixed(1) + ' dB' : '없음') + (boost > 6 ? ' · 많이 올렸어요' : '') + '</b></div>';
      read.innerHTML = '<h4>지금 상태 <small>곡선은 바이쿼드 공식 계산값</small></h4>' + rows +
        '<p class="sim-note">' + (S.done.find ? '찾았어요! 숨은 울림은 ' + fmtF(S.probF) + ' 였어요. 「다른 문제 내기」로 다시 해 볼 수 있어요.' : '찾는 법: LOW MID 나 HIGH MID 를 좁게(Q 4 이상) 크게 올리고 주파수를 천천히 움직여 거슬리는 곳을 찾은 뒤, 그 자리를 깎아요. 스펙트럼에서 튀어나온 곳도 힌트예요.') + '</p>';
    }

    /* ---------- 스펙트럼(소리 없이도: 미리 분석한 녹음 스펙트럼 + 문제 + EQ 응답) */
    var lastFrame = -1, eqVec = new Float32Array(NB), probVec = new Float32Array(NB);
    function modelSpec(t2) {
      if (!frames || !frames.length) return false;
      var fi = Math.floor(t2 / 0.1) % frames.length, fr = frames[fi];
      for (var i = 0; i < NB; i++) {
        var v = fr[i]; if (S.rumble && rumSpec) v = 10 * Math.log10(Math.pow(10, v / 10) + Math.pow(10, rumSpec[i] / 10));
        liveSpec[i] = v + (S.prob ? probVec[i] : 0) + (S.eqOn ? eqVec[i] : 0);
      }
      return true;
    }
    function vecs() { for (var i = 0; i < NB; i++) { eqVec[i] = eqDb(BF[i]); probVec[i] = probDb(BF[i]); } }
    var anaBuf = null, anaPow = null;
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick);
      var ok = false;
      if (S.audio && N) { N.ana.getFloatFrequencyData(anaBuf); for (var i = 0; i < anaBuf.length; i++) anaPow[i] = Math.pow(10, anaBuf[i] / 10); toBands(anaPow, actx.sampleRate / N.ana.fftSize, liveSpec); ok = true; }
      else { vecs(); ok = modelSpec((performance.now() - S.t0) / 1000); }
      if (ok) { for (var j = 0; j < NB; j++) dispSpec[j] = haveDisp ? dispSpec[j] * 0.7 + liveSpec[j] * 0.3 : liveSpec[j]; haveDisp = true; }
      draw();
    }

    /* ---------- 소리 (Web Audio: BiquadFilterNode 체인 + AnalyserNode) */
    function mkRumble(sr, n) {   // 브라운 잡음 → 아주 낮은 저음 (교육용 바닥 울림)
      var d = new Float32Array(n), b = 0, s = 0, i; for (i = 0; i < n; i++) { b = (b + (Math.random() * 2 - 1) * 0.02) * 0.997; d[i] = b; }
      var lp = coefs('highpass', 1, 0, 0.7071, sr), x1 = 0, x2 = 0, y1 = 0, y2 = 0;   // 직류 제거
      var w = 2 * Math.PI * 70 / sr, al = Math.sin(w) / (2 * 0.7071), cw = Math.cos(w), a0 = 1 + al, lb0 = (1 - cw) / 2 / a0, lb1 = (1 - cw) / a0, la1 = -2 * cw / a0, la2 = (1 - al) / a0;   // 70 Hz 로우패스
      for (i = 0; i < n; i++) { var x = d[i], y = lp[0] * x + lp[1] * x1 + lp[2] * x2 - lp[3] * y1 - lp[4] * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; d[i] = y; }
      x1 = x2 = y1 = y2 = 0; for (i = 0; i < n; i++) { var u = d[i], v = lb0 * u + lb1 * x1 + lb0 * x2 - la1 * y1 - la2 * y2; x2 = x1; x1 = u; y2 = y1; y1 = v; d[i] = v; s += v * v; }
      var r = Math.sqrt(s / n) || 1, fade = Math.round(sr * 0.05); for (i = 0; i < n; i++) { d[i] = d[i] / r * 0.05; if (i < fade) d[i] *= i / fade; if (i > n - fade) d[i] *= (n - i) / fade; }   // RMS 약 −26 dBFS
      return d;
    }
    var rumData = null;
    function applyAudio() {
      if (!N) return; var t2 = actx.currentTime, k = 0.015;
      N.hpf.frequency.setTargetAtTime(S.hpf.on ? S.hpf.f : 1, t2, k);
      [['low', N.low], ['lm', N.lm], ['hm', N.hm], ['high', N.high]].forEach(function (p) { var b = S[p[0]]; p[1].frequency.setTargetAtTime(b.f, t2, k); p[1].gain.setTargetAtTime(b.g, t2, k); if (b.q != null) p[1].Q.setTargetAtTime(b.q, t2, k); });
      N.prob.frequency.setValueAtTime(S.probF, t2); N.prob.gain.setTargetAtTime(S.prob ? PROB_G : 0, t2, k);
      N.rumG.gain.setTargetAtTime(S.rumble ? 1 : 0, t2, k);
      N.wet.gain.setTargetAtTime(S.eqOn ? 1 : 0, t2, k); N.dry.gain.setTargetAtTime(S.eqOn ? 0 : 1, t2, k);
    }
    function startAudio() {
      var AC = window.AudioContext || window.webkitAudioContext, srcEl = el.querySelector('[data-role=src]');
      if (!stem) { srcEl.textContent = '녹음을 불러오지 못해 소리는 들을 수 없어요. 그래프는 계속 동작해요.'; return; }
      if (!AC) { srcEl.textContent = '이 브라우저는 웹 오디오를 지원하지 않아요.'; return; }
      try { actx = actx || new AC(); } catch (e) { srcEl.textContent = '소리를 켤 수 없어요.'; return; }
      if (actx.resume) actx.resume();
      var buf = actx.createBuffer(1, stem.data.length, stem.sr); buf.getChannelData(0).set(stem.data);
      var rb = actx.createBuffer(1, rumData.length, stem.sr); rb.getChannelData(0).set(rumData);
      var src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
      var rs = actx.createBufferSource(); rs.buffer = rb; rs.loop = true;
      function bq(type) { var f = actx.createBiquadFilter(); f.type = type; return f; }
      var rumG = actx.createGain(), sum = actx.createGain(), prob = bq('peaking'), hpf = bq('highpass'), low = bq('lowshelf'), lm = bq('peaking'), hm = bq('peaking'), high = bq('highshelf');
      prob.Q.value = PROB_Q; hpf.Q.value = 20 * Math.log10(Math.SQRT1_2);   // Web Audio 의 highpass Q 는 dB 단위: −3.01 dB = 0.7071(버터워스, 12 dB/oct)
      var wet = actx.createGain(), dry = actx.createGain(), post = actx.createGain(), ana = actx.createAnalyser(), out = actx.createGain();
      ana.fftSize = 4096; ana.smoothingTimeConstant = 0.6; out.gain.value = 0.8;
      src.connect(sum); rs.connect(rumG); rumG.connect(sum); sum.connect(prob);
      prob.connect(hpf); hpf.connect(low); low.connect(lm); lm.connect(hm); hm.connect(high); high.connect(wet); wet.connect(post);
      prob.connect(dry); dry.connect(post); post.connect(ana); post.connect(out); out.connect(actx.destination);
      var st0 = actx.currentTime + 0.05, off = ((performance.now() - S.t0) / 1000) % stem.dur;
      src.start(st0, off); rs.start(st0);
      N = { src: src, rs: rs, rumG: rumG, prob: prob, hpf: hpf, low: low, lm: lm, hm: hm, high: high, wet: wet, dry: dry, ana: ana, out: out, t0: st0 - off };
      anaBuf = new Float32Array(ana.frequencyBinCount); anaPow = new Float32Array(ana.frequencyBinCount);
      S.audio = true; applyAudio();
      srcEl.textContent = '실제 보컬 녹음이 EQ(BiquadFilterNode)를 지나 들려요. 스펙트럼은 지금 들리는 소리(AnalyserNode)예요.';
      el.querySelector('[data-role=specsrc]').textContent = '(실시간 분석)';
    }
    function stopAudio() {
      if (N) { try { N.src.stop(); N.rs.stop(); N.out.disconnect(); } catch (e) { /* 이미 멈춤 */ } var pos = (actx.currentTime - N.t0) % stem.dur; S.t0 = performance.now() - pos * 1000; }
      N = null; S.audio = false; var sn = el.querySelector('[data-role=src]'); if (sn && stem) sn.textContent = '소리를 껐어요. 그래프와 스펙트럼(미리 분석한 값)은 계속 움직여요.'; var s = el.querySelector('[data-role=specsrc]'); if (s) s.textContent = frames ? '(소리 꺼짐: 녹음을 미리 분석한 값 · 교육용 근사)' : '';
    }

    /* ---------- 입력 이벤트 */
    var drag = null;
    function evPt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; }
    function nearest(p) { var best = null, bd = 22; BANDS.forEach(function (b) { var h = handlePos(b.k), d = Math.hypot(p.x - h.x, p.y - clamp(h.y, PT, H - PB)); if (d < bd) { bd = d; best = b.k; } }); return best; }
    cv.addEventListener('pointerdown', function (e) { var p = evPt(e), k = nearest(p); if (!k) return; drag = k; if (S.sel !== k) { S.sel = k; renderPanel(); } if (k === 'hpf' && !S.hpf.on) S.hpf.on = true; cv.setPointerCapture(e.pointerId); e.preventDefault(); changed(); });
    cv.addEventListener('pointermove', function (e) {
      var p = evPt(e);
      if (!drag) { cv.style.cursor = nearest(p) ? 'grab' : 'crosshair'; return; }
      var b = S[drag];
      if (drag === 'hpf') b.f = clamp(xf(p.x), 20, 600);
      else { b.f = clamp(xf(p.x), 20, 20000); b.g = Math.round(clamp(yg(p.y), -18, 18) * 2) / 2; }
      changed();
    });
    function endDrag() { drag = null; }
    cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
    el.addEventListener('input', function (e) {
      var c = e.target.getAttribute('data-c'); if (c !== 'f' && c !== 'g' && c !== 'q') return; var b = S[S.sel], v = +e.target.value;
      if (c === 'f') b.f = S.sel === 'hpf' ? lin2hp(v) : lin2f(v);
      if (c === 'g') b.g = v; if (c === 'q') b.q = lin2q(v);
      changed();
    });
    el.addEventListener('change', function (e) {
      var t2 = e.target, c = t2.getAttribute('data-c'), s = t2.getAttribute('data-sim');
      if (c === 'hpfon') { S.hpf.on = t2.checked; changed(); }
      if (s === 'prob') { S.prob = t2.checked; changed(); }
      if (s === 'rumble') { S.rumble = t2.checked; changed(); }
    });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      var band = b.getAttribute('data-band'); if (band) { S.sel = band; renderPanel(); refreshOuts(); draw(); return; }
      if (b.getAttribute('data-c') === 'zero') { S[S.sel].g = 0; changed(); return; }
      var s = b.getAttribute('data-sim');
      if (s === 'play') { if (S.audio) { stopAudio(); b.textContent = '🔊 소리 켜기'; b.classList.remove('on'); } else { startAudio(); if (S.audio) { b.textContent = '🔇 소리 끄기'; b.classList.add('on'); } } }
      if (s === 'eqon') { S.eqOn = !S.eqOn; changed(); }
      if (s === 'newprob') { var c2 = PROB_LIST.filter(function (f) { return f !== S.probF; }); S.probF = c2[Math.floor(Math.random() * c2.length)]; S.revealed = false; S.prob = true; changed(); }
      if (s === 'reset') { Object.keys(INIT).forEach(function (k) { S[k] = JSON.parse(JSON.stringify(INIT[k])); }); renderPanel(); changed(); }
    });

    var ro = window.ResizeObserver ? new ResizeObserver(function () { size(); }) : null; if (ro) ro.observe(cv.parentNode); else window.addEventListener('resize', size);
    renderPanel(); refreshOuts(); renderRead(); size();
    tick();
    loadStem('leadVox', SEG[0], SEG[1], function (st) {
      if (!alive) return;
      var srcEl = el.querySelector('[data-role=src]');
      if (st) {
        stem = st; frames = analyze(st.data, st.sr, 0.1);
        rumData = mkRumble(st.sr, Math.round(st.sr * 4)); var rf = analyze(rumData, st.sr, 0.25); rumSpec = new Float32Array(NB);
        for (var i = 0; i < NB; i++) { var s = 0; for (var j = 0; j < rf.length; j++) s += Math.pow(10, rf[j][i] / 10); rumSpec[i] = 10 * Math.log10(s / rf.length + 1e-20); }
        srcEl.textContent = '실제 보컬 녹음(MG12XU 실습과 같은 음원)이에요. 처음엔 소리가 꺼져 있어요.';
      } else {   // 녹음이 없으면 분홍 잡음 모양의 가상 스펙트럼
        frames = [new Float32Array(NB)]; for (var k = 0; k < NB; k++) frames[0][k] = -52 - 10 * Math.log10(BF[k] / 200) - (BF[k] < 120 ? 12 * Math.log2(120 / BF[k]) : 0);
        rumSpec = new Float32Array(NB); for (var m = 0; m < NB; m++) rumSpec[m] = BF[m] < 70 ? -48 : -48 - 40 * Math.log10(BF[m] / 70);
        srcEl.textContent = '녹음을 불러오지 못해 가상 스펙트럼으로 그래프만 보여 줘요.';
      }
      el.querySelector('[data-role=specsrc]').textContent = '(소리 꺼짐: 녹음을 미리 분석한 값 · 교육용 근사)';
      S.ready = true;
    });

    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); stopAudio(); if (actx && actx.close) { try { actx.close(); } catch (e) { /* noop */ } } if (ro) ro.disconnect(); else window.removeEventListener('resize', size); el.innerHTML = ''; },
      state: function () {
        var o = { eqOn: S.eqOn, sel: S.sel, prob: { on: S.prob, f: S.probF, g: PROB_G, q: PROB_Q }, rumble: S.rumble, audio: S.audio, ready: !!S.ready, synthetic: S.ready && !stem, revealed: S.revealed, done: Object.keys(S.done), fs: fsNow() };
        ['hpf', 'low', 'lm', 'hm', 'high'].forEach(function (k) { o[k] = JSON.parse(JSON.stringify(S[k])); });
        o.atProb = eqDb(S.probF); o.at40 = eqDb(40); o.specOk = haveDisp;
        return o;
      },
      set: function (o) {
        o = o || {};
        ['hpf', 'low', 'lm', 'hm', 'high'].forEach(function (k) { if (o[k]) Object.keys(o[k]).forEach(function (p) { S[k][p] = o[k][p]; }); });
        if (o.eqOn != null) S.eqOn = !!o.eqOn; if (o.prob != null) S.prob = !!o.prob; if (o.rumble != null) S.rumble = !!o.rumble; if (o.probF) { S.probF = o.probF; S.revealed = false; }
        if (o.sel) S.sel = o.sel;
        renderPanel(); changed(); return this.state();
      },
      response: function (freqs) { return freqs.map(function (f) { return eqDb(f); }); },
      geometry: function () { var r = cv.getBoundingClientRect(), k = r.width / W; return { left: r.left, top: r.top, scale: k, handle: function (b) { var p = handlePos(b); return { x: r.left + p.x * k, y: r.top + clamp(p.y, PT, H - PB) * k }; }, fx: function (f) { return r.left + fx(f) * k; }, gy: function (d) { return r.top + gy(d) * k; } }; }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.eqParam = eqParam;
  window.STASims._eqMath = { coefs: coefs, bandDb: bandDb };

  /* ======================================================================= 모듈 데이터 */
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES.eq = {
    id: 'eq', path: 'mixing', no: 2, status: 'ready', level: '중급', minutes: 40, thumb: 'eq',
    title: 'EQ', sub: '주파수별로 음색을 다듬기',
    prereq: ['signal-flow', 'gain-fader', 'hpf-eq'],
    overview: {
      lead: 'EQ(이퀄라이저)는 소리를 <b>주파수(높낮이)별로 나눠 크기를 조절</b>하는 도구예요. 필요 없는 저음은 <b>HPF</b>로 걸러 내고, 거슬리는 대역은 <b>좁게 깎고</b>, 부족한 대역은 <b>넓게 조금</b> 올려요. 먼저 주파수·파장·위상을 알면 EQ 가 왜 그렇게 동작하는지 이해하기 쉬워요.',
      terms: [
        ['주파수 (Hz)', '소리가 1초에 떨리는 횟수예요. 숫자가 작으면 낮은 소리, 크면 높은 소리예요. 사람은 대략 20 Hz–20 kHz 를 들어요.'],
        ['파장', '한 번 떨리는 동안 소리가 나아가는 거리예요. 파장 = 343 m/s ÷ 주파수. 100 Hz 는 약 3.4 m, 1 kHz 는 약 34 cm 예요.'],
        ['위상과 극성', '위상은 파형이 한 주기(360°) 중 어디쯤에 있는지예요. 극성은 파형의 +와 −를 통째로 뒤집는 것이에요. 콘솔의 Ø(PHASE) 버튼은 극성 반전 버튼이에요.'],
        ['HPF (로우컷)', '정한 주파수보다 낮은 소리를 점점 줄이는 필터예요. MG12XU 는 80 Hz, 12 dB/oct 고정이에요(제조사 자료).'],
        ['부스트 / 컷', '부스트는 그 대역을 올리는 것, 컷은 깎는 것이에요. 라이브에서는 먼저 깎는 것이 기본이에요.'],
        ['Q (폭)', '한 밴드가 바꾸는 범위의 넓이예요. Q 값이 크면 좁고, 작으면 넓어요. Q 1.4 가 약 1옥타브예요.'],
        ['피킹 / 쉘빙', '피킹(벨)은 한 주파수 주변을 산 모양으로 바꾸고, 쉘빙은 어느 주파수 위(또는 아래) 전체를 올리고 내려요.'],
        ['링잉 아웃', '피드백이 잘 나는 주파수를 찾아 출력 EQ 에서 좁게 깎아, 피드백 전까지의 여유를 늘리는 작업이에요.']
      ],
      points: [
        'EQ 는 <b>먼저 깎고, 좁게 깎고, 올릴 때는 넓게 조금</b> 올려요.',
        '보컬·말 마이크는 <b>HPF 부터</b> 켜요. (MG12XU: 80 Hz, 12 dB/oct — 제조사 자료)',
        '채널 EQ 는 그 마이크의 음색, 출력 EQ 는 스피커·방·피드백 — <b>문제가 생긴 곳에서</b> 고쳐요.'
      ],
      model: 'eqOverview'
    },
    theory: [
      { title: '주파수, 파장, 위상과 극성', visual: 'eqWave',
        body: '소리는 공기가 빠르게 앞뒤로 떨리는 거예요. <b>주파수</b>는 1초에 몇 번 떨리는지이고 단위는 <b>Hz</b>예요(1 kHz = 1,000 Hz). 한 번 떨리는 동안 소리가 가는 거리가 <b>파장</b>이에요. <b>파장 = 343 m/s ÷ 주파수</b>라서 100 Hz 는 약 3.4 m, 1 kHz 는 약 34 cm, 10 kHz 는 약 3.4 cm 예요. <b>위상</b>은 파형이 한 바퀴(360°) 중 어디쯤에 있는지예요. 같은 소리 두 개가 위상이 맞으면 커지고, 반 바퀴(180°) 어긋나면 서로 지워져요. <b>극성</b>은 파형의 +와 −를 통째로 뒤집는 것이에요. 그리고 EQ 는 크기만이 아니라 그 주변 주파수의 <b>위상도 함께</b> 바꿔요.',
        more: '<ul><li><b>낮은 소리는 파장이 길어요.</b> 20 Hz 는 약 17 m 나 돼요. 그래서 저음은 벽·사람을 돌아 넓게 퍼지고, 막거나 흡음하기 어려워요. 고음은 파장이 짧아 방향성이 강하고, 사람 몸·커튼에도 쉽게 줄어요. (343 m/s 는 20 °C 공기 기준)</li>' +
          '<li><b>시간 차이 → 위상 차이</b>: 같은 소리가 1 ms 늦게 섞이면 500 Hz 에서는 반 바퀴(180°) 어긋나 줄고, 1 kHz 에서는 한 바퀴(360°) 어긋나 다시 커져요. 주파수마다 커졌다 줄었다 하는 빗살 모양(콤 필터)이 생겨요. 한 소리를 두 마이크로 받을 때 생기는 일이에요.</li>' +
          '<li><b>극성과 위상은 달라요.</b> 극성 반전은 시간 지연 없이 모든 주파수를 똑같이 뒤집어요. 콘솔의 「Ø」(PHASE) 버튼은 사실 극성 반전 버튼이에요(CL5 도 입력마다 있어요). XLR 2·3번 핀이 바뀐 케이블도 극성을 뒤집어요.</li>' +
          '<li><b>EQ 와 위상</b>: 콘솔 EQ(아날로그와 대부분의 디지털 EQ)는 크기를 바꾼 주파수 근처에서 위상도 함께 돌려요. 바이쿼드 공식으로 계산해 보면 +12 dB 피킹 EQ 는 그 근처에서 위상을 최대 약 37° 바꿔요. 게인이 클수록 크게 바뀌고, 폭이 좁을수록(Q 값이 클수록) 좁은 범위에서 급하게 바뀌어요. 그래서 EQ 는 꼭 필요한 만큼만 써요.</li></ul>',
        check: { q: '같은 소리를 받은 두 마이크(크기 같음, 시간 차이 없음) 중 하나의 극성을 뒤집으면(Ø) 섞인 소리는 어떻게 될까요?', options: [
          { t: '서로 지워져 아주 작아진다', ok: true, why: '맞아요. +와 −가 정확히 반대가 되어 합이 거의 0 이 돼요.' },
          { t: '두 배로 커진다', why: '두 배가 되는 것은 위상이 같을 때예요.' },
          { t: '고음만 조금 줄어든다', why: '극성 반전은 모든 주파수에 똑같이 적용돼요. 시간 차이가 있을 때 주파수마다 달라져요.' }] } },
      { title: '주파수 대역과 목소리 음색', visual: 'eqRanges',
        body: '목소리는 한 주파수가 아니라 여러 주파수가 섞여 있어요. 그래서 대역마다 느낌이 달라요. 너무 많으면 문제가 되는 대역을 이름으로 기억해 두면 EQ 가 쉬워져요: <b>웅웅·답답(머디)</b>, <b>통 울림(박시)</b>, <b>코맹맹이(나잘)</b>, <b>귀를 찌름(하시)</b>, <b>ㅅ·ㅊ 소리(치찰음)</b>. 그림의 범위는 <b>대략적인 범위</b>예요. 목소리·마이크·방에 따라 달라서, 마지막에는 귀로 찾아야 해요.',
        more: '<ul><li><b>대략적인 범위</b> (목소리 기준): 80 Hz 아래 — 바닥 진동·손으로 쥐는 소리·바람(목소리에는 거의 없음) · 100–250 Hz — 두께·따뜻함 · 200–500 Hz — 많으면 웅웅·답답 · 400–900 Hz — 많으면 통 속에서 말하는 듯 · 800 Hz–1.5 kHz — 많으면 코맹맹이 · 2–5 kHz — 또렷함, 너무 많으면 귀를 찌름 · 5–9 kHz — ㅅ·ㅆ·ㅊ 치찰음 · 10 kHz 이상 — 공기감·숨결</li>' +
          '<li>말소리의 기본음(가장 낮은 떨림)은 남성이 대략 85–180 Hz, 여성이 대략 165–255 Hz 예요. 그 위의 배음들이 음색과 발음을 만들어요.</li>' +
          '<li>사람 귀는 2–5 kHz 근처에 특히 예민해서, 이 대역은 조금만 바꿔도 크게 느껴져요.</li>' +
          '<li>같은 사람이라도 마이크 거리(근접 효과)·방 울림에 따라 문제 대역이 달라져요.</li></ul>',
        check: { q: '보컬이 「통 속에서 말하는 것처럼」 답답하게 들려요. 먼저 살펴볼 대역은?', options: [
          { t: '약 400–900 Hz (박시)', ok: true, why: '맞아요. 이 근처가 많으면 통 울림처럼 들려요. 정확한 곳은 귀로 찾아요.' },
          { t: '약 10 kHz 이상 (공기감)', why: '공기감·숨결 대역이에요. 답답함의 원인과는 거리가 멀어요.' },
          { t: '약 30 Hz', why: '목소리에는 거의 없는 아주 낮은 대역이에요. HPF 로 정리하는 곳이에요.' }] } },
      { title: 'HPF — 필요 없는 저음 걸러내기', visual: 'eqHpf',
        body: '<b>HPF(High Pass Filter, 로우컷)</b>는 정한 주파수보다 <b>높은 소리는 통과</b>시키고, 그 아래 저음을 점점 줄여요. 목소리 마이크에는 바닥 진동, 손으로 쥐는 소리, 숨·바람 소리, 무대의 다른 저음이 함께 들어와요. 이 저음은 목소리에 도움이 안 되고 앰프·스피커의 힘만 써서 전체 소리를 탁하게 해요. 그래서 보컬·말 마이크는 보통 <b>HPF 를 켜는 것부터</b> 시작해요.',
        more: '<ul><li><b>MG12XU (제조사 자료)</b>: HPF 는 80 Hz, 12 dB/oct 고정이고 버튼으로 켜고 끄기만 해요. CH1–7/8 에 있고, 5/6·7/8 채널은 MIC 입력에만 걸려요.</li>' +
          '<li><b>CL5 (제조사 자료)</b>: HPF 주파수를 20 Hz–600 Hz 에서 고르고, 기울기는 −6 또는 −12 dB/oct 중에서 골라요.</li>' +
          '<li><b>12 dB/oct</b> 는 한 옥타브(주파수 절반) 내려갈 때마다 약 12 dB 씩 더 줄어든다는 뜻이에요. 80 Hz · 12 dB/oct 면 80 Hz 에서 −3 dB, 40 Hz 에서 약 −12 dB, 20 Hz 에서 약 −24 dB 예요(그림, 계산값).</li>' +
          '<li>너무 높이 올리면 목소리가 얇아져요. 남성 목소리는 80–120 Hz, 여성 목소리는 조금 더 높게(100–150 Hz) 시작해 보고 귀로 확인해요. (출발점 예시)</li>' +
          '<li>마이크에 바짝 대고 노래해 저음이 커질 때(근접 효과)도 HPF 가 도움이 돼요.</li></ul>',
        check: { q: 'MG12XU 의 HPF 버튼을 켜면 어떻게 될까요?', options: [
          { t: '80 Hz 아래 저음이 점점 줄어든다 (12 dB/oct)', ok: true, why: '맞아요. 80 Hz 에서 −3 dB, 그 아래로 갈수록 더 많이 줄어요.' },
          { t: '80 Hz 위 고음이 줄어든다', why: 'HPF 는 높은 소리를 통과(Pass)시키고 낮은 소리를 줄여요.' },
          { t: '모든 소리가 12 dB 작아진다', why: '12 dB/oct 는 옥타브마다 줄어드는 기울기예요. 전체 음량이 줄지는 않아요.' }] } },
      { title: '주파수 · 게인 · Q — EQ 의 세 손잡이', visual: 'eqQ',
        body: '파라메트릭 EQ 의 한 밴드는 세 가지로 정해요. <b>주파수(FREQ)</b>: 어느 높이의 소리를 바꿀지. <b>게인(GAIN)</b>: 얼마나 올리거나(+) 내릴지(−). <b>Q</b>: 얼마나 넓게 바꿀지. <b>Q 값이 클수록 좁고, 작을수록 넓어요.</b> 한 주파수 주변을 산 모양으로 바꾸는 것을 <b>피킹(벨)</b>, 어느 주파수 위나 아래 전체를 올리고 내리는 것을 <b>쉘빙</b>이라고 해요.',
        more: '<ul><li><b>Q 와 폭</b>(계산값): Q 0.67 ≈ 2옥타브, Q 1.4 ≈ 1옥타브, Q 4.3 ≈ 1/3옥타브.</li>' +
          '<li><b>MG12XU (제조사 자료)</b>: 주파수가 고정된 3밴드예요. HIGH 10 kHz 쉘빙, MID 2.5 kHz 피킹, LOW 100 Hz 쉘빙이고, 각각 ±15 dB 예요. CH9/10·11/12 스테레오 채널은 HIGH·LOW 만 있어요. 주파수와 Q 는 바꿀 수 없고 게인만 돌려요.</li>' +
          '<li><b>CL5 (제조사 자료)</b>: 4밴드 파라메트릭 EQ(LOW · LOW MID · HIGH MID · HIGH)예요. 밴드마다 주파수 20 Hz–20 kHz, 게인 ±18 dB, Q 0.10–10.0 을 정해요. LOW 는 로우 쉘빙, HIGH 는 하이 쉘빙이나 LPF 로 바꿀 수 있고, 쉘빙일 때는 Q 가 없어요.</li>' +
          '<li>그림의 곡선은 디지털 EQ 에서 널리 쓰는 바이쿼드 필터 공식(Audio EQ Cookbook)으로 계산했어요. 콘솔마다 곡선 모양은 조금씩 달라요.</li></ul>',
        check: { q: '1 kHz 에서 +6 dB 를 올리고 있어요. Q 를 0.7 에서 4 로 바꾸면?', options: [
          { t: '더 좁은 범위만 올라간다', ok: true, why: '맞아요. Q 값이 클수록 폭이 좁아져요. Q 4 는 약 1/3옥타브예요.' },
          { t: '더 넓은 범위가 올라간다', why: '반대예요. Q 값이 작을수록 넓어요.' },
          { t: '올라가는 양이 두 배가 된다', why: '올라가는 양(dB)은 게인이 정해요. Q 는 폭만 바꿔요.' }] } },
      { title: '부스트와 컷 · 보컬 EQ 순서', visual: 'eqBoostCut',
        body: 'EQ 는 올리기(<b>부스트</b>)와 깎기(<b>컷</b>) 두 가지예요. 라이브에서는 <b>먼저 깎는 것</b>이 기본이에요. 올리면 그 대역의 헤드룸과 피드백 여유가 줄지만, 문제 대역을 깎으면 나머지가 자연스럽게 살아나요. 문제(울림·공진)는 좁은 곳에 몰려 있는 경우가 많아 <b>좁게 깎고</b>, 꼭 올려야 할 때는 <b>넓게 조금</b> 올려요.',
        more: '<ul><li><b>문제 주파수 찾기(스윕)</b>: 한 밴드를 좁게(Q 4–8) 크게(+8 ~ +10 dB) 올리고 주파수를 천천히 움직여요. 거슬리는 소리가 확 커지는 곳이 문제 주파수예요. 찾으면 게인을 0 으로 돌린 뒤 그 자리를 3–6 dB 깎아요. 스윕할 때는 전체 음량을 조금 줄이고 피드백에 주의해요.</li>' +
          '<li><b>보컬 EQ 순서 예시</b>(출발점일 뿐이에요): ① HPF 켜기(80–120 Hz) ② 웅웅·통 울림이 있으면 200–800 Hz 를 좁게 2–4 dB 깎기 ③ 귀를 찌르면 2.5–4 kHz 를 살짝 깎기 ④ 묻히면 3–5 kHz 를 넓게 +2 ~ +3 dB ⑤ EQ 를 껐다 켜며 비교하기</li>' +
          '<li><b>설교(말)</b>: 또렷함이 먼저예요. HPF 를 조금 높게(100–150 Hz) 써 보세요. <b>찬양 보컬</b>: 몸통(150–300 Hz)을 너무 깎지 않고, 필요하면 10 kHz 이상 공기감을 살짝 더해요.</li>' +
          '<li><b>MG12XU 로 해 본다면</b>: HPF 켜기 → 귀를 찌르면 MID(2.5 kHz)를 조금 내리기 → 웅웅거리면 LOW(100 Hz)를 조금 내리기. 주파수가 고정이라 정확한 곳을 고를 수는 없어요.</li>' +
          '<li>ㅅ·ㅊ 소리만 따가우면 EQ 대신 디에서를 쓰기도 해요. CL5 는 입력 채널의 Dynamics 2 에서 De-esser 를 고를 수 있어요(제조사 자료).</li></ul>',
        check: { q: '보컬에서 거슬리는 울림 주파수를 찾았어요. 알맞은 처리는?', options: [
          { t: '그 주파수를 좁은 Q 로 3–6 dB 깎는다', ok: true, why: '맞아요. 문제만 골라 줄이고 나머지 음색은 지켜요.' },
          { t: '다른 대역을 넓게 크게 올려 가린다', why: '헤드룸과 피드백 여유만 줄고, 문제는 그대로 남아요.' },
          { t: '스윕할 때처럼 좁게 +10 dB 올린 채로 둔다', why: '스윕은 찾을 때만 써요. 찾은 뒤에는 깎아야 해요.' }] } },
      { title: '채널 EQ 와 출력 EQ · 피드백 잡기', visual: 'eqChannels',
        body: '<b>채널 EQ</b>는 마이크 하나의 음색을 다듬어요. 그 채널 소리만 바뀌어요. <b>출력 EQ</b>는 메인 스피커나 모니터로 나가는 소리 전체에 걸려요. 방·스피커의 특성을 보정하거나 <b>피드백이 잘 나는 주파수</b>를 줄일 때 써요. 출력 EQ 로 보컬 음색을 만들거나 채널 EQ 로 방 문제를 고치려 하면, 다른 소리까지 함께 망가져요.',
        more: '<ul><li><b>링잉 아웃(피드백 잡기) 순서</b>: ① 스피커·모니터·마이크를 예배 때 자리에 둬요. ② 낮은 음량에서 시작해 마이크 하나씩 천천히 올려요. ③ 「우웅」「삐-」 하고 울리기 시작하면 바로 조금 내려요. ④ 그 주파수를 찾아(RTA·귀) 그 출력의 EQ 에서 좁게 3–6 dB 만 깎아요. ⑤ 다시 조금 올려 다음 울림을 찾아요. 보통 2–3곳이면 충분하고, 너무 많이 깎으면 소리가 얇아져요.</li>' +
          '<li><b>순서가 중요해요</b>: 마이크 위치·거리와 스피커 방향(「마이크」 모듈)을 먼저 바로잡고, EQ 는 마지막에 몇 dB 의 여유를 더 얻는 도구예요.</li>' +
          '<li><b>안전</b>: 큰 피드백은 귀와 스피커(특히 고음 드라이버)를 상하게 할 수 있어요. 낮은 음량에서 짧게만 하고, 울리면 즉시 내려요.</li>' +
          '<li><b>CL5 (제조사 자료)</b>: MIX(모니터)·STEREO 같은 출력 채널에도 4밴드 PEQ 가 있고, GEQ 랙에 31밴드 GEQ 나 Flex15GEQ 를 넣어 출력에 걸 수 있어요.</li></ul>',
        check: { q: '한 모니터 스피커에서만 2.5 kHz 근처 피드백이 계속 나요. 어디를 깎는 것이 알맞을까요?', options: [
          { t: '그 모니터로 가는 출력(MIX) EQ 에서 2.5 kHz 를 좁게', ok: true, why: '맞아요. 문제가 생긴 출력에서만 고치면 메인 소리는 그대로예요.' },
          { t: '모든 채널 EQ 에서 2.5 kHz 를 크게', why: '메인 소리까지 모두 바뀌고, 채널마다 하나씩 고쳐야 해요.' },
          { t: '메인 STEREO 출력의 저음', why: '문제는 모니터의 2.5 kHz 예요. 다른 곳·다른 대역이에요.' }] } }
    ],
    practice: {
      kind: 'eqParam',
      lead: '실제 보컬 녹음에 HPF + 4밴드 파라메트릭 EQ 를 걸어요(CL5 와 같은 구성). 그래프의 점을 끌거나 아래 손잡이로 주파수·게인·Q 를 바꾸면 곡선과 스펙트럼이 바로 바뀌어요. 「소리 켜기」를 누르면 바뀐 소리를 들을 수 있어요. 이 채널에는 바닥 울림과 숨은 울림(공진)이 하나 들어 있어요.',
      note: 'EQ 곡선은 Web Audio BiquadFilterNode 와 같은 바이쿼드 공식으로 계산했어요. 바닥 울림·숨은 울림은 연습용으로 넣은 소리이고, 소리를 끈 상태의 스펙트럼은 녹음을 미리 분석해 계산한 교육용 근사예요. 손잡이 범위(20 Hz–20 kHz, ±18 dB, Q 0.10–10, HPF 20–600 Hz)는 CL5 제조사 자료를 따랐어요.',
      tasks: [
        { id: 'hpf', title: 'HPF 로 불필요한 저음 정리', text: 'HPF 를 켜고 80–150 Hz 사이로 맞춰 바닥 울림(아주 낮은 저음)을 줄이세요.' },
        { id: 'find', title: '숨은 문제 주파수 찾아 줄이기', text: '일부러 올려 둔 울림이 하나 있어요. 스펙트럼과 귀로 찾아, LOW MID 나 HIGH MID 로 그 주파수(±1/3옥타브 안)를 깎아 울림을 3 dB 이상 줄이세요.' },
        { id: 'narrowwide', title: '좁게 깎고 넓게 올리기', text: '한 밴드는 좁게(Q 2 이상) 3 dB 이상 깎고, 다른 밴드는 넓게(Q 1.2 이하 또는 쉘빙) +2 ~ +6 dB 올려 보세요.' },
        { id: 'bypass', title: 'EQ 를 꺼서 전후 비교', text: 'EQ 를 바꾼 상태에서 「EQ ON」을 눌러 1초 이상 꺼 두고(원래 소리), 다시 켜서 비교하세요.' }
      ],
      links: [
        { title: 'MG12XU 기능부 설명 · EQ', text: 'HIGH·MID·LOW 노브가 콘솔 어디에 있는지 봐요.', go: { tab: 'tab6', sec: 'eq' } },
        { title: 'Ear Training · 대역별 소리', text: '대역별로 소리가 어떻게 다른지 귀로 비교해요.', go: { tab: 'tab3' } }
      ]
    },
    quiz: [
      { q: '1 kHz 소리의 파장은 약 얼마일까요? (소리의 속도 343 m/s)', options: [
        { t: '약 34 cm', ok: true, why: '맞아요. 343 ÷ 1000 = 0.343 m 예요.' },
        { t: '약 3.4 m', why: '그건 100 Hz 의 파장이에요.' },
        { t: '약 3.4 cm', why: '그건 10 kHz 의 파장이에요.' }] },
      { q: '설교 마이크 소리가 웅웅거리고 답답해요. 먼저 해 볼 것은?', options: [
        { t: 'HPF 를 켜고, 200–500 Hz 근처를 찾아 조금 깎는다', ok: true, why: '맞아요. 필요 없는 저음과 웅웅거리는 대역을 먼저 줄여요.' },
        { t: '10 kHz 를 크게 올린다', why: '밝아지기는 해도 웅웅거림은 그대로이고, 치찰음·피드백 위험만 커져요.' },
        { t: '페이더를 올린다', why: '음량만 커지고 답답한 음색은 그대로예요.' }] },
      { q: 'Q 에 대한 설명으로 맞는 것은?', options: [
        { t: 'Q 값이 클수록 좁은 범위만 바뀐다', ok: true, why: '맞아요. Q 4.3 은 약 1/3옥타브, Q 1.4 는 약 1옥타브예요.' },
        { t: 'Q 값이 클수록 넓은 범위가 바뀐다', why: '반대예요.' },
        { t: 'Q 는 올리고 내리는 양(dB)이다', why: '올리고 내리는 양은 게인이에요.' }] },
      { q: 'MG12XU 채널 EQ 의 MID 노브로 맞는 것은? (제조사 자료)', options: [
        { t: '2.5 kHz 피킹, ±15 dB, 주파수는 고정', ok: true, why: '맞아요. MG12XU 는 주파수가 고정된 3밴드 EQ 예요.' },
        { t: '주파수를 20 Hz–20 kHz 에서 고를 수 있다', why: '그건 CL5 의 4밴드 PEQ 이야기예요.' },
        { t: '100 Hz 쉘빙', why: '그건 LOW 노브예요.' }] },
      { q: '모니터 스피커에서만 특정 주파수로 피드백이 나요. 알맞은 처리는?', options: [
        { t: '그 모니터로 가는 출력 EQ 에서 그 주파수를 좁게 깎는다', ok: true, why: '맞아요. 문제가 생긴 출력에서 필요한 곳만 고쳐요.' },
        { t: '보컬 채널 EQ 를 넓게 크게 깎는다', why: '메인으로 가는 보컬 음색까지 망가져요.' },
        { t: '그 주파수를 올려 소리를 또렷하게 한다', why: '올리면 피드백이 더 쉽게 나요.' }] }
    ],
    missions: [
      { title: 'MG12XU 실습 · 오디오 테스트', text: '실제 멀티트랙을 들으며 보컬 채널의 HPF 를 켜고 EQ 노브를 돌려 보세요. 0 위치와 번갈아 비교해요.', go: { tab: 'tab6', audio: true } },
      { title: 'CL5 콘솔 트레이닝', text: '3층 CL5 에서 채널을 고르고 다루는 흐름을 익혀요. 4밴드 PEQ 가 있는 콘솔이에요.', go: { tab: 'tab5' } }
    ],
    deeper: [
      { title: '극성 버튼으로 두 마이크 맞추기', text: '스네어 위·아래 마이크처럼 한 소리를 두 마이크가 서로 반대 방향에서 받으면, 섞을 때 저음이 줄어들 수 있어요. 한쪽의 Ø(극성)를 눌러 소리가 더 꽉 차는 쪽을 골라요.', more: '아래 마이크는 북 가죽이 반대 방향으로 움직이는 것을 받아서 극성이 뒤집혀 들어오는 경우가 많아요. 시간 차이가 크면 Ø 만으로는 완전히 맞지 않아요.' },
      { title: '리니어 페이즈 EQ', text: '보통 EQ 와 달리 위상을 바꾸지 않게 만든 EQ 예요. 대신 소리가 늦게 나와(지연) 라이브보다는 녹음·마스터링에서 주로 써요.', more: '' },
      { title: 'RTA(실시간 스펙트럼)로 보기', text: 'RTA 는 지금 소리의 주파수별 크기를 보여 줘요. CL5 는 EQ 화면에 RTA 를 겹쳐 볼 수 있어요(제조사 자료: V3.0 이후). 그래도 결정은 귀로 해요.', more: '실습 화면의 회색 스펙트럼이 RTA 와 비슷한 역할이에요. 숨은 울림이 튀어나온 곳을 찾아보세요.' }
    ],
    sources: [
      { t: 'Yamaha MG12XU/MG12 Technical Specifications (EQ·HPF, 제조사)', url: 'https://c3.zzounds.com/media/mg12xu_mg12_en_ts_a0-e2c63cdc55417602e98f65e82fc3b6fa.pdf' },
      { t: 'Yamaha MG12XU 사용설명서', url: 'https://cf3.zzounds.com/media/mg12xu_en_om_a0-e91b60e90f542e91fbfcfeaa20479686.pdf' },
      { t: 'Yamaha CL Series Specs (HPF·PEQ·Dynamics·GEQ, 제조사)', url: 'https://usa.yamaha.com/products/proaudio/mixers/cl_series/specs.html' },
      { t: 'Yamaha CL5/CL3/CL1 Reference Manual (제조사)', url: 'https://data.yamaha.com/files/download/other_assets/1/392941/cl5_3_1_en_rm_d1.pdf' },
      { t: 'CL5 레퍼런스 매뉴얼 · Mixer Basic Parameters (EQ 게인·Q 범위)', url: 'https://manualslib.mx/manual/582/Yamaha-Cl5.html?page=334' },
      { t: 'W3C Web Audio API — BiquadFilterNode 공식', url: 'https://www.w3.org/TR/webaudio/#BiquadFilterNode' }
    ]
  };
})();
