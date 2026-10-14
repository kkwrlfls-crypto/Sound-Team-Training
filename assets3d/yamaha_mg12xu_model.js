/* =============================================================================
   Yamaha MG12XU 아날로그 믹서 — 절차적(procedural) 3D 모델  (Three.js r128 전용)
   -----------------------------------------------------------------------------
   - 전역 네임스페이스: window.YamahaMG12XU  (기존 MG12XU 2D 실습 게임 코드·변수와 무관)
   - 좌표 단위: 미터. 원점 = 외곽(308 × 118 × 422 mm) 바닥면의 중앙.
       +Y = 위,  +Z = 앞(조작자 쪽, 페이더),  -Z = 뒤(후면 패널: 전원·USB),  +X = 앞에서 볼 때 오른쪽(마스터 섹션)
   - 공식 자료:
       · 외곽 치수·무게·I/O 개수: Yamaha MG XU 시리즈 공식 사양표 (usa.yamaha.com …/mg_series_xu_model/specs.html)
       · 측면 단면·상판 배치: MG12XU/MG12X/MG12 Technical Specifications PDF 의 "Dimensions" 도면
         (308 / 118 / 115 / 422 / 416 mm). 도면을 고해상도로 렌더링해 mm 격자로 측정 → 아래 LAYOUT (평면 mm)
       · 커넥터 규격: 같은 PDF 의 입출력 표 (콤보, XLR-3-31, XLR-3-32, 폰, RCA, USB Type-B)
       · 후면 구성/노브 캡 색: Yamaha 공식 제품 사진(후면·측면·사선)
   - 세부 치수(노브 높이·지름, 페이더 캡, 버튼 크기 등)는 도면·사진 비례 추정치입니다.
   ============================================================================= */
