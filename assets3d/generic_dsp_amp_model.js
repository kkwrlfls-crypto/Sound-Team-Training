/* =============================================================================
   일반적인 2U · 19인치 · 4채널 디지털(Class D · DSP 내장) 파워앰프 — 절차적(procedural) 3D 모델
   (Three.js r128 전역 빌드 전용, 2026-11-08 · 04-2 디지털 앰프 과정용)
   -----------------------------------------------------------------------------
   - 전역: window.GenericDspAmp = { create({ variant: 'screen' | 'led', power: true }) → THREE.Group,
                                     api(root) → { setPower(on), isOn(), setLed(id, on), leds, variant, counts() },
                                     VARIANTS, VIEW_DIR, DIMENSIONS_MM }
   - 특정 제조사 · 모델을 본뜨지 않은 「흔한 모양」의 교육용 앰프예요. 로고 · 상표 · 실제 모델명은 없고,
     패널 글자는 기능 이름(INPUT · LINK · OUTPUT · NETWORK · POWER · CH1–CH4 등)만 써요.
   - 단위: 안에서는 mm 로 만들고 루트 아래 그룹을 0.001 배(미터)로 줄여요.
     원점 = 바닥면 가운데, +Y 위, +Z 앞면, +X 앞에서 볼 때 오른쪽.
   - 치수(일반적인 값): 전면판 483 × 88.1 mm(19인치 · 2U), 몸체 폭 430 · 높이 86, 전체 깊이 400,
     랙 구멍 가로 간격 465.1 · 세로 76.2 (EIA-310 랙 규격의 흔한 값)
   - 앞면 variant
       'screen' : 작은 컬러 화면 + 메뉴 다이얼 + 버튼 2개 + POWER/NET LED + 통풍구 + 손잡이
       'led'    : 전원 버튼(링 LED) + 채널별 LED(SIG · LIM · CLIP · PROT × CH1–CH4) + NET LED + 통풍구 + 손잡이
   - 뒷면(두 variant 같음, 뒤에서 볼 때 왼쪽 → 오른쪽): 전원 인렛 · 전원 스위치 → 배기 통풍구 →
       speakON(NL4) 출력 CH1–CH4 → XLR 입력 4(암, 위) · 링크 출력 4(수, 아래) → RJ45 네트워크 2
   ============================================================================= */
