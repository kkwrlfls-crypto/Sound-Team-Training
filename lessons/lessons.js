/* =============================================================================
   학습 대시보드(홈, #tabHome) + 미니 이론 레슨(#tabLesson) (2026-10-19)
   - 데이터: lessons/lessons_data.js (window.STA_LESSONS, STA_WEEK_LESSONS, STA_ADVANCED)
   - 기존 함수(switchTab, renderCurriculum, mg12xuSec, SanctuaryTour …)는 고치지 않고 불러 쓰기만 합니다.
   - 진행 상태: localStorage 'soundTrainerLessons_v1' (기존 커리큘럼·점수 저장과 같은 방식, 브라우저에만 저장)
     레슨 완료 = 이해도 확인 문제를 모두 맞혔을 때. 레슨을 열거나 버튼만 누른 것은 완료로 치지 않습니다.
   ============================================================================= */
(function () {
  'use strict';
  var LESSONS = window.STA_LESSONS || [], WEEK = window.STA_WEEK_LESSONS || {}, ADV = window.STA_ADVANCED || [];
  var KEY = 'soundTrainerLessons_v1';
  var SECS = [
    { k: 'A', n: 1, name: '핵심 개념', panel: 'learn' },
    { k: 'B', n: 2, name: '왜 중요한가요?', panel: 'learn' },
    { k: 'C', n: 3, name: '직접 확인하기', panel: 'practice' },
    { k: 'D', n: 4, name: '이해도 확인', panel: 'quiz' },
    { k: 'E', n: 5, name: '더 깊이 공부하기', panel: 'deeper' }
  ];
  var PANELS = [
    { id: 'learn', name: '학습하기' }, { id: 'practice', name: '실습 연결' }, { id: 'quiz', name: '이해도 확인' }, { id: 'deeper', name: '더 깊이 공부하기' }
  ];
  var cur = null, curSec = 1, homeFilter = 'all', backTo = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lessonById(id) { return LESSONS.find(function (l) { return l.id === id; }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(all) { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* 저장 안 돼도 화면은 그대로 동작 */ } }
  function st(id) { var a = load(); return a[id] || { seen: [], quiz: {}, done: false }; }
  function put(id, s) { var a = load(); a[id] = s; save(a); }
  function markSeen(id, n) { var s = st(id); if (s.seen.indexOf(n) < 0) { s.seen.push(n); put(id, s); } }
  function status(l) { if (l.status !== 'ready') return 'soon'; var s = st(l.id); return s.done ? 'done' : (s.seen.length ? 'doing' : 'new'); }
  function curriculumDone() { try { var p = JSON.parse(localStorage.getItem('soundTrainerCurriculumProgress_v1')) || {}; return p; } catch (e) { return {}; } }

  /* ------------------------------------------------------------- 그림(아이콘·썸네일) */
  var ICON = {
    mic: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="14" y="4" width="12" height="20" rx="6" fill="currentColor" fill-opacity=".12"/><path d="M10 19a10 10 0 0 0 20 0M20 29v7M14 36h12"/></svg>',
    mixer: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="8" width="32" height="24" rx="3" fill="currentColor" fill-opacity=".1"/><path d="M11 13v14M18 13v14M25 13v14M31 13v14"/><rect x="9" y="20" width="4" height="3" fill="currentColor"/><rect x="16" y="15" width="4" height="3" fill="currentColor"/><rect x="23" y="22" width="4" height="3" fill="currentColor"/><rect x="29" y="17" width="4" height="3" fill="currentColor"/></svg>',
    amp: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="13" width="34" height="14" rx="2" fill="currentColor" fill-opacity=".1"/><circle cx="10" cy="20" r="3"/><circle cx="19" cy="20" r="3"/><path d="M26 18h7M26 22h7"/></svg>',
    speaker: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="22" height="34" rx="3" fill="currentColor" fill-opacity=".1"/><circle cx="20" cy="25" r="7"/><circle cx="20" cy="25" r="2" fill="currentColor"/><circle cx="20" cy="10" r="3"/></svg>',
    knob: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="20" cy="21" r="11" fill="currentColor" fill-opacity=".1"/><path d="M20 21l6-7"/><path d="M8 33l3-3M32 33l-3-3M20 5v3"/></svg>',
    eq: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 26c6 0 7-12 13-12s6 8 11 8 5-6 8-6"/><path d="M4 33h32" stroke-opacity=".4"/></svg>',
    fader: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 4v32"/><rect x="13" y="14" width="14" height="8" rx="2" fill="currentColor" fill-opacity=".2"/><path d="M9 8h4M9 30h4M27 8h4M27 30h4" stroke-opacity=".5"/></svg>',
    bus: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 12h22l6 8-6 8H6z" fill="currentColor" fill-opacity=".1"/><path d="M12 20h12"/></svg>'
  };
  function thumbSvg(kind) {
    var bg = '<rect width="320" height="180" fill="#0d2340"/><rect width="320" height="180" fill="url(#tg)"/>';
    var defs = '<defs><radialGradient id="tg" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#1d4f86"/><stop offset="1" stop-color="#0b1d36"/></radialGradient></defs>';
    var art = '';
    if (kind === 'flow') art = '<g fill="none" stroke="#67e8f9" stroke-width="4" stroke-linecap="round"><circle cx="86" cy="90" r="34" fill="#22d3ee" fill-opacity=".18"/><path d="M66 90h8l6-14 8 28 6-14h8"/><path d="M138 90h40" stroke="#93c5fd"/><path d="M170 80l10 10-10 10" stroke="#93c5fd"/><circle cx="236" cy="90" r="34" fill="#22d3ee" fill-opacity=".18"/><path d="M214 90h10l8-16 8 32 8-16h8"/></g>';
    else if (kind === 'eq') art = '<g stroke="#1e3a5f" stroke-width="1">' + [40, 80, 120, 160, 200, 240, 280].map(function (x) { return '<path d="M' + x + ' 30v120"/>'; }).join('') + [60, 90, 120].map(function (y) { return '<path d="M20 ' + y + 'h280"/>'; }).join('') + '</g><path d="M20 128 C70 128 80 70 120 70 S160 110 200 98 S260 60 300 60" fill="none" stroke="#22d3ee" stroke-width="4"/><path d="M20 128 C70 128 80 70 120 70 S160 110 200 98 S260 60 300 60 V150 H20Z" fill="#22d3ee" fill-opacity=".12"/>';
    else if (kind === 'aux') art = '<g><rect x="34" y="52" width="74" height="40" rx="8" fill="#ea580c" fill-opacity=".9"/><text x="71" y="80" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="800" fill="#fff">AUX</text><circle cx="160" cy="98" r="34" fill="#1f2937" stroke="#94a3b8" stroke-width="3"/><path d="M160 98l18-20" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M220 120l60-24v48z" fill="#334155" stroke="#94a3b8" stroke-width="3"/><circle cx="262" cy="120" r="12" fill="#0b1220" stroke="#94a3b8" stroke-width="2"/></g>';
    return '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + defs + bg + art + '</svg>';
  }
  function thumbHtml(kind) {
    if (kind === 'console') return '<img src="console_strip.jpg" alt="" loading="lazy" style="object-position:50% 8%">';
    if (kind === 'practice-tab1') return '<img src="vi10p.jpg" alt="" loading="lazy" style="object-position:50% 30%">';
    if (kind === 'practice-tab6') return '<img src="console_strip.jpg" alt="" loading="lazy" style="object-position:50% 20%">';
    if (kind === 'practice-tab5') return '<img src="cl5_top.jpg" alt="" loading="lazy">';
    if (kind === 'practice-tab2') return '<img src="40D.jpg" alt="" loading="lazy">';
    if (kind === 'practice-tab3') return thumbSvg('eq');
    if (kind === 'practice-tab7') return '<img src="jack_strip.jpg" alt="" loading="lazy">';
    return thumbSvg(kind);
  }
  function heroSvg() {
    var beams = '', faders = '', i;
    for (i = 0; i < 4; i++) beams += '<polygon points="' + (520 + i * 140) + ',0 ' + (560 + i * 140) + ',0 ' + (700 + i * 120) + ',420 ' + (500 + i * 120) + ',420" fill="url(#hb)" opacity="' + (0.5 - i * 0.08) + '"/>';
    for (i = 0; i < 14; i++) { var x = 640 + i * 34, y = 300 + Math.round(30 * Math.sin(i * 1.3)); faders += '<path d="M' + x + ' 250V400" stroke="#4b6a93" stroke-width="2"/><rect x="' + (x - 7) + '" y="' + y + '" width="14" height="22" rx="3" fill="#8fb3dd" fill-opacity=".55"/>'; }
    return '<svg viewBox="0 0 1200 420" preserveAspectRatio="xMinYMid slice" aria-hidden="true"><defs>' +
      '<linearGradient id="hg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a1c35"/><stop offset=".55" stop-color="#0f2747"/><stop offset="1" stop-color="#173b66"/></linearGradient>' +
      '<linearGradient id="hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfefff" stop-opacity=".35"/><stop offset="1" stop-color="#cfefff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="hf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a1c35"/><stop offset=".5" stop-color="#0a1c35" stop-opacity=".2"/><stop offset="1" stop-color="#0a1c35" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="1200" height="420" fill="url(#hg)"/>' + beams +
      '<path d="M560 330 C640 300 700 360 780 330 S920 300 1000 330 S1120 360 1200 330" fill="none" stroke="#22d3ee" stroke-opacity=".35" stroke-width="2"/>' +
      '<rect x="600" y="240" width="560" height="180" rx="10" fill="#0b1626" fill-opacity=".7" stroke="#2a4a72"/>' + faders +
      '<rect width="1200" height="420" fill="url(#hf)"/></svg>';
  }

  /* ------------------------------------------------------------- 홈(대시보드) */
  var PRACTICE = [
    { tab: 'tab1', title: '확성 시스템 기초', sum: '세 가지 연결 구성을 3D 로 직접 연결해 봅니다.' },
    { tab: 'tab6', title: 'MG12XU 실습', sum: '실제 콘솔 사진 위에서 연결하고, 소리를 들으며 조작합니다.' },
    { tab: 'tab5', title: 'CL5 콘솔 트레이닝', sum: '예배 식순에 맞춰 채널을 켜고 DCA 를 다룹니다.' },
    { tab: 'tab3', title: 'Ear Training', sum: '볼륨 변화, 대역별 소리, 밸런스를 귀로 훈련합니다.' },
    { tab: 'tab2', title: '3층 음향 시스템', sum: '실제 설치 위치와 신호가 지나는 길을 3D 로 봅니다.' },
    { tab: 'tab7', title: '음향 트러블슈팅', sum: '고장 증상을 보고 원인을 찾아 고칩니다.' }
  ];
  var PHASES = [
    { name: '오리엔테이션', weeks: [1], label: '1주차', color: '#2b8fd6', ico: '<path d="M4 6h16v12H4z"/><path d="M8 10h8M8 14h5"/>' },
    { name: '모니터 스텝', weeks: [2, 3, 4, 5], label: '2–5주차', color: '#8b5cf6', ico: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>' },
    { name: '단상 스텝', weeks: [6, 7], label: '6–7주차', color: '#0f2747', ico: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>' },
    { name: '오퍼레이팅', weeks: [8, 9, 10], label: '8–10주차', color: '#0e7490', ico: '<path d="M6 4v16M12 4v16M18 4v16"/><rect x="4" y="13" width="4" height="3"/><rect x="10" y="7" width="4" height="3"/><rect x="16" y="11" width="4" height="3"/>' }
  ];
  function cardLesson(l) {
    var s = status(l), soon = s === 'soon';
    var stTxt = { done: '완료 ✓', doing: '학습 중', new: '', soon: '' }[s];
    return '<button type="button" class="home-card" data-lesson="' + esc(l.id) + '"' + (soon ? ' aria-disabled="true"' : '') + '>' +
      '<div class="home-card__thumb">' + thumbHtml(l.thumb) + '</div><div class="home-card__body">' +
      '<div class="home-card__title">' + esc(l.title) + '</div><div class="home-card__sum">' + esc(l.summary) + '</div>' +
      '<div class="home-card__meta"><span class="home-tag' + (soon ? ' soon' : '') + '">' + (soon ? '준비 중' : esc(l.level)) + '</span><span>⏱ 약 ' + l.minutes + '분</span>' +
      (stTxt ? '<span class="home-status ' + s + '">' + stTxt + '</span>' : '') + '</div></div></button>';
  }
  function cardPractice(p) {
    return '<button type="button" class="home-card" data-go-tab="' + p.tab + '"><div class="home-card__thumb">' + thumbHtml('practice-' + p.tab) + '</div><div class="home-card__body">' +
      '<div class="home-card__title">' + esc(p.title) + '</div><div class="home-card__sum">' + esc(p.sum) + '</div>' +
      '<div class="home-card__meta"><span class="home-tag practice">실습</span></div></div></button>';
  }
  function cardAdv(a) {
    var need = a.need.map(function (id) { var l = lessonById(id); return l ? l.title : id; }).join(', ');
    return '<div class="home-card" aria-disabled="true" role="group"><div class="home-card__body"><div class="home-card__title">' + esc(a.title) + '</div>' +
      '<div class="home-card__sum">먼저 배울 것: ' + esc(need) + '</div><div class="home-card__meta"><span class="home-tag adv">심화 ' + a.level + '단계</span><span class="home-tag soon">준비 중</span></div></div></div>';
  }
  function phaseCards() {
    var p = curriculumDone();
    return PHASES.map(function (ph, i) {
      var done = ph.weeks.filter(function (w) { return p[w]; }).length;
      return '<button type="button" class="home-phase" data-phase="' + esc(ph.name) + '"><span class="home-phase__ico" style="background:' + ph.color + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ph.ico + '</svg></span>' +
        '<div><div class="home-phase__t">' + (i + 1) + '. ' + esc(ph.name) + '</div><div class="home-phase__s">' + ph.label + ' · ' + done + '/' + ph.weeks.length + ' 완료</div>' +
        '<div class="home-phase__bar"><i style="width:' + Math.round(done / ph.weeks.length * 100) + '%"></i></div></div></button>';
    }).join('');
  }
  function renderHome() {
    var root = $('tabHome'); if (!root) return;
    var ready = LESSONS.filter(function (l) { return l.status === 'ready'; });
    var doneN = ready.filter(function (l) { return st(l.id).done; }).length;
    var cp = curriculumDone(), weeksDone = Object.keys(cp).filter(function (k) { return cp[k]; }).length;
    var items, title;
    if (homeFilter === 'theory') { items = LESSONS.map(cardLesson).join(''); title = '기초 이론'; }
    else if (homeFilter === 'practice') { items = PRACTICE.map(cardPractice).join(''); title = '실습'; }
    else if (homeFilter === 'adv') { items = ADV.map(cardAdv).join(''); title = '심화 학습 (준비 중)'; }
    else if (homeFilter === 'all-more') { items = LESSONS.map(cardLesson).join('') + PRACTICE.map(cardPractice).join(''); title = '전체 학습 과정'; }
    else { items = LESSONS.map(cardLesson).join(''); title = '추천 학습 과정'; }
    var filters = [['all', '전체'], ['theory', '기초 이론'], ['practice', '실습'], ['adv', '심화 학습']]   // 2026-10-20: 「학습 흐름」 줄과 「10주 커리큘럼」 필터는 빼 달라는 요청으로 삭제(커리큘럼은 아래 바로가기로);
    root.innerHTML =
      '<section class="home-hero"><div class="home-hero__bg">' + heroSvg() + '</div><div class="home-hero__text">' +
      '<h1>교회 음향팀을 위한<br>실습 중심 교육 플랫폼</h1><p>장비를 배우고, 직접 조작하고, 소리를 들어<br>실제 현장에서 바로 사용할 수 있는 음향 교육을 경험하세요.</p>' +
      '<div class="home-hero__stats"><span class="home-hero__stat">이론 레슨 <b>' + doneN + '</b> / ' + ready.length + ' 완료</span><span class="home-hero__stat">10주 과정 <b>' + weeksDone + '</b> / 10 주차</span></div></div>' +
      '<div class="home-hero__script" aria-hidden="true">Better Sound<br>Better Ministry</div></section>' +
      (window.STAModules ? STAModules.homeHtml() : '') +   /* 2026-10-20: 전체 학습 과정(하드웨어 이해·믹싱 스킬·통합 실전 훈련) */
      '<div class="home-filters" role="tablist" aria-label="학습 과정 보기">' + filters.map(function (f) {
        var on = homeFilter === f[0] || (f[0] === 'all' && homeFilter === 'all-more');
        return '<button type="button" role="tab" class="home-filter" data-filter="' + f[0] + '" aria-selected="' + (on ? 'true' : 'false') + '">' + f[1] + '</button>';
      }).join('') + '</div>' +
      (homeFilter === 'curr' ? '' : '<section class="home-sec"><div class="home-sec-head"><h2>' + title + '</h2>' + (homeFilter === 'all' ? '<button type="button" class="home-more" data-filter="all-more">전체 보기 →</button>' : '') + '</div><div class="home-cards">' + items + '</div></section>') +
      '<section class="home-sec" id="homePhases"><div class="home-sec-head"><h2>10주 커리큘럼 바로가기</h2><button type="button" class="home-more" data-go-tab="tab4">커리큘럼 전체 →</button></div><div class="home-phases">' + phaseCards() + '</div></section>';
  }

  /* ------------------------------------------------------------- 레슨 화면 */
  function flowHtml(flow) {
    return '<div class="lsn-flow">' + flow.map(function (f, i) {
      return (i ? '<span class="lsn-flow-arrow" aria-hidden="true">→</span>' : '') + '<div class="lsn-flow-item">' + (ICON[f.icon] || '') + '<b>' + esc(f.name) + '</b><em>' + esc(f.role) + '</em>' + (f.note ? '<small>' + esc(f.note) + '</small>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function secHead(k) { var s = SECS.find(function (x) { return x.k === k; }); return '<h2 class="lsn-sec-h"><span class="lsn-num">' + s.n + '</span>' + esc(s.name) + '</h2>'; }
  function quizHtml(l) {
    var s = st(l.id), all = l.quiz.length, ok = l.quiz.filter(function (q, i) { var a = s.quiz[i]; return a != null && q.options[a] && q.options[a].ok; }).length;
    var h = s.done ? '<div class="lsn-done" role="status">🎉 이해도 확인 문제를 모두 맞혔어요. 이 레슨을 완료했습니다.</div>'
      : '<div class="lsn-todo">' + all + '문제를 모두 맞히면 레슨이 완료됩니다. (지금 ' + ok + '/' + all + ')</div>';
    l.quiz.forEach(function (q, qi) {
      var ans = s.quiz[qi], answered = ans != null;
      h += '<div class="lsn-q" data-q="' + qi + '"><b>' + (qi + 1) + '. ' + esc(q.q) + '</b><fieldset class="lsn-opts"><legend class="sr-only" style="position:absolute;left:-9999px">' + esc(q.q) + '</legend>' +
        q.options.map(function (o, oi) {
          var cls = answered ? (o.ok ? ' ok' : (oi === ans ? ' no' : '')) : '';
          return '<label class="lsn-opt' + cls + '"><input type="radio" name="lsnq' + qi + '" value="' + oi + '"' + (answered && oi === ans ? ' checked' : '') + '><span>' + esc(o.t) +
            (answered ? '<span class="why">' + (o.ok ? '✓ ' : '✗ ') + esc(o.why) + '</span>' : '') + '</span></label>';
        }).join('') + '</fieldset><div class="lsn-qbar"><button type="button" class="lsn-check" data-q="' + qi + '"' + (answered ? '' : ' disabled') + '>' + (answered ? '다시 확인' : '확인') + '</button>' +
        (answered ? '<span class="lsn-fb ' + (q.options[ans].ok ? 'ok">정답입니다!' : 'no">다시 생각해 보세요') + '</span>' : '') + '</div></div>';
    });
    return h;
  }
  function renderLesson() {
    var root = $('tabLesson'), l = cur; if (!root || !l) return;
    var s = st(l.id), sec = SECS[curSec - 1];
    var c = l.concept, w = l.why, p = l.practice;
    var learn = '<section class="lsn-sec" data-k="A" id="lsnSecA">' + secHead('A') + '<h3 class="lsn-sub">' + esc(c.heading) + '</h3><p class="lsn-lead">' + c.lead + '</p>' +
      c.body.map(function (b) { return '<p class="lsn-p">' + b + '</p>'; }).join('') + flowHtml(c.flow) +
      '<div class="lsn-cards">' + c.cards.map(function (cd) { return '<div class="lsn-card"><h4>' + esc(cd.title) + '</h4><ul>' + cd.items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>'; }).join('') + '</div>' +
      '<div class="lsn-points"><h4>💡 핵심 포인트</h4><ul>' + c.points.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></section>' +
      '<section class="lsn-sec" data-k="B" id="lsnSecB">' + secHead('B') + '<p class="lsn-lead">' + esc(w.lead) + '</p><div class="lsn-cases">' +
      w.cases.map(function (x) { return '<div class="lsn-case ' + x.kind + '"><i aria-hidden="true">' + ({ warn: '⚠️', bad: '⛔', info: '🔎' }[x.kind] || '•') + '</i><div><b>' + esc(x.title) + '</b><span>' + esc(x.text) + '</span></div></div>'; }).join('') +
      '</div><div class="lsn-note">' + esc(w.note) + '</div></section>';
    var practice = '<section class="lsn-sec" data-k="C" id="lsnSecC">' + secHead('C') + '<p class="lsn-lead">' + esc(p.lead) + '</p><div class="lsn-psteps">' +
      p.steps.map(function (x, i) {
        var kc = x.kind === 'audio' ? ' audio' : (x.kind === '3d' ? ' k3d' : '');
        return '<div class="lsn-pstep"><span class="n">' + (i + 1) + '</span><div><b>' + esc(x.title) + '</b><p>' + esc(x.text) + '</p><span class="lsn-kind' + kc + '">' + esc(p.kinds[x.kind] || x.kind) + '</span></div>' +
          '<button type="button" class="lsn-go" data-go="' + i + '">실습 열기 →</button></div>';
      }).join('') + '</div><div class="lsn-note">📌 ' + esc(p.caution) + '</div></section>';
    var quiz = '<section class="lsn-sec" data-k="D" id="lsnSecD">' + secHead('D') + '<div id="lsnQuiz">' + quizHtml(l) + '</div></section>';
    var idx = LESSONS.indexOf(l), nextL = LESSONS.slice(idx + 1).find(function (x) { return x.status === 'ready'; });
    var deeper = '<section class="lsn-sec" data-k="E" id="lsnSecE">' + secHead('E') + '<div class="lsn-deep">' + l.deeper.map(function (d) {
      return '<div class="lsn-deep-item"><b>' + esc(d.title) + '</b><p>' + esc(d.text) + '</p>' + (d.more ? '<details><summary>자세히 보기</summary><div>' + d.more + '</div></details>' : '') + '</div>';
    }).join('') + '</div>' +
      (nextL ? '<p class="lsn-p" style="margin-top:14px">다음 레슨: <button type="button" class="lsn-theory-link" data-lesson="' + nextL.id + '">' + esc(nextL.title) + ' →</button></p>' : '') +
      (l.sources && l.sources.length ? '<div class="lsn-src">근거 자료: ' + l.sources.map(function (x) { return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.t) + '</a>'; }).join(' · ') + '</div>' : '') + '</section>';
    var panelOf = sec.panel;
    root.innerHTML =
      '<nav class="lsn-crumb" aria-label="위치"><button type="button" data-home="1">홈</button><span>›</span><span>' + esc(l.level) + '</span><span>›</span><b>' + esc(l.title) + '</b></nav>' +
      '<div class="lsn-head"><div><span class="lsn-badge">' + esc(l.level) + ' 레슨</span><h1 id="lsnTitle">' + esc(l.title) + '</h1><p>' + esc(l.summary) + '</p></div>' +
      '<div class="lsn-head-r"><span id="lsnPos">' + curSec + ' / 5</span><span>⏱ 약 ' + l.minutes + '분</span><button type="button" class="lsn-next" id="lsnNext">' + (curSec < 5 ? '다음 ›' : '홈으로') + '</button></div></div>' +
      '<div class="lsn-steps" role="tablist" aria-label="레슨 단계">' + PANELS.map(function (pn) { return '<button type="button" role="tab" class="lsn-step" data-panel="' + pn.id + '" aria-selected="' + (pn.id === panelOf) + '">' + pn.name + '</button>'; }).join('') + '</div>' +
      '<div class="lsn-body"><div class="lsn-main">' +
      '<div class="lsn-panel" data-panel="learn"' + (panelOf === 'learn' ? '' : ' hidden') + '>' + learn + '</div>' +
      '<div class="lsn-panel" data-panel="practice"' + (panelOf === 'practice' ? '' : ' hidden') + '>' + practice + '</div>' +
      '<div class="lsn-panel" data-panel="quiz"' + (panelOf === 'quiz' ? '' : ' hidden') + '>' + quiz + '</div>' +
      '<div class="lsn-panel" data-panel="deeper"' + (panelOf === 'deeper' ? '' : ' hidden') + '>' + deeper + '</div></div>' +
      '<aside class="lsn-rail"><div class="lsn-rail-box"><h3>이 레슨에서 배울 내용</h3>' + SECS.map(function (x) {
        var seen = s.seen.indexOf(x.n) >= 0 || (x.k === 'D' && s.done);
        return '<button type="button" class="lsn-rail-item' + (x.n === curSec ? ' cur' : '') + (seen && x.n !== curSec ? ' seen' : '') + '" data-sec="' + x.n + '"' + (x.n === curSec ? ' aria-current="step"' : '') + '><span class="c">' + (seen && x.n !== curSec ? '✓' : x.n) + '</span>' + esc(x.name) + '</button>';
      }).join('') + '</div>' +
      '<div class="lsn-rail-box"><h3>관련 실습</h3>' + (l.related || []).map(function (r) { return '<button type="button" class="lsn-rel" data-go-tab="' + r.tab + '"><img src="' + esc(r.img) + '" alt=""><div><b>' + esc(r.title) + '</b><span>바로가기 →</span></div></button>'; }).join('') + '</div></aside></div>';
  }
  function goSec(n, scroll) {
    if (!cur) return;
    curSec = Math.max(1, Math.min(5, n));
    markSeen(cur.id, curSec);
    renderLesson();
    if (scroll !== false) {
      var el = $('lsnSec' + SECS[curSec - 1].k);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }
  function markNav(tab) { document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); }); }
  function openLesson(id, n) {
    var l = lessonById(id); if (!l || l.status !== 'ready') return;
    cur = l; curSec = n || 1;
    if (typeof switchTab === 'function') switchTab('tabLesson');
    markNav('tabHome');
    hideBack();
    markSeen(l.id, curSec);
    renderLesson();
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { window.scrollTo(0, 0); }
    var t = $('lsnTitle'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
  }
  function goHome() {
    if (typeof switchTab === 'function') switchTab('tabHome');
    renderHome(); hideBack();
    try { window.scrollTo(0, 0); } catch (e) { /* noop */ }
  }

  /* ------------------------------------------------------------- 실습으로 이동 */
  function flash(el) { if (!el) return; el.classList.remove('lsn-flash'); void el.offsetWidth; el.classList.add('lsn-flash'); setTimeout(function () { el.classList.remove('lsn-flash'); }, 3400); }
  function showBack() {
    var b = $('lsnBack'); if (!b || !cur) return;
    b.textContent = '📘 「' + cur.title + '」 레슨으로 돌아가기'; b.hidden = false; backTo = { id: cur.id, sec: curSec };
  }
  function hideBack() { var b = $('lsnBack'); if (b) b.hidden = true; }
  function waitFor(test, cb, tries) { tries = tries || 0; if (test()) { cb(); return; } if (tries > 240) return; setTimeout(function () { waitFor(test, cb, tries + 1); }, 250); }
  function openPractice(go) {
    if (!go || typeof switchTab !== 'function') return;
    switchTab(go.tab);
    showBack();
    setTimeout(function () {
      if (go.card) {
        var c = document.querySelector('.pa3d-card[data-pa3d="' + go.card + '"]');
        if (c) { c.scrollIntoView({ block: 'start', behavior: 'smooth' }); flash(c); }
      } else if (go.trace) {
        var wrap = $('canvas3dWrap'); if (wrap) wrap.scrollIntoView({ block: 'start', behavior: 'smooth' });
        waitFor(function () { return window.SanctuaryTour && SanctuaryTour.isBuilt && SanctuaryTour.isBuilt(); }, function () {
          try { SanctuaryTour.setMode('trace'); SanctuaryTour.traceSignal(go.trace); } catch (e) { /* 3D 가 없으면 무시 */ }
        });
      } else if (go.sec) {
        try { if (window.mg12xuSec) window.mg12xuSec.show(go.sec); } catch (e) { /* noop */ }
        var z = document.querySelector('.mg12xu-sec-zone[data-sec="' + go.sec + '"]');
        if (z) z.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else if (go.ts) {
        try { if (window.PaTroubleshoot) PaTroubleshoot.list(); } catch (e) { /* noop */ }
        var mc = document.querySelector('#tsRoot .ts-mcard[data-mid="' + go.ts + '"]'); if (mc) { mc.scrollIntoView({ block: 'center', behavior: 'smooth' }); flash(mc); }
      } else if (go.audio) {
        try { if (window.mg12xuSec && mg12xuSec.state().on) mg12xuSec.setOn(false); } catch (e) { /* noop */ }
        var b = $('mg12xuAudioToggleBtn'); if (b) { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); flash(b); }
      }
    }, 80);
  }

  /* ------------------------------------------------------------- 실습 화면·커리큘럼에 이론 연결 */
  var TAB_MODULES = { tab1: ['mic'], tab6: ['gain-structure'], tab5: ['gain-structure'], tab7: ['mic'] };   // 2026-10-20: 학습 모듈 연결
  var TAB_LESSONS = { tab1: ['signal-flow'], tab2: ['signal-flow'], tab7: ['signal-flow'], tab6: ['gain-fader', 'hpf-eq', 'aux-monitor'], tab5: ['gain-fader'] };
  function theoryLinks(ids) {
    return ids.map(function (id) {
      var l = lessonById(id); if (!l) return '';
      var ready = l.status === 'ready';
      return '<button type="button" class="lsn-theory-link" data-lesson="' + l.id + '"' + (ready ? '' : ' aria-disabled="true" title="준비 중"') + '>📘 ' + esc(l.title) + (ready ? '' : ' (준비 중)') + '</button>';
    }).join('');
  }
  function addTabLinks() {
    Object.keys(TAB_LESSONS).forEach(function (tab) {
      var head = document.querySelector('#' + tab + ' > .level-header'); if (!head) return;
      var old = head.querySelector('.lsn-theory-links'); if (old) old.remove();   // 편집 저장 파일에 남은 것 정리
      var d = document.createElement('div'); d.className = 'lsn-theory-links'; d.setAttribute('aria-label', '관련 이론');
      d.innerHTML = theoryLinks(TAB_LESSONS[tab]) + (TAB_MODULES[tab] || []).map(function (id) { var mm = (window.STA_MODULES || {})[id]; return mm ? '<button type="button" class="lsn-theory-link mod-weeklink" data-module="' + id + '">🧭 ' + esc(mm.title) + ' 모듈</button>' : ''; }).join(''); head.appendChild(d);
    });
  }
  function addWeekTheory() {
    var list = $('curriculumList'); if (!list) return;
    list.querySelectorAll('.week-card').forEach(function (card) {
      var chk = card.querySelector('.week-check'); if (!chk) return;
      var m = /^(\d+)주차/.exec(chk.getAttribute('aria-label') || ''); if (!m) return;
      var info = WEEK[m[1]]; var old = card.querySelector('.week-theory'); if (old) old.remove();
      if (!info) return;
      var d = document.createElement('div'); d.className = 'week-theory';
      d.innerHTML = '<div class="week-theory-row"><b>📘 먼저 볼 이론</b>' + theoryLinks(info.lessons) + (window.STAModules ? STAModules.weekLinks(m[1]) : '') + '</div>' +
        (info.check ? '<div class="week-theory-row"><b>✔ 실습 후 확인</b><span>' + esc(info.check) + '</span></div>' : '');
      var body = card.querySelector('.week-body'); if (body) body.appendChild(d);
    });
  }

  /* ------------------------------------------------------------- 이벤트 */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null; if (!t) return;
    var lk = t.closest('[data-lesson]');
    if (lk && !lk.closest('.home-card[aria-disabled="true"]') && lk.getAttribute('aria-disabled') !== 'true') { openLesson(lk.getAttribute('data-lesson')); return; }
    var gt = t.closest('[data-go-tab]');
    if (gt && (gt.closest('#tabHome') || gt.closest('#tabLesson'))) { if (gt.closest('#tabLesson')) showBack(); if (typeof switchTab === 'function') switchTab(gt.getAttribute('data-go-tab')); window.scrollTo(0, 0); return; }
    var f = t.closest('#tabHome [data-filter]');
    if (f) {
      var v = f.getAttribute('data-filter');
      if (v === 'curr') { homeFilter = 'curr'; renderHome(); var ps = $('homePhases'); if (ps) ps.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      homeFilter = v; renderHome(); return;
    }
    var ph = t.closest('#tabHome [data-phase]');
    if (ph) {
      if (typeof switchTab === 'function') switchTab('tab4');
      var name = ph.getAttribute('data-phase');
      setTimeout(function () { var dv = Array.prototype.find.call(document.querySelectorAll('#curriculumList .phase-divider'), function (x) { return x.textContent.trim() === name; }); if (dv) { dv.scrollIntoView({ block: 'start', behavior: 'smooth' }); flash(dv.nextElementSibling); } }, 60);
      return;
    }
    if (!t.closest('#tabLesson') && !t.closest('#lsnBack')) return;
    if (t.closest('#lsnBack')) { if (backTo) openLesson(backTo.id, backTo.sec); return; }
    if (t.closest('[data-home]')) { goHome(); return; }
    var stp = t.closest('.lsn-step');
    if (stp) { var pid = stp.getAttribute('data-panel'); var first = SECS.find(function (x) { return x.panel === pid; }); goSec(first.n, false); return; }
    var ri = t.closest('.lsn-rail-item'); if (ri) { goSec(+ri.getAttribute('data-sec')); return; }
    if (t.closest('#lsnNext')) { if (curSec < 5) goSec(curSec + 1); else goHome(); return; }
    var g = t.closest('.lsn-go'); if (g && cur) { openPractice(cur.practice.steps[+g.getAttribute('data-go')].go); return; }
    var ck = t.closest('.lsn-check');
    if (ck && cur) {
      var qi = +ck.getAttribute('data-q'), sel = document.querySelector('#tabLesson input[name="lsnq' + qi + '"]:checked'); if (!sel) return;
      var s = st(cur.id); s.quiz[qi] = +sel.value;
      s.done = cur.quiz.every(function (q, i) { var a = s.quiz[i]; return a != null && q.options[a] && q.options[a].ok; });
      if (s.seen.indexOf(4) < 0) s.seen.push(4);
      put(cur.id, s);
      var box = $('lsnQuiz'); if (box) box.innerHTML = quizHtml(cur);
      var qEl = document.querySelector('#tabLesson .lsn-q[data-q="' + qi + '"] .lsn-fb'); if (qEl) { qEl.setAttribute('role', 'status'); }
      var rail = document.querySelector('#tabLesson .lsn-rail-item[data-sec="4"]'); if (rail && s.done) { renderLesson(); }
      return;
    }
  });
  document.addEventListener('change', function (e) {
    var r = e.target; if (!r || !r.name || r.name.indexOf('lsnq') !== 0) return;
    var qi = r.name.slice(4), btn = document.querySelector('#tabLesson .lsn-check[data-q="' + qi + '"]');
    if (btn) { btn.disabled = false; btn.textContent = '확인'; }
    var q = r.closest('.lsn-q'); if (q) q.querySelectorAll('.lsn-opt').forEach(function (o) { o.classList.remove('ok', 'no'); var w = o.querySelector('.why'); if (w) w.remove(); });
    var fb = q && q.querySelector('.lsn-fb'); if (fb) fb.remove();
  });
  // 다른 탭으로 가면(레슨·홈이 아닌 곳) 「레슨으로 돌아가기」는 남기고, 홈으로 오면 다시 그림
  function onTabChange() {
    var home = $('tabHome'), lesson = $('tabLesson');
    if (home && home.classList.contains('active')) { renderHome(); hideBack(); }
    if (lesson && lesson.classList.contains('active')) { markNav('tabHome'); hideBack(); }
  }

  function init() {
    if (!$('tabHome')) return;
    if (!$('lsnBack')) { var b = document.createElement('button'); b.type = 'button'; b.id = 'lsnBack'; b.className = 'lsn-back'; b.hidden = true; document.body.appendChild(b); }
    else hideBack();
    renderHome(); addTabLinks(); addWeekTheory();
    var list = $('curriculumList'); if (list && window.MutationObserver) new MutationObserver(addWeekTheory).observe(list, { childList: true });
    if (window.MutationObserver) document.querySelectorAll('#tabHome, #tabLesson').forEach(function (el) { new MutationObserver(function (ms) { if (ms.some(function (m) { return m.attributeName === 'class'; })) onTabChange(); }).observe(el, { attributes: true, attributeFilter: ['class'] }); });
    // 주소 끝 #lesson-<id> 로 레슨 바로 열기 (예: #lesson-gain-fader)
    var m = /^#lesson-([\w-]+)/.exec(location.hash || ''); if (m) openLesson(m[1]);
    window.addEventListener('hashchange', function () { var h = /^#lesson-([\w-]+)/.exec(location.hash || ''); if (h) openLesson(h[1]); });
  }
  window.STALessons = { open: openLesson, home: goHome, renderHome: renderHome, state: function (id) { return st(id); }, reset: function () { save({}); renderHome(); }, openPractice: openPractice };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
