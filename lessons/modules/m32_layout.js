/* =============================================================================
   03-3 디지털 콘솔 실습 — Midas M32 LIVE 사진 배치 (2026-11-08)
   - x32_photo_sim.js 의 사진 위 표면을 그대로 쓰고, 단추 · 노브 · 페이더 · 화면 위치만 M32 사진에 맞춰요.
     M32 는 X32 와 같은 운영 소프트웨어(펌웨어 4)를 써서 화면 · 단추 기능이 같아요. 소리 · 상태도 같은 X32Model · X32Audio 를 씀.
   - 사진: Midas 공식 제품 사진 Image_MI_0603-AEO_M32-LIVE_Front_XL.png (2000×974). 위쪽 판(채널 섹션 · 화면)과
     아래쪽 판(페이더)을 앞에서 비스듬히 찍은 사진이라, 아래로 갈수록 칸이 양옆으로 조금씩 벌어져요(원근).
     좌표는 사진을 격자와 함께 1.5~2배로 확대해 실측(2026-11-08). 페이더 줄은 geo() 가 줄마다 x 를 옮겨 줘요.
   ============================================================================= */
(function () {
  'use strict';
  window.STASims = window.STASims || {};
  var L = window.STASims.x32Layouts = window.STASims.x32Layouts || {};
  // 칸이 벌어지는 양(dx): SEL 줄 x 를 기준으로 [x, MUTE 줄(y541), 페이더 위(y582.5), 페이더 아래(y696)]
  var DX = [[263.5, -28.5, -36, -63], [403, -20.5, -28, -48], [592.5, -13.5, -18.5, -33.5], [664, -13, -18, -29], [711, -10, -13.5, -25], [756, -6, -10, -17],
    [947.5, -2.5, -1.5, -5], [992.5, 2.5, 2.5, 2.5], [1095, 5, 6.5, 10], [1382.5, 12.5, 17.5, 22.5], [1427.5, 16.5, 22.5, 30], [1502.5, 20, 27.5, 45]];
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dxRow(cx, k) {   // k: 1 = MUTE, 2 = 페이더 위, 3 = 페이더 아래
    if (cx <= DX[0][0]) return DX[0][k]; if (cx >= DX[DX.length - 1][0]) return DX[DX.length - 1][k];
    for (var i = 0; i < DX.length - 1; i++) if (cx <= DX[i + 1][0]) return lerp(DX[i][k], DX[i + 1][k], (cx - DX[i][0]) / (DX[i + 1][0] - DX[i][0]));
    return 0;
  }
  var Y_SEL = 428.5, Y_MUTE = 541, Y_FT = 582.5, Y_FB = 696;
  function dxAt(cx, y) {
    if (y <= Y_SEL) return 0;
    if (y <= Y_MUTE) return dxRow(cx, 1) * (y - Y_SEL) / (Y_MUTE - Y_SEL);
    if (y <= Y_FT) return lerp(dxRow(cx, 1), dxRow(cx, 2), (y - Y_MUTE) / (Y_FT - Y_MUTE));
    return lerp(dxRow(cx, 2), dxRow(cx, 3), (y - Y_FT) / (Y_FB - Y_FT));
  }
  function at(cx, y) { return [cx + dxAt(cx, y), y]; }
  var LEDY = [448.5, 452.5, 456.5, 460.5, 464.5, 468.5, 472.5, 476.5];   // COMP · CLIP · −6 · −12 · −18 · −30 · −60 · GATE
  function geo(cx, side) {
    var g = { sel: [cx, Y_SEL], ledX: cx + dxAt(cx, 462) - 6, ledYs: LEDY, solo: at(cx, 485), lcd: at(cx, 518), mute: at(cx, Y_MUTE), fTop: at(cx, 586), fBot: at(cx, 693), val: at(cx, 709) };
    if (side === 'main') { g.comp = at(cx - 8, 446); g.clr = at(cx + 2, 463); g.solo = at(cx + 2, 484); g.lcd = at(cx, 518); }
    return g;
  }
  function ix(a, b, n) { var r = []; for (var i = 0; i < n; i++) r.push(+(a + (b - a) * i / (n - 1)).toFixed(1)); return r; }
  L.m32 = {
    key: 'm32', name: 'M32', brand: 'Midas', alt: 'Midas M32 LIVE (공식 제품 사진, 앞에서 비스듬히)', photoNote: '(앞에서 비스듬히 찍은 사진이라 아래쪽 단추일수록 조금씩 옆으로 벌어져 있어요)',
    IMG: 'https://cdn-media.empowertribe.com/88b7019edb6a4da19acbf5407a5d6caa/Image_MI_0603-AEO_M32-LIVE_Front_XL.png',
    PW: 2000, PH: 900,
    SCREEN_RECT: { x: 1067, y: 101, w: 301, h: 181 },
    STRIP_IN: ix(263.5, 592.5, 8).concat(ix(664, 992.5, 8)),
    STRIP_R: ix(1095, 1427.5, 8), STRIP_MAIN: 1503,
    ROW: { select: Y_SEL, solo: 485, lcd: 518, mute: Y_MUTE, fTop: 586, fBot: 693, led: LEDY },
    geo: geo,
    BW: 23, BH: 12, KNOB_BOX: 40, ENC_BOX: 30, ENC_D: 26, LCD: [42, 20], SLOT_W: 26, SLOT_PAD: 9, LED_W: 4.5, LED_H: 2.6,
    KN: {
      gain: [265, 91, 36, 'GAIN'], lcf: [396, 91, 36, 'LOW CUT FREQUENCY'], gthr: [263, 240, 36, 'GATE THRESHOLD'], dthr: [392, 240, 36, 'DYNAMICS THRESHOLD'],
      eqq: [568, 91, 36, 'EQ WIDTH (Q)'], eqf: [568, 167, 36, 'EQ FREQUENCY'], eqg: [568, 243, 36, 'EQ GAIN'],
      s1: [740, 91, 36, 'BUS SENDS 노브 1'], s2: [740, 167, 36, 'BUS SENDS 노브 2'], s3: [740, 242, 36, 'BUS SENDS 노브 3'], s4: [740, 318, 36, 'BUS SENDS 노브 4'],
      mlev: [911, 167, 36, 'MAIN BUS M/C LEVEL (MONO/CENTRE 로 보내는 양)'], mpan: [911, 241, 36, 'PAN / BAL'],
      mon: [1629, 107, 34, 'MONITOR LEVEL (모니터 스피커 크기)'], phn: [1629, 183, 34, 'PHONES LEVEL (헤드폰 크기)'], talk: [1750, 182, 34, 'TALK LEVEL (토크백 마이크 크기)'],
      as1: [1601, 465, 34, 'ASSIGN 노브 1'], as2: [1665, 465, 34, 'ASSIGN 노브 2'], as3: [1729, 465, 34, 'ASSIGN 노브 3'], as4: [1792, 465, 34, 'ASSIGN 노브 4']
    },
    ENC: [1095, 1145, 1197, 1247, 1299, 1349], ENC_Y: 317,
    MENU: [['home', 'HOME', 99], ['meters', 'METERS', 130], ['routing', 'ROUTING', 162], ['setup', 'SETUP', 193], ['library', 'LIBRARY', 226], ['effects', 'EFFECTS', 258], ['mutegrp', 'MUTE GRP', 290], ['utility', 'UTILITY', 322]],
    MENU_X: 1510, MENU_W: 44, MENU_H: 19,
    LAYER_L: [['ch1-16', 595, 'INPUTS 1-16', 169], ['ch17-32', 622.5, 'INPUTS 17-32', 162.5], ['aux-fx', 651, 'AUX IN / USB · FX RETURNS', 156], ['bus1-8', 678.5, 'BUS MASTER', 149]],
    LAYER_R: [['dca', 594, 'GROUP DCA 1-8'], ['bus1-8', 621, 'BUS 1-8'], ['bus9-16', 649, 'BUS 9-16'], ['mtx-main', 677, 'MTX 1-6 / MAIN C']],
    LAYER_LX: 160, LAYER_RX: 1050, LAYER_W: 30, LAYER_H: 13, SOF: [1045, 460, 26, 13], SOF_TIP: 'FADER FLIP = SENDS ON FADER (페이더로 BUS 에 보내는 양 조절)', DAW: [204, 459, 26, 12],
    EQ_TYPE_LED: [['HCut', 138], ['HShv', 147], ['VEQ', 171], ['PEQ', 181], ['LShv', 203], ['LCut', 213]], EQ_LED_X: 503, EQ_LED: [6, 4],
    BTNS: [['p48', 245, 160, '+48V (팬텀 전원 — 콘덴서 마이크 전기)', 'r', 24, 14], ['phase', 292, 160, 'Ø (극성 뒤집기: 소리 물결을 위아래로 뒤집기)', 'y', 24, 14], ['lc', 397, 160, 'LOW CUT (낮은 소리 걸러 내기) 켜기', 'y', 24, 14], ['v.config', 436, 181, 'VIEW — 화면에 CONFIG/PREAMP 페이지', 'y', 18, 14],
     ['gate', 265, 308, 'GATE 켜기 (작은 소리 막기)', 'y', 24, 14], ['v.gate', 305, 331, 'VIEW — 화면에 GATE 페이지', 'y', 18, 14], ['dyn', 394, 308, 'DYNAMICS(COMP) 켜기 (컴프: 큰 소리 누르기)', 'y', 24, 14], ['v.dyn', 433, 331, 'VIEW — 화면에 DYNAMICS 페이지', 'y', 18, 14],
     ['eqmode', 505, 275, 'EQ MODE (고른 밴드의 모양 바꾸기)', 'y', 24, 14], ['band3', 657, 147, 'EQ HIGH 밴드 고르기', 'y', 24, 14], ['band2', 657, 190, 'EQ HI MID 밴드 고르기', 'y', 24, 14], ['band1', 657, 235, 'EQ LO MID 밴드 고르기', 'y', 24, 14], ['band0', 657, 277, 'EQ LOW 밴드 고르기', 'y', 24, 14],
     ['eq', 569, 308, 'EQUALISER 켜기', 'y', 24, 14], ['v.eq', 655, 331, 'VIEW — 화면에 EQ 페이지', 'y', 18, 14],
     ['sb0', 825, 148, 'BUS SENDS 1-4 (노브 4개가 BUS 1-4)', 'y', 24, 14], ['sb1', 825, 190, 'BUS SENDS 5-8', 'y', 24, 14], ['sb2', 825, 235, 'BUS SENDS 9-12', 'y', 24, 14], ['sb3', 825, 277, 'BUS SENDS 13-16', 'y', 24, 14], ['v.sends', 825, 331, 'VIEW — 화면에 SENDS 페이지', 'y', 18, 14],
     ['mono', 995, 191, 'MONO CENTRE 로 보내기 (M/C 노브로 양 정하기)', 'y', 24, 14], ['lr', 995, 265, 'MAIN STEREO (메인 LR) 로 보내기', 'y', 24, 14], ['v.main', 995, 331, 'VIEW — 화면에 MAIN 페이지', 'y', 18, 14],
     ['v.usb', 995, 109, 'RECORDER VIEW — 화면에 USB 녹음기 페이지', 'y', 18, 14],
     ['monmono', 1629, 252, '모니터 MONO (헤드폰 · 모니터를 모노로)', 'y', 24, 14], ['dim', 1629, 295, '모니터 DIM (모니터 소리를 잠깐 줄이기)', 'y', 24, 14], ['v.mon', 1660, 331, 'MONITOR VIEW — 화면에 모니터 페이지', 'y', 18, 14],
     ['talka', 1748, 252, 'TALK A (토크백 마이크를 A 로)', 'y', 24, 14], ['talkb', 1748, 295, 'TALK B (토크백 마이크를 B 로)', 'y', 24, 14], ['v.talk', 1780, 331, 'TALKBACK VIEW — 화면에 토크백 설정', 'y', 18, 14],
     ['sc.prev', 1590, 428, 'SHOW CONTROL: LAST (앞 씬 고르기)', 'y', 26, 12], ['sc.next', 1641, 428, 'SHOW CONTROL: NEXT (다음 씬 고르기)', 'y', 26, 12], ['sc.undo', 1693, 428, 'SHOW CONTROL: UNDO (불러오기 되돌리기)', 'y', 26, 12], ['sc.go', 1745, 428, 'SHOW CONTROL: GO (고른 씬 불러오기)', 'g', 26, 12], ['sc.view', 1792, 443, 'SHOW CONTROL VIEW — 화면에 씬 목록', 'y', 18, 12],
     ['as.setA', 1657, 602, 'ASSIGN SET A', 'r', 18, 11], ['as.setB', 1723, 602, 'ASSIGN SET B', 'r', 18, 11], ['as.setC', 1788, 602, 'ASSIGN SET C', 'r', 18, 11], ['v.assign', 1835, 617, 'ASSIGN VIEW — 화면에 ASSIGN 설정', 'y', 18, 12]],
    ASSIGN_B: [[1613, 541], [1677, 541], [1741, 541], [1807, 541], [1617, 571], [1683, 571], [1748, 571], [1815, 571]], ASSIGN_BS: [26, 12],
    MG_B: [[1668, 654], [1735, 654], [1801, 654], [1673, 687], [1741, 687], [1809, 687]], MG_BS: [27, 12],
    NAV: [['up', 1433, 305, 'LAYER ▲ (화면 안에서 위 줄로)'], ['down', 1433, 333, 'LAYER ▼ (화면 안에서 아래 줄로)'], ['pgl', 1409, 320, 'PAGE SELECT ◀ (앞 탭)'], ['pgr', 1457, 320, 'PAGE SELECT ▶ (다음 탭)']], NAV_S: 15,
    PRE_M: { box: [333, 130, 7, 56], x: 333, ys: [106.5, 113, 120, 126.5, 133, 140, 146.5, 154.5], s: [5, 3] },
    GR_M: { box: [330, 280, 7, 52], x: 330, ys: [263, 271, 279, 287, 295, 303], gate: 255, s: [5, 3] },
    USB_LED: [938, 81, 5, 4],
    MAIN_M: { xs: [1395, 1425, 1443], y0: 120, y1: 263, s: [5, 2.8] },
    ALCD: { xs: [1601, 1667, 1730, 1793], y: 513, w: 47, h: 20 }
  };
})();
