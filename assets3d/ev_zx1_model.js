/*
 * Electro-Voice ZX1 (ZX1-90, 8" 2-way 200W 패시브 스피커) — Sound-Team-Training 3D 에셋 단계 5/8
 *  - Three.js r128 전역 THREE, 단위 m, 전역 네임스페이스 window.EvZX1
 *  - 4단계 ZXA1 과 같은 인클로저(공식 치수도 동일) → 캐비닛·그릴·발·폴 소켓·45° 면은 같은 근거로 독립 구현(ZXA1 파일은 건드리지 않음)
 *
 * 근거
 *  - ZX1-90 Engineering Data Sheet: 457 x 282 x 264 mm, 순중량 8.4 kg, 고강도 폴리머 인클로저, 8 Ω, 200 W 연속,
 *    Neutrik Speakon NL4 x2 (블록도: 두 단자 병렬), 일체형 모니터 각, 폴 마운트, 손잡이 홈, #8-32 매다는 점 4개
 *  - 뒷면 단자판: 실물 사진(중고 매물 사진 근접 촬영) — 글자·배치는 사진 비례로 추정
 *  - Neutrik NL4MP 패널 컷아웃: Ø24.0, 고정 구멍 Ø3.2, 간격 19.0 x 24.0 (Neutrik 조립 도면)
 *
 * 좌표: 원점 = 바닥(받침발 아래면) 중심, +Y 위, +Z 앞(그릴), +X = 앞에서 볼 때 오른쪽(45° 모니터 면 쪽)
 */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { console.error('[EvZX1] THREE(r128) 가 먼저 로드되어야 합니다.'); return; }
  var NS = 'evZx1', MM = 0.001;

  var DIM = { width: 282, height: 457, depth: 264, weightKg: 8.4 };
  var SECTION = // ZXA1 수평 단면 (공식 도면 Top View 실측 → 폭 282 / 깊이 263.2(+그릴 0.8) 정규화, X=폭 중심, Z=+앞, 45° 모니터 면 = 측정점 최소제곱 직선, 그 밖 가벼운 평활)
