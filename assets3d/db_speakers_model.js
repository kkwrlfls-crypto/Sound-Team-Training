/* =============================================================================
   d&b audiotechnik 패시브 스피커 5종 — 절차적(procedural) 3D 모델  (Three.js r128 전용, 2026-11-04)
   -----------------------------------------------------------------------------
   - 전역: window.DbSpeakers = { create(opts) → THREE.Group, VARIANTS, DIMENSIONS_MM, SPECS, RECOMMENDED_DIR, api(root) }
   - variant: 'Vi10P'(3층 무대 메인 L/R) · 'Yi10P'(천장 가운데) · 'Yi7P'(천장 좌우) · 'E8'(기둥) · 'V-SUB'(무대)
   - opts: { variant: 'Vi10P', color: 'black' | 'white' | 0xRRGGBB, xray: false, labels: true, hornRotation: 0 | 90 }
       · color 'white' = RAL 9016(트래픽 화이트) 근사. 그릴 · 그릴 뒤 폼도 같은 색(공식: 폼은 캐비닛 색으로 칠함)
       · xray: 그릴 반투명 + 캐비닛 반투명 + 드라이버(우퍼 · 미드 · 컴프레션 드라이버 · CD 혼) 표시, labels 로 이름표
       · hornRotation: 회전형 CD 혼 방향. 0 = 기본(넓은 쪽이 가로, 예: Vi10P 110°(H) × 40°(V)), 90 = 돌린 상태(40° × 110°)
   - 단위: mm 로 만들고 루트 아래 그룹을 0.001 배(미터). 원점 = 바닥면 가운데(캐비닛 몸통 기준), +Y 위, +Z 앞(그릴), +X 오른쪽.
   - 로고(제조사 상표)는 그리지 않음. 뒷면 단자판 인쇄는 모델명 · 기능 이름만.

   근거 — 「공식」
     · 치수 · 무게(W × H × D): d&b 건축 사양서(architectural specifications) · 데이터 시트 · 제품 페이지
         Vi10P 308 × 700 × 466 mm, 33 kg   (dbaudio-arch-specs-vi10p-en.txt, dbaudio-datasheet-vi10p-en.pdf)
         Yi10P 257 × 580 × 341 mm, 18 kg   (dbaudio.com/global/en/products/series/y-series/yi10p)
         Yi7P  257 × 580 × 341 mm, 18 kg   (dbaudio-arch-specs-yi7p-en.txt, dbaudio-datasheet-yi7p-1.1-en.pdf)
         E8    232 × 390 × 223 mm, 7.3 kg  (dbaudio-arch-specs-e8-en.txt)
         V-SUB 700 × 606 × 728 mm, 64 kg   (dbaudio-arch-specs-v-sub-en.txt)
     · 드라이버: Vi10P 2 × 10" LF(다이폴) + 8" MF(혼 로드, 가운데) + 1.4" 출구 컴프레션 드라이버(MF 와 동축, 회전형 CD 혼), 110° × 40°
                 Yi10P 2 × 8" LF(다이폴) + 1.4" 컴프레션 드라이버(회전형 CD 혼) 110° × 40° / Yi7P 같은 구성 75° × 40°
                 E8 8" / 1" 동축 드라이버(CD 혼) 90° × 50°(90° 회전 가능) / V-SUB 18" 앞(베이스 리플렉스) + 12" 뒤(2챔버 밴드패스)
     · 외형: 마린 합판 + 충격에 강한 검정 도장(PCP), RAL 특수색 가능 / 앞 = 단단한 금속 그릴 + 음향 투과 폼
             Vi10P: M10 인서트 2개씩 윗면 · 아랫면 · 뒷면 / Yi7P · Yi10P: M10 인서트 2개씩 윗면 · 아랫면(뒷면 없음)
             Vi · Yi: 뒷면 오목한 단자판에 NL4 M × 2 + 2극 나사 단자(ST), 덮개판 / 그릴은 윗면 · 아랫면의 Torx 나사로 고정
             Y7P(투어용)는 윗면 · 아랫면에 손잡이가 있지만 Yi 는 「캐비닛 구조 · 마감 · 마운팅 하드웨어만 다름」 → 손잡이 없음(Yi 설명서에 손잡이 언급 없음)
             E8: 윗면 손잡이, 아랫면 스탠드(폴) 소켓, M10 인서트, 뒷면 오목 단자판(Speakon)
             V-SUB: 옆면마다 손잡이 2개, 뒷면 운반용 바퀴 4개, 3점 리깅(앞 좌우 · 뒤 가운데), 뒷면 오목 단자판(NL4)
   근거 — 「CAD 단면」
     · 저장소의 d&b 기반 GLB(assets3d/gear_models_data.js 의 vi10p · yi7p · yi10p · e8 · vsub, 인치 단위)를 잘라 본 단면 좌표:
         평면 사다리꼴(옆판 각도), 앞 그릴의 굽은 정도 · 옆으로 감싸는 깊이, 뒷면 오목부 위치 · 크기, E8 윗면 손잡이 홈 · 옆 오목부 ·
         아랫면 폴 소켓 · 뒤 모서리 모따기, V-SUB 손잡이 홈 · 뒤 리깅 홈 · 단자판 · 바퀴 위치
       (GLB 깊이는 Vi10P 463, V-SUB 725 mm 라서 공식 깊이 466 · 728 mm 에 맞춰 뒷면만 늘림)
   「사진 비례 · 추정」
     · 드라이버의 세로 위치 · 혼 입구 크기 · 들어간 깊이, 그릴 구멍 크기(피치 7 ~ 9 mm), M10 인서트의 정확한 위치,
       뒷면 두 오목부 중 어느 쪽이 단자판인지(아래쪽 = 단자판, 위쪽 = 덮개판으로 둠), 단자판 안 배치, V-SUB 윗면 쌓기 홈 · 아래 받침
   ============================================================================= */
