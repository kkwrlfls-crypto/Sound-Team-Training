/* =============================================================================
   디지털 케이블 커넥터 모음 — 절차적(procedural) 3D 모델  (Three.js r128 전용, 2026-11-04)
   -----------------------------------------------------------------------------
   - 전역: window.DigitalConnectors = { create(opts), VARIANTS, DIMENSIONS_MM, INFO, CAMERA_DIR }
       create({ variant: 'etherCON' | 'RJ45' | 'AES-XLR' | 'BNC' | 'TOSLINK' | 'USB-C' | 'USB-A' | 'USB-B' | 'USB-AB' | 'set',
                tail: true(케이블 꼬리), tailLength: mm(선택) })  → THREE.Group (미터 단위)
   - 단위: 내부는 mm 로 만들고 루트 안의 그룹을 0.001 배(미터)로 줄임.
       원점 = 바닥면 가운데(전체 bbox 기준),  +Y 위,  +Z 앞(플러그 결합면이 보는 쪽),  +X 오른쪽
       플러그 로컬: 결합면 중심 = (0,0,0), 몸체는 -Z 로 뻗고 케이블은 뒤(-Z)로 나감
   - 제조사 로고 · 상표 그림은 그리지 않음. 글자는 규격 · 기능 이름만(케이블 인쇄 · 이름표).

   치수 근거  (공식 = 규격서 · 제조사 표기 / 추정 = 사진 비례 추정)
   · RJ45 8P8C 플러그 : 공식 — 너비 11.68, 꽂히는 부분 높이 6.60, 접점 간격 1.02 mm, 전체 22.48 × 11.68 × 8.00
                        (FCC 68.500 / IEC 60603-7 값, https://en.wikipedia.org/wiki/Modular_connector)
                        추정 — 걸쇠(래치) 모양 · 각도, 접점 칼날 높이, 스내그리스 부트 모양 · 길이(36 mm)
                        배선 색: T568B(1 흰주황, 2 주황, 3 흰초록, 4 파랑, 5 흰파랑, 6 초록, 7 흰갈색, 8 갈색)
   · etherCON NE8MC-1 : 공식 — 아연 다이캐스트 쉘 + 크롬 도금, 잠금 래치(강철), 척(chuck) 방식 케이블 고정,
                        XLR X 시리즈와 같은 부트, 케이블 Ø 3.5–8 mm (https://neutrik.com/product/ne8mc-1 ,
                        https://www.neutrik.com/en/product/ne8mc-1.pdf). 후속 NE8MX-1 전장 67.55 mm
                        (https://uk.rs-online.com/web/p/ethernet-connectors/1975000) → 전장 67.5 로 맞춤
                        추정 — 쉘 Ø 20.8, 래치 레버 크기 · 위치, 앞 인서트 창(12.3 × 7.3) — 제품 사진 비례
   · AES/EBU XLR 수   : 공식 — Neutrik NC3MXX 도면: 전장 68.1–70.1, 슬리브 Ø 19 (assets3d/xlr_cable_model.js 와 같은 값),
                        핀 위치 1·2 = x ∓4.04, 3 = y −3.95. AES3 은 110 Ω 평형 — 커넥터는 일반 XLR 과 같고 케이블만 다름
                        추정 — 코딩 링 · 케이블 띠(플래그 라벨) · 보라색 케이블은 「구별 표시」 예시(실제 색은 제조사마다 다름)
   · BNC 75 Ω 수      : 공식 — Amphenol 031-70537-12G: 75 Ω, 베이어닛 결합, 니켈 도금 황동 몸체, 금도금 중심 접점, PTFE 절연
                        (https://www.markertek.com/product/amph-0317053712g/…), IEC 61169-8 BNC 인터페이스
                        추정 — 결합 너트 Ø 14.2(그립) · Ø 12.4(앞), J 홈 폭 1.6 · 회전각 63°, 중심 핀 Ø 1.36, 전장 42 (사진 비례)
   · TOSLINK (JIS F05): 추정 — 머리 6.8 × 5.8 (위 두 모서리 깎임), 페룰 Ø 2.5 · 돌출 2.0, 플라스틱 광섬유 코어 Ø 1,
                        몸통 9.6 × 8.4, 전장 36 (규격 그림을 글로 확인하지 못해 사진 비례로 맞춤)
   · USB Type-C 플러그: 공식 — USB Type-C Cable and Connector Spec Rel 2.0: 쉘 8.25 × 2.40, 결합 길이 6.65(도면 표 6.51–6.65),
                        오버몰드 최대 12.35 × 6.50, 접점 12 + 12 개(0.5 mm 간격), 양면 대칭
                        (https://git.cuvoodoo.info/kingkevin/qeda_library — connector_usb-c_plug.yaml 이 규격값 인용)
                        추정 — 안쪽 인서트 슬롯 6.69 × 0.72, 오버몰드 실제 11.4 × 5.6 × 14.4
   · USB Standard-A   : 공식 — 쉘 12.0 × 4.5, 쉘 길이 11.75, 오버몰드 최대 16 × 8 (USB 2.0 규격 · 위 라이브러리 USB-A_plug.yaml),
                        전원 핀(1·4)이 데이터 핀(2·3)보다 앞으로 나옴(먼저 닿음)
                        추정 — 혀 두께 1.95, 접점 x 위치 ±1.0 · ±3.5, 잠금 창 4개 위치
   · USB Standard-B   : 공식 — 쉘 너비 8.0 · 높이 7.26, 오버몰드 최대 11.5 × 10.5 (USB 2.0 규격, 위 라이브러리 USB-B_plug.yaml)
                        추정 — 위 모서리 깎임 1.6, 쉘 길이 9.6, 안쪽 구멍 5.7 × 3.3, 옆 딤플
   ============================================================================= */
