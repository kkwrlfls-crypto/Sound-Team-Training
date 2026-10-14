/*
 * 마이크 붐 스탠드 (K&M 210/9 기준) + 마이크 클립 (Shure A25D 기준) — Sound-Team-Training 3D 에셋
 *  - Three.js r128 전역 THREE, 단위 m, 전역 window.MicStand
 *
 * 근거
 *  - K&M 210/9 공식 데이터시트(21090-300-55): 높이 900~1,605mm, 붐 길이 435~745mm(2단 텔레스코픽), 3/8" 나사,
 *    무게 3.1kg, 강철, 아연 다이캐스트 베이스 + 접이식 다리, 높이 조절 = 클러치, 붐 고정 = T-바 나사, 접은 크기 105 x 85 x 985mm
 *  - Shure A25D: 5/8" 나사(3/8" 변환 나사 포함), 클립 안지름 25~30mm, SM58 등 손잡이형 마이크용, 플라스틱
 *  - 관 지름(아래 Ø25 / 위 Ø20 / 붐 Ø20·Ø16), 다리 길이·바닥 지름(약 Ø666), 클러치·조인트·T-바 크기,
 *    A25D 외형(어댑터 길이, 회전축 위치, 클립 길이 36mm, 벽 두께, 열림 각), 회전 범위는 추정 — README 참조
 *  - "높이" = 바닥에서 붐 조인트 회전축까지 (모델 정의)
 *
 * 좌표: 원점 = 바닥면 위 스탠드 중심축, +Y 위, +Z = 앞(요 0° 일 때 붐이 뻗는 방향), +X = 앞에서 볼 때 오른쪽(T-바 쪽)
 * 단자 기준점
 *  - 'boomThread' : 붐 끝 3/8" 수나사 뿌리(붐 끝면 중심), +Z = 붐 바깥 방향, +Y = 붐 위쪽. 포함된 A25D 클립이 체결되어 있음
 *  - 'micClip'    : 클립 안쪽 테이퍼의 좁은 끝(케이블 쪽) 중심, +Z = 클립 축 바깥(케이블 쪽), +Y = 클립 열린 쪽(마이크를 밀어 넣는 쪽)
 *      → 마이크 원점(XLR 림) = 기준점 + 법선 × 42mm, 마이크 +Y(그릴 방향) = -법선, 마이크 +Z(로고) = 키
 */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { console.error('[MicStand] THREE(r128) 가 먼저 로드되어야 합니다.'); return; }
  var NS = 'micStand', MM = 0.001, V3 = THREE.Vector3;

  var SPEC = { heightMinMM: 900, heightMaxMM: 1605, boomMinMM: 435, boomMaxMM: 745, thread: '3/8"-16 UNC', weightKg: 3.1, foldedMM: [105, 85, 985], material: 'steel / zinc die-cast' }; // 공식
  var CLIP_SPEC = { model: 'Shure A25D 기준', thread: '5/8"-27 (3/8" 변환 나사 포함)', gripDiameterMM: [25, 30] };                                     // 공식
  var DIM = {                                                                    // 추정
    lowerR: 12.5, lowerY0: 70, lowerY1: 800,                                     // 아래 관 Ø25
    clutch: { y0: 800, y1: 845, r: 21 },
    upperR: 10.0, upperLen: 800, jointHalf: 22, boomOffsetX: 26,                                  // 위 관 Ø20, 조인트 아래면 = 회전축 - 22
    hub: { y0: 150, y1: 268, r: 30, pivotR: 36, pivotY: 232 },
    legR: 8.0, foot: { r: 13, h: 24, bury: 10 }, footCenterR: 320, legAzimuthDeg: [0, 120, 240],
    boom: { outerR: 10.0, innerR: 8.0, rear: 150, front: 285, innerLen: 360 },  // 회전축 뒤 150 + 앞 285 = 435 (접은 길이)
    stud: { r: 4.76, len: 12.0 },                                                // 3/8" = 9.525mm
    clip: { adapterR: 11, adapterLen: 22, pivotY: 30, axisOffset: 21, len: 36, rIn0: 12.80, rIn1: 14.59, wall: 2.6, gapDeg: 100 },
    micSeatMM: 42,                                                               // 클립 좁은 끝 = 마이크 원점에서 42mm (SM58 손잡이 지름 25.6mm 지점)
    limits: { boomAngle: [-30, 90], clipTilt: [-30, 80] }
  };

  function hide(t, k, v) { Object.defineProperty(t, k, { value: v, enumerable: false, writable: true, configurable: true }); return v; }
  function mk(geo, mat, name, opt) { geo.scale(MM, MM, MM); var m = new THREE.Mesh(geo, mat); m.name = NS + '.' + name; var o = opt || {}; m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false; return m; }
  function grp(name) { var g = new THREE.Group(); g.name = NS + '.' + name; return g; }
  function setMM(o, x, y, z) { o.position.set(x * MM, y * MM, z * MM); return o; }
  function rot(g, q) { return g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); }
  function rodGeo(a, b, r, seg) { var d = new V3().subVectors(b, a), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, seg || 20);
    g.translate(0, L / 2, 0); rot(g, new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize())); g.translate(a.x, a.y, a.z); return g; }
  function lathe(pts, seg, p0, pl) { return new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), seg || 40, p0 || 0, pl === undefined ? Math.PI * 2 : pl); }
  function zTube(z0, z1, r, seg) { return new THREE.CylinderGeometry(r, r, z1 - z0, seg || 28).rotateX(Math.PI / 2).translate(0, 0, (z0 + z1) / 2); }
  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return {
      steel: new S({ color: 0x1d1e20, roughness: 0.5, metalness: 0.35 }),     // 검정 분체 도장 강철
      steelInner: new S({ color: 0x26272a, roughness: 0.42, metalness: 0.45 }),
      zinc: new S({ color: 0x18191b, roughness: 0.6, metalness: 0.3 }),
      plastic: new S({ color: 0x141516, roughness: 0.7, metalness: 0.0 }),
      rubber: new S({ color: 0x0f0f10, roughness: 0.92, metalness: 0.0 }),
      thread: new S({ color: 0xb9bcc0, roughness: 0.32, metalness: 0.95 }),
      brass: new S({ color: 0xb79c5c, roughness: 0.3, metalness: 0.9 }),
      clip: new S({ color: 0x161718, roughness: 0.55, metalness: 0.0, side: THREE.DoubleSide })
    };
  }

  function create(opts) {
    var o = opts || {}, M = makeMaterials(), parts = {}, ports = {};
    var root = new THREE.Group(); root.name = NS + (o.name ? '.' + o.name : '');
    function reg(k, obj) { parts[k] = obj; return obj; }

    // ---- 베이스(아연 주물 허브) + 접이식 다리 3개
    var H = DIM.hub, base = grp('base');
    base.add(mk(lathe([[DIM.lowerR, H.y0], [H.r - 6, H.y0], [H.r, H.y0 + 10], [H.r, H.y1 - 12], [H.r - 9, H.y1], [DIM.lowerR, H.y1 + 0.01]], 48), M.zinc, 'base.hub'));
    var legs = [];
    DIM.legAzimuthDeg.forEach(function (deg, i) {
      var a = deg * Math.PI / 180, dir = new V3(Math.sin(a), 0, Math.cos(a)), n = i + 1, leg = grp('leg' + n);
      var top = dir.clone().multiplyScalar(H.pivotR).setY(H.pivotY), foot = dir.clone().multiplyScalar(DIM.footCenterR).setY(DIM.foot.h - DIM.foot.bury);
      var lug = mk(new THREE.BoxGeometry(22, 46, 26).translate(0, 0, H.r - 4), M.zinc, 'leg' + n + '.socket'); lug.rotation.y = a; lug.position.y = (H.pivotY + 4) * MM; base.add(lug);
      var pv = mk(new THREE.CylinderGeometry(2.6, 2.6, 26, 12).rotateZ(Math.PI / 2), M.thread, 'leg' + n + '.pivotPin'); pv.position.copy(top.clone().multiplyScalar(MM)); pv.rotation.y = a; leg.add(pv);
      leg.add(mk(rodGeo(top, foot, DIM.legR, 20), M.steel, 'leg' + n + '.tube'));
      var ft = grp('leg' + n + '.footGroup');
      ft.add(mk(lathe([[0, 0], [DIM.foot.r - 2, 0], [DIM.foot.r, 2], [DIM.foot.r - 0.5, DIM.foot.h - 5], [DIM.foot.r - 3.5, DIM.foot.h], [0, DIM.foot.h + 0.01]], 28), M.rubber, 'leg' + n + '.foot'));
      setMM(ft, foot.x, 0, foot.z); leg.add(ft);
      base.add(reg('leg' + n, leg)); legs.push({ top: top, foot: foot });
    });
    root.add(reg('base', base));

    // ---- 아래 관 + 클러치
    var lower = grp('lowerTube');
    lower.add(mk(new THREE.CylinderGeometry(DIM.lowerR, DIM.lowerR, DIM.lowerY1 - DIM.lowerY0, 36).translate(0, (DIM.lowerY0 + DIM.lowerY1) / 2, 0), M.steel, 'lowerTube.body'));
    lower.add(mk(lathe([[0, -6], [DIM.lowerR - 1, -6], [DIM.lowerR + 0.6, -3], [DIM.lowerR + 0.6, 0], [DIM.lowerR - 0.5, 0.01]], 32).translate(0, DIM.lowerY0, 0), M.plastic, 'lowerTube.bottomCap'));
    root.add(reg('lowerTube', lower));
    var C = DIM.clutch, clutch = grp('clutch'), cp = [];
    cp.push([DIM.lowerR - 0.2, C.y0 - 0.01], [C.r - 4, C.y0], [C.r, C.y0 + 5]);
    for (var k = 0; k < 6; k++) { var yy = C.y0 + 8 + k * 4.5; cp.push([C.r, yy], [C.r - 1.2, yy + 2.2]); }
    cp.push([C.r, C.y1 - 8], [C.r - 6, C.y1], [DIM.upperR + 0.4, C.y1]);
    clutch.add(mk(lathe(cp, 48), M.plastic, 'clutch.body'));
    root.add(reg('clutch', clutch));

    // ---- 위 관 + 붐 조인트 + T-바 (mast 그룹: 원점 = 붐 회전축, 요 회전)
    var mast = grp('mast');
    var upper = mk(new THREE.CylinderGeometry(DIM.upperR, DIM.upperR, DIM.upperLen, 32).translate(0, -DIM.jointHalf - DIM.upperLen / 2, 0), M.steelInner, 'upperTube.body'); mast.add(upper);
    // 조인트: 붐은 위 관 축에서 +X 로 BX(26mm) 떨어진 곳을 지나므로 수직(90°)까지 세울 수 있음 (추정 구조)
    var BX = DIM.boomOffsetX, jointFixed = grp('jointFixed');
    jointFixed.add(mk(new THREE.CylinderGeometry(DIM.upperR + 3, DIM.upperR + 5, 18, 28).translate(0, -DIM.jointHalf - 9, 0), M.zinc, 'jointFixed.socket'));
    jointFixed.add(mk(new THREE.BoxGeometry(14, 32, 22).translate(4, -DIM.jointHalf - 4, 0), M.zinc, 'jointFixed.web'));
    jointFixed.add(mk(new THREE.CylinderGeometry(19, 19, 10, 32).rotateZ(Math.PI / 2).translate(BX - 17, 0, 0), M.zinc, 'jointFixed.disc'));
    mast.add(reg('jointFixed', jointFixed));
    var tbar = grp('tBar');                                                     // T-바: 붐 바깥(+X) 쪽 나사 + 손잡이
    tbar.add(mk(new THREE.CylinderGeometry(4, 4, 30, 16).rotateZ(Math.PI / 2).translate(BX + 22, 0, 0), M.thread, 'tBar.screw'));
    tbar.add(mk(new THREE.CylinderGeometry(9, 9, 10, 24).rotateZ(Math.PI / 2).translate(BX + 36, 0, 0), M.zinc, 'tBar.boss'));
    tbar.add(mk(new THREE.CylinderGeometry(5.5, 5.5, 64, 20).translate(BX + 43, 0, 0), M.zinc, 'tBar.handle'));
    [-1, 1].forEach(function (s, i) { tbar.add(mk(new THREE.SphereGeometry(6.5, 18, 12).translate(BX + 43, s * 32, 0), M.zinc, 'tBar.knob' + (i + 1))); });
    mast.add(reg('tBar', tbar));

    // ---- 붐 (boom 그룹: 로컬 +Z = 붐 앞, 회전축 = X)
    var B = DIM.boom, boom = grp('boom');
    var jointMov = grp('jointMoving');
    jointMov.add(mk(new THREE.BoxGeometry(24, 26, 34), M.zinc, 'jointMoving.block'));
    jointMov.add(mk(new THREE.CylinderGeometry(19, 19, 8, 32).rotateZ(Math.PI / 2).translate(-8, 0, 0), M.zinc, 'jointMoving.disc'));
    boom.add(reg('jointMoving', jointMov));
    boom.add(mk(zTube(-B.rear, B.front, B.outerR, 32), M.steel, 'boom.outerTube'));
    boom.add(mk(lathe([[0, -8], [B.outerR - 1, -8], [B.outerR + 0.6, -5], [B.outerR + 0.6, 0], [B.outerR - 0.5, 0.01]], 28).rotateX(Math.PI / 2).translate(0, 0, -B.rear), M.plastic, 'boom.rearCap'));
    var bc = mk(lathe([[B.innerR + 0.3, 0], [B.outerR + 3.5, 0], [B.outerR + 3.5, 16], [B.outerR + 0.2, 20]], 32).rotateX(-Math.PI / 2).translate(0, 0, B.front + 6), M.plastic, 'boom.clamp');
    boom.add(bc);
    boom.add(mk(new THREE.CylinderGeometry(3, 3, 14, 12).translate(0, B.outerR + 3.5 + 7, B.front - 4), M.thread, 'boom.clampScrew'));
    boom.add(mk(new THREE.CylinderGeometry(7, 7, 6, 20).translate(0, B.outerR + 3.5 + 14 + 3, B.front - 4), M.plastic, 'boom.clampKnob'));
    var inner = grp('boomInner');                                              // 원점 = 붐 끝면
    inner.add(mk(zTube(-B.innerLen, -6, B.innerR, 28), M.steelInner, 'boomInner.tube'));
    inner.add(mk(lathe([[B.innerR, -6], [B.innerR + 0.8, -5], [B.innerR + 0.8, -1], [B.innerR - 0.5, 0], [0, 0]], 28).rotateX(Math.PI / 2), M.plastic, 'boomInner.endPlug'));
    inner.add(mk(zTube(0, DIM.stud.len, DIM.stud.r, 20), M.thread, 'boomInner.stud38'));
    boom.add(reg('boomInner', inner));
    boom.position.x = BX * MM; mast.add(reg('boom', boom));
    root.add(reg('mast', mast));
    // 붐 나사 기준점 (붐 끝면)
    var aT = new THREE.Object3D(); aT.name = NS + '.port.boomThread';
    inner.add(aT); ports.boomThread = aT;
    aT.userData = { portId: 'boomThread', type: 'mic-thread-3-8-male', role: 'mechanical', accepts: ['mic-holder-thread-3-8', 'mic-holder-thread-5-8+reducer-3-8'], insertDepthMM: DIM.stud.len,
      localNormal: new V3(), insertDirection: new V3(), keyDirection: new V3(), localPosition: new V3(), thread: SPEC.thread, occupiedBy: 'clip (A25D 기준, 3/8" 변환 나사)' };

    // ---- A25D 클립 (clip 그룹: 로컬 +Y = 붐 앞 = 나사 축)
    var CL = DIM.clip, clip = grp('clip');
    clip.rotation.x = Math.PI / 2; inner.add(reg('clip', clip));
    var adapter = grp('clipAdapter');
    adapter.add(mk(lathe([[DIM.stud.r + 0.2, 0], [CL.adapterR - 1.5, 0], [CL.adapterR, 1.5], [CL.adapterR, CL.adapterLen - 3], [CL.adapterR - 3, CL.adapterLen], [0, CL.adapterLen + 0.01]], 36), M.clip, 'clipAdapter.body'));
    adapter.add(mk(lathe([[DIM.stud.r + 0.05, 0.4], [7.2, 0.4], [7.2, -0.15], [DIM.stud.r + 0.05, -0.15]], 28), M.brass, 'clipAdapter.reducer38'));   // 3/8" 변환 나사(황동) 끝면
    var tab = new THREE.Shape(); tab.moveTo(-8, CL.adapterLen - 2); tab.lineTo(8, CL.adapterLen - 2); tab.lineTo(8, CL.pivotY); tab.absarc(0, CL.pivotY, 8, 0, Math.PI, false); tab.lineTo(-8, CL.adapterLen - 2);
    adapter.add(mk(new THREE.ExtrudeGeometry(tab, { depth: 7, bevelEnabled: false }).translate(0, 0, -3.5).rotateY(Math.PI / 2), M.clip, 'clipAdapter.tab'));
    adapter.add(mk(new THREE.CylinderGeometry(2.5, 2.5, 24, 12).rotateZ(Math.PI / 2).translate(0, CL.pivotY, 0), M.thread, 'clipAdapter.pivotPin'));
    clip.add(reg('clipAdapter', adapter));
    var swivel = grp('clipSwivel'); setMM(swivel, 0, CL.pivotY, 0); clip.add(reg('clipSwivel', swivel));
    [-1, 1].forEach(function (s, i) {                                           // 회전축 귀 2개
      var e = new THREE.Shape(); e.absarc(0, 0, 8, Math.PI, 0, true); e.lineTo(8, CL.axisOffset - 17); e.lineTo(-8, CL.axisOffset - 17); e.lineTo(-8, 0);
      swivel.add(mk(new THREE.ExtrudeGeometry(e, { depth: 3, bevelEnabled: false }).rotateY(Math.PI / 2).translate(s * 5 + (s > 0 ? 0 : -3), 0, 0), M.clip, 'clipSwivel.ear' + (i + 1)));
    });
    // 테이퍼 C 슬리브 (lathe 로컬: Y = 클립 축, y 0 = 좁은 끝(케이블 쪽), y len = 넓은 끝(그릴 쪽), 열린 곳 = -Z(φ=π))
    var body = grp('clipBody'); body.rotation.x = Math.PI / 2; setMM(body, 0, CL.axisOffset, -CL.len / 2); swivel.add(reg('clipBody', body));
    var gap = CL.gapDeg * Math.PI / 180, p0 = Math.PI + gap / 2, pl = Math.PI * 2 - gap, W = CL.wall;
    var prof = [[CL.rIn0, 0], [CL.rIn0 + W, 0], [CL.rIn1 + W, CL.len], [CL.rIn1, CL.len]];
    body.add(mk(lathe([prof[1], prof[2]], 72, p0, pl), M.clip, 'clipBody.outer'));
    body.add(mk(lathe([prof[3], prof[0]], 72, p0, pl), M.clip, 'clipBody.inner'));
    body.add(mk(lathe([prof[0], prof[1]], 72, p0, pl), M.clip, 'clipBody.endNarrow'));
    body.add(mk(lathe([prof[2], prof[3]], 72, p0, pl), M.clip, 'clipBody.endWide'));
    [p0, p0 + pl].forEach(function (phi, i) { var sh = new THREE.Shape(prof.map(function (q) { return new THREE.Vector2(q[0], q[1]); }));
      body.add(mk(new THREE.ShapeGeometry(sh).rotateY(phi - Math.PI / 2), M.clip, 'clipBody.lip' + (i + 1))); });
    body.add(mk(new THREE.BoxGeometry(16, 10, 10).translate(0, CL.len / 2, CL.rIn1 + W + 4), M.clip, 'clipBody.spine'));   // 귀와 이어지는 등판(+Z = 회전축 쪽)
    var aC = new THREE.Object3D(); aC.name = NS + '.port.micClip';
    aC.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new V3(-1, 0, 0), new V3(0, 0, -1), new V3(0, -1, 0)));
    body.add(aC); ports.micClip = aC;
    aC.userData = { portId: 'micClip', type: 'mic-clip-a25d', role: 'mechanical', accepts: ['handheld-mic-handle-25-30mm'], insertDepthMM: DIM.micSeatMM,
      localNormal: new V3(), insertDirection: new V3(), keyDirection: new V3(), localPosition: new V3(), gripDiameterMM: CLIP_SPEC.gripDiameterMM.slice(), boreDiameterMM: [CL.rIn0 * 2, CL.rIn1 * 2], clipLengthMM: CL.len,
      note: '삽입 깊이 = 기준점에서 마이크 원점(XLR 림)까지 법선 방향 거리. 마이크는 열린 쪽(+Y)에서 끼움' };

    var state = { pose: {}, mounted: null };
    function refreshLocal() { root.updateMatrixWorld(true); var inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), q = new THREE.Quaternion(), rq = new THREE.Quaternion(); root.getWorldQuaternion(rq);
      [aT, aC].forEach(function (a) { var u = a.userData, p = new V3(); a.getWorldPosition(p); u.localPosition.copy(p.applyMatrix4(inv)); a.getWorldQuaternion(q); q.premultiply(rq.clone().invert());
        u.localNormal.set(0, 0, 1).applyQuaternion(q); u.insertDirection.copy(u.localNormal).negate(); u.keyDirection.set(0, 1, 0).applyQuaternion(q); }); }
    function clampv(v, r) { return Math.min(r[1], Math.max(r[0], v)); }
    var api = {
      setPose: function (p) {
        var s = state.pose; p = p || {};
        s.heightMM = clampv(p.heightMM !== undefined ? +p.heightMM : (s.heightMM || 1300), [SPEC.heightMinMM, SPEC.heightMaxMM]);
        s.boomLengthMM = clampv(p.boomLengthMM !== undefined ? +p.boomLengthMM : (s.boomLengthMM || 600), [SPEC.boomMinMM, SPEC.boomMaxMM]);
        s.boomAngleDeg = clampv(p.boomAngleDeg !== undefined ? +p.boomAngleDeg : (s.boomAngleDeg !== undefined ? s.boomAngleDeg : 25), DIM.limits.boomAngle);
        s.yawDeg = p.yawDeg !== undefined ? +p.yawDeg : (s.yawDeg || 0);
        s.clipTiltDeg = clampv(p.clipTiltDeg !== undefined ? +p.clipTiltDeg : (s.clipTiltDeg !== undefined ? s.clipTiltDeg : 55), DIM.limits.clipTilt);
        mast.position.y = s.heightMM * MM; mast.rotation.y = s.yawDeg * Math.PI / 180;
        boom.rotation.x = -s.boomAngleDeg * Math.PI / 180;
        inner.position.z = (B.front + (s.boomLengthMM - SPEC.boomMinMM)) * MM;
        swivel.rotation.x = -s.clipTiltDeg * Math.PI / 180;
        refreshLocal();
        if (state.mounted) mountMic(root, state.mounted.api, state.mounted.root, state.mounted.opts);
        return api.getPose();
      },
      getPose: function () { return JSON.parse(JSON.stringify(state.pose)); },
      getState: function () { var m = state.mounted; return { pose: api.getPose(), mounted: m ? { model: (m.root.userData.info && m.root.userData.info.model) || (m.api.NAMESPACE === 'shureSm58' ? 'Shure SM58' : m.root.name), seatMM: DIM.micSeatMM } : null }; }
    };
    root.userData[NS] = { api: api }; hide(root.userData[NS], 'parts', parts); hide(root.userData[NS], 'ports', ports); hide(root.userData[NS], 'state', state); hide(root.userData[NS], 'legs', legs);
    root.userData.info = { model: 'K&M 210/9 계열 마이크 붐 스탠드 + A25D 계열 클립', spec: SPEC, clip: CLIP_SPEC, units: 'm' };
    api.setPose(o.pose || {});
    return root;
  }

  function findAnchor(root, id) { return root.getObjectByName(NS + '.port.' + id); }
  function getPortInfo(root, id) {
    var a = findAnchor(root, id); if (!a) return null; root.updateWorldMatrix(true, true);
    var u = a.userData, wp = new V3(), wq = new THREE.Quaternion(); a.getWorldPosition(wp); a.getWorldQuaternion(wq);
    var inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), lp = wp.clone().applyMatrix4(inv), rq = root.getWorldQuaternion(new THREE.Quaternion()), lq = wq.clone().premultiply(rq.clone().invert());
    var ln = new V3(0, 0, 1).applyQuaternion(lq), lk = new V3(0, 1, 0).applyQuaternion(lq);
    var wn = new V3(0, 0, 1).applyQuaternion(wq).normalize(), wk = new V3(0, 1, 0).applyQuaternion(wq).normalize();
    var scale = ln.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(root.matrixWorld)).length();
    return { id: u.portId, type: u.type, role: u.role, accepts: u.accepts.slice(), localPosition: lp, localNormal: ln, insertDirectionLocal: ln.clone().negate(), keyDirectionLocal: lk,
      worldPosition: wp, worldNormal: wn, worldInsertDirection: wn.clone().negate(), worldKeyDirection: wk, worldQuaternion: wq, insertDepthMM: u.insertDepthMM, worldInsertDepth: u.insertDepthMM * MM * scale, worldScale: scale, anchor: a };
  }
  function getAllPorts(root) { return ['boomThread', 'micClip'].map(function (id) { return getPortInfo(root, id); }).filter(Boolean); }

  // 마이크 장착: 마이크 원점 = 클립 기준점 + 법선 × 42mm, 마이크 +Y = -법선, 마이크 +Z = 키(rollDeg 만큼 마이크 축 둘레 회전)
  //  micInfo: { type: 'handheld-mic-handle-25-30mm' } 를 생략하면 SM58 로 간주(손잡이 지름이 25~30mm 인지 PROFILE_MM 로 확인)
  function mountMic(standRoot, micApi, micRoot, opts) {
    var o = opts || {}, st = standRoot.userData[NS].state, c = getPortInfo(standRoot, 'micClip');
    if (!micRoot || !micApi) return { ok: false, reason: '마이크 모델이 없음' };
    var prof = micApi.PROFILE_MM && micApi.PROFILE_MM.handle;
    if (!prof) return { ok: false, reason: '손잡이 단면 정보가 없는 모델은 클립에 끼울 수 없음' };
    var rAt = function (y) { for (var i = 1; i < prof.length; i++) if (y <= prof[i][1]) { var a = prof[i - 1], b = prof[i]; return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); } return prof[prof.length - 1][0]; };
    var d0 = 2 * rAt(DIM.micSeatMM), d1 = 2 * rAt(DIM.micSeatMM + DIM.clip.len), g = CLIP_SPEC.gripDiameterMM;
    if (d0 < g[0] - 1e-9 || d1 > g[1] + 1e-9) return { ok: false, reason: '손잡이 지름 ' + d0.toFixed(1) + '~' + d1.toFixed(1) + 'mm 가 클립 범위 25~30mm 밖' };
    var n = c.worldNormal, key = c.worldKeyDirection.clone().applyAxisAngle(n, (o.rollDeg || 0) * Math.PI / 180), up = n.clone().negate();
    var Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new V3().crossVectors(up, key), up, key));
    micRoot.updateWorldMatrix(true, false);
    var sc = new V3(); micRoot.matrixWorld.decompose(new V3(), new THREE.Quaternion(), sc);
    var P = c.worldPosition.clone().addScaledVector(n, c.worldInsertDepth);
    var world = new THREE.Matrix4().compose(P, Q, sc), local = micRoot.parent ? new THREE.Matrix4().copy(micRoot.parent.matrixWorld).invert().multiply(world) : world;
    local.decompose(micRoot.position, micRoot.quaternion, micRoot.scale); micRoot.updateMatrixWorld(true);
    st.mounted = { api: micApi, root: micRoot, opts: o };
    return { ok: true, seatMM: DIM.micSeatMM, handleDiameterMM: [+d0.toFixed(2), +d1.toFixed(2)], boreDiameterMM: [DIM.clip.rIn0 * 2, DIM.clip.rIn1 * 2] };
  }
  function unmountMic(standRoot) { var st = standRoot.userData[NS].state, m = st.mounted; st.mounted = null; return m ? m.root : null; }
  // 넘어짐 여유(정보용): 부품별 질량(추정)으로 질량 중심을 구해 다리 세 점 삼각형 가장자리까지 거리
  function stabilityInfo(standRoot, micKg) {
    var d = standRoot.userData[NS], parts = d.parts; standRoot.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(standRoot.matrixWorld).invert(), c = function (obj) { var b = new THREE.Box3().setFromObject(obj), p = b.getCenter(new V3()); return p.applyMatrix4(inv).multiplyScalar(1 / MM); };
    var L = [[1.45, c(parts.base)], [0.55, c(parts.lowerTube)], [0.10, c(parts.clutch)], [0.42, c(parts.mast.children[0])], [0.20, c(parts.jointFixed)], [0.38, c(parts.boom.children[1])], [0.12, c(parts.boomInner)], [0.03, c(parts.clip)]];
    if (micKg && d.state.mounted) L.push([micKg, d.state.mounted.root.getWorldPosition(new V3()).applyMatrix4(inv).multiplyScalar(1 / MM)]);
    var m = 0, com = new V3(); L.forEach(function (q) { m += q[0]; com.addScaledVector(q[1], q[0]); }); com.multiplyScalar(1 / m);
    var feet = d.legs.map(function (l) { return new THREE.Vector2(l.foot.x, l.foot.z); }), p = new THREE.Vector2(com.x, com.z), minD = Infinity;
    for (var i = 0; i < 3; i++) { var a = feet[i], b = feet[(i + 1) % 3], e = b.clone().sub(a), nrm = new THREE.Vector2(e.y, -e.x).normalize(); if (nrm.dot(a.clone().negate()) < 0) nrm.negate(); minD = Math.min(minD, nrm.dot(p.clone().sub(a))); }
    return { totalKg: m, com: com, marginMM: minD, tipAngleDeg: Math.atan2(minD, com.y) * 180 / Math.PI };
  }
  function toGear3dPortsLocal(root) { var o = {}; getAllPorts(root).forEach(function (p) { o[p.id] = { pos: p.localPosition.toArray(), normal: p.localNormal.toArray(), type: p.type }; }); return o; }

  window.MicStand = { NAMESPACE: NS, SPEC: SPEC, CLIP_SPEC: CLIP_SPEC, DIM_MM: DIM, create: create, getPortInfo: getPortInfo, getAllPorts: getAllPorts, mountMic: mountMic, unmountMic: unmountMic,
    stabilityInfo: stabilityInfo, toGear3dPortsLocal: toGear3dPortsLocal, api: function (root) { return root.userData[NS].api; } };
})();
