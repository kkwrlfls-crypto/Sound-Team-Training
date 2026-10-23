/* =============================================================================
   학습 모듈: cable — 케이블 (하드웨어 이해 02) · 2026-10-21
   - STA_MODULES.cable (모듈 데이터) + STAVisuals.cable* (그림 6개) + STASims.cableBench (가상 케이블 작업대)
   - 장비 사양은 「(제조사 자료)」, 시뮬레이션 값은 「교육용 근사」로 구분해 적음
   - 근거: Yamaha Rio3224-D2·CL 시리즈 사양, Audinate Dante FAQ, Crown XLi 1500 제품 페이지,
           MG12XU 패널 표기(이 저장소의 console_strip.jpg · jack_strip.jpg 실물 사진)
   ============================================================================= */
(function () {
  'use strict';
  var C = { ink: '#0f2747', sub: '#5b6b80', line: '#cbd5e1', teal: '#0e7490', cyan: '#22d3ee', blue: '#2563eb', red: '#dc2626', amber: '#f59e0b', green: '#16a34a', bg: '#f8fafc', purple: '#7c3aed', spk: '#b45309' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + s + '</text>'; }
  function box(x, y, w, h, title, sub, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="' + (o.fill || C.bg) + '" stroke="' + (o.stroke || C.line) + '" stroke-width="' + (o.sw || 1.5) + '"/>' +
      t(x + w / 2, y + (sub ? h / 2 - 2 : h / 2 + 4), title, { size: o.size || 12, weight: 800, fill: o.color || C.ink }) + (sub ? t(x + w / 2, y + h / 2 + 13, sub, { size: 10, fill: o.subColor || C.sub }) : '');
  }
  function arrow(x1, y1, x2, y2, col, o) {
    o = o || {}; var a = Math.atan2(y2 - y1, x2 - x1), L = 8;
    var hx = x2 - L * Math.cos(a), hy = y2 - L * Math.sin(a);
    return '<path d="M' + x1 + ' ' + y1 + 'L' + hx.toFixed(1) + ' ' + hy.toFixed(1) + '" stroke="' + col + '" stroke-width="' + (o.w || 2.5) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + ' fill="none"/>' +
      '<path d="M' + x2 + ' ' + y2 + 'L' + (hx + 5 * Math.sin(a)).toFixed(1) + ' ' + (hy - 5 * Math.cos(a)).toFixed(1) + 'L' + (hx - 5 * Math.sin(a)).toFixed(1) + ' ' + (hy + 5 * Math.cos(a)).toFixed(1) + 'Z" fill="' + col + '"/>';
  }
  function wave(x0, x1, yc, amp, fn) { var d = ''; for (var i = 0; i <= 120; i++) { var u = i / 120, x = x0 + (x1 - x0) * u, y = yc - amp * fn(u); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } return d; }

  /* =========================================================================== 그림 */
  var V = window.STAVisuals = window.STAVisuals || {};

  // 1) 커넥터 종류와 흐르는 신호
  V.cableConnectors = function () {
    var TAG = { a: ['아날로그 · 작은 신호', C.teal], s: ['스피커 레벨 · 큰 전력', C.spk], d: ['디지털', C.blue], p: ['전원 220V', C.red] };
    function card(i, row, kind, icon, title, sub) {
      var x = 8 + i * 197, y = 8 + row * 150, tg = TAG[kind];
      return '<g><rect x="' + x + '" y="' + y + '" width="187" height="140" rx="12" fill="' + C.bg + '" stroke="' + C.line + '"/>' +
        '<rect x="' + (x + 8) + '" y="' + (y + 8) + '" width="' + (tg[0].length * 10 + 14) + '" height="18" rx="9" fill="' + tg[1] + '" fill-opacity=".14"/>' + t(x + 15, y + 21, tg[0], { size: 10, fill: tg[1], anchor: 'start', weight: 700 }) +
        icon(x + 93, y + 66) + t(x + 93, y + 112, title, { size: 13, weight: 800 }) + t(x + 93, y + 129, sub, { size: 10.5, fill: C.sub }) + '</g>';
    }
    var xlr = function (cx, cy) { return '<circle cx="' + cx + '" cy="' + cy + '" r="24" fill="#e2e8f0" stroke="' + C.ink + '" stroke-width="2"/>' +
      [[-9, -5, '2'], [9, -5, '1'], [0, 10, '3']].map(function (p) { return '<circle cx="' + (cx + p[0]) + '" cy="' + (cy + p[1]) + '" r="3.6" fill="' + C.ink + '"/>'; }).join('') + '<rect x="' + (cx - 3) + '" y="' + (cy - 27) + '" width="6" height="6" fill="' + C.ink + '"/>'; };
    var plug = function (rings) { return function (cx, cy) {
      var s = '<rect x="' + (cx - 62) + '" y="' + (cy - 11) + '" width="46" height="22" rx="5" fill="#334155"/><rect x="' + (cx - 16) + '" y="' + (cy - 5) + '" width="58" height="10" fill="#cbd5e1" stroke="#94a3b8"/>' +
        '<path d="M' + (cx + 42) + ' ' + (cy - 5) + 'h6 a5 5 0 0 1 0 10 h-6z" fill="#cbd5e1" stroke="#94a3b8"/>';
      rings.forEach(function (rx) { s += '<rect x="' + (cx + rx) + '" y="' + (cy - 6) + '" width="3" height="12" fill="#111827"/>'; });
      var lab = rings.length === 1 ? [['T', 46], ['S', 10]] : [['T', 46], ['R', 30], ['S', 4]];
      lab.forEach(function (l) { s += t(cx + l[1], cy - 12, l[0], { size: 10, weight: 800, fill: C.teal }); });
      return s; }; };
    var speakon = function (cx, cy) { return '<circle cx="' + cx + '" cy="' + cy + '" r="25" fill="#1d2b4a"/><circle cx="' + cx + '" cy="' + cy + '" r="15" fill="#334155" stroke="#64748b"/><rect x="' + (cx - 4) + '" y="' + (cy - 24) + '" width="8" height="8" fill="#1d2b4a"/>' +
      [[-8, -4], [8, -4], [-8, 6], [8, 6]].map(function (p) { return '<rect x="' + (cx + p[0] - 2.5) + '" y="' + (cy + p[1] - 2) + '" width="5" height="4" fill="#fbbf24"/>'; }).join(''); };
    var rj45 = function (cx, cy) { var s = '<rect x="' + (cx - 26) + '" y="' + (cy - 18) + '" width="52" height="34" rx="4" fill="#e2e8f0" stroke="' + C.ink + '" stroke-width="2"/><rect x="' + (cx - 9) + '" y="' + (cy + 16) + '" width="18" height="7" fill="' + C.ink + '"/>';
      for (var i = 0; i < 8; i++) s += '<rect x="' + (cx - 20 + i * 5.3) + '" y="' + (cy - 14) + '" width="2.6" height="10" fill="#d4a017"/>'; return s; };
    var iec = function (cx, cy) { return '<path d="M' + (cx - 26) + ' ' + (cy - 16) + 'H' + (cx + 26) + 'V' + (cy + 6) + 'L' + (cx + 16) + ' ' + (cy + 18) + 'H' + (cx - 16) + 'L' + (cx - 26) + ' ' + (cy + 6) + 'Z" fill="#1f2937"/>' +
      [[-12, -4], [12, -4], [0, 7]].map(function (p) { return '<rect x="' + (cx + p[0] - 2) + '" y="' + (cy + p[1] - 5) + '" width="4" height="9" fill="#e5e7eb"/>'; }).join('') + t(cx + 36, cy - 10, '⚡', { size: 14, fill: C.red }); };
    return svg(600, 310,
      card(0, 0, 'a', xlr, 'XLR (3핀)', '마이크·라인 신호 · 밸런스') + card(1, 0, 'a', plug([33]), 'TS 폰 (6.3 mm)', '악기·라인 · 언밸런스') + card(2, 0, 'a', plug([20, 36]), 'TRS 폰 (6.3 mm)', '밸런스 라인 · 스테레오 헤드폰') +
      card(0, 1, 's', speakon, 'speakON (NL4)', '앰프 → 패시브 스피커 전용') + card(1, 1, 'd', rj45, 'RJ45 · etherCON', 'Dante 네트워크 오디오') + card(2, 1, 'p', iec, '전원 케이블 (IEC)', '장비에 전기 공급 · 신호 없음'),
      '케이블 커넥터 여섯 가지와 흐르는 신호');
  };

  // 2) 커넥터 구조와 핀 배열 · 호환성
  V.cablePins = function () {
    function face(cx, cy, pins, name, note) {
      return '<circle cx="' + cx + '" cy="' + cy + '" r="40" fill="' + C.bg + '" stroke="' + C.ink + '" stroke-width="2.5"/>' + pins.map(function (p) {
        var col = p[2] === '1' ? C.sub : p[2] === '2' ? C.red : C.blue;
        return (p[3] ? '<circle cx="' + (cx + p[0]) + '" cy="' + (cy + p[1]) + '" r="8" fill="#fff" stroke="' + col + '" stroke-width="2.5"/>' : '<circle cx="' + (cx + p[0]) + '" cy="' + (cy + p[1]) + '" r="7" fill="' + col + '"/>') +
          t(cx + p[0], cy + p[1] + 4, p[2], { size: 11, weight: 800, fill: p[3] ? col : '#fff' }); }).join('') +
        t(cx, cy + 58, name, { size: 12, weight: 800 }) + t(cx, cy + 73, note, { size: 10, fill: C.sub });
    }
    var leg = '<g>' + t(18, 168, '1', { size: 12, weight: 800, fill: C.sub, anchor: 'start' }) + t(30, 168, '그라운드 · 실드', { size: 11, fill: C.sub, anchor: 'start' }) +
      t(18, 185, '2', { size: 12, weight: 800, fill: C.red, anchor: 'start' }) + t(30, 185, '핫 (+) 신호', { size: 11, fill: C.red, anchor: 'start' }) +
      t(130, 168, '3', { size: 12, weight: 800, fill: C.blue, anchor: 'start' }) + t(142, 168, '콜드 (−) 신호', { size: 11, fill: C.blue, anchor: 'start' }) +
      t(130, 185, '앞에서 본 모습', { size: 10, fill: C.sub, anchor: 'start' }) + '</g>';
    var trs = '<g transform="translate(296,22)">' + t(76, 0, 'TRS 플러그', { size: 12, weight: 800 }) +
      '<rect x="0" y="22" width="60" height="26" rx="6" fill="#334155"/><rect x="60" y="28" width="74" height="14" fill="#cbd5e1" stroke="#94a3b8"/><path d="M134 28h8a7 7 0 0 1 0 14h-8z" fill="#cbd5e1" stroke="#94a3b8"/>' +
      '<rect x="92" y="27" width="4" height="16" fill="#111827"/><rect x="128" y="27" width="4" height="16" fill="#111827"/>' +
      t(140, 66, 'T', { size: 12, weight: 800, fill: C.red }) + t(112, 66, 'R', { size: 12, weight: 800, fill: C.blue }) + t(76, 66, 'S', { size: 12, weight: 800, fill: C.sub }) +
      t(76, 88, 'T 핫(+) · R 콜드(−) · S 그라운드', { size: 10.5 }) + t(76, 104, 'TS 는 링이 없어 T 신호 · S 그라운드', { size: 10.5, fill: C.sub }) + t(76, 120, '검은 띠 2개 = TRS, 1개 = TS', { size: 10.5, fill: C.sub }) + '</g>';
    var nl4 = '<g transform="translate(486,22)">' + t(52, 0, 'speakON NL4', { size: 12, weight: 800 }) +
      '<circle cx="52" cy="46" r="32" fill="#1d2b4a"/><circle cx="52" cy="46" r="20" fill="#334155"/>' +
      [[-10, -5, '1+'], [10, -5, '1−'], [-10, 11, '2+'], [10, 11, '2−']].map(function (p) { return '<rect x="' + (52 + p[0] - 7) + '" y="' + (46 + p[1] - 6) + '" width="14" height="11" rx="2" fill="#fbbf24"/>' + t(52 + p[0], 46 + p[1] + 3.5, p[2], { size: 8.5, weight: 800, fill: '#1d2b4a' }); }).join('') +
      t(52, 96, '1+ / 1− :', { size: 10.5 }) + t(52, 110, '스피커 + / −', { size: 10.5 }) + t(52, 126, '2+ / 2− : 둘째 채널', { size: 10, fill: C.sub }) + '</g>';
    var adapt = '<rect x="10" y="204" width="580" height="50" rx="8" fill="#fffbeb" stroke="#fde68a"/>' +
      t(22, 224, '변환 젠더: TRS ↔ XLR 은 밸런스가 그대로 (T↔2, R↔3, S↔1)', { size: 11.5, anchor: 'start' }) +
      t(22, 243, 'TS ↔ XLR 은 보통 3번이 1번에 묶여 언밸런스가 돼요 → 잡음에 약해짐', { size: 11.5, anchor: 'start', fill: C.spk, weight: 700 });
    return svg(600, 262, face(70, 70, [[-15, -6, '1'], [15, -6, '2'], [0, 18, '3']], 'XLR 수 (핀)', '출력 쪽 · 예: 마이크') + face(200, 70, [[-15, -6, '2', 1], [15, -6, '1', 1], [0, 18, '3', 1]], 'XLR 암 (구멍)', '입력 쪽 · 예: 콘솔') +
      leg + trs + nl4 + adapt, 'XLR, TRS, speakON 핀 배열과 변환 젠더');
  };

  // 3) 밸런스와 언밸런스 — 공통 모드 제거
  V.cableBalanced = function () {
    var s = function (u) { return 0.55 * Math.sin(2 * Math.PI * 4 * u) * (0.6 + 0.4 * Math.sin(Math.PI * u)); };
    var n = function (u) { return 0.5 * Math.sin(2 * Math.PI * 1.3 * u + 0.7); };
    var rows = [
      [60, '가는 길에 들어온 잡음 (험) — 두 선에 똑같이', n, '#94a3b8'],
      [116, '핫 (+) 선 = 신호 + 잡음', function (u) { return s(u) + n(u); }, C.red],
      [172, '콜드 (−) 선 = 뒤집은 신호 + 잡음', function (u) { return -s(u) + n(u); }, C.blue],
      [234, '받는 쪽: 핫 − 콜드 → 잡음은 지워지고 신호는 2배', function (u) { return 2 * s(u) * 0.75; }, C.green]
    ];
    var left = '<rect x="6" y="4" width="372" height="256" rx="10" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(18, 24, '밸런스 (XLR · TRS)', { size: 13, weight: 800, anchor: 'start' }) +
      rows.map(function (r) { return t(20, r[0] - 16, r[1], { size: 11, anchor: 'start', fill: r[3] === '#94a3b8' ? C.sub : r[3], weight: 700 }) + '<path d="M20 ' + r[0] + 'H366" stroke="' + C.line + '" stroke-dasharray="3 3"/>' +
        '<path d="' + wave(20, 366, r[0] + 6, 13, r[2]) + '" fill="none" stroke="' + r[3] + '" stroke-width="2.2"/>'; }).join('') +
      '';
    var right = '<rect x="388" y="4" width="206" height="256" rx="10" fill="#fff7ed" stroke="#fed7aa"/>' + t(400, 24, '언밸런스 (TS)', { size: 13, weight: 800, anchor: 'start' }) +
      t(400, 86, '신호선 = 신호 + 잡음', { size: 11, anchor: 'start', fill: C.red, weight: 700 }) + '<path d="' + wave(400, 584, 108, 13, function (u) { return s(u) + n(u); }) + '" fill="none" stroke="' + C.red + '" stroke-width="2.2"/>' +
      t(400, 150, '그라운드(실드)는 신호가', { size: 10.5, anchor: 'start', fill: C.sub }) + t(400, 164, '되돌아오는 길이에요', { size: 10.5, anchor: 'start', fill: C.sub }) +
      t(400, 210, '받는 쪽: 잡음이 그대로 남아요', { size: 11, anchor: 'start', fill: C.spk, weight: 700 }) + '<path d="' + wave(400, 584, 232, 13, function (u) { return s(u) + n(u); }) + '" fill="none" stroke="' + C.spk + '" stroke-width="2.2"/>';
    return svg(600, 280, left + right + t(594, 276, '교육용 그림 (신호·잡음 모양은 예시)', { size: 10, fill: C.sub, anchor: 'end' }), '밸런스 케이블의 공통 모드 제거 원리');
  };

  // 4) 마이크·라인·스피커 레벨 경로
  V.cableLevels = function () {
    var mic = C.teal, line = C.blue, spk = C.spk;
    return svg(600, 262,
      box(6, 26, 104, 46, 'SM58S', '마이크') + box(222, 20, 140, 58, 'MG12XU', '콘솔 (믹서)', { fill: '#eef2ff' }) + box(470, 20, 124, 58, 'ZXA1', '액티브 · 앰프 내장') +
      arrow(110, 49, 222, 49, mic, { w: 3 }) + t(166, 40, 'XLR', { size: 11, weight: 800, fill: mic }) + t(166, 66, '마이크 레벨', { size: 10.5, fill: mic }) +
      arrow(362, 49, 470, 49, line, { w: 3 }) + t(416, 40, 'XLR', { size: 11, weight: 800, fill: line }) + t(416, 66, '라인 레벨', { size: 10.5, fill: line }) + t(532, 92, '→ LINE 입력에', { size: 10, fill: C.sub }) +
      arrow(292, 78, 292, 128, line, { w: 3 }) + t(300, 100, 'XLR · 라인 레벨', { size: 10.5, fill: line, anchor: 'start' }) +
      box(222, 128, 140, 52, 'Crown XLi1500', '파워앰프') + box(470, 128, 124, 52, 'ZX1', '패시브 · 전원 없음') +
      '<path d="M362 154 H462" stroke="' + spk + '" stroke-width="6"/><path d="M470 154 l-10 -7 v14z" fill="' + spk + '"/>' + t(416, 144, 'speakON', { size: 11, weight: 800, fill: spk }) + t(416, 172, '스피커 레벨 (큰 전력)', { size: 10.5, fill: spk }) +
      '<rect x="6" y="198" width="290" height="56" rx="8" fill="#fef2f2" stroke="#fecaca"/>' + t(16, 220, '✕ 앰프·스피커 출력(스피커 레벨)을', { size: 11.5, fill: C.red, anchor: 'start', weight: 700 }) + t(30, 240, '콘솔·장비의 입력에 꽂지 않아요', { size: 11.5, fill: C.red, anchor: 'start', weight: 700 }) +
      '<rect x="304" y="198" width="290" height="56" rx="8" fill="#fef2f2" stroke="#fecaca"/>' + t(314, 220, '✕ 패시브 스피커에 악기(TS) 케이블은', { size: 11.5, fill: C.red, anchor: 'start', weight: 700 }) + t(328, 240, '쓰지 않아요 — 가늘어 열과 손실', { size: 11.5, fill: C.red, anchor: 'start', weight: 700 }) +
      t(6, 12, '교회 확성 실습 장비로 본 신호 레벨과 케이블', { size: 11, fill: C.sub, anchor: 'start' }), '마이크·라인·스피커 레벨에 따른 케이블 경로');
  };

  // 5) 아날로그와 디지털 연결 · 네트워크 오디오 (2026-10-23: 3층 구성 대신 일반적인 예시)
  V.cableNetwork = function () {
    var an = C.teal, dn = C.blue, ae = C.purple, sp = C.spk;
    var multi = ''; for (var k = 0; k < 8; k++) multi += '<path d="M110 ' + (40 + k * 4) + ' H170" stroke="' + an + '" stroke-width="1.6"/>';
    return svg(600, 300,
      t(6, 14, '아날로그 — 채널마다 케이블 한 가닥', { size: 11, weight: 800, fill: an, anchor: 'start' }) +
      box(6, 30, 104, 44, '무대', '마이크·악기 32개') + multi + t(140, 86, '멀티 케이블 32가닥', { size: 10, fill: an }) +
      box(170, 30, 110, 44, '아날로그 콘솔', '') +
      t(320, 14, '디지털 — 랜선 한 가닥에 수십 채널', { size: 11, weight: 800, fill: dn, anchor: 'start' }) +
      box(320, 30, 104, 44, '스테이지박스', '무대에서 디지털로') +
      '<path d="M424 52 H490" stroke="' + dn + '" stroke-width="4"/>' + t(457, 44, '랜선 1가닥', { size: 10, weight: 800, fill: dn }) + t(457, 66, 'Dante 등', { size: 10, fill: dn }) +
      box(490, 30, 104, 44, '디지털 콘솔', '방송실') +
      '<path d="M300 100 H594" stroke="#e2e8f0" stroke-width="1"/>' +
      t(6, 124, '디지털 콘솔에서 스피커까지 (예시)', { size: 11, weight: 800, fill: C.ink, anchor: 'start' }) +
      box(6, 140, 120, 48, '디지털 콘솔', '') +
      arrow(126, 164, 214, 164, ae, { w: 3 }) + t(170, 156, 'AES/EBU', { size: 10.5, weight: 800, fill: ae }) + t(170, 182, '한 가닥 2채널', { size: 10, fill: ae }) +
      box(214, 140, 130, 48, '디지털 앰프', 'DSP 내장') +
      '<path d="M344 164 H424" stroke="' + sp + '" stroke-width="6"/><path d="M432 164 l-10 -7 v14z" fill="' + sp + '"/>' + t(388, 154, '스피커 케이블', { size: 10, fill: sp }) +
      box(432, 140, 120, 48, '패시브 스피커', '') +
      '<g font-size="10">' + [[an, 'XLR 아날로그', 0], [dn, '네트워크 오디오(랜선)', 1], [ae, 'AES/EBU 디지털', 2], [sp, '스피커 레벨', 3]].map(function (l) { var x = 10 + l[2] * 148; return '<path d="M' + x + ' 236 h24" stroke="' + l[0] + '" stroke-width="' + (l[2] === 3 ? 6 : 3) + '"/>' + t(x + 30, 240, l[1], { size: 10.5, anchor: 'start', fill: C.ink }); }).join('') + '</g>' +
      t(594, 280, '단순화한 예시 그림이에요. 실제 구성은 교회마다 달라요.', { size: 10, fill: C.sub, anchor: 'end' }), '아날로그 연결과 디지털 네트워크 연결 비교');
  };

  // 6) 케이블 관리와 고장 진단 — 테스터 · 오버-언더
  V.cableCare = function () {
    function led(x, y, on, n) { return '<circle cx="' + x + '" cy="' + y + '" r="8" fill="' + (on ? '#22c55e' : '#1f2937') + '" stroke="' + (on ? '#86efac' : '#475569') + '" stroke-width="2"/>' + t(x + (x > 150 ? 18 : -18), y + 4, n, { size: 11, fill: '#e2e8f0', weight: 700 }); }
    var tester = '<rect x="8" y="14" width="280" height="196" rx="14" fill="#1e293b"/>' + t(148, 36, '케이블 테스터 「예시」', { size: 12, fill: '#e2e8f0', weight: 800 }) +
      t(80, 62, '보내는 쪽', { size: 10.5, fill: '#94a3b8' }) + t(216, 62, '받는 쪽', { size: 10.5, fill: '#94a3b8' }) +
      led(92, 86, true, '1') + led(92, 118, true, '2') + led(92, 150, true, '3') + led(228, 86, true, '1') + led(228, 118, false, '2') + led(228, 150, true, '3') +
      '<path d="M104 86 H216 M104 150 H216" stroke="#64748b" stroke-width="2"/><path d="M104 118 H150 M166 118 H216" stroke="' + C.red + '" stroke-width="2"/>' + t(158, 122, '✕', { size: 13, fill: C.red, weight: 800 }) +
      t(148, 186, '2번 불이 꺼짐 → 2번 선이 끊김(단선)', { size: 11.5, fill: '#fca5a5', weight: 700 });
    var coil = '<g transform="translate(300,0)">' + t(150, 30, '오버-언더 감기', { size: 13, weight: 800 }) +
      '<ellipse cx="90" cy="110" rx="52" ry="62" fill="none" stroke="' + C.teal + '" stroke-width="5"/><ellipse cx="200" cy="110" rx="52" ry="62" fill="none" stroke="' + C.purple + '" stroke-width="5" stroke-dasharray="10 5"/>' +
      '<path d="M90 48 l10 -6 v12z" fill="' + C.teal + '"/><path d="M200 48 l-10 -6 v12z" fill="' + C.purple + '"/>' +
      t(90, 114, '① 그냥', { size: 11, weight: 700, fill: C.teal }) + t(90, 130, '고리', { size: 11, weight: 700, fill: C.teal }) + t(200, 114, '② 손목을', { size: 11, weight: 700, fill: C.purple }) + t(200, 130, '뒤집은 고리', { size: 11, weight: 700, fill: C.purple }) +
      t(145, 196, '①②를 번갈아 → 풀 때 꼬이지 않아요', { size: 11.5, fill: C.ink, weight: 700 }) + t(145, 213, '팔꿈치에 감으면 속선이 꼬여 끊어지기 쉬워요', { size: 10.5, fill: C.sub }) + '</g>';
    return svg(600, 224, tester + coil, '케이블 테스터로 단선 찾기와 오버-언더 감기');
  };

  /* =========================================================================== 공통: 보컬 녹음 불러오기 (MG12XU 실습과 같은 음원) */
  function b64ToBuf(uri) { var b = atob(uri.slice(uri.indexOf(',') + 1)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  function getVox(cb) {
    var G = window.__staVox || (window.__staVox = { cbs: [], data: null, busy: false });
    if (G.data) { cb(G.data); return; }
    G.cbs.push(cb); if (G.busy) return; G.busy = true;
    function finish(d) { if (G.data) return; G.data = d; var a = G.cbs; G.cbs = []; a.forEach(function (f) { try { f(d); } catch (e) { /* 다른 실습 오류는 무시 */ } }); }
    function synth() { var blk = 0.05, n = 400, env = []; for (var i = 0; i < n; i++) { var tt = i * blk, ph = (tt % 5) / 5; env.push(ph < 0.85 ? 0.25 + 0.75 * Math.pow(Math.sin(Math.PI * ph / 0.85), 2) : 0.01); } finish({ env: env, blk: blk, dur: n * blk, buffer: null, max: 1, synthetic: true }); }
    var uri = window.MG12XU_SOURCE_AUDIO_BASE64 && window.MG12XU_SOURCE_AUDIO_BASE64.leadVox, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!uri || !OAC) { synth(); return; }
    try {
      var oc = new OAC(1, 2, 44100), pr = oc.decodeAudioData(b64ToBuf(uri), function (buf) { done(buf); }, function () { synth(); });
      if (pr && pr.catch) pr.catch(function () { /* 콜백에서 처리 */ });
    } catch (e) { synth(); }
    function done(buf) {
      var blk = 0.05, n = Math.floor(buf.duration / blk), sr = buf.sampleRate, ch = [], i, k, max = 0, env = [];
      for (k = 0; k < buf.numberOfChannels; k++) ch.push(buf.getChannelData(k));
      for (i = 0; i < n; i++) { var p = 0, s0 = Math.floor(i * blk * sr), s1 = Math.min(ch[0].length, Math.floor((i + 1) * blk * sr)); for (k = 0; k < ch.length; k++) for (var j = s0; j < s1; j += 2) { var v = Math.abs(ch[k][j]); if (v > p) p = v; } env.push(p); if (p > max) max = p; }
      finish({ env: env.map(function (v) { return v / (max || 1); }), blk: blk, dur: n * blk, buffer: buf, max: max, synthetic: false });
    }
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function db(x) { return 20 * Math.log10(Math.max(x, 1e-9)); }

  /* =========================================================================== 실습: 가상 케이블 작업대 */
  var CABLES = [
    ['xlr', 'XLR 케이블'], ['ts', '악기 케이블 (TS)'], ['trs', 'TRS 케이블'], ['speakon', 'speakON 스피커 케이블'], ['lan', '랜선 (RJ45)'], ['ac', '전원 케이블']
  ];
  var LAN_MSG = ['bad', '랜선은 Dante 같은 디지털 네트워크용이에요. 아날로그 신호 단자에는 맞지 않아요.'];
  var AC_MSG = ['danger', '전원 케이블은 220V 전기를 주는 선이에요. 소리 신호는 지나가지 않고, 신호 단자에 쓰면 위험해요.'];
  var SLOTS = {
    A: { name: '① SM58S 마이크 → MG12XU CH1 (MIC/LINE)', ends: 'XLR 수 → XLR 암 (콤보 단자)', level: '마이크 레벨', color: '#0e7490', fb: {
      xlr: ['ok', '맞아요. 작은 마이크 신호를 밸런스로 잡음에 강하게 보내요. 마이크(수) → 콘솔(암) 방향이에요.'],
      ts: ['bad', 'SM58S 출력은 XLR 단자라 TS 플러그가 맞지 않아요. 변환해도 언밸런스가 되어 잡음에 약해져요.'],
      trs: ['bad', 'SM58S 출력은 XLR 단자예요. TRS 플러그는 맞지 않아요.'],
      speakon: ['bad', 'speakON 은 앰프 → 패시브 스피커 전용이에요. 마이크에는 쓰지 않아요.'], lan: LAN_MSG, ac: AC_MSG } },
    B: { name: '② MG12XU STEREO OUT L → ZXA1 LINE 입력', ends: 'XLR 수 → XLR 암', level: '라인 레벨', color: '#2563eb', fb: {
      xlr: ['ok', '맞아요. 콘솔의 라인 레벨 출력을 밸런스로 보내요. ZXA1 의 MIC 입력이 아니라 LINE 입력에 꽂아요.'],
      ts: ['bad', '이 연결은 양쪽 모두 XLR 단자라 TS 플러그가 맞지 않아요. TS 는 언밸런스라 긴 거리에서 잡음이 들어오기도 쉬워요.'],
      trs: ['bad', 'TRS 도 밸런스지만, 이 연결은 양쪽 모두 XLR 단자라 맞지 않아요.'],
      speakon: ['bad', 'ZXA1 은 앰프가 들어 있는 액티브 스피커라 라인 신호를 받아요. speakON 은 패시브 스피커용이에요.'], lan: LAN_MSG, ac: AC_MSG } },
    C: { name: '③ Crown XLi1500 CH1 출력 → ZX1 패시브 스피커', ends: 'speakON → speakON', level: '스피커 레벨', color: '#b45309', fb: {
      speakon: ['ok', '맞아요. 앰프의 큰 출력(스피커 레벨)을 보내는 전용 케이블이에요. 꽂은 뒤 돌려서 잠가요.'],
      ts: ['danger', '악기(TS) 케이블은 속선이 가늘어 스피커의 큰 전류에 뜨거워지고 출력도 손실돼요. 모양이 맞는 단자가 있어도 쓰지 않아요.'],
      trs: ['danger', '신호용 폰 케이블은 스피커의 큰 전류를 견디도록 만든 것이 아니에요. 스피커에는 스피커 케이블을 써요.'],
      xlr: ['danger', 'XLR 은 마이크·라인 신호용이에요. 스피커 레벨을 XLR 로 보내면, 나중에 누가 그 케이블을 장비 입력에 꽂았을 때 입력을 망가뜨릴 수 있어요.'],
      lan: LAN_MSG, ac: AC_MSG } }
  };
  var PIN_MEAN = {
    1: '1번(그라운드·실드)이 끊겼어요. 험이 커지고, 팬텀 전원이 돌아올 길이 없어 콘덴서 마이크가 동작하지 않아요.',
    2: '2번(핫 +)이 끊겼어요. 소리가 아주 작아지거나 끊기고, 밸런스가 깨져 잡음에 약해져요.',
    3: '3번(콜드 −)이 끊겼어요. 소리가 작아지거나 끊기고, 밸런스가 깨져 잡음에 약해져요.'
  };
  var CMR_DB = 50;                         // 밸런스 입력의 공통 모드 제거량 (교육용 근사)
  var EPS = 2 * Math.pow(10, -CMR_DB / 20); // 콜드 선에 들어오는 험이 핫 선과 아주 조금 다름(불균형) → 남는 험 = 험 × EPS / 2
  function humDbUnbal(len, par) { return -50 + 20 * Math.log10(Math.max(1, len)) + (par ? 10 : 0); } // 신호 최대 대비 험 크기 (듣기 쉽게 실제보다 크게)

  function injectCss() {
    if (document.getElementById('sta-mod-cable-css')) return;
    var st = document.createElement('style'); st.id = 'sta-mod-cable-css';
    st.textContent = [
      '.sim-cable{display:grid;gap:12px;min-width:0}',
      '.sim-cable-card{border:1px solid var(--sta-line,#d6dee8);border-radius:12px;background:#fff;padding:12px 14px;min-width:0}',
      '.sim-cable-card>h4{margin:0 0 4px;font-size:.95rem;color:var(--sta-navy,#0f2747)}',
      '.sim-cable-card>p.sim-cable-lead{margin:0 0 8px;font-size:.8rem;color:#51627a;line-height:1.55;word-break:keep-all}',
      '.sim-cable-svg{display:block;width:100%;height:auto;max-width:560px;margin:0 auto}',
      '.sim-cable-slots{display:grid;gap:10px;margin-top:8px}',
      '.sim-cable-slot{border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;margin:0;min-width:0}',
      '.sim-cable-slot legend{font-size:.82rem;font-weight:800;color:var(--sta-ink,#0f1f33);padding:0 4px}',
      '.sim-cable-slot small{display:block;font-size:.72rem;color:#7a8aa0;margin:0 0 6px}',
      '.sim-cable-chips{display:flex;flex-wrap:wrap;gap:6px}',
      '.sim-cable-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border:1px solid var(--sta-line,#d6dee8);border-radius:999px;font-size:.76rem;font-weight:700;cursor:pointer;background:#f8fafc}',
      '.sim-cable-chip input{margin:0;accent-color:#0e7490}',
      '.sim-cable-chip:has(input:checked){border-color:#0e7490;background:#e6f6f9}',
      '.sim-cable-fb{margin:6px 0 0;font-size:.78rem;line-height:1.5;word-break:keep-all;padding:6px 8px;border-radius:8px;background:#f8fafc;color:#51627a}',
      '.sim-cable-fb.ok{background:#ecfdf5;color:#047857}.sim-cable-fb.bad{background:#fff7ed;color:#c2410c}.sim-cable-fb.danger{background:#fef2f2;color:#b91c1c;font-weight:700}',
      '.sim-cable-hum{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:12px;align-items:start}',
      '.sim-cable-scope{border-radius:10px;background:#0b1220;overflow:hidden}',
      '.sim-cable-scope canvas{display:block;width:100%}',
      '.sim-cable-steps{margin:10px 0 0;padding:0 0 0 20px;display:grid;gap:5px;font-size:.84rem;line-height:1.6;color:var(--sta-ink-2,#4b5c74);word-break:keep-all}',
      '.sim-cable-ctl{display:grid;gap:8px}',
      '.sim-cable-seg{display:flex;gap:6px;flex-wrap:wrap}',
      '.sim-cable-seg label{flex:1 1 110px;display:flex;gap:6px;align-items:center;padding:6px 8px;border:1px solid var(--sta-line,#d6dee8);border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer}',
      '.sim-cable-seg label:has(input:checked){border-color:#0e7490;background:#e6f6f9}',
      '.sim-cable-tester{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:12px;align-items:start}',
      '.sim-cable-diag{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}',
      '@media (max-width:760px){.sim-cable-hum,.sim-cable-tester{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function cableBench(el, opts) {
    opts = opts || {}; injectCss();
    var S = { conn: { A: null, B: null, C: null }, type: 'unbal', len: 10, parallel: false, sawHum: false,
      tCable: 1, scanned: {}, scanStep: {}, busy: {}, diag: {}, faulty: 1 + Math.floor(Math.random() * 3), faultPin: 1 + Math.floor(Math.random() * 3),
      done: {}, audio: false, t0: performance.now() };
    var alive = true, raf = 0, timers = [], vox = null, actx = null, nodes = null;
    function slotHtml(k) {
      var sl = SLOTS[k];
      return '<fieldset class="sim-cable-slot" data-slot="' + k + '"><legend>' + esc(sl.name) + '</legend><small>단자: ' + esc(sl.ends) + '</small><div class="sim-cable-chips">' +
        CABLES.map(function (c) { return '<label class="sim-cable-chip"><input type="radio" name="simCable' + k + '" value="' + c[0] + '" data-cslot="' + k + '"><span>' + esc(c[1]) + '</span></label>'; }).join('') +
        '</div><p class="sim-cable-fb" data-fb="' + k + '">케이블을 골라 보세요.</p></fieldset>';
    }
    el.innerHTML = '<div class="sim-cable">' +
      '<section class="sim-cable-card"><h4>① 알맞은 케이블 고르기</h4><p class="sim-cable-lead">교회 확성 실습 장비의 세 연결이에요. 각 연결에 맞는 케이블을 고르면 그림에 신호 레벨이 표시돼요.</p>' +
        '<div data-role="rig"></div><div class="sim-cable-slots">' + slotHtml('A') + slotHtml('B') + slotHtml('C') + '</div></section>' +
      '<section class="sim-cable-card"><h4>② 긴 케이블의 험 — 언밸런스와 밸런스</h4><p class="sim-cable-lead">케이블이 길수록, 전원선 가까이 지날수록 「웅-」 하는 험(60 Hz 전기 잡음)이 더 많이 들어와요. 밸런스(XLR·TRS)는 핫(+)·콜드(−)·그라운드 세 가닥으로 같은 신호를 「그대로」와 「뒤집은」 모양으로 함께 보내고, 받는 쪽에서 콜드를 다시 뒤집어 더해 잡음을 지워요. 「언밸런스 / 밸런스」 단추로 종류를 바꿔 그림을 비교해 보세요.</p>' +
        '<div class="sim-cable-hum"><div><div class="sim-cable-scope"><canvas data-role="scope" aria-label="밸런스·언밸런스 케이블로 신호와 잡음이 지나가는 그림"></canvas></div><div data-role="steps"></div><p class="sim-note">매끈한 물결 = 소리 신호, 잘게 떨리는 주황 물결 = 케이블에 들어온 잡음이에요. 밸런스가 소리 자체를 더 좋게 만드는 것은 아니고, 길거나 잡음이 많은 곳에서 잡음을 막아 줘요. (이해를 돕는 그림)</p></div>' +
          '<div class="sim-cable-ctl"><div class="sim-cable-seg" role="radiogroup" aria-label="케이블 종류"><label><input type="radio" name="simCableType" value="unbal" checked>언밸런스 (TS)</label><label><input type="radio" name="simCableType" value="bal">밸런스 (XLR)</label></div>' +
            '<label class="sim-range"><span>케이블 길이 <b data-out="len"></b></span><input type="range" min="1" max="50" step="1" data-sim="len" aria-label="케이블 길이(m)"></label>' +
            '<label class="sim-switch"><input type="checkbox" data-sim="parallel"><span>전원선과 나란히 깔기</span></label>' +
            '<button type="button" class="sim-btn sim-play" data-sim="play">🔊 소리 켜기</button><p class="sim-note" data-role="src">녹음을 불러오는 중…</p>' +
            '<div class="sim-box sim-read" data-role="read"></div></div></div></section>' +
      '<section class="sim-cable-card"><h4>③ 케이블 테스터로 불량 찾기</h4><p class="sim-cable-lead">XLR 케이블 3개 중 하나가 불량이에요. 케이블을 골라 「검사하기」를 누르고, 받는 쪽 불빛을 보고 끊긴 핀을 찾아 고르세요.</p>' +
        '<div class="sim-cable-tester"><div data-role="tester"></div><div class="sim-cable-ctl"><div class="sim-cable-seg" role="radiogroup" aria-label="검사할 케이블">' +
          [1, 2, 3].map(function (n) { return '<label><input type="radio" name="simCableT" value="' + n + '"' + (n === 1 ? ' checked' : '') + '>케이블 ' + '①②③'.charAt(n - 1) + '</label>'; }).join('') + '</div>' +
          '<button type="button" class="sim-btn sim-play" data-sim="scan">🔎 검사하기</button>' +
          '<div><b style="font-size:.8rem">이 케이블의 상태는?</b><div class="sim-cable-diag">' + [['1', '1번 단선'], ['2', '2번 단선'], ['3', '3번 단선'], ['0', '이상 없음']].map(function (d) { return '<button type="button" class="sim-btn" data-diag="' + d[0] + '">' + d[1] + '</button>'; }).join('') + '</div></div>' +
          '<p class="sim-cable-fb" data-role="tfb">케이블을 골라 검사해 보세요.</p></div></div></section>' +
    '</div>';
    var q = function (s) { return el.querySelector(s); };
    var rigEl = q('[data-role=rig]'), read = q('[data-role=read]'), cv = q('[data-role=scope]'), ctx = cv.getContext('2d'), lenIn = q('[data-sim=len]'), parIn = q('[data-sim=parallel]'), testerEl = q('[data-role=tester]'), tfb = q('[data-role=tfb]');
    var dpr = Math.min(2, window.devicePixelRatio || 1);

    /* ---------- ① 연결 */
    function slotStatus(k) { var c = S.conn[k]; if (!c) return null; return SLOTS[k].fb[c] || ['bad', '맞지 않아요.']; }
    function rigSvg() {
      function dev(x, y, w, h, a, b) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>' + t(x + w / 2, y + h / 2 - 1, a, { size: 13, weight: 800 }) + t(x + w / 2, y + h / 2 + 15, b, { size: 10.5, fill: C.sub }); }
      function link(k, x1, y1, x2, y2, lx, ly) {
        var st = slotStatus(k), sl = SLOTS[k], col = !st ? '#94a3b8' : st[0] === 'ok' ? sl.color : C.red, dash = !st || st[0] !== 'ok' ? ' stroke-dasharray="6 5"' : '', wdt = k === 'C' && st && st[0] === 'ok' ? 7 : 4;
        var lab = !st ? '고르기' : st[0] === 'ok' ? sl.level : (st[0] === 'danger' ? '✕ 위험' : '✕ 맞지 않음');
        return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="' + wdt + '"' + dash + '/>' +
          '<circle cx="' + lx + '" cy="' + ly + '" r="10" fill="' + col + '"/>' + t(lx, ly + 4, '①②③'.charAt('ABC'.indexOf(k)), { size: 12, fill: '#fff', weight: 800 }) +
          t(lx, ly + 26, lab, { size: 11, weight: 800, fill: col });
      }
      return '<svg class="sim-cable-svg" viewBox="0 0 420 210" role="img" aria-label="세 가지 연결 그림" font-family="Pretendard, system-ui, sans-serif">' +
        dev(4, 20, 76, 44, 'SM58S', '마이크') + dev(160, 14, 104, 56, 'MG12XU', 'CH1 · STEREO OUT') + dev(340, 20, 76, 44, 'ZXA1', '액티브') +
        dev(150, 136, 124, 52, 'Crown XLi1500', '파워앰프 CH1') + dev(340, 140, 76, 44, 'ZX1', '패시브') +
        '<path d="M212 70 V136" stroke="#64748b" stroke-width="2.5"/>' + t(218, 112, 'XLR (연결됨)', { size: 10, fill: C.sub, anchor: 'start' }) +
        link('A', 80, 42, 160, 42, 120, 42) + link('B', 264, 42, 340, 42, 302, 42) + link('C', 274, 162, 340, 162, 307, 162) + '</svg>';
    }
    function renderRig() {
      rigEl.innerHTML = rigSvg();
      ['A', 'B', 'C'].forEach(function (k) { var st = slotStatus(k), fb = q('[data-fb=' + k + ']'); fb.className = 'sim-cable-fb' + (st ? ' ' + st[0] : ''); fb.textContent = st ? (st[0] === 'ok' ? '✓ ' : st[0] === 'danger' ? '⚠️ ' : '✗ ') + st[1] : '케이블을 골라 보세요.';
        var r = el.querySelector('input[name=simCable' + k + '][value="' + S.conn[k] + '"]'); if (r) r.checked = true; });
      var nOk = ['A', 'B', 'C'].filter(function (k) { var s = slotStatus(k); return s && s[0] === 'ok'; }).length;
      if (nOk === 3) hit('rig');
    }

    /* ---------- ② 험 */
    function hum() {
      var u = humDbUnbal(S.len, S.parallel), h = S.type === 'bal' ? u - CMR_DB : u;
      return { unbal: u, hum: h, snr: -h };
    }
    function verdict(snr) { return snr >= 50 ? ['ok', '깨끗해요 (험이 들리지 않아요)'] : snr >= 30 ? ['warn', '조용할 때 험이 들려요'] : ['bad', '험이 커요'] ; }
    function renderHum() {
      var H = hum(), v = verdict(H.snr);
      lenIn.value = S.len; q('[data-out=len]').textContent = S.len + ' m'; parIn.checked = !!S.parallel;
      var r = el.querySelector('input[name=simCableType][value=' + S.type + ']'); if (r) r.checked = true;
      read.innerHTML = '<h4>받는 쪽 결과 <small>교육용 근사</small></h4>' +
        '<div class="sim-row"><span>케이블</span><b>' + (S.type === 'bal' ? '밸런스 XLR' : '언밸런스 TS') + ' · ' + S.len + ' m' + (S.parallel ? ' · 전원선 옆' : '') + '</b></div>' +
        '<div class="sim-row"><span>케이블에 들어온 험</span><b>' + H.unbal.toFixed(0) + ' dB</b></div>' +
        '<div class="sim-row"><span>입력에 남은 험</span><b class="' + v[0] + '">' + H.hum.toFixed(0) + ' dB</b></div>' +
        '<span class="sim-bar ' + v[0] + '"><i style="width:' + clamp((H.hum + 110) / 110 * 100, 0, 100).toFixed(1) + '%"></i></span>' +
        '<div class="sim-row"><span>신호 대 험</span><b class="' + v[0] + '">' + H.snr.toFixed(0) + ' dB · ' + v[1] + '</b></div>' +
        '<p class="sim-note">dB 는 보컬의 가장 큰 순간 대비 크기예요. 험은 듣기 쉽게 실제보다 크게 만들었고, 밸런스 입력의 제거량은 ' + CMR_DB + ' dB 로 가정했어요.</p>';
      if (S.type === 'unbal' && S.len >= 20 && H.snr < 30) { S.sawHum = true; hit('hum'); }
      if (S.type === 'bal' && S.len >= 20 && S.sawHum && H.snr >= 50) hit('cancel');
      if (S.type === 'unbal' && S.len <= 3 && H.snr >= 40) hit('short');
      applyAudio();
    }
    function envNow() {
      if (!vox) return 0.6;
      var tt = S.audio && actx && nodes ? (actx.currentTime - nodes.start) % vox.dur : ((performance.now() - S.t0) / 1000) % vox.dur;
      return vox.env[Math.floor(tt / vox.blk) % vox.env.length] || 0;
    }
    function sizeScope() { var w = cv.parentNode.clientWidth || 500, h = w < 520 ? 400 : 380; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    /* 2026-10-24: 밸런스·언밸런스 그림을 「신호가 지나가는 길」로 다시 그림
       (참고: rasantekaudio.com — Balanced vs Unbalanced Audio 의 전송 그림과 설명 순서)
       위: 보내는 쪽 → 케이블(핫 + · 콜드 − · 그라운드) → 가운데 잡음 구역에서 두 선에 같은 잡음 → 받는 쪽
       아래: 받는 쪽에서 일어나는 일 — 핫(신호+잡음) + 뒤집은 콜드(신호−잡음) = 신호 2배, 잡음 0
       움직이지 않는 그림이고, 길이·전원선 옆 깔기를 바꾸면 잡음 크기만 바뀌어요. */
    var FONT = 'Pretendard, system-ui, sans-serif', lastSteps = '';
    function stepsHtml(bal) {
      return bal ? '<ol class="sim-cable-steps"><li><b>나눠 보내기</b> — 같은 소리를 <b style="color:#0e7490">핫(+)</b>에는 그대로, <b style="color:#7c3aed">콜드(−)</b>에는 뒤집어서 보내요. 그라운드(실드)는 따로 있어요.</li>' +
          '<li><b>잡음은 똑같이</b> — 두 선이 나란히 꼬여 붙어 있어서, 전원선·조명에서 오는 잡음이 두 선에 <b>같은 모양</b>으로 들어와요.</li>' +
          '<li><b>다시 뒤집어 더하기</b> — 받는 쪽에서 콜드를 한 번 더 뒤집으면 신호는 핫과 같은 모양이 되고, 잡음은 반대 모양이 돼요.</li>' +
          '<li><b>결과</b> — 둘을 더하면 반대 모양인 잡음은 서로 지워지고, 같은 모양인 신호는 2배가 돼요.</li></ol>'
        : '<ol class="sim-cable-steps"><li><b>한 가닥으로 보내기</b> — 언밸런스(TS·RCA)는 신호선 1가닥과 그라운드(실드)뿐이에요.</li>' +
          '<li><b>잡음이 섞임</b> — 지나가는 길에 들어온 잡음이 신호와 한데 섞여요.</li>' +
          '<li><b>지울 방법이 없음</b> — 비교할 짝(콜드 선)이 없어서, 받는 쪽은 무엇이 신호이고 무엇이 잡음인지 구분하지 못해요.</li>' +
          '<li><b>그래서</b> — 케이블이 길수록, 전원선 가까이 지날수록 잡음이 커져요. 짧고 조용한 연결에는 언밸런스도 충분해요.</li></ol>';
    }
    function drawScope() {
      var W = cv.width / dpr, Hh = cv.height / dpr; if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hh); ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, Hh);
      var H = hum(), bal = S.type === 'bal', narrow = W < 520;
      var nk = clamp(0.25 + (H.unbal + 50) / 44 * 0.75, 0.25, 1);   // 잡음 크기(그림용): 길수록·전원선 옆일수록 커짐
      var nkTxt = nk >= 0.75 ? '큼' : nk >= 0.45 ? '보통' : '작음';
      var stepsEl = q('[data-role=steps]'); if (stepsEl && lastSteps !== S.type) { stepsEl.innerHTML = stepsHtml(bal); lastSteps = S.type; }
      var HOT = '#22d3ee', COLD = '#a78bfa', GND = '#94a3b8', NZ = '#fb923c', OK = '#4ade80', BAD = '#fbbf24';
      function sig(u, cyc) { return Math.sin(2 * Math.PI * (cyc || 3) * u); }
      function nz(u) { return 0.62 * Math.sin(2 * Math.PI * 23 * u + 0.4) + 0.38 * Math.sin(2 * Math.PI * 41 * u + 1.7); }
      function txt(s, x, y, o) { o = o || {}; ctx.fillStyle = o.c || '#e2e8f0'; ctx.font = (o.w || 400) + ' ' + (o.s || 12) + 'px ' + FONT; ctx.textAlign = o.a || 'left'; ctx.fillText(s, x, y); }
      function wrapC(s, cx, y, maxW, lh, o) { o = o || {}; ctx.font = (o.w || 400) + ' ' + (o.s || 12) + 'px ' + FONT; var words = s.split(' '), line = '', yy = y; words.forEach(function (w) { var tst = line ? line + ' ' + w : w; if (ctx.measureText(tst).width > maxW && line) { txt(line, cx, yy, o); line = w; yy += lh; } else line = tst; }); if (line) txt(line, cx, yy, o); return yy; }
      function rbox(x, y, w, h, r, fill, stroke) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); } }
      function arrow(x, y, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y - 5); ctx.lineTo(x - 8, y + 5); ctx.closePath(); ctx.fill(); }
      function trace(x1, x2, base, f, col, lw, dash) { ctx.strokeStyle = col; ctx.lineWidth = lw || 2; ctx.setLineDash(dash || []); ctx.beginPath(); for (var x = x1; x <= x2; x += 1) { var y = base - f(x); if (x === x1) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); ctx.setLineDash([]); }

      /* ---------- 위: 신호가 지나가는 길 ---------- */
      var bw = narrow ? 58 : clamp(W * 0.14, 62, 104), top = 30, bot = 196;
      var sx = 10, rx = W - 10 - bw, xs = sx + bw + 8, xe = rx - 6;
      rbox(sx, top + 10, bw, bot - top - 20, 10, '#111a2e', '#334155'); rbox(rx, top + 10, bw, bot - top - 20, 10, '#111a2e', '#334155');
      txt('보내는 쪽', sx + bw / 2, top + 34, { a: 'center', w: 800, s: narrow ? 11 : 12 }); wrapC(narrow ? '콘솔·마이크' : '콘솔·마이크 출력', sx + bw / 2, top + 52, bw - 10, 14, { a: 'center', s: 10.5, c: '#94a3b8' });
      txt('받는 쪽', rx + bw / 2, top + 34, { a: 'center', w: 800, s: narrow ? 11 : 12 });
      wrapC(bal ? (narrow ? '콜드를 뒤집어 더함' : '콜드를 다시 뒤집어 핫과 더해요') : (narrow ? '그대로 받음' : '들어온 그대로 받아요'), rx + bw / 2, top + 52, bw - 10, 14, { a: 'center', s: 10.5, c: bal ? OK : BAD });
      var zx1 = xs + (xe - xs) * 0.38, zx2 = xs + (xe - xs) * 0.62;
      ctx.fillStyle = 'rgba(251,146,60,0.10)'; ctx.fillRect(zx1, top + 8, zx2 - zx1, bot - top - 16);
      ctx.strokeStyle = 'rgba(251,146,60,0.55)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.strokeRect(zx1, top + 8, zx2 - zx1, bot - top - 16); ctx.setLineDash([]);
      txt(narrow ? (bal ? '⚡ 두 선에 같은 잡음' : '⚡ 잡음') : '⚡ 잡음이 들어오는 곳', (zx1 + zx2) / 2, top - 2, { a: 'center', w: 800, s: 11, c: NZ });
      txt((narrow ? '' : '(전원선·조명 등) ') + '잡음 ' + nkTxt, (zx1 + zx2) / 2, bot + 12, { a: 'center', s: 10.5, c: NZ });
      txt(S.len + ' m ' + (bal ? '밸런스 (XLR)' : '언밸런스 (TS)'), xs, 14, { s: 11, w: 700, c: '#cbd5e1' });
      var A = 11, nA = 6 * nk;
      function ramp(x) { return clamp((x - zx1) / (zx2 - zx1), 0, 1); }
      var rows = bal ? [[top + 38, narrow ? '핫 (+)' : '핫 (+) · 원래 신호', HOT, 1], [top + 92, narrow ? '콜드 (−) · 뒤집음' : '콜드 (−) · 뒤집은 신호', COLD, -1], [bot - 22, narrow ? '그라운드' : '그라운드 (실드)', GND, 0]]
                     : [[top + 38, narrow ? '신호선' : '신호선 · 원래 신호', HOT, 1], [top + 92, null, null, null], [bot - 22, narrow ? '그라운드' : '그라운드 (실드)', GND, 0]];
      rows.forEach(function (r) {
        var y = r[0];
        if (!r[1]) { ctx.strokeStyle = '#334155'; ctx.setLineDash([3, 6]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xs, y); ctx.lineTo(xe, y); ctx.stroke(); ctx.setLineDash([]); txt(narrow ? '콜드 선 없음' : '콜드 선 없음 — 언밸런스는 짝이 되는 선이 없어요', xs + 4, y - 8, { s: 10.5, c: '#64748b' }); return; }
        txt(r[1], xs + 2, y - 15, { s: 10.5, w: 700, c: r[2] });
        if (!r[3]) { trace(xs, xe - 6, y, function () { return 0; }, r[2], 2); arrow(xe, y, r[2]); return; }
        trace(xs, xe - 6, y, function (x) { var u = (x - xs) / (xe - xs); return A * r[3] * sig(u, 4) + nA * ramp(x) * nz(u); }, r[2], 2.2);
        arrow(xe, y, r[2]);
      });
      if (bal && !narrow) {   // 같은 잡음이 두 선에 똑같이
        txt('두 선에 같은 잡음', (zx1 + zx2) / 2, top + 66, { a: 'center', s: 10.5, w: 700, c: NZ });
        txt('뒤집기', rx - 4, top + 92 + 18, { a: 'right', s: 10, w: 700, c: COLD });
      }

      /* ---------- 아래: 받는 쪽에서 일어나는 일 ---------- */
      var y0 = bot + 30; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y0 - 8); ctx.lineTo(W, y0 - 8); ctx.stroke();
      txt('받는 쪽에서 일어나는 일', 12, y0 + 10, { w: 800, s: 12.5 });
      var opW = narrow ? 18 : 26, pTop = y0 + 22, pH = Hh - pTop - 10, pw = (W - 20 - 2 * opW) / 3;
      function panel(i, title, col, f, nf, nLab) {
        var x = 10 + i * (pw + opW); rbox(x, pTop, pw, pH, 9, '#111a2e', '#1e293b');
        var ty = wrapC(title, x + pw / 2, pTop + 17, pw - 10, 13, { a: 'center', s: narrow ? 10 : 11, w: 700, c: col });
        var mid = Math.max(ty + 34, pTop + pH * 0.48), x1 = x + 8, x2 = x + pw - 8;
        if (f) trace(x1, x2, mid, function (xx) { return f((xx - x1) / (x2 - x1)); }, col, 2.2);
        var ny = pTop + pH - 24;
        if (nf) { trace(x1, x2, ny, function (xx) { return nf((xx - x1) / (x2 - x1)); }, NZ, 1.4, nf === true ? [3, 3] : null); }
        if (nLab) txt(nLab, x + pw / 2, pTop + pH - 6, { a: 'center', s: 10, c: NZ });
      }
      function op(i, s) { txt(s, 10 + (i + 1) * pw + i * opW + opW / 2, pTop + pH * 0.5 + 6, { a: 'center', w: 800, s: 18 }); }
      var a2 = 10;
      if (bal) {
        panel(0, '핫: 신호 + 잡음', HOT, function (u) { return a2 * sig(u, 2) + nA * nz(u); }, function (u) { return nA * nz(u); }, '잡음 (+)');
        op(0, '+');
        panel(1, '콜드를 뒤집으면: 신호 − 잡음', COLD, function (u) { return a2 * sig(u, 2) - nA * nz(u); }, function (u) { return -nA * nz(u); }, '잡음 (−) 반대 모양');
        op(1, '=');
        panel(2, '결과: 신호 2배 · 잡음 0', OK, function (u) { return 2 * a2 * sig(u, 2); }, function () { return 0; }, '잡음이 지워짐');
      } else {
        panel(0, '신호선: 신호 + 잡음', HOT, function (u) { return a2 * sig(u, 2) + nA * nz(u); }, function (u) { return nA * nz(u); }, '잡음');
        op(0, '→');
        panel(1, '결과: 잡음이 그대로 남아요', BAD, function (u) { return a2 * sig(u, 2) + nA * nz(u); }, function (u) { return nA * nz(u); }, '잡음 그대로');
        op(1, '✕');
        var x3 = 10 + 2 * (pw + opW); rbox(x3, pTop, pw, pH, 9, '#111a2e', '#1e293b');
        wrapC('뺄 짝(콜드 선)이 없어서 잡음만 골라 지울 수 없어요', x3 + pw / 2, pTop + 24, pw - 14, 15, { a: 'center', s: narrow ? 10.5 : 11.5, c: '#cbd5e1' });
      }
    }
    function wrapText(txt, x, y, maxW, lh) { var line = '', yy = y; txt.split(' ').forEach(function (w) { var test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = test; }); if (line) ctx.fillText(line, x, yy); }
    function loop() { if (!alive) return; raf = requestAnimationFrame(loop); drawScope(); }
    function applyAudio() {
      if (!nodes) return; var H = hum(), N = 0.5 * Math.pow(10, H.unbal / 20), tt = actx.currentTime, bal = S.type === 'bal';
      nodes.nHot.gain.setTargetAtTime(N, tt, 0.03); nodes.nCold.gain.setTargetAtTime(N * (1 - EPS), tt, 0.03);
      nodes.oh.gain.setTargetAtTime(bal ? 0.5 : 1, tt, 0.02); nodes.oc.gain.setTargetAtTime(bal ? -0.5 : 0, tt, 0.02);
    }
    function startAudio() {
      if (!vox || !vox.buffer) { q('[data-role=src]').textContent = '녹음을 불러오지 못해 소리는 들을 수 없어요(파형은 가상 신호로 동작).'; return; }
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      actx = actx || new AC(); if (actx.resume) actx.resume();
      function g(v) { var n = actx.createGain(); n.gain.value = v; return n; }
      var src = actx.createBufferSource(); src.buffer = vox.buffer; src.loop = true;
      var norm = g(0.5 / (vox.max || 1)), sHot = g(1), sCold = g(-1), hot = g(1), cold = g(1), nHot = g(0), nCold = g(0), oh = g(1), oc = g(0), out = g(0.8);
      var osc = actx.createOscillator(); osc.frequency.value = 60;
      var real = new Float32Array(8), imag = new Float32Array([0, 1, 0.55, 0.4, 0.22, 0.15, 0.1, 0.07]); osc.setPeriodicWave(actx.createPeriodicWave(real, imag));
      src.connect(norm); norm.connect(sHot); norm.connect(sCold); sHot.connect(hot); sCold.connect(cold);
      osc.connect(nHot); osc.connect(nCold); nHot.connect(hot); nCold.connect(cold);   // 험은 두 선에 같은 극성으로 들어옴
      hot.connect(oh); cold.connect(oc); oh.connect(out); oc.connect(out); out.connect(actx.destination);   // 밸런스: (핫 − 콜드) / 2
      var start = actx.currentTime + 0.05, off = ((performance.now() - S.t0) / 1000) % vox.dur; src.start(start, off); osc.start(start);
      nodes = { src: src, osc: osc, nHot: nHot, nCold: nCold, oh: oh, oc: oc, out: out, start: start - off }; S.audio = true; applyAudio();
    }
    function stopAudio() { if (nodes) { try { nodes.src.stop(); nodes.osc.stop(); nodes.out.disconnect(); } catch (e) { /* 이미 멈춤 */ } } nodes = null; S.audio = false; }

    /* ---------- ③ 테스터 */
    function cont(cable, pin) { return !(cable === S.faulty && pin === S.faultPin); }
    function renderTester() {
      var c = S.tCable, step = S.scanStep[c] || 0, scanned = !!S.scanned[c];
      function led(x, y, on, n, col) { return '<circle cx="' + x + '" cy="' + y + '" r="10" fill="' + (on ? (col || '#22c55e') : '#1f2937') + '" stroke="' + (on ? '#bbf7d0' : '#475569') + '" stroke-width="2"/>' + t(x + (x > 200 ? 24 : -24), y + 4, n + '번', { size: 12, fill: '#e2e8f0', weight: 800 }); }
      var s = '<svg class="sim-cable-svg" viewBox="0 0 420 230" role="img" aria-label="케이블 테스터" font-family="Pretendard, system-ui, sans-serif"><rect x="4" y="4" width="412" height="222" rx="14" fill="#1e293b"/>' +
        t(210, 28, '케이블 ' + '①②③'.charAt(c - 1) + ' · XLR 10 m', { size: 13, fill: '#e2e8f0', weight: 800 }) + t(110, 54, '보내는 쪽', { size: 11, fill: '#94a3b8' }) + t(310, 54, '받는 쪽', { size: 11, fill: '#94a3b8' });
      for (var p = 1; p <= 3; p++) {
        var y = 70 + (p - 1) * 42, sent = scanned || step >= p, got = sent && cont(c, p);
        s += led(120, y, sent, p) + led(320, y, got, p) + '<path d="M132 ' + y + 'H' + (sent && !got ? 210 : 308) + '" stroke="' + (sent ? (got ? '#64748b' : '#f87171') : '#334155') + '" stroke-width="2.5"/>' +
          (sent && !got ? t(222, y + 5, '✕', { size: 15, fill: '#f87171', weight: 800 }) : '');
      }
      s += t(210, 210, scanned ? '검사 끝 — 받는 쪽 불빛을 확인하세요' : step ? '검사 중… 핀을 하나씩 보내는 중' : '「검사하기」를 누르면 1 → 2 → 3번 핀 순서로 확인해요', { size: 11.5, fill: scanned ? '#fde68a' : '#cbd5e1' }) + '</svg>';
      testerEl.innerHTML = s;
      var r = el.querySelector('input[name=simCableT][value="' + c + '"]'); if (r) r.checked = true;
    }
    function scan(instant) {
      var c = S.tCable; if (S.scanned[c] || (S.busy[c] && !instant)) { renderTester(); return; }
      if (instant) { S.scanStep[c] = 3; S.scanned[c] = true; renderTester(); checkPin(); return; }
      S.scanStep[c] = 0; S.busy[c] = true;
      [1, 2, 3].forEach(function (p) { timers.push(setTimeout(function () { if (!alive) return; S.scanStep[c] = p; if (p === 3) S.scanned[c] = true; if (S.tCable === c) renderTester(); if (p === 3) checkPin(); }, 380 * p)); });
      tfb.className = 'sim-cable-fb'; tfb.textContent = '검사 중이에요…';
    }
    function diagnose(v) {
      var c = S.tCable;
      if (!S.scanned[c]) { tfb.className = 'sim-cable-fb bad'; tfb.textContent = '먼저 「검사하기」로 핀을 확인한 뒤 골라 주세요.'; return; }
      S.diag[c] = v; var truth = c === S.faulty ? S.faultPin : 0;
      if (v === truth) { tfb.className = 'sim-cable-fb ok'; tfb.textContent = '✓ 맞아요. ' + (truth ? PIN_MEAN[truth] + ' 「불량」 표시를 붙여 따로 빼 두고 수리해요.' : '세 핀이 모두 이어져 있는 정상 케이블이에요.'); }
      else { tfb.className = 'sim-cable-fb bad'; tfb.textContent = '✗ 다시 보세요. 받는 쪽에서 불이 켜지지 않은 핀이 끊긴 핀이에요.' + (truth ? '' : ' 이 케이블은 모든 불이 켜졌어요.'); }
      checkPin();
    }
    function checkPin() { if (S.scanned[S.faulty] && S.diag[S.faulty] === S.faultPin) hit('pin'); }

    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }

    /* ---------- 이벤트 */
    function onChange(e) {
      var tg = e.target, k = tg.getAttribute('data-cslot');
      if (k) { S.conn[k] = tg.value; renderRig(); return; }
      if (tg.name === 'simCableType') { S.type = tg.value; renderHum(); return; }
      if (tg === parIn) { S.parallel = tg.checked; renderHum(); return; }
      if (tg.name === 'simCableT') { S.tCable = +tg.value; renderTester(); tfb.className = 'sim-cable-fb'; tfb.textContent = S.scanned[S.tCable] ? '이미 검사한 케이블이에요. 상태를 골라 보세요.' : '「검사하기」를 눌러 보세요.'; }
    }
    function onInput(e) { if (e.target === lenIn) { S.len = clamp(+lenIn.value, 1, 50); renderHum(); } }
    function onClick(e) {
      var b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      var k = b.getAttribute('data-sim');
      if (k === 'play') { if (S.audio) { stopAudio(); b.textContent = '🔊 소리 켜기'; b.classList.remove('on'); } else { startAudio(); if (S.audio) { b.textContent = '🔇 소리 끄기'; b.classList.add('on'); } } return; }
      if (k === 'scan') { scan(false); return; }
      var d = b.getAttribute('data-diag'); if (d != null) diagnose(+d);
    }
    el.addEventListener('change', onChange); el.addEventListener('input', onInput); el.addEventListener('click', onClick);
    var ro = window.ResizeObserver ? new ResizeObserver(function () { sizeScope(); }) : null; if (ro) ro.observe(cv.parentNode); else window.addEventListener('resize', sizeScope);
    sizeScope(); renderRig(); renderHum(); renderTester(); loop();
    getVox(function (d) { if (!alive) return; vox = d; S.t0 = performance.now(); q('[data-role=src]').textContent = d.synthetic ? '녹음을 불러오지 못해 파형만 가상 신호로 보여 줘요.' : '보컬 녹음(MG12XU 실습과 같은 음원)에 60 Hz 험을 더해 들려줘요. 처음엔 소리가 꺼져 있어요.'; });

    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); timers.forEach(clearTimeout); stopAudio(); if (actx && actx.close) { try { actx.close(); } catch (e) { /* noop */ } }
        el.removeEventListener('change', onChange); el.removeEventListener('input', onInput); el.removeEventListener('click', onClick); if (ro) ro.disconnect(); else window.removeEventListener('resize', sizeScope); el.innerHTML = ''; },
      state: function () { var H = hum(); return { conn: { A: S.conn.A, B: S.conn.B, C: S.conn.C }, connOk: ['A', 'B', 'C'].filter(function (k) { var s = slotStatus(k); return s && s[0] === 'ok'; }).length,
        type: S.type, len: S.len, parallel: S.parallel, humDb: H.hum, snr: H.snr, sawHum: S.sawHum, audio: S.audio, ready: !!vox, synthetic: !!(vox && vox.synthetic),
        tester: { cable: S.tCable, scanned: Object.keys(S.scanned).map(Number), diag: JSON.parse(JSON.stringify(S.diag)), faulty: S.faulty, faultPin: S.faultPin }, done: Object.keys(S.done) }; },
      set: function (o) {
        o = o || {};
        if (o.conn) { Object.keys(o.conn).forEach(function (k) { if (SLOTS[k]) S.conn[k] = o.conn[k]; }); renderRig(); }
        var hv = false; if (o.type) { S.type = o.type === 'bal' ? 'bal' : 'unbal'; hv = true; } if (o.len != null) { S.len = clamp(Math.round(+o.len), 1, 50); hv = true; } if (o.parallel != null) { S.parallel = !!o.parallel; hv = true; } if (hv) renderHum();
        if (o.cable) { S.tCable = clamp(+o.cable, 1, 3); renderTester(); }
        if (o.scan) scan(true);
        if (o.diag != null) diagnose(+o.diag);
        return this.state();
      }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.cableBench = cableBench;

  /* =========================================================================== 모듈 데이터 */
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES.cable = {
    id: 'cable', path: 'hardware', no: 2, status: 'ready', level: '기본', minutes: 30, img: 'img/modules/hw_cable.jpg',
    title: '케이블', sub: '신호와 전원을 안전하게 전달하는 통로',
    overview: {
      lead: '케이블은 소리 신호와 전원이 지나가는 길이에요. 커넥터 모양이 같아도 안에 흐르는 것(<b>마이크·라인·스피커 레벨, 디지털, 전원</b>)이 달라요. 무엇이 흐르는지 알고 골라야 소리가 깨끗하고 장비도 안전해요.',
      terms: [
        ['XLR', '잠금 장치가 있는 3핀 커넥터예요. 마이크·라인 신호를 밸런스로 보내요. 1번 그라운드(실드), 2번 핫(+), 3번 콜드(−).'],
        ['TS / TRS (6.3 mm 폰)', 'TS(팁·슬리브)는 언밸런스 악기·라인용, TRS(팁·링·슬리브)는 밸런스 라인이나 스테레오 헤드폰용이에요. 플러그의 검은 띠 개수로 구분해요.'],
        ['speakON', '앰프 → 패시브 스피커에 쓰는 잠금식 스피커 커넥터예요(NL4). 큰 전력이 흐르는 스피커 레벨 전용이에요.'],
        ['밸런스 (평형)', '같은 신호를 핫·콜드 두 선에 반대 극성으로 실어 보내고, 받는 쪽에서 두 선의 차이만 꺼내 잡음을 지우는 방식이에요.'],
        ['언밸런스 (불평형)', '신호선 1가닥과 그라운드(실드)로 보내는 방식이에요. 들어온 잡음이 그대로 남아서 짧은 거리에 써요.'],
        ['공통 모드 제거', '두 선에 똑같이(같은 극성으로) 들어온 잡음을 받는 쪽에서 빼서 없애는 원리예요. 밸런스 연결의 핵심이에요.'],
        ['Dante (네트워크 오디오)', '랜선(이더넷) 한 가닥으로 수십 채널의 디지털 오디오를 보내는 방식이에요. 디지털 콘솔과 무대 스테이지박스를 이을 때 많이 써요.'],
        ['AES/EBU (AES3)', '케이블 한 가닥에 디지털 오디오 2채널을 보내는 규격이에요. XLR 모양 커넥터와 110 Ω 디지털 케이블을 써요.']
      ],
      points: [
        '마이크·라인 신호는 <b>XLR(밸런스)</b>로, 앰프 → 패시브 스피커는 <b>speakON 스피커 케이블</b>로 연결해요. 모양이 맞는다고 아무 케이블이나 쓰지 않아요.',
        '앰프·스피커 출력(스피커 레벨)은 <b>절대 콘솔이나 장비의 입력에 꽂지 않아요.</b>',
        '소리가 끊기거나 지직거리면 케이블부터 의심하고, <b>케이블 테스터</b>로 핀을 하나씩 확인해요. 정리는 <b>오버-언더</b>로 감아요.'
      ],
      model: 'xlr'
    },
    theory: [
      { title: '커넥터 종류와 흐르는 신호', visual: 'cableConnectors',
        body: '케이블은 끝의 <b>커넥터</b>로 구분해요. XLR·TS·TRS 는 작은 <b>아날로그 신호</b>, speakON 은 앰프에서 스피커로 가는 <b>큰 전력</b>, RJ45(랜선)는 <b>디지털 네트워크 오디오</b>, 전원 케이블은 장비에 <b>전기</b>를 줘요. 커넥터마다 흐르는 것이 달라서, 연결하기 전에 「이 단자에서 무엇이 나오고 무엇이 들어가는지」를 먼저 확인해요.',
        more: '<ul><li><b>XLR</b>: 마이크, 콘솔 메인 출력, 앰프 입력처럼 마이크·라인 신호에 써요. 보통 <b>출력 쪽이 수(핀), 입력 쪽이 암(구멍)</b>이라 신호 방향을 알기 쉬워요. 잠금 장치(PUSH 버튼)를 누르고 빼요.</li><li><b>TS·TRS</b>: 모양이 거의 같아서 헷갈려요. 플러그 끝의 검은 띠가 1개면 TS, 2개면 TRS 예요. MG12XU 의 CH5–12 LINE 단자에는 「UNBAL」이라고 적혀 있어요(패널 표기).</li><li><b>speakON</b>: 꽂고 오른쪽으로 돌려 잠가요. Crown XLi1500 은 speakON 과 바인딩 포스트 출력이 있어요(제조사 자료).</li><li><b>RJ45 · etherCON</b>: etherCON 은 랜선 커넥터를 금속 잠금 케이스로 감싼 것이에요. 무대용 디지털 콘솔·스테이지박스의 네트워크 단자에 많이 써요.</li><li><b>전원 케이블</b>: 220V 가 흐르는 위험한 선이에요. 접지 핀을 떼거나 접지 없는 어댑터로 바꿔 험을 없애려 하면 <b>감전 위험</b>이 있어 절대 하지 않아요.</li></ul>',
        check: { q: 'Crown 파워앰프의 출력을 ZX1 패시브 스피커에 연결할 때 쓰는 케이블은?', options: [
          { t: 'speakON 스피커 케이블', ok: true, why: '맞아요. 앰프의 큰 출력(스피커 레벨)을 보내는 전용 케이블이에요.' },
          { t: 'XLR 마이크 케이블', why: 'XLR 은 마이크·라인 신호용이에요. 스피커 레벨에는 쓰지 않아요.' },
          { t: 'TS 악기 케이블', why: '악기 케이블은 속선이 가늘어 스피커의 큰 전류에 열이 나고 출력이 손실돼요.' }] } },
      { title: '커넥터 구조와 핀 배열 · 호환성', visual: 'cablePins',
        body: 'XLR 의 <b>1번은 그라운드(실드), 2번은 핫(+), 3번은 콜드(−)</b>예요. TRS 는 <b>팁 = 핫, 링 = 콜드, 슬리브 = 그라운드</b>로 같은 밸런스 신호를 담아요. 그래서 TRS ↔ XLR 변환은 밸런스가 그대로지만, 링이 없는 TS 로 바꾸면 콜드 선이 없어져 <b>언밸런스</b>가 돼요.',
        more: '<ul><li>XLR 의 핀 번호는 커넥터 안쪽에 작게 새겨져 있어요. 수와 암은 앞에서 볼 때 1·2번 위치가 좌우로 바뀌어 보여요.</li><li>팬텀 전원(+48V)은 2·3번 핀에 똑같이 걸리고 1번으로 돌아와요. 그래서 1번이 끊기면 콘덴서 마이크가 동작하지 않아요.</li><li>speakON NL4 는 1+/1− 가 스피커의 +/− 예요. 2+/2− 는 두 번째 채널이나 저음용(바이앰프)에 쓰고, 일반 패시브 스피커 연결에서는 1+/1− 만 써요.</li><li>MG12XU 의 CH1–4 는 XLR 과 폰 잭을 한 구멍에 함께 쓰는 <b>콤보 단자</b>예요(패널 표기 MIC/LINE). XLR 로 꽂으면 마이크 입력, 폰 잭으로 꽂으면 라인 입력으로 써요.</li><li>변환 젠더는 급할 때만 쓰고, 연결이 헐거워 접촉 불량이 생기기 쉬우니 맞는 케이블을 준비해요.</li></ul>',
        check: { q: 'TRS 케이블과 TS 케이블의 차이로 알맞은 것은?', options: [
          { t: 'TRS 는 링(콜드 선)이 있어 밸런스 신호를 보낼 수 있고, TS 는 언밸런스예요', ok: true, why: '맞아요. 검은 띠가 2개(팁·링·슬리브)면 TRS 예요.' },
          { t: '둘은 같고 길이만 달라요', why: '플러그의 접점 수가 달라요. TS 는 팁·슬리브 2개, TRS 는 팁·링·슬리브 3개예요.' },
          { t: 'TS 가 잡음에 더 강해요', why: '반대예요. 콜드 선이 없는 TS 는 잡음을 지울 수 없어 더 약해요.' }] } },
      { title: '밸런스와 언밸런스 — 잡음이 사라지는 원리', visual: 'cableBalanced',
        body: '밸런스 케이블은 <b>핫(+)</b>과 <b>콜드(−)</b> 두 선에 같은 신호를 <b>반대 극성</b>으로 실어요. 가는 길에 들어온 잡음(험)은 두 선에 <b>똑같이</b> 들어와요. 받는 쪽 입력은 두 선의 <b>차이(핫 − 콜드)</b>만 꺼내므로, 신호는 2배가 되고 똑같이 들어온 잡음은 지워져요. 이것을 <b>공통 모드 제거</b>라고 해요. 언밸런스는 신호선이 하나뿐이라 들어온 잡음이 그대로 남아요.',
        more: '<ul><li>두 선을 꼬아(트위스트) 두면 두 선이 잡음을 거의 똑같이 받아 더 잘 지워져요. 바깥의 실드(그물망)는 전기 잡음을 막아 줘요.</li><li>밸런스가 되려면 <b>보내는 쪽 출력, 케이블, 받는 쪽 입력이 모두 밸런스</b>여야 해요. 하나라도 언밸런스면 그 연결은 언밸런스예요.</li><li>잡음을 지우는 정도는 장비마다 달라요(CMRR, dB 로 표시). 완벽하지는 않아서 전원선과는 떨어뜨리고, 만나야 하면 직각으로 교차시켜요.</li><li>언밸런스 악기·라인 케이블은 보통 몇 m 이내로 짧게 쓰고, 멀리 보낼 때는 DI 박스로 밸런스 신호로 바꿔요.</li></ul>',
        check: { q: '밸런스 케이블이 잡음을 없애는 원리는?', options: [
          { t: '두 선에 똑같이 들어온 잡음을 받는 쪽에서 빼서 지운다', ok: true, why: '맞아요. 신호는 반대 극성이라 빼면 커지고, 같은 극성인 잡음은 지워져요.' },
          { t: '케이블이 두꺼워서 잡음이 못 들어온다', why: '잡음은 들어와요. 두 선에 똑같이 들어오기 때문에 받는 쪽에서 지울 수 있는 거예요.' },
          { t: '콘솔이 잡음 주파수만 EQ 로 깎는다', why: 'EQ 가 아니라 두 선의 차이를 꺼내는 입력 회로가 잡음을 지워요.' }] } },
      { title: '마이크·라인·스피커 레벨 — 어느 케이블을 어디에', visual: 'cableLevels',
        body: '같은 XLR 이라도 <b>마이크 레벨</b>인지 <b>라인 레벨</b>인지에 따라 꽂는 곳이 달라요. 마이크는 콘솔의 MIC 입력으로, 콘솔 출력(라인)은 액티브 스피커의 LINE 입력이나 파워앰프 입력으로 가요. 파워앰프에서 패시브 스피커까지는 큰 전력이 흐르는 <b>스피커 레벨</b>이라 speakON 스피커 케이블만 써요.',
        more: '<ul><li><b>출력 → 입력 방향 확인</b>: 앰프·스피커 출력(스피커 레벨)을 콘솔·앰프·스피커의 입력에 꽂으면 입력 회로가 망가질 수 있어요. 스피커 출력에 speakON 을 쓰는 이유 중 하나가 신호 단자에 잘못 꽂지 못하게 하는 거예요.</li><li><b>패시브 스피커에 악기(TS) 케이블 금지</b>: 속선이 가늘어 큰 전류에 뜨거워지고 소리 손실도 커요. 모양이 맞는 단자가 있어도 쓰지 않아요.</li><li>라인 신호를 MIC 입력에 넣으면 너무 커서 찌그러지고(PAD 가 필요), 마이크를 LINE 입력에 넣으면 너무 작아요.</li><li>MG12XU 패널 표기: STEREO OUT·AUX SEND·GROUP OUT 은 <b>+4 dBu</b>, CH9–12 LINE 은 <b>−10 dBu</b> 기준이에요(제조사 자료).</li><li>speakON·스피커 케이블은 앰프를 끈 상태(또는 볼륨을 내린 상태)에서 꽂고 빼요. 앰프는 맨 나중에 켜고 맨 먼저 꺼요.</li></ul>',
        check: { q: 'Crown 앰프의 speakON 출력 케이블을 MG12XU 입력에 꽂으려는 사람이 있어요. 알맞은 판단은?', options: [
          { t: '절대 안 돼요. 스피커 레벨이 입력 회로를 망가뜨릴 수 있어요', ok: true, why: '맞아요. 스피커 레벨은 출력 → 패시브 스피커로만 보내요.' },
          { t: 'GAIN 을 최소로 내리면 괜찮아요', why: 'GAIN 을 내려도 입력 회로에 이미 큰 전력이 들어가요.' },
          { t: 'PAD 를 켜면 괜찮아요', why: 'PAD 는 라인 레벨 정도의 큰 신호를 줄이는 것이지 스피커 레벨용이 아니에요.' }] } },
      { title: '아날로그와 디지털 연결 · 네트워크 오디오', visual: 'cableNetwork',
        body: '아날로그 케이블은 보통 한 가닥에 <b>한 채널</b>을 보내요. 디지털 연결은 소리를 숫자로 바꿔 보내서 한 가닥에 여러 채널을 보낼 수 있어요. <b>AES/EBU</b> 는 XLR 모양 케이블 한 가닥에 2채널, <b>Dante</b> 는 랜선 한 가닥에 수십 채널이에요. 예를 들어 무대의 <b>스테이지박스</b>가 마이크 신호를 디지털로 바꾸면, 굵은 멀티 케이블 대신 <b>랜선 한 가닥</b>으로 방송실 디지털 콘솔까지 보낼 수 있어요.',
        more: '<ul><li><b>스테이지박스</b>: 무대에 두는 입출력 장치예요. 마이크 프리앰프와 디지털 변환기가 들어 있어서, 마이크 신호를 무대에서 바로 디지털로 바꿔 보내요. 팬텀 전원·GAIN 은 보통 콘솔에서 원격으로 조절해요.</li><li><b>Primary / Secondary</b>: 같은 소리를 두 네트워크로 동시에 보내는 <b>이중화(예비 길)</b>예요. 한쪽이 끊겨도 다른 쪽으로 소리가 이어져요. Audinate 는 Secondary 단자를 장비를 이어 붙이는(데이지 체인) 용도로 쓰지 말라고 안내해요. 이중화로 쓸 때는 Primary 와 Secondary 를 서로 다른 스위치(별도 네트워크)로 구성해요.</li><li><b>운영 규칙</b>: 예배 중에는 Dante 랜선·네트워크 스위치를 뽑거나 끄지 않아요. 그 길로 다니는 모든 채널이 한꺼번에 끊기고, 다시 꽂아도 연결이 다시 잡히는 동안 소리가 나지 않아요. 랜선은 Cat5e 이상, 한 구간은 이더넷 규격상 최대 100 m 예요. 일반 인터넷 공유기·사무실 네트워크에 함부로 연결하지 않아요.</li><li>AES/EBU 는 110 Ω 디지털 전용 케이블을 권장해요. 디지털 연결은 조금 약해져도 깨끗하다가, 한계를 넘으면 갑자기 끊기거나 「틱」 소리가 나요(아날로그는 점점 나빠져요).</li></ul>',
        check: { q: '예배 중 방송실 네트워크 스위치의 랜선 하나가 쓰지 않는 선처럼 보여요. 어떻게 할까요?', options: [
          { t: '예배 중에는 건드리지 않고, 끝난 뒤 담당자와 확인한다', ok: true, why: '맞아요. 네트워크 오디오 랜선이라면 무대 입력 수십 채널이 한꺼번에 끊길 수 있어요.' },
          { t: '쓰지 않는 선 같으니 뽑아 정리한다', why: '스테이지박스 ↔ 콘솔 선이면 무대 입력이 모두 사라져요.' },
          { t: '잠깐 뽑았다가 바로 다시 꽂으면 괜찮다', why: '다시 꽂아도 Dante 연결이 다시 잡히는 동안 소리가 끊겨요.' }] } },
      { title: '케이블 관리와 고장 진단', visual: 'cableCare',
        body: '소리가 끊기거나 「지직」거리면 케이블부터 의심해요. 흔한 원인은 <b>단선</b>(속선이 끊김)과 <b>접촉 불량</b>(커넥터 안 납땜이 떨어지거나 핀이 더러움)이에요. <b>케이블 테스터</b>에 양쪽 끝을 꽂으면 1·2·3번 핀이 각각 이어졌는지 불빛으로 보여 줘요. 케이블은 <b>오버-언더</b>로 감아 꼬이지 않게 보관해요.',
        more: '<ul><li><b>핀별 증상</b>: 2번이나 3번이 끊기면 소리가 아주 작아지거나 끊기고 잡음에 약해져요. 1번이 끊기면 험이 커지고 팬텀 전원이 가지 않아요. 2·3번이 서로 붙으면(단락) 소리가 나지 않아요.</li><li><b>흔들어 보기</b>: 소리를 들으며 커넥터 근처를 살살 구부려 「지직」 하면 그 끝의 접촉 불량이에요.</li><li><b>바꿔 보기</b>: 의심되는 케이블을 확실한 케이블로 바꿔 보면 가장 빨리 확인할 수 있어요.</li><li>뽑을 때는 선이 아니라 <b>커넥터를 잡고</b> 뽑아요. 무대 바닥 케이블은 테이프나 덮개로 고정해 걸려 넘어지지 않게 해요.</li><li>불량 케이블은 그 자리에서 「불량」 테이프를 붙여 따로 빼 둬요. 다시 섞이면 다음 예배에 같은 문제가 생겨요.</li></ul>',
        check: { q: '케이블 테스터에서 받는 쪽 2번 불빛만 켜지지 않아요. 이 케이블은?', options: [
          { t: '2번 선이 끊긴(단선) 불량 케이블이에요', ok: true, why: '맞아요. 보낸 신호가 2번 선으로 도착하지 못했어요.' },
          { t: '정상이에요. 2번은 원래 꺼져요', why: '정상 XLR 케이블이면 1·2·3번이 모두 켜져요.' },
          { t: '팬텀 전원이 꺼져 있어서예요', why: '케이블 테스터는 팬텀 전원과 상관없이 선이 이어졌는지만 확인해요.' }] } }
    ],
    practice: {
      kind: 'cableBench',
      lead: '가상 케이블 작업대예요. ① 작은 장비 구성에 맞는 케이블을 고르고, ② 긴 케이블에 들어오는 험을 언밸런스와 밸런스로 비교해 듣고, ③ 케이블 테스터로 불량 XLR 의 끊긴 핀을 찾아요. 「소리 켜기」를 누르면 실제 보컬 녹음에 험을 더한 소리를 들을 수 있어요.',
      note: '험의 크기, 길이·전원선에 따른 변화, 밸런스 입력의 제거량(50 dB)은 교육용 근사 모델이에요. 듣기 쉽도록 험을 실제보다 크게 만들었고, 실제 잡음은 전원·배선 환경에 따라 달라요.',
      tasks: [
        { id: 'rig', title: '알맞은 케이블 연결', text: '①②③ 세 연결(마이크 → MG12XU, MG12XU 메인 출력 → ZXA1, Crown 앰프 → ZX1)에 모두 맞는 케이블을 고르세요.' },
        { id: 'hum', title: '긴 언밸런스의 험', text: '언밸런스(TS) 케이블을 20 m 이상으로 늘려 「험이 커요」(신호 대 험 30 dB 미만)를 확인하세요.' },
        { id: 'cancel', title: '밸런스로 험 지우기', text: '같은 길이(20 m 이상)에서 밸런스(XLR)로 바꿔 험이 지워지는 것(신호 대 험 50 dB 이상)을 확인하세요.' },
        { id: 'short', title: '짧은 언밸런스는 괜찮아요', text: '언밸런스를 3 m 이하로 짧게, 전원선과 떨어뜨려 신호 대 험 40 dB 이상이 되는 것을 확인하세요.' },
        { id: 'pin', title: '끊긴 핀 찾기', text: '케이블 테스터로 불량 XLR 케이블을 검사하고, 끊긴 핀 번호를 맞히세요.' }
      ],
      links: [
        { title: '확성 시스템의 기본 · 3D 실습 ③', text: 'XLR·speakON·전원 케이블로 MG12XU → Crown → ZX1 패시브 스피커를 직접 연결해 봐요.', go: { tab: 'tab1', card: 's3' } },
        { title: 'MG12XU 실습 · 장비 연결', text: '마이크·악기·스피커를 MG12XU 의 단자에 케이블로 직접 연결해 봐요.', go: { tab: 'tab6' } }
      ]
    },
    quiz: [
      { q: '찬양팀 기타를 무대에서 15 m 떨어진 콘솔까지 보내야 해요. 가장 알맞은 방법은?', options: [
        { t: 'DI 박스로 밸런스 신호로 바꿔 XLR 로 보낸다', ok: true, why: '맞아요. 긴 거리는 밸런스가 잡음에 강해요.' },
        { t: '긴 TS 악기 케이블로 바로 연결한다', why: '언밸런스라 길수록 험과 잡음이 쉽게 들어와요.' },
        { t: '랜선으로 연결한다', why: '아날로그 악기 신호는 랜선으로 바로 보낼 수 없어요. Dante 는 디지털 장비끼리의 연결이에요.' }] },
      { q: '밸런스 케이블에서 콜드(3번) 선에 신호를 반대 극성으로 싣는 이유는?', options: [
        { t: '받는 쪽에서 두 선의 차이를 꺼낼 때 신호는 커지고, 똑같이 들어온 잡음은 지워지게 하려고', ok: true, why: '맞아요. 공통 모드 제거의 원리예요.' },
        { t: '더 큰 전력을 보내려고', why: '밸런스는 전력이 아니라 잡음을 지우기 위한 방식이에요.' },
        { t: '왼쪽·오른쪽 스테레오 소리를 보내려고', why: '스테레오 2채널은 TRS 헤드폰 케이블의 쓰임이에요. 밸런스 케이블은 한 채널을 두 선으로 보내요.' }] },
      { q: 'MG12XU 의 STEREO OUT 을 ZXA1 액티브 스피커에 연결할 때 ZXA1 의 어느 입력에 꽂을까요?', options: [
        { t: 'LINE 입력', ok: true, why: '맞아요. 콘솔 출력은 라인 레벨이에요.' },
        { t: 'MIC 입력', why: '라인 레벨은 마이크 입력에는 너무 커서 찌그러질 수 있어요.' },
        { t: '어디든 같아요', why: '입력마다 받는 신호 크기가 달라요.' }] },
      { q: '무대 스테이지박스와 디지털 콘솔을 랜선으로 연결한 교회예요. 예배 중 무대 마이크·악기가 한꺼번에 모두 안 들리는데, 콘솔에 바로 꽂은 마이크는 잘 들려요. 가장 먼저 의심할 곳은?', options: [
        { t: '스테이지박스와 콘솔을 잇는 네트워크(랜선·스위치·전원)', ok: true, why: '맞아요. 무대 입력은 모두 그 길로 오고, 콘솔에 바로 꽂은 마이크는 그 길을 지나지 않아요.' },
        { t: '콘솔에 바로 꽂은 마이크 케이블', why: '그 마이크는 잘 들리고 있어요. 문제는 여러 채널이 함께 지나는 길이에요.' },
        { t: '마이크마다 하나씩 케이블 불량', why: '모든 채널이 동시에 끊겼다면 공통으로 지나는 길을 먼저 봐요.' }] },
      { q: '예배가 끝나고 XLR 케이블을 정리할 때 알맞은 방법은?', options: [
        { t: '커넥터를 잡고 뽑아 오버-언더로 감는다', ok: true, why: '맞아요. 선이 꼬이지 않고 속선도 상하지 않아요.' },
        { t: '팔꿈치에 감아 단단히 묶는다', why: '선이 꼬이고 속선이 상해 단선의 원인이 돼요.' },
        { t: '선을 잡아당겨 한 번에 뽑는다', why: '납땜 부분이 떨어져 접촉 불량이 생겨요.' }] }
    ],
    missions: [
      { title: '음향 트러블슈팅 · 미션 C', text: '패시브 스피커에서 소리가 안 날 때, 앰프 출력과 스피커 케이블을 따라가며 원인을 찾아요.', go: { tab: 'tab7', ts: 'C' } },
      { title: '음향 트러블슈팅 · 미션 B', text: '스피커 한쪽만 소리가 안 날 때, 케이블과 연결 단자를 하나씩 확인해요.', go: { tab: 'tab7', ts: 'B' } }
    ],
    deeper: [
      { title: 'DI 박스', text: '기타·키보드처럼 언밸런스 출력을 멀리 보낼 때, DI 박스로 밸런스 마이크 레벨 신호로 바꿔 콘솔 MIC 입력에 넣어요.', more: 'GND LIFT(그라운드 리프트) 스위치가 있는 DI 는 험(그라운드 루프)을 줄이는 데도 써요. 전원 플러그의 접지를 끊어 험을 없애는 것은 감전 위험이 있어 절대 하지 않아요.' },
      { title: '그라운드 루프와 험', text: '장비들이 서로 다른 콘센트·접지에 연결되면 그라운드 사이로 전류가 돌아 60 Hz 「웅-」 험이 생길 수 있어요.', more: '음향 장비는 가능하면 같은 전원 계통에서 받고, 신호 케이블은 밸런스로 연결하고, 전원선과는 직각으로 교차시켜요. 원인을 모를 때는 장비를 하나씩 빼 보며 험이 사라지는 곳을 찾아요.' },
      { title: '디지털 케이블', text: '디지털 케이블은 소리를 숫자(0과 1)로 바꿔 보내요. 한 가닥에 여러 채널을 실을 수 있고, 거리가 길어도 소리가 나빠지지 않아요. 대표적인 종류는 AES/EBU, 네트워크 오디오(랜선), MADI, 광케이블이에요.', more: '<ul><li><b>AES/EBU (AES3)</b>: XLR 모양 커넥터, 한 가닥에 2채널. 일반 마이크 케이블이 아니라 110 Ω 디지털 전용 케이블을 써요.</li><li><b>네트워크 오디오 (Dante 등)</b>: 랜선(Cat5e·Cat6) 한 가닥에 수십~수백 채널. 한 구간 최대 100 m, 더 멀면 네트워크 스위치나 광케이블로 이어요.</li><li><b>MADI</b>: 동축(BNC) 케이블이나 광케이블 한 가닥에 최대 64채널. 방송·대형 공연장에서 많이 써요.</li><li><b>광케이블 (ADAT · TOSLINK)</b>: 빛으로 보내 전기 잡음이 없어요. ADAT 은 한 가닥에 8채널이에요. 심하게 꺾으면 안에 유리·플라스틱 심이 상해요.</li><li><b>아날로그와 다른 점</b>: 아날로그는 조금씩 나빠지지만(잡음이 늘어남), 디지털은 깨끗하다가 한계를 넘으면 <b>갑자기 끊기거나 「틱」 소리</b>가 나요. 그래서 규격에 맞는 케이블과 길이를 지키는 것이 중요해요.</li><li>디지털 장비끼리는 <b>같은 기준 시계(클럭)</b>에 맞춰 움직여야 해요. 클럭이 맞지 않으면 「틱틱」 잡음이 생겨요.</li></ul>' }
    ],
    sources: [
      { t: 'Yamaha R Series(2세대) 사양 — Rio3224-D2 입출력·AES/EBU·Dante 단자', url: 'https://in.yamaha.com/en/products/proaudio/interfaces/r_series_adda_2/specs.html' },
      { t: 'Yamaha CL 시리즈 사양 — CL5 Dante 64/64, Primary·Secondary', url: 'https://mx.yamaha.com/es/products/proaudio/mixers/cl_series/specs.html' },
      { t: 'Audinate — Dante 네트워크 FAQ (Secondary 단자, Cat5e/Cat6, 기가비트)', url: 'https://my.audinate.com/node/266' },
      { t: 'Symetrix — Dante redundancy (Primary/Secondary 별도 네트워크)', url: 'https://www.symetrix.co/tech-tips/dante-redundancy' },
      { t: 'Crown XLi 1500 제품 페이지 — XLR·RCA 입력, speakON·바인딩 포스트 출력', url: 'https://jblpro.com/en-US/products/xli-1500' },
      { t: 'Yamaha MG12XU 사용설명서', url: 'https://usa.yamaha.com/files/download/other_assets/8/1506928/mg16x_en_om_a0.pdf' },
      { t: 'Shure — What is phantom power?', url: 'https://www.shure.com/en-US/insights/what-is-phantom-power-why-do-i-need-it' }
    ]
  };
})();
