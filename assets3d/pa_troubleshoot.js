/*
 * 음향 트러블슈팅 탭 — 화면 (Sound-Team-Training)
 *  - 계산은 모두 assets3d/pa_troubleshoot_engine.js (window.PaTsEngine). 이 파일은 화면·3D 공간·흐름도만 담당
 *  - 3D 공간 화면은 기존 장비 모델(SM58S·MG12XU·ZXA1·Crown·ZX1·콘센트)과 케이블 모델을 재사용한다
 *  - 전역: window.PaTroubleshoot (start / select / inspect / op / hint / verify / getSession) — 테스트·자동화용
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
  // 화면 골격
  function renderShell() {
    root.innerHTML =
      '<div class="ts-note"><b>교육용 가상 시뮬레이션</b>이에요. 실제 소리·전기를 다루지 않고 장비 상태로 계산한 결과를 보여 줘요. 전원 조작도 가상이에요.</div>' +
      '<section class="ts-missions" data-role="missions"></section>' +
      '<section class="ts-play" data-role="play" hidden>' +
        '<div class="ts-head"><div><div class="ts-mtitle" data-role="mtitle"></div><div class="ts-chain" data-role="chain"></div></div>' +
          '<div class="ts-head-btns"><button type="button" class="ts-btn" data-act="hint">💡 힌트 <span data-role="hintn">0/3</span></button><button type="button" class="ts-btn ts-primary" data-act="verify">✅ 최종 검증</button><button type="button" class="ts-btn" data-act="list">미션 목록</button></div></div>' +
        '<div class="ts-symptom"><b>증상</b> <span data-role="symptom"></span></div>' +
        '<div class="ts-hints" data-role="hints" hidden></div>' +
        '<div class="ts-verifymsg" data-role="verifymsg" hidden></div>' +
        '<div class="ts-grid">' +
          '<div class="ts-card ts-flowcard"><h4>신호 흐름도 <small>검사한 곳만 결과가 표시됨</small></h4><div class="ts-flow" data-role="flow"></div><div class="ts-legend"><i class="lg-sig"></i>신호 확인 <i class="lg-none"></i>신호 없음 <i class="lg-open"></i>빠짐 <i class="lg-unk"></i>미검사 <i class="lg-stale"></i>조작 전 측정</div></div>' +
          '<div class="ts-card ts-space"><h4>공간 화면 <small>장비·케이블을 눌러 선택</small></h4><div class="ts-viewport" data-role="viewport"><div class="ts-loading" data-role="loading">3D 장비를 불러오는 중…</div><div class="ts-tip" data-role="tip"></div></div>' +
            '<div class="ts-chips" data-role="chips"></div></div>' +
          '<div class="ts-card ts-panel" data-role="panel"><h4>검사 · 조작</h4><div class="ts-empty">공간 화면이나 흐름도에서 장비 또는 케이블을 고르세요.</div></div>' +
          '<div class="ts-card ts-logcard"><div><h4>발견한 증거</h4><ul class="ts-evidence" data-role="evidence"></ul></div><div><h4>검사·조작 기록</h4><ol class="ts-log" data-role="log" reversed></ol></div></div>' +
        '</div>' +
      '</section>' +
      '<section class="ts-result" data-role="result" hidden></section>';
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    renderMissions();
  }
  function renderMissions() {
    var best = loadBest();
    $('[data-role=missions]').innerHTML = '<h3 class="ts-h3">미션 선택</h3><div class="ts-mgrid">' + E.MISSIONS.map(function (m) {
      return '<div class="ts-mcard"><div class="ts-level">' + esc(m.level) + '</div><div class="ts-mname">미션 ' + m.id + '. ' + esc(m.title) + '</div><div class="ts-chain">' + esc(m.chain) + '</div>' +
        '<div class="ts-symptom-s">' + esc(m.symptom) + '</div><div class="ts-scen">' + m.scenarios.map(function (sc, i) {
          var b = best[sc.id]; return '<button type="button" class="ts-btn" data-act="start" data-m="' + m.id + '" data-s="' + sc.id + '">시나리오 ' + (i + 1) + (b !== undefined ? ' <small>최고 ' + b + '점</small>' : '') + '</button>'; }).join('') +
        '<button type="button" class="ts-btn" data-act="start" data-m="' + m.id + '" data-s="random">무작위</button></div></div>'; }).join('') + '</div>' +
      '<p class="ts-small">같은 증상이라도 시나리오마다 원인이 달라요.<br>점수: 100점에서 힌트 단계마다 −10 · 불필요한 조작 −5(최대 −30) · 최종 검증 실패 −10 · 원인 확인 전에 고치면 −20</p>';
  }

  // ---------------------------------------------------------------------------
  function start(mid, sid) {
    var m = E.mission(mid); if (!m) return null;
    if (sid === 'random' || !E.scenario(m, sid)) sid = m.scenarios[Math.floor(Math.random() * m.scenarios.length)].id;
    S = E.newSession(mid, sid); sel = null; lastResult = null;
    $('[data-role=missions]').hidden = true; $('[data-role=result]').hidden = true; $('[data-role=play]').hidden = false;
    $('[data-role=mtitle]').textContent = '미션 ' + m.id + '. ' + m.title + ' · 시나리오 ' + (m.scenarios.findIndex(function (x) { return x.id === sid; }) + 1);
    $('[data-role=chain]').textContent = m.chain + ' (' + m.level + ')';
    $('[data-role=symptom]').textContent = m.symptom;
    $('[data-role=hints]').hidden = true; $('[data-role=hints]').innerHTML = ''; $('[data-role=verifymsg]').hidden = true;
    renderChips(); renderFlow(); renderPanel(); renderLog(); updateHintBtn();
    build3d();
    return S;
  }
  function M() { return E.mission(S.mission); }
  function renderChips() {
    var m = M(), st = S.state, items = Object.keys(st.devices).filter(function (id) { return st.devices[id].type !== 'outlet'; }).map(function (id) { return [id, E.devName(m, id)]; })
      .concat(st.cables.map(function (c) { return ['cable:' + c.id, c.label]; }));
    $('[data-role=chips]').innerHTML = items.map(function (x) { return '<button type="button" class="ts-chip' + (sel === x[0] ? ' on' : '') + '" data-act="sel" data-id="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('');
  }

  // 신호 흐름도 (SVG): 노드 = 장비, 선 = 신호 케이블. 검사로 확인된 정보만 색으로 표시
  function revealMap() { var R = { nodes: {}, edges: {} };
    S.log.forEach(function (e) { if (e.kind !== 'inspect' || !e.reveal) return; Object.keys(e.reveal.nodes).forEach(function (k) { R.nodes[k] = Object.assign({}, R.nodes[k] || {}, e.reveal.nodes[k], { v: e.version }); });
      Object.keys(e.reveal.edges).forEach(function (k) { R.edges[k] = Object.assign({}, e.reveal.edges[k], { v: e.version }); }); }); return R; }
  function renderFlow() {
    var m = M(), st = S.state, rv = revealMap(), rows = m.flow, W = 0, nodes = {}, edges = [], colW = 140, rowH = 84, NW = 112, NH = 58;
    rows.forEach(function (row, r) { var col = 0;
      row.forEach(function (id, i) { if (i % 2 === 0) { if (!nodes[id]) nodes[id] = { x: 16 + col * colW, y: 18 + r * rowH }; else col = Math.round((nodes[id].x - 16) / colW); col++; } }); });
    rows.forEach(function (row) { for (var i = 1; i < row.length; i += 2) edges.push({ id: row[i], a: row[i - 1], b: row[i + 1] }); });
    Object.keys(nodes).forEach(function (id) { W = Math.max(W, nodes[id].x + NW + 16); });
    var H = 18 + rows.length * rowH;
    function stale(o) { return o && o.v !== S.version; }
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + Math.max(W, 420) + 'px" role="img" aria-label="신호 흐름도">';
    edges.forEach(function (e) { var A = nodes[e.a], B = nodes[e.b], c = E.cableById(st, e.id), r = rv.edges[e.id], cls = r ? (r.state === 'open' ? 'open' : 'ok') : 'unk';
      var sa = rv.nodes[e.a + '.out'] || rv.nodes[e.a + '.outL'] || rv.nodes[e.a], sigCls = '';
      var x1 = A.x + NW, y1 = A.y + NH / 2, x2 = B.x, y2 = B.y + NH / 2, mx = (x1 + x2) / 2;
      svg += '<g class="ts-edge ' + cls + (stale(r) ? ' stale' : '') + (sel === 'cable:' + e.id ? ' sel' : '') + '" data-act="sel" data-id="cable:' + e.id + '"><path d="M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"/>' +
        '<path class="hit" d="M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"/><text x="' + mx + '" y="' + ((y1 + y2) / 2 - 6) + '">' + esc(cls === 'open' ? '빠짐' : cls === 'ok' ? '연결 확인' : '?') + '</text></g>'; });
    Object.keys(nodes).forEach(function (id) { var n = nodes[id], d = st.devices[id], lines = [], st0 = 'unk', any = false;
      function tag(k, txt) { var o = rv.nodes[k]; if (!o) return; any = true; var s = o.signal === 'signal' ? 'sig' : o.signal === 'none' ? 'none' : o.power === 'off' || o.state === 'blocked' ? 'none' : 'sig'; lines.push('<tspan class="' + s + (stale(o) ? ' stale' : '') + '">' + txt(o) + '</tspan>'); }
      tag(id, function (o) { return o.power ? (o.power === 'on' ? '전원 ON' : '전원 OFF') : (o.signal === 'signal' ? '출력 ✓' : '출력 없음'); });
      tag(id + '.in', function (o) { return o.signal === 'signal' ? '입력 ✓' : '입력 없음'; });
      tag(id + '.ch', function (o) { return o.state === 'ok' ? '채널 통과' : '채널 막힘'; });
      tag(id + '.outL', function (o) { return 'L ' + (o.signal === 'signal' ? '✓' : '없음'); });
      tag(id + '.outR', function (o) { return 'R ' + (o.signal === 'signal' ? '✓' : '없음'); });
      tag(id + '.in1', function (o) { return 'IN1 ' + (o.signal === 'signal' ? '✓' : '없음'); });
      tag(id + '.out1', function (o) { return 'OUT1 ' + (o.signal === 'signal' ? '✓' : '없음'); });
      tag(id + '.out2', function (o) { return 'OUT2 ' + (o.signal === 'signal' ? '✓' : '없음'); });
      svg += '<g class="ts-node' + (sel === id ? ' sel' : '') + '" data-act="sel" data-id="' + id + '"><rect x="' + n.x + '" y="' + n.y + '" width="' + NW + '" height="' + NH + '" rx="9"/>' +
        '<text class="nm" x="' + (n.x + NW / 2) + '" y="' + (n.y + 18) + '">' + esc(E.devName(m, id)) + '</text>' +
        '<text class="st" x="' + (n.x + NW / 2) + '" y="' + (n.y + 36) + '">' + (lines.slice(0, 2).join(' ') || '<tspan class="unk">? 미검사</tspan>') + '</text>' +
        (lines.length > 2 ? '<text class="st" x="' + (n.x + NW / 2) + '" y="' + (n.y + 50) + '">' + lines.slice(2, 4).join(' ') + '</text>' : '') + '</g>'; });
    svg += '</svg>';
    $('[data-role=flow]').innerHTML = svg;
  }

  // 선택한 장비/케이블 패널: 검사 버튼 + 조작
  function renderPanel(lastInspect) {
    var p = $('[data-role=panel]'), m = M(), st = S.state;
    if (!sel) { p.innerHTML = '<h4>검사 · 조작</h4><div class="ts-empty">공간 화면이나 흐름도에서 장비 또는 케이블을 고르세요.</div>'; return; }
    var isCable = sel.indexOf('cable:') === 0, name = isCable ? E.cableById(st, sel.slice(6)).label : E.devName(m, sel), tools = E.toolsFor(m, st, sel), ops = E.opsFor(m, st, sel);
    var h = '<h4>' + esc(name) + '</h4><div class="ts-sub">검사</div><div class="ts-tools">' + (tools.length ? tools.map(function (t) { return '<button type="button" class="ts-btn" data-act="inspect" data-tool="' + t.tool + '" data-target="' + t.target + '">🔍 ' + esc(E.TOOL_INFO[t.tool].label) + '</button>'; }).join('') : '<span class="ts-empty">이 미션에서 쓸 수 있는 검사가 없어요.</span>') + '</div>';
    if (lastInspect) h += '<div class="ts-res ' + lastInspect.status + '"><b>' + esc(lastInspect.title) + '</b><ul>' + lastInspect.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
      (lastInspect.evidence.length ? '<div class="ts-found">기록한 증거: ' + lastInspect.evidence.map(function (e) { return esc(e.label); }).join(' · ') + '</div>' : '') + '</div>';
    h += '<div class="ts-sub">조작 (복구)</div><div class="ts-ops">' + (ops.length ? ops.map(function (o) { var v = E.getPath(st, o.path);
      if (o.kind === 'toggle') return '<div class="ts-op"><span>' + esc(o.label) + ': <b>' + esc(v ? o.on : o.off) + '</b></span><button type="button" class="ts-btn" data-act="op" data-path="' + o.path + '" data-val="' + (!v) + '">' + esc(v ? (o.offAct || 'OFF 로') : (o.onAct || 'ON 으로')) + '</button></div>';
      if (o.kind === 'range') return '<label class="ts-op ts-range"><span>' + esc(o.label) + ' <b data-val="' + o.path + '">' + esc(o.fmt(v)) + '</b></span><input type="range" min="0" max="100" step="1" value="' + Math.round(v * 100) + '" data-path="' + o.path + '"></label>';
      return '<label class="ts-op"><span>' + esc(o.label) + '</span><select data-path="' + o.path + '">' + o.options.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === v ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></label>'; }).join('') : '<span class="ts-empty">조작할 수 있는 것이 없어요.</span>') + '</div>';
    p.innerHTML = h;
  }
  function opLabel(path) { var m = M(); var dev = path.indexOf('cable.') === 0 ? 'cable:' + path.split('.')[1] : path.split('.')[0], o = E.opsFor(m, S.state, dev).filter(function (x) { return x.path === path; })[0];
    var who = dev.indexOf('cable:') === 0 ? E.cableById(S.state, dev.slice(6)).label : E.devName(m, dev); return who + ' · ' + (o ? o.label : path); }
  function valTxt(path, v) { var m = M(), dev = path.indexOf('cable.') === 0 ? 'cable:' + path.split('.')[1] : path.split('.')[0], o = E.opsFor(m, S.state, dev).filter(function (x) { return x.path === path; })[0];
    if (!o) return String(v); if (o.kind === 'toggle') return v ? o.on : o.off; if (o.kind === 'range') return o.fmt(v); var opt = o.options.filter(function (x) { return x[0] === v; })[0]; return opt ? opt[1] : E.portName(m, S.state, '', v); }
  function renderLog() {
    var ev = $('[data-role=evidence]'), lg = $('[data-role=log]'), keys = Object.keys(S.evidence);
    ev.innerHTML = keys.length ? keys.map(function (k) { var e = S.evidence[k]; return '<li' + (e.version !== S.version ? ' class="stale" title="그 뒤 조작이 있어 지금은 다를 수 있음"' : '') + '>' + esc(e.label) + '</li>'; }).join('') : '<li class="ts-empty">아직 없음 — 검사를 해 보세요.</li>';
    lg.innerHTML = S.log.slice().reverse().map(function (e) {
      if (e.kind === 'inspect') return '<li class="lg-i ' + e.status + '">🔍 ' + esc(e.title) + ' <small>' + esc(S.state.devices[e.target] ? E.devName(M(), e.target) : '') + ' · ' + (e.status === 'ok' ? '이상 없음' : e.status === 'warn' ? '주의' : '이상') + '</small></li>';
      if (e.kind === 'op') return '<li class="lg-o' + (e.unnecessary ? ' un' : '') + '">🛠 ' + esc(e.label || e.path) + ': ' + esc(e.fromTxt) + ' → ' + esc(e.toTxt) + '<div class="ts-small">' + esc(e.effect) + (e.note ? ' — ' + esc(e.note) : '') + '</div></li>';
      if (e.kind === 'hint') return '<li class="lg-h">💡 힌트 ' + e.level + '단계 사용</li>';
      if (e.kind === 'verify') return '<li class="lg-v ' + (e.ok ? 'ok' : 'bad') + '">✅ 최종 검증: ' + (e.ok ? '정상' : '아직 정상이 아님') + '</li>';
      return ''; }).join('');
  }
  function updateHintBtn() { $('[data-role=hintn]').textContent = S.hints + '/3'; }

  // ---------------------------------------------------------------------------
  // 동작
  function select(id) { sel = id; renderChips(); renderFlow(); renderPanel(); if (view3d) view3d.focus(id); }
  function doInspect(tool, target) { var r = E.runInspect(S, tool, target); S.log[S.log.length - 1].reveal = r.reveal; renderPanel(r); renderFlow(); renderLog(); return r; }
  function doOp(path, value) {
    var fromTxt = valTxt(path, E.getPath(S.state, path)), label = opLabel(path), r = E.runOp(S, path, value);
    if (!r.changed) return r; r.entry.label = label; r.entry.fromTxt = fromTxt; r.entry.toTxt = valTxt(path, value);
    renderPanel(); renderFlow(); renderLog(); renderChips(); if (view3d) view3d.sync();
    return r;
  }
  function doHint() { var t = E.useHint(S); if (!t) return null; var h = $('[data-role=hints]'); h.hidden = false; h.innerHTML += '<div><b>힌트 ' + S.hints + '</b> ' + esc(t) + '</div>'; updateHintBtn(); renderLog(); return t; }
  function doVerify() {
    var r = E.verify(S), box = $('[data-role=verifymsg]'), m = M(); renderLog();
    if (!r.ok) {
      var stop = r.assess.stop, where = stop ? (S.state.devices[stop.at] ? E.devName(m, stop.at) : E.cableById(S.state, stop.at).label) : null;
      box.hidden = false; box.className = 'ts-verifymsg bad';
      box.innerHTML = '<b>아직 정상이 아닙니다.</b> ' + r.assess.speakers.map(function (s) { return esc(s.name) + ': ' + esc(E.GRADE_TEXT[s.grade]); }).join(', ') +
        (m.level === '초급' && where ? '<div class="ts-small">초급 도움말: 테스트 신호가 <b>' + esc(where) + '</b> 에서 더 나아가지 못합니다. 그 부근을 검사해 보세요.</div>' : '') +
        (m.level === '초급' && !where ? '<div class="ts-small">초급 도움말: 신호는 끝까지 가지만 음량·좌우 균형이 정상 범위가 아닙니다.</div>' : '');
      return r;
    }
    box.hidden = true; saveBest(S.scenario, r.result.score); lastResult = r.result; renderResult(); return r;
  }
  function renderResult() {
    var r = lastResult, m = M(), el = $('[data-role=result]');
    $('[data-role=play]').hidden = true; el.hidden = false;
    var stars = r.score >= 90 ? '★★★' : r.score >= 70 ? '★★☆' : r.score >= 50 ? '★☆☆' : '☆☆☆';
    el.innerHTML = '<div class="ts-card ts-resultcard"><div class="ts-score"><b>' + r.score + '</b>점 <span>' + stars + '</span></div><div class="ts-mtitle">미션 ' + m.id + '. ' + esc(m.title) + ' — 복구 완료</div>' +
      '<div class="ts-rgrid"><div><h4>고장 원인</h4><p>' + esc(r.cause) + '</p><h4>수정 내용</h4><ul>' + r.fixes.map(function (f) { return '<li>' + esc(f.label || f.path) + ': ' + esc(f.fromTxt) + ' → ' + esc(f.toTxt) + '</li>'; }).join('') + '</ul>' +
      '<h4>정상 여부 (최종 검증, 시뮬레이션)</h4><ul>' + r.assess.speakers.map(function (s) { return '<li>' + esc(s.name) + ': ' + esc(E.GRADE_TEXT[s.grade]) + ' (' + E.levels.dbTxt(s.R) + ' dB, 최대 출력 대비)</li>'; }).join('') + '</ul></div>' +
      '<div><h4>발견한 증거</h4><ul>' + (r.evidence.length ? r.evidence.map(function (e) { return '<li' + (e.root ? ' class="root"' : '') + '>' + (e.root ? '🎯 ' : '') + esc(e.label) + '</li>'; }).join('') : '<li>검사 기록 없음</li>') + '</ul>' +
      '<p class="ts-small">' + (r.diagnosedFirst ? '원인을 가리키는 증거를 찾은 뒤에 고쳤습니다.' : '원인 증거를 찾기 전에 고쳤습니다(−20). 다음에는 검사로 원인을 먼저 확인해 보세요.') + '</p>' +
      '<h4>점수 내역</h4><ul><li>힌트 ' + r.hints + '단계: −' + r.penalties.hints + '</li><li>불필요한 조작 ' + r.unnecessaryOps.length + '회: −' + r.penalties.unnecessary + '</li><li>최종 검증 실패: −' + r.penalties.verifyFails + '</li><li>진단 전 수리: −' + r.penalties.noDiagnosis + '</li></ul></div></div>' +
      (r.unnecessaryOps.length ? '<h4>불필요했던 조작</h4><ul>' + r.unnecessaryOps.map(function (o) { return '<li>' + esc(o.label || o.path) + ': ' + esc(o.fromTxt) + ' → ' + esc(o.toTxt) + '</li>'; }).join('') + '</ul>' : '') +
      '<h4>배운 점</h4><p>' + esc(r.learn) + '</p><div class="ts-head-btns"><button type="button" class="ts-btn ts-primary" data-act="start" data-m="' + m.id + '" data-s="' + S.scenario + '">같은 시나리오 다시</button>' +
      '<button type="button" class="ts-btn" data-act="start" data-m="' + m.id + '" data-s="random">이 미션 무작위</button><button type="button" class="ts-btn" data-act="list">미션 목록</button></div></div>';
  }
  function backToList() { $('[data-role=play]').hidden = true; $('[data-role=result]').hidden = true; $('[data-role=missions]').hidden = false; renderMissions(); if (view3d) view3d.pause(true); }

  function onClick(e) {
    var t = e.target.closest('[data-act]'); if (!t || !root.contains(t)) return; var a = t.getAttribute('data-act');
    if (a === 'start') start(t.getAttribute('data-m'), t.getAttribute('data-s'));
    else if (a === 'sel') select(t.getAttribute('data-id'));
    else if (a === 'inspect') doInspect(t.getAttribute('data-tool'), t.getAttribute('data-target'));
    else if (a === 'op') doOp(t.getAttribute('data-path'), t.getAttribute('data-val') === 'true');
    else if (a === 'hint') doHint();
    else if (a === 'verify') doVerify();
    else if (a === 'list') backToList();
  }
  function onInput(e) { var t = e.target; if (t.type === 'range' && t.getAttribute('data-path')) { var path = t.getAttribute('data-path'), b = root.querySelector('[data-val="' + path + '"]'); if (b) b.textContent = valTxt(path, +t.value / 100); } }
  function onChange(e) { var t = e.target, path = t.getAttribute && t.getAttribute('data-path'); if (!path) return;
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
    syncCables(); syncDevices();
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
      if (controls.update() || needs) { renderer.render(scene, camera); needs = false; } })();
    $('[data-role=loading]').style.display = 'none';
    if (sel) focus(sel);
    return {
      scene: scene, camera: camera, renderer: renderer, controls: controls, devs: devs, cables: cables,
      sync: function () { syncCables(); syncDevices(); if (sel) focus(sel); needs = true; }, focus: focus, pause: function (v) { paused = !!v; },
      setCamera: function (pos, target) { tween = null; camera.position.fromArray(pos); controls.target.fromArray(target); controls.update(); needs = true; },
      renderNow: function () { if (tween) { camera.position.copy(tween.p1); controls.target.copy(tween.t1); tween = null; } controls.update(); renderer.render(scene, camera); },
      dispose: function () { alive = false; window.removeEventListener('resize', resize); scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); }
    };
  }

  // ---------------------------------------------------------------------------
  function setup() {
    root = document.getElementById('tsRoot'); E = window.PaTsEngine;
    if (!root) return; if (!E) { root.innerHTML = '<div class="ts-note">진단 엔진 파일(assets3d/pa_troubleshoot_engine.js)을 불러오지 못했어요.</div>'; return; }
    renderShell();
  }
  window.PaTroubleshoot = {
    start: start, select: select, inspect: doInspect, op: doOp, hint: doHint, verify: doVerify, list: backToList,
    getSession: function () { return S; }, getView: function () { return view3d; }, engine: function () { return E; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
