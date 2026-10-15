/* =============================================================================
   3층 본당 음향 설치 데이터 (교회 둘러보기 모드용)
   -----------------------------------------------------------------------------
   - 코드와 분리된 "실제 설치 상태" 데이터입니다. 화면 코드는 assets3d/sanctuary_tour.js.
   - 좌표: assets3d/sanctuary_data.js 본당 GLB 장면 좌표(미터, Y 위).
       X  4.4(뒤쪽 벽, 방송실 쪽) → 45.6(단상 뒤 벽)
       Z −18.7(회중석에서 봤을 때 왼쪽 벽) → −0.4(오른쪽 벽), 가운데 ≈ −9.5
       바닥 Y 0.05, 단상 위 Y 0.62, 천장 Y ≈ 5.05
   - 좌/우(L/R)는 회중석에서 단상을 바라본 기준입니다.
   - pos 는 장비 몸체의 가운데 좌표입니다.
   - yawDeg: 장비 앞면이 바라보는 방향. 0 = +Z(오른쪽 벽), 90 = +X(단상 쪽), −90 = −X(회중석 뒤쪽).
     pitchDeg: 양수면 앞면이 아래를 향함.
   - 장비 위치는 현장 사진과 본당 모델을 보고 배치했습니다(2026-10-15).
     기완 님 요청으로 화면에는 "추정" 표시를 하지 않습니다. 실제와 다르면 pos 만 고치면 됩니다.
   - 연결(links)의 verify:
       'confirmed'      확인된 연결(포트까지)
       'confirmed-pair' 어느 장비끼리 연결되는지는 확인, 포트·채널 번호는 미확인
       'unknown'        연결 자체가 미확인
   ============================================================================= */
