/* =============================================================================
   전체 학습 과정 — 학습 경로(#tabPath) + 학습 모듈(#tabModule) 화면 (2026-10-20)
   - 데이터: lessons/modules_data.js (STA_PATHS, STA_MODULES, STA_WEEK_MODULES)
   - 그림: lessons/modules_visuals.js (STAVisuals), 실습: lessons/modules_sims.js (STASims)
   - 홈(lessons.js renderHome)에 「전체 학습 과정」 경로 카드를 끼워 넣고, 경로·모듈 화면은 이 파일이 그림
   - 진행 상태: localStorage 'soundTrainerModules_v1' — 학습 완료(개념 체크) / 실습 완료(과제) / 이해도 확인(문제)을 따로 저장
     모듈을 열기만 하거나 탭을 누른 것은 완료로 치지 않음
   - 주소: #path-hardware, #module-mic, #module-gain-structure-practice
   ============================================================================= */
(function () {
  'use strict';
  var PATHS = window.STA_PATHS || [], MODS = window.STA_MODULES || {}, VIS = window.STAVisuals || {}, SIMS = window.STASims || {};
  var KEY = 'soundTrainerModules_v1';
  var TABS = [['overview', '학습 개요'], ['theory', '이론 학습'], ['practice', '실습하기'], ['quiz', '확인 문제'], ['missions', '관련 미션'], ['deeper', '심화 학습']];
  var PRACTICE_INFO = {
    tab1: ['확성 시스템 기초', '세 가지 연결 구성을 3D 로 직접 연결해 봅니다.', 'vi10p.jpg'],
    tab6: ['MG12XU 실습', '실제 콘솔 사진 위에서 연결하고, 소리를 들으며 조작합니다.', 'console_strip.jpg'],
    tab5: ['CL5 콘솔 트레이닝', '예배 식순에 맞춰 채널을 켜고 DCA 를 다룹니다.', 'cl5_top.jpg'],
    tab2: ['3층 음향 시스템', '실제 설치 위치와 신호가 지나는 길을 3D 로 봅니다.', '40D.jpg'],
    tab7: ['음향 트러블슈팅', '고장 증상을 보고 원인을 찾아 고칩니다.', 'jack_strip.jpg'],
    tab3: ['Ear Training', '볼륨 변화, 대역별 소리, 밸런스를 귀로 훈련합니다.', '']
  };
  var view = { path: null, mod: null, tab: 'overview' }, sim = null, viewer = null, backTo = null;

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
    if (p.practice) return p.practice.length + '개 실습';
    var ms = p.modules.map(function (id) { return MODS[id]; }).filter(Boolean), mins = ms.reduce(function (a, m) { return a + (m.minutes || 0); }, 0);
    return ms.length + '개 과정 · ' + minutesTxt(mins);
  }
  function pathProgress(p) {
    if (p.practice) return null;
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
      '<div class="mod-side-box tip"><h3>💡 추천 학습 순서</h3><p>' + esc(p.tip || '실습 카드를 차례로 열어 배운 것을 적용해 보세요.') + '</p></div></aside></section>';
    if (p.prereq) h += '<section class="home-sec"><div class="home-sec-head"><h2>먼저 배울 것 (선수 학습)</h2></div><div class="mod-prereq">' + p.prereq.map(function (id) {
      var l = lessonById(id); if (!l) return ''; var ready = l.status === 'ready', d = lessonDone(id);
      return '<button type="button" class="mod-pre' + (d ? ' done' : '') + '" data-lesson="' + l.id + '"' + (ready ? '' : ' aria-disabled="true"') + '><b>' + (d ? '✓ ' : '📘 ') + esc(l.title) + '</b><span>' + (ready ? (d ? '완료' : '기초 이론 레슨 · 약 ' + l.minutes + '분') : '준비 중') + '</span></button>'; }).join('') + '</div></section>';
    if (p.modules) h += '<section class="home-sec"><div class="home-sec-head"><h2>' + esc(p.title) + ' 과정</h2><span class="mod-home-sub">' + (pr ? pr.ready + '개 과정을 지금 배울 수 있어요. 나머지는 같은 구조로 준비 중이에요.' : '') + '</span></div><div class="mod-cards">' + p.modules.map(function (id) { return MODS[id] ? modCard(MODS[id]) : ''; }).join('') + '</div></section>';
    if (p.practice) h += '<section class="home-sec"><div class="home-sec-head"><h2>실전 훈련</h2></div><div class="home-cards">' + p.practice.map(function (tab) { var i = PRACTICE_INFO[tab];
      return '<button type="button" class="home-card" data-mgo-tab="' + tab + '"><div class="home-card__thumb">' + (i[2] ? '<img src="' + i[2] + '" alt="" loading="lazy">' : thumb({ thumb: 'eq' })) + '</div><div class="home-card__body"><div class="home-card__title">' + esc(i[0]) + '</div><div class="home-card__sum">' + esc(i[1]) + '</div><div class="home-card__meta"><span class="home-tag practice">실습</span></div></div></button>'; }).join('') + '</div></section>';
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
  function tabOverview(m) {
    var o = m.overview;
    return '<div class="mod-ov"><div class="mod-ov__main"><h2 class="mod-h2">핵심 개념 미리보기</h2><p class="mod-lead">' + o.lead + '</p>' +
      '<h3 class="mod-h3">꼭 알아야 할 용어 <small>눌러서 펼치기</small></h3><div class="mod-terms">' + o.terms.map(function (t2) { return '<details class="mod-term"><summary>' + esc(t2[0]) + '</summary><p>' + esc(t2[1]) + '</p></details>'; }).join('') + '</div></div>' +
      '<aside class="mod-ov__side">' + (o.model === 'sm58' ? '<div class="mod-viewer" data-role="viewer"><div class="mod-viewer__msg">3D 마이크를 불러오는 중…</div></div><div class="mod-viewer__bar"><span>끌어서 돌려 보기 · 3D 모델(SM58S)</span><button type="button" class="sim-btn" data-mviewer="switch">스위치 ON/OFF</button></div>' : (VIS[o.model] ? '<div class="mod-visual">' + VIS[o.model]() + '</div>' : '')) +
      '<div class="lsn-points mod-points"><h4>💡 핵심 포인트</h4><ul>' + o.points.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></aside></div>' +
      '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="theory">이론 학습 시작 →</button></div>';
  }
  function tabTheory(m) {
    var s = st(m.id), c = counts(m);
    return '<div class="mod-progline">' + (c.learnDone ? '<span class="mod-okline">🎉 개념 체크를 모두 맞혀 <b>학습 완료</b>했어요.</span>' : '각 주제 끝의 <b>개념 체크</b>를 모두 맞히면 학습 완료예요. (지금 ' + c.learn + '/' + c.learnN + ')') + '</div>' +
      m.theory.map(function (x, i) {
        var ok = s.checks[i] === okIdx(x.check);
        return '<section class="mod-sec" id="modSec' + i + '"><h2 class="mod-sec__h"><span class="lsn-num">' + (i + 1) + '</span>' + esc(x.title) + (ok ? '<span class="mod-tick">✓</span>' : '') + '</h2>' +
          (x.visual && VIS[x.visual] ? '<div class="mod-visual">' + VIS[x.visual]() + '</div>' : '') + '<p class="mod-p">' + x.body + '</p>' +
          (x.more ? '<details class="mod-more"><summary>더 알아보기</summary><div>' + x.more + '</div></details>' : '') +
          qHtml(x.check, i, s.checks[i], 'mcheck') + '</section>';
      }).join('') + '<div class="mod-next"><button type="button" class="btn mod-cta" data-mtab="practice">실습하기 →</button></div>';
  }
  function tabPractice(m) {
    var p = m.practice, s = st(m.id), c = counts(m);
    return '<p class="mod-lead">' + esc(p.lead) + '</p><div class="mod-simwrap"><div class="mod-sim" data-role="sim"></div>' +
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
  function tabDeeper(m) {
    var p = pathById(m.path), ids = p.modules, i = ids.indexOf(m.id), next = ids.slice(i + 1).map(function (id) { return MODS[id]; }).find(function (x) { return x && x.status === 'ready'; });
    return '<div class="lsn-deep">' + m.deeper.map(function (d) { return '<div class="lsn-deep-item"><b>' + esc(d.title) + '</b><p>' + esc(d.text) + '</p>' + (d.more ? '<details><summary>자세히 보기</summary><div>' + esc(d.more) + '</div></details>' : '') + '</div>'; }).join('') + '</div>' +
      (m.sources && m.sources.length ? '<div class="lsn-src">근거 자료: ' + m.sources.map(function (x) { return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.t) + '</a>'; }).join(' · ') + '</div>' : '') +
      '<div class="mod-next">' + (next ? '<button type="button" class="btn mod-cta" data-module="' + next.id + '">다음 과정: ' + esc(next.title) + ' →</button>' : '<button type="button" class="btn mod-cta" data-path="' + p.id + '">' + esc(p.title) + ' 과정 목록 →</button>') + '</div>';
  }
  function renderModule() {
    var root = $('tabModule'), m = MODS[view.mod]; if (!root || !m) return;
    destroySim(); destroyViewer();
    var p = pathById(m.path), c = counts(m), s = status(m), tab = view.tab;
    var body = { overview: tabOverview, theory: tabTheory, practice: tabPractice, quiz: tabQuiz, missions: tabMissions, deeper: tabDeeper }[tab](m);
    root.innerHTML = crumb([[p.title, 'data-path="' + p.id + '"'], [String(m.no).padStart(2, '0') + '. ' + m.title]]) +
      '<div class="mod-layout"><aside class="mod-rail"><h3>' + esc(p.title) + '</h3>' + p.modules.map(function (id) { var x = MODS[id]; if (!x) return ''; var sx = status(x);
        return '<button type="button" class="mod-rail__it' + (id === m.id ? ' cur' : '') + (sx === 'soon' ? ' soon' : '') + '" data-module="' + id + '"' + (sx === 'soon' ? ' aria-disabled="true"' : '') + '><span class="n">' + (sx === 'done' ? '✓' : String(x.no).padStart(2, '0')) + '</span>' + esc(x.title) + (sx === 'soon' ? '<small>준비 중</small>' : '') + '</button>'; }).join('') + '</aside>' +
      '<div class="mod-main"><div class="mod-head"><div><h1 id="modTitle">' + String(m.no).padStart(2, '0') + '. ' + esc(m.title) + ' <span class="mod-st ' + s + '">' + STATUS_TXT[s] + '</span></h1><p>' + esc(m.sub) + '</p>' +
        '<div class="mod-head__meta"><span>◎ ' + esc(m.level) + '</span><span>⏱ ' + minutesTxt(m.minutes) + '</span>' + dot(c.learnDone, '학습 ' + c.learn + '/' + c.learnN) + dot(c.pracDone, '실습 ' + c.prac + '/' + c.pracN) + dot(c.quizDone, '이해도 ' + c.quiz + '/' + c.quizN) + '</div>' +
        (m.prereq ? '<div class="mod-head__pre">먼저 볼 레슨: ' + m.prereq.map(function (id) { var l = lessonById(id); return l ? '<button type="button" class="lsn-theory-link" data-lesson="' + id + '">' + (lessonDone(id) ? '✓ ' : '📘 ') + esc(l.title) + '</button>' : ''; }).join('') + '</div>' : '') + '</div></div>' +
        '<div class="mod-tabs" role="tablist" aria-label="학습 단계">' + TABS.map(function (t2, i) { var done = (t2[0] === 'theory' && c.learnDone) || (t2[0] === 'practice' && c.pracDone) || (t2[0] === 'quiz' && c.quizDone);
          return '<button type="button" role="tab" class="mod-tab' + (done ? ' done' : '') + '" data-mtab="' + t2[0] + '" aria-selected="' + (t2[0] === tab) + '"><span class="n">' + (done ? '✓' : i + 1) + '</span>' + t2[1] + '</button>'; }).join('') + '</div>' +
        '<div class="mod-body" data-tab="' + tab + '">' + body + '</div></div></div>';
    if (tab === 'practice') mountSim(m);
    if (tab === 'overview' && m.overview.model === 'sm58') mountViewer();
  }
  function refreshHead() { var m = MODS[view.mod]; if (!m) return; var y = window.scrollY; var keepSim = sim; if (view.tab === 'practice' && keepSim) { // 실습 중에는 실습 화면을 다시 만들지 않고 과제 목록·머리만 새로
      var s = st(m.id), c = counts(m); document.querySelectorAll('#tabModule .mod-tasks li').forEach(function (li) { var d = !!s.tasks[li.getAttribute('data-task')]; li.classList.toggle('done', d); li.querySelector('.mod-task__ck').textContent = d ? '✓' : ''; });
      var h3 = document.querySelector('#tabModule .mod-tasks h3 small'); if (h3) h3.textContent = c.prac + '/' + c.pracN;
      var meta = document.querySelector('#tabModule .mod-head__meta'); if (meta) meta.innerHTML = '<span>◎ ' + esc(m.level) + '</span><span>⏱ ' + minutesTxt(m.minutes) + '</span>' + dot(c.learnDone, '학습 ' + c.learn + '/' + c.learnN) + dot(c.pracDone, '실습 ' + c.prac + '/' + c.pracN) + dot(c.quizDone, '이해도 ' + c.quiz + '/' + c.quizN);
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
  function mountViewer() {
    var el = document.querySelector('#tabModule [data-role=viewer]'); if (!el) return;
    if (!window.THREE || !window.ShureSM58 || !THREE.OrbitControls) { el.querySelector('.mod-viewer__msg').textContent = '3D 모델을 불러오지 못했어요.'; return; }
    var w = el.clientWidth || 360, h = el.clientHeight || 300, r;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { el.querySelector('.mod-viewer__msg').textContent = '이 기기에서는 3D 를 표시할 수 없어요.'; return; }
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(w, h); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.2;
    el.innerHTML = ''; el.appendChild(r.domElement);
    var sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xdfeaff, 0x1a2333, 0.9)); var k = new THREE.DirectionalLight(0xffffff, 2); k.position.set(2, 3, 3); sc.add(k); var rim = new THREE.DirectionalLight(0x7cc4ff, 1.4); rim.position.set(-3, 2, -2); sc.add(rim);
    var mic = ShureSM58.create({ variant: 'SM58S' }); sc.add(mic); mic.rotation.z = -0.5;
    var bb = new THREE.Box3().setFromObject(mic), ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()).length();
    var cam = new THREE.PerspectiveCamera(32, w / h, 0.01, 10); cam.position.copy(ctr).add(new THREE.Vector3(0.5, 0.25, 1).normalize().multiplyScalar(sz * 1.6));
    var ctl = new THREE.OrbitControls(cam, r.domElement); ctl.target.copy(ctr); ctl.enableDamping = true; ctl.autoRotate = true; ctl.autoRotateSpeed = 1.6; ctl.enablePan = false; ctl.minDistance = sz * 0.6; ctl.maxDistance = sz * 3; ctl.update();
    var on = true, alive = true; ShureSM58.setSwitch(mic, true);
    r.domElement.addEventListener('pointerdown', function () { ctl.autoRotate = false; });
    (function loop() { if (!alive) return; requestAnimationFrame(loop); var tabEl = $('tabModule'); if (!tabEl || !tabEl.classList.contains('active')) return; ctl.update(); r.render(sc, cam); })();
    viewer = { toggle: function () { on = !on; ShureSM58.setSwitch(mic, on); return on; }, destroy: function () { alive = false; sc.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); r.dispose(); }, isOn: function () { return on; } };
  }
  function destroyViewer() { if (viewer) { try { viewer.destroy(); } catch (e) { /* noop */ } viewer = null; } }

  /* ------------------------------------------------------------- 이동 */
  function markHomeNav() { document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === 'tabHome'); }); }
  function switchTo(id) { if (typeof switchTab === 'function') switchTab(id); markHomeNav(); try { window.scrollTo(0, 0); } catch (e) { /* noop */ } }
  function openPath(id) { if (!pathById(id)) return; view.path = id; hideBack(); destroySim(); destroyViewer(); switchTo('tabPath'); renderPath(); setHash('path-' + id); focusTitle(); }
  function openModule(id, tab) {
    var m = MODS[id]; if (!m || m.status !== 'ready') return;
    view.mod = id; view.path = m.path; view.tab = tab && TABS.some(function (t2) { return t2[0] === tab; }) ? tab : 'overview';
    var s = st(id); if (!s.opened) { s.opened = true; put(id, s); }
    hideBack(); switchTo('tabModule'); renderModule(); setHash('module-' + id + (view.tab !== 'overview' ? '-' + view.tab : '')); focusTitle();
  }
  function setTab(tab) { view.tab = tab; renderModule(); setHash('module-' + view.mod + (tab !== 'overview' ? '-' + tab : '')); var tb = document.querySelector('#tabModule .mod-tabs'); if (tb && tb.getBoundingClientRect().top < 0) tb.scrollIntoView({ block: 'start' }); }
  function focusTitle() { var t2 = $('modTitle'); if (t2) { t2.setAttribute('tabindex', '-1'); try { t2.focus({ preventScroll: true }); } catch (e) { /* noop */ } } }
  var hashLock = false;
  function setHash(h) { hashLock = true; try { history.replaceState(null, '', '#' + h); } catch (e) { location.hash = h; } setTimeout(function () { hashLock = false; }, 0); }
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
  function weekLinks(week) {
    var ids = (window.STA_WEEK_MODULES || {})[week] || []; if (!ids.length) return '';
    return ids.map(function (id) { var m = MODS[id]; return m ? '<button type="button" class="lsn-theory-link mod-weeklink" data-module="' + id + '">🧭 ' + esc(m.title) + ' 모듈</button>' : ''; }).join('');
  }

  /* ------------------------------------------------------------- 이벤트 */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var pc = t.closest('#tabHome [data-path], #tabPath [data-path], #tabModule [data-path]'); if (pc && !pc.closest('[aria-disabled="true"]')) { openPath(pc.getAttribute('data-path')); return; }
    var mc = t.closest('[data-module]'); if (mc) { if (mc.getAttribute('aria-disabled') === 'true') return; openModule(mc.getAttribute('data-module')); return; }
    if (t.closest('#modBack')) { if (backTo) openModule(backTo.id, backTo.tab); return; }
    var hm = t.closest('[data-modhome]'); if (hm) { hideBack(); destroySim(); destroyViewer(); if (window.STALessons) STALessons.home(); if (hm.getAttribute('data-modhome') === 'paths') setTimeout(function () { var s = $('modHome'); if (s) s.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 50); try { history.replaceState(null, '', location.pathname + location.search); } catch (err) { /* noop */ } return; }
    var gt = t.closest('[data-mgo-tab]'); if (gt) { if (typeof switchTab === 'function') switchTab(gt.getAttribute('data-mgo-tab')); window.scrollTo(0, 0); return; }
    if (!t.closest('#tabModule')) return;
    var tb = t.closest('[data-mtab]'); if (tb) { setTab(tb.getAttribute('data-mtab')); return; }
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
        var meta = document.querySelector('#tabModule .mod-head__meta'); if (meta) meta.innerHTML = '<span>◎ ' + esc(mm.level) + '</span><span>⏱ ' + minutesTxt(mm.minutes) + '</span>' + dot(c.learnDone, '학습 ' + c.learn + '/' + c.learnN) + dot(c.pracDone, '실습 ' + c.prac + '/' + c.pracN) + dot(c.quizDone, '이해도 ' + c.quiz + '/' + c.quizN);
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
    else { destroyViewer(); if (sim && !(mod && mod.classList.contains('active'))) { /* 실습 화면 소리 정리 */ destroySim(); } }
  }
  function init() {
    if (!$('tabPath') || !$('tabModule')) return;
    if (window.MutationObserver) ['tabModule', 'tabPath', 'tabHome'].forEach(function (id) { var el = $(id); if (el) new MutationObserver(function (ms) { if (ms.some(function (x) { return x.attributeName === 'class'; })) onTabChange(); }).observe(el, { attributes: true, attributeFilter: ['class'] }); });
    fromHash();
    window.addEventListener('hashchange', function () { if (!hashLock) fromHash(); });
  }
  window.STAModules = { homeHtml: homeHtml, openPath: openPath, openModule: openModule, setTab: setTab, state: function (id) { return st(id); }, counts: function (id) { return counts(MODS[id]); }, status: function (id) { return status(MODS[id]); },
    reset: function () { save({}); }, sim: function () { return sim; }, viewer: function () { return viewer; }, weekLinks: weekLinks, view: function () { return view; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
