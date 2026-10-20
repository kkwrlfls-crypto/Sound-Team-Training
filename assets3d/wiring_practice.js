/* =============================================================================
   3층 음향 시스템 「배선 실습」 — 장비는 실제 설치 위치에 미리 놓고, 끌어서 선만 잇기 (2026-10-20)
   - 기존 실습 코드(gear3d, gear3dPlaceAt, handleGearCableClick3d, connectedCables, checkLayoutComplete)는
     그대로 불러 쓰기만 합니다. 장비를 놓는 단계(보관함 → 3D 클릭)를 없애고, 이 파일이 대신 놓아 줍니다.
   - 위치·방향은 「교회 둘러보기」와 같은 설치 데이터(window.SANCTUARY_INSTALL)를 씁니다.
   - 조작: 장비(또는 이름표)를 누른 채 끌어서 다른 장비 위에 놓으면 케이블이 연결됩니다.
     기존처럼 두 장비를 차례로 눌러도 연결됩니다(누르기는 이 파일이 직접 처리 — 이름표를 눌러도 똑같이 동작).
   - 잘못 이은 케이블은 케이블을 누르면 빠집니다(화면에서 선 가까이 12px 안이면 잡힘, 올리면 빨갛게 표시).
   ============================================================================= */
(function () {
  'use strict';
  // 실습 장비 id → 설치 데이터의 장비 id
  var MAP = {
    vi10p_L: 'vi10p_L', vi10p_R: 'vi10p_R', woofer_L: 'woofer_L', woofer_R: 'woofer_R',
    y7p_L: 'y7p_L', y10p_C: 'y10p_C', y7p_R: 'y7p_R', e8_L: 'e8_L', e8_R: 'e8_R',
    amp_40d: 'amp_40d', amp_10d: 'amp_10d', stagebox: 'stagebox', console: 'cl5'
  };
  var VIEWS = [['cables', '위에서 전체'], ['overview', '회중석에서'], ['rack', '앰프 랙'], ['booth', '방송실'], ['stage', '단상']];   // 방송실(CL5)과 랙(Rio)을 한 화면에서 이으려면 「위에서 전체」
  var DEG = Math.PI / 180;
  var W = { placed: false, tags: {}, line: null, drag: null, suppress: false, viewed: false };

  function $(id) { return document.getElementById(id); }
  function D() { return window.SANCTUARY_INSTALL; }
  function dev(id) { var d = D(); return d && d.devices.find(function (x) { return x.id === id; }); }
  function g() { try { return gear3d; } catch (e) { return null; } }
  function isPractice() { var t = $('tab2'); return !!t && t.dataset.g3mode === 'practice'; }
  var t0 = 0;
  function ready() {
    var G = g(); if (!G || !G.inited || !G.scene || !window.THREE || !D()) return false;
    if (!t0) t0 = Date.now();
    // CL5 3D 모델은 따로 늦게 오므로, 실패했거나 20초가 지나면 사진 카드로라도 진행
    return Object.keys(MAP).every(function (id) { var k = GEAR_MODEL_MAP[id]; return !k || G.models[k] || (k === 'cl5' && (G.cl5Failed || Date.now() - t0 > 20000)); });
  }
  function item(id) { return gearItems.find(function (x) { return x.id === id; }); }

  /* ---------------------------------------------------------------- 장비 미리 놓기 */
  function centerOf(id) {   // 장비 가운데의 월드 좌표
    var d = dev(MAP[id]); return d ? new THREE.Vector3().fromArray(d.pos) : null;
  }
  function placeAll() {
    var G = g(); if (!G) return;
    Object.keys(MAP).forEach(function (id) {
      if (G.placedPos[id]) return;
      var d = dev(MAP[id]); if (!d || !d.pos) return;
      var yaw = (d.yawDeg || 0) * DEG, roll = (d.rollDeg || 0) * DEG;
      var k = GEAR_MODEL_MAP[id], tpl = k && G.models[k], pt = new THREE.Vector3().fromArray(d.pos);
      if (tpl) {
        // 설치 데이터의 pos 는 장비 가운데, 실습 모델은 바닥 가운데가 기준점 → 회전을 반영해 내려 줌
        G.meshRotY[id] = yaw; G.meshRotZ[id] = roll;
        pt.sub(new THREE.Vector3(0, (tpl.height || 0) / 2, 0).applyEuler(new THREE.Euler(0, yaw, roll, 'XYZ')));
      }
      gear3dPlaceAt(id, pt, true);
    });
    G.armedId = null; G.keyboardTargetId = null;
    try { gear3dRenderTray(); gear3dRefreshCardStates(); } catch (e) { /* noop */ }
    W.placed = true;
  }

  /* ---------------------------------------------------------------- 이름표 */
  function makeTags() {
    var G = g(); if (!G || Object.keys(W.tags).length) return;
    Object.keys(MAP).forEach(function (id) {
      var c = centerOf(id), it = item(id); if (!c || !it) return;
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'g3w-tag'; el.dataset.gear = id; el.textContent = it.name;
      el.setAttribute('aria-label', it.name + ' — 끌어서 다른 장비에 놓으면 연결');
      var o = new THREE.CSS2DObject(el);
      o.position.copy(c).add(new THREE.Vector3(0, 0.4, 0));
      G.scene.add(o);
      W.tags[id] = { el: el, obj: o, c: c };
    });
  }
  // 매 프레임: 화면 밖·카메라 뒤 이름표는 숨기고, 화면에서 겹치는 이름표는 아래로 밀어 서로 안 가리게 함
  //  (예전에는 랙 안 장비만 고정 간격으로 쌓았는데, 보는 각도에 따라 겹쳐서 누르기가 가끔 엉뚱한 장비로 갔음)
  var loopOn = false;
  function tagLoop() {
    if (!isPractice()) { loopOn = false; return; }
    var G = g(), cam = G && G.camera;
    if (cam && G.renderer) {
      var W2 = G.renderer.domElement.clientWidth, H2 = G.renderer.domElement.clientHeight, vis = [];
      Object.keys(W.tags).forEach(function (id) {
        var t = W.tags[id], near = cam.position.distanceTo(t.c) < 7;
        t.obj.position.copy(t.c).add(new THREE.Vector3(0, near ? 0.12 : 0.4, 0));
        var v = t.obj.position.clone().project(cam), inView = v.z < 1 && Math.abs(v.x) < 1.02 && Math.abs(v.y) < 1.02;
        t.obj.visible = inView; t.el.style.display = inView ? '' : 'none';
        if (inView) { if (!t.w) { t.w = t.el.offsetWidth || 90; t.h = t.el.offsetHeight || 24; } vis.push({ t: t, x: (v.x + 1) / 2 * W2, y: (1 - v.y) / 2 * H2, dy: 0 }); }
      });
      vis.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
      for (var i = 0; i < vis.length; i++) {
        var A = vis[i], moved = true, guard = 0;
        while (moved && guard++ < 12) { moved = false;
          for (var j = 0; j < i; j++) { var B = vis[j];
            if (Math.abs(A.x - B.x) < (A.t.w + B.t.w) / 2 + 4 && Math.abs((A.y + A.dy) - (B.y + B.dy)) < (A.t.h + B.t.h) / 2 + 3) { A.dy = (B.y + B.dy) + (A.t.h + B.t.h) / 2 + 3 - A.y; moved = true; } } }
      }
      vis.forEach(function (o) { var m = o.dy ? Math.round(o.dy) + 'px' : ''; if (o.t.el.style.marginTop !== m) o.t.el.style.marginTop = m; });
    }
    requestAnimationFrame(tagLoop);
  }
  function startLoop() { if (!loopOn) { loopOn = true; requestAnimationFrame(tagLoop); } }
  function showTags(on) { Object.keys(W.tags).forEach(function (id) { W.tags[id].obj.visible = on; W.tags[id].el.style.display = on ? '' : 'none'; }); }
  function markTags() {
    Object.keys(W.tags).forEach(function (id) {
      var t = W.tags[id].el, con = connectedCables.some(function (c) { return c.fromId === id || c.toId === id; });
      t.classList.toggle('on', con);
      t.classList.toggle('from', !!(W.drag && W.drag.from === id));
      t.classList.toggle('over', !!(W.drag && W.drag.over === id));
      var selId = null; try { selId = selectedGearForCable && selectedGearForCable.id; } catch (e) { /* noop */ }
      t.classList.toggle('sel', selId === id && !W.drag);
    });
  }

  /* ---------------------------------------------------------------- 시점 버튼 */
  function setView(loc) {
    var G = g(), d = D(); if (!G || !d) return;
    var l = d.locations.find(function (x) { return x.id === loc; }); if (!l) return;
    // 직전에 화면을 돌렸으면 관성(damping)이 남아 화면이 계속 흘러가 이름표를 놓치므로, 관성을 다 소진시킨 뒤 위치를 정함
    for (var i = 0; i < 120; i++) G.controls.update();
    G.camera.position.fromArray(l.view.pos); G.controls.target.fromArray(l.view.target); G.controls.update();
  }
  function addViewBar() {
    if ($('g3wViews')) return;
    var wrap = $('canvas3dWrap'); if (!wrap) return;
    var bar = document.createElement('div'); bar.id = 'g3wViews'; bar.className = 'g3w-views g3-practice-only';
    bar.innerHTML = '<span>보기</span>' + VIEWS.map(function (v) { return '<button type="button" data-view="' + v[0] + '">' + v[1] + '</button>'; }).join('');
    wrap.parentNode.insertBefore(bar, wrap);
    bar.addEventListener('click', function (e) { var b = e.target.closest('[data-view]'); if (b) setView(b.getAttribute('data-view')); });
  }

  /* ---------------------------------------------------------------- 끌어서 잇기 */
  function ndc(e) { var r = g().renderer.domElement.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
  function gearAt(e) {   // 이름표·카드·3D 모델 순서로 그 자리의 장비를 찾음
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var tag = el && el.closest && el.closest('.g3w-tag'); if (tag) return { id: tag.dataset.gear, point: null };
    var card = el && el.closest && el.closest('.gear3d-card');
    if (card) { var G = g(); var cid = Object.keys(G.cardEls).find(function (k) { return G.cardEls[k] === card; }); if (cid) return { id: cid, point: null }; }
    if (!el || !(el.closest && el.closest('#canvas3dWrap'))) return null;
    var hit = gear3dRaycastMeshGroupsWithPoint(ndc(e));
    if (hit && MAP[hit.id]) return hit;
    // 이름표 바로 옆(10px 안)을 눌러도 그 장비로 — 작은 이름표를 살짝 빗나가게 누르는 경우
    var best = null, bd = 1e9;
    Object.keys(W.tags).forEach(function (id) { var t = W.tags[id]; if (t.el.style.display === 'none') return; var r = t.el.getBoundingClientRect();
      if (e.clientX < r.left - 10 || e.clientX > r.right + 10 || e.clientY < r.top - 10 || e.clientY > r.bottom + 10) return;
      var d = Math.hypot(e.clientX - (r.left + r.right) / 2, e.clientY - (r.top + r.bottom) / 2); if (d < bd) { bd = d; best = id; } });
    return best ? { id: best, point: null } : null;
  }
  function terminal(id, point, prefer) {
    var p = point ? gear3dFindNearestPort(id, point, prefer) : null;
    var port = p ? p.portId : null;
    return { port: port, pos: gear3dGetWorldTerminal(id, port) || centerOf(id) };
  }
  function lineTo(a, b) {
    var G = g();
    if (!W.line) {
      W.line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x0e7490, depthTest: false, transparent: true, opacity: 0.95 }));
      W.line.renderOrder = 40; G.scene.add(W.line);
    }
    var mid = a.clone().add(b).multiplyScalar(0.5); mid.y -= Math.min(a.distanceTo(b) * 0.08, 0.5);
    W.line.geometry.setFromPoints(new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(24));
    W.line.visible = true;
  }
  /* ---------------------------------------------------------------- 케이블 누르면 빼기 */
  function cableAt(e) {   // 화면 좌표에서 가장 가까운 케이블(12px 안)
    var G = g(); if (!G || !connectedCables.length) return null;
    var r = G.renderer.domElement.getBoundingClientRect(), best = null, bestD = 12;
    connectedCables.forEach(function (c) {
      var key = gear3dCableKey(c.fromId, c.toId), en = gear3dCableMeshes[key], path = en && en.mesh && en.mesh.geometry && en.mesh.geometry.parameters && en.mesh.geometry.parameters.path;
      if (!path) return;
      var pts = path.getPoints(40).map(function (p) { var v = p.clone().project(G.camera); return v.z > 1 ? null : { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; });
      for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i]; if (!a || !b) continue;
        var dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((e.clientX - a.x) * dx + (e.clientY - a.y) * dy) / L)) : 0;
        var d = Math.hypot(e.clientX - (a.x + t * dx), e.clientY - (a.y + t * dy)); if (d < bestD) { bestD = d; best = { key: key, cable: c }; } }
    });
    return best;
  }
  var hlMat = null, hlKey = null;
  function hoverCable(key) {
    if (key === hlKey) return;
    var G = g();
    if (hlKey && gear3dCableMeshes[hlKey] && gear3dCableMeshes[hlKey].mesh.userData.origMat) { gear3dCableMeshes[hlKey].mesh.material = gear3dCableMeshes[hlKey].mesh.userData.origMat; }
    hlKey = key;
    if (key && gear3dCableMeshes[key]) {
      var m = gear3dCableMeshes[key].mesh; if (!hlMat) hlMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x7f1d1d, roughness: 0.5 });
      m.userData.origMat = m.material; m.material = hlMat;
    }
    if (G && G.renderer) G.renderer.domElement.style.cursor = key ? 'pointer' : '';
  }
  function removeCable(key) {
    var c = connectedCables.find(function (x) { return gear3dCableKey(x.fromId, x.toId) === key; }); if (!c) return false;
    hoverCable(null);
    connectedCables = connectedCables.filter(function (x) { return gear3dCableKey(x.fromId, x.toId) !== key; });
    try { gear3dRebuildAllCables(); gear3dRefreshCardStates(); } catch (err) { /* noop */ }
    var st = $('cableStatusText'); if (st) st.textContent = '✂️ 케이블을 뺐어요: ' + c.fromName + ' ↔ ' + c.toName;
    markTags(); return true;
  }
  function onHover(e) {
    if (!isPractice() || W.drag || e.buttons) return;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || !el.closest || !el.closest('#canvas3dWrap') || el.closest('.g3w-tag')) { hoverCable(null); return; }
    var c = cableAt(e); hoverCable(c ? c.key : null);
    if (c) { var st = $('cableStatusText'); if (st && !W.hoverMsg) { W.hoverMsg = st.textContent; } if (st) st.textContent = '✂️ 누르면 이 케이블(' + c.cable.fromName + ' ↔ ' + c.cable.toName + ')을 빼요'; }
    else if (W.hoverMsg) { var st2 = $('cableStatusText'); if (st2 && /^✂️ 누르면/.test(st2.textContent)) st2.textContent = W.hoverMsg; W.hoverMsg = null; }
  }

  function onDown(e) {
    if (!isPractice() || !W.placed || e.button > 0) return;
    var h = gearAt(e);
    if (!h || !MAP[h.id]) {   // 장비가 아니면: 케이블 위인지 확인(누르고 그대로 떼면 빼기, 끌면 평소처럼 화면 돌리기)
      var c = cableAt(e); W.press = c ? { key: c.key, x: e.clientX, y: e.clientY } : null; return;
    }
    W.press = null;
    var G = g(), t = terminal(h.id, h.point, 'output');
    W.drag = { from: h.id, point: h.point, port: t.port, a: t.pos, x: e.clientX, y: e.clientY, moved: false, over: null, overPort: null };
    G.controls.enabled = false;   // 끄는 동안 화면이 돌아가지 않게
    markTags();
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onCancel, true);
    if (e.target.closest('.g3w-tag')) e.preventDefault();
  }
  function onMove(e) {
    var dr = W.drag; if (!dr) return;
    if (!dr.moved && Math.hypot(e.clientX - dr.x, e.clientY - dr.y) < 6) return;
    dr.moved = true; e.preventDefault();
    var G = g(), h = gearAt(e), end;
    if (h && h.id !== dr.from && MAP[h.id]) { var t = terminal(h.id, h.point, 'input'); dr.over = h.id; dr.overPort = t.port; end = t.pos; }
    else {
      dr.over = null; dr.overPort = null;
      var rc = new THREE.Raycaster(); rc.setFromCamera(ndc(e), G.camera);
      end = rc.ray.at(G.camera.position.distanceTo(dr.a), new THREE.Vector3());
    }
    lineTo(dr.a, end); markTags();
    var st = $('cableStatusText');
    if (st) st.textContent = dr.over ? '🔗 ' + item(dr.from).name + ' → ' + item(dr.over).name + ' — 놓으면 연결돼요' : '🔗 ' + item(dr.from).name + ' 에서 끌고 있어요 — 연결할 장비 위에서 놓으세요';
  }
  function finish() {
    var G = g(); if (G) G.controls.enabled = true;
    if (W.line) W.line.visible = false;
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onCancel, true);
  }
  function onUp(e) {
    var dr = W.drag; W.drag = null; finish();
    if (!dr) return;
    W.suppress = true;   // 이어서 오는 click 은 기존 클릭 처리기로 보내지 않음(이 파일이 직접 처리)
    setTimeout(function () { W.suppress = false; }, 400);
    if (!dr.moved) {   // 그냥 누르기 = 「두 장비를 차례로 눌러 잇기」 (이름표·장비 어디를 눌러도 똑같이)
      var sel0 = null; try { sel0 = selectedGearForCable; } catch (err) { /* noop */ }
      var prefer = sel0 ? 'input' : 'output', np = dr.point ? gear3dFindNearestPort(dr.from, dr.point, prefer) : null;
      if (sel0 && sel0.id === dr.from) { selectedGearForCable = null; selectedGearForCablePortId = null; var s0 = $('cableStatusText'); if (s0) s0.textContent = '선택을 취소했어요.'; }
      else handleGearCableClick3d(item(dr.from), null, np ? np.portId : null);
    } else {
      if (dr.over) {
        try { selectedGearForCable = null; selectedGearForCablePortId = null; } catch (err) { /* noop */ }
        handleGearCableClick3d(item(dr.from), null, dr.port);
        handleGearCableClick3d(item(dr.over), null, dr.overPort);
      } else {
        var st = $('cableStatusText'); if (st) st.textContent = '연결할 장비(또는 이름표) 위에서 손을 떼야 연결돼요.';
      }
    }
    markTags();
  }
  function onCancel() { W.drag = null; finish(); markTags(); }
  function onPressUp(e) {
    var p = W.press; W.press = null; if (!p || W.drag) return;
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) return;
    if (removeCable(p.key)) { W.suppress = true; setTimeout(function () { W.suppress = false; }, 400); }
  }

  /* ---------------------------------------------------------------- 연결 */
  function enter() {
    if (!ready()) return false;
    if (!W.placed) placeAll();
    makeTags(); addViewBar(); showTags(true); markTags(); startLoop();
    if (!W.viewed) { setView('cables'); W.viewed = true; }
    var st = $('cableStatusText');
    if (st && !connectedCables.length) st.textContent = '🔌 장비(또는 이름표)를 누른 채 끌어서, 연결할 장비 위에 놓으세요. 잘못 이은 케이블은 케이블을 누르면 빠져요.';
    return true;
  }
  function onMode() {
    if (isPractice()) { if (!enter()) waitReady(); }
    else { showTags(false); hoverCable(null); }
  }
  var waiting = false;
  function waitReady() {
    if (waiting) return; waiting = true;
    (function tick(n) { if (isPractice() && enter()) { waiting = false; return; } if (n > 600 || !isPractice()) { waiting = false; return; } setTimeout(function () { tick(n + 1); }, 250); })(0);
  }
  function init() {
    var wrap = $('canvas3dWrap'), tab = $('tab2'); if (!wrap || !tab) return;
    wrap.addEventListener('pointerdown', onDown, true);
    wrap.addEventListener('pointerup', onPressUp, true);
    wrap.addEventListener('pointermove', onHover);
    wrap.addEventListener('click', function (e) { if (W.suppress) { W.suppress = false; e.stopPropagation(); e.preventDefault(); } }, true);
    // 장비가 고정이므로 더블클릭으로 보관함에 되돌리는 동작은 막음
    wrap.addEventListener('dblclick', function (e) { if (isPractice()) { e.stopPropagation(); e.preventDefault(); } }, true);
    // 케이블이 바뀔 때(검증·선 초기화·연결) 이름표 상태 갱신
    wrap.addEventListener('click', function () { setTimeout(markTags, 0); });
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#tab2 .cable-instruction button, #tab2 .btn')) setTimeout(markTags, 0); });
    if (window.MutationObserver) new MutationObserver(onMode).observe(tab, { attributes: true, attributeFilter: ['data-g3mode', 'class'] });
    onMode();
  }
  window.WiringPractice = { enter: enter, placeAll: placeAll, setView: setView, removeCable: removeCable, cableAt: cableAt, tags: function () { return W.tags; }, state: function () { return { placed: W.placed, drag: !!W.drag }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