(function (global) {
  'use strict';
  var THREE = global.THREE;
  if (!THREE) { console.error('[DigitalConnectors] THREE 가 먼저 로드되어야 합니다.'); return; }

  var VARIANTS = ['etherCON', 'RJ45', 'AES-XLR', 'BNC', 'TOSLINK', 'USB-C', 'USB-A', 'USB-B', 'USB-AB', 'set'];
  var SET_ORDER = ['etherCON', 'RJ45', 'AES-XLR', 'BNC', 'TOSLINK', 'USB-C', 'USB-A', 'USB-B'];
  // 플러그 하나의 크기 정보 (mm): L = 결합면→케이블 출구, rc = 케이블 반지름, down/up = 축에서 아래/위 끝, halfW = 축에서 옆 끝
  var INFO = {
    'etherCON': { L: 67.5, rc: 3.25, down: 10.4, up: 12.1, halfW: 10.4, jacket: 0x16171a, ink: '#d1d5db', print: 'CAT5e SF/UTP 4×2×AWG24  ·  ROAD CABLE  ·  etherCON', end: 'cat', name: 'etherCON', sub: '잠금형 랜(이더넷)' },
    'RJ45': { L: 36, rc: 3.0, down: 6.4, up: 3.3, halfW: 6.3, jacket: 0x2b63c9, ink: '#e5edff', print: 'CAT6 U/UTP 4PR 23AWG  ·  ETHERNET', end: 'cat', name: 'RJ45', sub: '랜(이더넷) 플러그' },
    'AES-XLR': { L: 70, rc: 3.2, down: 9.5, up: 9.5, halfW: 9.5, jacket: 0x6a3fb0, ink: '#f3e8ff', print: 'AES/EBU DIGITAL AUDIO  ·  110 Ω  ·  2×0.22 mm²', end: 'aes', name: 'AES/EBU XLR', sub: '110 Ω 디지털 XLR' },
    'BNC': { L: 42, rc: 3.05, down: 7.1, up: 7.1, halfW: 7.1, jacket: 0x141516, ink: '#e5e7eb', print: '75 Ω COAX  ·  RG59  ·  WORD CLOCK / MADI', end: 'coax', name: 'BNC 75 Ω', sub: '워드클럭 · MADI 동축' },
    'TOSLINK': { L: 36, rc: 2.5, down: 4.2, up: 4.2, halfW: 4.8, jacket: 0x151618, ink: '#cbd5e1', print: 'OPTICAL DIGITAL AUDIO  ·  POF Ø1.0', end: 'fiber', name: 'TOSLINK', sub: 'ADAT · S/PDIF 광' },
    'USB-C': { L: 28.5, rc: 2.0, down: 2.8, up: 2.8, halfW: 5.7, jacket: 0x1b1c1f, ink: '#cbd5e1', print: 'USB 2.0  ·  TYPE-C  ·  28AWG/1P + 24AWG/2C', end: 'usb', name: 'USB-C', sub: '양면 대칭 · 8.25 × 2.4' },
    'USB-A': { L: 40, rc: 2.25, down: 3.7, up: 3.7, halfW: 7.7, jacket: 0x1b1c1f, ink: '#cbd5e1', print: 'USB 2.0 HIGH SPEED  ·  28AWG/1P + 24AWG/2C', end: 'usb', name: 'USB-A', sub: '컴퓨터 쪽 · 12 × 4.5' },
    'USB-B': { L: 37, rc: 2.25, down: 5.1, up: 5.1, halfW: 5.6, jacket: 0x1b1c1f, ink: '#cbd5e1', print: 'USB 2.0 HIGH SPEED  ·  28AWG/1P + 24AWG/2C', end: 'usb', name: 'USB-B', sub: '장비(인터페이스) 쪽' }
  };
  var DIM = {
    'RJ45': { width: 11.68, bodyHeight: 6.6, heightWithLatch: 8.0, length: 22.48, pitch: 1.02, src: '공식(FCC 68.500/IEC 60603-7)', bootLength: 36, bootSrc: '추정' },
    'etherCON': { length: 67.5, shellD: 20.8, cableOD: '3.5–8', src: '전장=NE8MX-1 공식 67.55 · 쉘 Ø 추정' },
    'AES-XLR': { length: 70, sleeveD: 19, impedanceOhm: 110, src: '공식(Neutrik NC3MXX 도면)' },
    'BNC': { impedanceOhm: 75, nutD: 14.2, length: 42, src: '임피던스·재질 공식(Amphenol 031-70537-12G) · 치수 추정' },
    'TOSLINK': { headW: 6.8, headH: 5.8, ferruleD: 2.5, length: 36, src: '추정(사진 비례)' },
    'USB-C': { shellW: 8.25, shellH: 2.4, mateLength: 6.65, overmoldMax: [12.35, 6.5], contacts: 24, pitch: 0.5, src: '공식(USB Type-C 규격 Rel 2.0)' },
    'USB-A': { shellW: 12.0, shellH: 4.5, shellLength: 11.75, overmoldMax: [16, 8], contacts: 4, src: '공식(USB 2.0 규격)' },
    'USB-B': { shellW: 8.0, shellH: 7.26, overmoldMax: [11.5, 10.5], contacts: 4, shellLength: 9.6, src: '너비·높이 공식(USB 2.0) · 길이 추정' }
  };
  var CAMERA_DIR = { single: [0.6, 0.42, 1], set: [0.1, 0.8, 1], 'USB-AB': [0.25, 0.85, 1] };

  // ---------------------------------------------------------------------------
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c) { var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  var FONT = '"Noto Sans KR","Noto Sans CJK KR","Pretendard","Apple SD Gothic Neo","Malgun Gothic",Arial,sans-serif';
  function txt(g, s, x, y, size, o) { o = o || {}; g.font = (o.weight || '700') + ' ' + size + 'px ' + FONT; g.fillStyle = o.color || '#e5e7eb'; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }

  // 금속이 조명만으로는 어둡게 보이므로 작은 「스튜디오」 환경맵(큐브)을 캔버스로 그려 반사에 씀 (한 번만 만듦)
  var ENV = null;
  function envMap() {
    if (ENV) return ENV;
    var S = 64;
    function face(kind) {
      var c = canvas(S, S), g = c.getContext('2d'), gr;
      if (kind === 'top') { g.fillStyle = '#c9d6e6'; g.fillRect(0, 0, S, S); g.fillStyle = '#ffffff'; g.fillRect(S * 0.2, S * 0.25, S * 0.6, S * 0.5); }
      else if (kind === 'bottom') { g.fillStyle = '#141a22'; g.fillRect(0, 0, S, S); }
      else {
        gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, '#b7c6d8'); gr.addColorStop(0.48, '#6f7f93'); gr.addColorStop(0.52, '#2a323d'); gr.addColorStop(1, '#10151b');
        g.fillStyle = gr; g.fillRect(0, 0, S, S);
        if (kind === 'key') { g.fillStyle = '#ffffff'; g.fillRect(S * 0.18, S * 0.1, S * 0.22, S * 0.38); }
        if (kind === 'rim') { g.fillStyle = '#bfe3ff'; g.fillRect(S * 0.62, S * 0.14, S * 0.14, S * 0.3); }
      }
      return c;
    }
    ENV = new THREE.CubeTexture([face('key'), face('side'), face('top'), face('bottom'), face('key'), face('rim')]);
    ENV.encoding = THREE.sRGBEncoding; ENV.needsUpdate = true;
    return ENV;
  }

  function makeMaterials() {
    var S = THREE.MeshStandardMaterial, D = THREE.DoubleSide, env = envMap();
    function m(color, rough, metal, extra) {
      var o = { color: color, roughness: rough, metalness: metal || 0, side: D, envMap: env, envMapIntensity: metal > 0.5 ? 1.0 : 0.35 };
      if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
      var mt = new S(o); mt.color.convertSRGBToLinear(); if (mt.emissive) mt.emissive.convertSRGBToLinear(); return mt;
    }
    var M = {
      chrome: m(0xe6e9ee, 0.1, 1.0), nickel: m(0xc9ccd1, 0.28, 0.95), steel: m(0x9ba1a9, 0.36, 0.9), darkSteel: m(0x50555c, 0.42, 0.85),
      gold: m(0xffc24a, 0.3, 0.9, { emissive: 0x3a2400, emissiveIntensity: 0.6 }), copper: m(0xd98a4e, 0.3, 1.0),
      black: m(0x141516, 0.55, 0), insert: m(0x0d0d0e, 0.6, 0), hole: m(0x030304, 1.0, 0), chuck: m(0x1b1c1e, 0.48, 0.05), rubber: m(0x111112, 0.78, 0),
      overmold: m(0x1e2023, 0.58, 0.02), white: m(0xedede8, 0.5, 0), ptfe: m(0xf4f4ef, 0.62, 0),
      clear: m(0xe4ecf2, 0.06, 0, { transparent: true, opacity: 0.32, depthWrite: false }),
      blueBoot: m(0x3a78dc, 0.55, 0), violet: m(0x7c4dc4, 0.5, 0), red: m(0xd42a2a, 0.5, 0), labelWhite: m(0xf3f3ee, 0.7, 0),
      fiber: m(0xff4a3a, 0.3, 0, { emissive: 0xff2a10, emissiveIntensity: 1.3 }), fiberRing: m(0x3a3c40, 0.4, 0.2),
      wire: [0xf1e3d3, 0xf08a24, 0xe3efe0, 0x2f5fd0, 0xe2e8f6, 0x2aa04a, 0xece4dc, 0x7a4a26].map(function (c) { return m(c, 0.45, 0); })
    };
    return M;
  }

  // ---- 모양 도우미 (mm) ----
  var V = new THREE.Vector3(), Qt = new THREE.Quaternion(), E = new THREE.Euler(), ONE = new THREE.Vector3(1, 1, 1);
  function M4(x, y, z, rx, ry, rz) { E.set(rx || 0, ry || 0, rz || 0); Qt.setFromEuler(E); return new THREE.Matrix4().compose(V.set(x || 0, y || 0, z || 0), Qt, ONE); }
  function lathe(pts, seg) {   // pts = [[r, z], …] (z 증가 순서 = 바깥면) → Z 축 회전체
    var g = new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(Math.max(0, p[0]), p[1]); }), seg || 40);
    g.rotateX(Math.PI / 2); return g;
  }
  function cylZ(r, z0, z1, seg) { var g = new THREE.CylinderGeometry(r, r, z1 - z0, seg || 16); g.rotateX(Math.PI / 2); g.translate(0, 0, (z0 + z1) / 2); return g; }
  function boxC(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
  function extZ(shape, z0, z1, bev) {   // XY 모양을 z0→z1 로 밀어냄 (bev = 모서리 둥글림)
    var b = bev || 0, g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.01, (z1 - z0) - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: b > 0 ? 2 : 0, curveSegments: 8 });
    g.translate(0, 0, z0 + b); return g;
  }
  function rrPath(P, w, h, r, cx, cy) {
    cx = cx || 0; cy = cy || 0; r = Math.max(0.01, Math.min(r, w / 2 - 0.001, h / 2 - 0.001));
    var x0 = cx - w / 2, y0 = cy - h / 2, PI = Math.PI;
    P.moveTo(x0 + r, y0); P.lineTo(x0 + w - r, y0); P.absarc(x0 + w - r, y0 + r, r, -PI / 2, 0, false); P.lineTo(x0 + w, y0 + h - r);
    P.absarc(x0 + w - r, y0 + h - r, r, 0, PI / 2, false); P.lineTo(x0 + r, y0 + h); P.absarc(x0 + r, y0 + h - r, r, PI / 2, PI, false); P.lineTo(x0, y0 + r);
    P.absarc(x0 + r, y0 + r, r, PI, PI * 1.5, false); return P;
  }
  function rrShape(w, h, r, cx, cy) { return rrPath(new THREE.Shape(), w, h, r, cx, cy); }
  function rrHole(w, h, r, cx, cy) { return rrPath(new THREE.Path(), w, h, r, cx, cy); }
  function chamfPath(P, w, h, c, cy, both) {   // 위 두 모서리를 깎은 사각 (USB-B · TOSLINK). both=false 면 위만
    cy = cy || 0; var x0 = -w / 2, x1 = w / 2, y0 = cy - h / 2, y1 = cy + h / 2, cb = both ? c * 0.35 : 0.0001;
    P.moveTo(x0 + cb, y0); P.lineTo(x1 - cb, y0); P.lineTo(x1, y0 + cb); P.lineTo(x1, y1 - c); P.lineTo(x1 - c, y1); P.lineTo(x0 + c, y1); P.lineTo(x0, y1 - c); P.lineTo(x0, y0 + cb); P.lineTo(x0 + cb, y0); return P;
  }
  function circleShape(r, P) { P = P || new THREE.Shape(); P.absarc(0, 0, r, 0, Math.PI * 2, false); return P; }
  function starShape(rOut, rIn, n, holeR) {   // 톱니(널링 · 척 홈) 단면
    var s = new THREE.Shape();
    for (var i = 0; i <= n * 2; i++) { var a = i / (n * 2) * Math.PI * 2, r = i % 2 ? rIn : rOut; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(r, 0); }
    if (holeR) s.holes.push(circleShape(holeR, new THREE.Path()));
    return s;
  }
  function ribbed(rEnd, rFront, z0, z1, ribs, depth, k) {   // 부트 · 그립: z0(뒤 끝)→z1(앞), 반지름은 곡선으로 커지고 앞 일부는 홈
    var pts = [[rEnd * 0.82, z0], [rEnd, z0 + 0.4]], n = 36, L = z1 - z0;
    for (var i = 1; i <= n; i++) {
      var t = i / n, z = z0 + 0.4 + (L - 0.4) * t, r = rEnd + (rFront - rEnd) * Math.pow(t, k || 1.8);
      if (ribs && t < 0.6) { var ph = (t / 0.6) * ribs; if (ph % 1 > 0.55) r -= depth; }
      pts.push([r, z]);
    }
    return pts;
  }

  // 정적 부품은 재질별로 하나로 합쳐 그리기 호출을 줄임 (behringer_x32_model.js 와 같은 방식)
  function Baker() {
    var bins = [];
    function binOf(mat) { for (var i = 0; i < bins.length; i++) if (bins[i].mat === mat) return bins[i]; var b = { mat: mat, geos: [] }; bins.push(b); return b; }
    return {
      add: function (geo, mat, m4) { var g = geo.index ? geo.toNonIndexed() : geo.clone(); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (!g.attributes.normal) g.computeVertexNormals(); if (m4) g.applyMatrix4(m4); binOf(mat).geos.push(g); },
      build: function (parent, name) {
        var out = [];
        bins.forEach(function (b, bi) {
          var n = 0; b.geos.forEach(function (g) { n += g.attributes.position.count; });
          var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), o = 0;
          b.geos.forEach(function (g) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); });
          var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
          geo.computeBoundingSphere(); var mesh = new THREE.Mesh(geo, b.mat); mesh.name = name + '.' + (b.mat.name || bi); if (b.mat.transparent) mesh.renderOrder = 2; parent.add(mesh); out.push(mesh);
        });
        return out;
      }
    };
  }
  // 플러그 좌표계(F)를 품은 add
  function Ctx(B, M, F) {
    return { M: M, F: F,
      add: function (geo, mat, m) { B.add(geo, mat, m ? m.clone().premultiply(F) : F); },
      sub: function (m) { return Ctx(B, M, m.clone().premultiply(F)); } };
  }

  // ---- 그림(텍스처) ----
  function printMaterial(info, lenMM) {   // 케이블 피복 인쇄 (튜브 uv: u = 길이 방향, v = 둘레)
    var W = 2048, H = 256, c = canvas(W, H), g = c.getContext('2d');
    g.fillStyle = hex(info.jacket); g.fillRect(0, 0, W, H);
    for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.03).toFixed(3) + ')'; g.fillRect(Math.random() * W, Math.random() * H, 30 + Math.random() * 80, 1); }
    [H * 0.25, H * 0.75].forEach(function (y, k) { txt(g, info.print, W * (k ? 0.75 : 0.25), y, 30, { color: info.ink, weight: '700' }); txt(g, info.print, W * (k ? 0.25 : 0.75), y, 30, { color: info.ink, weight: '700' }); });
    var t = tex(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    var cycle = W * (2 * Math.PI * info.rc / H);   // 글자가 늘어나지 않게 길이 방향 반복 주기를 둘레에 맞춤
    t.repeat.set(Math.max(1, lenMM / cycle), 1);
    var m = new THREE.MeshStandardMaterial({ color: 0xffffff, map: t, roughness: 0.55, metalness: 0, side: THREE.DoubleSide, envMap: envMap(), envMapIntensity: 0.3 });
    m.name = 'jacket'; return m;
  }
  function endCapMaterial(kind, info) {   // 잘린 케이블 끝 단면 (속 구조)
    var S = 128, c = canvas(S, S), g = c.getContext('2d'), R = S / 2;
    function dot(x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(R + x * R, R - y * R, r * R, 0, 7); g.fill(); }
    dot(0, 0, 1, hex(info.jacket)); dot(0, 0, 0.84, '#0b0c0e');
    if (kind === 'cat') { var cols = [['#f1e3d3', '#f08a24'], ['#e3efe0', '#2aa04a'], ['#e2e8f6', '#2f5fd0'], ['#ece4dc', '#7a4a26']];
      if (info === INFO.etherCON) dot(0, 0, 0.8, '#9aa0a8');
      dot(0, 0, 0.74, '#16171a'); cols.forEach(function (p, i) { var a = i * Math.PI / 2 + 0.6; dot(Math.cos(a) * 0.4 - 0.1 * Math.sin(a), Math.sin(a) * 0.4, 0.15, p[0]); dot(Math.cos(a) * 0.4 + 0.1 * Math.sin(a), Math.sin(a) * 0.4 + 0.12, 0.15, p[1]); }); dot(0, 0, 0.12, '#d6d3d1'); }
    else if (kind === 'aes') { dot(0, 0, 0.8, '#b8bcc2'); dot(0, 0, 0.7, '#e5e7eb'); dot(-0.3, 0, 0.24, '#f3f4f6'); dot(0.3, 0, 0.24, '#2563eb'); dot(-0.3, 0, 0.1, '#d98a4e'); dot(0.3, 0, 0.1, '#d98a4e'); }
    else if (kind === 'coax') { dot(0, 0, 0.8, '#b8bcc2'); dot(0, 0, 0.72, '#d98a4e'); dot(0, 0, 0.64, '#f4f4ef'); dot(0, 0, 0.16, '#d98a4e'); }
    else if (kind === 'fiber') { dot(0, 0, 0.62, '#f0f0ea'); dot(0, 0, 0.42, '#202124'); dot(0, 0, 0.38, '#ff4a3a'); }
    else { dot(0, 0, 0.78, '#b8bcc2'); dot(0, 0, 0.7, '#111214'); [['#e11d48', -0.3, 0.3], ['#f3f4f6', 0.3, 0.3], ['#16a34a', 0.3, -0.3], ['#111111', -0.3, -0.3]].forEach(function (w) { dot(w[1], w[2], 0.2, w[0]); dot(w[1], w[2], 0.08, '#d98a4e'); }); }
    var m = new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.6, side: THREE.DoubleSide }); m.name = 'cableEnd'; return m;
  }
  function xlrFaceMaterial() {   // 수 XLR 핀 받침 면의 번호 1 · 2 · 3
    var S = 256, c = canvas(S, S), g = c.getContext('2d'), R = 8.3;
    g.fillStyle = '#0d0d0e'; g.fillRect(0, 0, S, S);
    function P(x, y) { return [(x / R + 1) / 2 * S, (1 - (y / R + 1) / 2) * S]; }
    [['1', -3.6, 2.5], ['2', 3.6, 2.5], ['3', 2.5, -4.4]].forEach(function (l) { var p = P(l[1], l[2]); txt(g, l[0], p[0], p[1], 22, { color: '#a1a5ab', weight: '800' }); });
    var m = new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.6, side: THREE.DoubleSide }); m.name = 'xlrFace'; return m;
  }
  function bandMaterial() {   // AES 케이블 띠 (둘레를 감은 라벨, 글자는 케이블 길이 방향)
    var W = 512, H = 256, c = canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#f5f5f0'; g.fillRect(0, 0, W, H); g.fillStyle = '#6a3fb0'; g.fillRect(0, 0, W, 18); g.fillRect(0, H - 18, W, 18);
    for (var k = 0; k < 3; k++) { g.save(); g.translate(W * (k + 0.5) / 3, H / 2); g.rotate(-Math.PI / 2); txt(g, 'AES/EBU', 0, -14, 30, { color: '#1f1147', weight: '900' }); txt(g, '110 Ω', 0, 20, 26, { color: '#6a3fb0', weight: '800' }); g.restore(); }
    var m = new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.65, side: THREE.DoubleSide }); m.name = 'aesBand'; return m;
  }
  function flagMaterial() {   // AES 플래그 라벨 (판 윗면)
    var W = 512, H = 640, c = canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#f5f5f0'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#6a3fb0'; rrect(g, 18, 18, W - 36, 150, 18); g.fill();
    txt(g, 'DIGITAL', W / 2, 95, 78, { color: '#ffffff', weight: '900' });
    txt(g, 'AES/EBU', W / 2, 270, 96, { color: '#1f1147', weight: '900' });
    txt(g, '110 Ω', W / 2, 390, 90, { color: '#6a3fb0', weight: '900' });
    txt(g, '마이크 케이블 아님', W / 2, 520, 50, { color: '#374151', weight: '800' });
    var m = new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.65 }); m.name = 'aesFlag'; return m;
  }
  function nameMaterial(info) {   // 비교 세트 이름표
    var W = 512, H = 200, c = canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#16233a'; rrect(g, 4, 4, W - 8, H - 8, 26); g.fill(); g.strokeStyle = '#3b82f6'; g.lineWidth = 6; g.stroke();
    txt(g, info.name, W / 2, 78, info.name.length > 9 ? 62 : 72, { color: '#f8fafc', weight: '900' });
    txt(g, info.sub, W / 2, 148, 40, { color: '#93c5fd', weight: '700' });
    var t = tex(c), m = new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.45, roughness: 0.8, transparent: true });
    m.name = 'nameTag'; return m;
  }

  // ===========================================================================
  // 플러그들 (로컬: 결합면 z=0 이 +Z 를 봄, 몸체는 -Z, +Y 위)
  // ===========================================================================
  // RJ45 — 투명 몸통 · 금 접점 8개(위) · 걸쇠(아래) · 스내그리스 부트. head=true 이면 몸통만(etherCON 안쪽용)
  function buildRJ45(c, head) {
    var M = c.M, a = c.add, W = 11.68, H = 6.6, LB = 21.5, i;
    // 몸통: 앞 4.6 mm 는 위가 낮고 그 위로 접점 칸막이(리브) 9 개
    a(extZ(rrShape(W, H, 0.55), -LB, -4.6, 0.3), M.clear);
    a(extZ(rrShape(W, 5.6, 0.5, 0, -0.5), -4.7, 0, 0.3), M.clear);
    for (i = 0; i <= 8; i++) a(boxC(0.6, 1.0, 4.4), M.clear, M4((4 - i) * 1.02, 2.8, -2.4));
    [-1, 1].forEach(function (s) { a(boxC(1.4, 1.0, 4.4), M.clear, M4(s * 5.1, 2.8, -2.4)); });
    // 금 접점 칼날 (1번 = 위에서 내려다볼 때 왼쪽, 끝이 앞) · 그 아래 8 가닥 색 전선(T568B)
    for (i = 0; i < 8; i++) {
      var x = (3.5 - i) * 1.02;
      a(boxC(0.32, 2.75, 3.3), M.gold, M4(x, 1.68, -2.55));
      a(cylZ(0.45, -16.5, -3.3, 8), M.wire[i], M4(x, 0.75, 0));
      if (i % 2 === 0 && i < 7) a(cylZ(0.475, -15.5, -4.5, 8), [M.wire[1], M.wire[5], M.wire[3], M.wire[7]][i / 2], M4(x, 0.75, 0).multiply(new THREE.Matrix4().makeScale(0.3, 1, 1)));   // 흰색 전선의 색 줄무늬
    }
    // 고정 쐐기(케이블 눌러 잡는 부분) + 안쪽으로 들어온 케이블 피복
    a(boxC(7.6, 1.2, 3.0), M.clear, M4(0, 2.4, -17.4));
    a(cylZ(2.95, -LB + 0.2, -15.2, 20), M.jacketSolid, M4(0, -0.3, 0));
    if (head) return;
    // 걸쇠: 앞쪽(넓은 부분 · 걸림 어깨) → 뒤쪽(좁은 손잡이), 앞 끝을 축으로 살짝 벌어짐
    var hinge = M4(0, -3.3, -1.1, -0.065);
    var pl = boxC(6.3, 0.8, 6.2); pl.translate(0, -0.4, -3.1); a(pl, M.clear, hinge);
    var nr = boxC(3.9, 0.85, 7.6); nr.translate(0, -0.42, -9.9); a(nr, M.clear, hinge);
    var gr = boxC(4.3, 1.1, 1.4); gr.translate(0, -0.6, -13.0); a(gr, M.clear, hinge);
    // 스내그리스 부트 (걸쇠 끝을 덮는 후드 포함)
    a(extZ(rrShape(12.5, 7.4, 1.4), -24, -16.2, 0.6), M.blueBoot);
    var hood = boxC(7.2, 1.0, 6.4); hood.translate(0, 0, 0); a(hood, M.blueBoot, M4(0, -5.75, -15.4, 0.12));
    a(boxC(7.2, 2.4, 3.0), M.blueBoot, M4(0, -4.9, -17.6));
    a(lathe(ribbed(3.25, 4.7, -36, -23.6, 5, 0.3, 1.6), 32), M.blueBoot);
  }

  // etherCON NE8MC — 크롬 쉘 · 앞 인서트 창 안의 RJ45 · 위쪽 잠금 래치 · 척 · 부트
  function buildEtherCON(c) {
    var M = c.M, a = c.add;
    a(lathe([[9.7, -31], [10.2, -30.6], [10.4, -29.6], [10.4, -4.2], [10.3, -1.3], [10.02, -0.3], [9.6, 0], [9.08, 0], [9.0, -0.35], [9.0, -6.5]], 60), M.chrome);
    var ins = circleShape(9.02); ins.holes.push(rrHole(12.3, 7.3, 0.9)); a(extZ(ins, -6.0, -2.3), M.insert);
    a(extZ(rrShape(12.3, 7.3, 0.9), -7.2, -6.0), M.hole);   // 창 안쪽 바닥(어두움)
    buildRJ45(c.sub(M4(0, 0, -1.7)), true);
    // 앞 테두리 키 홈 (위)
    a(boxC(3.2, 1.0, 2.2), M.hole, M4(0, 9.55, -1.0));
    // 래치: 쉘 위 홈 + 강철 레버(앞 걸림니 · 누르는 자리 홈 4줄)
    a(boxC(5.8, 0.5, 16.5), M.hole, M4(0, 10.25, -13.2));
    a(extZ(rrShape(4.8, 1.6, 0.5), -21.2, -5.6, 0.25), M.steel, M4(0, 11.15, 0));
    for (var i = 0; i < 4; i++) a(boxC(4.4, 0.35, 0.55), M.darkSteel, M4(0, 12.0, -15.8 - i * 1.2));
    a(boxC(3.2, 1.6, 1.4), M.steel, M4(0, 9.7, -5.4));
    // 고리 · 척(홈 12개) · 부트
    a(lathe([[9.3, -32.2], [9.9, -32], [9.9, -31], [9.3, -30.8]], 48), M.chrome);
    a(extZ(starShape(9.75, 9.35, 12), -38.8, -32.2, 0.3), M.chuck);
    a(lathe(ribbed(3.75, 9.0, -67.5, -38.6, 6, 0.32, 1.9), 40), M.rubber);
  }

  // AES/EBU XLR 수 — NC3MXX 비례 + 보라 코딩 링
  function buildXLRMale(c) {
    var M = c.M, a = c.add;
    a(lathe([[9.1, -26.6], [9.5, -26.1], [9.5, -0.6], [9.32, -0.08], [9.0, 0], [8.42, 0], [8.3, -0.35], [8.3, -11.2]], 56), M.nickel);
    var face = new THREE.CircleGeometry(8.32, 48); a(face, M.xlrFace, M4(0, 0, -11));
    [[-4.04, 0], [4.04, 0], [0, -3.95]].forEach(function (p) { a(lathe([[0.8, -11], [0.8, -3.6], [0.56, -3.12], [0, -2.98]], 14), M.nickel, M4(p[0], p[1], 0)); });
    a(boxC(3.0, 0.9, 11.25), M.hole, M4(0, 8.62, -5.6));    // 슬리브 안쪽 위 키 홈
    a(boxC(4.0, 0.36, 3.0), M.hole, M4(0, 9.38, -3.9));     // 위쪽 래치 걸림 창
    var rib = [[9.0, -36], [9.5, -35.8]]; for (var i = 0; i < 6; i++) { var z = -35.4 + i * 1.5; rib.push([9.5, z], [9.15, z + 0.35], [9.15, z + 0.85], [9.5, z + 1.15]); } rib.push([9.5, -26.6]);
    a(lathe(rib, 56), M.nickel);
    a(extZ(starShape(10.0, 9.6, 12), -42.4, -35.9, 0.3), M.chuck);
    a(lathe([[9.0, -45.4], [9.55, -45.2], [9.55, -43.0], [9.0, -42.8]], 48), M.violet);   // 코딩 링
    a(lathe(ribbed(3.65, 9.0, -70, -45.2, 6, 0.3, 1.9), 40), M.rubber);
  }

  // BNC 75 Ω 수 — 결합 너트(J 베이어닛 홈 2개 · 널링) · 스프링 외부 접점 · PTFE · 금 중심 핀 · 크림프 · 부트
  function buildBNC(c) {
    var M = c.M, a = c.add, rO = 6.2, rI = 4.95, w = 1.6 / rO, ext = 1.1;
    // 원통 조각(θ: 원통 기준 — 0 = -Y, π/2 = +X)
    function sector(z0, z1, a0, a1) {
      var h = z1 - z0, len = a1 - a0, seg = Math.max(3, Math.round(len / 0.12));
      var go = new THREE.CylinderGeometry(rO, rO, h, seg, 1, true, a0, len); go.rotateX(Math.PI / 2); go.translate(0, 0, (z0 + z1) / 2); a(go, M.nickel);
      var gi = new THREE.CylinderGeometry(rI, rI, h, seg, 1, true, a0, len); gi.rotateX(Math.PI / 2); gi.translate(0, 0, (z0 + z1) / 2); a(gi, M.nickel);
      [z0, z1].forEach(function (z) { var rg = new THREE.RingGeometry(rI, rO, seg, 1, a0 - Math.PI / 2, len); rg.translate(0, 0, z); a(rg, M.nickel); });
      [a0, a1].forEach(function (t) { var p = new THREE.PlaneGeometry(rO - rI, h); p.rotateX(Math.PI / 2); p.rotateZ(t - Math.PI / 2); var rm = (rO + rI) / 2; p.translate(rm * Math.sin(t), -rm * Math.cos(t), (z0 + z1) / 2); a(p, M.nickel); });
    }
    function band(z0, z1, gaps) {   // gaps: [[a0,a1],…] 을 뺀 나머지를 조각으로
      gaps = gaps.slice().sort(function (p, q) { return p[0] - q[0]; });
      for (var i = 0; i < gaps.length; i++) { var s = gaps[i][1], e = (i + 1 < gaps.length ? gaps[i + 1][0] : gaps[0][0] + Math.PI * 2); if (e - s > 0.01) sector(z0, z1, s, e); }
    }
    var A = [Math.PI / 2, Math.PI * 1.5];
    function g(f) { return A.map(f); }
    band(-1.7, 0, g(function (t) { return [t - w / 2, t + w / 2]; }));
    band(-2.3, -1.7, g(function (t) { return [t - w / 2, t + w / 2]; }).concat(g(function (t) { return [t + ext - w / 2, t + ext + w / 2]; })));
    band(-3.9, -2.3, g(function (t) { return [t - w / 2, t + ext + w / 2]; }));
    a(lathe([[rI, -6.2], [rO, -6.2], [rO, -3.9], [rI, -3.9]], 48), M.nickel);
    a(extZ(starShape(7.1, 6.75, 26, rI), -12.4, -6.2, 0.2), M.nickel);   // 널링 그립
    a(new THREE.RingGeometry(4.15, rI, 40), M.darkSteel, M4(0, 0, -6.15));
    // 스프링 외부 접점(홈 6개) · PTFE · 중심 핀
    a(lathe([[3.75, -8], [4.12, -7.8], [4.12, -2.0], [4.28, -1.3], [4.05, -0.75], [3.7, -0.75], [3.7, -6]], 48), M.nickel);
    for (var k = 0; k < 6; k++) { var t = k / 6 * Math.PI * 2; a(boxC(0.38, 0.2, 4.0), M.hole, M4(4.2 * Math.cos(t), 4.2 * Math.sin(t), -2.6, 0, 0, t + Math.PI / 2)); }
    a(new THREE.RingGeometry(0.68, 3.72, 40), M.ptfe, M4(0, 0, -5.2));
    a(new THREE.CircleGeometry(3.7, 32), M.hole, M4(0, 0, -6.0));
    a(lathe([[0.68, -5.3], [0.68, -2.1], [0.48, -1.35], [0.12, -1.15], [0, -1.15]], 16), M.gold);
    // 몸체 · 크림프 슬리브(육각) · 부트
    a(lathe([[3.9, -17.2], [5.2, -17], [5.2, -12.6], [5.6, -12.4]], 40), M.nickel);
    var hx = new THREE.CylinderGeometry(3.75, 3.75, 7.4, 6); hx.rotateX(Math.PI / 2); hx.translate(0, 0, -20.6); a(hx, M.nickel);
    a(lathe(ribbed(3.35, 4.5, -42, -22.4, 5, 0.25, 1.4), 36), M.rubber);
  }

  // TOSLINK (JIS F05) — 깎인 사각 머리 · 페룰 · 빛나는 광섬유 끝 · 그립 몸통
  function buildTOSLINK(c) {
    var M = c.M, a = c.add;
    a(lathe([[1.25, -2.4], [1.25, -0.3], [1.0, 0], [0.55, 0]], 28), M.black);
    a(new THREE.RingGeometry(0.5, 0.6, 24), M.fiberRing, M4(0, 0, 0.005));
    a(new THREE.CircleGeometry(0.5, 24), M.fiber, M4(0, 0, 0.01));
    a(extZ(chamfPath(new THREE.Shape(), 6.8, 5.8, 1.25, 0, true), -9.2, -2.0, 0.3), M.black);
    a(extZ(rrShape(8.2, 7.2, 1.0), -10.4, -9.0, 0.2), M.nickel);
    a(extZ(rrShape(9.6, 8.4, 1.9), -27, -10.2, 0.8), M.black);
    for (var i = 0; i < 5; i++) [-1, 1].forEach(function (s) { a(boxC(0.35, 5.0, 0.9), M.chuck, M4(s * 4.85, 0, -14 - i * 2.2)); });
    a(lathe(ribbed(2.75, 3.6, -36, -26.6, 4, 0.22, 1.3), 32), M.black);
  }

  // USB-C — 둥근 사각 금속 쉘 8.25 × 2.4 · 안쪽 슬롯 위아래 접점 12 + 12 · 옆 잠금 스프링 · 오버몰드
  function buildUSBC(c) {
    var M = c.M, a = c.add, i;
    var sh = rrShape(8.25, 2.4, 1.199); sh.holes.push(rrHole(7.81, 1.96, 0.979)); a(extZ(sh, -6.75, 0, 0.08), M.nickel);
    var ins = rrShape(7.79, 1.94, 0.969); ins.holes.push(rrHole(6.69, 0.72, 0.3)); a(extZ(ins, -6.7, -0.45), M.insert);
    a(boxC(6.69, 0.72, 0.1), M.hole, M4(0, 0, -6.0));
    for (i = 0; i < 12; i++) { var x = (i - 5.5) * 0.5; a(boxC(0.25, 0.1, 3.6), M.gold, M4(x, 0.31, -3.0)); a(boxC(0.25, 0.1, 3.6), M.gold, M4(x, -0.31, -3.0)); }
    [-1, 1].forEach(function (s) { a(boxC(0.3, 0.5, 3.0), M.nickel, M4(s * 3.2, 0, -2.6)); });
    a(extZ(rrShape(11.4, 5.6, 2.3), -21, -6.6, 0.9), M.overmold);
    a(boxC(5.0, 0.12, 0.4), M.chuck, M4(0, 2.81, -18.5));   // 위쪽 표시 홈(양면 대칭이라 장식만)
    a(lathe(ribbed(2.15, 3.0, -28.5, -20.6, 4, 0.18, 1.3), 32), M.overmold);
  }

  // USB-A — 12 × 4.5 금속 쉘 · 흰 플라스틱 혀 · 접점 4개(전원 1·4 가 더 앞) · 잠금 창 · 오버몰드
  function buildUSBA(c) {
    var M = c.M, a = c.add;
    var sh = rrShape(12.0, 4.5, 0.45); sh.holes.push(rrHole(11.4, 3.9, 0.2)); a(extZ(sh, -11.85, 0, 0.08), M.nickel);
    a(extZ(rrShape(11.36, 1.95, 0.15, 0, -0.975), -11.8, -0.45), M.white);
    a(boxC(11.36, 1.95, 0.1), M.white, M4(0, -0.975, -11.7));
    [3.5, 1.0, -1.0, -3.5].forEach(function (x, i) { var z0 = (i === 0 || i === 3) ? -0.9 : -1.7, z1 = -8.6; a(boxC(1.0, 0.12, z0 - z1), M.gold, M4(x, 0.03, (z0 + z1) / 2)); });
    [-1, 1].forEach(function (sy) { [-2.6, 2.6].forEach(function (x) { a(boxC(1.6, 0.06, 2.2), M.hole, M4(x, sy * 2.255, -3.7)); }); });
    a(extZ(rrShape(15.4, 7.4, 1.6), -30.5, -11.6, 1.0), M.overmold);
    for (var k = 0; k < 6; k++) [-1, 1].forEach(function (sy) { a(boxC(9.0, 0.22, 0.55), M.chuck, M4(0, sy * 3.72, -21.5 - k * 1.3)); });
    a(lathe(ribbed(2.4, 3.5, -40, -30.1, 4, 0.2, 1.3), 32), M.overmold);
  }

  // USB-B — 위 모서리 깎인 8.0 × 7.26 쉘 · 흰 인서트의 사각 구멍 · 위아래 접점 2 + 2 · 옆 딤플 · 오버몰드
  function buildUSBB(c) {
    var M = c.M, a = c.add;
    var sh = chamfPath(new THREE.Shape(), 8.0, 7.26, 1.6); sh.holes.push(chamfPath(new THREE.Path(), 7.4, 6.66, 1.35)); a(extZ(sh, -9.7, 0, 0.08), M.nickel);
    var ins = chamfPath(new THREE.Shape(), 7.38, 6.64, 1.34); ins.holes.push(rrHole(5.7, 3.3, 0.25, 0, -0.35)); a(extZ(ins, -9.6, -0.6), M.white);
    a(boxC(5.7, 3.3, 0.1), M.hole, M4(0, -0.35, -7.2));
    [-1.25, 1.25].forEach(function (x) { a(boxC(1.0, 0.12, 4.8), M.gold, M4(x, 1.24, -3.9)); a(boxC(1.0, 0.12, 4.8), M.gold, M4(x, -1.94, -3.9)); });
    var dim = new THREE.SphereGeometry(0.7, 10, 6); dim.scale(0.35, 1, 1.8);
    [-1, 1].forEach(function (s) { a(dim, M.nickel, M4(s * 4.0, -1.0, -5.2)); });
    a(extZ(rrShape(11.0, 10.0, 1.6), -28, -9.5, 1.0), M.overmold);
    for (var k = 0; k < 6; k++) [-1, 1].forEach(function (sy) { a(boxC(6.5, 0.22, 0.55), M.chuck, M4(0, sy * 5.02, -19 - k * 1.3)); });
    a(lathe(ribbed(2.4, 3.6, -37, -27.6, 4, 0.2, 1.3), 32), M.overmold);
  }

  var BUILD = { 'etherCON': buildEtherCON, 'RJ45': buildRJ45, 'AES-XLR': buildXLRMale, 'BNC': buildBNC, 'TOSLINK': buildTOSLINK, 'USB-C': buildUSBC, 'USB-A': buildUSBA, 'USB-B': buildUSBB };

  // ---- 케이블 꼬리 (곡선 튜브 + 잘린 끝 단면) ----
  function tube(B, info, pts, endKind) {
    var curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), len = curve.getLength();
    var geo = new THREE.TubeGeometry(curve, Math.max(40, Math.round(len / 3)), info.rc, 16, false);
    B.add(geo, printMaterial(info, len));
    var end = curve.getPoint(1), tg = curve.getTangent(1), cap = new THREE.CircleGeometry(info.rc, 24);
    cap.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg))); cap.translate(end.x, end.y, end.z);
    B.add(cap, endCapMaterial(endKind || info.end, info));
    return curve;
  }
  function tailPoints(x, h, ze, rc, len, side, lead) {   // 출구(x,h,ze)에서 곧게 lead 만큼 → 아래로 처지며 옆으로 휨 → 바닥에 놓임
    var P = function (dx, y, dz) { return new THREE.Vector3(x + dx, y, ze + dz); };
    lead = lead || len * 0.18;
    var drop = h - rc;
    return [P(0, h, 0), P(0, h, -lead * 0.5), P(0, h, -lead), P(side * len * 0.05, h - drop * 0.45, -lead - len * 0.2),
      P(side * len * 0.16, rc + drop * 0.08, -lead - len * 0.42), P(side * len * 0.34, rc, -lead - len * 0.62), P(side * len * 0.58, rc, -lead - len * 0.76)];
  }

  // AES 띠 + 플래그 (케이블이 곧게 뻗은 구간)
  function aesLabel(B, x, h, ze, rc) {
    var band = lathe([[rc + 0.32, ze - 22], [rc + 0.38, ze - 21.7], [rc + 0.38, ze - 6.3], [rc + 0.32, ze - 6]], 32);
    B.add(band, bandMaterial(), M4(x, h, 0));
    var flag = boxC(12.5, 0.35, 15.6); B.add(flag, flagMaterial(), M4(x + rc + 0.3 + 6.25, h, ze - 14));
  }

  function placePlug(B, M, kind, x, opts) {
    var info = INFO[kind], h = info.down, F = M4(x, h, 0);
    BUILD[kind](Ctx(B, M, F));
    if (opts.tail !== false) {
      var len = opts.tailLength || Math.max(42, info.L * (opts.set ? 0.9 : 1.05));
      var lead = kind === 'AES-XLR' ? 30 : undefined;
      tube(B, info, tailPoints(x, h, -info.L, info.rc, len, opts.side == null ? -1 : opts.side, lead));
      if (kind === 'AES-XLR') aesLabel(B, x, h, -info.L, info.rc);
    }
    return info;
  }

  function create(opts) {
    opts = opts || {};
    var variant = opts.variant || 'set';
    if (VARIANTS.indexOf(variant) < 0) throw new Error('[DigitalConnectors] 알 수 없는 variant: ' + variant + ' (가능: ' + VARIANTS.join(', ') + ')');
    var M = makeMaterials(); M.jacketSolid = M.black; M.xlrFace = xlrFaceMaterial();
    var root = new THREE.Group(); root.name = 'digitalConnectors.' + variant;
    var mm = new THREE.Group(); mm.name = 'digitalConnectors.mm'; mm.scale.setScalar(0.001); root.add(mm);
    var B = Baker(), placed = [];

    function jacketFor(kind) { var j = new THREE.MeshStandardMaterial({ color: INFO[kind].jacket, roughness: 0.55, side: THREE.DoubleSide }); j.color.convertSRGBToLinear(); return j; }

    if (variant === 'set') {
      var gap = 4, x = 0, xs = [];   // 이름표(29 mm) 가 겹치지 않을 만큼 띄우되 커넥터 크기는 실제 비율 그대로
      SET_ORDER.forEach(function (k, i) { var hw = Math.max(INFO[k].halfW, 15.5); if (i) x += hw; xs.push(x); x += hw + gap; });
      SET_ORDER.forEach(function (k, i) {
        M.jacketSolid = jacketFor(k);
        placePlug(B, M, k, xs[i], { tail: opts.tail, tailLength: opts.tailLength || Math.max(40, INFO[k].L * 0.75), set: true, side: -0.35 });
        var tag = new THREE.PlaneGeometry(29, 11.3); tag.rotateX(-Math.PI / 2);
        B.add(tag, nameMaterial(INFO[k]), M4(xs[i], 0.15, 13));
        placed.push({ kind: k, x: xs[i] });
      });
    } else if (variant === 'USB-AB') {
      var iA = INFO['USB-A'], iB = INFO['USB-B'], xA = -24, xB = 24;
      BUILD['USB-A'](Ctx(B, M, M4(xA, iA.down, 0))); BUILD['USB-B'](Ctx(B, M, M4(xB, iB.down, 0)));
      if (opts.tail !== false) {
        var r = iA.rc, V3 = function (px, py, pz) { return new THREE.Vector3(px, py, pz); };
        tube(B, iA, [V3(xA, iA.down, -iA.L), V3(xA, iA.down, -iA.L - 7), V3(xA, iA.down, -iA.L - 14), V3(xA - 4, r + 0.8, -iA.L - 38), V3(xA - 2, r, -iA.L - 68),
          V3(xA + 14, r, -iA.L - 92), V3(0, r, -iA.L - 100), V3(xB - 12, r, -iB.L - 88), V3(xB + 3, r, -iB.L - 62), V3(xB + 3, r + 1.2, -iB.L - 34),
          V3(xB, iB.down, -iB.L - 14), V3(xB, iB.down, -iB.L - 7), V3(xB, iB.down, -iB.L)]);
      }
      placed.push({ kind: 'USB-A', x: xA }, { kind: 'USB-B', x: xB });
    } else {
      M.jacketSolid = jacketFor(variant);
      placePlug(B, M, variant, 0, { tail: opts.tail, tailLength: opts.tailLength, side: -1 });
      placed.push({ kind: variant, x: 0 });
    }
    var meshes = B.build(mm, 'digitalConnectors.' + variant);

    // 원점 = 바닥면 가운데
    root.updateMatrixWorld(true);
    var bb = new THREE.Box3().setFromObject(mm), ctr = bb.getCenter(new THREE.Vector3());
    mm.position.set(-ctr.x, -bb.min.y, -ctr.z);
    root.updateMatrixWorld(true);
    var shift = mm.position.clone().multiplyScalar(1000);
    var size = bb.getSize(new THREE.Vector3()).multiplyScalar(1000);
    root.userData.digitalConnectors = { variant: variant, meshCount: meshes.length, sizeMM: { x: +size.x.toFixed(1), y: +size.y.toFixed(1), z: +size.z.toFixed(1) },
      plugs: placed.map(function (p) { return { kind: p.kind, faceCenterMM: [+(p.x + shift.x).toFixed(2), +(INFO[p.kind].down + shift.y).toFixed(2), +shift.z.toFixed(2)] }; }),
      cameraDir: CAMERA_DIR[variant] || CAMERA_DIR.single };
    return root;
  }

  global.DigitalConnectors = { create: create, VARIANTS: VARIANTS.slice(), SET_ORDER: SET_ORDER.slice(), DIMENSIONS_MM: DIM, INFO: INFO, CAMERA_DIR: CAMERA_DIR };
})(typeof window !== 'undefined' ? window : this);
