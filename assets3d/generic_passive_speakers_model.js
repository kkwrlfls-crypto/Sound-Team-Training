/* =============================================================================
   일반 패시브 스피커 5종 — 절차적(procedural) 3D 모델  (Three.js r128 전용, 2026-11-08)
   -----------------------------------------------------------------------------
   - 05-1 「패시브 스피커」 과정용. 특정 제조사 · 모델이 아닌 「흔한 모양」을 본떠 만든 교육용 모델이에요(로고 · 모델명 없음).
   - 전역: window.GenericPassiveSpk = { create(opts) → THREE.Group, api(root) → { setXray(on), isXray() }, VARIANTS, LABELS, DIMENSIONS_MM, RECOMMENDED_DIR, RECOMMENDED_DIST }
   - variant: '12-2way'(12인치 2웨이 · 사다리꼴 통 · 혼) · '8-2way'(작은 8인치 2웨이) · '15-2way'(15인치 2웨이)
              · 'sub18'(18인치 서브우퍼 · 포트) · 'column'(가는 컬럼 스피커 · 작은 우퍼 6개 + 작은 혼 4개)
   - opts: { variant: '12-2way', xray: false }
       · xray: 그릴 · 통을 반투명하게 하고 드라이버를 색으로 보여 줌 — 우퍼(콘) = 주황, 혼 · 컴프레션 드라이버(고음) = 하늘
   - 단위: mm 로 만들고 안쪽 그룹을 0.001 배(미터). 원점 = 바닥면 가운데, +Y 위, +Z 앞(그릴), +X 오른쪽.
   - 겉모습: 검정 도장 통(옆면이 뒤로 갈수록 좁아지는 사다리꼴), 타공 금속 그릴(CanvasTexture), 뒷면 단자판에 speakON(NL4) 두 개(INPUT · LINK),
             옆 손잡이(작은 통은 윗면 손잡이), 매달기 나사 구멍(M10 모양), 바닥 스탠드 소켓(폴 소켓) · 고무발, 서브 윗면 폴 소켓
   - 치수는 흔한 제품 크기를 어림한 값(예: 12인치 2웨이 ≈ 380 × 620 × 360 mm) — 특정 제품 치수가 아님
   ============================================================================= */
