/* =============================================================================
   3층 음향 시스템 탭 — 「교회 둘러보기」 모드
   -----------------------------------------------------------------------------
   - 데이터: assets3d/sanctuary_install_data.js (window.SANCTUARY_INSTALL)
   - index.html 의 3D 장면(gear3d)을 그대로 같이 씁니다. 기존 배선 실습 코드는 고치지 않고,
     모드에 따라 실습용 장비·케이블·패널을 숨기거나 보여 주기만 합니다.
   - 둘러보기 모드에서는 실습용 클릭·키보드 조작이 동작하지 않게 막습니다(이벤트 캡처 단계).
   - API: window.SanctuaryTour
       setMode('tour'|'practice'), getMode(), select(deviceId), goLocation(locId),
       devices(), isBuilt(), getView(), setCamera(pos, target), screenPos(deviceId)
   ============================================================================= */
(function () {
  'use strict';
  var DATA = window.SANCTUARY_INSTALL;
  var MODE_KEY = 'soundTrainerTab2Mode_v1';
  var DEG = Math.PI / 180;

  var T = {
    mode: 'tour',
    built: false,
    root: null,          // THREE.Group (둘러보기 장비 전체)
    devs: {},            // id -> { def, group, outline }
    labels: [],          // CSS2DObject 목록
    labelById: {},       // 장비 id 또는 'loc:<id>' -> label element
    sel: null,           // 선택된 장비 id
    selLoc: null,        // 선택된 장소 id
    tween: null
  };

  function g3() { return (typeof gear3d !== 'undefined') ? gear3d : null; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function devDef(id) { return DATA.devices.find(function (d) { return d.id === id; }); }
  function locDef(id) { return DATA.locations.find(function (l) { return l.id === id; }); }
  function devName(id) { var d = devDef(id); return d ? d.name : id; }

  /* ---------------------------------------------------------------- 저장(편의) */
  function loadMode() {
    try { var m = localStorage.getItem(MODE_KEY); return (m === 'practice' || m === 'tour') ? m : 'tour'; } catch (e) { return 'tour'; }
  }
  function saveMode(m) { try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* 저장 안 돼도 동작에는 문제 없음 */ } }

  /* ---------------------------------------------------------------- 형태 만들기 */
  function stdMat(color, opts) {
    var o = Object.assign({ color: color, roughness: 0.6, metalness: 0.05 }, opts || {});
    return new THREE.MeshStandardMaterial(o);
  }
  function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

  // 앞면(+Z)에 둥근 그릴
  function grille(r, mat) {
    var m = new THREE.Mesh(new THREE.CircleGeometry(r, 28), mat);
    return m;
  }

  function buildProc(def) {
    var g = new THREE.Group();
    var s = def.size || [0.3, 0.3, 0.3];
    var body = stdMat(def.color != null ? def.color : 0x888888);
    var dark = stdMat(0x2a2c30, { roughness: 0.85 });
    var mesh;
    switch (def.proc) {
      case 'box': { // 작은 2웨이 스피커(G308)
        g.add(box(s[0], s[1], s[2], body));
        var gr = box(s[0] * 0.86, s[1] * 0.86, 0.006, stdMat(0x9ea3a8, { roughness: 0.9 }));
        gr.position.z = s[2] / 2 + 0.002; g.add(gr);
        var cone = grille(Math.min(s[0], s[1]) * 0.36, dark); cone.position.set(0, s[1] * 0.05, s[2] / 2 + 0.007); g.add(cone);
        break;
      }
      case 'small': { // Alea-4 + U 브래킷
        g.add(box(s[0], s[1], s[2], body));
        var g2 = grille(s[0] * 0.36, stdMat(0x8d9196, { roughness: 0.9 })); g2.position.z = s[2] / 2 + 0.002; g.add(g2);
        var brM = stdMat(0xe9e9e6);
        var b1 = box(0.012, s[1] * 0.9, s[2] * 0.6, brM); b1.position.set(-s[0] / 2 - 0.008, -s[1] * 0.1, 0); g.add(b1);
        var b2 = b1.clone(); b2.position.x = s[0] / 2 + 0.008; g.add(b2);
        var knob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, s[0] + 0.05, 12), stdMat(0x9b8f7a, { metalness: 0.5 }));
        knob.rotation.z = Math.PI / 2; g.add(knob);
        break;
      }
      case 'wedge': { // 바닥 모니터(MAX2): 바닥 평평, 뒤가 높고 앞이 낮은 경사면이 앞(+Z)
        var w = s[0], h = s[1], d = s[2];
        var sh = new THREE.Shape();
        // 2D 좌표 (u = 앞뒤, v = 위아래) → 아래에서 X 방향으로 돌려 세움
        sh.moveTo(-d / 2, -h / 2); sh.lineTo(d / 2, -h / 2); sh.lineTo(d / 2, -h / 2 + h * 0.38); sh.lineTo(-d / 2, h / 2); sh.lineTo(-d / 2, -h / 2);
        var geo = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false });
        geo.rotateY(-Math.PI / 2); geo.translate(w / 2, 0, 0);
        g.add(new THREE.Mesh(geo, body));
        // 경사면 그릴
        var p1 = new THREE.Vector3(0, -h / 2 + h * 0.38, d / 2), p2 = new THREE.Vector3(0, h / 2, -d / 2);
        var len = p1.distanceTo(p2);
        var gr2 = box(w * 0.9, 0.006, len * 0.86, stdMat(0x15171a, { roughness: 0.95 }));
        gr2.position.copy(p1.clone().add(p2).multiplyScalar(0.5)).add(new THREE.Vector3(0, 0.004, 0.002));
        gr2.rotation.x = Math.atan2(p2.y - p1.y, p1.z - p2.z);
        g.add(gr2);
        break;
      }
      case 'gooseneck': { // 받침 + 구즈넥 + 마이크 (pos = 받침 바닥)
        var m2 = stdMat(def.color != null ? def.color : 0x1c1d20, { roughness: 0.5, metalness: 0.3 });
        var base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 24), m2); base.position.y = 0.015; g.add(base);
        var curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, 0.2, -0.01), new THREE.Vector3(0, 0.34, 0.05), new THREE.Vector3(0, 0.40, 0.17)
        ]);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.006, 8, false), m2));
        var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.009, 0.07, 12), m2);
        cap.position.set(0, 0.405, 0.2); cap.rotation.x = Math.PI / 2 - 0.35; g.add(cap);
        var led = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.008), stdMat(0xd32f2f, { emissive: 0x5a0000 }));
        led.position.set(0, 0.032, 0.045); g.add(led);
        return g; // 받침 기준이라 가운데 맞춤 안 함
      }
      case 'console': { // CL5: 아래 몸체 + 뒤로 높아지는 윗면 + 화면
        var w3 = s[0], h3 = s[1], d3 = s[2];
        var lower = box(w3, h3 * 0.45, d3, body); lower.position.y = -h3 / 2 + h3 * 0.225; g.add(lower);
        var sh3 = new THREE.Shape();
        sh3.moveTo(-d3 / 2, 0); sh3.lineTo(d3 / 2, 0); sh3.lineTo(d3 / 2, h3 * 0.08); sh3.lineTo(-d3 / 2 + d3 * 0.28, h3 * 0.55); sh3.lineTo(-d3 / 2, h3 * 0.55); sh3.lineTo(-d3 / 2, 0);
        var geo3 = new THREE.ExtrudeGeometry(sh3, { depth: w3, bevelEnabled: false });
        geo3.rotateY(-Math.PI / 2); geo3.translate(w3 / 2, -h3 / 2 + h3 * 0.45, 0);
        g.add(new THREE.Mesh(geo3, body));
        var scr = box(w3 * 0.34, 0.006, d3 * 0.2, stdMat(0x5b7fa6, { emissive: 0x16283a, roughness: 0.3 }));
        scr.position.set(w3 * 0.08, -h3 / 2 + h3 * 0.45 + h3 * 0.42, -d3 * 0.12); scr.rotation.x = Math.atan2(h3 * 0.47, d3 * 0.72); g.add(scr);
        var strip = box(w3 * 0.92, 0.004, d3 * 0.26, stdMat(0x41454c));
        strip.position.set(0, -h3 / 2 + h3 * 0.45 + 0.01, d3 * 0.3); strip.rotation.x = Math.atan2(h3 * 0.47, d3 * 0.72) * 0.2; g.add(strip);
        for (var i = 0; i < 16; i++) { // 페이더 손잡이
          var f = box(0.012, 0.012, 0.02, stdMat(0xd7d9dc)); f.position.set(-w3 * 0.42 + i * (w3 * 0.84 / 15), -h3 / 2 + h3 * 0.45 + 0.022, d3 * 0.3 + ((i * 37) % 7 - 3) * 0.006); g.add(f);
        }
        break;
      }
      case 'rackstack': { // 1U 장비 여러 대
        var n = def.units || 1;
        for (var k = 0; k < n; k++) {
          var u = box(s[0], s[1] * 0.96, s[2], body); u.position.y = (k - (n - 1) / 2) * s[1]; g.add(u);
          var disp = box(s[0] * 0.18, s[1] * 0.45, 0.004, stdMat(0x3d6ea8, { emissive: 0x0f2a4a })); disp.position.set(-s[0] * 0.22, u.position.y, s[2] / 2 + 0.002); g.add(disp);
          var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 6), dark); ant.position.set(s[0] * 0.44, u.position.y + 0.08, s[2] / 2 + 0.01); if (k === n - 1) g.add(ant);
        }
        break;
      }
      case 'desk': {
        var top = box(s[0], 0.035, s[2], body); top.position.y = s[1] / 2 - 0.0175; g.add(top);
        var legM = stdMat(0x6b6f75, { metalness: 0.4 });
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
          var l = box(0.04, s[1] - 0.035, 0.04, legM); l.position.set(c[0] * (s[0] / 2 - 0.05), -0.0175, c[1] * (s[2] / 2 - 0.05)); g.add(l);
        });
        break;
      }
      case 'podium': { // 지휘자 단상: 낮은 상자 + 윗판
        var top2 = box(s[0], 0.025, s[2], stdMat(0x8a6f4d, { roughness: 0.7 })); top2.position.y = s[1] / 2 - 0.0125; g.add(top2);
        var bodyP = box(s[0] - 0.02, s[1] - 0.025, s[2] - 0.02, body); bodyP.position.y = -0.0125; g.add(bodyP);
        break;
      }
      case 'rio':
      case 'panel': { // 마이크 판넬(밝은 금속판) / Rio(검은 앞판): XLR 잭을 그린 앞면
        var face = panelTexture(def);
        var metal = stdMat(def.color != null ? def.color : 0xb8bcc2, { metalness: 0.6, roughness: 0.35 });
        var front = new THREE.MeshStandardMaterial({ map: face, metalness: 0.5, roughness: 0.4 });
        var plate = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], s[2]), [metal, metal, metal, metal, front, metal]);
        g.add(plate);
        break;
      }
      case 'rack': { // 앞이 열린 랙 캐비닛(앞 = +Z)
        var w4 = s[0], h4 = s[1], d4 = s[2], t = 0.02;
        var side = box(t, h4, d4, body); side.position.x = -w4 / 2 + t / 2; g.add(side);
        var side2 = side.clone(); side2.position.x = w4 / 2 - t / 2; g.add(side2);
        var back = box(w4, h4, t, body); back.position.z = -d4 / 2 + t / 2; g.add(back);
        var topP = box(w4, t, d4, body); topP.position.y = h4 / 2 - t / 2; g.add(topP);
        var bot = topP.clone(); bot.position.y = -h4 / 2 + t / 2; g.add(bot);
        var railM = stdMat(0x3a3d42, { metalness: 0.5 });
        [-1, 1].forEach(function (sx) { var r = box(0.018, h4 - 0.08, 0.02, railM); r.position.set(sx * 0.241, 0, d4 / 2 - 0.04); g.add(r); });
        break;
      }
      default:
        g.add(box(s[0], s[1], s[2], body));
    }
    return g;
  }

  // 판넬 앞면: 금속판에 XLR 잭(위아래 2줄)과 번호를 그린 캔버스 텍스처
  function panelTexture(def) {
    var s = def.size, n = def.channels || 8, rows = def.rows || 2, cols = Math.ceil(n / rows);
    var W = 1024, H = Math.round(W * s[1] / s[0]);
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    var dark = def.proc === 'rio';
    var grd = c.createLinearGradient(0, 0, 0, H);
    if (dark) { grd.addColorStop(0, '#2a2d33'); grd.addColorStop(1, '#16181c'); } else { grd.addColorStop(0, '#d7dade'); grd.addColorStop(1, '#a9aeb5'); }
    c.fillStyle = grd; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#7d838b'; c.lineWidth = 6; c.strokeRect(3, 3, W - 6, H - 6);
    [[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]].forEach(function (p) { c.fillStyle = '#6b7178'; c.beginPath(); c.arc(p[0], p[1], 9, 0, Math.PI * 2); c.fill(); });
    var titleH = H * 0.16;
    c.fillStyle = dark ? '#e5e7eb' : '#1f2937'; c.font = 'bold ' + Math.round(titleH * 0.62) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText((def.label || '') + '  ·  ' + n + 'CH', W / 2, titleH * 0.7);
    var areaTop = titleH * 1.25, cellW = (W - 60) / cols, cellH = (H - areaTop - 20) / rows;
    var r = Math.min(cellW, cellH) * 0.3;
    for (var i = 0; i < n; i++) {
      var row = Math.floor(i / cols), col = i % cols;
      var cx = 30 + cellW * (col + 0.5), cy = areaTop + cellH * row + cellH * 0.42;
      c.fillStyle = '#2b2f35'; c.beginPath(); c.arc(cx, cy, r * 1.18, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#0b0c0e'; c.beginPath(); c.arc(cx, cy, r * 0.9, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c9ccd1';
      [[-0.38, -0.22], [0.38, -0.22], [0, 0.42]].forEach(function (q) { c.beginPath(); c.arc(cx + q[0] * r, cy + q[1] * r, r * 0.14, 0, Math.PI * 2); c.fill(); });
      c.fillStyle = '#9aa0a8'; c.fillRect(cx - r * 0.2, cy - r * 1.18, r * 0.4, r * 0.16); // 잠금 버튼
      c.fillStyle = dark ? '#d1d5db' : '#111827'; c.font = 'bold ' + Math.round(r * 0.62) + 'px sans-serif';
      c.fillText(String(i + 1), cx, cy + r * 1.62);
    }
    var tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
    return tex;
  }

  function buildDevice(def) {
    var G = g3();
    var group = new THREE.Group();
    group.rotation.order = 'YXZ';
    group.userData.tourId = def.id;
    var inner = null;
    var tpl = def.modelKey && G && G.models[def.modelKey];
    if (tpl) {
      inner = tpl.scene.clone(true);
      inner.traverse(function (c) {
        if (c.isMesh && c.material) c.material = Array.isArray(c.material) ? c.material.map(function (m) { return m.clone(); }) : c.material.clone();
      });
      var bb = new THREE.Box3().setFromObject(tpl.scene);
      var ctr = bb.getCenter(new THREE.Vector3());
      inner.position.copy(ctr.negate());
    } else if (def.proc) {
      inner = buildProc(def);
    } else {
      inner = box(0.3, 0.3, 0.3, stdMat(0xb0b4ba)); // 모델을 아직 못 불러온 경우 임시 상자
    }
    group.add(inner);
    // 선택 표시용 테두리 상자(장비 자체 좌표계 기준이라 장비와 같이 돌아감)
    group.updateMatrixWorld(true);
    var lb = new THREE.Box3().setFromObject(inner);
    var lsz = lb.getSize(new THREE.Vector3()).addScalar(0.04), lc = lb.getCenter(new THREE.Vector3());
    var outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(lsz.x, lsz.y, lsz.z)),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, depthTest: false, transparent: true, opacity: 0.95 }));
    outline.position.copy(lc); outline.visible = false; outline.renderOrder = 10;
    group.add(outline);
    group.rotation.set((def.pitchDeg || 0) * DEG, (def.yawDeg || 0) * DEG, (def.rollDeg || 0) * DEG);
    group.position.fromArray(def.pos);
    // 세부 모델이 무거운 장비(예: Rio 모델 약 29만 삼각형)는 멀리 있을 때 단순한 상자로 바꿔 그립니다.
    var tris = 0, meshes = 0, firstColor = null;
    inner.traverse(function (c) {
      if (!c.isMesh) return;
      meshes++;
      var gg = c.geometry; tris += (gg.index ? gg.index.count : gg.attributes.position.count) / 3;
      if (!firstColor && c.material && c.material.color) firstColor = c.material.color.clone();
    });
    var heavy = tris > 20000 || meshes > 40;
    var proxy = null;
    if (heavy) {
      proxy = new THREE.Mesh(new THREE.BoxGeometry(lsz.x - 0.04, lsz.y - 0.04, lsz.z - 0.04), stdMat(firstColor ? firstColor.getHex() : 0x55585e));
      proxy.position.copy(lc); proxy.castShadow = true; proxy.receiveShadow = true;
      group.add(proxy);
      inner.visible = false;
    }
    inner.traverse(function (c) {
      if (!c.isMesh) return;
      c.castShadow = !heavy; c.receiveShadow = true; // 무거운 세부 모델은 그림자 계산에서 뺌
    });
    return { def: def, group: group, outline: outline, lod: heavy ? { inner: inner, proxy: proxy } : null };
  }

  function makeLabel(text, key, kind) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'g3t-label' + (kind === 'loc' ? ' g3t-label-loc' : '');
    el.textContent = text;
    el.dataset.key = key;
    el.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      if (kind === 'loc') goLocation(key.slice(4)); else select(key);
    });
    el.addEventListener('dblclick', function (e) { e.stopPropagation(); });
    var obj = new THREE.CSS2DObject(el);
    T.labels.push(obj);
    T.labelById[key] = el;
    return obj;
  }

  // 같은 장소에 모여 있는 장비(강대상·방송실·랙)는 장소 이름표 하나만 붙입니다.
  var GROUP_LABEL_LOCS = { pulpit: 1, booth: 1, rack: 1, conductor: 1 };

  function build() {
    var G = g3();
    if (!G || !G.scene || !G.modelRoot) return false;
    var root = new THREE.Group();
    root.name = 'sanctuaryTourRoot';
    var sums = {};
    DATA.devices.forEach(function (def) {
      if (!def.pos) return;
      var dv = buildDevice(def);
      T.devs[def.id] = dv;
      root.add(dv.group);
      if (GROUP_LABEL_LOCS[def.location]) {
        var s = sums[def.location] || (sums[def.location] = { p: new THREE.Vector3(), n: 0, top: -1 });
        s.p.add(new THREE.Vector3().fromArray(def.pos)); s.n++;
        s.top = Math.max(s.top, def.pos[1] + ((def.size && def.size[1]) || 0.3) / 2);
      } else if (!def.decor) {
        var lb = makeLabel(def.name, def.id, 'dev');
        var bb = new THREE.Box3().setFromObject(dv.group);
        lb.position.set(def.pos[0], bb.max.y + 0.22, def.pos[2]);
        root.add(lb);
      }
    });
    Object.keys(sums).forEach(function (lid) {
      var s = sums[lid], l = locDef(lid);
      var lb = makeLabel(l ? l.name : lid, 'loc:' + lid, 'loc');
      lb.position.copy(s.p.multiplyScalar(1 / s.n)); lb.position.y = s.top + (lid === 'pulpit' ? 0.55 : 0.35);
      root.add(lb);
    });
    G.scene.add(root);
    T.root = root;
    buildCables(root);
    T.built = true;
    applyMode(true);
    if (T.mode === 'tour') setCamera(locDef('overview').view.pos, locDef('overview').view.target);
    renderList();
    return true;
  }

  // 3D 모델 템플릿(gear_models_data.js)을 다 불러온 뒤에 만들어야 실제 모양이 들어갑니다.
  function neededModelKeys() {
    var keys = {};
    DATA.devices.forEach(function (d) { if (d.modelKey && d.pos) keys[d.modelKey] = 1; });
    return Object.keys(keys);
  }
  var waitStart = 0;
  function tryBuild() {
    if (T.built) return;
    var G = g3();
    if (!G || !G.inited || !G.modelRoot) return;
    if (!waitStart) waitStart = Date.now();
    var missing = neededModelKeys().filter(function (k) { return !G.models[k]; });
    if (missing.length && Date.now() - waitStart < 25000) return;
    if (missing.length) console.warn('[둘러보기] 장비 3D 모델을 불러오지 못해 임시 상자로 표시합니다:', missing.join(', '));
    build();
  }

  /* ---------------------------------------------------------------- 모드 전환 */
  function practiceObjects(cb) {
    var G = g3(); if (!G) return;
    Object.keys(G.meshGroups || {}).forEach(function (id) { cb(G.meshGroups[id]); });
    Object.keys(G.cssObjects || {}).forEach(function (id) { cb(G.cssObjects[id]); });
    if (typeof gear3dCableMeshes !== 'undefined') {
      Object.keys(gear3dCableMeshes).forEach(function (k) {
        var e = gear3dCableMeshes[k];
        if (e.mesh) cb(e.mesh); if (e.connA) cb(e.connA); if (e.connB) cb(e.connB);
      });
    }
  }

  function applyMode(silent) {
    var tab = $('tab2');
    if (tab) tab.dataset.g3mode = T.mode;
    document.querySelectorAll('.g3-modebar [data-mode]').forEach(function (b) {
      var on = b.dataset.mode === T.mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var tour = T.mode === 'tour';
    if (T.root) T.root.visible = tour;
    T.labels.forEach(function (o) { o.visible = tour; });
    practiceObjects(function (o) { o.visible = !tour; });
    var G = g3();
    if (tour && G) {
      G.armedId = null; G.keyboardTargetId = null;
      if (typeof selectedGearForCable !== 'undefined' && selectedGearForCable) {
        try { selectedGearForCable = null; selectedGearForCablePortId = null; } catch (e) { /* 실습 코드 상태 */ }
      }
      if (typeof gear3dRefreshCardStates === 'function') { try { gear3dRefreshCardStates(); } catch (e) { /* 아직 초기화 전 */ } }
    }
    if (!tour) closeCard();
  }

  function setMode(m) {
    if (m !== 'tour' && m !== 'practice') return;
    if (T.mode === m) { applyMode(); return; }
    T.mode = m;
    saveMode(m);
    applyMode();
    if (m === 'tour' && T.built && !T.sel) {
      var v = locDef('overview').view; flyTo(v.pos, v.target);
    }
    if (typeof gear3dOnResize === 'function') { try { gear3dOnResize(); } catch (e) { /* noop */ } }
  }

  /* ---------------------------------------------------------------- 케이블 경로 */
  // 데이터의 cableRoutes 를 종류별 색 선으로 그립니다. 같은 길을 지나는 케이블은 한 선으로 묶고,
  // 종류(스피커·마이크·Dante)가 다르면 조금씩 비켜 그려서 나란히 보이게 합니다.
  var CABLE_KIND = {
    speaker: { name: '스피커 케이블', color: 0xea580c, css: '#ea580c', k: -1 },
    mic: { name: '마이크 케이블', color: 0x16a34a, css: '#16a34a', k: 0 },
    dante: { name: 'Dante 랜선', color: 0x2563eb, css: '#2563eb', k: 1 }
  };
  var CABLE_KEY = 'soundTrainerTab2Cables_v1';
  function cableOffset(kind) {
    var k = (CABLE_KIND[kind] || CABLE_KIND.speaker).k;
    return new THREE.Vector3(0.035 * k, 0.025 * k, -0.035 * k);
  }
  function nodePos(id, kind) { return new THREE.Vector3().fromArray(DATA.cableNodes[id]).add(cableOffset(kind)); }
  function segMesh(a, b, r, mat) {
    var d = b.clone().sub(a), len = d.length();
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8, 1, true), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return m;
  }
  function loadCablePref() { try { return localStorage.getItem(CABLE_KEY) !== 'off'; } catch (e) { return true; } }
  function buildCables(root) {
    if (!DATA.cableRoutes || !DATA.cableNodes) return;
    var grp = new THREE.Group(); grp.name = 'tourCables';
    T.cableMats = {};
    Object.keys(CABLE_KIND).forEach(function (k) {
      T.cableMats[k] = new THREE.MeshStandardMaterial({ color: CABLE_KIND[k].color, roughness: 0.55, metalness: 0.05, transparent: true, opacity: 1 });
    });
    var edges = {};
    DATA.cableRoutes.forEach(function (rt) {
      for (var i = 0; i + 1 < rt.path.length; i++) {
        var a = rt.path[i], b = rt.path[i + 1];
        var key = (a < b ? a + '|' + b : b + '|' + a) + '|' + rt.kind;
        (edges[key] = edges[key] || { a: a, b: b, kind: rt.kind, n: 0 }).n++;
      }
    });
    var joints = {};
    Object.keys(edges).forEach(function (key) {
      var e = edges[key];
      var r = 0.016 + Math.min(0.014, 0.002 * (e.n - 1));
      grp.add(segMesh(nodePos(e.a, e.kind), nodePos(e.b, e.kind), r, T.cableMats[e.kind]));
      [e.a, e.b].forEach(function (nid) { var jk = nid + '|' + e.kind; joints[jk] = Math.max(joints[jk] || 0, r); });
    });
    Object.keys(joints).forEach(function (jk) {
      var p = jk.split('|');
      var sph = new THREE.Mesh(new THREE.SphereGeometry(joints[jk], 10, 8), T.cableMats[p[1]]);
      sph.position.copy(nodePos(p[0], p[1])); grp.add(sph);
    });
    T.cableEdgeCount = Object.keys(edges).length;
    T.cableRoot = grp;
    T.showCables = loadCablePref();
    grp.visible = T.showCables;
    root.add(grp);
    T.cableHi = new THREE.Group(); T.cableHi.name = 'tourCableHighlight'; root.add(T.cableHi);
    updateCableBar();
  }
  function setCablesVisible(on) {
    T.showCables = !!on;
    try { localStorage.setItem(CABLE_KEY, on ? 'on' : 'off'); } catch (e) { /* 저장 안 돼도 됨 */ }
    if (T.cableRoot) T.cableRoot.visible = T.showCables;
    if (T.cableHi) T.cableHi.visible = T.showCables;
    updateCableBar();
  }
  function routesFor(id) {
    return (DATA.cableRoutes || []).filter(function (r) { return r.from === id || r.to === id; });
  }
  // 고른 경로만 굵고 진하게, 나머지 케이블은 흐리게
  function highlightRoutes(list, radius) {
    var hr = radius || 0.03;
    if (!T.cableHi) return;
    while (T.cableHi.children.length) { var c = T.cableHi.children.pop(); c.geometry.dispose(); }
    var any = list && list.length;
    Object.keys(T.cableMats || {}).forEach(function (k) { T.cableMats[k].opacity = any ? 0.2 : 1; T.cableMats[k].depthWrite = !any; });
    if (!any) return;
    list.forEach(function (rt) {
      var mat = T.hiMats && T.hiMats[rt.kind];
      if (!mat) {
        T.hiMats = T.hiMats || {};
        // 고른 경로는 벽·단상 바닥 속을 지나도 보이도록 깊이 검사 없이 맨 위에 그림
        mat = T.hiMats[rt.kind] = new THREE.MeshBasicMaterial({ color: CABLE_KIND[rt.kind].color, depthTest: false, transparent: true, opacity: 0.95 });
      }
      for (var i = 0; i + 1 < rt.path.length; i++) { var sm = segMesh(nodePos(rt.path[i], rt.kind), nodePos(rt.path[i + 1], rt.kind), hr, mat); sm.renderOrder = 20; T.cableHi.add(sm); }
      rt.path.forEach(function (nid) { var sp = new THREE.Mesh(new THREE.SphereGeometry(hr, 10, 8), mat); sp.renderOrder = 20; sp.position.copy(nodePos(nid, rt.kind)); T.cableHi.add(sp); });
    });
  }
  function routeDef(rid) { return (DATA.cableRoutes || []).find(function (r) { return r.id === rid; }); }
  function selectRoute(rid) {
    var rt = routeDef(rid); if (!rt) return;
    if (T.mode !== 'tour') setMode('tour');
    clearSelection();
    if (!T.showCables) setCablesVisible(true);
    T.selRoute = rid;
    var bb = new THREE.Box3(); rt.path.forEach(function (n) { bb.expandByPoint(new THREE.Vector3().fromArray(DATA.cableNodes[n])); });
    var c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
    // 위에서 내려다보기: 지붕이 없는 모델이라 벽에 가리지 않음
    var hgt = Math.max(9, Math.max(sz.x / 1.3, sz.z / 0.85) + 4);
    highlightRoutes([rt], Math.max(0.03, hgt * 0.0025)); // 멀리서 봐도 보이는 굵기
    flyTo([c.x, hgt, c.z + hgt * 0.18], [c.x, 0.5, c.z]);
    showRouteCard(rt);
  }
  function showRouteCard(rt) {
    var card = $('g3tCard'); if (!card) return;
    var kind = CABLE_KIND[rt.kind] || CABLE_KIND.speaker;
    var h = '<div class="g3t-card-head"><div><div class="g3t-card-title">' + esc(rt.name) + '</div>';
    h += '<div class="g3t-card-sub"><span class="g3t-swatch" style="background:' + kind.css + '"></span>' + esc(kind.name) + (DATA.cableDraft ? ' · 예상 경로 (확인 전)' : '') + '</div></div>';
    h += '<button type="button" class="g3t-close" aria-label="닫기">×</button></div>';
    h += '<p class="g3t-role">' + esc(rt.desc || '') + '</p>';
    h += '<div class="g3t-sec">양 끝</div><ul class="g3t-links">' + [rt.from, rt.to].map(function (id) {
      return '<li><button type="button" class="g3t-link" data-go="' + esc(id) + '">' + esc(devName(id)) + '</button></li>';
    }).join('') + '</ul>';
    card.innerHTML = h; card.hidden = false;
  }
  function cableListHtml(list, title) {
    if (!list.length) return '';
    return '<div class="g3t-sec">' + title + (DATA.cableDraft ? ' <span class="g3t-draft">예상 · 확인 전</span>' : '') + '</div><ul class="g3t-links">' + list.map(function (rt) {
      var kind = CABLE_KIND[rt.kind] || CABLE_KIND.speaker;
      return '<li><span class="g3t-swatch" style="background:' + kind.css + '"></span><button type="button" class="g3t-link" data-route="' + esc(rt.id) + '">' + esc(rt.name) + '</button><span class="g3t-note">' + esc(rt.desc || '') + '</span></li>';
    }).join('') + '</ul>';
  }
  function updateCableBar() {
    var bar = $('g3tCableBar'); if (!bar) return;
    var on = !!T.showCables;
    var btn = bar.querySelector('.g3t-cable-toggle');
    if (btn) { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.textContent = on ? '케이블 경로 숨기기' : '케이블 경로 보기'; }
  }

  /* ---------------------------------------------------------------- 카메라 */
  function setCamera(pos, target) {
    var G = g3(); if (!G || !G.camera) return;
    T.tween = null;
    G.camera.position.fromArray(pos);
    G.controls.target.fromArray(target);
    G.controls.update();
  }

  function flyTo(pos, target, ms) {
    var G = g3(); if (!G || !G.camera) return;
    var dur = ms == null ? 900 : ms;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || dur <= 0) { setCamera(pos, target); return; }
    var tw = {
      p0: G.camera.position.clone(), t0: G.controls.target.clone(),
      p1: new THREE.Vector3().fromArray(pos), t1: new THREE.Vector3().fromArray(target),
      start: performance.now(), dur: dur
    };
    T.tween = tw;
    function step(now) {
      if (T.tween !== tw) return;
      var k = Math.min(1, (now - tw.start) / tw.dur);
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      // 가운데쯤에서 살짝 위로 떠서 벽을 덜 통과하도록
      var lift = Math.sin(Math.PI * e) * Math.min(1.2, tw.p0.distanceTo(tw.p1) * 0.08);
      G.camera.position.lerpVectors(tw.p0, tw.p1, e); G.camera.position.y = Math.min(Math.max(4.95, tw.p0.y, tw.p1.y), G.camera.position.y + lift);
      G.controls.target.lerpVectors(tw.t0, tw.t1, e);
      G.controls.update();
      if (k < 1) requestAnimationFrame(step); else T.tween = null;
    }
    requestAnimationFrame(step);
  }

  function deviceView(def) {
    var p = new THREE.Vector3().fromArray(def.pos);
    var loc = locDef(def.location);
    if (def.location === 'booth' || def.location === 'rack') {
      // 좁은 방 안: 장소 시점에서 그 장비를 바라봄
      return { pos: loc.view.pos, target: p.toArray() };
    }
    var size = (T.devs[def.id] && new THREE.Box3().setFromObject(T.devs[def.id].group).getSize(new THREE.Vector3())) || new THREE.Vector3(0.4, 0.4, 0.4);
    var maxDim = Math.max(size.x, size.y, size.z);
    var dist = Math.max(1.6, Math.min(4.2, maxDim * 6));
    var yaw = (def.yawDeg || 0) * DEG;
    var fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    var cam = p.clone().add(fwd.multiplyScalar(dist));
    if (def.location === 'pulpit') cam.y = def.pos[1] + 0.55;
    else cam.y = def.pos[1] > 2.5 ? Math.max(1.7, def.pos[1] - 1.4) : def.pos[1] + Math.max(0.6, dist * 0.45);
    cam.y = Math.min(4.9, Math.max(0.5, cam.y));
    return { pos: cam.toArray(), target: p.toArray() };
  }

  /* ---------------------------------------------------------------- 선택·강조 */
  // 선택 표시: 장비 색은 그대로 두고 주황 테두리 상자만 켭니다(어두운 장비가 밝게 바래 보이지 않도록).
  function highlight(id, on, level) {
    var dv = T.devs[id]; if (!dv || !dv.outline) return;
    dv.outline.visible = !!on;
    dv.outline.material.opacity = level === 'group' ? 0.55 : 0.95;
  }

  function clearSelection() {
    if (T.sel) highlight(T.sel, false);
    if (T.selLoc) DATA.devices.forEach(function (d) { if (d.location === T.selLoc) highlight(d.id, false); });
    Object.keys(T.labelById).forEach(function (k) { T.labelById[k].classList.remove('sel'); });
    document.querySelectorAll('.g3t-chip.sel, .g3t-place.sel').forEach(function (b) { b.classList.remove('sel'); });
    T.sel = null; T.selLoc = null; T.selRoute = null;
    highlightRoutes(null);
  }

  function select(id, opts) {
    var def = devDef(id); if (!def) return;
    if (T.mode !== 'tour') setMode('tour');
    clearSelection();
    T.sel = id;
    if (def.pos) {
      highlight(id, true);
      var v = deviceView(def);
      if (!(opts && opts.noFly)) flyTo(v.pos, v.target);
    }
    var lb = T.labelById[id] || T.labelById['loc:' + def.location];
    if (lb) lb.classList.add('sel');
    occLast = '';
    if (T.showCables) highlightRoutes(routesFor(id));
    var chip = document.querySelector('.g3t-chip[data-id="' + id + '"]'); if (chip) chip.classList.add('sel');
    showDeviceCard(def);
  }

  function goLocation(lid) {
    var l = locDef(lid); if (!l) return;
    if (T.mode !== 'tour') setMode('tour');
    clearSelection();
    T.selLoc = lid;
    if (lid !== 'overview') DATA.devices.forEach(function (d) { if (d.location === lid && !d.decor) highlight(d.id, true, 'group'); });
    var lb = T.labelById['loc:' + lid]; if (lb) lb.classList.add('sel');
    var b = document.querySelector('.g3t-place[data-loc="' + lid + '"]'); if (b) b.classList.add('sel');
    if (lid === 'cables') { if (!T.showCables) setCablesVisible(true); highlightRoutes(DATA.cableRoutes || [], 0.085); }
    flyTo(l.view.pos, l.view.target);
    if (lid === 'overview') closeCard(); else showLocationCard(l);
  }

  /* ---------------------------------------------------------------- 정보 카드 */
  function linkLine(lk, dir) {
    var other = dir === 'in' ? lk.from : lk.to;
    var port = dir === 'in' ? (lk.fromPort ? devName(lk.from) + ' ' + lk.fromPort : devName(lk.from)) : (lk.fromPort ? lk.fromPort + ' → ' + devName(lk.to) : devName(lk.to));
    var unk = lk.verify === 'unknown' ? ' <span class="g3t-unk">미확인</span>' : '';
    var note = lk.note ? '<span class="g3t-note">' + esc(lk.note) + '</span>' : '';
    return '<li><button type="button" class="g3t-link" data-go="' + esc(other) + '">' + esc(port) + '</button>' +
      ' <span class="g3t-medium">' + esc(lk.label || '') + '</span>' + unk + note + '</li>';
  }

  function cl5ChannelText(ch) {
    var nm = null;
    try { if (typeof CL5_DEFAULT_NAMES !== 'undefined') nm = CL5_DEFAULT_NAMES['ch' + ch]; } catch (e) { nm = null; }
    return 'CL5 채널 ' + ch + (nm ? ' (' + nm + ')' : '');
  }

  function showDeviceCard(def) {
    var card = $('g3tCard'); if (!card) return;
    var ins = DATA.links.filter(function (l) { return l.to === def.id; });
    var outs = DATA.links.filter(function (l) { return l.from === def.id; });
    var loc = locDef(def.location);
    var h = '';
    h += '<div class="g3t-card-head"><div><div class="g3t-card-title">' + esc(def.name) + '</div>';
    h += '<div class="g3t-card-sub">' + esc([def.model, loc ? loc.name : '위치 미확인', def.mount].filter(Boolean).join(' · ')) + '</div></div>';
    h += '<button type="button" class="g3t-close" aria-label="닫기">×</button></div>';
    if (!def.pos) h += '<p class="g3t-warn">위치를 아직 모릅니다. 그래서 3D 화면에는 놓지 않았습니다.</p>';
    if (def.role) h += '<p class="g3t-role">' + esc(def.role) + '</p>';
    if (def.cl5Channel) h += '<p class="g3t-meta">' + esc(cl5ChannelText(def.cl5Channel)) + '</p>';
    if (ins.length) h += '<div class="g3t-sec">신호가 들어오는 곳</div><ul class="g3t-links">' + ins.map(function (l) { return linkLine(l, 'in'); }).join('') + '</ul>';
    else if (DATA.feedUnknown && DATA.feedUnknown.indexOf(def.id) >= 0) h += '<div class="g3t-sec">신호가 들어오는 곳</div><p class="g3t-meta"><span class="g3t-unk">미확인</span> 어느 앰프에서 신호를 받는지 아직 확인하지 못했습니다.</p>';
    if (outs.length) h += '<div class="g3t-sec">신호가 나가는 곳</div><ul class="g3t-links">' + outs.map(function (l) { return linkLine(l, 'out'); }).join('') + '</ul>';
    else if (DATA.outUnknown && DATA.outUnknown[def.id]) h += '<div class="g3t-sec">신호가 나가는 곳</div><p class="g3t-meta"><span class="g3t-unk">미확인</span> ' + esc(DATA.outUnknown[def.id]) + '</p>';
    if (def.channels) h += '<p class="g3t-meta">입력 ' + def.channels + '채널 (XLR, 위아래 ' + (def.rows || 2) + '줄)</p>';
    h += cableListHtml(routesFor(def.id), '케이블 길');
    if (def.id === 'stagebox' && DATA.rackUnconfirmed && DATA.rackUnconfirmed.length) {
      h += '<div class="g3t-sec">같은 랙에 있는 다른 장비 (모델 확인 필요)</div><ul class="g3t-plain">' + DATA.rackUnconfirmed.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
    }
    card.innerHTML = h;
    card.hidden = false;
  }

  function showLocationCard(l) {
    var card = $('g3tCard'); if (!card) return;
    if (l.id === 'cables') {
      var hh = '<div class="g3t-card-head"><div><div class="g3t-card-title">' + esc(l.name) + '</div>';
      hh += '<div class="g3t-card-sub">경로 ' + (DATA.cableRoutes || []).length + '개' + (DATA.cableDraft ? ' · Claude 가 예상해서 그린 경로 (확인 전)' : '') + '</div></div><button type="button" class="g3t-close" aria-label="닫기">×</button></div>';
      ['dante', 'speaker', 'mic'].forEach(function (k) {
        hh += cableListHtml((DATA.cableRoutes || []).filter(function (r) { return r.kind === k; }), CABLE_KIND[k].name).replace(/ <span class="g3t-draft">예상 · 확인 전<\/span>/, '');
      });
      card.innerHTML = hh; card.hidden = false;
      return;
    }
    var devs = DATA.devices.filter(function (d) { return d.location === l.id && !d.decor; });
    var h = '<div class="g3t-card-head"><div><div class="g3t-card-title">' + esc(l.name) + '</div>';
    h += '<div class="g3t-card-sub">장비 ' + devs.length + '개</div></div><button type="button" class="g3t-close" aria-label="닫기">×</button></div>';
    h += '<ul class="g3t-links">' + devs.map(function (d) {
      return '<li><button type="button" class="g3t-link" data-go="' + esc(d.id) + '">' + esc(d.name) + '</button> <span class="g3t-medium">' + esc(d.model || '') + '</span></li>';
    }).join('') + '</ul>';
    if (l.id === 'rack' && DATA.rackUnconfirmed) {
      h += '<div class="g3t-sec">사진에는 있지만 모델을 아직 확인하지 못한 장비</div><ul class="g3t-plain">' + DATA.rackUnconfirmed.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
    }
    card.innerHTML = h;
    card.hidden = false;
  }

  function closeCard() {
    var card = $('g3tCard'); if (card) card.hidden = true;
  }

  /* ---------------------------------------------------------------- 목록 */
  function renderList() {
    var places = $('g3tPlaces'), list = $('g3tList');
    if (!places || !list) return;
    places.innerHTML = DATA.locations.map(function (l) {
      return '<button type="button" class="g3t-place" data-loc="' + esc(l.id) + '">' + esc(l.name) + '</button>';
    }).join('');
    var groups = DATA.locations.filter(function (l) { return l.id !== 'overview'; }).map(function (l) {
      var devs = DATA.devices.filter(function (d) { return d.location === l.id && !d.decor; });
      if (!devs.length) return '';
      return '<div class="g3t-group"><div class="g3t-group-name">' + esc(l.name) + '</div><div class="g3t-chips">' +
        devs.map(function (d) { return '<button type="button" class="g3t-chip" data-id="' + esc(d.id) + '">' + esc(d.name) + '<small>' + esc(d.model || '') + '</small></button>'; }).join('') +
        '</div></div>';
    }).join('');
    var unplaced = DATA.devices.filter(function (d) { return !d.pos && !d.decor; });
    if (unplaced.length) {
      groups += '<div class="g3t-group"><div class="g3t-group-name">위치 미확인</div><div class="g3t-chips">' +
        unplaced.map(function (d) { return '<button type="button" class="g3t-chip g3t-chip-unk" data-id="' + esc(d.id) + '">' + esc(d.name) + '<small>' + esc(d.model || '') + '</small></button>'; }).join('') +
        '</div></div>';
    }
    list.innerHTML = groups;
  }

  /* ---------------------------------------------------------------- 화면 틀 */
  function setupUI() {
    var tab = $('tab2'); var wrap = $('canvas3dWrap');
    if (!tab || !wrap || $('g3tCard')) return; // 한 번만
    T.mode = loadMode();

    // 3D 화면 위 정보 카드
    var card = document.createElement('div');
    card.id = 'g3tCard'; card.className = 'g3t-card'; card.hidden = true;
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-live', 'polite');
    ['pointerdown', 'click', 'dblclick', 'wheel'].forEach(function (ev) {
      card.addEventListener(ev, function (e) { e.stopPropagation(); }, ev === 'wheel' ? { passive: true } : false);
    });
    card.addEventListener('click', function (e) {
      if (e.target.closest('.g3t-close')) { clearSelection(); closeCard(); return; }
      var rtb = e.target.closest('[data-route]'); if (rtb) { selectRoute(rtb.dataset.route); return; }
      var go = e.target.closest('[data-go]'); if (go) select(go.dataset.go);
    });
    wrap.appendChild(card);

    var panel = $('g3tPanel');
    if (panel && DATA.cableRoutes) {
      var bar = document.createElement('div');
      bar.id = 'g3tCableBar'; bar.className = 'g3t-cable-bar';
      bar.innerHTML = '<button type="button" class="g3t-cable-toggle" aria-pressed="true">케이블 경로 숨기기</button>' +
        Object.keys(CABLE_KIND).map(function (k) { return '<span class="g3t-legend"><span class="g3t-swatch" style="background:' + CABLE_KIND[k].css + '"></span>' + CABLE_KIND[k].name + '</span>'; }).join('') +
        (DATA.cableDraft ? '<span class="g3t-draft">Claude 가 예상해서 그린 경로 · 확인 전</span>' : '');
      panel.insertBefore(bar, panel.firstChild);
      bar.querySelector('.g3t-cable-toggle').addEventListener('click', function () { setCablesVisible(!T.showCables); if (!T.showCables) highlightRoutes(null); });
    }
    if (panel) {
      panel.addEventListener('click', function (e) {
        var p = e.target.closest('.g3t-place'); if (p) { goLocation(p.dataset.loc); return; }
        var c = e.target.closest('.g3t-chip'); if (c) select(c.dataset.id);
      });
    }
    document.querySelectorAll('.g3-modebar [data-mode]').forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.dataset.mode); });
    });

    // 둘러보기 모드에서는 실습용 클릭을 막고 둘러보기 클릭으로 처리합니다(캡처 단계).
    var down = null;
    wrap.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; }, true);
    wrap.addEventListener('click', function (e) {
      if (T.mode !== 'tour') return;
      if (e.target.closest('.g3t-label') || e.target.closest('.g3t-card')) return; // 각자 처리
      e.stopPropagation();
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return; // 드래그(회전)였음
      onTourClick(e);
    }, true);
    wrap.addEventListener('dblclick', function (e) { if (T.mode === 'tour') e.stopPropagation(); }, true);
    window.addEventListener('keydown', function (e) {
      if (T.mode !== 'tour') return;
      var t = $('tab2'); if (!t || !t.classList.contains('active')) return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      var k = e.key;
      var practiceKey = /^(Arrow(Up|Down|Left|Right)|PageUp|PageDown|q|Q|e|E|r|R|f|F)$/.test(k) || ((e.ctrlKey || e.metaKey) && /^[zZyY]$/.test(k));
      if (k === 'Escape') { e.stopPropagation(); clearSelection(); closeCard(); return; }
      if (practiceKey) e.stopPropagation(); // 실습 모드 키보드 조작이 숨은 장비를 움직이지 않도록
    }, true);

    applyMode(true);
  }

  function onTourClick(e) {
    var G = g3(); if (!G || !T.root) return;
    var rect = $('canvas3dWrap').getBoundingClientRect();
    var mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    var rc = new THREE.Raycaster(); rc.setFromCamera(mouse, G.camera);
    var targets = Object.keys(T.devs).map(function (id) { return T.devs[id].group; });
    var hits = rc.intersectObjects(targets.concat([G.modelRoot]), true).filter(function (h) {
      for (var q = h.object; q; q = q.parent) if (!q.visible) return false; // 숨긴 세부/대체 모델은 무시
      return true;
    });
    if (!hits.length) return;
    var o = hits[0].object;
    while (o && !o.userData.tourId) o = o.parent;
    if (!o) return; // 건물 벽에 먼저 맞음
    var def = devDef(o.userData.tourId);
    if (def.decor) goLocation(def.location); else select(def.id, { noFly: false });
  }

  /* ---------------------------------------------------------------- 이름표 가림 처리 */
  // 벽 뒤에 있는 이름표는 흐리게 하고 누를 수 없게 합니다(카메라가 움직였을 때만 계산).
  var occLast = '';
  var occRay = null;
  function updateOcclusion() {
    var G = g3();
    if (!T.built || T.mode !== 'tour' || !G || !G.camera || !G.modelRoot) return;
    var tab = $('tab2'); if (!tab || !tab.classList.contains('active')) return;
    var key = G.camera.position.toArray().map(function (v) { return v.toFixed(2); }).join(',') + '|' + G.controls.target.toArray().map(function (v) { return v.toFixed(2); }).join(',');
    if (key === occLast) return;
    occLast = key;
    occRay = occRay || new THREE.Raycaster();
    var cam = G.camera.position;
    var wrap = $('canvas3dWrap'); var W = wrap.clientWidth, H = wrap.clientHeight;
    var items = [];
    T.labels.forEach(function (o) {
      var wp = o.getWorldPosition(new THREE.Vector3());
      var dir = wp.clone().sub(cam); var dist = dir.length(); dir.normalize();
      occRay.set(cam, dir); occRay.far = dist;
      var hit = occRay.intersectObject(G.modelRoot, true);
      var occ = hit.length > 0 && hit[0].distance < dist - 0.35;
      o.element.classList.toggle('occ', occ);
      var sp = wp.clone().project(G.camera);
      items.push({ el: o.element, occ: occ, dist: dist, x: (sp.x + 1) / 2 * W, y: (1 - sp.y) / 2 * H, front: sp.z < 1,
        pri: o.element.classList.contains('sel') ? 0 : (o.element.classList.contains('g3t-label-loc') ? 1 : 2) });
    });
    // 이름표끼리 겹치면 가까운 것·장소 이름표·선택된 것을 남기고 나머지는 숨김
    items.sort(function (a, b) { return (a.occ - b.occ) || (a.pri - b.pri) || (a.dist - b.dist); });
    var shown = [];
    items.forEach(function (it) {
      var w = (it.el.offsetWidth || 60) + 4, h = (it.el.offsetHeight || 18) + 2;
      var r = [it.x - w / 2, it.y - h / 2, it.x + w / 2, it.y + h / 2];
      var clash = it.front && shown.some(function (q) { return r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]; });
      it.el.classList.toggle('clut', clash);
      if (!clash && it.front) shown.push(r);
    });
  }

  /* ---------------------------------------------------------------- 세부 모델 전환 */
  var LOD_NEAR = 6; // m
  function updateLOD() {
    var G = g3();
    if (!T.built || T.mode !== 'tour' || !G || !G.camera) return;
    var cam = G.camera.position, wp = new THREE.Vector3();
    Object.keys(T.devs).forEach(function (id) {
      var dv = T.devs[id]; if (!dv.lod) return;
      dv.group.getWorldPosition(wp);
      var near = wp.distanceTo(cam) < LOD_NEAR;
      dv.lod.inner.visible = near; dv.lod.proxy.visible = !near;
    });
  }

  /* ---------------------------------------------------------------- 시작 */
  function start() {
    if (!DATA || !window.THREE) return;
    setupUI();
    setInterval(tryBuild, 250);
    setInterval(updateOcclusion, 350);
    setInterval(updateLOD, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  /* ---------------------------------------------------------------- API (테스트용) */
  T.setMode = setMode;
  T.getMode = function () { return T.mode; };
  T.select = select;
  T.goLocation = goLocation;
  T.isBuilt = function () { return T.built; };
  T.devices = function () { return Object.keys(T.devs); };
  T.updateLOD = updateLOD;
  T.selectRoute = selectRoute;
  T.setCablesVisible = setCablesVisible;
  T.routesFor = routesFor;
  T.setCamera = setCamera;
  T.getView = function () {
    var G = g3(); if (!G || !G.camera) return null;
    return { pos: G.camera.position.toArray(), target: G.controls.target.toArray(), tweening: !!T.tween };
  };
  T.screenPos = function (id) {
    var G = g3(), dv = T.devs[id]; if (!G || !dv) return null;
    var bb = new THREE.Box3().setFromObject(dv.group); var c = bb.getCenter(new THREE.Vector3());
    c.project(G.camera);
    var rect = $('canvas3dWrap').getBoundingClientRect();
    return { x: rect.left + (c.x + 1) / 2 * rect.width, y: rect.top + (1 - c.y) / 2 * rect.height, z: c.z };
  };
  window.SanctuaryTour = T;
})();