(function (global) {
  'use strict';
  var THREE = global.THREE;
  if (!THREE) { console.error('[YamahaMG12XU] THREE가 먼저 로드되어야 합니다.'); return; }
  var NS = 'yamahaMg12xu';
  var MM = 0.001;

  var DIM = { width: 308, height: 118, depth: 422, weightKg: 4.2, cheek: 8 }; // cheek 두께는 도면 비례 추정
  var D0 = DIM.depth / 2;          // d(뒤에서부터 mm) → z = d - D0
  var HALF = DIM.width / 2;        // 154
  var INNER = HALF - DIM.cheek;    // 146 (측판 안쪽)

  // ---- 측면 단면 (도면 측정, d = 뒤에서부터, h = 바닥에서부터, mm) ----
  var SLAB = { d0: 121.6, d1: 405, refD: 130, refH: 87.6, slope: 0.1635 }; // 조작부 경사판(측판 윗선 기준) ≈ 9.3°
  var PLATEAU = { d0: 29.3, d1: 112.6, cheekH: 112.7, bodyH: 110.0 };       // 후면 블록 윗면(잭 패널)
  var BODY_TOP_DROP = 2.2;                                                  // 측판 윗선 대비 본체 상판이 낮은 양(추정)
  function cheekSlabH(d) { return SLAB.refH - SLAB.slope * (d - SLAB.refD); }
  function slabH(d) { return cheekSlabH(d) - BODY_TOP_DROP; }
  var TILT = Math.atan(SLAB.slope);

  // ---- 상판 배치 (공식 도면 평면도 측정: x = 중앙 기준 mm, d = 뒤에서부터 mm) ----
  var COLS = { ch1: -124.8, ch2: -100.5, ch3: -76.2, ch4: -51.9, ch56: -27.1, ch78: -2.8, ch910: 27.1, ch1112: 51.4,
    fxrtn: 75.8, group: 100.1, stereo: 124.8 };
  var CH = ['ch1', 'ch2', 'ch3', 'ch4', 'ch56', 'ch78', 'ch910', 'ch1112'];
  var MONO = ['ch1', 'ch2', 'ch3', 'ch4'];
  var MIC = ['ch1', 'ch2', 'ch3', 'ch4', 'ch56', 'ch78'];
  var ROWS = { gain: 132.3, comp: 156.6, high: 184.4, mid: 201.0, low: 219.4, aux1: 238.2, pre: 249.3, aux2: 261.6, pan: 280.0,
    on: 297.9, peak: 322.7, b12: 333.8, bst: 344.9, pfl: 391.0, faderTop: 322.0, faderBot: 400.0 };
  var JACK = { row1: 48.2, row2: 75.5, row3: 93.5, padRow: 84.5,
    combo: [['in1', -123.6], ['in2', -99.3], ['in3', -75.0], ['in4', -50.6]],
    xlrMic: [['mic5', -26.3], ['mic7', -2.1]],
    row1Phone: [['auxSend1', 23.7], ['auxSend2', 42.0], ['groupOut1', 59.5], ['groupOut2', 77.5]],
    stereoXlr: [['stereoOutXlrL', 100.9], ['stereoOutXlrR', 125.3]],
    row2Jacks: [['line5', -26.3], ['line7', -2.1], ['line9', 26.7], ['line11', 51.1], ['monitorOutL', 75.8], ['stereoOutPhoneL', 100.6], ['stereoOutPhoneR', 125.3]],
    row3Jacks: [['line6', -26.3], ['line8', -2.1], ['line10', 26.7], ['line12', 51.1], ['monitorOutR', 75.8], ['footSw', 100.6], ['phones', 125.3]],
    padHpf: [[-131.2, -123.5], [-106.0, -98.3], [-81.3, -73.6], [-57.0, -49.3]] };
  var RCA = [['rca9', 31.8, 131.5, 'white'], ['rca11', 45.9, 131.5, 'white'], ['rca10', 31.8, 144.7, 'red'], ['rca12', 45.9, 144.7, 'red']];
  var SPX = { x0: 64.2, x1: 137.6, d0: 133.2, d1: 225.8, program: [75.8, 200.2], parameter: [100.1, 200.2] };
  var REAR = { // 후면 (공식 사진 + 평면도 x 위치)
    acIn: { x: 98.4, h: 29.0 }, power: { x: 98.4, h: 56.7 }, usb: { x: -99.2, h: 55.5 }, usbScrewDx: 20.4,
    screws: [[128.0, 78.0], [-128.0, 78.0], [-119.6, 58.0], [-78.8, 58.0], [84.0, 12.0]] };
  // AC IN = IEC 60320 C14 나사 고정형 인렛. 공식 후면 사진(4000px, 5.6px/mm — 섀시 폭 308mm·고정나사 간격 40mm 로 교차 확인) 실측.
  // 로컬 좌표: +Z 바깥(케이블 쪽), +Y 위(접지 핀 쪽), x 는 뒤에서 바라본 오른쪽이 +.
  var IEC = {
    open: { w: 25.4, h: 16.6, chamfer: 3.5 },          // 개구부 (위쪽 두 모서리 모따기)
    frame: { w: 31.3, h: 22.9, r: 2.5, face: 4.0 },     // 테두리 바깥 크기, 앞면 높이(패널에서 mm)
    flange: { t: 1.5, screwDx: 20.0, earR: 4.8, coreW: 24.0 }, // 마름모형 귀 + 나사 2개(간격 40mm)
    floor: -8.0,                                        // 오목부 바닥(패널면 기준) → 앞면에서 12mm 깊이 (추정)
    pinTip: 1.0,                                        // 핀 끝 = 앞면에서 3mm 안쪽 (추정)
    pins: [['pinLeft', -7.0, -2.9, 1.8, 4.4], ['pinRight', 7.0, -2.9, 1.8, 4.4], ['pinEarth', 0, 2.1, 1.8, 3.6]], // x, y, 두께, 높이 (위치=사진, 단면=추정)
    insertDepthMM: 10.0                                 // C13 플러그 앞면이 앞면에서 10mm 들어감 (바닥까지 2mm 여유, 추정)
  };
  var USB_OPEN = [[-4.3, -3.9], [4.3, -3.9], [4.3, 2.3], [2.6, 3.9], [-2.6, 3.9], [-4.3, 2.3]];
  function polyPath(p, pts, dx, dy) { dx = dx || 0; dy = dy || 0; p.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (var i = 1; i < pts.length; i++) p.lineTo(pts[i][0] + dx, pts[i][1] + dy); p.closePath(); return p; }
  function iecOpenPts() { var w = IEC.open.w / 2, h = IEC.open.h / 2, c = IEC.open.chamfer; return [[-w, -h], [w, -h], [w, h - c], [w - c, h], [-w + c, h], [-w, h - c]]; }
  var SCREWS_TOP = [[-142.5, 132.3], [142.5, 132.3], [-142.5, 262.5], [142.5, 262.5], [-142.5, 397.4], [142.5, 397.4]];
  var SCREWS_PLATEAU = [[-142.5, 48.2], [142.5, 48.2]];

  // XLR (프로젝트 xlrPlugF / xlrPlugM GLB 실측에 맞춤)
  var XLRF_IN = { housingR: 11.0, comboR: 12.0, boreR: 10.45, insertR: 8.0, insertFace: 3.0, annulusDepth: 13.0, insertDepthMM: 12.6,
    holes: [[-4.07, 0.07], [4.61, 0.07], [0.27, -4.16]], holeR: 1.5, housingH: 8.0 }; // 구멍 = 프로젝트 xlrPlugM 핀 실측(반지름 1.27) + 여유
  var XLRM_OUT = { housingR: 11.0, boreR: 8.75, depth: 15.0, insertDepthMM: 13.0, pinR: 0.8, pinTip: 4.0,
    pins: [[-4.0, 0], [4.0, 0], [0, -3.9]], latch: { y0: 1.4, y1: 3.6, halfW: 2.2, rOut: 9.9 }, housingH: 8.0 };
  var PHONE = { nutR: 6.3, barrelR: 5.6, holeR: 3.3, h: 4.0, insertDepthMM: 30.0 };

  // ---------------------------------------------------------------------------
  function toM(g) { g.scale(MM, MM, MM); return g; }
  function setPosMM(o, x, y, z) { o.position.set(x * MM, y * MM, z * MM); return o; }
  function mk(geo, mat, name, opt) {
    var m = new THREE.Mesh(toM(geo), mat); m.name = NS + '.' + name;
    var o = opt || {}; m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false; return m;
  }
  function grp(name) { var g = new THREE.Group(); g.name = NS + '.' + name; return g; }
  function hide(t, k, v) { Object.defineProperty(t, k, { value: v, enumerable: false, writable: true, configurable: true }); return v; }
  function circle(p, cx, cy, r) { p.absarc(cx, cy, r, 0, Math.PI * 2, false); return p; }
  function rrect(p, cx, cy, w, h, r) {
    var x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2; r = Math.min(r, w / 2, h / 2);
    p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r); p.lineTo(x1, y1 - r);
    p.quadraticCurveTo(x1, y1, x1 - r, y1); p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r);
    p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0); return p;
  }
  // Y축 기둥 (밑면 y=0)
  function cylY(rt, rb, h, seg) { var g = new THREE.CylinderGeometry(rt, rb, h, seg || 24); g.translate(0, h / 2, 0); return g; }
  // 2D Shape 를 XZ 평면에 놓고 +Y 로 두께(h)를 줌 (밑면 y=0). shape 의 (x,y) → (x, -z)
  function extrudeUp(shape, h, bevel, segs) {
    var b = bevel || 0;
    var g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(h - 2 * b, 0.01), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b,
      bevelOffset: -b, bevelSegments: b > 0 ? 2 : 0, curveSegments: segs || 16 });
    if (b > 0) g.translate(0, 0, b);
    g.rotateX(-Math.PI / 2); // +Z(두께) → +Y,  shape y → -Z
    return g;
  }
  function gearShape(rOut, rIn, teeth) {
    var s = new THREE.Shape(), N = teeth * 4;
    for (var i = 0; i <= N; i++) {
      var a = i / N * Math.PI * 2, k = i % 4, r = (k === 0 || k === 1) ? rOut : rIn;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    return s;
  }

  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return {
      body: new S({ color: 0x050506, roughness: 0.6, metalness: 0.25 }),          // 도장 강판 상판/본체
      cheek: new S({ color: 0x040405, roughness: 0.7, metalness: 0.05 }),          // 측판 (수지)
      bottom: new S({ color: 0x050505, roughness: 0.8, metalness: 0.2 }),
      knob: new S({ color: 0x0a0a0b, roughness: 0.45, metalness: 0.0 }),
      capWhite: new S({ color: 0x9a9ca0, roughness: 0.38, metalness: 0.0 }),
      capYellow: new S({ color: 0x7d5800, roughness: 0.42, metalness: 0.0 }),
      capGreen: new S({ color: 0x013f10, roughness: 0.42, metalness: 0.0 }),
      capBlue: new S({ color: 0x031e60, roughness: 0.42, metalness: 0.0 }),
      capRed: new S({ color: 0x5e0105, roughness: 0.42, metalness: 0.0 }),
      pointer: new S({ color: 0xf2f2f2, roughness: 0.4, metalness: 0.0 }),
      faderWhite: new S({ color: 0x96989c, roughness: 0.45, metalness: 0.0 }),
      faderBlue: new S({ color: 0x052468, roughness: 0.45, metalness: 0.0 }),
      faderRed: new S({ color: 0x600207, roughness: 0.45, metalness: 0.0 }),
      faderStem: new S({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.5 }),
      slot: new S({ color: 0x000000, roughness: 1.0, metalness: 0.0 }),
      btnGrey: new S({ color: 0x3e4045, roughness: 0.45, metalness: 0.05 }),
      btnRed: new S({ color: 0x8e050b, roughness: 0.4, metalness: 0.0 }),
      jackHousing: new S({ color: 0x15161a, roughness: 0.4, metalness: 0.55 }),
      nickel: new S({ color: 0xa4a8ae, roughness: 0.28, metalness: 0.9 }),
      gold: new S({ color: 0xc9b37a, roughness: 0.25, metalness: 0.95 }),
      insert: new S({ color: 0x050505, roughness: 0.75, metalness: 0.0 }),
      hole: new S({ color: 0x000000, roughness: 1.0, metalness: 0.0 }),
      screw: new S({ color: 0x1a1b1e, roughness: 0.35, metalness: 0.8 }),
      rcaWhite: new S({ color: 0xdcdcdc, roughness: 0.35 }), rcaRed: new S({ color: 0xa3070b, roughness: 0.35 }),
      plastic: new S({ color: 0x060606, roughness: 0.5, metalness: 0.0 }),
      spxPanel: new S({ color: 0x050506, roughness: 0.25, metalness: 0.2 })
    };
  }

  // ---------------------------------------------------------------------------
  // 측면 단면 다각형 (d, h)  — topLift: 측판은 0, 본체는 -BODY_TOP_DROP (상판만 내림)
  function sideProfile(isCheek) {
    var dTop = isCheek ? 0 : -BODY_TOP_DROP, plat = isCheek ? PLATEAU.cheekH : PLATEAU.bodyH;
    var hs = function (d) { return cheekSlabH(d) + dTop; };
    var pts = [
      [3, 0], [153, 0], [160, 1.5], [168, 6], [175, 14], [180, 25], [183, 38],        // 뒤 받침 → 바닥 홈(아치)
      [314, 15.3], [319, 9], [323, 3], [330, 0], [405, 0],                              // 앞 받침
      [414, 2.5], [419.5, 8], [422, 17], [421, 27], [416, 35], [410, hs(410) - 1.5],     // 앞 코(라운드)
      [405, hs(405)]];
    // 경사판 윗면 (앞 → 뒤)
    for (var d = 395; d > SLAB.d0; d -= 10) pts.push([d, hs(d)]);
    pts.push([SLAB.d0, hs(SLAB.d0)]);
    // 계단 (경사판 → 잭 패널)
    var stepTop = plat;
    pts.push([118, (hs(SLAB.d0) + stepTop) / 2 - 4], [115, stepTop - 6], [PLATEAU.d1, stepTop]);
    pts.push([PLATEAU.d0, stepTop]);
    // 뒤 위 모서리 라운드 → 후면(약간 뒤로 기운 면)
    pts.push([22, stepTop - 1.2], [16.7, stepTop - 7], [12.5, stepTop - 14], [10.2, 90], [0, 6.7], [0.8, 2.5]);
    return pts;
  }
  function profileShape(pts) { // (d,h) → Shape(x=d, y=h)
    var s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath(); return s;
  }
  // Shape(x=d,y=h) 를 X 방향(폭)으로 압출: 결과 좌표 (x, h, d-D0)
  function extrudeProfile(pts, x0, x1, bevel) {
    var b = bevel || 0;
    var g = new THREE.ExtrudeGeometry(profileShape(pts), { depth: (x1 - x0) - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b,
      bevelOffset: -b, bevelSegments: b > 0 ? 3 : 0, curveSegments: 8 });
    if (b > 0) g.translate(0, 0, b);
    // 현재: (x=d, y=h, z=폭) → (x=폭, y=h, z=d-D0)
    var m = new THREE.Matrix4().set(0, 0, 1, x0, 0, 1, 0, 0, 1, 0, 0, -D0, 0, 0, 0, 1);
    g.applyMatrix4(m);
    // 위 변환은 좌우 반전(거울)이라 면 방향을 되돌림
    var idx = g.index; if (idx) { var a = idx.array; for (var i = 0; i < a.length; i += 3) { var t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; } }
    else { var p = g.attributes.position; /* non-indexed */ for (var j = 0; j < p.count; j += 3) { swapVert(g, j + 1, j + 2); } }
    g.computeVertexNormals();
    return g;
  }
  // 압출 본체에서 후면 경사면(프로파일 [10.2,90]–[0,6.7] 구간) 삼각형만 제거
  function removeRearFace(g) {
    if (g.index) g = g.toNonIndexed();
    var n = new THREE.Vector3(0, 10.2, -83.3).normalize();
    var src = g.attributes, cnt = src.position.count, keep = [];
    var a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
    for (var t = 0; t < cnt; t += 3) {
      a.fromBufferAttribute(src.position, t); b.fromBufferAttribute(src.position, t + 1); c.fromBufferAttribute(src.position, t + 2);
      var fn = e1.subVectors(b, a).cross(e2.subVectors(c, a)).normalize();
      var onRear = Math.abs(fn.dot(n)) > 0.9999 && Math.min(a.y, b.y, c.y) > 6.69 && Math.max(a.y, b.y, c.y) < 90.01 && Math.max(a.z, b.z, c.z) < -D0 + 11;
      if (!onRear) keep.push(t);
    }
    var out = new THREE.BufferGeometry();
    Object.keys(src).forEach(function (k) {
      var at = src[k], s = at.itemSize, arr = new at.array.constructor(keep.length * 3 * s);
      keep.forEach(function (t, i) { for (var v = 0; v < 3; v++) for (var q = 0; q < s; q++) arr[(i * 3 + v) * s + q] = at.array[(t + v) * s + q]; });
      out.setAttribute(k, new THREE.BufferAttribute(arr, s));
    });
    out.userData.removedTriangles = cnt / 3 - keep.length;
    return out;
  }
  function swapVert(g, i, k) {
    Object.keys(g.attributes).forEach(function (n) {
      var at = g.attributes[n], s = at.itemSize;
      for (var c = 0; c < s; c++) { var t = at.array[i * s + c]; at.array[i * s + c] = at.array[k * s + c]; at.array[k * s + c] = t; }
    });
  }

  // ---------------------------------------------------------------------------
  // 상판 장착: plateau(수평) / slab(경사) — 로컬 +Y 가 패널 법선
  function mountPlateau(obj, x, d, lift) { setPosMM(obj, x, PLATEAU.bodyH + (lift || 0), d - D0); return obj; }
  function mountSlab(obj, x, d, lift) {
    var h = slabH(d) + (lift || 0) * Math.cos(TILT), dz = (lift || 0) * Math.sin(TILT);
    setPosMM(obj, x, h, d - D0 + dz); obj.rotation.x = TILT; return obj;
  }
  // 후면(뒤로 약간 기운 면) 위의 점과 바깥 법선
  var REAR_N = new THREE.Vector3(0, 10.2, -83.3).normalize(); // 후면은 위로 갈수록 앞으로 기움 (도면)
  function rearPoint(x, h) { var d = 0 + (h - 6.7) * (10.2 / 83.3); return new THREE.Vector3(x, h, d - D0); }
  function mountRear(obj, x, h, lift) {
    var p = rearPoint(x, h).addScaledVector(REAR_N, lift || 0);
    setPosMM(obj, p.x, p.y, p.z);
    var Z = REAR_N.clone(), Y = new THREE.Vector3(0, 1, 0).addScaledVector(Z, -Z.y).normalize(), X = new THREE.Vector3().crossVectors(Y, Z);
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
    return obj;
  }

  // ---------------------------------------------------------------------------
  // 부품 빌더 (로컬 +Y = 바깥/위)
  function buildKnob(M, name, capMat, size) {
    var big = size === 'large', prog = size === 'program';
    var r = big ? 7.7 : prog ? 7.4 : 6.0, h = big ? 15 : prog ? 13 : 13.5;
    var g = grp(name);
    var skirt = mk(cylY(r + 0.7, r + 0.9, 1.6, 32), M.knob, name + '.skirt'); g.add(skirt);
    var body = mk(extrudeUp(gearShape(r, r - 0.45, big ? 30 : 24), h - 1.6, 0, 4), M.knob, name + '.body');
    body.position.y = 1.6 * MM; g.add(body);
    var top = mk(cylY(r - 0.35, r - 0.2, 0.8, 32), M.knob, name + '.top'); top.position.y = h * MM; g.add(top);
    if (capMat) { var cap = mk(cylY(r - 1.6, r - 1.4, 1.4, 32), capMat, name + '.cap'); cap.position.y = (h + 0.8) * MM; g.add(cap); }
    var ptrH = capMat ? h + 2.2 : h + 0.8;
    var ptr = mk(new THREE.BoxGeometry(0.9, 0.25, r - 1.8).translate(0, 0.125, -(r - 1.8) / 2 - 0.6), capMat === M.capWhite ? M.knob : M.pointer, name + '.pointer', { cast: false });
    ptr.position.y = ptrH * MM; g.add(ptr);
    g.userData.heightMM = ptrH + 0.25;
    return g;
  }
  function buildButton(M, name, w, dpt, h, mat, emissiveColor) {
    var g = grp(name);
    var bezel = mk(extrudeUp(rrect(new THREE.Shape(), 0, 0, w + 1.4, dpt + 1.4, 0.8), 0.8, 0, 4), M.plastic, name + '.bezel'); g.add(bezel);
    var m2 = mat;
    if (emissiveColor) m2 = new THREE.MeshStandardMaterial({ color: new THREE.Color(emissiveColor).multiplyScalar(0.28), emissive: new THREE.Color(emissiveColor), emissiveIntensity: 0.0, roughness: 0.3 });
    var cap = mk(extrudeUp(rrect(new THREE.Shape(), 0, 0, w, dpt, 0.6), h, 0.3, 4), m2, name + '.cap'); cap.position.y = 0.8 * MM; g.add(cap);
    hide(g.userData, 'cap', cap); g.userData.pressed = false;
    if (emissiveColor) hide(g.userData, 'lamp', m2);
    return g;
  }
  function buildLed(M, name, color) {
    var g = grp(name);
    g.add(mk(cylY(1.7, 1.7, 0.4, 20), M.plastic, name + '.bezel'));
    var mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.25), emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.2 });
    var lens = mk(new THREE.SphereGeometry(1.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.6, 1), mat, name + '.lens', { cast: false });
    lens.position.y = 0.4 * MM; g.add(lens);
    hide(g.userData, 'lamp', mat);
    return g;
  }
  function buildFader(M, name, capMat) {
    var g = grp(name);
    var slotLen = (ROWS.faderBot - ROWS.faderTop) / Math.cos(TILT);
    var slot = mk(new THREE.BoxGeometry(2.0, 0.3, slotLen).translate(0, 0.15, 0), M.slot, name + '.slot', { cast: false });
    g.add(slot);
    var cap = grp(name + '.knob');
    var stem = mk(new THREE.BoxGeometry(1.4, 4.5, 3).translate(0, 2.25, 0), M.faderStem, name + '.stem'); cap.add(stem);
    var cs = new THREE.Shape(); rrect(cs, 0, 0, 11, 20, 1.6);
    var capMesh = mk(extrudeUp(cs, 9, 0.8, 4), capMat, name + '.cap'); capMesh.position.y = 4.5 * MM; cap.add(capMesh);
    var groove = mk(new THREE.BoxGeometry(11.2, 0.6, 1.0).translate(0, 0, 0), M.plastic, name + '.line', { cast: false });
    groove.position.y = 13.4 * MM; cap.add(groove);
    g.add(cap);
    hide(g.userData, 'cap', cap); g.userData.travelMM = 56 / Math.cos(TILT);
    return g;
  }
  function buildScrew(M, name, r) {
    r = r || 2.4;
    var g = grp(name);
    g.add(mk(new THREE.SphereGeometry(r, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.38, 1), M.screw, name + '.head'));
    var a = mk(new THREE.BoxGeometry(r * 1.1, 0.4, 0.45), M.hole, name + '.slotA', { cast: false }); a.position.y = r * 0.36 * MM; g.add(a);
    var b = a.clone(); b.name = NS + '.' + name + '.slotB'; b.rotation.y = Math.PI / 2; g.add(b);
    g.userData.footprintR = r;
    return g;
  }
  // XLR 암(입력) 리셉터클 / 콤보 잭: 하우징 링 + 환형 홈(플러그 슬리브가 들어감) + 인서트(구멍 3개, 콤보는 중앙 폰 구멍)
  function buildXlrFemale(M, name, combo) {
    var X = XLRF_IN, g = grp(name), R = combo ? X.comboR : X.housingR;
    var ring = new THREE.Shape(); circle(ring, 0, 0, R); ring.holes.push(circle(new THREE.Path(), 0, 0, X.boreR));
    g.add(mk(extrudeUp(ring, X.housingH, 0.5, 40), M.jackHousing, name + '.housing'));
    var rim = mk(new THREE.TorusGeometry(X.boreR + 0.35, 0.35, 8, 40).rotateX(Math.PI / 2), M.nickel, name + '.rim');
    rim.position.y = X.housingH * MM; g.add(rim);
    // 보어 벽 + 환형 바닥 (본체 안으로)
    var wall = mk(new THREE.CylinderGeometry(X.boreR, X.boreR, X.annulusDepth, 40, 1, true).translate(0, X.housingH - X.annulusDepth / 2, 0), M.hole, name + '.boreWall', { cast: false });
    wall.material = M.hole; g.add(wall);
    var floorR = new THREE.RingGeometry(X.insertR, X.boreR, 40).rotateX(-Math.PI / 2);
    var fl = mk(floorR, M.hole, name + '.annulusFloor', { cast: false }); fl.position.y = (X.housingH - X.annulusDepth) * MM; g.add(fl);
    // 인서트: 면은 하우징 윗면에서 insertFace 만큼 아래
    var ins = new THREE.Shape(); circle(ins, 0, 0, X.insertR);
    // 플러그(xlrPlugM) 로컬 (x, y_key) → 모델 (x, -z): extrudeUp 은 shape y → -z 이므로 shape 좌표는 (x, y) 그대로
    X.holes.forEach(function (h) { ins.holes.push(circle(new THREE.Path(), h[0], h[1], X.holeR)); });
    if (combo) ins.holes.push(circle(new THREE.Path(), 0, 0, 3.4));
    var insH = X.annulusDepth - X.insertFace;
    var insert = mk(extrudeUp(ins, insH, 0.25, 24), M.insert, name + '.insert');
    insert.position.y = (X.housingH - X.annulusDepth) * MM; g.add(insert);
    var holeBack = mk(cylY(X.insertR - 0.3, X.insertR - 0.3, 0.2, 24), M.hole, name + '.holeBacking', { cast: false });
    holeBack.position.y = (X.housingH - X.annulusDepth + 2) * MM; g.add(holeBack);
    // 래치(PUSH) 버튼 — 키 방향(-Z)
    var latch = mk(extrudeUp(rrect(new THREE.Shape(), 0, 0, 4.2, 2.4, 0.5), 1.0, 0.2, 4), M.nickel, name + '.latch');
    setPosMM(latch, 0, X.housingH - 1.05, -(X.boreR + (R - X.boreR) / 2)); g.add(latch); // 하우징 윗면과 거의 같은 높이(PUSH 버튼)
    g.userData.faceMM = X.housingH; g.userData.footprintR = R;
    return g;
  }
  // XLR 수(출력) 리셉터클 — SM58 과 같은 규격(프로젝트 xlrPlugF 실측)
  function buildXlrMale(M, name) {
    var X = XLRM_OUT, g = grp(name);
    var ring = new THREE.Shape(); circle(ring, 0, 0, X.housingR); ring.holes.push(circle(new THREE.Path(), 0, 0, X.boreR));
    g.add(mk(extrudeUp(ring, X.housingH, 0.5, 40), M.jackHousing, name + '.housing'));
    var top = X.housingH;
    g.add(mk(new THREE.CylinderGeometry(X.boreR, X.boreR, X.depth, 40, 1, true).translate(0, top - X.depth / 2, 0), M.hole, name + '.boreWall', { cast: false }));
    var fl = mk(new THREE.CircleGeometry(X.boreR, 40).rotateX(-Math.PI / 2), M.insert, name + '.insertFace'); fl.position.y = (top - X.depth) * MM; g.add(fl);
    X.pins.forEach(function (p, i) {
      var len = X.depth - X.pinTip;
      var pin = mk(cylY(X.pinR, X.pinR, len - X.pinR, 16), M.gold, name + '.pin' + (i + 1));
      setPosMM(pin, p[0], top - X.depth, -p[1]); g.add(pin);
      var tip = mk(new THREE.SphereGeometry(X.pinR, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.gold, name + '.pinTip' + (i + 1));
      setPosMM(tip, p[0], top - X.depth + len - X.pinR, -p[1]); g.add(tip);
    });
    var lw = X.latch;
    var win = mk(new THREE.BoxGeometry(lw.halfW * 2, lw.y1 - lw.y0, lw.rOut - X.boreR), M.hole, name + '.latchWindow', { cast: false });
    setPosMM(win, 0, top - (lw.y0 + lw.y1) / 2, -(X.boreR + lw.rOut) / 2); g.add(win);
    g.userData.faceMM = top; g.userData.footprintR = X.housingR;
    return g;
  }
  function buildPhoneJack(M, name, stereo) {
    var P = PHONE, g = grp(name);
    g.add(mk(cylY(P.nutR, P.nutR, 1.6, 6), M.nickel, name + '.nut'));
    var bar = new THREE.Shape(); circle(bar, 0, 0, P.barrelR); bar.holes.push(circle(new THREE.Path(), 0, 0, P.holeR));
    var b = mk(extrudeUp(bar, P.h - 1.6, 0.3, 32), M.nickel, name + '.barrel'); b.position.y = 1.6 * MM; g.add(b);
    g.add(mk(new THREE.CylinderGeometry(P.holeR, P.holeR, 12, 24, 1, true).translate(0, P.h - 6, 0), M.hole, name + '.bore', { cast: false }));
    var bot = mk(new THREE.CircleGeometry(P.holeR, 24).rotateX(-Math.PI / 2), M.hole, name + '.boreFloor', { cast: false });
    bot.position.y = (P.h - 12) * MM; g.add(bot);
    g.userData.faceMM = P.h; g.userData.footprintR = P.nutR; g.userData.stereo = !!stereo;
    return g;
  }
  // IEC C14 인렛 (패널면 z=0, +Z 바깥). 오목부는 패널 안쪽으로 들어가므로 본체 후면에 같은 윤곽의 구멍이 있어야 보인다.
  function buildIecInlet(M) {
    var g = grp('acIn'), F = IEC.frame, FL = IEC.flange, open = iecOpenPts();
    var dark = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.55, metalness: 0.0 });
    // 1) 마름모형 플랜지: 가운데 몸통 + 나사 쪽으로 좁아지는 귀(끝은 반지름 earR 원호, 원에 접하는 직선)
    var fl = new THREE.Shape(), cw = FL.coreW / 2, ch = F.h / 2, sx = FL.screwDx, r = FL.earR;
    function tangentAng(px, py, cx, cy) { var dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy); return Math.atan2(dy, dx) - Math.acos(r / d); }
    var aR = tangentAng(cw, ch, sx, 0); // 오른쪽 귀 위 접점 각도
    fl.moveTo(-cw, -ch); fl.lineTo(cw, -ch);
    fl.lineTo(sx + r * Math.cos(-aR), r * Math.sin(-aR)); fl.absarc(sx, 0, r, -aR, aR, false);
    fl.lineTo(cw, ch); fl.lineTo(-cw, ch);
    fl.lineTo(-sx + r * Math.cos(Math.PI - aR), r * Math.sin(Math.PI - aR)); fl.absarc(-sx, 0, r, Math.PI - aR, Math.PI + aR, false);
    fl.closePath();
    fl.holes.push(polyPath(new THREE.Path(), open));
    g.add(mk(new THREE.ExtrudeGeometry(fl, { depth: FL.t, bevelEnabled: false, curveSegments: 12 }), dark, 'acIn.flange'));
    // 2) 앞 테두리(라운드 사각, 개구부 관통) — 패널면에서 face 만큼 돌출
    // 테두리 안쪽 단: 개구부 둘레 0.9mm 폭 띠가 앞면보다 0.6mm 낮음 (사진의 이중 테)
    var lipPts = open.map(function (q) { return [q[0] * (1 + 1.8 / IEC.open.w), q[1] * (1 + 1.8 / IEC.open.h)]; });
    var fr = new THREE.Shape(); rrect(fr, 0, 0, F.w, F.h, F.r); fr.holes.push(polyPath(new THREE.Path(), lipPts));
    g.add(mk(new THREE.ExtrudeGeometry(fr, { depth: F.face, bevelEnabled: false, curveSegments: 10 }), dark, 'acIn.frame'));
    var lipS = polyPath(new THREE.Shape(), lipPts); lipS.holes.push(polyPath(new THREE.Path(), open));
    g.add(mk(new THREE.ExtrudeGeometry(lipS, { depth: F.face - 0.6, bevelEnabled: false }), dark, 'acIn.frameLip'));
    // 3) 오목부: 패널 안쪽 벽 + 바닥 (테두리 구멍 벽과 이어짐)
    var wallG = new THREE.ExtrudeGeometry(polyPath(new THREE.Shape(), open), { depth: -IEC.floor, bevelEnabled: false }).translate(0, 0, IEC.floor);
    var wall = mk(wallG, new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.85, side: THREE.BackSide }), 'acIn.recessWall', { cast: false });
    g.add(wall);
    g.add(mk(new THREE.ShapeGeometry(polyPath(new THREE.Shape(), open)).translate(0, 0, IEC.floor + 0.01), new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.95 }), 'acIn.recessFloor', { cast: false }));
    // 4) 핀 3개 (바닥에서 솟아 앞면 3mm 안쪽에서 끝남, 끝 모따기)
    IEC.pins.forEach(function (p) {
      var len = IEC.pinTip - IEC.floor, t = p[3], h = p[4];
      var body = mk(new THREE.BoxGeometry(t, h, len - 0.6).translate(0, 0, IEC.floor + (len - 0.6) / 2), M.nickel, 'acIn.' + p[0]);
      var tip = mk(new THREE.CylinderGeometry(0.5, 1, 0.6, 4, 1).rotateX(Math.PI / 2).rotateZ(Math.PI / 4).scale(t / 1.414, h / 1.414, 1).translate(0, 0, IEC.pinTip - 0.3), M.nickel, 'acIn.' + p[0] + '.tip');
      setPosMM(body, p[1], p[2], 0); setPosMM(tip, p[1], p[2], 0); g.add(body); g.add(tip);
    });
    // 5) 고정나사 (플랜지 위)
    [-sx, sx].forEach(function (x, i) { var sc = buildScrew(M, 'acIn.screw' + (i + 1), 1.8); sc.rotation.x = Math.PI / 2; setPosMM(sc, x, 0, FL.t); g.add(sc); });
    g.userData.faceMM = F.face;
    return g;
  }
  function buildRca(M, name, color) {
    var g = grp(name);
    g.add(mk(cylY(4.6, 4.6, 1.0, 6), M.nickel, name + '.nut'));
    var ring = new THREE.Shape(); circle(ring, 0, 0, 4.1); ring.holes.push(circle(new THREE.Path(), 0, 0, 3.1));
    var r = mk(extrudeUp(ring, 2.2, 0.3, 24), color === 'red' ? M.rcaRed : M.rcaWhite, name + '.colorRing'); r.position.y = 1.0 * MM; g.add(r);
    var sh = new THREE.Shape(); circle(sh, 0, 0, 3.1); sh.holes.push(circle(new THREE.Path(), 0, 0, 2.5));
    var s = mk(extrudeUp(sh, 7.0, 0.2, 24), M.nickel, name + '.shell'); s.position.y = 1.0 * MM; g.add(s);
    var ins = mk(cylY(2.5, 2.5, 6.0, 20), M.insert, name + '.insulator'); ins.position.y = 1.0 * MM; g.add(ins);
    var hole = mk(cylY(0.8, 0.8, 0.15, 12), M.hole, name + '.pinHole', { cast: false }); hole.position.y = 7.0 * MM; g.add(hole);
    g.userData.faceMM = 8.0; g.userData.footprintR = 4.6;
    return g;
  }

  // ---------------------------------------------------------------------------
  // 인쇄(데칼) 텍스처
  var FONT = '"Helvetica Neue", Arial, "Liberation Sans", "DejaVu Sans", sans-serif';
  function cvs(wmm, hmm, s) { var c = document.createElement('canvas'); c.width = Math.round(wmm * s); c.height = Math.round(hmm * s); return { c: c, g: c.getContext('2d'), s: s }; }
  function tex(c) { var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
  function decalMat(t, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({ map: t, transparent: true, alphaTest: 0.06, depthWrite: false, roughness: 0.55,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, extra || {}));
  }
  function text(D, str, x, y, size, opt) {
    var o = opt || {}, g = D.g;
    g.save(); g.fillStyle = o.color || '#e6e7ea'; g.font = (o.style || '') + ' ' + (o.weight || '700') + ' ' + (size * D.s) + 'px ' + FONT;
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillText(str, x * D.s, y * D.s); g.restore();
  }
  var BLUE = '#0b4fae', LINE = 'rgba(25,105,215,0.95)';
  // 경사판 인쇄: 캔버스 x = x+146, 캔버스 y = (d - SLAB.d0)/cos(tilt)
  function slabDecal() {
    var len = (SLAB.d1 - SLAB.d0) / Math.cos(TILT), W = INNER * 2, D = cvs(W, len, 5), g = D.g, s = D.s;
    function X(x) { return x + INNER; } function Y(d) { return (d - SLAB.d0) / Math.cos(TILT); }
    function T(str, x, y, size, o) { text(D, str, X(x), y, size, o); } // x: 모델 mm → 캔버스 mm
    // 채널 구분 파란 세로선
    var bounds = [-137, -112.6, -88.3, -64.1, -39.5, -15, 12.2, 39.2, 63.6, 88, 112.5, 137];
    g.strokeStyle = LINE; g.lineWidth = 0.45 * s;
    bounds.forEach(function (bx, i) { g.beginPath(); g.moveTo(X(bx) * s, Y(123) * s); g.lineTo(X(bx) * s, Y(403) * s); g.stroke(); });
    // ON 버튼 아래 파란 띠, 페이더 구역 마스터 파란 배경
    g.fillStyle = BLUE; g.fillRect(X(-137) * s, Y(305) * s, (274) * s, 4.5 * s);
    g.fillStyle = 'rgba(11,79,174,0.92)'; g.fillRect(X(88) * s, Y(312) * s, 49 * s, (Y(403) - Y(312)) * s);
    // 줄 라벨 + 눈금 점
    var rowLabels = [['gain', 'GAIN'], ['comp', 'COMP'], ['high', 'HIGH'], ['mid', 'MID'], ['low', 'LOW'], ['aux1', 'AUX1'], ['aux2', 'AUX2/FX'], ['pan', 'PAN']];
    function dots(cx, d, r) {
      for (var i = 0; i <= 10; i++) { var a = (-150 + i * 30) * Math.PI / 180; g.fillStyle = '#d7d9dd';
        g.beginPath(); g.arc((X(cx) + Math.sin(a) * r) * s, (Y(d) - Math.cos(a) * r) * s, (i % 5 === 0 ? 0.42 : 0.3) * s, 0, Math.PI * 2); g.fill(); }
    }
    CH.forEach(function (ch) {
      var cx = COLS[ch];
      rowLabels.forEach(function (rl) {
        var has = (rl[0] === 'gain' && MIC.indexOf(ch) >= 0) || (rl[0] === 'comp' && MONO.indexOf(ch) >= 0) ||
          (rl[0] === 'mid' && MIC.indexOf(ch) >= 0) || ['high', 'low', 'aux1', 'aux2', 'pan'].indexOf(rl[0]) >= 0;
        if (!has) return;
        var lab = rl[1]; if (rl[0] === 'pan' && ch.length > 3) lab = (ch === 'ch910' || ch === 'ch1112') ? 'BAL' : 'PAN/BAL';
        T(lab, cx - 8.5, Y(ROWS[rl[0]]) - 8.2, 1.6, { align: 'left', weight: '700' });
        dots(cx, ROWS[rl[0]], 8.6);
      });
      T(({ ch1: '1', ch2: '2', ch3: '3', ch4: '4', ch56: '5/6', ch78: '7/8', ch910: '9/10', ch1112: '11/12' })[ch], cx, Y(125.5), 2.6, { weight: '800' });
      // 페이더 눈금
      for (var k = 0; k <= 8; k++) { var dd = 333 + k * 7; g.fillStyle = '#c9cbd0'; g.fillRect((X(cx - 5.1) - 4.2) * s, Y(dd) * s, 1.8 * s, 0.25 * s); }
      T(({ ch1: '1', ch2: '2', ch3: '3', ch4: '4', ch56: '5/6', ch78: '7/8', ch910: '9/10', ch1112: '11/12' })[ch], cx - 5.1, Y(402.5), 1.8, { weight: '700' });
      T('1-2', cx + 5.5, Y(ROWS.b12) + 3.8, 1.3); T('ST', cx + 5.5, Y(ROWS.bst) + 3.8, 1.3); T('PFL', cx + 5.5, Y(ROWS.pfl) - 3.8, 1.3);
      if (MIC.indexOf(ch) >= 0) T('PEAK', cx + 5.5, Y(ROWS.peak) - 3, 1.3);
    });
    // 마스터 섹션 라벨
    [['fxrtn', 'FX RTN'], ['group', 'GROUP 1-2'], ['stereo', 'STEREO']].forEach(function (m) { T(m[1], COLS[m[0]] - (m[0] === 'stereo' ? 0 : 5.1), Y(402.5), 1.8); });
    dots(COLS.fxrtn, ROWS.aux1, 8.6); dots(COLS.group, ROWS.aux1, 8.6); dots(COLS.group, ROWS.aux2, 8.6);
    dots(COLS.stereo, ROWS.aux1, 10.5); dots(COLS.stereo, ROWS.aux2, 10.5); dots(SPX.parameter[0], SPX.parameter[1], 8.6);
    T('SEND MASTER', COLS.group, Y(ROWS.pan) - 3, 1.5); T('MONITOR LEVEL', COLS.stereo, Y(ROWS.aux1) + 11.5, 1.4);
    T('PHONES', COLS.stereo, Y(ROWS.aux2) + 11.5, 1.4); T('STEREO / GROUP', COLS.stereo, Y(ROWS.pan) + 4.5, 1.2);
    T('PHANTOM +48V', -3.2, Y(ROWS.comp) - 5, 1.5); T('HPF 80Hz (MIC)', -11.3, Y(ROWS.comp + 12.3) + 4.6, 1.2);
    T('LINE / USB', 55.7, Y(ROWS.comp + 12.3) - 4.6, 1.3);
    // SPX/디스플레이 박스 인쇄 (프로그램 목록은 실물 문구 대신 번호만)
    g.strokeStyle = '#3a3c42'; g.lineWidth = 0.4 * s; g.strokeRect(X(SPX.x0) * s, Y(SPX.d0) * s, (SPX.x1 - SPX.x0) * s, (Y(SPX.d1) - Y(SPX.d0)) * s);
    for (var i = 0; i < 12; i++) {
      T(String(i + 1), SPX.x0 + 6, Y(SPX.d0 + 23 + i * 3.4), 1.25, { align: 'left', weight: '600' });
      T(String(i + 13), SPX.x0 + 26, Y(SPX.d0 + 23 + i * 3.4), 1.25, { align: 'left', weight: '600' });
    }
    T('PROGRAM', SPX.program[0], Y(SPX.program[1]) + 11, 1.4); T('PARAMETER', SPX.parameter[0], Y(SPX.parameter[1]) + 11, 1.4);
    T('SPX', (SPX.x0 + SPX.x1) / 2 - 12, Y(SPX.d1 - 5), 3.4, { style: 'italic', weight: '900' });
    T('POWER', SPX.x1 - 15, Y(SPX.d0 + 6), 1.6);
    ['+10', '+6', '+3', '0', '-3', '-6', '-10', '-15', '-20', '-25', '-30'].forEach(function (l, i) { T(l, SPX.x1 - 10, Y(SPX.d0 + 15 + (i + 1) * 4.2), 1.15); });
    // 브랜드/모델명 (일반 글꼴로 대체)
    T('YAMAHA', SPX.x1 - 22, Y(SPX.d0 - 7.2) + 0.5, 4.2, { weight: '900' });
    T('MG12XU', SPX.x1 - 20, Y(SPX.d0 - 2.6) + 0.5, 2.6, { style: 'italic', weight: '400' });
    return { tex: tex(D.c), len: len };
  }
  // 잭 패널(평판) 인쇄: 캔버스 x = x+146, y = d - PLATEAU.d0
  function plateauDecal() {
    var Dd = PLATEAU.d1 - PLATEAU.d0, D = cvs(INNER * 2, Dd, 6), g = D.g, s = D.s;
    function X(x) { return x + INNER; } function Y(d) { return d - PLATEAU.d0; }
    function T(str, x, y, size, o) { text(D, str, X(x), y, size, o); }
    g.fillStyle = 'rgba(11,79,174,0.95)'; g.fillRect(X(12) * s, 0, (INNER - 12) * s, 6.5 * s);
    g.strokeStyle = LINE; g.lineWidth = 0.45 * s;
    [-137, -112.6, -88.3, -64.1, -39.5, -15, 12.2].forEach(function (bx) { g.beginPath(); g.moveTo(X(bx) * s, 7 * s); g.lineTo(X(bx) * s, Dd * s); g.stroke(); });
    [[12.2, 88, 36], [88, 137, 36], [12.2, 64, 104], [64, 137, 104]].forEach(function (b) { g.strokeRect(X(b[0]) * s, Y(b[2] - 30) * s, (b[1] - b[0]) * s, 28 * s); });
    JACK.combo.forEach(function (c, i) { T(String(i + 1), c[1], Y(32.5), 2.6, { weight: '800' }); T('MIC / LINE', c[1], Y(64.5), 1.8); T('PAD', JACK.padHpf[i][0], Y(JACK.padRow) - 4, 1.3); T('HPF', JACK.padHpf[i][1], Y(JACK.padRow) - 4, 1.3); });
    JACK.xlrMic.forEach(function (c, i) { T(['5/6', '7/8'][i], c[1], Y(32.5), 2.6, { weight: '800' }); T('MIC', c[1], Y(64.5), 1.8); });
    T('AUX1 · AUX2 SEND', 32.9, Y(61), 1.6); T('GROUP OUT 1 · 2', 68.5, Y(61), 1.6); T('STEREO OUT', 113, Y(61), 1.7);
    T('5 L/MONO', -26.3, Y(83.2), 1.2); T('7 L/MONO', -2.1, Y(83.2), 1.2); T('LINE', -14.2, Y(101.5), 1.6);
    T('9 L', 26.7, Y(83.2), 1.2); T('11 L', 51.1, Y(83.2), 1.2); T('MONITOR OUT', 75.8, Y(101.5), 1.3);
    T('FOOT SW', 100.6, Y(101.5), 1.3); T('PHONES', 125.3, Y(101.5), 1.3);
    return tex(D.c);
  }
  function rearDecal() {
    var Wd = INNER * 2, H = 80, D = cvs(Wd, H, 5), g = D.g, s = D.s;
    // 후면 정면에서 볼 때 왼쪽 = 모델 +X → 캔버스 x = (INNER - x)
    function X(x) { return INNER - x; } function Y(h) { return 90 - h; }
    g.fillStyle = BLUE; g.fillRect(X(140) * s, Y(88) * s, 120 * s, 15 * s);
    text(D, 'YAMAHA', 140 - 30, Y(80.5), 6, { weight: '900' }); text(D, 'MG12XU', 140 - 82, Y(81.5), 4.5, { style: 'italic', weight: '400' });
    text(D, 'MIXING CONSOLE', 140 - 82, Y(76.5), 1.6);
    text(D, 'AC IN', X(REAR.acIn.x), Y(REAR.acIn.h + 14.3), 2.6); // 공식 사진: 스위치 위 'POWER' 인쇄 없음, 'AC IN' 은 스위치와 인렛 사이
    text(D, 'USB 2.0', X(REAR.usb.x), Y(REAR.usb.h + 11), 2.0);
    text(D, 'USB AUDIO  →  CH 11/12  /  STEREO (PRE)', X(REAR.usb.x) - 50, Y(REAR.usb.h + 2), 1.4);
    g.strokeStyle = '#d9dbe0'; g.lineWidth = 0.3 * s; g.strokeRect(X(70) * s, Y(26) * s, 72 * s, 16 * s);
    ['THIS DEVICE COMPLIES WITH PART 15 OF THE FCC RULES.', 'OPERATION IS SUBJECT TO THE FOLLOWING TWO CONDITIONS.'].forEach(function (l, i) { text(D, l, X(70) + 2, Y(22 - i * 3), 1.15, { align: 'left' }); });
    g.strokeRect(X(-10) * s, Y(26) * s, 120 * s, 16 * s);
    text(D, 'CAUTION · RISK OF ELECTRIC SHOCK · DO NOT OPEN', X(-70), Y(18), 1.5);
    return tex(D.c);
  }
  function cheekDecal() {
    var D = cvs(80, 20, 10), g = D.g, s = D.s;
    g.fillStyle = 'rgba(150,152,158,0.95)'; g.beginPath(); g.ellipse(40 * s, 10 * s, 39 * s, 9.2 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0b0c0e'; g.beginPath(); g.ellipse(40 * s, 10 * s, 38 * s, 8.4 * s, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#d6d8dc'; g.lineWidth = 0.7 * s; g.beginPath(); g.arc(9 * s, 10 * s, 5.5 * s, 0, Math.PI * 2); g.stroke();
    text(D, 'YAMAHA', 46, 10.4, 9.5, { weight: '900', color: '#d6d8dc' });
    return tex(D.c);
  }
  function spxDisplayTex() {
    var D = cvs(16, 10, 24), g = D.g;
    g.fillStyle = '#120403'; g.fillRect(0, 0, D.c.width, D.c.height);
    text(D, '24', 8, 5.3, 8.6, { color: '#ff6a1a', weight: '700', style: 'italic' });
    return tex(D.c);
  }

  // ---------------------------------------------------------------------------
  function create(options) {
    var opt = options || {}, M = makeMaterials();
    var root = new THREE.Group(); root.name = NS + 'Root';
    var parts = {}, knobs = {}, faders = {}, buttons = {}, leds = {}, ports = {};
    function reg(k, o) { parts[k] = o; return o; }

    // ===== 섀시 =====
    var chassis = reg('chassis', grp('chassis')); root.add(chassis);
    var bodyPts = sideProfile(false), cheekPts = sideProfile(true);
    // 본체 후면(h 6.7~90 경사면)은 통째로 빼고, AC IN·USB 개구부가 뚫린 면으로 다시 덮는다
    var bodyGeo = removeRearFace(extrudeProfile(bodyPts, -INNER, INNER, 0));
    chassis.add(reg('body', mk(bodyGeo, M.body, 'body')));
    var rf = new THREE.Shape(), rfLen = Math.hypot(10.2, 90 - 6.7);
    polyPath(rf, [[-INNER, 0], [INNER, 0], [INNER, rfLen], [-INNER, rfLen]]);
    var rfY = function (h) { return (h - 6.7) * rfLen / (90 - 6.7); }; // 높이 h → 면을 따라 잰 거리
    // mountRear 의 로컬 +X = 월드 -X  →  월드 x 는 로컬 -x
    var acHole = polyPath(new THREE.Path(), iecOpenPts(), -REAR.acIn.x, rfY(REAR.acIn.h));
    var usbHole = polyPath(new THREE.Path(), USB_OPEN, -REAR.usb.x, rfY(REAR.usb.h));
    rf.holes.push(acHole, usbHole);
    var rearFace = mk(new THREE.ShapeGeometry(rf, 4), M.body, 'bodyRearFace');
    mountRear(rearFace, 0, 6.7); chassis.add(reg('bodyRearFace', rearFace));
    ['Left', 'Right'].forEach(function (side) {
      var x0 = side === 'Left' ? -HALF : INNER, x1 = side === 'Left' ? -INNER : HALF;
      var c = mk(extrudeProfile(cheekPts, x0, x1, 1.6), M.cheek, 'cheek' + side);
      chassis.add(reg('cheek' + side, c));
      // 측면 통풍 슬롯(후면 블록 쪽, 비스듬한 홈 14개)
      var sx = side === 'Left' ? -(HALF - 0.27) : (HALF - 0.27); // 홈 바깥면이 측판 표면보다 0.03mm만 나오도록
      for (var i = 0; i < 14; i++) {
        var slat = mk(new THREE.BoxGeometry(0.6, 1.3, 36), M.hole, 'cheek' + side + '.vent' + (i + 1), { cast: false });
        var dd = 78 + i * 6.2;
        setPosMM(slat, sx, 27, dd - D0); slat.rotation.x = -0.95; chassis.add(slat);
      }
      // 측판 앞쪽 YAMAHA 로고 판
      var logo = mk(new THREE.PlaneGeometry(64, 16), decalMat(cheekDecal()), 'cheek' + side + '.logo', { cast: false });
      logo.rotation.y = side === 'Left' ? -Math.PI / 2 : Math.PI / 2;
      var lx = side === 'Left' ? -HALF - 0.03 : HALF + 0.03;
      logo.rotation.z = side === 'Left' ? -TILT : TILT; // 글자 기울기를 경사판과 같게(앞쪽이 낮음)
      setPosMM(logo, lx, 24.5, 376 - D0); chassis.add(logo);
    });

    // ===== 인쇄 =====
    var sd = slabDecal();
    var slabPrint = mk(new THREE.PlaneGeometry(INNER * 2, sd.len), decalMat(sd.tex), 'slabPrint', { cast: false });
    slabPrint.rotation.x = -Math.PI / 2 + TILT;
    var midD = (SLAB.d0 + SLAB.d1) / 2;
    setPosMM(slabPrint, 0, slabH(midD) + 0.06, midD - D0); chassis.add(reg('slabPrint', slabPrint));
    var plat = mk(new THREE.PlaneGeometry(INNER * 2, PLATEAU.d1 - PLATEAU.d0), decalMat(plateauDecal()), 'plateauPrint', { cast: false });
    plat.rotation.x = -Math.PI / 2; setPosMM(plat, 0, PLATEAU.bodyH + 0.06, (PLATEAU.d0 + PLATEAU.d1) / 2 - D0); chassis.add(reg('plateauPrint', plat));
    var rp = mk(new THREE.PlaneGeometry(INNER * 2, 80), decalMat(rearDecal()), 'rearPrint', { cast: false });
    mountRear(rp, 0, 50, 0.06); chassis.add(reg('rearPrint', rp)); /* h 10~90: 후면 아래 모서리 라운드 위 */

    // ===== 상판(경사판) 조작부 =====
    var top = reg('topPanel', grp('topPanel')); root.add(top);
    var capFor = { gain: M.capWhite, comp: M.capYellow, high: M.capGreen, mid: M.capGreen, low: M.capGreen, aux1: M.capBlue, aux2: M.capWhite, pan: M.capRed };
    CH.forEach(function (ch) {
      ['gain', 'comp', 'high', 'mid', 'low', 'aux1', 'aux2', 'pan'].forEach(function (row) {
        if ((row === 'gain' || row === 'mid') && MIC.indexOf(ch) < 0) return;
        if (row === 'comp' && MONO.indexOf(ch) < 0) return;
        var id = ch + '.' + row, k = buildKnob(M, 'knob.' + id, capFor[row]);
        mountSlab(k, COLS[ch], ROWS[row]); top.add(k); knobs[id] = k;
      });
      var on = buildButton(M, 'btn.' + ch + '.on', 10, 10, 4, null, 0xff9a00); mountSlab(on, COLS[ch], ROWS.on); top.add(on); buttons[ch + '.on'] = on;
      var pre = buildButton(M, 'btn.' + ch + '.pre', 5, 5, 3, M.btnGrey); mountSlab(pre, COLS[ch] + 4.7, ROWS.pre); top.add(pre); buttons[ch + '.pre'] = pre;
      var b12 = buildButton(M, 'btn.' + ch + '.toGroup', 5, 5, 3, M.btnGrey); mountSlab(b12, COLS[ch] + 5.5, ROWS.b12); top.add(b12); buttons[ch + '.toGroup'] = b12;
      var bst = buildButton(M, 'btn.' + ch + '.toStereo', 5, 5, 3, M.btnRed); mountSlab(bst, COLS[ch] + 5.5, ROWS.bst); top.add(bst); buttons[ch + '.toStereo'] = bst;
      var pfl = buildButton(M, 'btn.' + ch + '.pfl', 5, 5, 3, M.btnGrey); mountSlab(pfl, COLS[ch] + 5.5, ROWS.pfl); top.add(pfl); buttons[ch + '.pfl'] = pfl;
      if (MIC.indexOf(ch) >= 0) { var pk = buildLed(M, 'led.' + ch + '.peak', 0xff2a1a); mountSlab(pk, COLS[ch] + 5.5, ROWS.peak); top.add(pk); leds[ch + '.peak'] = pk; }
      var f = buildFader(M, 'fader.' + ch, M.faderWhite); mountSlab(f, COLS[ch] - 5.1, (ROWS.faderTop + ROWS.faderBot) / 2); top.add(f); faders[ch] = f;
    });
    // 채널 5/6·7/8 HPF, 팬텀, USB/LINE
    [['ch56', -23.7], ['ch78', 1.1]].forEach(function (h) { var b = buildButton(M, 'btn.' + h[0] + '.hpf', 5, 5, 3, M.btnGrey); mountSlab(b, h[1], 168.9); top.add(b); buttons[h[0] + '.hpf'] = b; });
    var ph = buildButton(M, 'btn.phantom', 6, 4, 2.6, M.btnRed); mountSlab(ph, 1.1, ROWS.comp); top.add(ph); buttons.phantom = ph;
    var phl = buildLed(M, 'led.phantom', 0xff2a1a); mountSlab(phl, -7.5, ROWS.comp); top.add(phl); leds.phantom = phl;
    var usbsw = buildButton(M, 'btn.lineUsb', 5, 5, 3, M.btnGrey); mountSlab(usbsw, 55.7, 168.9); top.add(usbsw); buttons.lineUsb = usbsw;
    // 마스터
    var mk2 = function (id, x, d, cap, size) { var k = buildKnob(M, 'knob.' + id, cap, size); mountSlab(k, x, d); top.add(k); knobs[id] = k; };
    mk2('fxrtn.aux1', COLS.fxrtn, ROWS.aux1, M.capBlue);
    mk2('master.aux1', COLS.group, ROWS.aux1, M.capBlue); mk2('master.aux2', COLS.group, ROWS.aux2, M.capBlue);
    mk2('monitor.level', COLS.stereo, ROWS.aux1, M.capWhite, 'large'); mk2('phones.level', COLS.stereo, ROWS.aux2, M.capWhite, 'large');
    mk2('spx.program', SPX.program[0], SPX.program[1], null, 'program'); mk2('spx.parameter', SPX.parameter[0], SPX.parameter[1], M.capWhite);
    ['fxrtn', 'group', 'stereo'].forEach(function (m) {
      var on = buildButton(M, 'btn.' + m + '.on', 10, 10, 4, null, 0xff9a00); mountSlab(on, COLS[m], ROWS.on); top.add(on); buttons[m + '.on'] = on;
      var f = buildFader(M, 'fader.' + m, m === 'group' ? M.faderBlue : m === 'stereo' ? M.faderRed : M.faderWhite);
      mountSlab(f, COLS[m] - (m === 'stereo' ? 0 : 5.1), (ROWS.faderTop + ROWS.faderBot) / 2); top.add(f); faders[m] = f;
    });
    [['fxrtn.toGroup', COLS.fxrtn + 5.5, ROWS.b12, M.btnGrey], ['fxrtn.toStereo', COLS.fxrtn + 5.5, ROWS.bst, M.btnRed],
      ['fxrtn.pfl', COLS.fxrtn + 5.5, ROWS.pfl, M.btnGrey], ['group.toStereo', COLS.group + 5.5, ROWS.bst, M.btnRed],
      ['monitor.source', 132.1, ROWS.pan, M.btnGrey]].forEach(function (b) {
      var bb = buildButton(M, 'btn.' + b[0], 5, 5, 3, b[3]); mountSlab(bb, b[1], b[2]); top.add(bb); buttons[b[0]] = bb;
    });
    // RCA 9~12
    RCA.forEach(function (r) { var j = buildRca(M, r[0], r[3]); mountSlab(j, r[1], r[2]); top.add(j); ports[r[0]] = { part: j, type: 'rca-female', role: 'input', accepts: ['rca-male-plug'], insertDepthMM: 9.0 }; });
    // SPX/표시 패널 (살짝 올라온 유광 판) + 7세그 + 미터 LED + POWER LED
    var spx = mk(extrudeUp(rrect(new THREE.Shape(), 0, 0, SPX.x1 - SPX.x0 - 2, (SPX.d1 - SPX.d0 - 2) / Math.cos(TILT), 1.2), 0.5, 0, 6), M.spxPanel, 'spxPanel');
    mountSlab(spx, (SPX.x0 + SPX.x1) / 2, (SPX.d0 + SPX.d1) / 2); top.add(reg('spxPanel', spx));
    spx.material = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.25, metalness: 0.2, transparent: true, opacity: 0.55 });
    var disp = mk(new THREE.PlaneGeometry(16, 10).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: spxDisplayTex(), emissiveMap: null, emissive: 0xff6a1a, emissiveIntensity: 0.0, roughness: 0.2 }), 'spxDisplay', { cast: false });
    mountSlab(disp, SPX.x0 + 13, SPX.d0 + 10, 0.55); top.add(reg('spxDisplay', disp));
    var meter = grp('meter'); top.add(reg('meter', meter));
    var segColor = function (i) { return i === 0 ? 0xff2a1a : i <= 3 ? 0xffc21a : 0x2ee84a; };
    ['L', 'R'].forEach(function (lr, c) {
      for (var i = 0; i < 12; i++) {
        var mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(segColor(i)).multiplyScalar(0.18), emissive: new THREE.Color(segColor(i)), emissiveIntensity: 0, roughness: 0.3 });
        var seg = mk(new THREE.BoxGeometry(3.4, 0.8, 1.6).translate(0, 0.4, 0), mat, 'meter.' + lr + (i + 1), { cast: false });
        mountSlab(seg, SPX.x1 - 18 + c * 13.5, SPX.d0 + 15 + i * 4.2, 0.5); meter.add(seg);
        leds['meter' + lr + (i + 1)] = { userData: { lamp: mat } };
      }
    });
    var pled = buildLed(M, 'led.power', 0xffffff); mountSlab(pled, SPX.x1 - 6, SPX.d0 + 6, 0.5); top.add(pled); leds.power = pled;
    // 나사
    SCREWS_TOP.forEach(function (s, i) { var sc = buildScrew(M, 'screw.top' + (i + 1)); mountSlab(sc, s[0], s[1]); top.add(sc); });

    // ===== 잭 패널 (후면 블록 윗면) =====
    var jp = reg('jackPanel', grp('jackPanel')); root.add(jp);
    JACK.combo.forEach(function (c) { var j = buildXlrFemale(M, c[0], true); mountPlateau(j, c[1], JACK.row1); jp.add(j);
      ports[c[0]] = { part: j, type: 'combo-xlr3-female-phone', role: 'input', accepts: ['xlr3-male-cable-plug', 'trs-6.3-plug', 'ts-6.3-plug'], insertDepthMM: XLRF_IN.insertDepthMM, insertDepthByConnectorMM: { 'xlr3-male-cable-plug': XLRF_IN.insertDepthMM, 'trs-6.3-plug': 30, 'ts-6.3-plug': 30 } }; });
    JACK.xlrMic.forEach(function (c) { var j = buildXlrFemale(M, c[0], false); mountPlateau(j, c[1], JACK.row1); jp.add(j);
      ports[c[0]] = { part: j, type: 'xlr3-female', role: 'input', accepts: ['xlr3-male-cable-plug'], insertDepthMM: XLRF_IN.insertDepthMM }; });
    JACK.row1Phone.forEach(function (c) { var j = buildPhoneJack(M, c[0]); mountPlateau(j, c[1], JACK.row1); jp.add(j);
      ports[c[0]] = { part: j, type: 'phone-6.3-trs-impedance-balanced', role: 'output', accepts: ['trs-6.3-plug', 'ts-6.3-plug'], insertDepthMM: PHONE.insertDepthMM }; });
    JACK.stereoXlr.forEach(function (c) { var j = buildXlrMale(M, c[0]); mountPlateau(j, c[1], JACK.row1); jp.add(j);
      ports[c[0]] = { part: j, type: 'xlr3-male', role: 'output', accepts: ['xlr3-female-cable-plug'], insertDepthMM: XLRM_OUT.insertDepthMM }; });
    JACK.row2Jacks.concat(JACK.row3Jacks).forEach(function (c, i) {
      var j = buildPhoneJack(M, c[0], c[0] === 'phones'); mountPlateau(j, c[1], i < JACK.row2Jacks.length ? JACK.row2 : JACK.row3); jp.add(j);
      var out = /Out|phones/.test(c[0]), type = c[0] === 'phones' ? 'phone-6.3-stereo' : c[0] === 'footSw' ? 'phone-6.3-ts' : out ? 'phone-6.3-trs-impedance-balanced' : 'phone-6.3-unbalanced';
      ports[c[0]] = { part: j, type: type, role: out ? 'output' : 'input', accepts: c[0] === 'phones' ? ['trs-6.3-plug'] : c[0] === 'footSw' ? ['ts-6.3-plug'] : ['trs-6.3-plug', 'ts-6.3-plug'], insertDepthMM: PHONE.insertDepthMM };
    });
    JACK.padHpf.forEach(function (p, i) {
      var pad = buildButton(M, 'btn.ch' + (i + 1) + '.pad', 5.5, 5.5, 3, M.btnGrey); mountPlateau(pad, p[0], JACK.padRow); jp.add(pad); buttons['ch' + (i + 1) + '.pad'] = pad;
      var hpf = buildButton(M, 'btn.ch' + (i + 1) + '.hpf', 5.5, 5.5, 3, M.btnGrey); mountPlateau(hpf, p[1], JACK.padRow); jp.add(hpf); buttons['ch' + (i + 1) + '.hpf'] = hpf;
    });
    // 잭 고정나사 (콤보·XLR 대각 2개씩) + 패널 나사
    JACK.combo.concat(JACK.xlrMic, JACK.stereoXlr).forEach(function (c, i) {
      var r = i < 4 ? 15.2 : 14.0;
      [[-1, 1], [1, -1]].forEach(function (sg, k) { var sc = buildScrew(M, 'screw.' + c[0] + '.' + (k + 1), 1.8); mountPlateau(sc, c[1] + sg[0] * r * 0.62, JACK.row1 - sg[1] * r * 0.78); jp.add(sc); });
    });
    SCREWS_PLATEAU.forEach(function (s, i) { var sc = buildScrew(M, 'screw.plateau' + (i + 1)); mountPlateau(sc, s[0], s[1]); jp.add(sc); });

    // ===== 후면 패널 =====
    var rear = reg('rearPanel', grp('rearPanel')); root.add(rear);
    // AC IN (IEC C14)
    var iec = buildIecInlet(M);
    mountRear(iec, REAR.acIn.x, REAR.acIn.h); rear.add(reg('acIn', iec));
    ports.acIn = { part: iec, type: 'iec-c14', role: 'power', accepts: ['iec-c13-plug'], insertDepthMM: IEC.insertDepthMM, axis: 'z',
      extra: { recessDepthMM: IEC.frame.face - IEC.floor, openingMM: { w: IEC.open.w, h: IEC.open.h, chamfer: IEC.open.chamfer, chamferSide: '+Y' },
        pinsMM: IEC.pins.map(function (p) { return { name: p[0], x: p[1], y: p[2], tipBelowFaceMM: IEC.frame.face - IEC.pinTip }; }) } };
    // 전원 로커 스위치 (사진: 베젤 14.5×20.5, 위 '—' / 아래 'O')
    var pw = grp('powerSwitch');
    pw.add(mk(new THREE.BoxGeometry(14.5, 20.5, 2.2).translate(0, 0, 1.1), M.plastic, 'powerSwitch.bezel'));
    var rocker = mk(new THREE.BoxGeometry(11, 17, 3.2).translate(0, 0, 1.6), M.plastic, 'powerSwitch.rocker'); rocker.position.z = 1.0 * MM; pw.add(rocker);
    var mark = mk(new THREE.BoxGeometry(4, 1.0, 0.3), M.capWhite, 'powerSwitch.onMark', { cast: false }); mark.position.set(0, 4.5 * MM, 3.3 * MM); rocker.add(mark); // 로커 윗면 z=3.2
    var offMark = mk(new THREE.RingGeometry(1.1, 1.8, 20), M.capWhite, 'powerSwitch.offMark', { cast: false }); offMark.position.set(0, -4.0 * MM, 3.25 * MM); rocker.add(offMark);
    hide(pw.userData, 'rocker', rocker);
    mountRear(pw, REAR.power.x, REAR.power.h); rear.add(reg('powerSwitch', pw));
    // USB Type-B
    var usb = grp('usb');
    var plate = new THREE.Shape(); rrect(plate, 0, 0, 16, 14, 0.8); plate.holes.push(polyPath(new THREE.Path(), USB_OPEN));
    usb.add(mk(new THREE.ExtrudeGeometry(plate, { depth: 1.2, bevelEnabled: false }), M.jackHousing, 'usb.plate'));
    var ush = new THREE.Shape(); ush.moveTo(-6, -5.4); ush.lineTo(6, -5.4); ush.lineTo(6, 3.2); ush.lineTo(3.8, 5.4); ush.lineTo(-3.8, 5.4); ush.lineTo(-6, 3.2); ush.closePath();
    ush.holes.push(polyPath(new THREE.Path(), USB_OPEN));
    usb.add(mk(new THREE.ExtrudeGeometry(ush, { depth: 2.4, bevelEnabled: false }), M.nickel, 'usb.shell'));
    // 패널 안쪽 소켓 벽(금속 셸 안쪽) + 바닥 + 가운데 혀(플라스틱)
    var uw = mk(new THREE.ExtrudeGeometry(polyPath(new THREE.Shape(), USB_OPEN), { depth: 7, bevelEnabled: false }).translate(0, 0, -7), M.nickel, 'usb.well', { cast: false });
    uw.material = new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.4, metalness: 0.8, side: THREE.BackSide }); usb.add(uw);
    usb.add(mk(new THREE.ShapeGeometry(polyPath(new THREE.Shape(), USB_OPEN)).translate(0, 0, -7 + 0.01), M.hole, 'usb.back', { cast: false }));
    var tongue = mk(new THREE.BoxGeometry(5.2, 2.6, 7.6).translate(0, 0, -7 + 3.8), M.plastic, 'usb.tongue'); tongue.position.y = -0.4 * MM; usb.add(tongue); // 앞면 = 셸 앞면에서 1.8mm 안쪽
    [-REAR.usbScrewDx, REAR.usbScrewDx].forEach(function (dx, i) { var sc = buildScrew(M, 'usb.screw' + (i + 1), 1.9); sc.rotation.x = Math.PI / 2; setPosMM(sc, -dx, 2.5, 0); usb.add(sc); });
    usb.userData.faceMM = 2.4;
    mountRear(usb, REAR.usb.x, REAR.usb.h); rear.add(reg('usb', usb));
    ports.usb = { part: usb, type: 'usb-b', role: 'bidirectional', accepts: ['usb-b-plug'], insertDepthMM: 8.5, axis: 'z' };
    REAR.screws.forEach(function (s, i) { var sc = buildScrew(M, 'screw.rear' + (i + 1), 2.2); sc.rotation.x = Math.PI / 2; mountRear(sc, s[0], s[1]); var q = sc.quaternion.clone(); sc.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))); rear.add(sc); });

    // ===== 단자 기준점 =====
    var anchors = grp('portAnchors'); root.add(anchors);
    root.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    Object.keys(ports).forEach(function (id) {
      var p = ports[id], part = p.part;
      var axisLocal = p.axis === 'z' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
      var keyLocal = p.axis === 'z' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, -1); // 위쪽잭: 키/래치는 뒤(-Z)
      var face = (part.userData.faceMM || 0) * MM;
      var pos = axisLocal.clone().multiplyScalar(face).applyMatrix4(part.matrixWorld).applyMatrix4(inv);
      var q = new THREE.Quaternion(); part.getWorldQuaternion(q);
      var n = axisLocal.clone().applyQuaternion(q).normalize(), key = keyLocal.clone().applyQuaternion(q).normalize();
      var Z = n, Y = key, X = new THREE.Vector3().crossVectors(Y, Z);
      var a = new THREE.Object3D(); a.name = NS + '.port.' + id; a.position.copy(pos);
      a.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
      a.userData = { portId: id, type: p.type, role: p.role, accepts: p.accepts, insertDepthMM: p.insertDepthMM,
        insertDepthByConnectorMM: p.insertDepthByConnectorMM || null, localPosition: pos.clone(), localNormal: n.clone(),
        insertDirection: n.clone().negate(), keyDirection: key.clone(), partName: part.name };
      if (p.extra) Object.keys(p.extra).forEach(function (k) { a.userData[k] = p.extra[k]; });
      anchors.add(a); ports[id] = a;
    });

    // ===== 상태 API =====
    var state = { power: true, knobs: {}, faders: {}, buttons: {} };
    function setKnob(id, v) { var k = knobs[id]; if (!k) throw new Error('unknown knob ' + id); v = Math.max(0, Math.min(1, v)); state.knobs[id] = v; k.rotation.y = (0.5 - v) * 300 * Math.PI / 180; }
    function setFader(id, v) { var f = faders[id]; if (!f) throw new Error('unknown fader ' + id); v = Math.max(0, Math.min(1, v)); state.faders[id] = v; f.userData.cap.position.z = (0.5 - v) * f.userData.travelMM * MM; }
    function lamp(o, on, k) { if (o && o.userData.lamp) o.userData.lamp.emissiveIntensity = on ? (k || 1.4) : 0; }
    function setButton(id, on) { var b = buttons[id]; if (!b) throw new Error('unknown button ' + id); state.buttons[id] = !!on; b.userData.pressed = !!on;
      b.userData.cap.position.y = (0.8 - (on ? 0.9 : 0)) * MM; lamp(b, on && state.power && /\.on$/.test(id), 0.55); }
    function setLed(id, on) { lamp(leds[id], on && state.power, 1.6); }
    function setMeter(l, r) { for (var i = 0; i < 12; i++) { var th = (11 - i) / 12; lamp(leds['meterL' + (i + 1)], state.power && l > th, 1.3); lamp(leds['meterR' + (i + 1)], state.power && r > th, 1.3); } }
    function setPower(on) {
      state.power = !!on; parts.powerSwitch.userData.rocker.rotation.x = (on ? -0.12 : 0.12);
      lamp(leds.power, on, 1.5); parts.spxDisplay.material.emissiveIntensity = on ? 0.9 : 0; parts.spxDisplay.material.emissiveMap = on ? parts.spxDisplay.material.map : null;
      parts.spxDisplay.material.needsUpdate = true;
      Object.keys(state.buttons).forEach(function (id) { setButton(id, state.buttons[id]); });
      if (!on) { Object.keys(leds).forEach(function (id) { lamp(leds[id], false); }); }
    }
    Object.keys(knobs).forEach(function (id) { setKnob(id, /pan|high|mid|low/.test(id) ? 0.5 : /gain/.test(id) ? 0.35 : /spx/.test(id) ? 0.5 : /level|master/.test(id) ? 0.6 : 0); });
    Object.keys(faders).forEach(function (id) { setFader(id, 0); }); // 공식 도면과 같은 −∞(맨 아래)
    Object.keys(buttons).forEach(function (id) { setButton(id, /\.on$|toStereo/.test(id)); });
    setPower(opt.power !== false); setMeter(0, 0);

    hide(root.userData, NS, { version: '1.0.0', dimensionsMM: DIM, parts: parts, knobs: knobs, faders: faders, buttons: buttons, leds: leds, ports: ports, materials: M,
      setKnob: setKnob, setFader: setFader, setButton: setButton, setLed: setLed, setMeter: setMeter, setPower: setPower,
      getState: function () { return JSON.parse(JSON.stringify(state)); } });
    return root;
  }

  // ---------------------------------------------------------------------------
  function findAnchor(root, id) { var api = root.userData[NS]; if (api && api.ports[id]) return api.ports[id]; return root.getObjectByName(NS + '.port.' + id) || null; }
  function portIds(root) { var ids = []; root.traverse(function (o) { if (o.name && o.name.indexOf(NS + '.port.') === 0) ids.push(o.name.slice((NS + '.port.').length)); }); return ids; }
  function getPortInfo(root, id) {
    var a = findAnchor(root, id); if (!a) return null;
    root.updateWorldMatrix(true, true);
    var u = a.userData, wp = new THREE.Vector3(), wq = new THREE.Quaternion(); a.getWorldPosition(wp); a.getWorldQuaternion(wq);
    var wn = new THREE.Vector3(0, 0, 1).applyQuaternion(wq).normalize(), wk = new THREE.Vector3(0, 1, 0).applyQuaternion(wq).normalize();
    var ln = new THREE.Vector3().copy(u.localNormal);
    var scale = ln.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(root.matrixWorld)).length();
    return { id: u.portId, type: u.type, role: u.role, accepts: u.accepts.slice(), localPosition: new THREE.Vector3().copy(u.localPosition), localNormal: ln,
      insertDirectionLocal: new THREE.Vector3().copy(u.insertDirection), keyDirectionLocal: new THREE.Vector3().copy(u.keyDirection),
      worldPosition: wp, worldNormal: wn, worldInsertDirection: wn.clone().negate(), worldKeyDirection: wk, worldQuaternion: wq,
      insertDepthMM: u.insertDepthMM, insertDepthByConnectorMM: u.insertDepthByConnectorMM, worldInsertDepth: u.insertDepthMM * MM * scale, worldScale: scale, anchor: a };
  }
  function getAllPorts(root) { return portIds(root).map(function (id) { return getPortInfo(root, id); }); }
  function seatPlug(root, plug, portId, depthOverrideM) {
    var p = getPortInfo(root, portId), depth = depthOverrideM !== undefined ? depthOverrideM : p.worldInsertDepth;
    plug.quaternion.copy(p.worldQuaternion); plug.position.copy(p.worldPosition).addScaledVector(p.worldNormal, -depth);
    var ax = plug.userData && plug.userData.axisOffsetLocal; if (ax) plug.position.sub(new THREE.Vector3().copy(ax).applyQuaternion(p.worldQuaternion));
    plug.updateMatrixWorld(true); return p;
  }
  function toGear3dPortsLocal(root, off) {
    off = off || new THREE.Vector3(); var out = { input: {}, output: {}, power: {}, bidirectional: {} };
    portIds(root).forEach(function (id) { var a = findAnchor(root, id), p = new THREE.Vector3().copy(a.userData.localPosition).add(off);
      out[a.userData.role][id] = [+p.x.toFixed(5), +p.y.toFixed(5), +p.z.toFixed(5)]; });
    return out;
  }

  global.YamahaMG12XU = { NAMESPACE: NS, DIMENSIONS_MM: DIM, LAYOUT_MM: { COLS: COLS, ROWS: ROWS, JACK: JACK, RCA: RCA, SPX: SPX, REAR: REAR, SLAB: SLAB, PLATEAU: PLATEAU },
    XLR_IN_MM: XLRF_IN, XLR_OUT_MM: XLRM_OUT, PHONE_MM: PHONE, sideProfile: sideProfile, slabHeightMM: slabH,
    create: create, getPortInfo: getPortInfo, getAllPorts: getAllPorts, seatPlug: seatPlug, toGear3dPortsLocal: toGear3dPortsLocal };
})(typeof window !== 'undefined' ? window : this);