[[-40.96, -131.4], [-52.07, -128.03], [-61.3, -124.66], [-68.43, -121.29], [-74.12, -117.92], [-78.84, -114.55], [-82.93, -111.18], [-86.53, -107.81], [-89.7, -104.44], [-92.55, -101.06], [-95.19, -97.69], [-97.65, -94.32], [-100.03, -90.94], [-102.3, -87.57], [-104.31, -84.2], [-106.19, -80.83], [-108.06, -77.46], [-109.75, -74.09], [-111.21, -70.72], [-112.63, -67.35], [-114.05, -63.98], [-115.43, -60.64], [-116.68, -57.3], [-117.83, -53.95], [-118.96, -50.58], [-120.08, -47.21], [-121.21, -43.84], [-122.3, -40.47], [-123.29, -37.1], [-124.17, -33.73], [-125.02, -30.36], [-125.86, -26.99], [-126.7, -23.62], [-127.54, -20.25], [-128.33, -16.88], [-129.01, -13.5], [-129.64, -10.13], [-130.35, -6.76], [-131.13, -3.38], [-131.82, -0.01], [-132.41, 3.36], [-132.97, 6.73], [-133.54, 10.1], [-134.1, 13.46], [-134.66, 16.81], [-135.19, 20.14], [-135.59, 23.49], [-135.94, 26.86], [-136.37, 30.23], [-136.87, 33.6], [-137.28, 36.97], [-137.62, 40.35], [-138.06, 43.72], [-138.56, 47.09], [-138.97, 50.46], [-139.32, 53.83], [-139.72, 57.2], [-140.12, 60.57], [-140.43, 63.94], [-140.69, 67.31], [-140.93, 70.69], [-141.0, 74.06], [-140.73, 77.43], [-140.03, 80.8], [-138.97, 84.03], [-137.59, 87.01], [-135.49, 90.32], [-132.16, 94.86], [-127.92, 100.68], [-123.45, 106.92], [-118.96, 112.51], [-114.46, 116.83], [-109.98, 119.93], [-105.51, 122.08], [-101.02, 123.53], [-96.52, 124.46], [-92.02, 125.06], [-87.53, 125.47], [-83.03, 125.81], [-78.54, 126.25], [-74.07, 126.75], [-69.58, 127.15], [-65.08, 127.5], [-60.59, 127.9], [-56.12, 128.31], [-51.64, 128.62], [-47.14, 128.84], [-42.65, 129.0], [-38.15, 129.18], [-33.65, 129.4], [-29.17, 129.59], [-24.69, 129.81], [-20.2, 130.19], [-15.28, 130.67], [-8.69, 131.06], [-0.01, 131.2], [8.67, 131.06], [15.26, 130.67], [20.18, 130.19], [24.67, 129.81], [29.15, 129.59], [33.63, 129.4], [38.13, 129.18], [42.63, 129.0], [47.12, 128.84], [51.62, 128.62], [56.1, 128.31], [60.57, 127.9], [65.06, 127.5], [69.56, 127.15], [74.05, 126.75], [78.52, 126.25], [83.01, 125.81], [87.51, 125.47], [92.0, 125.06], [96.5, 124.46], [101.0, 123.53], [105.49, 122.08], [109.96, 119.93], [114.45, 116.83], [118.94, 112.51], [123.43, 106.92], [127.9, 100.68], [132.18, 94.86], [135.66, 90.32], [137.99, 87.01], [139.51, 84.03], [140.53, 80.8], [141.0, 77.43], [140.98, 74.06], [140.73, 70.69], [140.44, 67.31], [140.14, 63.94], [139.85, 60.57], [139.58, 57.2], [139.32, 53.83], [139.04, 50.46], [138.75, 47.09], [138.46, 43.72], [138.17, 40.35], [137.86, 36.97], [137.48, 33.6], [137.1, 30.23], [136.74, 26.86], [136.32, 23.49], [135.8, 20.14], [135.27, 16.81], [134.83, 13.46], [134.49, 10.1], [134.08, 6.73], [133.55, 3.36], [132.99, -0.01], [132.43, -3.38], [131.89, -6.76], [131.38, -10.13], [130.67, -13.5], [129.47, -16.88], [127.89, -20.25], [125.12, -23.62], [120.65, -26.99], [106.91, -29.03], [103.58, -32.4], [100.25, -35.78], [96.93, -39.15], [93.6, -42.51], [90.27, -45.88], [86.94, -49.25], [83.62, -52.62], [80.29, -55.98], [76.96, -59.35], [73.63, -62.72], [70.3, -66.09], [66.99, -69.45], [63.66, -72.82], [60.33, -76.19], [57.0, -79.56], [53.68, -82.93], [50.35, -86.3], [48.88, -90.94], [46.7, -94.32], [44.94, -97.69], [43.64, -101.06], [42.29, -104.44], [40.07, -107.81], [36.2, -111.18], [30.69, -114.55], [24.46, -117.92], [18.06, -121.29], [10.84, -124.66], [1.57, -127.86], [-10.59, -130.36], [-25.0, -132.0]]; // [X, Z] mm, 캐비닛 외곽(그릴 제외). 그릴은 앞쪽에 +0.8mm
  var FEET_H = 12.0;          // 받침발 높이 (치수도 Front/Rear View: 몸체 아랫면 ~445mm 아래 → 추정 12)
  var EDGE_R = 10.0;          // 윗/아랫 모서리 라운드 (도면 비례 추정)
  var BODY = { y0: FEET_H, y1: DIM.height };
  // 뒷면: 앰프 패널 오목부와 손잡이 홈 (치수도 Rear/Right View 측정)
  var PANEL = { cx: -23.65, cy: 233.55, w: 115.7, h: 191.6, faceZ: -108.0, recessZ: -105.0, boxDepth: 18.0, r: 4.0, k: 115.7 / 117.0 };
  var RECESS = { y0: 133.0, y1: 334.0 };                       // 패널 오목부 높이 범위
  var POCKET = { y0: 385.8, y1: 420.4, z: -108.0 };             // 손잡이 홈
  var FACET = { a: [106.91, -29.03], b: [50.35, -86.3], padClear: 2.5 }; // 45° 모니터 면 (도면 측정점 최소제곱 직선 45.4°), 패드는 면 밖 가장 튀어나온 곳보다 2.5mm 더
  var FEET = [[-99.0, 41.0], [97.0, 41.0], [44.5, -47.5], [-62.0, -97.0]]; // [X, Z] 받침발 겸 #8-32 매다는 점 (Bottom View)
  var POLE = { x: 0.0, z: -99.5, r: 17.5, depth: 95.0 };           // 35 mm 폴 소켓 (공식 지름, 깊이 추정)
  var GRILLE = { yBot: 27.2, yTop: 438.0, edge: 12.4, waist: 11.3, bow: 9.3, off: 0.8, pitch: 3.6 };
  var BADGE = { y: 78.8, size: 33.0 };

  // 뒷면 단자판 (사진 비례 추정, 테두리 바깥 = 도면의 뒷면 오목부 패널 자리 115.7 x 191.6)
  //  로컬 좌표: +Z 바깥(모델 -Z), +X = 뒤에서 볼 때 오른쪽(모델 -X), +Y 위, z=0 = 테두리 앞면
  var PLATE = {
    bezel: { t: 3.0, side: 11.0, top: 9.0, bottom: 11.0 },          // 나사 박힌 테두리 (폭 추정)
    plateZ: -6.0, plateT: 2.0, plateH: 148.0, floorZ: -18.0,          // 단자판 면은 테두리보다 6mm 안, 그 아래 손가락 홈 바닥 18mm
    bezelScrews: [[-52.35, 72], [52.35, 72], [-52.35, 24], [52.35, 24], [-52.35, -24], [52.35, -24], [-52.35, -72], [52.35, -72]]
  };
  // 단자판 인쇄·부품 배치: u = 단자판 가운데부터 오른쪽(뒤에서 볼 때), v = 단자판 윗변부터 아래, mm (사진 비례 추정)
  var PL = {
    jackA: [-3.0, 64.0], jackB: [-3.0, 101.0], weee: [-29.0, 92.0], ce: [24.0, 66.0]
  };
  // Neutrik speakON NL4MP 섀시 단자 (컷아웃 Ø24·나사 간격 19x24 = 공식, 나머지 치수는 추정)
  var NL4 = {
    model: 'NL4MP', flange: { w: 26.0, h: 31.0, r: 3.0, t: 1.6 }, ring: { rOut: 11.9, rIn: 10.8, t: 2.4 }, cutoutR: 12.0,   // 뒤에서 고정(플랜지는 판 뒤), 앞에는 회색 노즈 링과 나사 2개만 보임(사진)
    screws: [[9.5, 12.0], [-9.5, -12.0]], screwR: 1.9, depth: 18.0, coreR: 6.5, coreFace: 6.0, coreHoleR: 2.4, coreHoleDepth: 4.0,
    keys: [{ ang: 90, w: 5.0, h: 1.3, d0: 0.0, d1: 9.0 }],                // 키 리브(+Y_local), 추정
    contacts: [['1+', 40], ['1-', 140], ['2+', 220], ['2-', 320]],        // 코어 둘레 접점 각도(도식적, 추정)
    lockRotationDeg: 30, lockDirection: 'clockwise-facing-port', insertDepthMM: 14.0
  };
  var PINOUT = { '1+': 'FR+', '1-': 'FR-', '2+': 'N.C.', '2-': 'N.C.' }; // 단자판 인쇄 그대로
  var ELEC = { nominalImpedanceOhm: 8, continuousPowerW: 200, inputsParallel: true };

  // ---------------------------------------------------------------------------
  function hide(t, k, v) { Object.defineProperty(t, k, { value: v, enumerable: false, writable: true, configurable: true }); return v; }
  function mk(geo, mat, name, opt) { geo.scale(MM, MM, MM); var m = new THREE.Mesh(geo, mat); m.name = NS + '.' + name; var o = opt || {}; m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false; return m; }
  function grp(name) { var g = new THREE.Group(); g.name = NS + '.' + name; return g; }
  function setMM(o, x, y, z) { o.position.set(x * MM, y * MM, z * MM); return o; }
  function circ(p, cx, cy, r) { p.absarc(cx, cy, r, 0, Math.PI * 2, false); return p; }
  function rrect(p, cx, cy, w, h, r) { var x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2; r = Math.min(r, w / 2, h / 2);
    p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r); p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
    p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0); return p; }
  function poly(p, pts, dx, dy) { dx = dx || 0; dy = dy || 0; p.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (var i = 1; i < pts.length; i++) p.lineTo(pts[i][0] + dx, pts[i][1] + dy); p.closePath(); return p; }

  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return {
      abs: new S({ color: 0x0e0e0f, roughness: 0.68, metalness: 0.0 }), // 폴리프로필렌(고강도 폴리머) 인클로저
      absDark: new S({ color: 0x060607, roughness: 0.75, metalness: 0.0 }),
      rubber: new S({ color: 0x0a0a0a, roughness: 0.9, metalness: 0.0 }),
      grille: new S({ color: 0x2a2b2e, roughness: 0.55, metalness: 0.45 }),
      panel: new S({ color: 0x1b1c1f, roughness: 0.45, metalness: 0.6 }),
      metal: new S({ color: 0xa7abb1, roughness: 0.3, metalness: 0.9 }),
      screw: new S({ color: 0x55585e, roughness: 0.35, metalness: 0.85 }),
      jack: new S({ color: 0x121316, roughness: 0.4, metalness: 0.5 }),
      insert: new S({ color: 0x070707, roughness: 0.7, metalness: 0.0 }),
      hole: new S({ color: 0x000000, roughness: 1.0, metalness: 0.0 }),
      holeWall: new S({ color: 0x050506, roughness: 0.85, metalness: 0.0, side: THREE.BackSide }),
      nlGrey: new S({ color: 0x5f6267, roughness: 0.6, metalness: 0.05 }),
      holeWallGrey: new S({ color: 0x2c2e31, roughness: 0.7, metalness: 0.0, side: THREE.BackSide }),
      contact: new S({ color: 0xd9c78f, roughness: 0.25, metalness: 0.95 }),
      knobBlue: new S({ color: 0x1d5fbf, roughness: 0.35, metalness: 0.1 }),
      knobGrey: new S({ color: 0x2b2c30, roughness: 0.5, metalness: 0.1 }),
      white: new S({ color: 0xe8e8e8, roughness: 0.4 }),
      badge: new S({ color: 0x1a1a1c, roughness: 0.35, metalness: 0.5 }),
      ledGreenOff: new S({ color: 0x0f3018, roughness: 0.3, emissive: 0x000000 }),
      ledAmberOff: new S({ color: 0x3a2a05, roughness: 0.3, emissive: 0x000000 })
    };
  }

  // ---------------------------------------------------------------------------
  // 단면 처리: 균등 재표본화, 바깥 법선, 안쪽 오프셋, 뒤쪽 평탄화(clamp)
  function resample(pts, n) {
    var L = [0], m = pts.length; for (var i = 1; i <= m; i++) { var a = pts[i - 1], b = pts[i % m]; L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    var tot = L[m], out = [], j = 1;
    for (var k = 0; k < n; k++) { var d = tot * k / n; while (L[j] < d) j++; var t = (d - L[j - 1]) / (L[j] - L[j - 1]); var a2 = pts[j - 1], b2 = pts[j % m]; out.push([a2[0] + (b2[0] - a2[0]) * t, a2[1] + (b2[1] - a2[1]) * t]); }
    // 날카로운 꼭짓점(모니터 면 시작의 턱, 면 끝)은 정확히 유지
    return out;
  }
  function signedArea(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  // XZ 다각형의 바깥 법선(위에서 볼 때)
  function edgeNormals(p) { var cw = signedArea(p) < 0, out = []; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
      out.push(cw ? [-dz / l, dx / l] : [dz / l, -dx / l]); } return out; }
  function vertexNormals(p, en) { var out = [], sharp = []; for (var i = 0; i < p.length; i++) { var a = en[(i - 1 + p.length) % p.length], b = en[i], x = a[0] + b[0], z = a[1] + b[1], l = Math.hypot(x, z) || 1;
      out.push([x / l, z / l]); sharp.push(a[0] * b[0] + a[1] * b[1] < Math.cos(28 * Math.PI / 180)); } return { n: out, sharp: sharp }; }
  function inset(p, vn, d) { return p.map(function (q, i) { return [q[0] - vn[i][0] * d, q[1] - vn[i][1] * d]; }); }
  function clampBack(p, zc) { return p.map(function (q) { return [q[0], Math.max(q[1], zc)]; }); }

  // 캐비닛 로프트: 높이별 링(라운드 오프셋 + 뒤쪽 평탄화)을 이어 붙임. skipFlat: 앰프 패널 오목부 평면(따로 만듦)
  function buildCabinet(M) {
    var N = 360, base = resample(SECTION, N), en0 = edgeNormals(base), vn0 = vertexNormals(base, en0).n;
    var rings = [], R = EDGE_R, steps = 6;
    function ring(y, ins, zc, phi, tag) { var p = inset(base, vn0, ins); if (zc !== null) p = clampBack(p, zc); rings.push({ y: y, p: p, phi: phi, zc: zc, tag: tag }); }
    for (var s = 0; s <= steps; s++) { var ph = (s / steps) * Math.PI / 2; ring(BODY.y0 + R * (1 - Math.cos(ph)), R * (1 - Math.sin(ph)), null, -(Math.PI / 2 - ph), 'bot'); }
    var cuts = [[RECESS.y0, PANEL.recessZ, 'recess'], [RECESS.y1, null, 'recessEnd'], [POCKET.y0, POCKET.z, 'pocket'], [POCKET.y1, null, 'pocketEnd']];
    cuts.forEach(function (c, i) { var prevZ = i === 0 ? null : cuts[i - 1][1]; ring(c[0], 0, prevZ, 0, 'side'); ring(c[0], 0, c[1], 0, c[2]); });
    for (var t = 0; t <= steps; t++) { var ph2 = (t / steps) * Math.PI / 2; ring(BODY.y1 - R * (1 - Math.sin(ph2)), R * (1 - Math.cos(ph2)), null, ph2, 'top'); }
    var pos = [], nor = [], flatSpan = { xMin: Infinity, xMax: -Infinity };
    // 삼각형 추가: 기하 법선이 의도한 법선과 반대면 감기 순서를 뒤집음
    function tri(p0, n0, p1, n1, p2, n2) {
      var ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
      var gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx;
      if (gx * gx + gy * gy + gz * gz < 1e-12) return;
      var ix = n0[0] + n1[0] + n2[0], iy = n0[1] + n1[1] + n2[1], iz = n0[2] + n1[2] + n2[2];
      if (gx * ix + gy * iy + gz * iz < 0) { var t = p1; p1 = p2; p2 = t; t = n1; n1 = n2; n2 = t; }
      [[p0, n0], [p1, n1], [p2, n2]].forEach(function (e) { pos.push(e[0][0], e[0][1], e[0][2]); nor.push(e[1][0], e[1][1], e[1][2]); });
    }
    function quad(a, na, b, nb, c, nc, d, nd) { tri(a, na, b, nb, c, nc); tri(a, na, c, nc, d, nd); } // a-b-c-d 둘레 순서
    for (var k = 0; k < rings.length - 1; k++) {
      var A = rings[k], B = rings[k + 1];
      var stepFace = Math.abs(A.y - B.y) < 1e-9; // 같은 높이 링 사이 = 수평 계단면
      var enA = edgeNormals(A.p), vA = vertexNormals(A.p, enA), enB = edgeNormals(B.p), vB = vertexNormals(B.p, enB);
      for (var i = 0; i < N; i++) {
        var i2 = (i + 1) % N, a0 = A.p[i], a1 = A.p[i2], b0 = B.p[i], b1 = B.p[i2];
        if (stepFace) {
          if (Math.abs(a0[1] - b0[1]) < 1e-6 && Math.abs(a1[1] - b1[1]) < 1e-6) continue; // 차이 없음
          // 오목부 아래 경계(위쪽이 깎임) → 계단면은 위를 향함, 위 경계 → 아래를 향함
          var n = [0, B.zc !== null ? 1 : -1, 0];
          quad([a0[0], A.y, a0[1]], n, [a1[0], A.y, a1[1]], n, [b1[0], B.y, b1[1]], n, [b0[0], B.y, b0[1]], n);
          continue;
        }
        // 앰프 패널 오목부의 평평한 면은 건너뜀(구멍 있는 평면을 따로 만듦)
        if (A.tag === 'recess' && B.zc === PANEL.recessZ && a0[1] === PANEL.recessZ && a1[1] === PANEL.recessZ) {
          flatSpan.xMin = Math.min(flatSpan.xMin, a0[0], a1[0]); flatSpan.xMax = Math.max(flatSpan.xMax, a0[0], a1[0]); continue;
        }
        function nrm(ring, vv, en, idx, side) { var sh = vv.sharp[idx], n2 = sh ? en[side === 0 ? idx : (idx - 1 + N) % N] : vv.n[idx];
          var cph = Math.cos(ring.phi), sph = Math.sin(ring.phi); return [n2[0] * cph, sph, n2[1] * cph]; }
        // 이 모서리(i→i2)에 쓰는 법선: 꼭짓점 i 는 다음 모서리 쪽, i2 는 이전 모서리 쪽
        var nA0 = nrm(A, vA, enA, i, 0), nA1 = nrm(A, vA, enA, i2, 1), nB0 = nrm(B, vB, enB, i, 0), nB1 = nrm(B, vB, enB, i2, 1);
        if (vA.sharp[i]) nA0 = [enA[i][0] * Math.cos(A.phi), Math.sin(A.phi), enA[i][1] * Math.cos(A.phi)];
        if (vA.sharp[i2]) nA1 = [enA[i][0] * Math.cos(A.phi), Math.sin(A.phi), enA[i][1] * Math.cos(A.phi)];
        if (vB.sharp[i]) nB0 = [enB[i][0] * Math.cos(B.phi), Math.sin(B.phi), enB[i][1] * Math.cos(B.phi)];
        if (vB.sharp[i2]) nB1 = [enB[i][0] * Math.cos(B.phi), Math.sin(B.phi), enB[i][1] * Math.cos(B.phi)];
        quad([a0[0], A.y, a0[1]], nA0, [a1[0], A.y, a1[1]], nA1, [b1[0], B.y, b1[1]], nB1, [b0[0], B.y, b0[1]], nB0);
      }
    }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    var body = mk(g, M.abs, 'cabinet');
    // 윗면·아랫면 뚜껑 (아랫면에는 폴 소켓 구멍)
    function cap(p, y, up, holes) {
      pos = []; nor = [];
      var contour = p.map(function (q) { return new THREE.Vector2(q[0], q[1]); }), hs = (holes || []);
      var tris = THREE.ShapeUtils.triangulateShape(contour, hs), all = contour.concat.apply(contour, hs), n = [0, up ? 1 : -1, 0];
      tris.forEach(function (t) { tri([all[t[0]].x, y, all[t[0]].y], n, [all[t[1]].x, y, all[t[1]].y], n, [all[t[2]].x, y, all[t[2]].y], n); });
      var gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return gg;
    }
    var hole = []; for (var h = 0; h < 48; h++) { var an = -h / 48 * Math.PI * 2; hole.push(new THREE.Vector2(POLE.x + Math.cos(an) * POLE.r, POLE.z + Math.sin(an) * POLE.r)); }
    var topP = rings[rings.length - 1].p, botP = rings[0].p;
    var capTop = mk(cap(topP, BODY.y1, true), M.abs, 'cabinetTop'), capBot = mk(cap(botP, BODY.y0, false, [hole]), M.abs, 'cabinetBottom');
    return { body: body, top: capTop, bottom: capBot, flatSpan: flatSpan, base: base };
  }

  // 단면 위 앞쪽(그릴 자리) Z 값: X 에서 가장 앞쪽 경계
  function frontZ(X) {
    var best = -Infinity, p = SECTION;
    for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length];
      if ((a[0] - X) * (b[0] - X) <= 0 && a[0] !== b[0]) { var t = (X - a[0]) / (b[0] - a[0]), z = a[1] + (b[1] - a[1]) * t; if (z > best) best = z; } }
    return best;
  }
  function sectionSpanAtZ(z) { // Z 평면과 단면의 교차 X 범위
    var xs = [], p = SECTION; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length];
      if ((a[1] - z) * (b[1] - z) <= 0 && a[1] !== b[1]) xs.push(a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])); }
    return [Math.min.apply(null, xs), Math.max.apply(null, xs)];
  }

  // 그릴(육각 타공 강판) — 텍스처는 캔버스로 생성
  function grilleTexture() { // 육각 타공: 가로 8칸 x 세로 8줄 타일 (이음매 없음)
    var n = 8, w = 32, h = w * Math.sqrt(3) / 2, c = document.createElement('canvas'); c.width = n * w; c.height = Math.round(n * h); var g = c.getContext('2d');
    g.fillStyle = '#55585e'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#040405'; var r = w * 0.37, sy = c.height / (n * h);
    for (var row = -1; row <= n + 1; row++) for (var col = -1; col <= n + 1; col++) {
      var cx = col * w + (((row % 2) + 2) % 2 ? w / 2 : 0), cy = row * h * sy; g.beginPath();
      for (var k = 0; k < 6; k++) { var a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a) * sy); } g.closePath(); g.fill(); }
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.encoding = THREE.sRGBEncoding;
    return { tex: t, tileW: n * GRILLE.pitch, tileH: n * GRILLE.pitch * Math.sqrt(3) / 2 };
  }
  function grilleEdge(y) { var yt = DIM.height - y; var b = (yt > 100 && yt < 380) ? Math.pow(Math.sin(Math.PI * (yt - 100) / 280), 2) : 0; return 141 - (GRILLE.edge + GRILLE.waist * b); }
  function buildGrille(M) {
    var nu = 120, nv = 160, pos = [], uv = [], idx = [], T = grilleTexture();
    for (var j = 0; j <= nv; j++) for (var i = 0; i <= nu; i++) {
      var v = j / nv, u = i / nu, yv = GRILLE.yBot + (GRILLE.yTop - GRILLE.yBot) * v, xe = grilleEdge(yv), X = -xe + 2 * xe * u;
      var bow = GRILLE.bow * Math.pow(X / 128, 2), y0 = GRILLE.yBot + bow, y1 = GRILLE.yTop - bow, Y = y0 + (y1 - y0) * v;
      var Z = frontZ(X) + GRILLE.off; pos.push(X, Y, Z); uv.push(X, Y);
    }
    for (var j2 = 0; j2 < nv; j2++) for (var i2 = 0; i2 < nu; i2++) { var a = j2 * (nu + 1) + i2, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
    var g = new THREE.BufferGeometry(); g.setIndex(idx); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv.map(function (q, i) { return q / (i % 2 ? T.tileH : T.tileW); }), 2));
    g.computeVertexNormals();
    var mat = M.grille.clone(); mat.map = T.tex; mat.color.set(0xffffff); mat.roughness = 0.5; mat.metalness = 0.35;
    var grille = mk(g, mat, 'grille');
    return grille;
  }

  // ---------------------------------------------------------------------------
  // speakON NL4MP 섀시 단자 (로컬: +Z 바깥, +Y 키, 단자판 면 z=0)
  function buildNl4(M, name) {
    var N = NL4, g = grp(name), F = N.flange, R = N.ring;
    var fl = new THREE.Shape(); rrect(fl, 0, 0, F.w, F.h, F.r); fl.holes.push(circ(new THREE.Path(), 0, 0, R.rOut)); // 노즈 링 둘레
    N.screws.forEach(function (s) { fl.holes.push(circ(new THREE.Path(), s[0], s[1], 1.6)); });
    g.add(mk(new THREE.ExtrudeGeometry(fl, { depth: F.t, bevelEnabled: false, curveSegments: 40 }).translate(0, 0, -PLATE.plateT - F.t), M.jack, name + '.flange'));
    var rg = new THREE.Shape(); circ(rg, 0, 0, R.rOut); rg.holes.push(circ(new THREE.Path(), 0, 0, R.rIn));
    var ringL = R.t + PLATE.plateT; // 판 컷아웃을 지나 앞으로 R.t 만큼 나옴
    g.add(mk(new THREE.ExtrudeGeometry(rg, { depth: ringL, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelOffset: -0.5, bevelSegments: 2, curveSegments: 48 }).translate(0, 0, -PLATE.plateT), M.nlGrey, name + '.ring'));
    var top = R.t;
    var wallL = N.depth - ringL; // 링 안쪽 벽 아래부터 보어 바닥까지 (겹침 없음)
    g.add(mk(new THREE.CylinderGeometry(R.rIn, R.rIn, wallL, 48, 1, true).rotateX(Math.PI / 2).translate(0, 0, top - N.depth + wallL / 2), M.holeWallGrey, name + '.boreWall', { cast: false, receive: false })); // 뒷면 재질의 그림자 줄무늬 방지
    g.add(mk(new THREE.RingGeometry(N.coreR, R.rIn, 48).translate(0, 0, top - N.depth), M.insert, name + '.boreFloor', { cast: false }));
    // 가운데 코어 (접점이 붙은 기둥) + 가운데 구멍
    var core = new THREE.Shape(); circ(core, 0, 0, N.coreR); core.holes.push(circ(new THREE.Path(), 0, 0, N.coreHoleR));
    var coreL = N.depth - N.coreFace;
    g.add(mk(new THREE.ExtrudeGeometry(core, { depth: coreL, bevelEnabled: false, curveSegments: 36 }).translate(0, 0, top - N.depth), M.nlGrey, name + '.core'));
    g.add(mk(new THREE.CylinderGeometry(N.coreHoleR, N.coreHoleR, N.coreHoleDepth, 24, 1, true).rotateX(Math.PI / 2).translate(0, 0, top - N.coreFace - N.coreHoleDepth / 2), M.holeWall, name + '.coreHoleWall', { cast: false }));
    g.add(mk(new THREE.CircleGeometry(N.coreHoleR, 24).translate(0, 0, top - N.coreFace - N.coreHoleDepth), M.hole, name + '.coreHoleBottom', { cast: false }));
    N.keys.forEach(function (k, i) { var a = k.ang * Math.PI / 180, rr = R.rIn - k.h / 2;
      var kb = mk(new THREE.BoxGeometry(k.w, k.h, k.d1 - k.d0).translate(0, 0, -(k.d0 + k.d1) / 2), M.nlGrey, name + '.key' + (i + 1));
      kb.position.set(Math.cos(a) * rr * MM, Math.sin(a) * rr * MM, top * MM); kb.rotation.z = a - Math.PI / 2; g.add(kb); });
    N.contacts.forEach(function (c) { var a = c[1] * Math.PI / 180, rr = N.coreR + 0.15;
      var cb = mk(new THREE.BoxGeometry(2.4, 0.3, 7.0).translate(0, 0, -(N.coreFace + 2.0 + 3.5)), M.contact, name + '.contact' + c[0].replace('+', 'P').replace('-', 'N'));
      cb.position.set(Math.cos(a) * rr * MM, Math.sin(a) * rr * MM, top * MM); cb.rotation.z = a - Math.PI / 2; g.add(cb); });
    N.screws.forEach(function (s, i) { var sc = buildScrew(M, name + '.screw' + (i + 1), N.screwR); setMM(sc, s[0], s[1], 0); g.add(sc); });
    g.userData.faceMM = top; return g;
  }
  function buildScrew(M, name, r) { var g = new THREE.CylinderGeometry(r, r * 1.05, 0.9, 16).rotateX(Math.PI / 2).translate(0, 0, 0.45); var s = mk(g, M.screw, name);
    var cr = mk(new THREE.BoxGeometry(r * 1.3, r * 0.28, 0.2).translate(0, 0, 0.92), M.hole, name + '.slotA', { cast: false }); var cr2 = cr.clone(); cr2.name = NS + '.' + name + '.slotB'; cr2.rotation.z = Math.PI / 2; s.add(cr); s.add(cr2); return s; }
  // 단자판 인쇄 (사진의 글자·기호 배치를 비례로 옮김)
  function platePrint(W, H) {
    var s = 8, c = document.createElement('canvas'); c.width = Math.round(W * s); c.height = Math.round(H * s); var g = c.getContext('2d');
    var u0 = W / 2; g.clearRect(0, 0, c.width, c.height); g.fillStyle = '#eceef0'; g.strokeStyle = '#eceef0'; g.textBaseline = 'middle';
    function T(t, u, v, size, opt) { var o = opt || {}; g.font = (o.style || '') + ' ' + (o.weight || '600') + ' ' + size * s + 'px Arial, Helvetica, sans-serif'; g.textAlign = o.align || 'center'; g.fillStyle = o.color || '#eceef0'; g.fillText(t, (u + u0) * s, v * s); }
    T('ZX1-90', 0, 18, 13.5, { weight: '900', style: 'italic' });
    ['PASSIVE FULL RANGE CABINET', '90° x 50° COVERAGE PATTERN'].forEach(function (t, i) { T(t, 0, 30 + i * 4.4, 3.0, { weight: '500' }); });
    T('IMPEDANCE:', -8, 40.6, 3.0, { weight: '500', align: 'right' }); T('8 OHMS', -4, 40.6, 3.0, { weight: '500', align: 'left' });
    T('POWER:', -8, 45.0, 3.0, { weight: '500', align: 'right' }); T('200 WATTS', -4, 45.0, 3.0, { weight: '500', align: 'left' });
    function bolt(u, v, k) { g.lineWidth = 0.55 * s; g.beginPath(); [[-2, -3], [1, -0.5], [-1, 0.5], [2, 3]].forEach(function (q, i) { var x = (u + u0 + q[0] * k) * s, y = (v + q[1] * k) * s; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); }
    bolt(-20.5, 50.5, 1.0); bolt(-21, 108, 0.8);
    T('CE', PL.ce[0], PL.ce[1], 5.0, { weight: '500' });
    T('PARALLEL INPUTS', 0, 83, 3.7, { weight: '500' });
    // WEEE 10 표시 (사진 속 녹색 인증 스티커는 학습에 불필요해 넣지 않음)
    g.lineWidth = 0.5 * s; g.beginPath(); g.arc((PL.weee[0] + u0) * s, PL.weee[1] * s, 3.6 * s, 0, Math.PI * 2); g.stroke(); T('10', PL.weee[0], PL.weee[1] + 0.2, 3.0, { weight: '800' });
    ['PIN 1+  FR+', 'PIN 1-  FR-', 'PIN 2+  N.C.', 'PIN 2-  N.C.'].forEach(function (t, i) { T(t, 14, 95.5 + i * 3.0, 2.3, { align: 'left', weight: '500' }); });
    // EV 로고 + Electro-Voice
    g.lineWidth = 0.45 * s; g.strokeRect((-37 + u0) * s, 115.2 * s, 9.5 * s, 9.5 * s); T('EV', -32.25, 120.1, 5.0, { weight: '800' });
    T('Electro-Voice', -25.5, 120.1, 7.3, { weight: '700', align: 'left' });
    g.fillStyle = '#f2f2f2'; g.fillRect((-19 + u0) * s, 128.2 * s, 38 * s, 5.2 * s); T('S/N  ··········', 0, 130.9, 3.1, { weight: '500', color: '#222' });
    T('MADE IN U.S.A.', 0, 137.4, 2.9, { weight: '500' }); T('PATENT PENDING', 0, 141.8, 2.5, { weight: '500' });
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
  }
  function decalMat(t) { return new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.08, depthWrite: false, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); }
  function badgeTexture() { var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d'); g.fillStyle = '#d9dbde'; g.font = '900 150px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('EV', 128, 136); g.strokeStyle = '#d9dbde'; g.lineWidth = 10; g.strokeRect(22, 22, 212, 212); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }

  // ---------------------------------------------------------------------------
  function create() {
    var M = makeMaterials(), root = new THREE.Group(); root.name = NS + 'Root';
    var parts = {}, ports = {}, ctl = {};
    function reg(k, o) { parts[k] = o; return o; }

    // 캐비닛
    var cab = reg('cabinet', grp('cabinetGroup')); root.add(cab);
    var C = buildCabinet(M); setMM(C.body, 0, 0, 0); cab.add(reg('cabinetShell', C.body)); cab.add(reg('cabinetTop', C.top)); cab.add(reg('cabinetBottom', C.bottom));
    // 앰프 패널 오목부 평면 (패널 구멍) — 로프트에서 뺀 평평한 면을 대신함
    var span = C.flatSpan, rec = new THREE.Shape();
    rec.moveTo(span.xMin, RECESS.y0); rec.lineTo(span.xMax, RECESS.y0); rec.lineTo(span.xMax, RECESS.y1); rec.lineTo(span.xMin, RECESS.y1); rec.closePath();
    rec.holes.push(rrect(new THREE.Path(), PANEL.cx, PANEL.cy, PANEL.w, PANEL.h, PANEL.r));
    var recG = new THREE.ShapeGeometry(rec, 8), rp = recG.attributes.position;
    for (var i = 0; i < rp.count; i++) rp.setZ(i, PANEL.recessZ);
    var ri = recG.index.array; for (var q = 0; q < ri.length; q += 3) { var tmp = ri[q + 1]; ri[q + 1] = ri[q + 2]; ri[q + 2] = tmp; } // 뒤(-Z)를 향하게
    recG.computeVertexNormals();
    cab.add(reg('recessFace', mk(recG, M.abs, 'recessFace')));
    // 받침발 4개 (#8-32 매다는 점 겸용) + 폴 소켓
    FEET.forEach(function (f, i) {
      var foot = grp('foot' + (i + 1));
      foot.add(mk(new THREE.CylinderGeometry(15, 15.5, FEET_H - 1.5, 32).translate(0, (FEET_H - 1.5) / 2 + 1.5, 0), M.rubber, 'foot' + (i + 1) + '.pad'));
      var tr = new THREE.LatheGeometry([[3.4, 1.5], [3.4, 0.0], [13.5, 0.0], [15.0, 1.5]].map(function (q) { return new THREE.Vector2(q[0], q[1]); }), 32);
      foot.add(mk(tr, M.rubber, 'foot' + (i + 1) + '.tread'));
      foot.add(mk(new THREE.CircleGeometry(3.4, 16).rotateX(Math.PI / 2).translate(0, 0.8, 0), M.screw, 'foot' + (i + 1) + '.insert8_32', { cast: false })); // #8-32 나사 구멍 자리 (아래를 향함)
      setMM(foot, f[0], 0, f[1]); cab.add(reg('foot' + (i + 1), foot));
      ports['suspension' + (i + 1)] = { part: foot, type: 'suspension-insert-8-32', role: 'mechanical', accepts: ['8-32-eyebolt', 'mp1-mounting-plate'], insertDepthMM: 9.5, axis: '-y', faceMM: 0 };
    });
    var pole = grp('poleSocket');
    pole.add(mk(new THREE.CylinderGeometry(POLE.r, POLE.r, POLE.depth, 40, 1, true).translate(0, BODY.y0 + POLE.depth / 2, 0), M.holeWall, 'poleSocket.wall', { cast: false }));
    pole.add(mk(new THREE.CircleGeometry(POLE.r, 40).rotateX(Math.PI / 2).translate(0, BODY.y0 + POLE.depth, 0), M.insert, 'poleSocket.top', { cast: false }));
    pole.add(mk(new THREE.TorusGeometry(POLE.r + 0.6, 0.6, 8, 40).rotateX(Math.PI / 2).translate(0, BODY.y0, 0), M.abs, 'poleSocket.rim'));
    setMM(pole, POLE.x, 0, POLE.z); cab.add(reg('poleSocket', pole));
    ports.poleMount = { part: pole, type: 'pole-socket-35mm', role: 'mechanical', accepts: ['speaker-pole-35mm'], insertDepthMM: POLE.depth - 5, axis: '-y', faceMM: BODY.y0 };
    // 폴 고정나사 (뒷면 아래쪽)
    var setScrew = grp('poleSetScrew');
    setScrew.add(mk(new THREE.CylinderGeometry(5, 5, 6, 20).rotateX(Math.PI / 2).translate(0, 0, -3), M.knobGrey, 'poleSetScrew.knob'));
    setMM(setScrew, 2.6, 51.6, backZAt(2.6) + 0.5); setScrew.rotation.y = 0; cab.add(reg('poleSetScrew', setScrew));
    // 45° 모니터 면 패드 4개: 면 양 끝의 가장 튀어나온 곳(앞쪽 턱 모서리, 뒤쪽 끝)에 두고, 아랫면을 한 평면에 맞춤 (Owner's Manual Fig.1·도면 Bottom View)
    var fa = FACET.a, fb = FACET.b, fdir = [fb[0] - fa[0], fb[1] - fa[1]], fl = Math.hypot(fdir[0], fdir[1]); fdir = [fdir[0] / fl, fdir[1] / fl];
    var fn = [-fdir[1], fdir[0]]; if (fn[0] < 0) fn = [-fn[0], -fn[1]]; // 바깥(+X, -Z)
    function surfOff(t) { // 면 위 t 지점에서 법선 방향으로 단면 경계까지의 거리(가장 바깥)
      var qx = fa[0] + fdir[0] * t, qz = fa[1] + fdir[1] * t, best = -Infinity, p = SECTION;
      for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length], ex = b[0] - a[0], ez = b[1] - a[1], den = fn[0] * ez - fn[1] * ex;
        if (Math.abs(den) < 1e-9) continue; var wx = a[0] - qx, wz = a[1] - qz, sOff = (wx * ez - wz * ex) / den, u = (wx * fn[1] - wz * fn[0]) / den;
        if (u >= 0 && u <= 1 && sOff > best) best = sOff; }
      return best;
    }
    var tf = 0, sf = -Infinity, tb = 0, sb = -Infinity;
    for (var tt = -30; tt <= fl + 30; tt += 0.5) { var so = surfOff(tt); if (tt < fl / 2) { if (so > sf) { sf = so; tf = tt; } } else if (so > sb) { sb = so; tb = tt; } }
    var plane = Math.max(sf, sb) + FACET.padClear;
    FACET.plane = plane; FACET.padAt = [tf, tb];
    [[tf, 368, 393], [tb, 368, 393], [tf, 71.4, 99], [tb, 71.4, 99]].forEach(function (pd, i) {
      var s0 = surfOff(pd[0]) - 1.0, th = plane - s0, cx = fa[0] + fdir[0] * pd[0] + fn[0] * (s0 + th / 2), cz = fa[1] + fdir[1] * pd[0] + fn[1] * (s0 + th / 2);
      var pad = mk(new THREE.BoxGeometry(14, pd[2] - pd[1], th), M.rubber, 'monitorPad' + (i + 1));
      pad.position.set(cx * MM, (pd[1] + pd[2]) / 2 * MM, cz * MM); pad.rotation.y = Math.atan2(fn[0], fn[1]); cab.add(pad);
    });
    // 그릴 + 배지 + 그릴 나사
    var grille = buildGrille(M); root.add(reg('grille', grille));
    var bz = frontZ(0) + GRILLE.off + 0.3;
    var badge = grp('badge');
    badge.add(mk(new THREE.BoxGeometry(BADGE.size, BADGE.size, 2.0).translate(0, 0, 1.0), M.badge, 'badge.plate'));
    var bdec = mk(new THREE.PlaneGeometry(BADGE.size * 0.92, BADGE.size * 0.92), decalMat(badgeTexture()), 'badge.print', { cast: false }); bdec.position.z = 2.02 * MM; badge.add(bdec);
    setMM(badge, 0, BADGE.y, bz); root.add(reg('badge', badge)); hide(ctl, 'badge', badge);
    [[-114, 423], [114, 423], [-114, 43], [114, 43]].forEach(function (s, i) { var sc = buildScrew(M, 'grilleScrew' + (i + 1), 2.2); setMM(sc, s[0], s[1], frontZ(s[0]) + GRILLE.off); var nz = surfaceNormalFront(s[0]); sc.rotation.y = Math.atan2(nz[0], nz[1]); root.add(sc); });

    // 뒷면 단자판 (로컬: +Z 바깥 = 모델 -Z, +X = 뒤에서 볼 때 오른쪽 = 모델 -X)
    var pnl = reg('rearPlate', grp('rearPlate')); setMM(pnl, PANEL.cx, PANEL.cy, PANEL.faceZ); pnl.rotation.y = Math.PI; root.add(pnl);
    var B = PLATE.bezel, W = PANEL.w, Hh = PANEL.h, win = { w: W - 2 * B.side, y1: Hh / 2 - B.top, y0: -Hh / 2 + B.bottom };
    win.h = win.y1 - win.y0; win.cy = (win.y0 + win.y1) / 2;
    var plate = { w: win.w, h: PLATE.plateH, y1: win.y1 }; plate.y0 = plate.y1 - plate.h; plate.cy = (plate.y0 + plate.y1) / 2;
    hide(PLATE, 'window', win); hide(PLATE, 'plate', plate);
    // 테두리 (나사 8개)
    var bz = new THREE.Shape(); rrect(bz, 0, 0, W, Hh, PANEL.r); bz.holes.push(rrect(new THREE.Path(), 0, win.cy, win.w, win.h, 3));
    pnl.add(mk(new THREE.ExtrudeGeometry(bz, { depth: B.t, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelOffset: -0.6, bevelSegments: 2, curveSegments: 24 }).translate(0, 0, -B.t), M.abs, 'rearPlate.bezel'));
    // 테두리 바깥 상자 옆벽 (캐비닛 오목부 구멍을 막음, ZXA1 패널 상자와 같은 자리)
    var box = new THREE.Shape(); rrect(box, 0, 0, W, Hh, PANEL.r); box.holes.push(rrect(new THREE.Path(), 0, 0, W - 2, Hh - 2, PANEL.r));
    pnl.add(mk(new THREE.ExtrudeGeometry(box, { depth: PANEL.boxDepth - B.t, bevelEnabled: false }).translate(0, 0, -PANEL.boxDepth), M.abs, 'rearPlate.box'));
    // 창 안쪽 벽(테두리 뒤 ~ 홈 바닥) + 홈 바닥
    var tun = new THREE.Shape(); rrect(tun, 0, win.cy, win.w + 2.4, win.h + 2.4, 4); tun.holes.push(rrect(new THREE.Path(), 0, win.cy, win.w, win.h, 3));
    pnl.add(mk(new THREE.ExtrudeGeometry(tun, { depth: -PLATE.floorZ - B.t, bevelEnabled: false, curveSegments: 12 }).translate(0, 0, PLATE.floorZ), M.absDark, 'rearPlate.windowWall'));
    var flo = new THREE.Shape(); var fy0 = win.y0 - 1.2, fy1 = plate.y0 + 1.0; rrect(flo, 0, (fy0 + fy1) / 2, win.w + 2.4, fy1 - fy0, 3); // 홈 아래만 (판 뒤는 단자 몸통이 지나감)
    pnl.add(mk(new THREE.ShapeGeometry(flo, 12).translate(0, 0, PLATE.floorZ), M.absDark, 'rearPlate.pocketFloor', { cast: false }));
    // 손가락 홈 위 선반(단자판 아래 끝 ~ 홈 바닥) — 아래에서 올려다봐도 판 뒤가 보이지 않게
    var shelf = mk(new THREE.PlaneGeometry(win.w, PLATE.plateZ - PLATE.plateT - PLATE.floorZ).rotateX(Math.PI / 2), M.absDark, 'rearPlate.pocketCeiling', { cast: false });
    shelf.geometry.translate(0, plate.y0 * MM - 0.0001, (PLATE.plateZ - PLATE.plateT + PLATE.floorZ) / 2 * MM); pnl.add(shelf);
    // 단자판 (NL4 컷아웃 Ø24 두 개)
    var toL = function (uv) { return [uv[0], plate.y1 - uv[1]]; };
    var pf = new THREE.Shape(); rrect(pf, 0, plate.cy, plate.w, plate.h, 3);
    [PL.jackA, PL.jackB].forEach(function (j) { var l = toL(j); pf.holes.push(circ(new THREE.Path(), l[0], l[1], NL4.cutoutR)); });
    pnl.add(mk(new THREE.ExtrudeGeometry(pf, { depth: PLATE.plateT, bevelEnabled: false, curveSegments: 40 }).translate(0, 0, PLATE.plateZ - PLATE.plateT), M.panel, 'rearPlate.plate'));
    var pp = mk(new THREE.PlaneGeometry(plate.w, plate.h), decalMat(platePrint(plate.w, plate.h)), 'rearPlate.print', { cast: false });
    pp.position.set(0, plate.cy * MM, (PLATE.plateZ + 0.03) * MM); pnl.add(pp);
    PLATE.bezelScrews.forEach(function (s, i) { var sc = buildScrew(M, 'rearPlate.bezelScrew' + (i + 1), 2.3); setMM(sc, s[0], s[1], 0); pnl.add(sc); });
    // speakON 단자 2개 (병렬) — 키 리브 +Y_local = 위
    function place(obj, uv) { var l = toL(uv); setMM(obj, l[0], l[1], PLATE.plateZ); pnl.add(obj); return obj; }
    var jA = place(buildNl4(M, 'speakonA'), PL.jackA), jB = place(buildNl4(M, 'speakonB'), PL.jackB);
    var nlExtra = function (peer) { return { connectorModel: NL4.model, parallelWith: peer, parallelGroup: 'loudspeakerInput', pinout: JSON.parse(JSON.stringify(PINOUT)),
      lockRotationDeg: NL4.lockRotationDeg, lockDirection: NL4.lockDirection, boreDiameterMM: NL4.ring.rIn * 2, coreDiameterMM: NL4.coreR * 2, coreFaceDepthMM: NL4.coreFace, boreDepthMM: NL4.depth }; };
    ports.speakonA = { part: jA, type: 'speakon-nl4-chassis', role: 'input', accepts: ['speakon-nl4-cable-plug'], insertDepthMM: NL4.insertDepthMM, axis: 'z', extra: nlExtra('speakonB') };
    ports.speakonB = { part: jB, type: 'speakon-nl4-chassis', role: 'input', accepts: ['speakon-nl4-cable-plug'], insertDepthMM: NL4.insertDepthMM, axis: 'z', extra: nlExtra('speakonA') };

    // ===== 단자 기준점 =====
    var anchors = grp('portAnchors'); root.add(anchors); root.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    Object.keys(ports).forEach(function (id) {
      var p = ports[id], part = p.part, q = new THREE.Quaternion(); part.getWorldQuaternion(q);
      var n, key, pos;
      if (p.axis === '-y') { n = new THREE.Vector3(0, -1, 0); key = new THREE.Vector3(0, 0, 1); pos = new THREE.Vector3(0, (p.faceMM || 0) * MM, 0).applyMatrix4(part.matrixWorld).applyMatrix4(inv); }
      else { n = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize(); key = new THREE.Vector3(0, 1, 0).applyQuaternion(q).normalize(); pos = new THREE.Vector3(0, 0, (part.userData.faceMM || 0) * MM).applyMatrix4(part.matrixWorld).applyMatrix4(inv); }
      var X = new THREE.Vector3().crossVectors(key, n), a = new THREE.Object3D(); a.name = NS + '.port.' + id; a.position.copy(pos);
      a.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, key, n));
      a.userData = { portId: id, type: p.type, role: p.role, accepts: p.accepts, insertDepthMM: p.insertDepthMM, localPosition: pos.clone(), localNormal: n.clone(), insertDirection: n.clone().negate(), keyDirection: key.clone(), partName: part.name };
      if (p.extra) Object.keys(p.extra).forEach(function (kk) { a.userData[kk] = p.extra[kk]; });
      anchors.add(a); ports[id] = a;
    });

    // ===== 상태 API (패시브: 전원·노브 없음 — 연결 상태와 전기 사양만) =====
    var conn = { speakonA: null, speakonB: null };
    var api = {
      getElectrical: function () { return JSON.parse(JSON.stringify(ELEC)); },
      getParallelPeer: function (id) { return id === 'speakonA' ? 'speakonB' : id === 'speakonB' ? 'speakonA' : null; },
      // 케이블 단계에서 사용: 단자에 무엇이 꽂혔는지 기록(시각 변화 없음). info = 임의 객체 또는 null
      setConnection: function (id, info) { if (!(id in conn)) throw new Error('[EvZX1] 알 수 없는 단자: ' + id); conn[id] = info || null; return api; },
      getState: function () { return { connections: { speakonA: conn.speakonA ? true : false, speakonB: conn.speakonB ? true : false },
        bothInputsShareSignal: ELEC.inputsParallel, impedanceOhm: ELEC.nominalImpedanceOhm }; }
    };
    root.userData[NS] = { api: api };
    hide(root.userData[NS], 'parts', parts); hide(root.userData[NS], 'ports', ports);
    root.userData.info = { model: 'Electro-Voice ZX1-90', type: 'passive', dimensionsMM: DIM, electrical: ELEC, units: 'm' };
    return root;
  }
  function backZAt(X) { var z = Infinity, p = SECTION; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length];
      if ((a[0] - X) * (b[0] - X) <= 0 && a[0] !== b[0]) { var t = (X - a[0]) / (b[0] - a[0]); z = Math.min(z, a[1] + (b[1] - a[1]) * t); } } return z; }
  function surfaceNormalFront(X) { var e = 0.5, z0 = frontZ(X - e), z1 = frontZ(X + e), dx = 2 * e, dz = z1 - z0, l = Math.hypot(dx, dz); return [-dz / l, dx / l]; }

  function findAnchor(root, id) { return root.getObjectByName(NS + '.port.' + id); }
  function getPortInfo(root, id) {
    var a = findAnchor(root, id); if (!a) return null; root.updateWorldMatrix(true, true);
    var u = a.userData, wp = new THREE.Vector3(), wq = new THREE.Quaternion(); a.getWorldPosition(wp); a.getWorldQuaternion(wq);
    var wn = new THREE.Vector3(0, 0, 1).applyQuaternion(wq).normalize(), wk = new THREE.Vector3(0, 1, 0).applyQuaternion(wq).normalize();
    var ln = new THREE.Vector3().copy(u.localNormal), scale = ln.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(root.matrixWorld)).length();
    return { id: u.portId, type: u.type, role: u.role, accepts: u.accepts.slice(), localPosition: new THREE.Vector3().copy(u.localPosition), localNormal: ln,
      insertDirectionLocal: new THREE.Vector3().copy(u.insertDirection), keyDirectionLocal: new THREE.Vector3().copy(u.keyDirection),
      worldPosition: wp, worldNormal: wn, worldInsertDirection: wn.clone().negate(), worldKeyDirection: wk, worldQuaternion: wq,
      insertDepthMM: u.insertDepthMM, worldInsertDepth: u.insertDepthMM * MM * scale, worldScale: scale, anchor: a };
  }
  function getAllPorts(root) { var out = []; root.traverse(function (o) { if (o.userData && o.userData.portId && o.name.indexOf(NS + '.port.') === 0) out.push(getPortInfo(root, o.userData.portId)); }); return out; }
  function seatPlug(root, plug, portId, depthOverrideM) {
    var p = getPortInfo(root, portId), depth = depthOverrideM !== undefined ? depthOverrideM : p.worldInsertDepth;
    plug.quaternion.copy(p.worldQuaternion); plug.position.copy(p.worldPosition).addScaledVector(p.worldNormal, -depth);
    var ax = plug.userData && plug.userData.axisOffsetLocal; if (ax) plug.position.sub(new THREE.Vector3().copy(ax).applyQuaternion(p.worldQuaternion));
    plug.updateMatrixWorld(true); return p;
  }
  function toGear3dPortsLocal(root) { var o = {}; getAllPorts(root).forEach(function (p) { o[p.id] = { pos: p.localPosition.toArray(), normal: p.localNormal.toArray(), type: p.type }; }); return o; }

  window.EvZX1 = {
    NAMESPACE: NS, DIMENSIONS_MM: DIM, SECTION_MM: SECTION, PANEL_MM: PANEL, PLATE_MM: PLATE, PLATE_LAYOUT: PL, FACET_MM: FACET, FEET_MM: FEET, POLE_MM: POLE, FEET_H_MM: FEET_H,
    NL4_MM: NL4, PINOUT: PINOUT, ELECTRICAL: ELEC, frontZ: frontZ,
    create: create, getPortInfo: getPortInfo, getAllPorts: getAllPorts, seatPlug: seatPlug, toGear3dPortsLocal: toGear3dPortsLocal
  };
})();
