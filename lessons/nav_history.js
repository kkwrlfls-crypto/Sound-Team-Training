/* =============================================================================
   브라우저 「뒤로 가기 / 앞으로 가기」 지원 (2026-10-21)
   - 화면이 바뀔 때마다(메뉴 탭, 학습 경로, 모듈과 모듈 안의 단계 탭, 이론 레슨) 방문 기록을 하나씩 남김
   - 뒤로 가기를 누르면 바로 전 화면으로 돌아감. 주소(#…)로 바로 열기도 됨: #go-tab2, #path-hardware, #module-mic-practice, #lesson-gain-fader
   - 기존 화면 코드는 고치지 않고, 화면이 바뀐 뒤의 상태를 읽어 기록만 함
   ============================================================================= */
(function () {
  'use strict';
  var restoring = false, timer = null, ready = false;
  function activeTab() { var a = document.querySelector('.tab-content.active'); return a ? a.id : 'tabHome'; }
  function snap() {
    var tab = activeTab(), h = location.hash || '';
    if ((tab === 'tabModule' || tab === 'tabPath') && window.STAModules) { var v = STAModules.view();
      return { tab: tab, hash: tab === 'tabPath' ? '#path-' + v.path : '#module-' + v.mod + (v.tab && v.tab !== 'overview' ? '-' + v.tab : '') }; }
    if (tab === 'tabLesson' && window.STALessons && STALessons.current) { var c = STALessons.current(); if (c) return { tab: tab, lesson: c.id, sec: c.sec, hash: '#lesson-' + c.id }; }
    return { tab: tab, hash: tab === 'tabHome' ? '' : '#go-' + tab };
  }
  function same(a, b) { return !!a && !!b && a.tab === b.tab && a.hash === b.hash && (a.sec || 0) === (b.sec || 0); }
  function url(s) { return location.pathname + location.search + (s.hash || ''); }
  function record() {
    if (restoring || !ready) return; var s = snap(), cur = history.state && history.state.sta;
    if (same(s, cur)) { if (location.hash !== (s.hash || '') ) history.replaceState({ sta: s }, '', url(s)); return; }
    history.pushState({ sta: s }, '', url(s));
  }
  function later() { clearTimeout(timer); timer = setTimeout(record, 30); }
  function restore(s) {
    restoring = true;
    try {
      if (!s || s.tab === 'tabHome') { if (window.STALessons) STALessons.home(); else switchTab('tabHome'); }
      else if (s.tab === 'tabLesson' && s.lesson && window.STALessons) STALessons.open(s.lesson, s.sec);
      else if (/^#path-([\w-]+)$/.test(s.hash || '') && window.STAModules) STAModules.openPath(s.hash.slice(6));
      else if (/^#module-/.test(s.hash || '') && window.STAModules) { var m = /^#module-([\w-]+?)(?:-(overview|theory|practice|quiz|missions|deeper))?$/.exec(s.hash); if (m) STAModules.openModule(m[1], m[2]); }
      else if (typeof switchTab === 'function' && document.getElementById(s.tab)) { switchTab(s.tab); var hb = document.getElementById('modBack'); if (hb) hb.hidden = true; var lb = document.getElementById('lsnBack'); if (lb) lb.hidden = true; }
      try { history.replaceState({ sta: s || snap() }, '', url(s || snap())); } catch (e) { /* noop */ }
      window.scrollTo(0, 0);
    } finally { setTimeout(function () { restoring = false; }, 60); }
  }
  function init() {
    if (typeof window.switchTab === 'function' && !window.switchTab.__staHist) {
      var orig = window.switchTab, wrapped = function (id) { var r = orig.apply(this, arguments); later(); return r; };
      wrapped.__staHist = true; window.switchTab = wrapped;
    }
    var g = /^#go-(tab\w+)$/.exec(location.hash || ''); if (g && document.getElementById(g[1])) window.switchTab(g[1]);
    document.addEventListener('click', later, true);
    document.addEventListener('click', later);
    window.addEventListener('popstate', function (e) { if (e.state && e.state.sta) restore(e.state.sta); });
    window.addEventListener('hashchange', function () { var h = /^#go-(tab\w+)$/.exec(location.hash || ''); if (h && document.getElementById(h[1])) { restoring = true; window.switchTab(h[1]); window.scrollTo(0, 0); setTimeout(function () { restoring = false; history.replaceState({ sta: snap() }, '', url(snap())); }, 60); } });
    history.replaceState({ sta: snap() }, '', url(snap())); ready = true;
  }
  window.STAHistory = { snap: snap, record: record, restore: restore };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); }); else setTimeout(init, 0);
})();
