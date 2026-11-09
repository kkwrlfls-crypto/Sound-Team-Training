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
    if (window.STA_WHERE) { var tr = window.STA_WHERE(), last = tr.pop(); cur.innerHTML = tr.filter(Boolean).map(esc).join(' › ') + (tr.length ? ' › ' : '') + '<b>' + esc(last || '') + '</b>'; return; }   // 2026-11-09 메뉴 계층과 같은 위치
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
  /* 2026-10-23: 화면 곳곳의 사진 출처 줄은 없애고, 메뉴 맨 아래 작은 「사진 출처」에 모음
     (자유 이용 사진은 라이선스상 저작자 표시가 필요해서 한곳에 남겨 둠) */
  function creditsHtml() {
    var C = window.STA_IMG_CREDITS || {}, items = Object.keys(C).filter(function (k) { return C[k].url; }).map(function (k) {
      return '<li><a href="' + esc(C[k].url) + '" target="_blank" rel="noopener">' + esc(C[k].t.replace(/^사진:\s*/, '')) + '</a></li>'; });
    return '<div style="font-size:.9rem;line-height:1.7"><p style="margin:0 0 8px">자유 이용 사진(저작자 표시 필요)</p><ul style="margin:0 0 12px;padding-left:18px">' + items.join('') + '</ul>' +
      '<p style="margin:0">장비 사진은 각 제조사 공식 웹사이트의 제품 이미지와 제품 사진이에요. 학습 화면의 MG12XU 사진은 「콘솔 실습」의 MG12XU 화면 콘솔(Yamaha 제품 사진 + 실습용 페이더)이에요.</p></div>';
  }
  if (!nav.querySelector('.nav-credits')) {
    var cb = document.createElement('button'); cb.type = 'button'; cb.className = 'nav-credits'; cb.textContent = '사진 출처';
    cb.addEventListener('click', function () { setOpen(false, false); if (typeof showModal === 'function') showModal('사진 출처', creditsHtml()); });
    var hold = function () { nav.appendChild(cb); };   // 메뉴가 다시 짜여도 맨 아래에
    hold(); if (window.MutationObserver) new MutationObserver(function () { if (nav.lastElementChild !== cb) hold(); }).observe(nav, { childList: true });
  }
  if (window.MutationObserver) new MutationObserver(updateCurrent).observe(nav, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  updateCurrent();

  /* 2026-10-24 피드백: 긴 화면 아래에서 위로 끌어올리기 힘듦 → 한 화면 넘게 내려가면 오른쪽 아래에 「맨 위로」 버튼 */
  var topBtn = document.createElement('button'); topBtn.type = 'button'; topBtn.id = 'toTopBtn'; topBtn.setAttribute('aria-label', '맨 위로');
  topBtn.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg><span>맨 위로</span>';
  topBtn.addEventListener('click', function () { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); } });
  document.body.appendChild(topBtn);
  var topTick = false;
  function updateTop() { topTick = false; topBtn.classList.toggle('show', window.scrollY > Math.max(600, window.innerHeight * 0.8)); }
  window.addEventListener('scroll', function () { if (!topTick) { topTick = true; requestAnimationFrame(updateTop); } }, { passive: true });
  updateTop();
})();

/* =============================================================================
   2026-11-09 내부 화면 재구성 4차: 교안 편집 도구를 학습 화면과 분리 (편집 모드)
   - 평소(학습자 화면)에는 「✏️ 교안 편집 · 설명 내용 편집 · 기능부 설명 편집」 줄을 숨김
   - 주소 끝에 ?edit=1 을 붙여 열면 편집 모드: 편집 줄이 보이고, 화면 아래에 「편집 모드」 표시와 끄기 링크
   - 편집 내용 저장(새 index.html 내려받기) 때는 편집 모드 표시를 빼고 저장 → 내려받은 파일을 그대로 올려도 학습자에게 편집 도구가 안 보임
   - 기존 편집 함수(toggleContentEdit · saveEditedContent · cancelContentEdit)는 그대로
   ============================================================================= */
(function () {
  'use strict';
  var root = document.documentElement, on = false;
  try { on = new URLSearchParams(location.search).get('edit') === '1'; } catch (e) { on = /[?&]edit=1(&|$)/.test(location.search); }
  if (!on) return;
  root.classList.add('sta-edit');
  var pill = document.createElement('div'); pill.id = 'staEditPill'; pill.className = 'sta-edit-pill'; pill.setAttribute('role', 'status');
  var off = location.pathname + location.search.replace(/([?&])edit=1(&|$)/, function (m0, a, b) { return b ? a : ''; }).replace(/[?&]$/, '') + location.hash;
  pill.innerHTML = '<b>✏️ 교안 편집 모드</b><span>편집 줄이 보여요. 학습자 화면에는 나오지 않아요.</span><a href="' + off.replace(/"/g, '&quot;') + '">편집 모드 끄기</a>';
  document.body.appendChild(pill);
  // 저장 단추(onclick → saveEditedContent → 화면 전체를 index.html 로 저장)보다 먼저(캡처 단계) 표시를 빼고, 저장이 끝나면 다시 붙임
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.content-edit-btn.save')) return;
    root.classList.remove('sta-edit'); if (!root.className) root.removeAttribute('class'); pill.remove();
    setTimeout(function () { root.classList.add('sta-edit'); document.body.appendChild(pill); }, 0);
  }, true);
})();
