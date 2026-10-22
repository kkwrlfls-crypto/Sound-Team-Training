/* =============================================================================
   현장 도구 그림 (2026-10-23) — 자가 진단 기준표·실전 꿀팁에 들어가는 설명 그림(SVG)
   - window.STAFieldFig.<이름>() → '<svg …>' 문자열.  데이터(field_data.js)의 fig 값과 이름이 같아야 해요.
   - 숫자가 있는 그림은 기준표 본문과 같은 값(참고 기준)을 써요. 그림 속 배치·거리는 이해를 돕기 위한 예시예요.
   ============================================================================= */
(function () {
  'use strict';
  var C = { navy: '#0f2747', cyan: '#0e7490', bright: '#22d3ee', soft: '#e6f6f9', ok: '#059669', okS: '#d1fae5', bad: '#dc2626', badS: '#fee2e2', warn: '#d97706', warnS: '#fef3c7', ink: '#334155', sub: '#64748b', line: '#cbd5e1', fill: '#f1f5f9', wall: '#94a3b8', white: '#ffffff' };
  function svg(w, h, body, label) { return '<svg class="fld-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, \'Noto Sans KR\', system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 11) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + s + '</text>'; }
  function arrowDefs(id, col) { return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="' + col + '"/></marker></defs>'; }
  function spk(x, y, w, h, rot, col) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')"><rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="2" fill="' + (col || C.navy) + '"/><circle cx="' + (w / 2 - 3) + '" cy="0" r="' + Math.min(w, h) * 0.22 + '" fill="' + C.wall + '"/></g>'; }
  function person(x, y, col, s) { s = s || 1; return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="' + (col || C.sub) + '"><circle cx="0" cy="-14" r="5"/><path d="M-6 -7h12l2 13h-16z"/></g>'; }
  function check(x, y, ok) { return ok ? '<g transform="translate(' + x + ' ' + y + ')"><circle r="9" fill="' + C.ok + '"/><path d="M-4 0l3 3 5-6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>' : '<g transform="translate(' + x + ' ' + y + ')"><circle r="9" fill="' + C.bad + '"/><path d="M-4-4l8 8M4-4l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>'; }
  function seats(x0, y0, cols, rows, dx, dy, colFn) { var s = ''; for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) s += '<rect x="' + (x0 + c * dx) + '" y="' + (y0 + r * dy) + '" width="' + (dx - 3) + '" height="' + (dy - 3) + '" rx="2" fill="' + (colFn ? colFn(c, r) : C.line) + '"/>'; return s; }

  var F = {
    /* ---------------- A. 방송실 */
    boothWindow: function () {
      var half = function (x, open) {
        return '<g transform="translate(' + x + ' 0)"><rect x="0" y="20" width="150" height="120" rx="8" fill="' + (open ? C.okS : C.badS) + '"/>' +
          spk(22, 52, 14, 24, 0, C.navy) + '<path d="M34 52 Q 70 ' + (open ? 52 : 40) + ' ' + (open ? 112 : 84) + ' ' + (open ? 70 : 52) + '" stroke="' + C.cyan + '" stroke-width="2.5" fill="none" stroke-dasharray="' + (open ? '0' : '4 3') + '" marker-end="url(#aw' + (open ? 1 : 0) + ')"/>' +
          '<rect x="90" y="36" width="4" height="70" fill="' + (open ? 'none' : C.cyan) + '" opacity=".6"/>' + (open ? '<path d="M90 36 l-12 -8" stroke="' + C.cyan + '" stroke-width="3"/>' : '') +
          person(120, 92, C.navy, 1.2) + '<rect x="104" y="96" width="34" height="6" rx="2" fill="' + C.ink + '"/>' +
          t(75, 130, open ? '창을 열고 메인 소리를 직접 들음' : '유리 뒤에서 헤드폰·모니터만', { size: 10.5, weight: 700, fill: open ? C.ok : C.bad }) + check(140, 30, open) + '</g>';
      };
      return svg(320, 150, arrowDefs('aw1', C.cyan) + arrowDefs('aw0', C.cyan) + half(5, true) + half(165, false), '방송실 창을 열었을 때와 닫았을 때 비교');
    },
    monitorTriangle: function () {
      return svg(320, 170, '<polygon points="110,40 210,40 160,127" fill="' + C.soft + '" stroke="' + C.cyan + '" stroke-dasharray="5 4" stroke-width="1.5"/>' +
        spk(110, 40, 22, 16, 30, C.navy) + spk(210, 40, 22, 16, 150, C.navy) + person(160, 145, C.navy, 1.3) +
        t(160, 30, '같은 거리', { size: 10.5, fill: C.cyan, weight: 700 }) + t(118, 92, '같은 거리', { size: 10, fill: C.cyan, anchor: 'end' }) + t(202, 92, '같은 거리', { size: 10, fill: C.cyan, anchor: 'start' }) +
        t(160, 165, '정삼각형 · 스피커는 귀를 향하게', { size: 10.5, weight: 700 }) +
        '<g transform="translate(262 40)"><rect x="-14" y="10" width="28" height="70" fill="' + C.line + '"/>' + spk(0, 0, 18, 26, 0, C.navy) + '<path d="M10 -2 H40" stroke="' + C.warn + '" stroke-dasharray="3 2"/>' + person(46, 18, C.sub, 1) + t(20, 96, '트위터 = 귀 높이', { size: 10, fill: C.warn, weight: 700 }) + '</g>', '모니터 스피커 정삼각형 배치');
    },
    refLevel: function () {
      return svg(320, 150, '<g transform="translate(70 70)"><circle r="42" fill="' + C.fill + '" stroke="' + C.line + '" stroke-width="2"/><circle r="30" fill="' + C.navy + '"/><path d="M0 0 L-18 -22" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="-34" y="-50" width="26" height="12" rx="2" fill="' + C.warn + '" transform="rotate(-40)"/>' + t(0, 62, '볼륨 노브 + 테이프 표시', { size: 10.5, weight: 700 }) + '</g>' +
        '<path d="M125 70 H170" stroke="' + C.sub + '" stroke-width="2" marker-end="url(#ar)"/>' + arrowDefs('ar', C.sub) +
        '<g transform="translate(238 70)"><rect x="-55" y="-46" width="110" height="80" rx="10" fill="' + C.navy + '"/><rect x="-44" y="-34" width="88" height="34" rx="4" fill="#0b1d36"/>' +
        t(0, -10, '82 dB(A)', { size: 18, fill: C.bright, weight: 800 }) + t(0, 22, '핑크 노이즈 −18 dBFS', { size: 9.5, fill: '#cbd5e1' }) + t(0, 52, '듣는 자리에서 한쪽씩 (EBU 참고)', { size: 10, weight: 700 }) + '</g>', '모니터 기준 레벨 정하기');
    },
    /* ---------------- B. 메인 스피커 */
    coverage: function () {
      var miss = function (c, r) { return (r === 0 && (c === 0 || c === 9)) || (r === 5 && c === 9) ? C.bad : C.line; };
      return svg(320, 190, '<rect x="20" y="10" width="280" height="30" rx="4" fill="' + C.fill + '"/>' + t(160, 30, '단상', { size: 11, fill: C.sub }) +
        '<path d="M70 38 L18 175 L160 175 Z" fill="' + C.cyan + '" opacity=".14"/><path d="M250 38 L160 175 L302 175 Z" fill="' + C.cyan + '" opacity=".14"/>' +
        '<path d="M70 38 L18 175 M70 38 L160 175 M250 38 L160 175 M250 38 L302 175" stroke="' + C.cyan + '" stroke-dasharray="4 3"/>' +
        spk(70, 40, 18, 10, 90, C.navy) + spk(250, 40, 18, 10, 90, C.navy) + seats(40, 60, 10, 6, 24, 19, miss) +
        '<g transform="translate(20 186)">' + t(0, 0, '■ 빨간 자리 = 지향각 밖(소리가 약함)', { size: 10, fill: C.bad, anchor: 'start', weight: 700 }) + '</g>', '스피커 지향각과 좌석 커버리지(위에서 본 그림)');
    },
    uniformity: function () {
      var v = [[84, 85, 85, 84], [83, 84, 84, 83], [82, 83, 83, 81], [80, 81, 81, 76]], cell = '';
      v.forEach(function (row, r) { row.forEach(function (d, c) { var bad = 85 - d > 6; cell += '<rect x="' + (60 + c * 52) + '" y="' + (34 + r * 30) + '" width="48" height="26" rx="4" fill="' + (bad ? C.badS : C.okS) + '" stroke="' + (bad ? C.bad : C.ok) + '"/>' + t(84 + c * 52, 52 + r * 30, d, { size: 12, weight: 700, fill: bad ? C.bad : C.ok }); }); });
      return svg(320, 170, '<rect x="60" y="8" width="204" height="18" rx="3" fill="' + C.fill + '"/>' + t(162, 21, '단상 (스피커)', { size: 10, fill: C.sub }) + cell +
        t(160, 164, '가장 큰 85 − 가장 작은 76 = 9 dB → 맨 뒤 오른쪽 보완 필요', { size: 10, weight: 700, fill: C.ink }) + t(30, 92, 'dB', { size: 10, fill: C.sub }), '좌석별 소리 크기 측정표 예시');
    },
    aiming: function () {
      return svg(320, 170, arrowDefs('ag', C.ok) + arrowDefs('ab', C.bad) + '<path d="M10 150 H300" stroke="' + C.ink + '" stroke-width="2"/><path d="M300 20 V150" stroke="' + C.wall + '" stroke-width="6"/>' + t(292, 14, '뒷벽', { size: 10, fill: C.sub }) +
        '<path d="M40 150 V40" stroke="' + C.line + '" stroke-width="3"/>' + spk(48, 40, 26, 16, 12, C.navy) +
        '<path d="M60 44 L215 140" stroke="' + C.ok + '" stroke-width="2.5" marker-end="url(#ag)"/><path d="M60 38 L296 50" stroke="' + C.bad + '" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#ab)"/>' +
        [80, 110, 140, 170, 200, 230, 260].map(function (x) { return person(x, 148, C.sub, 0.8); }).join('') +
        '<rect x="196" y="122" width="78" height="30" fill="' + C.ok + '" opacity=".12"/>' + t(235, 168, '뒤쪽 1/3 을 향하게', { size: 10.5, fill: C.ok, weight: 700 }) + t(190, 28, '벽·천장을 직접 때리면 메아리', { size: 10.5, fill: C.bad, weight: 700 }), '스피커 조준(옆에서 본 그림)');
    },
    micBehind: function () {
      return svg(320, 160, '<path d="M20 60 H300" stroke="' + C.cyan + '" stroke-width="2" stroke-dasharray="6 4"/>' + t(205, 78, '스피커 앞면 선', { size: 10, fill: C.cyan, weight: 700 }) +
        spk(60, 60, 26, 14, 90, C.navy) + spk(260, 60, 26, 14, 90, C.navy) + '<path d="M60 67 L20 150 M60 67 L130 150 M260 67 L190 150 M260 67 L300 150" stroke="' + C.cyan + '" opacity=".35"/>' +
        '<g transform="translate(160 36)"><circle r="6" fill="' + C.ink + '"/><path d="M0 6 V22" stroke="' + C.ink + '" stroke-width="2"/></g>' + check(180, 30, true) + t(160, 14, '선 뒤 = 양호', { size: 10.5, fill: C.ok, weight: 700 }) +
        '<g transform="translate(110 104)"><circle r="6" fill="' + C.ink + '"/><path d="M0 6 V22" stroke="' + C.ink + '" stroke-width="2"/></g>' + check(130, 98, false) + t(110, 145, '선 앞 = 스피커 소리를 받음', { size: 10.5, fill: C.bad, weight: 700 }), '마이크는 메인 스피커보다 뒤에(위에서 본 그림)');
    },
    delayAlign: function () {
      return svg(320, 222, '<path d="M10 150 H310" stroke="' + C.ink + '" stroke-width="2"/>' + spk(30, 50, 22, 16, 10, C.navy) + t(30, 30, '메인', { size: 10.5, weight: 700 }) +
        spk(220, 40, 18, 12, 30, C.cyan) + t(220, 24, '딜레이 스피커', { size: 10.5, weight: 700, fill: C.cyan }) + person(250, 148, C.navy, 1.1) +
        '<path d="M42 56 L246 128" stroke="' + C.navy + '" stroke-dasharray="5 4"/><path d="M228 46 L248 126" stroke="' + C.cyan + '" stroke-dasharray="5 4"/>' +
        '<g transform="translate(16 170)">' + t(0, 0, '메인까지 24 m ≈ 70 ms', { size: 10.5, anchor: 'start' }) + t(160, 0, '딜레이까지 3 m ≈ 9 ms', { size: 10.5, anchor: 'start', fill: C.cyan }) + t(0, 20, '→ 딜레이 스피커에 약 61 ms + 몇 ms 지연', { size: 10.5, anchor: 'start', weight: 700, fill: C.ok }) + '</g>' +
        t(160, 214, '거리 1 m ≈ 2.9 ms (소리 속도 343 m/s) · 숫자는 예시', { size: 9.5, fill: C.sub }), '딜레이 스피커 시간 맞추기 예시');
    },
    stiScale: function () {
      var bands = [[0, 0.3, '나쁨', C.bad], [0.3, 0.45, '부족', '#f97316'], [0.45, 0.6, '보통', C.warn], [0.6, 0.75, '좋음', '#10b981'], [0.75, 1, '아주 좋음', C.ok]], x = function (v) { return 20 + v * 280; };
      return svg(320, 120, bands.map(function (b) { return '<rect x="' + x(b[0]) + '" y="40" width="' + (x(b[1]) - x(b[0]) - 2) + '" height="26" rx="3" fill="' + b[3] + '" opacity=".85"/>' + t((x(b[0]) + x(b[1])) / 2, 58, b[2], { size: 10.5, fill: '#fff', weight: 700 }); }).join('') +
        [0, 0.3, 0.45, 0.6, 0.75, 1].map(function (v) { return t(x(v), 82, v, { size: 9.5, fill: C.sub }); }).join('') +
        '<path d="M' + x(0.5) + ' 28 V70" stroke="' + C.navy + '" stroke-width="2.5"/>' + t(x(0.5), 22, '0.5 이상 바람직', { size: 10.5, weight: 700, fill: C.navy }) + t(160, 108, '말소리 명료도 STI (IEC 60268-16 등급)', { size: 10.5, fill: C.ink }), 'STI 명료도 등급');
    },
    /* ---------------- C. 룸 어쿠스틱 */
    rtDecay: function () {
      var x = function (s) { return 40 + s * 120; }, y = function (db) { return 20 - db * 1.8; }, d = 'M' + x(0) + ' ' + y(0);
      for (var s = 0; s <= 2.2; s += 0.05) d += ' L' + x(s) + ' ' + y(Math.max(-64, -60 * s / 1.2 + Math.sin(s * 40) * 1.2));
      return svg(320, 160, '<rect x="' + x(0.8) + '" y="12" width="' + (x(1.5) - x(0.8)) + '" height="112" fill="' + C.okS + '"/>' + t((x(0.8) + x(1.5)) / 2, 150, '많은 예배당 0.8–1.5 초', { size: 10, fill: C.ok, weight: 700 }) +
        '<path d="M40 20 V' + y(-60) + ' H300" stroke="' + C.line + '" fill="none"/>' + '<path d="M40 ' + y(-60) + ' H300" stroke="' + C.bad + '" stroke-dasharray="4 3"/>' + t(298, y(-60) - 4, '−60 dB', { size: 9.5, fill: C.bad, anchor: 'end' }) +
        '<path d="' + d + '" stroke="' + C.navy + '" stroke-width="2" fill="none"/>' + t(36, 24, '0', { size: 9.5, fill: C.sub, anchor: 'end' }) + t(x(1.2), y(-60) + 14, '1.2 초', { size: 9.5, fill: C.navy }) +
        t(46, 12, '소리 크기', { size: 9.5, fill: C.sub, anchor: 'start' }) + t(300, 136, '시간 →', { size: 9.5, fill: C.sub, anchor: 'end' }), '잔향 시간: 소리가 60 dB 줄어드는 시간');
    },
    flutter: function () {
      var z = 'M70 30'; for (var i = 0; i < 9; i++) z += ' L' + (i % 2 ? 70 : 250) + ' ' + (30 + (i + 1) * 12);
      return svg(320, 160, '<rect x="56" y="16" width="10" height="128" fill="' + C.wall + '"/><rect x="254" y="16" width="10" height="128" fill="' + C.wall + '"/>' +
        '<path d="' + z + '" stroke="' + C.bad + '" stroke-width="1.8" fill="none"/>' + t(160, 156, '평행한 벽 사이에서 「찌르르」 계속 왕복', { size: 10.5, weight: 700, fill: C.bad }) +
        '<rect x="270" y="40" width="10" height="80" fill="' + C.cyan + '" opacity=".7"/>' + t(285, 136, '한쪽에 흡음재', { size: 10, fill: C.cyan, anchor: 'end', weight: 700 }), '플러터 에코');
    },
    slapEcho: function () {
      return svg(320, 150, arrowDefs('se', C.bad) + arrowDefs('sd', C.cyan) + '<path d="M10 130 H310" stroke="' + C.ink + '" stroke-width="2"/><rect x="300" y="20" width="10" height="110" fill="' + C.wall + '"/>' + t(296, 14, '뒷벽', { size: 10, fill: C.sub, anchor: 'end' }) +
        '<rect x="20" y="100" width="40" height="30" fill="' + C.navy + '"/>' + person(40, 98, C.navy, 1.2) + t(40, 145, '강대상', { size: 10, fill: C.sub }) +
        '<path d="M60 70 H296" stroke="' + C.cyan + '" stroke-width="2" marker-end="url(#sd)"/><path d="M296 86 H66" stroke="' + C.bad + '" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#se)"/>' +
        t(180, 62, '말소리', { size: 10.5, fill: C.cyan, weight: 700 }) + t(180, 102, '늦게 돌아오는 메아리 → 설교자의 말이 흔들림', { size: 10.5, fill: C.bad, weight: 700 }), '뒷벽 메아리');
    },
    snr: function () {
      return svg(320, 150, '<path d="M60 20 V130 H300" stroke="' + C.line + '" fill="none"/>' +
        '<rect x="100" y="34" width="60" height="96" rx="4" fill="' + C.cyan + '"/>' + t(130, 28, '설교 말소리', { size: 10.5, weight: 700, fill: C.cyan }) +
        '<rect x="200" y="94" width="60" height="36" rx="4" fill="' + C.wall + '"/>' + t(230, 88, '배경 소음', { size: 10.5, weight: 700, fill: C.sub }) +
        '<path d="M170 34 V94" stroke="' + C.ok + '" stroke-width="2"/><path d="M164 34 H176 M164 94 H176" stroke="' + C.ok + '" stroke-width="2"/>' + t(176, 68, '15 dB 이상', { size: 11, weight: 800, fill: C.ok, anchor: 'start' }) +
        t(160, 146, '교실 음향 기준(ANSI S12.60)에서 쓰는 참고값', { size: 9.5, fill: C.sub }), '말소리와 배경 소음 차이');
    },
    /* ---------------- D. 무대 */
    monitorNull: function () {
      var d = ''; for (var a = 0; a <= 360; a += 6) { var th = a * Math.PI / 180, r = 50 * (0.5 + 0.5 * Math.cos(th)); d += (a ? 'L' : 'M') + (160 + r * Math.cos(th - Math.PI / 2)).toFixed(1) + ' ' + (60 + r * Math.sin(th - Math.PI / 2)).toFixed(1); }
      return svg(320, 160, '<path d="' + d + 'Z" fill="' + C.cyan + '" opacity=".18" stroke="' + C.cyan + '"/>' + person(160, 24, C.navy, 1) +
        '<g transform="translate(160 62)"><circle r="6" fill="' + C.ink + '"/></g>' + t(196, 30, '노래하는 쪽(잘 받음)', { size: 10, fill: C.cyan, anchor: 'start', weight: 700 }) +
        '<g transform="translate(160 132)"><path d="M-22 -10 L22 -10 L16 10 L-16 10Z" fill="' + C.navy + '"/></g>' + check(196, 130, true) + t(160, 154, '모니터는 마이크 바로 뒤(카디오이드의 빈 곳)', { size: 10.5, weight: 700, fill: C.ok }), '카디오이드 마이크와 모니터 위치');
    },
    /* ---------------- 꿀팁 그림 */
    tipPinMic: function () {
      return svg(320, 150, '<g transform="translate(30 0)"><circle cx="50" cy="28" r="18" fill="' + C.fill + '" stroke="' + C.sub + '"/><path d="M14 150 V80 Q14 56 50 56 Q86 56 86 80 V150" fill="' + C.fill + '" stroke="' + C.sub + '"/>' +
        '<circle cx="62" cy="72" r="5" fill="' + C.navy + '"/><path d="M62 77 Q70 110 66 150" stroke="' + C.navy + '" fill="none" stroke-dasharray="3 2"/>' + '<path d="M50 44 Q58 56 62 66" stroke="' + C.cyan + '" stroke-dasharray="3 3" fill="none"/>' + '</g>' +
        t(150, 66, '가슴 위쪽,', { size: 10.5, anchor: 'start', weight: 700, fill: C.navy }) + t(150, 80, '고개 돌리는 쪽 옷깃', { size: 10.5, anchor: 'start', weight: 700, fill: C.navy }) + '<path d="M146 70 H98" stroke="' + C.navy + '"/>' +
        t(150, 116, '선은 옷 안으로 고정', { size: 10.5, anchor: 'start', fill: C.sub }) + '<path d="M146 112 H100" stroke="' + C.sub + '"/>', '핀마이크 다는 위치');
    },
    tipHand: function () {
      var cell = function (x, ico, txt) { return '<g transform="translate(' + x + ' 20)"><rect width="66" height="92" rx="10" fill="' + C.soft + '"/>' + ico + t(33, 82, txt, { size: 10, weight: 700, fill: C.navy }) + '</g>'; };
      var up = '<path d="M33 18 V58 M20 32 L33 18 L46 32" stroke="' + C.cyan + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      var dn = '<path d="M33 18 V58 M20 44 L33 58 L46 44" stroke="' + C.cyan + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      var ear = '<path d="M26 22 Q46 18 44 40 Q42 52 32 54 Q28 54 30 46" stroke="' + C.navy + '" stroke-width="3.5" fill="none"/><path d="M48 40 H60" stroke="' + C.cyan + '" stroke-width="3"/>';
      var ok = '<circle cx="33" cy="38" r="18" fill="none" stroke="' + C.ok + '" stroke-width="4"/><path d="M24 38 l6 6 12-12" stroke="' + C.ok + '" stroke-width="4" fill="none"/>';
      return svg(320, 130, cell(10, up, '올려 주세요') + cell(86, dn, '줄여 주세요') + cell(162, ear, '내 모니터') + cell(238, ok, '알았어요'), '무대와 방송실 손 신호 예시');
    },
    tipCoil: function () {
      return svg(320, 140, '<ellipse cx="110" cy="70" rx="56" ry="46" fill="none" stroke="' + C.navy + '" stroke-width="5"/><ellipse cx="110" cy="70" rx="46" ry="38" fill="none" stroke="' + C.cyan + '" stroke-width="5" stroke-dasharray="14 8"/>' +
        t(105, 132, '바깥·안 번갈아 감기', { size: 10.5, weight: 700 }) +
        '<g transform="translate(230 70)"><path d="M-30 -30 Q0 -50 30 -30 Q50 0 30 30 Q0 50 -30 30" fill="none" stroke="' + C.bad + '" stroke-width="5"/>' + check(30, -36, false) + t(0, 62, '팔꿈치 감기 금지', { size: 10.5, weight: 700, fill: C.bad }) + '</g>', '케이블 오버-언더 감기');
    },
    tipFader: function () {
      var fader = function (x, lab, hot, cut) { return '<g transform="translate(' + x + ' 18)"><rect x="-3" y="0" width="6" height="96" rx="3" fill="' + C.line + '"/><rect x="-14" y="' + (cut ? 54 : 26) + '" width="28" height="14" rx="3" fill="' + (hot ? C.bad : C.navy) + '"/>' + (cut ? '<path d="M18 30 V60" stroke="' + C.ok + '" stroke-width="3" marker-end="url(#fd)"/>' : '') + t(0, 112, lab, { size: 10, weight: 700, fill: hot ? C.bad : C.ink }) + '</g>'; };
      return svg(320, 140, arrowDefs('fd', C.ok) + fader(50, '설교', false) + fader(110, '보컬1', false) + fader(170, '보컬2', true, true) + fader(230, '성가대', false) +
        '<g transform="translate(290 18)"><rect x="-3" y="0" width="6" height="96" rx="3" fill="' + C.line + '"/><rect x="-14" y="26" width="28" height="14" rx="3" fill="' + C.navy + '"/>' + t(0, 112, 'MAIN', { size: 10, weight: 700 }) + '</g>' +
        t(170, 10, '방금 올린 것부터 내리기', { size: 10.5, weight: 700, fill: C.ok }), '하울링 대응: 방금 올린 페이더부터');
    }
  };
  /* 꿀팁 분류 아이콘 (작은 선 그림) */
  var ICON = {
    check: '<path d="M9 4h6v3H9z"/><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 13l2 2 4-4"/>',
    live: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>',
    monitor: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    team: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 19a5 5 0 0 1 10 0M11 19a5 5 0 0 1 10 0"/>',
    gear: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 19c4 0 7 1 9 2"/>',
    ear: '<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M10 9a2 2 0 0 1 4 0"/>',
    stream: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M10 9l4 2-4 2z"/><path d="M8 21h8"/>'
  };
  window.STAFieldFig = F;
  window.STAFieldIcon = function (k) { return '<svg class="fld-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[k] || '') + '</svg>'; };
})();
