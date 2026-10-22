/* =============================================================================
   현장 도구 화면 (2026-10-22, 검토 후 적용)
   - #tabIntro : 음향의 중요성 — 기완 님이 직접 쓰는 빈 교안 (편집 → 저장 = 새 index.html 내려받기, 기존 편집 방식과 같음)
   - #tabCheck : 음향 시스템 자가 진단 기준표 (데이터: lessons/field_data.js STA_CHECK)
   - #tabTips  : 실전 꿀팁 (데이터: lessons/field_data.js STA_TIPS)
   - 진단 결과·즐겨찾기는 이 브라우저에만 저장(localStorage): soundTrainerCheck_v1, soundTrainerTips_v1
   ============================================================================= */
(function () {
  'use strict';
  var CHECK = window.STA_CHECK, TIPS = window.STA_TIPS, MODS = function () { return window.STA_MODULES || {}; };
  var CK = 'soundTrainerCheck_v1', TK = 'soundTrainerTips_v1';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장이 안 돼도 화면은 동작 */ } }
  function fig(name, cap) { var f = window.STAFieldFig && window.STAFieldFig[name]; return f ? '<figure class="fld-fig">' + f() + (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>' : ''; }
  function modLink(id) { var m = MODS()[id]; return m && m.status === 'ready' ? '<button type="button" class="fld-modlink" data-module="' + esc(id) + '">📘 관련 학습: ' + esc(m.title) + ' 모듈</button>' : ''; }

  /* =================================================================== 자가 진단 기준표 */
  var ck = load(CK); ck.items = ck.items || {}; var ckFilter = 'all';
  var LV = {}; (CHECK ? CHECK.levels : []).forEach(function (l) { LV[l.k] = l; });
  function allItems() { var a = []; CHECK.sections.forEach(function (s) { s.items.forEach(function (it) { a.push({ s: s, it: it }); }); }); return a; }
  function score(items) {
    var got = 0, max = 0, answered = 0, n = 0, cnt = { good: 0, warn: 0, bad: 0, na: 0 };
    items.forEach(function (it) { n++; var st = ck.items[it.id] && ck.items[it.id].s; if (!st) return; answered++; cnt[st]++; if (st === 'na') return; got += LV[st].s * it.w; max += 2 * it.w; });
    return { pct: max ? Math.round(got / max * 100) : null, answered: answered, n: n, cnt: cnt };
  }
  function grade(p) { return p == null ? ['—', ''] : p >= 85 ? ['좋아요', 'ok'] : p >= 60 ? ['보완하면 좋아요', 'warn'] : ['개선이 필요해요', 'bad']; }
  function itemHtml(s, it) {
    var v = ck.items[it.id] || {};
    return '<article class="chk-item' + (v.s ? ' is-' + v.s : '') + (it.fig ? ' has-fig' : '') + '" id="chk-' + it.id + '">' + (it.fig ? fig(it.fig) : '') +
      '<div class="chk-item__head"><span class="chk-id">' + it.id + '</span><h4>' + esc(it.q) + '</h4><span class="chk-w" title="중요도">' + '●'.repeat(it.w) + '<i>' + '●'.repeat(3 - it.w) + '</i></span></div>' +
      '<p class="chk-std"><b>양호 기준</b> ' + esc(it.std) + '</p>' +
      '<details class="chk-more"><summary>점검 방법 · 개선 방법</summary><div><p><b>점검 방법</b> ' + esc(it.how) + '</p><p><b>개선 방법</b> ' + esc(it.fix) + '</p>' + (it.link ? modLink(it.link) : '') + '</div></details>' +
      '<div class="chk-row"><div class="chk-lv" role="radiogroup" aria-label="' + esc(it.id + ' 진단 결과') + '">' + CHECK.levels.map(function (l) {
        return '<button type="button" role="radio" class="chk-lvb ' + l.k + (v.s === l.k ? ' on' : '') + '" aria-checked="' + (v.s === l.k) + '" data-ck="' + it.id + '" data-lv="' + l.k + '">' + l.t + '</button>'; }).join('') + '</div>' +
      (it.input ? '<label class="chk-val"><span>' + esc(it.input.label) + '</span><input type="text" inputmode="decimal" data-ckval="' + it.id + '" value="' + esc(v.val || '') + '" placeholder="측정값"><em>' + esc(it.input.unit) + '</em></label>' : '') + '</div>' +
      '<textarea class="chk-note" data-cknote="' + it.id + '" rows="1" placeholder="메모 (예: 3월 측정, 뒷자리 4 dB 작음)">' + esc(v.note || '') + '</textarea></article>';
  }
  function sectionHtml(s) {
    var sc = score(s.items), g = grade(sc.pct);
    return '<details class="chk-sec' + (s.core ? ' core' : ' extra') + '" open data-sec="' + s.id + '"><summary><span class="chk-sec__no">' + s.id + '</span><span class="chk-sec__t">' + esc(s.title) +
      (s.core ? '<em class="chk-badge core">핵심</em>' : '<em class="chk-badge extra">추가 제안</em>') + '</span><span class="chk-sec__sc ' + g[1] + '">' + (sc.pct == null ? sc.answered + '/' + sc.n : sc.pct + '점') + '</span></summary>' +
      '<p class="chk-why">' + esc(s.why) + '</p><div class="chk-sec__bar"><i class="' + g[1] + '" style="width:' + (sc.pct || 0) + '%"></i></div><p class="chk-sec__meta">' + sc.answered + ' / ' + sc.n + ' 항목 진단 · 양호 ' + sc.cnt.good + ' · 주의 ' + sc.cnt.warn + ' · 개선 필요 ' + sc.cnt.bad + '</p>' +
      s.items.map(function (it) { return itemHtml(s, it); }).join('') + '</details>';
  }
  function priorityHtml() {
    var list = allItems().filter(function (x) { var v = ck.items[x.it.id]; return v && (v.s === 'bad' || v.s === 'warn'); })
      .sort(function (a, b) { var sa = ck.items[a.it.id].s === 'bad' ? 0 : 1, sb = ck.items[b.it.id].s === 'bad' ? 0 : 1; return sa - sb || b.it.w - a.it.w; });
    if (!list.length) return '<p class="chk-empty">「개선 필요」나 「주의」로 고른 항목이 여기에 중요한 순서대로 모여요.</p>';
    return '<ol class="chk-prio">' + list.map(function (x) { var st = ck.items[x.it.id].s;
      return '<li class="' + st + '"><a href="#chk-' + x.it.id + '" data-ckjump="' + x.it.id + '"><b>' + x.it.id + '</b> ' + esc(x.it.q) + '</a><span class="chk-tag ' + st + '">' + LV[st].t + '</span><p>' + esc(x.it.fix) + '</p></li>'; }).join('') + '</ol>';
  }
  function summaryHtml() {
    var items = allItems().filter(function (x) { return ckFilter === 'all' || (ckFilter === 'core') === x.s.core; }).map(function (x) { return x.it; });
    var sc = score(items), g = grade(sc.pct);
    return '<div class="chk-sum__score"><div class="chk-ring ' + g[1] + '" style="--p:' + (sc.pct || 0) + '"><b>' + (sc.pct == null ? '—' : sc.pct) + '</b><span>' + (sc.pct == null ? '진단 전' : '점') + '</span></div>' +
      '<div><h3>' + (sc.pct == null ? '아직 진단한 항목이 없어요' : g[0]) + '</h3><p>' + sc.answered + ' / ' + sc.n + ' 항목 진단 · <span class="ok">양호 ' + sc.cnt.good + '</span> · <span class="warn">주의 ' + sc.cnt.warn + '</span> · <span class="bad">개선 필요 ' + sc.cnt.bad + '</span>' + (sc.cnt.na ? ' · 해당 없음 ' + sc.cnt.na : '') + '</p>' +
      '<p class="chk-sum__note">점수 = 양호 2 · 주의 1 · 개선 필요 0 에 중요도(●)를 곱해 합친 비율이에요. 합격/불합격이 아니라 약한 곳을 찾는 용도예요.</p></div></div>';
  }
  function renderCheck() {
    var root = $('chkRoot'); if (!root || !CHECK) return;
    var secs = CHECK.sections.filter(function (s) { return ckFilter === 'all' || (ckFilter === 'core') === s.core; });
    root.innerHTML =
      '<section class="chk-sum"><div class="chk-sum__meta"><label>점검일 <input type="date" data-ckmeta="date" value="' + esc(ck.date || '') + '"></label><label>점검자 <input type="text" data-ckmeta="who" value="' + esc(ck.who || '') + '" placeholder="이름"></label>' +
        '<div class="chk-sum__btns"><button type="button" class="sim-btn" data-ckact="copy">📋 결과 복사</button><button type="button" class="sim-btn" data-ckact="print">🖨 인쇄</button><button type="button" class="sim-btn" data-ckact="reset">처음부터</button></div></div>' +
        '<div data-role="ckSum">' + summaryHtml() + '</div><p class="chk-msg" data-role="ckMsg" role="status"></p></section>' +
      '<div class="chk-filter" role="tablist" aria-label="보기">' + [['all', '전체'], ['core', '핵심 3가지'], ['extra', '추가 제안']].map(function (f) { return '<button type="button" role="tab" aria-selected="' + (ckFilter === f[0]) + '" data-ckfilter="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>' +
      '<p class="chk-guide">항목마다 우리 시스템 상태를 「양호 · 주의 · 개선 필요 · 해당 없음」 중에서 골라요. 「점검 방법」을 펼치면 확인하는 방법과 고치는 방법이 나와요. 기록은 이 브라우저에만 저장돼요.</p>' +
      secs.map(sectionHtml).join('') +
      '<section class="chk-prio-wrap"><h3>🔧 개선 우선순위</h3><div data-role="ckPrio">' + priorityHtml() + '</div></section>' +
      '<p class="lsn-src chk-src">근거 자료: ' + CHECK.sources.map(function (x) { return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.t) + '</a>'; }).join(' · ') + '</p>';
  }
  function refreshCheck(id) {
    var art = $('chk-' + id), it = allItems().find(function (x) { return x.it.id === id; });
    if (art && it) { var tmp = document.createElement('div'); tmp.innerHTML = itemHtml(it.s, it.it); var nu = tmp.firstChild; var open = art.querySelector('.chk-more').open; art.replaceWith(nu); nu.querySelector('.chk-more').open = open; }
    if (it) { var sec = document.querySelector('#chkRoot .chk-sec[data-sec="' + it.s.id + '"]'), sc = score(it.s.items), g = grade(sc.pct);
      if (sec) { var b = sec.querySelector('.chk-sec__sc'); b.className = 'chk-sec__sc ' + g[1]; b.textContent = sc.pct == null ? sc.answered + '/' + sc.n : sc.pct + '점';
        var bar = sec.querySelector('.chk-sec__bar i'); bar.className = g[1]; bar.style.width = (sc.pct || 0) + '%';
        sec.querySelector('.chk-sec__meta').textContent = sc.answered + ' / ' + sc.n + ' 항목 진단 · 양호 ' + sc.cnt.good + ' · 주의 ' + sc.cnt.warn + ' · 개선 필요 ' + sc.cnt.bad; } }
    var s1 = document.querySelector('#chkRoot [data-role=ckSum]'); if (s1) s1.innerHTML = summaryHtml();
    var p1 = document.querySelector('#chkRoot [data-role=ckPrio]'); if (p1) p1.innerHTML = priorityHtml();
  }
  function reportText() {
    var out = ['[음향 시스템 자가 진단]', '점검일: ' + (ck.date || '-') + '  점검자: ' + (ck.who || '-')];
    var sc = score(allItems().map(function (x) { return x.it; })); out.push('전체: ' + (sc.pct == null ? '진단 전' : sc.pct + '점') + ' (' + sc.answered + '/' + sc.n + ' 항목)');
    CHECK.sections.forEach(function (s) { var ss = score(s.items); out.push('', s.id + '. ' + s.title + ' — ' + (ss.pct == null ? '진단 전' : ss.pct + '점'));
      s.items.forEach(function (it) { var v = ck.items[it.id]; if (!v || !v.s) return; out.push('  ' + it.id + ' [' + LV[v.s].t + '] ' + it.q + (v.val ? ' (측정: ' + v.val + ' ' + (it.input ? it.input.unit : '') + ')' : '') + (v.note ? ' — ' + v.note : '')); }); });
    return out.join('\n');
  }
  function msg(t) { var m = document.querySelector('#chkRoot [data-role=ckMsg]'); if (m) { m.textContent = t; clearTimeout(msg.t); msg.t = setTimeout(function () { m.textContent = ''; }, 4000); } }

  /* =================================================================== 실전 꿀팁 */
  var tk = load(TK); tk.star = tk.star || {}; var tipCat = 'all', tipQ = '', tipStar = false;
  function catName(k) { var c = TIPS.cats.find(function (x) { return x.k === k; }); return c ? c.t : k; }
  function tipHtml(t) {
    var on = !!tk.star[t.id];
    return '<article class="tip-card' + (t.fig ? ' has-fig' : '') + '" id="tip-' + t.id + '"><div class="tip-card__top"><span class="tip-cat">' + (window.STAFieldIcon ? STAFieldIcon(t.cat) : '') + esc(catName(t.cat)) + '</span><button type="button" class="tip-star' + (on ? ' on' : '') + '" data-tipstar="' + t.id + '" aria-pressed="' + on + '" title="즐겨찾기">' + (on ? '★' : '☆') + '</button></div>' +
      '<h4>' + esc(t.title) + '</h4>' + (t.fig ? fig(t.fig) : '') + '<p class="tip-scene"><b>이런 상황</b> ' + esc(t.scene) + '</p>' +
      '<div class="tip-how"><b>이렇게 해요</b><ol>' + t.how.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>' +
      '<p class="tip-why"><b>왜 그럴까요?</b> ' + esc(t.why) + '</p>' + (t.link ? modLink(t.link) : '') + '</article>';
  }
  function tipList() {
    var q = tipQ.trim().toLowerCase();
    return TIPS.tips.filter(function (t) { return (tipCat === 'all' || t.cat === tipCat) && (!tipStar || tk.star[t.id]) && (!q || (t.title + t.scene + t.how.join(' ') + t.why).toLowerCase().indexOf(q) >= 0); });
  }
  function renderTipCards() { var box = document.querySelector('#tipRoot [data-role=tipCards]'); if (!box) return; var list = tipList();
    box.innerHTML = list.length ? list.map(tipHtml).join('') : '<p class="chk-empty">조건에 맞는 꿀팁이 없어요.</p>';
    var c = document.querySelector('#tipRoot [data-role=tipCount]'); if (c) c.textContent = list.length + '개'; }
  function renderTips() {
    var root = $('tipRoot'); if (!root || !TIPS) return;
    root.innerHTML = '<p class="tip-lead">현장에서 자주 겪는 상황과 대처법이에요. 우리 팀 상황에 맞게 고쳐 쓰세요. ☆ 를 눌러 즐겨찾기 해 두면 다시 보기 쉬워요.</p>' +
      '<div class="tip-tools"><div class="chk-filter tip-cats" role="tablist" aria-label="분류">' + [['all', '전체']].concat(TIPS.cats.map(function (c) { return [c.k, c.t]; })).map(function (c) {
        return '<button type="button" role="tab" aria-selected="' + (tipCat === c[0]) + '" data-tipcat="' + c[0] + '">' + (c[0] !== 'all' && window.STAFieldIcon ? STAFieldIcon(c[0]) : '') + esc(c[1]) + '</button>'; }).join('') + '</div>' +
      '<div class="tip-search"><input type="search" data-role="tipQ" placeholder="검색 (예: 배터리, 하울링)" value="' + esc(tipQ) + '" aria-label="꿀팁 검색"><label><input type="checkbox" data-role="tipStar"' + (tipStar ? ' checked' : '') + '> ★ 만 보기</label><span data-role="tipCount"></span></div></div>' +
      '<div class="tip-grid" data-role="tipCards"></div>' +
      '<p class="tip-foot">※ 여러 교회 현장에서 흔히 쓰는 일반적인 노하우예요. 숫자는 대략적인 경향이에요. 우리 팀만의 꿀팁이 생기면 알려 주세요 — 여기에 계속 더해 갈게요.</p>';
    renderTipCards();
  }

  /* =================================================================== 음향의 중요성 (빈 교안 · 편집) */
  function introToolbar(on) {
    var tb = $('introTools'); if (tb) tb.hidden = !on;
  }
  function watchIntroEdit() {
    var bar = $('tabIntroEditBar'); if (!bar || !window.MutationObserver) return;
    new MutationObserver(function () { introToolbar(bar.classList.contains('edit-mode-on')); }).observe(bar, { attributes: true, attributeFilter: ['class'] });
  }

  /* =================================================================== 이벤트 */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var lv = t.closest('#chkRoot [data-ck]');
    if (lv) { var id = lv.getAttribute('data-ck'), k = lv.getAttribute('data-lv'), v = ck.items[id] || {}; v.s = v.s === k ? null : k; ck.items[id] = v; save(CK, ck); refreshCheck(id); return; }
    var fl = t.closest('#chkRoot [data-ckfilter]'); if (fl) { ckFilter = fl.getAttribute('data-ckfilter'); renderCheck(); return; }
    var jp = t.closest('#chkRoot [data-ckjump]'); if (jp) { e.preventDefault(); var el = $('chk-' + jp.getAttribute('data-ckjump')); if (el) { var sec = el.closest('details'); if (sec) sec.open = true; el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1600); } return; }
    var act = t.closest('#chkRoot [data-ckact]');
    if (act) { var a = act.getAttribute('data-ckact');
      if (a === 'copy') { var txt = reportText(); try { navigator.clipboard.writeText(txt).then(function () { msg('결과를 복사했어요. 메신저나 문서에 붙여 넣으세요.'); }, function () { prompt('아래 글을 복사하세요', txt); }); } catch (err) { prompt('아래 글을 복사하세요', txt); } }
      if (a === 'print') { document.body.classList.add('chk-printing'); window.print(); setTimeout(function () { document.body.classList.remove('chk-printing'); }, 500); }
      if (a === 'reset') { if (act.getAttribute('data-sure') === '1') { ck = { items: {} }; save(CK, ck); renderCheck(); msg('진단 기록을 모두 지웠어요.'); } else { act.setAttribute('data-sure', '1'); act.textContent = '한 번 더 누르면 모두 지워요'; setTimeout(function () { act.removeAttribute('data-sure'); act.textContent = '처음부터'; }, 3000); } }
      return; }
    var tc = t.closest('#tipRoot [data-tipcat]'); if (tc) { tipCat = tc.getAttribute('data-tipcat'); document.querySelectorAll('#tipRoot [data-tipcat]').forEach(function (b) { b.setAttribute('aria-selected', String(b === tc)); }); renderTipCards(); return; }
    var ts = t.closest('#tipRoot [data-tipstar]'); if (ts) { var tid = ts.getAttribute('data-tipstar'); if (tk.star[tid]) delete tk.star[tid]; else tk.star[tid] = 1; save(TK, tk); var on = !!tk.star[tid]; ts.classList.toggle('on', on); ts.textContent = on ? '★' : '☆'; ts.setAttribute('aria-pressed', String(on)); if (tipStar) renderTipCards(); return; }
    var ib = t.closest('#introTools [data-fmt]'); if (ib) { e.preventDefault(); var f = ib.getAttribute('data-fmt'), doc = $('introDoc'); if (doc) doc.focus();
      try { if (f === 'b') document.execCommand('bold'); else if (f === 'ul') document.execCommand('insertUnorderedList'); else document.execCommand('formatBlock', false, f); } catch (err) { /* 오래된 브라우저 */ } return; }
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.matches('#chkRoot [data-cknote]')) { var id = t.getAttribute('data-cknote'), v = ck.items[id] || {}; v.note = t.value; ck.items[id] = v; save(CK, ck); return; }
    if (t.matches('#chkRoot [data-ckval]')) { var id2 = t.getAttribute('data-ckval'), v2 = ck.items[id2] || {}; v2.val = t.value; ck.items[id2] = v2; save(CK, ck); return; }
    if (t.matches('#chkRoot [data-ckmeta]')) { ck[t.getAttribute('data-ckmeta')] = t.value; save(CK, ck); return; }
    if (t.matches('#tipRoot [data-role=tipQ]')) { tipQ = t.value; renderTipCards(); return; }
  });
  document.addEventListener('change', function (e) { var t = e.target; if (t && t.matches && t.matches('#tipRoot [data-role=tipStar]')) { tipStar = t.checked; renderTipCards(); } });
  document.addEventListener('mousedown', function (e) { if (e.target.closest && e.target.closest('#introTools [data-fmt]')) e.preventDefault(); });   // 편집 중 선택 영역 유지

  function init() { renderCheck(); renderTips(); watchIntroEdit(); }
  window.STAField = { renderCheck: renderCheck, renderTips: renderTips, check: function () { return ck; }, tips: function () { return tk; }, report: reportText, score: function () { return score(allItems().map(function (x) { return x.it; })); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
