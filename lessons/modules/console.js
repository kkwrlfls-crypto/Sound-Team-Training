/* =============================================================================
   학습 모듈: console — 콘솔 (하드웨어 이해 03) · 2026-10-21
   - STA_MODULES.console (모듈 데이터) + STAVisuals.console* (그림 6개) + STASims.consoleRouting (가상 채널·라우팅 보드)
   - 장비 사양은 「(제조사 자료)」, 시뮬레이션 값은 「교육용 근사」로 구분해 적음
   - 근거: Yamaha MG12X/MG12XU 기술 사양(Technical Specifications), MG XU 제품 페이지, MG12XU 패널 표기
           (이 저장소의 console_strip.jpg · master_section.jpg · jack_strip.jpg 실물 사진), Yamaha CL·Rio 사양
   ============================================================================= */
(function () {
  'use strict';
  var C = { ink: '#0f2747', sub: '#5b6b80', line: '#cbd5e1', teal: '#0e7490', cyan: '#22d3ee', blue: '#2563eb', red: '#dc2626', amber: '#f59e0b', green: '#16a34a', bg: '#f8fafc', purple: '#7c3aed', orange: '#ea580c' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + s + '</text>'; }
  function box(x, y, w, h, title, sub, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.r || 8) + '" fill="' + (o.fill || C.bg) + '" stroke="' + (o.stroke || C.line) + '" stroke-width="' + (o.sw || 1.5) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>' +
      t(x + w / 2, y + (sub ? h / 2 - 2 : h / 2 + 4), title, { size: o.size || 12, weight: 800, fill: o.color || C.ink }) + (sub ? t(x + w / 2, y + h / 2 + 12, sub, { size: o.subSize || 10, fill: o.subColor || C.sub }) : '');
  }
  function arrow(x1, y1, x2, y2, col, o) {
    o = o || {}; var a = Math.atan2(y2 - y1, x2 - x1), L = 7, hx = x2 - L * Math.cos(a), hy = y2 - L * Math.sin(a);
    return '<path d="M' + x1 + ' ' + y1 + 'L' + hx.toFixed(1) + ' ' + hy.toFixed(1) + '" stroke="' + col + '" stroke-width="' + (o.w || 2.2) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + ' fill="none"/>' +
      '<path d="M' + x2 + ' ' + y2 + 'L' + (hx + 4.5 * Math.sin(a)).toFixed(1) + ' ' + (hy - 4.5 * Math.cos(a)).toFixed(1) + 'L' + (hx - 4.5 * Math.sin(a)).toFixed(1) + ' ' + (hy + 4.5 * Math.cos(a)).toFixed(1) + 'Z" fill="' + col + '"/>';
  }

  /* =========================================================================== 그림 */
  var V = window.STAVisuals = window.STAVisuals || {};

  // 1) 입력과 출력 — MG12XU 입출력 단자(종류별로 모은 단순화 그림)
  V.consoleIO = function () {
    function combo(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="14" fill="#1f2937"/><circle cx="' + x + '" cy="' + y + '" r="5" fill="#64748b"/>' + [[-6, -5], [6, -5], [0, 8]].map(function (p) { return '<circle cx="' + (x + p[0]) + '" cy="' + (y + p[1]) + '" r="1.8" fill="#cbd5e1"/>'; }).join(''); }
    function xlrF(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="14" fill="#1f2937"/>' + [[-6, -4], [6, -4], [0, 7]].map(function (p) { return '<circle cx="' + (x + p[0]) + '" cy="' + (y + p[1]) + '" r="2.4" fill="#cbd5e1"/>'; }).join(''); }
    function xlrM(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="14" fill="#334155"/>' + [[-6, -4], [6, -4], [0, 7]].map(function (p) { return '<circle cx="' + (x + p[0]) + '" cy="' + (y + p[1]) + '" r="2.4" fill="#fbbf24"/>'; }).join(''); }
    function jack(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="9" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/><circle cx="' + x + '" cy="' + y + '" r="4" fill="#111827"/>'; }
    var s = '<rect x="4" y="4" width="592" height="176" rx="12" fill="#0f172a"/>' + t(14, 22, 'MG12XU 입력·출력 단자 — 실제 위치가 아니라 종류별로 모아 그린 그림', { size: 11, fill: '#cbd5e1', anchor: 'start' });
    // 입력
    s += '<rect x="12" y="30" width="318" height="142" rx="8" fill="none" stroke="' + C.cyan + '" stroke-dasharray="4 3"/>' + t(170, 46, '입력', { size: 11, fill: C.cyan, weight: 800 });
    [0, 1, 2, 3].forEach(function (i) { var x = 32 + i * 38; s += t(x, 66, String(i + 1), { size: 10, fill: '#e2e8f0', weight: 700 }) + combo(x, 86) + '<rect x="' + (x - 13) + '" y="110" width="12" height="9" rx="1.5" fill="#94a3b8"/><rect x="' + (x + 1) + '" y="110" width="12" height="9" rx="1.5" fill="#64748b"/>'; });
    s += t(89, 140, 'CH1–4 MIC/LINE 콤보', { size: 10, fill: '#e2e8f0' }) + t(89, 154, 'PAD 26dB · HPF 80Hz', { size: 9.5, fill: '#94a3b8' });
    [0, 1].forEach(function (i) { var x = 192 + i * 42; s += t(x, 66, i ? '7/8' : '5/6', { size: 10, fill: '#e2e8f0', weight: 700 }) + xlrF(x, 86) + jack(x - 9, 118) + jack(x + 11, 118); });
    s += t(210, 140, 'CH5–8 MIC·LINE', { size: 9.5, fill: '#e2e8f0' }) + t(210, 154, 'LINE 은 언밸런스', { size: 9.5, fill: '#94a3b8' });
    [0, 1].forEach(function (i) { var x = 280 + i * 28; s += t(x, 66, i ? '11/12' : '9/10', { size: 9, fill: '#e2e8f0', weight: 700 }) + jack(x, 86) + jack(x, 112); });
    s += t(296, 140, 'CH9–12 LINE', { size: 9.5, fill: '#e2e8f0' }) + t(294, 154, '−10dBu · UNBAL', { size: 9.5, fill: '#94a3b8' });
    // 출력
    s += '<rect x="340" y="30" width="248" height="142" rx="8" fill="none" stroke="#fbbf24" stroke-dasharray="4 3"/>' + t(464, 46, '출력 (+4 dBu)', { size: 11, fill: '#fbbf24', weight: 800 });
    s += jack(362, 76) + jack(388, 76) + t(375, 100, 'AUX1·2', { size: 9.5, fill: '#e2e8f0' }) + t(375, 112, 'SEND', { size: 9.5, fill: '#e2e8f0' });
    s += jack(420, 76) + jack(446, 76) + t(433, 100, 'GROUP', { size: 9.5, fill: '#e2e8f0' }) + t(433, 112, 'OUT 1·2', { size: 9.5, fill: '#e2e8f0' });
    s += xlrM(488, 74) + xlrM(530, 74) + jack(488, 106) + jack(530, 106) + t(509, 132, 'STEREO OUT L·R', { size: 10, fill: '#fde68a', weight: 700 }) + t(509, 145, 'XLR·폰 · 밸런스', { size: 9.5, fill: '#94a3b8' });
    s += jack(362, 140) + jack(388, 140) + t(375, 164, 'MONITOR OUT', { size: 9.5, fill: '#e2e8f0' }) + jack(446, 140) + t(446, 164, 'PHONES', { size: 9.5, fill: '#e2e8f0' }) + t(572, 164, '(제조사 자료)', { size: 9, fill: '#94a3b8', anchor: 'end' });
    // 2026-10-23: 3층 CL5 대신 공통 규칙
    s += '<rect x="4" y="190" width="592" height="66" rx="12" fill="' + C.bg + '" stroke="' + C.line + '"/>' +
      t(16, 214, '입력 = 소리가 들어오는 곳 · 출력 = 소리가 나가는 곳', { size: 12, weight: 800, anchor: 'start' }) +
      t(16, 238, '출력끼리·입력끼리 이으면 소리가 안 나요. 스피커 출력을 입력에 꽂으면 장비가 망가질 수 있어요', { size: 11, fill: C.sub, anchor: 'start' });
    return svg(600, 262, s, 'MG12XU 입력·출력 단자 (종류별 단순화 그림)');
  };

  // 2) 프리앰프·PAD·HPF·팬텀
  V.consoleInputStage = function () {
    var s = box(6, 40, 82, 44, '입력', 'MIC (XLR)') + arrow(88, 62, 110, 62, C.ink) +
      box(110, 40, 92, 44, 'PAD', '−26 dB (CH1–4)', { stroke: '#94a3b8', dash: '5 3' }) + arrow(202, 62, 224, 62, C.ink) +
      box(224, 34, 104, 56, 'GAIN', '소리 키우기', { fill: C.teal, stroke: C.teal, color: '#fff', subColor: '#e0f2fe' }) + arrow(328, 62, 350, 62, C.ink) +
      box(350, 40, 92, 44, 'HPF', '80 Hz 아래 ↓') + arrow(442, 62, 464, 62, C.ink) + box(464, 40, 130, 44, 'COMP · EQ …', '다음 단계') +
      box(6, 112, 82, 40, '+48V', '팬텀 전원', { fill: '#fff7ed', stroke: C.amber, color: '#b45309' }) + '<path d="M47 112 V84" stroke="' + C.amber + '" stroke-width="2.5" stroke-dasharray="5 4"/>' +
      t(96, 128, 'MG12XU: 스위치 하나 → CH1–7/8 MIC 모두', { size: 10.5, fill: '#b45309', anchor: 'start' }) + t(96, 144, '디지털 콘솔: 채널마다 따로 켜고 끄는 경우가 많아요', { size: 10.5, fill: C.sub, anchor: 'start' });
    // HPF 응답 (2차 버터워스, 80 Hz, 12 dB/oct)
    var x0 = 360, x1 = 590, y0 = 106, y1 = 198, fx = function (f) { return x0 + (Math.log10(f) - Math.log10(20)) / (Math.log10(2000) - Math.log10(20)) * (x1 - x0); }, fy = function (d) { return y0 + (-d) / 30 * (y1 - y0); };
    var d = ''; for (var f = 20; f <= 2000; f *= 1.05) { var r = Math.pow(f / 80, 2), g = 20 * Math.log10(r / Math.sqrt(1 + r * r)); d += (d ? 'L' : 'M') + fx(f).toFixed(1) + ' ' + fy(Math.max(-30, g)).toFixed(1); }
    s += [20, 80, 200, 1000].map(function (f) { return '<path d="M' + fx(f).toFixed(1) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.line + '"/>' + t(fx(f), y1 + 13, f >= 1000 ? '1k' : f, { size: 9.5, fill: C.sub }); }).join('') +
      [0, -12, -24].map(function (v) { return '<path d="M' + x0 + ' ' + fy(v).toFixed(1) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(x0 - 4, fy(v) + 4, v, { size: 9.5, fill: C.sub, anchor: 'end' }); }).join('') +
      '<path d="' + d + '" fill="none" stroke="' + C.teal + '" stroke-width="2.5"/>' + t(x1, y0 - 6, 'HPF 80 Hz 가 저음을 줄이는 모양 (계산)', { size: 10, fill: C.sub, anchor: 'end' }) + t(fx(150), fy(-14), '← 80 Hz 아래 저음이 줄어요', { size: 9.5, fill: C.teal, anchor: 'start' }) + t(fx(150), fy(-14) + 13, '(무대 울림·마이크 잡는 소리)', { size: 9.5, fill: C.teal, anchor: 'start' });
    s += t(6, 20, '입력 쪽 순서 (MG12XU 를 간단히 그림)', { size: 11, fill: C.sub, anchor: 'start' }) + t(6, 184, '※ 입력이 너무 크면: PAD 켜고 GAIN 다시 맞추기', { size: 10.5, fill: C.ink, anchor: 'start' }) + t(6, 200, '※ +48V 를 켜거나 마이크를 꽂고 뺄 때는 먼저 그 채널 ON 끄기', { size: 10.5, fill: C.red, anchor: 'start' });
    return svg(600, 216, s, '입력 단계: PAD, GAIN, HPF, 팬텀 전원');
  };

  // 3) 채널 안의 순서 — EQ·다이내믹, ON, 페이더와 보내는 지점
  V.consoleStrip = function () {
    var st = [['입력', ''], ['GAIN', 'PAD·HPF'], ['COMP', 'CH1–4'], ['EQ', '음색 3칸'], ['ON', '켜기/끄기'], ['페이더', '섞는 양'], ['PAN', '좌우'], ['버스', 'ST · 1-2']];
    var w = 64, gap = 9, y = 58, s = '';
    st.forEach(function (a, i) { var x = 6 + i * (w + gap), hot = a[0] === 'ON' || a[0] === '페이더';
      s += box(x, y, w, 46, a[0], a[1], { fill: hot ? C.ink : C.bg, stroke: hot ? C.ink : C.line, color: hot ? '#fff' : C.ink, subColor: hot ? '#cbd5e1' : C.sub, size: 12, subSize: 9.5 });
      if (i < st.length - 1) s += arrow(x + w, y + 23, x + w + gap, y + 23, C.ink, { w: 1.8 }); });
    function cx(i) { return 6 + i * (w + gap) + w / 2; }
    function tap(xp, yTop, label, sub, col, up) {
      var y2 = up ? 30 : 140; return '<circle cx="' + xp + '" cy="' + (up ? y : y + 46) + '" r="4" fill="' + col + '"/>' + '<path d="M' + xp + ' ' + (up ? y : y + 46) + 'V' + y2 + '" stroke="' + col + '" stroke-width="2" stroke-dasharray="4 3"/>' +
        t(xp, up ? 24 : 156, label, { size: 11, fill: col, weight: 800 }) + (sub ? t(xp, up ? 12 : 170, sub, { size: 9.5, fill: col }) : '');
    }
    var xPfl = (cx(3) + cx(4)) / 2, xPre = (cx(4) + cx(5)) / 2, xPost = (cx(5) + cx(6)) / 2;
    s += tap(xPfl, 0, 'PFL', '헤드폰·미터로', C.blue, false) + tap(xPre, 0, 'AUX1 PRE', '페이더 앞', C.orange, true) + tap(xPost, 0, 'AUX1 POST · FX', '페이더 뒤', C.purple, false);
    s += '<rect x="6" y="182" width="588" height="44" rx="8" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(16, 200, 'MG12XU: ON 을 끄면 ST·GROUP·AUX·FX 어디로도 나가지 않지만 PFL 로는 들을 수 있어요 (설명서)', { size: 10.5, anchor: 'start' }) +
      t(16, 217, 'MG12XU 채널을 보기 쉽게 줄여 그린 공부용 순서예요. 디지털 콘솔은 꺼내는 곳을 설정에서 고를 수 있어요.', { size: 10, fill: C.sub, anchor: 'start' });
    return svg(600, 232, s, '채널 신호 순서와 PFL, AUX PRE, POST 보내는 지점');
  };

  // 4) PFL — 메인을 건드리지 않고 듣기
  V.consolePfl = function () {
    var s = box(6, 70, 96, 46, '보컬 채널', 'PFL 누름', { fill: '#eef2ff', stroke: '#c7d2fe' }) +
      arrow(102, 84, 190, 40, C.blue, { w: 3 }) + box(190, 16, 150, 46, '헤드폰 · 레벨 미터', '엔지니어만 들어요', { fill: '#eff6ff', stroke: C.blue, color: C.blue }) +
      arrow(102, 100, 190, 132, C.teal, { w: 3 }) + box(190, 110, 150, 46, '메인 (STEREO)', '그대로 나가요', { fill: '#ecfeff', stroke: C.teal, color: C.teal }) + arrow(340, 133, 400, 133, C.teal, { w: 3 }) + box(400, 110, 116, 46, '메인 스피커', '회중이 듣는 소리') +
      t(196, 78, '↑ PFL: 페이더 앞 소리', { size: 10.5, fill: C.blue, anchor: 'start' }) + t(120, 152, '변화 없음', { size: 10.5, fill: C.teal, anchor: 'start' });
    // 미터
    var segs = [-30, -20, -10, -6, -3, 0, 3, 6, 10];
    s += '<rect x="372" y="10" width="60" height="96" rx="6" fill="#0b0d10"/>' + segs.map(function (v, i) { var yy = 96 - i * 9.6, on = v <= 0; return '<rect x="398" y="' + yy.toFixed(1) + '" width="22" height="7" rx="1" fill="' + (v >= 10 ? '#ef4444' : v >= 0 ? '#eab308' : '#22c55e') + '" fill-opacity="' + (on ? 1 : 0.2) + '"/>'; }).join('') +
      '<circle cx="386" cy="100" r="4" fill="#f59e0b"/>' + t(450, 34, '미터 아래 PFL', { size: 10, fill: C.sub, anchor: 'start' }) + t(450, 48, '표시등이 켜지고', { size: 10, fill: C.sub, anchor: 'start' }) + t(450, 62, '미터가 PFL 신호를', { size: 10, fill: C.sub, anchor: 'start' }) + t(450, 76, '보여 줘요', { size: 10, fill: C.sub, anchor: 'start' });
    s += t(300, 186, 'PFL 은 「듣기·보기 전용」 — 눌러도 메인으로 나가는 소리는 바뀌지 않아요', { size: 12, weight: 800 }) + t(300, 204, '확인이 끝나면 꼭 PFL 을 끄세요 (켜 두면 미터를 잘못 읽어요) · 다른 콘솔에서는 SOLO·CUE 라고도 불러요', { size: 10.5, fill: C.sub });
    return svg(600, 214, s, 'PFL 은 헤드폰과 미터로만 보내고 메인은 그대로');
  };

  // 5) AUX PRE/POST 와 FX Send/Return
  V.consoleAux = function () {
    var x0 = 46, x1 = 280, y0 = 30, y1 = 170, fx = function (d) { return x0 + (d + 30) / 40 * (x1 - x0); }, fy = function (d) { return y0 + (10 - d) / 40 * (y1 - y0); };
    var s = [-30, -20, -10, 0, 10].map(function (d) { return '<path d="M' + fx(d) + ' ' + y0 + 'V' + y1 + '" stroke="' + C.line + '"/>' + t(fx(d), y1 + 14, (d > 0 ? '+' : '') + d, { size: 9.5, fill: C.sub }) + '<path d="M' + x0 + ' ' + fy(d) + 'H' + x1 + '" stroke="' + C.line + '" stroke-dasharray="3 3"/>' + t(x0 - 5, fy(d) + 3, (d > 0 ? '+' : '') + d, { size: 9.5, fill: C.sub, anchor: 'end' }); }).join('');
    s += '<path d="M' + fx(-30) + ' ' + fy(0) + 'H' + fx(10) + '" stroke="' + C.orange + '" stroke-width="3.5"/>' + '<path d="M' + fx(-30) + ' ' + fy(-30) + 'L' + fx(10) + ' ' + fy(10) + '" stroke="' + C.purple + '" stroke-width="3.5"/>' +
      t(fx(-26), fy(0) - 8, 'PRE: 페이더와 상관없이 일정', { size: 10.5, fill: C.orange, weight: 800, anchor: 'start' }) + t(fx(-6), fy(-20) + 2, 'POST: 페이더를 따라감', { size: 10.5, fill: C.purple, weight: 800, anchor: 'start' }) +
      t((x0 + x1) / 2, y1 + 30, '채널 페이더 (dB) →', { size: 10, fill: C.sub }) + t(x0 - 34, y0 - 12, '모니터로 가는 양 (dB)', { size: 10, fill: C.sub, anchor: 'start' });
    // FX 루프
    var lx = 312;
    s += '<rect x="' + (lx - 6) + '" y="8" width="294" height="196" rx="10" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(lx + 141, 26, 'FX 보내기(Send)와 돌려받기(Return)', { size: 11.5, weight: 800 }) +
      box(lx, 40, 82, 38, '보컬 채널', 'AUX2/FX 노브', { subSize: 9.5 }) + arrow(lx + 82, 59, lx + 104, 59, C.purple) + box(lx + 104, 40, 80, 38, 'SEND', 'MASTER AUX2', { subSize: 9.5 }) + arrow(lx + 184, 59, lx + 204, 59, C.purple) +
      box(lx + 204, 36, 80, 46, 'SPX', '리버브·딜레이', { fill: '#f5f3ff', stroke: C.purple, color: C.purple, subSize: 9.5 }) +
      arrow(lx + 244, 82, lx + 244, 112, C.purple) + box(lx + 194, 112, 100, 38, 'FX RTN', '페이더 · ST', { fill: '#f5f3ff', stroke: C.purple, color: C.purple, subSize: 9.5 }) +
      arrow(lx + 194, 131, lx + 124, 131, C.teal) + box(lx + 24, 112, 100, 38, 'STEREO', '메인 믹스', { fill: '#ecfeff', stroke: C.teal, color: C.teal, subSize: 9.5 }) +
      '<path d="M' + (lx + 41) + ' 78 V112" stroke="' + C.teal + '" stroke-width="2.2"/>' + t(lx + 48, 98, '원래 소리(ST)', { size: 9.5, fill: C.teal, anchor: 'start' }) +
      t(lx + 141, 172, '원래 소리 + 이펙트 소리가 메인에서 섞여요', { size: 10.5, fill: C.ink }) + t(lx + 141, 190, 'MG12XU 안에 든 SPX: 프로그램 24가지 (제조사 자료)', { size: 9.5, fill: C.sub });
    return svg(600, 214, s, 'AUX PRE와 POST의 차이, FX 보내기와 돌려받기');
  };

  // 6) 버스·라우팅·씬
  V.consoleRouting = function () {
    var s = '<rect x="4" y="4" width="592" height="104" rx="10" fill="' + C.bg + '" stroke="' + C.line + '"/>' + t(14, 22, 'MG12XU — 버튼으로 소리 길 정하기 (라우팅)', { size: 11.5, weight: 800, anchor: 'start' }) +
      box(14, 40, 84, 42, '채널', 'ST · 1-2 버튼') + arrow(98, 52, 168, 40, C.teal) + arrow(98, 70, 168, 84, C.purple) +
      box(168, 28, 112, 28, 'STEREO 버스', '', { size: 11, fill: '#ecfeff', stroke: C.teal, color: C.teal }) + box(168, 70, 112, 28, 'GROUP 1-2 버스', '', { size: 11, fill: '#f5f3ff', stroke: C.purple, color: C.purple }) +
      arrow(280, 42, 350, 42, C.teal) + box(350, 28, 112, 28, 'STEREO OUT', '', { size: 11 }) + arrow(280, 84, 350, 84, C.purple) + box(350, 70, 112, 28, 'GROUP OUT 1·2', '', { size: 11 }) +
      '<path d="M224 70 V56" stroke="' + C.purple + '" stroke-width="2" stroke-dasharray="4 3"/>' + t(232, 66, 'GROUP 의 ST 버튼 → 메인에 합치기', { size: 9.5, fill: C.purple, anchor: 'start' }) +
      t(474, 46, 'PAN 을 왼쪽으로 돌리면', { size: 9.5, fill: C.sub, anchor: 'start' }) + t(474, 60, 'GROUP 1, 오른쪽은 2 로', { size: 9.5, fill: C.sub, anchor: 'start' }) + t(474, 74, '더 많이 가요 (패널 L1·R2)', { size: 9.5, fill: C.sub, anchor: 'start' });
    s += '<rect x="4" y="116" width="592" height="146" rx="10" fill="#f5f3ff" stroke="#ddd6fe"/>' + t(14, 134, '예: 찬양팀 악기를 GROUP 으로 모아 한 페이더로 조절하기', { size: 11.5, weight: 800, anchor: 'start' }) +
      box(14, 150, 120, 46, '악기 채널들', '건반·기타·베이스·드럼', { subSize: 9.5 }) + t(74, 212, 'ST 끔 · 1-2 켬', { size: 10, fill: C.purple, weight: 700 }) +
      arrow(134, 173, 170, 173, C.purple) + box(170, 150, 120, 46, 'GROUP 1-2', '페이더 하나로 한 번에', { fill: '#fff', stroke: C.purple, color: C.purple, subSize: 9.5 }) +
      arrow(290, 173, 326, 173, C.purple) + box(326, 150, 96, 46, 'ST 버튼', 'GROUP → 메인', { subSize: 9.5 }) +
      arrow(422, 173, 458, 173, C.teal) + box(458, 150, 128, 46, 'STEREO (메인)', '회중석 스피커', { fill: '#ecfeff', stroke: C.teal, color: C.teal, subSize: 9.5 }) +
      t(14, 240, '보컬은 ST 로 바로 메인에 보내고, 악기만 GROUP 페이더로 함께 줄였다 키웠다 해요.', { size: 10.5, fill: C.ink, anchor: 'start' }) +
      t(14, 256, '디지털 콘솔은 화면의 「패치」로 소리 길을 정해요 → 03-2 디지털 콘솔 과정', { size: 10, fill: C.sub, anchor: 'start' });
    return svg(600, 268, s, 'MG12XU 버스 할당과 GROUP 사용 예');
  };

  /* =========================================================================== 「그림으로 보기」 (2026-11-04)
     - 비유 · 단계 · 전/후 비교 그림. 폭이 좁은 칸(용어 · 나란히 두 그림)에도 들어가게 viewBox 400 안팎, 글자 13 이상
     - class 는 mod-pic-svg (최소 폭 = viewBox 의 85% — 휴대폰에서도 글자 13 이 11px 이상으로 보이게, 넘치면 상자 안에서 옆으로 밀어 봐요) */
  function psvg(w, h, body, label) { return '<div style="contain:inline-size;overflow-x:auto"><svg class="mod-pic-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif" style="display:block;width:100%;max-width:' + w + 'px;min-width:' + Math.round(w * 0.85) + 'px;height:auto;margin:0 auto">' + body + '</svg></div>'; }
  // ○/× 처럼 두 칸으로 나뉜 그림: 칸마다 따로 그려 좁은 화면에서는 위아래로 쌓아요(글자 크기 그대로)
  function psvgPair(w, h, a, b, label) { function one(body, lab) { return '<svg class="mod-pic-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + lab + '" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, system-ui, sans-serif" style="display:block;flex:1 1 ' + Math.round(w * 0.85) + 'px;max-width:' + w + 'px;min-width:' + Math.round(w * 0.85) + 'px;height:auto">' + body + '</svg>'; }
    return '<div role="group" aria-label="' + label + '" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">' + one(a, label + ' (1)') + one(b, label + ' (2)') + '</div>'; }
  function wave(x, y, w, a, cyc, lim) { var d = ''; for (var i = 0; i <= 80; i++) { var v = a * Math.sin(i / 80 * Math.PI * 2 * cyc); if (lim) v = Math.max(-lim, Math.min(lim, v)); d += (i ? 'L' : 'M') + (x + i / 80 * w).toFixed(1) + ' ' + (y - v).toFixed(1); } return d; }
  function mark(x, y, good) { return good ? '<circle cx="' + x + '" cy="' + y + '" r="11" fill="#fff" stroke="' + C.green + '" stroke-width="3.5"/>' : '<path d="M' + (x - 8) + ' ' + (y - 8) + 'L' + (x + 8) + ' ' + (y + 8) + 'M' + (x + 8) + ' ' + (y - 8) + 'L' + (x - 8) + ' ' + (y + 8) + '" stroke="' + C.red + '" stroke-width="4" stroke-linecap="round"/>'; }
  function rr(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 8 : r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="2"' : '') + '/>'; }
  function spk(x, y, col, on) { return rr(x - 14, y - 18, 28, 36, '#fff', col || C.ink, 5) + '<circle cx="' + x + '" cy="' + (y + 3) + '" r="8" fill="none" stroke="' + (col || C.ink) + '" stroke-width="2"/>' + (on ? '<path d="M' + (x + 19) + ' ' + (y - 8) + 'q6 8 0 16M' + (x + 25) + ' ' + (y - 13) + 'q9 13 0 26" fill="none" stroke="' + (col || C.ink) + '" stroke-width="2"/>' : ''); }
  function num(x, y, n, col) { return '<circle cx="' + x + '" cy="' + y + '" r="11" fill="' + col + '"/>' + t(x, y + 5, n, { size: 13, weight: 800, fill: '#fff' }); }
  function meter(x, y, lit) { var s = rr(x, y, 26, 92, '#0f172a', null, 5); for (var i = 0; i < 8; i++) { var col = i >= 7 ? '#ef4444' : i >= 5 ? '#eab308' : '#22c55e'; s += '<rect x="' + (x + 5) + '" y="' + (y + 80 - i * 10.5) + '" width="16" height="7" rx="1.5" fill="' + col + '" fill-opacity="' + (i < lit ? 1 : 0.18) + '"/>'; } return s; }

  // 용어 PAD — 너무 큰 소리를 미리 줄여 알맞게
  V.consolePadMini = function () {
    var s = '<path d="M6 22H90M6 94H90" stroke="' + C.red + '" stroke-dasharray="5 4" stroke-width="1.5"/>' + '<path d="' + wave(8, 58, 80, 50, 2, 40) + '" fill="none" stroke="' + C.red + '" stroke-width="3"/>' +
      t(48, 114, '너무 큰 소리', { size: 13, fill: C.red, weight: 800 }) + arrow(96, 58, 116, 58, C.ink) +
      rr(118, 38, 64, 40, C.ink, null, 8) + t(150, 56, 'PAD', { size: 14, fill: '#fff', weight: 800 }) + t(150, 72, '−26 dB', { size: 13, fill: '#e2e8f0' }) + arrow(184, 58, 204, 58, C.ink) +
      '<path d="M206 22H294M206 94H294" stroke="' + C.red + '" stroke-dasharray="5 4" stroke-width="1.5"/>' + '<path d="' + wave(208, 58, 84, 22, 2) + '" fill="none" stroke="' + C.green + '" stroke-width="3"/>' + t(250, 114, '알맞은 크기', { size: 13, fill: C.green, weight: 800 });
    return psvg(300, 122, s, 'PAD 는 너무 큰 입력을 미리 줄여요');
  };


  // 용어 버스 — 개울이 모여 강이 돼요
  V.consoleBusMini = function () {
    var s = '', src = [['CH1 보컬', 24], ['CH2 기타', 60], ['CH3 건반', 96]];
    src.forEach(function (r) { s += t(6, r[1] + 5, r[0], { size: 13, anchor: 'start', weight: 700 }) + '<path d="M68 ' + r[1] + ' C110 ' + r[1] + ' 124 60 160 60" fill="none" stroke="' + C.cyan + '" stroke-width="5" stroke-linecap="round"/>'; });
    s += '<path d="M160 60 H244" stroke="' + C.teal + '" stroke-width="16" stroke-linecap="round"/>' + arrow(244, 60, 290, 60, C.teal, { w: 3 }) + t(212, 36, '버스 (모이는 길)', { size: 13, fill: C.teal, weight: 800 }) + t(222, 96, '개울이 모여 강이 돼요', { size: 13, fill: C.sub });
    return psvg(300, 112, s, '여러 채널 소리가 버스 하나로 모여요');
  };


  // 이론 2 — PAD 쓰는 순서 ① ② ③
  V.consolePadSteps = function () {
    var s = '', st = [['1', 'GAIN 다 내려도', '빨간 불', 8, C.red], ['2', 'PAD 켜기', '(−26 dB)', 3, C.ink], ['3', 'GAIN 다시', '맞추기', 6, C.green]];
    st.forEach(function (r, i) { var x = 6 + i * 132;
      s += rr(x, 6, 120, 188, i === 2 ? '#f0fdf4' : C.bg, i === 0 ? '#fecaca' : C.line, 10) + num(x + 20, 26, r[0], r[4]) + meter(x + 47, 42, r[3]) +
        t(x + 60, 160, r[1], { size: 13, weight: 800 }) + t(x + 60, 178, r[2], { size: 13, fill: r[4], weight: 700 });
      if (i < 2) s += arrow(x + 120, 88, x + 132, 88, C.ink, { w: 2 }); });
    return psvg(400, 200, s, 'PAD 를 켜고 GAIN 을 다시 맞추는 순서');
  };

  // 이론 2 — 팬텀 전원 · 마이크 꽂을 때 ○ / ×
  V.consolePhantomSafe = function () {
    function side(x, good) {
      var col = good ? C.green : C.red, h = rr(x, 6, 190, 188, good ? '#f0fdf4' : '#fef2f2', good ? '#bbf7d0' : '#fecaca', 10) + mark(x + 22, 28, good) +
        t(x + 40, 33, good ? 'ON 끄고 꽂기' : 'ON 켠 채 꽂기', { size: 14, weight: 800, anchor: 'start', fill: col });
      h += rr(x + 16, 58, 44, 26, good ? '#4b5563' : C.amber, null, 5) + t(x + 38, 76, 'ON', { size: 13, weight: 800, fill: good ? '#e5e7eb' : C.ink }) + t(x + 38, 102, good ? '꺼짐' : '켜짐', { size: 13, fill: C.sub });
      h += '<path d="M' + (x + 66) + ' 71 H' + (x + 118) + '" stroke="' + C.ink + '" stroke-width="3"/>' + rr(x + 94, 62, 22, 18, C.ink, null, 4) + t(x + 106, 102, '마이크', { size: 13, fill: C.sub });
      h += spk(x + 154, 72, col, !good) + (good ? '' : t(x + 156, 40, '퍽!', { size: 16, weight: 800, fill: C.red }));
      h += t(x + 95, 140, good ? '스피커가 조용해요' : '큰 소리가 스피커로', { size: 13, weight: 700, fill: col }) + t(x + 95, 160, good ? '꽂은 뒤 ON 을 켜요' : '나가 고장 날 수 있어요', { size: 13, fill: C.sub });
      return h;
    }
    return psvgPair(198, 200, side(4, true), side(4, false), '팬텀 전원을 쓸 때 마이크를 꽂는 바른 방법과 틀린 방법');
  };

  // 이론 3 — 페이더 눈금: 0 dB(U) 근처가 넓어요
  V.consoleUnity = function () {
    var y0 = 186, y1 = 18, fy = function (db) { return y0 - inv(FPTS, db) / 1000 * (y0 - y1); }, s = '';
    s += rr(40, 10, 24, 184, '#e2e8f0', null, 6) + '<path d="M52 18 V186" stroke="' + C.ink + '" stroke-width="3"/>';
    [10, 5, 0, -5, -10, -20, -30, -40, -60].forEach(function (d) { var y = fy(d).toFixed(1), lab = d !== -40 && d !== -60; s += '<path d="M66 ' + y + 'H78" stroke="' + C.ink + '" stroke-width="1.5"/>' + (lab ? t(82, +y + 5, (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d) + (d === 0 ? ' (U)' : ''), { size: 13, anchor: 'start', weight: d === 0 ? 800 : 400, fill: d === 0 ? C.teal : C.ink }) : ''); });
    s += t(82, 191, '−∞', { size: 13, anchor: 'start' }) + rr(36, fy(0) - 7, 32, 14, C.teal, null, 3);
    s += rr(150, fy(5) - 4, 244, fy(-10) - fy(5) + 8, '#ecfeff', C.teal, 8) + t(160, fy(5) + 20, '여기서 조절하기 좋아요', { size: 13, weight: 800, fill: C.teal, anchor: 'start' }) + t(160, fy(5) + 38, '눈금 사이가 넓어 섬세해요', { size: 13, fill: C.sub, anchor: 'start' });
    s += rr(150, fy(-30) - 4, 244, fy(-60) - fy(-30) + 26, '#fff7ed', C.amber, 8) + t(160, fy(-30) + 16, '아래쪽은 눈금이 좁아요', { size: 13, weight: 800, fill: '#b45309', anchor: 'start' }) + t(160, fy(-30) + 34, '조금만 밀어도 크게 변해요', { size: 13, fill: C.sub, anchor: 'start' });
    s += '<path d="M134 ' + fy(5) + 'H142V' + fy(-10) + 'H134" fill="none" stroke="' + C.teal + '" stroke-width="2.5"/><path d="M142 ' + ((fy(5) + fy(-10)) / 2) + 'H150" stroke="' + C.teal + '" stroke-width="2.5"/>' +
      '<path d="M134 ' + fy(-30) + 'H142V' + y0 + 'H134" fill="none" stroke="' + C.amber + '" stroke-width="2.5"/><path d="M142 ' + fy(-40) + 'H150" stroke="' + C.amber + '" stroke-width="2.5"/>';
    s += t(160, fy(0) + 72, '0 (U) = 키우지도 줄이지도 않는 자리', { size: 13, fill: C.ink, anchor: 'start', weight: 700 });
    return psvg(400, 200, s, '페이더 눈금은 0 dB 근처가 넓어요');
  };

  // 이론 5 — PRE / POST 를 수도꼭지로
  V.consoleFaucet = function () {
    var s = rr(4, 66, 70, 44, '#ecfeff', C.teal, 8) + t(39, 86, '채널', { size: 13, weight: 800, fill: C.teal }) + t(39, 102, '소리', { size: 13, fill: C.teal });
    s += '<path d="M74 88 H170" stroke="' + C.cyan + '" stroke-width="12"/>' + '<path d="M214 88 H300" stroke="' + C.cyan + '" stroke-width="5"/>';
    s += rr(170, 70, 44, 36, C.ink, null, 6) + '<path d="M182 70 V54 H202 V70" fill="none" stroke="' + C.ink + '" stroke-width="4"/>' + '<path d="M180 54 H204" stroke="' + C.ink + '" stroke-width="6" stroke-linecap="round"/>' + t(192, 44, '수도꼭지 = 페이더', { size: 13, weight: 800 });
    s += arrow(300, 88, 336, 88, C.teal) + t(368, 84, '메인', { size: 13, weight: 800, fill: C.teal }) + t(368, 100, '스피커', { size: 13, fill: C.teal });
    // PRE 가지 (꼭지 앞) · POST 가지 (꼭지 뒤)
    s += '<circle cx="120" cy="88" r="6" fill="' + C.orange + '"/><path d="M120 94 V146" stroke="' + C.orange + '" stroke-width="8"/>' + arrow(120, 146, 120, 166, C.orange, { w: 3 }) + t(120, 186, 'PRE → 무대 모니터', { size: 13, weight: 800, fill: C.orange }) + t(120, 204, '꼭지를 잠가도 그대로', { size: 13, fill: C.sub });
    s += '<circle cx="262" cy="88" r="5" fill="' + C.purple + '"/><path d="M262 93 V146" stroke="' + C.purple + '" stroke-width="4"/>' + arrow(262, 146, 262, 166, C.purple, { w: 3 }) + t(290, 186, 'POST → 리버브', { size: 13, weight: 800, fill: C.purple }) + t(290, 204, '꼭지를 따라 함께 줄어요', { size: 13, fill: C.sub });
    s += t(8, 22, '페이더를 반쯤 잠근 모습 (굵기 = 물의 양)', { size: 13, fill: C.sub, anchor: 'start' });
    return psvg(400, 212, s, '수도꼭지 비유: PRE 는 꼭지 앞, POST 는 꼭지 뒤에서 나눠 받아요');
  };

  // 이론 5 — 인서트(끼워 넣기)와 AUX(보내기)
  V.consoleInsertAux = function () {
    var s = rr(4, 4, 392, 96, C.bg, C.line, 10) + t(14, 26, '인서트 — 소리 전부가 장비를 지나가요', { size: 13, weight: 800, anchor: 'start' });
    s += box(14, 40, 70, 40, '채널', '', { size: 13 }) + arrow(84, 60, 116, 60, C.ink) + box(116, 40, 92, 40, 'COMP', '', { size: 13, fill: '#f5f3ff', stroke: C.purple, color: C.purple }) + arrow(208, 60, 240, 60, C.ink) + box(240, 40, 70, 40, '채널', '', { size: 13 }) + t(318, 58, 'COMP · EQ', { size: 13, anchor: 'start', fill: C.sub }) + t(318, 76, 'GATE 등', { size: 13, anchor: 'start', fill: C.sub });
    s += rr(4, 108, 392, 120, C.bg, C.line, 10) + t(14, 130, 'AUX 보내기 — 복사본만 보내고 섞어요', { size: 13, weight: 800, anchor: 'start' });
    s += box(14, 146, 70, 40, '채널', '', { size: 13 }) + arrow(84, 160, 280, 160, C.teal) + t(150, 154, '원래 소리', { size: 13, fill: C.teal }) + box(280, 144, 104, 34, '메인 (섞기)', '', { size: 13, fill: '#ecfeff', stroke: C.teal, color: C.teal });
    s += '<path d="M60 186 V210 H136" fill="none" stroke="' + C.purple + '" stroke-width="2.2" stroke-dasharray="5 4"/>' + box(136, 194, 92, 30, '리버브', '', { size: 13, fill: '#f5f3ff', stroke: C.purple, color: C.purple }) + '<path d="M228 210 H330 V184" fill="none" stroke="' + C.purple + '" stroke-width="2.2"/>' + arrow(330, 190, 330, 180, C.purple) + t(244, 204, '울림', { size: 13, fill: C.purple, anchor: 'start' });
    return psvg(400, 232, s, '인서트와 AUX 보내기의 차이');
  };

  // 이론 6 — PAN: 끝까지 돌리면 반대쪽 자리에서 잘 안 들려요
  V.consolePan = function () {
    function side(x, good) {
      var col = good ? C.green : C.red, h = rr(x, 4, 192, 200, good ? '#f0fdf4' : '#fef2f2', good ? '#bbf7d0' : '#fecaca', 10) + mark(x + 22, 26, good) + t(x + 40, 31, good ? 'PAN 가운데 쪽' : 'PAN 끝까지 왼쪽', { size: 14, weight: 800, anchor: 'start', fill: col });
      h += rr(x + 40, 44, 112, 20, '#e2e8f0', null, 4) + t(x + 96, 59, '강대상(무대)', { size: 13, fill: C.ink });
      h += spk(x + 26, 84, C.ink, true) + spk(x + 160, 84, good ? C.ink : '#94a3b8', good);
      for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) { var cx = x + 36 + c * 24, cy = 122 + r * 18, rightSide = c >= 3, heard = good || !rightSide; h += '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="' + (heard ? C.teal : '#e2e8f0') + '"/>'; }
      h += t(x + 96, 194, good ? '모든 자리에서 잘 들려요' : '오른쪽 자리는 잘 안 들려요', { size: 13, weight: 700, fill: col });
      return h;
    }
    return psvgPair(200, 208, side(4, true), side(4, false), '예배당에서 PAN 을 끝까지 돌리면 반대쪽 자리에서 잘 안 들려요');
  };

  // 이론 6 — GROUP 을 내려도 무대 모니터(PRE)는 그대로
  V.consoleGroupWarn = function () {
    var s = box(4, 70, 84, 44, '악기 채널', '', { size: 13 }) + arrow(88, 84, 130, 54, C.purple) + box(130, 30, 96, 44, 'GROUP', '−∞ 로 내림', { size: 13, subSize: 13, fill: '#f5f3ff', stroke: C.purple, color: C.purple, subColor: C.red }) +
      '<path d="M226 52 H290" stroke="#cbd5e1" stroke-width="2.5" stroke-dasharray="5 4"/>' + spk(316, 52, '#94a3b8', false) + t(348, 40, '메인', { size: 13, anchor: 'start', weight: 800 }) + t(348, 58, '조용', { size: 13, anchor: 'start', fill: C.sub });
    s += arrow(88, 100, 130, 132, C.orange) + box(130, 112, 96, 44, 'AUX (PRE)', '', { size: 13, fill: '#fff7ed', stroke: C.orange, color: C.orange }) + arrow(226, 134, 290, 134, C.orange) + spk(316, 134, C.orange, true) + t(348, 124, '무대', { size: 13, anchor: 'start', weight: 800 }) + t(348, 142, '모니터', { size: 13, anchor: 'start', weight: 800 });
    s += t(200, 186, 'GROUP 을 내려도 무대 모니터는 계속 나와요', { size: 13, weight: 800 }) + t(200, 204, '무대 소리를 끄려면 채널 ON 까지 확인해요', { size: 13, fill: C.sub });
    return psvg(400, 212, s, 'GROUP 페이더를 내려도 AUX PRE 로 가는 무대 모니터는 그대로예요');
  };

  // 확인 문제 1 — 메인에서 소리가 안 날 때 따라갈 순서
  V.consoleTrouble = function () {
    var s = '', row1 = [['입력·GAIN', 'PFL 소리 있음'], ['1. ON', ''], ['2. ST 버튼', '']], row2 = [['3. 채널 페이더', ''], ['4. STEREO 페이더', ''], ['5. 출력 연결', '']];
    row1.forEach(function (r, i) { var x = 4 + i * 136; s += box(x, 10, 120, 48, r[0], r[1], i === 0 ? { size: 13, subSize: 13, fill: '#eff6ff', stroke: C.blue, color: C.blue, subColor: C.blue } : { size: 13 }); if (i < 2) s += arrow(x + 120, 34, x + 136, 34, C.ink, { w: 2 }); });
    s += '<path d="M336 58 V76 H64 V88" fill="none" stroke="' + C.ink + '" stroke-width="2"/>' + arrow(64, 84, 64, 94, C.ink, { w: 2 });
    row2.forEach(function (r, i) { var x = 4 + i * 136; s += box(x, 94, 120, 44, r[0], '', { size: 13 }); if (i < 2) s += arrow(x + 120, 116, x + 136, 116, C.ink, { w: 2 }); });
    s += t(200, 160, '소리가 지나가는 순서대로 하나씩 따라가요', { size: 13, fill: C.sub });
    return psvg(412, 168, s, '메인에서 소리가 안 날 때 확인 순서');
  };

  /* =========================================================================== 공통: 보컬 녹음 (cable.js 와 같은 캐시를 씀) */
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
  var NINF = -Infinity;
  function interp(pts, x) { if (x <= pts[0][0]) return NINF; for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i]; if (x <= b[0]) { if (a[1] === NINF) return b[1] - (b[0] - x) / (b[0] - a[0]) * 30; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } } return pts[pts.length - 1][1]; }
  function inv(pts, d) { if (d === NINF || d == null) return 0; for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i]; if (d <= b[1]) { if (a[1] === NINF) return Math.max(a[0] + 1e-6, b[0] - (b[1] - d) / 30 * (b[0] - a[0])); return a[0] + (b[0] - a[0]) * (d - a[1]) / (b[1] - a[1]); } } return pts[pts.length - 1][0]; }
  var FPTS = [[0, NINF], [60, -60], [250, -30], [500, -10], [750, 0], [1000, 10]];    // 페이더 0–1000 (MG 페이더 눈금을 단순화)
  var KPTS = [[0, NINF], [0.5, -50], [3, -20], [7, 0], [10, 10]];                     // 노브 0–10 (▶ 표시 ≈ 0 dB, 교육용 근사)
  function fdb(p) { return p <= 0 ? NINF : interp(FPTS, p); }
  function kdb(p) { return p <= 0 ? NINF : interp(KPTS, p); }
  function psum(a, b) { return 10 * Math.log10(Math.pow(10, a / 10) + Math.pow(10, b / 10)); }
  function g(dbv) { return dbv === NINF ? 0 : Math.pow(10, dbv / 20); }
  function fmt(d) { return d === NINF || d < -90 ? '−∞' : (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d).toFixed(Math.abs(d) < 10 ? 1 : 0); }
  function fin(d) { return d === NINF || !isFinite(d) ? null : Math.round(d * 10) / 10; }

  function injectCss() {
    if (document.getElementById('sta-mod-console-css')) return;
    var st = document.createElement('style'); st.id = 'sta-mod-console-css';
    st.textContent = [
      '.sim-con{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:12px;align-items:start;min-width:0}',
      '.sim-con-desk{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;padding:12px 8px;border-radius:12px;background:linear-gradient(180deg,#2a2f36,#1a1e24);border:1px solid #0f1215;min-width:0}',
      '.sim-con-col{display:flex;flex-direction:column;align-items:center;gap:6px;width:96px;padding:6px 4px;border-radius:8px;background:rgba(255,255,255,.04);color:#e5e7eb}',
      '.sim-con-col.ch{background:rgba(34,211,238,.08);outline:1px solid rgba(34,211,238,.25)}',
      '.sim-con-name{font-size:.74rem;font-weight:800;letter-spacing:.02em;color:#f8fafc;text-align:center}',
      '.sim-con-small{font-size:.64rem;color:#94a3b8;text-align:center;line-height:1.3}',
      '.sim-con-knob{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:.66rem;color:#cbd5e1;width:100%}',
      '.sim-con-knob input{width:84px;accent-color:#22d3ee}',
      '.sim-con-knob b,.sim-con-col>b{font-size:.7rem;color:#fde68a;font-variant-numeric:tabular-nums}',
      '.sim-con-btn{width:64px;padding:5px 0;border-radius:6px;border:1px solid #111;background:#4b5563;color:#e5e7eb;font:inherit;font-size:.72rem;font-weight:800;cursor:pointer;box-shadow:inset 0 -2px 0 rgba(0,0,0,.35)}',
      '.sim-con-btn[aria-pressed="true"]{color:#111827}',
      '.sim-con-btn[data-t="on"][aria-pressed="true"]{background:#fbbf24;box-shadow:0 0 10px rgba(251,191,36,.6)}',
      '.sim-con-btn[data-t="st"][aria-pressed="true"],.sim-con-btn[data-t="fxst"][aria-pressed="true"]{background:#ef4444;color:#fff}',
      '.sim-con-btn[data-t="pre"][aria-pressed="true"]{background:#e5e7eb}',
      '.sim-con-btn[data-t="pfl"][aria-pressed="true"]{background:#fb923c}',
      '.sim-con .sim-vfader{height:160px}',
      '.sim-con-meters{display:flex;gap:2px;align-items:flex-start;padding:6px;border-radius:8px;background:rgba(0,0,0,.25)}',
      '.sim-con-mcol{display:flex;flex-direction:column;align-items:center;gap:4px}',
      '.sim-con-mcol>span{font-size:.62rem;font-weight:800;color:#cbd5e1;white-space:nowrap}',
      '.sim-con-meters .sim-meter{margin-left:0}.sim-con-meters .sim-con-mcol:first-child .sim-meter{margin-left:26px}',
      '.sim-con-meters .sim-con-mcol:not(:first-child) .sim-meter em{display:none}',
      '.sim-con-listen{display:grid;gap:4px;margin-top:8px}',
      '.sim-con-listen label{display:flex;gap:6px;align-items:center;font-size:.8rem;padding:4px 8px;border:1px solid var(--sta-line,#d6dee8);border-radius:8px;cursor:pointer}',
      '.sim-con-listen label:has(input:checked){border-color:#0e7490;background:#e6f6f9}',
      '.sim-con-patch{display:grid;gap:6px}.sim-con-patch label{display:grid;gap:2px;font-size:.78rem;font-weight:700}',
      '.sim-con-patch select{font:inherit;font-size:.82rem;padding:5px 6px;border-radius:6px;border:1px solid var(--sta-line,#d6dee8)}',
      '.sim-con-flowwrap{grid-column:1/-1;border:1px solid var(--sta-line,#d6dee8);border-radius:12px;background:#fff;padding:8px;overflow-x:auto}',
      '.sim-con-flowwrap svg{display:block;width:100%;min-width:540px;height:auto}',
      '.sim-con-flowwrap p{margin:4px 0 0;font-size:.72rem;color:#7a8aa0}',
      '@media (max-width:860px){.sim-con{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:520px){.sim-con-col{width:88px}.sim-con-knob input{width:76px}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* =========================================================================== 실습: 채널 스트립 + 라우팅 보드 */
  var PATCH = [['none', '연결 안 함'], ['st', 'STEREO OUT (메인)'], ['aux1', 'AUX1 SEND'], ['aux2', 'AUX2 SEND (FX)']];
  function consoleRouting(el, opts) {
    opts = opts || {}; injectCss();
    var S = { on: true, st: false, pre: false, pfl: false, fxst: true, fader: inv(FPTS, 0), aux1: 0, fx: 0, a1m: 7, a2m: 7, stm: inv(FPTS, 0), fxrtn: 0,
      pMain: 'none', pMon: 'none', listen: 'main', ref: null, sawPre: false, sawPost: false, pflMain: false, done: {}, audio: false, t0: performance.now(), rev: 0 };
    var alive = true, raf = 0, vox = null, actx = null, N = null, frame = 0;
    var SEG = [-30, -20, -10, -6, -3, 0, 3, 6, 10];
    function meter(role, name) { return '<div class="sim-con-mcol"><span>' + name + '</span><div class="sim-meter" data-role="' + role + '">' + SEG.slice().reverse().map(function (v) { return '<span data-v="' + v + '" class="' + (v >= 10 ? 'r' : v >= 0 ? 'y' : 'g') + '"><em>' + (v > 0 ? '+' : '') + v + '</em></span>'; }).join('') + '</div></div>'; }
    function knob(k, name) { return '<label class="sim-con-knob"><span>' + name + '</span><input type="range" min="0" max="10" step="0.1" data-k="' + k + '" aria-label="' + name + '"><b data-o="' + k + '"></b></label>'; }
    function btn(k, name, label) { return '<button type="button" class="sim-con-btn" data-t="' + k + '" aria-pressed="false" aria-label="' + label + '">' + name + '</button>'; }
    function fader(k, name) { return '<input type="range" class="sim-vfader" min="0" max="1000" step="1" data-f="' + k + '" aria-label="' + name + '" orient="vertical"><b data-o="' + k + '"></b>'; }
    el.innerHTML = '<div class="sim-con">' +
      '<div class="sim-con-desk" aria-label="가상 콘솔 (MG12XU 를 단순화)">' +
        '<div class="sim-con-col ch"><div class="sim-con-name">CH1 · 보컬</div><div class="sim-con-small">GAIN 은 미리<br>알맞게 맞춰 둠</div>' + knob('aux1', 'AUX1 (모니터)') + btn('pre', 'PRE', 'AUX1 PRE 스위치') + knob('fx', 'AUX2/FX') +
          btn('on', 'ON', '채널 ON') + btn('st', 'ST', 'ST 버스 할당') + btn('pfl', 'PFL', 'PFL') + fader('fader', '채널 페이더') + '<div class="sim-con-small">채널 페이더</div></div>' +
        '<div class="sim-con-col"><div class="sim-con-name">FX RTN</div><div class="sim-con-small">SPX<br>REV HALL 1</div>' + btn('fxst', 'ST', 'FX RTN ST 버스 할당') + fader('fxrtn', 'FX RTN 페이더') + '<div class="sim-con-small">리버브 돌려받는 양</div></div>' +
        '<div class="sim-con-col"><div class="sim-con-name">SEND MASTER</div>' + knob('a1m', 'AUX1') + knob('a2m', 'AUX2') + '<div class="sim-con-name" style="margin-top:4px">STEREO</div>' + fader('stm', 'STEREO 페이더') + '</div>' +
        '<div class="sim-con-meters">' + meter('mMain', '메인') + meter('mA1', 'AUX1') + meter('mA2', 'AUX2') + meter('mPfl', 'PFL') + '</div>' +
      '</div>' +
      '<div class="sim-side">' +
        '<div class="sim-box"><h4>소리 듣기</h4><button type="button" class="sim-btn sim-play" data-sim="play">🔊 소리 켜기</button>' +
          '<div class="sim-con-listen" role="radiogroup" aria-label="어디를 들을까요">' + [['main', '🔊 메인 스피커 (회중석)'], ['mon', '🔈 무대 모니터 (찬양 인도자)'], ['phones', '🎧 헤드폰 (엔지니어)']].map(function (o) { return '<label><input type="radio" name="simConListen" value="' + o[0] + '"' + (o[0] === 'main' ? ' checked' : '') + '>' + o[1] + '</label>'; }).join('') + '</div>' +
          '<p class="sim-note" data-role="src">녹음을 불러오는 중…</p></div>' +
        '<div class="sim-box"><h4>스피커 연결 (패치)</h4><div class="sim-con-patch">' +
          '<label>메인 스피커 (ZXA1 L·R)<select data-p="pMain">' + PATCH.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('') + '</select></label>' +
          '<label>무대 모니터 (웨지)<select data-p="pMon">' + PATCH.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('') + '</select></label></div></div>' +
        '<div class="sim-box sim-read" data-role="read"></div>' +
      '</div>' +
      '<div class="sim-con-flowwrap"><div data-role="flow"></div><p>밝은 색 선 = 지금 보컬 소리가 지나가는 길, 회색 점선 = 막힌 길이에요. (MG12XU 를 간단히 그린 공부용 그림)</p></div>' +
    '</div>';
    var q = function (s) { return el.querySelector(s); }, read = q('[data-role=read]'), flow = q('[data-role=flow]');

    /* ---------- 레벨 모델 (보컬의 가장 큰 순간 기준 dB, 교육용 근사) */
    function L() {
      var F = fdb(S.fader), pre = S.on ? 0 : NINF, post = pre + F, stDry = S.st ? post : NINF;
      var fxSend = post + kdb(S.fx) + kdb(S.a2m), fxRet = S.fxst ? fxSend - 6 + fdb(S.fxrtn) : NINF;
      var stm = fdb(S.stm), main = psum(stDry, fxRet) + stm, mainDry = stDry + stm, mainWet = fxRet + stm;
      var aux1 = (S.pre ? pre : post) + kdb(S.aux1) + kdb(S.a1m), pfl = S.pfl ? 0 : NINF;
      var bus = { none: NINF, st: main, aux1: aux1, aux2: fxSend };
      return { F: F, pre: pre, post: post, stDry: stDry, fxSend: fxSend, fxRet: fxRet, main: main, mainDry: mainDry, mainWet: mainWet, aux1: aux1, aux2: fxSend, pfl: pfl, phones: S.pfl ? pfl : main, spkMain: bus[S.pMain], spkMon: bus[S.pMon] };
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function judge(l) {
      var mainOk = S.pMain === 'st' && l.mainDry >= -20;
      if (mainOk) hit('main');
      var monOk = S.pMon === 'aux1' && l.aux1 >= -20;
      if (monOk) hit('monitor');
      // PRE/POST: 같은 모니터 설정에서 페이더를 10 dB 이상 움직였을 때 모니터 크기 변화를 봄
      var key = [S.pre, S.aux1, S.a1m, S.on, S.pMon].join('|'), F = l.F === NINF ? -100 : l.F, M = l.aux1 === NINF ? -100 : l.aux1;
      if (!S.ref || S.ref.key !== key) S.ref = { key: key, F: F, M: M };
      else if (S.pMon === 'aux1' && S.on && Math.abs(F - S.ref.F) >= 10) {
        if (S.pre && S.ref.M >= -40 && Math.abs(M - S.ref.M) < 0.5) S.sawPre = true;
        if (!S.pre && S.ref.M >= -40 && Math.abs(M - S.ref.M) >= 6) S.sawPost = true;
      }
      if (S.sawPre && S.sawPost) hit('prepost');
      if (S.pfl && S.listen === 'phones' && mainOk) { S.pflMain = true; hit('pfl'); }
      if (S.pMain === 'st' && S.fx > 0 && S.fxst && l.mainWet >= -30 && isFinite(l.mainWet)) hit('fx');
    }

    /* ---------- 화면 */
    function setBtn(k, on) { var b = q('[data-t=' + k + ']'); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    function update() {
      ['aux1', 'fx', 'a1m', 'a2m'].forEach(function (k) { q('[data-k=' + k + ']').value = S[k]; q('[data-o=' + k + ']').textContent = fmt(kdb(S[k])) + ' dB'; });
      ['fader', 'fxrtn', 'stm'].forEach(function (k) { q('[data-f=' + k + ']').value = Math.round(S[k]); q('[data-o=' + k + ']').textContent = fmt(fdb(S[k])) + ' dB'; });
      setBtn('on', S.on); setBtn('st', S.st); setBtn('pre', S.pre); setBtn('pfl', S.pfl); setBtn('fxst', S.fxst);
      q('[data-p=pMain]').value = S.pMain; q('[data-p=pMon]').value = S.pMon;
      var r = el.querySelector('input[name=simConListen][value=' + S.listen + ']'); if (r) r.checked = true;
      var l = L(); judge(l); renderRead(l); flow.innerHTML = flowSvg(l); applyAudio(l);
    }
    function why(target) {
      if (target === 'main') {
        if (S.pMain === 'none') return '메인 스피커가 연결되지 않았어요 (패치)';
        if (S.pMain !== 'st') return '메인 스피커가 STEREO OUT 이 아닌 곳에 연결됐어요';
        if (!S.on) return '채널 ON 이 꺼져 있어요';
        if (!S.st && !(S.fxst && S.fx > 0 && S.fxrtn > 0)) return 'ST 버튼이 꺼져 채널이 메인 버스로 가지 않아요';
        if (S.fader <= 0) return '채널 페이더가 −∞ 예요';
        if (S.stm <= 0) return 'STEREO 페이더가 −∞ 예요';
      } else {
        if (S.pMon === 'none') return '무대 모니터가 연결되지 않았어요 (패치)';
        if (S.pMon === 'st') return '모니터에 메인 믹스가 나가요 — 모니터는 따로 섞는 AUX 로 보내요';
        if (!S.on) return '채널 ON 이 꺼져 있어요';
        if (S.pMon === 'aux1' && S.aux1 <= 0) return '채널의 AUX1 노브가 0 이에요';
        if (S.pMon === 'aux1' && S.a1m <= 0) return 'SEND MASTER AUX1 이 0 이에요';
        if (S.pMon === 'aux1' && !S.pre && S.fader <= 0) return 'POST 라서 페이더가 −∞(소리 없음)면 모니터도 꺼져요';
      }
      return '소리가 아주 작아요';
    }
    function lvTxt(d, target) { return d === NINF || d < -60 ? '<b class="bad">소리 없음 — ' + why(target) + '</b>' : '<b class="' + (d > 6 ? 'warn' : 'ok') + '">' + fmt(d) + ' dB</b>'; }
    function renderRead(l) {
      var pn = function (k) { return PATCH.filter(function (p) { return p[0] === k; })[0][1]; };
      read.innerHTML = '<h4>지금 상태 <small>보컬이 가장 클 때 기준 · 교육용 근사</small></h4>' +
        '<div class="sim-row"><span>메인 스피커 ← ' + esc(pn(S.pMain)) + '</span>' + lvTxt(l.spkMain, 'main') + '</div>' +
        (S.pMain === 'st' && isFinite(l.mainWet) && l.mainWet > -60 ? '<div class="sim-row"><span>└ 그중 리버브(FX RTN)</span><b>' + fmt(l.mainWet) + ' dB</b></div>' : '') +
        '<div class="sim-row"><span>무대 모니터 ← ' + esc(pn(S.pMon)) + '</span>' + lvTxt(l.spkMon, 'mon') + '</div>' +
        '<div class="sim-row"><span>AUX1 보내는 지점</span><b>' + (S.pre ? 'PRE (페이더 앞)' : 'POST (페이더 뒤)') + '</b></div>' +
        '<div class="sim-row"><span>헤드폰</span><b>' + (S.pfl ? 'PFL — 보컬만 (페이더 앞)' : 'STEREO 메인 믹스') + '</b></div>' +
        '<div class="sim-row"><span>PRE/POST 비교</span><b>' + (S.sawPre ? '✓ PRE 그대로' : '· PRE') + ' / ' + (S.sawPost ? '✓ POST 따라감' : '· POST') + '</b></div>' +
        '<p class="sim-note">PFL 을 켜도 메인 소리는 바뀌지 않아요. 실제 MG12XU 는 PFL 을 누르면 미터가 PFL 소리를 보여 줘요. 여기서는 보기 쉽게 미터를 따로 나눴어요.</p>';
    }
    function flowSvg(l) {
      var on = '#0e7490', aux = C.orange, fxc = C.purple, pflc = C.blue, off = '#cbd5e1';
      function ln(d, act, col, w) { return '<path d="' + d + '" fill="none" stroke="' + (act ? col : off) + '" stroke-width="' + (act ? (w || 3) : 2) + '"' + (act ? '' : ' stroke-dasharray="5 4"') + '/>'; }
      function bx(x, y, w, h, a, b, act, col) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7" fill="' + (act ? '#fff' : '#f8fafc') + '" stroke="' + (act ? col : off) + '" stroke-width="' + (act ? 2 : 1.5) + '"/>' + t(x + w / 2, y + (b ? h / 2 - 1 : h / 2 + 4), a, { size: w < 80 && a.length > 6 ? 9.5 : 11, weight: 800, fill: act ? C.ink : '#94a3b8' }) + (b ? t(x + w / 2, y + h / 2 + 11, b, { size: 9, fill: act ? C.sub : '#94a3b8' }) : ''); }
      var aOn = S.on, aPost = isFinite(l.post), aSt = isFinite(l.stDry), aMainBus = isFinite(l.main), aA1 = isFinite(l.aux1), aFx = isFinite(l.fxSend), aRet = isFinite(l.fxRet), aPfl = S.pfl;
      var s = '<svg viewBox="0 0 640 250" role="img" aria-label="보컬 신호가 지나가는 길" font-family="Pretendard, system-ui, sans-serif">';
      s += bx(6, 96, 64, 40, 'CH1', '보컬', true, on) + ln('M70 116 H88', true, on) + bx(88, 102, 42, 28, 'ON', '', aOn, on) + ln('M130 116 H156', aOn, on) +
        '<circle cx="143" cy="116" r="4" fill="' + (aOn ? aux : off) + '"/>' + t(143, 96, 'PRE', { size: 9.5, fill: aOn ? aux : '#94a3b8', weight: 800 }) +
        bx(156, 102, 52, 28, '페이더', '', aPost, on) + ln('M208 116 H236', aPost, on) + '<circle cx="222" cy="116" r="4" fill="' + (aPost ? fxc : off) + '"/>' + t(228, 146, 'POST', { anchor: 'start', size: 9.5, fill: aPost ? fxc : '#94a3b8', weight: 800 }) +
        bx(236, 102, 34, 28, 'ST', '', aSt, on) + ln('M270 116 H284', aSt, on) + bx(284, 96, 92, 40, 'ST 버스', 'STEREO 페이더', aMainBus, on) + ln('M376 116 H460', aMainBus, on, 3.5) +
        bx(460, 104, 76, 24, 'STEREO OUT', '', aMainBus, on);
      // AUX1
      var preAct = aOn && S.pre, postAct = aPost && !S.pre;
      var pPre = ln('M143 120 V186 H236', preAct && aA1, aux), pPost = ln('M222 130 V186 H236', postAct && aA1, aux);
      s += (S.pre ? pPost + pPre : pPre + pPost) + (S.pre ? t(150, 166, 'PRE 에서', { size: 9.5, fill: aA1 ? aux : '#94a3b8', anchor: 'start' }) : t(228, 166, 'POST 에서', { size: 9.5, fill: aA1 ? aux : '#94a3b8', anchor: 'start' })) +
        bx(236, 172, 140, 28, 'AUX1 · SEND MASTER', '', aA1, aux) + ln('M376 186 H460', aA1, aux, 3.5) + bx(460, 174, 76, 24, 'AUX1 SEND', '', aA1, aux);
      // FX
      s += ln('M222 112 V44 H236', aFx, fxc) + bx(236, 30, 62, 28, 'AUX2/FX', '', aFx, fxc) + ln('M298 44 H306', aFx, fxc) + bx(306, 30, 52, 28, 'SPX', '', aFx, fxc) + ln('M358 44 H366', aFx && isFinite(fdb(S.fxrtn)), fxc) +
        bx(366, 30, 62, 28, 'FX RTN', '', aRet, fxc) + ln('M397 58 V76 H330 V96', aRet, fxc) + t(404, 76, S.fxst ? 'ST 켜짐' : 'ST 꺼짐', { size: 9, fill: aRet ? fxc : '#94a3b8', anchor: 'start' }) +
        ln('M267 30 V16 H498 V34', aFx, fxc, 2.5) + bx(460, 34, 76, 24, 'AUX2 SEND', '', aFx, fxc);
      // PFL
      s += ln('M38 136 V224 H88', aPfl, pflc) + bx(88, 210, 128, 28, 'PFL → 헤드폰·미터', '', aPfl, pflc) + t(76, 204, 'ON 앞', { size: 9, fill: aPfl ? pflc : '#94a3b8', anchor: 'end' });
      // 스피커 패치
      var jackY = { st: 116, aux1: 186, aux2: 46 };
      [['pMain', 96, '🔊 메인 스피커', l.spkMain], ['pMon', 166, '🔈 무대 모니터', l.spkMon]].forEach(function (sp) {
        var p = S[sp[0]], act = isFinite(sp[3]) && sp[3] > -60, col = p === 'st' ? on : p === 'aux1' ? aux : fxc;
        s += '<rect x="552" y="' + sp[1] + '" width="84" height="40" rx="8" fill="' + (act ? '#ecfdf5' : '#f8fafc') + '" stroke="' + (act ? '#10b981' : off) + '" stroke-width="2"/>' + t(594, sp[1] + 18, sp[2], { size: 10.5, weight: 800 }) + t(594, sp[1] + 32, p === 'none' ? '미연결' : act ? '소리 남' : '소리 없음', { size: 9.5, fill: act ? '#047857' : '#94a3b8' });
        if (p !== 'none') s += ln('M536 ' + jackY[p] + ' C544 ' + jackY[p] + ' 544 ' + (sp[1] + 20) + ' 552 ' + (sp[1] + 20), act, col, 2.5);
      });
      return s + '</svg>';
    }
    function setMeter(role, v) { el.querySelectorAll('[data-role=' + role + '] span').forEach(function (sp) { sp.classList.toggle('on', v >= +sp.getAttribute('data-v')); }); }
    function envNow() {
      if (!vox) return 0;
      var tt = S.audio && actx && N ? (actx.currentTime - N.start) % vox.dur : ((performance.now() - S.t0) / 1000) % vox.dur;
      return vox.env[Math.floor(tt / vox.blk) % vox.env.length] || 0;
    }
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick); frame++;
      var a = envNow(), e = a > 0.001 ? 20 * Math.log10(a) : -100; S.rev = Math.max(a, S.rev * 0.985); var er = S.rev > 0.001 ? 20 * Math.log10(S.rev) : -100;
      var l = L();
      setMeter('mMain', psum(l.mainDry + e, l.mainWet + er)); setMeter('mA1', l.aux1 + e); setMeter('mA2', l.aux2 + e); setMeter('mPfl', l.pfl + e);
    }

    /* ---------- 소리 (Web Audio): 실제 보컬 녹음을 채널 → 버스 → 스피커로 */
    function applyAudio(l) {
      if (!N) return; var tt = actx.currentTime, set = function (node, v) { node.gain.setTargetAtTime(v, tt, 0.03); };
      set(N.onG, S.on ? 1 : 0); set(N.fad, g(fdb(S.fader))); set(N.st, S.st ? 1 : 0);
      set(N.a1Pre, S.pre ? 1 : 0); set(N.a1Post, S.pre ? 0 : 1); set(N.a1k, g(kdb(S.aux1))); set(N.a1m, g(kdb(S.a1m)));
      set(N.fxk, g(kdb(S.fx))); set(N.a2m, g(kdb(S.a2m))); set(N.ret, g(fdb(S.fxrtn) - 6)); set(N.retSt, S.fxst ? 1 : 0); set(N.stm, g(fdb(S.stm)));
      ['st', 'aux1', 'aux2'].forEach(function (b) { set(N.pm[b], S.pMain === b ? 1 : 0); set(N.pn[b], S.pMon === b ? 1 : 0); });
      set(N.phSt, S.pfl ? 0 : 1); set(N.phPfl, S.pfl ? 1 : 0);
      set(N.lMain, S.listen === 'main' ? 1 : 0); set(N.lMon, S.listen === 'mon' ? 1 : 0); set(N.lPh, S.listen === 'phones' ? 1 : 0);
    }
    function startAudio() {
      if (!vox || !vox.buffer) { q('[data-role=src]').textContent = '녹음을 불러오지 못해 소리는 들을 수 없어요. 미터는 가상 신호로 움직여요.'; return; }
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      actx = actx || new AC(); if (actx.resume) actx.resume();
      function G(v) { var n = actx.createGain(); n.gain.value = v == null ? 1 : v; return n; }
      var src = actx.createBufferSource(); src.buffer = vox.buffer; src.loop = true;
      var n = { norm: G(0.5 / (vox.max || 1)), onG: G(), fad: G(), st: G(), stBus: G(), stm: G(), a1Pre: G(), a1Post: G(), a1k: G(), a1m: G(), fxk: G(), a2m: G(), ret: G(), retSt: G(),
        phSt: G(), phPfl: G(), phones: G(), spkMain: G(), spkMon: G(), lMain: G(), lMon: G(), lPh: G(), out: G(0.7), pm: {}, pn: {} };
      var conv = actx.createConvolver(), sr = actx.sampleRate, len = Math.floor(sr * 2.2), ir = actx.createBuffer(2, len, sr);
      for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c), pd = Math.floor(sr * 0.02); for (var i = pd; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-(i - pd) / (sr * 0.45)); }
      conv.buffer = ir;
      src.connect(n.norm); n.norm.connect(n.onG); n.onG.connect(n.fad);                      // 입력 → ON → 페이더
      n.fad.connect(n.st); n.st.connect(n.stBus);                                             // POST → ST 버튼 → ST 버스
      n.onG.connect(n.a1Pre); n.fad.connect(n.a1Post); n.a1Pre.connect(n.a1k); n.a1Post.connect(n.a1k); n.a1k.connect(n.a1m);   // AUX1: PRE(페이더 앞) 또는 POST(페이더 뒤)
      n.fad.connect(n.fxk); n.fxk.connect(n.a2m); n.a2m.connect(conv); conv.connect(n.ret); n.ret.connect(n.retSt); n.retSt.connect(n.stBus);   // FX send → SPX(리버브) → FX RTN → ST 버스
      n.stBus.connect(n.stm);                                                                  // STEREO 페이더
      var buses = { st: n.stm, aux1: n.a1m, aux2: n.a2m };
      ['st', 'aux1', 'aux2'].forEach(function (b) { n.pm[b] = G(0); n.pn[b] = G(0); buses[b].connect(n.pm[b]); buses[b].connect(n.pn[b]); n.pm[b].connect(n.spkMain); n.pn[b].connect(n.spkMon); });   // 스피커 패치
      n.stm.connect(n.phSt); n.norm.connect(n.phPfl); n.phSt.connect(n.phones); n.phPfl.connect(n.phones);   // 헤드폰: PFL(ON 앞) 또는 STEREO
      n.spkMain.connect(n.lMain); n.spkMon.connect(n.lMon); n.phones.connect(n.lPh); n.lMain.connect(n.out); n.lMon.connect(n.out); n.lPh.connect(n.out); n.out.connect(actx.destination);
      var start = actx.currentTime + 0.05, off = ((performance.now() - S.t0) / 1000) % vox.dur; src.start(start, off);
      n.src = src; n.start = start - off; N = n; S.audio = true; applyAudio(L());
    }
    function stopAudio() { if (N) { try { N.src.stop(); N.out.disconnect(); } catch (e) { /* 이미 멈춤 */ } var tt = N && actx ? (actx.currentTime - N.start) : 0; S.t0 = performance.now() - tt * 1000; } N = null; S.audio = false; }

    /* ---------- 이벤트 */
    function onInput(e) {
      var tg = e.target, k = tg.getAttribute('data-k'), f = tg.getAttribute('data-f');
      if (k) { S[k] = clamp(+tg.value, 0, 10); update(); } else if (f) { S[f] = clamp(+tg.value, 0, 1000); update(); }
    }
    function onChange(e) {
      var tg = e.target, p = tg.getAttribute('data-p');
      if (p) { S[p] = tg.value; update(); } else if (tg.name === 'simConListen') { S.listen = tg.value; update(); }
    }
    function onClick(e) {
      var b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      var k = b.getAttribute('data-t');
      if (k) { S[k] = !S[k]; update(); return; }
      if (b.getAttribute('data-sim') === 'play') { if (S.audio) { stopAudio(); b.textContent = '🔊 소리 켜기'; b.classList.remove('on'); } else { startAudio(); if (S.audio) { b.textContent = '🔇 소리 끄기'; b.classList.add('on'); } } }
    }
    el.addEventListener('input', onInput); el.addEventListener('change', onChange); el.addEventListener('click', onClick);
    update(); tick();
    getVox(function (d) { if (!alive) return; vox = d; S.t0 = performance.now(); q('[data-role=src]').textContent = d.synthetic ? '녹음을 불러오지 못해 미터만 가상 신호로 보여 줘요.' : '보컬 녹음(MG12XU 실습과 같은 음원)이 계속 반복돼요. 들을 곳을 고르면 그 스피커로 가는 소리를 들려줘요.'; });

    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); stopAudio(); if (actx && actx.close) { try { actx.close(); } catch (e) { /* noop */ } }
        el.removeEventListener('input', onInput); el.removeEventListener('change', onChange); el.removeEventListener('click', onClick); el.innerHTML = ''; },
      state: function () { var l = L(); return { on: S.on, st: S.st, pre: S.pre, pfl: S.pfl, fxst: S.fxst, fader: fin(l.F), aux1: fin(kdb(S.aux1)), fx: fin(kdb(S.fx)), a1m: fin(kdb(S.a1m)), a2m: fin(kdb(S.a2m)), stm: fin(fdb(S.stm)), fxrtn: fin(fdb(S.fxrtn)),
        patchMain: S.pMain, patchMon: S.pMon, listen: S.listen, levels: { main: fin(l.main), mainDry: fin(l.mainDry), mainWet: fin(l.mainWet), aux1: fin(l.aux1), aux2: fin(l.aux2), phones: fin(l.phones), spkMain: fin(l.spkMain), spkMon: fin(l.spkMon) },
        sawPre: S.sawPre, sawPost: S.sawPost, audio: S.audio, ready: !!vox, synthetic: !!(vox && vox.synthetic), done: Object.keys(S.done) }; },
      // set: 버튼은 true/false, 페이더(fader·stm·fxrtn)는 dB(null = −∞), 노브(aux1·fx·a1m·a2m)는 0–10 눈금, 패치는 'none'|'st'|'aux1'|'aux2'
      set: function (o) {
        o = o || {};
        ['on', 'st', 'pre', 'pfl', 'fxst'].forEach(function (k) { if (o[k] != null) S[k] = !!o[k]; });
        ['fader', 'stm', 'fxrtn'].forEach(function (k) { if (k in o) S[k] = o[k] == null ? 0 : clamp(inv(FPTS, +o[k]), 0, 1000); });
        ['aux1', 'fx', 'a1m', 'a2m'].forEach(function (k) { if (o[k] != null) S[k] = clamp(+o[k], 0, 10); });
        if (o.patchMain) S.pMain = o.patchMain; if (o.patchMon) S.pMon = o.patchMon; if (o.listen) S.listen = o.listen;
        update(); return this.state();
      }
    };
  }
  window.STASims = window.STASims || {};
  window.STASims.consoleRouting = consoleRouting;

  /* =========================================================================== 모듈 데이터 */
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES.console = {
    id: 'console', path: 'hardware', no: 3, noLabel: '03-1', status: 'ready', level: '중급', minutes: 45, img: 'img/modules/mg12xu_full.jpg',   /* 2026-11-03: 「콘솔」 → 03-1 아날로그 콘솔 */
    title: '아날로그 콘솔', sub: '노브·스위치로 소리를 다듬고 섞는 콘솔 — MG12XU',
    overview: {
      lead: '콘솔(믹서)은 여러 소리를 한곳에 모으는 장비예요. 마이크와 악기 소리를 받아서 <b>크기와 음색</b>(소리 빛깔)을 다듬어요. 다듬은 소리를 하나로 섞은 뒤, <b>필요한 곳</b>으로 나눠 보내요. 보내는 곳은 메인 스피커, 무대 모니터, 이펙터(울림을 만드는 장비), 녹음 장비예요. 이 과정은 우리가 실습하는 아날로그 콘솔 <b>Yamaha MG12XU</b> 로 배워요. 아날로그 콘솔은 채널마다 노브와 스위치가 하나씩 달려 있어요. 그래서 눈에 보이는 그대로 소리가 지나가요. 채널 하나에서 소리가 지나가는 순서와 <b>버스</b>(소리를 모으는 길)를 알면 돼요. 그러면 다음 과정인 <b>03-2 디지털 콘솔</b>도 같은 원리로 다룰 수 있어요.',
      terms: [
        ['채널 스트립', '마이크나 악기 하나를 다루는 세로 한 줄이에요. 위에서부터 GAIN, EQ, AUX, PAN, ON, 페이더 순서로 소리가 지나가요.'],
        ['프리앰프 (GAIN)', '아주 작은 마이크 소리를 콘솔에서 쓰기 좋은 크기로 키우는 첫 단계예요. GAIN 노브로 키우는 양을 정해요.'],
        ['PAD', '너무 큰 입력을 미리 줄이는 스위치예요. MG12XU 의 CH1–4 에는 26 dB(신호를 약 20분의 1로) 줄이는 PAD 가 있어요.', 'consolePadMini'],
        ['HPF (하이패스 필터)', '아주 낮은 저음만 걸러 내는 스위치예요. 높은 소리는 그대로 지나가게(pass) 해서 붙은 이름이에요. MG12XU 는 80 Hz(1초에 80번 떨리는 낮은 소리) 아래를 줄여요. 무대 울림과 마이크 잡는 소리가 줄어요.'],
        ['버스', '여러 채널 소리를 한데 모으는 길이에요. 여러 개울이 모여 강이 되는 것과 비슷해요. 메인(STEREO), AUX, GROUP, FX 버스가 있어요.', 'consoleBusMini'],
        ['AUX (PRE / POST)', '메인과 따로 섞어서 모니터나 이펙터로 보내는 길이에요. PRE 는 페이더 앞에서, POST 는 페이더 뒤에서 소리를 꺼내요.'],
        ['PFL', 'Pre Fader Listen(페이더 앞에서 듣기)의 줄임말이에요. 한 채널 소리를 헤드폰과 미터로만 미리 들어요. 메인 소리는 바뀌지 않아요.'],
        ['GROUP', '여러 채널을 한 버스로 모으는 길이에요. 모은 소리를 페이더 하나로 함께 조절하거나 따로 내보내요. MG12XU 에는 GROUP 1-2 가 있어요.']
      ],
      points: [
        '소리 순서: <b>입력 → GAIN(PAD·HPF) → EQ·COMP → ON → 페이더 → 버스 → 출력</b>. 소리가 안 나면 이 순서대로 따라가며 막힌 곳을 찾아요.',
        '무대 모니터는 보통 <b>AUX PRE</b> 로 보내요. 메인 페이더와 상관없이 일정해서예요. 리버브 같은 이펙트는 <b>POST</b> 로 보내요. 페이더를 따라 함께 변해서예요.',
        '<b>PFL 은 듣고 보기만 하는 기능</b>이에요. 눌러도 메인 소리는 바뀌지 않아요. 확인이 끝나면 꼭 꺼요.'
      ],
      model: 'mg12xu'
    },
    theory: [
      { title: '입력과 출력 — 콘솔의 단자', visual: 'consoleIO',
        body: '콘솔의 단자(케이블을 꽂는 구멍)는 크게 두 가지예요. <b>입력</b>은 마이크·악기·장비의 소리가 들어오는 곳이에요. <b>출력</b>은 스피커·모니터·녹음 장비로 소리가 나가는 곳이에요. MG12XU 의 CH1–4 는 <b>콤보 단자</b>예요. 구멍 하나에 마이크(XLR) 케이블과 라인(폰) 케이블을 둘 다 꽂을 수 있어요. 라인은 키보드·노트북 같은 장비가 내보내는, 마이크보다 큰 신호예요. CH5–8 은 마이크(XLR) 구멍과 라인 구멍이 따로 있어요. CH9–12 는 왼쪽·오른쪽 두 줄을 함께 받는 스테레오 LINE 입력이에요. 출력에는 메인(STEREO OUT), AUX SEND, GROUP OUT 이 있어요. MONITOR OUT 과 PHONES(헤드폰)도 있어요.',
        more: '<ul><li><b>MG12XU (제조사 자료)</b>: STEREO OUT 은 XLR·폰 단자예요. 잡음에 강한 밸런스 방식이에요. 기준 크기는 +4 dBu(약 1.23 V)이고, 최대 +24 dBu 까지 나가요.</li> <li>AUX SEND·GROUP OUT·MONITOR OUT 은 폰 단자(임피던스 밸런스)예요. 기준은 +4 dBu 예요.</li> <li>CH9–12 LINE 은 기준이 −10 dBu 예요(+4 dBu 보다 작은 신호). 9/10·11/12 에는 RCA 단자와 USB 입력 선택도 있어요.</li> <li>입력은 소리가 들어오는 곳, 출력은 나가는 곳이에요. 출력끼리, 입력끼리 이으면 소리가 나지 않아요. 스피커 출력을 입력에 꽂으면 장비가 망가질 수 있어요.</li> <li>다른 콘솔도 이름만 조금 달라요. <b>MAIN(메인)·AUX(모니터)·GROUP·REC(녹음)</b> 같은 출력이 있어요. 처음 보는 콘솔은 단자 옆에 적힌 이름부터 읽어 보세요. 단자는 콘솔 윗면에 있기도 하고, 뒷면에 있기도 해요.</li> <li>기타·베이스처럼 <b>언밸런스</b>(잡음에 약한 방식)로 나오는 악기를 MIC 입력에 꽂을 때가 있어요. 이때는 변환 젠더 대신 <b>DI 박스</b>를 거쳐 꽂아요. 젠더로만 바꾸면 서로 맞지 않아 소리가 나빠질 수 있어요.</li></ul>',
        check: { q: 'MG12XU 에 키보드의 스테레오 출력(L·R 두 줄, 라인 신호)을 꽂으려고 해요. 어디에 꽂을까요?', options: [
          { t: 'CH9/10 같은 스테레오 LINE 입력', ok: true, why: '맞아요. 키보드의 L·R 라인 신호는 스테레오 LINE 입력에 꽂아요.' },
          { t: 'STEREO OUT 단자', why: '아니에요. STEREO OUT 은 메인 소리가 나가는 출력이에요.' },
          { t: 'AUX1 SEND 단자', why: '아니에요. AUX SEND 도 모니터로 소리를 내보내는 출력이에요.' }] } },
      { title: '프리앰프 · PAD · HPF · 팬텀 전원', visual: 'consoleInputStage',
        body: '마이크 소리는 아주 작아요. 그래서 <b>프리앰프</b>로 먼저 크게 키워요. 키우는 양을 정하는 노브가 GAIN 이에요. 드럼 킥처럼 소리가 너무 크면 GAIN 을 다 내려도 소리가 찌그러져요. 이때는 <b>PAD</b> 스위치로 신호를 먼저 줄여요. 무대 울림이나 마이크 잡는 소리 같은 아주 낮은 저음은 말소리에 필요 없어요. 이런 저음은 <b>HPF</b>(낮은 소리를 걸러 내는 스위치)로 줄여요. 콘덴서 마이크는 전기가 있어야 동작해요. 그래서 콘솔이 마이크 케이블로 전기를 보내 주는 <b>팬텀 전원(+48V)</b>을 켜요.',
        more: '<ul><li><b>MG12XU (제조사 자료·패널 표기)</b>: PAD 는 26 dB(신호를 약 20분의 1로 줄임)예요. CH1–4 에 있어요. PAD 로 줄이는 양은 콘솔마다 달라요. 보통 20 dB 안팎이에요.</li> <li>HPF 는 80 Hz 아래 저음을 줄여요. 기울기는 12 dB/oct 예요. 한 옥타브 내려갈 때마다 12 dB 씩 더 줄어든다는 뜻이에요. 한 옥타브 아래는 1초에 떨리는 수가 절반인 소리예요(예: 80 Hz → 40 Hz). HPF 는 CH1–4 와 CH5/6·7/8 의 MIC 입력에 있어요.</li> <li><b>PHANTOM +48V 스위치는 하나뿐</b>이에요. 켜면 CH1–7/8 의 MIC 입력 모두에 한꺼번에 전기가 가요.</li> <li>+48V 를 켜거나, 전기가 들어가는 채널에 마이크를 꽂고 뺄 때는 먼저 그 채널 ON 을 꺼요. 큰 잡음이 스피커로 나가면 스피커가 고장 날 수 있어요.</li> <li>그래서 팬텀 전원을 받으면 안 되는 장비는 MG12XU 의 MIC 입력에 함께 꽂지 않게 조심해요. 리본 마이크처럼 제조사가 금지한 장비가 그래요. SM58 같은 다이내믹 마이크는 대부분 괜찮아요.</li> <li>디지털 콘솔은 팬텀 전원을 <b>채널마다 따로</b> 켜고 끌 수 있는 경우가 많아요.</li> <li>GAIN 맞추는 방법은 「Gain Structure」 과정에서 자세히 연습해요.</li></ul>',
        pics: [{ v: 'consolePadSteps', cap: '입력이 너무 크면 <b>PAD 를 켜고, GAIN 을 처음부터 다시</b> 맞춰요. PAD 만 켜고 끝내면 소리가 너무 작아질 수 있어요.' }, { v: 'consolePhantomSafe', cap: '+48V 를 켜거나 마이크를 꽂고 뺄 때는 <b>먼저 그 채널 ON 을 꺼요.</b> 「퍽」 하는 큰 소리가 스피커로 나가지 않게요.' }],
        check: { q: 'GAIN 을 다 내려도 PEAK 불(너무 크다는 빨간 불)이 켜지는 큰 입력이에요. 무엇을 할까요?', options: [
          { t: 'PAD 를 켜고 GAIN 을 다시 맞춘다', ok: true, why: '맞아요. PAD 가 입력을 26 dB 먼저 줄여 주기 때문이에요.' },
          { t: 'HPF 를 켠다', why: '아니에요. HPF 는 80 Hz 아래 저음만 줄여요. 소리 전체가 큰 문제는 그대로예요.' },
          { t: '채널 페이더를 내린다', why: '아니에요. 찌그러짐은 페이더보다 앞인 프리앰프에서 생겨요. 그래서 페이더로는 고칠 수 없어요.' }] } },
      { title: '채널 안의 순서 — EQ·COMP, ON, 페이더', visual: 'consoleStrip',
        body: '채널 안에서 소리는 <b>위에서 아래로</b> 지나가요. 먼저 GAIN 으로 소리를 키워요. 그다음 <b>COMP</b> 와 <b>EQ</b> 로 소리를 다듬어요. COMP 는 큰 소리를 눌러 크기를 고르게 하는 장치예요. EQ 는 높은·중간·낮은 소리의 양을 바꾸는 노브예요. <b>ON</b> 버튼으로 채널을 켜고 꺼요. <b>페이더</b>(위아래로 미는 손잡이)로 버스에 섞는 양을 정해요. 중간중간 소리를 옆으로 꺼내 가는 곳이 있어요. <b>PFL</b>, <b>AUX PRE</b>, <b>AUX POST·FX</b> 예요. 어디에서 꺼내느냐에 따라 페이더를 움직였을 때의 영향이 달라요.',
        more: '<ul><li><b>MG12XU (패널 표기)</b>: CH1–4 에는 노브 하나로 쓰는 COMP 가 있어요.</li> <li>EQ 는 세 칸이에요. HIGH 는 10 kHz(1초에 만 번 떨리는 높은 소리)예요. MID 는 2.5 kHz(가운데 소리), LOW 는 100 Hz(낮은 소리)예요. 칸마다 최대 15 dB 까지 키우거나 줄여요(±15 dB). CH9/10·11/12 에는 HIGH·LOW 만 있어요.</li> <li><b>ON</b> 은 채널을 잠깐 끄는 스위치(음소거)예요. MG12XU 에서 ON 을 끄면 STEREO·GROUP·AUX·FX 어디로도 소리가 나가지 않아요. 그래도 PFL 로는 계속 들을 수 있어요(설명서).</li> <li>페이더의 <b>0 (U 라고도 적어요)</b>은 소리를 키우지도 줄이지도 않는 자리예요(유니티). 0 근처는 눈금이 넓어 섬세하게 조절하기 좋아요. 페이더가 늘 맨 아래에 있다면, 페이더보다 GAIN 을 먼저 다시 봐요.</li> <li><b>잠깐 끌 때는 ON, 크기를 바꿀 때는 페이더</b>를 써요. 설교 전에 찬양팀 마이크를 페이더로 끝까지 내리면, 다시 올릴 때 원래 위치를 잊기 쉬워요.</li> <li>디지털 콘솔은 채널마다 HPF·EQ·게이트·컴프레서를 모두 쓸 수 있는 경우가 많아요(03-2 디지털 콘솔 과정).</li></ul>',
        pics: [{ v: 'consoleUnity', cap: '페이더 눈금은 <b>0 (U) 근처가 넓고</b>, 아래로 갈수록 좁아요. 그래서 GAIN 을 알맞게 맞춰 두고, 페이더는 0 근처에서 조절해요.' }],
        check: { q: 'MG12XU 에서 채널 ON 을 끄면 어떻게 될까요?', options: [
          { t: '메인·AUX·FX 어디로도 안 나가지만, PFL 로는 들을 수 있다', ok: true, why: '맞아요. 그래서 예배 중 꺼 둔 채널도 PFL 로 미리 들어 볼 수 있어요.' },
          { t: '메인만 꺼지고 모니터(AUX)는 그대로 나간다', why: '아니에요. MG12XU 는 ON 을 끄면 AUX 로도 나가지 않아요(설명서).' },
          { t: 'PFL 로도 들을 수 없다', why: '아니에요. PFL 은 ON 과 상관없이 들을 수 있어요.' }] } },
      { title: 'ON · 페이더 · PFL — 메인을 건드리지 않고 듣기', visual: 'consolePfl',
        body: '<b>PFL</b> 을 누르면 그 채널 소리가 <b>헤드폰과 레벨 미터</b>로 가요. 레벨 미터는 소리 크기를 불빛 막대로 보여 주는 표시예요. 이때 가는 소리는 페이더 앞의 소리예요. 메인 스피커로 나가는 소리는 그대로예요. 그래서 예배 중에도 회중 모르게 엔지니어 혼자 한 채널을 들어 볼 수 있어요. GAIN 을 맞출 때나, 이상한 소리가 어느 채널에서 나는지 찾을 때 써요.',
        more: '<ul><li>MG12XU 에서 PFL 을 누르면 미터 아래 PFL 불이 켜져요. 그리고 미터가 그 채널의 PFL 소리 크기를 보여 줘요. 그래서 <b>PFL 을 켜 둔 채 잊으면 메인 크기를 잘못 읽을 수 있어요.</b></li> <li>헤드폰(PHONES)은 평소에 SOURCE 스위치로 고른 STEREO 나 GROUP 소리를 들려줘요. PFL 을 누르면 PFL 소리로 바뀌어요.</li> <li>여러 채널의 PFL 을 함께 누르면 소리가 섞여 들려요. 하나씩 확인해요.</li> <li>다른 콘솔에서는 같은 기능을 <b>SOLO</b> 나 <b>CUE</b> 라고 부르기도 해요.</li> <li>콘솔에 따라 <b>AFL</b>(After Fader Listen, 페이더 뒤에서 듣기)도 있어요. AFL 은 페이더를 내리면 헤드폰 소리도 작아져요. PFL 은 페이더를 내려도 그대로 들려요.</li></ul>',
        check: { q: '예배 중 기타 소리가 이상해요. 메인 소리는 그대로 두고 기타만 들으려면?', options: [
          { t: '기타 채널의 PFL 을 누르고 헤드폰으로 듣는다', ok: true, why: '맞아요. PFL 은 헤드폰·미터로만 보내서 메인은 그대로이기 때문이에요.' },
          { t: '기타 페이더를 크게 올려 본다', why: '아니에요. 그러면 회중이 듣는 메인 소리가 바뀌어요.' },
          { t: '다른 채널을 모두 끈다(ON 끄기)', why: '아니에요. 예배 중에 메인 소리가 끊겨요.' }] } },
      { title: '메인 · AUX(PRE/POST) · FX 보내기와 돌려받기', visual: 'consoleAux',
        body: '메인(STEREO) 말고도 <b>AUX</b> 로 따로 섞은 소리를 무대 모니터에 보내요. 무대 모니터는 찬양팀이 자기 소리를 듣는 무대 위 스피커예요. <b>PRE</b> 는 페이더 앞에서 소리를 꺼내요. 그래서 엔지니어가 메인 때문에 페이더를 움직여도 모니터는 그대로예요. <b>POST</b> 는 페이더 뒤에서 꺼내요. 그래서 페이더를 따라 모니터 소리도 함께 변해요. 수도관으로 치면 PRE 는 수도꼭지 앞에서, POST 는 수도꼭지 뒤에서 물을 나눠 받는 셈이에요. 리버브(목욕탕 같은 울림) 같은 이펙트는 <b>보내기(Send)</b>로 AUX(FX)에 보내요. 울림이 더해진 소리는 <b>돌려받기(Return)</b>로 FX RTN 에 받아서 메인에 섞어요.',
        more: '<ul><li><b>MG12XU (패널 표기)</b>: AUX1 은 채널마다 <b>PRE 스위치</b>가 있어요. 누르면 페이더 앞에서 보내요.</li> <li>AUX2/FX 에는 PRE 스위치가 없어요. 이 소리는 안에 든 SPX 이펙터와 AUX2 SEND 단자로 가요.</li> <li>전체 보내는 양은 SEND MASTER(AUX1·AUX2)로 정해요. SEND MASTER 는 보통 ▶ 표시(0 dB) 근처에 두고, 채널마다 AUX 노브로 양을 맞춰요. 돌아온 이펙트 양은 FX RTN 페이더로 정해요. FX RTN 에도 ST 버튼이 있어요. 이 버튼을 켜야 메인으로 가요.</li> <li>안에 든 SPX 에는 리버브·딜레이(메아리) 등 프로그램이 24가지 있어요(제조사 자료).</li> <li>모니터를 POST 로 보내면 문제가 생겨요. 메인에서 보컬 페이더를 내릴 때 인도자 모니터도 함께 작아지기 때문이에요. 그래서 모니터는 보통 PRE 로 보내요.</li> <li>리버브는 POST 로 보내요. 그래야 페이더를 내렸을 때 리버브도 함께 줄어요. 「울림만 남는」 일이 생기지 않아요.</li> <li>콘솔에 따라 채널마다 <b>INSERT</b>(인서트) 단자가 있어요. 채널 중간에서 소리를 꺼내 바깥 장비를 지나게 한 뒤 다시 받아요. 원래 소리 전부가 장비를 지나가요. 그래서 컴프레서·게이트·EQ 를 연결할 때 써요.</li></ul>',
        pics: [{ v: 'consoleFaucet', cap: '수도꼭지(페이더)를 잠가도 <b>꼭지 앞에서 나눠 받는 PRE</b> 는 그대로예요. <b>꼭지 뒤에서 받는 POST</b> 는 꼭지를 따라 줄어요.' }, { v: 'consoleInsertAux', cap: '<b>인서트</b>는 채널 중간에 장비를 끼워 소리 전부를 지나가게 해요(COMP·EQ). <b>AUX 보내기</b>는 복사본만 보내 울림을 만든 뒤 원래 소리와 섞어요(리버브).' }],
        check: { q: '인도자 모니터를 AUX1 PRE 로 보내고 있어요. 메인에서 그 보컬 페이더를 내리면 모니터는?', options: [
          { t: '그대로예요', ok: true, why: '맞아요. PRE 는 페이더 앞에서 꺼내서 페이더와 상관없기 때문이에요.' },
          { t: '페이더만큼 같이 작아져요', why: '아니에요. 그건 POST 로 보낼 때예요.' },
          { t: '완전히 꺼져요', why: '아니에요. 페이더를 내려도 PRE 로 보내는 소리는 꺼지지 않아요.' }] } },
      { title: '버스 · 라우팅 — ST 와 GROUP', visual: 'consoleRouting',
        body: '<b>버스</b>는 여러 채널 소리를 한데 모으는 길이에요. <b>라우팅</b>은 소리 길을 정하는 일이에요. 어떤 채널을 어느 버스·출력으로 보낼지 정해요. MG12XU 는 채널마다 <b>ST·1-2 버튼</b>이 있어요. 이 버튼으로 메인(STEREO)과 GROUP 1-2 중 어디로 보낼지 정해요. <b>GROUP</b> 은 여러 채널을 모아 페이더 하나로 함께 조절할 때 써요. GROUP OUT 으로 따로 내보낼 수도 있어요.',
        more: '<ul><li><b>MG12XU</b>: ST 를 누르면 STEREO(메인) 버스로 가요. 1-2 를 누르면 GROUP 1-2 버스로 가요.</li> <li>GROUP 소리는 GROUP OUT 으로 따로 내보낼 수 있어요. GROUP 의 ST 버튼을 누르면 메인에 합칠 수도 있어요.</li> <li><b>한 채널에 ST 와 1-2 를 모두 켜면</b> 메인에 같은 소리가 두 번 들어가요. 그러면 소리가 갑자기 커지거나 음색이 이상해질 수 있어요. 그래서 GROUP 으로 모을 채널은 ST 를 꺼요.</li> <li>PAN(좌우 노브)은 STEREO 에서는 왼쪽·오른쪽으로 보내는 비율을 정해요. GROUP 에서는 GROUP 1·2 로 보내는 비율을 정해요(패널 L1·R2).</li> <li>예배당에서는 자리마다 왼쪽·오른쪽 스피커와의 거리가 달라요. 그래서 PAN 을 끝까지 돌리지 않아요. 보컬·설교·베이스·킥 드럼은 가운데에 둬요.</li> <li>PAN 을 가운데에 두면 왼쪽·오른쪽으로 각각 조금 작게 나가요. 한쪽 끝으로 돌렸을 때보다 보통 3 dB 작아요(콘솔마다 달라요). 그래야 PAN 을 돌려도 전체 크기가 비슷하게 들려요.</li> <li>GROUP 페이더를 내리면 메인에서는 조용해져요. 하지만 채널에서 AUX(PRE)로 보내는 무대 모니터는 그대로 나와요.</li> <li>디지털 콘솔은 버튼 대신 화면의 <b>패치</b>(연결 정하기)로 라우팅해요. 설정 전체는 <b>씬</b>으로 저장해요. 03-2 디지털 콘솔 과정에서 다뤄요.</li></ul>',
        pics: [{ v: 'consolePan', cap: 'PAN 을 끝까지 한쪽으로 돌리면, <b>반대쪽에 앉은 사람은 그 소리를 잘 못 들어요.</b> 예배당에서는 PAN 을 가운데 가까이 써요.' }, { v: 'consoleGroupWarn', cap: 'GROUP 페이더를 내리면 메인에서는 조용해져요. 하지만 <b>AUX(PRE)로 가는 무대 모니터는 계속 나와요.</b>' }],
        check: { q: '찬양팀 악기 6채널을 페이더 하나로 함께 줄였다 키웠다 하고 싶어요. MG12XU 에서 알맞은 방법은?', options: [
          { t: '6채널은 1-2 켜고 ST 끄기 → GROUP 1-2 페이더로 조절 → GROUP 의 ST 로 메인에 보내기', ok: true, why: '맞아요. 악기들이 GROUP 에 모여서 GROUP 페이더 하나로 함께 움직이기 때문이에요.' },
          { t: '6채널의 PFL 을 모두 누른다', why: '아니에요. PFL 은 헤드폰·미터로 듣는 기능이라 메인 크기는 바뀌지 않아요.' },
          { t: '6채널을 AUX1 로 보낸다', why: '아니에요. AUX1 은 무대 모니터로 가는 길이에요. 메인 크기 조절과는 달라요.' }] } }
    ],
    practice: {
      kind: 'consoleRouting',
      lead: 'MG12XU 를 단순하게 만든 가상 콘솔과 라우팅 보드(소리 길 그림)예요. 보컬을 메인 스피커와 무대 모니터로 보내 봐요. AUX1 을 PRE 와 POST 로 바꿔 가며 페이더를 움직여 봐요. PFL 로 듣기와 FX 보내기·돌려받기도 해 봐요. 「소리 켜기」를 누르고 들을 곳(메인 스피커·무대 모니터·헤드폰)을 고르세요. 그러면 그 스피커로 가는 소리를 실제 보컬 녹음으로 들을 수 있어요.',
      note: '소리 크기(dB), 노브·페이더 눈금, 리버브 소리는 공부용으로 비슷하게 만든 값(교육용 근사)이에요. 구조는 MG12XU 를 따랐지만 더 단순해요.',
      tasks: [
        { id: 'main', title: '보컬을 메인으로', text: '메인 스피커를 STEREO OUT 에 연결하세요. 채널 ON·ST 를 켜고 페이더를 올려요. 메인 스피커 크기가 −20 dB 이상(0 에 더 가까운 쪽)이면 성공이에요.' },
        { id: 'monitor', title: '무대 모니터 보내기', text: '무대 모니터를 AUX1 SEND 에 연결하세요. 채널의 AUX1 노브와 SEND MASTER AUX1 을 올려요. 모니터 크기가 −20 dB 이상이면 성공이에요.' },
        { id: 'prepost', title: 'PRE 와 POST 비교', text: '모니터 소리가 나오는 상태에서 해요. PRE 로 두고 페이더를 10 dB 이상 움직이면 모니터가 그대로인지 봐요. POST 로 두고 움직이면 모니터도 함께 변하는지 봐요. 둘 다 확인하세요.' },
        { id: 'pfl', title: 'PFL 로 듣기', text: '메인으로 보컬이 나가는 동안 PFL 을 켜세요. 그리고 「헤드폰」을 골라 들어 보세요. 메인 스피커 크기는 그대로예요.' },
        { id: 'fx', title: 'FX 보내고 돌려받기', text: '채널 AUX2/FX 노브와 SEND MASTER AUX2 를 올려 SPX 로 보내세요. FX RTN 의 ST 를 켜고 FX RTN 페이더를 올려요. 메인에 리버브가 −30 dB 이상 섞이면 성공이에요.' }
      ],
      links: [
        { title: 'MG12XU 실습 · 오디오 테스트', text: '실제 MG12XU 사진 위에서 여러 악기 소리를 섞어 봐요. AUX·FX 소리도 들어 봐요.', go: { tab: 'tab6', audio: true } },
        { title: '확성 시스템의 기본 · 3D 실습 ③', text: 'MG12XU 의 메인 출력을 파워앰프와 스피커에 연결하고 소리를 내 봐요.', go: { tab: 'tab1', card: 's3' } }
      ]
    },
    quiz: [
      { q: '그림처럼 PFL 로 들으면 보컬 소리가 있어요. 그런데 메인에서는 전혀 안 나요. 어떤 순서로 확인할까요?', visual: 'consoleTrouble', options: [
        { t: 'ON → ST 버튼 → 채널 페이더 → STEREO 페이더 → 출력 연결', ok: true, why: '맞아요. 입력은 살아 있어요. 그러니 PFL 뒤의 단계를 소리 순서대로 따라가요.' },
        { t: 'GAIN 을 최대로 올린다', why: '아니에요. PFL 로 소리가 들리면 입력은 이미 들어오고 있어요. GAIN 을 올리면 찌그러질 수 있어요.' },
        { t: '팬텀 전원을 켠다', why: '아니에요. 입력 신호는 이미 있어요. 막힌 곳은 그 뒤예요.' }] },
      { q: '리버브를 AUX2/FX(POST)로 보내고 있어요. 보컬 페이더를 내리면 리버브는?', options: [
        { t: '보컬과 함께 작아져요', ok: true, why: '맞아요. POST 는 페이더 뒤에서 꺼내기 때문이에요.' },
        { t: '그대로 남아요', why: '아니에요. 그건 PRE 로 보낼 때예요. 그러면 페이더를 내려도 울림만 남아요.' },
        { t: '더 커져요', why: '아니에요. 페이더를 내리면 보내는 양도 줄어요.' }] },
      { q: 'PFL 을 누른 채 깜빡 잊으면 어떤 일이 생길까요?', options: [
        { t: '미터가 PFL 채널을 보여 줘서 메인 크기를 잘못 읽을 수 있다', ok: true, why: '맞아요. 그래서 확인이 끝나면 꼭 PFL 을 꺼요.' },
        { t: '그 채널만 메인 스피커로 크게 나간다', why: '아니에요. PFL 은 메인 출력을 바꾸지 않아요.' },
        { t: '그 채널이 꺼진다', why: '아니에요. PFL 은 듣고 보기만 하는 기능이에요.' }] },
      { q: 'MG12XU 의 CH3 에 콘덴서 마이크를 꽂고 PHANTOM +48V 를 켰어요. 어떻게 될까요?', options: [
        { t: '+48V 가 CH1–7/8 의 MIC 입력 모두에 한꺼번에 들어간다', ok: true, why: '맞아요. MG12XU 는 팬텀 스위치가 하나뿐이에요(패널 표기 CH 1-7/8 MIC).' },
        { t: 'CH3 에만 들어간다', why: '아니에요. 채널마다 따로 켜는 것은 일부 디지털 콘솔이에요. MG12XU 는 스위치가 하나예요.' },
        { t: 'CH9–12 LINE 입력에도 들어간다', why: '아니에요. 팬텀 전원은 MIC(XLR) 입력에만 들어가요.' }] },
      { q: '설교 시간에 찬양팀 보컬 마이크를 잠깐 꺼 두려고 해요. MG12XU 에서 가장 알맞은 방법은?', options: [
        { t: '채널 ON 을 끈다', ok: true, why: '맞아요. 페이더·GAIN 위치가 그대로 남아요. 그래서 다시 켜면 바로 같은 크기로 돌아와요.' },
        { t: '채널 페이더를 끝까지 내린다', why: '아니에요. 다시 올릴 때 원래 위치를 잊기 쉬워요. 잠깐 끌 때는 ON 을 써요.' },
        { t: 'GAIN 을 최소로 내린다', why: '아니에요. GAIN 은 입력 크기를 맞추는 곳이라 나중에 다시 맞춰야 해요. 모니터(PRE)에도 영향을 줘요.' }] }
    ],
    missions: [
      { title: '음향 트러블슈팅 · 미션 A', text: '입력은 있는데 소리가 안 날 때를 연습해요. 채널 ON·ST·페이더·출력 순서로 막힌 곳을 찾아요.', go: { tab: 'tab7', ts: 'A' } },
      { title: 'MG12XU 실습 · 채널 배정 게임', text: '악기와 보컬을 알맞은 채널에 꽂아요. 메인·모니터로 보내는 연결도 직접 맞춰 봐요.', go: { tab: 'tab6' } }
    ],
    deeper: [
      { title: '아날로그 콘솔과 디지털 콘솔', text: '아날로그 콘솔은 채널마다 노브·스위치가 따로 있어요. 그래서 보이는 그대로 조작해요. 디지털 콘솔은 소리를 숫자로 바꿔서 다듬어요. 채널을 골라(SELECT) 화면과 함께 쓰는 노브로 조절해요. 소리가 지나가는 순서(GAIN → EQ·COMP → 페이더 → 버스)는 둘이 똑같아요.', more: '<ul><li>디지털 콘솔은 모든 채널에 게이트(작은 잡음을 막는 문)·컴프레서·EQ 가 있어요. 이펙터도 콘솔 안에 들어 있어요.</li> <li>설정 전체를 <b>씬</b>으로 저장했다가 불러와요. 페이더 줄을 <b>레이어</b>로 바꿔 가며 많은 채널을 다뤄요.</li> <li>아날로그 콘솔은 보이는 그대로라 빠르고 쉽게 다뤄요. 대신 채널이 많아질수록 크고 무거워져요.</li> <li>디지털 콘솔은 작고 가벼우며, 씬 저장과 태블릿 원격 조작이 돼요. 대신 소리를 숫자로 바꾸느라 아주 짧은 지연(레이턴시)이 생기고, 메뉴를 익혀야 해요.</li> <li>자세한 내용은 다음 과정 <b>03-2 디지털 콘솔</b>(Behringer X32 기준)에서 배워요.</li></ul>' },
      { title: 'GROUP 과 DCA 의 차이', text: 'GROUP 은 여러 채널 소리를 실제로 한 버스에 모아요. 모은 소리를 함께 다듬거나 따로 내보낼 수 있어요. DCA 는 소리를 모으지 않아요. 여러 채널 페이더를 한 번에 움직이는 리모컨이에요.', more: 'MG12XU 의 GROUP 1-2 는 GROUP OUT 으로 따로 내보낼 수 있어요. ST 버튼으로 메인에 합칠 수도 있어요. DCA 는 주로 디지털 콘솔에 있는 기능이에요.' },
      { title: 'MATRIX', text: 'MATRIX 는 메인·모니터 버스를 한 번 더 섞는 버스예요. 섞은 소리를 로비·자모실 스피커, 녹음·방송으로 보내요. 주로 디지털 콘솔에 있어요.', more: '예를 들어 방송·녹음용 소리를 따로 만들 때 써요. 예배당 메인 소리에 설교 마이크만 조금 더 키울 수 있어요.' },
      { title: '모니터 요청 받는 법', text: '「제 소리 더 주세요」라는 요청이 올 때가 있어요. 그러면 그 사람의 모니터(AUX)에서 그 채널 보내는 양을 올려요. 메인 페이더를 올리면 회중석 소리만 바뀌어요(PRE 일 때).', more: '모니터를 너무 키우면 피드백(삐- 하고 우는 소리)이 나기 쉬워요. 다른 소리를 조금 줄여 주는 것도 좋은 방법이에요.' }
    ],
    sources: [
      { t: 'Yamaha MG12X/MG12XU 기술 사양 — 출력 레벨·단자, HPF 80 Hz 12 dB/oct', url: 'https://data.yamaha.com/files/download/other_assets/6/1525326/mg12x_en_ts_a0.pdf' },
      { t: 'Yamaha MG XU 시리즈 제품 페이지 — AUX 2(FX 포함), GROUP 2, SPX 24 프로그램', url: 'https://usa.yamaha.com/products/proaudio/mixers/mg_series_xu_model' },
      { t: 'Yamaha MG12XU 사용설명서 (ON·PFL·AUX)', url: 'https://usa.yamaha.com/files/download/other_assets/8/1506928/mg16x_en_om_a0.pdf' },
      { t: 'Yamaha CL 시리즈 사양 — CL5 입력·버스·DCA·씬·Dante', url: 'https://mx.yamaha.com/es/products/proaudio/mixers/cl_series/specs.html' },
      { t: 'Yamaha R Series(2세대) 사양 — Rio3224-D2 팬텀 전원(채널별)', url: 'https://in.yamaha.com/en/products/proaudio/interfaces/r_series_adda_2/specs.html' },
      { t: 'Shure — What is phantom power?', url: 'https://www.shure.com/en-US/insights/what-is-phantom-power-why-do-i-need-it' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 4장 오디오 믹싱 콘솔: 패드 · 극성 반전 · 팬텀 · 팬 3 dB 법칙 · 솔로(PFL·AFL) · 페이더 · 그룹 · 매트릭스 p.121–131', url: '' },
      { t: '무대예술전문인 자격검정 표준교재 「무대음향」(국립극장 · 교보문고, 2023) — 4장 믹싱 콘솔의 운영: DI 박스 · 팬텀 운영 · 팬 · 페이더 · 억스 · 그룹 · 인서트와 억스 연결 p.137–146', url: '' }
    ]
  };
})();
