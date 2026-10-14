/* =============================================================================
   Shure SM58 다이내믹 마이크 — 절차적(procedural) 3D 모델  (Three.js r128 전용)
   -----------------------------------------------------------------------------
   - 전역 네임스페이스: window.ShureSM58   (기존 코드와 이름 충돌 없음)
   - 좌표 단위: 미터.  원점 = 손잡이 하단 XLR 개구부(림 평면)의 중심.
       +Y = 그릴 방향(마이크 축),  +Z = 정면(로고 "SM58"·래치 창·고정나사 쪽),  +X = 정면에서 볼 때 오른쪽
   - 공식 치수 (Shure SM58 User Guide 2006 Rev.3, Figure 5 "Overall Dimensions" / 제품 스펙시트):
       전체 길이 162mm, 최대 지름(그릴) 51mm, 하단(커넥터 쪽) 지름 23mm
   - 단면 곡선(그릴·헤드·손잡이 테이퍼)은 Shure 공식 제품 정면 사진(배경 투명 PNG/WebP)의 실루엣을
     픽셀 단위로 측정해 위 3개 공식 치수에 맞춘 값입니다(3.28px/mm). = "사진 비례 측정치"
   - XLR 수(male) 리셉터클 내부(보어 지름·핀 위치·래치 창)는 프로젝트에 이미 있는 XLR 암 플러그
     GLB(assets3d/gear_models_data.js의 xlrPlugF)의 실측 형상에 맞춰 설계했습니다.
   ============================================================================= */
