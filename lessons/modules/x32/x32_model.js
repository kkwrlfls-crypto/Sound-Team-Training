/* READY — X32Model (2026-11-08, 표면 작업자). 다른 작업자는 이 API 를 그대로 써도 돼요.
   =============================================================================
   window.X32Model — Behringer X32(풀사이즈) 콘솔 전체 상태와 규칙. 소리 처리는 없음.

   var m = X32Model.create(opts)        // opts: { stage: [...32] (선택, 무대 입력 예시 바꾸기) }
   m.state                              // 순수 객체(JSON 가능). 페이더 · 센드 dB 는 −90 이하 = −∞ (X32 OSC 와 같음)
   m.get(path)                          // 'ch.0.preamp.gain' · 'bus.2.fader' · 'main.st.fader' · 'routing.input.blocks.0' · 'screen.page'
   m.set(path, value, meta)             // 값 범위는 자동으로 맞춤(clamp). meta 예: { from:'surface' }. 바뀌면 알림
   m.on(fn) / m.off(fn)                 // fn(path, value, old, meta) — set 마다. restore()/loadScene() 뒤에는 path '*' 한 번
   m.batch(fn)                          // fn 안의 set 알림은 끝에 한꺼번에(같은 path 는 마지막 하나만)
   m.snapshot() / m.restore(obj)        // 믹서 부분(ch aux fxr bus mtx main dca muteGroups fx routing)만 — config · screen 은 빼요
   m.meters                             // 오디오 엔진이 덮어씀(dBFS, 소리 없으면 −Infinity). gr.ch = 컴프가 줄인 dB(양수), gate.ch = 게이트가 줄인 dB(0=열림)

   도움 함수(규칙):
   m.strip(type, i)       → 그 채널 객체(type: 'ch' 'aux' 'fxr' 'bus' 'mtx' 'main'(0=st,1=m) 'dca')
   m.label(type, i)       → LCD 에 쓸 이름(이름이 비면 X32 기본 이름 'Ch 21' 'MixBus 05' 처럼)
   m.shortId(type, i)     → 'CH 01' 'AUX 7' 'FX 1L' 'BUS 05' 'MTX 1' 'MAIN' 'M/C' 'DCA 1'
   m.layerItems(side)     → 지금 레이어가 맡은 것 [{type,index}|null] (left 16개, right 8개)
   m.select(type, i)      → config.selected 바꿈
   m.effMute(type, i)     → 뮤트 버튼 · 뮤트 그룹 · DCA 뮤트까지 따져서 소리가 꺼졌는지
   m.dcaOffset(type, i)   → 그 채널이 들어간 DCA 페이더 합(dB, −∞ 가능)
   m.anySolo()            → SOLO 가 하나라도 켜졌는지
   m.inputSource(ci)      → CH ci(0..31)의 소리가 실제로 어디서 오는지 { input(0..31), block, kind:'Local'|'AES50A'|'AES50B'|'Card', n(1..), live(bool) }
   m.estInput(ci)         → 교육용 추정 입력 크기(dBFS, 소리 파일 없이). 소리가 안 들어오면 −Infinity
   m.saveScene(i, name) / m.loadScene(i) / m.undoScene()
   X32Model.COLORS[16]    → { id:'RD', name, bg, fg, inv }   X32Model.faderToDb(0..1) / dbToFader(dB)  (X32 페이더 눈금)
   X32Model.INPUT_BLOCKS  → 입력 블록에 고를 수 있는 값 목록   X32Model.FX_TYPES → 이펙트 종류 목록
   X32Model.PAGES         → screen.page 값 목록(+ 'assign' 'recorder')   X32Model.HOME_TABS → HOME 의 screen.tab 번호 뜻 ['home','config','gate','dyn','eq','sends','main']
   screen.input (표면 → 화면, 알림만): { kind:'enc', index:0..5, delta:±1 } · { kind:'enc', index, press:true } · { kind:'page', dir:±1 } · { kind:'layer', dir:±1 }(화면 옆 LAYER ▲▼), 매번 seq 번호가 붙어요
   screen.modal: { kind:'name', type, index } — HOME config 탭에서 UTILITY 를 누르면(X32 처럼) 이름 · 색 · 아이콘 편집 창
   ============================================================================= */