(function (global) {
  'use strict';
  var THREE = global.THREE;
  if (!THREE) { console.error('[GenericPassiveSpk] THREE 가 먼저 로드되어야 합니다.'); return; }

  var VARIANTS = ['12-2way', '8-2way', '15-2way', 'sub18', 'column'];
  var LABELS = { '12-2way': '12인치 2웨이', '8-2way': '8인치 2웨이', '15-2way': '15인치 2웨이', 'sub18': '18인치 서브우퍼', 'column': '컬럼 스피커' };
  // W 앞 폭 · Wb 뒤 폭 · S 앞쪽 곧은 깊이(그 뒤로 좁아짐) · H 높이 · D 깊이 (mm)
  var SPEC = {
    '12-2way': { W: 380, Wb: 236, S: 70, H: 620, D: 360, woofer: { r: 140, y: 205 }, horn: { w: 262, h: 128, y: 474, d: 112, cd: 54 }, handles: 'side', top: 'rig', pole: true, rearY: 150 },
    '8-2way': { W: 262, Wb: 170, S: 46, H: 420, D: 250, woofer: { r: 92, y: 142 }, horn: { w: 172, h: 86, y: 318, d: 70, cd: 38 }, handles: 'top', top: 'handle', pole: true, rearY: 110 },
    '15-2way': { W: 452, Wb: 288, S: 84, H: 720, D: 430, woofer: { r: 176, y: 236 }, horn: { w: 304, h: 150, y: 552, d: 132, cd: 60 }, handles: 'side', top: 'rig', pole: true, rearY: 170 },
    'sub18': { W: 560, Wb: 560, S: 720, H: 650, D: 720, woofer: { r: 212, y: 372 }, port: { y0: 42, y1: 112 }, handles: 'side2', top: 'pole', pole: false, rearY: 200 },
    'column': { W: 120, Wb: 98, S: 22, H: 1000, D: 132, small: { n: 6, r: 42, y0: 110, dy: 108 }, tw: { n: 4, w: 82, h: 40, y0: 772, dy: 56, d: 34, cd: 20 }, handles: 'none', top: 'none', pole: false, rearY: 120, bracket: true }
  };
  var DIM = {}; VARIANTS.forEach(function (v) { var s = SPEC[v]; DIM[v] = { width: s.W, height: s.H, depth: s.D }; });
  // 사이트 뷰어(modules.js): 가운데에서 dir 방향으로 bbox 대각선 × dist 만큼 떨어진 곳에 카메라 (스크린샷으로 맞춘 값)
  var RECOMMENDED_DIR = { '12-2way': [0.55, 0.3, 1], '8-2way': [0.55, 0.32, 1], '15-2way': [0.55, 0.3, 1], 'sub18': [0.7, 0.5, 1], 'column': [0.5, 0.22, 1] };
  var RECOMMENDED_DIST = { '12-2way': 1.75, '8-2way': 1.75, '15-2way': 1.75, 'sub18': 1.8, 'column': 2.2 };

  // ---------------------------------------------------------------- 텍스처
  var TEX = {};
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, srgb) { var t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
  var FONT = '"Noto Sans KR","Pretendard","Apple SD Gothic Neo","Malgun Gothic",Arial,sans-serif';
  function grilleTex() {   // 타공 그릴: 한 칸(128 px) = 가로 피치 1개 · 엇갈린 구멍 2개
    if (TEX.grille) return TEX.grille;
    var c = canvas(128, 128), g = c.getContext('2d');
    g.fillStyle = '#b4b8be'; g.fillRect(0, 0, 128, 128);
    [[32, 32], [96, 96]].forEach(function (p) { [[0, 0], [128, 0], [0, 128], [-128, 0], [0, -128]].forEach(function (o) {
      var gr = g.createRadialGradient(p[0] + o[0], p[1] + o[1], 0, p[0] + o[0], p[1] + o[1], 24); gr.addColorStop(0, '#3a3c40'); gr.addColorStop(0.8, '#45474b'); gr.addColorStop(1, '#6a6d72');
      g.fillStyle = gr; g.beginPath(); g.arc(p[0] + o[0], p[1] + o[1], 24, 0, Math.PI * 2); g.fill(); }); });
    var t = tex(c, true); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    var b = canvas(128, 128); b.getContext('2d').drawImage(c, 0, 0); var bt = tex(b, false); bt.wrapS = bt.wrapT = THREE.RepeatWrapping;
    return (TEX.grille = { map: t, bump: bt });
  }
  function grainTex() {   // 거친 도장 결(아주 약하게)
    if (TEX.grain) return TEX.grain;
    var c = canvas(64, 64), g = c.getContext('2d'), im = g.createImageData(64, 64);
    for (var i = 0; i < im.data.length; i += 4) { var n = 200 + Math.random() * 55; im.data[i] = im.data[i + 1] = im.data[i + 2] = n; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); var t = tex(c, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 40, 1 / 40);
    return (TEX.grain = t);
  }
  function panelTex(w, h, lines) {   // 뒷면 단자판 인쇄 (mm → 캔버스 8 px/mm)
    var s = 8, c = canvas(Math.round(w * s), Math.round(h * s)), g = c.getContext('2d');
    g.fillStyle = '#d6dbe2'; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(function (l) { g.font = (l[4] || '700') + ' ' + l[3] * s + 'px ' + FONT; g.fillText(l[0], l[1] * s, l[2] * s); });
    return tex(c, true);
  }

  // ---------------------------------------------------------------- 재질
  function mats() {
    var S = THREE.MeshStandardMaterial;
    var m = {
      body: new S({ color: 0x202226, roughness: 0.9, metalness: 0.0, roughnessMap: grainTex() }),
      panel: new S({ color: 0x2a2d32, roughness: 0.5, metalness: 0.5 }),
      steel: new S({ color: 0x8b9097, roughness: 0.35, metalness: 0.85 }),
      dark: new S({ color: 0x0b0c0e, roughness: 0.9 }),
      rubber: new S({ color: 0x0d0d0e, roughness: 0.95 }),
      nlBlack: new S({ color: 0x15161a, roughness: 0.45, metalness: 0.3 }),
      nlGrey: new S({ color: 0x6b7078, roughness: 0.55, metalness: 0.1 }),
      // 드라이버 — 평소(검정) · 속 보기(색)
      cone: new S({ color: 0x1c1d20, roughness: 0.8, side: THREE.DoubleSide }),
      coneX: new S({ color: 0xf97316, roughness: 0.55, emissive: 0xf97316, emissiveIntensity: 0.35, side: THREE.DoubleSide }),
      rim: new S({ color: 0x26272b, roughness: 0.7 }),
      rimX: new S({ color: 0xfb923c, roughness: 0.5, emissive: 0xfb923c, emissiveIntensity: 0.5 }),
      magnet: new S({ color: 0x3b3e44, roughness: 0.45, metalness: 0.8 }),
      magnetX: new S({ color: 0xfdba74, roughness: 0.4, metalness: 0.5, emissive: 0xea580c, emissiveIntensity: 0.3 }),
      horn: new S({ color: 0x1e2024, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide }),
      hornX: new S({ color: 0x38bdf8, roughness: 0.45, metalness: 0.2, emissive: 0x0ea5e9, emissiveIntensity: 0.4, side: THREE.DoubleSide }),
      cdrv: new S({ color: 0x3a3d43, roughness: 0.4, metalness: 0.8 }),
      cdrvX: new S({ color: 0x7dd3fc, roughness: 0.35, metalness: 0.5, emissive: 0x0284c7, emissiveIntensity: 0.45 })
    };
    var gt = grilleTex();
    m.grille = new S({ color: 0x3a3e45, map: gt.map, bumpMap: gt.bump, bumpScale: 0.3, roughness: 0.5, metalness: 0.5 });
    Object.keys(m).forEach(function (k) { var x = m[k]; if (x && x.isMaterial) { x.color.convertSRGBToLinear(); if (x.emissive) x.emissive.convertSRGBToLinear(); } });
    return m;
  }

  // ---------------------------------------------------------------- 도우미
  function add(parent, geo, mat, x, y, z, name) { var me = new THREE.Mesh(geo, mat); me.position.set(x || 0, y || 0, z || 0); if (name) me.name = name; parent.add(me); return me; }
  function cylZ(r1, r2, len, seg) { var g = new THREE.CylinderGeometry(r1, r2, len, seg || 32); g.rotateX(Math.PI / 2); return g; }   // 축 = Z

  // 통: 위에서 본 사다리꼴(앞 폭 W, 뒤 폭 Wb)을 높이로 밀어 만든 몸통 + 모서리 둥글게(bevel 3 mm)
  function cabinetGeo(s) {
    var b = 3, W = s.W / 2 - b, Wb = s.Wb / 2 - b, D = s.D / 2 - b, zS = s.D / 2 - s.S;   // zS: 좁아지기 시작하는 z
    var sh = new THREE.Shape();
    sh.moveTo(-W, -D); sh.lineTo(W, -D);
    if (s.S < s.D) { sh.lineTo(W, -zS); sh.lineTo(Wb, D); sh.lineTo(-Wb, D); sh.lineTo(-W, -zS); }
    else { sh.lineTo(W, D); sh.lineTo(-W, D); }
    sh.closePath();
    var g = new THREE.ExtrudeGeometry(sh, { depth: s.H - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, steps: 1, curveSegments: 4 });
    g.rotateX(-Math.PI / 2); g.translate(0, b, 0);   // 모양의 y(−앞) → z, 밀어낸 방향 → 위(+Y)
    return g;
  }
  // 옆면(오른쪽)의 가운데 점과 바깥 법선 — 사다리꼴이면 좁아지는 면, 상자면 옆면
  function sideFace(s, zFrac) {
    var zS = s.D / 2 - s.S, zB = -s.D / 2;
    if (s.S >= s.D) { var z = s.D / 2 - s.D * zFrac; return { x: s.W / 2, z: z, nx: 1, nz: 0 }; }
    var vx = (s.Wb - s.W) / 2, vz = zB - zS, L = Math.hypot(vx, vz), t = zFrac;
    return { x: s.W / 2 + vx * t, z: zS + vz * t, nx: -vz / L, nz: vx / L };
  }

  // 우퍼(콘 드라이버) — 앞 배플 면(zf)에 붙임. r = 콘 바깥 반지름
  function woofer(g, m, P, r, x, y, zf) {
    var grp = new THREE.Group(); grp.position.set(x, y, zf); g.add(grp);
    var depth = r * 0.42, rin = r * 0.3, pts = [];
    for (var i = 0; i <= 8; i++) { var u = i / 8, rr = rin + (r - rin) * u; pts.push(new THREE.Vector2(rr, -depth * (1 - Math.pow(u, 0.8)))); }
    var cone = new THREE.LatheGeometry(pts, 48); cone.rotateX(Math.PI / 2);
    var z0 = -r * 0.05 - 2;   // 콘 바깥 테두리 — 앞면(그릴)보다 조금 안쪽
    var c = add(grp, cone, m.cone, 0, 0, z0); P.cone.push(c);
    var sur = new THREE.TorusGeometry(r + r * 0.05, r * 0.05, 8, 48); var s2 = add(grp, sur, m.rim, 0, 0, z0); P.rim.push(s2);
    var fr = new THREE.TorusGeometry(r * 1.11, r * 0.03, 6, 48); var f2 = add(grp, fr, m.rim, 0, 0, -r * 0.03 - 2); P.rim.push(f2);
    var cap = new THREE.SphereGeometry(rin, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); cap.rotateX(Math.PI / 2); cap.scale(1, 1, 0.45);
    var cp = add(grp, cap, m.cone, 0, 0, z0 - depth); P.cone.push(cp);
    var mag = add(grp, cylZ(r * 0.46, r * 0.46, r * 0.28, 32), m.magnet, 0, 0, z0 - depth - r * 0.2); P.mag.push(mag);
    return grp;
  }
  // 혼 + 컴프레션 드라이버 — 입구(w × h)는 배플 면, 목은 뒤로 d 만큼
  function hornUnit(g, m, P, w, h, y, zf, d, cdr) {
    var grp = new THREE.Group(); grp.position.set(0, y, zf); g.add(grp);
    var mouth = h / 2 * Math.SQRT2, throat = Math.max(10, cdr * 0.4) * Math.SQRT2;
    var hg = new THREE.CylinderGeometry(throat, mouth, d, 4, 1, true); hg.rotateY(Math.PI / 4); hg.rotateX(-Math.PI / 2); hg.scale(w / h, 1, 1); hg.translate(0, 0, -d / 2);
    var hm = add(grp, hg, m.horn, 0, 0, -0.5); P.horn.push(hm);
    // 혼 테두리(플랜지)
    var fl = new THREE.Shape(); fl.moveTo(-w / 2 - 10, -h / 2 - 10); fl.lineTo(w / 2 + 10, -h / 2 - 10); fl.lineTo(w / 2 + 10, h / 2 + 10); fl.lineTo(-w / 2 - 10, h / 2 + 10); fl.closePath();
    var hole = new THREE.Path(); hole.moveTo(-w / 2, -h / 2); hole.lineTo(-w / 2, h / 2); hole.lineTo(w / 2, h / 2); hole.lineTo(w / 2, -h / 2); hole.closePath(); fl.holes.push(hole);
    var fg = new THREE.ExtrudeGeometry(fl, { depth: 4, bevelEnabled: false }); fg.translate(0, 0, -4.5);
    var fm = add(grp, fg, m.horn, 0, 0, 0); P.horn.push(fm);
    // 컴프레션 드라이버(목 뒤)
    var cd = add(grp, cylZ(cdr, cdr, cdr * 0.9, 32), m.cdrv, 0, 0, -d - cdr * 0.45); P.cdrv.push(cd);
    var cd2 = add(grp, cylZ(cdr * 0.45, cdr * 0.45, 14, 24), m.cdrv, 0, 0, -d + 4); P.cdrv.push(cd2);
    return grp;
  }
  // speakON(NL4) 소켓 — 뒷면(−Z 를 바라봄)
  function nl4(g, m, x, y, zb) {
    add(g, new THREE.BoxGeometry(26, 31, 3), m.nlBlack, x, y, zb - 1.5);
    add(g, cylZ(12.5, 12.5, 5, 32), m.nlBlack, x, y, zb - 4.5);
    add(g, cylZ(9, 9, 5.4, 32), m.dark, x, y, zb - 4.6);
    add(g, cylZ(4, 4, 6, 16), m.nlGrey, x, y, zb - 4.8);
    add(g, new THREE.BoxGeometry(4, 4, 5.6), m.nlGrey, x, y + 10.5, zb - 4.6);   // 열쇠 홈 자리
    [[-9, 12], [9, 12], [-9, -12], [9, -12]].forEach(function (p) { add(g, cylZ(1.4, 1.4, 1, 8), m.steel, x + p[0], y + p[1], zb - 3.2); });
  }
  // 매달기 나사 구멍(M10 모양) — 면 법선 방향 n
  function insert(g, m, x, y, z, n) {
    var a = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 2, 20), m.steel), b = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 2.4, 16), m.dark);
    var q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(n[0], n[1], n[2]));
    [a, b].forEach(function (me) { me.quaternion.copy(q); me.position.set(x, y, z); g.add(me); });
  }
  // 옆 손잡이(움푹한 컵 + 손잡이 막대) — 면 위 한 점(x, y, z), 바깥 법선(nx, nz)
  function sideHandle(g, m, x, y, z, nx, nz, len) {
    var grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = Math.atan2(-nz, nx); g.add(grp);
    add(grp, new THREE.BoxGeometry(3, 64, len + 24), m.dark, 1.5, 0, 0);
    var bar = new THREE.CylinderGeometry(9, 9, len, 16); bar.rotateX(Math.PI / 2); add(grp, bar, m.rubber, 8, 0, 0);
    [-1, 1].forEach(function (k) { add(grp, new THREE.BoxGeometry(10, 20, 8), m.rubber, 6, 0, k * (len / 2 + 2)); });
  }

  // ---------------------------------------------------------------- 만들기
  function create(opts) {
    opts = opts || {}; var v = SPEC[opts.variant] ? opts.variant : '12-2way', s = SPEC[v], m = mats();
    var root = new THREE.Group(); root.name = 'GenericPassiveSpk.' + v;
    var g = new THREE.Group(); g.scale.setScalar(0.001); root.add(g);
    var P = { cone: [], rim: [], mag: [], horn: [], cdrv: [], grille: [], body: [] };
    var zf = s.D / 2, zb = -s.D / 2;

    // 몸통
    P.body.push(add(g, cabinetGeo(s), m.body, 0, 0, 0, 'cabinet'));
    var mg = v === 'column' ? 8 : 12;   // 그릴 둘레 여백

    // 드라이버
    if (s.woofer) woofer(g, m, P, s.woofer.r, 0, s.woofer.y, zf);
    if (s.horn) hornUnit(g, m, P, s.horn.w, s.horn.h, s.horn.y, zf, s.horn.d, s.horn.cd);
    if (s.small) for (var i = 0; i < s.small.n; i++) woofer(g, m, P, s.small.r, 0, s.small.y0 + i * s.small.dy, zf);
    if (s.tw) for (var j = 0; j < s.tw.n; j++) hornUnit(g, m, P, s.tw.w, s.tw.h, s.tw.y0 + j * s.tw.dy, zf, s.tw.d, s.tw.cd);
    if (s.port) {   // 서브 아래쪽 포트(가로로 긴 구멍)
      var pw = s.W - 90, ph = s.port.y1 - s.port.y0;
      add(g, new THREE.BoxGeometry(pw, ph, 4), m.dark, 0, (s.port.y0 + s.port.y1) / 2, zf - 4);
      add(g, new THREE.BoxGeometry(pw, 4, s.D * 0.55), m.dark, 0, s.port.y1 + 2, zf - 4 - s.D * 0.275).visible = true;
    }

    // 그릴(타공 금속) — 앞면을 덮음
    var gw = s.W - 2 * mg, gh = s.H - 2 * mg, gg = new THREE.PlaneGeometry(gw, gh), pitch = v === 'column' ? 5 : 7;
    var gm = m.grille.clone(); gm.map = m.grille.map.clone(); gm.bumpMap = m.grille.bumpMap.clone(); gm.map.needsUpdate = gm.bumpMap.needsUpdate = true;
    gm.map.repeat.set(gw / pitch, gh / (pitch * 1)); gm.bumpMap.repeat.copy(gm.map.repeat);
    var gr = add(g, gg, gm, 0, s.H / 2, zf + 1.2, 'grille'); P.grille.push(gr);
    // 그릴 테두리(살짝 도드라진 틀)
    [[0, mg / 2, gw + 2 * mg - 6, mg - 2], [0, s.H - mg / 2, gw + 2 * mg - 6, mg - 2]].forEach(function (r) { add(g, new THREE.BoxGeometry(r[2], r[3], 2), m.body, r[0], r[1], zf + 0.6); });

    // 뒷면 단자판 + speakON 두 개
    var pw2 = v === 'column' ? 84 : 150, ph2 = v === 'column' ? 120 : 92, py = s.rearY;
    add(g, new THREE.BoxGeometry(pw2, ph2, 4), m.panel, 0, py, zb - 2);
    var lab = new THREE.Mesh(new THREE.PlaneGeometry(pw2, ph2), new THREE.MeshBasicMaterial({ map: v === 'column'
      ? panelTex(pw2, ph2, [['INPUT', 42, 10, 6.5], ['LINK', 42, 66, 6.5], ['1+ / 1−  ·  8 Ω', 42, 112, 6, '600']])
      : panelTex(pw2, ph2, [['INPUT', 45, 12, 7], ['LINK', 105, 12, 7], ['PASSIVE  ·  8 Ω  ·  1+ / 1−', 75, 82, 6.2, '600']]), transparent: true }));
    lab.rotation.y = Math.PI; lab.position.set(0, py, zb - 4.2); g.add(lab);
    if (v === 'column') { nl4(g, m, 0, py + 22, zb - 4); nl4(g, m, 0, py - 30, zb - 4); }
    else { nl4(g, m, 30, py - 2, zb - 4); nl4(g, m, -30, py - 2, zb - 4); }   // 뒤에서 볼 때 왼쪽 = INPUT

    // 손잡이
    if (s.handles === 'side' || s.handles === 'side2') {
      var fr = s.handles === 'side2' ? [0.22, 0.72] : [0.45], hy = s.handles === 'side2' ? s.H * 0.68 : s.H * 0.66;
      fr.forEach(function (t) { var f = sideFace(s, t); [1, -1].forEach(function (k) { sideHandle(g, m, k * f.x, hy, f.z, k * f.nx, f.nz, s.handles === 'side2' ? 120 : 104); }); });
    }
    if (s.handles === 'top') {   // 윗면 손잡이(작은 통)
      add(g, new THREE.BoxGeometry(150, 3, 56), m.dark, 0, s.H + 1.5, -s.D * 0.05);
      var tb = new THREE.CylinderGeometry(9, 9, 128, 16); tb.rotateZ(Math.PI / 2); add(g, tb, m.rubber, 0, s.H + 12, -s.D * 0.05);
      [-1, 1].forEach(function (k) { add(g, new THREE.BoxGeometry(10, 14, 22), m.rubber, k * 66, s.H + 6, -s.D * 0.05); });
    }
    // 매달기 나사 구멍 · 스탠드 소켓 · 발
    if (s.top === 'rig' || s.top === 'handle') {
      [s.D * 0.28, -s.D * 0.3].forEach(function (z) { if (s.top === 'handle' && Math.abs(z + s.D * 0.05) < 60) return; insert(g, m, 0, s.H + 0.6, z, [0, 1, 0]); insert(g, m, 0, -0.6, z, [0, -1, 0]); });
      [s.H * 0.82, s.H * 0.18].forEach(function (y) { insert(g, m, 0, y, zb - 0.6, [0, 0, -1]); });
    }
    if (s.pole) {   // 바닥 스탠드 소켓(지름 36 mm 폴)
      add(g, new THREE.CylinderGeometry(30, 30, 3, 32), m.steel, 0, -1.5, -s.D * 0.02);
      add(g, new THREE.CylinderGeometry(18.5, 18.5, 3.4, 32), m.dark, 0, -1.6, -s.D * 0.02);
    }
    if (s.top === 'pole') {   // 서브 윗면 폴 소켓
      add(g, new THREE.CylinderGeometry(34, 34, 3, 32), m.steel, 0, s.H + 1.5, -40);
      add(g, new THREE.CylinderGeometry(19, 19, 3.4, 32), m.dark, 0, s.H + 1.6, -40);
    }
    if (v !== 'column') {   // 고무발
      var fx = s.Wb / 2 - 40, fz = s.D / 2 - 40;
      [[fx, fz], [-fx, fz], [fx, -fz + 10], [-fx, -fz + 10]].forEach(function (p) { add(g, new THREE.CylinderGeometry(16, 18, 6, 16), m.rubber, p[0] * (p[1] > 0 ? (s.W / s.Wb) : 1) * 0.92, -3, p[1]); });
    }
    if (s.bracket) {   // 컬럼 뒷면 벽 브래킷 판 + 매달기 구멍
      add(g, new THREE.BoxGeometry(70, 160, 5), m.panel, 0, s.H * 0.72, zb - 2.5);
      [s.H * 0.72 + 50, s.H * 0.72 - 50].forEach(function (y) { insert(g, m, 0, y, zb - 5.4, [0, 0, -1]); });
    }

    root.userData.gps = { variant: v, parts: P, mats: m, xray: false, label: LABELS[v] };
    api(root).setXray(!!opts.xray);
    return root;
  }

  function api(root) {
    var u = root && root.userData && root.userData.gps;
    return {
      setXray: function (on) {
        if (!u) return; on = !!on; u.xray = on; var P = u.parts, m = u.mats;
        P.cone.forEach(function (x) { x.material = on ? m.coneX : m.cone; });
        P.rim.forEach(function (x) { x.material = on ? m.rimX : m.rim; });
        P.mag.forEach(function (x) { x.material = on ? m.magnetX : m.magnet; });
        P.horn.forEach(function (x) { x.material = on ? m.hornX : m.horn; });
        P.cdrv.forEach(function (x) { x.material = on ? m.cdrvX : m.cdrv; });
        P.grille.forEach(function (x) { var mt = x.material; mt.transparent = on; mt.opacity = on ? 0.16 : 1; mt.depthWrite = !on; mt.needsUpdate = true; x.renderOrder = on ? 3 : 0; });
        P.body.forEach(function (x) { var mt = x.material; mt.transparent = on; mt.opacity = on ? 0.3 : 1; mt.depthWrite = !on; mt.needsUpdate = true; x.renderOrder = on ? 2 : 0; });
      },
      isXray: function () { return !!(u && u.xray); }
    };
  }

  global.GenericPassiveSpk = { create: create, api: api, VARIANTS: VARIANTS.slice(), LABELS: LABELS, DIMENSIONS_MM: DIM, RECOMMENDED_DIR: RECOMMENDED_DIR, RECOMMENDED_DIST: RECOMMENDED_DIST };
})(typeof window !== 'undefined' ? window : this);