window.SANCTUARY_INSTALL = {
  version: 2,
  updated: '2026-10-15',
  units: 'm',

  // 장소(목록 묶음 + 카메라 시점). glbNode 가 있으면 본당 모델 안의 SketchUp 시점을 씁니다.
  locations: [
    { id: 'overview', name: '본당 전체', view: { pos: [9.5, 4.6, -9.5], target: [40, 1.2, -9.5] } },
    { id: 'stage', name: '단상', view: { pos: [33.5, 2.8, -9.5], target: [43.2, 1.8, -9.5] } },
    { id: 'pulpit', name: '강대상', view: { pos: [44.3, 2.25, -9.5], target: [42.5, 1.55, -9.5] } },
    { id: 'ceiling', name: '회중석 천장', view: { pos: [21.5, 1.8, -9.5], target: [30.5, 4.0, -9.5] } },
    { id: 'pillar', name: '기둥', view: { pos: [6.2, 1.9, -9.5], target: [12.7, 3.0, -9.5] } },
    { id: 'booth', name: '방송실', view: { pos: [0.95, 1.75, -10.95], target: [3.2, 0.95, -10.95] } },
    { id: 'rack', name: '앰프 랙 (단상 옆 방)', view: { pos: [45.05, 1.6, -20.2], target: [43.55, 1.2, -20.6] } }
  ],

  devices: [
    // ---- 단상 ----
    { id: 'vi10p_L', name: '메인 L', model: 'd&b Vi10P', modelKey: 'vi10p', location: 'stage',
      pos: [45.2, 4.2, -14.4], yawDeg: -78.7, pitchDeg: 7, mount: '벽 높은 곳 (무대 양옆)',
      role: '회중석 전체를 담당하는 메인 스피커(왼쪽). 패시브라서 40D 앰프의 출력을 받아야 소리가 납니다.' },
    { id: 'vi10p_R', name: '메인 R', model: 'd&b Vi10P', modelKey: 'vi10p', location: 'stage',
      pos: [45.2, 4.2, -4.6], yawDeg: -101.3, pitchDeg: 7, mount: '벽 높은 곳 (무대 양옆)',
      role: '메인 L 과 한 쌍인 오른쪽 메인 스피커입니다.' },
    { id: 'woofer_L', name: '우퍼 L', model: 'd&b V-SUB', modelKey: 'vsub', location: 'stage',
      pos: [39.75, 0.38, -14.6], yawDeg: -90, pitchDeg: 0, mount: '바닥 (단상 앞 왼쪽 끝)',
      role: '저음(베이스·킥드럼)을 보강하는 서브우퍼입니다.' },
    { id: 'woofer_R', name: '우퍼 R', model: 'd&b V-SUB', modelKey: 'vsub', location: 'stage',
      pos: [39.75, 0.38, -4.4], yawDeg: -90, pitchDeg: 0, mount: '바닥 (단상 앞 오른쪽 끝)',
      role: '우퍼 L 과 한 쌍인 서브우퍼입니다.' },
    { id: 'max2_L', name: '바닥 모니터 L', model: 'd&b MAX2', proc: 'wedge', size: [0.59, 0.35, 0.43], color: 0x2b2f36,
      location: 'stage', pos: [40.75, 0.8, -12.0], yawDeg: 90, pitchDeg: 0, mount: '단상 바닥',
      role: '단상 위 사람이 자기 소리와 반주를 듣도록 앞에 놓는 바닥 모니터(웨지)입니다.' },
    { id: 'max2_R', name: '바닥 모니터 R', model: 'd&b MAX2', proc: 'wedge', size: [0.59, 0.35, 0.43], color: 0x2b2f36,
      location: 'stage', pos: [40.75, 0.8, -7.0], yawDeg: 90, pitchDeg: 0, mount: '단상 바닥',
      role: '바닥 모니터 L 과 한 쌍인 바닥 모니터입니다.' },
    { id: 'g308_L', name: '단상 모니터 L', model: 'CODA Audio G308', proc: 'box', size: [0.26, 0.43, 0.27], color: 0xf1f1ee,
      location: 'stage', pos: [41.2, 0.84, -13.6], yawDeg: 26, pitchDeg: -12, mount: '단상 왼쪽 바닥',
      role: '단상 왼쪽 바닥에 두고 단상 위에서 소리를 확인하는 모니터 스피커입니다.' },
    { id: 'g308_R', name: '단상 모니터 R', model: 'CODA Audio G308', proc: 'box', size: [0.26, 0.43, 0.27], color: 0xf1f1ee,
      location: 'stage', pos: [41.2, 0.84, -5.4], yawDeg: 154, pitchDeg: -12, mount: '단상 오른쪽 바닥',
      role: '단상 오른쪽 바닥에 두는 모니터 스피커입니다.' },

    // ---- 강대상 ----
    { id: 'alea4_L', name: '설교자 모니터 L', model: 'Voice-Acoustic Alea-4', proc: 'small', size: [0.15, 0.15, 0.15], color: 0xf4f4f2,
      location: 'pulpit', pos: [42.56, 1.74, -10.35], yawDeg: 90, pitchDeg: -15, mount: '강대상 위',
      role: '설교자가 자기 목소리를 들을 수 있도록 강대상 위에 둔 작은 모니터 스피커입니다.' },
    { id: 'alea4_R', name: '설교자 모니터 R', model: 'Voice-Acoustic Alea-4', proc: 'small', size: [0.15, 0.15, 0.15], color: 0xf4f4f2,
      location: 'pulpit', pos: [42.56, 1.74, -8.65], yawDeg: 90, pitchDeg: -15, mount: '강대상 위',
      role: '설교자 모니터 L 과 한 쌍입니다.' },
    { id: 'mic_podium_L', name: '강대상 마이크 L', model: '구즈넥 마이크', proc: 'gooseneck', color: 0x1c1d20,
      location: 'pulpit', pos: [42.62, 1.64, -10.0], yawDeg: 90, pitchDeg: 0, mount: '강대상 위',
      cl5Channel: 1, role: '설교자 목소리를 받는 강대상 마이크입니다. CL5 의 1번 채널 이름이 Podium L 입니다.' },
    { id: 'mic_podium_R', name: '강대상 마이크 R', model: '구즈넥 마이크', proc: 'gooseneck', color: 0x1c1d20,
      location: 'pulpit', pos: [42.62, 1.64, -9.0], yawDeg: 90, pitchDeg: 0, mount: '강대상 위',
      cl5Channel: 2, role: '강대상 마이크 L 과 한 쌍입니다. CL5 의 2번 채널 이름이 Podium R 입니다.' },

    // ---- 회중석 천장 ----
    { id: 'y10p_C', name: '천장 가운데', model: 'd&b Yi10P', modelKey: 'yi10p', location: 'ceiling',
      pos: [30.5, 4.45, -9.5], yawDeg: -90, pitchDeg: 14, mount: '천장 매달기 (중간 가운데)',
      role: '메인 스피커에서 먼 회중석 가운데를 보강하는 딜레이 스피커입니다.' },
    { id: 'y7p_L', name: '천장 왼쪽', model: 'd&b Yi7P', modelKey: 'yi7p', location: 'ceiling',
      pos: [30.5, 4.5, -14.2], yawDeg: -90, pitchDeg: 14, mount: '천장 매달기 (중간 왼쪽)',
      role: '회중석 왼쪽 구역을 보강하는 딜레이 스피커입니다.' },
    { id: 'y7p_R', name: '천장 오른쪽', model: 'd&b Yi7P', modelKey: 'yi7p', location: 'ceiling',
      pos: [30.5, 4.5, -4.8], yawDeg: -90, pitchDeg: 14, mount: '천장 매달기 (중간 오른쪽)',
      role: '회중석 오른쪽 구역을 보강하는 딜레이 스피커입니다.' },

    // ---- 기둥 ----
    { id: 'e8_L', name: '기둥 왼쪽', model: 'd&b E8', modelKey: 'e8', location: 'pillar',
      pos: [12.70, 3.2, -13.76], yawDeg: -90, pitchDeg: 10, mount: '뒤쪽 기둥 (왼쪽)',
      role: '회중석 뒤쪽 구역을 위한 딜레이 스피커입니다. 단상에서 더 멀어서 딜레이 시간도 더 깁니다.' },
    { id: 'e8_R', name: '기둥 오른쪽', model: 'd&b E8', modelKey: 'e8', location: 'pillar',
      pos: [12.70, 3.2, -5.25], yawDeg: -90, pitchDeg: 10, mount: '뒤쪽 기둥 (오른쪽)',
      role: '기둥 왼쪽과 한 쌍인 딜레이 스피커입니다.' },

    // ---- 방송실 ----
    { id: 'booth_desk', name: '방송실 책상', proc: 'desk', size: [2.2, 0.75, 0.8], color: 0xd9d4cb, decor: true,
      location: 'booth', pos: [3.05, 0.375, -10.95], yawDeg: -90, pitchDeg: 0 },
    { id: 'cl5', name: 'CL5 콘솔', model: 'Yamaha CL5', proc: 'console', size: [1.053, 0.3, 0.667], color: 0x24272c,
      location: 'booth', pos: [3.05, 0.9, -11.2], yawDeg: -90, pitchDeg: 0, mount: '방송실 책상',
      img: 'console.jpg',
      role: '모든 입력을 받아 소리를 섞는 디지털 콘솔입니다. Rio 와 무선 수신기의 신호가 Dante(랜선)로 들어옵니다.' },
    { id: 'ulxd', name: '무선 마이크 수신기 ×3', model: 'Shure ULX-D4Q ×3', proc: 'rackstack', units: 3, size: [0.483, 0.044, 0.36], color: 0x1f2125,
      location: 'booth', pos: [3.1, 0.82, -10.2], yawDeg: -90, pitchDeg: 0, mount: '방송실 책상',
      role: '무선 마이크(핸드·핀) 신호를 받는 4채널 수신기 3대입니다. Dante 로 CL5 에 연결되어 있습니다.' },

    // ---- 앰프 랙 ----
    { id: 'rack_cab', name: '앰프 랙', proc: 'rack', size: [0.6, 1.9, 0.8], color: 0xc9ccd1, decor: true,
      location: 'rack', pos: [43.45, 0.95, -20.55], yawDeg: 90, pitchDeg: 0 },
    { id: 'stagebox', name: '스테이지 박스 Rio3224-D', model: 'Yamaha Rio3224-D', modelKey: 'rio3224d', location: 'rack',
      pos: [43.62, 1.63, -20.55], yawDeg: 90, pitchDeg: 0, mount: '앰프 랙 맨 위', img: 'rio3224D2.jpg',
      role: '단상 쪽 마이크·악기 신호를 받아 Dante 로 CL5 에 보내고, CL5 의 출력을 AES/EBU 로 앰프에 보내는 입출력 장치입니다.' },
    { id: 'amp_40d', name: '40D 앰프', model: 'd&b 40D', modelKey: 'amp40d', location: 'rack',
      pos: [43.58, 1.20, -20.55], yawDeg: 90, pitchDeg: 0, mount: '앰프 랙', img: '40D.jpg',
      role: '메인 L/R, 우퍼, 천장 가운데 스피커를 구동하는 4채널 앰프입니다.' },
    { id: 'amp_10d', name: '10D 앰프', model: 'd&b 10D', modelKey: 'amp10d', location: 'rack',
      pos: [43.59, 1.06, -20.55], yawDeg: 90, pitchDeg: 0, mount: '앰프 랙', img: '10D.jpg',
      role: '천장 왼쪽·오른쪽(Yi7P), 기둥(E8), 바닥 모니터(MAX2)를 구동하는 4채널 앰프입니다.' },

    // ---- 위치 미확인 ----
    { id: 'alea4_3', name: '세 번째 Alea-4', model: 'Voice-Acoustic Alea-4', location: null, pos: null,
      role: 'Alea-4 는 3대가 있고 2대는 강대상 위에 있습니다. 나머지 1대의 위치와 용도는 아직 모릅니다.' }
  ],

  // 랙 사진에 보이지만 모델·용도를 아직 확인하지 못한 장비 (3D 에 넣지 않음)
  rackUnconfirmed: [
    'Rio3224-D 아래 두 번째 Yamaha Rio',
    'Crown 앰프 2대 (화면이 있는 것 1대, XLS 1대)',
    '맨 아래 장비 1대'
  ],

  // 논리 신호 연결. port/channel 이 null 이면 아직 모르는 값입니다.
  links: [
    { id: 'L01', from: 'mic_podium_L', to: 'stagebox', medium: 'analog', label: '마이크 케이블 (XLR)', toPort: null,
      verify: 'unknown', note: 'Rio 입력 번호 ↔ CL5 채널은 나중에 알려 주시기로 함' },
    { id: 'L02', from: 'mic_podium_R', to: 'stagebox', medium: 'analog', label: '마이크 케이블 (XLR)', toPort: null,
      verify: 'unknown', note: 'Rio 입력 번호 ↔ CL5 채널은 나중에 알려 주시기로 함' },
    { id: 'L03', from: 'stagebox', to: 'cl5', medium: 'dante', label: 'Dante (랜선)', verify: 'confirmed-pair', note: '케이블은 천장으로 지나감' },
    { id: 'L04', from: 'ulxd', to: 'cl5', medium: 'dante', label: 'Dante (랜선)', verify: 'confirmed-pair' },
    { id: 'L05', from: 'stagebox', to: 'amp_40d', medium: 'aes', label: 'AES/EBU 출력', verify: 'confirmed-pair', note: 'Rio AES 출력 번호는 미확인' },
    { id: 'L06', from: 'stagebox', to: 'amp_10d', medium: 'aes', label: 'AES/EBU 출력', verify: 'confirmed-pair', note: 'Rio AES 출력 번호는 미확인' },
    { id: 'L07', from: 'amp_40d', fromPort: 'CH1', to: 'vi10p_L', medium: 'speaker', label: '스피커 케이블', verify: 'confirmed' },
    { id: 'L08', from: 'amp_40d', fromPort: 'CH2', to: 'vi10p_R', medium: 'speaker', label: '스피커 케이블', verify: 'confirmed' },
    { id: 'L09', from: 'amp_40d', fromPort: 'CH3', to: 'woofer_L', medium: 'speaker', label: '스피커 케이블', verify: 'confirmed', note: 'CH3 = 우퍼' },
    { id: 'L10', from: 'amp_40d', fromPort: 'CH3', to: 'woofer_R', medium: 'speaker', label: '스피커 케이블', verify: 'confirmed', note: 'CH3 = 우퍼' },
    { id: 'L11', from: 'amp_40d', fromPort: 'CH4', to: 'y10p_C', medium: 'speaker', label: '스피커 케이블', verify: 'confirmed' },
    { id: 'L12', from: 'amp_10d', fromPort: 'CH1', to: 'y7p_L', medium: 'speaker', label: '스피커 케이블 (2대 링크)', verify: 'confirmed' },
    { id: 'L13', from: 'amp_10d', fromPort: 'CH1', to: 'y7p_R', medium: 'speaker', label: '스피커 케이블 (2대 링크)', verify: 'confirmed' },
    { id: 'L14', from: 'amp_10d', fromPort: 'CH2', to: 'e8_L', medium: 'speaker', label: '스피커 케이블 (2대 링크)', verify: 'confirmed' },
    { id: 'L15', from: 'amp_10d', fromPort: 'CH2', to: 'e8_R', medium: 'speaker', label: '스피커 케이블 (2대 링크)', verify: 'confirmed' },
    { id: 'L16', from: 'amp_10d', fromPort: 'CH3', to: 'max2_L', medium: 'speaker', label: '스피커 케이블', verify: 'confirmed' },
    { id: 'L17', from: 'amp_10d', fromPort: 'CH4', to: 'max2_R', medium: 'speaker', label: '스피커 케이블', verify: 'confirmed' }
  ],

  // 연결이 아직 확인되지 않은 장비 (정보 카드에 "어디서 신호를 받는지 미확인" 으로 표시)
  feedUnknown: ['g308_L', 'g308_R', 'alea4_L', 'alea4_R']
};
