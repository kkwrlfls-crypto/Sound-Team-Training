/* =============================================================================
   Behringer X32 디지털 콘솔 — 절차적(procedural) 3D 모델  (Three.js r128 전용, 2026-11-03)
   -----------------------------------------------------------------------------
   - 전역: window.BehringerX32 = { create(), DIMENSIONS_MM, LAYOUT }
   - 단위: 내부는 mm 로 만들고 루트 그룹을 0.001 배(미터) 로 줄임.
       원점 = 바닥면 가운데,  +Y 위,  +Z 앞(조작자 쪽),  +X 앞에서 볼 때 오른쪽(화면 · 씬 쪽)
   - 근거 자료
       · 윗면 배치: Behringer 공식 제품 사진 「X32 Top」(2000×1389 px) 의 픽셀 좌표를 그대로 씀 → TOP_PX
         (가로 1965 px ≈ 891 mm, 세로 1195 px ≈ 529 mm 로 환산 — 위에서 본 투영 거리)
       · 뒷면 배치: 공식 사진 「X32 Rear」(2000×593 px) 의 픽셀 좌표 → REAR_PX
       · 기능 개수: 공식 사양(프리앰프·XLR 입력 32, XLR 출력 16, AUX IN/OUT 6, AES50 2, 모터 페이더 25, 7인치 화면 등)
   - 외곽 크기(약 891 × 529 × 199 mm)와 높이 · 경사 · 노브 · 버튼 크기 등은 판매처 표기와 사진 비례로 맞춘 추정치예요.
   - 로고(제조사 상표)는 그리지 않고, 패널 글자는 기능 이름만 씀.
   ============================================================================= */