(function (global) {
  'use strict';
  var THREE = global.THREE;
  if (!THREE) { console.error('[ShureSM58] THREE가 먼저 로드되어야 합니다.'); return; }

  var NS = 'shureSm58';
  var MM = 0.001;

  var DIM = {
    length: 162,        // official
    maxDiameter: 51,    // official (그릴 적도 밴드)
    endDiameter: 23,    // official (손잡이 하단, XLR 쪽)
    weightKg: 0.33      // official (현행 온라인 가이드; 2006 가이드는 298g)
  };

  // SM58S 스위치 (추정): 손잡이 정면 y 86mm, 판 7 x 15, 슬롯 2.4 x 9, 손잡이 4.4 x 4.6, 이동 4mm (그릴 쪽 = ON)
  var SWITCH_MM = { y: 86, plateW: 7.0, plateH: 15.0, slotW: 2.4, slotH: 9.0, knobW: 4.4, knobH: 4.6, travel: 4.0 };

  // ---- 외곽 단면 (반지름 r, 높이 y; mm, y=0 하단 림, y=162 그릴 꼭대기) — 공식 사진 실루엣 측정 ----
  // t(위에서부터 거리) = 162 - y
  var PROFILE = {
    // 손잡이: 하단 림 ~ 이음매(y 95.2)
    handle: [[11.0, 0], [11.6, 0.8], [11.75, 4], [11.9, 9.5], [12.3, 25], [12.7, 40], [13.25, 55], [13.8, 65],
      [14.2, 70.5], [14.75, 82], [15.15, 90], [15.35, 94.4], [15.3, 95.0]],
    seam: { y: 95.2, h: 0.6, depth: 0.45 },           // 손잡이-헤드 사이 홈
    // 헤드(검은 금속): 이음매 ~ 로고 칼라 시작
    head: [[15.4, 95.4], [15.7, 96.1], [15.9, 99.8], [16.3, 105.3], [16.5, 113.5], [16.9, 117.2]],
    // 로고 칼라: 헤드에서 그릴 하단 링까지 벌어지는 짧은 원뿔대 (흰 인쇄)
    collar: [[16.9, 117.2], [17.5, 118.1], [18.5, 119.0], [18.9, 120.6]],
    lowerRing: { y0: 120.6, y1: 122.4, r: 19.7 },      // 그릴 하단 은색 링
    // 아래쪽 그릴(반구 하부): 하단 링 ~ 적도 밴드
    grilleLower: [[19.4, 122.4], [20.1, 122.6], [20.6, 123.6], [21.3, 125.4], [22.3, 127.2], [22.9, 129.0],
      [23.6, 130.9], [24.1, 132.7], [24.5, 134.6], [24.8, 136.4], [25.0, 137.8]],
    band: { y0: 137.8, y1: 141.0, r: 25.5 },           // 적도 밴드(최대 지름 51mm)
    // 위쪽 그릴(돔)
    grilleUpper: [[25.0, 141.0], [24.0, 142.0], [23.6, 142.8], [23.0, 144.6], [22.6, 146.4], [22.1, 148.3],
      [21.1, 150.1], [20.1, 151.9], [19.2, 152.8], [18.3, 153.8], [17.7, 154.7], [16.6, 155.6], [15.7, 156.5],
      [14.6, 157.4], [13.0, 158.3], [11.4, 159.3], [9.8, 160.2], [7.6, 161.1], [4.1, 161.7], [0.0, 162.0]]
  };

  // ---- XLR 수 리셉터클 (2026-10-14 수정: 실제 규격 플러그에 맞춤) ----
  // 결합 상대 = Neutrik NC3FXX 형 암 플러그(공식 노즈 Ø15.75, 3단계 XLR 케이블과 같음).
  //  - 이전 값: 보어 Ø17.5 (프로젝트 xlrPlugF GLB 노즈 Ø16.96 기준) → 실제 플러그와 반지름 0.88mm 헐거움
  //  - 수정: 보어 Ø16.1 (노즈 + 반지름 여유 0.175mm), 핀 위치 = XLR 표준 (±4.04, 0), (0, −3.95) — MG12XU·ZXA1·XLR 케이블과 같음
  var XLR = {
    boreR: 8.05,           // 보어 반지름 (노즈 7.875 + 여유 0.175)
    boreDepth: 15.0,       // 인서트 면까지 깊이
    insertDepthMM: 13.0,   // 권장 삽입 깊이: 노즈(13mm)가 다 들어가면 노즈 뒤 턱이 림에 닿음
    pinR: 0.8,             // 핀 반지름 (지름 1.6mm, 비례 추정)
    pinTipDepth: 4.0,      // 핀 끝이 개구부 안쪽 4mm (비례 추정)
    // 핀 위치 (마이크 로컬 x, z; mm). 플러그 소켓 (x, y_plug) → 마이크 (x, z)
    pins: [{ id: 'A', x: -4.04, z: 0 }, { id: 'B', x: 4.04, z: 0 }, { id: 'C', x: 0, z: -3.95 }],
    latchWindow: { y0: 1.4, y1: 3.6, halfW: 2.2, rOut: 9.9 }, // +Z 쪽 래치 창
    setScrew: { y: 18.0 } // 손잡이 정면 하단 고정나사 높이 (사진 측정)
  };

  // ---------------------------------------------------------------------------
  function toM(geo) { geo.scale(MM, MM, MM); return geo; }
  function setPosMM(o, x, y, z) { o.position.set(x * MM, y * MM, z * MM); return o; }
  function mk(geo, mat, name, opts) {
    var m = new THREE.Mesh(toM(geo), mat);
    m.name = NS + '.' + name;
    var o = opts || {};
    m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false;
    return m;
  }
  function grp(name) { var g = new THREE.Group(); g.name = NS + '.' + name; return g; }
  function hide(t, k, v) { Object.defineProperty(t, k, { value: v, enumerable: false, writable: true, configurable: true }); return v; }
  // 단면 [[r,y],...] (아래→위) → Y축 회전체. 아래→위 순서여야 법선이 바깥을 향함.
  // phiStart=π 로 두면 u=0.5 가 정면(+Z)이 되어 인쇄 텍스처를 정면 중앙에 맞추기 쉬움.
  function lathe(pts, seg, phiStart) {
    var v = pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    if (v[0].y > v[v.length - 1].y) v.reverse();
    return new THREE.LatheGeometry(v, seg || 96, phiStart === undefined ? Math.PI : phiStart, Math.PI * 2);
  }
  // 호 길이 기준으로 단면을 다시 샘플링 (텍스처 v 좌표가 실제 길이에 비례하도록)
  function resample(pts, n) {
    var L = [0];
    for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var total = L[L.length - 1], out = [];
    for (var k = 0; k <= n; k++) {
      var s = total * k / n, j = 1;
      while (j < L.length - 1 && L[j] < s) j++;
      var f = (s - L[j - 1]) / ((L[j] - L[j - 1]) || 1);
      out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f]);
    }
    return { pts: out, length: total };
  }
  function cylY(rTop, rBot, h, seg) { var g = new THREE.CylinderGeometry(rTop, rBot, h, seg || 32); g.translate(0, h / 2, 0); return g; }

  function makeMaterials() {
    var S = THREE.MeshStandardMaterial;
    return {
      enamel: new S({ color: 0x08080a, roughness: 0.5, metalness: 0.3 }),      // 에나멜 도장 다이캐스트 (손잡이)
      headEnamel: new S({ color: 0x070708, roughness: 0.42, metalness: 0.32 }),
      silver: new S({ color: 0xb4b8bd, roughness: 0.32, metalness: 0.65 }),      // 그릴 링/밴드
      wire: null,                                                                  // 아래에서 텍스처와 함께 생성
      grilleInner: new S({ color: 0x050505, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide }), // 내부 폼/망
      bore: new S({ color: 0x0a0a0b, roughness: 0.55, metalness: 0.5, side: THREE.DoubleSide }),          // 커넥터 셸 내부
      insert: new S({ color: 0x050505, roughness: 0.7, metalness: 0.0 }),        // 핀 절연 인서트
      pin: new S({ color: 0xc9b37a, roughness: 0.25, metalness: 0.95 }),         // 도금 핀(비례 추정: 금색 계열)
      hole: new S({ color: 0x000000, roughness: 1.0, metalness: 0.0 }),
      screw: new S({ color: 0x1c1d20, roughness: 0.35, metalness: 0.8 })
    };
  }

  // 마름모(다이아몬드) 직조 철망 텍스처 — 알파로 구멍을 뚫음
  function wireMeshTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var g = c.getContext('2d');
    g.clearRect(0, 0, 256, 256);
    g.strokeStyle = '#ffffff'; g.lineCap = 'round';
    g.lineWidth = 34;
    // 대각선 두 방향 (반복 타일에서 이음매 없이 이어지도록 3배 범위로 그림)
    for (var k = -2; k <= 2; k++) {
      g.beginPath(); g.moveTo(k * 256 - 128, -128); g.lineTo(k * 256 + 384, 384); g.stroke();
      g.beginPath(); g.moveTo(k * 256 + 384, -128); g.lineTo(k * 256 - 128, 384); g.stroke();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  }
  // 그릴 철선의 음영(교차점 하이라이트) — 색 텍스처
  function wireColorTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var g = c.getContext('2d');
    g.fillStyle = '#8d9095'; g.fillRect(0, 0, 256, 256);
    var grd = g.createRadialGradient(0, 0, 0, 0, 0, 90);
    grd.addColorStop(0, '#f2f3f5'); grd.addColorStop(1, 'rgba(141,144,149,0)');
    [[0, 0], [256, 0], [0, 256], [256, 256], [128, 128]].forEach(function (p) {
      g.save(); g.translate(p[0], p[1]); g.fillStyle = grd; g.fillRect(-90, -90, 180, 180); g.restore();
    });
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
    return t;
  }
  // 로고 칼라 인쇄 (u=0.5 가 정면)
  function collarPrintTexture() {
    // 칼라 둘레 약 113mm × 높이 3.4mm → 18px/mm 등방 캔버스(2048 × 62)
    var c = document.createElement('canvas'); c.width = 2048; c.height = 62;
    var g = c.getContext('2d');
    g.fillStyle = '#0a0b0c'; g.fillRect(0, 0, 2048, 62);
    g.fillStyle = '#e8e8e8'; g.textBaseline = 'middle'; g.textAlign = 'center';
    var F = '"Helvetica Neue", Arial, "Liberation Sans", "DejaVu Sans", sans-serif';
    // 정면(u=0.5)에 "SM58", 양옆 약 ±70°에 "SHURE" — 공식 정면 사진 배치. 뒷면(u=0/1)도 동일 반복.
    // 로고 원본 그래픽은 복제하지 않고 일반 굵은 이탤릭 글꼴로 대체.
    [1024, 0, 2048].forEach(function (cx) {
      g.font = '500 44px ' + F; g.fillText('SM58', cx, 32);
      g.font = 'italic 900 48px ' + F; g.fillText('SHURE', cx - 380, 32); g.fillText('SHURE', cx + 380, 32);
    });
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
    return t;
  }

  // ---------------------------------------------------------------------------
  function create(options) {
    var opt = options || {};
    var M = makeMaterials();
    var root = new THREE.Group();
    root.name = NS + 'Root';
    var parts = {};
    function reg(k, o) { parts[k] = o; return o; }

    // ===== 손잡이 =====
    var handle = reg('handle', grp('handle'));
    root.add(handle);
    // 하단 림: 보어 가장자리(r=boreR)에서 시작하는 고리 면 → 바깥 모따기 → 테이퍼
    var hp = [[XLR.boreR, 0]].concat(PROFILE.handle);
    handle.add(mk(lathe(hp, 96), M.enamel, 'handle.body'));
    // 손잡이-헤드 이음매 홈 (얇은 어두운 고리)
    var sm = PROFILE.seam;
    var seamGeo = lathe([[15.3, sm.y - 0.2], [15.3 - sm.depth, sm.y], [15.3 - sm.depth, sm.y + sm.h * 0.5], [15.4, sm.y + sm.h * 0.5 + 0.2]], 96);
    handle.add(mk(seamGeo, M.hole, 'handle.seamGroove', { cast: false }));
    // 정면 하단 고정나사 (사진의 작은 점) — 손잡이 표면 법선 방향으로 살짝 묻힌 육각 소켓
    var ss = grp('setScrew');
    var rAt = 11.75 + (11.9 - 11.75) * (XLR.setScrew.y - 4) / 5.5;
    var head = mk(new THREE.CylinderGeometry(1.25, 1.25, 0.5, 20).rotateX(Math.PI / 2), M.screw, 'setScrew.head');
    head.position.z = 0.0;
    ss.add(head);
    var sock = mk(new THREE.CylinderGeometry(0.62, 0.62, 0.2, 6).rotateX(Math.PI / 2), M.hole, 'setScrew.socket', { cast: false });
    setPosMM(sock, 0, 0, 0.18); ss.add(sock);
    setPosMM(ss, 0, XLR.setScrew.y, rAt - 0.1);
    handle.add(reg('setScrew', ss));

    // ===== (선택) SM58S 온/오프 스위치 — create({ variant: 'SM58S' }) 일 때만 =====
    //  SM58(일반형)에는 스위치가 없고, SM58S 는 손잡이 정면에 밀어서 켜는 스위치가 있음(공식 제품 구성).
    //  위치(손잡이 y≈86mm 정면), 크기, 슬라이드 방향(그릴 쪽 = ON)은 제품 사진 기준 추정.
    var sw = null;
    if (opt.variant === 'SM58S') {
      var SW = SWITCH_MM, rS = 14.75 + (15.15 - 14.75) * (SW.y - 82) / 8, slope = Math.atan((15.15 - 14.75) / 8);
      sw = reg('onOffSwitch', grp('onOffSwitch'));
      var plate = mk(new THREE.BoxGeometry(SW.plateW, SW.plateH, 0.9).translate(0, 0, 0.45), M.insert, 'onOffSwitch.plate'); sw.add(plate);
      var slot = mk(new THREE.BoxGeometry(SW.slotW, SW.slotH, 0.3).translate(0, 0, 0.9), M.hole, 'onOffSwitch.slot', { cast: false }); sw.add(slot);
      var slider = grp('onOffSwitch.slider');
      slider.add(mk(new THREE.BoxGeometry(SW.knobW, SW.knobH, 1.4).translate(0, 0, 1.6), M.insert, 'onOffSwitch.slider.body'));
      [-1, 0, 1].forEach(function (k) { slider.add(mk(new THREE.BoxGeometry(SW.knobW - 0.6, 0.35, 0.3).translate(0, k * 1.1, 2.4), M.headEnamel, 'onOffSwitch.slider.rib' + (k + 2), { cast: false })); });
      sw.add(slider); hide(sw.userData, 'slider', slider);
      var onDot = mk(new THREE.CircleGeometry(0.55, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), 'onOffSwitch.onMark', { cast: false });
      setPosMM(onDot, 0, SW.plateH / 2 - 1.0, 0.92); sw.add(onDot);
      setPosMM(sw, 0, SW.y, rS - 0.35); sw.rotation.x = slope; handle.add(sw);
    }
    var swState = { on: true };
    function setSwitch(on) { swState.on = !!on || !sw; if (sw) sw.userData.slider.position.y = (swState.on ? SWITCH_MM.travel / 2 : -SWITCH_MM.travel / 2) * MM; return swState.on; }
    if (sw) setSwitch(opt.switchOn === true);

    // ===== XLR 수 커넥터 (손잡이 하단 내부) =====
    var xlr = reg('xlrConnector', grp('xlrConnector'));
    root.add(xlr);
    // 보어 벽 (셸 내부) — 안쪽에서 보이도록 양면
    xlr.add(mk(lathe([[XLR.boreR, 0], [XLR.boreR, XLR.boreDepth]], 64), M.bore, 'xlrConnector.boreWall', { cast: false }));
    // 인서트(검은 절연체) 면 + 몸체
    var insertFace = mk(new THREE.CircleGeometry(XLR.boreR, 64).rotateX(Math.PI / 2), M.insert, 'xlrConnector.insertFace');
    setPosMM(insertFace, 0, XLR.boreDepth, 0); xlr.add(insertFace);
    var insertBody = mk(cylY(XLR.boreR, XLR.boreR, 6, 48), M.insert, 'xlrConnector.insertBody');
    setPosMM(insertBody, 0, XLR.boreDepth, 0); xlr.add(insertBody);
    // 핀 3개 (끝은 둥글게)
    var pinLen = XLR.boreDepth - XLR.pinTipDepth;
    XLR.pins.forEach(function (p) {
      var pin = grp('xlrConnector.pin' + p.id);
      var shaft = mk(cylY(XLR.pinR, XLR.pinR, pinLen - XLR.pinR, 20), M.pin, 'xlrConnector.pin' + p.id + '.shaft');
      setPosMM(shaft, 0, XLR.pinR, 0); pin.add(shaft);
      var tip = mk(new THREE.SphereGeometry(XLR.pinR, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.pin, 'xlrConnector.pin' + p.id + '.tip');
      setPosMM(tip, 0, XLR.pinR, 0); pin.add(tip);
      var collar = mk(cylY(1.35, 1.35, 1.0, 20), M.insert, 'xlrConnector.pin' + p.id + '.boss');
      setPosMM(collar, 0, pinLen - 1.0, 0); pin.add(collar);
      setPosMM(pin, p.x, XLR.pinTipDepth, p.z);
      pin.userData.pinId = p.id;
      xlr.add(pin);
    });
    // 래치 창 (+Z, 플러그 래치가 걸리는 홈): 보어 벽 바깥으로 파인 어두운 포켓
    var lw = XLR.latchWindow;
    var win = mk(new THREE.BoxGeometry(lw.halfW * 2, lw.y1 - lw.y0, lw.rOut - XLR.boreR + 0.02), M.hole, 'xlrConnector.latchWindow', { cast: false });
    setPosMM(win, 0, (lw.y0 + lw.y1) / 2, (XLR.boreR + lw.rOut) / 2 - 0.02);
    xlr.add(win);
    // 키 홈 (+Z 보어 벽의 세로 홈 — 플러그 키와 맞물림)
    var key = mk(new THREE.BoxGeometry(2.0, XLR.boreDepth - 0.5, 0.6), M.hole, 'xlrConnector.keyGroove', { cast: false });
    setPosMM(key, 0, (XLR.boreDepth - 0.5) / 2, XLR.boreR + 0.28);
    xlr.add(key);

    // ===== 헤드 (검은 금속) =====
    var headG = reg('head', grp('head'));
    root.add(headG);
    headG.add(mk(lathe(PROFILE.head, 96), M.headEnamel, 'head.body'));
    var collarMat = new THREE.MeshStandardMaterial({ map: collarPrintTexture(), roughness: 0.38, metalness: 0.3 });
    headG.add(reg('logoCollar', mk(lathe(PROFILE.collar, 128, Math.PI), collarMat, 'head.logoCollar')));
    // 헤드 상단의 평평한 턱 (칼라 → 그릴 링 사이 수평 면)
    var shelf = mk(new THREE.RingGeometry(PROFILE.lowerRing.r - 3.5, PROFILE.collar[PROFILE.collar.length - 1][0] + 0.01, 96).rotateX(-Math.PI / 2), M.headEnamel, 'head.shelf');
    setPosMM(shelf, 0, PROFILE.lowerRing.y0, 0); headG.add(shelf);

    // ===== 그릴 =====
    var grille = reg('grille', grp('grille'));
    root.add(grille);
    var lr = PROFILE.lowerRing, bd = PROFILE.band;
    function ringBand(y0, y1, r, name) {
      var bev = 0.5;
      return mk(lathe([[r - 1.4, y0], [r - bev, y0], [r, y0 + bev], [r, y1 - bev], [r - bev, y1], [r - 1.4, y1]], 128), M.silver, name);
    }
    grille.add(reg('grilleLowerRing', ringBand(lr.y0, lr.y1, lr.r, 'grille.lowerRing')));
    grille.add(reg('grilleBand', ringBand(bd.y0, bd.y1, bd.r, 'grille.band')));
    var alphaTex = wireMeshTexture(), colorTex = wireColorTexture();
    function wireShell(profile, name, cellMM) {
      var rs = resample(profile, 48);
      var geo = lathe(rs.pts, 160);
      var cellsAround = 52; // 적도 둘레 160mm / 약 3.1mm
      var at = alphaTex.clone(); at.needsUpdate = true; at.repeat.set(cellsAround, rs.length / cellMM);
      var ct = colorTex.clone(); ct.needsUpdate = true; ct.repeat.copy(at.repeat);
      var mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: ct, alphaMap: at, alphaTest: 0.5, transparent: false,
        side: THREE.DoubleSide, roughness: 0.38, metalness: 0.55 });
      return mk(geo, mat, name);
    }
    grille.add(reg('grilleMeshLower', wireShell(PROFILE.grilleLower, 'grille.meshLower', 3.1)));
    grille.add(reg('grilleMeshUpper', wireShell(PROFILE.grilleUpper, 'grille.meshUpper', 3.1)));
    // 내부 폼/2차 망 (어두운 안쪽 면, 바깥망에서 1.6mm 안쪽)
    function inset(profile, d) { return profile.map(function (p) { return [Math.max(0, p[0] - d), p[1] - (p[0] < 1 ? d : 0)]; }); }
    var innerPts = inset(PROFILE.grilleLower, 1.6).concat([[bd.r - 1.6, bd.y0], [bd.r - 1.6, bd.y1]]).concat(inset(PROFILE.grilleUpper, 1.6));
    grille.add(reg('grilleInner', mk(lathe(innerPts, 96), M.grilleInner, 'grille.innerFoam', { cast: false })));

    // ===== 연결 기준점 =====
    var anchors = grp('portAnchors');
    root.add(anchors);
    var a = new THREE.Object3D();
    a.name = NS + '.port.xlrOut';
    // 앵커 로컬 +Z = 바깥(케이블 쪽) 방향 = 마이크 -Y,  앵커 로컬 +Y = 키 방향 = 마이크 +Z
    // → 프로젝트 플러그 템플릿(노즈=원점, 몸체=+Z, 키=+Y)에 앵커 회전을 그대로 쓰면 핀·구멍이 정렬됨
    // 오른손 좌표계: X = Y × Z = (0,0,1) × (0,-1,0) = (1,0,0)
    var basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0));
    a.quaternion.setFromRotationMatrix(basis);
    a.position.set(0, 0, 0);
    a.userData = {
      portId: 'xlrOut', type: 'xlr3-male', role: 'output', channel: null,
      accepts: ['xlr3-female-cable-plug'], // 연결 가능한 커넥터: XLR 3핀 암 케이블 플러그 (프로젝트 xlrPlugF)
      localPosition: new THREE.Vector3(0, 0, 0),
      localNormal: new THREE.Vector3(0, -1, 0),      // 바깥(케이블 나가는) 방향
      insertDirection: new THREE.Vector3(0, 1, 0),   // 플러그가 들어오는 방향
      keyDirection: new THREE.Vector3(0, 0, 1),      // 플러그 키/래치가 향해야 하는 방향
      insertDepthMM: XLR.insertDepthMM, socketDepthMM: XLR.boreDepth, boreRadiusMM: XLR.boreR,
      pinsLocalMM: XLR.pins.map(function (p) { return { id: p.id, x: p.x, y: XLR.pinTipDepth, z: p.z }; })
    };
    anchors.add(a);

    hide(root.userData, NS, {
      version: '1.1.0', dimensionsMM: DIM, parts: parts, ports: { xlrOut: a }, materials: M,
      variant: sw ? 'SM58S' : 'SM58', hasSwitch: !!sw, setSwitch: setSwitch, isOn: function () { return swState.on; }
    });
    root.userData.info = { model: sw ? 'Shure SM58S' : 'Shure SM58', units: 'm' };
    return root;
  }

  // ---------------------------------------------------------------------------
  var PORT_IDS = ['xlrOut'];
  // 스위치: 일반 SM58 은 스위치가 없으므로 항상 켜짐(true)
  function setSwitch(root, on) { var d = root.userData[NS]; return d ? d.setSwitch(on) : true; }
  function isOn(root) { var d = root.userData[NS]; return d ? d.isOn() : true; }
  function findAnchor(root, id) {
    var api = root.userData[NS];
    if (api && api.ports[id]) return api.ports[id];
    return root.getObjectByName(NS + '.port.' + id) || null; // clone() 대응
  }
  // 장비의 위치·회전·크기(스케일)를 모두 반영한 단자 정보.
  // worldInsertDepth = 로컬 삽입 깊이 × (단자 축 방향의 월드 스케일)
  function getPortInfo(root, id) {
    var a = findAnchor(root, id);
    if (!a) return null;
    root.updateWorldMatrix(true, true);
    var u = a.userData;
    var wp = new THREE.Vector3(); a.getWorldPosition(wp);
    var wq = new THREE.Quaternion(); a.getWorldQuaternion(wq);
    var wn = new THREE.Vector3(0, 0, 1).applyQuaternion(wq).normalize();
    var wk = new THREE.Vector3(0, 1, 0).applyQuaternion(wq).normalize();
    var ln = new THREE.Vector3().copy(u.localNormal);
    var axisWorld = ln.clone().transformDirection(root.matrixWorld); // 정규화됨
    var scaled = ln.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(root.matrixWorld));
    var scale = scaled.length();
    return {
      id: u.portId, type: u.type, role: u.role, accepts: u.accepts.slice(),
      localPosition: new THREE.Vector3().copy(u.localPosition), localNormal: ln,
      insertDirectionLocal: new THREE.Vector3().copy(u.insertDirection), keyDirectionLocal: new THREE.Vector3().copy(u.keyDirection),
      worldPosition: wp, worldNormal: wn, worldInsertDirection: wn.clone().negate(), worldKeyDirection: wk,
      worldQuaternion: wq, insertDepthMM: u.insertDepthMM, socketDepthMM: u.socketDepthMM,
      worldInsertDepth: u.insertDepthMM * MM * scale, worldScale: scale, anchor: a
    };
  }
  function getAllPorts(root) { return PORT_IDS.map(function (id) { return getPortInfo(root, id); }).filter(Boolean); }
  // 프로젝트 플러그 템플릿(노즈 끝 = 원점, 몸체 +Z, 키 +Y)을 단자에 꽂힌 자세로 배치.
  // plugObject.userData.axisOffsetLocal(Vector3, m)이 있으면 템플릿 피벗과 플러그 실제 중심축의
  // 차이를 보정합니다. (프로젝트 gear3dGetPlugTemplate 는 bbox 중심을 피벗으로 쓰는데, xlrPlugF 는
  // 래치 탭 때문에 bbox 가 비대칭이라 피벗이 실제 축에서 약 1.3mm 벗어나 있습니다.)
  function seatPlug(root, plugObject, portId, depthOverrideM) {
    var p = getPortInfo(root, portId || 'xlrOut');
    var depth = depthOverrideM !== undefined ? depthOverrideM : p.worldInsertDepth;
    plugObject.quaternion.copy(p.worldQuaternion);
    plugObject.position.copy(p.worldPosition).addScaledVector(p.worldNormal, -depth);
    var ax = plugObject.userData && plugObject.userData.axisOffsetLocal;
    if (ax) plugObject.position.sub(new THREE.Vector3().copy(ax).applyQuaternion(p.worldQuaternion));
    plugObject.updateMatrixWorld(true);
    return p;
  }
  function toGear3dPortsLocal(root, groupOffset) {
    var off = groupOffset || new THREE.Vector3();
    var out = { input: {}, output: {}, power: {} };
    PORT_IDS.forEach(function (id) {
      var a = findAnchor(root, id); if (!a) return;
      var p = new THREE.Vector3().copy(a.userData.localPosition).add(off);
      out[a.userData.role][id] = [+p.x.toFixed(5), +p.y.toFixed(5), +p.z.toFixed(5)];
    });
    return out;
  }

  global.ShureSM58 = {
    NAMESPACE: NS, DIMENSIONS_MM: DIM, PROFILE_MM: PROFILE, XLR_MM: XLR, PORT_IDS: PORT_IDS,
    create: create, getPortInfo: getPortInfo, getAllPorts: getAllPorts, seatPlug: seatPlug,
    toGear3dPortsLocal: toGear3dPortsLocal, setSwitch: setSwitch, isOn: isOn, SWITCH_MM: SWITCH_MM
  };
})(typeof window !== 'undefined' ? window : this);
