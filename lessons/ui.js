/* =============================================================================
   UI 1차 리디자인 (2026-10-23) — 좁은 화면(1023px 이하) 메뉴 서랍 + 상단 바 「현재 위치」
   - 메뉴 버튼(#navToggle)은 기존 .tab-nav 를 서랍처럼 열고 닫기만 합니다. 메뉴 안 버튼의 onclick·switchTab 은 그대로입니다.
   - 메뉴 항목을 누르면 서랍을 닫습니다. 바탕을 누르거나 Esc 를 눌러도 닫힙니다.
   ============================================================================= */
(function () {
  'use strict';
  var root = document.documentElement;
  var nav = document.querySelector('.site-header .tab-nav');
  var btn = document.getElementById('navToggle');
  var cur = document.getElementById('navCurrent');
  var backdrop = document.getElementById('navBackdrop');
  if (!nav || !btn) return;
  var mq = window.matchMedia ? window.matchMedia('(max-width: 1023px)') : null;
  function narrow() { return mq ? mq.matches : window.innerWidth <= 1023; }

  function setOpen(open, focusBack) {
    if (open && !narrow()) open = false;
    root.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      nav.setAttribute('role', 'dialog'); nav.setAttribute('aria-modal', 'true'); nav.setAttribute('aria-label', '전체 메뉴');
      var a = nav.querySelector('.tab-btn.active, .tab-group.active, .nav-mod.active') || nav.querySelector('.tab-btn, .tab-group');
      if (a) { try { a.focus({ preventScroll: true }); a.scrollIntoView({ block: 'nearest' }); } catch (e) { /* noop */ } }
    } else {
      nav.removeAttribute('role'); nav.removeAttribute('aria-modal'); nav.removeAttribute('aria-label');
      if (focusBack) { try { btn.focus({ preventScroll: true }); } catch (e) { /* noop */ } }
    }
  }
  btn.addEventListener('click', function () { setOpen(!root.classList.contains('nav-open'), false); });
  if (backdrop) backdrop.addEventListener('click', function () { setOpen(false, true); });
  document.addEventListener('keydown', function (e) {
    if (!root.classList.contains('nav-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false, true); return; }
    if (e.key === 'Tab') {   // 서랍 안에서만 이동
      var items = Array.prototype.filter.call(nav.querySelectorAll('button'), function (x) { return x.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // 메뉴 항목을 누르면(기존 onclick 실행 뒤) 서랍 닫기
  nav.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.tab-btn, .tab-group, .nav-mod')) setTimeout(function () { setOpen(false, false); }, 0);
  });
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (!narrow()) setOpen(false, false); });

  // 상단 바 「현재 위치」: 선택된 묶음 › 선택된 메뉴
  function label(el) { var s = el && el.querySelector('span'); return s ? s.textContent.trim() : ''; }
  function updateCurrent() {
    if (!cur) return;
    var g = nav.querySelector('.tab-group.active') || nav.querySelector('.tab-group.in');
    var b = nav.querySelector('.tab-btn.active');
    var gt = label(g), bt = label(b), md = nav.querySelector('.nav-mod.active');
    var html = '';
    if (md) html = esc(gt) + ' › <b>' + esc(md.lastElementChild ? md.lastElementChild.textContent : '') + '</b>';   // 2026-10-23 과정 화면
    else if (nav.querySelector('.tab-group.active')) html = '<b>' + esc(gt) + '</b>';
    else if (gt && bt) html = esc(gt) + ' › <b>' + esc(bt) + '</b>';
    else if (bt) html = '<b>' + esc(bt) + '</b>';
    cur.innerHTML = html;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  if (window.MutationObserver) new MutationObserver(updateCurrent).observe(nav, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  updateCurrent();
})();
