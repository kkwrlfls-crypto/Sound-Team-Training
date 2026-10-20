/* =============================================================================
   3층 음향 시스템 「배선 실습」 — 장비는 실제 설치 위치에 미리 놓고, 끌어서 선만 잇기 (2026-10-20)
   - 기존 실습 코드(gear3d, gear3dPlaceAt, handleGearCableClick3d, connectedCables, checkLayoutComplete)는
     그대로 불러 쓰기만 합니다. 장비를 놓는 단계(보관함 → 3D 클릭)를 없애고, 이 파일이 대신 놓아 줍니다.
   - 위치·방향은 「교회 둘러보기」와 같은 설치 데이터(window.SANCTUARY_INSTALL)를 씁니다.
   - 조작: 장비(또는 이름표)를 누른 채 끌어서 다른 장비 위에 놓으면 케이블이 연결됩니다.
     기존처럼 두 장비를 차례로 눌러도 연결됩니다.
   ============================================================================= */
(function () {
  'use strict';
  // 실습 장비 id → 설치 데이터의 장비 id
  var MAP = {
    vi10p_L: 'vi10p_L', vi10p_R: 'vi10p_R', woofer_L: 'woofer_L', woofer_R: 'woofer_R',
    y7p_L: 'y7p_L', y10p_C: 'y10p_C', y7p_R: 'y7p_R', e8_L: 'e8_L', e8_R: 'e8_R',
    amp_40d: 'amp_40d', amp_10d: 'amp_10d', stagebox: 'stagebox', console: 'cl5'
  };
  var TAG_DY = { stagebox: -14, amp_40d: 14, amp_10d: 42 };   // 랙 안 장비 이름표가 겹치지 않게 아래로 쌓음(px)
  var VIEWS = [['cables', '위에서 전체'], ['overview', '회중석에서'], ['rack', '앰프 랙'], ['booth', '방송실'], ['stage', '단상']];   // 방송실(CL5)과 랙(Rio)을 한 화면에서 이으려면 「위에서 전체」
  var DEG = Math.PI / 180;
  var W = { placed: false, tags: {}, line: null, drag: null, suppress: false, viewed: false };

  function $(id) { return document.getElementById(id); }
  function D() { return window.SANCTUARY_INSTALL; }
  function dev(id) { var d = D(); return d && d.devices.find(function (x) { return x.id === id; }); }
  function g() { try { return gear3d; } catch (e) { return null; } }
  function isPractice() { var t = $('tab2'); return !!t && t.dataset.g3mode === 'practice'; }
  function ready() {
    var G = g(); if (!G || !G.inited || !G.scene || !window.THREE || !D()) return false;
    return Object.keys(MAP).every(function (id) { var k = GEAR_MODEL_MAP[id]; return !k || G.models[k]; });
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
  // 매 프레임: 화면 밖·카메라 뒤 이름표는 숨기고, 멀리서 볼 때만 랙 안 장비 이름표를 아래로 쌓음
  var loopOn = false;
  function tagLoop() {
    if (!isPractice()) { loopOn = false; return; }
    var G = g(), cam = G && G.camera;
    if (cam) Object.keys(W.tags).forEach(function (id) {
      var t = W.tags[id], dist = cam.position.distanceTo(t.c), near = dist < 7;
      t.obj.position.copy(t.c).add(new THREE.Vector3(0, near ? 0.12 : 0.4, 0));
      var v = t.obj.position.clone().project(cam), inView = v.z < 1 && Math.abs(v.x) < 1.02 && Math.abs(v.y) < 1.02;
      t.obj.visible = inView; t.el.style.display = inView ? '' : 'none';
      t.el.style.marginTop = (!near && TAG_DY[id]) ? TAG_DY[id] + 'px' : '';
    });
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
    });
  }

  /* ---------------------------------------------------------------- 시점 버튼 */
  function setView(loc) {
    var G = g(), d = D(); if (!G || !d) return;
    var l = d.locations.find(function (x) { return x.id === loc; }); if (!l) return;
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
    return hit && MAP[hit.id] ? hit : null;
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
  function onDown(e) {
    if (!isPractice() || !W.placed || e.button > 0) return;
    var h = gearAt(e); if (!h || !MAP[h.id]) return;
    var G = g(), t = terminal(h.id, h.point, 'output');
    W.drag = { from: h.id, port: t.port, a: t.pos, x: e.clientX, y: e.clientY, moved: false, over: null, overPort: null };
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
    if (dr.moved) {
      W.suppress = true;   // 이어서 오는 click 이 「두 번 눌러 잇기」로 다시 처리되지 않게
      setTimeout(function () { W.suppress = false; }, 400);
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

  /* ---------------------------------------------------------------- 연결 */
  function enter() {
    if (!ready()) return false;
    if (!W.placed) placeAll();
    makeTags(); addViewBar(); showTags(true); markTags(); startLoop();
    if (!W.viewed) { setView('cables'); W.viewed = true; }
    var st = $('cableStatusText');
    if (st && !connectedCables.length) st.textContent = '🔌 장비(또는 이름표)를 누른 채 끌어서, 연결할 장비 위에 놓으세요.';
    return true;
  }
  function onMode() {
    if (isPractice()) { if (!enter()) waitReady(); }
    else showTags(false);
  }
  var waiting = false;
  function waitReady() {
    if (waiting) return; waiting = true;
    (function tick(n) { if (isPractice() && enter()) { waiting = false; return; } if (n > 600 || !isPractice()) { waiting = false; return; } setTimeout(function () { tick(n + 1); }, 250); })(0);
  }
  function init() {
    var wrap = $('canvas3dWrap'), tab = $('tab2'); if (!wrap || !tab) return;
    wrap.addEventListener('pointerdown', onDown, true);
    wrap.addEventListener('click', function (e) { if (W.suppress) { W.suppress = false; e.stopPropagation(); e.preventDefault(); } }, true);
    // 장비가 고정이므로 더블클릭으로 보관함에 되돌리는 동작은 막음
    wrap.addEventListener('dblclick', function (e) { if (isPractice()) { e.stopPropagation(); e.preventDefault(); } }, true);
    // 케이블이 바뀔 때(검증·선 초기화·연결) 이름표 상태 갱신
    wrap.addEventListener('click', function () { setTimeout(markTags, 0); });
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#tab2 .cable-instruction button, #tab2 .btn')) setTimeout(markTags, 0); });
    if (window.MutationObserver) new MutationObserver(onMode).observe(tab, { attributes: true, attributeFilter: ['data-g3mode', 'class'] });
    onMode();
  }
  window.WiringPractice = { enter: enter, placeAll: placeAll, setView: setView, tags: function () { return W.tags; }, state: function () { return { placed: W.placed, drag: !!W.drag }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