(function (global) {
  'use strict';
  var THREE = global.THREE;
  if (!THREE) { console.error('[DbSpeakers] THREE 가 먼저 로드되어야 합니다.'); return; }

  var VARIANTS = ['Vi10P', 'Yi10P', 'Yi7P', 'E8', 'V-SUB'];
  var DIM = {
    'Vi10P': { width: 308, height: 700, depth: 466, weightKg: 33, source: '공식' },
    'Yi10P': { width: 257, height: 580, depth: 341, weightKg: 18, source: '공식' },
    'Yi7P': { width: 257, height: 580, depth: 341, weightKg: 18, source: '공식' },
    'E8': { width: 232, height: 390, depth: 223, weightKg: 7.3, source: '공식' },
    'V-SUB': { width: 700, height: 606, depth: 728, weightKg: 64, source: '공식(바퀴 제외 몸통 기준 — 뒷면 바퀴는 약 100 mm 더 나옴)' }
  };
  var SPECS = {
    'Vi10P': { type: '3웨이 패시브 포인트 소스(설치용)', drivers: ['2 × 10" LF (다이폴)', '1 × 8" MF (혼 로드)', '1 × 1.4" 출구 컴프레션 드라이버 (MF 와 동축, 회전형 CD 혼)'], dispersion: '110° × 40°', impedanceOhm: 8, powerW: '500 / 2000', connectors: 'NL4 M × 2 + 나사 단자(ST)', install: '3층 무대 메인 L/R' },
    'Yi10P': { type: '2웨이 패시브 포인트 소스(설치용)', drivers: ['2 × 8" LF (다이폴)', '1 × 1.4" 출구 컴프레션 드라이버 (회전형 CD 혼)'], dispersion: '110° × 40°', impedanceOhm: 8, powerW: '400 / 1600', connectors: 'NL4 M × 2 + 나사 단자(ST)', install: '3층 천장 가운데' },
    'Yi7P': { type: '2웨이 패시브 포인트 소스(설치용)', drivers: ['2 × 8" LF (다이폴)', '1 × 1.4" 출구 컴프레션 드라이버 (회전형 CD 혼)'], dispersion: '75° × 40°', impedanceOhm: 8, powerW: '400 / 1600', connectors: 'NL4 M × 2 + 나사 단자(ST)', install: '3층 천장 좌우' },
    'E8': { type: '2웨이 패시브(동축)', drivers: ['1 × 8" / 1" 동축 드라이버 (CD 혼)'], dispersion: '90° × 50° (회전하면 50° × 90°)', impedanceOhm: 12, powerW: '150 / 800', connectors: 'Speakon(NL4) × 2', install: '3층 기둥' },
    'V-SUB': { type: '카디오이드 서브우퍼(패시브)', drivers: ['1 × 18" (앞, 베이스 리플렉스)', '1 × 12" (뒤, 2챔버 밴드패스)'], dispersion: '카디오이드', impedanceOhm: 8, powerW: '800 / 3200', connectors: 'NL4 × 2', install: '3층 무대' }
  };
  // 사이트 뷰어: 중심에서 dir 방향으로 bbox 대각선 × 1.6 거리에 카메라
  var RECOMMENDED_DIR = { 'Vi10P': [0.55, 0.28, 1], 'Yi10P': [0.6, 0.3, 1], 'Yi7P': [0.6, 0.3, 1], 'E8': [0.6, 0.32, 1], 'V-SUB': [0.7, 0.45, 1] };

  // ---------------------------------------------------------------------------
  // 평면 반쪽 외곽선 (x ≥ 0, z: 앞면 0 → 뒤 -D). CAD 단면 좌표.
  function curve(R, x1, n) { var p = []; for (var i = 0; i <= n; i++) { var x = x1 * i / n; p.push([x, -x * x / (2 * R)]); } return p; }
  var HALF = {
    // 앞 그릴: 반지름 ~1170 mm 로 살짝 볼록, 모서리 r≈10, 옆으로 29 mm 감쌈, 옆판은 뒤로 갈수록 좁아짐(옆판마다 약 7.6°)
    'Vi10P': curve(1168, 140, 7).concat([[145, -9.2], [148.5, -10.3], [151.5, -12.2], [153.4, -14.6], [154, -18], [154, -29], [96, -466]]),
    'Yi': curve(833, 112, 7).concat([[119, -8.9], [122.5, -9.8], [125.6, -11.4], [127.6, -13.6], [128.5, -16.5], [128.6, -20], [128.6, -28], [86, -341]]),
    // 앞 테두리 안 그릴(±109), 옆 116, 뒤 모서리 모따기
    'E8': [[0, 0], [22, -0.3], [44, -1.6], [66, -3.8], [88, -7.6], [100, -10.2], [109, -12.6], [113, -14], [115.4, -15.5], [116, -18], [116, -50], [115, -68], [114, -100], [113, -128], [111, -138], [104, -150], [99, -162], [93, -175], [87, -187], [70, -201], [50, -217], [45, -223]],
    // 앞 그릴(±301) 양옆 테두리, 네 모서리 둥글게
    'V-SUB': [[0, 0], [325, 0], [325, -10], [340, -22], [350, -34], [350, -720], [347.7, -725.7], [342, -728], [107, -728], [84, -663], [0, -663]]
  };
  function halfOf(v) { return HALF[v === 'Yi10P' || v === 'Yi7P' ? 'Yi' : v]; }

  // 띠(band)별 특징: 앞 그릴 자리 잘라내기 · 옆 오목부 · 뒤 오목부 · 위아래 구멍
  function variantFeatures(v) {
    var D = DIM[v], f = { front: null, side: [], rear: [], holes: [], ycuts: [] };
    if (v === 'Vi10P') {
      f.front = { y0: 13, y1: 687, zf: -29, wrap: true };
      f.rear = [{ x0: -36, x1: 36, y0: 115, y1: 226, d: 10, panel: 'conn' }, { x0: -36, x1: 36, y0: 475, y1: 586, d: 10, panel: 'cover' }];
    } else if (v === 'Yi10P' || v === 'Yi7P') {
      f.front = { y0: 15, y1: 565, zf: -28, wrap: true };
      f.rear = [{ x0: -56, x1: 56, y0: 134, y1: 206, d: 5, panel: 'conn' }, { x0: -56, x1: 56, y0: 374, y1: 446, d: 5, panel: 'cover' }];
    } else if (v === 'E8') {
      f.front = { y0: 7, y1: 383, zf: -19, xmax: 109 };
      f.side = [{ y0: 149, y1: 241, z0: -74, z1: -156, x: 100 }];
      f.rear = [{ x0: -35, x1: 35, y0: 258, y1: 368, d: 5, panel: 'conn' }, { x0: -35, x1: 35, y0: 20, y1: 136, d: 24, panel: 'mount' }];
      f.holes = [{ y0: 355, y1: 380, x0: -72, x1: 72, z0: -24, z1: -136, floor: 355 }, { y0: 380, y1: 390, x0: -72, x1: 72, z0: -94, z1: -136 },   // 윗면 손잡이 홈(앞쪽은 손잡이 다리)
        { y0: 0, y1: 15, x0: -66, x1: 66, z0: -72, z1: -132, floor: 15 }];                                                                   // 아랫면 폴 소켓 홈
    } else if (v === 'V-SUB') {
      f.front = { y0: 6, y1: 595, zf: -20, xmax: 301 };
      f.side = [{ y0: 217, y1: 386, z0: -76, z1: -291, x: 300 }, { y0: 392, y1: 561, z0: -457, z1: -672, x: 300 }];   // 손잡이 홈(옆마다 2개)
      f.rear = [{ x0: 115, x1: 235, y0: 198, y1: 335, d: 10, panel: 'conn' }];
      f.holes = [{ y0: 591, y1: 601, x0: -55, x1: 55, z0: -184, z1: -294, floor: 591 }];                                   // 윗면 가운데 홈(플랜지)
    }
    var ys = [0, v === 'V-SUB' ? 601 : D.height];
    if (f.front) ys.push(f.front.y0, f.front.y1);
    f.side.concat(f.rear, f.holes).forEach(function (a) { ys.push(a.y0, a.y1); });
    ys = ys.filter(function (y, i) { return ys.indexOf(y) === i; }).sort(function (a, b) { return a - b; });
    f.ycuts = ys; return f;
  }

  function zAtX(half, x) { // 반쪽 외곽선의 앞쪽 경계에서 x 위치의 z
    for (var i = 1; i < half.length; i++) { var a = half[i - 1], b = half[i]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); }
    return half[half.length - 1][1];
  }
  function xAtZ(half, z) { // 옆선에서 z 위치의 x (앞쪽 곡선 지난 뒤)
    for (var i = 1; i < half.length; i++) { var a = half[i - 1], b = half[i]; if ((a[1] - z) * (b[1] - z) <= 0 && a[1] !== b[1]) return a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]); }
    return half[half.length - 1][0];
  }
  // 띠 하나의 전체 외곽선(앞에서 오른쪽 → 뒤 → 왼쪽, [x, z])
  function bandOutline(v, f, ym) {
    var half = halfOf(v).map(function (p) { return p.slice(); }), D = DIM[v];
    var fr = f.front && ym > f.front.y0 && ym < f.front.y1 ? f.front : null;
    if (fr) {
      if (fr.wrap) { var xs = xAtZ(half, fr.zf); half = [[0, fr.zf], [xs, fr.zf]].concat(half.filter(function (p) { return p[1] < fr.zf; })); }
      else { var zx = zAtX(half, fr.xmax); half = [[0, fr.zf], [fr.xmax, fr.zf], [fr.xmax, zx]].concat(half.slice(frontPart(half, fr.xmax).length)); }
    }
    f.side.forEach(function (s) {
      if (!(ym > s.y0 && ym < s.y1)) return;
      var out = [], st = 0;
      for (var i = 0; i < half.length; i++) {
        var p = half[i], q = half[i + 1];
        if (st === 2 || st === 0) out.push(p);
        if (!q) break;
        if (st === 0 && p[1] >= s.z0 && q[1] < s.z0 && p[0] > 0) { var x0 = p[0] + (q[0] - p[0]) * (s.z0 - p[1]) / (q[1] - p[1]); out.push([x0, s.z0], [s.x, s.z0]); st = 1; }
        if (st === 1 && p[1] >= s.z1 && q[1] < s.z1) { var x1 = p[0] + (q[0] - p[0]) * (s.z1 - p[1]) / (q[1] - p[1]); out.push([s.x, s.z1], [x1, s.z1]); st = 2; }
      }
      half = out;
    });
    var full = half.slice();
    for (var k = half.length - 1; k >= 0; k--) if (half[k][0] > 1e-6) full.push([-half[k][0], half[k][1]]);
    if (half[0][0] > 1e-6) full.push([-half[0][0], half[0][1]]);
    var zr = -D.depth;
    f.rear.forEach(function (r) {
      if (!(ym > r.y0 && ym < r.y1)) return;
      for (var i = 0; i < full.length; i++) {
        var a = full[i], b = full[(i + 1) % full.length];
        if (Math.abs(a[1] - zr) < 1e-6 && Math.abs(b[1] - zr) < 1e-6 && Math.min(a[0], b[0]) <= r.x0 && Math.max(a[0], b[0]) >= r.x1) {
          var ins = a[0] > b[0] ? [[r.x1, zr], [r.x1, zr + r.d], [r.x0, zr + r.d], [r.x0, zr]] : [[r.x0, zr], [r.x0, zr + r.d], [r.x1, zr + r.d], [r.x1, zr]];
          full.splice.apply(full, [i + 1, 0].concat(ins)); break;
        }
      }
    });
    return full;
  }

  // ---------------------------------------------------------------------------
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, srgb) { var t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
  var FONT = '"Noto Sans KR","Pretendard","Apple SD Gothic Neo","Malgun Gothic",Arial,sans-serif';
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  var TEXCACHE = {};
  // 그릴 타공(육각 배열 원형 구멍): 한 칸 = 가로 p, 세로 p·√3 (구멍 5개 자리). 흰 바탕 = 금속, 어두운 원 = 구멍 뒤 폼
  function grilleTex(holeRatio) {
    var key = 'g' + holeRatio; if (TEXCACHE[key]) return TEXCACHE[key];
    var c = canvas(128, 128), g = c.getContext('2d'), rx = 64 * holeRatio, ry = rx / Math.sqrt(3);   // holeRatio = 구멍 지름 / 피치
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128);
    [[0, 0], [128, 0], [0, 128], [128, 128], [64, 64]].forEach(function (p) {
      var gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], rx); gr.addColorStop(0, '#2a2a2a'); gr.addColorStop(0.75, '#3a3a3a'); gr.addColorStop(1, '#5a5a5a');
      g.fillStyle = gr; g.beginPath(); g.ellipse(p[0], p[1], rx, ry, 0, 0, Math.PI * 2); g.fill();
    });
    var t = tex(c, true); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    var b = canvas(128, 128), gb = b.getContext('2d'); gb.drawImage(c, 0, 0); var bt = tex(b, false); bt.wrapS = bt.wrapT = THREE.RepeatWrapping;
    return (TEXCACHE[key] = { map: t, bump: bt });
  }
  function grainTex() {   // PCP 도장의 얼룩덜룩한 무광 결 (roughness 변화만, 아주 약하게)
    if (TEXCACHE.grain) return TEXCACHE.grain;
    var c = canvas(64, 64), g = c.getContext('2d'), im = g.createImageData(64, 64);
    for (var i = 0; i < im.data.length; i += 4) { var n = 225 + Math.random() * 30; im.data[i] = im.data[i + 1] = im.data[i + 2] = n; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    var t = tex(c, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 160, 1 / 160);
    return (TEXCACHE.grain = t);
  }
  function panelPrint(v, w, h, kind, rot, ink) {   // 단자판 인쇄 (mm 크기 → 캔버스)
    var s = 6, c = canvas(Math.round(w * s), Math.round(h * s)), g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height); g.fillStyle = ink || '#d7dbe0'; g.textAlign = 'center'; g.textBaseline = 'middle';
    function T(t, x, y, size, wgt) { g.font = (wgt || '700') + ' ' + size * s + 'px ' + FONT; g.fillText(t, x * s, y * s); }
    if (kind === 'conn') {
      if (rot) { T(v, w / 2, 6, 5, '900'); T('INPUT', w * 0.2, h - 5, 3.2); T('LINK', w * 0.8, h - 5, 3.2); T('1+ / 1−', w / 2, h - 5, 3, '600'); }
      else { T(v, w / 2, 6.5, 5.2, '900'); T('INPUT', w * 0.78, h * 0.32, 3.2); T('LINK', w * 0.78, h * 0.58, 3.2); T('1+ / 1−', w / 2, h - 5, 3, '600'); }
    } else if (kind === 'cover') { T(v, w / 2, h / 2, 6, '900'); }
    return tex(c, true);
  }
  function labelTex(lines, color) {
    var c = canvas(512, 160), g = c.getContext('2d');
    g.fillStyle = 'rgba(8,14,26,0.82)'; rrect(g, 4, 4, 504, 152, 26); g.fill(); g.strokeStyle = color; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    function fit(t, size, wgt) { var f = size; do { g.font = wgt + ' ' + f + 'px ' + FONT; f -= 2; } while (g.measureText(t).width > 470 && f > 14); }   // 칸에 맞게 글자 크기 줄임
    fit(lines[0], 54, '900'); g.fillText(lines[0], 256, lines[1] ? 58 : 80);
    if (lines[1]) { fit(lines[1], 38, '700'); g.fillStyle = color; g.fillText(lines[1], 256, 118); }
    return tex(c, true);
  }

  function paintColor(c) {
    if (c === 'white' || c === 'RAL9016' || c === 9016) return 0xf1f0ea;   // RAL 9016 트래픽 화이트(근사 sRGB)
    if (typeof c === 'number') return c;
    if (typeof c === 'string' && /^#?[0-9a-f]{6}$/i.test(c)) return parseInt(c.replace('#', ''), 16);
    return 0x232325;                                                        // d&b 기본 검정 도장
  }
  function makeMaterials(opts) {
    var S = THREE.MeshStandardMaterial, pc = paintColor(opts.color), white = pc !== 0x232325 && (((pc >> 16) & 255) + ((pc >> 8) & 255) + (pc & 255)) > 380;
    var m = {
      body: new S({ color: pc, roughness: white ? 0.72 : 0.93, metalness: 0.0, roughnessMap: grainTex() }),
      pocket: new S({ color: white ? 0xd9d8d2 : 0x18181a, roughness: 0.8, metalness: 0.0 }),
      panel: new S({ color: 0x1b1c1f, roughness: 0.5, metalness: 0.55 }),
      cover: new S({ color: pc, roughness: 0.6, metalness: 0.25 }),
      steel: new S({ color: 0x8d9198, roughness: 0.35, metalness: 0.85 }),
      darkSteel: new S({ color: 0x2b2d31, roughness: 0.45, metalness: 0.7 }),
      hole: new S({ color: 0x050505, roughness: 1.0 }),
      nlGrey: new S({ color: 0x5f6267, roughness: 0.6, metalness: 0.05 }),
      nlBlack: new S({ color: 0x121316, roughness: 0.45, metalness: 0.3 }),
      rubber: new S({ color: 0x0c0c0d, roughness: 0.95 }),
      wheel: new S({ color: 0x2a2a2c, roughness: 0.8 }),
      // 드라이버(엑스레이 전용) — 종류별 색
      coneLF: new S({ color: 0x3a3b40, roughness: 0.75, emissive: 0xf59e0b, emissiveIntensity: 0.18, side: THREE.DoubleSide }),
      coneMF: new S({ color: 0x3a3b40, roughness: 0.75, emissive: 0x22c55e, emissiveIntensity: 0.2, side: THREE.DoubleSide }),
      rimLF: new S({ color: 0xf59e0b, roughness: 0.5, emissive: 0xf59e0b, emissiveIntensity: 0.5 }),
      rimMF: new S({ color: 0x22c55e, roughness: 0.5, emissive: 0x22c55e, emissiveIntensity: 0.5 }),
      horn: new S({ color: 0x38bdf8, roughness: 0.45, metalness: 0.2, emissive: 0x0ea5e9, emissiveIntensity: 0.35, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }),
      hfDriver: new S({ color: 0x7dd3fc, roughness: 0.35, metalness: 0.6, emissive: 0x0284c7, emissiveIntensity: 0.4 }),
      magnet: new S({ color: 0x55585e, roughness: 0.4, metalness: 0.8, side: THREE.DoubleSide }),
      dustCap: new S({ color: 0x18191b, roughness: 0.5 })
    };
    var gt = grilleTex(opts.variant === 'E8' ? 0.72 : opts.variant === 'V-SUB' ? 0.66 : 0.68);
    m.grille = new S({ color: white ? pc : 0x2b2c2f, map: gt.map, bumpMap: gt.bump, bumpScale: 0.25, roughness: white ? 0.55 : 0.5, metalness: white ? 0.15 : 0.45 });
    // 색 값은 sRGB 로 적었으므로 선형으로 바꿔 씀 (renderer.outputEncoding = sRGB)
    Object.keys(m).forEach(function (k) { var x = m[k]; if (x && x.isMaterial) { x.color.convertSRGBToLinear(); if (x.emissive) x.emissive.convertSRGBToLinear(); } });
    m.white = white; return m;
  }

  // ---- 도우미 ----
  function Baker() {   // 정적 부품을 재질별로 합쳐 그리기 호출 줄이기 (X32 모델과 같은 방식)
    var bins = [];
    function binOf(mat) { for (var i = 0; i < bins.length; i++) if (bins[i].mat === mat) return bins[i]; var b = { mat: mat, geos: [] }; bins.push(b); return b; }
    return {
      add: function (geo, mat, m4) { var g = geo.index ? geo.toNonIndexed() : geo.clone(); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (!g.attributes.normal) g.computeVertexNormals(); if (m4) g.applyMatrix4(m4); binOf(mat).geos.push(g); },
      build: function (parent, name) {
        var out = {};
        bins.forEach(function (b, bi) {
          var n = 0; b.geos.forEach(function (g) { n += g.attributes.position.count; });
          var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), o = 0;
          b.geos.forEach(function (g) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); });
          var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
          geo.computeBoundingSphere(); var mesh = new THREE.Mesh(geo, b.mat); mesh.name = name + '.' + bi; parent.add(mesh); out[bi] = mesh;
        });
        return out;
      }
    };
  }
  var V3 = new THREE.Vector3(), QT = new THREE.Quaternion(), ONE = new THREE.Vector3(1, 1, 1), ZAX = new THREE.Vector3(0, 0, 1);
  // 면 위 한 점: 로컬 +Z 를 법선 n 방향으로, spin = 법선 축 회전
  function onFace(x, y, z, nx, ny, nz, spin) {
    QT.setFromUnitVectors(ZAX, V3.set(nx, ny, nz).normalize());
    if (spin) QT.multiply(new THREE.Quaternion().setFromAxisAngle(ZAX, spin));
    return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), QT, ONE);
  }
  function cylZ(r, len, seg) { var g = new THREE.CylinderGeometry(r, r, len, seg || 24); g.rotateX(Math.PI / 2); g.translate(0, 0, len / 2); return g; }   // 로컬 +Z 로 len
  function boxZ(w, h, d) { var g = new THREE.BoxGeometry(w, h, d); g.translate(0, 0, d / 2); return g; }
  function rrShape(w, h, r) { var s = new THREE.Shape(), x0 = -w / 2, y0 = -h / 2; r = Math.min(r, w / 2, h / 2); s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); s.lineTo(x0 + w, y0 + h - r); s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h); s.lineTo(x0 + r, y0 + h); s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0); return s; }
  function plateZ(w, h, r, t) { return new THREE.ExtrudeGeometry(rrShape(w, h, r), { depth: t, bevelEnabled: false, curveSegments: 4 }); }

  // 캐비닛 면 만들기: 띠마다 옆벽만 세우고, 위 · 아래 뚜껑과 오목부의 천장 · 바닥처럼 「밖으로 드러난 면」만 따로 덮음
  // (띠 사이 안쪽 뚜껑을 그리지 않아야 옆면에 띠 경계 줄이 안 생김)
  function Faces() {
    var pos = [], nor = [], uv = [];
    function tri(a, b, c, n) {
      var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      var gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx; if (gx * gx + gy * gy + gz * gz < 1e-10) return;
      var ns = n.length === 3 && typeof n[0] === 'number' ? [n, n, n] : n;
      if (gx * (ns[0][0] + ns[1][0] + ns[2][0]) + gy * (ns[0][1] + ns[1][1] + ns[2][1]) + gz * (ns[0][2] + ns[1][2] + ns[2][2]) < 0) { var t = b; b = c; c = t; t = ns[1]; ns = [ns[0], ns[2], t]; }
      [a, b, c].forEach(function (p, i) { pos.push(p[0], p[1], p[2]); nor.push(ns[i][0], ns[i][1], ns[i][2]);
        var nn = ns[i]; uv.push(Math.abs(nn[1]) > 0.7 ? p[0] : (Math.abs(nn[0]) > Math.abs(nn[2]) ? p[2] : p[0]), Math.abs(nn[1]) > 0.7 ? p[2] : p[1]); });
    }
    function area(pts) { var a = 0; for (var i = 0; i < pts.length; i++) { var p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }
    return {
      // 닫힌 고리(평면 x,z)의 벽. inner = 구멍(안쪽을 향함)
      walls: function (pts, y0, y1, inner) {
        var n = pts.length, sg = (area(pts) > 0 ? 1 : -1) * (inner ? -1 : 1), en = [];
        for (var i = 0; i < n; i++) { var a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; en.push([sg * dz / l, -sg * dx / l]); }
        function vn(i, e) {   // 꼭짓점 i 에서 모서리 e 의 법선(이웃 모서리와 35° 안이면 부드럽게)
          var o = e === i ? (i - 1 + n) % n : (i + 1) % n, A = en[e], Bn = en[o];
          if (A[0] * Bn[0] + A[1] * Bn[1] > 0.82) { var x = A[0] + Bn[0], z = A[1] + Bn[1], l = Math.hypot(x, z); return [x / l, 0, z / l]; } return [A[0], 0, A[1]];
        }
        for (var k = 0; k < n; k++) {
          var k2 = (k + 1) % n, p = pts[k], q = pts[k2]; if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6) continue;
          var na = vn(k, k), nb = vn(k2, k), a0 = [p[0], y0, p[1]], b0 = [q[0], y0, q[1]], a1 = [p[0], y1, p[1]], b1 = [q[0], y1, q[1]];
          tri(a0, b0, b1, [na, nb, nb]); tri(a0, b1, a1, [na, nb, na]);
        }
      },
      // 평면 다각형(+구멍) 뚜껑
      cap: function (pts, holes, y, up) {
        var c = pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), hs = (holes || []).map(function (h) { return h.map(function (p) { return new THREE.Vector2(p[0], p[1]); }); });
        if (THREE.ShapeUtils.isClockWise(c)) c.reverse(); hs.forEach(function (h) { if (!THREE.ShapeUtils.isClockWise(h)) h.reverse(); });
        var all = c.concat.apply(c, hs), n = [0, up ? 1 : -1, 0];
        THREE.ShapeUtils.triangulateShape(c, hs).forEach(function (t) { tri([all[t[0]].x, y, all[t[0]].y], [all[t[1]].x, y, all[t[1]].y], [all[t[2]].x, y, all[t[2]].y], n); });
      },
      geometry: function () { var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g; }
    };
  }
  function frontPart(half, xmax) { var o = []; for (var i = 0; i < half.length && half[i][0] < xmax; i++) o.push(half[i]); return o; }   // 앞 곡선 부분(x 가 xmax 에 닿기 전까지)
  function rectLoop(x0, x1, z0, z1) { return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }
  function buildCabinet(v, F, H) {
    var fc = Faces(), half = halfOf(v), D = DIM[v], zr = -D.depth, bands = [];
    for (var i = 0; i < F.ycuts.length - 1; i++) {
      var y0 = F.ycuts[i], y1 = F.ycuts[i + 1], ym = (y0 + y1) / 2; if (y1 - y0 < 0.01) continue;
      var holes = F.holes.filter(function (h) { return ym > h.y0 && ym < h.y1; }).map(function (h) { return rectLoop(h.x0, h.x1, h.z0, h.z1); });
      var out = bandOutline(v, F, ym); fc.walls(out, y0, y1, false); holes.forEach(function (h) { fc.walls(h, y0, y1, true); });
      bands.push({ out: out, holes: holes });
    }
    fc.cap(bands[0].out, bands[0].holes, 0, false); fc.cap(bands[bands.length - 1].out, bands[bands.length - 1].holes, H, true);
    // 뒤 오목부 천장 · 바닥
    F.rear.forEach(function (r) { var q = rectLoop(r.x0, r.x1, zr, zr + r.d); fc.cap(q, null, r.y1, false); fc.cap(q, null, r.y0, true); });
    // 옆 오목부 천장 · 바닥 (양쪽)
    F.side.forEach(function (s) {
      var pts = [[s.x, s.z0], [xAtZ(half, s.z0), s.z0]].concat(half.filter(function (p) { return p[1] < s.z0 && p[1] > s.z1; }), [[xAtZ(half, s.z1), s.z1], [s.x, s.z1]]);
      [1, -1].forEach(function (sx) { var q = pts.map(function (p) { return [p[0] * sx, p[1]]; }); fc.cap(q, null, s.y1, false); fc.cap(q, null, s.y0, true); });
    });
    // 그릴 자리 위 · 아래 턱의 안쪽 면
    var fr = F.front, fp;
    if (fr.wrap) { var hp = half.filter(function (p) { return p[1] > fr.zf; }); fp = hp.concat([[xAtZ(half, fr.zf), fr.zf]]); }
    else { fp = frontPart(half, fr.xmax).concat([[fr.xmax, zAtX(half, fr.xmax)], [fr.xmax, fr.zf]]); }
    fp = fp.concat([[0, fr.zf]]); var full = fp.concat(fp.slice(1, -1).reverse().map(function (p) { return [-p[0], p[1]]; }));
    full = full.filter(function (p, k) { return k === 0 || Math.hypot(p[0] - full[k - 1][0], p[1] - full[k - 1][1]) > 0.01; });
    if (fr.y0 > 0) fc.cap(full, null, fr.y0, true);
    if (fr.y1 < H) fc.cap(full, null, fr.y1, false);
    // 위아래로 이어진 구멍(E8 손잡이 홈): 위 구멍이 더 작으면 그 차이가 천장
    F.holes.forEach(function (h) { F.holes.forEach(function (h2) { if (h2.y0 === h.y1 && h2.z0 < h.z0) fc.cap(rectLoop(h.x0, h.x1, h.z0, h2.z0), null, h.y1, false); }); });
    return fc.geometry();
  }
  // 그릴: 평면 폴리라인(왼→오)을 y0..y1 로 세운 띠 (UV = 길이 mm / 피치)
  function grilleGeo(line, y0, y1, pitch) {
    var n = line.length, pos = [], nor = [], uv = [], idx = [], s = [0];
    for (var i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
    var mid = s[n - 1] / 2, th = pitch * Math.sqrt(3);
    for (var r = 0; r < 2; r++) for (var k = 0; k < n; k++) {
      var a = line[Math.max(0, k - 1)], b = line[Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
      var y = r ? y1 : y0; pos.push(line[k][0], y, line[k][1]); nor.push(-dz / l, 0, dx / l); uv.push((s[k] - mid) / pitch, (y - (y0 + y1) / 2) / th);
    }
    for (var j = 0; j < n - 1; j++) idx.push(j, j + 1, n + j + 1, j, n + j + 1, n + j);
    var g = new THREE.BufferGeometry(); g.setIndex(idx); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  }
  function offsetLine(line, d) {   // 바깥쪽으로 d 만큼 띄움 (선은 왼 → 오, 바깥 법선 = (-dz, dx))
    return line.map(function (p, k) { var a = line[Math.max(0, k - 1)], b = line[Math.min(line.length - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [p[0] - dz / l * d, p[1] + dx / l * d]; });
  }
  function dedupe(line) { return line.filter(function (p, i) { return i === 0 || Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]) > 0.05; }); }

  // ---- 부품 ----
  function addNL4(B, M, m4) {   // speakON NL4 섀시 단자(앞면 고정형 단순화): 플랜지 26 × 31, 회색 노즈 링, 코어
    B.add(plateZ(26, 31, 3, 1.6), M.nlBlack, m4);
    B.add(cylZ(11.9, 4.2, 28), M.nlGrey, m4);
    B.add(cylZ(10.6, 4.4, 28), M.hole, m4);
    B.add(cylZ(6.3, 2.2, 20), M.nlGrey, m4);
    B.add(boxZ(5, 1.4, 4.0), M.nlGrey, new THREE.Matrix4().makeTranslation(0, 10, 0).premultiply(m4));
    [[9.5, 12], [-9.5, -12]].forEach(function (p) { B.add(cylZ(1.8, 2.2, 10), M.steel, new THREE.Matrix4().makeTranslation(p[0], p[1], 0).premultiply(m4)); });
  }
  function addScrewTerminal(B, M, m4) {   // 2극 나사 단자(ST)
    B.add(boxZ(14, 30, 6), M.nlBlack, m4);
    [-7, 7].forEach(function (y) { B.add(cylZ(3, 6.6, 12), M.steel, new THREE.Matrix4().makeTranslation(0, y, 0).premultiply(m4)); B.add(boxZ(4.6, 0.8, 6.8), M.hole, new THREE.Matrix4().makeTranslation(0, y, 0).premultiply(m4)); });
  }
  function addM10(B, M, m4) { B.add(cylZ(8, 0.6, 20), M.darkSteel, m4); B.add(cylZ(5, 0.8, 16), M.hole, m4); }
  function addTorx(B, M, m4) { B.add(cylZ(4.2, 1.2, 14), M.darkSteel, m4); B.add(cylZ(1.6, 1.4, 6), M.hole, m4); }

  // 콘 드라이버 (지름 = 바깥 프레임, mm). 로컬 +Z = 앞(소리 나가는 쪽), z=0 = 프레임 앞면
  var CONE_CACHE = {};
  function coneGeos(D) {
    if (CONE_CACHE[D]) return CONE_CACHE[D];
    var R = D / 2, prof = [[R, 0], [R * 0.93, 0], [R * 0.9, 3.2], [R * 0.86, 4.2], [R * 0.82, 2.5], [R * 0.8, 0], [R * 0.55, -R * 0.22], [R * 0.3, -R * 0.36]];
    function lathe(p) { var g = new THREE.LatheGeometry(p.map(function (q) { return new THREE.Vector2(q[0], q[1]); }), 40); g.rotateX(Math.PI / 2); return g; }
    var cone = lathe(prof);
    var cap = new THREE.SphereGeometry(R * 0.3, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.32); cap.rotateX(Math.PI / 2); cap.translate(0, 0, -R * 0.36 - R * 0.3 * Math.cos(Math.PI * 0.32) + 2);
    var rim = new THREE.TorusGeometry(R * 0.965, R * 0.035, 8, 48);
    var basket = new THREE.CylinderGeometry(R * 0.85, R * 0.32, R * 0.5, 20, 1, true); basket.rotateX(-Math.PI / 2); basket.translate(0, 0, -R * 0.3);
    var mag = cylZ(R * 0.36, R * 0.22, 24); mag.translate(0, 0, -R * 0.78);
    return (CONE_CACHE[D] = { cone: cone, cap: cap, rim: rim, basket: basket, mag: mag });
  }
  function hornGeo(mw, mh, tw, th, depth) {   // 사각 CD 혼: 입구 mw × mh (z=0) → 목 tw × th (z=-depth)
    var a = [[-mw / 2, -mh / 2], [mw / 2, -mh / 2], [mw / 2, mh / 2], [-mw / 2, mh / 2]], b = [[-tw / 2, -th / 2], [tw / 2, -th / 2], [tw / 2, th / 2], [-tw / 2, th / 2]], pos = [];
    for (var i = 0; i < 4; i++) { var j = (i + 1) % 4; [[a[i], 0], [a[j], 0], [b[j], -depth], [a[i], 0], [b[j], -depth], [b[i], -depth]].forEach(function (p) { pos.push(p[0][0], p[0][1], p[1]); }); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }

  // 드라이버 배치(사진 비례 · 추정): y = 바닥에서 중심 높이, z = 배플에서 앞면까지 들어간 깊이
  function driverLayout(v, rot) {
    var L = [], sw = function (w, h, maxH) { var r = rot ? [h, w] : [w, h]; if (maxH) r[1] = Math.min(r[1], maxH); return r; };   // 돌리면 세로가 우퍼 사이 틈을 넘지 않게
    if (v === 'Vi10P') {
      L.push({ kind: 'cone', D: 262, y: 150, set: 1, cls: 'LF', label: ['10″ 우퍼', 'LF · 다이폴 아래'] }, { kind: 'cone', D: 262, y: 550, set: 1, cls: 'LF', label: ['10″ 우퍼', 'LF · 다이폴 위'] });
      L.push({ kind: 'cone', D: 210, y: 350, set: 78, cls: 'MF', label: ['8″ 미드', 'MF · 혼 로드'], labelDx: -1 });
      var m = sw(250, 128, 136); L.push({ kind: 'horn', y: 350, mw: m[0], mh: m[1], depth: 76, hf: 1.4, label: ['1.4″ 컴프레션 드라이버', 'CD 혼 ' + (rot ? '40° × 110°' : '110° × 40°') + ' (MF 와 동축)'], labelDx: 1 });
    } else if (v === 'Yi10P' || v === 'Yi7P') {
      L.push({ kind: 'cone', D: 210, y: 125, set: 1, cls: 'LF', label: ['8″ 우퍼', 'LF · 다이폴 아래'] }, { kind: 'cone', D: 210, y: 455, set: 1, cls: 'LF', label: ['8″ 우퍼', 'LF · 다이폴 위'] });
      var mm = sw(v === 'Yi10P' ? 226 : 168, 104, 118), dsp = v === 'Yi10P' ? (rot ? '40° × 110°' : '110° × 40°') : (rot ? '40° × 75°' : '75° × 40°');
      L.push({ kind: 'horn', y: 290, mw: mm[0], mh: mm[1], depth: 96, hf: 1.4, label: ['1.4″ 컴프레션 드라이버', '회전형 CD 혼 ' + dsp] });
    } else if (v === 'E8') {
      L.push({ kind: 'cone', D: 205, y: 195, set: 1, cls: 'LF', label: ['8″ / 1″ 동축 드라이버', '가운데 1″ HF · CD 혼 ' + (rot ? '50° × 90°' : '90° × 50°')], labelDy: -70 });
      var me = sw(84, 50); L.push({ kind: 'horn', y: 195, mw: me[0], mh: me[1], depth: 40, hf: 1.0, small: true, at: 2 });
    } else if (v === 'V-SUB') {
      L.push({ kind: 'cone', D: 460, y: 303, set: 2, cls: 'LF', label: ['18″ 우퍼', '앞 · 베이스 리플렉스'] });
      L.push({ kind: 'cone', D: 310, y: 303, set: 0, rear: true, cls: 'LF', tint: 'MF', label: ['12″ 우퍼(뒤)', '2챔버 밴드패스 → 카디오이드'] });
    }
    return L;
  }

  // ---------------------------------------------------------------------------
  function create(opts) {
    opts = opts || {}; var v = opts.variant || 'Vi10P'; if (VARIANTS.indexOf(v) < 0) throw new Error('[DbSpeakers] 알 수 없는 variant: ' + v);
    opts.variant = v;
    var M = makeMaterials(opts), D = DIM[v], F = variantFeatures(v), half = halfOf(v);
    var root = new THREE.Group(); root.name = 'dbSpeaker.' + v;
    var mm = new THREE.Group(); mm.name = 'dbSpeaker.mm'; mm.scale.setScalar(0.001); root.add(mm);
    var yb = v === 'V-SUB' ? 5 : 0;                      // V-SUB: 아래 받침 5 mm → 몸통 601 + 5 = 공식 높이 606
    var c = new THREE.Group(); c.name = 'dbSpeaker.content'; c.position.set(0, yb, D.depth / 2); mm.add(c);   // 앞면 z=0 → 바닥면 가운데가 원점
    var B = Baker(), H = v === 'V-SUB' ? 601 : D.height, zr = -D.depth;

    // ---- 캐비닛 (높이 띠별로 외곽선이 달라 오목부가 실제로 파임) ----
    B.add(buildCabinet(v, F, H), M.body);
    // 위아래 홈 바닥
    F.holes.forEach(function (h) {
      if (h.floor === undefined) return; var up = h.floor > H / 2;
      B.add(new THREE.PlaneGeometry(h.x1 - h.x0, Math.abs(h.z1 - h.z0)), M.pocket, onFace((h.x0 + h.x1) / 2, h.floor, (h.z0 + h.z1) / 2, 0, up ? 1 : -1, 0));
    });

    // ---- 그릴 (메시 1개, 캔버스 타공 무늬) ----
    var fr = F.front, gLine, pitch = v === 'E8' ? 9 : v === 'V-SUB' ? 7.5 : 7;
    if (fr.wrap) {
      var hp = half.filter(function (p) { return p[1] >= fr.zf; }); hp.push([xAtZ(half, fr.zf), fr.zf]);
      gLine = hp.slice().reverse().map(function (p) { return [-p[0], p[1]]; }).concat(hp.slice(1));
      gLine = offsetLine(dedupe(gLine), 0.6);
    } else if (v === 'E8') {
      var ep = frontPart(half, fr.xmax); ep.push([fr.xmax, zAtX(half, fr.xmax)]);
      gLine = ep.slice().reverse().map(function (p) { return [-p[0], p[1] - 1.2]; }).concat(ep.slice(1).map(function (p) { return [p[0], p[1] - 1.2]; }));
    } else { gLine = [[-fr.xmax, -1], [0, -1], [fr.xmax, -1]]; }
    var grilleMat = M.grille, gt = grilleMat.map;
    var grille = new THREE.Mesh(grilleGeo(gLine, fr.y0, fr.y1, pitch), grilleMat); grille.name = 'dbSpeaker.grille'; c.add(grille);

    // 그릴 고정 Torx 나사 (공식: 윗면 · 아랫면) — E8 은 그릴 앞 위 · 아래 가운데(사진)
    if (fr.wrap) { [-1, 1].forEach(function (sx) { addTorx(B, M, onFace(sx * (D.width / 2 - 34), H - 0.9, -7, 0, 1, 0)); addTorx(B, M, onFace(sx * (D.width / 2 - 34), 0.9, -7, 0, -1, 0)); }); }
    if (v === 'E8') { [372, 18].forEach(function (y) { addTorx(B, M, onFace(0, y, -1.0, 0, 0, 1)); }); }

    // ---- 리깅 M10 인서트 ----
    if (v === 'Vi10P') {
      [-130, -330].forEach(function (z) { addM10(B, M, onFace(0, H - 0.5, z, 0, 1, 0)); addM10(B, M, onFace(0, 0.5, z, 0, -1, 0)); });
      [300, 400].forEach(function (y) { addM10(B, M, onFace(0, y, zr - 0.05, 0, 0, -1)); });
    } else if (v === 'Yi10P' || v === 'Yi7P') {
      [-100, -250].forEach(function (z) { addM10(B, M, onFace(0, H - 0.5, z, 0, 1, 0)); addM10(B, M, onFace(0, 0.5, z, 0, -1, 0)); });
    } else if (v === 'E8') {
      [-1, 1].forEach(function (sx) { addM10(B, M, onFace(sx * 100.05, 195, -115, sx, 0, 0)); });   // 옆 오목부(브래킷 자리)
      [-160, -195].forEach(function (z) { addM10(B, M, onFace(0, H + 0.05, z, 0, 1, 0)); });
      // 윗면 손잡이: 홈 앞쪽 위 덮개(손잡이 다리) 뒤로 손가락 구멍 — 띠 외곽선의 구멍으로 만듦(CAD)
      // 아랫면 35 mm 폴 소켓
      B.add(new THREE.CircleGeometry(17.5, 32), M.hole, onFace(0, 15 - 0.4, -102, 0, -1, 0));
      B.add(new THREE.RingGeometry(17.5, 23, 32), M.darkSteel, onFace(0, 15 - 0.3, -102, 0, -1, 0));
    }

    // ---- 뒷면 오목부: 단자판 · 덮개판 ----
    F.rear.forEach(function (r) {
      var w = r.x1 - r.x0, h = r.y1 - r.y0, cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2, zf = zr + r.d;
      if (r.panel === 'mount') { B.add(new THREE.PlaneGeometry(w, h), M.pocket, onFace(cx, cy, zf - 0.2, 0, 0, -1)); addM10(B, M, onFace(cx, cy, zf - 0.3, 0, 0, -1)); return; }
      var pw = w - 3, ph = h - 3, pt = 1.5, base = onFace(cx, cy, zf, 0, 0, -1);
      B.add(plateZ(pw, ph, 3, pt), r.panel === 'conn' ? M.panel : M.cover, base);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { addTorx(B, M, new THREE.Matrix4().makeTranslation(s[0] * (pw / 2 - 5), s[1] * (ph / 2 - 5), pt).premultiply(base)); });
      var land = w > h, lay = [];
      if (r.panel === 'conn') {
        if (v === 'Vi10P') lay = [['nl4', 0, 26], ['nl4', 0, -12], ['st', 0, -42]];
        else if (land) lay = [['nl4', -32, -2], ['st', 0, -2], ['nl4', 32, -2]];
        else lay = [['nl4', 0, 22], ['nl4', 0, -20]];
        lay.forEach(function (L) { var m4 = new THREE.Matrix4().makeTranslation(L[1], L[2], pt).premultiply(base); if (L[0] === 'nl4') addNL4(B, M, m4); else addScrewTerminal(B, M, m4); });
      }
      var pr = new THREE.Mesh(new THREE.PlaneGeometry(pw - 2, ph - 2), new THREE.MeshStandardMaterial({ map: panelPrint(v, pw - 2, ph - 2, r.panel, land, r.panel === 'cover' && M.white ? '#8f8e88' : null), transparent: true, alphaTest: 0.05, depthWrite: false, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      pr.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, pt + 0.05).premultiply(base)); pr.name = 'dbSpeaker.panelPrint.' + r.panel; c.add(pr);
    });

    // ---- V-SUB 전용: 손잡이 · 리깅 · 바퀴 · 받침 · 윗면 플랜지 ----
    if (v === 'V-SUB') {
      F.side.forEach(function (s) {   // 옆 손잡이 홈 가운데 세로 손잡이 막대(CAD)
        var zc = (s.z0 + s.z1) / 2, hh = s.y1 - s.y0;
        [-1, 1].forEach(function (sx) {
          B.add(new THREE.PlaneGeometry(Math.abs(s.z1 - s.z0), hh), M.pocket, onFace(sx * (s.x + 0.2), (s.y0 + s.y1) / 2, zc, sx, 0, 0));
          var bar = new THREE.CylinderGeometry(11, 11, hh - 8, 16); B.add(bar, M.rubber, new THREE.Matrix4().makeTranslation(sx * 338, (s.y0 + s.y1) / 2, zc));
        });
      });
      // 앞 좌우 리깅 링크(옆 띠 안, 위쪽) · 링크 홈
      [-1, 1].forEach(function (sx) {
        B.add(new THREE.BoxGeometry(14, 160, 8), M.hole, new THREE.Matrix4().makeTranslation(sx * 314, 520, -3.5));
        B.add(new THREE.BoxGeometry(10, 120, 8), M.darkSteel, new THREE.Matrix4().makeTranslation(sx * 314, 540, -2.5));
        B.add(cylZ(5, 1.2, 14), M.steel, onFace(sx * 314, 494, 0.3, 0, 0, 1));
        B.add(new THREE.BoxGeometry(14, 120, 8), M.hole, new THREE.Matrix4().makeTranslation(sx * 314, 80, -3.5));
      });
      // 뒤 가운데 리깅 홈 안 강철 스트랩(이중 판, CAD)
      [-14, 14].forEach(function (x) { B.add(new THREE.BoxGeometry(12, H - 2, 39), M.darkSteel, new THREE.Matrix4().makeTranslation(x, H / 2, -687.5)); });
      B.add(new THREE.BoxGeometry(90, H - 2, 6), M.darkSteel, new THREE.Matrix4().makeTranslation(0, H / 2, -663 - 3));
      [120, 300, 480].forEach(function (y) { B.add(cylZ(6, 41, 16), M.steel, onFace(-20, y, -687.5, 1, 0, 0)); });
      // 뒷면 바퀴 4개 (CAD: x ±275, 높이 40 · 495, 바퀴 Ø80)
      var wg = new THREE.CylinderGeometry(40, 40, 28, 24), hub = new THREE.CylinderGeometry(14, 14, 30, 16); wg.rotateZ(Math.PI / 2); hub.rotateZ(Math.PI / 2);
      [[-1, 40], [1, 40], [-1, 495], [1, 495]].forEach(function (p) {   // 바닥에서 높이 → content 좌표(받침 yb 만큼 뺌)
        var x = p[0] * 275, y = p[1] - yb;
        B.add(new THREE.BoxGeometry(104, 80, 3), M.darkSteel, new THREE.Matrix4().makeTranslation(x, y, zr - 1.5));
        [-17, 17].forEach(function (dx) { B.add(new THREE.BoxGeometry(5, 60, 58), M.darkSteel, new THREE.Matrix4().makeTranslation(x + dx, y, zr - 29)); });
        B.add(wg, M.wheel, new THREE.Matrix4().makeTranslation(x, y, zr - 64));
        B.add(hub, M.steel, new THREE.Matrix4().makeTranslation(x, y, zr - 64));
      });
      // 바닥 받침(쌓기용 스키드, 추정) 5 mm · 윗면 짝 홈
      [-1, 1].forEach(function (sx) {
        [[-150, 220], [-560, 220]].forEach(function (q) { var g = new THREE.BoxGeometry(110, yb, q[1]); g.translate(0, -yb / 2, 0); B.add(g, M.rubber, new THREE.Matrix4().makeTranslation(sx * 230, 0, q[0])); });
      });
      B.add(new THREE.CircleGeometry(24, 32), M.hole, onFace(0, 591.4, -239, 0, 1, 0));            // 윗면 홈 안 M20 플랜지(추정)
      B.add(new THREE.RingGeometry(24, 36, 32), M.darkSteel, onFace(0, 591.3, -239, 0, 1, 0));
    }

    var baked = B.build(c, 'dbSpeaker.static');

    // ---- 드라이버(엑스레이) ----
    // 엑스레이가 꺼져 있을 때는 장면 그래프에서 빼 둠(바운딩 박스 · 그리기 호출에 안 들어가게)
    var drv = new THREE.Group(); drv.name = 'dbSpeaker.drivers';
    var labels = new THREE.Group(); labels.name = 'dbSpeaker.labels';
    var drivers = [], zb = fr.zf, rot = opts.hornRotation === 90;
    driverLayout(v, rot).forEach(function (d, k) {
      var g = new THREE.Group(); g.name = 'dbSpeaker.driver.' + k;
      if (d.kind === 'cone') {
        var tn = d.tint || d.cls, G = coneGeos(d.D), mc = tn === 'MF' ? M.coneMF : M.coneLF, mr = tn === 'MF' ? M.rimMF : M.rimLF;
        [[G.cone, mc], [G.cap, M.dustCap], [G.rim, mr], [G.basket, M.magnet], [G.mag, M.magnet]].forEach(function (p) { g.add(new THREE.Mesh(p[0], p[1])); });
        if (d.rear) { g.rotation.y = Math.PI; g.position.set(0, d.y, -D.depth * 0.55); }
        else g.position.set(0, d.y, zb - d.set);
      } else {
        var hm = new THREE.Mesh(hornGeo(d.mw, d.mh, d.small ? 22 : 40, d.small ? 22 : 40, d.depth), M.horn); g.add(hm);
        var dr = new THREE.Mesh(cylZ(d.small ? 26 : 52, d.small ? 24 : 56, 28), M.hfDriver); dr.position.z = -d.depth - (d.small ? 24 : 56); g.add(dr);
        var ring = new THREE.Mesh(new THREE.TorusGeometry(d.small ? 12 : 19, 2.5, 8, 28), M.hfDriver); ring.position.z = -d.depth; g.add(ring);
        g.position.set(0, d.y, zb - (d.at || 0));
      }
      drv.add(g);
      drivers.push({ kind: d.kind, cls: d.cls || 'HF', sizeInch: d.kind === 'cone' ? { 460: 18, 310: 12, 262: 10, 210: 8, 205: 8 }[d.D] : d.hf, y: d.y, label: d.label, object: g });
      if (d.label) {
        var col = d.kind === 'horn' ? '#38bdf8' : (d.tint || d.cls) === 'MF' ? '#22c55e' : '#f59e0b';
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex(d.label, col), depthTest: false, depthWrite: false, transparent: true }));
        var sc = v === 'V-SUB' ? 1.25 : v === 'E8' ? 0.62 : 0.78; sp.scale.set(256 * sc, 80 * sc, 1); sp.renderOrder = 10;
        var lx = (d.labelDx || 0) * D.width * 0.62, ly = d.y + (d.labelDy || 0) + (d.labelDx ? (d.labelDx < 0 ? 60 : -60) : 0);
        sp.position.set(lx, ly, d.rear ? -D.depth * 0.55 + 30 : 40); sp.name = 'dbSpeaker.label.' + k; labels.add(sp);
      }
    });

    // ---- 엑스레이 전환 ----
    var bodyMats = [M.body, M.pocket, M.cover];
    function setXray(on) {
      on = !!on;
      grilleMat.transparent = on; grilleMat.opacity = on ? 0.16 : 1; grilleMat.depthWrite = !on; grilleMat.needsUpdate = true;
      bodyMats.forEach(function (m) { m.transparent = on; m.opacity = on ? 0.3 : 1; m.depthWrite = !on; m.needsUpdate = true; });
      if (on) { c.add(drv); if (opts.labels !== false) c.add(labels); else c.remove(labels); } else { c.remove(drv); c.remove(labels); }
      state.xray = on;
    }
    var state = { xray: false };
    setXray(!!opts.xray);

    var api = { variant: v, dimensionsMM: DIM[v], spec: SPECS[v], drivers: drivers, setXray: setXray, isXray: function () { return state.xray; },
      setLabels: function (on) { opts.labels = !!on; if (state.xray && on) c.add(labels); else c.remove(labels); },
      meshCount: function () { var n = 0; root.traverse(function (o) { if (o.isMesh || o.isSprite) n++; }); return n; },
      driversGroup: drv, labelsGroup: labels };
    Object.defineProperty(root.userData, 'dbSpeakers', { value: api, enumerable: false });
    root.userData.info = { model: 'd&b audiotechnik ' + v, type: 'passive', dimensionsMM: DIM[v], units: 'm' };
    return root;
  }

  global.DbSpeakers = { VARIANTS: VARIANTS, DIMENSIONS_MM: DIM, SPECS: SPECS, RECOMMENDED_DIR: RECOMMENDED_DIR, create: create,
    api: function (root) { return root && root.userData.dbSpeakers; } };
})(typeof window !== 'undefined' ? window : this);
