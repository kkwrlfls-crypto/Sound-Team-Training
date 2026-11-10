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
  var TABS = [['overview', '핵심 개념'], ['theory', '이론 학습'], ['practice', '실습하기'], ['quiz', '확인 문제'], ['deeper', '심화 학습']];   // 2026-11-05: 「관련 미션」 탭은 모든 과정에서 뺌
  var PRACTICE_INFO = {
    tabPracMic: ['01. 마이크 실습', '유선 마이크와 무선 마이크를 직접 켜고 맞춰 봐요.', 'img/modules/hw_mic.jpg'],
    tabPracCable: ['02. 케이블 실습', '케이블을 알맞은 단자에 꽂아 봐요.', 'img/modules/hw_cable.jpg'],
    tab6: ['03. 콘솔 실습', 'MG12XU · X32 콘솔을 실제 사진 위에서 다뤄 봐요.', 'console_strip.jpg'],
    tabPracSpk: ['04. 스피커 실습', '액티브 스피커를 켜고 소리를 들어 봐요.', 'img/modules/hw_speaker.jpg'],
    tab1: ['05. 음향 시스템 설계 실습', '마이크·믹서·앰프·스피커를 3D 로 직접 연결하고 조작해 봅니다.', 'vi10p.jpg'],
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
    'img/modules/hw_speaker.jpg': { t: '사진: 3층에 설치된 d&b 서브우퍼 · E8 · Vi10P (제조사 제품 사진)' },
    'img/modules/mg12xu_full.jpg': { t: '사진: 「콘솔 실습」의 MG12XU 화면 콘솔 (Yamaha 제품 사진 + 실습용 페이더)' },
    'https://products.shureweb.eu/cdn-cgi/image/width=900,height=900,format=auto/shure_product_db/product_main_images/files/67c/0a4/37-/original/a63ca7f1e7b45a53c3f11898a7c6280a.webp': { t: '사진: Shure SLX-D+ 무선 마이크 시스템 공식 제품 사진 (shure.com)', url: 'https://www.shure.com/en-ASIA/products/wireless-systems/slxd-plus' },   /* 2026-11-04: 01-2 무선 마이크 카드 */
    'https://cdn-media.empowertribe.com/cdn-cgi/image/width=2000,quality=85,format=auto/e5ba63fb0e6f4e69a1626c5811115e16/Image_BE_0603-ACE_X32_Top_XL.png': { t: '사진: Behringer X32 공식 제품 사진 (behringer.com 제품 페이지)', url: 'https://www.behringer.com/en/products/0603-ace' },   /* 2026-11-03: 03-2 디지털 콘솔 — 제조사 사이트에서 바로 불러옴 */
    'https://cdn-media.empowertribe.com/88b7019edb6a4da19acbf5407a5d6caa/Image_MI_0603-AEO_M32-LIVE_Front_XL.png': { t: '사진: Midas M32 LIVE 공식 제품 사진 (midasconsoles.com 제품 페이지)', url: 'https://www.midasconsoles.com/en/products/0603-AEO' }   /* 2026-11-09: 03-3 M32 첫 화면 사진 */
  };
  var IMG_R = { 'img/modules/mg12xu_full.jpg': 1754 / 1862, 'img/modules/crown_xli1500.jpg': 1600 / 817, 'img/modules/ev_zxa1.jpg': 1160 / 900, 'https://cdn-media.empowertribe.com/cdn-cgi/image/width=2000,quality=85,format=auto/e5ba63fb0e6f4e69a1626c5811115e16/Image_BE_0603-ACE_X32_Top_XL.png': 2000 / 1389, 'https://cdn-media.empowertribe.com/88b7019edb6a4da19acbf5407a5d6caa/Image_MI_0603-AEO_M32-LIVE_Front_XL.png': 2000 / 974 };   // 사진 가로÷세로 (그 밖의 장비 사진은 1200×900)
  window.STA_IMG_CREDITS = IMG_CREDITS;   // 2026-10-23: 화면의 출처 줄은 없애고, 메뉴 맨 아래 「사진 출처」 창에서만 보여 줌(lessons/ui.js)
  function creditHtml() { return ''; }
  var view = { path: null, mod: null, tab: 'overview', fig: 'photo' }, sim = null, viewer = null, backTo = null;

  function $(id) { return document.getElementById(id); }
  /* 2026-11-03: 03-1 · 03-2 처럼 나눈 과정은 noLabel 로 표기 */
  function noTxt(m) { return m.noLabel || String(m.no).padStart(2, '0'); }
  window.STA_NO_TXT = noTxt;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pathById(id) { return PATHS.find(function (p) { return p.id === id; }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { /* 저장이 안 돼도 화면은 동작 */ } }
  function st(id) { var a = load(), s = a[id] || {}; s.checks = s.checks || {}; s.tasks = s.tasks || {}; s.quiz = s.quiz || {}; return s; }
  function put(id, s) { var a = load(); a[id] = s; save(a); }
  function okIdx(q) { for (var i = 0; i < q.options.length; i++) if (q.options[i].ok) return i; return -1; }
  /* 2026-11-08: 「음향 장비 학습」은 과정 안의 「실습하기」 단계를 빼고 메뉴의 실습 탭(STA_PRAC_PAGES)으로 옮김 → 과정 완료 = 학습 + 이해도 */
  var PRAC = window.STA_PRAC_PAGES || {};
  function noPrac(m) { var p = m && pathById(m.path); return !!(p && p.practiceOut); }
  function pageOf(id) { for (var k in PRAC) { var pp = PRAC[k].parts || []; for (var i = 0; i < pp.length; i++) if (pp[i][0] === id) return k; } return null; }
  function tabsOf(m) { if (is7(m)) return steps7(m); return noPrac(m) ? TABS.filter(function (t2) { return t2[0] !== 'practice'; }) : TABS; }
  /* 2026-11-09 내부 화면 재구성 3차: 과정 화면 7단계
     학습 목표 → 핵심 개념 → 실제 장비 확인 → 직접 실습 → 결과 확인 → 이해도 확인 → 실전 미션 (심화 학습은 실전 미션 아래)
     - 내용은 기존 데이터(theory · overview · quiz · missions · deeper · practice)를 그대로 다시 배치. 새로 지어낸 진행률 없음
     - 예전 주소(#module-mic-overview · -theory · -deeper · -practice)도 그대로 열림 */
  var STEP7 = { physics: true, hardware: true, mixing: true };   // 3차 음향 장비 학습 · 4차 믹싱 스킬 · 2026-11-10 물리음향도 (예전 「그림 → 핵심 학습 포인트」 첫 화면은 이제 안 씀)
  function is7(m) { return !!(m && STEP7[m.path]); }
  function isDiagram(m) { var h = (GL[m.id] || {}).hero || {}; return !!(h.vis && VIS[h.vis]); }   // 장비 사진이 아니라 설명 그림이면 3단계 이름은 「그림으로 이해하기」
  function steps7(m) { return [['goal', '학습 목표'], ['theory', '핵심 개념'], ['gear', isDiagram(m) ? '그림으로 이해하기' : '실제 장비 확인'], [noPrac(m) ? 'lab' : 'practice', '직접 실습'], ['quiz', '이해도 확인']]; }   // 2026-11-10: 「결과 확인」 · 「실전 미션」 단계는 뺌(심화 학습은 이해도 확인 아래)
  var STEP7_DESC = { goal: '이 과정에서 배울 내용', theory: '개념 · 용어 · 주제별 설명', gear: '실제 장비 사진 · 조작부', lab: '실습 화면에서 직접 조작', practice: '실습 화면에서 직접 조작', quiz: '문제로 이해도 확인 · 심화 학습' };
  function defTab(m) { return is7(m) ? 'goal' : 'overview'; }
  function alias7(m, tab) { if (!is7(m)) return tab; return tab === 'overview' || tab === 'result' ? 'goal' : tab === 'deeper' || tab === 'missions' ? 'quiz' : tab; }   // 예전 주소도 열림
  function toDeeper(m, asked) { return is7(m) && (asked === 'deeper' || asked === 'missions'); }
  var PRAC_ALIAS = { console: ['tab6', '#mg12xu'] };   // 아날로그 콘솔 과정 → 03. 콘솔 실습의 MG12XU 칸
  function pracPageOf(m) { var k = pageOf(m.id); return k ? [k, m.id] : (PRAC_ALIAS[m.id] || null); }
  function pracCounts(m) { var s = st(m.id), d = m.practice.tasks.filter(function (t) { return s.tasks[t.id]; }).length; return { d: d, n: m.practice.tasks.length, done: d === m.practice.tasks.length }; }
  function counts(m) {
    if (m.status !== 'ready') return null; var s = st(m.id), np = noPrac(m);
    var learn = m.theory.filter(function (x, i) { return s.checks[i] === okIdx(x.check); }).length,
      prac = np ? 0 : m.practice.tasks.filter(function (t) { return s.tasks[t.id]; }).length,
      quiz = m.quiz.filter(function (q, i) { return s.quiz[i] === okIdx(q); }).length;
    return { learn: learn, learnN: m.theory.length, prac: prac, pracN: np ? 0 : m.practice.tasks.length, quiz: quiz, quizN: m.quiz.length,
      learnDone: learn === m.theory.length, pracDone: np || prac === m.practice.tasks.length, quizDone: quiz === m.quiz.length, opened: !!s.opened };
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
    if (m.img) return '<img src="' + esc(m.img) + '" alt="" loading="lazy"' + (m.imgPos ? ' style="object-position:' + m.imgPos + '"' : '') + (m.imgFallback ? ' onerror="this.onerror=null;this.src=\'' + esc(m.imgFallback) + '\'"' : '') + '>';   // 2026-11-04: 바깥 사진을 못 불러오면 저장소 사진으로
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
  function crumb(parts) { return '<nav class="lsn-crumb mod-crumb" aria-label="위치"><button type="button" data-modhome="1">학습 홈</button><span>›</span><button type="button" data-modhome="paths">이론 학습</button>' + parts.map(function (x) { return '<span>›</span>' + (x[1] ? '<button type="button" ' + x[1] + '>' + esc(x[0]) + '</button>' : '<b>' + esc(x[0]) + '</b>'); }).join('') + '</nav>'; }
  function modCard(m) {
    var s = status(m), soon = s === 'soon', c = counts(m);
    return '<button type="button" class="mod-card' + (soon ? ' soon' : '') + '" data-module="' + m.id + '"' + (soon ? ' aria-disabled="true"' : '') + '>' +
      '<span class="mod-card__thumb">' + thumb(m) + (s === 'done' ? '<i class="mod-flag done">✓ 완료</i>' : '')   /* 2026-11-10: 「진행 중」 표시 · 난이도 · 시간 · 학습/실습/이해도 점은 뺌(눈에 걸리는 작은 표시 줄이기) */ + '</span>' +
      '<span class="mod-card__body"><b>' + noTxt(m) + '. ' + esc(m.title) + '</b><span class="mod-card__sub">' + esc(m.sub) + '</span>' +
      (soon && m.topics ? '<span class="mod-card__topics">' + m.topics.slice(0, 3).map(esc).join(' · ') + '…</span>' : '') +
      (soon ? '<span class="mod-card__meta"><span class="home-tag soon">준비 중</span></span>' : '') + '</span></button>';
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
    return '<div class="lsn-q mod-q" data-' + kind + '="' + qi + '"><b>' + (kind === 'mquiz' ? (qi + 1) + '. ' : '✔ 개념 체크 · ') + esc(q.q) + '</b>' + visBox(q.visual, 'mod-qvis') + '<fieldset class="lsn-opts"><legend class="sr-only">' + esc(q.q) + '</legend>' +
      q.options.map(function (o, oi) {
        var cls = answered ? (o.ok ? ' ok' : (oi === ans ? ' no' : '')) : '';
        return '<label class="lsn-opt' + cls + '"><input type="radio" name="' + kind + qi + '" value="' + oi + '"' + (answered && oi === ans ? ' checked' : '') + '><span>' + esc(o.t) + (answered && (o.ok || oi === ans) ? '<span class="why">' + (o.ok ? '✓ ' : '✗ ') + esc(o.why) + '</span>' : '') + '</span></label>';
      }).join('') + '</fieldset><div class="lsn-qbar"><button type="button" class="lsn-check" data-' + kind + 'chk="' + qi + '"' + (answered ? '' : ' disabled') + '>' + (answered ? '다시 확인' : '확인') + '</button>' +
      (answered ? '<span class="lsn-fb ' + (q.options[ans] && q.options[ans].ok ? 'ok">정답이에요!' : 'no">다시 생각해 보세요') + '</span>' : '') + '</div></div>';
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
      (tsLinked(m) ? '<span class="mod-mi">' + mi('ts') + '트러블슈팅 연결</span>' : '') +
      dot(c.learnDone, '학습 ' + c.learn + '/' + c.learnN) + (noPrac(m) ? '' : dot(c.pracDone, '실습 ' + c.prac + '/' + c.pracN)) + dot(c.quizDone, '이해도 ' + c.quiz + '/' + c.quizN);
  }
  function preHtml(m, cls) {
    return m.prereq && m.prereq.length ? '<div class="' + cls + '">먼저 보면 좋은 레슨: ' + m.prereq.map(function (id) { var l = lessonById(id); return l ? '<button type="button" class="lsn-theory-link" data-lesson="' + id + '">' + (lessonDone(id) ? '✓ ' : '📘 ') + esc(l.title) + '</button>' : ''; }).join('') + '</div>' : '';
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
    var tools = d3 ? '<div class="mod-fig__tools" role="group" aria-label="보기 방식"><button type="button" data-mfig="photo" aria-pressed="' + !is3d + '">' + (h && h.zones ? '사진 · 기능부 설명' : h && h.vis ? '그림 설명' : '사진 설명') + '</button><button type="button" data-mfig="3d" aria-pressed="' + !!is3d + '">3D 로 돌려 보기</button></div>' : '';
    if (is3d) return '<figure class="mod-fig mod-fig--3d"><div class="mod-viewer" data-role="viewer"><div class="mod-viewer__msg">3D 모델을 불러오는 중…</div></div>' +
      '<figcaption class="mod-fig__foot mod-viewer__bar">' + tools + (d3.variants ? '<div class="mod-fig__vars" role="group" aria-label="제품 고르기">' + d3.variants.map(function (vv, vi) { return '<button type="button" data-mvar="' + vi + '" aria-pressed="' + (vi === (view.var3d || 0)) + '">' + esc(vv[1]) + '</button>'; }).join('') + '</div>' : '') + '<span>끌어서 돌려 보기 · ' + esc(d3.variants ? d3.variants[view.var3d || 0][2] || d3.label : d3.label) + '</span>' + (d3.toggle ? '<button type="button" class="sim-btn" data-mviewer="switch">' + esc(d3.toggleTxt) + '</button>' : '') + '</figcaption></figure>';
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
    /* 2026-11-03: 기능부 설명 — 사진 위 구역에 마우스를 올리면(휴대폰은 누르면) 말풍선 설명, 같은 기능 구역은 함께 표시 (MG12XU 실습의 「기능부 설명」과 같은 방식) */
    var zones = '', zchips = '', Z = h && h.zones;
    if (Z) {
      Z.rects.forEach(function (q) {
        var u0 = q[1] / Z.w, v0 = q[2] / Z.h, u1 = q[3] / Z.w, v1 = q[4] / Z.h, sec = Z.secs[q[0]] || [q[0], ''];
        zones += '<span class="mod-zone" data-zsec="' + q[0] + '" data-zpart="' + esc(q[5] || '') + '" title="' + esc(sec[0]) + '" style="left:' + ((0.5 + (u0 - v[0]) * k) * 100).toFixed(2) + '%;top:' + ((v0 - v[1]) / v[2] * 100).toFixed(2) +
          '%;width:' + ((u1 - u0) * k * 100).toFixed(2) + '%;height:' + ((v1 - v0) / v[2] * 100).toFixed(2) + '%"></span>';
      });
      zchips = '<div class="mod-zchips" role="group" aria-label="기능부 이름 — 누르면 사진에 위치와 설명이 나와요">' + Object.keys(Z.secs).map(function (key) { return '<button type="button" data-zsec="' + key + '" aria-pressed="false">' + esc(Z.secs[key][0]) + '</button>'; }).join('') + '</div>';
    }
    return '<figure class="mod-fig' + (Z ? ' mod-fig--zones' : '') + '" style="--fig-bg:' + esc((h && h.bg) || '#0b1626') + '">' +
      '<div class="mod-fig__stage">' + (Z ? '<div class="mod-zoomwrap">' : '') + '<img src="' + esc(img) + '" alt="' + esc(m.title) + ' 장비 사진" style="height:' + (100 / v[2]).toFixed(2) + '%;top:' + (-v[1] / v[2] * 100).toFixed(2) + '%;left:' + ((0.5 - v[0] * k) * 100).toFixed(2) + '%">' +
      (pts.length ? '<svg class="mod-fig__lines" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true">' + lines + '</svg>' + marks + labels : '') + zones + (Z ? '</div>' : '') + '</div>' +
      (pts.length ? '<ol class="mod-fig__legend">' + legend + '</ol>' : '') + zchips +
      (tools || Z ? '<div class="mod-fig__foot">' + tools + (Z ? '<span class="mod-zhint">구역에 마우스를 올리면 기능 설명이 나와요. 구역(또는 위의 이름)을 누르면 그 부분이 크게 확대되고, 한 번 더 누르면 원래대로 돌아와요.</span>' : '') + '</div>' : '') + '</figure>';
  }
  function heroHtml(m) {
    var s = st(m.id);
    return '<section class="mod-hero" aria-label="장비 살펴보기와 핵심 학습 포인트">' + figHtml(m) +
      '<aside class="mod-learn"><h2>핵심 학습 포인트</h2><ul>' + m.theory.map(function (x, i) { var ok = s.checks[i] === okIdx(x.check);
        return '<li><button type="button" data-mtheory="' + i + '" class="' + (ok ? 'ok' : '') + '">' + mi(ok ? 'check' : 'dot') + '<span>' + esc(x.title) + '</span></button></li>'; }).join('') +
      '</ul><button type="button" class="ui-btn ui-btn--secondary ui-btn--block" data-mtab="theory">자세히 보기 · 이론 학습</button></aside></section>';
  }
  function conceptBox(m, title) {
    var o = m.overview, g = (GL[m.id] || {}), h = g.hero || {};
    var showVis = VIS[o.model] && !(h.vis === o.model);
    return '<section class="mod-box mod-concept"><h2 class="mod-box__h">' + mi('bulb') + (title || '핵심 개념') + '</h2><div class="mod-lead mod-paras">' + paras(o.lead) + '</div>' +
      '<h3 class="mod-h3">주요 용어 <small>눌러서 뜻 보기</small></h3><div class="mod-terms">' + o.terms.map(function (t2) { return '<details class="mod-term"><summary>' + esc(t2[0]) + '</summary><p>' + esc(t2[1]) + '</p>' + visBox(t2[2], 'mod-term__vis') + '</details>'; }).join('') + '</div>' +
      (g.glance ? matchHtml(g.glance) : '')   /* 2026-11-04: 「한눈에 보기」 짝 맞추기 — 2026-11-10: 용어를 먼저 보고 나서 맞추게 용어 뒤로 */ +
      (showVis ? '<div class="mod-visual">' + VIS[o.model]() + '</div>' + figRead(o.model, 'm7-read--under') : '') + '</section>';
  }
  function tabOverview(m) {
    var o = m.overview;
    return '<div class="mod-ov"><div class="mod-ov__main">' + conceptBox(m) + '</div>' +
      '<aside class="mod-ov__side">' +   /* 2026-11-04: 「관련 실습 바로가기」 상자 뺌 */
      '<div class="lsn-points mod-points"><h4>기억할 점</h4><ul>' + o.points.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></aside></div>' +
      '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="theory">이론 학습 시작 →</button></div>';
  }
  function tabTheory(m) {
    var s = st(m.id), c = counts(m);
    return '<div class="mod-progline">' + (c.learnDone ? '<span class="mod-okline">🎉 개념 체크를 모두 맞혀 <b>학습 완료</b>했어요.</span>' : '각 주제 끝의 <b>개념 체크</b>를 모두 맞히면 학습 완료예요. (지금 ' + c.learn + '/' + c.learnN + ')') + '</div>' +
      m.theory.map(function (x, i) {
        var ok = s.checks[i] === okIdx(x.check);
        return '<section class="mod-sec" id="modSec' + i + '"><h2 class="mod-sec__h"><span class="lsn-num">' + (i + 1) + '</span>' + esc(x.title) + (ok ? '<span class="mod-tick">✓</span>' : '') + '</h2>' +
          '<div class="mod-p mod-paras">' + paras(x.body) + '</div>' + (x.visual && VIS[x.visual] ? '<div class="mod-visual mod-visual--after">' + VIS[x.visual]() + '</div>' : '') + picsHtml(x.pics) +   // 2026-11-10: 설명을 먼저 읽고 그림을 보게(예전엔 그림이 먼저)
          (x.more ? '<details class="mod-more"><summary>더 알아보기</summary><div' + (/<(ul|ol|table)\b/.test(x.more) ? '>' + x.more : ' class="mod-paras">' + paras(x.more)) + '</div></details>' : '') +
          qHtml(x.check, i, s.checks[i], 'mcheck') + '</section>';
      }).join('') + (is7(m) ? next7(m, 'theory') : noPrac(m) ? pracLink(m) + '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="quiz">확인 문제 풀기 →</button></div>' : '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="practice">실습하기 →</button></div>');
  }
  function pracLink(m) { var k = pageOf(m.id), cfg = k && PRAC[k]; if (!cfg) return '';
    return '<div class="mod-praclink"><span>🛠 이 장비는 메뉴 「실습」의 <b>' + cfg.no + '. ' + esc(cfg.title) + '</b>에서 직접 다뤄 볼 수 있어요.</span><button type="button" class="btn" data-prac-open="' + k + ':' + m.id + '">실습하러 가기 →</button></div>'; }
  function tabPractice(m) {
    if (is7(m)) { var links = m.practice.links || [];   // 2026-11-09 7단계(믹싱 스킬): 과정 안 실습 화면 + 함께 해 볼 실습
      return stepHead(m, 'practice', '아래 실습 화면에서 직접 조작해 봐요. 과제는 실습 화면의 상태로 자동 확인돼요.') + pracBody(m) +
        (links.length ? '<h3 class="m7-subh">함께 해 볼 실습</h3><div class="m7-links">' + links.map(function (x, i) { return linkCard(x, 'data-mgo="practice:' + i + '"', '관련 실습'); }).join('') + '</div>' : '') + next7(m, 'practice'); }
    return pracBody(m) + '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="quiz">확인 문제 풀기 →</button></div>'; }
  function pracBody(m) {
    var p = m.practice, s = st(m.id), pc = pracCounts(m), c = { prac: pc.d, pracN: pc.n, pracDone: pc.done };
    return '<div class="mod-lead mod-paras">' + paras(esc(p.lead)) + '</div><div class="mod-simwrap"><div class="mod-sim" data-role="sim"></div>' +
      '<aside class="mod-tasks"><h3>실습 과제 <small>' + c.prac + '/' + c.pracN + '</small></h3><ol>' + p.tasks.map(function (t2) { var d = !!s.tasks[t2.id];
        return '<li class="' + (d ? 'done' : '') + '" data-task="' + t2.id + '"><span class="mod-task__ck">' + (d ? '✓' : '') + '</span><div><b>' + esc(t2.title) + '</b><p>' + esc(t2.text) + '</p></div></li>'; }).join('') + '</ol>' +
      (c.pracDone ? '<div class="mod-okline">🎉 실습 과제를 모두 마쳤어요. <b>실습 완료</b>!</div>' : '<p class="mod-small">과제는 실습 화면의 상태로 자동 확인돼요. 버튼을 누르기만 해서는 완료되지 않아요.</p>') + '</aside></div>' +
      '<p class="mod-note">⚠️ ' + esc(p.note) + '</p>';   /* 2026-11-04: 「이어서 해 볼 실습」 링크 뺌 */
  }
  function tabQuiz(m) {
    var s = st(m.id), c = counts(m);
    return '<div class="mod-progline">' + (c.quizDone ? '<span class="mod-okline">🎉 확인 문제를 모두 맞혔어요. <b>이해도 확인</b> 완료!</span>' : c.quizN + '문제를 모두 맞히면 이해도 확인이 완료돼요. (지금 ' + c.quiz + '/' + c.quizN + ')') +
      (!c.pracDone ? '<br><small>실습을 먼저 해 보면 더 쉽게 풀 수 있어요.</small>' : '') + '</div>' +
      m.quiz.map(function (q, i) { return qHtml(q, i, s.quiz[i], 'mquiz'); }).join('') +
      (is7(m) ? '<h3 class="m7-subh" id="modDeeper">심화 학습</h3>' + tabDeeper(m) : '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="deeper">심화 학습 →</button></div>');
  }
  /* ------------------------------------------------------------- 2026-11-09 7단계 화면 */
  function next7(m, tab) {
    var st7 = steps7(m), i = st7.findIndex(function (x) { return x[0] === tab; }), nx = st7[i + 1]; if (!nx) return '';
    return '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="' + nx[0] + '">' + (i + 2) + '단계 · ' + esc(nx[1]) + ' →</button></div>';
  }
  function stepHead(m, tab, sub) {
    var st7 = steps7(m), i = st7.findIndex(function (x) { return x[0] === tab; });
    return '<div class="m7-head"><h2>' + esc(st7[i][1]) + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>';
  }
  function okMark(ok, n) { return '<span class="m7-ck' + (ok ? ' ok' : '') + '" aria-hidden="true">' + (ok ? '✓' : (n == null ? '' : n)) + '</span>'; }
  function tabGoal(m) {
    var s = st(m.id), c = counts(m), pp = pracPageOf(m);
    return stepHead(m, 'goal', '이 과정을 마치면 아래 내용을 스스로 설명할 수 있어요. 항목을 누르면 그 설명으로 바로 가요.') +
      '<div class="m7-split"><section class="m7-card m7-goals" aria-label="학습 목표"><ol>' + m.theory.map(function (x, i) { var ok = s.checks[i] === okIdx(x.check);
        return '<li><button type="button" data-mtheory="' + i + '">' + okMark(ok, i + 1) + '<span><b>' + esc(x.title) + '</b>' + (ok ? '<small>개념 체크를 맞혔어요</small>' : '') + '</span></button></li>'; }).join('') + '</ol></section>' +
      '<aside class="m7-side">' + (m.prereq && m.prereq.length ? '<section class="m7-card m7-pre"><h3>먼저 보면 좋은 레슨</h3>' + preHtml(m, 'm7-pre__list').replace('먼저 보면 좋은 레슨: ', '') + '</section>' : '') +   // 2026-11-10: 「이 과정의 순서」(단계 탭과 같은 내용)는 뺌
      '<section class="m7-card"><h3>완료 기준</h3><ul class="m7-crit"><li><span>개념 체크 모두 맞히기</span><b>' + c.learn + ' / ' + c.learnN + '</b></li>' + (noPrac(m) ? '' : '<li><span>실습 과제 모두 하기</span><b>' + c.prac + ' / ' + c.pracN + '</b></li>') + '<li><span>이해도 문제 모두 맞히기</span><b>' + c.quiz + ' / ' + c.quizN + '</b></li></ul>' +
      '<p class="m7-note">' + (!noPrac(m) ? '실습 과제는 「직접 실습」 단계의 실습 화면에서 자동으로 확인돼요.' : pp ? '직접 실습은 실습 화면에서 따로 기록돼요(완료 기준에는 들어가지 않아요).' : '이 과정은 아직 따로 된 실습 화면이 없어요.') + '</p></section></aside></div>' + next7(m, 'goal');
  }
  function tabTheory7(m) {
    return stepHead(m, 'theory', '먼저 개념과 용어를 익히고, 아래 주제별 설명을 읽은 뒤 주제마다 개념 체크를 풀어요.') + conceptBox(m, '개념과 용어') +
      '<h3 class="m7-subh" id="modTopics">주제별 학습</h3>' + tabTheory(m);
  }
  /* 2026-11-10: 「그림 읽는 법」 — 처음 보는 사람도 그림의 각 부분이 무슨 뜻인지 알 수 있게, 그림마다 읽는 순서대로 쉬운 말로 */
  var FIG_READ = {
    pwHero: ['왼쪽 검은 상자는 <b>스피커</b>예요. 스피커 판이 앞뒤로 움직이면 앞의 공기가 눌렸다 풀렸다 해요.',
      '파란 물결선은 그 공기의 모습이에요. 위로 솟은 곳(파란 칸)은 공기가 <b>빽빽한 곳(밀)</b>, 아래로 꺼진 곳은 <b>듬성한 곳(소)</b>이에요.',
      '주황 괄호 <b>파장 λ</b>는 빽빽한 곳에서 다음 빽빽한 곳까지 — 물결 한 개의 길이예요.',
      '오른쪽 보라 표시 <b>진폭</b>은 물결의 높이예요. 높을수록 큰 소리예요.',
      '아래 칸은 예시 숫자예요. 낮은 소리(100 Hz)는 물결 한 개가 약 3.4 m 로 길고, 높은 소리(10 kHz)는 약 3.4 cm 로 짧아요. 음압이 2배면 +6 dB, 거리가 2배면 −6 dB 예요.'],
    peHero: ['왼쪽에서 오른쪽으로 찬양 한 소절이 지나가는 순서예요: <b>노래 소리 → 마이크 → 콘솔 → 파워앰프 → 스피커</b>.',
      '칸마다 그려진 물결은 그 자리의 신호예요. 물결이 클수록 전압이 커요.',
      '아래 숫자(약 2 mV → 1.2 V → 28 V)는 교육용 예시 값이에요. 마이크에서 나온 아주 작은 전기를 콘솔과 앰프가 차례로 키운다는 뜻이에요.',
      '맨 아래 네 칸은 이 과정에서 배울 전기 낱말이에요: <b>V 전압 · A 전류 · Ω 저항 · W 전력</b>.'],
    prHero: ['왼쪽 큰 그림은 본당을 <b>위에서 내려다본 모습</b>이에요. 노란 칸은 강단, 회색 줄은 의자, 검은 네모는 스피커, 파란 점은 듣는 자리예요.',
      '파란 화살표 <b>직접음</b>은 스피커에서 곧장 오는 소리, 주황 선은 옆벽 · 뒷벽에 <b>튕겨서 조금 늦게 오는 소리</b>예요.',
      '오른쪽 끝 초록 띠는 소리를 빨아들이는 <b>흡음</b> 벽이에요.',
      '오른쪽 작은 그래프는 소리를 멈춘 뒤 울림이 줄어드는 모습이에요. 가로는 시간이고, 선이 바닥까지 내려오는 시간이 <b>RT60</b>(잔향 시간)이에요.',
      '같은 본당도 빈 때는 6.4초, 사람이 가득 차면 2.2초로 짧아져요. 사람과 옷이 소리를 빨아들이기 때문이에요.'],
    gateTransfer: ['가로는 <b>들어온 소리</b>, 세로는 <b>나간 소리</b>의 크기예요. 오른쪽 위로 갈수록 큰 소리예요.',
      '빨간 점선이 <b>Threshold(−40 dB)</b>예요. 이보다 큰 소리는 들어온 그대로 나가요(파란 선이 대각선을 따라가요).',
      '이보다 작은 소리가 오면 게이트가 닫혀요. 파란 선이 아래로 뚝 떨어지는 건 <b>완전히 끈 것(Range −∞)</b>, 주황 선은 <b>20 dB 만 줄인 것(Range −20 dB)</b>이에요.',
      '회색 점선은 게이트가 없을 때 — 들어온 소리가 그대로 나가는 모습이에요.'],
    wlSystem: ['왼쪽 두 개는 <b>송신기</b>예요. 손에 드는 핸드헬드, 그리고 허리에 차고 헤드셋이나 핀 마이크를 꽂는 벨트팩이에요.',
      '송신기는 소리를 <b>전파</b>로 바꿔 공중으로 보내요(물결 표시).',
      '가운데 검은 상자가 <b>수신기</b>예요. 안테나 A · B 두 개로 받아서 더 잘 잡히는 쪽을 써요(다이버시티).',
      '수신기는 전파를 다시 소리 신호로 바꿔 <b>XLR 케이블로 콘솔 채널</b>에 보내요. 콘솔에서는 보통 마이크와 똑같이 다뤄요.',
      '아래 파란 띠: 송신기와 수신기의 <b>주파수가 같아야</b> 소리가 나요.'],
    dcOverview: ['디지털 오디오를 나르는 <b>단자 6가지</b>를 모은 그림이에요.',
      '칸마다 맨 위 색 표시는 신호가 무엇을 타고 가는지예요: <b>전기 · 빛 · 네트워크 · 컴퓨터</b>.',
      '가운데 그림은 단자 모양, 굵은 글씨는 이름, 아래 작은 글씨는 주로 쓰는 곳이에요.',
      'Ω 숫자는 케이블 규격이에요. AES/EBU 는 마이크 단자(XLR)와 모양이 같아도 디지털용 110 Ω 케이블을 쓰는 게 원칙이에요.'],
    daChurch: ['4채널 디지털 앰프 <b>두 대(A · B)</b>가 각각 어떤 스피커를 맡는지 보여 주는 예시예요.',
      '줄마다 왼쪽 <b>CH1 ~ CH4</b>는 앰프의 출력 번호, 가운데는 연결된 스피커와 개수, 오른쪽 숫자는 그 출력에 걸리는 <b>저항(임피던스)</b>이에요.',
      '같은 스피커 두 대를 나란히(병렬) 이으면 저항이 반으로 줄어요. 8 Ω 두 대 = 4 Ω 이에요.',
      'MAIN12 · SUB18 같은 이름은 앰프 안에 저장해 둔 스피커별 설정(프리셋) 이름이에요.'],
    psSystem: ['굵은 테두리 상자 하나가 <b>스피커 통 하나</b>예요.',
      '위 줄은 <b>패시브 스피커</b>: 콘솔의 작은 소리를 바깥의 파워앰프가 크게 키워서 speakON 케이블로 보내요. 통 안에는 앰프가 없어요.',
      '통 안의 <b>크로스오버</b>는 소리를 높낮이로 나눠 우퍼(저음)와 혼(고음)에 보내요.',
      '아래 줄은 비교용 <b>액티브 스피커</b>: 작은 소리를 XLR 로 바로 보내고, 통 안에 앰프가 들어 있어 전원을 꽂아야 해요.'],
    chain: ['마이크 소리가 채널 안에서 지나가는 순서를 <b>왼쪽 → 오른쪽</b>으로 그렸어요.',
      '진한 칸 두 개가 핵심이에요. <b>GAIN</b>은 들어온 소리를 알맞은 크기로 처음 키우는 곳, <b>페이더</b>는 다른 채널과 섞을 양을 정하는 곳이에요.',
      'GAIN 으로 입력 크기를 먼저 맞추고, 그다음 페이더로 균형을 맞춰요. 순서가 바뀌면 안 돼요.'],
    eqOverview: ['가로는 소리의 높낮이(주파수)예요. 왼쪽 20 Hz 가 가장 낮은 소리, 오른쪽 20 kHz 가 가장 높은 소리예요.',
      '세로는 키우거나 줄인 양(dB)이에요. 0 선 위는 키운 것, 아래는 줄인 것이에요.',
      '동그라미 하나가 EQ 손잡이 하나(<b>HPF · LOW · LOW MID · HIGH MID · HIGH</b>)이고, 굵은 선이 모두 합친 결과예요.',
      '이 예시는 HPF 로 아주 낮은 소리를 잘라 내고(왼쪽 아래로 떨어짐), LOW MID 를 조금 깎고, HIGH MID 를 조금 올린 모습이에요.'],
    compCurve: ['가로는 <b>들어온 소리</b>, 세로는 <b>나간 소리</b>예요. 회색 점선(1:1)은 컴프가 없을 때예요.',
      '빨간 점선 <b>Threshold(−20 dB)</b>를 넘기 전까지는 들어온 그대로 나가요.',
      '넘은 뒤에는 선이 눕어요. <b>4:1</b> 이면 넘은 4 dB 가 1 dB 만 나가요. 비율이 클수록 더 눕고, ∞:1(빨간 선)은 천장처럼 막혀요(리미터).',
      '주황 화살표 <b>GR</b>은 컴프가 줄인 양이에요. 이 예시에서는 9 dB 를 줄였어요.'],
    fxEchogram: ['가로는 소리가 난 뒤 흐른 <b>시간(ms)</b>, 막대 높이는 그때 들리는 소리의 크기예요.',
      '① 맨 앞 굵은 막대는 <b>직접음</b> — 소리 그 자체예요.',
      '② 바로 뒤 몇 개의 막대는 벽에 처음 튕겨 온 <b>초기 반사음</b>이에요.',
      '③ 그 뒤로 빽빽하게 줄어드는 막대들이 <b>잔향(울림 꼬리)</b>이에요.',
      '보라 선은 직접음과 첫 반사음 사이의 틈이에요. 리버브의 <b>Pre-delay</b> 가 이 틈을 흉내 내요.']
  };
  function figRead(key, cls) { var r = FIG_READ[key]; if (!r) return '';
    return '<div class="m7-read' + (cls ? ' ' + cls : '') + '"><h3>' + mi('bulb') + '그림 읽는 법</h3><ol>' + r.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol></div>'; }
  function tabGear(m) {
    var h = (GL[m.id] || {}).hero || {}, d3 = MODEL3D[m.overview.model], dg = isDiagram(m), read = dg ? figRead(h.vis) : '';
    var how = dg ? '앞에서 배운 개념을 그림으로 다시 봐요. 「그림 읽는 법」을 순서대로 읽으면서 그림의 각 부분을 찾아보세요.' :
      '실제 장비에서 배운 부분이 어디에 있는지 찾아봐요. ' + (h.zones ? '사진의 구역에 마우스를 올리거나(휴대폰은 누르기) 위의 이름을 누르면 그 부분의 이름과 역할이 나와요.' : '사진의 번호를 따라 각 부분의 이름과 역할을 확인해요.');
    var pts = '<section class="m7-card m7-side"><h3>' + (dg ? '기억할 점' : '장비를 볼 때 기억할 점') + '</h3><ul class="m7-points">' + m.overview.points.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></section>';
    return stepHead(m, 'gear', how + (d3 ? ' 「3D 로 돌려 보기」로 장비를 이리저리 돌려 볼 수도 있어요.' : '')) +
      '<div class="m7-gear">' + figHtml(m) + (read ? '<aside class="m7-card m7-side m7-side--read">' + read + '</aside></div>' + pts : '<aside class="m7-side">' + pts + '</aside></div>') + next7(m, 'gear');
  }
  function linkCard(x, attr, kicker) {
    var info = x.go && x.go.tab !== 'tabBrands' && PRACTICE_INFO[x.go.tab], img = info && info[2];   // 브랜드 칸 사진은 다른 장비(CL5)라 쓰지 않음
    return '<button type="button" class="m7-link" ' + attr + '>' + (img ? '<span class="m7-link__img"><img src="' + esc(img) + '" alt="" loading="lazy"></span>' : '') +
      '<span class="m7-link__body"><small>' + esc(kicker) + '</small><b>' + esc(x.title) + '</b><span>' + esc(x.text || '') + '</span><em>열기 →</em></span></button>';
  }
  /* 2026-11-10: 직접 실습 카드 사진 — 콘솔은 칸마다 그 콘솔 사진(예전엔 03. 콘솔 실습 칸 사진 = MG12XU 일부를 셋 다 씀)
     X32 · M32 는 실습 화면(x32_photo_sim · m32_layout)이 쓰는 공식 제품 사진과 같은 주소 */
  var LAB_IMG = {
    '#mg12xu': ['img/modules/mg12xu_full.jpg', 'Yamaha MG12XU 윗면 사진', 'MG12XU 사진 위에서 채널 GAIN · EQ · AUX · 페이더를 직접 돌리고 올려 봐요.'],
    'console-digital': ['https://cdn-media.empowertribe.com/cdn-cgi/image/width=2000,quality=85,format=auto/e5ba63fb0e6f4e69a1626c5811115e16/Image_BE_0603-ACE_X32_Top_XL.png', 'Behringer X32 윗면 (공식 제품 사진)', 'X32 윗면 사진 위에서 레이어 · 채널 · 화면을 직접 눌러 보며 조작해 봐요.'],
    'console-m32': ['https://media.sweetwater.com/m/products/image/a64e2cb6adOgOIeqtULtLoaS8lL9psIkkgGcZBQ4.jpg', 'Midas M32 LIVE 윗면 (Sweetwater 제품 사진)', 'M32 윗면 사진 위에서 레이어 · 채널 · 화면을 직접 눌러 보며 조작해 봐요.']
  };
  function tabLab(m) {   // 2026-11-10: 음향 장비 학습의 직접 실습에서 「함께 해 볼 실습」은 뺌
    var pp = pracPageOf(m), cfg = pp && PRAC[pp[0]], info = pp && PRACTICE_INFO[pp[0]], main = '';
    if (cfg) {
      var part = (cfg.parts || []).find(function (p) { return p[0] === pp[1]; }) || [pp[1], m.title], own = pp[1] === m.id, s = st(m.id), pc = own ? pracCounts(m) : null;
      var li = LAB_IMG[pp[1]], src = li ? li[0] : info && info[2];
      main = '<article class="m7-lab">' + (src ? '<div class="m7-lab__img' + (li ? ' m7-lab__img--gear' : '') + '"><img src="' + esc(src) + '" alt="' + esc(li ? li[1] : '') + '" loading="lazy"></div>' : '') +
        '<div class="m7-lab__body"><small>가상 실습실 · ' + esc(cfg.no) + '. ' + esc(cfg.title) + '</small><h3>' + esc(part[1]) + ' 실습</h3><p>' + esc((li && li[2]) || cfg.desc || (info && info[1]) || '') + '</p>' +   // 콘솔은 칸마다 그 콘솔 설명
        (own ? '<h4>실습 과제 <span>' + pc.d + ' / ' + pc.n + '</span></h4><ol class="m7-tasks">' + m.practice.tasks.map(function (t2) { var d = !!s.tasks[t2.id]; return '<li>' + okMark(d) + '<span>' + esc(t2.title) + '</span></li>'; }).join('') + '</ol><p class="m7-note">과제는 실습 화면의 상태로 자동 확인돼요.</p>' : '') +
        '<button type="button" class="ui-btn ui-btn--primary" data-prac-open="' + pp[0] + ':' + pp[1] + '">실습 화면 열기 →</button></div></article>';
    } else main = '<div class="m7-empty"><b>이 장비만 따로 다루는 실습 화면은 아직 없어요.</b><span>실습 화면이 준비되면 이곳에 바로가기가 생겨요. 지금은 「실제 장비 확인」 단계에서 장비를 살펴보세요.</span></div>';
    return stepHead(m, 'lab', '배운 장비를 가상 실습실에서 직접 켜고, 꽂고, 조작해 봐요.') + main + next7(m, 'lab');
  }
  function tabMissions(m) {
    return '<p class="mod-lead">배운 원리를 실제 문제 상황에 적용해 보세요.</p><div class="mod-links">' + m.missions.map(function (x, i) { return '<button type="button" class="mod-link mission" data-mgo="missions:' + i + '"><b>🎯 ' + esc(x.title) + '</b><span>' + esc(x.text) + '</span><em>미션 열기 →</em></button>'; }).join('') + '</div>' +
      '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="deeper">심화 학습 →</button></div>';
  }
  /* 2026-11-04 「그림으로 보기」: 용어 · 이론 · 문제 · 심화에 그림을 더 붙일 수 있게 (데이터에 그림 이름만 적으면 됨)
     - 용어: terms 의 세 번째 칸 = 그림 이름  · 이론: pics: [{ v: 그림 이름, cap: '설명' }]  · 문제/개념 체크: visual  · 심화: visual */
  function visBox(key, cls) { return key && VIS[key] ? '<div class="mod-visual ' + cls + '">' + VIS[key]() + '</div>' : ''; }
  function picsHtml(list) {
    list = (list || []).filter(function (p) { return p && VIS[p.v]; }); if (!list.length) return '';
    return '<div class="mod-pics' + (list.length > 1 ? ' mod-pics--2' : '') + '">' + list.map(function (p) { return '<figure class="mod-pic"><div class="mod-visual">' + VIS[p.v]() + '</div>' + (p.cap ? '<figcaption>' + p.cap + '</figcaption>' : '') + '</figure>'; }).join('') + '</div>';
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
    return '<div class="lsn-deep">' + m.deeper.map(function (d) { return '<div class="lsn-deep-item"><b>' + esc(d.title) + '</b><div class="mod-paras">' + paras(rich(d.text)) + '</div>' + visBox(d.visual, 'mod-dvis') + (d.more ? '<details><summary>자세히 보기</summary><div' + (/<(ul|ol|table)\b/.test(d.more) ? '>' + rich(d.more) : ' class="mod-paras">' + paras(rich(d.more))) + '</div></details>' : '') + '</div>'; }).join('') + '</div>' +
      
      '<div class="mod-next">' + (next ? '<button type="button" class="btn mod-cta" data-module="' + next.id + '">다음 과정: ' + esc(next.title) + ' →</button>' : '<button type="button" class="btn mod-cta" data-path="' + p.id + '">' + esc(p.title) + ' 과정 목록 →</button>') + '</div>';
  }
  function renderModule() {
    var root = $('tabModule'), m = MODS[view.mod]; if (!root || !m) return;
    destroySim(); destroyViewer(); zHide(true);
    if (view.tab === 'practice' && noPrac(m)) view.tab = defTab(m);
    view.tab = alias7(m, view.tab); if (!tabsOf(m).some(function (t2) { return t2[0] === view.tab; })) view.tab = defTab(m);
    var p = pathById(m.path), c = counts(m), s = status(m), tab = view.tab, s7 = is7(m);
    var body = (s7 ? { goal: tabGoal, theory: tabTheory7, gear: tabGear, lab: tabLab, practice: tabPractice, quiz: tabQuiz } :
      { overview: tabOverview, theory: tabTheory, practice: tabPractice, quiz: tabQuiz, missions: tabMissions, deeper: tabDeeper })[tab](m);
    /* 2026-10-23: 왼쪽 과정 목록은 사이드 메뉴로 옮김. 머리(제목·정보·진행도) → [핵심 개념 탭] 장비 사진 + 핵심 학습 포인트 → 단계 탭 → 내용 */
    root.innerHTML = crumb([[p.title, 'data-path="' + p.id + '"'], [noTxt(m) + '. ' + m.title]]) +
      '<div class="mod-page"><header class="mod-head mod-top' + (s7 ? ' mod-top--clean' : '') + '"><div class="mod-top__main"><div class="mod-top__title"><h1 id="modTitle">' + noTxt(m) + '. ' + esc(m.title) +
        (s7 ? (s === 'done' ? ' <span class="mod-st done">' + STATUS_TXT[s] + '</span>' : '') + '</h1></div>' : ' <span class="mod-st ' + s + '">' + STATUS_TXT[s] + '</span></h1><button type="button" class="mod-pathtag" data-path="' + p.id + '">' + esc(p.title) + '</button></div>') +
        '<p class="mod-top__sub">' + esc(m.sub) + '</p>' + (s7 ? '' : '<div class="mod-head__meta">' + metaHtml(m, c) + '</div>' + preHtml(m, 'mod-head__pre')) +   // 2026-11-10: 단계 화면 머리는 제목 · 한 줄 설명 · 진행도만(난이도 · 시간 · 상태 칩 · 경로 칩 · 학습/실습/이해도 칩은 뺌, 먼저 볼 레슨은 학습 목표로)
        '</div><div class="mod-top__prog">' + progHtml(c) + '</div></header>' +
        (tab === 'overview' && !s7 ? heroHtml(m) : '') +
        '<div class="mod-tabs' + (s7 ? ' mod-tabs--7' : '') + '" role="tablist" aria-label="학습 단계">' + tabsOf(m).map(function (t2, i) { var done = (t2[0] === 'theory' && c.learnDone) || (t2[0] === 'practice' && c.pracDone) || (t2[0] === 'quiz' && c.quizDone) || (t2[0] === 'lab' && labDone(m));
          return '<button type="button" role="tab" class="mod-tab' + (done ? ' done' : '') + '" data-mtab="' + t2[0] + '" aria-selected="' + (t2[0] === tab) + '"><span class="n">' + (done ? '✓' : i + 1) + '</span>' + t2[1] + '</button>'; }).join('') + '</div>' +
        '<div class="mod-body' + (s7 ? ' mod-body--7' : '') + '" data-tab="' + tab + '">' + body + '</div></div>';
    if (tab === 'practice') mountSim(m);
    if (tab === (s7 ? 'gear' : 'overview') && view.fig === '3d' && MODEL3D[m.overview.model]) mountViewer(MODEL3D[m.overview.model]);
    var tbar = root.querySelector('.mod-tabs'), atab = tbar && tbar.querySelector('.mod-tab[aria-selected="true"]');   // 2026-11-09: 좁은 화면에서 지금 단계 탭이 단계 줄 안에 보이게
    if (atab && tbar.scrollWidth > tbar.clientWidth) tbar.scrollLeft = Math.max(0, atab.offsetLeft - (tbar.clientWidth - atab.offsetWidth) / 2);
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
  /* 「한눈에 보기」 짝 맞추기 (2026-11-04): 왼쪽 단어 칸에 오른쪽 설명을 끌어다 놓기 · 또는 설명을 누르고 단어를 누르기 */
  function shuffleIdx(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); if (n < 2) return a; do { for (var j = n - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)), t = a[j]; a[j] = a[k]; a[k] = t; } } while (a.every(function (v, i) { return v === i; })); return a; }
  function matchHtml(items) {
    var order = shuffleIdx(items.length);
    return '<div class="mod-match" data-match="' + items.length + '" aria-label="한눈에 보기 — 단어와 설명 짝 맞추기">' +
      '<div class="mod-match__hd"><h3>한눈에 보기 <small>짝 맞추기</small></h3><span class="mod-match__score" aria-live="polite">0 / ' + items.length + '</span></div>' +
      '<p class="mod-match__hint">설명 카드를 끌어서 알맞은 단어 칸에 놓아요. 카드를 누른 뒤 단어 칸을 눌러도 돼요.</p>' +
      '<div class="mod-match__grid"><ol class="mod-match__terms">' + items.map(function (x, i) {
        return '<li class="mod-mrow" data-mi="' + i + '" tabindex="0" role="button" aria-label="' + esc(x[0]) + ' — 설명을 여기에 놓기"><b>' + esc(x[0]) + '</b><span class="mod-mslot">여기에 놓기</span></li>'; }).join('') + '</ol>' +
      '<div class="mod-match__cards">' + order.map(function (i) { return '<button type="button" class="mod-mcard" data-mi="' + i + '">' + esc(items[i][1]) + '</button>'; }).join('') + '</div></div>' +
      '<div class="mod-match__done" hidden><b>🎉 모두 맞혔어요!</b> <button type="button" class="mod-match__btn" data-match-reset="1">다시 하기</button></div>' +
      '<div class="mod-match__foot"><button type="button" class="mod-match__btn ghost" data-match-show="1">정답 보기</button><button type="button" class="mod-match__btn ghost" data-match-reset="1">섞어서 다시</button></div></div>';
  }
  var mSel = null, mDrag = null;
  function mBox(el) { return el && el.closest('.mod-match'); }
  function mScore(box) { var n = +box.getAttribute('data-match'), ok = box.querySelectorAll('.mod-mrow.ok').length; box.querySelector('.mod-match__score').textContent = ok + ' / ' + n; box.querySelector('.mod-match__done').hidden = ok < n; box.classList.toggle('all', ok >= n); }
  function mPlace(card, row) {
    var box = mBox(card); if (!box || !row || row.classList.contains('ok')) return;
    if (card.getAttribute('data-mi') === row.getAttribute('data-mi')) {
      row.classList.add('ok'); row.querySelector('.mod-mslot').textContent = card.textContent; row.setAttribute('aria-label', row.querySelector('b').textContent + ' — 맞았어요'); card.remove(); mScore(box);
    } else {
      row.classList.remove('bad'); void row.offsetWidth; row.classList.add('bad'); card.classList.remove('bad'); void card.offsetWidth; card.classList.add('bad');
      setTimeout(function () { row.classList.remove('bad'); card.classList.remove('bad'); }, 650);
    }
    mSelect(null);
  }
  function mSelect(card) { document.querySelectorAll('.mod-mcard.sel').forEach(function (c) { c.classList.remove('sel'); }); mSel = card; if (card) card.classList.add('sel'); document.querySelectorAll('.mod-match').forEach(function (b) { b.classList.toggle('picking', !!card && mBox(card) === b); }); }
  function mReset(box, show) {
    var items = [].map.call(box.querySelectorAll('.mod-mrow'), function (r) { return r.querySelector('b').textContent; }), n = items.length, descs = {};
    box.querySelectorAll('.mod-mcard').forEach(function (c) { descs[c.getAttribute('data-mi')] = c.textContent; });
    box.querySelectorAll('.mod-mrow.ok').forEach(function (r) { descs[r.getAttribute('data-mi')] = r.querySelector('.mod-mslot').textContent; });
    var data = items.map(function (t, i) { return [t, descs[i]]; }), fresh = document.createElement('div'); fresh.innerHTML = matchHtml(data); var nb = fresh.firstChild; box.replaceWith(nb);
    if (show) { nb.querySelectorAll('.mod-mcard').forEach(function (c) { mPlace(c, nb.querySelector('.mod-mrow[data-mi="' + c.getAttribute('data-mi') + '"]')); }); nb.classList.add('shown'); }
  }
  document.addEventListener('pointerdown', function (e) {
    var card = e.target.closest && e.target.closest('.mod-mcard'); if (!card || e.button > 0) return;
    mDrag = { card: card, x: e.clientX, y: e.clientY, ghost: null, id: e.pointerId, over: null };
  });
  document.addEventListener('pointermove', function (e) {
    if (!mDrag || e.pointerId !== mDrag.id) return;
    if (!mDrag.ghost) {
      if (Math.abs(e.clientX - mDrag.x) + Math.abs(e.clientY - mDrag.y) < 7) return;
      var r = mDrag.card.getBoundingClientRect(), g = mDrag.card.cloneNode(true); g.classList.add('ghost'); g.style.width = r.width + 'px'; g.style.left = r.left + 'px'; g.style.top = r.top + 'px';
      mDrag.dx = e.clientX - r.left; mDrag.dy = e.clientY - r.top; document.body.appendChild(g); mDrag.ghost = g; mDrag.card.classList.add('lift'); mSelect(null);
      try { mDrag.card.setPointerCapture(e.pointerId); } catch (x) { /* noop */ }
    }
    e.preventDefault();
    mDrag.ghost.style.left = (e.clientX - mDrag.dx) + 'px'; mDrag.ghost.style.top = (e.clientY - mDrag.dy) + 'px';
    var under = document.elementFromPoint(e.clientX, e.clientY), row = under && under.closest('.mod-mrow');
    if (row && mBox(row) !== mBox(mDrag.card)) row = null;
    if (mDrag.over && mDrag.over !== row) mDrag.over.classList.remove('over'); if (row && !row.classList.contains('ok')) row.classList.add('over'); mDrag.over = row;
    var vh = window.innerHeight; if (e.clientY < 70) window.scrollBy(0, -12); else if (e.clientY > vh - 50) window.scrollBy(0, 12);
  }, { passive: false });
  function mEnd(e) {
    if (!mDrag || (e && e.pointerId !== mDrag.id)) return; var d = mDrag; mDrag = null;
    if (!d.ghost) return;   // 끌지 않았으면 클릭으로 처리
    d.ghost.remove(); d.card.classList.remove('lift'); if (d.over) d.over.classList.remove('over');
    d.card.__dragged = true; setTimeout(function () { d.card.__dragged = false; }, 0);
    if (d.over) mPlace(d.card, d.over);
  }
  document.addEventListener('pointerup', mEnd); document.addEventListener('pointercancel', mEnd);
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    var card = t.closest('.mod-mcard'); if (card) { if (card.__dragged) return; mSelect(mSel === card ? null : card); return; }
    var row = t.closest('.mod-mrow'); if (row && mSel && mBox(row) === mBox(mSel)) { mPlace(mSel, row); return; }
    var rs = t.closest('[data-match-reset]'); if (rs) { mReset(mBox(rs)); return; }
    var sh = t.closest('[data-match-show]'); if (sh) { mReset(mBox(sh), true); return; }
  });
  document.addEventListener('keydown', function (e) { var row = e.target.closest && e.target.closest('.mod-mrow'); if (row && (e.key === 'Enter' || e.key === ' ') && mSel && mBox(row) === mBox(mSel)) { e.preventDefault(); mPlace(mSel, row); } });

  /* 기능부 설명 말풍선 (사진 구역 · 이름 단추 공용) */
  var zb = null, zPinned = null, zCur = null, zEl = null, zZoomEl = null, zTimer = 0;
  /* 2026-11-04: 구역을 누르면 그 부분으로 확대(움직이며), 같은 구역을 한 번 더 누르면 원래 보기로 */
  function zZoom(el) {
    var wrap = document.querySelector('#tabModule .mod-zoomwrap'); if (!wrap) return; zZoomEl = el || null;
    if (!el) { wrap.style.transform = ''; wrap.style.setProperty('--zs', 1); wrap.classList.remove('zoomed'); return; }
    var L = parseFloat(el.style.left) / 100, T = parseFloat(el.style.top) / 100, W = parseFloat(el.style.width) / 100, H = parseFloat(el.style.height) / 100;
    var sc = Math.max(1.25, Math.min(3, 0.78 / W, 0.78 / H));
    var tx = Math.min(0, Math.max(1 - sc, 0.5 - sc * (L + W / 2))), ty = Math.min(0, Math.max(1 - sc, 0.5 - sc * (T + H / 2)));
    wrap.style.transform = 'translate(' + (tx * 100).toFixed(3) + '%,' + (ty * 100).toFixed(3) + '%) scale(' + sc.toFixed(3) + ')'; wrap.style.setProperty('--zs', sc.toFixed(3)); wrap.classList.add('zoomed');
  }
  function zAfterMove() {   // 확대 움직임이 끝난 뒤 말풍선 자리 다시 잡기
    if (!zb) return; zb.style.visibility = 'hidden'; clearTimeout(zTimer);
    zTimer = setTimeout(function () { if (zb) { zb.style.visibility = ''; zPlace(); } }, window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 560);
  }
  function zSecs() { var m = MODS[view.mod], h = m && (GL[m.id] || {}).hero; return (h && h.zones && h.zones.secs) || {}; }
  function zHide(force) {
    if (zPinned && !force) return; zPinned = null; zCur = null; zEl = null; if (zb) zb.style.display = 'none'; if (zZoomEl) zZoom(null);
    document.querySelectorAll('#tabModule .mod-zone').forEach(function (d) { d.classList.remove('hl', 'main'); });
    document.querySelectorAll('#tabModule .mod-zchips button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
  }
  function zPlace() {
    if (!zb || zb.style.display !== 'block' || !zEl) return;
    var r = zEl.getBoundingClientRect(), bw = zb.offsetWidth, bh = zb.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) { zHide(true); return; }
    var x = Math.max(8, Math.min(vw - bw - 8, r.left + r.width / 2 - bw / 2)), below = r.bottom + bh + 14 < vh || r.top - bh - 14 < 0, y = below ? r.bottom + 10 : r.top - bh - 10;
    zb.style.left = x + 'px'; zb.style.top = y + 'px'; zb.classList.toggle('below', below); zb.classList.toggle('above', !below);
    zb.style.setProperty('--tail-x', Math.max(10, Math.min(bw - 22, r.left + r.width / 2 - x - 6)) + 'px');
  }
  function zShow(sec, el) {
    var d = zSecs()[sec]; if (!d) return;
    if (!zb) { zb = document.createElement('div'); zb.className = 'mod-zbub'; zb.id = 'modZoneBubble'; zb.setAttribute('role', 'dialog'); zb.setAttribute('aria-live', 'polite'); document.body.appendChild(zb); }
    var all = document.querySelectorAll('#tabModule .mod-zone[data-zsec="' + sec + '"]'); el = el || all[0]; if (!el) return;
    zCur = sec; zEl = el;
    var rr = el.getBoundingClientRect(); if (rr.top < 70 || rr.bottom > window.innerHeight - 20) el.scrollIntoView({ block: 'center' });   // 이름 단추로 열 때: 구역이 화면 밖이면 먼저 보이게
    document.querySelectorAll('#tabModule .mod-zone').forEach(function (z) { var me = z.getAttribute('data-zsec') === sec; z.classList.toggle('hl', me); z.classList.toggle('main', me && z === el); });
    document.querySelectorAll('#tabModule .mod-zchips button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-zsec') === sec)); });
    zb.innerHTML = '<button type="button" class="mod-zbub__x" aria-label="설명 닫기">×</button><b></b><p></p>';   // 2026-11-04: 「지금 가리킨 곳 · 같은 기능 N곳」 문구는 뺌
    zb.querySelector('b').textContent = d[0]; zb.querySelector('p').textContent = d[1];
    zb.style.display = 'block'; zPlace();
  }
  document.addEventListener('mouseover', function (e) { if (zPinned) return; var z = e.target.closest && e.target.closest('#tabModule .mod-zone'); if (z) zShow(z.getAttribute('data-zsec'), z); });
  document.addEventListener('mouseout', function (e) { if (zPinned) return; var z = e.target.closest && e.target.closest('#tabModule .mod-zone'), to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('#tabModule .mod-zone, .mod-zbub'); if (z && !to) zHide(); });
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    if (t.closest('.mod-zbub__x')) { zHide(true); return; }
    if (t.closest('.mod-zbub')) return;
    var z = t.closest('#tabModule .mod-zone, #tabModule .mod-zchips [data-zsec]');
    if (z) {
      var sec = z.getAttribute('data-zsec'), tz = z.classList.contains('mod-zone') ? z : document.querySelector('#tabModule .mod-zone[data-zsec="' + sec + '"]');
      if (zPinned === sec && zZoomEl === tz) { zHide(true); return; }   // 한 번 더 누르면 원래 보기
      zPinned = sec; zShow(sec, tz); zZoom(tz); zAfterMove(); return;
    }
    if (zPinned) zHide(true);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && zb && zb.style.display === 'block') zHide(true); });
  window.addEventListener('scroll', zPlace, { passive: true }); window.addEventListener('resize', zPlace);
  window.STAZones = { show: function (sec) { zPinned = sec; zShow(sec); return !!zEl; }, hide: function () { zHide(true); }, state: function () { var w = document.querySelector('#tabModule .mod-zoomwrap'); return { sec: zCur, pinned: zPinned, open: !!(zb && zb.style.display === 'block'), zoom: w ? +(getComputedStyle(w).getPropertyValue('--zs') || 1) : 1, zoomed: !!zZoomEl }; } };

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
    x32: { label: '3D 모델(Behringer X32)', need: 'BehringerX32', dir: [0.18, 0.95, 1], make: function () { return BehringerX32.create(); } },   // 2026-11-03: 공식 윗면·뒷면 사진 배치 기준
    /* 2026-11-04: 디지털 케이블 커넥터(절차적 모델) — [id, 버튼 이름, 설명, 카메라 방향, 거리 배수] */
    dconn: { label: '3D 모델(디지털 오디오 커넥터)', need: 'DigitalConnectors', dir: [0.6, 0.42, 1],
      variants: [['set', '한눈에 비교', '실제 크기 비율로 나란히', [0.1, 0.8, 1], 1.2], ['etherCON', 'etherCON', 'Dante · AES50 랜선의 잠금 커넥터'], ['RJ45', 'RJ45', '일반 랜선 플러그'], ['AES-XLR', 'AES/EBU', '110 Ω 디지털 XLR'], ['BNC', 'BNC', '75 Ω 동축 · 워드클럭 · MADI'], ['TOSLINK', '광(TOSLINK)', 'ADAT · S/PDIF 광'], ['USB-C', 'USB-C', '양면 · 둥근 타원'], ['USB-AB', 'USB A-B', 'A(컴퓨터) ↔ B(오디오 장비)', [0.25, 0.85, 1], 1.9]],
      make: function (v) { return DigitalConnectors.create({ variant: v }); } },
    /* 2026-11-08: 04-2 디지털 앰프 — 3층 장비 대신 일반 4채널 DSP 앰프(로고 · 모델명 없는 절차적 모델) */
    dbamp: { label: '3D 모델(일반 4채널 디지털 앰프)', need: 'GenericDspAmp', dir: [0.35, 0.28, 1], dist: 1.25,
      variants: [['screen', '화면형', '4채널 · 컬러 화면 · 다이얼'], ['led', 'LED형', '4채널 · 채널별 불빛 · 전원 버튼'], ['screen', '뒷면', '입력 · 출력 · 네트워크 · 전원 단자', [-0.45, 0.32, -1]]],
      toggleTxt: '전원 끄기', toggleLabel: function (on) { return on ? '전원 끄기' : '전원 켜기'; },
      make: function (v) { return GenericDspAmp.create({ variant: v }); }, toggle: function (m, on) { GenericDspAmp.api(m).setPower(on); } },
    /* 2026-11-08: 05-1 패시브 스피커 — 3층 장비 대신 일반 패시브 스피커(로고 · 모델명 없는 절차적 모델), 「속 보기」로 그릴 뒤 드라이버 */
    dbspk: { label: '3D 모델(일반 패시브 스피커)', need: 'GenericPassiveSpk', dir: [0.55, 0.3, 1], dist: 1.75,
      variants: [['12-2way', '12인치 2웨이', '우퍼 12인치 + 혼', [0.55, 0.3, 1], 1.75], ['8-2way', '8인치 2웨이', '작은 2웨이', [0.55, 0.32, 1], 1.75], ['15-2way', '15인치 2웨이', '우퍼 15인치 + 혼', [0.55, 0.3, 1], 1.75], ['sub18', '18인치 서브우퍼', '아주 낮은 소리 담당', [0.7, 0.5, 1], 1.8], ['column', '컬럼 스피커', '가늘고 긴 스피커', [0.5, 0.22, 1], 2.2]],
      toggleTxt: '속 보기(드라이버) 켜기', toggleLabel: function (on) { return on ? '속 보기(드라이버) 켜기' : '속 보기 끄기'; },
      make: function (v) { return GenericPassiveSpk.create({ variant: v }); }, toggle: function (m, on) { GenericPassiveSpk.api(m).setXray(!on); } },
    zxa1: { label: '3D 모델(EV ZXA1)', need: 'EvZXA1', dir: [0.5, 0.2, 1], make: function () { return EvZXA1.create(); } }
  };
  function mountViewer(def) {
    var el = document.querySelector('#tabModule [data-role=viewer]'); if (!el) return;
    if (!window.THREE || !window[def.need] || !THREE.OrbitControls) { el.querySelector('.mod-viewer__msg').textContent = '3D 모델을 불러오지 못했어요.'; return; }
    var w = el.clientWidth || 360, h = el.clientHeight || 300, r;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { el.querySelector('.mod-viewer__msg').textContent = '이 기기에서는 3D 를 표시할 수 없어요.'; return; }
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(w, h); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.2;
    var vv = def.variants ? def.variants[Math.min(view.var3d || 0, def.variants.length - 1)] : null, dir = (vv && vv[3]) || def.dir, dk = (vv && vv[4]) || def.dist || 1.6;
    var obj; try { obj = def.make(vv ? vv[0] : undefined); } catch (e) { el.querySelector('.mod-viewer__msg').textContent = '3D 모델을 만들지 못했어요.'; r.dispose(); return; }
    el.innerHTML = ''; el.appendChild(r.domElement);
    var sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xdfeaff, 0x1a2333, 0.9)); var k = new THREE.DirectionalLight(0xffffff, 2); k.position.set(2, 3, 3); sc.add(k); var rim = new THREE.DirectionalLight(0x7cc4ff, 1.4); rim.position.set(-3, 2, -2); sc.add(rim);
    sc.add(obj);
    var bb = new THREE.Box3().setFromObject(obj), ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()).length();
    var cam = new THREE.PerspectiveCamera(32, w / h, sz * 0.01, sz * 20); cam.position.copy(ctr).add(new THREE.Vector3(dir[0], dir[1], dir[2]).normalize().multiplyScalar(sz * dk));
    var ctl = new THREE.OrbitControls(cam, r.domElement); ctl.target.copy(ctr); ctl.enableDamping = true; ctl.autoRotate = true; ctl.autoRotateSpeed = 1.6; ctl.enablePan = false; ctl.minDistance = sz * 0.6; ctl.maxDistance = sz * 3; ctl.update();
    var on = true, alive = true;
    r.domElement.addEventListener('pointerdown', function () { ctl.autoRotate = false; });
    (function loop() { if (!alive) return; requestAnimationFrame(loop); var tabEl = $('tabModule'); if (!tabEl || !tabEl.classList.contains('active')) return; ctl.update(); r.render(sc, cam); })();
    viewer = { def: def, toggle: function () { on = !on; if (def.toggle) def.toggle(obj, on); return on; }, destroy: function () { alive = false; sc.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); r.dispose(); }, isOn: function () { return on; }, object: obj };
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
    syncNav();
  }
  function syncGroups() { var act = document.querySelector('.tab-content.active'); if (!act || act.id === 'tabPath' || act.id === 'tabModule') return;
    document.querySelectorAll('.nav-mod').forEach(function (b) { b.classList.remove('active'); b.removeAttribute('aria-current'); });
    document.querySelectorAll('.tab-group').forEach(function (g) { g.classList.remove('active'); g.classList.remove('in'); });   // 2026-11-09: 실습 탭은 이제 「가상 실습실」 아래라 경로 머리에 표시하지 않음
    syncNav(); }
  /* ------------------------------------------------------------- 2026-11-09 내부 화면 재구성(1차): 메뉴 계층
     학습 홈 · 학습 로드맵 · 이론 학습(물리음향 · 음향 장비 학습 · 믹싱 스킬) · 가상 실습실 · 현장 및 문제 해결 · 참고 자료
     - 기존 메뉴 버튼(.tab-btn · onclick="switchTab(…)")은 그대로 옮겨 담기만 함 → ID · 함수 · 이벤트 그대로
     - 상위 묶음은 눌러서 열고 닫음. 지금 보는 화면이 든 묶음은 저절로 열리고 표시(cur)
     - 「음향의 중요성」은 학습 로드맵의 첫 단계(메뉴에서는 학습 로드맵이 표시됨) */
  var NAV_SVG = function (d) { return '<svg class="tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var NAV_CATS = [
    { id: 'theory', title: '이론 학습', ico: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>', paths: ['physics', 'hardware', 'mixing'] },
    { id: 'lab', title: '가상 실습실', ico: '<path d="M6 3.5v17M12 3.5v17M18 3.5v17"/><rect x="4" y="13" width="4" height="3" rx="0.8"/><rect x="10" y="7" width="4" height="3" rx="0.8"/><rect x="16" y="11" width="4" height="3" rx="0.8"/>', tabs: ['tabPracMic', 'tabPracCable', 'tab6', 'tabPracSpk', 'tab1', 'tab5', 'tab3'] },
    { id: 'field', title: '현장 및 문제 해결', ico: '<path d="M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>', tabs: ['tab2', 'tab7', 'tabFeedback', 'tabCheck'] },
    { id: 'refs', title: '참고 자료', ico: '<path d="M6 3h12v18l-6-4-6 4z"/>', tabs: ['tabBrands', 'tabTips', 'tabMixVideo'] }
  ];
  window.STA_NAV_CATS = NAV_CATS;   // 쪽 머리(현재 위치) · 학습 홈 · 로드맵이 같은 분류를 씀
  var CHEV = '<svg class="nav-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  function setCat(w, open) { if (!w || w.classList.contains('open') === !!open) return; var b = w.querySelector('.nav-cat__btn'), body = w.querySelector('.nav-cat__body');
    w.classList.toggle('open', !!open); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false'); if (body) body.hidden = !open; }
  function setPathOpen(pw, open) { if (!pw || pw.classList.contains('open') === !!open) return; pw.classList.toggle('open', !!open);
    var t = pw.querySelector('.nav-path__tog'); if (t) t.setAttribute('aria-expanded', open ? 'true' : 'false'); var ms = pw.querySelector('.nav-path__mods'); if (ms) ms.hidden = !open; }
  function navAct(nav) {   // 지금 보는 화면에 해당하는 메뉴 항목 하나
    return nav.querySelector('.nav-cat .tab-btn.active') || nav.querySelector('.nav-mod.active') || nav.querySelector('.tab-group.active') || nav.querySelector(':scope > .tab-btn.active') || null;
  }
  var navLast;
  function syncNav() {
    var nav = document.querySelector('.site-header .tab-nav'); if (!nav || !nav.querySelector('.nav-cat')) return;
    var act = navAct(nav), road = nav.querySelector('.tab-btn[data-tab="tabRoadmap"]'), intro = $('tabIntro');
    if (road) { var on = !!(intro && intro.classList.contains('active')); if (road.classList.contains('cur') !== on) road.classList.toggle('cur', on); }   // 음향의 중요성 = 학습 로드맵 첫 단계
    var moved = act !== navLast; navLast = act;   // 다른 화면으로 옮겨 가면 그 화면의 묶음만 열고 나머지는 접음(직접 연 묶음은 다음 이동 때까지 그대로)
    nav.querySelectorAll('.nav-cat').forEach(function (w) { var has = !!(act && w.contains(act)); if (w.classList.contains('cur') !== has) w.classList.toggle('cur', has); if (has || moved) setCat(w, has); });
    nav.querySelectorAll('.nav-path').forEach(function (pw) { var has = !!(act && pw.contains(act)); if (pw.classList.contains('cur') !== has) pw.classList.toggle('cur', has); if (has || moved) setPathOpen(pw, has); });
    if (window.STAPageHead) window.STAPageHead();
  }
  /* 2026-11-09 공통 쪽 머리: 지금 위치(학습 홈 › 묶음 › 화면). 과정 · 경로 · 레슨 · 학습 홈은 자기 머리가 있어 빼고, 나머지 화면 맨 위에 넣음 */
  function tabLabel(t) { var b = document.querySelector('.tab-btn[data-tab="' + t + '"] span'); return b ? b.textContent.trim() : ''; }
  function catOfTab(t) { return NAV_CATS.find(function (c) { return (c.tabs || []).indexOf(t) >= 0; }); }
  function whereTrail() {
    var act = document.querySelector('.tab-content.active'), id = act && act.id;
    if (!id || id === 'tabHome') return ['학습 홈'];
    if (id === 'tabRoadmap') return ['학습 로드맵'];
    if (id === 'tabIntro') return ['학습 로드맵', tabLabel('tabIntro') || '음향의 중요성'];
    if (id === 'tabModule' && MODS[view.mod]) { var m = MODS[view.mod], p = pathById(m.path); return ['이론 학습', p ? p.title : '', noTxt(m) + '. ' + m.title]; }
    if (id === 'tabPath' && pathById(view.path)) return ['이론 학습', pathById(view.path).title];
    if (id === 'tabLesson') return ['이론 학습', '기초 레슨'];
    var c = catOfTab(id); return c ? [c.title, tabLabel(id)] : [tabLabel(id)];
  }
  window.STA_WHERE = whereTrail;
  var HEAD_SKIP = { tabHome: 1, tabModule: 1, tabPath: 1, tabLesson: 1 };
  function pageHead() {
    var act = document.querySelector('.tab-content.active'); if (!act || HEAD_SKIP[act.id]) return;
    var tr = whereTrail(), el = act.querySelector(':scope > .page-crumb');
    var h = '<button type="button" data-crumb-go="tabHome">학습 홈</button>' + tr.map(function (x, i) {
      var last = i === tr.length - 1; if (last) return '<span aria-hidden="true">›</span><b aria-current="page">' + esc(x) + '</b>';
      if (x === '학습 로드맵') return '<span aria-hidden="true">›</span><button type="button" data-crumb-go="tabRoadmap">' + esc(x) + '</button>';
      var c = NAV_CATS.find(function (k) { return k.title === x; });
      return '<span aria-hidden="true">›</span>' + (c ? '<button type="button" data-crumb-cat="' + c.id + '">' + esc(x) + '</button>' : '<span>' + esc(x) + '</span>');
    }).join('');
    if (!el) { el = document.createElement('nav'); el.className = 'page-crumb lsn-crumb'; el.setAttribute('aria-label', '현재 위치'); act.insertBefore(el, act.firstChild); }
    if (el.innerHTML !== h) el.innerHTML = h;
  }
  window.STAPageHead = pageHead;
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.page-crumb [data-crumb-go], .page-crumb [data-crumb-cat]'); if (!t) return;
    var go = t.getAttribute('data-crumb-go');
    if (go) { if (go === 'tabHome' && window.STALessons) STALessons.home(); else if (typeof switchTab === 'function') switchTab(go); try { window.scrollTo(0, 0); } catch (x) { /* noop */ } return; }
    // 묶음 이름: 학습 홈의 그 묶음 칸으로
    var cat = t.getAttribute('data-crumb-cat'); if (window.STALessons) STALessons.home();
    setTimeout(function () { var sec = document.getElementById(cat === 'theory' ? 'modHome' : 'home-' + cat); if (sec) sec.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60);
  });
  function buildNav() {
    var nav = document.querySelector('.site-header .tab-nav'); if (!nav || nav.__staBuilt) return; nav.__staBuilt = true;
    if (nav.querySelector('.nav-cat, .nav-rest')) {   // 2026-11-09: 편집 모드 「저장」으로 내려받은 index.html 은 이미 묶인 메뉴를 담고 있음 → 원래 버튼만 꺼내 다시 묶음(이벤트 연결)
      Array.prototype.slice.call(nav.querySelectorAll('.tab-btn')).forEach(function (x) { nav.appendChild(x); });
      Array.prototype.slice.call(nav.querySelectorAll('.nav-cat, .nav-rest')).forEach(function (x) { x.remove(); });
    }
    var byTab = function (t) { return nav.querySelector('.tab-btn[data-tab="' + t + '"]'); };
    var frag = document.createDocumentFragment();
    ['tabHome', 'tabRoadmap'].forEach(function (t) { var b = byTab(t); if (b) { b.classList.add('nav-top'); frag.appendChild(b); } });
    var ico = { physics: '<path d="M2 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0"/><path d="M20 12h2"/>', hardware: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>', mixing: '<path d="M6 4v16M12 4v16M18 4v16"/><rect x="4" y="13" width="4" height="3"/><rect x="10" y="7" width="4" height="3"/><rect x="16" y="11" width="4" height="3"/>' };
    NAV_CATS.forEach(function (c) {
      var w = document.createElement('div'); w.className = 'nav-cat'; w.setAttribute('data-cat', c.id);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'nav-cat__btn'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'navcat-' + c.id);
      b.innerHTML = NAV_SVG(c.ico) + '<span>' + esc(c.title) + '</span>' + CHEV;
      var body = document.createElement('div'); body.className = 'nav-cat__body'; body.id = 'navcat-' + c.id; body.hidden = true;
      (c.paths || []).forEach(function (pid) { var p = pathById(pid); if (!p) return;
        var pw = document.createElement('div'); pw.className = 'nav-path'; pw.setAttribute('data-navpath-wrap', p.id);
        var g = document.createElement('button'); g.type = 'button'; g.className = 'tab-group'; g.setAttribute('data-navpath', p.id);
        g.innerHTML = NAV_SVG(ico[p.id] || '') + '<span>' + esc(p.title) + '</span>';
        g.addEventListener('click', function () { setPathOpen(pw, true); openPath(p.id); });
        var tg = document.createElement('button'); tg.type = 'button'; tg.className = 'nav-path__tog'; tg.setAttribute('aria-expanded', 'false'); tg.setAttribute('aria-label', p.title + ' 과정 목록 펼치기 · 접기'); tg.innerHTML = CHEV;
        tg.addEventListener('click', function () { setPathOpen(pw, !pw.classList.contains('open')); });
        var row = document.createElement('div'); row.className = 'nav-path__row'; row.appendChild(g); row.appendChild(tg);
        var ms = document.createElement('div'); ms.className = 'nav-path__mods'; ms.hidden = true;
        (p.modules || []).forEach(function (id) { var m = MODS[id]; if (!m || m.status !== 'ready') return;
          var mb = document.createElement('button'); mb.type = 'button'; mb.className = 'nav-mod'; mb.setAttribute('data-module', id);
          mb.innerHTML = '<span class="nav-mod__n" aria-hidden="true">' + NAV_PLAY + '</span><span>' + noTxt(m) + '. ' + esc(m.title) + '</span>';
          ms.appendChild(mb); });
        pw.appendChild(row); pw.appendChild(ms); body.appendChild(pw); });
      (c.tabs || []).forEach(function (t) { var tb = byTab(t); if (tb) { tb.classList.add('tab-sub'); body.appendChild(tb); } });
      b.addEventListener('click', function () { setCat(w, !w.classList.contains('open')); });
      w.appendChild(b); w.appendChild(body); frag.appendChild(w);
    });
    var rest = document.createElement('div'); rest.className = 'nav-rest'; rest.hidden = true;   // 메뉴에 따로 안 보이는 버튼(음향의 중요성 등) — switchTab 이 찾을 수 있게 남겨 둠
    Array.prototype.slice.call(nav.querySelectorAll(':scope > .tab-btn')).forEach(function (x) { rest.appendChild(x); });
    nav.appendChild(frag); nav.appendChild(rest);
    if (window.MutationObserver) { var q = 0; new MutationObserver(function (ms) {
      if (!ms.some(function (r) { var t = r.target; return t.classList && (t.classList.contains('tab-btn') || t.classList.contains('nav-mod') || t.classList.contains('tab-group')); })) return;
      if (q) return; q = requestAnimationFrame(function () { q = 0; syncNav(); }); }).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] }); }
    syncNav();
  }
  function switchTo(id) { if (typeof switchTab === 'function') switchTab(id); markHomeNav(); try { window.scrollTo(0, 0); } catch (e) { /* noop */ } }
  function openPath(id) { if (!pathById(id)) return; view.path = id; hideBack(); destroySim(); destroyViewer(); switchTo('tabPath'); renderPath(); setHash('path-' + id); focusTitle(); }
  function openModule(id, tab, find) {
    var m = MODS[id]; if (!m || m.status !== 'ready') return;
    if (tab === 'practice' && noPrac(m) && pageOf(id)) { openPrac(pageOf(id), id); return; }   // 예전 주소(#module-mic-practice)는 실습 탭으로
    if (view.mod !== id) { view.fig = 'photo'; view.var3d = 0; }
    var asked = tab; tab = alias7(m, tab); if (tab === 'practice' && is7(m) && noPrac(m)) tab = 'lab';   // 예전 실습 주소(실습 탭이 없는 과정) → 직접 실습 단계
    view.mod = id; view.path = m.path; view.tab = tab && tabsOf(m).some(function (t2) { return t2[0] === tab; }) ? tab : defTab(m);
    var s = st(id); if (!s.opened) { s.opened = true; put(id, s); }
    hideBack(); switchTo('tabModule'); renderModule(); setHash('module-' + id + (view.tab !== defTab(m) ? '-' + view.tab : '')); focusTitle();
    if (toDeeper(m, asked)) scrollToId('modDeeper');
    if (find && view.tab === 'theory') { var sec = Array.prototype.find.call(document.querySelectorAll('#tabModule .mod-sec'), function (x) { return x.querySelector('.mod-sec__h').textContent.indexOf(find) >= 0; });
      if (sec) setTimeout(function () { sec.scrollIntoView({ block: 'start', behavior: 'smooth' }); sec.classList.add('mod-sec--focus'); setTimeout(function () { sec.classList.remove('mod-sec--focus'); }, 2200); }, 80); }
  }
  /* 2026-10-24 피드백: 다음 단계로 넘어가도 화면이 아래쪽에 머무는 일이 있었음 → 탭을 바꾸면 항상 탭 줄이 화면 맨 위(상단 바 바로 아래)로 오게 */
  function scrollToTabs() {
    var tb = document.querySelector('#tabModule .mod-tabs'); if (!tb) return;
    var hdr = document.querySelector('.site-header'), off = 0;
    if (hdr && getComputedStyle(hdr).position === 'sticky') off = hdr.getBoundingClientRect().height;
    var prev = tb.style.position; tb.style.position = 'static';   // 붙어 있는(sticky) 줄은 붙은 자리가 측정되므로, 잠깐 떼어 원래 자리를 잼
    var y = tb.getBoundingClientRect().top + window.scrollY - off - 8; tb.style.position = prev;
    try { window.scrollTo({ top: Math.max(0, y), behavior: 'auto' }); } catch (e) { window.scrollTo(0, Math.max(0, y)); }
  }
  function setTab(tab) { var m = MODS[view.mod], asked = tab; tab = alias7(m, tab); view.tab = tab; renderModule(); setHash('module-' + view.mod + (view.tab !== defTab(m) ? '-' + view.tab : '')); scrollToTabs(); if (toDeeper(m, asked)) scrollToId('modDeeper'); }
  function scrollToId(id) { setTimeout(function () { var el = $(id); if (el) el.scrollIntoView({ block: 'start' }); }, 30); }
  function labDone(m) { var pp = pracPageOf(m); return !!(pp && pp[1] === m.id && pracCounts(m).done); }
  function focusTitle() { var t2 = $('modTitle'); if (t2) { t2.setAttribute('tabindex', '-1'); try { t2.focus({ preventScroll: true }); } catch (e) { /* noop */ } } }
  var hashLock = false;
  function setHash(h) { if (window.STAHistory) { STAHistory.record(); return; } hashLock = true; try { history.replaceState(null, '', '#' + h); } catch (e) { location.hash = h; } setTimeout(function () { hashLock = false; }, 0); }
  function fromHash() {
    var h = location.hash || '', m;
    if ((m = /^#path-([\w-]+)$/.exec(h))) { openPath(m[1]); return true; }
    if ((m = /^#module-([\w-]+?)(?:-(overview|theory|practice|quiz|missions|deeper|goal|gear|lab|result))?$/.exec(h))) { openModule(m[1], m[2]); return true; }
    return false;
  }
  function showBack() {
    var b = $('modBack'); if (!b) { b = document.createElement('button'); b.type = 'button'; b.id = 'modBack'; b.className = 'lsn-back mod-back'; document.body.appendChild(b); }
    var m = MODS[view.mod]; if (!m) return; backTo = { id: m.id, tab: view.tab }; b.textContent = '📘 「' + m.title + '」 모듈로 돌아가기'; b.hidden = false;
  }
  function hideBack() { var b = $('modBack'); if (b) b.hidden = true; }
  function go(goObj) { if (!goObj) return; destroySim(); destroyViewer(); if (goObj.tab && window.STALessons && STALessons.openPractice) { STALessons.openPractice(goObj); var lb = $('lsnBack'); if (lb) lb.hidden = true; showBack(); } }
  /* ------------------------------------------------------------- 실습 탭 (2026-11-08)
     메뉴 「음향 장비 학습 › 실습」의 01~04 탭: 과정마다 있던 실습 화면 + 과제 목록을 그대로 옮겨 와 보여 줌
     - 탭이 둘 이상이면 위에 고르는 줄(유선 / 무선, MG12XU / X32)
     - 과정 id 가 '#…' 인 칸은 index.html 에 원래 있던 화면([data-prac-static])을 그대로 보여 줌 */
  var prac = { tab: null, part: {}, sim: null };
  function destroyPracSim() { if (prac.sim) { try { prac.sim.destroy(); } catch (e) { /* noop */ } prac.sim = null; } }
  function pracParts(cfg) { return (cfg.parts || []).filter(function (p) { return p[0].charAt(0) === '#' || (MODS[p[0]] && MODS[p[0]].status === 'ready'); }); }
  function stopMg12() { try { if (typeof mg12xuAudioOn !== 'undefined' && mg12xuAudioOn && typeof toggleMg12xuAudio === 'function') toggleMg12xuAudio(); } catch (e) { /* noop */ } }
  function partBtn(p, i, cur) { var m = MODS[p[0]], pc = m ? pracCounts(m) : null, done = !!(pc && pc.done);
    return '<button type="button" role="tab" class="prac-part' + (done ? ' done' : '') + '" data-prac-part="' + p[0] + '" aria-selected="' + (p[0] === cur) + '"><span class="n">' + (done ? '✓' : i + 1) + '</span><span class="t">' + esc(p[1]) + '</span>' + (pc ? '<small>' + pc.d + '/' + pc.n + '</small>' : '') + '</button>'; }
  function renderPrac(tabId) {
    var cfg = PRAC[tabId], el = $(tabId), host = el && el.querySelector('[data-prac-host]'); if (!cfg || !host) return;
    var parts = pracParts(cfg); if (!parts.length) return;
    destroyPracSim(); prac.tab = tabId;
    var cur = prac.part[tabId]; if (!parts.some(function (p) { return p[0] === cur; })) cur = prac.part[tabId] = parts[0][0];
    var part = parts.find(function (p) { return p[0] === cur; }), m = cur.charAt(0) === '#' ? null : MODS[cur], stat = el.querySelector('[data-prac-static]');
    var h = (cfg.staticHead ? '' : '<div class="level-header"><div class="level-title">' + esc(cfg.no) + '. ' + esc(cfg.title) + '</div>' + (cfg.desc ? '<div class="level-desc">' + esc(cfg.desc) + '</div>' : '') + '</div>') +
      (parts.length > 1 ? '<div class="prac-parts" role="tablist" aria-label="실습 고르기">' + parts.map(function (p, i) { return partBtn(p, i, cur); }).join('') + '</div>' : '');
    if (m) h += '<section class="prac-body"><div class="prac-body__head"><h2>' + esc(part[1]) + ' 실습</h2><button type="button" class="prac-golink" data-module="' + m.id + '">📘 ' + noTxt(m) + '. ' + esc(m.title) + ' 과정 보기</button></div>' + pracBody(m) + '</section>';
    host.setAttribute('data-cur', cur); host.innerHTML = h;
    if (stat) stat.hidden = !!m;
    if (m) { stopMg12(); var sel = host.querySelector('[data-role=sim]'), fn = SIMS[m.practice.kind];
      if (!fn) sel.innerHTML = '<p class="mod-note">실습 화면을 불러오지 못했어요.</p>';
      else prac.sim = fn(sel, { onTask: function (id) { var s = st(m.id); if (s.tasks[id]) return; s.tasks[id] = true; put(m.id, s); refreshPrac(tabId, m); } }); }
  }
  function refreshPrac(tabId, m) {
    var el = $(tabId); if (!el) return; var s = st(m.id), pc = pracCounts(m);
    el.querySelectorAll('.prac-body .mod-tasks li').forEach(function (li) { var d = !!s.tasks[li.getAttribute('data-task')]; li.classList.toggle('done', d); li.querySelector('.mod-task__ck').textContent = d ? '✓' : ''; });
    var h3 = el.querySelector('.prac-body .mod-tasks h3 small'); if (h3) h3.textContent = pc.d + '/' + pc.n;
    var tasks = el.querySelector('.prac-body .mod-tasks'); if (tasks && pc.done && !tasks.querySelector('.mod-okline')) { var sm = tasks.querySelector('.mod-small'); if (sm) sm.outerHTML = '<div class="mod-okline" role="status">🎉 실습 과제를 모두 마쳤어요. <b>실습 완료</b>!</div>'; }
    var pb = el.querySelector('.prac-part[data-prac-part="' + m.id + '"]'); if (pb) { var sm2 = pb.querySelector('small'); if (sm2) sm2.textContent = pc.d + '/' + pc.n; if (pc.done) { pb.classList.add('done'); pb.querySelector('.n').textContent = '✓'; } }
  }
  function openPrac(tabId, part) { var cfg = PRAC[tabId]; if (!cfg || !$(tabId)) return; if (part) prac.part[tabId] = part; hideBack(); destroySim(); destroyViewer();
    if ($(tabId).classList.contains('active')) renderPrac(tabId); else if (typeof switchTab === 'function') switchTab(tabId);   // 탭이 켜지면 watchPrac 가 그림
    try { window.scrollTo(0, 0); } catch (e) { /* noop */ } }
  function watchPrac() {
    Object.keys(PRAC).forEach(function (k) { var el = $(k); if (!el || !PRAC[k].parts || !window.MutationObserver) return;
      var was = el.classList.contains('active');
      new MutationObserver(function () { var on = el.classList.contains('active'); if (on === was) return; was = on;
        if (on) renderPrac(k); else if (prac.tab === k) { destroyPracSim(); prac.tab = null; } }).observe(el, { attributes: true, attributeFilter: ['class'] });
      if (was) renderPrac(k); });
  }
  /* ------------------------------------------------------------- 이벤트 */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var pc = t.closest('#tabHome [data-path], #tabPath [data-path], #tabModule [data-path], #tabRoadmap [data-path]'); if (pc && !pc.closest('[aria-disabled="true"]')) { openPath(pc.getAttribute('data-path')); return; }
    var mc = t.closest('[data-module]'); if (mc) { if (mc.getAttribute('aria-disabled') === 'true') return; openModule(mc.getAttribute('data-module')); return; }
    if (t.closest('#modBack')) { if (backTo) openModule(backTo.id, backTo.tab); return; }
    var hm = t.closest('[data-modhome]'); if (hm) { hideBack(); destroySim(); destroyViewer(); if (window.STALessons) STALessons.home(); if (hm.getAttribute('data-modhome') === 'paths') setTimeout(function () { var s = $('modHome'); if (s) s.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 50); if (!window.STAHistory) { try { history.replaceState(null, '', location.pathname + location.search); } catch (err) { /* noop */ } } return; }
    var po = t.closest('[data-prac-open]'); if (po) { var pp2 = po.getAttribute('data-prac-open').split(':'); openPrac(pp2[0], pp2[1]); return; }
    var pt = t.closest('[data-prac-part]'); if (pt) { var tc = pt.closest('.tab-content'); if (tc) { var y2 = window.scrollY; prac.part[tc.id] = pt.getAttribute('data-prac-part'); renderPrac(tc.id); window.scrollTo(0, y2); } return; }
    var gt = t.closest('[data-mgo-tab]'); if (gt) { if (typeof switchTab === 'function') switchTab(gt.getAttribute('data-mgo-tab')); window.scrollTo(0, 0); return; }
    if (!t.closest('#tabModule')) return;
    var tb = t.closest('[data-mtab]'); if (tb) { setTab(tb.getAttribute('data-mtab')); return; }
    var th = t.closest('[data-mtheory]'); if (th) { var ti = +th.getAttribute('data-mtheory'); setTab('theory'); var sec = $('modSec' + ti); if (sec) { sec.scrollIntoView({ block: 'start', behavior: 'smooth' }); sec.classList.add('mod-sec--focus'); setTimeout(function () { sec.classList.remove('mod-sec--focus'); }, 2200); } return; }
    var fg = t.closest('[data-mfig]'); if (fg) { var y0 = window.scrollY; view.fig = fg.getAttribute('data-mfig') === '3d' ? '3d' : 'photo'; renderModule(); window.scrollTo(0, y0); return; }
    var mg = t.closest('[data-mgo]'); if (mg) { var pr = mg.getAttribute('data-mgo').split(':'), m = MODS[view.mod]; var item = pr[0] === 'practice' ? m.practice.links[+pr[1]] : m.missions[+pr[1]]; showBack(); go(item.go); return; }
    var mv = t.closest('[data-mvar]'); if (mv) { var y1 = window.scrollY; view.var3d = +mv.getAttribute('data-mvar') || 0; renderModule(); window.scrollTo(0, y1); return; }   // 2026-11-04: 3D 제품 바꾸기(앰프 40D/10D · 스피커 · 커넥터)
    var vw = t.closest('[data-mviewer]'); if (vw && viewer) { var on = viewer.toggle(), dd = viewer.def || {}; vw.textContent = dd.toggleLabel ? dd.toggleLabel(on) : on ? '스위치 ON/OFF (지금 켜짐)' : '스위치 ON/OFF (지금 꺼짐)'; vw.setAttribute('aria-pressed', String(!on)); return; }
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
    watchPrac();
    fromHash();
    window.addEventListener('hashchange', function () { if (!hashLock) fromHash(); });
  }
  window.STAModules = { homeHtml: homeHtml, openPath: openPath, openModule: openModule, setTab: setTab, state: function (id) { return st(id); }, counts: function (id) { return counts(MODS[id]); }, status: function (id) { return status(MODS[id]); },
    reset: function () { save({}); }, sim: function () { return sim; }, pracSim: function () { return prac.sim; }, openPrac: openPrac, pracCounts: function (id) { return pracCounts(MODS[id]); }, setPracPart: function (tab, part) { prac.part[tab] = part; var el = $(tab); if (el && el.classList.contains('active')) renderPrac(tab); }, viewer: function () { return viewer; }, view: function () { return view; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
