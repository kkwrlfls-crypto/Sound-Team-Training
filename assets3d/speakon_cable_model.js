/*
 * speakON 스피커 케이블 (NL4FX 형 케이블 커넥터 ↔ NL4FX 형) — Sound-Team-Training 3D 에셋 단계 6/8
 *  - Three.js r128 전역 THREE 사용, 단위 m
 *  - 전역 네임스페이스: window.SpeakonCable (기존 코드와 이름 충돌 없음, XlrCable 과 독립)
 *
 * 형상 근거
 *  - Neutrik NL4FX 공식: 4극 케이블 커넥터, Quick Lock 래치, 케이블 외경 7~14.5mm, 접점 40A, 일체형 척
 *  - 판매처 사양(Adam Hall NL4FX-2): 전장 76.5mm, 지름 26mm
 *  - 노즈 지름·길이, 키 홈, 접점 위치, 래치·부싱·부트 곡선은 추정 (5단계 ZX1 의 NL4MP 단자 치수에 맞춤) — README 참조
 *
 * 플러그 로컬 좌표 (1~5단계와 같은 규칙)
 *  - 원점 = 노즈 앞면 중심, 몸체는 +Z 로 뻗음, +Y = 키(래치) 방향
 *  - 꽂는 방향 = 로컬 -Z, 케이블 출구 = (0,0,전장)
 *  - 꽂은 직후 플러그 회전 = 단자 기준점 회전. 잠그면 단자 쪽을 바라보고 시계 방향 30° 더 돌아감(로컬 Z 축 -30°)
 *
 * 케이블 몸체: 위치 기반 동역학(PBD) 사슬 — 3단계 XLR 케이블과 같은 방식(구간 길이·최소 굽힘 반경·중력·바닥/상자 충돌·마찰)
 *  - 커넥터는 강체. 몸체만 매 업데이트마다 TubeGeometry 재생성
 */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { console.error('[SpeakonCable] THREE(r128) 가 먼저 로드되어야 합니다.'); return; }
  var NS = 'speakonCable', MM = 0.001, V3 = THREE.Vector3;

  // ---------------------------------------------------------------------------
  // 치수 (mm)
  var PLUG = {
    lengthMM: 76.5, bodyD: 26.0,                                          // 공식(판매처 사양): 전장 76.5, Ø26
    nose: { z1: 14.0, rOut: 10.6, rIn: 6.9, cavityFloor: 9.0 },           // 추정: ZX1 보어 Ø21.6 / 코어 Ø13 에 맞춤, 노즈 길이 = 삽입 깊이 14
    keyNotch: { rCut: 9.3, halfDeg: 14.8, zSplit: 5.0 },                   // 추정: 단자 키 리브(폭 5, 안쪽 r9.5)가 지나가는 홈 + 30° 회전용 옆 홈
    shell: { z0: 14.0, z1: 44.0, r: 13.0 }, ribs: { z0: 30.0, z1: 43.0, n: 12 },
    latch: { z0: 15.5, z1: 32.0, halfW: 3.6, h: 1.3 },                      // Quick Lock 래치 (추정)
    bushing: { z0: 44.0, z1: 54.0, r0: 12.6, r1: 11.6 },                   // 어두운 회색 부싱(공식: dark grey bushing), 치수 추정
    boot: { z0: 54.0, z1: 76.5, endR: 7.0 },
    contacts: [['1+', 70], ['1-', 170], ['2+', 250], ['2-', 350]]          // 플러그 프레임 각도(°). 잠그면 단자 접점(40/140/220/320)과 겹침
  };
  var LOCK = { deg: 30, direction: 'clockwise-facing-port' };
  var CABLE = { odMM: 10.0, minBendRadiusMM: 60, segMM: 30, cores: 2, coreAreaMM2: 2.5 }; // 2심 2.5mm² 스피커 케이블(추정), 굽힘 반경 ≈ 외경 6배(추정)

  // ---------------------------------------------------------------------------
  function hide(t, k, v) { Object.defineProperty(t, k, { value: v, enumerable: false, writable: true, configurable: true }); return v; }
  function mk(geo, mat, name, opt) { geo.scale(MM, MM, MM); var m = new THREE.Mesh(geo, mat); m.name = NS + '.' + name; var o = opt || {}; m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false; return m; }
  function grp(name) { var g = new THREE.Group(); g.name = NS + '.' + name; return g; }
  function lathe(pts, segs) { var g = new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), segs || 48); g.rotateX(Math.PI / 2); return g; }
  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return {
      shell: new S({ color: 0x0c0c0d, roughness: 0.55, metalness: 0.02 }),
      nose: new S({ color: 0x111113, roughness: 0.5, metalness: 0.02 }),
      latch: new S({ color: 0xa9adb3, roughness: 0.32, metalness: 0.85 }),
      bushing: new S({ color: 0x2a2c30, roughness: 0.6, metalness: 0.02 }),
      boot: new S({ color: 0x080809, roughness: 0.75, metalness: 0.0 }),
      contact: new S({ color: 0xd8d9dc, roughness: 0.25, metalness: 0.95 }),
      hole: new S({ color: 0x000000, roughness: 1.0, metalness: 0.0 }),
      cavity: new S({ color: 0x0a0a0b, roughness: 0.8, metalness: 0.0, side: THREE.BackSide }),
      jacket: new S({ color: 0x0b0b0c, roughness: 0.62, metalness: 0.0 }),
      print: new S({ color: 0xffffff, roughness: 0.6, transparent: true, alphaTest: 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    };
  }

  // 노즈 단면: 바깥 r=rOut 둘레에서 [a0,a1]° 구간만 r=rCut 로 깎인 고리
  function noseShape(a0, a1) {
    var N = PLUG.nose, K = PLUG.keyNotch, s = new THREE.Shape(), d = Math.PI / 180;
    var A0 = a0 * d, A1 = a1 * d;
    s.moveTo(Math.cos(A1) * N.rOut, Math.sin(A1) * N.rOut);
    s.absarc(0, 0, N.rOut, A1, A0 + Math.PI * 2, false);               // 홈 밖 둘레 (반시계)
    s.lineTo(Math.cos(A0) * K.rCut, Math.sin(A0) * K.rCut);
    s.absarc(0, 0, K.rCut, A0, A1, false);                              // 홈 바닥
    s.lineTo(Math.cos(A1) * N.rOut, Math.sin(A1) * N.rOut);
    s.holes.push(new THREE.Path().absarc(0, 0, N.rIn, 0, Math.PI * 2, true));
    return s;
  }
  function notchFront() { var k = PLUG.keyNotch.halfDeg; return [90 - k, 90 + k]; }
  function notchRear() { var k = PLUG.keyNotch.halfDeg; return [90 - k, 90 + LOCK.deg + k]; }

  // 단자 쪽 인쇄(핀 번호) — 노즈 안 접점 블록 면
  function contactDecal(M) {
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d'), R = PLUG.nose.rIn, s = 128 / R;
    g.fillStyle = '#e6e6e6'; g.font = '700 ' + Math.round(1.5 * s) + 'px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    // 앞(-Z)에서 볼 때 로컬 +X 는 화면 왼쪽
    PLUG.contacts.forEach(function (ct) { var a = ct[1] * Math.PI / 180, r = R - 2.0; g.fillText(ct[0], 128 - Math.cos(a) * r * s, 128 - Math.sin(a) * r * s); });
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; var mat = M.print.clone(); mat.map = t;
    var m = mk(new THREE.CircleGeometry(R - 0.05, 40), mat, 'contactPrint', { cast: false }); m.rotation.y = Math.PI; return m;
  }

  // ---------------------------------------------------------------------------
  // NL4FX 형 케이블 커넥터 (암, 4극)
  function buildPlugMesh(M, name) {
    var P = PLUG, N = P.nose, K = P.keyNotch, g = grp(name);
    var f = notchFront(), r = notchRear();
    g.add(mk(new THREE.ExtrudeGeometry(noseShape(f[0], f[1]), { depth: K.zSplit, bevelEnabled: false, curveSegments: 40 }), M.nose, name + '.noseFront'));
    g.add(mk(new THREE.ExtrudeGeometry(noseShape(r[0], r[1]), { depth: N.z1 - K.zSplit, bevelEnabled: false, curveSegments: 40 }).translate(0, 0, K.zSplit), M.nose, name + '.noseRear'));
    // 노즈 안 공간: 벽(안쪽 면) + 접점 블록 면
    g.add(mk(new THREE.CylinderGeometry(N.rIn, N.rIn, N.cavityFloor, 40, 1, true).rotateX(Math.PI / 2).translate(0, 0, N.cavityFloor / 2), M.cavity, name + '.cavityWall', { cast: false, receive: false }));
    var floor = mk(new THREE.CircleGeometry(N.rIn, 40), M.nose, name + '.cavityFloor', { cast: false }); floor.rotation.y = Math.PI; floor.position.z = N.cavityFloor * MM; g.add(floor);
    var dec = contactDecal(M); dec.position.z = (N.cavityFloor - 0.02) * MM; g.add(dec);
    P.contacts.forEach(function (ct) { var a = ct[1] * Math.PI / 180, rr = N.rIn - 0.2;
      var cb = mk(new THREE.BoxGeometry(2.2, 0.4, 6.0).translate(0, 0, 1.0 + 3.0), M.contact, name + '.contact' + ct[0].replace('+', 'P').replace('-', 'N'), { cast: false });
      cb.position.set(Math.cos(a) * rr * MM, Math.sin(a) * rr * MM, 0); cb.rotation.z = a - Math.PI / 2; g.add(cb); });
    // 몸체: 턱(단자 링에 닿는 면) → 원통 → 부싱 → 부트
    var sh = P.shell, sr = sh.r;
    g.add(mk(lathe([[N.rOut, sh.z0], [sr - 0.6, sh.z0], [sr, sh.z0 + 0.6], [sr, sh.z1 - 0.5], [sr - 0.4, sh.z1]], 56), M.shell, name + '.shell'));
    for (var i = 0; i < P.ribs.n; i++) { var ang = (i + 0.5) / P.ribs.n * Math.PI * 2; if (Math.abs(Math.sin(ang) - 1) < 0.08) continue;
      var rb = mk(new THREE.BoxGeometry(1.2, 0.6, P.ribs.z1 - P.ribs.z0).translate(0, 0, (P.ribs.z0 + P.ribs.z1) / 2), M.shell, name + '.rib' + (i + 1));
      rb.position.set(Math.cos(ang) * (sr + 0.2) * MM, Math.sin(ang) * (sr + 0.2) * MM, 0); rb.rotation.z = ang - Math.PI / 2; g.add(rb); }
    var L = P.latch, lt = grp(name + '.latch');
    var lat = new THREE.Shape(); lat.moveTo(-L.halfW, 0); lat.lineTo(L.halfW, 0); lat.lineTo(L.halfW, L.z1 - L.z0 - 3); lat.quadraticCurveTo(L.halfW, L.z1 - L.z0, 0, L.z1 - L.z0); lat.quadraticCurveTo(-L.halfW, L.z1 - L.z0, -L.halfW, L.z1 - L.z0 - 3); lat.closePath();
    var lg = new THREE.ExtrudeGeometry(lat, { depth: L.h, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2 }); lg.rotateX(Math.PI / 2); // 판(XY) → 몸체 위(XZ): 길이 +Z, 두께 -Y 방향
    var lm = mk(lg, M.latch, name + '.latchLever'); lm.position.set(0, (sr - 0.3 + L.h) * MM, L.z0 * MM); lt.add(lm);
    var tab = mk(new THREE.BoxGeometry(L.halfW * 2 - 1.4, 0.8, 2.4), M.latch, name + '.latchTab'); tab.position.set(0, (sr + L.h + 0.6) * MM, (L.z0 + 4) * MM); lt.add(tab);
    g.add(lt);
    var B = P.bushing; g.add(mk(lathe([[sr - 0.4, B.z0], [B.r0, B.z0 + 0.3], [B.r0, B.z0 + 3], [B.r1, B.z1 - 0.4], [B.r1 - 0.5, B.z1]], 48), M.bushing, name + '.bushing'));
    for (var k = 0; k < 8; k++) { var a2 = k / 8 * Math.PI * 2; var ns = mk(new THREE.BoxGeometry(1.1, 0.3, 5.0).translate(0, 0, B.z0 + 4.5), M.hole, name + '.bushingNotch' + (k + 1), { cast: false });
      var rr2 = B.r0 - (B.r0 - B.r1) * 0.45 - 0.05; ns.position.set(Math.cos(a2) * rr2 * MM, Math.sin(a2) * rr2 * MM, 0); ns.rotation.z = a2 - Math.PI / 2; g.add(ns); }
    var Bo = P.boot, Lb = Bo.z1 - Bo.z0, cr = CABLE.odMM / 2 + 0.1, r0 = B.r1 - 0.5;
    g.add(mk(lathe([[r0, Bo.z0], [r0 + 0.2, Bo.z0 + 0.1 * Lb], [r0 - 0.6, Bo.z0 + 0.45 * Lb], [Bo.endR + 1.2, Bo.z0 + 0.8 * Lb], [Bo.endR + 0.2, Bo.z1 - 0.6], [Bo.endR - 0.4, Bo.z1],
      [cr + 0.3, Bo.z1], [cr, Bo.z1 - 0.4], [cr, Bo.z1 - 8]], 48), M.boot, name + '.boot'));
    return g;
  }

  var PLUG_META = { type: 'speakon-nl4-cable-plug', model: 'NL4FX', matesWith: ['speakon-nl4-chassis', 'speakon-nl4'], lengthMM: PLUG.lengthMM, maxRadiusMM: PLUG.shell.r + PLUG.latch.h + 0.3 };

  function buildPlug(materials, name) {
    var M = materials || makeMaterials(), g = buildPlugMesh(M, name || 'plug');
    g.userData = { type: PLUG_META.type, lengthMM: PLUG.lengthMM, reference: {
      name: 'speakON 4극 케이블 커넥터(NL4FX 형)', type: PLUG_META.type, matesWith: PLUG_META.matesWith.slice(),
      localMatingPoint: new V3(0, 0, 0), localMatingDirection: new V3(0, 0, -1), localKeyDirection: new V3(0, 1, 0),
      localCableExit: new V3(0, 0, PLUG.lengthMM * MM), localCableDirection: new V3(0, 0, 1),
      contactsDeg: PLUG.contacts.map(function (c) { return { pin: c[0], deg: c[1] }; }), lockDeg: LOCK.deg, lockDirection: LOCK.direction } };
    g.traverse(function (o) { if (o.isMesh) o.userData.rigidPlugPart = true; });
    return g;
  }

  // ---------------------------------------------------------------------------
  // 장비 단자 정보 정규화 — 2단계 이후 형식(worldQuaternion·worldInsertDepth·accepts)과
  // 이전 형식(Crown XLi1500: 기준점 Object3D 만 있음)을 같은 모양으로 맞춤. 장비 코드는 건드리지 않음.
  function portInfo(api, root, id) {
    var p = api.getPortInfo(root, id); if (!p) return null;
    var out = { id: p.id, type: p.type, accepts: p.accepts || null, worldPosition: p.worldPosition.clone(), worldNormal: p.worldNormal.clone(), legacy: false };
    var q = p.worldQuaternion ? p.worldQuaternion.clone() : null;
    if (!q && p.anchor) { q = new THREE.Quaternion(); p.anchor.getWorldQuaternion(q); out.legacy = true; }
    out.worldQuaternion = q;
    out.worldKeyDirection = p.worldKeyDirection ? p.worldKeyDirection.clone() : new V3(0, 1, 0).applyQuaternion(q).normalize();
    if (p.worldInsertDepth !== undefined) { out.worldInsertDepth = p.worldInsertDepth; out.insertDepthMM = p.insertDepthMM; }
    else { // 이전 형식: 삽입 깊이 정보 없음 → 노즈 길이 사용, 장비 배율 반영
      var sc = new V3(); (p.anchor || root).getWorldScale(sc); out.insertDepthMM = PLUG.nose.z1; out.worldInsertDepth = PLUG.nose.z1 * MM * sc.x; out.legacy = true; }
    out.lockRotationDeg = (p.anchor && p.anchor.userData.lockRotationDeg) || LOCK.deg;
    return out;
  }
  function compatibility(port) {
    if (!port) return { ok: false, reason: '단자를 찾을 수 없음' };
    if (PLUG_META.matesWith.indexOf(port.type) < 0) return { ok: false, reason: PLUG_META.type + ' 는 ' + port.type + ' 단자에 꽂을 수 없음' };
    if (port.accepts && port.accepts.indexOf(PLUG_META.type) < 0) return { ok: false, reason: port.type + ' 단자가 ' + PLUG_META.type + ' 를 받지 않음' };
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // 케이블
  var ENDS = ['a', 'b'];
  function create(options) {
    var o = options || {};
    var lengthM = o.lengthM || 5.0, seg = (o.segmentMM || CABLE.segMM) * MM, r = (o.odMM || CABLE.odMM) / 2 * MM;
    var M = makeMaterials(); if (o.jacketColor !== undefined) M.jacket.color.set(o.jacketColor);
    var root = new THREE.Group(); root.name = NS + 'Root' + (o.name ? '.' + o.name : '');
    var plugs = { a: buildPlug(M, 'plugA'), b: buildPlug(M, 'plugB') };
    root.add(plugs.a); root.add(plugs.b);
    var body = new THREE.Mesh(new THREE.BufferGeometry(), M.jacket); body.name = NS + '.jacket'; body.castShadow = true; body.receiveShadow = true; root.add(body);
    var n = Math.max(8, Math.round(lengthM / seg)); seg = lengthM / n;
    var st = {
      lengthM: lengthM, seg: seg, n: n, r: r, M: M, plugs: plugs, body: body,
      minBendRadius: (o.minBendRadiusMM || CABLE.minBendRadiusMM) * MM,
      floorY: o.floorY !== undefined ? o.floorY : 0, colliders: (o.colliders || []).slice(), gravity: 9.81,
      ends: { a: { attach: null, free: null }, b: { attach: null, free: null } },
      nodes: null, prev: null, initialized: false, stats: null, route: o.route || null, nose: { a: null, b: null }
    };
    hide(root.userData, NS, st);
    root.userData.speakonCableInfo = { lengthM: lengthM, odMM: r * 2 / MM, segments: n, ends: ENDS.slice(), cores: CABLE.cores, coreAreaMM2: CABLE.coreAreaMM2 };
    return root;
  }
  function S(root) { var s = root && root.userData[NS]; if (!s) throw new Error('[SpeakonCable] 케이블 루트가 아닙니다'); return s; }
  function connect(root, end, deviceApi, deviceRoot, portId, opt) {
    if (ENDS.indexOf(end) < 0) return { ok: false, reason: '끝 이름은 a 또는 b' };
    var s = S(root), port = portInfo(deviceApi, deviceRoot, portId), c = compatibility(port);
    if (!c.ok) return c;
    var other = s.ends[end === 'a' ? 'b' : 'a'].attach;
    if (other && other.root === deviceRoot && other.portId === portId) return { ok: false, reason: '같은 단자에 두 끝을 꽂을 수 없음' };
    s.ends[end].attach = { api: deviceApi, root: deviceRoot, portId: portId, locked: !(opt && opt.locked === false) };
    s.ends[end].free = null;
    var dev = deviceRoot.userData && (deviceRoot.userData.evZx1 || null);
    if (dev && dev.api && dev.api.setConnection) dev.api.setConnection(portId, { cable: root.name, end: end });
    return { ok: true, port: port, legacyPort: port.legacy };
  }
  function disconnect(root, end, freePose) {
    var s = S(root), a = s.ends[end].attach;
    if (a) { var dev = a.root.userData && a.root.userData.evZx1; if (dev && dev.api && dev.api.setConnection) dev.api.setConnection(a.portId, null); }
    s.ends[end].attach = null; s.ends[end].free = freePose || null;
  }
  // 잠금: false → 꽂기만 한 상태(래치가 키 방향), true → 30° 돌려 잠금. 잠기지 않은 플러그는 실제로는 빠질 수 있음(isSecure 로 표시)
  function setLocked(root, end, locked) { var a = S(root).ends[end].attach; if (!a) return false; a.locked = !!locked; return true; }
  function setColliders(root, boxes) { S(root).colliders = boxes.slice(); }

  function seatedPose(s, end) {
    var a = s.ends[end].attach; if (!a) return null;
    var p = portInfo(a.api, a.root, a.portId);
    var q = p.worldQuaternion.clone();
    if (a.locked) q.multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), -p.lockRotationDeg * Math.PI / 180));
    return { position: p.worldPosition.clone().addScaledVector(p.worldNormal, -p.worldInsertDepth), quaternion: q, port: p, locked: a.locked };
  }
  function plugExitWorld(pose) { return new V3(0, 0, PLUG.lengthMM * MM).applyQuaternion(pose.quaternion).add(pose.position); }
  function plugAxisWorld(pose) { return new V3(0, 0, 1).applyQuaternion(pose.quaternion); }

  function resample(pts, n) {
    var cum = [0]; for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    var total = cum[cum.length - 1], out = [], j = 1;
    for (var k = 0; k <= n; k++) { var d = total * k / n; while (j < cum.length - 1 && cum[j] < d) j++;
      var t = (d - cum[j - 1]) / Math.max(cum[j] - cum[j - 1], 1e-12); out.push(pts[j - 1].clone().lerp(pts[j], Math.min(Math.max(t, 0), 1))); }
    return out;
  }
  // 초기 경로: 출구 → 접선 → 경유점 → … → 반대 출구. 남는 길이는 가장 긴 바닥 구간을 옆으로 굽혀 흡수
  function buildInitialPath(s, A, tA, B, tB, waypoints, freeEnd) {
    var lead = Math.min(0.08, s.lengthM * 0.05), pts = [A.clone(), A.clone().addScaledVector(tA, lead)], fy = s.floorY + s.r;
    var wp = (waypoints && waypoints.length) ? waypoints.map(function (w) { return w.clone(); }) : null;
    if (!wp) { wp = [new V3(pts[1].x, fy, pts[1].z)]; if (B) wp.push(new V3(B.x + tB.x * lead, fy, B.z + tB.z * lead)); }
    wp.forEach(function (w) { pts.push(w); });
    if (B) { pts.push(B.clone().addScaledVector(tB, lead)); pts.push(B.clone()); }
    var len = 0; for (var i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
    var extra = s.lengthM - len;
    if (!B) { var dir = (freeEnd && freeEnd.direction ? freeEnd.direction.clone() : new V3(1, 0, 0)); dir.y = 0; dir.normalize();
      if (extra > 0) pts.push(pts[pts.length - 1].clone().setY(fy).addScaledVector(dir, extra)); return resample(pts, s.n); }
    if (extra > 0) {
      var best = -1, bl = 0;
      for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k]; if (Math.abs(a.y - fy) < 1e-6 && Math.abs(b.y - fy) < 1e-6 && a.distanceTo(b) > bl) { bl = a.distanceTo(b); best = k; } }
      if (best < 0) for (var k2 = 1; k2 < pts.length; k2++) { var d2 = pts[k2].distanceTo(pts[k2 - 1]); if (d2 > bl) { bl = d2; best = k2; } }
      var a0 = pts[best - 1], b0 = pts[best], axis = b0.clone().sub(a0), side = new V3(-axis.z, 0, axis.x).normalize(); if (side.lengthSq() < 1e-9) side.set(1, 0, 0);
      var waves = Math.max(1, Math.round(bl / 0.7)), target = bl + extra;
      var curve = function (amp) { var out = []; for (var q = 0; q <= 64; q++) { var t = q / 64; out.push(a0.clone().lerp(b0, t).addScaledVector(side, amp * Math.sin(Math.PI * waves * t))); } return out; };
      var plen = function (arr) { var L = 0; for (var q = 1; q < arr.length; q++) L += arr[q].distanceTo(arr[q - 1]); return L; };
      var lo = 0, hi = 5; for (var it = 0; it < 60; it++) { var mid = (lo + hi) / 2; if (plen(curve(mid)) < target) lo = mid; else hi = mid; }
      var wig = curve((lo + hi) / 2); pts.splice.apply(pts, [best - 1, 2].concat(wig));
    }
    return resample(pts, s.n);
  }

  // 사슬 = [풀린 a 플러그 노즈?] + 케이블 노드 0..n + [풀린 b 플러그 노즈?]  (노드 0 = a 출구, n = b 출구)
  function solve(s, steps, iterations, finalIterations) {
    var P = s.nodes, Q = s.prev, n = s.n, seg = s.seg, r = s.r, L = PLUG.lengthMM * MM;
    var pose = { a: seatedPose(s, 'a'), b: seatedPose(s, 'b') }, pin = new Array(n + 1).fill(null);
    if (pose.a) { var eA = plugExitWorld(pose.a), xA = plugAxisWorld(pose.a); pin[0] = eA; pin[1] = eA.clone().addScaledVector(xA, seg); }
    if (pose.b) { var eB = plugExitWorld(pose.b), xB = plugAxisWorld(pose.b); pin[n] = eB; pin[n - 1] = eB.clone().addScaledVector(xB, seg); }
    var idx = { a: [0, 1], b: [n, n - 1] }, nose = s.nose;
    ENDS.forEach(function (e) {
      if (pose[e]) { nose[e] = null; return; }
      if (!nose[e]) { var i0 = idx[e][0], i1 = idx[e][1]; var p = P[i0].clone().addScaledVector(P[i0].clone().sub(P[i1]).normalize(), L); nose[e] = { p: p, q: p.clone() }; }
    });
    var dt = 1 / 120, g = -s.gravity * dt * dt, damp = 0.985;
    var minSkip = 2 * seg * Math.cos(Math.min(seg / s.minBendRadius, 1.2) / 2);
    var noseR = PLUG.shell.r * MM, exitR = PLUG.bushing.r0 * MM, fy = s.floorY, cols = s.colliders, tmp = new V3();
    var MU_S = 1.2, MU_K = 0.7;
    function friction(p, q, depth) { if (!q) return; var dx = p.x - q.x, dz = p.z - q.z, d = Math.sqrt(dx * dx + dz * dz);
      if (d < MU_S * depth) { p.x = q.x; p.z = q.z; } else if (d > 0) { var k = Math.min(MU_K * depth / d, 1); p.x -= dx * k; p.z -= dz * k; } }
    function floorPush(p, rad, q) { if (p.y < fy + rad) { var dep = fy + rad - p.y; p.y = fy + rad; friction(p, q, dep); } }
    function boxPush(p, rad, q) {
      for (var c = 0; c < cols.length; c++) { var b = cols[c];
        if (p.x > b.min.x - rad && p.x < b.max.x + rad && p.y > b.min.y - rad && p.y < b.max.y + rad && p.z > b.min.z - rad && p.z < b.max.z + rad) {
          var cand = [[p.x - (b.min.x - rad), 0], [(b.max.x + rad) - p.x, 1], [(b.max.y + rad) - p.y, 3], [p.z - (b.min.z - rad), 4], [(b.max.z + rad) - p.z, 5]];
          if (b.min.y > fy + 1e-6) cand.push([p.y - (b.min.y - rad), 2]);
          var best = cand[0]; for (var k = 1; k < cand.length; k++) if (cand[k][0] < best[0]) best = cand[k];
          switch (best[1]) { case 0: p.x = b.min.x - rad; break; case 1: p.x = b.max.x + rad; break; case 2: p.y = b.min.y - rad; break;
            case 3: p.y = b.max.y + rad; friction(p, q, best[0]); break; case 4: p.z = b.min.z - rad; break; default: p.z = b.max.z + rad; } } }
    }
    var omega = 1.0;
    function dist(a, b, rest, wa, wb) { var dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d < 1e-12) return;
      var w = wa + wb; if (w === 0) return; var k = omega * (d - rest) / (d * w); a.x += dx * k * wa; a.y += dy * k * wa; a.z += dz * k * wa; b.x -= dx * k * wb; b.y -= dy * k * wb; b.z -= dz * k * wb; }
    function minDist(a, b, rest, wa, wb) { if (a.distanceTo(b) >= rest) return; dist(a, b, rest, wa, wb); }
    var w = P.map(function (_, i) { return pin[i] ? 0 : 1; });
    for (var i0 = 0; i0 <= n; i0++) if (pin[i0]) { P[i0].copy(pin[i0]); Q[i0].copy(pin[i0]); }
    function project(iters, fric) {
      for (var it = 0; it < iters; it++) {
        if (it % 2 === 0) { for (var j = 0; j < n; j++) dist(P[j], P[j + 1], seg, w[j], w[j + 1]); } else { for (var jb = n - 1; jb >= 0; jb--) dist(P[jb], P[jb + 1], seg, w[jb], w[jb + 1]); }
        for (var j2 = 0; j2 < n - 1; j2++) minDist(P[j2], P[j2 + 2], minSkip, w[j2], w[j2 + 2]);
        ENDS.forEach(function (e) { var ns = nose[e]; if (!ns) return; var i0 = idx[e][0], i1 = idx[e][1]; dist(ns.p, P[i0], L, 1, w[i0] * 0.5); dist(ns.p, P[i1], L + seg, 1, w[i1] * 0.5); });
        var fr = fric && it === iters - 1;
        for (var c = 0; c <= n; c++) { if (!w[c]) continue; floorPush(P[c], r, fr ? Q[c] : null); boxPush(P[c], r, fr ? Q[c] : null); }
        ENDS.forEach(function (e) { var ns = nose[e]; if (!ns) return; var i0 = idx[e][0];
          floorPush(ns.p, noseR, fr ? ns.q : null); floorPush(P[i0], exitR, null); boxPush(ns.p, noseR, fr ? ns.q : null); boxPush(P[i0], exitR, null); });
      }
    }
    for (var st = 0; st < steps; st++) {
      for (var i = 0; i <= n; i++) { if (!w[i]) continue; var p = P[i], q = Q[i]; tmp.subVectors(p, q).multiplyScalar(damp); q.copy(p); p.add(tmp); p.y += g; }
      ENDS.forEach(function (e) { var ns = nose[e]; if (!ns) return; tmp.subVectors(ns.p, ns.q).multiplyScalar(damp); ns.q.copy(ns.p); ns.p.add(tmp); ns.p.y += g; });
      project(iterations, true);
    }
    function maxSegErr() { var m = 0; for (var k = 0; k < n; k++) m = Math.max(m, Math.abs(P[k].distanceTo(P[k + 1]) - seg) / seg); return m; }
    omega = 1.7; var fi = 0; for (; fi < finalIterations; fi += 50) { project(50, false); if (maxSegErr() < 0.0015) break; }
    omega = 1.0; project(20, false);
    for (var z = 0; z <= n; z++) Q[z].copy(P[z]);
    ENDS.forEach(function (e) { if (nose[e]) nose[e].q.copy(nose[e].p); });
    return pose;
  }

  function freePose(noseP, exit) {
    var z = exit.clone().sub(noseP).normalize(), up = new V3(0, 1, 0); if (Math.abs(z.dot(up)) > 0.98) up.set(0, 0, 1);
    var x = new V3().crossVectors(up, z).normalize(), y = new V3().crossVectors(z, x);
    return { position: noseP.clone(), quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)) };
  }
  function applyPose(root, plug, pose) {
    root.updateMatrixWorld(true); var inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    new THREE.Matrix4().compose(pose.position, pose.quaternion, new V3(1, 1, 1)).premultiply(inv).decompose(plug.position, plug.quaternion, plug.scale); plug.updateMatrixWorld(true);
  }
  function rebuildTube(root, s, poses) {
    root.updateMatrixWorld(true); var inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), pts = [];
    var aA = plugAxisWorld(poses.a), aB = plugAxisWorld(poses.b);
    pts.push(s.nodes[0].clone().addScaledVector(aA, -0.007)); s.nodes.forEach(function (p) { pts.push(p.clone()); }); pts.push(s.nodes[s.n].clone().addScaledVector(aB, -0.007));
    var curve = new THREE.CatmullRomCurve3(pts.map(function (p) { return p.applyMatrix4(inv); }), false, 'centripetal');
    var geo = new THREE.TubeGeometry(curve, Math.min(4000, s.n * 4), s.r, 14, false);
    if (s.body.geometry) s.body.geometry.dispose(); s.body.geometry = geo; s.curve = curve;
  }
  function computeStats(s, poses) {
    var n = s.n, P = s.nodes, maxErr = 0, total = 0, minY = Infinity, maxBend = 0, inBox = 0;
    for (var i = 0; i < n; i++) { var d = P[i].distanceTo(P[i + 1]); total += d; maxErr = Math.max(maxErr, Math.abs(d - s.seg) / s.seg); }
    for (var j = 1; j < n; j++) { var a = P[j].clone().sub(P[j - 1]).normalize(), b = P[j + 1].clone().sub(P[j]).normalize(); maxBend = Math.max(maxBend, Math.acos(Math.min(1, Math.max(-1, a.dot(b))))); }
    // 커넥터 출구에 고정된 노드(출구·다음 점)는 충돌 처리 대상이 아님 → 따로 셈 (돌린 장비의 상자(AABB)는 실제보다 커서 출구가 상자 안에 들 수 있음)
    var pinned = {}, inPinned = 0; if (s.ends.a.attach) { pinned[0] = pinned[1] = true; } if (s.ends.b.attach) { pinned[n] = pinned[n - 1] = true; }
    P.forEach(function (p, i) { minY = Math.min(minY, p.y - s.r - s.floorY);
      s.colliders.forEach(function (b) { if (p.x > b.min.x + 1e-4 && p.x < b.max.x - 1e-4 && p.y > b.min.y + 1e-4 && p.y < b.max.y - 1e-4 && p.z > b.min.z + 1e-4 && p.z < b.max.z - 1e-4) { if (pinned[i]) inPinned++; else inBox++; } }); });
    var tangent = {};
    ENDS.forEach(function (e) { var ax = plugAxisWorld(poses[e]), i0 = e === 'a' ? 0 : n, i1 = e === 'a' ? 1 : n - 1; tangent[e] = Math.acos(Math.min(1, ax.dot(P[i1].clone().sub(P[i0]).normalize()))) * 180 / Math.PI; });
    var straight = (s.ends.a.attach && s.ends.b.attach) ? P[0].distanceTo(P[n]) : null;
    return { segments: n, segmentM: s.seg, totalLengthM: total, maxSegmentErrorRatio: maxErr, minFloorClearanceM: minY, maxJointBendDeg: maxBend * 180 / Math.PI,
      allowedJointBendDeg: Math.min(s.seg / s.minBendRadius, 1.2) * 180 / Math.PI, nodesInsideColliders: inBox, pinnedNodesInsideColliders: inPinned, endTangentDeg: tangent,
      endToEndM: straight, overstretched: straight !== null && (straight > s.lengthM + 1e-6 || maxErr > 0.01) };
  }
  function update(root, opt) {
    var s = S(root), o = opt || {};
    var p0 = { a: seatedPose(s, 'a'), b: seatedPose(s, 'b') };
    if (!s.initialized || o.reset) {
      var A, tA, B = null, tB = null, freeEnd = null, wp = o.route || s.route;
      if (p0.a) { A = plugExitWorld(p0.a); tA = plugAxisWorld(p0.a); }
      else { var fe = s.ends.a.free || {}; A = (fe.position || new V3(0, s.floorY + 0.02, 0)).clone(); tA = (fe.direction || new V3(1, 0, 0)).clone().normalize(); }
      if (p0.b) { B = plugExitWorld(p0.b); tB = plugAxisWorld(p0.b); } else freeEnd = s.ends.b.free;
      var pts = buildInitialPath(s, A, tA, B, tB, wp, freeEnd);
      s.nodes = pts; s.prev = pts.map(function (p) { return p.clone(); }); s.nose = { a: null, b: null }; s.initialized = true;
    }
    var res = solve(s, o.steps !== undefined ? o.steps : (o.reset || !s.settled ? 900 : 240), o.iterations || 50, o.finalIterations || 4000);
    s.settled = true;
    var poses = { a: res.a || freePose(s.nose.a.p, s.nodes[0]), b: res.b || freePose(s.nose.b.p, s.nodes[s.n]) };
    applyPose(root, s.plugs.a, poses.a); applyPose(root, s.plugs.b, poses.b);
    rebuildTube(root, s, poses); s.stats = computeStats(s, poses); s.poses = poses;
    return s.stats;
  }
  function getEndInfo(root, end) {
    var s = S(root), plug = s.plugs[end], ref = plug.userData.reference; plug.updateMatrixWorld(true);
    var q = new THREE.Quaternion(); plug.getWorldQuaternion(q); var a = s.ends[end].attach;
    return { end: end, name: ref.name, type: ref.type, matesWith: ref.matesWith.slice(),
      worldMatingPoint: ref.localMatingPoint.clone().applyMatrix4(plug.matrixWorld), worldMatingDirection: ref.localMatingDirection.clone().applyQuaternion(q).normalize(),
      worldKeyDirection: ref.localKeyDirection.clone().applyQuaternion(q).normalize(), worldCableExit: ref.localCableExit.clone().applyMatrix4(plug.matrixWorld),
      worldCableDirection: ref.localCableDirection.clone().applyQuaternion(q).normalize(), worldQuaternion: q,
      connectedTo: a ? { portId: a.portId, device: a.root.name, locked: a.locked } : null, isSecure: !!(a && a.locked), plug: plug };
  }
  function getState(root) { var s = S(root);
    return { stats: s.stats, nodes: s.nodes ? s.nodes.map(function (p) { return p.clone(); }) : null,
      ends: { a: s.ends.a.attach ? { portId: s.ends.a.attach.portId, device: s.ends.a.attach.root.name, locked: s.ends.a.attach.locked } : null,
              b: s.ends.b.attach ? { portId: s.ends.b.attach.portId, device: s.ends.b.attach.root.name, locked: s.ends.b.attach.locked } : null } }; }

  window.SpeakonCable = {
    NAMESPACE: NS, PLUG_MM: PLUG, LOCK: LOCK, CABLE_MM: CABLE, PLUG_META: PLUG_META,
    create: create, buildPlug: buildPlug, connect: connect, disconnect: disconnect, setLocked: setLocked, setColliders: setColliders,
    update: update, getEndInfo: getEndInfo, getState: getState, compatibility: compatibility, portInfo: portInfo
  };
})();
