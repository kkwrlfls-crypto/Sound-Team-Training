/* =============================================================================
   d&b audiotechnik 40D · 10D 설치용 4채널 Class D 앰프 — 절차적(procedural) 3D 모델
   (Three.js r128 전역 빌드 전용, 2026-11-04)
   -----------------------------------------------------------------------------
   - 전역: window.DbAmps = { create({ variant: '40D' | '10D', power: true }), VARIANTS, DIMENSIONS_MM, LAYOUT, api(root) }
   - 단위: 내부는 mm 로 만들고 루트 아래 그룹을 0.001 배(미터). 원점 = 바닥면 가운데, +Y 위, +Z 앞면, +X 앞에서 볼 때 오른쪽.
   - 근거 자료 (「공식」= 제조사 문서 숫자 · 도면, 「사진 비례 추정」= 공식 사진/도면을 픽셀로 잰 값)
       · 40D Start-up manual 1.8 en (dbaudio.com, dbaudio-start-up-manual-40d-1.8-en.pdf)
           공식: 2 RU × 19" × 465 mm, 13.3 kg / 치수 도면: 전면 폭 483, 랙 구멍 가로 간격 467 · 세로 간격 76,
                 몸체 폭 442.5, 전면판 두께 9.5, 뒤 랙 귀 위치 = 앞면에서 439.5 (전면판 뒤에서 430)
           공식: 앞면에는 4.3" TFT 컬러 터치스크린(480 × 272)과 공기 흡입구뿐 — 로터리 엔코더 · 전원 스위치 없음
                 (전원은 뒷면 powerCON TRUE1 TOP 을 꽂고 뺌, 공기는 앞 → 뒤)
           공식(뒷면 그림 4.1): 왼쪽 판 = 모델명 · powerCON TRUE1 TOP, 가운데 = SPEAKER OUTPUTS A/B · C/D
                 (4핀 Phoenix Euroblock 암 2개, NL4 아님) 양옆 통풍구, 오른쪽 판 = ETHERNET 1(PRI) · 2(SEC) RJ45(Milan),
                 INPUT A1–A4 · LINK D3/4 · INPUT D3/4 · LINK D1/2 · INPUT D1/2 (3핀 Phoenix 수, 아날로그 · AES3 — XLR 아님),
                 RESET(LINK D3/4 옆), GPI 9핀 · GPO 5핀 · FAULT 3핀 (Phoenix), 앞 · 뒤 랙 귀
       · 10D/30D Manual 1.12 en (dbaudio-manual-10d-30d-1.12-en.pdf) · 10D 제품 페이지 · arch specs
           공식: 2 RU × 19" × 435 mm, 10.6 kg / 치수 도면: 483 · 467 · 76 · 442.5 · 9.5, 뒤 랙 귀 = 앞면에서 425 (전면판 뒤에서 400)
           공식: 앞면 왼쪽 아래 LED — POWER(초록) · DATA(노랑) · 채널 A–D MUTE(빨강) + 신호 LED 3개(ISP 초록 · GR 노랑 · OVL 빨강)
           공식(뒷면 그림 5.1): 왼쪽 위 원형 로커 전원 스위치(OFF/POWER/ON), 그 아래 powerCON, 넓은 통풍구,
                 SPEAKER OUTPUTS 4핀 Phoenix 암 2개, ETHERNET 1 · 2 (RJ45), INPUT A4–A1(RESET 은 A3 와 A2 사이),
                 LINK D3/4 · INPUT D3/4 · LINK D1/2 · INPUT D1/2, CAN (RJ45 × 2), GPIO 6핀, FAULT 3핀
       · 사진 비례 추정: 단자 · 화면 · 흡입구 · LED · 글자의 위치와 크기(위 도면을 2.449 px/mm 로 재고, 공식 제품 정면 사진
         40D.jpg · 10D.jpg 를 0.633 mm/px 로 잼), 전면판 높이 88.1, 몸체 높이 86.5, 단자 돌출 길이, 색 · 재질, 덮개 나사 위치
   - 로고(제조사 상표)는 그리지 않고, 패널 글자는 모델명 · 단자 · 기능 이름만 씀. 화면 내용은 교육용으로 단순하게 다시 그린 그림.
   ============================================================================= */
