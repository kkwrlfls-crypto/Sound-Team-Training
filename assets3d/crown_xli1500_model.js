/* =============================================================================
   Crown XLi 1500 파워앰프 — 절차적(procedural) 3D 모델  (Three.js r128 전용)
   -----------------------------------------------------------------------------
   - 전역 네임스페이스: window.CrownXLi1500   (기존 gear3d / GEAR_MODEL_MAP 등과 충돌 없음)
   - 좌표 단위: 미터.  원점 = 섀시 외곽(483 x 89 x 315 mm)의 "바닥 중앙".
       +X = 앞에서 봤을 때 오른쪽, +Y = 위, +Z = 전면(Front) 방향, -Z = 후면(Rear) 방향
       전면 패널 바깥면  z = +0.1575,  후면 패널 바깥면  z = -0.1575
     (프로젝트의 GEAR3D_TERMINAL_FACE_SIGN 기본값(-1 = 단자가 -Z 면)과 같은 방향입니다.)
   - 공식 치수: 483(W) x 89(H) x 315(D) mm  — Crown 공식 제품 페이지/매뉴얼 사양표.
     노브·바인딩포스트 등 돌출부는 이 외곽 치수 "밖"으로 튀어나옵니다(실물과 동일).
   - 세부 치수(노브 지름, 단자 위치 등)는 공식 제품 사진(전면/후면 정면 사진)에서 픽셀 비율로
     역산한 "비례 추정치"입니다. 아래 LAYOUT 상수에 mm 단위로 모두 모아 두었습니다.
   - 사진 텍스처를 상자에 붙이는 방식이 아니라 모든 본체/조작부/단자는 개별 메시로 구성하고,
     작은 인쇄 문자(라벨)만 CanvasTexture 데칼로 처리합니다.
   ============================================================================= */