(function (global) {
  'use strict';
  var THREE = global.THREE;
  if (!THREE) { console.error('[BehringerX32] THREE 가 먼저 로드되어야 합니다.'); return; }

  var DIM = { width: 891, depth: 529, height: 199, note: '판매처 표기·공식 사진 비례 기준 추정' };
  // 윗면 사진 픽셀 → mm
  var SX = DIM.width / 1965, SZ = DIM.depth / 1195, CXP = 982.5, CZP = 597.5;
  function X(px) { return (px - CXP) * SX; }
  function Z(py) { return (py - CZP) * SZ; }
  // 조작면(경사판): py 75 에서 높이 160, py 1040 에서 95 (사진 비례 추정)
  var ZB = Z(75), ZF = Z(1040), HB = 160, HF = 95, T = (HB - HF) / (ZF - ZB), TILT = Math.atan(T);
  function hS(z) { return HB - (z - ZB) * T; }
  // 화면 받침(포드): px x 1047–1655, y 76–426 · 뒤 높이 199, 앞 높이 148
  var POD = { x0: 1047, x1: 1655, y0: 76, y1: 426, hb: 199, hf: 148 };
  var PZB = Z(POD.y0), PZF = Z(POD.y1), PT = (POD.hb - POD.hf) / (PZF - PZB), PTILT = Math.atan(PT);
  function hP(z) { return POD.hb - (z - PZB) * PT; }
  // 뒷면 사진 픽셀 → mm (뒤에서 보면 좌우가 바뀜)
  var RSX = DIM.width / 1930, RCX = 1022;
  function XR(px) { return -(px - RCX) * RSX; }
  function HR(py) { return 18 + (445 - py) * RSX; }
  var ZBACK = -DIM.depth / 2;

  // ---- 윗면 배치 (사진 px) ----
  var STRIP_IN = [213, 267, 319, 371, 424, 476, 530, 582, 634, 686, 738, 790, 844, 895, 948, 1000];
  var STRIP_R = [1113, 1165, 1219, 1272, 1324, 1376, 1428, 1480];
  var STRIP_MAIN = 1549;
  var ROW = { select: 483, meterTop: 518, meterBot: 576, solo: 607, lcd: 654, mute: 701, fTop: 769, fBot: 1004 };
  var FADER_INIT = [0.72, 0.62, 0.45, 0.3, 0.42, 0.6, 0.75, 0.83, 0.62, 0.52, 0.4, 0.33, 0.48, 0.6, 0.7, 0.78, 0.68, 0.55, 0.48, 0.38, 0.58, 0.62, 0.7, 0.66, 0.55];
  var KNOBS = [ // [id, px, py, 지름 mm, LED 켜진 비율]
    ['preamp.gain', 195, 195, 20, 0.55], ['preamp.lcfreq', 335, 195, 20, 0.35], ['gate.thr', 190, 335, 20, 0.25], ['dyn.thr', 335, 335, 20, 0.6],
    ['eq.q', 540, 195, 20, 0.5], ['eq.freq', 600, 280, 20, 0.45], ['eq.gain', 505, 335, 20, 0.5],
    ['send.1', 760, 195, 18, 0.4], ['send.2', 760, 262, 18, 0.3], ['send.3', 760, 330, 18, 0.7], ['send.4', 760, 395, 18, 0.2],
    ['main.level', 945, 195, 18, 0.75], ['main.pan', 945, 330, 18, 0.5],
    ['monitor.level', 1714, 184, 16, 0.6], ['phones.level', 1714, 267, 16, 0.5], ['talk.level', 1825, 267, 16, 0.4],
    ['assign.1', 1625, 587, 16, 0.5], ['assign.2', 1695, 587, 16, 0.3], ['assign.3', 1765, 587, 16, 0.6], ['assign.4', 1835, 587, 16, 0.45]
  ];
  var ENC = [1111, 1168, 1225, 1282, 1339, 1397];   // 화면 아래 노브 6개 (py 362)
  var BTN = [ // [id, px, py, w mm, d mm, 켜짐 색(null=꺼짐)]
    ['preamp.48v', 165, 262, 14, 10, null], ['preamp.phase', 225, 262, 14, 10, 'yellow'], ['preamp.lowcut', 330, 262, 14, 10, 'yellow'], ['preamp.view', 378, 266, 8, 6, null],
    ['gate.on', 190, 400, 14, 10, null], ['gate.view', 258, 398, 8, 6, null], ['dyn.on', 335, 400, 14, 10, null], ['dyn.view', 395, 398, 8, 6, null],
    ['eq.mode', 480, 262, 12, 9, null], ['eq.high', 670, 225, 14, 10, 'yellow'], ['eq.himid', 670, 270, 14, 10, null], ['eq.lomid', 670, 320, 14, 10, null], ['eq.low', 670, 365, 14, 10, null],
    ['eq.on', 505, 400, 14, 10, null], ['eq.view', 705, 400, 8, 6, null],
    ['sends.1-4', 830, 225, 14, 10, null], ['sends.5-8', 830, 270, 14, 10, null], ['sends.9-12', 830, 320, 14, 10, 'yellow'], ['sends.13-16', 830, 365, 14, 10, null], ['sends.view', 855, 400, 8, 6, null],
    ['main.mono', 945, 262, 14, 10, null], ['main.stereo', 945, 400, 14, 10, 'yellow'],
    ['usb.view', 985, 108, 8, 6, 'yellow'],
    ['layer.daw', 155, 490, 14, 12, null], ['layer.in1-16', 160, 705, 14, 12, 'green'], ['layer.in17-32', 160, 760, 14, 12, null], ['layer.aux', 160, 815, 14, 12, null], ['layer.busmaster', 160, 865, 14, 12, null],
    ['sof', 1064, 499, 14, 12, null], ['layer.dca', 1064, 718, 14, 12, 'green'], ['layer.bus1-8', 1064, 778, 14, 12, null], ['layer.bus9-16', 1064, 832, 14, 12, null], ['layer.matrix', 1064, 889, 14, 12, null],
    ['monitor.mono', 1714, 346, 14, 10, 'yellow'], ['monitor.dim', 1714, 398, 14, 10, null], ['monitor.view', 1750, 398, 8, 6, null],
    ['talk.a', 1825, 346, 14, 10, null], ['talk.b', 1825, 398, 14, 10, null],
    ['scene.prev', 1632, 502, 13, 9, null], ['scene.next', 1680, 502, 13, 9, null], ['scene.undo', 1733, 502, 13, 9, null], ['scene.go', 1799, 499, 18, 14, null], ['scene.view', 1855, 510, 8, 6, null],
    ['assign.5', 1625, 708, 14, 10, null], ['assign.6', 1695, 708, 14, 10, 'yellow'], ['assign.7', 1765, 708, 14, 10, null], ['assign.8', 1835, 708, 14, 10, null],
    ['assign.9', 1625, 759, 14, 10, null], ['assign.10', 1695, 759, 14, 10, 'yellow'], ['assign.11', 1765, 759, 14, 10, 'yellow'], ['assign.12', 1835, 759, 14, 10, null],
    ['assign.setA', 1650, 808, 9, 7, 'red'], ['assign.setB', 1712, 808, 9, 7, null], ['assign.setC', 1775, 808, 9, 7, null], ['assign.view', 1855, 825, 8, 6, null],
    ['mutegrp.1', 1623, 908, 15, 11, null], ['mutegrp.2', 1674, 908, 15, 11, null], ['mutegrp.3', 1623, 953, 15, 11, 'red'], ['mutegrp.4', 1674, 953, 15, 11, null], ['mutegrp.5', 1623, 997, 15, 11, null], ['mutegrp.6', 1674, 997, 15, 11, null],
    ['main.clearsolo', 1549, 559, 14, 10, null]
  ];
  var MENU = ['HOME', 'METERS', 'ROUTING', 'SETUP', 'LIBRARY', 'EFFECTS', 'MUTE GRP', 'UTILITY'], MENU_Y = [102, 131, 160, 189, 219, 248, 277, 306], MENU_X = 1574;
  var PANELS = [ // 윗면 그림의 패널 칸 [제목, x0, y0, x1, y1]
    ['CONFIG / PREAMP', 132, 148, 405, 282], ['GATE', 132, 288, 268, 418], ['DYNAMICS', 272, 288, 405, 418], ['EQUALIZER', 414, 148, 722, 424],
    ['BUS SENDS', 728, 148, 876, 424], ['MAIN BUS', 882, 148, 1000, 424], ['USB RECORDER', 878, 58, 1003, 134],
    ['MONITOR', 1663, 55, 1767, 440], ['TALKBACK', 1771, 55, 1879, 440], ['SCENES', 1588, 458, 1877, 540], ['ASSIGN', 1588, 545, 1877, 854], ['MUTE GROUPS', 1588, 862, 1709, 1040]
  ];
  // ---- 뒷면 배치 (사진 px) ----
  var REAR_PX = {
    inX: [1803, 1745, 1686, 1628, 1569, 1511, 1453, 1394, 1287, 1228, 1170, 1111, 1053, 994, 936, 877], inY: [210, 299],   // IN 1..16 (윗줄) · IN 17..32 (아랫줄)
    outX: [787, 728, 670, 611, 553, 494, 436, 377], outY: [216, 301],                                                 // OUT 1..8 (윗줄) · 9..16 (아랫줄)
    monXlr: [[184, 216], [252, 216]], monJack: [[305, 197], [305, 235]],
    auxJack: [1799, 1743, 1684, 1625, 1568, 1426], auxRca: [1483, 1511], auxY: [366, 407],
    aes50: [[1168, 381], [1111, 381]], ultranet: [1047, 400], aesebu: [985, 391], midi: [[867, 391], [915, 391]], usbB: [737, 400], ethernet: [795, 400],
    slot: [337, 362, 705, 426], slotUsb: [595, 400], iec: [203, 381], power: [203, 340], feet: [210, 1781]
  };

  // ---------------------------------------------------------------------------
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c) { var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  var FONT = '"Noto Sans KR","Pretendard","Apple SD Gothic Neo","Malgun Gothic",Arial,sans-serif';
  function txt(g, s, x, y, size, o) { o = o || {}; g.font = (o.weight || '700') + ' ' + size + 'px ' + FONT; g.fillStyle = o.color || '#e5e7eb'; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }

  function linearize(o) {   // 색 값은 사진에서 본 sRGB 기준으로 적었으므로 선형으로 바꿔 씀 (outputEncoding = sRGB)
    Object.keys(o).forEach(function (k) { var m = o[k]; if (m && m.isMaterial) { m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); } else if (m && typeof m === 'object') linearize(m); }); return o;
  }
  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return linearize({
      body: new S({ color: 0x2c2d31, roughness: 0.5, metalness: 0.55 }),
      cheek: new S({ color: 0x141518, roughness: 0.62, metalness: 0.15 }),
      arm: new S({ color: 0x18191c, roughness: 0.75, metalness: 0.05 }),
      bottom: new S({ color: 0x101113, roughness: 0.85, metalness: 0.2 }),
      podBody: new S({ color: 0x151619, roughness: 0.4, metalness: 0.3 }),
      knob: new S({ color: 0x1a1b1d, roughness: 0.62, metalness: 0.05 }),
      knobTop: new S({ color: 0x2b2c30, roughness: 0.4, metalness: 0.2 }),
      ledOff: new S({ color: 0x3a2412, roughness: 0.5 }),
      ledOrange: new S({ color: 0xff8a1f, emissive: 0xff6a00, emissiveIntensity: 1.4, roughness: 0.4 }),
      ledGreen: new S({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 1.3, roughness: 0.4 }),
      ledYellow: new S({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 1.3, roughness: 0.4 }),
      ledRed: new S({ color: 0xf87171, emissive: 0xef4444, emissiveIntensity: 1.3, roughness: 0.4 }),
      ledDark: new S({ color: 0x1f2a22, roughness: 0.5 }),
      btn: new S({ color: 0x55585f, roughness: 0.45, metalness: 0.05 }),
      btnLit: { yellow: new S({ color: 0xe0a000, emissive: 0xff9a00, emissiveIntensity: 0.9, roughness: 0.35 }), green: new S({ color: 0x10c060, emissive: 0x00e070, emissiveIntensity: 0.8, roughness: 0.35 }),
        red: new S({ color: 0xd02020, emissive: 0xff1010, emissiveIntensity: 0.8, roughness: 0.35 }) },
      slot: new S({ color: 0x050506, roughness: 0.9 }),
      stem: new S({ color: 0x333438, roughness: 0.4, metalness: 0.7 }),
      cap: new S({ color: 0xd4d6da, roughness: 0.32, metalness: 0.05 }),
      capGroove: new S({ color: 0x9a9da3, roughness: 0.4 }),
      glass: new S({ color: 0x050608, roughness: 0.15, metalness: 0.4 }),
      nickel: new S({ color: 0xb7bbc1, roughness: 0.25, metalness: 0.9 }),
      black: new S({ color: 0x08090a, roughness: 0.7 }),
      insert: new S({ color: 0x111214, roughness: 0.6 }),
      hole: new S({ color: 0x000000, roughness: 1 }),
      latch: new S({ color: 0xc9ccd1, roughness: 0.4, metalness: 0.3 }),
      rcaRed: new S({ color: 0xb91c1c, roughness: 0.4 }), rcaWhite: new S({ color: 0xe5e7eb, roughness: 0.4 }),
      rubber: new S({ color: 0x0b0b0c, roughness: 0.95 }),
      ledRed2: new S({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.9 })
    });
  }

  // ---- 그림(텍스처) ----
  function topDecal() {   // 조작면 전체: 사진 px 100..1890 × 40..1045 → 캔버스 1790 × 1005
    var c = canvas(1790, 1005), g = c.getContext('2d'), ox = 100, oy = 40;
    function P(px) { return px - ox; } function Q(py) { return py - oy; }
    g.fillStyle = '#2f3034'; g.fillRect(0, 0, c.width, c.height);
    // 은은한 금속결
    for (var i = 0; i < 1400; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.025).toFixed(3) + ')'; g.fillRect(Math.random() * c.width, Math.random() * c.height, Math.random() * 60, 1); }
    // 뒤쪽 통풍구 줄
    g.fillStyle = '#1b1c1f'; rrect(g, P(400), Q(42), 1000, 30, 8); g.fill();
    for (var vx = 410; vx < 1395; vx += 9) for (var vy = 47; vy < 70; vy += 8) { g.fillStyle = '#0b0b0c'; g.beginPath(); g.arc(P(vx + (vy % 16 ? 4 : 0)), Q(vy), 2.6, 0, 7); g.fill(); }
    // 패널 칸
    PANELS.forEach(function (p) {
      g.fillStyle = '#1d1e21'; rrect(g, P(p[1]), Q(p[2]), p[3] - p[1], p[4] - p[2], 12); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 2; g.stroke();
      txt(g, p[0], P((p[1] + p[3]) / 2), Q(p[2] + 14), 12, { color: '#f3f4f6', weight: '800' });
    });
    txt(g, 'X32', P(450), Q(92), 46, { color: '#f1f1f1', weight: '900', align: 'left' });
    // 노브·버튼 이름
    [['GAIN', 195, 228], ['FREQUENCY', 335, 228], ['48V', 165, 279], ['Ø', 225, 279], ['LOW CUT', 330, 279], ['THRESHOLD', 190, 368], ['GATE / DUCKER', 190, 414], ['THRESHOLD', 335, 368], ['COMP / EXP', 335, 414],
     ['Q', 540, 168], ['FREQ', 600, 312], ['GAIN', 505, 368], ['MODE', 480, 279], ['HIGH', 700, 225], ['HIGH MID', 706, 270], ['LOW MID', 706, 320], ['LOW', 700, 365], ['EQUALIZER', 505, 416],
     ['1', 795, 195], ['2', 795, 262], ['3', 795, 330], ['4', 795, 395], ['1–4', 858, 225], ['5–8', 858, 270], ['9–12', 858, 320], ['13–16', 858, 365],
     ['LEVEL', 945, 228], ['MONO BUS', 945, 279], ['PAN / BAL', 945, 362], ['STEREO BUS', 945, 416],
     ['MONITOR LEVEL', 1714, 212], ['PHONES LEVEL', 1714, 295], ['MONO', 1714, 362], ['DIM', 1714, 414], ['LAMP', 1855, 95], ['EXT MIC', 1825, 212], ['TALK LEVEL', 1825, 295], ['TALK A', 1825, 362], ['TALK B', 1825, 414],
     ['PREV', 1632, 520], ['NEXT', 1680, 520], ['UNDO', 1733, 520], ['GO', 1799, 522],
     ['SET', 1610, 808], ['A', 1650, 822], ['B', 1712, 822], ['C', 1775, 822],
     ['DAW REMOTE', 155, 510], ['CH 1–16', 160, 724], ['CH 17–32', 160, 779], ['AUX IN / USB', 160, 834], ['BUS MASTER', 160, 884],
     ['SENDS ON FADER', 1064, 520], ['GROUP DCA 1–8', 1064, 737], ['BUS 1–8', 1064, 797], ['BUS 9–16', 1064, 851], ['MATRIX / MAIN C', 1064, 908], ['MAIN', STRIP_MAIN, 1036], ['CLEAR SOLO', STRIP_MAIN, 575]
    ].forEach(function (l) { txt(g, l[0], P(l[1]), Q(l[2]), 9, { color: '#d1d5db' }); });
    [1, 2, 3, 4, 5, 6].forEach(function (n, i) { txt(g, String(n), P([1623, 1674][i % 2] + 22), Q([908, 953, 997][Math.floor(i / 2)]), 9, { color: '#d1d5db' }); });
    [5, 6, 7, 8, 9, 10, 11, 12].forEach(function (n, i) { txt(g, String(n), P([1625, 1695, 1765, 1835][i % 4]), Q([726, 777][Math.floor(i / 4)]), 8, { color: '#9ca3af' }); });
    // 채널 줄(스트립) 바탕 + 이름
    STRIP_IN.concat(STRIP_R, [STRIP_MAIN]).forEach(function (cx) {
      g.fillStyle = '#232427'; rrect(g, P(cx - 24), Q(462), 48, 560, 8); g.fill();
      txt(g, 'SELECT', P(cx), Q(500), 8, { color: '#cbd5e1' }); txt(g, 'SOLO', P(cx), Q(623), 8, { color: '#cbd5e1' }); txt(g, 'MUTE', P(cx), Q(719), 8, { color: '#cbd5e1' });
      ['CLIP', '-6', '-12', '-18', '-30', '-60'].forEach(function (s, k) { txt(g, s, P(cx + 6), Q(ROW.meterTop + k * 11.5), 6.5, { color: '#9ca3af', align: 'left' }); });
      for (var k = 0; k <= 12; k++) { var yy = ROW.fTop + 8 + k * (ROW.fBot - ROW.fTop - 16) / 12; g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(P(cx + 9), Q(yy), k % 3 ? 4 : 7, 1); g.fillRect(P(cx - 13 - (k % 3 ? 4 : 7) + 4), Q(yy), k % 3 ? 4 : 7, 1); }
    });
    // 레이어 버튼 칸
    [[128, 455, 190, 1030], [1040, 470, 1088, 1030]].forEach(function (b) { g.fillStyle = '#1d1e21'; rrect(g, P(b[0]), Q(b[1]), b[2] - b[0], b[3] - b[1], 10); g.fill(); });
    // 손목 받침
    g.fillStyle = '#18191c'; rrect(g, P(1722), Q(868), 150, 172, 16); g.fill();
    return tex(c);
  }
  function podDecal() {   // 화면 받침 윗면: px 1047..1655 × 76..426 → 608 × 350
    var c = canvas(608, 350), g = c.getContext('2d'), ox = POD.x0, oy = POD.y0;
    g.fillStyle = '#141518'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#0a0a0b'; rrect(g, 1092 - ox - 8, 104 - oy - 8, 311 + 16, 191 + 16, 8); g.fill();
    g.fillStyle = '#0b0c0e'; rrect(g, 1428 - ox, 140 - oy, 90, 145, 6); g.fill();
    txt(g, 'M/C SOLO   L   R', 1473 - ox, 293 - oy, 8, { color: '#9ca3af' });
    txt(g, 'LAYER', 1470 - ox, 360 - oy, 9, { color: '#d1d5db' }); txt(g, 'PAGE SELECT', 1575 - ox, 336 - oy, 9, { color: '#d1d5db' }); txt(g, 'NO      YES', 1575 - ox, 382 - oy, 7, { color: '#9ca3af' });
    return tex(c);
  }
  function screenTex() {  // 7인치 화면 (직접 그린 단순화 화면 — 실제 화면 그림이 아님)
    var c = canvas(800, 480), g = c.getContext('2d');
    var bg = g.createLinearGradient(0, 0, 0, 480); bg.addColorStop(0, '#1e3a5f'); bg.addColorStop(1, '#0b1a2c'); g.fillStyle = bg; g.fillRect(0, 0, 800, 480);
    g.fillStyle = '#0b1220'; g.fillRect(0, 0, 800, 54); txt(g, '01', 34, 27, 26, { color: '#fbbf24', weight: '900' }); txt(g, '인도자 보컬', 70, 27, 24, { align: 'left', color: '#fff' }); txt(g, '씬 01 · 주일 1부 예배', 780, 27, 18, { align: 'right', color: '#bfdbfe' });
    ['Home', 'Config', 'Gate', 'Dyn', 'EQ', 'Sends', 'Main'].forEach(function (t, i) { g.fillStyle = i === 0 ? '#f59e0b' : '#1f2937'; rrect(g, 12 + i * 112, 64, 104, 36, 6); g.fill(); txt(g, t, 64 + i * 112, 82, 17, { color: i === 0 ? '#111' : '#e5e7eb' }); });
    [['INPUT', 'GAIN +36 dB'], ['GATE', 'OFF'], ['DYN', '3:1'], ['EQ', '4 BAND'], ['SENDS', 'BUS 1–4'], ['MAIN', 'LR · C']].forEach(function (b, i) {
      var x = 12 + (i % 3) * 262, y = 116 + Math.floor(i / 3) * 170; g.fillStyle = 'rgba(255,255,255,0.08)'; rrect(g, x, y, 252, 158, 10); g.fill();
      txt(g, b[0], x + 14, y + 24, 18, { align: 'left', color: '#93c5fd' }); txt(g, b[1], x + 14, y + 60, 22, { align: 'left', color: '#fff' });
      g.strokeStyle = '#fbbf24'; g.lineWidth = 3; g.beginPath(); for (var k = 0; k <= 40; k++) { var xx = x + 14 + k * 5.6, yy = y + 118 - Math.sin(k / 40 * Math.PI) * (12 + i * 5); if (k) g.lineTo(xx, yy); else g.moveTo(xx, yy); } g.stroke();
    });
    return tex(c);
  }
  var LCD_COL = ['#22d3ee', '#22d3ee', '#22d3ee', '#4ade80', '#4ade80', '#4ade80', '#4ade80', '#4ade80', '#4ade80', '#4ade80', '#4ade80', '#facc15', '#facc15', '#e879f9', '#e879f9', '#e5e7eb'];
  var LCD_NAME = ['인도자', '싱어 1', '싱어 2', 'A.기타', '건반 L', '건반 R', '베이스', '킥', '스네어', 'OH', 'E.기타', '성가대L', '성가대R', '설교', '사회', '영상'];
  function lcdTex(no, name, col) {
    var c = canvas(128, 64), g = c.getContext('2d');
    g.fillStyle = col; g.fillRect(0, 0, 128, 64); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, 128, 22);
    txt(g, no, 6, 12, 14, { align: 'left', color: '#0b0c0e', weight: '900' }); txt(g, name, 64, 42, 24, { color: '#0b0c0e', weight: '800' });
    return tex(c);
  }
  function assignTex(s) { var c = canvas(128, 64), g = c.getContext('2d'); g.fillStyle = '#34d399'; g.fillRect(0, 0, 128, 64); txt(g, s, 64, 22, 18, { color: '#052e16', weight: '800' }); txt(g, 'FX 1', 64, 46, 16, { color: '#052e16' }); return tex(c); }
  function rearDecal() {  // 뒷면 판: 사진 px 60..1985 × 135..440 → 1925 × 305
    var c = canvas(1925, 305), g = c.getContext('2d'), ox = 60, oy = 135;
    function P(px) { return px - ox; } function Q(py) { return py - oy; }
    g.fillStyle = '#2a2b2e'; g.fillRect(0, 0, c.width, c.height);
    var boxes = [['MONITOR / CONTROL ROOM OUT', 131, 150, 343, 254], ['OUTPUTS', 350, 150, 815, 333], ['INPUTS', 850, 150, 1832, 333], ['SLOT', 337, 345, 705, 430], ['REMOTE CONTROL', 715, 337, 820, 432],
      ['MIDI', 828, 337, 947, 432], ['AES/EBU', 955, 337, 1020, 432], ['ULTRANET', 1024, 337, 1070, 432], ['B — AES50 — A', 1076, 337, 1193, 432], ['AUX IN / AUX OUT', 1356, 337, 1831, 432]];
    boxes.forEach(function (b) { g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2; rrect(g, P(b[1]), Q(b[2]), b[3] - b[1], b[4] - b[2], 8); g.stroke(); txt(g, b[0], P((b[1] + b[3]) / 2), Q(b[2] + 10), 10, { color: '#f3f4f6', weight: '800' }); });
    REAR_PX.inX.forEach(function (x, i) { txt(g, 'IN ' + (i + 1), P(x), Q(REAR_PX.inY[0] - 30), 10, { color: '#f9fafb' }); txt(g, 'IN ' + (i + 17), P(x), Q(REAR_PX.inY[1] - 30), 10, { color: '#f9fafb' }); });
    REAR_PX.outX.forEach(function (x, i) { txt(g, 'OUT ' + (i + 1), P(x), Q(REAR_PX.outY[0] - 32), 10, { color: '#f9fafb' }); txt(g, 'OUT ' + (i + 9), P(x), Q(REAR_PX.outY[1] - 32), 10, { color: '#f9fafb' }); });
    REAR_PX.auxJack.forEach(function (x, i) { txt(g, String(i + 1), P(x), Q(REAR_PX.auxY[1] + 20), 9, { color: '#e5e7eb' }); });
    txt(g, 'R', P(184), Q(245), 10); txt(g, 'L', P(252), Q(245), 10); txt(g, 'IN', P(867), Q(420), 9); txt(g, 'OUT', P(915), Q(420), 9);
    txt(g, 'USB', P(737), Q(352), 9); txt(g, 'ETHERNET', P(795), Q(352), 9); txt(g, 'X-USB 32 CH USB AUDIO INTERFACE', P(470), Q(372), 9, { color: '#d1d5db' });
        return tex(c);
  }

  // ---- 모양 도우미 (mm) ----
  function roundedBox(w, h, d, r) {   // 바닥 y=0, 가운데 x·z
    var s = new THREE.Shape(), x0 = -w / 2, z0 = -d / 2; r = Math.min(r, w / 2 - 0.01, d / 2 - 0.01);
    s.moveTo(x0 + r, z0); s.lineTo(x0 + w - r, z0); s.quadraticCurveTo(x0 + w, z0, x0 + w, z0 + r); s.lineTo(x0 + w, z0 + d - r); s.quadraticCurveTo(x0 + w, z0 + d, x0 + w - r, z0 + d);
    s.lineTo(x0 + r, z0 + d); s.quadraticCurveTo(x0, z0 + d, x0, z0 + d - r); s.lineTo(x0, z0 + r); s.quadraticCurveTo(x0, z0, x0 + r, z0);
    var b = Math.min(0.8, h / 3), g = new THREE.ExtrudeGeometry(s, { depth: h - b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.8, bevelOffset: -b * 0.8, bevelSegments: 2, curveSegments: 4 });
    g.rotateX(Math.PI / 2); g.translate(0, h - b, 0);   // 압출 방향 → -Y 이므로 뒤집어 바닥 0
    g.computeVertexNormals(); return g;
  }
  function cylY(rt, rb, h, seg) { var g = new THREE.CylinderGeometry(rt, rb, h, seg || 24); g.translate(0, h / 2, 0); return g; }
  function cylZ(r, len, seg) { var g = new THREE.CylinderGeometry(r, r, len, seg || 24); g.rotateX(Math.PI / 2); g.translate(0, 0, len / 2); return g; }   // +Z 로 len
  function box(w, h, d) { var g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return g; }
  function profileGeo(pts, x0, x1, bevel) {   // (z,h) 단면을 x0→x1 로 압출
    var s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath();
    var b = bevel || 0, g = new THREE.ExtrudeGeometry(s, { depth: (x1 - x0) - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: b > 0 ? 3 : 0, curveSegments: 6 });
    if (b > 0) g.translate(0, 0, b);
    // (x=z, y=h, z=폭) → (x=폭+x0, y=h, z=z)
    g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1));
    var idx = g.index; if (idx) { var a = idx.array; for (var k = 0; k < a.length; k += 3) { var t = a[k + 1]; a[k + 1] = a[k + 2]; a[k + 2] = t; } }
    else { var p = g.attributes.position.array, nn = g.attributes.normal && g.attributes.normal.array, uv = g.attributes.uv && g.attributes.uv.array;
      for (var v = 0; v < p.length / 9; v++) { swap(p, v * 9 + 3, v * 9 + 6, 3); if (nn) swap(nn, v * 9 + 3, v * 9 + 6, 3); if (uv) swap(uv, v * 6 + 2, v * 6 + 4, 2); } }
    g.computeVertexNormals(); return g;
  }
  function swap(a, i, j, n) { for (var k = 0; k < n; k++) { var t = a[i + k]; a[i + k] = a[j + k]; a[j + k] = t; } }

  // 정적 부품은 재질별로 하나로 합쳐 그리기 호출을 줄임
  function Baker() {
    var bins = [];
    function binOf(mat) { for (var i = 0; i < bins.length; i++) if (bins[i].mat === mat) return bins[i]; var b = { mat: mat, geos: [] }; bins.push(b); return b; }
    return {
      add: function (geo, mat, m4) { var g = geo.index ? geo.toNonIndexed() : geo.clone(); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (m4) g.applyMatrix4(m4); binOf(mat).geos.push(g); },
      build: function (parent, name) {
        bins.forEach(function (b, bi) {
          var n = 0; b.geos.forEach(function (g) { n += g.attributes.position.count; });
          var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), o = 0;
          b.geos.forEach(function (g) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); });
          var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
          geo.computeBoundingSphere(); var mesh = new THREE.Mesh(geo, b.mat); mesh.name = name + '.' + bi; parent.add(mesh);
        });
      }
    };
  }
  var V = new THREE.Vector3(), Qt = new THREE.Quaternion(), E = new THREE.Euler(), ONE = new THREE.Vector3(1, 1, 1);
  function M4(x, y, z, rx, ry, rz) { E.set(rx || 0, ry || 0, rz || 0); Qt.setFromEuler(E); return new THREE.Matrix4().compose(V.set(x, y, z), Qt, ONE); }
  function onTop(px, py, lift) { var z = Z(py); return M4(X(px), hS(z) + (lift || 0), z, TILT); }
  function onPod(px, py, lift) { var z = Z(py); return M4(X(px), hP(z) + (lift || 0), z, PTILT); }
  function onRear(px, py, out) { return M4(XR(px), HR(py), ZBACK - (out || 0), 0, Math.PI); }   // 로컬 +Z 가 뒤쪽 바깥

  function create() {
    var M = makeMaterials(), root = new THREE.Group(); root.name = 'behringerX32';
    var mm = new THREE.Group(); mm.name = 'behringerX32.mm'; mm.scale.setScalar(0.001); root.add(mm);
    var B = Baker(), dyn = new THREE.Group(); dyn.name = 'behringerX32.dynamic'; mm.add(dyn);
    var faders = {}, buttons = {}, lcds = [];

    // ---- 몸체: 옆 단면 (z, h) ----
    var zF = DIM.depth / 2, zB = ZBACK;
    var prof = [[zB + 4, 14], [zF - 30, 14], [zF - 14, 20], [zF - 4, 34], [zF, 52], [zF - 2, 70], [zF - 10, 86], [zF - 24, 96], [zF - 42, hS(zF - 42) + 4],
      [ZF + 4, hS(ZF + 4) + 3], [ZF, hS(ZF)], [ZB, hS(ZB)], [zB + 6, hS(zB + 6)], [zB + 1.5, hS(zB + 6) - 2.5], [zB, hS(zB + 6) - 7], [zB, 22]];
    var LX0 = X(100), RX1 = X(1890);
    B.add(profileGeo(prof, LX0, RX1), M.body);
    // 앞 팔걸이 (부드러운 검정)
    var armP = [[ZF + 2, hS(ZF) + 1.5], [zF - 42, hS(zF - 42) + 5], [zF - 24, 97], [zF - 10, 87], [zF - 1.5, 70], [zF + 1.5, 52], [zF - 3, 34], [zF - 13, 21], [zF - 30, 16], [ZF + 2, 16]];
    B.add(profileGeo(armP, LX0 + 1, RX1 - 1, 1.2), M.arm);
    // 옆 덮개(치크) — 둥근 모서리, 몸체보다 조금 큼
    var chk = prof.map(function (p) { return [p[0] + (p[0] > 0 ? 3 : -3), p[1] + (p[1] > 60 ? 4 : -2)]; });
    B.add(profileGeo(chk, -DIM.width / 2, LX0, 8), M.cheek);
    B.add(profileGeo(chk, RX1, DIM.width / 2, 8), M.cheek);
    // 바닥 · 고무 발
    B.add(box(RX1 - LX0 - 10, 2, DIM.depth - 30), M.bottom, M4((LX0 + RX1) / 2, 11, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { B.add(cylY(16, 18, 12, 20), M.rubber, M4(s[0] * (DIM.width / 2 - 95), 0, s[1] * (DIM.depth / 2 - 70))); });

    // ---- 조작면 그림 판 ----
    var dW = (1890 - 100) * SX, dZ0 = Z(40), dZ1 = Z(1045), dLen = Math.hypot(dZ1 - dZ0, hS(dZ1) - hS(dZ0));
    var top = new THREE.Mesh(new THREE.PlaneGeometry(dW, dLen), new THREE.MeshStandardMaterial({ map: topDecal(), roughness: 0.55, metalness: 0.35 }));
    top.name = 'behringerX32.topPanel'; var zm = (dZ0 + dZ1) / 2; top.position.set(X(995), hS(zm) + 0.25, zm); top.rotation.x = -Math.PI / 2 + TILT; mm.add(top);

    // ---- 화면 받침(포드) ----
    var pz0 = Z(POD.y0), pz1 = Z(POD.y1);
    var podProf = [[pz0, hS(pz0) - 5], [pz1, hS(pz1) - 5], [pz1 + 2, hP(pz1) - 3], [pz1, hP(pz1)], [pz0, hP(pz0)], [pz0 - 3, hP(pz0) - 6]];
    B.add(profileGeo(podProf, X(POD.x0), X(POD.x1), 3), M.podBody);
    var pLen = Math.hypot(pz1 - pz0, hP(pz1) - hP(pz0)), podTop = new THREE.Mesh(new THREE.PlaneGeometry((POD.x1 - POD.x0) * SX - 6, pLen - 4), new THREE.MeshStandardMaterial({ map: podDecal(), roughness: 0.35, metalness: 0.25 }));
    var pzm = (pz0 + pz1) / 2; podTop.position.set(X((POD.x0 + POD.x1) / 2), hP(pzm) + 0.3, pzm); podTop.rotation.x = -Math.PI / 2 + PTILT; podTop.name = 'behringerX32.podPanel'; mm.add(podTop);
    // 7인치 화면
    var scrW = 311 * SX, scrH = 191 * SZ / Math.cos(PTILT);
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(scrW, scrH), new THREE.MeshStandardMaterial({ map: screenTex(), emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0.0, roughness: 0.2, metalness: 0.1 }));
    scr.material.emissiveMap = scr.material.map; scr.material.emissiveIntensity = 0.85;
    var sz = Z((104 + 295) / 2); scr.position.set(X((1092 + 1403) / 2), hP(sz) + 0.6, sz); scr.rotation.x = -Math.PI / 2 + PTILT; scr.name = 'behringerX32.screen'; mm.add(scr);
    // 화면 옆 미터 (3줄 × 24칸)
    [1445, 1473, 1501].forEach(function (mx, c) { for (var i = 0; i < 24; i++) { var py = 150 + i * 5.1, lit = i > (c === 0 ? 20 : 9); B.add(box(4, 0.8, 1.6), !lit ? M.ledDark : i < 4 ? M.ledRed : i < 9 ? M.ledYellow : M.ledGreen, onPod(mx, py, 0.3)); } });
    // 화면 메뉴 버튼 8개 · 노브 6개 · 화살표
    MENU.forEach(function (nm, i) { var b = new THREE.Mesh(roundedBox(16, 3.5, 7, 1.5), i === 0 ? M.btnLit.green : M.btn); b.applyMatrix4(onPod(MENU_X, MENU_Y[i], 0)); b.name = 'behringerX32.btn.menu.' + nm; dyn.add(b); buttons['menu.' + nm] = b; });
    ENC.forEach(function (ex) { B.add(cylY(8, 8.5, 14, 24), M.knob, onPod(ex, 362)); B.add(cylY(7.2, 7.6, 1, 24), M.knobTop, onPod(ex, 362, 14)); });
    [[1498, 343], [1498, 375], [1558, 360], [1591, 360]].forEach(function (p) { B.add(roundedBox(10, 3.5, 10, 2), M.btn, onPod(p[0], p[1])); });

    // ---- 노브 (LED 링 포함) ----
    KNOBS.forEach(function (k) {
      var r = k[3] / 2, m = onTop(k[1], k[2]);
      B.add(cylY(r, r * 1.08, 16, 28), M.knob, m); B.add(cylY(r * 0.88, r * 0.92, 1.2, 28), M.knobTop, M4(0, 16, 0).premultiply(m));
      B.add(box(1.2, 0.6, r * 0.8), M.latch, M4(0, 17.1, -r * 0.45).premultiply(m));
      for (var i = 0; i < 13; i++) { var a = (-135 + i * 22.5) * Math.PI / 180, lit = i / 12 <= k[4]; B.add(box(1.6, 0.6, 2.4), lit ? M.ledOrange : M.ledOff, M4(Math.sin(a) * (r + 4.5), 0.3, -Math.cos(a) * (r + 4.5), 0, -a).premultiply(m)); }
    });
    // 채널 스트립 프리앰프·다이내믹스 미터
    for (var li = 0; li < 6; li++) { B.add(box(2.6, 0.7, 1.6), li < 2 ? M.ledDark : li === 2 ? M.ledYellow : li === 5 ? M.ledGreen : M.ledOrange, onTop(268, 176 + li * 8, 0.2)); B.add(box(2.6, 0.7, 1.6), li >= 3 && li < 5 ? M.ledOrange : M.ledDark, onTop(268, 302 + li * 10, 0.2)); }

    // ---- 버튼 ----
    function button(id, px, py, w, d, lit) { var b = new THREE.Mesh(roundedBox(w, 4, d, 1.6), lit ? M.btnLit[lit] : M.btn); b.applyMatrix4(onTop(px, py)); b.name = 'behringerX32.btn.' + id; b.userData.lit = lit || null; dyn.add(b); buttons[id] = b; return b; }
    BTN.forEach(function (b) { button(b[0], b[1], b[2], b[3], b[4], b[5]); });

    // ---- XLR 단자 (윗면: 토크백 · 램프) ----
    function xlrFemale(m) { B.add(cylZ(11, 3), M.nickel, m); B.add(cylZ(9.2, 3.4), M.insert, m); [[-4, 1.6], [4, 1.6], [0, -4.4]].forEach(function (h) { B.add(cylZ(1.4, 3.6, 10), M.hole, M4(h[0], h[1], 0).premultiply(m)); }); B.add(box(5, 1.4, 1), M.latch, M4(0, 10, 3.2).premultiply(m)); }
    function xlrMale(m) { B.add(cylZ(11, 3), M.nickel, m); B.add(cylZ(9.6, 3.2), M.hole, m); [[-4, 1.6], [4, 1.6], [0, -4.4]].forEach(function (h) { B.add(cylZ(0.9, 2.2, 8), M.nickel, M4(h[0], h[1], -1).premultiply(m)); }); B.add(box(3, 2, 1), M.latch, M4(0, 8.5, 3.2).premultiply(m)); }
    function jack(m, r) { B.add(cylZ(r || 6.5, 2.6, 6), M.nickel, m); B.add(cylZ(3.4, 2.9, 16), M.hole, m); }
    function rj(m, w) { B.add(box(w || 16, 14, 4), M.nickel, M4(0, -7, 0).premultiply(m)); B.add(box((w || 16) - 4, 10, 4.3), M.hole, M4(0, -5, 0).premultiply(m)); }
    var upX = function (px, py) { return M4(0, 0, 0, -Math.PI / 2).premultiply(onTop(px, py, 0.5)); };   // 윗면에서 위로 향한 단자
    xlrFemale(upX(1825, 184)); xlrFemale(upX(1825, 95));

    // ---- 채널 스트립 25개: SELECT · 미터 · SOLO · LCD · MUTE · 페이더 ----
    var strips = STRIP_IN.map(function (x, i) { return ['in' + (i + 1), x, i]; }).concat(STRIP_R.map(function (x, i) { return ['r' + (i + 1), x, 16 + i]; }), [['main', STRIP_MAIN, 24]]);
    var capGeo = roundedBox(22, 10, 13, 2.5), grooveGeo = box(20, 0.6, 1.4), slotGeo = box(3.2, 0.4, (ROW.fBot - ROW.fTop) * SZ / Math.cos(TILT)), stemGeo = box(2, 8, 2), lcdGeo = new THREE.PlaneGeometry(44 * SX, 25 * SZ);
    strips.forEach(function (s) {
      var id = s[0], cx = s[1], idx = s[2];
      button(id + '.select', cx, ROW.select, 13, 9, idx === 0 ? 'green' : idx === 16 + 3 ? 'green' : null);
      if (id !== 'main') button(id + '.solo', cx, ROW.solo, 13, 9, [1, 4, 13, 17, 18].indexOf(idx) >= 0 ? 'yellow' : null);
      else button('main.solo', cx, 610, 13, 9, null);
      button(id + '.mute', cx, ROW.mute, 13, 9, [4, 12, 20].indexOf(idx) >= 0 ? 'red' : null);
      for (var k = 0; k < 6; k++) { var lit = k >= 3 + (idx % 3) - 1; B.add(box(3, 0.7, 2), !lit ? M.ledDark : k === 0 ? M.ledRed : k < 3 ? M.ledYellow : M.ledGreen, onTop(cx - 6, ROW.meterTop + k * 11.5, 0.2)); }
      // LCD 이름표
      var no = id === 'main' ? 'MAIN' : idx < 16 ? 'CH ' + String(idx + 1).padStart(2, '0') : 'DCA ' + (idx - 15), nm = id === 'main' ? 'LR' : idx < 16 ? LCD_NAME[idx] : ['악기', '보컬', '설교', '성가대', 'DCA 5', 'DCA 6', 'DCA 7', 'DCA 8'][idx - 16];
      var col = id === 'main' ? '#fca5a5' : idx < 16 ? LCD_COL[idx] : '#a78bfa';
      var lt = lcdTex(no, nm, col), lm = new THREE.Mesh(lcdGeo, new THREE.MeshStandardMaterial({ map: lt, emissive: 0xffffff, emissiveMap: lt, emissiveIntensity: 0.4, roughness: 0.3 }));
      var lz = Z(ROW.lcd); lm.position.set(X(cx), hS(lz) + 0.4, lz); lm.rotation.x = -Math.PI / 2 + TILT; lm.name = 'behringerX32.lcd.' + id; dyn.add(lm); lcds.push(lm);
      // 페이더 (모터 페이더 100 mm)
      var fz = Z((ROW.fTop + ROW.fBot) / 2); B.add(slotGeo, M.slot, M4(X(cx), hS(fz) + 0.15, fz, TILT));
      var cap = new THREE.Group(); cap.name = 'behringerX32.fader.' + id;
      var cm = new THREE.Mesh(capGeo, M.cap); cm.position.y = 8; cap.add(cm); var gm = new THREE.Mesh(grooveGeo, M.capGroove); gm.position.y = 18.05; cap.add(gm); var st = new THREE.Mesh(stemGeo, M.stem); cap.add(st);
      dyn.add(cap); faders[id] = { obj: cap, cx: cx };
      setFader(id, FADER_INIT[idx]);
    });
    // ASSIGN LCD 4개
    [1625, 1695, 1765, 1835].forEach(function (x, i) { var t = assignTex('ASSIGN ' + (i + 1)), m = new THREE.Mesh(new THREE.PlaneGeometry(60 * SX, 26 * SZ), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.6 }));
      var z = Z(661); m.position.set(X(x), hS(z) + 0.4, z); m.rotation.x = -Math.PI / 2 + TILT; m.name = 'behringerX32.assignLcd.' + (i + 1); dyn.add(m); });
    // USB A (USB RECORDER)
    B.add(box(14, 1, 7), M.hole, onTop(905, 95, 0.1)); B.add(box(12, 0.6, 2), M.nickel, onTop(905, 95, 0.3));
    // 손목 받침 (고무)
    B.add(roundedBox(150 * SX, 3, 172 * SZ, 10), M.rubber, onTop(1797, 954));
    // 옆 덮개의 헤드폰 단자
    [[60, 440, -1], [1925, 445, 1]].forEach(function (p) { var z = Z(p[1]); jack(M4(p[2] * (DIM.width / 2 - 1), hS(z) - 30, z, 0, p[2] * Math.PI / 2), 6); });

    // ---- 뒷면 판 + 단자 ----
    var rW = (1985 - 60) * RSX, rH = (440 - 135) * RSX, rear = new THREE.Mesh(new THREE.PlaneGeometry(rW, rH), new THREE.MeshStandardMaterial({ map: rearDecal(), roughness: 0.55, metalness: 0.35 }));
    rear.position.set(XR((60 + 1985) / 2), HR((135 + 440) / 2), ZBACK - 0.3); rear.rotation.y = Math.PI; rear.name = 'behringerX32.rearPanel'; mm.add(rear);
    REAR_PX.inX.forEach(function (x) { REAR_PX.inY.forEach(function (y) { xlrFemale(onRear(x, y)); B.add(box(2, 2, 1), M.ledRed2, onRear(x - 20, y + 28, 0.5)); }); });
    REAR_PX.outX.forEach(function (x) { REAR_PX.outY.forEach(function (y) { xlrMale(onRear(x, y)); }); });
    REAR_PX.monXlr.forEach(function (p) { xlrMale(onRear(p[0], p[1])); });
    REAR_PX.monJack.forEach(function (p) { jack(onRear(p[0], p[1])); });
    REAR_PX.auxJack.forEach(function (x) { REAR_PX.auxY.forEach(function (y) { jack(onRear(x, y)); }); });
    REAR_PX.auxRca.forEach(function (x, i) { REAR_PX.auxY.forEach(function (y) { var m = onRear(x, y); B.add(cylZ(5, 7, 16), i ? M.rcaWhite : M.rcaRed, m); B.add(cylZ(3.6, 9, 16), M.nickel, m); B.add(cylZ(1.4, 9.4, 10), M.hole, m); }); });
    REAR_PX.aes50.forEach(function (p) { var m = onRear(p[0], p[1]); B.add(cylZ(12, 4), M.nickel, m); B.add(cylZ(10.5, 4.4), M.black, m); rj(M4(0, 7, 0).premultiply(m), 14); });
    rj(onRear(REAR_PX.ultranet[0], REAR_PX.ultranet[1] - 14)); rj(onRear(REAR_PX.ethernet[0], REAR_PX.ethernet[1] - 14));
    xlrMale(onRear(REAR_PX.aesebu[0], REAR_PX.aesebu[1]));
    REAR_PX.midi.forEach(function (p) { var m = onRear(p[0], p[1]); B.add(cylZ(10, 3), M.nickel, m); B.add(cylZ(7.6, 3.4), M.black, m); for (var i = 0; i < 5; i++) { var a = Math.PI + i * Math.PI / 4; B.add(cylZ(0.9, 3.6, 8), M.hole, M4(Math.cos(a) * 4.5, -Math.sin(a) * 4.5, 0).premultiply(m)); } });
    [REAR_PX.usbB, REAR_PX.slotUsb].forEach(function (p) { var m = onRear(p[0], p[1]); B.add(box(12, 11, 3), M.nickel, M4(0, -5.5, 0).premultiply(m)); B.add(box(8.5, 7.5, 3.3), M.hole, M4(0, -3.75, 0).premultiply(m)); });
    B.add(box((REAR_PX.slot[2] - REAR_PX.slot[0]) * RSX, (REAR_PX.slot[3] - REAR_PX.slot[1]) * RSX, 2), M.black, onRear((REAR_PX.slot[0] + REAR_PX.slot[2]) / 2, REAR_PX.slot[3], 0));
    var iec = onRear(REAR_PX.iec[0], REAR_PX.iec[1]); B.add(box(31, 23, 4), M.black, M4(0, -11.5, 0).premultiply(iec)); B.add(box(24, 16, 4.3), M.hole, M4(0, -8, 0).premultiply(iec));
    var pw = onRear(REAR_PX.power[0], REAR_PX.power[1]); B.add(box(15, 22, 4), M.black, M4(0, -11, 0).premultiply(pw)); B.add(box(11, 9, 6), M.rubber, M4(0, -1, 0, 0.2).premultiply(pw));

    B.build(mm, 'behringerX32.static');

    // ---- 동작 ----
    function setFader(id, v) {
      var f = faders[id]; if (!f) throw new Error('unknown fader ' + id); v = Math.max(0, Math.min(1, v)); f.v = v;
      var py = ROW.fBot - 10 - v * (ROW.fBot - ROW.fTop - 20), z = Z(py);
      f.obj.position.set(X(f.cx), hS(z) + 0.4, z); f.obj.rotation.set(TILT, 0, 0);
    }
    function setButton(id, color) { var b = buttons[id]; if (!b) throw new Error('unknown button ' + id); b.material = color ? M.btnLit[color] || M.btnLit.yellow : M.btn; b.userData.lit = color || null; }
    var api = { faders: faders, buttons: buttons, lcds: lcds, setFader: setFader, setButton: setButton,
      getState: function () { var s = { faders: {}, lit: {} }; Object.keys(faders).forEach(function (k) { s.faders[k] = Math.round(faders[k].v * 1000) / 1000; }); Object.keys(buttons).forEach(function (k) { if (buttons[k].userData.lit) s.lit[k] = buttons[k].userData.lit; }); return s; },
      counts: function () { return { faders: Object.keys(faders).length, buttons: Object.keys(buttons).length, lcds: lcds.length, knobs: KNOBS.length + ENC.length, xlrIn: REAR_PX.inX.length * 2, xlrOut: REAR_PX.outX.length * 2, auxIn: REAR_PX.auxJack.length } } };
    Object.defineProperty(root.userData, 'behringerX32', { value: api, enumerable: false });
    return root;
  }

  global.BehringerX32 = { DIMENSIONS_MM: DIM, LAYOUT: { STRIP_IN: STRIP_IN, STRIP_R: STRIP_R, STRIP_MAIN: STRIP_MAIN, ROW: ROW, KNOBS: KNOBS, BTN: BTN, REAR_PX: REAR_PX, POD: POD }, create: create,
    api: function (root) { return root.userData.behringerX32; } };
})(typeof window !== 'undefined' ? window : this);
