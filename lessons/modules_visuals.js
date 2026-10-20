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
  var V = {
    micTypes: function () {
      var dyn = '<g transform="translate(20,20)"><rect width="260" height="190" rx="14" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(130, 26, '다이내믹 (코일 + 자석)', { weight: 800, size: 14 }) +
        '<path d="M60 70 q-14 40 0 80" stroke="' + C.teal + '" stroke-width="4" fill="none"/>' + t(52, 170, '진동판', { size: 11, fill: C.sub }) +
        '<rect x="66" y="96" width="44" height="28" rx="4" fill="none" stroke="' + C.amber + '" stroke-width="3"/>' + '<path d="M70 100 q5 10 0 20 M80 100 q5 10 0 20 M90 100 q5 10 0 20 M100 100 q5 10 0 20" stroke="' + C.amber + '" stroke-width="2" fill="none"/>' + t(88, 88, '코일', { size: 11, fill: C.sub }) +
        '<rect x="122" y="78" width="70" height="64" rx="6" fill="#64748b"/><rect x="122" y="104" width="70" height="12" fill="#94a3b8"/>' + t(157, 160, '자석', { size: 11, fill: C.sub }) +
        '<path d="M200 110 h40" stroke="' + C.blue + '" stroke-width="3"/><path d="M234 104 l8 6 -8 6" fill="none" stroke="' + C.blue + '" stroke-width="3"/>' + t(222, 96, '전기', { size: 11, fill: C.blue }) +
        t(130, 184, '전원 필요 없음 · 튼튼함', { size: 12, fill: C.green, weight: 700 }) + '</g>';
      var con = '<g transform="translate(300,20)"><rect width="260" height="190" rx="14" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(130, 26, '콘덴서 (판 2장 사이 간격)', { weight: 800, size: 14 }) +
        '<path d="M80 62 q-10 48 0 96" stroke="' + C.teal + '" stroke-width="3" fill="none"/>' + t(70, 172, '얇은 진동판', { size: 11, fill: C.sub }) +
        '<rect x="104" y="62" width="10" height="96" rx="2" fill="#64748b"/>' + t(118, 172, '고정판', { size: 11, fill: C.sub, anchor: 'start' }) +
        '<path d="M86 110 h16" stroke="' + C.red + '" stroke-width="2" stroke-dasharray="3 3"/>' + t(94, 54, '간격 변화', { size: 11, fill: C.red }) +
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
        t(fx(4200), fy(4.5) - 10, '말소리가 또렷하게 (중고음 ↑)', { size: 11, fill: C.teal }) + t(fx(70), fy(-9) + 22, '저음 줄임', { size: 11, fill: C.teal }) +
        t(x1, 18, '보컬 마이크 주파수 응답 「예시」 (특정 제품의 측정값 아님)', { size: 11, fill: C.sub, anchor: 'end' }) + t(x0 + 4, 18, 'dB', { size: 10, fill: C.sub, anchor: 'start' }), '보컬 마이크 주파수 응답 예시 그래프');
    },
    distance: function () {
      var ds = [5, 10, 20, 40], base = 30, x0 = 70;
      var bars = ds.map(function (d, i) { var db = -20 * Math.log10(d / 5), h = 120 + db * 4.5, x = x0 + i * 130;
        return '<rect x="' + x + '" y="' + (170 - h) + '" width="70" height="' + h + '" rx="6" fill="' + C.teal + '" fill-opacity="' + (1 - i * 0.18) + '"/>' + t(x + 35, 165 - h, (db ? db.toFixed(0) : '0') + ' dB', { size: 13, weight: 800 }) + t(x + 35, 192, d + ' cm', { size: 12, fill: C.sub }); }).join('');
      return svg(600, 210, bars + t(560, 24, '입-마이크 거리가 2배 → 약 −6 dB (역제곱 법칙, 반사 없는 공간 기준)', { size: 11, fill: C.sub, anchor: 'end' }), '거리에 따른 목소리 크기 변화');
    },
    proximity: function () {
      var x0 = 60, x1 = 560, y0 = 30, y1 = 170, fx = function (cm) { return x0 + (Math.log10(cm) - Math.log10(1)) / (Math.log10(100) - Math.log10(1)) * (x1 - x0); }, fy = function (db) { return y1 - db / 30 * (y1 - y0); };
      function boost(a, cm) { var k = 2 * Math.PI * 100 / 343, r = cm / 100, g = a + (1 - a) * Math.sqrt(1 + 1 / Math.pow(k * r, 2)); return 20 * Math.log10(g); }
      function curve(a) { var d = ''; for (var cm = 1; cm <= 100; cm *= 1.08) d += (d ? 'L' : 'M') + fx(cm).toFixed(1) + ' ' + fy(Math.min(30, boost(a, cm))).toFixed(1); return d; }
      var grid = [1, 2, 5, 10, 20, 50, 100].map(function (c) { return '<path d="M' + fx(c) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.line + '"/>' + t(fx(c), y1 + 16, c + 'cm', { size: 10, fill: C.sub }); }).join('') +
        [0, 10, 20, 30].map(function (d) { return '<path d="M' + x0 + ' ' + fy(d) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(x0 - 6, fy(d) + 4, '+' + d, { size: 10, fill: C.sub, anchor: 'end' }); }).join('');
      return svg(600, 210, grid + '<path d="' + curve(0.5) + '" fill="none" stroke="' + C.teal + '" stroke-width="3"/><path d="' + curve(1) + '" fill="none" stroke="' + C.blue + '" stroke-width="3" stroke-dasharray="6 4"/>' +
        t(fx(9), fy(20), '카디오이드: 가까울수록 저음 ↑', { size: 12, fill: C.teal, anchor: 'start', weight: 700 }) + t(fx(4), fy(0) - 8, '무지향: 거의 변화 없음', { size: 12, fill: C.blue, anchor: 'start', weight: 700 }) +
        t(x1, 18, '100 Hz 저음 증가량 (1차 지향성 이론, 교육용 근사)', { size: 11, fill: C.sub, anchor: 'end' }) + t(x0, 18, 'dB', { size: 10, fill: C.sub, anchor: 'start' }), '근접 효과: 거리에 따른 저음 증가');
    },
    phantom: function () {
      var pin = function (x, y, n, col) { return '<circle cx="' + x + '" cy="' + y + '" r="13" fill="' + (col ? '#fff7ed' : '#fff') + '" stroke="' + (col || C.ink) + '" stroke-width="2"/>' + t(x, y + 5, n, { size: 13, weight: 800, fill: col || C.ink }); };
      var leg = function (y, n, txt, col) { return t(30, y, n, { size: 12, weight: 800, fill: col || C.ink, anchor: 'start' }) + t(46, y, txt, { size: 12, fill: col || C.sub, anchor: 'start' }); };
      return svg(600, 200, '<circle cx="90" cy="70" r="52" fill="' + C.bg + '" stroke="' + C.ink + '" stroke-width="3"/>' + pin(70, 52, '1') + pin(110, 52, '2', C.amber) + pin(90, 92, '3', C.amber) +
        leg(146, '1', '그라운드') + leg(164, '2', '+48V · 신호(+)', C.amber) + leg(182, '3', '+48V · 신호(−)', C.amber) + t(90, 12, 'XLR 핀 (IEC 61938, P48)', { size: 11, fill: C.sub }) +
        '<rect x="230" y="40" width="120" height="70" rx="10" fill="#0f2747"/>' + t(290, 72, '콘솔', { size: 14, fill: '#fff', weight: 800 }) + t(290, 92, '+48V ON', { size: 11, fill: '#fde68a' }) +
        '<path d="M350 75 H470" stroke="' + C.ink + '" stroke-width="4"/><path d="M350 66 H470" stroke="' + C.amber + '" stroke-width="2" stroke-dasharray="6 4"/>' + t(410, 56, '전원 →', { size: 11, fill: C.amber }) + t(410, 98, '← 소리 신호', { size: 11, fill: C.blue }) +
        '<rect x="470" y="50" width="90" height="50" rx="25" fill="#334155"/>' + t(515, 80, '콘덴서', { size: 12, fill: '#fff', weight: 700 }) +
        t(400, 150, '같은 XLR 케이블로 전원과 신호가 함께 다녀요', { size: 12, fill: C.ink }) + t(400, 170, '꽂고 뺄 때는 +48V 를 끄세요 (Shure 안내)', { size: 11, fill: C.red }), '팬텀 전원과 XLR 핀');
    },
    levels: function () {
      var y = function (dbu) { return 180 - (dbu + 70) * 1.9; };
      var band = function (a, b, col, name, note) { return '<rect x="150" y="' + y(b) + '" width="160" height="' + (y(a) - y(b)) + '" rx="6" fill="' + col + '" fill-opacity=".85"/>' + t(160, y(b) + 18, name, { size: 13, fill: '#fff', weight: 800, anchor: 'start' }) + t(330, (y(a) + y(b)) / 2 + 4, note, { size: 11, fill: C.sub, anchor: 'start' }); };
      var ticks = [-60, -40, -20, 0, 20].map(function (d) { return '<path d="M120 ' + y(d) + 'H140" stroke="' + C.sub + '"/>' + t(114, y(d) + 4, (d > 0 ? '+' : '') + d, { size: 10, fill: C.sub, anchor: 'end' }); }).join('');
      return svg(600, 200, ticks + t(80, 20, 'dBu', { size: 10, fill: C.sub }) + band(-60, -30, C.teal, '마이크 레벨', '대략 −60 ~ −30 dBu (목소리·마이크에 따라 다름)') + band(-10, 14, C.blue, '라인 레벨', '기준 +4 dBu (프로 장비)') +
        '<path d="M150 ' + y(20) + 'H310" stroke="' + C.red + '" stroke-width="2" stroke-dasharray="5 4"/>' + t(330, y(20) + 4, '장비의 최대치(클리핑) — 장비마다 다름', { size: 11, fill: C.red, anchor: 'start' }) +
        t(560, 190, '스피커 레벨은 앰프·스피커마다 달라 한 숫자로 말하지 않아요', { size: 10, fill: C.sub, anchor: 'end' }), '마이크 레벨과 라인 레벨 비교');
    },
    chain: function () {
      var st = [['입력', '마이크'], ['GAIN', '프리앰프'], ['HPF·EQ', '음색'], ['ON', '켜기/끄기'], ['페이더', '섞는 양'], ['ST 버스', '모으기'], ['마스터', '최종 출력']];
      var w = 74, gap = 10;
      return svg(600, 130, st.map(function (s, i) { var x = 6 + i * (w + gap), hot = i === 1 || i === 4;
        return '<rect x="' + x + '" y="30" width="' + w + '" height="56" rx="10" fill="' + (hot ? C.teal : C.bg) + '" stroke="' + (hot ? C.teal : C.line) + '" stroke-width="2"/>' + t(x + w / 2, 56, s[0], { size: 13, weight: 800, fill: hot ? '#fff' : C.ink }) + t(x + w / 2, 74, s[1], { size: 10, fill: hot ? '#e0f2fe' : C.sub }) +
          (i < st.length - 1 ? '<path d="M' + (x + w + 1) + ' 58 h' + (gap - 2) + '" stroke="' + C.ink + '" stroke-width="2"/>' : ''); }).join('') +
        t(6 + 1 * (w + gap) + w / 2, 108, '입력 크기 맞추기', { size: 11, fill: C.teal, weight: 700 }) + t(6 + 4 * (w + gap) + w / 2, 108, '밸런스 맞추기', { size: 11, fill: C.teal, weight: 700 }) +
        t(6, 18, '채널 안의 신호 순서 (MG12XU 기준 단순화)', { size: 11, fill: C.sub, anchor: 'start' }), '콘솔 채널 신호 순서');
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
        '<g font-size="12">' + ['① 채널 PFL 누르기', '② 실제처럼 노래·말 하기', '③ 큰 부분에서 가끔 0 을 넘게 GAIN 맞추기', '④ PEAK 가 켜지면 GAIN 조금 내리기', '⑤ PFL 끄고 페이더로 크기 맞추기'].map(function (s, i) { return t(250, 52 + i * 28, s, { size: 13, anchor: 'start' }); }).join('') + '</g>', 'PFL 미터로 GAIN 맞추는 순서');
    },
    headroom: function () {
      return svg(600, 200, '<rect x="60" y="20" width="200" height="160" rx="8" fill="' + C.bg + '" stroke="' + C.line + '"/>' +
        '<rect x="60" y="150" width="200" height="30" fill="#94a3b8" fill-opacity=".5"/>' + t(160, 170, '노이즈 플로어 (늘 깔린 잡음)', { size: 11 }) +
        '<path d="M60 40 H260" stroke="' + C.red + '" stroke-width="3"/>' + t(160, 34, '클리핑 (최대치)', { size: 11, fill: C.red, weight: 700 }) +
        '<path d="M60 90 H260" stroke="' + C.green + '" stroke-width="3" stroke-dasharray="6 4"/>' + t(160, 84, '평소 레벨', { size: 11, fill: C.green, weight: 700 }) +
        '<path d="M280 42 V88" stroke="' + C.teal + '" stroke-width="3"/><path d="M274 48 l6 -8 6 8 M274 82 l6 8 6 -8" fill="none" stroke="' + C.teal + '" stroke-width="2"/>' + t(292, 70, '헤드룸 (여유)', { size: 12, fill: C.teal, weight: 800, anchor: 'start' }) +
        '<path d="M280 92 V148" stroke="' + C.blue + '" stroke-width="3"/>' + t(292, 124, '신호 대 잡음', { size: 12, fill: C.blue, weight: 800, anchor: 'start' }) +
        t(292, 160, '평소 레벨이 천장에 붙으면 쉽게 찌그러지고,', { size: 11, fill: C.sub, anchor: 'start' }) + t(292, 176, '바닥에 붙으면 잡음이 들려요.', { size: 11, fill: C.sub, anchor: 'start' }), '헤드룸과 노이즈 플로어');
    }
  };
  window.STAVisuals = V;
})();
