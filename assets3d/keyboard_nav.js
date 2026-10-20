/* =============================================================================
   3층 음향 시스템 탭 — 방향키로 화면 이동 (2026-10-20)
   - ↑ / ↓ : 앞으로 / 뒤로 이동      ← / → : 왼쪽 / 오른쪽으로 돌아보기
   - Shift + ← / → : 옆으로 이동      PageUp / PageDown : 위 / 아래로 이동
   - 둘러보기·신호 따라가기·배선 실습 모든 모드에서 동작. 키를 누르고 있는 동안 부드럽게 계속 움직임.
   - 카메라(gear3d.camera)와 회전 중심(controls.target)을 함께 옮기므로, 마우스 조작과 섞어 써도 됨.
   - 3D 화면이 화면에 거의 안 보일 때(페이지를 아래로 내려 글을 읽을 때)는 방향키를 가로채지 않아 평소처럼 스크롤됨.
   ============================================================================= */
(function () {
  'use strict';
  var KEYS = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, PageUp: 1, PageDown: 1 };
  var held = {}, shift = false, last = 0, running = false;
  var SPEED = 3.0, TURN = 75 * Math.PI / 180, LIFT = 2.0;   // m/s, rad/s, m/s

  function g() { try { return gear3d; } catch (e) { return null; } }
  function $(id) { return document.getElementById(id); }
  function active() {
    var t = $('tab2'), w = $('canvas3dWrap'), G = g();
    if (!t || !t.classList.contains('active') || !w || !G || !G.inited || !G.camera || !G.controls) return false;
    var r = w.getBoundingClientRect(), vis = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return r.height > 0 && vis / Math.min(r.height, innerHeight) > 0.4;   // 3D 화면이 40% 이상 보일 때만
  }
  function typing() {
    var a = document.activeElement, tag = (a && a.tagName) || '';
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (a && a.isContentEditable);
  }
  function onKeyDown(e) {
    if (!KEYS[e.key] || e.ctrlKey || e.metaKey || e.altKey || typing() || !active()) return;
    e.preventDefault();            // 페이지 스크롤 막기
    e.stopPropagation();           // 예전 실습의 「방향키로 장비 옮기기」로 가지 않게
    held[e.key] = true; shift = e.shiftKey;
    try { if (window.SanctuaryTour) SanctuaryTour.tween = null; } catch (err) { /* 날아가는 중이던 시점 이동 취소 */ }
    hideHint();
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(step); }
  }
  function onKeyUp(e) { if (KEYS[e.key]) { held[e.key] = false; } shift = e.shiftKey; }
  function anyHeld() { return Object.keys(held).some(function (k) { return held[k]; }); }
  function step() {
    var G = g(), now = performance.now();
    if (!G || !anyHeld() || !active()) { running = false; held = {}; return; }
    var dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;   // 화면이 느린 기기에서도 일정한 속도
    var cam = G.camera, tg = G.controls.target;
    var fwd = tg.clone().sub(cam.position); fwd.y = 0;
    if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, -1).applyQuaternion(cam.quaternion).setY(0);
    fwd.normalize();
    var right = new THREE.Vector3(-fwd.z, 0, fwd.x), move = new THREE.Vector3();
    if (held.ArrowUp) move.addScaledVector(fwd, SPEED * dt);
    if (held.ArrowDown) move.addScaledVector(fwd, -SPEED * dt);
    if (shift) {
      if (held.ArrowLeft) move.addScaledVector(right, -SPEED * dt);
      if (held.ArrowRight) move.addScaledVector(right, SPEED * dt);
    } else if (held.ArrowLeft || held.ArrowRight) {   // 제자리에서 고개 돌리기: 회전 중심을 카메라 둘레로 돌림
      var a = (held.ArrowLeft ? 1 : -1) * TURN * dt, off = tg.clone().sub(cam.position);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), a); tg.copy(cam.position).add(off);
    }
    if (held.PageUp) move.y += LIFT * dt;
    if (held.PageDown) move.y -= LIFT * dt;
    if (cam.position.y + move.y < 0.3) move.y = 0.3 - cam.position.y;   // 바닥 아래로는 안 내려감
    if (cam.position.y + move.y > 25) move.y = 25 - cam.position.y;
    cam.position.add(move); tg.add(move);
    G.controls.update();
    requestAnimationFrame(step);
  }

  /* 화면 왼쪽 아래 작은 안내 (한 번 방향키를 쓰면 사라짐, 3D 화면에 마우스를 올리면 다시 보임) */
  var hint = null, used = false;
  function makeHint() {
    var w = $('canvas3dWrap'); if (!w || hint) return;
    hint = document.createElement('div'); hint.className = 'g3-keyhint'; hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '⌨️ <b>↑↓</b> 앞뒤 이동 · <b>←→</b> 돌아보기 · <b>Shift+←→</b> 옆으로 · <b>PageUp/Down</b> 위아래';
    w.appendChild(hint);
    w.addEventListener('pointerenter', function () { if (hint && !used) hint.style.opacity = ''; });
  }
  function hideHint() { used = true; if (hint) hint.style.opacity = '0'; }

  function init() {
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', function () { held = {}; });
    (function wait(n) { if ($('canvas3dWrap')) makeHint(); else if (n < 200) setTimeout(function () { wait(n + 1); }, 300); })(0);
  }
  window.KeyboardNav = { held: function () { return held; }, active: active };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
