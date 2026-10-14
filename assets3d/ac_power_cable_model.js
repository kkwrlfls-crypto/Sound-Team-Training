/*
 * AC 전원 케이블 — 220V 유럽(EU) 형: CEE 7/7 (Schuko, Type E+F) 플러그 ↔ IEC 60320 C13 커넥터
 *  Sound-Team-Training 3D 에셋 단계 7/8 · Three.js r128 전역 THREE, 단위 m, 전역 window.AcPowerCable
 *
 * 형상 근거
 *  - CEE 7/7 (공식 규격 값, CEE 7): 핀 Ø4.8 x 19mm, 핀 간격 19mm, 소켓 오목부 깊이 17.5mm, 양쪽 접지 클립 홈(Schuko 소켓용),
 *    접지 핀 구멍(프랑스 CEE 7/5 소켓용, 핀 중심선에서 10mm), 16A 250V. 한국 콘센트(220V)와 같은 계열
 *  - IEC 60320 C13 (10A 250V): 2·4단계·Crown 의 C14 인렛(개구부 25.4 x 16.6, 위쪽 모서리 모따기 3.5, 핀 L/N ±7.0,-2.9 / E 0,+2.1)에 맞춤
 *  - 케이블: H05VV-F 3G1.0mm² (갈색 L · 파랑 N · 녹황 PE), 외경 7.4mm (추정)
 *  - 몸체 외형(손잡이·부트 곡선), 플러그 앞 지름, 슬리브 길이, 소켓 구멍 크기는 추정 — README 참조
 *
 * 플러그 로컬 좌표 (1~6단계와 같은 규칙): 원점 = 결합면(앞면) 중심, 몸체는 +Z, +Y = 키
 *  - C13: +Y = 접지 쪽(모따기 모서리 쪽) / CEE 7/7: +Y = 접지 핀 구멍 쪽, 핀은 X 축 위
 *  - 꽂는 방향 = 로컬 -Z, 케이블 출구 = (0,0,전장)
 * 케이블 몸체: 3·6단계와 같은 PBD 사슬(구간 길이·최소 굽힘 반경·중력·바닥/상자 충돌·마찰). 커넥터는 강체.
 */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { console.error('[AcPowerCable] THREE(r128) 가 먼저 로드되어야 합니다.'); return; }
  var NS = 'acPowerCable', MM = 0.001, V3 = THREE.Vector3;

  // ---------------------------------------------------------------------------
  // 치수 (mm)
  var C13 = {
    lengthMM: 60.0,
    nose: { w: 24.2, h: 15.4, chamfer: 3.2, z1: 10.0 },                  // 인렛 개구부 25.4 x 16.6 안 (사방 0.6 여유, 추정)
    sockets: [['L', -7.0, -2.9, 2.6, 5.4], ['N', 7.0, -2.9, 2.6, 5.4], ['E', 0, 2.1, 2.6, 4.6]], socketDepth: 9.0, // 인렛 핀 1.8 x 4.4 / 1.8 x 3.6 보다 큼
    body: { z0: 10.0, z1: 36.0, w: 30.6, h: 22.4, r: 4.0 },              // 인렛 앞면에 닿는 턱 → 손잡이 (추정)
    boot: { z0: 36.0, z1: 60.0, endR: 6.2 },
    ratedA: 10, ratedV: 250
  };
  var CEE77 = {
    lengthMM: 66.0,
    front: { d: 36.0, z1: 17.0 },                                         // 소켓 오목부(깊이 17.5) 안으로 들어가는 앞부분 (지름 추정)
    pin: { d: 4.8, len: 19.0, dx: 9.5, sleeve: 10.0 },                   // 공식: Ø4.8 x 19, 간격 19 / 절연 슬리브 10mm (추정)
    earthHole: { d: 5.4, y: 10.0, depth: 14.0 },                          // 공식: 핀 중심선에서 10mm / 구멍 지름·깊이 추정
    groove: { w: 8.0, depth: 2.4 },                                       // 위·아래 접지 클립 홈 (추정)
    grip: { z0: 17.0, z1: 46.0, d0: 38.0, d1: 30.0 }, boot: { z0: 46.0, z1: 66.0, endR: 6.2 },
    ratedA: 16, ratedV: 250
  };
  var CABLE = { odMM: 7.4, minBendRadiusMM: 30, segMM: 25, type: 'H05VV-F 3G1.0mm²', cores: [['L', '갈색'], ['N', '파랑'], ['PE', '녹황']] };
  var MAINS = { region: 'EU/KR', nominalV: 220, frequencyHz: 60, note: '한국 220V 60Hz 콘센트(CEE 7/3 계열)와 호환. 유럽은 230V 50Hz' };

  // ---------------------------------------------------------------------------
  function hide(t, k, v) { Object.defineProperty(t, k, { value: v, enumerable: false, writable: true, configurable: true }); return v; }
  function mk(geo, mat, name, opt) { geo.scale(MM, MM, MM); var m = new THREE.Mesh(geo, mat); m.name = NS + '.' + name; var o = opt || {}; m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false; return m; }
  function grp(name) { var g = new THREE.Group(); g.name = NS + '.' + name; return g; }
  function lathe(pts, segs) { var g = new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), segs || 48); g.rotateX(Math.PI / 2); return g; }
  function rrect(p, cx, cy, w, h, r) { var x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2; r = Math.min(r, w / 2, h / 2);
    p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r); p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
    p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0); return p; }
  function poly(p, pts) { p.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; }
  function c13Outline() { var N = C13.nose, w = N.w / 2, h = N.h / 2, c = N.chamfer; return [[-w, -h], [w, -h], [w, h - c], [w - c, h], [-w + c, h], [-w, h - c]]; }
  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return {
      body: new S({ color: 0x101011, roughness: 0.6, metalness: 0.0 }),
      boot: new S({ color: 0x0b0b0c, roughness: 0.75, metalness: 0.0 }),
      pin: new S({ color: 0xc9cbce, roughness: 0.25, metalness: 0.95 }),
      brass: new S({ color: 0xb59a5a, roughness: 0.3, metalness: 0.9 }),
      sleeve: new S({ color: 0x141415, roughness: 0.5, metalness: 0.0 }),
      hole: new S({ color: 0x000000, roughness: 1.0, metalness: 0.0 }),
      holeWall: new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.BackSide }),
      jacket: new S({ color: 0x0c0c0d, roughness: 0.62, metalness: 0.0 }),
      print: new S({ color: 0xffffff, roughness: 0.6, transparent: true, alphaTest: 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    };
  }
  function printDecal(M, w, h, lines, name) {
    var s = 10, c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s); var g = c.getContext('2d');
    g.fillStyle = '#d8d8d8'; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(function (l) { g.font = '700 ' + l[2] * s + 'px Arial, sans-serif'; g.fillText(l[0], c.width / 2, l[1] * s); });
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; var mat = M.print.clone(); mat.map = t;
    return mk(new THREE.PlaneGeometry(w, h), mat, name, { cast: false });
  }

  // ---------------------------------------------------------------------------
  // IEC C13 커넥터 (암, 3극)
  function buildC13(M, name) {
    var C = C13, N = C.nose, g = grp(name);
    var face = poly(new THREE.Shape(), c13Outline());
    C.sockets.forEach(function (sk) { face.holes.push(rrect(new THREE.Path(), sk[1], sk[2], sk[3], sk[4], 0.4)); });
    g.add(mk(new THREE.ExtrudeGeometry(face, { depth: N.z1, bevelEnabled: false }), M.body, name + '.nose'));
    C.sockets.forEach(function (sk) { // 소켓 구멍: 벽(어두운 안쪽) + 바닥 + 접점 판
      var wall = new THREE.BoxGeometry(sk[3], sk[4], C.socketDepth).translate(sk[1], sk[2], C.socketDepth / 2);
      g.add(mk(wall, M.holeWall, name + '.socket' + sk[0] + 'Wall', { cast: false, receive: false }));
      var bt = mk(new THREE.PlaneGeometry(sk[3], sk[4]).rotateY(Math.PI).translate(sk[1], sk[2], C.socketDepth), M.hole, name + '.socket' + sk[0] + 'Bottom', { cast: false }); g.add(bt);
      g.add(mk(new THREE.BoxGeometry(0.3, sk[4] - 0.8, C.socketDepth - 2.0).translate(sk[1] + sk[3] / 2 - 0.15, sk[2], 1.0 + (C.socketDepth - 2.0) / 2), M.brass, name + '.contact' + sk[0], { cast: false }));
    });
    var B = C.body, bs = rrect(new THREE.Shape(), 0, 0, B.w, B.h, B.r);
    g.add(mk(new THREE.ExtrudeGeometry(bs, { depth: B.z1 - B.z0 - 1.0, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelOffset: -0.5, bevelSegments: 2, curveSegments: 10 }).translate(0, 0, B.z0 + 0.5), M.body, name + '.body'));
    for (var i = 0; i < 5; i++) { var z = B.z0 + 9 + i * 3.2; // 손잡이 홈 (좌우)
      [-1, 1].forEach(function (sg) { g.add(mk(new THREE.BoxGeometry(0.6, B.h - 6, 1.4).translate(sg * (B.w / 2 + 0.05), 0, z), M.hole, name + '.grip' + (sg > 0 ? 'R' : 'L') + (i + 1), { cast: false })); }); }
    var bo = C.boot, Lb = bo.z1 - bo.z0, cr = CABLE.odMM / 2 + 0.1;
    g.add(mk(lathe([[9.6, bo.z0], [9.8, bo.z0 + 0.15 * Lb], [8.4, bo.z0 + 0.5 * Lb], [bo.endR + 0.8, bo.z0 + 0.85 * Lb], [bo.endR, bo.z1 - 0.5], [bo.endR - 0.5, bo.z1], [cr + 0.3, bo.z1], [cr, bo.z1 - 0.4], [cr, bo.z1 - 8]], 40), M.boot, name + '.boot'));
    var pr = printDecal(M, 22, 14, [['10A 250V~', 4.5, 3.0], ['IEC C13', 9.5, 2.6]], name + '.print'); pr.rotation.x = -Math.PI / 2; pr.position.set(0, (B.h / 2 + 0.03) * MM, (B.z0 + 13) * MM); pr.rotation.z = Math.PI; g.add(pr);
    return g;
  }

  // CEE 7/7 플러그 (Schuko + 프랑스식 접지 구멍)
  function buildCee77(M, name) {
    var P = CEE77, F = P.front, R = F.d / 2, g = grp(name), G = P.groove;
    // 앞부분: 위·아래 접지 클립 홈이 있는 원통 → Shape 를 Z 로 압출
    var sh = new THREE.Shape(), a = Math.asin((G.w / 2) / R);
    sh.absarc(0, 0, R, Math.PI / 2 + a, Math.PI * 3 / 2 - a, false);              // 왼쪽 반원
    sh.lineTo(-G.w / 2, -R + G.depth); sh.lineTo(G.w / 2, -R + G.depth); sh.lineTo(Math.sin(a) * R, -Math.cos(a) * R);
    sh.absarc(0, 0, R, -Math.PI / 2 + a, Math.PI / 2 - a, false);                // 오른쪽 반원
    sh.lineTo(G.w / 2, R - G.depth); sh.lineTo(-G.w / 2, R - G.depth); sh.closePath();
    sh.holes.push(new THREE.Path().absarc(0, P.earthHole.y, P.earthHole.d / 2, 0, Math.PI * 2, true));
    g.add(mk(new THREE.ExtrudeGeometry(sh, { depth: F.z1, bevelEnabled: false, curveSegments: 48 }), M.body, name + '.front'));
    g.add(mk(new THREE.CylinderGeometry(P.earthHole.d / 2, P.earthHole.d / 2, P.earthHole.depth, 24, 1, true).rotateX(Math.PI / 2).translate(0, P.earthHole.y, P.earthHole.depth / 2), M.holeWall, name + '.earthHoleWall', { cast: false, receive: false }));
    g.add(mk(new THREE.CircleGeometry(P.earthHole.d / 2, 24).rotateY(Math.PI).translate(0, P.earthHole.y, P.earthHole.depth), M.brass, name + '.earthHoleContact', { cast: false }));
    // 접지 클립 판 (홈 바닥, 위·아래)
    [1, -1].forEach(function (sg) { g.add(mk(new THREE.BoxGeometry(G.w - 1.6, 0.5, F.z1 - 2.0).translate(0, sg * (R - G.depth + 0.25), (F.z1 - 2.0) / 2 + 1.0), M.pin, name + '.earthClip' + (sg > 0 ? 'Top' : 'Bottom'))); });
    // 핀 2개 (Ø4.8 x 19, 간격 19): 앞면에서 -Z 로 돌출, 뿌리 쪽 절연 슬리브
    [-1, 1].forEach(function (sg) { var pp = P.pin, r = pp.d / 2, x = sg * pp.dx, id = sg < 0 ? 'Left' : 'Right';
      g.add(mk(lathe([[0, -pp.len], [r * 0.75, -pp.len + 0.2], [r, -pp.len + 1.2], [r, -pp.sleeve], [0.001, -pp.sleeve]], 32).translate(x, 0, 0), M.pin, name + '.pin' + id));
      g.add(mk(new THREE.CylinderGeometry(r, r, pp.sleeve, 32).rotateX(Math.PI / 2).translate(x, 0, -pp.sleeve / 2), M.sleeve, name + '.pin' + id + 'Sleeve')); });
    // 손잡이 + 부트
    var Gp = P.grip, bo = P.boot, cr = CABLE.odMM / 2 + 0.1;
    g.add(mk(lathe([[R, Gp.z0], [Gp.d0 / 2, Gp.z0 + 1.5], [Gp.d0 / 2, Gp.z0 + 6], [Gp.d1 / 2 + 1.5, Gp.z0 + 16], [Gp.d1 / 2, Gp.z1 - 2], [Gp.d1 / 2 - 1, Gp.z1]], 56), M.body, name + '.grip'));
    for (var i = 0; i < 10; i++) { var an = (i + 0.5) / 10 * Math.PI * 2; var rb = mk(new THREE.BoxGeometry(1.4, 0.8, 9).translate(0, 0, Gp.z0 + 21), M.body, name + '.gripRib' + (i + 1));
      var rr = Gp.d1 / 2 + 0.5; rb.position.set(Math.cos(an) * rr * MM, Math.sin(an) * rr * MM, 0); rb.rotation.z = an - Math.PI / 2; g.add(rb); }
    var Lb = bo.z1 - bo.z0;
    g.add(mk(lathe([[Gp.d1 / 2 - 1, bo.z0], [Gp.d1 / 2 - 1.5, bo.z0 + 0.25 * Lb], [bo.endR + 1.2, bo.z0 + 0.8 * Lb], [bo.endR, bo.z1 - 0.5], [bo.endR - 0.5, bo.z1], [cr + 0.3, bo.z1], [cr, bo.z1 - 0.4], [cr, bo.z1 - 8]], 40), M.boot, name + '.boot'));
    var pr = printDecal(M, 20, 8, [['16A 250V~', 4.0, 3.2]], name + '.print'); pr.position.set(0, 0, -0.03 * MM); pr.rotation.y = Math.PI; pr.position.y = -9.5 * MM; g.add(pr);
    return g;
  }

  var PLUG_META = {
    iec: { kind: 'iec', type: 'iec-c13-plug', name: 'IEC 60320 C13 커넥터', matesWith: ['iec-c14'], lengthMM: C13.lengthMM, restR: [C13.nose.h / 2, C13.body.h / 2], build: buildC13 },
    mains: { kind: 'mains', type: 'cee7-7-plug', name: 'CEE 7/7 플러그 (Schuko/Type E+F)', matesWith: ['cee7-3-socket', 'cee7-5-socket', 'cee7-4-socket'], lengthMM: CEE77.lengthMM, restR: [CEE77.front.d / 2, CEE77.grip.d1 / 2], build: buildCee77 }
  };
  function buildPlug(end, materials) {
    var meta = PLUG_META[end], M = materials || makeMaterials(), g = meta.build(M, end === 'iec' ? 'plugC13' : 'plugCee77');
    g.userData = { type: meta.type, lengthMM: meta.lengthMM, reference: { name: meta.name, type: meta.type, matesWith: meta.matesWith.slice(),
      localMatingPoint: new V3(0, 0, 0), localMatingDirection: new V3(0, 0, -1), localKeyDirection: new V3(0, 1, 0), localCableExit: new V3(0, 0, meta.lengthMM * MM), localCableDirection: new V3(0, 0, 1),
      ratedA: end === 'iec' ? C13.ratedA : CEE77.ratedA, ratedV: end === 'iec' ? C13.ratedV : CEE77.ratedV } };
    g.traverse(function (o) { if (o.isMesh) o.userData.rigidPlugPart = true; });
    return g;
  }

  // ---------------------------------------------------------------------------
  function portInfo(api, root, id) {
    var p = api.getPortInfo(root, id); if (!p) return null;
    var q = p.worldQuaternion ? p.worldQuaternion.clone() : null; if (!q && p.anchor) { q = new THREE.Quaternion(); p.anchor.getWorldQuaternion(q); }
    var out = { id: p.id, type: p.type, accepts: p.accepts || null, worldPosition: p.worldPosition.clone(), worldNormal: p.worldNormal.clone(), worldQuaternion: q,
      worldKeyDirection: p.worldKeyDirection ? p.worldKeyDirection.clone() : new V3(0, 1, 0).applyQuaternion(q).normalize(), anchor: p.anchor };
    out.insertDepthMM = p.insertDepthMM; out.worldInsertDepth = p.worldInsertDepth;
    if (out.worldInsertDepth === undefined) return null; // 삽입 깊이 정보가 없는 단자는 연결하지 않음
    return out;
  }
  function compatibility(end, port) {
    var meta = PLUG_META[end]; if (!meta) return { ok: false, reason: '끝 이름은 iec 또는 mains' };
    if (!port) return { ok: false, reason: '단자를 찾을 수 없거나 결합 정보가 없음' };
    if (meta.matesWith.indexOf(port.type) < 0) return { ok: false, reason: meta.type + ' 는 ' + port.type + ' 단자에 꽂을 수 없음' };
    if (port.accepts && port.accepts.indexOf(meta.type) < 0) return { ok: false, reason: port.type + ' 단자가 ' + meta.type + ' 를 받지 않음' };
    return { ok: true };
  }

  var ENDS = ['iec', 'mains'];
  function create(options) {
    var o = options || {};
    var lengthM = o.lengthM || 1.8, seg = (o.segmentMM || CABLE.segMM) * MM, r = CABLE.odMM / 2 * MM;
    var M = makeMaterials(); if (o.jacketColor !== undefined) M.jacket.color.set(o.jacketColor);
    var root = new THREE.Group(); root.name = NS + 'Root' + (o.name ? '.' + o.name : '');
    var plugs = { iec: buildPlug('iec', M), mains: buildPlug('mains', M) }; root.add(plugs.iec); root.add(plugs.mains);
    var body = new THREE.Mesh(new THREE.BufferGeometry(), M.jacket); body.name = NS + '.jacket'; body.castShadow = true; body.receiveShadow = true; root.add(body);
    var n = Math.max(8, Math.round(lengthM / seg)); seg = lengthM / n;
    var st = { lengthM: lengthM, seg: seg, n: n, r: r, M: M, plugs: plugs, body: body, minBendRadius: CABLE.minBendRadiusMM * MM,
      floorY: o.floorY !== undefined ? o.floorY : 0, colliders: (o.colliders || []).slice(), gravity: 9.81,
      ends: { iec: { attach: null, free: null }, mains: { attach: null, free: null } }, nodes: null, prev: null, initialized: false, stats: null, route: o.route || null, nose: { iec: null, mains: null } };
    hide(root.userData, NS, st);
    root.userData.acPowerCableInfo = { lengthM: lengthM, odMM: CABLE.odMM, cableType: CABLE.type, cores: CABLE.cores.map(function (c) { return c[0] + '(' + c[1] + ')'; }), segments: n,
      ends: { iec: PLUG_META.iec.type, mains: PLUG_META.mains.type }, ratedA: Math.min(C13.ratedA, CEE77.ratedA), ratedV: 250, mains: MAINS };
    return root;
  }
  function S(root) { var s = root && root.userData[NS]; if (!s) throw new Error('[AcPowerCable] 케이블 루트가 아닙니다'); return s; }
  function connect(root, end, deviceApi, deviceRoot, portId) {
    if (ENDS.indexOf(end) < 0) return { ok: false, reason: '끝 이름은 iec 또는 mains' };
    var s = S(root), port = portInfo(deviceApi, deviceRoot, portId), c = compatibility(end, port); if (!c.ok) return c;
    s.ends[end].attach = { api: deviceApi, root: deviceRoot, portId: portId }; s.ends[end].free = null;
    return { ok: true, port: port };
  }
  function disconnect(root, end, freePose) { var s = S(root); s.ends[end].attach = null; s.ends[end].free = freePose || null; }
  function setColliders(root, boxes) { S(root).colliders = boxes.slice(); }

  function seatedPose(s, end) {
    var a = s.ends[end].attach; if (!a) return null; var p = portInfo(a.api, a.root, a.portId);
    return { position: p.worldPosition.clone().addScaledVector(p.worldNormal, -p.worldInsertDepth), quaternion: p.worldQuaternion.clone(), port: p };
  }
  function exitWorld(pose, end) { return new V3(0, 0, PLUG_META[end].lengthMM * MM).applyQuaternion(pose.quaternion).add(pose.position); }
  function axisWorld(pose) { return new V3(0, 0, 1).applyQuaternion(pose.quaternion); }
  function resample(pts, n) {
    var cum = [0]; for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    var total = cum[cum.length - 1], out = [], j = 1;
    for (var k = 0; k <= n; k++) { var d = total * k / n; while (j < cum.length - 1 && cum[j] < d) j++; var t = (d - cum[j - 1]) / Math.max(cum[j] - cum[j - 1], 1e-12); out.push(pts[j - 1].clone().lerp(pts[j], Math.min(Math.max(t, 0), 1))); }
    return out;
  }
  function buildInitialPath(s, A, tA, B, tB, waypoints, freeEnd) {
    var lead = Math.min(0.06, s.lengthM * 0.05), pts = [A.clone(), A.clone().addScaledVector(tA, lead)], fy = s.floorY + s.r;
    var wp = (waypoints && waypoints.length) ? waypoints.map(function (w) { return w.clone(); }) : null;
    if (!wp) { wp = [new V3(pts[1].x, fy, pts[1].z)]; if (B) wp.push(new V3(B.x + tB.x * lead, fy, B.z + tB.z * lead)); }
    wp.forEach(function (w) { pts.push(w); });
    if (B) { pts.push(B.clone().addScaledVector(tB, lead)); pts.push(B.clone()); }
    var len = 0; for (var i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
    var extra = s.lengthM - len;
    if (!B) { var dir = (freeEnd && freeEnd.direction ? freeEnd.direction.clone() : new V3(1, 0, 0)); dir.y = 0; dir.normalize(); if (extra > 0) pts.push(pts[pts.length - 1].clone().setY(fy).addScaledVector(dir, extra)); return resample(pts, s.n); }
    if (extra > 0) {
      var best = -1, bl = 0;
      for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k]; if (Math.abs(a.y - fy) < 1e-6 && Math.abs(b.y - fy) < 1e-6 && a.distanceTo(b) > bl) { bl = a.distanceTo(b); best = k; } }
      if (best < 0) for (var k2 = 1; k2 < pts.length; k2++) { var d2 = pts[k2].distanceTo(pts[k2 - 1]); if (d2 > bl) { bl = d2; best = k2; } }
      var a0 = pts[best - 1], b0 = pts[best], axis = b0.clone().sub(a0), side = new V3(-axis.z, 0, axis.x).normalize(); if (side.lengthSq() < 1e-9) side.set(1, 0, 0);
      var waves = Math.max(1, Math.round(bl / 0.5)), target = bl + extra;
      var curve = function (amp) { var out = []; for (var q = 0; q <= 64; q++) { var t = q / 64; out.push(a0.clone().lerp(b0, t).addScaledVector(side, amp * Math.sin(Math.PI * waves * t))); } return out; };
      var plen = function (arr) { var L = 0; for (var q = 1; q < arr.length; q++) L += arr[q].distanceTo(arr[q - 1]); return L; };
      var lo = 0, hi = 5; for (var it = 0; it < 60; it++) { var mid = (lo + hi) / 2; if (plen(curve(mid)) < target) lo = mid; else hi = mid; }
      pts.splice.apply(pts, [best - 1, 2].concat(curve((lo + hi) / 2)));
    }
    return resample(pts, s.n);
  }
  // 노드 0 = iec 끝 출구, n = mains 끝 출구
  function solve(s, steps, iterations, finalIterations) {
    var P = s.nodes, Q = s.prev, n = s.n, seg = s.seg, r = s.r;
    var pose = { iec: seatedPose(s, 'iec'), mains: seatedPose(s, 'mains') }, pin = new Array(n + 1).fill(null);
    if (pose.iec) { var e0 = exitWorld(pose.iec, 'iec'), x0 = axisWorld(pose.iec); pin[0] = e0; pin[1] = e0.clone().addScaledVector(x0, seg); }
    if (pose.mains) { var e1 = exitWorld(pose.mains, 'mains'), x1 = axisWorld(pose.mains); pin[n] = e1; pin[n - 1] = e1.clone().addScaledVector(x1, seg); }
    var idx = { iec: [0, 1], mains: [n, n - 1] }, nose = s.nose, L = { iec: C13.lengthMM * MM, mains: CEE77.lengthMM * MM };
    ENDS.forEach(function (e) { if (pose[e]) { nose[e] = null; return; } if (!nose[e]) { var i0 = idx[e][0], i1 = idx[e][1]; var p = P[i0].clone().addScaledVector(P[i0].clone().sub(P[i1]).normalize(), L[e]); nose[e] = { p: p, q: p.clone() }; } });
    var dt = 1 / 120, g = -s.gravity * dt * dt, damp = 0.985, minSkip = 2 * seg * Math.cos(Math.min(seg / s.minBendRadius, 1.2) / 2);
    var fy = s.floorY, cols = s.colliders, tmp = new V3(), MU_S = 1.2, MU_K = 0.7;
    function friction(p, q, depth) { if (!q) return; var dx = p.x - q.x, dz = p.z - q.z, d = Math.sqrt(dx * dx + dz * dz); if (d < MU_S * depth) { p.x = q.x; p.z = q.z; } else if (d > 0) { var k = Math.min(MU_K * depth / d, 1); p.x -= dx * k; p.z -= dz * k; } }
    function floorPush(p, rad, q) { if (p.y < fy + rad) { var dep = fy + rad - p.y; p.y = fy + rad; friction(p, q, dep); } }
    function boxPush(p, rad, q) { for (var c = 0; c < cols.length; c++) { var b = cols[c];
      if (p.x > b.min.x - rad && p.x < b.max.x + rad && p.y > b.min.y - rad && p.y < b.max.y + rad && p.z > b.min.z - rad && p.z < b.max.z + rad) {
        var cand = [[p.x - (b.min.x - rad), 0], [(b.max.x + rad) - p.x, 1], [(b.max.y + rad) - p.y, 3], [p.z - (b.min.z - rad), 4], [(b.max.z + rad) - p.z, 5]]; if (b.min.y > fy + 1e-6) cand.push([p.y - (b.min.y - rad), 2]);
        var best = cand[0]; for (var k = 1; k < cand.length; k++) if (cand[k][0] < best[0]) best = cand[k];
        switch (best[1]) { case 0: p.x = b.min.x - rad; break; case 1: p.x = b.max.x + rad; break; case 2: p.y = b.min.y - rad; break; case 3: p.y = b.max.y + rad; friction(p, q, best[0]); break; case 4: p.z = b.min.z - rad; break; default: p.z = b.max.z + rad; } } } }
    var omega = 1.0;
    function dist(a, b, rest, wa, wb) { var dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d < 1e-12) return; var w = wa + wb; if (w === 0) return; var k = omega * (d - rest) / (d * w);
      a.x += dx * k * wa; a.y += dy * k * wa; a.z += dz * k * wa; b.x -= dx * k * wb; b.y -= dy * k * wb; b.z -= dz * k * wb; }
    function minDist(a, b, rest, wa, wb) { if (a.distanceTo(b) >= rest) return; dist(a, b, rest, wa, wb); }
    var w = P.map(function (_, i) { return pin[i] ? 0 : 1; });
    for (var i0 = 0; i0 <= n; i0++) if (pin[i0]) { P[i0].copy(pin[i0]); Q[i0].copy(pin[i0]); }
    function project(iters, fric) {
      for (var it = 0; it < iters; it++) {
        if (it % 2 === 0) { for (var j = 0; j < n; j++) dist(P[j], P[j + 1], seg, w[j], w[j + 1]); } else { for (var jb = n - 1; jb >= 0; jb--) dist(P[jb], P[jb + 1], seg, w[jb], w[jb + 1]); }
        for (var j2 = 0; j2 < n - 1; j2++) minDist(P[j2], P[j2 + 2], minSkip, w[j2], w[j2 + 2]);
        ENDS.forEach(function (e) { var ns = nose[e]; if (!ns) return; var a = idx[e][0], b = idx[e][1]; dist(ns.p, P[a], L[e], 1, w[a] * 0.5); dist(ns.p, P[b], L[e] + seg, 1, w[b] * 0.5); });
        var fr = fric && it === iters - 1;
        for (var c = 0; c <= n; c++) { if (!w[c]) continue; floorPush(P[c], r, fr ? Q[c] : null); boxPush(P[c], r, fr ? Q[c] : null); }
        ENDS.forEach(function (e) { var ns = nose[e]; if (!ns) return; var a = idx[e][0], rr = PLUG_META[e].restR;
          floorPush(ns.p, rr[0] * MM, fr ? ns.q : null); floorPush(P[a], rr[1] * MM, null); boxPush(ns.p, rr[0] * MM, fr ? ns.q : null); boxPush(P[a], rr[1] * MM, null); });
      }
    }
    for (var st = 0; st < steps; st++) {
      for (var i = 0; i <= n; i++) { if (!w[i]) continue; var p = P[i], q = Q[i]; tmp.subVectors(p, q).multiplyScalar(damp); q.copy(p); p.add(tmp); p.y += g; }
      ENDS.forEach(function (e) { var ns = nose[e]; if (!ns) return; tmp.subVectors(ns.p, ns.q).multiplyScalar(damp); ns.q.copy(ns.p); ns.p.add(tmp); ns.p.y += g; });
      project(iterations, true);
    }
    function maxSegErr() { var m = 0; for (var k = 0; k < n; k++) m = Math.max(m, Math.abs(P[k].distanceTo(P[k + 1]) - seg) / seg); return m; }
    omega = 1.7; for (var fi = 0; fi < finalIterations; fi += 50) { project(50, false); if (maxSegErr() < 0.0015) break; }
    omega = 1.0; project(20, false);
    for (var z = 0; z <= n; z++) Q[z].copy(P[z]); ENDS.forEach(function (e) { if (nose[e]) nose[e].q.copy(nose[e].p); });
    return pose;
  }
  // 풀린 플러그 자세: 축 = 출구→노즈 반대, 키(+Y) 는 위쪽에 가깝게. 위로 향한 면(바닥 접촉 면)을 고려해 납작한 C13 은 넓은 면이 바닥에 닿게
  function freePose(noseP, exit, end) {
    var z = exit.clone().sub(noseP).normalize(), up = new V3(0, 1, 0); if (Math.abs(z.dot(up)) > 0.98) up.set(0, 0, 1);
    var x = new V3().crossVectors(up, z).normalize(), y = new V3().crossVectors(z, x);
    return { position: noseP.clone(), quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)) };
  }
  function applyPose(root, plug, pose) { root.updateMatrixWorld(true); var inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    new THREE.Matrix4().compose(pose.position, pose.quaternion, new V3(1, 1, 1)).premultiply(inv).decompose(plug.position, plug.quaternion, plug.scale); plug.updateMatrixWorld(true); }
  // 풀린 플러그: 실제 형상 최저점이 바닥에 닿도록 높이 보정 (회전된 강체의 정확한 정점 기준)
  function settleFreePlug(root, s, end, pose) {
    var plug = s.plugs[end]; applyPose(root, plug, pose); var m = Infinity, v = new V3();
    plug.traverse(function (o) { if (!o.isMesh) return; var a = o.geometry.attributes.position; o.updateMatrixWorld(true); for (var i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); if (v.y < m) m = v.y; } });
    var dy = s.floorY + 0.0005 - m; if (dy > 0) { pose.position.y += dy; applyPose(root, plug, pose); } return pose;
  }
  function rebuildTube(root, s, poses) {
    root.updateMatrixWorld(true); var inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), pts = [];
    var exA = exitWorld(poses.iec, 'iec'), exB = exitWorld(poses.mains, 'mains');
    pts.push(exA.clone().addScaledVector(axisWorld(poses.iec), -0.007)); pts.push(exA);
    for (var i = 1; i < s.n; i++) pts.push(s.nodes[i].clone()); pts.push(exB); pts.push(exB.clone().addScaledVector(axisWorld(poses.mains), -0.007));
    var curve = new THREE.CatmullRomCurve3(pts.map(function (p) { return p.applyMatrix4(inv); }), false, 'centripetal');
    var geo = new THREE.TubeGeometry(curve, Math.min(4000, s.n * 4), s.r, 12, false); if (s.body.geometry) s.body.geometry.dispose(); s.body.geometry = geo; s.curve = curve;
  }
  function computeStats(s, poses) {
    var n = s.n, P = s.nodes, maxErr = 0, total = 0, minY = Infinity, maxBend = 0, inBox = 0, inPinned = 0, pinned = {};
    if (s.ends.iec.attach) pinned[0] = pinned[1] = true; if (s.ends.mains.attach) pinned[n] = pinned[n - 1] = true;
    for (var i = 0; i < n; i++) { var d = P[i].distanceTo(P[i + 1]); total += d; maxErr = Math.max(maxErr, Math.abs(d - s.seg) / s.seg); }
    for (var j = 1; j < n; j++) { var a = P[j].clone().sub(P[j - 1]).normalize(), b = P[j + 1].clone().sub(P[j]).normalize(); maxBend = Math.max(maxBend, Math.acos(Math.min(1, Math.max(-1, a.dot(b))))); }
    P.forEach(function (p, k) { minY = Math.min(minY, p.y - s.r - s.floorY);
      s.colliders.forEach(function (b) { if (p.x > b.min.x + 1e-4 && p.x < b.max.x - 1e-4 && p.y > b.min.y + 1e-4 && p.y < b.max.y - 1e-4 && p.z > b.min.z + 1e-4 && p.z < b.max.z - 1e-4) { if (pinned[k]) inPinned++; else inBox++; } }); });
    var tangent = {}; ENDS.forEach(function (e) { var ax = axisWorld(poses[e]), i0 = e === 'iec' ? 0 : n, i1 = e === 'iec' ? 1 : n - 1; tangent[e] = Math.acos(Math.min(1, ax.dot(P[i1].clone().sub(P[i0]).normalize()))) * 180 / Math.PI; });
    var straight = (s.ends.iec.attach && s.ends.mains.attach) ? P[0].distanceTo(P[n]) : null;
    return { segments: n, segmentM: s.seg, totalLengthM: total, maxSegmentErrorRatio: maxErr, minFloorClearanceM: minY, maxJointBendDeg: maxBend * 180 / Math.PI,
      allowedJointBendDeg: Math.min(s.seg / s.minBendRadius, 1.2) * 180 / Math.PI, nodesInsideColliders: inBox, pinnedNodesInsideColliders: inPinned, endTangentDeg: tangent,
      endToEndM: straight, overstretched: straight !== null && (straight > s.lengthM + 1e-6 || maxErr > 0.01) };
  }
  function update(root, opt) {
    var s = S(root), o = opt || {}, p0 = { iec: seatedPose(s, 'iec'), mains: seatedPose(s, 'mains') };
    if (!s.initialized || o.reset) {
      var A, tA, B = null, tB = null, freeEnd = null, wp = o.route || s.route;
      if (p0.iec) { A = exitWorld(p0.iec, 'iec'); tA = axisWorld(p0.iec); } else { var fe = s.ends.iec.free || {}; A = (fe.position || new V3(0, s.floorY + 0.02, 0)).clone(); tA = (fe.direction || new V3(1, 0, 0)).clone().normalize(); }
      if (p0.mains) { B = exitWorld(p0.mains, 'mains'); tB = axisWorld(p0.mains); } else freeEnd = s.ends.mains.free;
      var pts = buildInitialPath(s, A, tA, B, tB, wp, freeEnd); s.nodes = pts; s.prev = pts.map(function (p) { return p.clone(); }); s.nose = { iec: null, mains: null }; s.initialized = true;
    }
    var res = solve(s, o.steps !== undefined ? o.steps : (o.reset || !s.settled ? 900 : 240), o.iterations || 50, o.finalIterations || 4000); s.settled = true;
    var poses = {};
    ENDS.forEach(function (e) { if (res[e]) { poses[e] = res[e]; applyPose(root, s.plugs[e], poses[e]); } else { var ex = s.nodes[e === 'iec' ? 0 : s.n]; poses[e] = settleFreePlug(root, s, e, freePose(s.nose[e].p, ex, e)); } });
    rebuildTube(root, s, poses); s.stats = computeStats(s, poses); s.poses = poses; return s.stats;
  }
  function getEndInfo(root, end) {
    var s = S(root), plug = s.plugs[end], ref = plug.userData.reference; plug.updateMatrixWorld(true); var q = new THREE.Quaternion(); plug.getWorldQuaternion(q); var a = s.ends[end].attach;
    return { end: end, name: ref.name, type: ref.type, matesWith: ref.matesWith.slice(), ratedA: ref.ratedA, ratedV: ref.ratedV,
      worldMatingPoint: ref.localMatingPoint.clone().applyMatrix4(plug.matrixWorld), worldMatingDirection: ref.localMatingDirection.clone().applyQuaternion(q).normalize(),
      worldKeyDirection: ref.localKeyDirection.clone().applyQuaternion(q).normalize(), worldCableExit: ref.localCableExit.clone().applyMatrix4(plug.matrixWorld),
      worldCableDirection: ref.localCableDirection.clone().applyQuaternion(q).normalize(), worldQuaternion: q, connectedTo: a ? { portId: a.portId, device: a.root.name } : null, plug: plug };
  }
  function getState(root) { var s = S(root); return { stats: s.stats, nodes: s.nodes ? s.nodes.map(function (p) { return p.clone(); }) : null,
    ends: { iec: s.ends.iec.attach ? { portId: s.ends.iec.attach.portId, device: s.ends.iec.attach.root.name } : null, mains: s.ends.mains.attach ? { portId: s.ends.mains.attach.portId, device: s.ends.mains.attach.root.name } : null },
    powered: isPowered(s), suppliedTo: isPowered(s) ? { device: s.ends.iec.attach.root.name, portId: s.ends.iec.attach.portId } : null }; }
  // 전원 공급: mains 끝이 살아 있는 콘센트(장비 API 의 isLive)에 꽂혀 있고, iec 끝이 장비 인렛에 꽂혀 있을 때 (8단계에서 추가)
  function isPowered(s) { var m = s.ends.mains.attach, d = s.ends.iec.attach; return !!(m && d && typeof m.api.isLive === 'function' && m.api.isLive(m.root, m.portId)); }

  window.AcPowerCable = {
    NAMESPACE: NS, C13_MM: C13, CEE77_MM: CEE77, CABLE_MM: CABLE, MAINS: MAINS, PLUG_META: PLUG_META,
    create: create, buildPlug: buildPlug, connect: connect, disconnect: disconnect, setColliders: setColliders,
    update: update, getEndInfo: getEndInfo, getState: getState, compatibility: compatibility, portInfo: portInfo
  };
})();
