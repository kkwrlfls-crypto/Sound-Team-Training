/*
 * 확성 시스템의 기본 — 3D 장비 연결·조작 실습 (Sound-Team-Training)
 *  - Three.js r128 전역 THREE + OrbitControls, 단위 m
 *  - 실습 3개를 각자 다른 캔버스에서 진행 (카드 = [data-pa3d="s1|s2|s3"])
 *      s1 마이크 ➔ 스피커                  : SM58S + ZXA1
 *      s2 마이크 ➔ 콘솔 ➔ 스피커           : SM58S + MG12XU + ZXA1
 *      s3 마이크 ➔ 콘솔 ➔ 앰프 ➔ 스피커    : SM58S + MG12XU + Crown XLi1500 + ZX1
 *  - 연결: 케이블 종류를 고른 뒤 단자 두 곳을 클릭 → 케이블 모델의 호환 검사 → 플러그가 실제로 꽂힘
 *  - 조작: 3D 장비의 스위치를 클릭(켜기/끄기), 노브·페이더를 위아래로 끌기 — 아래 "장비 조작" 패널과 같은 값
 *      SM58S 스위치, ZXA1 전원·MIC·MASTER, MG12XU 전원·GAIN·채널/STEREO 페이더, Crown 전원·CH1/CH2 감쇠기
 *  - 판정: 전원(콘센트 → 전원 케이블 → 인렛 → 전원 스위치)과 신호 레벨(dBu, 근사 모델)을 따라가 스피커 음량을 표시
 *  - 전역: window.PaPractice3D (get(id) → 실습 인스턴스 API), window.pa3dStart(id)
 */