(function (global) {
  'use strict';
  var THREE = global.THREE;
  if (!THREE) { console.error('[CrownXLi1500] THREE가 먼저 로드되어야 합니다.'); return; }

  var NS = 'crownXli1500';
  var MM = 0.001;

  // ---------------------------------------------------------------------------
  // 치수 (mm). official = 공식 사양, est = 사진 비례 추정
  // ---------------------------------------------------------------------------
  var DIM = {
    width: 483,        // official
    height: 89,        // official (2U)
    depth: 315,        // official
    bodyWidth: 440,    // est: 후면 사진에서 높이 89mm 기준 비율로 측정 (EIA 19" 랙 본체 폭 범위)
    bezelDepth: 8,     // est: 전면 베젤(통풍구 포켓 포함) 두께
    sheet: 1.2         // est: 상판/측판 철판 두께
  };
  var ZF = DIM.depth / 2;          // 전면 바깥면 z (mm)
  var ZR = -DIM.depth / 2;         // 후면 바깥면 z (mm)
  var HALF_BW = DIM.bodyWidth / 2; // 220

  // 전면 레이아웃 (x: 중앙 기준 mm, y: 바닥 기준 mm) — 공식 전면 사진 측정값
  var FRONT = {
    plate: { w: 165, h: 72, cy: 44.6, r: 6 },     // 중앙 컨트롤 플레이트
    knobX: 55, knobY: 35.3,                        // CH1 = -55, CH2 = +55
    ledX: 33, ledY: { fault: 43, clip: 37, signal: 31 },
    powerLed: { x: 0, y: 48 },
    powerSwitch: { x: 0, y: 37 },
    emblem: { x: -26.7, y: 69.6, r: 8.2 },
    earHoleInset: 8, earHoleY: [6.35, 82.65],      // EIA 2U 표준 랙 홀 높이
    // 통풍구 외곽 (패널 왼쪽 끝 기준 X mm, 위쪽 기준 Y mm) — 왼쪽 것, 오른쪽은 좌우 대칭
    ventUpper: [[57.7, 7.5], [115, 8.5], [151.6, 35.7], [146.6, 38.0], [75.8, 25.5], [56, 12.9]],
    ventLower: [[29.7, 28.9], [141.7, 57.1], [142.5, 76.0], [51, 76.5]]
  };

  // 후면 레이아웃 — 뒤에서 바라본 기준(Xr: 왼쪽 끝에서 mm, Y: 바닥에서 mm). 공식 후면 사진 측정값.
  // 월드 x = (220 - Xr) mm  (뒤에서 본 왼쪽 = 모델의 +X)
  var REAR = {
    reset: { x: 30.2, y: 65.1 },
    resetSlots: { xs: [12.5, 48.5], ys: [71.2, 65.1, 60.2], w: 13, h: 3 },
    iec: { x: 32.2, y: 25.5, w: 31.7, h: 22.9, openW: 24.8, openH: 17.3 },
    fans: [{ x: 259.1, y: 42.8 }, { x: 343.2, y: 42.8 }],
    fanRings: [[11.5, 15.0], [17.5, 22.0], [24.5, 29.5], [32.0, 37.0]],
    outputsBox: { x0: 131.4, x1: 213.1, y0: 0.8, y1: 86.5 },
    bindingStrip: { x0: 132.2, x1: 209.9, y0: 60.6, y1: 77.1 },
    binding: [
      { id: 'ch2Neg', x: 140.4, color: 'black', ch: 2, pol: '-' },
      { id: 'ch2Pos', x: 161.0, color: 'red', ch: 2, pol: '+' },
      { id: 'ch1Pos', x: 180.4, color: 'red', ch: 1, pol: '+' },
      { id: 'ch1Neg', x: 200.8, color: 'black', ch: 1, pol: '-' }
    ],
    bindingY: 68.9,
    speakon: { ch2: { x: 152.9, y: 27.4 }, ch1: { x: 191.8, y: 27.4 } },
    inputsBox: { x0: 387.1, x1: 431.2, y0: 0.8, y1: 86.5 },
    xlr: { ch1: { x: 405.9, y: 68.1 }, ch2: { x: 404.6, y: 19.8 } },
    rca: { ch2: { x: 397.2, y: 45.8 }, ch1: { x: 412.7, y: 45.8 } },
    modeSwitch: { x: 431.5, y: 65.5, slotH: 14, pos: { bridge: 4.4, parallel: 0, stereo: -4.4 } },
    sensSwitch: { x: 431.5, y: 21.0, slotH: 11, pos: { '1.4V': 2.6, '0.775V': -2.6 } },
    screws: [
      [13.4, 82.7], [117.6, 82.7], [221.4, 80.8], [221.4, 5.8], [295.0, 80.3], [307.8, 80.3],
      [295.0, 5.8], [307.8, 5.8], [382.0, 79.9], [382.0, 6.3], [432.7, 82.7],
      [11.8, 25.5], [52.9, 25.5],                     // IEC 인렛 고정
      [142.3, 39.1], [163.5, 15.7], [181.2, 39.1], [202.4, 15.7], // Speakon 고정 (대각, 플랜지 바깥)
      [416.4, 78.6], [395.4, 57.6], [415.1, 30.3], [394.1, 9.3],  // XLR 고정 (대각)
      [405.1, 38.7]                                   // RCA 사이
    ]
  };
  function rx(xr) { return HALF_BW - xr; } // 후면 Xr(mm) -> 모델 x(mm)

  // ---------------------------------------------------------------------------
  // 공용 헬퍼
  // ---------------------------------------------------------------------------
  function toM(geo) { geo.scale(MM, MM, MM); return geo; }
  function setPosMM(obj, x, y, z) { obj.position.set(x * MM, y * MM, z * MM); return obj; }
  function mk(geo, mat, name, opts) {
    var m = new THREE.Mesh(toM(geo), mat);
    m.name = NS + '.' + name;
    var o = opts || {};
    m.castShadow = o.cast !== false;
    m.receiveShadow = o.receive !== false;
    return m;
  }
  function grp(name) { var g = new THREE.Group(); g.name = NS + '.' + name; return g; }
  // userData에 Object3D/함수 참조를 넣으면 r128 Object3D.clone()이 JSON.stringify로 통째 직렬화하므로
  // 열거 불가(non-enumerable) 속성으로 숨김 → clone()은 가볍고 안전, 참조는 원본 인스턴스에서만 유효
  function hide(target, key, value) {
    Object.defineProperty(target, key, { value: value, enumerable: false, writable: true, configurable: true });
    return value;
  }

  function roundedRectPath(p, cx, cy, w, h, r) {
    var x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
    r = Math.min(r, w / 2, h / 2);
    p.moveTo(x0 + r, y0);
    p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r);
    p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
    p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r);
    p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0);
    return p;
  }
  function roundedPolyPath(p, pts, r) {
    var n = pts.length;
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      var v1x = p0[0] - p1[0], v1y = p0[1] - p1[1], v2x = p2[0] - p1[0], v2y = p2[1] - p1[1];
      var l1 = Math.hypot(v1x, v1y), l2 = Math.hypot(v2x, v2y);
      var rr = Math.min(r, l1 * 0.45, l2 * 0.45);
      var ax = p1[0] + v1x / l1 * rr, ay = p1[1] + v1y / l1 * rr;
      var bx = p1[0] + v2x / l2 * rr, by = p1[1] + v2y / l2 * rr;
      if (i === 0) p.moveTo(ax, ay); else p.lineTo(ax, ay);
      p.quadraticCurveTo(p1[0], p1[1], bx, by);
    }
    p.closePath();
    return p;
  }
  function circlePath(p, cx, cy, r) { p.absarc(cx, cy, r, 0, Math.PI * 2, false); return p; }
  function polyPath(p, pts) {
    p.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath(); return p;
  }
  // 둥근 끝을 가진 원호형 슬롯(팬 그릴용)
  function arcSlotPath(cx, cy, rIn, rOut, a0, a1) {
    var p = new THREE.Path();
    var rm = (rIn + rOut) / 2, rc = (rOut - rIn) / 2;
    p.absarc(cx, cy, rOut, a0, a1, false);
    p.absarc(cx + rm * Math.cos(a1), cy + rm * Math.sin(a1), rc, a1, a1 + Math.PI, false);
    p.absarc(cx, cy, rIn, a1, a0, true);
    p.absarc(cx + rm * Math.cos(a0), cy + rm * Math.sin(a0), rc, a0 + Math.PI, a0 + Math.PI * 2, false);
    return p;
  }
  function extrude(shape, depth, bevel, curveSegments) {
    var b = bevel || 0;
    var g = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(depth - 2 * b, 0.01),
      bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: b > 0 ? 2 : 0,
      curveSegments: curveSegments || 8
    });
    if (b > 0) g.translate(0, 0, b); // z 범위를 [0, depth]로 맞춤
    return g;
  }
  // z축이 정면(+Z)을 향하는 원기둥 (밑면 z=0, 윗면 z=h)
  function cylZ(rTop, rBot, h, seg) {
    var g = new THREE.CylinderGeometry(rTop, rBot, h, seg || 32);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, h / 2);
    return g;
  }
  // LatheGeometry는 프로파일이 아래(y 작음)→위 순서일 때 법선이 바깥을 향함
  function latheZ(points, seg) {
    var pts = points.slice();
    if (pts[0].y > pts[pts.length - 1].y) pts.reverse();
    var g = new THREE.LatheGeometry(pts, seg || 32);
    g.rotateX(Math.PI / 2); // 회전축 Y -> Z
    return g;
  }
  function pointInPoly(x, y, pts) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function distToPoly(x, y, pts) {
    var best = Infinity;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var ax = pts[j][0], ay = pts[j][1], bx = pts[i][0], by = pts[i][1];
      var dx = bx - ax, dy = by - ay, t = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy);
      t = Math.max(0, Math.min(1, t));
      best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
    }
    return best;
  }

  // ---------------------------------------------------------------------------
  // 재질 (인스턴스마다 새로 생성 → 하이라이트/LED 상태가 다른 인스턴스와 섞이지 않음)
  // r128 + outputEncoding=sRGB 환경에서 hex 값은 선형 공간으로 해석되므로 실제보다 어둡게 지정.
  // ---------------------------------------------------------------------------
  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return {
      chassis: new S({ color: 0x070708, roughness: 0.72, metalness: 0.2 }),   // 검은 분체도장 철판
      bezel: new S({ color: 0x0b0b0c, roughness: 0.74, metalness: 0.15 }),     // 다이캐스트 전면 베젤
      plate: new S({ color: 0x060607, roughness: 0.5, metalness: 0.3 }),     // 중앙 컨트롤 플레이트
      rearPlate: new S({ color: 0x08080a, roughness: 0.66, metalness: 0.25 }),
      perforated: new S({ color: 0x08090a, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide }),
      interior: new S({ color: 0x010101, roughness: 1.0, metalness: 0.0 }),
      blackPlastic: new S({ color: 0x050505, roughness: 0.38, metalness: 0.0 }),
      matteBlack: new S({ color: 0x040404, roughness: 0.85, metalness: 0.0 }),
      holeWallNl4: new THREE.MeshBasicMaterial({ color: 0x0c0c0d, side: THREE.BackSide }), // speakON 보어 안쪽 벽 (장면 환경광 반사로 하얗게 뜨지 않도록 조명 없는 재질)
      knob: new S({ color: 0x060607, roughness: 0.33, metalness: 0.1 }),
      white: new S({ color: 0xe8e8e8, roughness: 0.4, metalness: 0.0 }),
      nickel: new S({ color: 0x9a9ea4, roughness: 0.28, metalness: 0.9 }),
      chrome: new S({ color: 0xc9ccd1, roughness: 0.18, metalness: 1.0 }),
      darkMetal: new S({ color: 0x1b1c1f, roughness: 0.35, metalness: 0.8 }),
      screw: new S({ color: 0x141416, roughness: 0.32, metalness: 0.75 }),
      redPost: new S({ color: 0x9b0508, roughness: 0.3, metalness: 0.0 }),
      blackPost: new S({ color: 0x070707, roughness: 0.32, metalness: 0.0 }),
      redRing: new S({ color: 0x8a0406, roughness: 0.35, metalness: 0.0 }),
      whiteRing: new S({ color: 0xd8d8d8, roughness: 0.35, metalness: 0.0 }),
      fanBlade: new S({ color: 0x020202, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide }),
      hole: new S({ color: 0x000000, roughness: 1.0, metalness: 0.0 })
    };
  }

  // ---------------------------------------------------------------------------
  // CanvasTexture 데칼 (작은 인쇄 문자만 텍스처로 처리)
  // ---------------------------------------------------------------------------
  var FONT = '"Helvetica Neue", Arial, "Liberation Sans", "DejaVu Sans", sans-serif';
  function makeCanvas(wmm, hmm, pxPerMM) {
    var c = document.createElement('canvas');
    c.width = Math.round(wmm * pxPerMM); c.height = Math.round(hmm * pxPerMM);
    var ctx = c.getContext('2d');
    return { canvas: c, ctx: ctx, s: pxPerMM, w: wmm, h: hmm };
  }
  function canvasTexture(canvas) {
    var t = new THREE.CanvasTexture(canvas);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }
  function decalMaterial(tex) {
    return new THREE.MeshStandardMaterial({
      map: tex, transparent: true, alphaTest: 0.08, depthWrite: false,
      roughness: 0.55, metalness: 0.0,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    });
  }
  function txt(d, s, xmm, ymmFromTop, sizeMM, opts) {
    var o = opts || {};
    var ctx = d.ctx;
    ctx.save();
    ctx.fillStyle = o.color || '#e9e9e9';
    ctx.font = (o.style || '') + ' ' + (o.weight || '700') + ' ' + (sizeMM * d.s) + 'px ' + (o.font || FONT);
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = 'middle';
    if (o.spacing) {
      // 수동 자간
      var total = 0, i, ws = [];
      for (i = 0; i < s.length; i++) { ws.push(ctx.measureText(s[i]).width); total += ws[i]; }
      total += o.spacing * d.s * (s.length - 1);
      var x = xmm * d.s - (o.align === 'left' ? 0 : total / 2);
      ctx.textAlign = 'left';
      for (i = 0; i < s.length; i++) { ctx.fillText(s[i], x, ymmFromTop * d.s); x += ws[i] + o.spacing * d.s; }
    } else {
      ctx.fillText(s, xmm * d.s, ymmFromTop * d.s);
    }
    ctx.restore();
  }
  // 여러 글꼴 조각을 이어서 그림 (예: "XL" + "i" + " 1500") — 실제 글자 폭으로 간격 계산
  function txtRuns(d, runs, xmm, ymmFromTop) {
    var ctx = d.ctx, x = xmm * d.s;
    runs.forEach(function (r) {
      ctx.save();
      ctx.fillStyle = r.color || '#e9e9e9';
      ctx.font = (r.style || '') + ' ' + (r.weight || '700') + ' ' + (r.size * d.s) + 'px ' + FONT;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(r.text, x, (ymmFromTop + r.size * 0.36) * d.s);
      x += ctx.measureText(r.text).width + (r.gap || 0) * d.s;
      ctx.restore();
    });
  }
  function crownGlyph(ctx, cx, cy, size, color) {
    // 단순화한 왕관 아이콘 (로고 원본을 복제하지 않은 일반 도형)
    var w = size, h = size * 0.62;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy + h / 2);
    ctx.lineTo(cx - w / 2, cy - h * 0.15);
    ctx.lineTo(cx - w * 0.27, cy + h * 0.12);
    ctx.lineTo(cx, cy - h / 2);
    ctx.lineTo(cx + w * 0.27, cy + h * 0.12);
    ctx.lineTo(cx + w / 2, cy - h * 0.15);
    ctx.lineTo(cx + w / 2, cy + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - w / 2, cy + h / 2 + h * 0.12, w, h * 0.16);
    ctx.restore();
  }

  function buildFrontDecalTexture() {
    var P = FRONT.plate;
    var d = makeCanvas(P.w, P.h, 12);
    var ctx = d.ctx;
    // 플레이트 로컬(mm, 중심 원점, y 위로) -> 캔버스
    function cx(x) { return x + P.w / 2; }
    function cy(yAbs) { return P.h / 2 - (yAbs - P.cy); } // 바닥 기준 y -> 위쪽 기준
    // 노브 눈금 점 (0~10, 270도)
    [-FRONT.knobX, FRONT.knobX].forEach(function (kx) {
      for (var i = 0; i <= 10; i++) {
        var a = (225 - i * 27) * Math.PI / 180;
        var x = cx(kx) + Math.cos(a) * 15.2, y = cy(FRONT.knobY) - Math.sin(a) * 15.2;
        ctx.fillStyle = '#d8d8d8';
        ctx.beginPath(); ctx.arc(x * d.s, y * d.s, (i % 5 === 0 ? 0.62 : 0.45) * d.s, 0, Math.PI * 2); ctx.fill();
      }
      txt(d, '0', cx(kx) - 11.5, cy(FRONT.knobY) + 14.5, 2.2, { weight: '600' });
      txt(d, '10', cx(kx) + 12.5, cy(FRONT.knobY) + 14.5, 2.2, { weight: '600' });
    });
    txt(d, 'CH1', cx(-42), cy(54), 3.2, { weight: '600' });
    txt(d, 'CH2', cx(38), cy(54), 3.2, { weight: '600' });
    txt(d, 'Power', cx(0), cy(54), 2.6, { weight: '700' });
    var L = FRONT.ledY;
    [['FAULT', L.fault], ['CLIP', L.clip], ['SIGNAL', L.signal]].forEach(function (row) {
      txt(d, row[0], cx(-FRONT.ledX + 3.2), cy(row[1]), 2.1, { align: 'left', weight: '600' });
      txt(d, row[0], cx(FRONT.ledX - 3.2), cy(row[1]), 2.1, { align: 'right', weight: '600' });
    });
    // 워드마크 & 모델명 (일반 글꼴로 재현)
    txt(d, 'crown', cx(-17), cy(FRONT.emblem.y), 9.5, { align: 'left', weight: '900', spacing: 0.9 });
    // "XLi 1500" — XL 굵은 이탤릭, i 소문자, 1500 이탤릭
    txtRuns(d, [{ text: 'XL', size: 7.2, weight: '900', style: 'italic', gap: 0.3 },
      { text: 'i', size: 5.4, weight: '700', style: 'italic', gap: 1.4 },
      { text: '1500', size: 7.2, weight: '400', style: 'italic' }], cx(-15.5), cy(19));
    return canvasTexture(d.canvas);
  }

  function buildEmblemTexture() {
    var d = makeCanvas(16, 16, 32);
    var ctx = d.ctx;
    ctx.fillStyle = '#0b0b0d';
    ctx.beginPath(); ctx.arc(8 * d.s, 8 * d.s, 8 * d.s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 0.7 * d.s;
    ctx.beginPath(); ctx.arc(8 * d.s, 8 * d.s, 6.2 * d.s, 0, Math.PI * 2); ctx.stroke();
    crownGlyph(ctx, 8 * d.s, 7.6 * d.s, 6.4 * d.s, '#efefef');
    return canvasTexture(d.canvas);
  }

  function buildRearDecalTexture() {
    var W = DIM.bodyWidth, H = DIM.height;
    var d = makeCanvas(W, H, 8);
    var ctx = d.ctx, s = d.s;
    function Y(y) { return H - y; } // 바닥 기준 -> 위 기준
    function line(x0, y0, x1, y1, wmm) {
      ctx.strokeStyle = '#e4e4e4'; ctx.lineWidth = (wmm || 0.45) * s;
      ctx.beginPath(); ctx.moveTo(x0 * s, Y(y0) * s); ctx.lineTo(x1 * s, Y(y1) * s); ctx.stroke();
    }
    function boxOutline(b, label) {
      ctx.strokeStyle = '#e4e4e4'; ctx.lineWidth = 0.5 * s;
      ctx.strokeRect(b.x0 * s, Y(b.y1) * s, (b.x1 - b.x0) * s, (b.y1 - b.y0) * s);
      ctx.fillStyle = '#e4e4e4';
      ctx.fillRect(b.x0 * s, Y(b.y0 + 3.6) * s, (b.x1 - b.x0) * s, 3.6 * s);
      txt(d, label, (b.x0 + b.x1) / 2, Y(b.y0 + 1.8), 2.2, { color: '#2b2b2b', weight: '600', spacing: 0.25 });
    }
    function bolt(x, y) {
      ctx.fillStyle = '#e4e4e4';
      ctx.beginPath();
      var p = [[1.6, 4.8], [-1.2, 0.4], [0.3, 0.4], [-1.6, -4.8], [1.3, -0.6], [-0.2, -0.6]];
      p.forEach(function (q, i) { var X = (x + q[0]) * s, YY = Y(y + q[1]) * s; if (i) ctx.lineTo(X, YY); else ctx.moveTo(X, YY); });
      ctx.closePath(); ctx.fill();
    }
    function speakerIcon(x, y, signs) {
      ctx.fillStyle = '#e4e4e4';
      ctx.beginPath();
      ctx.moveTo((x - 2.2) * s, Y(y + 1.6) * s); ctx.lineTo((x + 2.2) * s, Y(y + 1.6) * s);
      ctx.lineTo((x + 0.8) * s, Y(y) * s); ctx.lineTo((x - 0.8) * s, Y(y) * s); ctx.closePath(); ctx.fill();
      ctx.fillRect((x - 0.8) * s, Y(y) * s, 1.6 * s, 1.2 * s);
      txt(d, signs[0], x - 3.6, Y(y + 0.4), 2.6, { weight: '800' });
      txt(d, signs[1], x + 3.6, Y(y + 0.4), 2.6, { weight: '800' });
    }
    function table(x0, y0, cols, rows) {
      var cw = 3.6, rh = 2.05;
      ctx.strokeStyle = '#e4e4e4'; ctx.lineWidth = 0.3 * s;
      for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < cols; c++) {
          var w = c === 0 ? 4.8 : cw;
          var xx = x0 + (c === 0 ? 0 : 4.8 + (c - 1) * cw);
          ctx.strokeRect(xx * s, Y(y0 - r * rh) * s, w * s, rh * s);
          txt(d, rows[r][c], xx + w / 2, Y(y0 - r * rh) + rh / 2, 1.45, { weight: '700' });
        }
      }
    }
    // ---- 왼쪽: 리셋/전원 라벨 ----
    txt(d, 'RESET', REAR.reset.x, Y(50.8), 2.4, { weight: '700' });
    txt(d, '220V ~ 50/60 Hz', REAR.iec.x, Y(40.4), 2.4, { weight: '700' });
    ['CAUTION - TO REDUCE THE RISK OF', 'ELECTRIC SHOCK, GROUNDING OF THE', 'CENTER PIN OF THE PLUG MUST BE', 'MAINTAINED.']
      .forEach(function (l, i) { txt(d, l, 6.5, Y(11.6 - i * 1.6), 1.2, { align: 'left', weight: '700' }); });
    // ---- 로고 / 모델명 ----
    ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 0.7 * s;
    ctx.beginPath(); ctx.arc(70.5 * s, Y(72.5) * s, 4.6 * s, 0, Math.PI * 2); ctx.stroke();
    crownGlyph(ctx, 70.5 * s, Y(72.7) * s, 4.8 * s, '#e8e8e8');
    txt(d, 'crown', 76.5, Y(72.5), 7.0, { align: 'left', weight: '900', spacing: 0.6 });
    txtRuns(d, [{ text: 'XL', size: 5.2, weight: '900', style: 'italic', gap: 0.2 },
      { text: 'i', size: 3.9, weight: '700', style: 'italic', gap: 1.0 },
      { text: '1500', size: 5.2, weight: '400', style: 'italic' }], 80, Y(64.5));
    // ---- 경고/규격 문구 (일반 안전 문구, 축약) ----
    var warn = ['WARNING - TO REDUCE THE', 'RISK OF FIRE OR ELECTRICAL SHOCK,', 'DO NOT EXPOSE THIS EQUIPMENT', 'TO RAIN OR MOISTURE.',
      'AVIS - RISQUE DE CHOC', 'ELECTRIQUE - NE PAS OUVRIR.'];
    warn.forEach(function (l, i) { txt(d, l, 66.5, Y(56.5 - i * 1.75), (i === 0 || i === 4) ? 1.55 : 1.3, { align: 'left', weight: '700' }); });
    ['THIS DEVICE COMPLIES WITH PART 15 OF THE FCC RULES.', 'OPERATION IS SUBJECT TO THE FOLLOWING CONDITIONS:',
      '1) THIS DEVICE MAY NOT CAUSE HARMFUL INTERFERENCE.', '2) THIS DEVICE MUST ACCEPT ANY INTERFERENCE.']
      .forEach(function (l, i) { txt(d, l, 66.5, Y(33.5 - i * 1.6), 1.15, { align: 'left', weight: '700' }); });
    txt(d, 'CLASS 2 OUTPUT WIRING PERMITTED.', 66.5, Y(17.6), 1.6, { align: 'left', weight: '800' });
    ctx.strokeStyle = '#e4e4e4'; ctx.lineWidth = 0.35 * s;
    ctx.strokeRect(66.5 * s, Y(15.6) * s, 45 * s, 9.5 * s);
    txt(d, '— CAUTION —', 89, Y(13.4), 2.0, { weight: '800' });
    txt(d, 'RISK OF ELECTRIC SHOCK', 89, Y(10.6), 1.25, { weight: '700' });
    txt(d, 'DO NOT OPEN', 89, Y(8.8), 1.25, { weight: '700' });
    [70.6, 107.4].forEach(function (tx) {
      ctx.fillStyle = '#e4e4e4'; ctx.beginPath();
      ctx.moveTo(tx * s, Y(13.9) * s); ctx.lineTo((tx + 2.8) * s, Y(8.6) * s); ctx.lineTo((tx - 2.8) * s, Y(8.6) * s);
      ctx.closePath(); ctx.fill();
    });
    // ---- OUTPUTS 영역 ----
    boxOutline(REAR.outputsBox, 'OUTPUTS');
    var b = REAR.binding, by = REAR.bindingY;
    txt(d, 'BRIDGE', 170.7, Y(84.6), 2.5, { weight: '800' });
    speakerIcon(170.7, 80.6, ['−', '+']);
    line(b[1].x, 78.2, b[1].x, 79.8); line(b[1].x, 79.8, 167.4, 79.8);
    line(b[2].x, 78.2, b[2].x, 79.8); line(b[2].x, 79.8, 174.0, 79.8);
    // DUAL 브래킷 (CH2: 왼쪽 쌍, CH1: 오른쪽 쌍)
    [[b[0].x, b[1].x, 'DUAL', ['−', '+']], [b[2].x, b[3].x, 'DUAL', ['+', '−']]].forEach(function (pr) {
      line(pr[0], 59.5, pr[0], 52.5); line(pr[1], 59.5, pr[1], 52.5);
      line(pr[0], 52.5, (pr[0] + pr[1]) / 2 - 4, 52.5); line((pr[0] + pr[1]) / 2 + 4, 52.5, pr[1], 52.5);
      txt(d, pr[2], (pr[0] + pr[1]) / 2, Y(56.4), 2.4, { weight: '800' });
      speakerIcon((pr[0] + pr[1]) / 2, 51.6, pr[3]);
    });
    bolt(172.6, 56.0); bolt(171.8, 23.4);
    [['CH2', REAR.speakon.ch2], ['CH1', REAR.speakon.ch1]].forEach(function (sp) {
      txt(d, sp[0], sp[1].x, Y(46.0), 2.6, { weight: '800' });
      // TURN TO LOCK (원호 위 텍스트 + 화살표)
      ctx.save();
      ctx.translate(sp[1].x * s, Y(sp[1].y) * s);
      var str = 'TURN TO LOCK', R = 15.6 * s, start = -2.05;
      ctx.font = '800 ' + (1.6 * s) + 'px ' + FONT; ctx.fillStyle = '#e4e4e4';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var i = 0; i < str.length; i++) {
        var a = start + i * 0.085;
        ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.fillText(str[i], 0, -R); ctx.restore();
      }
      var ae = start + str.length * 0.085;
      ctx.beginPath(); ctx.moveTo(Math.cos(ae) * (R + 1.4 * s), Math.sin(ae) * (R + 1.4 * s));
      ctx.lineTo(Math.cos(ae + 0.14) * R, Math.sin(ae + 0.14) * R);
      ctx.lineTo(Math.cos(ae) * (R - 1.4 * s), Math.sin(ae) * (R - 1.4 * s)); ctx.closePath(); ctx.fill();
      ctx.fillRect(Math.cos(start - 0.2) * R - 0.9 * s, Math.sin(start - 0.2) * R - 0.9 * s, 1.8 * s, 1.8 * s);
      ctx.restore();
    });
    table(REAR.speakon.ch2.x - 6.6, 10.0, 3, [['PIN', '1+', '1-'], ['CH', '2', '2']]);
    table(REAR.speakon.ch1.x - 10.2, 10.0, 5, [['PIN', '1+', '1-', '2+', '2-'], ['CH', '1', '1', '2', '2']]);
    // ---- INPUTS 영역 ----
    boxOutline(REAR.inputsBox, 'INPUTS');
    var x1 = REAR.xlr.ch1, x2 = REAR.xlr.ch2, r1 = REAR.rca.ch1, r2 = REAR.rca.ch2;
    ctx.strokeStyle = '#e4e4e4'; ctx.lineWidth = 0.45 * s;
    ctx.beginPath(); ctx.arc(x1.x * s, Y(x1.y - 2) * s, 16 * s, 0.35, 1.25); ctx.stroke();       // CH1 호
    ctx.beginPath(); ctx.arc(x2.x * s, Y(x2.y + 2) * s, 16 * s, Math.PI + 0.35, Math.PI + 1.25); ctx.stroke(); // CH2 호
    txt(d, 'CH1', r1.x + 0.5, Y(53.6), 2.5, { weight: '800' });
    txt(d, 'CH2', r2.x - 1.5, Y(33.4), 2.5, { weight: '800' });
    var ms = REAR.modeSwitch, ss = REAR.sensSwitch;
    txt(d, 'BRIDGE', ms.x - 3.2, Y(ms.y + ms.pos.bridge + 0.4), 1.6, { align: 'right', weight: '800' });
    txt(d, 'PARALLEL', ms.x - 3.2, Y(ms.y + 0.2), 1.6, { align: 'right', weight: '800' });
    txt(d, 'STEREO', ms.x - 3.2, Y(ms.y + ms.pos.stereo), 1.6, { align: 'right', weight: '800' });
    txt(d, 'MODE', ms.x, Y(ms.y - ms.slotH / 2 - 2.2), 1.6, { weight: '800' });
    txt(d, '1.4V', ss.x - 3.2, Y(ss.y + ss.pos['1.4V']), 1.6, { align: 'right', weight: '800' });
    txt(d, '0.775V', ss.x - 3.2, Y(ss.y + ss.pos['0.775V']), 1.6, { align: 'right', weight: '800' });
    txt(d, 'SENSITIVITY', ss.x - 6.5, Y(ss.y - ss.slotH / 2 - 2.0), 1.5, { weight: '800' });
    // 6단계: speakON 보어 자리는 인쇄를 비움(데칼 평면이 보어 입구를 가리지 않게)
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    [REAR.speakon.ch1, REAR.speakon.ch2].forEach(function (sp) { ctx.beginPath(); ctx.arc(sp.x * s, Y(sp.y) * s, 12.8 * s, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    return canvasTexture(d.canvas);
  }

  function glowTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // ---------------------------------------------------------------------------
  // 부품 빌더 — 각 부품은 로컬 원점 = 장착면 위 중심, 로컬 +Z = 패널 바깥쪽
  // ---------------------------------------------------------------------------
  function buildScrew(M, name, r) {
    r = r || 2.6;
    var g = grp(name);
    var headProfile = [new THREE.Vector2(0, 1.25), new THREE.Vector2(r * 0.55, 1.2), new THREE.Vector2(r * 0.9, 0.95),
      new THREE.Vector2(r, 0.5), new THREE.Vector2(r, 0)];
    var lg = latheZ(headProfile, 24);
    g.add(mk(lg, M.screw, name + '.head'));
    var c1 = mk(new THREE.BoxGeometry(r * 1.1, 0.45, 0.5), M.hole, name + '.recessA', { cast: false });
    setPosMM(c1, 0, 0, 1.05);
    var c2 = c1.clone(); c2.name = NS + '.' + name + '.recessB'; c2.rotation.z = Math.PI / 2;
    g.add(c1, c2);
    g.userData.mountRadiusMM = r;
    g.userData.footprintMM = [{ c: [0, 0], r: r }];
    return g;
  }

  function buildKnob(M, name) {
    var g = grp(name); // 회전 피벗 = 노브 중심축(로컬 Z)
    var prof = [
      new THREE.Vector2(0, 14.5), new THREE.Vector2(7.6, 14.5), new THREE.Vector2(8.9, 14.2),
      new THREE.Vector2(9.7, 13.3), new THREE.Vector2(10.0, 12.0), new THREE.Vector2(10.2, 2.4),
      new THREE.Vector2(10.9, 1.6), new THREE.Vector2(10.9, 0.0), new THREE.Vector2(0, 0.0)
    ];
    var lg = latheZ(prof, 48);
    var body = mk(lg, M.knob, name + '.body');
    g.add(body);
    // 미세 그립 홈(세로 리브) — 측면 입체감
    var ribGeo = new THREE.BoxGeometry(0.5, 0.35, 9.0);
    for (var i = 0; i < 36; i++) {
      var a = i / 36 * Math.PI * 2;
      var rib = new THREE.Mesh(toM(ribGeo.clone()), M.knob);
      rib.name = NS + '.' + name + '.rib' + i;
      rib.position.set(Math.cos(a) * 10.15 * MM, Math.sin(a) * 10.15 * MM, 7.4 * MM);
      rib.rotation.z = a;
      rib.castShadow = false; rib.receiveShadow = true;
      g.add(rib);
    }
    // 포인터 점 (사진 기준: 윗면 가장자리의 흰 점)
    var ptr = mk(cylZ(0.75, 0.75, 0.25, 16), M.white, name + '.pointer', { cast: false });
    setPosMM(ptr, 0, 6.9, 14.5);
    g.add(ptr);
    return g;
  }

  function buildLed(M, name, hex, glowTex) {
    var g = grp(name);
    var housing = mk(cylZ(2.15, 2.15, 0.5, 24), M.blackPlastic, name + '.bezel');
    g.add(housing);
    var lensMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex).multiplyScalar(0.25), emissive: new THREE.Color(hex), emissiveIntensity: 0.0,
      roughness: 0.15, metalness: 0.0, transparent: true, opacity: 0.95
    });
    var lensGeo = new THREE.SphereGeometry(1.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    lensGeo.rotateX(Math.PI / 2); lensGeo.scale(1, 1, 0.55); lensGeo.translate(0, 0, 0.5);
    var lens = mk(lensGeo, lensMat, name + '.lens', { cast: false });
    g.add(lens);
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: new THREE.Color(hex), blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, opacity: 0.9
    }));
    glow.name = NS + '.' + name + '.glow';
    glow.scale.set(9 * MM, 9 * MM, 1);
    setPosMM(glow, 0, 0, 1.6);
    glow.visible = false;
    g.add(glow);
    hide(g.userData, 'led', { lens: lens, glow: glow, color: hex, on: false });
    return g;
  }
  function setLedState(ledGroup, on) {
    var u = ledGroup.userData.led;
    u.on = !!on;
    u.lens.material.emissiveIntensity = on ? 1.15 : 0.0;
    u.lens.material.color.set(u.color).multiplyScalar(on ? 0.35 : 0.18);
    u.glow.visible = !!on;
  }

  function buildPowerSwitch(M, name) {
    var g = grp(name);
    // 플레이트 위에 올라앉은 원형 베젤(외경 13.2mm) + 우물 바닥 → 버튼이 눌려도 판면 아래로 들어가지 않음
    var collarShape = circlePath(new THREE.Shape(), 0, 0, 6.6);
    collarShape.holes.push(circlePath(new THREE.Path(), 0, 0, 5.15));
    var ring = mk(extrude(collarShape, 2.2, 0.4, 32), M.darkMetal, name + '.collar');
    g.add(ring);
    var cupBack = mk(cylZ(5.15, 5.15, 0.4, 32), M.hole, name + '.well', { cast: false });
    g.add(cupBack);
    var capProf = [new THREE.Vector2(0, 3.6), new THREE.Vector2(3.9, 3.6), new THREE.Vector2(4.6, 3.2),
      new THREE.Vector2(4.85, 2.5), new THREE.Vector2(4.85, 0), new THREE.Vector2(0, 0)];
    var lg = latheZ(capProf, 40);
    var cap = mk(lg, M.blackPlastic, name + '.cap');
    cap.userData.baseZmm = 0.4; // 우물 바닥 위
    g.add(cap);
    hide(g.userData, 'cap', cap);
    return g;
  }

  // 후면 단자들 -------------------------------------------------------------------
  // XLR 3핀 암 입력 — 2026-10-14(프로젝트 통합)에서 실제 규격으로 수정: MG12XU·ZXA1 과 같은 XLR 암 리셉터클 치수
  //  보어 Ø20.9 · 고무 인서트 Ø16 (면에서 3mm 안) · 수 플러그 슬리브가 들어가는 둘레 홈 13mm · 소켓 구멍 3개(표준 핀 위치)
  //  바깥 모양(원형 하우징·크롬 테두리·옆 PUSH 래치)과 면 위치(faceZmm 2.4)는 유지 → 기준점 위치 변화 없음
  //  키(래치) 방향: 사진처럼 뒤에서 볼 때 왼쪽(로컬 -X). 내부를 Z 축으로 +90° 돌려 키(+Y)를 -X 로 맞춤
  var XLRF_IN = { boreR: 10.45, insertR: 8.0, insertFace: 3.0, annulus: 13.0, holeR: 1.5, holeBottom: 11.0, insertDepthMM: 12.6, plateHoleR: 10.6,
    pins: [[-4.04, 0], [4.04, 0], [0, -3.95]], keyRotZ: Math.PI / 2 };
  function buildXlrFemale(M, name) {
    var X = XLRF_IN, g = grp(name), top = 2.4;
    var flangeShape = circlePath(new THREE.Shape(), 0, 0, 11.4);
    flangeShape.holes.push(circlePath(new THREE.Path(), 0, 0, X.boreR));
    g.add(mk(extrude(flangeShape, top, 0.35, 32), M.darkMetal, name + '.housing'));
    var rim = mk(new THREE.TorusGeometry(10.9, 0.4, 10, 48), M.chrome, name + '.rim');
    setPosMM(rim, 0, 0, top); g.add(rim);
    var inner = grp(name + '.inner'); inner.rotation.z = X.keyRotZ; g.add(inner); // 로컬 +Y(키) → 하우징 -X(래치 쪽)
    var wall = mk(openCylZ(X.boreR, X.annulus, 48), M.holeWallNl4, name + '.boreWall', { cast: false, receive: false }); setPosMM(wall, 0, 0, top - X.annulus); inner.add(wall);
    var fl = mk(new THREE.RingGeometry(X.insertR, X.boreR, 48), M.matteBlack, name + '.annulusFloor', { cast: false }); setPosMM(fl, 0, 0, top - X.annulus); inner.add(fl);
    var ins = circlePath(new THREE.Shape(), 0, 0, X.insertR);
    X.pins.forEach(function (p) { ins.holes.push(circlePath(new THREE.Path(), p[0], p[1], X.holeR)); });
    var insert = mk(extrude(ins, X.annulus - X.insertFace, 0, 32), M.matteBlack, name + '.insert'); setPosMM(insert, 0, 0, top - X.annulus); inner.add(insert);
    var backing = mk(new THREE.CircleGeometry(X.insertR - 0.3, 32), M.hole, name + '.backing', { cast: false }); setPosMM(backing, 0, 0, top - X.holeBottom); inner.add(backing);
    var keyTab = mk(new THREE.BoxGeometry(4.2, 1.2, 1.0), M.nickel, name + '.keyLatch'); setPosMM(keyTab, 0, X.boreR + 0.3, top - 1.6); inner.add(keyTab); // 키 쪽 걸쇠(보어 밖 가장자리)
    // 래치(PUSH 탭) — 뒤에서 봤을 때 왼쪽 (기존 사진 기준 유지)
    var latchShape = roundedRectPath(new THREE.Shape(), 0, 0, 5.0, 7.0, 1.2);
    var latch = mk(extrude(latchShape, 3.0, 0.4, 6), M.nickel, name + '.latch');
    setPosMM(latch, -13.0, 0, 0); g.add(latch);
    var latchSlot = mk(new THREE.BoxGeometry(0.6, 4.2, 0.3), M.hole, name + '.latchGroove', { cast: false });
    setPosMM(latchSlot, -13.0, 0, 3.05); g.add(latchSlot);
    g.userData.faceZmm = top;
    g.userData.footprintMM = [{ c: [0, 0], r: 11.4 }, { rect: [-15.5, -3.5, -10.5, 3.5] }];
    return g;
  }


  function buildRca(M, name, ringMat) {
    var g = grp(name);
    var nut = mk(cylZ(5.0, 5.0, 1.2, 6), M.nickel, name + '.nut'); g.add(nut);
    var ringShape = circlePath(new THREE.Shape(), 0, 0, 4.4);
    ringShape.holes.push(circlePath(new THREE.Path(), 0, 0, 3.3));
    var ring = mk(extrude(ringShape, 2.2, 0.3, 24), ringMat, name + '.colorRing');
    setPosMM(ring, 0, 0, 1.2); g.add(ring);
    var shellShape = circlePath(new THREE.Shape(), 0, 0, 3.3);
    shellShape.holes.push(circlePath(new THREE.Path(), 0, 0, 2.55));
    var shell = mk(extrude(shellShape, 8.5, 0.2, 24), M.nickel, name + '.shell');
    setPosMM(shell, 0, 0, 1.2); g.add(shell);
    var insul = mk(cylZ(2.55, 2.55, 7.2, 24), M.blackPlastic, name + '.insulator');
    setPosMM(insul, 0, 0, 1.2); g.add(insul);
    var pinHole = mk(cylZ(0.8, 0.8, 0.2, 16), M.hole, name + '.centerHole', { cast: false });
    setPosMM(pinHole, 0, 0, 8.4); g.add(pinHole);
    g.userData.faceZmm = 9.7;
    g.userData.footprintMM = [{ c: [0, 0], r: 5.0 }];
    return g;
  }

  // speakON NL4MP 섀시 단자 — 6단계에서 실제 규격으로 수정 (ZX1 과 같은 NL4 내부 치수 → speakON 케이블 플러그가 형상 그대로 결합)
  //  - 바깥 모양(검은 원형 플랜지·통, 위쪽 은색 탭)은 기존 사진 기준 유지, 면 위치(faceZmm 5.8)도 유지 → 기준점 위치 변화 없음
  //  - 안쪽: 보어 Ø21.6 · 깊이 18 (후면판 구멍을 지나 섀시 안으로), 코어 Ø13 (면에서 6mm 안), 키 리브 +Y, 접점 4개 (추정 치수, ZX1 과 동일)
  var NL4 = { face: 5.8, boreR: 10.8, depth: 18.0, coreR: 6.5, coreFace: 6.0, coreHoleR: 2.4, coreHoleDepth: 4.0, plateHoleR: 11.0,
    key: { w: 5.0, h: 1.3, d1: 9.0 }, contacts: [['1+', 40], ['1-', 140], ['2+', 220], ['2-', 320]], insertDepthMM: 14.0, lockRotationDeg: 30 };
  function openCylZ(r, h, seg) { var g = new THREE.CylinderGeometry(r, r, h, seg, 1, true); g.rotateX(Math.PI / 2); g.translate(0, 0, h / 2); return g; } // 열린 원통, z 0~h (mm)
  function buildSpeakon(M, name) {
    var g = grp(name), N = NL4, top = N.face, bot = top - N.depth;
    var fl = circlePath(new THREE.Shape(), 0, 0, 12.8); fl.holes.push(circlePath(new THREE.Path(), 0, 0, N.boreR));
    g.add(mk(extrude(fl, 1.6, 0, 48), M.blackPlastic, name + '.flange')); // 원형 플랜지(사진 기준)
    var barrel = circlePath(new THREE.Shape(), 0, 0, 12.2);
    barrel.holes.push(circlePath(new THREE.Path(), 0, 0, N.boreR));
    var bar = mk(extrude(barrel, 4.2, 0.45, 32), M.blackPlastic, name + '.barrel');
    setPosMM(bar, 0, 0, 1.6); g.add(bar);
    var wallL = 1.6 - bot; // 플랜지 아래(후면판 쪽)부터 보어 바닥까지
    var wall = mk(openCylZ(N.boreR, wallL, 48), M.holeWallNl4, name + '.boreWall', { cast: false, receive: false }); setPosMM(wall, 0, 0, bot); g.add(wall);
    var floor = mk(new THREE.RingGeometry(N.coreR, N.boreR, 48), M.matteBlack, name + '.boreFloor', { cast: false }); setPosMM(floor, 0, 0, bot); g.add(floor);
    var core = circlePath(new THREE.Shape(), 0, 0, N.coreR); core.holes.push(circlePath(new THREE.Path(), 0, 0, N.coreHoleR));
    var coreM = mk(extrude(core, N.depth - N.coreFace, 0, 36), M.blackPlastic, name + '.hub'); setPosMM(coreM, 0, 0, bot); g.add(coreM);
    var hw = mk(openCylZ(N.coreHoleR, N.coreHoleDepth, 24), M.holeWallNl4, name + '.hubHoleWall', { cast: false, receive: false }); setPosMM(hw, 0, 0, top - N.coreFace - N.coreHoleDepth); g.add(hw);
    var hubHole = mk(new THREE.CircleGeometry(N.coreHoleR, 24), M.hole, name + '.hubHole', { cast: false });
    setPosMM(hubHole, 0, 0, top - N.coreFace - N.coreHoleDepth); g.add(hubHole);
    // 키 리브 (+Y) — 케이블 플러그 키 홈이 지나감
    var kb = mk(new THREE.BoxGeometry(N.key.w, N.key.h, N.key.d1), M.blackPlastic, name + '.keyRib');
    setPosMM(kb, 0, N.boreR - N.key.h / 2, top - N.key.d1 / 2); g.add(kb);
    // 접점 4개 (코어 둘레, 각도 = ZX1 과 같음 → 잠근 플러그 접점과 겹침)
    N.contacts.forEach(function (c) {
      var a = c[1] * Math.PI / 180, rr = N.coreR + 0.15;
      var cb = mk(new THREE.BoxGeometry(2.4, 0.3, 7.0), M.nickel, name + '.contact' + c[0].replace('+', 'P').replace('-', 'N'), { cast: false });
      cb.position.set(Math.cos(a) * rr * MM, Math.sin(a) * rr * MM, (top - N.coreFace - 2.0 - 3.5) * MM); cb.rotation.z = a - Math.PI / 2; g.add(cb);
    });
    // 위쪽 은색 탭(사진) — 보어 밖, 통 테두리 위로 옮김
    var latch = mk(new THREE.BoxGeometry(3.2, 1.6, 1.2), M.nickel, name + '.latch');
    setPosMM(latch, 0, 12.0, 5.2); g.add(latch);
    g.userData.faceZmm = top;
    g.userData.footprintMM = [{ c: [0, 0], r: 12.8 }];
    return g;
  }

  function lobedShape(R, depthRatio, lobes, holeR) {
    var s = new THREE.Shape();
    var N = lobes * 12;
    for (var i = 0; i <= N; i++) {
      var a = i / N * Math.PI * 2;
      var r = R * (1 - depthRatio * Math.pow(Math.max(0, Math.cos(lobes * a)), 6));
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    if (holeR) s.holes.push(circlePath(new THREE.Path(), 0, 0, holeR));
    return s;
  }

  function buildBindingPost(M, name, color) {
    var g = grp(name);
    // 로컬 z=0 = 절연 스트립 바깥면. 너트(0~1.2) → 나사축(0~10.5) → 캡(10~19)이 연속으로 맞물림
    var washer = mk(cylZ(4.6, 4.6, 1.2, 6), M.nickel, name + '.nut');
    g.add(washer);
    var shaft = mk(cylZ(2.4, 2.4, 10.5, 20), M.nickel, name + '.shaft');
    g.add(shaft);
    var capMat = color === 'red' ? M.redPost : M.blackPost;
    var cap = mk(extrude(lobedShape(7.7, 0.14, 8, 2.1), 9.0, 0.6, 4), capMat, name + '.cap');
    setPosMM(cap, 0, 0, 10.0); g.add(cap);
    var tip = mk(cylZ(2.1, 2.1, 8.6, 16), M.nickel, name + '.contactTube');
    setPosMM(tip, 0, 0, 10.0); g.add(tip);
    var tipHole = mk(cylZ(1.2, 1.2, 0.2, 16), M.hole, name + '.wireHole', { cast: false });
    setPosMM(tipHole, 0, 0, 18.5); g.add(tipHole);
    g.userData.faceZmm = 19.0;
    return g;
  }

  // IEC 60320 C14 인렛 — 7단계(AC 케이블)에서 2·4단계(MG12XU·ZXA1)와 같은 C14 규격으로 수정
  //  개구부 25.4 x 16.6 (위쪽 두 모서리 모따기 3.5), 앞면에서 바닥까지 12mm, 핀 3개(L/N/E) 끝은 앞면에서 3mm 안 → C13 플러그가 10mm 들어감
  //  바깥 테두리 크기(31.7 x 22.9)와 앞면 위치(faceZmm 2.0)는 기존 값 유지 → 기준점 위치 변화 없음
  var IEC_C14 = { openW: 25.4, openH: 16.6, chamfer: 3.5, face: 2.0, depth: 12.0, pinTipDepth: 3.0,
    pins: [['L', -7.0, -2.9, 1.8, 4.4], ['N', 7.0, -2.9, 1.8, 4.4], ['E', 0, 2.1, 1.8, 3.6]], insertDepthMM: 10.0 };
  function buildIecInlet(M, name) {
    var I = REAR.iec, C = IEC_C14;
    var g = grp(name);
    var ow = C.openW / 2, oh = C.openH / 2, ch = C.chamfer;
    var openPts = [[-ow, -oh], [ow, -oh], [ow, oh - ch], [ow - ch, oh], [-ow + ch, oh], [-ow, oh - ch]];
    var outer = roundedRectPath(new THREE.Shape(), 0, 0, I.w, I.h, 2.0);
    outer.holes.push(polyPath(new THREE.Path(), openPts));
    var bot = C.face - C.depth;
    var housing = mk(extrude(outer, C.face - bot, 0.4, 6), M.blackPlastic, name + '.housing');
    setPosMM(housing, 0, 0, bot); // 후면판 안쪽으로 10mm, 바깥으로 2mm
    g.add(housing);
    var floor = mk(extrude(polyPath(new THREE.Shape(), openPts), 1.0, 0, 6), M.matteBlack, name + '.floor');
    setPosMM(floor, 0, 0, bot); g.add(floor);
    C.pins.forEach(function (p) {
      var len = (C.face - C.pinTipDepth) - (bot + 1.0);
      var pin = mk(new THREE.BoxGeometry(p[3], p[4], len), M.nickel, name + '.pin' + p[0]);
      setPosMM(pin, p[1], p[2], bot + 1.0 + len / 2); g.add(pin);
    });
    g.userData.faceZmm = C.face;
    g.userData.footprintMM = [{ rect: [-I.w / 2, -I.h / 2, I.w / 2, I.h / 2] }];
    return g;
  }

  function buildResetBreaker(M, name) {
    var g = grp(name);
    var bezelGeo = new THREE.CylinderGeometry(9.0, 9.0, 2.6, 30); // 각진 30면 = 널링 느낌
    bezelGeo.rotateX(Math.PI / 2); bezelGeo.translate(0, 0, 1.3);
    var bz = mk(bezelGeo, M.blackPlastic, name + '.bezel');
    g.add(bz);
    var inner = mk(cylZ(6.2, 6.2, 0.3, 32), M.matteBlack, name + '.face');
    setPosMM(inner, 0, 0, 2.6); g.add(inner);
    var btnProf = [new THREE.Vector2(0, 3.0), new THREE.Vector2(3.3, 2.9), new THREE.Vector2(4.0, 2.4), new THREE.Vector2(4.0, 0), new THREE.Vector2(0, 0)];
    var bg = latheZ(btnProf, 32);
    var btn = mk(bg, M.knob, name + '.button');
    setPosMM(btn, 0, 0, 2.9); g.add(btn);
    g.userData.footprintMM = [{ c: [0, 0], r: 9.0 }];
    return g;
  }

  function buildSlideSwitch(M, name, slotH) {
    var g = grp(name);
    var slot = mk(extrude(roundedRectPath(new THREE.Shape(), 0, 0, 4.8, slotH, 0.8), 0.6, 0.1, 4), M.matteBlack, name + '.slot');
    g.add(slot);
    var slotFloor = mk(new THREE.BoxGeometry(3.4, slotH - 1.4, 0.1), M.hole, name + '.slotFloor', { cast: false });
    setPosMM(slotFloor, 0, 0, 0.62); g.add(slotFloor);
    var act = grp(name + '.actuator');
    var body = mk(extrude(roundedRectPath(new THREE.Shape(), 0, 0, 3.2, 3.4, 0.5), 3.0, 0.3, 4), M.blackPlastic, name + '.actuatorBody');
    act.add(body);
    for (var i = -1; i <= 1; i++) {
      var ridge = mk(new THREE.BoxGeometry(3.0, 0.35, 0.3), M.matteBlack, name + '.ridge' + (i + 2), { cast: false });
      setPosMM(ridge, 0, i * 0.9, 3.05); act.add(ridge);
    }
    g.add(act);
    hide(g.userData, 'actuator', act);
    g.userData.footprintMM = [{ rect: [-2.4, -slotH / 2, 2.4, slotH / 2] }];
    return g;
  }

  function buildFan(M, name) {
    var g = grp(name);
    var frame = roundedRectPath(new THREE.Shape(), 0, 0, 80, 80, 4);
    frame.holes.push(circlePath(new THREE.Path(), 0, 0, 38.5));
    var fm = mk(extrude(frame, 25, 0.5, 24), M.fanBlade, name + '.frame');
    setPosMM(fm, 0, 0, -25); g.add(fm);
    var hub = mk(cylZ(14, 14, 14, 32), M.fanBlade, name + '.hub');
    setPosMM(hub, 0, 0, -20); g.add(hub);
    var sticker = mk(cylZ(12, 12, 0.2, 32), M.darkMetal, name + '.hubLabel', { cast: false });
    setPosMM(sticker, 0, 0, -6.0); g.add(sticker);
    var blades = grp(name + '.rotor');
    for (var i = 0; i < 7; i++) {
      var bGeo = new THREE.BoxGeometry(23, 15, 0.9);
      bGeo.translate(25.5, 0, 0);
      var b = mk(bGeo, M.fanBlade, name + '.blade' + (i + 1));
      b.rotation.set(0.45, 0, i / 7 * Math.PI * 2, 'ZXY');
      blades.add(b);
    }
    setPosMM(blades, 0, 0, -13);
    g.add(blades);
    hide(g.userData, 'rotor', blades);
    return g;
  }

  // ---------------------------------------------------------------------------
  // 메인 빌더
  // ---------------------------------------------------------------------------
  function create(options) {
    var opt = options || {};
    var M = makeMaterials();
    var glowTex = glowTexture();

    var root = new THREE.Group();
    root.name = NS + 'Root';
    var parts = {};
    function reg(key, obj) { parts[key] = obj; return obj; }

    // ===== 본체(섀시) ===========================================================
    var chassis = reg('chassis', grp('chassis'));
    root.add(chassis);
    var bodyDepth = DIM.depth - DIM.bezelDepth;          // 307
    var bodyZc = ZR + bodyDepth / 2;
    var t = DIM.sheet;
    // 상판: 좌우로 접힌 립까지 포함한 U형 커버 (모서리 두께감)
    var topShape = new THREE.Shape();
    var hw = HALF_BW;
    topShape.moveTo(-hw, DIM.height - 7); topShape.lineTo(-hw, DIM.height - 1.5);
    topShape.quadraticCurveTo(-hw, DIM.height, -hw + 1.5, DIM.height);
    topShape.lineTo(hw - 1.5, DIM.height); topShape.quadraticCurveTo(hw, DIM.height, hw, DIM.height - 1.5);
    topShape.lineTo(hw, DIM.height - 7); topShape.lineTo(hw - t, DIM.height - 7); topShape.lineTo(hw - t, DIM.height - t);
    topShape.lineTo(-hw + t, DIM.height - t); topShape.lineTo(-hw + t, DIM.height - 7); topShape.closePath();
    var topGeo = new THREE.ExtrudeGeometry(topShape, { depth: bodyDepth, bevelEnabled: false, curveSegments: 4 });
    var topCover = mk(topGeo, M.chassis, 'topCover');
    setPosMM(topCover, 0, 0, ZR); chassis.add(topCover);
    var bottom = mk(new THREE.BoxGeometry(DIM.bodyWidth, t, bodyDepth), M.chassis, 'bottomPan');
    setPosMM(bottom, 0, t / 2, bodyZc); chassis.add(bottom);
    [-1, 1].forEach(function (sg) {
      var side = mk(new THREE.BoxGeometry(t, DIM.height - 7 - t + 0.01, bodyDepth), M.chassis, sg < 0 ? 'sidePanelLeft' : 'sidePanelRight');
      setPosMM(side, sg * (hw - t / 2), t + (DIM.height - 7 - t) / 2, bodyZc); chassis.add(side);
      // 측판 하단의 접힌 리브(명암 변화용)
      var rib = mk(new THREE.BoxGeometry(0.6, 2.0, bodyDepth - 20), M.chassis, sg < 0 ? 'sideRibLeft' : 'sideRibRight');
      setPosMM(rib, sg * (hw + 0.3), 12, bodyZc - 4); chassis.add(rib);
    });
    // 상판 고정 나사 (위치 추정)
    [-1, 1].forEach(function (sg) {
      [-125, -10, 105].forEach(function (z, i) {
        var s = buildScrew(M, 'topScrew' + (sg < 0 ? 'L' : 'R') + (i + 1), 2.3);
        s.rotation.x = -Math.PI / 2; // 로컬 +Z -> 월드 +Y
        setPosMM(s, sg * (hw - 9), DIM.height, z);
        chassis.add(s);
      });
    });
    // 내부 차광 블록 (통풍구/팬 그릴 너머로 반대편이 비치지 않도록)
    var inD = (ZF - DIM.bezelDepth - 12) - (ZR + 32);
    var interior = mk(new THREE.BoxGeometry(DIM.bodyWidth - 6, DIM.height - 6, inD), M.interior, 'interior', { cast: false });
    setPosMM(interior, 0, DIM.height / 2, (ZR + 32) + inD / 2); chassis.add(interior);

    // ===== 전면 패널 ===========================================================
    var front = reg('frontPanel', grp('frontPanel'));
    root.add(front);
    var bezelZ = ZF - DIM.bezelDepth;
    function panelPt(p, mirror) { // 패널 왼쪽끝 기준(X, 위에서 Y) -> 모델 (x, y)
      var x = -DIM.width / 2 + p[0], y = DIM.height - p[1];
      return [mirror ? -x : x, y];
    }
    var ventDefs = [];
    [false, true].forEach(function (mirror) {
      [['Upper', FRONT.ventUpper], ['Lower', FRONT.ventLower]].forEach(function (v) {
        var pts = v[1].map(function (p) { return panelPt(p, mirror); });
        if (mirror) pts.reverse();
        ventDefs.push({ name: 'vent' + v[0] + (mirror ? 'Right' : 'Left'), pts: pts });
      });
    });
    var P = FRONT.plate;
    var bezelShape = roundedRectPath(new THREE.Shape(), 0, DIM.height / 2, DIM.bodyWidth, DIM.height, 0.8);
    ventDefs.forEach(function (v) { bezelShape.holes.push(roundedPolyPath(new THREE.Path(), v.pts, 4.5)); });
    bezelShape.holes.push(roundedRectPath(new THREE.Path(), 0, P.cy, P.w + 1.2, P.h + 1.2, P.r + 0.6));
    var bezel = mk(extrude(bezelShape, DIM.bezelDepth, 1.4, 10), M.bezel, 'frontBezel');
    setPosMM(bezel, 0, 0, bezelZ); front.add(bezel);

    // 타공 그릴 (육각 구멍) — 각 통풍구 포켓 바닥
    var ventGroup = reg('frontVents', grp('frontVents'));
    front.add(ventGroup);
    ventDefs.forEach(function (v) {
      var outline = v.pts;
      var cxs = outline.map(function (p) { return p[0]; }), cys = outline.map(function (p) { return p[1]; });
      var minX = Math.min.apply(null, cxs), maxX = Math.max.apply(null, cxs);
      var minY = Math.min.apply(null, cys), maxY = Math.max.apply(null, cys);
      // 그릴판: 개구부보다 3mm 크게(베젤 뒤에 가려지는 부분)
      var cx0 = (minX + maxX) / 2, cy0 = (minY + maxY) / 2;
      var big = outline.map(function (p) {
        var dx = p[0] - cx0, dy = p[1] - cy0, l = Math.hypot(dx, dy) || 1;
        return [p[0] + dx / l * 3.0, p[1] + dy / l * 3.0];
      });
      var sh = roundedPolyPath(new THREE.Shape(), big, 4);
      var holeR = 2.05, pitchX = 4.75, pitchY = 4.1, n = 0;
      for (var row = 0, y = minY + 2; y < maxY; row++, y += pitchY) {
        for (var x = minX + (row % 2 ? pitchX / 2 : 0); x < maxX; x += pitchX) {
          if (pointInPoly(x, y, outline) && distToPoly(x, y, outline) > holeR + 1.4) {
            var hp = new THREE.Path();
            for (var k = 0; k <= 6; k++) {
              var a = k / 6 * Math.PI * 2;
              var px = x + Math.cos(a) * holeR, py = y + Math.sin(a) * holeR;
              if (k === 0) hp.moveTo(px, py); else hp.lineTo(px, py);
            }
            sh.holes.push(hp); n++;
          }
        }
      }
      var grille = mk(extrude(sh, 0.8, 0, 4), M.perforated, v.name + 'Grille');
      setPosMM(grille, 0, 0, bezelZ - 0.85);
      grille.userData.holeCount = n;
      ventGroup.add(grille);
    });

    // 랙 귀 (좌/우) — 슬롯형 고정 나사 구멍 2개씩
    ['Left', 'Right'].forEach(function (side) {
      var sg = side === 'Left' ? -1 : 1;
      var earW = (DIM.width - DIM.bodyWidth) / 2; // 21.5
      var cx = sg * (HALF_BW + earW / 2);
      var es = new THREE.Shape();
      // 바깥쪽 모서리만 둥글게
      var xi = sg * HALF_BW, xo = sg * (DIM.width / 2), r = 2.5;
      var pts = sg < 0
        ? [[xi, 0], [xi, DIM.height], [xo + r, DIM.height], [xo, DIM.height - r], [xo, r], [xo + r, 0]]
        : [[xi, 0], [xo - r, 0], [xo, r], [xo, DIM.height - r], [xo - r, DIM.height], [xi, DIM.height]];
      polyPath(es, pts);
      var holes = [];
      FRONT.earHoleY.forEach(function (hy, i) {
        var hx = sg * (DIM.width / 2 - FRONT.earHoleInset);
        es.holes.push(roundedRectPath(new THREE.Path(), hx, hy, 9.5, 6.5, 3.2));
        holes.push([hx, hy]);
      });
      var ear = grp('rackEar' + side);
      var earMesh = mk(extrude(es, 4.0, 0.6, 8), M.bezel, 'rackEar' + side + '.plate');
      setPosMM(earMesh, 0, 0, ZF - 4.0);
      ear.add(earMesh);
      ear.userData.holeCentersMM = holes;
      front.add(reg('rackEar' + side, ear));
    });

    // 중앙 컨트롤 플레이트 (베젤보다 1.5mm 안쪽으로 들어간 별도 패널 → 경계선이 드러남)
    var plateFrontZ = ZF - 1.5;
    var plate = mk(extrude(roundedRectPath(new THREE.Shape(), 0, P.cy, P.w, P.h, P.r), 4.0, 0.7, 10), M.plate, 'controlPlate');
    setPosMM(plate, 0, 0, plateFrontZ - 4.0); front.add(reg('controlPlate', plate));
    var frontDecal = mk(new THREE.PlaneGeometry(P.w, P.h), decalMaterial(buildFrontDecalTexture()), 'frontPrint', { cast: false });
    setPosMM(frontDecal, 0, P.cy, plateFrontZ + 0.06); front.add(reg('frontPrint', frontDecal));

    // 로고 엠블럼 (크롬 링 + 문양 디스크)
    var emblem = grp('logoEmblem');
    var embRim = mk(new THREE.TorusGeometry(FRONT.emblem.r - 0.6, 0.65, 12, 48), M.chrome, 'logoEmblem.rim');
    setPosMM(embRim, 0, 0, 0.55); emblem.add(embRim);
    var embDisc = mk(cylZ(FRONT.emblem.r - 1.0, FRONT.emblem.r - 1.0, 0.7, 40), M.knob, 'logoEmblem.disc');
    emblem.add(embDisc);
    // 문양은 평면 UV를 가진 원판(CircleGeometry)에 입혀 방향이 정확하게 나오도록 함
    var embFace = mk(new THREE.CircleGeometry(FRONT.emblem.r - 1.0, 40), new THREE.MeshStandardMaterial({
      map: buildEmblemTexture(), roughness: 0.3, metalness: 0.1 }), 'logoEmblem.face', { cast: false });
    setPosMM(embFace, 0, 0, 0.72);
    emblem.add(embFace);
    setPosMM(emblem, FRONT.emblem.x, FRONT.emblem.y, plateFrontZ);
    front.add(reg('logoEmblem', emblem));

    // 레벨 노브
    var knobs = [];
    [1, 2].forEach(function (ch) {
      var k = buildKnob(M, 'gainKnobCh' + ch);
      setPosMM(k, (ch === 1 ? -1 : 1) * FRONT.knobX, FRONT.knobY, plateFrontZ);
      front.add(reg('gainKnobCh' + ch, k));
      knobs.push(k);
    });
    // 전원 스위치 + 전원 LED
    var ps = buildPowerSwitch(M, 'powerSwitch');
    setPosMM(ps, FRONT.powerSwitch.x, FRONT.powerSwitch.y, plateFrontZ);
    front.add(reg('powerSwitch', ps));
    var pled = buildLed(M, 'powerLed', 0x2f6bff, glowTex);
    setPosMM(pled, FRONT.powerLed.x, FRONT.powerLed.y, plateFrontZ);
    front.add(reg('powerLed', pled));
    // 채널 LED (FAULT 빨강 / CLIP 노랑 / SIGNAL 초록 — 매뉴얼 기준)
    var ledColors = { fault: 0xff2414, clip: 0xffc21a, signal: 0x36ff3a };
    var leds = { 1: {}, 2: {} };
    [1, 2].forEach(function (ch) {
      ['fault', 'clip', 'signal'].forEach(function (kind) {
        var nm = kind + 'LedCh' + ch;
        var l = buildLed(M, nm, ledColors[kind], glowTex);
        setPosMM(l, (ch === 1 ? -1 : 1) * FRONT.ledX, FRONT.ledY[kind], plateFrontZ);
        front.add(reg(nm, l));
        leds[ch][kind] = l;
      });
    });

    // ===== 후면 패널 ===========================================================
    var rear = reg('rearPanel', grp('rearPanel'));
    root.add(rear);
    var rpShape = new THREE.Shape();
    roundedRectPath(rpShape, 0, DIM.height / 2, DIM.bodyWidth - 2 * t, DIM.height - 2 * t, 0.5);
    // 팬 그릴 슬롯 (판금 타공)
    REAR.fans.forEach(function (f) {
      var fx = rx(f.x), fy = f.y;
      REAR.fanRings.forEach(function (rr, ri) {
        var segs = 8, rm = (rr[0] + rr[1]) / 2, web = 2.8, rc = (rr[1] - rr[0]) / 2;
        for (var s2 = 0; s2 < segs; s2++) {
          var mid = (s2 + 0.5) / segs * Math.PI * 2;
          var half = Math.PI / segs - (web / 2 + rc) / rm;
          rpShape.holes.push(arcSlotPath(fx, fy, rr[0], rr[1], mid - half, mid + half));
        }
      });
    });
    // 리셋 버튼 좌우 통풍 슬롯
    REAR.resetSlots.xs.forEach(function (sx) {
      REAR.resetSlots.ys.forEach(function (sy) {
        rpShape.holes.push(roundedRectPath(new THREE.Path(), rx(sx), sy, REAR.resetSlots.w, REAR.resetSlots.h, 1.5));
      });
    });
    // XLR 입력 보어가 지나가는 구멍 (하우징이 덮음)
    [REAR.xlr.ch1, REAR.xlr.ch2].forEach(function (xp) { rpShape.holes.push(circlePath(new THREE.Path(), rx(xp.x), xp.y, XLRF_IN.plateHoleR)); });
    // speakON 단자 보어가 지나가는 구멍 (플랜지가 덮음)
    [REAR.speakon.ch1, REAR.speakon.ch2].forEach(function (sp) { rpShape.holes.push(circlePath(new THREE.Path(), rx(sp.x), sp.y, NL4.plateHoleR)); });
    // IEC 인렛 장착 구멍
    rpShape.holes.push(roundedRectPath(new THREE.Path(), rx(REAR.iec.x), REAR.iec.y, REAR.iec.w, REAR.iec.h, 2.0));
    var rearPlate = mk(extrude(rpShape, 1.5, 0, 10), M.rearPlate, 'rearPlate');
    setPosMM(rearPlate, 0, 0, ZR); rear.add(reg('rearPlate', rearPlate));

    var rearDecal = mk(new THREE.PlaneGeometry(DIM.bodyWidth, DIM.height), decalMaterial(buildRearDecalTexture()), 'rearPrint', { cast: false });
    rearDecal.rotation.y = Math.PI;
    setPosMM(rearDecal, 0, DIM.height / 2, ZR - 0.06);
    rear.add(reg('rearPrint', rearDecal));

    // 후면 부품 장착 헬퍼: 뒤에서 본 좌표(Xr, Y) -> 후면판 바깥면에 붙이고 로컬 +Z가 -Z(바깥)을 보게 함
    function mountRear(obj, xr, y, zOffMM) {
      obj.rotation.y = Math.PI;
      setPosMM(obj, rx(xr), y, ZR - (zOffMM || 0));
      rear.add(obj);
      return obj;
    }

    // 냉각 팬 (그릴 뒤 내부)
    REAR.fans.forEach(function (f, i) {
      var fan = buildFan(M, 'coolingFan' + (i + 1));
      // 팬 로컬 z<0 이 안쪽 → 후면판 안쪽면(ZR+1.5)에서 시작
      // 팬 로컬 -Z(프레임 25mm)가 섀시 안쪽을 향함. 프레임 바깥면이 후면판 안쪽면에 밀착(나사 고정 구조)
      mountRear(fan, f.x, f.y, -1.5);
      reg('coolingFan' + (i + 1), fan);
    });

    var reset = mountRear(buildResetBreaker(M, 'resetBreaker'), REAR.reset.x, REAR.reset.y);
    reg('resetBreaker', reset);
    var iec = mountRear(buildIecInlet(M, 'powerInlet'), REAR.iec.x, REAR.iec.y);
    reg('powerInlet', iec);

    var xlr1 = mountRear(buildXlrFemale(M, 'inputXlrCh1'), REAR.xlr.ch1.x, REAR.xlr.ch1.y); reg('inputXlrCh1', xlr1);
    var xlr2 = mountRear(buildXlrFemale(M, 'inputXlrCh2'), REAR.xlr.ch2.x, REAR.xlr.ch2.y); reg('inputXlrCh2', xlr2);
    var rca1 = mountRear(buildRca(M, 'inputRcaCh1', M.whiteRing), REAR.rca.ch1.x, REAR.rca.ch1.y); reg('inputRcaCh1', rca1);
    var rca2 = mountRear(buildRca(M, 'inputRcaCh2', M.redRing), REAR.rca.ch2.x, REAR.rca.ch2.y); reg('inputRcaCh2', rca2);
    var sp1 = mountRear(buildSpeakon(M, 'outputSpeakonCh1'), REAR.speakon.ch1.x, REAR.speakon.ch1.y); reg('outputSpeakonCh1', sp1);
    var sp2 = mountRear(buildSpeakon(M, 'outputSpeakonCh2'), REAR.speakon.ch2.x, REAR.speakon.ch2.y); reg('outputSpeakonCh2', sp2);

    // 바인딩 포스트 (절연 스트립 + 포스트 4개)
    var bpGroup = grp('outputBindingPosts');
    var bs = REAR.bindingStrip;
    var strip = mk(extrude(roundedRectPath(new THREE.Shape(), 0, 0, bs.x1 - bs.x0, bs.y1 - bs.y0, 2.5), 3.5, 0.5, 6), M.blackPlastic, 'outputBindingPosts.strip');
    strip.rotation.y = Math.PI;
    strip.userData.footprintMM = [{ rect: [-(bs.x1 - bs.x0) / 2, -(bs.y1 - bs.y0) / 2, (bs.x1 - bs.x0) / 2, (bs.y1 - bs.y0) / 2] }];
    setPosMM(strip, rx((bs.x0 + bs.x1) / 2), (bs.y0 + bs.y1) / 2, ZR);
    bpGroup.add(strip);
    var posts = {};
    REAR.binding.forEach(function (b) {
      var post = buildBindingPost(M, 'bindingPost' + b.id.charAt(0).toUpperCase() + b.id.slice(1), b.color);
      post.rotation.y = Math.PI;
      setPosMM(post, rx(b.x), REAR.bindingY, ZR - 3.5);
      post.userData.channel = b.ch; post.userData.polarity = b.pol;
      bpGroup.add(post);
      posts[b.id] = post;
      reg(post.name.replace(NS + '.', ''), post);
    });
    rear.add(reg('outputBindingPosts', bpGroup));

    var modeSw = mountRear(buildSlideSwitch(M, 'modeSwitch', REAR.modeSwitch.slotH), REAR.modeSwitch.x, REAR.modeSwitch.y); reg('modeSwitch', modeSw);
    var sensSw = mountRear(buildSlideSwitch(M, 'sensitivitySwitch', REAR.sensSwitch.slotH), REAR.sensSwitch.x, REAR.sensSwitch.y); reg('sensitivitySwitch', sensSw);

    var screwGroup = grp('rearScrews');
    REAR.screws.forEach(function (s3, i) {
      var sc = buildScrew(M, 'rearScrew' + (i + 1), 2.6);
      sc.rotation.y = Math.PI;
      setPosMM(sc, rx(s3[0]), s3[1], ZR);
      screwGroup.add(sc);
    });
    rear.add(reg('rearScrews', screwGroup));

    // ===== 단자 기준점(anchor) ===================================================
    // 각 단자마다 개별 Object3D. 위치 = 단자 접속면 중심, userData.normal = 로컬 바깥 방향.
    var anchorRoot = grp('portAnchors');
    root.add(anchorRoot);
    var PORT_DEFS = [
      { id: 'inputXlrCh1', type: 'xlr3-female', role: 'input', channel: 1, part: xlr1 },
      { id: 'inputXlrCh2', type: 'xlr3-female', role: 'input', channel: 2, part: xlr2 },
      { id: 'inputRcaCh1', type: 'rca-female', role: 'input', channel: 1, part: rca1 },
      { id: 'inputRcaCh2', type: 'rca-female', role: 'input', channel: 2, part: rca2 },
      { id: 'outputSpeakonCh1', type: 'speakon-nl4', role: 'output', channel: 1, part: sp1 },
      { id: 'outputSpeakonCh2', type: 'speakon-nl4', role: 'output', channel: 2, part: sp2 },
      { id: 'outputBindingCh1Pos', type: 'binding-post', role: 'output', channel: 1, polarity: '+', part: posts.ch1Pos },
      { id: 'outputBindingCh1Neg', type: 'binding-post', role: 'output', channel: 1, polarity: '-', part: posts.ch1Neg },
      { id: 'outputBindingCh2Pos', type: 'binding-post', role: 'output', channel: 2, polarity: '+', part: posts.ch2Pos },
      { id: 'outputBindingCh2Neg', type: 'binding-post', role: 'output', channel: 2, polarity: '-', part: posts.ch2Neg },
      { id: 'powerInlet', type: 'iec-c14', role: 'power', channel: null, part: iec }
    ];
    root.updateMatrixWorld(true);
    var rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    var ports = {};
    PORT_DEFS.forEach(function (d) {
      var faceZ = (d.part.userData.faceZmm || 0) * MM;
      var pLocalPart = new THREE.Vector3(0, 0, faceZ);
      var pRoot = pLocalPart.applyMatrix4(d.part.matrixWorld).applyMatrix4(rootInv);
      var q = new THREE.Quaternion();
      d.part.getWorldQuaternion(q);
      var nRoot = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
      var a = new THREE.Object3D();
      a.name = NS + '.port.' + d.id;
      a.position.copy(pRoot);
      // 앵커의 로컬 +Z가 단자 바깥 방향을 가리키도록 회전
      a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nRoot);
      a.userData = {
        portId: d.id, type: d.type, role: d.role, channel: d.channel, polarity: d.polarity || null,
        localPosition: pRoot.clone(), localNormal: nRoot.clone(), partName: d.part.name
      };
      if (d.type === 'xlr3-female') { // 프로젝트 통합 추가: XLR 케이블(수 플러그) 결합 정보. 키 = 래치 쪽(하우징 -X)
        var kq = new THREE.Quaternion(); d.part.getWorldQuaternion(kq); kq.premultiply(new THREE.Quaternion().setFromRotationMatrix(rootInv));
        var kDir = new THREE.Vector3(-1, 0, 0).applyQuaternion(kq).normalize(), xDir = new THREE.Vector3().crossVectors(kDir, nRoot);
        a.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xDir, kDir, nRoot));
        a.userData.accepts = ['xlr3-male-cable-plug']; a.userData.insertDepthMM = XLRF_IN.insertDepthMM; a.userData.keyDirection = kDir.clone();
        a.userData.pinsMM = XLRF_IN.pins.map(function (p, i) { return { n: i + 1, x: p[0], y: p[1] }; });
      }
      if (d.type === 'iec-c14') { // 7단계 추가: AC 케이블(C13) 결합 정보 (키 = 기준점 +Y = 접지 핀·모따기 쪽)
        a.userData.accepts = ['iec-c13-plug']; a.userData.insertDepthMM = IEC_C14.insertDepthMM;
        a.userData.keyDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(a.quaternion);
        a.userData.recessDepthMM = IEC_C14.depth; a.userData.openingMM = { w: IEC_C14.openW, h: IEC_C14.openH, chamfer: IEC_C14.chamfer };
        a.userData.pinsMM = IEC_C14.pins.map(function (p) { return { name: p[0], x: p[1], y: p[2] }; });
      }
      if (d.type === 'speakon-nl4') { // 6단계 추가: speakON 케이블 결합 정보 (키 = 기준점 +Y = 위쪽 은색 탭 쪽)
        a.userData.accepts = ['speakon-nl4-cable-plug']; a.userData.connectorModel = 'NL4MP';
        a.userData.insertDepthMM = NL4.insertDepthMM; a.userData.lockRotationDeg = NL4.lockRotationDeg; a.userData.lockDirection = 'clockwise-facing-port';
        a.userData.keyDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(a.quaternion);
        a.userData.boreDiameterMM = NL4.boreR * 2; a.userData.coreDiameterMM = NL4.coreR * 2; a.userData.coreFaceDepthMM = NL4.coreFace; a.userData.boreDepthMM = NL4.depth;
        a.userData.pinout = d.channel === 1 ? { '1+': 'CH1+', '1-': 'CH1-', '2+': 'CH2+', '2-': 'CH2-' } : { '1+': 'CH2+', '1-': 'CH2-', '2+': 'N.C.', '2-': 'N.C.' }; // 후면 인쇄 표
      }
      anchorRoot.add(a);
      ports[d.id] = a;
    });

    // 작은 전면 조작부는 그림자를 드리우지 않음(대형 공간 조명에서 길게 번지는 그림자 방지). 받기만 함.
    ['gainKnobCh1', 'gainKnobCh2', 'powerSwitch', 'logoEmblem'].forEach(function (k) {
      parts[k].traverse(function (n) { if (n.isMesh) n.castShadow = false; });
    });

    // ===== 상태 제어 API ========================================================
    var state = { power: true, gain: { 1: 0.45, 2: 0.45 }, mode: 'stereo', sensitivity: '1.4V',
      leds: { 1: { signal: true, clip: false, fault: false }, 2: { signal: true, clip: false, fault: false } } };
    function setGain(ch, v) {
      v = Math.max(0, Math.min(1, v));
      state.gain[ch] = v;
      knobs[ch - 1].rotation.z = (0.5 - v) * 270 * Math.PI / 180; // 0 = 7시 방향, 1 = 5시 방향
    }
    function applyLeds() {
      setLedState(pled, state.power);
      [1, 2].forEach(function (ch) {
        ['signal', 'clip', 'fault'].forEach(function (k) { setLedState(leds[ch][k], state.power && state.leds[ch][k]); });
      });
    }
    function setLed(ch, kind, on) { state.leds[ch][kind] = !!on; applyLeds(); }
    function setPower(on) {
      state.power = !!on;
      ps.userData.cap.position.z = (0.4 + (on ? 0 : 0.9)) * MM; // ON = 눌려 들어간 상태(우물 바닥에 안착), OFF = 0.9mm 튀어나옴
      applyLeds();
    }
    function setMode(m) {
      if (!(m in REAR.modeSwitch.pos)) throw new Error('mode: stereo | parallel | bridge');
      state.mode = m; modeSw.userData.actuator.position.y = REAR.modeSwitch.pos[m] * MM;
    }
    function setSensitivity(sv) {
      if (!(sv in REAR.sensSwitch.pos)) throw new Error("sensitivity: '1.4V' | '0.775V'");
      state.sensitivity = sv; sensSw.userData.actuator.position.y = REAR.sensSwitch.pos[sv] * MM;
    }
    setGain(1, state.gain[1]); setGain(2, state.gain[2]);
    setMode(opt.mode || 'stereo'); setSensitivity(opt.sensitivity || '1.4V');
    setPower(opt.power !== false);

    hide(root.userData, NS, {
      version: '1.0.0',
      dimensionsMM: { width: DIM.width, height: DIM.height, depth: DIM.depth, bodyWidth: DIM.bodyWidth },
      parts: parts, ports: ports, materials: M,
      setGain: setGain, setLed: setLed, setPower: setPower, setMode: setMode, setSensitivity: setSensitivity,
      getState: function () { return JSON.parse(JSON.stringify(state)); },
      spinFans: function (dt) { REAR.fans.forEach(function (f, i) { parts['coolingFan' + (i + 1)].userData.rotor.rotation.z += dt * 18; }); }
    });
    return root;
  }

  // ---------------------------------------------------------------------------
  // 단자 정보 조회 (장비 위치/회전 반영)
  // ---------------------------------------------------------------------------
  function findAnchor(root, portId) {
    var api = root.userData[NS];
    if (api && api.ports[portId]) return api.ports[portId];
    return root.getObjectByName(NS + '.port.' + portId) || null; // clone()된 인스턴스 대응
  }
  function getPortInfo(root, portId) {
    var a = findAnchor(root, portId);
    if (!a) return null;
    root.updateWorldMatrix(true, true);
    var wp = new THREE.Vector3(); a.getWorldPosition(wp);
    var wq = new THREE.Quaternion(); a.getWorldQuaternion(wq);
    var wn = new THREE.Vector3(0, 0, 1).applyQuaternion(wq).normalize();
    var u = a.userData;
    return {
      id: u.portId, type: u.type, role: u.role, channel: u.channel, polarity: u.polarity,
      // clone()된 인스턴스는 userData가 JSON 복사되어 {x,y,z} 평범한 객체가 되므로 copy()로 복원
      localPosition: new THREE.Vector3().copy(u.localPosition), localNormal: new THREE.Vector3().copy(u.localNormal),
      worldPosition: wp, worldNormal: wn, anchor: a,
      // 6단계 추가(다른 장비와 같은 형식): 회전·키 방향·받는 커넥터·삽입 깊이(배율 반영)
      worldQuaternion: wq.clone(), worldKeyDirection: new THREE.Vector3(0, 1, 0).applyQuaternion(wq).normalize(),
      accepts: u.accepts ? u.accepts.slice() : undefined, insertDepthMM: u.insertDepthMM,
      worldInsertDepth: u.insertDepthMM !== undefined ? u.insertDepthMM * MM * new THREE.Vector3().copy(u.localNormal).applyMatrix3(new THREE.Matrix3().setFromMatrix4(root.matrixWorld)).length() : undefined
    };
  }
  function getAllPorts(root) {
    return PORT_IDS.map(function (id) { return getPortInfo(root, id); }).filter(Boolean);
  }
  // 프로젝트 GEAR3D_PORTS_LOCAL 형식({input:{}, output:{}, power:{}})으로 변환.
  // groupOffset: 프로젝트가 모델 템플릿에 더하는 offset(바닥중앙 보정). 이 모델은 원점이 이미
  // 외곽 바닥중앙이지만 돌출부 때문에 bbox 기준 offset이 약간 생길 수 있어 그대로 더해 줍니다.
  function toGear3dPortsLocal(root, groupOffset) {
    var off = groupOffset || new THREE.Vector3();
    var out = { input: {}, output: {}, power: {} };
    PORT_IDS.forEach(function (id) {
      var a = findAnchor(root, id); if (!a) return;
      var u = a.userData;
      var p = new THREE.Vector3().copy(u.localPosition).add(off);
      out[u.role][id] = [+p.x.toFixed(5), +p.y.toFixed(5), +p.z.toFixed(5)];
    });
    return out;
  }

  var PORT_IDS = ['inputXlrCh1', 'inputXlrCh2', 'inputRcaCh1', 'inputRcaCh2', 'outputSpeakonCh1', 'outputSpeakonCh2',
    'outputBindingCh1Pos', 'outputBindingCh1Neg', 'outputBindingCh2Pos', 'outputBindingCh2Neg', 'powerInlet'];

  global.CrownXLi1500 = {
    NAMESPACE: NS,
    DIMENSIONS_MM: DIM,
    LAYOUT_MM: { front: FRONT, rear: REAR },
    PORT_IDS: PORT_IDS,
    create: create,
    getPortInfo: getPortInfo,
    getAllPorts: getAllPorts,
    toGear3dPortsLocal: toGear3dPortsLocal
  };
})(typeof window !== 'undefined' ? window : this);