(function (global) {
  'use strict';
  var THREE = global.THREE;
  if (!THREE) { console.error('[DbAmps] THREE 가 먼저 로드되어야 합니다.'); return; }

  var VARIANTS = ['40D', '10D'];
  // ---- 치수 (mm) ----
  var DIMENSIONS_MM = {
    '40D': { width: 483, height: 88.1, depth: 465, bodyWidth: 442.5, bodyHeight: 86.5, frontPanel: 9.5, rearEarFromFront: 439.5, rackHoleX: 467, rackHoleY: 76, weightKg: 13.3,
      note: '폭 483 · 깊이 465 · 몸체 442.5 · 전면판 9.5 · 뒤 귀 439.5 · 구멍 467/76 · 13.3 kg = 공식, 높이 88.1 · 몸체 높이 86.5 = 2U 기준 추정' },
    '10D': { width: 483, height: 88.1, depth: 435, bodyWidth: 442.5, bodyHeight: 86.5, frontPanel: 9.5, rearEarFromFront: 425, rackHoleX: 467, rackHoleY: 76, weightKg: 10.6,
      note: '폭 483 · 깊이 435 · 몸체 442.5 · 전면판 9.5 · 뒤 귀 425 · 구멍 467/76 · 10.6 kg = 공식, 높이 88.1 · 몸체 높이 86.5 = 2U 기준 추정' }
  };

  // ---- 뒷면 배치: 공식 뒷면 도면의 픽셀 좌표 (2.449 px/mm, 뒤에서 본 그림) ----
  //   X(모델) = (cx - px) / S  (뒤에서 본 왼쪽 = 모델의 +X),  Y = (by - py) / S
  var S = 2.449;
  var REAR = {
    '40D': { cx: 665, by: 267, x0: 124, x1: 1206, top: 51,
      plates: [[140, 60, 252, 261], [425, 61, 680, 261], [854, 61, 1196, 261]],
      vents: [{ x0: 255, x1: 422, n: 12, rows: [[64, 157], [162, 257]], w: 9 }, { x0: 682, x1: 850, n: 12, rows: [[64, 157], [162, 257]], w: 9 }],
      model: [147, 80], mains: [147, 236, ['MAINS', '100–240 V', '~ 50/60 Hz, 1800 W']], powercon: [200, 205, 11.8], rocker: null,
      spkTitle: [431, 73, 'SPEAKER OUTPUTS'], wiring: [676, 73, 'CLASS 3 WIRING', 'right'], warn: [430, 236], rating: [606, 226, 674, 256],
      spk: [[552, 125.5, 'B', 'A', 88], [552, 199, 'D', 'C', 166]], spkW: 47.4,
      eth: [[899.5, 116, 'ETHERNET 1', 'PRI'], [899.5, 208.5, 'ETHERNET 2', 'SEC']], can: null,
      inX: [966.5, 1031, 1095, 1159.5], inY: [93, 163], inLabY: [67, 137],
      inNames: [['INPUT A4', 'INPUT A3', 'INPUT A2', 'INPUT A1'], ['LINK D3/4', 'INPUT D3/4', 'LINK D1/2', 'INPUT D1/2']], linkBars: false,
      reset: [936, 161], resetLab: [928, 150],
      gpio: [[985.5, 234, 9, 'GPI', 930, ['⏚', '1', '2', '3', '4', '5', '6', '7', '8']], [1083, 234, 5, 'GPO', 1052, ['⏚', '1', '2', '3', '4']], [1158, 234, 3, 'FAULT', 1142, ['NO', 'C', 'NC']]],
      gpioLabY: 209, gpioPinY: 253,
      ear: { screws: [[102, 102], [102, 217]], slots: [[95, 66], [95, 252]] } },
    '10D': { cx: 654, by: 260, x0: 111, x1: 1197, top: 48,
      plates: [[122.5, 56, 248.5, 259], [598, 52, 1184, 258]],
      vents: [{ x0: 253, x1: 592, n: 23, rows: [[63, 175]], w: 8, frame: [248.5, 57.5, 595, 180] }],
      model: [128, 72], mains: [130, 226, ['MAINS', '100–240 V', '~ 50/60 Hz, 1000 W']], powercon: [187.5, 202.5, 12.2], rocker: [192.5, 112.5, 10.2],
      spkTitle: [605, 69, 'SPEAKER OUTPUTS'], wiring: [695, 247, 'CLASS 2 WIRING', 'center'], warn: [250, 230], rating: null,
      spk: [[725.5, 116, 'B', 'A', 85], [725.5, 195.5, 'D', 'C', 164]], spkW: 48.6,
      eth: [[885, 99, 'ETHERNET 1', ''], [885, 166, 'ETHERNET 2', '']], can: [920, 234.5, 885, 210],
      inX: [950.5, 1014.5, 1078, 1141], inY: [97, 162], inLabY: [68, 136],
      inNames: [['INPUT A4', 'INPUT A3', 'INPUT A2', 'INPUT A1'], ['LINK D3/4', 'INPUT D3/4', 'LINK D1/2', 'INPUT D1/2']], linkBars: true,
      reset: [1046, 94], resetLab: [1046, 103.5],
      gpio: [[1059, 229, 6, 'GPIO', 1023, ['⏚', '1', '2', '3', '4', '5']], [1141, 229, 3, 'FAULT', 1127, ['NO', 'C', 'NC']]],
      gpioLabY: 202, gpioPinY: 248,
      ear: { screws: [[95, 89], [95, 221.5]], slots: [[80, 64], [80, 249]] } }
  };
  // ---- 앞면 배치 (mm, X = 가운데 기준, Y = 바닥 기준) ----
  var FRONT = {
    '40D': { model: [-68.2, 73.9, 8.2], screen: { x: -157.0, y: 49.0, w: 101.3, h: 60.4, aw: 96.8, ah: 56.0 }, slot: { x0: -70.2, x1: 210.7, y0: 18.4, y1: 38.8 } },
    '10D': { model: [-201.2, 77.5, 8.2], band: { x0: -216, x1: 225, y0: 21.6, y1: 38.0 }, vent: { x0: -61, x1: 206.6, y0: 23.0, y1: 36.6 },
      ledY: [31.4, 25.3], power: -207.6, chan: [{ x: -173.4, s: [-155.0, -149.4, -143.6] }, { x: -125.9, s: [-108.2, -101.2, -94.9] }] }
  };

  // ---------------------------------------------------------------------------
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c) { var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  var FONT = '"Arial Narrow","Roboto Condensed","Helvetica Neue",Arial,"Noto Sans KR",sans-serif';
  function txt(g, s, x, y, size, o) { o = o || {}; g.font = (o.weight || '700') + ' ' + size + 'px ' + FONT; g.fillStyle = o.color || '#eef0f2'; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function linearize(o) {   // 사진에서 본 sRGB 색을 선형으로 (outputEncoding = sRGB)
    Object.keys(o).forEach(function (k) { var m = o[k]; if (m && m.isMaterial) { m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); } }); return o;
  }
  function makeMaterials() {
    var St = THREE.MeshStandardMaterial;
    return linearize({
      front: new St({ color: 0x232427, roughness: 0.62, metalness: 0.35 }),
      frame: new St({ color: 0x18191b, roughness: 0.7, metalness: 0.3 }),
      cover: new St({ color: 0x232427, roughness: 0.62, metalness: 0.45 }),
      ear: new St({ color: 0x1d1e21, roughness: 0.55, metalness: 0.45 }),
      plastic: new St({ color: 0x141517, roughness: 0.62, metalness: 0.05 }),
      plastic2: new St({ color: 0x1f2023, roughness: 0.5, metalness: 0.05 }),
      grey: new St({ color: 0x6b6e74, roughness: 0.45, metalness: 0.2 }),
      hole: new St({ color: 0x030303, roughness: 1, metalness: 0 }),
      nickel: new St({ color: 0xb9bdc3, roughness: 0.28, metalness: 0.9 }),
      brass: new St({ color: 0xc9b27a, roughness: 0.35, metalness: 0.85 }),
      screw: new St({ color: 0x55585e, roughness: 0.35, metalness: 0.85 }),
      bezel: new St({ color: 0x0b0c0d, roughness: 0.35, metalness: 0.2 }),
      ledOff: new St({ color: 0x3a3b3e, roughness: 0.3, metalness: 0.1 }),
      ledRedOff: new St({ color: 0x5a1c1c, roughness: 0.3, metalness: 0.05 }),
      ledGreen: new St({ color: 0x22c55e, emissive: 0x16c048, emissiveIntensity: 1.1, roughness: 0.3 }),
      ledYellow: new St({ color: 0xf5c000, emissive: 0xe0a000, emissiveIntensity: 1.0, roughness: 0.3 }),
      ledRed: new St({ color: 0xef4444, emissive: 0xe02020, emissiveIntensity: 1.1, roughness: 0.3 }),
      ledAmber: new St({ color: 0xffc46b, emissive: 0xff9000, emissiveIntensity: 1.2, roughness: 0.3 })
    });
  }

  // ---- 그림(텍스처) ----
  function perfTex(dark) {   // 타공 그릴 (육각 배열 구멍)
    var c = canvas(128, 128), g = c.getContext('2d');
    g.fillStyle = dark ? '#1b1c1f' : '#2a2b2f'; g.fillRect(0, 0, 128, 128);
    var p = 16, r = 5.2;
    for (var j = -1; j < 128 / (p * 0.866) + 1; j++) for (var i = -1; i < 128 / p + 1; i++) {
      var x = i * p + (j % 2 ? p / 2 : 0), y = j * p * 0.866 * (128 / (Math.round(128 / (p * 0.866)) * p * 0.866));
      g.fillStyle = '#020203'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.arc(x, y - r - 0.6, 1.2, 0, 7); g.fill();
    }
    var t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function screenTex(on) {   // 40D 4.3" 화면 (480 × 272 의 2배) — 실제 화면을 단순화해 다시 그린 교육용 그림
    var c = canvas(960, 544), g = c.getContext('2d');
    if (!on) { g.fillStyle = '#050608'; g.fillRect(0, 0, 960, 544); return tex(c); }
    g.fillStyle = '#16233a'; g.fillRect(0, 0, 960, 544);
    g.fillStyle = '#0d1626'; g.fillRect(0, 0, 960, 96);
    g.fillStyle = '#4ade80'; g.fillRect(14, 16, 8, 64);
    txt(g, '40D', 36, 34, 30, { align: 'left', color: '#ffffff', weight: '800' }); txt(g, '2-Way Active  |  2-Way Active', 36, 70, 20, { align: 'left', color: '#c7d2e3', weight: '600' });
    g.fillStyle = '#2b3a55'; g.fillRect(440, 0, 2, 96);
    txt(g, 'Network', 462, 26, 20, { align: 'left', color: '#ffffff' }); txt(g, 'IP: 192.168.1.40', 462, 52, 18, { align: 'left', color: '#c7d2e3', weight: '600' }); txt(g, 'Milan · PRI', 462, 76, 18, { align: 'left', color: '#c7d2e3', weight: '600' });
    g.fillStyle = '#2b3a55'; g.fillRect(760, 0, 2, 96);
    g.fillStyle = '#4ade80'; g.beginPath(); g.arc(790, 48, 9, 0, 7); g.fill(); txt(g, 'On', 808, 48, 24, { align: 'left', color: '#ffffff' });
    var rows = [['A', 'B', 'Vi10P', 'Vi10P', 'D1 · D2', '메인 L · R'], ['C', 'D', 'V-SUB', 'Y10P', 'D3 · D4', '서브 · 천장']];
    rows.forEach(function (r, k) {
      var y = 108 + k * 216;
      g.fillStyle = '#0f1a2c'; g.fillRect(12, y, 54, 204);
      txt(g, r[0], 39, y + 40, 26, { color: '#c7d2e3' }); txt(g, r[1], 39, y + 160, 26, { color: '#c7d2e3' });
      var gr = g.createLinearGradient(0, y, 0, y + 204); gr.addColorStop(0, '#6b86c2'); gr.addColorStop(1, '#4d68a4'); g.fillStyle = gr; g.fillRect(74, y, 600, 204);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(74, y + 101, 600, 2);
      txt(g, r[2], 96, y + 34, 30, { align: 'left', color: '#ffffff', weight: '800' }); txt(g, r[4] + '   CPL  AP  0.3 ms', 96, y + 72, 20, { align: 'left', color: '#e5ecf8', weight: '600' });
      txt(g, r[3], 96, y + 136, 30, { align: 'left', color: '#ffffff', weight: '800' }); txt(g, r[5], 96, y + 174, 20, { align: 'left', color: '#e5ecf8', weight: '600' });
      g.fillStyle = '#1d2a42'; g.fillRect(682, y, 40, 204);
      var g2 = g.createLinearGradient(0, y, 0, y + 204); g2.addColorStop(0, '#f0948a'); g2.addColorStop(1, '#de7468'); g.fillStyle = g2; g.fillRect(730, y, 218, 204);
      txt(g, r[0] + '/' + r[1], 748, y + 36, 28, { align: 'left', color: '#ffffff', weight: '800' });
      txt(g, 'MUTE OFF', 748, y + 82, 20, { align: 'left', color: '#fff1ef', weight: '700' }); txt(g, '+0.0 dB', 748, y + 116, 22, { align: 'left', color: '#fff1ef', weight: '700' });
      for (var m = 0; m < 2; m++) { g.fillStyle = '#4ade80'; g.fillRect(690 + m * 14, y + 70 + (1 - m) * 40, 10, 120 - (1 - m) * 40); }
    });
    return tex(c);
  }
  function textTex(lines, w, h, scale) {   // 투명 바탕 글자판 (lines: [글자, x, y, 크기, 정렬, 굵기, 색])
    var c = canvas(Math.round(w * scale), Math.round(h * scale)), g = c.getContext('2d');
    lines.forEach(function (l) { txt(g, l[0], l[1] * scale, l[2] * scale, l[3] * scale, { align: l[4] || 'center', weight: l[5] || '700', color: l[6] || '#eef0f2' }); });
    return tex(c);
  }
  function rearDecal(R, V) {   // 뒷면 판 전체 그림 (도면 px 그대로, K 배)
    var K = 2, W = (R.x1 - R.x0), H = (R.by - R.top), c = canvas(Math.round(W * K), Math.round(H * K)), g = c.getContext('2d');
    function P(px) { return (px - R.x0) * K; } function Q(py) { return (py - R.top) * K; }
    function T(s, px, py, size, o) { txt(g, s, P(px), Q(py), size * K, o); }
    g.fillStyle = '#1a1b1d'; g.fillRect(0, 0, c.width, c.height);
    for (var i = 0; i < 1600; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.03).toFixed(3) + ')'; g.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2); }
    R.plates.forEach(function (p) { g.fillStyle = '#202124'; rrect(g, P(p[0]), Q(p[1]), (p[2] - p[0]) * K, (p[3] - p[1]) * K, 7 * K); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1.2 * K; g.stroke(); });
    R.vents.forEach(function (v) {
      if (v.frame) { g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1.2 * K; rrect(g, P(v.frame[0]), Q(v.frame[1]), (v.frame[2] - v.frame[0]) * K, (v.frame[3] - v.frame[1]) * K, 5 * K); g.stroke(); }
      var pitch = (v.x1 - v.x0) / v.n;
      for (var k = 0; k < v.n; k++) v.rows.forEach(function (r) {
        var x = v.x0 + pitch * (k + 0.5) - v.w / 2;
        g.fillStyle = '#030303'; rrect(g, P(x), Q(r[0]), v.w * K, (r[1] - r[0]) * K, v.w * K / 2); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = 1; g.stroke();
      });
    });
    T(V, R.model[0], R.model[1], 17, { align: 'left', weight: '800' });
    R.mains[2].forEach(function (s, k) { T(s, R.mains[0], R.mains[1] + k * 8, k ? 5.4 : 6, { align: 'left', weight: k ? '600' : '800' }); });
    if (R.rocker) { T('OFF', R.rocker[0] - 34, R.rocker[1] - 16, 5.5, { align: 'right' }); T('POWER', R.rocker[0] - 30, R.rocker[1], 5.5, { align: 'right' }); T('ON', R.rocker[0] - 34, R.rocker[1] + 15, 5.5, { align: 'right' }); }
    T(R.spkTitle[2], R.spkTitle[0], R.spkTitle[1], 5.6, { align: 'left', weight: '800' });
    T(R.wiring[2], R.wiring[0], R.wiring[1], 5.6, { align: R.wiring[3], weight: '800' });
    R.spk.forEach(function (s) {   // B | + | − | + | − | A
      var labs = [s[2], '+', '−', '+', '−', s[3]], x0 = s[0] - 37;
      labs.forEach(function (l, k) { T(l, x0 + k * 14.8, s[4], 11, { weight: '800' }); if (k < 5) { g.fillStyle = '#eef0f2'; g.fillRect(P(x0 + k * 14.8 + 7.4) - K * 0.6, Q(s[4] - 7), 1.2 * K, 14 * K); } });
      [-1, 1].forEach(function (sd) { bolt(g, P(s[0] + sd * 72), Q(s[1]), 6 * K); });
    });
    // 안전 표시 (경고 삼각형 + 글자 — 상표 아님)
    var wx = R.warn[0], wy = R.warn[1];
    tri(g, P(wx + 6), Q(wy), 9 * K, true); tri(g, P(wx + 62), Q(wy), 9 * K, false);
    g.fillStyle = '#eef0f2'; g.fillRect(P(wx + 16), Q(wy - 6), 38 * K, 9 * K); txt(g, 'CAUTION', P(wx + 35), Q(wy - 9), 4.2 * K, { weight: '800' }); txt(g, 'RISK OF ELECTRIC SHOCK', P(wx + 35), Q(wy - 3), 3.2 * K, { color: '#111', weight: '700' }); txt(g, 'DO NOT OPEN', P(wx + 35), Q(wy + 1), 3.2 * K, { color: '#111', weight: '700' });
    T('WARNING: TO REDUCE THE RISK OF ELECTRIC SHOCK', wx + 35, wy + 10, 3.6, { weight: '600' }); T('DO NOT EXPOSE TO RAIN OR MOISTURE', wx + 35, wy + 15, 3.6, { weight: '600' });
    if (R.rating) { g.fillStyle = '#c9ccd1'; g.fillRect(P(R.rating[0]), Q(R.rating[1]), (R.rating[2] - R.rating[0]) * K, (R.rating[3] - R.rating[1]) * K); txt(g, V + '  AMPLIFIER', P((R.rating[0] + R.rating[2]) / 2), Q(R.rating[1] + 9), 5 * K, { color: '#222' }); txt(g, 'S/N 0000000', P((R.rating[0] + R.rating[2]) / 2), Q(R.rating[1] + 20), 4.4 * K, { color: '#444', weight: '600' }); }
    // 오른쪽 단자판
    R.eth.forEach(function (e) { T(e[2], e[0], e[1] - 28, 5.4, { weight: '800' }); if (e[3]) T(e[3], e[0], e[1] + 28, 5.4, { weight: '800' }); });
    R.inNames.forEach(function (row, r) { row.forEach(function (nm, k) { T(nm, R.inX[k], R.inLabY[r], 5.6, { weight: '800' }); if (r === 0) { T('⏚', R.inX[k] - 12.4, R.inY[0] + 16, 6); T('−', R.inX[k], R.inY[0] + 16, 7); T('+', R.inX[k] + 12.4, R.inY[0] + 16, 7); } else T('⏚', R.inX[k] - 12.4, R.inY[1] + 16, 6); }); });
    if (R.linkBars) [[0, 1], [2, 3]].forEach(function (pr) { g.fillStyle = '#eef0f2'; g.fillRect(P(R.inX[pr[0]] + 24), Q(R.inY[1]) - K, (R.inX[pr[1]] - R.inX[pr[0]] - 48) * K, 2.4 * K); });
    T('RESET', R.resetLab[0], R.resetLab[1], 3.4, { weight: '800' });
    if (R.can) T('CAN', R.can[2], R.can[3], 5.4, { align: 'left', weight: '800' });
    R.gpio.forEach(function (p) { T(p[3], p[4], R.gpioLabY, 5.6, { align: 'left', weight: '800' }); var pitch = 12.44, x0 = p[0] - (p[2] - 1) * pitch / 2; p[5].forEach(function (l, k) { T(l, x0 + k * pitch, R.gpioPinY, l.length > 1 ? 4.6 : 5.4, { weight: '800' }); }); });
    return tex(c);
  }
  function tri(g, x, y, s, bolted) {
    g.fillStyle = '#eef0f2'; g.beginPath(); g.moveTo(x, y - s * 0.6); g.lineTo(x + s * 0.62, y + s * 0.5); g.lineTo(x - s * 0.62, y + s * 0.5); g.closePath(); g.fill();
    g.fillStyle = '#1a1b1d'; if (bolted) bolt(g, x, y + s * 0.08, s * 0.55, '#1a1b1d'); else { g.fillRect(x - s * 0.06, y - s * 0.25, s * 0.12, s * 0.45); g.fillRect(x - s * 0.06, y + s * 0.28, s * 0.12, s * 0.1); }
  }
  function bolt(g, x, y, s, col) { g.fillStyle = col || '#eef0f2'; g.beginPath(); g.moveTo(x + s * 0.15, y - s * 0.5); g.lineTo(x - s * 0.2, y + s * 0.05); g.lineTo(x + s * 0.02, y + s * 0.05); g.lineTo(x - s * 0.15, y + s * 0.5); g.lineTo(x + s * 0.22, y - s * 0.08); g.lineTo(x, y - s * 0.08); g.closePath(); g.fill(); }

  // ---- 모양 도우미 (mm) ----
  function cylZ(r, len, seg) { var g = new THREE.CylinderGeometry(r, r, len, seg || 24); g.rotateX(Math.PI / 2); g.translate(0, 0, len / 2); return g; }   // 0 → +Z 로 len
  function boxZ(w, h, d) { var g = new THREE.BoxGeometry(w, h, d); g.translate(0, 0, d / 2); return g; }   // 가운데 x·y, 0 → +Z
  function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
  function rectPath(p, x0, y0, x1, y1, r) { r = Math.min(r || 0, (x1 - x0) / 2, (y1 - y0) / 2);
    if (r <= 0) { p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.lineTo(x0, y0); return p; }
    p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r); p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
    p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0); return p; }
  function holeRect(x0, y0, x1, y1, r) { return rectPath(new THREE.Path(), x0, y0, x1, y1, r); }
  function holeOval(cx, cy, w, h) { var p = new THREE.Path(), r = Math.min(w, h) / 2; if (w >= h) { p.absarc(cx + w / 2 - r, cy, r, -Math.PI / 2, Math.PI / 2, false); p.absarc(cx - w / 2 + r, cy, r, Math.PI / 2, Math.PI * 1.5, false); } else { p.absarc(cx, cy + h / 2 - r, r, 0, Math.PI, false); p.absarc(cx, cy - h / 2 + r, r, Math.PI, Math.PI * 2, false); } return p; }
  function plate(shapeFn, holes, depth, bevel) {   // XY 모양을 +Z 로 depth 만큼 (z 0 → depth)
    var s = new THREE.Shape(); shapeFn(s); (holes || []).forEach(function (h) { s.holes.push(h); });
    var b = bevel || 0, g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 2, curveSegments: 8 });
    if (b > 0) g.translate(0, 0, b); return g;
  }

  // 정적 부품은 재질별로 하나로 합침 (그리기 호출 수 줄이기)
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
  var Vt = new THREE.Vector3(), Qt = new THREE.Quaternion(), Eu = new THREE.Euler(), ONE = new THREE.Vector3(1, 1, 1);
  function M4(x, y, z, rx, ry, rz) { Eu.set(rx || 0, ry || 0, rz || 0); Qt.setFromEuler(Eu); return new THREE.Matrix4().compose(Vt.set(x, y, z), Qt, ONE); }
  function at(m, x, y, z, rx, ry, rz) { return M4(x, y, z, rx, ry, rz).premultiply(m); }

  // ---- 단자 (로컬: 판 겉면 z=0, +Z = 판 바깥) ----
  function phoenixHeader(B, M, m, n) {   // 3/6/9핀 Phoenix 수(헤더) + 꽂힌 플러그 모습 — 5.08 mm 간격
    var p = 5.08, w = n * p + 3.6, h = 10.2;
    B.add(boxZ(w + 1.6, h + 1.6, 1.2), M.plastic, m);                                   // 판 위 바깥 틀
    B.add(boxZ(w, h, 9), M.plastic2, at(m, 0, -0.6, 0));                                 // 플러그 몸통
    for (var i = 0; i < n; i++) {
      var x = (i - (n - 1) / 2) * p;
      B.add(cylZ(1.75, 0.6, 14), M.hole, at(m, x, -1.6, 9));                                // 전선 구멍
      B.add(boxZ(1.2, 1.2, 0.4), M.brass, at(m, x, -1.6, 9.3));
      B.add(boxZ(2.6, 2.2, 3.2), M.plastic2, at(m, x, h / 2 - 0.1, 6.2));                  // 위쪽 나사 탭
      B.add(cylZ(0.95, 0.5, 10), M.screw, at(m, x, h / 2 + 1.0, 7.8, -Math.PI / 2));       // 나사 머리(위)
    }
  }
  function speakerSocket(B, M, m, wmm) {   // SPEAKER OUTPUTS: 4핀 Phoenix 암(7.62 mm) + 양옆 나사 고정 귀
    var h = 12.7, pitch = 7.62;
    B.add(boxZ(wmm, h, 1.6), M.plastic, m);
    B.add(boxZ(pitch * 4 + 3, h - 0.8, 5.2), M.plastic2, m);
    for (var i = 0; i < 4; i++) {
      var x = (i - 1.5) * pitch;
      B.add(boxZ(5.4, 8.6, 0.4), M.hole, at(m, x, 0.4, 5.05));
      B.add(boxZ(3.2, 0.9, 0.5), M.nickel, at(m, x, -1.0, 5.0));
      B.add(boxZ(1.4, 2.0, 0.3), M.hole, at(m, x, h / 2 - 2.4, 5.1));                       // 위 잠금 홈
    }
    [-1, 1].forEach(function (s) { var x = s * (wmm / 2 - 4.2); B.add(cylZ(2.6, 1.8, 18), M.plastic2, at(m, x, 0, 0)); B.add(cylZ(1.7, 0.6, 16), M.screw, at(m, x, 0, 1.8)); B.add(boxZ(2.4, 0.5, 0.3), M.hole, at(m, x, 0, 2.3)); });
  }
  function rj45(B, M, m, leds) {   // RJ45 (Ethernet · CAN) — 금속 껍데기 + 위쪽 LED 두 개
    B.add(boxZ(16.8, 15, 1.0), M.plastic, m);
    B.add(boxZ(15.2, 13.2, 2.4), M.nickel, at(m, 0, -0.4, 0));
    B.add(boxZ(11.8, 8.8, 0.5), M.hole, at(m, 0, -1.4, 2.05));
    B.add(boxZ(5.8, 2.6, 0.5), M.hole, at(m, 0, -6.2, 2.05));
    if (leds) { B.add(boxZ(2.2, 1.6, 0.6), M.ledGreen, at(m, -4.6, 5.0, 2.2)); B.add(boxZ(2.2, 1.6, 0.6), M.ledAmber, at(m, 4.6, 5.0, 2.2)); }
  }
  function powerCon(B, M, m, r) {   // powerCON TRUE1 TOP (둥근 판 + 안쪽 구멍 + 가운데 축)
    B.add(cylZ(r + 1.4, 2.0, 36), M.plastic, m);
    B.add(cylZ(r, 4.2, 36), M.plastic2, m);
    B.add(cylZ(r - 2.0, 0.4, 36), M.hole, at(m, 0, 0, 4.0));
    B.add(cylZ(r * 0.42, 3.4, 24), M.grey, at(m, 0, 0, 1.0));
    B.add(boxZ(2.4, r * 0.5, 0.6), M.hole, at(m, 0, r * 0.12, 4.2));
    [0, 2.1, 4.2].forEach(function (a) { B.add(boxZ(3.4, 1.8, 0.6), M.nickel, at(m, Math.cos(a) * (r * 0.68), Math.sin(a) * (r * 0.68), 3.9, 0, 0, a)); });
    B.add(boxZ(4, 3.2, 3.2), M.grey, at(m, 0, -r - 0.6, 0));                                 // 잠금 걸쇠
  }
  function rocker(B, M, m, r) {   // 10D 뒷면 둥근 로커 전원 스위치
    B.add(cylZ(r, 2.4, 36), M.plastic, m);
    B.add(cylZ(r - 1.6, 0.4, 36), M.hole, at(m, 0, 0, 2.3));
    B.add(boxZ(r * 1.25, r * 0.8, 3.2), M.plastic2, at(m, 0, r * 0.38, 1.8, 0.22));
    B.add(boxZ(r * 1.25, r * 0.8, 1.6), M.plastic2, at(m, 0, -r * 0.38, 1.8, -0.1));
    B.add(boxZ(r * 0.6, 0.8, 0.3), M.grey, at(m, 0, -r * 0.4, 3.45));
  }

  // ---------------------------------------------------------------------------
  function create(opts) {
    opts = opts || {};
    var V = String(opts.variant || '40D').toUpperCase();
    if (VARIANTS.indexOf(V) < 0) throw new Error('[DbAmps] 알 수 없는 variant: ' + opts.variant);
    var D = DIMENSIONS_MM[V], R = REAR[V], F = FRONT[V], M = makeMaterials();
    var root = new THREE.Group(); root.name = 'dbAmp.' + V;
    var mm = new THREE.Group(); mm.name = 'dbAmp.' + V + '.mm'; mm.scale.setScalar(0.001); root.add(mm);
    var B = Baker(), dyn = new THREE.Group(); dyn.name = 'dbAmp.dynamic'; mm.add(dyn);
    var ZF = D.depth / 2, ZB = -D.depth / 2, HW = D.width / 2, BW = D.bodyWidth / 2, H = D.height;
    var by0 = (H - D.bodyHeight) / 2, by1 = by0 + D.bodyHeight;
    var leds = {}, power = opts.power !== false;

    // ---- 몸체(덮개) ----
    var bodyLen = D.depth - D.frontPanel;
    B.add(box(D.bodyWidth, D.bodyHeight, bodyLen), M.cover, M4(0, (by0 + by1) / 2, ZB + bodyLen / 2));
    // 덮개 위 나사 (치수 도면 윗면 그림 비례 추정) · 옆 나사
    [-179.8, -58, 59.5, 179.8].forEach(function (x) { [ZF - 12, ZB + 34].forEach(function (z) { B.add(new THREE.CylinderGeometry(2.6, 2.8, 0.8, 16).translate(0, by1 + 0.4, 0), M.screw, M4(x, 0, z)); }); });
    [-1, 1].forEach(function (s) { [ZB + 62, ZB + 270, ZB + 427].forEach(function (z) { if (z < ZF - D.frontPanel - 4) B.add(cylZ(2.5, 0.8, 16), M.screw, M4(s * BW, by0 + 10, z, 0, s * Math.PI / 2)); }); });
    // 바닥 판 이음선 느낌 (얇은 띠)
    B.add(box(D.bodyWidth - 6, 0.6, bodyLen - 6), M.frame, M4(0, by0 - 0.3, ZB + bodyLen / 2));

    // ---- 앞판 (구멍: 랙 귀 긴 구멍 4개 + 화면 창/흡입구) ----
    var earHoles = []; [-1, 1].forEach(function (s) { [H / 2 - D.rackHoleY / 2, H / 2 + D.rackHoleY / 2].forEach(function (y) { earHoles.push(holeOval(s * D.rackHoleX / 2, y, 9.5, 5.6)); }); });
    var fHoles = earHoles.slice(), iHoles = [];
    if (F.screen) { var sc = F.screen, h1 = holeRect(sc.x - sc.w / 2, sc.y - sc.h / 2, sc.x + sc.w / 2, sc.y + sc.h / 2, 3.2); fHoles.push(h1); iHoles.push(holeRect(sc.x - sc.w / 2, sc.y - sc.h / 2, sc.x + sc.w / 2, sc.y + sc.h / 2, 3.2)); }
    var opening = F.slot || F.vent;
    fHoles.push(holeRect(opening.x0, opening.y0, opening.x1, opening.y1, F.slot ? 2.4 : 0.8));
    iHoles.push(holeRect(opening.x0, opening.y0, opening.x1, opening.y1, F.slot ? 2.4 : 0.8));
    var front = plate(function (s) { rectPath(s, -HW, 0, HW, H, 2.2); }, fHoles, 4, 0.7);
    B.add(front, M.front, M4(0, 0, ZF - 4));
    var inner = plate(function (s) { rectPath(s, -BW, by0, BW, by1, 1); }, iHoles, D.frontPanel - 4);
    B.add(inner, M.frame, M4(0, 0, ZF - D.frontPanel));
    // 흡입구 안쪽: 타공 그릴 + 검은 뒤판
    var ow = opening.x1 - opening.x0, oh = opening.y1 - opening.y0, ocx = (opening.x0 + opening.x1) / 2, ocy = (opening.y0 + opening.y1) / 2;
    var pt = perfTex(!!F.slot); pt.repeat.set(ow / (F.slot ? 3.2 : 2.6), oh / (F.slot ? 3.2 : 2.6));
    var grille = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.6, metalness: 0.5 }));
    grille.position.set(ocx, ocy, F.slot ? ZF - 6.5 : ZF - 1.6); grille.name = 'dbAmp.intakeGrille'; mm.add(grille);
    B.add(box(ow, oh, 0.5), M.hole, M4(ocx, ocy, ZF - D.frontPanel + 0.3));

    // 모델명 글자 (앞)
    var mt = textTex([[V, 30, 12, 20, 'center', '800', '#f4f5f6']], 60, 24, 12);
    var mPlane = new THREE.Mesh(new THREE.PlaneGeometry(60 * 0.41, 24 * 0.41), new THREE.MeshStandardMaterial({ map: mt, transparent: true, roughness: 0.5, metalness: 0.1 }));
    mPlane.position.set(F.model[0], F.model[1], ZF + 0.05); mPlane.name = 'dbAmp.frontModelText'; mm.add(mPlane);

    var screen = null, screenMats = null;
    if (V === '40D') {
      // 4.3" 터치스크린: 창 안쪽 검은 테두리 + 화면 (창 안 1.5 mm 들어감)
      var sc2 = F.screen;
      B.add(box(sc2.w + 1, sc2.h + 1, 2), M.bezel, M4(sc2.x, sc2.y, ZF - 3.2));
      screenMats = { on: new THREE.MeshStandardMaterial({ map: screenTex(true), emissive: 0xffffff, roughness: 0.18, metalness: 0.1 }), off: new THREE.MeshStandardMaterial({ map: screenTex(false), roughness: 0.15, metalness: 0.3 }) };
      screenMats.on.emissiveMap = screenMats.on.map; screenMats.on.emissiveIntensity = 0.75;
      screen = new THREE.Mesh(new THREE.PlaneGeometry(sc2.aw, sc2.ah), power ? screenMats.on : screenMats.off);
      screen.position.set(sc2.x, sc2.y, ZF - 2.1); screen.name = 'dbAmp.screen'; dyn.add(screen);
      var glass = new THREE.Mesh(new THREE.PlaneGeometry(sc2.w - 0.6, sc2.h - 0.6), new THREE.MeshStandardMaterial({ color: 0x0a0c10, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.6 }));
      glass.position.set(sc2.x, sc2.y, ZF - 1.4); glass.name = 'dbAmp.screenGlass'; mm.add(glass);
    } else {
      // 10D 앞 LED 띠: 살짝 들어간 띠 + 글자 + LED
      var bd = F.band, bw = bd.x1 - bd.x0, bh = bd.y1 - bd.y0;
      B.add(box(bw, 0.8, 0.5), M.frame, M4((bd.x0 + bd.x1) / 2, bd.y1 - 0.4, ZF + 0.1));
      B.add(box(bw, 0.8, 0.5), M.frame, M4((bd.x0 + bd.x1) / 2, bd.y0 + 0.4, ZF + 0.1));
      var L = [], ox = bd.x0, oy = bd.y1;   // 글자판 좌표: 띠 왼쪽 위 기준 mm
      function lab(s, x, y, size, al) { L.push([s, x - ox, oy - y, size, al || 'left', '800']); }
      lab('POWER', F.power + 3.2, F.ledY[0], 2.6); lab('DATA', F.power + 3.2, F.ledY[1], 2.6);
      ['A', 'B', 'C', 'D'].forEach(function (c, i) { var ch = F.chan[i >> 1], y = F.ledY[i & 1]; lab(c, ch.x - 3.4, y, 2.7, 'right'); lab('MUTE', ch.x + 3.0, y, 2.6); });
      var lt = textTex(L, F.vent.x0 - bd.x0 - 2, bh, 24);
      var lp = new THREE.Mesh(new THREE.PlaneGeometry(F.vent.x0 - bd.x0 - 2, bh), new THREE.MeshStandardMaterial({ map: lt, transparent: true, roughness: 0.5 }));
      lp.position.set(bd.x0 + (F.vent.x0 - bd.x0 - 2) / 2, (bd.y0 + bd.y1) / 2, ZF + 0.05); lp.name = 'dbAmp.ledLabels'; mm.add(lp);
      var ledGeo = cylZ(1.45, 0.9, 16), ringGeo = cylZ(2.0, 0.3, 20);
      function led(id, x, y, onMat, offMat, lit) {
        B.add(ringGeo, M.bezel, M4(x, y, ZF));
        var m = new THREE.Mesh(ledGeo, lit && power ? onMat : offMat); m.position.set(x, y, ZF); m.name = 'dbAmp.led.' + id; dyn.add(m);
        leds[id] = { mesh: m, on: onMat, off: offMat, lit: !!lit }; return m;
      }
      led('power', F.power, F.ledY[0], M.ledGreen, M.ledOff, true);
      led('data', F.power, F.ledY[1], M.ledYellow, M.ledOff, true);
      ['A', 'B', 'C', 'D'].forEach(function (c, i) {
        var ch = F.chan[i >> 1], y = F.ledY[i & 1];
        led('mute' + c, ch.x, y, M.ledRed, M.ledRedOff, false);
        led('isp' + c, ch.s[0], y, M.ledGreen, M.ledOff, true);
        led('gr' + c, ch.s[1], y, M.ledYellow, M.ledOff, false);
        led('ovl' + c, ch.s[2], y, M.ledRed, M.ledOff, false);
      });
    }

    // ---- 뒤 랙 귀 (L자: 옆 다리 + 뒤를 보는 날개) ----
    var zEar = ZF - D.rearEarFromFront;   // 날개 뒤쪽 면
    [-1, 1].forEach(function (s) {
      var holes = R.ear.slots.map(function (p) { var x = Math.abs(R.cx - p[0]) / S, y = (R.by - p[1]) / S; return holeOval(s * x, y, 8.5, 5.2); });
      var x0 = s > 0 ? BW : -HW, x1 = s > 0 ? HW : -BW;
      var wing = plate(function (sh) { rectPath(sh, x0, by0 - 0.5, x1, by1 + 0.5, 2.5); }, holes, 2.4);
      B.add(wing, M.ear, M4(0, 0, zEar - 2.4));
      var legZ0 = ZB + 2, legZ1 = zEar + 22;   // 옆 다리: 몸체 옆면에 붙음 (길이 추정)
      B.add(box(2, D.bodyHeight - 6, legZ1 - legZ0), M.ear, M4(s * (BW + 1), (by0 + by1) / 2, (legZ0 + legZ1) / 2));
      R.ear.screws.forEach(function (p) { var x = Math.abs(R.cx - p[0]) / S, y = (R.by - p[1]) / S; B.add(cylZ(3.4, 1.2, 20), M.screw, M4(s * x, y, zEar - 2.4, 0, Math.PI)); B.add(cylZ(1.8, 0.3, 14), M.hole, M4(s * x, y, zEar - 3.6, 0, Math.PI)); });
    });

    // ---- 뒷면 그림판 + 단자 ----
    var rW = (R.x1 - R.x0) / S, rH = (R.by - R.top) / S;
    var rear = new THREE.Mesh(new THREE.PlaneGeometry(rW, rH), new THREE.MeshStandardMaterial({ map: rearDecal(R, V), roughness: 0.6, metalness: 0.3 }));
    rear.position.set((R.cx - (R.x0 + R.x1) / 2) / S, (R.by - (R.top + R.by) / 2) / S, ZB - 0.2); rear.rotation.y = Math.PI; rear.name = 'dbAmp.rearPanel'; mm.add(rear);
    function onRear(px, py, out) { return M4((R.cx - px) / S, (R.by - py) / S, ZB - 0.2 - (out || 0), 0, Math.PI); }
    powerCon(B, M, onRear(R.powercon[0], R.powercon[1]), R.powercon[2]);
    if (R.rocker) rocker(B, M, onRear(R.rocker[0], R.rocker[1]), R.rocker[2]);
    R.spk.forEach(function (s) { speakerSocket(B, M, onRear(s[0], s[1]), R.spkW); });
    R.eth.forEach(function (e) { rj45(B, M, onRear(e[0], e[1]), true); });
    if (R.can) { var cm = onRear(R.can[0], R.can[1]); B.add(boxZ(36, 15.5, 0.8), M.plastic, cm); [-1, 1].forEach(function (s) { rj45(B, M, at(cm, s * 8.3, 0, 0.2), false); }); }
    R.inY.forEach(function (y) { R.inX.forEach(function (x) { phoenixHeader(B, M, onRear(x, y), 3); }); });
    B.add(cylZ(2.2, 0.6, 18), M.plastic, onRear(R.reset[0], R.reset[1])); B.add(cylZ(1.3, 0.4, 14), M.hole, onRear(R.reset[0], R.reset[1], 0.4));
    R.gpio.forEach(function (p) { phoenixHeader(B, M, onRear(p[0], p[1]), p[2]); });

    B.build(mm, 'dbAmp.static');

    // ---- 동작 ----
    function setLed(id, on) { var l = leds[id]; if (!l) throw new Error('[DbAmps] unknown led ' + id); l.lit = !!on; l.mesh.material = on && power ? l.on : l.off; }
    function setPower(on) {
      power = !!on;
      if (screen) screen.material = power ? screenMats.on : screenMats.off;
      Object.keys(leds).forEach(function (k) { var l = leds[k]; l.mesh.material = l.lit && power ? l.on : l.off; });
    }
    var api = { variant: V, leds: leds, setLed: setLed, setPower: setPower, isOn: function () { return power; },
      setMute: function (ch, on) { setLed('mute' + String(ch).toUpperCase(), on); },
      counts: function () { var n = 0; root.traverse(function (o) { if (o.isMesh) n++; }); return { meshes: n, leds: Object.keys(leds).length }; } };
    Object.defineProperty(root.userData, 'dbAmp', { value: api, enumerable: false });
    root.userData.variant = V;
    return root;
  }

  global.DbAmps = {
    VARIANTS: VARIANTS.slice(), DIMENSIONS_MM: DIMENSIONS_MM, LAYOUT: { REAR: REAR, FRONT: FRONT, PX_PER_MM: S },
    VIEW_DIR: { '40D': [0.42, 0.3, 1], '10D': [0.42, 0.3, 1], rear: [-0.45, 0.32, -1] },
    create: create,
    api: function (root) { return root && root.userData ? root.userData.dbAmp : null; }
  };
})(typeof window !== 'undefined' ? window : this);