(function (global) {
  'use strict';
  var THREE = global.THREE;
  if (!THREE) { console.error('[GenericDspAmp] THREE 가 먼저 로드되어야 합니다.'); return; }

  var VARIANTS = ['screen', 'led'];
  var DIM = { width: 483, height: 88.1, depth: 400, bodyW: 430, bodyH: 86, panelT: 4, rackHoleX: 465.1, rackHoleY: 76.2, rackHoleY0: 5.95 };
  var HW = DIM.width / 2, BW = DIM.bodyW / 2, H = DIM.height, ZF = DIM.depth / 2, ZP = ZF - DIM.panelT, ZB = -DIM.depth / 2;

  // ---------------------------------------------------------------- 작은 도구
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c) { var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  var FONT = '"Helvetica Neue",Arial,"Noto Sans KR",sans-serif';
  function say(g, s, x, y, px, o) { o = o || {}; g.font = (o.w || '700') + ' ' + px + 'px ' + FONT; g.fillStyle = o.c || '#e7eaee'; g.textAlign = o.a || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function srgb(o) { Object.keys(o).forEach(function (k) { var m = o[k]; if (m && m.isMaterial) { m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); } }); return o; }

  function materials() {
    var St = THREE.MeshStandardMaterial;
    return srgb({
      panel: new St({ color: 0x2b2f35, roughness: 0.55, metalness: 0.45 }),
      body: new St({ color: 0x1d2024, roughness: 0.8, metalness: 0.25 }),
      ear: new St({ color: 0x25292e, roughness: 0.5, metalness: 0.5 }),
      handle: new St({ color: 0xa3a9b1, roughness: 0.3, metalness: 0.85 }),
      plastic: new St({ color: 0x131417, roughness: 0.6, metalness: 0.05 }),
      plastic2: new St({ color: 0x24272b, roughness: 0.45, metalness: 0.05 }),
      hole: new St({ color: 0x030304, roughness: 1, metalness: 0 }),
      nickel: new St({ color: 0xbfc4ca, roughness: 0.28, metalness: 0.9 }),
      screw: new St({ color: 0x5b5f66, roughness: 0.35, metalness: 0.85 }),
      knob: new St({ color: 0x1a1c1f, roughness: 0.4, metalness: 0.3 }),
      knobCap: new St({ color: 0x8d939b, roughness: 0.25, metalness: 0.9 }),
      bezel: new St({ color: 0x0a0b0c, roughness: 0.3, metalness: 0.2 }),
      window: new St({ color: 0x0c0e11, roughness: 0.25, metalness: 0.1 }),
      rocker: new St({ color: 0x18191b, roughness: 0.5, metalness: 0.05 }),
      ledOff: new St({ color: 0x34363a, roughness: 0.3, metalness: 0.1 }),
      ledG: new St({ color: 0x22c55e, emissive: 0x16c048, emissiveIntensity: 1.2, roughness: 0.3 }),
      ledY: new St({ color: 0xf5c000, emissive: 0xe0a000, emissiveIntensity: 1.1, roughness: 0.3 }),
      ledR: new St({ color: 0xef4444, emissive: 0xe02020, emissiveIntensity: 1.2, roughness: 0.3 }),
      ledB: new St({ color: 0x38bdf8, emissive: 0x1e90ff, emissiveIntensity: 1.2, roughness: 0.3 })
    });
  }

  // ---------------------------------------------------------------- 그림(텍스처)
  function perfTex() {   // 타공 통풍구 (엇갈린 둥근 구멍)
    var c = canvas(128, 128), g = c.getContext('2d');
    g.fillStyle = '#3a3f46'; g.fillRect(0, 0, 128, 128);
    for (var j = 0; j < 8; j++) for (var i = -1; i < 9; i++) {
      var x = i * 16 + (j % 2 ? 8 : 0) + 8, y = j * 16 + 8;
      g.fillStyle = '#040506'; g.beginPath(); g.arc(x, y, 5.6, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.arc(x, y - 6.2, 1.3, 0, 7); g.fill();
    }
    var t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  var CH_UI = [['CH1', 'MAIN12', '8 Ω', 0.62, '#22c55e'], ['CH2', 'MAIN12', '8 Ω', 0.58, '#22c55e'], ['CH3', 'SUB18', '4 Ω', 0.78, '#facc15'], ['CH4', 'FILL8', '8 Ω', 0.41, '#22c55e']];
  function screenTex(on) {   // 화면 내용: 교육용으로 지어낸 단순한 화면 (채널 · 프리셋 · 크기 막대 · Ω)
    var c = canvas(704, 400), g = c.getContext('2d');
    if (!on) { g.fillStyle = '#050608'; g.fillRect(0, 0, 704, 400); return tex(c); }
    var bg = g.createLinearGradient(0, 0, 0, 400); bg.addColorStop(0, '#12305a'); bg.addColorStop(1, '#0b1f3d'); g.fillStyle = bg; g.fillRect(0, 0, 704, 400);
    g.fillStyle = '#0a1830'; g.fillRect(0, 0, 704, 62);
    say(g, '4CH  DSP  AMP', 20, 32, 28, { a: 'left', w: '800', c: '#ffffff' });
    g.fillStyle = '#34d399'; g.beginPath(); g.arc(470, 32, 9, 0, 7); g.fill(); say(g, 'NET', 486, 32, 24, { a: 'left', c: '#cfe1ff' });
    say(g, '41 °C', 684, 32, 24, { a: 'right', c: '#cfe1ff', w: '600' });
    CH_UI.forEach(function (r, i) {
      var x = 14 + i * 172, y = 76;
      g.fillStyle = '#163d6e'; rr(g, x, y, 160, 310, 10); g.fill();
      say(g, r[0], x + 80, y + 30, 30, { w: '800', c: '#ffffff' });
      g.fillStyle = '#0d2748'; rr(g, x + 12, y + 56, 136, 38, 6); g.fill(); say(g, r[1], x + 80, y + 76, 25, { w: '800', c: '#a5d8ff' });
      g.fillStyle = '#0a1a33'; g.fillRect(x + 56, y + 106, 48, 150);
      var hh = 150 * r[3]; g.fillStyle = r[4]; g.fillRect(x + 56, y + 256 - hh, 48, hh);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 50, y + 136, 60, 2);
      say(g, r[2], x + 80, y + 284, 26, { w: '700', c: '#e2ecff' });
    });
    return tex(c);
  }
  function decal(wmm, hmm, ppm, draw) {   // 투명 바탕 글자판: draw(g, P) — P(mm) → px
    var c = canvas(Math.round(wmm * ppm), Math.round(hmm * ppm)), g = c.getContext('2d');
    draw(g, function (v) { return v * ppm; });
    var t = tex(c);
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false });
  }

  // ---------------------------------------------------------------- 모양 도구
  function boxZ(w, h, d) { var g = new THREE.BoxGeometry(w, h, d); g.translate(0, 0, d / 2); return g; }      // x·y 가운데, z 0 → +d
  function cylZ(r, len, seg) { var g = new THREE.CylinderGeometry(r, r, len, seg || 28); g.rotateX(Math.PI / 2); g.translate(0, 0, len / 2); return g; }
  function tubeZ(r0, r1, len, seg) { var s = new THREE.Shape(); s.absarc(0, 0, r1, 0, Math.PI * 2, false); var h = new THREE.Path(); h.absarc(0, 0, r0, 0, Math.PI * 2, true); s.holes.push(h); return new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: seg || 28 }); }
  function rectP(p, x0, y0, x1, y1, r) {
    r = Math.min(r || 0, (x1 - x0) / 2, (y1 - y0) / 2);
    if (!r) { p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.lineTo(x0, y0); return p; }
    p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r); p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
    p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0); return p;
  }
  function oval(cx, cy, w, h) { var p = new THREE.Path(), r = Math.min(w, h) / 2; p.absarc(cx + w / 2 - r, cy, r, -Math.PI / 2, Math.PI / 2, false); p.absarc(cx - w / 2 + r, cy, r, Math.PI / 2, Math.PI * 1.5, false); return p; }
  function slab(outline, holes, depth, bevel) {   // XY 판을 z 0 → depth 로
    var s = new THREE.Shape(); outline(s); (holes || []).forEach(function (h) { s.holes.push(h); });
    var b = bevel || 0, g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 2, curveSegments: 10 });
    if (b) g.translate(0, 0, b); return g;
  }
  var _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _one = new THREE.Vector3(1, 1, 1);
  function M(x, y, z, rx, ry, rz) { _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e); return new THREE.Matrix4().compose(_v.set(x, y, z), _q, _one); }
  function on(m, x, y, z, rx, ry, rz) { return M(x, y, z, rx, ry, rz).premultiply(m); }

  // 움직이지 않는 부품은 재질별로 하나의 메시로 합쳐요(그리기 호출 줄이기)
  function Merger() {
    var bins = [];
    function bin(mat) { for (var i = 0; i < bins.length; i++) if (bins[i].mat === mat) return bins[i]; var b = { mat: mat, list: [] }; bins.push(b); return b; }
    return {
      add: function (geo, mat, m4) { var g = geo.index ? geo.toNonIndexed() : geo.clone(); geo.dispose(); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (m4) g.applyMatrix4(m4); bin(mat).list.push(g); },
      build: function (parent, name) {
        bins.forEach(function (b, k) {
          var n = 0; b.list.forEach(function (g) { n += g.attributes.position.count; });
          var P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2), o = 0;
          b.list.forEach(function (g) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); U.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); });
          var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(U, 2));
          geo.computeBoundingSphere(); var mesh = new THREE.Mesh(geo, b.mat); mesh.name = name + '.' + k; parent.add(mesh);
        });
      }
    };
  }

  // ---------------------------------------------------------------- 단자 (m = 판 표면 위치 · 방향, +Z 가 바깥)
  // (몸체가 꽉 찬 상자라서 안쪽 부품도 모두 판 바깥(z ≥ 0)에 쌓아 깊이감을 내요)
  function xlrFemale(B, X, m) {   // XLR 3핀 암 (입력)
    B.add(slab(function (s) { rectP(s, -13, -15.5, 13, 15.5, 3); }, [oval(0, 0, 21.6, 21.6)], 2.4, 0.4), X.plastic, m);
    B.add(cylZ(10.8, 0.3), X.hole, on(m, 0, 0, 0.05));
    B.add(tubeZ(9.4, 10.8, 5.2), X.nickel, m);
    B.add(cylZ(8.4, 2.8), X.plastic2, m);
    [[-3.6, 2.4], [3.6, 2.4], [0, -4.4]].forEach(function (p) { B.add(cylZ(1.25, 0.3, 12), X.hole, on(m, p[0], p[1], 2.82)); });
    B.add(boxZ(7, 3, 1.4), X.knobCap, on(m, 0, 12.6, 2.4));   // 잠금 누름쇠
  }
  function xlrMale(B, X, m) {   // XLR 3핀 수 (링크 출력)
    B.add(slab(function (s) { rectP(s, -13, -15.5, 13, 15.5, 3); }, [oval(0, 0, 21.2, 21.2)], 2.4, 0.4), X.plastic, m);
    B.add(cylZ(10.6, 0.3), X.hole, on(m, 0, 0, 0.05));
    B.add(tubeZ(9.4, 10.6, 6.6), X.nickel, m);
    [[-3.6, 2.4], [3.6, 2.4], [0, -4.4]].forEach(function (p) { B.add(cylZ(0.8, 4.6, 10), X.nickel, on(m, p[0], p[1], 0.3)); });
    B.add(boxZ(2.6, 2.2, 6.6), X.hole, on(m, 0, 9.0, 0.05));   // 키 홈
  }
  function nl4(B, X, m) {   // speakON NL4 섀시 단자 (출력)
    B.add(slab(function (s) { rectP(s, -15.5, -15.5, 15.5, 15.5, 3.5); }, [oval(0, 0, 25, 25)], 2.4, 0.4), X.plastic, m);
    B.add(cylZ(12.5, 0.3), X.hole, on(m, 0, 0, 0.05));
    B.add(tubeZ(10.8, 12.6, 4.6), X.plastic2, m);
    B.add(cylZ(6.5, 3.4), X.plastic, m);
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(function (a) { B.add(boxZ(2.2, 1.6, 0.3), X.hole, on(m, Math.cos(a) * 4.2, Math.sin(a) * 4.2, 3.42)); });
    B.add(boxZ(4, 6, 1.6), X.knobCap, on(m, 11.2, 11.2, 2.4, 0, 0, Math.PI / 4));   // 잠금 탭
    [[-12, -12], [12, -12], [-12, 12]].forEach(function (p) { B.add(cylZ(1.4, 0.8, 12), X.screw, on(m, p[0], p[1], 2.4)); });
  }
  function rj45(B, X, m) {   // RJ45 (네트워크) — 금속 껍데기 + 플러그 구멍
    B.add(boxZ(16.4, 14, 4), X.nickel, m);
    B.add(boxZ(12, 9.6, 0.4), X.hole, on(m, 0, -0.6, 4));
    B.add(boxZ(4.6, 2.4, 0.4), X.hole, on(m, 0, -5.4, 4));
  }
  function iecInlet(B, X, m) {   // 전원 인렛 (흔한 3핀 IEC 모양)
    B.add(slab(function (s) { rectP(s, -17, -13, 17, 13, 2.5); }, [], 2.4, 0.4), X.plastic, m);
    var cut = function (p) { p.moveTo(-12, -8); p.lineTo(12, -8); p.lineTo(12, 4); p.lineTo(8, 8); p.lineTo(-8, 8); p.lineTo(-12, 4); p.lineTo(-12, -8); return p; };
    B.add(slab(function (s) { cut(s); }, [], 0.6), X.hole, on(m, 0, 0, 2.05));
    [[-6.6, -1], [6.6, -1], [0, 3.6]].forEach(function (p, i) { B.add(boxZ(i < 2 ? 1.2 : 1.2, i < 2 ? 4.4 : 4.6, 1.2), X.nickel, on(m, p[0], p[1], 2.3, 0, 0, i < 2 ? 0 : Math.PI / 2)); });
    [-1, 1].forEach(function (s) { B.add(cylZ(1.5, 0.8, 12), X.screw, on(m, s * 20.5, 0, 0)); });
  }
  function rockerSwitch(B, X, m) {   // 뒷면 전원 스위치
    B.add(slab(function (s) { rectP(s, -11, -14, 11, 14, 2); }, [], 2.6, 0.4), X.plastic, m);
    B.add(boxZ(16, 22, 0.6), X.hole, on(m, 0, 0, 2.2));
    B.add(boxZ(14.4, 10.6, 4.2), X.rocker, on(m, 0, 4.8, 1.4, -0.16));
    B.add(boxZ(14.4, 10.6, 2.6), X.rocker, on(m, 0, -5.4, 1.4, 0.12));
    B.add(boxZ(1.4, 5, 0.4), X.knobCap, on(m, 0, 5.4, 5.2, -0.16));   // I 표시
  }

  // ---------------------------------------------------------------- 만들기
  function create(opts) {
    opts = opts || {};
    var V = VARIANTS.indexOf(opts.variant) >= 0 ? opts.variant : 'screen', power = opts.power !== false;
    var X = materials(), B = Merger(), leds = {};
    var root = new THREE.Group(); root.name = 'GenericDspAmp_' + V;
    var mm = new THREE.Group(); mm.scale.setScalar(0.001); root.add(mm);
    var y0 = (H - DIM.bodyH) / 2, y1 = y0 + DIM.bodyH;

    // 몸체 · 윗덮개 나사
    B.add(boxZ(DIM.bodyW, DIM.bodyH, ZP - ZB), X.body, M(0, H / 2, ZB));
    [-200, -70, 70, 200].forEach(function (x) { [ZB + 20, ZP - 26].forEach(function (z) { B.add(new THREE.CylinderGeometry(2.6, 2.8, 0.8, 16).translate(0, y1 + 0.4, 0), X.screw, M(x, 0, z)); }); });
    [-1, 1].forEach(function (s) {   // 옆면 통풍 슬롯
      for (var k = 0; k < 9; k++) B.add(new THREE.BoxGeometry(0.8, 24, 4), X.hole, M(s * (BW + 0.2), H / 2, ZB + 140 + k * 10));
    });

    // 전면판 (랙 귀 · 구멍 · 창)
    var holes = [];
    [-1, 1].forEach(function (s) { [DIM.rackHoleY0, DIM.rackHoleY0 + DIM.rackHoleY].forEach(function (y) { holes.push(oval(s * DIM.rackHoleX / 2, y + 0.4, 10, 6.4)); }); });
    var VENT = { x0: -22, x1: 186, y0: 14, y1: 74 };
    holes.push(rectP(new THREE.Path(), VENT.x0, VENT.y0, VENT.x1, VENT.y1, 4));
    var WIN = V === 'screen' ? { x0: -190, x1: -90, y0: 20, y1: 76 } : { x0: -160, x1: -42, y0: 14, y1: 78 };
    holes.push(rectP(new THREE.Path(), WIN.x0, WIN.y0, WIN.x1, WIN.y1, 3));
    B.add(slab(function (s) { rectP(s, -HW, 0, HW, H, 2.2); }, holes, DIM.panelT, 0.8), X.panel, M(0, 0, ZP));
    // 통풍구 안쪽 타공판
    var pt = perfTex(); pt.repeat.set((VENT.x1 - VENT.x0) / 26, (VENT.y1 - VENT.y0) / 26);   // 한 장(128 px)에 구멍 8개 → 구멍 간격 약 3 mm
    var perfMat = new THREE.MeshStandardMaterial({ map: pt, roughness: 0.6, metalness: 0.4 }); perfMat.color.convertSRGBToLinear();
    var perf = new THREE.Mesh(new THREE.PlaneGeometry(VENT.x1 - VENT.x0, VENT.y1 - VENT.y0), perfMat); perf.position.set((VENT.x0 + VENT.x1) / 2, (VENT.y0 + VENT.y1) / 2, ZP + 1.4); mm.add(perf);
    // 손잡이 두 개
    [-1, 1].forEach(function (s) { var x = s * 205;
      B.add(boxZ(10, 66, 7), X.handle, M(x, H / 2, ZF + 26)); [12, H - 12].forEach(function (y) { B.add(boxZ(10, 9, 27), X.handle, M(x, y, ZF)); B.add(cylZ(2.2, 0.6, 14), X.screw, M(x, y, ZF + 33)); }); });
    // 랙 나사 자리
    [-1, 1].forEach(function (s) { [DIM.rackHoleY0, DIM.rackHoleY0 + DIM.rackHoleY].forEach(function (y) { B.add(cylZ(2.6, 0.3, 14), X.hole, M(s * DIM.rackHoleX / 2, y + 0.4, ZP - 0.4)); }); });

    function addLed(id, x, y, z, r, onMat, lit) {
      var mesh = new THREE.Mesh(cylZ(r, 1.6, 20), lit && power ? onMat : X.ledOff); mesh.position.set(x, y, z); mm.add(mesh);
      leds[id] = { mesh: mesh, on: onMat, off: X.ledOff, lit: !!lit }; return mesh;
    }

    var screen = null, screenMats = null, front;
    if (V === 'screen') {
      // 화면 테두리 · 화면
      B.add(slab(function (s) { rectP(s, WIN.x0 - 0.5, WIN.y0 - 0.5, WIN.x1 + 0.5, WIN.y1 + 0.5, 3); }, [rectP(new THREE.Path(), -186, 24, -94, 72, 1.5)], 3.0), X.bezel, M(0, 0, ZP + 0.4));
      B.add(boxZ(92, 48, 0.4), X.hole, M(-140, 48, ZP + 0.6));
      screenMats = { on: new THREE.MeshBasicMaterial({ map: screenTex(true), toneMapped: false }), off: new THREE.MeshStandardMaterial({ map: screenTex(false), roughness: 0.2, metalness: 0.1 }) };
      screen = new THREE.Mesh(new THREE.PlaneGeometry(91, 51.7), power ? screenMats.on : screenMats.off); screen.position.set(-140, 48, ZP + 1.4); mm.add(screen);
      var glass = new THREE.Mesh(new THREE.PlaneGeometry(92, 48), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.06 })); glass.position.set(-140, 48, ZP + 1.6); mm.add(glass);
      // 메뉴 다이얼
      B.add(cylZ(15.5, 1.2, 40), X.bezel, M(-64, 46, ZF));
      var knob = new THREE.CylinderGeometry(12, 12.6, 15, 36); knob.rotateX(Math.PI / 2); knob.translate(0, 0, 8.7); B.add(knob, X.knob, M(-64, 46, ZF));
      for (var k = 0; k < 24; k++) { var a = k / 24 * Math.PI * 2; B.add(boxZ(1.2, 1.4, 13), X.knob, M(-64 + Math.cos(a) * 12.4, 46 + Math.sin(a) * 12.4, ZF + 2, 0, 0, a)); }
      B.add(cylZ(9.5, 0.8, 32), X.knobCap, M(-64, 46, ZF + 16.2));
      B.add(boxZ(1.6, 6, 0.6), X.hole, M(-64, 51.5, ZF + 16.9));
      // 버튼 두 개 (MENU · BACK)
      [[-36, 58], [-36, 34]].forEach(function (p) { B.add(boxZ(11, 8, 1), X.bezel, M(p[0], p[1], ZF)); B.add(boxZ(9, 6, 3.2), X.plastic2, M(p[0], p[1], ZF + 0.6)); });
      addLed('power', -182, 82, ZF - 0.6, 1.6, X.ledG, true);
      addLed('net', -150, 82, ZF - 0.6, 1.6, X.ledB, true);
      front = decal(DIM.width, H, 5, function (g, P) {
        function T(s, x, y, px, o) { say(g, s, P(x + HW), P(H - y), P(px), o); }
        T('POWER', -177, 82, 2.6, { a: 'left', w: '800', c: '#c9ced6' }); T('NET', -145, 82, 2.6, { a: 'left', w: '800', c: '#c9ced6' });
        T('MENU', -36, 66, 2.7, { w: '800', c: '#c9ced6' }); T('BACK', -36, 26, 2.7, { w: '800', c: '#c9ced6' });
        T('4-CHANNEL  DSP  POWER  AMPLIFIER', 186, 81.5, 3.2, { a: 'right', w: '800', c: '#dfe3e8' });
        T('CLASS D', 186, 8, 2.8, { a: 'right', w: '700', c: '#9aa3ad' });
      });
    } else {
      // LED 창 (어두운 판) + 채널 LED
      B.add(slab(function (s) { rectP(s, WIN.x0 - 0.5, WIN.y0 - 0.5, WIN.x1 + 0.5, WIN.y1 + 0.5, 3); }, [], 2.6), X.window, M(0, 0, ZP + 0.4));
      var colX = [-122, -102, -82, -62], rows = [['sig', 62, X.ledG], ['lim', 50, X.ledY], ['clip', 38, X.ledR], ['prot', 26, X.ledR]];
      var demo = { sig: [1, 1, 1, 1], lim: [0, 0, 1, 0], clip: [0, 0, 0, 0], prot: [0, 0, 0, 0] };
      rows.forEach(function (r) { colX.forEach(function (x, i) { addLed(r[0] + (i + 1), x, r[1], ZP + 2.6, 1.9, r[2], !!demo[r[0]][i]); }); });
      // 전원 버튼 (링 LED)
      B.add(cylZ(10.5, 1.0, 36), X.bezel, M(-182, 44, ZF));
      var ring = new THREE.Mesh(tubeZ(7.2, 8.6, 1.6, 36), power ? X.ledB : X.ledOff); ring.position.set(-182, 44, ZF + 0.4); mm.add(ring);
      leds.power = { mesh: ring, on: X.ledB, off: X.ledOff, lit: true };
      B.add(cylZ(7.0, 4.6, 36), X.plastic2, M(-182, 44, ZF + 0.6));
      B.add(tubeZ(2.6, 3.4, 0.4, 24), X.knobCap, M(-182, 44, ZF + 5.2));
      addLed('net', -182, 70, ZF - 0.6, 1.6, X.ledG, true);
      front = decal(DIM.width, H, 5, function (g, P) {
        function T(s, x, y, px, o) { say(g, s, P(x + HW), P(H - y), P(px), o); }
        colX.forEach(function (x, i) { T('CH' + (i + 1), x, 72.5, 3.0, { w: '800', c: '#e5e9ee' }); });
        [['SIG', 62], ['LIM', 50], ['CLIP', 38], ['PROT', 26]].forEach(function (r) { T(r[0], -134, r[1], 2.7, { a: 'right', w: '800', c: '#c9ced6' }); });
        T('POWER', -182, 27, 2.7, { w: '800', c: '#c9ced6' }); T('NET', -182, 77, 2.6, { w: '800', c: '#c9ced6' });
        T('4-CHANNEL  DSP  POWER  AMPLIFIER', 186, 81.5, 3.2, { a: 'right', w: '800', c: '#dfe3e8' });
        T('CLASS D', 186, 8, 2.8, { a: 'right', w: '700', c: '#9aa3ad' });
      });
    }
    var fd = new THREE.Mesh(new THREE.PlaneGeometry(DIM.width, H), front); fd.position.set(0, H / 2, ZF + 0.05); fd.renderOrder = 2; mm.add(fd);

    // ---------------- 뒷면 (판 표면 z = ZB, 바깥 = −Z). 위치 x 는 모델 좌표(앞에서 볼 때 오른쪽 +)
    function R(x, y, out) { return M(x, y, ZB - (out || 0), 0, Math.PI); }
    iecInlet(B, X, R(192, 44));
    rockerSwitch(B, X, R(156, 44));
    var rv = perfTex(); rv.repeat.set(58 / 26, 62 / 26);
    var rvMat = new THREE.MeshStandardMaterial({ map: rv, roughness: 0.6, metalness: 0.4 }); rvMat.color.convertSRGBToLinear();
    B.add(slab(function (s) { rectP(s, -31, -33, 31, 33, 3); }, [rectP(new THREE.Path(), -29, -31, 29, 31, 2)], 1.6), X.panel, R(106, 44));
    var rvent = new THREE.Mesh(new THREE.PlaneGeometry(58, 62), rvMat); rvent.position.set(106, 44, ZB - 0.3); rvent.rotation.y = Math.PI; mm.add(rvent);
    var OUTX = [50, 12, -26, -64]; OUTX.forEach(function (x) { nl4(B, X, R(x, 46)); });
    var INX = [-96, -124, -152, -180]; INX.forEach(function (x) { xlrFemale(B, X, R(x, 62)); xlrMale(B, X, R(x, 24)); });
    rj45(B, X, R(-203, 62)); rj45(B, X, R(-203, 30));
    [['linkA', 62], ['linkB', 30]].forEach(function (r) { [[-5.2, X.ledG, 'Link'], [5.2, X.ledY, 'Act']].forEach(function (q) {   // 랜 단자 불빛 (뒤에서 본 왼쪽 = 모델 +X 쪽이라 x 부호 반대)
      var id = r[0] + q[2], mesh = new THREE.Mesh(boxZ(2.6, 1.6, 0.6), power ? q[1] : X.ledOff); mesh.applyMatrix4(on(R(-203, r[1]), q[0], 5.4, 4)); mm.add(mesh); leds[id] = { mesh: mesh, on: q[1], off: X.ledOff, lit: true }; }); });
    // 뒷면 랙 받침 귀
    [-1, 1].forEach(function (s) { B.add(boxZ(4, 60, 30), X.ear, M(s * (BW + 2), H / 2, ZB + 8)); });
    var rear = decal(DIM.bodyW, H, 5, function (g, P) {   // 뒤에서 본 그림: 그림 왼쪽 = 모델 +X
      function T(s, x, y, px, o) { say(g, s, P(BW - x), P(H - y), P(px), o); }
      T('AC INPUT', 192, 63, 2.6, { w: '800' }); T('100–240 V ~', 192, 25, 2.3, { w: '600', c: '#c9ced6' }); T('50/60 Hz', 192, 21, 2.3, { w: '600', c: '#c9ced6' });
      T('POWER', 156, 63, 2.6, { w: '800' }); T('I = ON', 156, 25, 2.3, { w: '600', c: '#c9ced6' });
      T('AIR OUT', 106, 82.5, 2.5, { w: '800', c: '#c9ced6' });
      T('SPEAKER OUTPUTS (NL4)', -7, 72, 2.7, { w: '800' });
      OUTX.forEach(function (x, i) { T('CH' + (i + 1), x, 25.5, 3.0, { w: '800' }); T('1+ 1−', x, 20.5, 2.2, { w: '600', c: '#c9ced6' }); });
      T('INPUTS', -138, 83.5, 2.7, { w: '800' }); T('LINK', -138, 4.5, 2.7, { w: '800' });
      INX.forEach(function (x, i) { T(String(i + 1), x, 43.5, 3.0, { w: '800' }); });
      T('NETWORK', -203, 83.5, 2.4, { w: '800' }); T('A', -203, 46.5, 2.6, { w: '800' }); T('B', -203, 14.5, 2.6, { w: '800' });
      g.strokeStyle = 'rgba(230,234,240,0.4)'; g.lineWidth = P(0.35);
      function box(xr, xl, yb, yt) { g.strokeRect(P(BW - xr), P(H - yt), P(xr - xl), P(yt - yb)); }   // xr > xl (모델 x)
      box(68, -82, 16, 77); box(-82.5, -194, 9, 79);
    });
    var rd = new THREE.Mesh(new THREE.PlaneGeometry(DIM.bodyW, H), rear); rd.position.set(0, H / 2, ZB - 0.05); rd.rotation.y = Math.PI; rd.renderOrder = 2; mm.add(rd);

    B.build(mm, 'genericDspAmp.static');

    // ---------------- 동작
    function setLed(id, onOff) { var l = leds[id]; if (!l) throw new Error('[GenericDspAmp] unknown led ' + id); l.lit = !!onOff; l.mesh.material = l.lit && power ? l.on : l.off; }
    function setPower(onOff) {
      power = !!onOff;
      if (screen) screen.material = power ? screenMats.on : screenMats.off;
      Object.keys(leds).forEach(function (k) { var l = leds[k]; l.mesh.material = l.lit && power ? l.on : l.off; });
    }
    var api = { variant: V, leds: leds, setLed: setLed, setPower: setPower, isOn: function () { return power; },
      counts: function () { var n = 0; root.traverse(function (o) { if (o.isMesh) n++; }); return { meshes: n, leds: Object.keys(leds).length }; } };
    Object.defineProperty(root.userData, 'genericAmp', { value: api, enumerable: false });
    root.userData.variant = V;
    return root;
  }

  global.GenericDspAmp = {
    VARIANTS: VARIANTS.slice(), DIMENSIONS_MM: DIM,
    VIEW_DIR: { screen: [0.35, 0.28, 1], led: [0.35, 0.28, 1], rear: [-0.45, 0.32, -1] },
    create: create,
    api: function (root) { return root && root.userData ? root.userData.genericAmp : null; }
  };
})(typeof window !== 'undefined' ? window : this);
