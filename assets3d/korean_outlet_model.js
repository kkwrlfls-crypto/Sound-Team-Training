/*
 * 한국 벽 콘센트 — 매립형 2구 접지 콘센트 (220V 60Hz, 16A 250V) — Sound-Team-Training 3D 에셋 단계 8/8
 *  - Three.js r128 전역 THREE, 단위 m, 전역 window.KoreanOutlet
 *
 * 근거
 *  - 한국 콘센트 = CEE 7/3 (Schuko, Type F) 계열: 둥근 오목부 깊이 17.5mm(공식, CEE 7), 핀 구멍 2개(간격 19mm, 핀 Ø4.8 x 19 를 받음),
 *    오목부 위·아래 접지 클립(플러그 핀보다 먼저 접지가 닿는 구조)
 *  - 매립 2구 콘센트 판매 사양: 120 x 70mm, AC 250V 16A
 *  - 한국 전원: 220V 60Hz
 *  - 판 두께·모서리, 오목부 지름 39mm, 두 구 간격, 핀 구멍 지름, 접지 클립 크기는 추정 — README 참조
 *
 * 좌표: 원점 = 벽면 위 판 뒷면 중심, +Z = 벽에서 방 쪽(바깥), +Y 위, +X = 정면에서 볼 때 오른쪽
 * 단자 기준점: 각 구의 오목부 입구 중심(판 앞면), +Z 바깥, +Y 키(위쪽 접지 클립 쪽)
 */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { console.error('[KoreanOutlet] THREE(r128) 가 먼저 로드되어야 합니다.'); return; }
  var NS = 'krOutlet', MM = 0.001, V3 = THREE.Vector3;

  var PLATE = { w: 70.0, h: 120.0, t: 9.0, r: 7.0, bevel: 1.6 };                 // 판매 사양 120 x 70 / 두께·라운드 추정
  var SOCK = {
    centersY: [28.5, -28.5], recessD: 39.0, recessDepth: 17.5,                     // 깊이 = 공식(CEE 7), 지름·간격 추정
    pinHole: { d: 5.2, dx: 9.5, depth: 21.0 },                                      // 간격 19 = 공식, 구멍 지름·깊이 추정 (핀 19mm 수용)
    clip: { w: 6.0, rIn: 16.15, d0: 2.0, d1: 15.0 },                                // 위·아래 접지 클립 (추정): 플러그 홈(폭 8, 바닥 r15.6) 안으로 들어감
    insertDepthMM: 17.5                                                             // 플러그 앞면이 오목부 바닥(17.5)에 닿을 때까지 들어감
  };
  var ELEC = { nominalV: 220, frequencyHz: 60, ratedA: 16, ratedV: 250, earthed: true };

  function hide(t, k, v) { Object.defineProperty(t, k, { value: v, enumerable: false, writable: true, configurable: true }); return v; }
  function mk(geo, mat, name, opt) { geo.scale(MM, MM, MM); var m = new THREE.Mesh(geo, mat); m.name = NS + '.' + name; var o = opt || {}; m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false; return m; }
  function grp(name) { var g = new THREE.Group(); g.name = NS + '.' + name; return g; }
  function rrect(p, cx, cy, w, h, r) { var x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2; r = Math.min(r, w / 2, h / 2);
    p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r); p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
    p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0); return p; }
  function circ(p, cx, cy, r, cw) { p.absarc(cx, cy, r, 0, Math.PI * 2, !!cw); return p; }
  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return {
      plate: new S({ color: 0xf1f0ec, roughness: 0.42, metalness: 0.0 }),
      inner: new S({ color: 0xe6e5e0, roughness: 0.55, metalness: 0.0 }),
      recessWall: new S({ color: 0xdedcd6, roughness: 0.6, metalness: 0.0, side: THREE.BackSide }),
      holeWall: new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.BackSide }),
      holeBottom: new THREE.MeshBasicMaterial({ color: 0x0a0a0a }),
      metal: new S({ color: 0xc8cacd, roughness: 0.28, metalness: 0.95 }),
      brass: new S({ color: 0xb79c5c, roughness: 0.3, metalness: 0.9 }),
      print: new S({ color: 0xffffff, roughness: 0.6, transparent: true, alphaTest: 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      box: new S({ color: 0x55585c, roughness: 0.6, metalness: 0.3 })
    };
  }
  function printTexture() {
    var s = 8, W = PLATE.w, H = PLATE.h, c = document.createElement('canvas'); c.width = W * s; c.height = H * s; var g = c.getContext('2d');
    g.fillStyle = '#9a9894'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '600 ' + 2.6 * s + 'px Arial, sans-serif'; g.fillText('16A 250V~', W / 2 * s, (H / 2) * s);
    // 접지 기호 (두 구 사이)
    var cx = W / 2 * s, cy = (H / 2 + 4.6) * s; g.strokeStyle = '#9a9894'; g.lineWidth = 0.5 * s; g.beginPath();
    g.moveTo(cx, cy - 2.2 * s); g.lineTo(cx, cy); g.moveTo(cx - 2.2 * s, cy); g.lineTo(cx + 2.2 * s, cy); g.moveTo(cx - 1.4 * s, cy + 0.9 * s); g.lineTo(cx + 1.4 * s, cy + 0.9 * s); g.moveTo(cx - 0.6 * s, cy + 1.8 * s); g.lineTo(cx + 0.6 * s, cy + 1.8 * s); g.stroke();
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }

  // 한 구: 오목부(벽·바닥), 핀 구멍 2개(접점 슬리브), 위·아래 접지 클립. 로컬 z=0 = 판 앞면, 오목부는 -Z 로
  function buildSocket(M, name) {
    var S = SOCK, g = grp(name), R = S.recessD / 2, bot = -S.recessDepth;
    g.add(mk(new THREE.CylinderGeometry(R, R, S.recessDepth, 64, 1, true).rotateX(Math.PI / 2).translate(0, 0, -S.recessDepth / 2), M.recessWall, name + '.recessWall', { cast: false }));
    var fl = circ(new THREE.Shape(), 0, 0, R); [-1, 1].forEach(function (sg) { fl.holes.push(circ(new THREE.Path(), sg * S.pinHole.dx, 0, S.pinHole.d / 2, true)); });
    g.add(mk(new THREE.ShapeGeometry(fl, 48).translate(0, 0, bot), M.inner, name + '.recessFloor', { cast: false }));
    [-1, 1].forEach(function (sg) { var id = sg < 0 ? 'Left' : 'Right', x = sg * S.pinHole.dx, ph = S.pinHole;
      g.add(mk(new THREE.CylinderGeometry(ph.d / 2, ph.d / 2, ph.depth, 24, 1, true).rotateX(Math.PI / 2).translate(x, 0, bot - ph.depth / 2), M.holeWall, name + '.pinHole' + id + 'Wall', { cast: false, receive: false }));
      g.add(mk(new THREE.CircleGeometry(ph.d / 2, 24).translate(x, 0, bot - ph.depth), M.holeBottom, name + '.pinHole' + id + 'Bottom', { cast: false }));
      g.add(mk(new THREE.CylinderGeometry(ph.d / 2 - 0.05, ph.d / 2 - 0.05, 10, 24, 1, true).rotateX(Math.PI / 2).translate(x, 0, bot - 6 - 5), M.brass, name + '.contact' + id, { cast: false, receive: false })); // 핀을 잡는 접점(구멍 안)
    });
    // 접지 클립: 오목부 벽에서 안쪽으로 튀어나온 판 (위·아래)
    [1, -1].forEach(function (sg) { var c = S.clip, th = R - c.rIn, L = c.d1 - c.d0;
      var cb = mk(new THREE.BoxGeometry(c.w, th, L), M.metal, name + '.earthClip' + (sg > 0 ? 'Top' : 'Bottom'));
      cb.position.set(0, sg * (c.rIn + th / 2) * MM, -(c.d0 + L / 2) * MM); g.add(cb);
      var lip = mk(new THREE.BoxGeometry(c.w, 0.8, 1.6), M.metal, name + '.earthClipLip' + (sg > 0 ? 'Top' : 'Bottom')); lip.position.set(0, sg * (R - 0.4) * MM, -(c.d0 - 0.8) * MM); g.add(lip);
    });
    g.userData.faceMM = 0; return g;
  }

  function create(options) {
    var o = options || {}, M = makeMaterials(), root = new THREE.Group(); root.name = NS + 'Root' + (o.name ? '.' + o.name : '');
    var parts = {}, ports = {};
    // 판: 둥근 사각 + 구멍 2개(오목부), 모서리 경사
    var P = PLATE, sh = rrect(new THREE.Shape(), 0, 0, P.w, P.h, P.r);
    SOCK.centersY.forEach(function (y) { sh.holes.push(circ(new THREE.Path(), 0, y, SOCK.recessD / 2, true)); });
    var plate = mk(new THREE.ExtrudeGeometry(sh, { depth: P.t - 2 * P.bevel, bevelEnabled: true, bevelThickness: P.bevel, bevelSize: P.bevel, bevelOffset: -P.bevel, bevelSegments: 4, curveSegments: 48 }).translate(0, 0, P.bevel), M.plate, 'plate'); // z 0(벽) ~ t(앞면)
    root.add(plate); parts.plate = plate;
    var faceZ = P.t;
    // 벽 속 매립 박스 (앞이 열린 상자, 판 뒤) — 오목부·핀 구멍이 벽 안으로 들어가는 공간
    var BB = { w: 58, h: 108, d: 40 }, bb = grp('wallBox');
    [[BB.w, BB.h, 1, 0, 0, -BB.d], [1, BB.h, BB.d, -BB.w / 2, 0, -BB.d / 2], [1, BB.h, BB.d, BB.w / 2, 0, -BB.d / 2], [BB.w, 1, BB.d, 0, -BB.h / 2, -BB.d / 2], [BB.w, 1, BB.d, 0, BB.h / 2, -BB.d / 2]].forEach(function (q, i) {
      bb.add(mk(new THREE.BoxGeometry(q[0], q[1], q[2]).translate(q[3], q[4], q[5]), M.box, 'wallBox.side' + (i + 1), { cast: false })); });
    root.add(bb); parts.wallBox = bb;
    var pr = mk(new THREE.PlaneGeometry(P.w, P.h), new THREE.MeshStandardMaterial({ map: printTexture(), transparent: true, alphaTest: 0.1, depthWrite: false, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 'print', { cast: false });
    pr.position.z = (faceZ + 0.02) * MM; root.add(pr);
    SOCK.centersY.forEach(function (y, i) {
      var id = i === 0 ? 'socketUpper' : 'socketLower', s = buildSocket(M, id);
      s.position.set(0, y * MM, faceZ * MM); root.add(s); parts[id] = s;
      ports[id] = { part: s, type: 'cee7-3-socket', role: 'power-source', accepts: ['cee7-7-plug', 'cee7-4-plug'], insertDepthMM: SOCK.insertDepthMM };
    });
    // 기준점
    var anchors = grp('portAnchors'); root.add(anchors); root.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    Object.keys(ports).forEach(function (id) {
      var p = ports[id], q = new THREE.Quaternion(); p.part.getWorldQuaternion(q);
      var n = new V3(0, 0, 1).applyQuaternion(q).normalize(), key = new V3(0, 1, 0).applyQuaternion(q).normalize(), pos = new V3(0, 0, 0).applyMatrix4(p.part.matrixWorld).applyMatrix4(inv);
      var X = new V3().crossVectors(key, n), a = new THREE.Object3D(); a.name = NS + '.port.' + id; a.position.copy(pos); a.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, key, n));
      a.userData = { portId: id, type: p.type, role: p.role, accepts: p.accepts.slice(), insertDepthMM: p.insertDepthMM, localPosition: pos.clone(), localNormal: n.clone(), insertDirection: n.clone().negate(), keyDirection: key.clone(),
        recessDepthMM: SOCK.recessDepth, recessDiameterMM: SOCK.recessD, pinPitchMM: SOCK.pinHole.dx * 2, reversible: true, partName: p.part.name };
      anchors.add(a); ports[id] = a;
    });
    var state = { breaker: o.breakerOn !== false };
    var api = {
      setBreaker: function (on) { state.breaker = !!on; return api; },
      getState: function () { return { breaker: state.breaker, live: state.breaker, nominalV: ELEC.nominalV, frequencyHz: ELEC.frequencyHz, ratedA: ELEC.ratedA }; },
      getElectrical: function () { return JSON.parse(JSON.stringify(ELEC)); }
    };
    root.userData[NS] = { api: api }; hide(root.userData[NS], 'parts', parts); hide(root.userData[NS], 'ports', ports);
    root.userData.info = { model: '매립형 2구 접지 콘센트 (한국, CEE 7/3 계열)', dimensionsMM: { w: P.w, h: P.h, protrusion: faceZ }, electrical: ELEC, units: 'm' };
    return root;
  }
  function findAnchor(root, id) { return root.getObjectByName(NS + '.port.' + id); }
  function getPortInfo(root, id) {
    var a = findAnchor(root, id); if (!a) return null; root.updateWorldMatrix(true, true);
    var u = a.userData, wp = new V3(), wq = new THREE.Quaternion(); a.getWorldPosition(wp); a.getWorldQuaternion(wq);
    var wn = new V3(0, 0, 1).applyQuaternion(wq).normalize(), wk = new V3(0, 1, 0).applyQuaternion(wq).normalize(), ln = new V3().copy(u.localNormal);
    var scale = ln.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(root.matrixWorld)).length();
    return { id: u.portId, type: u.type, role: u.role, accepts: u.accepts.slice(), localPosition: new V3().copy(u.localPosition), localNormal: ln, keyDirectionLocal: new V3().copy(u.keyDirection),
      worldPosition: wp, worldNormal: wn, worldInsertDirection: wn.clone().negate(), worldKeyDirection: wk, worldQuaternion: wq, insertDepthMM: u.insertDepthMM, worldInsertDepth: u.insertDepthMM * MM * scale, worldScale: scale, anchor: a };
  }
  function getAllPorts(root) { var out = []; root.traverse(function (o) { if (o.userData && o.userData.portId && o.name.indexOf(NS + '.port.') === 0) out.push(getPortInfo(root, o.userData.portId)); }); return out; }
  // 전원 공급 여부: 차단기(분전반) 켜짐 → 이 콘센트의 모든 구가 220V
  function isLive(root, id) { var d = root.userData[NS]; return !!(d && d.api.getState().live && findAnchor(root, id)); }
  function toGear3dPortsLocal(root) { var o = {}; getAllPorts(root).forEach(function (p) { o[p.id] = { pos: p.localPosition.toArray(), normal: p.localNormal.toArray(), type: p.type }; }); return o; }

  window.KoreanOutlet = { NAMESPACE: NS, PLATE_MM: PLATE, SOCKET_MM: SOCK, ELECTRICAL: ELEC, create: create, getPortInfo: getPortInfo, getAllPorts: getAllPorts, isLive: isLive, toGear3dPortsLocal: toGear3dPortsLocal };
})();
