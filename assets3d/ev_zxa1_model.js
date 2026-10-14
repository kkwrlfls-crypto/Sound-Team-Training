/*
 * Electro-Voice ZXA1 (8" 2-way 800W 액티브 스피커) — Sound-Team-Training 3D 에셋 단계 4/8
 *  - Three.js r128 전역 THREE, 단위 m, 전역 네임스페이스 window.EvZXA1
 *
 * 근거
 *  - ZxA1-90 Engineering Data Sheet (F.01U.169.225 Rev 04): 457 x 282 x 264 mm, 8.6 kg, ABS, 18GA 강철 그릴,
 *    #8-32 매다는 점 4개(바닥), 폴 마운트, 45° 모니터 각
 *  - ZxA1 Owner's Manual (LIT000395 Rev 02): 앰프 패널 그림(Figure 7), 35 mm 폴 소켓 + 고정나사, 치수도(Top/Front/Right/Rear/Bottom)
 *  - 수평 단면은 치수도 Top View 를 벡터 렌더해 픽셀 측정 → 공식 폭·깊이로 정규화
 *
 * 좌표: 원점 = 바닥(받침발 아래면) 중심, +Y 위, +Z 앞(그릴), +X = 앞에서 볼 때 오른쪽(45° 모니터 면 쪽)
 */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { console.error('[EvZXA1] THREE(r128) 가 먼저 로드되어야 합니다.'); return; }
  var NS = 'evZxa1', MM = 0.001;

  var DIM = { width: 282, height: 457, depth: 264, weightKg: 8.6 };
  var SECTION = [[-40.96, -131.4], [-52.07, -128.03], [-61.3, -124.66], [-68.43, -121.29], [-74.12, -117.92], [-78.84, -114.55], [-82.93, -111.18], [-86.53, -107.81], [-89.7, -104.44], [-92.55, -101.06], [-95.19, -97.69], [-97.65, -94.32], [-100.03, -90.94], [-102.3, -87.57], [-104.31, -84.2], [-106.19, -80.83], [-108.06, -77.46], [-109.75, -74.09], [-111.21, -70.72], [-112.63, -67.35], [-114.05, -63.98], [-115.43, -60.64], [-116.68, -57.3], [-117.83, -53.95], [-118.96, -50.58], [-120.08, -47.21], [-121.21, -43.84], [-122.3, -40.47], [-123.29, -37.1], [-124.17, -33.73], [-125.02, -30.36], [-125.86, -26.99], [-126.7, -23.62], [-127.54, -20.25], [-128.33, -16.88], [-129.01, -13.5], [-129.64, -10.13], [-130.35, -6.76], [-131.13, -3.38], [-131.82, -0.01], [-132.41, 3.36], [-132.97, 6.73], [-133.54, 10.1], [-134.1, 13.46], [-134.66, 16.81], [-135.19, 20.14], [-135.59, 23.49], [-135.94, 26.86], [-136.37, 30.23], [-136.87, 33.6], [-137.28, 36.97], [-137.62, 40.35], [-138.06, 43.72], [-138.56, 47.09], [-138.97, 50.46], [-139.32, 53.83], [-139.72, 57.2], [-140.12, 60.57], [-140.43, 63.94], [-140.69, 67.31], [-140.93, 70.69], [-141.0, 74.06], [-140.73, 77.43], [-140.03, 80.8], [-138.97, 84.03], [-137.59, 87.01], [-135.49, 90.32], [-132.16, 94.86], [-127.92, 100.68], [-123.45, 106.92], [-118.96, 112.51], [-114.46, 116.83], [-109.98, 119.93], [-105.51, 122.08], [-101.02, 123.53], [-96.52, 124.46], [-92.02, 125.06], [-87.53, 125.47], [-83.03, 125.81], [-78.54, 126.25], [-74.07, 126.75], [-69.58, 127.15], [-65.08, 127.5], [-60.59, 127.9], [-56.12, 128.31], [-51.64, 128.62], [-47.14, 128.84], [-42.65, 129.0], [-38.15, 129.18], [-33.65, 129.4], [-29.17, 129.59], [-24.69, 129.81], [-20.2, 130.19], [-15.28, 130.67], [-8.69, 131.06], [-0.01, 131.2], [8.67, 131.06], [15.26, 130.67], [20.18, 130.19], [24.67, 129.81], [29.15, 129.59], [33.63, 129.4], [38.13, 129.18], [42.63, 129.0], [47.12, 128.84], [51.62, 128.62], [56.1, 128.31], [60.57, 127.9], [65.06, 127.5], [69.56, 127.15], [74.05, 126.75], [78.52, 126.25], [83.01, 125.81], [87.51, 125.47], [92.0, 125.06], [96.5, 124.46], [101.0, 123.53], [105.49, 122.08], [109.96, 119.93], [114.45, 116.83], [118.94, 112.51], [123.43, 106.92], [127.9, 100.68], [132.18, 94.86], [135.66, 90.32], [137.99, 87.01], [139.51, 84.03], [140.53, 80.8], [141.0, 77.43], [140.98, 74.06], [140.73, 70.69], [140.44, 67.31], [140.14, 63.94], [139.85, 60.57], [139.58, 57.2], [139.32, 53.83], [139.04, 50.46], [138.75, 47.09], [138.46, 43.72], [138.17, 40.35], [137.86, 36.97], [137.48, 33.6], [137.1, 30.23], [136.74, 26.86], [136.32, 23.49], [135.8, 20.14], [135.27, 16.81], [134.83, 13.46], [134.49, 10.1], [134.08, 6.73], [133.55, 3.36], [132.99, -0.01], [132.43, -3.38], [131.89, -6.76], [131.38, -10.13], [130.67, -13.5], [129.47, -16.88], [127.89, -20.25], [125.12, -23.62], [120.65, -26.99], [106.91, -29.03], [103.58, -32.4], [100.25, -35.78], [96.93, -39.15], [93.6, -42.51], [90.27, -45.88], [86.94, -49.25], [83.62, -52.62], [80.29, -55.98], [76.96, -59.35], [73.63, -62.72], [70.3, -66.09], [66.99, -69.45], [63.66, -72.82], [60.33, -76.19], [57.0, -79.56], [53.68, -82.93], [50.35, -86.3], [48.88, -90.94], [46.7, -94.32], [44.94, -97.69], [43.64, -101.06], [42.29, -104.44], [40.07, -107.81], [36.2, -111.18], [30.69, -114.55], [24.46, -117.92], [18.06, -121.29], [10.84, -124.66], [1.57, -127.86], [-10.59, -130.36], [-25.0, -132.0]]; // [X, Z] mm, 캐비닛 외곽(그릴 제외). 그릴은 앞쪽에 +0.8mm
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

  // 커넥터 규격 (1~3단계와 같은 값 → XLR 케이블 플러그와 그대로 결합)
  var PINS = [[-4.04, 0], [4.04, 0], [0, -3.95]];
  var XLRF = { comboR: 12.3, flangeR: 11.0, ring: 1.5, boreR: 10.45, insertR: 8.0, insertFace: 3.0, annulus: 13.0, holeR: 1.5, holeBottom: 11.0, insertDepthMM: 12.6 };
  var XLRM = { flangeR: 11.0, ring: 1.5, boreR: 8.75, depth: 15.0, pinR: 0.8, pinTip: 4.0, latch: { y0: 1.4, y1: 3.6, halfW: 2.2, rOut: 9.9 }, insertDepthMM: 13.0 };
  var IEC = {
    open: { w: 25.4, h: 16.6, chamfer: 3.5 }, frame: { w: 31.3, h: 22.9, r: 2.5, face: 4.0 }, flange: { t: 1.5 }, floor: -8.0, pinTip: 1.0,
    pins: [['pinLeft', -7.0, -2.9, 1.8, 4.4], ['pinRight', 7.0, -2.9, 1.8, 4.4], ['pinEarth', 0, 2.1, 1.8, 3.6]], insertDepthMM: 10.0
  };
  // 앰프 패널 요소 (Owner's Manual Figure 7 측정: u = 뒤에서 볼 때 왼쪽부터, v = 위부터, mm, 패널 117 x 193.8 기준)
  var PNL = {
    screws: [[6, 13.6], [111, 13.6], [33.1, 51.5], [58.2, 51.5], [6, 68.5], [111, 68.5], [6, 123.7], [111, 123.7], [6, 179], [111, 179]],
    limitLed: [68.7, 51.7], powerLed: [48.1, 89.7], master: [74.5, 63.8], mic: [74.5, 79.6], knobD: 11.0,
    rocker: { u0: 36.5, u1: 52.1, v0: 96.2, v1: 119.2 },
    micIn: [77.9, 101.8], lineIn: [80.8, 138.3], masterOut: [79.6, 163.3], mains: [43.2, 148.35], roundCap: [22.6, 161.7], hpf: [72.4, 117.0],
    jackScrews: { micIn: [[88.6, 92.8], [68.5, 113]], lineIn: [[93, 128], [69.4, 148]], masterOut: [[89.5, 154.6], [68.9, 174.7]], mains: [[43.8, 128.2], [43.8, 169.6]] }
  };

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
      abs: new S({ color: 0x0d0d0e, roughness: 0.62, metalness: 0.02 }),
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
  // 커넥터 (로컬: +Z 바깥, +Y 키, 패널 면 z=0)
  function buildXlrFemale(M, name, combo) {
    var X = XLRF, g = grp(name), R = combo ? X.comboR : X.flangeR;
    var ring = new THREE.Shape(); circ(ring, 0, 0, R); ring.holes.push(circ(new THREE.Path(), 0, 0, X.boreR));
    g.add(mk(new THREE.ExtrudeGeometry(ring, { depth: X.ring, bevelEnabled: false, curveSegments: 48 }), M.jack, name + '.housing'));
    g.add(mk(new THREE.TorusGeometry(X.boreR + 0.3, 0.3, 8, 48).translate(0, 0, X.ring), M.metal, name + '.rim'));
    var top = X.ring;
    g.add(mk(new THREE.CylinderGeometry(X.boreR, X.boreR, X.annulus, 48, 1, true).rotateX(Math.PI / 2).translate(0, 0, top - X.annulus / 2), M.holeWall, name + '.boreWall', { cast: false }));
    g.add(mk(new THREE.RingGeometry(X.insertR, X.boreR, 48).translate(0, 0, top - X.annulus), M.hole, name + '.annulusFloor', { cast: false }));
    var ins = new THREE.Shape(); circ(ins, 0, 0, X.insertR);
    PINS.forEach(function (p) { ins.holes.push(circ(new THREE.Path(), p[0], p[1], X.holeR)); });
    if (combo) ins.holes.push(circ(new THREE.Path(), 0, 0, 3.4));
    var insL = X.annulus - X.insertFace;
    g.add(mk(new THREE.ExtrudeGeometry(ins, { depth: insL, bevelEnabled: false, curveSegments: 32 }).translate(0, 0, top - X.annulus), M.insert, name + '.insert'));
    g.add(mk(new THREE.CircleGeometry(X.insertR - 0.3, 32).translate(0, 0, top - X.holeBottom), M.hole, name + '.holeBacking', { cast: false }));
    var latch = mk(new THREE.BoxGeometry(4.2, 3.0, 1.2).translate(0, R - 1.6, top + 0.6), M.metal, name + '.latch'); g.add(latch); // 키(+Y) 쪽 PUSH 래치
    g.userData.faceMM = top; return g;
  }
  function buildXlrMale(M, name) {
    var X = XLRM, g = grp(name);
    var ring = new THREE.Shape(); circ(ring, 0, 0, X.flangeR); ring.holes.push(circ(new THREE.Path(), 0, 0, X.boreR));
    g.add(mk(new THREE.ExtrudeGeometry(ring, { depth: X.ring, bevelEnabled: false, curveSegments: 48 }), M.jack, name + '.housing'));
    var top = X.ring;
    g.add(mk(new THREE.CylinderGeometry(X.boreR, X.boreR, X.depth, 48, 1, true).rotateX(Math.PI / 2).translate(0, 0, top - X.depth / 2), M.holeWall, name + '.boreWall', { cast: false }));
    g.add(mk(new THREE.CircleGeometry(X.boreR, 48).translate(0, 0, top - X.depth), M.insert, name + '.insertFace', { cast: false }));
    PINS.forEach(function (p, i) {
      var len = X.depth - X.pinTip - X.pinR;
      g.add(mk(new THREE.CylinderGeometry(X.pinR, X.pinR, len, 16).rotateX(Math.PI / 2).translate(p[0], p[1], top - X.depth + len / 2), M.contact, name + '.pin' + (i + 1)));
      g.add(mk(new THREE.SphereGeometry(X.pinR, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).translate(p[0], p[1], top - X.pinTip - X.pinR), M.contact, name + '.pinTip' + (i + 1)));
    });
    var lw = X.latch;
    g.add(mk(new THREE.BoxGeometry(lw.halfW * 2, lw.rOut - X.boreR, lw.y1 - lw.y0).translate(0, (X.boreR + lw.rOut) / 2, top - (lw.y0 + lw.y1) / 2), M.hole, name + '.latchWindow', { cast: false }));
    g.userData.faceMM = top; return g;
  }
  function iecOpenPts() { var w = IEC.open.w / 2, h = IEC.open.h / 2, c = IEC.open.chamfer; return [[-w, -h], [w, -h], [w, h - c], [w - c, h], [-w + c, h], [-w, h - c]]; }
  function buildIec(M) {
    var g = grp('mainsIn'), F = IEC.frame, open = iecOpenPts();
    var lip = open.map(function (q) { return [q[0] * (1 + 1.8 / IEC.open.w), q[1] * (1 + 1.8 / IEC.open.h)]; });
    var fl = new THREE.Shape(); rrect(fl, 0, 0, F.w + 2, F.h + 2, 3); fl.holes.push(poly(new THREE.Path(), open));
    g.add(mk(new THREE.ExtrudeGeometry(fl, { depth: IEC.flange.t, bevelEnabled: false }), M.jack, 'mainsIn.flange'));
    var fr = new THREE.Shape(); rrect(fr, 0, 0, F.w, F.h, F.r); fr.holes.push(poly(new THREE.Path(), lip));
    g.add(mk(new THREE.ExtrudeGeometry(fr, { depth: F.face, bevelEnabled: false }), M.jack, 'mainsIn.frame'));
    var ls = poly(new THREE.Shape(), lip); ls.holes.push(poly(new THREE.Path(), open));
    g.add(mk(new THREE.ExtrudeGeometry(ls, { depth: F.face - 0.6, bevelEnabled: false }), M.jack, 'mainsIn.frameLip'));
    g.add(mk(new THREE.ExtrudeGeometry(poly(new THREE.Shape(), open), { depth: -IEC.floor, bevelEnabled: false }).translate(0, 0, IEC.floor), M.holeWall, 'mainsIn.recessWall', { cast: false }));
    g.add(mk(new THREE.ShapeGeometry(poly(new THREE.Shape(), open)).translate(0, 0, IEC.floor + 0.01), M.insert, 'mainsIn.recessFloor', { cast: false }));
    IEC.pins.forEach(function (p) { var len = IEC.pinTip - IEC.floor;
      g.add(mk(new THREE.BoxGeometry(p[3], p[4], len).translate(p[1], p[2], IEC.floor + len / 2), M.metal, 'mainsIn.' + p[0])); });
    g.userData.faceMM = F.face; return g;
  }
  function buildScrew(M, name, r) { var g = new THREE.CylinderGeometry(r, r * 1.05, 0.9, 16).rotateX(Math.PI / 2).translate(0, 0, 0.45); var s = mk(g, M.screw, name);
    var cr = mk(new THREE.BoxGeometry(r * 1.3, r * 0.28, 0.2).translate(0, 0, 0.92), M.hole, name + '.slotA', { cast: false }); var cr2 = cr.clone(); cr2.name = NS + '.' + name + '.slotB'; cr2.rotation.z = Math.PI / 2; s.add(cr); s.add(cr2); return s; }
  function buildKnob(M, name) {
    var g = grp(name), r = PNL.knobD / 2;
    g.add(mk(new THREE.CylinderGeometry(r, r * 1.04, 9, 28).rotateX(Math.PI / 2).translate(0, 0, 4.5), M.knobBlue, name + '.cap'));
    var ptr = mk(new THREE.BoxGeometry(0.9, r * 0.85, 0.3).translate(0, r * 0.45, 9.1), M.white, name + '.pointer', { cast: false }); g.add(ptr);
    g.add(mk(new THREE.CylinderGeometry(r + 0.8, r + 0.8, 1.0, 28).rotateX(Math.PI / 2).translate(0, 0, 0.5), M.knobGrey, name + '.skirt'));
    return g;
  }
  function buildLed(M, name, mat) { return mk(new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), mat.clone(), name); }

  // 패널 인쇄
  function panelPrint() {
    var W = 117, H = 193.8, s = 8, c = document.createElement('canvas'); c.width = W * s; c.height = H * s; var g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height); g.fillStyle = '#eceef0'; g.strokeStyle = '#eceef0'; g.textBaseline = 'middle';
    function T(t, u, v, size, opt) { var o = opt || {}; g.font = (o.style || '') + ' ' + (o.weight || '600') + ' ' + size * s + 'px Arial, Helvetica, sans-serif'; g.textAlign = o.align || 'left'; g.fillText(t, u * s, v * s); }
    function L(u0, v0, u1, v1, w) { g.lineWidth = (w || 0.35) * s; g.beginPath(); g.moveTo(u0 * s, v0 * s); g.lineTo(u1 * s, v1 * s); g.stroke(); }
    g.lineWidth = 0.35 * s; g.strokeRect(14.5 * s, 6.3 * s, 10.8 * s, 10.5 * s); T('EV', 19.9, 11.6, 6.2, { align: 'center', weight: '800' });
    T('Electro-Voice', 28.6, 10.6, 8.2, { weight: '700' }); L(28.6, 15.2, 102.5, 15.2, 0.3); T('www.electrovoice.com', 65.5, 19, 2.3, { align: 'center', weight: '400' });
    T('ZXA1', 58.5, 30.3, 10.5, { align: 'center', weight: '900', style: 'italic' }); T('AMPLIFIED 2-WAY LOUDSPEAKER SYSTEM, 800 WATTS', 58.5, 38, 2.0, { align: 'center', weight: '600' });
    T('LIMIT', 68.7, 47.2, 2.2, { align: 'center' });
    T('MASTER', 92.0, 62.5, 2.8, { weight: '800' }); T('MIC', 103, 82, 2.8, { weight: '800' }); T('MIC IN', 99, 103.5, 2.8, { weight: '800' });
    T('LINE IN', 99, 139.5, 2.8, { weight: '800' }); T('MASTER', 99, 162, 2.8, { weight: '800' }); T('OUT', 99, 166.2, 2.8, { weight: '800' });
    T('MAINS', 19, 147, 2.8, { weight: '800' }); T('IN', 19, 151.2, 2.8, { weight: '800' });
    T('POWER', 51, 89.7, 2.2); T('ON', 54, 99.5, 2.0); T('OFF', 54, 116.5, 2.0); T('WITH SUB', 66.5, 121.2, 2.0, { align: 'right' }); T('FULLRANGE', 75, 121.2, 2.0);
    // 노브 눈금
    [[PNL.master, ['-∞', '-24', '-12', '-6', '-3', '0', '2', '4', '+6dB']], [PNL.mic, ['-∞', '0', '', '10', '20', '30', '', '', '+40dB']]].forEach(function (kk) {
      var c0 = kk[0]; for (var i = 0; i <= 8; i++) { var a = (-135 + i * 270 / 8) * Math.PI / 180, r0 = 6.6, r1 = 7.6; L(c0[0] + Math.sin(a) * r0, c0[1] - Math.cos(a) * r0, c0[0] + Math.sin(a) * r1, c0[1] - Math.cos(a) * r1, 0.3);
        var up = Math.cos(a) > 0.2 && kk[0] === PNL.mic; // MIC 위쪽 숫자는 MASTER 와 겹치므로 옆으로 붙임(그림과 같은 자리)
        if (kk[1][i]) T(kk[1][i], c0[0] + Math.sin(a) * (up ? 9.4 : 9.6), c0[1] - Math.cos(a) * (up ? 8.4 : 9.2), 1.45, { align: 'center', weight: '500' }); } });
    L(18.6, 55.5, 54.4, 55.5, 0.3); L(15.9, 58.8, 15.9, 83.4, 0.3);              // 인쇄 선 (그림 그대로)
    L(84, 82, 98, 82, 0.5); L(98, 82, 98, 103.5, 0.5);                            // MIC ↔ MIC IN 묶음 선
    ['THIS DEVICE COMPLIES', 'WITH PART 15 OF THE', 'FCC RULES. OPERATION', 'IS SUBJECT TO THE', 'FOLLOWING TWO', 'CONDITIONS.'].forEach(function (t, i) { T(t, 3.5, 103 + i * 3.1, 1.6, { weight: '600' }); });
    T('CE', 4, 151, 4.0, { weight: '800' });
    g.lineWidth = 0.3 * s; g.strokeRect(52 * s, 179.6 * s, 52.3 * s, 11.2 * s); T('CAUTION', 78.1, 183, 2.2, { align: 'center', weight: '900' }); T('RISK OF ELECTRIC SHOCK  DO NOT OPEN', 78.1, 187.3, 1.5, { align: 'center' });
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

    // 앰프 패널 (로컬: +Z 바깥 = 모델 -Z, +X = 뒤에서 볼 때 오른쪽 = 모델 -X)
    var pnl = reg('ampPanel', grp('ampPanel')); setMM(pnl, PANEL.cx, PANEL.cy, PANEL.faceZ); pnl.rotation.y = Math.PI; root.add(pnl);
    var k = PANEL.k, toL = function (uv) { return [(uv[0] - 58.5) * k, (96.9 - uv[1]) * k]; };
    var face = new THREE.Shape(); rrect(face, 0, 0, PANEL.w, PANEL.h, PANEL.r);
    var holeOf = function (c, r) { var l = toL(c); return circ(new THREE.Path(), l[0], l[1], r); };
    face.holes.push(holeOf(PNL.micIn, XLRF.boreR), holeOf(PNL.lineIn, XLRF.boreR), holeOf(PNL.masterOut, XLRM.boreR));
    var mainsL = toL(PNL.mains); face.holes.push(poly(new THREE.Path(), iecOpenPts().map(function (q) { return [-q[1], q[0]]; }), mainsL[0], mainsL[1])); // IEC 90° 회전
    var rk = PNL.rocker, rkc = toL([(rk.u0 + rk.u1) / 2, (rk.v0 + rk.v1) / 2]), rkw = (rk.u1 - rk.u0) * k, rkh = (rk.v1 - rk.v0) * k;
    face.holes.push(rrect(new THREE.Path(), rkc[0], rkc[1], rkw - 2.4, rkh - 2.4, 1));
    pnl.add(mk(new THREE.ExtrudeGeometry(face, { depth: 2.0, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelOffset: -0.4, bevelSegments: 2, curveSegments: 40 }).translate(0, 0, -2.0), M.panel, 'ampPanel.plate'));
    // 패널 상자 옆벽(오목부 안쪽으로 들어감) + 안쪽 바닥
    var box = new THREE.Shape(); rrect(box, 0, 0, PANEL.w, PANEL.h, PANEL.r); box.holes.push(rrect(new THREE.Path(), 0, 0, PANEL.w - 2, PANEL.h - 2, PANEL.r));
    pnl.add(mk(new THREE.ExtrudeGeometry(box, { depth: PANEL.boxDepth - 2, bevelEnabled: false }).translate(0, 0, -PANEL.boxDepth), M.panel, 'ampPanel.box'));
    var inner = mk(new THREE.PlaneGeometry(PANEL.w - 2, PANEL.h - 2).translate(0, 0, -PANEL.boxDepth + 0.5), M.hole, 'ampPanel.innerBack', { cast: false }); pnl.add(inner);
    var pp = mk(new THREE.PlaneGeometry(117 * k, 193.8 * k), decalMat(panelPrint()), 'ampPanel.print', { cast: false }); pp.position.z = 0.42 * MM; pnl.add(pp);
    function place(obj, uv, z, rotZ) { var l = toL(uv); setMM(obj, l[0], l[1], z || 0); if (rotZ) obj.rotation.z = rotZ; pnl.add(obj); return obj; }
    PNL.screws.forEach(function (s, i) { place(buildScrew(M, 'ampPanel.screw' + (i + 1), 2.0), s, 0.4); });
    Object.keys(PNL.jackScrews).forEach(function (kk) { PNL.jackScrews[kk].forEach(function (s, i) { place(buildScrew(M, kk + '.screw' + (i + 1), 1.6), s, 0.4); }); });
    // 커넥터: XLR 키(+Y_local) → 패널 +X(뒤에서 볼 때 오른쪽, 그림의 래치 위치). IEC 접지(+Y_local) → 패널 -X
    var micIn = place(buildXlrFemale(M, 'micIn', false), PNL.micIn, 0.4, -Math.PI / 2);
    var lineIn = place(buildXlrFemale(M, 'lineIn', true), PNL.lineIn, 0.4, -Math.PI / 2);
    var masterOut = place(buildXlrMale(M, 'masterOut'), PNL.masterOut, 0.4, -Math.PI / 2);
    var mains = place(buildIec(M), PNL.mains, 0.0, Math.PI / 2);
    ports.micIn = { part: micIn, type: 'xlr3-female', role: 'input', accepts: ['xlr3-male-cable-plug'], insertDepthMM: XLRF.insertDepthMM, axis: 'z' };
    ports.lineIn = { part: lineIn, type: 'combo-xlr3-female-phone', role: 'input', accepts: ['xlr3-male-cable-plug', 'trs-6.3-plug', 'ts-6.3-plug'], insertDepthMM: XLRF.insertDepthMM, axis: 'z' };
    ports.masterOut = { part: masterOut, type: 'xlr3-male', role: 'output', accepts: ['xlr3-female-cable-plug'], insertDepthMM: XLRM.insertDepthMM, axis: 'z' };
    ports.mainsIn = { part: mains, type: 'iec-c14', role: 'power', accepts: ['iec-c13-plug'], insertDepthMM: IEC.insertDepthMM, axis: 'z',
      extra: { recessDepthMM: IEC.frame.face - IEC.floor, pinsMM: IEC.pins.map(function (p) { return { name: p[0], x: p[1], y: p[2] }; }) } };
    // 노브·LED·스위치
    var master = place(buildKnob(M, 'masterKnob'), PNL.master, 0.4), mic = place(buildKnob(M, 'micKnob'), PNL.mic, 0.4);
    var limit = place(buildLed(M, 'limitLed', M.ledAmberOff), PNL.limitLed, 0.4), power = place(buildLed(M, 'powerLed', M.ledGreenOff), PNL.powerLed, 0.4);
    var rocker = grp('powerSwitch'); rocker.add(mk(new THREE.BoxGeometry(rkw, rkh, 1.6).translate(0, 0, 0.8), M.jack, 'powerSwitch.bezel'));
    var rk2 = mk(new THREE.BoxGeometry(rkw - 3, rkh - 3, 3.0).translate(0, 0, 1.5), M.absDark, 'powerSwitch.rocker'); rocker.add(rk2);
    place(rocker, [(rk.u0 + rk.u1) / 2, (rk.v0 + rk.v1) / 2], 0.0);
    var hpf = grp('hpfSwitch'); hpf.add(mk(new THREE.BoxGeometry(3.4, 3.4, 0.6).translate(0, 0, 0.3), M.hole, 'hpfSwitch.well', { cast: false }));
    var hpfBtn = mk(new THREE.BoxGeometry(2.2, 2.2, 1.0).translate(0, 0, 0.5), M.white, 'hpfSwitch.button'); hpf.add(hpfBtn); place(hpf, PNL.hpf, 0.4);
    var cap = grp('mainsRoundCap'); cap.add(mk(new THREE.CylinderGeometry(4.0, 4.0, 2.0, 24).rotateX(Math.PI / 2).translate(0, 0, 1.0), M.jack, 'mainsRoundCap.body'));
    cap.add(mk(new THREE.CylinderGeometry(1.4, 1.4, 0.4, 16).rotateX(Math.PI / 2).translate(0, 0, 2.1), M.metal, 'mainsRoundCap.center')); place(cap, PNL.roundCap, 0.4);
    hide(ctl, 'master', master); hide(ctl, 'mic', mic); hide(ctl, 'limit', limit); hide(ctl, 'power', power); hide(ctl, 'rocker', rk2); hide(ctl, 'hpfBtn', hpfBtn);

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

    // ===== 상태 API =====
    var state = { power: false, master: 0, mic: 0, hpf: 'fullrange', limit: false };
    var api = {
      setMaster: function (v) { state.master = clamp01(v); master.rotation.z = knobAngle(state.master); return api; },
      setMic: function (v) { state.mic = clamp01(v); mic.rotation.z = knobAngle(state.mic); return api; },
      setPower: function (on) { state.power = !!on; rk2.rotation.x = (on ? 1 : -1) * 0.12; setLed(power, on, 0x13c94a); if (!on) setLed(limit, false); return api; },
      setLimit: function (on) { state.limit = !!on && state.power; setLed(limit, state.limit, 0xff9a00); return api; },
      setHighPass: function (mode) { state.hpf = mode === 'withSub' ? 'withSub' : 'fullrange'; hpfBtn.position.z = (state.hpf === 'withSub' ? -0.7 : 0) * MM; return api; },
      getState: function () { return JSON.parse(JSON.stringify(state)); }
    };
    function clamp01(v) { return Math.max(0, Math.min(1, +v || 0)); }
    function knobAngle(v) { return (135 - 270 * v) * Math.PI / 180; } // 패널 로컬 Z(바깥) 기준: 0 → 왼쪽 아래(-∞), 1 → 오른쪽 아래
    function setLed(m, on, col) { m.material.emissive.setHex(on ? col : 0x000000); m.material.emissiveIntensity = on ? 0.9 : 0; m.material.color.setHex(on ? col : (m === power ? 0x0f3018 : 0x3a2a05)); }
    api.setMaster(0); api.setMic(0); api.setPower(false);
    root.userData[NS] = { api: api };
    hide(root.userData[NS], 'parts', parts); hide(root.userData[NS], 'ports', ports);
    root.userData.info = { model: 'Electro-Voice ZXA1-90', dimensionsMM: DIM, units: 'm' };
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

  window.EvZXA1 = {
    NAMESPACE: NS, DIMENSIONS_MM: DIM, SECTION_MM: SECTION, PANEL_MM: PANEL, PANEL_LAYOUT: PNL, FACET_MM: FACET, FEET_MM: FEET, POLE_MM: POLE, FEET_H_MM: FEET_H,
    XLR_IN_MM: XLRF, XLR_OUT_MM: XLRM, IEC_MM: IEC, PINS_MM: PINS, frontZ: frontZ,
    create: create, getPortInfo: getPortInfo, getAllPorts: getAllPorts, seatPlug: seatPlug, toGear3dPortsLocal: toGear3dPortsLocal
  };
})();
