/* =============================================================================
   03-3 디지털 콘솔 · M32 (Midas M32 LIVE 기준) — 2026-11-08
   - STA_MODULES['console-m32'] + STAVisuals.m32* (그림) + 실습은 x32_photo_sim.js 의 STASims.m32Photo
     (M32 사진 배치 = m32_layout.js, 콘솔 상태 · 화면 · 소리는 X32 와 같은 X32Model · X32Screen · X32Audio)
   - M32 는 X32 와 같은 운영 소프트웨어(펌웨어)를 써요. 그래서 화면 · 단추가 하는 일은 같고, 몸체 · 배치 · 부품이 달라요.
   - 사실(채널 · 버스 · DCA · 씬 · 큐 수 등)은 제조사 · 판매처 사양 기준(아래 sources).
   ============================================================================= */
(function () {
  'use strict';
  var V = window.STAVisuals = window.STAVisuals || {};
  var C = { ink: '#0f1f33', sub: '#51627a', line: '#cbd5e1', blue: '#2563eb', teal: '#0e7490', orange: '#ea580c', red: '#dc2626', green: '#059669', amber: '#d97706' };
  function svg(w, h, body, label) { return '<svg class="mod-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '" font-family="Pretendard, system-ui, sans-serif">' + body + '</svg>'; }
  function t(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 500) + '" fill="' + (o.fill || C.ink) + '" text-anchor="' + (o.anchor || 'middle') + '">' + s + '</text>'; }
  function rect(x, y, w, h, fill, stroke, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r == null ? 8 : r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.5"' : '') + '/>'; }
  function faders(x, y, n, gap, col, h) { var s = ''; for (var i = 0; i < n; i++) { var fx = x + i * gap; s += '<path d="M' + fx + ' ' + y + 'V' + (y + (h || 46)) + '" stroke="#475569" stroke-width="2"/>' + rect(fx - 4, y + 10 + (i * 7) % 18, 8, 6, col || '#e5e7eb', null, 2); } return s; }

  /* 그림 1: X32 와 M32 — 같은 것 · 다른 것 */
  V.m32Compare = function () {
    var s = rect(6, 6, 286, 196, '#f8fafc', '#cbd5e1') + rect(308, 6, 286, 196, '#fff7ed', '#fdba74');
    s += t(149, 30, 'X32 와 똑같은 것', { size: 14, weight: 800, fill: C.teal }) + t(451, 30, 'M32 만 다른 것', { size: 14, weight: 800, fill: C.orange });
    ['화면 · 메뉴 · 탭 (같은 운영 소프트웨어)', 'SELECT 로 채널 고르기 · 레이어', '버스 16 · 매트릭스 6 · DCA 8 · 뮤트 그룹 6', '씬 저장 · 불러오기', '라우팅 · AES50 단자 2개'].forEach(function (x, i) { s += t(20, 58 + i * 28, '✓ ' + x, { size: 12, anchor: 'start' }); });
    ['프리앰프: Midas PRO (32개)', '페이더: Midas PRO 모터 페이더 25개', '배치: 채널 섹션이 위쪽 한 줄', '쇼 컨트롤(큐 500 · 씬 100)', 'M32 LIVE: SD 카드 32채널 녹음'].forEach(function (x, i) { s += t(322, 58 + i * 28, '★ ' + x, { size: 12, anchor: 'start' }); });
    return svg(600, 208, s, 'X32 와 M32 의 같은 점과 다른 점');
  };
  /* 그림 2: M32 조작면 구역 */
  V.m32Surface = function () {
    var s = rect(4, 4, 592, 232, '#1f2933', '#0b0f14', 12) + t(14, 22, 'M32 조작면 — 구역별로 간단히 그린 그림 (실제 크기 · 위치와 조금 달라요)', { size: 10.5, fill: '#cbd5e1', anchor: 'start' });
    // 위쪽 줄: 채널 섹션
    s += rect(14, 32, 250, 70, 'rgba(251,191,36,.12)', '#fbbf24') + t(139, 48, '① 채널 섹션 (위쪽 한 줄)', { size: 11.5, weight: 800, fill: '#fde68a' });
    ['CONFIG', 'GATE·DYN', 'EQ', 'BUS SENDS', 'MAIN BUS'].forEach(function (x, i) { s += rect(20 + i * 48.5, 56, 45, 38, '#334155', null, 4) + t(42.5 + i * 48.5, 79, x, { size: 8, fill: '#e2e8f0', weight: 700 }); });
    s += rect(272, 32, 112, 70, 'rgba(56,189,248,.14)', '#38bdf8') + t(328, 48, '② 화면 · 메뉴', { size: 11.5, weight: 800, fill: '#bae6fd' }) + rect(284, 56, 70, 40, '#0b1220', '#475569', 3) + t(319, 80, '7인치 화면', { size: 8.5, fill: '#e2e8f0' });
    for (var k = 0; k < 4; k++) s += rect(360, 56 + k * 10, 18, 7, '#64748b', null, 2);
    s += rect(392, 32, 196, 70, 'rgba(167,139,250,.12)', '#a78bfa') + t(490, 48, '③ 모니터 · 토크백', { size: 11.5, weight: 800, fill: '#ddd6fe' }) + t(490, 72, 'MONITOR · PHONES LEVEL', { size: 9, fill: '#e2e8f0' }) + t(490, 90, 'TALK A · TALK B', { size: 9, fill: '#e2e8f0' });
    // 아래: 페이더
    s += rect(14, 110, 262, 118, 'rgba(34,211,238,.10)', '#22d3ee') + t(145, 126, '④ 입력 페이더 16개 + 레이어', { size: 11.5, weight: 800, fill: '#a5f3fc' }) + faders(30, 140, 16, 15.5, '#e5e7eb', 70);
    s += rect(284, 110, 150, 118, 'rgba(244,114,182,.12)', '#f472b6') + t(359, 126, '⑤ 출력 8개 + MAIN', { size: 11.5, weight: 800, fill: '#fbcfe8' }) + faders(298, 140, 8, 15, '#e5e7eb', 70) + faders(420, 140, 1, 0, '#ef4444', 70);
    s += rect(442, 110, 146, 118, 'rgba(74,222,128,.10)', '#4ade80') + t(515, 126, '⑥ 쇼 컨트롤 · ASSIGN', { size: 11.5, weight: 800, fill: '#bbf7d0' }) + t(515, 148, 'LAST · NEXT · UNDO · GO', { size: 9, fill: '#e2e8f0' }) + t(515, 168, 'ASSIGN 노브 4 · 단추', { size: 9, fill: '#e2e8f0' }) + t(515, 188, 'MUTE GROUPS 1–6', { size: 9, fill: '#e2e8f0' }) + t(515, 212, 'FADER FLIP = Sends on Fader', { size: 8.5, fill: '#fde68a', weight: 700 });
    return svg(600, 240, s, 'M32 조작면의 여섯 구역');
  };
  V.m32Layers = function () { var f = V.x32Layers ? V.x32Layers() : ''; return f.replace(/X32/g, 'M32').replace(/CH 1–16/g, 'INPUTS 1–16').replace(/CH 17–32/g, 'INPUTS 17–32'); };
  V.m32Chain = function () { var f = V.x32Chain ? V.x32Chain() : ''; return f.replace(/X32/g, 'M32'); };
  V.m32Sof = function () { var f = V.x32Sof ? V.x32Sof() : ''; return f; };
  V.m32Dca = function () { var f = V.x32Dca ? V.x32Dca() : ''; return f; };
  /* 그림: 쇼 컨트롤 */
  V.m32Show = function () {
    var s = rect(6, 6, 588, 176, '#f8fafc', '#cbd5e1') + t(300, 30, 'SHOW CONTROL — 예배 순서대로 큐(Cue)를 넘겨요', { size: 13.5, weight: 800 });
    var cues = [['01', '예배 전 음악'], ['02', '찬양'], ['03', '대표 기도'], ['04', '설교'], ['05', '헌금 · 광고']];
    cues.forEach(function (c, i) { var x = 24 + i * 112, on = i === 2; s += rect(x, 48, 100, 50, on ? '#fef3c7' : '#fff', on ? '#f59e0b' : '#cbd5e1') + t(x + 50, 68, '큐 ' + c[0], { size: 11, weight: 800, fill: on ? '#b45309' : C.sub }) + t(x + 50, 88, c[1], { size: 11.5, weight: 700 }); });
    [['LAST', '앞 큐 고르기', '#e2e8f0'], ['NEXT', '다음 큐 고르기', '#e2e8f0'], ['UNDO', '되돌리기', '#e2e8f0'], ['GO', '고른 큐 불러오기', '#bbf7d0']].forEach(function (b, i) { var x = 52 + i * 130; s += rect(x, 116, 70, 28, b[2], '#94a3b8', 6) + t(x + 35, 135, b[0], { size: 12, weight: 800 }) + t(x + 35, 166, b[1], { size: 11, fill: C.sub }); });
    return svg(600, 186, s, 'M32 쇼 컨트롤: LAST NEXT UNDO GO 로 큐 넘기기');
  };
  V.m32FlipMini = function () { return svg(220, 84, rect(4, 4, 212, 76, '#f8fafc', '#cbd5e1') + rect(20, 18, 70, 44, '#334155', null, 6) + t(55, 37, 'FADER', { size: 10, weight: 800, fill: '#fde68a' }) + t(55, 52, 'FLIP', { size: 10, weight: 800, fill: '#fde68a' }) + t(156, 36, '= Sends on Fader', { size: 11, weight: 800 }) + t(156, 56, '페이더가 「보내는 양」', { size: 10.5, fill: C.sub }), 'FADER FLIP 단추'); };
  V.m32ShowMini = function () { return svg(220, 84, rect(4, 4, 212, 76, '#f8fafc', '#cbd5e1') + ['LAST', 'NEXT', 'UNDO', 'GO'].map(function (b, i) { return rect(14 + i * 50, 24, 42, 24, i === 3 ? '#bbf7d0' : '#e2e8f0', '#94a3b8', 5) + t(35 + i * 50, 40, b, { size: 10, weight: 800 }); }).join('') + t(110, 68, '큐 · 씬을 순서대로 넘겨요', { size: 10.5, fill: C.sub }), '쇼 컨트롤 단추'); };
  V.m32PreMini = function () { return svg(220, 84, rect(4, 4, 212, 76, '#f8fafc', '#cbd5e1') + '<circle cx="44" cy="42" r="22" fill="#1f2933"/><circle cx="44" cy="42" r="14" fill="#475569"/><path d="M44 42L44 26" stroke="#fde68a" stroke-width="3" stroke-linecap="round"/>' + t(140, 36, 'Midas PRO', { size: 12, weight: 800 }) + t(140, 56, '마이크 프리앰프 32개', { size: 10.5, fill: C.sub }), 'Midas PRO 프리앰프'); };
})();

/* =========================================================================== 모듈 데이터 */
(function () {
  'use strict';
  var M32 = 'https://cdn-media.empowertribe.com/88b7019edb6a4da19acbf5407a5d6caa/Image_MI_0603-AEO_M32-LIVE_Front_XL.png';   // Midas 공식 제품 사진(앞)
  window.STA_MODULES = window.STA_MODULES || {};
  window.STA_MODULES['console-m32'] = {
    id: 'console-m32', path: 'hardware', no: 3, noLabel: '03-3', status: 'ready', level: '중급', minutes: 40, img: M32,
    title: '디지털 콘솔 · M32', sub: 'X32 와 같은 화면, 더 단단한 몸 — Midas M32 LIVE',
    overview: {
      lead: '<b>Midas M32</b> 는 X32 와 <b>같은 운영 소프트웨어</b>를 쓰는 디지털 콘솔이에요. 그래서 화면 · 메뉴 · SELECT · 레이어 · 씬 같은 쓰는 법이 거의 같아요. 대신 <b>프리앰프 · 페이더 · 몸체</b>가 더 좋은 부품이고, 단추가 놓인 자리가 달라요. 03-2 X32 를 먼저 배우고 오면 쉬워요.',
      terms: [
        ['Midas PRO 프리앰프', '마이크 소리를 처음 키우는 부분이에요. M32 에는 Midas PRO 프리앰프가 32개 있어요.', 'm32PreMini'],
        ['채널 섹션', '위쪽 한 줄에 모인 노브 한 벌이에요. CONFIG · GATE · DYNAMICS · EQUALISER · BUS SENDS · MAIN BUS 순서예요.'],
        ['SELECT', '채널을 고르는 단추예요. 고른 채널만 위쪽 노브와 화면에 나타나요. X32 와 같아요.'],
        ['레이어', 'INPUTS 1-16 · INPUTS 17-32 · AUX IN/USB · BUS MASTER 단추로 같은 페이더에 다른 채널을 불러와요.'],
        ['FADER FLIP', 'X32 의 Sends on Fader 와 같은 단추예요. 페이더가 잠깐 「모니터로 보내는 양」이 돼요.', 'm32FlipMini'],
        ['쇼 컨트롤', 'LAST · NEXT · UNDO · GO 단추로 저장해 둔 씬 · 큐를 순서대로 불러와요.', 'm32ShowMini'],
        ['VIEW', '각 구역 옆의 작은 단추예요. 누르면 화면에 그 구역의 자세한 설정이 나와요.']
      ],
      points: [
        'X32 에서 배운 순서(<b>SELECT → 화면 확인 → 조절</b>)가 그대로 통해요.',
        '단추 이름이 조금 달라요. <b>FADER FLIP</b> = Sends on Fader, <b>SHOW CONTROL</b> = 씬 단추예요.',
        '프리앰프가 좋아도 <b>GAIN 을 먼저 바르게</b> 맞추는 것이 가장 중요해요.'
      ]
    },
    theory: [
      { title: 'M32 는 어떤 콘솔일까 — X32 와 같은 화면, 다른 몸', visual: 'm32Compare',
        body: '쌍둥이 형제를 생각해 봐요. 얼굴(쓰는 법)은 닮았는데 키와 옷은 달라요. <b>M32</b> 와 <b>X32</b> 도 그래요. 두 콘솔은 <b>같은 운영 소프트웨어(펌웨어)</b>를 써요. 그래서 화면 메뉴, SELECT, 레이어, 버스, DCA, 씬 쓰는 법이 거의 같아요. 다른 것은 몸이에요. M32 는 마이크 소리를 처음 키우는 <b>프리앰프</b>로 Midas PRO 를 쓰고, 페이더도 Midas PRO 모터 페이더예요. 단추가 놓인 자리도 달라요. 그래서 처음 앉으면 먼저 <b>어디에 무엇이 있는지</b>만 익히면 돼요.',
        more: '<ul><li><b>M32 LIVE (제조사 · 판매처 사양)</b>: 입력 채널 40개(입력 32 · AUX 8 · FX 리턴 8), Midas PRO 마이크 프리앰프 32개, 모터 페이더 25개, 7인치 컬러 화면(800×480).</li> <li>믹스 버스 16 · 매트릭스 6 · 메인 LRC, DCA 8, 뮤트 그룹 6 — X32 와 같아요.</li> <li>AES50 단자 2개로 무대 상자(스테이지박스)를 이어요. 최대 96 입력 · 96 출력이에요.</li> <li>무게는 약 25 kg 이에요. 둘이서 옮겨요.</li></ul>',
        check: { q: 'X32 를 쓸 줄 알아요. M32 앞에 처음 앉으면 무엇부터 할까요?', options: [
          { t: '단추가 어디 있는지 익힌다', ok: true, why: '맞아요. 쓰는 법은 거의 같고, 단추 자리가 다르기 때문이에요.' },
          { t: '쓰는 법을 처음부터 다시 배운다', why: '아니에요. 같은 운영 소프트웨어라 X32 에서 배운 것이 그대로 통해요.' },
          { t: '모든 GAIN 을 올린다', why: '아니에요. GAIN 은 채널마다 소리를 보며 맞춰요.' }] } },
      { title: '조작면 둘러보기 — 위쪽 줄 · 화면 · 오른쪽 · 페이더', visual: 'm32Surface',
        body: 'M32 는 위쪽에 <b>채널 섹션</b>이 한 줄로 있어요. 왼쪽부터 <b>CONFIG/PREAMP</b>(GAIN · 48V · LOW CUT), <b>GATE · DYNAMICS</b>, <b>EQUALISER</b>, <b>BUS SENDS</b>, <b>MAIN BUS</b> 예요. 가운데에는 <b>화면</b>과 메뉴 단추(HOME · METERS · ROUTING …)가 있어요. 오른쪽 위에는 <b>MONITOR · TALKBACK</b>, 오른쪽 아래에는 <b>SHOW CONTROL · ASSIGN · MUTE GROUPS</b> 가 있어요. 아래쪽에는 입력 페이더 16개, 출력 페이더 8개, MAIN 페이더가 있어요. 구역마다 <b>VIEW</b> 단추를 누르면 화면에 그 구역이 크게 나와요.',
        more: '<ul><li>X32 는 채널 섹션이 화면 왼쪽에 네모 모양으로 모여 있어요. M32 는 위쪽에 가로로 길게 놓였어요.</li> <li>EQ 는 노브 세 개(WIDTH · FREQUENCY · GAIN)와 밴드 단추(HIGH · HI MID · LO MID · LOW)로 다뤄요.</li> <li>BUS SENDS 노브 4개는 BUS 1-4 · 5-8 · 9-12 · 13-16 단추로 맡을 버스를 바꿔요.</li> <li>MAIN BUS 의 M/C 노브는 가운데(모노) 버스로 보내는 양, PAN/BAL 은 좌우 자리예요.</li></ul>',
        check: { q: 'M32 에서 고른 채널의 EQ 를 화면에 크게 보려면?', options: [
          { t: 'EQUALISER 구역의 VIEW 를 누른다', ok: true, why: '맞아요. VIEW 는 그 구역의 자세한 설정을 화면에 보여 줘요.' },
          { t: 'MUTE 를 누른다', why: '아니에요. MUTE 는 소리를 끄는 단추예요.' },
          { t: 'GO 를 누른다', why: '아니에요. GO 는 쇼 컨트롤에서 씬 · 큐를 불러와요.' }] } },
      { title: '레이어와 SELECT — X32 와 같은 방법', visual: 'm32Layers',
        body: 'M32 도 입력 채널은 32개인데 왼쪽 입력 페이더는 16개예요. 그래서 <b>레이어 단추</b>로 같은 페이더에 다른 채널을 불러와요. <b>INPUTS 1-16</b> 을 누르면 1~16번, <b>INPUTS 17-32</b> 를 누르면 17~32번이 와요. 오른쪽 8개 페이더도 <b>GROUP DCA 1-8 · BUS 1-8 · BUS 9-16 · MTX 1-6/MAIN C</b> 레이어가 있어요. 채널을 다듬을 때는 먼저 <b>SELECT</b> 를 눌러요. 그다음 위쪽 노브와 화면으로 조절해요. 늘 페이더 위 <b>이름표(LCD)</b>를 보고 만져요.',
        more: '<ul><li>레이어를 바꾸면 모터 페이더가 저절로 그 채널들의 자리로 움직여요.</li> <li>MAIN 페이더는 레이어와 상관없이 늘 오른쪽 끝에 있어요.</li> <li>이름표 색은 화면 CONFIG(또는 UTILITY)에서 바꿔요. 같은 악기끼리 같은 색으로 하면 찾기 쉬워요.</li></ul>',
        check: { q: '레이어가 INPUTS 17-32 예요. 왼쪽 첫 페이더를 올리면?', options: [
          { t: 'CH 17 이 커진다', ok: true, why: '맞아요. 지금 그 페이더는 17번 채널을 맡고 있어요.' },
          { t: 'CH 1 이 커진다', why: '아니에요. CH 1 은 INPUTS 1-16 레이어일 때예요.' },
          { t: 'MAIN 이 커진다', why: '아니에요. MAIN 은 오른쪽 끝 페이더예요.' }] } },
      { title: '채널 다듬기 — CONFIG · GATE · DYNAMICS · EQUALISER', visual: 'm32Chain',
        body: '소리를 다듬는 순서는 X32 와 같아요. 먼저 <b>CONFIG/PREAMP</b> 에서 <b>GAIN</b> 으로 입력 크기를 맞춰요. 콘덴서 마이크 채널만 <b>48V</b> 를 켜요. <b>LOW CUT</b> 을 켜고 FREQUENCY 노브로 웅웅거리는 낮은 소리를 걸러요. 그다음 필요하면 <b>GATE</b>(작은 잡음 막기), <b>DYNAMICS</b>(큰 소리 누르기, COMP 단추), <b>EQUALISER</b>(소리 빛깔 다듬기)를 써요. 위쪽 노브는 언제나 <b>지금 SELECT 한 채널</b>만 바꿔요.',
        more: '<ul><li>GAIN 노브 옆 세로 불빛이 입력 미터예요. 가장 큰 소리가 −18 ~ −6 쯤이면 알맞아요.</li> <li>Ø 단추는 소리 물결을 위아래로 뒤집어요(극성 반전). 드럼 마이크 두 개가 서로 소리를 깎을 때 써 봐요.</li> <li>EQ MODE 단추는 고른 밴드의 모양(LCUT · LSHV · PEQ · VEQ · HSHV · HCUT)을 바꿔요. 옆 불빛이 지금 모양을 보여 줘요.</li> <li>GATE · DYNAMICS 의 THRESHOLD 노브는 「이 크기부터 일해라」 하는 기준선이에요.</li></ul>',
        check: { q: '설교 구즈넥(콘덴서) 마이크 채널을 SELECT 했어요. 소리가 안 나면 먼저?', options: [
          { t: 'CONFIG 의 48V 가 켜졌는지 본다', ok: true, why: '맞아요. 콘덴서 마이크는 팬텀 전원(48V)이 있어야 소리가 나요.' },
          { t: 'EQ 의 HIGH 를 올린다', why: '아니에요. 소리가 아예 없으면 EQ 로는 안 나요.' },
          { t: 'MAIN 페이더를 끝까지 올린다', why: '아니에요. 먼저 소리가 들어오는지부터 봐요.' }] } },
      { title: '모니터 믹스 — BUS SENDS 와 FADER FLIP', visual: 'm32Sof',
        body: '찬양 인도자가 「제 모니터에 기타 더 주세요」라고 해요. M32 는 모니터 소리를 <b>믹스 버스(BUS)</b>에서 따로 섞어요. 방법은 두 가지예요. 첫째, 채널을 SELECT 하고 위쪽 <b>BUS SENDS</b> 노브를 돌려요. 둘째, <b>FADER FLIP</b> 단추를 켜고 오른쪽에서 BUS 1 을 SELECT 해요. 그러면 입력 페이더가 잠깐 「BUS 1 로 보내는 양」이 돼요. X32 의 Sends on Fader 와 같아요. 다 맞추면 FADER FLIP 을 꼭 꺼요.',
        more: '<ul><li>FADER FLIP 이 켜져 있으면 페이더 손잡이 색과 화면 맨 위에 표시가 나와요.</li> <li>BUS SENDS 의 BUS 1-4 · 5-8 · 9-12 · 13-16 단추는 노브 4개가 맡을 버스 묶음을 바꿔요.</li> <li>무대 모니터는 보통 페이더 앞(PRE)에서 보내요. 메인 페이더를 움직여도 모니터가 흔들리지 않게 하려는 거예요.</li></ul>',
        check: { q: 'FADER FLIP 을 켠 걸 잊고 메인 소리를 줄였어요. 무슨 일이 생길까요?', options: [
          { t: '모니터(BUS)로 보내는 양이 줄어든다', ok: true, why: '맞아요. 켜져 있으면 페이더는 BUS 로 보내는 양이에요.' },
          { t: '메인만 줄어든다', why: '아니에요. 그건 FADER FLIP 이 꺼져 있을 때예요.' },
          { t: '아무 일도 없다', why: '아니에요. 고른 BUS 로 보내는 양이 바뀌어요.' }] } },
      { title: '쇼 컨트롤 — 씬과 큐를 순서대로', visual: 'm32Show',
        body: '예배는 순서가 있어요. 찬양 → 기도 → 설교 → 광고. M32 의 <b>SHOW CONTROL</b> 은 이 순서대로 설정을 불러오게 도와줘요. 설정 전체를 <b>씬</b>으로 저장해 두고, 순서표(<b>큐</b>)에 늘어놓아요. 예배 중에는 <b>NEXT</b> 로 다음 순서를 고르고 <b>GO</b> 로 불러와요. 잘못 불렀으면 <b>UNDO</b> 로 되돌려요. <b>LAST</b> 는 앞 순서를 골라요. 저장하지 않고 바꾼 것은 다음에 불러올 때 사라지니, 리허설이 끝나면 꼭 저장해요.',
        more: '<ul><li><b>M32 (사양)</b>: 큐 500개 · 씬 100개 · 스니펫 100개를 저장해요. 스니펫은 설정 일부만 저장하는 작은 씬이에요.</li> <li>세이프(Safe)로 「씬을 불러와도 바뀌면 안 되는 것」을 정해 둘 수 있어요. 예: 설교 마이크 GAIN.</li> <li>씬을 부르면 모터 페이더가 한꺼번에 움직여요. 예배 중에는 꼭 필요할 때만 불러요.</li></ul>',
        check: { q: '예배 순서가 「찬양 → 설교」로 넘어갔어요. 쇼 컨트롤로 설교 설정을 부르려면?', options: [
          { t: 'NEXT 로 설교 큐를 고르고 GO', ok: true, why: '맞아요. NEXT 는 고르기, GO 는 불러오기예요.' },
          { t: 'UNDO 를 누른다', why: '아니에요. UNDO 는 방금 불러온 것을 되돌려요.' },
          { t: 'LAST 를 두 번 누른다', why: '아니에요. LAST 는 앞 순서를 골라요.' }] } }
    ],
    practice: {
      kind: 'm32Photo',
      lead: '위에서 찍은 실제 M32 LIVE 사진 위에서 마우스로 조작해요. ① 페이더 · 노브는 끌고, 단추는 눌러요. ② 왼쪽 레이어 단추로 INPUTS 1-16 과 17-32 를 바꿔요. ③ SELECT 로 고른 채널은 위쪽 노브와 화면으로 다뤄요. 예시 교회에서 1–16 번은 찬양팀 · 성가대, 17–20 번은 설교 · 사회 · 영상이에요.',
      note: '사진: Sweetwater 의 M32 LIVE 제품 사진(위에서 찍은 사진). 페이더 · 노브 · 단추 · 이름표 · 미터 · 화면은 사진 위에 겹쳐 그렸어요. 소리 크기(dB)와 미터는 공부용으로 비슷하게 만든 값(교육용 근사)이에요. 화면은 X32 와 같은 운영 소프트웨어(펌웨어 4) 화면이에요.',
      tasks: [
        { id: 'p48', title: '레이어 바꿔 채널 찾고 48V 켜기', text: '① 왼쪽 레이어 단추 INPUTS 17-32 를 눌러요. ② 이름표가 「설교」인 CH 17 의 SEL 을 눌러요. ③ 위쪽 CONFIG/PREAMP 의 48V 를 켜면 성공이에요.' },
        { id: 'gain', title: 'GAIN 노브로 입력 맞추기', text: '① CONFIG/PREAMP 의 GAIN 노브를 위아래로 끌어요. ② 노브 옆 세로 불빛(입력 미터)과 화면을 봐요. ③ 가장 큰 순간이 −18 ~ −6 dBFS 에 오면 성공이에요.' },
        { id: 'lowcut', title: 'LOW CUT 으로 저음 정리', text: '① LOW CUT 단추를 켜요. ② 옆 FREQUENCY 노브를 돌려요(화면에 Hz 가 나와요). ③ 80 ~ 150 Hz 에 맞추면 성공이에요.' },
        { id: 'sof', title: 'FADER FLIP 으로 모니터 보내기', text: '① FADER FLIP(SENDS ON FADER) 단추를 눌러요. ② 오른쪽 BUS 1-8 레이어에서 BUS 1(인도자 모니터)의 SEL 을 눌러요. ③ INPUTS 1-16 레이어로 돌아가요. CH1 인도자 페이더를 −10 dB 이상 올리면 성공이에요.' },
        { id: 'dca', title: 'DCA 로 악기 한 번에 줄이기', text: '① FADER FLIP 을 꺼요. ② 오른쪽 GROUP DCA 1-8 레이어에서 DCA 1 「악기」 페이더를 끌어내려요. ③ −10 dB 이하가 되면 성공이에요. 악기 채널 페이더는 그대로예요.' },
        { id: 'scene', title: '쇼 컨트롤로 되돌리기', text: '① 설정을 바꾼 상태에서 해요. ② SHOW CONTROL 의 LAST · NEXT 로 「01 주일 1부 예배」를 골라요. 그리고 GO 를 눌러요. ③ 처음 설정으로 돌아가면 성공이에요. UNDO 로 다시 되돌릴 수도 있어요.' }
      ],
      links: []
    },
    quiz: [
      { q: 'M32 와 X32 의 관계로 맞는 것은?', options: [
        { t: '같은 운영 소프트웨어라 쓰는 법이 거의 같다', ok: true, why: '맞아요. 그래서 X32 에서 배운 것을 M32 에서 그대로 써요.' },
        { t: '화면 메뉴가 완전히 다르다', why: '아니에요. 화면 메뉴와 탭이 같아요.' },
        { t: 'M32 는 아날로그 콘솔이다', why: '아니에요. M32 도 디지털 콘솔이에요.' }] },
      { q: 'M32 의 FADER FLIP 은 X32 의 무엇과 같을까요?', visual: 'm32FlipMini', options: [
        { t: 'Sends on Fader', ok: true, why: '맞아요. 페이더가 「버스로 보내는 양」이 돼요.' },
        { t: 'MUTE', why: '아니에요. MUTE 는 소리를 끄는 단추예요.' },
        { t: 'SOLO', why: '아니에요. SOLO 는 헤드폰으로 그것만 듣는 단추예요.' }] },
      { q: '위쪽 GAIN 노브를 돌리면 어느 채널이 바뀔까요?', options: [
        { t: '지금 SELECT 한 채널', ok: true, why: '맞아요. 위쪽 노브 한 벌은 고른 채널만 조절해요.' },
        { t: '모든 채널', why: '아니에요. 그러면 큰일 나요. 고른 채널만 바뀌어요.' },
        { t: '마지막으로 MUTE 한 채널', why: '아니에요. MUTE 와는 상관없어요.' }] },
      { q: '쇼 컨트롤에서 다음 순서를 「고르기만」 하는 단추는?', visual: 'm32ShowMini', options: [
        { t: 'NEXT', ok: true, why: '맞아요. NEXT 로 고르고, GO 로 불러와요.' },
        { t: 'GO', why: '아니에요. GO 는 고른 것을 불러와요.' },
        { t: 'UNDO', why: '아니에요. UNDO 는 불러온 것을 되돌려요.' }] },
      { q: 'M32 의 프리앰프가 좋다고 GAIN 을 대충 맞춰도 될까요?', options: [
        { t: '아니다. GAIN 을 먼저 바르게 맞춘다', ok: true, why: '맞아요. 좋은 부품도 입력 크기가 알맞아야 제 소리를 내요.' },
        { t: '그렇다. 콘솔이 알아서 맞춘다', why: '아니에요. GAIN 은 사람이 소리를 보며 맞춰요.' },
        { t: 'GAIN 은 끝까지 올린다', why: '아니에요. 너무 크면 소리가 깨져요(클립).' }] }
    ],
    missions: [],
    deeper: [
      { title: 'SD 카드로 예배 녹음하기 — M32 LIVE', text: 'M32 LIVE 에는 녹음 카드가 들어 있어요. 컴퓨터 없이 <b>SD 카드 두 장</b>에 32채널을 따로따로 녹음해요. 녹음한 소리를 다시 채널로 틀어 연습할 수도 있어요(가상 사운드체크).', more: '<ul><li><b>M32 LIVE (사양)</b>: 32채널을 SD/SDHC 카드 두 장에 녹음 · 재생, 한 번에 32채널 무압축 WAV 를 최대 약 3시간.</li> <li>USB 로 컴퓨터와 이어 32×32 채널 오디오 인터페이스로도 써요.</li></ul>' },
      { title: '무대 상자와 잇기 — AES50', text: 'M32 뒷면의 <b>AES50</b> 단자에 랜선을 꽂아 무대의 입력 상자(예: Midas DL32)와 이어요. 굵은 멀티케이블 대신 랜선 한 가닥으로 마이크 소리가 오가요.', more: '<ul><li>AES50 단자 2개로 최대 96 입력 · 96 출력.</li> <li>X32 와 같은 AES50 방식이에요.</li></ul>' },
      { title: '태블릿으로 조절하기 — M32 앱', text: '태블릿이나 노트북으로도 M32 를 조절할 수 있어요. 예배당 자리에 앉아 들으며 맞출 때 좋아요.', more: '<ul><li><b>M32-Edit</b>: PC · Mac · Linux 용 제조사 프로그램이에요.</li> <li><b>M32-Mix</b>: iPad 용 앱이에요.</li> <li>원격으로 만질 때도 지금 어느 채널을 고쳤는지 꼭 알려 줘요.</li></ul>' }
    ],
    sources: [
      { t: 'Midas M32 LIVE 제품 페이지 — 사진 · 매뉴얼 · M32-Edit · 펌웨어', url: 'https://www.midasconsoles.com/en/products/0603-AEO' },
      { t: 'Midas M32 LIVE 사양 — 입력 40 · Midas PRO 프리앰프 32 · 모터 페이더 25 · 7인치 화면 · DCA 8 · 뮤트 그룹 6 · 큐 500 · 씬 100 · 스니펫 100 · AES50 2 · SD 32채널 녹음 (Markertek)', url: 'https://www.markertek.com/product/m32live/midas-m32-live-digital-console-for-live-studio-40-input-channels-32-midas-pro-mic-preamps-25-mix-buses' },
      { t: 'M32 vs X32 — 같은 펌웨어 · Midas 프리앰프 · 만듦새 (Springtree)', url: 'https://www.springtree.net/audio-visual-blog/m32-vs-x32-which-digital-console-is-better/' },
      { t: 'M32-Mix (App Store)', url: 'https://apps.apple.com/app/id881937732' },
      { t: 'Midas M32 LIVE 제품 사진(위에서 찍음) — 실습 사진 (Sweetwater)', url: 'https://www.sweetwater.com/store/detail/M32Live--midas-m32-live-digital-mixer' },
      { t: 'Behringer X32 User Manual — 화면 · 탭 설명(같은 운영 소프트웨어) (ManualsLib)', url: 'https://www.manualslib.com/manual/909783/Behringer-X32.html?page=34' }
    ]
  };
})();
