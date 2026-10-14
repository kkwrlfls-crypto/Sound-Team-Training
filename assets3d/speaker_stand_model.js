/*
 * 스피커 스탠드 (K&M 21450 기준, 35mm 폴) — Sound-Team-Training 3D 에셋
 *  - Three.js r128 전역 THREE, 단위 m, 전역 window.SpeakerStand
 *
 * 근거 (König & Meyer 공식 데이터시트 21450-000-55)
 *  - 높이 1,270 ~ 1,930mm, 관 끝 지름 Ø35mm, 최대 하중 40kg, 바닥(다리 펼침) 지름 1,150mm, 무게 2.34kg
 *  - 알루미늄, 관 다리 3개 + 보조 지지대(cross brace), 높이 조절 = 클램핑 레버 + 안전 핀
 *  - 바깥 관 지름, 다리 허브·지지대 칼라 높이, 다리 관 지름, 레버·핀 크기, 관 길이는 추정 — README 참조
 *
 * 좌표: 원점 = 바닥면 위 스탠드 중심축, +Y 위, +Z = 앞(다리 하나가 앞을 향함), +X = 앞에서 볼 때 오른쪽(레버 쪽)
 * 단자 기준점 'topPole': 안쪽 관 끝 중심, 로컬 +Z(법선) = 위(관이 스피커 소켓으로 들어가는 방향), +Y(키) = 스탠드 앞(+Z)
 *   → 스피커 'pole-socket-35mm' 기준점(법선 아래, 키 = 스피커 앞)과 맞물림:
 *     소켓 법선 = -폴 법선, 소켓 키 = 폴 키(요 회전 가능), 소켓 위치 = 폴 끝 - 폴 법선 × 소켓 삽입 깊이
 */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { console.error('[SpeakerStand] THREE(r128) 가 먼저 로드되어야 합니다.'); return; }
  var NS = 'spkStand', MM = 0.001, V3 = THREE.Vector3;

  var SPEC = { heightMinMM: 1270, heightMaxMM: 1930, poleDiameterMM: 35, maxLoadKg: 40, baseDiameterMM: 1150, weightKg: 2.34, material: 'aluminium' }; // 공식
  var DIM = {                                                                       // 추정 (사진 비례)
    poleR: 17.4,               // 모델 반지름: 공칭 Ø35 에서 0.1mm 여유 (스피커 소켓 r17.5 와 면이 겹치지 않게)
    innerLen: 950,             // 안쪽 관 길이
    outerR: 20.0, outerY0: 300, outerY1: 1100,      // 바깥 관 Ø40
    collar: { y0: 1100, y1: 1150, r: 24.5 },         // 상단 클램프 칼라 (레버·안전 핀)
    hub: { y0: 640, y1: 720, r: 31, pivotR: 36, pivotY: 680 }, // 다리 허브(주물)
    brace: { y: 340, r: 27, h: 40, at: 0.5 },        // 지지대 칼라 높이, 다리 위 연결 위치(다리 길이 비)
    legR: 11.0, braceR: 6.0,                         // 다리 관 Ø22, 지지대 Ø12
    foot: { r: 18, h: 30 },                          // 고무 발 (다리 끝을 12mm 감쌈)
    legAzimuthDeg: [0, 120, 240]                     // 0° = +Z(앞)
  };
  DIM.footCenterR = SPEC.baseDiameterMM / 2 - DIM.foot.r;          // 바깥 끝 = 575mm (공식 지름 1150)

  function hide(t, k, v) { Object.defineProperty(t, k, { value: v, enumerable: false, writable: true, configurable: true }); return v; }
  function mk(geo, mat, name, opt) { geo.scale(MM, MM, MM); var m = new THREE.Mesh(geo, mat); m.name = NS + '.' + name; var o = opt || {}; m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false; return m; }
  function grp(name) { var g = new THREE.Group(); g.name = NS + '.' + name; return g; }
  function setMM(o, x, y, z) { o.position.set(x * MM, y * MM, z * MM); return o; }
  // a→b (mm) 사이 원통 (축 = a→b)
  function rodGeo(a, b, r, seg) { var d = new V3().subVectors(b, a), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, seg || 20, 1, false);
    g.translate(0, L / 2, 0); g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize()))); g.translate(a.x, a.y, a.z); return g; }
  function lathe(pts, seg) { return new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), seg || 40); }
  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return {
      alu: new S({ color: 0x1c1d1f, roughness: 0.5, metalness: 0.35 }),           // 검정 아노다이즈 알루미늄
      aluInner: new S({ color: 0x232427, roughness: 0.45, metalness: 0.4 }),
      cast: new S({ color: 0x1a1b1d, roughness: 0.6, metalness: 0.35 }),
      plastic: new S({ color: 0x141516, roughness: 0.7, metalness: 0.0 }),
      rubber: new S({ color: 0x0f0f10, roughness: 0.92, metalness: 0.0 }),
      steel: new S({ color: 0xbfc2c6, roughness: 0.3, metalness: 0.95 }),
      endCap: new S({ color: 0x0b0b0c, roughness: 0.8, metalness: 0.0 }),
      hole: new THREE.MeshBasicMaterial({ color: 0x050505 })
    };
  }

  function create(opts) {
    var o = opts || {}, M = makeMaterials(), parts = {}, ports = {};
    var root = new THREE.Group(); root.name = NS + (o.name ? '.' + o.name : '');
    function reg(k, obj) { parts[k] = obj; return obj; }

    // ---- 바깥 관 + 하단 마개
    var outer = grp('outerTube');
    outer.add(mk(new THREE.CylinderGeometry(DIM.outerR, DIM.outerR, DIM.outerY1 - DIM.outerY0, 40).translate(0, (DIM.outerY0 + DIM.outerY1) / 2, 0), M.alu, 'outerTube.body'));
    outer.add(mk(lathe([[0, -8], [DIM.outerR - 1, -8], [DIM.outerR + 0.6, -5], [DIM.outerR + 0.6, 0], [DIM.outerR - 0.5, 0.01]], 40).translate(0, DIM.outerY0, 0), M.endCap, 'outerTube.bottomCap'));
    root.add(reg('outerTube', outer));

    // ---- 상단 칼라 (클램프) + 클램핑 레버 + 안전 핀
    var C = DIM.collar, collar = grp('clampCollar');
    collar.add(mk(lathe([[DIM.poleR + 0.3, C.y1], [C.r - 2, C.y1], [C.r, C.y1 - 2], [C.r, C.y0 + 4], [C.r - 3, C.y0], [DIM.outerR - 0.2, C.y0 - 0.01]], 48), M.cast, 'clampCollar.body'));
    collar.add(mk(new THREE.RingGeometry(DIM.poleR + 0.05, DIM.poleR + 0.32, 48).rotateX(-Math.PI / 2).translate(0, C.y1 + 0.02, 0), M.hole, 'clampCollar.gap', { cast: false }));
    // 클램프 귀(조임 볼트가 지나가는 두 돌출부, +X 쪽)
    [-1, 1].forEach(function (s, i) { collar.add(mk(new THREE.BoxGeometry(10, 34, 6).translate(C.r + 4, (C.y0 + C.y1) / 2, s * 5), M.cast, 'clampCollar.ear' + (i + 1))); });
    root.add(reg('clampCollar', collar));
    var lever = grp('clampLever');                   // 레버: 볼트 축(Z) 둘레로 회전, 잠김 = 아래로 눕힘
    lever.add(mk(new THREE.CylinderGeometry(3, 3, 22, 16).rotateX(Math.PI / 2), M.steel, 'clampLever.bolt'));
    lever.add(mk(new THREE.CylinderGeometry(7, 7, 8, 24).rotateX(Math.PI / 2).translate(0, 0, 12), M.plastic, 'clampLever.cam'));
    var hs = new THREE.Shape(); hs.moveTo(-5, 0); hs.lineTo(5, 0); hs.lineTo(4, -62); hs.quadraticCurveTo(0, -68, -4, -62); hs.closePath();
    lever.add(mk(new THREE.ExtrudeGeometry(hs, { depth: 7, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 2 }).translate(0, 0, 9), M.plastic, 'clampLever.handle'));
    setMM(lever, C.r + 4, (C.y0 + C.y1) / 2, 0); lever.rotation.z = 0.35; root.add(reg('clampLever', lever));
    var pin = grp('safetyPin');                      // 안전 핀: 칼라 아래 바깥 관 구멍에 꽂힌 위치(내측관 구멍 간격은 미표현)
    var px0 = -(DIM.outerR + 30), px1 = DIM.outerR + 3;   // 바깥 관 두 벽(과 안쪽 관 구멍)을 관통
    pin.add(mk(new THREE.CylinderGeometry(3.5, 3.5, px1 - px0, 16).rotateZ(Math.PI / 2).translate((px0 + px1) / 2, 0, 0), M.steel, 'safetyPin.shaft'));
    pin.add(mk(new THREE.TorusGeometry(11, 1.6, 10, 28).translate(px0 - 10, 0, 0), M.steel, 'safetyPin.ring'));
    pin.add(mk(new THREE.CylinderGeometry(5, 5, 4, 16).rotateZ(Math.PI / 2).translate(-DIM.outerR - 2.2, 0, 0), M.plastic, 'safetyPin.stop'));
    setMM(pin, 0, C.y0 - 28, 0); root.add(reg('safetyPin', pin));
    var pinHole = mk(new THREE.CircleGeometry(4, 16).rotateY(Math.PI / 2).translate(DIM.outerR + 0.05, C.y0 - 28, 0), M.hole, 'outerTube.pinHoleExit', { cast: false }); outer.add(pinHole);

    // ---- 안쪽 관 (Ø35) — 그룹 원점 = 관 끝(위), 높이 조절 = 그룹 y 이동
    var inner = grp('innerTube');
    inner.add(mk(new THREE.CylinderGeometry(DIM.poleR, DIM.poleR, DIM.innerLen - 1.2, 48, 1, true).translate(0, -(DIM.innerLen - 1.2) / 2 - 1.2, 0), M.aluInner, 'innerTube.body'));
    inner.add(mk(lathe([[DIM.poleR - 2.2, -0.6], [DIM.poleR - 2.2, 0], [DIM.poleR - 1.2, 0], [DIM.poleR - 0.3, -0.35], [DIM.poleR, -1.2]], 48), M.aluInner, 'innerTube.chamfer'));   // 끝 모따기
    inner.add(mk(new THREE.CircleGeometry(DIM.poleR - 2.2, 40).rotateX(-Math.PI / 2).translate(0, -0.6, 0), M.endCap, 'innerTube.endCap', { cast: false }));
    inner.add(mk(new THREE.CircleGeometry(DIM.poleR, 40).rotateX(Math.PI / 2).translate(0, -DIM.innerLen, 0), M.endCap, 'innerTube.bottom', { cast: false }));
    root.add(reg('innerTube', inner));

    // ---- 다리 허브(주물) + 다리 3개 + 지지대 칼라 + 지지대 3개 + 고무 발
    var H = DIM.hub, hub = grp('legHub');
    hub.add(mk(lathe([[DIM.outerR, H.y0], [H.r - 4, H.y0], [H.r, H.y0 + 6], [H.r, H.y1 - 8], [H.r - 6, H.y1], [DIM.outerR, H.y1 + 0.01]], 48), M.cast, 'legHub.body'));
    var brace = grp('braceCollar'), B = DIM.brace;
    brace.add(mk(lathe([[DIM.outerR, B.y - B.h / 2], [B.r - 3, B.y - B.h / 2], [B.r, B.y - B.h / 2 + 4], [B.r, B.y + B.h / 2 - 4], [B.r - 3, B.y + B.h / 2], [DIM.outerR, B.y + B.h / 2 + 0.01]], 48), M.cast, 'braceCollar.body'));
    root.add(reg('legHub', hub)); root.add(reg('braceCollar', brace));
    var legs = [];
    DIM.legAzimuthDeg.forEach(function (deg, i) {
      var a = deg * Math.PI / 180, dir = new V3(Math.sin(a), 0, Math.cos(a)), n = i + 1;
      var top = dir.clone().multiplyScalar(H.pivotR).setY(H.pivotY), foot = dir.clone().multiplyScalar(DIM.footCenterR).setY(DIM.foot.h - 12);
      var leg = grp('leg' + n);
      // 허브 귀(다리 축 핀 받침)
      var lug = mk(new THREE.BoxGeometry(14, 40, 30).translate(0, 0, H.r - 6), M.cast, 'leg' + n + '.lug'); lug.rotation.y = a; lug.position.y = H.pivotY * MM; hub.add(lug);
      var pv = mk(new THREE.CylinderGeometry(3, 3, 22, 12).rotateZ(Math.PI / 2), M.steel, 'leg' + n + '.pivotPin'); pv.position.copy(top.clone().multiplyScalar(MM)); pv.rotation.y = a; leg.add(pv);
      leg.add(mk(rodGeo(top, foot, DIM.legR, 24), M.alu, 'leg' + n + '.tube'));
      var ld = new V3().subVectors(foot, top).normalize();
      // 발: 다리 끝 고무 캡 (바닥면 y=0 에 닿음)
      var ft = grp('leg' + n + '.footGroup');
      ft.add(mk(lathe([[0, 0], [DIM.foot.r - 2, 0], [DIM.foot.r, 2], [DIM.foot.r - 0.5, DIM.foot.h - 5], [DIM.foot.r - 3.5, DIM.foot.h], [0, DIM.foot.h + 0.01]], 32), M.rubber, 'leg' + n + '.foot'));
      setMM(ft, foot.x, 0, foot.z); leg.add(ft);
      // 지지대: 칼라 → 다리 중간
      var bLeg = top.clone().lerp(foot, B.at), bCol = dir.clone().multiplyScalar(B.r + 3).setY(B.y);
      leg.add(mk(rodGeo(bCol, bLeg, DIM.braceR, 16), M.alu, 'leg' + n + '.brace'));
      var bl = mk(new THREE.BoxGeometry(12, 22, 24).translate(0, 0, B.r + 4), M.cast, 'leg' + n + '.braceLug'); bl.rotation.y = a; bl.position.y = B.y * MM; brace.add(bl);
      var clamp = mk(new THREE.CylinderGeometry(DIM.legR + 2.2, DIM.legR + 2.2, 18, 24).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), ld))).translate(bLeg.x, bLeg.y, bLeg.z), M.cast, 'leg' + n + '.braceClamp'); leg.add(clamp);
      root.add(reg('leg' + n, leg)); legs.push({ top: top, foot: foot, dir: dir });
    });

    // ---- 단자 기준점 (안쪽 관 끝)
    var anchors = grp('portAnchors'); root.add(anchors);
    var a = new THREE.Object3D(); a.name = NS + '.port.topPole';
    a.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new V3(-1, 0, 0), new V3(0, 0, 1), new V3(0, 1, 0)));
    inner.add(a); ports.topPole = a;   // 안쪽 관에 붙어 있으므로 높이 조절과 함께 움직임
    a.userData = { portId: 'topPole', type: 'speaker-pole-35mm', role: 'mechanical', accepts: ['pole-socket-35mm'], insertDepthMM: 90,
      localNormal: new V3(0, 1, 0), insertDirection: new V3(0, 1, 0), keyDirection: new V3(0, 0, 1), localPosition: new V3(),
      poleDiameterMM: SPEC.poleDiameterMM, maxLoadKg: SPEC.maxLoadKg, partName: inner.name, note: '삽입 깊이는 받는 소켓(스피커)의 insertDepthMM 를 우선 사용' };

    var state = { heightMM: 0, locked: true, mounted: null };
    function updateLocal() { root.updateMatrixWorld(true); var p = new V3(), inv = new THREE.Matrix4().copy(root.matrixWorld).invert(); a.getWorldPosition(p); a.userData.localPosition.copy(p.applyMatrix4(inv)); }
    var api = {
      setHeight: function (mm) { var h = Math.min(SPEC.heightMaxMM, Math.max(SPEC.heightMinMM, +mm || 0)); state.heightMM = h; inner.position.y = h * MM; updateLocal();
        if (state.mounted) mountSpeaker(root, state.mounted.api, state.mounted.root, state.mounted.opts); return h; },
      getHeight: function () { return state.heightMM; },
      setLocked: function (v) { state.locked = !!v; lever.rotation.z = state.locked ? 0.35 : -1.25; return state.locked; },
      getState: function () { var m = state.mounted; return { heightMM: state.heightMM, locked: state.locked, mounted: m ? { portId: m.portId, model: m.root.userData.info && m.root.userData.info.model, loadKg: m.loadKg } : null,
        maxLoadKg: SPEC.maxLoadKg, overload: !!(m && m.loadKg > SPEC.maxLoadKg) }; }
    };
    root.userData[NS] = { api: api }; hide(root.userData[NS], 'parts', parts); hide(root.userData[NS], 'ports', ports); hide(root.userData[NS], 'state', state); hide(root.userData[NS], 'legs', legs);
    root.userData.info = { model: 'K&M 21450 계열 스피커 스탠드 (35mm 폴)', spec: SPEC, units: 'm' };
    api.setHeight(o.heightMM || 1500);
    return root;
  }

  function findAnchor(root, id) { return root.getObjectByName(NS + '.port.' + id); }
  function getPortInfo(root, id) {
    var a = findAnchor(root, id); if (!a) return null; root.updateWorldMatrix(true, true);
    var u = a.userData, wp = new V3(), wq = new THREE.Quaternion(); a.getWorldPosition(wp); a.getWorldQuaternion(wq);
    var inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), lp = wp.clone().applyMatrix4(inv);
    var wn = new V3(0, 0, 1).applyQuaternion(wq).normalize(), wk = new V3(0, 1, 0).applyQuaternion(wq).normalize(), ln = new V3().copy(u.localNormal);
    var scale = ln.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(root.matrixWorld)).length();
    return { id: u.portId, type: u.type, role: u.role, accepts: u.accepts.slice(), localPosition: lp, localNormal: ln, insertDirectionLocal: new V3().copy(u.insertDirection), keyDirectionLocal: new V3().copy(u.keyDirection),
      worldPosition: wp, worldNormal: wn, worldInsertDirection: wn.clone(), worldKeyDirection: wk, worldQuaternion: wq, insertDepthMM: u.insertDepthMM, worldInsertDepth: u.insertDepthMM * MM * scale, worldScale: scale, anchor: a };
  }
  function getAllPorts(root) { return ['topPole'].map(function (id) { return getPortInfo(root, id); }).filter(Boolean); }

  // 스피커 장착: 스피커 소켓 기준점이 폴 끝 위에 오도록 스피커 루트의 위치·회전을 계산 (스케일은 그대로)
  //  opts.yawDeg = 폴 축 둘레 회전(0 = 스피커 앞 = 스탠드 앞), opts.portId = 스피커 단자 id(기본 poleMount)
  function mountSpeaker(standRoot, spkApi, spkRoot, opts) {
    var o = opts || {}, portId = o.portId || 'poleMount', st = standRoot.userData[NS].state;
    var pole = getPortInfo(standRoot, 'topPole'), sock = spkApi && spkApi.getPortInfo ? spkApi.getPortInfo(spkRoot, portId) : null;
    if (!sock) return { ok: false, reason: '스피커 단자를 찾을 수 없음: ' + portId };
    if (pole.accepts.indexOf(sock.type) < 0 || (sock.accepts || []).indexOf(pole.type) < 0) return { ok: false, reason: pole.type + ' 는 ' + sock.type + ' 단자에 꽂을 수 없음' };
    var n = pole.worldNormal.clone().negate(), k = pole.worldKeyDirection.clone().applyAxisAngle(pole.worldNormal, (o.yawDeg || 0) * Math.PI / 180);
    var depth = sock.worldInsertDepth, target = pole.worldPosition.clone().addScaledVector(pole.worldNormal, -depth);
    var Qs = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new V3().crossVectors(k, n), k, n));
    // 기준점의 루트 기준 변환 (스케일 포함)
    spkRoot.updateWorldMatrix(true, true);
    var anchorInRoot = new THREE.Matrix4().copy(spkRoot.matrixWorld).invert().multiply(sock.anchor.matrixWorld);
    var ap = new V3(), aq = new THREE.Quaternion(), as = new V3(); anchorInRoot.decompose(ap, aq, as);
    var rs = new V3(); spkRoot.matrixWorld.decompose(new V3(), new THREE.Quaternion(), rs);
    var rootQ = Qs.clone().multiply(aq.clone().invert());
    var rootP = target.clone().sub(ap.clone().multiply(rs).applyQuaternion(rootQ));
    var world = new THREE.Matrix4().compose(rootP, rootQ, rs);
    var local = spkRoot.parent ? new THREE.Matrix4().copy(spkRoot.parent.matrixWorld).invert().multiply(world) : world;
    local.decompose(spkRoot.position, spkRoot.quaternion, spkRoot.scale); spkRoot.updateMatrixWorld(true);
    var info = spkRoot.userData.info || {}, kg = info.dimensionsMM && info.dimensionsMM.weightKg || null;
    st.mounted = { api: spkApi, root: spkRoot, portId: portId, opts: o, loadKg: kg };
    var chk = spkApi.getPortInfo(spkRoot, portId);
    return { ok: true, portId: portId, depthMM: depth / MM / pole.worldScale, poseErrorMM: chk.worldPosition.distanceTo(target) / MM, normalErr: chk.worldNormal.distanceTo(n), keyErr: chk.worldKeyDirection.distanceTo(k), loadKg: kg, overload: !!(kg && kg > SPEC.maxLoadKg) };
  }
  function unmountSpeaker(standRoot) { var st = standRoot.userData[NS].state, m = st.mounted; st.mounted = null; return m ? m.root : null; }
  // 정적 넘어짐 각(정보용): 질량 중심 높이와 다리 세 점이 이루는 삼각형 안쪽 거리
  function tipInfo(standRoot, extra) {
    var st = standRoot.userData[NS].state, legs = standRoot.userData[NS].legs, rIn = DIM.footCenterR * Math.cos(Math.PI / 3);
    var mS = SPEC.weightKg, yS = 640;                   // 스탠드 질량 중심 높이 추정 (mm)
    var list = [[mS, yS]]; if (extra) list.push(extra);
    var M = 0, Y = 0; list.forEach(function (q) { M += q[0]; Y += q[0] * q[1]; }); Y /= M;
    return { totalKg: M, comHeightMM: Y, innerRadiusMM: rIn, tipAngleDeg: Math.atan2(rIn, Y) * 180 / Math.PI, legs: legs.length, heightMM: st.heightMM };
  }
  function toGear3dPortsLocal(root) { var o = {}; getAllPorts(root).forEach(function (p) { o[p.id] = { pos: p.localPosition.toArray(), normal: p.localNormal.toArray(), type: p.type }; }); return o; }

  window.SpeakerStand = { NAMESPACE: NS, SPEC: SPEC, DIM_MM: DIM, create: create, getPortInfo: getPortInfo, getAllPorts: getAllPorts, mountSpeaker: mountSpeaker, unmountSpeaker: unmountSpeaker,
    tipInfo: tipInfo, toGear3dPortsLocal: toGear3dPortsLocal, api: function (root) { return root.userData[NS].api; } };
})();
