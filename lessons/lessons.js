/* =============================================================================
   학습 대시보드(홈, #tabHome) + 미니 이론 레슨(#tabLesson) (2026-10-19)
   - 데이터: lessons/lessons_data.js (window.STA_LESSONS, STA_ADVANCED)
   - 기존 함수(switchTab, renderCurriculum, mg12xuSec, SanctuaryTour …)는 고치지 않고 불러 쓰기만 합니다.
   - 진행 상태: localStorage 'soundTrainerLessons_v1' (기존 커리큘럼·점수 저장과 같은 방식, 브라우저에만 저장)
     레슨 완료 = 이해도 확인 문제를 모두 맞혔을 때. 레슨을 열거나 버튼만 누른 것은 완료로 치지 않습니다.
   ============================================================================= */
(function () {
  'use strict';
  var LESSONS = window.STA_LESSONS || [], ADV = window.STA_ADVANCED || [];
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
  var cur = null, curSec = 1, backTo = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lessonById(id) { return LESSONS.find(function (l) { return l.id === id; }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(all) { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* 저장 안 돼도 화면은 그대로 동작 */ } }
  function st(id) { var a = load(); return a[id] || { seen: [], quiz: {}, done: false }; }
  function put(id, s) { var a = load(); a[id] = s; save(a); }
  function markSeen(id, n) { var s = st(id); if (s.seen.indexOf(n) < 0) { s.seen.push(n); put(id, s); } }
  function status(l) { if (l.status !== 'ready') return 'soon'; var s = st(l.id); return s.done ? 'done' : (s.seen.length ? 'doing' : 'new'); }

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
  /* ------------------------------------------------------------- 홈(대시보드) */
  function cardLesson(l) {
    var s = status(l), soon = s === 'soon';
    var stTxt = { done: '완료 ✓', doing: '학습 중', new: '', soon: '' }[s];
    return '<button type="button" class="home-card" data-lesson="' + esc(l.id) + '"' + (soon ? ' aria-disabled="true"' : '') + '>' +
      '<div class="home-card__thumb">' + thumbHtml(l.thumb) + '</div><div class="home-card__body">' +
      '<div class="home-card__title">' + esc(l.title) + '</div><div class="home-card__sum">' + esc(l.summary) + '</div>' +
      '<div class="home-card__meta"><span class="home-tag' + (soon ? ' soon' : '') + '">' + (soon ? '준비 중' : esc(l.level)) + '</span><span>⏱ 약 ' + l.minutes + '분</span>' +
      (stTxt ? '<span class="home-status ' + s + '">' + stTxt + '</span>' : '') + '</div></div></button>';
  }
  /* 2026-10-21: 심화 주제 → 그 내용을 다루는 학습 모듈의 이론 주제(또는 실습)로 바로 연결 */
  var ADV_GO = {
    '데시벨, 전압, 전력 및 신호 레벨': { module: 'amp', find: '데시벨' },
    '게인 구조, 헤드룸과 노이즈 플로어': { module: 'gain-structure', find: '헤드룸' },
    '주파수, 파장, 위상과 극성': { module: 'eq', find: '파장' },
    '마이크 지향성과 피드백': { module: 'mic', find: '지향성' },
    '반사음과 시간 지연': { module: 'fx-space', find: '반사음' },
    '스피커의 지향성 및 시스템 튜닝 기초': { module: 'speaker', find: '튜닝' },
    '아날로그 및 디지털 오디오 연결': { module: 'cable', find: '디지털' },
    '네트워크 오디오와 시스템 운용': { module: 'cable', find: '네트워크' },
    '현장 트러블슈팅의 진단 원리': { tab: 'tab7' }
  };
  function advWhere(a) { var g = ADV_GO[a.title]; if (!g) return null; if (g.tab) return { g: g, label: '음향 트러블슈팅 실습' }; var m = (window.STA_MODULES || {})[g.module]; return m && m.status === 'ready' ? { g: g, label: '「' + m.title + '」 모듈' } : null; }
  function cardAdvOpen(a, i) {
    var w = advWhere(a), need = a.need.map(function (id) { var l = lessonById(id); return l ? l.title : id; }).join(', ');
    return '<button type="button" class="home-card home-adv" data-adv="' + i + '"' + (w ? '' : ' aria-disabled="true"') + '><div class="home-card__body"><div class="home-card__title">' + esc(a.title) + '</div>' +
      '<div class="home-card__sum">' + (w ? '이어서 배울 곳: ' + esc(w.label) : '준비 중') + '</div><div class="home-card__sum home-adv__need">먼저 배울 것: ' + esc(need) + '</div><div class="home-card__meta"><span class="home-tag adv">심화 ' + a.level + '단계</span></div></div></button>';
  }
  /* 2026-10-23 UI 1차 리디자인: 홈 = 소개·학습 시작·나의 학습 현황 → 진행 중(없으면 추천 순서) → 4개 분류 → 기초 이론 → 심화 주제
     카드·버튼은 기존 이동 속성(data-path · data-module · data-lesson · data-mgo-tab · data-adv)을 그대로 써서 기존 이동 코드로 열립니다.
     진도 숫자는 이 브라우저에 저장된 실제 기록(레슨·모듈 완료)만 셉니다. */
  var CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var CAT_ICO = {   // 메뉴 아이콘과 같은 선 굵기·크기
    hardware: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>',
    mixing: '<path d="M6 4v16M12 4v16M18 4v16"/><rect x="4" y="13" width="4" height="3"/><rect x="10" y="7" width="4" height="3"/><rect x="16" y="11" width="4" height="3"/>',
    church: '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    trouble: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5"/><path d="M14.5 6.5 17 4l3 3-2.5 2.5"/>'
  };
  function svgIco(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (CAT_ICO[k] || '') + '</svg>'; }
  /* 교회 시스템 실습 · 트러블슈팅은 메뉴의 실습 화면을 묶어 보여 줍니다(메뉴 구성은 그대로). */
  var HOME_CATS = [
    { id: 'hardware', path: 'hardware', img: 'img/modules/hw_mic.jpg' },
    { id: 'mixing', path: 'mixing', img: 'img/modules/mix2_path.jpg', imgPos: '50% 50%' },
    { id: 'church', title: '교회 시스템 실습', sum: '본당에 설치된 실제 장비 구성으로 배치·배선하고, 콘솔을 직접 조작해 봅니다.', tabs: ['tab2', 'tab5', 'tab6', 'tab1'], img: 'cl5_top.jpg', imgPos: '50% 70%' },
    { id: 'trouble', title: '트러블슈팅', sum: '소리가 안 나거나 하울링이 나는 상황에서 원인을 찾고 복구하는 연습을 합니다.', tabs: ['tab7', 'tabFeedback', 'tabCheck', 'tabTips'], img: 'jack_strip.jpg', imgPos: '30% 50%' }
  ];
  function tabName(tab) { var b = document.querySelector('.tab-btn[data-tab="' + tab + '"] span'); return b ? b.textContent.trim() : tab; }
  function modList() { var M = window.STA_MODULES || {}; return Object.keys(M).map(function (k) { return M[k]; }).filter(function (m) { return m.status === 'ready'; }); }
  function modStatus(id) { return window.STAModules ? STAModules.status(id) : 'new'; }
  function modPct(id) {
    var c = window.STAModules && STAModules.counts(id); if (!c) return 0;
    var n = c.learnN + c.pracN + c.quizN; return n ? Math.round((c.learn + c.prac + c.quiz) / n * 100) : 0;
  }
  function bar(pct, done) { return '<span class="ui-bar' + (done ? ' ui-bar--done' : '') + '" role="presentation"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></span>'; }
  function minTxt(n) { return n >= 60 ? '약 ' + (Math.round(n / 30) / 2) + '시간' : '약 ' + n + '분'; }

  function catCard(c) {
    var P = (window.STA_PATHS || []).find(function (p) { return p.id === c.path; });
    var title = P ? P.title : c.title, sum = P ? P.sum : c.sum, body = '', meta = '', cta = '';
    if (P) {
      var ms = (P.modules || []).map(function (id) { return (window.STA_MODULES || {})[id]; }).filter(Boolean);
      var done = ms.filter(function (m) { return modStatus(m.id) === 'done'; }).length;
      var started = ms.some(function (m) { return modStatus(m.id) !== 'new'; });
      var mins = ms.reduce(function (a, m) { return a + (m.minutes || 0); }, 0);
      var STT = { done: '완료', doing: '진행 중' };
      body = '<ul class="hm-cat__list" aria-label="과정 순서">' + ms.map(function (m) { var s2 = modStatus(m.id);
        return '<li><button type="button" data-module="' + esc(m.id) + '"><span class="no">' + String(m.no).padStart(2, '0') + '</span>' + esc(m.title) + (STT[s2] ? '<span class="st ' + s2 + '">' + STT[s2] + '</span>' : '') + '</button></li>'; }).join('') + '</ul>';
      meta = '<div class="hm-cat__meta"><span>' + ms.length + '개 과정 · ' + minTxt(mins) + '</span><span>완료 <b>' + done + '</b> / ' + ms.length + '</span></div>' + bar(ms.length ? done / ms.length * 100 : 0, done === ms.length && ms.length);
      cta = '<button type="button" class="ui-btn ui-btn--primary ui-btn--block" data-path="' + esc(P.id) + '">' + (done === ms.length && ms.length ? '복습하기' : started ? '이어서 학습하기' : '학습 시작하기') + ARROW + '</button>';
    } else {
      body = '<ul class="hm-cat__list">' + c.tabs.map(function (t) { return '<li><button type="button" data-mgo-tab="' + t + '">' + esc(tabName(t)) + '</button></li>'; }).join('') + '</ul>';
      meta = '<div class="hm-cat__meta"><span>실습 ' + c.tabs.length + '개</span></div>';
      cta = '<button type="button" class="ui-btn ui-btn--secondary ui-btn--block" data-mgo-tab="' + c.tabs[0] + '">' + esc(tabName(c.tabs[0])) + ' 열기' + ARROW + '</button>';
    }
    return '<article class="hm-cat" data-cat="' + c.id + '"><div class="hm-cat__img"><img src="' + esc(c.img) + '" alt="" loading="lazy"' + (c.imgPos ? ' style="object-position:' + c.imgPos + '"' : '') + '><span class="hm-cat__ico">' + svgIco(c.id) + '</span></div>' +
      '<div class="hm-cat__body"><h3 class="hm-cat__title">' + esc(title) + '</h3><p class="hm-cat__sum">' + esc(sum) + '</p>' + body +
      '<div class="hm-cat__foot">' + meta + cta + '</div></div></article>';
  }
  function itemCard(o) {   // o = { attr, img|thumb, kicker, title, pct?, step? }
    var th = o.img ? '<img src="' + esc(o.img) + '" alt="" loading="lazy">' : thumbHtml(o.thumb || 'flow');
    return '<button type="button" class="hm-item" ' + o.attr + '><span class="hm-item__thumb">' + th + (o.step ? '<span class="hm-item__step">' + o.step + '</span>' : '') + '</span>' +
      '<span class="hm-item__body"><span class="hm-item__kicker">' + esc(o.kicker) + '</span><span class="hm-item__title">' + esc(o.title) + '</span>' +
      (o.pct != null ? '<span class="hm-item__prog">' + bar(o.pct) + '<span>' + o.pct + '%</span></span>' : '') + '</span></button>';
  }
  function nextSection(doing, doingL) {
    var pathTitle = function (m) { var P = (window.STA_PATHS || []).find(function (p) { return p.id === m.path; }); return P ? P.title : ''; };
    if (doing.length || doingL.length) {
      var items = doing.map(function (m) { return itemCard({ attr: 'data-module="' + esc(m.id) + '"', img: (window.STA_THUMBS || {})[m.id] || m.img, thumb: 'eq', kicker: pathTitle(m) + ' · ' + String(m.no).padStart(2, '0'), title: m.title, pct: modPct(m.id) }); })
        .concat(doingL.map(function (l) { var s = st(l.id); return itemCard({ attr: 'data-lesson="' + esc(l.id) + '"', thumb: l.thumb, kicker: '기초 이론', title: l.title, pct: Math.round(s.seen.length / 5 * 100) }); }));
      return '<section class="hm-sec" id="homeNext"><div class="hm-sec__head"><h2>진행 중인 학습</h2><p>시작한 과정을 이어서 학습하세요.</p></div><div class="hm-next">' + items.slice(0, 4).join('') + '</div></section>';
    }
    var firstL = lessonById('signal-flow'), mic = (window.STA_MODULES || {}).mic, rec = [];
    if (firstL && firstL.status === 'ready') rec.push({ attr: 'data-lesson="signal-flow"', thumb: firstL.thumb, kicker: '기초 이론 · ' + minTxt(firstL.minutes), title: firstL.title });
    if (mic && mic.status === 'ready') rec.push({ attr: 'data-module="mic"', img: mic.img, kicker: (((window.STA_PATHS || [])[0] || {}).title || '') + ' · 01', title: mic.title });
    rec.push({ attr: 'data-mgo-tab="tab1"', img: 'vi10p.jpg', kicker: '실습', title: tabName('tab1') });
    rec.push({ attr: 'data-mgo-tab="tab6"', img: 'console_strip.jpg', kicker: '실습', title: tabName('tab6') });
    return '<section class="hm-sec" id="homeNext"><div class="hm-sec__head"><h2>처음이라면 이 순서로 시작하세요</h2><p>신호 흐름 → 장비 → 실습 순서로 배우면 이해가 빨라요.</p></div><div class="hm-next">' +
      rec.map(function (o, i) { o.step = i + 1; return itemCard(o); }).join('') + '</div></section>';
  }
  function renderHome() {
    var root = $('tabHome'); if (!root) return;
    var ready = LESSONS.filter(function (l) { return l.status === 'ready'; });
    var doneN = ready.filter(function (l) { return st(l.id).done; }).length;
    var mods = modList();
    var modDone = mods.filter(function (m) { return modStatus(m.id) === 'done'; }).length;
    var doing = mods.filter(function (m) { return modStatus(m.id) === 'doing'; });
    var doingL = ready.filter(function (l) { return status(l) === 'doing'; });
    var total = ready.length + mods.length, pct = total ? Math.round((doneN + modDone) / total * 100) : 0;
    var started = doing.length || doingL.length || doneN || modDone;
    var cta = doing.length ? '<button type="button" class="ui-btn ui-btn--primary" data-module="' + esc(doing[0].id) + '">이어서 학습하기 · ' + esc(doing[0].title) + ARROW + '</button>'
      : '<button type="button" class="ui-btn ui-btn--primary" data-path="hardware">' + (started ? '학습 계속하기' : '학습 시작하기') + ARROW + '</button>';
    root.innerHTML =
      '<section class="hm-hero" aria-labelledby="homeTitle"><div class="hm-hero__media" aria-hidden="true"><img src="cl5_top.jpg" alt=""></div>' +
      '<div class="hm-hero__text"><p class="hm-hero__eyebrow">Better Sound, Better Ministry</p>' +
      '<h1 id="homeTitle">교회 음향팀을 위한<br>실습 중심 교육 플랫폼</h1>' +
      '<p class="hm-hero__lead">장비를 배우고, 직접 조작하고, 소리를 들으며 실제 예배 현장에서 바로 쓸 수 있는 음향 운영을 익힙니다.</p>' +
      '<div class="hm-hero__cta">' + cta + '<button type="button" class="ui-btn ui-btn--on-dark" data-mgo-tab="tabIntro">음향의 중요성 읽기</button></div></div>' +
      '<aside class="hm-me" aria-label="나의 학습 현황"><div class="hm-me__head"><div class="ui-ring" style="--p:' + pct + '"><span>' + pct + '%</span></div><div><h2>나의 학습 현황</h2><p>' + (started ? '완료한 레슨·과정 기준' : '아직 시작 전이에요') + '</p></div></div>' +
      '<div class="hm-me__rows"><div class="hm-me__row"><span>기초 이론</span><b>' + doneN + ' / ' + ready.length + '</b>' + bar(ready.length ? doneN / ready.length * 100 : 0) + '</div>' +
      '<div class="hm-me__row"><span>학습 모듈</span><b>' + modDone + ' / ' + mods.length + '</b>' + bar(mods.length ? modDone / mods.length * 100 : 0) + '</div>' +
      '<div class="hm-me__row"><span>진행 중</span><b>' + (doing.length + doingL.length) + '개</b></div></div>' +
      '<p class="hm-me__note">기록은 이 브라우저에만 저장돼요.</p></aside></section>' +
      nextSection(doing, doingL) +
      '<section class="hm-sec" id="modHome"><div class="hm-sec__head"><h2>전체 학습 과정</h2><p>분야를 골라 시작하세요. 각 과정은 이론 → 실습 → 확인 문제로 이어져요.</p></div><div class="hm-cats">' + HOME_CATS.map(catCard).join('') + '</div></section>' +
      '<section class="hm-sec home-sec" id="homeTheory"><div class="hm-sec__head"><h2>기초 이론</h2><p>학습 과정을 시작하기 전에 먼저 보면 좋은 짧은 레슨이에요.</p></div><div class="home-cards">' + LESSONS.map(cardLesson).join('') + '</div></section>' +
      '<section class="hm-sec home-sec" id="homeAdv"><div class="hm-sec__head"><h2>심화 주제</h2><p>더 깊이 알고 싶은 주제를, 그 내용을 다루는 과정으로 바로 열어요.</p></div><div class="home-cards">' + ADV.map(cardAdvOpen).join('') + '</div></section>';
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
      ((window.STA_LESSON_GLANCE || {})[l.id] ? '<div class="mod-glance" aria-label="한눈에 보기"><h3>한눈에 보기</h3><dl>' + STA_LESSON_GLANCE[l.id].map(function (x) { return '<div class="mod-gl"><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl></div>' : '') +   /* 2026-10-23 */
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
      '</section>';   /* 2026-10-23: 근거 자료 줄은 화면에서 뺌 */
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
  // 2026-10-21: 실습 탭 머리에 다는 관련 이론·모듈 (모든 모듈 개방에 맞춰 넓힘)
  var TAB_MODULES = { tab1: ['mic', 'cable', 'amp', 'speaker'], tab6: ['console', 'gain-structure', 'eq'], tab2: ['cable', 'console', 'amp', 'speaker'], tab5: ['console', 'gain-structure', 'compressor'], tab7: ['cable', 'console'] };   /* 2026-10-23: Ear Training 탭의 관련 모듈 링크는 뺌 */
  var TAB_LESSONS = { tab1: ['signal-flow'], tab2: ['signal-flow'], tab7: ['signal-flow'], tab6: ['gain-fader', 'hpf-eq', 'aux-monitor'], tab5: ['gain-fader', 'aux-monitor'] };
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
      d.innerHTML = theoryLinks(TAB_LESSONS[tab]) + (TAB_MODULES[tab] || []).map(function (id) { var mm = (window.STA_MODULES || {})[id]; return mm && mm.status === 'ready' ? '<button type="button" class="lsn-theory-link mod-weeklink" data-module="' + id + '">🧭 ' + esc(mm.title) + ' 모듈</button>' : ''; }).join(''); head.appendChild(d);
    });
  }
  /* ------------------------------------------------------------- 이벤트 */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null; if (!t) return;
    var lk = t.closest('[data-lesson]');
    if (lk && !lk.closest('.home-card[aria-disabled="true"]') && lk.getAttribute('aria-disabled') !== 'true') { openLesson(lk.getAttribute('data-lesson')); return; }
    var gt = t.closest('[data-go-tab]');
    if (gt && (gt.closest('#tabHome') || gt.closest('#tabLesson'))) { if (gt.closest('#tabLesson')) showBack(); if (typeof switchTab === 'function') switchTab(gt.getAttribute('data-go-tab')); window.scrollTo(0, 0); return; }
    var av = t.closest('#tabHome [data-adv]');
    if (av) { if (av.getAttribute('aria-disabled') === 'true') return; var w = advWhere(ADV[+av.getAttribute('data-adv')]); if (!w) return;
      if (w.g.tab) { if (typeof switchTab === 'function') switchTab(w.g.tab); window.scrollTo(0, 0); } else if (window.STAModules) STAModules.openModule(w.g.module, 'theory', w.g.find); return; }
    if (!t.closest('#tabLesson') && !t.closest('#lsnBack')) return;
    if (t.closest('#lsnBack')) { if (backTo) openLesson(backTo.id, backTo.sec); return; }
    if (t.closest('[data-home]')) { goHome(); return; }
    var stp = t.closest('.lsn-step');
    if (stp) { var pid = stp.getAttribute('data-panel'); var first = SECS.find(function (x) { return x.panel === pid; }); goSec(first.n, false); var sb = document.querySelector('#tabLesson .lsn-steps'); if (sb) { var hd = document.querySelector('.site-header'), off = hd && getComputedStyle(hd).position === 'sticky' ? hd.getBoundingClientRect().height : 0; window.scrollTo(0, Math.max(0, sb.getBoundingClientRect().top + window.scrollY - off - 8)); } return; }   /* 2026-10-24: 단계를 바꾸면 화면 위로 */
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
    renderHome(); addTabLinks();
    if (window.MutationObserver) document.querySelectorAll('#tabHome, #tabLesson').forEach(function (el) { new MutationObserver(function (ms) { if (ms.some(function (m) { return m.attributeName === 'class'; })) onTabChange(); }).observe(el, { attributes: true, attributeFilter: ['class'] }); });
    // 주소 끝 #lesson-<id> 로 레슨 바로 열기 (예: #lesson-gain-fader)
    var m = /^#lesson-([\w-]+)/.exec(location.hash || ''); if (m) openLesson(m[1]);
    window.addEventListener('hashchange', function () { var h = /^#lesson-([\w-]+)/.exec(location.hash || ''); if (h) openLesson(h[1]); });
  }
  window.STALessons = { current: function () { return cur && $('tabLesson') && $('tabLesson').classList.contains('active') ? { id: cur.id, sec: curSec } : null; }, open: openLesson, home: goHome, renderHome: renderHome, state: function (id) { return st(id); }, reset: function () { save({}); renderHome(); }, openPractice: openPractice };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