(function () {
  'use strict';
  var V3 = null;

  // ---------------------------------------------------------------------------
  // 장비 단자 (실습에서 클릭할 수 있는 것만): [id, 이름, 종류, 역할]
  var PORTS = {
    sm58: [['xlrOut', 'SM58S 마이크 · XLR 출력', 'xlr-out', 'mic']],
    mg: [['in1', 'MG12XU · CH1 입력 (XLR/잭 콤보)', 'xlr-in', 'mixIn'], ['in2', 'MG12XU · CH2 입력 (XLR/잭 콤보)', 'xlr-in', 'mixIn'],
      ['in3', 'MG12XU · CH3 입력 (XLR/잭 콤보)', 'xlr-in', 'mixIn'], ['in4', 'MG12XU · CH4 입력 (XLR/잭 콤보)', 'xlr-in', 'mixIn'],
      ['mic5', 'MG12XU · CH5/6 MIC 입력 (XLR)', 'xlr-in', 'mixIn'], ['mic7', 'MG12XU · CH7/8 MIC 입력 (XLR)', 'xlr-in', 'mixIn'],
      ['stereoOutXlrL', 'MG12XU · STEREO OUT L (XLR)', 'xlr-out', 'mixOut'], ['stereoOutXlrR', 'MG12XU · STEREO OUT R (XLR)', 'xlr-out', 'mixOut'],
      ['acIn', 'MG12XU · 전원 입력 (AC IN)', 'iec', 'power']],
    zxa1: [['micIn', 'ZXA1 액티브 스피커 · MIC IN', 'xlr-in', 'micIn'], ['lineIn', 'ZXA1 액티브 스피커 · LINE IN', 'xlr-in', 'lineIn'],
      ['masterOut', 'ZXA1 액티브 스피커 · MASTER OUT (다음 스피커로)', 'xlr-out', 'linkOut'], ['mainsIn', 'ZXA1 액티브 스피커 · 전원 입력 (MAINS IN)', 'iec', 'power']],
    crown: [['inputXlrCh1', 'Crown 파워앰프 · CH1 입력 (XLR)', 'xlr-in', 'ampIn1'], ['inputXlrCh2', 'Crown 파워앰프 · CH2 입력 (XLR)', 'xlr-in', 'ampIn2'],
      ['outputSpeakonCh1', 'Crown 파워앰프 · CH1 스피커 출력 (speakON)', 'speakon', 'ampOut1'], ['outputSpeakonCh2', 'Crown 파워앰프 · CH2 스피커 출력 (speakON)', 'speakon', 'ampOut2'],
      ['powerInlet', 'Crown 파워앰프 · 전원 입력', 'iec', 'power']],
    zx1: [['speakonA', 'ZX1 패시브 스피커 · speakON 입력 1 (병렬)', 'speakon', 'spkIn'], ['speakonB', 'ZX1 패시브 스피커 · speakON 입력 2 (병렬)', 'speakon', 'spkIn']],
    outA: [['socketUpper', '벽 콘센트 A · 위 구', 'socket', 'mains'], ['socketLower', '벽 콘센트 A · 아래 구', 'socket', 'mains']],
    outB: [['socketUpper', '벽 콘센트 B · 위 구', 'socket', 'mains'], ['socketLower', '벽 콘센트 B · 아래 구', 'socket', 'mains']],
    outC: [['socketUpper', '벽 콘센트 C · 위 구', 'socket', 'mains'], ['socketLower', '벽 콘센트 C · 아래 구', 'socket', 'mains']]
  };
  var DEV_NAME = { sm58: 'SM58S 마이크', mg: 'MG12XU 믹서', zxa1: 'ZXA1 액티브 스피커', crown: 'Crown 파워앰프', zx1: 'ZX1 패시브 스피커' };
  var CABLE_INFO = {
    xlr: { label: 'XLR 케이블', fits: ['xlr-in', 'xlr-out'], lengths: [3, 5, 10], color: 0x0c0c0d },
    speakon: { label: '스피커 케이블 (speakON)', fits: ['speakon'], lengths: [3, 5, 10], color: 0x1d2b4a },
    ac: { label: '전원 케이블 (220V)', fits: ['iec', 'socket'], lengths: [1.8, 3, 5], color: 0x2a2b2e }
  };
  var MG_CH = { in1: 'ch1', in2: 'ch2', in3: 'ch3', in4: 'ch4', mic5: 'ch56', mic7: 'ch78' };
  var CH_LABEL = { ch1: 'CH1', ch2: 'CH2', ch3: 'CH3', ch4: 'CH4', ch56: 'CH5/6', ch78: 'CH7/8' };

  // ---------------------------------------------------------------------------
  // 실습(시나리오)
  var SCENARIOS = {
    s1: { title: '① 마이크 ➔ 스피커', gear: 'SM58S 마이크 + ZXA1 액티브 스피커', devs: ['sm58', 'zxa1'], cables: ['xlr', 'ac'],
      desc: '믹서 없이 SM58S 마이크를 ZXA1 액티브 스피커의 MIC IN 에 바로 연결합니다. 스피커에 전원을 넣고 전원 스위치를 켠 뒤, 마이크 스위치를 켜고 스피커 뒷면 MIC 노브와 MASTER 노브를 올려 알맞은 크기로 소리를 내 보세요.',
      views: ['front', 'mic', 'zxa1', 'outlets'], layout: { zxa1: [-0.8, -1.1] },
      viewOverride: { front: { pos: [1.7, 1.75, 2.6], target: [-0.35, 0.85, -0.5] }, outlets: { pos: [-0.4, 1.1, -1.3], target: [-0.9, 0.3, -3.4] } } },
    s2: { title: '② 마이크 ➔ 콘솔 ➔ 스피커', gear: 'SM58S + MG12XU 믹서 + ZXA1 액티브 스피커', devs: ['sm58', 'mg', 'zxa1'], cables: ['xlr', 'ac'],
      desc: 'SM58S 를 MG12XU 입력에, MG12XU 의 STEREO OUT 을 ZXA1 의 LINE IN 에 연결합니다. 믹서와 스피커에 전원을 넣고 켠 다음, 믹서에서 GAIN → 채널 페이더 → STEREO 페이더 순서로 올리고 스피커 MASTER 로 음량을 맞추세요.',
      views: ['front', 'back', 'mixer', 'mic', 'zxa1', 'outlets'] },
    s3: { title: '③ 마이크 ➔ 콘솔 ➔ 앰프 ➔ 스피커', gear: 'SM58S + MG12XU + Crown XLi1500 파워앰프 + ZX1 패시브 스피커', devs: ['sm58', 'mg', 'crown', 'zx1'], cables: ['xlr', 'speakon', 'ac'],
      desc: 'MG12XU 출력을 Crown 파워앰프 입력에 넣고, 앰프의 speakON 출력을 ZX1 패시브 스피커에 스피커 케이블로 연결합니다. 패시브 스피커는 전원이 없고 앰프 출력으로 소리가 납니다. 믹서를 먼저 켜고 앰프를 나중에 켠 뒤, 앰프 앞면 감쇠기(볼륨)를 올려 음량을 맞추세요.',
      views: ['front', 'back', 'mixer', 'amp', 'mic', 'zx1', 'outlets'] }
  };
  var SOLUTIONS = {
    s1: { conns: [['xlr', ['sm58', 'xlrOut'], ['zxa1', 'micIn']], ['ac', ['zxa1', 'mainsIn'], ['outA', 'socketUpper']]],
      ctl: { 'sm58.switch': 1, 'zxa1.power': 1, 'zxa1.mic': 0.8, 'zxa1.master': 0.85 } },
    s2: { conns: [['xlr', ['sm58', 'xlrOut'], ['mg', 'in1']], ['ac', ['mg', 'acIn'], ['outB', 'socketUpper']], ['xlr', ['mg', 'stereoOutXlrL'], ['zxa1', 'lineIn']], ['ac', ['zxa1', 'mainsIn'], ['outA', 'socketUpper']]],
      ctl: { 'sm58.switch': 1, 'mg.power': 1, 'mg.gain.ch1': 0.75, 'mg.fader.ch1': 0.75, 'mg.fader.stereo': 0.75, 'zxa1.power': 1, 'zxa1.master': 0.9 } },
    s3: { conns: [['xlr', ['sm58', 'xlrOut'], ['mg', 'in1']], ['ac', ['mg', 'acIn'], ['outB', 'socketUpper']], ['xlr', ['mg', 'stereoOutXlrR'], ['crown', 'inputXlrCh1']],
      ['ac', ['crown', 'powerInlet'], ['outB', 'socketLower']], ['speakon', ['crown', 'outputSpeakonCh1'], ['zx1', 'speakonA']]],
      ctl: { 'sm58.switch': 1, 'mg.power': 1, 'mg.gain.ch1': 0.75, 'mg.fader.ch1': 0.75, 'mg.fader.stereo': 0.75, 'crown.power': 1, 'crown.att1': 0.95 } }
  };
  var ALL_VIEWS = {
    front: { label: '앞에서', pos: [2.6, 2.3, 3.3], target: [0, 0.8, -0.6] },
    back: { label: '뒤에서 (배선)', pos: [0.2, 1.9, -3.05], target: [0, 0.5, -0.6] },
    mixer: { label: '믹서 조작부', pos: [-0.34, 1.32, -0.42], target: [-0.34, 0.8, -1.02] },
    amp: { label: '앰프 앞면', pos: [0.3, 1.0, -0.45], target: [0.26, 0.8, -0.85] },
    mic: { label: '마이크 (스위치·XLR)', pos: [0.2, 1.36, 0.86], target: [0, 1.27, 0.55] },
    zxa1: { label: 'ZXA1 뒷면', pos: [-1.45, 0.75, -1.45], target: [-1.55, 0.3, -0.6] },
    zx1: { label: 'ZX1 뒷면', pos: [1.45, 0.75, -1.45], target: [1.55, 0.3, -0.6] },
    outlets: { label: '벽 콘센트', pos: [0, 1.2, -0.85], target: [0, 0.3, -3.4] }
  };

  // ---------------------------------------------------------------------------
  // 레벨 모델 (근사): dBu. 결과 R = 스피커 최대 출력 대비 dB
  var SRC_DBU = -50;                                          // SM58 에 노래/말하는 소리 (근사)
  var NEG = -Infinity;
  function mgGainDb(v) { return 6 + 54 * v; }                 // MG12XU GAIN +6 ~ +60 dB (근사)
  function faderDb(v) { return v < 0.02 ? NEG : 40 * (v - 0.75); } // 0dB 표시 ≈ 3/4 지점, 맨 위 +10
  function attDb(v) { return v < 0.02 ? NEG : 40 * (v - 1); }  // Crown 감쇠기, ZXA1 MASTER: 맨 위 0dB
  function zxMicGainDb(v) { return v < 0.02 ? NEG : 10 + 50 * v; }
  var PEAK_DBU = 8;                                          // MG12XU 채널 PEAK 표시 기준(근사): 게인 뒤 +8dBu 넘으면 찌그러짐
  var SENS = { zxa1: 4, crown: 5.1 };                         // 최대 출력 입력 레벨 (ZXA1 근사 +4dBu, Crown 1.4V = +5.1dBu)
  function grade(R) { return R === NEG || R < -40 ? 'silent' : R > 3 ? 'clip' : R >= -14 ? 'good' : R >= -26 ? 'low' : 'faint'; }
  var GRADE_TEXT = { good: '알맞은 크기로 소리 남', low: '소리가 작아요', faint: '거의 들리지 않아요', clip: '너무 커서 찌그러져요 (클립/리미터)', silent: '소리가 나지 않아요' };
  function dbTxt(x) { return x === NEG ? '−∞' : (x > 0 ? '+' : '') + x.toFixed(1); }

  // ---------------------------------------------------------------------------
  function key(dev, port) { return dev + '.' + port; }
  function portDef(dev, port) { var l = PORTS[dev] || []; for (var i = 0; i < l.length; i++) if (l[i][0] === port) return l[i]; return null; }
  function label(dev, port) { var d = portDef(dev, port); return d ? d[1] : dev + '.' + port; }
  function portKind(dev, port) { var d = portDef(dev, port); return d ? d[2] : null; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // 카드 껍데기 (매번 새로 그림 — 편집 저장으로 남은 캔버스·상태도 정리됨)
  function renderShell(card, sid) {
    var sc = SCENARIOS[sid];
    card.innerHTML =
      '<h3>🔌 3D 실습 ' + esc(sc.title) + '</h3>' +
      '<p class="pa3d-intro"><b>' + esc(sc.gear) + '</b> — ' + esc(sc.desc) + '</p>' +
      '<p class="pa3d-intro pa3d-how">케이블 종류를 고르고 단자 두 곳을 누르면 연결됩니다. 장비의 <b>스위치는 클릭</b>, <b>노브·페이더는 위아래로 끌어서</b> 조작합니다(아래 "장비 조작" 패널로도 됩니다). 빈 곳을 끌면 화면이 돌아가고, 휠(두 손가락)로 확대합니다.</p>' +
      '<div class="pa3d-row"><span class="pa3d-label">케이블</span>' + sc.cables.map(function (c) { return '<button type="button" class="pa3d-btn pa3d-cable-btn" data-cable="' + c + '">' + CABLE_INFO[c].label + '</button>'; }).join('') + '</div>' +
      '<div class="pa3d-viewport" data-role="viewport"><div class="pa3d-start" data-role="start"><div>' + esc(sc.gear) + ' 3D 모델을 불러옵니다 (휴대폰에서는 몇 초 걸릴 수 있어요).</div>' +
      '<button type="button" class="btn" onclick="pa3dStart(\'' + sid + '\')">▶ 실습 시작</button></div><div class="pa3d-tip" data-role="tip"></div><div class="pa3d-busy" data-role="busy">케이블을 놓는 중…</div></div>' +
      '<div class="pa3d-msg" data-role="msg">케이블 종류를 고른 뒤, 꽂을 단자 두 곳을 차례로 누르세요.</div>' +
      '<div class="pa3d-row"><span class="pa3d-label">보기</span>' + sc.views.map(function (v, i) { return '<button type="button" class="pa3d-btn pa3d-vbtn' + (i ? '' : ' on') + '" data-view="' + v + '">' + ALL_VIEWS[v].label + '</button>'; }).join('') + '</div>' +
      '<div class="pa3d-grid"><div class="pa3d-box" data-role="mission"></div><div class="pa3d-box"><h4>장비 조작</h4><div data-role="controls" class="pa3d-ctls"><span class="pa3d-empty">실습을 시작하면 나타나요.</span></div></div>' +
      '<div class="pa3d-box"><h4>전원 · 소리</h4><div data-role="power"></div><div data-role="speakers"></div></div><div class="pa3d-box"><h4>연결한 케이블</h4><ul class="pa3d-conns" data-role="conns"></ul></div></div>' +
      '<div class="pa3d-actions"><button type="button" class="pa3d-btn" data-role="solve">💡 정답 보기 (연결 + 조작)</button><button type="button" class="curriculum-reset-btn" data-role="reset">처음 상태로</button></div>';
  }

  // ---------------------------------------------------------------------------
  function createPractice(card, sid) {
    var SC = SCENARIOS[sid], S = null, inited = false;
    var has = function (d) { return SC.devs.indexOf(d) >= 0; };
    var Q = function (role) { return card.querySelector('[data-role="' + role + '"]'); };
    function setMsg(t, kind) { var m = Q('msg'); if (!m) return; m.textContent = t || ''; m.className = 'pa3d-msg' + (kind ? ' ' + kind : ''); }
    function busy(on, text) { var b = Q('busy'); if (b) { b.style.display = on ? 'flex' : 'none'; b.textContent = text || '케이블을 놓는 중…'; } }

    function buildScene(container) {
      V3 = THREE.Vector3;
      var W = container.clientWidth || 800, H = container.clientHeight || 460;
      var scene = new THREE.Scene(); scene.background = new THREE.Color(0xeef1f5);
      var camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 60);
      var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(W, H);
      renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.className = 'pa3d-canvas'; container.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a3a, 1.15));
      var dir = new THREE.DirectionalLight(0xffffff, 1.6); dir.position.set(2.0, 3.6, 2.4); dir.castShadow = true;
      dir.shadow.mapSize.set(2048, 2048); dir.shadow.bias = -0.0003; dir.shadow.normalBias = 0.003;
      Object.assign(dir.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 0.5, far: 12 }); scene.add(dir);
      var rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(-1.5, 1.6, -3.0); scene.add(rim);
      var controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 0.12; controls.maxDistance = 9; controls.maxPolarAngle = Math.PI * 0.495;
      return { scene: scene, camera: camera, renderer: renderer, controls: controls };
    }
    function prop(geo, color, name, rough) { var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: color, roughness: rough === undefined ? 0.85 : rough })); m.name = 'pa3d.' + name; m.castShadow = m.receiveShadow = true; return m; }

    function buildRoom(st) {
      var sc = st.scene, WALLZ = -3.4, devs = {};
      var floor = prop(new THREE.PlaneGeometry(9, 9), 0xd9dbe0, 'floor', 0.95); floor.rotation.x = -Math.PI / 2; floor.castShadow = false; sc.add(floor);
      var OUT = [{ id: 'outA', x: -1.2 }, { id: 'outB', x: 0.0 }, { id: 'outC', x: 1.2 }], OY = 0.3;
      var ws = new THREE.Shape(); ws.moveTo(-4.5, 0); ws.lineTo(4.5, 0); ws.lineTo(4.5, 2.6); ws.lineTo(-4.5, 2.6); ws.closePath();
      OUT.forEach(function (o) { var h = new THREE.Path(), w = 0.029, hh = 0.054; h.moveTo(o.x - w, OY - hh); h.lineTo(o.x - w, OY + hh); h.lineTo(o.x + w, OY + hh); h.lineTo(o.x + w, OY - hh); h.closePath(); ws.holes.push(h); });
      var wall = prop(new THREE.ExtrudeGeometry(ws, { depth: 0.1, bevelEnabled: false }).translate(0, 0, -0.1), 0xebe7df, 'wall', 0.95); wall.position.z = WALLZ; wall.castShadow = false; sc.add(wall);
      OUT.forEach(function (o) { var r = KoreanOutlet.create({ name: o.id }); r.position.set(o.x, OY, WALLZ); sc.add(r); devs[o.id] = { root: r, api: KoreanOutlet }; });
      var colliders = [new THREE.Box3(new V3(-4.5, 0, WALLZ - 0.1), new V3(4.5, 2.6, WALLZ))];
      var box = function (o) { return new THREE.Box3().setFromObject(o); }, cab = function (root, n) { return box(root.getObjectByName(n) || root); };
      var TH = 0.75;
      if (has('mg') || has('crown')) {
        var table = prop(new THREE.BoxGeometry(1.25, TH, 0.62), 0xb08a5a, 'table', 0.8); table.position.set(0, TH / 2, -1.0); sc.add(table); sc.updateMatrixWorld(true); colliders.push(box(table));
      }
      if (has('mg')) { var mg = YamahaMG12XU.create({ power: false }); mg.position.set(has('crown') ? -0.34 : -0.1, TH, -1.0); sc.add(mg); devs.mg = { root: mg, api: YamahaMG12XU }; }
      if (has('crown')) { var crown = CrownXLi1500.create({ power: false }); crown.position.set(0.26, TH, -1.0); sc.add(crown); devs.crown = { root: crown, api: CrownXLi1500 }; }
      // 스피커: 스피커 스탠드(K&M 21450 기준, Ø35 폴) 위에 폴 소켓으로 장착 — 스탠드 모델이 없으면 바닥에 둠
      var stands = [];
      function placeSpeaker(api, x, z) { var r = api.create();
        if (window.SpeakerStand) { var stS = SpeakerStand.create({ name: 'pa3d', heightMM: 1500 }); stS.position.set(x, 0, z); sc.add(stS); sc.add(r); sc.updateMatrixWorld(true);
          var mr = SpeakerStand.mountSpeaker(stS, api, r, { yawDeg: 0 }); if (!mr.ok) { sc.remove(stS); r.position.set(x, 0, z); } else stands.push(stS); }
        else { r.position.set(x, 0, z); sc.add(r); } return r; }
      if (has('zxa1')) { var zl = SC.layout && SC.layout.zxa1 || [-1.55, -0.45]; devs.zxa1 = { root: placeSpeaker(EvZXA1, zl[0], zl[1]), api: EvZXA1 }; }
      if (has('zx1')) { devs.zx1 = { root: placeSpeaker(EvZX1, 1.55, -0.45), api: EvZX1 }; }
      // 마이크: 마이크 붐 스탠드(K&M 210/9 기준) + A25D 클립에 SM58S 를 끼움. 붐은 무대 쪽(-Z)으로, 그릴은 노래하는 사람 쪽
      var mic = ShureSM58.create({ variant: 'SM58S' }), micStand = null; sc.add(mic); devs.sm58 = { root: mic, api: ShureSM58 };
      if (window.MicStand) {
        micStand = MicStand.create({ name: 'pa3d', pose: { heightMM: 1300, boomLengthMM: 600, boomAngleDeg: 25, clipTiltDeg: 55 } }); micStand.position.set(0.1, 0, 1.0); micStand.rotation.y = Math.PI; sc.add(micStand); sc.updateMatrixWorld(true);
        if (!MicStand.mountMic(micStand, ShureSM58, mic).ok) { sc.remove(micStand); micStand = null; }
      }
      if (!micStand) { // 예전 소품 스탠드
        var stand = new THREE.Group(); stand.name = 'pa3d.micStand'; var metal = 0x2a2b2e;
        var base = prop(new THREE.CylinderGeometry(0.13, 0.14, 0.02, 40), metal, 'standBase', 0.4); base.position.y = 0.01; stand.add(base);
        var pole = prop(new THREE.CylinderGeometry(0.0095, 0.0095, 1.2, 20), metal, 'standPole', 0.35); pole.position.set(0, 0.61, 0); stand.add(pole);
        stand.position.set(0.07, 0, 0.55); sc.add(stand); mic.position.set(0, 1.21, 0.55);
        sc.updateMatrixWorld(true); colliders.push(box(pole), box(base));
      }
      sc.updateMatrixWorld(true);
      if (devs.mg) colliders.push(cab(devs.mg.root, 'yamahaMg12xu.chassis').union(cab(devs.mg.root, 'yamahaMg12xu.topPanel')));
      if (devs.crown) colliders.push(cab(devs.crown.root, 'crownXli1500.chassis'));
      if (devs.zxa1) colliders.push(cab(devs.zxa1.root, 'evZxa1.cabinetGroup'));
      if (devs.zx1) colliders.push(cab(devs.zx1.root, 'evZx1.cabinetGroup'));
      // 스탠드 충돌 상자: 세로 관·칼라·허브만 (축에 맞는 상자라 정확). 비스듬한 다리·붐은 상자가 커져서 넣지 않음
      stands.forEach(function (t) { ['innerTube', 'outerTube', 'clampCollar', 'legHub', 'braceCollar'].forEach(function (n) { var o = t.getObjectByName('spkStand.' + n); if (o) colliders.push(box(o)); }); });
      if (micStand) ['lowerTube', 'clutch', 'base.hub'].forEach(function (n) { var o = micStand.getObjectByName('micStand.' + n); if (o) colliders.push(box(o)); });
      if (micStand) { var ut = micStand.getObjectByName('micStand.upperTube.body'); if (ut) colliders.push(box(ut)); }
      st.stands = { speakers: stands, mic: micStand };
      OUT.forEach(function (o) { colliders.push(box(devs[o.id].root.getObjectByName('krOutlet.plate'))); });
      return { devs: devs, colliders: colliders };
    }

    // 단자 클릭 영역 + 첫 번째 단자 표시 고리
    function buildHotspots(st) {
      var g = new THREE.Group(); g.name = 'pa3d.hotspots'; st.scene.add(g); st.hot = []; st.marks = {};
      var hitMat = new THREE.MeshBasicMaterial({ visible: false });
      Object.keys(st.devs).forEach(function (dev) { (PORTS[dev] || []).forEach(function (pd) {
        var info = st.devs[dev].api.getPortInfo(st.devs[dev].root, pd[0]); if (!info) return;
        var p = info.worldPosition.clone().addScaledVector(info.worldNormal, 0.006);
        var hit = new THREE.Mesh(new THREE.SphereGeometry(pd[2] === 'socket' ? 0.026 : 0.018, 12, 8), hitMat); hit.position.copy(p); hit.userData.pa3dPort = { dev: dev, port: pd[0] }; g.add(hit); st.hot.push(hit);
        var ring = new THREE.Mesh(new THREE.TorusGeometry(pd[2] === 'socket' ? 0.024 : 0.018, 0.0035, 8, 32), new THREE.MeshBasicMaterial({ color: 0xf59e0b, depthTest: false, transparent: true, opacity: 0.95 }));
        ring.position.copy(info.worldPosition.clone().addScaledVector(info.worldNormal, 0.008)); ring.quaternion.setFromUnitVectors(new V3(0, 0, 1), info.worldNormal); ring.renderOrder = 999; ring.visible = false; g.add(ring);
        st.marks[key(dev, pd[0])] = ring;
      }); });
    }

    // -------------------------------------------------------------------------
    // 조작부: id → { dev, kind: 'toggle'|'knob'|'fader', label, obj(3D), get, set }
    function buildControls(st) {
      var C = {}, d = st.devs, list = [];
      function add(id, o) { C[id] = o; list.push(id); if (o.obj) o.obj.traverse(function (n) { n.userData.pa3dCtl = id; }); }
      st.ctl = {};
      if (d.sm58) add('sm58.switch', { dev: 'sm58', kind: 'toggle', label: 'SM58S 마이크 스위치', obj: d.sm58.root.getObjectByName('shureSm58.onOffSwitch') });
      if (d.zxa1) {
        add('zxa1.power', { dev: 'zxa1', kind: 'toggle', label: 'ZXA1 전원 스위치 (뒷면)', obj: d.zxa1.root.getObjectByName('evZxa1.powerSwitch') });
        add('zxa1.mic', { dev: 'zxa1', kind: 'knob', label: 'ZXA1 MIC 레벨 노브', obj: d.zxa1.root.getObjectByName('evZxa1.micKnob') });
        add('zxa1.master', { dev: 'zxa1', kind: 'knob', label: 'ZXA1 MASTER 노브', obj: d.zxa1.root.getObjectByName('evZxa1.masterKnob') });
      }
      if (d.mg) {
        var u = d.mg.root.userData.yamahaMg12xu;
        add('mg.power', { dev: 'mg', kind: 'toggle', label: 'MG12XU 전원 스위치 (뒷면)', obj: u.parts.powerSwitch });
        ['ch1', 'ch2', 'ch3', 'ch4', 'ch56', 'ch78'].forEach(function (ch) {
          add('mg.gain.' + ch, { dev: 'mg', kind: 'knob', label: 'MG12XU ' + CH_LABEL[ch] + ' GAIN', obj: u.knobs[ch + '.gain'], panel: false });
          add('mg.fader.' + ch, { dev: 'mg', kind: 'fader', label: 'MG12XU ' + CH_LABEL[ch] + ' 페이더', obj: u.faders[ch], panel: false });
        });
        add('mg.fader.stereo', { dev: 'mg', kind: 'fader', label: 'MG12XU STEREO 페이더', obj: u.faders.stereo });
      }
      if (d.crown) {
        var cu = d.crown.root.userData.crownXli1500;
        add('crown.power', { dev: 'crown', kind: 'toggle', label: 'Crown 전원 스위치 (앞면)', obj: cu.parts.powerSwitch });
        add('crown.att1', { dev: 'crown', kind: 'knob', label: 'Crown CH1 감쇠기(볼륨)', obj: cu.parts.gainKnobCh1 });
        add('crown.att2', { dev: 'crown', kind: 'knob', label: 'Crown CH2 감쇠기(볼륨)', obj: cu.parts.gainKnobCh2 });
      }
      st.C = C; st.ctlList = list;
      list.forEach(function (id) { st.ctl[id] = 0; });
      if (d.mg) { var ms = d.mg.root.userData.yamahaMg12xu.getState(); ['ch1', 'ch2', 'ch3', 'ch4', 'ch56', 'ch78'].forEach(function (ch) { st.ctl['mg.gain.' + ch] = ms.knobs[ch + '.gain']; }); }
    }
    function micChannel() { // SM58 이 꽂힌 MG 입력 채널 (없으면 ch1)
      var c = S.conns.filter(function (c) { return c.type === 'xlr' && c.ends.some(function (e) { return e.dev === 'sm58'; }); })[0];
      var o = c && c.ends.filter(function (e) { return e.dev === 'mg'; })[0]; return o && MG_CH[o.port] || 'ch1';
    }
    function setControl(id, v, quiet) {
      if (!S || !S.C[id]) return false; var c = S.C[id];
      v = c.kind === 'toggle' ? (v ? 1 : 0) : Math.max(0, Math.min(1, +v || 0)); S.ctl[id] = v; applyControls(); if (!quiet) refreshPanels(); S.needsRender = true; return true;
    }
    // 조작 값을 장비 모델에 반영 (전원 스위치 그림은 스위치 값, LED 는 실제 전원 여부)
    function applyControls(ev) {
      var d = S.devs, c = S.ctl, p = (ev || S.last || { power: {} }).power;
      if (d.sm58) ShureSM58.setSwitch(d.sm58.root, !!c['sm58.switch']);
      if (d.zxa1) { var za = d.zxa1.root.userData.evZxa1.api; za.setMic(c['zxa1.mic']); za.setMaster(c['zxa1.master']); za.setPower(!!p.zxa1);
        var rk = d.zxa1.root.getObjectByName('evZxa1.powerSwitch.rocker'); if (rk) rk.rotation.x = (c['zxa1.power'] ? 1 : -1) * 0.12; }
      if (d.mg) { var mu = d.mg.root.userData.yamahaMg12xu; mu.setPower(!!p.mg);
        Object.keys(c).forEach(function (id) { var m = /^mg\.(gain|fader)\.(.+)$/.exec(id); if (!m) return; if (m[1] === 'gain') mu.setKnob(m[2] + '.gain', c[id]); else mu.setFader(m[2], c[id]); });
        var r = mu.parts.powerSwitch.userData.rocker; if (r) r.rotation.x = c['mg.power'] ? -0.12 : 0.12; }
      if (d.crown) { var cu = d.crown.root.userData.crownXli1500; cu.setGain(1, c['crown.att1']); cu.setGain(2, c['crown.att2']); cu.setPower(!!p.crown);
        var cap = cu.parts.powerSwitch.userData.cap; if (cap) cap.position.z = (0.4 + (c['crown.power'] ? 0 : 0.9)) * 0.001; }
    }

    // -------------------------------------------------------------------------
    // 케이블 연결
    function chooseLength(type, a, b) { var dd = a.distanceTo(b) * 1.25 + 0.6, L = CABLE_INFO[type].lengths; for (var i = 0; i < L.length; i++) if (L[i] >= dd) return L[i]; return L[L.length - 1]; }
    function endsFor(type, A, B) {
      if (type === 'xlr') {
        var need = function (k) { return k === 'xlr-out' ? 'female' : k === 'xlr-in' ? 'male' : null; }, ea = need(A.kind), eb = need(B.kind);
        if (!ea || !eb) return { ok: false, msg: 'XLR 케이블은 XLR 단자에만 꽂을 수 있어요.' };
        if (ea === eb) return { ok: false, msg: ea === 'male' ? '두 곳 모두 입력(구멍 있는 암 단자)이에요. XLR 케이블은 한쪽 끝이 핀(수), 다른 쪽이 구멍(암)이라 출력 → 입력으로 이어야 합니다.' : '두 곳 모두 출력(핀 있는 수 단자)이에요. 출력 → 입력으로 이어 주세요.' };
        return { ok: true, ends: [[ea, A], [eb, B]] };
      }
      if (type === 'speakon') { if (A.kind !== 'speakon' || B.kind !== 'speakon') return { ok: false, msg: '스피커 케이블(speakON)은 앰프 출력과 패시브 스피커의 speakON 단자에만 꽂을 수 있어요.' }; return { ok: true, ends: [['a', A], ['b', B]] }; }
      if (type === 'ac') { var ia = A.kind === 'iec' ? A : B.kind === 'iec' ? B : null, sa = A.kind === 'socket' ? A : B.kind === 'socket' ? B : null;
        if (!ia || !sa) return { ok: false, msg: '전원 케이블은 한쪽은 장비 전원 입력, 다른 쪽은 벽 콘센트에 꽂아요.' }; return { ok: true, ends: [['iec', ia], ['mains', sa]] }; }
      return { ok: false, msg: '케이블 종류를 먼저 고르세요.' };
    }
    function cableModule(type) { return type === 'xlr' ? XlrCable : type === 'speakon' ? SpeakonCable : AcPowerCable; }
    function addConnection(type, A, B, opt) {
      var st = S, o = opt || {};
      if (!st.devs[A.dev] || !st.devs[B.dev] || !portDef(A.dev, A.port) || !portDef(B.dev, B.port)) return { ok: false, msg: '이 실습에 없는 단자예요.' };
      if (st.occupied[key(A.dev, A.port)] || st.occupied[key(B.dev, B.port)]) return { ok: false, msg: '이미 케이블이 꽂혀 있는 단자예요. 아래 목록에서 먼저 빼 주세요.' };
      if (A.dev === B.dev && A.port === B.port) return { ok: false, msg: '같은 단자를 두 번 골랐어요.' };
      var r = endsFor(type, A, B); if (!r.ok) return r;
      var M = cableModule(type), pa = st.devs[A.dev].api.getPortInfo(st.devs[A.dev].root, A.port), pb = st.devs[B.dev].api.getPortInfo(st.devs[B.dev].root, B.port);
      var len = chooseLength(type, pa.worldPosition, pb.worldPosition);
      var copts = { lengthM: len, colliders: st.colliders, name: type + (st.seq + 1), segmentMM: type === 'ac' ? 30 : 40 };
      if (type !== 'xlr') copts.jacketColor = CABLE_INFO[type].color;
      var c = M.create(copts), res = [];
      r.ends.forEach(function (e) { res.push(M.connect(c, e[0], st.devs[e[1].dev].api, st.devs[e[1].dev].root, e[1].port)); });
      var bad = res.filter(function (x) { return !x.ok; });
      if (bad.length) return { ok: false, msg: '이 조합은 꽂을 수 없어요: ' + bad.map(function (x) { return x.reason; }).join(' / ') };
      st.scene.add(c);
      var stats = M.update(c, { reset: true, steps: o.steps !== undefined ? o.steps : 360, iterations: 30, finalIterations: 2500 });
      var conn = { id: ++st.seq, type: type, root: c, M: M, lengthM: len, ends: r.ends.map(function (e) { return { end: e[0], dev: e[1].dev, port: e[1].port }; }), stats: stats };
      st.conns.push(conn); conn.ends.forEach(function (e) { st.occupied[key(e.dev, e.port)] = conn.id; });
      return { ok: true, conn: conn };
    }
    function removeConnection(id) {
      var st = S, i = st.conns.findIndex(function (c) { return c.id === id; }); if (i < 0) return false;
      var c = st.conns[i];
      c.ends.forEach(function (e) { delete st.occupied[key(e.dev, e.port)]; if (c.type === 'speakon') { try { SpeakonCable.disconnect(c.root, e.end); } catch (err) { /* 무시 */ } } });
      st.scene.remove(c.root); c.root.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
      st.conns.splice(i, 1); return true;
    }

    // -------------------------------------------------------------------------
    // 전원·신호 판정
    function evaluate() {
      var st = S, c = st.ctl, mains = {}, power = {}, notes = [];
      st.conns.forEach(function (cn) { if (cn.type !== 'ac') return; var s = AcPowerCable.getState(cn.root), iec = cn.ends.filter(function (e) { return e.end === 'iec'; })[0]; if (s.powered && iec) mains[iec.dev] = true; });
      ['mg', 'zxa1', 'crown'].forEach(function (dv) { if (st.devs[dv]) power[dv] = !!mains[dv] && !!c[dv + '.power']; });
      var link = {}; st.conns.forEach(function (cn) { if (cn.type === 'ac' || cn.ends.length !== 2) return; var a = cn.ends[0], b = cn.ends[1]; link[key(a.dev, a.port)] = { dev: b.dev, port: b.port }; link[key(b.dev, b.port)] = { dev: a.dev, port: a.port }; });
      // 신호 전파: { db(dBu, 스피커 단은 R), level, path }
      var sig = {}, queue = [], mgInfo = null, crownR = {};
      function emit(dev, port, db, level, path) { var k = key(dev, port); if (sig[k]) return; sig[k] = { db: db, level: level, path: path }; queue.push(k); }
      var micOn = !!c['sm58.switch'];
      if (micOn) emit('sm58', 'xlrOut', SRC_DBU, 'mic', ['SM58S']);
      while (queue.length) {
        var k0 = queue.shift(), s0 = sig[k0], to = link[k0]; if (!to) continue;
        var d = portDef(to.dev, to.port), role = d ? d[3] : '', k2 = key(to.dev, to.port), path = s0.path.concat([label(to.dev, to.port)]);
        if (sig[k2]) continue; sig[k2] = { db: s0.db, level: s0.level, path: path, input: true };
        if (to.dev === 'mg' && role === 'mixIn') {
          if (!power.mg) { notes.push(mains.mg ? 'MG12XU 전원 스위치가 꺼져 있어요(뒷면).' : 'MG12XU 에 신호가 들어왔지만 전원이 없어요.'); continue; }
          var ch = MG_CH[to.port], ms = st.devs.mg.root.userData.yamahaMg12xu.getState(), onBtn = ms.buttons[ch + '.on'] !== false, toSt = ms.buttons[ch + '.toStereo'] !== false;
          var pre = s0.db + mgGainDb(c['mg.gain.' + ch]), out = pre + faderDb(c['mg.fader.' + ch]) + faderDb(c['mg.fader.stereo']);
          if (!onBtn || !toSt) { notes.push(CH_LABEL[ch] + ' 의 ON 또는 ST 버튼이 꺼져 있어요.'); out = NEG; }
          mgInfo = { ch: ch, pre: pre, out: out };
          if (pre > PEAK_DBU) notes.push('MG12XU ' + CH_LABEL[ch] + ' GAIN 이 너무 높아요 — 채널에서 찌그러져요(PEAK). GAIN 을 줄이세요.');
          var ol = pre > PEAK_DBU ? Math.max(out, 25) : out;
          if (ol !== NEG) { emit('mg', 'stereoOutXlrL', ol, 'line', path.concat(['MG12XU STEREO OUT L'])); emit('mg', 'stereoOutXlrR', ol, 'line', path.concat(['MG12XU STEREO OUT R'])); }
          else if (onBtn && toSt) notes.push('MG12XU ' + (c['mg.fader.' + ch] < 0.02 ? CH_LABEL[ch] + ' 페이더' : 'STEREO 페이더') + '가 맨 아래(−∞)예요. 올려야 출력이 나가요.');
        } else if (to.dev === 'zxa1' && (role === 'micIn' || role === 'lineIn')) {
          var g0 = role === 'micIn' ? zxMicGainDb(c['zxa1.mic']) : 0, R = s0.db + g0 + attDb(c['zxa1.master']) - SENS.zxa1;
          if (role === 'micIn' && s0.level === 'line') R = Math.max(R, 10);   // 라인 레벨을 마이크 입력에 → 과입력
          sig[k2].R = R; if (power.zxa1) emit('zxa1', 'masterOut', s0.db + g0, 'line', path.concat(['ZXA1 MASTER OUT']));
        } else if (to.dev === 'crown' && (role === 'ampIn1' || role === 'ampIn2')) {
          var chn = role === 'ampIn1' ? 1 : 2, Rc = s0.db - SENS.crown + attDb(c['crown.att' + chn]); crownR[chn] = power.crown ? Rc : NEG;
          if (!power.crown) { notes.push(mains.crown ? 'Crown 전원 스위치가 꺼져 있어요(앞면).' : 'Crown 앰프에 신호가 들어왔지만 전원이 없어요.'); continue; }
          var outP = chn === 1 ? 'outputSpeakonCh1' : 'outputSpeakonCh2';
          if (Rc !== NEG) emit('crown', outP, Rc, 'speaker', path.concat(['Crown CH' + chn + ' 출력']));
          else notes.push('Crown CH' + chn + ' 감쇠기(볼륨)가 맨 아래예요.');
        } else if (to.dev === 'zx1' && role === 'spkIn') {
          emit('zx1', to.port === 'speakonA' ? 'speakonB' : 'speakonA', s0.db, s0.level, path.concat(['ZX1 병렬 단자']));
        }
      }
      if (!micOn && st.devs.sm58) notes.unshift('SM58S 마이크 스위치가 꺼져 있어요.');
      // 스피커 결과
      var spk = {};
      if (st.devs.zxa1) {
        var zi = ['micIn', 'lineIn'].map(function (p) { return sig[key('zxa1', p)]; }).filter(Boolean)[0], zp = zi && (sig['zxa1.micIn'] ? 'micIn' : 'lineIn');
        if (!power.zxa1) spk.zxa1 = { state: 'none', grade: 'silent', text: mains.zxa1 ? '전원 스위치가 꺼져 있어요 — 뒷면 POWER 스위치를 켜세요.' : '전원이 없어요 — 액티브 스피커는 전원이 있어야 소리가 납니다.', path: zi && zi.path };
        else if (!zi) spk.zxa1 = { state: 'none', grade: 'silent', text: '신호가 들어오지 않아요.' };
        else {
          var gz = grade(zi.R), tz = GRADE_TEXT[gz];
          if (zp === 'micIn' && zi.level === 'line') tz = '찌그러져요 — 믹서의 라인 레벨 출력을 MIC IN 에 넣었어요. LINE IN 을 쓰세요.';
          else if (zp === 'lineIn' && zi.level === 'mic') tz = '거의 들리지 않아요 — 마이크를 LINE IN 에 꽂았어요. MIC IN 을 쓰거나 믹서를 거치세요.';
          else if (gz !== 'good' && gz !== 'clip') tz += zp === 'micIn' ? ' — 뒷면 MIC 노브와 MASTER 노브를 올려 보세요.' : ' — 믹서 페이더나 ZXA1 MASTER 노브를 올려 보세요.';
          else if (gz === 'clip') tz += ' — 노브를 조금 내리세요.';
          spk.zxa1 = { state: gz === 'good' ? 'good' : gz === 'silent' ? 'none' : 'warn', grade: gz, R: zi.R, text: tz, path: zi.path };
        }
        try { d0('zxa1').userData.evZxa1.api.setLimit(!!(spk.zxa1.R > 3 && power.zxa1)); } catch (e) { /* 무시 */ }
      }
      if (st.devs.zx1) {
        var xi = sig['zx1.speakonA'] || sig['zx1.speakonB'];
        if (!xi) spk.zx1 = { state: 'none', grade: 'silent', text: '신호가 들어오지 않아요. (패시브 스피커는 앰프 출력이 필요해요)' };
        else if (xi.level !== 'speaker') spk.zx1 = { state: 'none', grade: 'silent', text: '앰프 출력이 아니에요.', path: xi.path };
        else { var gx = grade(xi.db), tx = GRADE_TEXT[gx] + (gx === 'low' || gx === 'faint' ? ' — 앰프 감쇠기나 믹서 페이더를 올려 보세요.' : gx === 'clip' ? ' — 앰프 감쇠기를 조금 내리세요.' : '');
          if (xi.path.join(' ').indexOf('MG12XU') < 0) tx = '거의 들리지 않아요 — 마이크를 앰프 입력에 바로 넣었어요. 믹서를 거쳐 라인 레벨로 보내세요.';
          spk.zx1 = { state: gx === 'good' && xi.path.join(' ').indexOf('MG12XU') >= 0 ? 'good' : 'warn', grade: gx, R: xi.db, text: tx, path: xi.path }; }
      }
      // 장비 표시: 믹서 미터, 앰프 LED
      try { if (st.devs.mg) { var mo = mgInfo && power.mg ? mgInfo.out : NEG, mv = mo === NEG ? 0 : Math.max(0, Math.min(1, (mo + 30) / 40)); st.devs.mg.root.userData.yamahaMg12xu.setMeter(mv, mv); } } catch (e) { /* 무시 */ }
      try { if (st.devs.crown) { var cu = st.devs.crown.root.userData.crownXli1500; [1, 2].forEach(function (ch) { var r = crownR[ch]; cu.setLed(ch, 'signal', r !== undefined && r > -40); cu.setLed(ch, 'clip', r !== undefined && r > 3); }); } } catch (e) { /* 무시 */ }
      st.last = { mains: mains, power: power, sig: sig, spk: spk, notes: notes, mg: mgInfo, micOn: micOn };
      return st.last;
    }
    function d0(dv) { return S.devs[dv].root; }
    // 장비 위치에서 계산하는 시점: 스탠드 위 스피커 뒷면, 클립에 끼운 마이크 정면(스위치·로고 쪽)
    function dynView(k) {
      var V = THREE.Vector3, d = S && S.devs;
      if ((k === 'zxa1' || k === 'zx1') && d[k]) { var r = d[k].root, b = new THREE.Box3().setFromObject(r.getObjectByName(k === 'zxa1' ? 'evZxa1.cabinetGroup' : 'evZx1.cabinetGroup') || r), c = b.getCenter(new V()), back = new V(0, 0, -1).applyQuaternion(r.getWorldQuaternion(new THREE.Quaternion()));
        var t = c.clone().addScaledVector(back, 0.1).add(new V(0, -0.05, 0)); return { pos: t.clone().addScaledVector(back, 0.8).add(new V(0.12, 0.22, 0)).toArray(), target: t.toArray() }; }
      if (k === 'mic' && d.sm58 && S.stands && S.stands.mic) { var m = d.sm58.root, q = m.getWorldQuaternion(new THREE.Quaternion()), ax = new V(0, 1, 0).applyQuaternion(q), fr = new V(0, 0, 1).applyQuaternion(q);
        var cm = m.getWorldPosition(new V()).addScaledVector(ax, 0.07); return { pos: cm.clone().addScaledVector(fr, 0.34).add(new V(0, 0.06, 0)).addScaledVector(new V().crossVectors(ax, fr).normalize(), 0.1).toArray(), target: cm.toArray() }; }
      return null;
    }

    function hasConn(a, b) { return S.conns.some(function (cn) { var k = cn.ends.map(function (e) { return key(e.dev, e.port); }); return k.some(function (q) { return typeof a === 'function' ? a(q) : q === a; }) && k.some(function (q) { return typeof b === 'function' ? b(q) : q === b; }); }); }
    function missionChecks(ev) {
      var c = S.ctl, isMgIn = function (k) { return /^mg\.(in\d|mic\d)$/.test(k); }, isAmpIn = function (k) { return /^crown\.inputXlr/.test(k); }, isMgOut = function (k) { return /^mg\.stereoOutXlr/.test(k); };
      var ch = ev.mg ? ev.mg.ch : micChannel(), z = ev.spk.zxa1, x = ev.spk.zx1;
      var gainOk = !!(ev.mg && ev.mg.pre >= -12 && ev.mg.pre <= PEAK_DBU);
      if (sid === 's1') return [
        ['SM58S ➔ ZXA1 MIC IN (XLR 케이블)', hasConn('sm58.xlrOut', 'zxa1.micIn')], ['ZXA1 전원 케이블 ➔ 콘센트', !!ev.mains.zxa1], ['ZXA1 전원 스위치 켜기 (뒷면)', !!c['zxa1.power']],
        ['SM58S 마이크 스위치 켜기', !!c['sm58.switch']], ['ZXA1 MIC 노브 올리기', c['zxa1.mic'] >= 0.02], ['ZXA1 MASTER 노브 올리기', c['zxa1.master'] >= 0.02],
        ['ZXA1 에서 알맞은 크기로 소리 남', !!(z && z.grade === 'good' && hasConn('sm58.xlrOut', 'zxa1.micIn'))]];
      var common = [['SM58S ➔ MG12XU 입력', hasConn('sm58.xlrOut', isMgIn)], ['MG12XU 전원 케이블 + 전원 스위치', !!ev.power.mg], ['SM58S 마이크 스위치 켜기', !!c['sm58.switch']],
        ['MG12XU ' + CH_LABEL[ch] + ' GAIN 을 알맞게 올리기', gainOk], ['MG12XU ' + CH_LABEL[ch] + ' 페이더 + STEREO 페이더 올리기', c['mg.fader.' + ch] >= 0.02 && c['mg.fader.stereo'] >= 0.02]];
      if (sid === 's2') return common.concat([['MG12XU STEREO OUT ➔ ZXA1 LINE IN', hasConn('zxa1.lineIn', isMgOut)], ['ZXA1 전원 케이블 + 전원 스위치', !!ev.power.zxa1],
        ['ZXA1 MASTER 노브 올리기', c['zxa1.master'] >= 0.02], ['ZXA1 에서 알맞은 크기로 소리 남 (믹서 경유)', !!(z && z.grade === 'good' && z.path && z.path.join(' ').indexOf('MG12XU') >= 0)]]);
      var ampCh = S.conns.filter(function (cn) { return cn.ends.some(function (e) { return isMgOut(key(e.dev, e.port)); }) && cn.ends.some(function (e) { return isAmpIn(key(e.dev, e.port)); }); })
        .map(function (cn) { return /Ch2$/.test(cn.ends.filter(function (e) { return e.dev === 'crown'; })[0].port) ? 2 : 1; })[0] || 1;
      return common.concat([['MG12XU STEREO OUT ➔ Crown 입력', hasConn(isMgOut, isAmpIn)], ['Crown 전원 케이블 + 전원 스위치', !!ev.power.crown], ['Crown CH' + ampCh + ' 감쇠기(볼륨) 올리기', c['crown.att' + ampCh] >= 0.02],
        ['Crown speakON 출력 ➔ ZX1 (스피커 케이블)', hasConn(function (q) { return /^crown\.outputSpeakon/.test(q); }, function (q) { return /^zx1\./.test(q); })],
        ['ZX1 에서 알맞은 크기로 소리 남', !!(x && x.state === 'good')]]);
    }

    // -------------------------------------------------------------------------
    // UI
    function refreshMarks() { Object.keys(S.marks).forEach(function (k) { S.marks[k].visible = false; }); if (!S.mode || !S.first) return; var m = S.marks[key(S.first.dev, S.first.port)]; if (m) m.visible = true; }
    function setMode(mode) {
      S.mode = S.mode === mode ? null : mode; S.first = null;
      card.querySelectorAll('.pa3d-cable-btn').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-cable') === S.mode); });
      refreshMarks(); S.needsRender = true;
      setMsg(S.mode ? CABLE_INFO[S.mode].label + ' — 이 케이블을 꽂을 첫 번째 단자를 찾아 누르세요.' : '케이블 종류를 고른 뒤, 꽂을 단자 두 곳을 차례로 누르세요.');
    }
    function onPortClick(P) {
      var st = S;
      if (!st.mode) { setMsg(label(P.dev, P.port) + ' — 케이블 종류를 먼저 고르세요.'); return; }
      var kind = portKind(P.dev, P.port);
      if (CABLE_INFO[st.mode].fits.indexOf(kind) < 0) { setMsg(label(P.dev, P.port) + ' 에는 ' + CABLE_INFO[st.mode].label + '을(를) 꽂을 수 없어요.', 'bad'); return; }
      if (st.occupied[key(P.dev, P.port)]) { setMsg(label(P.dev, P.port) + ' 에는 이미 케이블이 꽂혀 있어요.', 'bad'); return; }
      if (!st.first) { st.first = { dev: P.dev, port: P.port, kind: kind }; refreshMarks(); S.needsRender = true; setMsg('첫 번째: ' + label(P.dev, P.port) + ' — 이제 반대쪽 단자를 누르세요.'); return; }
      var A = st.first, B = { dev: P.dev, port: P.port, kind: kind }; st.first = null; busy(true); var mode = st.mode;
      setTimeout(function () { var r = addConnection(mode, A, B); busy(false);
        if (!r.ok) { setMsg(r.msg, 'bad'); refreshMarks(); return; }
        setMsg('연결됨: ' + label(A.dev, A.port) + ' ↔ ' + label(B.dev, B.port) + ' (' + CABLE_INFO[mode].label + ' ' + r.conn.lengthM + 'm)', 'good');
        refreshMarks(); refreshPanels(); S.needsRender = true; }, 30);
    }
    function ctlValueText(id) { var c = S.C[id], v = S.ctl[id]; if (c.kind === 'toggle') return v ? '켜짐' : '꺼짐';
      if (/^mg\.gain/.test(id)) return '+' + mgGainDb(v).toFixed(0) + 'dB'; if (/^mg\.fader/.test(id)) return dbTxt(faderDb(v)) + 'dB';
      if (id === 'zxa1.mic') return Math.round(v * 100) + '%'; return dbTxt(attDb(v)) + 'dB'; }
    function panelIds() { var ch = micChannel(); return S.ctlList.filter(function (id) { return S.C[id].panel !== false || id === 'mg.gain.' + ch || id === 'mg.fader.' + ch; }); }
    function renderControlPanel() {
      var box = Q('controls'); if (!box) return; var ids = panelIds();
      box.innerHTML = ids.map(function (id) { var c = S.C[id], v = S.ctl[id];
        if (c.kind === 'toggle') return '<div class="pa3d-ctl"><span>' + esc(c.label) + '</span><button type="button" class="pa3d-btn pa3d-tg' + (v ? ' on' : '') + '" data-ctl="' + id + '">' + (v ? '켜짐 — 끄기' : '꺼짐 — 켜기') + '</button></div>';
        return '<label class="pa3d-ctl"><span>' + esc(c.label) + ' <b data-val="' + id + '">' + ctlValueText(id) + '</b></span><input type="range" min="0" max="100" step="1" value="' + Math.round(v * 100) + '" data-ctl="' + id + '"></label>'; }).join('');
      S.panelKey = ids.join(',');
    }
    function syncControlPanel() {
      var box = Q('controls'); if (!box) return; if (S.panelKey !== panelIds().join(',')) { renderControlPanel(); return; }
      box.querySelectorAll('[data-ctl]').forEach(function (e) { var id = e.getAttribute('data-ctl'), v = S.ctl[id];
        if (e.tagName === 'BUTTON') { e.classList.toggle('on', !!v); e.textContent = v ? '켜짐 — 끄기' : '꺼짐 — 켜기'; } else if (document.activeElement !== e) e.value = Math.round(v * 100); });
      box.querySelectorAll('[data-val]').forEach(function (e) { e.textContent = ctlValueText(e.getAttribute('data-val')); });
    }
    function refreshPanels() {
      var ev = evaluate(), st = S; applyControls(ev);
      var pw = Q('power');
      if (pw) pw.innerHTML = ['mg', 'crown', 'zxa1'].filter(function (dv) { return st.devs[dv]; }).map(function (dv) { var on = ev.power[dv], m = ev.mains[dv];
        return '<span class="pa3d-chip ' + (on ? 'on' : 'off') + '">' + (on ? '⚡' : '○') + ' ' + DEV_NAME[dv] + (on ? ' 켜짐' : m ? ' 스위치 꺼짐' : ' 전원 없음') + '</span>'; }).join('') +
        '<span class="pa3d-chip ' + (ev.micOn ? 'on' : 'off') + '">' + (ev.micOn ? '🎤' : '○') + ' SM58S ' + (ev.micOn ? '켜짐' : '꺼짐') + '</span>';
      var sp = Q('speakers');
      if (sp) sp.innerHTML = [['zxa1', 'ZXA1 액티브 스피커'], ['zx1', 'ZX1 패시브 스피커']].filter(function (s) { return ev.spk[s[0]]; }).map(function (s) { var r = ev.spk[s[0]];
        var meter = r.R !== undefined && r.R !== NEG ? '<div class="pa3d-meter"><i style="width:' + Math.max(2, Math.min(100, (r.R + 40) / 46 * 100)).toFixed(0) + '%" class="' + r.grade + '"></i></div>' : '';
        return '<div class="pa3d-spk ' + r.state + '"><b>' + (r.state === 'good' ? '🔊' : r.state === 'warn' ? '⚠️' : '🔇') + ' ' + s[1] + '</b> — ' + esc(r.text) + meter + (r.path ? '<div class="pa3d-path">' + esc(r.path.join(' ➔ ')) + '</div>' : '') + '</div>'; }).join('') +
        (ev.mg ? '<div class="pa3d-path">MG12XU ' + CH_LABEL[ev.mg.ch] + ': 게인 뒤 ' + dbTxt(ev.mg.pre) + 'dBu → STEREO OUT ' + dbTxt(ev.mg.out) + 'dBu</div>' : '') +
        (ev.notes.length ? '<div class="pa3d-note">' + ev.notes.map(esc).join('<br>') + '</div>' : '');
      var cl = Q('conns');
      if (cl) cl.innerHTML = st.conns.length ? st.conns.map(function (cn) { return '<li><span class="pa3d-ctype ' + cn.type + '">' + CABLE_INFO[cn.type].label + ' ' + cn.lengthM + 'm</span> ' + esc(label(cn.ends[0].dev, cn.ends[0].port)) + ' ↔ ' + esc(label(cn.ends[1].dev, cn.ends[1].port)) +
        ' <button type="button" class="pa3d-x" data-conn="' + cn.id + '" title="이 케이블 빼기">빼기</button></li>'; }).join('') : '<li class="pa3d-empty">아직 연결한 케이블이 없어요.</li>';
      var ck = missionChecks(ev), done = ck.every(function (x) { return x[1]; }), mp = Q('mission');
      if (mp) mp.innerHTML = '<div class="pa3d-mtitle">' + esc(SC.title) + (done ? ' <span class="pa3d-done">완료 🎉</span>' : '') + '</div><ul class="pa3d-check">' +
        ck.map(function (x) { return '<li class="' + (x[1] ? 'ok' : '') + '">' + (x[1] ? '✅' : '⬜') + ' ' + esc(x[0]) + '</li>'; }).join('') + '</ul>';
      syncControlPanel();
      st.lastChecks = ck; st.missionDone = done; st.needsRender = true;
    }
    function setView(k) { var v = ALL_VIEWS[k]; if (!v || !S) return; if (SC.viewOverride && SC.viewOverride[k]) v = { label: v.label, pos: SC.viewOverride[k].pos, target: SC.viewOverride[k].target };
      var dv = dynView(k); if (dv) v = dv; S.controls.target.fromArray(v.target);
      var a = S.camera.aspect, f = a < 1 ? 1.5 : a < 1.4 ? 1.22 : 1;
      if (k === 'mixer' || k === 'amp' || k === 'mic') f = a < 1 ? 1.35 : 1;
      var pos = v.pos.slice(); if (k === 'mixer' && !has('crown')) { pos[0] += 0.24; }
      var tgt = v.target.slice(); if (k === 'mixer' && !has('crown')) { tgt[0] += 0.24; S.controls.target.fromArray(tgt); }
      S.camera.position.fromArray(pos).sub(S.controls.target).multiplyScalar(f).add(S.controls.target); S.controls.update(); S.needsRender = true;
      card.querySelectorAll('.pa3d-vbtn').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-view') === k); }); }

    // 클릭/끌기 대상 찾기: 단자(투명 구) 또는 조작부(장비 메시의 userData.pa3dCtl)
    function ndc(ev) { var r = S.renderer.domElement.getBoundingClientRect(); return new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); }
    function pick(ev) {
      S.ray.setFromCamera(ndc(ev), S.camera);
      var bh = S.ray.intersectObjects(S.blockers, true).filter(function (h) { return h.object.visible; })[0], ctl = null;
      if (bh) { var o = bh.object; while (o && !(o.userData && o.userData.pa3dCtl)) o = o.parent; if (o) ctl = { id: o.userData.pa3dCtl, d: bh.distance }; }
      var ph = S.ray.intersectObjects(S.hot, false)[0], port = null;
      if (ph && !(bh && bh.distance < ph.distance - 0.02 && !ctl)) port = { p: ph.object.userData.pa3dPort, d: ph.distance };
      if (ctl && (!port || ctl.d <= port.d + 0.004)) return { ctl: ctl.id };
      if (port) return { port: port.p };
      return null;
    }
    function wire(container) {
      var cv = S.renderer.domElement, down = null, drag = null, tip = Q('tip');
      cv.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; var p = pick(e);
        if (p && p.ctl) { S.controls.enabled = false; drag = { id: p.ctl, y: e.clientY, v0: S.ctl[p.ctl], moved: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ } } }, true);
      cv.addEventListener('pointermove', function (e) {
        if (drag) { var c = S.C[drag.id], dy = drag.y - e.clientY; if (Math.abs(dy) > 3) drag.moved = true;
          if (c.kind !== 'toggle' && drag.moved) { setControl(drag.id, drag.v0 + dy / 160); showTip(e, c.label + ' · ' + ctlValueText(drag.id)); } return; }
        if (e.pointerType !== 'mouse' || !tip) return; var p = pick(e);
        if (p && p.ctl) { var cc = S.C[p.ctl]; showTip(e, cc.label + ' · ' + ctlValueText(p.ctl) + (cc.kind === 'toggle' ? ' (클릭)' : ' (위아래로 끌기)')); cv.style.cursor = cc.kind === 'toggle' ? 'pointer' : 'ns-resize'; }
        else if (p && p.port) { showTip(e, label(p.port.dev, p.port.port) + (S.occupied[key(p.port.dev, p.port.port)] ? ' · 사용 중' : '')); cv.style.cursor = 'pointer'; }
        else { tip.style.display = 'none'; cv.style.cursor = ''; } });
      function showTip(e, t) { if (!tip) return; var r = container.getBoundingClientRect(); tip.style.display = 'block'; tip.textContent = t; tip.style.left = (e.clientX - r.left + 12) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px'; }
      cv.addEventListener('pointerup', function (e) {
        if (drag) { var c = S.C[drag.id]; if (c.kind === 'toggle' && !drag.moved) { setControl(drag.id, !S.ctl[drag.id]); setMsg(c.label + ': ' + ctlValueText(drag.id), 'good'); }
          else if (drag.moved) setMsg(c.label + ': ' + ctlValueText(drag.id)); drag = null; if (tip) tip.style.display = 'none'; S.controls.enabled = true; down = null; return; }
        if (!down) return; var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved > 6) return; var p = pick(e); if (p && p.port) onPortClick(p.port); });
      cv.addEventListener('pointerleave', function () { if (tip) tip.style.display = 'none'; });
      cv.addEventListener('pointercancel', function () { drag = null; S.controls.enabled = true; });
      S.controls.addEventListener('change', function () { S.needsRender = true; });
      card.querySelectorAll('.pa3d-cable-btn').forEach(function (b) { b.onclick = function () { setMode(b.getAttribute('data-cable')); }; });
      card.querySelectorAll('.pa3d-vbtn').forEach(function (b) { b.onclick = function () { setView(b.getAttribute('data-view')); }; });
      var cl = Q('conns'); if (cl) cl.onclick = function (e) { var t = e.target; if (t && t.getAttribute && t.getAttribute('data-conn')) { removeConnection(+t.getAttribute('data-conn')); setMsg('케이블을 뺐어요.'); refreshMarks(); refreshPanels(); } };
      var cb = Q('controls'); if (cb) { cb.addEventListener('click', function (e) { var t = e.target; if (t && t.tagName === 'BUTTON' && t.getAttribute('data-ctl')) { var id = t.getAttribute('data-ctl'); setControl(id, !S.ctl[id]); setMsg(S.C[id].label + ': ' + ctlValueText(id), 'good'); } });
        cb.addEventListener('input', function (e) { var t = e.target; if (t && t.getAttribute('data-ctl')) setControl(t.getAttribute('data-ctl'), +t.value / 100); }); }
      var rs = Q('reset'); if (rs) rs.onclick = function () { api.reset(); };
      var sol = Q('solve'); if (sol) sol.onclick = function () { api.showSolution(); };
      window.addEventListener('resize', resize);
    }
    function resize() { if (!S) return; var c = S.container, W = c.clientWidth, H = c.clientHeight; if (!W || !H) return; S.camera.aspect = W / H; S.camera.updateProjectionMatrix(); S.renderer.setSize(W, H); S.needsRender = true; }
    function visible() { var t = card.closest ? card.closest('.tab-content') : null; if (t && !t.classList.contains('active')) return false; return S.onScreen !== false; }
    function scaleMarks() { var cp = S.camera.position;
      S.hot.forEach(function (h) { var k = Math.min(4, Math.max(1, cp.distanceTo(h.position) / 0.9)); h.scale.setScalar(k); var u = h.userData.pa3dPort, m = S.marks[key(u.dev, u.port)]; if (m) m.scale.setScalar(k); }); }
    function loop() { requestAnimationFrame(loop); if (!S || S.paused || !visible()) return; var moved = S.controls.update(); if (moved || S.needsRender || S.frames < 3) { scaleMarks(); S.renderer.render(S.scene, S.camera); S.needsRender = false; S.frames++; } }

    var api = {
      id: sid, scenario: SC,
      init: function () {
        if (inited) { resize(); return S; }
        var need = ['THREE', 'ShureSM58', 'KoreanOutlet', 'XlrCable', 'AcPowerCable', 'MicStand', 'SpeakerStand'].concat(has('mg') ? ['YamahaMG12XU'] : [], has('zxa1') ? ['EvZXA1'] : [], has('crown') ? ['CrownXLi1500', 'SpeakonCable'] : [], has('zx1') ? ['EvZX1'] : [])
          .filter(function (n) { return !window[n]; });
        if (need.length || !THREE.OrbitControls) { setMsg('3D 모델 파일을 불러오지 못했어요: ' + need.join(', '), 'bad'); return null; }
        var container = Q('viewport'); if (!container) return null;
        container.querySelectorAll('canvas').forEach(function (c) { c.remove(); });
        inited = true;
        var base = buildScene(container); S = base; S.container = container; S.ray = new THREE.Raycaster(); S.conns = []; S.occupied = {}; S.seq = 0; S.mode = null; S.first = null; S.frames = 0; S.needsRender = true;
        var room = buildRoom(S); S.devs = room.devs; S.colliders = room.colliders;
        S.blockers = SC.devs.map(function (dv) { return S.devs[dv].root; });
        buildHotspots(S); buildControls(S); renderControlPanel();
        if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { S.onScreen = es[0].isIntersecting; if (S.onScreen) S.needsRender = true; }).observe(container); }
        wire(container); setView(SC.views[0]); setMode(null); refreshPanels(); loop();
        return S;
      },
      reset: function () { if (!S) return; S.conns.slice().forEach(function (c) { removeConnection(c.id); }); S.first = null;
        S.ctlList.forEach(function (id) { S.ctl[id] = 0; }); if (S.devs.mg) ['ch1', 'ch2', 'ch3', 'ch4', 'ch56', 'ch78'].forEach(function (ch) { S.ctl['mg.gain.' + ch] = 0.35; });
        refreshMarks(); refreshPanels(); setMsg('모든 케이블을 빼고 스위치·노브·페이더를 처음 상태로 돌렸어요.'); },
      showSolution: function () {
        if (!S) return; var sol = SOLUTIONS[sid], made = 0, skipped = 0; busy(true, '정답 연결을 놓는 중…');
        setTimeout(function () {
          sol.conns.forEach(function (s) { var A = { dev: s[1][0], port: s[1][1], kind: portKind(s[1][0], s[1][1]) }, B = { dev: s[2][0], port: s[2][1], kind: portKind(s[2][0], s[2][1]) };
            if (S.occupied[key(A.dev, A.port)] && S.occupied[key(A.dev, A.port)] === S.occupied[key(B.dev, B.port)]) return; var r = addConnection(s[0], A, B); if (r.ok) made++; else skipped++; });
          var ch = micChannel(); Object.keys(sol.ctl).forEach(function (id) { var t = id.replace('.ch1', '.' + ch); if (S.C[t]) S.ctl[t] = sol.ctl[id]; });
          busy(false); refreshMarks(); refreshPanels();
          setMsg('정답 연결 ' + made + '개를 놓고 스위치·노브·페이더를 맞췄어요.' + (skipped ? ' (이미 다른 케이블이 꽂힌 단자 ' + skipped + '곳은 건너뜀 — 필요하면 "처음 상태로" 후 다시 눌러 보세요)' : ''), 'good');
        }, 30);
      },
      connect: function (type, a, b, opt) { var r = addConnection(type, { dev: a[0], port: a[1], kind: portKind(a[0], a[1]) }, { dev: b[0], port: b[1], kind: portKind(b[0], b[1]) }, opt); refreshMarks(); refreshPanels();
        setMsg(r.ok ? '연결됨: ' + label(a[0], a[1]) + ' ↔ ' + label(b[0], b[1]) : r.msg, r.ok ? 'good' : 'bad'); return r; },
      disconnect: function (id) { var ok = removeConnection(id); refreshMarks(); refreshPanels(); return ok; },
      setControl: function (id, v) { return setControl(id, v); }, getControls: function () { return S ? JSON.parse(JSON.stringify(S.ctl)) : null; },
      controlObject: function (id) { return S && S.C[id] ? S.C[id].obj : null; },
      setMode: setMode, setView: setView, clickPort: function (dev, port) { onPortClick({ dev: dev, port: port }); },
      getState: function () { if (!S) return null; var ev = evaluate(), ck = missionChecks(ev);
        return { scenario: sid, conns: S.conns.map(function (c) { return { id: c.id, type: c.type, lengthM: c.lengthM, ends: c.ends, stats: c.stats }; }), power: ev.power, mains: ev.mains, micOn: ev.micOn, mixer: ev.mg,
          speakers: ev.spk, notes: ev.notes, controls: JSON.parse(JSON.stringify(S.ctl)), checks: ck, missionDone: ck.every(function (c) { return c[1]; }) }; },
      renderNow: function () { if (S) { S.controls.update(); scaleMarks(); S.renderer.render(S.scene, S.camera); } },
      pause: function (v) { if (S) S.paused = !!v; },
      get state() { return S; }
    };
    return api;
  }

  // ---------------------------------------------------------------------------
  var instances = {};
  function setup() {
    document.querySelectorAll('[data-pa3d]').forEach(function (card) { var sid = card.getAttribute('data-pa3d'); if (!SCENARIOS[sid]) return; renderShell(card, sid); instances[sid] = createPractice(card, sid); });
  }
  window.PaPractice3D = {
    SCENARIOS: SCENARIOS, SOLUTIONS: SOLUTIONS, PORTS: PORTS, VIEWS: ALL_VIEWS,
    get: function (sid) { return instances[sid] || null; }, instances: instances,
    levels: { mgGainDb: mgGainDb, faderDb: faderDb, attDb: attDb, zxMicGainDb: zxMicGainDb, grade: grade, SRC_DBU: SRC_DBU, SENS: SENS }
  };
  window.pa3dStart = function (sid) {
    var inst = instances[sid || 's1']; if (!inst) return;
    var card = document.querySelector('[data-pa3d="' + (sid || 's1') + '"]'), st = card && card.querySelector('[data-role="start"]'); if (st) st.style.display = 'none';
    setTimeout(function () { var r = inst.init(); if (!r && st) st.style.display = ''; }, 20);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
