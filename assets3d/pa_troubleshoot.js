/*
 * 음향 트러블슈팅 탭 — 화면 (Sound-Team-Training)
 *  - 계산은 모두 assets3d/pa_troubleshoot_engine.js (window.PaTsEngine). 이 파일은 화면·3D 공간만 담당
 *  - 진행(2026-10-20 개편): 3D 로 살펴보기 → 원인(장비 + 무엇이 문제)을 골라 제출 → 맞히면 「정답이에요!」 → 직접 고치기 → 최종 확인
 *  - 3D 공간 화면은 기존 장비 모델(SM58S·MG12XU·ZXA1·Crown·ZX1·콘센트)과 케이블 모델을 재사용한다
 *  - 전역: window.PaTroubleshoot (start / select / answer / op / hint / verify / getSession) — 테스트·자동화용
 */
(function () {
  'use strict';
  var E = null, root = null, S = null, view3d = null, sel = null, lastResult = null;
  var STORE = 'soundTrainerTroubleshoot_v1';

  function esc(t) { return String(t === undefined || t === null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(sel_) { return root.querySelector(sel_); }
  function loadBest() { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; } }
  function saveBest(k, v) { try { var b = loadBest(); if (!b[k] || b[k] < v) { b[k] = v; localStorage.setItem(STORE, JSON.stringify(b)); } } catch (e) { /* 무시 */ } }

  // ---------------------------------------------------------------------------
  // 화면 골격 (2026-10-20 개편: 검사 도구·흐름도·진행 단계 없이 「3D 로 살펴보기 → 원인 골라 제출 → 맞히면 직접 고치기 → 최종 확인」)
  //  - 데스크톱: 왼쪽 3D 공간 / 오른쪽 답 제출·고치기 패널.  모바일: 공간 → 패널 세로
  function renderShell() {
    root.innerHTML =
      '<div class="ts-note">🧪 <b>교육용 가상 시뮬레이션</b>이에요. 실제 소리·전기를 다루지 않고 장비 상태로 계산한 결과를 보여 줘요. 화면의 dB 값은 근사 계산값이라 <b>실제 현장 측정값이나 SPL 이 아니에요.</b> 전원 조작도 가상이에요.</div>' +
      '<section class="ts-missions" data-role="missions"></section>' +
      '<section class="ts-play" data-role="play" hidden>' +
        '<div class="ts-card ts-headcard">' +
          '<div class="ts-head"><div class="ts-headtxt"><span class="ts-level" data-role="level"></span><div class="ts-mtitle" data-role="mtitle"></div></div>' +
            '<div class="ts-head-btns"><button type="button" class="ts-btn" data-act="hint">💡 힌트 <span data-role="hintn">0/3</span></button><button type="button" class="ts-btn" data-act="list">미션 목록</button></div></div>' +
          '<div class="ts-symptom"><b>⚠️ 증상</b><span data-role="symptom"></span></div>' +
          '<div class="ts-pathline"><b>🔀 신호 경로</b><span data-role="chain"></span></div>' +
        '</div>' +
        '<div class="ts-hints" data-role="hints" hidden></div>' +
        '<div class="ts-grid">' +
          '<div class="ts-card ts-space"><h4>공간 화면 <small>장비·케이블을 눌러 가까이 살펴보세요 (끌어서 돌리기, 휠로 확대)</small></h4><div class="ts-viewport" data-role="viewport"><div class="ts-loading" data-role="loading">3D 장비를 불러오는 중…</div><div class="ts-tip" data-role="tip"></div></div>' +
            '<div class="ts-chips" data-role="chips"></div></div>' +
          '<div class="ts-card ts-panel" data-role="panel"></div>' +
        '</div>' +
      '</section>' +
      '<section class="ts-result" data-role="result" hidden></section>';
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    root.addEventListener('submit', onSubmit);
    renderMissions();
  }
  function chainHtml(m) { return m.chain.split('→').map(function (x) { return '<span class="ts-cnode">' + esc(x.trim()) + '</span>'; }).join('<span class="ts-carrow">→</span>'); }
  function renderMissions() {
    var best = loadBest();
    $('[data-role=missions]').innerHTML = '<h3 class="ts-h3">미션 선택</h3><div class="ts-mgrid">' + E.MISSIONS.map(function (m) {
      return '<div class="ts-mcard" data-mid="' + m.id + '"><div class="ts-mtop"><span class="ts-level">' + esc(m.level) + '</span><span class="ts-mid">미션 ' + m.id + '</span></div><div class="ts-mname">' + esc(m.title) + '</div>' +
        '<div class="ts-mrow"><b>문제 상황</b><p>' + esc(m.symptom) + '</p></div>' +
        '<div class="ts-mrow"><b>장비 연결</b><div class="ts-chainbox">' + chainHtml(m) + '</div></div>' +
        (m.principle ? '<div class="ts-mrow"><b>이번에 익힐 진단 원리</b><p>' + esc(m.principle) + '</p></div>' : '') +
        '<button type="button" class="ts-btn ts-primary ts-startbtn" data-act="start" data-m="' + m.id + '" data-s="random">▶ 미션 시작</button>' +
        '<div class="ts-scen"><span class="ts-scenlbl">시나리오 골라서:</span>' + m.scenarios.map(function (sc, i) {
          var b = best[sc.id]; return '<button type="button" class="ts-btn ts-sbtn" data-act="start" data-m="' + m.id + '" data-s="' + sc.id + '">' + (i + 1) + (b !== undefined ? ' <small>최고 ' + b + '점</small>' : '') + '</button>'; }).join('') + '</div></div>'; }).join('') + '</div>' +
      '<p class="ts-small">진행 방법: ① 증상을 읽고 ② 3D 화면에서 장비를 살펴본 뒤 ③ 원인을 골라 제출하고 ④ 맞히면 직접 고쳐서 ⑤ 최종 확인해요.</p>' +
      '<details class="ts-scorehelp"><summary>점수 계산 방법</summary><p class="ts-small">100점에서 힌트 단계마다 −10 · 틀린 답 제출 −10(최대 −30) · 고장과 관계없는 조작 −5(최대 −30) · 최종 확인 실패 −10</p></details>';
  }

  // ---------------------------------------------------------------------------
  function start(mid, sid) {
    var m = E.mission(mid); if (!m) return null;
    if (sid === 'random' || !E.scenario(m, sid)) sid = m.scenarios[Math.floor(Math.random() * m.scenarios.length)].id;
    S = E.newSession(mid, sid); sel = null; lastResult = null; ansMsg = null;
    $('[data-role=missions]').hidden = true; $('[data-role=result]').hidden = true; $('[data-role=play]').hidden = false;
    $('[data-role=level]').textContent = m.level;
    $('[data-role=mtitle]').textContent = '미션 ' + m.id + '. ' + m.title + ' · 시나리오 ' + (m.scenarios.findIndex(function (x) { return x.id === sid; }) + 1);
    $('[data-role=chain]').innerHTML = chainHtml(m);
    $('[data-role=symptom]').textContent = m.symptom;
    $('[data-role=hints]').hidden = true; $('[data-role=hints]').innerHTML = '';
    renderChips(); renderPanel(); updateHintBtn();
    build3d();
    return S;
  }
  function M() { return E.mission(S.mission); }
  function renderChips() {
    var m = M(), st = S.state, items = Object.keys(st.devices).filter(function (id) { return st.devices[id].type !== 'outlet'; }).map(function (id) { return [id, E.devName(m, id)]; })
      .concat(st.cables.map(function (c) { return ['cable:' + c.id, c.label]; }));
    $('[data-role=chips]').innerHTML = items.map(function (x) { return '<button type="button" class="ts-chip' + (sel === x[0] ? ' on' : '') + '" data-act="sel" data-id="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('');
  }

  // 오른쪽 패널: 정답 전에는 「원인 고르기」, 맞힌 뒤에는 「직접 고치기」
  var ansMsg = null;   // 마지막 제출 결과 { ok, devOk, ... }
  function selTarget() { return sel ? sel.replace(/^cable:/, '') : ''; }
  function problemOptions(tid) {
    var t = E.answerTargets(M(), S.state).filter(function (x) { return x.id === tid; })[0];
    return '<option value="">— 먼저 장비를 고르세요 —</option>'.replace(/.*/, t ? '<option value="">— 무엇이 문제인가요? —</option>' : '$&') +
      (t ? t.problems.map(function (k) { return '<option value="' + k + '">' + esc(E.PROBLEMS[k]) + '</option>'; }).join('') : '');
  }
  function answerFormHtml() {
    var m = M(), tg = E.answerTargets(m, S.state), cur = selTarget(), tries = S.log.filter(function (e) { return e.kind === 'answer'; });
    var devs = tg.filter(function (x) { return !x.cable; }), cabs = tg.filter(function (x) { return x.cable; });
    function opt(x) { return '<option value="' + x.id + '"' + (x.id === cur ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }
    var h = '<h4>🕵️ 원인 찾기</h4><p class="ts-lead">증상을 읽고 3D 화면에서 장비와 케이블을 살펴보세요. 원인을 찾았으면 아래에서 골라 <b>제출</b>하세요.</p>' +
      '<form class="ts-answer" data-role="answer"><label><span>① 어느 장비(케이블)에 문제가 있나요?</span><select data-role="atarget"><option value="">— 장비·케이블 고르기 —</option><optgroup label="장비">' + devs.map(opt).join('') + '</optgroup><optgroup label="케이블">' + cabs.map(opt).join('') + '</optgroup></select></label>' +
      '<label><span>② 무엇이 문제인가요?</span><select data-role="aproblem">' + problemOptions(cur) + '</select></label>' +
      '<button type="submit" class="ts-btn ts-primary ts-submit" data-role="asubmit">📮 제출하기</button></form>';
    if (ansMsg && !ansMsg.ok) h += '<div class="ts-ansfb bad" data-role="ansfb"><b>❌ 아직 아니에요.</b> ' + (ansMsg.devOk ? '<b>장비(케이블)는 맞았어요!</b> 그런데 문제는 다른 거예요. 그 장비를 3D 화면에서 더 가까이 살펴보세요.' : '이 장비가 원인은 아니에요. 증상을 다시 읽고, 신호가 지나가는 순서대로 다른 곳을 살펴보세요.') + (S.hints < 3 ? ' 막히면 💡 힌트를 눌러 보세요.' : '') + '</div>';
    if (tries.length) h += '<div class="ts-tries"><div class="ts-rlbl">제출 기록</div><ol>' + tries.map(function (e) { return '<li class="' + (e.ok ? 'ok' : 'bad') + '">' + (e.ok ? '✅ ' : '❌ ') + esc(e.targetName) + ' — ' + esc(e.problemText) + '</li>'; }).join('') + '</ol></div>';
    return h;
  }
  function fixHtml() {
    var m = M(), st = S.state, sc = E.scenario(m, S.scenario);
    var h = '<div class="ts-correct" data-role="correct"><div class="ts-correct-t">🎉 정답이에요! 원인을 맞혔어요.</div><p><b>원인</b> ' + esc(sc.cause) + '</p>' + ((m.why || {})[sc.id] ? '<p class="ts-small">' + esc(m.why[sc.id]) + '</p>' : '') + '</div>' +
      '<h4>🛠 이제 직접 고쳐 보세요</h4><p class="ts-lead">3D 화면이나 아래 이름표에서 고칠 장비(케이블)를 고르면 조작 버튼이 나와요. 고친 뒤 <b>최종 확인</b>을 누르세요.</p>';
    if (!sel) h += '<div class="ts-empty">고칠 장비(케이블)를 먼저 고르세요.</div>';
    else {
      var isCable = sel.indexOf('cable:') === 0, name = isCable ? E.cableById(st, sel.slice(6)).label : E.devName(m, sel), ops = E.opsFor(m, st, sel);
      h += '<div class="ts-sub">' + (isCable ? '🔌 ' : '🎛 ') + esc(name) + '</div><div class="ts-ops">' + (ops.length ? ops.map(function (o) { var v = E.getPath(st, o.path);
        if (o.kind === 'toggle') return '<div class="ts-op"><span>' + esc(o.label) + ': <b>' + esc(v ? o.on : o.off) + '</b></span><button type="button" class="ts-btn" data-act="op" data-path="' + o.path + '" data-val="' + (!v) + '">' + esc(v ? (o.offAct || 'OFF 로') : (o.onAct || 'ON 으로')) + '</button></div>';
        if (o.kind === 'range') return '<label class="ts-op ts-range"><span>' + esc(o.label) + ' <b data-val="' + o.path + '">' + esc(o.fmt(v)) + '</b></span><input type="range" min="0" max="100" step="1" value="' + Math.round(v * 100) + '" data-path="' + o.path + '"></label>';
        return '<label class="ts-op"><span>' + esc(o.label) + '</span><select data-path="' + o.path + '">' + o.options.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === v ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></label>'; }).join('') : '<span class="ts-empty">조작할 수 있는 것이 없어요.</span>') + '</div>';
    }
    var ops2 = S.log.filter(function (e) { return e.kind === 'op'; });
    if (ops2.length) h += '<div class="ts-tries"><div class="ts-rlbl">한 조작</div><ol>' + ops2.map(function (e) { return '<li>' + esc(e.label || e.path) + ': ' + esc(e.fromTxt) + ' → ' + esc(e.toTxt) + '</li>'; }).join('') + '</ol></div>';
    h += '<div class="ts-verifymsg" data-role="verifymsg" hidden></div><button type="button" class="ts-btn ts-primary ts-submit" data-act="verify">✅ 최종 확인</button>';
    return h;
  }
  function renderPanel() { var p = $('[data-role=panel]'); if (!p || !S) return; var vm = $('[data-role=verifymsg]'), keep = vm && !vm.hidden ? vm.outerHTML : null;
    p.innerHTML = S.answered ? fixHtml() : answerFormHtml(); if (keep && S.answered) { var n = $('[data-role=verifymsg]'); if (n) n.outerHTML = keep; } }
  function opLabel(path) { var m = M(); var dev = path.indexOf('cable.') === 0 ? 'cable:' + path.split('.')[1] : path.split('.')[0], o = E.opsFor(m, S.state, dev).filter(function (x) { return x.path === path; })[0];
    var who = dev.indexOf('cable:') === 0 ? E.cableById(S.state, dev.slice(6)).label : E.devName(m, dev); return who + ' · ' + (o ? o.label : path); }
  function valTxt(path, v) { var m = M(), dev = path.indexOf('cable.') === 0 ? 'cable:' + path.split('.')[1] : path.split('.')[0], o = E.opsFor(m, S.state, dev).filter(function (x) { return x.path === path; })[0];
    if (!o) return String(v); if (o.kind === 'toggle') return v ? o.on : o.off; if (o.kind === 'range') return o.fmt(v); var opt = o.options.filter(function (x) { return x[0] === v; })[0]; return opt ? opt[1] : E.portName(m, S.state, '', v); }
  function updateHintBtn() { $('[data-role=hintn]').textContent = S.hints + '/3'; }

  // ---------------------------------------------------------------------------
  // 동작
  function select(id) {
    sel = id; renderChips();
    if (!S.answered) { var a = $('[data-role=atarget]'), p = $('[data-role=aproblem]'); if (a && p) { a.value = selTarget(); p.innerHTML = problemOptions(selTarget()); } else renderPanel(); }
    else renderPanel();
    if (view3d) view3d.focus(id);
  }
  function doAnswer(target, problem) {
    if (!S || S.answered) return null;
    if (!target || !problem) { var fb = $('[data-role=ansfb]'); ansMsg = null; renderPanel(); var f = $('[data-role=answer]'); if (f) f.insertAdjacentHTML('afterend', '<div class="ts-ansfb warn" data-role="ansfb">① 장비(케이블)와 ② 무엇이 문제인지 둘 다 골라 주세요.</div>'); return null; }
    var r = E.submitAnswer(S, target, problem); ansMsg = r;
    renderPanel();
    var pn = $('[data-role=panel]'); if (pn && pn.scrollIntoView && window.innerWidth < 960) pn.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return r;
  }
  function doOp(path, value) {
    var fromTxt = valTxt(path, E.getPath(S.state, path)), label = opLabel(path), r = E.runOp(S, path, value);
    if (!r.changed) return r; r.entry.label = label; r.entry.fromTxt = fromTxt; r.entry.toTxt = valTxt(path, value);
    renderPanel(); renderChips(); if (view3d) view3d.sync();
    return r;
  }
  function doHint() { var t = E.useHint(S); if (!t) return null; var h = $('[data-role=hints]'); h.hidden = false; h.innerHTML += '<div><b>💡 힌트 ' + S.hints + '</b> ' + esc(t) + '</div>'; updateHintBtn(); return t; }
  // 신호가 멈춘 곳을 사람이 읽는 말로 (경로별로 계산된 결과 사용)
  function whereTxt(id, port) { var m = M(), st = S.state; if (st.devices[id]) { var p = port && E.TYPES[st.devices[id].type].ports.filter(function (x) { return x[0] === port; })[0]; return E.devName(m, id) + (p ? ' (' + p[1] + ')' : ''); } var c = E.cableById(st, id); return c ? c.label : id; }
  function stopHtml(stop) {
    var m = M(); if (!stop) return '신호는 끝까지 가지만 음량·좌우 균형이 정상 범위가 아니에요.';
    var bads = (stop.paths || []).filter(function (x) { return !x.ok; });
    if (!stop.paths || stop.paths.length < 2) return '테스트 신호가 <b>' + esc(whereTxt(stop.at, stop.port)) + '</b> 에서 더 나아가지 못해요. 그 부근을 다시 살펴보세요.';
    var h = bads.map(function (x) { return '<b>' + esc(E.devName(m, x.target)) + '</b> 쪽 경로: 테스트 신호가 <b>' + esc(whereTxt(x.at, x.port)) + '</b> 에서 더 나아가지 못해요.'; }).join('<br>');
    if (stop.okPaths && stop.okPaths.length) {
      var okName = E.devName(m, stop.compareWith), badName = E.devName(m, stop.target);
      h += '<br>' + esc(okName) + ' 쪽 경로는 끝까지 신호가 가요. ';
      if (stop.divergeAt && stop.divergeAt === stop.at) h += '좌우가 나뉘는 <b>' + esc(E.devName(m, stop.at)) + '</b> 안에서 ' + esc(badName) + ' 쪽 출력으로 신호가 나가지 않아요. 장비 안에서 좌우를 나누는 설정을 확인해 보세요.';
      else if (stop.divergeAt) h += '두 경로는 ' + esc(whereTxt(stop.divergeAt)) + ' 까지 같으니, 그 뒤 ' + esc(badName) + ' 쪽 구간을 ' + esc(okName) + ' 쪽과 비교해 보세요.';
    }
    return h;
  }
  function doVerify() {
    if (!S.answered) return null;
    var r = E.verify(S), m = M();
    if (!r.ok) {
      renderPanel(); var box = $('[data-role=verifymsg]');
      box.hidden = false; box.className = 'ts-verifymsg bad';
      box.innerHTML = '<b>❌ 아직 소리가 정상으로 나지 않아요.</b> ' + r.assess.speakers.map(function (s) { return esc(s.name) + ': ' + esc(E.GRADE_TEXT[s.grade]); }).join(', ') +
        '<div class="ts-small">🧭 ' + stopHtml(r.assess.stop) + '</div>';
      return r;
    }
    saveBest(S.scenario, r.result.score); lastResult = r.result; renderResult(); return r;
  }
  function tlHtml(r) {
    if (!r.timeline.length) return '<p>기록이 없어요.</p>';
    return '<ol class="ts-timeline">' + r.timeline.map(function (e) {
      if (e.kind === 'answer') return '<li class="' + (e.ok ? 'fix' : 'un') + '"><div><b>📮 답 제출</b>: ' + esc(e.targetName) + ' — ' + esc(e.problemText) + (e.ok ? ' <span class="ts-badge ok">정답</span>' : ' <span class="ts-badge bad">오답</span>') + '</div>' +
        (!e.ok ? '<div class="ts-small">' + (e.devOk ? '장비는 맞았지만 문제의 종류가 달랐어요.' : '이 장비는 원인이 아니었어요.') + '</div>' : '') + '</li>';
      if (e.kind === 'op') return '<li class="' + (e.unnecessary ? 'un' : 'fix') + '"><div><b>🛠 ' + esc(e.label || e.path) + '</b>: ' + esc(e.fromTxt) + ' → ' + esc(e.toTxt) + (e.unnecessary ? ' <span class="ts-badge warn">불필요</span>' : ' <span class="ts-badge ok">복구</span>') + '</div>' +
        '<div class="ts-small">결과: ' + esc(e.effect) + (e.unnecessary ? '. 고장 원인과 관계없는 설정이라 증상이 해결되지 않았어요' + (e.note && /새 문제/.test(e.note) ? ' — 정상 설정과 달라져서 새 문제가 생길 수 있어요' : '') + '.' : '') + '</div></li>';
      return '';
    }).join('') + '</ol>';
  }
  function quizHtml(q) {
    if (!q) return '';
    return '<div class="ts-quiz" data-role="quiz"><p class="ts-q">' + esc(q.q) + '</p><div class="ts-qopts">' + q.options.map(function (o) {
      return '<button type="button" class="ts-btn ts-qopt" data-act="quiz" data-o="' + o[0] + '">' + o[0].toUpperCase() + '. ' + esc(o[1]) + '</button>'; }).join('') + '</div><div class="ts-qfb" data-role="qfb" hidden></div></div>';
  }
  function answerQuiz(o) {
    var q = lastResult && lastResult.quiz; if (!q) return null;
    var pick = q.options.filter(function (x) { return x[0] === o; })[0], right = q.options.filter(function (x) { return x[0] === q.answer; })[0], ok = o === q.answer;
    root.querySelectorAll('.ts-qopt').forEach(function (b) { var k = b.getAttribute('data-o'); b.classList.toggle('right', k === q.answer && ok); b.classList.toggle('wrong', k === o && !ok); });
    var fb = $('[data-role=qfb]'); fb.hidden = false; fb.className = 'ts-qfb ' + (ok ? 'ok' : 'bad');
    fb.innerHTML = ok ? '<b>✅ 정답!</b> ' + esc(pick[2]) : '<b>❌ 오답이에요.</b> ' + esc(pick[2]) + '<div class="ts-small">다시 골라 보세요.</div>';
    if (!ok) { lastResult.quizWrong = (lastResult.quizWrong || 0) + 1; if (lastResult.quizWrong >= 2) fb.innerHTML += '<div class="ts-small"><b>정답: ' + q.answer.toUpperCase() + '. ' + esc(right[1]) + '</b> — ' + esc(right[2]) + '</div>'; }
    return ok;
  }
  function renderResult() {
    var r = lastResult, m = M(), el = $('[data-role=result]'), nm = r.nextMission && E.mission(r.nextMission);
    $('[data-role=play]').hidden = true; el.hidden = false;
    var stars = r.score >= 90 ? '★★★' : r.score >= 70 ? '★★☆' : r.score >= 50 ? '★☆☆' : '☆☆☆';
    el.innerHTML = '<div class="ts-card ts-resultcard">' +
      '<div class="ts-rhead"><div><span class="ts-level">' + esc(m.level) + '</span><div class="ts-mtitle">미션 ' + m.id + '. ' + esc(m.title) + ' — 🎉 원인을 맞히고 복구까지 완료!</div></div>' +
        '<div class="ts-scorebox"><div class="ts-score"><b>' + r.score + '</b>점 <span>' + stars + '</span></div><details><summary>점수 내역</summary><ul><li>힌트 ' + r.hints + '단계: −' + r.penalties.hints + '</li><li>틀린 답 ' + (r.wrongAnswers || 0) + '번: −' + (r.penalties.wrongAnswers || 0) + '</li><li>관계없는 조작 ' + r.unnecessaryOps.length + '회: −' + r.penalties.unnecessary + '</li><li>최종 확인 실패: −' + r.penalties.verifyFails + '</li></ul></details></div></div>' +
      '<section class="ts-rsec"><h4>🎯 고장 원인과 단서</h4><p><b>원인</b> ' + esc(r.cause) + '</p>' + (r.why ? '<p><b>단서</b> ' + esc(r.why) + '</p>' : '') +
        '<p><b>고친 내용</b></p><ul>' + r.fixes.map(function (f) { return '<li>' + esc(f.label || f.path) + ': ' + esc(f.fromTxt) + ' → ' + esc(f.toTxt) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="ts-rsec"><h4>🧭 내가 한 과정 <small>순서대로</small></h4>' + tlHtml(r) + '</section>' +
      '<section class="ts-rsec ts-core"><h4>📌 꼭 기억할 원리</h4>' + (r.core.length ? '<ul>' + r.core.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p>' + esc(r.learn) + '</p>') + '</section>' +
      (r.quiz ? '<section class="ts-rsec"><h4>❓ 이해도 확인</h4>' + quizHtml(r.quiz) + '</section>' : '') +
      '<section class="ts-rsec"><h4>➡️ 새로운 사례에 적용</h4>' + (r.apply ? '<p>' + esc(r.apply) + '</p>' : '') +
        '<div class="ts-head-btns">' + (nm ? '<button type="button" class="ts-btn ts-primary" data-act="start" data-m="' + nm.id + '" data-s="random">▶ 미션 ' + nm.id + '. ' + esc(nm.title) + '</button>' : '') +
        '<button type="button" class="ts-btn" data-act="start" data-m="' + m.id + '" data-s="random">이 미션 다른 시나리오(무작위)</button><button type="button" class="ts-btn" data-act="start" data-m="' + m.id + '" data-s="' + S.scenario + '">같은 시나리오 다시</button><button type="button" class="ts-btn" data-act="list">미션 목록</button>' + (window.STALessons ? '<button type="button" class="ts-btn" data-act="lesson" data-l="signal-flow">📘 이론: 음향 시스템의 신호 흐름</button>' : '') + '</div></section>' +
      '<section class="ts-rsec ts-final"><h4>최종 확인 결과 <small>시뮬레이션 계산값</small></h4><ul>' + r.assess.speakers.map(function (s) { return '<li>' + esc(s.name) + ': ' + esc(E.GRADE_TEXT[s.grade]) + ' (' + E.levels.dbTxt(s.R) + ' dB, 최대 출력 대비 근사값)</li>'; }).join('') + '</ul><p class="ts-small">교육용 근사 계산이라 실제 현장의 측정값이나 SPL 이 아니에요.</p></section>' +
      '</div>';
    el.scrollIntoView && el.scrollIntoView({ block: 'start' });
  }
  function backToList() { $('[data-role=play]').hidden = true; $('[data-role=result]').hidden = true; $('[data-role=missions]').hidden = false; renderMissions(); if (view3d) view3d.pause(true); }

  function onClick(e) {
    var t = e.target.closest('[data-act]'); if (!t || !root.contains(t)) return; var a = t.getAttribute('data-act');
    if (a === 'start') start(t.getAttribute('data-m'), t.getAttribute('data-s'));
    else if (a === 'sel') select(t.getAttribute('data-id'));
    else if (a === 'op') doOp(t.getAttribute('data-path'), t.getAttribute('data-val') === 'true');
    else if (a === 'hint') doHint();
    else if (a === 'verify') doVerify();
    else if (a === 'list') backToList();
    else if (a === 'quiz') answerQuiz(t.getAttribute('data-o'));
    else if (a === 'lesson') { try { window.STALessons.open(t.getAttribute('data-l')); } catch (e2) { /* 레슨 화면이 없으면 무시 */ } }
  }
  function onSubmit(e) { var f = e.target; if (!f.matches || !f.matches('[data-role=answer]')) return; e.preventDefault(); doAnswer($('[data-role=atarget]').value, $('[data-role=aproblem]').value); }
  function onInput(e) { var t = e.target; if (t.type === 'range' && t.getAttribute('data-path')) { var path = t.getAttribute('data-path'), b = root.querySelector('[data-val="' + path + '"]'); if (b) b.textContent = valTxt(path, +t.value / 100); } }
  function onChange(e) { var t = e.target;
    if (t.getAttribute && t.getAttribute('data-role') === 'atarget') { var v = t.value; sel = v ? (S.state.devices[v] ? v : 'cable:' + v) : null; renderChips(); $('[data-role=aproblem]').innerHTML = problemOptions(v); if (sel && view3d) view3d.focus(sel); return; }
    var path = t.getAttribute && t.getAttribute('data-path'); if (!path) return;
    if (t.type === 'range') doOp(path, +t.value / 100); else if (t.tagName === 'SELECT') doOp(path, t.value); }

  // ---------------------------------------------------------------------------
  // 3D 공간 화면 (기존 장비·케이블 모델 재사용). 상태는 엔진 세션에서 읽어 반영만 한다
  var LAYOUT = {
    A: { mg: [-0.1, 'table'], spk: [-1.25, 0, -0.75] },
    B: { mg: [-0.1, 'table'], spkL: [-1.35, 0, -0.75], spkR: [1.35, 0, -0.75] },
    C: { mg: [-0.34, 'table'], amp: [0.26, 'table'], pas: [1.4, 0, -0.75] }
  };
  function build3d() {
    if (typeof THREE === 'undefined' || !THREE.OrbitControls || !window.ShureSM58) { $('[data-role=loading]').textContent = '3D 모델 파일이 없어 공간 화면을 표시할 수 없어요. 흐름도와 패널로 진행할 수 있습니다.'; return; }
    if (view3d) view3d.dispose();
    $('[data-role=loading]').style.display = 'flex';
    setTimeout(function () { try { view3d = make3d(); } catch (err) { console.warn('[트러블슈팅] 3D 공간 화면 오류', err); $('[data-role=loading]').textContent = '3D 공간 화면을 만들지 못했어요(' + err.message + '). 흐름도와 패널로 진행할 수 있습니다.'; } }, 20);
  }
  function make3d() {
    var V3 = THREE.Vector3, vp = $('[data-role=viewport]'), m = M(), lay = LAYOUT[m.id], st = S.state;
    var W = vp.clientWidth || 640, H = vp.clientHeight || 380;
    var scene = new THREE.Scene(); scene.background = new THREE.Color(0xeef1f5);
    var camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 50), renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(W, H); renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true; renderer.domElement.className = 'ts-canvas'; vp.querySelectorAll('canvas').forEach(function (c) { c.remove(); }); vp.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a3a, 1.15)); var dl = new THREE.DirectionalLight(0xffffff, 1.5); dl.position.set(1.6, 3.2, 2.2); dl.castShadow = true; dl.shadow.mapSize.set(1024, 1024);
    Object.assign(dl.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 10 }); scene.add(dl);
    var controls = new THREE.OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 0.15; controls.maxDistance = 8;
    function prop(geo, color, name) { var o = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: color, roughness: 0.85 })); o.name = 'ts.' + name; o.receiveShadow = o.castShadow = true; return o; }
    var floor = prop(new THREE.PlaneGeometry(8, 8), 0xd9dbe0, 'floor'); floor.rotation.x = -Math.PI / 2; scene.add(floor);
    var WALLZ = -2.2, OUTX = { outA: -1.2, outB: 0, outC: 1.2 }, OY = 0.3;
    var ws = new THREE.Shape(); ws.moveTo(-4, 0); ws.lineTo(4, 0); ws.lineTo(4, 2.4); ws.lineTo(-4, 2.4); ws.closePath();
    Object.keys(OUTX).forEach(function (k) { var x = OUTX[k], h = new THREE.Path(); h.moveTo(x - 0.029, OY - 0.054); h.lineTo(x - 0.029, OY + 0.054); h.lineTo(x + 0.029, OY + 0.054); h.lineTo(x + 0.029, OY - 0.054); h.closePath(); ws.holes.push(h); });
    var wall = prop(new THREE.ExtrudeGeometry(ws, { depth: 0.1, bevelEnabled: false }).translate(0, 0, -0.1), 0xebe7df, 'wall'); wall.position.z = WALLZ; scene.add(wall);
    var devs = {}, colliders = [new THREE.Box3(new V3(-4, 0, WALLZ - 0.1), new V3(4, 2.4, WALLZ))], TH = 0.75, box = function (o) { return new THREE.Box3().setFromObject(o); };
    Object.keys(OUTX).forEach(function (k) { if (!st.devices[k]) return; var r = KoreanOutlet.create({ name: k }); r.position.set(OUTX[k], OY, WALLZ); scene.add(r); devs[k] = { root: r, api: KoreanOutlet }; });
    var needTable = Object.keys(lay).some(function (k) { return lay[k][1] === 'table'; });
    if (needTable) { var tb = prop(new THREE.BoxGeometry(1.25, TH, 0.62), 0xb08a5a, 'table'); tb.position.set(0, TH / 2, -1.0); scene.add(tb); scene.updateMatrixWorld(true); colliders.push(box(tb)); }
    var stands = [], micStand = null;
    Object.keys(st.devices).forEach(function (id) { var d = st.devices[id], L = lay[id], r = null, api = null;
      if (d.type === 'mg12xu') { r = YamahaMG12XU.create({ power: false }); api = YamahaMG12XU; r.position.set(L[0], TH, -1.0); }
      else if (d.type === 'crown') { r = CrownXLi1500.create({ power: false }); api = CrownXLi1500; r.position.set(L[0], TH, -1.0); }
      else if (d.type === 'zxa1' || d.type === 'zx1') { api = d.type === 'zxa1' ? EvZXA1 : EvZX1; r = api.create();
        if (window.SpeakerStand) { var ss = SpeakerStand.create({ name: 'ts-' + id, heightMM: 1500 }); ss.position.set(L[0], 0, L[2]); scene.add(ss); scene.add(r); scene.updateMatrixWorld(true);
          if (SpeakerStand.mountSpeaker(ss, api, r, { yawDeg: 0 }).ok) { stands.push(ss); ss.traverse(function (o) { o.userData.tsDev = id; }); } else { scene.remove(ss); r.position.set(L[0], 0, L[2]); } }
        else r.position.set(L[0], 0, L[2]); }
      else if (d.type === 'sm58') { r = ShureSM58.create({ variant: 'SM58S' }); api = ShureSM58; scene.add(r);
        if (window.MicStand) { micStand = MicStand.create({ name: 'ts', pose: { heightMM: 1300, boomLengthMM: 600, boomAngleDeg: 25, clipTiltDeg: 55 } }); micStand.position.set(0.35, 0, 0.95); micStand.rotation.y = Math.PI; scene.add(micStand); scene.updateMatrixWorld(true);
          if (MicStand.mountMic(micStand, ShureSM58, r).ok) micStand.traverse(function (o) { o.userData.tsDev = id; }); else { scene.remove(micStand); micStand = null; } }
        if (!micStand) r.position.set(0.2, 1.21, 0.45); }
      if (r) { if (!r.parent) scene.add(r); devs[id] = { root: r, api: api }; r.traverse(function (o) { o.userData.tsDev = id; }); } });
    scene.updateMatrixWorld(true);
    stands.forEach(function (t) { ['innerTube', 'outerTube', 'clampCollar', 'legHub', 'braceCollar'].forEach(function (n) { var o = t.getObjectByName('spkStand.' + n); if (o) colliders.push(box(o)); }); });
    if (micStand) ['lowerTube', 'clutch', 'base.hub', 'upperTube.body'].forEach(function (n) { var o = micStand.getObjectByName('micStand.' + n); if (o) colliders.push(box(o)); });
    ['mg', 'amp'].forEach(function (id) { if (devs[id]) colliders.push(box(devs[id].root.getObjectByName(id === 'mg' ? 'yamahaMg12xu.chassis' : 'crownXli1500.chassis') || devs[id].root)); });
    Object.keys(devs).forEach(function (id) { var t = st.devices[id].type; if (t === 'zxa1') colliders.push(box(devs[id].root.getObjectByName('evZxa1.cabinetGroup'))); if (t === 'zx1') colliders.push(box(devs[id].root.getObjectByName('evZx1.cabinetGroup'))); if (t === 'outlet') colliders.push(box(devs[id].root.getObjectByName('krOutlet.plate'))); });
    // 케이블: 상태(꽂힘/단자)가 바뀐 것만 다시 만든다
    var cables = {};
    function endName(c, k) { return c.type === 'xlr' ? (k === 'a' ? 'female' : 'male') : c.type === 'speakon' ? k : (k === 'a' ? 'iec' : 'mains'); }
    function moduleOf(c) { return c.type === 'xlr' ? XlrCable : c.type === 'speakon' ? SpeakonCable : AcPowerCable; }
    function sig(c) { return [c.a.port, c.a.seated, c.b.port, c.b.seated].join('|'); }
    function buildCable(c) {
      var Mo = moduleOf(c), old = cables[c.id]; if (old) { scene.remove(old.root); old.root.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
      var pa = devs[c.a.dev] && devs[c.a.dev].api.getPortInfo(devs[c.a.dev].root, c.a.port), pb = devs[c.b.dev] && devs[c.b.dev].api.getPortInfo(devs[c.b.dev].root, c.b.port), dd = pa && pb ? pa.worldPosition.distanceTo(pb.worldPosition) * 1.25 + 0.6 : 3;
      var len = (c.type === 'ac' ? [1.8, 3, 5] : [3, 5, 10]).filter(function (x) { return x >= dd; })[0] || (c.type === 'ac' ? 5 : 10), o = { lengthM: len, colliders: colliders, name: 'ts-' + c.id, segmentMM: c.type === 'ac' ? 30 : 40 };
      if (c.type !== 'xlr') o.jacketColor = c.type === 'ac' ? 0x2a2b2e : 0x1d2b4a;
      var rr = Mo.create(o);
      ['a', 'b'].forEach(function (k) { var e = c[k], dv = devs[e.dev], en = endName(c, k);
        if (e.seated && dv) Mo.connect(rr, en, dv.api, dv.root, e.port);
        else if (dv) { var p = dv.api.getPortInfo(dv.root, e.port), pos = p.worldPosition.clone().addScaledVector(p.worldNormal, 0.25); pos.y = 0.015; Mo.disconnect(rr, en, { position: pos, direction: p.worldNormal.clone().setY(0).normalize() }); } });
      scene.add(rr); Mo.update(rr, { reset: true, steps: 300, iterations: 30, finalIterations: 2000 }); rr.traverse(function (x) { x.userData.tsCable = c.id; }); cables[c.id] = { root: rr, sig: sig(c) };
    }
    function syncCables() { S.state.cables.forEach(function (c) { if (!cables[c.id] || cables[c.id].sig !== sig(c)) buildCable(c); }); }
    function syncDevices() {
      var ev = E.evaluate(m, S.state), sd = S.state.devices;
      Object.keys(devs).forEach(function (id) { var d = sd[id], r = devs[id].root;
        if (d.type === 'sm58') ShureSM58.setSwitch(r, d.switch);
        if (d.type === 'zxa1') { var za = r.userData.evZxa1.api; za.setMaster(d.master); za.setMic(d.mic); za.setPower(!!ev.power[id]); var rk = r.getObjectByName('evZxa1.powerSwitch.rocker'); if (rk) rk.rotation.x = (d.power ? 1 : -1) * 0.12; za.setLimit(ev.speakers[id].grade === 'clip' && ev.power[id]); }
        if (d.type === 'mg12xu') { var u = r.userData.yamahaMg12xu; u.setPower(!!ev.power[id]); Object.keys(d.ch).forEach(function (c) { u.setKnob(c + '.gain', d.ch[c].gain); u.setKnob(c + '.pan', d.ch[c].pan); u.setFader(c, d.ch[c].fader); u.setButton(c + '.on', d.ch[c].on); u.setButton(c + '.toStereo', d.ch[c].st); });
          u.setFader('stereo', d.stFader); var mx = ev.mixer[id], mv = function (x) { return x === E.NEG ? 0 : Math.max(0, Math.min(1, (x + 30) / 40)); }; u.setMeter(mx ? mv(mx.L) : 0, mx ? mv(mx.R) : 0); var rk2 = u.parts.powerSwitch.userData.rocker; if (rk2) rk2.rotation.x = d.power ? -0.12 : 0.12; }
        if (d.type === 'crown') { var cu = r.userData.crownXli1500; cu.setGain(1, d.att[1]); cu.setGain(2, d.att[2]); var a = ev.amp[id];
          [1, 2].forEach(function (n) { cu.setLed(n, 'signal', !!ev.power[id] && a.in[n] !== E.NEG && a.in[n] - 5.1 > -40); cu.setLed(n, 'clip', a.out[n] > 3); }); cu.setPower(!!ev.power[id]); var cap = cu.parts.powerSwitch.userData.cap; if (cap) cap.position.z = (0.4 + (d.power ? 0 : 0.9)) * 0.001; } });
    }
    // 2026-10-20: 표시등 강조 — 모델 파일은 그대로 두고, 이 화면에서만 켜진 LED·ON 버튼 위에 빛 번짐을 더하고
    //  장비를 고르거나 가까이 보면 「POWER 켜짐/꺼짐」「CH1 ON 켜짐/꺼짐」 이름표를 붙여, 켜짐/꺼짐을 헷갈리지 않게 함
    var glowTex = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    var IND = [], indRay = new THREE.Raycaster();
    function ind(dev, name, label, color, onFn, size) {
      var o = devs[dev] && devs[dev].root.getObjectByName(name); if (!o) return;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      sp.scale.setScalar(size || 0.04); sp.renderOrder = 5; sp.visible = false; scene.add(sp);
      var el = document.createElement('div'); el.className = 'ts-ind'; el.style.display = 'none'; vp.appendChild(el);
      IND.push({ dev: dev, obj: o, label: label, color: '#' + new THREE.Color(color).getHexString(), on: onFn, sp: sp, el: el, state: null });
    }
    (function () {
      var ch = E.inputChannel(m, st);
      Object.keys(devs).forEach(function (id) { var t = st.devices[id].type;
        if (t === 'mg12xu') { ind(id, 'yamahaMg12xu.led.power', 'POWER', 0xffffff, function (ev) { return !!ev.power[id]; }, 0.035);
          ind(id, 'yamahaMg12xu.btn.' + ch + '.on', E.CH_LABEL[ch] + ' ON', 0xff9a00, function (ev, d) { return !!ev.power[id] && !!d.ch[ch].on; }, 0.06); }
        if (t === 'zxa1') ind(id, 'evZxa1.powerLed', 'POWER', 0x22e05a, function (ev) { return !!ev.power[id]; }, 0.05);
        if (t === 'crown') { ind(id, 'crownXli1500.powerLed', 'POWER', 0x3fa9ff, function (ev) { return !!ev.power[id]; }, 0.04);
          [1, 2].forEach(function (n) { ind(id, 'crownXli1500.signalLedCh' + n, 'CH' + n + ' SIGNAL', 0x22e05a, function (ev) { var a = ev.amp[id]; return !!ev.power[id] && a.in[n] !== E.NEG && a.in[n] - 5.1 > -40; }, 0.03); }); }
      });
    })();
    function syncIndicators() { var ev = E.evaluate(m, S.state); IND.forEach(function (q) { q.state = !!q.on(ev, S.state.devices[q.dev]); q.sp.visible = q.state;
      q.el.className = 'ts-ind ' + (q.state ? 'on' : 'off'); q.el.innerHTML = '<i style="' + (q.state ? 'background:' + q.color + ';box-shadow:0 0 6px ' + q.color : '') + '"></i>' + q.label + ' <b>' + (q.state ? '켜짐' : '꺼짐') + '</b>'; }); }
    var wp = new THREE.Vector3(), tmpV = new THREE.Vector3();
    function placeIndicators() {
      var r = renderer.domElement, Wd = r.clientWidth, Hd = r.clientHeight, occ = Object.keys(devs).map(function (k) { return devs[k].root; }).concat(stands);
      IND.forEach(function (q) {
        q.obj.getWorldPosition(wp);
        tmpV.copy(camera.position).sub(wp); var dist = tmpV.length(); tmpV.normalize();
        q.sp.position.copy(wp).addScaledVector(tmpV, 0.012);
        var showLabel = (sel === q.dev || dist < 1.3);
        var v = wp.clone().project(camera); if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) showLabel = false;
        if (showLabel) { indRay.set(camera.position, tmpV.clone().negate()); indRay.camera = camera; indRay.far = dist - 0.02; var h = indRay.intersectObjects(occ, true).filter(function (x) { return x.object.visible && x.object.isMesh && x.distance < dist - 0.03; });
          if (h.length) { var o = h[0].object, own = false; while (o) { if (o === q.obj) { own = true; break; } o = o.parent; } if (!own) showLabel = false; } }
        q.el.style.display = showLabel ? '' : 'none';
        if (showLabel) { q.el.style.left = ((v.x + 1) / 2 * Wd) + 'px'; q.el.style.top = ((1 - v.y) / 2 * Hd - 10) + 'px'; }
      });
      // 같은 장비 이름표끼리 겹치면 위로 비켜 놓기
      var shown = IND.filter(function (q) { return q.el.style.display !== 'none'; }).sort(function (a, b) { return parseFloat(b.el.style.top) - parseFloat(a.el.style.top); });
      for (var i = 1; i < shown.length; i++) for (var j = 0; j < i; j++) { var A = shown[i], B = shown[j];
        if (Math.abs(parseFloat(A.el.style.left) - parseFloat(B.el.style.left)) < 110 && Math.abs(parseFloat(A.el.style.top) - parseFloat(B.el.style.top)) < 24) A.el.style.top = (parseFloat(B.el.style.top) - 24) + 'px'; }
    }
    syncCables(); syncDevices(); syncIndicators();
    // 선택 표시: 장비 둘레 상자
    var selBox = new THREE.Box3Helper(new THREE.Box3(), 0xf59e0b); selBox.visible = false; selBox.material.depthTest = false; selBox.renderOrder = 999; scene.add(selBox);
    var tween = null, needs = true, paused = false, ray = new THREE.Raycaster(), alive = true;
    camera.position.set(1.9, 1.9, 2.6); controls.target.set(0, 0.6, -0.9); controls.update();
    function focus(id) {
      var obj = id && (id.indexOf('cable:') === 0 ? cables[id.slice(6)] && cables[id.slice(6)].root : devs[id] && devs[id].root);
      if (!obj) { selBox.visible = false; needs = true; return; }
      var b = new THREE.Box3().setFromObject(obj); selBox.box.copy(b); selBox.visible = true; var c = b.getCenter(new V3()), sz = b.getSize(new V3()).length();
      var dir = camera.position.clone().sub(controls.target).normalize(), dist = Math.max(0.7, Math.min(3.4, sz * 2.3));
      if (id === 'spk' || id === 'spkL' || id === 'spkR' || id === 'pas') dir = new V3(0.25, 0.35, -1).normalize();   // 스피커는 뒷면(전원·입력 단자)이 보이게
      else if (id === 'mg') dir = new V3(0.1, 1.15, 0.85).normalize();   // 믹서는 앞 위에서(ON 버튼·POWER 표시등이 보이게)
      else if (id === 'amp') dir = new V3(0.15, 0.35, 1).normalize();    // 앰프는 앞면(POWER·SIGNAL 표시등)
      tween = { t: 0, p0: camera.position.clone(), t0: controls.target.clone(), p1: c.clone().addScaledVector(dir, dist), t1: c }; needs = true;
    }
    function pick(ev2) { var r = renderer.domElement.getBoundingClientRect(), v = new THREE.Vector2(((ev2.clientX - r.left) / r.width) * 2 - 1, -((ev2.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v, camera);
      var objs = Object.keys(devs).filter(function (k) { return S.state.devices[k].type !== 'outlet'; }).map(function (k) { return devs[k].root; }).concat(Object.keys(cables).map(function (k) { return cables[k].root; })).concat(stands).concat(micStand ? [micStand] : []);
      var h = ray.intersectObjects(objs, true).filter(function (x) { return x.object.visible; })[0]; if (!h) return null; var o = h.object;
      while (o && !(o.userData.tsDev || o.userData.tsCable)) o = o.parent; return o ? (o.userData.tsCable ? 'cable:' + o.userData.tsCable : o.userData.tsDev) : null; }
    var down = null, tip = $('[data-role=tip]'), cv = renderer.domElement;
    cv.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
    cv.addEventListener('pointerup', function (e) { if (!down) return; var mv = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (mv > 6) return; var id = pick(e); if (id) select(id); });
    cv.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var id = pick(e); if (!id) { tip.style.display = 'none'; cv.style.cursor = ''; return; }
      var r = vp.getBoundingClientRect(); tip.style.display = 'block'; tip.textContent = id.indexOf('cable:') === 0 ? E.cableById(S.state, id.slice(6)).label : E.devName(M(), id); tip.style.left = (e.clientX - r.left + 12) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px'; cv.style.cursor = 'pointer'; });
    cv.addEventListener('pointerleave', function () { tip.style.display = 'none'; });
    controls.addEventListener('change', function () { needs = true; });
    function resize() { var w = vp.clientWidth, h = vp.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); needs = true; }
    window.addEventListener('resize', resize);
    function visible() { var t = root.closest('.tab-content'); return !t || t.classList.contains('active'); }
    (function loop() { if (!alive) return; requestAnimationFrame(loop); if (paused || !visible()) return;
      if (tween) { tween.t = Math.min(1, tween.t + 0.06); var k = tween.t * tween.t * (3 - 2 * tween.t); camera.position.lerpVectors(tween.p0, tween.p1, k); controls.target.lerpVectors(tween.t0, tween.t1, k); if (tween.t >= 1) tween = null; needs = true; }
      if (controls.update() || needs) { renderer.render(scene, camera); placeIndicators(); needs = false; } })();
    $('[data-role=loading]').style.display = 'none';
    if (sel) focus(sel);
    return {
      scene: scene, camera: camera, renderer: renderer, controls: controls, devs: devs, cables: cables,
      sync: function () { syncCables(); syncDevices(); syncIndicators(); if (sel) focus(sel); needs = true; }, focus: focus, pause: function (v) { paused = !!v; }, indicators: function () { return IND.map(function (q) { return { dev: q.dev, label: q.label, on: q.state, shown: q.el.style.display !== 'none', glow: q.sp.visible, text: q.el.textContent }; }); }, refresh: function () { needs = true; },
      setCamera: function (pos, target) { tween = null; camera.position.fromArray(pos); controls.target.fromArray(target); controls.update(); needs = true; },
      renderNow: function () { if (tween) { camera.position.copy(tween.p1); controls.target.copy(tween.t1); tween = null; } controls.update(); renderer.render(scene, camera); placeIndicators(); },
      dispose: function () { alive = false; IND.forEach(function (q) { if (q.el.parentNode) q.el.parentNode.removeChild(q.el); }); window.removeEventListener('resize', resize); scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); }
    };
  }

  // ---------------------------------------------------------------------------
  function setup() {
    root = document.getElementById('tsRoot'); E = window.PaTsEngine;
    if (!root) return; if (!E) { root.innerHTML = '<div class="ts-note">진단 엔진 파일(assets3d/pa_troubleshoot_engine.js)을 불러오지 못했어요.</div>'; return; }
    renderShell();
  }
  window.PaTroubleshoot = {
    start: start, select: select, answer: doAnswer, op: doOp, hint: doHint, verify: doVerify, list: backToList, quiz: answerQuiz,
    getSession: function () { return S; }, getView: function () { return view3d; }, engine: function () { return E; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
