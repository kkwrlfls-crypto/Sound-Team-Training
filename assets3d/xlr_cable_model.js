/*
 * XLR 마이크 케이블 (3핀 암 ↔ 3핀 수) — Sound-Team-Training 3D 에셋 단계 3/8
 *  - Three.js r128 전역 THREE 사용, 단위 m
 *  - 전역 네임스페이스: window.XlrCable (기존 코드와 이름 충돌 없음)
 *
 * 형상 근거
 *  - 암 플러그: Neutrik NC3FXX 공식 도면(2:1) — 전장 71.5~73.5, 몸체 Ø19.2, 노즈 Ø15.75, 핀 배치(정면도 측정)
 *  - 수 플러그: Neutrik NC3MXX 공식 도면(2:1) — 전장 68.1~70.1, 슬리브 Ø19
 *  - 케이블 외경 6.5mm = 프로젝트 gear3d 의 XLR 케이블 반지름 0.00325m 와 같음
 *  - 세부(그립 홈, 부트 곡선, 핀 끝 위치, 래치 치수)는 도면 측면도 비례 측정 또는 추정 — README 참조
 *
 * 플러그 로컬 좌표 (프로젝트 gear3dGetPlugTemplate 과 같은 규칙)
 *  - 원점 = 노즈(결합면) 중심, 몸체는 +Z 로 뻗음, +Y = 키(래치) 방향
 *  - 결합 방향(꽂는 방향) = 로컬 -Z, 케이블 출구 = (0,0,전장), 케이블은 +Z 로 나감
 *  - 장비 단자 기준점(+Z 바깥, +Y 키)과 같은 프레임 → 꽂으면 플러그 회전 = 단자 회전
 *
 * 케이블 몸체
 *  - 위치 기반 동역학(PBD) 사슬: 구간 길이 고정, 최소 굽힘 반경, 중력, 바닥·상자 충돌, 바닥 마찰
 *  - 커넥터는 강체(지오메트리 고정, 위치·회전만 바뀜). 몸체만 매 업데이트마다 TubeGeometry 재생성
 *  - 연결된 끝: 출구점과 다음 점을 플러그 축 위에 고정 → 플러그에서 접선이 이어짐
 *  - 풀린 끝: 플러그를 사슬의 강체 구간으로 넣어 바닥 위에 놓임
 */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { console.error('[XlrCable] THREE(r128) 가 먼저 로드되어야 합니다.'); return; }
  var NS = 'xlrCable', MM = 0.001;

  // ---------------------------------------------------------------------------
  // 치수 (mm)
  // 핀 위치: NC3FXX 정면도 측정 (플러그 로컬 x, y=키). 장비 단자 기준점과 같은 프레임이므로
  //  - 암 플러그(수 리셉터클과 결합): 1번 = x -4.04 → 결합면을 정면에서 보면 1번이 오른쪽 (도면과 같음)
  //  - 수 플러그(암 리셉터클과 결합): 1번 = x +4.04 → 핀 쪽을 정면에서 보면 1번이 왼쪽 (표준 수 커넥터 배치)
  var PINS = [{ n: 1, x: -4.04, y: 0 }, { n: 2, x: 4.04, y: 0 }, { n: 3, x: 0, y: -3.95 }];
  var PINS_MALE = [{ n: 1, x: 4.04, y: 0 }, { n: 2, x: -4.04, y: 0 }, { n: 3, x: 0, y: -3.95 }];
  var FEMALE = {
    lengthMM: 72.5, bodyD: 19.2, noseD: 15.75, noseL: 13.0,          // 공식: 전장 71.5~73.5, Ø19.2, Ø15.75 / 노즈 길이는 측면도 측정(12.7) → 결합 깊이 13.0 에 맞춤
    ring: { z0: 13.0, z1: 14.6, r: 9.1 },                              // 노즈 뒤 턱(받침) — 상대 리셉터클 림에 닿는 면 (측면도 측정 + 추정)
    shell: { z0: 14.6, z1: 29.9 }, ribs: { z0: 29.9, z1: 38.3 },        // 측면도 측정
    chuck: { z0: 38.3, z1: 46.2, r: 10.1 }, boot: { z0: 46.2, z1: 72.5, endR: 6.27 },
    socket: { r: 0.95, entryR: 1.3, entryL: 0.6, depth: 11.0 },          // 접점 소켓 (핀 Ø1.6 기준 추정)
    keySlot: { halfW: 2.3, y0: 2.4 },                                    // 정면도: 폭 4.6, 아래 끝 y=+2.4
    latch: { lever: { z0: 14.6, z1: 24.0, halfW: 3.0, h: 2.6 },          // 측면도 측정
      tongue: { z0: 9.6, z1: 14.6, r0: 7.2, r1: 7.8, halfW: 1.8 },        // 추정: 노즈 키 홈 안의 혀 — 모서리 반지름 8.0 < 실제 규격 보어(Ø16.1, SM58) 반지름 (2026-10-14 수정: 7.9~8.5 → 7.2~7.8)
      tooth: { z0: 9.6, z1: 11.4, r1: 9.55, halfW: 1.8 } }               // 추정: 리셉터클 래치 창(깊이 1.4~3.6)에 걸림
  };
  var MALE = {
    lengthMM: 70.0, sleeveD: 19.0, sleeveID: 16.6,                     // 공식: 전장 68.1~70.1, Ø19 / 내경은 추정(리셉터클 인서트 Ø16 보다 크게)
    shell: { z0: 0, z1: 26.5 }, ribs: { z0: 26.5, z1: 35.8 },           // 측면도 측정
    chuck: { z0: 35.8, z1: 42.3, r: 10.0 }, boot: { z0: 42.3, z1: 70.0, endR: 6.27 },
    carrierZ: 11.0, pinTipZ: 3.0, pinR: 0.8,                             // 추정: 핀 캐리어 면, 핀 끝(슬리브 앞에서 3mm 안쪽), 핀 Ø1.6
    keyGroove: { halfW: 1.5, depth: 0.7, z1: 11.0 }                      // 슬리브 위쪽 키 홈 (추정)
  };
  var CABLE = { odMM: 6.5, minBendRadiusMM: 32, segMM: 25 }; // 최소 굽힘 반경 ≈ 외경의 5배(추정)

  // ---------------------------------------------------------------------------
  function hide(t, k, v) { Object.defineProperty(t, k, { value: v, enumerable: false, writable: true, configurable: true }); return v; }
  function mk(geo, mat, name, opt) {
    geo.scale(MM, MM, MM);
    var m = new THREE.Mesh(geo, mat); m.name = NS + '.' + name; var o = opt || {};
    m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false; return m;
  }
  function grp(name) { var g = new THREE.Group(); g.name = NS + '.' + name; return g; }
  // (r, z) 단면 → Z 축 회전체. 바깥 면은 z 증가 순서, 안쪽 면은 z 감소 순서로 주면 보이는 쪽으로 법선이 향함
  function lathe(pts, segs) {
    var g = new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), segs || 48);
    g.rotateX(Math.PI / 2); // y → z
    return g;
  }
  function circlePath(p, cx, cy, r) { p.absarc(cx, cy, r, 0, Math.PI * 2, false); return p; }

  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return {
      nickel: new S({ color: 0xb9bdc3, roughness: 0.28, metalness: 0.9 }),
      insert: new S({ color: 0x0c0c0d, roughness: 0.6, metalness: 0.0 }),
      contact: new S({ color: 0xdcdde0, roughness: 0.25, metalness: 0.95, side: THREE.DoubleSide }),
      chuck: new S({ color: 0x18191b, roughness: 0.55, metalness: 0.05 }),
      boot: new S({ color: 0x0e0e0f, roughness: 0.72, metalness: 0.0 }),
      jacket: new S({ color: 0x111112, roughness: 0.58, metalness: 0.0 }),
      hole: new S({ color: 0x000000, roughness: 1.0, metalness: 0.0 }),
      print: new S({ color: 0xffffff, roughness: 0.6, transparent: true, alphaTest: 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    };
  }

  // 핀 번호 인쇄 (결합면, -Z 를 향함)
  function pinNumberDecal(M, rFace, name, pins) {
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
    var s = 256 / (rFace * 2);
    g.fillStyle = '#e8e8e8'; g.font = '700 ' + Math.round(1.6 * s) + 'px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    // 결합면을 앞(-Z 쪽)에서 볼 때 로컬 +X 는 화면 왼쪽 → 캔버스 x = (rFace - x)
    var lbl = pins.map(function (p) { return p.n === 3 ? [3, 2.3, -4.2] : [p.n, p.x, 2.4]; });
    lbl.forEach(function (l) { g.fillText(String(l[0]), (rFace - l[1]) * s, (rFace - l[2]) * s); });
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    var mat = M.print.clone(); mat.map = t;
    var m = mk(new THREE.CircleGeometry(rFace, 48), mat, name, { cast: false }); // 원형(결합면 밖으로 나가지 않음)
    m.rotation.y = Math.PI; // 평면 법선 +Z → -Z (앞을 향함)
    return m;
  }

  // ---------------------------------------------------------------------------
  // 공통: 그립 홈(부싱) + 척 + 부트 (z0 부터)
  function gripAndBoot(M, g, prefix, ribs, chuck, boot, rBody) {
    var rr = [], z = ribs.z0, n = 3, L = ribs.z1 - ribs.z0, step = L / (n * 2 + 1);
    rr.push([rBody, z]);
    for (var i = 0; i < n; i++) {
      var a = ribs.z0 + step * (1 + i * 2), b = a + step;
      rr.push([rBody, a - 0.15], [rBody - 0.5, a + 0.1], [rBody - 0.5, b - 0.1], [rBody, b + 0.15]);
    }
    rr.push([rBody, ribs.z1 - 0.3], [rBody - 0.4, ribs.z1]);
    g.add(mk(lathe(rr, 48), M.nickel, prefix + '.grip'));
    var c = chuck, cr = c.r;
    g.add(mk(lathe([[rBody - 0.4, c.z0], [cr - 0.3, c.z0 + 0.1], [cr, c.z0 + 0.6], [cr, c.z1 - 0.6], [cr - 0.3, c.z1 - 0.1], [cr - 0.6, c.z1]], 48), M.chuck, prefix + '.chuck'));
    // 척 둘레 세로 슬롯 4개 (도면의 홈)
    for (var k = 0; k < 4; k++) {
      var sl = mk(new THREE.BoxGeometry(1.0, 0.25, (c.z1 - c.z0) - 2.4), M.hole, prefix + '.chuckSlot' + (k + 1), { cast: false });
      var ang = Math.PI / 4 + k * Math.PI / 2; sl.position.set(Math.cos(ang) * (cr - 0.07) * MM, Math.sin(ang) * (cr - 0.07) * MM, (c.z0 + c.z1) / 2 * MM);
      sl.rotation.z = ang + Math.PI / 2; g.add(sl);
    }
    // 부트: 척 지름에서 시작해 끝 Ø12.5 로 좁아짐, 끝에 케이블 구멍 (측면도 비례)
    var b = boot, Lb = b.z1 - b.z0, cableR = CABLE.odMM / 2 + 0.1;
    var bp = [[cr - 0.6, b.z0], [cr - 0.1, b.z0 + 0.4], [cr, b.z0 + 0.15 * Lb], [cr - 0.25, b.z0 + 0.42 * Lb], [cr - 0.95, b.z0 + 0.58 * Lb],
      [b.endR + 1.5, b.z0 + 0.82 * Lb], [b.endR + 0.35, b.z0 + 0.96 * Lb], [b.endR - 0.3, b.z1 - 0.15], [b.endR - 1.0, b.z1],
      [cableR + 0.4, b.z1], [cableR, b.z1 - 0.4], [cableR, b.z1 - 8]]; // 마지막 두 점: 구멍 안쪽 (z 감소)
    g.add(mk(lathe(bp, 48), M.boot, prefix + '.boot'));
  }

  // ---------------------------------------------------------------------------
  // 암 플러그 (NC3FXX 형) — 마이크 출력/장비 수 리셉터클에 꽂힘
  function buildFemale(M) {
    var F = FEMALE, g = grp('plugFemale'), R = F.noseD / 2, rBody = F.bodyD / 2;
    // 1) 노즈 = 검정 인서트 (키 슬롯 + 소켓 구멍 3개), z 0 → 13
    var s = new THREE.Shape(), hw = F.keySlot.halfW, yE = Math.sqrt(R * R - hw * hw), a = Math.atan2(yE, hw);
    s.moveTo(hw, yE); s.lineTo(hw, F.keySlot.y0); s.lineTo(-hw, F.keySlot.y0); s.lineTo(-hw, yE);
    s.absarc(0, 0, R, Math.PI - a, 2 * Math.PI + a, false);
    PINS.forEach(function (p) { s.holes.push(circlePath(new THREE.Path(), p.x, p.y, F.socket.entryR)); });
    g.add(mk(new THREE.ExtrudeGeometry(s, { depth: F.noseL, bevelEnabled: false, curveSegments: 64 }), M.insert, 'female.insert'));
    // 키 슬롯 바닥(안쪽 끝) 막음
    var slotEnd = mk(new THREE.PlaneGeometry(hw * 2, yE - F.keySlot.y0), M.insert, 'female.keySlotEnd', { cast: false });
    slotEnd.position.set(0, (F.keySlot.y0 + yE) / 2 * MM, (F.noseL - 0.01) * MM); slotEnd.rotation.y = Math.PI; g.add(slotEnd);
    // 2) 접점 소켓: 입구 모따기(원뿔) + 은도금 관 + 바닥
    PINS.forEach(function (p) {
      var S = F.socket;
      var cone = mk(new THREE.CylinderGeometry(S.entryR, S.r, S.entryL, 24, 1, true).rotateX(-Math.PI / 2).translate(p.x, p.y, S.entryL / 2), M.contact, 'female.socket' + p.n + '.entry', { cast: false });
      var tube = mk(new THREE.CylinderGeometry(S.r, S.r, S.depth - S.entryL, 24, 1, true).rotateX(-Math.PI / 2).translate(p.x, p.y, S.entryL + (S.depth - S.entryL) / 2), M.contact, 'female.socket' + p.n, { cast: false });
      var bot = mk(new THREE.CircleGeometry(S.r, 24).rotateY(Math.PI).translate(p.x, p.y, S.depth), M.contact, 'female.socket' + p.n + '.bottom', { cast: false });
      g.add(cone); g.add(tube); g.add(bot);
    });
    var pn = pinNumberDecal(M, R - 0.3, 'female.pinNumbers', PINS); g.add(pn); // 결합면과 같은 평면 (polygonOffset 으로 앞에 그림)
    // 3) 니켈 하우징: 턱(링) → 몸체 → 그립 홈
    var rg = F.ring, sh = F.shell;
    g.add(mk(lathe([[R, rg.z0], [rg.r - 0.3, rg.z0], [rg.r, rg.z0 + 0.3], [rg.r, rg.z1 - 0.2], [rBody - 0.2, sh.z0], [rBody, sh.z0 + 0.3], [rBody, sh.z1]], 48), M.nickel, 'female.housing'));
    gripAndBoot(M, g, 'female', F.ribs, F.chuck, F.boot, rBody);
    // 4) 래치: 몸체 위 누름 레버 + 노즈 위 혀 + 걸쇠 이빨 (키 +Y 쪽)
    var L = F.latch, lv = L.lever;
    var lvS = new THREE.Shape(); // (z, y) 단면 → x 방향 두께
    lvS.moveTo(lv.z0, rBody - 0.6); lvS.lineTo(lv.z1, rBody - 0.6); lvS.lineTo(lv.z1, rBody + 0.6); lvS.lineTo(lv.z0 + 4.0, rBody + lv.h); lvS.lineTo(lv.z0 + 0.8, rBody + lv.h); lvS.lineTo(lv.z0, rBody + lv.h - 0.8); lvS.closePath();
    var lvG = new THREE.ExtrudeGeometry(lvS, { depth: lv.halfW * 2, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2 });
    lvG.translate(0, 0, -lv.halfW); lvG.rotateY(-Math.PI / 2); // shape x(=z) → 로컬 z, 두께 → x
    var lever = mk(lvG, M.nickel, 'female.latchLever'); g.add(lever);
    for (var r = 0; r < 4; r++) { var gr = mk(new THREE.BoxGeometry(lv.halfW * 1.6, 0.25, 0.4), M.hole, 'female.latchGrip' + (r + 1), { cast: false }); gr.position.set(0, (rBody + lv.h + 0.02) * MM, (lv.z0 + 1.6 + r * 0.9) * MM); g.add(gr); }
    var tg = L.tongue;
    g.add(mk(new THREE.BoxGeometry(tg.halfW * 2, tg.r1 - tg.r0, tg.z1 - tg.z0).translate(0, (tg.r0 + tg.r1) / 2, (tg.z0 + tg.z1) / 2), M.nickel, 'female.latchTongue'));
    var th = L.tooth;
    var toothS = new THREE.Shape(); toothS.moveTo(th.z0, tg.r1); toothS.lineTo(th.z1, tg.r1); toothS.lineTo(th.z1, th.r1); toothS.lineTo(th.z0 + 0.6, th.r1); toothS.closePath(); // 앞쪽 경사(삽입 시 밀려 들어감)
    var thG = new THREE.ExtrudeGeometry(toothS, { depth: th.halfW * 2, bevelEnabled: false }); thG.translate(0, 0, -th.halfW); thG.rotateY(-Math.PI / 2);
    g.add(mk(thG, M.nickel, 'female.latchTooth'));
    g.userData = { kind: 'female', type: 'xlr3-female-cable-plug', lengthMM: F.lengthMM };
    return g;
  }

  // 수 플러그 (NC3MXX 형) — 믹서 입력(암 리셉터클·콤보)에 꽂힘
  function buildMale(M) {
    var X = MALE, g = grp('plugMale'), Ro = X.sleeveD / 2, Ri = X.sleeveID / 2, kg = X.keyGroove;
    // 1) 슬리브 앞부분(키 홈 있는 관) z 0 → carrierZ
    var s = new THREE.Shape(), aO = Math.asin(kg.halfW / Ro), rIn = Ro - kg.depth, aI = Math.asin(kg.halfW / rIn);
    s.moveTo(kg.halfW, Math.sqrt(Ro * Ro - kg.halfW * kg.halfW));
    s.absarc(0, 0, Ro, Math.PI / 2 - aO, Math.PI / 2 + aO - 2 * Math.PI, true); // 시계 방향으로 한 바퀴(홈 자리 제외)
    s.lineTo(-kg.halfW, Math.sqrt(rIn * rIn - kg.halfW * kg.halfW));
    s.absarc(0, 0, rIn, Math.PI / 2 + aI, Math.PI / 2 - aI, true);
    s.closePath();
    s.holes.push(circlePath(new THREE.Path(), 0, 0, Ri));
    g.add(mk(new THREE.ExtrudeGeometry(s, { depth: X.carrierZ, bevelEnabled: false, curveSegments: 72 }), M.nickel, 'male.sleeve'));
    // 2) 몸체 (캐리어 면 뒤)
    g.add(mk(lathe([[Ro, X.carrierZ], [Ro, X.shell.z1]], 48), M.nickel, 'male.shell'));
    // 3) 핀 캐리어(검정 인서트 면) + 핀 3개
    var car = new THREE.CircleGeometry(Ri, 48); car.rotateY(Math.PI); car.translate(0, 0, X.carrierZ);
    g.add(mk(car, M.insert, 'male.pinCarrier', { cast: false }));
    PINS_MALE.forEach(function (p) {
      var len = X.carrierZ - X.pinTipZ - X.pinR;
      var pin = mk(new THREE.CylinderGeometry(X.pinR, X.pinR, len, 24, 1, true).rotateX(-Math.PI / 2).translate(p.x, p.y, X.pinTipZ + X.pinR + len / 2), M.contact, 'male.pin' + p.n);
      var tip = mk(new THREE.SphereGeometry(X.pinR, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(-Math.PI / 2).translate(p.x, p.y, X.pinTipZ + X.pinR), M.contact, 'male.pin' + p.n + '.tip');
      g.add(pin); g.add(tip);
    });
    var pn = pinNumberDecal(M, Ri - 0.3, 'male.pinNumbers', PINS_MALE); pn.position.z = X.carrierZ * MM; g.add(pn);
    gripAndBoot(M, g, 'male', X.ribs, X.chuck, X.boot, Ro);
    g.userData = { kind: 'male', type: 'xlr3-male-cable-plug', lengthMM: X.lengthMM };
    return g;
  }

  var PLUG_META = {
    female: { type: 'xlr3-female-cable-plug', matesWith: ['xlr3-male'], lengthMM: FEMALE.lengthMM, maxRadiusMM: FEMALE.bodyD / 2 + FEMALE.latch.lever.h,
      pinsMM: PINS.map(function (p) { return { n: p.n, x: p.x, y: p.y, kind: 'socket', socketR: FEMALE.socket.r, depth: FEMALE.socket.depth }; }) },
    male: { type: 'xlr3-male-cable-plug', matesWith: ['xlr3-female', 'combo-xlr3-female-phone'], lengthMM: MALE.lengthMM, maxRadiusMM: MALE.chuck.r,
      pinsMM: PINS_MALE.map(function (p) { return { n: p.n, x: p.x, y: p.y, kind: 'pin', pinR: MALE.pinR, tipZ: MALE.pinTipZ, baseZ: MALE.carrierZ }; }) }
  };

  // 플러그 하나만 (단독 표시·다른 코드 재사용용). 결합 기준점 정보 포함
  function buildPlug(kind, materials) {
    var M = materials || makeMaterials(), g = kind === 'male' ? buildMale(M) : buildFemale(M), meta = PLUG_META[kind];
    g.userData.reference = {
      name: kind === 'male' ? 'XLR3 수 플러그(NC3MXX 형)' : 'XLR3 암 플러그(NC3FXX 형)', type: meta.type, matesWith: meta.matesWith.slice(),
      localMatingPoint: new THREE.Vector3(0, 0, 0), localMatingDirection: new THREE.Vector3(0, 0, -1), localKeyDirection: new THREE.Vector3(0, 1, 0),
      localCableExit: new THREE.Vector3(0, 0, meta.lengthMM * MM), localCableDirection: new THREE.Vector3(0, 0, 1), pinsMM: meta.pinsMM
    };
    g.traverse(function (o) { if (o.isMesh) o.userData.rigidPlugPart = true; });
    return g;
  }

  // ---------------------------------------------------------------------------
  // 케이블
  var V3 = THREE.Vector3;
  function create(options) {
    var o = options || {};
    var lengthM = o.lengthM || 5.0, seg = (o.segmentMM || CABLE.segMM) * MM, r = (o.odMM || CABLE.odMM) / 2 * MM;
    var M = makeMaterials(); if (o.jacketColor !== undefined) M.jacket.color.set(o.jacketColor);
    var root = new THREE.Group(); root.name = NS + 'Root' + (o.name ? '.' + o.name : '');
    var plugs = { female: buildPlug('female', M), male: buildPlug('male', M) };
    root.add(plugs.female); root.add(plugs.male);
    var body = new THREE.Mesh(new THREE.BufferGeometry(), M.jacket); body.name = NS + '.jacket'; body.castShadow = true; body.receiveShadow = true; root.add(body);
    var n = Math.max(8, Math.round(lengthM / seg)); seg = lengthM / n; // 구간 수 정수화
    var st = {
      lengthM: lengthM, seg: seg, n: n, r: r, M: M, plugs: plugs, body: body,
      minBendRadius: (o.minBendRadiusMM || CABLE.minBendRadiusMM) * MM,
      floorY: o.floorY !== undefined ? o.floorY : 0, colliders: (o.colliders || []).slice(),
      gravity: 9.81, friction: o.friction !== undefined ? o.friction : 0.85,
      ends: { female: { attach: null, free: null }, male: { attach: null, free: null } },
      nodes: null, prev: null, initialized: false, stats: null, route: o.route || null
    };
    hide(root.userData, NS, st);
    root.userData.xlrCableInfo = { lengthM: lengthM, odMM: r * 2 / MM, segments: n, ends: ['female', 'male'] };
    return root;
  }
  function S(root) { var s = root && root.userData[NS]; if (!s) throw new Error('[XlrCable] 케이블 루트가 아닙니다'); return s; }

  // 단자 호환 검사: 플러그 종류 ↔ 단자 종류 / 단자가 받는 커넥터
  function compatibility(kind, port) {
    var meta = PLUG_META[kind];
    if (!port) return { ok: false, reason: '단자를 찾을 수 없음' };
    if (meta.matesWith.indexOf(port.type) < 0) return { ok: false, reason: meta.type + ' 는 ' + port.type + ' 단자에 꽂을 수 없음' };
    if (port.accepts && port.accepts.indexOf(meta.type) < 0) return { ok: false, reason: port.type + ' 단자가 ' + meta.type + ' 를 받지 않음' };
    return { ok: true };
  }
  // deviceApi: getPortInfo(root, id) 를 가진 장비 모듈 (ShureSM58, YamahaMG12XU 등)
  function connect(root, end, deviceApi, deviceRoot, portId) {
    var s = S(root), port = deviceApi.getPortInfo(deviceRoot, portId), c = compatibility(end, port);
    if (!c.ok) return c;
    s.ends[end].attach = { api: deviceApi, root: deviceRoot, portId: portId };
    s.ends[end].free = null;
    return { ok: true, port: port };
  }
  function disconnect(root, end, freePose) {
    var s = S(root); s.ends[end].attach = null;
    s.ends[end].free = freePose || null;
  }
  function setColliders(root, boxes) { S(root).colliders = boxes.slice(); }

  // 연결된 끝의 플러그 자세(월드): 단자 기준점 회전 그대로, 노즈가 삽입 깊이만큼 안으로
  function seatedPose(s, end) {
    var a = s.ends[end].attach; if (!a) return null;
    var p = a.api.getPortInfo(a.root, a.portId);
    var depth = p.worldInsertDepth;
    var pos = p.worldPosition.clone().addScaledVector(p.worldNormal, -depth);
    return { position: pos, quaternion: p.worldQuaternion.clone(), port: p };
  }
  function plugExitWorld(pose, kind) { return new V3(0, 0, PLUG_META[kind].lengthMM * MM).applyQuaternion(pose.quaternion).add(pose.position); }
  function plugAxisWorld(pose) { return new V3(0, 0, 1).applyQuaternion(pose.quaternion); }

  // 초기 경로: 정확한 길이의 폴리라인 (출구 → 접선 → 경유점 → … → 반대 출구)
  function buildInitialPath(s, A, tA, B, tB, waypoints, freeEnd) {
    var lead = Math.min(0.06, s.lengthM * 0.05), pts = [A.clone(), A.clone().addScaledVector(tA, lead)];
    var fy = s.floorY + s.r;
    var wp = (waypoints && waypoints.length) ? waypoints.map(function (w) { return w.clone(); }) : null;
    if (!wp) { wp = [new V3(pts[1].x, fy, pts[1].z)]; if (B) wp.push(new V3(B.x + tB.x * lead, fy, B.z + tB.z * lead)); }
    wp.forEach(function (w) { pts.push(w); });
    if (B) { pts.push(B.clone().addScaledVector(tB, lead)); pts.push(B.clone()); }
    var len = 0; for (var i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
    var extra = s.lengthM - len;
    if (!B) { // 풀린 끝: 마지막 경유점에서 지정 방향으로 남은 길이만큼 바닥 위로
      var dir = (freeEnd && freeEnd.direction ? freeEnd.direction.clone() : new V3(1, 0, 0)); dir.y = 0; dir.normalize();
      if (extra > 0) pts.push(pts[pts.length - 1].clone().setY(fy).addScaledVector(dir, extra));
      return resample(pts, s.n);
    }
    if (extra > 0) { // 가장 긴 바닥 구간을 옆으로 휘게(사인) 해서 남는 길이를 흡수
      var best = -1, bl = 0;
      for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k]; if (Math.abs(a.y - fy) < 1e-6 && Math.abs(b.y - fy) < 1e-6 && a.distanceTo(b) > bl) { bl = a.distanceTo(b); best = k; } }
      if (best < 0) { // 바닥 구간이 없으면 가장 긴 구간
        for (var k2 = 1; k2 < pts.length; k2++) { var d2 = pts[k2].distanceTo(pts[k2 - 1]); if (d2 > bl) { bl = d2; best = k2; } }
      }
      var a0 = pts[best - 1], b0 = pts[best], axis = b0.clone().sub(a0), side = new V3(-axis.z, 0, axis.x).normalize();
      if (side.lengthSq() < 1e-9) side.set(1, 0, 0);
      var waves = Math.max(1, Math.round(bl / 0.6)), target = bl + extra;
      var curve = function (amp) { var out = []; for (var q = 0; q <= 64; q++) { var t = q / 64; out.push(a0.clone().lerp(b0, t).addScaledVector(side, amp * Math.sin(Math.PI * waves * t))); } return out; };
      var plen = function (arr) { var L = 0; for (var q = 1; q < arr.length; q++) L += arr[q].distanceTo(arr[q - 1]); return L; };
      var lo = 0, hi = 5; for (var it = 0; it < 60; it++) { var mid = (lo + hi) / 2; if (plen(curve(mid)) < target) lo = mid; else hi = mid; }
      var wig = curve((lo + hi) / 2); pts.splice.apply(pts, [best - 1, 2].concat(wig));
    }
    return resample(pts, s.n);
  }
  function resample(pts, n) {
    var cum = [0]; for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    var total = cum[cum.length - 1], out = [], j = 1;
    for (var k = 0; k <= n; k++) {
      var d = total * k / n; while (j < cum.length - 1 && cum[j] < d) j++;
      var t = (d - cum[j - 1]) / Math.max(cum[j] - cum[j - 1], 1e-12); out.push(pts[j - 1].clone().lerp(pts[j], Math.min(Math.max(t, 0), 1)));
    }
    return out;
  }

  // 사슬 구성: [풀린 암 플러그 노즈?] + 케이블 노드 0..n + [풀린 수 플러그 노즈?]
  function solve(s, steps, iterations, o2) {
    var P = s.nodes, Q = s.prev, n = s.n, seg = s.seg, r = s.r;
    var poseF = seatedPose(s, 'female'), poseM = seatedPose(s, 'male');
    var pin = new Array(n + 1).fill(null);
    if (poseF) { var eF = plugExitWorld(poseF, 'female'), aF = plugAxisWorld(poseF); pin[0] = eF; pin[1] = eF.clone().addScaledVector(aF, seg); }
    if (poseM) { var eM = plugExitWorld(poseM, 'male'), aM = plugAxisWorld(poseM); pin[n] = eM; pin[n - 1] = eM.clone().addScaledVector(aM, seg); }
    // 풀린 끝 = 플러그 강체 구간(노즈 점) 추가
    var LF = FEMALE.lengthMM * MM, LMl = MALE.lengthMM * MM;
    var nf = s.noseF, nm = s.noseM;
    if (!poseF && !nf) { nf = s.noseF = { p: P[0].clone().addScaledVector(P[0].clone().sub(P[1]).normalize(), LF), q: null }; nf.q = nf.p.clone(); }
    if (!poseM && !nm) { nm = s.noseM = { p: P[n].clone().addScaledVector(P[n].clone().sub(P[n - 1]).normalize(), LMl), q: null }; nm.q = nm.p.clone(); }
    if (poseF) s.noseF = nf = null; if (poseM) s.noseM = nm = null;
    var dt = 1 / 120, g = -s.gravity * dt * dt, damp = 0.985;
    var minSkip = 2 * seg * Math.cos(Math.min(seg / s.minBendRadius, 1.2) / 2); // 최소 굽힘 반경 → i,i+2 최소 거리
    // 풀린 플러그가 바닥/상자 위에 놓일 때: 노즈 쪽은 몸체 반지름, 출구 쪽은 척(가장 굵은 곳) 반지름만큼 띄움
    var plugR = { female: FEMALE.bodyD / 2 * MM, male: MALE.sleeveD / 2 * MM }, chuckR = { female: FEMALE.chuck.r * MM, male: MALE.chuck.r * MM };
    var fy = s.floorY, cols = s.colliders, tmp = new V3();
    // 접촉 마찰(정지/운동): 접선 이동량이 침투 깊이×μs 보다 작으면 붙잡고, 크면 μk 만큼 줄임
    var MU_S = 1.2, MU_K = 0.7;
    function friction(p, q, depth) {
      if (!q) return; var dx = p.x - q.x, dz = p.z - q.z, d = Math.sqrt(dx * dx + dz * dz);
      if (d < MU_S * depth) { p.x = q.x; p.z = q.z; }
      else if (d > 0) { var k = Math.min(MU_K * depth / d, 1); p.x -= dx * k; p.z -= dz * k; }
    }
    function floorPush(p, rad, q) {
      if (p.y < fy + rad) { var dep = fy + rad - p.y; p.y = fy + rad; friction(p, q, dep); return true; } return false;
    }
    function boxPush(p, rad, q) {
      for (var c = 0; c < cols.length; c++) {
        var b = cols[c];
        if (p.x > b.min.x - rad && p.x < b.max.x + rad && p.y > b.min.y - rad && p.y < b.max.y + rad && p.z > b.min.z - rad && p.z < b.max.z + rad) {
          // 가장 가까운 면으로 밀어냄. 바닥에 놓인 상자는 아랫면으로 밀지 않음(바닥 아래로 빠지지 않게)
          var cand = [[p.x - (b.min.x - rad), 0], [(b.max.x + rad) - p.x, 1], [(b.max.y + rad) - p.y, 3], [p.z - (b.min.z - rad), 4], [(b.max.z + rad) - p.z, 5]];
          if (b.min.y > fy + 1e-6) cand.push([p.y - (b.min.y - rad), 2]);
          var best = cand[0]; for (var k = 1; k < cand.length; k++) if (cand[k][0] < best[0]) best = cand[k];
          switch (best[1]) {
            case 0: p.x = b.min.x - rad; break; case 1: p.x = b.max.x + rad; break; case 2: p.y = b.min.y - rad; break;
            case 3: p.y = b.max.y + rad; friction(p, q, best[0]); break; case 4: p.z = b.min.z - rad; break; default: p.z = b.max.z + rad;
          }
        }
      }
    }
    var omega = 1.0; // 과이완 계수(마지막 투영 단계에서만 >1)
    function dist(a, b, rest, wa, wb) {
      var dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d < 1e-12) return;
      var w = wa + wb; if (w === 0) return; var k = omega * (d - rest) / (d * w);
      a.x += dx * k * wa; a.y += dy * k * wa; a.z += dz * k * wa; b.x -= dx * k * wb; b.y -= dy * k * wb; b.z -= dz * k * wb;
    }
    function minDist(a, b, rest, wa, wb) { var d = a.distanceTo(b); if (d >= rest) return; dist(a, b, rest, wa, wb); }
    var w = P.map(function (_, i) { return pin[i] ? 0 : 1; });
    for (var i0 = 0; i0 <= n; i0++) if (pin[i0]) { P[i0].copy(pin[i0]); Q[i0].copy(pin[i0]); }
    for (var step = 0; step < steps; step++) {
      for (var i = 0; i <= n; i++) {
        if (!w[i]) continue; var p = P[i], q = Q[i];
        tmp.subVectors(p, q).multiplyScalar(damp); q.copy(p); p.add(tmp); p.y += g;
      }
      [nf, nm].forEach(function (e) { if (!e) return; tmp.subVectors(e.p, e.q).multiplyScalar(damp); e.q.copy(e.p); e.p.add(tmp); e.p.y += g; });
      project(iterations, true);
    }
    // 마지막: 적분 없이 제약만 반복 투영 → 구간 길이·바닥·굽힘을 정지 상태로 맞춤
    omega = 1.7;
    for (var fi = 0; fi < o2.finalIterations; fi += 50) { project(50, false); if (maxSegErr() < 0.0015) break; }
    omega = 1.0; project(20, false); s.lastFinalIterations = fi + 70;
    function maxSegErr() { var m = 0; for (var k = 0; k < n; k++) m = Math.max(m, Math.abs(P[k].distanceTo(P[k + 1]) - seg) / seg); return m; }
    function project(iterations, friction) {
      for (var it = 0; it < iterations; it++) {
        if (it % 2 === 0) { for (var j = 0; j < n; j++) dist(P[j], P[j + 1], seg, w[j], w[j + 1]); }
        else { for (var jb = n - 1; jb >= 0; jb--) dist(P[jb], P[jb + 1], seg, w[jb], w[jb + 1]); }
        for (var j2 = 0; j2 < n - 1; j2++) minDist(P[j2], P[j2 + 2], minSkip, w[j2], w[j2 + 2]);
        // 풀린 플러그 = 강체 구간 (노즈-출구 길이 고정, 출구 다음 점과 일직선)
        if (nf) { dist(nf.p, P[0], LF, 1, w[0] * 0.5); dist(nf.p, P[1], LF + seg, 1, w[1] * 0.5); }
        if (nm) { dist(nm.p, P[n], LMl, 1, w[n] * 0.5); dist(nm.p, P[n - 1], LMl + seg, 1, w[n - 1] * 0.5); }
        var fr = friction && it === iterations - 1;
        for (var c = 0; c <= n; c++) { if (!w[c]) continue; floorPush(P[c], r, fr ? Q[c] : null); boxPush(P[c], r, fr ? Q[c] : null); }
        if (nf) { floorPush(nf.p, plugR.female, fr ? nf.q : null); floorPush(P[0], chuckR.female, null); boxPush(nf.p, plugR.female, fr ? nf.q : null); boxPush(P[0], chuckR.female, null); }
        if (nm) { floorPush(nm.p, plugR.male, fr ? nm.q : null); floorPush(P[n], chuckR.male, null); boxPush(nm.p, plugR.male, fr ? nm.q : null); boxPush(P[n], chuckR.male, null); }
      }
    }
    for (var z = 0; z <= n; z++) Q[z].copy(P[z]); // 정지 상태로 저장(다음 업데이트에서 튀지 않게)
    if (nf) nf.q.copy(nf.p); if (nm) nm.q.copy(nm.p);
    return { poseF: poseF, poseM: poseM };
  }

  function freePose(nose, exit, kind) {
    var z = exit.clone().sub(nose).normalize(), up = new V3(0, 1, 0);
    if (Math.abs(z.dot(up)) > 0.98) up.set(0, 0, 1);
    var x = new V3().crossVectors(up, z).normalize(), y = new V3().crossVectors(z, x);
    var q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    return { position: nose.clone(), quaternion: q };
  }
  function applyPose(root, plug, pose) {
    root.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    var m = new THREE.Matrix4().compose(pose.position, pose.quaternion, new V3(1, 1, 1)).premultiply(inv);
    m.decompose(plug.position, plug.quaternion, plug.scale); plug.updateMatrixWorld(true);
  }

  function rebuildTube(root, s, poses) {
    root.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), pts = [];
    var aF = new V3(0, 0, 1).applyQuaternion(poses.female.quaternion), aM = new V3(0, 0, 1).applyQuaternion(poses.male.quaternion);
    pts.push(s.nodes[0].clone().addScaledVector(aF, -0.006)); // 부트 안으로 6mm 들어간 데서 시작 (틈 없음)
    s.nodes.forEach(function (p) { pts.push(p.clone()); });
    pts.push(s.nodes[s.n].clone().addScaledVector(aM, -0.006));
    var local = pts.map(function (p) { return p.applyMatrix4(inv); });
    var curve = new THREE.CatmullRomCurve3(local, false, 'centripetal');
    var geo = new THREE.TubeGeometry(curve, Math.min(4000, s.n * 4), s.r, 12, false);
    if (s.body.geometry) s.body.geometry.dispose();
    s.body.geometry = geo; s.curve = curve;
  }

  function computeStats(s, poses) {
    var n = s.n, P = s.nodes, maxErr = 0, total = 0, minY = Infinity, maxBend = 0, inBox = 0;
    for (var i = 0; i < n; i++) { var d = P[i].distanceTo(P[i + 1]); total += d; maxErr = Math.max(maxErr, Math.abs(d - s.seg) / s.seg); }
    for (var j = 1; j < n; j++) { var a = P[j].clone().sub(P[j - 1]).normalize(), b = P[j + 1].clone().sub(P[j]).normalize(); maxBend = Math.max(maxBend, Math.acos(Math.min(1, Math.max(-1, a.dot(b))))); }
    P.forEach(function (p) { minY = Math.min(minY, p.y - s.r - s.floorY);
      s.colliders.forEach(function (b) { if (p.x > b.min.x + 1e-4 && p.x < b.max.x - 1e-4 && p.y > b.min.y + 1e-4 && p.y < b.max.y - 1e-4 && p.z > b.min.z + 1e-4 && p.z < b.max.z - 1e-4) inBox++; }); });
    var tangent = {};
    ['female', 'male'].forEach(function (e) {
      var ax = new V3(0, 0, 1).applyQuaternion(poses[e].quaternion), i0 = e === 'female' ? 0 : n, i1 = e === 'female' ? 1 : n - 1;
      var segDir = P[i1].clone().sub(P[i0]).normalize(); tangent[e] = Math.acos(Math.min(1, ax.dot(segDir))) * 180 / Math.PI;
    });
    var straight = (s.ends.female.attach && s.ends.male.attach) ? P[0].distanceTo(P[n]) : null;
    return { segments: n, segmentM: s.seg, totalLengthM: total, maxSegmentErrorRatio: maxErr, minFloorClearanceM: minY, maxJointBendDeg: maxBend * 180 / Math.PI,
      allowedJointBendDeg: Math.min(s.seg / s.minBendRadius, 1.2) * 180 / Math.PI, nodesInsideColliders: inBox, endTangentDeg: tangent,
      endToEndM: straight, overstretched: straight !== null && (straight > s.lengthM + 1e-6 || maxErr > 0.01) };
  }

  // 업데이트: 장비 자세를 다시 읽어 플러그를 꽂고, 몸체 시뮬레이션 후 튜브 재생성
  function update(root, opt) {
    var s = S(root), o = opt || {};
    var poseF0 = seatedPose(s, 'female'), poseM0 = seatedPose(s, 'male');
    if (!s.initialized || o.reset) {
      var A, tA, B = null, tB = null, freeEnd = null, wp = o.route || s.route;
      if (poseF0) { A = plugExitWorld(poseF0, 'female'); tA = plugAxisWorld(poseF0); }
      else { var fe = s.ends.female.free || {}; A = (fe.position || new V3(0, s.floorY + 0.02, 0)).clone(); tA = (fe.direction || new V3(1, 0, 0)).clone().normalize(); }
      if (poseM0) { B = plugExitWorld(poseM0, 'male'); tB = plugAxisWorld(poseM0); } else freeEnd = s.ends.male.free;
      var pts = buildInitialPath(s, A, tA, B, tB, wp, freeEnd);
      s.nodes = pts; s.prev = pts.map(function (p) { return p.clone(); }); s.noseF = s.noseM = null; s.initialized = true;
    }
    var res = solve(s, o.steps !== undefined ? o.steps : (o.reset || !s.settled ? 900 : 240), o.iterations || 50, { finalIterations: o.finalIterations || 4000 });
    s.settled = true;
    var poses = {};
    poses.female = res.poseF || freePose(s.noseF.p, s.nodes[0], 'female');
    poses.male = res.poseM || freePose(s.noseM.p, s.nodes[s.n], 'male');
    applyPose(root, s.plugs.female, poses.female); applyPose(root, s.plugs.male, poses.male);
    rebuildTube(root, s, poses);
    s.stats = computeStats(s, poses); s.poses = poses;
    return s.stats;
  }

  // 끝 기준점 정보 (월드)
  function getEndInfo(root, end) {
    var s = S(root), plug = s.plugs[end], ref = plug.userData.reference; plug.updateMatrixWorld(true);
    var q = new THREE.Quaternion(); plug.getWorldQuaternion(q);
    var a = s.ends[end].attach;
    return {
      end: end, name: ref.name, type: ref.type, matesWith: ref.matesWith.slice(),
      localMatingPoint: ref.localMatingPoint.clone(), localMatingDirection: ref.localMatingDirection.clone(), localKeyDirection: ref.localKeyDirection.clone(),
      localCableExit: ref.localCableExit.clone(), localCableDirection: ref.localCableDirection.clone(),
      worldMatingPoint: ref.localMatingPoint.clone().applyMatrix4(plug.matrixWorld), worldMatingDirection: ref.localMatingDirection.clone().applyQuaternion(q).normalize(),
      worldKeyDirection: ref.localKeyDirection.clone().applyQuaternion(q).normalize(), worldCableExit: ref.localCableExit.clone().applyMatrix4(plug.matrixWorld),
      worldCableDirection: ref.localCableDirection.clone().applyQuaternion(q).normalize(), worldQuaternion: q,
      connectedTo: a ? { portId: a.portId, device: a.root.name } : null, plug: plug
    };
  }
  function getState(root) { var s = S(root); return { stats: s.stats, nodes: s.nodes.map(function (p) { return p.clone(); }), ends: { female: !!s.ends.female.attach, male: !!s.ends.male.attach } }; }

  window.XlrCable = {
    NAMESPACE: NS, FEMALE_MM: FEMALE, MALE_MM: MALE, PINS_MM: PINS, PINS_MALE_MM: PINS_MALE, CABLE_MM: CABLE, PLUG_META: PLUG_META,
    create: create, buildPlug: buildPlug, connect: connect, disconnect: disconnect, setColliders: setColliders,
    update: update, getEndInfo: getEndInfo, getState: getState, compatibility: compatibility
  };
})();
