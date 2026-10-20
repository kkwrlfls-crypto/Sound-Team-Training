/*
 * 음향 트러블슈팅 — 진단 엔진 (Sound-Team-Training)
 *  - 화면·3D 와 분리된 순수 계산 모듈: 브라우저(window.PaTsEngine)와 Node(module.exports) 모두에서 동작
 *  - 시스템 상태(장비 조작값 + 케이블 연결)에서 전원·신호 레벨(dBu, 근사 모델)을 계산하고,
 *    검사 결과·증거·복구 조작·정상 판정을 모두 그 계산값에서 만든다. (미션별 고정 정답 문구를 출력하지 않음)
 *  - 실제 음향 신호 처리나 전기 동작을 하지 않는 교육용 시뮬레이션이다.
 */
(function (root) {
  'use strict';
  var NEG = -Infinity;

  // ---------------------------------------------------------------------------
  // 장비 종류: 단자 [id, 이름, 종류]
  var TYPES = {
    sm58: { name: 'SM58S 마이크', ports: [['xlrOut', 'XLR 출력', 'xlr-out']] },
    mg12xu: { name: 'Yamaha MG12XU 믹서', ports: [['in1', 'CH1 입력', 'xlr-in'], ['in2', 'CH2 입력', 'xlr-in'], ['in3', 'CH3 입력', 'xlr-in'], ['in4', 'CH4 입력', 'xlr-in'],
      ['mic5', 'CH5/6 MIC 입력', 'xlr-in'], ['mic7', 'CH7/8 MIC 입력', 'xlr-in'], ['stereoOutXlrL', 'STEREO OUT L', 'xlr-out'], ['stereoOutXlrR', 'STEREO OUT R', 'xlr-out'], ['acIn', '전원 입력', 'iec']], powerPort: 'acIn' },
    zxa1: { name: 'EV ZXA1 액티브 스피커', ports: [['micIn', 'MIC IN', 'xlr-in'], ['lineIn', 'LINE IN', 'xlr-in'], ['masterOut', 'MASTER OUT', 'xlr-out'], ['mainsIn', '전원 입력', 'iec']], powerPort: 'mainsIn' },
    crown: { name: 'Crown XLi1500 파워앰프', ports: [['inputXlrCh1', 'CH1 입력', 'xlr-in'], ['inputXlrCh2', 'CH2 입력', 'xlr-in'], ['outputSpeakonCh1', 'CH1 스피커 출력', 'speakon'],
      ['outputSpeakonCh2', 'CH2 스피커 출력', 'speakon'], ['powerInlet', '전원 입력', 'iec']], powerPort: 'powerInlet' },
    zx1: { name: 'EV ZX1 패시브 스피커', ports: [['speakonA', 'speakON 입력 1', 'speakon'], ['speakonB', 'speakON 입력 2 (병렬)', 'speakon']] },
    outlet: { name: '벽 콘센트', ports: [['socketUpper', '위 구', 'socket'], ['socketLower', '아래 구', 'socket']] }
  };
  var CABLE_TYPES = { xlr: 'XLR 케이블', speakon: '스피커 케이블 (speakON)', ac: '전원 케이블' };
  var MG_CH = { in1: 'ch1', in2: 'ch2', in3: 'ch3', in4: 'ch4', mic5: 'ch56', mic7: 'ch78' };
  var CH_LABEL = { ch1: 'CH1', ch2: 'CH2', ch3: 'CH3', ch4: 'CH4', ch56: 'CH5/6', ch78: 'CH7/8' };
  var CH_IDS = ['ch1', 'ch2', 'ch3', 'ch4', 'ch56', 'ch78'];

  // 레벨 모델 (근사, 3D 실습과 같은 값)
  var SRC = -50, PEAK = 8, SENS = { zxa1: 4, crown: 5.1 };
  function gainDb(v) { return 6 + 54 * v; }
  function faderDb(v) { return v < 0.02 ? NEG : 40 * (v - 0.75); }
  function attDb(v) { return v < 0.02 ? NEG : 40 * (v - 1); }
  function zxMicDb(v) { return v < 0.02 ? NEG : 10 + 50 * v; }
  function panDb(p, side) { var a = Math.max(0, Math.min(1, p)) * Math.PI / 2, g = side === 'L' ? Math.cos(a) : Math.sin(a); return g < 1e-4 ? NEG : 20 * Math.log10(g * Math.SQRT2); }
  function dbSum(a, b) { if (a === NEG) return b; if (b === NEG) return a; return 10 * Math.log10(Math.pow(10, a / 10) + Math.pow(10, b / 10)); }
  function grade(R) { return R === NEG || R < -40 ? 'silent' : R > 3 ? 'clip' : R >= -14 ? 'good' : R >= -26 ? 'low' : 'faint'; }
  var GRADE_TEXT = { good: '알맞은 크기', low: '작음', faint: '거의 들리지 않음', clip: '찌그러짐(과입력)', silent: '소리 없음' };
  function dbTxt(x) { return x === NEG ? '−∞' : (x > 0 ? '+' : '') + x.toFixed(1); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function portDef(type, port) { var l = (TYPES[type] || {}).ports || []; for (var i = 0; i < l.length; i++) if (l[i][0] === port) return l[i]; return null; }

  // ---------------------------------------------------------------------------
  // 기본 장비 상태
  function defaultDevice(type) {
    if (type === 'sm58') return { type: type, switch: true };
    if (type === 'mg12xu') { var ch = {}; CH_IDS.forEach(function (c) { ch[c] = { gain: 0.35, fader: 0, on: true, pan: 0.5, st: true }; }); return { type: type, power: true, ch: ch, stFader: 0.75 }; }
    if (type === 'zxa1') return { type: type, power: true, master: 0.9, mic: 0 };
    if (type === 'crown') return { type: type, power: true, att: { 1: 0.95, 2: 0.95 } };
    if (type === 'outlet') return { type: type, live: true };
    return { type: type };
  }

  // ---------------------------------------------------------------------------
  // 계산: 전원 → 신호 (출력 단자 레벨을 몇 번 돌려 수렴)
  function evaluate(sys, st) {
    var D = st.devices, out = {}, inn = {}, notes = [], links = [], mains = {}, power = {};
    function dev(id) { return D[id]; }
    // 전원
    st.cables.forEach(function (c) {
      if (c.type !== 'ac' || !c.a.seated || !c.b.seated) return;
      var eq = [c.a, c.b].filter(function (e) { return dev(e.dev) && TYPES[dev(e.dev).type].powerPort === e.port; })[0], so = [c.a, c.b].filter(function (e) { return dev(e.dev) && dev(e.dev).type === 'outlet'; })[0];
      if (eq && so && dev(so.dev).live) mains[eq.dev] = true;
    });
    Object.keys(D).forEach(function (id) { if (TYPES[D[id].type].powerPort) power[id] = !!mains[id] && !!D[id].power; });
    // 신호 링크 (양 끝이 꽂혀 있고 케이블 종류가 단자와 맞을 때만)
    st.cables.forEach(function (c) {
      if (c.type === 'ac') return;
      var ka = kindOf(c.a), kb = kindOf(c.b), compat = cableFits(c.type, ka, kb);
      links.push({ cable: c.id, ok: c.a.seated && c.b.seated && compat, compat: compat, a: c.a, b: c.b });
    });
    function kindOf(e) { var d = dev(e.dev), p = d && portDef(d.type, e.port); return p ? p[2] : null; }
    var mg = {}, amp = {}, spk = {};
    for (var pass = 0; pass < 6; pass++) {
      // 링크로 입력 단자 채우기
      inn = {};
      links.forEach(function (l) { if (!l.ok) return; var A = l.a.dev + '.' + l.a.port, B = l.b.dev + '.' + l.b.port;
        if (out[A] !== undefined) inn[B] = dbSum(inn[B] === undefined ? NEG : inn[B], out[A]); if (out[B] !== undefined) inn[A] = dbSum(inn[A] === undefined ? NEG : inn[A], out[B]); });
      out = {};
      Object.keys(D).forEach(function (id) {
        var d = D[id], t = d.type, I = function (p) { var v = inn[id + '.' + p]; return v === undefined ? NEG : v; }, has = function (p) { return inn[id + '.' + p] !== undefined; };
        if (t === 'sm58') out[id + '.xlrOut'] = d.switch ? SRC : NEG;
        else if (t === 'mg12xu') {
          var L = NEG, R = NEG, chs = {};
          Object.keys(MG_CH).forEach(function (p) { var c = MG_CH[p], s = d.ch[c]; if (!s) return;
            var inLv = I(p), pre = power[id] ? inLv + gainDb(s.gain) : NEG, post = s.on ? pre + faderDb(s.fader) : NEG;
            chs[c] = { port: p, cabled: has(p), input: inLv, pre: pre, post: post, peak: pre > PEAK };
            if (s.st && post !== NEG) { var pv = pre > PEAK ? Math.max(post, 25) : post; L = dbSum(L, pv + panDb(s.pan, 'L')); R = dbSum(R, pv + panDb(s.pan, 'R')); } });
          var sf = faderDb(d.stFader); L = power[id] ? L + sf : NEG; R = power[id] ? R + sf : NEG; if (L !== NEG && isNaN(L)) L = NEG; if (R !== NEG && isNaN(R)) R = NEG;
          out[id + '.stereoOutXlrL'] = L; out[id + '.stereoOutXlrR'] = R; mg[id] = { ch: chs, L: L, R: R };
        } else if (t === 'zxa1') {
          var micIn = I('micIn'), lineIn = I('lineIn'), Rz = NEG, src = null;
          if (power[id]) { var rm = micIn + zxMicDb(d.mic) + attDb(d.master) - SENS.zxa1, rl = lineIn + attDb(d.master) - SENS.zxa1; Rz = dbSum(isNaN(rm) ? NEG : rm, isNaN(rl) ? NEG : rl); }
          if (Rz !== NEG && isNaN(Rz)) Rz = NEG;
          spk[id] = { R: Rz, inputs: { micIn: has('micIn') ? micIn : null, lineIn: has('lineIn') ? lineIn : null }, powered: !!power[id] };
          out[id + '.masterOut'] = power[id] ? dbSum(micIn + zxMicDb(d.mic), lineIn) : NEG;
        } else if (t === 'crown') {
          var a = { in: {}, out: {} };
          [1, 2].forEach(function (n) { var x = I('inputXlrCh' + n); a.in[n] = x; var o = power[id] ? x - SENS.crown + attDb(d.att[n]) : NEG; if (isNaN(o)) o = NEG; a.out[n] = o; out[id + '.outputSpeakonCh' + n] = o; });
          amp[id] = a;
        } else if (t === 'zx1') {
          var Rp = dbSum(I('speakonA'), I('speakonB'));
          spk[id] = { R: Rp, inputs: { speakonA: has('speakonA') ? I('speakonA') : null, speakonB: has('speakonB') ? I('speakonB') : null }, powered: null, passive: true };
        }
      });
    }
    var speakers = {}; Object.keys(spk).forEach(function (id) { var s = spk[id]; speakers[id] = { R: s.R, grade: grade(s.R), inputs: s.inputs, powered: s.powered, passive: !!s.passive }; });
    return { mains: mains, power: power, links: links, inLevels: inn, outLevels: out, mixer: mg, amp: amp, speakers: speakers, notes: notes };
  }
  function cableFits(type, ka, kb) {
    if (type === 'xlr') return (ka === 'xlr-out' && kb === 'xlr-in') || (ka === 'xlr-in' && kb === 'xlr-out');
    if (type === 'speakon') return ka === 'speakon' && kb === 'speakon';
    if (type === 'ac') return (ka === 'iec' && kb === 'socket') || (ka === 'socket' && kb === 'iec');
    return false;
  }

  // ---------------------------------------------------------------------------
  // 상태 경로 읽기/쓰기 ('dev.field' / 'dev.ch.ch1.on' / 'dev.att.1' / 'cable.c1.a.seated' / 'cable.c1.a.port')
  function getPath(st, path) { var p = path.split('.'); if (p[0] === 'cable') { var c = cableById(st, p[1]); return c ? c[p[2]][p[3]] : undefined; }
    var o = st.devices; for (var i = 0; i < p.length; i++) { if (o == null) return undefined; o = o[p[i]]; } return o; }
  function setPath(st, path, v) { var p = path.split('.'); if (p[0] === 'cable') { var c = cableById(st, p[1]); if (c) c[p[2]][p[3]] = v; return; }
    var o = st.devices; for (var i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = v; }
  function cableById(st, id) { for (var i = 0; i < st.cables.length; i++) if (st.cables[i].id === id) return st.cables[i]; return null; }
  function cableAt(st, dev, port) { for (var i = 0; i < st.cables.length; i++) { var c = st.cables[i]; if ((c.a.dev === dev && c.a.port === port && c.a.seated) || (c.b.dev === dev && c.b.port === port && c.b.seated)) return c; } return null; }

  // ---------------------------------------------------------------------------
  // 미션 데이터
  function buildNormal(m) {
    var st = { devices: {}, cables: clone(m.cables) };
    Object.keys(m.devices).forEach(function (id) { var d = defaultDevice(m.devices[id].type); var o = m.devices[id].state || {}; deepAssign(d, o); st.devices[id] = d; });
    st.cables.forEach(function (c) { c.a.seated = c.a.seated !== false; c.b.seated = c.b.seated !== false; });
    return st;
  }
  function deepAssign(t, s) { Object.keys(s).forEach(function (k) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) { if (!t[k]) t[k] = {}; deepAssign(t[k], s[k]); } else t[k] = s[k]; }); }
  var MG_NORMAL = { ch: { ch1: { gain: 0.75, fader: 0.75 } }, stFader: 0.75 };
  var MISSIONS = [
    { id: 'A', level: '초급', title: '마이크 소리가 나오지 않음', chain: '마이크 → MG12XU → ZXA1 액티브 스피커',
      symptom: '예배 전 점검 중입니다. 단상 마이크(SM58S)에 말을 해도 스피커에서 아무 소리가 나지 않습니다. 다른 이상은 아직 확인하지 않았습니다.',
      devices: { mic: { type: 'sm58', name: '단상 마이크' }, mg: { type: 'mg12xu', name: 'MG12XU 믹서', state: MG_NORMAL }, spk: { type: 'zxa1', name: 'ZXA1 스피커' },
        outA: { type: 'outlet', name: '콘센트 A' }, outB: { type: 'outlet', name: '콘센트 B' } },
      cables: [{ id: 'cMic', type: 'xlr', label: '마이크 XLR 케이블', a: { dev: 'mic', port: 'xlrOut' }, b: { dev: 'mg', port: 'in1' } },
        { id: 'cOut', type: 'xlr', label: '믹서 → 스피커 XLR 케이블', a: { dev: 'mg', port: 'stereoOutXlrL' }, b: { dev: 'spk', port: 'lineIn' } },
        { id: 'pMg', type: 'ac', label: '믹서 전원 케이블', a: { dev: 'mg', port: 'acIn' }, b: { dev: 'outB', port: 'socketUpper' } },
        { id: 'pSpk', type: 'ac', label: '스피커 전원 케이블', a: { dev: 'spk', port: 'mainsIn' }, b: { dev: 'outA', port: 'socketUpper' } }],
      targets: ['spk'], tools: ['mic.switch', 'mg.power', 'mg.inputMeter', 'mg.channel', 'mg.outputMeter', 'spk.status', 'spk.input', 'cable.ends'],
      flow: [['mic', 'cMic', 'mg', 'cOut', 'spk']],
      learn: '소리가 안 날 때는 신호가 지나가는 순서(마이크 → 케이블 → 믹서 입력 → 채널 → 출력 → 케이블 → 스피커)를 따라 각 지점에서 신호가 있는지 확인합니다. 신호가 있는 마지막 지점과 없는 첫 지점 사이에 원인이 있습니다.',
      scenarios: [
        { id: 'A-1', fault: [{ path: 'spk.power', value: false }], fixPaths: ['spk.power'], rootEvidence: ['spk.powerSwitchOff'],
          cause: 'ZXA1 스피커 뒷면 전원 스위치가 꺼져 있었습니다.', fix: 'ZXA1 전원 스위치를 켰습니다.',
          hints: ['신호는 믹서까지 정상으로 지나가고 있을까요? 믹서 출력 미터부터 확인해 보세요.', '믹서 출력이 정상이면 문제는 스피커 쪽입니다. 액티브 스피커가 동작하려면 무엇이 필요할까요?', 'ZXA1 의 "전원·상태" 검사로 전원 LED 와 전원 스위치 위치를 확인하세요.'] },
        { id: 'A-2', fault: [{ path: 'mg.ch.ch1.on', value: false }], fixPaths: ['mg.ch.ch1.on'], rootEvidence: ['mg.ch1.off'],
          cause: 'MG12XU CH1 의 ON 버튼이 꺼져(채널 음소거) 있었습니다.', fix: 'CH1 ON 버튼을 켰습니다.',
          hints: ['마이크 신호가 믹서 입력까지는 들어오는지 먼저 확인해 보세요.', '입력 미터에는 신호가 있는데 출력 미터가 0 이라면, 채널 안에서 신호가 막힌 것입니다.', '"채널 상태" 검사에서 CH1 의 ON 버튼·페이더·ST 버튼을 확인하세요.'] },
        { id: 'A-3', fault: [{ path: 'cable.cMic.b.seated', value: false }], fixPaths: ['cable.cMic.b.seated'], rootEvidence: ['cable.cMic.bUnplugged'],
          cause: '마이크 XLR 케이블의 믹서 쪽 끝이 CH1 입력에서 빠져 있었습니다.', fix: '마이크 케이블을 MG12XU CH1 입력에 다시 꽂았습니다.',
          hints: ['믹서 입력 미터에 마이크 신호가 들어오고 있나요?', '입력 미터가 0 이면 신호가 믹서에 도착하지 못한 것입니다. 마이크와 믹서 사이를 확인하세요.', '"케이블 양 끝" 검사로 마이크 케이블의 양쪽 끝이 제대로 꽂혀 있는지 확인하세요.'] }
      ] },
    { id: 'B', level: '초급', title: '스피커 한쪽만 출력되지 않음', chain: '마이크 → MG12XU STEREO OUT L/R → ZXA1 좌·우',
      symptom: '좌우 스피커 중 왼쪽 스피커에서만 소리가 나고, 오른쪽 스피커는 조용합니다.',
      devices: { mic: { type: 'sm58', name: '단상 마이크' }, mg: { type: 'mg12xu', name: 'MG12XU 믹서', state: MG_NORMAL }, spkL: { type: 'zxa1', name: 'ZXA1 왼쪽' }, spkR: { type: 'zxa1', name: 'ZXA1 오른쪽' },
        outA: { type: 'outlet', name: '콘센트 A' }, outB: { type: 'outlet', name: '콘센트 B' }, outC: { type: 'outlet', name: '콘센트 C' } },
      cables: [{ id: 'cMic', type: 'xlr', label: '마이크 XLR 케이블', a: { dev: 'mic', port: 'xlrOut' }, b: { dev: 'mg', port: 'in1' } },
        { id: 'cL', type: 'xlr', label: '왼쪽 스피커 XLR 케이블', a: { dev: 'mg', port: 'stereoOutXlrL' }, b: { dev: 'spkL', port: 'lineIn' } },
        { id: 'cR', type: 'xlr', label: '오른쪽 스피커 XLR 케이블', a: { dev: 'mg', port: 'stereoOutXlrR' }, b: { dev: 'spkR', port: 'lineIn' } },
        { id: 'pMg', type: 'ac', label: '믹서 전원 케이블', a: { dev: 'mg', port: 'acIn' }, b: { dev: 'outB', port: 'socketUpper' } },
        { id: 'pL', type: 'ac', label: '왼쪽 스피커 전원 케이블', a: { dev: 'spkL', port: 'mainsIn' }, b: { dev: 'outA', port: 'socketUpper' } },
        { id: 'pR', type: 'ac', label: '오른쪽 스피커 전원 케이블', a: { dev: 'spkR', port: 'mainsIn' }, b: { dev: 'outC', port: 'socketUpper' } }],
      targets: ['spkL', 'spkR'], balance: true, tools: ['mic.switch', 'mg.power', 'mg.inputMeter', 'mg.channel', 'mg.outputMeter', 'spk.status', 'spk.input', 'cable.ends'],
      flow: [['mic', 'cMic', 'mg', 'cL', 'spkL'], ['mg', 'cR', 'spkR']],
      learn: '한쪽만 안 나올 때는 좌우를 비교하는 것이 가장 빠릅니다. 출력 미터 L/R 이 같은지 → 케이블 L/R 이 같은지 → 스피커 L/R 상태가 같은지 차례로 비교하면 다른 지점이 원인입니다.',
      scenarios: [
        { id: 'B-1', fault: [{ path: 'cable.cR.b.seated', value: false }], fixPaths: ['cable.cR.b.seated'], rootEvidence: ['cable.cR.bUnplugged'],
          cause: '오른쪽 스피커 XLR 케이블이 스피커 LINE IN 에서 빠져 있었습니다.', fix: '오른쪽 케이블을 ZXA1 오른쪽 LINE IN 에 다시 꽂았습니다.',
          hints: ['믹서 출력 미터의 L 과 R 이 똑같이 움직이나요?', '믹서 L/R 출력이 같다면 오른쪽 경로(케이블·스피커)에서 왼쪽과 다른 점을 찾으세요.', '오른쪽 스피커 XLR 케이블의 "케이블 양 끝" 검사를 해 보세요.'] },
        { id: 'B-2', fault: [{ path: 'spkR.power', value: false }], fixPaths: ['spkR.power'], rootEvidence: ['spkR.powerSwitchOff'],
          cause: '오른쪽 ZXA1 의 전원 스위치가 꺼져 있었습니다.', fix: '오른쪽 ZXA1 전원 스위치를 켰습니다.',
          hints: ['믹서 출력 미터의 L 과 R 이 똑같이 움직이나요?', '오른쪽 스피커까지 신호는 도착하는데 소리가 없다면 스피커 자체 상태를 보세요.', '왼쪽과 오른쪽 ZXA1 의 "전원·상태" 검사 결과를 비교하세요.'] },
        { id: 'B-3', fault: [{ path: 'mg.ch.ch1.pan', value: 0 }], fixPaths: ['mg.ch.ch1.pan'], rootEvidence: ['mg.ch1.panHardL'],
          cause: 'MG12XU CH1 의 PAN 이 왼쪽 끝으로 돌아가 있어서 마이크 소리가 왼쪽 출력으로만 나갔습니다.', fix: 'CH1 PAN 을 가운데로 돌렸습니다.',
          hints: ['믹서 출력 미터의 L 과 R 이 똑같이 움직이나요?', 'R 출력에만 신호가 없다면 케이블·스피커보다 앞, 믹서 안에서 좌우가 나뉘는 곳을 보세요.', '"채널 상태" 검사에서 CH1 의 PAN 위치를 확인하세요.'] }
      ] },
    { id: 'C', level: '초급', title: '패시브 스피커에서 소리가 나오지 않음', chain: '마이크 → MG12XU → Crown XLi1500 → ZX1 패시브 스피커',
      symptom: '패시브 스피커(ZX1)에서 소리가 나지 않습니다. 믹서 쪽 담당자는 "믹서에서는 신호가 보인다"고 합니다.',
      devices: { mic: { type: 'sm58', name: '단상 마이크' }, mg: { type: 'mg12xu', name: 'MG12XU 믹서', state: MG_NORMAL }, amp: { type: 'crown', name: 'Crown XLi1500 앰프' }, pas: { type: 'zx1', name: 'ZX1 패시브 스피커' },
        outA: { type: 'outlet', name: '콘센트 A' }, outB: { type: 'outlet', name: '콘센트 B' } },
      cables: [{ id: 'cMic', type: 'xlr', label: '마이크 XLR 케이블', a: { dev: 'mic', port: 'xlrOut' }, b: { dev: 'mg', port: 'in1' } },
        { id: 'cAmp', type: 'xlr', label: '믹서 → 앰프 XLR 케이블', a: { dev: 'mg', port: 'stereoOutXlrL' }, b: { dev: 'amp', port: 'inputXlrCh1' } },
        { id: 'cSpk', type: 'speakon', label: '앰프 → 스피커 speakON 케이블', a: { dev: 'amp', port: 'outputSpeakonCh1' }, b: { dev: 'pas', port: 'speakonA' } },
        { id: 'pMg', type: 'ac', label: '믹서 전원 케이블', a: { dev: 'mg', port: 'acIn' }, b: { dev: 'outB', port: 'socketUpper' } },
        { id: 'pAmp', type: 'ac', label: '앰프 전원 케이블', a: { dev: 'amp', port: 'powerInlet' }, b: { dev: 'outB', port: 'socketLower' } }],
      targets: ['pas'], tools: ['mic.switch', 'mg.power', 'mg.outputMeter', 'amp.input', 'amp.status', 'amp.outputs', 'pas.input', 'cable.ends', 'cable.compat'],
      flow: [['mic', 'cMic', 'mg', 'cAmp', 'amp', 'cSpk', 'pas']],
      learn: '패시브 스피커는 전원이 없고 앰프 출력으로만 소리가 납니다. 앰프에서 확인할 것은 입력 신호(SIGNAL LED) → 전원 → 감쇠기(볼륨) → 신호가 나오는 출력 채널과 스피커 케이블이 꽂힌 채널이 같은지입니다.',
      scenarios: [
        { id: 'C-1', fault: [{ path: 'amp.power', value: false }], fixPaths: ['amp.power'], rootEvidence: ['amp.powerSwitchOff'],
          cause: 'Crown 앰프의 앞면 전원 스위치가 꺼져 있었습니다.', fix: '앰프 전원 스위치를 켰습니다.',
          hints: ['믹서 출력에서 앰프 입력까지 신호가 도착하는지 확인하세요.', '앰프 입력에 신호가 있는데 스피커가 조용하다면 앰프 자체 상태를 확인하세요.', '앰프 "상태" 검사로 전원 LED 와 전원 스위치를 확인하세요.'] },
        { id: 'C-2', fault: [{ path: 'amp.att.1', value: 0 }], fixPaths: ['amp.att.1'], rootEvidence: ['amp.att1Down'],
          cause: 'Crown 앰프 CH1 감쇠기(볼륨)가 끝까지 내려가 있었습니다.', fix: 'CH1 감쇠기를 올렸습니다.',
          hints: ['앰프에 전원이 들어와 있고 입력 신호도 있나요?', '전원과 입력이 정상인데 출력이 없다면 앰프 앞면의 조절부를 확인하세요.', '앰프 "상태" 검사에서 CH1 감쇠기 위치를 확인하세요.'] },
        { id: 'C-3', fault: [{ path: 'cable.cSpk.a.port', value: 'outputSpeakonCh2' }], fixPaths: ['cable.cSpk.a.port'], rootEvidence: ['amp.outputMismatch'],
          cause: '앰프 입력 신호는 CH1 로 들어오는데, 스피커 케이블은 CH2 출력에 꽂혀 있었습니다.', fix: '스피커 케이블을 CH1 스피커 출력으로 옮겼습니다.',
          hints: ['앰프 입력 신호(SIGNAL LED)가 어느 채널에 있나요?', '신호가 있는 채널의 출력이 실제로 스피커로 가고 있는지 확인하세요.', '앰프 "출력·스피커 연결" 검사로 CH1/CH2 출력에 무엇이 꽂혀 있는지 비교하세요.'] }
      ] }
  ];
  // 학습용 정보 (미션 카드·완료 후 복습). 원인 정답은 결과 화면에서만 쓴다
  var STUDY = {
    A: { principle: '신호가 지나가는 순서대로 따라가며, 신호가 있는 마지막 지점과 없는 첫 지점을 찾습니다.',
      core: ['소리가 안 날 때는 마이크 → 케이블 → 믹서 입력 → 채널 → 출력 → 케이블 → 스피커 순서로 신호를 따라갑니다.',
        '신호가 있는 마지막 지점과 신호가 없는 첫 지점 사이에 원인이 있습니다.',
        'MG12XU 의 입력 미터(PFL)와 STEREO 출력 미터를 비교하면 원인이 믹서 앞인지, 믹서 안인지, 믹서 뒤인지 한 번에 가를 수 있어요.',
        '액티브 스피커(ZXA1)는 앰프가 들어 있어서 신호와 전원이 둘 다 있어야 소리가 납니다.'],
      quiz: { q: 'MG12XU 입력 미터에는 마이크 신호가 보이는데, STEREO 출력 미터는 전혀 움직이지 않습니다. 가장 먼저 확인할 곳은?', answer: 'b',
        options: [['a', '마이크 케이블 양 끝', '입력 미터에 신호가 있으면 마이크와 케이블은 이미 믹서까지 신호를 전달했어요.'],
          ['b', '채널 ON 버튼 · 페이더 · ST 버튼', '맞아요. 입력과 출력 사이에서 막혔으니 채널 안의 설정이 원인 후보예요.'],
          ['c', '스피커 전원', '믹서 출력이 0 이면 스피커가 켜져 있어도 받을 신호가 없어요. 스피커는 믹서 출력이 확인된 뒤에 봅니다.'],
          ['d', 'GAIN 을 최대로 올리기', '입력 미터에 이미 신호가 보이면 GAIN 은 제 역할을 하고 있어요. 무작정 올리면 PEAK(과입력)가 생길 수 있어요.']] },
      why: { 'A-1': '믹서 출력은 정상인데 ZXA1 POWER LED 가 꺼져 있고 전원 스위치가 OFF 였어요. 신호는 스피커까지 왔지만 스피커가 동작하지 않은 거예요.',
        'A-2': '입력 미터에는 신호가 있는데 출력은 0 이었고, 채널 상태에서 ON 버튼이 꺼져 있었어요. 입력과 출력 사이(채널 안)에서 막힌 것이 확인됐어요.',
        'A-3': '입력 미터가 0 이었고, 마이크 케이블의 믹서 쪽 끝이 빠져 있었어요. 신호가 믹서까지 도착하지 못한 이유예요.' },
      nextMission: 'B', apply: '미션 B 에서는 같은 「따라가기」를 좌우 두 경로에 적용해요. 정상인 쪽과 비교하는 방법을 익힙니다.' },
    B: { principle: '좌우 같은 항목끼리 비교해서, 정상인 쪽과 다른 지점을 찾습니다.',
      core: ['한쪽만 소리가 안 날 때는 정상인 쪽이 가장 좋은 비교 기준입니다.',
        '믹서 출력 미터 L/R 이 같으면 차이는 믹서 뒤(케이블·스피커)에서, 다르면 믹서 안(PAN 등)에서 생긴 것입니다.',
        'PAN 을 한쪽 끝으로 돌리면 그 채널 신호는 반대쪽 출력으로 거의 가지 않아요.'],
      quiz: { q: '오른쪽 스피커만 소리가 안 납니다. 믹서 출력 미터는 L 과 R 이 똑같이 움직입니다. 다음으로 확인할 곳은?', answer: 'b',
        options: [['a', '채널 PAN', '출력 미터 L/R 이 같다면 PAN 때문에 좌우 차이가 생긴 것은 아니에요.'],
          ['b', '오른쪽 스피커 케이블과 오른쪽 스피커 상태', '맞아요. 믹서까지는 좌우가 같으니 차이는 믹서 뒤 오른쪽 경로에 있어요. 왼쪽과 같은 항목끼리 비교하세요.'],
          ['c', '마이크 스위치', '마이크가 꺼져 있으면 왼쪽도 소리가 안 나야 해요.'],
          ['d', 'STEREO 페이더', 'STEREO 페이더는 L/R 을 함께 조절해요. 왼쪽이 정상으로 나오니 원인이 아닙니다.']] },
      why: { 'B-1': '믹서 L/R 출력은 같았는데, 오른쪽 케이블의 스피커 쪽 끝이 빠져 있었어요.',
        'B-2': '믹서 L/R 출력은 같았고, 오른쪽 ZXA1 의 전원 스위치가 OFF 였어요. 왼쪽 스피커와 같은 항목을 비교하면 바로 보이는 차이예요.',
        'B-3': '믹서 출력 미터에서 R 이 없었고, 채널 PAN 이 왼쪽 끝이었어요. 좌우 차이가 믹서 안에서 생긴 거예요.' },
      nextMission: 'C', apply: '미션 C 에서는 앰프와 패시브 스피커가 추가돼요. 「신호가 있는 마지막 지점」을 앰프 입력·출력에서 찾아보세요.' },
    C: { principle: '패시브 스피커는 앰프 출력으로만 소리가 나므로, 앰프의 입력 → 전원 → 볼륨 → 출력 채널 순서로 확인합니다.',
      core: ['패시브 스피커(ZX1)는 앰프가 없어서 파워앰프의 speakON 출력으로만 소리가 납니다.',
        '앰프에서는 입력 신호(SIGNAL LED) → 전원 → 감쇠기(볼륨) → 신호가 나오는 출력 채널과 스피커 케이블 위치 순서로 확인합니다.',
        'Crown 앰프를 STEREO 모드로 쓰면 CH1 과 CH2 는 서로 독립이라, CH1 으로 들어온 신호는 CH1 출력으로만 나옵니다.'],
      quiz: { q: '앰프 CH1 SIGNAL LED 는 켜지는데, 스피커 케이블은 CH2 출력에 꽂혀 있습니다. 소리가 나지 않는 이유는?', answer: 'b',
        options: [['a', 'CH2 감쇠기가 내려가 있어서', 'CH2 감쇠기를 올려도 CH2 에는 입력 신호가 없어서 출력이 생기지 않아요.'],
          ['b', '신호가 들어오는 채널(CH1)과 스피커가 연결된 채널(CH2)이 달라서', '맞아요. STEREO 모드에서는 CH1 입력이 CH1 출력으로만 나가요. 스피커 케이블을 CH1 출력으로 옮겨야 합니다.'],
          ['c', '패시브 스피커 전원이 꺼져 있어서', '패시브 스피커에는 전원 스위치가 없어요. 앰프 출력이 곧 스피커를 움직이는 힘입니다.'],
          ['d', 'speakON 대신 XLR 케이블을 써야 해서', '앰프 → 패시브 스피커 연결은 스피커 케이블(speakON)이 맞아요. XLR 은 마이크·라인 신호용입니다.']] },
      why: { 'C-1': '앰프 POWER LED 가 꺼져 있었고 전원 스위치가 OFF 였어요.',
        'C-2': '앰프 입력 신호와 전원은 정상이었는데, 입력이 들어오는 CH1 의 감쇠기가 맨 아래였어요.',
        'C-3': '신호는 CH1 으로 나오는데 스피커 케이블은 CH2 출력에 꽂혀 있었어요.' },
      nextMission: 'A', apply: '미션 A 의 다른 시나리오에서 「입력 미터와 출력 미터 비교」를 다시 연습해 보세요. 앰프의 SIGNAL LED 와 같은 역할이에요.' }
  };
  MISSIONS.forEach(function (m) { var x = STUDY[m.id]; if (x) Object.keys(x).forEach(function (k) { m[k] = x[k]; }); });
  // 2026-10-20(2): 검사 기능 대신 「원인을 골라 제출」 → 맞히면 직접 고치기. 3D 화면에서 보이는 것으로 찾도록 힌트·단서 문구를 바꿈
  var PROBLEMS = { power: '전원이 꺼져 있음', unplugged: '케이블 한쪽 끝이 빠져 있음', wrongPort: '다른 단자(채널)에 꽂혀 있음', micOff: '마이크 스위치가 꺼져 있음',
    chOff: '채널 ON 버튼이 꺼져 있음 (음소거)', pan: 'PAN 이 한쪽 끝으로 돌아가 있음', fader: '페이더가 내려가 있음', gain: 'GAIN 이 너무 낮음',
    volume: '볼륨(MASTER·감쇠기)이 끝까지 내려가 있음', broken: '장비 자체가 고장남' };
  var PROBLEMS_BY = { cable: ['unplugged', 'wrongPort', 'broken'], sm58: ['micOff', 'broken'], mg12xu: ['power', 'chOff', 'pan', 'fader', 'gain', 'broken'],
    zxa1: ['power', 'volume', 'wrongPort', 'broken'], crown: ['power', 'volume', 'wrongPort', 'broken'], zx1: ['wrongPort', 'broken'] };
  var ANSWERS = { 'A-1': { t: ['spk'], k: 'power' }, 'A-2': { t: ['mg'], k: 'chOff' }, 'A-3': { t: ['cMic'], k: 'unplugged' },
    'B-1': { t: ['cR'], k: 'unplugged' }, 'B-2': { t: ['spkR'], k: 'power' }, 'B-3': { t: ['mg'], k: 'pan' },
    'C-1': { t: ['amp'], k: 'power' }, 'C-2': { t: ['amp'], k: 'volume' }, 'C-3': { t: ['cSpk', 'amp'], k: 'wrongPort' } };
  var LOOK = { // 힌트: 검사 도구가 아니라 3D 화면에서 무엇을 볼지
    'A-1': ['신호가 지나가는 순서(마이크 → 믹서 → 스피커)대로 장비를 하나씩 눌러 가까이 살펴보세요.', '액티브 스피커(ZXA1)는 소리를 내려면 신호 말고도 꼭 필요한 것이 있어요.', 'ZXA1 뒷면의 전원 스위치와 POWER LED 를 확인해 보세요.'],
    'A-2': ['케이블과 전원이 모두 제대로 연결되어 있다면, 믹서 안의 설정을 의심해 보세요.', '마이크가 꽂힌 채널(CH1)에서 신호를 STEREO 로 보내는 버튼들을 살펴보세요.', 'MG12XU CH1 의 ON 버튼에 불이 켜져 있나요?'],
    'A-3': ['장비 설정보다 먼저, 신호가 지나가는 케이블이 모두 제자리에 꽂혀 있는지 보세요.', '마이크에서 믹서로 가는 구간을 가까이 확인해 보세요.', '마이크 XLR 케이블의 믹서 쪽 끝이 CH1 입력에 꽂혀 있나요?'],
    'B-1': ['왼쪽은 소리가 나니, 왼쪽과 오른쪽을 같은 항목끼리 비교해 보세요.', '믹서 뒤 오른쪽 경로(케이블 → 스피커)에서 왼쪽과 다른 점을 찾아보세요.', '오른쪽 스피커 XLR 케이블의 스피커 쪽 끝을 확인하세요.'],
    'B-2': ['왼쪽은 소리가 나니, 왼쪽과 오른쪽을 같은 항목끼리 비교해 보세요.', '오른쪽 스피커 자체를 왼쪽 스피커와 비교해 보세요.', '오른쪽 ZXA1 의 전원 스위치와 POWER LED 를 왼쪽과 비교하세요.'],
    'B-3': ['왼쪽은 소리가 나니, 왼쪽과 오른쪽을 같은 항목끼리 비교해 보세요.', '케이블과 스피커가 좌우 모두 같다면, 믹서 안에서 좌우를 나누는 곳을 보세요.', 'MG12XU CH1 의 PAN 노브가 어느 쪽을 가리키고 있나요?'],
    'C-1': ['패시브 스피커는 앰프가 있어야 소리가 나요. 앰프부터 살펴보세요.', '앰프가 동작하고 있는지 앞면을 보세요.', 'Crown 앰프 앞면의 전원 스위치와 POWER LED 를 확인하세요.'],
    'C-2': ['패시브 스피커는 앰프가 있어야 소리가 나요. 앰프부터 살펴보세요.', '앰프 전원은 켜져 있어요. 앞면의 다른 조절부를 보세요.', 'CH1 감쇠기(볼륨) 노브가 어디까지 돌아가 있나요?'],
    'C-3': ['패시브 스피커는 앰프가 있어야 소리가 나요. 앰프부터 살펴보세요.', '앰프 뒷면에서 신호가 들어오는 채널과 스피커가 연결된 채널을 비교하세요.', '믹서 신호는 CH1 입력으로 들어와요. 스피커 케이블은 어느 출력에 꽂혀 있나요?'] };
  var CLUE = {
    'A-1': 'ZXA1 뒷면 전원 스위치가 OFF 라서 POWER LED 가 꺼져 있었어요. 액티브 스피커는 내장 앰프에 전원이 있어야 소리를 낼 수 있어요.',
    'A-2': 'MG12XU CH1 의 ON 버튼이 꺼져 있었어요. ON 이 꺼지면 채널 신호가 STEREO 로 가지 않아요(입력 미터에는 신호가 보여도 출력은 0).',
    'A-3': '마이크 XLR 케이블의 믹서 쪽 끝이 빠져 있었어요. 신호가 믹서까지 도착하지 못하니 그 뒤 장비는 모두 조용해요.',
    'B-1': '오른쪽 스피커 XLR 케이블의 스피커 쪽 끝이 빠져 있었어요. 왼쪽 경로와 비교하면 바로 보이는 차이예요.',
    'B-2': '오른쪽 ZXA1 의 전원 스위치가 OFF 였어요. 왼쪽 스피커의 POWER LED 와 비교하면 바로 보이는 차이예요.',
    'B-3': 'MG12XU CH1 의 PAN 이 왼쪽 끝이었어요. 그래서 마이크 신호가 STEREO L 로만 가고 R 에는 거의 가지 않았어요.',
    'C-1': 'Crown 앰프 앞면 전원 스위치가 OFF 라 POWER LED 가 꺼져 있었어요. 패시브 스피커는 앰프가 동작해야만 소리가 나요.',
    'C-2': 'Crown 앰프 CH1 감쇠기(볼륨)가 맨 아래였어요. 앰프가 켜져 있어도 이 채널은 출력이 나가지 않아요.',
    'C-3': '신호는 앰프 CH1 으로 들어오는데 스피커 케이블은 CH2 출력에 꽂혀 있었어요. STEREO 모드에서 CH1 과 CH2 는 서로 독립이에요.' };
  MISSIONS.forEach(function (m) { m.scenarios.forEach(function (sc) { if (LOOK[sc.id]) sc.hints = LOOK[sc.id]; if (ANSWERS[sc.id]) sc.answer = ANSWERS[sc.id]; }); if (m.why) Object.keys(CLUE).forEach(function (k) { if (k.charAt(0) === m.id) m.why[k] = CLUE[k]; }); });
  // 답 보기: 이 미션의 장비·케이블 + 종류별 「무엇이 문제」 목록
  function answerTargets(m, st) {
    var L = Object.keys(st.devices).filter(function (id) { return st.devices[id].type !== 'outlet'; }).map(function (id) { return { id: id, name: devName(m, id), problems: PROBLEMS_BY[st.devices[id].type] || ['broken'] }; });
    return L.concat(st.cables.map(function (c) { return { id: c.id, name: c.label, cable: true, problems: PROBLEMS_BY.cable }; }));
  }


  function mission(id) { for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === id) return MISSIONS[i]; return null; }
  function scenario(m, sid) { for (var i = 0; i < m.scenarios.length; i++) if (m.scenarios[i].id === sid) return m.scenarios[i]; return null; }
  function startState(m, sc) { var st = buildNormal(m); sc.fault.forEach(function (f) { setPath(st, f.path, f.value); }); return st; }

  // ---------------------------------------------------------------------------
  // 이름
  function devName(m, id) { return (m.devices[id] && m.devices[id].name) || id; }
  function portName(m, st, dev, port) { var d = st.devices[dev], p = d && portDef(d.type, port); return devName(m, dev) + ' ' + (p ? p[1] : port); }
  function cableEndText(m, st, e) { return portName(m, st, e.dev, e.port); }

  // ---------------------------------------------------------------------------
  // 검사 도구: 상태 계산값에서 결과·증거·흐름도 공개 정보를 만든다
  // 결과 { title, status('ok'|'warn'|'bad'|'info'), lines[], evidence[{key,label}], reveal{nodes{}, edges{}} }
  var TOOL_INFO = {
    'mic.switch': { dev: 'sm58', label: '마이크 스위치 보기' },
    'mg.power': { dev: 'mg12xu', label: '전원 상태 (POWER LED·스위치·전원 케이블)' },
    'mg.inputMeter': { dev: 'mg12xu', label: '입력 미터 (채널 PFL 로 레벨 확인)' },
    'mg.channel': { dev: 'mg12xu', label: '채널 상태 (ON·페이더·PAN·ST)' },
    'mg.outputMeter': { dev: 'mg12xu', label: '출력 미터 (STEREO L/R)' },
    'spk.status': { dev: 'zxa1', label: '전원·상태 (POWER LED·스위치·노브)' },
    'spk.input': { dev: 'zxa1', label: '입력 단자 상태 (케이블·신호)' },
    'amp.input': { dev: 'crown', label: '입력 신호 (CH1/CH2 SIGNAL LED)' },
    'amp.status': { dev: 'crown', label: '상태 (POWER LED·스위치·감쇠기)' },
    'amp.outputs': { dev: 'crown', label: '출력·스피커 연결 (speakON 단자)' },
    'pas.input': { dev: 'zx1', label: '입력 단자 상태 (speakON 케이블·신호)' },
    'cable.ends': { dev: 'cable', label: '케이블 양 끝 연결 상태' },
    'cable.compat': { dev: 'cable', label: '케이블 종류·단자 호환' }
  };
  function sigWord(x) { return x === NEG || x === undefined || x === null ? '신호 없음' : x < -60 ? '신호 거의 없음' : '신호 있음 (' + dbTxt(x) + ' dBu)'; }
  function inspect(m, st, toolId, target, known) {
    var ev = evaluate(m, st), R = { tool: toolId, target: target, title: TOOL_INFO[toolId].label, status: 'ok', lines: [], evidence: [], reveal: { nodes: {}, edges: {} } };
    var d = st.devices[target], name = devName(m, target);
    function bad(s) { if (s === 'bad' || (s === 'warn' && R.status !== 'bad')) R.status = s; }
    function evi(key, label) { R.evidence.push({ key: key, label: label }); }
    function powerLines(id) { var dd = st.devices[id], pc = st.cables.filter(function (c) { return c.type === 'ac' && (c.a.dev === id || c.b.dev === id); })[0];
      var on = ev.power[id], mainsOk = !!ev.mains[id];
      R.lines.push('POWER LED: ' + (on ? '켜짐' : '꺼짐'));
      R.lines.push('전원 스위치: ' + (dd.power ? 'ON' : 'OFF'));
      if (pc) { var eq = pc.a.dev === id ? pc.a : pc.b, so = pc.a.dev === id ? pc.b : pc.a;
        R.lines.push('전원 케이블: 장비 쪽 ' + (eq.seated ? '꽂힘' : '빠짐') + ', 콘센트 쪽 ' + (so.seated ? '꽂힘' : '빠짐') + (mainsOk ? ' — 콘센트 전원 들어옴(가상)' : ''));
        if (!eq.seated) evi('cable.' + pc.id + '.' + (pc.a === eq ? 'a' : 'b') + 'Unplugged', pc.label + ' 장비 쪽이 빠져 있음');
        if (!so.seated) evi('cable.' + pc.id + '.' + (pc.a === so ? 'a' : 'b') + 'Unplugged', pc.label + ' 콘센트 쪽이 빠져 있음');
      } else R.lines.push('전원 케이블: 없음');
      if (!dd.power) { evi(id + '.powerSwitchOff', name + ' 전원 스위치가 OFF'); bad('bad'); }
      else if (!on) bad('bad');
      R.reveal.nodes[id] = { power: on ? 'on' : 'off' };
    }
    if (toolId === 'mic.switch') {
      R.lines.push('스위치: ' + (d.switch ? 'ON' : 'OFF')); R.reveal.nodes[target] = { signal: d.switch ? 'signal' : 'none' };
      if (!d.switch) { evi(target + '.switchOff', name + ' 스위치가 OFF'); bad('bad'); }
    } else if (toolId === 'mg.power') { powerLines(target);
    } else if (toolId === 'mg.inputMeter') {
      if (!ev.power[target]) { R.lines.push('믹서 전원이 꺼져 있어 미터가 동작하지 않습니다.'); bad('bad'); R.reveal.nodes[target] = { power: 'off' }; }
      else { var mx = ev.mixer[target], shown = 0;
        CH_IDS.forEach(function (c) { var s = mx.ch[c]; if (!s || !s.cabled && !(c === 'ch1')) return; shown++;
          var lv = s.pre, txt = CH_LABEL[c] + ' (' + (s.cabled ? '케이블 꽂힘' : '입력 케이블 없음') + '): ' + (lv === NEG ? '미터 움직이지 않음 (신호 없음)' : '게인 뒤 ' + dbTxt(lv) + ' dBu' + (s.peak ? ' — PEAK 켜짐' : ''));
          R.lines.push(txt);
          if (c === inputChannel(m, st)) { R.reveal.nodes[target + '.in'] = { signal: lv === NEG ? 'none' : 'signal' }; if (lv === NEG) { bad('bad'); evi(target + '.' + c + '.noInput', CH_LABEL[c] + ' 입력 미터에 신호 없음'); } else evi(target + '.' + c + '.inputOk', CH_LABEL[c] + ' 입력 신호 정상 도착'); }
          if (s.peak) { bad('warn'); evi(target + '.' + c + '.peak', CH_LABEL[c] + ' PEAK(과입력)'); } });
        if (!shown) R.lines.push('입력 케이블이 꽂힌 채널이 없습니다.');
      }
    } else if (toolId === 'mg.channel') {
      var c0 = inputChannel(m, st), s0 = d.ch[c0];
      R.lines.push(CH_LABEL[c0] + ' ON 버튼: ' + (s0.on ? '켜짐 (주황 램프)' : '꺼짐 — 채널 음소거'));
      R.lines.push(CH_LABEL[c0] + ' GAIN: +' + gainDb(s0.gain).toFixed(0) + ' dB, 페이더: ' + dbTxt(faderDb(s0.fader)) + ' dB, PAN: ' + panWord(s0.pan) + ', ST 버튼: ' + (s0.st ? '켜짐' : '꺼짐'));
      R.lines.push('STEREO 페이더: ' + dbTxt(faderDb(d.stFader)) + ' dB');
      if (!s0.on) { evi(target + '.' + c0 + '.off', CH_LABEL[c0] + ' ON 버튼이 꺼짐(음소거)'); bad('bad'); }
      if (s0.fader < 0.02) { evi(target + '.' + c0 + '.faderDown', CH_LABEL[c0] + ' 페이더가 맨 아래'); bad('bad'); }
      if (!s0.st) { evi(target + '.' + c0 + '.stOff', CH_LABEL[c0] + ' ST(스테레오 보내기) 버튼 꺼짐'); bad('bad'); }
      if (d.stFader < 0.02) { evi(target + '.stFaderDown', 'STEREO 페이더가 맨 아래'); bad('bad'); }
      if (s0.pan <= 0.05) { evi(target + '.' + c0 + '.panHardL', CH_LABEL[c0] + ' PAN 이 왼쪽 끝'); bad('warn'); }
      if (s0.pan >= 0.95) { evi(target + '.' + c0 + '.panHardR', CH_LABEL[c0] + ' PAN 이 오른쪽 끝'); bad('warn'); }
      R.reveal.nodes[target + '.ch'] = { state: s0.on && s0.fader >= 0.02 && s0.st ? 'ok' : 'blocked' };
    } else if (toolId === 'mg.outputMeter') {
      if (!ev.power[target]) { R.lines.push('믹서 전원이 꺼져 있어 미터가 동작하지 않습니다.'); bad('bad'); }
      else { var o = ev.mixer[target]; R.lines.push('STEREO 미터 L: ' + meterWord(o.L)); R.lines.push('STEREO 미터 R: ' + meterWord(o.R));
        if (o.L === NEG && o.R === NEG) { bad('bad'); evi(target + '.noOutput', '믹서 STEREO 출력 L/R 모두 신호 없음'); }
        else { if (o.L === NEG || o.R === NEG || Math.abs(o.L - o.R) > 6) { bad('warn'); evi(target + '.outputImbalance', '믹서 출력 L/R 이 다름 (L ' + dbTxt(o.L) + ', R ' + dbTxt(o.R) + ')'); } else evi(target + '.outputOk', '믹서 STEREO 출력 L/R 신호 정상'); }
        R.reveal.nodes[target + '.outL'] = { signal: o.L === NEG ? 'none' : 'signal' }; R.reveal.nodes[target + '.outR'] = { signal: o.R === NEG ? 'none' : 'signal' }; }
    } else if (toolId === 'spk.status') {
      powerLines(target);
      R.lines.push('MASTER 노브: ' + dbTxt(attDb(d.master)) + ' dB, MIC 노브: ' + Math.round(d.mic * 100) + '%');
      var sp = ev.speakers[target]; R.lines.push('LIMIT LED: ' + (sp.grade === 'clip' && ev.power[target] ? '켜짐' : '꺼짐'));
      if (d.master < 0.02) { evi(target + '.masterDown', name + ' MASTER 가 맨 아래'); bad('bad'); }
    } else if (toolId === 'spk.input' || toolId === 'pas.input') {
      var ports = TYPES[d.type].ports.filter(function (p) { return p[2] === 'xlr-in' || p[2] === 'speakon'; });
      ports.forEach(function (p) { var c = cableAt(st, target, p[0]), lv = ev.inLevels[target + '.' + p[0]];
        R.lines.push(p[1] + ': ' + (c ? c.label + ' 꽂힘 — ' + sigWord(lv === undefined ? NEG : lv) + ' (시뮬레이션 측정)' : '비어 있음'));
        if (c) R.reveal.nodes[target + '.in'] = { signal: lv === undefined || lv === NEG ? 'none' : 'signal' }; });
      var anyIn = ports.some(function (p) { var lv = ev.inLevels[target + '.' + p[0]]; return lv !== undefined && lv !== NEG; });
      var anyCable = ports.some(function (p) { return cableAt(st, target, p[0]); });
      if (!anyCable) { bad('bad'); evi(target + '.noInputCable', name + ' 입력 단자에 꽂힌 케이블 없음'); R.reveal.nodes[target + '.in'] = { signal: 'none' }; }
      else if (!anyIn) { bad('bad'); evi(target + '.noInputSignal', name + ' 입력 단자에 신호 없음'); }
      else evi(target + '.inputOk', name + ' 입력 신호 도착');
      var spx = ev.speakers[target]; R.lines.push('스피커 소리: ' + GRADE_TEXT[spx.grade] + (spx.passive ? '' : (ev.power[target] ? '' : ' (전원 꺼짐)')));
    } else if (toolId === 'amp.input') {
      var a = ev.amp[target];
      [1, 2].forEach(function (n) { var c = cableAt(st, target, 'inputXlrCh' + n), x = a.in[n], led = ev.power[target] && x !== NEG && x - SENS.crown > -40;
        R.lines.push('CH' + n + ' 입력: ' + (c ? c.label + ' 꽂힘' : '비어 있음') + ' — SIGNAL LED ' + (ev.power[target] ? (led ? '켜짐' : '꺼짐') : '꺼짐 (전원 없음)'));
        if (ev.power[target]) R.reveal.nodes[target + '.in' + n] = { signal: led ? 'signal' : 'none' };
        if (led) evi(target + '.in' + n + 'Signal', '앰프 CH' + n + ' 입력 신호 있음'); });
      if (!ev.power[target]) { R.lines.push('전원이 꺼져 있으면 LED 로 입력을 확인할 수 없습니다.'); bad('warn'); }
    } else if (toolId === 'amp.status') {
      powerLines(target);
      [1, 2].forEach(function (n) { R.lines.push('CH' + n + ' 감쇠기(볼륨): ' + (d.att[n] < 0.02 ? '맨 아래 (−∞)' : dbTxt(attDb(d.att[n])) + ' dB'));
        if (d.att[n] < 0.02) { var used = !!cableAt(st, target, 'inputXlrCh' + n); evi(target + '.att' + n + 'Down', '앰프 CH' + n + ' 감쇠기가 맨 아래' + (used ? ' (입력이 들어오는 채널)' : '')); if (used) bad('bad'); } });
      R.lines.push('모드: STEREO, 입력 감도: 1.4V');
    } else if (toolId === 'amp.outputs') {
      var a2 = ev.amp[target], sigCh = [], cabCh = [];
      [1, 2].forEach(function (n) { var c = cableAt(st, target, 'outputSpeakonCh' + n), o = a2.out[n], other = c ? (c.a.dev === target ? c.b : c.a) : null;
        R.lines.push('CH' + n + ' 스피커 출력: ' + (c ? c.label + ' → ' + (other.seated ? portName(m, st, other.dev, other.port) : '반대쪽 빠짐') : '비어 있음') + ', 출력 신호 ' + (o === NEG ? '없음' : '있음') + ' (시뮬레이션 측정)');
        if (o !== NEG) sigCh.push(n); if (c && other.seated) cabCh.push(n); R.reveal.nodes[target + '.out' + n] = { signal: o === NEG ? 'none' : 'signal', cabled: !!c }; });
      if (sigCh.length && cabCh.length && !sigCh.some(function (n) { return cabCh.indexOf(n) >= 0; })) { bad('bad'); evi(target + '.outputMismatch', '신호가 나오는 채널(CH' + sigCh.join(',') + ')과 스피커가 연결된 채널(CH' + cabCh.join(',') + ')이 다름'); }
      else if (!cabCh.length) { bad('bad'); evi(target + '.noSpeakerCable', '앰프 출력에 스피커 케이블이 없음'); }
      else if (!sigCh.length) { bad('bad'); evi(target + '.noOutput', '앰프 출력 신호 없음'); }
    } else if (toolId === 'cable.ends') {
      var c1 = cableById(st, target); R.title = TOOL_INFO[toolId].label + ' — ' + c1.label;
      ['a', 'b'].forEach(function (k) { var e = c1[k]; R.lines.push((k === 'a' ? '보내는 쪽' : '받는 쪽') + ' 끝: ' + cableEndText(m, st, e) + ' — ' + (e.seated ? '꽂힘 (잠금 확인)' : '빠져 있음'));
        if (!e.seated) { bad('bad'); evi('cable.' + c1.id + '.' + k + 'Unplugged', c1.label + '의 ' + (k === 'a' ? '보내는 쪽' : '받는 쪽') + ' 끝이 빠져 있음'); } });
      R.reveal.edges[c1.id] = { state: c1.a.seated && c1.b.seated ? 'ok' : 'open' };
    } else if (toolId === 'cable.compat') {
      var c2 = cableById(st, target), ka = kindOf2(st, c2.a), kb = kindOf2(st, c2.b), okc = cableFits(c2.type, ka, kb); R.title = TOOL_INFO[toolId].label + ' — ' + c2.label;
      R.lines.push('케이블 종류: ' + CABLE_TYPES[c2.type]); R.lines.push('양 끝 단자: ' + cableEndText(m, st, c2.a) + ' (' + ka + ') ↔ ' + cableEndText(m, st, c2.b) + ' (' + kb + ')');
      R.lines.push(okc ? '종류가 단자와 맞습니다.' : '케이블 종류가 단자와 맞지 않습니다.'); if (!okc) { bad('bad'); evi('cable.' + c2.id + '.incompatible', c2.label + ' 종류가 단자와 맞지 않음'); }
    }
    explain(m, st, ev, R, toolId, target, known || {});
    return R;
  }

  // ---------------------------------------------------------------------------
  // 검사 결과 해석: 지금 시뮬레이션 상태(ev)에서 계산한 값으로 「무슨 뜻인지」와 「다음에 볼 곳」을 만든다.
  // (시나리오 정답 문구를 쓰지 않음 — 같은 검사라도 상태가 다르면 해석이 달라진다)
  //  R.meaning[] : 이 결과가 의미하는 것,  R.next[] : { tool, target, why } 다음 확인 지점
  function pathNodes(m) { return fullPaths(m); }
  function neighbor(m, dev, dir) { // 흐름도에서 dev 바로 앞(dir=-1)/뒤(+1) 케이블 id 목록
    var r = []; pathNodes(m).forEach(function (p) { var i = p.indexOf(dev); if (i >= 0 && p[i + dir] && r.indexOf(p[i + dir]) < 0) r.push(p[i + dir]); }); return r;
  }
  function devOfCable(st, cid, notDev) { var c = cableById(st, cid); if (!c) return null; return c.a.dev !== notDev ? c.a.dev : c.b.dev; }
  function explain(m, st, ev, R, toolId, target, known) {
    var M = [], N = [], d = st.devices[target], name = devName(m, target);
    function nx(tool, tgt, why) { if (m.tools.indexOf(tool) < 0 || !tgt) return; if (N.some(function (x) { return x.tool === tool && x.target === tgt; })) return; N.push({ tool: tool, target: tgt, why: why }); }
    function cabLabel(cid) { var c = cableById(st, cid); return c ? c.label : cid; }
    function upChecks(dev, why) { neighbor(m, dev, -1).forEach(function (cid) { nx('cable.ends', cid, why || cabLabel(cid) + ' 양 끝이 꽂혀 있는지'); }); }
    function speakerTool(id) { var t = st.devices[id] && st.devices[id].type; return t === 'zx1' ? 'pas.input' : 'spk.input'; }
    var mgId = Object.keys(st.devices).filter(function (k) { return st.devices[k].type === 'mg12xu'; })[0];
    var mx = mgId && ev.mixer[mgId], micCh = inputChannel(m, st), chInputOk = mx && mx.ch[micCh] && mx.ch[micCh].pre !== NEG;
    var others = m.targets.filter(function (x) { return x !== target; });
    if (toolId === 'mic.switch') {
      if (d.switch) { M.push('마이크는 신호를 내보내고 있어요. 신호가 출발점에서는 정상입니다.'); upChecks('mg'); if (mgId) nx('mg.inputMeter', mgId, '그 신호가 믹서 입력까지 도착하는지'); }
      else M.push('마이크 스위치가 꺼져 있으면 신호가 처음부터 만들어지지 않아요. 뒤쪽 장비를 아무리 봐도 신호가 없습니다.');
    } else if (toolId === 'mg.power' || toolId === 'spk.status' || toolId === 'amp.status') {
      var on = ev.power[target];
      if (!on) { M.push(name + ' 에 전원이 들어오지 않아요. 전원이 없으면 이 장비는 신호를 처리하거나 내보내지 못합니다.');
        if (!d.power) M.push('전원 케이블은 연결되어 있는데 스위치가 OFF 라면, 스위치를 켜는 것이 다음 조치예요.');
        else M.push('스위치는 ON 인데 LED 가 꺼져 있다면 전원 케이블 연결을 확인해야 해요.');
      } else if (toolId === 'mg.power') { M.push('믹서는 동작 중이에요. 이제 미터로 신호가 어디까지 왔는지 볼 수 있어요.'); nx('mg.inputMeter', target, '마이크 신호가 믹서 입력에 들어오는지'); nx('mg.outputMeter', target, '믹서 출력으로 신호가 나가는지'); }
      else if (toolId === 'spk.status') {
        if (d.master < 0.02) M.push('전원은 들어왔지만 MASTER 가 맨 아래면 들어온 신호가 소리로 나오지 않아요.');
        else { M.push(name + ' 은 전원이 켜져 있고 볼륨도 열려 있어요. 스피커 자체는 소리 낼 준비가 되어 있습니다.'); nx('spk.input', target, '신호가 이 스피커 입력까지 도착하는지'); }
        if (others.length && m.balance) others.forEach(function (o) { nx('spk.status', o, '반대쪽 스피커의 같은 항목과 비교'); });
      } else if (toolId === 'amp.status') {
        var used = [1, 2].filter(function (n) { return cableAt(st, target, 'inputXlrCh' + n); });
        var down = used.filter(function (n) { return d.att[n] < 0.02; });
        if (down.length) M.push('입력이 들어오는 CH' + down.join(',') + ' 의 감쇠기가 맨 아래예요. 앰프가 켜져 있어도 이 채널은 출력이 나가지 않습니다.');
        else { M.push('앰프 전원과 감쇠기는 정상이에요. 남은 것은 출력 단자와 스피커 케이블 연결입니다.'); nx('amp.outputs', target, '신호가 나오는 채널과 스피커 케이블이 꽂힌 채널이 같은지'); }
      }
      if (!on) { var pc = st.cables.filter(function (c) { return c.type === 'ac' && (c.a.dev === target || c.b.dev === target); })[0]; if (pc && d.power) nx('cable.ends', pc.id, pc.label + ' 양 끝'); }
    } else if (toolId === 'mg.inputMeter') {
      if (!ev.power[target]) { M.push('믹서 전원이 없어서 미터로는 판단할 수 없어요. 먼저 전원을 확인해야 합니다.'); nx('mg.power', target, '믹서 전원 상태'); }
      else if (chInputOk) { M.push('마이크 → 마이크 케이블 → 믹서 ' + CH_LABEL[micCh] + ' 입력까지는 신호가 정상으로 왔어요. 원인은 이보다 뒤쪽에 있습니다.'); nx('mg.outputMeter', target, '믹서 안을 지나 STEREO 출력으로 나가는지'); }
      else { M.push(CH_LABEL[micCh] + ' 입력 미터가 움직이지 않아요. 신호가 믹서까지 도착하지 못했으니 원인은 마이크와 마이크 케이블 쪽(믹서 앞)입니다.'); var mic = Object.keys(st.devices).filter(function (k) { return st.devices[k].type === 'sm58'; })[0]; if (mic) nx('mic.switch', mic, '마이크 스위치'); upChecks(target); }
    } else if (toolId === 'mg.channel') {
      var c0 = inputChannel(m, st), s0 = d.ch[c0], blk = [];
      if (!s0.on) blk.push('ON 버튼이 꺼져 있으면 채널 신호가 STEREO 로 가지 않아요 (매뉴얼: ON 이 꺼지면 버스로 보내지 않음).');
      if (s0.fader < 0.02) blk.push('채널 페이더가 맨 아래면 STEREO 로 보내는 양이 0 이에요.');
      if (!s0.st) blk.push('ST 버튼이 꺼져 있으면 이 채널이 STEREO 버스에 할당되지 않아요.');
      if (d.stFader < 0.02) blk.push('STEREO 페이더가 맨 아래면 믹서 전체 출력이 0 이에요.');
      if (s0.pan <= 0.05) blk.push('PAN 이 왼쪽 끝이면 이 채널 신호는 STEREO L 로만 가고 R 에는 거의 가지 않아요.');
      if (s0.pan >= 0.95) blk.push('PAN 이 오른쪽 끝이면 이 채널 신호는 STEREO R 로만 가고 L 에는 거의 가지 않아요.');
      if (blk.length) blk.forEach(function (x) { M.push(x); });
      else { M.push('채널 안에서 신호를 막는 설정(ON·페이더·ST·STEREO 페이더)은 없어요. PAN 도 가운데라 좌우로 고르게 갑니다.'); nx('mg.outputMeter', target, '실제로 STEREO L/R 출력에 신호가 나가는지'); }
    } else if (toolId === 'mg.outputMeter') {
      if (!ev.power[target]) { M.push('믹서 전원이 없어서 출력 미터가 동작하지 않아요.'); nx('mg.power', target, '믹서 전원 상태'); }
      else { var L = mx.L, Rr = mx.R;
        if (L === NEG && Rr === NEG) {
          var kIn = known[target + '.' + micCh + '.inputOk'], kNo = known[target + '.' + micCh + '.noInput'];
          if (kIn && chInputOk) { M.push('입력 미터에는 신호가 있는데 출력 미터는 0 이에요. 입력과 출력 사이, 즉 믹서 채널 안에서 신호가 막혔다는 뜻입니다.'); M.push('점검할 곳: 채널 ON 버튼, 채널 페이더, ST 할당 버튼, STEREO 페이더.'); nx('mg.channel', target, '채널 ON·페이더·ST·STEREO 페이더'); }
          else if (kNo && !chInputOk) { M.push('입력 미터도 0, 출력 미터도 0 이에요. 신호가 믹서에 들어오지도 못했으니 믹서 앞쪽(마이크·마이크 케이블)이 먼저예요.'); upChecks(target); }
          else { M.push('출력 미터가 0 이에요. 입력 미터와 비교해야 어디서 끊겼는지 알 수 있어요 — 입력에 신호가 있으면 믹서 채널 안, 입력도 0 이면 믹서 앞쪽 문제예요.'); nx('mg.inputMeter', target, '입력 미터와 비교'); }
        } else if (L === NEG || Rr === NEG || Math.abs(L - Rr) > 6) {
          var miss = L === NEG || L < Rr ? 'L' : 'R';
          M.push('출력 미터 L 과 R 이 달라요(' + miss + ' 쪽이 약하거나 없음). 믹서 안에서 이미 좌우 차이가 생겼다는 뜻이라, 뒤쪽 케이블·스피커보다 믹서 안 PAN 을 먼저 보는 게 맞아요.');
          nx('mg.channel', target, '채널 PAN 위치');
        } else {
          M.push('믹서 STEREO 출력 L/R 모두 신호가 있고 크기도 비슷해요. 마이크부터 믹서 출력까지는 정상입니다.');
          if (m.targets.length > 1) M.push('좌우 출력이 같으므로, 한쪽만 소리가 안 난다면 차이는 믹서 뒤(케이블·스피커)에서 생긴 거예요. 왼쪽과 오른쪽 경로를 같은 항목끼리 비교해 보세요.');
          else M.push('원인은 믹서 뒤쪽(출력 케이블 → 다음 장비)에 있어요.');
          neighbor(m, target, 1).forEach(function (cid) { var nd = devOfCable(st, cid, target), t = nd && st.devices[nd].type;
            if (t === 'crown') nx('amp.input', nd, '앰프 입력에 신호가 도착하는지'); else if (nd) nx(speakerTool(nd), nd, devName(m, nd) + ' 입력에 신호가 도착하는지'); });
        } }
    } else if (toolId === 'spk.input' || toolId === 'pas.input') {
      var sp = ev.speakers[target], anyCable = R.evidence.every(function (e) { return e.key !== target + '.noInputCable'; }), sig = R.evidence.some(function (e) { return e.key === target + '.inputOk'; });
      if (!anyCable) { M.push(name + ' 입력 단자에 케이블이 꽂혀 있지 않아요. 신호가 들어올 길이 없습니다.'); upChecks(target); }
      else if (!sig) { M.push('케이블은 꽂혀 있는데 신호가 오지 않아요. 케이블의 반대쪽 끝이 빠졌거나, 앞 장비가 신호를 내보내지 않는 경우예요.'); upChecks(target);
        neighbor(m, target, -1).forEach(function (cid) { var pd = devOfCable(st, cid, target), t = pd && st.devices[pd].type; if (t === 'mg12xu') nx('mg.outputMeter', pd, '믹서 출력에 신호가 있는지'); if (t === 'crown') nx('amp.outputs', pd, '앰프 출력 채널과 케이블 위치'); }); }
      else if (sp.grade === 'silent') { M.push('신호는 스피커 입력까지 도착했는데 소리가 없어요. 원인은 스피커 자체(전원·볼륨)입니다.'); if (toolId === 'spk.input') nx('spk.status', target, '전원 LED·스위치·MASTER'); }
      else if (sp.grade === 'good') { M.push('신호가 도착하고 정상 크기로 소리가 나요. 이 경로는 정상입니다.'); if (others.length && m.balance) others.forEach(function (o) { nx(speakerTool(o), o, '반대쪽 스피커와 비교'); }); }
      else M.push('신호가 도착하지만 소리가 정상 범위가 아니에요(' + GRADE_TEXT[sp.grade] + '). 볼륨 단계를 확인해 보세요.');
      if (m.balance && others.length && sp.grade !== 'good') others.forEach(function (o) { nx(speakerTool(o), o, '정상인 반대쪽과 같은 항목 비교'); });
    } else if (toolId === 'amp.input') {
      var a = ev.amp[target], lit = [1, 2].filter(function (n) { return ev.power[target] && a.in[n] !== NEG && a.in[n] - SENS.crown > -40; });
      if (!ev.power[target]) { M.push('앰프 전원이 꺼져 있으면 SIGNAL LED 로 입력을 확인할 수 없어요. 전원부터 확인하세요.'); nx('amp.status', target, '앰프 전원·감쇠기'); }
      else if (lit.length) { M.push('믹서 → 앰프 CH' + lit.join(',') + ' 입력까지 신호가 정상으로 왔어요. 원인은 앰프 안이나 그 뒤쪽입니다.'); nx('amp.status', target, '앰프 감쇠기(볼륨)'); nx('amp.outputs', target, '신호가 나오는 출력 채널과 스피커 케이블 위치'); }
      else { M.push('앰프 입력에 신호가 없어요. 믹서 출력이나 믹서 → 앰프 케이블 쪽을 봐야 해요.'); upChecks(target); if (mgId) nx('mg.outputMeter', mgId, '믹서 출력에 신호가 있는지'); }
    } else if (toolId === 'amp.outputs') {
      if (R.evidence.some(function (e) { return e.key === target + '.outputMismatch'; })) M.push('신호는 한 채널로 나오는데 스피커 케이블은 다른 채널에 꽂혀 있어요. 앰프의 CH1 과 CH2 는 서로 독립이라, 신호가 없는 채널에 스피커를 꽂으면 소리가 나지 않습니다.');
      else if (R.evidence.some(function (e) { return e.key === target + '.noOutput'; })) { M.push('앰프 출력이 없어요. 앰프 입력·전원·감쇠기를 확인해야 해요.'); nx('amp.input', target, '앰프 입력 SIGNAL LED'); nx('amp.status', target, '전원·감쇠기'); }
      else if (R.evidence.some(function (e) { return e.key === target + '.noSpeakerCable'; })) M.push('앰프 출력 단자에 스피커 케이블이 없어요.');
      else { M.push('신호가 나오는 채널에 스피커 케이블이 꽂혀 있어요. 앰프 출력은 정상입니다.'); neighbor(m, target, 1).forEach(function (cid) { var nd = devOfCable(st, cid, target); nx('cable.ends', cid, cabLabel(cid) + ' 양 끝'); if (nd) nx(speakerTool(nd), nd, '스피커 입력에 신호가 도착하는지'); }); }
    } else if (toolId === 'cable.ends') {
      var c1 = cableById(st, target);
      if (!(c1.a.seated && c1.b.seated)) M.push('케이블 한쪽 끝이라도 빠져 있으면 신호(또는 전원)가 건너가지 못해요. 이 케이블 뒤쪽 장비는 모두 신호가 없게 됩니다.');
      else { M.push('이 케이블의 양 끝은 제대로 꽂혀 있어요. 연결 자체는 문제가 아니므로 케이블 앞뒤 장비를 확인하세요.');
        var dn = c1.b.dev; if (st.devices[dn]) { var t2 = st.devices[dn].type; if (t2 === 'zxa1') nx('spk.status', dn, devName(m, dn) + ' 전원·상태'); if (t2 === 'zx1') nx('pas.input', dn, '스피커 입력 신호'); if (t2 === 'crown') nx('amp.input', dn, '앰프 입력 신호'); if (t2 === 'mg12xu') nx('mg.inputMeter', dn, '믹서 입력 미터'); } }
    } else if (toolId === 'cable.compat') {
      M.push(R.status === 'bad' ? '케이블 종류가 단자와 맞지 않으면 꽂히지 않거나 신호가 제대로 전달되지 않아요.' : '케이블 종류와 단자는 맞아요. XLR 은 라인·마이크 신호용, speakON 은 앰프 → 패시브 스피커용, 전원 케이블은 전원용입니다.');
    }
    R.meaning = M; R.next = N;
  }
  function kindOf2(st, e) { var d = st.devices[e.dev], p = d && portDef(d.type, e.port); return p ? p[2] : '?'; }
  function panWord(p) { return p <= 0.05 ? '왼쪽 끝 (L)' : p >= 0.95 ? '오른쪽 끝 (R)' : Math.abs(p - 0.5) < 0.06 ? '가운데' : (p < 0.5 ? '왼쪽으로 ' : '오른쪽으로 ') + Math.round(Math.abs(p - 0.5) * 200) + '%'; }
  function meterWord(x) { return x === NEG ? '움직이지 않음 (신호 없음)' : dbTxt(x) + ' dBu'; }
  function inputChannel(m, st) { var c = st.cables.filter(function (c) { return c.type === 'xlr' && (c.a.dev === 'mic' || c.b.dev === 'mic'); })[0]; var e = c && (c.a.dev === 'mg' ? c.a : c.b.dev === 'mg' ? c.b : null); return e && MG_CH[e.port] || 'ch1'; }
  function toolsFor(m, st, devId) { // 이 장비에서 쓸 수 있는 검사
    if (devId.indexOf('cable:') === 0) { var cid = devId.slice(6); return m.tools.filter(function (t) { return TOOL_INFO[t].dev === 'cable'; }).map(function (t) { return { tool: t, target: cid }; }); }
    var d = st.devices[devId]; if (!d) return [];
    return m.tools.filter(function (t) { var dv = TOOL_INFO[t].dev; return dv === d.type || (dv === 'zxa1' && d.type === 'zxa1'); }).map(function (t) { return { tool: t, target: devId }; });
  }

  // ---------------------------------------------------------------------------
  // 복구 조작 (장비별): { id, label, kind:'toggle'|'range'|'choice', path, get(st), options? }
  function opsFor(m, st, devId) {
    var L = [];
    if (devId.indexOf('cable:') === 0) {
      var c = cableById(st, devId.slice(6));
      ['a', 'b'].forEach(function (k) { var e = c[k];
        L.push({ id: 'cable.' + c.id + '.' + k + '.seated', kind: 'toggle', path: 'cable.' + c.id + '.' + k + '.seated', label: (k === 'a' ? '보내는 쪽' : '받는 쪽') + ' 끝 (' + cableEndText(m, st, e) + ')', on: '꽂혀 있음', off: '빠져 있음', onAct: '꽂기', offAct: '빼기' });
        var dv = st.devices[e.dev], kind = kindOf2(st, e), alts = TYPES[dv.type].ports.filter(function (p) { return p[2] === kind && p[0] !== e.port; });
        if (alts.length) L.push({ id: 'cable.' + c.id + '.' + k + '.port', kind: 'choice', path: 'cable.' + c.id + '.' + k + '.port', label: (k === 'a' ? '보내는 쪽' : '받는 쪽') + ' 단자 옮기기',
          options: [[e.port, portDef(dv.type, e.port)[1]]].concat(alts.filter(function (p) { return !cableAt(st, e.dev, p[0]); }).map(function (p) { return [p[0], p[1]]; })) }); });
      return L;
    }
    var d = st.devices[devId]; if (!d) return L;
    if (d.type === 'sm58') L.push({ id: devId + '.switch', kind: 'toggle', path: devId + '.switch', label: '마이크 스위치', on: 'ON', off: 'OFF' });
    if (d.type === 'mg12xu') {
      var c0 = inputChannel(m, st);
      L.push({ id: devId + '.power', kind: 'toggle', path: devId + '.power', label: '전원 스위치 (뒷면)', on: 'ON', off: 'OFF' });
      L.push({ id: devId + '.ch.' + c0 + '.gain', kind: 'range', path: devId + '.ch.' + c0 + '.gain', label: CH_LABEL[c0] + ' GAIN', fmt: function (v) { return '+' + gainDb(v).toFixed(0) + 'dB'; } });
      L.push({ id: devId + '.ch.' + c0 + '.pan', kind: 'range', path: devId + '.ch.' + c0 + '.pan', label: CH_LABEL[c0] + ' PAN', fmt: panWord });
      L.push({ id: devId + '.ch.' + c0 + '.on', kind: 'toggle', path: devId + '.ch.' + c0 + '.on', label: CH_LABEL[c0] + ' ON 버튼', on: '켜짐', off: '꺼짐(음소거)' });
      L.push({ id: devId + '.ch.' + c0 + '.st', kind: 'toggle', path: devId + '.ch.' + c0 + '.st', label: CH_LABEL[c0] + ' ST 버튼', on: '켜짐', off: '꺼짐' });
      L.push({ id: devId + '.ch.' + c0 + '.fader', kind: 'range', path: devId + '.ch.' + c0 + '.fader', label: CH_LABEL[c0] + ' 페이더', fmt: function (v) { return dbTxt(faderDb(v)) + 'dB'; } });
      L.push({ id: devId + '.stFader', kind: 'range', path: devId + '.stFader', label: 'STEREO 페이더', fmt: function (v) { return dbTxt(faderDb(v)) + 'dB'; } });
    }
    if (d.type === 'zxa1') {
      L.push({ id: devId + '.power', kind: 'toggle', path: devId + '.power', label: '전원 스위치 (뒷면)', on: 'ON', off: 'OFF' });
      L.push({ id: devId + '.master', kind: 'range', path: devId + '.master', label: 'MASTER 노브', fmt: function (v) { return dbTxt(attDb(v)) + 'dB'; } });
      L.push({ id: devId + '.mic', kind: 'range', path: devId + '.mic', label: 'MIC 노브', fmt: function (v) { return Math.round(v * 100) + '%'; } });
    }
    if (d.type === 'crown') {
      L.push({ id: devId + '.power', kind: 'toggle', path: devId + '.power', label: '전원 스위치 (앞면)', on: 'ON', off: 'OFF' });
      [1, 2].forEach(function (n) { L.push({ id: devId + '.att.' + n, kind: 'range', path: devId + '.att.' + n, label: 'CH' + n + ' 감쇠기(볼륨)', fmt: function (v) { return v < 0.02 ? '−∞' : dbTxt(attDb(v)) + 'dB'; } }); });
    }
    return L;
  }

  // ---------------------------------------------------------------------------
  // 판정
  function assess(m, st) {
    var ev = evaluate(m, st), sp = m.targets.map(function (id) { return { id: id, name: devName(m, id), grade: ev.speakers[id].grade, R: ev.speakers[id].R }; });
    var allGood = sp.every(function (s) { return s.grade === 'good'; }), problems = [];
    sp.forEach(function (s) { if (s.grade !== 'good') problems.push(s.name + ': ' + GRADE_TEXT[s.grade]); });
    if (m.balance && sp.length === 2 && allGood && Math.abs(sp[0].R - sp[1].R) > 3) { allGood = false; problems.push('좌우 음량 차이 ' + Math.abs(sp[0].R - sp[1].R).toFixed(1) + ' dB'); }
    // 정상 상태 기준: 모든 케이블이 정상 위치에 꽂힘, 모든 전원 ON, 마이크 ON
    var normal = buildNormal(m);
    st.cables.forEach(function (c) { var n = cableById(normal, c.id); ['a', 'b'].forEach(function (k) { if (!c[k].seated) problems.push(c.label + ' ' + (k === 'a' ? '보내는' : '받는') + ' 쪽이 빠져 있음'); else if (c[k].port !== n[k].port) problems.push(c.label + ' 이 설계와 다른 단자(' + portName(m, st, c[k].dev, c[k].port) + ')에 꽂혀 있음'); }); });
    Object.keys(ev.power).forEach(function (id) { if (!ev.power[id]) problems.push(devName(m, id) + ' 전원 꺼짐'); });
    var stop = signalStop(m, st, ev);
    return { ok: allGood && problems.length === 0, speakers: sp, problems: problems, stop: stop };
  }
  // 신호 경로(흐름도의 각 줄)를 처음부터 끝까지 이어진 경로로 펼침.
  // 예) B 미션: [mic,cMic,mg,cL,spkL], [mg,cR,spkR] → 두 번째 줄 앞에 [mic,cMic] 를 붙여 독립 경로로 만든다
  function fullPaths(m) {
    var out = [];
    m.flow.forEach(function (row) {
      var p = row.slice();
      for (var i = 0; i < out.length; i++) { var k = out[i].indexOf(p[0]); if (k > 0) { p = out[i].slice(0, k).concat(p); break; } }
      out.push(p);
    });
    return out;
  }
  // 경로 안에서 장비 다음 케이블이 그 장비의 어느 단자에서 나가는지 → 믹서 L/R, 앰프 CH1/CH2 중 어느 쪽을 볼지 결정
  function nextPort(st, path, i) {
    var c = path[i + 1] && cableById(st, path[i + 1]); if (!c) return null;
    return c.a.dev === path[i] ? c.a.port : c.b.dev === path[i] ? c.b.port : null;
  }
  function nodeHas(m, st, ev, path, i) {
    var id = path[i];
    if (st.devices[id]) { var d = st.devices[id], np = nextPort(st, path, i);
      if (d.type === 'sm58') return ev.outLevels[id + '.xlrOut'] !== NEG;
      if (d.type === 'mg12xu') { var mx = ev.mixer[id]; if (!mx) return false;
        if (np === 'stereoOutXlrR') return mx.R !== NEG; if (np === 'stereoOutXlrL') return mx.L !== NEG; return mx.L !== NEG || mx.R !== NEG; }
      if (d.type === 'crown') { var a = ev.amp[id]; if (!a) return false; var n = np && /Ch(\d)$/.exec(np);
        return n ? a.out[+n[1]] !== NEG : (a.out[1] !== NEG || a.out[2] !== NEG); }
      return !!ev.speakers[id] && ev.speakers[id].grade !== 'silent';
    }
    var l = ev.links.filter(function (x) { return x.cable === id; })[0]; return !!(l && l.ok);
  }
  function sideOf(st, path) { // 경로가 믹서의 어느 출력을 쓰는지 (좌우 비교 설명용)
    for (var i = 0; i < path.length; i++) { var d = st.devices[path[i]]; if (d && d.type === 'mg12xu') { var np = nextPort(st, path, i); return np === 'stereoOutXlrR' ? 'R' : np === 'stereoOutXlrL' ? 'L' : null; } }
    return null;
  }
  // 신호가 멈춘 첫 지점(초급 설명용) — 경로마다 독립적으로 계산값을 따라감.
  // 반환: 첫 번째 문제 경로의 { at, after } (기존 호환) + target·side + paths[] (경로별 결과) + okPaths(정상 경로) + divergeAt(정상 경로와 갈라지는 지점)
  function signalStop(m, st, ev) {
    var paths = fullPaths(m).map(function (p) {
      var last = null, at = null, port = null;
      for (var i = 0; i < p.length; i++) { if (!nodeHas(m, st, ev, p, i)) { at = p[i]; port = st.devices[at] ? nextPort(st, p, i) : null; break; } last = p[i]; }
      return { target: p[p.length - 1], nodes: p, side: sideOf(st, p), at: at, port: port, after: at ? last : p[p.length - 1], ok: !at };
    });
    var bad = paths.filter(function (x) { return !x.ok; }), good = paths.filter(function (x) { return x.ok; });
    if (!bad.length) return null;
    var s = bad[0], r = { at: s.at, port: s.port, after: s.after, target: s.target, side: s.side, paths: paths, okPaths: good.map(function (x) { return x.target; }) };
    if (good.length) { // 정상 경로와 공유하는 마지막 지점 = 좌우가 갈라지는 곳
      var g = good[0].nodes, k = 0; while (k < s.nodes.length && s.nodes[k] === g[k]) k++;
      r.divergeAt = k > 0 ? s.nodes[k - 1] : null; r.compareWith = good[0].target;
    }
    return r;
  }

  // ---------------------------------------------------------------------------
  // 세션: 기록·증거·힌트·점수
  function newSession(missionId, scenarioId) {
    var m = mission(missionId), sc = scenario(m, scenarioId);
    return { mission: missionId, scenario: scenarioId, state: startState(m, sc), log: [], evidence: {}, hints: 0, ops: [], unnecessary: 0, verifyFails: 0, answered: false, wrong: 0, done: false, version: 0, t0: Date.now(), result: null };
  }
  function runInspect(s, tool, target) {
    var m = mission(s.mission), r = inspect(m, s.state, tool, target, s.evidence);
    r.evidence.forEach(function (e) { if (!s.evidence[e.key]) s.evidence[e.key] = { label: e.label, at: s.log.length, version: s.version }; });
    s.log.push({ kind: 'inspect', tool: tool, target: target, title: r.title, status: r.status, lines: r.lines, meaning: r.meaning, next: r.next, evidence: r.evidence.map(function (e) { return e.key; }), version: s.version });
    return r;
  }
  function runOp(s, path, value) {
    var m = mission(s.mission), sc = scenario(m, s.scenario), before = assess(m, s.state), old = getPath(s.state, path);
    if (old === value) return { changed: false };
    setPath(s.state, path, value); s.version++;
    var after = assess(m, s.state), relevant = sc.fixPaths.indexOf(path) >= 0, normal = getPath(buildNormal(m), path);
    var deviates = typeof normal === 'number' ? Math.abs(value - normal) > 0.12 : value !== normal;
    var entry = { kind: 'op', path: path, from: old, to: value, relevant: relevant, version: s.version };
    if (!relevant) { s.unnecessary++; entry.unnecessary = true; }
    // 초급 설명: 증상 변화
    var bs = before.speakers.map(function (x) { return x.name + ' ' + GRADE_TEXT[x.grade]; }).join(', '), as = after.speakers.map(function (x) { return x.name + ' ' + GRADE_TEXT[x.grade]; }).join(', ');
    entry.effect = bs === as ? '증상 변화 없음 (' + as + ')' : bs + ' → ' + as;
    entry.note = !relevant && deviates ? '이 조작으로 정상 설정과 달라졌습니다. 고장과 관계없는 곳을 바꾸면 새 문제가 생길 수 있어요.' : !relevant ? '이 조작은 고장 원인과 관계없는 곳입니다(불필요한 조작으로 기록).' : '';
    s.ops.push(entry); s.log.push(entry);
    return { changed: true, entry: entry, after: after };
  }
  function submitAnswer(s, target, problem) {
    var m = mission(s.mission), sc = scenario(m, s.scenario), a = sc.answer, devOk = a.t.indexOf(target) >= 0, ok = devOk && a.k === problem;
    var tname = (s.state.devices[target] ? devName(m, target) : (cableById(s.state, target) || {}).label) || target;
    s.log.push({ kind: 'answer', target: target, targetName: tname, problem: problem, problemText: PROBLEMS[problem] || problem, ok: ok, devOk: devOk });
    if (ok) s.answered = true; else s.wrong = (s.wrong || 0) + 1;
    return { ok: ok, devOk: devOk, cause: ok ? sc.cause : null, clue: ok ? ((m.why || {})[sc.id] || '') : null };
  }
  function useHint(s) { var m = mission(s.mission), sc = scenario(m, s.scenario); if (s.hints >= 3) return null; s.hints++; s.log.push({ kind: 'hint', level: s.hints }); return sc.hints[s.hints - 1]; }
  function verify(s) {
    var m = mission(s.mission), sc = scenario(m, s.scenario), a = assess(m, s.state);
    s.log.push({ kind: 'verify', ok: a.ok, problems: a.problems });
    if (!a.ok) { s.verifyFails++; return { ok: false, assess: a }; }
    s.done = true;
    // 점수: 100 − 힌트 10/단계 − 불필요 조작 5/회(최대 30) − 검증 실패 10/회 − 원인 증거를 고치기 전에 찾지 못하면 20
    var firstFix = s.ops.filter(function (o) { return o.relevant; })[0], rootFound = sc.rootEvidence.filter(function (k) { return s.evidence[k]; });
    var diagnosedFirst = rootFound.length > 0 && firstFix && rootFound.some(function (k) { return s.evidence[k].at < s.log.indexOf(firstFix); });
    var answerMode = s.log.some(function (e) { return e.kind === 'answer'; });   // 원인 고르기 방식: 진단 = 정답 제출
    if (answerMode) diagnosedFirst = !!s.answered;
    var pen = { hints: s.hints * 10, unnecessary: Math.min(30, s.unnecessary * 5), verifyFails: s.verifyFails * 10, noDiagnosis: diagnosedFirst ? 0 : 20, wrongAnswers: Math.min(30, (s.wrong || 0) * 10) };
    var score = Math.max(0, 100 - pen.hints - pen.unnecessary - pen.verifyFails - pen.noDiagnosis - pen.wrongAnswers);
    s.result = { ok: true, score: score, penalties: pen, cause: sc.cause, fix: sc.fix, learn: m.learn, rootFound: rootFound.map(function (k) { return s.evidence[k].label; }), diagnosedFirst: diagnosedFirst,
      evidence: Object.keys(s.evidence).map(function (k) { return { key: k, label: s.evidence[k].label, root: sc.rootEvidence.indexOf(k) >= 0 }; }),
      fixes: s.ops.filter(function (o) { return o.relevant; }), unnecessaryOps: s.ops.filter(function (o) { return o.unnecessary; }), assess: a, hints: s.hints,
      why: (m.why || {})[sc.id] || '', core: m.core || [], quiz: m.quiz || null, nextMission: m.nextMission || null, apply: m.apply || '',
      wrongAnswers: s.wrong || 0, timeline: s.log.filter(function (e) { return e.kind === 'inspect' || e.kind === 'op' || e.kind === 'answer'; }).map(function (e) { var o = {}; Object.keys(e).forEach(function (k) { o[k] = e[k]; });
        if (e.kind === 'inspect') o.decisive = (e.evidence || []).some(function (k) { return sc.rootEvidence.indexOf(k) >= 0; }); return o; }) };
    return { ok: true, result: s.result, assess: a };
  }

  // 진행 단계 (사용자 행동만으로 계산 — 정답 여부를 미리 드러내지 않음)
  var STEPS = [['symptom', '증상 파악'], ['inspect', '장비 검사'], ['diagnose', '원인 진단'], ['repair', '복구'], ['verify', '최종 검증']];
  function progress(s) {
    var ins = s.log.filter(function (e) { return e.kind === 'inspect'; }), abn = ins.some(function (e) { return e.status === 'bad' || e.status === 'warn'; }),
      ops = s.log.some(function (e) { return e.kind === 'op'; }), done = [s.log.length > 0, ins.length > 0, abn, ops, !!s.done], cur = done.indexOf(false);
    return STEPS.map(function (x, i) { return { key: x[0], label: x[1], state: done[i] ? 'done' : i === cur ? 'current' : 'todo' }; });
  }

  var API = { NEG: NEG, TYPES: TYPES, CABLE_TYPES: CABLE_TYPES, MISSIONS: MISSIONS, TOOL_INFO: TOOL_INFO, GRADE_TEXT: GRADE_TEXT, CH_LABEL: CH_LABEL,
    mission: mission, scenario: scenario, buildNormal: buildNormal, startState: startState, evaluate: evaluate, inspect: inspect, toolsFor: toolsFor, opsFor: opsFor, assess: assess,
    getPath: getPath, setPath: setPath, fullPaths: fullPaths, signalStop: function (m, st) { return signalStop(m, st, evaluate(m, st)); }, cableById: cableById, cableAt: cableAt, inputChannel: inputChannel, devName: devName, portName: portName,
    newSession: newSession, submitAnswer: submitAnswer, answerTargets: answerTargets, PROBLEMS: PROBLEMS, progress: progress, STEPS: STEPS, runInspect: runInspect, runOp: runOp, useHint: useHint, verify: verify, levels: { gainDb: gainDb, faderDb: faderDb, attDb: attDb, panDb: panDb, grade: grade, dbTxt: dbTxt } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.PaTsEngine = API;
})(typeof window !== 'undefined' ? window : this);
