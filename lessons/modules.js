/* =============================================================================
   전체 학습 과정 — 학습 경로(#tabPath) + 학습 모듈(#tabModule) 화면 (2026-10-20)
   - 데이터: lessons/modules_data.js (STA_PATHS, STA_MODULES)  · 모듈별 파일: lessons/modules/*.js
   - 그림: lessons/modules_visuals.js (STAVisuals), 실습: lessons/modules_sims.js (STASims)
   - 홈(lessons.js renderHome)에 「전체 학습 과정」 경로 카드를 끼워 넣고, 경로·모듈 화면은 이 파일이 그림
   - 진행 상태: localStorage 'soundTrainerModules_v1' — 학습 완료(개념 체크) / 실습 완료(과제) / 이해도 확인(문제)을 따로 저장
     모듈을 열기만 하거나 탭을 누른 것은 완료로 치지 않음
   - 주소: #path-hardware, #module-mic, #module-gain-structure-practice
   ============================================================================= */
(function () {
  'use strict';
  var PATHS = window.STA_PATHS || [], MODS = window.STA_MODULES || {}, VIS = window.STAVisuals || {}, SIMS = window.STASims || {};
  var GL = window.STA_GLANCE || {};   // 2026-10-23: 「한눈에 보기」 + 장비 사진 설명 (lessons/modules_glance.js)
  var KEY = 'soundTrainerModules_v1';
  var TABS = [['overview', '핵심 개념'], ['theory', '이론 학습'], ['practice', '실습하기'], ['quiz', '확인 문제'], ['missions', '관련 미션'], ['deeper', '심화 학습']];
  var PRACTICE_INFO = {
    tab1: ['확성 시스템의 기본', '마이크·믹서·앰프·스피커를 3D 로 직접 연결하고 조작해 봅니다.', 'vi10p.jpg'],
    tab6: ['MG12XU 실습', '실제 콘솔 사진 위에서 연결하고, 소리를 들으며 조작합니다.', 'console_strip.jpg'],
    tab5: ['CL5 콘솔 트레이닝', '예배 식순에 맞춰 채널을 켜고 DCA 를 다루는 운용 훈련입니다.', 'img/modules/hw_console.jpg'],
    tab2: ['3층 음향 시스템', '본당에 실제로 설치된 장비 위치와 신호가 지나는 길을 3D 로 보고 직접 배선해 봅니다.', 'img/modules/hw_speaker.jpg'],
    tab7: ['음향 트러블슈팅', '고장 증상을 보고 원인을 찾아 고칩니다.', 'jack_strip.jpg'],
    tabBrands: ['장비 브랜드 알아보기', '장비 종류마다 현장에서 자주 만나는 대표 브랜드와 특징, 우리 교회 장비를 함께 봅니다.', 'img/modules/hw_console.jpg'],
    tabFeedback: ['하울링 제어 훈련', '링아웃으로 하울링 주파수를 찾아 깎고, 예배 중 갑자기 나는 하울링에 바르게 대응해 봅니다.', ''],
    tabCheck: ['자가 진단 기준표', '방송실 모니터링·스피커 지향각·룸 어쿠스틱 등 우리 시스템을 항목별로 진단하고 개선 순서를 정합니다.', 'img/modules/hw_speaker.jpg'],
    tabTips: ['실전 꿀팁', '책에는 잘 나오지 않는 현장 노하우를 상황별로 모았어요.', 'img/modules/hw_mic.jpg'],
    tab3: ['Ear Training', '볼륨 변화, 대역별 소리, 밸런스를 귀로 훈련합니다.', 'img/modules/mix2_ear.jpg'],
    tabMixVideo: ['믹싱 과정 영상', '실제로 믹싱하는 과정을 영상으로 보며 배워요. (영상 준비 중)', 'img/modules/mix2_video.jpg']
  };
  /* 썸네일 사진 출처 (Wikimedia Commons 사진은 라이선스에 따라 저작자 표시) */
  var IMG_CREDITS = {
    'img/modules/hw_mic.jpg': { t: '사진: cogdogblog, 「2011-365-63 On The Air」, CC BY 2.0 (Wikimedia Commons, 잘라서 사용)', url: 'https://commons.wikimedia.org/wiki/File:2011-365-63_On_The_Air_(5497700337).jpg' },
    'img/modules/hw_cable.jpg': { t: '사진: Jud McCranie, 「XLR connectors, male and female」, CC BY-SA 4.0 (Wikimedia Commons, 잘라서 사용)', url: 'https://commons.wikimedia.org/wiki/File:XLR_connectors,_male_and_female.jpg' },
    'img/modules/hw_console.jpg': { t: '사진: 3층에 설치된 Yamaha CL5 (제조사 제품 사진)' },
    'img/modules/hw_amp.jpg': { t: '사진: 3층에 설치된 d&b 40D · 10D 앰프 (제조사 제품 사진)' },
    'img/modules/hw_speaker.jpg': { t: '사진: 3층에 설치된 d&b 서브우퍼 · E8 · Vi10P (제조사 제품 사진)' },
    'img/modules/mg12xu_full.jpg': { t: '사진: 「MG12XU 실습」 화면의 콘솔 (Yamaha 제품 사진 + 실습용 페이더)' }
  };
  var IMG_R = { 'img/modules/mg12xu_full.jpg': 1754 / 1862, 'img/modules/crown_xli1500.jpg': 1600 / 817, 'img/modules/ev_zxa1.jpg': 1160 / 900 };   // 사진 가로÷세로 (그 밖의 장비 사진은 1200×900)
  window.STA_IMG_CREDITS = IMG_CREDITS;   // 2026-10-23: 화면의 출처 줄은 없애고, 메뉴 맨 아래 「사진 출처」 창에서만 보여 줌(lessons/ui.js)
  function creditHtml() { return ''; }
  var view = { path: null, mod: null, tab: 'overview', fig: 'photo' }, sim = null, viewer = null, backTo = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pathById(id) { return PATHS.find(function (p) { return p.id === id; }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { /* 저장이 안 돼도 화면은 동작 */ } }
  function st(id) { var a = load(), s = a[id] || {}; s.checks = s.checks || {}; s.tasks = s.tasks || {}; s.quiz = s.quiz || {}; return s; }
  function put(id, s) { var a = load(); a[id] = s; save(a); }
  function okIdx(q) { for (var i = 0; i < q.options.length; i++) if (q.options[i].ok) return i; return -1; }
  function counts(m) {
    if (m.status !== 'ready') return null; var s = st(m.id);
    var learn = m.theory.filter(function (x, i) { return s.checks[i] === okIdx(x.check); }).length,
      prac = m.practice.tasks.filter(function (t) { return s.tasks[t.id]; }).length,
      quiz = m.quiz.filter(function (q, i) { return s.quiz[i] === okIdx(q); }).length;
    return { learn: learn, learnN: m.theory.length, prac: prac, pracN: m.practice.tasks.length, quiz: quiz, quizN: m.quiz.length,
      learnDone: learn === m.theory.length, pracDone: prac === m.practice.tasks.length, quizDone: quiz === m.quiz.length, opened: !!s.opened };
  }
  function status(m) {
    if (!m || m.status !== 'ready') return 'soon'; var c = counts(m);
    if (c.learnDone && c.pracDone && c.quizDone) return 'done';
    return (c.opened || c.learn || c.prac || c.quiz) ? 'doing' : 'new';
  }
  var STATUS_TXT = { done: '완료', doing: '진행 중', new: '시작 전', soon: '준비 중' };
  function lessonById(id) { return (window.STA_LESSONS || []).find(function (l) { return l.id === id; }); }
  function lessonDone(id) { try { var a = JSON.parse(localStorage.getItem('soundTrainerLessons_v1')) || {}; return !!(a[id] && a[id].done); } catch (e) { return false; } }
  function minutesTxt(n) { return n >= 60 ? '약 ' + (Math.round(n / 30) / 2) + '시간' : '약 ' + n + '분'; }
  function thumb(m) {
    var th = (window.STA_THUMBS || {})[m.id]; if (th) return '<img src="' + esc(th) + '" alt="" loading="lazy">';
    if (m.img) return '<img src="' + esc(m.img) + '" alt="" loading="lazy"' + (m.imgPos ? ' style="object-position:' + m.imgPos + '"' : '') + '>';
    var k = m.thumb || 'eq', art = {
      eq: '<path d="M20 120 C70 120 80 60 120 60 S170 105 210 92 S270 52 300 52" fill="none" stroke="#22d3ee" stroke-width="5"/>',
      gate: '<path d="M20 120 H90 V50 H220 V120 H300" fill="none" stroke="#22d3ee" stroke-width="5"/><path d="M20 112 H300" stroke="#94a3b8" stroke-dasharray="6 6"/>',
      comp: '<path d="M30 140 L140 60 L300 40" fill="none" stroke="#22d3ee" stroke-width="5"/><path d="M30 140 L300 0" stroke="#94a3b8" stroke-dasharray="6 6"/>',
      reverb: '<g fill="none" stroke="#22d3ee" stroke-width="4">' + [0, 1, 2, 3, 4].map(function (i) { return '<path d="M' + (60 + i * 46) + ' 140 V' + (40 + i * 18) + '" stroke-opacity="' + (1 - i * 0.17) + '"/>'; }).join('') + '</g>'
    }[k] || '';
    return '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="180" fill="#0d2340"/>' + art + '</svg>';
  }

  /* ------------------------------------------------------------- 홈: 전체 학습 과정 */
  function pathMeta(p) {
    if (!p.modules) return p.practice.length + '개 실습';
    var ms = p.modules.map(function (id) { return MODS[id]; }).filter(Boolean), mins = ms.reduce(function (a, m) { return a + (m.minutes || 0); }, 0);
    return ms.length + '개 과정' + (p.practice ? ' · 실습 ' + p.practice.length + '개' : '') + ' · ' + minutesTxt(mins);
  }
  function pathProgress(p) {
    if (!p.modules) return null;
    var ms = p.modules.map(function (id) { return MODS[id]; }).filter(Boolean);
    return { done: ms.filter(function (m) { return status(m) === 'done'; }).length, n: ms.length, ready: ms.filter(function (m) { return m.status === 'ready'; }).length };
  }
  function homeHtml() {
    return '<section class="home-sec mod-home" id="modHome"><div class="home-sec-head"><h2>전체 학습 과정</h2><span class="mod-home-sub">원하는 학습 경로를 선택하여 시작하세요.</span></div><div class="mod-pathcards">' +
      PATHS.map(function (p) {
        var pr = pathProgress(p);
        return '<button type="button" class="mod-pathcard" data-path="' + p.id + '"><span class="mod-pathcard__img"><img src="' + esc(p.img) + '" alt="" loading="lazy"></span>' +
          '<span class="mod-pathcard__body"><b>' + esc(p.title) + '</b><span>' + esc(p.sum) + '</span><em class="mod-pathcard__go">학습하기 →</em>' +
          '<small>' + esc(pathMeta(p)) + (pr ? ' · 완료 ' + pr.done + '/' + pr.n : '') + '</small></span></button>';
      }).join('') + '</div></section>';
  }

  /* ------------------------------------------------------------- 경로 화면 */
  function crumb(parts) { return '<nav class="lsn-crumb mod-crumb" aria-label="위치"><button type="button" data-modhome="1">홈</button><span>›</span><button type="button" data-modhome="paths">전체 학습 과정</button>' + parts.map(function (x) { return '<span>›</span>' + (x[1] ? '<button type="button" ' + x[1] + '>' + esc(x[0]) + '</button>' : '<b>' + esc(x[0]) + '</b>'); }).join('') + '</nav>'; }
  function modCard(m) {
    var s = status(m), soon = s === 'soon', c = counts(m);
    return '<button type="button" class="mod-card' + (soon ? ' soon' : '') + '" data-module="' + m.id + '"' + (soon ? ' aria-disabled="true"' : '') + '>' +
      '<span class="mod-card__thumb">' + thumb(m) + (s === 'done' || s === 'doing' ? '<i class="mod-flag ' + s + '">' + (s === 'done' ? '✓ 완료' : '진행 중') + '</i>' : '') + '</span>' +
      '<span class="mod-card__body"><b>' + String(m.no).padStart(2, '0') + '. ' + esc(m.title) + '</b><span class="mod-card__sub">' + esc(m.sub) + '</span>' +
      (soon && m.topics ? '<span class="mod-card__topics">' + m.topics.slice(0, 3).map(esc).join(' · ') + '…</span>' : '') +
      '<span class="mod-card__meta"><span class="home-tag' + (soon ? ' soon' : '') + '">' + (soon ? '준비 중' : esc(m.level)) + '</span><span>⏱ ' + minutesTxt(m.minutes) + '</span></span>' +
      (c ? '<span class="mod-card__prog" title="학습 · 실습 · 이해도">' + dot(c.learnDone, '학습') + dot(c.pracDone, '실습') + dot(c.quizDone, '이해도') + '</span>' : '') + '</span></button>';
  }
  function dot(on, t) { return '<span class="mod-dot' + (on ? ' on' : '') + '">' + (on ? '✓ ' : '') + t + '</span>'; }
  function renderPath() {
    var root = $('tabPath'), p = pathById(view.path); if (!root || !p) return;
    var pr = pathProgress(p);
    var h = crumb([[p.title]]) +
      '<section class="mod-phero"><div class="mod-phero__main"><div class="mod-phero__img"><img src="' + esc(p.img) + '" alt=""></div><div class="mod-phero__text"><span class="mod-badge">학습 경로</span><h1 id="modTitle">' + esc(p.title) + '</h1><p>' + esc(p.lead) + '</p>' +
      (pr ? '<div class="mod-phero__prog"><span>' + pr.done + ' / ' + pr.n + ' 완료</span><span class="mod-bar"><i style="width:' + Math.round(pr.done / pr.n * 100) + '%"></i></span><span>' + Math.round(pr.done / pr.n * 100) + '%</span></div>' : '') + '</div></div>' +
      '<aside class="mod-phero__side">' + (p.route ? '<div class="mod-side-box"><h3>학습 경로</h3><div class="mod-route">' + p.route.map(function (r, i) { return (i ? '<i>→</i>' : '') + '<span>' + esc(r) + '</span>'; }).join('') + '</div></div>' : '') +
      '<div class="mod-side-box tip"><h3>💡 추천 학습 순서</h3><p>' + esc(p.tip || '실습 카드를 차례로 열어 배운 것을 적용해 보세요.') + '</p>' +
        /* 2026-10-24: 따로 있던 「먼저 배울 것 (선수 학습)」 칸은 이 상자와 겹쳐서 빼고, 레슨 이름을 여기서 바로 열 수 있게 함 */
        (p.prereq ? '<div class="mod-prereq mod-prereq--tip">' + p.prereq.map(function (id) {
          var l = lessonById(id); if (!l) return ''; var ready = l.status === 'ready', d = lessonDone(id);
          return '<button type="button" class="mod-pre' + (d ? ' done' : '') + '" data-lesson="' + l.id + '"' + (ready ? '' : ' aria-disabled="true"') + '><b>' + (d ? '✓ ' : '📘 ') + esc(l.title) + '</b><span>' + (ready ? (d ? '완료' : '기초 이론 레슨 · 약 ' + l.minutes + '분') : '준비 중') + '</span></button>'; }).join('') + '</div>' : '') +
      '</div></aside></section>';
    if (p.modules) h += '<section class="home-sec"><div class="home-sec-head"><h2>' + esc(p.title) + ' 과정</h2><span class="mod-home-sub">' + (pr ? pr.ready + '개 과정을 지금 배울 수 있어요. 나머지는 같은 구조로 준비 중이에요.' : '') + '</span></div><div class="mod-cards">' + p.modules.map(function (id) { return MODS[id] ? modCard(MODS[id]) : ''; }).join('') + '</div></section>';
    if (p.practice && !p.modules) h += '<section class="home-sec"><div class="home-sec-head"><h2>' + esc(p.practiceTitle || '실습') + '</h2><span class="mod-home-sub">' + (p.modules ? '과정에서 배운 것을 실제 장비 화면에서 연습해요.' : '') + '</span></div><div class="home-cards">' + p.practice.map(function (tab) { var i = PRACTICE_INFO[tab];
      return '<button type="button" class="home-card" data-mgo-tab="' + tab + '"><div class="home-card__thumb">' + (i[2] ? '<img src="' + i[2] + '" alt="" loading="lazy">' : thumb({ thumb: 'eq' })) + '</div><div class="home-card__body"><div class="home-card__title">' + esc(i[0]) + '</div><div class="home-card__sum">' + esc(i[1]) + '</div><div class="home-card__meta"><span class="home-tag practice">실습</span></div></div></button>'; }).join('') + '</div></section>';
    h += creditHtml(p.img);
    root.innerHTML = h;
  }

  /* ------------------------------------------------------------- 모듈 화면 */
  function qHtml(q, qi, ans, kind) {
    var answered = ans != null;
    return '<div class="lsn-q mod-q" data-' + kind + '="' + qi + '"><b>' + (kind === 'mquiz' ? (qi + 1) + '. ' : '✔ 개념 체크 · ') + esc(q.q) + '</b><fieldset class="lsn-opts"><legend class="sr-only">' + esc(q.q) + '</legend>' +
      q.options.map(function (o, oi) {
        var cls = answered ? (o.ok ? ' ok' : (oi === ans ? ' no' : '')) : '';
        return '<label class="lsn-opt' + cls + '"><input type="radio" name="' + kind + qi + '" value="' + oi + '"' + (answered && oi === ans ? ' checked' : '') + '><span>' + esc(o.t) + (answered && (o.ok || oi === ans) ? '<span class="why">' + (o.ok ? '✓ ' : '✗ ') + esc(o.why) + '</span>' : '') + '</span></label>';
      }).join('') + '</fieldset><div class="lsn-qbar"><button type="button" class="lsn-check" data-' + kind + 'chk="' + qi + '"' + (answered ? '' : ' disabled') + '>' + (answered ? '다시 확인' : '확인') + '</button>' +
      (answered ? '<span class="lsn-fb ' + (q.options[ans] && q.options[ans].ok ? 'ok">정답입니다!' : 'no">다시 생각해 보세요') + '</span>' : '') + '</div></div>';
  }
  /* ------------------------------------------------------------- 2026-10-23 학습 화면(시안 2): 머리 · 장비 사진 설명 · 핵심 개념 */
  var MI = {   // 메뉴·카드와 같은 선 아이콘
    level: '<path d="M4 20V14M10 20V9M16 20V4"/>',
    time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    prac: '<path d="M8 5v14l11-7z"/>',
    ts: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5"/><path d="M14.5 6.5 17 4l3 3-2.5 2.5"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    dot: '<circle cx="12" cy="12" r="9"/>'
  };
  function mi(k) { return '<svg class="mod-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (MI[k] || '') + '</svg>'; }
  function tsLinked(m) { return (m.practice.links || []).concat(m.missions || []).some(function (x) { return x.go && x.go.tab === 'tab7'; }); }
  function metaHtml(m, c) {
    var n = (m.practice.links || []).length;
    return '<span class="mod-mi">' + mi('level') + esc(m.level) + '</span><span class="mod-mi">' + mi('time') + minutesTxt(m.minutes) + '</span>' +
      (n ? '<span class="mod-mi">' + mi('prac') + '실습 연동 ' + n + '</span>' : '') + (tsLinked(m) ? '<span class="mod-mi">' + mi('ts') + '트러블슈팅 연결</span>' : '') +
      dot(c.learnDone, '학습 ' + c.learn + '/' + c.learnN) + dot(c.pracDone, '실습 ' + c.prac + '/' + c.pracN) + dot(c.quizDone, '이해도 ' + c.quiz + '/' + c.quizN);
  }
  function progHtml(c) {
    var d = c.learn + c.prac + c.quiz, n = c.learnN + c.pracN + c.quizN, pct = n ? Math.round(d / n * 100) : 0;
    return '<div class="mod-top__bar"><span>학습 진행도 <b>' + d + ' / ' + n + '</b></span><span class="ui-bar"><i style="width:' + pct + '%"></i></span></div>' +
      '<div class="ui-ring ui-ring--light" style="--p:' + pct + '" role="img" aria-label="학습 진행도 ' + pct + '퍼센트"><span>' + pct + '%</span></div>';
  }
  function updateHead(m, c) {   // 문제를 맞힐 때 머리(메타·진행도)만 새로
    var meta = document.querySelector('#tabModule .mod-head__meta'); if (meta) meta.innerHTML = metaHtml(m, c);
    var pr = document.querySelector('#tabModule .mod-top__prog'); if (pr) pr.innerHTML = progHtml(c);
  }
  /* 장비 사진 + 설명 상자. 상자 위치는 그림 틀(16:10) 기준, 점 위치는 사진 기준(0~1) */
  var FIG_A = 1.6;
  function figHtml(m) {
    var h = (GL[m.id] || {}).hero, d3 = MODEL3D[m.overview.model], is3d = view.fig === '3d' && d3;
    var tools = d3 ? '<div class="mod-fig__tools" role="group" aria-label="보기 방식"><button type="button" data-mfig="photo" aria-pressed="' + !is3d + '">사진 설명</button><button type="button" data-mfig="3d" aria-pressed="' + !!is3d + '">3D 로 돌려 보기</button></div>' : '';
    if (is3d) return '<figure class="mod-fig mod-fig--3d"><div class="mod-viewer" data-role="viewer"><div class="mod-viewer__msg">3D 모델을 불러오는 중…</div></div>' +
      '<figcaption class="mod-fig__foot mod-viewer__bar">' + tools + '<span>끌어서 돌려 보기 · ' + esc(d3.label) + '</span>' + (d3.toggle ? '<button type="button" class="sim-btn" data-mviewer="switch">' + esc(d3.toggleTxt) + '</button>' : '') + '</figcaption></figure>';
    if (h && h.vis && VIS[h.vis]) return '<figure class="mod-fig mod-fig--vis"><div class="mod-visual">' + VIS[h.vis]() + '</div>' + (tools ? '<div class="mod-fig__foot">' + tools + '</div>' : '') + '</figure>';
    var img = (h && h.img) || m.img; if (!img) return '';
    var v = (h && h.view) || [0.5, 0, 1], r = IMG_R[img] || 4 / 3, k = r / (v[2] * FIG_A), pts = (h && h.pts) || [];
    var lines = '', marks = '', labels = '', legend = '';
    pts.forEach(function (p, i) {
      var fx = 0.5 + (p[0] - v[0]) * k, fy = (p[1] - v[1]) / v[2], left = p[2] === 'l', ax = left ? 0.215 : 0.785, n = i + 1;
      lines += '<line x1="' + (ax * 1600).toFixed(1) + '" y1="' + (p[3] * 1000).toFixed(1) + '" x2="' + (fx * 1600).toFixed(1) + '" y2="' + (fy * 1000).toFixed(1) + '"/>';
      marks += '<span class="mod-fig__pt" style="left:' + (fx * 100).toFixed(2) + '%;top:' + (fy * 100).toFixed(2) + '%">' + n + '</span>';
      labels += '<div class="mod-fig__lb ' + (left ? 'l' : 'r') + '" style="top:' + (p[3] * 100).toFixed(1) + '%"><b><i>' + n + '</i>' + esc(p[4]) + '</b><span>' + esc(p[5]) + '</span></div>';
      legend += '<li><b>' + esc(p[4]) + '</b> — ' + esc(p[5]) + '</li>';
    });
    return '<figure class="mod-fig" style="--fig-bg:' + esc((h && h.bg) || '#0b1626') + '">' +
      '<div class="mod-fig__stage"><img src="' + esc(img) + '" alt="' + esc(m.title) + ' 장비 사진" style="height:' + (100 / v[2]).toFixed(2) + '%;top:' + (-v[1] / v[2] * 100).toFixed(2) + '%;left:' + ((0.5 - v[0] * k) * 100).toFixed(2) + '%">' +
      (pts.length ? '<svg class="mod-fig__lines" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true">' + lines + '</svg>' + marks + labels : '') + '</div>' +
      (pts.length ? '<ol class="mod-fig__legend">' + legend + '</ol>' : '') + (tools ? '<div class="mod-fig__foot">' + tools + '</div>' : '') + '</figure>';
  }
  function heroHtml(m) {
    var s = st(m.id);
    return '<section class="mod-hero" aria-label="장비 살펴보기와 핵심 학습 포인트">' + figHtml(m) +
      '<aside class="mod-learn"><h2>핵심 학습 포인트</h2><ul>' + m.theory.map(function (x, i) { var ok = s.checks[i] === okIdx(x.check);
        return '<li><button type="button" data-mtheory="' + i + '" class="' + (ok ? 'ok' : '') + '">' + mi(ok ? 'check' : 'dot') + '<span>' + esc(x.title) + '</span></button></li>'; }).join('') +
      '</ul><button type="button" class="ui-btn ui-btn--secondary ui-btn--block" data-mtab="theory">자세히 보기 · 이론 학습</button></aside></section>';
  }
  function tabOverview(m) {
    var o = m.overview, g = (GL[m.id] || {}), h = g.hero || {}, links = m.practice.links || [];
    var showVis = VIS[o.model] && !(h.vis === o.model);
    return '<div class="mod-ov"><div class="mod-ov__main"><section class="mod-box mod-concept"><h2 class="mod-box__h">' + mi('bulb') + '핵심 개념</h2><div class="mod-lead mod-paras">' + paras(o.lead) + '</div>' +
      (g.glance ? '<div class="mod-glance" aria-label="한눈에 보기"><h3>한눈에 보기</h3><dl>' + g.glance.map(function (x) { return '<div class="mod-gl"><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl></div>' : '') +
      '<h3 class="mod-h3">주요 용어 <small>눌러서 뜻 보기</small></h3><div class="mod-terms">' + o.terms.map(function (t2) { return '<details class="mod-term"><summary>' + esc(t2[0]) + '</summary><p>' + esc(t2[1]) + '</p></details>'; }).join('') + '</div>' +
      (showVis ? '<div class="mod-visual">' + VIS[o.model]() + '</div>' : '') + '</section></div>' +
      '<aside class="mod-ov__side">' + (links.length ? '<section class="mod-box mod-go"><h2 class="mod-box__h">관련 실습 바로가기</h2>' + links.map(function (x, i) { var info = PRACTICE_INFO[x.go && x.go.tab] || [], th = info[2];
        return '<div class="mod-go__it"><span class="mod-go__th">' + (th ? '<img src="' + esc(th) + '" alt="" loading="lazy">' : '') + '</span><div><b>' + esc(x.title) + '</b>' + (x.text ? '<p>' + esc(x.text) + '</p>' : '') +
          '<button type="button" class="ui-btn ' + (i ? 'ui-btn--secondary' : 'ui-btn--primary') + ' ui-btn--sm" data-mgo="practice:' + i + '">실습 시작하기 →</button></div></div>'; }).join('') + '</section>' : '') +
      '<div class="lsn-points mod-points"><h4>기억할 점</h4><ul>' + o.points.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></aside></div>' +
      '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="theory">이론 학습 시작 →</button></div>';
  }
  function tabTheory(m) {
    var s = st(m.id), c = counts(m);
    return '<div class="mod-progline">' + (c.learnDone ? '<span class="mod-okline">🎉 개념 체크를 모두 맞혀 <b>학습 완료</b>했어요.</span>' : '각 주제 끝의 <b>개념 체크</b>를 모두 맞히면 학습 완료예요. (지금 ' + c.learn + '/' + c.learnN + ')') + '</div>' +
      m.theory.map(function (x, i) {
        var ok = s.checks[i] === okIdx(x.check);
        return '<section class="mod-sec" id="modSec' + i + '"><h2 class="mod-sec__h"><span class="lsn-num">' + (i + 1) + '</span>' + esc(x.title) + (ok ? '<span class="mod-tick">✓</span>' : '') + '</h2>' +
          (x.visual && VIS[x.visual] ? '<div class="mod-visual">' + VIS[x.visual]() + '</div>' : '') + '<div class="mod-p mod-paras">' + paras(x.body) + '</div>' +
          (x.more ? '<details class="mod-more"><summary>더 알아보기</summary><div>' + x.more + '</div></details>' : '') +
          qHtml(x.check, i, s.checks[i], 'mcheck') + '</section>';
      }).join('') + '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="practice">실습하기 →</button></div>';
  }
  function tabPractice(m) {
    var p = m.practice, s = st(m.id), c = counts(m);
    return '<div class="mod-lead mod-paras">' + paras(esc(p.lead)) + '</div><div class="mod-simwrap"><div class="mod-sim" data-role="sim"></div>' +
      '<aside class="mod-tasks"><h3>실습 과제 <small>' + c.prac + '/' + c.pracN + '</small></h3><ol>' + p.tasks.map(function (t2) { var d = !!s.tasks[t2.id];
        return '<li class="' + (d ? 'done' : '') + '" data-task="' + t2.id + '"><span class="mod-task__ck">' + (d ? '✓' : '') + '</span><div><b>' + esc(t2.title) + '</b><p>' + esc(t2.text) + '</p></div></li>'; }).join('') + '</ol>' +
      (c.pracDone ? '<div class="mod-okline">🎉 실습 과제를 모두 마쳤어요. <b>실습 완료</b>!</div>' : '<p class="mod-small">과제는 실습 화면의 상태로 자동 확인돼요. 버튼을 누르기만 해서는 완료되지 않아요.</p>') + '</aside></div>' +
      '<p class="mod-note">⚠️ ' + esc(p.note) + '</p>' +
      '<h3 class="mod-h3">이어서 해 볼 실습</h3><div class="mod-links">' + p.links.map(function (l, i) { return '<button type="button" class="mod-link" data-mgo="practice:' + i + '"><b>' + esc(l.title) + '</b><span>' + esc(l.text) + '</span><em>열기 →</em></button>'; }).join('') + '</div>' +
      '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="quiz">확인 문제 풀기 →</button></div>';
  }
  function tabQuiz(m) {
    var s = st(m.id), c = counts(m);
    return '<div class="mod-progline">' + (c.quizDone ? '<span class="mod-okline">🎉 확인 문제를 모두 맞혔어요. <b>이해도 확인</b> 완료!</span>' : c.quizN + '문제를 모두 맞히면 이해도 확인이 완료돼요. (지금 ' + c.quiz + '/' + c.quizN + ')') +
      (!c.pracDone ? '<br><small>실습을 먼저 해 보면 더 쉽게 풀 수 있어요.</small>' : '') + '</div>' +
      m.quiz.map(function (q, i) { return qHtml(q, i, s.quiz[i], 'mquiz'); }).join('') +
      '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="missions">관련 미션 보기 →</button></div>';
  }
  function tabMissions(m) {
    return '<p class="mod-lead">배운 원리를 실제 문제 상황에 적용해 보세요.</p><div class="mod-links">' + m.missions.map(function (x, i) { return '<button type="button" class="mod-link mission" data-mgo="missions:' + i + '"><b>🎯 ' + esc(x.title) + '</b><span>' + esc(x.text) + '</span><em>미션 열기 →</em></button>'; }).join('') + '</div>' +
      '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="deeper">심화 학습 →</button></div>';
  }
  /* 2026-10-23 가독성: 긴 글을 문장마다 줄을 바꿔 보여 줌(태그 안에서는 자르지 않음) */
  function paras(h) {
    h = String(h || ''); var out = [], cur = '', depth = 0;
    for (var i = 0; i < h.length; i++) {
      var ch = h[i];
      if (ch === '<') { var end = h.indexOf('>', i); if (end < 0) { cur += h.slice(i); break; } var tag = h.slice(i, end + 1); cur += tag; i = end; if (!/\/>$/.test(tag) && !/^<br/i.test(tag)) depth += tag[1] === '/' ? -1 : 1; continue; }
      cur += ch;
      if (depth <= 0 && /[.!?]/.test(ch) && h[i + 1] === ' ' && /[요다죠까]$/.test(cur.slice(0, -1))) { out.push(cur.trim()); cur = ''; }
    }
    if (cur.trim()) out.push(cur.trim());
    return out.map(function (x) { return '<p>' + x + '</p>'; }).join('');
  }
  function rich(x) { return /<\/?(b|ul|li|br|i|small)\b/.test(x || '') ? x : esc(x); }   // 2026-10-23: 데이터에 <b>·<ul> 이 있으면 그대로
  function tabDeeper(m) {
    var p = pathById(m.path), ids = p.modules, i = ids.indexOf(m.id), next = ids.slice(i + 1).map(function (id) { return MODS[id]; }).find(function (x) { return x && x.status === 'ready'; });
    return '<div class="lsn-deep">' + m.deeper.map(function (d) { return '<div class="lsn-deep-item"><b>' + esc(d.title) + '</b><p>' + rich(d.text) + '</p>' + (d.more ? '<details><summary>자세히 보기</summary><div>' + rich(d.more) + '</div></details>' : '') + '</div>'; }).join('') + '</div>' +
      
      '<div class="mod-next">' + (next ? '<button type="button" class="btn mod-cta" data-module="' + next.id + '">다음 과정: ' + esc(next.title) + ' →</button>' : '<button type="button" class="btn mod-cta" data-path="' + p.id + '">' + esc(p.title) + ' 과정 목록 →</button>') + '</div>';
  }
  function renderModule() {
    var root = $('tabModule'), m = MODS[view.mod]; if (!root || !m) return;
    destroySim(); destroyViewer();
    var p = pathById(m.path), c = counts(m), s = status(m), tab = view.tab;
    var body = { overview: tabOverview, theory: tabTheory, practice: tabPractice, quiz: tabQuiz, missions: tabMissions, deeper: tabDeeper }[tab](m);
    /* 2026-10-23: 왼쪽 과정 목록은 사이드 메뉴로 옮김. 머리(제목·정보·진행도) → [핵심 개념 탭] 장비 사진 + 핵심 학습 포인트 → 단계 탭 → 내용 */
    root.innerHTML = crumb([[p.title, 'data-path="' + p.id + '"'], [String(m.no).padStart(2, '0') + '. ' + m.title]]) +
      '<div class="mod-page"><header class="mod-head mod-top"><div class="mod-top__main"><div class="mod-top__title"><h1 id="modTitle">' + String(m.no).padStart(2, '0') + '. ' + esc(m.title) + ' <span class="mod-st ' + s + '">' + STATUS_TXT[s] + '</span></h1><button type="button" class="mod-pathtag" data-path="' + p.id + '">' + esc(p.title) + '</button></div>' +
        '<p class="mod-top__sub">' + esc(m.sub) + '</p><div class="mod-head__meta">' + metaHtml(m, c) + '</div>' +
        (m.prereq ? '<div class="mod-head__pre">먼저 볼 레슨: ' + m.prereq.map(function (id) { var l = lessonById(id); return l ? '<button type="button" class="lsn-theory-link" data-lesson="' + id + '">' + (lessonDone(id) ? '✓ ' : '📘 ') + esc(l.title) + '</button>' : ''; }).join('') + '</div>' : '') +
        '</div><div class="mod-top__prog">' + progHtml(c) + '</div></header>' +
        (tab === 'overview' ? heroHtml(m) : '') +
        '<div class="mod-tabs" role="tablist" aria-label="학습 단계">' + TABS.map(function (t2, i) { var done = (t2[0] === 'theory' && c.learnDone) || (t2[0] === 'practice' && c.pracDone) || (t2[0] === 'quiz' && c.quizDone);
          return '<button type="button" role="tab" class="mod-tab' + (done ? ' done' : '') + '" data-mtab="' + t2[0] + '" aria-selected="' + (t2[0] === tab) + '"><span class="n">' + (done ? '✓' : i + 1) + '</span>' + t2[1] + '</button>'; }).join('') + '</div>' +
        '<div class="mod-body" data-tab="' + tab + '">' + body + '</div></div>';
    if (tab === 'practice') mountSim(m);
    if (tab === 'overview' && view.fig === '3d' && MODEL3D[m.overview.model]) mountViewer(MODEL3D[m.overview.model]);
    markHomeNav();
  }
  function refreshHead() { var m = MODS[view.mod]; if (!m) return; var y = window.scrollY; var keepSim = sim; if (view.tab === 'practice' && keepSim) { // 실습 중에는 실습 화면을 다시 만들지 않고 과제 목록·머리만 새로
      var s = st(m.id), c = counts(m); document.querySelectorAll('#tabModule .mod-tasks li').forEach(function (li) { var d = !!s.tasks[li.getAttribute('data-task')]; li.classList.toggle('done', d); li.querySelector('.mod-task__ck').textContent = d ? '✓' : ''; });
      var h3 = document.querySelector('#tabModule .mod-tasks h3 small'); if (h3) h3.textContent = c.prac + '/' + c.pracN;
      updateHead(m, c);
      var tb = document.querySelector('#tabModule .mod-tab[data-mtab=practice]'); if (tb && c.pracDone) { tb.classList.add('done'); tb.querySelector('.n').textContent = '✓'; }
      var tasks = document.querySelector('#tabModule .mod-tasks'); if (tasks && c.pracDone && !tasks.querySelector('.mod-okline')) { var sm = tasks.querySelector('.mod-small'); if (sm) sm.outerHTML = '<div class="mod-okline">🎉 실습 과제를 모두 마쳤어요. <b>실습 완료</b>!</div>'; }
      return; }
    renderModule(); window.scrollTo(0, y); }
  function mountSim(m) {
    var el = document.querySelector('#tabModule [data-role=sim]'); if (!el) return;
    var fn = SIMS[m.practice.kind]; if (!fn) { el.innerHTML = '<p class="mod-note">실습 화면을 불러오지 못했어요.</p>'; return; }
    sim = fn(el, { onTask: function (id) { var s = st(m.id); if (s.tasks[id]) return; s.tasks[id] = true; put(m.id, s); refreshHead(); } });
  }
  function destroySim() { if (sim) { try { sim.destroy(); } catch (e) { /* noop */ } sim = null; } }
  /* 학습 개요의 3D 장비 보기 — 사이트의 3D 모델 파일(assets3d/*_model.js)을 그대로 씀. dir = 카메라 방향 */
  var MODEL3D = {
    sm58: { label: '3D 모델(Shure SM58S)', need: 'ShureSM58', dir: [0.5, 0.25, 1], toggleTxt: '스위치 ON/OFF',
      make: function () { var m = ShureSM58.create({ variant: 'SM58S' }); m.rotation.z = -0.5; ShureSM58.setSwitch(m, true); return m; }, toggle: function (m, on) { ShureSM58.setSwitch(m, on); } },
    xlr: { label: '3D 모델(XLR 암·수 플러그)', need: 'XlrCable', dir: [0.35, 0.3, 1],
      make: function () { var g = new THREE.Group(), f = XlrCable.buildPlug('female'), m = XlrCable.buildPlug('male'); f.rotation.y = Math.PI; m.rotation.y = Math.PI; f.position.x = -0.018; m.position.x = 0.018; g.add(f, m); g.rotation.x = 0.25; return g; } },
    speakon: { label: '3D 모델(speakON 케이블 커넥터)', need: 'SpeakonCable', dir: [0.35, 0.3, 1],
      make: function () { var g = new THREE.Group(), a = SpeakonCable.buildPlug(null, 'plugA'); a.rotation.y = Math.PI; g.add(a); g.rotation.x = 0.25; return g; } },
    mg12xu: { label: '3D 모델(Yamaha MG12XU)', need: 'YamahaMG12XU', dir: [0.15, 1.1, 1], make: function () { return YamahaMG12XU.create(); } },
    crown: { label: '3D 모델(Crown XLi1500)', need: 'CrownXLi1500', dir: [0.45, 0.35, 1], make: function () { return CrownXLi1500.create(); } },
    zxa1: { label: '3D 모델(EV ZXA1)', need: 'EvZXA1', dir: [0.5, 0.2, 1], make: function () { return EvZXA1.create(); } }
  };
  function mountViewer(def) {
    var el = document.querySelector('#tabModule [data-role=viewer]'); if (!el) return;
    if (!window.THREE || !window[def.need] || !THREE.OrbitControls) { el.querySelector('.mod-viewer__msg').textContent = '3D 모델을 불러오지 못했어요.'; return; }
    var w = el.clientWidth || 360, h = el.clientHeight || 300, r;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { el.querySelector('.mod-viewer__msg').textContent = '이 기기에서는 3D 를 표시할 수 없어요.'; return; }
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(w, h); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.2;
    var obj; try { obj = def.make(); } catch (e) { el.querySelector('.mod-viewer__msg').textContent = '3D 모델을 만들지 못했어요.'; r.dispose(); return; }
    el.innerHTML = ''; el.appendChild(r.domElement);
    var sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xdfeaff, 0x1a2333, 0.9)); var k = new THREE.DirectionalLight(0xffffff, 2); k.position.set(2, 3, 3); sc.add(k); var rim = new THREE.DirectionalLight(0x7cc4ff, 1.4); rim.position.set(-3, 2, -2); sc.add(rim);
    sc.add(obj);
    var bb = new THREE.Box3().setFromObject(obj), ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()).length();
    var cam = new THREE.PerspectiveCamera(32, w / h, sz * 0.01, sz * 20); cam.position.copy(ctr).add(new THREE.Vector3(def.dir[0], def.dir[1], def.dir[2]).normalize().multiplyScalar(sz * 1.6));
    var ctl = new THREE.OrbitControls(cam, r.domElement); ctl.target.copy(ctr); ctl.enableDamping = true; ctl.autoRotate = true; ctl.autoRotateSpeed = 1.6; ctl.enablePan = false; ctl.minDistance = sz * 0.6; ctl.maxDistance = sz * 3; ctl.update();
    var on = true, alive = true;
    r.domElement.addEventListener('pointerdown', function () { ctl.autoRotate = false; });
    (function loop() { if (!alive) return; requestAnimationFrame(loop); var tabEl = $('tabModule'); if (!tabEl || !tabEl.classList.contains('active')) return; ctl.update(); r.render(sc, cam); })();
    viewer = { toggle: function () { on = !on; if (def.toggle) def.toggle(obj, on); return on; }, destroy: function () { alive = false; sc.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); r.dispose(); }, isOn: function () { return on; }, object: obj };
  }
  function destroyViewer() { if (viewer) { try { viewer.destroy(); } catch (e) { /* noop */ } viewer = null; } }

  /* ------------------------------------------------------------- 이동 */
  /* 메뉴: 경로 묶음 머리 → (2026-10-23) 그 경로의 과정 01~05 → 「실습」 → 실습 탭 */
  var NAV_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 7.5v9l7.5-4.5z"/></svg>',
    NAV_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 12.5l3.2 3.2L17 9"/></svg>';   // 메뉴 과정 동그라미: 재생(시작 전·진행 중) / 체크(완료)
  function markHomeNav() {
    var act = document.querySelector('.tab-content.active'), pid = null, onMod = act && act.id === 'tabModule' && MODS[view.mod];
    if (act && act.id === 'tabPath') pid = view.path; else if (onMod) pid = MODS[view.mod].path;
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', pid ? false : b.dataset.tab === 'tabHome'); });
    document.querySelectorAll('.tab-group').forEach(function (g) { var me = g.getAttribute('data-navpath') === pid; g.classList.toggle('active', me && !onMod); g.classList.toggle('in', !!(me && onMod)); });
    document.querySelectorAll('.nav-mod').forEach(function (b) { var id = b.getAttribute('data-module'), on = !!(onMod && id === view.mod);
      b.classList.toggle('active', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      var sx = status(MODS[id]); b.classList.toggle('done', sx === 'done'); var n = b.querySelector('.nav-mod__n'); if (n) n.innerHTML = sx === 'done' ? NAV_OK : NAV_PLAY; });
  }
  function syncGroups() { var act = document.querySelector('.tab-content.active'); if (!act || act.id === 'tabPath' || act.id === 'tabModule') return; var tabId = act.id;
    document.querySelectorAll('.nav-mod').forEach(function (b) { b.classList.remove('active'); b.removeAttribute('aria-current'); });
    document.querySelectorAll('.tab-group').forEach(function (g) { g.classList.remove('active'); g.classList.toggle('in', !!PATHS.find(function (p) { return p.id === g.getAttribute('data-navpath') && (p.practice || []).indexOf(tabId) >= 0; })); }); }
  function buildNav() {
    var nav = document.querySelector('.site-header .tab-nav'); if (!nav || nav.querySelector('.tab-group')) return;
    var ico = { hardware: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>', mixing: '<path d="M6 4v16M12 4v16M18 4v16"/><rect x="4" y="13" width="4" height="3"/><rect x="10" y="7" width="4" height="3"/><rect x="16" y="11" width="4" height="3"/>', field: '<path d="M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>' };
    PATHS.forEach(function (p) {
      var g = document.createElement('button'); g.type = 'button'; g.className = 'tab-group'; g.setAttribute('data-navpath', p.id);
      g.innerHTML = '<svg class="tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ico[p.id] || '') + '</svg><span>' + esc(p.title) + '</span>';
      g.addEventListener('click', function () { openPath(p.id); });
      nav.appendChild(g);
      (p.modules || []).forEach(function (id) { var m = MODS[id]; if (!m || m.status !== 'ready') return;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'nav-mod'; b.setAttribute('data-module', id);
        b.innerHTML = '<span class="nav-mod__n" aria-hidden="true">' + NAV_PLAY + '</span><span>' + String(m.no).padStart(2, '0') + '. ' + esc(m.title) + '</span>';
        nav.appendChild(b); });
      if (p.modules && p.practice && p.practice.length) { var lb = document.createElement('div'); lb.className = 'nav-sublabel'; lb.setAttribute('aria-hidden', 'true'); lb.textContent = '실습'; nav.appendChild(lb); }
      (p.practice || []).forEach(function (tab) { var b = nav.querySelector('.tab-btn[data-tab="' + tab + '"]'); if (b) { b.classList.add('tab-sub'); nav.appendChild(b); } });
    });
    nav.querySelectorAll('.tab-btn').forEach(function (b) { if (!b.classList.contains('tab-sub') && b.dataset.tab !== 'tabHome' && b.dataset.tab !== 'tabIntro') nav.appendChild(b); });
    var intro = nav.querySelector('.tab-btn[data-tab="tabIntro"]'), g1 = nav.querySelector('.tab-group'); if (intro && g1) nav.insertBefore(intro, g1);   // 2026-10-22: 「음향의 중요성」은 홈 바로 다음, 맨 앞
  }
  function switchTo(id) { if (typeof switchTab === 'function') switchTab(id); markHomeNav(); try { window.scrollTo(0, 0); } catch (e) { /* noop */ } }
  function openPath(id) { if (!pathById(id)) return; view.path = id; hideBack(); destroySim(); destroyViewer(); switchTo('tabPath'); renderPath(); setHash('path-' + id); focusTitle(); }
  function openModule(id, tab, find) {
    var m = MODS[id]; if (!m || m.status !== 'ready') return;
    if (view.mod !== id) view.fig = 'photo';
    view.mod = id; view.path = m.path; view.tab = tab && TABS.some(function (t2) { return t2[0] === tab; }) ? tab : 'overview';
    var s = st(id); if (!s.opened) { s.opened = true; put(id, s); }
    hideBack(); switchTo('tabModule'); renderModule(); setHash('module-' + id + (view.tab !== 'overview' ? '-' + view.tab : '')); focusTitle();
    if (find && view.tab === 'theory') { var sec = Array.prototype.find.call(document.querySelectorAll('#tabModule .mod-sec'), function (x) { return x.querySelector('.mod-sec__h').textContent.indexOf(find) >= 0; });
      if (sec) setTimeout(function () { sec.scrollIntoView({ block: 'start', behavior: 'smooth' }); sec.classList.add('mod-sec--focus'); setTimeout(function () { sec.classList.remove('mod-sec--focus'); }, 2200); }, 80); }
  }
  function setTab(tab) { view.tab = tab; renderModule(); setHash('module-' + view.mod + (tab !== 'overview' ? '-' + tab : '')); var tb = document.querySelector('#tabModule .mod-tabs'); if (tb && tb.getBoundingClientRect().top < 0) tb.scrollIntoView({ block: 'start' }); }
  function focusTitle() { var t2 = $('modTitle'); if (t2) { t2.setAttribute('tabindex', '-1'); try { t2.focus({ preventScroll: true }); } catch (e) { /* noop */ } } }
  var hashLock = false;
  function setHash(h) { if (window.STAHistory) { STAHistory.record(); return; } hashLock = true; try { history.replaceState(null, '', '#' + h); } catch (e) { location.hash = h; } setTimeout(function () { hashLock = false; }, 0); }
  function fromHash() {
    var h = location.hash || '', m;
    if ((m = /^#path-([\w-]+)$/.exec(h))) { openPath(m[1]); return true; }
    if ((m = /^#module-([\w-]+?)(?:-(overview|theory|practice|quiz|missions|deeper))?$/.exec(h))) { openModule(m[1], m[2]); return true; }
    return false;
  }
  function showBack() {
    var b = $('modBack'); if (!b) { b = document.createElement('button'); b.type = 'button'; b.id = 'modBack'; b.className = 'lsn-back mod-back'; document.body.appendChild(b); }
    var m = MODS[view.mod]; if (!m) return; backTo = { id: m.id, tab: view.tab }; b.textContent = '📘 「' + m.title + '」 모듈로 돌아가기'; b.hidden = false;
  }
  function hideBack() { var b = $('modBack'); if (b) b.hidden = true; }
  function go(goObj) { if (!goObj) return; destroySim(); destroyViewer(); if (goObj.tab && window.STALessons && STALessons.openPractice) { STALessons.openPractice(goObj); var lb = $('lsnBack'); if (lb) lb.hidden = true; showBack(); } }
  /* ------------------------------------------------------------- 이벤트 */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var pc = t.closest('#tabHome [data-path], #tabPath [data-path], #tabModule [data-path]'); if (pc && !pc.closest('[aria-disabled="true"]')) { openPath(pc.getAttribute('data-path')); return; }
    var mc = t.closest('[data-module]'); if (mc) { if (mc.getAttribute('aria-disabled') === 'true') return; openModule(mc.getAttribute('data-module')); return; }
    if (t.closest('#modBack')) { if (backTo) openModule(backTo.id, backTo.tab); return; }
    var hm = t.closest('[data-modhome]'); if (hm) { hideBack(); destroySim(); destroyViewer(); if (window.STALessons) STALessons.home(); if (hm.getAttribute('data-modhome') === 'paths') setTimeout(function () { var s = $('modHome'); if (s) s.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 50); if (!window.STAHistory) { try { history.replaceState(null, '', location.pathname + location.search); } catch (err) { /* noop */ } } return; }
    var gt = t.closest('[data-mgo-tab]'); if (gt) { if (typeof switchTab === 'function') switchTab(gt.getAttribute('data-mgo-tab')); window.scrollTo(0, 0); return; }
    if (!t.closest('#tabModule')) return;
    var tb = t.closest('[data-mtab]'); if (tb) { setTab(tb.getAttribute('data-mtab')); return; }
    var th = t.closest('[data-mtheory]'); if (th) { var ti = +th.getAttribute('data-mtheory'); setTab('theory'); var sec = $('modSec' + ti); if (sec) { sec.scrollIntoView({ block: 'start', behavior: 'smooth' }); sec.classList.add('mod-sec--focus'); setTimeout(function () { sec.classList.remove('mod-sec--focus'); }, 2200); } return; }
    var fg = t.closest('[data-mfig]'); if (fg) { var y0 = window.scrollY; view.fig = fg.getAttribute('data-mfig') === '3d' ? '3d' : 'photo'; renderModule(); window.scrollTo(0, y0); return; }
    var mg = t.closest('[data-mgo]'); if (mg) { var pr = mg.getAttribute('data-mgo').split(':'), m = MODS[view.mod]; var item = pr[0] === 'practice' ? m.practice.links[+pr[1]] : m.missions[+pr[1]]; showBack(); go(item.go); return; }
    var vw = t.closest('[data-mviewer]'); if (vw && viewer) { var on = viewer.toggle(); vw.textContent = on ? '스위치 ON/OFF (지금 켜짐)' : '스위치 ON/OFF (지금 꺼짐)'; return; }
    var ck = t.closest('[data-mcheckchk],[data-mquizchk]');
    if (ck) {
      var kind = ck.hasAttribute('data-mcheckchk') ? 'mcheck' : 'mquiz', qi = +ck.getAttribute('data-' + kind + 'chk'), sel = document.querySelector('#tabModule input[name="' + kind + qi + '"]:checked'); if (!sel) return;
      var mm = MODS[view.mod], s = st(mm.id); (kind === 'mcheck' ? s.checks : s.quiz)[qi] = +sel.value; put(mm.id, s);
      var q = kind === 'mcheck' ? mm.theory[qi].check : mm.quiz[qi], box = ck.closest('.mod-q'); box.outerHTML = qHtml(q, qi, +sel.value, kind);
      var c = counts(mm), wasDone = kind === 'mcheck' ? c.learnDone : c.quizDone;
      var y = window.scrollY; if (wasDone) { renderModule(); window.scrollTo(0, y); var fb = document.querySelector('#tabModule .mod-okline'); if (fb) fb.setAttribute('role', 'status'); }
      else { var pl = document.querySelector('#tabModule .mod-progline'); if (pl) pl.innerHTML = kind === 'mcheck' ? '각 주제 끝의 <b>개념 체크</b>를 모두 맞히면 학습 완료예요. (지금 ' + c.learn + '/' + c.learnN + ')' : c.quizN + '문제를 모두 맞히면 이해도 확인이 완료돼요. (지금 ' + c.quiz + '/' + c.quizN + ')';
        updateHead(mm, c);
        if (kind === 'mcheck') { var sec = document.getElementById('modSec' + qi), h2 = sec && sec.querySelector('.mod-sec__h'); if (h2 && s.checks[qi] === okIdx(q) && !h2.querySelector('.mod-tick')) h2.insertAdjacentHTML('beforeend', '<span class="mod-tick">✓</span>'); } }
      return;
    }
  });
  document.addEventListener('change', function (e) {
    var r = e.target; if (!r || !r.name || !/^(mcheck|mquiz)\d+$/.test(r.name)) return;
    var kind = /^mcheck/.test(r.name) ? 'mcheck' : 'mquiz', qi = r.name.replace(kind, ''), btn = document.querySelector('#tabModule [data-' + kind + 'chk="' + qi + '"]');
    if (btn) { btn.disabled = false; btn.textContent = '확인'; }
    var q = r.closest('.mod-q'); if (q) { q.querySelectorAll('.lsn-opt').forEach(function (o) { o.classList.remove('ok', 'no'); var w = o.querySelector('.why'); if (w) w.remove(); }); var fb = q.querySelector('.lsn-fb'); if (fb) fb.remove(); }
  });
  function onTabChange() {
    var mod = $('tabModule'), path = $('tabPath');
    if ((mod && mod.classList.contains('active')) || (path && path.classList.contains('active'))) { markHomeNav(); hideBack(); }
    else { syncGroups(); destroyViewer(); if (sim && !(mod && mod.classList.contains('active'))) { /* 실습 화면 소리 정리 */ destroySim(); } }
  }
  function init() {
    if (!$('tabPath') || !$('tabModule')) return;
    buildNav();
    if (window.MutationObserver) document.querySelectorAll('.tab-content').forEach(function (el) { new MutationObserver(function () { syncGroups(); }).observe(el, { attributes: true, attributeFilter: ['class'] }); });
    if (window.MutationObserver) ['tabModule', 'tabPath', 'tabHome'].forEach(function (id) { var el = $(id); if (el) new MutationObserver(function (ms) { if (ms.some(function (x) { return x.attributeName === 'class'; })) onTabChange(); }).observe(el, { attributes: true, attributeFilter: ['class'] }); });
    fromHash();
    window.addEventListener('hashchange', function () { if (!hashLock) fromHash(); });
  }
  window.STAModules = { homeHtml: homeHtml, openPath: openPath, openModule: openModule, setTab: setTab, state: function (id) { return st(id); }, counts: function (id) { return counts(MODS[id]); }, status: function (id) { return status(MODS[id]); },
    reset: function () { save({}); }, sim: function () { return sim; }, viewer: function () { return viewer; }, view: function () { return view; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