(function () {
  'use strict';
  var NINF = -Infinity, OFFDB = -90;

  /* ---- X32 색(설명서: OFF RD GN YE BL MG CY WH, 뒤 8개는 반전 표시) ---- */
  var CBASE = [['OFF', '꺼짐', '#2b2d31'], ['RD', '빨강', '#ef4444'], ['GN', '초록', '#4ade80'], ['YE', '노랑', '#facc15'], ['BL', '파랑', '#60a5fa'], ['MG', '자주', '#e879f9'], ['CY', '하늘', '#22d3ee'], ['WH', '흰색', '#e5e7eb']];
  var COLORS = [];
  CBASE.forEach(function (c) { COLORS.push({ id: c[0], name: c[1], bg: c[2], fg: '#0b0c0e', inv: false }); });
  CBASE.forEach(function (c) { COLORS.push({ id: c[0] + 'i', name: c[1] + '(반전)', bg: '#0b0c0e', fg: c[0] === 'OFF' ? '#9ca3af' : c[2], inv: true }); });

  /* ---- X32 페이더 눈금(OSC 값 0..1 ↔ dB, 설명서 · OSC 문서와 같음): 0.75 = 0 dB, 1 = +10 dB, 0 = −∞ ---- */
  function faderToDb(f) { if (f <= 0) return NINF; if (f >= 0.5) return f * 40 - 30; if (f >= 0.25) return f * 80 - 50; if (f >= 0.0625) return f * 160 - 70; return f * 480 - 90; }
  function dbToFader(d) { if (d == null || !isFinite(d) || d <= OFFDB) return 0; if (d < -60) return (d + 90) / 480; if (d < -30) return (d + 70) / 160; if (d < -10) return (d + 50) / 80; return Math.min(1, (d + 30) / 40); }

  /* ---- 입력 블록(ROUTING > HOME 「Inputs 1-8 … 25-32」) ---- */
  var INPUT_BLOCKS = [];
  ['Local'].forEach(function (k) { for (var i = 0; i < 4; i++) INPUT_BLOCKS.push(k + ' ' + (i * 8 + 1) + '-' + (i * 8 + 8)); });
  ['AES50A', 'AES50B'].forEach(function (k) { for (var i = 0; i < 6; i++) INPUT_BLOCKS.push(k + ' ' + (i * 8 + 1) + '-' + (i * 8 + 8)); });
  for (var cb = 0; cb < 4; cb++) INPUT_BLOCKS.push('Card ' + (cb * 8 + 1) + '-' + (cb * 8 + 8));
  var AUX_BLOCKS = ['AUX 1-6 / USB 2', 'AUX 1-4 / USB 4', 'Card 1-8', 'AES50A 1-8', 'AES50B 1-8'];
  var FX_TYPES = ['Hall Reverb', 'Ambience', 'Rich Plate Reverb', 'Plate Reverb', 'Room Reverb', 'Chamber Reverb', 'Vintage Reverb', 'Stereo Delay', '3-Tap Delay', 'Stereo Chorus', 'Stereo Flanger', 'Stereo Phaser', 'Dual Graphic EQ', 'Stereo Graphic EQ', 'Dual DeEsser', 'Stereo Pitch', 'Tube Stage', 'Leisure Compressor'];
  var OUT_SOURCES = ['Off', 'Main L', 'Main R', 'M/C'].concat(range(16).map(function (i) { return 'MixBus ' + pad2(i + 1); }), range(6).map(function (i) { return 'Matrix ' + (i + 1); }), range(32).map(function (i) { return 'Ch ' + pad2(i + 1) + ' (Direct)'; }), ['Monitor L', 'Monitor R', 'Talkback']);

  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function psum(arr) { var p = 0; arr.forEach(function (d) { if (isFinite(d)) p += Math.pow(10, d / 10); }); return p > 0 ? 10 * Math.log10(p) : NINF; }

  /* ---- 교회 예배 예시: 무대 입력(Local 1..32) — [이름, 무엇이 꽂혔나, GAIN 0 dB 일 때 가장 큰 순간(dBFS), 콘덴서(48V 필요), 색 번호] ---- */
  var STAGE = [
    ['인도자', 'SM58', -48, 0, 6], ['싱어 1', 'SM58', -50, 0, 6], ['싱어 2', 'SM58', -50, 0, 6], ['A.기타', 'DI', -30, 0, 2],
    ['건반 L', 'DI', -20, 0, 2], ['건반 R', 'DI', -20, 0, 2], ['베이스', 'DI', -24, 0, 2], ['킥', '드럼 마이크', -38, 0, 2],
    ['스네어', '드럼 마이크', -36, 0, 2], ['하이햇', '콘덴서', -46, 1, 2], ['탐', '드럼 마이크', -40, 0, 2], ['OH L', '콘덴서', -44, 1, 2],
    ['OH R', '콘덴서', -44, 1, 2], ['E.기타', '앰프 마이크', -40, 0, 2], ['성가대 L', '콘덴서', -46, 1, 3], ['성가대 R', '콘덴서', -46, 1, 3],
    ['설교', '구즈넥 콘덴서', -45, 1, 5], ['사회', '무선 수신기', -26, 0, 5], ['영상 L', '노트북 (DI)', -18, 0, 7], ['영상 R', '노트북 (DI)', -18, 0, 7]
  ];
  while (STAGE.length < 32) STAGE.push(['', '(안 씀)', NINF, 0, 0]);
  var GAIN0 = { 1: 36, 2: 36, 3: 36, 4: 18, 5: 8, 6: 8, 7: 12, 8: 26, 9: 24, 10: 30, 11: 26, 12: 30, 13: 30, 14: 26, 15: 32, 16: 32, 17: 20, 18: 12, 19: 6, 20: 6 };
  var DCA0 = [['악기', [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 2], ['보컬', [1, 2, 3], 6], ['설교·사회', [17, 18], 5], ['성가대', [15, 16], 3]];
  var BUS0 = [['인도자 모니터', 'PRE', 1], ['싱어 모니터', 'PRE', 1], ['드럼 모니터', 'PRE', 1], ['방송·녹음', 'POST', 4]];
  var MG0 = [['밴드', [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]], ['보컬', [1, 2, 3]], ['설교·사회', [17, 18]], ['성가대', [15, 16]], ['영상', [19, 20]], ['', []]];

  function eqBands() {   // X32 채널 EQ 기본값(OSC 문서 기본): PEQ 124.7 Hz · PEQ 496.6 Hz · PEQ 1.97 kHz · HShv 10.02 kHz, Q 2
    return [{ type: 'PEQ', freq: 124.7, gain: 0, q: 2 }, { type: 'PEQ', freq: 496.6, gain: 0, q: 2 }, { type: 'PEQ', freq: 1970, gain: 0, q: 2 }, { type: 'HShv', freq: 10020, gain: 0, q: 2 }];
  }
  function dynDef(on, thr) { return { on: !!on, mode: 'COMP', thr: thr == null ? 0 : thr, ratio: 3, knee: 2, attack: 10, hold: 10, release: 100, gain: 0, auto: false, det: 'PEAK', env: 'LOG', keySrc: 'SELF', filter: { on: false, type: '3.0', freq: 1000 }, mix: 100 }; }
  function gateDef(on, thr) { return { on: !!on, mode: 'GATE', thr: thr == null ? -80 : thr, range: 60, attack: 0.5, hold: 50, release: 200, keySrc: 'SELF', filter: { on: false, type: '3.0', freq: 1000 } }; }
  function sendsDef(levels, taps) { return range(16).map(function (b) { return { on: true, level: levels && levels[b] != null ? levels[b] : OFFDB, pan: 0, tap: taps && taps[b] || 'POST' }; }); }
  function inChan(o) {   // 입력 채널(ch · aux · fxr) 하나
    return { name: o.name || '', color: o.color || 0, icon: o.icon || 1, source: o.source == null ? 0 : o.source,
      preamp: { gain: o.gain || 0, trim: 0, phantom: !!o.phantom, invert: false, lowcut: { on: !!o.lc, freq: o.lcf || 100 }, delay: { on: false, ms: 0.3 } },
      gate: gateDef(o.gate, o.gthr), dyn: dynDef(o.dyn, o.dthr), insert: { on: false, pos: 'POST', sel: 'OFF' },
      eq: { on: true, bands: eqBands('ch') }, sends: sendsDef(o.sends, o.taps),
      main: { st: o.st !== false, mono: false, mlevel: OFFDB, pan: o.pan || 0 },
      mute: !!o.mute, solo: false, fader: o.fader == null ? OFFDB : o.fader, dca: range(8).map(function (k) { return (o.dca || []).indexOf(k) >= 0; }), muteGrp: range(6).map(function (k) { return (o.mg || []).indexOf(k) >= 0; }) };
  }
  function outChan(o) {
    return { name: o.name || '', color: o.color || 0, icon: 1, mute: !!o.mute, solo: false, fader: o.fader == null ? 0 : o.fader, pan: 0, stereoLinkWithNext: false,
      eq: { on: true, mode: 'PEQ', bands: eqBands('bus').concat([{ type: 'PEQ', freq: 5000, gain: 0, q: 2 }, { type: 'HShv', freq: 12000, gain: 0, q: 2 }]).slice(0, 6) }, dyn: dynDef(false, 0), insert: { on: false, pos: 'POST', sel: 'OFF' },
      main: { st: !!o.st, mono: false, mlevel: OFFDB, pan: 0 }, mtxSends: range(6).map(function () { return { on: true, level: OFFDB, pan: 0, tap: 'POST' }; }), dca: range(8).map(function () { return false; }), muteGrp: range(6).map(function () { return false; }) };
  }

  function defaultState(stage) {
    var dcaOf = function (n) { var a = []; DCA0.forEach(function (d, k) { if (d[1].indexOf(n) >= 0) a.push(k); }); return a; };
    var mgOf = function (n) { var a = []; MG0.forEach(function (g, k) { if (g[1].indexOf(n) >= 0) a.push(k); }); return a; };
    var ch = stage.map(function (s, i) {
      var n = i + 1, used = isFinite(s[2]);
      var sends = []; sends[0] = n === 1 ? OFFDB : n <= 3 ? -8 : OFFDB; sends[1] = n <= 3 ? -4 : OFFDB; sends[2] = n >= 7 && n <= 13 ? -6 : OFFDB; sends[3] = used ? -10 : OFFDB;
      sends[12] = n <= 3 || n === 15 || n === 16 ? -12 : OFFDB;   // BUS 13 → FX1 리버브
      return inChan({ name: s[0], color: s[4], icon: s[3] ? 20 : 1, source: i, gain: GAIN0[n] || 0, phantom: !!s[3] && n !== 17, lc: [1, 2, 3, 15, 16, 18].indexOf(n) >= 0, lcf: n === 17 ? 40 : 100,
        gate: [8, 9, 11].indexOf(n) >= 0, gthr: -50, dyn: [1, 2, 3, 7].indexOf(n) >= 0, dthr: -20, sends: sends, taps: ['PRE', 'PRE', 'PRE', 'POST'],
        st: used, pan: n === 19 ? -100 : n === 20 ? 100 : n === 12 ? -60 : n === 13 ? 60 : n === 5 ? -100 : n === 6 ? 100 : 0, mute: !used, fader: !used ? OFFDB : n === 17 ? 0 : -5, dca: dcaOf(n), mg: mgOf(n) });
    });
    var aux = range(8).map(function (i) { return inChan({ name: i < 6 ? '' : (i === 6 ? 'USB L' : 'USB R'), color: 0, source: 32 + i, st: true, mute: false, fader: OFFDB, pan: i === 6 ? -100 : i === 7 ? 100 : 0 }); });
    var fxr = range(8).map(function (i) { return inChan({ name: i < 2 ? (i ? '리버브 R' : '리버브 L') : '', color: i < 2 ? 4 : 0, source: 40 + i, st: true, mute: false, fader: i < 2 ? -5 : OFFDB, pan: i % 2 ? 100 : -100 }); });
    fxr.forEach(function (c) { c.preamp.gain = 0; });
    var bus = range(16).map(function (i) {
      var b = BUS0[i]; var o = outChan({ name: b ? b[0] : (i === 12 ? 'FX1 리버브' : ''), color: b ? b[2] : i === 12 ? 4 : 0, fader: b || i === 12 ? 0 : OFFDB });
      return o;
    });
    var mtx = range(6).map(function () { var o = outChan({ fader: OFFDB }); delete o.main; delete o.mtxSends; delete o.dca; return o; });
    var mst = outChan({ name: 'Main LR', color: 7, fader: 0 }); delete mst.main; delete mst.dca;
    var mm = outChan({ name: 'M/C', color: 7, fader: OFFDB }); delete mm.main; delete mm.dca;
    return {
      ch: ch, aux: aux, fxr: fxr, bus: bus, mtx: mtx, main: { st: mst, m: mm },
      dca: range(8).map(function (k) { var d = DCA0[k]; return { name: d ? d[0] : '', color: d ? d[2] : 0, fader: 0, mute: false, solo: false }; }),
      muteGroups: range(6).map(function (k) { return { on: false, name: MG0[k][0] }; }),
      fx: range(8).map(function (k) {
        var t = ['Hall Reverb', 'Plate Reverb', 'Stereo Delay', 'Stereo Chorus', 'Dual Graphic EQ', 'Dual Graphic EQ', 'Dual DeEsser', 'Dual DeEsser'][k];
        return { type: t, source: k < 4 ? { l: 'MixBus ' + (13 + k), r: 'MixBus ' + (13 + k) } : { l: 'INS', r: 'INS' }, params: fxParams(t), 'return': k < 4 ? k * 2 : null };
      }),
      routing: {
        input: { blocks: ['Local 1-8', 'Local 9-16', 'Local 17-24', 'Local 25-32'], aux: 'AUX 1-6 / USB 2' },
        output: {
          local: range(16).map(function (i) { return { src: i < 14 ? 'MixBus ' + pad2(i + 1) : i === 14 ? 'Main L' : 'Main R', tap: 'POST' }; }),
          aux: range(6).map(function (i) { return { src: 'MixBus ' + pad2(i + 1), tap: 'POST' }; }),
          aes50a: range(48).map(function (i) { return { src: i < 16 ? 'Out ' + (i + 1) : 'Off' }; }),
          aes50b: range(48).map(function () { return { src: 'Off' }; }),
          card: ['Local 1-8', 'Local 9-16', 'Local 17-24', 'Local 25-32'],
          p16: range(16).map(function (i) { return { src: 'Ch ' + pad2(i + 1), tap: 'POST' }; }),
          usbRec: { l: 'Main L', r: 'Main R' }
        },
        aes50: { a: { connected: false, device: '' }, b: { connected: false, device: '' } },
        card: { type: 'X-USB', connected: true }
      },
      config: {
        layer: { left: 'ch1-16', right: 'dca' }, selected: { type: 'ch', index: 0 }, sendsOnFader: false, sofTarget: null, flip: false,
        solo: { mode: 'PFL', dimSolo: true, exclusive: false }, monitor: { level: -20, phones: -20, source: 'Main LR', mono: false, dim: false, dimAtt: -20 },
        talkback: { a: false, b: false, level: -20, destA: 'MixBus 01-02', destB: 'Main LR', latch: true },
        assign: { set: 'A', sets: { A: assignSet('A'), B: assignSet('B'), C: assignSet('C') } },
        scenes: { list: [{ name: '주일 1부 예배', data: null }, { name: '주일 2부 예배', data: null }, { name: '수요 예배', data: null }], current: 0, next: 0, dirty: false, canUndo: false },
        usb: { recording: false, playing: false, file: '' },
        lcd: { brightness: 50, contrast: 50 }, view: { eqBand: 3, sendBank: 0, mlevSel: 'mono' }, mutePageMode: false, sel: true
      },
      screen: { page: 'home', tab: 0, focus: 0, modal: null, input: null }
    };
  }
  function assignSet(k) {
    var labels = { A: ['FX1 리버브 양', 'FX2 양', 'FX3 딜레이 양', '모니터 레벨'], B: ['CH1 GAIN', 'CH17 GAIN', 'BUS 1 레벨', 'MAIN 레벨'], C: ['', '', '', ''] };
    var tgt = { A: ['fx.0.params.mix', 'fx.1.params.mix', 'fx.2.params.mix', 'config.monitor.level'], B: ['ch.0.preamp.gain', 'ch.16.preamp.gain', 'bus.0.fader', 'main.st.fader'], C: ['', '', '', ''] };
    var bl = { A: ['MUTE GRP 1', 'MUTE GRP 2', 'TAP TEMPO', 'SCENE NEXT', 'SCENE PREV', 'TALK A', 'TALK B', 'MON DIM'], B: ['CH 1 MUTE', 'CH 17 MUTE', 'BUS 1 MUTE', 'FX1 RTN MUTE', '', '', '', ''], C: ['', '', '', '', '', '', '', ''] };
    var bt = { A: ['muteGroups.0.on', 'muteGroups.1.on', 'tap:2', 'scene:next', 'scene:prev', 'config.talkback.a', 'config.talkback.b', 'config.monitor.dim'], B: ['ch.0.mute', 'ch.16.mute', 'bus.0.mute', 'fxr.0.mute', '', '', '', ''], C: ['', '', '', '', '', '', '', ''] };
    return { knobs: range(4).map(function (i) { return { label: labels[k][i], target: tgt[k][i] }; }), buttons: range(8).map(function (i) { return { label: bl[k][i], target: bt[k][i] }; }) };
  }
  function fxParams(t) {
    if (/Reverb|Ambience/.test(t)) return { predelay: 20, decay: 2.2, size: 60, damping: 6000, lowcut: 100, hicut: 10000, mix: 100 };
    if (/Delay/.test(t)) return { time: 375, factorL: '1/4', factorR: '3/8', feedback: 30, lowcut: 100, hicut: 8000, mix: 100 };
    if (/Chorus|Flanger|Phaser/.test(t)) return { speed: 0.5, depth: 40, delay: 10, mix: 50 };
    if (/Graphic EQ/.test(t)) return { bands: range(31).map(function () { return 0; }), mix: 100 };
    if (/DeEsser/.test(t)) return { lo: 0, hi: 0, mix: 100 };
    return { mix: 100 };
  }

  /* ---- 값 범위(설명서) ---- */
  // 화면 페이지(메뉴 단추 8개 + VIEW 단추로 여는 페이지). HOME 페이지 탭 번호 = HOME_TABS 순서(입력 채널 기준, X32 설명서 순서)
  var PAGES = ['home', 'meters', 'routing', 'setup', 'library', 'effects', 'mutegrp', 'utility', 'scenes', 'monitor', 'assign', 'recorder'];
  var HOME_TABS = ['home', 'config', 'gate', 'dyn', 'eq', 'sends', 'main'];
  var GATE_MODES = ['EXP2', 'EXP3', 'EXP4', 'GATE', 'DUCK'], DYN_MODES = ['COMP', 'EXP'], RATIOS = [1.1, 1.3, 1.5, 2, 2.5, 3, 4, 5, 7, 10, 20, 100];
  var EQ_TYPES = ['LCut', 'LShv', 'PEQ', 'VEQ', 'HShv', 'HCut'], TAPS = ['IN', 'PRE EQ', 'POST EQ', 'PRE', 'POST', 'GRP'];
  function num(lo, hi, step) { return function (v) { v = +v; if (isNaN(v)) return lo; v = clamp(v, lo, hi); if (step) v = Math.round(v / step) * step; return +v.toFixed(4); }; }
  function db(lo, hi) { return function (v) { v = +v; if (isNaN(v) || v === NINF || v <= OFFDB) return OFFDB; return Math.round(clamp(v, OFFDB, hi) * 100) / 100; }; }
  function oneOf(list) { return function (v) { return list.indexOf(v) >= 0 ? v : list[0]; }; }
  function nearest(list) { return function (v) { v = +v; var b = list[0]; list.forEach(function (x) { if (Math.abs(x - v) < Math.abs(b - v)) b = x; }); return b; }; }
  var RULES = [
    [/^(ch|aux|fxr)\.\d+\.preamp\.gain$/, num(-12, 60, 0.25)], [/\.preamp\.trim$/, num(-18, 18, 0.25)], [/\.preamp\.lowcut\.freq$/, num(20, 400, 1)], [/\.preamp\.delay\.ms$/, num(0.3, 500, 0.1)],
    [/\.gate\.thr$/, num(-80, 0, 0.5)], [/\.gate\.range$/, num(3, 60, 1)], [/\.gate\.attack$/, num(0, 120, 0.5)], [/\.(gate|dyn)\.hold$/, num(0.02, 2000, 0.01)], [/\.(gate|dyn)\.release$/, num(5, 4000, 1)], [/\.gate\.mode$/, oneOf(GATE_MODES)],
    [/\.dyn\.thr$/, num(-60, 0, 0.5)], [/\.dyn\.ratio$/, nearest(RATIOS)], [/\.dyn\.knee$/, num(0, 5, 1)], [/\.dyn\.attack$/, num(0, 120, 1)], [/\.dyn\.gain$/, num(0, 24, 0.5)], [/\.dyn\.mode$/, oneOf(DYN_MODES)], [/\.dyn\.det$/, oneOf(['PEAK', 'RMS'])], [/\.dyn\.env$/, oneOf(['LOG', 'LIN'])], [/\.dyn\.mix$/, num(0, 100, 5)],
    [/\.eq\.bands\.\d+\.freq$/, num(20, 20000, 0.1)], [/\.eq\.bands\.\d+\.gain$/, num(-15, 15, 0.25)], [/\.eq\.bands\.\d+\.q$/, num(0.3, 10, 0.1)], [/\.eq\.bands\.\d+\.type$/, oneOf(EQ_TYPES)],
    [/\.sends\.\d+\.level$/, db(OFFDB, 10)], [/\.sends\.\d+\.pan$/, num(-100, 100, 2)], [/\.sends\.\d+\.tap$/, oneOf(TAPS)], [/\.mtxSends\.\d+\.level$/, db(OFFDB, 10)],
    [/\.main\.mlevel$/, db(OFFDB, 10)], [/\.(main\.)?pan$/, num(-100, 100, 2)], [/\.fader$/, db(OFFDB, 10)], [/\.color$/, num(0, 15, 1)], [/\.name$/, function (v) { return String(v == null ? '' : v).slice(0, 12); }],
    [/^config\.monitor\.(level|phones)$/, db(OFFDB, 10)], [/^config\.talkback\.level$/, db(OFFDB, 10)], [/^config\.monitor\.dimAtt$/, num(-40, 0, 1)],
    [/^routing\.input\.blocks\.\d$/, oneOf(INPUT_BLOCKS)], [/^routing\.input\.aux$/, oneOf(AUX_BLOCKS)], [/^config\.layer\.left$/, oneOf(['ch1-16', 'ch17-32', 'aux-fx', 'bus1-8', 'bus9-16'])], [/^config\.layer\.right$/, oneOf(['dca', 'bus1-8', 'bus9-16', 'mtx-main', 'user'])],
    [/^screen\.page$/, oneOf(PAGES)]
  ];
  var MIXER_KEYS = { ch: 1, aux: 1, fxr: 1, bus: 1, mtx: 1, main: 1, dca: 1, muteGroups: 1, fx: 1, routing: 1 };

  function create(opts) {
    opts = opts || {};
    var stage = (opts.stage || STAGE).map(function (s) { return s.slice(); });
    var state = defaultState(stage), subs = [], batching = 0, queue = [], undoSnap = null;
    var meters = { ch: fill(32), aux: fill(8), fxr: fill(8), bus: fill(16), mtx: fill(6), main: { l: NINF, r: NINF, m: NINF }, mon: { l: NINF, r: NINF }, gr: { ch: fill(32, 0), bus: fill(16, 0) }, gate: { ch: fill(32, 0) }, solo: { l: NINF, r: NINF } };
    function fill(n, v) { return range(n).map(function () { return v == null ? NINF : v; }); }
    function parts(p) { return Array.isArray(p) ? p : String(p).split('.').filter(function (x) { return x !== ''; }); }
    function get(path) { var o = state, a = parts(path); for (var i = 0; i < a.length; i++) { if (o == null) return undefined; o = o[a[i]]; } return o; }
    function emit(path, v, old, meta) { if (batching) { queue.push([path, v, old, meta]); return; } subs.slice().forEach(function (fn) { try { fn(path, v, old, meta || {}); } catch (e) { if (window.console) console.error('X32Model listener', e); } }); }
    function set(path, value, meta) {
      var a = parts(path), key = a.join('.'); if (!a.length) return;
      var o = state; for (var i = 0; i < a.length - 1; i++) { if (o[a[i]] == null) o[a[i]] = /^\d+$/.test(a[i + 1]) ? [] : {}; o = o[a[i]]; }
      var last = a[a.length - 1], old = o[last];
      if (typeof value === 'number' || typeof value === 'string') RULES.some(function (r) { if (r[0].test(key)) { value = r[1](value); return true; } return false; });
      if (value !== null && typeof value === 'object') value = clone(value);
      if (key !== 'screen.input' && typeof value !== 'object' && old === value) return;
      o[last] = value;
      if (MIXER_KEYS[a[0]] && !(meta && meta.scene) && state.config.scenes && !state.config.scenes.dirty) { state.config.scenes.dirty = true; emit('config.scenes.dirty', true, false, meta); }
      emit(key, value, old, meta);
    }
    function batch(fn) {
      batching++; try { fn(); } finally {
        batching--;
        if (!batching && queue.length) { var q = queue, seen = {}; queue = []; var out = []; for (var i = q.length - 1; i >= 0; i--) { if (seen[q[i][0]]) continue; seen[q[i][0]] = 1; out.unshift(q[i]); } out.forEach(function (e) { emit(e[0], e[1], e[2], e[3]); }); }
      }
    }
    function snapshot() { var s = {}; Object.keys(MIXER_KEYS).forEach(function (k) { s[k] = clone(state[k]); }); return s; }
    function restore(obj, meta) { if (!obj) return; Object.keys(MIXER_KEYS).forEach(function (k) { if (obj[k] != null) state[k] = clone(obj[k]); }); emit('*', state, null, meta || {}); }

    function strip(type, i) { if (type === 'main') return i === 1 ? state.main.m : state.main.st; var arr = state[type]; return arr ? arr[i] : null; }
    function shortId(type, i) {
      return type === 'ch' ? 'CH ' + pad2(i + 1) : type === 'aux' ? (i < 6 ? 'AUX ' + (i + 1) : 'USB ' + (i === 6 ? 'L' : 'R')) : type === 'fxr' ? 'FX ' + (Math.floor(i / 2) + 1) + (i % 2 ? 'R' : 'L') :
        type === 'bus' ? 'BUS ' + pad2(i + 1) : type === 'mtx' ? 'MTX ' + (i + 1) : type === 'main' ? (i === 1 ? 'M/C' : 'MAIN') : type === 'dca' ? 'DCA ' + (i + 1) : '';
    }
    function label(type, i) {
      var s = strip(type, i), n = s && s.name; if (n) return n;
      return type === 'ch' ? 'Ch ' + pad2(i + 1) : type === 'aux' ? (i < 6 ? 'Aux ' + (i + 1) : 'USB ' + (i === 6 ? 'L' : 'R')) : type === 'fxr' ? 'FxRtn ' + (Math.floor(i / 2) + 1) + (i % 2 ? 'R' : 'L') :
        type === 'bus' ? 'MixBus ' + pad2(i + 1) : type === 'mtx' ? 'Matrix ' + (i + 1) : type === 'main' ? (i === 1 ? 'M/C' : 'LR') : type === 'dca' ? 'DCA ' + (i + 1) : '';
    }
    function layerItems(side) {
      var L = state.config.layer, out = [], i;
      if (side === 'left') {
        if (L.left === 'ch1-16') for (i = 0; i < 16; i++) out.push({ type: 'ch', index: i });
        else if (L.left === 'ch17-32') for (i = 0; i < 16; i++) out.push({ type: 'ch', index: 16 + i });
        else if (L.left === 'aux-fx') for (i = 0; i < 16; i++) out.push(i < 8 ? { type: 'aux', index: i } : { type: 'fxr', index: i - 8 });
        else if (L.left === 'bus1-8' || L.left === 'bus9-16') for (i = 0; i < 16; i++) out.push({ type: 'bus', index: i });   // BUS MASTER: 16개 버스
        return out;
      }
      if (L.right === 'dca') for (i = 0; i < 8; i++) out.push({ type: 'dca', index: i });
      else if (L.right === 'bus1-8') for (i = 0; i < 8; i++) out.push({ type: 'bus', index: i });
      else if (L.right === 'bus9-16') for (i = 0; i < 8; i++) out.push({ type: 'bus', index: 8 + i });
      else if (L.right === 'mtx-main') { for (i = 0; i < 6; i++) out.push({ type: 'mtx', index: i }); out.push({ type: 'main', index: 1 }); out.push(null); }
      else for (i = 0; i < 8; i++) out.push(null);
      return out;
    }
    function select(type, i) { set('config.selected', { type: type, index: i }); }
    function inDca(s) { return s && s.dca ? s.dca : []; }
    function dcaOffset(type, i) { var s = strip(type, i), d = 0; inDca(s).forEach(function (on, k) { if (on) { var f = state.dca[k].fader; d += f <= OFFDB ? NINF : f; } }); return d; }
    function effMute(type, i) {
      var s = strip(type, i); if (!s) return false; if (s.mute) return true;
      if (s.muteGrp && s.muteGrp.some(function (on, k) { return on && state.muteGroups[k].on; })) return true;
      if (inDca(s).some(function (on, k) { return on && state.dca[k].mute; })) return true;
      return false;
    }
    function anySolo() { var any = false; ['ch', 'aux', 'fxr', 'bus', 'mtx', 'dca'].forEach(function (t) { state[t].forEach(function (s) { if (s.solo) any = true; }); }); if (state.main.st.solo || state.main.m.solo) any = true; return any; }
    function inputSource(ci) {
      var c = state.ch[ci], src = c ? c.source : ci; if (src == null || src < 0 || src > 31) return { input: src, block: null, kind: 'Other', n: 0, live: false };
      var blk = state.routing.input.blocks[Math.floor(src / 8)] || '', m = blk.match(/^(Local|AES50A|AES50B|Card) (\d+)-/), kind = m ? m[1] : 'Off', n = m ? +m[2] + (src % 8) : 0;
      var live = kind === 'Local' ? true : kind === 'AES50A' ? !!state.routing.aes50.a.connected : kind === 'AES50B' ? !!state.routing.aes50.b.connected : kind === 'Card' ? false : false;
      return { input: src, block: blk, kind: kind, n: n, live: live && kind === 'Local' ? true : live };
    }
    function estInput(ci) {   // 무대 Local n 의 예시 소리가 이 채널로 들어오면(라우팅 · 48V · GAIN) 가장 큰 순간 dBFS
      var c = state.ch[ci]; if (!c) return NINF; var s = inputSource(ci); if (!s.live || s.kind !== 'Local') return NINF;
      var st = stage[s.n - 1]; if (!st || !isFinite(st[2])) return NINF; if (st[3] && !c.preamp.phantom) return NINF;
      return st[2] + c.preamp.gain + c.preamp.trim;
    }
    function saveScene(i, name) { var L = state.config.scenes.list; while (L.length <= i) L.push({ name: '', data: null }); L[i] = { name: name != null ? String(name) : (L[i].name || ''), data: snapshot() }; state.config.scenes.dirty = false; emit('config.scenes', state.config.scenes, null, {}); }
    function loadScene(i) {
      var sc = state.config.scenes.list[i]; if (!sc || !sc.data) return false;
      undoSnap = snapshot(); restore(sc.data, { scene: true });
      batch(function () { set('config.scenes.current', i, { scene: true }); set('config.scenes.dirty', false, { scene: true }); set('config.scenes.canUndo', true, { scene: true }); });
      return true;
    }
    function undoScene() { if (!undoSnap) return false; var u = undoSnap; undoSnap = null; restore(u, { scene: true }); batch(function () { set('config.scenes.dirty', true, { scene: true }); set('config.scenes.canUndo', false, { scene: true }); }); return true; }
    // 처음 씬 3개 = 처음 상태
    var first = snapshot(); state.config.scenes.list.forEach(function (s) { s.data = clone(first); });

    return {
      state: state, meters: meters, stage: stage, get: get, set: set, on: function (fn) { if (subs.indexOf(fn) < 0) subs.push(fn); }, off: function (fn) { subs = subs.filter(function (f) { return f !== fn; }); },
      batch: batch, snapshot: snapshot, restore: restore, strip: strip, label: label, shortId: shortId, layerItems: layerItems, select: select,
      dcaOffset: dcaOffset, effMute: effMute, anySolo: anySolo, inputSource: inputSource, estInput: estInput, saveScene: saveScene, loadScene: loadScene, undoScene: undoScene,
      psum: psum
    };
  }

  window.X32Model = { create: create, COLORS: COLORS, faderToDb: faderToDb, dbToFader: dbToFader, INPUT_BLOCKS: INPUT_BLOCKS, AUX_BLOCKS: AUX_BLOCKS, FX_TYPES: FX_TYPES, OUT_SOURCES: OUT_SOURCES,
    PAGES: PAGES, HOME_TABS: HOME_TABS, GATE_MODES: GATE_MODES, DYN_MODES: DYN_MODES, RATIOS: RATIOS, EQ_TYPES: EQ_TYPES, TAPS: TAPS, OFF_DB: OFFDB, STAGE: STAGE, version: 1 };
})();
