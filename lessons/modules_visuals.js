/* =============================================================================
   학습 모듈 그림(SVG) — window.STAVisuals[key]() → SVG 문자열
   - 그래프는 실제 공식으로 계산해 그림(폴라 패턴: 1차 지향성 a+(1−a)cosθ, 근접 효과: 1차 근사, 거리: 역제곱).
   - 장비 고유 사양이 아닌 「예시」 그림은 그림 안에 예시라고 적음.
   ============================================================================= */
(function () {
  'use strict';
  var C = { ink: '#0f2747', sub: '#5b6b80', line: '#cbd5e1', teal: '#0e7490', cyan: '#22d3ee', blue: '#2563eb', red: '#dc2626', amber: '#f59e0b', green: '#16a34a', bg: '#f8fafc' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + s + '</text>'; }
  function polarPath(cx, cy, R, a) {
    var d = '';
    for (var i = 0; i <= 360; i += 3) { var th = i * Math.PI / 180, g = Math.abs(a + (1 - a) * Math.cos(th)), r = R * g, x = cx + r * Math.sin(th), y = cy - r * Math.cos(th); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    return d + 'Z';
  }
  function polarCard(cx, cy, R, a, name, nullTxt, color) {
    var rings = [1, 0.5].map(function (k) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + R * k + '" fill="none" stroke="' + C.line + '" stroke-dasharray="' + (k < 1 ? '3 3' : '0') + '"/>'; }).join('');
    return rings + '<path d="M' + cx + ' ' + (cy - R) + 'V' + (cy + R) + 'M' + (cx - R) + ' ' + cy + 'H' + (cx + R) + '" stroke="' + C.line + '"/>' +
      '<path d="' + polarPath(cx, cy, R, a) + '" fill="' + color + '" fill-opacity=".18" stroke="' + color + '" stroke-width="2.2"/>' +
      '<path d="M' + cx + ' ' + (cy - R - 14) + 'l-5 8h10z" fill="' + C.ink + '"/>' + t(cx, cy - R - 18, '앞(0°)', { size: 10, fill: C.sub }) +
      t(cx, cy + R + 22, name, { size: 13, weight: 700 }) + t(cx, cy + R + 38, nullTxt, { size: 11, fill: C.sub });
  }
  /* 2026-11-04 「그림으로 보기」용 작은 그림 도구
     - svgS: 휴대폰(390 폭)에서도 옆으로 밀지 않고 한 화면에 들어오게(min-width 0), 큰 화면에서는 너무 커지지 않게 */
  function svgS(w, h, body, label) { return '<svg class="mod-svg" style="min-width:0;max-width:' + Math.round(w * 1.3) + 'px" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function rect(x, y, w, h, o) { o = o || {}; return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.rx == null ? 8 : o.rx) + '" fill="' + (o.fill || C.bg) + '"' + (o.op != null ? ' fill-opacity="' + o.op + '"' : '') + ' stroke="' + (o.stroke || C.line) + '" stroke-width="' + (o.sw || 1.5) + '"/>'; }
  function arw(x1, y1, x2, y2, col, sw, dash) {   // 끝에 화살촉이 있는 선
    var a = Math.atan2(y2 - y1, x2 - x1), L = 9, s = 0.45, p1 = [x2 - L * Math.cos(a - s), y2 - L * Math.sin(a - s)], p2 = [x2 - L * Math.cos(a + s), y2 - L * Math.sin(a + s)];
    return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="' + (sw || 2.5) + '" fill="none"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>' +
      '<path d="M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'L' + x2 + ' ' + y2 + 'L' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) + '" stroke="' + col + '" stroke-width="' + (sw || 2.5) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function mark(x, y, ok) {   // ○ / × 표시 동그라미
    return '<circle cx="' + x + '" cy="' + y + '" r="13" fill="' + (ok ? C.green : C.red) + '"/>' + t(x, y + 5, ok ? '○' : '×', { size: 15, fill: '#fff', weight: 800 });
  }
  function micG(x, y, ang, k) {   // 마이크 모양: 머리(그릴)가 ang 방향(0 = 위쪽)을 봄, 손잡이는 반대쪽
    k = k || 1;
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + ang + ') scale(' + k + ')"><rect x="-4.5" y="6" width="9" height="30" rx="4" fill="#334155"/><circle cx="0" cy="0" r="9" fill="#94a3b8" stroke="#334155" stroke-width="2"/><path d="M-6 -3h12M-6 3h12" stroke="#334155" stroke-width="1.2"/></g>';
  }
  function head(x, y, r, txt) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#e2e8f0" stroke="' + C.ink + '" stroke-width="2"/>' + (txt ? t(x, y + 5, txt, { size: 13, weight: 700 }) : ''); }
  function wedge(x, y, w, h, txt) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="#1e293b"/>' + t(x + w / 2, y + h / 2 + 5, txt || '모니터', { size: 13, fill: '#fff', weight: 700 }); }
  function wave(x0, y0, w, amp, cyc, cut, col) {   // 사인파(cut 이 있으면 ±cut 에서 잘린 모양)
    var d = '';
    for (var i = 0; i <= 120; i++) { var u = i / 120, v = Math.sin(u * cyc * 2 * Math.PI) * amp; if (cut != null) v = Math.max(-cut, Math.min(cut, v)); d += (i ? 'L' : 'M') + (x0 + u * w).toFixed(1) + ' ' + (y0 - v).toFixed(1); }
    return '<path d="' + d + '" fill="none" stroke="' + (col || C.teal) + '" stroke-width="3" stroke-linejoin="round"/>';
  }
  var V = {
    micTypes: function () {
      var dyn = '<g transform="translate(20,20)"><rect width="260" height="190" rx="14" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(130, 26, '다이내믹 (코일 + 자석)', { weight: 800, size: 14 }) +
        '<path d="M60 70 q-14 40 0 80" stroke="' + C.teal + '" stroke-width="4" fill="none"/>' + t(52, 170, '진동판', { size: 11, fill: C.sub }) +
        '<rect x="66" y="96" width="44" height="28" rx="4" fill="none" stroke="' + C.amber + '" stroke-width="3"/>' + '<path d="M70 100 q5 10 0 20 M80 100 q5 10 0 20 M90 100 q5 10 0 20 M100 100 q5 10 0 20" stroke="' + C.amber + '" stroke-width="2" fill="none"/>' + t(88, 88, '코일', { size: 11, fill: C.sub }) +
        '<rect x="122" y="78" width="70" height="64" rx="6" fill="#64748b"/><rect x="122" y="104" width="70" height="12" fill="#94a3b8"/>' + t(157, 160, '자석', { size: 11, fill: C.sub }) +
        '<path d="M200 110 h40" stroke="' + C.blue + '" stroke-width="3"/><path d="M234 104 l8 6 -8 6" fill="none" stroke="' + C.blue + '" stroke-width="3"/>' + t(222, 96, '전기', { size: 11, fill: C.blue }) +
        t(130, 184, '전원 필요 없음 · 튼튼함', { size: 12, fill: C.green, weight: 700 }) + '</g>';
      var con = '<g transform="translate(300,20)"><rect width="260" height="190" rx="14" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(130, 26, '콘덴서 (얇은 판 + 단단한 판)', { weight: 800, size: 14 }) +
        '<path d="M80 62 q-10 48 0 96" stroke="' + C.teal + '" stroke-width="3" fill="none"/>' + t(70, 172, '얇은 진동판', { size: 11, fill: C.sub }) +
        '<rect x="104" y="62" width="10" height="96" rx="2" fill="#64748b"/>' + t(118, 172, '단단한 판', { size: 11, fill: C.sub, anchor: 'start' }) +
        '<path d="M86 110 h16" stroke="' + C.red + '" stroke-width="2" stroke-dasharray="3 3"/>' + t(94, 54, '사이가 바뀜', { size: 11, fill: C.red }) +
        '<path d="M120 70 h60 v-20" stroke="' + C.amber + '" stroke-width="2.5" fill="none"/>' + t(190, 44, '전원(+48V)', { size: 11, fill: C.amber, anchor: 'start' }) +
        '<path d="M120 140 h80" stroke="' + C.blue + '" stroke-width="3"/><path d="M194 134 l8 6 -8 6" fill="none" stroke="' + C.blue + '" stroke-width="3"/>' + t(206, 144, '전기', { size: 11, fill: C.blue, anchor: 'start' }) +
        t(130, 184, '전원 필요 · 섬세함', { size: 12, fill: C.amber, weight: 700 }) + '</g>';
      return svg(580, 230, dyn + con, '다이내믹과 콘덴서 마이크 구조 비교');
    },
    polar: function () {
      var R = 52, y = 92;
      return svg(600, 200, polarCard(75, y, R, 1, '무지향 (옴니)', '모든 방향 같음', C.blue) + polarCard(225, y, R, 0.5, '카디오이드', '빈 곳: 뒤 180°', C.teal) +
        polarCard(375, y, R, 0.366, '슈퍼카디오이드', '빈 곳: 뒤 양옆 약 126°', '#7c3aed') + polarCard(525, y, R, 0, '8자 (양지향)', '빈 곳: 옆 90°', C.amber), '마이크 지향성 네 가지 폴라 패턴');
    },
    freq: function () {
      var x0 = 50, x1 = 560, y0 = 30, y1 = 170, fx = function (f) { return x0 + (Math.log10(f) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * (x1 - x0); }, fy = function (db) { return y0 + (10 - db) / 25 * (y1 - y0); };
      var grid = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].map(function (f) { return '<path d="M' + fx(f) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.line + '"/>' + t(fx(f), y1 + 16, f >= 1000 ? (f / 1000) + 'k' : f, { size: 10, fill: C.sub }); }).join('') +
        [10, 0, -10].map(function (d) { return '<path d="M' + x0 + ' ' + fy(d) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="' + (d ? '3 3' : '0') + '"/>' + t(x0 - 6, fy(d) + 4, (d > 0 ? '+' : '') + d, { size: 10, fill: C.sub, anchor: 'end' }); }).join('');
      var pts = [[50, -9], [80, -5], [120, -2], [200, -0.5], [500, 0], [1000, 0], [2000, 1.5], [3500, 4], [5000, 4.5], [7000, 2], [10000, -1], [15000, -6]];
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + fx(p[0]).toFixed(1) + ' ' + fy(p[1]).toFixed(1); }).join('');
      return svg(600, 210, grid + '<path d="' + d + '" fill="none" stroke="' + C.teal + '" stroke-width="3"/>' +
        t(fx(4200), fy(4.5) - 10, '말이 또렷하게 (중간~높은 소리 ↑)', { size: 11, fill: C.teal }) + t(fx(70), fy(-9) + 22, '낮은 소리 줄임', { size: 11, fill: C.teal }) +
        t(x1, 18, '보컬 마이크 그래프 「예시」 (실제 제품을 잰 값 아님)', { size: 11, fill: C.sub, anchor: 'end' }) + t(x0 + 4, 18, 'dB', { size: 10, fill: C.sub, anchor: 'start' }) +
        t(x0, 204, '← 낮은 소리', { size: 10, fill: C.sub, anchor: 'start' }) + t((x0 + x1) / 2, 204, '소리 높낮이 (Hz, 1초에 떨리는 횟수)', { size: 10, fill: C.sub }) + t(x1, 204, '높은 소리 →', { size: 10, fill: C.sub, anchor: 'end' }), '보컬 마이크 주파수 응답 예시 그래프');
    },
    distance: function () {
      var ds = [5, 10, 20, 40], base = 30, x0 = 70;
      var bars = ds.map(function (d, i) { var db = -20 * Math.log10(d / 5), h = 120 + db * 4.5, x = x0 + i * 130;
        return '<rect x="' + x + '" y="' + (170 - h) + '" width="70" height="' + h + '" rx="6" fill="' + C.teal + '" fill-opacity="' + (1 - i * 0.18) + '"/>' + t(x + 35, 165 - h, (db ? db.toFixed(0) : '0') + ' dB', { size: 13, weight: 800 }) + t(x + 35, 192, d + ' cm', { size: 12, fill: C.sub }); }).join('');
      return svg(600, 210, bars + t(560, 24, '입과 마이크 거리가 2배 → 목소리 약 −6 dB (울림 없는 곳 기준)', { size: 11, fill: C.sub, anchor: 'end' }), '거리에 따른 목소리 크기 변화');
    },
    proximity: function () {
      var x0 = 60, x1 = 560, y0 = 30, y1 = 170, fx = function (cm) { return x0 + (Math.log10(cm) - Math.log10(1)) / (Math.log10(100) - Math.log10(1)) * (x1 - x0); }, fy = function (db) { return y1 - db / 30 * (y1 - y0); };
      function boost(a, cm) { var k = 2 * Math.PI * 100 / 343, r = cm / 100, g = a + (1 - a) * Math.sqrt(1 + 1 / Math.pow(k * r, 2)); return 20 * Math.log10(g); }
      function curve(a) { var d = ''; for (var cm = 1; cm <= 100; cm *= 1.08) d += (d ? 'L' : 'M') + fx(cm).toFixed(1) + ' ' + fy(Math.min(30, boost(a, cm))).toFixed(1); return d; }
      var grid = [1, 2, 5, 10, 20, 50, 100].map(function (c) { return '<path d="M' + fx(c) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.line + '"/>' + t(fx(c), y1 + 16, c + 'cm', { size: 10, fill: C.sub }); }).join('') +
        [0, 10, 20, 30].map(function (d) { return '<path d="M' + x0 + ' ' + fy(d) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(x0 - 6, fy(d) + 4, '+' + d, { size: 10, fill: C.sub, anchor: 'end' }); }).join('');
      return svg(600, 210, grid + '<path d="' + curve(0.5) + '" fill="none" stroke="' + C.teal + '" stroke-width="3"/><path d="' + curve(1) + '" fill="none" stroke="' + C.blue + '" stroke-width="3" stroke-dasharray="6 4"/>' +
        t(fx(9), fy(20), '카디오이드: 가까울수록 저음 ↑', { size: 12, fill: C.teal, anchor: 'start', weight: 700 }) + t(fx(4), fy(0) - 8, '무지향: 거의 변화 없음', { size: 12, fill: C.blue, anchor: 'start', weight: 700 }) +
        t(x1, 18, '100 Hz 낮은 소리가 커지는 양 (교육용 계산)', { size: 11, fill: C.sub, anchor: 'end' }) + t(x0, 18, 'dB', { size: 10, fill: C.sub, anchor: 'start' }) +
        t((x0 + x1) / 2, 204, '입과 마이크 사이 거리', { size: 10, fill: C.sub }), '근접 효과: 거리에 따른 저음 증가');
    },
    phantom: function () {
      var pin = function (x, y, n, col) { return '<circle cx="' + x + '" cy="' + y + '" r="13" fill="' + (col ? '#fff7ed' : '#fff') + '" stroke="' + (col || C.ink) + '" stroke-width="2"/>' + t(x, y + 5, n, { size: 13, weight: 800, fill: col || C.ink }); };
      var leg = function (y, n, txt, col) { return t(30, y, n, { size: 12, weight: 800, fill: col || C.ink, anchor: 'start' }) + t(46, y, txt, { size: 12, fill: col || C.sub, anchor: 'start' }); };
      return svg(600, 200, '<circle cx="90" cy="70" r="52" fill="' + C.bg + '" stroke="' + C.ink + '" stroke-width="3"/>' + pin(70, 52, '1') + pin(110, 52, '2', C.amber) + pin(90, 92, '3', C.amber) +
        leg(146, '1', '그라운드 (돌아오는 길)') + leg(164, '2', '+48V · 소리(+)', C.amber) + leg(182, '3', '+48V · 소리(−)', C.amber) + t(90, 12, 'XLR 핀 (IEC 61938, P48)', { size: 11, fill: C.sub }) +
        '<rect x="230" y="40" width="120" height="70" rx="10" fill="#0f2747"/>' + t(290, 72, '콘솔', { size: 14, fill: '#fff', weight: 800 }) + t(290, 92, '+48V ON', { size: 11, fill: '#fde68a' }) +
        '<path d="M350 75 H470" stroke="' + C.ink + '" stroke-width="4"/><path d="M350 66 H470" stroke="' + C.amber + '" stroke-width="2" stroke-dasharray="6 4"/>' + t(410, 56, '전기 →', { size: 11, fill: C.amber }) + t(410, 98, '← 소리', { size: 11, fill: C.blue }) +
        '<rect x="470" y="50" width="90" height="50" rx="25" fill="#334155"/>' + t(515, 80, '콘덴서', { size: 12, fill: '#fff', weight: 700 }) +
        t(400, 150, 'XLR 선 하나로 전기와 소리가 함께 다녀요', { size: 12, fill: C.ink }) + t(400, 170, '꽂고 뺄 때는 +48V 를 꺼요', { size: 11, fill: C.red }), '팬텀 전원과 XLR 핀');
    },
    levels: function () {
      var y = function (dbu) { return 180 - (dbu + 70) * 1.9; };
      var band = function (a, b, col, name, note) { return '<rect x="150" y="' + y(b) + '" width="160" height="' + (y(a) - y(b)) + '" rx="6" fill="' + col + '" fill-opacity=".85"/>' + t(160, y(b) + 18, name, { size: 13, fill: '#fff', weight: 800, anchor: 'start' }) + t(330, (y(a) + y(b)) / 2 + 4, note, { size: 11, fill: C.sub, anchor: 'start' }); };
      var ticks = [-60, -40, -20, 0, 20].map(function (d) { return '<path d="M120 ' + y(d) + 'H140" stroke="' + C.sub + '"/>' + t(114, y(d) + 4, (d > 0 ? '+' : '') + d, { size: 10, fill: C.sub, anchor: 'end' }); }).join('');
      return svg(600, 200, ticks + t(80, 20, 'dBu', { size: 10, fill: C.sub }) + band(-60, -30, C.teal, '마이크 레벨', '대략 −60 ~ −30 dBu (목소리·마이크에 따라 다름)') + band(-10, 14, C.blue, '라인 레벨', '기준 +4 dBu (프로 장비)') + t(230, 90, '↑ GAIN 으로 키워요', { size: 11, fill: C.teal, weight: 700 }) +
        '<path d="M150 ' + y(20) + 'H310" stroke="' + C.red + '" stroke-width="2" stroke-dasharray="5 4"/>' + t(330, y(20) + 4, '찌그러지는 천장(클리핑) — 장비마다 달라요', { size: 11, fill: C.red, anchor: 'start' }) +
        t(560, 190, '스피커 레벨은 장비마다 달라서 숫자 하나로 말하지 않아요', { size: 10, fill: C.sub, anchor: 'end' }), '마이크 레벨과 라인 레벨 비교');
    },
    chain: function () {
      var st = [['입력', '마이크'], ['GAIN', '처음 키우기'], ['HPF·EQ', '소리 빛깔'], ['ON', '켜기/끄기'], ['페이더', '섞는 양'], ['ST 버스', '한데 모으기'], ['마스터', '마지막 크기']];
      var w = 74, gap = 10;
      return svg(600, 130, st.map(function (s, i) { var x = 6 + i * (w + gap), hot = i === 1 || i === 4;
        return '<rect x="' + x + '" y="30" width="' + w + '" height="56" rx="10" fill="' + (hot ? C.teal : C.bg) + '" stroke="' + (hot ? C.teal : C.line) + '" stroke-width="2"/>' + t(x + w / 2, 56, s[0], { size: 13, weight: 800, fill: hot ? '#fff' : C.ink }) + t(x + w / 2, 74, s[1], { size: 10, fill: hot ? '#e0f2fe' : C.sub }) +
          (i < st.length - 1 ? '<path d="M' + (x + w + 1) + ' 58 h' + (gap - 2) + '" stroke="' + C.ink + '" stroke-width="2"/>' : ''); }).join('') +
        t(6 + 1 * (w + gap) + w / 2, 108, '입력 크기 맞추기', { size: 11, fill: C.teal, weight: 700 }) + t(6 + 4 * (w + gap) + w / 2, 108, '균형 맞추기', { size: 11, fill: C.teal, weight: 700 }) +
        t(6, 18, '채널 안에서 소리가 지나는 순서 (MG12XU 를 간단히)', { size: 11, fill: C.sub, anchor: 'start' }), '콘솔 채널 안에서 소리가 지나는 순서');
    },
    stages: function () {
      function row(y, name, vals, col, note) {
        var x0 = 130, sw = 80;
        return t(120, y + 20, name, { size: 12, weight: 800, anchor: 'end' }) + vals.map(function (v, i) { var h = Math.max(4, Math.min(40, (v + 50) * 0.8));
          return '<rect x="' + (x0 + i * sw) + '" y="' + (y + 32 - h) + '" width="60" height="' + h + '" rx="4" fill="' + (v > 18 ? C.red : col) + '"/>'; }).join('') + t(x0 + 3 * sw + 10, y + 22, note, { size: 12, fill: C.sub, anchor: 'start' });
      }
      var heads = ['GAIN 뒤', '페이더 뒤', '마스터 뒤'].map(function (h, i) { return t(160 + i * 80, 16, h, { size: 11, fill: C.sub }); }).join('');
      return svg(600, 200, heads + row(36, '알맞음', [4, 4, 4], C.green, '깨끗하고 여유가 충분해요') + row(90, 'GAIN 작음', [-24, -4, -4], C.amber, '페이더로 키우면 잡음도 함께 커져요') + row(144, 'GAIN 큼', [22, 4, 4], C.blue, '앞에서 이미 찌그러져 뒤에서 못 고쳐요'), '단계별 레벨 비교');
    },
    meter: function () {
      var segs = [[-30, C.green], [-20, C.green], [-10, C.green], [-6, C.green], [-3, C.green], [0, C.amber], [3, C.amber], [6, C.amber], [10, C.red]];
      var m = segs.map(function (s, i) { var y = 170 - i * 17, on = s[0] <= 3; return '<rect x="70" y="' + y + '" width="34" height="13" rx="2" fill="' + s[1] + '" fill-opacity="' + (on ? 1 : 0.18) + '"/>' + t(62, y + 10, (s[0] > 0 ? '+' : '') + s[0], { size: 10, fill: C.sub, anchor: 'end' }); }).join('');
      return svg(600, 200, m + '<circle cx="140" cy="38" r="8" fill="' + C.red + '" fill-opacity=".2" stroke="' + C.red + '"/>' + t(154, 42, 'PEAK (꺼짐)', { size: 11, fill: C.red, anchor: 'start' }) +
        t(87, 196, 'PFL 미터', { size: 11, fill: C.sub }) +
        '<g font-size="12">' + ['① GAIN·페이더 내리고 PFL 누르기', '② 실제처럼 노래·말 하기', '③ 큰 부분에서 가끔 0 을 넘게 GAIN 맞추기', '④ PEAK 가 켜지면 GAIN 조금 내리기', '⑤ PFL 끄고 페이더로 크기 맞추기'].map(function (s, i) { return t(250, 52 + i * 28, s, { size: 13, anchor: 'start' }); }).join('') + '</g>', 'PFL 미터로 GAIN 맞추는 순서');
    },
    headroom: function () {
      return svg(600, 200, '<rect x="60" y="20" width="200" height="160" rx="8" fill="' + C.bg + '" stroke="' + C.line + '"/>' +
        '<rect x="60" y="150" width="200" height="30" fill="#94a3b8" fill-opacity=".5"/>' + t(160, 170, '노이즈 플로어 (바닥 · 늘 깔린 잡음)', { size: 11 }) +
        '<path d="M60 40 H260" stroke="' + C.red + '" stroke-width="3"/>' + t(160, 34, '클리핑 (천장 · 찌그러짐)', { size: 11, fill: C.red, weight: 700 }) +
        '<path d="M60 90 H260" stroke="' + C.green + '" stroke-width="3" stroke-dasharray="6 4"/>' + t(160, 84, '평소 크기', { size: 11, fill: C.green, weight: 700 }) +
        '<path d="M280 42 V88" stroke="' + C.teal + '" stroke-width="3"/><path d="M274 48 l6 -8 6 8 M274 82 l6 8 6 -8" fill="none" stroke="' + C.teal + '" stroke-width="2"/>' + t(292, 70, '헤드룸 (머리 위 여유)', { size: 12, fill: C.teal, weight: 800, anchor: 'start' }) +
        '<path d="M280 92 V148" stroke="' + C.blue + '" stroke-width="3"/>' + t(292, 124, '신호 대 잡음', { size: 12, fill: C.blue, weight: 800, anchor: 'start' }) +
        '<path d="M44 40 V178" stroke="' + C.amber + '" stroke-width="3"/><path d="M38 46 l6 -8 6 8 M38 172 l6 8 6 -8" fill="none" stroke="' + C.amber + '" stroke-width="2"/>' + '<text x="32" y="109" font-size="11" fill="#b45309" font-weight="800" text-anchor="middle" transform="rotate(-90 32 109)">다이내믹 레인지</text>' +
        t(292, 160, '평소 크기가 천장에 붙으면 쉽게 찌그러지고,', { size: 11, fill: C.sub, anchor: 'start' }) + t(292, 176, '바닥에 붙으면 잡음이 들려요.', { size: 11, fill: C.sub, anchor: 'start' }), '헤드룸과 노이즈 플로어');
    },

    /* ===================== 2026-11-04 「그림으로 보기」 — 01-1 유선 마이크 ===================== */
    micTermSens: function () {   // 용어: 감도 — 같은 소리, 다른 크기의 신호
      var arcs = [12, 24, 36].map(function (r) { return '<path d="M' + (14 + r * 0.5).toFixed(1) + ' ' + (74 - r * 0.87).toFixed(1) + 'A' + r + ' ' + r + ' 0 0 1 ' + (14 + r * 0.5).toFixed(1) + ' ' + (74 + r * 0.87).toFixed(1) + '" fill="none" stroke="' + C.teal + '" stroke-width="2.5"/>'; }).join('');
      var row = function (y, name, w, col, txt, inside) { return micG(118, y, -90, 0.8) + t(156, y + 5, name, { size: 13, weight: 700, anchor: 'start' }) + arw(212, y, 232, y, C.sub, 2) +
        '<rect x="240" y="' + (y - 9) + '" width="' + w + '" height="18" rx="4" fill="' + col + '"/>' + (inside ? t(240 + w / 2, y + 5, txt, { size: 13, fill: '#fff', weight: 700 }) : t(246 + w, y + 5, txt, { size: 13, fill: C.sub, anchor: 'start' })); };
      return svgS(360, 140, arcs + t(40, 130, '같은 소리', { size: 13, weight: 700 }) + '<path d="M58 74 L104 48 M58 74 L104 100" stroke="' + C.line + '" stroke-width="2"/>' +
        row(48, '감도 낮음', 30, C.teal, '작게 나와요') + row(100, '감도 높음', 108, C.blue, '크게 나와요', true), '감도: 같은 소리에서 감도가 높은 마이크가 더 큰 전기를 내요');
    },
    micTermCardioid: function () {   // 용어: 카디오이드 — 하트 모양, 앞은 잘, 뒤는 덜
      var cx = 80, cy = 78, R = 52;
      return svgS(360, 140, '<path d="M' + cx + ' ' + (cy - R - 4) + 'V' + (cy + 18) + 'M' + (cx - R - 6) + ' ' + cy + 'H' + (cx + R + 6) + '" stroke="' + C.line + '"/>' +
        '<path d="' + polarPath(cx, cy, R, 0.5) + '" fill="' + C.teal + '" fill-opacity=".18" stroke="' + C.teal + '" stroke-width="2.5"/>' + micG(cx, cy, 0, 0.5) +
        t(cx, 18, '앞', { size: 13, weight: 800, fill: C.teal }) + t(cx, 120, '뒤', { size: 13, weight: 800, fill: C.red }) +
        t(166, 44, '앞: 가장 잘 받아요', { size: 13, weight: 700, fill: C.teal, anchor: 'start' }) + t(166, 74, '옆: 절반쯤 받아요', { size: 13, fill: C.sub, anchor: 'start' }) + t(166, 104, '뒤: 가장 덜 받아요', { size: 13, weight: 700, fill: C.red, anchor: 'start' }),
        '카디오이드: 하트 모양으로 앞은 잘 받고 뒤는 가장 덜 받아요');
    },
    micTermProx: function () {   // 용어: 근접 효과 — 바짝 대면 저음 막대만 커져요
      var panel = function (x, title, low, col) {
        return rect(x, 4, 170, 132) + t(x + 85, 26, title, { size: 13, weight: 700 }) + [[low, col, '저음'], [36, C.teal, '중음'], [36, C.teal, '고음']].map(function (b, i) { var bx = x + 22 + i * 48;
          return '<rect x="' + bx + '" y="' + (108 - b[0]) + '" width="30" height="' + b[0] + '" rx="4" fill="' + b[1] + '"/>' + t(bx + 15, 127, b[2], { size: 13, fill: C.sub }); }).join('');
      };
      return svgS(360, 140, panel(6, '입에서 15 cm', 36, C.teal) + panel(184, '입에 바짝 3 cm', 68, C.amber), '근접 효과: 마이크를 입에 바짝 대면 저음만 커져요');
    },
    micTermLoop: function () {   // 용어: 피드백 — 마이크 → 콘솔·앰프 → 스피커 → 다시 마이크
      var bx = function (x, y, s) { return rect(x, y, 84, 34, { fill: '#fff', stroke: C.ink, sw: 2 }) + t(x + 42, y + 22, s, { size: 13, weight: 700 }); };
      var end = [58, 94], c = [180, 176], a = Math.atan2(end[1] - c[1], end[0] - c[0]), L = 9;
      return svgS(360, 150, bx(14, 56, '마이크') + bx(138, 8, '콘솔·앰프') + bx(262, 56, '스피커') + arw(66, 56, 136, 32, C.ink, 2.5) + arw(224, 32, 294, 56, C.ink, 2.5) +
        '<path d="M304 92 Q' + c[0] + ' ' + c[1] + ' ' + end[0] + ' ' + end[1] + '" stroke="' + C.red + '" stroke-width="2.5" fill="none" stroke-dasharray="6 4"/>' +
        '<path d="M' + (end[0] - L * Math.cos(a - 0.45)).toFixed(1) + ' ' + (end[1] - L * Math.sin(a - 0.45)).toFixed(1) + 'L' + end[0] + ' ' + end[1] + 'L' + (end[0] - L * Math.cos(a + 0.45)).toFixed(1) + ' ' + (end[1] - L * Math.sin(a + 0.45)).toFixed(1) + '" stroke="' + C.red + '" stroke-width="2.5" fill="none"/>' +
        t(180, 84, '삐-', { size: 20, weight: 800, fill: C.red }) + t(180, 112, '소리가 다시 마이크로', { size: 13, fill: C.red }), '피드백: 스피커 소리가 다시 마이크로 들어가 돌고 돌며 커져요');
    },
    micTermPhantom: function () {   // 용어: 팬텀 전원 — 선 하나로 전기와 소리가 함께
      return svgS(360, 120, '<rect x="8" y="30" width="86" height="48" rx="10" fill="' + C.ink + '"/>' + t(51, 51, '콘솔', { size: 14, fill: '#fff', weight: 800 }) + t(51, 70, '+48V', { size: 13, fill: '#fde68a', weight: 700 }) +
        '<path d="M94 54 H266" stroke="' + C.ink + '" stroke-width="4"/>' + arw(118, 40, 244, 40, C.amber, 2.5, '6 4') + t(180, 31, '전기', { size: 13, fill: C.amber, weight: 700 }) +
        arw(244, 68, 118, 68, C.blue, 2.5) + t(180, 90, '소리', { size: 13, fill: C.blue, weight: 700 }) +
        '<rect x="266" y="30" width="86" height="48" rx="24" fill="#334155"/>' + t(309, 59, '콘덴서', { size: 13, fill: '#fff', weight: 700 }) +
        t(180, 114, 'XLR 선 하나로 둘 다 다녀요', { size: 13 }), '팬텀 전원: 마이크 선 하나로 전기와 소리가 함께 다녀요');
    },
    micPickup: function () {   // 이론 2: 잘 받는 폭(픽업 각도) 약 130° · 옆 −6 dB · 거리 계수
      var cx = 120, cy = 112, R = 70, W = 82, s = Math.sin(65 * Math.PI / 180), c = Math.cos(65 * Math.PI / 180);
      return svgS(420, 210, '<path d="M' + cx + ' ' + cy + 'L' + (cx - W * s).toFixed(1) + ' ' + (cy - W * c).toFixed(1) + 'A' + W + ' ' + W + ' 0 0 1 ' + (cx + W * s).toFixed(1) + ' ' + (cy - W * c).toFixed(1) + 'Z" fill="' + C.teal + '" fill-opacity=".1" stroke="' + C.teal + '" stroke-dasharray="5 4"/>' +
        '<path d="' + polarPath(cx, cy, R, 0.5) + '" fill="' + C.teal + '" fill-opacity=".2" stroke="' + C.teal + '" stroke-width="2.5"/>' + micG(cx, cy, 0, 0.55) +
        t(cx, 22, '잘 받는 폭 약 130°', { size: 13, weight: 800, fill: C.teal }) +
        '<circle cx="' + (cx - R / 2) + '" cy="' + cy + '" r="5" fill="' + C.amber + '"/><circle cx="' + (cx + R / 2) + '" cy="' + cy + '" r="5" fill="' + C.amber + '"/>' +
        t(cx, 150, '옆(90°): 약 −6 dB', { size: 13, fill: C.amber, weight: 700 }) + t(cx, 174, '뒤(180°): 가장 작아요', { size: 13, fill: C.red, weight: 700 }) +
        t(250, 62, '카디오이드는', { size: 13, anchor: 'start' }) + t(250, 82, '주변 소리를 덜 받아요.', { size: 13, anchor: 'start' }) +
        t(250, 122, '그래서 무지향보다', { size: 13, anchor: 'start', fill: C.teal, weight: 700 }) + t(250, 142, '약 1.7배 멀리 둬도', { size: 13, anchor: 'start', fill: C.teal, weight: 700 }) + t(250, 162, '비슷하게 들려요.', { size: 13, anchor: 'start', fill: C.teal, weight: 700 }) +
        t(250, 190, '(거리 계수)', { size: 12, anchor: 'start', fill: C.sub }), '카디오이드의 잘 받는 폭 약 130도와 거리 계수');
    },
    micMonitorPlace: function () {   // 이론 2: ○ 모니터는 마이크 뒤 / × 마이크 앞쪽
      var p = function (x0, ok) {
        var mx = x0 + 106, my = 104;
        return rect(x0, 4, 212, 222) + head(mx, 34, 15) + t(mx + 22, 39, '보컬', { size: 13, anchor: 'start', fill: C.sub }) +
          '<path d="' + polarPath(mx, my, 44, 0.5) + '" fill="' + C.teal + '" fill-opacity=".16" stroke="' + C.teal + '" stroke-width="2"/>' + micG(mx, my, 0, 0.6) +
          (ok ? wedge(mx - 32, 146, 64, 26) + arw(mx, 144, mx, 128, C.green, 2.5) :
            wedge(x0 + 140, 58, 64, 26) + arw(x0 + 150, 86, x0 + 128, 98, C.red, 2.5) + t(x0 + 168, 122, '삐-', { size: 18, weight: 800, fill: C.red })) +
          mark(x0 + 24, 196, ok) + t(x0 + 44, 201, ok ? '모니터는 마이크 뒤' : '모니터가 마이크 앞쪽', { size: 14, weight: 800, anchor: 'start', fill: ok ? C.green : C.red }) +
          t(x0 + 44, 219, ok ? '잘 안 받는 쪽이라 안전해요' : '잘 받는 쪽이라 삐- 가 나요', { size: 12, anchor: 'start', fill: C.sub });
      };
      return svgS(440, 230, p(4, true) + p(224, false), '모니터 스피커 위치: 마이크 뒤는 좋고, 마이크 앞쪽은 피드백이 나요');
    },
    micAim: function () {   // 이론 4: ○ 입 정면 · 주먹 하나 / × 멀고 비껴 있음
      var p = function (x0, ok) {
        return rect(x0, 4, 212, 192) + head(x0 + 50, 78, 26) + '<circle cx="' + (x0 + 74) + '" cy="' + 86 + '" r="3.5" fill="' + C.red + '"/>' + t(x0 + 50, 38, '입', { size: 12, fill: C.sub }) +
          (ok ? micG(x0 + 118, 86, -90, 0.8) + '<path d="M' + (x0 + 80) + ' 112 H' + (x0 + 110) + '" stroke="' + C.teal + '" stroke-width="2"/>' + t(x0 + 95, 132, '주먹 하나', { size: 13, fill: C.teal, weight: 700 }) :
            micG(x0 + 168, 56, 35, 0.8) + '<path d="M' + (x0 + 80) + ' 86 L' + (x0 + 160) + ' 62" stroke="' + C.line + '" stroke-width="2" stroke-dasharray="4 4"/>' + t(x0 + 140, 112, '멀고, 옆을 봐요', { size: 13, fill: C.red, weight: 700 })) +
          mark(x0 + 24, 160, ok) + t(x0 + 44, 165, ok ? '입 정면 · 가까이' : '멀고 비껴 있어요', { size: 14, weight: 800, anchor: 'start', fill: ok ? C.green : C.red }) +
          t(x0 + 44, 185, ok ? '목소리가 크고 또렷해요' : '작고 먹먹해져요', { size: 12, anchor: 'start', fill: C.sub });
      };
      return svgS(440, 200, p(4, true) + p(224, false), '마이크 방향과 거리: 입 정면 가까이는 좋고, 멀고 비껴 있으면 작고 먹먹해요');
    },
    micGrip: function () {   // 이론 5: ○ 몸통 잡기 / × 그릴 감싸기
      var p = function (x0, ok) {
        var hx = x0 + 52, hy = 66;
        return rect(x0, 4, 212, 152) + micG(hx, hy, -90, 1.6) + t(hx, 36, '그릴(머리)', { size: 12, fill: C.sub }) +
          (ok ? '<rect x="' + (x0 + 74) + '" y="50" width="40" height="32" rx="10" fill="' + C.amber + '" fill-opacity=".6"/><path d="M' + (x0 + 84) + ' 50v32M' + (x0 + 94) + ' 50v32M' + (x0 + 104) + ' 50v32" stroke="#b45309" stroke-width="1.2"/>' :
            '<circle cx="' + hx + '" cy="' + hy + '" r="25" fill="' + C.amber + '" fill-opacity=".6"/><path d="M' + (hx - 14) + ' ' + (hy - 20) + 'v40M' + hx + ' ' + (hy - 24) + 'v48M' + (hx + 14) + ' ' + (hy - 20) + 'v40" stroke="#b45309" stroke-width="1.2"/>') +
          t(x0 + 150, 71, '손잡이', { size: 12, fill: C.sub }) +
          mark(x0 + 24, 116, ok) + t(x0 + 44, 121, ok ? '손잡이를 잡아요' : '그릴을 감싸 쥐어요', { size: 14, weight: 800, anchor: 'start', fill: ok ? C.green : C.red }) +
          t(x0 + 44, 141, ok ? '음색 · 방향 그대로예요' : '음색이 변하고 삐- 가 잘 나요', { size: 12, anchor: 'start', fill: C.sub });
      };
      return svgS(440, 160, p(4, true) + p(224, false), '마이크 잡는 법: 손잡이를 잡고, 그릴을 감싸 쥐지 않아요');
    },
    mic31: function () {   // 심화: 3:1 법칙
      var hd = function (x, s) { return head(x, 34, 15, s); };
      return svgS(420, 186, hd(110, 'A') + hd(310, 'B') + micG(110, 86, 0, 0.7) + micG(310, 86, 0, 0.7) +
        arw(84, 60, 84, 40, C.teal, 2) + arw(84, 62, 84, 82, C.teal, 2) + t(74, 66, '1', { size: 16, weight: 800, fill: C.teal, anchor: 'end' }) +
        arw(200, 128, 122, 128, C.teal, 2) + arw(220, 128, 298, 128, C.teal, 2) + t(210, 122, '3 이상', { size: 15, weight: 800, fill: C.teal }) +
        t(210, 160, '마이크 사이 = 입과 마이크 거리의 3배 넘게', { size: 13 }) + t(210, 179, '그래야 두 마이크 소리가 섞여 이상해지지 않아요', { size: 12, fill: C.sub }), '3:1 법칙: 마이크 사이를 입과 마이크 거리의 3배 넘게 떨어뜨려요');
    },
    micQuizSuper: function () {   // 확인 문제 2: 그림을 보고 고르기(가 · 나 · 다)
      var cx = 180, cy = 104, spot = function (x, y, s) { return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="14" fill="#fff" stroke="' + C.ink + '" stroke-width="2"/>' + t(x, y + 5, s, { size: 14, weight: 800 }); };
      var s = Math.sin(125 * Math.PI / 180), c = Math.cos(125 * Math.PI / 180), D = 84;
      return svgS(360, 214, '<path d="' + polarPath(cx, cy, 54, 0.366) + '" fill="#7c3aed" fill-opacity=".15" stroke="#7c3aed" stroke-width="2.5"/>' + micG(cx, cy, 0, 0.55) +
        spot(cx, 30, '다') + spot(cx, cy + D, '가') + spot(cx - D * s, cy - D * c, '나') + spot(cx + D * s, cy - D * c, '나') +
        t(cx + 22, 26, '↑ 앞 (입 쪽)', { size: 12, fill: C.sub, anchor: 'start' }) + t(8, 20, '위에서 본 슈퍼카디오이드', { size: 12, fill: C.sub, anchor: 'start' }),
        '슈퍼카디오이드 마이크 둘레의 세 자리 가 나 다');
    },

    /* ===================== 2026-11-04 「그림으로 보기」 — 믹싱 01 Gain Structure ===================== */
    gsTermGain: function () {   // 용어: GAIN — 낮은 층(마이크 레벨)에서 높은 층(라인 레벨)으로
      return svgS(360, 140, rect(8, 98, 124, 34, { fill: C.teal, op: 0.15, stroke: C.teal }) + t(70, 120, '마이크 레벨', { size: 13, weight: 800, fill: C.teal }) + t(70, 88, '아주 작아요', { size: 13, fill: C.sub }) +
        rect(228, 28, 124, 34, { fill: C.blue, op: 0.15, stroke: C.blue }) + t(290, 50, '라인 레벨', { size: 13, weight: 800, fill: C.blue }) + t(290, 82, '쓰기 좋은 크기', { size: 13, fill: C.sub }) +
        arw(134, 104, 224, 50, C.teal, 4) + t(218, 118, 'GAIN 이 키워요', { size: 14, weight: 800, fill: C.teal }), 'GAIN: 아주 작은 마이크 신호를 라인 레벨까지 키워요');
    },
    gsTermHeadroom: function () {   // 용어: 헤드룸 — 방 안에서 뛰어도 머리가 안 닿는 여유
      var px = 96;
      return svgS(360, 150, '<path d="M14 24 H186" stroke="' + C.red + '" stroke-width="4"/>' + '<path d="M14 136 H186" stroke="#94a3b8" stroke-width="6"/>' +
        '<circle cx="' + px + '" cy="78" r="11" fill="#e2e8f0" stroke="' + C.ink + '" stroke-width="2.5"/><path d="M' + px + ' 89 V114 M' + px + ' 114 L' + (px - 12) + ' 136 M' + px + ' 114 L' + (px + 12) + ' 136 M' + (px - 16) + ' 98 L' + px + ' 94 L' + (px + 16) + ' 98" stroke="' + C.ink + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        arw(132, 50, 132, 28, C.teal, 2.5) + arw(132, 46, 132, 66, C.teal, 2.5) +
        t(204, 29, '천장: 찌그러짐', { size: 13, weight: 700, fill: C.red, anchor: 'start' }) + t(204, 58, '헤드룸', { size: 14, weight: 800, fill: C.teal, anchor: 'start' }) + t(204, 77, '(머리 위 여유)', { size: 13, fill: C.teal, anchor: 'start' }) +
        t(204, 102, '넉넉해야 뛰어도', { size: 13, fill: C.sub, anchor: 'start' }) + t(204, 119, '천장에 안 닿아요', { size: 13, fill: C.sub, anchor: 'start' }) + t(204, 141, '바닥: 늘 깔린 잡음', { size: 13, fill: C.sub, anchor: 'start' }),
        '헤드룸: 평소 크기와 찌그러지는 천장 사이의 여유');
    },
    gsTermClip: function () {   // 용어: 클리핑 — 파형의 위아래가 잘림
      return svgS(360, 130, rect(4, 4, 170, 122, { fill: '#fff' }) + t(89, 24, '원래 소리', { size: 13, weight: 700 }) + wave(16, 74, 146, 32, 1.5, null, C.teal) +
        rect(186, 4, 170, 122, { fill: '#fff' }) + t(271, 24, '클리핑', { size: 13, weight: 700, fill: C.red }) +
        '<path d="M194 56 H348 M194 92 H348" stroke="' + C.red + '" stroke-width="1.5" stroke-dasharray="4 3"/>' + wave(198, 74, 146, 32, 1.5, 18, C.red) +
        t(89, 119, '둥근 모양', { size: 13, fill: C.sub }) + t(271, 119, '위아래가 잘려요', { size: 13, fill: C.red }), '클리핑: 소리 모양의 위아래가 잘려 찌그러져요');
    },
    gsTermPfl: function () {   // 용어: PFL — 페이더 앞 소리를 헤드폰 · 미터로 미리
      var bx = function (x, w, s, hot) { return rect(x, 28, w, 34, { fill: hot ? C.teal : '#fff', stroke: hot ? C.teal : C.ink, sw: 2 }) + t(x + w / 2, 50, s, { size: 13, weight: 700, fill: hot ? '#fff' : C.ink }); };
      return svgS(360, 140, bx(6, 56, '입력') + bx(80, 64, 'GAIN') + bx(206, 64, '페이더') + bx(292, 60, '출력') + arw(62, 45, 78, 45, C.ink, 2) + arw(144, 45, 204, 45, C.ink, 2) + arw(270, 45, 290, 45, C.ink, 2) +
        '<circle cx="176" cy="45" r="6" fill="' + C.amber + '"/><path d="M176 51 V88" stroke="' + C.amber + '" stroke-width="2.5"/>' +
        '<path d="M160 108 A16 16 0 0 1 192 108" fill="none" stroke="' + C.ink + '" stroke-width="3"/><rect x="155" y="104" width="8" height="14" rx="3" fill="' + C.ink + '"/><rect x="189" y="104" width="8" height="14" rx="3" fill="' + C.ink + '"/>' +
        t(206, 106, '헤드폰 · 미터로', { size: 13, anchor: 'start' }) + t(206, 125, '미리 들어요', { size: 13, anchor: 'start', weight: 700, fill: C.amber }) +
        t(80, 106, '페이더 위치와', { size: 13, fill: C.sub }) + t(80, 124, '상관없이 들려요', { size: 13, fill: C.sub }), 'PFL: 페이더 앞의 소리를 헤드폰과 미터로 미리 들어요');
    },
    gsLevelStairs: function () {   // 이론 1: 계단 비유 — 마이크 → 라인 → 스피커 레벨
      var step = function (x, y, w, col, name, sub) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (194 - y) + '" fill="' + col + '" fill-opacity=".2" stroke="' + col + '" stroke-width="2"/>' + t(x + w / 2, y + 22, name, { size: 14, weight: 800, fill: col }) + t(x + w / 2, y + 40, sub, { size: 12, fill: C.sub }); };
      return svgS(420, 200, step(8, 146, 132, C.teal, '마이크 레벨', '아주 작아요(mV)') + step(140, 98, 140, C.blue, '라인 레벨', '장비끼리 쓰는 크기') + step(280, 50, 132, C.amber, '스피커 레벨', '큰 힘(전력)') +
        arw(70, 138, 150, 88, C.ink, 2.5) + t(100, 100, '콘솔 GAIN', { size: 13, weight: 700, anchor: 'end' }) +
        arw(210, 90, 290, 40, C.ink, 2.5) + t(240, 50, '파워앰프', { size: 13, weight: 700, anchor: 'end' }), '신호 크기 계단: 마이크 레벨을 콘솔이 라인 레벨로, 파워앰프가 스피커 레벨로 키워요');
    },
    gsGainBranch: function () {   // 이론 2: GAIN 은 맨 앞 — 돌리면 뒤로 가는 길이 모두 바뀜
      var tg = function (y, s, hot) { return rect(196, y, 216, 36, { fill: hot ? '#ecfeff' : '#fff', stroke: hot ? C.teal : C.line, sw: 2 }) + t(304, y + 23, s, { size: 13, weight: 700, fill: hot ? C.teal : C.ink }); };
      return svgS(420, 186, '<rect x="8" y="68" width="84" height="44" rx="10" fill="' + C.teal + '"/>' + t(50, 96, 'GAIN', { size: 15, weight: 800, fill: '#fff' }) +
        arw(92, 90, 192, 34, C.teal, 2.5) + arw(92, 90, 192, 92, C.teal, 2.5) + arw(92, 90, 192, 150, C.teal, 2.5) +
        tg(16, '페이더 → 메인 스피커', true) + tg(74, 'AUX → 무대 모니터') + tg(132, '녹음 · 이펙트') +
        t(50, 136, '돌리면', { size: 12, fill: C.sub }) + t(50, 152, '셋 다 바뀌어요', { size: 12, fill: C.sub }), 'GAIN 을 바꾸면 메인 · 모니터 · 녹음으로 가는 소리가 모두 바뀌어요');
    },
    gsFaderScale: function () {   // 이론 3: 페이더 눈금 간격 — 0 dB 근처가 넓어요(예시)
      var mk = [['+10', 24], ['+5', 48], ['0', 78], ['−5', 108], ['−10', 134], ['−20', 162], ['−30', 182], ['−∞', 204]];
      return svgS(420, 214, '<rect x="64" y="20" width="10" height="188" rx="5" fill="#e2e8f0" stroke="' + C.line + '"/>' + '<rect x="52" y="71" width="34" height="14" rx="3" fill="' + C.ink + '"/>' +
        mk.map(function (m) { return '<path d="M90 ' + m[1] + 'H102" stroke="' + C.sub + '" stroke-width="1.5"/>' + t(108, m[1] + 4, m[0], { size: 12, fill: m[0] === '0' ? C.ink : C.sub, anchor: 'start', weight: m[0] === '0' ? 800 : null }); }).join('') +
        '<path d="M150 48 h-6 v60 h6" stroke="' + C.teal + '" stroke-width="2.5" fill="none"/>' + '<path d="M150 162 h-6 v42 h6" stroke="' + C.amber + '" stroke-width="2.5" fill="none"/>' +
        t(160, 66, '0 dB 근처: 눈금 사이가 넓어요', { size: 13, weight: 700, fill: C.teal, anchor: 'start' }) + t(160, 86, '→ 조금씩 섬세하게 맞추기 좋아요', { size: 12, anchor: 'start' }) +
        t(160, 176, '아래쪽: 눈금이 다닥다닥 붙어요', { size: 13, weight: 700, fill: C.amber, anchor: 'start' }) + t(160, 196, '→ 조금만 밀어도 크게 바뀌어요', { size: 12, anchor: 'start' }) +
        t(160, 128, '(눈금 간격은 콘솔마다 조금 달라요)', { size: 11, fill: C.sub, anchor: 'start' }), '페이더 눈금: 0 dB 근처는 간격이 넓고 아래쪽은 좁아요');
    },
    gsWhisper: function () {   // 이론 3: 같은 크기로 들려도 GAIN 작게 + 페이더 크게면 잡음이 커요
      var p = function (x0, ok) {
        var nz = ok ? 8 : 40;
        return rect(x0, 4, 212, 196) + mark(x0 + 22, 24, ok) + t(x0 + 42, 29, ok ? 'GAIN 알맞게' : 'GAIN 작게', { size: 14, weight: 800, anchor: 'start', fill: ok ? C.green : C.red }) +
          t(x0 + 42, 48, ok ? '페이더는 0 근처' : '페이더를 크게 올림', { size: 12, anchor: 'start', fill: C.sub }) +
          '<rect x="' + (x0 + 40) + '" y="62" width="50" height="104" rx="5" fill="' + C.teal + '"/>' + t(x0 + 65, 186, '목소리', { size: 13 }) +
          '<rect x="' + (x0 + 124) + '" y="' + (166 - nz) + '" width="50" height="' + nz + '" rx="4" fill="#94a3b8"/>' + t(x0 + 149, 186, '잡음(쉬-)', { size: 13 }) +
          t(x0 + 149, 158 - nz, ok ? '아주 작아요' : '잡음도 커져요', { size: 12, weight: 700, fill: ok ? C.green : C.red });
      };
      return svgS(440, 204, p(4, true) + p(224, false), '같은 크기로 들려도 GAIN 을 작게 하고 페이더로 키우면 잡음이 커져요');
    },
    gsMeterLight: function () {   // 이론 4: 미터 색 = 신호등 비유
      var lamp = function (y, col) { return '<circle cx="50" cy="' + y + '" r="20" fill="' + col + '"/>'; };
      var row = function (y, name, col, sub) { return t(100, y, name, { size: 14, weight: 800, fill: col, anchor: 'start' }) + t(100, y + 19, sub, { size: 12, anchor: 'start' }); };
      return svgS(420, 182, '<rect x="20" y="8" width="60" height="156" rx="14" fill="' + C.ink + '"/>' + lamp(40, C.red) + lamp(86, C.amber) + lamp(132, C.green) +
        row(36, '빨강 · PEAK', C.red, '너무 커요 → GAIN 을 조금 내려요') + row(82, '노랑 · 0 근처', '#b45309', '큰 부분에서 가끔 여기까지 → 좋아요') + row(128, '초록', C.green, '보통 크기 → 괜찮아요') +
        t(412, 176, '색이 바뀌는 높이는 콘솔마다 조금 달라요', { size: 11, fill: C.sub, anchor: 'end' }), '미터 색을 신호등처럼 읽기');
    },
    gsClipFix: function () {   // 이론 5: 찌그러짐은 페이더로 못 고치고 GAIN 으로 고쳐요
      var lim = function (y0) { return '<path d="M14 ' + (y0 - 18) + 'H130 M14 ' + (y0 + 18) + 'H130" stroke="' + C.red + '" stroke-width="1.2" stroke-dasharray="4 3"/>'; };
      var row = function (y0, ok) {
        return mark(20, y0 - 50, ok) + t(40, y0 - 45, ok ? 'GAIN 을 내리면' : '페이더만 내리면', { size: 14, weight: 800, anchor: 'start', fill: ok ? C.green : C.red }) +
          lim(y0) + wave(16, y0, 112, 30, 1.5, 18, C.red) + arw(140, y0, 178, y0, C.ink, 2.5) + t(159, y0 - 10, ok ? 'GAIN ↓' : '페이더 ↓', { size: 12, weight: 700 }) +
          (ok ? wave(188, y0, 112, 18, 1.5, null, C.green) : wave(188, y0, 112, 15, 1.5, 9, C.red)) +
          t(312, y0 - 4, ok ? '둥글고' : '작아져도', { size: 13, anchor: 'start', fill: ok ? C.green : C.red, weight: 700 }) + t(312, y0 + 14, ok ? '깨끗해요' : '잘린 그대로', { size: 13, anchor: 'start', fill: ok ? C.green : C.red, weight: 700 });
      };
      return svgS(400, 220, rect(2, 2, 396, 104, { fill: '#fff' }) + row(68, false) + rect(2, 114, 396, 104, { fill: '#fff' }) + row(180, true), '찌그러진 소리는 페이더로는 그대로이고 GAIN 을 내려야 깨끗해져요');
    },
    gsQuizStrip: function () {   // 확인 문제 4: 그림 속 채널 — GAIN 낮음, 페이더 +10
      var ang = -115 * Math.PI / 180, kx = 70, ky = 60;
      var mk = [['+10', 34], ['0', 84], ['−10', 124], ['−30', 166], ['−∞', 184]];
      var segs = [0, 1, 2, 3, 4, 5, 6].map(function (i) { var y = 168 - i * 20; return '<rect x="270" y="' + y + '" width="24" height="16" rx="2" fill="' + (i > 5 ? C.red : i > 3 ? C.amber : C.green) + '" fill-opacity="' + (i < 1 ? 1 : 0.18) + '"/>'; }).join('');
      return svgS(360, 214, t(kx, 20, 'GAIN', { size: 14, weight: 800 }) + '<circle cx="' + kx + '" cy="' + ky + '" r="24" fill="#334155"/>' +
        '<path d="M' + kx + ' ' + ky + 'L' + (kx + 20 * Math.sin(ang)).toFixed(1) + ' ' + (ky - 20 * Math.cos(ang)).toFixed(1) + '" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' + t(kx, 106, '거의 안 올림', { size: 13, weight: 700, fill: C.amber }) +
        t(170, 20, '페이더', { size: 14, weight: 800 }) + '<rect x="165" y="34" width="10" height="150" rx="5" fill="#e2e8f0" stroke="' + C.line + '"/>' +
        mk.map(function (m) { return '<path d="M182 ' + m[1] + 'H190" stroke="' + C.sub + '"/>' + t(194, m[1] + 4, m[0], { size: 12, fill: C.sub, anchor: 'start' }); }).join('') +
        '<rect x="153" y="27" width="34" height="14" rx="3" fill="' + C.red + '"/>' + t(170, 204, '+10 dB 까지 올림', { size: 13, weight: 700, fill: C.red }) +
        t(282, 20, '입력 미터', { size: 14, weight: 800 }) + segs + t(282, 204, '조금만 움직여요', { size: 12, fill: C.sub }), '그림 속 채널: GAIN 은 거의 안 올렸고 페이더는 플러스 10 dB 까지 올렸어요');
    },
    gsCeil: function () {   // 심화: 아날로그는 서서히, 디지털은 0 dBFS 에서 바로 잘림
      var soft = function (x0, y0, w, A) { var d = '', k = 1.8; for (var i = 0; i <= 120; i++) { var u = i / 120, v = A * Math.tanh(k * 1.5 * Math.sin(u * 3 * Math.PI)) / Math.tanh(k * 1.5); d += (i ? 'L' : 'M') + (x0 + u * w).toFixed(1) + ' ' + (y0 - v).toFixed(1); } return '<path d="' + d + '" fill="none" stroke="' + C.amber + '" stroke-width="3"/>'; };
      return svgS(420, 176, rect(2, 2, 204, 170, { fill: '#fff' }) + t(104, 24, '아날로그', { size: 14, weight: 800 }) + '<path d="M14 54 H194 M14 118 H194" stroke="' + C.line + '" stroke-dasharray="4 3"/>' + soft(16, 86, 176, 32) +
        t(104, 146, '천장 가까이에서', { size: 12, fill: C.sub }) + t(104, 163, '점점 거칠어져요', { size: 12, fill: C.sub }) +
        rect(214, 2, 204, 170, { fill: '#fff' }) + t(316, 24, '디지털', { size: 14, weight: 800 }) + '<path d="M226 60 H406 M226 112 H406" stroke="' + C.red + '" stroke-width="2"/>' + t(404, 54, '0 dBFS', { size: 12, fill: C.red, weight: 700, anchor: 'end' }) +
        wave(228, 86, 176, 40, 1.5, 26, C.red) + t(316, 146, '0 dBFS 를 넘는 순간', { size: 12, fill: C.sub }) + t(316, 163, '바로 잘려요', { size: 12, fill: C.red, weight: 700 }), '아날로그는 천장 근처에서 서서히 거칠어지고 디지털은 0 dBFS 에서 바로 잘려요');
    }
  };
  window.STAVisuals = V;
})();
